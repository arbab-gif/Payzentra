import { router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { PasswordRules } from "@/components/PasswordRules";
import { Loading, PageTitle, Screen } from "@/components/Screen";
import { Button, Card, Checkbox, PasswordField, Text } from "@/components/ui";
import { setPassword as savePassword } from "@/lib/api";
import { useSeed } from "@/lib/preview";
import { ROUTES, useApp } from "@/lib/store";
import { toast } from "@/lib/toast";
import { useGuard } from "@/lib/useGuard";
import { passwordOk } from "@/lib/validation";

/** Sign-up step 3: set and confirm a password (the email is already verified). */
export default function SignUpPassword() {
  const email = useApp((s) => s.account?.email ?? "");
  const seed = useSeed<{ password: string; confirm: string; terms: boolean; submitted: boolean }>();
  const [password, setPassword] = useState(seed.password ?? "");
  const [confirm, setConfirm] = useState(seed.confirm ?? "");
  const [terms, setTerms] = useState(seed.terms ?? false);
  const [submitted, setSubmitted] = useState(seed.submitted ?? false);
  const [loading, setLoading] = useState(false);
  const allowed = useGuard(ROUTES.password, loading);

  if (!allowed) return <Loading />;

  const legal = () => toast({ tone: "info", title: "Legal documents", body: "In the live app this opens the current Terms of Use and Privacy Policy." });

  const passwordError = !submitted ? null : !password ? "Create a password." : !passwordOk(password) ? "Your password doesn't meet all the requirements below." : null;
  // Mismatch shows as soon as the confirmation is as long as the password, not only on submit.
  const mismatch = confirm.length > 0 && (confirm.length >= password.length || submitted) && confirm !== password;
  const confirmError = submitted && !confirm ? "Confirm your password." : mismatch ? "Passwords don't match." : null;

  const submit = async () => {
    setSubmitted(true);
    if (!passwordOk(password) || confirm !== password || !terms) return;
    setLoading(true);
    await savePassword(password);
    router.replace(ROUTES.setUnlockCode as never);
  };

  return (
    <Screen footer={<Button title="Continue" loading={loading} onPress={submit} />}>
      <PageTitle
        title="Create a password"
        subtitle={
          <Text tone="muted">
            For <Text variant="bodyStrong">{email}</Text>. You&apos;ll use it to log in on a new device.
          </Text>
        }
      />
      <View style={{ gap: 16 }}>
        <PasswordField
          label="Password"
          placeholder="Create a strong password"
          value={password}
          onChangeText={setPassword}
          textContentType="newPassword"
          autoComplete="new-password"
          error={passwordError}
          autoFocus
        />
        <Card>
          <PasswordRules value={password} showErrors={submitted} />
        </Card>
        <PasswordField
          label="Confirm password"
          placeholder="Type it again"
          value={confirm}
          onChangeText={setConfirm}
          textContentType="newPassword"
          autoComplete="new-password"
          error={confirmError}
          hint={confirm && confirm === password && passwordOk(password) ? "Passwords match." : undefined}
        />
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
