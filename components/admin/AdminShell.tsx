import type { ReactNode } from "react";
import Link from "next/link";
import { can, hasCap, type Capability, type Role, type Session } from "@/lib/admin/store";
import { unreadCount } from "@/lib/admin/announcements";
import { dbConfigured } from "@/lib/db";

type NavItem = { path: string; label: string; role?: Role; cap?: Capability };

/**
 * Every admin page, grouped. An entry shows only to admins who hold its role
 * or capability; the page itself enforces the same rule. New features add a line here.
 */
const NAV: { title: string; items: NavItem[] }[] = [
  {
    title: "Workspace",
    items: [
      { path: "/", label: "Inbox" },
      { path: "/announcements", label: "Announcements" },
      { path: "/calendar", label: "Calendar" },
      { path: "/forum", label: "Forum" },
      { path: "/chat", label: "Chat", cap: "chat" },
    ],
  },
  {
    title: "Website",
    items: [{ path: "/content", label: "Content", cap: "content" }],
  },
  {
    title: "Administration",
    items: [
      { path: "/team", label: "Team", role: "owner" },
      { path: "/erase", label: "Erasure", role: "owner" },
      { path: "/audit", label: "Audit log", role: "owner" },
    ],
  },
];

export const buttonClass =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--border-active)] bg-[var(--border-active)]/10 px-4 py-2.5 font-jetbrains text-xs font-semibold uppercase tracking-widest text-[var(--text-primary)] transition hover:bg-[var(--border-active)]/20 disabled:opacity-50";

export const dangerButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-red-500/60 bg-red-500/10 px-4 py-2.5 font-jetbrains text-xs font-semibold uppercase tracking-widest text-red-400 transition hover:bg-red-500/20";

export const cardClass =
  "rounded-2xl border border-[var(--border-color)] bg-[var(--card-color)]/60 p-5 md:p-6";

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
  return <p className={`rounded-lg border px-4 py-3 text-sm ${styles}`}>{children}</p>;
}

export async function AdminShell({
  session,
  base,
  title,
  children,
}: {
  session: Session;
  base: string;
  title: string;
  children: ReactNode;
}) {
  // A badge, not a blocker: if the database is down, pages still render.
  let unread = 0;
  if (dbConfigured()) {
    try {
      unread = await unreadCount(session.email);
    } catch {
      unread = 0;
    }
  }

  const visible = (item: NavItem) =>
    (!item.role || can(session.role, item.role)) && (!item.cap || hasCap(session, item.cap));

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 md:flex-row md:gap-10 md:px-6 md:py-10">
      <aside className="md:sticky md:top-6 md:h-[calc(100vh-3rem)] md:w-56 md:shrink-0 md:overflow-y-auto">
        <p className="font-jetbrains text-sm font-bold uppercase tracking-widest text-[var(--accent-color)]">
          ISA-RAIT Admin
        </p>
        <nav className="mt-5 flex flex-wrap gap-x-5 gap-y-4 md:block md:space-y-5">
          {NAV.map((section) => {
            const items = section.items.filter(visible);
            if (items.length === 0) return null;
            return (
              <div key={section.title}>
                <p className="font-jetbrains text-[10px] font-semibold uppercase tracking-[0.25em] text-[var(--text-secondary)]/70">
                  {section.title}
                </p>
                <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 md:block md:space-y-1">
                  {items.map((item) => (
                    <li key={item.path}>
                      <Link
                        href={`${base}${item.path}`}
                        className="text-sm text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
                      >
                        {item.label}
                        {item.path === "/announcements" && unread > 0 && (
                          <span className="ml-2 rounded-full bg-[var(--accent-color)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--bg-color)]">
                            {unread}
                          </span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </nav>
        <div className="mt-6 border-t border-[var(--border-color)] pt-4 text-xs text-[var(--text-secondary)]">
          <p className="break-all">{session.email}</p>
          <p className="mt-1 uppercase tracking-wider">{session.role}</p>
          <form method="post" action="/api/admin/logout" className="mt-3">
            <button className="underline underline-offset-2 hover:text-[var(--text-primary)]">Sign out</button>
          </form>
        </div>
      </aside>

      <section className="min-w-0 flex-1">
        <h1 className="font-jetbrains text-2xl font-bold text-[var(--text-primary)]">{title}</h1>
        <div className="mt-6 space-y-6">{children}</div>
      </section>
    </div>
  );
}
