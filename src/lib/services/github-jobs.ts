/**
 * Fetches live job listings from three community-maintained GitHub repos:
 *
 * - SimplifyJobs/Summer2026-Internships  (HTML table format, age in days)
 * - vanshb03/Summer2027-Internships      (markdown pipe table, date as "Apr 28")
 * - SimplifyJobs/New-Grad-Positions      (HTML table format, age in days)
 *
 * No API key needed. Repos are updated daily by the community.
 */

const SOURCES = [
  {
    url: "https://raw.githubusercontent.com/SimplifyJobs/Summer2026-Internships/dev/README.md",
    format: "html" as const,
    jobTypes: ["internship", "co-op"],
  },
  {
    url: "https://raw.githubusercontent.com/vanshb03/Summer2027-Internships/main/README.md",
    format: "markdown-vansh" as const,
    jobTypes: ["internship", "co-op"],
  },
  {
    url: "https://raw.githubusercontent.com/SimplifyJobs/New-Grad-Positions/dev/README.md",
    format: "html" as const,
    jobTypes: ["new grad", "full-time", "fulltime"],
  },
  {
    url: "https://raw.githubusercontent.com/speedyapply/2026-SWE-College-Jobs/main/README.md",
    format: "markdown-speedy" as const,
    jobTypes: ["internship", "co-op"],
  },
  {
    url: "https://raw.githubusercontent.com/speedyapply/2026-SWE-College-Jobs/main/NEW_GRAD_USA.md",
    format: "markdown-speedy" as const,
    jobTypes: ["new grad", "full-time", "fulltime"],
  },
];

const MAX_AGE_DAYS = 60;

export type GitHubJob = {
  company: string;
  role: string;
  location: string;
  applyUrl: string | null;
  ageInDays: number;
};

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/[🔥🛂🇺🇸🎓⚡]/gu, "")
    .trim();
}

function parseApplyUrlFromCell(cell: string): string | null {
  if (cell.includes("🔒")) return null;
  const match = cell.match(/href="([^"]+)"/);
  if (!match) return null;
  const url = match[1];
  // Skip links that point to simplify company pages (not job postings)
  if (url.includes("simplify.jobs/c/")) return null;
  return url;
}

// ---------------------------------------------------------------------------
// HTML table parser (SimplifyJobs format)
// Age cell contains e.g. "3d", "14d"
// ---------------------------------------------------------------------------

function parseHtmlTable(markdown: string): GitHubJob[] {
  const jobs: GitHubJob[] = [];
  let lastCompany = "";

  const parts = markdown.split("<tr>");
  for (const part of parts) {
    const cells = part.split("<td>");
    if (cells.length < 6) continue;

    const companyRaw = cells[1]?.split("</td>")[0] ?? "";
    const roleRaw    = cells[2]?.split("</td>")[0] ?? "";
    const locRaw     = cells[3]?.split("</td>")[0] ?? "";
    const appRaw     = cells[4]?.split("</td>")[0] ?? "";
    const ageRaw     = cells[5]?.split("</td>")[0] ?? "";

    if (companyRaw.includes("<th>") || roleRaw.trim() === "Role") continue;

    const cleanCompany = stripHtml(companyRaw).trim();
    let company: string;
    if (cleanCompany === "↳" || cleanCompany === "") {
      company = lastCompany;
    } else {
      company = cleanCompany;
      lastCompany = company;
    }
    if (!company) continue;

    const role = stripHtml(roleRaw);
    if (!role) continue;

    const location = locRaw
      .replace(/<br\s*\/?>/gi, " | ")
      .replace(/<[^>]+>/g, "")
      .trim();

    const applyUrl = parseApplyUrlFromCell(appRaw);

    const ageMatch = ageRaw.match(/(\d+)/);
    const ageInDays = ageMatch ? parseInt(ageMatch[1], 10) : 999;

    if (ageInDays > MAX_AGE_DAYS) continue;

    jobs.push({ company, role, location, applyUrl, ageInDays });
  }

  return jobs;
}

// ---------------------------------------------------------------------------
// Markdown pipe table parser (vanshb03 format)
// Date cell contains e.g. "Apr 28", "Feb 07"
// ---------------------------------------------------------------------------

const MONTH_MAP: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

function parseDateToAgeDays(dateStr: string): number {
  const parts = dateStr.trim().split(" ");
  if (parts.length < 2) return 999;
  const month = MONTH_MAP[parts[0].toLowerCase().slice(0, 3)];
  const day = parseInt(parts[1], 10);
  if (month === undefined || isNaN(day)) return 999;

  const now = new Date();
  // Try current year first; if future, use previous year
  let date = new Date(now.getFullYear(), month, day);
  if (date > now) date = new Date(now.getFullYear() - 1, month, day);

  const diffMs = now.getTime() - date.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

function parseMarkdownTable(markdown: string): GitHubJob[] { // vanshb03 format
  const jobs: GitHubJob[] = [];
  let lastCompany = "";

  const lines = markdown.split("\n");
  for (const line of lines) {
    // Pipe table rows start and end with |
    if (!line.startsWith("|") || line.includes("---")) continue;

    const cells = line.split("|").map((c) => c.trim()).filter((c, i, arr) => i > 0 && i < arr.length - 1);
    if (cells.length < 4) continue;

    const [companyCell, roleCell, locationCell, appCell, dateCell] = cells;

    // Skip header row
    if (companyCell === "Company" || companyCell === "---") continue;

    const cleanCompany = stripHtml(companyCell ?? "").trim();
    let company: string;
    if (cleanCompany === "↳" || cleanCompany === "") {
      company = lastCompany;
    } else {
      company = cleanCompany;
      lastCompany = company;
    }
    if (!company) continue;

    const role = stripHtml(roleCell ?? "").replace(/[🛂🇺🇸]/gu, "").trim();
    if (!role) continue;

    const location = (locationCell ?? "")
      .replace(/<\/br>/gi, " | ")
      .replace(/<br>/gi, " | ")
      .replace(/<details>[\s\S]*?<\/details>/gi, "Multiple locations")
      .replace(/<[^>]+>/g, "")
      .trim();

    const applyUrl = parseApplyUrlFromCell(appCell ?? "");
    const ageInDays = parseDateToAgeDays(dateCell ?? "");

    if (ageInDays > MAX_AGE_DAYS) continue;

    jobs.push({ company, role, location, applyUrl, ageInDays });
  }

  return jobs;
}

// ---------------------------------------------------------------------------
// speedyapply markdown parser
// Format: | Company | Position | Location | Salary | Posting | Age |
// ---------------------------------------------------------------------------

function parseSpeedyApplyTable(markdown: string): GitHubJob[] {
  const jobs: GitHubJob[] = [];

  for (const line of markdown.split("\n")) {
    if (!line.startsWith("|") || line.includes("---")) continue;
    const cells = line.split("|").map((c) => c.trim()).filter((_, i, arr) => i > 0 && i < arr.length - 1);

    // 6-col: Company | Position | Location | Salary | Posting | Age
    // 5-col: Company | Position | Location | Posting | Age
    const hasSalary = cells.length >= 6;
    const companyCell  = cells[0] ?? "";
    const positionCell = cells[1] ?? "";
    const locationCell = cells[2] ?? "";
    const postingCell  = hasSalary ? (cells[4] ?? "") : (cells[3] ?? "");
    const ageCell      = hasSalary ? (cells[5] ?? "") : (cells[4] ?? "");

    if (companyCell === "Company" || companyCell === "---") continue;
    if (!companyCell || !positionCell) continue;

    const company = stripHtml(companyCell).trim();
    if (!company) continue;

    const role = stripHtml(positionCell).trim();
    if (!role) continue;

    const location = locationCell.replace(/<[^>]+>/g, "").trim();
    const applyUrl = parseApplyUrlFromCell(postingCell);

    const ageMatch = ageCell.match(/(\d+)/);
    const ageInDays = ageMatch ? parseInt(ageMatch[1], 10) : 999;
    if (ageInDays > MAX_AGE_DAYS) continue;

    jobs.push({ company, role, location, applyUrl, ageInDays });
  }

  return jobs;
}

// ---------------------------------------------------------------------------
// Fetch all sources
// ---------------------------------------------------------------------------

export async function fetchGitHubJobs(userJobTypes: string): Promise<GitHubJob[]> {
  const normalizedTypes = userJobTypes.toLowerCase();

  const relevantSources = SOURCES.filter((s) =>
    s.jobTypes.some((t) => normalizedTypes.includes(t)) ||
    !userJobTypes.trim()
  );

  // Fetch all relevant sources in parallel
  const results = await Promise.all(
    relevantSources.map(async (source) => {
      try {
        const res = await fetch(source.url, { next: { revalidate: 3600 } });
        if (!res.ok) return [];
        const markdown = await res.text();
        if (source.format === "html") return parseHtmlTable(markdown);
        if (source.format === "markdown-vansh") return parseMarkdownTable(markdown);
        return parseSpeedyApplyTable(markdown);
      } catch (err) {
        console.error(`[fetchGitHubJobs] failed for ${source.url}:`, err instanceof Error ? err.message : String(err));
        return [];
      }
    })
  );

  // Merge and deduplicate by company+role
  const seen = new Set<string>();
  const merged: GitHubJob[] = [];
  for (const batch of results) {
    for (const job of batch) {
      const key = `${job.company.toLowerCase()}||${job.role.toLowerCase()}`;
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(job);
      }
    }
  }

  return merged;
}

// ---------------------------------------------------------------------------
// Filter for a specific user
// ---------------------------------------------------------------------------

const ROLE_KEYWORDS: Record<string, string[]> = {
  "software engineer":   ["software", "swe", "engineer", "developer", "backend", "frontend", "full stack", "fullstack"],
  "backend engineer":    ["backend", "back-end", "software", "engineer", "developer"],
  "frontend engineer":   ["frontend", "front-end", "ui engineer", "web engineer", "software"],
  "full stack engineer": ["full stack", "fullstack", "software", "engineer", "developer"],
  "data engineer":       ["data engineer", "data platform", "data infrastructure", "etl", "pipeline"],
  "data analyst":        ["data analyst", "analytics", "business intelligence"],
  "ml engineer":         ["machine learning", "ml engineer", "ai engineer", "deep learning", "nlp", "llm"],
  "product manager":     ["product manager", "product management", "pm intern", "product intern"],
};

function roleMatches(jobRole: string, targetRoles: string): boolean {
  if (!targetRoles.trim()) return true;
  const lower = jobRole.toLowerCase();
  const targets = targetRoles.toLowerCase().split(",").map((s) => s.trim());
  for (const target of targets) {
    const keywords = ROLE_KEYWORDS[target] ?? [target];
    if (keywords.some((kw) => lower.includes(kw))) return true;
  }
  return false;
}

function locationMatches(jobLocation: string, userLocations: string, remotePreference: string): boolean {
  const loc = jobLocation.toLowerCase();
  const wantsRemote = remotePreference.toLowerCase() === "remote";
  if (wantsRemote) return loc.includes("remote");
  if (!userLocations.trim()) return true;
  // Always include remote unless explicitly on-site only
  if (loc.includes("remote") && remotePreference.toLowerCase() !== "on-site") return true;
  const prefs = userLocations.toLowerCase().split(",").map((s) => s.trim());
  return prefs.some((p) => loc.includes(p));
}

export function filterJobsForUser(
  jobs: GitHubJob[],
  targetRoles: string,
  locations: string,
  remotePreference: string,
  dreamCompanies: string,
  limit = 10,
): GitHubJob[] {
  const dreams = dreamCompanies
    .split(",")
    .map((c) => c.trim().toLowerCase())
    .filter(Boolean);

  const dreamMatches = jobs.filter(
    (j) => dreams.some((d) => j.company.toLowerCase().includes(d)) && roleMatches(j.role, targetRoles)
  );

  const regularMatches = jobs.filter(
    (j) =>
      !dreams.some((d) => j.company.toLowerCase().includes(d)) &&
      roleMatches(j.role, targetRoles) &&
      locationMatches(j.location, locations, remotePreference)
  );

  const sorted = [
    ...dreamMatches.sort((a, b) => a.ageInDays - b.ageInDays),
    ...regularMatches.sort((a, b) => a.ageInDays - b.ageInDays),
  ];

  const seen = new Set<string>();
  const result: GitHubJob[] = [];
  for (const job of sorted) {
    const key = `${job.company}||${job.role}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(job);
    }
  }

  return result.slice(0, limit);
}
