// POST email -> emails a single-use sign-in link if the address is an admin.
// The response is the same either way, so the form can't be used to find out
// who the admins are.

import { ADMIN_HOST, adminBase, isAdminHost } from "@/lib/admin/config";
import { adminMailConfigured, sendLoginLink } from "@/lib/admin/mail";
import { adminRedirect } from "@/lib/admin/session";
import { createLoginToken, loginLimiters, normaliseEmail, roleOf } from "@/lib/admin/store";
import { clientIp } from "@/lib/redis";
import { sameOrigin } from "@/lib/security";

export const runtime = "nodejs";

/** Production links always point at the admin host, never at a Host header. */
function linkOrigin(request: Request): string {
  const host = request.headers.get("host");
  if (isAdminHost(host) || process.env.VERCEL_ENV === "production") return `https://${ADMIN_HOST}`;
  const proto =
    request.headers.get("x-forwarded-proto") ?? new URL(request.url).protocol.replace(":", "");
  return `${proto}://${host}`;
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return new Response("Forbidden", { status: 403 });

  const form = await request.formData().catch(() => null);
  const raw = form?.get("email");
  const email = typeof raw === "string" ? normaliseEmail(raw).slice(0, 254) : "";
  if (!email.includes("@")) return adminRedirect(request, "/login?error=email");

  try {
    const limits = loginLimiters();
    const [byIp, byEmail] = await Promise.all([
      limits.ip.limit(clientIp(request)),
      limits.email.limit(email),
    ]);
    if (!byIp.success || !byEmail.success) return adminRedirect(request, "/login?error=limit");

    if (!adminMailConfigured()) return adminRedirect(request, "/login?error=unavailable");

    if (await roleOf(email)) {
      const token = await createLoginToken(email);
      const base = adminBase(request.headers.get("host"));
      await sendLoginLink(email, `${linkOrigin(request)}${base}/login/confirm?token=${token}`);
    }
  } catch {
    return adminRedirect(request, "/login?error=unavailable");
  }

  return adminRedirect(request, "/login?sent=1");
}
