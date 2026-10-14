import { router } from "expo-router";
import { KeyRound, LockKeyhole, RectangleEllipsis, ScanFace, ShieldCheck } from "lucide-react-native";
import { useState } from "react";
import { ActivityIndicator, Switch, View } from "react-native";
import { AppPage, Group } from "@/components/AppPage";
import { BIOMETRIC_NAME } from "@/components/DevicePrompt";
import { soon } from "@/components/home/parts";
import { Row } from "@/components/ProfileRows";
import { Loading } from "@/components/Screen";
import { Alert, Text } from "@/components/ui";
import { enableBiometrics } from "@/lib/api";
import { useSeed } from "@/lib/preview";
import { ROUTES, useApp } from "@/lib/store";
import { useColors } from "@/lib/theme";
import { toast } from "@/lib/toast";
import { useGuard } from "@/lib/useGuard";

type Note = { tone: "warning" | "info"; title: string; body: string };

/** Profile → Security: how the customer unlocks the app, signs in and approves payments. */
export default function ProfileSecurity() {
  const c = useColors();
  const allowed = useGuard(ROUTES.profileSecurity);
  const account = useApp((s) => s.account);
  const biometric = useApp((s) => s.scenarios.biometric);
  const seed = useSeed<{ note: Note }>();
  const [busy, setBusy] = useState<null | "bio">(null);
  const [note, setNote] = useState<Note | null>(seed.note ?? null);

  if (!allowed || !account) return <Loading />;

  const toggleBiometrics = async (on: boolean) => {
    setNote(null);
    if (on) return router.push(`${ROUTES.biometrics}?from=profile` as never);
    setBusy("bio");
    await enableBiometrics(false);
    setBusy(null);
    toast({ tone: "info", title: `${BIOMETRIC_NAME} is off`, body: "You'll unlock with your 6-digit code." });
  };

  return (
    <AppPage page="profile" title="Security" parent={ROUTES.profile}>
      <Group title="Unlocking this device" footer="Your unlock code opens the app on this device. It's different from your transaction PIN.">
        <Row
          Icon={LockKeyhole}
          title="Unlock code"
          detail="6 digits · opens the app on this device"
          right={<Text variant="smallStrong" tone="primary">Change</Text>}
          onPress={() => router.push(`${ROUTES.setUnlockCode}?mode=change` as never)}
        />
        <Row
          Icon={ScanFace}
          title={`Unlock with ${BIOMETRIC_NAME}`}
          detail={biometric === "unavailable" ? `${BIOMETRIC_NAME} isn't set up on this device` : account.biometrics ? "On · you can still use your code" : "Off"}
          right={
            busy === "bio" ? (
              <ActivityIndicator color={c.primary} />
            ) : (
              <Switch
                value={account.biometrics}
                disabled={biometric === "unavailable"}
                onValueChange={toggleBiometrics}
                trackColor={{ false: c.surface2, true: c.primary }}
                thumbColor="#ffffff"
                accessibilityLabel={`Unlock with ${BIOMETRIC_NAME}`}
              />
            )
          }
        />
      </Group>

      <Group title="Signing in">
        <Row
          Icon={KeyRound}
          title="Change password"
          detail="Update your account password"
          right={<Text variant="smallStrong" tone="primary">Change</Text>}
          onPress={() => soon("Change password")}
        />
        <Row
          Icon={ShieldCheck}
          title="Two-step sign-in"
          detail={account.mfaEnabled ? "On · authenticator app" : "Add an authenticator app"}
          right={account.mfaEnabled ? <Text variant="smallStrong" style={{ color: c.success }}>On</Text> : <Text variant="smallStrong" tone="primary">Set up</Text>}
          onPress={account.mfaEnabled ? undefined : () => router.push(ROUTES.secure as never)}
        />
      </Group>
      {note && (
        <View style={{ marginTop: -12, marginBottom: 24 }}>
          <Alert tone={note.tone} title={note.title}>{note.body}</Alert>
        </View>
      )}

      <Group title="Payments" footer="Your transaction PIN approves payments. You'll set it when you make your first one.">
        <Row Icon={RectangleEllipsis} title="Transaction PIN" detail="4 digits · approves payments" right={<Text variant="small" tone="muted">Not set</Text>} onPress={() => soon("Transaction PIN")} />
      </Group>
    </AppPage>
  );
}
