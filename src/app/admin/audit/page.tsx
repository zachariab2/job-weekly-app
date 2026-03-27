import { readFile } from "fs/promises";
import path from "path";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { requireOwner } from "@/lib/auth/session";

const AUDIT_FILE = path.join(process.cwd(), "data", "admin-audit.log");

export default async function AdminAuditPage() {
  const owner = await requireOwner();
  let lines: string[] = [];

  try {
    const text = await readFile(AUDIT_FILE, "utf8");
    lines = text.trim().split("\n").slice(-200).reverse();
  } catch {
    lines = [];
  }

  return (
    <AppShell active="/settings" user={owner}>
      <div className="space-y-4">
        <div>
          <Link href="/admin/users" className="text-xs text-white/50 hover:text-white/80">← Back to admin</Link>
          <h1 className="text-2xl font-semibold text-white mt-2">Admin Audit Log</h1>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          {lines.length === 0 ? (
            <p className="text-sm text-white/40">No audit entries yet.</p>
          ) : (
            <pre className="text-xs text-white/70 whitespace-pre-wrap break-all">{lines.join("\n")}</pre>
          )}
        </div>
      </div>
    </AppShell>
  );
}
