import { router, useLocalSearchParams } from "expo-router";
import { CheckCircle2, KeyRound, Mail } from "lucide-react-native";
import { useState } from "react";
import { View } from "react-native";
import { OtpInput } from "@/components/OtpInput";
import { PasswordRules } from "@/components/PasswordRules";
import { PageTitle, Screen } from "@/components/Screen";
import { Alert, Button, Field, IconBadge, LinkText, PasswordField, StatusHero, Text } from "@/components/ui";
import { requestPasswordReset, resetPassword, verifyResetCode } from "@/lib/api";
import { useColors } from "@/lib/theme";
import { isEmail, passwordOk } from "@/lib/validation";

type Stage = "email" | "code" | "password" | "done";

export default function ForgotPassword() {
  const c = useColors();
  const params = useLocalSearchParams<{ email?: string }>();
  const [stage, setStage] = useState<Stage>("email");
  const [email, setEmail] = useState(params.email ?? "");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendCode = async () => {
    setSubmitted(true);
    if (!isEmail(email)) return;
    setLoading(true);
    await requestPasswordReset(email.trim());
    setLoading(false);
    setSubmitted(false);
    setStage("code");
  };

  const checkCode = async (value = code) => {
    if (value.length !== 6 || loading) return;
    setLoading(true);
    setError(null);
    const res = await verifyResetCode(value);
    setLoading(false);
    if (!res.ok) {
      setError(res.message + (res.attemptsLeft !== undefined ? ` ${res.attemptsLeft} attempts left.` : ""));
      setCode("");
      return;
    }
    setStage("password");
  };

  const save = async () => {
    setSubmitted(true);
    if (!passwordOk(password) || password !== confirm) return;
    setLoading(true);
    await resetPassword(email.trim(), password);
    setLoading(false);
    setStage("done");
  };

  if (stage === "done") {
    return (
      <Screen center footer={<Button title="Log in" onPress={() => router.replace("/welcome-back")} />}>
        <StatusHero tone="success" icon={CheckCircle2} title="Password updated" body="For your security we've signed you out of all devices. Log in with your new password." />
      </Screen>
    );
  }

  if (stage === "password") {
    return (
      <Screen back={() => setStage("code")} footer={<Button title="Update password" loading={loading} onPress={save} />}>
        <PageTitle title="Create a new password" subtitle="Choose a password you haven't used for Payzentra before." />
        <View style={{ gap: 18 }}>
          <PasswordField
            label="New password"
            value={password}
            onChangeText={setPassword}
            textContentType="newPassword"
            autoComplete="new-password"
            error={submitted && !passwordOk(password) ? "Your password doesn't meet all the requirements." : null}
            autoFocus
          />
          <PasswordRules value={password} showErrors={submitted} />
          <PasswordField
            label="Confirm new password"
            value={confirm}
            onChangeText={setConfirm}
            textContentType="newPassword"
            error={submitted && password !== confirm ? "Passwords don't match." : null}
          />
        </View>
      </Screen>
    );
  }

  if (stage === "code") {
    return (
      <Screen back={() => setStage("email")} footer={<Button title="Continue" loading={loading} disabled={code.length !== 6} onPress={() => checkCode()} />}>
        <View style={{ marginBottom: 20 }}><IconBadge icon={Mail} /></View>
        <PageTitle
          title="Enter your reset code"
          subtitle={
            <Text tone="muted">
              If an account exists for <Text variant="bodyStrong">{email}</Text>, we&apos;ve sent a 6-digit code to it.
            </Text>
          }
        />
        <View style={{ gap: 16 }}>
          {error && <Alert tone="danger" title={error} />}
          <OtpInput value={code} onChange={(v) => { setCode(v); setError(null); }} onComplete={checkCode} error={!!error} disabled={loading} />
          <LinkText onPress={sendCode}>Send a new code</LinkText>
        </View>
      </Screen>
    );
  }

  return (
    <Screen back footer={<Button title="Send reset code" loading={loading} onPress={sendCode} />}>
      <View style={{ marginBottom: 20 }}><IconBadge icon={KeyRound} /></View>
      <PageTitle title="Reset your password" subtitle="Enter the email you use for Payzentra and we'll send you a code." />
      <Field
        label="Email address"
        placeholder="name@example.com"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        left={<Mail size={18} color={c.muted} />}
        error={submitted && !isEmail(email) ? "Enter a valid email address." : null}
        autoFocus
      />
    </Screen>
  );
}
