// Calendar items from the public content files, and the iCalendar (RFC 5545)
// feed built from them. Internal events come from the database and are merged
// in by the admin calendar only — they never reach the feed.

import eventsJson from "@/content/site/events.json";
import upcomingJson from "@/content/site/upcoming-events.json";
import { SITE_ORIGIN } from "@/lib/seo";

export type CalendarItem = {
  id: string;
  title: string;
  /** "YYYY-MM-DD" */
  date: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  notes?: string;
  href?: string;
  kind: "upcoming" | "past" | "internal";
};

const ISO = /^\d{4}-\d{2}-\d{2}$/;

/** Upcoming events appear only once they have a real start date; "Mid-October" can't go on a calendar. */
export function publicItems(): CalendarItem[] {
  const upcoming = (upcomingJson as { id: string; title: string; when: string; start?: string; href?: string }[])
    .filter((e) => e.start && ISO.test(e.start))
    .map((e) => ({ id: e.id, title: e.title, date: e.start!, notes: e.when, href: e.href, kind: "upcoming" as const }));
  const past = (eventsJson as { id: string; title: string; date: string; venue?: string; type?: string }[])
    .filter((e) => ISO.test(e.date))
    .map((e) => ({ id: e.id, title: e.title, date: e.date, location: e.venue, notes: e.type, kind: "past" as const }));
  return [...upcoming, ...past];
}

// ------------------------------------------------------------------ iCalendar

/** TEXT values escape backslash, semicolon, comma and newlines (RFC 5545 §3.3.11). */
const escapeText = (value: string) =>
  value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

/** Lines longer than 75 octets are folded with CRLF + space, never splitting a UTF-8 character. */
function fold(line: string): string {
  const out: string[] = [];
  let current = "";
  let bytes = 0;
  for (const ch of line) {
    const size = Buffer.byteLength(ch);
    const limit = out.length === 0 ? 75 : 74; // continuation lines start with a space
    if (bytes + size > limit) {
      out.push(current);
      current = "";
      bytes = 0;
    }
    current += ch;
    bytes += size;
  }
  out.push(current);
  return out.join("\r\n ");
}

const compact = (iso: string) => iso.replaceAll("-", "");

function nextDay(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

export function buildIcs(items: CalendarItem[], stamp = new Date()): string {
  const dtstamp = stamp.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ISA RAIT Student Chapter//Events//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:ISA RAIT Events",
    "X-WR-TIMEZONE:Asia/Kolkata",
    "REFRESH-INTERVAL;VALUE=DURATION:PT12H",
    "X-PUBLISHED-TTL:PT12H",
  ];
  for (const item of items) {
    // All-day events: DTEND is exclusive, so a one-day event ends the next day.
    const end = nextDay(item.endDate && item.endDate >= item.date ? item.endDate : item.date);
    lines.push(
      "BEGIN:VEVENT",
      `UID:${item.id}@isarait.in`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART;VALUE=DATE:${compact(item.date)}`,
      `DTEND;VALUE=DATE:${compact(end)}`,
      `SUMMARY:${escapeText(item.title)}`,
      ...(item.location ? [`LOCATION:${escapeText(item.location)}`] : []),
      ...(item.notes ? [`DESCRIPTION:${escapeText(item.notes)}`] : []),
      `URL:${SITE_ORIGIN}${item.href ?? "/initiatives"}`,
      "TRANSP:TRANSPARENT",
      "END:VEVENT"
    );
  }
  lines.push("END:VCALENDAR");
  return lines.map(fold).join("\r\n") + "\r\n";
}
