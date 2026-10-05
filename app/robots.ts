import type { MetadataRoute } from "next";
import { SITE_ORIGIN } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // The API has nothing worth indexing, and the reset page is already
      // noindex — keeping crawlers off it saves them the round trip.
      disallow: ["/api/", "/certificates/reset"],
    },
    sitemap: `${SITE_ORIGIN}/sitemap.xml`,
  };
}
