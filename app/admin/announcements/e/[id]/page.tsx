import Link from "next/link";
import { AdminShell, buttonClass, cardClass, dangerButtonClass, Notice } from "@/components/admin/AdminShell";
import { fieldClass, labelClass } from "@/components/ui/formStyles";
import { requireCapability } from "@/lib/admin/session";
import { getAnnouncement } from "@/lib/admin/announcements";

export const dynamic = "force-dynamic";

/** datetime-local wants "YYYY-MM-DDTHH:MM" in local (IST) time. */
const toIstInput = (d: Date) =>
  new Date(d.getTime() + 5.5 * 3600_000).toISOString().slice(0, 16);

export default async function EditAnnouncementPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await requireCapability("announce");
  const { base } = session;
  const { id } = await params;
  const { error } = await searchParams;
  const a = await getAnnouncement(id);

  return (
    <AdminShell session={session} base={base} title="Edit announcement">
      <Link href={`${base}/announcements`} className="text-sm text-[var(--accent-color)] underline underline-offset-2">Back to announcements</Link>
      {error && <Notice tone="error">{error}</Notice>}
      {!a ? (
        <p className="text-sm text-[var(--text-secondary)]">That announcement no longer exists.</p>
      ) : (
        <>
          <form method="post" action="/api/admin/announcements" className={`${cardClass} grid gap-4`}>
            <input type="hidden" name="action" value="update" />
            <input type="hidden" name="id" value={a.id} />
            <div>
              <label htmlFor="title" className={labelClass}>Title *</label>
              <input id="title" name="title" required maxLength={150} defaultValue={a.title} className={fieldClass} />
            </div>
            <div>
              <label htmlFor="body" className={labelClass}>Message *</label>
              <textarea id="body" name="body" required rows={8} maxLength={10000} defaultValue={a.body} className={`${fieldClass} resize-y`} />
            </div>
            <div className="flex flex-wrap items-end gap-6">
              <label className="flex items-center gap-2 text-sm text-[var(--text-primary)]">
                <input type="checkbox" name="pinned" defaultChecked={a.pinned} className="h-4 w-4 accent-[var(--accent-color)]" /> Pin to top
              </label>
              <div>
                <label htmlFor="expiresAt" className={labelClass}>Hide after (optional)</label>
                <input id="expiresAt" name="expiresAt" type="datetime-local" defaultValue={a.expiresAt ? toIstInput(a.expiresAt) : ""} className={`${fieldClass} w-auto`} />
              </div>
            </div>
            <div>
              <button className={buttonClass}>Save changes</button>
            </div>
          </form>
          <form method="post" action="/api/admin/announcements" className={cardClass}>
            <input type="hidden" name="action" value="delete" />
            <input type="hidden" name="id" value={a.id} />
            <button className={dangerButtonClass}>Delete announcement</button>
          </form>
        </>
      )}
    </AdminShell>
  );
}
