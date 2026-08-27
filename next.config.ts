import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdfjs-dist and the native canvas that renders the magazine PDF are both
  // loaded at runtime on the server. Bundling either breaks them — the canvas
  // ships a platform binary, and pdfjs reads its font data off disk.
  serverExternalPackages: ["pdfjs-dist", "@napi-rs/canvas"],

  // Nothing imports the standard Type1 fonts, so file tracing cannot see that
  // the PDF renderer needs them; without this they are missing in production
  // and any page relying on Helvetica or Times renders blank.
  outputFileTracingIncludes: {
    "/api/isaac-page/[index]": ["./node_modules/pdfjs-dist/standard_fonts/**"],
    "/api/isaac-cover": ["./node_modules/pdfjs-dist/standard_fonts/**"],
  },

  images: {
    // Next allows only [75] by default, and silently rejects anything else.
    // The magazine pages are already JPEGs, so the optimizer's re-encode is a
    // second lossy pass over a lossy source — at 75 that pass is what you
    // actually see. 90 is for the reader; everything else stays on 75.
    qualities: [75, 90],

    // Setting localPatterns switches next/image to allowlist mode: any local
    // src not matched here is rejected with a 400. The first entry therefore
    // has to re-permit everything in public/ (team photos, event art, logos,
    // the principal's portrait) that used to be allowed implicitly.
    localPatterns: [
      { pathname: "/**", search: "" },
      // The ISAAC proxies are the local images with a query string: they carry
      // the ?v= token that busts the optimizer cache when artwork is replaced
      // in Drive.
      //
      // `search` is deliberately NOT pinned to the current token. It was, and
      // that made this config a second place the version had to be updated —
      // a mismatch rejects every magazine image with a 400, and because the
      // config is only read at startup, bumping the token broke the running
      // server until it was restarted with a cleared cache. The protection
      // pinning bought (nobody minting unlimited optimizer cache entries off
      // arbitrary query strings) now lives in the routes themselves, which
      // reject any token that is not the current one. One source of truth.
      { pathname: "/api/isaac-cover" },
      { pathname: "/api/isaac-page/**" },
    ],
  },
};

export default nextConfig;
