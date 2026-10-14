import { useRef, useState } from "react";
import { TextInput, View } from "react-native";
import { XCircle } from "lucide-react-native";
import { fonts, radius, useColors, noWebOutline } from "@/lib/theme";
import { Text } from "./ui";

/**
 * Day / month / year boxes that jump forward as you type. Works the same on
 * iOS, Android and web, and is quicker than a scroll wheel for birth dates.
 * Calls onChange with an ISO date (YYYY-MM-DD), or "" while incomplete.
 */
export function DateField({
  label,
  value,
  onChange,
  error,
  hint,
}: {
  label: string;
  value: string;
  onChange: (iso: string) => void;
  error?: string | null;
  hint?: string;
}) {
  const c = useColors();
  const [y0, m0, d0] = value ? value.split("-") : ["", "", ""];
  const [d, setD] = useState(d0);
  const [m, setM] = useState(m0);
  const [y, setY] = useState(y0);
  const [focus, setFocus] = useState<string | null>(null);
  const mRef = useRef<TextInput>(null);
  const yRef = useRef<TextInput>(null);

  const emit = (dd: string, mm: string, yy: string) => {
    const valid = dd.length >= 1 && mm.length >= 1 && yy.length === 4;
    onChange(valid ? `${yy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}` : "");
  };

  // Digits typed past a full box carry into the next one, so fast typing,
  // paste ("12061994") and autofill all land in the right place.
  const apply = (field: "d" | "m" | "y", text: string) => {
    const digits = text.replace(/\D/g, "");
    let nd = d;
    let nm = m;
    let ny = y;
    if (field === "d") {
      nd = digits.slice(0, 2);
      if (digits.length > 2) {
        nm = digits.slice(2, 4);
        ny = digits.slice(4, 8) || y;
      }
    } else if (field === "m") {
      nm = digits.slice(0, 2);
      if (digits.length > 2) ny = digits.slice(2, 6);
    } else {
      ny = digits.slice(0, 4);
    }
    setD(nd);
    setM(nm);
    setY(ny);
    emit(nd, nm, ny);
    if (field === "d" && nd.length === 2) (nm.length === 2 ? yRef : mRef).current?.focus();
    if (field === "m" && nm.length === 2) yRef.current?.focus();
  };

  // minWidth 0 lets browser inputs shrink to share the row instead of overflowing.
  const box = (key: string, flex: number) => ({
    flex,
    minWidth: 0,
    height: 60,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: error ? c.danger : focus === key ? c.primary : "transparent",
    backgroundColor: c.input,
    paddingHorizontal: 12,
    color: c.text,
    fontFamily: fonts.semibold,
    fontSize: 17,
    textAlign: "center" as const,
    ...noWebOutline,
  });

  return (
    <View style={{ gap: 8 }}>
      <Text variant="label">{label}</Text>
      <View style={{ flexDirection: "row", gap: 10 }}>
        <TextInput
          value={d}
          placeholder="DD"
          placeholderTextColor={c.subtle}
          keyboardType="number-pad"
          accessibilityLabel={`${label}, day`}
          onFocus={() => setFocus("d")}
          onBlur={() => setFocus(null)}
          onChangeText={(t) => apply("d", t)}
          style={box("d", 1)}
        />
        <TextInput
          ref={mRef}
          value={m}
          placeholder="MM"
          placeholderTextColor={c.subtle}
          keyboardType="number-pad"
          accessibilityLabel={`${label}, month`}
          onFocus={() => setFocus("m")}
          onBlur={() => setFocus(null)}
          onChangeText={(t) => apply("m", t)}
          style={box("m", 1)}
        />
        <TextInput
          ref={yRef}
          value={y}
          placeholder="YYYY"
          placeholderTextColor={c.subtle}
          keyboardType="number-pad"
          maxLength={4}
          accessibilityLabel={`${label}, year`}
          onFocus={() => setFocus("y")}
          onBlur={() => setFocus(null)}
          onChangeText={(t) => apply("y", t)}
          style={box("y", 1.6)}
        />
      </View>
      {error ? (
        <View style={{ flexDirection: "row", gap: 6 }}>
          <XCircle size={16} color={c.danger} style={{ marginTop: 2 }} />
          <Text variant="small" tone="danger" style={{ flex: 1 }}>
            {error}
          </Text>
        </View>
      ) : hint ? (
        <Text variant="small" tone="muted">
          {hint}
        </Text>
      ) : null}
    </View>
  );
}
