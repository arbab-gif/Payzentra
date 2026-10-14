import * as Clipboard from "expo-clipboard";
import { router } from "expo-router";
import { Check, Copy, ExternalLink, KeyRound, QrCode, ShieldCheck, Smartphone } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Linking, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { OtpInput } from "@/components/OtpInput";
import { Loading, PageTitle, Screen } from "@/components/Screen";
import { Alert, Button, Card, Divider, IconBadge, Text } from "@/components/ui";
import { confirmTotpSetup, startTotpSetup } from "@/lib/api";
import { usePreview, useSeed } from "@/lib/preview";
import { ROUTES } from "@/lib/store";
import { fonts, radius, useColors } from "@/lib/theme";
import { toast } from "@/lib/toast";
import { useGuard } from "@/lib/useGuard";

type Stage = "intro" | "link" | "verify";

export default function SecureAccount() {
  const c = useColors();
  const seed = useSeed<{ stage: Stage; setup: { secret: string; uri: string }; showQr: boolean; code: string; error: string }>();
  const [stage, setStage] = useState<Stage>(seed.stage ?? "intro");
  const [setup, setSetup] = useState<{ secret: string; uri: string } | null>(seed.setup ?? null);
  const [showQr, setShowQr] = useState(seed.showQr ?? false);
  const [copied, setCopied] = useState(false);
  const [code, setCode] = useState(seed.code ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(seed.error ?? null);
  const allowed = useGuard(ROUTES.secure, loading);

  const preview = !!usePreview();
  useEffect(() => {
    if (stage !== "link" || setup || preview) return;
    let live = true;
    startTotpSetup().then((res) => live && res.ok && setSetup(res.data));
    return () => {
      live = false;
    };
  }, [stage, setup, preview]);

  if (!allowed) return <Loading />;

  const copy = async () => {
    if (!setup) return;
    await Clipboard.setStringAsync(setup.secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openApp = async () => {
    if (!setup) return;
    try {
      await Linking.openURL(setup.uri);
    } catch {
      toast({ tone: "danger", title: "No authenticator app found", body: "Install one from your app store, or copy the setup key instead." });
    }
  };

  const verify = async (value = code) => {
    if (value.length !== 6 || loading) return;
    setLoading(true);
    setError(null);
    const res = await confirmTotpSetup(value);
    if (!res.ok) {
      setLoading(false);
      setError(res.message);
      setCode("");
      return;
    }
    router.replace(ROUTES.recoveryCodes as never);
  };

  if (stage === "intro") {
    return (
      <Screen back footer={<Button title="Set up authenticator" onPress={() => setStage("link")} />}>
        <View style={{ marginBottom: 20 }}><IconBadge icon={ShieldCheck} /></View>
        <PageTitle
          title="Secure your account"
          subtitle="Every Payzentra account uses two-step sign-in. As well as your password, you'll enter a code from an authenticator app when you log in or make a sensitive change."
        />
        <View style={{ gap: 12 }}>
          {[
            { Icon: Smartphone, t: "Get an authenticator app", b: "Google Authenticator, Microsoft Authenticator or any app with time-based codes." },
            { Icon: KeyRound, t: "Link it to Payzentra", b: "One tap on this phone, or scan a QR code from another device." },
            { Icon: ShieldCheck, t: "Save your recovery codes", b: "Use them if you ever lose access to your phone." },
          ].map(({ Icon, t, b }) => (
            <Card key={t} style={{ flexDirection: "row", gap: 14 }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: c.surface2, alignItems: "center", justifyContent: "center" }}>
                <Icon size={20} color={c.primary} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text variant="bodyStrong">{t}</Text>
                <Text variant="small" tone="muted">{b}</Text>
              </View>
            </Card>
          ))}
        </View>
      </Screen>
    );
  }

  if (stage === "link") {
    return (
      <Screen
        back={() => setStage("intro")}
        footer={<Button title="I've added it — continue" disabled={!setup} onPress={() => setStage("verify")} />}
      >
        <PageTitle title="Link your authenticator" subtitle="Add Payzentra to your authenticator app, then come back here." />
        {!setup ? (
          <Card style={{ height: 220, alignItems: "center", justifyContent: "center" }}>
            <Text variant="small" tone="muted">Generating secure key…</Text>
          </Card>
        ) : (
          <View style={{ gap: 16 }}>
            <Button title="Open authenticator app" icon={ExternalLink} onPress={openApp} />
            <Card style={{ gap: 12 }}>
              <Text variant="smallStrong">Or enter this setup key</Text>
              <Text variant="small" tone="muted">In your app choose “Enter a setup key” and pick time-based if asked.</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: radius.md, backgroundColor: c.input }}>
                <Text selectable style={{ flex: 1, fontFamily: fonts.semibold, fontSize: 14, letterSpacing: 1.5, color: c.text }}>
                  {setup.secret.match(/.{1,4}/g)?.join(" ")}
                </Text>
                <Button size="sm" variant="secondary" title={copied ? "Copied" : "Copy"} icon={copied ? Check : Copy} onPress={copy} />
              </View>
              <Divider />
              {showQr ? (
                <View style={{ alignItems: "center", gap: 8 }}>
                  <View style={{ padding: 12, borderRadius: radius.md, backgroundColor: "#fff" }}>
                    <QRCode value={setup.uri} size={180} color="#0d1230" backgroundColor="#fff" />
                  </View>
                  <Text variant="caption" tone="muted" center>Scan with the authenticator app on another device.</Text>
                </View>
              ) : (
                <Button size="md" variant="ghost" title="Authenticator on another device? Show QR" icon={QrCode} onPress={() => setShowQr(true)} />
              )}
            </Card>
            <Alert tone="info">Keep this key private. Anyone with it can generate your sign-in codes.</Alert>
          </View>
        )}
      </Screen>
    );
  }

  return (
    <Screen
      back={() => { setStage("link"); setError(null); }}
      footer={<Button title="Turn on two-step sign-in" loading={loading} disabled={code.length !== 6} onPress={() => verify()} />}
    >
      <PageTitle title="Enter the 6-digit code" subtitle="Type the code your authenticator app shows for Payzentra. Codes refresh every 30 seconds." />
      <View style={{ gap: 16 }}>
        {error && <Alert tone="danger" title="Code didn't match">{error}</Alert>}
        <OtpInput value={code} onChange={(v) => { setCode(v); setError(null); }} onComplete={verify} error={!!error} disabled={loading} label="Authenticator code" />
      </View>
    </Screen>
  );
}
