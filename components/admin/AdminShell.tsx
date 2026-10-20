import type { ReactNode } from "react";

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
  "admin-press admin-press-shake inline-flex min-h-9 items-center justify-center gap-2 rounded-full border border-danger/50 bg-danger/10 px-4 py-2 text-sm font-medium text-danger hover:bg-danger/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger";

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
      ? "border-danger/40 bg-danger/10 text-danger"
      : "border-[var(--border-active)]/40 bg-[var(--border-active)]/10 text-[var(--text-primary)]";
  // Announced: these appear after a save redirects, where nothing else tells a screen reader.
  return <p role={tone === "error" ? "alert" : "status"} className={`rounded-2xl border px-4 py-3 text-sm ${styles}`}>{children}</p>;
}

const titleCell = "col-start-2 row-start-1 min-w-0 lg:col-start-1";
const mainCell = "col-span-full mt-6 space-y-5";

/** A page's title (into the frame's header row) and its content. */
export function AdminShell({
  title,
  subtitle,
  children,
}: {
  title: ReactNode;
  /** One line under the title. The dashboard uses it for the greeting. */
  subtitle?: ReactNode;
  children: ReactNode;
}) {
  return (
    <>
      <div className={titleCell}>
        <h1 className="truncate text-2xl font-semibold tracking-tight text-[var(--text-primary)] md:text-3xl">
          {title}
        </h1>
        {subtitle && <p className="mt-0.5 text-sm text-[var(--text-secondary)]">{subtitle}</p>}
      </div>
      <main className={mainCell}>{children}</main>
    </>
  );
}

/** The page area while a page loads: the same cells, pulsing. */
export function AdminShellSkeleton() {
  // Real panels, empty, so the page fills in rather than swapping in.
  const block = "admin-panel animate-pulse";
  return (
    <>
      <div className={titleCell} aria-busy>
        <div className="h-8 w-48 animate-pulse rounded-xl bg-white/[0.06] md:h-9" />
        <span className="sr-only">Loading</span>
      </div>
      <main className={mainCell}>
        <div className={`${block} h-28`} />
        <div className="grid gap-5 md:grid-cols-2">
          <div className={`${block} h-48`} />
          <div className={`${block} h-48`} />
        </div>
        <div className={`${block} h-64`} />
      </main>
    </>
  );
}
