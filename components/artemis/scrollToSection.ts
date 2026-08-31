"use client";

import { animate, type JSAnimation } from "animejs";
import type * as React from "react";
import { ARTEMIS_EASE } from "@/components/artemis/useArtemisAnime";

/**
 * Click handler for the page's in-section links: an eased scroll to the target.
 *
 * Replaces the browser's fragment navigation rather than decorating it, for
 * three reasons:
 *
 * 1. **Repeat presses.** Following `#register` sets the URL hash; following it
 *    again is a no-op, because the hash has not changed and there is no
 *    navigation left to perform. That is why pressing the same button twice did
 *    nothing the second time until you pressed the other one. Nothing here reads
 *    the current hash, so there is no state that can go stale and the tenth
 *    press behaves exactly like the first.
 *
 * 2. **Smoothness.** Next 16 no longer forces `scroll-behavior: smooth` during
 *    navigation, so the fragment jump landed hard.
 *
 * 3. **Why the scroll is driven rather than handed to `behavior: "smooth"`.**
 *    globals.css sets `overflow-x: hidden` on <body> as a backstop against
 *    sideways scroll on mobile. Per spec that overflow propagates from the body
 *    to the viewport, and a viewport with a propagated `overflow-x: hidden` is
 *    the long-standing case where Chrome and Safari quietly drop native smooth
 *    scrolling and jump instead — which is exactly what it did when this used
 *    scrollIntoView.
 *
 * The animation itself is anime.js animating a plain object — the same engine
 * driving every other transition on the page. Animating a progress value 0 -> 1
 * rather than a scroll position directly keeps the destination free to be
 * recomputed per frame (see onUpdate), and it means this scroll shares the exact
 * easing curve used by the reveals in components/artemis/reveal.ts.
 *
 * Navbar clearance comes from `scroll-mt-*` on the target section, read back
 * here via getComputedStyle so this and a native jump (someone opening
 * /artemis#register directly) land in the same place from one declaration.
 */

/** The in-flight scroll, if any. Module-level: only one can run at a time. */
let activeScroll: JSAnimation | null = null;
let releaseInterrupts: (() => void) | null = null;

function stopActiveScroll() {
  activeScroll?.pause();
  activeScroll = null;
  releaseInterrupts?.();
  releaseInterrupts = null;
}

function resolveTargetY(target: HTMLElement) {
  const clearance = parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
  const y = target.getBoundingClientRect().top + window.scrollY - clearance;

  // Clamp, so asking for a section near the end of the page does not animate
  // toward a position the document cannot actually reach and stall short.
  const maxY = document.documentElement.scrollHeight - window.innerHeight;
  return Math.max(0, Math.min(y, maxY));
}

export function scrollToSection(
  event: React.MouseEvent<HTMLElement>,
  targetId: string
) {
  // Let the browser handle anything that is not a plain left click —
  // ctrl/cmd-click, middle click and shift-click should still open a tab or a
  // window rather than being swallowed and turned into a scroll.
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  if ("button" in event && event.button !== 0) return;

  const target = document.getElementById(targetId);
  if (!target) return;

  event.preventDefault();

  // A second click mid-flight retargets rather than running two animations
  // against the same scroll position.
  stopActiveScroll();

  // Keep the URL shareable without letting the browser also jump: replaceState
  // does not trigger fragment navigation, and it keeps these in-page moves out
  // of the back stack, so Back still leaves the page rather than retracing
  // every section the visitor looked at.
  history.replaceState(null, "", "#" + targetId);

  const startY = window.scrollY;
  // Measured once, only to decide whether to animate at all and for how long —
  // the destination is re-read every frame below.
  const distance = resolveTargetY(target) - startY;

  // Focus follows the scroll so a keyboard or screen-reader user carries on from
  // the section rather than from the button they left behind. preventScroll so
  // focusing cannot fight the animation that just finished.
  const focusTarget = () => target.focus({ preventScroll: true });

  // Nothing in anime.js reads the motion preference on its own, so this does it
  // directly — the same guard useArtemisAnime applies to the page's sections.
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (prefersReducedMotion || Math.abs(distance) < 2) {
    window.scrollTo(0, resolveTargetY(target));
    focusTarget();
    return;
  }

  // The animation owns the scroll position, so any real input from the visitor
  // has to end it — otherwise their wheel or swipe fights it and the page
  // sticks. Passive: these only observe.
  const interrupt = () => stopActiveScroll();
  const events: (keyof WindowEventMap)[] = ["wheel", "touchstart", "keydown"];
  events.forEach((type) =>
    window.addEventListener(type, interrupt, { passive: true })
  );
  releaseInterrupts = () =>
    events.forEach((type) => window.removeEventListener(type, interrupt));

  // anime.js animates the properties of a plain object as readily as those of an
  // element, so the tween itself is this one number.
  const progress = { value: 0 };

  activeScroll = animate(progress, {
    value: 1,
    // Milliseconds. Scaled by distance so a short hop is brisk and a full-page
    // move still reads as travel, bounded at both ends so neither feels broken.
    duration: Math.min(1200, Math.max(450, Math.abs(distance) * 0.55)),
    // The same curve the page's reveals use — see ARTEMIS_EASE.
    ease: ARTEMIS_EASE,
    onUpdate: () => {
      // Re-read the destination every frame rather than riding the distance
      // measured at click time. Layout can move under a scroll this long — a
      // font swapping in, an image arriving, a section revealing — and a fixed
      // target would land those pixels off. resolveTargetY returns an absolute
      // document position, so re-reading is self-correcting, not cumulative.
      const endY = resolveTargetY(target);
      window.scrollTo(0, startY + (endY - startY) * progress.value);
    },
    onComplete: () => {
      stopActiveScroll();
      focusTarget();
    },
  });
}
