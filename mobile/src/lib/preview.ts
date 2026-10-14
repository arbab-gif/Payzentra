import { useLocalSearchParams } from "expo-router";
import { createContext, useContext } from "react";

/**
 * Screen gallery only (/gallery): lets a screen render inside a frame with its own
 * size, route params and starting state, without navigating or touching saved progress.
 */
export type PreviewEnv = {
  width: number;
  height: number;
  params: Record<string, string>;
  /** Starting values for a screen's local state, e.g. an error that is already showing. */
  seed: Record<string, unknown>;
  /** Where overlays (sheets, Face ID prompts) render, so they stay inside the frame. */
  host: HTMLElement | null;
};

const PreviewCtx = createContext<PreviewEnv | null>(null);
const NO_SEED = {};

export const PreviewProvider = PreviewCtx.Provider;

export function usePreview() {
  return useContext(PreviewCtx);
}

export function useSeed<T extends object>(): Partial<T> {
  return (useContext(PreviewCtx)?.seed ?? NO_SEED) as Partial<T>;
}

/** Route params, or the frame's params inside the gallery. */
export function useRouteParams<T extends Record<string, string>>(): Partial<T> {
  const route = useLocalSearchParams();
  const preview = useContext(PreviewCtx);
  return (preview ? preview.params : route) as Partial<T>;
}
