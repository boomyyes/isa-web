import { AdminShell, buttonClass, cardClass, Notice } from "@/components/admin/AdminShell";
import { fieldClass, labelClass } from "@/components/ui/formStyles";
import { requireAnyCapability } from "@/lib/admin/session";
import { hasCap } from "@/lib/admin/store";
import { formatPaise, listBudgets, plainRupees } from "@/lib/admin/finance";

export const dynamic = "force-dynamic";

export default async function BudgetsPage({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  const session = await requireAnyCapability(["finance.approve", "finance.audit"]);
  const { base } = session;
  const sp = await searchParams;
  const approver = hasCap(session, "finance.approve");
  const list = await listBudgets();
  const blank = { id: "", name: "", description: null as string | null, allocatedPaise: 0, archived: false };

  return (
    <AdminShell session={session} base={base} title="Budgets">
      {sp.error && <Notice tone="error">{sp.error}</Notice>}
      {sp.saved && <Notice>Saved.</Notice>}
      <p className="text-sm text-[var(--text-secondary)]">
        One budget per event or spending head, e.g. &ldquo;Artemis 2026&rdquo; or &ldquo;Workshops 2026-27&rdquo;.
        Allocation changes are recorded in the audit log. Archived budgets take no new bills.
      </p>

      {!approver ? (
        <ul className="space-y-2">
          {list.map((b) => (
            <li key={b.id} className={`${cardClass} ${b.archived ? "opacity-60" : ""}`}>
              <p className="font-semibold text-[var(--text-primary)]">{b.name} · {formatPaise(b.allocatedPaise)}</p>
              {b.description && <p className="text-sm text-[var(--text-secondary)]">{b.description}</p>}
            </li>
          ))}
        </ul>
      ) : (
        <div className="space-y-4">
          {[...list, blank].map((b) => (
            <div key={b.id || "new"} className={`${cardClass} ${b.archived ? "opacity-70" : ""}`}>
              <form method="post" action="/api/admin/finance" className="grid gap-3 sm:grid-cols-[1fr_10rem] lg:grid-cols-[1fr_2fr_10rem_auto] lg:items-end">
                <input type="hidden" name="action" value="budget-save" />
                {b.id && <input type="hidden" name="id" value={b.id} />}
                <div>
                  <label className={labelClass}>{b.id ? "Name" : "New budget"}</label>
                  <input name="name" required maxLength={100} defaultValue={b.name} aria-label="Budget name" className={fieldClass} />
                </div>
                <div>
                  <label className={labelClass}>Description</label>
                  <input name="description" maxLength={500} defaultValue={b.description ?? ""} aria-label="Description" className={fieldClass} />
                </div>
                <div>
                  <label className={labelClass}>Allocated (₹)</label>
                  <input name="allocated" inputMode="decimal" defaultValue={b.id ? plainRupees(b.allocatedPaise) : ""} placeholder="0" aria-label="Allocated amount" className={fieldClass} />
                </div>
                <button className={buttonClass}>{b.id ? "Save" : "Create"}</button>
              </form>
              {b.id && (
                <form method="post" action="/api/admin/finance" className="mt-3">
                  <input type="hidden" name="action" value={b.archived ? "budget-unarchive" : "budget-archive"} />
                  <input type="hidden" name="id" value={b.id} />
                  <button className="text-xs text-[var(--text-secondary)] underline">{b.archived ? "Reopen" : "Archive"}</button>
                </form>
              )}
            </div>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
