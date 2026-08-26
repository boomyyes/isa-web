"use client";

import type * as React from "react";

/**
 * Click handler for the page's in-section links.
 *
 * The move itself is instant — this is deliberately not an animated scroll.
 * What it does replace is the browser's fragment navigation, and only because
 * of one flaw in it: following `#register` sets the URL hash, and following it
 * again is a no-op, because the hash has not changed and there is no navigation
 * left to perform. That is why pressing the same button twice did nothing the
 * second time until you pressed the other one.
 *
 * Nothing here reads the current hash, so there is no state that can go stale
 * and the tenth press behaves exactly like the first.
 *
 * Navbar clearance comes from `scroll-mt-*` on the target section, read back
 * here via getComputedStyle so this and a native jump (someone opening
 * /artemis#register directly) land in the same place from one declaration.
 */
export function scrollToSection(
  event: React.MouseEvent<HTMLElement>,
  targetId: string
) {
  // Let the browser handle anything that is not a plain left click —
  // ctrl/cmd-click, middle click and shift-click should still open a tab or a
  // window rather than being swallowed.
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  if ("button" in event && event.button !== 0) return;

  const target = document.getElementById(targetId);
  if (!target) return;

  event.preventDefault();

  const clearance = parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
  const y = target.getBoundingClientRect().top + window.scrollY - clearance;
  const maxY = document.documentElement.scrollHeight - window.innerHeight;

  window.scrollTo(0, Math.max(0, Math.min(y, maxY)));

  // Keep the URL shareable without letting the browser also jump: replaceState
  // does not trigger fragment navigation, and it keeps these in-page moves out
  // of the back stack, so Back still leaves the page rather than retracing
  // every section the visitor looked at.
  history.replaceState(null, "", "#" + targetId);

  // Focus follows the jump so a keyboard or screen-reader user carries on from
  // the section rather than from the button they left behind. preventScroll
  // because the scroll above already put it where it belongs.
  target.focus({ preventScroll: true });
}
