import { cn } from "@/lib/utils";

export function Progress({ value }: { value: number }) {
  return (
    <div className="h-2 w-full rounded-full bg-white/5">
      <div
        className={cn(
          "h-2 rounded-full bg-gradient-to-r from-[var(--accent-soft)] to-[var(--accent-strong)] transition-all",
        )}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}
