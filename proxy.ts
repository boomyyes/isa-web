// Host routing for the admin area.
//
// admin.isarait.in/x  -> app/admin/x  (rewrite, URL unchanged)
// www.isarait.in/admin -> 404 in production, so the admin area has one address.
//
// Off production the admin area also answers at /admin, because preview URLs
// and localhost have no admin. subdomain. This only routes; every admin page
// and route checks the session itself.

import { NextResponse, type NextRequest } from "next/server";
import { isAdminHost, pathModeAllowed } from "@/lib/admin/config";

const PRIVATE = { "X-Robots-Tag": "noindex, nofollow", "Cache-Control": "no-store" };

/** The only public files the admin pages use: the tab icons from app/layout.tsx. */
const ADMIN_HOST_FILES = new Set(["/favicon.ico", "/icon-light.png", "/icon-dark.png", "/apple-icon.png"]);

const isAdminPath = (path: string) =>
  path === "/admin" || path.startsWith("/admin/") || path.startsWith("/api/admin/");

function withPrivateHeaders(response: NextResponse) {
  for (const [name, value] of Object.entries(PRIVATE)) response.headers.set(name, value);
  return response;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isAdminHost(request.headers.get("host"))) {
    // Crawlers get told to stay out, rather than seeing the public site's robots.txt.
    if (pathname === "/robots.txt") {
      return withPrivateHeaders(
        new NextResponse("User-agent: *\nDisallow: /\n", {
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        })
      );
    }
    if (pathname.startsWith("/api/admin/") || ADMIN_HOST_FILES.has(pathname)) {
      return withPrivateHeaders(NextResponse.next());
    }
    // Any other file (sitemap, public images, security.txt) belongs to www.
    if (/\.[a-z0-9]+$/i.test(pathname)) {
      return withPrivateHeaders(new NextResponse("Not found", { status: 404 }));
    }
    const url = request.nextUrl.clone();
    url.pathname = `/admin${pathname === "/" ? "" : pathname}`;
    return withPrivateHeaders(NextResponse.rewrite(url));
  }

  if (isAdminPath(pathname)) {
    if (!pathModeAllowed()) return new NextResponse("Not found", { status: 404 });
    return withPrivateHeaders(NextResponse.next());
  }

  return NextResponse.next();
}

export const config = {
  // Only admin traffic, so public pages never pay for a proxy invocation.
  // Matchers must be literals: keep the host in step with ADMIN_HOST.
  matcher: [
    {
      source: "/((?!_next/static|_next/image).*)",
      has: [{ type: "header", key: "host", value: "admin\\.isarait\\.in" }],
    },
    "/admin",
    "/admin/:path*",
    "/api/admin/:path*",
  ],
};
