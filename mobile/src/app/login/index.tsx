import { router } from "expo-router";
import { Mail, ScanFace } from "lucide-react-native";
import { useState } from "react";
import { View } from "react-native";
import { BIOMETRIC_NAME, DevicePrompt } from "@/components/DevicePrompt";
import { PageTitle, Screen } from "@/components/Screen";
import { NewDeviceCheck } from "@/components/SignIn";
import { Alert, Button, Field, LinkText, PasswordField, Text } from "@/components/ui";
import { biometricOutcome, login, passkeySignIn } from "@/lib/api";
import { useRouteParams, useSeed } from "@/lib/preview";
import { nextRoute, useApp } from "@/lib/store";
import { useColors } from "@/lib/theme";
import { isEmail } from "@/lib/validation";

export default function Login() {
  const c = useColors();
  const { other, reason } = useRouteParams<{ other: string; reason: "expired" | "locked" }>();
  const savedEmail = useApp((s) => s.account?.email ?? "");
  const bioAvailable = useApp((s) => s.scenarios.biometric !== "unavailable");
  const seed = useSeed<{ email: string; password: string; submitted: boolean; error: { code: string; message: string }; deviceCheck: boolean; bioPrompt: boolean }>();
  const [email, setEmail] = useState(seed.email ?? (other ? "" : savedEmail));
  const [password, setPassword] = useState(seed.password ?? "");
  const [submitted, setSubmitted] = useState(seed.submitted ?? false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ code: string; message: string } | null>(seed.error ?? null);
  const [deviceCheck, setDeviceCheck] = useState(seed.deviceCheck ?? false);
  const [bioPrompt, setBioPrompt] = useState(seed.bioPrompt ?? false);
  const [bioLoading, setBioLoading] = useState(false);
  const finish = () => router.replace(nextRoute(useApp.getState()) as never);

  if (deviceCheck) return <NewDeviceCheck email={email.trim()} onDone={finish} onCancel={() => setDeviceCheck(false)} />;

  const submit = async () => {
    setSubmitted(true);
    setError(null);
    if (!isEmail(email) || !password) return;
    setLoading(true);
    const res = await login(email.trim(), password);
    setLoading(false);
    if (!res.ok) return setError(res);
    if (res.data.deviceCheck) return setDeviceCheck(true);
    finish();
  };

  return (
    <Screen
      back
      footer={
        <>
          <Button title="Log in" loading={loading} onPress={submit} />
          {bioAvailable && (
            <Button title={`Sign in with ${BIOMETRIC_NAME}`} variant="secondary" icon={ScanFace} loading={bioLoading} onPress={() => setBioPrompt(true)} />
          )}
          <View style={{ flexDirection: "row", justifyContent: "center", gap: 6 }}>
            <Text variant="small" tone="muted">New to Payzentra?</Text>
            <LinkText onPress={() => router.replace("/signup")}>Create an account</LinkText>
          </View>
        </>
      }
    >
      <PageTitle title="Log in" subtitle="Enter your email and password to sign in." />
      <View style={{ gap: 18 }}>
        {reason === "expired" && !error && (
          <Alert tone="info" title="Your session has ended">Log in again to continue. Your unlock code stays the same on this phone.</Alert>
        )}
        {reason === "locked" && !error && (
          <Alert tone="warning" title="Unlock code locked">Too many wrong attempts. Log in with your password, then set a new unlock code.</Alert>
        )}
        {error && (
          <Alert
            tone={error.code === "LOCKED" ? "warning" : "danger"}
            title={error.code === "LOCKED" ? "Sign-in paused" : "Couldn't log you in"}
            action={error.code === "LOCKED" ? <LinkText onPress={() => router.push(`/forgot-password?email=${encodeURIComponent(email)}`)}>Reset password</LinkText> : undefined}
          >
            {error.message}
          </Alert>
        )}
        <Field
          label="Email address"
          placeholder="name@example.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="username"
          autoComplete="email"
          returnKeyType="next"
          left={<Mail size={18} color={c.muted} />}
          error={submitted && !isEmail(email) ? "Enter a valid email address." : null}
        />
        <PasswordField
          label="Password"
          placeholder="Your password"
          value={password}
          onChangeText={setPassword}
          textContentType="password"
          autoComplete="current-password"
          returnKeyType="go"
          onSubmitEditing={submit}
          error={submitted && !password ? "Enter your password." : null}
        />
        <View style={{ alignItems: "flex-end" }}>
          <LinkText onPress={() => router.push(`/forgot-password${email ? `?email=${encodeURIComponent(email)}` : ""}`)}>Forgot password?</LinkText>
        </View>
      </View>
      <DevicePrompt
        open={bioPrompt}
        kind="biometric"
        title={BIOMETRIC_NAME}
        subtitle={`Sign in to Payzentra with ${BIOMETRIC_NAME}`}
        outcome={biometricOutcome}
        onResult={async (r) => {
          setBioPrompt(false);
          if (r !== "success") return;
          setBioLoading(true);
          const res = await passkeySignIn();
          setBioLoading(false);
          if (res.ok) finish();
          else setError(res);
        }}
      />
    </Screen>
  );
}
