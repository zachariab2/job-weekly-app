import { AppShell } from "@/components/layout/app-shell";
import { requireActiveUser } from "@/lib/auth/session";
import { db, subscriptions, referralCodes, notificationPreferences } from "@/lib/db";
import { eq } from "drizzle-orm";
import { createReferralCodeAction, startCheckoutSession } from "../billing/actions";
import { CancelButton } from "./cancel-button";
import Link from "next/link";

export default async function SettingsPage() {
  const user = await requireActiveUser();

  let subscription = null, codes: (typeof referralCodes)["$inferSelect"][] = [], notifPrefs = null;
  try {
    [subscription, codes, notifPrefs] = await Promise.all([
      db.query.subscriptions.findFirst({ where: eq(subscriptions.userId, user.id) }),
      db.query.referralCodes.findMany({ where: eq(referralCodes.ownerUserId, user.id) }),
      db.query.notificationPreferences.findFirst({ where: eq(notificationPreferences.userId, user.id) }),
    ]);
  } catch (err) {
    console.error("[SettingsPage] DB error:", err instanceof Error ? err.message : String(err));
  }

  const completedCodes = codes.filter((c) => Boolean(c.redeemedAt));
  const progressToNext = completedCodes.length % 3;
  const nextChargeDate = subscription?.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString()
    : null;

  const ownerAllowlist = (process.env.OWNER_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const isOwner = ownerAllowlist.includes((user.email ?? "").toLowerCase());

  return (
    <AppShell active="/settings" user={user}>
      <div>
        <h1 className="text-2xl font-semibold text-white">Settings</h1>
        <p className="mt-1 text-sm text-white/50">Notifications, filters, and billing</p>
      </div>

      <div className="space-y-3">

        {isOwner && (
          <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-widest text-emerald-200/80">Owner Tools</p>
              <p className="text-sm text-emerald-100/90 mt-1">Manage client profiles, preferences, notifications, and manual contacts.</p>
            </div>
            <div className="flex gap-2">
              <Link href="/admin/users" className="rounded-xl border border-emerald-300/40 px-4 py-2 text-sm text-emerald-100 hover:bg-emerald-500/20">
                Users
              </Link>
              <Link href="/admin/contacts" className="rounded-xl border border-emerald-300/40 px-4 py-2 text-sm text-emerald-100 hover:bg-emerald-500/20">
                Contacts
              </Link>
              <Link href="/admin/audit" className="rounded-xl border border-emerald-300/40 px-4 py-2 text-sm text-emerald-100 hover:bg-emerald-500/20">
                Audit
              </Link>
            </div>
          </div>
        )}

        {/* Notifications */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-[11px] uppercase tracking-widest text-white/30 mb-4">Notifications</p>
          <p className="text-xs text-white/40">Notifications coming soon. Your jobs refresh automatically every 3 days — check the dashboard anytime.</p>
        </div>

        {/* Job filters */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-[11px] uppercase tracking-widest text-white/30 mb-4">Job Filters</p>
          <p className="text-sm text-white/40">Edit your preferences from the Profile page to update the jobs we surface.</p>
        </div>

        {/* Billing */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-5">
          <p className="text-[11px] uppercase tracking-widest text-white/30">Billing</p>

          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-white">
                {subscription?.status === "active" ? "Active — $9.99/week" : "No active subscription"}
              </p>
              {nextChargeDate && (
                <p className="text-xs text-white/40 mt-0.5">Next charge {nextChargeDate}</p>
              )}
            </div>
            {subscription?.status === "active" ? (
              <CancelButton />
            ) : (
              <form action={startCheckoutSession}>
                <button className="rounded-xl bg-[var(--accent-strong)] px-4 py-2 text-sm font-semibold text-black hover:opacity-90 transition">
                  Activate $9.99/week
                </button>
              </form>
            )}
          </div>

          {/* Referrals */}
          <div className="border-t border-white/5 pt-5 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-white">Referral codes</p>
                <p className="text-xs text-white/40 mt-0.5">
                  {progressToNext}/3 to your next free week · {completedCodes.length} redeemed total
                </p>
              </div>
              <form action={createReferralCodeAction}>
                <button
                  disabled={subscription?.status !== "active"}
                  className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10 transition disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Generate code
                </button>
              </form>
            </div>

            {codes.length > 0 && (
              <div className="space-y-1.5">
                {codes.map((code) => {
                  const status = code.redeemedAt
                    ? `Credited · ${new Date(code.redeemedAt).toLocaleDateString()}`
                    : code.redeemedByUserId
                      ? "Pending — friend must complete checkout"
                      : "Available";
                  return (
                    <div
                      key={code.code}
                      className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3"
                    >
                      <p className="text-sm font-mono font-semibold text-white">{code.code}</p>
                      <p className="text-xs text-white/40">{status}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </AppShell>
  );
}
