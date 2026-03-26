import { AppShell } from "@/components/layout/app-shell";
import { requireActiveUser } from "@/lib/auth/session";
import { db, profiles, jobPreferences } from "@/lib/db";
import { eq } from "drizzle-orm";

export default async function ProfilePage() {
  const user = await requireActiveUser();
  let profile = null, prefs = null;
  try {
    [profile, prefs] = await Promise.all([
      db.query.profiles.findFirst({ where: eq(profiles.userId, user.id) }),
      db.query.jobPreferences.findFirst({ where: eq(jobPreferences.userId, user.id) }),
    ]);
  } catch (err) {
    console.error("[ProfilePage] DB error:", err instanceof Error ? err.message : String(err));
  }

  return (
    <AppShell active="/profile" user={user}>
      <div>
        <h1 className="text-2xl font-semibold text-white">Profile</h1>
        <p className="mt-1 text-sm text-white/50">Your info powers the weekly job matches</p>
      </div>

      <div className="space-y-3">
        {/* Resume */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-white">Resume</p>
              <p className="text-xs text-white/40 mt-0.5">
                {profile?.resumeUrl
                  ? "Resume on file — used to tailor each application"
                  : "No resume uploaded yet"}
              </p>
            </div>
            <button className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10 transition">
              {profile?.resumeUrl ? "Replace" : "Upload resume"}
            </button>
          </div>
        </div>

        {/* Academic */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-[11px] uppercase tracking-widest text-white/30 mb-4">Academic</p>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="University" value={profile?.university} />
            <Field label="Major" value={profile?.major} />
            <Field label="Graduation" value={profile?.graduation} />
          </div>
        </div>

        {/* Job preferences */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-[11px] uppercase tracking-widest text-white/30 mb-4">Job Preferences</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Target roles" value={prefs?.targetRoles} />
            <Field label="Industries" value={prefs?.industries} />
            <Field label="Job types" value={prefs?.jobTypes} />
            <Field label="Locations" value={prefs?.locations} />
            <Field label="Remote" value={prefs?.remotePreference} />
            <Field label="Dream companies" value={prefs?.dreamCompanies} />
          </div>
        </div>

        {/* Links */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-[11px] uppercase tracking-widest text-white/30 mb-4">Links</p>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="LinkedIn" value={profile?.linkedin} />
            <Field label="GitHub" value={profile?.github} />
            <Field label="Portfolio" value={profile?.portfolio} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wider text-white/30 mb-1">{label}</p>
      <p className="text-sm text-white">{value ?? <span className="text-white/25">—</span>}</p>
    </div>
  );
}
