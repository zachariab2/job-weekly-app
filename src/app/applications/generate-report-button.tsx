"use client";

import { useTransition } from "react";
import { generateReportAction } from "./actions";

export function GenerateReportButton() {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => generateReportAction())}
      className="rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm text-white/70 hover:bg-white/10 hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {pending ? "Generating your jobs… this takes ~30 seconds" : "Generate my first report"}
    </button>
  );
}
