"use client";

import clsx from "clsx";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Camera, CameraOff, CheckCircle2, Glasses, Lightbulb, ScanFace, UserRoundX } from "lucide-react";
import { AuthShell, PageLoading, PageTitle, StickyActions } from "@/components/AuthShell";
import { Alert, Button, StatusHero } from "@/components/ui";
import { MAX_LIVENESS_ATTEMPTS, submitLiveness } from "@/lib/api";
import { ROUTES, useApp } from "@/lib/store";
import { useGuard } from "@/lib/useGuard";

type Stage = "intro" | "starting" | "denied" | "nocamera" | "capture" | "processing" | "failed" | "passed" | "manual";

// Oval outline starting at the top, so the progress ring fills clockwise from 12 o'clock.
const OVAL = "M50 1.5 A48.5 65 0 1 1 50 131.5 A48.5 65 0 1 1 50 1.5";

const PROMPTS = [
  "Position your face inside the oval",
  "Hold still",
  "Slowly turn your head to the left",
  "Now back to the centre",
  "Blink once",
];

export default function Selfie() {
  const router = useRouter();
  const cameraMode = useApp((s) => s.scenarios.camera);
  const attemptsUsed = useApp((s) => s.kyc.livenessAttempts);
  const [stage, setStage] = useState<Stage>("intro");
  const [prompt, setPrompt] = useState(0);
  const [attemptsLeft, setAttemptsLeft] = useState(MAX_LIVENESS_ATTEMPTS - attemptsUsed);
  const [handoffQr, setHandoffQr] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const hold = stage === "processing" || stage === "passed" || stage === "manual";
  const allowed = useGuard(ROUTES.selfie, hold);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => stopCamera, [stopCamera]);

  const startCamera = async () => {
    setPrompt(0);
    if (cameraMode === "simulated") {
      setStage("capture");
      return;
    }
    setStage("starting");
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw Object.assign(new Error(), { name: "NotFoundError" });
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: 720, height: 720 }, audio: false });
      streamRef.current = stream;
      setStage("capture");
    } catch (err) {
      const name = (err as Error).name;
      if (name === "NotAllowedError" || name === "SecurityError") setStage("denied");
      else {
        setHandoffQr(await QRCode.toDataURL(window.location.href, { margin: 1, width: 280 }));
        setStage("nocamera");
      }
    }
  };

  // Attach the live stream once the <video> is on screen.
  useEffect(() => {
    if (stage === "capture" && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [stage]);

  // Walk through the liveness prompts, then submit.
  useEffect(() => {
    if (stage !== "capture") return;
    const t = setTimeout(() => {
      if (prompt < PROMPTS.length - 1) {
        setPrompt(prompt + 1);
        return;
      }
      setPrompt(PROMPTS.length);
      stopCamera();
      setStage("processing");
      submitLiveness().then((res) => {
        if (res.ok) setStage("passed");
        else if (res.code === "MANUAL_REVIEW") setStage("manual");
        else {
          setAttemptsLeft(res.attemptsLeft ?? 0);
          setStage("failed");
        }
      });
    }, prompt === 0 ? 1800 : 1400);
    return () => clearTimeout(t);
  }, [stage, prompt, stopCamera]);

  if (!allowed) return <PageLoading />;

  if (stage === "capture" || stage === "starting") {
    const progress = Math.min(prompt / PROMPTS.length, 1);
    return (
      <AuthShell step="selfie" back={() => { stopCamera(); setStage("intro"); }}>
        <div className="flex flex-1 flex-col items-center pt-2">
          <p className="mb-5 min-h-14 text-center font-display text-xl font-bold text-text" aria-live="assertive">
            {stage === "starting" ? "Starting camera…" : PROMPTS[Math.min(prompt, PROMPTS.length - 1)]}
          </p>
          <div className="relative aspect-[3/4] w-full max-w-[320px]">
            <div className="absolute inset-0 overflow-hidden rounded-[50%] bg-surface-2">
              {cameraMode === "simulated" ? (
                <SimulatedFeed turn={prompt === 2} />
              ) : (
                <video ref={videoRef} playsInline muted className="size-full -scale-x-100 object-cover" aria-label="Live camera preview" />
              )}
              <div className="absolute inset-x-6 h-0.5 bg-primary/70 shadow-[0_0_16px_var(--primary)] animate-scan" aria-hidden />
            </div>
            <svg viewBox="0 0 100 133" className="absolute inset-0 size-full" aria-hidden>
              <path d={OVAL} fill="none" stroke="var(--border)" strokeWidth="1.5" />
              <path
                d={OVAL} fill="none" stroke="var(--success)" strokeWidth="2.5"
                pathLength={100} strokeDasharray={`${progress * 100} 100`} strokeLinecap="round"
                className="transition-[stroke-dasharray] duration-700"
              />
            </svg>
          </div>
          <p className="mt-6 text-center text-sm text-muted">Keep your face in the oval until the ring is complete.</p>
          {cameraMode === "simulated" && (
            <p className="mt-2 rounded-full bg-warning-soft px-3 py-1 text-xs font-semibold text-warning">Demo: simulated camera</p>
          )}
        </div>
      </AuthShell>
    );
  }

  if (stage === "processing") {
    return (
      <AuthShell step="selfie">
        <div className="flex flex-1 flex-col justify-center py-12">
          <StatusHero tone="info" icon={<ScanFace className="size-10" />} title="Checking it's really you" pulse>
            We&apos;re comparing your selfie with your ID photo. This takes a few seconds.
          </StatusHero>
        </div>
      </AuthShell>
    );
  }

  if (stage === "passed") {
    return (
      <AuthShell step="selfie">
        <div className="flex flex-1 flex-col pt-10">
          <StatusHero tone="success" icon={<CheckCircle2 className="size-10" />} title="Selfie confirmed">
            Your face matches your ID. One last step — your home address.
          </StatusHero>
          <StickyActions>
            <Button block onClick={() => router.push(ROUTES.address)}>Continue</Button>
          </StickyActions>
        </div>
      </AuthShell>
    );
  }

  if (stage === "manual") {
    return (
      <AuthShell step="selfie">
        <div className="flex flex-1 flex-col pt-10">
          <StatusHero tone="warning" icon={<UserRoundX className="size-10" />} title="We'll review your selfie">
            We couldn&apos;t confirm your selfie automatically after {MAX_LIVENESS_ATTEMPTS} tries, so a member of our team will check it.
            This usually takes up to 24 hours. We&apos;ll email you when it&apos;s done.
          </StatusHero>
          <StickyActions>
            <Button block onClick={() => router.push(ROUTES.status)}>See verification status</Button>
          </StickyActions>
        </div>
      </AuthShell>
    );
  }

  if (stage === "failed") {
    return (
      <AuthShell step="selfie" saveAndExit>
        <div className="flex flex-1 flex-col pt-6">
          <StatusHero tone="danger" icon={<UserRoundX className="size-10" />} title="We couldn't match your face">
            This can happen with poor lighting or if your face is partly covered.
          </StatusHero>
          <div className="mt-6 space-y-3">
            <Tips />
            <Alert tone="warning">
              You have {attemptsLeft} attempt{attemptsLeft === 1 ? "" : "s"} left. After that, our team will review your selfie manually.
            </Alert>
          </div>
          <StickyActions>
            <Button block onClick={startCamera}>Try again</Button>
          </StickyActions>
        </div>
      </AuthShell>
    );
  }

  if (stage === "denied") {
    return (
      <AuthShell step="selfie" back={() => setStage("intro")} saveAndExit>
        <div className="flex flex-1 flex-col pt-6">
          <StatusHero tone="warning" icon={<CameraOff className="size-10" />} title="Allow camera access">
            We need your camera to take a live selfie. Photo uploads aren&apos;t accepted, to protect you from impersonation.
          </StatusHero>
          <ol className="mt-6 list-decimal space-y-2 rounded-2xl border border-border bg-surface p-4 pl-9 text-sm text-muted">
            <li>Tap the camera or lock icon in your browser&apos;s address bar.</li>
            <li>Set <b className="text-text">Camera</b> to <b className="text-text">Allow</b>.</li>
            <li>Come back here and tap Try again.</li>
          </ol>
          <StickyActions>
            <Button block onClick={startCamera}>Try again</Button>
          </StickyActions>
        </div>
      </AuthShell>
    );
  }

  if (stage === "nocamera") {
    return (
      <AuthShell step="selfie" back={() => setStage("intro")} saveAndExit>
        <div className="flex flex-1 flex-col pt-4">
          <PageTitle title="No camera found">
            Continue on your phone instead. Scan this code with your phone&apos;s camera and log in — you&apos;ll pick up right here.
          </PageTitle>
          {handoffQr && (
            <div className="mx-auto rounded-2xl bg-white p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={handoffQr} alt="QR code to continue verification on your phone" className="size-48" />
            </div>
          )}
          <StickyActions>
            <Button block onClick={startCamera}><Camera className="size-4" /> I&apos;ve connected a camera</Button>
          </StickyActions>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell step="selfie" back={ROUTES.identityConfirm} saveAndExit>
      <div className="mb-6 grid size-14 place-items-center rounded-2xl bg-primary-soft text-primary">
        <ScanFace className="size-7" aria-hidden />
      </div>
      <PageTitle title="Take a quick selfie">
        We&apos;ll ask you to follow a few simple movements to check you&apos;re a real person and match you to your ID photo.
      </PageTitle>
      <div className="flex flex-1 flex-col">
        <div className="space-y-4">
          <Tips />
          <Alert tone="info">
            Camera only — uploaded photos aren&apos;t accepted.
          </Alert>
        </div>
        <StickyActions>
          <Button block onClick={startCamera}><Camera className="size-5" /> Open camera</Button>
        </StickyActions>
      </div>
    </AuthShell>
  );
}

function Tips() {
  return (
    <ul className="grid gap-3 sm:grid-cols-3">
      {[
        { Icon: Lightbulb, t: "Find good light", b: "Face a window or lamp." },
        { Icon: Glasses, t: "Uncover your face", b: "Remove glasses, hats and masks." },
        { Icon: ScanFace, t: "Just you", b: "No one else in the frame." },
      ].map(({ Icon, t, b }) => (
        <li key={t} className="flex gap-3 rounded-2xl border border-border bg-surface p-3.5 sm:flex-col sm:gap-2">
          <Icon className="size-5 shrink-0 text-primary" aria-hidden />
          <span className="text-sm">
            <span className="block font-semibold text-text">{t}</span>
            <span className="text-muted">{b}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

function SimulatedFeed({ turn }: { turn: boolean }) {
  return (
    <div className="relative size-full bg-gradient-to-b from-[#2a2f55] to-[#151a33]" aria-label="Simulated camera preview">
      <svg viewBox="0 0 120 160" className={clsx("absolute inset-0 size-full transition-transform duration-700", turn && "translate-x-2 -skew-y-2")} aria-hidden>
        <ellipse cx="60" cy="68" rx="30" ry="38" fill="#c08b6a" />
        <path d="M30 60c0-26 14-38 30-38s30 12 30 38c-6-12-16-18-30-18S36 48 30 60z" fill="#1d1410" />
        <ellipse cx="48" cy="70" rx="3.5" ry="2.5" fill="#1d1410" />
        <ellipse cx="72" cy="70" rx="3.5" ry="2.5" fill="#1d1410" />
        <path d="M52 90q8 6 16 0" stroke="#7a4a35" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M14 160c4-30 22-44 46-44s42 14 46 44z" fill="#3b46a8" />
      </svg>
    </div>
  );
}
