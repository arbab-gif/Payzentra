import { createContext, useContext } from "react";
import { Platform, type TextStyle } from "react-native";
import { useApp } from "./store";

/**
 * Dark-first fintech look: pure black canvas, near-black raised cards, white text,
 * one periwinkle-indigo accent (#667CFF) for actions, filled inputs and pill buttons.
 * Light mode is kept as an alternative (Demo controls).
 */
const light = {
  bg: "#f4f5f7",
  bgElevated: "#ffffff",
  surface: "#ffffff",
  surface2: "#eceef2",
  input: "#eceef2",
  border: "#e4e6eb",
  borderStrong: "#c9cdd6",
  text: "#191c1f",
  muted: "#6b707a",
  subtle: "#9a9ea7",
  primary: "#4f63f0",
  primaryPressed: "#4152d6",
  primarySoft: "rgba(79, 99, 240, 0.10)",
  onPrimary: "#ffffff",
  inverse: "#191c1f",
  onInverse: "#ffffff",
  success: "#00a46b",
  successSoft: "rgba(0, 164, 107, 0.12)",
  warning: "#d97a00",
  warningSoft: "rgba(217, 122, 0, 0.12)",
  danger: "#e5484d",
  dangerSoft: "rgba(229, 72, 77, 0.10)",
  info: "#2f7fd6",
  infoSoft: "rgba(47, 127, 214, 0.08)",
  glow: "rgba(79, 99, 240, 0.10)",
  overlay: "rgba(17, 19, 24, 0.45)",
  heroTop: "#0b0e24",
  heroBottom: "#04060c",
};

const dark: typeof light = {
  bg: "#000000",
  bgElevated: "#111114",
  surface: "#111114",
  surface2: "#1c1c21",
  input: "#16161a",
  border: "#232329",
  borderStrong: "#35353d",
  text: "#ffffff",
  muted: "#a1a1ac",
  subtle: "#6c6c78",
  primary: "#667cff",
  primaryPressed: "#5569f0",
  primarySoft: "rgba(102, 124, 255, 0.16)",
  onPrimary: "#ffffff",
  inverse: "#ffffff",
  onInverse: "#000000",
  success: "#2bc48a",
  successSoft: "rgba(43, 196, 138, 0.16)",
  warning: "#f5a524",
  warningSoft: "rgba(245, 165, 36, 0.16)",
  danger: "#ff6369",
  dangerSoft: "rgba(255, 99, 105, 0.16)",
  info: "#6cb8ff",
  infoSoft: "rgba(108, 184, 255, 0.14)",
  glow: "rgba(102, 124, 255, 0.18)",
  overlay: "rgba(0, 0, 0, 0.6)",
  heroTop: "#0b0e24",
  heroBottom: "#04060c",
};

export type Colors = typeof light;

const ColorCtx = createContext<Colors | null>(null);
export const ForceDark = ColorCtx.Provider;
export const darkColors = dark;

export function useColors(): Colors {
  const override = useContext(ColorCtx);
  if (override) return override;
  return useApp((s) => s.theme) === "dark" ? dark : light;
}

export const fonts = {
  regular: "InterTight_400Regular",
  medium: "InterTight_500Medium",
  semibold: "InterTight_600SemiBold",
  bold: "InterTight_700Bold",
  extrabold: "InterTight_800ExtraBold",
} as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radius = { sm: 12, md: 16, lg: 20, xl: 28, pill: 999 } as const;

/** Hides the browser focus outline on text inputs (we draw our own focus state). */
export const noWebOutline: TextStyle = Platform.OS === "web" ? ({ outlineStyle: "none" } as unknown as TextStyle) : {};
