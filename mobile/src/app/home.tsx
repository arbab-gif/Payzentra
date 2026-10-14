import { router } from "expo-router";
import { Bell, History, Megaphone } from "lucide-react-native";
import { Pressable, RefreshControl, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomNav, NAV_SPACE } from "@/components/BottomNav";
import { useDemoSheet } from "@/components/DemoSheet";
import {
  ActivityPanel,
  greeting,
  HeroBalance,
  HeroWash,
  NoticeCard,
  QUICK_ACTIONS,
  QuickAction,
  RecommendedTile,
  Skeleton,
  soon,
  useHomeModel,
  VerifyBanner,
  type HomeModel,
} from "@/components/home/parts";
import { WebHome } from "@/components/home/WebHome";
import { Loading } from "@/components/Screen";
import { FadeIn, Text } from "@/components/ui";
import { useWebLayout } from "@/lib/layout";
import { ROUTES, useApp } from "@/lib/store";
import { useColors } from "@/lib/theme";
import { toast } from "@/lib/toast";

export default function Home() {
  const m = useHomeModel();
  const web = useWebLayout();
  if (!m) return <Loading />;
  return web ? <WebHome m={m} /> : <MobileHome m={m} />;
}

/** Phone Home, matching the Figma "Home · Verified" frame. The tab bar stays fixed while the page scrolls. */
function MobileHome({ m }: { m: HomeModel }) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const dark = useApp((s) => s.theme) === "dark";
  const recommended = m.items.find((i) => i.priority === "Recommended");
  const circle = { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: dark ? "rgba(255,255,255,0.25)" : c.surface2 } as const;

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top, paddingBottom: NAV_SPACE + Math.max(insets.bottom, 10) + 8 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={m.refreshing} onRefresh={m.refresh} tintColor={c.primary} colors={[c.primary]} />}
      >
        <HeroWash />

        {/* Header: avatar (profile and settings), greeting, activity, notifications */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 20, paddingVertical: 12 }}>
          <Pressable
            onPress={() => router.push(ROUTES.profile as never)}
            accessibilityRole="button"
            accessibilityLabel="Profile and settings"
            style={({ pressed }) => ({ width: 42, height: 42, borderRadius: 21, backgroundColor: c.primary, alignItems: "center", justifyContent: "center", opacity: pressed ? 0.8 : 1 })}
          >
            <Text variant="smallStrong" style={{ color: c.onPrimary }}>{m.initials}</Text>
          </Pressable>
          {/* Long-press the greeting for Demo controls. */}
          <Pressable style={{ flex: 1, marginLeft: 2 }} onLongPress={() => useDemoSheet.getState().setOpen(true)} delayLongPress={600} accessible={false}>
            <Text variant="caption" tone="muted">{greeting()}</Text>
            <Text variant="bodyStrong" numberOfLines={1}>{[m.firstName, m.lastName].filter(Boolean).join(" ")}</Text>
          </Pressable>
          <Pressable onPress={() => router.push(ROUTES.activity as never)} accessibilityRole="button" accessibilityLabel="Activity" style={({ pressed }) => ({ ...circle, opacity: pressed ? 0.7 : 1 })}>
            <History size={20} color={c.text} />
          </Pressable>
          <Pressable
            onPress={() => toast({ tone: "info", title: "Notifications", body: "Your notification centre opens here." })}
            accessibilityRole="button"
            accessibilityLabel={m.items.length ? `Notifications, ${m.items.length} new` : "Notifications"}
            style={({ pressed }) => ({ ...circle, opacity: pressed ? 0.7 : 1 })}
          >
            <Bell size={20} color={c.text} />
          </Pressable>
        </View>

        {m.loading ? (
          <Skeleton />
        ) : (
          <>
            {/* Balance: available naira, money on hold and indicative crypto; or "not active yet" */}
            <FadeIn>
              <HeroBalance m={m} />
            </FadeIn>

            {/* Small verification banner until the wallet is active */}
            {!m.verified && (
              <FadeIn delay={40} style={{ paddingHorizontal: 16, paddingTop: 10 }}>
                <VerifyBanner kyc={m.kyc} />
              </FadeIn>
            )}

            {/* Quick actions (locked until the wallet is active) */}
            <FadeIn delay={60} style={{ flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: m.verified ? 30 : 24 }}>
              {QUICK_ACTIONS.map((a) => (
                <QuickAction key={a.label} {...a} locked={!m.verified} />
              ))}
            </FadeIn>

            <View style={{ paddingHorizontal: 16, paddingTop: 30, paddingBottom: 24, gap: 16 }}>
              <FadeIn delay={120}>
                <ActivityPanel m={m} />
              </FadeIn>

              {m.showUpdate && (
                <FadeIn delay={160}>
                  <NoticeCard tone="primary" Icon={Megaphone} tag="Update" title="Card top-ups pause Sunday, 2–4 AM" body="Planned maintenance. Bank transfers keep working as normal." onPress={() => soon("This update")} />
                </FadeIn>
              )}

              {recommended && (
                <FadeIn delay={200}>
                  <RecommendedTile item={recommended} />
                </FadeIn>
              )}
            </View>
          </>
        )}
      </ScrollView>

      <BottomNav active="home" />
    </View>
  );
}
