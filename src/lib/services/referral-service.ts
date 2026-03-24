import { eq } from "drizzle-orm";
import { db, referralCodes, subscriptions } from "@/lib/db";

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
  if (!ownerSub) {
    return;
  }

  const ownerCodes = await db.query.referralCodes.findMany({ where: eq(referralCodes.ownerUserId, ownerUserId) });
  const completedCount = ownerCodes.filter((code) => Boolean(code.redeemedAt)).length;
  const earnedWeeks = Math.floor(completedCount / 3);

  if (earnedWeeks > (ownerSub.bonusWeeksApplied ?? 0)) {
    const bonusWeeks = earnedWeeks - (ownerSub.bonusWeeksApplied ?? 0);
    const baseEnd = ownerSub.currentPeriodEnd ?? new Date();

    await db
      .update(subscriptions)
      .set({
        bonusWeeksApplied: earnedWeeks,
        currentPeriodEnd: new Date(baseEnd.getTime() + bonusWeeks * WEEK_MS),
      })
      .where(eq(subscriptions.id, ownerSub.id));
  }
}
