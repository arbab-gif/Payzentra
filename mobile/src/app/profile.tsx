import * as Clipboard from "expo-clipboard";
import { router } from "expo-router";
import {
  Check,
  ChevronRight,
  Copy,
  History,
  KeyRound,
  LifeBuoy,
  LockKeyhole,
  LogOut,
  Moon,
  RotateCcw,
  ScanFace,
  ShieldCheck,
  RectangleEllipsis,
  Sun,
  WalletCards,
  type LucideIcon,
} from "lucide-react-native";
import { useState, type ReactNode } from "react";
import { ActivityIndicator, Pressable, Switch, View } from "react-native";
import { AppPage, Group } from "@/components/AppPage";
import { BIOMETRIC_NAME, DevicePrompt } from "@/components/DevicePrompt";
import { ACCOUNT_NO, signOut, soon, startAgain, useCustomerName, verificationInfo } from "@/components/home/parts";
import { Loading } from "@/components/Screen";
import { Alert, Button, haptic, Text } from "@/components/ui";
import { createPasskey, enableBiometrics, removePasskey, type PromptOutcome } from "@/lib/api";
import { kycNext, ROUTES, useApp } from "@/lib/store";
import { fonts, radius, useColors } from "@/lib/theme";
import { toast } from "@/lib/toast";
import { useGuard } from "@/lib/useGuard";

/**
 * Profile and settings, opened from the avatar on Home: who you are, your
 * verification level, how you sign in and unlock, and Activity.
 */
export default function Profile() {
  const allowed = useGuard(ROUTES.profile);
  const account = useApp((s) => s.account);
  if (!allowed || !account) return <Loading />;
  return (
    <AppPage page="profile" title="Profile">
      <Identity />
      <VerificationLevel />
      <Security />
      <General />
      <View style={{ gap: 8, marginTop: 4 }}>
        <Button title="Log out" variant="secondary" icon={LogOut} onPress={signOut} />
        <Text variant="caption" tone="muted" center style={{ marginHorizontal: 16 }}>
          Logging out removes your unlock code and {BIOMETRIC_NAME} from this phone. Next time, log in with your password or passkey.
        </Text>
        <Button title="Start again (demo)" variant="ghost" icon={RotateCcw} onPress={startAgain} style={{ marginTop: 8 }} />
      </View>
    </AppPage>
  );
}

function Identity() {
  const c = useColors();
  const who = useCustomerName();
  const kyc = useApp((s) => s.kyc);
  const v = verificationInfo(kyc);
  const soft = { primary: c.primarySoft, success: c.successSoft, warning: c.warningSoft, danger: c.dangerSoft }[v.tone];
  return (
    <View style={{ alignItems: "center", gap: 6, paddingTop: 8, paddingBottom: 24 }}>
      <View style={{ width: 76, height: 76, borderRadius: 38, backgroundColor: c.primary, alignItems: "center", justifyContent: "center" }}>
        <Text variant="title" style={{ color: c.onPrimary }}>{who.initials}</Text>
      </View>
      <Text variant="heading" center style={{ marginTop: 8 }}>{who.name}</Text>
      <Text variant="small" tone="muted" center>{who.email}</Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: soft }}>
        <v.Icon size={13} color={c[v.tone]} />
        <Text variant="caption" style={{ color: c[v.tone], fontFamily: fonts.semibold }}>{v.label}</Text>
      </View>
    </View>
  );
}

/** Verification level: what's confirmed so far and what the next step is. */
function VerificationLevel() {
  const c = useColors();
  const kyc = useApp((s) => s.kyc);
  const v = verificationInfo(kyc);
  const identityState =
    kyc.status === "verified"
      ? { text: "Verified", color: c.success, done: true }
      : kyc.status === "pending"
        ? { text: "In review", color: c.warning, done: false }
        : kyc.status === "rejected" || kyc.livenessLocked
          ? { text: "Unsuccessful", color: c.danger, done: false }
          : kyc.identity
            ? { text: "In progress", color: c.primary, done: false }
            : { text: "Not started", color: c.muted, done: false };

  return (
    <Group title="Verification level">
      <View style={{ padding: 16, gap: 14 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Text variant="bodyStrong" style={{ flex: 1 }}>Level {v.level} of 1</Text>
          {/* Segmented meter */}
          <View style={{ flexDirection: "row", gap: 4, width: 96 }} accessible accessibilityLabel={`Verification level ${v.level} of 1`}>
            {[0, 1].map((i) => (
              <View key={i} style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: i <= v.level ? (v.level === 1 ? c.success : c.primary) : c.surface2 }} />
            ))}
          </View>
        </View>
        <LevelStep done label="Email address" detail="Confirmed with a one-time code" state={{ text: "Done", color: c.success }} />
        <LevelStep
          done={identityState.done}
          label="Identity"
          detail={kyc.idType ? `${kyc.idType}, selfie and home address` : "BVN or NIN, selfie and home address"}
          state={identityState}
        />
        <Text variant="small" tone="muted">
          {v.level === 1
            ? "Your wallet is active. Adding money, transfers, bills and crypto are all open to you."
            : "Level 1 activates your wallet: account number, adding money, transfers, bills and crypto."}
        </Text>
        {v.cta && <Button title={v.cta === "Start" ? "Verify your identity" : v.cta} size="sm" onPress={() => router.push(kycNext(kyc) as never)} style={{ alignSelf: "flex-start" }} />}
      </View>
      {kyc.status === "verified" && (
        <Pressable
          onPress={async () => {
            await Clipboard.setStringAsync(ACCOUNT_NO);
            haptic("success");
            toast({ tone: "success", title: "Account number copied" });
          }}
          accessibilityRole="button"
          accessibilityLabel={`Wallet account number ${ACCOUNT_NO.split("").join(" ")}. Copy`}
          style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderTopWidth: 1, borderTopColor: c.border, opacity: pressed ? 0.7 : 1 })}
        >
          <RowIcon Icon={WalletCards} />
          <View style={{ flex: 1 }}>
            <Text variant="smallStrong">Wallet account number</Text>
            <Text variant="small" tone="muted">{`${ACCOUNT_NO.slice(0, 3)} ${ACCOUNT_NO.slice(3, 6)} ${ACCOUNT_NO.slice(6)} · Payzentra`}</Text>
          </View>
          <Copy size={16} color={c.muted} />
        </Pressable>
      )}
    </Group>
  );
}

function LevelStep({ done, label, detail, state }: { done: boolean; label: string; detail: string; state: { text: string; color: string } }) {
  const c = useColors();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
      <View style={{ width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: done ? c.success : c.surface2 }}>
        {done ? <Check size={14} color="#ffffff" strokeWidth={3} /> : <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: state.color }} />}
      </View>
      <View style={{ flex: 1 }}>
        <Text variant="smallStrong">{label}</Text>
        <Text variant="caption" tone="muted">{detail}</Text>
      </View>
      <Text variant="caption" style={{ color: state.color, fontFamily: fonts.semibold }}>{state.text}</Text>
    </View>
  );
}

function Security() {
  const c = useColors();
  const account = useApp((s) => s.account)!;
  const biometric = useApp((s) => s.scenarios.biometric);
  const passkeyScenario = useApp((s) => s.scenarios.passkey);
  const [passkeyPrompt, setPasskeyPrompt] = useState(false);
  const [busy, setBusy] = useState<null | "bio" | "passkey">(null);
  const [note, setNote] = useState<{ tone: "warning" | "info"; title: string; body: string } | null>(null);

  const toggleBiometrics = async (on: boolean) => {
    setNote(null);
    if (on) return router.push(`${ROUTES.biometrics}?from=profile` as never);
    setBusy("bio");
    await enableBiometrics(false);
    setBusy(null);
    toast({ tone: "info", title: `${BIOMETRIC_NAME} is off`, body: "You'll unlock with your 6-digit code." });
  };

  const finishPasskey = async () => {
    setBusy("passkey");
    const res = await createPasskey();
    setBusy(null);
    if (res.ok) toast({ tone: "success", title: "Passkey added", body: "Next time you log in on a new phone, use your passkey instead of your password." });
    else setNote({ tone: "warning", title: "Passkey not added", body: res.message });
  };

  return (
    <>
      <Group title="Sign-in and security" footer="Your unlock code opens the app on this phone. Your transaction PIN is separate: it approves payments and is set when you make your first one.">
        <Row
          Icon={LockKeyhole}
          title="Unlock code"
          detail="6 digits · opens the app on this phone"
          right={<Text variant="smallStrong" tone="primary">Change</Text>}
          onPress={() => router.push(`${ROUTES.setUnlockCode}?mode=change` as never)}
        />
        <Row
          Icon={ScanFace}
          title={`Unlock with ${BIOMETRIC_NAME}`}
          detail={biometric === "unavailable" ? `${BIOMETRIC_NAME} isn't set up on this phone` : account.biometrics ? "On · you can still use your code" : "Off"}
          right={
            busy === "bio" ? (
              <ActivityIndicator color={c.primary} />
            ) : (
              <Switch
                value={account.biometrics}
                disabled={biometric === "unavailable"}
                onValueChange={toggleBiometrics}
                trackColor={{ false: c.surface2, true: c.primary }}
                thumbColor="#ffffff"
                accessibilityLabel={`Unlock with ${BIOMETRIC_NAME}`}
              />
            )
          }
        />
        <Row
          Icon={KeyRound}
          title="Passkey"
          detail={
            passkeyScenario === "unsupported" && !account.passkey
              ? "This device doesn't support passkeys"
              : account.passkey
                ? "Added · log in without your password"
                : "Log in on a new phone without your password"
          }
          right={
            busy === "passkey" ? (
              <ActivityIndicator color={c.primary} />
            ) : account.passkey ? (
              <Text variant="smallStrong" style={{ color: c.danger }}>Remove</Text>
            ) : passkeyScenario === "unsupported" ? null : (
              <Text variant="smallStrong" tone="primary">Add</Text>
            )
          }
          onPress={
            account.passkey
              ? async () => {
                  setNote(null);
                  setBusy("passkey");
                  await removePasskey();
                  setBusy(null);
                  toast({ tone: "info", title: "Passkey removed", body: "Log in with your email and password next time." });
                }
              : passkeyScenario === "unsupported"
                ? undefined
                : () => {
                    setNote(null);
                    setPasskeyPrompt(true);
                  }
          }
        />
        <Row
          Icon={ShieldCheck}
          title="Two-step sign-in"
          detail={account.mfaEnabled ? "On · authenticator app" : "Add an authenticator app"}
          right={account.mfaEnabled ? <Text variant="smallStrong" style={{ color: c.success }}>On</Text> : <Text variant="smallStrong" tone="primary">Set up</Text>}
          onPress={account.mfaEnabled ? undefined : () => router.push(ROUTES.secure as never)}
        />
        <Row Icon={RectangleEllipsis} title="Transaction PIN" detail="4 digits · approves payments" right={<Text variant="small" tone="muted">Not set</Text>} onPress={() => soon("Transaction PIN")} />
      </Group>
      {note && (
        <View style={{ marginTop: -12, marginBottom: 24 }}>
          <Alert tone={note.tone} title={note.title}>{note.body}</Alert>
        </View>
      )}
      <DevicePrompt
        open={passkeyPrompt}
        kind="passkey"
        title="Create a passkey"
        subtitle={`Save a passkey for ${account.email} on this device.`}
        outcome={(): PromptOutcome => (useApp.getState().scenarios.passkey === "fail" ? "fail" : "success")}
        onResult={(r) => {
          setPasskeyPrompt(false);
          if (r === "success") finishPasskey();
          else if (r === "cancel") setNote({ tone: "info", title: "Passkey not added", body: "You cancelled the request. You can add one any time." });
          else setNote({ tone: "warning", title: "Passkey not added", body: "We couldn't create a passkey. Keep using your password, and try again later." });
        }}
      />
    </>
  );
}

function General() {
  const c = useColors();
  const theme = useApp((s) => s.theme);
  const setTheme = useApp((s) => s.setTheme);
  return (
    <Group title="General">
      <Row Icon={History} title="Activity" detail="All your payments, transfers and trades" onPress={() => router.push(ROUTES.activity as never)} />
      <Row
        Icon={theme === "dark" ? Moon : Sun}
        title="Appearance"
        detail={theme === "dark" ? "Dark" : "Light"}
        right={
          <View style={{ flexDirection: "row", padding: 3, borderRadius: radius.pill, backgroundColor: c.surface2 }} accessibilityRole="radiogroup">
            {(["light", "dark"] as const).map((t) => {
              const on = theme === t;
              return (
                <Pressable
                  key={t}
                  onPress={() => setTheme(t)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: on }}
                  accessibilityLabel={t === "dark" ? "Dark" : "Light"}
                  style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: on ? c.surface : "transparent" }}
                >
                  {t === "dark" ? <Moon size={15} color={on ? c.text : c.muted} /> : <Sun size={15} color={on ? c.text : c.muted} />}
                </Pressable>
              );
            })}
          </View>
        }
      />
      <Row Icon={LifeBuoy} title="Help and support" detail="Chat with us or read the FAQs" onPress={() => soon("Help and support")} />
    </Group>
  );
}

function RowIcon({ Icon }: { Icon: LucideIcon }) {
  const c = useColors();
  return (
    <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: c.surface2, alignItems: "center", justifyContent: "center" }}>
      <Icon size={18} color={c.text} />
    </View>
  );
}

function Row({ Icon, title, detail, right, onPress }: { Icon: LucideIcon; title: string; detail?: string; right?: ReactNode; onPress?: () => void }) {
  const c = useColors();
  const content = (
    <>
      <RowIcon Icon={Icon} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text variant="smallStrong">{title}</Text>
        {detail && <Text variant="small" tone="muted">{detail}</Text>}
      </View>
      {right}
      {onPress && !right && <ChevronRight size={18} color={c.subtle} />}
    </>
  );
  const style = { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderTopWidth: 1, borderTopColor: c.border, marginTop: -1 } as const;
  if (!onPress) return <View style={style}>{content}</View>;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${title}. ${detail ?? ""}`} style={({ pressed }) => ({ ...style, opacity: pressed ? 0.7 : 1 })}>
      {content}
    </Pressable>
  );
}
