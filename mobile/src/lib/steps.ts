/**
 * The identity-verification steps, matching "How it works" on the verify intro.
 * The provider returns name, date of birth and phone from the BVN or NIN, so
 * there's no separate personal-details step.
 */
export type StepKey = "id" | "selfie" | "address";

export const STEPS: { key: StepKey; label: string; hint: string }[] = [
  { key: "id", label: "BVN or NIN", hint: "We fetch and show you your details" },
  { key: "selfie", label: "Selfie check", hint: "A quick live selfie" },
  { key: "address", label: "Home address", hint: "Where you live now" },
];
