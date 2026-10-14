import { LinearGradient } from "expo-linear-gradient";
import { Redirect, router } from "expo-router";
import { ArrowDownLeft, ArrowUpRight, Fingerprint, Lock, ReceiptText, ScanFace, ShieldCheck, Zap } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Animated, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDemoSheet } from "@/components/DemoSheet";
import { Button, Logo, Text } from "@/components/ui";
import { nextRoute, useApp } from "@/lib/store";
import { radius } from "@/lib/theme";

/**
 * Full-bleed welcome hero, story style: segment bars across the top fill as
 * each slide plays; tap the left or right half to go back or forward.
 */
const SLIDES = [
  { kicker: "Payzentra", title: "Your naira, crypto and bills. One app.", art: "wallet" },
  { kicker: "Crypto", title: "Buy, sell and swap with every fee upfront.", art: "crypto" },
  { kicker: "Security", title: "Protected from the very first tap.", art: "secure" },
] as const;

const SLIDE_MS = 5000;
const WHITE = "#ffffff";
const WHITE_MUTED = "rgba(255,255,255,0.64)";
const GLASS = "rgba(255,255,255,0.08)";
const GLASS_BORDER = "rgba(255,255,255,0.12)";

export default function Welcome() {
  const insets = useSafeAreaInsets();
  const app = useApp();
  const [page, setPage] = useState(0);
  const [progress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    progress.setValue(0);
    const anim = Animated.timing(progress, { toValue: 1, duration: SLIDE_MS, useNativeDriver: false });
    anim.start(({ finished }) => finished && setPage((p) => (p + 1) % SLIDES.length));
    return () => anim.stop();
  }, [page, progress]);

  if (app.account && app.session.authenticated) return <Redirect href={nextRoute(app) as never} />;
  if (app.account) return <Redirect href="/welcome-back" />;

  const slide = SLIDES[page];

  return (
    <View style={{ flex: 1, backgroundColor: "#000000" }}>
      <LinearGradient colors={["#0b0e24", "#000000"]} style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }} />
      <LinearGradient
        // Fade each glow to the same colour at zero alpha so there is no dark seam.
        colors={slide.art === "crypto" ? ["rgba(247,147,26,0.30)", "rgba(247,147,26,0)"] : slide.art === "secure" ? ["rgba(0,164,107,0.30)", "rgba(0,164,107,0)"] : ["rgba(102,124,255,0.38)", "rgba(102,124,255,0)"]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.6, y: 0.75 }}
        style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }}
      />

      {/* Story progress */}
      <View style={{ paddingTop: insets.top + 10, paddingHorizontal: 16, flexDirection: "row", gap: 6 }} accessibilityLabel={`Slide ${page + 1} of ${SLIDES.length}`}>
        {SLIDES.map((s, i) => (
          <View key={s.art} style={{ flex: 1, height: 3, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.25)", overflow: "hidden" }}>
            <Animated.View
              style={{
                height: 3,
                backgroundColor: WHITE,
                width: i < page ? "100%" : i > page ? "0%" : progress.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }),
              }}
            />
          </View>
        ))}
      </View>
      <View style={{ paddingHorizontal: 20, paddingTop: 16, flexDirection: "row" }}>
        {/* Hidden for demos: long-press the logo to open Demo controls. */}
        <Pressable onLongPress={() => useDemoSheet.getState().setOpen(true)} delayLongPress={600} accessible={false}>
          <Logo onDark />
        </Pressable>
      </View>

      {/* Tap zones: left half = previous, right half = next */}
      <View style={{ flex: 1 }}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Art kind={slide.art} />
        </View>
        <View style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0, flexDirection: "row" }}>
          <Pressable style={{ flex: 1 }} onPress={() => setPage((p) => Math.max(0, p - 1))} accessibilityLabel="Previous slide" />
          <Pressable style={{ flex: 1 }} onPress={() => setPage((p) => (p + 1) % SLIDES.length)} accessibilityLabel="Next slide" />
        </View>
      </View>

      <View style={{ paddingHorizontal: 20, paddingBottom: Math.max(insets.bottom, 16) + 8, gap: 10 }}>
        <Text variant="smallStrong" style={{ color: WHITE_MUTED, textTransform: "uppercase", letterSpacing: 1 }}>
          {slide.kicker}
        </Text>
        <Text variant="display" style={{ color: WHITE, marginBottom: 18 }} accessibilityRole="header">
          {slide.title}
        </Text>
        <Button title="Sign up" onPress={() => router.push("/signup")} />
        <Button title="Log in" variant="glass" onPress={() => router.push("/login")} />
        <Text variant="caption" center style={{ color: "rgba(255,255,255,0.45)", marginTop: 6 }}>
          By continuing you agree to our Terms of Use and Privacy Policy.
        </Text>
      </View>
    </View>
  );
}

function Glass({ children, style }: { children: React.ReactNode; style?: object }) {
  return (
    <View style={[{ backgroundColor: GLASS, borderColor: GLASS_BORDER, borderWidth: 1, borderRadius: radius.lg }, style]}>
      {children}
    </View>
  );
}

function Art({ kind }: { kind: "wallet" | "crypto" | "secure" }) {
  if (kind === "wallet") {
    return (
      <View style={{ width: 320, gap: 12 }} pointerEvents="none">
        <Glass style={{ padding: 20, borderRadius: radius.xl }}>
          <Text variant="small" style={{ color: WHITE_MUTED }}>Main · NGN</Text>
          <Text variant="display" style={{ color: WHITE, fontSize: 40, lineHeight: 46, marginTop: 4 }}>
            ₦1,284,500<Text variant="title" style={{ color: WHITE_MUTED }}>.00</Text>
          </Text>
          <View style={{ flexDirection: "row", gap: 8, marginTop: 18 }}>
            {["Add money", "Send", "Pay bills"].map((a) => (
              <View key={a} style={{ flex: 1, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center" }}>
                <Text variant="caption" style={{ color: WHITE }}>{a}</Text>
              </View>
            ))}
          </View>
        </Glass>
        <Glass style={{ paddingVertical: 6 }}>
          {[
            { Icon: ArrowDownLeft, t: "Transfer from GTBank", v: "+₦250,000", c: "#2bc48a" },
            { Icon: ReceiptText, t: "TV subscription", v: "−₦12,500", c: WHITE },
            { Icon: Zap, t: "Electricity token", v: "−₦8,000", c: WHITE },
          ].map(({ Icon, t, v, c }) => (
            <View key={t} style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 10 }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center" }}>
                <Icon size={18} color={WHITE} />
              </View>
              <Text variant="smallStrong" style={{ color: WHITE, flex: 1 }}>{t}</Text>
              <Text variant="smallStrong" style={{ color: c }}>{v}</Text>
            </View>
          ))}
        </Glass>
      </View>
    );
  }
  if (kind === "crypto") {
    const coins = [
      { s: "₿", n: "Bitcoin", p: "+2.4%", bg: "#f7931a" },
      { s: "Ξ", n: "Ethereum", p: "+1.1%", bg: "#627eea" },
      { s: "₮", n: "Tether", p: "0.0%", bg: "#26a17b" },
      { s: "$", n: "USD Coin", p: "0.0%", bg: "#2775ca" },
    ];
    return (
      <View style={{ width: 320, gap: 12 }} pointerEvents="none">
        <Glass style={{ padding: 18 }}>
          <Text variant="small" style={{ color: WHITE_MUTED }}>You pay</Text>
          <Text variant="title" style={{ color: WHITE }}>₦150,000</Text>
          <View style={{ height: 1, backgroundColor: GLASS_BORDER, marginVertical: 12 }} />
          <Text variant="small" style={{ color: WHITE_MUTED }}>You receive</Text>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text variant="title" style={{ color: WHITE }}>0.00092 BTC</Text>
            <ArrowUpRight size={22} color="#2bc48a" />
          </View>
          <Text variant="caption" style={{ color: WHITE_MUTED, marginTop: 6 }}>Fee ₦750 · rate locked for 30s</Text>
        </Glass>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          {coins.map((k) => (
            <Glass key={k.n} style={{ width: 155, flexDirection: "row", alignItems: "center", gap: 10, padding: 12 }}>
              <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: k.bg, alignItems: "center", justifyContent: "center" }}>
                <Text variant="bodyStrong" style={{ color: WHITE }}>{k.s}</Text>
              </View>
              <View>
                <Text variant="smallStrong" style={{ color: WHITE }}>{k.n}</Text>
                <Text variant="caption" style={{ color: k.p.startsWith("+") ? "#2bc48a" : WHITE_MUTED }}>{k.p}</Text>
              </View>
            </Glass>
          ))}
        </View>
      </View>
    );
  }
  return (
    <View style={{ width: 320, height: 300, alignItems: "center", justifyContent: "center" }} pointerEvents="none">
      <View style={{ width: 150, height: 150, borderRadius: 75, backgroundColor: "rgba(0,164,107,0.18)", alignItems: "center", justifyContent: "center" }}>
        <View style={{ width: 104, height: 104, borderRadius: 52, backgroundColor: "rgba(0,164,107,0.28)", alignItems: "center", justifyContent: "center" }}>
          <ShieldCheck size={56} color={WHITE} strokeWidth={1.6} />
        </View>
      </View>
      {[
        { Icon: ScanFace, t: "Live selfie check", x: -84, y: -112 },
        { Icon: Fingerprint, t: "BVN / NIN check", x: 92, y: -40 },
        { Icon: Lock, t: "Encrypted data", x: -70, y: 112 },
      ].map(({ Icon, t, x, y }) => (
        <Glass
          key={t}
          style={{
            position: "absolute",
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: radius.pill,
            transform: [{ translateX: x }, { translateY: y }],
          }}
        >
          <Icon size={16} color="#2bc48a" />
          <Text variant="caption" style={{ color: WHITE }}>{t}</Text>
        </Glass>
      ))}
    </View>
  );
}

