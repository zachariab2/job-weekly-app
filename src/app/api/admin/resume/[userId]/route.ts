import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, profiles } from "@/lib/db";
import { requireOwner } from "@/lib/auth/session";

export async function GET(_req: Request, { params }: { params: Promise<{ userId: string }> }) {
  await requireOwner();

  const { userId } = await params;
  const profile = await db.query.profiles.findFirst({ where: eq(profiles.userId, userId) });

  if (!profile?.resumeUrl) {
    return NextResponse.json({ error: "No resume found" }, { status: 404 });
  }

  // In production, resumeUrl is a Vercel Blob URL — fetch and proxy it
  // In dev, it's a local file path — read from disk
  if (profile.resumeUrl.startsWith("http")) {
    const blobRes = await fetch(profile.resumeUrl);
    if (!blobRes.ok) return NextResponse.json({ error: "Failed to fetch resume" }, { status: 502 });
    const buffer = await blobRes.arrayBuffer();
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="resume-${userId}.pdf"`,
      },
    });
  }

  // Local dev fallback
  const { readFile } = await import("fs/promises");
  try {
    const bytes = await readFile(profile.resumeUrl);
    return new NextResponse(bytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="resume-${userId}.pdf"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Resume file not found" }, { status: 404 });
  }
}
