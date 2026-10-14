"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type IdType = "BVN" | "NIN";
export type KycStatus = "none" | "pending" | "verified" | "rejected";

export type Scenarios = {
  signup: "ok" | "duplicate";
  login: "ok" | "wrong_password" | "locked";
  identity: "match" | "mismatch" | "not_found" | "duplicate" | "provider_down";
  liveness: "pass" | "fail_once" | "fail_always";
  decision: "verified" | "pending" | "rejected";
  camera: "real" | "simulated";
};

export const defaultScenarios: Scenarios = {
  signup: "ok",
  login: "ok",
  identity: "match",
  liveness: "pass",
  decision: "verified",
  camera: "simulated",
};

export type Account = {
  email: string;
  password: string;
  emailVerified: boolean;
  totpSecret: string | null;
  mfaEnabled: boolean;
  recoveryCodes: string[];
  recoveryCodesSaved: boolean;
};

export type VerifiedIdentity = {
  firstName: string;
  middleName?: string;
  lastName: string;
  dob: string;
  gender: string;
  phoneMasked: string;
};

export type Address = {
  line1: string;
  line2?: string;
  city: string;
  lga: string;
  state: string;
  postcode?: string;
};

export type Kyc = {
  phone: string;
  dob: string;
  detailsDone: boolean;
  idType: IdType | null;
  idNumber: string;
  consentAt: string | null;
  identity: VerifiedIdentity | null;
  identityConfirmed: boolean;
  livenessAttempts: number;
  livenessPassed: boolean;
  livenessLocked: boolean;
  address: Address | null;
  status: KycStatus;
  rejectionReason: string | null;
};

export const emptyKyc: Kyc = {
  phone: "",
  dob: "",
  detailsDone: false,
  idType: null,
  idNumber: "",
  consentAt: null,
  identity: null,
  identityConfirmed: false,
  livenessAttempts: 0,
  livenessPassed: false,
  livenessLocked: false,
  address: null,
  status: "none",
  rejectionReason: null,
};

type Session = { authenticated: boolean; mfaVerified: boolean };

type State = {
  account: Account | null;
  session: Session;
  kyc: Kyc;
  scenarios: Scenarios;
  theme: "dark" | "light";
  setAccount: (patch: Partial<Account>) => void;
  createAccount: (email: string, password: string) => void;
  setSession: (patch: Partial<Session>) => void;
  setKyc: (patch: Partial<Kyc>) => void;
  setScenario: <K extends keyof Scenarios>(key: K, value: Scenarios[K]) => void;
  setTheme: (theme: "dark" | "light") => void;
  signOut: () => void;
  resetAll: () => void;
};

export const useApp = create<State>()(
  persist(
    (set) => ({
      account: null,
      session: { authenticated: false, mfaVerified: false },
      kyc: emptyKyc,
      scenarios: defaultScenarios,
      theme: "dark",
      setAccount: (patch) =>
        set((s) => (s.account ? { account: { ...s.account, ...patch } } : s)),
      createAccount: (email, password) =>
        set({
          account: {
            email,
            password,
            emailVerified: false,
            totpSecret: null,
            mfaEnabled: false,
            recoveryCodes: [],
            recoveryCodesSaved: false,
          },
          session: { authenticated: true, mfaVerified: false },
          kyc: emptyKyc,
        }),
      setSession: (patch) => set((s) => ({ session: { ...s.session, ...patch } })),
      setKyc: (patch) => set((s) => ({ kyc: { ...s.kyc, ...patch } })),
      setScenario: (key, value) =>
        set((s) => ({ scenarios: { ...s.scenarios, [key]: value } })),
      setTheme: (theme) => set({ theme }),
      signOut: () => set({ session: { authenticated: false, mfaVerified: false } }),
      resetAll: () =>
        set({
          account: null,
          session: { authenticated: false, mfaVerified: false },
          kyc: emptyKyc,
        }),
    }),
    { name: "payzentra-demo", version: 1 },
  ),
);

/** Every onboarding route in journey order. */
export const ROUTES = {
  welcome: "/",
  signup: "/signup",
  verifyEmail: "/signup/verify-email",
  secure: "/signup/secure",
  recoveryCodes: "/signup/recovery-codes",
  kycIntro: "/verify",
  details: "/verify/details",
  identity: "/verify/identity",
  identityConfirm: "/verify/identity/confirm",
  selfie: "/verify/selfie",
  address: "/verify/address",
  review: "/verify/review",
  status: "/verify/status",
  login: "/login",
  loginMfa: "/login/mfa",
} as const;

/**
 * Where the customer should be right now. Used to resume after an
 * interruption (closing the tab, logging back in) and to stop people
 * skipping steps by typing a URL.
 */
export function nextRoute(s: Pick<State, "account" | "session" | "kyc">): string {
  const { account, session, kyc } = s;
  if (!account || !session.authenticated) return ROUTES.welcome;
  if (!account.emailVerified) return ROUTES.verifyEmail;
  if (!account.mfaEnabled) return ROUTES.secure;
  if (!session.mfaVerified) return ROUTES.loginMfa;
  if (!account.recoveryCodesSaved) return ROUTES.recoveryCodes;
  if (kyc.status !== "none") return ROUTES.status;
  if (kyc.livenessLocked) return ROUTES.status;
  if (!kyc.detailsDone) return ROUTES.kycIntro;
  if (!kyc.identity) return ROUTES.identity;
  if (!kyc.identityConfirmed) return ROUTES.identityConfirm;
  if (!kyc.livenessPassed) return ROUTES.selfie;
  if (!kyc.address) return ROUTES.address;
  return ROUTES.review;
}

/** KYC steps a customer may go back and edit before submitting. */
const KYC_ORDER: string[] = [
  ROUTES.kycIntro,
  ROUTES.details,
  ROUTES.identity,
  ROUTES.identityConfirm,
  ROUTES.selfie,
  ROUTES.address,
  ROUTES.review,
];

export function canVisit(
  route: string,
  s: Pick<State, "account" | "session" | "kyc">,
): boolean {
  const next = nextRoute(s);
  if (route === next) return true;
  if (route === ROUTES.details && next === ROUTES.kycIntro) return true;
  const ri = KYC_ORDER.indexOf(route);
  const ni = KYC_ORDER.indexOf(next);
  if (ri === -1 || ni === -1 || s.kyc.status !== "none") return false;
  // Identity is locked once the provider has returned a match; selfie once passed.
  if (route === ROUTES.identity && s.kyc.identity) return false;
  if (route === ROUTES.identityConfirm && s.kyc.identityConfirmed) return false;
  if (route === ROUTES.selfie && s.kyc.livenessPassed) return false;
  return ri < ni;
}
