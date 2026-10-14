import { router } from "expo-router";
import { CloudOff, FileX, ShieldCheck, UserX, UsersRound } from "lucide-react-native";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, View } from "react-native";
import { Loading, PageTitle, Screen } from "@/components/Screen";
import { Alert, Button, Checkbox, Field, StatusHero, Text } from "@/components/ui";
import { lookupIdentity } from "@/lib/api";
import { ROUTES, useApp, type IdType } from "@/lib/store";
import { radius, useColors } from "@/lib/theme";
import { toast } from "@/lib/toast";
import { useGuard } from "@/lib/useGuard";

const ID_OPTIONS: { type: IdType; title: string; body: string }[] = [
  { type: "BVN", title: "Bank Verification Number", body: "11 digits, linked to all your bank accounts." },
  { type: "NIN", title: "National Identification Number", body: "11 digits, on your NIN slip or NIMC app." },
];

type Failure = { code: string; message: string };

export default function Identity() {
  const c = useColors();
  const kyc = useApp((s) => s.kyc);
  const [idType, setIdType] = useState<IdType>(kyc.idType ?? "BVN");
  const [number, setNumber] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [checking, setChecking] = useState(false);
  const [failure, setFailure] = useState<Failure | null>(null);
  const allowed = useGuard(ROUTES.identity, checking);

  if (!allowed) return <Loading />;

  const option = ID_OPTIONS.find((o) => o.type === idType)!;
  const other: IdType = idType === "BVN" ? "NIN" : "BVN";
  const numberError = !submitted ? null : number.length === 0 ? `Enter your ${idType}.` : number.length !== 11 ? `Your ${idType} is 11 digits.` : null;

  const run = async () => {
    setSubmitted(true);
    if (number.length !== 11 || !consent) return;
    setFailure(null);
    setChecking(true);
    const res = await lookupIdentity(idType, number);
    if (res.ok) {
      router.replace(ROUTES.identityConfirm as never);
      return;
    }
    setChecking(false);
    setFailure(res);
  };

  const switchType = () => {
    setIdType(other);
    setNumber("");
    setSubmitted(false);
    setFailure(null);
  };

  const support = () => toast({ tone: "info", title: "Support case opened", body: "In the live app this opens a support case with your verification reference attached." });

  if (checking) {
    return (
      <Screen step="id" center>
        <Checking idType={idType} />
      </Screen>
    );
  }

  if (failure?.code === "MISMATCH") {
    return (
      <Screen
        step="id"
        center
        footer={
          <>
            <Button title={`Try with ${other} instead`} onPress={switchType} />
            <Button title="Enter a different number" variant="secondary" onPress={() => { setFailure(null); setNumber(""); setSubmitted(false); }} />
          </>
        }
      >
        <StatusHero tone="warning" icon={UserX} title="These details don't match" body={`${failure.message} If it's your own ${idType}, contact support and we'll help.`} />
      </Screen>
    );
  }

  if (failure?.code === "UNSUPPORTED_DOCUMENT") {
    return (
      <Screen
        step="id"
        center
        footer={
          <>
            <Button title={`Use ${other} instead`} onPress={switchType} />
            <Button title="Enter a different number" variant="secondary" onPress={() => { setFailure(null); setNumber(""); setSubmitted(false); }} />
          </>
        }
      >
        <StatusHero tone="warning" icon={FileX} title="We can't use this ID" body={failure.message} />
      </Screen>
    );
  }

  if (failure?.code === "DUPLICATE_IDENTITY") {
    return (
      <Screen
        step="id"
        center
        footer={
          <>
            <Button title="Log in to my other account" onPress={() => { useApp.getState().signOut(); router.replace("/login?other=1"); }} />
            <Button title="Contact support" variant="secondary" onPress={support} />
          </>
        }
      >
        <StatusHero
          tone="danger"
          icon={UsersRound}
          title="This identity is already in use"
          body={`${failure.message} If you've opened an account before, log in to it. If you think this is a mistake, contact support.`}
        />
      </Screen>
    );
  }

  if (failure?.code === "PROVIDER_UNAVAILABLE") {
    return (
      <Screen
        step="id"
        center
        footer={
          <>
            <Button title="Try again" onPress={run} />
            <Button title={`Use ${other} instead`} variant="secondary" onPress={switchType} />
          </>
        }
      >
        <StatusHero tone="warning" icon={CloudOff} title="Verification is temporarily unavailable" body={failure.message} />
      </Screen>
    );
  }

  return (
    <Screen step="id" back footer={<Button title={`Verify ${idType}`} onPress={run} />}>
      <PageTitle title="Verify with BVN or NIN" subtitle="Pick one. We'll use it to confirm your name and date of birth." />
      <View style={{ gap: 20 }}>
        {/* BVN | NIN tabs */}
        <View
          accessibilityRole="tablist"
          style={{ flexDirection: "row", padding: 4, borderRadius: radius.pill, backgroundColor: c.surface2 }}
        >
          {ID_OPTIONS.map(({ type }) => {
            const active = idType === type;
            return (
              <Pressable
                key={type}
                onPress={() => { setIdType(type); setFailure(null); setNumber(""); setSubmitted(false); }}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                accessibilityLabel={type}
                style={{ flex: 1, height: 44, borderRadius: radius.pill, alignItems: "center", justifyContent: "center", backgroundColor: active ? c.primary : "transparent" }}
              >
                <Text variant="bodyStrong" style={{ color: active ? c.onPrimary : c.muted }}>{type}</Text>
              </Pressable>
            );
          })}
        </View>
        {/* What the selected ID is */}
        <View style={{ gap: 2 }}>
          <Text variant="bodyStrong">{option.title}</Text>
          <Text variant="small" tone="muted">{option.body}</Text>
        </View>

        {failure?.code === "NOT_FOUND" && <Alert tone="danger" title="Number not found">{failure.message}</Alert>}

        <Field
          label={`Your ${idType}`}
          placeholder="11 digits"
          value={number}
          onChangeText={(t) => {
            setNumber(t.replace(/\D/g, "").slice(0, 11));
            if (failure) setFailure(null);
          }}
          keyboardType="number-pad"
          maxLength={11}
          mono
          error={numberError}
        />

        {/* Explicit consent is required before the identity check (kept from the spec; not shown in the Figma frame). */}
        <Checkbox checked={consent} onChange={setConsent} error={submitted && !consent ? "We need your consent to check your details." : null}>
          {`I consent to Payzentra checking my ${idType}, name, date of birth, phone number and photo with an approved identity provider to verify who I am, as described in the Privacy Policy.`}
        </Checkbox>
      </View>
    </Screen>
  );
}

function Checking({ idType }: { idType: IdType }) {
  const c = useColors();
  const steps =
    idType === "NIN"
      ? ["Connecting to the NIN service", "Finding your NIN record", "Fetching your name and date of birth"]
      : ["Connecting to the BVN service", "Finding your bank verification record", "Fetching your name and date of birth"];
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((x) => Math.min(x + 1, 2)), 750);
    return () => clearInterval(t);
  }, []);
  return (
    <View accessibilityLiveRegion="polite">
      <StatusHero tone="primary" icon={ShieldCheck} title={`Checking your ${idType}`} body={idType === "NIN" ? "We're fetching your record from the national identity database. This usually takes a few seconds." : "We're fetching your record from your bank verification details. This usually takes a few seconds."} pulse />
      <View style={{ marginTop: 28, gap: 14, alignSelf: "center" }}>
        {steps.map((s, idx) => (
          <View key={s} style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            {idx === i ? (
              <ActivityIndicator size="small" color={c.primary} />
            ) : (
              <View style={{ width: 20, alignItems: "center" }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: idx < i ? c.success : c.borderStrong }} />
              </View>
            )}
            <Text variant="small" tone={idx <= i ? "text" : "subtle"}>{s}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
