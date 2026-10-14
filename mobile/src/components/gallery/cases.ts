import type { ComponentType } from "react";
import Activity from "@/app/activity";
import ForgotPassword from "@/app/forgot-password";
import Home from "@/app/home";
import Welcome from "@/app/index";
import Login from "@/app/login/index";
import LoginMfa from "@/app/login/mfa";
import Profile from "@/app/profile/index";
import ProfileAccount from "@/app/profile/account";
import ProfilePreferences from "@/app/profile/preferences";
import ProfileSecurity from "@/app/profile/security";
import Biometrics from "@/app/security/biometrics";
import ForgotCode from "@/app/security/forgot-code";
import UnlockCode from "@/app/security/unlock-code";
import SessionExpired from "@/app/session-expired";
import SignUp from "@/app/signup/index";
import SignUpPassword from "@/app/signup/password";
import RecoveryCodes from "@/app/signup/recovery-codes";
import SecureAccount from "@/app/signup/secure";
import VerifyEmail from "@/app/signup/verify-email";
import Unlock from "@/app/unlock";
import AddressScreen from "@/app/verify/address";
import ConfirmIdentity from "@/app/verify/identity/confirm";
import Identity from "@/app/verify/identity/index";
import VerifyIntro from "@/app/verify/index";
import Selfie from "@/app/verify/selfie";
import VerificationStatus from "@/app/verify/status";
import { ADDRESS_REJECTION, DEMO_IDENTITY, identityFailure } from "@/lib/api";
import { defaultScenarios, emptyKyc, type Account, type Address, type Kyc, type Scenarios, type State } from "@/lib/store";

export type GalleryCase = {
  name: string;
  Screen: ComponentType;
  state?: Partial<Pick<State, "account" | "session" | "kyc" | "scenarios" | "hideBalances">>;
  params?: Record<string, string>;
  seed?: Record<string, unknown>;
  /** Dark in both themes (welcome hero, camera), so the phone's status bar stays light. */
  alwaysDark?: boolean;
};

export type Flow = { title: string; summary: string; cases: GalleryCase[] };

// ---------- Demo customer ----------

const EMAIL = "adaeze@payzentra.com";
const PASSWORD = "Payzentra#2026";

const account = (patch: Partial<Account> = {}): Account => ({
  email: EMAIL,
  password: PASSWORD,
  emailVerified: true,
  unlockCode: "480913",
  unlockFailures: 0,
  biometrics: false,
  passkey: false,
  totpSecret: null,
  mfaEnabled: false,
  recoveryCodes: [],
  recoveryCodesSaved: false,
  ...patch,
});

const scenarios = (patch: Partial<Scenarios>): Scenarios => ({ ...defaultScenarios, ...patch });

const SIGNED_IN = { authenticated: true, mfaVerified: true, unlocked: true };
const APP_LOCKED = { authenticated: true, mfaVerified: true, unlocked: false };
const SIGNED_OUT = { authenticated: false, mfaVerified: false, unlocked: false };

const RECOVERY_CODES = ["k7mp-2xq9", "h4rt-8nwe", "c2vy-6fjd", "p9za-3kms", "w5be-7tqx", "n8gu-4rhc", "d3xk-9vpa", "y6mf-2ezt", "t4qs-8jwn", "r7cd-5hkb"];
const TOTP_SETUP = {
  secret: "JBSWY3DPEHPK3PXPKZXW6YTBNRSGK4TF",
  uri: `otpauth://totp/Payzentra:${encodeURIComponent(EMAIL)}?secret=JBSWY3DPEHPK3PXPKZXW6YTBNRSGK4TF&issuer=Payzentra&digits=6&period=30`,
};

const ADDRESS: Address = { line1: "14 Admiralty Way", line2: "Flat 3B", city: "Lekki", lga: "Eti-Osa", state: "Lagos", postcode: "106104" };

const kycFetched: Kyc = { ...emptyKyc, idType: "BVN", idNumber: "22412345678", consentAt: "2026-10-14T09:00:00.000Z", identity: DEMO_IDENTITY };
const kycConfirmed: Kyc = { ...kycFetched, identityConfirmed: true };
const kycSelfieDone: Kyc = { ...kycConfirmed, livenessAttempts: 1, livenessPassed: true };
const kycSubmitted: Kyc = { ...kycSelfieDone, address: ADDRESS };
const kycPending: Kyc = { ...kycSubmitted, status: "pending" };
const kycVerified: Kyc = { ...kycSubmitted, status: "verified" };
const kycRejected: Kyc = { ...kycSubmitted, status: "rejected", rejectionReason: ADDRESS_REJECTION };
const kycSelfieReview: Kyc = { ...kycConfirmed, livenessAttempts: 3, livenessLocked: true, status: "pending" };

const newSignup = { account: account({ password: null, emailVerified: false, unlockCode: null }), session: SIGNED_IN };
const emailVerified = { account: account({ password: null, unlockCode: null }), session: SIGNED_IN };
const passwordSet = { account: account({ unlockCode: null }), session: SIGNED_IN };
const inApp = { account: account(), session: SIGNED_IN };
const appLocked = { account: account(), session: APP_LOCKED, kyc: kycVerified };
const signedOut = { account: account({ unlockCode: null }), session: SIGNED_OUT };
const verified = { ...inApp, kyc: kycVerified };

const codeError = (code: string, message: string, attemptsLeft?: number) => ({ code, message, attemptsLeft });

// ---------- Flows, in journey order ----------

export const FLOWS: Flow[] = [
  {
    title: "Welcome",
    summary: "First open. Three story slides, then sign up or log in.",
    cases: [
      { name: "Slide 1 · One wallet", Screen: Welcome, seed: { page: 0 }, alwaysDark: true },
      { name: "Slide 2 · Crypto", Screen: Welcome, seed: { page: 1 }, alwaysDark: true },
      { name: "Slide 3 · Security", Screen: Welcome, seed: { page: 2 }, alwaysDark: true },
    ],
  },
  {
    title: "Sign up · Email",
    summary: "Step 1 of sign-up: email only. A code confirms it before a password is set.",
    cases: [
      { name: "Empty", Screen: SignUp },
      { name: "Email entered", Screen: SignUp, seed: { email: EMAIL } },
      { name: "Invalid email", Screen: SignUp, seed: { email: "adaeze@payzentra", submitted: true } },
      { name: "Email already registered", Screen: SignUp, seed: { email: EMAIL, duplicate: "An account with this email already exists. Log in or reset your password instead." } },
    ],
  },
  {
    title: "Sign up · Verify email",
    summary: "Step 2: the 6-digit code sent to the email. Codes expire after 10 minutes.",
    cases: [
      { name: "Enter code", Screen: VerifyEmail, state: newSignup },
      { name: "Code entered", Screen: VerifyEmail, state: newSignup, seed: { code: "123456" } },
      { name: "Resend available", Screen: VerifyEmail, state: newSignup, seed: { sentSecondsAgo: 75 } },
      { name: "Wrong code", Screen: VerifyEmail, state: newSignup, seed: { error: codeError("INVALID", "That code isn't right.", 4) } },
      { name: "Code expired", Screen: VerifyEmail, state: newSignup, seed: { error: codeError("EXPIRED", "This code has expired. Request a new one.") } },
      { name: "Too many attempts", Screen: VerifyEmail, state: newSignup, seed: { error: codeError("LOCKED", "Too many incorrect attempts. Request a new code to try again.", 0) } },
      { name: "Email verified", Screen: VerifyEmail, state: newSignup, seed: { done: true } },
    ],
  },
  {
    title: "Sign up · Create password",
    summary: "Step 3: password and confirmation, with live requirement checks and terms.",
    cases: [
      { name: "Empty", Screen: SignUpPassword, state: emailVerified },
      { name: "Requirements met", Screen: SignUpPassword, state: emailVerified, seed: { password: PASSWORD, confirm: PASSWORD, terms: true } },
      { name: "Weak password", Screen: SignUpPassword, state: emailVerified, seed: { password: "payzen", submitted: true } },
      { name: "Passwords don't match", Screen: SignUpPassword, state: emailVerified, seed: { password: PASSWORD, confirm: "Payzentra#2025", terms: true } },
    ],
  },
  {
    title: "Unlock code",
    summary: "Step 4: the 6-digit code that opens the app on this phone. Also reset and change from Profile.",
    cases: [
      { name: "Set unlock code", Screen: UnlockCode, state: passwordSet },
      { name: "Entering code", Screen: UnlockCode, state: passwordSet, seed: { value: "482" } },
      { name: "Too easy to guess", Screen: UnlockCode, state: passwordSet, seed: { error: "That code is too easy to guess. Avoid repeats like 111111 or runs like 123456." } },
      { name: "Confirm unlock code", Screen: UnlockCode, state: passwordSet, seed: { stage: "confirm" } },
      { name: "Codes don't match", Screen: UnlockCode, state: passwordSet, seed: { error: "Codes don't match. Choose your code again." } },
      { name: "Reset · new code", Screen: UnlockCode, state: inApp, params: { mode: "reset" } },
      { name: "Change · current code", Screen: UnlockCode, state: inApp, params: { mode: "change" } },
      { name: "Change · wrong current code", Screen: UnlockCode, state: inApp, params: { mode: "change" }, seed: { error: "Wrong unlock code. 4 attempts left." } },
    ],
  },
  {
    title: "Face ID",
    summary: "Offered once after the unlock code is set, and from Profile.",
    cases: [
      { name: "Turn on Face ID", Screen: Biometrics, state: inApp },
      { name: "Face ID prompt", Screen: Biometrics, state: inApp, seed: { prompt: true } },
      { name: "Not recognised", Screen: Biometrics, state: inApp, seed: { prompt: true, promptPhase: "failed" } },
      { name: "Request cancelled", Screen: Biometrics, state: inApp, seed: { note: { tone: "info", title: "Face ID wasn't turned on", body: "You cancelled the request. You can try again, or keep using your unlock code." } } },
      { name: "Couldn't set up", Screen: Biometrics, state: inApp, seed: { note: { tone: "warning", title: "Couldn't set up Face ID", body: "We'll keep using your unlock code. You can try again later from Profile." } } },
      { name: "Face ID not available", Screen: Biometrics, state: { ...inApp, scenarios: scenarios({ biometric: "unavailable" }) } },
    ],
  },
  {
    title: "Returning user · Unlock",
    summary: "Every app open on a signed-in phone: unlock code or Face ID, then the session is restored quietly.",
    cases: [
      { name: "Enter unlock code", Screen: Unlock, state: appLocked },
      { name: "Code entered", Screen: Unlock, state: appLocked, seed: { value: "4809" } },
      { name: "Wrong code", Screen: Unlock, state: appLocked, seed: { error: "Wrong unlock code. 3 attempts left." } },
      { name: "With Face ID", Screen: Unlock, state: { ...appLocked, account: account({ biometrics: true }) } },
      { name: "Face ID prompt", Screen: Unlock, state: { ...appLocked, account: account({ biometrics: true }) }, seed: { prompt: true } },
      { name: "Face ID not recognised", Screen: Unlock, state: { ...appLocked, account: account({ biometrics: true }) }, seed: { prompt: true, promptPhase: "failed" } },
      { name: "Signing in", Screen: Unlock, state: appLocked, seed: { restoring: "quick" } },
      { name: "Refreshing session", Screen: Unlock, state: appLocked, seed: { restoring: "refresh" } },
    ],
  },
  {
    title: "Forgot unlock code",
    summary: "Confirm the account password, then choose a new unlock code.",
    cases: [
      { name: "Confirm password", Screen: ForgotCode, state: appLocked },
      { name: "Password missing", Screen: ForgotCode, state: appLocked, seed: { submitted: true } },
      { name: "Wrong password", Screen: ForgotCode, state: appLocked, seed: { password: "wrongpass", error: "That password isn't right." } },
    ],
  },
  {
    title: "Session expired",
    summary: "The saved session couldn't be refreshed, so the customer logs in again.",
    cases: [{ name: "Session ended", Screen: SessionExpired, state: { account: account(), session: SIGNED_OUT, scenarios: scenarios({ session: "expired" }) } }],
  },
  {
    title: "Log in",
    summary: "Email and password, or Face ID. Also reached after an expired session or a locked unlock code.",
    cases: [
      { name: "Log in", Screen: Login, state: signedOut },
      { name: "Password entered", Screen: Login, state: signedOut, seed: { password: PASSWORD } },
      { name: "Session expired", Screen: Login, state: signedOut, params: { reason: "expired" } },
      { name: "Unlock code locked", Screen: Login, state: signedOut, params: { reason: "locked" } },
      { name: "Wrong email or password", Screen: Login, state: signedOut, seed: { password: "wrongpass", error: codeError("INVALID", "Email or password is incorrect.") } },
      { name: "Sign-in paused", Screen: Login, state: signedOut, seed: { error: codeError("LOCKED", "For your security, sign-in is paused after several failed attempts. Try again in 15 minutes or reset your password.") } },
      { name: "Missing details", Screen: Login, state: signedOut, params: { other: "1" }, seed: { submitted: true } },
      { name: "Another account", Screen: Login, state: signedOut, params: { other: "1" } },
      { name: "Face ID not available", Screen: Login, state: { ...signedOut, scenarios: scenarios({ biometric: "unavailable" }) } },
      { name: "Face ID prompt", Screen: Login, state: signedOut, seed: { bioPrompt: true } },
      { name: "New device · email code", Screen: Login, state: signedOut, seed: { deviceCheck: true } },
      { name: "New device · wrong code", Screen: Login, state: signedOut, seed: { deviceCheck: true, deviceError: codeError("INVALID", "That code isn't right.", 4) } },
      { name: "New device · code expired", Screen: Login, state: signedOut, seed: { deviceCheck: true, deviceError: codeError("EXPIRED", "This code has expired. Request a new one.") } },
    ],
  },
  {
    title: "Two-step verification",
    summary: "After the password, when the customer has turned on an authenticator app.",
    cases: [
      { name: "Authenticator code", Screen: LoginMfa, state: { account: account({ mfaEnabled: true, recoveryCodes: RECOVERY_CODES }), session: { authenticated: true, mfaVerified: false, unlocked: false } } },
      { name: "Wrong code", Screen: LoginMfa, state: { account: account({ mfaEnabled: true, recoveryCodes: RECOVERY_CODES }), session: { authenticated: true, mfaVerified: false, unlocked: false } }, seed: { error: "That code isn't right. Try the newest code in your app." } },
      { name: "Recovery code", Screen: LoginMfa, state: { account: account({ mfaEnabled: true, recoveryCodes: RECOVERY_CODES }), session: { authenticated: true, mfaVerified: false, unlocked: false } }, seed: { mode: "recovery" } },
      { name: "Invalid recovery code", Screen: LoginMfa, state: { account: account({ mfaEnabled: true, recoveryCodes: RECOVERY_CODES }), session: { authenticated: true, mfaVerified: false, unlocked: false } }, seed: { mode: "recovery", recovery: "k7mp-2xq0", error: "That recovery code isn't valid or has already been used." } },
    ],
  },
  {
    title: "Forgot password",
    summary: "Email, reset code, new password. Every device is signed out afterwards.",
    cases: [
      { name: "Enter email", Screen: ForgotPassword, state: signedOut },
      { name: "Email entered", Screen: ForgotPassword, state: signedOut, params: { email: EMAIL } },
      { name: "Invalid email", Screen: ForgotPassword, state: signedOut, params: { email: "adaeze@" }, seed: { submitted: true } },
      { name: "Enter reset code", Screen: ForgotPassword, state: signedOut, params: { email: EMAIL }, seed: { stage: "code" } },
      { name: "Wrong reset code", Screen: ForgotPassword, state: signedOut, params: { email: EMAIL }, seed: { stage: "code", error: "That code isn't right. 4 attempts left." } },
      { name: "New password", Screen: ForgotPassword, state: signedOut, params: { email: EMAIL }, seed: { stage: "password" } },
      { name: "New password · errors", Screen: ForgotPassword, state: signedOut, params: { email: EMAIL }, seed: { stage: "password", password: "payzen", confirm: "payzen1", submitted: true } },
      { name: "Password updated", Screen: ForgotPassword, state: signedOut, params: { email: EMAIL }, seed: { stage: "done" } },
    ],
  },
  {
    title: "Two-step sign-in setup",
    summary: "Optional, from Profile or a Home suggestion: link an authenticator app.",
    cases: [
      { name: "Secure your account", Screen: SecureAccount, state: verified },
      { name: "Link authenticator", Screen: SecureAccount, state: verified, seed: { stage: "link", setup: TOTP_SETUP } },
      { name: "Link · QR code", Screen: SecureAccount, state: verified, seed: { stage: "link", setup: TOTP_SETUP, showQr: true } },
      { name: "Enter code", Screen: SecureAccount, state: verified, seed: { stage: "verify" } },
      { name: "Code didn't match", Screen: SecureAccount, state: verified, seed: { stage: "verify", error: "Make sure your phone's time is set automatically, then try the newest code." } },
    ],
  },
  {
    title: "Recovery codes",
    summary: "Shown once after two-step sign-in is turned on.",
    cases: [
      { name: "Save recovery codes", Screen: RecoveryCodes, state: { ...verified, account: account({ mfaEnabled: true, recoveryCodes: RECOVERY_CODES }) } },
      { name: "Saved", Screen: RecoveryCodes, state: { ...verified, account: account({ mfaEnabled: true, recoveryCodes: RECOVERY_CODES }) }, seed: { saved: true } },
      { name: "Not confirmed", Screen: RecoveryCodes, state: { ...verified, account: account({ mfaEnabled: true, recoveryCodes: RECOVERY_CODES }) }, seed: { tried: true } },
    ],
  },
  {
    title: "Verify identity · Intro",
    summary: "Started from the Home banner or Profile once signed in. Three steps.",
    cases: [{ name: "How it works", Screen: VerifyIntro, state: inApp }],
  },
  {
    title: "Verify identity · BVN or NIN",
    summary: "Step 1: the number only. The provider returns name and date of birth to review.",
    cases: [
      { name: "BVN", Screen: Identity, state: inApp },
      { name: "NIN", Screen: Identity, state: inApp, seed: { idType: "NIN" } },
      { name: "Ready to verify", Screen: Identity, state: inApp, seed: { number: "22412345678", consent: true } },
      { name: "Missing details", Screen: Identity, state: inApp, seed: { number: "2241234", submitted: true } },
      { name: "Checking BVN", Screen: Identity, state: inApp, seed: { checking: true } },
      { name: "Number not found", Screen: Identity, state: inApp, seed: { number: "22412345678", consent: true, failure: identityFailure("not_found", "BVN") } },
      { name: "Details don't match", Screen: Identity, state: inApp, seed: { failure: identityFailure("mismatch", "BVN") } },
      { name: "ID can't be used", Screen: Identity, state: inApp, seed: { failure: identityFailure("unsupported", "BVN") } },
      { name: "Linked to another account", Screen: Identity, state: inApp, seed: { failure: identityFailure("duplicate", "BVN") } },
      { name: "Provider unavailable", Screen: Identity, state: inApp, seed: { failure: identityFailure("provider_down", "BVN") } },
    ],
  },
  {
    title: "Verify identity · Is this you?",
    summary: "The details fetched from the BVN record, read-only.",
    cases: [
      { name: "Confirm details", Screen: ConfirmIdentity, state: { ...inApp, kyc: kycFetched } },
      { name: "Not me", Screen: ConfirmIdentity, state: { ...inApp, kyc: kycFetched }, seed: { notMe: true } },
    ],
  },
  {
    title: "Verify identity · Selfie",
    summary: "Step 2: a live selfie matched to the ID photo. Three tries, then manual review.",
    cases: [
      { name: "Take a selfie", Screen: Selfie, state: { ...inApp, kyc: kycConfirmed } },
      { name: "Camera access needed", Screen: Selfie, state: { ...inApp, kyc: kycConfirmed }, seed: { stage: "denied" } },
      { name: "Camera · face in oval", Screen: Selfie, state: { ...inApp, kyc: kycConfirmed }, seed: { stage: "capture", prompt: 0 }, alwaysDark: true },
      { name: "Camera · turn head", Screen: Selfie, state: { ...inApp, kyc: kycConfirmed }, seed: { stage: "capture", prompt: 2 }, alwaysDark: true },
      { name: "Checking selfie", Screen: Selfie, state: { ...inApp, kyc: kycConfirmed }, seed: { stage: "processing" } },
      { name: "Selfie confirmed", Screen: Selfie, state: { ...inApp, kyc: kycConfirmed }, seed: { stage: "passed" } },
      { name: "No match · try again", Screen: Selfie, state: { ...inApp, kyc: kycConfirmed }, seed: { stage: "failed", attemptsLeft: 2 } },
      { name: "Sent for review", Screen: Selfie, state: { ...inApp, kyc: kycConfirmed }, seed: { stage: "manual" } },
    ],
  },
  {
    title: "Verify identity · Home address",
    summary: "Step 3: where the customer lives now. Submitting sends the verification.",
    cases: [
      { name: "Empty", Screen: AddressScreen, state: { ...inApp, kyc: kycSelfieDone } },
      { name: "Filled", Screen: AddressScreen, state: { ...inApp, kyc: kycSubmitted } },
      { name: "Missing details", Screen: AddressScreen, state: { ...inApp, kyc: kycSelfieDone }, seed: { submitted: true } },
      { name: "Choose state", Screen: AddressScreen, state: { ...inApp, kyc: kycSelfieDone }, seed: { selectOpen: true } },
      { name: "Submitting", Screen: AddressScreen, state: { ...inApp, kyc: kycSubmitted }, seed: { submitting: true } },
    ],
  },
  {
    title: "Verification status",
    summary: "The result after submitting: in review, verified or unsuccessful.",
    cases: [
      { name: "In review", Screen: VerificationStatus, state: { ...inApp, kyc: kycPending } },
      { name: "Selfie in review", Screen: VerificationStatus, state: { ...inApp, kyc: kycSelfieReview } },
      { name: "Verified", Screen: VerificationStatus, state: { ...inApp, kyc: kycVerified } },
      { name: "Unsuccessful", Screen: VerificationStatus, state: { ...inApp, kyc: kycRejected } },
    ],
  },
  {
    title: "Home",
    summary: "The wallet stays locked, with no balance shown, until identity is verified.",
    cases: [
      { name: "Loading", Screen: Home, state: inApp, seed: { loading: true } },
      { name: "Not verified", Screen: Home, state: inApp },
      { name: "Verification in progress", Screen: Home, state: { ...inApp, kyc: kycConfirmed } },
      { name: "Verification in review", Screen: Home, state: { ...inApp, kyc: kycPending } },
      { name: "Verification unsuccessful", Screen: Home, state: { ...inApp, kyc: kycRejected } },
      { name: "Verified", Screen: Home, state: verified },
      { name: "Verified · balances hidden", Screen: Home, state: { ...verified, hideBalances: true } },
      { name: "Verified · new account", Screen: Home, state: { ...verified, scenarios: scenarios({ home: "new" }) } },
      { name: "Verified · all security on", Screen: Home, state: { ...verified, account: account({ biometrics: true, passkey: true, mfaEnabled: true }) } },
      { name: "Couldn't load", Screen: Home, state: { ...verified, scenarios: scenarios({ home: "unavailable" }) } },
    ],
  },
  {
    title: "Profile",
    summary: "From the avatar on Home: who you are, verification and help, then every settings area. Log out at the end.",
    cases: [
      { name: "Not verified", Screen: Profile, state: inApp },
      { name: "Verification in progress", Screen: Profile, state: { ...inApp, kyc: kycConfirmed } },
      { name: "In review", Screen: Profile, state: { ...inApp, kyc: kycPending } },
      { name: "Verification unsuccessful", Screen: Profile, state: { ...inApp, kyc: kycRejected } },
      { name: "Verified", Screen: Profile, state: verified },
    ],
  },
  {
    title: "Profile · Account",
    summary: "Personal details from the ID record, verification level, account number, limits and statements.",
    cases: [
      { name: "Not verified", Screen: ProfileAccount, state: inApp },
      { name: "In review", Screen: ProfileAccount, state: { ...inApp, kyc: kycPending } },
      { name: "Verified", Screen: ProfileAccount, state: verified },
    ],
  },
  {
    title: "Profile · Security",
    summary: "Unlock code and Face ID for this device, change password, two-step sign-in, transaction PIN.",
    cases: [
      { name: "Nothing set up yet", Screen: ProfileSecurity, state: verified },
      { name: "Everything on", Screen: ProfileSecurity, state: { ...verified, account: account({ biometrics: true, mfaEnabled: true }) } },
      { name: "Face ID unavailable", Screen: ProfileSecurity, state: { ...verified, scenarios: scenarios({ biometric: "unavailable" }) } },
    ],
  },
  {
    title: "Profile · Preferences",
    summary: "Appearance, hiding balances, and notification settings.",
    cases: [
      { name: "Preferences", Screen: ProfilePreferences, state: verified },
      { name: "Balances hidden", Screen: ProfilePreferences, state: { ...verified, hideBalances: true } },
    ],
  },
  {
    title: "Activity",
    summary: "Every payment, transfer, bill and trade, grouped by day.",
    cases: [
      { name: "Loading", Screen: Activity, state: verified, seed: { loading: true } },
      { name: "All activity", Screen: Activity, state: verified },
      { name: "Money in", Screen: Activity, state: verified, seed: { filter: "in" } },
      { name: "In progress", Screen: Activity, state: verified, seed: { filter: "pending" } },
      { name: "No activity yet", Screen: Activity, state: inApp },
      { name: "Couldn't load", Screen: Activity, state: { ...verified, scenarios: scenarios({ home: "unavailable" }) } },
    ],
  },
];

export const CASE_COUNT = FLOWS.reduce((n, f) => n + f.cases.length, 0);
