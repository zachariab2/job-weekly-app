import { db, manualContacts } from "@/lib/db";
import { eq } from "drizzle-orm";

export type ManualContact = {
  id: number;
  company: string;
  role?: string | null;
  name: string;
  contactEmail?: string | null;
  contactLinkedin?: string | null;
  connectionBasis?: string | null;
};

export async function loadManualContacts(): Promise<ManualContact[]> {
  try {
    return await db.query.manualContacts.findMany({
      orderBy: (t, { asc }) => [asc(t.createdAt)],
    });
  } catch {
    return [];
  }
}

export async function saveManualContact(data: Omit<ManualContact, "id">): Promise<void> {
  await db.insert(manualContacts).values({
    company: data.company,
    role: data.role ?? null,
    name: data.name,
    contactEmail: data.contactEmail ?? null,
    contactLinkedin: data.contactLinkedin ?? null,
    connectionBasis: data.connectionBasis ?? null,
  });
}

export async function updateManualContact(id: number, data: Omit<ManualContact, "id">): Promise<void> {
  await db.update(manualContacts).set({
    company: data.company,
    role: data.role ?? null,
    name: data.name,
    contactEmail: data.contactEmail ?? null,
    contactLinkedin: data.contactLinkedin ?? null,
    connectionBasis: data.connectionBasis ?? null,
  }).where(eq(manualContacts.id, id));
}

export async function deleteManualContact(id: number): Promise<void> {
  await db.delete(manualContacts).where(eq(manualContacts.id, id));
}

export function getManualContactsForJob(company: string, role: string, contacts: ManualContact[]): ManualContact[] {
  const companyLower = company.toLowerCase();
  const roleLower = role.toLowerCase();
  return contacts.filter((c) => {
    if (c.company.toLowerCase() !== companyLower) return false;
    if (c.role && !roleLower.includes(c.role.toLowerCase()) && !c.role.toLowerCase().includes(roleLower)) return false;
    return true;
  });
}
