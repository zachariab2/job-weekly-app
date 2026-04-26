import { sqliteTable, integer, text, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(sql`(strftime('%s','now') * 1000)`)
    .notNull(),
  emailVerifiedAt: integer("email_verified_at", { mode: "timestamp_ms" }),
  emailVerificationToken: text("email_verification_token"),
});

export const profiles = sqliteTable("profiles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().references(() => users.id),
  university: text("university"),
  major: text("major"),
  minor: text("minor"),
  gpa: real("gpa"),
  graduation: text("graduation"),
  degreeLevel: text("degree_level"),
  resumeUrl: text("resume_url"),
  resumeText: text("resume_text"),
  linkedin: text("linkedin"),
  portfolio: text("portfolio"),
  github: text("github"),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .default(sql`(strftime('%s','now') * 1000)`)
    .notNull(),
});

export const jobPreferences = sqliteTable("job_preferences", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").references(() => users.id).notNull(),
  targetRoles: text("target_roles"),
  industries: text("industries"),
  jobTypes: text("job_types"),
  locations: text("locations"),
  remotePreference: text("remote_preference"),
  startDate: text("start_date"),
  urgency: text("urgency"),
  dreamCompanies: text("dream_companies"),
  avoidCompanies: text("avoid_companies"),
  networkingPreference: text("networking_preference"),
  digestDay: text("digest_day"),
  digestTime: text("digest_time"),
  timezone: text("timezone"),
});

export const applications = sqliteTable("applications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").references(() => users.id).notNull(),
  company: text("company").notNull(),
  role: text("role").notNull(),
  status: text("status").notNull(),
  jobType: text("job_type"),
  appliedDate: text("applied_date"),
  notes: text("notes"),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .default(sql`(strftime('%s','now') * 1000)`)
    .notNull(),
});

export const reports = sqliteTable("reports", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id).notNull(),
  generatedAt: integer("generated_at", { mode: "timestamp_ms" })
    .default(sql`(strftime('%s','now') * 1000)`)
    .notNull(),
  summary: text("summary"),
  pdfUrl: text("pdf_url"),
  status: text("status").default("ready"),
});

export const reportRecommendations = sqliteTable("report_recommendations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  reportId: text("report_id").references(() => reports.id).notNull(),
  company: text("company").notNull(),
  role: text("role").notNull(),
  jobType: text("job_type"),
  jobUrl: text("job_url"),
  reasoning: text("reasoning"),
  alumni: text("alumni"),
  referralPath: text("referral_path"),
  resumeFocus: text("resume_focus"),
});

export const networkingLeads = sqliteTable("networking_leads", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  reportId: text("report_id").references(() => reports.id).notNull(),
  name: text("name"),
  company: text("company"),
  role: text("role"),
  connectionBasis: text("connection_basis"),
  intensity: text("intensity"),
  outreachSnippet: text("outreach_snippet"),
  contactEmail: text("contact_email"),
  contactLinkedin: text("contact_linkedin"),
  contactGithub: text("contact_github"),
});

export const resumeRecommendations = sqliteTable("resume_recommendations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  reportId: text("report_id").references(() => reports.id).notNull(),
  company: text("company"),
  bullets: text("bullets"),
});

export const notificationPreferences = sqliteTable("notification_preferences", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").references(() => users.id).notNull(),
  digestDay: text("digest_day").default("Tuesday"),
  digestTime: text("digest_time").default("07:00"),
  timezone: text("timezone").default("America/New_York"),
  emailEnabled: integer("email_enabled", { mode: "boolean" }).default(true),
  smsEnabled: integer("sms_enabled", { mode: "boolean" }).default(false),
  phone: text("phone"),
  notificationThreshold: integer("notification_threshold").default(3),
});

export const subscriptions = sqliteTable("subscriptions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").references(() => users.id).notNull(),
  status: text("status").default("pending"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  trialEndsAt: integer("trial_ends_at", { mode: "timestamp_ms" }),
  currentPeriodEnd: integer("current_period_end", { mode: "timestamp_ms" }),
  price: real("price").default(9.99),
  bonusWeeksApplied: integer("bonus_weeks_applied").default(0),
  cancelAtPeriodEnd: integer("cancel_at_period_end", { mode: "boolean" }).default(false),
});

export const sessions = sqliteTable("sessions", {
  token: text("token").primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(sql`(strftime('%s','now') * 1000)`)
    .notNull(),
});

export const referralCodes = sqliteTable("referral_codes", {
  code: text("code").primaryKey(),
  ownerUserId: text("owner_user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  redeemedByUserId: text("redeemed_by_user_id").references(() => users.id),
  redeemedAt: integer("redeemed_at", { mode: "timestamp_ms" }),
  issuedAt: integer("issued_at", { mode: "timestamp_ms" })
    .default(sql`(strftime('%s','now') * 1000)`)
    .notNull(),
});

export const manualContacts = sqliteTable("manual_contacts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  company: text("company").notNull(),
  role: text("role"),
  name: text("name").notNull(),
  contactEmail: text("contact_email"),
  contactLinkedin: text("contact_linkedin"),
  connectionBasis: text("connection_basis"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(sql`(strftime('%s','now') * 1000)`)
    .notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  profiles: many(profiles),
  jobPreferences: many(jobPreferences),
  applications: many(applications),
  reports: many(reports),
  subscriptions: many(subscriptions),
  sessions: many(sessions),
  referralCodes: many(referralCodes),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const referralCodesRelations = relations(referralCodes, ({ one }) => ({
  owner: one(users, {
    fields: [referralCodes.ownerUserId],
    references: [users.id],
  }),
  redeemedBy: one(users, {
    fields: [referralCodes.redeemedByUserId],
    references: [users.id],
  }),
}));

export const reportsRelations = relations(reports, ({ many }) => ({
  recommendations: many(reportRecommendations),
  networking: many(networkingLeads),
  resumeRecommendations: many(resumeRecommendations),
}));

export const reportRecommendationsRelations = relations(reportRecommendations, ({ one }) => ({
  report: one(reports, {
    fields: [reportRecommendations.reportId],
    references: [reports.id],
  }),
}));

export const networkingLeadsRelations = relations(networkingLeads, ({ one }) => ({
  report: one(reports, {
    fields: [networkingLeads.reportId],
    references: [reports.id],
  }),
}));

export const resumeRecommendationsRelations = relations(resumeRecommendations, ({ one }) => ({
  report: one(reports, {
    fields: [resumeRecommendations.reportId],
    references: [reports.id],
  }),
}));
