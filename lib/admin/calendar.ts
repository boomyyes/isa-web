// Internal calendar events (Postgres). Public events are read from content.

import "server-only";
import { and, asc, eq, gte, lte, or } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { calendarEvents } from "@/lib/db/schema";
import { publicItems, type CalendarItem } from "@/lib/calendar";

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const blank = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);

export const internalEventSchema = z
  .object({
    title: z.string("Title is required.").trim().min(1, "Title is required.").max(150),
    date: z.string("Date is required.").regex(DATE, "Date is required."),
    endDate: z.preprocess(blank, z.string().regex(DATE).optional()),
    startTime: z.preprocess(blank, z.string().regex(TIME, "Use a time like 14:30.").optional()),
    endTime: z.preprocess(blank, z.string().regex(TIME, "Use a time like 16:00.").optional()),
    location: z.preprocess(blank, z.string().trim().max(150).optional()),
    notes: z.preprocess(blank, z.string().trim().max(2000).optional()),
  })
  .refine((e) => !e.endDate || e.endDate >= e.date, { path: ["endDate"], message: "Ends before it starts." })
  .refine((e) => !(e.startTime && e.endTime && !e.endDate) || e.endTime > e.startTime, {
    path: ["endTime"],
    message: "Ends before it starts.",
  });

export type InternalEventInput = z.infer<typeof internalEventSchema>;

const toItem = (row: typeof calendarEvents.$inferSelect): CalendarItem => ({
  id: row.id,
  title: row.title,
  date: row.date,
  endDate: row.endDate ?? undefined,
  startTime: row.startTime ?? undefined,
  endTime: row.endTime ?? undefined,
  location: row.location ?? undefined,
  notes: row.notes ?? undefined,
  kind: "internal",
});

/** Every item touching [from, to], public and internal, sorted by day then time. */
export async function itemsBetween(from: string, to: string): Promise<CalendarItem[]> {
  const rows = await db()
    .select()
    .from(calendarEvents)
    .where(
      or(
        and(gte(calendarEvents.date, from), lte(calendarEvents.date, to)),
        // Multi-day events that started before the window but run into it.
        and(lte(calendarEvents.date, to), gte(calendarEvents.endDate, from))
      )
    )
    .orderBy(asc(calendarEvents.date));

  const pub = publicItems().filter((i) => i.date >= from && i.date <= to);
  return [...rows.map(toItem), ...pub].sort(
    (a, b) => a.date.localeCompare(b.date) || (a.startTime ?? "").localeCompare(b.startTime ?? "")
  );
}

export async function getInternal(id: string) {
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  const [row] = await db().select().from(calendarEvents).where(eq(calendarEvents.id, id));
  return row ?? null;
}

const toRow = (e: InternalEventInput) => ({
  title: e.title,
  date: e.date,
  endDate: e.endDate ?? null,
  startTime: e.startTime ?? null,
  endTime: e.endTime ?? null,
  location: e.location ?? null,
  notes: e.notes ?? null,
});

export async function createInternal(e: InternalEventInput, by: string) {
  const [row] = await db().insert(calendarEvents).values({ ...toRow(e), createdBy: by }).returning({ id: calendarEvents.id });
  return row.id;
}

export async function updateInternal(id: string, e: InternalEventInput) {
  const rows = await db()
    .update(calendarEvents)
    .set({ ...toRow(e), updatedAt: new Date() })
    .where(eq(calendarEvents.id, id))
    .returning({ id: calendarEvents.id });
  return rows.length > 0;
}

export async function deleteInternal(id: string) {
  const rows = await db().delete(calendarEvents).where(eq(calendarEvents.id, id)).returning({ id: calendarEvents.id });
  return rows.length > 0;
}
