import { Redirect, router } from "expo-router";
import { LogIn } from "lucide-react-native";
import { Screen } from "@/components/Screen";
import { Button, StatusHero } from "@/components/ui";
import { ROUTES, useApp } from "@/lib/store";

/**
 * The saved session couldn't be refreshed, so the customer has to sign in again.
 * (A session that can be refreshed never reaches this screen.)
 */
export default function SessionExpired() {
  const account = useApp((s) => s.account);
  if (!account) return <Redirect href="/" />;
  return (
    <Screen center footer={<Button title="Log in again" icon={LogIn} onPress={() => router.replace(`${ROUTES.welcomeBack}?reason=expired` as never)} />}>
      <StatusHero
        tone="warning"
        icon={LogIn}
        title="Your session has ended"
        body="For your security, you've been signed out after a long time away. Log in with your password or passkey to continue. Your unlock code stays the same on this phone."
      />
    </Screen>
  );
}
