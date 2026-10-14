import * as Clipboard from "expo-clipboard";
import { router } from "expo-router";
import { Check, CheckCircle2, Copy, Share2 } from "lucide-react-native";
import { useState } from "react";
import { Share, View } from "react-native";
import { Loading, PageTitle, Screen } from "@/components/Screen";
import { Alert, Button, Card, Checkbox, Text } from "@/components/ui";
import { useSeed } from "@/lib/preview";
import { nextRoute, ROUTES, useApp } from "@/lib/store";
import { fonts, useColors } from "@/lib/theme";
import { useGuard } from "@/lib/useGuard";

const NO_CODES: string[] = [];

export default function RecoveryCodes() {
  const c = useColors();
  const codes = useApp((s) => s.account?.recoveryCodes ?? NO_CODES);
  const email = useApp((s) => s.account?.email ?? "");
  const setAccount = useApp((s) => s.setAccount);
  const seed = useSeed<{ saved: boolean; tried: boolean }>();
  const [saved, setSaved] = useState(seed.saved ?? false);
  const [tried, setTried] = useState(seed.tried ?? false);
  const [copied, setCopied] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const allowed = useGuard(ROUTES.recoveryCodes, leaving);

  if (!allowed) return <Loading />;

  const text = `Payzentra recovery codes for ${email}\nEach code can be used once.\n\n${codes.join("\n")}\n`;

  const next = () => {
    setTried(true);
    if (!saved) return;
    setLeaving(true);
    setAccount({ recoveryCodesSaved: true });
    router.replace(nextRoute(useApp.getState()) as never);
  };

  return (
    <Screen footer={<Button title="Done" onPress={next} />}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <CheckCircle2 size={20} color={c.success} />
        <Text variant="smallStrong" tone="success">Two-step sign-in is on</Text>
      </View>
      <PageTitle
        title="Save your recovery codes"
        subtitle="If you lose your phone, use one of these codes to sign in. Each code works once. Store them somewhere safe — not only on this phone."
      />
      <View style={{ gap: 16 }}>
        <Card style={{ gap: 14 }}>
          <View style={{ flexDirection: "row", flexWrap: "wrap", rowGap: 12 }} accessibilityLabel="Recovery codes">
            {codes.map((code, i) => (
              <View key={code} style={{ width: "50%", flexDirection: "row", gap: 8 }}>
                <Text variant="small" tone="subtle" style={{ width: 22, textAlign: "right" }}>{i + 1}.</Text>
                <Text selectable style={{ fontFamily: fonts.semibold, fontSize: 15, letterSpacing: 1, color: c.text }}>{code}</Text>
              </View>
            ))}
          </View>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <Button
              size="md"
              variant="secondary"
              title={copied ? "Copied" : "Copy all"}
              icon={copied ? Check : Copy}
              style={{ flex: 1 }}
              onPress={async () => {
                await Clipboard.setStringAsync(text);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
            />
            <Button size="md" variant="secondary" title="Share" icon={Share2} style={{ flex: 1 }} onPress={() => Share.share({ message: text, title: "Payzentra recovery codes" }).catch(() => {})} />
          </View>
        </Card>
        <Alert tone="warning">Payzentra staff will never ask for these codes. You won&apos;t be able to see them again after this step.</Alert>
        <Checkbox checked={saved} onChange={setSaved} error={tried && !saved ? "Confirm you've saved your codes to continue." : null}>
          I&apos;ve saved my recovery codes somewhere safe.
        </Checkbox>
      </View>
    </Screen>
  );
}
