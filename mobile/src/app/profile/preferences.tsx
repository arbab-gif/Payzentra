import { Bell, EyeOff, Mail, Moon, Sun } from "lucide-react-native";
import { Pressable, Switch, View } from "react-native";
import { AppPage, Group } from "@/components/AppPage";
import { soon } from "@/components/home/parts";
import { Row } from "@/components/ProfileRows";
import { Loading } from "@/components/Screen";
import { ROUTES, useApp } from "@/lib/store";
import { radius, useColors } from "@/lib/theme";
import { useGuard } from "@/lib/useGuard";

/** Profile → Preferences: how the app looks, balance privacy and notifications. */
export default function ProfilePreferences() {
  const c = useColors();
  const allowed = useGuard(ROUTES.profilePreferences);
  const theme = useApp((s) => s.theme);
  const setTheme = useApp((s) => s.setTheme);
  const hide = useApp((s) => s.hideBalances);
  const setHide = useApp((s) => s.setHideBalances);
  if (!allowed) return <Loading />;

  return (
    <AppPage page="profile" title="Preferences" parent={ROUTES.profile}>
      <Group title="Display">
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
        <Row
          Icon={EyeOff}
          title="Hide balances"
          detail="Mask amounts on Home and Activity"
          right={<Switch value={hide} onValueChange={setHide} trackColor={{ false: c.surface2, true: c.primary }} thumbColor="#ffffff" accessibilityLabel="Hide balances" />}
        />
      </Group>

      <Group title="Notifications">
        <Row Icon={Bell} title="Push notifications" detail="Payments, security alerts and account updates" onPress={() => soon("Notification settings")} />
        <Row Icon={Mail} title="Email updates" detail="Product news and offers" onPress={() => soon("Email preferences")} />
      </Group>
    </AppPage>
  );
}
