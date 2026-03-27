"use server";

import { revalidatePath } from "next/cache";
import { requireOwner } from "@/lib/auth/session";
import { logAdminEvent } from "@/lib/admin-audit";
import { loadManualContacts, saveManualContacts } from "@/lib/manual-contacts";

export async function getManualContacts() {
  await requireOwner();
  return loadManualContacts();
}

export async function addManualContactAction(formData: FormData) {
  const owner = await requireOwner();
  const contacts = await loadManualContacts();

  const next = {
    company: String(formData.get("company") ?? "").trim(),
    role: String(formData.get("role") ?? "").trim() || undefined,
    name: String(formData.get("name") ?? "").trim(),
    contactEmail: String(formData.get("contactEmail") ?? "").trim() || undefined,
    contactLinkedin: String(formData.get("contactLinkedin") ?? "").trim() || undefined,
    connectionBasis: String(formData.get("connectionBasis") ?? "").trim() || undefined,
  };

  if (!next.company || !next.name) return;

  contacts.push(next);
  await saveManualContacts(contacts);

  await logAdminEvent({ ownerEmail: owner.email, action: "add_manual_contact", details: { company: next.company, name: next.name } });

  revalidatePath("/admin/contacts");
  revalidatePath("/applications");
}

export async function updateManualContactAction(formData: FormData) {
  const owner = await requireOwner();
  const contacts = await loadManualContacts();

  const index = Number(formData.get("index"));
  if (!Number.isInteger(index) || index < 0 || index >= contacts.length) return;

  contacts[index] = {
    company: String(formData.get("company") ?? "").trim(),
    role: String(formData.get("role") ?? "").trim() || undefined,
    name: String(formData.get("name") ?? "").trim(),
    contactEmail: String(formData.get("contactEmail") ?? "").trim() || undefined,
    contactLinkedin: String(formData.get("contactLinkedin") ?? "").trim() || undefined,
    connectionBasis: String(formData.get("connectionBasis") ?? "").trim() || undefined,
  };

  if (!contacts[index].company || !contacts[index].name) return;

  await saveManualContacts(contacts);

  await logAdminEvent({ ownerEmail: owner.email, action: "update_manual_contact", details: { index } });

  revalidatePath("/admin/contacts");
  revalidatePath("/applications");
}

export async function deleteManualContactAction(formData: FormData) {
  const owner = await requireOwner();
  const contacts = await loadManualContacts();

  const index = Number(formData.get("index"));
  if (!Number.isInteger(index) || index < 0 || index >= contacts.length) return;

  const [removed] = contacts.splice(index, 1);
  await saveManualContacts(contacts);

  await logAdminEvent({ ownerEmail: owner.email, action: "delete_manual_contact", details: { index, company: removed?.company ?? "" } });

  revalidatePath("/admin/contacts");
  revalidatePath("/applications");
}
