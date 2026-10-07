import * as React from "react";

/**
 * Wraps a page's content so it slides up slightly on mount.
 *
 * CSS (animate-page-enter in globals.css), not framer-motion. The old version
 * started every page at opacity 0 and waited for hydration to fade it in, so
 * nothing painted until the JS bundle had run: 1.4s unthrottled, 5s+ on a
 * mid-range phone, and it set LCP for every page that used it. Transform only,
 * so the content is painted from the first frame. It still replays on each
 * navigation, because each page mounts a fresh wrapper.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  return <div className="animate-page-enter">{children}</div>;
}
