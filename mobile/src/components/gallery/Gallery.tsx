import { router } from "expo-router";
import { ArrowLeft, Check, Minus, Monitor, Plus, Smartphone } from "lucide-react-native";
import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { Pressable, ScrollView, Text, View, type TextStyle } from "react-native";
import { isHovered } from "@/components/home/WebSidebar";
import { Logo } from "@/components/ui";
import { fonts } from "@/lib/theme";
import { CASE_COUNT, FLOWS, type Flow } from "./cases";
import { DeviceFrame, SIZES, WatcherContext, type Platform, type Theme, type Watcher } from "./DeviceFrame";

const C = {
  canvas: "#1e1e1e",
  bar: "#2a2a2a",
  border: "#3a3a3a",
  chip: "#333333",
  text: "#ffffff",
  muted: "#a0a0aa",
  subtle: "#70707a",
  accent: "#667cff",
};

const ZOOMS = [0.25, 0.33, 0.5, 0.75, 1];

type Part = { key: string; platform: Platform; theme: Theme; label: string };
const PARTS: Part[] = [
  { key: "mobile-dark", platform: "mobile", theme: "dark", label: "Mobile · Dark" },
  { key: "mobile-light", platform: "mobile", theme: "light", label: "Mobile · Light" },
  { key: "web-dark", platform: "web", theme: "dark", label: "Web · Dark" },
  { key: "web-light", platform: "web", theme: "light", label: "Web · Light" },
];

const num = (i: number) => String(i + 1).padStart(2, "0");

/** Viewer preferences (zoom, which sets are shown), kept in this browser only. */
function usePref<T>(key: string, initial: T) {
  const storageKey = `pz-gallery-${key}`;
  const [value, setValue] = useState<T>(() => {
    try {
      const saved = globalThis.localStorage?.getItem(storageKey);
      return saved ? (JSON.parse(saved) as T) : initial;
    } catch {
      return initial;
    }
  });
  const set = (next: T) => {
    setValue(next);
    try {
      globalThis.localStorage?.setItem(storageKey, JSON.stringify(next));
    } catch {
      // Storage blocked: the choice lasts for this visit only.
    }
  };
  return [value, set] as const;
}

const scrollNode = (ref: RefObject<ScrollView | null>) =>
  (ref.current as unknown as { getScrollableNode?: () => HTMLElement } | null)?.getScrollableNode?.() ?? null;

/** One IntersectionObserver on the gallery's scroll area; frames mount only when close to view. */
function useWatcher(scrollRef: RefObject<ScrollView | null>) {
  const [watcher] = useState(() => {
    let io: IntersectionObserver | null = null;
    const handlers = new Map<Element, (near: boolean) => void>();
    const w: Watcher & { stop: () => void } = {
      watch(el, onChange) {
        if (!io) {
          io = new IntersectionObserver(
            (entries) => entries.forEach((e) => handlers.get(e.target)?.(e.isIntersecting)),
            { root: scrollNode(scrollRef), rootMargin: "1200px 0px" },
          );
        }
        handlers.set(el, onChange);
        io.observe(el);
        return () => {
          io?.unobserve(el);
          handlers.delete(el);
        };
      },
      stop: () => io?.disconnect(),
    };
    return w;
  });
  useEffect(() => watcher.stop, [watcher]);
  return watcher;
}

export function Gallery() {
  const scrollRef = useRef<ScrollView>(null);
  const watcher = useWatcher(scrollRef);
  // Browser scroll anchoring reacts to frames mounting inside scaled boxes and drifts the page down endlessly.
  useEffect(() => {
    const node = scrollNode(scrollRef);
    if (node) node.style.overflowAnchor = "none";
  }, []);
  const [zoom, setZoom] = usePref("zoom", 0.5);
  const [shown, setShown] = usePref<string[]>("shown", PARTS.map((p) => p.key));
  const parts = PARTS.filter((p) => shown.includes(p.key));
  const toggle = (key: string) => setShown(shown.includes(key) ? shown.filter((k) => k !== key) : PARTS.map((p) => p.key).filter((k) => k === key || shown.includes(k)));
  const zi = ZOOMS.indexOf(zoom) === -1 ? 2 : ZOOMS.indexOf(zoom);

  return (
    <View style={{ flex: 1, backgroundColor: C.canvas }}>
      {/* Top bar */}
      <View style={{ minHeight: 60, flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 16, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: C.bar, borderBottomWidth: 1, borderBottomColor: C.border }}>
        <Pressable onPress={() => router.replace("/")} accessibilityRole="button" accessibilityLabel="Back to the app" style={(s) => ({ width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", backgroundColor: isHovered(s) ? C.chip : "transparent" })}>
          <ArrowLeft size={18} color={C.muted} />
        </Pressable>
        <Logo size={24} onDark />
        <View style={{ width: 1, height: 22, backgroundColor: C.border }} />
        <View>
          <Text style={t(15, "semibold")}>Screen gallery</Text>
          <Text style={t(12, "medium", C.muted)}>{CASE_COUNT} screens and states in each set · {CASE_COUNT * parts.length} shown</Text>
        </View>
        <View style={{ flex: 1 }} />
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }} accessibilityRole="toolbar" accessibilityLabel="Sets to show">
          <Text style={[t(12, "medium", C.subtle), { marginRight: 4 }]}>Show</Text>
          {PARTS.map((p) => {
            const on = shown.includes(p.key);
            return (
              <Chip key={p.key} on={on} onPress={() => toggle(p.key)} label={`${on ? "Hide" : "Show"} ${p.label}`}>
                {on ? <Check size={14} color="#ffffff" /> : p.platform === "mobile" ? <Smartphone size={14} color={C.muted} /> : <Monitor size={14} color={C.muted} />}
                <Text style={t(13, "semibold", on ? "#ffffff" : C.muted)}>{p.label}</Text>
              </Chip>
            );
          })}
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4, padding: 3, borderRadius: 999, backgroundColor: C.chip }}>
          <RoundButton label="Zoom out" disabled={zi === 0} onPress={() => setZoom(ZOOMS[zi - 1])}>
            <Minus size={16} color={zi === 0 ? C.subtle : "#ffffff"} />
          </RoundButton>
          <Text style={[t(13, "semibold"), { width: 46, textAlign: "center" }]}>{Math.round(ZOOMS[zi] * 100)}%</Text>
          <RoundButton label="Zoom in" disabled={zi === ZOOMS.length - 1} onPress={() => setZoom(ZOOMS[zi + 1])}>
            <Plus size={16} color={zi === ZOOMS.length - 1 ? C.subtle : "#ffffff"} />
          </RoundButton>
        </View>
      </View>

      <WatcherContext.Provider value={watcher}>
        <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 48, paddingTop: 40, paddingBottom: 160 }}>
          {parts.length === 0 && <Text style={[t(15, "medium", C.muted), { textAlign: "center", marginTop: 80 }]}>Choose a set to show from the top bar.</Text>}
          {parts.map((p) => (
            <PartSection key={p.key} part={p} zoom={ZOOMS[zi]} />
          ))}
        </ScrollView>
      </WatcherContext.Provider>
    </View>
  );
}

function PartSection({ part, zoom }: { part: Part; zoom: number }) {
  const size = SIZES[part.platform];
  const jump = (id: string) => (globalThis.document?.getElementById(id) as HTMLElement | null)?.scrollIntoView({ behavior: "smooth", block: "start" });
  return (
    <View nativeID={part.key} style={{ marginBottom: 120 }}>
      <View style={{ gap: 16, paddingBottom: 28, marginBottom: 48, borderBottomWidth: 1, borderBottomColor: C.border }}>
        <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 14 }}>
          <View style={{ width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: part.theme === "dark" ? "#000000" : "#f4f5f7", borderWidth: 1, borderColor: C.border }}>
            {part.platform === "mobile" ? <Smartphone size={22} color={part.theme === "dark" ? "#ffffff" : "#191c1f"} /> : <Monitor size={22} color={part.theme === "dark" ? "#ffffff" : "#191c1f"} />}
          </View>
          <Text style={t(34, "extrabold")}>
            {part.platform === "mobile" ? "Mobile app" : "Web app"}
            <Text style={{ color: C.subtle }}> · </Text>
            {part.theme === "dark" ? "Dark mode" : "Light mode"}
          </Text>
          <Badge>{`${size.width} × ${size.height}`}</Badge>
          <Badge>{`${FLOWS.length} flows · ${CASE_COUNT} screens`}</Badge>
        </View>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
          {FLOWS.map((f, i) => (
            <Pressable
              key={f.title}
              onPress={() => jump(`${part.key}-${i}`)}
              accessibilityRole="link"
              style={(s) => ({ flexDirection: "row", gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: isHovered(s) ? C.border : C.chip })}
            >
              <Text style={t(12, "semibold", C.accent)}>{num(i)}</Text>
              <Text style={t(12, "medium", C.muted)}>{f.title}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      {FLOWS.map((f, i) => (
        <FlowSection key={f.title} id={`${part.key}-${i}`} index={i} flow={f} part={part} zoom={zoom} />
      ))}
    </View>
  );
}

function FlowSection({ id, index, flow, part, zoom }: { id: string; index: number; flow: Flow; part: Part; zoom: number }) {
  const width = SIZES[part.platform].width * zoom;
  return (
    <View nativeID={id} style={{ marginBottom: 80, paddingTop: 8 }}>
      <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "baseline", gap: 12 }}>
        <Text style={t(16, "bold", C.accent)}>{num(index)}</Text>
        <Text style={t(24, "bold")}>{flow.title}</Text>
        <Text style={t(13, "medium", C.subtle)}>
          {flow.cases.length} {flow.cases.length === 1 ? "screen" : "screens"}
        </Text>
      </View>
      <Text style={[t(14, "regular", C.muted), { marginTop: 6 }]}>{flow.summary}</Text>
      <View style={{ height: 1, backgroundColor: C.border, marginTop: 18, marginBottom: 28 }} />
      <View style={{ flexDirection: "row", flexWrap: "wrap", columnGap: Math.max(24, 64 * zoom), rowGap: 40 }}>
        {flow.cases.map((c, j) => (
          <View key={c.name} style={{ width, gap: 12 }}>
            <DeviceFrame c={c} platform={part.platform} theme={part.theme} zoom={zoom} />
            <View style={{ flexDirection: "row", gap: 8 }}>
              <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: C.accent, marginTop: 6 }} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={t(13, "semibold")}>{c.name}</Text>
                <Text style={t(11, "medium", C.subtle)}>
                  {num(index)}.{j + 1} · {flow.title}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function Chip({ on, onPress, label, children }: { on: boolean; onPress: () => void; label: string; children: ReactNode }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: on }}
      accessibilityLabel={label}
      style={(s) => ({ flexDirection: "row", alignItems: "center", gap: 6, height: 32, paddingHorizontal: 12, borderRadius: 999, backgroundColor: on ? C.accent : isHovered(s) ? C.border : C.chip })}
    >
      {children}
    </Pressable>
  );
}

function RoundButton({ label, disabled, onPress, children }: { label: string; disabled: boolean; onPress: () => void; children: ReactNode }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={(s) => ({ width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: isHovered(s) && !disabled ? C.border : "transparent" })}
    >
      {children}
    </Pressable>
  );
}

function Badge({ children }: { children: string }) {
  return (
    <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, borderWidth: 1, borderColor: C.border }}>
      <Text style={t(12, "semibold", C.muted)}>{children}</Text>
    </View>
  );
}

function t(size: number, weight: keyof typeof fonts, color: string = C.text): TextStyle {
  return { fontFamily: fonts[weight], fontSize: size, lineHeight: Math.round(size * 1.35), color };
}
