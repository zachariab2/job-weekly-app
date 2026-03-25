import { AppShell } from "@/components/layout/app-shell";
import { requireActiveUser } from "@/lib/auth/session";
import { getAllActiveJobsForUser } from "@/lib/services/report-service";
import { setApplicationStatusAction } from "./actions";

export default async function ApplicationsPage() {
  const user = await requireActiveUser();
  const rows = await getAllActiveJobsForUser(user.id);
  const totalUntouched = rows.filter((r) => r.currentStatus === "untouched").length;

  return (
    <AppShell active="/applications" user={user}>
      {/* Header */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Applications</h1>
          <p className="mt-1 text-sm text-white/50">
            {rows.length} curated roles · {totalUntouched} not yet started
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs text-white/35">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-white/20 inline-block" />Untouched
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-amber-400 inline-block" />In Progress
          </span>
        </div>
      </div>

      {/* Column headers */}
      <div className="hidden md:grid grid-cols-[2fr_2fr_1.5fr_auto] gap-6 px-5 text-[11px] uppercase tracking-widest text-white/25">
        <span>Company &amp; Role</span>
        <span>Referral Contacts</span>
        <span>Resume Tips</span>
        <span className="w-[140px] text-right">Status</span>
      </div>

      {/* Rows */}
      <div className="space-y-2">
        {rows.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-12 text-center text-sm text-white/35">
            Your first batch of curated jobs is being generated.
          </div>
        )}

        {rows.map(({ rec, currentStatus, contacts, resumeTips }) => (
          <div
            key={`${rec.company}-${rec.role}`}
            className="rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.05] transition-colors"
          >
            <div className={`h-0.5 rounded-t-2xl ${
              currentStatus === "in-progress" ? "bg-amber-400" : "bg-transparent"
            }`} />

            <div className="grid gap-6 p-5 md:grid-cols-[2fr_2fr_1.5fr_auto] md:items-start">

              {/* Company + Role */}
              <div className="space-y-1">
                {rec.jobUrl ? (
                  <a
                    href={rec.jobUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-1.5"
                  >
                    <span className="font-semibold text-white group-hover:text-[var(--accent)] transition">
                      {rec.company}
                    </span>
                    <span className="text-white/25 text-xs group-hover:text-[var(--accent)]/50 transition">↗</span>
                  </a>
                ) : (
                  <p className="font-semibold text-white">{rec.company}</p>
                )}
                <p className="text-sm text-white/50">{rec.role}</p>
                <p className="text-xs text-white/30 leading-relaxed mt-2">{rec.reasoning}</p>
              </div>

              {/* Referral contacts */}
              <div className="space-y-3">
                {contacts.length === 0 ? (
                  <p className="text-xs text-white/25">No contacts yet</p>
                ) : (
                  contacts.map((contact, i) => (
                    <div key={i} className="rounded-xl border border-white/10 bg-white/[0.04] p-3 space-y-2">
                      <div>
                        <p className="text-sm font-medium text-white">{contact.name}</p>
                        <p className="text-xs text-white/45">{contact.role}</p>
                        <p className="text-[11px] text-white/30 mt-0.5">{contact.connectionBasis}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {contact.contactEmail && (
                          <a
                            href={`mailto:${contact.contactEmail}`}
                            className="inline-flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-1 text-[11px] text-blue-400 hover:text-blue-300 hover:border-blue-400/50 transition"
                          >
                            ✉ Email
                          </a>
                        )}
                        {contact.contactLinkedin && (
                          <a
                            href={contact.contactLinkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-1 text-[11px] text-blue-400 hover:text-blue-300 hover:border-blue-400/50 transition"
                          >
                            LinkedIn
                          </a>
                        )}
                      </div>
                      {contact.outreachSnippet && (
                        <div className="border-t border-white/5 pt-2">
                          <p className="text-[10px] uppercase tracking-wider text-white/25 mb-1">Ready-to-send message</p>
                          <p className="text-xs text-white/50 leading-relaxed">{contact.outreachSnippet}</p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Resume tips */}
              <div className="space-y-2">
                {resumeTips?.bullets ? (
                  <>
                    <p className="text-[10px] uppercase tracking-wider text-white/25">Suggested edits to your resume</p>
                    <ul className="space-y-2">
                      {resumeTips.bullets.split("\n").map((b, i) => (
                        <li key={i} className="flex gap-2 text-xs text-white/55 leading-relaxed">
                          <span className="text-[var(--accent-strong)] shrink-0 mt-0.5">·</span>
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : rec.resumeFocus ? (
                  <>
                    <p className="text-[10px] uppercase tracking-wider text-white/25">Suggested edits to your resume</p>
                    <p className="text-xs text-white/40 leading-relaxed">Focus on: {rec.resumeFocus}</p>
                  </>
                ) : (
                  <p className="text-xs text-white/20">—</p>
                )}
              </div>

              {/* Status */}
              <div className="flex flex-col gap-1 w-[140px]">
                {(["untouched", "in-progress"] as const).map((s) => (
                  <form key={s} action={setApplicationStatusAction}>
                    <input type="hidden" name="company" value={rec.company} />
                    <input type="hidden" name="role" value={rec.role} />
                    <input type="hidden" name="status" value={s} />
                    <button
                      type="submit"
                      className={`flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-xs transition-all ${
                        currentStatus === s
                          ? "bg-white/10 text-white font-medium"
                          : "text-white/30 hover:text-white/55 hover:bg-white/5"
                      }`}
                    >
                      <span className={`size-2 rounded-full shrink-0 ${s === "in-progress" ? "bg-amber-400" : "bg-white/20"}`} />
                      {s === "in-progress" ? "In Progress" : "Untouched"}
                    </button>
                  </form>
                ))}
                <form action={setApplicationStatusAction}>
                  <input type="hidden" name="company" value={rec.company} />
                  <input type="hidden" name="role" value={rec.role} />
                  <input type="hidden" name="status" value="applied" />
                  <button
                    type="submit"
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-xs transition-all text-white/30 hover:text-[var(--accent-strong)] hover:bg-[var(--accent-strong)]/10"
                  >
                    <span className="size-2 rounded-full shrink-0 bg-[var(--accent-strong)]" />
                    Mark Applied →
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
