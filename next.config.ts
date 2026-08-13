import type { NextConfig } from "next";
import { ISAAC_COVER_VERSION } from "./lib/isaac";

const nextConfig: NextConfig = {
  images: {
    // Setting localPatterns switches next/image to allowlist mode: any local
    // src not matched here is rejected with a 400. The first entry therefore
    // has to re-permit everything in public/ (team photos, event art, logos,
    // the principal's portrait) that used to be allowed implicitly.
    localPatterns: [
      { pathname: "/**", search: "" },
      // The ISAAC cover proxy is the one local image with a query string: it
      // carries the ?v= token that busts the optimizer cache when the artwork
      // is replaced in Drive. Pinning the exact search value rather than
      // omitting it keeps anyone from minting unlimited optimizer cache entries
      // off arbitrary query strings. Imported so bumping the version in
      // lib/isaac.ts updates the src and this allowlist together.
      { pathname: "/api/isaac-cover", search: `?v=${ISAAC_COVER_VERSION}` },
    ],
  },
};

export default nextConfig;
