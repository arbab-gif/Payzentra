import { router } from "expo-router";
import { Bell, History, RefreshCw } from "lucide-react-native";
import { ScrollView, useWindowDimensions, View } from "react-native";
import { FadeIn, Text } from "@/components/ui";
import { ROUTES } from "@/lib/store";
import { radius, useColors } from "@/lib/theme";
import { toast } from "@/lib/toast";
import {
  ActionCentrePanel,
  ActivityPanel,
  BalanceCard,
  greeting,
  IconCircle,
  NotificationBadge,
  QuickAction,
  QUICK_ACTIONS,
  SectionHeader,
  UpdatePanel,
  VerifyBanner,
  type HomeModel,
} from "./parts";
import { WebSidebar } from "./WebSidebar";

/** Below this width the dashboard stacks into one column. */
const TWO_COLUMNS = 1180;

/**
 * Desktop Home: the same sections as the phone app (balance card, quick actions,
 * recent activity, action centre, updates) laid out as a dashboard with a sidebar.
 */
export function WebHome({ m }: { m: HomeModel }) {
  const c = useColors();
  const { width } = useWindowDimensions();
  const twoCols = width >= TWO_COLUMNS;
  const today = new Date().toLocaleDateString("en-NG", { weekday: "long", day: "numeric", month: "long" });
  const name = [m.firstName, m.lastName].filter(Boolean).join(" ");

  return (
    <View style={{ flex: 1, flexDirection: "row", backgroundColor: c.bg }}>
      <WebSidebar page="home" initials={m.initials} name={name} email={m.account.email} />

      {/* Main */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 40, paddingTop: 28, paddingBottom: 48 }}>
        <View style={{ width: "100%", maxWidth: 1200, alignSelf: "center" }}>
          {/* Top bar */}
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 28, gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text variant="title" accessibilityRole="header">{greeting()}, {m.firstName}</Text>
              <Text tone="muted" style={{ marginTop: 2 }}>{today}</Text>
            </View>
            <IconCircle label="Refresh" onPress={m.refresh}>
              <RefreshCw size={18} color={c.text} />
            </IconCircle>
            <IconCircle label="Activity" onPress={() => router.push(ROUTES.activity as never)}>
              <History size={19} color={c.text} />
            </IconCircle>
            <IconCircle label={m.items.length ? `Notifications, ${m.items.length} new` : "Notifications"} onPress={() => toast({ tone: "info", title: "Notifications", body: "Your notification centre opens here." })}>
              <Bell size={20} color={c.text} />
              <NotificationBadge count={m.items.length} />
            </IconCircle>
          </View>

          {m.loading ? (
            <WebSkeleton twoCols={twoCols} />
          ) : (
            <View style={{ gap: 24 }}>
              {!m.verified && (
                <FadeIn>
                  <VerifyBanner kyc={m.kyc} />
                </FadeIn>
              )}
              <View style={{ flexDirection: twoCols ? "row" : "column", gap: 24, alignItems: "flex-start" }}>
                {/* Left: money */}
                <View style={{ flex: twoCols ? 1.45 : undefined, width: twoCols ? undefined : "100%", gap: 28 }}>
                  <FadeIn>
                    <BalanceCard
                      verified={m.verified}
                      status={m.kyc.status}
                      hide={m.hide}
                      onToggleHide={m.toggleHide}
                      naira={m.failing ? null : m.data.naira}
                      held={m.data.held}
                      cryptoNgn={m.failing ? undefined : m.data.cryptoNgn}
                      pricedAt={m.data.pricedAt}
                      accountNo={m.accountNo}
                      onRetry={m.refresh}
                    />
                  </FadeIn>
                  <FadeIn delay={60}>
                    <SectionHeader title="Quick actions" />
                    <View style={{ flexDirection: "row", justifyContent: "space-around", backgroundColor: c.surface, borderRadius: radius.lg, paddingVertical: 20, paddingHorizontal: 12 }}>
                      {QUICK_ACTIONS.map((a) => (
                        <QuickAction key={a.label} {...a} locked={!m.verified} />
                      ))}
                    </View>
                  </FadeIn>
                  <FadeIn delay={120}>
                    <ActivityPanel m={m} limit={6} />
                  </FadeIn>
                </View>
                {/* Right: what needs attention */}
                <View style={{ flex: twoCols ? 1 : undefined, width: twoCols ? undefined : "100%", gap: 28 }}>
                  <FadeIn delay={160}>
                    <ActionCentrePanel m={m} />
                  </FadeIn>
                  <FadeIn delay={200}>
                    <UpdatePanel m={m} />
                  </FadeIn>
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function WebSkeleton({ twoCols }: { twoCols: boolean }) {
  const c = useColors();
  const block = (h: number) => <View style={{ height: h, borderRadius: radius.lg, backgroundColor: c.surface }} />;
  return (
    <View style={{ flexDirection: twoCols ? "row" : "column", gap: 24 }} accessibilityLabel="Loading your account">
      <View style={{ flex: 1.45, gap: 28 }}>
        {block(234)}
        {block(116)}
        {block(320)}
      </View>
      <View style={{ flex: 1, gap: 28 }}>
        {block(260)}
        {block(110)}
      </View>
    </View>
  );
}
