import Link from "next/link";
import { cn } from "@/lib/utils";
import { logoutAction } from "@/app/login/actions";

const navItems = [
  { href: "/applications", label: "Applications" },
  { href: "/profile", label: "Profile" },
  { href: "/settings", label: "Settings" },
];

export function AppShell({
  children,
  active,
  user,
}: {
  children: React.ReactNode;
  active?: string;
  user: { firstName: string | null; lastName: string | null; email: string };
}) {
  return (
    <div className="mx-auto grid min-h-screen w-full max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[220px_1fr]">
      <aside className="h-fit rounded-2xl border border-white/10 bg-white/[0.04] p-5 space-y-6 lg:sticky lg:top-8">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-white/30 mb-2">JobWeekly</p>
          <p className="text-sm font-semibold text-white">
            {user.firstName ? `${user.firstName} ${user.lastName ?? ""}`.trim() : user.email}
          </p>
          <p className="text-xs text-white/40">{user.email}</p>
        </div>
        <nav className="space-y-0.5">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center rounded-xl px-3 py-2.5 text-sm transition-all",
                active === item.href
                  ? "bg-white/10 text-white font-medium"
                  : "text-white/50 hover:text-white/80 hover:bg-white/5",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <form action={logoutAction}>
          <button className="w-full rounded-xl border border-white/10 px-3 py-2 text-xs text-white/40 transition hover:border-white/20 hover:text-white/60 text-left">
            Log out
          </button>
        </form>
      </aside>
      <main className="min-w-0 space-y-6">{children}</main>
    </div>
  );
}
