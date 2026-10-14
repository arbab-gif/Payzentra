import { Check, Circle } from "lucide-react-native";
import { View } from "react-native";
import { PASSWORD_RULES } from "@/lib/validation";
import { useColors } from "@/lib/theme";
import { Text } from "./ui";

export function PasswordRules({ value, showErrors }: { value: string; showErrors?: boolean }) {
  const c = useColors();
  return (
    <View style={{ gap: 6 }} accessibilityLabel="Password requirements">
      {PASSWORD_RULES.map((r) => {
        const ok = r.test(value);
        const color = ok ? c.success : showErrors ? c.danger : c.muted;
        return (
          <View key={r.id} style={{ flexDirection: "row", alignItems: "center", gap: 8 }} accessible accessibilityLabel={`${r.label}, ${ok ? "met" : "not met"}`}>
            {ok ? <Check size={14} color={color} strokeWidth={3} /> : <Circle size={12} color={color} />}
            <Text variant="small" style={{ color }}>
              {r.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
