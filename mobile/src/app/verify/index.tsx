import { router } from "expo-router";
import { Camera, Fingerprint, Home, Lock, type LucideIcon } from "lucide-react-native";
import { View } from "react-native";
import { ShieldArt } from "@/components/Brand";
import { Loading, Screen } from "@/components/Screen";
import { Button, Text } from "@/components/ui";
import { ROUTES } from "@/lib/store";
import { radius, useColors } from "@/lib/theme";
import { useGuard } from "@/lib/useGuard";

const STEPS: { Icon: LucideIcon; t: string; time: string }[] = [
  { Icon: Fingerprint, t: "BVN or NIN", time: "30 sec" },
  { Icon: Camera, t: "Selfie check", time: "1 min" },
  { Icon: Home, t: "Home address", time: "1 min" },
];

export default function VerifyIntro() {
  const c = useColors();
  const allowed = useGuard(ROUTES.kycIntro);
  if (!allowed) return <Loading />;

  return (
    <Screen back={() => router.replace(ROUTES.home as never)} footer={<Button title="Let's go" onPress={() => router.push(ROUTES.identity as never)} />}>
      <View style={{ alignItems: "center" }}>
        <ShieldArt size={173} />
      </View>

      <Text variant="display" style={{ marginTop: 20 }} accessibilityRole="header">
        Verify your identity
      </Text>
      <Text tone="muted" style={{ marginTop: 10 }}>
        Three quick steps to activate your wallet and unlock sending, receiving, bills and crypto.
      </Text>

      <Text variant="bodyStrong" style={{ marginTop: 28 }}>
        How it works
      </Text>
      <Text variant="small" tone="muted" style={{ marginTop: 4 }}>
        Enter your BVN or NIN and we&apos;ll fetch your name and date of birth for you to check. No forms to fill in.
      </Text>

      {/* Timeline */}
      <View style={{ marginTop: 12, backgroundColor: c.surface, borderRadius: radius.lg, paddingVertical: 8 }}>
        {STEPS.map(({ Icon, t, time }, i) => (
          <View key={t} style={{ flexDirection: "row", gap: 14, paddingHorizontal: 16 }}>
            <View style={{ alignItems: "center", width: 36 }}>
              <View style={{ width: 2, height: 12, backgroundColor: i === 0 ? "transparent" : c.border }} />
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: c.surface2,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon size={18} color={c.primary} />
              </View>
              <View style={{ width: 2, flex: 1, minHeight: 12, backgroundColor: i === STEPS.length - 1 ? "transparent" : c.border }} />
            </View>
            <View style={{ flex: 1, paddingVertical: 12, flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text variant="caption" tone="subtle">STEP {i + 1}</Text>
                <Text variant="bodyStrong">{t}</Text>
              </View>
              <Text variant="caption" tone="muted">{time}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={{ flexDirection: "row", gap: 8, marginTop: 16, paddingHorizontal: 4 }}>
        <Lock size={14} color={c.muted} style={{ marginTop: 3 }} />
        <Text variant="small" tone="muted" style={{ flex: 1 }}>
          Your details are encrypted and checked with an approved identity provider. We never use them for marketing.
        </Text>
      </View>
    </Screen>
  );
}

