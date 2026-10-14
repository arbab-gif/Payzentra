import { router } from "expo-router";
import { Bell, History, RefreshCw } from "lucide-react-native";
import { Pressable, ScrollView, View } from "react-native";
import { FadeIn, Text } from "@/components/ui";
import { ROUTES } from "@/lib/store";
import { radius, useColors } from "@/lib/theme";
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
  UpdateNotice,
  VerifyBanner,
  type HomeModel,
} from "./parts";
import { WebSidebar } from "./WebSidebar";

/**
 * Desktop Home: the phone Home (centred balance on the indigo wash, round quick
 * actions, recent activity, update and recommendations) widened for a desktop
 * window, with the sidebar in place of the tab bar.
 */
export function WebHome({ m }: { m: HomeModel }) {
  const c = useColors();
  const name = [m.firstName, m.lastName].filter(Boolean).join(" ");
  const recommended = m.items.filter((i) => i.priority === "Recommended");
  const side = m.showUpdate || recommended.length > 0;

  return (
    <View style={{ flex: 1, flexDirection: "row", backgroundColor: c.bg }}>
      <WebSidebar page="home" initials={m.initials} name={name} email={m.account.email} />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 56 }}>
        <HeroWash />
        <View style={{ width: "100%", maxWidth: 1080, alignSelf: "center", paddingHorizontal: 40 }}>
          {/* Header: avatar (profile and settings), greeting, refresh, activity, notifications */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingTop: 28 }}>
            <Pressable
              onPress={() => router.push(ROUTES.profile as never)}
              accessibilityRole="button"
              accessibilityLabel="Profile and settings"
              style={({ pressed }) => ({ width: 44, height: 44, borderRadius: 22, backgroundColor: c.primary, alignItems: "center", justifyContent: "center", opacity: pressed ? 0.8 : 1 })}
            >
              <Text variant="smallStrong" style={{ color: c.onPrimary }}>{m.initials}</Text>
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text variant="small" tone="muted">{greeting()}</Text>
              <Text variant="bodyStrong" style={{ fontSize: 18 }} numberOfLines={1} accessibilityRole="header">{name}</Text>
            </View>
            <IconCircle label="Refresh" onPress={m.refresh}>
              <RefreshCw size={18} color={c.text} />
            </IconCircle>
            <IconCircle label="Activity" onPress={() => router.push(ROUTES.activity as never)}>
              <History size={20} color={c.text} />
            </IconCircle>
            <IconCircle label={m.items.length ? `Notifications, ${m.items.length} new` : "Notifications"} onPress={openNotifications}>
              <Bell size={20} color={c.text} />
            </IconCircle>
          </View>

          {m.loading ? (
            <WebSkeleton side={side} />
          ) : (
            <>
              <FadeIn>
                <HeroBalance m={m} large />
              </FadeIn>

              {!m.verified && (
                <FadeIn delay={40} style={{ width: "100%", maxWidth: 560, alignSelf: "center", paddingTop: 12 }}>
                  <VerifyBanner kyc={m.kyc} />
                </FadeIn>
              )}

              <FadeIn delay={60} style={{ flexDirection: "row", justifyContent: "center", gap: 28, paddingTop: m.verified ? 28 : 32 }}>
                {QUICK_ACTIONS.map((a) => (
                  <QuickAction key={a.label} {...a} locked={!m.verified} />
                ))}
              </FadeIn>

              <View style={[{ marginTop: 44, gap: 24 }, side ? { flexDirection: "row", alignItems: "flex-start" } : { width: "100%", maxWidth: 720, alignSelf: "center" }]}>
                <FadeIn delay={120} style={side ? { flex: 1.6 } : undefined}>
                  <ActivityPanel m={m} limit={6} />
                </FadeIn>
                {side && (
                  <FadeIn delay={160} style={{ flex: 1, gap: 16 }}>
                    {m.showUpdate && <UpdateNotice />}
                    {recommended.map((item) => (
                      <RecommendedTile key={item.key} item={item} />
                    ))}
                  </FadeIn>
                )}
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function WebSkeleton({ side }: { side: boolean }) {
  const c = useColors();
  const bar = (w: number, h: number, r = 8) => <View style={{ width: w, height: h, borderRadius: r, backgroundColor: c.surface2 }} />;
  return (
    <View accessibilityLabel="Loading your account">
      <View style={{ alignItems: "center", gap: 14, paddingTop: 48 }}>
        {bar(120, 14)}
        {bar(300, 64, 16)}
        {bar(220, 36, 18)}
      </View>
      <View style={{ flexDirection: "row", justifyContent: "center", gap: 38, paddingTop: 36 }}>
        {QUICK_ACTIONS.map((a) => (
          <View key={a.label} style={{ alignItems: "center", gap: 8 }}>
            {bar(56, 56, 28)}
            {bar(44, 10)}
          </View>
        ))}
      </View>
      <View style={{ flexDirection: "row", gap: 24, marginTop: 44 }}>
        <View style={{ flex: 1.6, height: 380, borderRadius: radius.lg, backgroundColor: c.surface }} />
        {side && <View style={{ flex: 1, height: 200, borderRadius: radius.lg, backgroundColor: c.surface }} />}
      </View>
    </View>
  );
}
