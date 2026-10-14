# Payzentra

Customer app for Payzentra, a Nigeria-first fintech: naira wallet, bill payments and crypto.

## What's here

| Folder | What it is |
| --- | --- |
| [`mobile/`](mobile/) | The app. Expo / React Native, from welcome and sign-up through identity verification (BVN or NIN, selfie, address) to the signed-in Home screen. See [`mobile/README.md`](mobile/README.md). |
| [`_archive/web/`](_archive/web/) | An earlier Next.js web version of onboarding, kept for reference. Not maintained. |

## Run the app

```bash
cd mobile
npm install
npx expo start
```

Press `w` to open it in a browser, or scan the QR code with Expo Go. All data is simulated: long-press the empty header area (or the greeting on Home) to open Demo controls and switch scenarios.

In the browser, a **Preview** bar at the top switches between **Mobile app** (the phone app at phone width) and **Web app** (the desktop web app: split-screen sign-up and verification with a step tracker, and a Home dashboard with a sidebar). Both share the same screens, data and logic.

## Design

The final screens, in dark and light mode, live in the Payzentra Figma file on the "Final Design" page.
