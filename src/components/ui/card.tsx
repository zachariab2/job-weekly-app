import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-[var(--border)] bg-[var(--panel)]/80 p-6 shadow-[0_30px_80px_rgba(5,6,10,0.45)] backdrop-blur",
        className,
      )}
      {...props}
    />
  );
}
