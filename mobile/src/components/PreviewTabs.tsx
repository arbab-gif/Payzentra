import { Monitor, Smartphone, type LucideIcon } from "lucide-react-native";
import { Platform, Pressable, View } from "react-native";
import { useApp } from "@/lib/store";
import { radius } from "@/lib/theme";
import { Text } from "./ui";

/**
 * Browser preview only: a slim bar above the app to switch between the phone
 * app and the desktop web app. Not part of either product.
 */
export function PreviewTabs() {
  const mode = useApp((s) => s.viewMode);
  const setMode = useApp((s) => s.setViewMode);
  if (Platform.OS !== "web") return null;
  const tabs: { key: "mobile" | "web"; label: string; Icon: LucideIcon }[] = [
    { key: "mobile", label: "Mobile app", Icon: Smartphone },
    { key: "web", label: "Web app", Icon: Monitor },
  ];
  return (
    <View
      style={{ height: 44, flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#0e0e11", borderBottomWidth: 1, borderBottomColor: "#232329" }}
      accessibilityRole="tablist"
    >
      <Text variant="caption" style={{ position: "absolute", left: 16, color: "#6c6c78" }}>Preview</Text>
      <View style={{ flexDirection: "row", padding: 3, borderRadius: radius.pill, backgroundColor: "#1c1c21" }}>
        {tabs.map(({ key, label, Icon }) => {
          const on = mode === key;
          return (
            <Pressable
              key={key}
              onPress={() => setMode(key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, height: 30, borderRadius: radius.pill, backgroundColor: on ? "#667cff" : "transparent" }}
            >
              <Icon size={15} color={on ? "#ffffff" : "#a1a1ac"} />
              <Text variant="caption" style={{ color: on ? "#ffffff" : "#a1a1ac" }}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
