import { router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import type { ReactNode } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/lib/theme";
import { useDemoSheet } from "./DemoSheet";
import { FadeIn, Text } from "./ui";

/** The four onboarding steps, matching "How it works" on the verify intro. Sign-up screens sit before them and show no bar. */
export type StepKey = "details" | "id" | "selfie" | "address";

const STEPS: { key: StepKey; label: string }[] = [
  { key: "details", label: "Your details" },
  { key: "id", label: "BVN or NIN" },
  { key: "selfie", label: "Selfie check" },
  { key: "address", label: "Home address" },
];

type Props = {
  children: ReactNode;
  step?: StepKey;
  /** true = go back in the stack; a function overrides; omit for no back button. */
  back?: boolean | (() => void);
  footer?: ReactNode;
  scroll?: boolean;
  /** Vertically centre short content such as result screens. */
  center?: boolean;
};

export function Screen({ children, step, back, footer, scroll = true, center }: Props) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const index = step ? STEPS.findIndex((s) => s.key === step) : -1;

  const onBack = () => {
    if (typeof back === "function") return back();
    if (router.canGoBack()) router.back();
    else router.replace("/");
  };

  const body = (
    <View style={[{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24 }, center && { flexGrow: 1, justifyContent: "center" }]}>
      <FadeIn>{children}</FadeIn>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      {/* Header */}
      <View style={{ paddingTop: insets.top, backgroundColor: c.bg }}>
        <View style={{ height: 56, flexDirection: "row", alignItems: "center", paddingHorizontal: 16, gap: 8 }}>
          {back ? (
            <RoundButton label="Back" onPress={onBack}>
              <ChevronLeft size={24} color={c.text} />
            </RoundButton>
          ) : null}
          {/* Hidden for demos: long-press the empty header area to open Demo controls. */}
          <Pressable
            style={{ flex: 1, alignSelf: "stretch" }}
            onLongPress={() => useDemoSheet.getState().setOpen(true)}
            delayLongPress={600}
            accessible={false}
          />
        </View>
        {index >= 0 && (
          // Thin progress line, segmented per step.
          <View
            accessible
            accessibilityLabel={`Step ${index + 1} of ${STEPS.length}, ${STEPS[index].label}`}
            style={{ flexDirection: "row", gap: 4, paddingHorizontal: 20, paddingTop: 4, paddingBottom: 6 }}
          >
            {STEPS.map((s, i) => (
              <View key={s.key} style={{ flex: 1, height: 3, borderRadius: 2, backgroundColor: i <= index ? c.primary : c.surface2 }} />
            ))}
          </View>
        )}
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        {scroll ? (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            showsVerticalScrollIndicator={false}
          >
            {body}
          </ScrollView>
        ) : (
          <View style={{ flex: 1 }}>{body}</View>
        )}
        {footer && (
          <View
            style={{
              paddingHorizontal: 20,
              paddingTop: 12,
              paddingBottom: Math.max(insets.bottom, 16),
              gap: 8,
              backgroundColor: c.bg,
            }}
          >
            {footer}
          </View>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

function RoundButton({ children, label, onPress }: { children: ReactNode; label: string; onPress: () => void }) {
  const c = useColors();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      style={({ pressed }) => ({ width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: 20, backgroundColor: c.surface2, opacity: pressed ? 0.6 : 1 })}
    >
      {children}
    </Pressable>
  );
}

export function PageTitle({ eyebrow, title, subtitle }: { eyebrow?: string; title: string; subtitle?: ReactNode }) {
  return (
    <View style={{ marginBottom: 24, gap: 10 }}>
      {eyebrow && (
        <Text variant="smallStrong" tone="primary">
          {eyebrow}
        </Text>
      )}
      <Text variant="title" accessibilityRole="header">
        {title}
      </Text>
      {subtitle && (typeof subtitle === "string" ? <Text tone="muted">{subtitle}</Text> : subtitle)}
    </View>
  );
}

export function Loading() {
  const c = useColors();
  return <View style={{ flex: 1, backgroundColor: c.bg }} accessibilityLabel="Loading" />;
}
