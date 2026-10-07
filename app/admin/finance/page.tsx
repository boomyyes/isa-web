import Link from "next/link";
import { AdminShell, buttonClass, cardClass, Notice } from "@/components/admin/AdminShell";
import { fieldClass, labelClass } from "@/components/ui/formStyles";
import { requireAnyCapability } from "@/lib/admin/session";
import { budgetSummary, formatPaise } from "@/lib/admin/finance";

export const dynamic = "force-dynamic";

const ISO = /^\d{4}-\d{2}-\d{2}$/;

export default async function FinanceOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; error?: string }>;
}) {
  const session = await requireAnyCapability(["finance.approve", "finance.audit"]);
  const { base } = session;
  const sp = await searchParams;
  const from = ISO.test(sp.from ?? "") ? sp.from : undefined;
  const to = ISO.test(sp.to ?? "") ? sp.to : undefined;
  const rows = await budgetSummary({ from, to });
  const total = rows.reduce(
    (t, r) => ({ allocated: t.allocated + r.allocated, income: t.income + r.income, spent: t.spent + r.spent, committed: t.committed + r.committed, awaiting: t.awaiting + r.awaiting }),
    { allocated: 0, income: 0, spent: 0, committed: 0, awaiting: 0 }
  );
  const exportQs = new URLSearchParams({ ...(from ? { from } : {}), ...(to ? { to } : {}) });

  return (
    <AdminShell session={session} base={base} title="Treasury overview">
      {sp.error && <Notice tone="error">{sp.error}</Notice>}

      <form method="get" className="flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="from" className={labelClass}>From</label>
          <input id="from" name="from" type="date" defaultValue={from} className={`${fieldClass} w-auto`} />
        </div>
        <div>
          <label htmlFor="to" className={labelClass}>To</label>
          <input id="to" name="to" type="date" defaultValue={to} className={`${fieldClass} w-auto`} />
        </div>
        <button className={buttonClass}>Apply</button>
        {(from || to) && <Link href={`${base}/finance`} className="self-center text-sm underline">Clear</Link>}
      </form>
      <p className="text-xs text-[var(--text-secondary)]">
        The date range applies to income and spending. Approved-but-unpaid and awaiting-decision amounts are always current.
        Remaining = allocated − spent − approved but unpaid.
      </p>

      <div className="overflow-x-auto rounded-2xl border border-[var(--border-color)]">
        <table className="w-full text-right text-sm">
          <thead className="bg-[var(--card-color)] font-jetbrains text-xs uppercase tracking-widest text-[var(--text-secondary)]">
            <tr>
              <th className="px-4 py-3 text-left">Budget</th>
              <th className="px-4 py-3">Allocated</th>
              <th className="px-4 py-3">Income</th>
              <th className="px-4 py-3">Spent</th>
              <th className="px-4 py-3">Approved, unpaid</th>
              <th className="px-4 py-3">Awaiting decision</th>
              <th className="px-4 py-3">Remaining</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className={`border-t border-[var(--border-color)] text-[var(--text-primary)] ${r.archived ? "opacity-60" : ""}`}>
                <td className="px-4 py-3 text-left">
                  <Link href={`${base}/finance/ledger?budget=${r.id}`} className="underline underline-offset-2">{r.name}</Link>
                  {r.over && <span className="ml-2 rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-red-400">Over budget</span>}
                </td>
                <td className="px-4 py-3">{formatPaise(r.allocated)}</td>
                <td className="px-4 py-3">{formatPaise(r.income)}</td>
                <td className="px-4 py-3">{formatPaise(r.spent)}</td>
                <td className="px-4 py-3">{formatPaise(r.committed)}</td>
                <td className="px-4 py-3 text-[var(--text-secondary)]">{formatPaise(r.awaiting)}</td>
                <td className={`px-4 py-3 font-semibold ${r.remaining < 0 ? "text-red-400" : ""}`}>{formatPaise(r.remaining)}</td>
              </tr>
            ))}
            {rows.length > 0 && (
              <tr className="border-t-2 border-[var(--border-color)] font-semibold text-[var(--text-primary)]">
                <td className="px-4 py-3 text-left">Total</td>
                <td className="px-4 py-3">{formatPaise(total.allocated)}</td>
                <td className="px-4 py-3">{formatPaise(total.income)}</td>
                <td className="px-4 py-3">{formatPaise(total.spent)}</td>
                <td className="px-4 py-3">{formatPaise(total.committed)}</td>
                <td className="px-4 py-3">{formatPaise(total.awaiting)}</td>
                <td className="px-4 py-3">{formatPaise(total.allocated - total.spent - total.committed)}</td>
              </tr>
            )}
          </tbody>
        </table>
        {rows.length === 0 && <p className="p-4 text-sm text-[var(--text-secondary)]">No budgets yet. Create one under Budgets.</p>}
      </div>

      <section className={cardClass}>
        <h2 className="font-jetbrains text-sm font-bold uppercase tracking-widest text-[var(--text-primary)]">Export for audit</h2>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">CSV files that open in Excel or Google Sheets, using the date range above. Every export is logged.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <a href={`/api/admin/finance/export?type=ledger&${exportQs}`} className={buttonClass}>Ledger CSV</a>
          <a href={`/api/admin/finance/export?type=bills&${exportQs}`} className={buttonClass}>Bills CSV</a>
        </div>
      </section>
    </AdminShell>
  );
}
