import { eq } from "drizzle-orm";
import { db, referralCodes, subscriptions } from "@/lib/db";
import { getStripeClient } from "@/lib/payments/stripe";

const WEEK_MS = 1000 * 60 * 60 * 24 * 7;

export async function finalizeReferralIfPresent(newUserId: string) {
  const referral = await db.query.referralCodes.findFirst({ where: eq(referralCodes.redeemedByUserId, newUserId) });
  if (!referral || referral.redeemedAt) {
    return;
  }

  await db
    .update(referralCodes)
    .set({ redeemedAt: new Date() })
    .where(eq(referralCodes.code, referral.code));

  await applyReferralBonuses(referral.ownerUserId);
}

export async function applyReferralBonuses(ownerUserId: string) {
  const ownerSub = await db.query.subscriptions.findFirst({ where: eq(subscriptions.userId, ownerUserId) });
  if (!ownerSub || !ownerSub.stripeSubscriptionId) {
    return;
  }

  const ownerCodes = await db.query.referralCodes.findMany({ where: eq(referralCodes.ownerUserId, ownerUserId) });
  const completedCount = ownerCodes.filter((code) => Boolean(code.redeemedAt)).length;
  const earnedWeeks = Math.floor(completedCount / 3);

  if (earnedWeeks <= (ownerSub.bonusWeeksApplied ?? 0)) {
    return;
  }

  const bonusWeeks = earnedWeeks - (ownerSub.bonusWeeksApplied ?? 0);
  const baseEnd = ownerSub.currentPeriodEnd ?? new Date();
  const newPeriodEnd = new Date(baseEnd.getTime() + bonusWeeks * WEEK_MS);

  // Extend the Stripe subscription trial so they aren't billed during the free week(s)
  try {
    const stripe = getStripeClient();
    await stripe.subscriptions.update(ownerSub.stripeSubscriptionId, {
      trial_end: Math.floor(newPeriodEnd.getTime() / 1000),
      proration_behavior: "none",
    });
  } catch (err) {
    console.error("[referral] failed to extend Stripe trial:", err instanceof Error ? err.message : String(err));
    // Still update our DB even if Stripe call fails — don't lose the record
  }

  await db
    .update(subscriptions)
    .set({
      bonusWeeksApplied: earnedWeeks,
      currentPeriodEnd: newPeriodEnd,
    })
    .where(eq(subscriptions.id, ownerSub.id));
}
