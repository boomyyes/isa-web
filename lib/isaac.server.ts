// Resolves where the ISAAC magazine's pages come from, and hands back one page
// as image bytes.
//
// This module is the *only* place the Drive IDs exist, and it must never be
// imported from a client component. Those IDs are the whole protection: the
// files are shared "anyone with the link", so the link is the password, and
// keeping it server-side is what stops the issue being copied off Drive. The
// browser only ever sees /api/isaac-page/<n>.
//
// Two kinds of source, checked in this order:
//
//   1. ISAAC_MAGAZINE_FILE_ID — one PDF, the whole issue. The server renders
//      the page that was asked for and sends a JPEG; the PDF itself never
//      leaves the server. This is the normal case.
//   2. ISAAC_PAGE_FILE_IDS, or ISAAC_PAGES_FOLDER_ID + GOOGLE_DRIVE_API_KEY —
//      one Drive image per page, listed explicitly or read out of a folder by
//      filename. Useful if the issue is ever exported to images instead.
//
// With neither set the magazine falls back to the single cover file, so the
// reader still opens with something in it rather than erroring.

import { ISAAC_COVER_VERSION } from "./isaac";
import { pdfPageCount, renderPdfPage } from "./isaac.pdf";

/** How long a folder listing is reused before Drive is asked again. */
const LISTING_TTL_SECONDS = 3600;

export type IsaacSource =
  | { kind: "pdf"; fileId: string }
  | { kind: "images"; ids: string[] };

function configured(value: string | undefined, placeholder: string): string | null {
  const trimmed = value?.trim();
  return trimmed && trimmed !== placeholder ? trimmed : null;
}

/**
 * Filenames sort as humans expect: page2 before page10. Drive's own
 * `orderBy=name_natural` already does this, but the explicit-list path and any
 * change to Drive's ordering both land here, so the guarantee lives in one
 * place.
 */
function naturalCompare(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

function fromExplicitList(): string[] {
  const raw = process.env.ISAAC_PAGE_FILE_IDS;
  if (!raw) return [];

  return raw
    .split(/[\s,]+/)
    .map((id) => id.trim())
    // Tolerate a whole share link being pasted instead of the bare ID — that
    // is the shape Drive's "Copy link" button actually gives you.
    .map((id) => id.match(/\/d\/([^/?#]+)/)?.[1] ?? id)
    .filter((id) => id.length > 0 && id !== "<FILE_ID>");
}

type DriveFile = { id?: string; name?: string };

async function fromFolder(): Promise<string[]> {
  const folderId = configured(process.env.ISAAC_PAGES_FOLDER_ID, "<FOLDER_ID>");
  const key = process.env.GOOGLE_DRIVE_API_KEY;
  if (!folderId || !key) return [];

  const params = new URLSearchParams({
    q: `'${folderId}' in parents and trashed = false and mimeType contains 'image/'`,
    key,
    fields: "files(id,name)",
    orderBy: "name_natural",
    pageSize: "1000",
    // Without these a folder in a shared drive lists as empty.
    supportsAllDrives: "true",
    includeItemsFromAllDrives: "true",
  });

  let response: Response;
  try {
    response = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, {
      next: { revalidate: LISTING_TTL_SECONDS },
    });
  } catch {
    return [];
  }
  if (!response.ok) return [];

  let files: DriveFile[];
  try {
    files = ((await response.json()) as { files?: DriveFile[] }).files ?? [];
  } catch {
    return [];
  }

  return files
    .filter((file): file is Required<DriveFile> => !!file.id && !!file.name)
    .sort((a, b) => naturalCompare(a.name, b.name))
    .map((file) => file.id);
}

/**
 * Where this issue's pages come from, or null if nothing is configured.
 *
 * Never throws: an unreachable source resolves to a shorter list or to null,
 * and every caller treats "no pages" as "the reader stays shut".
 */
export async function isaacSource(): Promise<IsaacSource | null> {
  const pdf = configured(process.env.ISAAC_MAGAZINE_FILE_ID, "<FILE_ID>");
  if (pdf) return { kind: "pdf", fileId: pdf };

  const explicit = fromExplicitList();
  if (explicit.length > 0) return { kind: "images", ids: explicit };

  const listed = await fromFolder();
  if (listed.length > 0) return { kind: "images", ids: listed };

  const cover = configured(process.env.ISAAC_COVER_FILE_ID, "<FILE_ID>");
  return cover ? { kind: "images", ids: [cover] } : null;
}

/** How many pages the reader should render. 0 disables it entirely. */
export async function isaacPageCount(): Promise<number> {
  const source = await isaacSource();
  if (!source) return 0;
  return source.kind === "pdf"
    ? await pdfPageCount(source.fileId)
    : source.ids.length;
}

/**
 * Upstream image URL for one page held as a Drive image.
 *
 * `=s1800` rather than the cover route's `=s0`: at the size the reader paints a
 * page (never more than the viewport height) 1800px is already retina-sharp,
 * and it keeps each fetched page comfortably under the 2MB entry limit of
 * Next's fetch cache — a full-resolution 2480x3508 PNG exceeds it, which would
 * silently mean re-fetching every page on every request.
 *
 * The ?v= is inert to lh3 and exists only to vary this URL, which is what Next
 * keys its fetch cache on.
 */
export function isaacUpstreamUrl(fileId: string): string {
  return `https://lh3.googleusercontent.com/d/${fileId}=s1800?v=${ISAAC_COVER_VERSION}`;
}

async function fetchDriveImage(
  fileId: string
): Promise<{ body: ArrayBuffer; contentType: string } | null> {
  let upstream: Response;
  try {
    upstream = await fetch(isaacUpstreamUrl(fileId), {
      // Cache the fetched page on the server for a day.
      next: { revalidate: 86400 },
    });
  } catch {
    return null;
  }
  if (!upstream.ok) return null;

  return {
    body: await upstream.arrayBuffer(),
    contentType: upstream.headers.get("content-type") ?? "image/jpeg",
  };
}

/**
 * One page of the magazine as image bytes, whatever the source is, or null if
 * the page does not exist or cannot be produced. `index` is 0-based; 0 is the
 * cover.
 */
export async function isaacPageImage(
  index: number
): Promise<{ body: ArrayBuffer | Buffer; contentType: string } | null> {
  const source = await isaacSource();
  if (!source || index < 0) return null;

  if (source.kind === "pdf") {
    // Bounds-checked against the real document rather than trusted, so a probe
    // for page 900 costs a lookup instead of a render attempt.
    if (index >= (await pdfPageCount(source.fileId))) return null;
    return renderPdfPage(source.fileId, index);
  }

  const fileId = source.ids[index];
  return fileId ? fetchDriveImage(fileId) : null;
}
