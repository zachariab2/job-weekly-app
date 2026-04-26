"use server";

import { revalidatePath } from "next/cache";
import { requireOwner } from "@/lib/auth/session";
import { logAdminEvent } from "@/lib/admin-audit";
import { loadManualContacts, saveManualContact, updateManualContact, deleteManualContact } from "@/lib/manual-contacts";

export async function getManualContacts() {
  await requireOwner();
  return loadManualContacts();
}

export async function addManualContactAction(formData: FormData) {
  const owner = await requireOwner();
  const data = {
    company: String(formData.get("company") ?? "").trim(),
    role: String(formData.get("role") ?? "").trim() || null,
    name: String(formData.get("name") ?? "").trim(),
    contactEmail: String(formData.get("contactEmail") ?? "").trim() || null,
    contactLinkedin: String(formData.get("contactLinkedin") ?? "").trim() || null,
    connectionBasis: String(formData.get("connectionBasis") ?? "").trim() || null,
  };
  if (!data.company || !data.name) return;
  await saveManualContact(data);
  await logAdminEvent({ ownerEmail: owner.email, action: "add_manual_contact", details: { company: data.company, name: data.name } });
  revalidatePath("/admin/contacts");
  revalidatePath("/applications");
}

export async function updateManualContactAction(formData: FormData) {
  const owner = await requireOwner();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) return;
  const data = {
    company: String(formData.get("company") ?? "").trim(),
    role: String(formData.get("role") ?? "").trim() || null,
    name: String(formData.get("name") ?? "").trim(),
    contactEmail: String(formData.get("contactEmail") ?? "").trim() || null,
    contactLinkedin: String(formData.get("contactLinkedin") ?? "").trim() || null,
    connectionBasis: String(formData.get("connectionBasis") ?? "").trim() || null,
  };
  if (!data.company || !data.name) return;
  await updateManualContact(id, data);
  await logAdminEvent({ ownerEmail: owner.email, action: "update_manual_contact", details: { id } });
  revalidatePath("/admin/contacts");
  revalidatePath("/applications");
}

export async function deleteManualContactAction(formData: FormData) {
  const owner = await requireOwner();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) return;
  await deleteManualContact(id);
  await logAdminEvent({ ownerEmail: owner.email, action: "delete_manual_contact", details: { id } });
  revalidatePath("/admin/contacts");
  revalidatePath("/applications");
}
