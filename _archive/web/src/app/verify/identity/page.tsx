"use client";

import clsx from "clsx";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { CloudOff, Fingerprint, Landmark, ShieldCheck, UserX, UsersRound } from "lucide-react";
import { AuthShell, PageLoading, PageTitle, StickyActions } from "@/components/AuthShell";
import { Alert, Button, Checkbox, Field, Spinner, StatusHero } from "@/components/ui";
import { lookupIdentity } from "@/lib/api";
import { ROUTES, useApp, type IdType } from "@/lib/store";
import { useGuard } from "@/lib/useGuard";
import { toast } from "@/lib/toast";

const ID_OPTIONS: { type: IdType; title: string; body: string; dial: string; Icon: typeof Landmark }[] = [
  { type: "BVN", title: "Bank Verification Number", body: "The 11-digit number linked to your bank accounts.", dial: "Dial *565*0# from your registered line", Icon: Landmark },
  { type: "NIN", title: "National Identification Number", body: "The 11-digit number on your NIN slip or NIMC app.", dial: "Dial *346# from your registered line", Icon: Fingerprint },
];

type Failure = { code: string; message: string };

export default function Identity() {
  const router = useRouter();
  const kyc = useApp((s) => s.kyc);
  const [idType, setIdType] = useState<IdType>(kyc.idType ?? "BVN");
  const [number, setNumber] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [checking, setChecking] = useState(false);
  const [failure, setFailure] = useState<Failure | null>(null);
  const allowed = useGuard(ROUTES.identity, checking);

  const numberError = !submitted ? null : number.length === 0 ? `Enter your ${idType}.` : number.length !== 11 ? `Your ${idType} is 11 digits.` : null;

  const run = async (e?: FormEvent) => {
    e?.preventDefault();
    setSubmitted(true);
    if (number.length !== 11 || !consent) return;
    setFailure(null);
    setChecking(true);
    const res = await lookupIdentity(idType, number);
    if (res.ok) {
      router.push(ROUTES.identityConfirm);
      return;
    }
    setChecking(false);
    setFailure(res);
  };

  if (!allowed) return <PageLoading />;

  if (checking) {
    return (
      <AuthShell step="id">
        <CheckingState idType={idType} />
      </AuthShell>
    );
  }

  if (failure && failure.code !== "NOT_FOUND") {
    return (
      <AuthShell step="id" saveAndExit>
        <FailureState
          failure={failure}
          idType={idType}
          onRetry={() => run()}
          onEditDetails={() => router.push(ROUTES.details)}
          onSwitch={() => {
            setIdType(idType === "BVN" ? "NIN" : "BVN");
            setNumber("");
            setSubmitted(false);
            setFailure(null);
          }}
          onSupport={() => toast({ tone: "info", title: "Support case opened", body: "In the live app this opens a support case with your verification reference attached." })}
        />
      </AuthShell>
    );
  }

  return (
    <AuthShell step="id" back={ROUTES.details} saveAndExit>
      <PageTitle title="Verify with BVN or NIN">Choose one. We&apos;ll use it to confirm your name and date of birth.</PageTitle>
      <form onSubmit={run} noValidate className="flex flex-1 flex-col">
        <div className="space-y-5">
          <div role="radiogroup" aria-label="ID type" className="grid gap-3 sm:grid-cols-2">
            {ID_OPTIONS.map(({ type, title, body, Icon }) => {
              const active = idType === type;
              return (
                <button
                  type="button"
                  role="radio"
                  aria-checked={active}
                  aria-label={`${type} — ${title}`}
                  key={type}
                  onClick={() => { setIdType(type); setFailure(null); }}
                  className={clsx(
                    "flex gap-3 rounded-2xl border p-4 text-left transition-colors",
                    active ? "border-primary bg-primary-soft" : "border-border bg-surface hover:border-border-strong",
                  )}
                >
                  <span className={clsx("grid size-10 shrink-0 place-items-center rounded-xl", active ? "bg-primary text-on-primary" : "bg-surface-2 text-primary")}>
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-2 font-semibold text-text">
                      {type}
                      {type === "BVN" && <span className="rounded-full bg-success-soft px-2 py-0.5 text-[0.7rem] font-semibold text-success">Fastest</span>}
                    </span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-muted">{title}. {body}</span>
                  </span>
                </button>
              );
            })}
          </div>

          {failure?.code === "NOT_FOUND" && <Alert tone="danger" title="Number not found">{failure.message}</Alert>}

          <Field
            label={`Your ${idType}`}
            inputMode="numeric"
            autoComplete="off"
            placeholder="11 digits"
            value={number}
            maxLength={11}
            onChange={(e) => { setNumber(e.target.value.replace(/\D/g, "").slice(0, 11)); if (failure) setFailure(null); }}
            error={numberError}
            hint={ID_OPTIONS.find((o) => o.type === idType)!.dial}
            suffix={<span className="tabular-nums text-xs">{number.length}/11</span>}
            className="[&_input]:tracking-[0.2em]"
          />

          <div className="rounded-2xl border border-border bg-surface p-4">
            <Checkbox checked={consent} onChange={setConsent} error={submitted && !consent ? "We need your consent to check your details." : null}>
              I consent to Payzentra checking my {idType}, name, date of birth, phone number and photo with an approved identity
              provider to verify who I am, as described in the{" "}
              <a href="#privacy" className="font-medium text-primary hover:underline">Privacy Policy</a>.
            </Checkbox>
          </div>
        </div>
        <StickyActions>
          <Button type="submit" block>Verify {idType}</Button>
        </StickyActions>
      </form>
    </AuthShell>
  );
}

function CheckingState({ idType }: { idType: IdType }) {
  const steps = [`Connecting to ${idType} service`, "Matching your details", "Securing your record"];
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((x) => Math.min(x + 1, steps.length - 1)), 750);
    return () => clearInterval(t);
  }, [steps.length]);
  return (
    <div className="flex flex-1 flex-col justify-center py-12" aria-live="polite">
      <StatusHero tone="info" icon={<ShieldCheck className="size-10" />} title={`Checking your ${idType}`} pulse>
        This usually takes a few seconds. Please don&apos;t close this page.
      </StatusHero>
      <ul className="mx-auto mt-8 w-full max-w-xs space-y-3 text-sm">
        {steps.map((s, idx) => (
          <li key={s} className={clsx("flex items-center gap-3", idx <= i ? "text-text" : "text-subtle")}>
            {idx < i ? <span className="size-2 rounded-full bg-success" /> : idx === i ? <Spinner className="size-4 text-primary" /> : <span className="size-2 rounded-full bg-border-strong" />}
            {s}
          </li>
        ))}
      </ul>
    </div>
  );
}

function FailureState({
  failure,
  idType,
  onRetry,
  onEditDetails,
  onSwitch,
  onSupport,
}: {
  failure: Failure;
  idType: IdType;
  onRetry: () => void;
  onEditDetails: () => void;
  onSwitch: () => void;
  onSupport: () => void;
}) {
  const other = idType === "BVN" ? "NIN" : "BVN";
  if (failure.code === "MISMATCH") {
    return (
      <div className="flex flex-1 flex-col pt-6">
        <StatusHero tone="warning" icon={<UserX className="size-10" />} title="Your details don't match">
          {failure.message} Check you entered the phone number and date of birth registered with your {idType}.
        </StatusHero>
        <StickyActions>
          <Button block onClick={onEditDetails}>Check my details</Button>
          <Button block variant="secondary" onClick={onSwitch}>Try with {other} instead</Button>
        </StickyActions>
      </div>
    );
  }
  if (failure.code === "DUPLICATE_IDENTITY") {
    return (
      <div className="flex flex-1 flex-col pt-6">
        <StatusHero tone="danger" icon={<UsersRound className="size-10" />} title="This identity is already in use">
          {failure.message} If you&apos;ve opened an account before, log in to it. If you think this is a mistake, contact support and we&apos;ll look into it.
        </StatusHero>
        <StickyActions>
          <Button block href="/login">Log in to my other account</Button>
          <Button block variant="secondary" onClick={onSupport}>Contact support</Button>
        </StickyActions>
      </div>
    );
  }
  return (
    <div className="flex flex-1 flex-col pt-6">
      <StatusHero tone="warning" icon={<CloudOff className="size-10" />} title="Verification is temporarily unavailable">
        {failure.message}
      </StatusHero>
      <StickyActions>
        <Button block onClick={onRetry}>Try again</Button>
        <Button block variant="secondary" onClick={onSwitch}>Use {other} instead</Button>
      </StickyActions>
    </div>
  );
}
