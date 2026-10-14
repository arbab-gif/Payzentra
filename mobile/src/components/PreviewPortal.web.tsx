import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { StyleSheet, View } from "react-native";
import { usePreview } from "@/lib/preview";

export function PreviewPortal({ children }: { children?: ReactNode }) {
  const host = usePreview()?.host;
  if (!host) return null;
  return createPortal(<View style={StyleSheet.absoluteFill}>{children}</View>, host);
}
