// Publishing a new ISAAC issue, in four steps driven by the admin page:
//
//   start   { size }            -> { version, url }: a presigned URL the browser
//           PUTs the PDF to, straight into the private R2 bucket. A whole
//           magazine is far too big to pass through this function.
//   check   { version }         -> { pages }: the upload really is a PDF the
//           site can open. A file that fails is deleted.
//   render  { version, from }   -> { next, pages }: draws a batch of pages to
//           JPEGs in R2. Batched so no single request nears the time limit;
//           the page repeats it until next === pages.
//   publish { version, pages }  -> commits content/site/isaac-issue.json so the
//           redeploy serves it. Readers then get the stored images and the PDF
//           is never opened while reading, which is what made the reader slow.
//
// The issue before last is deleted from R2 on publish; the last one is kept
// until the next upload, since the live site serves it until the redeploy
// finishes. Holders of the `content` capability.

import { randomBytes } from "node:crypto";
import { sessionFrom } from "@/lib/admin/session";
import { audit, hasCap } from "@/lib/admin/store";
import { ConflictError, readFile, toJsonText, writeFile } from "@/lib/content/github";
import { ISAAC_MAX_UPLOAD_BYTES as MAX_ISSUE_BYTES, ISAAC_MAX_UPLOAD_MB, type IsaacIssue } from "@/lib/isaac";
import { pdfPageCount, R2_PREFIX, renderPdfPage } from "@/lib/isaac.pdf";
import { issuePageKey, issuePagePrefix, issuePdfKey } from "@/lib/isaac.server";
import { deleteObject, headObject, listKeys, presignPut, putObject } from "@/lib/r2";
import { sameOrigin } from "@/lib/security";

export const runtime = "nodejs";
// A cold check or render batch downloads and parses the whole PDF first.
export const maxDuration = 60;

const FILE = "content/site/isaac-issue.json";
const VERSION = /^\d{8}-\d{6}-[0-9a-f]{6}$/;
/** Pages drawn per render request: well inside the time limit even when cold. */
const BATCH = 6;
const MAX_PAGES = 500;

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

/** e.g. 20261008-124501-a1b2c3: sortable, and a new cache key for every upload. */
function newVersion(): string {
  const now = new Date().toISOString().replace(/[-:]/g, "").replace("T", "-").slice(0, 15);
  return `${now}-${randomBytes(3).toString("hex")}`;
}

/** Removes an issue's PDF and every page drawn from it. Best effort. */
async function removeIssue(version: string) {
  await deleteObject(issuePdfKey(version)).catch(() => undefined);
  const pages = await listKeys(issuePagePrefix(version)).catch(() => [] as string[]);
  await Promise.all(pages.map((k) => deleteObject(k).catch(() => undefined)));
}

const versionOfKey = (key: string) => key.match(/admin\/isaac\/([^/]+)\.pdf$/)?.[1] ?? null;

export async function POST(request: Request) {
  if (!sameOrigin(request)) return json({ error: "Forbidden." }, 403);
  const session = await sessionFrom(request);
  if (!session) return json({ error: "Your session has ended. Sign in again." }, 401);
  if (!hasCap(session, "content")) return json({ error: "You don't have permission to publish." }, 403);

  let body: { action?: unknown; size?: unknown; version?: unknown; from?: unknown; pages?: unknown };
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
      return json({ version, url: await presignPut(issuePdfKey(version), 15 * 60) });
    } catch {
      return json({ error: "Storage isn't set up on this deployment." }, 503);
    }
  }

  const version = typeof body.version === "string" && VERSION.test(body.version) ? body.version : null;
  if (!version) return json({ error: "Invalid request." }, 400);
  const pdf = issuePdfKey(version);
  const source = `${R2_PREFIX}${pdf}`;

  /** Rejects the upload and removes everything stored for it. */
  const reject = async (error: string) => {
    await removeIssue(version);
    return json({ error }, 400);
  };

  if (body.action === "check") {
    const head = await headObject(pdf).catch(() => null);
    if (!head) return json({ error: "The upload didn't reach storage. Try again." }, 400);
    if (head.size > MAX_ISSUE_BYTES) return reject(`The PDF is over ${ISAAC_MAX_UPLOAD_MB} MB.`);
    const pages = await pdfPageCount(source);
    if (pages === 0) {
      return reject("The server couldn't open that PDF. If it has a password, upload a copy without one (it's stored privately either way). Otherwise ask whoever looks after the website to check the server logs.");
    }
    if (pages > MAX_PAGES) return reject(`The PDF has ${pages} pages; the reader takes at most ${MAX_PAGES}.`);
    return json({ pages });
  }

  if (body.action === "render") {
    const from = Number(body.from);
    const pages = await pdfPageCount(source);
    if (pages === 0) return json({ error: "The server couldn't open that PDF. Try again." }, 502);
    if (!Number.isInteger(from) || from < 0 || from >= pages) return json({ error: "Invalid request." }, 400);
    const end = Math.min(pages, from + BATCH);
    for (let index = from; index < end; index++) {
      const page = await renderPdfPage(source, index);
      if (!page) return json({ error: `Page ${index + 1} couldn't be drawn. Try again.` }, 502);
      await putObject(issuePageKey(version, index), new Uint8Array(page.body), "image/jpeg");
    }
    return json({ next: end, pages });
  }

  if (body.action !== "publish") return json({ error: "Invalid request." }, 400);

  // Every page must have been drawn before anything points at this issue.
  const pages = Number(body.pages);
  if (!Number.isInteger(pages) || pages < 1 || pages > MAX_PAGES) return json({ error: "Invalid request." }, 400);
  const drawn = new Set(await listKeys(issuePagePrefix(version)).catch(() => [] as string[]));
  for (let index = 0; index < pages; index++) {
    if (!drawn.has(issuePageKey(version, index))) {
      return json({ error: "Some pages weren't prepared. Upload the issue again." }, 400);
    }
  }

  try {
    const current = await readFile(FILE);
    const before = JSON.parse(current.text) as IsaacIssue;
    const next: IsaacIssue = {
      version,
      pdf,
      previous: before.pdf,
      uploadedAt: new Date().toISOString(),
      pages,
      images: true,
    };
    const commit = await writeFile(FILE, toJsonText(next), `content(isaac): publish a new issue (${pages} pages) — via admin`, current.sha);
    await audit(session.email, `published a new ISAAC issue (${pages} pages)`, commit.commitSha.slice(0, 7));
    // The issue before last: nothing serves it any more.
    const stale = before.previous ? versionOfKey(before.previous) : null;
    if (stale && stale !== version) await removeIssue(stale);
    return json({ ok: true, pages, ...commit });
  } catch (error) {
    if (error instanceof ConflictError) {
      return reject("Someone else published an issue at the same time. Reload and upload again.");
    }
    return json({ error: "Publishing failed. The site still shows the current issue. Try again shortly." }, 502);
  }
}
