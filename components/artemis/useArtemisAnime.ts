"use client";

import { useEffect, useRef, type DependencyList, type RefObject } from "react";
import { createScope, cubicBezier, type Scope } from "animejs";

/**
 * Scope lifecycle and reduced-motion handling for the Artemis page's anime.js
 * animations. Every section on /artemis goes through this hook and nothing else.
 *
 * Why a scope at all: `createScope` namespaces every selector passed to
 * `animate()` inside the setup callback to the section's own root element, so a
 * section can say `.medallion` without worrying about the eleven other sections
 * on the page. It also collects every animation, scroll observer and text
 * splitter created inside it, so `revert()` on unmount tears down all of them
 * and restores the original DOM — which is exactly what React 19's StrictMode
 * double-invoke needs.
 *
 * Why reduced motion is handled here: framer-motion's <MotionConfig
 * reducedMotion="user"> in components/providers/ThemeProvider.tsx only governs
 * framer's own motion components. Nothing in anime.js reads the preference. So
 * the guard is this hook plus a matching CSS block in globals.css: the hook
 * never builds the scope, and the CSS undoes the pre-paint hidden states, which
 * leaves the section rendered exactly as it would be at the end of its
 * animation. The preference is read once per effect run, so toggling it at the
 * OS level takes effect on the next reload — the same behaviour the page's CSS
 * keyframes already have.
 */

/**
 * The site-wide curve (easeOutCubic), matching fadeUp's old ease tuple and the
 * eased scroll in scrollToSection.ts.
 *
 * A built easing function, not the string `"cubicBezier(0.33, 1, 0.68, 1)"`:
 * anime.js 4.5 removed string easing syntax from the core, and passing one now
 * warns and falls back rather than easing — which leaves anything with a
 * transform frozen part-way through it.
 */
export const ARTEMIS_EASE = cubicBezier(0.33, 1, 0.68, 1);

/**
 * Mirrors the Tailwind breakpoints the sections actually branch on, so a setup
 * callback can read `self.matches.lg` instead of measuring the viewport itself.
 * A scope re-runs its constructors when one of these flips, so anything keyed
 * off them stays correct across a resize.
 */
const MEDIA_QUERIES = {
  sm: "(min-width: 640px)",
  md: "(min-width: 768px)",
  lg: "(min-width: 1024px)",
};

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Returns a ref to put on the section's root element. `setup` runs once the
 * element is mounted, with the scope as its argument.
 *
 * `deps` follows the useEffect convention: leave it empty for a section that
 * animates once, or pass state for a scope that has to be rebuilt (see
 * ConstellationGrid, which re-runs on selection).
 */
export function useArtemisAnime<T extends HTMLElement = HTMLDivElement>(
  setup: (self: Scope) => void,
  deps: DependencyList = []
): RefObject<T | null> {
  const root = useRef<T>(null);

  useEffect(() => {
    if (!root.current) return;
    if (prefersReducedMotion()) return;

    // The `self!` is anime.js's typing, not a real possibility: a scope always
    // passes itself to its constructors.
    const scope = createScope({ root, mediaQueries: MEDIA_QUERIES }).add(
      (self) => setup(self!)
    );
    return () => scope.revert();
    // `setup` is a fresh closure every render and would defeat `deps` entirely
    // if it were listed; the closure captured on the run that matches `deps` is
    // the one we want.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return root;
}
