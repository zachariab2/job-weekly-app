"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { refreshReportAction } from "./actions";

export function RefreshReportButton({ label = "Refresh report" }: { label?: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await refreshReportAction();
      if (result.error) {
        setError(result.error);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={pending}
        onClick={handleClick}
        className="rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm text-white/70 hover:bg-white/10 hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {pending ? "Generating… this takes ~30 seconds" : label}
      </button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
