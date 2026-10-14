import { router } from "expo-router";
import { useEffect, useSyncExternalStore } from "react";
import { canVisit, nextRoute, useApp } from "./store";

const subscribeHydration = (cb: () => void) => useApp.persist.onFinishHydration(cb);

/** True once saved progress has loaded from the phone's storage. */
export function useHydrated() {
  return useSyncExternalStore(
    subscribeHydration,
    () => useApp.persist.hasHydrated(),
    () => false,
  );
}

/**
 * Keeps the customer on the right step. If a screen is opened that they're
 * not allowed on yet (or anymore) — e.g. from a deep link or a restored
 * navigation state — they're sent to where they should be.
 * `hold` lets a screen finish showing a success state before moving on.
 */
export function useGuard(route: string, hold = false) {
  const hydrated = useHydrated();
  const account = useApp((s) => s.account);
  const session = useApp((s) => s.session);
  const kyc = useApp((s) => s.kyc);
  const snapshot = { account, session, kyc };
  const allowed = hydrated && (hold || canVisit(route, snapshot));
  const target = nextRoute(snapshot);

  useEffect(() => {
    if (hydrated && !allowed) router.replace(target as never);
  }, [hydrated, allowed, target]);

  return allowed;
}

/** Navigate forward, replacing the stack so Back doesn't return to finished steps. */
export function go(route: string) {
  router.replace(route as never);
}
