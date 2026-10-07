import Link from "next/link";
import { AdminShell, buttonClass, cardClass, formatTime, Notice } from "@/components/admin/AdminShell";
import { fieldClass, labelClass } from "@/components/ui/formStyles";
import { requireAdmin } from "@/lib/admin/session";
import { getCategory, listThreads, THREADS_PER_PAGE } from "@/lib/admin/forum";

export const dynamic = "force-dynamic";

export default async function ForumCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ q?: string; page?: string; error?: string; saved?: string }>;
}) {
  const session = await requireAdmin();
  const { base } = session;
  const { id } = await params;
  const { q, page: rawPage, error, saved } = await searchParams;
  const category = await getCategory(id);

  if (!category) {
    return (
      <AdminShell session={session} base={base} title="Not found">
        <Link href={`${base}/forum`} className="text-sm text-[var(--accent-color)] underline">Back to the forum</Link>
      </AdminShell>
    );
  }

  const page = Math.max(1, Number(rawPage) || 1);
  const { rows, total } = await listThreads(category.id, { page, q });
  const pages = Math.max(1, Math.ceil(total / THREADS_PER_PAGE));
  const qs = (p: number) => `?${new URLSearchParams({ ...(q ? { q } : {}), page: String(p) })}`;

  return (
    <AdminShell session={session} base={base} title={category.name}>
      <Link href={`${base}/forum`} className="text-sm text-[var(--accent-color)] underline underline-offset-2">All categories</Link>
      {error && <Notice tone="error">{error}</Notice>}
      {saved === "deleted" && <Notice>Thread deleted.</Notice>}
      {category.description && <p className="text-sm text-[var(--text-secondary)]">{category.description}</p>}

      <form method="get" className="flex flex-wrap gap-3">
        <input name="q" defaultValue={q} placeholder="Search thread titles" className={`${fieldClass} max-w-sm`} />
        <button className={buttonClass}>Search</button>
        {q && <Link href={`${base}/forum/c/${category.id}`} className="self-center text-sm text-[var(--text-secondary)] underline">Clear</Link>}
      </form>

      {rows.length === 0 ? (
        <p className="text-sm text-[var(--text-secondary)]">{q ? "No threads match." : "No threads yet. Start one below."}</p>
      ) : (
        <ul className="divide-y divide-[var(--border-color)] overflow-hidden rounded-2xl border border-[var(--border-color)]">
          {rows.map((t) => (
            <li key={t.id} className="px-4 py-3">
              <Link href={`${base}/forum/t/${t.id}`} className="text-sm font-semibold text-[var(--text-primary)] hover:text-[var(--accent-color)]">
                {t.pinned && <span className="mr-2 text-xs font-normal text-[var(--border-active)]">Pinned</span>}
                {t.locked && <span className="mr-2 text-xs font-normal text-[var(--text-secondary)]">Locked</span>}
                {t.title}
              </Link>
              <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                {t.createdBy} · {t.replyCount} repl{t.replyCount === 1 ? "y" : "ies"} · last activity {formatTime(t.lastPostAt.toISOString())}
              </p>
            </li>
          ))}
        </ul>
      )}

      {pages > 1 && (
        <nav className="flex items-center gap-3 text-sm" aria-label="Pages">
          {page > 1 && <Link href={`${base}/forum/c/${category.id}${qs(page - 1)}`} className="underline">Newer</Link>}
          <span className="text-[var(--text-secondary)]">Page {page} of {pages}</span>
          {page < pages && <Link href={`${base}/forum/c/${category.id}${qs(page + 1)}`} className="underline">Older</Link>}
        </nav>
      )}

      <form method="post" action="/api/admin/forum" className={`${cardClass} grid gap-4`}>
        <input type="hidden" name="action" value="thread-create" />
        <input type="hidden" name="categoryId" value={category.id} />
        <p className="font-jetbrains text-sm font-bold uppercase tracking-widest text-[var(--text-primary)]">Start a thread</p>
        <div>
          <label htmlFor="title" className={labelClass}>Title *</label>
          <input id="title" name="title" required maxLength={150} className={fieldClass} />
        </div>
        <div>
          <label htmlFor="body" className={labelClass}>Message *</label>
          <textarea id="body" name="body" required rows={6} maxLength={10000} className={`${fieldClass} resize-y`} />
        </div>
        <div>
          <button className={buttonClass}>Post thread</button>
        </div>
      </form>
    </AdminShell>
  );
}
