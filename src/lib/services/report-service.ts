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
import { loadManualContacts, type ManualContact } from "@/lib/manual-contacts";
import { fetchGitHubJobs, filterJobsForUser } from "./github-jobs";

// Lazy OpenAI client — do NOT initialize at module level.
// The OpenAI constructor throws if OPENAI_API_KEY is missing, which would crash
// every page that imports this module (even pages that never call OpenAI).
function getOpenAI(): OpenAI {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// ─── PDF ──────────────────────────────────────────────────────────────────────

export async function getResumeText(resumePath: string | null | undefined): Promise<string | null> {
  if (!resumePath) return null;
  try {
    let buffer: Buffer;
    if (resumePath.startsWith("http")) {
      const token = process.env.BLOB_READ_WRITE_TOKEN;
      const res = await fetch(resumePath, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      buffer = Buffer.from(await res.arrayBuffer());
    } else {
      buffer = await readFile(resumePath);
    }
    // Dynamic import so pdf-parse doesn't execute on module load (breaks serverless)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfParseModule = await import("pdf-parse");
    const pdfParse = (pdfParseModule as any).default ?? pdfParseModule;
    const parsed = await pdfParse(buffer);
    return parsed.text.trim() || null;
  } catch (err) {
    console.error("[getResumeText] failed:", err instanceof Error ? err.message : String(err));
    return null;
  }
}

// ─── JSearch ──────────────────────────────────────────────────────────────────

const AGGREGATOR_DOMAINS = [
  "indeed.com", "ziprecruiter.com", "glassdoor.com", "monster.com",
  "careerbuilder.com", "simplyhired.com", "snagajob.com", "dice.com",
  "linkedin.com/jobs", "jobs.lever.co", "job-boards", "jobboard",
];

function cleanJobUrl(url: string | null): string | null {
  if (!url) return null;
  if (AGGREGATOR_DOMAINS.some((d) => url.includes(d))) return null;
  return url;
}

type JSearchJob = {
  job_id: string;
  employer_name: string;
  job_title: string;
  job_apply_link: string | null;
  job_description: string | null;
};

// Maps onboarding job type labels → JSearch employment_types values
function toJSearchEmploymentTypes(jobTypes: string): string {
  const map: Record<string, string> = {
    "internship": "INTERN",
    "co-op": "INTERN",
    "new grad": "FULLTIME",
    "full-time": "FULLTIME",
    "contract": "CONTRACTOR",
  };
  const types = jobTypes
    .split(",")
    .map((t) => map[t.trim().toLowerCase()])
    .filter(Boolean);
  return [...new Set(types)].join(",");
}

async function fetchJSearchJobs(
  query: string,
  employmentTypes: string,
  count = 10,
  remoteOnly = false,
): Promise<JSearchJob[]> {
  const apiKey = process.env.JSEARCH_API_KEY;
  if (!apiKey) return [];
  try {
    const params = new URLSearchParams({
      query,
      num_pages: "1",
      date_posted: "month",
    });
    if (employmentTypes) params.set("employment_types", employmentTypes);
    if (remoteOnly) params.set("remote_jobs_only", "true");
    const url = `https://jsearch.p.rapidapi.com/search?${params}`;
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
  const response = await getOpenAI().chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: 600,
    messages: [{
      role: "user",
      content: `You are reviewing what an AI resume writer changed when it tailored a student's resume for a specific job.

RESUME:
${resumeText.slice(0, 3000)}

JOB: ${role} at ${company}
JOB DESCRIPTION: ${jobDescription.slice(0, 1000)}

Return exactly 4 lines:
1. REASON: one sentence (max 20 words) explaining why this role is a strong match for this student. Be specific — mention an actual skill or project from their resume.
2-4. Three bullet points starting with "•" — past tense, describing what was specifically rewritten in the tailored version. Reference actual content from their resume (specific projects, skills, or companies). Examples of the right tone: "Moved Python and ML frameworks to top of skills list", "Rewrote [Project Name] bullets to lead with model accuracy improvements", "Reframed [Company] experience to emphasize data pipeline scale".

Format:
REASON: <sentence>
• <what was changed>
• <what was changed>
• <what was changed>`,
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

// ─── Resume skill extraction ──────────────────────────────────────────────────

const SKILL_LIST = [
  "Python","JavaScript","TypeScript","React","Node.js","Java","C++","C#","Go","Rust","Swift","Kotlin",
  "SQL","PostgreSQL","MySQL","MongoDB","Redis","GraphQL","REST","AWS","GCP","Azure","Docker","Kubernetes",
  "machine learning","deep learning","NLP","LLM","PyTorch","TensorFlow","scikit-learn","pandas","numpy",
  "Next.js","Express","Django","FastAPI","Spring","Rails","Flutter","React Native",
  "data engineering","data science","backend","frontend","full stack","distributed systems",
  "Spark","Kafka","Airflow","dbt","Snowflake","BigQuery","Databricks",
  "iOS","Android","mobile","embedded","systems","security","blockchain","fintech",
  "video editing","Adobe Premiere","Final Cut Pro","DaVinci Resolve","After Effects","CapCut",
  "Canva","content creation","social media","TikTok","Instagram","YouTube","content strategy",
  "copywriting","SEO","brand partnerships","influencer","email marketing","Adobe Photoshop",
  "graphic design","Figma","UX design","UX research","project management","Notion","Asana",
  "public relations","communications","journalism","writing","marketing","paid ads","analytics",
  "Salesforce","HubSpot","customer success","account management","sales","business development",
];

function extractTopSkills(resumeText: string, max = 4): string {
  const lower = resumeText.toLowerCase();
  const found = SKILL_LIST.filter((skill) => lower.includes(skill.toLowerCase()));
  return found.slice(0, max).join(" ");
}

// ─── TTL ──────────────────────────────────────────────────────────────────────

export const REPORT_TTL_MS = 1000 * 60 * 60 * 24 * 3; // 3 days

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Read the latest report from DB only. Never blocks on generation.
 * Returns null if no report exists yet.
 */
export async function getLatestReport(userId: string) {
  try {
    return await db.query.reports.findFirst({
      where: eq(reports.userId, userId),
      orderBy: desc(reports.generatedAt),
      with: {
        recommendations: true,
        networking: true,
        resumeRecommendations: true,
      },
    }) ?? null;
  } catch (err) {
    console.error("[getLatestReport] DB query failed:", err instanceof Error ? err.message : String(err));
    return null;
  }
}

export async function getOrCreateReport(userId: string) {
  const existing = await getLatestReport(userId);

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
  let queryResult;
  try {
    queryResult = await Promise.all([
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
  } catch (err) {
    console.error("[getAllActiveJobsForUser] DB query failed:", err instanceof Error ? err.message : String(err));
    return [];
  }
  const [userReports, userApplications] = queryResult;

  const hiddenKeys = new Set(
    userApplications
      .filter((a) => a.status === "applied" || a.status === "dismissed")
      .map((a) => `${a.company}||${a.role}`),
  );
  const statusMap = new Map(
    userApplications
      .filter((a) => !["applied", "dismissed"].includes(a.status ?? ""))
      .map((a) => [`${a.company}||${a.role}`, a.status]),
  );

  // Merge all contacts across reports by company so admin-added contacts survive regenerations
  const allContactsByCompany = new Map<string, typeof userReports[0]["networking"]>();
  for (const report of userReports) {
    for (const contact of report.networking) {
      const key = (contact.company ?? "").toLowerCase();
      if (!allContactsByCompany.has(key)) allContactsByCompany.set(key, []);
      allContactsByCompany.get(key)!.push(contact);
    }
  }
  // Deduplicate contacts by name+company
  for (const [key, contacts] of allContactsByCompany) {
    const seen2 = new Set<string>();
    allContactsByCompany.set(key, contacts.filter((c) => {
      const ck = `${c.name}||${c.company}`;
      if (seen2.has(ck)) return false;
      seen2.add(ck);
      return true;
    }));
  }

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
      if (seen.has(key) || hiddenKeys.has(key)) continue;
      seen.add(key);
      rows.push({
        rec,
        contacts: allContactsByCompany.get(rec.company.toLowerCase()) ?? [],
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
  const storedText = (profile as typeof profile & { resumeText?: string | null })?.resumeText ?? null;
  const resumeText = storedText ?? await getResumeText(resumePath);

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

  // Fetch live jobs from GitHub community repos (free, no API key, updated daily)
  const allGitHubJobs = await fetchGitHubJobs(prefs?.jobTypes ?? "internship");
  const githubMatches = filterJobsForUser(
    allGitHubJobs,
    targetRole,
    prefs?.locations ?? "",
    prefs?.remotePreference ?? "",
    prefs?.dreamCompanies ?? "",
    5,
  );

  let jobData: Array<{
    company: string;
    role: string;
    jobUrl: string | null;
    description: string;
  }>;

  const githubJobData = githubMatches.map((j) => ({
    company: j.company,
    role: j.role,
    jobUrl: j.applyUrl,
    description: "",
  }));

  // Fall back to JSearch if GitHub yields too few results
  const needsMore = githubJobData.length < 5;
  let fallbackJobs: typeof githubJobData = [];

  if (needsMore) {
    const employmentTypes = toJSearchEmploymentTypes(prefs?.jobTypes ?? "internship");
    const remoteOnly = (prefs?.remotePreference ?? "").toLowerCase() === "remote";
    const locationHint = prefs?.locations ? prefs.locations.split(",")[0].trim() : "";
    const primaryQuery = `${targetRole} ${locationHint}`.trim();
    const jsearchResults = await fetchJSearchJobs(primaryQuery, employmentTypes, 5 - githubJobData.length, remoteOnly);
    fallbackJobs = jsearchResults.map((j) => ({
      company: j.employer_name,
      role: j.job_title,
      jobUrl: cleanJobUrl(j.job_apply_link),
      description: j.job_description ?? "",
    }));
  }

  jobData = [...githubJobData, ...fallbackJobs];

  const manualContacts = await loadManualContacts();

  // Enrich each job with contacts (catalog + manual ops list)
  const enrichedJobs = jobData.map((job) => {
    const catalogEntry = catalog.find(
      (c) => c.company.toLowerCase() === job.company.toLowerCase(),
    );
    const opsContacts = getManualContactsForJob(job.company, job.role, manualContacts);
    return {
      ...job,
      resumeFocus: catalogEntry?.resumeFocus ?? [],
      contacts: [...(catalogEntry?.contacts ?? []), ...opsContacts],
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
      bullets: [] as string[],
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
  // ─── Big Tech ──────────────────────────────────────────────────────────────
  {
    company: "Google",
    role: "Software Engineering Intern",
    jobUrl: "https://www.google.com/about/careers/applications/jobs/results/104981114489053894-software-engineering-intern/",
    reason: "One of the most competitive SWE internships — strong algorithms, systems, or ML background is the entry point.",
    resumeFocus: ["algorithms", "distributed systems", "Python", "C++"],
    contacts: [],
    keywords: ["software", "backend", "frontend", "ml", "infrastructure", "tech", "big tech"],
  },
  {
    company: "Microsoft",
    role: "Software Engineering Intern",
    jobUrl: "https://www.microsoft.com/en-us/research/academic-program/undergraduate-research-internship-computing/",
    reason: "Massive internship program across every team — cloud, AI, developer tools, and more.",
    resumeFocus: ["C#", "Azure", "cloud", "software engineering"],
    contacts: [],
    keywords: ["software", "cloud", "backend", "frontend", "ai", "tech", "big tech"],
  },
  {
    company: "Meta",
    role: "Software Engineering Intern",
    jobUrl: "https://www.metacareers.com/jobs/2659361741072293/",
    reason: "Strong infrastructure, ML, and product teams — scale and impact from day one.",
    resumeFocus: ["React", "Python", "distributed systems", "ML"],
    contacts: [],
    keywords: ["software", "ml", "infrastructure", "product", "social", "tech", "big tech"],
  },
  {
    company: "Apple",
    role: "Software Engineering Intern",
    jobUrl: "https://jobs.apple.com/en-us/details/200606145/software-engineering-internships",
    reason: "Hardware-software intersection, Swift/Obj-C ecosystem, and consumer products at massive scale.",
    resumeFocus: ["Swift", "iOS", "systems", "C++"],
    contacts: [],
    keywords: ["software", "ios", "mobile", "systems", "hardware", "consumer", "big tech"],
  },
  {
    company: "Amazon",
    role: "Software Development Engineer Intern",
    jobUrl: "https://amazon.jobs/en/jobs/3168855/system-development-engineer-internship-2026-us-project-leo",
    reason: "AWS, retail, and emerging tech — backend and distributed systems experience is core.",
    resumeFocus: ["backend", "distributed systems", "Java", "AWS"],
    contacts: [],
    keywords: ["software", "backend", "cloud", "aws", "infrastructure", "ecommerce", "big tech"],
  },
  {
    company: "NVIDIA",
    role: "Software Engineering Intern",
    jobUrl: "https://nvidia.wd5.myworkdayjobs.com/en-US/NVIDIAExternalCareerSite/job/NVIDIA-2026-Internships--Software-Engineering-_JR2003206",
    reason: "GPU computing, CUDA, and AI infrastructure — the backbone of modern deep learning.",
    resumeFocus: ["CUDA", "C++", "GPU", "deep learning", "systems"],
    contacts: [],
    keywords: ["gpu", "ai", "ml", "systems", "hardware", "infrastructure", "research"],
  },
  // ─── AI / Research ────────────────────────────────────────────────────────
  {
    company: "OpenAI",
    role: "Software Engineer Intern/Co-op",
    jobUrl: "https://jobs.ashbyhq.com/openai/566ce27d-8a1c-497c-a301-0912010d7b29",
    reason: "Frontier AI research and deployment — ML and systems engineers with strong fundamentals stand out.",
    resumeFocus: ["Python", "machine learning", "LLM", "research"],
    contacts: [],
    keywords: ["ai", "ml", "llm", "research", "safety", "deep learning"],
  },
  {
    company: "Databricks",
    role: "Data Science Intern",
    jobUrl: "https://www.databricks.com/company/careers/university-recruiting/data-science-intern-2026-start-6866538002",
    reason: "Data lakehouse and ML infrastructure — Python and distributed computing experience maps directly.",
    resumeFocus: ["Python", "Spark", "distributed systems", "data engineering"],
    contacts: [],
    keywords: ["ai", "ml", "data", "infrastructure", "research", "databricks"],
  },
  {
    company: "Scale AI",
    role: "Software Engineering Intern",
    jobUrl: "https://job-boards.greenhouse.io/scaleai/jobs/4606014005",
    reason: "Data labeling and AI infrastructure at the core of every frontier model — fast-paced and high-impact.",
    resumeFocus: ["Python", "backend", "data pipelines", "ML"],
    contacts: [],
    keywords: ["ai", "ml", "data", "backend", "infrastructure", "llm"],
  },
  {
    company: "Harvey",
    role: "Software Engineering Intern",
    jobUrl: "https://jobs.ashbyhq.com/harvey/b6509622-5c1e-4a3f-916b-6e56b8fd212f",
    reason: "LLM-powered legal tech startup — small team, huge scope, strong engineering culture.",
    resumeFocus: ["Python", "LLM", "backend", "TypeScript"],
    contacts: [],
    keywords: ["ai", "llm", "legaltech", "startup", "backend", "product"],
  },
  {
    company: "Adobe",
    role: "Machine Learning Engineer Intern",
    jobUrl: "https://careers.adobe.com/us/en/job/ADOBUSR162228EXTERNALENUS/2026-Intern-Machine-Learning-Engineer",
    reason: "Creative AI, computer vision, and generative models — ML research and engineering blend together.",
    resumeFocus: ["machine learning", "Python", "PyTorch", "computer vision"],
    contacts: [],
    keywords: ["ml", "ai", "computer vision", "design", "creative", "research"],
  },
  // ─── Fintech / Finance ────────────────────────────────────────────────────
  {
    company: "Stripe",
    role: "Software Engineer Intern",
    jobUrl: "https://stripe.com/jobs/listing/software-engineer-intern-summer-and-winter/7210115",
    reason: "Payments infrastructure used by millions — backend and API engineering at serious scale.",
    resumeFocus: ["backend", "APIs", "reliability", "Ruby", "Go"],
    contacts: [],
    keywords: ["fintech", "backend", "payments", "infrastructure", "api", "stripe"],
  },
  {
    company: "Ramp",
    role: "Software Engineer Intern",
    jobUrl: "https://jobs.ashbyhq.com/ramp/ccb1aca4-79ac-414b-b7d8-bc908c575ef1/application",
    reason: "Fastest-growing fintech — full-stack engineers who ship fast thrive here.",
    resumeFocus: ["full-stack", "Python", "TypeScript", "React"],
    contacts: [],
    keywords: ["fintech", "fullstack", "backend", "startup", "payments", "saas"],
  },
  {
    company: "Robinhood",
    role: "Software Engineering Intern, iOS",
    jobUrl: "https://job-boards.greenhouse.io/robinhood/jobs/7239268",
    reason: "Consumer fintech at scale — mobile, backend, and data engineering all valued.",
    resumeFocus: ["iOS", "Swift", "mobile", "fintech"],
    contacts: [],
    keywords: ["fintech", "mobile", "ios", "consumer", "trading"],
  },
  {
    company: "Plaid",
    role: "Software Engineering Intern",
    jobUrl: "https://app.ripplematch.com/v2/public/job/146d369a",
    reason: "Financial data infrastructure connecting banks and fintechs — backend and API engineers in demand.",
    resumeFocus: ["backend", "APIs", "Python", "data"],
    contacts: [],
    keywords: ["fintech", "backend", "api", "data", "infrastructure", "banking"],
  },
  {
    company: "Intuit",
    role: "Backend Engineering Intern",
    jobUrl: "https://jobs.intuit.com/job/mountain-view/summer-2026-backend-engineering-intern/27595/87369451024",
    reason: "TurboTax and QuickBooks powering small business finance — backend at consumer scale.",
    resumeFocus: ["backend", "Java", "cloud", "microservices"],
    contacts: [],
    keywords: ["fintech", "backend", "saas", "consumer", "cloud"],
  },
  {
    company: "Block, Inc.",
    role: "Software Engineer Intern",
    jobUrl: "https://block.xyz/careers/jobs/4904196008",
    reason: "Square, Cash App, and Bitcoin infrastructure — payments and consumer fintech at scale.",
    resumeFocus: ["backend", "mobile", "payments", "distributed systems"],
    contacts: [],
    keywords: ["fintech", "payments", "mobile", "backend", "bitcoin", "consumer"],
  },
  // ─── Quant / Finance ──────────────────────────────────────────────────────
  {
    company: "Jane Street",
    role: "Software Engineering Intern",
    jobUrl: "https://www.janestreet.com/join-jane-street/position/8069279002",
    reason: "Top quant trading firm — OCaml, functional programming, and strong math background valued.",
    resumeFocus: ["algorithms", "functional programming", "math", "systems"],
    contacts: [],
    keywords: ["quant", "finance", "trading", "algorithms", "math", "hft"],
  },
  {
    company: "Two Sigma",
    role: "Quantitative Researcher Intern",
    jobUrl: "https://careers.twosigma.com/careers/JobDetail/New-York-New-York-United-States-Quantitative-Researcher-Internship-2026-Summer/13257",
    reason: "Data-driven quantitative investing — statistics, ML, and financial modeling all apply.",
    resumeFocus: ["Python", "statistics", "machine learning", "data science"],
    contacts: [],
    keywords: ["quant", "finance", "trading", "ml", "data science", "research"],
  },
  {
    company: "Citadel Securities",
    role: "Trading Intern",
    jobUrl: "https://www.citadelsecurities.com/careers/details/designated-market-maker-dmm-trading-intern-us/",
    reason: "Elite market maker — quantitative reasoning, fast decision-making, and technical depth.",
    resumeFocus: ["algorithms", "math", "statistics", "C++"],
    contacts: [],
    keywords: ["quant", "finance", "trading", "hft", "algorithms", "math"],
  },
  {
    company: "Point72",
    role: "Quantitative Researcher Intern",
    jobUrl: "https://careers.point72.com/CSJobDetail?jobName=summer-2027-quantitative-researcher-internship&jobCode=CSS-0012295",
    reason: "Systematic hedge fund — strong stats and ML background with financial application.",
    resumeFocus: ["Python", "R", "statistics", "machine learning"],
    contacts: [],
    keywords: ["quant", "finance", "hedge fund", "research", "ml", "statistics"],
  },
  {
    company: "Goldman Sachs",
    role: "Analyst Intern",
    jobUrl: "https://higher.gs.com/roles/150598",
    reason: "Global investment bank — technology division values strong SWE and data skills.",
    resumeFocus: ["Java", "Python", "data", "backend"],
    contacts: [],
    keywords: ["finance", "banking", "tech", "data", "quant", "investment banking"],
  },
  {
    company: "Morgan Stanley",
    role: "AI Strategy & Solutions Intern",
    jobUrl: "https://morganstanley.tal.net/vx/lang-en-GB/mobile-0/brand-2/xf-f03044b2dac6/spa-1/candidate/so/pm/1/pl/1/opp/19975-2026-Firmwide-AI-Strategy-Solutions-Summer-Analyst-Program-New-York/en-GB",
    reason: "Wall Street applying AI to financial services — ML and strategy skills valued equally.",
    resumeFocus: ["Python", "machine learning", "data analysis", "finance"],
    contacts: [],
    keywords: ["finance", "ai", "ml", "banking", "strategy", "data"],
  },
  {
    company: "JPMorgan Chase",
    role: "Software Engineer Intern",
    jobUrl: "https://jpmc.fa.oraclecloud.com/hcmUI/CandidateExperience/en/sites/CX_1001/job/210650080",
    reason: "Largest US bank's tech division — Java, cloud, and fintech infrastructure at massive scale.",
    resumeFocus: ["Java", "Python", "cloud", "backend"],
    contacts: [],
    keywords: ["finance", "banking", "backend", "cloud", "tech", "fintech"],
  },
  // ─── Infrastructure / Cloud ───────────────────────────────────────────────
  {
    company: "Cloudflare",
    role: "Software Engineering Intern",
    jobUrl: "https://job-boards.greenhouse.io/cloudflare/jobs/7206269",
    reason: "Edge computing and internet security at the largest scale — Rust, Go, and networking expertise valued.",
    resumeFocus: ["Rust", "Go", "networking", "systems", "security"],
    contacts: [],
    keywords: ["infrastructure", "security", "networking", "systems", "edge", "cloud"],
  },
  {
    company: "Datadog",
    role: "Software Engineering Intern",
    jobUrl: "https://careers.datadoghq.com/detail/7367016/",
    reason: "Monitoring and observability infrastructure — Go, distributed systems, and backend at cloud scale.",
    resumeFocus: ["Go", "distributed systems", "backend", "monitoring"],
    contacts: [],
    keywords: ["infrastructure", "cloud", "backend", "devops", "monitoring", "saas"],
  },
  {
    company: "Atlassian",
    role: "Site Reliability Engineer Intern",
    jobUrl: "https://join.atlassian.com/atlassian-talent-community/jobs/20958",
    reason: "Jira and Confluence infrastructure team — reliability engineering and cloud platform work.",
    resumeFocus: ["SRE", "cloud", "Kubernetes", "reliability"],
    contacts: [],
    keywords: ["infrastructure", "cloud", "devops", "sre", "reliability", "saas"],
  },
  {
    company: "MongoDB",
    role: "Software Engineer Intern",
    jobUrl: "https://www.mongodb.com/careers/jobs/7335932",
    reason: "Database infrastructure used by millions — distributed systems and database engineering.",
    resumeFocus: ["distributed systems", "C++", "backend", "databases"],
    contacts: [],
    keywords: ["database", "infrastructure", "backend", "systems", "cloud", "saas"],
  },
  // ─── Consumer / Product ────────────────────────────────────────────────────
  {
    company: "Airbnb",
    role: "Software Engineering Intern",
    jobUrl: "https://careers.airbnb.com/positions/7453837/",
    reason: "Two-sided marketplace at global scale — full-stack and backend engineers with product instincts thrive.",
    resumeFocus: ["React", "Java", "full-stack", "mobile"],
    contacts: [],
    keywords: ["product", "consumer", "fullstack", "mobile", "marketplace"],
  },
  {
    company: "Netflix",
    role: "Technical Program Manager Intern",
    jobUrl: "https://explore.jobs.netflix.net/careers/job/790313344084",
    reason: "Streaming infrastructure at planetary scale — distributed systems, Java, and content delivery.",
    resumeFocus: ["Java", "distributed systems", "backend", "streaming"],
    contacts: [],
    keywords: ["streaming", "consumer", "backend", "infrastructure", "product"],
  },
  {
    company: "Uber",
    role: "Software Engineer Intern",
    jobUrl: "https://university-uber.icims.com/jobs/149140/job",
    reason: "Real-time marketplace platform — Go, backend, and distributed systems at massive global scale.",
    resumeFocus: ["Go", "backend", "distributed systems", "real-time"],
    contacts: [],
    keywords: ["backend", "infrastructure", "consumer", "marketplace", "rideshare"],
  },
  {
    company: "Lyft",
    role: "Software Engineer Intern (Backend)",
    jobUrl: "https://app.careerpuck.com/job-board/lyft/job/8130804002",
    reason: "Backend systems powering real-time ridesharing — Python and distributed systems experience valued.",
    resumeFocus: ["Python", "backend", "distributed systems", "real-time"],
    contacts: [],
    keywords: ["backend", "consumer", "marketplace", "rideshare", "python"],
  },
  {
    company: "TikTok",
    role: "Frontend Software Engineer Intern",
    jobUrl: "https://lifeattiktok.com/search/7595306554946193717",
    reason: "Short-form video platform at global scale — frontend, mobile, and recommendation systems.",
    resumeFocus: ["React", "TypeScript", "frontend", "mobile"],
    contacts: [],
    keywords: ["frontend", "mobile", "consumer", "social", "video", "content"],
  },
  {
    company: "Notion",
    role: "Software Engineer Intern, Mobile",
    jobUrl: "https://jobs.ashbyhq.com/notion/1bda6206-2258-4c1f-a585-ef31ee56f1d4",
    reason: "Product-first engineering culture building the future of productivity — React Native and TypeScript.",
    resumeFocus: ["React Native", "TypeScript", "mobile", "product"],
    contacts: [],
    keywords: ["product", "mobile", "consumer", "saas", "productivity", "notion"],
  },
  {
    company: "LinkedIn",
    role: "Software Engineering Intern",
    jobUrl: "https://www.linkedin.com/jobs/search/?currentJobId=4309096414",
    reason: "Professional network powering recruiting and B2B — Java, Python, and data engineering valued.",
    resumeFocus: ["Java", "Python", "data", "backend"],
    contacts: [],
    keywords: ["backend", "data", "social", "b2b", "consumer", "recruiting"],
  },
  // ─── Autonomous / Robotics ────────────────────────────────────────────────
  {
    company: "Waymo",
    role: "Software Engineering Intern",
    jobUrl: "https://careers.withwaymo.com/jobs?gh_jid=7347429",
    reason: "Self-driving technology at the frontier — robotics, perception, and systems engineering.",
    resumeFocus: ["C++", "Python", "robotics", "computer vision"],
    contacts: [],
    keywords: ["robotics", "autonomous", "self-driving", "ml", "systems", "computer vision"],
  },
  {
    company: "Tesla",
    role: "Software Engineer Intern",
    jobUrl: "https://www.tesla.com/careers/search/job/261076",
    reason: "Full-stack vehicle software and energy systems — C++, Python, and embedded systems all apply.",
    resumeFocus: ["C++", "Python", "embedded", "systems"],
    contacts: [],
    keywords: ["hardware", "automotive", "robotics", "systems", "embedded", "ev"],
  },
  {
    company: "SpaceX",
    role: "Software Engineering Intern",
    jobUrl: "https://boards.greenhouse.io/spacex/jobs/8190526002",
    reason: "Rockets and satellites — systems engineering, embedded, and reliability at the highest stakes.",
    resumeFocus: ["C++", "embedded", "systems", "reliability"],
    contacts: [],
    keywords: ["aerospace", "systems", "embedded", "hardware", "robotics"],
  },
  {
    company: "Palantir",
    role: "Software Engineering Intern",
    jobUrl: "https://jobs.lever.co/palantir/030ece08-c341-4959-bdfe-314e89b691ce",
    reason: "Data analytics for defense and enterprise — full-stack engineers who can work with complex data.",
    resumeFocus: ["Java", "TypeScript", "full-stack", "data"],
    contacts: [],
    keywords: ["data", "defense", "enterprise", "fullstack", "analytics", "government"],
  },
  // ─── Startups ─────────────────────────────────────────────────────────────
  {
    company: "Ironclad",
    role: "Software Engineer Intern",
    jobUrl: "https://jobs.ashbyhq.com/ironcladhq/95ae3b0a-a061-4323-926a-7fa308b59387",
    reason: "AI-powered contract management — fast-growing legaltech with strong engineering culture.",
    resumeFocus: ["TypeScript", "React", "backend", "full-stack"],
    contacts: [],
    keywords: ["legaltech", "saas", "startup", "fullstack", "ai", "product"],
  },
  {
    company: "Poshmark",
    role: "Software Engineer Intern",
    jobUrl: "https://jobs.ashbyhq.com/poshmark/062b84e6-1633-43ae-870b-83cb62893caa",
    reason: "Social commerce marketplace — cloud platform and growth engineering roles.",
    resumeFocus: ["cloud", "backend", "Python", "growth"],
    contacts: [],
    keywords: ["ecommerce", "consumer", "marketplace", "cloud", "backend", "social"],
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

function getManualContactsForJob(company: string, role: string, manualContacts: ManualContact[]): Contact[] {
  const c = company.toLowerCase();
  const r = role.toLowerCase();

  return manualContacts
    .filter((entry) => {
      if (entry.company.toLowerCase() !== c) return false;
      if (!entry.role) return true;
      return entry.role.toLowerCase() === r;
    })
    .map((entry) => ({
      name: entry.name,
      role: entry.role ?? "Referral contact",
      connectionBasis: entry.connectionBasis ?? "Manual client contact",
      contactEmail: entry.contactEmail,
      contactLinkedin: entry.contactLinkedin,
    }));
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
