"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { CheckCircle2, KeyRound, Mail } from "lucide-react";
import { AuthShell, PageTitle, StickyActions } from "@/components/AuthShell";
import { OtpInput } from "@/components/OtpInput";
import { PasswordRules } from "@/components/PasswordRules";
import { Alert, Button, Field, PasswordField, StatusHero } from "@/components/ui";
import { requestPasswordReset, resetPassword, verifyResetCode } from "@/lib/api";
import { isEmail, passwordOk } from "@/lib/validation";

type Stage = "email" | "code" | "password" | "done";

export default function ForgotPasswordPage() {
  return (
    <Suspense>
      <ForgotPassword />
    </Suspense>
  );
}

function ForgotPassword() {
  const router = useRouter();
  const params = useSearchParams();
  const [stage, setStage] = useState<Stage>("email");
  const [email, setEmail] = useState(params.get("email") ?? "");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendCode = async (e?: FormEvent) => {
    e?.preventDefault();
    setSubmitted(true);
    if (!isEmail(email)) return;
    setLoading(true);
    await requestPasswordReset(email.trim());
    setLoading(false);
    setSubmitted(false);
    setStage("code");
  };

  const checkCode = async (value = code) => {
    if (value.length !== 6 || loading) return;
    setLoading(true);
    setError(null);
    const res = await verifyResetCode(value);
    setLoading(false);
    if (!res.ok) {
      setError(res.message + (res.attemptsLeft !== undefined ? ` ${res.attemptsLeft} attempts left.` : ""));
      setCode("");
      return;
    }
    setStage("password");
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (!passwordOk(password) || password !== confirm) return;
    setLoading(true);
    await resetPassword(email.trim(), password);
    setLoading(false);
    setStage("done");
  };

  if (stage === "done") {
    return (
      <AuthShell>
        <div className="flex flex-1 flex-col justify-center py-10">
          <StatusHero tone="success" icon={<CheckCircle2 className="size-10" />} title="Password updated">
            For your security we&apos;ve signed you out of all devices. Log in with your new password.
          </StatusHero>
          <Button className="mt-8" block onClick={() => router.push("/login")}>Log in</Button>
        </div>
      </AuthShell>
    );
  }

  if (stage === "password") {
    return (
      <AuthShell back={() => setStage("code")}>
        <PageTitle title="Create a new password">Choose a password you haven&apos;t used for Payzentra before.</PageTitle>
        <form onSubmit={save} noValidate className="flex flex-1 flex-col">
          <div className="space-y-5">
            <div className="space-y-3">
              <PasswordField
                label="New password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={submitted && !passwordOk(password) ? "Your password doesn't meet all the requirements." : null}
                autoFocus
              />
              <PasswordRules value={password} showErrors={submitted} />
            </div>
            <PasswordField
              label="Confirm new password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              error={submitted && password !== confirm ? "Passwords don't match." : null}
            />
          </div>
          <StickyActions>
            <Button type="submit" block loading={loading}>{loading ? "Saving…" : "Update password"}</Button>
          </StickyActions>
        </form>
      </AuthShell>
    );
  }

  if (stage === "code") {
    return (
      <AuthShell back={() => setStage("email")}>
        <div className="mb-6 grid size-14 place-items-center rounded-2xl bg-primary-soft text-primary"><Mail className="size-7" aria-hidden /></div>
        <PageTitle title="Enter your reset code">
          If an account exists for <b className="text-text">{email}</b>, we&apos;ve sent a 6-digit code to it.
        </PageTitle>
        <div className="flex flex-1 flex-col">
          <div className="space-y-4">
            {error && <Alert tone="danger" title={error} />}
            <OtpInput value={code} onChange={(v) => { setCode(v); setError(null); }} onComplete={checkCode} error={!!error} disabled={loading} />
            <button onClick={() => sendCode()} className="text-sm font-semibold text-primary hover:underline">Send a new code</button>
          </div>
          <StickyActions>
            <Button block loading={loading} disabled={code.length !== 6} onClick={() => checkCode()}>Continue</Button>
          </StickyActions>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell back="/login">
      <div className="mb-6 grid size-14 place-items-center rounded-2xl bg-primary-soft text-primary"><KeyRound className="size-7" aria-hidden /></div>
      <PageTitle title="Reset your password">Enter the email you use for Payzentra and we&apos;ll send you a code.</PageTitle>
      <form onSubmit={sendCode} noValidate className="flex flex-1 flex-col">
        <Field
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="name@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          prefix={<Mail className="size-[18px]" />}
          error={submitted && !isEmail(email) ? "Enter a valid email address." : null}
          autoFocus
        />
        <StickyActions>
          <Button type="submit" block loading={loading}>{loading ? "Sending…" : "Send reset code"}</Button>
        </StickyActions>
      </form>
    </AuthShell>
  );
}
