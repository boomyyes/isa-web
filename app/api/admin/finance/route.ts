// POST action=… for the treasury. Rules, enforced here:
//   finance.submit  — submit bills, attach receipts to their own submitted bills
//   finance.approve — budgets, approve/reject/pay bills, ledger entries, reversals
//   president+      — the financial-year purge
// Nobody approves, rejects or pays a bill they submitted themselves.

import { adminRedirect, sessionFrom } from "@/lib/admin/session";
import { audit, can, hasCap } from "@/lib/admin/store";
import {
  addEntry,
  addReceipt,
  billSchema,
  budgetSchema,
  createBill,
  decideBill,
  entrySchema,
  formatPaise,
  fyLabel,
  getBill,
  getBudget,
  getReceipt,
  isUuid,
  MAX_RECEIPTS,
  payBill,
  paySchema,
  purgeableYears,
  purgeYear,
  removeReceipt,
  reverseEntry,
  saveBudget,
  setBudgetArchived,
} from "@/lib/admin/finance";
import { sameOrigin } from "@/lib/security";
import { checkUpload, storePrivate } from "@/lib/uploads";

export const runtime = "nodejs";

const err = (m: string) => `error=${encodeURIComponent(m)}`;

/**
 * A dropped database connection must not look like success or vanish silently.
 * Writes either completed or didn't; the message says to check before retrying.
 */
export async function POST(request: Request) {
  try {
    return await handle(request);
  } catch {
    return adminRedirect(
      request,
      `/finance/bills?${err("The database didn't respond. Check whether your change went through before trying again.")}`
    );
  }
}

async function handle(request: Request) {
  if (!sameOrigin(request)) return new Response("Forbidden", { status: 403 });
  const session = await sessionFrom(request);
  if (!session) return adminRedirect(request, "/login");

  const form = await request.formData().catch(() => null);
  const get = (k: string) => form?.get(k) ?? undefined;
  const action = get("action");
  const approver = hasCap(session, "finance.approve");
  const submitter = hasCap(session, "finance.submit");
  const me = session.email;

  // ------------------------------------------------------------- budgets
  if (action === "budget-save" || action === "budget-archive" || action === "budget-unarchive") {
    if (!approver) return adminRedirect(request, `/finance/budgets?${err("Only approvers can manage budgets.")}`);
    const id = get("id");
    if (action !== "budget-save") {
      if (!isUuid(id) || !(await getBudget(id))) return adminRedirect(request, "/finance/budgets");
      await setBudgetArchived(id, action === "budget-archive");
      await audit(me, `${action === "budget-archive" ? "archived" : "unarchived"} a budget`);
      return adminRedirect(request, "/finance/budgets?saved=1");
    }
    const parsed = budgetSchema.safeParse({ name: get("name"), description: get("description"), allocatedPaise: get("allocated") });
    if (!parsed.success) return adminRedirect(request, `/finance/budgets?${err(parsed.error.issues[0].message)}`);
    const before = isUuid(id) ? await getBudget(id) : null;
    await saveBudget(before?.id, parsed.data, me);
    await audit(
      me,
      before
        ? `edited budget "${parsed.data.name}"${before.allocatedPaise !== parsed.data.allocatedPaise ? `: allocation ${formatPaise(before.allocatedPaise)} → ${formatPaise(parsed.data.allocatedPaise)}` : ""}`
        : `created budget "${parsed.data.name}" with ${formatPaise(parsed.data.allocatedPaise)}`
    );
    return adminRedirect(request, "/finance/budgets?saved=1");
  }

  // --------------------------------------------------------------- bills
  if (action === "bill-create") {
    if (!submitter) return adminRedirect(request, `/finance/bills?${err("You don't have permission to submit bills.")}`);
    const parsed = billSchema.safeParse({
      budgetId: get("budgetId"),
      amountPaise: get("amount"),
      billDate: get("billDate"),
      vendor: get("vendor"),
      description: get("description"),
    });
    if (!parsed.success) return adminRedirect(request, `/finance/bills/new?${err(parsed.error.issues[0].message)}`);
    const budget = await getBudget(parsed.data.budgetId);
    if (!budget || budget.archived) return adminRedirect(request, `/finance/bills/new?${err("Choose an open budget.")}`);
    const id = await createBill(parsed.data, me);
    await audit(me, `submitted a bill of ${formatPaise(parsed.data.amountPaise)} to "${budget.name}"`, id);
    return adminRedirect(request, `/finance/bills/${id}?added=1`);
  }

  const billId = get("billId");
  const found = isUuid(billId) ? await getBill(billId) : null;

  if (action === "receipt-add" || action === "receipt-remove") {
    if (!found) return adminRedirect(request, `/finance/bills?${err("That bill no longer exists.")}`);
    const { bill } = found;
    const back = `/finance/bills/${bill.id}`;
    if (bill.status !== "submitted") return adminRedirect(request, `${back}?${err("Receipts are fixed once a bill is decided.")}`);
    if (bill.submittedBy !== me && !approver) return adminRedirect(request, `${back}?${err("Only the submitter can change receipts.")}`);

    if (action === "receipt-remove") {
      const receipt = await getReceipt(String(get("receiptId") ?? ""));
      if (!receipt || receipt.billId !== bill.id) return adminRedirect(request, back);
      await removeReceipt(receipt.id);
      await audit(me, "removed a receipt", bill.id);
      return adminRedirect(request, back);
    }

    if (found.receipts.length >= MAX_RECEIPTS) return adminRedirect(request, `${back}?${err(`A bill can have at most ${MAX_RECEIPTS} receipts.`)}`);
    const upload = await checkUpload(get("file") ?? null, ["png", "jpg", "webp", "pdf"]);
    if ("error" in upload) return adminRedirect(request, `${back}?${err(upload.error)}`);
    try {
      const key = await storePrivate(`receipts/${bill.id}`, upload);
      await addReceipt(bill.id, key, upload.mime, upload.bytes.byteLength, me);
    } catch {
      return adminRedirect(request, `${back}?${err("The upload failed. Check that storage allows writing, then try again.")}`);
    }
    await audit(me, "attached a receipt", bill.id);
    return adminRedirect(request, back);
  }

  if (action === "bill-approve" || action === "bill-reject" || action === "bill-pay") {
    if (!found) return adminRedirect(request, `/finance/bills?${err("That bill no longer exists.")}`);
    const { bill } = found;
    const back = `/finance/bills/${bill.id}`;
    if (!approver) return adminRedirect(request, `${back}?${err("Only approvers can do that.")}`);
    if (bill.submittedBy === me) return adminRedirect(request, `${back}?${err("You can't approve, reject or pay a bill you submitted.")}`);

    if (action === "bill-pay") {
      const parsed = paySchema.safeParse({ paidTo: get("paidTo"), payMode: get("payMode"), paidOn: get("paidOn") });
      if (!parsed.success) return adminRedirect(request, `${back}?${err(parsed.error.issues[0].message)}`);
      if (!(await payBill(bill.id, parsed.data, me))) return adminRedirect(request, `${back}?${err("Only an approved bill can be paid.")}`);
      await audit(me, `paid a bill of ${formatPaise(bill.amountPaise)} (${parsed.data.payMode})`, bill.id);
      return adminRedirect(request, `${back}?saved=1`);
    }

    if (action === "bill-approve") {
      if (found.receipts.length === 0) return adminRedirect(request, `${back}?${err("A bill needs at least one receipt before it can be approved.")}`);
      if (!(await decideBill(bill.id, "approved", me))) return adminRedirect(request, `${back}?${err("This bill has already been decided.")}`);
      await audit(me, `approved a bill of ${formatPaise(bill.amountPaise)}`, bill.id);
      return adminRedirect(request, `${back}?saved=1`);
    }

    const reason = String(get("reason") ?? "").trim().slice(0, 500);
    if (!reason) return adminRedirect(request, `${back}?${err("Give a reason for rejecting.")}`);
    if (!(await decideBill(bill.id, "rejected", me, reason))) return adminRedirect(request, `${back}?${err("This bill has already been decided.")}`);
    await audit(me, `rejected a bill of ${formatPaise(bill.amountPaise)}`, bill.id);
    return adminRedirect(request, `${back}?saved=1`);
  }

  // -------------------------------------------------------------- ledger
  if (action === "entry-add") {
    if (!approver) return adminRedirect(request, `/finance/ledger?${err("Only approvers can add ledger entries.")}`);
    const parsed = entrySchema.safeParse({
      budgetId: get("budgetId"),
      kind: get("kind"),
      amountPaise: get("amount"),
      entryDate: get("entryDate"),
      description: get("description"),
    });
    if (!parsed.success) return adminRedirect(request, `/finance/ledger?${err(parsed.error.issues[0].message)}`);
    if (!(await getBudget(parsed.data.budgetId))) return adminRedirect(request, `/finance/ledger?${err("Choose a budget.")}`);
    await addEntry(parsed.data, me);
    await audit(me, `recorded ${parsed.data.kind} of ${formatPaise(parsed.data.amountPaise)}`);
    return adminRedirect(request, "/finance/ledger?saved=1");
  }

  if (action === "entry-reverse") {
    if (!approver) return adminRedirect(request, `/finance/ledger?${err("Only approvers can reverse entries.")}`);
    const reason = String(get("reason") ?? "").trim().slice(0, 300);
    if (!reason) return adminRedirect(request, `/finance/ledger?${err("Give a reason for the reversal.")}`);
    const result = await reverseEntry(String(get("entryId") ?? ""), reason, me);
    const messages = { missing: "That entry no longer exists.", already: "That entry has already been reversed.", "is-reversal": "A reversal can't itself be reversed; record a new entry instead." };
    if (result !== "ok") return adminRedirect(request, `/finance/ledger?${err(messages[result])}`);
    await audit(me, "reversed a ledger entry", String(get("entryId")));
    return adminRedirect(request, "/finance/ledger?saved=1");
  }

  // --------------------------------------------------------------- purge
  if (action === "purge-year") {
    if (!can(session.role, "president")) return adminRedirect(request, `/finance?${err("Only Faculty, the President or Admin can delete records.")}`);
    const fy = Number(get("fy"));
    const eligible = (await purgeableYears()).find((y) => y.fy === fy);
    if (!eligible) return adminRedirect(request, `/finance/purge?${err("That year isn't eligible for deletion yet.")}`);
    const expected = `DELETE FY ${fyLabel(fy)}`;
    if (String(get("confirm") ?? "").trim() !== expected) {
      return adminRedirect(request, `/finance/purge?${err(`Type "${expected}" exactly to confirm.`)}`);
    }
    const result = await purgeYear(fy);
    await audit(me, `deleted financial records for FY ${fyLabel(fy)}: ${result.entries} ledger entries, ${result.bills} bills, ${result.files} receipt files`);
    const note = result.filesFailed ? ` ${result.filesFailed} receipt file(s) couldn't be deleted from storage; run the purge again to retry.` : "";
    return adminRedirect(request, `/finance/purge?done=${encodeURIComponent(`FY ${fyLabel(fy)} deleted: ${result.entries} ledger entries, ${result.bills} bills, ${result.files} receipt files.${note}`)}`);
  }

  return adminRedirect(request, "/finance");
}
