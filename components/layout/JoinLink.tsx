"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLenis } from "lenis/react";

const APPLY = "/membership/apply";

/**
 * The footer's "Join the chapter" call to action. Everywhere else it links to
 * the application; on the application page itself it reads "Back to the form"
 * and glides up to the form, then puts the cursor in its first field.
 */
export function JoinLink({ className, children }: { className?: string; children: React.ReactNode }) {
  const onApply = usePathname() === APPLY;
  const lenis = useLenis();

  if (!onApply) {
    return (
      <Link href={APPLY} className={className}>
        Join the chapter
        {children}
      </Link>
    );
  }

  return (
    // A button, not an "#m-name" link: Lenis's `anchors` option takes over every
    // in-page link and would jump there itself.
    <button
      type="button"
      className={className}
      onClick={() => {
        const form = document.querySelector("form");
        const first = document.getElementById("m-name");
        const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        // After a submission the form is gone; go to the top of the page instead.
        // Layout position (offsetTop chain), not getBoundingClientRect: the form
        // sits in a scroll-reveal wrapper that is still translated while
        // offscreen. 120px clears the floating navbar.
        let y = 0;
        for (let el = form as HTMLElement | null; el; el = el.offsetParent as HTMLElement | null) y += el.offsetTop;
        const top = form ? Math.max(0, y - 120) : 0;
        const done = () => first?.focus({ preventScroll: true });
        if (lenis && !still) {
          lenis.scrollTo(top, { duration: 1.4, easing: (t) => 1 - Math.pow(1 - t, 4), onComplete: done });
        } else {
          window.scrollTo({ top, behavior: still ? "auto" : "smooth" });
          done();
        }
      }}
    >
      Back to the form
      {children}
    </button>
  );
}
