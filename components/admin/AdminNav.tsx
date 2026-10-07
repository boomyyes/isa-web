"use client";

// The admin sidebar's links. A client component only so the current page can
// be highlighted from usePathname(); everything it shows is decided on the
// server by AdminShell (which items this member may see, and the badges).

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  CalendarDays,
  FileText,
  Gauge,
  History,
  Inbox,
  Landmark,
  LayoutDashboard,
  Megaphone,
  MessageCircle,
  MessagesSquare,
  PiggyBank,
  Receipt,
  ShieldX,
  Trash2,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const NAV_ICONS = {
  dashboard: LayoutDashboard,
  inbox: Inbox,
  announcements: Megaphone,
  calendar: CalendarDays,
  forum: MessagesSquare,
  chat: MessageCircle,
  content: FileText,
  overview: Gauge,
  bills: Receipt,
  ledger: BookOpen,
  budgets: PiggyBank,
  purge: Trash2,
  team: Users,
  erase: ShieldX,
  audit: History,
  treasury: Landmark,
} satisfies Record<string, LucideIcon>;

export type NavIcon = keyof typeof NAV_ICONS;

export type AdminNavSection = {
  title: string;
  items: { href: string; label: string; icon: NavIcon; badge?: number; badgeTone?: "accent" | "active" }[];
};

/** Exact match for the dashboard, prefix match for everything else. */
function isCurrent(pathname: string, href: string, home: string) {
  if (href === home) return pathname === home || pathname === `${home}/`;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminNav({ sections, home }: { sections: AdminNavSection[]; home: string }) {
  const pathname = usePathname();
  // On admin.isarait.in the URL has no /admin prefix while `home` may be ""
  // (subdomain) or "/admin" (path mode); normalise both to compare.
  const root = home || "/";

  return (
    <nav aria-label="Admin" className="space-y-6">
      {sections.map((section) => (
        <div key={section.title}>
          <p className="mb-2 px-3 font-jetbrains text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--text-secondary)]/60">
            {section.title}
          </p>
          <ul className="space-y-0.5">
            {section.items.map((item) => {
              const current = isCurrent(pathname, item.href || "/", root);
              const Icon = NAV_ICONS[item.icon];
              return (
                <li key={item.href}>
                  <Link
                    href={item.href || "/"}
                    aria-current={current ? "page" : undefined}
                    className={cn(
                      "flex min-h-10 items-center gap-3 rounded-xl border px-3 py-2 text-sm transition",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-active)]",
                      current
                        ? "admin-glow border-[var(--border-active)]/40 font-medium text-[var(--text-primary)]"
                        : "border-transparent text-[var(--text-secondary)] hover:bg-white/[0.04] hover:text-[var(--text-primary)]"
                    )}
                  >
                    <Icon aria-hidden className="size-4 shrink-0" />
                    <span className="flex-1 truncate">{item.label}</span>
                    {!!item.badge && (
                      <span
                        className={cn(
                          "rounded-full px-1.5 py-0.5 font-jetbrains text-[10px] font-bold tabular-nums",
                          item.badgeTone === "active"
                            ? "bg-[var(--border-active)]/15 text-[var(--border-active)]"
                            : "bg-[var(--accent-color)] text-[var(--bg-color)]"
                        )}
                      >
                        {item.badge}
                        <span className="sr-only"> new</span>
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
