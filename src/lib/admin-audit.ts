import { appendFile, mkdir } from "fs/promises";
import path from "path";

const AUDIT_DIR = path.join(process.cwd(), "data");
const AUDIT_FILE = path.join(AUDIT_DIR, "admin-audit.log");

type AuditEvent = {
  ownerEmail: string;
  action: string;
  targetUserId?: string;
  details?: Record<string, string | number | boolean | null | undefined>;
};

export async function logAdminEvent(event: AuditEvent) {
  try {
    await mkdir(AUDIT_DIR, { recursive: true });
    const payload = {
      ts: new Date().toISOString(),
      ...event,
    };
    await appendFile(AUDIT_FILE, JSON.stringify(payload) + "\n", "utf8");
  } catch {
    // Don't fail user flow on audit write issues
  }
}
