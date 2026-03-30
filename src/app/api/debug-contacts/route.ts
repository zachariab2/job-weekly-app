import { getSessionUser } from "@/lib/auth/session";
import { db, reports, networkingLeads } from "@/lib/db";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "not logged in" }, { status: 401 });

  const userReports = await db.query.reports.findMany({
    where: eq(reports.userId, user.id),
    columns: { id: true, generatedAt: true },
  });

  const reportIds = userReports.map((r) => r.id);
  const allContacts = await db.query.networkingLeads.findMany();
  const myContacts = allContacts.filter((c) => reportIds.includes(c.reportId));

  return NextResponse.json({
    userId: user.id,
    email: user.email,
    reportCount: userReports.length,
    reports: userReports,
    contactCount: myContacts.length,
    contacts: myContacts.map((c) => ({ id: c.id, reportId: c.reportId, name: c.name, company: c.company })),
  });
}
