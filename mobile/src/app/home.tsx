import * as Clipboard from "expo-clipboard";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import {
  ArrowDownLeft,
  ArrowDownToLine,
  ArrowUpRight,
  Bell,
  Bitcoin,
  Check,
  ChevronRight,
  Clock3,
  CloudOff,
  Copy,
  Eye,
  EyeOff,
  Lock,
  LogOut,
  Megaphone,
  Plus,
  ReceiptText,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react-native";
import { useEffect, useState, type ReactNode } from "react";
import { Pressable, RefreshControl, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomNav, NAV_SPACE } from "@/components/BottomNav";
import { useDemoSheet } from "@/components/DemoSheet";
import { CoinLogo, CoinStack, MerchantLogo } from "@/components/Logos";
import { Loading } from "@/components/Screen";
import { Sheet } from "@/components/Sheet";
import { Button, FadeIn, haptic, LinkText, NgFlag, StatusIcon, Text } from "@/components/ui";
import { activeHome, money, newHome, type Txn } from "@/lib/demoData";
import { ROUTES, useApp } from "@/lib/store";
import { fonts, radius, useColors } from "@/lib/theme";
import { toast } from "@/lib/toast";
import { useGuard } from "@/lib/useGuard";

type Tone = "primary" | "success" | "warning" | "danger";
type Priority = "Required" | "Recommended" | "Info";
type ActionItem = { key: string; priority: Priority; Icon: LucideIcon; title: string; body: string; cta: string; onPress: () => void };

const HIDDEN = "••••••";
const WHITE = "#ffffff";
const CRYPTO = "#f7931a";
const soon = (what: string) => toast({ tone: "info", title: `${what} opens here`, body: "That flow isn't part of this build yet." });
const locked = () => toast({ tone: "info", title: "Available once you're verified", body: "We'll let you know as soon as your verification is done." });

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export default function Home() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const allowed = useGuard(ROUTES.home);
  const account = useApp((s) => s.account);
  const kyc = useApp((s) => s.kyc);
  const scenario = useApp((s) => s.scenarios.home);
  const hide = useApp((s) => s.hideBalances);
  const setHide = useApp((s) => s.setHideBalances);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [updateDismissed, setUpdateDismissed] = useState(false);

  // First load shows a skeleton rather than empty or zero values.
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(t);
  }, []);

  if (!allowed || !account) return <Loading />;

  const verified = kyc.status === "verified";
  const rejected = kyc.status === "rejected";
  const failing = verified && scenario === "unavailable";
  const data = verified && scenario !== "new" ? activeHome : newHome;
  const firstName = kyc.identity?.firstName ?? (kyc.firstName || account.email.split("@")[0]);
  const lastName = kyc.identity?.lastName ?? kyc.lastName;
  const initials = `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase() || "P";
  // Nigerian wallets commonly use the 10-digit phone number as the account number.
  const accountNo = kyc.phone.length === 10 ? kyc.phone : "9012345678";

  const items: ActionItem[] = [];
  if (rejected)
    items.push({ key: "kyc", priority: "Required", Icon: ShieldAlert, title: "Update your home address", body: "One detail couldn't be confirmed. Fix it to finish verification.", cta: "Update address", onPress: () => router.push(ROUTES.status as never) });
  if (!account.mfaEnabled)
    items.push({ key: "mfa", priority: "Recommended", Icon: ShieldCheck, title: "Turn on two-step sign-in", body: "Add an authenticator app so only you can log in.", cta: "Set up", onPress: () => router.push(ROUTES.secure as never) });

  const showUpdate = verified && scenario === "active" && !updateDismissed;

  const refresh = () => {
    if (refreshing) return;
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 900);
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 12) + NAV_SPACE }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={c.primary} colors={[c.primary]} />}
      >
        {/* 1 · Header: greeting, notifications, profile */}
        <View style={{ height: 64, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16 }}>
          <Pressable
            onPress={() => setProfileOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Profile"
            style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: c.primary, alignItems: "center", justifyContent: "center" }}
          >
            <Text variant="smallStrong" style={{ color: c.onPrimary }}>{initials}</Text>
          </Pressable>
          {/* Long-press the greeting for Demo controls. */}
          <Pressable style={{ flex: 1 }} onLongPress={() => useDemoSheet.getState().setOpen(true)} delayLongPress={600} accessible={false}>
            <Text variant="caption" tone="muted">{greeting()}</Text>
            <Text variant="bodyStrong" style={{ fontSize: 17 }} numberOfLines={1}>Hi, {firstName}</Text>
          </Pressable>
          <IconCircle label={items.length ? `Notifications, ${items.length} new` : "Notifications"} onPress={() => toast({ tone: "info", title: "Notifications", body: "Your notification centre opens here." })}>
            <Bell size={20} color={c.text} />
            {items.length > 0 && (
              <View style={{ position: "absolute", top: -2, right: -2, minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 4, backgroundColor: c.primary, borderWidth: 2, borderColor: c.bg, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontFamily: fonts.bold, fontSize: 10, lineHeight: 12, color: c.onPrimary }}>{items.length}</Text>
              </View>
            )}
          </IconCircle>
        </View>

        {loading ? (
          <Skeleton />
        ) : (
          <>
            {/* 2 · Consolidated balance card */}
            <FadeIn style={{ paddingHorizontal: 16, paddingTop: 8 }}>
              <BalanceCard
                verified={verified}
                hide={hide}
                onToggleHide={() => setHide(!hide)}
                naira={failing ? null : data.naira}
                cryptoNgn={failing ? undefined : data.cryptoNgn}
                pricedAt={data.pricedAt}
                accountNo={accountNo}
                onRetry={refresh}
              />
            </FadeIn>

            {/* 3 · Eligible quick actions */}
            <FadeIn delay={60} style={{ flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 16, marginTop: 24 }}>
              {(
                [
                  { label: "Add money", Icon: Plus, tint: c.primary, main: true },
                  { label: "Send", Icon: ArrowUpRight, tint: c.primary },
                  { label: "Withdraw", Icon: ArrowDownToLine, tint: c.info },
                  { label: "Pay bills", Icon: ReceiptText, tint: c.success },
                  { label: "Buy crypto", Icon: Bitcoin, tint: CRYPTO },
                ] as { label: string; Icon: LucideIcon; tint: string; main?: boolean }[]
              ).map((a) => (
                <QuickAction key={a.label} {...a} locked={!verified} />
              ))}
            </FadeIn>

            <View style={{ paddingHorizontal: 16, marginTop: 28, gap: 28 }}>
              {/* 4 · Recent activity */}
              <FadeIn delay={120}>
                <SectionHeader title="Recent activity" action={data.activity.length && !failing ? <LinkText onPress={() => soon("Activity")}>View all</LinkText> : undefined} />
                <View style={{ backgroundColor: c.surface, borderRadius: radius.lg, paddingVertical: 4 }}>
                  {failing ? (
                    <SectionError what="your recent activity" onRetry={refresh} />
                  ) : data.activity.length ? (
                    data.activity.slice(0, 5).map((t) => <TxnRow key={t.id} txn={t} hide={hide} />)
                  ) : (
                    <View style={{ alignItems: "center", paddingHorizontal: 24, paddingTop: 16, paddingBottom: 20, gap: 6 }}>
                      <StatusIcon icon={ReceiptText} tone="primary" size={64} />
                      <Text variant="bodyStrong" style={{ marginTop: 4 }}>No activity yet</Text>
                      <Text variant="small" tone="muted" center>
                        {verified ? "Add money to make your first payment, transfer or trade." : "Your payments and transfers will show up here once you're verified."}
                      </Text>
                      {verified && <Button title="Add money" size="sm" icon={Plus} onPress={() => soon("Add money")} style={{ marginTop: 10, alignSelf: "center" }} />}
                    </View>
                  )}
                </View>
              </FadeIn>

              {/* 5 · Account status and action centre */}
              <FadeIn delay={160}>
                <SectionHeader title="Action centre" />
                <View style={{ backgroundColor: c.surface, borderRadius: radius.lg, overflow: "hidden" }}>
                  <AccountStatus status={kyc.status} />
                  {items.length ? (
                    items.map((it) => <ActionRow key={it.key} item={it} />)
                  ) : (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10, padding: 16, borderTopWidth: 1, borderTopColor: c.border }}>
                      <Check size={18} color={c.success} />
                      <Text variant="small" tone="muted">You&apos;re all set. Nothing needs your attention.</Text>
                    </View>
                  )}
                </View>
              </FadeIn>

              {/* 6 · Announcements and service updates, when there are any */}
              {showUpdate && (
                <FadeIn delay={200}>
                  <SectionHeader title="Updates" />
                  <View style={{ flexDirection: "row", gap: 14, padding: 16, borderRadius: radius.lg, backgroundColor: c.surface }}>
                    <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: c.infoSoft, alignItems: "center", justifyContent: "center" }}>
                      <Megaphone size={18} color={c.info} />
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text variant="caption" style={{ color: c.info }}>Planned maintenance · Sun 19 Oct</Text>
                      <Text variant="smallStrong" style={{ fontSize: 15 }}>Card top-ups pause from 2 to 4 AM</Text>
                      <Text variant="small" tone="muted">Bank transfers and crypto keep working as normal.</Text>
                    </View>
                    <Pressable onPress={() => setUpdateDismissed(true)} hitSlop={10} accessibilityRole="button" accessibilityLabel="Dismiss update">
                      <X size={18} color={c.subtle} />
                    </Pressable>
                  </View>
                </FadeIn>
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* 7 · Global navigation */}
      <BottomNav active="home" />

      <Sheet open={profileOpen} onClose={() => setProfileOpen(false)} title="Profile">
        <View style={{ paddingHorizontal: 20, gap: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
            <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: c.primary, alignItems: "center", justifyContent: "center" }}>
              <Text variant="heading" style={{ color: c.onPrimary }}>{initials}</Text>
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text variant="bodyStrong" numberOfLines={1}>{[firstName, lastName].filter(Boolean).join(" ")}</Text>
              <Text variant="small" tone="muted" numberOfLines={1}>{account.email}</Text>
            </View>
          </View>
          <View style={{ gap: 8, paddingTop: 4 }}>
            <Button
              title="Log out"
              variant="secondary"
              icon={LogOut}
              onPress={() => {
                setProfileOpen(false);
                useApp.getState().signOut();
                router.replace("/welcome-back");
              }}
            />
            <Button
              title="Start again"
              variant="ghost"
              icon={RotateCcw}
              onPress={() => {
                setProfileOpen(false);
                useApp.getState().resetAll();
                router.replace("/");
              }}
            />
          </View>
        </View>
      </Sheet>
    </View>
  );
}

// ---------- Balance card ----------

function BalanceCard({
  verified,
  hide,
  onToggleHide,
  naira,
  cryptoNgn,
  pricedAt,
  accountNo,
  onRetry,
}: {
  verified: boolean;
  hide: boolean;
  onToggleHide: () => void;
  /** null = couldn't load (never shown as zero). */
  naira: number | null;
  /** undefined = couldn't load; null = no crypto held. */
  cryptoNgn: number | null | undefined;
  pricedAt: string;
  accountNo: string;
  onRetry: () => void;
}) {
  const [int, frac] = money(naira ?? 0).split(".");
  const glass = "rgba(255,255,255,0.18)";
  return (
    <View style={{ paddingBottom: 46 }}>
      {/* Crypto summary card tucked behind; its visible strip is the indicative crypto total. */}
      <Pressable
        onPress={() => (verified ? soon("Crypto") : locked())}
        accessibilityRole="button"
        accessibilityLabel={cryptoNgn === undefined ? "Crypto value unavailable" : cryptoNgn === null ? "Crypto. Buy BTC, ETH, USDT or USDC" : `Crypto, about ${hide ? "hidden" : `${money(cryptoNgn, 0)} naira`}, indicative, updated ${pricedAt}`}
        style={{ position: "absolute", left: 10, right: 10, top: 40, bottom: 0, borderRadius: 24, overflow: "hidden" }}
      >
        <LinearGradient colors={["#c46f0c", "#5c3005"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, justifyContent: "flex-end", paddingHorizontal: 16, paddingBottom: 13 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            {cryptoNgn === undefined ? (
              <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: "rgba(255,255,255,0.22)", alignItems: "center", justifyContent: "center" }}>
                <Bitcoin size={14} color={WHITE} strokeWidth={2.4} />
              </View>
            ) : (
              <CoinStack codes={cryptoNgn === null ? ["BTC", "ETH", "USDT", "USDC"] : ["BTC", "USDT"]} size={22} ring="#9a5207" />
            )}
            <Text variant="smallStrong" style={{ color: WHITE, flex: 1 }} numberOfLines={1}>
              {cryptoNgn === undefined ? "Crypto value unavailable" : cryptoNgn === null ? "Buy your first crypto" : `≈ ₦${hide ? HIDDEN : money(cryptoNgn, 0)}`}
            </Text>
            {typeof cryptoNgn === "number" && <Text variant="caption" style={{ color: "rgba(255,255,255,0.75)" }}>Indicative · {pricedAt}</Text>}
            <ChevronRight size={16} color="rgba(255,255,255,0.8)" />
          </View>
        </LinearGradient>
      </Pressable>

      {/* Naira wallet card */}
      <LinearGradient colors={["#8a9bff", "#667cff", "#3b3fd8"]} locations={[0, 0.4, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 24, padding: 18, overflow: "hidden", minHeight: 188 }}>
        <View pointerEvents="none" style={{ position: "absolute", right: -50, top: -50, width: 170, height: 170, borderRadius: 85, borderWidth: 1, borderColor: "rgba(255,255,255,0.22)" }} />
        <View pointerEvents="none" style={{ position: "absolute", right: -18, top: -18, width: 106, height: 106, borderRadius: 53, borderWidth: 1, borderColor: "rgba(255,255,255,0.22)" }} />
        <View pointerEvents="none" style={{ position: "absolute", left: -40, bottom: -80, width: 190, height: 190, borderRadius: 95, backgroundColor: "rgba(255,255,255,0.08)" }} />

        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: glass, paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill }}>
            <NgFlag />
            <Text variant="caption" style={{ color: WHITE, fontFamily: fonts.semibold }}>Naira wallet</Text>
          </View>
          <Pressable
            onPress={onToggleHide}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={hide ? "Show balances" : "Hide balances"}
            style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: glass, alignItems: "center", justifyContent: "center" }}
          >
            {hide ? <EyeOff size={17} color={WHITE} /> : <Eye size={17} color={WHITE} />}
          </Pressable>
        </View>

        <Text variant="caption" style={{ color: "rgba(255,255,255,0.8)", marginTop: 18 }}>Available balance</Text>
        {naira === null ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 4 }}>
            <CloudOff size={20} color={WHITE} />
            <Text variant="heading" style={{ color: WHITE, flex: 1 }}>Balance unavailable</Text>
            <Pressable onPress={onRetry} accessibilityRole="button" style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: WHITE, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 7 }}>
              <RefreshCw size={14} color="#3b3fd8" />
              <Text variant="caption" style={{ color: "#3b3fd8", fontFamily: fonts.bold }}>Retry</Text>
            </Pressable>
          </View>
        ) : (
          <View style={{ flexDirection: "row", alignItems: "flex-end" }} accessible accessibilityLabel={hide ? "Balance hidden" : `Balance ${int} naira ${frac} kobo`}>
            <Text style={{ fontFamily: fonts.extrabold, fontSize: 36, lineHeight: 44, letterSpacing: -1.4, color: WHITE }}>{hide ? `₦${HIDDEN}` : `₦${int}`}</Text>
            {!hide && <Text style={{ fontFamily: fonts.bold, fontSize: 22, lineHeight: 36, color: "rgba(255,255,255,0.7)" }}>.{frac}</Text>}
          </View>
        )}

        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 20 }}>
          {verified ? (
            <Pressable
              onPress={async () => {
                await Clipboard.setStringAsync(accountNo);
                haptic("success");
                toast({ tone: "success", title: "Account number copied" });
              }}
              accessibilityRole="button"
              accessibilityLabel={`Account number ${accountNo.split("").join(" ")}. Copy`}
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <Text variant="smallStrong" style={{ color: WHITE, letterSpacing: 0.8 }}>{`${accountNo.slice(0, 3)} ${accountNo.slice(3, 6)} ${accountNo.slice(6)}`}</Text>
              <Copy size={14} color="rgba(255,255,255,0.85)" />
            </Pressable>
          ) : (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Lock size={13} color="rgba(255,255,255,0.8)" />
              <Text variant="caption" style={{ color: "rgba(255,255,255,0.8)" }}>Account number after verification</Text>
            </View>
          )}
          <Text style={{ fontFamily: fonts.extrabold, fontSize: 14, letterSpacing: -0.2, color: WHITE }}>Payzentra</Text>
        </View>
      </LinearGradient>
    </View>
  );
}

// ---------- Pieces ----------

function IconCircle({ children, label, onPress }: { children: ReactNode; label: string; onPress: () => void }) {
  const c = useColors();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => ({ width: 40, height: 40, borderRadius: 20, backgroundColor: c.surface2, alignItems: "center", justifyContent: "center", opacity: pressed ? 0.6 : 1 })}
    >
      {children}
    </Pressable>
  );
}

function QuickAction({ label, Icon, tint, main, locked: isLocked }: { label: string; Icon: LucideIcon; tint: string; main?: boolean; locked: boolean }) {
  const c = useColors();
  const bg = isLocked ? c.surface2 : main ? c.primary : `${tint}29`;
  const fg = isLocked ? c.subtle : main ? c.onPrimary : tint;
  return (
    <Pressable
      onPress={() => {
        haptic("light");
        if (isLocked) locked();
        else soon(label);
      }}
      accessibilityRole="button"
      accessibilityLabel={isLocked ? `${label}, locked until you're verified` : label}
      style={({ pressed }) => ({ alignItems: "center", gap: 8, width: 66, opacity: pressed ? 0.6 : 1 })}
    >
      <View style={{ width: 54, height: 54, borderRadius: 27, alignItems: "center", justifyContent: "center", backgroundColor: bg }}>
        <Icon size={23} color={fg} strokeWidth={2.2} />
        {isLocked && (
          <View style={{ position: "absolute", top: -2, right: -2, width: 20, height: 20, borderRadius: 10, backgroundColor: c.bg, alignItems: "center", justifyContent: "center" }}>
            <Lock size={11} color={c.muted} />
          </View>
        )}
      </View>
      <Text variant="caption" tone={isLocked ? "muted" : "text"} numberOfLines={1}>{label}</Text>
    </Pressable>
  );
}

function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10, paddingHorizontal: 4 }}>
      <Text variant="bodyStrong" style={{ flex: 1, fontSize: 18 }} accessibilityRole="header">{title}</Text>
      {action}
    </View>
  );
}

function SectionError({ what, onRetry }: { what: string; onRetry: () => void }) {
  const c = useColors();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 16 }} accessibilityLiveRegion="polite">
      <CloudOff size={20} color={c.muted} />
      <Text variant="small" tone="muted" style={{ flex: 1 }}>We couldn&apos;t load {what}.</Text>
      <Button title="Retry" size="sm" variant="secondary" icon={RefreshCw} onPress={onRetry} />
    </View>
  );
}

const TXN_ICON: Record<Txn["kind"], LucideIcon> = {
  transfer_in: ArrowDownLeft,
  transfer_out: ArrowUpRight,
  airtime: Smartphone,
  bill: Zap,
  crypto: Bitcoin,
};

function TxnRow({ txn, hide }: { txn: Txn; hide: boolean }) {
  const c = useColors();
  const Icon = TXN_ICON[txn.kind];
  const person = txn.kind === "transfer_in" || txn.kind === "transfer_out";
  const initials = txn.title.split(" ").map((w) => w[0]).join("").slice(0, 2);
  const amount = hide ? `₦${HIDDEN}` : `${txn.direction === "in" ? "+" : "−"}₦${money(txn.amount)}`;
  const pill = txn.status === "Processing" ? { bg: c.warningSoft, fg: c.warning } : txn.status === "Failed" ? { bg: c.dangerSoft, fg: c.danger } : null;
  return (
    <Pressable
      onPress={() => soon("Transaction details")}
      accessibilityRole="button"
      accessibilityLabel={`${txn.title}, ${txn.direction === "in" ? "received" : "sent"} ${hide ? "amount hidden" : amount}, ${txn.when}, ${txn.status}`}
      style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 11, opacity: pressed ? 0.6 : 1 })}
    >
      {person ? (
        <View>
          <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: c.primarySoft, alignItems: "center", justifyContent: "center" }}>
            <Text variant="smallStrong" tone="primary">{initials}</Text>
          </View>
          <View style={{ position: "absolute", right: -2, bottom: -2, width: 18, height: 18, borderRadius: 9, backgroundColor: c.surface, alignItems: "center", justifyContent: "center" }}>
            <Icon size={12} color={txn.direction === "in" ? c.success : c.text} strokeWidth={2.6} />
          </View>
        </View>
      ) : txn.coin ? (
        // Coin logo with the direction the coin moved: bought/received = in.
        <View>
          <CoinLogo code={txn.coin} size={42} />
          <View style={{ position: "absolute", right: -2, bottom: -2, width: 18, height: 18, borderRadius: 9, backgroundColor: c.surface, alignItems: "center", justifyContent: "center" }}>
            {txn.direction === "out" ? <ArrowDownLeft size={12} color={c.success} strokeWidth={2.6} /> : <ArrowUpRight size={12} color={c.text} strokeWidth={2.6} />}
          </View>
        </View>
      ) : (
        <MerchantLogo name={txn.merchant ?? ""} fallback={Icon} />
      )}
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Text variant="smallStrong" style={{ fontSize: 15 }} numberOfLines={1}>{txn.title}</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text variant="small" tone="muted" numberOfLines={1}>{txn.when}</Text>
          {pill && (
            <View style={{ paddingHorizontal: 7, paddingVertical: 1, borderRadius: radius.pill, backgroundColor: pill.bg }}>
              <Text variant="caption" style={{ color: pill.fg, fontSize: 11 }}>{txn.status}</Text>
            </View>
          )}
        </View>
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <Text
          variant="smallStrong"
          style={{
            fontSize: 15,
            color: txn.status === "Failed" ? c.subtle : txn.direction === "in" ? c.success : c.text,
            textDecorationLine: txn.status === "Failed" ? "line-through" : "none",
          }}
        >
          {amount}
        </Text>
        {txn.note && !hide && <Text variant="caption" tone="muted">{txn.note}</Text>}
      </View>
    </Pressable>
  );
}

function AccountStatus({ status }: { status: "none" | "pending" | "verified" | "rejected" }) {
  const c = useColors();
  const s =
    status === "verified"
      ? { tone: "success" as Tone, Icon: ShieldCheck, label: "Verified", body: "Basic verification complete. Daily and monthly limits apply." }
      : status === "rejected"
        ? { tone: "danger" as Tone, Icon: ShieldAlert, label: "Action required", body: "Your verification needs one more step." }
        : { tone: "warning" as Tone, Icon: Clock3, label: "In review", body: "We're checking your details. This usually takes up to 24 hours." };
  const soft = { primary: c.primarySoft, success: c.successSoft, warning: c.warningSoft, danger: c.dangerSoft }[s.tone];
  return (
    <Pressable
      onPress={() => (status === "verified" ? soon("Limits") : router.push(ROUTES.status as never))}
      accessibilityRole="button"
      accessibilityLabel={`Account status: ${s.label}. ${s.body}`}
      style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 12, padding: 16, opacity: pressed ? 0.7 : 1 })}
    >
      <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: soft, alignItems: "center", justifyContent: "center" }}>
        <s.Icon size={20} color={c[s.tone]} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text variant="smallStrong" style={{ fontSize: 15 }}>Account status</Text>
          <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.pill, backgroundColor: soft }}>
            <Text variant="caption" style={{ color: c[s.tone] }}>{s.label}</Text>
          </View>
        </View>
        <Text variant="small" tone="muted">{s.body}</Text>
      </View>
      <ChevronRight size={18} color={c.subtle} />
    </Pressable>
  );
}

function ActionRow({ item: it }: { item: ActionItem }) {
  const c = useColors();
  const required = it.priority === "Required";
  const tone: Tone = required ? "danger" : "primary";
  return (
    <View style={{ flexDirection: "row", gap: 12, padding: 16, borderTopWidth: 1, borderTopColor: c.border }}>
      <StatusIcon icon={it.Icon} tone={tone} size={42} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="caption" style={{ color: c[tone], letterSpacing: 0.4 }}>{it.priority.toUpperCase()}</Text>
        <Text variant="smallStrong" style={{ fontSize: 15 }}>{it.title}</Text>
        <Text variant="small" tone="muted">{it.body}</Text>
        <View style={{ flexDirection: "row", marginTop: 10 }}>
          <Button title={it.cta} size="sm" variant={required ? "primary" : "secondary"} onPress={it.onPress} />
        </View>
      </View>
    </View>
  );
}

function Skeleton() {
  const c = useColors();
  const bar = (w: number | `${number}%`, h: number, r = 8) => <View style={{ width: w, height: h, borderRadius: r, backgroundColor: c.surface2 }} />;
  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 8 }} accessibilityLabel="Loading your account">
      <View style={{ height: 188, borderRadius: 24, backgroundColor: c.surface }} />
      <View style={{ height: 46 }} />
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 24 }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <View key={i} style={{ width: 66, alignItems: "center", gap: 8 }}>
            {bar(54, 54, 27)}
            {bar(44, 10)}
          </View>
        ))}
      </View>
      <View style={{ marginTop: 32, gap: 14, backgroundColor: c.surface, borderRadius: radius.lg, padding: 16 }}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            {bar(42, 42, 21)}
            <View style={{ flex: 1, gap: 6 }}>
              {bar("60%", 12)}
              {bar("35%", 10)}
            </View>
            {bar(64, 12)}
          </View>
        ))}
      </View>
    </View>
  );
}
