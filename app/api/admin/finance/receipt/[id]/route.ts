// GET -> a two-minute private link to one receipt. The submitter, approvers and
// auditors may view it; the file itself never has a public address.

import { sessionFrom } from "@/lib/admin/session";
import { hasAnyCap } from "@/lib/admin/store";
import { getBill, getReceipt } from "@/lib/admin/finance";
import { presignGet } from "@/lib/r2";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await sessionFrom(request);
  if (!session) return new Response("Sign in again.", { status: 401 });

  const { id } = await params;
  const receipt = await getReceipt(id);
  const found = receipt ? await getBill(receipt.billId) : null;
  if (!receipt || !found) return new Response("Not found.", { status: 404 });

  const allowed = found.bill.submittedBy === session.email || hasAnyCap(session, ["finance.approve", "finance.audit"]);
  if (!allowed) return new Response("Not allowed.", { status: 403 });

  const url = await presignGet(receipt.r2Key, 120);
  return new Response(null, { status: 302, headers: { Location: url, "Cache-Control": "no-store" } });
}
