import { createContext, startTransition, useContext, useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaFrameContext, SafeAreaInsetsContext } from "react-native-safe-area-context";
import Svg, { Path, Rect } from "react-native-svg";
import { PreviewProvider } from "@/lib/preview";
import { createScopedStore, ScopedStoreProvider } from "@/lib/store";
import { fonts } from "@/lib/theme";
import type { GalleryCase } from "./cases";

export type Platform = "mobile" | "web";
export type Theme = "dark" | "light";

export const SIZES: Record<Platform, { width: number; height: number; radius: number }> = {
  mobile: { width: 390, height: 844, radius: 44 },
  web: { width: 1400, height: 1024, radius: 10 },
};

const PHONE_INSETS = { top: 47, bottom: 34, left: 0, right: 0 };
const NO_INSETS = { top: 0, bottom: 0, left: 0, right: 0 };

/** Tells a frame when it is near the visible part of the gallery, so only those frames render. */
export type Watcher = { watch: (el: Element, onChange: (near: boolean) => void) => () => void };
export const WatcherContext = createContext<Watcher | null>(null);

function useNearViewport() {
  const watcher = useContext(WatcherContext);
  const ref = useRef<View>(null);
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = ref.current as unknown as Element | null;
    if (!watcher || !el) return;
    return watcher.watch(el, (v) => startTransition(() => setNear(v)));
  }, [watcher]);
  return [ref, near] as const;
}

/** One screen state, drawn at its real size and scaled to the gallery zoom. */
export function DeviceFrame({ c, platform, theme, zoom }: { c: GalleryCase; platform: Platform; theme: Theme; zoom: number }) {
  const size = SIZES[platform];
  const [ref, near] = useNearViewport();
  return (
    <View
      ref={ref}
      style={{
        width: size.width * zoom,
        height: size.height * zoom,
        borderRadius: size.radius * zoom,
        overflow: "hidden",
        backgroundColor: theme === "dark" || c.alwaysDark ? "#0b0b0d" : "#eceef2",
      }}
    >
      {near && (
        <View style={{ width: size.width, height: size.height, transform: [{ scale: zoom }], transformOrigin: "top left" }}>
          <FrameContent c={c} platform={platform} theme={theme} />
        </View>
      )}
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: size.radius * zoom, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" }]} />
    </View>
  );
}

function FrameContent({ c, platform, theme }: { c: GalleryCase; platform: Platform; theme: Theme }) {
  const { width, height } = SIZES[platform];
  const [store] = useState(() => createScopedStore({ ...c.state, theme, viewMode: platform }));
  const [host, setHost] = useState<HTMLElement | null>(null);
  const env = useMemo(() => ({ width, height, params: c.params ?? {}, seed: c.seed ?? {}, host }), [width, height, c.params, c.seed, host]);
  const frame = useMemo(() => ({ x: 0, y: 0, width, height }), [width, height]);
  const phone = platform === "mobile";
  const lightGlyphs = theme === "dark" || !!c.alwaysDark;

  return (
    <ScopedStoreProvider value={store}>
      <PreviewProvider value={env}>
        <SafeAreaFrameContext.Provider value={frame}>
          <SafeAreaInsetsContext.Provider value={phone ? PHONE_INSETS : NO_INSETS}>
            <View style={{ width, height, overflow: "hidden" }}>
              <c.Screen />
              {/* Sheets and Face ID prompts render here, inside the frame. */}
              <View ref={(node) => setHost(node as unknown as HTMLElement | null)} pointerEvents="box-none" style={StyleSheet.absoluteFill} />
              {phone && <PhoneChrome light={lightGlyphs} />}
              {/* The gallery is for looking: block taps and hover inside frames. */}
              <View style={StyleSheet.absoluteFill} />
            </View>
          </SafeAreaInsetsContext.Provider>
        </SafeAreaFrameContext.Provider>
      </PreviewProvider>
    </ScopedStoreProvider>
  );
}

/** iPhone status bar (9:41, signal, wifi, battery), Dynamic Island and home indicator. */
function PhoneChrome({ light }: { light: boolean }) {
  const fg = light ? "#ffffff" : "#000000";
  return (
    <>
      <View pointerEvents="none" style={{ position: "absolute", top: 0, left: 0, right: 0, height: 47, flexDirection: "row", alignItems: "center", paddingLeft: 34, paddingRight: 28, paddingTop: 4 }}>
        <Text style={{ width: 56, textAlign: "center", fontFamily: fonts.semibold, fontSize: 16, letterSpacing: -0.2, color: fg }}>9:41</Text>
        <View style={{ flex: 1 }} />
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Svg width={18} height={12} viewBox="0 0 18 12">
            <Rect x="0" y="8" width="3" height="4" rx="1" fill={fg} />
            <Rect x="5" y="5.5" width="3" height="6.5" rx="1" fill={fg} />
            <Rect x="10" y="3" width="3" height="9" rx="1" fill={fg} />
            <Rect x="15" y="0" width="3" height="12" rx="1" fill={fg} />
          </Svg>
          <Svg width={16} height={12} viewBox="0 0 16 12">
            <Path d="M8 2.4c2.3 0 4.4.9 5.9 2.4l1.2-1.2A10 10 0 0 0 8 .7 10 10 0 0 0 .9 3.6l1.2 1.2A8.3 8.3 0 0 1 8 2.4Z" fill={fg} />
            <Path d="M8 5.7c1.4 0 2.6.5 3.6 1.4l1.2-1.2A6.6 6.6 0 0 0 8 4a6.6 6.6 0 0 0-4.8 1.9l1.2 1.2c1-.9 2.2-1.4 3.6-1.4Z" fill={fg} />
            <Path d="M8 9c.6 0 1.1.2 1.4.6L8 11.3 6.6 9.6c.3-.4.8-.6 1.4-.6Z" fill={fg} />
          </Svg>
          <Svg width={27} height={13} viewBox="0 0 27 13">
            <Rect x="0.5" y="0.5" width="23" height="12" rx="3.8" stroke={fg} strokeOpacity={0.4} fill="none" />
            <Rect x="2" y="2" width="20" height="9" rx="2.5" fill={fg} />
            <Path d="M25 4.5v4c.8-.3 1.4-1.1 1.4-2s-.6-1.7-1.4-2Z" fill={fg} fillOpacity={0.45} />
          </Svg>
        </View>
      </View>
      <View pointerEvents="none" style={{ position: "absolute", top: 11, left: 135, width: 120, height: 34, borderRadius: 17, backgroundColor: "#000000" }} />
      <View pointerEvents="none" style={{ position: "absolute", bottom: 8, left: 128, width: 134, height: 5, borderRadius: 3, backgroundColor: fg }} />
    </>
  );
}
