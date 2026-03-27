import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";

export type ManualContact = {
  company: string;
  role?: string;
  name: string;
  contactEmail?: string;
  contactLinkedin?: string;
  connectionBasis?: string;
};

const DATA_DIR = path.join(process.cwd(), "data");
const JSON_FILE = path.join(DATA_DIR, "manual-contacts.json");

export async function loadManualContacts(): Promise<ManualContact[]> {
  try {
    const raw = await readFile(JSON_FILE, "utf8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as ManualContact[];
  } catch {
    return [];
  }
}

export async function saveManualContacts(contacts: ManualContact[]) {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(JSON_FILE, JSON.stringify(contacts, null, 2), "utf8");
}

export async function getManualContactByIndex(index: number) {
  const contacts = await loadManualContacts();
  return contacts[index] ?? null;
}
