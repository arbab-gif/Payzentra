"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BadgeCheck, Lock, UserX } from "lucide-react";
import { AuthShell, PageLoading, PageTitle, StickyActions } from "@/components/AuthShell";
import { Alert, Button, StatusHero } from "@/components/ui";
import { confirmIdentity } from "@/lib/api";
import { ROUTES, useApp } from "@/lib/store";
import { toast } from "@/lib/toast";
import { useGuard } from "@/lib/useGuard";

export default function ConfirmIdentity() {
  const router = useRouter();
  const kyc = useApp((s) => s.kyc);
  const setKyc = useApp((s) => s.setKyc);
  const [loading, setLoading] = useState(false);
  const [notMe, setNotMe] = useState(false);
  const allowed = useGuard(ROUTES.identityConfirm, loading || notMe);

  if (!allowed || !kyc.identity) return <PageLoading />;
  const id = kyc.identity;

  const confirm = async () => {
    setLoading(true);
    await confirmIdentity();
    router.push(ROUTES.selfie);
  };

  if (notMe) {
    return (
      <AuthShell step="id" saveAndExit>
        <div className="flex flex-1 flex-col pt-6">
          <StatusHero tone="warning" icon={<UserX className="size-10" />} title="These details aren't yours?">
            You can only open an account with your own {kyc.idType}. If you entered the wrong number, start this step again.
            If the record itself is wrong, it needs to be corrected with {kyc.idType === "BVN" ? "your bank" : "NIMC"} first.
          </StatusHero>
          <StickyActions>
            <Button
              block
              onClick={() => {
                setKyc({ identity: null, idNumber: "", consentAt: null });
                router.push(ROUTES.identity);
              }}
            >
              Enter a different number
            </Button>
            <Button
              block
              variant="secondary"
              onClick={() => toast({ tone: "info", title: "Support case opened", body: "In the live app this opens a support case for an identity issue." })}
            >
              Contact support
            </Button>
            <Button block variant="ghost" onClick={() => setNotMe(false)}>Go back</Button>
          </StickyActions>
        </div>
      </AuthShell>
    );
  }

  const rows: [string, string][] = [
    ["First name", id.firstName],
    ["Middle name", id.middleName || "—"],
    ["Last name", id.lastName],
    ["Date of birth", id.dob],
    ["Gender", id.gender],
    ["Phone on record", id.phoneMasked],
  ];

  return (
    <AuthShell step="id" saveAndExit>
      <div className="mb-5 flex items-center gap-2 text-sm font-semibold text-success">
        <BadgeCheck className="size-5" aria-hidden /> {kyc.idType} found
      </div>
      <PageTitle title="Is this you?">
        These details come from your {kyc.idType} record and will be used as your legal name on Payzentra.
      </PageTitle>
      <div className="flex flex-1 flex-col">
        <div className="space-y-4">
          <dl className="divide-y divide-border rounded-2xl border border-border bg-surface">
            {rows.map(([k, v]) => (
              <div key={k} className="flex items-center justify-between gap-4 px-4 py-3.5">
                <dt className="text-sm text-muted">{k}</dt>
                <dd className="flex items-center gap-2 text-right font-medium text-text">
                  {v} <Lock className="size-3.5 text-subtle" aria-label="Verified, can't be edited" />
                </dd>
              </div>
            ))}
          </dl>
          <Alert tone="info">
            Verified details can&apos;t be edited here. If something is spelled wrong, update it with {kyc.idType === "BVN" ? "your bank" : "NIMC"} and verify again.
          </Alert>
        </div>
        <StickyActions>
          <Button block loading={loading} onClick={confirm}>Yes, this is me</Button>
          <Button block variant="secondary" onClick={() => setNotMe(true)}>This isn&apos;t me</Button>
        </StickyActions>
      </div>
    </AuthShell>
  );
}
