// Rasterises the ISAAC magazine PDF, one page at a time, on the server.
//
// The magazine is a single PDF in Drive. Handing that PDF to the browser would
// undo the point of the proxy — one request and the whole issue is off the
// site — so the browser never sees it. This module fetches the PDF server-side,
// keeps it parsed in memory, and renders exactly the page that was asked for.
//
// Server-only: it pulls in pdfjs-dist and a native canvas, neither of which
// belongs in a client bundle. Nothing here may be imported from a component.

import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";

/**
 * Rendered height, in pixels. The reader never paints a page taller than the
 * viewport, so 1800 is already retina-sharp on a laptop, and it keeps a page
 * small enough to sit comfortably inside Next's caches.
 */
const RENDER_HEIGHT = 1800;

/** Guards against a pathological page box demanding an enormous canvas. */
const MAX_SCALE = 4;

/** JPEG quality. Magazine pages are photographic; 88 holds type without banding. */
const JPEG_QUALITY = 88;

/**
 * Rendered pages held per server instance. Rendering is the expensive part and
 * a reader turns back and forth over the same handful of pages, so this is what
 * keeps a warm instance from re-rasterising the same sheet repeatedly.
 * Promises rather than buffers, so two simultaneous requests for one page
 * render it once.
 */
const MAX_CACHED_PAGES = 24;
const renderCache = new Map<string, Promise<Buffer>>();

/**
 * Where pdfjs keeps the 14 standard Type1 faces. Only PDFs that lean on
 * Helvetica/Times rather than embedding their fonts need these, but a magazine
 * exported by hand may well be one, and the failure without them is silently
 * blank text. next.config.ts force-traces this directory into the deployed
 * bundle, since it is read at runtime and nothing imports it.
 *
 * Resolved from the project root on first use, not from `import.meta.url` at
 * module scope: in Turbopack's production server bundle `import.meta.url` is
 * not a string, so `createRequire` on it throws while the route is still being
 * loaded — which fails the build outright rather than this one feature.
 * Resolution failing is survivable, so it degrades to undefined instead.
 */
let standardFontsUrl: string | null | undefined;

function standardFonts(): string | undefined {
  if (standardFontsUrl === undefined) {
    try {
      const resolve = createRequire(
        pathToFileURL(path.join(process.cwd(), "package.json")).href
      );
      const dir = path.join(
        path.dirname(resolve.resolve("pdfjs-dist/package.json")),
        "standard_fonts"
      );
      // pdfjs treats this as a base URL, so the trailing slash is load-bearing.
      standardFontsUrl = `${pathToFileURL(dir).href}/`;
    } catch {
      standardFontsUrl = null;
    }
  }
  return standardFontsUrl ?? undefined;
}

type PdfModule = typeof import("pdfjs-dist/legacy/build/pdf.mjs");
type PdfDocument = Awaited<ReturnType<PdfModule["getDocument"]>["promise"]>;

/** The legacy build is the one meant for Node — the default build assumes a DOM. */
async function pdfjs(): Promise<PdfModule> {
  return import("pdfjs-dist/legacy/build/pdf.mjs");
}

/* -------------------------------------------------------------------------- *
 * Getting the bytes out of Drive
 * -------------------------------------------------------------------------- */

function downloadUrls(fileId: string): string[] {
  const key = process.env.GOOGLE_DRIVE_API_KEY;
  const urls: string[] = [];

  // Preferred when a key is configured: a documented endpoint that returns the
  // bytes and a real HTTP error when it cannot.
  if (key) {
    urls.push(
      `https://www.googleapis.com/drive/v3/files/${fileId}` +
        `?alt=media&supportsAllDrives=true&key=${encodeURIComponent(key)}`
    );
  }

  // Keyless fallback. `confirm=t` is what skips the "can't scan for viruses"
  // interstitial that Drive serves for larger files — without it the response
  // is an HTML page, which is why the caller checks for the %PDF header rather
  // than trusting a 200.
  urls.push(
    `https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=t`
  );

  return urls;
}

function looksLikePdf(bytes: Uint8Array): boolean {
  return (
    bytes.length > 4 &&
    bytes[0] === 0x25 && // %
    bytes[1] === 0x50 && // P
    bytes[2] === 0x44 && // D
    bytes[3] === 0x46 // F
  );
}

async function fetchPdfBytes(fileId: string): Promise<Uint8Array | null> {
  for (const url of downloadUrls(fileId)) {
    let response: Response;
    try {
      response = await fetch(url, { next: { revalidate: 86400 } });
    } catch {
      continue;
    }
    if (!response.ok) continue;

    const bytes = new Uint8Array(await response.arrayBuffer());
    if (looksLikePdf(bytes)) return bytes;

    // A 200 that is not a PDF means Drive served an interstitial or a sign-in
    // page — almost always because the file is not shared "anyone with the
    // link". Worth saying out loud; it is otherwise a very quiet failure.
    console.error(
      `[isaac] ${url.split("?")[0]} returned ${bytes.length} bytes that are not a PDF — ` +
        "check the file is shared as 'Anyone with the link'."
    );
  }
  return null;
}

/* -------------------------------------------------------------------------- *
 * Parsing
 * -------------------------------------------------------------------------- */

let documentCache: { fileId: string; promise: Promise<PdfDocument | null> } | null = null;

/**
 * The parsed PDF, kept for the life of the server instance. Parsing is the
 * other expensive half, and every page render needs it.
 */
function loadDocument(fileId: string): Promise<PdfDocument | null> {
  if (documentCache?.fileId === fileId) return documentCache.promise;

  const promise = (async () => {
    const data = await fetchPdfBytes(fileId);
    if (!data) return null;

    const lib = await pdfjs();
    try {
      return await lib.getDocument({
        data,
        // The issue ships as an encrypted PDF. The open password lives in
        // ISAAC_MAGAZINE_PASSWORD and is used here and nowhere else — readers
        // are never asked for it, and it is never sent to the browser, because
        // the browser never receives the PDF in the first place.
        password: process.env.ISAAC_MAGAZINE_PASSWORD,
        useSystemFonts: true,
        standardFontDataUrl: standardFonts(),
      }).promise;
    } catch (error) {
      // pdf.js reports both "encrypted, none given" and "encrypted, wrong one"
      // as PasswordException. Naming the variable is the difference between a
      // five-second fix and a hunt through a stack trace.
      if ((error as { name?: string })?.name === "PasswordException") {
        console.error(
          "[isaac] the magazine PDF is password-protected and " +
            (process.env.ISAAC_MAGAZINE_PASSWORD
              ? "ISAAC_MAGAZINE_PASSWORD did not open it — check the value."
              : "ISAAC_MAGAZINE_PASSWORD is not set.")
        );
      } else {
        console.error("[isaac] could not parse the magazine PDF:", error);
      }
      return null;
    }
  })();

  documentCache = { fileId, promise };

  // A failed load must not be cached forever — the next request should retry.
  promise
    .then((doc) => {
      if (!doc && documentCache?.promise === promise) documentCache = null;
    })
    .catch(() => {
      if (documentCache?.promise === promise) documentCache = null;
    });

  return promise;
}

/** How many pages the magazine has, or 0 if it cannot be read. */
export async function pdfPageCount(fileId: string): Promise<number> {
  const doc = await loadDocument(fileId);
  return doc?.numPages ?? 0;
}

/* -------------------------------------------------------------------------- *
 * Rendering
 * -------------------------------------------------------------------------- */

async function render(fileId: string, index: number): Promise<Buffer> {
  const doc = await loadDocument(fileId);
  if (!doc) throw new Error("magazine PDF unavailable");

  // pdfjs page numbers are 1-based; ours are 0-based, 0 being the cover.
  const page = await doc.getPage(index + 1);

  const unscaled = page.getViewport({ scale: 1 });
  const scale = Math.min(MAX_SCALE, RENDER_HEIGHT / unscaled.height);
  const viewport = page.getViewport({ scale });

  const { createCanvas } = await import("@napi-rs/canvas");
  const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
  const context = canvas.getContext("2d");

  // PDF pages have no background of their own; without this the JPEG encoder
  // would be handed transparent pixels and render them black.
  context.fillStyle = "#FFFFFF";
  context.fillRect(0, 0, canvas.width, canvas.height);

  await page.render({
    canvas: null,
    // The types describe a DOM canvas; @napi-rs/canvas implements the same
    // surface, which is the whole reason it works here.
    canvasContext: context as unknown as CanvasRenderingContext2D,
    viewport,
  }).promise;

  page.cleanup();
  return canvas.toBuffer("image/jpeg", JPEG_QUALITY);
}

/**
 * One page of the magazine as JPEG bytes, or null if it cannot be produced.
 * `index` is 0-based and must already be known to be in range.
 */
export async function renderPdfPage(
  fileId: string,
  index: number
): Promise<{ body: Buffer; contentType: string } | null> {
  const key = `${fileId}:${index}`;

  let pending = renderCache.get(key);
  if (!pending) {
    pending = render(fileId, index);
    renderCache.set(key, pending);
    pending.catch(() => renderCache.delete(key));

    // Plain insertion-order eviction. Map preserves it, and a reader moves
    // through the issue in order, so the oldest entry is reliably the least
    // interesting one.
    if (renderCache.size > MAX_CACHED_PAGES) {
      const oldest = renderCache.keys().next();
      if (!oldest.done) renderCache.delete(oldest.value);
    }
  }

  try {
    return { body: await pending, contentType: "image/jpeg" };
  } catch {
    return null;
  }
}
