// Treasury: budgets, bills with receipts, the append-only ledger, reports and
// the owner-confirmed financial-year purge. Money is integer paise throughout.

import "server-only";
import { and, asc, desc, eq, gte, inArray, lte, sql, type SQL } from "drizzle-orm";

// Correlated subqueries below name the outer row explicitly: interpolating a
// Drizzle column prints a bare "id", which inside the subquery means the
// subquery's own row, and silently matches nothing.
const OUTER_BUDGET = sql.raw('"budgets"."id"');
const OUTER_BILL = sql.raw('"bills"."id"');
const OUTER_ENTRY = sql.raw('"ledger_entries"."id"');
import { z } from "zod";
import { db } from "@/lib/db";
import { billReceipts, bills, budgets, ledgerEntries } from "@/lib/db/schema";
import { deleteObject } from "@/lib/r2";

export const PAY_MODES = ["Cash", "UPI", "Bank transfer", "Cheque", "Other"] as const;
export const BILL_STATUSES = ["submitted", "approved", "rejected", "paid"] as const;
export const MAX_RECEIPTS = 5;

const UUID = /^[0-9a-f-]{36}$/;
export const isUuid = (v: unknown): v is string => typeof v === "string" && UUID.test(v);
const blank = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);

// ---------------------------------------------------------------------- money

/** "1,234.5" or "1234.50" -> 123450. Rejects anything that isn't plain rupees. */
export function parseRupees(input: unknown): number | null {
  if (typeof input !== "string") return null;
  const s = input.replace(/[,\s₹]/g, "");
  if (!/^\d{1,9}(\.\d{1,2})?$/.test(s)) return null;
  const [whole, frac = ""] = s.split(".");
  return Number(whole) * 100 + Number(frac.padEnd(2, "0"));
}

const INR = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });
export const formatPaise = (paise: number) => INR.format(paise / 100);
/** For CSVs and inputs: "1234.50", no grouping or symbol. */
export const plainRupees = (paise: number) => (paise / 100).toFixed(2);

const rupees = (label: string) =>
  z.preprocess(parseRupees, z.number(`${label}: enter an amount like 1250 or 1250.50.`).int().positive(`${label} must be more than zero.`));

/** India's financial year: April to March. 2026-10-07 -> 2026 (FY 2026-27). */
export const fyOf = (isoDate: string) => {
  const [y, m] = isoDate.split("-").map(Number);
  return m >= 4 ? y : y - 1;
};
export const fyLabel = (startYear: number) => `${startYear}-${String((startYear + 1) % 100).padStart(2, "0")}`;
export const fyRange = (startYear: number) => ({ from: `${startYear}-04-01`, to: `${startYear + 1}-03-31` });

// -------------------------------------------------------------------- schemas

export const budgetSchema = z.object({
  name: z.string("Name is required.").trim().min(1, "Name is required.").max(100),
  description: z.preprocess(blank, z.string().trim().max(500).optional()),
  allocatedPaise: z.preprocess((v) => (blank(v) === undefined ? 0 : parseRupees(v)), z.number("Allocation: enter an amount like 15000.").int().min(0)),
});

export const billSchema = z.object({
  budgetId: z.string().regex(UUID, "Choose a budget."),
  amountPaise: rupees("Amount"),
  billDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter the bill date."),
  vendor: z.string("Enter who was paid or who issued the bill.").trim().min(1, "Enter who was paid or who issued the bill.").max(120),
  description: z.string("Say what it was for.").trim().min(1, "Say what it was for.").max(1000),
});

export const entrySchema = z.object({
  budgetId: z.string().regex(UUID, "Choose a budget."),
  kind: z.enum(["income", "expense"], "Choose income or expense."),
  amountPaise: rupees("Amount"),
  entryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter the date."),
  description: z.string("Describe the entry.").trim().min(1, "Describe the entry.").max(500),
});

export const paySchema = z.object({
  paidTo: z.string("Who was paid?").trim().min(1, "Who was paid?").max(120),
  payMode: z.enum(PAY_MODES, "Choose how it was paid."),
  paidOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter the payment date."),
});

// -------------------------------------------------------------------- budgets

export async function listBudgets({ includeArchived = true } = {}) {
  return db()
    .select()
    .from(budgets)
    .where(includeArchived ? undefined : eq(budgets.archived, false))
    .orderBy(asc(budgets.archived), asc(budgets.name));
}

export async function getBudget(id: string) {
  if (!isUuid(id)) return null;
  const [row] = await db().select().from(budgets).where(eq(budgets.id, id));
  return row ?? null;
}

export async function saveBudget(id: string | undefined, b: z.infer<typeof budgetSchema>, by: string) {
  const values = { name: b.name, description: b.description ?? null, allocatedPaise: b.allocatedPaise };
  if (id) await db().update(budgets).set(values).where(eq(budgets.id, id));
  else await db().insert(budgets).values({ ...values, createdBy: by });
}

export async function setBudgetArchived(id: string, archived: boolean) {
  await db().update(budgets).set({ archived }).where(eq(budgets.id, id));
}

// ---------------------------------------------------------------------- bills

export type BillFilter = { status?: string; budgetId?: string; from?: string; to?: string; mine?: string };

export async function listBills(f: BillFilter) {
  const where: SQL[] = [];
  if (f.status && (BILL_STATUSES as readonly string[]).includes(f.status)) where.push(eq(bills.status, f.status));
  if (isUuid(f.budgetId)) where.push(eq(bills.budgetId, f.budgetId));
  if (f.from) where.push(gte(bills.billDate, f.from));
  if (f.to) where.push(lte(bills.billDate, f.to));
  if (f.mine) where.push(eq(bills.submittedBy, f.mine));
  return db()
    .select({ bill: bills, budgetName: budgets.name, receipts: sql<number>`(select count(*)::int from ${billReceipts} br where br.bill_id = ${OUTER_BILL})` })
    .from(bills)
    .innerJoin(budgets, eq(bills.budgetId, budgets.id))
    .where(where.length ? and(...where) : undefined)
    .orderBy(desc(bills.submittedAt))
    .limit(500);
}

/** Bills in one status, counted on the status index. For badges, not listings. */
export async function countBills(status: (typeof BILL_STATUSES)[number]): Promise<number> {
  const [row] = await db()
    .select({ n: sql<number>`count(*)::int` })
    .from(bills)
    .where(eq(bills.status, status));
  return row?.n ?? 0;
}

export async function getBill(id: string) {
  if (!isUuid(id)) return null;
  const [row] = await db()
    .select({ bill: bills, budgetName: budgets.name })
    .from(bills)
    .innerJoin(budgets, eq(bills.budgetId, budgets.id))
    .where(eq(bills.id, id));
  if (!row) return null;
  const receipts = await db().select().from(billReceipts).where(eq(billReceipts.billId, id)).orderBy(asc(billReceipts.uploadedAt));
  return { ...row, receipts };
}

export async function createBill(b: z.infer<typeof billSchema>, by: string) {
  const [row] = await db().insert(bills).values({ ...b, submittedBy: by }).returning({ id: bills.id });
  return row.id;
}

export async function addReceipt(billId: string, r2Key: string, mime: string, sizeBytes: number, by: string) {
  await db().insert(billReceipts).values({ billId, r2Key, mime, sizeBytes, uploadedBy: by });
}

export async function getReceipt(id: string) {
  if (!isUuid(id)) return null;
  const [row] = await db().select().from(billReceipts).where(eq(billReceipts.id, id));
  return row ?? null;
}

/** Only while still submitted: once a decision is made, the evidence is frozen. */
export async function removeReceipt(id: string) {
  const [row] = await db().delete(billReceipts).where(eq(billReceipts.id, id)).returning();
  if (row) await deleteObject(row.r2Key).catch(() => {});
}

/** The status checks live in the WHERE clause, so two approvers can't both act on one bill. */
export async function decideBill(id: string, decision: "approved" | "rejected", by: string, reason?: string) {
  const rows = await db()
    .update(bills)
    .set({ status: decision, decidedBy: by, decidedAt: new Date(), rejectReason: decision === "rejected" ? reason ?? null : null })
    .where(and(eq(bills.id, id), eq(bills.status, "submitted")))
    .returning({ id: bills.id });
  return rows.length > 0;
}

/** Marks a bill paid and posts its expense to the ledger in one transaction. */
export async function payBill(id: string, p: z.infer<typeof paySchema>, by: string) {
  const found = await getBill(id);
  if (!found || found.bill.status !== "approved") return false;
  const { bill } = found;
  const [updated] = await db().batch([
    db()
      .update(bills)
      .set({ status: "paid", paidBy: by, paidAt: new Date(), paidTo: p.paidTo, payMode: p.payMode })
      .where(and(eq(bills.id, id), eq(bills.status, "approved")))
      .returning({ id: bills.id }),
    db().insert(ledgerEntries).values({
      budgetId: bill.budgetId,
      kind: "expense",
      amountPaise: bill.amountPaise,
      entryDate: p.paidOn,
      description: `Bill: ${bill.vendor} (paid to ${p.paidTo}, ${p.payMode})`,
      billId: bill.id,
      createdBy: by,
    }),
  ]);
  return updated.length > 0;
}

// --------------------------------------------------------------------- ledger

export type LedgerFilter = { budgetId?: string; from?: string; to?: string; kind?: string };

export async function listLedger(f: LedgerFilter) {
  const where: SQL[] = [];
  if (isUuid(f.budgetId)) where.push(eq(ledgerEntries.budgetId, f.budgetId));
  if (f.from) where.push(gte(ledgerEntries.entryDate, f.from));
  if (f.to) where.push(lte(ledgerEntries.entryDate, f.to));
  if (f.kind === "income" || f.kind === "expense") where.push(eq(ledgerEntries.kind, f.kind));
  return db()
    .select({
      entry: ledgerEntries,
      budgetName: budgets.name,
      reversedBy: sql<string | null>`(select r.id from ${ledgerEntries} r where r.reverses_id = ${OUTER_ENTRY})`,
    })
    .from(ledgerEntries)
    .innerJoin(budgets, eq(ledgerEntries.budgetId, budgets.id))
    .where(where.length ? and(...where) : undefined)
    .orderBy(desc(ledgerEntries.entryDate), desc(ledgerEntries.createdAt))
    .limit(1000);
}

export async function addEntry(e: z.infer<typeof entrySchema>, by: string) {
  await db().insert(ledgerEntries).values({ ...e, createdBy: by });
}

/** The correction for a mistake: same budget and kind, negated amount, linked. */
export async function reverseEntry(id: string, reason: string, by: string): Promise<"ok" | "missing" | "already" | "is-reversal"> {
  if (!isUuid(id)) return "missing";
  const [orig] = await db().select().from(ledgerEntries).where(eq(ledgerEntries.id, id));
  if (!orig) return "missing";
  if (orig.reversesId) return "is-reversal";
  try {
    await db().insert(ledgerEntries).values({
      budgetId: orig.budgetId,
      kind: orig.kind,
      amountPaise: -orig.amountPaise,
      entryDate: new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date()),
      description: `Reversal of "${orig.description}": ${reason}`,
      reversesId: orig.id,
      createdBy: by,
    });
    return "ok";
  } catch {
    // The unique constraint on reverses_id: someone reversed it first.
    return "already";
  }
}

// -------------------------------------------------------------------- reports

/** Per budget: allocated, income, spent, committed (approved but unpaid), awaiting decision, and what's left. */
export async function budgetSummary(range?: { from?: string; to?: string }) {
  const inRange = (col: SQL | typeof ledgerEntries.entryDate) =>
    sql`${range?.from ? sql`${col} >= ${range.from}` : sql`true`} and ${range?.to ? sql`${col} <= ${range.to}` : sql`true`}`;
  const rows = await db()
    .select({
      id: budgets.id,
      name: budgets.name,
      archived: budgets.archived,
      allocated: budgets.allocatedPaise,
      income: sql<number>`coalesce((select sum(amount_paise) from ${ledgerEntries} l where l.budget_id = ${OUTER_BUDGET} and l.kind = 'income' and ${inRange(sql`l.entry_date`)}), 0)::bigint`,
      spent: sql<number>`coalesce((select sum(amount_paise) from ${ledgerEntries} l where l.budget_id = ${OUTER_BUDGET} and l.kind = 'expense' and ${inRange(sql`l.entry_date`)}), 0)::bigint`,
      committed: sql<number>`coalesce((select sum(amount_paise) from ${bills} b where b.budget_id = ${OUTER_BUDGET} and b.status = 'approved'), 0)::bigint`,
      awaiting: sql<number>`coalesce((select sum(amount_paise) from ${bills} b where b.budget_id = ${OUTER_BUDGET} and b.status = 'submitted'), 0)::bigint`,
    })
    .from(budgets)
    .orderBy(asc(budgets.archived), asc(budgets.name));
  return rows.map((r) => {
    const [allocated, income, spent, committed, awaiting] = [r.allocated, r.income, r.spent, r.committed, r.awaiting].map(Number);
    return { ...r, allocated, income, spent, committed, awaiting, remaining: allocated - spent - committed, over: spent + committed > allocated };
  });
}

// ------------------------------------------------------------------------ CSV

/** Spreadsheet-safe cell: quoted, and a leading = + - @ can't become a formula. */
export function csvCell(value: unknown): string {
  let s = value === null || value === undefined ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}
export const csvRow = (cells: unknown[]) => cells.map(csvCell).join(",");

// ---------------------------------------------------------------------- purge

/** Financial years whose end is more than a year ago, with what they hold. */
export async function purgeableYears(today = new Date()) {
  const todayIso = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(today);
  const [ty, tm, td] = todayIso.split("-").map(Number);
  const cutoffEnd = `${ty - 1}-${String(tm).padStart(2, "0")}-${String(td).padStart(2, "0")}`; // a year ago
  const years = await db().execute(sql`
    with dated as (
      select (case when extract(month from entry_date) >= 4 then extract(year from entry_date) else extract(year from entry_date) - 1 end)::int as fy, 'entry' as t from ${ledgerEntries}
      union all
      select (case when extract(month from bill_date) >= 4 then extract(year from bill_date) else extract(year from bill_date) - 1 end)::int as fy, 'bill' as t from ${bills}
    )
    select fy, count(*) filter (where t = 'entry')::int as entries, count(*) filter (where t = 'bill')::int as bills from dated group by fy order by fy`);
  return (years.rows as { fy: number; entries: number; bills: number }[])
    .map((y) => ({ ...y, label: fyLabel(y.fy), ...fyRange(y.fy) }))
    .filter((y) => y.to < cutoffEnd);
}

/**
 * Deletes one financial year's ledger entries, bills (with receipt records) and
 * receipt files. Runs in a single transaction that alone sets the purge flag the
 * ledger trigger checks. Bills still awaiting payment are never purged.
 */
export async function purgeYear(fy: number) {
  const { from, to } = fyRange(fy);
  const doomed = await db()
    .select({ id: bills.id })
    .from(bills)
    .where(and(gte(bills.billDate, from), lte(bills.billDate, to), inArray(bills.status, ["paid", "rejected"])));
  const billIds = doomed.map((b) => b.id);
  const files = billIds.length
    ? await db().select({ key: billReceipts.r2Key }).from(billReceipts).where(inArray(billReceipts.billId, billIds))
    : [];

  const results = await db().batch([
    db().execute(sql`select set_config('app.ledger_purge', 'on', true)`),
    db()
      .delete(ledgerEntries)
      .where(and(gte(ledgerEntries.entryDate, from), lte(ledgerEntries.entryDate, to)))
      .returning({ id: ledgerEntries.id }),
    billIds.length
      ? db().delete(bills).where(inArray(bills.id, billIds)).returning({ id: bills.id })
      : db().execute(sql`select 1`),
  ]);

  // Files after the rows: a failed file delete leaves an orphan in private storage, never a broken record.
  let filesDeleted = 0;
  for (const f of files) {
    try {
      await deleteObject(f.key);
      filesDeleted++;
    } catch {
      // Reported below; safe to retry later.
    }
  }
  const entries = (results[1] as unknown[]).length;
  const billCount = billIds.length;
  return { entries, bills: billCount, files: filesDeleted, filesFailed: files.length - filesDeleted };
}

/** Today's date in India, "YYYY-MM-DD", for form defaults. */
export const todayIst = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
