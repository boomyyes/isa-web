// Session lookups for admin pages (server components) and admin API routes.

import "server-only";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, SESSION_TTL_SECONDS, adminBase } from "./config";
import { can, hasAnyCap, hasCap, readSession, type Capability, type Role, type Session } from "./store";

/** For pages: the session, or a redirect to the login page. */
export async function requireAdmin(min: Role = "jointcore"): Promise<Session & { base: string }> {
  const base = adminBase((await headers()).get("host"));
  const session = await readSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session) redirect(`${base}/login`);
  if (!can(session.role, min)) redirect(`${base}/?denied=1`);
  return { ...session, base };
}

/** For pages gated by a feature capability rather than a role. */
export async function requireCapability(cap: Capability): Promise<Session & { base: string }> {
  const session = await requireAdmin();
  if (!hasCap(session, cap)) redirect(`${session.base}/?denied=1`);
  return session;
}

/** For pages open to holders of any one of several capabilities. */
export async function requireAnyCapability(caps: Capability[]): Promise<Session & { base: string }> {
  const session = await requireAdmin();
  if (!hasAnyCap(session, caps)) redirect(`${session.base}/?denied=1`);
  return session;
}

export async function currentBase(): Promise<string> {
  return adminBase((await headers()).get("host"));
}

function cookieFrom(request: Request): string | undefined {
  const header = request.headers.get("cookie") ?? "";
  for (const part of header.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === SESSION_COOKIE) return rest.join("=");
  }
  return undefined;
}

/** For API routes. */
export async function sessionFrom(request: Request): Promise<Session | null> {
  return readSession(cookieFrom(request));
}

export const sessionIdFrom = cookieFrom;

export function sessionCookie(id: string): string {
  return `${SESSION_COOKIE}=${id}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_TTL_SECONDS}`;
}

export const clearedSessionCookie = `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;

/** 303 so a form POST lands on a GET page, relative to the admin area. */
export function adminRedirect(request: Request, path: string, extraHeaders?: HeadersInit): Response {
  const base = adminBase(request.headers.get("host"));
  const response = new Response(null, {
    status: 303,
    headers: { Location: `${base}${path}`, "Cache-Control": "no-store" },
  });
  if (extraHeaders) new Headers(extraHeaders).forEach((v, k) => response.headers.append(k, v));
  return response;
}
