// POST action=create|update|delete -> internal calendar events.
// Everyone can read the calendar; changing it needs the `events` capability.

import { adminRedirect, sessionFrom } from "@/lib/admin/session";
import { audit, hasCap } from "@/lib/admin/store";
import { createInternal, deleteInternal, getInternal, internalEventSchema, updateInternal } from "@/lib/admin/calendar";
import { sameOrigin } from "@/lib/security";

export const runtime = "nodejs";

const month = (date: string) => date.slice(0, 7);

export async function POST(request: Request) {
  if (!sameOrigin(request)) return new Response("Forbidden", { status: 403 });
  const session = await sessionFrom(request);
  if (!session) return adminRedirect(request, "/login");
  if (!hasCap(session, "events")) return adminRedirect(request, "/calendar?error=denied");

  const form = await request.formData().catch(() => null);
  const action = form?.get("action");
  const id = String(form?.get("id") ?? "");

  if (action === "delete") {
    const existing = await getInternal(id);
    if (!existing || !(await deleteInternal(id))) return adminRedirect(request, "/calendar?error=missing");
    await audit(session.email, `deleted calendar event "${existing.title}"`);
    return adminRedirect(request, `/calendar?m=${month(existing.date)}&saved=deleted`);
  }

  const fields = Object.fromEntries(
    ["title", "date", "endDate", "startTime", "endTime", "location", "notes"].map((k) => [k, form?.get(k) ?? undefined])
  );
  const parsed = internalEventSchema.safeParse(fields);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    const back = action === "update" ? `/calendar/e/${id}` : "/calendar/new";
    return adminRedirect(request, `${back}?error=${encodeURIComponent(`${String(first.path[0] ?? "")}: ${first.message}`)}`);
  }

  if (action === "update") {
    if (!(await updateInternal(id, parsed.data))) return adminRedirect(request, "/calendar?error=missing");
    await audit(session.email, `edited calendar event "${parsed.data.title}"`);
  } else {
    await createInternal(parsed.data, session.email);
    await audit(session.email, `added calendar event "${parsed.data.title}"`);
  }
  return adminRedirect(request, `/calendar?m=${month(parsed.data.date)}&saved=1`);
}
