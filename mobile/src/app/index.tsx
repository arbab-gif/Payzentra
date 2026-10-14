import { LinearGradient } from "expo-linear-gradient";
import { Redirect, router } from "expo-router";
import { ArrowUpRight } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Animated, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ShieldArt, WelcomeArt } from "@/components/Brand";
import { useDemoSheet } from "@/components/DemoSheet";
import { CoinLogo, type CoinCode } from "@/components/Logos";
import { Button, Logo, Text } from "@/components/ui";
import { useWebLayout } from "@/lib/layout";
import { nextRoute, useApp } from "@/lib/store";
import { fonts, radius } from "@/lib/theme";

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
  const web = useWebLayout();
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

  if (web) return <WebWelcome page={page} setPage={setPage} progress={progress} />;

  return (
    <View style={{ flex: 1, backgroundColor: "#000000" }}>
      {/* Indigo wash fading down into black */}
      <LinearGradient colors={["rgba(102,124,255,0.26)", "rgba(102,124,255,0)"]} style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }} />

      {/* Logo + slide dots */}
      <View style={{ paddingTop: insets.top + 16, paddingHorizontal: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        {/* Hidden for demos: long-press the logo to open Demo controls. */}
        <Pressable onLongPress={() => useDemoSheet.getState().setOpen(true)} delayLongPress={600} accessible={false}>
          <Logo onDark />
        </Pressable>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }} accessible accessibilityLabel={`Slide ${page + 1} of ${SLIDES.length}`}>
          {SLIDES.map((s, i) => (
            <View key={s.art} style={{ width: i === page ? 16 : 9, height: 6, borderRadius: 3, backgroundColor: i === page ? WHITE : "rgba(255,255,255,0.25)" }} />
          ))}
        </View>
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
        <Text variant="display" center style={{ color: WHITE, marginBottom: 14 }} accessibilityRole="header">
          {slide.title}
        </Text>
        <Button title="Sign up" onPress={() => router.push("/signup")} />
        <Button title="Log in" variant="glass" onPress={() => router.push("/login")} />
        <Text variant="caption" center style={{ color: "rgba(255,255,255,0.45)" }}>
          By continuing you agree to our <Text variant="caption" style={{ color: WHITE }}>Terms of Use</Text> and{" "}
          <Text variant="caption" style={{ color: WHITE }}>Privacy Policy.</Text>
        </Text>
      </View>
    </View>
  );
}

/** Desktop welcome: headline and actions on the left, the slide's product art on the right. */
function WebWelcome({ page, setPage, progress }: { page: number; setPage: (p: number) => void; progress: Animated.Value }) {
  const slide = SLIDES[page];
  return (
    <View style={{ flex: 1, backgroundColor: "#000000" }}>
      <LinearGradient colors={["#0b0e24", "#000000"]} style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }} />
      <LinearGradient
        colors={slide.art === "crypto" ? ["rgba(247,147,26,0.26)", "rgba(247,147,26,0)"] : slide.art === "secure" ? ["rgba(0,164,107,0.26)", "rgba(0,164,107,0)"] : ["rgba(102,124,255,0.34)", "rgba(102,124,255,0)"]}
        start={{ x: 0.9, y: 0 }}
        end={{ x: 0.35, y: 0.9 }}
        style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }}
      />
      {/* Top bar */}
      <View style={{ height: 80, flexDirection: "row", alignItems: "center", paddingHorizontal: 48, gap: 12 }}>
        <Pressable onLongPress={() => useDemoSheet.getState().setOpen(true)} delayLongPress={600} accessible={false}>
          <Logo onDark />
        </Pressable>
        <View style={{ flex: 1 }} />
        <Button title="Log in" variant="glass" size="md" onPress={() => router.push("/login")} />
        <Button title="Sign up" size="md" onPress={() => router.push("/signup")} />
      </View>

      <View style={{ flex: 1, flexDirection: "row", alignItems: "center", paddingHorizontal: 48, gap: 48, maxWidth: 1280, width: "100%", alignSelf: "center" }}>
        <View style={{ flex: 1, gap: 18, maxWidth: 560 }}>
          <Text variant="smallStrong" style={{ color: WHITE_MUTED, textTransform: "uppercase", letterSpacing: 1 }}>{slide.kicker}</Text>
          <Text style={{ fontFamily: fonts.extrabold, fontSize: 64, lineHeight: 68, letterSpacing: -2.4, color: WHITE }} accessibilityRole="header">
            {slide.title}
          </Text>
          <Text style={{ fontSize: 18, lineHeight: 28, color: WHITE_MUTED, maxWidth: 480, fontFamily: fonts.regular }}>
            Send to any bank, pay bills and buy crypto — from one naira account.
          </Text>
          <View style={{ flexDirection: "row", gap: 12, marginTop: 12 }}>
            <Button title="Create free account" onPress={() => router.push("/signup")} style={{ paddingHorizontal: 28 }} />
            <Button title="Log in" variant="glass" onPress={() => router.push("/login")} style={{ paddingHorizontal: 28 }} />
          </View>
          <Text variant="caption" style={{ color: "rgba(255,255,255,0.45)" }}>By continuing you agree to our Terms of Use and Privacy Policy.</Text>
          {/* Slide indicators: click to jump */}
          <View style={{ flexDirection: "row", gap: 8, marginTop: 28 }} accessibilityLabel={`Slide ${page + 1} of ${SLIDES.length}`}>
            {SLIDES.map((s, i) => (
              <Pressable key={s.art} onPress={() => setPage(i)} accessibilityRole="button" accessibilityLabel={`Show ${s.kicker}`} style={{ width: 56, paddingVertical: 8 }}>
                <View style={{ height: 3, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.25)", overflow: "hidden" }}>
                  <Animated.View style={{ height: 3, backgroundColor: WHITE, width: i < page ? "100%" : i > page ? "0%" : progress.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }) }} />
                </View>
              </Pressable>
            ))}
          </View>
        </View>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <View style={{ transform: [{ scale: 1.2 }] }}>
            <Art kind={slide.art} />
          </View>
        </View>
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
  if (kind === "wallet") return <WelcomeArt />;
  if (kind === "crypto") {
    const coins: { code: CoinCode; n: string; p: string }[] = [
      { code: "BTC", n: "Bitcoin", p: "+2.4%" },
      { code: "ETH", n: "Ethereum", p: "+1.1%" },
      { code: "USDT", n: "Tether", p: "0.0%" },
      { code: "USDC", n: "USD Coin", p: "0.0%" },
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
              <CoinLogo code={k.code} size={34} />
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
  return <ShieldArt size={230} />;
}

