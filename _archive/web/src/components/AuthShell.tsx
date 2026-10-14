"use client";

import clsx from "clsx";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, FlaskConical, HelpCircle, LockKeyhole } from "lucide-react";
import { useDemoPanel } from "./Providers";
import type { ReactNode } from "react";
import { Logo } from "./ui";
import { useApp } from "@/lib/store";
import { toast } from "@/lib/toast";

export type StepKey =
  | "create"
  | "email"
  | "secure"
  | "details"
  | "id"
  | "selfie"
  | "address"
  | "review";

const STEPS: { key: StepKey; label: string; phase: "Account" | "Verification" }[] = [
  { key: "create", label: "Create account", phase: "Account" },
  { key: "email", label: "Verify email", phase: "Account" },
  { key: "secure", label: "Secure your account", phase: "Account" },
  { key: "details", label: "Personal details", phase: "Verification" },
  { key: "id", label: "BVN or NIN", phase: "Verification" },
  { key: "selfie", label: "Selfie check", phase: "Verification" },
  { key: "address", label: "Home address", phase: "Verification" },
  { key: "review", label: "Review & submit", phase: "Verification" },
];

export function AuthShell({
  step,
  back,
  children,
  saveAndExit,
  asideTitle,
  asideBody,
}: {
  step?: StepKey;
  back?: string | (() => void);
  children: ReactNode;
  saveAndExit?: boolean;
  asideTitle?: string;
  asideBody?: string;
}) {
  const router = useRouter();
  const signOut = useApp((s) => s.signOut);
  const index = step ? STEPS.findIndex((s) => s.key === step) : -1;
  const current = index >= 0 ? STEPS[index] : null;

  const goBack = () => (typeof back === "function" ? back() : back && router.push(back));
  const exit = () => {
    signOut();
    toast({ tone: "success", title: "Progress saved", body: "Log in any time to continue where you left off." });
    router.push("/");
  };

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[minmax(380px,0.85fr)_1.15fr]">
      {/* Brand + journey panel (desktop) */}
      <aside className="relative hidden overflow-hidden border-r border-border bg-bg-elevated lg:flex lg:flex-col">
        <div className="pointer-events-none absolute inset-0" style={{ background: "var(--glow)" }} />
        <div className="relative flex flex-1 flex-col px-12 py-10">
          <Link href="/" aria-label="Payzentra home">
            <Logo />
          </Link>
          <div className="mt-auto mb-auto pt-16">
            <h2 className="font-display text-[2rem] font-bold leading-tight tracking-tight text-text">
              {asideTitle ?? "Money, crypto and bills — in one secure place."}
            </h2>
            <p className="mt-3 max-w-sm text-muted">
              {asideBody ??
                "Set up takes about 5 minutes. Have your BVN or NIN ready and find somewhere with good light for a quick selfie."}
            </p>
            {current && (
              <ol className="mt-10 space-y-1" aria-label="Setup progress">
                {STEPS.map((s, i) => {
                  const done = i < index;
                  const active = i === index;
                  const newPhase = i === 0 || STEPS[i - 1].phase !== s.phase;
                  return (
                    <li key={s.key}>
                      {newPhase && (
                        <p className={clsx("mb-2 text-xs font-semibold uppercase tracking-wider text-subtle", i > 0 && "mt-5")}>
                          {s.phase}
                        </p>
                      )}
                      <div
                        className={clsx(
                          "flex items-center gap-3 rounded-lg px-2 py-1.5 text-sm",
                          active && "bg-primary-soft text-text font-semibold",
                          !active && done && "text-muted",
                          !active && !done && "text-subtle",
                        )}
                        aria-current={active ? "step" : undefined}
                      >
                        <span
                          className={clsx(
                            "grid size-6 place-items-center rounded-full border text-xs",
                            done && "border-success bg-success text-white",
                            active && "border-primary bg-primary text-on-primary",
                            !done && !active && "border-border-strong",
                          )}
                        >
                          {done ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
                        </span>
                        {s.label}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
          <p className="flex items-center gap-2 text-sm text-subtle">
            <LockKeyhole className="size-4" aria-hidden /> Your details are encrypted and only used to verify you.
          </p>
        </div>
      </aside>

      {/* Content */}
      <main className="flex min-h-dvh flex-col">
        <header className="sticky top-0 z-10 border-b border-border/60 bg-bg/85 backdrop-blur lg:static lg:border-0 lg:bg-transparent">
          <div className="mx-auto flex h-16 w-full max-w-xl items-center gap-3 px-4 sm:px-6">
            {back ? (
              <button
                onClick={goBack}
                className="-ml-2 grid size-10 place-items-center rounded-xl text-text hover:bg-surface-2"
                aria-label="Back"
              >
                <ArrowLeft className="size-5" />
              </button>
            ) : (
              <Link href="/" className="lg:hidden" aria-label="Payzentra home">
                <Logo wordmark={false} />
              </Link>
            )}
            {current && (
              <div className="min-w-0 flex-1 lg:hidden">
                <p className="truncate text-xs font-medium text-muted">
                  Step {index + 1} of {STEPS.length} · {current.label}
                </p>
                <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full rounded-full bg-primary transition-[width] duration-500"
                    style={{ width: `${((index + 1) / STEPS.length) * 100}%` }}
                  />
                </div>
              </div>
            )}
            <div className="ml-auto flex items-center gap-1">
              <button
                onClick={() => useDemoPanel.getState().setOpen(true)}
                className="grid size-10 place-items-center rounded-xl text-primary hover:bg-surface-2 sm:hidden"
                aria-label="Open demo controls"
              >
                <FlaskConical className="size-5" />
              </button>
              {saveAndExit && (
                <button onClick={exit} className="rounded-lg px-2.5 py-2 text-sm font-medium text-muted hover:text-text">
                  Save & exit
                </button>
              )}
              <a
                href="#help"
                onClick={(e) => {
                  e.preventDefault();
                  toast({ tone: "info", title: "Help & support", body: "In the live app this opens support chat and help articles." });
                }}
                className="grid size-10 place-items-center rounded-xl text-muted hover:bg-surface-2 hover:text-text"
                aria-label="Help"
              >
                <HelpCircle className="size-5" />
              </a>
            </div>
          </div>
        </header>
        <div className="mx-auto flex w-full max-w-xl flex-1 flex-col px-4 pb-10 pt-4 sm:px-6 lg:justify-center lg:pt-0">
          {children}
        </div>
      </main>
    </div>
  );
}

export function PageTitle({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-7 animate-fade-up">
      {eyebrow && <p className="mb-2 text-sm font-semibold text-primary">{eyebrow}</p>}
      <h1 className="font-display text-[1.65rem] font-bold leading-tight tracking-tight text-text sm:text-3xl">
        {title}
      </h1>
      {children && <div className="mt-2.5 text-[0.95rem] leading-relaxed text-muted">{children}</div>}
    </div>
  );
}

/** Pinned to the bottom on phones, inline on larger screens. */
export function StickyActions({ children }: { children: ReactNode }) {
  return (
    <div className="sticky bottom-0 -mx-4 mt-auto border-t border-border/60 bg-bg/90 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur sm:static sm:mx-0 sm:mt-8 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
      <div className="flex flex-col gap-2.5">{children}</div>
    </div>
  );
}

export function PageLoading() {
  return (
    <div className="grid min-h-dvh place-items-center" aria-busy="true" aria-label="Loading">
      <div className="size-8 animate-spin rounded-full border-2 border-border border-t-primary" />
    </div>
  );
}
