// GET ?type=ledger|bills&from&to&budget -> CSV for audits. Auditors and approvers.

import { sessionFrom } from "@/lib/admin/session";
import { audit, hasAnyCap } from "@/lib/admin/store";
import { csvRow, listBills, listLedger, plainRupees } from "@/lib/admin/finance";

export const runtime = "nodejs";

const ISO = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(request: Request) {
  const session = await sessionFrom(request);
  if (!session) return new Response("Sign in again.", { status: 401 });
  if (!hasAnyCap(session, ["finance.audit", "finance.approve"])) return new Response("Not allowed.", { status: 403 });

  const url = new URL(request.url);
  const type = url.searchParams.get("type") === "bills" ? "bills" : "ledger";
  const from = ISO.test(url.searchParams.get("from") ?? "") ? url.searchParams.get("from")! : undefined;
  const to = ISO.test(url.searchParams.get("to") ?? "") ? url.searchParams.get("to")! : undefined;
  const budgetId = url.searchParams.get("budget") ?? undefined;

  let lines: string[];
  if (type === "ledger") {
    const rows = await listLedger({ from, to, budgetId });
    lines = [
      csvRow(["Date", "Budget", "Kind", "Amount (INR)", "Description", "Bill ID", "Reverses entry", "Entry ID", "Recorded by", "Recorded at"]),
      ...rows.map(({ entry: e, budgetName }) =>
        csvRow([e.entryDate, budgetName, e.kind, plainRupees(e.amountPaise), e.description, e.billId ?? "", e.reversesId ?? "", e.id, e.createdBy, e.createdAt.toISOString()])
      ),
    ];
  } else {
    const rows = await listBills({ from, to, budgetId });
    lines = [
      csvRow(["Bill date", "Budget", "Amount (INR)", "Vendor", "Description", "Status", "Receipts", "Submitted by", "Submitted at", "Decided by", "Decided at", "Reject reason", "Paid to", "Paid via", "Paid by", "Paid at", "Bill ID"]),
      ...rows.map(({ bill: b, budgetName, receipts }) =>
        csvRow([
          b.billDate, budgetName, plainRupees(b.amountPaise), b.vendor, b.description, b.status, receipts, b.submittedBy, b.submittedAt.toISOString(),
          b.decidedBy ?? "", b.decidedAt?.toISOString() ?? "", b.rejectReason ?? "", b.paidTo ?? "", b.payMode ?? "", b.paidBy ?? "", b.paidAt?.toISOString() ?? "", b.id,
        ])
      ),
    ];
  }

  await audit(session.email, `exported ${type} CSV${from || to ? ` (${from ?? "start"} to ${to ?? "now"})` : ""}`);
  // BOM so Excel opens ₹ and other non-ASCII text correctly.
  return new Response(`﻿${lines.join("\r\n")}\r\n`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="isa-rait-${type}-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
