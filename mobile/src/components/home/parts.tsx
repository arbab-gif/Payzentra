import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import {
  ArrowDownLeft,
  ArrowDownToLine,
  ArrowUpRight,
  BadgeCheck,
  Bitcoin,
  ChevronRight,
  Clock3,
  CloudOff,
  CreditCard,
  Eye,
  EyeOff,
  Hourglass,
  KeyRound,
  Lock,
  Megaphone,
  Plus,
  ReceiptText,
  RefreshCw,
  ScanFace,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Zap,
  type LucideIcon,
} from "lucide-react-native";
import { useEffect, useState, type ReactNode } from "react";
import { Image, Pressable, View } from "react-native";
import { BIOMETRIC_NAME } from "@/components/DevicePrompt";
import { CoinLogo, CoinStack, MerchantLogo } from "@/components/Logos";
import { Button, haptic, LinkText, StatusIcon, Text } from "@/components/ui";
import { activeHome, money, newHome, type HomeData, type Txn } from "@/lib/demoData";
import { usePreview, useSeed } from "@/lib/preview";
import { kycNext, ROUTES, useApp, type Account, type Kyc } from "@/lib/store";
import { fonts, radius, useColors } from "@/lib/theme";
import { toast } from "@/lib/toast";
import { useGuard } from "@/lib/useGuard";

/** Building blocks shared by the phone and desktop Home layouts. */

type Tone = "primary" | "success" | "warning" | "danger";
type Priority = "Required" | "Recommended" | "Info";
export type ActionItem = { key: string; priority: Priority; Icon: LucideIcon; title: string; body: string; cta: string; onPress: () => void };

const HIDDEN = "••••••";
export const CRYPTO = "#f7931a";
export const soon = (what: string) => toast({ tone: "info", title: `${what} opens here`, body: "That flow isn't part of this build yet." });
export const locked = () => toast({ tone: "info", title: "Available once your wallet is active", body: "Verify your identity to activate your wallet." });
export const openNotifications = () => toast({ tone: "info", title: "Notifications", body: "Your notification centre opens here." });
export const explainHeld = (held: number) =>
  toast({ tone: "info", title: `₦${money(held)} on hold`, body: "Money set aside for a payment that's still processing. It's released or returned when the payment finishes." });

/** The demo customer's wallet account number (matches the phone on their ID record). */
export const ACCOUNT_NO = "8031234567";

/** "ada.obi@mail.com" → "Ada": a friendly name before identity is verified. */
function nameFromEmail(email: string) {
  const first = email.split("@")[0].split(/[._\-+0-9]/).find(Boolean) ?? "there";
  return first.charAt(0).toUpperCase() + first.slice(1);
}

/** The customer's name: from the confirmed ID record, or the email before that. */
export function useCustomerName() {
  const email = useApp((s) => s.account?.email ?? "");
  const identity = useApp((s) => (s.kyc.identityConfirmed ? s.kyc.identity : null));
  const firstName = identity ? identity.firstName : nameFromEmail(email);
  const lastName = identity ? identity.lastName : "";
  return {
    firstName,
    lastName,
    name: [firstName, lastName].filter(Boolean).join(" "),
    initials: `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase() || "P",
    email,
  };
}

export function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export type HomeModel = {
  account: Account;
  kyc: Kyc;
  verified: boolean;
  failing: boolean;
  data: HomeData;
  firstName: string;
  lastName: string;
  initials: string;
  items: ActionItem[];
  showUpdate: boolean;
  hide: boolean;
  toggleHide: () => void;
  loading: boolean;
  refreshing: boolean;
  refresh: () => void;
};

/** Everything Home shows, derived once for both layouts. Returns null until the customer may see Home. */
export function useHomeModel(): HomeModel | null {
  const allowed = useGuard(ROUTES.home);
  const account = useApp((s) => s.account);
  const kyc = useApp((s) => s.kyc);
  const scenario = useApp((s) => s.scenarios.home);
  const biometric = useApp((s) => s.scenarios.biometric);
  const passkey = useApp((s) => s.scenarios.passkey);
  const hide = useApp((s) => s.hideBalances);
  const setHide = useApp((s) => s.setHideBalances);
  // Gallery frames show either the loaded page or the skeleton, never a timed switch.
  const preview = !!usePreview();
  const seed = useSeed<{ loading: boolean }>();
  const [loading, setLoading] = useState(seed.loading ?? !preview);
  const [refreshing, setRefreshing] = useState(false);
  const { firstName, lastName, initials } = useCustomerName();

  // First load shows a skeleton rather than empty or zero values.
  useEffect(() => {
    if (preview) return;
    const t = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(t);
  }, [preview]);

  if (!allowed || !account) return null;

  const verified = kyc.status === "verified";
  const rejected = kyc.status === "rejected";

  const items: ActionItem[] = [];
  if (rejected)
    items.push({ key: "kyc", priority: "Required", Icon: ShieldAlert, title: "Finish your verification", body: "One detail couldn't be confirmed. Fix it to activate your wallet.", cta: "See what to do", onPress: () => router.push(ROUTES.status as never) });
  if (!account.biometrics && biometric !== "unavailable")
    items.push({ key: "bio", priority: "Recommended", Icon: ScanFace, title: `Unlock with ${BIOMETRIC_NAME}`, body: "Open the app without typing your unlock code.", cta: "Turn on", onPress: () => router.push(`${ROUTES.biometrics}?from=home` as never) });
  if (!account.passkey && passkey !== "unsupported")
    items.push({ key: "passkey", priority: "Recommended", Icon: KeyRound, title: "Add a passkey", body: "Log in on a new phone without your password.", cta: "Add", onPress: () => router.push(ROUTES.profileSecurity as never) });
  if (!account.mfaEnabled)
    items.push({ key: "mfa", priority: "Recommended", Icon: ShieldCheck, title: "Turn on two-step sign-in", body: "Add an authenticator app so only you can log in.", cta: "Set up", onPress: () => router.push(ROUTES.secure as never) });

  return {
    account,
    kyc,
    verified,
    failing: verified && scenario === "unavailable",
    data: verified && scenario !== "new" ? activeHome : newHome,
    firstName,
    lastName,
    initials,
    items,
    showUpdate: verified && scenario === "active",
    hide,
    toggleHide: () => setHide(!hide),
    loading,
    refreshing,
    refresh: () => {
      if (refreshing) return;
      setRefreshing(true);
      setTimeout(() => setRefreshing(false), 900);
    },
  };
}

export const QUICK_ACTIONS: { label: string; Icon: LucideIcon; main?: boolean }[] = [
  { label: "Add money", Icon: Plus, main: true },
  { label: "Send", Icon: ArrowUpRight },
  { label: "Withdraw", Icon: ArrowDownToLine },
  { label: "Bills", Icon: ReceiptText },
  { label: "Buy crypto", Icon: Bitcoin },
];

// ---------- Pieces ----------

/** Round header button (activity, notifications), glassy over the Home wash in dark mode. */
export function IconCircle({ children, label, onPress }: { children: ReactNode; label: string; onPress: () => void }) {
  const c = useColors();
  const dark = useApp((s) => s.theme) === "dark";
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => ({ width: 40, height: 40, borderRadius: 20, backgroundColor: dark ? "rgba(255,255,255,0.25)" : c.surface2, alignItems: "center", justifyContent: "center", opacity: pressed ? 0.7 : 1 })}
    >
      {children}
    </Pressable>
  );
}

export function QuickAction({ label, Icon, main, locked: isLocked }: { label: string; Icon: LucideIcon; main?: boolean; locked: boolean }) {
  const c = useColors();
  const bg = main && !isLocked ? c.primary : c.surface2;
  const fg = isLocked ? c.subtle : main ? c.onPrimary : c.text;
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
      <View style={{ width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center", backgroundColor: bg }}>
        <Icon size={24} color={fg} strokeWidth={2} />
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

export function SectionError({ what, onRetry }: { what: string; onRetry: () => void }) {
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
  card: CreditCard,
};

export function TxnRow({ txn, hide }: { txn: Txn; hide: boolean }) {
  const c = useColors();
  const Icon = TXN_ICON[txn.kind];
  const person = txn.kind === "transfer_in" || txn.kind === "transfer_out";
  const initials = txn.title.replace(/^Transfer to /, "").split(" ").map((w) => w[0]).join("").slice(0, 2);
  const amount = hide ? `₦${HIDDEN}` : `${txn.direction === "in" ? "+" : "−"}₦${money(txn.amount)}`;
  // Failed and reversed payments didn't take money in the end, so their amounts are struck through.
  const voided = txn.status === "Failed" || txn.status === "Reversed";
  const pill =
    txn.status === "Processing"
      ? { bg: c.warningSoft, fg: c.warning }
      : txn.status === "Failed"
        ? { bg: c.dangerSoft, fg: c.danger }
        : txn.status === "Reversed"
          ? { bg: c.infoSoft, fg: c.info }
          : null;
  return (
    <Pressable
      onPress={() => soon("Transaction details")}
      accessibilityRole="button"
      accessibilityLabel={`${txn.title}, ${txn.direction === "in" ? "received" : "sent"} ${hide ? "amount hidden" : amount}, ${txn.when}, ${txn.status}${txn.note ? `. ${txn.note}` : ""}`}
      style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12, opacity: pressed ? 0.6 : 1 })}
    >
      {person ? (
        <View>
          {txn.avatar ? (
            <View style={{ width: 40, height: 40, borderRadius: 20, overflow: "hidden", backgroundColor: "#dedfe4" }}>
              <Image source={txn.avatar} style={{ position: "absolute", top: 2, left: 0, width: 40, height: 57 }} resizeMode="cover" accessibilityIgnoresInvertColors />
            </View>
          ) : (
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: c.primarySoft, alignItems: "center", justifyContent: "center" }}>
              <Text variant="smallStrong" tone="primary">{initials}</Text>
            </View>
          )}
          <View style={{ position: "absolute", right: -2, bottom: -2, width: 18, height: 18, borderRadius: 9, backgroundColor: c.surface, alignItems: "center", justifyContent: "center" }}>
            <Icon size={12} color={txn.direction === "in" ? c.success : c.text} strokeWidth={2.6} />
          </View>
        </View>
      ) : txn.coin ? (
        // Coin logo with the direction the coin moved: bought/received = in.
        <View>
          <CoinLogo code={txn.coin} size={40} />
          <View style={{ position: "absolute", right: -2, bottom: -2, width: 18, height: 18, borderRadius: 9, backgroundColor: c.surface, alignItems: "center", justifyContent: "center" }}>
            {txn.direction === "out" ? <ArrowDownLeft size={12} color={c.success} strokeWidth={2.6} /> : <ArrowUpRight size={12} color={c.text} strokeWidth={2.6} />}
          </View>
        </View>
      ) : (
        <MerchantLogo name={txn.merchant ?? ""} size={40} fallback={Icon} />
      )}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text variant="smallStrong" numberOfLines={1}>{txn.title}</Text>
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
            color: voided ? c.subtle : txn.direction === "in" ? c.success : c.text,
            textDecorationLine: voided ? "line-through" : "none",
          }}
        >
          {amount}
        </Text>
        {/* The reversal note matters even with amounts hidden: it says the money came back. */}
        {txn.note && (!hide || txn.status === "Reversed") && (
          <Text variant="caption" style={{ color: txn.status === "Reversed" ? c.success : c.muted }}>{txn.note}</Text>
        )}
      </View>
    </Pressable>
  );
}

export type VerificationInfo = {
  /** 0 = email confirmed only (wallet not active); 1 = identity verified (wallet active). */
  level: 0 | 1;
  tone: Tone;
  Icon: LucideIcon;
  label: string;
  title: string;
  body: string;
  cta?: string;
};

/** Where the customer is with identity verification, in words for the banner, Profile and web Home. */
export function verificationInfo(kyc: Kyc): VerificationInfo {
  if (kyc.status === "verified")
    return { level: 1, tone: "success", Icon: BadgeCheck, label: "Verified", title: "Identity verified", body: `Your ${kyc.idType ?? "ID"}, selfie and address are confirmed. Your wallet is active.` };
  if (kyc.status === "pending")
    return { level: 0, tone: "warning", Icon: Clock3, label: "In review", title: "Verification in review", body: "We're checking your details. This usually takes up to 24 hours.", cta: "View status" };
  if (kyc.status === "rejected")
    return { level: 0, tone: "danger", Icon: ShieldAlert, label: "Unsuccessful", title: "Verification unsuccessful", body: "One detail couldn't be confirmed. See what to do next.", cta: "See what to do" };
  if (kyc.livenessLocked)
    return { level: 0, tone: "danger", Icon: ShieldAlert, label: "Paused", title: "Verification paused", body: "We couldn't confirm your selfie. See what to do next.", cta: "See what to do" };
  if (kyc.identity) {
    const done = [kyc.identityConfirmed, kyc.livenessPassed].filter(Boolean).length;
    return { level: 0, tone: "primary", Icon: ShieldCheck, label: "Not verified", title: "Continue verification", body: `Step ${done + 1} of 3. Pick up where you left off.`, cta: "Continue" };
  }
  return { level: 0, tone: "primary", Icon: ShieldCheck, label: "Not verified", title: "Verify your identity", body: "Activate your wallet in about 3 minutes with your BVN or NIN.", cta: "Start" };
}

/** Small Home banner pointing to identity verification. Hidden once verified. */
export function VerifyBanner({ kyc }: { kyc: Kyc }) {
  const c = useColors();
  if (kyc.status === "verified") return null;
  const v = verificationInfo(kyc);
  const soft = { primary: c.primarySoft, success: c.successSoft, warning: c.warningSoft, danger: c.dangerSoft }[v.tone];
  return (
    <Pressable
      onPress={() => router.push(kycNext(kyc) as never)}
      accessibilityRole="button"
      accessibilityLabel={`${v.title}. ${v.body}. ${v.cta ?? ""}`}
      style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, paddingHorizontal: 14, borderRadius: radius.lg, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, opacity: pressed ? 0.7 : 1 })}
    >
      <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: soft, alignItems: "center", justifyContent: "center" }}>
        <v.Icon size={18} color={c[v.tone]} />
      </View>
      <View style={{ flex: 1, gap: 1 }}>
        <Text variant="smallStrong">{v.title}</Text>
        <Text variant="caption" tone="muted">{v.body}</Text>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
        <Text variant="smallStrong" style={{ color: c[v.tone === "danger" ? "danger" : v.tone === "warning" ? "warning" : "primary"] }}>{v.cta}</Text>
        <ChevronRight size={16} color={c.subtle} />
      </View>
    </Pressable>
  );
}

export function Skeleton() {
  const c = useColors();
  const bar = (w: number | `${number}%`, h: number, r = 8) => <View style={{ width: w, height: h, borderRadius: r, backgroundColor: c.surface2 }} />;
  return (
    <View style={{ paddingHorizontal: 16 }} accessibilityLabel="Loading your account">
      {/* balance + crypto chip */}
      <View style={{ alignItems: "center", gap: 12, paddingTop: 34, paddingBottom: 16 }}>
        {bar(210, 46, 12)}
        {bar(170, 34, 17)}
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 30 }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <View key={i} style={{ width: 66, alignItems: "center", gap: 8 }}>
            {bar(56, 56, 28)}
            {bar(44, 10)}
          </View>
        ))}
      </View>
      <View style={{ marginTop: 30, gap: 14, backgroundColor: c.surface, borderRadius: radius.lg, padding: 16 }}>
        {bar(130, 14)}
        {[0, 1, 2].map((i) => (
          <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            {bar(40, 40, 20)}
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

// ---------- Composite sections (same content on phone and desktop) ----------

export function ActivityPanel({ m, limit = 5 }: { m: HomeModel; limit?: number }) {
  const c = useColors();
  return (
    <View style={{ backgroundColor: c.surface, borderRadius: radius.lg, overflow: "hidden", paddingBottom: 4 }}>
      {/* Header sits inside the card */}
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: 16, paddingBottom: 6 }}>
        <Text variant="bodyStrong" style={{ flex: 1, fontSize: 17 }} accessibilityRole="header">Recent activity</Text>
        {m.data.activity.length > 0 && !m.failing && <LinkText onPress={() => router.push(ROUTES.activity as never)}>See all</LinkText>}
      </View>
      {m.failing ? (
        <SectionError what="your recent activity" onRetry={m.refresh} />
      ) : m.data.activity.length ? (
        m.data.activity.slice(0, limit).map((t) => <TxnRow key={t.id} txn={t} hide={m.hide} />)
      ) : (
        <View style={{ alignItems: "center", paddingHorizontal: 24, paddingTop: 8, paddingBottom: 20, gap: 6 }}>
          <StatusIcon icon={ReceiptText} tone="primary" size={64} />
          <Text variant="bodyStrong" style={{ marginTop: 4 }}>No activity yet</Text>
          <Text variant="small" tone="muted" center>
            {m.verified ? "Add money to make your first payment, transfer or trade." : "Your payments and transfers will show up here once your wallet is active."}
          </Text>
          {m.verified && <Button title="Add money" size="sm" icon={Plus} onPress={() => soon("Add money")} style={{ marginTop: 10, alignSelf: "center" }} />}
        </View>
      )}
    </View>
  );
}

export function signOut() {
  useApp.getState().signOut();
  router.replace("/login");
}

export function startAgain() {
  useApp.getState().resetAll();
  router.replace("/");
}

// ---------- Home hero and notices (Figma "Home · Verified"; phone and desktop) ----------

/** Indigo wash behind the top of Home: navy into the page, plus a soft glow. */
export function HeroWash() {
  const c = useColors();
  const dark = useApp((st) => st.theme) === "dark";
  return (
    <>
      <LinearGradient pointerEvents="none" colors={dark ? [c.heroTop, c.bg] : [c.primarySoft, c.bg]} style={{ position: "absolute", top: 0, left: 0, right: 0, height: 420 }} />
      <LinearGradient pointerEvents="none" colors={["rgba(102,124,255,0.26)", "rgba(102,124,255,0)"]} style={{ position: "absolute", top: 0, left: 0, right: 0, height: 300, opacity: dark ? 1 : 0.5 }} />
    </>
  );
}

/**
 * Centred naira balance, clearly labelled: available balance, money on hold, and the
 * indicative crypto value. Before the wallet is active there's no balance figure at all.
 */
export function HeroBalance({ m, large }: { m: HomeModel; large?: boolean }) {
  const c = useColors();
  const dark = useApp((st) => st.theme) === "dark";
  const naira = m.failing ? null : m.data.naira;
  const crypto = m.failing ? undefined : m.data.cryptoNgn;
  const whole = money(naira ?? 0).split(".")[0];

  if (!m.verified) {
    const pending = m.kyc.status === "pending";
    return (
      <View style={{ alignItems: "center", gap: 10, paddingTop: large ? 40 : 28, paddingBottom: 8, paddingHorizontal: 28 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill, backgroundColor: dark ? "rgba(255,255,255,0.12)" : c.surface, borderWidth: 1, borderColor: dark ? "rgba(255,255,255,0.14)" : c.border }}>
          {pending ? <Clock3 size={13} color={c.warning} /> : <Lock size={13} color={c.muted} />}
          <Text variant="caption" style={{ color: pending ? c.warning : c.muted, fontFamily: fonts.semibold }}>Naira wallet</Text>
        </View>
        <Text variant="title" center accessibilityRole="header">{pending ? "Activation in review" : "Wallet not active yet"}</Text>
        <Text variant="small" tone="muted" center style={{ maxWidth: 300 }}>
          {pending
            ? "We're checking your details. Adding money, transfers and crypto open as soon as you're verified."
            : "Verify your identity to activate your wallet, get your account number and start adding money."}
        </Text>
      </View>
    );
  }

  return (
    <View style={{ alignItems: "center", gap: 8, paddingTop: large ? 40 : 28, paddingBottom: 16, paddingHorizontal: 20 }}>
      <Text variant={large ? "small" : "caption"} tone="muted">Available balance</Text>
      {naira === null ? (
        <View style={{ alignItems: "center", gap: 10, paddingTop: 6 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <CloudOff size={22} color={c.muted} />
            <Text variant="heading">Balance unavailable</Text>
          </View>
          <Button title="Retry" size="sm" variant="secondary" icon={RefreshCw} onPress={m.refresh} />
        </View>
      ) : (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text
            style={{ fontFamily: fonts.extrabold, fontSize: large ? 64 : 46, lineHeight: large ? 74 : 54, letterSpacing: large ? -2.4 : -1.8, color: c.text }}
            accessibilityLabel={m.hide ? "Available balance hidden" : `Available balance ${whole} naira`}
          >
            {m.hide ? `₦${HIDDEN}` : `₦${whole}`}
          </Text>
          <Pressable onPress={m.toggleHide} hitSlop={10} accessibilityRole="button" accessibilityLabel={m.hide ? "Show balances" : "Hide balances"}>
            {m.hide ? <EyeOff size={large ? 24 : 20} color={c.text} /> : <Eye size={large ? 24 : 20} color={c.text} />}
          </Pressable>
        </View>
      )}
      {naira !== null && m.data.held > 0 && (
        <Pressable
          onPress={() => explainHeld(m.data.held)}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel={`${m.hide ? "Some money" : `${money(m.data.held)} naira`} on hold for a payment in progress`}
          style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: -2, marginBottom: 4 }}
        >
          <Hourglass size={13} color={c.warning} />
          <Text variant="caption" tone="muted">
            <Text variant="caption" style={{ color: c.text, fontFamily: fonts.semibold }}>{`₦${m.hide ? HIDDEN : money(m.data.held)}`}</Text> on hold · payment in progress
          </Text>
        </Pressable>
      )}
      <Pressable
        onPress={() => (m.verified ? soon("Crypto") : locked())}
        accessibilityRole="button"
        accessibilityLabel={
          crypto === undefined
            ? "Crypto value unavailable"
            : crypto === null
              ? "Buy your first crypto"
              : `Crypto, about ${m.hide ? "hidden" : `${money(crypto, 0)} naira`}, indicative, updated ${m.data.pricedAt}`
        }
        style={({ pressed }) => ({
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          paddingLeft: 8,
          paddingRight: 12,
          paddingVertical: 6,
          borderRadius: radius.pill,
          backgroundColor: dark ? "rgba(255,255,255,0.12)" : c.surface,
          borderWidth: 1,
          borderColor: dark ? "rgba(255,255,255,0.14)" : c.border,
          opacity: pressed ? 0.7 : 1,
        })}
      >
        {crypto === undefined ? (
          <Bitcoin size={16} color={c.muted} />
        ) : (
          <CoinStack codes={crypto === null ? ["BTC", "ETH", "USDT", "USDC"] : ["BTC", "USDT"]} size={22} ring={dark ? "#2a2a31" : c.surface} />
        )}
        <Text variant="smallStrong" style={{ color: c.text }}>
          {crypto === undefined ? "Crypto value unavailable" : crypto === null ? "Buy your first crypto" : `Crypto ≈ ₦${m.hide ? HIDDEN : money(crypto, 0)}`}
        </Text>
        {typeof crypto === "number" && <Text variant="caption" tone="muted">Indicative</Text>}
      </Pressable>
    </View>
  );
}

type NoticeTone = "primary" | "warning" | "danger";

/** Action-centre / update notice: duotone status icon, tag, title, body and a chevron. */
export function NoticeCard({ tone, Icon, tag, title, body, onPress }: { tone: NoticeTone; Icon: LucideIcon; tag: string; title: string; body: string; onPress: () => void }) {
  const c = useColors();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${tag}. ${title}. ${body}`}
      style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 14, padding: 14, borderRadius: radius.lg, backgroundColor: c.surface, opacity: pressed ? 0.7 : 1 })}
    >
      <StatusIcon icon={Icon} tone={tone} size={52} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="caption" style={{ color: c[tone], letterSpacing: 0.6 }}>{tag.toUpperCase()}</Text>
        <Text variant="smallStrong">{title}</Text>
        <Text variant="small" tone="muted">{body}</Text>
      </View>
      <ChevronRight size={18} color={c.subtle} />
    </Pressable>
  );
}

/** The planned-maintenance update shown on Home. */
export function UpdateNotice() {
  return <NoticeCard tone="primary" Icon={Megaphone} tag="Update" title="Card top-ups pause Sunday, 2–4 AM" body="Planned maintenance. Bank transfers keep working as normal." onPress={() => soon("This update")} />;
}

/** The highlighted recommendation tile (e.g. turn on two-step sign-in). */
export function RecommendedTile({ item }: { item: ActionItem }) {
  const c = useColors();
  const dark = useApp((st) => st.theme) === "dark";
  return (
    <Pressable
      onPress={item.onPress}
      accessibilityRole="button"
      accessibilityLabel={`Recommended. ${item.title}. ${item.cta}`}
      style={({ pressed }) => ({ borderRadius: 22, overflow: "hidden", opacity: pressed ? 0.8 : 1 })}
    >
      <LinearGradient
        colors={dark ? ["#2a3170", "#111114"] : ["#e3e7ff", "#ffffff"]}
        locations={[0.13, 0.68]}
        start={{ x: 0.4, y: 0 }}
        end={{ x: 0.6, y: 1 }}
        style={{ padding: 14, gap: 6 }}
      >
        <StatusIcon icon={item.Icon} tone="primary" size={40} />
        <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 6 }}>
          <View style={{ flex: 1, gap: 6 }}>
            <Text variant="caption" style={{ color: c.primary, letterSpacing: 0.4 }}>{item.priority.toUpperCase()}</Text>
            <Text variant="smallStrong" style={{ fontSize: 15 }}>{item.title}</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Text variant="smallStrong" tone="primary">{item.cta}</Text>
            <ChevronRight size={16} color={c.primary} />
          </View>
        </View>
      </LinearGradient>
    </Pressable>
  );
}
