import { requireOwner } from "@/lib/auth/session";
import { db, users, subscriptions, reports, profiles, jobPreferences } from "@/lib/db";
import { desc } from "drizzle-orm";
import { AddContactForm } from "./add-contact-form";
import { deleteContactAction, activateUserAction } from "./actions";
import { DeleteUserButton } from "./delete-user-button";

export default async function AdminPage() {
  await requireOwner();

  const [allUsers, allSubs, allReports, allProfiles, allPrefs] = await Promise.all([
    db.query.users.findMany({ orderBy: desc(users.createdAt) }),
    db.query.subscriptions.findMany(),
    db.query.reports.findMany({
      orderBy: desc(reports.generatedAt),
      with: { recommendations: true, networking: true },
    }),
    db.query.profiles.findMany(),
    db.query.jobPreferences.findMany(),
  ]);

  const subMap = new Map(allSubs.map((s) => [s.userId, s]));
  const profileMap = new Map(allProfiles.map((p) => [p.userId, p]));
  const prefsMap = new Map(allPrefs.map((p) => [p.userId, p]));

  const latestReportMap = new Map<string, typeof allReports[0]>();
  for (const r of allReports) {
    if (!latestReportMap.has(r.userId)) latestReportMap.set(r.userId, r);
  }

  const rows = allUsers.map((user) => ({
    user,
    sub: subMap.get(user.id),
    report: latestReportMap.get(user.id),
    profile: profileMap.get(user.id),
    prefs: prefsMap.get(user.id),
  }));

  const activeCount = allSubs.filter((s) => s.status === "active").length;

  return (
    <div className="min-h-screen bg-[var(--surface)] text-white p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-white/30">JobWeekly</p>
          <h1 className="text-2xl font-semibold mt-1">Admin</h1>
        </div>
        <div className="flex gap-8 text-right">
          <div>
            <p className="text-3xl font-semibold">{allUsers.length}</p>
            <p className="text-xs text-white/35 mt-0.5">users</p>
          </div>
          <div>
            <p className="text-3xl font-semibold text-green-400">{activeCount}</p>
            <p className="text-xs text-white/35 mt-0.5">paying</p>
          </div>
        </div>
      </div>

      {rows.length === 0 && (
        <p className="text-sm text-white/30">No users yet.</p>
      )}

      <div className="space-y-6">
        {rows.map(({ user, sub, report, profile, prefs }) => {
          const statusColor =
            sub?.status === "active" ? "bg-green-500/15 text-green-400 border-green-500/30" :
            sub?.status === "pending" ? "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" :
            "bg-white/10 text-white/35 border-white/10";

          return (
            <div key={user.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-5">

              {/* User header */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-white text-lg">
                    {user.firstName} {user.lastName}
                    {!user.firstName && !user.lastName && <span className="text-white/40">Unnamed</span>}
                  </p>
                  <p className="text-sm text-white/50">{user.email}</p>
                  <p className="text-xs text-white/25 mt-0.5">
                    Joined {user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`rounded-full border px-3 py-1 text-xs font-medium ${statusColor}`}>
                    {sub?.status ?? "no subscription"}
                  </span>
                  {sub?.currentPeriodEnd && (
                    <p className="text-xs text-white/25">
                      renews {new Date(sub.currentPeriodEnd).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                  )}
                  {sub?.status !== "active" && (
                    <form action={activateUserAction}>
                      <input type="hidden" name="userId" value={user.id} />
                      <button type="submit" className="text-xs text-green-400/60 hover:text-green-400 transition px-2 py-1">
                        Activate
                      </button>
                    </form>
                  )}
                  <DeleteUserButton userId={user.id} email={user.email ?? ""} />
                </div>
              </div>

              {/* Profile info */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <InfoBlock label="University" value={profile?.university} />
                <InfoBlock label="Major" value={profile?.major} />
                <InfoBlock label="Graduation" value={profile?.graduation} />
                <InfoBlock label="Target Roles" value={prefs?.targetRoles} />
                <InfoBlock label="Locations" value={prefs?.locations} />
                <InfoBlock label="Dream Companies" value={prefs?.dreamCompanies} />
              </div>

              {/* Links row */}
              <div className="flex flex-wrap gap-4 items-center">
                {profile?.linkedin && (
                  <a href={profile.linkedin} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-blue-400 hover:text-blue-300 transition">
                    LinkedIn ↗
                  </a>
                )}
                {profile?.github && (
                  <a href={`https://github.com/${profile.github}`} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-white/40 hover:text-white/70 transition">
                    GitHub ↗
                  </a>
                )}
                {profile?.resumeUrl ? (
                  <a href={`/api/admin/resume/${user.id}`} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-green-400 hover:text-green-300 transition">
                    View Resume PDF ↗
                  </a>
                ) : (
                  <span className="text-xs text-white/25 italic">No resume uploaded</span>
                )}
              </div>

              {/* Jobs */}
              {report ? (
                <div className="space-y-3">
                  <p className="text-[10px] uppercase tracking-widest text-white/25">
                    Report · {new Date(report.generatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} · {report.recommendations.length} jobs
                  </p>

                  {report.recommendations.length === 0 && (
                    <p className="text-xs text-white/25 italic">No recommendations in this report.</p>
                  )}

                  {report.recommendations.map((rec) => {
                    const contacts = report.networking.filter(
                      (n) => n.company?.toLowerCase() === rec.company.toLowerCase(),
                    );

                    return (
                      <div key={rec.id} className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-medium text-white text-sm">{rec.company}</p>
                            <p className="text-xs text-white/45 mt-0.5">{rec.role}</p>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            {contacts.length === 0 && (
                              <span className="text-[11px] text-amber-400/70">Needs contact</span>
                            )}
                            {rec.jobUrl && (
                              <a href={rec.jobUrl} target="_blank" rel="noopener noreferrer"
                                className="text-[11px] text-white/25 hover:text-white/60 transition">
                                Job ↗
                              </a>
                            )}
                          </div>
                        </div>

                        {contacts.length > 0 && (
                          <div className="space-y-1.5">
                            {contacts.map((c) => (
                              <div key={c.id} className="flex items-center justify-between rounded-lg bg-white/[0.04] px-3 py-2 gap-4">
                                <div className="space-y-0.5 min-w-0">
                                  <p className="text-sm text-white truncate">{c.name}</p>
                                  <p className="text-xs text-white/40 truncate">
                                    {c.role}{c.connectionBasis ? ` · ${c.connectionBasis}` : ""}
                                  </p>
                                  {c.contactLinkedin && (
                                    <a href={c.contactLinkedin} target="_blank" rel="noopener noreferrer"
                                      className="text-[11px] text-blue-400 hover:text-blue-300 transition">
                                      LinkedIn ↗
                                    </a>
                                  )}
                                </div>
                                <form action={deleteContactAction} className="shrink-0">
                                  <input type="hidden" name="contactId" value={c.id} />
                                  <button type="submit"
                                    className="text-[11px] text-red-400/50 hover:text-red-400 transition px-2 py-1">
                                    Remove
                                  </button>
                                </form>
                              </div>
                            ))}
                          </div>
                        )}

                        <AddContactForm
                          reportId={report.id}
                          company={rec.company}
                          userName={user.firstName ?? "A student"}
                        />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-white/25 italic">No report yet — user hasn&apos;t generated their first report</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] px-3 py-2">
      <p className="text-[9px] uppercase tracking-widest text-white/25 mb-0.5">{label}</p>
      <p className="text-xs text-white/70 truncate">{value || <span className="text-white/20">—</span>}</p>
    </div>
  );
}
