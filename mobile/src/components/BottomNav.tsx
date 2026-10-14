import { ArrowLeftRight, Bitcoin, House, LayoutGrid, ReceiptText, type LucideIcon } from "lucide-react-native";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { radius, useColors } from "@/lib/theme";
import { toast } from "@/lib/toast";
import { haptic, Text } from "./ui";

export type TabKey = "home" | "payments" | "crypto" | "activity" | "more";

const TABS: { key: TabKey; label: string; Icon: LucideIcon }[] = [
  { key: "home", label: "Home", Icon: House },
  { key: "payments", label: "Payments", Icon: ArrowLeftRight },
  { key: "crypto", label: "Crypto", Icon: Bitcoin },
  { key: "activity", label: "Activity", Icon: ReceiptText },
  { key: "more", label: "More", Icon: LayoutGrid },
];

/** Height the screen should leave clear at the bottom for the floating bar. */
export const NAV_SPACE = 60 + 12 + 24;

/**
 * The five-item global navigation as a floating pill. The active tab is a filled
 * capsule with its label; the others are icons (labelled for screen readers).
 * Only Home is built; the other tabs say so.
 */
export function BottomNav({ active }: { active: TabKey }) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  return (
    <View
      accessibilityRole="tablist"
      style={{
        position: "absolute",
        left: 12,
        right: 12,
        bottom: Math.max(insets.bottom, 12),
        height: 60,
        borderRadius: radius.pill,
        backgroundColor: c.surface2,
        borderWidth: 1,
        borderColor: c.border,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 6,
        shadowColor: "#000",
        shadowOpacity: 0.5,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: 10 },
        elevation: 12,
      }}
    >
      {TABS.map(({ key, label, Icon }) => {
        const on = key === active;
        return (
          <Pressable
            key={key}
            accessibilityRole="tab"
            accessibilityLabel={label}
            accessibilityState={{ selected: on }}
            onPress={() => {
              haptic("light");
              if (!on) toast({ tone: "info", title: `${label} is next`, body: `The ${label} tab isn't part of this build yet.` });
            }}
            style={({ pressed }) => ({
              flex: on ? 1.7 : 1,
              height: 46,
              borderRadius: radius.pill,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              backgroundColor: on ? c.primary : "transparent",
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Icon size={20} color={on ? c.onPrimary : c.muted} strokeWidth={on ? 2.4 : 2} />
            {on && <Text variant="smallStrong" style={{ color: c.onPrimary }}>{label}</Text>}
          </Pressable>
        );
      })}
    </View>
  );
}
