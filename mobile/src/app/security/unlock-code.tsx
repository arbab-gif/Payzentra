import { router, useLocalSearchParams } from "expo-router";
import { Info } from "lucide-react-native";
import { useState } from "react";
import { View } from "react-native";
import { CodePad } from "@/components/CodePad";
import { Loading, Screen } from "@/components/Screen";
import { Text } from "@/components/ui";
import { biometricsAvailable, checkUnlockCode, setUnlockCode, UNLOCK_CODE_LENGTH } from "@/lib/api";
import { ROUTES, useApp } from "@/lib/store";
import { radius, useColors } from "@/lib/theme";
import { toast } from "@/lib/toast";
import { useGuard } from "@/lib/useGuard";

type Stage = "current" | "new" | "confirm";

/** Codes that are too easy to guess. */
function weak(code: string) {
  if (/^(\d)\1+$/.test(code)) return true;
  const asc = "0123456789012345";
  const desc = "9876543210987654";
  return asc.includes(code) || desc.includes(code);
}

/**
 * Set the 6-digit unlock code that opens the app on this device.
 * mode: setup (after sign-up or on a new device) · reset (forgot code) · change (Profile).
 */
export default function UnlockCodeScreen() {
  const c = useColors();
  const { mode = "setup" } = useLocalSearchParams<{ mode?: "setup" | "reset" | "change" }>();
  const hasBiometrics = useApp((s) => s.account?.biometrics);
  const [stage, setStage] = useState<Stage>(mode === "change" ? "current" : "new");
  const [first, setFirst] = useState("");
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const allowed = useGuard(ROUTES.setUnlockCode, busy);

  if (!allowed) return <Loading />;

  const done = async (code: string) => {
    setBusy(true);
    await setUnlockCode(code);
    if (mode === "change") {
      toast({ tone: "success", title: "Unlock code updated", body: "Use your new code next time you open Payzentra." });
      router.back();
      return;
    }
    if (mode === "reset") toast({ tone: "success", title: "New unlock code set" });
    // Offer biometrics once, if this phone has them and they're not on yet.
    router.replace((biometricsAvailable() && !hasBiometrics ? ROUTES.biometrics : ROUTES.home) as never);
  };

  const complete = async (code: string) => {
    setError(null);
    if (stage === "current") {
      setBusy(true);
      const res = await checkUnlockCode(code);
      setBusy(false);
      setValue("");
      if (!res.ok) {
        if (res.code === "LOCKED") {
          router.replace(`${ROUTES.welcomeBack}?reason=locked` as never);
          return;
        }
        setError(`${res.message} ${res.attemptsLeft} attempt${res.attemptsLeft === 1 ? "" : "s"} left.`);
        return;
      }
      setStage("new");
      return;
    }
    if (stage === "new") {
      if (weak(code)) {
        setValue("");
        setError("That code is too easy to guess. Avoid repeats like 111111 or runs like 123456.");
        return;
      }
      setFirst(code);
      setValue("");
      setStage("confirm");
      return;
    }
    if (code !== first) {
      setValue("");
      setFirst("");
      setStage("new");
      setError("Codes don't match. Choose your code again.");
      return;
    }
    await done(code);
  };

  const copy = {
    current: { title: "Enter your current code", body: "Confirm it's you before choosing a new unlock code." },
    new: {
      title: mode === "change" ? "Choose a new unlock code" : mode === "reset" ? "Set a new unlock code" : "Set your unlock code",
      body: "You'll use these 6 digits to open Payzentra on this phone.",
    },
    confirm: { title: "Confirm your unlock code", body: "Enter the same 6 digits again." },
  }[stage];

  return (
    <Screen back={mode === "change" ? true : stage === "confirm" ? () => { setStage("new"); setValue(""); setFirst(""); setError(null); } : undefined} scroll>
      <View style={{ alignItems: "center", gap: 10, marginTop: 8 }}>
        <Text variant="title" center accessibilityRole="header">{copy.title}</Text>
        <Text tone="muted" center style={{ maxWidth: 320 }}>{copy.body}</Text>
      </View>
      <View style={{ marginTop: 32 }}>
        <CodePad value={value} onChange={(v) => { setValue(v); if (error) setError(null); }} onComplete={complete} length={UNLOCK_CODE_LENGTH} error={error} busy={busy} />
      </View>
      {stage !== "current" && (
        <View style={{ flexDirection: "row", gap: 10, marginTop: 24, padding: 14, borderRadius: radius.md, backgroundColor: c.surface }}>
          <Info size={18} color={c.info} style={{ marginTop: 1 }} />
          <Text variant="small" tone="muted" style={{ flex: 1 }}>
            Your unlock code only opens the app. It&apos;s different from the transaction PIN you&apos;ll set to approve payments.
          </Text>
        </View>
      )}
    </Screen>
  );
}
