"use client";

import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Bitcoin,
  Fingerprint,
  Landmark,
  ReceiptText,
  ShieldCheck,
  Smartphone,
  Zap,
} from "lucide-react";
import { Button, Logo } from "@/components/ui";
import { nextRoute, useApp } from "@/lib/store";
import { useHydrated } from "@/lib/useGuard";

const FEATURES = [
  { Icon: Landmark, title: "Naira account", body: "Fund your wallet by bank transfer and send money to any Nigerian bank." },
  { Icon: Bitcoin, title: "Crypto made simple", body: "Buy, sell, swap and hold BTC, ETH, USDT and USDC — with fees shown upfront." },
  { Icon: ReceiptText, title: "Bills & airtime", body: "Top up airtime and data, pay electricity, TV and internet in seconds." },
  { Icon: ShieldCheck, title: "Protected by default", body: "Two-step sign-in and verified identity on every account." },
];

const HOW = [
  { Icon: Smartphone, title: "Create your account", body: "Sign up with your email and secure it with an authenticator app." },
  { Icon: Fingerprint, title: "Verify your identity", body: "Use your BVN or NIN and take a quick selfie." },
  { Icon: Zap, title: "Start moving money", body: "Once verified, add money, pay bills and trade crypto." },
];

export default function Welcome() {
  const hydrated = useHydrated();
  const app = useApp();
  const resume = hydrated && app.account && app.session.authenticated ? nextRoute(app) : null;

  return (
    <div className="relative min-h-dvh overflow-x-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[640px]" style={{ background: "var(--glow)" }} />

      {/* Nav */}
      <header className="relative z-10 mx-auto flex h-18 max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Logo />
        <nav className="flex items-center gap-1 sm:gap-2" aria-label="Main">
          <a href="#features" className="hidden rounded-lg px-3 py-2 text-sm font-medium text-muted hover:text-text md:block">Features</a>
          <a href="#how" className="hidden rounded-lg px-3 py-2 text-sm font-medium text-muted hover:text-text md:block">How it works</a>
          <a href="#security" className="hidden rounded-lg px-3 py-2 text-sm font-medium text-muted hover:text-text md:block">Security</a>
          <Link href="/login" className="rounded-lg px-3 py-2 text-sm font-semibold text-text hover:bg-surface-2">Log in</Link>
          <Button href="/signup" size="sm" className="px-4">Get started</Button>
        </nav>
      </header>

      {resume && (
        <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col gap-3 rounded-2xl border border-primary/40 bg-primary-soft p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-text">
              <b>Welcome back.</b> You&apos;re part-way through setting up your account.
            </p>
            <Button href={resume} size="sm">Continue setup <ArrowRight className="size-4" /></Button>
          </div>
        </div>
      )}

      {/* Hero */}
      <section className="relative z-10 mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-10 sm:px-6 lg:grid-cols-2 lg:pt-20">
        <div className="animate-fade-up">
          <p className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/70 px-3 py-1 text-xs font-semibold text-muted">
            <span className="size-1.5 rounded-full bg-success" /> Built for Nigeria
          </p>
          <h1 className="mt-5 font-display text-[2.5rem] font-extrabold leading-[1.05] tracking-tight text-text sm:text-6xl">
            Your naira, crypto and bills. <span className="text-primary">One app.</span>
          </h1>
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-muted">
            Send money, pay bills and trade crypto from a single secure account. Set up in minutes with your BVN or NIN.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button href="/signup" className="sm:px-7">Create free account <ArrowRight className="size-4" /></Button>
            <Button href="/login" variant="secondary" className="sm:px-7">I already have an account</Button>
          </div>
          <p className="mt-4 text-xs text-subtle">
            By continuing you agree to our <a href="#legal" className="underline hover:text-text">Terms</a> and{" "}
            <a href="#legal" className="underline hover:text-text">Privacy Policy</a>.
          </p>
        </div>
        <HeroVisual />
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="font-display text-3xl font-bold tracking-tight">Everything in one account</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ Icon, title, body }) => (
            <div key={title} className="rounded-2xl border border-border bg-surface p-5">
              <span className="grid size-11 place-items-center rounded-xl bg-primary-soft text-primary">
                <Icon className="size-5" aria-hidden />
              </span>
              <h3 className="mt-4 font-semibold text-text">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="relative z-10 mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="font-display text-3xl font-bold tracking-tight">Get started in three steps</h2>
        <ol className="mt-8 grid gap-4 md:grid-cols-3">
          {HOW.map(({ Icon, title, body }, i) => (
            <li key={title} className="relative rounded-2xl border border-border bg-surface p-5">
              <span className="absolute right-5 top-5 font-display text-4xl font-extrabold text-border">{i + 1}</span>
              <Icon className="size-6 text-primary" aria-hidden />
              <h3 className="mt-4 font-semibold">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Security */}
      <section id="security" className="relative z-10 mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-8 rounded-3xl border border-border bg-surface p-6 sm:p-10 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl font-bold tracking-tight">Security isn&apos;t an add-on</h2>
            <p className="mt-3 text-muted">
              Every account uses an authenticator app for sign-in, and we verify every customer&apos;s identity before money can move.
            </p>
          </div>
          <ul className="space-y-3 text-sm">
            {[
              "Two-step sign-in with an authenticator app on every account",
              "Identity checked against your BVN or NIN with a live selfie",
              "See and sign out of your devices at any time",
              "Your ID details are encrypted and never shared for marketing",
            ].map((t) => (
              <li key={t} className="flex gap-3">
                <ShieldCheck className="size-5 shrink-0 text-success" aria-hidden /> <span className="text-text">{t}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA + footer */}
      <section className="relative z-10 mx-auto max-w-6xl px-4 pb-16 pt-4 text-center sm:px-6">
        <h2 className="font-display text-3xl font-bold tracking-tight">Ready when you are</h2>
        <p className="mt-2 text-muted">It takes about 5 minutes to set up.</p>
        <Button href="/signup" className="mt-6 px-8">Create free account</Button>
      </section>

      <footer id="legal" className="relative z-10 border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-start md:justify-between">
          <div>
            <Logo />
            <p className="mt-3 max-w-sm text-xs leading-relaxed text-subtle">
              [Regulatory disclosure placeholder — licence and partner bank wording to be provided by Payzentra compliance.]
            </p>
          </div>
          <nav className="grid grid-cols-2 gap-x-12 gap-y-2 text-sm" aria-label="Footer">
            {["Help centre", "Contact support", "Terms of use", "Privacy policy", "Cookie policy", "Complaints"].map((l) => (
              <a key={l} href="#legal" className="text-muted hover:text-text">{l}</a>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
}

function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-md animate-fade-up lg:max-w-none" aria-hidden>
      <div className="relative rounded-3xl border border-border bg-surface/80 p-5 shadow-card backdrop-blur sm:p-6">
        <p className="text-sm text-muted">Total balance</p>
        <p className="mt-1 font-display text-3xl font-bold tracking-tight sm:text-4xl">₦1,284,500.00</p>
        <div className="mt-5 grid grid-cols-3 gap-2.5">
          {["Add money", "Send", "Pay bills"].map((a) => (
            <div key={a} className="rounded-xl bg-surface-2 py-3 text-center text-xs font-semibold text-text">{a}</div>
          ))}
        </div>
        <div className="mt-5 space-y-2.5">
          {[
            { c: "#f7931a", s: "₿", n: "Bitcoin", v: "0.0184 BTC", d: "+2.4%" },
            { c: "#26a17b", s: "₮", n: "Tether", v: "250.00 USDT", d: "0.0%" },
          ].map((r) => (
            <div key={r.n} className="flex items-center gap-3 rounded-xl border border-border px-3 py-2.5">
              <span className="grid size-9 place-items-center rounded-full text-sm font-bold text-white" style={{ background: r.c }}>{r.s}</span>
              <span className="flex-1 text-sm font-medium">{r.n}</span>
              <span className="text-right text-sm">
                <span className="block font-semibold">{r.v}</span>
                <span className="text-xs text-success">{r.d}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="absolute -bottom-6 -left-2 flex items-center gap-3 rounded-2xl border border-border bg-bg-elevated px-4 py-3 shadow-card sm:-left-8">
        <span className="grid size-9 place-items-center rounded-full bg-success-soft text-success"><ShieldCheck className="size-5" /></span>
        <span className="text-sm"><b className="block">Identity verified</b><span className="text-muted">BVN · Selfie</span></span>
      </div>
      <div className="absolute -right-2 -top-5 flex items-center gap-2 rounded-2xl border border-border bg-bg-elevated px-3.5 py-2.5 text-sm shadow-card sm:-right-6">
        <ArrowUpRight className="size-4 text-primary" /> TV subscription paid · ₦12,500
      </div>
    </div>
  );
}
