import { Check, ChevronDown, Search, X } from "lucide-react-native";
import { useMemo, useState, type ReactNode } from "react";
import { FlatList, Modal, Pressable, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fonts, radius, useColors, noWebOutline } from "@/lib/theme";
import { Text } from "./ui";

/** Bottom sheet built on Modal: slides up, dims the screen, closes on backdrop tap or Android back. */
export function Sheet({
  open,
  onClose,
  title,
  children,
  fullHeight,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  fullHeight?: boolean;
}) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={{ flex: 1, backgroundColor: c.overlay }} onPress={onClose} accessibilityLabel="Close" />
      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          maxHeight: "88%",
          height: fullHeight ? "88%" : undefined,
          backgroundColor: c.bgElevated,
          borderTopLeftRadius: radius.xl,
          borderTopRightRadius: radius.xl,
          paddingBottom: Math.max(insets.bottom, 16),
          alignSelf: "center",
          width: "100%",
          maxWidth: 520,
        }}
        accessibilityViewIsModal
      >
        <View style={{ alignItems: "center", paddingTop: 10 }}>
          <View style={{ width: 40, height: 5, borderRadius: 3, backgroundColor: c.borderStrong }} />
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14 }}>
          <Text variant="heading" style={{ flex: 1 }} accessibilityRole="header">
            {title}
          </Text>
          <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel="Close">
            <X size={22} color={c.muted} />
          </Pressable>
        </View>
        {children}
      </View>
    </Modal>
  );
}

/** A field that opens a searchable list in a bottom sheet (e.g. Nigerian states). */
export function SelectField({
  label,
  value,
  options,
  placeholder,
  onChange,
  error,
}: {
  label: string;
  value: string;
  options: string[];
  placeholder: string;
  onChange: (v: string) => void;
  error?: string | null;
}) {
  const c = useColors();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const filtered = useMemo(() => options.filter((o) => o.toLowerCase().includes(q.trim().toLowerCase())), [options, q]);

  return (
    <View style={{ gap: 8 }}>
      <Text variant="label">{label}</Text>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value || "not selected"}`}
        style={{
          height: 60,
          borderRadius: radius.md,
          borderWidth: 2,
          borderColor: error ? c.danger : "transparent",
          backgroundColor: c.input,
          paddingHorizontal: 14,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <Text style={{ flex: 1, color: value ? c.text : c.subtle }}>{value || placeholder}</Text>
        <ChevronDown size={20} color={c.muted} />
      </Pressable>
      {error && (
        <Text variant="small" tone="danger">
          {error}
        </Text>
      )}
      <Sheet open={open} onClose={() => setOpen(false)} title={label} fullHeight>
        <View style={{ paddingHorizontal: 20, paddingBottom: 8 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, height: 46, borderRadius: radius.md, backgroundColor: c.surface2, paddingHorizontal: 12 }}>
            <Search size={18} color={c.muted} />
            <TextInput
              value={q}
              onChangeText={setQ}
              placeholder="Search"
              placeholderTextColor={c.subtle}
              accessibilityLabel={`Search ${label}`}
              style={[{ flex: 1, color: c.text, fontFamily: fonts.regular, fontSize: 16 }, noWebOutline]}
            />
          </View>
        </View>
        <FlatList
          data={filtered}
          keyExtractor={(o) => o}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <Pressable
              onPress={() => {
                onChange(item);
                setOpen(false);
                setQ("");
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: item === value }}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 20,
                paddingVertical: 15,
                backgroundColor: pressed ? c.surface2 : "transparent",
              })}
            >
              <Text style={{ flex: 1 }}>{item}</Text>
              {item === value && <Check size={20} color={c.primary} />}
            </Pressable>
          )}
          ListEmptyComponent={
            <Text tone="muted" center style={{ padding: 24 }}>
              No matches
            </Text>
          }
        />
      </Sheet>
    </View>
  );
}
