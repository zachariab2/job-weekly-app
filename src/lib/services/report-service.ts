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

async function getResumeText(resumePath: string | null | undefined): Promise<string | null> {
  if (!resumePath) return null;
  try {
    let buffer: Buffer;
    if (resumePath.startsWith("http")) {
      // Vercel Blob URL (production)
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

async function generateRealResumeTips(
  resumeText: string,
  company: string,
  role: string,
  jobReason: string,
  resumeFocusAreas: string[],
): Promise<string[]> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: 512,
    messages: [{
      role: "user",
      content: `You are a resume coach helping a CS student tailor their resume for a specific job application.

RESUME:
${resumeText.slice(0, 3000)}

JOB: ${role} at ${company}
WHY THIS ROLE FITS: ${jobReason}
KEY FOCUS AREAS: ${resumeFocusAreas.join(", ")}

Give exactly 3 short, specific, actionable bullet points (1 sentence each) telling the candidate what to change or emphasize in their resume for this specific application. Be concrete — reference what's actually in their resume. No fluff.

Format: return only the 3 bullets, one per line, starting with "•"`,
    }],
  });

  const text = response.choices[0]?.message?.content ?? "";
  return text
    .split("\n")
    .filter((l) => l.trim().startsWith("•"))
    .map((l) => l.replace(/^•\s*/, "").trim())
    .slice(0, 3);
}

const REPORT_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours

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

  const latest = await generateReportForUser(userId);
  return latest;
}

export async function generateReportForUser(userId: string) {
  const [user, profile, prefs, activeApplications] = await Promise.all([
    db.query.users.findFirst({ where: eq(users.id, userId) }).then((r) => r ?? null),
    db.query.profiles.findFirst({ where: eq(profiles.userId, userId) }).then((r) => r ?? null),
    db.query.jobPreferences.findFirst({ where: eq(jobPreferences.userId, userId) }).then((r) => r ?? null),
    db
      .select()
      .from(applications)
      .where(eq(applications.userId, userId))
      .orderBy(desc(applications.updatedAt)),
  ]);

  if (!user) {
    throw new Error("User not found for report generation");
  }

  // Try to get real resume text for AI-powered tips
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
        reasoning: rec.reason,
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
        contactGithub: lead.contactGithub ?? null,
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

type BlueprintContext = {
  user: typeof users.$inferSelect;
  profile: typeof profiles.$inferSelect | null;
  prefs: typeof jobPreferences.$inferSelect | null;
  applications: typeof applications.$inferSelect[];
  resumeText: string | null;
};

async function buildBlueprint({ user, profile, prefs, applications, resumeText }: BlueprintContext) {
  const reportId = uuid();
  const role = prefs?.targetRoles ?? "product + engineering";
  const industries = prefs?.industries ?? "top product-led";
  const focusMetric = applications.length >= 30 ? "maintain volume while tightening quality" : "increase weekly volume";
  const summary = `${user.firstName ?? "You"} are strongest for ${role} roles inside ${industries} companies. Focus on alumni-backed referrals while you ${focusMetric}. ${applications.length} applications logged so far.`;

  const suggestionPool = getSuggestionPool(prefs);
  const recommendations = suggestionPool.slice(0, 3);

  // Generate resume tips — real AI tips if resume exists, fallback otherwise
  const resume = await Promise.all(recommendations.map(async (rec) => {
    if (resumeText) {
      const bullets = await generateRealResumeTips(
        resumeText,
        rec.company,
        rec.role,
        rec.reason,
        rec.resumeFocus,
      );
      if (bullets.length > 0) return { company: rec.company, bullets };
    }
    // Fallback to generic tips
    return {
      company: rec.company,
      bullets: [
        `Highlight ${rec.resumeFocus[0]} in the top experience bullet.`,
        `Quantify impact related to ${rec.resumeFocus[1] ?? rec.resumeFocus[0]}.`,
        `Tailor summary line to mention ${rec.role}.`,
      ],
    };
  }));

  // Fetch real GitHub contacts for each company in parallel
  const contactsByCompany = await Promise.all(
    recommendations.map((rec) => fetchGitHubContacts(rec.githubOrg, 2)),
  );

  const outreach = recommendations.flatMap((rec, i) => {
    const contacts = contactsByCompany[i];
    if (!contacts.length) return [];
    return contacts.map((contact) => ({
      company: rec.company,
      name: contact.name,
      role: contact.role,
      connectionBasis: contact.connectionBasis,
      intensity: "lukewarm" as const,
      snippet: generateSnippet(contact.name, rec, user, profile),
      contactEmail: contact.contactEmail,
      contactLinkedin: contact.contactLinkedin,
      contactGithub: contact.contactGithub,
    }));
  });

  return {
    reportId,
    summary,
    recommendations,
    resume,
    outreach,
  };
}

// ─── GitHub contact fetching ────────────────────────────────────────────────

interface GitHubMember { login: string; }
interface GitHubProfile {
  login: string;
  name: string | null;
  bio: string | null;
  email: string | null;
  html_url: string;
}

type Contact = {
  name: string;
  role: string;
  connectionBasis: string;
  contactEmail?: string;
  contactLinkedin?: string;
  contactGithub?: string;
};

// In-process cache — persists for lifetime of the serverless function instance
const ghCache = new Map<string, { contacts: Contact[]; at: number }>();
const GH_TTL = 1000 * 60 * 60 * 6; // 6 hours

async function fetchGitHubContacts(org: string, count = 2): Promise<Contact[]> {
  const cached = ghCache.get(org);
  if (cached && Date.now() - cached.at < GH_TTL) return cached.contacts;

  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "job-weekly-app",
  };
  if (process.env.GITHUB_TOKEN) headers["Authorization"] = `Bearer ${process.env.GITHUB_TOKEN}`;

  try {
    const membersRes = await fetch(
      `https://api.github.com/orgs/${org}/members?per_page=50&role=member`,
      { headers, next: { revalidate: 21600 } },
    );
    if (!membersRes.ok) return [];

    const members: GitHubMember[] = await membersRes.json();
    // Shuffle so different users see different contacts
    const shuffled = [...members].sort(() => Math.random() - 0.5).slice(0, 8);

    const profiles = await Promise.all(
      shuffled.map(async (m) => {
        const r = await fetch(`https://api.github.com/users/${m.login}`, { headers });
        if (!r.ok) return null;
        return r.json() as Promise<GitHubProfile>;
      }),
    );

    const contacts: Contact[] = profiles
      .filter((p): p is GitHubProfile => p !== null && !!p.name)
      .slice(0, count)
      .map((p) => ({
        name: p.name ?? p.login,
        role: p.bio?.split("\n")[0]?.replace(/^[@\w\s]+at\s/i, "").slice(0, 60) ?? "Software Engineer",
        connectionBasis: `Engineer at ${org} on GitHub — public profile`,
        contactGithub: p.login,
        ...(p.email ? { contactEmail: p.email } : {}),
      }));

    ghCache.set(org, { contacts, at: Date.now() });
    return contacts;
  } catch {
    return [];
  }
}

// ─── Job catalog ─────────────────────────────────────────────────────────────

type CatalogEntry = {
  company: string;
  githubOrg: string;
  role: string;
  jobUrl: string;
  reason: string;
  resumeFocus: string[];
  keywords: string[];
};

const catalog: CatalogEntry[] = [
  {
    company: "Databricks",
    githubOrg: "databricks",
    role: "Software Engineering Intern",
    jobUrl: "https://www.databricks.com/company/careers/university-recruiting",
    reason: "Heavy ML infrastructure + Python emphasis — your distributed systems and data pipeline work maps directly.",
    resumeFocus: ["distributed systems", "data pipelines", "Python"],
    keywords: ["ai", "ml", "data", "infrastructure", "research"],
  },
  {
    company: "Vercel",
    githubOrg: "vercel",
    role: "Software Engineering Intern",
    jobUrl: "https://vercel.com/careers",
    reason: "Frontend infrastructure at scale — Next.js and edge compute experience is a direct match.",
    resumeFocus: ["Next.js", "frontend", "TypeScript"],
    keywords: ["frontend", "next", "edge", "product", "web"],
  },
  {
    company: "Anthropic",
    githubOrg: "anthropics",
    role: "Research Engineer Intern",
    jobUrl: "https://www.anthropic.com/careers",
    reason: "Strong ML research background makes you competitive — they hire for both safety evals and applied research.",
    resumeFocus: ["machine learning", "research", "Python"],
    keywords: ["research", "ai", "safety", "ml", "llm"],
  },
  {
    company: "Stripe",
    githubOrg: "stripe",
    role: "Software Engineering Intern",
    jobUrl: "https://stripe.com/jobs",
    reason: "Payments infrastructure is complex distributed systems — your backend experience is highly relevant.",
    resumeFocus: ["backend", "APIs", "reliability"],
    keywords: ["fintech", "backend", "payments", "infrastructure", "api"],
  },
  {
    company: "Linear",
    githubOrg: "linearapp",
    role: "Software Engineering Intern",
    jobUrl: "https://linear.app/careers",
    reason: "Small high-craft team building developer tools — strong TypeScript and product sense stand out.",
    resumeFocus: ["TypeScript", "product", "developer tools"],
    keywords: ["product", "devtools", "typescript", "design", "frontend"],
  },
  {
    company: "Figma",
    githubOrg: "figma",
    role: "Software Engineering Intern",
    jobUrl: "https://www.figma.com/careers/",
    reason: "Graphics, performance, and collaborative systems — your frontend + systems work is the right mix.",
    resumeFocus: ["frontend", "performance", "collaboration"],
    keywords: ["design", "frontend", "product", "collaboration", "graphics"],
  },
  {
    company: "Notion",
    githubOrg: "makenotion",
    role: "Software Engineering Intern",
    jobUrl: "https://www.notion.so/careers",
    reason: "Design-minded engineering culture — strong product sense and full-stack experience are valued.",
    resumeFocus: ["full-stack", "product", "React"],
    keywords: ["product", "fullstack", "collaboration", "notion", "design"],
  },
];

function getSuggestionPool(prefs: typeof jobPreferences.$inferSelect | null) {
  if (!prefs) return catalog.slice(0, 3);
  const role = (prefs.targetRoles ?? "").toLowerCase();
  const industries = (prefs.industries ?? "").toLowerCase();

  const matches = catalog.filter((entry) =>
    entry.keywords.some((k) => role.includes(k) || industries.includes(k)),
  );

  if (matches.length >= 3) return matches.slice(0, 3);
  return [...matches, ...catalog].slice(0, 3);
}

function generateSnippet(
  contactName: string,
  rec: CatalogEntry,
  user: typeof users.$inferSelect,
  profile: typeof profiles.$inferSelect | null,
) {
  const school = profile?.university ?? "my university";
  const myName = user.firstName ?? "Hey";
  const firstName = contactName.split(" ")[0] ?? "Hi";
  return `${firstName} — ${myName} here, CS student at ${school}. I’m applying for ${rec.role} roles at ${rec.company} and came across your profile. I’ve been focused on ${rec.resumeFocus[0]} and would love to hear about your experience there. Any chance you’d be open to a quick chat?`;
}
