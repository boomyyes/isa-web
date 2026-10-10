// POST email + confirm -> erases everything held under that address. Faculty Advisor, President and Admin only.

import { adminRedirect, sessionFrom } from "@/lib/admin/session";
import { eraseByEmail } from "@/lib/admin/submissions";
import { audit, can, normaliseEmail } from "@/lib/admin/store";
import { sameOrigin } from "@/lib/security";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return new Response("Forbidden", { status: 403 });
  const session = await sessionFrom(request);
  if (!session) return adminRedirect(request, "/login");
  if (!can(session.role, "president")) return adminRedirect(request, "/?error=denied");

  const form = await request.formData().catch(() => null);
  const raw = form?.get("email");
  const confirm = form?.get("confirm");
  const email = typeof raw === "string" ? normaliseEmail(raw) : "";
  const confirmed = typeof confirm === "string" ? normaliseEmail(confirm) : "";
  if (!email.includes("@") || confirmed !== email) return adminRedirect(request, "/erase?error=confirm");

  const refs = await eraseByEmail(email);
  // The audit keeps refs, not the address: the point is that it's gone.
  await audit(session.email, `erased ${refs.length} submission(s) on request`, refs.join(", ") || undefined);
  return adminRedirect(request, `/erase?done=${refs.length}`);
}
