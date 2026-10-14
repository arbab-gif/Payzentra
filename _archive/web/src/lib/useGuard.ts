"use client";

import { useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";
import { canVisit, nextRoute, useApp } from "./store";

const subscribeHydration = (cb: () => void) => useApp.persist.onFinishHydration(cb);

/** True once saved progress has loaded from the browser. */
export function useHydrated() {
  return useSyncExternalStore(
    subscribeHydration,
    () => useApp.persist.hasHydrated(),
    () => false,
  );
}

/**
 * Keeps the customer on the right step. If they open a page they're not
 * allowed on yet (or anymore), they're sent to where they should be.
 * Returns true when the page may render. Pages navigate forward themselves;
 * the guard only catches deep links and stale tabs.
 */
export function useGuard(route: string, hold = false) {
  const router = useRouter();
  const hydrated = useHydrated();
  const account = useApp((s) => s.account);
  const session = useApp((s) => s.session);
  const kyc = useApp((s) => s.kyc);
  const snapshot = { account, session, kyc };
  // `hold` lets a page finish showing a success state before moving on.
  const allowed = hydrated && (hold || canVisit(route, snapshot));
  const target = nextRoute(snapshot);

  useEffect(() => {
    if (hydrated && !allowed) router.replace(target);
  }, [hydrated, allowed, target, router]);

  return allowed;
}
