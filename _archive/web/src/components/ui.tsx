"use client";

import clsx from "clsx";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  EyeOff,
  Info,
  Loader2,
  XCircle,
} from "lucide-react";
import {
  forwardRef,
  useId,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
} from "react";

// ---------- Logo ----------

export function Logo({ className, wordmark = true }: { className?: string; wordmark?: boolean }) {
  const gid = useId();
  return (
    <span className={clsx("inline-flex items-center gap-2.5", className)}>
      <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true">
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#8b7bff" />
            <stop offset="1" stopColor="#3c3fd8" />
          </linearGradient>
        </defs>
        <path d="M5 4h8l10 12-10 12H5l10-12z" fill={`url(#${gid})`} />
        <path d="M14 4h6l9 12-9 12h-6l9-12z" fill={`url(#${gid})`} opacity=".55" />
      </svg>
      {wordmark && (
        <span className="font-display text-[1.2rem] font-bold tracking-tight text-text">
          Payzentra
        </span>
      )}
    </span>
  );
}

export function NgFlag({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 3 2" className={clsx("inline-block h-3.5 w-5 rounded-[2px]", className)} role="img" aria-label="Nigeria">
      <rect width="3" height="2" fill="#fff" />
      <rect width="1" height="2" fill="#008751" />
      <rect x="2" width="1" height="2" fill="#008751" />
    </svg>
  );
}

// ---------- Button ----------

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "md" | "lg" | "sm";
  loading?: boolean;
  block?: boolean;
  href?: string;
};

const btnBase =
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 select-none";
const btnVariants = {
  primary:
    "bg-primary text-on-primary hover:bg-primary-hover shadow-[0_8px_24px_-10px_var(--primary)]",
  secondary: "bg-surface-2 text-text border border-border hover:border-border-strong",
  ghost: "text-primary hover:bg-primary-soft",
  danger: "bg-danger text-white hover:opacity-90",
};
const btnSizes = { sm: "h-9 px-3 text-sm", md: "h-11 px-4 text-[0.95rem]", lg: "h-[52px] px-5 text-base" };

export function Button({
  variant = "primary",
  size = "lg",
  loading,
  block,
  href,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  const cls = clsx(btnBase, btnVariants[variant], btnSizes[size], block && "w-full", className);
  if (href) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <button className={cls} disabled={disabled || loading} aria-busy={loading} {...rest}>
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

// ---------- Text input ----------

type FieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "prefix"> & {
  label: string;
  hint?: ReactNode;
  error?: string | null;
  prefix?: ReactNode;
  suffix?: ReactNode;
  locked?: boolean;
};

export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field(
  { label, hint, error, prefix, suffix, className, id, locked, ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const describedBy = error ? `${inputId}-err` : hint ? `${inputId}-hint` : undefined;
  return (
    <div className={clsx("flex flex-col gap-1.5", className)}>
      <label htmlFor={inputId} className="text-sm font-medium text-text">
        {label}
      </label>
      <div
        className={clsx(
          "flex h-12 items-center gap-2 rounded-xl border bg-bg-elevated px-3.5 transition-colors focus-within:border-primary",
          error ? "border-danger" : "border-border",
          locked && "opacity-80",
        )}
      >
        {prefix && <span className="shrink-0 text-muted">{prefix}</span>}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          readOnly={locked}
          className="h-full min-w-0 flex-1 bg-transparent text-[0.95rem] text-text outline-none placeholder:text-subtle"
          {...rest}
        />
        {suffix && <span className="shrink-0 text-muted">{suffix}</span>}
      </div>
      {error ? (
        <p id={`${inputId}-err`} className="flex items-center gap-1.5 text-sm text-danger" role="alert">
          <XCircle className="size-4 shrink-0" aria-hidden /> {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="text-sm text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
});

export function PasswordField(props: Omit<FieldProps, "type" | "suffix">) {
  const [show, setShow] = useState(false);
  return (
    <Field
      {...props}
      type={show ? "text" : "password"}
      suffix={
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="grid size-8 place-items-center rounded-lg text-muted hover:text-text"
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
        </button>
      }
    />
  );
}

export function SelectField({
  label,
  error,
  options,
  placeholder,
  ...rest
}: Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> & {
  label: string;
  error?: string | null;
  options: string[];
  placeholder: string;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-text">
        {label}
      </label>
      <select
        id={id}
        aria-invalid={!!error}
        className={clsx(
          "h-12 rounded-xl border bg-bg-elevated px-3 text-[0.95rem] text-text outline-none focus:border-primary",
          error ? "border-danger" : "border-border",
        )}
        {...rest}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      {error && (
        <p className="flex items-center gap-1.5 text-sm text-danger" role="alert">
          <XCircle className="size-4" aria-hidden /> {error}
        </p>
      )}
    </div>
  );
}

// ---------- Checkbox ----------

export function Checkbox({
  checked,
  onChange,
  children,
  error,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  children: ReactNode;
  error?: string | null;
}) {
  const id = useId();
  return (
    <div>
      <div className="flex items-start gap-3">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5 size-5 shrink-0 cursor-pointer rounded-md accent-[var(--primary)]"
        />
        <label htmlFor={id} className="cursor-pointer text-sm leading-relaxed text-muted">
          {children}
        </label>
      </div>
      {error && (
        <p className="mt-1.5 pl-8 text-sm text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

// ---------- Alert ----------

const alertTones = {
  info: { cls: "bg-info-soft text-info", Icon: Info },
  success: { cls: "bg-success-soft text-success", Icon: CheckCircle2 },
  warning: { cls: "bg-warning-soft text-warning", Icon: AlertTriangle },
  danger: { cls: "bg-danger-soft text-danger", Icon: XCircle },
};

export function Alert({
  tone = "info",
  title,
  children,
  action,
}: {
  tone?: keyof typeof alertTones;
  title?: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  const { cls, Icon } = alertTones[tone];
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={clsx("flex gap-3 rounded-xl px-4 py-3 animate-fade-up", cls)}
    >
      <Icon className="mt-0.5 size-5 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1 text-sm">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className="mt-0.5 leading-relaxed text-text/85">{children}</div>}
        {action && <div className="mt-2">{action}</div>}
      </div>
    </div>
  );
}

// ---------- Card ----------

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={clsx("rounded-2xl border border-border bg-surface p-4", className)}>{children}</div>
  );
}

// ---------- Status hero (success / pending / failure screens) ----------

const heroTones = {
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  info: "bg-primary-soft text-primary",
};

export function StatusHero({
  tone,
  icon,
  title,
  children,
  pulse,
}: {
  tone: keyof typeof heroTones;
  icon: ReactNode;
  title: string;
  children?: ReactNode;
  pulse?: boolean;
}) {
  return (
    <div className="flex flex-col items-center text-center animate-fade-up">
      <div className="relative mb-6">
        {pulse && (
          <span
            className={clsx("absolute inset-0 rounded-full animate-pulse-ring", heroTones[tone])}
            aria-hidden
          />
        )}
        <div className={clsx("relative grid size-20 place-items-center rounded-full", heroTones[tone])}>
          {icon}
        </div>
      </div>
      <h1 className="font-display text-2xl font-bold tracking-tight text-text sm:text-[1.75rem]">
        {title}
      </h1>
      {children && <div className="mt-3 max-w-md text-[0.95rem] leading-relaxed text-muted">{children}</div>}
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={clsx("animate-spin", className)} aria-hidden />;
}
