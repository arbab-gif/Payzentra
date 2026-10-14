import * as Haptics from "expo-haptics";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  Info,
  XCircle,
  type LucideIcon,
} from "lucide-react-native";
import { forwardRef, useEffect, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Animated,
  Platform,
  Pressable,
  Text as RNText,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from "react-native-svg";
import { fonts, radius, useColors, type Colors, noWebOutline } from "@/lib/theme";

export function haptic(kind: "success" | "error" | "light") {
  if (Platform.OS === "web") return;
  if (kind === "light") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  else Haptics.notificationAsync(kind === "success" ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error);
}

// ---------- Text ----------

const variants = {
  display: { fontFamily: fonts.extrabold, fontSize: 38, lineHeight: 42, letterSpacing: -1.4 },
  title: { fontFamily: fonts.bold, fontSize: 30, lineHeight: 36, letterSpacing: -0.9 },
  heading: { fontFamily: fonts.bold, fontSize: 20, lineHeight: 26, letterSpacing: -0.4 },
  body: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 24 },
  bodyStrong: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 24 },
  small: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20 },
  smallStrong: { fontFamily: fonts.semibold, fontSize: 14, lineHeight: 20 },
  caption: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 16 },
  label: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 20 },
} satisfies Record<string, TextStyle>;

type Tone = "text" | "muted" | "subtle" | "primary" | "success" | "danger" | "warning" | "onPrimary";

export function Text({
  variant = "body",
  tone = "text",
  center,
  style,
  ...rest
}: TextProps & { variant?: keyof typeof variants; tone?: Tone; center?: boolean }) {
  const c = useColors();
  return (
    <RNText
      {...rest}
      maxFontSizeMultiplier={1.6}
      style={[variants[variant], { color: c[tone] }, center && { textAlign: "center" }, style]}
    />
  );
}

// ---------- Logo & flag ----------

export function Logo({ size = 30, wordmark = true, onDark }: { size?: number; wordmark?: boolean; onDark?: boolean }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
      <Svg width={size} height={size} viewBox="0 0 32 32">
        <Defs>
          <LinearGradient id="pz" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#a3b0ff" />
            <Stop offset="1" stopColor="#4f63f0" />
          </LinearGradient>
        </Defs>
        <Path d="M5 4h8l10 12-10 12H5l10-12z" fill="url(#pz)" />
        <Path d="M14 4h6l9 12-9 12h-6l9-12z" fill="url(#pz)" opacity={0.55} />
      </Svg>
      {wordmark && (
        <Text variant="heading" style={onDark ? { color: "#ffffff" } : undefined}>
          Payzentra
        </Text>
      )}
    </View>
  );
}

export function NgFlag() {
  return (
    <Svg width={22} height={15} viewBox="0 0 3 2" accessibilityLabel="Nigeria">
      <Rect width="3" height="2" fill="#fff" />
      <Rect width="1" height="2" fill="#008751" />
      <Rect x="2" width="1" height="2" fill="#008751" />
    </Svg>
  );
}

// ---------- Button ----------

type ButtonProps = {
  title: string;
  onPress?: () => void;
  /** white / glass are for use on the dark welcome hero. */
  variant?: "primary" | "secondary" | "ghost" | "danger" | "white" | "glass";
  loading?: boolean;
  disabled?: boolean;
  icon?: LucideIcon;
  size?: "lg" | "md" | "sm";
  style?: StyleProp<ViewStyle>;
};

export function Button({ title, onPress, variant = "primary", loading, disabled, icon: Icon, size = "lg", style }: ButtonProps) {
  const c = useColors();
  const height = size === "lg" ? 54 : size === "md" ? 46 : 36;
  const bg = { primary: c.primary, secondary: c.surface2, ghost: "transparent", danger: c.danger, white: "#ffffff", glass: "rgba(255,255,255,0.14)" }[variant];
  const fg = { primary: c.onPrimary, danger: c.onPrimary, ghost: c.primary, secondary: c.text, white: "#111318", glass: "#ffffff" }[variant];
  const inactive = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      accessibilityLabel={title}
      disabled={inactive}
      onPress={() => {
        haptic("light");
        onPress?.();
      }}
      style={({ pressed }) => [
        {
          height,
          borderRadius: radius.pill,
          backgroundColor: pressed && variant === "primary" ? c.primaryPressed : bg,
          paddingHorizontal: size === "sm" ? 14 : 22,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          opacity: disabled && !loading ? 0.45 : pressed && variant !== "primary" ? 0.7 : 1,
        },
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={fg} size="small" /> : Icon ? <Icon size={size === "sm" ? 16 : 20} color={fg} /> : null}
      <Text variant={size === "sm" ? "smallStrong" : "bodyStrong"} style={{ color: fg }}>
        {title}
      </Text>
    </Pressable>
  );
}

export function LinkText({ children, onPress }: { children: string; onPress: () => void }) {
  return (
    <Text variant="smallStrong" tone="primary" onPress={onPress} accessibilityRole="link" suppressHighlighting>
      {children}
    </Text>
  );
}

// ---------- Text field ----------

type FieldProps = TextInputProps & {
  label: string;
  hint?: string;
  error?: string | null;
  /** Error styling without a message under the field (the message is shown by the parent, e.g. a shared row). */
  invalid?: boolean;
  left?: ReactNode;
  right?: ReactNode;
  mono?: boolean;
};

export const Field = forwardRef<TextInput, FieldProps>(function Field(
  { label, hint, error, invalid, left, right, mono, style, onFocus, onBlur, ...rest },
  ref,
) {
  const c = useColors();
  const [focused, setFocused] = useState(false);
  const hasValue = typeof rest.value === "string" ? rest.value.length > 0 : !!rest.defaultValue;
  const bad = !!error || !!invalid;
  return (
    <View style={{ gap: 8 }}>
      {/* Visible label on every field, above a filled input. */}
      <Text variant="label" style={{ color: bad ? c.danger : c.text }}>
        {label}
      </Text>
      <View
        style={{
          minHeight: 56,
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          borderRadius: radius.md,
          borderWidth: 2,
          borderColor: bad ? c.danger : focused ? c.primary : "transparent",
          backgroundColor: c.input,
          paddingHorizontal: 14,
        }}
      >
        {left}
        <TextInput
          ref={ref}
          placeholderTextColor={c.subtle}
          selectionColor={c.primary}
          accessibilityLabel={label}
          accessibilityHint={error ?? hint}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...rest}
          style={[
            {
              // flex + minWidth 0 so browser inputs share the row instead of keeping a wide default size.
              flex: 1,
              minWidth: 0,
              height: 52,
              paddingVertical: 0,
              color: c.text,
              fontFamily: mono ? fonts.semibold : fonts.medium,
              fontSize: 17,
              letterSpacing: mono && hasValue ? 2 : -0.2,
            },
            noWebOutline,
            style,
          ]}
        />
        {right}
      </View>
      {error ? (
        <View style={{ flexDirection: "row", gap: 6, alignItems: "flex-start" }} accessibilityLiveRegion="polite">
          <XCircle size={16} color={c.danger} style={{ marginTop: 2 }} />
          <Text variant="small" tone="danger" style={{ flex: 1 }}>
            {error}
          </Text>
        </View>
      ) : hint ? (
        <Text variant="small" tone="muted">
          {hint}
        </Text>
      ) : null}
    </View>
  );
});

export function PasswordField(props: Omit<FieldProps, "secureTextEntry" | "right">) {
  const c = useColors();
  const [show, setShow] = useState(false);
  return (
    <Field
      {...props}
      secureTextEntry={!show}
      autoCapitalize="none"
      autoCorrect={false}
      right={
        <Pressable
          onPress={() => setShow((s) => !s)}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOff size={20} color={c.muted} /> : <Eye size={20} color={c.muted} />}
        </Pressable>
      }
    />
  );
}

// ---------- Checkbox ----------

export function Checkbox({
  checked,
  onChange,
  children,
  error,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  children: ReactNode;
  error?: string | null;
  /** Spoken label when children aren't plain text. */
  label?: string;
}) {
  const c = useColors();
  return (
    <View style={{ gap: 6 }}>
      <Pressable
        onPress={() => {
          haptic("light");
          onChange(!checked);
        }}
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        accessibilityLabel={typeof children === "string" ? children : label}
        style={{ flexDirection: "row", gap: 12, alignItems: "flex-start" }}
        hitSlop={6}
      >
        <View
          style={{
            width: 24,
            height: 24,
            borderRadius: 8,
            borderWidth: 2,
            borderColor: checked ? c.primary : error ? c.danger : c.borderStrong,
            backgroundColor: checked ? c.primary : "transparent",
            alignItems: "center",
            justifyContent: "center",
            marginTop: 1,
          }}
        >
          {checked && <Check size={16} color={c.onPrimary} strokeWidth={3} />}
        </View>
        <View style={{ flex: 1 }}>{typeof children === "string" ? <Text variant="small" tone="muted">{children}</Text> : children}</View>
      </Pressable>
      {error && (
        <Text variant="small" tone="danger" style={{ paddingLeft: 36 }}>
          {error}
        </Text>
      )}
    </View>
  );
}

// ---------- Alert ----------

const alertIcons = { info: Info, success: CheckCircle2, warning: AlertTriangle, danger: XCircle };

export function Alert({
  tone = "info",
  title,
  children,
  action,
}: {
  tone?: keyof typeof alertIcons;
  title?: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  const c = useColors();
  const Icon = alertIcons[tone];
  const fg = c[tone];
  const bg = c[`${tone}Soft` as keyof Colors];
  return (
    <FadeIn>
      <View
        accessibilityRole={tone === "danger" ? "alert" : undefined}
        accessibilityLiveRegion="polite"
        style={{ flexDirection: "row", gap: 12, padding: 14, borderRadius: radius.md, backgroundColor: bg }}
      >
        <Icon size={20} color={fg} />
        <View style={{ flex: 1, gap: 2 }}>
          {title && (
            <Text variant="smallStrong" style={{ color: fg }}>
              {title}
            </Text>
          )}
          {typeof children === "string" ? (
            <Text variant="small" style={{ color: c.text, opacity: 0.85 }}>
              {children}
            </Text>
          ) : (
            children
          )}
          {action && <View style={{ marginTop: 8 }}>{action}</View>}
        </View>
      </View>
    </FadeIn>
  );
}

// ---------- Card ----------

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const c = useColors();
  return (
    <View style={[{ borderRadius: radius.lg, backgroundColor: c.surface, padding: 16 }, style]}>
      {children}
    </View>
  );
}

// Two soft blobs (cropped to their bounds) that sit behind the status symbol.
const BLOB_BACK = "M64 20c22 2 38 18 36 42s-20 38-42 36-38-18-36-40 20-40 42-38z";
const BLOB_FRONT = "M58 30c17 0 30 12 30 29s-13 31-30 31-28-13-28-30 11-30 28-30z";

/**
 * Status icon — the app's "duotone blob" style for every status moment:
 * two layered organic shapes in the tone colour with a white symbol on top.
 * `size` is the outer box.
 */
export function StatusIcon({
  icon: Icon,
  tone = "primary",
  size = 104,
  pulse,
}: {
  icon: LucideIcon;
  tone?: "primary" | "success" | "warning" | "danger";
  size?: number;
  pulse?: boolean;
}) {
  const c = useColors();
  const shade = c[tone];
  const [beat] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!pulse) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(beat, { toValue: 1, duration: 800, useNativeDriver: Platform.OS !== "web" }),
        Animated.timing(beat, { toValue: 0, duration: 800, useNativeDriver: Platform.OS !== "web" }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse, beat]);

  const tick = Icon === Check || Icon === CheckCircle2;
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Animated.View
        style={{
          position: "absolute",
          width: size,
          height: size,
          transform: [{ scale: beat.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) }],
        }}
      >
        <Svg width={size} height={size} viewBox="20 18 82 82">
          <Path d={BLOB_BACK} fill={shade} opacity={0.22} />
          <Path d={BLOB_FRONT} fill={shade} opacity={0.45} />
        </Svg>
      </Animated.View>
      <Icon size={Math.round(size * 0.46)} color="#ffffff" strokeWidth={tick ? 3 : 2.2} />
    </View>
  );
}

/** Small status icon used beside page titles (e.g. "Check your email"). */
export function IconBadge({ icon, tone = "primary", size = 64 }: { icon: LucideIcon; tone?: "primary" | "success" | "warning" | "danger"; size?: number }) {
  return <StatusIcon icon={icon} tone={tone} size={size} />;
}

// ---------- Status hero ----------

export function StatusHero({
  tone,
  icon,
  title,
  body,
  pulse,
}: {
  tone: "success" | "warning" | "danger" | "primary";
  icon: LucideIcon;
  title: string;
  body?: string;
  pulse?: boolean;
}) {
  useEffect(() => {
    if (tone === "success") haptic("success");
    else if (tone === "danger") haptic("error");
  }, [tone]);

  // Success screens use a bold tick rather than the circled check.
  const symbol = icon === CheckCircle2 ? Check : icon;
  return (
    <FadeIn style={{ alignItems: "center" }}>
      <View style={{ marginBottom: 24 }}>
        <StatusIcon icon={symbol} tone={tone} size={112} pulse={pulse} />
      </View>
      <Text variant="title" center accessibilityRole="header">
        {title}
      </Text>
      {body && (
        <Text tone="muted" center style={{ marginTop: 10, maxWidth: 340 }}>
          {body}
        </Text>
      )}
    </FadeIn>
  );
}

// ---------- Motion ----------

export function FadeIn({ children, style, delay = 0 }: { children: ReactNode; style?: StyleProp<ViewStyle>; delay?: number }) {
  const [v] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration: 280, delay, useNativeDriver: Platform.OS !== "web" }).start();
  }, [v, delay]);
  return (
    <Animated.View style={[style, { opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] }]}>
      {children}
    </Animated.View>
  );
}

export function Divider() {
  const c = useColors();
  return <View style={{ height: 1, backgroundColor: c.border }} />;
}
