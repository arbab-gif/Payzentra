"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BadgeCheck, Lock, ShieldCheck } from "lucide-react";
import { AuthShell, PageLoading, PageTitle, StickyActions } from "@/components/AuthShell";
import { Button, StatusHero } from "@/components/ui";
import { submitVerification } from "@/lib/api";
import { ROUTES, useApp } from "@/lib/store";
import { useGuard } from "@/lib/useGuard";

export default function Review() {
  const router = useRouter();
  const kyc = useApp((s) => s.kyc);
  const email = useApp((s) => s.account?.email);
  const [submitting, setSubmitting] = useState(false);
  const allowed = useGuard(ROUTES.review, submitting);

  if (!allowed || !kyc.identity || !kyc.address) return <PageLoading />;

  const submit = async () => {
    setSubmitting(true);
    await submitVerification();
    router.push(ROUTES.status);
  };

  if (submitting) {
    return (
      <AuthShell step="review">
        <div className="flex flex-1 flex-col justify-center py-12">
          <StatusHero tone="info" icon={<ShieldCheck className="size-10" />} title="Submitting your verification" pulse>
            Please keep this page open.
          </StatusHero>
        </div>
      </AuthShell>
    );
  }

  const id = kyc.identity;
  const a = kyc.address;
  const masked = `${kyc.idNumber.slice(0, 3)}••••••${kyc.idNumber.slice(-2)}`;

  return (
    <AuthShell step="review" back={ROUTES.address} saveAndExit>
      <PageTitle title="Check and submit">Make sure everything is correct before you submit.</PageTitle>
      <div className="flex flex-1 flex-col">
        <div className="space-y-4">
          <Section title="Identity" note={<><BadgeCheck className="size-4" /> Verified with {kyc.idType}</>}>
            <Row k="Legal name" v={[id.firstName, id.middleName, id.lastName].filter(Boolean).join(" ")} locked />
            <Row k="Date of birth" v={id.dob} locked />
            <Row k={kyc.idType ?? "ID"} v={masked} locked />
            <Row k="Selfie" v="Matched" locked />
          </Section>
          <Section title="Contact">
            <Row k="Email" v={email ?? ""} />
            <Row k="Phone" v={`+234 ${kyc.phone.replace(/(\d{3})(\d{3})(\d+)/, "$1 $2 $3")}`} />
          </Section>
          <Section title="Home address" edit={ROUTES.address}>
            <p className="px-4 py-3.5 text-sm leading-relaxed text-text">
              {a.line1}
              {a.line2 && <>, {a.line2}</>}
              <br />
              {a.city}, {a.lga} LGA, {a.state} {a.postcode}
            </p>
          </Section>
          <p className="text-sm text-muted">
            By submitting, you confirm this information is true and belongs to you. Giving false information may lead to your account being closed.
          </p>
        </div>
        <StickyActions>
          <Button block onClick={submit}>Submit for verification</Button>
        </StickyActions>
      </div>
    </AuthShell>
  );
}

function Section({ title, note, edit, children }: { title: string; note?: React.ReactNode; edit?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-surface">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold text-text">{title}</h2>
        {note && <span className="flex items-center gap-1.5 text-xs font-semibold text-success">{note}</span>}
        {edit && <Link href={edit} className="text-sm font-semibold text-primary hover:underline">Edit</Link>}
      </header>
      <dl className="divide-y divide-border">{children}</dl>
    </section>
  );
}

function Row({ k, v, locked }: { k: string; v: string; locked?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <dt className="text-sm text-muted">{k}</dt>
      <dd className="flex min-w-0 items-center gap-1.5 text-right text-sm font-medium text-text">
        <span className="truncate">{v}</span>
        {locked && <Lock className="size-3.5 shrink-0 text-subtle" aria-label="Verified" />}
      </dd>
    </div>
  );
}
