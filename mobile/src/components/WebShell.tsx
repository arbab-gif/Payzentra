import { LinearGradient } from "expo-linear-gradient";
import { ArrowLeft, Camera, Check, Fingerprint, Home, type LucideIcon } from "lucide-react-native";
import type { ReactNode } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { STEPS, type StepKey } from "@/lib/steps";
import { darkColors, ForceDark, radius, useColors } from "@/lib/theme";
import { useDemoSheet } from "./DemoSheet";
import { FadeIn, Logo, Text } from "./ui";

const WHITE = "#ffffff";
const WHITE_MUTED = "rgba(255,255,255,0.64)";
const STEP_ICON: Record<StepKey, LucideIcon> = { id: Fingerprint, selfie: Camera, address: Home };

export function WebAuthShell({
  children,
  step,
  onBack,
  footer,
  center,
}: {
  children: ReactNode;
  step?: StepKey;
  onBack?: () => void;
  footer?: ReactNode;
  center?: boolean;
}) {
  const index = step ? STEPS.findIndex((s) => s.key === step) : -1;
  return (
    <ForceDark value={darkColors}>
    <View style={{ flex: 1, backgroundColor: "#000000" }}>
      {/* Subtle colour glow from top centre */}
      <LinearGradient
        colors={["rgba(102,124,255,0.18)", "rgba(102,124,255,0)"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{ position: "absolute", top: 0, left: 0, right: 0, height: "30%" }}
      />

      {/* Top bar: logo centred, back on left, step tracker on right */}
      <View style={{ height: 72, flexDirection: "row", alignItems: "center", paddingHorizontal: 40, gap: 12 }}>
        {onBack ? (
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Back"
            style={({ pressed }) => ({ width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.08)", alignItems: "center", justifyContent: "center", opacity: pressed ? 0.6 : 1 })}
          >
            <ArrowLeft size={18} color={WHITE} />
          </Pressable>
        ) : <View style={{ width: 36 }} />}

        {/* Hidden for demos: long-press logo area for Demo controls. */}
        <Pressable style={{ flex: 1, alignItems: "center" }} onLongPress={() => useDemoSheet.getState().setOpen(true)} delayLongPress={600} accessible={false}>
          <Logo onDark />
        </Pressable>

        {index >= 0 ? (
          <View style={{ width: 160, alignItems: "flex-end", gap: 4 }} accessible accessibilityLabel={`Step ${index + 1} of ${STEPS.length}, ${STEPS[index].label}`}>
            <Text variant="caption" style={{ color: WHITE_MUTED }}>
              Step {index + 1}/{STEPS.length}
            </Text>
            <View style={{ flexDirection: "row", gap: 3, width: "100%" }}>
              {STEPS.map((s, i) => (
                <View key={s.key} style={{ flex: 1, height: 3, borderRadius: 2, backgroundColor: i <= index ? "#667cff" : "rgba(255,255,255,0.12)" }} />
              ))}
            </View>
          </View>
        ) : <View style={{ width: 36 }} />}
      </View>

      {/* Centred content — no card, just content on the dark background */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, alignItems: "center", paddingHorizontal: 40, paddingTop: 24, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
        <View style={[{ width: "100%", maxWidth: 460 }, center && { flexGrow: 1, justifyContent: "center" }]}>
          <FadeIn>{children}</FadeIn>
          {footer && <View style={{ gap: 8, marginTop: 32 }}>{footer}</View>}
        </View>
      </ScrollView>
    </View>
    </ForceDark>
  );
}

/** Rounded content card used by desktop pages. */
export function WebCard({ children, style }: { children: ReactNode; style?: object }) {
  const c = useColors();
  return <View style={[{ backgroundColor: c.surface, borderRadius: radius.lg, padding: 20 }, style]}>{children}</View>;
}
