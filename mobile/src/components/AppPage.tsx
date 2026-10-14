import { router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import type { ReactNode } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCustomerName } from "@/components/home/parts";
import { WebPage, type SidebarPage } from "@/components/home/WebSidebar";
import { useWebLayout } from "@/lib/layout";
import { ROUTES } from "@/lib/store";
import { useColors } from "@/lib/theme";
import { FadeIn, Text } from "./ui";

/**
 * A signed-in page opened from Home (Profile, Activity). Phone: back button and
 * title fixed at the top, content scrolls. Desktop: the app sidebar plus a
 * centred content column.
 */
export function AppPage({ page, title, subtitle, children }: { page: Exclude<SidebarPage, "home">; title: string; subtitle?: string; children: ReactNode }) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const web = useWebLayout();
  const who = useCustomerName();
  const back = () => (router.canGoBack() ? router.back() : router.replace(ROUTES.home as never));

  if (web) {
    return (
      <WebPage page={page} initials={who.initials} name={who.name} email={who.email}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 40, paddingTop: 28, paddingBottom: 48 }}>
          <View style={{ width: "100%", maxWidth: 760, alignSelf: "center" }}>
            <Text variant="title" accessibilityRole="header">{title}</Text>
            {subtitle && <Text tone="muted" style={{ marginTop: 2 }}>{subtitle}</Text>}
            <FadeIn style={{ marginTop: 28 }}>{children}</FadeIn>
          </View>
        </ScrollView>
      </WebPage>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{ paddingTop: insets.top, backgroundColor: c.bg, borderBottomWidth: 1, borderBottomColor: c.border }}>
        <View style={{ height: 56, flexDirection: "row", alignItems: "center", paddingHorizontal: 16, gap: 12 }}>
          <Pressable
            onPress={back}
            accessibilityRole="button"
            accessibilityLabel="Back"
            hitSlop={6}
            style={({ pressed }) => ({ width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: 20, backgroundColor: c.surface2, opacity: pressed ? 0.6 : 1 })}
          >
            <ChevronLeft size={24} color={c.text} />
          </Pressable>
          <Text variant="bodyStrong" style={{ fontSize: 18, flex: 1 }} accessibilityRole="header">{title}</Text>
        </View>
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: Math.max(insets.bottom, 16) + 16 }} showsVerticalScrollIndicator={false}>
        <FadeIn>{children}</FadeIn>
      </ScrollView>
    </View>
  );
}

/** A titled group of rows on a raised card. */
export function Group({ title, children, footer }: { title?: string; children: ReactNode; footer?: string }) {
  const c = useColors();
  return (
    <View style={{ marginBottom: 24 }}>
      {title && (
        <Text variant="caption" tone="muted" style={{ marginBottom: 8, marginLeft: 4, letterSpacing: 0.6 }} accessibilityRole="header">
          {title.toUpperCase()}
        </Text>
      )}
      <View style={{ backgroundColor: c.surface, borderRadius: 20, overflow: "hidden" }}>{children}</View>
      {footer && <Text variant="caption" tone="muted" style={{ marginTop: 8, marginHorizontal: 4 }}>{footer}</Text>}
    </View>
  );
}
