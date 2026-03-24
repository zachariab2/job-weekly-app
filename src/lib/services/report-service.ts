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
        alumni: rec.alumni,
        referralPath: rec.referralPath,
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

  // Generate multiple contacts per company
  const outreach = recommendations.flatMap((rec) =>
    rec.contacts.map((contact) => ({
      company: rec.company,
      name: contact.name,
      role: contact.role,
      connectionBasis: contact.connectionBasis,
      intensity: contact.connectionBasis.toLowerCase().includes("alumni") ? "warm" : "lukewarm",
      snippet: generateSnippet(contact.name, rec, user, profile),
      contactEmail: contact.contactEmail,
      contactLinkedin: contact.contactLinkedin,
      contactGithub: contact.contactGithub,
    })),
  );

  return {
    reportId,
    summary,
    recommendations,
    resume,
    outreach,
  };
}

type Contact = {
  name: string;
  role: string;
  connectionBasis: string;
  contactEmail?: string;
  contactLinkedin?: string;
  contactGithub?: string;
};

type CatalogEntry = {
  company: string;
  role: string;
  jobUrl: string;
  reason: string;
  alumni: string;
  referralPath: string;
  resumeFocus: string[];
  contacts: Contact[];
  keywords: string[];
};

const catalog: CatalogEntry[] = [
  {
    company: "Databricks",
    role: "AI Residency Intern",
    jobUrl: "https://www.databricks.com/company/careers/university-recruiting",
    reason: "Heavy research emphasis with Python + distributed systems — aligns with your ML toolkit.",
    alumni: "2 alumni",
    referralPath: "Warm intro pending",
    resumeFocus: ["Spark pipelines", "LLM evaluation"],
    contacts: [
      {
        name: "Aria Patel",
        role: "ML Platform Engineer",
        connectionBasis: "Alumni — same CS program",
        contactEmail: "aria.patel@databricks.com",
        contactLinkedin: "https://linkedin.com/in/aria-patel-db",
      },
      {
        name: "Marcus Webb",
        role: "Research Scientist",
        connectionBasis: "Similar background — distributed ML projects",
        contactGithub: "marcuswebb",
        contactLinkedin: "https://linkedin.com/in/marcus-webb",
      },
    ],
    keywords: ["ai", "ml", "residency", "research"],
  },
  {
    company: "Vercel",
    role: "Product Engineer Intern",
    jobUrl: "https://vercel.com/careers",
    reason: "Blend of frontend systems + platform reliability; Next.js work is a direct match.",
    alumni: "1 alumni",
    referralPath: "DM ready",
    resumeFocus: ["Next.js", "Edge deploy"],
    contacts: [
      {
        name: "Diego Ramirez",
        role: "Developer Relations",
        connectionBasis: "Alumni — graduated same year",
        contactEmail: "diego@vercel.com",
        contactLinkedin: "https://linkedin.com/in/diego-ramirez-vercel",
        contactGithub: "diegoramirez",
      },
      {
        name: "Sonia Park",
        role: "Software Engineer — Edge Runtime",
        connectionBasis: "Similar projects — built open-source Next.js tooling",
        contactGithub: "soniapark",
      },
    ],
    keywords: ["product", "frontend", "next", "edge"],
  },
  {
    company: "Anthropic",
    role: "Applied Research Intern",
    jobUrl: "https://www.anthropic.com/careers",
    reason: "Strong math + research background makes you competitive for safety teams.",
    alumni: "No direct alumni",
    referralPath: "Adjacent researcher",
    resumeFocus: ["Transformer pruning", "Safety evals"],
    contacts: [
      {
        name: "Riya Chen",
        role: "Research Engineer",
        connectionBasis: "Similar background — ML safety publications",
        contactLinkedin: "https://linkedin.com/in/riya-chen-anthropic",
        contactGithub: "riyachen",
      },
    ],
    keywords: ["research", "ai", "safety", "ml"],
  },
  {
    company: "Palantir",
    role: "Forward Deployed Engineer",
    jobUrl: "https://www.palantir.com/careers/",
    reason: "Client-facing build cycles suit your hackathon velocity and full-stack experience.",
    alumni: "1 alumni",
    referralPath: "Coffee chat requested",
    resumeFocus: ["Full-stack", "Impact metrics"],
    contacts: [
      {
        name: "Noah Green",
        role: "Forward Deployed Engineer",
        connectionBasis: "Alumni — CS + minor in data science",
        contactEmail: "ngreen@palantir.com",
        contactLinkedin: "https://linkedin.com/in/noah-green-fde",
      },
      {
        name: "Leila Osman",
        role: "Software Engineer",
        connectionBasis: "Shared project — contributed to same open-source repo",
        contactGithub: "leilaosman",
        contactLinkedin: "https://linkedin.com/in/leila-osman",
      },
    ],
    keywords: ["fde", "full", "client", "data"],
  },
  {
    company: "Notion",
    role: "Software Engineer Intern",
    jobUrl: "https://www.notion.so/careers",
    reason: "Design-minded engineering culture matches your focus on developer tooling UX.",
    alumni: "1 alumni",
    referralPath: "PM referral",
    resumeFocus: ["Design systems", "Collaboration tools"],
    contacts: [
      {
        name: "Maya Ruiz",
        role: "Product Engineer",
        connectionBasis: "Alumni — same university, different major",
        contactLinkedin: "https://linkedin.com/in/maya-ruiz-notion",
        contactEmail: "mruiz@makenotion.com",
      },
    ],
    keywords: ["design", "notion", "collaboration", "product"],
  },
];

function getSuggestionPool(prefs: typeof jobPreferences.$inferSelect | null) {
  if (!prefs) return catalog;
  const role = (prefs.targetRoles ?? "").toLowerCase();
  const industries = (prefs.industries ?? "").toLowerCase();

  const matches = catalog.filter((entry) =>
    entry.keywords.some((keyword) => role.includes(keyword) || industries.includes(keyword)),
  );

  if (matches.length >= 3) return matches;
  return [...matches, ...catalog].slice(0, 3);
}

function generateSnippet(
  contactName: string,
  rec: CatalogEntry,
  user: typeof users.$inferSelect,
  profile: typeof profiles.$inferSelect | null,
) {
  const school = profile?.university ?? "your campus";
  const myName = user.firstName ?? "Hey";
  const firstName = contactName.split(" ")[0] ?? "Hi";
  return `${firstName} — ${myName} here from ${school}. I’m targeting ${rec.role} roles and have been focused on ${rec.resumeFocus[0]}. Would love to connect — any chance you’d be open to a quick referral chat?`;
}
