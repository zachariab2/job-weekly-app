"use client";

import { useRef, useState } from "react";
import { addContactAction } from "./actions";

const input = "w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white placeholder:text-white/25 focus:border-white/25 focus:outline-none transition";

export function AddContactForm({ reportId, company, userName }: { reportId: string; company: string; userName: string }) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    await addContactAction(formData);
    formRef.current?.reset();
    setOpen(false);
    setPending(false);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-[var(--accent-strong)]/60 hover:text-[var(--accent-strong)] transition"
      >
        + Add contact
      </button>
    );
  }

  const defaultSnippet = `Hi [Name] — I'm ${userName}, a CS student applying for roles at ${company}. I came across your profile and would love to hear about your experience there. Would you be open to a quick 15-min chat?`;

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-2 pt-3 border-t border-white/5">
      <p className="text-[10px] uppercase tracking-widest text-white/25 mb-2">New contact — {company}</p>
      <input type="hidden" name="reportId" value={reportId} />
      <input type="hidden" name="company" value={company} />
      <div className="grid grid-cols-2 gap-2">
        <input name="name" required placeholder="Full name *" className={input} />
        <input name="role" placeholder="Their title (e.g. SWE)" className={input} />
        <input name="contactLinkedin" placeholder="LinkedIn URL" className={`${input} col-span-2`} />
        <input name="contactEmail" placeholder="Email (optional)" className={input} />
        <input name="connectionBasis" placeholder='e.g. Alumni — BU CS &apos;24' className={input} />
        <textarea
          name="outreachSnippet"
          defaultValue={defaultSnippet}
          rows={3}
          placeholder="Outreach message"
          className={`${input} col-span-2 resize-none`}
        />
      </div>
      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-[var(--accent-strong)] px-4 py-1.5 text-xs text-white disabled:opacity-50 transition"
        >
          {pending ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg border border-white/10 px-4 py-1.5 text-xs text-white/40 hover:text-white/70 transition"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
