/**
 * Simulated Payzentra backend.
 *
 * Every function here stands in for a real API call. Outcomes are driven by
 * the Demo panel (store.scenarios) so each designed state can be reached.
 * Swap these for real fetch() calls to the FastAPI service later; the
 * screens only depend on the return shapes.
 */
import { getRandomBytes } from "expo-crypto";
import { useApp, type Address, type IdType, type Scenarios, type VerifiedIdentity } from "./store";
import { toast } from "./toast";

export const DEMO_EMAIL_CODE = "123456";
export const DEMO_EXPIRED_CODE = "111111";
export const DEMO_BAD_TOTP = "000000";
export const EMAIL_CODE_TTL_MS = 10 * 60 * 1000;
export const MAX_CODE_ATTEMPTS = 5;
export const MAX_LIVENESS_ATTEMPTS = 3;
export const MAX_UNLOCK_ATTEMPTS = 5;
export const UNLOCK_CODE_LENGTH = 6;

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const state = () => useApp.getState();

export type Result<T = undefined> =
  | ({ ok: true } & (T extends undefined ? object : { data: T }))
  | { ok: false; code: string; message: string; attemptsLeft?: number };

const fail = (code: string, message: string, extra: object = {}) => ({ ok: false, code, message, ...extra }) as const;

// ---------- Sign-up ----------

function emailTaken(email: string) {
  const { scenarios, account } = state();
  return scenarios.signup === "duplicate" || (account?.email.toLowerCase() === email.toLowerCase() && !!account.password);
}

const EMAIL_EXISTS = "An account with this email already exists. Log in or reset your password instead.";

/** Step 1: start an account with just the email and send a verification code. */
export async function startSignup(email: string): Promise<Result> {
  await wait(800);
  if (emailTaken(email)) return fail("EMAIL_EXISTS", EMAIL_EXISTS);
  state().startAccount(email);
  sendEmailCode();
  return { ok: true };
}

let emailCodeAttempts = 0;

export function sendEmailCode(purpose = "verification") {
  emailCodeAttempts = 0;
  const email = state().account?.email ?? "you";
  toast({ tone: "inbox", title: `Demo inbox · ${email}`, body: `Your Payzentra ${purpose} code is ${DEMO_EMAIL_CODE}. It expires in 10 minutes.` });
}

export async function resendEmailCode(purpose?: string): Promise<Result> {
  await wait(700);
  sendEmailCode(purpose);
  return { ok: true };
}

async function checkEmailCode(code: string): Promise<Result> {
  await wait(800);
  if (emailCodeAttempts >= MAX_CODE_ATTEMPTS) return fail("LOCKED", "Too many incorrect attempts. Request a new code to try again.", { attemptsLeft: 0 });
  if (code === DEMO_EXPIRED_CODE) return fail("EXPIRED", "This code has expired. Request a new one.");
  if (code !== DEMO_EMAIL_CODE) {
    emailCodeAttempts += 1;
    const attemptsLeft = MAX_CODE_ATTEMPTS - emailCodeAttempts;
    if (attemptsLeft === 0) return fail("LOCKED", "Too many incorrect attempts. Request a new code to try again.", { attemptsLeft });
    return fail("INVALID", "That code isn't right.", { attemptsLeft });
  }
  return { ok: true };
}

/** Step 2: the email code. */
export async function verifyEmailCode(code: string): Promise<Result> {
  const res = await checkEmailCode(code);
  if (res.ok) state().setAccount({ emailVerified: true });
  return res;
}

/** Step 3: password (after the email is confirmed). */
export async function setPassword(password: string): Promise<Result> {
  await wait(800);
  state().setAccount({ password });
  return { ok: true };
}

// ---------- Unlock code (opens the app; not the transaction PIN) ----------

/** Step 4 (and after a reset or on a new device): save the 6-digit unlock code. */
export async function setUnlockCode(code: string): Promise<Result> {
  await wait(600);
  state().setAccount({ unlockCode: code, unlockFailures: 0 });
  state().setSession({ unlocked: true });
  return { ok: true };
}

/** Unlock with the code. After too many wrong tries the device is signed out and needs the password. */
export async function checkUnlockCode(code: string): Promise<Result> {
  await wait(350);
  const acct = state().account!;
  if (code === acct.unlockCode) {
    state().setAccount({ unlockFailures: 0 });
    return { ok: true };
  }
  const failures = acct.unlockFailures + 1;
  const attemptsLeft = MAX_UNLOCK_ATTEMPTS - failures;
  if (attemptsLeft <= 0) {
    // Locked: forget this device's code and require a full sign-in.
    state().setAccount({ unlockFailures: 0, unlockCode: null, biometrics: false });
    state().setSession({ authenticated: false, unlocked: false });
    return fail("LOCKED", "Too many wrong attempts. For your security, log in with your password to set a new unlock code.", { attemptsLeft: 0 });
  }
  state().setAccount({ unlockFailures: failures });
  return fail("INVALID", "Wrong unlock code.", { attemptsLeft });
}

/** Forgotten code: confirm the account password, then the customer sets a new code. */
export async function verifyPasswordForReset(password: string): Promise<Result> {
  await wait(800);
  if (password !== state().account?.password) return fail("INVALID", "That password isn't right.");
  state().setAccount({ unlockCode: null, unlockFailures: 0 });
  state().setSession({ unlocked: true });
  return { ok: true };
}

/**
 * After the code or biometrics succeed: check the saved session.
 * active → straight in; refresh → a quick silent token refresh, still straight in;
 * expired → the customer must sign in again (the device keeps its unlock code).
 */
export async function restoreSession(): Promise<Result<{ refreshed: boolean }>> {
  const { scenarios } = state();
  await wait(scenarios.session === "refresh" ? 1300 : 300);
  if (scenarios.session === "expired") {
    state().setSession({ authenticated: false, unlocked: false });
    return fail("SESSION_EXPIRED", "Your session has ended.");
  }
  state().setSession({ unlocked: true });
  return { ok: true, data: { refreshed: scenarios.session === "refresh" } };
}

// ---------- Biometrics and passkeys (device prompts are simulated) ----------

export type PromptOutcome = "success" | "fail" | "cancel" | "unavailable";

export function biometricOutcome(): PromptOutcome {
  return state().scenarios.biometric;
}

export function passkeySupported() {
  return state().scenarios.passkey !== "unsupported";
}

export function biometricsAvailable() {
  return state().scenarios.biometric !== "unavailable";
}

export async function enableBiometrics(on: boolean): Promise<Result> {
  await wait(300);
  state().setAccount({ biometrics: on });
  return { ok: true };
}

/** Create a passkey for this account (Profile → Security). */
export async function createPasskey(): Promise<Result> {
  await wait(900);
  const { scenarios } = state();
  if (scenarios.passkey === "unsupported") return fail("UNSUPPORTED", "This device doesn't support passkeys.");
  if (scenarios.passkey === "fail") return fail("PASSKEY_FAILED", "We couldn't create a passkey. Try again, or keep using your password.");
  state().setAccount({ passkey: true });
  return { ok: true };
}

export async function removePasskey(): Promise<Result> {
  await wait(500);
  state().setAccount({ passkey: false });
  return { ok: true };
}

// ---------- Sign-in ----------

/**
 * Email + password. On a device we don't recognise, the customer must also enter
 * a code sent to their email before the session starts.
 */
export async function login(email: string, password: string): Promise<Result<{ deviceCheck: boolean }>> {
  await wait(900);
  const { scenarios, account } = state();
  if (scenarios.login === "locked") {
    return fail("LOCKED", "For your security, sign-in is paused after several failed attempts. Try again in 15 minutes or reset your password.");
  }
  const known = account && account.email.toLowerCase() === email.toLowerCase() && account.password === password;
  if (scenarios.login === "wrong_password" || !known) return fail("INVALID", "Email or password is incorrect.");
  if (scenarios.device === "new") {
    sendEmailCode("new-device sign-in");
    return { ok: true, data: { deviceCheck: true } };
  }
  startSession();
  return { ok: true, data: { deviceCheck: false } };
}

/** The new-device email check. A new device starts without an unlock code or biometrics. */
export async function verifyDeviceCode(code: string): Promise<Result> {
  const res = await checkEmailCode(code);
  if (!res.ok) return res;
  state().setAccount({ unlockCode: null, unlockFailures: 0, biometrics: false });
  startSession();
  return { ok: true };
}

/** Passkey sign-in: the device's passkey replaces the password (and the new-device check). */
export async function passkeySignIn(): Promise<Result> {
  await wait(1100);
  const { scenarios, account } = state();
  if (scenarios.passkey === "unsupported") return fail("UNSUPPORTED", "Passkeys aren't available on this device. Log in with your password.");
  if (scenarios.passkey === "fail" || !account?.passkey) {
    return fail("PASSKEY_FAILED", account?.passkey ? "Passkey sign-in didn't work. Try again or use your password." : "There's no passkey for this account on this device yet. Log in with your password, then add one in Profile.");
  }
  startSession();
  return { ok: true };
}

function startSession() {
  const { account, scenarios } = state();
  state().setSession({ authenticated: true, mfaVerified: !account?.mfaEnabled, unlocked: true });
  state().setAccount({ unlockFailures: 0 });
  // A fresh sign-in replaces an expired session.
  if (scenarios.session === "expired") state().setScenario("session", "active");
}

// ---------- Authenticator (TOTP), optional ----------

const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export async function startTotpSetup(): Promise<Result<{ secret: string; uri: string }>> {
  await wait(500);
  const acct = state().account!;
  let secret = acct.totpSecret;
  if (!secret) {
    const bytes = getRandomBytes(32);
    secret = Array.from(bytes, (b) => B32[b % 32]).join("");
    state().setAccount({ totpSecret: secret });
  }
  const label = encodeURIComponent(`Payzentra:${acct.email}`);
  const uri = `otpauth://totp/${label}?secret=${secret}&issuer=Payzentra&digits=6&period=30`;
  return { ok: true, data: { secret, uri } };
}

function makeRecoveryCodes() {
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
  return Array.from({ length: 10 }, () => {
    const b = getRandomBytes(8);
    const s = Array.from(b, (x) => alphabet[x % alphabet.length]).join("");
    return `${s.slice(0, 4)}-${s.slice(4)}`;
  });
}

export async function confirmTotpSetup(code: string): Promise<Result> {
  await wait(800);
  if (code === DEMO_BAD_TOTP) return fail("INVALID", "Make sure your phone's time is set automatically, then try the newest code.");
  state().setAccount({ mfaEnabled: true, recoveryCodes: makeRecoveryCodes() });
  state().setSession({ mfaVerified: true });
  return { ok: true };
}

export async function verifyLoginTotp(code: string): Promise<Result> {
  await wait(800);
  if (code === DEMO_BAD_TOTP) return fail("INVALID", "That code isn't right. Try the newest code in your app.");
  state().setSession({ mfaVerified: true });
  return { ok: true };
}

export async function verifyRecoveryCode(code: string): Promise<Result> {
  await wait(800);
  const acct = state().account!;
  const norm = code.trim().toLowerCase();
  if (!acct.recoveryCodes.includes(norm)) return fail("INVALID", "That recovery code isn't valid or has already been used.");
  state().setAccount({ recoveryCodes: acct.recoveryCodes.filter((c) => c !== norm) });
  state().setSession({ mfaVerified: true });
  return { ok: true };
}

// ---------- Password recovery ----------

export async function requestPasswordReset(email: string): Promise<Result> {
  await wait(800);
  // Same response whether or not the account exists, to avoid revealing who has an account.
  toast({ tone: "inbox", title: `Demo inbox · ${email}`, body: `Use code ${DEMO_EMAIL_CODE} to reset your Payzentra password.` });
  emailCodeAttempts = 0;
  return { ok: true };
}

export async function verifyResetCode(code: string): Promise<Result> {
  await wait(700);
  if (code === DEMO_EXPIRED_CODE) return fail("EXPIRED", "This code has expired. Request a new one.");
  if (code !== DEMO_EMAIL_CODE) {
    emailCodeAttempts += 1;
    return fail("INVALID", "That code isn't right.", { attemptsLeft: Math.max(0, MAX_CODE_ATTEMPTS - emailCodeAttempts) });
  }
  return { ok: true };
}

export async function resetPassword(email: string, password: string): Promise<Result> {
  await wait(900);
  const acct = state().account;
  if (acct && acct.email.toLowerCase() === email.toLowerCase()) state().setAccount({ password });
  // All sessions are signed out after a reset.
  state().signOut();
  return { ok: true };
}

// ---------- Identity verification ----------

type IdentityFailure = Exclude<Scenarios["identity"], "match">;

/** What the identity provider says when a BVN / NIN check fails. */
export function identityFailure(kind: IdentityFailure, idType: IdType) {
  switch (kind) {
    case "provider_down":
      return fail("PROVIDER_UNAVAILABLE", `We can't reach the ${idType} check right now. Your progress is saved, so try again in a few minutes.`);
    case "not_found":
      return fail("NOT_FOUND", `We couldn't find a record for this ${idType}. Check the 11 digits and try again.`);
    case "duplicate":
      return fail("DUPLICATE_IDENTITY", `This ${idType} is already linked to another Payzentra account. Each person can only have one account.`);
    case "mismatch":
      return fail("MISMATCH", `We couldn't confirm this ${idType} belongs to you. The details on the record don't match the details on your account.`);
    case "unsupported":
      return fail("UNSUPPORTED_DOCUMENT", `This ${idType} can't be used to verify an account. Use a BVN or NIN that was issued to you.`);
  }
}

/** One consistent demo customer across every screen. */
export const DEMO_IDENTITY: VerifiedIdentity = { firstName: "Adaeze", middleName: "Chioma", lastName: "Okonkwo", dob: "12/06/1994", gender: "Female", phoneMasked: "+234 803 *** **67" };

export const ADDRESS_REJECTION = "The address you entered couldn't be confirmed. Please check it matches where you currently live.";

/** The customer enters only the BVN or NIN; the provider returns the rest for them to review. */
export async function lookupIdentity(idType: IdType, idNumber: string): Promise<Result<VerifiedIdentity>> {
  await wait(2400);
  const { scenarios } = state();
  if (scenarios.identity !== "match") return identityFailure(scenarios.identity, idType);
  state().setKyc({ idType, idNumber, consentAt: new Date().toISOString(), identity: DEMO_IDENTITY });
  return { ok: true, data: DEMO_IDENTITY };
}

export async function confirmIdentity(): Promise<Result> {
  await wait(500);
  state().setKyc({ identityConfirmed: true });
  return { ok: true };
}

export async function submitLiveness(): Promise<Result> {
  await wait(2600);
  const { scenarios, kyc } = state();
  const attempt = kyc.livenessAttempts + 1;
  const passes = scenarios.liveness === "pass" || (scenarios.liveness === "fail_once" && attempt > 1);
  if (passes) {
    state().setKyc({ livenessAttempts: attempt, livenessPassed: true });
    return { ok: true };
  }
  const attemptsLeft = MAX_LIVENESS_ATTEMPTS - attempt;
  if (attemptsLeft <= 0) {
    state().setKyc({ livenessAttempts: attempt, livenessLocked: true, status: "pending" });
    return fail("MANUAL_REVIEW", "We couldn't confirm your selfie automatically, so our team will review it.", { attemptsLeft: 0 });
  }
  state().setKyc({ livenessAttempts: attempt });
  return fail("FACE_MISMATCH", "We couldn't match your face to your ID photo.", { attemptsLeft });
}

export async function saveAddress(address: Address): Promise<Result> {
  await wait(700);
  state().setKyc({ address });
  return { ok: true };
}

export async function submitVerification(): Promise<Result> {
  await wait(2000);
  const { decision } = state().scenarios;
  if (decision === "verified") state().setKyc({ status: "verified" });
  else if (decision === "pending") state().setKyc({ status: "pending" });
  else state().setKyc({ status: "rejected", rejectionReason: ADDRESS_REJECTION });
  return { ok: true };
}

export async function restartAddressAfterRejection(): Promise<void> {
  await wait(400);
  state().setKyc({ status: "none", rejectionReason: null, address: null });
}
