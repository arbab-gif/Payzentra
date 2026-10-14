import { ChevronRight, type LucideIcon } from "lucide-react-native";
import type { ReactNode } from "react";
import { Pressable, View, type StyleProp, type ViewStyle } from "react-native";
import { radius, useColors } from "@/lib/theme";
import { Text } from "./ui";

export function RowIcon({ Icon, danger }: { Icon: LucideIcon; danger?: boolean }) {
  const c = useColors();
  return (
    <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: danger ? c.dangerSoft : c.surface2, alignItems: "center", justifyContent: "center" }}>
      <Icon size={18} color={danger ? c.danger : c.text} />
    </View>
  );
}

/** One setting inside a Group: icon, title, detail, and a control or chevron on the right. */
export function Row({ Icon, title, detail, right, onPress, danger }: { Icon: LucideIcon; title: string; detail?: string; right?: ReactNode; onPress?: () => void; danger?: boolean }) {
  const c = useColors();
  const content = (
    <>
      <RowIcon Icon={Icon} danger={danger} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text variant="smallStrong" style={danger ? { color: c.danger } : undefined}>{title}</Text>
        {detail && <Text variant="small" tone="muted">{detail}</Text>}
      </View>
      {right}
      {onPress && !right && <ChevronRight size={18} color={c.subtle} />}
    </>
  );
  const style = { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderTopWidth: 1, borderTopColor: c.border, marginTop: -1 } as const;
  if (!onPress) return <View style={style}>{content}</View>;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${title}. ${detail ?? ""}`} style={({ pressed }) => ({ ...style, opacity: pressed ? 0.7 : 1 })}>
      {content}
    </Pressable>
  );
}

/** A section of the Profile hub: what it is, what's inside, and a chevron. */
export function HubCard({ title, detail, onPress, style }: { title: string; detail: string; onPress: () => void; style?: StyleProp<ViewStyle> }) {
  const c = useColors();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${detail}`}
      style={({ pressed }) => [{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingVertical: 18, borderRadius: radius.lg, backgroundColor: c.surface, opacity: pressed ? 0.7 : 1 }, style]}
    >
      <View style={{ flex: 1, gap: 4 }}>
        <Text variant="bodyStrong" style={{ fontSize: 17 }}>{title}</Text>
        <Text variant="small" tone="muted">{detail}</Text>
      </View>
      <ChevronRight size={20} color={c.muted} />
    </Pressable>
  );
}
