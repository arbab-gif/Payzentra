import {
  InterTight_400Regular,
  InterTight_500Medium,
  InterTight_600SemiBold,
  InterTight_700Bold,
  InterTight_800ExtraBold,
  useFonts,
} from "@expo-google-fonts/inter-tight";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Platform, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { DemoSheet, Toaster } from "@/components/DemoSheet";
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
  const c = useColors();

  if (!fontsLoaded || !hydrated) return <View style={{ flex: 1, backgroundColor: c.bg }} />;

  return (
    <SafeAreaProvider>
      <StatusBar style={theme === "dark" ? "light" : "dark"} />
      {/* In a desktop browser, show the app at phone width so it previews like a device. */}
      <View style={{ flex: 1, backgroundColor: Platform.OS === "web" ? (theme === "dark" ? "#000000" : "#dfe2e8") : c.bg, alignItems: "center" }}>
        <View style={{ flex: 1, width: "100%", maxWidth: Platform.OS === "web" ? 430 : undefined, backgroundColor: c.bg, overflow: "hidden" }}>
          <Stack screenOptions={{ headerShown: false, animation: "slide_from_right", contentStyle: { backgroundColor: c.bg } }} />
          <Toaster />
          <DemoSheet />
        </View>
      </View>
    </SafeAreaProvider>
  );
}
