"use client";

import { useLenis } from "lenis/react";

/**
 * Footer "Back to top": an eased scroll through Lenis where it runs, the
 * browser's smooth scroll where it doesn't (/artemis), and an instant jump for
 * reduced motion. A button rather than an "#" link, because Lenis's `anchors`
 * option takes over in-page links and would replace this easing with its own.
 */
export function BackToTop({ className }: { className?: string }) {
  const lenis = useLenis();
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (lenis && !still) lenis.scrollTo(0, { duration: 1.6, easing: (t) => 1 - Math.pow(1 - t, 4) });
        else window.scrollTo({ top: 0, behavior: still ? "auto" : "smooth" });
      }}
    >
      Back to top ↑
    </button>
  );
}
