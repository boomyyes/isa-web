import "server-only";
import { and, desc, eq, gt, isNull, or, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { announcements, readMarkers } from "@/lib/db/schema";

const SCOPE = "announcements";
const blank = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);

export const announcementSchema = z.object({
  title: z.string("Title is required.").trim().min(1, "Title is required.").max(150),
  body: z.string("Write the announcement.").trim().min(1, "Write the announcement.").max(10000),
  pinned: z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean()),
  // datetime-local, entered in IST.
  expiresAt: z.preprocess(blank, z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Pick a date and time.").optional()),
});
export type AnnouncementInput = z.infer<typeof announcementSchema>;

const expiry = (v?: string) => (v ? new Date(`${v}:00+05:30`) : null);
const live = () => or(isNull(announcements.expiresAt), gt(announcements.expiresAt, sql`now()`));

/** Pinned first, then newest. Expired ones only when asked for. */
export async function listAnnouncements({ includeExpired = false } = {}) {
  return db()
    .select()
    .from(announcements)
    .where(includeExpired ? undefined : live())
    .orderBy(desc(announcements.pinned), desc(announcements.createdAt))
    .limit(100);
}

export async function getAnnouncement(id: string) {
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  const [row] = await db().select().from(announcements).where(eq(announcements.id, id));
  return row ?? null;
}

export async function createAnnouncement(a: AnnouncementInput, by: string) {
  const [row] = await db()
    .insert(announcements)
    .values({ title: a.title, body: a.body, pinned: a.pinned, expiresAt: expiry(a.expiresAt), createdBy: by })
    .returning({ id: announcements.id });
  return row.id;
}

export async function updateAnnouncement(id: string, a: AnnouncementInput) {
  const rows = await db()
    .update(announcements)
    .set({ title: a.title, body: a.body, pinned: a.pinned, expiresAt: expiry(a.expiresAt), updatedAt: new Date() })
    .where(eq(announcements.id, id))
    .returning({ id: announcements.id });
  return rows.length > 0;
}

export async function deleteAnnouncement(id: string) {
  const rows = await db().delete(announcements).where(eq(announcements.id, id)).returning({ id: announcements.id });
  return rows.length > 0;
}

/** Live announcements posted since this admin last opened the page (by someone else). */
export async function unreadCount(email: string): Promise<number> {
  const [marker] = await db()
    .select({ readAt: readMarkers.readAt })
    .from(readMarkers)
    .where(and(eq(readMarkers.email, email), eq(readMarkers.scope, SCOPE)));
  const since = marker?.readAt ?? new Date(0);
  const [row] = await db()
    .select({ n: sql<number>`count(*)::int` })
    .from(announcements)
    .where(and(live(), gt(announcements.createdAt, since), sql`${announcements.createdBy} <> ${email}`));
  return row?.n ?? 0;
}

export async function markRead(email: string) {
  await db()
    .insert(readMarkers)
    .values({ email, scope: SCOPE, readAt: new Date() })
    .onConflictDoUpdate({ target: [readMarkers.email, readMarkers.scope], set: { readAt: new Date() } });
}

/** When this admin last read, for marking items as new on the page. */
export async function lastRead(email: string): Promise<Date> {
  const [marker] = await db()
    .select({ readAt: readMarkers.readAt })
    .from(readMarkers)
    .where(and(eq(readMarkers.email, email), eq(readMarkers.scope, SCOPE)));
  return marker?.readAt ?? new Date(0);
}
