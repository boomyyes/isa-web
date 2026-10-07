import Link from "next/link";
import { AdminShell, buttonClass, cardClass, dangerButtonClass, formatTime, Notice } from "@/components/admin/AdminShell";
import { BillStatus } from "@/components/admin/BillStatus";
import { fieldClass, labelClass } from "@/components/ui/formStyles";
import { requireAnyCapability } from "@/lib/admin/session";
import { hasAnyCap, hasCap } from "@/lib/admin/store";
import { formatPaise, getBill, MAX_RECEIPTS, PAY_MODES, todayIst } from "@/lib/admin/finance";

export const dynamic = "force-dynamic";

export default async function BillPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string; added?: string }>;
}) {
  const session = await requireAnyCapability(["finance.submit", "finance.approve", "finance.audit"]);
  const { base } = session;
  const { id } = await params;
  const sp = await searchParams;
  const found = await getBill(id);

  const mine = found?.bill.submittedBy === session.email;
  const seesAll = hasAnyCap(session, ["finance.approve", "finance.audit"]);
  if (!found || (!mine && !seesAll)) {
    return (
      <AdminShell session={session} base={base} title="Bill not found">
        <Link href={`${base}/finance/bills`} className="text-sm text-[var(--accent-color)] underline">Back to bills</Link>
      </AdminShell>
    );
  }

  const { bill, budgetName, receipts } = found;
  const approver = hasCap(session, "finance.approve");
  const canDecide = approver && !mine;
  const canEditReceipts = bill.status === "submitted" && (mine || approver);

  return (
    <AdminShell session={session} base={base} title={`${bill.vendor} · ${formatPaise(bill.amountPaise)}`}>
      <Link href={`${base}/finance/bills`} className="text-sm text-[var(--accent-color)] underline underline-offset-2">Back to bills</Link>
      {sp.error && <Notice tone="error">{sp.error}</Notice>}
      {sp.saved && <Notice>Saved.</Notice>}
      {sp.added && <Notice>Bill submitted. Now attach the receipt below.</Notice>}

      <section className={cardClass}>
        <dl className="grid gap-x-8 gap-y-3 text-sm sm:grid-cols-[10rem_1fr]">
          <dt className="text-[var(--text-secondary)]">Status</dt>
          <dd><BillStatus status={bill.status} /></dd>
          <dt className="text-[var(--text-secondary)]">Budget</dt>
          <dd className="text-[var(--text-primary)]">{budgetName}</dd>
          <dt className="text-[var(--text-secondary)]">Amount</dt>
          <dd className="text-[var(--text-primary)]">{formatPaise(bill.amountPaise)}</dd>
          <dt className="text-[var(--text-secondary)]">Bill date</dt>
          <dd className="text-[var(--text-primary)]">{bill.billDate}</dd>
          <dt className="text-[var(--text-secondary)]">For</dt>
          <dd className="whitespace-pre-wrap text-[var(--text-primary)]">{bill.description}</dd>
          <dt className="text-[var(--text-secondary)]">Submitted</dt>
          <dd className="text-[var(--text-primary)]">{bill.submittedBy}, {formatTime(bill.submittedAt.toISOString())}</dd>
          {bill.decidedBy && (
            <>
              <dt className="text-[var(--text-secondary)]">{bill.status === "rejected" ? "Rejected" : "Approved"}</dt>
              <dd className="text-[var(--text-primary)]">
                {bill.decidedBy}, {bill.decidedAt && formatTime(bill.decidedAt.toISOString())}
                {bill.rejectReason && <span className="block text-red-400">Reason: {bill.rejectReason}</span>}
              </dd>
            </>
          )}
          {bill.paidBy && (
            <>
              <dt className="text-[var(--text-secondary)]">Paid</dt>
              <dd className="text-[var(--text-primary)]">
                To {bill.paidTo} via {bill.payMode}; recorded by {bill.paidBy}, {bill.paidAt && formatTime(bill.paidAt.toISOString())}
              </dd>
            </>
          )}
        </dl>
      </section>

      <section className={cardClass}>
        <h2 className="font-jetbrains text-sm font-bold uppercase tracking-widest text-[var(--text-primary)]">Receipts</h2>
        {receipts.length === 0 ? (
          <p className="mt-3 text-sm text-amber-400">No receipt attached yet.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {receipts.map((r, i) => (
              <li key={r.id} className="flex flex-wrap items-center gap-3">
                <a href={`/api/admin/finance/receipt/${r.id}`} target="_blank" rel="noreferrer" className="text-[var(--accent-color)] underline">
                  Receipt {i + 1} ({r.mime === "application/pdf" ? "PDF" : "image"}, {Math.ceil(r.sizeBytes / 1024)} KB)
                </a>
                <span className="text-xs text-[var(--text-secondary)]">{r.uploadedBy}, {formatTime(r.uploadedAt.toISOString())}</span>
                {canEditReceipts && (
                  <form method="post" action="/api/admin/finance">
                    <input type="hidden" name="action" value="receipt-remove" />
                    <input type="hidden" name="billId" value={bill.id} />
                    <input type="hidden" name="receiptId" value={r.id} />
                    <button className="text-xs text-red-400 underline">Remove</button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
        {canEditReceipts && receipts.length < MAX_RECEIPTS && (
          <form method="post" action="/api/admin/finance" encType="multipart/form-data" className="mt-4 flex flex-wrap items-center gap-3">
            <input type="hidden" name="action" value="receipt-add" />
            <input type="hidden" name="billId" value={bill.id} />
            <input name="file" type="file" required accept="image/png,image/jpeg,image/webp,application/pdf" aria-label="Receipt file" className="text-sm text-[var(--text-secondary)]" />
            <button className={buttonClass}>Attach</button>
            <span className="w-full text-xs text-[var(--text-secondary)]">Photo or PDF, up to 4 MB. Links expire after 2 minutes; open again for a new one.</span>
          </form>
        )}
      </section>

      {canDecide && bill.status === "submitted" && (
        <section className={`${cardClass} grid gap-4 sm:grid-cols-2`}>
          <form method="post" action="/api/admin/finance">
            <input type="hidden" name="action" value="bill-approve" />
            <input type="hidden" name="billId" value={bill.id} />
            <button className={buttonClass} disabled={receipts.length === 0}>Approve</button>
            {receipts.length === 0 && <p className="mt-2 text-xs text-[var(--text-secondary)]">Needs a receipt first.</p>}
          </form>
          <form method="post" action="/api/admin/finance" className="space-y-2">
            <input type="hidden" name="action" value="bill-reject" />
            <input type="hidden" name="billId" value={bill.id} />
            <label htmlFor="reason" className={labelClass}>Reject with reason</label>
            <input id="reason" name="reason" required maxLength={500} className={fieldClass} />
            <button className={dangerButtonClass}>Reject</button>
          </form>
        </section>
      )}

      {canDecide && bill.status === "approved" && (
        <form method="post" action="/api/admin/finance" className={`${cardClass} grid gap-4 sm:grid-cols-3`}>
          <input type="hidden" name="action" value="bill-pay" />
          <input type="hidden" name="billId" value={bill.id} />
          <p className="font-jetbrains text-sm font-bold uppercase tracking-widest text-[var(--text-primary)] sm:col-span-3">Record payment</p>
          <div>
            <label htmlFor="paidTo" className={labelClass}>Paid to *</label>
            <input id="paidTo" name="paidTo" required maxLength={120} defaultValue={bill.vendor} className={fieldClass} />
          </div>
          <div>
            <label htmlFor="payMode" className={labelClass}>How *</label>
            <select id="payMode" name="payMode" required defaultValue="" className={fieldClass}>
              <option value="" disabled>Choose…</option>
              {PAY_MODES.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="paidOn" className={labelClass}>Paid on *</label>
            <input id="paidOn" name="paidOn" type="date" required defaultValue={todayIst()} className={fieldClass} />
          </div>
          <p className="text-xs text-[var(--text-secondary)] sm:col-span-3">
            This posts the expense to the ledger. Don&apos;t record account numbers or UPI IDs.
          </p>
          <div className="sm:col-span-3">
            <button className={buttonClass}>Mark as paid</button>
          </div>
        </form>
      )}

      {mine && approver && ["submitted", "approved"].includes(bill.status) && (
        <p className="text-xs text-[var(--text-secondary)]">You submitted this bill, so another approver has to decide and pay it.</p>
      )}
    </AdminShell>
  );
}
