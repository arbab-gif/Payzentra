"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Check, Copy, ExternalLink, KeyRound, ShieldCheck, Smartphone } from "lucide-react";
import { AuthShell, PageLoading, PageTitle, StickyActions } from "@/components/AuthShell";
import { OtpInput } from "@/components/OtpInput";
import { Alert, Button, Card, Spinner } from "@/components/ui";
import { confirmTotpSetup, startTotpSetup } from "@/lib/api";
import { ROUTES } from "@/lib/store";
import { useGuard } from "@/lib/useGuard";

type Stage = "intro" | "scan" | "verify";

export default function SecureAccount() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("intro");
  const [setup, setSetup] = useState<{ secret: string; uri: string; qr: string } | null>(null);
  const [setupError, setSetupError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const allowed = useGuard(ROUTES.secure, done);

  useEffect(() => {
    if (stage !== "scan" || setup) return;
    let live = true;
    (async () => {
      try {
        const res = await startTotpSetup();
        if (!res.ok) throw new Error();
        const qr = await QRCode.toDataURL(res.data.uri, { margin: 1, width: 360, color: { dark: "#0d1230", light: "#ffffff" } });
        if (live) setSetup({ ...res.data, qr });
      } catch {
        if (live) setSetupError(true);
      }
    })();
    return () => {
      live = false;
    };
  }, [stage, setup]);

  const copy = async () => {
    if (!setup) return;
    await navigator.clipboard.writeText(setup.secret).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const verify = async (value = code) => {
    if (value.length !== 6 || loading) return;
    setLoading(true);
    setError(null);
    setDone(true); // hold the guard while we move to recovery codes
    const res = await confirmTotpSetup(value);
    setLoading(false);
    if (!res.ok) {
      setDone(false);
      setError(res.message);
      setCode("");
      return;
    }
    router.push(ROUTES.recoveryCodes);
  };

  if (!allowed) return <PageLoading />;

  if (stage === "intro") {
    return (
      <AuthShell step="secure">
        <div className="mb-6 grid size-14 place-items-center rounded-2xl bg-primary-soft text-primary">
          <ShieldCheck className="size-7" aria-hidden />
        </div>
        <PageTitle title="Secure your account">
          Every Payzentra account uses two-step sign-in. As well as your password, you&apos;ll enter a code from an
          authenticator app each time you log in or make a sensitive change.
        </PageTitle>
        <div className="flex flex-1 flex-col">
          <ol className="space-y-3">
            {[
              { Icon: Smartphone, t: "Get an authenticator app", b: "Google Authenticator, Microsoft Authenticator or any app that supports time-based codes." },
              { Icon: KeyRound, t: "Link it to Payzentra", b: "Scan a QR code or enter a setup key." },
              { Icon: ShieldCheck, t: "Save your recovery codes", b: "Use them if you ever lose access to your phone." },
            ].map(({ Icon, t, b }) => (
              <li key={t} className="flex gap-4 rounded-2xl border border-border bg-surface p-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface-2 text-primary">
                  <Icon className="size-5" aria-hidden />
                </span>
                <span>
                  <span className="block font-semibold text-text">{t}</span>
                  <span className="mt-0.5 block text-sm text-muted">{b}</span>
                </span>
              </li>
            ))}
          </ol>
          <StickyActions>
            <Button block onClick={() => setStage("scan")}>Set up authenticator</Button>
          </StickyActions>
        </div>
      </AuthShell>
    );
  }

  if (stage === "scan") {
    return (
      <AuthShell step="secure" back={() => setStage("intro")}>
        <PageTitle title="Link your authenticator app">
          Open your authenticator app, choose <b className="text-text">Add account</b>, then scan this code.
        </PageTitle>
        <div className="flex flex-1 flex-col">
          {setupError ? (
            <Alert
              tone="danger"
              title="We couldn't create your setup code"
              action={<Button size="sm" variant="secondary" onClick={() => { setSetupError(false); setSetup(null); }}>Try again</Button>}
            >
              Check your connection and try again.
            </Alert>
          ) : !setup ? (
            <Card className="grid h-72 place-items-center">
              <span className="flex items-center gap-2 text-sm text-muted"><Spinner className="size-4" /> Generating secure code…</span>
            </Card>
          ) : (
            <div className="space-y-4 animate-fade-up">
              <Card className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={setup.qr} alt="QR code to add Payzentra to your authenticator app" className="size-44 rounded-xl bg-white p-2" />
                <div className="w-full min-w-0 text-sm">
                  <p className="font-semibold text-text">Can&apos;t scan it?</p>
                  <p className="mt-1 text-muted">Enter this setup key in your app instead. Choose &ldquo;time-based&rdquo; if asked.</p>
                  <div className="mt-3 flex items-center gap-2 rounded-xl border border-border bg-bg-elevated p-2 pl-3">
                    <code className="min-w-0 flex-1 break-all font-mono text-[0.8rem] tracking-wider text-text">
                      {setup.secret.match(/.{1,4}/g)?.join(" ")}
                    </code>
                    <Button size="sm" variant="secondary" onClick={copy} aria-label="Copy setup key">
                      {copied ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
                      {copied ? "Copied" : "Copy"}
                    </Button>
                  </div>
                </div>
              </Card>
              <a
                href={setup.uri}
                className="flex items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm font-semibold text-primary hover:bg-primary-soft sm:hidden"
              >
                Open in authenticator app on this phone <ExternalLink className="size-4" />
              </a>
              <Alert tone="info">Keep this key private. Anyone with it can generate your sign-in codes.</Alert>
            </div>
          )}
          <StickyActions>
            <Button block disabled={!setup} onClick={() => setStage("verify")}>I&apos;ve added it — continue</Button>
          </StickyActions>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell step="secure" back={() => { setStage("scan"); setError(null); }}>
      <PageTitle title="Enter the 6-digit code">
        Type the code shown for <b className="text-text">Payzentra</b> in your authenticator app. Codes refresh every 30 seconds.
      </PageTitle>
      <div className="flex flex-1 flex-col">
        <div className="space-y-4">
          {error && <Alert tone="danger" title="Code didn't match">{error}</Alert>}
          <OtpInput
            value={code}
            onChange={(v) => { setCode(v); setError(null); }}
            onComplete={verify}
            error={!!error}
            disabled={loading}
            label="Authenticator code"
          />
        </div>
        <StickyActions>
          <Button block loading={loading} disabled={code.length !== 6} onClick={() => verify()}>
            {loading ? "Checking…" : "Turn on two-step sign-in"}
          </Button>
        </StickyActions>
      </div>
    </AuthShell>
  );
}
