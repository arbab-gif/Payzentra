import {
  InterTight_400Regular,
  InterTight_500Medium,
  InterTight_600SemiBold,
  InterTight_700Bold,
  InterTight_800ExtraBold,
  useFonts,
} from "@expo-google-fonts/inter-tight";
import { Stack, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Platform, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useEffect, useState } from "react";
import { SplashScreen } from "@/components/Brand";
import { DemoSheet, Toaster } from "@/components/DemoSheet";
import { PreviewTabs } from "@/components/PreviewTabs";
import { useApp } from "@/lib/store";
import { useColors } from "@/lib/theme";
import { useHydrated } from "@/lib/useGuard";

// Web preview only: replace the browser's default (yellow) focus ring with the brand
// colour, and only show it for keyboard focus — not after a tap or click.
if (Platform.OS === "web") {
  const doc = (globalThis as { document?: Document }).document;
  if (doc && !doc.getElementById("pz-focus")) {
    const style = doc.createElement("style");
    style.id = "pz-focus";
    style.textContent =
      ":focus:not(:focus-visible){outline:none}:focus-visible{outline:2px solid #667cff;outline-offset:2px;border-radius:12px}";
    doc.head.appendChild(style);
  }
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ InterTight_400Regular, InterTight_500Medium, InterTight_600SemiBold, InterTight_700Bold, InterTight_800ExtraBold });
  const hydrated = useHydrated();
  const theme = useApp((s) => s.theme);
  const viewMode = useApp((s) => s.viewMode);
  const c = useColors();
  const gallery = usePathname() === "/gallery";
  // Show the launch splash for at least a moment, even when everything loads instantly.
  const [splashDone, setSplashDone] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setSplashDone(true), 1100);
    return () => clearTimeout(t);
  }, []);

  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: "#000000" }} />;

  // The screen gallery is a design-review page, not part of the app: full window, no app chrome.
  if (gallery) {
    return (
      <SafeAreaProvider>
        <Stack screenOptions={{ headerShown: false, animation: "none" }} />
      </SafeAreaProvider>
    );
  }

  if (!hydrated || !splashDone) return <SplashScreen />;

  // In a browser: "Mobile app" previews the app at phone width; "Web app" uses the full window.
  const phoneFrame = Platform.OS === "web" && viewMode === "mobile";

  return (
    <SafeAreaProvider>
      <StatusBar style={theme === "dark" ? "light" : "dark"} />
      <PreviewTabs />
      <View style={{ flex: 1, backgroundColor: Platform.OS === "web" ? (theme === "dark" ? "#000000" : "#dfe2e8") : c.bg, alignItems: "center" }}>
        <View style={{ flex: 1, width: "100%", maxWidth: phoneFrame ? 430 : undefined, backgroundColor: c.bg, overflow: "hidden" }}>
          <Stack screenOptions={{ headerShown: false, animation: Platform.OS === "web" ? "none" : "slide_from_right", contentStyle: { backgroundColor: c.bg } }} />
          <Toaster />
          <DemoSheet />
        </View>
      </View>
    </SafeAreaProvider>
  );
}
