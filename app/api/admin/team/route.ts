// POST action=set|remove, email, role, domain -> manages admins.
// Faculty, President and Admin only. Admins themselves come from ADMIN_OWNERS
// in Vercel and can't be granted, changed or removed here.

import { adminRedirect, sessionFrom } from "@/lib/admin/session";
import {
  audit,
  bootstrapOwners,
  can,
  isAssignableRole,
  isDomain,
  normaliseEmail,
  removeAdmin,
  ROLE_LABELS,
  setAdmin,
} from "@/lib/admin/store";
import { sameOrigin } from "@/lib/security";

export const runtime = "nodejs";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  if (!sameOrigin(request)) return new Response("Forbidden", { status: 403 });
  const session = await sessionFrom(request);
  if (!session) return adminRedirect(request, "/login");
  if (!can(session.role, "president")) return adminRedirect(request, "/?error=denied");

  const form = await request.formData().catch(() => null);
  const action = form?.get("action");
  const raw = form?.get("email");
  const role = form?.get("role");
  const rawDomain = form?.get("domain");
  const email = typeof raw === "string" ? normaliseEmail(raw).slice(0, 254) : "";

  if (!EMAIL.test(email)) return adminRedirect(request, "/team?error=email");
  if (bootstrapOwners().includes(email)) return adminRedirect(request, "/team?error=fixed");

  if (action === "set" && isAssignableRole(role)) {
    // Faculty and President span every domain; Core may have one; Joint Core must.
    const domain = role === "core" || role === "jointcore" ? (isDomain(rawDomain) ? rawDomain : null) : null;
    if (role === "jointcore" && !domain) return adminRedirect(request, "/team?error=domain");
    await setAdmin(email, role, domain, session.email);
    await audit(session.email, `set role "${ROLE_LABELS[role]}${domain ? ` · ${domain}` : ""}"`, email);
  } else if (action === "remove") {
    await removeAdmin(email);
    await audit(session.email, "removed admin", email);
  } else {
    return adminRedirect(request, "/team");
  }
  return adminRedirect(request, "/team?saved=1");
}
