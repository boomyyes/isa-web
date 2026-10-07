import "server-only";
import { randomUUID } from "node:crypto";
import { and, asc, desc, eq, ilike, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { forumCategories, forumPosts, forumThreads } from "@/lib/db/schema";

/** Authors may edit their own post for this long; moderators can always delete. */
export const EDIT_WINDOW_MS = 15 * 60 * 1000;
export const THREADS_PER_PAGE = 30;
export const POSTS_PER_PAGE = 50;

const UUID = /^[0-9a-f-]{36}$/;
export const isUuid = (v: unknown): v is string => typeof v === "string" && UUID.test(v);

export const categorySchema = z.object({
  name: z.string("Name is required.").trim().min(1, "Name is required.").max(80),
  description: z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? undefined : v), z.string().trim().max(300).optional()),
  position: z.coerce.number().int().min(0).max(999).default(0),
});
export const threadSchema = z.object({
  title: z.string("Title is required.").trim().min(1, "Title is required.").max(150),
  body: z.string("Write something.").trim().min(1, "Write something.").max(10000),
});
export const postSchema = z.object({
  body: z.string("Write something.").trim().min(1, "Write something.").max(10000),
});

// ----------------------------------------------------------------- categories

export async function listCategories() {
  const live = and(isNull(forumThreads.deletedAt), eq(forumThreads.categoryId, forumCategories.id));
  return db()
    .select({
      id: forumCategories.id,
      name: forumCategories.name,
      description: forumCategories.description,
      position: forumCategories.position,
      threads: sql<number>`(select count(*)::int from ${forumThreads} where ${live})`,
      lastPostAt: sql<string | null>`(select max(${forumThreads.lastPostAt}) from ${forumThreads} where ${live})`,
    })
    .from(forumCategories)
    .orderBy(asc(forumCategories.position), asc(forumCategories.name));
}

export async function getCategory(id: string) {
  if (!isUuid(id)) return null;
  const [row] = await db().select().from(forumCategories).where(eq(forumCategories.id, id));
  return row ?? null;
}

export async function createCategory(c: z.infer<typeof categorySchema>) {
  await db().insert(forumCategories).values({ name: c.name, description: c.description ?? null, position: c.position });
}

export async function updateCategory(id: string, c: z.infer<typeof categorySchema>) {
  await db()
    .update(forumCategories)
    .set({ name: c.name, description: c.description ?? null, position: c.position })
    .where(eq(forumCategories.id, id));
}

/** Only empty categories can go; threads are never lost by deleting a heading. */
export async function deleteCategory(id: string): Promise<"deleted" | "not-empty"> {
  const [{ n }] = await db()
    .select({ n: sql<number>`count(*)::int` })
    .from(forumThreads)
    .where(eq(forumThreads.categoryId, id));
  if (n > 0) return "not-empty";
  await db().delete(forumCategories).where(eq(forumCategories.id, id));
  return "deleted";
}

// -------------------------------------------------------------------- threads

/** `q` matches titles, case-insensitively; % and _ are treated literally. */
export async function listThreads(categoryId: string, { page = 1, q }: { page?: number; q?: string }) {
  const filters = [eq(forumThreads.categoryId, categoryId), isNull(forumThreads.deletedAt)];
  const term = q?.trim();
  if (term) filters.push(ilike(forumThreads.title, `%${term.replace(/[\\%_]/g, (c) => `\\${c}`)}%`));
  const where = and(...filters);
  const [rows, [{ total }]] = await Promise.all([
    db()
      .select()
      .from(forumThreads)
      .where(where)
      .orderBy(desc(forumThreads.pinned), desc(forumThreads.lastPostAt))
      .limit(THREADS_PER_PAGE)
      .offset((page - 1) * THREADS_PER_PAGE),
    db().select({ total: sql<number>`count(*)::int` }).from(forumThreads).where(where),
  ]);
  return { rows, total };
}

export async function getThread(id: string) {
  if (!isUuid(id)) return null;
  const [row] = await db()
    .select()
    .from(forumThreads)
    .where(and(eq(forumThreads.id, id), isNull(forumThreads.deletedAt)));
  return row ?? null;
}

/**
 * The thread and its opening post in one batch, which Neon runs as a single
 * transaction, so a thread can never exist without its post. The id is made
 * here because the second statement needs it before the first has run.
 */
export async function createThread(categoryId: string, t: z.infer<typeof threadSchema>, by: string): Promise<string> {
  const id = randomUUID();
  await db().batch([
    db().insert(forumThreads).values({ id, categoryId, title: t.title, createdBy: by }),
    db().insert(forumPosts).values({ threadId: id, body: t.body, createdBy: by }),
  ]);
  return id;
}

export async function setThreadFlag(id: string, flag: "pinned" | "locked", value: boolean) {
  await db().update(forumThreads).set({ [flag]: value }).where(eq(forumThreads.id, id));
}

export async function deleteThread(id: string) {
  await db().update(forumThreads).set({ deletedAt: new Date() }).where(eq(forumThreads.id, id));
}

// ---------------------------------------------------------------------- posts

export async function listPosts(threadId: string, page = 1) {
  const [rows, [{ total }]] = await Promise.all([
    db()
      .select()
      .from(forumPosts)
      .where(eq(forumPosts.threadId, threadId))
      .orderBy(asc(forumPosts.createdAt))
      .limit(POSTS_PER_PAGE)
      .offset((page - 1) * POSTS_PER_PAGE),
    db().select({ total: sql<number>`count(*)::int` }).from(forumPosts).where(eq(forumPosts.threadId, threadId)),
  ]);
  return { rows, total };
}

export async function getPost(id: string) {
  if (!isUuid(id)) return null;
  const [row] = await db().select().from(forumPosts).where(eq(forumPosts.id, id));
  return row ?? null;
}

/** The post and the thread's counters together, so the reply count can't drift. */
export async function reply(threadId: string, body: string, by: string) {
  await db().batch([
    db().insert(forumPosts).values({ threadId, body, createdBy: by }),
    db()
      .update(forumThreads)
      .set({ lastPostAt: new Date(), replyCount: sql`${forumThreads.replyCount} + 1` })
      .where(eq(forumThreads.id, threadId)),
  ]);
}

export async function editPost(id: string, body: string) {
  await db().update(forumPosts).set({ body, editedAt: new Date() }).where(eq(forumPosts.id, id));
}

/** Soft delete: the text is blanked (it may be the reason for deleting) but the row and who removed it stay. */
export async function deletePost(id: string, by: string) {
  await db().update(forumPosts).set({ body: "", deletedAt: new Date(), deletedBy: by }).where(eq(forumPosts.id, id));
}

export const canEdit = (post: { createdBy: string; createdAt: Date; deletedAt: Date | null }, email: string) =>
  !post.deletedAt && post.createdBy === email && Date.now() - post.createdAt.getTime() < EDIT_WINDOW_MS;

/** Whole minutes left in the author's edit window (0 once it has closed). */
export const editMinutesLeft = (post: { createdAt: Date }) =>
  Math.max(0, Math.ceil((EDIT_WINDOW_MS - (Date.now() - post.createdAt.getTime())) / 60000));
