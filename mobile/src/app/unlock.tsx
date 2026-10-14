import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { ScanFace } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TopGlow } from "@/components/Brand";
import { CodePad } from "@/components/CodePad";
import { useDemoSheet } from "@/components/DemoSheet";
import { BIOMETRIC_NAME, DevicePrompt } from "@/components/DevicePrompt";
import { useCustomerName } from "@/components/home/parts";
import { Loading } from "@/components/Screen";
import { LinkText, Text } from "@/components/ui";
import { biometricOutcome, checkUnlockCode, restoreSession, UNLOCK_CODE_LENGTH } from "@/lib/api";
import { ROUTES, useApp } from "@/lib/store";
import { useColors } from "@/lib/theme";
import { useGuard } from "@/lib/useGuard";

/**
 * Shown every time the app opens on a signed-in device: unlock with the 6-digit
 * code or Face ID / fingerprint. No email and password needed. After unlocking,
 * the saved session is restored quietly; only a truly expired session asks the
 * customer to log in again.
 */
export default function Unlock() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const account = useApp((s) => s.account);
  const { firstName, initials } = useCustomerName();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [restoring, setRestoring] = useState<null | "quick" | "refresh">(null);
  const [prompt, setPrompt] = useState(false);
  const autoPrompted = useRef(false);
  const allowed = useGuard(ROUTES.unlock, busy || !!restoring);

  // Offer biometrics straight away when they're turned on.
  useEffect(() => {
    if (allowed && account?.biometrics && !autoPrompted.current) {
      autoPrompted.current = true;
      setPrompt(true);
    }
  }, [allowed, account?.biometrics]);

  if (!allowed || !account) return <Loading />;

  const name = firstName;

  const enter = async () => {
    setRestoring(useApp.getState().scenarios.session === "refresh" ? "refresh" : "quick");
    const res = await restoreSession();
    if (res.ok) router.replace(ROUTES.home as never);
    else router.replace(ROUTES.sessionExpired as never);
  };

  const complete = async (code: string) => {
    setBusy(true);
    const res = await checkUnlockCode(code);
    setBusy(false);
    setValue("");
    if (res.ok) return enter();
    if (res.code === "LOCKED") return router.replace(`${ROUTES.welcomeBack}?reason=locked` as never);
    setError(`${res.message} ${res.attemptsLeft} attempt${res.attemptsLeft === 1 ? "" : "s"} left.`);
  };

  if (restoring) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg, alignItems: "center", justifyContent: "center", gap: 14 }} accessibilityLiveRegion="polite">
        <TopGlow />
        <ActivityIndicator color={c.primary} size="large" />
        <Text variant="bodyStrong">{restoring === "refresh" ? "Refreshing your session…" : "Signing you in…"}</Text>
        {restoring === "refresh" && <Text variant="small" tone="muted" center style={{ maxWidth: 280 }}>Your sign-in had timed out, so we&apos;re renewing it. No need to log in again.</Text>}
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <TopGlow />
      <ScrollView contentContainerStyle={{ flexGrow: 1, alignItems: "center", justifyContent: "center", paddingTop: insets.top + 24, paddingBottom: Math.max(insets.bottom, 16) + 16, paddingHorizontal: 20 }}>
        {/* Long-press the avatar for Demo controls. */}
        <Pressable onLongPress={() => useDemoSheet.getState().setOpen(true)} delayLongPress={600} accessible={false}>
          <View style={{ width: 72, height: 72, borderRadius: 36, overflow: "hidden", alignItems: "center", justifyContent: "center" }}>
            <LinearGradient colors={["#a3b0ff", "#667cff"]} style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }} />
            <Text variant="title" style={{ color: "#ffffff" }}>{initials}</Text>
          </View>
        </Pressable>
        <Text variant="title" center style={{ marginTop: 16 }} accessibilityRole="header">
          Welcome back, {name}
        </Text>
        <Text tone="muted" center style={{ marginTop: 6 }}>Enter your unlock code</Text>

        <View style={{ marginTop: 32 }}>
          <CodePad
            value={value}
            onChange={(v) => { setValue(v); if (error) setError(null); }}
            onComplete={complete}
            length={UNLOCK_CODE_LENGTH}
            error={error}
            busy={busy}
            extra={account.biometrics ? { Icon: ScanFace, label: `Unlock with ${BIOMETRIC_NAME}`, onPress: () => setPrompt(true) } : undefined}
          />
        </View>

        <View style={{ marginTop: 28, alignItems: "center", gap: 14 }}>
          <LinkText onPress={() => router.push(ROUTES.forgotCode as never)}>Forgot unlock code?</LinkText>
          <Text variant="small" tone="muted">
            Not {name}?{" "}
            <Text
              variant="smallStrong"
              tone="primary"
              onPress={() => {
                useApp.getState().signOut();
                router.replace("/login?other=1");
              }}
            >
              Log out
            </Text>
          </Text>
        </View>
      </ScrollView>

      <DevicePrompt
        open={prompt}
        kind="biometric"
        title={BIOMETRIC_NAME}
        subtitle="Unlock Payzentra"
        outcome={biometricOutcome}
        onResult={(r) => {
          setPrompt(false);
          if (r === "success") enter();
          else if (r === "fallback") setError(`${BIOMETRIC_NAME} didn't work. Enter your unlock code instead.`);
        }}
      />
    </View>
  );
}
