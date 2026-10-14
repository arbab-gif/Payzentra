# Payzentra — mobile app (Expo / React Native)

Customer onboarding from the welcome screen through identity verification (KYC), ending on the signed-in Home screen.

Design: dark-first with an indigo accent (#667CFF) — pure black canvas, near-black cards, Inter Tight type, pill buttons, filled inputs with floating labels, one question per screen. Light mode is available from Demo controls. (The earlier dark/indigo design lives in the Figma file.)

## Run it

```bash
npm install
npx expo start
```

- **On your phone:** install **Expo Go** (App Store / Play Store), then scan the QR code shown in the terminal.
- **In a browser:** press `w` in the terminal (or run `npm run web`). On desktop it is shown at phone width.

## Journey

**New customer:** Welcome → Your email → Verify email (6-digit code, with expiry and resend) → Create password + confirm (live mismatch check) → Set a 6-digit **unlock code** and confirm it → optional Face ID / fingerprint → Home. Identity verification is not part of sign-up: a newly registered Home says "Wallet not active yet" (no balance figure) with a small banner to verify, and every money action is locked until verified.

**Identity verification** (from the Home banner or Profile, 3 steps): BVN or NIN (consent; NIN- and BVN-specific checking; mismatch, not found, unsupported ID, duplicate and provider-down states) → review the details returned from the record → live selfie (camera only) → home address → Verified / In review / Unsuccessful.

**Returning customer on this phone:** Unlock screen — the 6-digit code or Face ID / fingerprint, no email or password. Wrong code shows attempts left; 5 wrong attempts sign out of this device. "Forgot unlock code?" asks for the password, then sets a new code. A timed-out session refreshes quietly after unlocking; an expired one shows "Your session has ended" and asks for the password or passkey.

**New device or signed out:** Welcome back / Log in with email + password or a passkey. A device we haven't seen gets an email code check, then sets its own unlock code. Optional authenticator-app sign-in still applies once turned on.

**Home:** labelled balances (available balance, money on hold, indicative crypto value), quick actions, recent activity (with a reversed transfer that says the money was returned), updates and a security recommendation. Tabs: Home, Wallet, Crypto, Payments, Cards (only Home is built). The avatar opens **Profile** (verification level, account number, unlock code, Face ID, passkey, two-step sign-in, transaction PIN — kept separate from the unlock code — appearance, log out); the clock icon and "See all" open **Activity** (grouped by day, with filters).

The **Web app** tab in the browser preview shows the same app as a desktop layout with a sidebar.

## Structure

- `src/app/**` — one file per screen (Expo Router)
- `src/components/` — UI kit (`ui.tsx`), step layout (`Screen.tsx`), code input, date field, bottom sheets, demo panel
- `src/lib/store.ts` — saved progress (on-device) and step order
- `src/lib/api.ts` — simulated backend
- `src/lib/theme.ts` — colour tokens for dark (default) and light

The earlier responsive web version is kept in `../_archive/web` for reference.
