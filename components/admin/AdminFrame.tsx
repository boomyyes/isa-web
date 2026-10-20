import type { ReactNode } from "react";
import Link from "next/link";
import { Bell, LogOut, Menu, ScrollText } from "lucide-react";
import { can, hasAnyCap, hasCap, ROLE_LABELS, type Capability, type Role, type Session } from "@/lib/admin/store";
import { navCounts } from "@/lib/admin/navCounts";
import { ablyConfigured } from "@/lib/ably";
import { Suspense } from "react";
import { AdminNav, BellDot, LiveUpdates, type AdminNavSection, type NavIcon } from "./AdminNav";
import { iconButtonClass } from "./AdminShell";

type NavItem = { path: string; label: string; icon: NavIcon; role?: Role; cap?: Capability; anyCap?: Capability[] };

/**
 * Every admin page, grouped. An entry shows only to admins who hold its role
 * or capability; the page itself enforces the same rule. New features add a line here.
 */
const NAV: { title: string; items: NavItem[] }[] = [
  {
    title: "Workspace",
    items: [
      { path: "/", label: "Dashboard", icon: "dashboard" },
      { path: "/inbox", label: "Inbox", icon: "inbox" },
      { path: "/announcements", label: "Announcements", icon: "announcements" },
      { path: "/calendar", label: "Calendar", icon: "calendar" },
      { path: "/forum", label: "Forum", icon: "forum" },
      { path: "/chat", label: "Chat", icon: "chat", cap: "chat" },
    ],
  },
  {
    title: "Website",
    items: [{ path: "/content", label: "Content", icon: "content", cap: "content" }],
  },
  {
    title: "Treasury",
    items: [
      { path: "/finance", label: "Overview", icon: "overview", anyCap: ["finance.approve", "finance.audit"] },
      { path: "/finance/bills", label: "Bills", icon: "bills", anyCap: ["finance.submit", "finance.approve", "finance.audit"] },
      { path: "/finance/ledger", label: "Ledger", icon: "ledger", anyCap: ["finance.approve", "finance.audit"] },
      { path: "/finance/budgets", label: "Budgets", icon: "budgets", anyCap: ["finance.approve", "finance.audit"] },
      { path: "/finance/purge", label: "Delete old records", icon: "purge", role: "president" },
    ],
  },
  {
    title: "Administration",
    items: [
      { path: "/team", label: "Team", icon: "team", role: "president" },
      { path: "/erase", label: "Erasure", icon: "erase", role: "president" },
      { path: "/audit", label: "Audit log", icon: "audit", role: "president" },
    ],
  },
];


/** Up to two initials, from the name if set, else the email's local part. */
function initials(session: Session) {
  const source = session.name ?? session.email.split("@")[0];
  const parts = source.split(/[\s._-]+/).filter(Boolean);
  return (parts.length > 1 ? parts[0][0] + parts[1][0] : source.slice(0, 2)).toUpperCase();
}

/**
 * The sidebar and header, drawn once by app/admin/(workspace)/layout.tsx and
 * kept across navigations, so only the page area (AdminShell) changes.
 */
export async function AdminFrame({ session, base, children }: { session: Session; base: string; children: ReactNode }) {
  const canApprove = hasCap(session, "finance.decide");

  // Badges, not blockers. Started here but never awaited: the promise goes to
  // the client nav, which shows each count when it arrives, so the page itself
  // never waits on these queries. LiveUpdates keeps them current after that.
  const counts = navCounts(session);

  const visible = (item: NavItem) =>
    (!item.role || can(session.role, item.role)) &&
    (!item.cap || hasCap(session, item.cap)) &&
    (!item.anyCap || hasAnyCap(session, item.anyCap));

  const sections: AdminNavSection[] = NAV.map((section) => ({
    title: section.title,
    items: section.items.filter(visible).map((item) => ({
      href: item.path === "/" ? base || "/" : `${base}${item.path}`,
      label: item.label,
      icon: item.icon,
      badge: item.path === "/announcements" ? ("unread" as const) : item.path === "/finance/bills" && canApprove ? ("awaiting" as const) : undefined,
    })),
  })).filter((section) => section.items.length > 0);

  const sidebar = (
    <>
      <Link
        href={base || "/"}
        className="flex items-center gap-3 rounded-xl px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-active)]"
      >
        <span className="grid size-10 place-items-center rounded-full border border-white/15 font-jetbrains text-[11px] font-bold">
          ISA
        </span>
        <span className="leading-tight">
          <span className="block text-sm font-semibold text-[var(--text-primary)]">ISA-RAIT</span>
          <span className="block font-jetbrains text-[10px] uppercase tracking-[0.25em] text-[var(--accent-color)]">
            Admin
          </span>
        </span>
      </Link>
      <div className="mt-6 flex-1">
        <AdminNav sections={sections} home={base} counts={counts} />
      </div>
      <div className="mt-6 space-y-0.5 border-t border-white/[0.06] pt-4 text-sm text-[var(--text-secondary)]">
        <Link
          href={`${base}/notice`}
          className="flex min-h-10 items-center gap-3 rounded-xl px-3 py-2 transition hover:bg-white/[0.04] hover:text-[var(--text-primary)]"
        >
          <ScrollText aria-hidden className="size-4" /> Notice to members
        </Link>
        <form method="post" action="/api/admin/logout">
          <button className="flex min-h-10 w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-white/[0.04] hover:text-[var(--text-primary)]">
            <LogOut aria-hidden className="size-4" /> Sign out
          </button>
        </form>
      </div>
    </>
  );

  return (
    <div className="admin-canvas min-h-screen p-3 md:p-5">
      <div className="mx-auto flex min-h-[calc(100vh-1.5rem)] max-w-[1680px] gap-5 md:min-h-[calc(100vh-2.5rem)]">
        <aside className="admin-panel sticky top-5 hidden h-[calc(100vh-2.5rem)] w-64 shrink-0 flex-col overflow-y-auto p-5 lg:flex [scrollbar-width:thin] [scrollbar-color:rgb(255_255_255/0.12)_transparent]">
          {sidebar}
        </aside>

        <div className="min-w-0 flex-1">
          {/* One grid for the header row and the page below it. The page's title
              (AdminShell) lands in the row's free column through display:contents. */}
          <div className="grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-x-3 md:gap-x-4 lg:grid-cols-[minmax(0,1fr)_auto_auto]">
            {/* Below lg the sidebar is a drawer. A <details>, so it needs no
                JS; AdminNav closes it after each navigation. */}
            <details className="col-start-1 row-start-1 lg:hidden">
              <summary
                aria-label="Menu"
                className={`${iconButtonClass} cursor-pointer list-none [&::-webkit-details-marker]:hidden`}
              >
                <Menu aria-hidden className="size-5" />
              </summary>
              <div aria-hidden className="fixed inset-0 z-40 bg-black/60" />
              <div className="admin-panel fixed inset-y-3 left-3 z-50 flex w-72 flex-col overflow-y-auto p-5">
                {sidebar}
              </div>
            </details>

            <Link
              href={`${base}/announcements`}
              className={`${iconButtonClass} col-start-3 row-start-1 lg:col-start-2`}
            >
              <Bell aria-hidden className="size-5" />
              <span className="sr-only">Announcements</span>
              <Suspense>
                <BellDot counts={counts} />
              </Suspense>
            </Link>
            <Link
              href={`${base}/profile`}
              title="Your profile"
              className="col-start-4 row-start-1 flex items-center gap-3 rounded-full py-1 pl-1 pr-3 transition lg:col-start-3 hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-active)]"
            >
              <span className="grid size-10 place-items-center rounded-full bg-gradient-to-br from-[var(--border-active)]/40 to-[var(--accent-color)]/40 text-sm font-bold text-[var(--text-primary)]">
                {initials(session)}
              </span>
              <span className="hidden min-w-0 leading-tight sm:block">
                <span className="block max-w-48 truncate text-sm font-medium text-[var(--text-primary)]">
                  {session.name ?? session.email}
                </span>
                <span className="block font-jetbrains text-[10px] uppercase tracking-widest text-[var(--text-secondary)]">
                  {ROLE_LABELS[session.role]}
                  {session.domain && ` · ${session.domain}`}
                </span>
              </span>
            </Link>
            <div className="contents">{children}</div>
            {ablyConfigured() && <LiveUpdates />}
          </div>
        </div>
      </div>
    </div>
  );
}
