import { AppShell } from "@/components/layout/app-shell";
import { requireOwner } from "@/lib/auth/session";
import { addManualContactAction, deleteManualContactAction, getManualContacts, updateManualContactAction } from "./actions";
import Link from "next/link";

export default async function AdminContactsPage() {
  const owner = await requireOwner();
  const contacts = await getManualContacts();

  return (
    <AppShell active="/settings" user={owner}>
      <div className="space-y-5">
        <div>
          <Link href="/admin/users" className="text-xs text-white/50 hover:text-white/80">← Back to admin users</Link>
          <h1 className="text-2xl font-semibold text-white mt-2">Manual Contacts (Client Ops)</h1>
          <p className="text-sm text-white/50 mt-1">Add/edit contacts that get merged into client job recommendations.</p>
        </div>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
          <h2 className="text-sm text-white font-semibold">Add contact</h2>
          <form action={addManualContactAction} className="grid md:grid-cols-2 gap-2">
            <Input name="company" placeholder="Company" required />
            <Input name="role" placeholder="Role (optional exact match)" />
            <Input name="name" placeholder="Contact name" required />
            <Input name="connectionBasis" placeholder="Connection basis" />
            <Input name="contactEmail" placeholder="Email" />
            <Input name="contactLinkedin" placeholder="LinkedIn URL" />
            <div className="md:col-span-2">
              <button type="submit" className="rounded-lg border border-emerald-300/40 px-3 py-2 text-sm text-emerald-100 hover:bg-emerald-500/20">Add</button>
            </div>
          </form>
        </section>

        <section className="space-y-3">
          {contacts.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/50">No manual contacts yet.</div>
          ) : (
            contacts.map((c) => (
              <div key={c.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
                <form action={updateManualContactAction} className="grid md:grid-cols-2 gap-2">
                  <input type="hidden" name="id" value={c.id} />
                  <Input name="company" defaultValue={c.company} required />
                  <Input name="role" defaultValue={c.role ?? ""} />
                  <Input name="name" defaultValue={c.name} required />
                  <Input name="connectionBasis" defaultValue={c.connectionBasis ?? ""} />
                  <Input name="contactEmail" defaultValue={c.contactEmail ?? ""} />
                  <Input name="contactLinkedin" defaultValue={c.contactLinkedin ?? ""} />
                  <div className="md:col-span-2 flex gap-2">
                    <button type="submit" className="rounded-lg border border-white/20 px-3 py-2 text-sm text-white/80 hover:bg-white/10">Save</button>
                  </div>
                </form>
                <form action={deleteManualContactAction}>
                  <input type="hidden" name="id" value={c.id} />
                  <button type="submit" className="rounded-lg border border-red-300/40 px-3 py-2 text-sm text-red-200 hover:bg-red-500/20">Delete</button>
                </form>
              </div>
            ))
          )}
        </section>
      </div>
    </AppShell>
  );
}

function Input({ name, defaultValue, placeholder, required }: { name: string; defaultValue?: string; placeholder?: string; required?: boolean }) {
  return (
    <input
      name={name}
      defaultValue={defaultValue}
      placeholder={placeholder}
      required={required}
      className="w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-white"
    />
  );
}
