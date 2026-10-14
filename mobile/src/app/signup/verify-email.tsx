import { router } from "expo-router";
import { CheckCircle2, MailCheck } from "lucide-react-native";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { OtpInput } from "@/components/OtpInput";
import { Loading, PageTitle, Screen } from "@/components/Screen";
import { Alert, Button, IconBadge, LinkText, StatusHero, Text } from "@/components/ui";
import { EMAIL_CODE_TTL_MS, resendEmailCode, verifyEmailCode } from "@/lib/api";
import { ROUTES, useApp } from "@/lib/store";
import { useGuard } from "@/lib/useGuard";

const RESEND_AFTER = 30;
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

/** Seconds left until `deadline`, ticking once a second. */
function useSecondsUntil(deadline: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  return Math.max(0, Math.ceil((deadline - now) / 1000));
}

type Failure = { code: string; message: string; attemptsLeft?: number };

export default function VerifyEmail() {
  const email = useApp((s) => s.account?.email);
  const resetAll = useApp((s) => s.resetAll);
  const [code, setCode] = useState("");
  const [sentAt, setSentAt] = useState(() => Date.now());
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<Failure | null>(null);
  const [done, setDone] = useState(false);
  const allowed = useGuard(ROUTES.verifyEmail, done || loading);

  const resendIn = useSecondsUntil(sentAt + RESEND_AFTER * 1000);
  const expiresIn = useSecondsUntil(sentAt + EMAIL_CODE_TTL_MS);
  const expired = expiresIn === 0 || error?.code === "EXPIRED";
  const locked = error?.code === "LOCKED";

  if (!allowed) return <Loading />;

  const submit = async (value = code) => {
    if (value.length !== 6 || loading) return;
    setLoading(true);
    setError(null);
    const res = await verifyEmailCode(value);
    if (!res.ok) {
      setLoading(false);
      setError(res);
      setCode("");
      return;
    }
    setDone(true);
    setLoading(false);
    setTimeout(() => router.replace(ROUTES.password as never), 1200);
  };

  const resend = async () => {
    setResending(true);
    await resendEmailCode();
    setResending(false);
    setError(null);
    setCode("");
    setSentAt(Date.now());
  };

  if (done) {
    return (
      <Screen center>
        <StatusHero tone="success" icon={CheckCircle2} title="Email verified" body="Next, create a password for your account." />
      </Screen>
    );
  }

  return (
    <Screen
      footer={
        <>
          <Button title="Verify email" loading={loading} disabled={code.length !== 6 || expired || locked} onPress={() => submit()} />
          <Button
            title="Use a different email"
            variant="ghost"
            onPress={() => {
              resetAll();
              router.replace("/signup");
            }}
          />
        </>
      }
    >
      <View style={{ marginBottom: 20 }}><IconBadge icon={MailCheck} /></View>
      <PageTitle
        title="Check your email"
        subtitle={
          <Text tone="muted">
            We sent a 6-digit code to <Text variant="bodyStrong">{email}</Text>. Enter it below to confirm it&apos;s you.
          </Text>
        }
      />
      <View style={{ gap: 16 }}>
        {error && !expired && !locked && (
          <Alert tone="danger" title={error.message}>
            {error.attemptsLeft !== undefined ? `You have ${error.attemptsLeft} attempt${error.attemptsLeft === 1 ? "" : "s"} left.` : undefined}
          </Alert>
        )}
        {expired && <Alert tone="warning" title="This code has expired">Codes last 10 minutes. Send a new one to continue.</Alert>}
        {locked && <Alert tone="danger" title="Too many incorrect attempts">For your security this code no longer works. Send a new code to try again.</Alert>}

        <OtpInput
          value={code}
          onChange={(v) => {
            setCode(v);
            if (error?.code === "INVALID") setError(null);
          }}
          onComplete={submit}
          error={!!error && !expired}
          disabled={loading || expired || locked}
        />

        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text variant="small" tone="muted">
            {expired ? "Code expired" : `Expires in ${mmss(expiresIn)}`}
          </Text>
          {resendIn > 0 && !expired && !locked ? (
            <Text variant="small" tone="subtle">Resend in {resendIn}s</Text>
          ) : (
            <LinkText onPress={resend}>{resending ? "Sending…" : "Send a new code"}</LinkText>
          )}
        </View>

      </View>
    </Screen>
  );
}
