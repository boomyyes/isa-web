// POST { action: "start", size } -> { version, url }: a presigned URL the
//   browser PUTs the issue PDF to, straight into the private R2 bucket. A whole
//   magazine is far too big to pass through this function.
// POST { action: "publish", version } -> checks the uploaded file really is a
//   PDF the site can open, then commits content/site/isaac-issue.json so the
//   redeploy serves it. The issue before last is deleted from R2; the last one
//   is kept until the next upload, since the live site serves it until the
//   redeploy finishes.
// Holders of the `content` capability.

import { randomBytes } from "node:crypto";
import { sessionFrom } from "@/lib/admin/session";
import { audit, hasCap } from "@/lib/admin/store";
import { ConflictError, readFile, toJsonText, writeFile } from "@/lib/content/github";
import { ISAAC_MAX_UPLOAD_BYTES as MAX_ISSUE_BYTES, ISAAC_MAX_UPLOAD_MB, type IsaacIssue } from "@/lib/isaac";
import { pdfPageCount, R2_PREFIX } from "@/lib/isaac.pdf";
import { deleteObject, headObject, presignPut } from "@/lib/r2";
import { sameOrigin } from "@/lib/security";

export const runtime = "nodejs";
// Checking the upload means downloading and parsing the whole PDF.
export const maxDuration = 60;

const FILE = "content/site/isaac-issue.json";
const VERSION = /^\d{8}-\d{6}-[0-9a-f]{6}$/;
const keyFor = (version: string) => `admin/isaac/${version}.pdf`;

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

/** e.g. 20261008-124501-a1b2c3: sortable, and a new cache key for every upload. */
function newVersion(): string {
  const now = new Date().toISOString().replace(/[-:]/g, "").replace("T", "-").slice(0, 15);
  return `${now}-${randomBytes(3).toString("hex")}`;
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return json({ error: "Forbidden." }, 403);
  const session = await sessionFrom(request);
  if (!session) return json({ error: "Your session has ended. Sign in again." }, 401);
  if (!hasCap(session, "content")) return json({ error: "You don't have permission to publish." }, 403);

  let body: { action?: unknown; size?: unknown; version?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return json({ error: "Invalid request." }, 400);
  }

  if (body.action === "start") {
    const size = Number(body.size);
    if (!Number.isFinite(size) || size <= 0) return json({ error: "Choose a PDF file." }, 400);
    if (size > MAX_ISSUE_BYTES) return json({ error: `The PDF is over ${ISAAC_MAX_UPLOAD_MB} MB. Export it smaller and try again.` }, 400);
    const version = newVersion();
    try {
      return json({ version, url: await presignPut(keyFor(version), 15 * 60) });
    } catch {
      return json({ error: "Storage isn't set up on this deployment." }, 503);
    }
  }

  if (body.action !== "publish") return json({ error: "Invalid request." }, 400);
  const version = typeof body.version === "string" && VERSION.test(body.version) ? body.version : null;
  if (!version) return json({ error: "Invalid request." }, 400);
  const key = keyFor(version);

  // Verify before anything points at the file. A rejected upload is removed.
  const reject = async (error: string) => {
    await deleteObject(key).catch(() => undefined);
    return json({ error }, 400);
  };
  const head = await headObject(key).catch(() => null);
  if (!head) return json({ error: "The upload didn't reach storage. Try again." }, 400);
  if (head.size > MAX_ISSUE_BYTES) return reject(`The PDF is over ${ISAAC_MAX_UPLOAD_MB} MB.`);
  const pages = await pdfPageCount(`${R2_PREFIX}${key}`);
  if (pages === 0) {
    return reject("The server couldn't open that PDF. If it has a password, upload a copy without one (it's stored privately either way). Otherwise ask whoever looks after the website to check the server logs.");
  }

  try {
    const current = await readFile(FILE);
    const before = JSON.parse(current.text) as IsaacIssue;
    const next: IsaacIssue = {
      version,
      pdf: key,
      previous: before.pdf,
      uploadedAt: new Date().toISOString(),
      pages,
    };
    const commit = await writeFile(FILE, toJsonText(next), `content(isaac): publish a new issue (${pages} pages) — via admin`, current.sha);
    await audit(session.email, `published a new ISAAC issue (${pages} pages)`, commit.commitSha.slice(0, 7));
    // The issue before last: nothing serves it any more.
    if (before.previous && before.previous !== key) await deleteObject(before.previous).catch(() => undefined);
    return json({ ok: true, pages, ...commit });
  } catch (error) {
    if (error instanceof ConflictError) {
      return reject("Someone else published an issue at the same time. Reload and upload again.");
    }
    return json({ error: "Publishing failed. The site still shows the current issue. Try again shortly." }, 502);
  }
}
