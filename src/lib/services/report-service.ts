import { eq, desc } from "drizzle-orm";
import {
  db,
  reports,
  reportRecommendations,
  networkingLeads,
  resumeRecommendations,
  users,
  profiles,
  jobPreferences,
  applications,
} from "@/lib/db";
import { v4 as uuid } from "uuid";
import OpenAI from "openai";
import { readFile } from "fs/promises";
import * as pdfParseModule from "pdf-parse";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const pdfParse: (buf: Buffer) => Promise<{ text: string }> = (pdfParseModule as any).default ?? pdfParseModule;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ─── PDF ──────────────────────────────────────────────────────────────────────

async function getResumeText(resumePath: string | null | undefined): Promise<string | null> {
  if (!resumePath) return null;
  try {
    let buffer: Buffer;
    if (resumePath.startsWith("http")) {
      const res = await fetch(resumePath);
      buffer = Buffer.from(await res.arrayBuffer());
    } else {
      buffer = await readFile(resumePath);
    }
    const parsed = await pdfParse(buffer);
    return parsed.text.trim() || null;
  } catch {
    return null;
  }
}

// ─── JSearch ──────────────────────────────────────────────────────────────────

type JSearchJob = {
  job_id: string;
  employer_name: string;
  job_title: string;
  job_apply_link: string | null;
  job_description: string | null;
};

async function fetchJSearchJobs(query: string, count = 10): Promise<JSearchJob[]> {
  const apiKey = process.env.JSEARCH_API_KEY;
  if (!apiKey) return [];
  try {
    const url = `https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(query)}&num_pages=1&date_posted=month`;
    const res = await fetch(url, {
      headers: {
        "X-RapidAPI-Key": apiKey,
        "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
      },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return ((data.data ?? []) as JSearchJob[]).slice(0, count);
  } catch {
    return [];
  }
}

// ─── OpenAI resume tips ───────────────────────────────────────────────────────

async function generateTipsAndReason(
  resumeText: string,
  company: string,
  role: string,
  jobDescription: string,
): Promise<{ bullets: string[]; reason: string }> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: 600,
    messages: [{
      role: "user",
      content: `You are a resume coach helping a CS student tailor their resume for a specific job application.

RESUME:
${resumeText.slice(0, 3000)}

JOB: ${role} at ${company}
JOB DESCRIPTION: ${jobDescription.slice(0, 1000)}

Return exactly 4 lines:
1. REASON: one sentence (max 20 words) explaining why this role is a strong match for this specific student based on their resume and the job. Be specific — mention a skill or experience they have.
2-4. Three bullet points starting with "•" — short, specific, actionable resume edits for this application. Reference what's actually in their resume.

Format:
REASON: <sentence>
• <bullet>
• <bullet>
• <bullet>`,
    }],
  });

  const text = response.choices[0]?.message?.content ?? "";
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  const reasonLine = lines.find((l) => l.startsWith("REASON:"));
  const reason = reasonLine ? reasonLine.replace(/^REASON:\s*/, "").trim() : "";

  const bullets = lines
    .filter((l) => l.startsWith("•"))
    .map((l) => l.replace(/^•\s*/, "").trim())
    .slice(0, 3);

  return { bullets, reason };
}

// ─── TTL ──────────────────────────────────────────────────────────────────────

const REPORT_TTL_MS = 1000 * 60 * 60 * 24 * 3; // 3 days

// ─── Public API ───────────────────────────────────────────────────────────────

export async function getOrCreateReport(userId: string) {
  const existing = await db.query.reports.findFirst({
    where: eq(reports.userId, userId),
    orderBy: desc(reports.generatedAt),
    with: {
      recommendations: true,
      networking: true,
      resumeRecommendations: true,
    },
  });

  if (existing && existing.generatedAt && existing.generatedAt.getTime() > Date.now() - REPORT_TTL_MS) {
    return existing;
  }

  return generateReportForUser(userId);
}

/**
 * Returns all active (non-applied) job recommendations across all of the
 * user's reports, newest first, deduplicated by company+role.
 */
export async function getAllActiveJobsForUser(userId: string) {
  // Trigger a refresh if it's been 3+ days
  await getOrCreateReport(userId);

  const [userReports, userApplications] = await Promise.all([
    db.query.reports.findMany({
      where: eq(reports.userId, userId),
      orderBy: desc(reports.generatedAt),
      with: {
        recommendations: true,
        networking: true,
        resumeRecommendations: true,
      },
    }),
    db.query.applications.findMany({
      where: eq(applications.userId, userId),
    }),
  ]);

  const appliedKeys = new Set(
    userApplications
      .filter((a) => a.status === "applied")
      .map((a) => `${a.company}||${a.role}`),
  );
  const statusMap = new Map(
    userApplications
      .filter((a) => a.status !== "applied")
      .map((a) => [`${a.company}||${a.role}`, a.status]),
  );

  const seen = new Set<string>();
  const rows: Array<{
    rec: typeof userReports[0]["recommendations"][0];
    contacts: typeof userReports[0]["networking"];
    resumeTips: typeof userReports[0]["resumeRecommendations"][0] | undefined;
    currentStatus: "untouched" | "in-progress";
  }> = [];

  for (const report of userReports) {
    for (const rec of report.recommendations) {
      const key = `${rec.company}||${rec.role}`;
      if (seen.has(key) || appliedKeys.has(key)) continue;
      seen.add(key);
      rows.push({
        rec,
        contacts: report.networking.filter(
          (n) => n.company?.toLowerCase() === rec.company.toLowerCase(),
        ),
        resumeTips: report.resumeRecommendations.find(
          (r) => r.company?.toLowerCase() === rec.company.toLowerCase(),
        ),
        currentStatus: (statusMap.get(key) ?? "untouched") as "untouched" | "in-progress",
      });
    }
  }

  return rows;
}

export async function generateReportForUser(userId: string) {
  const [user, profile, prefs, activeApplications] = await Promise.all([
    db.query.users.findFirst({ where: eq(users.id, userId) }).then((r) => r ?? null),
    db.query.profiles.findFirst({ where: eq(profiles.userId, userId) }).then((r) => r ?? null),
    db.query.jobPreferences.findFirst({ where: eq(jobPreferences.userId, userId) }).then((r) => r ?? null),
    db.select().from(applications).where(eq(applications.userId, userId)).orderBy(desc(applications.updatedAt)),
  ]);

  if (!user) throw new Error("User not found for report generation");

  const resumePath = (profile as typeof profile & { resumeUrl?: string | null })?.resumeUrl ?? null;
  const resumeText = await getResumeText(resumePath);

  const blueprint = await buildBlueprint({ user, profile, prefs, applications: activeApplications, resumeText });

  await db.insert(reports).values({
    id: blueprint.reportId,
    userId,
    summary: blueprint.summary,
    status: "ready",
  });

  if (blueprint.recommendations.length) {
    await db.insert(reportRecommendations).values(
      blueprint.recommendations.map((rec) => ({
        reportId: blueprint.reportId,
        company: rec.company,
        role: rec.role,
        jobUrl: rec.jobUrl ?? null,
        reasoning: blueprint.reasoningByCompany.get(rec.company) ?? "",
        alumni: null,
        referralPath: null,
        resumeFocus: rec.resumeFocus.join(", "),
      })),
    );
  }

  if (blueprint.outreach.length) {
    await db.insert(networkingLeads).values(
      blueprint.outreach.map((lead) => ({
        reportId: blueprint.reportId,
        name: lead.name,
        company: lead.company,
        role: lead.role,
        connectionBasis: lead.connectionBasis,
        intensity: lead.intensity,
        outreachSnippet: lead.snippet,
        contactEmail: lead.contactEmail ?? null,
        contactLinkedin: lead.contactLinkedin ?? null,
        contactGithub: null,
      })),
    );
  }

  if (blueprint.resume.length) {
    await db.insert(resumeRecommendations).values(
      blueprint.resume.map((entry) => ({
        reportId: blueprint.reportId,
        company: entry.company,
        bullets: entry.bullets.join("\n"),
      })),
    );
  }

  const fresh = await db.query.reports.findFirst({
    where: eq(reports.id, blueprint.reportId),
    with: {
      recommendations: true,
      networking: true,
      resumeRecommendations: true,
    },
  });

  return fresh!;
}

export type ReportWithRelations = NonNullable<Awaited<ReturnType<typeof getOrCreateReport>>>;

// ─── Blueprint builder ────────────────────────────────────────────────────────

type BlueprintContext = {
  user: typeof users.$inferSelect;
  profile: typeof profiles.$inferSelect | null;
  prefs: typeof jobPreferences.$inferSelect | null;
  applications: typeof applications.$inferSelect[];
  resumeText: string | null;
};

async function buildBlueprint({ user, profile, prefs, applications, resumeText }: BlueprintContext) {
  const reportId = uuid();
  const targetRole = prefs?.targetRoles ?? "software engineering";
  const industries = prefs?.industries ?? "tech";

  // Fetch real jobs from JSearch; fall back to catalog if unavailable
  const searchQuery = `${targetRole} internship ${industries}`;
  const jsearchJobs = await fetchJSearchJobs(searchQuery, 10);

  let jobData: Array<{
    company: string;
    role: string;
    jobUrl: string | null;
    description: string;
  }>;

  if (jsearchJobs.length >= 5) {
    jobData = jsearchJobs.map((j) => ({
      company: j.employer_name,
      role: j.job_title,
      jobUrl: j.job_apply_link,
      description: j.job_description ?? "",
    }));
  } else {
    // Catalog fallback
    jobData = getSuggestionPool(prefs).slice(0, 10).map((entry) => ({
      company: entry.company,
      role: entry.role,
      jobUrl: entry.jobUrl,
      description: entry.reason,
    }));
  }

  // Enrich each job with catalog contacts (matched by company name)
  const enrichedJobs = jobData.map((job) => {
    const catalogEntry = catalog.find(
      (c) => c.company.toLowerCase() === job.company.toLowerCase(),
    );
    return {
      ...job,
      resumeFocus: catalogEntry?.resumeFocus ?? [],
      contacts: catalogEntry?.contacts ?? [],
    };
  });

  // Generate AI resume tips + reasoning per job
  const aiResults = await Promise.all(enrichedJobs.map(async (job) => {
    if (resumeText && job.description) {
      const result = await generateTipsAndReason(resumeText, job.company, job.role, job.description);
      if (result.bullets.length > 0) return result;
    }
    return {
      reason: job.description.slice(0, 120).replace(/\s+/g, " ").trim(),
      bullets: [
        `Highlight your most relevant technical experience for ${job.role}.`,
        `Quantify your impact across your top 2 projects.`,
        `Tailor your summary line to mention ${job.role}.`,
      ],
    };
  }));

  const resume = aiResults.map((r, i) => ({ company: enrichedJobs[i].company, bullets: r.bullets }));
  const reasoningByCompany = new Map(enrichedJobs.map((job, i) => [job.company, aiResults[i].reason]));

  // Build outreach from catalog contacts
  const outreach = enrichedJobs.flatMap((job) =>
    job.contacts.map((contact) => ({
      company: job.company,
      name: contact.name,
      role: contact.role,
      connectionBasis: contact.connectionBasis,
      intensity: "lukewarm" as const,
      snippet: generateSnippet(contact.name, job, user, profile),
      contactEmail: contact.contactEmail ?? null,
      contactLinkedin: contact.contactLinkedin ?? null,
    })),
  );

  const summary = `${user.firstName ?? "You"} matched for ${targetRole} roles. ${applications.length} applications logged. Jobs refresh every 3 days.`;

  return { reportId, summary, recommendations: enrichedJobs, resume, outreach, reasoningByCompany };
}

// ─── Job catalog (contacts + fallback listings) ───────────────────────────────
// Fill in contacts: alumni from the user's school first, similar background second.
// Email and LinkedIn only — no GitHub.

type Contact = {
  name: string;
  role: string;
  connectionBasis: string; // "Alumni — MIT CS '24" or "Similar background — built X at Y"
  contactEmail?: string;
  contactLinkedin?: string;
};

type CatalogEntry = {
  company: string;
  role: string;
  jobUrl: string;
  reason: string;
  resumeFocus: string[];
  contacts: Contact[];
  keywords: string[];
};

const catalog: CatalogEntry[] = [
  {
    company: "Databricks",
    role: "Software Engineering Intern",
    jobUrl: "https://www.databricks.com/company/careers/university-recruiting",
    reason: "Heavy ML infrastructure + Python emphasis — distributed systems and data pipeline work maps directly.",
    resumeFocus: ["distributed systems", "data pipelines", "Python"],
    contacts: [
      // ADD REAL CONTACTS HERE
      // { name: "First Last", role: "ML Engineer", connectionBasis: "Alumni — MIT CS '24", contactEmail: "...", contactLinkedin: "https://linkedin.com/in/..." },
    ],
    keywords: ["ai", "ml", "data", "infrastructure", "research"],
  },
  {
    company: "Vercel",
    role: "Software Engineering Intern",
    jobUrl: "https://vercel.com/careers",
    reason: "Frontend infrastructure at scale — Next.js and edge compute experience is a direct match.",
    resumeFocus: ["Next.js", "frontend", "TypeScript"],
    contacts: [],
    keywords: ["frontend", "next", "edge", "product", "web"],
  },
  {
    company: "Anthropic",
    role: "Research Engineer Intern",
    jobUrl: "https://www.anthropic.com/careers",
    reason: "Strong ML background makes you competitive — they hire for safety evals and applied research.",
    resumeFocus: ["machine learning", "research", "Python"],
    contacts: [],
    keywords: ["research", "ai", "safety", "ml", "llm"],
  },
  {
    company: "Stripe",
    role: "Software Engineering Intern",
    jobUrl: "https://stripe.com/jobs",
    reason: "Payments infrastructure is complex distributed systems — backend experience is highly relevant.",
    resumeFocus: ["backend", "APIs", "reliability"],
    contacts: [],
    keywords: ["fintech", "backend", "payments", "infrastructure", "api"],
  },
  {
    company: "Linear",
    role: "Software Engineering Intern",
    jobUrl: "https://linear.app/careers",
    reason: "Small high-craft team building developer tools — TypeScript and product sense stand out.",
    resumeFocus: ["TypeScript", "product", "developer tools"],
    contacts: [],
    keywords: ["product", "devtools", "typescript", "design", "frontend"],
  },
  {
    company: "Figma",
    role: "Software Engineering Intern",
    jobUrl: "https://www.figma.com/careers/",
    reason: "Graphics, performance, and collaborative systems — frontend + systems work is the right mix.",
    resumeFocus: ["frontend", "performance", "collaboration"],
    contacts: [],
    keywords: ["design", "frontend", "product", "collaboration", "graphics"],
  },
  {
    company: "Notion",
    role: "Software Engineering Intern",
    jobUrl: "https://www.notion.so/careers",
    reason: "Design-minded engineering culture — product sense and full-stack experience are valued.",
    resumeFocus: ["full-stack", "product", "React"],
    contacts: [],
    keywords: ["product", "fullstack", "collaboration", "notion", "design"],
  },
];

function getSuggestionPool(prefs: typeof jobPreferences.$inferSelect | null) {
  if (!prefs) return catalog.slice(0, 10);
  const role = (prefs.targetRoles ?? "").toLowerCase();
  const industries = (prefs.industries ?? "").toLowerCase();
  const matches = catalog.filter((entry) =>
    entry.keywords.some((k) => role.includes(k) || industries.includes(k)),
  );
  if (matches.length >= 3) return matches.slice(0, 10);
  return [...matches, ...catalog].slice(0, 10);
}

function generateSnippet(
  contactName: string,
  job: { company: string; role: string },
  user: typeof users.$inferSelect,
  profile: typeof profiles.$inferSelect | null,
) {
  const school = profile?.university ?? "my university";
  const myName = user.firstName ?? "Hey";
  const firstName = contactName.split(" ")[0] ?? "Hi";
  return `${firstName} — ${myName} here, CS student at ${school}. I'm applying for ${job.role} roles at ${job.company} and came across your profile. I'd love to hear about your experience there. Any chance you'd be open to a quick chat?`;
}
