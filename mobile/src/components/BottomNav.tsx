import { ArrowLeftRight, Bitcoin, CreditCard, House, Wallet, type LucideIcon } from "lucide-react-native";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fonts, useColors } from "@/lib/theme";
import { toast } from "@/lib/toast";
import { haptic, Text } from "./ui";

export type TabKey = "home" | "wallet" | "crypto" | "payments" | "cards";

/** The five main areas. Profile, settings and Activity are reached from the avatar on Home. */
export const TABS: { key: TabKey; label: string; Icon: LucideIcon }[] = [
  { key: "home", label: "Home", Icon: House },
  { key: "wallet", label: "Wallet", Icon: Wallet },
  { key: "crypto", label: "Crypto", Icon: Bitcoin },
  { key: "payments", label: "Payments", Icon: ArrowLeftRight },
  { key: "cards", label: "Cards", Icon: CreditCard },
];

export const tabSoon = (label: string) => toast({ tone: "info", title: `${label} is next`, body: `The ${label} tab isn't part of this build yet.` });

/** Height of the bar above the bottom safe area, so screens can leave room for it. */
export const NAV_SPACE = 58;

/**
 * The five-item global navigation: a full-width bar fixed to the bottom, with
 * icons and labels and the active tab in the primary colour. Only Home is built.
 */
export function BottomNav({ active }: { active: TabKey }) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  return (
    <View
      accessibilityRole="tablist"
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        flexDirection: "row",
        paddingTop: 8,
        paddingHorizontal: 10,
        paddingBottom: Math.max(insets.bottom, 10),
        backgroundColor: c.bg,
        borderTopWidth: 1,
        borderTopColor: c.border,
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
              if (!on) tabSoon(label);
            }}
            style={({ pressed }) => ({ flex: 1, alignItems: "center", gap: 4, paddingVertical: 4, opacity: pressed ? 0.6 : 1 })}
          >
            <Icon size={22} color={on ? c.primary : c.subtle} strokeWidth={on ? 2.2 : 2} />
            <Text style={{ fontFamily: fonts.medium, fontSize: 11, lineHeight: 16, color: on ? c.primary : c.subtle }}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
