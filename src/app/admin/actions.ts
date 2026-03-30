"use server";

import { db, networkingLeads } from "@/lib/db";
import { eq } from "drizzle-orm";
import { requireOwner } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const contactSchema = z.object({
  reportId: z.string(),
  company: z.string(),
  name: z.string().min(1),
  role: z.string().optional().default(""),
  contactLinkedin: z.string().optional().default(""),
  contactEmail: z.string().optional().default(""),
  connectionBasis: z.string().optional().default(""),
  outreachSnippet: z.string().optional().default(""),
});

export async function addContactAction(formData: FormData) {
  await requireOwner();
  const raw = Object.fromEntries(formData.entries());
  const parsed = contactSchema.safeParse(raw);
  if (!parsed.success) return;

  const d = parsed.data;
  await db.insert(networkingLeads).values({
    reportId: d.reportId,
    company: d.company,
    name: d.name,
    role: d.role || "Contact",
    connectionBasis: d.connectionBasis || "Manual contact",
    outreachSnippet: d.outreachSnippet || null,
    contactLinkedin: d.contactLinkedin || null,
    contactEmail: d.contactEmail || null,
    contactGithub: null,
  });

  revalidatePath("/admin");
}

export async function deleteContactAction(formData: FormData) {
  await requireOwner();
  const id = Number(formData.get("contactId"));
  if (!id) return;
  await db.delete(networkingLeads).where(eq(networkingLeads.id, id));
  revalidatePath("/admin");
}
