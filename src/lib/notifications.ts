import { db, notificationPreferences, users } from "@/lib/db";
import { eq } from "drizzle-orm";

type NotifyInput = {
  userId: string;
  newJobCount: number;
  totalActiveJobs: number;
};

type NotifyResult = {
  attempted: boolean;
  emailSent: boolean;
  smsSent: boolean;
  reason?: string;
};

export async function notifyFreshBatchIfNeeded({ userId, newJobCount, totalActiveJobs }: NotifyInput): Promise<NotifyResult> {
  if (newJobCount <= 0) return { attempted: false, emailSent: false, smsSent: false, reason: "no_new_jobs" };

  const [prefs, user] = await Promise.all([
    db.query.notificationPreferences.findFirst({ where: eq(notificationPreferences.userId, userId) }),
    db.query.users.findFirst({ where: eq(users.id, userId) }),
  ]);

  if (!prefs || !user) return { attempted: false, emailSent: false, smsSent: false, reason: "missing_user_or_prefs" };

  const threshold = prefs.notificationThreshold ?? 3;
  if (totalActiveJobs < threshold) return { attempted: false, emailSent: false, smsSent: false, reason: "below_threshold" };

  return { attempted: true, emailSent: false, smsSent: false };
}

