// POST { sha, data, summary? } -> validates and commits one content file.
// Holders of the `content` capability (and owners).

import { sessionFrom } from "@/lib/admin/session";
import { audit, hasCap } from "@/lib/admin/store";
import { collectionByName, collectionSchema, tidy } from "@/lib/content/collections";
import { ConflictError, toJsonText, writeFile } from "@/lib/content/github";
import { sameOrigin } from "@/lib/security";

export const runtime = "nodejs";

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request, { params }: { params: Promise<{ name: string }> }) {
  if (!sameOrigin(request)) return json({ error: "Forbidden." }, 403);
  const session = await sessionFrom(request);
  if (!session) return json({ error: "Your session has ended. Sign in again." }, 401);
  if (!hasCap(session, "content")) return json({ error: "You don't have permission to publish." }, 403);

  const { name } = await params;
  const collection = collectionByName(name);
  if (!collection) return json({ error: "Unknown collection." }, 404);

  let body: { sha?: unknown; data?: unknown; summary?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return json({ error: "Invalid request." }, 400);
  }
  if (typeof body.sha !== "string" || !/^[0-9a-f]{40}$/.test(body.sha)) {
    return json({ error: "Missing file version. Reload the editor." }, 400);
  }

  const data = tidy(body.data);
  const result = collectionSchema(collection).safeParse(data);
  if (!result.success) {
    return json(
      {
        error: "Some fields need fixing.",
        issues: result.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
      },
      400
    );
  }

  const summary =
    typeof body.summary === "string" && body.summary.trim()
      ? body.summary.trim().replace(/\s+/g, " ").slice(0, 100)
      : "update";

  try {
    const commit = await writeFile(
      collection.file,
      toJsonText(result.data),
      `content(${collection.name}): ${summary} — via admin`,
      body.sha
    );
    await audit(session.email, `published ${collection.label}: ${summary}`, commit.commitSha.slice(0, 7));
    return json({ ok: true, ...commit });
  } catch (error) {
    if (error instanceof ConflictError) return json({ error: error.message, conflict: true }, 409);
    return json({ error: "Publishing failed. Nothing was changed. Try again shortly." }, 502);
  }
}
