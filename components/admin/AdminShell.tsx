import type { ReactNode } from "react";
import Link from "next/link";
import { Bell, LogOut, Menu, ScrollText } from "lucide-react";
import { can, hasAnyCap, hasCap, ROLE_LABELS, type Capability, type Role, type Session } from "@/lib/admin/store";
import { unreadCount } from "@/lib/admin/announcements";
import { countBills } from "@/lib/admin/finance";
import { dbConfigured } from "@/lib/db";
import { Suspense } from "react";
import { AdminNav, BellDot, type AdminNavSection, type NavCounts, type NavIcon } from "./AdminNav";

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

/** The glowing pill (admin-glow in globals.css). The one primary action per view. */
export const buttonClass =
  "admin-glow admin-press admin-press-burst inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-[var(--border-active)]/50 px-5 py-2.5 text-sm font-medium text-[var(--text-primary)] hover:border-[var(--border-active)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-active)] disabled:opacity-50";

/** Outline pill, for secondary actions and tab rows. */
export const pillClass =
  "admin-press inline-flex min-h-9 items-center justify-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm text-[var(--text-secondary)] hover:border-white/30 hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-active)]";

/** A round 40px icon button (bell, menu). */
export const iconButtonClass =
  "admin-press admin-press-tilt relative inline-grid size-10 shrink-0 place-items-center rounded-full border border-white/15 text-[var(--text-secondary)] hover:border-white/30 hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-active)]";

/** The selected tab in a pill row. */
export const pillActiveClass = `${pillClass} admin-glow border-[var(--border-active)]/50 text-[var(--text-primary)]`;

export const dangerButtonClass =
  "admin-press admin-press-shake inline-flex min-h-9 items-center justify-center gap-2 rounded-full border border-red-500/50 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400";

/** Rounded panel with a top highlight (admin-panel in globals.css). */
export const cardClass = "admin-panel p-5 md:p-6";

/** Shared table styling: tableWrapClass on the wrapper, then the head and row classes. */
export const tableWrapClass = "admin-panel overflow-x-auto";
export const tableHeadClass =
  "font-jetbrains text-[10px] uppercase tracking-[0.2em] text-[var(--text-secondary)] [&_th]:px-5 [&_th]:py-3.5 [&_th]:font-semibold";
export const tableRowClass =
  "border-t border-white/[0.06] text-[var(--text-primary)] transition-colors hover:bg-white/[0.025] [&_td]:px-5 [&_td]:py-4";

/** India time, since that's where the committee reads it. */
export const formatTime = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  });

export function Notice({ tone = "info", children }: { tone?: "info" | "error"; children: ReactNode }) {
  const styles =
    tone === "error"
      ? "border-red-500/40 bg-red-500/10 text-red-400"
      : "border-[var(--border-active)]/40 bg-[var(--border-active)]/10 text-[var(--text-primary)]";
  return <p className={`rounded-2xl border px-4 py-3 text-sm ${styles}`}>{children}</p>;
}

/** Up to two initials, from the name if set, else the email's local part. */
function initials(session: Session) {
  const source = session.name ?? session.email.split("@")[0];
  const parts = source.split(/[\s._-]+/).filter(Boolean);
  return (parts.length > 1 ? parts[0][0] + parts[1][0] : source.slice(0, 2)).toUpperCase();
}

export async function AdminShell({
  session,
  base,
  title,
  subtitle,
  children,
}: {
  session: Session;
  base: string;
  title: ReactNode;
  /** One line under the title. The dashboard uses it for the greeting. */
  subtitle?: ReactNode;
  children: ReactNode;
}) {
  const canApprove = hasCap(session, "finance.approve");

  // Badges, not blockers. Started here but never awaited: the promise goes to
  // the client nav, which shows each count when it arrives, so the page itself
  // never waits on these queries. A failure just means no badge.
  const counts: Promise<NavCounts> = dbConfigured()
    ? Promise.all([
        unreadCount(session.email).catch(() => 0),
        canApprove ? countBills("submitted").catch(() => 0) : 0,
      ]).then(([unread, awaiting]) => ({ unread, awaiting }))
    : Promise.resolve({ unread: 0, awaiting: 0 });

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
          <header className="flex flex-wrap items-center gap-3 md:gap-4">
            {/* Below lg the sidebar is a drawer. A <details>, so it needs no
                JS, and it closes on its own because each page renders a fresh shell. */}
            <details className="lg:hidden">
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

            <div className="min-w-0 flex-1">
              <h1 className="truncate text-2xl font-semibold tracking-tight text-[var(--text-primary)] md:text-3xl">
                {title}
              </h1>
              {subtitle && <p className="mt-0.5 text-sm text-[var(--text-secondary)]">{subtitle}</p>}
            </div>

            <Link
              href={`${base}/announcements`}
              className={iconButtonClass}
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
              className="flex items-center gap-3 rounded-full py-1 pl-1 pr-3 transition hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-active)]"
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
          </header>

          <main className="mt-6 space-y-5">{children}</main>
        </div>
      </div>
    </div>
  );
}
