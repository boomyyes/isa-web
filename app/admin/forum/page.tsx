import Link from "next/link";
import { AdminShell, buttonClass, cardClass, dangerButtonClass, formatTime, Notice } from "@/components/admin/AdminShell";
import { fieldClass, labelClass } from "@/components/ui/formStyles";
import { requireAdmin } from "@/lib/admin/session";
import { can } from "@/lib/admin/store";
import { listCategories } from "@/lib/admin/forum";

export const dynamic = "force-dynamic";

export default async function ForumPage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const session = await requireAdmin();
  const { base } = session;
  const { saved, error } = await searchParams;
  const owner = can(session.role, "owner");
  const categories = await listCategories();

  return (
    <AdminShell session={session} base={base} title="Forum">
      {saved && <Notice>Saved.</Notice>}
      {error && <Notice tone="error">{error}</Notice>}

      {categories.length === 0 ? (
        <p className="text-sm text-[var(--text-secondary)]">
          No categories yet.{owner ? " Add the first one below." : " An owner needs to add one."}
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {categories.map((c) => (
            <li key={c.id}>
              <Link href={`${base}/forum/c/${c.id}`} className={`${cardClass} block h-full transition hover:border-[var(--border-active)]`}>
                <p className="font-jetbrains text-sm font-bold text-[var(--text-primary)]">{c.name}</p>
                {c.description && <p className="mt-1 text-sm text-[var(--text-secondary)]">{c.description}</p>}
                <p className="mt-3 text-xs text-[var(--text-secondary)]">
                  {c.threads} thread{c.threads === 1 ? "" : "s"}
                  {c.lastPostAt && ` · last activity ${formatTime(new Date(c.lastPostAt).toISOString())}`}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {owner && (
        <details className={cardClass}>
          <summary className="cursor-pointer font-jetbrains text-sm font-bold uppercase tracking-widest text-[var(--text-primary)]">
            Manage categories
          </summary>
          <div className="mt-4 space-y-6">
            {[...categories, { id: "", name: "", description: null, position: categories.length }].map((c) => (
              <div key={c.id || "new"} className="space-y-2 border-t border-[var(--border-color)] pt-4">
                <form method="post" action="/api/admin/forum" className="grid gap-3 sm:grid-cols-[1fr_2fr_6rem_auto] sm:items-end">
                  <input type="hidden" name="action" value="category-save" />
                  {c.id && <input type="hidden" name="id" value={c.id} />}
                  <div>
                    <label className={labelClass}>{c.id ? "Name" : "New category"}</label>
                    <input name="name" required maxLength={80} defaultValue={c.name} className={fieldClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Description</label>
                    <input name="description" maxLength={300} defaultValue={c.description ?? ""} className={fieldClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Order</label>
                    <input name="position" type="number" min={0} max={999} defaultValue={c.position} className={fieldClass} />
                  </div>
                  <button className={buttonClass}>{c.id ? "Save" : "Add"}</button>
                </form>
                {c.id && (
                  <form method="post" action="/api/admin/forum">
                    <input type="hidden" name="action" value="category-delete" />
                    <input type="hidden" name="id" value={c.id} />
                    <button className={`${dangerButtonClass} !px-3 !py-1.5`}>Delete (only if empty)</button>
                  </form>
                )}
              </div>
            ))}
          </div>
        </details>
      )}
    </AdminShell>
  );
}
