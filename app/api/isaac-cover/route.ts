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
const FILE_ID = process.env.ISAAC_COVER_FILE_ID;

// lh3 serves the raw image bytes directly (more reliable than uc?export=view).
// The =s0 suffix returns the original, un-resized image (the source is only
// 512x800, so up-scaling it would just add blur and weight).
const UPSTREAM = `https://lh3.googleusercontent.com/d/${FILE_ID}=s0`;

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
