"use client";

import { useRef, useState } from "react";
import { uploadResumeAction } from "@/app/onboarding/actions";

export function ResumeUploadButton({ hasResume }: { hasResume: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<"idle" | "uploading" | "done" | "error">("idle");

  async function handleFile(file: File | null) {
    if (!file) return;
    setState("uploading");
    const fd = new FormData();
    fd.append("resume", file);
    const result = await uploadResumeAction(fd);
    if (result?.status === "error") {
      setState("error");
    } else {
      setState("done");
      // Refresh to update the "Resume on file" text
      window.location.reload();
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={state === "uploading"}
        className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10 transition disabled:opacity-50"
      >
        {state === "uploading" ? "Uploading…" : state === "done" ? "Uploaded ✓" : state === "error" ? "Failed — try again" : hasResume ? "Replace" : "Upload resume"}
      </button>
    </>
  );
}
