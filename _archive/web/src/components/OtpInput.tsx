"use client";

import clsx from "clsx";
import { useEffect, useRef, type ClipboardEvent, type KeyboardEvent } from "react";

/** Six single-digit boxes that behave like one field (typing, backspace, paste). */
export function OtpInput({
  value,
  onChange,
  onComplete,
  length = 6,
  error,
  disabled,
  label = "Verification code",
  autoFocus = true,
}: {
  value: string;
  onChange: (v: string) => void;
  onComplete?: (v: string) => void;
  length?: number;
  error?: boolean;
  disabled?: boolean;
  label?: string;
  autoFocus?: boolean;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length }, (_, i) => value[i] ?? "");
  // Latest value, updated synchronously so fast typing doesn't read a stale render.
  const valueRef = useRef(value);
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const update = (next: string) => {
    const clean = next.replace(/\D/g, "").slice(0, length);
    valueRef.current = clean;
    onChange(clean);
    if (clean.length === length) onComplete?.(clean);
    return clean;
  };

  const handleInput = (i: number, raw: string) => {
    const typed = raw.replace(/\D/g, "");
    if (!typed) return;
    // Autofill can drop the whole code into one box.
    if (typed.length > 2) {
      const next = update(typed);
      refs.current[Math.min(next.length, length - 1)]?.focus();
      return;
    }
    const cur = valueRef.current;
    const pos = Math.min(i, cur.length);
    const next = update(cur.slice(0, pos) + typed.slice(-1) + cur.slice(pos + 1));
    refs.current[Math.min(next.length, length - 1)]?.focus();
  };

  const handleKey = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const arr = Array.from({ length }, (_, k) => valueRef.current[k] ?? "");
      if (arr[i]) arr[i] = "";
      else if (i > 0) {
        arr[i - 1] = "";
        refs.current[i - 1]?.focus();
      }
      update(arr.join(""));
    } else if (e.key === "ArrowLeft" && i > 0) refs.current[i - 1]?.focus();
    else if (e.key === "ArrowRight" && i < length - 1) refs.current[i + 1]?.focus();
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const next = update(e.clipboardData.getData("text"));
    refs.current[Math.min(next.length, length - 1)]?.focus();
  };

  return (
    <div role="group" aria-label={label} className="flex justify-between gap-2 sm:gap-3">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          value={d}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          aria-label={`Digit ${i + 1} of ${length}`}
          autoFocus={autoFocus && i === 0}
          disabled={disabled}
          onChange={(e) => handleInput(i, e.target.value)}
          onKeyDown={(e) => handleKey(i, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          className={clsx(
            "h-14 w-full min-w-0 max-w-14 rounded-xl border bg-bg-elevated text-center font-display text-xl font-semibold text-text outline-none transition-colors focus:border-primary disabled:opacity-50",
            error ? "border-danger" : d ? "border-border-strong" : "border-border",
          )}
        />
      ))}
    </div>
  );
}
