import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { LogOut, MessagesSquare, RotateCcw } from "lucide-react-native";
import { Pressable, View } from "react-native";
import { AppPage } from "@/components/AppPage";
import { BIOMETRIC_NAME } from "@/components/DevicePrompt";
import { signOut, soon, startAgain, useCustomerName, verificationInfo } from "@/components/home/parts";
import { HubCard } from "@/components/ProfileRows";
import { Loading } from "@/components/Screen";
import { Button, Text } from "@/components/ui";
import { useWebLayout } from "@/lib/layout";
import { kycNext, ROUTES, useApp } from "@/lib/store";
import { radius, useColors } from "@/lib/theme";
import { useGuard } from "@/lib/useGuard";

const AREAS: { title: string; detail: string; to: string }[] = [
  { title: "Account", detail: "Personal details, verification level, account number, limits, statements", to: ROUTES.profileAccount },
  { title: "Security", detail: `Unlock code, ${BIOMETRIC_NAME}, passkey, two-step sign-in, transaction PIN`, to: ROUTES.profileSecurity },
  { title: "Preferences", detail: "Appearance, hide balances, notifications", to: ROUTES.profilePreferences },
  { title: "Activity", detail: "All your payments, transfers, bills and trades", to: ROUTES.activity },
  { title: "Report a problem", detail: "Tell us what went wrong so we can fix it", to: "" },
  { title: "About Payzentra", detail: "FAQs, terms, privacy policy, contact us", to: "" },
];

/**
 * Profile and settings, opened from the avatar on Home: who you are, then every
 * settings area as its own card. Log out sits at the end.
 */
export default function Profile() {
  const allowed = useGuard(ROUTES.profile);
  const account = useApp((s) => s.account);
  const web = useWebLayout();
  if (!allowed || !account) return <Loading />;
  return (
    <AppPage page="profile" close>
      <Identity />
      <View style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}>
        <VerificationCard />
        <HelpCard />
      </View>
      <View style={{ flexDirection: web ? "row" : "column", flexWrap: "wrap", gap: 12 }}>
        {AREAS.map((a) => (
          <HubCard
            key={a.title}
            title={a.title}
            detail={a.detail}
            onPress={() => (a.to ? router.push(a.to as never) : soon(a.title))}
            style={web ? { flexBasis: "45%", flexGrow: 1 } : undefined}
          />
        ))}
      </View>
      <View style={{ gap: 8, marginTop: 28 }}>
        <Button title="Log out" variant="secondary" icon={LogOut} onPress={signOut} />
        <Text variant="caption" tone="muted" center style={{ marginHorizontal: 16 }}>
          Your unlock code and {BIOMETRIC_NAME} stay on this device. Next time, log in with your password.
        </Text>
        <Button title="Start again (demo)" variant="ghost" icon={RotateCcw} onPress={startAgain} style={{ marginTop: 8 }} />
      </View>
    </AppPage>
  );
}

function Identity() {
  const c = useColors();
  const who = useCustomerName();
  return (
    <View style={{ alignItems: "center", gap: 12, paddingBottom: 28 }}>
      <View style={{ width: 88, height: 88, borderRadius: 44, overflow: "hidden", alignItems: "center", justifyContent: "center" }}>
        <LinearGradient colors={["#a3b0ff", "#667cff"]} style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }} />
        <Text variant="title" style={{ color: "#ffffff" }}>{who.initials}</Text>
      </View>
      <Text variant="title" center accessibilityRole="header">{who.name}</Text>
      <View style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: radius.pill, backgroundColor: c.surface2 }}>
        <Text variant="smallStrong">{who.email}</Text>
      </View>
    </View>
  );
}

/** Where verification stands, and the way into it. */
function VerificationCard() {
  const kyc = useApp((s) => s.kyc);
  const v = verificationInfo(kyc);
  const verified = kyc.status === "verified";
  const copy = verified
    ? { title: "Identity verified", body: "Level 1 · wallet active" }
    : kyc.status === "pending"
      ? { title: "Verification in review", body: "Usually within 24 hours" }
      : kyc.status === "rejected" || kyc.livenessLocked
        ? { title: "Verification needs you", body: "See what to do next" }
        : kyc.identity
          ? { title: "Finish verifying", body: "Pick up where you left off" }
          : { title: "Verify your identity", body: "Activate your wallet" };
  return (
    <Pressable
      onPress={() => router.push((verified ? ROUTES.profileAccount : kycNext(kyc)) as never)}
      accessibilityRole="button"
      accessibilityLabel={`${copy.title}. ${copy.body}`}
      style={({ pressed }) => ({ flex: 1, height: 172, borderRadius: 24, overflow: "hidden", opacity: pressed ? 0.85 : 1 })}
    >
      <LinearGradient colors={["#8a9bff", "#667cff", "#3b3fd8"]} locations={[0, 0.45, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, padding: 16, justifyContent: "space-between" }}>
        <Rings color="rgba(255,255,255,0.22)" />
        <v.Icon size={30} color="#ffffff" />
        <View style={{ gap: 2 }}>
          <Text variant="bodyStrong" style={{ color: "#ffffff", fontSize: 17, lineHeight: 22 }}>{copy.title}</Text>
          <Text variant="small" style={{ color: "rgba(255,255,255,0.85)" }}>{copy.body}</Text>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

function HelpCard() {
  const c = useColors();
  return (
    <Pressable
      onPress={() => soon("Support chat")}
      accessibilityRole="button"
      accessibilityLabel="Need help? Chat with us"
      style={({ pressed }) => ({ flex: 1, height: 172, borderRadius: 24, overflow: "hidden", padding: 16, justifyContent: "space-between", backgroundColor: c.inverse, opacity: pressed ? 0.85 : 1 })}
    >
      <Rings color={c.onInverse} opacity={0.12} />
      <MessagesSquare size={30} color={c.onInverse} />
      <View style={{ gap: 2 }}>
        <Text variant="bodyStrong" style={{ color: c.onInverse, fontSize: 17, lineHeight: 22 }}>Need help?</Text>
        <Text variant="small" style={{ color: c.onInverse, opacity: 0.75 }}>Chat with us</Text>
      </View>
    </Pressable>
  );
}

/** Decorative rings in the card's top-right corner. */
function Rings({ color, opacity = 1 }: { color: string; opacity?: number }) {
  return (
    <View pointerEvents="none" style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0, opacity }}>
      <View style={{ position: "absolute", right: -56, top: -56, width: 170, height: 170, borderRadius: 85, borderWidth: 1, borderColor: color }} />
      <View style={{ position: "absolute", right: -22, top: -22, width: 104, height: 104, borderRadius: 52, borderWidth: 1, borderColor: color }} />
    </View>
  );
}
