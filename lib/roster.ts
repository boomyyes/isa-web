// Roster reconciliation, shared by the sync endpoint and the CLI importer so the
// two can't drift. Node runtime only.

import type { Redis } from "@upstash/redis";
import {
  WORKSHOPS,
  type CertRecord,
  type WorkshopRecord,
} from "./certificates";
import { DEFAULT_ACCESS_CODE, hashPassword, redisKey } from "./certificates.server";
import { mailerConfigured, sendAccessCodeEmail } from "./mailer";

/** Every `cert:*` key the last sync wrote, so a re-sync can delete removals. */
export const INDEX_KEY = "roster:index";

/**
 * UIDs waiting for an access code. A queue rather than a scan — the sync runs
 * every few minutes with nothing to do, and scanning would eat the 500k
 * commands/month budget in weeks.
 */
export const PENDING_KEY = "roster:pending";

export const MAX_DELETE_FRACTION = 0.2;

const TRUTHY = new Set(["true", "1", "yes", "y", "x", "✓"]);
export const isChecked = (value: string | undefined) =>
  TRUTHY.has((value ?? "").trim().toLowerCase());

// ------------------------------------------------------------- header parsing

/**
 * One label per column. With a merged two-row header the group label ("WKS 1")
 * only sits above the first of its pair, so it's forward-filled before joining
 * with row two.
 */
export function resolveHeader(rows: string[][]): { header: string[]; dataStart: number } {
  const [first, second] = rows;
  const hasGroupRow =
    second !== undefined &&
    /attended/i.test(second.join(" ")) &&
    !/attended/i.test(first.join(" "));

  if (!hasGroupRow) {
    return { header: first.map((h) => h.trim()), dataStart: 1 };
  }

  let carried = "";
  const header = second.map((sub, i) => {
    const group = (first[i] ?? "").trim();
    if (group) carried = group;
    return `${carried} ${sub}`.trim();
  });
  return { header, dataStart: 2 };
}

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function groupPattern(id: string, sheetLabel?: string): RegExp | null {
  if (sheetLabel) return new RegExp(escapeRegExp(sheetLabel), "i");
  const number = /(\d+)/.exec(id)?.[1];
  if (!number) return null;
  return new RegExp(`(?:wks|workshop)\\s*0*${number}\\b`, "i");
}

export function findWorkshopColumns(header: string[], warn: (message: string) => void) {
  const byWorkshop = new Map<string, { attended: number; received: number }>();

  for (const { id, sheetLabel } of WORKSHOPS) {
    const group = groupPattern(id, sheetLabel);

    // Never fall through silently — an unmatched workshop looks identical to
    // nobody having attended.
    if (!group) {
      warn(`"${id}" has no number to match on — add sheetLabel to its entry in lib/certificates.ts`);
      continue;
    }

    const attended = header.findIndex((h) => group.test(h) && /attend/i.test(h));
    const received = header.findIndex((h) => group.test(h) && /receiv/i.test(h));

    if (attended === -1 && received === -1) {
      warn(`no columns matched "${id}" — treating everyone as absent`);
      continue;
    }
    if (received === -1) warn(`"${id}" has no Received? column — assuming nobody has collected one`);

    byWorkshop.set(id, { attended, received });
  }

  if (byWorkshop.size === 0) {
    warn("NO workshop columns matched at all — every record would import as absent");
  }
  return byWorkshop;
}

// ------------------------------------------------------------ record building

export interface ParsedRow {
  key: string;
  uid: string;
  name: string;
  college: string;
  email: string;
  workshops: Record<string, WorkshopRecord>;
}

export interface ParseResult {
  rows: ParsedRow[];
  warnings: string[];
  workshopCount: number;
  dataStart: number;
  skipped: number;
}

/** Throws only on an unusable header; everything else is a warning. */
export function parseSheet(grid: string[][], extension = "png"): ParseResult {
  const rows = grid.filter((r) => r.some((cell) => (cell ?? "").trim() !== ""));
  if (rows.length < 2) throw new Error("Sheet has no data rows.");

  const warnings: string[] = [];
  const warn = (m: string) => warnings.push(m);

  const { header, dataStart } = resolveHeader(rows);
  const col = {
    uid: header.findIndex((h) => /^uid$/i.test(h)),
    name: header.findIndex((h) => /^name$/i.test(h)),
    college: header.findIndex((h) => /college/i.test(h)),
    email: header.findIndex((h) => /e-?mail/i.test(h)),
  };

  if (col.uid === -1 || col.name === -1 || col.email === -1) {
    throw new Error(`Sheet must have UID, Name and Email columns. Found: ${header.join(" | ")}`);
  }

  const workshopColumns = findWorkshopColumns(header, warn);
  const parsed: ParsedRow[] = [];
  const seen = new Map<string, number>();
  let skipped = 0;

  for (let i = dataStart; i < rows.length; i++) {
    const row = rows[i];
    const uid = (row[col.uid] ?? "").trim();
    const email = (row[col.email] ?? "").trim().toLowerCase();

    if (!uid) {
      warn(`row ${i + 1}: missing UID — skipped`);
      skipped++;
      continue;
    }

    const previous = seen.get(uid);
    if (previous !== undefined) {
      warn(`row ${i + 1}: duplicate UID "${uid}" (also row ${previous}) — later row wins`);
    }
    seen.set(uid, i + 1);

    if (!email || !email.includes("@")) {
      warn(`row ${i + 1} (UID ${uid}): no email — they can't be sent their access code`);
    }

    const workshops: Record<string, WorkshopRecord> = {};
    for (const { id } of WORKSHOPS) {
      const columns = workshopColumns.get(id);
      const attended = columns ? isChecked(row[columns.attended]) : false;
      workshops[id] = {
        attended,
        received: columns ? isChecked(row[columns.received]) : false,
        cert: attended ? `${id}/${uid}.${extension}` : null,
      };
    }

    parsed.push({
      key: redisKey(uid),
      uid,
      name: (row[col.name] ?? "").trim(),
      college: col.college === -1 ? "" : (row[col.college] ?? "").trim(),
      email,
      workshops,
    });
  }

  return { rows: parsed, warnings, workshopCount: workshopColumns.size, dataStart, skipped };
}

// ----------------------------------------------------------- reconcile to redis

export interface ReconcileResult {
  written: number;
  deleted: number;
  /** Created by this run, so they have no access code yet. */
  registered: number;
  stored: number;
  refused?: string;
}

/**
 * Make Redis match the sheet. Existing students keep their hash untouched —
 * codes are unrecoverable, so reissuing on every sync would lock the roster out.
 * New students get an empty hash, which is what queues them.
 */
export async function reconcile(
  redis: Redis,
  parsed: ParsedRow[],
  opts: { force?: boolean; dryRun?: boolean } = {}
): Promise<ReconcileResult> {
  const BATCH = 100;

  const existing = new Map<string, CertRecord>();
  for (let i = 0; i < parsed.length; i += BATCH) {
    const slice = parsed.slice(i, i + BATCH);
    const pipeline = redis.pipeline();
    for (const p of slice) pipeline.get<CertRecord>(p.key);
    const results = (await pipeline.exec()) as (CertRecord | null)[];
    results.forEach((value, j) => {
      if (value) existing.set(slice[j].key, value);
    });
  }

  const records: { key: string; record: CertRecord }[] = parsed.map((p) => {
    const prior = existing.get(p.key);
    return {
      key: p.key,
      record: {
        uid: p.uid,
        name: p.name,
        college: p.college,
        email: p.email,
        passwordHash: prior?.passwordHash ?? "",
        passwordEmailedAt: prior?.passwordEmailedAt ?? null,
        workshops: p.workshops,
      },
    };
  });

  // No hash == never issued a code == belongs in the queue.
  const pendingUids = records.filter((r) => !r.record.passwordHash).map((r) => r.record.uid);
  const registered = pendingUids.length;

  const newKeys = records.map((r) => r.key);
  const newKeySet = new Set(newKeys);

  // String(): Upstash JSON-parses set members, so "8" returns as the number 8.
  let knownKeys = (await redis.smembers(INDEX_KEY)).map(String);
  if (knownKeys.length === 0) {
    // First run, or data written before the index existed — scan so those
    // records get reconciled rather than orphaned.
    knownKeys = await redis.keys("cert:*");
  }
  const stale = knownKeys.filter((key) => !newKeySet.has(key));

  // A truncated export or an accidental block-delete shows up as a large drop.
  const allowed = Math.max(1, Math.floor(knownKeys.length * MAX_DELETE_FRACTION));
  if (stale.length > allowed && !opts.force) {
    return {
      written: 0,
      deleted: 0,
      registered: 0,
      stored: knownKeys.length,
      refused:
        `would delete ${stale.length} of ${knownKeys.length} record(s) ` +
        `(${Math.round((stale.length / knownKeys.length) * 100)}%)`,
    };
  }

  if (opts.dryRun) {
    return { written: records.length, deleted: stale.length, registered, stored: knownKeys.length };
  }

  for (let i = 0; i < records.length; i += BATCH) {
    const pipeline = redis.pipeline();
    for (const { key, record } of records.slice(i, i + BATCH)) pipeline.set(key, record);
    await pipeline.exec();
  }

  for (let i = 0; i < stale.length; i += BATCH) {
    const chunk = stale.slice(i, i + BATCH) as [string, ...string[]];
    await redis.del(...chunk);
  }

  // Before the index rebuild, so a crash in between leaves them queued rather
  // than silently code-less.
  for (let i = 0; i < pendingUids.length; i += BATCH) {
    const chunk = pendingUids.slice(i, i + BATCH) as [string, ...string[]];
    await redis.sadd(PENDING_KEY, ...chunk);
  }

  const staleUids = stale.map((key) => key.replace(/^cert:/, ""));
  for (let i = 0; i < staleUids.length; i += BATCH) {
    const chunk = staleUids.slice(i, i + BATCH) as [string, ...string[]];
    await redis.srem(PENDING_KEY, ...chunk);
  }

  // Index last: a crash mid-write leaves the old one in place and the next run
  // re-reconciles instead of losing track.
  await redis.del(INDEX_KEY);
  for (let i = 0; i < newKeys.length; i += BATCH) {
    const chunk = newKeys.slice(i, i + BATCH) as [string, ...string[]];
    await redis.sadd(INDEX_KEY, ...chunk);
  }

  return { written: records.length, deleted: stale.length, registered, stored: knownKeys.length };
}

// -------------------------------------------------------- deliver access codes

export interface DeliveryResult {
  sent: number;
  failed: number;
  skippedNoEmail: number;
  remaining: number;
}

/**
 * Generation is deferred to here on purpose: a code is created, hashed, emailed
 * and dequeued in one iteration, so the plaintext never outlives the send and
 * the whole thing is resumable. `limit` keeps a big intake inside a serverless
 * timeout — callers re-run until `remaining` is 0.
 */
export async function deliverPendingCodes(
  redis: Redis,
  opts: { limit?: number } = {}
): Promise<DeliveryResult> {
  const limit = opts.limit ?? 25;
  const result: DeliveryResult = { sent: 0, failed: 0, skippedNoEmail: 0, remaining: 0 };

  if (!mailerConfigured()) {
    throw new Error("SMTP is not configured — cannot deliver access codes");
  }

  // One command in the common case, where nobody is waiting. String() because
  // Upstash JSON-parses set members, so "8" returns as the number 8 and srem misses.
  const queued = (await redis.smembers(PENDING_KEY)).map(String);
  if (queued.length === 0) return result;

  const batch = queued.slice(0, limit);
  result.remaining = Math.max(0, queued.length - batch.length);

  for (const uid of batch) {
    const record = await redis.get<CertRecord>(redisKey(uid));

    // Dropped from the roster between sync and delivery.
    if (!record) {
      await redis.srem(PENDING_KEY, uid);
      continue;
    }
    // Already has a code — a manual set-password, say.
    if (record.passwordHash) {
      await redis.srem(PENDING_KEY, uid);
      continue;
    }
    if (!record.email) {
      // Stays queued; adding their address to the sheet is all it takes.
      result.skippedNoEmail++;
      continue;
    }

    const password = DEFAULT_ACCESS_CODE;
    try {
      const passwordHash = await hashPassword(password);
      // Send before storing, so a failed send leaves them queued for a clean
      // retry rather than holding a code the database rejects.
      await sendAccessCodeEmail({
        to: record.email,
        name: record.name,
        uid: record.uid,
        password,
      });
      await redis.set(redisKey(record.uid), {
        ...record,
        passwordHash,
        passwordEmailedAt: new Date().toISOString(),
      } satisfies CertRecord);
      await redis.srem(PENDING_KEY, uid);
      result.sent++;
    } catch {
      result.failed++;
    }
  }

  return result;
}
