import { router } from "expo-router";
import { CheckCircle2, Clock3, Info, ShieldAlert, Unlock } from "lucide-react-native";
import { useState } from "react";
import { View } from "react-native";
import { Loading, Screen } from "@/components/Screen";
import { Alert, Button, Card, LinkText, StatusHero, Text } from "@/components/ui";
import { restartAddressAfterRejection } from "@/lib/api";
import { ROUTES, useApp } from "@/lib/store";
import { radius, useColors } from "@/lib/theme";
import { toast } from "@/lib/toast";
import { useGuard } from "@/lib/useGuard";

export default function VerificationStatus() {
  const c = useColors();
  const kyc = useApp((s) => s.kyc);
  const [retrying, setRetrying] = useState(false);
  const allowed = useGuard(ROUTES.status, retrying);

  if (!allowed) return <Loading />;

  const startAgain = () => {
    useApp.getState().resetAll();
    router.replace("/");
  };
  const startAgainButton = <Button title="Start again" variant="ghost" onPress={startAgain} />;

  const toHome = () => router.replace(ROUTES.home as never);

  if (kyc.status === "verified") {
    return (
      <Screen footer={<><Button title="Go to my account" onPress={toHome} />{startAgainButton}</>}>
        <View style={{ paddingTop: 24 }}>
          <StatusHero
            tone="success"
            icon={CheckCircle2}
            title={`You're verified${kyc.identity ? `, ${kyc.identity.firstName}` : ""}!`}
            body="Your account is ready. You can now add money, send to banks, pay bills and trade crypto."
          />
        </View>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 28 }}>
          {["Add money", "Send to banks", "Pay bills", "Buy & sell crypto"].map((t) => (
            <View key={t} style={{ width: "48%", flexGrow: 1, flexDirection: "row", alignItems: "center", gap: 10, padding: 14, borderRadius: radius.md, backgroundColor: c.surface }}>
              <Unlock size={16} color={c.success} />
              <Text variant="smallStrong">{t}</Text>
            </View>
          ))}
        </View>
        <View style={{ flexDirection: "row", gap: 10, marginTop: 14, padding: 14, borderRadius: radius.md, borderWidth: 1, borderStyle: "dashed", borderColor: c.border }}>
          <Info size={16} color={c.muted} style={{ marginTop: 2 }} />
          <Text variant="small" tone="muted" style={{ flex: 1 }}>Daily and monthly limits apply. You can raise them later from Settings.</Text>
        </View>
      </Screen>
    );
  }

  if (kyc.status === "rejected") {
    return (
      <Screen
        footer={
          <>
            <Button
              title="Update my address"
              loading={retrying}
              onPress={async () => {
                setRetrying(true);
                await restartAddressAfterRejection();
                router.replace(ROUTES.address as never);
              }}
            />
            <Button title="Not now" variant="secondary" onPress={toHome} />
            {startAgainButton}
          </>
        }
      >
        <View style={{ paddingTop: 24, gap: 24 }}>
          <StatusHero tone="danger" icon={ShieldAlert} title="We couldn't verify your account" body="Your identity was confirmed, but there's a problem with one of your details." />
          <Alert
            tone="danger"
            title="What needs fixing"
            action={<LinkText onPress={() => toast({ tone: "info", title: "Support case opened", body: "In the live app this opens a support case linked to your verification." })}>Contact support</LinkText>}
          >
            {kyc.rejectionReason ?? undefined}
          </Alert>
        </View>
      </Screen>
    );
  }

  const steps = [
    { t: "Account created", done: true },
    { t: `${kyc.idType ?? "ID"} confirmed`, done: kyc.identityConfirmed },
    { t: "Selfie", done: kyc.livenessPassed, review: kyc.livenessLocked },
    { t: "Final review", review: true },
  ];

  return (
    <Screen footer={<><Button title="Explore my account" onPress={toHome} />{startAgainButton}</>}>
      <View style={{ paddingTop: 24 }}>
        <StatusHero
          tone="warning"
          icon={Clock3}
          title="Your verification is in review"
          body={`${kyc.livenessLocked ? "Our team is checking your selfie against your ID." : "We need a little more time to check your details."} This usually takes up to 24 hours. We'll notify you when it's done.`}
        />
      </View>
      <Card style={{ marginTop: 28, gap: 0 }}>
        {steps.map((s, i) => (
          <View key={s.t} style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ alignItems: "center" }}>
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: s.done ? c.success : s.review ? c.warningSoft : c.surface2,
                }}
              >
                {s.done ? <CheckCircle2 size={16} color="#fff" /> : <Clock3 size={14} color={s.review ? c.warning : c.subtle} />}
              </View>
              {i < steps.length - 1 && <View style={{ width: 2, flex: 1, minHeight: 18, backgroundColor: c.border }} />}
            </View>
            <View style={{ paddingBottom: i < steps.length - 1 ? 14 : 0 }}>
              <Text variant="smallStrong">{s.t}</Text>
              <Text variant="small" tone="muted">{s.done ? "Done" : s.review ? "In review" : "Waiting"}</Text>
            </View>
          </View>
        ))}
      </Card>
      <View style={{ marginTop: 14 }}>
        <Alert tone="info" title="While you wait">You can look around the app, but adding, sending and trading money stays locked until you&apos;re verified.</Alert>
      </View>
    </Screen>
  );
}
