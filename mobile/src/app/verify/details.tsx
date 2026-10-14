import { router } from "expo-router";
import { XCircle } from "lucide-react-native";
import { useState } from "react";
import { View } from "react-native";
import { DateField } from "@/components/DateField";
import { Loading, PageTitle, Screen } from "@/components/Screen";
import { Button, Field, NgFlag, Text } from "@/components/ui";
import { saveDetails } from "@/lib/api";
import { ROUTES, useApp } from "@/lib/store";
import { useColors } from "@/lib/theme";
import { useGuard } from "@/lib/useGuard";
import { ageFrom, isName, isNgPhone, isRealDate, normalisePhone } from "@/lib/validation";

export default function Details() {
  const c = useColors();
  const kyc = useApp((s) => s.kyc);
  const [firstName, setFirstName] = useState(kyc.firstName);
  const [lastName, setLastName] = useState(kyc.lastName);
  const [phone, setPhone] = useState(kyc.phone);
  const [dob, setDob] = useState(kyc.dob);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const allowed = useGuard(ROUTES.details, loading);

  if (!allowed) return <Loading />;

  const nameError = (v: string, which: string) =>
    !submitted ? null : !v.trim() ? `Enter your ${which}.` : !isName(v) ? "Use letters only." : null;
  const firstError = nameError(firstName, "first name");
  const lastError = nameError(lastName, "last name");
  const phoneError = !submitted ? null : !phone ? "Enter your phone number." : !isNgPhone(phone) ? "Enter a valid Nigerian mobile number, like 803 123 4567." : null;
  const age = ageFrom(dob);
  const dobError = !submitted
    ? null
    : !dob || !isRealDate(dob)
      ? "Enter a real date of birth."
      : age < 18
        ? "You must be 18 or older to use Payzentra."
        : age > 120
          ? "Check the year you entered."
          : null;

  const submit = async () => {
    setSubmitted(true);
    if (!isName(firstName) || !isName(lastName) || !isNgPhone(phone) || !dob || !isRealDate(dob) || age < 18 || age > 120) return;
    setLoading(true);
    await saveDetails({ firstName: firstName.trim(), lastName: lastName.trim(), phone: normalisePhone(phone), dob });
    setLoading(false);
    router.push(ROUTES.identity as never);
  };

  // One shared message under the name row, so the two half-width fields stay level.
  const nameMessage = firstError ?? lastError;

  return (
    <Screen step="details" back footer={<Button title="Continue" loading={loading} onPress={submit} />}>
      <PageTitle title="Your personal details" subtitle="Enter your name, phone number and date of birth linked to your BVN or NIN for verification." />
      <View style={{ gap: 20 }}>
        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Field
                label="First name"
                placeholder="Adaeze"
                value={firstName}
                onChangeText={setFirstName}
                autoCapitalize="words"
                autoCorrect={false}
                textContentType="givenName"
                autoComplete="name-given"
                invalid={!!firstError}
              />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Field
                label="Last name"
                placeholder="Okonkwo"
                value={lastName}
                onChangeText={setLastName}
                autoCapitalize="words"
                autoCorrect={false}
                textContentType="familyName"
                autoComplete="name-family"
                invalid={!!lastError}
              />
            </View>
          </View>
          {nameMessage ? (
            <View style={{ flexDirection: "row", gap: 6, alignItems: "flex-start" }} accessibilityLiveRegion="polite">
              <XCircle size={16} color={c.danger} style={{ marginTop: 2 }} />
              <Text variant="small" tone="danger" style={{ flex: 1 }}>{nameMessage}</Text>
            </View>
          ) : (
            <Text variant="small" tone="muted">Exactly as it appears on your BVN or NIN.</Text>
          )}
        </View>
        <Field
          label="Phone number"
          placeholder="803 123 4567"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          textContentType="telephoneNumber"
          autoComplete="tel"
          left={
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingRight: 10, borderRightWidth: 1, borderRightColor: c.border }}>
              <NgFlag />
              <Text variant="bodyStrong">+234</Text>
            </View>
          }
          hint="We'll use this for security alerts."
          error={phoneError}
        />
        <DateField label="Date of birth" value={dob} onChange={setDob} error={dobError} hint="You must be 18 or older." />
      </View>
    </Screen>
  );
}
