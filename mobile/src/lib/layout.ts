import { Platform, useWindowDimensions } from "react-native";
import { useApp } from "./store";

/** Narrower than this, the web app falls back to the phone layout. */
export const WEB_MIN_WIDTH = 900;

/**
 * True when screens should use their desktop web layout: running in a browser,
 * the preview is set to "Web app", and the window is wide enough.
 */
export function useWebLayout() {
  const mode = useApp((s) => s.viewMode);
  const { width } = useWindowDimensions();
  return Platform.OS === "web" && mode === "web" && width >= WEB_MIN_WIDTH;
}
