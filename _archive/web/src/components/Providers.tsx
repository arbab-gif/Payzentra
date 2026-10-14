"use client";

import clsx from "clsx";
import { usePathname, useRouter } from "next/navigation";
import { create } from "zustand";
import { useEffect, type ReactNode } from "react";
import { FlaskConical, Mail, Moon, RotateCcw, Sun, X, CheckCircle2, Info, XCircle } from "lucide-react";
import { useApp, type Scenarios } from "@/lib/store";
import { useToasts } from "@/lib/toast";
import { DEMO_BAD_TOTP, DEMO_EMAIL_CODE, DEMO_EXPIRED_CODE } from "@/lib/api";

export function Providers({ children }: { children: ReactNode }) {
  const theme = useApp((s) => s.theme);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  return (
    <>
      {children}
      <Toaster />
      <DemoPanel />
    </>
  );
}

function Toaster() {
  const { toasts, dismiss } = useToasts();
  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-3 z-50 flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-4 sm:top-4 sm:items-end"
      aria-live="polite"
    >
      {toasts.map((t) => {
        const Icon = t.tone === "inbox" ? Mail : t.tone === "success" ? CheckCircle2 : t.tone === "danger" ? XCircle : Info;
        return (
          <div
            key={t.id}
            className="pointer-events-auto flex w-full max-w-sm gap-3 rounded-2xl border border-border bg-surface p-3.5 shadow-card animate-fade-up"
          >
            <span
              className={clsx(
                "grid size-9 shrink-0 place-items-center rounded-xl",
                t.tone === "success" && "bg-success-soft text-success",
                t.tone === "danger" && "bg-danger-soft text-danger",
                (t.tone === "info" || t.tone === "inbox") && "bg-primary-soft text-primary",
              )}
            >
              <Icon className="size-[18px]" aria-hidden />
            </span>
            <div className="min-w-0 flex-1 text-sm">
              <p className="font-semibold text-text">{t.title}</p>
              {t.body && <p className="mt-0.5 leading-relaxed text-muted">{t.body}</p>}
            </div>
            <button onClick={() => dismiss(t.id)} className="self-start text-subtle hover:text-text" aria-label="Dismiss">
              <X className="size-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

const OPTIONS: { key: keyof Scenarios; label: string; values: [string, string][] }[] = [
  { key: "signup", label: "Sign up", values: [["ok", "Success"], ["duplicate", "Email already registered"]] },
  { key: "login", label: "Log in", values: [["ok", "Success"], ["wrong_password", "Wrong password"], ["locked", "Temporarily locked"]] },
  {
    key: "identity",
    label: "BVN / NIN check",
    values: [
      ["match", "Match"],
      ["mismatch", "Details don't match"],
      ["not_found", "Number not found"],
      ["duplicate", "Linked to another account"],
      ["provider_down", "Provider unavailable"],
    ],
  },
  {
    key: "liveness",
    label: "Selfie / face match",
    values: [["pass", "Pass"], ["fail_once", "Fail once, then pass"], ["fail_always", "Fail every time → manual review"]],
  },
  { key: "camera", label: "Camera", values: [["simulated", "Simulated camera"], ["real", "Use real camera"]] },
  { key: "decision", label: "Final decision", values: [["verified", "Verified"], ["pending", "Pending review"], ["rejected", "Rejected"]] },
];

/** Lets the mobile header open the demo panel too. */
export const useDemoPanel = create<{ open: boolean; setOpen: (v: boolean) => void }>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}));

function DemoPanel() {
  const { open, setOpen } = useDemoPanel();
  const router = useRouter();
  const pathname = usePathname();
  const { scenarios, setScenario, resetAll, theme, setTheme } = useApp();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={clsx(
          "fixed bottom-5 right-4 z-40 items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-2.5 text-sm font-semibold text-text shadow-card hover:border-primary sm:flex",
          // On phones the step header carries this button instead, so it never covers the main action.
          pathname === "/" ? "flex" : "hidden",
        )}
        aria-label="Open demo controls"
      >
        <FlaskConical className="size-4 text-primary" /> Demo
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50" onClick={() => setOpen(false)}>
          <div
            role="dialog"
            aria-label="Demo controls"
            className="flex h-full w-full max-w-sm flex-col overflow-y-auto border-l border-border bg-bg-elevated p-5 animate-fade-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">Demo controls</h2>
              <button onClick={() => setOpen(false)} className="grid size-9 place-items-center rounded-lg hover:bg-surface-2" aria-label="Close">
                <X className="size-5" />
              </button>
            </div>
            <p className="mt-1 text-sm text-muted">
              Not part of the product. Choose what the simulated backend returns so you can see every state.
            </p>

            <div className="mt-5 rounded-xl border border-border bg-surface p-3.5 text-sm">
              <p className="font-semibold">Test codes</p>
              <ul className="mt-2 space-y-1 text-muted">
                <li>Email code: <b className="text-text">{DEMO_EMAIL_CODE}</b></li>
                <li>Expired email code: <b className="text-text">{DEMO_EXPIRED_CODE}</b></li>
                <li>Authenticator: any 6 digits · <b className="text-text">{DEMO_BAD_TOTP}</b> = wrong</li>
                <li>BVN / NIN: any 11 digits</li>
              </ul>
            </div>

            <div className="mt-5 space-y-4">
              {OPTIONS.map((o) => (
                <label key={o.key} className="block">
                  <span className="text-sm font-medium">{o.label}</span>
                  <select
                    value={scenarios[o.key]}
                    onChange={(e) => setScenario(o.key, e.target.value as never)}
                    className="mt-1.5 h-10 w-full rounded-lg border border-border bg-surface px-2.5 text-sm"
                  >
                    {o.values.map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </label>
              ))}
            </div>

            <div className="mt-6 flex gap-2">
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="flex h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-surface text-sm font-medium"
              >
                {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
                {theme === "dark" ? "Light mode" : "Dark mode"}
              </button>
              <button
                onClick={() => {
                  resetAll();
                  setOpen(false);
                  router.push("/");
                }}
                className="flex h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-danger/40 text-sm font-medium text-danger"
              >
                <RotateCcw className="size-4" /> Start over
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
