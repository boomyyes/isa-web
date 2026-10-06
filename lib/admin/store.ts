// Admins, roles, login links, sessions and the audit log, all in Upstash.
//
// The admin list lives in Redis rather than an env var so it can grow and
// change from the admin area without a redeploy. ADMIN_OWNERS seeds the owners
// who can never be locked out by a mistake made in the UI.

import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "@/lib/redis";
import { LOGIN_TTL_SECONDS, SESSION_TTL_SECONDS } from "./config";

export const ROLES = ["viewer", "editor", "owner"] as const;
export type Role = (typeof ROLES)[number];

const RANK: Record<Role, number> = { viewer: 0, editor: 1, owner: 2 };
export const can = (role: Role, needed: Role) => RANK[role] >= RANK[needed];
export const isRole = (value: unknown): value is Role =>
  typeof value === "string" && (ROLES as readonly string[]).includes(value);

export type AdminUser = { role: Role; addedBy: string; addedAt: string };
export type Session = { email: string; role: Role };

const USERS_KEY = "admin:users";
const AUDIT_KEY = "admin:audit";
const AUDIT_RETENTION_MS = 365 * 24 * 60 * 60 * 1000;

const sha = (value: string) => createHash("sha256").update(value).digest("hex");
const loginKey = (token: string) => `admin:login:${sha(token)}`;
const sessionKey = (id: string) => `admin:session:${sha(id)}`;
const sessionsOfKey = (email: string) => `admin:sessions:${email}`;

export const normaliseEmail = (value: string) => value.trim().toLowerCase();

/** Owners from the environment. Always owners, never removable from the UI. */
export function bootstrapOwners(): string[] {
  return (process.env.ADMIN_OWNERS ?? "")
    .split(",")
    .map(normaliseEmail)
    .filter(Boolean);
}

export async function roleOf(email: string): Promise<Role | null> {
  if (bootstrapOwners().includes(email)) return "owner";
  const user = await redis().hget<AdminUser>(USERS_KEY, email);
  return user && isRole(user.role) ? user.role : null;
}

export async function listAdmins() {
  const stored = (await redis().hgetall<Record<string, AdminUser>>(USERS_KEY)) ?? {};
  const owners = bootstrapOwners();
  const rows = Object.entries(stored)
    .filter(([email]) => !owners.includes(email))
    .map(([email, user]) => ({ email, ...user, fixed: false }));
  return [
    ...owners.map((email) => ({ email, role: "owner" as Role, addedBy: "Vercel", addedAt: "", fixed: true })),
    ...rows.sort((a, b) => a.email.localeCompare(b.email)),
  ];
}

export async function setAdmin(email: string, role: Role, by: string) {
  const existing = await redis().hget<AdminUser>(USERS_KEY, email);
  const user: AdminUser = {
    role,
    addedBy: existing?.addedBy ?? by,
    addedAt: existing?.addedAt ?? new Date().toISOString(),
  };
  await redis().hset(USERS_KEY, { [email]: user });
}

export async function removeAdmin(email: string) {
  await redis().hdel(USERS_KEY, email);
  await revokeSessions(email);
}

// ---------------------------------------------------------------- login links

/** Single use: the key is deleted as it's read. Only the hash is stored. */
export async function createLoginToken(email: string): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  await redis().set(loginKey(token), email, { ex: LOGIN_TTL_SECONDS });
  return token;
}

export async function consumeLoginToken(token: string): Promise<string | null> {
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
  return redis().getdel<string>(loginKey(token));
}

// ------------------------------------------------------------------ sessions

/** Server-side sessions, so logout and removal take effect immediately. */
export async function createSession(email: string): Promise<string> {
  const id = randomBytes(32).toString("base64url");
  await redis()
    .multi()
    .set(sessionKey(id), { email, createdAt: new Date().toISOString() }, { ex: SESSION_TTL_SECONDS })
    .sadd(sessionsOfKey(email), sha(id))
    .expire(sessionsOfKey(email), SESSION_TTL_SECONDS)
    .exec();
  return id;
}

/** The role is re-read every time, so a demotion applies on the next click. */
export async function readSession(id: string | undefined): Promise<Session | null> {
  if (!id || !/^[A-Za-z0-9_-]{43}$/.test(id)) return null;
  const stored = await redis().get<{ email: string }>(sessionKey(id));
  if (!stored) return null;
  const role = await roleOf(stored.email);
  return role ? { email: stored.email, role } : null;
}

export async function destroySession(id: string | undefined) {
  if (id) await redis().del(sessionKey(id));
}

export async function revokeSessions(email: string) {
  const hashes = await redis().smembers(sessionsOfKey(email));
  const keys = [...hashes.map((h) => `admin:session:${h}`), sessionsOfKey(email)];
  await redis().del(...keys);
}

// --------------------------------------------------------------- rate limits

let loginIp: Ratelimit | null = null;
let loginEmail: Ratelimit | null = null;

export function loginLimiters() {
  loginIp ??= new Ratelimit({
    redis: redis(),
    limiter: Ratelimit.slidingWindow(10, "1 h"),
    prefix: "rl:admin-login-ip",
    ephemeralCache: new Map(),
    analytics: false,
  });
  loginEmail ??= new Ratelimit({
    redis: redis(),
    limiter: Ratelimit.slidingWindow(3, "1 h"),
    prefix: "rl:admin-login-email",
    ephemeralCache: new Map(),
    analytics: false,
  });
  return { ip: loginIp, email: loginEmail };
}

// ----------------------------------------------------------------- audit log

export type AuditEntry = { at: string; by: string; action: string; target?: string };

/** Kept a year, matching "records relating to processing activity" in the policy. */
export async function audit(by: string, action: string, target?: string) {
  const now = Date.now();
  const entry: AuditEntry = { at: new Date(now).toISOString(), by, action, target };
  await redis()
    .multi()
    // The random suffix keeps two identical actions in the same ms distinct.
    .zadd(AUDIT_KEY, { score: now, member: JSON.stringify({ ...entry, n: randomBytes(4).toString("hex") }) })
    .zremrangebyscore(AUDIT_KEY, 0, now - AUDIT_RETENTION_MS)
    .exec();
}

export async function listAudit(limit = 200): Promise<AuditEntry[]> {
  const raw = await redis().zrange<(string | AuditEntry)[]>(AUDIT_KEY, 0, limit - 1, { rev: true });
  return raw.map((r) => (typeof r === "string" ? (JSON.parse(r) as AuditEntry) : r));
}
