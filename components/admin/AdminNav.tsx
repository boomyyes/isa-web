"use client";

// The admin sidebar's links. A client component only so the current page can
// be highlighted from usePathname(); everything it shows is decided on the
// server by AdminShell (which items this member may see, and the badges).

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, use, useLayoutEffect, useRef } from "react";
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

/** Badge counts, streamed from the server after the page has rendered. */
export type NavCounts = { unread: number; awaiting: number };

export type AdminNavSection = {
  title: string;
  items: { href: string; label: string; icon: NavIcon; badge?: keyof NavCounts }[];
};

function CountBadge({ counts, name }: { counts: Promise<NavCounts>; name: keyof NavCounts }) {
  const n = use(counts)[name];
  if (!n) return null;
  return (
    <span className="rounded-full bg-[var(--accent-color)] px-1.5 py-0.5 font-jetbrains text-[10px] font-bold tabular-nums text-[var(--bg-color)]">
      {n}
      <span className="sr-only"> new</span>
    </span>
  );
}

/** The unread dot on the top-bar bell. */
export function BellDot({ counts }: { counts: Promise<NavCounts> }) {
  const n = use(counts).unread;
  if (!n) return null;
  return (
    <>
      <span aria-hidden className="absolute right-2.5 top-2.5 size-2 rounded-full bg-[var(--accent-color)] ring-2 ring-[var(--card-color)]" />
      <span className="sr-only">, {n} unread</span>
    </>
  );
}

/** Exact match for the dashboard, prefix match for everything else. */
function matches(pathname: string, href: string, home: string) {
  if (href === home) return pathname === home || pathname === `${home}/`;
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * The one item to highlight: the longest href that matches. Without this,
 * /finance/bills matched both "Overview" (/finance) and "Bills", and the pill
 * slid to whichever came first.
 */
function currentHref(sections: AdminNavSection[], pathname: string, home: string) {
  let best: string | null = null;
  for (const { items } of sections) {
    for (const { href } of items) {
      const h = href || "/";
      if (matches(pathname, h, home) && (!best || h.length > best.length)) best = h;
    }
  }
  return best;
}

const PILL_KEY = "admin-nav-pill";

/**
 * Slides the glowing pill onto the current item. Each admin page renders a
 * fresh shell, so the pill's last position is kept in sessionStorage (per tab)
 * and the new pill starts there, then glides to its own item. Positioned in a
 * layout effect, before paint, and written straight to the DOM: no re-render.
 */
function useSlidingPill(navRef: React.RefObject<HTMLElement | null>, pillRef: React.RefObject<HTMLDivElement | null>) {
  const pathname = usePathname();
  useLayoutEffect(() => {
    const nav = navRef.current;
    const pill = pillRef.current;
    const target = nav?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!nav || !pill || !target) {
      if (pill) pill.style.opacity = "0";
      return;
    }
    // The copy inside the closed mobile drawer has no layout; measuring it
    // would save a zero position and fling the desktop pill to the top.
    if (target.offsetHeight === 0) return;
    const to = { top: target.offsetTop, height: target.offsetHeight };
    let from = to;
    try {
      from = JSON.parse(sessionStorage.getItem(PILL_KEY) ?? "null") ?? to;
    } catch {
      // Storage blocked: the pill just appears in place.
    }
    const place = ({ top, height }: { top: number; height: number }) => {
      pill.style.transform = `translateY(${top}px)`;
      pill.style.height = `${height}px`;
    };
    pill.style.transition = "none";
    pill.style.opacity = "1";
    place(from);
    void pill.offsetHeight; // commit the start position before animating
    pill.style.transition = "";
    place(to);
    try {
      sessionStorage.setItem(PILL_KEY, JSON.stringify(to));
    } catch {
      // Not remembered; next page starts the pill in place.
    }
  }, [navRef, pillRef, pathname]);
}

export function AdminNav({
  sections,
  home,
  counts,
}: {
  sections: AdminNavSection[];
  home: string;
  counts: Promise<NavCounts>;
}) {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);
  useSlidingPill(navRef, pillRef);
  // On admin.isarait.in the URL has no /admin prefix while `home` may be ""
  // (subdomain) or "/admin" (path mode); normalise both to compare.
  const root = home || "/";
  const active = currentHref(sections, pathname, root);

  return (
    <nav ref={navRef} aria-label="Admin" className="relative space-y-5">
      {/* The one glowing pill, slid under whichever item is current. */}
      <div
        ref={pillRef}
        aria-hidden
        className="admin-glow admin-nav-pill pointer-events-none absolute inset-x-0 top-0 rounded-xl border border-[var(--border-active)]/40 opacity-0"
      />
      {sections.map((section) => (
        <div key={section.title}>
          <p className="mb-2 px-3 font-jetbrains text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--text-secondary)]/60">
            {section.title}
          </p>
          <ul className="space-y-0.5">
            {section.items.map((item) => {
              const current = (item.href || "/") === active;
              const Icon = NAV_ICONS[item.icon];
              return (
                <li key={item.href}>
                  <Link
                    href={item.href || "/"}
                    aria-current={current ? "page" : undefined}
                    className={cn(
                      "admin-nav-item group relative flex min-h-9 items-center gap-3 rounded-xl px-3 py-1.5 text-sm",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-active)]",
                      current
                        ? "font-medium text-[var(--text-primary)]"
                        : "text-[var(--text-secondary)] hover:bg-white/[0.04] hover:text-[var(--text-primary)]"
                    )}
                  >
                    <Icon aria-hidden className="admin-nav-icon size-4 shrink-0" />
                    <span className="admin-nav-label flex-1 truncate">{item.label}</span>
                    {item.badge && (
                      <Suspense>
                        <CountBadge counts={counts} name={item.badge} />
                      </Suspense>
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
