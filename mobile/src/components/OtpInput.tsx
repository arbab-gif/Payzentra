import { useEffect, useRef, useState } from "react";
import { Platform, Pressable, TextInput, View } from "react-native";
import { fonts, radius, useColors, noWebOutline } from "@/lib/theme";
import { Text } from "./ui";

/**
 * One hidden input drawn as six boxes — the standard mobile pattern. It keeps
 * SMS/email one-time-code autofill and paste working, and typing never drops digits.
 */
export function OtpInput({
  value,
  onChange,
  onComplete,
  length = 6,
  error,
  disabled,
  label = "Verification code",
  autoFocus = true,
}: {
  value: string;
  onChange: (v: string) => void;
  onComplete?: (v: string) => void;
  length?: number;
  error?: boolean;
  disabled?: boolean;
  label?: string;
  autoFocus?: boolean;
}) {
  const c = useColors();
  const ref = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!disabled && autoFocus) {
      const t = setTimeout(() => ref.current?.focus(), 250);
      return () => clearTimeout(t);
    }
  }, [disabled, autoFocus]);

  return (
    <Pressable onPress={() => ref.current?.focus()} accessible={false}>
      <View style={{ flexDirection: "row", gap: 10, justifyContent: "space-between" }} pointerEvents="none">
        {Array.from({ length }, (_, i) => {
          const d = value[i] ?? "";
          const active = focused && i === Math.min(value.length, length - 1);
          return (
            <View
              key={i}
              style={{
                flex: 1,
                maxWidth: 56,
                height: 60,
                borderRadius: radius.md,
                borderWidth: 2,
                borderColor: error ? c.danger : active ? c.primary : "transparent",
                backgroundColor: c.input,
                alignItems: "center",
                justifyContent: "center",
                opacity: disabled ? 0.5 : 1,
              }}
            >
              <Text variant="heading" style={{ fontSize: 24 }}>
                {d}
              </Text>
              {active && !d && <View style={{ position: "absolute", width: 2, height: 24, backgroundColor: c.primary, borderRadius: 1 }} />}
            </View>
          );
        })}
      </View>
      <TextInput
        ref={ref}
        value={value}
        editable={!disabled}
        onChangeText={(t) => {
          const clean = t.replace(/\D/g, "").slice(0, length);
          onChange(clean);
          if (clean.length === length) onComplete?.(clean);
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete={Platform.OS === "android" ? "sms-otp" : "one-time-code"}
        maxLength={length}
        caretHidden
        accessibilityLabel={label}
        style={[
          { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, opacity: 0.011, color: "transparent", fontFamily: fonts.regular },
          noWebOutline,
        ]}
      />
    </Pressable>
  );
}
