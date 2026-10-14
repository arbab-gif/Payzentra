import { router } from "expo-router";
import { KeyRound } from "lucide-react-native";
import { useState } from "react";
import { View } from "react-native";
import { Loading, PageTitle, Screen } from "@/components/Screen";
import { Alert, Button, IconBadge, LinkText, PasswordField } from "@/components/ui";
import { verifyPasswordForReset } from "@/lib/api";
import { useSeed } from "@/lib/preview";
import { ROUTES, useApp } from "@/lib/store";
import { useGuard } from "@/lib/useGuard";

/** Forgotten unlock code: confirm the account password, then choose a new code. */
export default function ForgotCode() {
  const email = useApp((s) => s.account?.email ?? "");
  const seed = useSeed<{ password: string; submitted: boolean; error: string }>();
  const [password, setPassword] = useState(seed.password ?? "");
  const [submitted, setSubmitted] = useState(seed.submitted ?? false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(seed.error ?? null);
  const allowed = useGuard(ROUTES.forgotCode, loading);

  if (!allowed) return <Loading />;

  const submit = async () => {
    setSubmitted(true);
    setError(null);
    if (!password) return;
    setLoading(true);
    const res = await verifyPasswordForReset(password);
    if (!res.ok) {
      setLoading(false);
      setError(res.message);
      return;
    }
    router.replace(`${ROUTES.setUnlockCode}?mode=reset` as never);
  };

  return (
    <Screen back footer={<Button title="Continue" loading={loading} onPress={submit} />}>
      <View style={{ marginBottom: 20 }}>
        <IconBadge icon={KeyRound} />
      </View>
      <PageTitle title="Reset your unlock code" subtitle="Enter your Payzentra password to confirm it's you. Then you'll choose a new 6-digit code." />
      <View style={{ gap: 16 }}>
        {error && <Alert tone="danger" title="Couldn't confirm it's you">{error}</Alert>}
        <PasswordField
          label="Password"
          placeholder="Your password"
          value={password}
          onChangeText={(t) => { setPassword(t); if (error) setError(null); }}
          textContentType="password"
          autoComplete="current-password"
          returnKeyType="go"
          onSubmitEditing={submit}
          error={submitted && !password ? "Enter your password." : null}
          autoFocus
        />
        <View style={{ alignItems: "flex-end" }}>
          <LinkText onPress={() => router.push(`/forgot-password?email=${encodeURIComponent(email)}`)}>Forgot your password too?</LinkText>
        </View>
      </View>
    </Screen>
  );
}
