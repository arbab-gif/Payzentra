import { Redirect, router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { PasswordRules } from "@/components/PasswordRules";
import { PageTitle, Screen } from "@/components/Screen";
import { Alert, Button, Card, Checkbox, LinkText, PasswordField, Text } from "@/components/ui";
import { register } from "@/lib/api";
import { ROUTES } from "@/lib/store";
import { toast } from "@/lib/toast";
import { isEmail, passwordOk } from "@/lib/validation";

/** Sign-up step 2 of 2: password + terms, then the account is created. */
export default function SignUpPassword() {
  const { email = "" } = useLocalSearchParams<{ email?: string }>();
  const [password, setPassword] = useState("");
  const [terms, setTerms] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Opened without an email (e.g. a refreshed tab): start sign-up again.
  if (!isEmail(email)) return <Redirect href="/signup" />;

  const legal = () => toast({ tone: "info", title: "Legal documents", body: "In the live app this opens the current Terms of Use and Privacy Policy." });

  const submit = async () => {
    setSubmitted(true);
    setError(null);
    if (!passwordOk(password) || !terms) return;
    setLoading(true);
    const res = await register(email, password);
    setLoading(false);
    if (!res.ok) return setError(res.message);
    router.replace(ROUTES.verifyEmail as never);
  };

  return (
    <Screen back footer={<Button title="Create account" loading={loading} onPress={submit} />}>
      <PageTitle
        title="Create a password"
        subtitle={
          <Text tone="muted">
            For <Text variant="bodyStrong">{email}</Text>
          </Text>
        }
      />
      <View style={{ gap: 16 }}>
        {error && (
          <Alert tone="warning" title="You may already have an account" action={<LinkText onPress={() => router.replace("/login")}>Log in instead</LinkText>}>
            {error}
          </Alert>
        )}
        <PasswordField
          label="Password"
          placeholder="Create a strong password"
          value={password}
          onChangeText={setPassword}
          textContentType="newPassword"
          autoComplete="new-password"
          error={submitted && !password ? "Create a password." : submitted && !passwordOk(password) ? "Your password doesn't meet all the requirements below." : null}
          autoFocus
        />
        <Card>
          <PasswordRules value={password} showErrors={submitted} />
        </Card>
        <Checkbox
          label="I agree to the Terms of Use and Privacy Policy, and confirm I'm 18 or older"
          checked={terms}
          onChange={setTerms}
          error={submitted && !terms ? "You need to accept the terms to continue." : null}
        >
          <Text variant="small" tone="muted">
            I agree to Payzentra&apos;s{" "}
            <Text variant="smallStrong" tone="primary" onPress={legal}>Terms of Use</Text> and{" "}
            <Text variant="smallStrong" tone="primary" onPress={legal}>Privacy Policy</Text>, and confirm I&apos;m 18 or older.
          </Text>
        </Checkbox>
      </View>
    </Screen>
  );
}
