// Tables for the admin workspace. Each phase adds its own; run
// `npm run db:generate` then `npm run db:migrate` after changing this file.
//
// Conventions: ids are generated UUIDs; people are referenced by their admin
// email (the admin list itself lives in Upstash); times are timestamptz.

import { boolean, date, index, integer, pgTable, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core";

/**
 * Who has read the internal workspace notice, and when (the DPDP notice to
 * committee members). Re-shown when the notice's version changes.
 */
export const noticeAcks = pgTable("notice_acks", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull(),
  version: text("version").notNull(),
  ackedAt: timestamp("acked_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Internal calendar entries: meetings, deadlines, set-up days. Never published;
 * public events live in content/site and reach the site through the editor.
 * Dates are calendar days ("YYYY-MM-DD"), times optional "HH:MM" in IST.
 */
export const calendarEvents = pgTable("calendar_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  date: date("date", { mode: "string" }).notNull(),
  endDate: date("end_date", { mode: "string" }),
  startTime: text("start_time"),
  endTime: text("end_time"),
  location: text("location"),
  notes: text("notes"),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ------------------------------------------------------------ announcements

export const announcements = pgTable("announcements", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  pinned: boolean("pinned").notNull().default(false),
  /** Hidden from the list (not deleted) after this moment. */
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * One "read up to" time per admin per feed. Anything newer is unread. A marker
 * rather than a row per item, so it stays one row however many items pile up.
 */
export const readMarkers = pgTable(
  "read_markers",
  {
    email: text("email").notNull(),
    scope: text("scope").notNull(),
    readAt: timestamp("read_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.email, t.scope] })]
);

// -------------------------------------------------------------------- forum

export const forumCategories = pgTable("forum_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const forumThreads = pgTable(
  "forum_threads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => forumCategories.id, { onDelete: "restrict" }),
    title: text("title").notNull(),
    createdBy: text("created_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    lastPostAt: timestamp("last_post_at", { withTimezone: true }).notNull().defaultNow(),
    replyCount: integer("reply_count").notNull().default(0),
    pinned: boolean("pinned").notNull().default(false),
    locked: boolean("locked").notNull().default(false),
    /** Soft delete: kept for the audit trail, hidden everywhere. */
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [index("forum_threads_category_idx").on(t.categoryId, t.lastPostAt)]
);

export const forumPosts = pgTable(
  "forum_posts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    threadId: uuid("thread_id")
      .notNull()
      .references(() => forumThreads.id, { onDelete: "restrict" }),
    body: text("body").notNull(),
    createdBy: text("created_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    editedAt: timestamp("edited_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    deletedBy: text("deleted_by"),
  },
  (t) => [index("forum_posts_thread_idx").on(t.threadId, t.createdAt)]
);

// --------------------------------------------------------------------- chat

export const chatChannels = pgTable("chat_channels", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  position: integer("position").notNull().default(0),
  archived: boolean("archived").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * The only copy of every message. Ably is told "something new in channel X"
 * and nothing else, so no message text or author ever passes through it.
 * Deleted after a year by the daily retention job (app/api/cron/chat-retention).
 */
export const chatMessages = pgTable(
  "chat_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    channelId: uuid("channel_id")
      .notNull()
      .references(() => chatChannels.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    createdBy: text("created_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [index("chat_messages_channel_idx").on(t.channelId, t.createdAt), index("chat_messages_created_idx").on(t.createdAt)]
);
