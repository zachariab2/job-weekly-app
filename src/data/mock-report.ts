export const mockWeeklyReport = {
  generatedAt: "March 10, 2026",
  nextDelivery: "Tuesday · 7:00 AM EST",
  summary:
    "You’re positioned strongest for AI/ML internships at product-led growth teams. Prioritize structured referrals at Databricks, Vercel, and Duolingo this week.",
  highlights: [
    "3 new alumni referral paths identified",
    "Resume keywords tailored for Databricks AI Residency",
    "Outreach templates pre-drafted for 5 top matches",
  ],
  companies: [
    {
      name: "Databricks",
      role: "AI Residency Intern",
      reason:
        "Heavy research emphasis with Python + distributed systems — aligns with your MLOps project at Columbia.",
      alumni: "2 alumni",
      referralStatus: "Warm intro pending",
      resumeFocus: ["LLM evaluation", "Spark pipelines", "Distributed training"],
    },
    {
      name: "Vercel",
      role: "Product Engineering Intern",
      reason:
        "Blend of frontend systems + platform reliability; your Next.js open-source contributions are a direct match.",
      alumni: "1 alumni",
      referralStatus: "DM ready",
      resumeFocus: ["Next.js OSS", "Edge deployment", "DX research"],
    },
    {
      name: "Anthropic",
      role: "Applied Research Intern",
      reason:
        "Strong math + research background; highlight your transformer pruning work.",
      alumni: "No direct alumni",
      referralStatus: "Adjacent researcher",
      resumeFocus: ["Transformer pruning", "Safety frameworks", "Python/NumPy"],
    },
  ],
  resumeChanges: [
    {
      company: "Databricks",
      updates: [
        "Elevate Spark pipeline bullet to top of Experience section",
        "Add metrics around 30% inference latency reduction",
        "Reference MLflow integration explicitly",
      ],
    },
    {
      company: "Vercel",
      updates: [
        "Highlight developer experience research in first bullet",
        "Name-drop Next.js RFC participation",
        "Add TypeScript performance profiling details",
      ],
    },
  ],
  outreachTemplates: [
    {
      company: "Databricks",
      contact: "Aria Patel (BS ’22, ML Platform)",
      snippet:
        "Hi Aria — fellow Columbia CS ’26 here. I’ve been leading the ML observability work for our campus ML club and recently shipped a Spark-based pipeline...",
    },
    {
      company: "Vercel",
      contact: "Diego Ramirez (DevRel)",
      snippet:
        "Diego, huge fan of the DX work your team ships. I built an onboarding diagnostic for student teams that plugs into Vercel’s performance APIs...",
    },
  ],
};

export const applications = [
  {
    company: "Palantir",
    role: "Forward Deployed Intern",
    status: "Interview",
    date: "Feb 28",
  },
  { company: "Notion", role: "Product Engineer Intern", status: "Applied", date: "Mar 02" },
  { company: "Vercel", role: "Product Engineer", status: "Preparing", date: "Mar 05" },
];
