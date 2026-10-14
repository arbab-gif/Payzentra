import { router } from "expo-router";
import { BadgeCheck, Lock, UserX } from "lucide-react-native";
import { useState } from "react";
import { View } from "react-native";
import { Loading, PageTitle, Screen } from "@/components/Screen";
import { Alert, Button, Card, Divider, StatusHero, Text } from "@/components/ui";
import { confirmIdentity } from "@/lib/api";
import { ROUTES, useApp } from "@/lib/store";
import { useColors } from "@/lib/theme";
import { toast } from "@/lib/toast";
import { useGuard } from "@/lib/useGuard";

export default function ConfirmIdentity() {
  const c = useColors();
  const kyc = useApp((s) => s.kyc);
  const setKyc = useApp((s) => s.setKyc);
  const [loading, setLoading] = useState(false);
  const [notMe, setNotMe] = useState(false);
  const allowed = useGuard(ROUTES.identityConfirm, loading || notMe);

  if (!allowed || !kyc.identity) return <Loading />;
  const id = kyc.identity;
  const source = kyc.idType === "BVN" ? "your bank" : "NIMC";

  if (notMe) {
    return (
      <Screen
        step="id"
        center
        footer={
          <>
            <Button
              title="Enter a different number"
              onPress={() => {
                setKyc({ identity: null, idNumber: "", consentAt: null });
                router.replace(ROUTES.identity as never);
              }}
            />
            <Button title="Contact support" variant="secondary" onPress={() => toast({ tone: "info", title: "Support case opened", body: "In the live app this opens a support case for an identity issue." })} />
            <Button title="Go back" variant="ghost" onPress={() => setNotMe(false)} />
          </>
        }
      >
        <StatusHero
          tone="warning"
          icon={UserX}
          title="These details aren't yours?"
          body={`You can only open an account with your own ${kyc.idType}. If you entered the wrong number, start this step again. If the record itself is wrong, it needs to be corrected with ${source} first.`}
        />
      </Screen>
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

  const confirm = async () => {
    setLoading(true);
    await confirmIdentity();
    router.replace(ROUTES.selfie as never);
  };

  return (
    <Screen
      step="id"
      footer={
        <>
          <Button title="Yes, this is me" loading={loading} onPress={confirm} />
          <Button title="This isn't me" variant="secondary" onPress={() => setNotMe(true)} />
        </>
      }
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <BadgeCheck size={20} color={c.success} />
        <Text variant="smallStrong" tone="success">{kyc.idType} found</Text>
      </View>
      <PageTitle title="Is this you?" subtitle={`These details come from your ${kyc.idType} record and will be your legal name on Payzentra.`} />
      <View style={{ gap: 16 }}>
        <Card style={{ padding: 0 }}>
          {rows.map(([k, v], i) => (
            <View key={k}>
              {i > 0 && <Divider />}
              <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, gap: 12 }} accessible accessibilityLabel={`${k}: ${v}, verified`}>
                <Text variant="small" tone="muted" style={{ flex: 1 }}>{k}</Text>
                <Text variant="bodyStrong">{v}</Text>
                <Lock size={14} color={c.subtle} />
              </View>
            </View>
          ))}
        </Card>
        <Alert tone="info">{`Verified details can't be edited here. If something is spelled wrong, update it with ${source} and verify again.`}</Alert>
      </View>
    </Screen>
  );
}
