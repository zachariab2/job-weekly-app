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

  const firstName = user.firstName ?? "there";
  const jobWord = newJobCount === 1 ? "role" : "roles";
  const text = `Hey ${firstName} — ${newJobCount} fresh ${jobWord} just dropped in JobWeekly. Log in to see them: ${process.env.APP_URL ?? "https://getjobweekly.com"}/applications`;

  const smsSent = prefs.smsEnabled && prefs.phone ? await sendSms(prefs.phone, text) : false;

  return { attempted: true, emailSent: false, smsSent };
}

async function sendSms(to: string, body: string): Promise<boolean> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;
  if (!sid || !token || !from) return false;

  try {
    const basic = Buffer.from(`${sid}:${token}`).toString("base64");
    const params = new URLSearchParams({ To: to, From: from, Body: body });
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });
    return res.ok;
  } catch (err) {
    console.error("[notify] twilio failed:", err instanceof Error ? err.message : String(err));
    return false;
  }
}
