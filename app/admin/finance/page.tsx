import Link from "next/link";
import { AdminShell, buttonClass, cardClass, Notice, tableHeadClass, tableRowClass, tableWrapClass } from "@/components/admin/AdminShell";
import { fieldClass, labelClass } from "@/components/ui/formStyles";
import { requireAnyCapability } from "@/lib/admin/session";
import { can } from "@/lib/admin/store";
import { budgetSummary, currentFy, formatPaise, fyLabel, plainRupees, treasurySummary } from "@/lib/admin/finance";

export const dynamic = "force-dynamic";

const ISO = /^\d{4}-\d{2}-\d{2}$/;

export default async function FinanceOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; fy?: string; error?: string; saved?: string }>;
}) {
  const session = await requireAnyCapability(["finance.approve", "finance.audit"]);
  const { base } = session;
  const sp = await searchParams;
  const from = ISO.test(sp.from ?? "") ? sp.from : undefined;
  const to = ISO.test(sp.to ?? "") ? sp.to : undefined;
  const thisFy = currentFy();
  // Last year, this year and next: enough to review the past and set up the coming one.
  const fyChoices = [thisFy - 1, thisFy, thisFy + 1];
  const fy = fyChoices.includes(Number(sp.fy)) ? Number(sp.fy) : thisFy;
  const canSet = can(session.role, "president");
  const [rows, year] = await Promise.all([budgetSummary({ from, to }), treasurySummary(fy)]);
  const total = rows.reduce(
    (t, r) => ({ allocated: t.allocated + r.allocated, income: t.income + r.income, spent: t.spent + r.spent, committed: t.committed + r.committed, awaiting: t.awaiting + r.awaiting }),
    { allocated: 0, income: 0, spent: 0, committed: 0, awaiting: 0 }
  );
  const exportQs = new URLSearchParams({ ...(from ? { from } : {}), ...(to ? { to } : {}) });

  return (
    <AdminShell session={session} base={base} title="Treasury overview">
      {sp.error && <Notice tone="error">{sp.error}</Notice>}
      {sp.saved && <Notice>Saved.</Notice>}

      <section className={cardClass}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-jetbrains text-sm font-bold uppercase tracking-widest text-[var(--text-primary)]">
            Treasury, FY {year.label}
          </h2>
          <nav aria-label="Financial year" className="flex gap-2 text-xs">
            {fyChoices.map((y) => (
              <Link
                key={y}
                href={`${base}/finance?fy=${y}`}
                aria-current={y === fy ? "page" : undefined}
                className={`rounded-full border px-3 py-1 ${y === fy ? "border-[var(--border-active)] text-[var(--text-primary)]" : "border-white/15 text-[var(--text-secondary)]"}`}
              >
                FY {fyLabel(y)}
              </Link>
            ))}
          </nav>
        </div>

        {year.amount === null ? (
          <p className="mt-3 text-sm text-[var(--text-secondary)]">
            No treasury set for FY {year.label} yet.{canSet ? " Set it below." : " The Faculty Advisor, President or Treasurer sets it."}
          </p>
        ) : (
          <>
            <dl className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3 lg:grid-cols-6">
              {[
                ["Treasury", year.amount],
                ["Spent", year.spent],
                ["Approved, unpaid", year.committed],
                ["Remaining", year.remaining],
                ["Allocated to budgets", year.allocated],
                ["Not yet allocated", year.unallocated],
              ].map(([label, value]) => (
                <div key={label as string}>
                  <dt className="text-xs text-[var(--text-secondary)]">{label}</dt>
                  <dd className={`mt-1 text-lg font-semibold tabular-nums ${(value as number) < 0 ? "text-red-400" : "text-[var(--text-primary)]"}`}>
                    {formatPaise(value as number)}
                  </dd>
                </div>
              ))}
            </dl>
            {year.amount > 0 && (
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/[0.06]" aria-hidden>
                <div
                  className="h-full rounded-full bg-[var(--border-active)]"
                  style={{ width: `${Math.max(0, Math.min(100, ((year.remaining ?? 0) / year.amount) * 100))}%` }}
                />
              </div>
            )}
            <p className="mt-3 text-xs text-[var(--text-secondary)]">
              Remaining = treasury − spent − approved but unpaid, for spending dated in FY {year.label} (April to March).
              Income this year, {formatPaise(year.income)}, is shown separately and doesn&apos;t add to the treasury.
              {(year.unallocated ?? 0) < 0 && " Open budgets are allocated more than the treasury."}
            </p>
          </>
        )}

        {canSet && (
          <form method="post" action="/api/admin/finance" className="mt-4 flex flex-wrap items-end gap-3 border-t border-white/10 pt-4">
            <input type="hidden" name="action" value="treasury-set" />
            <input type="hidden" name="fy" value={fy} />
            <div>
              <label htmlFor="treasury-amount" className={labelClass}>
                Treasury for FY {year.label} (₹)
              </label>
              <input
                id="treasury-amount"
                name="amount"
                inputMode="decimal"
                required
                defaultValue={year.amount === null ? "" : plainRupees(year.amount)}
                placeholder="e.g. 150000"
                className={`${fieldClass} w-48`}
              />
            </div>
            <button className={buttonClass}>{year.amount === null ? "Set" : "Update"}</button>
            <p className="w-full text-xs text-[var(--text-secondary)]">Every change is recorded in the audit log.</p>
          </form>
        )}
      </section>

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

      <div className={tableWrapClass}>
        <table className="w-full text-right text-sm">
          <thead className={tableHeadClass}>
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
              <tr key={r.id} className={`${tableRowClass} ${r.archived ? "opacity-60" : ""}`}>
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
              <tr className="border-t-2 border-white/10 font-semibold text-[var(--text-primary)] [&_td]:px-5 [&_td]:py-4">
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
