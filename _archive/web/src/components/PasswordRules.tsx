import clsx from "clsx";
import { Check, Circle } from "lucide-react";
import { PASSWORD_RULES } from "@/lib/validation";

export function PasswordRules({ value, showErrors }: { value: string; showErrors?: boolean }) {
  return (
    <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2" aria-label="Password requirements">
      {PASSWORD_RULES.map((r) => {
        const ok = r.test(value);
        return (
          <li
            key={r.id}
            className={clsx(
              "flex items-center gap-2 text-[0.8rem]",
              ok ? "text-success" : showErrors ? "text-danger" : "text-muted",
            )}
          >
            {ok ? <Check className="size-3.5" strokeWidth={3} aria-hidden /> : <Circle className="size-3" aria-hidden />}
            <span>
              {r.label}
              <span className="sr-only">{ok ? " — met" : " — not met"}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
