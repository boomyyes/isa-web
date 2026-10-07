import "server-only";
import { and, asc, desc, eq, gt, lt, sql } from "drizzle-orm";
import { Ratelimit } from "@upstash/ratelimit";
import { z } from "zod";
import { db } from "@/lib/db";
import { chatChannels, chatMessages } from "@/lib/db/schema";
import { redis } from "@/lib/redis";

export const RETENTION_DAYS = 365;
export const PAGE = 50;
export const MAX_LENGTH = 2000;

const UUID = /^[0-9a-f-]{36}$/;
export const isUuid = (v: unknown): v is string => typeof v === "string" && UUID.test(v);

export const messageSchema = z.object({
  channelId: z.string().regex(UUID),
  body: z.string().trim().min(1, "Write a message.").max(MAX_LENGTH, `Messages are limited to ${MAX_LENGTH} characters.`),
});
export const channelSchema = z.object({
  name: z.string("Name is required.").trim().min(1, "Name is required.").max(60),
  description: z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? undefined : v), z.string().trim().max(200).optional()),
  position: z.coerce.number().int().min(0).max(999).default(0),
});

export type ChatMessage = { id: string; body: string; createdBy: string; createdAt: string; deleted: boolean };

const shape = (m: typeof chatMessages.$inferSelect): ChatMessage => ({
  id: m.id,
  // A deleted message keeps its place in the conversation but not its text.
  body: m.deletedAt ? "" : m.body,
  createdBy: m.createdBy,
  createdAt: m.createdAt.toISOString(),
  deleted: m.deletedAt !== null,
});

export async function listChannels({ includeArchived = false } = {}) {
  return db()
    .select()
    .from(chatChannels)
    .where(includeArchived ? undefined : eq(chatChannels.archived, false))
    .orderBy(asc(chatChannels.position), asc(chatChannels.name));
}

export async function getChannel(id: string) {
  if (!isUuid(id)) return null;
  const [row] = await db().select().from(chatChannels).where(eq(chatChannels.id, id));
  return row ?? null;
}

export async function saveChannel(id: string | undefined, c: z.infer<typeof channelSchema>) {
  const values = { name: c.name, description: c.description ?? null, position: c.position };
  if (id) await db().update(chatChannels).set(values).where(eq(chatChannels.id, id));
  else await db().insert(chatChannels).values(values);
}

export async function setArchived(id: string, archived: boolean) {
  await db().update(chatChannels).set({ archived }).where(eq(chatChannels.id, id));
}

/**
 * The latest page (no cursor), messages after a time (catching up after a
 * signal), or before a time (scrolling back). Always oldest first.
 */
export async function listMessages(channelId: string, { after, before }: { after?: Date; before?: Date } = {}) {
  if (after) {
    const rows = await db()
      .select()
      .from(chatMessages)
      .where(and(eq(chatMessages.channelId, channelId), gt(chatMessages.createdAt, after)))
      .orderBy(asc(chatMessages.createdAt))
      .limit(200);
    return rows.map(shape);
  }
  const rows = await db()
    .select()
    .from(chatMessages)
    .where(before ? and(eq(chatMessages.channelId, channelId), lt(chatMessages.createdAt, before)) : eq(chatMessages.channelId, channelId))
    .orderBy(desc(chatMessages.createdAt))
    .limit(PAGE);
  return rows.reverse().map(shape);
}

export async function addMessage(channelId: string, body: string, by: string): Promise<ChatMessage> {
  const [row] = await db().insert(chatMessages).values({ channelId, body, createdBy: by }).returning();
  return shape(row);
}

export async function getMessage(id: string) {
  if (!isUuid(id)) return null;
  const [row] = await db().select().from(chatMessages).where(eq(chatMessages.id, id));
  return row ?? null;
}

/** Text is blanked immediately; the row itself goes with the yearly retention sweep. */
export async function deleteMessage(id: string) {
  await db().update(chatMessages).set({ deletedAt: new Date(), body: "" }).where(eq(chatMessages.id, id));
}

/** Hard-deletes everything older than the retention period. Returns how many went. */
export async function purgeOld(): Promise<number> {
  const rows = await db()
    .delete(chatMessages)
    .where(lt(chatMessages.createdAt, sql`now() - make_interval(days => ${RETENTION_DAYS})`))
    .returning({ id: chatMessages.id });
  return rows.length;
}

let limiter: Ratelimit | null = null;
/** 30 messages a minute per person: plenty for conversation, a ceiling for scripts. */
export function sendLimiter(): Ratelimit {
  limiter ??= new Ratelimit({
    redis: redis(),
    limiter: Ratelimit.slidingWindow(30, "1 m"),
    prefix: "rl:chat",
    ephemeralCache: new Map(),
    analytics: false,
  });
  return limiter;
}
