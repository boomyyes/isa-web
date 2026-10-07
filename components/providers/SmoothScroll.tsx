"use client";

// Lenis smooth scrolling (MIT, darkroom.engineering) for the public site.
//
// It drives the real document scroll, so framer-motion's useScroll and every
// position: sticky keep working unchanged. Defaults that matter here:
//  - Touch devices keep native scrolling (syncTouch is off).
//  - Users who ask for reduced motion get native scrolling; Lenis checks
//    prefers-reduced-motion itself.
//
// /artemis is excluded: it runs its own eased section scrolling
// (components/artemis/scrollToSection.ts), and two smoothers fighting over the
// same scroll position judder. /admin never mounts the (site) layout.
//
// Anything that scrolls on its own needs data-lenis-prevent, and anything that
// locks the page (a modal) should call useLenis()?.stop(), as IsaacReader does.

import "lenis/dist/lenis.css";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { ReactLenis, useLenis } from "lenis/react";

/**
 * Rendered beside the page, not around it. In `root` mode Lenis publishes
 * itself to a global store that useLenis() reads, so nothing has to sit inside
 * it, and switching it off on /artemis unmounts only this, never the page.
 */
export function SmoothScroll() {
  const pathname = usePathname();
  if (pathname.startsWith("/artemis")) return null;

  return (
    <>
      <ReactLenis root options={{ anchors: true, lerp: 0.12 }} />
      <ResetOnNavigate pathname={pathname} />
    </>
  );
}

/**
 * Lenis keeps its own scroll target, so the App Router's scroll-to-top on
 * navigation loses to it: scroll down, click a link, and the new page opened
 * at the old offset (seen in testing). So on each route change, jump to the
 * top ourselves, cancelling any glide in flight, and re-measure the page.
 *
 * Skipped for Back/Forward (popstate), where the browser restores the saved
 * position, for #hash links, which Lenis's `anchors` option handles, and on
 * first load, so a reload keeps its restored position.
 */
function ResetOnNavigate({ pathname }: { pathname: string }) {
  const lenis = useLenis();
  const previous = useRef(pathname);
  const traversing = useRef(false);

  useEffect(() => {
    const onPop = () => (traversing.current = true);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    if (!lenis || previous.current === pathname) return;
    previous.current = pathname;
    const restore = traversing.current || window.location.hash !== "";
    traversing.current = false;
    lenis.resize();
    lenis.scrollTo(restore ? window.scrollY : 0, { immediate: true, force: true });
  }, [lenis, pathname]);

  return null;
}
