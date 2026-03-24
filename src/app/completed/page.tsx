import { AppShell } from "@/components/layout/app-shell";
import { requireActiveUser } from "@/lib/auth/session";
import { db, applications } from "@/lib/db";
import { desc, eq, inArray } from "drizzle-orm";

export default async function CompletedPage() {
  const user = await requireActiveUser();

  const done = await db
    .select()
    .from(applications)
    .where(inArray(applications.status, ["applied", "done"]) && eq(applications.userId, user.id))
    .orderBy(desc(applications.updatedAt));

  return (
    <AppShell active="/completed" user={user}>
      <div>
        <h1 className="text-2xl font-semibold text-white">Completed</h1>
        <p className="mt-1 text-sm text-white/50">{done.length} application{done.length !== 1 ? "s" : ""} sent</p>
      </div>

      {done.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-12 text-center">
          <p className="text-white/40 text-sm">No applications marked as applied yet.</p>
          <p className="text-white/25 text-xs mt-1">Mark roles as &quot;Applied&quot; from the Applications page.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Table header */}
          <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr] gap-4 px-4 text-[11px] uppercase tracking-widest text-white/30">
            <span>Company &amp; Role</span>
            <span>Status</span>
            <span>Applied</span>
            <span>Notes</span>
          </div>

          {done.map((app) => (
            <div
              key={app.id}
              className="grid gap-4 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 md:grid-cols-[2fr_1fr_1fr_1fr] md:items-center"
            >
              <div>
                <p className="font-semibold text-white">{app.company}</p>
                <p className="text-sm text-white/50">{app.role}</p>
              </div>
              <div>
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                  app.status === "done"
                    ? "bg-[var(--accent-strong)]/15 text-[var(--accent-strong)]"
                    : "bg-white/10 text-white/70"
                }`}>
                  <span className={`size-1.5 rounded-full ${app.status === "done" ? "bg-[var(--accent-strong)]" : "bg-white/50"}`} />
                  {app.status === "done" ? "Done" : "Applied"}
                </span>
              </div>
              <p className="text-sm text-white/50">{app.appliedDate ?? "—"}</p>
              <p className="text-sm text-white/40 truncate">{app.notes || "—"}</p>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
