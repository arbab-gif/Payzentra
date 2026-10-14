"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AuthShell, PageLoading, PageTitle, StickyActions } from "@/components/AuthShell";
import { Button, Field, NgFlag } from "@/components/ui";
import { saveDetails } from "@/lib/api";
import { ROUTES, useApp } from "@/lib/store";
import { useGuard } from "@/lib/useGuard";
import { ageFrom, isNgPhone, normalisePhone } from "@/lib/validation";

const maxDob = (() => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 18);
  return d.toISOString().slice(0, 10);
})();

export default function Details() {
  const router = useRouter();
  const kyc = useApp((s) => s.kyc);
  const [phone, setPhone] = useState(kyc.phone);
  const [dob, setDob] = useState(kyc.dob);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const allowed = useGuard(ROUTES.details, loading);

  const phoneError = !submitted ? null : !phone ? "Enter your phone number." : !isNgPhone(phone) ? "Enter a valid Nigerian mobile number, like 803 123 4567." : null;
  const age = ageFrom(dob);
  const dobError = !submitted ? null : !dob ? "Enter your date of birth." : age < 18 ? "You must be 18 or older to use Payzentra." : age > 120 ? "Check the year you entered." : null;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (!isNgPhone(phone) || !dob || age < 18 || age > 120) return;
    setLoading(true);
    await saveDetails(normalisePhone(phone), dob);
    router.push(ROUTES.identity);
  };

  if (!allowed) return <PageLoading />;

  return (
    <AuthShell step="details" back={ROUTES.kycIntro} saveAndExit>
      <PageTitle title="Your personal details">
        Use the phone number and date of birth registered with your BVN or NIN, so we can match your records.
      </PageTitle>
      <form onSubmit={onSubmit} noValidate className="flex flex-1 flex-col">
        <div className="space-y-5">
          <Field
            label="Phone number"
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            placeholder="803 123 4567"
            prefix={<span className="flex items-center gap-1.5 border-r border-border pr-2.5 text-sm font-medium text-text"><NgFlag /> +234</span>}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            error={phoneError}
            hint="We'll use this for security alerts."
            autoFocus
          />
          <Field
            label="Date of birth"
            type="date"
            autoComplete="bday"
            max={maxDob}
            min="1900-01-01"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            error={dobError}
            hint="You must be 18 or older."
          />
        </div>
        <StickyActions>
          <Button type="submit" block loading={loading}>Continue</Button>
        </StickyActions>
      </form>
    </AuthShell>
  );
}
