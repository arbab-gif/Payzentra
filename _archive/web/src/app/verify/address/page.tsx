"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AuthShell, PageLoading, PageTitle, StickyActions } from "@/components/AuthShell";
import { Button, Checkbox, Field, SelectField } from "@/components/ui";
import { saveAddress } from "@/lib/api";
import { ROUTES, useApp } from "@/lib/store";
import { useGuard } from "@/lib/useGuard";
import { NG_STATES } from "@/lib/validation";

export default function AddressPage() {
  const router = useRouter();
  const saved = useApp((s) => s.kyc.address);
  const [form, setForm] = useState({
    line1: saved?.line1 ?? "",
    line2: saved?.line2 ?? "",
    city: saved?.city ?? "",
    lga: saved?.lga ?? "",
    state: saved?.state ?? "",
    postcode: saved?.postcode ?? "",
  });
  const [current, setCurrent] = useState(!!saved);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const allowed = useGuard(ROUTES.address, loading);

  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const req = (v: string, msg: string) => (submitted && !v.trim() ? msg : null);
  const postcodeError = submitted && form.postcode && !/^\d{6}$/.test(form.postcode) ? "Nigerian postcodes are 6 digits." : null;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    const { line1, city, lga, state, postcode } = form;
    if (!line1.trim() || !city.trim() || !lga.trim() || !state || !current) return;
    if (postcode && !/^\d{6}$/.test(postcode)) return;
    setLoading(true);
    await saveAddress({ ...form, line1: line1.trim(), city: city.trim(), lga: lga.trim() });
    router.push(ROUTES.review);
  };

  if (!allowed) return <PageLoading />;

  return (
    <AuthShell step="address" back={ROUTES.identityConfirm} saveAndExit>
      <PageTitle title="Your home address">Enter the address where you currently live. We may ask for proof of address later to raise your limits.</PageTitle>
      <form onSubmit={onSubmit} noValidate className="flex flex-1 flex-col">
        <div className="space-y-5">
          <Field label="Street address" autoComplete="address-line1" placeholder="e.g. 12 Adeola Odeku Street" value={form.line1} onChange={set("line1")} error={req(form.line1, "Enter your street address.")} autoFocus />
          <Field label="Apartment, estate or landmark (optional)" autoComplete="address-line2" placeholder="e.g. Flat 3, Victoria Court" value={form.line2} onChange={set("line2")} />
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="City or town" autoComplete="address-level2" placeholder="e.g. Victoria Island" value={form.city} onChange={set("city")} error={req(form.city, "Enter your city or town.")} />
            <Field label="Local government area" placeholder="e.g. Eti-Osa" value={form.lga} onChange={set("lga")} error={req(form.lga, "Enter your LGA.")} />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <SelectField label="State" placeholder="Select state" options={NG_STATES} value={form.state} onChange={set("state")} error={req(form.state, "Select your state.")} autoComplete="address-level1" />
            <Field label="Postcode (optional)" inputMode="numeric" autoComplete="postal-code" placeholder="6 digits" maxLength={6} value={form.postcode} onChange={(e) => setForm((f) => ({ ...f, postcode: e.target.value.replace(/\D/g, "") }))} error={postcodeError} />
          </div>
          <Checkbox checked={current} onChange={setCurrent} error={submitted && !current ? "Confirm this is your current address." : null}>
            This is where I currently live.
          </Checkbox>
        </div>
        <StickyActions>
          <Button type="submit" block loading={loading}>Continue</Button>
        </StickyActions>
      </form>
    </AuthShell>
  );
}
