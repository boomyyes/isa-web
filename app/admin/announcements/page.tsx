import Link from "next/link";
import { AdminShell, buttonClass, cardClass, formatTime, Notice } from "@/components/admin/AdminShell";
import { PlainText } from "@/components/admin/PlainText";
import { fieldClass, labelClass } from "@/components/ui/formStyles";
import { requireAdmin } from "@/lib/admin/session";
import { hasCap } from "@/lib/admin/store";
import { lastRead, listAnnouncements, markRead } from "@/lib/admin/announcements";

export const dynamic = "force-dynamic";

export default async function AnnouncementsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string; expired?: string }>;
}) {
  const session = await requireAdmin();
  const { base } = session;
  const { saved, error, expired } = await searchParams;
  const canPost = hasCap(session, "announce");

  // Read the marker before moving it, so this visit can still badge what's new.
  const [since, items] = await Promise.all([lastRead(session.email), listAnnouncements({ includeExpired: expired === "1" })]);
  await markRead(session.email);

  return (
    <AdminShell session={session} base={base} title="Announcements">
      {saved === "1" && <Notice>Saved.</Notice>}
      {saved === "deleted" && <Notice>Deleted.</Notice>}
      {error && <Notice tone="error">{error === "denied" ? "You don't have permission to post announcements." : error === "missing" ? "That announcement no longer exists." : error}</Notice>}

      {canPost && (
        <details className={cardClass}>
          <summary className="cursor-pointer font-jetbrains text-sm font-bold uppercase tracking-widest text-[var(--text-primary)]">
            Post an announcement
          </summary>
          <form method="post" action="/api/admin/announcements" className="mt-4 grid gap-4">
            <input type="hidden" name="action" value="create" />
            <div>
              <label htmlFor="title" className={labelClass}>Title *</label>
              <input id="title" name="title" required maxLength={150} className={fieldClass} />
            </div>
            <div>
              <label htmlFor="body" className={labelClass}>Message *</label>
              <textarea id="body" name="body" required rows={6} maxLength={10000} className={`${fieldClass} resize-y`} />
              <p className="mt-1 text-xs text-[var(--text-secondary)]">Plain text. Links become clickable.</p>
            </div>
            <div className="flex flex-wrap items-end gap-6">
              <label className="flex items-center gap-2 text-sm text-[var(--text-primary)]">
                <input type="checkbox" name="pinned" className="h-4 w-4 accent-[var(--accent-color)]" /> Pin to top
              </label>
              <div>
                <label htmlFor="expiresAt" className={labelClass}>Hide after (optional)</label>
                <input id="expiresAt" name="expiresAt" type="datetime-local" className={`${fieldClass} w-auto`} />
              </div>
            </div>
            <div>
              <button className={buttonClass}>Post</button>
            </div>
          </form>
        </details>
      )}

      {items.length === 0 ? (
        <p className="text-sm text-[var(--text-secondary)]">No announcements.</p>
      ) : (
        <ul className="space-y-4">
          {items.map((a) => {
            const isNew = a.createdAt > since && a.createdBy !== session.email;
            const isExpired = a.expiresAt !== null && a.expiresAt < new Date();
            return (
              <li key={a.id} className={`${cardClass} ${a.pinned ? "border-[var(--border-active)]/60" : ""} ${isExpired ? "opacity-60" : ""}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <h2 className="font-jetbrains text-base font-bold text-[var(--text-primary)]">
                    {a.title}
                    {a.pinned && <span className="ml-2 text-xs font-normal text-[var(--border-active)]">Pinned</span>}
                    {isNew && <span className="ml-2 rounded-full bg-[var(--accent-color)] px-2 py-0.5 text-[10px] font-semibold uppercase text-[var(--bg-color)]">New</span>}
                    {isExpired && <span className="ml-2 text-xs font-normal text-[var(--text-secondary)]">Expired</span>}
                  </h2>
                  {canPost && (
                    <Link href={`${base}/announcements/e/${a.id}`} className="text-xs text-[var(--accent-color)] underline underline-offset-2">Edit</Link>
                  )}
                </div>
                <PlainText text={a.body} className="mt-3 text-sm leading-relaxed text-[var(--text-primary)]" />
                <p className="mt-3 text-xs text-[var(--text-secondary)]">
                  {a.createdBy} · {formatTime(a.createdAt.toISOString())}
                  {a.updatedAt.getTime() - a.createdAt.getTime() > 1000 && " · edited"}
                  {a.expiresAt && !isExpired && ` · until ${formatTime(a.expiresAt.toISOString())}`}
                </p>
              </li>
            );
          })}
        </ul>
      )}

      <Link href={`${base}/announcements${expired === "1" ? "" : "?expired=1"}`} className="text-xs text-[var(--text-secondary)] underline underline-offset-2">
        {expired === "1" ? "Hide expired" : "Show expired"}
      </Link>
    </AdminShell>
  );
}
