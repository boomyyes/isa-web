"use client";

import {
  animate,
  createDrawable,
  eases,
  onScroll,
  splitText,
  stagger,
  type EasingParam,
  type JSAnimation,
  type TargetsParam,
} from "animejs";
import { ARTEMIS_EASE } from "@/components/artemis/useArtemisAnime";

/**
 * The page's scroll-reveal vocabulary. Five shapes, used by every section:
 *
 *   revealOnScroll         content rises and fades in            [data-reveal]
 *   unrollOnScroll         a rule draws outward from its centre  [data-unroll]
 *   unfurlOnScroll         a panel unrolls top to bottom         [data-unfurl]
 *   drawOnScroll           stroked SVG engraves itself           [data-draw]
 *   revealHeadingOnScroll  a SectionHeading, word by word
 *
 * Each has a matching pre-paint hidden state in globals.css under `.artemis`.
 * That CSS is load-bearing: anime.js applies its from-values in an effect,
 * which is after first paint, so without it every section would flash at full
 * opacity before hiding itself. The same block is undone under
 * prefers-reduced-motion, where useArtemisAnime never builds a scope at all and
 * the CSS is the only thing deciding how the page looks.
 *
 * Durations here are milliseconds. framer-motion took seconds, so every number
 * on this page is 1000x what it was.
 *
 * Easings are imported functions, never the `"cubicBezier(…)"` / `"out(3)"`
 * strings the older anime.js docs use: 4.5 removed string easing from the core,
 * and one that slips through warns and then does not ease at all, which strands
 * anything mid-transform.
 */

/**
 * Fire when the top of the element has risen a little above the fold, rather
 * than the moment it clips the bottom edge. Roughly matches the `amount: 0.2`
 * viewport option the old framer reveals used.
 *
 * The order is "<container edge> <target edge>" — container first. Getting it
 * the wrong way round does not error: it silently describes a threshold the
 * page may never cross (here, the element's bottom passing the top of the
 * viewport), so the animation sits on its from-value forever and the section
 * simply never appears.
 */
const ENTER = "bottom-=5% top";

/**
 * Play once and drop the observer, like framer's `viewport: { once: true }`.
 * Exported so a section writing its own animation still enters on the same
 * threshold as the shared helpers around it.
 */
export function enterOnce() {
  return onScroll({ enter: ENTER, repeat: false });
}

const once = enterOnce;

export interface RevealOptions {
  /** Milliseconds before the first target starts. */
  delay?: number;
  /** Milliseconds between consecutive targets. Omit for no stagger. */
  each?: number;
  /** Where a stagger originates. */
  from?: number | "first" | "center" | "last" | "random";
  /** Grid dimensions for a two-dimensional stagger, as [columns, rows]. */
  grid?: [number, number];
  duration?: number;
  ease?: EasingParam;
}

/** Resolves the delay/each/from/grid group into a value anime.js accepts. */
function toDelay(opts: RevealOptions) {
  if (opts.each == null) return opts.delay ?? 0;
  return stagger(opts.each, {
    start: opts.delay ?? 0,
    from: opts.from ?? "first",
    ...(opts.grid ? { grid: opts.grid } : null),
  });
}

/**
 * True when there is nothing to animate. anime.js tolerates an empty target
 * list but logs "No target found" for it, and several call sites here query
 * optional parts — a SectionHeading with no lead, for one — so those would
 * otherwise fill the console on every page load.
 */
function isEmpty(targets: TargetsParam): boolean {
  return (
    targets == null ||
    ((targets instanceof NodeList || Array.isArray(targets)) &&
      targets.length === 0)
  );
}

/** The fadeUp replacement: up and in. */
export function revealOnScroll(
  targets: TargetsParam,
  opts: RevealOptions & { y?: number; x?: number } = {}
): JSAnimation | undefined {
  if (isEmpty(targets)) return;

  return animate(targets, {
    opacity: [0, 1],
    ...(opts.x != null ? { translateX: [opts.x, 0] } : null),
    translateY: [opts.y ?? 40, 0],
    duration: opts.duration ?? 520,
    ease: opts.ease ?? ARTEMIS_EASE,
    delay: toDelay(opts),
    autoplay: once(),
  });
}

/**
 * A horizontal rule drawing outward from its centre.
 *
 * The meander dividers are a <pattern>-filled <rect>, not stroked geometry, so
 * createDrawable cannot touch them — clipping the box is the equivalent gesture
 * and it works on any of them without knowing what is inside.
 */
export function unrollOnScroll(
  targets: TargetsParam,
  opts: RevealOptions = {}
): JSAnimation | undefined {
  if (isEmpty(targets)) return;

  return animate(targets, {
    opacity: [0, 1],
    clipPath: ["inset(0% 50% 0% 50%)", "inset(0% 0% 0% 0%)"],
    duration: opts.duration ?? 620,
    ease: opts.ease ?? ARTEMIS_EASE,
    delay: toDelay(opts),
    autoplay: once(),
  });
}

/**
 * A panel unrolling from its top edge, like a scroll being laid open.
 *
 * clip-path rather than scaleY so the parchment's texture, border and drop
 * shadow are revealed at their true size instead of being stretched into place.
 */
export function unfurlOnScroll(
  targets: TargetsParam,
  opts: RevealOptions = {}
): JSAnimation | undefined {
  if (isEmpty(targets)) return;

  return animate(targets, {
    opacity: [0, 1],
    clipPath: ["inset(0% 0% 100% 0%)", "inset(0% 0% 0% 0%)"],
    duration: opts.duration ?? 700,
    ease: opts.ease ?? ARTEMIS_EASE,
    delay: toDelay(opts),
    autoplay: once(),
  });
}

/**
 * Puts a drawn stroke back to a plain solid one.
 *
 * createDrawable works by giving each element a `pathLength` and animating
 * `stroke-dasharray` / `stroke-dashoffset`, and it leaves both in place when the
 * animation ends — a fully drawn stroke is really a dash pattern with no gap.
 * A dashed stroke is markedly more expensive to rasterise than a solid one, and
 * sixty-four of these live inside the hero's astrolabe, which rotates for as
 * long as the page is open. Left alone that is permanent raster work for a
 * pattern that is no longer doing anything, so the dash is dropped the moment
 * the drawing finishes.
 */
export function undash(geometry: SVGGeometryElement[]): void {
  geometry.forEach((el) => {
    // Attributes, not inline styles — createDrawable writes these with
    // setAttribute, so clearing el.style leaves the dash exactly where it was.
    el.removeAttribute("stroke-dasharray");
    el.removeAttribute("stroke-dashoffset");
    el.removeAttribute("pathLength");
    // createDrawable swaps the linecap to butt while a stroke is part-drawn and
    // restores it inline at the end; the markup's own value is correct again
    // once the dash is gone.
    el.style.strokeLinecap = "";
  });
}

/**
 * Stroked SVG that engraves itself.
 *
 * `container` is the wrapper carrying [data-draw] — it is what the CSS hides
 * pre-paint, so the strokes are never seen at full length. `selector` picks the
 * geometry inside it, and has to be explicit: several of the ornaments in
 * GreekOrnaments.tsx use a <rect> as a pattern fill or a mask, and running a
 * draw over one of those would blank the ornament rather than animate it.
 *
 * Elements are collected here rather than handed to createDrawable as a
 * selector string, so the query is unambiguously rooted at this container even
 * when several sections mount identical ornaments.
 */
export function drawOnScroll(
  container: HTMLElement | SVGElement | null,
  selector: string,
  opts: RevealOptions = {}
): JSAnimation | undefined {
  if (!container) return;

  const geometry = Array.from(
    container.querySelectorAll<SVGGeometryElement>(selector)
  );
  if (!geometry.length) return;

  const duration = opts.duration ?? 620;

  // When the last stroke will have finished, counting the stagger across all of
  // them. The cleanup is scheduled off the observer rather than hung on the
  // animation's onComplete: that callback does not fire for an animation whose
  // autoplay is a scroll observer, so the dash would simply stay on forever —
  // which is the bug this whole helper exists to avoid.
  const totalMs =
    (opts.delay ?? 0) +
    (opts.each ?? 0) * Math.max(0, geometry.length - 1) +
    duration;

  const animation = animate(createDrawable(geometry), {
    draw: ["0 0", "0 1"],
    duration,
    // Slight ease-in-out: an engraving tool accelerating away and settling, as
    // opposed to the decelerate-only curve the content reveals use.
    ease: opts.ease ?? eases.inOut(2),
    delay: toDelay(opts),
    autoplay: onScroll({
      enter: ENTER,
      repeat: false,
      onEnter: () => {
        window.setTimeout(() => undash(geometry), totalMs + 80);
      },
    }),
  });

  // The wrapper is unhidden by its own animation on the same threshold, rather
  // than set to 1 here and now. Both are hidden pre-paint by the [data-draw]
  // rule, and this way the ornament cannot be caught fully drawn between the
  // effect running and the observer firing — which for anything below the fold
  // is the whole length of the page.
  animate(container, {
    opacity: [0, 1],
    duration: 200,
    delay: opts.delay ?? 0,
    ease: ARTEMIS_EASE,
    autoplay: once(),
  });

  return animation;
}

/**
 * A line of type arriving word by word, which is what makes the Cinzel read as
 * inscribed rather than faded on.
 *
 * The words carry the animation and the element itself is unhidden once they
 * are in place — the same ordering drawOnScroll relies on, and the reason the
 * text never flashes un-split. `accessible` keeps the original string exposed
 * to assistive tech, so the split is invisible to a screen reader.
 */
export function revealWordsOnScroll(
  target: HTMLElement | null,
  opts: RevealOptions & { y?: number } = {}
): void {
  if (!target) return;

  const { words } = splitText(target, { chars: false, accessible: true });

  animate(words, {
    opacity: [0, 1],
    translateY: [opts.y ?? 38, 0],
    duration: opts.duration ?? 560,
    ease: opts.ease ?? ARTEMIS_EASE,
    delay: stagger(opts.each ?? 45, {
      start: opts.delay ?? 0,
      from: opts.from ?? "first",
    }),
    autoplay: once(),
  });

  // Same reasoning as drawOnScroll: the element is unhidden on the observer's
  // threshold rather than immediately, so a heading far down the page cannot be
  // shown before its own words have been put into their starting position.
  animate(target, {
    opacity: [0, 1],
    duration: 200,
    delay: opts.delay ?? 0,
    ease: ARTEMIS_EASE,
    autoplay: once(),
  });
}

/**
 * A SectionHeading entering as one gesture: starred eyebrow, then the title
 * word by word, then the lead. Every section on the page opens with this.
 */
export function revealHeadingOnScroll(
  container: HTMLElement | SVGElement | null,
  opts: { delay?: number } = {}
): void {
  if (!container) return;

  const base = opts.delay ?? 0;

  revealOnScroll(
    container.querySelectorAll("[data-heading-eyebrow]"),
    { y: 14, duration: 460, delay: base }
  );

  revealWordsOnScroll(
    container.querySelector<HTMLElement>("[data-heading-title]"),
    { delay: base + 60 }
  );

  revealOnScroll(
    container.querySelectorAll("[data-heading-lead]"),
    { y: 24, duration: 520, delay: base + 170 }
  );
}
