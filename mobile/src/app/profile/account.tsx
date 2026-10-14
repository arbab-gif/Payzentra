import * as Clipboard from "expo-clipboard";
import { router } from "expo-router";
import { Cake, Check, Copy, FileText, Gauge, Mail, Smartphone, UserRound, UserX, WalletCards } from "lucide-react-native";
import { View } from "react-native";
import { AppPage, Group } from "@/components/AppPage";
import { ACCOUNT_NO, soon, verificationInfo } from "@/components/home/parts";
import { Row } from "@/components/ProfileRows";
import { Loading } from "@/components/Screen";
import { Button, haptic, Text } from "@/components/ui";
import { kycNext, ROUTES, useApp } from "@/lib/store";
import { fonts, useColors } from "@/lib/theme";
import { toast } from "@/lib/toast";
import { useGuard } from "@/lib/useGuard";

const LATER = "Added when you verify";

/** Profile → Account: who the customer is, their verification level and wallet details. */
export default function ProfileAccount() {
  const c = useColors();
  const allowed = useGuard(ROUTES.profileAccount);
  const account = useApp((s) => s.account);
  const kyc = useApp((s) => s.kyc);
  if (!allowed || !account) return <Loading />;

  const id = kyc.identityConfirmed ? kyc.identity : null;
  const verified = kyc.status === "verified";
  const source = kyc.idType === "NIN" ? "NIMC" : "your bank";

  return (
    <AppPage page="profile" title="Account" parent={ROUTES.profile}>
      <Group
        title="Personal details"
        footer={id ? `Confirmed from your ${kyc.idType}. To correct a detail, update it with ${source} and verify again.` : "Your legal name, date of birth and phone come from your BVN or NIN when you verify."}
      >
        <Row Icon={UserRound} title="Legal name" detail={id ? [id.firstName, id.middleName, id.lastName].filter(Boolean).join(" ") : LATER} />
        <Row Icon={Cake} title="Date of birth" detail={id?.dob ?? LATER} />
        <Row Icon={Mail} title="Email" detail={account.email} right={<Text variant="smallStrong" style={{ color: c.success }}>Confirmed</Text>} />
        <Row Icon={Smartphone} title="Phone on record" detail={id?.phoneMasked ?? LATER} />
      </Group>

      <VerificationLevel />

      <Group title="Wallet">
        {verified && (
          <Row
            Icon={WalletCards}
            title="Wallet account number"
            detail={`${ACCOUNT_NO.slice(0, 3)} ${ACCOUNT_NO.slice(3, 6)} ${ACCOUNT_NO.slice(6)} · Payzentra`}
            right={<Copy size={16} color={c.muted} />}
            onPress={async () => {
              await Clipboard.setStringAsync(ACCOUNT_NO);
              haptic("success");
              toast({ tone: "success", title: "Account number copied" });
            }}
          />
        )}
        <Row Icon={Gauge} title="Account limits" detail={verified ? "Level 1 daily and monthly limits" : "Available once you're verified"} onPress={() => soon("Account limits")} />
        <Row Icon={FileText} title="Statements" detail="Monthly statements as PDF" onPress={() => soon("Statements")} />
      </Group>

      <Group>
        <Row Icon={UserX} title="Close account" detail="Permanently close your Payzentra account" onPress={() => soon("Closing your account")} danger />
      </Group>
    </AppPage>
  );
}

/** Verification level: what's confirmed so far and the next step. */
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
