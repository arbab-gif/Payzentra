"use client";

/**
 * Simulated Payzentra backend.
 *
 * Every function here stands in for a real API call. Outcomes are driven by
 * the Demo panel (store.scenarios) so each designed state can be reached.
 * Swap these for real fetch() calls to the FastAPI service later; the
 * screens only depend on the return shapes.
 */
import { useApp, type Address, type IdType, type VerifiedIdentity } from "./store";
import { toast } from "./toast";

export const DEMO_EMAIL_CODE = "123456";
export const DEMO_EXPIRED_CODE = "111111";
export const DEMO_BAD_TOTP = "000000";
export const EMAIL_CODE_TTL_MS = 10 * 60 * 1000;
export const MAX_CODE_ATTEMPTS = 5;
export const MAX_LIVENESS_ATTEMPTS = 3;

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const state = () => useApp.getState();

export type Result<T = undefined> =
  | ({ ok: true } & (T extends undefined ? object : { data: T }))
  | { ok: false; code: string; message: string; attemptsLeft?: number };

const fail = (code: string, message: string, extra: object = {}) =>
  ({ ok: false, code, message, ...extra }) as const;

// ---------- Account ----------

export async function register(email: string, password: string): Promise<Result> {
  await wait(900);
  const { scenarios, account } = state();
  const taken =
    scenarios.signup === "duplicate" ||
    (account?.email.toLowerCase() === email.toLowerCase() && account.emailVerified);
  if (taken) {
    return fail(
      "EMAIL_EXISTS",
      "An account with this email already exists. Log in or reset your password instead.",
    );
  }
  state().createAccount(email, password);
  sendEmailCode();
  return { ok: true };
}

let emailCodeAttempts = 0;

export function sendEmailCode() {
  emailCodeAttempts = 0;
  const email = state().account?.email ?? "you";
  toast({
    tone: "inbox",
    title: `Demo inbox · ${email}`,
    body: `Your Payzentra verification code is ${DEMO_EMAIL_CODE}. It expires in 10 minutes.`,
  });
}

export async function resendEmailCode(): Promise<Result> {
  await wait(700);
  sendEmailCode();
  return { ok: true };
}

export async function verifyEmailCode(code: string): Promise<Result> {
  await wait(800);
  if (emailCodeAttempts >= MAX_CODE_ATTEMPTS) {
    return fail("LOCKED", "Too many incorrect attempts. Request a new code to try again.", {
      attemptsLeft: 0,
    });
  }
  if (code === DEMO_EXPIRED_CODE) {
    return fail("EXPIRED", "This code has expired. Request a new one.");
  }
  if (code !== DEMO_EMAIL_CODE) {
    emailCodeAttempts += 1;
    const attemptsLeft = MAX_CODE_ATTEMPTS - emailCodeAttempts;
    if (attemptsLeft === 0) {
      return fail("LOCKED", "Too many incorrect attempts. Request a new code to try again.", {
        attemptsLeft,
      });
    }
    return fail("INVALID", "That code isn't right.", { attemptsLeft });
  }
  state().setAccount({ emailVerified: true });
  return { ok: true };
}

// ---------- Authenticator (TOTP) ----------

const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export async function startTotpSetup(): Promise<Result<{ secret: string; uri: string }>> {
  await wait(500);
  const acct = state().account!;
  let secret = acct.totpSecret;
  if (!secret) {
    const bytes = crypto.getRandomValues(new Uint8Array(32));
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
    const b = crypto.getRandomValues(new Uint8Array(8));
    const s = Array.from(b, (x) => alphabet[x % alphabet.length]).join("");
    return `${s.slice(0, 4)}-${s.slice(4)}`;
  });
}

export async function confirmTotpSetup(code: string): Promise<Result> {
  await wait(800);
  if (code === DEMO_BAD_TOTP) {
    return fail("INVALID", "Make sure your phone's time is set automatically, then try the newest code.");
  }
  state().setAccount({ mfaEnabled: true, recoveryCodes: makeRecoveryCodes() });
  state().setSession({ mfaVerified: true });
  return { ok: true };
}

// ---------- Login ----------

export async function login(email: string, password: string): Promise<Result> {
  await wait(900);
  const { scenarios, account } = state();
  if (scenarios.login === "locked") {
    return fail(
      "LOCKED",
      "For your security, sign-in is paused after several failed attempts. Try again in 15 minutes or reset your password.",
    );
  }
  const known =
    account &&
    account.email.toLowerCase() === email.toLowerCase() &&
    account.password === password;
  if (scenarios.login === "wrong_password" || !known) {
    return fail("INVALID", "Email or password is incorrect.");
  }
  state().setSession({ authenticated: true, mfaVerified: false });
  if (!account.emailVerified) sendEmailCode();
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
  if (!acct.recoveryCodes.includes(norm)) {
    return fail("INVALID", "That recovery code isn't valid or has already been used.");
  }
  state().setAccount({ recoveryCodes: acct.recoveryCodes.filter((c) => c !== norm) });
  state().setSession({ mfaVerified: true });
  return { ok: true };
}

// ---------- Password recovery ----------

export async function requestPasswordReset(email: string): Promise<Result> {
  await wait(800);
  // Same response whether or not the account exists, to avoid revealing who has an account.
  toast({
    tone: "inbox",
    title: `Demo inbox · ${email}`,
    body: `Use code ${DEMO_EMAIL_CODE} to reset your Payzentra password.`,
  });
  emailCodeAttempts = 0;
  return { ok: true };
}

export async function verifyResetCode(code: string) {
  return verifyCodeOnly(code);
}

async function verifyCodeOnly(code: string): Promise<Result> {
  await wait(700);
  if (code === DEMO_EXPIRED_CODE) return fail("EXPIRED", "This code has expired. Request a new one.");
  if (code !== DEMO_EMAIL_CODE) {
    emailCodeAttempts += 1;
    return fail("INVALID", "That code isn't right.", {
      attemptsLeft: Math.max(0, MAX_CODE_ATTEMPTS - emailCodeAttempts),
    });
  }
  return { ok: true };
}

export async function resetPassword(email: string, password: string): Promise<Result> {
  await wait(900);
  const acct = state().account;
  if (acct && acct.email.toLowerCase() === email.toLowerCase()) {
    state().setAccount({ password });
  }
  // All other sessions are signed out after a reset.
  state().signOut();
  return { ok: true };
}

// ---------- KYC ----------

export async function saveDetails(phone: string, dob: string): Promise<Result> {
  await wait(600);
  state().setKyc({ phone, dob, detailsDone: true });
  return { ok: true };
}

export async function lookupIdentity(
  idType: IdType,
  idNumber: string,
): Promise<Result<VerifiedIdentity>> {
  await wait(2200);
  const { scenarios, kyc } = state();
  switch (scenarios.identity) {
    case "provider_down":
      return fail(
        "PROVIDER_UNAVAILABLE",
        `We can't reach the ${idType} verification service right now. Your progress is saved — try again in a few minutes.`,
      );
    case "not_found":
      return fail("NOT_FOUND", `We couldn't find a record for this ${idType}. Check the 11 digits and try again.`);
    case "duplicate":
      return fail(
        "DUPLICATE_IDENTITY",
        `This ${idType} is already linked to another Payzentra account. Each person can only have one account.`,
      );
    case "mismatch":
      return fail(
        "MISMATCH",
        `The date of birth or phone number you entered doesn't match your ${idType} record.`,
      );
  }
  const [y, m, d] = (kyc.dob || "1994-06-12").split("-");
  const identity: VerifiedIdentity = {
    firstName: "Adaeze",
    middleName: "Chioma",
    lastName: "Okonkwo",
    dob: `${d}/${m}/${y}`,
    gender: "Female",
    phoneMasked: kyc.phone ? `+234 ${kyc.phone.slice(0, 3)} *** **${kyc.phone.slice(-2)}` : "+234 803 *** **21",
  };
  state().setKyc({ idType, idNumber, consentAt: new Date().toISOString(), identity });
  return { ok: true, data: identity };
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
  const passes =
    scenarios.liveness === "pass" || (scenarios.liveness === "fail_once" && attempt > 1);
  if (passes) {
    state().setKyc({ livenessAttempts: attempt, livenessPassed: true });
    return { ok: true };
  }
  const attemptsLeft = MAX_LIVENESS_ATTEMPTS - attempt;
  if (attemptsLeft <= 0) {
    state().setKyc({ livenessAttempts: attempt, livenessLocked: true, status: "pending" });
    return fail(
      "MANUAL_REVIEW",
      "We couldn't confirm your selfie automatically, so our team will review it.",
      { attemptsLeft: 0 },
    );
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
  else
    state().setKyc({
      status: "rejected",
      rejectionReason:
        "The address you entered couldn't be confirmed. Please check it matches where you currently live.",
    });
  return { ok: true };
}

export async function restartAddressAfterRejection(): Promise<void> {
  await wait(400);
  state().setKyc({ status: "none", rejectionReason: null, address: null });
}
