// POST status and/or note on one submission. Editors and owners.

import { adminRedirect, sessionFrom } from "@/lib/admin/session";
import { formVisibleTo, getSubmission, updateSubmission } from "@/lib/admin/submissions";
import { audit, can } from "@/lib/admin/store";
import { FORM_STATUSES } from "@/lib/forms/server";
import { sameOrigin } from "@/lib/security";

export const runtime = "nodejs";

async function handle(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!sameOrigin(request)) return new Response("Forbidden", { status: 403 });
  const session = await sessionFrom(request);
  if (!session) return adminRedirect(request, "/login");

  const { id } = await params;
  if (!can(session.role, "core")) return adminRedirect(request, `/s/${id}?error=denied`);

  const form = await request.formData().catch(() => null);
  const rawStatus = form?.get("status");
  const rawNote = form?.get("note");
  const sub = await getSubmission(id);
  if (!sub || !formVisibleTo(session.role, sub.form)) return adminRedirect(request, "/inbox?error=missing");
  const status = FORM_STATUSES[sub.form].find((s) => s === rawStatus);
  const note = typeof rawNote === "string" ? rawNote.trim().slice(0, 1000) : "";

  if (!status && !note) return adminRedirect(request, `/s/${id}`);

  const ok = await updateSubmission(id, { status, note: note || undefined }, session.email);
  if (!ok) return adminRedirect(request, "/inbox?error=missing");

  await audit(session.email, status ? `set status "${status}"` : "added a note", id);
  return adminRedirect(request, `/s/${id}?saved=1`);
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    return await handle(request, context);
  } catch (error) {
    console.error("[submissions]", error);
    const { id } = await context.params;
    return adminRedirect(request, `/s/${encodeURIComponent(id)}?error=failed`);
  }
}
