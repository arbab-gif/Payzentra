import { router } from "expo-router";
import { KeyRound, Smartphone } from "lucide-react-native";
import { useState } from "react";
import { View } from "react-native";
import { OtpInput } from "@/components/OtpInput";
import { Loading, PageTitle, Screen } from "@/components/Screen";
import { Alert, Button, Field, IconBadge } from "@/components/ui";
import { verifyLoginTotp, verifyRecoveryCode } from "@/lib/api";
import { nextRoute, ROUTES, useApp } from "@/lib/store";
import { useGuard } from "@/lib/useGuard";

export default function LoginMfa() {
  const signOut = useApp((s) => s.signOut);
  const remaining = useApp((s) => s.account?.recoveryCodes.length ?? 0);
  const [mode, setMode] = useState<"app" | "recovery">("app");
  const [code, setCode] = useState("");
  const [recovery, setRecovery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const allowed = useGuard(ROUTES.loginMfa, loading);

  if (!allowed) return <Loading />;

  const finish = () => router.replace(nextRoute(useApp.getState()) as never);

  const submitApp = async (value = code) => {
    if (value.length !== 6 || loading) return;
    setLoading(true);
    setError(null);
    const res = await verifyLoginTotp(value);
    if (!res.ok) {
      setLoading(false);
      setError(res.message);
      setCode("");
      return;
    }
    finish();
  };

  const submitRecovery = async () => {
    if (!recovery.trim()) return setError("Enter one of your recovery codes.");
    setLoading(true);
    setError(null);
    const res = await verifyRecoveryCode(recovery);
    if (!res.ok) {
      setLoading(false);
      return setError(res.message);
    }
    finish();
  };

  const cancel = () => {
    signOut();
    router.replace("/welcome-back");
  };

  if (mode === "recovery") {
    return (
      <Screen
        back={() => { setMode("app"); setError(null); }}
        footer={
          <>
            <Button title="Verify" loading={loading} onPress={submitRecovery} />
            <Button title="Use authenticator app instead" variant="ghost" onPress={() => { setMode("app"); setError(null); }} />
          </>
        }
      >
        <View style={{ marginBottom: 20 }}><IconBadge icon={KeyRound} /></View>
        <PageTitle title="Use a recovery code" subtitle="Enter one of the recovery codes you saved when you set up two-step sign-in. Each code works once." />
        <View style={{ gap: 16 }}>
          {error && <Alert tone="danger" title={error} />}
          <Field
            label="Recovery code"
            placeholder="xxxx-xxxx"
            value={recovery}
            onChangeText={(t) => { setRecovery(t); setError(null); }}
            autoCapitalize="none"
            autoCorrect={false}
            mono
            hint={`You have ${remaining} unused code${remaining === 1 ? "" : "s"}.`}
            autoFocus
          />
          <Alert tone="info" title="No codes left?">Contact support to recover your account. We&apos;ll verify your identity before restoring access.</Alert>
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      back={cancel}
      footer={
        <>
          <Button title="Verify" loading={loading} disabled={code.length !== 6} onPress={() => submitApp()} />
          <Button title="Lost your phone? Use a recovery code" variant="ghost" onPress={() => { setMode("recovery"); setError(null); }} />
        </>
      }
    >
      <View style={{ marginBottom: 20 }}><IconBadge icon={Smartphone} /></View>
      <PageTitle title="Two-step verification" subtitle="Enter the 6-digit code from your authenticator app for Payzentra." />
      <View style={{ gap: 16 }}>
        {error && <Alert tone="danger" title={error} />}
        <OtpInput value={code} onChange={(v) => { setCode(v); setError(null); }} onComplete={submitApp} error={!!error} disabled={loading} label="Authenticator code" />
      </View>
    </Screen>
  );
}
