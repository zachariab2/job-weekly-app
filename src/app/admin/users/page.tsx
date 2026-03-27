import Link from "next/link";
import { desc } from "drizzle-orm";
import { AppShell } from "@/components/layout/app-shell";
import { db, users } from "@/lib/db";
import { requireOwner } from "@/lib/auth/session";

export default async function AdminUsersPage() {
  const owner = await requireOwner();
  const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));

  return (
    <AppShell active="/settings" user={owner}>
      <div className="space-y-6">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">Admin</p>
            <h1 className="text-3xl font-semibold text-white">Client Users</h1>
            <p className="text-sm text-white/50 mt-1">Head-user view: edit client profile and job search inputs.</p>
          </div>
          <Link href="/admin/contacts" className="rounded-lg border border-white/20 px-3 py-2 text-xs text-white/70 hover:bg-white/10">
            Edit contacts
          </Link>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
          {allUsers.map((u) => (
            <div key={u.id} className="flex items-center justify-between px-4 py-3 border-b border-white/5 last:border-b-0">
              <div>
                <p className="text-sm text-white font-medium">{u.firstName ?? ""} {u.lastName ?? ""}</p>
                <p className="text-xs text-white/50">{u.email}</p>
              </div>
              <Link href={`/admin/users/${u.id}`} className="text-xs rounded-lg border border-white/20 px-3 py-1.5 text-white/70 hover:text-white hover:bg-white/10">
                Edit
              </Link>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
