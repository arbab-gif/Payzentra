import { router } from "expo-router";
import { CheckCircle2, Info, Mail, Moon, RotateCcw, Sun, X, XCircle } from "lucide-react-native";
import { Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { create } from "zustand";
import { DEMO_BAD_TOTP, DEMO_EMAIL_CODE, DEMO_EXPIRED_CODE } from "@/lib/api";
import { useApp, type Scenarios } from "@/lib/store";
import { radius, useColors } from "@/lib/theme";
import { useToasts } from "@/lib/toast";
import { Sheet } from "./Sheet";
import { Button, Card, Text } from "./ui";

export const useDemoSheet = create<{ open: boolean; setOpen: (v: boolean) => void }>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}));

const OPTIONS: { key: keyof Scenarios; label: string; values: [string, string][] }[] = [
  { key: "signup", label: "Sign up", values: [["ok", "Success"], ["duplicate", "Email already registered"]] },
  { key: "login", label: "Log in", values: [["ok", "Success"], ["wrong_password", "Wrong password"], ["locked", "Temporarily locked"]] },
  {
    key: "identity",
    label: "BVN / NIN check",
    values: [
      ["match", "Match"],
      ["mismatch", "Details don't match"],
      ["not_found", "Not found"],
      ["duplicate", "Linked to another account"],
      ["provider_down", "Provider down"],
    ],
  },
  { key: "liveness", label: "Selfie / face match", values: [["pass", "Pass"], ["fail_once", "Fail once"], ["fail_always", "Always fail"]] },
  { key: "camera", label: "Camera", values: [["simulated", "Simulated"], ["real", "Real camera"]] },
  { key: "decision", label: "Final decision", values: [["verified", "Verified"], ["pending", "In review"], ["rejected", "Rejected"]] },
  { key: "home", label: "Home", values: [["active", "Account with history"], ["new", "New, empty account"], ["unavailable", "Balance and activity fail to load"]] },
];

export function DemoSheet() {
  const c = useColors();
  const { open, setOpen } = useDemoSheet();
  const { scenarios, setScenario, resetAll, theme, setTheme } = useApp();

  return (
    <Sheet open={open} onClose={() => setOpen(false)} title="Demo controls" fullHeight>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 12, gap: 18 }}>
        <Text variant="small" tone="muted">
          Not part of the product. Choose what the simulated backend returns so you can see every state.
        </Text>
        <Card style={{ gap: 4 }}>
          <Text variant="smallStrong">Test codes</Text>
          <Text variant="small" tone="muted">Email code: {DEMO_EMAIL_CODE} · expired: {DEMO_EXPIRED_CODE}</Text>
          <Text variant="small" tone="muted">Authenticator: any 6 digits · {DEMO_BAD_TOTP} = wrong</Text>
          <Text variant="small" tone="muted">BVN / NIN: any 11 digits</Text>
        </Card>
        {OPTIONS.map((o) => (
          <View key={o.key} style={{ gap: 8 }}>
            <Text variant="label">{o.label}</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {o.values.map(([v, l]) => {
                const on = scenarios[o.key] === v;
                return (
                  <Pressable
                    key={v}
                    onPress={() => setScenario(o.key, v as never)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: on }}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: radius.pill,
                      borderWidth: 1,
                      borderColor: on ? c.primary : c.border,
                      backgroundColor: on ? c.primarySoft : c.surface,
                    }}
                  >
                    <Text variant="caption" style={{ color: on ? c.text : c.muted }}>
                      {l}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}
        <View style={{ flexDirection: "row", gap: 10 }}>
          <Button
            size="md"
            variant="secondary"
            title={theme === "dark" ? "Light mode" : "Dark mode"}
            icon={theme === "dark" ? Sun : Moon}
            onPress={() => setTheme(theme === "dark" ? "light" : "dark")}
            style={{ flex: 1 }}
          />
          <Button
            size="md"
            variant="secondary"
            title="Start over"
            icon={RotateCcw}
            onPress={() => {
              resetAll();
              setOpen(false);
              router.replace("/");
            }}
            style={{ flex: 1 }}
          />
        </View>
      </ScrollView>
    </Sheet>
  );
}

export function Toaster() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { toasts, dismiss } = useToasts();
  if (!toasts.length) return null;
  return (
    <View pointerEvents="box-none" style={{ position: "absolute", top: insets.top + 8, left: 12, right: 12, gap: 8, alignItems: "center" }}>
      {toasts.map((t) => {
        const Icon = t.tone === "inbox" ? Mail : t.tone === "success" ? CheckCircle2 : t.tone === "danger" ? XCircle : Info;
        const fg = t.tone === "success" ? c.success : t.tone === "danger" ? c.danger : c.primary;
        return (
          <View
            key={t.id}
            accessibilityLiveRegion="polite"
            style={{
              width: "100%",
              maxWidth: 480,
              flexDirection: "row",
              gap: 12,
              padding: 14,
              borderRadius: radius.lg,
              borderWidth: 1,
              borderColor: c.border,
              backgroundColor: c.surface,
              shadowColor: "#000",
              shadowOpacity: 0.35,
              shadowRadius: 20,
              shadowOffset: { width: 0, height: 10 },
              elevation: 8,
            }}
          >
            <Icon size={20} color={fg} />
            <View style={{ flex: 1 }}>
              <Text variant="smallStrong">{t.title}</Text>
              {t.body && (
                <Text variant="small" tone="muted">
                  {t.body}
                </Text>
              )}
            </View>
            <Pressable onPress={() => dismiss(t.id)} hitSlop={10} accessibilityLabel="Dismiss">
              <X size={18} color={c.subtle} />
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}
