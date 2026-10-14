import { router } from "expo-router";
import { Camera, Clock3, Fingerprint, Home, Lock, UserRound, type LucideIcon } from "lucide-react-native";
import { View } from "react-native";
import Svg, { G, Path } from "react-native-svg";
import { Loading, Screen } from "@/components/Screen";
import { Button, Text } from "@/components/ui";
import { ROUTES } from "@/lib/store";
import { radius, useColors } from "@/lib/theme";
import { useGuard } from "@/lib/useGuard";

const STEPS: { Icon: LucideIcon; t: string; b: string; time: string }[] = [
  { Icon: UserRound, t: "Your details", b: "Phone number and date of birth", time: "30 sec" },
  { Icon: Fingerprint, t: "BVN or NIN", b: "Dial *565*0# or *346# if you don't know it", time: "30 sec" },
  { Icon: Camera, t: "Selfie check", b: "A quick live selfie — no uploads", time: "1 min" },
  { Icon: Home, t: "Home address", b: "Where you live in Nigeria", time: "1 min" },
];

export default function VerifyIntro() {
  const c = useColors();
  const allowed = useGuard(ROUTES.kycIntro);
  if (!allowed) return <Loading />;

  return (
    <Screen
      footer={
        <>
          <Button title="Let's go" onPress={() => router.push(ROUTES.details as never)} />
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingTop: 2 }}>
            <Clock3 size={14} color={c.muted} />
            <Text variant="caption" tone="muted">Takes about 3 minutes · progress is saved</Text>
          </View>
        </>
      }
    >
      <View style={{ alignItems: "center", paddingTop: 8 }}>
        <ShieldIllustration />
      </View>

      <Text variant="display" style={{ marginTop: 20 }} accessibilityRole="header">
        Verify your identity
      </Text>
      <Text tone="muted" style={{ marginTop: 10 }}>
        Four quick steps to unlock sending, receiving, bills and crypto.
      </Text>

      <Text variant="bodyStrong" style={{ marginTop: 28 }}>
        How it works
      </Text>

      {/* Timeline */}
      <View style={{ marginTop: 12, backgroundColor: c.surface, borderRadius: radius.lg, paddingVertical: 8 }}>
        {STEPS.map(({ Icon, t, b, time }, i) => (
          <View key={t} style={{ flexDirection: "row", gap: 14, paddingHorizontal: 16 }}>
            <View style={{ alignItems: "center", width: 36 }}>
              <View style={{ width: 2, height: 12, backgroundColor: i === 0 ? "transparent" : c.border }} />
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: i === 0 ? c.primary : c.surface2,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon size={18} color={i === 0 ? c.onPrimary : c.primary} />
              </View>
              <View style={{ width: 2, flex: 1, minHeight: 12, backgroundColor: i === STEPS.length - 1 ? "transparent" : c.border }} />
            </View>
            <View style={{ flex: 1, paddingVertical: 12, flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text variant="caption" tone={i === 0 ? "primary" : "subtle"}>STEP {i + 1}</Text>
                <Text variant="bodyStrong">{t}</Text>
                <Text variant="small" tone="muted">{b}</Text>
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

/** Simple line-art shield with a check, an offset accent shadow and a little sparkle. */
function ShieldIllustration() {
  const c = useColors();
  const outer = "M80 8 L124 24 V58 C124 88 104 106 80 116 C56 106 36 88 36 58 V24 Z";
  return (
    <Svg width={200} height={162} viewBox="0 0 160 130" accessibilityLabel="Shield with a check mark">
      <Path d={outer} fill={c.primary} opacity={0.35} transform="translate(-7 6)" />
      <Path d={outer} fill={c.bg} stroke={c.text} strokeWidth={3.5} strokeLinejoin="round" />
      <Path
        d="M80 22 L112 34 V58 C112 80 98 94 80 102 C62 94 48 80 48 58 V34 Z"
        fill="none"
        stroke={c.text}
        strokeWidth={3}
        strokeLinejoin="round"
        strokeDasharray={[150, 12, 40, 400]}
      />
      <Path d="M64 60 L76 72 L98 48" fill="none" stroke={c.primary} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
      <G stroke={c.text} strokeWidth={3} strokeLinecap="round">
        <Path d="M18 40 L28 44" />
        <Path d="M14 58 L26 58" />
        <Path d="M18 76 L28 72" />
        <Path d="M142 40 L132 44" />
        <Path d="M146 58 L134 58" />
        <Path d="M142 76 L132 72" />
      </G>
    </Svg>
  );
}
