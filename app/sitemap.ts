import type { MetadataRoute } from "next";
import { articles } from "@/lib/articles";
import { SITE_ORIGIN } from "@/lib/seo";

const STATIC_ROUTES = [
  "/",
  "/initiatives",
  "/community",
  "/artemis",
  "/membership",
  "/certificates",
  "/help",
  "/privacy",
  "/terms",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...STATIC_ROUTES.map((path) => ({ url: `${SITE_ORIGIN}${path}` })),
    ...articles.map((article) => ({ url: `${SITE_ORIGIN}/articles/${article.slug}` })),
  ];
}
