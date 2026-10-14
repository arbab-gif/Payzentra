import { router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { PageTitle, Screen } from "@/components/Screen";
import { Alert, Button, Field, LinkText, Text } from "@/components/ui";
import { startSignup } from "@/lib/api";
import { ROUTES } from "@/lib/store";
import { isEmail } from "@/lib/validation";

/** Sign-up step 1: email only. A code is sent to confirm it before a password is set. */
export default function SignUpEmail() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [duplicate, setDuplicate] = useState<string | null>(null);

  const error = !submitted ? null : !email.trim() ? "Enter your email address." : !isEmail(email) ? "Enter a valid email address, like name@example.com." : null;

  const submit = async () => {
    setSubmitted(true);
    setDuplicate(null);
    if (!isEmail(email)) return;
    setLoading(true);
    const res = await startSignup(email.trim());
    setLoading(false);
    if (!res.ok) return setDuplicate(res.message);
    router.push(ROUTES.verifyEmail as never);
  };

  return (
    <Screen
      back
      footer={
        <>
          <Button title="Continue" loading={loading} onPress={submit} />
          <View style={{ flexDirection: "row", justifyContent: "center", gap: 6, paddingTop: 4 }}>
            <Text variant="small" tone="muted">Already have an account?</Text>
            <LinkText onPress={() => router.replace("/login")}>Log in</LinkText>
          </View>
        </>
      }
    >
      <PageTitle title="What's your email?" subtitle="We'll send you a code to confirm it. You'll use it to log in." />
      <View style={{ gap: 16 }}>
        {duplicate && (
          <Alert
            tone="warning"
            title="You may already have an account"
            action={
              <View style={{ flexDirection: "row", gap: 18 }}>
                <LinkText onPress={() => router.replace("/login")}>Log in instead</LinkText>
                <LinkText onPress={() => router.push(`/forgot-password?email=${encodeURIComponent(email)}`)}>Reset password</LinkText>
              </View>
            }
          >
            {duplicate}
          </Alert>
        )}
        <Field
          label="Email address"
          placeholder="name@example.com"
          value={email}
          onChangeText={(t) => {
            setEmail(t);
            setDuplicate(null);
          }}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="emailAddress"
          autoComplete="email"
          returnKeyType="next"
          onSubmitEditing={submit}
          error={error}
          autoFocus
        />
      </View>
    </Screen>
  );
}
