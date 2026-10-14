import { router } from "expo-router";
import { ChevronLeft, X } from "lucide-react-native";
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
 * A signed-in page opened from Home (Profile and its sections, Activity). Phone: back
 * button and title fixed at the top, content scrolls. Desktop: the app sidebar plus a
 * centred content column. Without a title (the Profile hub) the phone shows only a
 * close button.
 */
export function AppPage({
  page,
  title,
  subtitle,
  close,
  parent = ROUTES.home,
  children,
}: {
  page: Exclude<SidebarPage, "home">;
  title?: string;
  subtitle?: string;
  /** Show a close (×) button instead of back. */
  close?: boolean;
  /** Where back goes when there's no history, e.g. after a reload. */
  parent?: string;
  children: ReactNode;
}) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const web = useWebLayout();
  const who = useCustomerName();
  const back = () => (router.canGoBack() ? router.back() : router.replace(parent as never));
  const BackIcon = close ? X : ChevronLeft;

  if (web) {
    return (
      <WebPage page={page} initials={who.initials} name={who.name} email={who.email}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 40, paddingTop: 28, paddingBottom: 48 }}>
          <View style={{ width: "100%", maxWidth: 760, alignSelf: "center" }}>
            {title && parent !== ROUTES.home && (
              <Pressable onPress={back} accessibilityRole="button" accessibilityLabel="Back" style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start", marginBottom: 12, opacity: pressed ? 0.6 : 1 })}>
                <ChevronLeft size={18} color={c.muted} />
                <Text variant="smallStrong" tone="muted">Profile</Text>
              </Pressable>
            )}
            {title && <Text variant="title" accessibilityRole="header">{title}</Text>}
            {subtitle && <Text tone="muted" style={{ marginTop: 2 }}>{subtitle}</Text>}
            <FadeIn style={{ marginTop: title ? 28 : 0 }}>{children}</FadeIn>
          </View>
        </ScrollView>
      </WebPage>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={[{ paddingTop: insets.top, backgroundColor: c.bg }, title ? { borderBottomWidth: 1, borderBottomColor: c.border } : null]}>
        <View style={{ height: 56, flexDirection: "row", alignItems: "center", paddingHorizontal: 16, gap: 12 }}>
          <Pressable
            onPress={back}
            accessibilityRole="button"
            accessibilityLabel={close ? "Close" : "Back"}
            hitSlop={6}
            style={({ pressed }) => ({ width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: 20, backgroundColor: title ? c.surface2 : c.surface, opacity: pressed ? 0.6 : 1 })}
          >
            <BackIcon size={close ? 22 : 24} color={c.text} />
          </Pressable>
          {title && <Text variant="bodyStrong" style={{ fontSize: 18, flex: 1 }} accessibilityRole="header">{title}</Text>}
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
