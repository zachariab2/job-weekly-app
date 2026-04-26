import Link from "next/link";
import { eq, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { db, users, profiles, jobPreferences, notificationPreferences, reports, reportRecommendations } from "@/lib/db";
import { requireOwner } from "@/lib/auth/session";
import { saveClientProfileAction, saveClientJobPrefsAction, saveClientNotifAction, refreshClientReportAction } from "./actions";

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const owner = await requireOwner();
  const { id } = await params;

  const [user, profile, prefs, notif, latestReport] = await Promise.all([
    db.query.users.findFirst({ where: eq(users.id, id) }),
    db.query.profiles.findFirst({ where: eq(profiles.userId, id) }),
    db.query.jobPreferences.findFirst({ where: eq(jobPreferences.userId, id) }),
    db.query.notificationPreferences.findFirst({ where: eq(notificationPreferences.userId, id) }),
    db.query.reports.findFirst({
      where: eq(reports.userId, id),
      orderBy: desc(reports.generatedAt),
      with: { recommendations: true },
    }),
  ]);

  if (!user) return notFound();

  return (
    <AppShell active="/settings" user={owner}>
      <div className="space-y-6">
        <div>
          <Link href="/admin/users" className="text-xs text-white/50 hover:text-white/80">← Back to users</Link>
          <h1 className="text-2xl font-semibold text-white mt-2">Edit client: {user.email}</h1>
        </div>

        <Section title="Quick Actions">
          <form action={refreshClientReportAction} className="flex items-center gap-3">
            <input type="hidden" name="userId" value={user.id} />
            <button type="submit" className="rounded-lg border border-emerald-300/40 px-3 py-2 text-sm text-emerald-100 hover:bg-emerald-500/20">
              Refresh report now (and notify)
            </button>
          </form>
        </Section>

        <Section title="Profile">
          <form action={saveClientProfileAction} className="grid md:grid-cols-2 gap-3">
            <input type="hidden" name="userId" value={user.id} />
            <Input name="firstName" label="First name" defaultValue={user.firstName ?? ""} />
            <Input name="lastName" label="Last name" defaultValue={user.lastName ?? ""} />
            <Input name="university" label="University" defaultValue={profile?.university ?? ""} />
            <Input name="major" label="Major" defaultValue={profile?.major ?? ""} />
            <Input name="graduation" label="Graduation" defaultValue={profile?.graduation ?? ""} />
            <Input name="linkedin" label="LinkedIn" defaultValue={profile?.linkedin ?? ""} />
            <Input name="github" label="GitHub" defaultValue={profile?.github ?? ""} />
            <Save />
          </form>
        </Section>

        <Section title="Job preferences">
          <form action={saveClientJobPrefsAction} className="grid md:grid-cols-2 gap-3">
            <input type="hidden" name="userId" value={user.id} />
            <Input name="targetRoles" label="Target roles" defaultValue={prefs?.targetRoles ?? ""} />
            <Input name="jobTypes" label="Job types" defaultValue={prefs?.jobTypes ?? ""} />
            <Input name="industries" label="Industries" defaultValue={prefs?.industries ?? ""} />
            <Input name="locations" label="Locations" defaultValue={prefs?.locations ?? ""} />
            <Input name="remotePreference" label="Remote preference" defaultValue={prefs?.remotePreference ?? ""} />
            <Input name="dreamCompanies" label="Dream companies" placeholder="Stripe, Figma, Notion" defaultValue={prefs?.dreamCompanies ?? ""} />
            <Save />
          </form>
        </Section>

        <Section title={`Current report ${latestReport ? `— generated ${new Date(latestReport.generatedAt!).toLocaleDateString()}` : "— none yet"}`}>
          {!latestReport || latestReport.recommendations.length === 0 ? (
            <p className="text-xs text-white/40">No recommendations generated yet.</p>
          ) : (
            <div className="space-y-2">
              {latestReport.recommendations.map((rec) => (
                <div key={rec.id} className="flex items-start justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-white">{rec.company}</p>
                    <p className="text-xs text-white/50">{rec.role}</p>
                    <p className="text-xs text-white/30 mt-0.5 leading-relaxed">{rec.reasoning?.slice(0, 100)}{rec.reasoning && rec.reasoning.length > 100 ? "…" : ""}</p>
                  </div>
                  {rec.jobUrl && (
                    <a href={rec.jobUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:text-blue-300 shrink-0">
                      View ↗
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title="Notifications">
          <form action={saveClientNotifAction} className="grid md:grid-cols-2 gap-3">
            <input type="hidden" name="userId" value={user.id} />
            <SelectBool name="emailEnabled" label="Email enabled" defaultValue={String(notif?.emailEnabled ?? true)} />
            <SelectBool name="smsEnabled" label="SMS enabled" defaultValue={String(notif?.smsEnabled ?? false)} />
            <Input name="phone" label="Phone" defaultValue={notif?.phone ?? ""} />
            <Input name="notificationThreshold" label="Threshold" defaultValue={String(notif?.notificationThreshold ?? 3)} />
            <Save />
          </form>
        </Section>
      </div>
    </AppShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
      <h2 className="text-sm font-semibold text-white">{title}</h2>
      {children}
    </div>
  );
}

function Input({ name, label, defaultValue, placeholder }: { name: string; label: string; defaultValue?: string; placeholder?: string }) {
  return (
    <label className="space-y-1 text-xs text-white/60">
      <span>{label}</span>
      <input name={name} defaultValue={defaultValue} placeholder={placeholder} className="w-full rounded-lg border border-white/15 bg-white/[0.04] px-3 py-2 text-sm text-white" />
    </label>
  );
}

function SelectBool({ name, label, defaultValue }: { name: string; label: string; defaultValue: string }) {
  return (
    <label className="space-y-1 text-xs text-white/60">
      <span>{label}</span>
      <select name={name} defaultValue={defaultValue} className="w-full rounded-lg border border-white/15 bg-white/[0.04] px-3 py-2 text-sm text-white">
        <option value="true">true</option>
        <option value="false">false</option>
      </select>
    </label>
  );
}

function Save() {
  return (
    <div className="md:col-span-2">
      <button type="submit" className="rounded-lg border border-white/20 px-3 py-2 text-sm text-white/80 hover:bg-white/10">Save changes</button>
    </div>
  );
}
