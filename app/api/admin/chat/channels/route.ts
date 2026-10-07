// POST action=save|archive|unarchive -> channel management. Faculty, President and Admin only.

import { adminRedirect, sessionFrom } from "@/lib/admin/session";
import { audit, can } from "@/lib/admin/store";
import { channelSchema, getChannel, isUuid, saveChannel, setArchived } from "@/lib/admin/chat";
import { sameOrigin } from "@/lib/security";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return new Response("Forbidden", { status: 403 });
  const session = await sessionFrom(request);
  if (!session) return adminRedirect(request, "/login");
  if (!can(session.role, "president")) return adminRedirect(request, "/chat?error=Only%20Faculty%2C%20the%20President%20or%20Admin%20can%20manage%20channels.");

  const form = await request.formData().catch(() => null);
  const action = form?.get("action");
  const id = form?.get("id");

  if (action === "archive" || action === "unarchive") {
    if (!isUuid(id) || !(await getChannel(id))) return adminRedirect(request, "/chat");
    await setArchived(id, action === "archive");
    await audit(session.email, `${action}d a chat channel`);
    return adminRedirect(request, "/chat?saved=1");
  }

  const parsed = channelSchema.safeParse({
    name: form?.get("name") ?? undefined,
    description: form?.get("description") ?? undefined,
    domain: form?.get("domain") ?? undefined,
    position: form?.get("position") ?? 0,
  });
  if (!parsed.success) return adminRedirect(request, `/chat?error=${encodeURIComponent(parsed.error.issues[0].message)}`);
  await saveChannel(isUuid(id) ? id : undefined, parsed.data);
  await audit(session.email, `saved chat channel "${parsed.data.name}"`);
  return adminRedirect(request, "/chat?saved=1");
}
