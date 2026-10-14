import { LinearGradient } from "expo-linear-gradient";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { Screen } from "@/components/Screen";
import { NewDeviceCheck, PasskeyOption } from "@/components/SignIn";
import { Alert, Button, LinkText, PasswordField, Text } from "@/components/ui";
import { login } from "@/lib/api";
import { nextRoute, useApp } from "@/lib/store";

function maskEmail(email: string) {
  const [user, domain] = email.split("@");
  return `${user.slice(0, 2)}${"•".repeat(Math.max(1, user.length - 2))}@${domain}`;
}

/**
 * Signed out on a device that remembers the account (after logging out, a
 * locked unlock code or an expired session): password or passkey.
 */
export default function WelcomeBack() {
  const { reason } = useLocalSearchParams<{ reason?: "expired" | "locked" }>();
  const account = useApp((s) => s.account);
  const firstName = useApp((s) => s.kyc.identity?.firstName);
  const [password, setPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ code: string; message: string } | null>(null);
  const [deviceCheck, setDeviceCheck] = useState(false);

  if (!account) return <Redirect href="/" />;
  const initials = (firstName ?? account.email).slice(0, 1).toUpperCase();
  const finish = () => router.replace(nextRoute(useApp.getState()) as never);

  if (deviceCheck) return <NewDeviceCheck email={account.email} onDone={finish} onCancel={() => setDeviceCheck(false)} />;

  const submit = async () => {
    setSubmitted(true);
    setError(null);
    if (!password) return;
    setLoading(true);
    const res = await login(account.email, password);
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
          <PasskeyOption onSignedIn={finish} onError={setError} />
          <Button title="Not you? Use another account" variant="ghost" onPress={() => router.push("/login?other=1")} />
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
        <Text tone="muted" center style={{ marginTop: 6 }}>{maskEmail(account.email)}</Text>
      </View>
      <View style={{ gap: 16 }}>
        {reason === "expired" && !error && (
          <Alert tone="info" title="Your session has ended">Log in again to continue. Your unlock code stays the same on this phone.</Alert>
        )}
        {reason === "locked" && !error && (
          <Alert tone="warning" title="Unlock code locked">Too many wrong attempts. Log in with your password, then set a new unlock code.</Alert>
        )}
        {error && (
          <Alert tone={error.code === "LOCKED" ? "warning" : "danger"} title={error.code === "LOCKED" ? "Sign-in paused" : error.code.startsWith("PASSKEY") || error.code === "UNSUPPORTED" ? "Passkey sign-in didn't work" : "Couldn't log you in"}>
            {error.message}
          </Alert>
        )}
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
    </Screen>
  );
}
