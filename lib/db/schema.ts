// Tables for the admin workspace. Each phase adds its own; run
// `npm run db:generate` then `npm run db:migrate` after changing this file.
//
// Conventions: ids are generated UUIDs; people are referenced by their admin
// email (the admin list itself lives in Upstash); times are timestamptz.

import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

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
