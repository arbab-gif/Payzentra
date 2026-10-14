import { CameraView, useCameraPermissions } from "expo-camera";
import { router } from "expo-router";
import { Camera, CameraOff, CheckCircle2, ChevronLeft, Glasses, Lightbulb, ScanFace, UserRoundX } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Linking, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Ellipse, Path } from "react-native-svg";
import { Loading, Screen } from "@/components/Screen";
import { SelfieIllustration } from "@/components/SelfieIllustration";
import { Alert, Button, Card, StatusHero, Text } from "@/components/ui";
import { MAX_LIVENESS_ATTEMPTS, submitLiveness } from "@/lib/api";
import { ROUTES, useApp } from "@/lib/store";
import { useColors } from "@/lib/theme";
import { useGuard } from "@/lib/useGuard";

type Stage = "intro" | "denied" | "capture" | "processing" | "failed" | "passed" | "manual";

const CAMERA_BG = "#0b0b0d";
const PROMPTS = ["Keep your face within the oval", "Hold still", "Slowly turn your head left", "Now back to the centre", "Blink once"];

const W = 300;
const H = 400;
const RX = W / 2 - 6;
const RY = H / 2 - 6;
// Ellipse perimeter (Ramanujan) for the progress ring's dash length.
const PERIMETER = Math.PI * (3 * (RX + RY) - Math.sqrt((3 * RX + RY) * (RX + 3 * RY)));
// Starts at 12 o'clock and runs clockwise.
const OVAL = `M ${W / 2} 6 A ${RX} ${RY} 0 1 1 ${W / 2} ${H - 6} A ${RX} ${RY} 0 1 1 ${W / 2} 6`;

export default function Selfie() {
  const c = useColors();
  const cameraMode = useApp((s) => s.scenarios.camera);
  const attemptsUsed = useApp((s) => s.kyc.livenessAttempts);
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [stage, setStage] = useState<Stage>("intro");
  const [prompt, setPrompt] = useState(0);
  const [attemptsLeft, setAttemptsLeft] = useState(MAX_LIVENESS_ATTEMPTS - attemptsUsed);
  const allowed = useGuard(ROUTES.selfie, stage === "processing" || stage === "passed" || stage === "manual");

  // Walk through the liveness prompts, then submit.
  useEffect(() => {
    if (stage !== "capture") return;
    const t = setTimeout(
      () => {
        if (prompt < PROMPTS.length - 1) {
          setPrompt(prompt + 1);
          return;
        }
        setPrompt(PROMPTS.length);
        setStage("processing");
        submitLiveness().then((res) => {
          if (res.ok) setStage("passed");
          else if (res.code === "MANUAL_REVIEW") setStage("manual");
          else {
            setAttemptsLeft(res.attemptsLeft ?? 0);
            setStage("failed");
          }
        });
      },
      prompt === 0 ? 1800 : 1400,
    );
    return () => clearTimeout(t);
  }, [stage, prompt]);

  if (!allowed) return <Loading />;

  const start = async () => {
    setPrompt(0);
    if (cameraMode === "simulated") return setStage("capture");
    const res = permission?.granted ? permission : await requestPermission();
    setStage(res.granted ? "capture" : "denied");
  };

  if (stage === "capture") {
    const progress = Math.min(prompt / PROMPTS.length, 1);
    return (
      <View style={{ flex: 1, backgroundColor: CAMERA_BG }}>
        <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 12, height: insets.top + 64, justifyContent: "center" }}>
          <Pressable onPress={() => setStage("intro")} accessibilityRole="button" accessibilityLabel="Back" hitSlop={10} style={{ width: 44, height: 44, justifyContent: "center" }}>
            <ChevronLeft size={30} color="#ffffff" />
          </Pressable>
        </View>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingBottom: 40 }}>
          <View style={{ width: W, height: H }}>
            <View style={{ position: "absolute", left: 6, top: 6, width: RX * 2, height: RY * 2, borderRadius: RX, overflow: "hidden", backgroundColor: "#000000" }}>
              {cameraMode === "simulated" ? <SimulatedFace turn={prompt === 2} /> : <CameraView style={{ flex: 1 }} facing="front" mirror />}
            </View>
            <Svg width={W} height={H} style={{ position: "absolute" }}>
              {/* Mask: paint the background everywhere outside the oval so the preview is a true ellipse */}
              <Path d={`M0 0 H${W} V${H} H0 Z ${OVAL}`} fill={CAMERA_BG} fillRule="evenodd" />
              <Ellipse cx={W / 2} cy={H / 2} rx={RX} ry={RY} stroke="#ffffff" strokeWidth={1.5} fill="none" />
              {/* Thin progress trace over the outline while the liveness steps run */}
              <Path d={OVAL} stroke={c.primary} strokeWidth={3} fill="none" strokeLinecap="round" strokeDasharray={[PERIMETER * progress, PERIMETER]} />
            </Svg>
          </View>
          <Text variant="body" center style={{ color: "#ffffff", marginTop: 36, fontSize: 19, lineHeight: 26 }} accessibilityLiveRegion="assertive">
            {PROMPTS[Math.min(prompt, PROMPTS.length - 1)]}
          </Text>
        </View>
        {cameraMode === "simulated" && (
          <Text variant="caption" center style={{ color: "rgba(255,255,255,0.4)", paddingBottom: insets.bottom + 16 }}>
            Demo: simulated camera
          </Text>
        )}
      </View>
    );
  }

  if (stage === "processing") {
    return (
      <Screen step="selfie" center>
        <StatusHero tone="primary" icon={ScanFace} title="Checking it's really you" body="We're comparing your selfie with your ID photo. This takes a few seconds." pulse />
      </Screen>
    );
  }

  if (stage === "passed") {
    return (
      <Screen step="selfie" center footer={<Button title="Continue" onPress={() => router.replace(ROUTES.address as never)} />}>
        <StatusHero tone="success" icon={CheckCircle2} title="Selfie confirmed" body="Your face matches your ID. One last step — your home address." />
      </Screen>
    );
  }

  if (stage === "manual") {
    return (
      <Screen step="selfie" center footer={<Button title="See verification status" onPress={() => router.replace(ROUTES.status as never)} />}>
        <StatusHero
          tone="warning"
          icon={UserRoundX}
          title="We'll review your selfie"
          body={`We couldn't confirm your selfie automatically after ${MAX_LIVENESS_ATTEMPTS} tries, so our team will check it. This usually takes up to 24 hours — we'll notify you when it's done.`}
        />
      </Screen>
    );
  }

  if (stage === "failed") {
    return (
      <Screen step="selfie" footer={<Button title="Try again" icon={Camera} onPress={start} />}>
        <StatusHero tone="danger" icon={UserRoundX} title="We couldn't match your face" body="This can happen with poor lighting or if your face is partly covered." />
        <View style={{ gap: 12, marginTop: 24 }}>
          <Tips />
          <Alert tone="warning">{`You have ${attemptsLeft} attempt${attemptsLeft === 1 ? "" : "s"} left. After that, our team will review your selfie.`}</Alert>
        </View>
      </Screen>
    );
  }

  if (stage === "denied") {
    const blocked = permission && !permission.canAskAgain;
    return (
      <Screen
        step="selfie"
        back={() => setStage("intro")}
        center
        footer={
          blocked ? (
            <Button title="Open Settings" onPress={() => Linking.openSettings().catch(() => {})} />
          ) : (
            <Button title="Allow camera" onPress={start} />
          )
        }
      >
        <StatusHero
          tone="warning"
          icon={CameraOff}
          title="Allow camera access"
          body={
            blocked
              ? "Camera access is turned off for Payzentra. Open Settings, turn on Camera, then come back."
              : "We need your camera to take a live selfie. Photo uploads aren't accepted, to protect you from impersonation."
          }
        />
      </Screen>
    );
  }

  return (
    <Screen step="selfie" back center footer={<Button title="Start camera" icon={Camera} onPress={start} />}>
      <View style={{ alignItems: "center" }}>
        <SelfieIllustration size={280} />
        <Text variant="title" center style={{ marginTop: 20 }} accessibilityRole="header">
          Take a selfie
        </Text>
        <Text tone="muted" center style={{ marginTop: 10, maxWidth: 320 }}>
          Remove any face masks, sunglasses or hats, and find somewhere with good light.
        </Text>
        <Text variant="caption" tone="subtle" center style={{ marginTop: 16 }}>
          Camera only — uploaded photos aren&apos;t accepted.
        </Text>
      </View>
    </Screen>
  );
}

function Tips() {
  const c = useColors();
  return (
    <View style={{ gap: 10 }}>
      {[
        { Icon: Lightbulb, t: "Find good light", b: "Face a window or lamp." },
        { Icon: Glasses, t: "Uncover your face", b: "Remove glasses, hats and masks." },
        { Icon: ScanFace, t: "Just you", b: "No one else in the frame." },
      ].map(({ Icon, t, b }) => (
        <Card key={t} style={{ flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 14 }}>
          <Icon size={22} color={c.primary} />
          <View style={{ flex: 1 }}>
            <Text variant="bodyStrong">{t}</Text>
            <Text variant="small" tone="muted">{b}</Text>
          </View>
        </Card>
      ))}
    </View>
  );
}

function SimulatedFace({ turn }: { turn: boolean }) {
  return (
    <View style={{ flex: 1, backgroundColor: "#1a1a1f" }} accessibilityLabel="Simulated camera preview">
      <Svg width="100%" height="100%" viewBox="0 0 120 160" preserveAspectRatio="xMidYMid slice" style={{ transform: [{ translateX: turn ? 10 : 0 }] }}>
        <Ellipse cx="60" cy="70" rx="30" ry="38" fill="#c08b6a" />
        <Path d="M30 62c0-26 14-38 30-38s30 12 30 38c-6-12-16-18-30-18S36 50 30 62z" fill="#1d1410" />
        <Circle cx="48" cy="72" r="3" fill="#1d1410" />
        <Circle cx="72" cy="72" r="3" fill="#1d1410" />
        <Path d="M52 92q8 6 16 0" stroke="#7a4a35" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <Path d="M12 160c4-30 22-44 48-44s44 14 48 44z" fill="#3a3f63" />
      </Svg>
    </View>
  );
}
