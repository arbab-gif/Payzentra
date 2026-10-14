import { router } from "expo-router";
import { Bell, History } from "lucide-react-native";
import { Pressable, RefreshControl, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomNav, NAV_SPACE } from "@/components/BottomNav";
import { useDemoSheet } from "@/components/DemoSheet";
import {
  ActivityPanel,
  greeting,
  HeroBalance,
  HeroWash,
  IconCircle,
  openNotifications,
  QUICK_ACTIONS,
  QuickAction,
  RecommendedTile,
  Skeleton,
  UpdateNotice,
  useHomeModel,
  VerifyBanner,
  type HomeModel,
} from "@/components/home/parts";
import { WebHome } from "@/components/home/WebHome";
import { Loading } from "@/components/Screen";
import { FadeIn, Text } from "@/components/ui";
import { useWebLayout } from "@/lib/layout";
import { ROUTES } from "@/lib/store";
import { useColors } from "@/lib/theme";

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
  const recommended = m.items.find((i) => i.priority === "Recommended");

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
          <IconCircle label="Activity" onPress={() => router.push(ROUTES.activity as never)}>
            <History size={20} color={c.text} />
          </IconCircle>
          <IconCircle label={m.items.length ? `Notifications, ${m.items.length} new` : "Notifications"} onPress={openNotifications}>
            <Bell size={20} color={c.text} />
          </IconCircle>
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
                  <UpdateNotice />
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
