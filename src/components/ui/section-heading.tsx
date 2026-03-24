import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export function SectionHeading({
  eyebrow,
  title,
  description,
  className,
  ...props
}: {
  eyebrow?: string;
  title: string;
  description?: string;
} & HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("space-y-3", className)} {...props}>
      {eyebrow && (
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
          {eyebrow}
        </p>
      )}
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-white md:text-3xl">{title}</h2>
        {description && (
          <p className="max-w-2xl text-sm text-[var(--muted)] md:text-base">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
