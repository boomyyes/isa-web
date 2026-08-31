/**
 * Shared style constants for the Artemis page.
 *
 * These are the values that repeat across sections but are awkward as Tailwind
 * classes — long shadow stacks and gradient strings. Colour tokens themselves
 * live in app/globals.css under `.artemis`, and the scroll reveals that used to
 * live here are now in components/artemis/reveal.ts; this file is only for
 * composites that several components have to keep identical.
 */

/** Warm drop shadow under a parchment panel — paper lifted off a dark ground. */
export const ARTEMIS_PANEL_SHADOW =
  "0 24px 60px -20px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(140, 106, 42, 0.35)";

/** The gilt hairline + inner glow used on cosmic-ground cards and tiles. */
export const ARTEMIS_CARD_SHADOW =
  "inset 0 1px 0 rgba(242, 208, 138, 0.14), 0 18px 40px -24px rgba(0, 0, 0, 0.9)";
