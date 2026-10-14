import { LinearGradient } from "expo-linear-gradient";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import { ScanFace } from "lucide-react-native";
import { useState } from "react";
import { View } from "react-native";
import { Screen } from "@/components/Screen";
import { BIOMETRIC_NAME, DevicePrompt } from "@/components/DevicePrompt";
import { NewDeviceCheck } from "@/components/SignIn";
import { Alert, Button, Field, LinkText, PasswordField, Text } from "@/components/ui";
import { biometricOutcome, biometricsAvailable, login, passkeySignIn } from "@/lib/api";
import { nextRoute, useApp } from "@/lib/store";

/**
 * Signed out on a device that remembers the account (after logging out, a
 * locked unlock code or an expired session): password or passkey.
 */
export default function WelcomeBack() {
  const { reason } = useLocalSearchParams<{ reason?: "expired" | "locked" }>();
  const account = useApp((s) => s.account);
  const firstName = useApp((s) => s.kyc.identity?.firstName);
  const [email, setEmail] = useState(account?.email ?? "");
  const [password, setPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ code: string; message: string } | null>(null);
  const [deviceCheck, setDeviceCheck] = useState(false);
  const [bioPrompt, setBioPrompt] = useState(false);
  const [bioLoading, setBioLoading] = useState(false);

  if (!account) return <Redirect href="/" />;
  const initials = (firstName ?? account.email).slice(0, 1).toUpperCase();
  const finish = () => router.replace(nextRoute(useApp.getState()) as never);

  if (deviceCheck) return <NewDeviceCheck email={account.email} onDone={finish} onCancel={() => setDeviceCheck(false)} />;

  const submit = async () => {
    setSubmitted(true);
    setError(null);
    if (!email || !password) return;
    setLoading(true);
    const res = await login(email, password);
    setLoading(false);
    if (!res.ok) return setError(res);
    if (res.data.deviceCheck) return setDeviceCheck(true);
    finish();
  };

  return (
    <Screen
      footer={
        <>
          <Button title="Log in" loading={loading} onPress={submit} />
          {biometricsAvailable() && (
            <Button title={`Sign in with ${BIOMETRIC_NAME}`} variant="secondary" icon={ScanFace} loading={bioLoading} onPress={() => setBioPrompt(true)} />
          )}
          <View style={{ flexDirection: "row", justifyContent: "center", gap: 6, marginTop: 4 }}>
            <Text variant="small" tone="muted">New to Payzentra?</Text>
            <LinkText onPress={() => router.replace("/signup")}>Create an account</LinkText>
          </View>
        </>
      }
    >
      <View style={{ alignItems: "center", marginTop: 16, marginBottom: 28 }}>
        <View style={{ width: 84, height: 84, borderRadius: 42, overflow: "hidden", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
          <LinearGradient colors={["#a3b0ff", "#667cff"]} style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }} />
          <Text variant="title" style={{ color: "#ffffff" }}>{initials}</Text>
        </View>
        <Text variant="title" center accessibilityRole="header">
          Welcome back{firstName ? `, ${firstName}` : ""}
        </Text>
      </View>
      <View style={{ gap: 16 }}>
        {reason === "expired" && !error && (
          <Alert tone="info" title="Your session has ended">Log in again to continue. Your unlock code stays the same on this phone.</Alert>
        )}
        {reason === "locked" && !error && (
          <Alert tone="warning" title="Unlock code locked">Too many wrong attempts. Log in with your password, then set a new unlock code.</Alert>
        )}
        {error && (
          <Alert tone={error.code === "LOCKED" ? "warning" : "danger"} title={error.code === "LOCKED" ? "Sign-in paused" : "Couldn't log you in"}>
            {error.message}
          </Alert>
        )}
        <Field
          label="Email"
          placeholder="you@example.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          textContentType="emailAddress"
          autoComplete="email"
          autoCapitalize="none"
          error={submitted && !email ? "Enter your email." : null}
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
          <LinkText onPress={() => router.push(`/forgot-password?email=${encodeURIComponent(account.email)}`)}>Forgot password?</LinkText>
        </View>
      </View>
      {account.mfaEnabled && (
        <Text variant="caption" tone="subtle" center style={{ marginTop: 28 }}>
          You&apos;ll confirm with your authenticator app next.
        </Text>
      )}
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
