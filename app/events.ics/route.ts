// The public events feed. Subscribe from Google Calendar (Other calendars →
// From URL) or Apple Calendar with https://www.isarait.in/events.ics.
//
// Built at deploy time from content/site, so it changes exactly when the site
// does. Internal admin events are never included.

import { buildIcs, publicItems } from "@/lib/calendar";

export const dynamic = "force-static";

export function GET() {
  return new Response(buildIcs(publicItems()), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="isa-rait-events.ics"',
    },
  });
}
