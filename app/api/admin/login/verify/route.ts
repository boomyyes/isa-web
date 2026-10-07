// POST email + code -> starts a session if the code is right. Codes are
// single use, expire after 10 minutes, and die after 5 wrong guesses.

import { adminRedirect, sessionCookie } from "@/lib/admin/session";
import { audit, createSession, loginLimiters, normaliseEmail, roleOf, verifyLoginCode } from "@/lib/admin/store";
import { clientIp } from "@/lib/redis";
import { sameOrigin } from "@/lib/security";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return new Response("Forbidden", { status: 403 });

  const form = await request.formData().catch(() => null);
  const rawEmail = form?.get("email");
  const rawCode = form?.get("code");
  const email = typeof rawEmail === "string" ? normaliseEmail(rawEmail).slice(0, 254) : "";
  const code = typeof rawCode === "string" ? rawCode.replace(/\s+/g, "") : "";
  if (!email.includes("@")) return adminRedirect(request, "/login?error=email");
  const back = (error: string) => `/login/code?${new URLSearchParams({ email, error })}`;
  if (!/^\d{6}$/.test(code)) return adminRedirect(request, back("format"));

  try {
    if (!(await loginLimiters().codeIp.limit(clientIp(request))).success) {
      return adminRedirect(request, back("limit"));
    }
    const result = await verifyLoginCode(email, code);
    if (result === "wrong") return adminRedirect(request, back("wrong"));
    // Removed since the code was sent: the code dies with the access.
    if (result === "expired" || !(await roleOf(email))) return adminRedirect(request, "/login?error=expired");

    const id = await createSession(email);
    await audit(email, "signed in");
    return adminRedirect(request, "/", { "Set-Cookie": sessionCookie(id) });
  } catch {
    return adminRedirect(request, "/login?error=unavailable");
  }
}
