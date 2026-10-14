"use client";

import clsx from "clsx";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle2, Clock3, Info, ShieldAlert, Unlock } from "lucide-react";
import { AuthShell, PageLoading, StickyActions } from "@/components/AuthShell";
import { Alert, Button, StatusHero } from "@/components/ui";
import { restartAddressAfterRejection } from "@/lib/api";
import { ROUTES, useApp } from "@/lib/store";
import { toast } from "@/lib/toast";
import { useGuard } from "@/lib/useGuard";

export default function VerificationStatus() {
  const router = useRouter();
  const kyc = useApp((s) => s.kyc);
  const firstName = kyc.identity?.firstName;
  const [retrying, setRetrying] = useState(false);
  const allowed = useGuard(ROUTES.status, retrying);

  if (!allowed) return <PageLoading />;

  const toHome = () =>
    toast({ tone: "info", title: "Home screen is next", body: "The signed-in home isn't part of this build yet." });

  if (kyc.status === "verified") {
    return (
      <AuthShell asideTitle="You're all set." asideBody="Your identity is verified and your account is ready to use.">
        <div className="flex flex-1 flex-col pt-8">
          <StatusHero tone="success" icon={<CheckCircle2 className="size-10" />} title={`You're verified${firstName ? `, ${firstName}` : ""}!`}>
            Your account is ready. You can now add money, send to banks, pay bills and trade crypto.
          </StatusHero>
          <Unlocked />
          <StickyActions>
            <Button block onClick={toHome}>Go to my account</Button>
          </StickyActions>
        </div>
      </AuthShell>
    );
  }

  if (kyc.status === "rejected") {
    return (
      <AuthShell>
        <div className="flex flex-1 flex-col pt-8">
          <StatusHero tone="danger" icon={<ShieldAlert className="size-10" />} title="We couldn't verify your account">
            Your identity was confirmed, but there&apos;s a problem with one of your details.
          </StatusHero>
          <div className="mt-6">
            <Alert tone="danger" title="What needs fixing">{kyc.rejectionReason}</Alert>
          </div>
          <StickyActions>
            <Button
              block
              loading={retrying}
              onClick={async () => {
                setRetrying(true);
                await restartAddressAfterRejection();
                router.push(ROUTES.address);
              }}
            >
              Update my address
            </Button>
            <Button block variant="secondary" onClick={() => toast({ tone: "info", title: "Support case opened", body: "In the live app this opens a support case linked to your verification." })}>
              Contact support
            </Button>
          </StickyActions>
        </div>
      </AuthShell>
    );
  }

  // Pending review (manual check, either from the final decision or from failed selfies).
  return (
    <AuthShell asideTitle="Almost there." asideBody="Our team is reviewing your details. We'll email you as soon as it's done.">
      <div className="flex flex-1 flex-col pt-8">
        <StatusHero tone="warning" icon={<Clock3 className="size-10" />} title="Your verification is in review">
          {kyc.livenessLocked
            ? "A member of our team is checking your selfie against your ID."
            : "We need a little more time to check your details."}{" "}
          This usually takes up to 24 hours. We&apos;ll email you when it&apos;s done.
        </StatusHero>
        <ol className="mt-8 space-y-0 rounded-2xl border border-border bg-surface p-4" aria-label="Verification progress">
          {[
            { t: "Account created", done: true },
            { t: `${kyc.idType ?? "ID"} confirmed`, done: !!kyc.identityConfirmed },
            { t: "Selfie", done: kyc.livenessPassed, review: kyc.livenessLocked },
            { t: "Final review", review: true },
          ].map((s, i, arr) => (
            <li key={s.t} className="relative flex gap-3 pb-4 last:pb-0">
              {i < arr.length - 1 && <span className="absolute left-[11px] top-6 h-[calc(100%-16px)] w-0.5 bg-border" aria-hidden />}
              <span
                className={clsx(
                  "relative grid size-6 shrink-0 place-items-center rounded-full",
                  s.done ? "bg-success text-white" : s.review ? "bg-warning-soft text-warning" : "bg-surface-2 text-subtle",
                )}
              >
                {s.done ? <CheckCircle2 className="size-4" /> : <Clock3 className="size-3.5" />}
              </span>
              <span className="text-sm">
                <span className="font-medium text-text">{s.t}</span>
                <span className="block text-muted">{s.done ? "Done" : s.review ? "In review" : "Waiting"}</span>
              </span>
            </li>
          ))}
        </ol>
        <div className="mt-4" />
        <Alert tone="info" title="While you wait">
          You can look around your account, but adding, sending and trading money stays locked until you&apos;re verified.
        </Alert>
        <StickyActions>
          <Button block onClick={toHome}>Explore my account</Button>
        </StickyActions>
      </div>
    </AuthShell>
  );
}

function Unlocked() {
  return (
    <ul className="mt-8 grid grid-cols-2 gap-3">
      {[
        { t: "Add money", Icon: Unlock },
        { t: "Send to banks", Icon: Unlock },
        { t: "Pay bills", Icon: Unlock },
        { t: "Buy & sell crypto", Icon: Unlock },
      ].map(({ t, Icon }) => (
        <li key={t} className="flex items-center gap-2.5 rounded-xl border border-border bg-surface px-3.5 py-3 text-sm font-medium">
          <Icon className="size-4 text-success" aria-hidden /> {t}
        </li>
      ))}
      <li className="col-span-2 flex items-center gap-2.5 rounded-xl border border-dashed border-border px-3.5 py-3 text-sm text-muted">
        <Info className="size-4 shrink-0" aria-hidden /> Daily and monthly limits apply. You can raise them later from Settings.
      </li>
    </ul>
  );
}
