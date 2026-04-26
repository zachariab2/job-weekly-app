"use client";

import { useState } from "react";

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; changes: string[]; blobUrl: string; filename: string }
  | { status: "error"; message: string };

export function TailoredResumeButton({ recId, company }: { recId: number; company: string }) {
  const [state, setState] = useState<State>({ status: "idle" });

  async function handleClick() {
    if (state.status === "loading") return;

    if (state.status === "done") {
      const a = document.createElement("a");
      a.href = state.blobUrl;
      a.download = state.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }

    setState({ status: "loading" });

    try {
      const res = await fetch(`/api/resume/tailored?recId=${recId}`);

      if (!res.ok) {
        const msg = await res.text();
        setState({ status: "error", message: msg });
        return;
      }

      // Read changes from response header
      const changesHeader = res.headers.get("x-resume-changes");
      let changes: string[] = [];
      try { if (changesHeader) changes = JSON.parse(changesHeader); } catch {}

      // Trigger file download from the response blob
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const disposition = res.headers.get("content-disposition") ?? "";
      const match = disposition.match(/filename="([^"]+)"/);
      const filename = match?.[1] ?? `Resume - ${company}.pdf`;
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setState({ status: "done", changes, blobUrl: url, filename });
    } catch {
      setState({ status: "error", message: "Something went wrong. Try again." });
    }
  }

  return (
    <div className="space-y-2.5">
      <button
        onClick={handleClick}
        disabled={state.status === "loading"}
        className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs transition ${
          state.status === "loading"
            ? "border-[var(--accent-strong)]/30 bg-[var(--accent-strong)]/10 text-[var(--accent-strong)]/70 cursor-not-allowed"
            : state.status === "done"
            ? "border-white/10 bg-white/[0.04] text-white/40 hover:text-white/60 hover:border-white/20"
            : "border-white/15 bg-white/[0.04] text-white/60 hover:border-[var(--accent-strong)]/40 hover:text-white/90 hover:bg-white/[0.07]"
        }`}
      >
        {state.status === "loading" ? (
          <>
            <svg className="animate-spin h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            Tailoring…
          </>
        ) : state.status === "done" ? (
          <><span>↓</span> Download again</>
        ) : (
          <><span>✦</span> Tailor resume</>
        )}
      </button>

      {state.status === "idle" && (
        <p className="text-[11px] text-white/20 leading-relaxed">
          Generates a rewritten PDF tailored to this role.
        </p>
      )}

      {state.status === "done" && state.changes.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-widest text-white/25 mb-1.5">Why we changed it</p>
          <ul className="space-y-1.5">
            {state.changes.map((c, i) => (
              <li key={i} className="flex gap-2 text-xs text-white/55 leading-relaxed">
                <span className="text-[var(--accent-strong)] shrink-0 mt-0.5">·</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {state.status === "error" && (
        <p className="text-xs text-red-400/70 leading-relaxed">{state.message}</p>
      )}
    </div>
  );
}
