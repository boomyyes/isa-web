import type { EventItem } from "./data";

/**
 * Render an ISO date ("YYYY-MM-DD") as a human label, e.g. "Aug 12, 2026".
 * Parsed at local midnight so the day never drifts across time zones.
 */
export function formatEventDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * An event is "finished" once its whole day has passed — i.e. from the next day
 * onward. On the event's own day it still counts as upcoming.
 */
export function isFinished(event: EventItem, now: Date): boolean {
  return new Date(`${event.date}T23:59:59`).getTime() < now.getTime();
}

/**
 * Split events into upcoming vs finished relative to `now`.
 *   - upcoming: soonest first (ascending date)
 *   - finished: most recent first (descending date)
 * ISO date strings sort lexicographically, so string compare is enough.
 */
export function partitionEvents(events: EventItem[], now: Date) {
  const upcoming: EventItem[] = [];
  const finished: EventItem[] = [];

  for (const event of events) {
    (isFinished(event, now) ? finished : upcoming).push(event);
  }

  upcoming.sort((a, b) => a.date.localeCompare(b.date));
  finished.sort((a, b) => b.date.localeCompare(a.date));

  return { upcoming, finished };
}
