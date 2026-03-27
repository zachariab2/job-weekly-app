import { NextResponse } from "next/server";
import { requireActiveUser } from "@/lib/auth/session";
import { db, profiles } from "@/lib/db";
import { eq } from "drizzle-orm";
import { readFile } from "fs/promises";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await requireActiveUser();
  const profile = await db.query.profiles.findFirst({ where: eq(profiles.userId, user.id) });

  if (!profile?.resumeUrl) {
    return new NextResponse("Resume not found", { status: 404 });
  }

  try {
    let bytes: Uint8Array;

    if (profile.resumeUrl.startsWith("http")) {
      const token = process.env.BLOB_READ_WRITE_TOKEN;
      const res = await fetch(profile.resumeUrl, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!res.ok) return new NextResponse("Resume unavailable", { status: 502 });
      bytes = new Uint8Array(await res.arrayBuffer());
    } else {
      const buf = await readFile(profile.resumeUrl);
      bytes = new Uint8Array(buf);
    }

    return new NextResponse(bytes.buffer as ArrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${(user.firstName ?? "resume").toLowerCase()}-resume.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[resume/download] failed:", err instanceof Error ? err.message : String(err));
    return new NextResponse("Resume download failed", { status: 500 });
  }
}
