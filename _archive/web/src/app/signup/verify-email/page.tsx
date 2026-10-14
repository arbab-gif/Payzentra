"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CheckCircle2, MailCheck } from "lucide-react";
import { AuthShell, PageLoading, PageTitle, StickyActions } from "@/components/AuthShell";
import { OtpInput } from "@/components/OtpInput";
import { Alert, Button, StatusHero } from "@/components/ui";
import { EMAIL_CODE_TTL_MS, resendEmailCode, verifyEmailCode } from "@/lib/api";
import { ROUTES, useApp } from "@/lib/store";
import { useGuard } from "@/lib/useGuard";

const RESEND_AFTER = 30;

/** Seconds left until `deadline`, ticking once a second. */
function useSecondsUntil(deadline: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  return Math.max(0, Math.ceil((deadline - now) / 1000));
}

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

export default function VerifyEmail() {
  const router = useRouter();
  const email = useApp((s) => s.account?.email);
  const resetAll = useApp((s) => s.resetAll);
  const [code, setCode] = useState("");
  const [sentAt, setSentAt] = useState(() => Date.now());
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<{ code: string; message: string; attemptsLeft?: number } | null>(null);
  const [done, setDone] = useState(false);
  const allowed = useGuard(ROUTES.verifyEmail, done || loading);

  const resendIn = useSecondsUntil(sentAt + RESEND_AFTER * 1000);
  const expiresIn = useSecondsUntil(sentAt + EMAIL_CODE_TTL_MS);
  const expired = expiresIn === 0 || error?.code === "EXPIRED";
  const locked = error?.code === "LOCKED";

  const submit = async (value = code) => {
    if (value.length !== 6 || loading) return;
    setLoading(true);
    setError(null);
    const res = await verifyEmailCode(value);
    setLoading(false);
    if (!res.ok) {
      setError(res);
      setCode("");
      return;
    }
    setDone(true);
    setTimeout(() => router.push(ROUTES.secure), 1400);
  };

  const resend = async () => {
    setResending(true);
    await resendEmailCode();
    setResending(false);
    setError(null);
    setCode("");
    setSentAt(Date.now());
  };

  if (!allowed) return <PageLoading />;

  if (done) {
    return (
      <AuthShell step="email">
        <div className="flex flex-1 flex-col justify-center py-16">
          <StatusHero tone="success" icon={<CheckCircle2 className="size-10" />} title="Email verified">
            Next, let&apos;s secure your account.
          </StatusHero>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell step="email">
      <div className="mb-6 grid size-14 place-items-center rounded-2xl bg-primary-soft text-primary">
        <MailCheck className="size-7" aria-hidden />
      </div>
      <PageTitle title="Check your email">
        We sent a 6-digit code to <b className="text-text">{email}</b>. Enter it below to confirm it&apos;s you.
      </PageTitle>

      <div className="flex flex-1 flex-col">
        <div className="space-y-4">
          {error && !expired && !locked && (
            <Alert tone="danger" title={error.message}>
              {error.attemptsLeft !== undefined &&
                `You have ${error.attemptsLeft} attempt${error.attemptsLeft === 1 ? "" : "s"} left.`}
            </Alert>
          )}
          {expired && (
            <Alert tone="warning" title="This code has expired">
              Codes last 10 minutes. Send a new one to continue.
            </Alert>
          )}
          {locked && (
            <Alert tone="danger" title="Too many incorrect attempts">
              For your security this code no longer works. Send a new code to try again.
            </Alert>
          )}

          <OtpInput
            value={code}
            onChange={(v) => {
              setCode(v);
              if (error?.code === "INVALID") setError(null);
            }}
            onComplete={submit}
            error={!!error && !expired}
            disabled={loading || expired || locked}
          />

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted">
              {expired ? "Code expired" : <>Code expires in <b className="tabular-nums text-text">{mmss(expiresIn)}</b></>}
            </span>
            {resendIn > 0 && !expired && !locked ? (
              <span className="tabular-nums text-subtle">Resend in {resendIn}s</span>
            ) : (
              <button onClick={resend} disabled={resending} className="font-semibold text-primary hover:underline disabled:opacity-50">
                {resending ? "Sending…" : "Send a new code"}
              </button>
            )}
          </div>

          <div className="rounded-xl border border-border bg-surface p-4 text-sm text-muted">
            <p className="font-medium text-text">Can&apos;t find it?</p>
            <p className="mt-1">Check your spam or promotions folder. Emails can take a minute to arrive.</p>
          </div>
        </div>

        <StickyActions>
          <Button block onClick={() => submit()} loading={loading} disabled={code.length !== 6 || expired || locked}>
            {loading ? "Verifying…" : "Verify email"}
          </Button>
          <Button
            variant="ghost"
            block
            onClick={() => {
              resetAll();
              router.push(ROUTES.signup);
            }}
          >
            Use a different email
          </Button>
        </StickyActions>
      </div>
    </AuthShell>
  );
}
