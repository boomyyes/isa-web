import Link from "next/link";
import { AdminShell, buttonClass, cardClass, Notice } from "@/components/admin/AdminShell";
import { fieldClass, labelClass } from "@/components/ui/formStyles";
import { requireCapability } from "@/lib/admin/session";
import { listBudgets } from "@/lib/admin/finance";

export const dynamic = "force-dynamic";

export default async function NewBillPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const session = await requireCapability("finance.submit");
  const { base } = session;
  const { error } = await searchParams;
  const open = await listBudgets({ includeArchived: false });

  return (
    <AdminShell session={session} base={base} title="Submit a bill">
      <Link href={`${base}/finance/bills`} className="text-sm text-[var(--accent-color)] underline underline-offset-2">Back to bills</Link>
      {error && <Notice tone="error">{error}</Notice>}
      {open.length === 0 ? (
        <p className="text-sm text-[var(--text-secondary)]">There are no open budgets yet. An approver needs to create one first.</p>
      ) : (
        <form method="post" action="/api/admin/finance" className={`${cardClass} grid gap-4 sm:grid-cols-2`}>
          <input type="hidden" name="action" value="bill-create" />
          <div className="sm:col-span-2">
            <label htmlFor="budgetId" className={labelClass}>Budget *</label>
            <select id="budgetId" name="budgetId" required defaultValue="" className={fieldClass}>
              <option value="" disabled>Choose…</option>
              {open.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="amount" className={labelClass}>Amount (₹) *</label>
            <input id="amount" name="amount" required inputMode="decimal" placeholder="1250.00" className={fieldClass} />
          </div>
          <div>
            <label htmlFor="billDate" className={labelClass}>Bill date *</label>
            <input id="billDate" name="billDate" type="date" required className={fieldClass} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="vendor" className={labelClass}>Vendor / paid to *</label>
            <input id="vendor" name="vendor" required maxLength={120} placeholder="e.g. Sai Printers" className={fieldClass} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="description" className={labelClass}>What it was for *</label>
            <textarea id="description" name="description" required rows={3} maxLength={1000} className={`${fieldClass} resize-y`} />
          </div>
          <p className="text-xs text-[var(--text-secondary)] sm:col-span-2">
            After submitting, attach the receipt (photo or PDF). A bill can&apos;t be approved without one.
            Don&apos;t include bank account or UPI details anywhere.
          </p>
          <div className="sm:col-span-2">
            <button className={buttonClass}>Submit bill</button>
          </div>
        </form>
      )}
    </AdminShell>
  );
}
