"use client";

import { useRef, useState } from "react";
import { updateContactAction } from "./actions";

const input = "w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white placeholder:text-white/25 focus:border-white/25 focus:outline-none transition";

type Contact = {
  id: number;
  name: string | null;
  role: string | null;
  contactLinkedin: string | null;
  contactEmail: string | null;
  connectionBasis: string | null;
  outreachSnippet: string | null;
};

export function EditContactForm({ contact }: { contact: Contact }) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    await updateContactAction(formData);
    setOpen(false);
    setPending(false);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-[11px] text-white/30 hover:text-white/60 transition px-2 py-1"
      >
        Edit
      </button>
    );
  }

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-2 pt-3 border-t border-white/5 mt-2">
      <p className="text-[10px] uppercase tracking-widest text-white/25 mb-2">Edit contact</p>
      <input type="hidden" name="contactId" value={contact.id} />
      <div className="grid grid-cols-2 gap-2">
        <input name="name" required defaultValue={contact.name ?? ""} placeholder="Full name *" className={input} />
        <input name="role" defaultValue={contact.role ?? ""} placeholder="Their title" className={input} />
        <input name="contactLinkedin" defaultValue={contact.contactLinkedin ?? ""} placeholder="LinkedIn URL" className={`${input} col-span-2`} />
        <input name="contactEmail" defaultValue={contact.contactEmail ?? ""} placeholder="Email (optional)" className={input} />
        <input name="connectionBasis" defaultValue={contact.connectionBasis ?? ""} placeholder="e.g. Alumni — BU CS '24" className={input} />
        <textarea
          name="outreachSnippet"
          defaultValue={contact.outreachSnippet ?? ""}
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
