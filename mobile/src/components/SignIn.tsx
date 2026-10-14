import { KeyRound, MonitorSmartphone } from "lucide-react-native";
import { useState } from "react";
import { View } from "react-native";
import { passkeySignIn, passkeySupported, resendEmailCode, verifyDeviceCode, type PromptOutcome } from "@/lib/api";
import { useSeed } from "@/lib/preview";
import { useApp } from "@/lib/store";
import { DevicePrompt } from "./DevicePrompt";
import { OtpInput } from "./OtpInput";
import { PageTitle, Screen } from "./Screen";
import { Alert, Button, IconBadge, LinkText, Text } from "./ui";

type Failure = { code: string; message: string; attemptsLeft?: number };

/**
 * New-device check: after the password is right on a phone we don't recognise,
 * the customer confirms a code sent to their email before the session starts.
 */
export function NewDeviceCheck({ email, onDone, onCancel }: { email: string; onDone: () => void; onCancel: () => void }) {
  const seed = useSeed<{ deviceCode: string; deviceError: Failure }>();
  const [code, setCode] = useState(seed.deviceCode ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Failure | null>(seed.deviceError ?? null);
  const [sent, setSent] = useState(false);

  const submit = async (value = code) => {
    if (value.length !== 6 || loading) return;
    setLoading(true);
    setError(null);
    const res = await verifyDeviceCode(value);
    setLoading(false);
    if (!res.ok) {
      setError(res);
      setCode("");
      return;
    }
    onDone();
  };

  const expired = error?.code === "EXPIRED";
  const locked = error?.code === "LOCKED";

  return (
    <Screen
      back={onCancel}
      footer={<Button title="Confirm" loading={loading} disabled={code.length !== 6 || locked} onPress={() => submit()} />}
    >
      <View style={{ marginBottom: 20 }}>
        <IconBadge icon={MonitorSmartphone} />
      </View>
      <PageTitle
        title="Check it's you"
        subtitle={
          <Text tone="muted">
            We don&apos;t recognise this device. Enter the 6-digit code we sent to <Text variant="bodyStrong">{email}</Text>.
          </Text>
        }
      />
      <View style={{ gap: 16 }}>
        {error && !expired && !locked && (
          <Alert tone="danger" title={error.message}>
            {error.attemptsLeft !== undefined ? `You have ${error.attemptsLeft} attempt${error.attemptsLeft === 1 ? "" : "s"} left.` : undefined}
          </Alert>
        )}
        {expired && <Alert tone="warning" title="This code has expired">Send a new code to continue.</Alert>}
        {locked && <Alert tone="danger" title="Too many incorrect attempts">Send a new code to try again.</Alert>}
        <OtpInput value={code} onChange={(v) => { setCode(v); if (error?.code === "INVALID") setError(null); }} onComplete={submit} error={!!error && !expired} disabled={loading || locked} />
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text variant="small" tone="muted">{sent ? "New code sent" : "Didn't get it?"}</Text>
          <LinkText
            onPress={async () => {
              await resendEmailCode("new-device sign-in");
              setSent(true);
              setError(null);
              setCode("");
            }}
          >
            Send a new code
          </LinkText>
        </View>
        <Text variant="small" tone="muted">After this, you&apos;ll set an unlock code for this device.</Text>
      </View>
    </Screen>
  );
}

/** "Sign in with a passkey", shown only where the device supports passkeys. */
export function PasskeyOption({ onSignedIn, onError }: { onSignedIn: () => void; onError: (f: Failure) => void }) {
  const [prompt, setPrompt] = useState(false);
  const [loading, setLoading] = useState(false);
  if (!passkeySupported()) return null;
  const email = useApp.getState().account?.email;
  return (
    <>
      <Button title="Sign in with a passkey" variant="secondary" icon={KeyRound} loading={loading} onPress={() => setPrompt(true)} />
      <DevicePrompt
        open={prompt}
        kind="passkey"
        title="Sign in with a passkey"
        subtitle={email ? `Use your saved passkey for ${email}.` : "Use a passkey saved on this device."}
        outcome={(): PromptOutcome => (useApp.getState().scenarios.passkey === "fail" ? "fail" : "success")}
        onResult={async (r) => {
          setPrompt(false);
          if (r !== "success") return;
          setLoading(true);
          const res = await passkeySignIn();
          setLoading(false);
          if (res.ok) onSignedIn();
          else onError(res);
        }}
      />
    </>
  );
}
