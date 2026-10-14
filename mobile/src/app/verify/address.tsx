import { router } from "expo-router";
import { useRef, useState } from "react";
import { TextInput, View } from "react-native";
import { Loading, PageTitle, Screen } from "@/components/Screen";
import { SelectField } from "@/components/Sheet";
import { ShieldCheck } from "lucide-react-native";
import { Button, Checkbox, Field, StatusHero, Text } from "@/components/ui";
import { saveAddress, submitVerification } from "@/lib/api";
import { ROUTES, useApp } from "@/lib/store";
import { useGuard } from "@/lib/useGuard";
import { NG_STATES } from "@/lib/validation";

export default function AddressScreen() {
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
  const [submitting, setSubmitting] = useState(false);
  const line2Ref = useRef<TextInput>(null);
  const cityRef = useRef<TextInput>(null);
  const lgaRef = useRef<TextInput>(null);
  const allowed = useGuard(ROUTES.address, loading || submitting);

  if (!allowed) return <Loading />;

  if (submitting) {
    return (
      <Screen step="address" center>
        <StatusHero tone="primary" icon={ShieldCheck} title="Submitting your verification" body="Please keep the app open." pulse />
      </Screen>
    );
  }

  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));
  const req = (v: string, msg: string) => (submitted && !v.trim() ? msg : null);
  const postcodeBad = !!form.postcode && !/^\d{6}$/.test(form.postcode);

  const submit = async () => {
    setSubmitted(true);
    const { line1, city, lga, state } = form;
    if (!line1.trim() || !city.trim() || !lga.trim() || !state || !current || postcodeBad) return;
    setLoading(true);
    await saveAddress({ ...form, line1: line1.trim(), city: city.trim(), lga: lga.trim() });
    // Last step: the address is submitted straight away (no separate review screen).
    setSubmitting(true);
    setLoading(false);
    await submitVerification();
    router.replace(ROUTES.status as never);
  };

  return (
    <Screen step="address" back footer={<Button title="Submit for verification" loading={loading} onPress={submit} />}>
      <PageTitle title="Your home address" subtitle="Where you currently live. We may ask for proof of address later to raise your limits." />
      <View style={{ gap: 18 }}>
        <Field
          label="Street address"
          placeholder="e.g. 12 Adeola Odeku Street"
          value={form.line1}
          onChangeText={set("line1")}
          textContentType="streetAddressLine1"
          autoComplete="address-line1"
          returnKeyType="next"
          onSubmitEditing={() => line2Ref.current?.focus()}
          error={req(form.line1, "Enter your street address.")}
        />
        <Field
          ref={line2Ref}
          label="Apartment, estate or landmark (optional)"
          placeholder="e.g. Flat 3, Victoria Court"
          value={form.line2}
          onChangeText={set("line2")}
          textContentType="streetAddressLine2"
          returnKeyType="next"
          onSubmitEditing={() => cityRef.current?.focus()}
        />
        <Field
          ref={cityRef}
          label="City or town"
          placeholder="e.g. Ikeja"
          value={form.city}
          onChangeText={set("city")}
          textContentType="addressCity"
          returnKeyType="next"
          onSubmitEditing={() => lgaRef.current?.focus()}
          error={req(form.city, "Enter your city or town.")}
        />
        <Field ref={lgaRef} label="Local government area" placeholder="e.g. Ikeja" value={form.lga} onChangeText={set("lga")} error={req(form.lga, "Enter your LGA.")} />
        <SelectField label="State" placeholder="Select state" options={NG_STATES} value={form.state} onChange={set("state")} error={req(form.state, "Select your state.")} />
        <Field
          label="Postcode (optional)"
          placeholder="6 digits"
          value={form.postcode}
          onChangeText={(t) => set("postcode")(t.replace(/\D/g, ""))}
          keyboardType="number-pad"
          maxLength={6}
          textContentType="postalCode"
          error={submitted && postcodeBad ? "Nigerian postcodes are 6 digits." : null}
        />
        <Checkbox checked={current} onChange={setCurrent} error={submitted && !current ? "Confirm this is your current address." : null}>
          This is where I currently live.
        </Checkbox>
        <Text variant="small" tone="muted">
          By submitting, you confirm your details are true and belong to you. Giving false information may lead to your account being closed.
        </Text>
      </View>
    </Screen>
  );
}
