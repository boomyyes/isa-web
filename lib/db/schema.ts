// Tables for the admin workspace. Each phase adds its own; run
// `npm run db:generate` then `npm run db:migrate` after changing this file.
//
// Conventions: ids are generated UUIDs; people are referenced by their admin
// email (the admin list itself lives in Upstash); times are timestamptz.

import { bigint, boolean, date, index, integer, pgTable, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core";

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

// ------------------------------------------------------------------ finance
//
// Amounts are integer paise (₹1 = 100), never floats. Members' bank or UPI
// details are deliberately not stored: a payment records who was paid and how.

export const budgets = pgTable("budgets", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  allocatedPaise: bigint("allocated_paise", { mode: "number" }).notNull().default(0),
  archived: boolean("archived").notNull().default(false),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const bills = pgTable(
  "bills",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    budgetId: uuid("budget_id")
      .notNull()
      .references(() => budgets.id, { onDelete: "restrict" }),
    amountPaise: bigint("amount_paise", { mode: "number" }).notNull(),
    billDate: date("bill_date", { mode: "string" }).notNull(),
    vendor: text("vendor").notNull(),
    description: text("description").notNull(),
    /** submitted -> approved | rejected; approved -> paid */
    status: text("status").notNull().default("submitted"),
    submittedBy: text("submitted_by").notNull(),
    submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
    decidedBy: text("decided_by"),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
    rejectReason: text("reject_reason"),
    paidBy: text("paid_by"),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    paidTo: text("paid_to"),
    payMode: text("pay_mode"),
  },
  (t) => [index("bills_budget_idx").on(t.budgetId), index("bills_status_idx").on(t.status), index("bills_date_idx").on(t.billDate)]
);

export const billReceipts = pgTable("bill_receipts", {
  id: uuid("id").primaryKey().defaultRandom(),
  billId: uuid("bill_id")
    .notNull()
    .references(() => bills.id, { onDelete: "cascade" }),
  r2Key: text("r2_key").notNull(),
  mime: text("mime").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  uploadedBy: text("uploaded_by").notNull(),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Append-only. A database trigger (migration 0005) rejects every UPDATE and
 * every DELETE except an owner's financial-year purge. Mistakes are corrected
 * with a reversing entry: same kind, negated amount, pointing at the original.
 */
export const ledgerEntries = pgTable(
  "ledger_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    budgetId: uuid("budget_id")
      .notNull()
      .references(() => budgets.id, { onDelete: "restrict" }),
    kind: text("kind").notNull(), // "income" | "expense"
    amountPaise: bigint("amount_paise", { mode: "number" }).notNull(),
    entryDate: date("entry_date", { mode: "string" }).notNull(),
    description: text("description").notNull(),
    billId: uuid("bill_id").references(() => bills.id, { onDelete: "set null" }),
    reversesId: uuid("reverses_id").unique(),
    createdBy: text("created_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("ledger_budget_idx").on(t.budgetId, t.entryDate), index("ledger_date_idx").on(t.entryDate)]
);
