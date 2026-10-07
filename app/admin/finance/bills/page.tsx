import Link from "next/link";
import { AdminShell, buttonClass, formatTime, Notice, tableHeadClass, tableRowClass, tableWrapClass } from "@/components/admin/AdminShell";
import { BillStatus } from "@/components/admin/BillStatus";
import { fieldClass, labelClass } from "@/components/ui/formStyles";
import { requireAnyCapability } from "@/lib/admin/session";
import { hasAnyCap, hasCap } from "@/lib/admin/store";
import { BILL_STATUSES, formatPaise, listBills, listBudgets } from "@/lib/admin/finance";

export const dynamic = "force-dynamic";


const ISO = /^\d{4}-\d{2}-\d{2}$/;

export default async function BillsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; budget?: string; from?: string; to?: string; error?: string }>;
}) {
  const session = await requireAnyCapability(["finance.submit", "finance.approve", "finance.audit"]);
  const { base } = session;
  const sp = await searchParams;
  // Submitters who can't approve or audit see only their own bills.
  const seesAll = hasAnyCap(session, ["finance.approve", "finance.audit"]);
  const [rows, budgetList] = await Promise.all([
    listBills({
      status: sp.status,
      budgetId: sp.budget,
      from: ISO.test(sp.from ?? "") ? sp.from : undefined,
      to: ISO.test(sp.to ?? "") ? sp.to : undefined,
      mine: seesAll ? undefined : session.email,
    }),
    listBudgets(),
  ]);

  return (
    <AdminShell session={session} base={base} title={seesAll ? "Bills" : "My bills"}>
      {sp.error && <Notice tone="error">{sp.error}</Notice>}
      {hasCap(session, "finance.submit") && (
        <Link href={`${base}/finance/bills/new`} className={buttonClass}>Submit a bill</Link>
      )}

      <form method="get" className="flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="status" className={labelClass}>Status</label>
          <select id="status" name="status" defaultValue={sp.status ?? ""} className={`${fieldClass} w-auto`}>
            <option value="">All</option>
            {BILL_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="budget" className={labelClass}>Budget</label>
          <select id="budget" name="budget" defaultValue={sp.budget ?? ""} className={`${fieldClass} w-auto`}>
            <option value="">All</option>
            {budgetList.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
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
      </form>

      {rows.length === 0 ? (
        <p className="text-sm text-[var(--text-secondary)]">No bills match.</p>
      ) : (
        <div className={tableWrapClass}>
          <table className="w-full text-left text-sm">
            <thead className={tableHeadClass}>
              <tr>
                <th className="px-4 py-3">Bill date</th>
                <th className="px-4 py-3">Vendor</th>
                <th className="px-4 py-3">Budget</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ bill: b, budgetName, receipts }) => (
                <tr key={b.id} className={tableRowClass}>
                  <td className="whitespace-nowrap px-4 py-3">{b.billDate}</td>
                  <td className="px-4 py-3">
                    <Link href={`${base}/finance/bills/${b.id}`} className="underline underline-offset-2">{b.vendor}</Link>
                    {receipts === 0 && <span className="ml-2 text-xs text-amber-400">no receipt</span>}
                  </td>
                  <td className="px-4 py-3">{budgetName}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">{formatPaise(b.amountPaise)}</td>
                  <td className="px-4 py-3"><BillStatus status={b.status} /></td>
                  <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">{b.submittedBy}<br />{formatTime(b.submittedAt.toISOString())}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
