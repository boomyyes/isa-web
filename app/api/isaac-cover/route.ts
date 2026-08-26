// Server-side proxy for the ISAAC magazine first-page cover.
//
// The image lives on Google Drive, but the Drive URL / file ID must never reach
// the browser. This handler fetches the image server-side and streams the bytes
// back, so visitors (and DevTools) only ever see this same-origin endpoint —
// `/api/isaac-cover` — never the Drive source.
//
// TODO: set the Drive file ID below (or, preferably, in .env.local as
// ISAAC_COVER_FILE_ID=...). Get it from the share link
// https://drive.google.com/file/d/<FILE_ID>/view — paste just the <FILE_ID>.
// The file must be shared as "Anyone with the link".
import { ISAAC_COVER_VERSION } from "@/lib/isaac";

const FILE_ID = process.env.ISAAC_COVER_FILE_ID;

// lh3 serves the raw image bytes directly (more reliable than uc?export=view).
// The =s0 suffix returns the original, un-resized image — currently a 2480x3508
// PNG, which next/image compresses to roughly 200KB before it reaches a browser.
//
// The ?v= is inert to lh3 (verified: same bytes with and without it) and exists
// only to vary this URL, which is what Next keys its fetch cache on. Without it,
// swapping the artwork in Drive leaves the old bytes cached here for a day.
const UPSTREAM = `https://lh3.googleusercontent.com/d/${FILE_ID}=s0?v=${ISAAC_COVER_VERSION}`;

export async function GET() {
  if (!FILE_ID || FILE_ID === "<FILE_ID>") {
    return new Response("ISAAC cover not configured", { status: 404 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(UPSTREAM, {
      // Cache the fetched image on the server for a day.
      next: { revalidate: 86400 },
    });
  } catch {
    return new Response("Upstream fetch failed", { status: 502 });
  }

  if (!upstream.ok) {
    return new Response("Cover unavailable", { status: 502 });
  }

  const contentType = upstream.headers.get("content-type") ?? "image/jpeg";
  const body = await upstream.arrayBuffer();

  return new Response(body, {
    headers: {
      "Content-Type": contentType,
      // Let the browser/CDN cache it; the source stays hidden either way.
      "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
