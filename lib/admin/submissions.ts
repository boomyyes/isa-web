// Reading and changing stored submissions from the admin area.

import "server-only";
import { redis } from "@/lib/redis";
import {
  ERASE_KEY,
  INDEX_KEY,
  PENDING_KEY,
  emailKey,
  subKey,
  type StoredSubmission,
  type SubmissionStatus,
} from "@/lib/forms/server";

const REF = /^[A-Z]-[0-9A-Z]{6}$/;
const PAGE = 200;

async function load(ids: string[]): Promise<StoredSubmission[]> {
  if (ids.length === 0) return [];
  const records = await redis().mget<(StoredSubmission | null)[]>(...ids.map(subKey));
  // Expired by retention: drop from the index so the inbox doesn't keep paying for them.
  const gone = ids.filter((_, i) => !records[i]);
  if (gone.length) await redis().zrem(INDEX_KEY, ...gone);
  return records.filter((r): r is StoredSubmission => r !== null);
}

/** Newest first. `q` is a ref or an email address; anything else is ignored. */
export async function listSubmissions({ form, q }: { form?: string; q?: string }) {
  const query = (q ?? "").trim();
  let ids: string[];
  if (REF.test(query.toUpperCase())) ids = [query.toUpperCase()];
  else if (query.includes("@")) ids = await redis().smembers(emailKey(query.toLowerCase()));
  else ids = await redis().zrange<string[]>(INDEX_KEY, 0, PAGE - 1, { rev: true });

  const subs = await load(ids);
  return subs
    .filter((s) => !form || s.form === form)
    .sort((a, b) => b.receivedAt.localeCompare(a.receivedAt));
}

export async function getSubmission(id: string): Promise<StoredSubmission | null> {
  if (!REF.test(id)) return null;
  return redis().get<StoredSubmission>(subKey(id));
}

/** Keeps the retention TTL, and requeues the ref so the sheet row updates. */
export async function updateSubmission(
  id: string,
  change: { status?: SubmissionStatus; note?: string },
  by: string
): Promise<boolean> {
  const sub = await getSubmission(id);
  if (!sub) return false;
  if (change.status) sub.status = change.status;
  if (change.note) {
    sub.notes = [...(sub.notes ?? []), { by, at: new Date().toISOString(), text: change.note }];
  }
  await redis().multi().set(subKey(id), sub, { keepTtl: true }).rpush(PENDING_KEY, id).exec();
  return true;
}

/**
 * DPDP erasure: deletes everything held under an email address and queues the
 * matching sheet rows for deletion. Returns the refs erased.
 */
export async function eraseByEmail(email: string): Promise<string[]> {
  const key = emailKey(email.trim().toLowerCase());
  const ids = await redis().smembers(key);
  if (ids.length === 0) {
    await redis().del(key);
    return [];
  }
  const tx = redis().multi();
  tx.del(key, ...ids.map(subKey));
  tx.zrem(INDEX_KEY, ...ids);
  for (const id of ids) tx.lrem(PENDING_KEY, 0, id);
  tx.rpush(ERASE_KEY, ...ids);
  await tx.exec();
  return ids;
}
