export type OnboardingSection = {
  id: string;
  title: string;
  description: string;
  fields: { id: string; label: string; type?: string; required?: boolean; placeholder?: string }[];
};

export const onboardingSections: OnboardingSection[] = [
  {
    id: "identity",
    title: "Identity & Education",
    description: "Ground the profile with essentials recruiters expect.",
    fields: [
      { id: "firstName", label: "First name", required: true },
      { id: "lastName", label: "Last name", required: true },
      { id: "email", label: "Email", type: "email", required: true },
      { id: "phone", label: "Phone", type: "tel" },
      { id: "university", label: "University", required: true },
      { id: "major", label: "Major", required: true },
      { id: "graduation", label: "Graduation month / year", placeholder: "May 2026" },
    ],
  },
  {
    id: "goals",
    title: "Job Search Goals",
    description: "Spell out the roles, timeline, and priorities.",
    fields: [
      { id: "targetRole", label: "Preferred roles", required: true },
      { id: "jobTypes", label: "Job types (new grad, co-op, internship, etc.)", required: true },
      { id: "industries", label: "Industries", placeholder: "AI, productivity tooling" },
      { id: "startDate", label: "Target start date" },
      { id: "locations", label: "Preferred locations" },
    ],
  },
  {
    id: "experience",
    title: "Experience & Resume",
    description: "Upload assets and spotlight wins.",
    fields: [
      { id: "resume", label: "Upload resume", type: "file", required: true },
      { id: "linkedin", label: "LinkedIn URL", type: "url" },
      { id: "skills", label: "Top skills" },
      { id: "projects", label: "Projects to emphasize" },
    ],
  },
  {
    id: "eligibility",
    title: "Eligibility & Constraints",
    description: "Handle sponsorship, relocation, and realities.",
    fields: [
      { id: "workAuth", label: "Work authorization", required: true },
      { id: "relocation", label: "Relocation", placeholder: "Open to SF + NYC" },
    ],
  },
  {
    id: "personalization",
    title: "Personalization",
    description: "Dream companies, alumni preferences, and digest style.",
    fields: [
      { id: "dreamCompanies", label: "Dream companies" },
      { id: "avoid", label: "Companies to avoid" },
      { id: "digestDay", label: "Preferred digest day", placeholder: "Tuesday" },
      { id: "digestTime", label: "Preferred digest time", placeholder: "7:00 AM" },
    ],
  },
];
