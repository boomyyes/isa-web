import { AdminShell, buttonClass, cardClass, Notice, tableHeadClass, tableRowClass, tableWrapClass } from "@/components/admin/AdminShell";
import { fieldClass, labelClass } from "@/components/ui/formStyles";
import { requireAnyCapability } from "@/lib/admin/session";
import { hasCap } from "@/lib/admin/store";
import { formatPaise, listBudgets, listLedger, todayIst } from "@/lib/admin/finance";

export const dynamic = "force-dynamic";

const ISO = /^\d{4}-\d{2}-\d{2}$/;

export default async function LedgerPage({
  searchParams,
}: {
  searchParams: Promise<{ budget?: string; from?: string; to?: string; kind?: string; error?: string; saved?: string }>;
}) {
  const session = await requireAnyCapability(["finance.approve", "finance.audit"]);
  const { base } = session;
  const sp = await searchParams;
  const approver = hasCap(session, "finance.approve");
  const filter = {
    budgetId: sp.budget,
    from: ISO.test(sp.from ?? "") ? sp.from : undefined,
    to: ISO.test(sp.to ?? "") ? sp.to : undefined,
    kind: sp.kind,
  };
  const [rows, budgetList] = await Promise.all([listLedger(filter), listBudgets()]);
  const net = rows.reduce((t, r) => t + (r.entry.kind === "income" ? r.entry.amountPaise : -r.entry.amountPaise), 0);
  const exportQs = new URLSearchParams({ ...(filter.from ? { from: filter.from } : {}), ...(filter.to ? { to: filter.to } : {}), ...(sp.budget ? { budget: sp.budget } : {}) });

  return (
    <AdminShell session={session} base={base} title="Ledger">
      {sp.error && <Notice tone="error">{sp.error}</Notice>}
      {sp.saved && <Notice>Saved.</Notice>}
      <p className="text-sm text-[var(--text-secondary)]">
        Entries can&apos;t be edited or deleted. To correct a mistake, reverse the entry and record the right one.
        Paid bills appear here automatically.
      </p>

      <form method="get" className="flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="budget" className={labelClass}>Budget</label>
          <select id="budget" name="budget" defaultValue={sp.budget ?? ""} className={`${fieldClass} w-auto`}>
            <option value="">All</option>
            {budgetList.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="kind" className={labelClass}>Kind</label>
          <select id="kind" name="kind" defaultValue={sp.kind ?? ""} className={`${fieldClass} w-auto`}>
            <option value="">All</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
        </div>
        <div>
          <label htmlFor="from" className={labelClass}>From</label>
          <input id="from" name="from" type="date" defaultValue={sp.from} className={`${fieldClass} w-auto`} />
        </div>
        <div>
          <label htmlFor="to" className={labelClass}>To</label>
          <input id="to" name="to" type="date" defaultValue={sp.to} className={`${fieldClass} w-auto`} />
        </div>
        <button className={buttonClass}>Filter</button>
        <a href={`/api/admin/finance/export?type=ledger&${exportQs}`} className={`${buttonClass} !border-[var(--border-color)]`}>Export CSV</a>
      </form>

      <div className={tableWrapClass}>
        <table className="w-full text-left text-sm">
          <thead className={tableHeadClass}>
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Budget</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3 text-right">Income</th>
              <th className="px-4 py-3 text-right">Expense</th>
              {approver && <th className="px-4 py-3" />}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ entry: e, budgetName, reversedBy }) => (
              <tr key={e.id} className={`${tableRowClass} ${reversedBy || e.reversesId ? "text-[var(--text-secondary)]" : ""}`}>
                <td className="whitespace-nowrap px-4 py-3">{e.entryDate}</td>
                <td className="px-4 py-3">{budgetName}</td>
                <td className="px-4 py-3">
                  {e.description}
                  {reversedBy && <span className="ml-2 text-xs">(reversed)</span>}
                  <span className="block text-xs text-[var(--text-secondary)]">{e.createdBy}</span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right">{e.kind === "income" ? formatPaise(e.amountPaise) : ""}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right">{e.kind === "expense" ? formatPaise(e.amountPaise) : ""}</td>
                {approver && (
                  <td className="px-4 py-3">
                    {!reversedBy && !e.reversesId && (
                      <details>
                        <summary className="cursor-pointer text-xs text-[var(--accent-color)] underline">Reverse</summary>
                        <form method="post" action="/api/admin/finance" className="mt-2 flex gap-2">
                          <input type="hidden" name="action" value="entry-reverse" />
                          <input type="hidden" name="entryId" value={e.id} />
                          <input name="reason" required maxLength={300} placeholder="Reason" aria-label="Reason for reversal" className={`${fieldClass} !py-1.5 text-xs`} />
                          <button className={`${buttonClass} !px-3 !py-1.5`}>Reverse</button>
                        </form>
                      </details>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
          {rows.length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-white/10 font-semibold text-[var(--text-primary)] [&_td]:px-5 [&_td]:py-4">
                <td className="px-4 py-3" colSpan={3}>Net (income − expense) for these entries</td>
                <td className={`px-4 py-3 text-right ${net < 0 ? "text-red-400" : ""}`} colSpan={2}>{formatPaise(net)}</td>
                {approver && <td />}
              </tr>
            </tfoot>
          )}
        </table>
        {rows.length === 0 && <p className="p-4 text-sm text-[var(--text-secondary)]">No entries match.</p>}
      </div>

      {approver && (
        <form method="post" action="/api/admin/finance" className={`${cardClass} grid gap-4 sm:grid-cols-2 lg:grid-cols-4`}>
          <input type="hidden" name="action" value="entry-add" />
          <p className="font-jetbrains text-sm font-bold uppercase tracking-widest text-[var(--text-primary)] sm:col-span-2 lg:col-span-4">
            Record income or an expense without a bill
          </p>
          <div>
            <label htmlFor="e-budget" className={labelClass}>Budget *</label>
            <select id="e-budget" name="budgetId" required defaultValue="" className={fieldClass}>
              <option value="" disabled>Choose…</option>
              {budgetList.filter((b) => !b.archived).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="e-kind" className={labelClass}>Kind *</label>
            <select id="e-kind" name="kind" required defaultValue="income" className={fieldClass}>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>
          <div>
            <label htmlFor="e-amount" className={labelClass}>Amount (₹) *</label>
            <input id="e-amount" name="amount" required inputMode="decimal" placeholder="5000" className={fieldClass} />
          </div>
          <div>
            <label htmlFor="e-date" className={labelClass}>Date *</label>
            <input id="e-date" name="entryDate" type="date" required defaultValue={todayIst()} className={fieldClass} />
          </div>
          <div className="sm:col-span-2 lg:col-span-4">
            <label htmlFor="e-desc" className={labelClass}>Description *</label>
            <input id="e-desc" name="description" required maxLength={500} placeholder="e.g. Artemis registration fees, 40 teams" className={fieldClass} />
          </div>
          <div>
            <button className={buttonClass}>Record</button>
          </div>
        </form>
      )}
    </AdminShell>
  );
}
