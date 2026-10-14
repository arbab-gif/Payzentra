# Payzentra — customer web app

Customer onboarding from the landing page through identity verification (KYC). The signed-in Home screen is not built yet.

## Run it

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Journey

| Step | Route |
|---|---|
| Landing / welcome | `/` |
| Create account | `/signup` |
| Verify email (6-digit code) | `/signup/verify-email` |
| Authenticator (TOTP) setup | `/signup/secure` |
| Recovery codes | `/signup/recovery-codes` |
| KYC intro | `/verify` |
| Phone + date of birth | `/verify/details` |
| BVN or NIN + consent | `/verify/identity` |
| Confirm provider-returned identity | `/verify/identity/confirm` |
| Live selfie / liveness | `/verify/selfie` |
| Home address | `/verify/address` |
| Review & submit | `/verify/review` |
| Verified / in review / rejected | `/verify/status` |
| Log in → authenticator / recovery code | `/login`, `/login/mfa` |
| Password reset | `/forgot-password` |

Progress is saved, so closing the tab or logging back in resumes at the right step. Typing a later step's URL redirects back to the step the customer should be on.

## Simulated backend

There is no real backend yet. `src/lib/api.ts` stands in for every API call, and the screens only depend on its return shapes, so it can be swapped for the FastAPI service later.

The **Demo** button (bottom-right on desktop, flask icon in the header on phones) chooses what the simulated backend returns: duplicate email, wrong password, locked login, BVN/NIN mismatch / not found / duplicate identity / provider down, selfie failures and manual review, and verified / pending / rejected decisions. It also switches light/dark mode and resets everything.

Test codes:
- Email code `123456`, expired code `111111`
- Authenticator: any 6 digits, `000000` = wrong
- BVN / NIN: any 11 digits

## Structure

- `src/app/**` — one folder per screen
- `src/components/` — shared UI (`ui.tsx`), step layout (`AuthShell.tsx`), code input, demo panel
- `src/lib/store.ts` — saved progress and the step order (`nextRoute`)
- `src/lib/api.ts` — simulated backend
- `src/app/globals.css` — design tokens for dark (default) and light themes
