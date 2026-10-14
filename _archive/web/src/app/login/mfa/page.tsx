"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { KeyRound, Smartphone } from "lucide-react";
import { AuthShell, PageLoading, PageTitle, StickyActions } from "@/components/AuthShell";
import { OtpInput } from "@/components/OtpInput";
import { Alert, Button, Field } from "@/components/ui";
import { verifyLoginTotp, verifyRecoveryCode } from "@/lib/api";
import { nextRoute, ROUTES, useApp } from "@/lib/store";
import { useGuard } from "@/lib/useGuard";

export default function LoginMfa() {
  const router = useRouter();
  const signOut = useApp((s) => s.signOut);
  const remaining = useApp((s) => s.account?.recoveryCodes.length ?? 0);
  const [mode, setMode] = useState<"app" | "recovery">("app");
  const [code, setCode] = useState("");
  const [recovery, setRecovery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);
  const allowed = useGuard(ROUTES.loginMfa, leaving);

  const finish = () => {
    setLeaving(true);
    router.push(nextRoute(useApp.getState()));
  };

  const submitApp = async (value = code) => {
    if (value.length !== 6 || loading) return;
    setLoading(true);
    setError(null);
    const res = await verifyLoginTotp(value);
    setLoading(false);
    if (!res.ok) {
      setError(res.message);
      setCode("");
      return;
    }
    finish();
  };

  const submitRecovery = async () => {
    if (!recovery.trim()) return setError("Enter one of your recovery codes.");
    setLoading(true);
    setError(null);
    const res = await verifyRecoveryCode(recovery);
    setLoading(false);
    if (!res.ok) return setError(res.message);
    finish();
  };

  if (!allowed) return <PageLoading />;

  const cancel = () => {
    signOut();
    router.push(ROUTES.login);
  };

  return (
    <AuthShell back={cancel}>
      <div className="mb-6 grid size-14 place-items-center rounded-2xl bg-primary-soft text-primary">
        {mode === "app" ? <Smartphone className="size-7" aria-hidden /> : <KeyRound className="size-7" aria-hidden />}
      </div>
      {mode === "app" ? (
        <>
          <PageTitle title="Two-step verification">
            Enter the 6-digit code from your authenticator app for <b className="text-text">Payzentra</b>.
          </PageTitle>
          <div className="flex flex-1 flex-col">
            <div className="space-y-4">
              {error && <Alert tone="danger" title={error} />}
              <OtpInput
                value={code}
                onChange={(v) => { setCode(v); setError(null); }}
                onComplete={submitApp}
                error={!!error}
                disabled={loading}
                label="Authenticator code"
              />
            </div>
            <StickyActions>
              <Button block loading={loading} disabled={code.length !== 6} onClick={() => submitApp()}>
                {loading ? "Verifying…" : "Verify"}
              </Button>
              <Button variant="ghost" block onClick={() => { setMode("recovery"); setError(null); }}>
                Lost your phone? Use a recovery code
              </Button>
            </StickyActions>
          </div>
        </>
      ) : (
        <>
          <PageTitle title="Use a recovery code">
            Enter one of the recovery codes you saved when you set up two-step sign-in. Each code works once.
          </PageTitle>
          <div className="flex flex-1 flex-col">
            <div className="space-y-4">
              {error && <Alert tone="danger" title={error} />}
              <Field
                label="Recovery code"
                placeholder="xxxx-xxxx"
                autoComplete="one-time-code"
                autoCapitalize="none"
                spellCheck={false}
                value={recovery}
                onChange={(e) => { setRecovery(e.target.value); setError(null); }}
                hint={`You have ${remaining} unused code${remaining === 1 ? "" : "s"}.`}
                className="[&_input]:font-mono [&_input]:tracking-wider"
                autoFocus
              />
              <Alert tone="info" title="No codes left?">
                Contact support to recover your account. We&apos;ll verify your identity before restoring access.
              </Alert>
            </div>
            <StickyActions>
              <Button block loading={loading} onClick={submitRecovery}>{loading ? "Verifying…" : "Verify"}</Button>
              <Button variant="ghost" block onClick={() => { setMode("app"); setError(null); }}>Use authenticator app instead</Button>
            </StickyActions>
          </div>
        </>
      )}
    </AuthShell>
  );
}
