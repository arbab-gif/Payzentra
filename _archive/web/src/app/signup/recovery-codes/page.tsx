"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, CheckCircle2, Copy, Download } from "lucide-react";
import { AuthShell, PageLoading, PageTitle, StickyActions } from "@/components/AuthShell";
import { Alert, Button, Checkbox } from "@/components/ui";
import { ROUTES, useApp } from "@/lib/store";
import { useGuard } from "@/lib/useGuard";

const NO_CODES: string[] = [];

export default function RecoveryCodes() {
  const router = useRouter();
  const codes = useApp((s) => s.account?.recoveryCodes ?? NO_CODES);
  const email = useApp((s) => s.account?.email ?? "");
  const setAccount = useApp((s) => s.setAccount);
  const [saved, setSaved] = useState(false);
  const [tried, setTried] = useState(false);
  const [copied, setCopied] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const allowed = useGuard(ROUTES.recoveryCodes, leaving);

  const text = `Payzentra recovery codes for ${email}\nEach code can be used once.\n\n${codes.join("\n")}\n`;

  const copy = async () => {
    await navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const download = () => {
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: "payzentra-recovery-codes.txt" });
    a.click();
    URL.revokeObjectURL(url);
  };

  const next = () => {
    setTried(true);
    if (!saved) return;
    setLeaving(true);
    setAccount({ recoveryCodesSaved: true });
    router.push(ROUTES.kycIntro);
  };

  if (!allowed) return <PageLoading />;

  return (
    <AuthShell step="secure">
      <div className="mb-5 flex items-center gap-2 text-sm font-semibold text-success">
        <CheckCircle2 className="size-5" aria-hidden /> Two-step sign-in is on
      </div>
      <PageTitle title="Save your recovery codes">
        If you lose your phone, you can use one of these codes to sign in. Each code works once. Keep them somewhere safe and private.
      </PageTitle>

      <div className="flex flex-1 flex-col">
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-surface p-4">
            <ul className="grid grid-cols-2 gap-x-4 gap-y-2.5 font-mono text-[0.95rem] tracking-wider text-text" aria-label="Recovery codes">
              {codes.map((c, i) => (
                <li key={c} className="flex gap-2">
                  <span className="w-5 text-right text-subtle">{i + 1}.</span> {c}
                </li>
              ))}
            </ul>
            <div className="mt-4 grid grid-cols-2 gap-2 border-t border-border pt-4">
              <Button size="md" variant="secondary" onClick={copy}>
                {copied ? <Check className="size-4 text-success" /> : <Copy className="size-4" />} {copied ? "Copied" : "Copy all"}
              </Button>
              <Button size="md" variant="secondary" onClick={download}>
                <Download className="size-4" /> Download
              </Button>
            </div>
          </div>
          <Alert tone="warning">
            Payzentra staff will never ask for these codes. You won&apos;t be able to see them again after this step.
          </Alert>
          <Checkbox checked={saved} onChange={setSaved} error={tried && !saved ? "Confirm you've saved your codes to continue." : null}>
            I&apos;ve saved my recovery codes somewhere safe.
          </Checkbox>
        </div>
        <StickyActions>
          <Button block onClick={next}>Continue to identity verification</Button>
        </StickyActions>
      </div>
    </AuthShell>
  );
}
