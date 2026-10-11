// POST email -> emails a one-time sign-in code if the address is an admin.
// The next screen is the same either way, so the form can't be used to find
// out who the admins are.

import { after } from "next/server";
import { adminMailConfigured, sendLoginCode } from "@/lib/admin/mail";
import { adminRedirect } from "@/lib/admin/session";
import { createLoginCode, loginLimiters, normaliseEmail, roleOf } from "@/lib/admin/store";
import { clientIp } from "@/lib/redis";
import { sameOrigin } from "@/lib/security";

export const runtime = "nodejs";

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

    // Sent after the response, so an admin address doesn't answer measurably
    // slower than any other one.
    after(async () => {
      try {
        if (await roleOf(email)) await sendLoginCode(email, await createLoginCode(email));
      } catch (error) {
        console.error("[admin login] code not sent:", error);
      }
    });
  } catch {
    return adminRedirect(request, "/login?error=unavailable");
  }

  return adminRedirect(request, `/login/code?${new URLSearchParams({ email })}`);
}
