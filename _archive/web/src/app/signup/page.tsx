"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Mail } from "lucide-react";
import { AuthShell, PageTitle, StickyActions } from "@/components/AuthShell";
import { PasswordRules } from "@/components/PasswordRules";
import { Alert, Button, Checkbox, Field, NgFlag, PasswordField } from "@/components/ui";
import { register } from "@/lib/api";
import { ROUTES } from "@/lib/store";
import { isEmail, passwordOk } from "@/lib/validation";

export default function SignUp() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [terms, setTerms] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [duplicate, setDuplicate] = useState<string | null>(null);

  const emailError =
    (emailTouched || submitted) && !email.trim()
      ? "Enter your email address."
      : (emailTouched || submitted) && !isEmail(email)
        ? "Enter a valid email address, like name@example.com."
        : null;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setDuplicate(null);
    if (!isEmail(email) || !passwordOk(password) || !terms) return;
    setLoading(true);
    const res = await register(email.trim(), password);
    setLoading(false);
    if (!res.ok) return setDuplicate(res.message);
    router.push(ROUTES.verifyEmail);
  };

  return (
    <AuthShell step="create" back="/">
      <PageTitle title="Create your account">
        Start with your email. You&apos;ll verify your identity with your BVN or NIN in a later step.
      </PageTitle>

      <form onSubmit={onSubmit} noValidate className="flex flex-1 flex-col">
        <div className="space-y-5">
          {duplicate && (
            <Alert
              tone="warning"
              title="You may already have an account"
              action={
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm font-semibold">
                  <Link href="/login" className="text-primary underline-offset-2 hover:underline">Log in instead</Link>
                  <Link href={`/forgot-password?email=${encodeURIComponent(email)}`} className="text-primary underline-offset-2 hover:underline">
                    Reset password
                  </Link>
                </div>
              }
            >
              {duplicate}
            </Alert>
          )}

          <Field
            label="Email address"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setEmailTouched(true)}
            error={emailError}
            prefix={<Mail className="size-[18px]" />}
            autoFocus
          />

          <div className="space-y-3">
            <PasswordField
              label="Create a password"
              autoComplete="new-password"
              placeholder="Create a strong password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={submitted && !password ? "Create a password." : submitted && !passwordOk(password) ? "Your password doesn't meet all the requirements below." : null}
            />
            <PasswordRules value={password} showErrors={submitted} />
          </div>

          <div className="rounded-xl border border-border bg-surface px-4 py-3 text-sm">
            <span className="text-muted">Country of residence</span>
            <p className="mt-0.5 flex items-center gap-2 font-medium text-text"><NgFlag /> Nigeria</p>
          </div>

          <Checkbox checked={terms} onChange={setTerms} error={submitted && !terms ? "You need to accept the terms to continue." : null}>
            I agree to Payzentra&apos;s <a href="#terms" className="font-medium text-primary hover:underline">Terms of Use</a> and{" "}
            <a href="#privacy" className="font-medium text-primary hover:underline">Privacy Policy</a>, and confirm I&apos;m 18 or older.
          </Checkbox>
        </div>

        <StickyActions>
          <Button type="submit" block loading={loading}>
            {loading ? "Creating account…" : "Create account"}
          </Button>
          <p className="text-center text-sm text-muted">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-primary hover:underline">Log in</Link>
          </p>
        </StickyActions>
      </form>
    </AuthShell>
  );
}
