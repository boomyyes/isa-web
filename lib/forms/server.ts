// Submission pipeline for the public forms. Node runtime only.
//
// Checks run cheapest-first, and anything that smells of a bot gets a fake
// success so it learns nothing about which check caught it.

import "server-only";
import { createHash, randomInt } from "node:crypto";
import { resolveMx } from "node:dns/promises";
import { clientIp, formEmailLimiter, formIpLimiter, redis } from "@/lib/redis";
import { mailerConfigured, sendCustomEmail } from "@/lib/mailer";
import { sameOrigin } from "@/lib/security";
import {
  FORMS,
  HONEYPOT_FIELD,
  MIN_FILL_MS,
  fieldErrors,
  type FormName,
} from "./schemas";

/** Refs the sheet hasn't seen in their current state (new or edited). */
export const PENDING_KEY = "subs:pending";
/** Refs the sheet must delete rows for (erasure requests). */
export const ERASE_KEY = "subs:erase";
/** Every live ref, scored by receipt time, for the admin inbox. */
export const INDEX_KEY = "subs:index";
export const subKey = (id: string) => `sub:${id}`;
/** Refs per submitter, for search and erasure by email. */
export const emailKey = (email: string) => `subs:email:${email}`;

/** Retention, enforced by Redis expiry. Mirrors section 9 of the privacy policy. */
const RETENTION_SECONDS: Record<FormName, number> = {
  query: 365 * 24 * 60 * 60,
};

const DEDUPE_SECONDS = 24 * 60 * 60;
const MAX_JSON_BYTES = 16 * 1024;

export type StoredSubmission = {
  id: string;
  form: FormName;
  receivedAt: string;
  retainUntil: string;
  data: Record<string, unknown>;
  /** Set by editors in the admin area; mirrored to the sheet. */
  status?: SubmissionStatus;
  notes?: { by: string; at: string; text: string }[];
};

export const SUBMISSION_STATUSES = ["new", "in progress", "resolved", "spam"] as const;
export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number];

const PRIVATE_HEADERS = { "Cache-Control": "no-store" };

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: PRIVATE_HEADERS });

// No 0/O/1/I, so a reference read out over the phone survives.
const ID_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
function newId(prefix: string): string {
  let out = "";
  for (let i = 0; i < 6; i++) out += ID_ALPHABET[randomInt(ID_ALPHABET.length)];
  return `${prefix}-${out}`;
}

/** A believable reference for a submission we threw away. */
const decoy = (prefix: string) => json({ ok: true, ref: newId(prefix) });

/** Free-text spam tells. Returns a message for the person, or null. */
function spamReason(text: string): string | null {
  const links = text.match(/https?:\/\/|www\./gi)?.length ?? 0;
  if (links > 2) return "Please include no more than two links.";
  if (/<\/?[a-z][^>]*>|\[url[=\]]/i.test(text)) return "Please remove HTML or forum markup.";

  const visible = text.replace(/\s/g, "");
  const letters = visible.match(/\p{L}/gu)?.length ?? 0;
  if (visible.length >= 20 && letters / visible.length < 0.5) {
    return "Your message doesn't look like text. Please rewrite it.";
  }
  return null;
}

/**
 * True unless the domain provably can't take mail. DNS trouble on our side
 * accepts the submission rather than turning a real person away.
 */
async function domainAcceptsMail(email: string): Promise<boolean> {
  const domain = email.split("@")[1];
  if (!domain) return false;
  try {
    const records = await Promise.race([
      resolveMx(domain),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000)),
    ]);
    if (records === null) return true;
    // A null MX (RFC 7505) is the domain saying it takes no mail.
    return !(records.length === 1 && records[0].exchange === "");
  } catch (error) {
    const code = (error as { code?: string }).code;
    return code !== "ENOTFOUND";
  }
}

export async function handleSubmission(request: Request, form: FormName): Promise<Response> {
  const { schema, prefix, label } = FORMS[form];

  if (!sameOrigin(request)) return json({ error: "Forbidden." }, 403);

  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > MAX_JSON_BYTES) return json({ error: "That submission is too large." }, 413);

  let raw: string;
  let body: Record<string, unknown>;
  try {
    raw = await request.text();
    if (raw.length > MAX_JSON_BYTES) return json({ error: "That submission is too large." }, 413);
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error();
    body = parsed as Record<string, unknown>;
  } catch {
    return json({ error: "Invalid request body." }, 400);
  }

  // Bots: fake success, store nothing.
  const honeypot = body[HONEYPOT_FIELD];
  if (typeof honeypot === "string" && honeypot.trim() !== "") return decoy(prefix);
  const elapsed = Number(body.elapsed);
  if (!Number.isFinite(elapsed) || elapsed < MIN_FILL_MS) return decoy(prefix);

  const result = schema.safeParse(body);
  if (!result.success) {
    return json({ error: "Please fix the highlighted fields.", fields: fieldErrors(result.error) }, 400);
  }
  const data = result.data;

  // Same person, same form, same content within a day: hand back the first ref.
  // Checked before the rate limits so a double-click doesn't spend someone's quota.
  const { consent: _c, adult: _a, ...fields } = data;
  void _c;
  void _a;
  const fingerprint = createHash("sha256")
    .update(`${form}\n${JSON.stringify(fields)}`)
    .digest("hex");
  const dedupeKey = `dedupe:${fingerprint}`;

  try {
    const existing = await redis().get<string>(dedupeKey);
    if (existing) return json({ ok: true, ref: existing });
  } catch {
    return json({ error: "Submissions are unavailable right now. Please try again later." }, 503);
  }

  try {
    const [byIp, byEmail] = await Promise.all([
      formIpLimiter().limit(clientIp(request)),
      formEmailLimiter().limit(`${form}:${data.email}`),
    ]);
    if (!byIp.success || !byEmail.success) {
      return json({ error: "Too many submissions. Please try again later." }, 429);
    }
  } catch {
    return json({ error: "Submissions are unavailable right now. Please try again later." }, 503);
  }

  const reason = "message" in data ? spamReason(String(data.message)) : null;
  if (reason) return json({ error: reason, fields: { message: reason } }, 400);

  if (!(await domainAcceptsMail(data.email))) {
    const message = "That email domain can't receive mail. Check for a typo.";
    return json({ error: message, fields: { email: message } }, 400);
  }

  const id = newId(prefix);
  const now = new Date();
  const ttl = RETENTION_SECONDS[form];
  const record: StoredSubmission = {
    id,
    form,
    receivedAt: now.toISOString(),
    retainUntil: new Date(now.getTime() + ttl * 1000).toISOString(),
    // Declarations are stored as given: proof of consent is the fiduciary's burden (s.6(10)).
    data: { ...fields, consent: true, adult: true },
    status: "new",
  };

  try {
    const db = redis();
    // NX closes the race between two near-simultaneous identical posts.
    const claimed = await db.set(dedupeKey, id, { nx: true, ex: DEDUPE_SECONDS });
    if (claimed === null) {
      const existing = await db.get<string>(dedupeKey);
      return json({ ok: true, ref: existing ?? id });
    }

    await db
      .multi()
      .set(subKey(id), record, { ex: ttl })
      .rpush(PENDING_KEY, id)
      .zadd(INDEX_KEY, { score: now.getTime(), member: id })
      .sadd(emailKey(data.email), id)
      // Lives as long as the person's newest submission.
      .expire(emailKey(data.email), ttl)
      .exec();
  } catch {
    return json({ error: "Submissions are unavailable right now. Please try again later." }, 503);
  }

  await notifyCommittee(label, id);
  return json({ ok: true, ref: id });
}

/**
 * One line, no personal data: the inbox is not where submissions should live,
 * and mail can't be made to expire. Never blocks or fails the submission.
 */
async function notifyCommittee(label: string, id: string) {
  const to = process.env.FORMS_NOTIFY_TO;
  if (!to || !mailerConfigured()) return;
  try {
    await sendCustomEmail({
      to,
      subject: `New ${label} ${id}`,
      body: `A new ${label} (${id}) has been submitted. It will appear in the submissions sheet within a few minutes.`,
    });
  } catch {
    // The submission is already stored; a missed ping is not worth a failure.
  }
}
