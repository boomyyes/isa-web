/**
 * Shared style constants for the Artemis page.
 *
 * These are the values that repeat across sections but are awkward as Tailwind
 * classes — long shadow stacks, gradient strings, the scroll-reveal transition.
 * Colour tokens themselves live in app/globals.css under `.artemis`; this file
 * is only for composites that several components have to keep identical.
 */

/** Warm drop shadow under a parchment panel — paper lifted off a dark ground. */
export const ARTEMIS_PANEL_SHADOW =
  "0 24px 60px -20px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(140, 106, 42, 0.35)";

/** The gilt hairline + inner glow used on cosmic-ground cards and tiles. */
export const ARTEMIS_CARD_SHADOW =
  "inset 0 1px 0 rgba(242, 208, 138, 0.14), 0 18px 40px -24px rgba(0, 0, 0, 0.9)";

/**
 * The site's standard scroll-reveal, matching the dominant idiom in
 * components/sections/*. Spread onto a motion element:
 *
 *   <motion.div {...fadeUp}>
 *
 * The `as const` on the ease tuple is required — framer-motion types it as a
 * fixed-length tuple, and a bare array widens to number[] under strict TS.
 */
export const fadeUp = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.6, ease: [0.33, 1, 0.68, 1] as const },
};

/** Same reveal, with a per-index stagger for grids and lists. */
export function fadeUpDelayed(index: number, step = 0.08) {
  return {
    ...fadeUp,
    transition: { ...fadeUp.transition, delay: index * step },
  };
}
