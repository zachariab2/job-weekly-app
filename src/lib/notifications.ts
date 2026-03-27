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
  const subject = `${newJobCount} new ${jobWord} ready for you — JobWeekly`;
  const text = `Hey ${firstName} — ${newJobCount} fresh ${jobWord} just dropped in JobWeekly. Log in to see them: ${process.env.APP_URL ?? "https://jobweekly.app"}/applications`;
  const html = buildEmailHtml(firstName, newJobCount, totalActiveJobs);

  const [emailSent, smsSent] = await Promise.all([
    prefs.emailEnabled ? sendEmail(user.email, subject, text, html) : Promise.resolve(false),
    prefs.smsEnabled && prefs.phone ? sendSms(prefs.phone, text) : Promise.resolve(false),
  ]);

  return { attempted: true, emailSent, smsSent };
}

async function sendEmail(to: string, subject: string, text: string, html: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) return false;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to, subject, text, html }),
    });
    return res.ok;
  } catch (err) {
    console.error("[notify] resend failed:", err instanceof Error ? err.message : String(err));
    return false;
  }
}

function buildEmailHtml(firstName: string, newJobCount: number, totalActiveJobs: number): string {
  const appUrl = process.env.APP_URL ?? "https://jobweekly.app";
  const jobWord = newJobCount === 1 ? "role" : "roles";
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;max-width:560px;width:100%;">
        <!-- Header -->
        <tr>
          <td style="background:#0f172a;padding:28px 40px;">
            <p style="margin:0;font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">JobWeekly</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px 40px 32px;">
            <p style="margin:0 0 8px;font-size:24px;font-weight:700;color:#0f172a;letter-spacing:-0.5px;">
              Your new batch is ready, ${firstName}.
            </p>
            <p style="margin:0 0 28px;font-size:16px;color:#64748b;line-height:1.6;">
              ${newJobCount} fresh ${jobWord} — handpicked and matched to your profile. ${totalActiveJobs > newJobCount ? `You have ${totalActiveJobs} active roles waiting for you.` : ""}
            </p>
            <a href="${appUrl}/applications"
               style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 28px;border-radius:6px;">
              View my jobs →
            </a>
          </td>
        </tr>
        <!-- Divider -->
        <tr><td style="padding:0 40px;"><hr style="border:none;border-top:1px solid #e2e8f0;margin:0;"></td></tr>
        <!-- Footer -->
        <tr>
          <td style="padding:24px 40px;">
            <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.6;">
              You're receiving this because you enabled email notifications in JobWeekly.<br>
              <a href="${appUrl}/settings" style="color:#94a3b8;">Manage preferences</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
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
