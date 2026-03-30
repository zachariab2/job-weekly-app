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

  const tailored = await tailorResume(resumeText, rec.company, rec.role, user.firstName, user.email);

  const buffer = await renderToBuffer(React.createElement(ResumeDocument, { data: tailored }));

  const safeName = (tailored.name || user.email || "Resume").replace(/[^a-zA-Z0-9_\- ]/g, "");
  const safeCompany = rec.company.replace(/[^a-zA-Z0-9_\- ]/g, "");

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${safeName} - ${safeCompany}.pdf"`,
    },
  });
}

async function tailorResume(
  resumeText: string,
  company: string,
  role: string,
  firstName: string | null,
  email: string | null,
): Promise<TailoredResumeData> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    max_tokens: 4000,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are an elite resume writer. Your job is to take a candidate's resume and rewrite it specifically for ONE target role at ONE specific company. Rules:
- NEVER fabricate experience, education, skills, or dates — only reframe what exists
- ALWAYS include ALL education entries from the resume — education is mandatory
- Each bullet point must be reworded to directly highlight skills and impact relevant to the ${role} role at ${company} specifically — not generic rewrites
- Make bullets action-verb led, quantified where possible, and keyword-optimized for ${role} at ${company}
- The summary must be 2-3 sentences that feel personally written for this exact application — mention ${company} and the specific value the candidate brings to a ${role} role
- Skills list: reorder so the skills most relevant to ${role} at ${company} come first
- Return ONLY valid JSON, no markdown`,
      },
      {
        role: "user",
        content: `Tailor this resume for a ${role} position at ${company}.

RESUME TEXT:
${resumeText.slice(0, 7000)}

Return this exact JSON shape (include every section — education is required even if minimal):
{
  "name": "full name from resume",
  "email": "email from resume or empty string",
  "phone": "phone number from resume or empty string",
  "linkedin": "linkedin URL from resume or empty string",
  "github": "github username or URL from resume or empty string",
  "summary": "2-3 sentence summary written specifically for ${role} at ${company}",
  "experience": [
    {
      "company": "company name",
      "role": "job title",
      "dates": "date range",
      "bullets": ["rewritten bullet tailored to ${role} at ${company}", "..."]
    }
  ],
  "education": [
    {
      "school": "university or school name",
      "degree": "degree and major",
      "dates": "graduation date or date range",
      "gpa": "GPA if listed, otherwise empty string"
    }
  ],
  "skills": ["most relevant to ${role} at ${company} first", "..."]
}`,
      },
    ],
  });

  try {
    const data = JSON.parse(response.choices[0]?.message?.content ?? "{}") as TailoredResumeData;
    // Fill in fallbacks from known user data
    if (!data.name && firstName) data.name = firstName;
    if (!data.email && email) data.email = email;
    if (!data.experience) data.experience = [];
    if (!data.education) data.education = [];
    if (!data.skills) data.skills = [];
    return data;
  } catch {
    return {
      name: firstName ?? "Resume",
      email: email ?? "",
      summary: `Tailored resume for ${role} at ${company}.`,
      experience: [],
      education: [],
      skills: [],
    };
  }
}
