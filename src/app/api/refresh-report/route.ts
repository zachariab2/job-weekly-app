import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { generateReportForUser } from "@/lib/services/report-service";

// Give this route a longer timeout budget on Vercel since it runs OpenAI + JSearch
export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await generateReportForUser(user.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[refresh-report] generation failed:", err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: "Report generation failed" }, { status: 500 });
  }
}
