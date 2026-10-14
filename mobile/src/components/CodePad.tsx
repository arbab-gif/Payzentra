import { Delete, type LucideIcon } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { Animated, Platform, Pressable, View } from "react-native";
import { usePreview } from "@/lib/preview";
import { fonts, useColors } from "@/lib/theme";
import { haptic, Text } from "./ui";

/**
 * Six dots and a number pad for the unlock code. Typing on a hardware keyboard
 * also works in the browser. `extra` is the optional bottom-left key
 * (e.g. Face ID). Calls onComplete when all digits are in.
 */
export function CodePad({
  value,
  onChange,
  onComplete,
  length = 6,
  error,
  busy,
  extra,
}: {
  value: string;
  onChange: (v: string) => void;
  onComplete?: (v: string) => void;
  length?: number;
  error?: string | null;
  busy?: boolean;
  extra?: { Icon: LucideIcon; label: string; onPress: () => void };
}) {
  const c = useColors();
  const preview = !!usePreview();
  const [shake] = useState(() => new Animated.Value(0));

  // Shake the dots when an error appears.
  useEffect(() => {
    if (!error || preview) return;
    haptic("error");
    Animated.sequence([10, -10, 6, -6, 0].map((x) => Animated.timing(shake, { toValue: x, duration: 60, useNativeDriver: Platform.OS !== "web" }))).start();
  }, [error, shake, preview]);

  // Latest value, so fast typing doesn't read a stale render's value.
  const latest = useRef(value);
  useEffect(() => {
    latest.current = value;
  }, [value]);

  const press = (d: string) => {
    const cur = latest.current;
    if (busy || cur.length >= length) return;
    haptic("light");
    const next = cur + d;
    latest.current = next;
    onChange(next);
    if (next.length === length) onComplete?.(next);
  };
  const back = () => {
    const cur = latest.current;
    if (busy || !cur) return;
    latest.current = cur.slice(0, -1);
    onChange(latest.current);
  };

  // Hardware keyboard in the browser (not in the gallery, where many pads share one page).
  useEffect(() => {
    if (Platform.OS !== "web" || preview) return;
    const doc = (globalThis as { document?: Document }).document;
    const onKey = (e: KeyboardEvent) => {
      if (/^\d$/.test(e.key)) press(e.key);
      else if (e.key === "Backspace") back();
    };
    doc?.addEventListener("keydown", onKey);
    return () => doc?.removeEventListener("keydown", onKey);
  });

  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "extra", "0", "del"];

  return (
    <View style={{ alignItems: "center", gap: 28 }}>
      <View style={{ alignItems: "center", gap: 14, minHeight: 52 }}>
        <Animated.View style={{ flexDirection: "row", gap: 16, transform: [{ translateX: shake }] }} accessible accessibilityLabel={`${value.length} of ${length} digits entered`}>
          {Array.from({ length }, (_, i) => {
            const filled = i < value.length;
            return (
              <View
                key={i}
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 7,
                  borderWidth: 2,
                  borderColor: error ? c.danger : filled ? c.primary : c.borderStrong,
                  backgroundColor: filled ? (error ? c.danger : c.primary) : "transparent",
                }}
              />
            );
          })}
        </Animated.View>
        <Text variant="small" tone={error ? "danger" : "muted"} center style={{ minHeight: 20 }} accessibilityLiveRegion="polite">
          {error ?? ""}
        </Text>
      </View>

      <View style={{ width: 288, flexDirection: "row", flexWrap: "wrap", rowGap: 14, columnGap: 24, justifyContent: "center" }}>
        {keys.map((k) => {
          if (k === "extra") {
            if (!extra) return <View key={k} style={{ width: 80, height: 64 }} />;
            return (
              <Key key={k} onPress={extra.onPress} label={extra.label}>
                <extra.Icon size={28} color={c.primary} />
              </Key>
            );
          }
          if (k === "del") {
            return (
              <Key key={k} onPress={back} label="Delete">
                <Delete size={26} color={c.text} />
              </Key>
            );
          }
          return (
            <Key key={k} onPress={() => press(k)} label={k} filled>
              <Text style={{ fontFamily: fonts.semibold, fontSize: 28, lineHeight: 34, color: c.text }}>{k}</Text>
            </Key>
          );
        })}
      </View>
    </View>
  );
}

function Key({ children, onPress, label, filled }: { children: React.ReactNode; onPress: () => void; label: string; filled?: boolean }) {
  const c = useColors();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => ({
        width: 80,
        height: 64,
        borderRadius: 32,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: pressed ? c.surface2 : filled ? c.surface : "transparent",
      })}
    >
      {children}
    </Pressable>
  );
}
