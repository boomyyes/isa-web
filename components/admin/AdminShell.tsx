import type { ReactNode } from "react";
import Link from "next/link";
import { can, type Session } from "@/lib/admin/store";

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

export function AdminShell({
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
  const links = [
    { href: `${base}/`, label: "Inbox", show: true },
    { href: `${base}/erase`, label: "Erasure", show: can(session.role, "owner") },
    { href: `${base}/team`, label: "Team", show: can(session.role, "owner") },
    { href: `${base}/audit`, label: "Audit log", show: can(session.role, "owner") },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-10">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border-color)] pb-4">
        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <span className="font-jetbrains text-sm font-bold uppercase tracking-widest text-[var(--accent-color)]">
            ISA-RAIT Admin
          </span>
          {links
            .filter((l) => l.show)
            .map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
              >
                {l.label}
              </Link>
            ))}
        </nav>
        <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)]">
          <span>
            {session.email} · <span className="uppercase tracking-wider">{session.role}</span>
          </span>
          <form method="post" action="/api/admin/logout">
            <button className="underline underline-offset-2 hover:text-[var(--text-primary)]">Sign out</button>
          </form>
        </div>
      </header>
      <h1 className="mt-8 font-jetbrains text-2xl font-bold text-[var(--text-primary)]">{title}</h1>
      <div className="mt-6 space-y-6">{children}</div>
    </div>
  );
}
