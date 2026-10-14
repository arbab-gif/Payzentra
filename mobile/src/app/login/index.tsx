import { router, useLocalSearchParams } from "expo-router";
import { Mail } from "lucide-react-native";
import { useState } from "react";
import { View } from "react-native";
import { PageTitle, Screen } from "@/components/Screen";
import { Alert, Button, Field, LinkText, PasswordField, Text } from "@/components/ui";
import { login } from "@/lib/api";
import { nextRoute, useApp } from "@/lib/store";
import { useColors } from "@/lib/theme";
import { isEmail } from "@/lib/validation";

export default function Login() {
  const c = useColors();
  const { other } = useLocalSearchParams<{ other?: string }>();
  const savedEmail = useApp((s) => s.account?.email ?? "");
  const [email, setEmail] = useState(other ? "" : savedEmail);
  const [password, setPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ code: string; message: string } | null>(null);

  const submit = async () => {
    setSubmitted(true);
    setError(null);
    if (!isEmail(email) || !password) return;
    setLoading(true);
    const res = await login(email.trim(), password);
    setLoading(false);
    if (!res.ok) return setError(res);
    router.replace(nextRoute(useApp.getState()) as never);
  };

  return (
    <Screen
      back
      footer={
        <>
          <Button title="Log in" loading={loading} onPress={submit} />
          <View style={{ flexDirection: "row", justifyContent: "center", gap: 6 }}>
            <Text variant="small" tone="muted">New to Payzentra?</Text>
            <LinkText onPress={() => router.replace("/signup")}>Create an account</LinkText>
          </View>
        </>
      }
    >
      <PageTitle title="Log in" subtitle="Enter your email and password." />
      <View style={{ gap: 18 }}>
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
    </Screen>
  );
}
