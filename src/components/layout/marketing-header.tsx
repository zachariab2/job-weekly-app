import Link from "next/link";
import { Button } from "../ui/button";

const navigation = [
  { label: "How it works", href: "#how" },
  { label: "Weekly report", href: "#report" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

export function MarketingHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-30 border-b border-white/5 bg-[rgba(5,6,10,0.75)]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 text-sm font-semibold tracking-[0.3em] text-white/80">
          <span className="text-[var(--accent-strong)]">OMC</span>
          WEEKLY
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-white/70 md:flex">
          {navigation.map((item) => (
            <a key={item.label} href={item.href} className="transition hover:text-white">
              {item.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-white/70 hover:text-white">
            Log in
          </Link>
          <Link href="/signup">
            <Button>Join now</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
