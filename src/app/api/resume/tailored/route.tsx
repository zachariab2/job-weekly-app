import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { db, reportRecommendations, reports, profiles } from "@/lib/db";
import { eq } from "drizzle-orm";
import { getResumeText } from "@/lib/services/report-service";
import OpenAI from "openai";
import { renderToBuffer } from "@react-pdf/renderer";
import { ResumeDocument, TailoredResumeData } from "@/lib/pdf/resume-template";
import React from "react";

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const recId = req.nextUrl.searchParams.get("recId");
  if (!recId) return new NextResponse("Missing recId", { status: 400 });

  const rec = await db.query.reportRecommendations.findFirst({
    where: eq(reportRecommendations.id, Number(recId)),
  });
  if (!rec) return new NextResponse("Not found", { status: 404 });

  const report = await db.query.reports.findFirst({
    where: eq(reports.id, rec.reportId),
  });
  if (!report || report.userId !== user.id) return new NextResponse("Forbidden", { status: 403 });

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, user.id),
  });

  if (!profile?.resumeUrl) {
    return new NextResponse("No resume uploaded. Please upload your resume on the profile page first.", { status: 400 });
  }

  const resumeText = profile.resumeText ?? await getResumeText(profile.resumeUrl);
  if (!resumeText) {
    return new NextResponse("Could not read your resume. Please re-upload it on the profile page.", { status: 400 });
  }

  const { data: tailored, changes } = await tailorResume(resumeText, rec.company, rec.role, user.firstName, user.email);

  const buffer = await renderToBuffer(React.createElement(ResumeDocument, { data: tailored }));

  const safeName = (tailored.name || user.email || "Resume").replace(/[^a-zA-Z0-9_\- ]/g, "");
  const safeCompany = rec.company.replace(/[^a-zA-Z0-9_\- ]/g, "");

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${safeName} - ${safeCompany}.pdf"`,
      "X-Resume-Changes": JSON.stringify(changes),
      "Access-Control-Expose-Headers": "X-Resume-Changes",
    },
  });
}

async function tailorResume(
  resumeText: string,
  company: string,
  role: string,
  firstName: string | null,
  email: string | null,
): Promise<{ data: TailoredResumeData; changes: string[] }> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    max_tokens: 4000,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are an elite resume writer. Rewrite the candidate's resume specifically for ONE role at ONE company. Rules:
- NEVER fabricate, add, or remove any section that exists in the original — only reframe and reword
- ALWAYS include ALL experience, projects, education entries from the original resume
- Rewrite every bullet to highlight skills relevant to the ${role} role at ${company} — no generic rewrites
- Bullets must be action-verb led, quantified where possible, keyword-optimized for this role
- Keep the exact same sections and section order as the original resume
- Do NOT add a summary section
- Skills: reorder so most relevant to ${role} at ${company} come first
- Return ONLY valid JSON, no markdown`,
      },
      {
        role: "user",
        content: `Tailor this resume for a ${role} position at ${company}.

RESUME TEXT:
${resumeText.slice(0, 7000)}

Return this exact JSON — preserve every section from the original resume:
{
  "name": "full name from resume",
  "email": "email or empty string",
  "phone": "phone or empty string",
  "linkedin": "linkedin URL or empty string",
  "github": "github username/URL or empty string",
  "experience": [
    { "company": "...", "role": "...", "dates": "...", "bullets": ["tailored bullet", "..."] }
  ],
  "projects": [
    { "name": "project name", "tech": "tech stack or empty string", "dates": "dates or empty string", "bullets": ["tailored bullet highlighting relevance to ${role} at ${company}", "..."] }
  ],
  "education": [
    { "school": "...", "degree": "degree and major", "dates": "...", "gpa": "GPA or empty string" }
  ],
  "skills": ["most relevant to ${role} at ${company} first", "..."],
  "changes": [
    "one sentence: what was changed and exactly why it helps for ${role} at ${company} — be specific, reference the actual project/skill name",
    "another change + why",
    "another change + why"
  ]
}

If the original resume has no projects section, return "projects": [].``,
      },
    ],
  });

  try {
    const raw = JSON.parse(response.choices[0]?.message?.content ?? "{}") as TailoredResumeData & { changes?: string[] };
    const changes: string[] = Array.isArray(raw.changes) ? raw.changes.slice(0, 3) : [];
    // Strip changes from PDF data
    const { changes: _c, ...data } = raw as TailoredResumeData & { changes?: string[] };
    void _c;
    if (!data.name && firstName) data.name = firstName;
    if (!data.email && email) data.email = email;
    if (!data.experience) data.experience = [];
    if (!data.education) data.education = [];
    if (!data.skills) data.skills = [];
    return { data, changes };
  } catch {
    return {
      data: { name: firstName ?? "Resume", email: email ?? "", experience: [], education: [], skills: [] },
      changes: [],
    };
  }
}
