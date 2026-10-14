import { router } from "expo-router";
import { History, LogOut, type LucideIcon } from "lucide-react-native";
import type { ReactNode } from "react";
import { Pressable, View, type PressableStateCallbackType } from "react-native";
import { TABS, tabSoon } from "@/components/BottomNav";
import { useDemoSheet } from "@/components/DemoSheet";
import { Logo, Text } from "@/components/ui";
import { ROUTES } from "@/lib/store";
import { radius, useColors } from "@/lib/theme";
import { signOut } from "./parts";

/** react-native-web adds `hovered` to the press state; native typings don't include it. */
export const isHovered = (s: PressableStateCallbackType) => !!(s as PressableStateCallbackType & { hovered?: boolean }).hovered;

export type SidebarPage = "home" | "activity" | "profile";

function NavItem({ label, Icon, on, onPress }: { label: string; Icon: LucideIcon; on: boolean; onPress: () => void }) {
  const c = useColors();
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: on }}
      onPress={onPress}
      style={(s) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        height: 44,
        paddingHorizontal: 12,
        borderRadius: radius.md,
        backgroundColor: on ? c.primarySoft : isHovered(s) ? c.surface2 : "transparent",
        opacity: s.pressed ? 0.7 : 1,
      })}
    >
      <Icon size={20} color={on ? c.primary : c.muted} strokeWidth={on ? 2.4 : 2} />
      <Text variant="smallStrong" style={{ color: on ? c.text : c.muted, fontSize: 15 }}>{label}</Text>
    </Pressable>
  );
}

/**
 * Desktop navigation: the same five areas as the phone tab bar, Activity, and the
 * profile block (avatar → Profile and settings) at the bottom.
 */
export function WebSidebar({ page, initials, name, email }: { page: SidebarPage; initials: string; name: string; email: string }) {
  const c = useColors();
  return (
    <View style={{ width: 248, backgroundColor: c.bgElevated, borderRightWidth: 1, borderRightColor: c.border, paddingHorizontal: 16, paddingVertical: 24 }}>
      <Pressable onLongPress={() => useDemoSheet.getState().setOpen(true)} delayLongPress={600} accessible={false} style={{ paddingHorizontal: 8, marginBottom: 32 }}>
        <Logo />
      </Pressable>
      <View accessibilityRole="tablist" style={{ gap: 4 }}>
        {TABS.map(({ key, label, Icon }) => (
          <NavItem
            key={key}
            label={label}
            Icon={Icon}
            on={key === "home" && page === "home"}
            onPress={() => (key === "home" ? page !== "home" && router.replace(ROUTES.home as never) : tabSoon(label))}
          />
        ))}
        <View style={{ height: 1, backgroundColor: c.border, marginVertical: 10, marginHorizontal: 12 }} />
        <NavItem label="Activity" Icon={History} on={page === "activity"} onPress={() => page !== "activity" && router.push(ROUTES.activity as never)} />
      </View>
      <View style={{ flex: 1 }} />
      <Pressable
        onPress={() => page !== "profile" && router.push(ROUTES.profile as never)}
        accessibilityRole="button"
        accessibilityLabel="Profile and settings"
        style={(s) => ({ flexDirection: "row", alignItems: "center", gap: 10, padding: 10, borderRadius: radius.md, backgroundColor: page === "profile" ? c.primarySoft : isHovered(s) ? c.surface2 : "transparent" })}
      >
        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: c.primary, alignItems: "center", justifyContent: "center" }}>
          <Text variant="smallStrong" style={{ color: c.onPrimary }}>{initials}</Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text variant="smallStrong" numberOfLines={1}>{name}</Text>
          <Text variant="caption" tone="muted" numberOfLines={1}>{email}</Text>
        </View>
      </Pressable>
      <Pressable
        onPress={signOut}
        accessibilityRole="button"
        style={(s) => ({ flexDirection: "row", alignItems: "center", gap: 10, height: 40, paddingHorizontal: 12, marginTop: 4, borderRadius: radius.md, backgroundColor: isHovered(s) ? c.surface2 : "transparent" })}
      >
        <LogOut size={18} color={c.muted} />
        <Text variant="small" tone="muted">Log out</Text>
      </Pressable>
    </View>
  );
}

/** Sidebar + scrollable main column, for desktop pages other than Home. */
export function WebPage({ page, initials, name, email, children }: { page: SidebarPage; initials: string; name: string; email: string; children: ReactNode }) {
  const c = useColors();
  return (
    <View style={{ flex: 1, flexDirection: "row", backgroundColor: c.bg }}>
      <WebSidebar page={page} initials={initials} name={name} email={email} />
      <View style={{ flex: 1 }}>{children}</View>
    </View>
  );
}
