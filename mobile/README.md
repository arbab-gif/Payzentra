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

Welcome hero (story-style slides) → Your email → Create password → Verify email (6-digit code) → KYC intro → the 4 steps (1 name, phone + date of birth · 2 BVN or NIN + "Is this you?" · 3 selfie · 4 home address & submit) → Verified / In review / Rejected → Home (balance, quick actions, notices, accounts, recent activity, 5-tab nav; only Home is built). Demo controls → "Home" switches between an account with history and a new, empty one.

Also: Welcome back (returning user on this phone), Log in, Password reset. Progress saves automatically after every step, so closing the app and logging back in resumes where you left off.

Authenticator (TOTP) set-up and recovery codes are no longer part of onboarding — the screens (`src/app/signup/secure.tsx`, `recovery-codes.tsx`) are kept for a future Settings page. Once a customer turns it on, login asks for the authenticator code.

## Demo controls

There is no real backend yet. `src/lib/api.ts` simulates every API call. **Long-press the empty top bar** on any step (or the logo on the welcome screen) to choose outcomes (duplicate email, wrong password, BVN/NIN mismatch / not found / duplicate / provider down, selfie failures, verified / in review / rejected), switch light/dark mode, or start over.

Test codes: email `123456` (expired `111111`); authenticator any 6 digits (`000000` = wrong); BVN/NIN any 11 digits. The selfie uses a simulated camera by default — switch to the real camera in Demo controls.

## Structure

- `src/app/**` — one file per screen (Expo Router)
- `src/components/` — UI kit (`ui.tsx`), step layout (`Screen.tsx`), code input, date field, bottom sheets, demo panel
- `src/lib/store.ts` — saved progress (on-device) and step order
- `src/lib/api.ts` — simulated backend
- `src/lib/theme.ts` — colour tokens for dark (default) and light

The earlier responsive web version is kept in `../_archive/web` for reference.
