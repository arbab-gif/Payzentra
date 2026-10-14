import { Check, KeyRound, ScanFace, X } from "lucide-react-native";
import { useEffect, useState } from "react";
import { ActivityIndicator, Modal, Platform, Pressable, View } from "react-native";
import type { PromptOutcome } from "@/lib/api";
import { radius, useColors } from "@/lib/theme";
import { Button, haptic, Text } from "./ui";

type Kind = "biometric" | "passkey";

/** What this phone calls its biometrics. */
export const BIOMETRIC_NAME = Platform.OS === "android" ? "fingerprint" : "Face ID";

/**
 * Stand-in for the phone's own Face ID / fingerprint or passkey sheet. In the
 * live app this is the system prompt (expo-local-authentication / WebAuthn);
 * here the outcome comes from Demo controls so every path can be shown:
 * success, failure (try again or fall back), cancel, unavailable.
 */
export function DevicePrompt({
  open,
  kind,
  title,
  subtitle,
  outcome,
  onResult,
}: {
  open: boolean;
  kind: Kind;
  title: string;
  subtitle: string;
  /** Called each time the prompt runs, so "Try again" can produce a different result. */
  outcome: () => PromptOutcome;
  onResult: (r: "success" | "cancel" | "fallback") => void;
}) {
  const c = useColors();
  const [phase, setPhase] = useState<"scanning" | "success" | "failed">("scanning");
  const [run, setRun] = useState(0);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    const t = setTimeout(() => {
      if (!alive) return;
      const r = outcome();
      if (r === "success") {
        setPhase("success");
        haptic("success");
        setTimeout(() => alive && onResult("success"), 650);
      } else if (r === "cancel") {
        onResult("cancel");
      } else {
        setPhase("failed");
        haptic("error");
      }
    }, 1300);
    return () => {
      alive = false;
      clearTimeout(t);
    };
    // Re-run on every open and every "Try again".
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, run]);

  const Icon = kind === "biometric" ? ScanFace : KeyRound;

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={() => onResult("cancel")} onShow={() => setPhase("scanning")}>
      <View style={{ flex: 1, backgroundColor: c.overlay, alignItems: "center", justifyContent: "center", padding: 24 }}>
        <View style={{ width: "100%", maxWidth: 320, borderRadius: radius.xl, backgroundColor: c.bgElevated, padding: 24, alignItems: "center", gap: 10 }} accessibilityViewIsModal>
          <View style={{ width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center", backgroundColor: phase === "failed" ? c.dangerSoft : phase === "success" ? c.successSoft : c.primarySoft }}>
            {phase === "success" ? <Check size={36} color={c.success} strokeWidth={3} /> : phase === "failed" ? <X size={34} color={c.danger} strokeWidth={2.6} /> : <Icon size={36} color={c.primary} />}
          </View>
          <Text variant="bodyStrong" center style={{ marginTop: 6 }}>
            {phase === "failed" ? (kind === "biometric" ? "Not recognised" : "Passkey didn't work") : title}
          </Text>
          <Text variant="small" tone="muted" center accessibilityLiveRegion="polite">
            {phase === "failed" ? (kind === "biometric" ? "Try again, or use your unlock code instead." : "Try again, or continue with your password.") : phase === "success" ? "Done" : subtitle}
          </Text>
          {phase === "scanning" && <ActivityIndicator color={c.primary} style={{ marginTop: 6 }} />}
          {phase === "failed" ? (
            <View style={{ alignSelf: "stretch", gap: 8, marginTop: 10 }}>
              <Button title="Try again" size="md" onPress={() => { setPhase("scanning"); setRun((n) => n + 1); }} />
              <Button title={kind === "biometric" ? "Use unlock code" : "Use password"} size="md" variant="secondary" onPress={() => onResult("fallback")} />
            </View>
          ) : phase === "scanning" ? (
            <Pressable onPress={() => onResult("cancel")} accessibilityRole="button" hitSlop={10} style={{ marginTop: 8 }}>
              <Text variant="smallStrong" tone="primary">Cancel</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}
