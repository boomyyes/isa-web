// Tables for the admin workspace. Each phase adds its own; run
// `npm run db:generate` then `npm run db:migrate` after changing this file.
//
// Conventions: ids are generated UUIDs; people are referenced by their admin
// email (the admin list itself lives in Upstash); times are timestamptz.

import { date, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

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
