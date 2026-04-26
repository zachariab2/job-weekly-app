import { AppShell } from "@/components/layout/app-shell";
import { requireActiveUser } from "@/lib/auth/session";
import { db, applications } from "@/lib/db";
import { and, eq, desc } from "drizzle-orm";
import { deleteApplicationAction } from "./actions";
import { AcceptedButton } from "./accepted-button";

export default async function CompletedPage() {
  const user = await requireActiveUser();

  let rows: (typeof applications)["$inferSelect"][] = [];
  try {
    rows = await db.query.applications.findMany({
      where: and(
        eq(applications.userId, user.id),
        eq(applications.status, "applied"),
      ),
      orderBy: desc(applications.updatedAt),
    });
  } catch (err) {
    console.error("[CompletedPage] DB error:", err instanceof Error ? err.message : String(err));
  }

  return (
    <AppShell active="/completed" user={user}>
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-white">Applied</h1>
        <p className="mt-1 text-sm text-white/50">
          {rows.length} application{rows.length !== 1 ? "s" : ""} submitted · waiting on responses
        </p>
      </div>

      {/* Column headers */}
      {rows.length > 0 && (
        <div className="hidden md:grid grid-cols-[1fr_auto] gap-6 px-5 text-[11px] uppercase tracking-widest text-white/25">
          <span>Company &amp; Role</span>
          <span className="text-right">Actions</span>
        </div>
      )}

      {/* Rows */}
      <div className="space-y-2">
        {rows.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-12 text-center text-sm text-white/35">
            No completed applications yet. Mark jobs as Applied on the Applications page.
          </div>
        )}

        {rows.map((app) => (
          <div
            key={app.id}
            className="rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.05] transition-colors"
          >
            <div className="h-0.5 rounded-t-2xl bg-[var(--accent-strong)]" />
            <div className="flex items-center justify-between gap-4 p-5">
              <div className="space-y-0.5">
                <p className="font-semibold text-white">{app.company}</p>
                <p className="text-sm text-white/50">{app.role}</p>
                {app.appliedDate && (
                  <p className="text-xs text-white/30 mt-1">Applied {app.appliedDate}</p>
                )}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="flex items-center gap-1.5 text-xs text-[var(--accent-strong)]">
                  <span className="size-2 rounded-full bg-[var(--accent-strong)] inline-block" />
                  Applied
                </span>
                <AcceptedButton company={app.company} />
                <form action={deleteApplicationAction}>
                  <input type="hidden" name="id" value={app.id} />
                  <button
                    type="submit"
                    className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/30 hover:text-red-400 hover:border-red-400/30 transition"
                  >
                    Delete
                  </button>
                </form>
              </div>
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
