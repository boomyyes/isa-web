// POST { id, upcomingSha, eventsSha, details } -> moves one upcoming event into
// past events, in a single commit, with the details only a held event has
// (real date, type, venue, tenure, and optionally a photo and recap).

import { sessionFrom } from "@/lib/admin/session";
import { audit, hasCap } from "@/lib/admin/store";
import { collectionByName, collectionSchema, tidy } from "@/lib/content/collections";
import { ConflictError, readFile, toJsonText, writeFiles } from "@/lib/content/github";
import { sameOrigin } from "@/lib/security";

export const runtime = "nodejs";

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

const SHA = /^[0-9a-f]{40}$/;
type Item = Record<string, unknown> & { id: string };

/** "evt-up-plc" -> "evt-plc", made unique against the archive. */
function archiveId(upcomingId: string, taken: Set<string>): string {
  const base = upcomingId.replace(/^evt-up-/, "evt-");
  let id = base;
  for (let n = 2; taken.has(id); n++) id = `${base}-${n}`;
  return id;
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return json({ error: "Forbidden." }, 403);
  const session = await sessionFrom(request);
  if (!session) return json({ error: "Your session has ended. Sign in again." }, 401);
  if (!hasCap(session, "content")) return json({ error: "You don't have permission to publish." }, 403);

  let body: { id?: unknown; upcomingSha?: unknown; eventsSha?: unknown; details?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return json({ error: "Invalid request." }, 400);
  }
  if (typeof body.id !== "string" || typeof body.upcomingSha !== "string" || typeof body.eventsSha !== "string" || !SHA.test(body.upcomingSha) || !SHA.test(body.eventsSha)) {
    return json({ error: "Missing event or file version. Reload the page." }, 400);
  }

  const upcomingCol = collectionByName("upcoming-events")!;
  const eventsCol = collectionByName("events")!;

  try {
    const [upcomingFile, eventsFile, tenuresFile] = await Promise.all([
      readFile(upcomingCol.file),
      readFile(eventsCol.file),
      readFile("content/site/tenures.json"),
    ]);
    if (upcomingFile.sha !== body.upcomingSha || eventsFile.sha !== body.eventsSha) {
      return json({ error: "The events were changed by someone else. Reload the page and try again.", conflict: true }, 409);
    }

    const upcoming = JSON.parse(upcomingFile.text) as Item[];
    const events = JSON.parse(eventsFile.text) as Item[];
    const source = upcoming.find((e) => e.id === body.id);
    if (!source) return json({ error: "That upcoming event no longer exists. Reload the page." }, 404);

    const details = (body.details ?? {}) as Record<string, unknown>;
    const moved = tidy({
      id: archiveId(source.id, new Set(events.map((e) => e.id))),
      title: source.title,
      date: details.date,
      type: details.type,
      venue: details.venue,
      tenure: details.tenure,
      image: details.image,
      description: details.description,
    }) as Item;

    const tenures = new Set((JSON.parse(tenuresFile.text) as { id: string }[]).map((t) => t.id));
    if (typeof moved.tenure === "string" && !tenures.has(moved.tenure)) {
      return json({ error: "Choose a tenure from the list.", issues: [{ path: "tenure", message: "Unknown tenure." }] }, 400);
    }

    // Newest first, matching how the archive is kept by hand.
    const nextEvents = [moved, ...events];
    const nextUpcoming = upcoming.filter((e) => e.id !== source.id);

    const check = collectionSchema(eventsCol).safeParse(nextEvents);
    if (!check.success) {
      const issues = check.error.issues
        .filter((i) => i.path[0] === 0)
        .map((i) => ({ path: i.path.slice(1).join("."), message: i.message }));
      return json({ error: "Some details need fixing.", issues }, 400);
    }

    const commit = await writeFiles(
      [
        { path: eventsCol.file, text: toJsonText(nextEvents) },
        { path: upcomingCol.file, text: toJsonText(nextUpcoming) },
      ],
      `content(events): move "${String(source.title).slice(0, 60)}" to past events — via admin`,
      [
        { path: upcomingCol.file, sha: upcomingFile.sha },
        { path: eventsCol.file, sha: eventsFile.sha },
      ]
    );
    await audit(session.email, `moved "${String(source.title)}" to past events`, commit.commitSha.slice(0, 7));
    return json({ ok: true, commitUrl: commit.commitUrl, id: moved.id });
  } catch (error) {
    if (error instanceof ConflictError) return json({ error: error.message, conflict: true }, 409);
    return json({ error: "Moving failed. Nothing was changed. Try again shortly." }, 502);
  }
}
