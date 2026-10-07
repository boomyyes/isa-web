// POST action=create|update|delete. Posting and editing need `announce`.

import { adminRedirect, sessionFrom } from "@/lib/admin/session";
import { audit, hasCap } from "@/lib/admin/store";
import {
  announcementSchema,
  createAnnouncement,
  deleteAnnouncement,
  getAnnouncement,
  updateAnnouncement,
} from "@/lib/admin/announcements";
import { sameOrigin } from "@/lib/security";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return new Response("Forbidden", { status: 403 });
  const session = await sessionFrom(request);
  if (!session) return adminRedirect(request, "/login");
  if (!hasCap(session, "announce")) return adminRedirect(request, "/announcements?error=denied");

  const form = await request.formData().catch(() => null);
  const action = form?.get("action");
  const id = String(form?.get("id") ?? "");

  if (action === "delete") {
    const existing = await getAnnouncement(id);
    if (!existing || !(await deleteAnnouncement(id))) return adminRedirect(request, "/announcements?error=missing");
    await audit(session.email, `deleted announcement "${existing.title}"`);
    return adminRedirect(request, "/announcements?saved=deleted");
  }

  const parsed = announcementSchema.safeParse({
    title: form?.get("title") ?? undefined,
    body: form?.get("body") ?? undefined,
    pinned: form?.get("pinned") ?? false,
    expiresAt: form?.get("expiresAt") ?? undefined,
  });
  if (!parsed.success) {
    const back = action === "update" ? `/announcements/e/${id}` : "/announcements";
    return adminRedirect(request, `${back}?error=${encodeURIComponent(parsed.error.issues[0].message)}`);
  }

  if (action === "update") {
    if (!(await updateAnnouncement(id, parsed.data))) return adminRedirect(request, "/announcements?error=missing");
    await audit(session.email, `edited announcement "${parsed.data.title}"`);
  } else {
    await createAnnouncement(parsed.data, session.email);
    await audit(session.email, `posted announcement "${parsed.data.title}"`);
  }
  return adminRedirect(request, "/announcements?saved=1");
}
