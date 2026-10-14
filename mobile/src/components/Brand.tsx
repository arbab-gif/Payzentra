import { Image, View } from "react-native";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";
import { fonts } from "@/lib/theme";
import { Logo, Text } from "./ui";

import welcomeArt from "../../assets/images/welcome-art.png";
import shieldArt from "../../assets/images/shield-3d.png";
import selfieArt from "../../assets/images/selfie-illustration.png";
import cameraFaceImg from "../../assets/images/camera-face.png";

export const cameraFace = cameraFaceImg;

/**
 * The soft indigo glow that sits behind the top of every screen
 * (a blurred #6175ED ellipse just above the top edge, about 18% strong).
 */
export function TopGlow({ height = 320 }: { height?: number }) {
  return (
    <View pointerEvents="none" style={{ position: "absolute", top: 0, left: 0, right: 0, height, overflow: "hidden" }}>
      <Svg width="100%" height="100%" viewBox="0 0 390 320" preserveAspectRatio="xMidYMin slice">
        <Defs>
          <RadialGradient id="pz-top-glow" cx="195" cy="-40" r="300" gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor="#6175ed" stopOpacity={0.3} />
            <Stop offset="0.5" stopColor="#6175ed" stopOpacity={0.12} />
            <Stop offset="1" stopColor="#6175ed" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="390" height="320" fill="url(#pz-top-glow)" />
      </Svg>
    </View>
  );
}

/** Launch screen: logo and wordmark centred on black with a tall indigo glow. */
export function SplashScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: "#000000", alignItems: "center", justifyContent: "center" }} accessibilityLabel="Payzentra">
      <Svg style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} width="100%" height="100%" viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice">
        <Defs>
          <RadialGradient id="pz-splash-glow" cx="195" cy="422" r="330" gradientUnits="userSpaceOnUse" gradientTransform="translate(195 422) scale(0.62 1) translate(-195 -422)">
            <Stop offset="0" stopColor="#6175ed" stopOpacity={0.32} />
            <Stop offset="0.55" stopColor="#6175ed" stopOpacity={0.12} />
            <Stop offset="1" stopColor="#6175ed" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="390" height="844" fill="url(#pz-splash-glow)" />
      </Svg>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 24 }}>
        <Logo size={72} wordmark={false} />
        <Text style={{ fontFamily: fonts.bold, fontSize: 48, lineHeight: 62, letterSpacing: -0.4, color: "#ffffff" }}>Payzentra</Text>
      </View>
    </View>
  );
}

/** Welcome illustration: the 3D naira/crypto/bills cluster, cropped as in Figma (328 × 281 frame). */
export function WelcomeArt({ scale = 1 }: { scale?: number }) {
  const w = 328 * scale;
  const h = 281 * scale;
  // Figma crop: image drawn at ~281 × 281, 23.6 px from the left and 12.5 px above the frame.
  return (
    <View style={{ width: w, height: h, overflow: "hidden" }} accessibilityLabel="Naira, crypto and bills connected in one app">
      <Image source={welcomeArt} style={{ position: "absolute", left: 23.6 * scale, top: -12.5 * scale, width: 280.8 * scale, height: 281 * scale }} resizeMode="contain" />
    </View>
  );
}

/** 3D glass shield used on the verify intro and the security slide. */
export function ShieldArt({ size = 173 }: { size?: number }) {
  return <Image source={shieldArt} style={{ width: size, height: size }} resizeMode="cover" accessibilityLabel="Shield with a check mark" />;
}

/**
 * Hand holding a phone for a selfie. Figma places the 332 × 389 image tilted -5.17°
 * so it overflows a 234 × 274 slot; the slot keeps the layout height.
 */
export function SelfieArt() {
  return (
    <View style={{ width: 234, height: 274 }} accessibilityLabel="Hand holding a phone taking a selfie">
      <Image
        source={selfieArt}
        style={{ position: "absolute", left: -13, top: -71, width: 332, height: 389, transform: [{ rotate: "-5.17deg" }] }}
        resizeMode="cover"
      />
    </View>
  );
}
