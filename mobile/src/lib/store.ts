import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext } from "react";
import { create, createStore, useStore, type StoreApi } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type IdType = "BVN" | "NIN";
export type KycStatus = "none" | "pending" | "verified" | "rejected";

/** What the simulated backend and device return, chosen in Demo controls. */
export type Scenarios = {
  signup: "ok" | "duplicate";
  login: "ok" | "wrong_password" | "locked";
  /** Signing in on this phone before (trusted) or on a phone we haven't seen (new: extra email check). */
  device: "trusted" | "new";
  /** Face ID / fingerprint prompt outcome. "unavailable" = the device has no biometrics set up. */
  biometric: "success" | "fail" | "cancel" | "unavailable";
  /** Passkey prompt outcome. "unsupported" = the device or browser can't use passkeys. */
  passkey: "success" | "fail" | "unsupported";
  /** What happens to the saved session at the next unlock. */
  session: "active" | "refresh" | "expired";
  identity: "match" | "mismatch" | "not_found" | "duplicate" | "unsupported" | "provider_down";
  liveness: "pass" | "fail_once" | "fail_always";
  decision: "verified" | "pending" | "rejected";
  camera: "real" | "simulated";
  /** Home: a funded account with history, a brand-new empty one, or balance and activity failing to load. */
  home: "active" | "new" | "unavailable";
};

export const defaultScenarios: Scenarios = {
  signup: "ok",
  login: "ok",
  device: "trusted",
  biometric: "success",
  passkey: "success",
  session: "active",
  identity: "match",
  liveness: "pass",
  decision: "verified",
  camera: "simulated",
  home: "active",
};

export type Account = {
  email: string;
  /** Set after the email is verified. */
  password: string | null;
  emailVerified: boolean;
  /** 6-digit code that opens the app on this device. Not the transaction PIN. */
  unlockCode: string | null;
  /** Wrong unlock-code attempts since the last success. */
  unlockFailures: number;
  biometrics: boolean;
  passkey: boolean;
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
  idType: IdType | null;
  idNumber: string;
  consentAt: string | null;
  /** Details returned by the identity provider for the customer to review. */
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

/**
 * authenticated: this device holds a session (refreshable) for the account.
 * unlocked: the app has been unlocked since it was opened. Never saved, so every
 * app open starts locked.
 */
type Session = { authenticated: boolean; mfaVerified: boolean; unlocked: boolean };

const signedOut: Session = { authenticated: false, mfaVerified: false, unlocked: false };

export type State = {
  account: Account | null;
  session: Session;
  kyc: Kyc;
  scenarios: Scenarios;
  theme: "dark" | "light";
  /** Privacy mode: mask every amount on Home. */
  hideBalances: boolean;
  /** Browser preview only: phone-sized app or the full desktop web app. */
  viewMode: "mobile" | "web";
  setAccount: (patch: Partial<Account>) => void;
  startAccount: (email: string) => void;
  setSession: (patch: Partial<Session>) => void;
  setKyc: (patch: Partial<Kyc>) => void;
  setScenario: <K extends keyof Scenarios>(key: K, value: Scenarios[K]) => void;
  setTheme: (theme: "dark" | "light") => void;
  setHideBalances: (hide: boolean) => void;
  setViewMode: (mode: "mobile" | "web") => void;
  /** Log out on this device: ends the session and forgets this device's unlock code and biometrics. */
  signOut: () => void;
  resetAll: () => void;
};

const build = (set: StoreApi<State>["setState"]): State => ({
  account: null,
  session: signedOut,
  kyc: emptyKyc,
  scenarios: defaultScenarios,
  theme: "dark",
  hideBalances: false,
  viewMode: "mobile",
  setAccount: (patch) => set((s) => (s.account ? { account: { ...s.account, ...patch } } : s)),
  startAccount: (email) =>
    set({
      account: {
        email,
        password: null,
        emailVerified: false,
        unlockCode: null,
        unlockFailures: 0,
        biometrics: false,
        passkey: false,
        totpSecret: null,
        mfaEnabled: false,
        recoveryCodes: [],
        recoveryCodesSaved: false,
      },
      // A brand-new sign-up is already "in" on this device.
      session: { authenticated: true, mfaVerified: true, unlocked: true },
      kyc: emptyKyc,
    }),
  setSession: (patch) => set((s) => ({ session: { ...s.session, ...patch } })),
  setKyc: (patch) => set((s) => ({ kyc: { ...s.kyc, ...patch } })),
  setScenario: (key, value) => set((s) => ({ scenarios: { ...s.scenarios, [key]: value } })),
  setTheme: (theme) => set({ theme }),
  setHideBalances: (hideBalances) => set({ hideBalances }),
  setViewMode: (viewMode) => set({ viewMode }),
  signOut: () =>
    set((s) => ({
      session: signedOut,
      account: s.account ? { ...s.account, unlockCode: null, unlockFailures: 0, biometrics: false } : null,
    })),
  resetAll: () => set({ account: null, session: signedOut, kyc: emptyKyc }),
});

const appStore = create<State>()(
  persist(
    (set) => build(set),
    {
      name: "payzentra-demo",
      version: 4,
      storage: createJSONStorage(() => AsyncStorage),
      // The app always opens locked: "unlocked" is never written to storage.
      partialize: (s) => ({
        account: s.account,
        session: { ...s.session, unlocked: false },
        kyc: s.kyc,
        scenarios: s.scenarios,
        theme: s.theme,
        hideBalances: s.hideBalances,
        viewMode: s.viewMode,
      }),
      // v3 → v4: unlock code, biometrics and passkey on the account; verification no longer
      // needs the separate personal-details step.
      migrate: (persisted) => {
        const p = (persisted ?? {}) as Partial<State>;
        const a = p.account as (Partial<Account> & { email: string }) | null | undefined;
        return {
          ...p,
          theme: p.theme ?? "dark",
          account: a ? { unlockCode: null, unlockFailures: 0, biometrics: false, passkey: false, ...a } : null,
          session: { ...signedOut, ...(p.session ?? {}), unlocked: false },
        } as State;
      },
      // Fill in scenario keys added after a demo was saved.
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<State>;
        return { ...current, ...p, session: { ...signedOut, ...(p.session ?? {}), unlocked: false }, scenarios: { ...defaultScenarios, ...p.scenarios } };
      },
    },
  ),
);

/** Screen gallery: each frame gets its own in-memory store, so frames never share or save state. */
const ScopedStore = createContext<StoreApi<State> | null>(null);
export const ScopedStoreProvider = ScopedStore.Provider;

export function createScopedStore(patch: Partial<State>): StoreApi<State> {
  return createStore<State>()((set) => ({ ...build(set), ...patch }));
}

function useAppState(): State;
function useAppState<T>(selector: (s: State) => T): T;
function useAppState<T>(selector?: (s: State) => T) {
  const scoped = useContext(ScopedStore);
  return useStore(scoped ?? appStore, selector as (s: State) => T);
}

export const useApp = Object.assign(useAppState, {
  getState: appStore.getState,
  setState: appStore.setState,
  subscribe: appStore.subscribe,
  persist: appStore.persist,
});

/** Every route in journey order. */
export const ROUTES = {
  welcome: "/",
  welcomeBack: "/login",
  signup: "/signup",
  verifyEmail: "/signup/verify-email",
  password: "/signup/password",
  setUnlockCode: "/security/unlock-code",
  biometrics: "/security/biometrics",
  forgotCode: "/security/forgot-code",
  unlock: "/unlock",
  sessionExpired: "/session-expired",
  // Optional authenticator app (Profile → Security).
  secure: "/signup/secure",
  recoveryCodes: "/signup/recovery-codes",
  kycIntro: "/verify",
  identity: "/verify/identity",
  identityConfirm: "/verify/identity/confirm",
  selfie: "/verify/selfie",
  address: "/verify/address",
  status: "/verify/status",
  home: "/home",
  profile: "/profile",
  activity: "/activity",
  login: "/login",
  loginMfa: "/login/mfa",
} as const;

type Snapshot = Pick<State, "account" | "session" | "kyc">;

/**
 * Where the customer should be right now. Used to resume after an interruption
 * and to stop people skipping steps by typing a URL.
 * Sign-up: email → email code → password → unlock code → Home. Identity
 * verification is optional at this point and started from Home or Profile.
 */
export function nextRoute(s: Snapshot): string {
  const { account, session } = s;
  if (!account) return ROUTES.welcome;
  if (!session.authenticated) return account.password ? ROUTES.login : ROUTES.welcome;
  if (!account.emailVerified) return ROUTES.verifyEmail;
  if (!account.password) return ROUTES.password;
  // Two-step sign-in only applies once the customer has turned it on.
  if (account.mfaEnabled && !session.mfaVerified) return ROUTES.loginMfa;
  if (!account.unlockCode) return ROUTES.setUnlockCode;
  if (!session.unlocked) return ROUTES.unlock;
  return ROUTES.home;
}

/** The verification step to continue from (Home banner, Profile). */
export function kycNext(kyc: Kyc): string {
  if (kyc.status !== "none" || kyc.livenessLocked) return ROUTES.status;
  if (!kyc.identity) return ROUTES.kycIntro;
  if (!kyc.identityConfirmed) return ROUTES.identityConfirm;
  if (!kyc.livenessPassed) return ROUTES.selfie;
  return ROUTES.address;
}

export function canVisit(route: string, s: Snapshot): boolean {
  const next = nextRoute(s);
  if (route === next) return true;
  const inApp = next === ROUTES.home;
  const { account, kyc } = s;
  switch (route) {
    // Reached from the unlock screen.
    case ROUTES.forgotCode:
      return next === ROUTES.unlock;
    // Offered once after setting an unlock code; also from Profile.
    case ROUTES.biometrics:
      return inApp;
    // Changing or resetting the code happens from Profile / forgot-code with ?mode=.
    case ROUTES.setUnlockCode:
      return inApp;
    case ROUTES.profile:
    case ROUTES.activity:
      return inApp;
    case ROUTES.secure:
      return inApp && !account?.mfaEnabled;
    case ROUTES.recoveryCodes:
      return inApp && !!account?.mfaEnabled && !account.recoveryCodesSaved;
  }
  if (!inApp) return false;
  // Verification, started from Home or Profile once signed in.
  const open = kyc.status === "none" && !kyc.livenessLocked;
  switch (route) {
    case ROUTES.kycIntro:
      return open && !kyc.identityConfirmed;
    case ROUTES.identity:
      return open && !kyc.identityConfirmed;
    case ROUTES.identityConfirm:
      return open && !!kyc.identity && !kyc.identityConfirmed;
    case ROUTES.selfie:
      return open && kyc.identityConfirmed && !kyc.livenessPassed;
    case ROUTES.address:
      return open && kyc.livenessPassed;
    case ROUTES.status:
      return kyc.status !== "none" || kyc.livenessLocked;
  }
  return false;
}
