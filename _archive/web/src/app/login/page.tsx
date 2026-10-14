"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Mail } from "lucide-react";
import { AuthShell, PageTitle, StickyActions } from "@/components/AuthShell";
import { Alert, Button, Field, PasswordField } from "@/components/ui";
import { login } from "@/lib/api";
import { nextRoute, useApp } from "@/lib/store";
import { useHydrated } from "@/lib/useGuard";
import { isEmail } from "@/lib/validation";

export default function Login() {
  const router = useRouter();
  const hydrated = useHydrated();
  const savedEmail = useApp((s) => s.account?.email ?? "");
  const authenticated = useApp((s) => s.session.authenticated && s.session.mfaVerified);
  const [typedEmail, setEmail] = useState<string | null>(null);
  // Prefill the email of the account on this device until the customer types.
  const email = typedEmail ?? savedEmail;
  const [password, setPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ code: string; message: string } | null>(null);

  // Already signed in: carry on where they left off.
  useEffect(() => {
    if (hydrated && authenticated) router.replace(nextRoute(useApp.getState()));
  }, [hydrated, authenticated, router]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setError(null);
    if (!isEmail(email) || !password) return;
    setLoading(true);
    const res = await login(email.trim(), password);
    setLoading(false);
    if (!res.ok) return setError(res);
    router.push(nextRoute(useApp.getState()));
  };

  return (
    <AuthShell back="/" asideTitle="Welcome back." asideBody="Log in to pick up where you left off. You'll need your authenticator app.">
      <PageTitle title="Log in to Payzentra">Enter your email and password.</PageTitle>
      <form onSubmit={onSubmit} noValidate className="flex flex-1 flex-col">
        <div className="space-y-5">
          {error && (
            <Alert
              tone={error.code === "LOCKED" ? "warning" : "danger"}
              title={error.code === "LOCKED" ? "Sign-in paused" : "Couldn't log you in"}
              action={
                error.code === "LOCKED" ? (
                  <Link href={`/forgot-password?email=${encodeURIComponent(email)}`} className="text-sm font-semibold text-primary hover:underline">
                    Reset password
                  </Link>
                ) : undefined
              }
            >
              {error.message}
            </Alert>
          )}
          <Field
            label="Email address"
            type="email"
            autoComplete="username"
            inputMode="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            prefix={<Mail className="size-[18px]" />}
            error={submitted && !isEmail(email) ? "Enter a valid email address." : null}
          />
          <div>
            <PasswordField
              label="Password"
              autoComplete="current-password"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={submitted && !password ? "Enter your password." : null}
            />
            <div className="mt-2 text-right">
              <Link href={`/forgot-password${email ? `?email=${encodeURIComponent(email)}` : ""}`} className="text-sm font-semibold text-primary hover:underline">
                Forgot password?
              </Link>
            </div>
          </div>
        </div>
        <StickyActions>
          <Button type="submit" block loading={loading}>{loading ? "Logging in…" : "Log in"}</Button>
          <p className="text-center text-sm text-muted">
            New to Payzentra? <Link href="/signup" className="font-semibold text-primary hover:underline">Create an account</Link>
          </p>
        </StickyActions>
      </form>
    </AuthShell>
  );
}
