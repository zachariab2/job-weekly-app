"use client";

import { useState } from "react";

export function TailoredResumeButton({ recId }: { recId: number }) {
  const [loading, setLoading] = useState(false);

  function handleClick() {
    setLoading(true);
    // Reset after 30s — long enough to cover GPT + PDF render time
    setTimeout(() => setLoading(false), 30000);
  }

  return (
    <a
      href={`/api/resume/tailored?recId=${recId}`}
      onClick={handleClick}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs transition ${
        loading
          ? "border-[var(--accent-strong)]/30 bg-[var(--accent-strong)]/10 text-[var(--accent-strong)]/70 pointer-events-none"
          : "border-white/15 bg-white/[0.04] text-white/60 hover:border-[var(--accent-strong)]/40 hover:text-white/90 hover:bg-white/[0.07]"
      }`}
    >
      {loading ? (
        <>
          <svg className="animate-spin h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          Generating…
        </>
      ) : (
        <>
          <span>↓</span> Download tailored resume
        </>
      )}
    </a>
  );
}
