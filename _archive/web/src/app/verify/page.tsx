"use client";

import { Camera, Fingerprint, Home, Info, UserRound } from "lucide-react";
import { AuthShell, PageLoading, PageTitle, StickyActions } from "@/components/AuthShell";
import { Alert, Button } from "@/components/ui";
import { ROUTES } from "@/lib/store";
import { useGuard } from "@/lib/useGuard";

const NEED = [
  { Icon: UserRound, t: "Phone number and date of birth", b: "The ones linked to your BVN or NIN." },
  { Icon: Fingerprint, t: "Your BVN or NIN", b: "Dial *565*0# for your BVN or *346# for your NIN." },
  { Icon: Camera, t: "A quick selfie", b: "Taken live with your camera. Find somewhere with good light." },
  { Icon: Home, t: "Your home address", b: "Where you currently live in Nigeria." },
];

export default function VerifyIntro() {
  const allowed = useGuard(ROUTES.kycIntro);
  if (!allowed) return <PageLoading />;

  return (
    <AuthShell step="details" saveAndExit>
      <PageTitle eyebrow="Account created" title="Now, let's verify your identity">
        We&apos;re required to confirm who you are before you can add, send or trade money. It takes about 3 minutes.
      </PageTitle>
      <div className="flex flex-1 flex-col">
        <div className="space-y-4">
          <ul className="divide-y divide-border rounded-2xl border border-border bg-surface">
            {NEED.map(({ Icon, t, b }) => (
              <li key={t} className="flex gap-4 p-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                  <Icon className="size-5" aria-hidden />
                </span>
                <span>
                  <span className="block font-semibold text-text">{t}</span>
                  <span className="mt-0.5 block text-sm text-muted">{b}</span>
                </span>
              </li>
            ))}
          </ul>
          <Alert tone="info" title="Your information is protected">
            We check your details with an approved identity provider. We don&apos;t store your BVN or NIN in full, and never use them for marketing.
          </Alert>
          <p className="flex gap-2 text-sm text-muted">
            <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
            You can stop at any time — your progress is saved.
          </p>
        </div>
        <StickyActions>
          <Button block href={ROUTES.details}>Start verification</Button>
        </StickyActions>
      </div>
    </AuthShell>
  );
}
