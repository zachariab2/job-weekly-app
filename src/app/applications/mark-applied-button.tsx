"use client";

import { useState, useTransition } from "react";
import confetti from "canvas-confetti";
import { setApplicationStatusAction } from "./actions";

export function MarkAppliedButton({ company, role }: { company: string; role: string }) {
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleClick() {
    const fd = new FormData();
    fd.append("company", company);
    fd.append("role", role);
    fd.append("status", "applied");

    startTransition(async () => {
      await setApplicationStatusAction(fd);
      setDone(true);
      confetti({ particleCount: 60, spread: 55, origin: { y: 0.7 }, scalar: 0.8 });
    });
  }

  if (done) {
    return (
      <span className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-[var(--accent-strong)] font-medium animate-pulse">
        <span className="size-2 rounded-full shrink-0 bg-[var(--accent-strong)]" />
        Applied! Nice work
      </span>
    );
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={handleClick}
      className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-xs transition-all text-white/30 hover:text-[var(--accent-strong)] hover:bg-[var(--accent-strong)]/10 disabled:opacity-50"
    >
      <span className="size-2 rounded-full shrink-0 bg-[var(--accent-strong)]" />
      {pending ? "Saving…" : "Mark Applied →"}
    </button>
  );
}
