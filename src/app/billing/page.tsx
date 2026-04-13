import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/session";
import { db, subscriptions, referralCodes } from "@/lib/db";
import { eq } from "drizzle-orm";
import { createReferralCodeAction, startCheckoutSession } from "./actions";
import { CopyLinkButton } from "./copy-link-button";
import { BillingPolling } from "./billing-polling";
import { redirect } from "next/navigation";

type BillingPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function BillingPage({ searchParams }: BillingPageProps) {
  const user = await requireUser();
  const resolvedParams = await searchParams;
  let subscription = null, codes: (typeof referralCodes)["$inferSelect"][] = [];
  try {
    [subscription, codes] = await Promise.all([
      db.query.subscriptions.findFirst({ where: eq(subscriptions.userId, user.id) }),
      db.query.referralCodes.findMany({ where: eq(referralCodes.ownerUserId, user.id) }),
    ]);
  } catch (err) {
    console.error("[BillingPage] DB error:", err instanceof Error ? err.message : String(err));
  }
  // If checkout just completed and subscription is now active, go straight to the app
  const isCheckoutSuccess = typeof resolvedParams?.checkout === "string" && resolvedParams.checkout === "success";
  if (isCheckoutSuccess && subscription?.status === "active") {
    redirect("/applications");
  }

  const completedCodes = codes.filter((code) => Boolean(code.redeemedAt));
  const pendingCodes = codes.filter((code) => code.redeemedByUserId && !code.redeemedAt);
  const earnedWeeks = Math.floor(completedCodes.length / 3);
  const progressToNext = completedCodes.length % 3;
  const nextChargeDate = subscription?.currentPeriodEnd ? new Date(subscription.currentPeriodEnd) : null;
  const statusMessage = (() => {
    const flag = typeof resolvedParams?.checkout === "string" ? resolvedParams?.checkout : undefined;
    if (flag === "success") return "Payment received. We'll refresh your account in a few seconds.";
    if (flag === "cancel") return "Checkout canceled. You can restart whenever you're ready.";
    if (typeof resolvedParams?.activate === "string") return "Activate your membership to unlock the dashboard.";
    return null;
  })();

  return (
    <AppShell active="/billing" user={user}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">Billing</p>
          <h1 className="text-3xl font-semibold text-white">Subscription & referral credits</h1>
        </div>
        {subscription?.status === "active" ? (
          <Button variant="secondary" disabled>
            Manage in Stripe (coming soon)
          </Button>
        ) : (
          <form action={startCheckoutSession}>
            <Button type="submit">Activate for $9.99/week</Button>
          </form>
        )}
      </div>
      {isCheckoutSuccess && subscription?.status !== "active" && <BillingPolling />}
      {statusMessage && (
        <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
          {statusMessage}
        </div>
      )}
      <Card className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-white/60">Current plan</p>
            <p className="text-2xl font-semibold text-white">Premium Weekly</p>
            <p className="text-sm text-white/50">
              {subscription?.status === "active"
                ? `Active · Next charge ${nextChargeDate ? nextChargeDate.toLocaleDateString() : "TBD"}`
                : "Pending activation — checkout to unlock the dashboard"}
            </p>
          </div>
          <div className="flex gap-3 text-sm text-white/70">
            <div className="text-center">
              <p className="text-xs uppercase tracking-[0.2em] text-white/40">Weeks comped</p>
              <p className="text-2xl font-semibold text-white">{earnedWeeks}</p>
            </div>
            <div className="text-center">
              <p className="text-xs uppercase tracking-[0.2em] text-white/40">Progress</p>
              <p className="text-2xl font-semibold text-white">{progressToNext}/3</p>
            </div>
          </div>
        </div>
        <div className="border-t border-white/5 pt-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-white">Referral program</p>
              <p className="text-xs text-white/60">Every 3 paid friends unlock one free week. Codes lock after checkout completes.</p>
            </div>
            <form action={createReferralCodeAction}>
              <Button type="submit" disabled={subscription?.status !== "active"}>
                Generate code
              </Button>
            </form>
          </div>
          <div className="space-y-2 text-sm text-white/70">
            {codes.length === 0 && <p>No codes issued yet. Generate one and share it once you trust someone will stay paid.</p>}
            {codes.length > 0 && (
              <div className="space-y-2">
                {pendingCodes.length > 0 && (
                  <p className="text-xs text-white/50">
                    {pendingCodes.length} invite{pendingCodes.length === 1 ? "" : "s"} are pending — credits unlock once their payments clear.
                  </p>
                )}
                {codes.map((code) => {
                  const statusLabel = code.redeemedAt
                    ? `Credited • ${new Date(code.redeemedAt).toLocaleDateString()}`
                    : code.redeemedByUserId
                      ? "Pending — friend must finish checkout"
                      : "Available";
                  return (
                    <div key={code.code} className="flex flex-wrap items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                      <div>
                        <p className="text-sm font-semibold text-white">{code.code}</p>
                        <p className="text-xs text-white/50">Issued {code.issuedAt ? new Date(code.issuedAt).toLocaleDateString() : "today"}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-white/60">{statusLabel}</span>
                        {!code.redeemedByUserId && <CopyLinkButton code={code.code} />}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </Card>
    </AppShell>
  );
}
