import { TENURES, type EventItem, type TenureId } from "./data";

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
 * Bucket finished events into their committee tenures, in TENURES order (newest
 * first), each section sorted newest first. Grouping is by each event's `tenure`
 * field rather than by its date, so an event never migrates between sections as
 * the clock moves — the Feb 2026 Tarapur visit stays under 2025-26 even though
 * it is calendar-2026.
 *
 * Sorting here rather than relying on the order in data.ts means appending an
 * event to the end of that array still lands it in the right place. ISO date
 * strings sort lexicographically, so string compare is enough.
 *
 * Every tenure is returned, including ones with nothing in them yet, so the
 * current tenure's section is visible (with an empty state) from day one.
 */
export function groupFinishedByTenure(
  finished: EventItem[]
): { id: TenureId; label: string; events: EventItem[] }[] {
  return TENURES.map((tenure) => ({
    ...tenure,
    events: finished
      .filter((event) => event.tenure === tenure.id)
      .sort((a, b) => b.date.localeCompare(a.date)),
  }));
}
