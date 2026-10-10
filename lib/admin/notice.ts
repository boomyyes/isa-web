// The internal notice to committee members (DPDP Act s.5): what the workspace
// holds about them. Each member acknowledges it once per version; changing the
// notice's substance means bumping NOTICE_VERSION so everyone sees it again.

import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { db, dbConfigured } from "@/lib/db";
import { noticeAcks } from "@/lib/db/schema";

// .2: the account entry now lists the optional display name.
// 2026-10-10: the Treasurer can now see what the President can.
export const NOTICE_VERSION = "2026-10-10";

/** When this member acknowledged the current version, or null if they haven't. */
export async function ackedAt(email: string): Promise<Date | null> {
  const [row] = await db()
    .select({ ackedAt: noticeAcks.ackedAt })
    .from(noticeAcks)
    .where(and(eq(noticeAcks.email, email), eq(noticeAcks.version, NOTICE_VERSION)))
    .orderBy(desc(noticeAcks.ackedAt))
    .limit(1);
  return row?.ackedAt ?? null;
}

/**
 * Whether to send this member to the notice first. If the database is missing
 * or down, the workspace stays usable rather than locking everyone out.
 */
export async function needsNotice(email: string): Promise<boolean> {
  if (!dbConfigured()) return false;
  try {
    return (await ackedAt(email)) === null;
  } catch {
    return false;
  }
}

export async function acknowledge(email: string) {
  if ((await ackedAt(email)) !== null) return;
  await db().insert(noticeAcks).values({ email, version: NOTICE_VERSION });
}
