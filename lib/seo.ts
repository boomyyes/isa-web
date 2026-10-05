import type { Metadata } from "next";

export const SITE_ORIGIN = "https://www.isarait.in";
export const SITE_NAME = "ISA RAIT Student Chapter";

/**
 * Per-page metadata with a canonical URL and Open Graph tags.
 *
 * Next merges metadata shallowly: a page that sets `openGraph` replaces the
 * root layout's object wholesale, siteName and locale included. Building every
 * page's block here keeps those from silently going missing. That includes the
 * image: app/opengraph-image.jpg only reaches the root page by itself — a page
 * that sets its own `openGraph` loses it (verified against the built output).
 */
const SHARE_IMAGE = { url: "/opengraph-image.jpg", width: 1200, height: 630 };

export function pageMetadata({
  path,
  title,
  description,
  type = "website",
}: {
  path: string;
  title: string;
  description: string;
  type?: "website" | "article";
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type,
      url: path,
      siteName: SITE_NAME,
      locale: "en_IN",
      title,
      description,
      images: [SHARE_IMAGE],
    },
    twitter: { card: "summary_large_image", images: [SHARE_IMAGE.url] },
  };
}
