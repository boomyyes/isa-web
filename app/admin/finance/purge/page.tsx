import { AdminShell, cardClass, dangerButtonClass, Notice } from "@/components/admin/AdminShell";
import { fieldClass, labelClass } from "@/components/ui/formStyles";
import { requireAdmin } from "@/lib/admin/session";
import { purgeableYears } from "@/lib/admin/finance";

export const dynamic = "force-dynamic";

export default async function PurgePage({ searchParams }: { searchParams: Promise<{ error?: string; done?: string }> }) {
  const session = await requireAdmin("owner");
  const { base } = session;
  const sp = await searchParams;
  const years = await purgeableYears();

  return (
    <AdminShell session={session} base={base} title="Delete old financial records">
      {sp.error && <Notice tone="error">{sp.error}</Notice>}
      {sp.done && <Notice>{sp.done}</Notice>}

      <section className={`${cardClass} space-y-3 text-sm text-[var(--text-secondary)]`}>
        <p>
          Financial records are kept for one year after their financial year (April to March) ends, then
          become eligible for deletion here. Nothing is deleted automatically.
        </p>
        <p>
          Deleting a year removes its ledger entries, its paid and rejected bills, and their receipt files,
          permanently. Bills from that year still awaiting a decision or payment are kept.
        </p>
        <p className="text-[var(--text-primary)]">
          Before deleting, make sure the year&apos;s accounts have been audited, and export the ledger and bills
          CSVs from the Overview page if anyone may need them later.
        </p>
      </section>

      {years.length === 0 ? (
        <p className="text-sm text-[var(--text-secondary)]">No financial year is eligible for deletion yet.</p>
      ) : (
        years.map((y) => (
          <form key={y.fy} method="post" action="/api/admin/finance" className={`${cardClass} space-y-3`}>
            <input type="hidden" name="action" value="purge-year" />
            <input type="hidden" name="fy" value={y.fy} />
            <p className="font-semibold text-[var(--text-primary)]">
              FY {y.label} ({y.from} to {y.to}): {y.entries} ledger entries, {y.bills} bills
            </p>
            <div>
              <label htmlFor={`confirm-${y.fy}`} className={labelClass}>Type DELETE FY {y.label} to confirm</label>
              <input id={`confirm-${y.fy}`} name="confirm" required autoComplete="off" className={`${fieldClass} max-w-xs`} />
            </div>
            <button className={dangerButtonClass}>Delete FY {y.label} permanently</button>
          </form>
        ))
      )}
    </AdminShell>
  );
}
