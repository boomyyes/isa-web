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

// Chapter roles. Admin is the break-glass role: it comes only from ADMIN_OWNERS
// in Vercel and can't be granted, changed or removed from the admin area.
// Faculty and President lead; Core (titled Core or Subcore) runs things;
// Joint Core works inside one domain.
export const ROLES = ["jointcore", "core", "president", "faculty", "admin"] as const;
export type Role = (typeof ROLES)[number];
export const ASSIGNABLE_ROLES = ["faculty", "president", "core", "jointcore"] as const satisfies readonly Role[];
export const ROLE_LABELS: Record<Role, string> = {
  admin: "Admin",
  faculty: "Faculty",
  president: "President",
  core: "Core / Subcore",
  jointcore: "Joint Core",
};

const RANK: Record<Role, number> = { jointcore: 0, core: 1, president: 2, faculty: 2, admin: 3 };
export const can = (role: Role, needed: Role) => RANK[role] >= RANK[needed];
export const isRole = (value: unknown): value is Role =>
  typeof value === "string" && (ROLES as readonly string[]).includes(value);
export const isAssignableRole = (value: unknown): value is (typeof ASSIGNABLE_ROLES)[number] =>
  typeof value === "string" && (ASSIGNABLE_ROLES as readonly string[]).includes(value);

/** Roles stored before the chapter roles existed. */
const LEGACY_ROLES: Record<string, Role> = { owner: "president", editor: "core", viewer: "jointcore" };

export const DOMAINS = ["administrative", "creative", "editorial", "media", "publicity", "technical"] as const;
export type Domain = (typeof DOMAINS)[number];
export const isDomain = (value: unknown): value is Domain =>
  typeof value === "string" && (DOMAINS as readonly string[]).includes(value);
export const domainLabel = (d: Domain) => d[0].toUpperCase() + d.slice(1);

/** What each feature permission means. They follow from role and domain; nobody sets them by hand. */
export const CAPABILITIES = {
  content: "Edit and publish website content",
  events: "Manage the event calendar",
  announce: "Post announcements",
  forum: "Moderate the forum and chat",
  chat: "Use team chat",
  "finance.submit": "Submit bills",
  "finance.approve": "Approve and pay bills, manage budgets",
  "finance.audit": "View the treasury overview and exports",
} as const;
export type Capability = keyof typeof CAPABILITIES;
export const CAPABILITY_NAMES = Object.keys(CAPABILITIES) as Capability[];

/** The technical domain, at any level, looks after the website. */
export function capsFor(role: Role, domain: Domain | null): Capability[] {
  if (can(role, "president")) return [...CAPABILITY_NAMES];
  const tech: Capability[] = domain === "technical" ? ["content", "events"] : [];
  if (role === "core") return [...new Set<Capability>([...tech, "events", "announce", "forum", "chat", "finance.submit", "finance.approve"])];
  return [...tech, "chat", "finance.submit"];
}

export type AdminUser = { role: Role; domain?: Domain | null; addedBy: string; addedAt: string };
export type Session = { email: string; role: Role; domain: Domain | null; caps: Capability[] };
export type Access = { role: Role; domain: Domain | null; caps: Capability[] };

export const hasCap = (session: Pick<Session, "caps">, cap: Capability) => session.caps.includes(cap);

export const hasAnyCap = (session: Pick<Session, "caps">, caps: Capability[]) =>
  caps.some((cap) => hasCap(session, cap));

/**
 * Who a forum category or chat channel is for: everyone (null), Core and above
 * ("core"), or one domain. Joint Core see the general ones and their own
 * domain's; everyone above sees everything.
 */
export const AUDIENCES = ["core", ...DOMAINS] as const;
export const audienceLabel = (a: (typeof AUDIENCES)[number]) => (a === "core" ? "Core and above" : `${domainLabel(a)} only`);
export const seesDomain = (session: Pick<Session, "role" | "domain">, audience: string | null) =>
  audience === null || session.role !== "jointcore" || (audience !== "core" && session.domain === audience);

const USERS_KEY = "admin:users";
const AUDIT_KEY = "admin:audit";
const AUDIT_RETENTION_MS = 365 * 24 * 60 * 60 * 1000;

const sha = (value: string) => createHash("sha256").update(value).digest("hex");
const loginKey = (token: string) => `admin:login:${sha(token)}`;
const sessionKey = (id: string) => `admin:session:${sha(id)}`;
const sessionsOfKey = (email: string) => `admin:sessions:${email}`;

export const normaliseEmail = (value: string) => value.trim().toLowerCase();

/** Admins from the environment (ADMIN_OWNERS). Never changeable from the UI. */
export function bootstrapOwners(): string[] {
  return (process.env.ADMIN_OWNERS ?? "")
    .split(",")
    .map(normaliseEmail)
    .filter(Boolean);
}

/** Role and capabilities, read fresh each time so changes apply on the next click. */
export async function accessOf(email: string): Promise<Access | null> {
  if (bootstrapOwners().includes(email)) return { role: "admin", domain: null, caps: [...CAPABILITY_NAMES] };
  const user = await redis().hget<AdminUser>(USERS_KEY, email);
  const role = user ? (isRole(user.role) && user.role !== "admin" ? user.role : LEGACY_ROLES[user.role]) : undefined;
  if (!role) return null;
  const domain = isDomain(user?.domain) ? user.domain : null;
  return { role, domain, caps: capsFor(role, domain) };
}

export async function roleOf(email: string): Promise<Role | null> {
  return (await accessOf(email))?.role ?? null;
}

export async function listAdmins() {
  const stored = (await redis().hgetall<Record<string, AdminUser>>(USERS_KEY)) ?? {};
  const owners = bootstrapOwners();
  const rows = Object.entries(stored)
    .filter(([email]) => !owners.includes(email))
    .map(([email, user]) => ({
      email,
      ...user,
      role: (isRole(user.role) && user.role !== "admin" ? user.role : LEGACY_ROLES[user.role] ?? "jointcore") as Role,
      domain: isDomain(user.domain) ? user.domain : null,
      fixed: false,
    }));
  return [
    ...owners.map((email) => ({
      email,
      role: "admin" as Role,
      domain: null as Domain | null,
      addedBy: "Vercel",
      addedAt: "",
      fixed: true,
    })),
    ...rows.sort((a, b) => a.email.localeCompare(b.email)),
  ];
}

export async function setAdmin(email: string, role: Role, domain: Domain | null, by: string) {
  const existing = await redis().hget<AdminUser>(USERS_KEY, email);
  const user: AdminUser = {
    role,
    domain,
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
  const access = await accessOf(stored.email);
  return access ? { email: stored.email, ...access } : null;
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
