import { router, useLocalSearchParams } from "expo-router";
import { ScanFace } from "lucide-react-native";
import { useState } from "react";
import { View } from "react-native";
import { BIOMETRIC_NAME, DevicePrompt } from "@/components/DevicePrompt";
import { Loading, Screen } from "@/components/Screen";
import { Alert, Button, StatusHero } from "@/components/ui";
import { biometricOutcome, biometricsAvailable, enableBiometrics } from "@/lib/api";
import { ROUTES } from "@/lib/store";
import { toast } from "@/lib/toast";
import { useGuard } from "@/lib/useGuard";

/**
 * Offered once after the unlock code is set (and from Profile): open the app
 * with Face ID / fingerprint instead of typing the code.
 */
export default function BiometricsSetup() {
  const { from } = useLocalSearchParams<{ from?: "profile" | "home" }>();
  // Opened from Profile or a Home suggestion: go back there. Otherwise it is part of sign-up.
  const revisit = !!from;
  const [prompt, setPrompt] = useState(false);
  const [note, setNote] = useState<{ tone: "info" | "warning"; title: string; body: string } | null>(null);
  const allowed = useGuard(ROUTES.biometrics);

  if (!allowed) return <Loading />;

  const leave = () => (revisit && router.canGoBack() ? router.back() : router.replace(ROUTES.home as never));

  if (!biometricsAvailable()) {
    return (
      <Screen back={revisit} center footer={<Button title={revisit ? "Go back" : "Continue"} onPress={leave} />}>
        <StatusHero tone="warning" icon={ScanFace} title={`${BIOMETRIC_NAME} isn't set up on this phone`} body={`Add ${BIOMETRIC_NAME} in your phone's settings first. Until then, use your unlock code.`} />
      </Screen>
    );
  }

  return (
    <Screen
      back={revisit}
      center
      footer={
        <>
          <Button title={`Turn on ${BIOMETRIC_NAME}`} onPress={() => { setNote(null); setPrompt(true); }} />
          <Button title="Not now" variant="ghost" onPress={leave} />
        </>
      }
    >
      <StatusHero
        tone="primary"
        icon={ScanFace}
        title={`Unlock with ${BIOMETRIC_NAME}`}
        body={`Open Payzentra with ${BIOMETRIC_NAME} instead of typing your unlock code. You can turn it off any time in Profile.`}
      />
      {note && (
        <View style={{ marginTop: 24 }}>
          <Alert tone={note.tone} title={note.title}>{note.body}</Alert>
        </View>
      )}
      <DevicePrompt
        open={prompt}
        kind="biometric"
        title={BIOMETRIC_NAME}
        subtitle={`Allow Payzentra to use ${BIOMETRIC_NAME}.`}
        outcome={biometricOutcome}
        onResult={async (r) => {
          setPrompt(false);
          if (r === "success") {
            await enableBiometrics(true);
            toast({ tone: "success", title: `${BIOMETRIC_NAME} is on`, body: "Next time, just look at your phone to unlock." });
            leave();
          } else if (r === "cancel") {
            setNote({ tone: "info", title: `${BIOMETRIC_NAME} wasn't turned on`, body: "You cancelled the request. You can try again, or keep using your unlock code." });
          } else {
            setNote({ tone: "warning", title: `Couldn't set up ${BIOMETRIC_NAME}`, body: "We'll keep using your unlock code. You can try again later from Profile." });
          }
        }}
      />
    </Screen>
  );
}
