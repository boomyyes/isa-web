// Server-side proxy for one page of the ISAAC magazine.
//
// Same contract as app/api/isaac-cover: nothing about the Drive source may
// reach the browser. Where the issue is a single PDF that means the page is
// rasterised here and only the resulting image is sent — the PDF itself never
// leaves the server, which is the point. Visitors and DevTools see only
// /api/isaac-page/<n>. Which source is in use is decided in lib/isaac.server.ts.
import { isCurrentVersion } from "@/lib/isaac";
import { isaacPageImage } from "@/lib/isaac.server";

// Rendering a PDF page needs a native canvas, so this cannot run on edge.
export const runtime = "nodejs";

// Bounded so the path segment cannot be used to probe for anything else, and
// so a garbage index costs a regex rather than a source lookup.
const INDEX_PATTERN = /^\d{1,4}$/;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ index: string }> }
) {
  // Stale token, or none: refuse rather than serve. See isCurrentVersion.
  if (!isCurrentVersion(request.url)) {
    return new Response("Stale or missing version token", { status: 400 });
  }

  const { index } = await params;
  if (!INDEX_PATTERN.test(index)) {
    return new Response("Bad page index", { status: 400 });
  }

  const page = await isaacPageImage(Number(index));
  if (!page) {
    return new Response("Page unavailable", { status: 404 });
  }

  return new Response(page.body as BodyInit, {
    headers: {
      "Content-Type": page.contentType,
      // Cached hard on purpose. Rendering a page is the expensive step, and the
      // URL carries the ?v= token from lib/isaac.ts — bumping that is what
      // invalidates this, so there is nothing to be gained by expiring sooner.
      "Cache-Control":
        "public, max-age=3600, s-maxage=31536000, stale-while-revalidate=604800",
    },
  });
}
