"use client";

import { useEffect, useRef, useState } from "react";
import { animate, spring, scrambleText, stagger } from "animejs";
import { cn } from "@/lib/utils";
import { SectionHeading } from "@/components/artemis/SectionHeading";
import { StarGlyph } from "@/components/artemis/GreekOrnaments";
import {
  enterOnce,
  revealHeadingOnScroll,
  revealOnScroll,
} from "@/components/artemis/reveal";
import { ARTEMIS_CARD_SHADOW } from "@/components/artemis/tokens";
import {
  prefersReducedMotion,
  useArtemisAnime,
} from "@/components/artemis/useArtemisAnime";
import { CONSTELLATIONS } from "@/lib/artemis";

/**
 * Twelve themed tiles — the zodiac grid from the reference, repurposed as the
 * challenge themes. The page's signature block.
 *
 * One tile is selected at a time and its detail is printed below the grid, so
 * the grid itself stays a clean field of glyphs at any width instead of each
 * tile having to carry a paragraph. Selection is a real radio group: the tiles
 * are buttons in a `radiogroup`, which gets arrow-key semantics announced and
 * keeps the whole thing keyboard-reachable without custom key handling.
 *
 * Two animations, and they are deliberately separate. The grid enters as a wave
 * spreading out from the middle, which needs to know the column count — the
 * scope's media queries supply it, and the scope re-runs when one flips, so the
 * wave reshapes across breakpoints. Choosing a sign then scrambles the theme
 * into place, like an oracle resolving an answer; that runs from an ordinary
 * effect because it is keyed to React state rather than to scroll position.
 */
export function ConstellationGrid() {
  const [selectedId, setSelectedId] = useState(CONSTELLATIONS[0].id);
  const selected =
    CONSTELLATIONS.find((c) => c.id === selectedId) ?? CONSTELLATIONS[0];

  const root = useArtemisAnime<HTMLElement>((self) => {
    const el = self.root as HTMLElement;

    revealHeadingOnScroll(el);

    // Matches the responsive column counts on the grid below. `rows` only has
    // to be consistent with `cols` for the two-dimensional stagger to compute
    // sensible distances from the centre.
    const cols = self.matches.lg ? 6 : self.matches.sm ? 4 : 3;
    const rows = Math.ceil(CONSTELLATIONS.length / cols);

    animate("[data-sign]", {
      opacity: [0, 1],
      scale: [0.82, 1],
      translateY: [24, 0],
      delay: stagger(36, { start: 110, from: "center", grid: [cols, rows] }),
      ease: spring({ stiffness: 90, damping: 15 }),
      autoplay: enterOnce(),
    });

    revealOnScroll("[data-sign-detail]", { y: 30, delay: 430 });
  });

  // Skips the mount, where the first sign is simply already selected and its
  // detail card arrives with the rest of the section.
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }

    const el = root.current;
    if (!el || prefersReducedMotion()) return;

    const glyph = el.querySelector<HTMLElement>(
      '[data-sign="' + selectedId + '"] [data-sign-glyph]'
    );
    const theme = el.querySelector<HTMLElement>("[data-sign-theme]");

    const animations = [
      glyph &&
        animate(glyph, {
          scale: [1.5, 1],
          ease: spring({ stiffness: 210, damping: 11 }),
        }),
      theme &&
        animate(theme, {
          // React has already written the new theme into the DOM by the time
          // this runs, and scrambleText resolves toward whatever text the
          // element currently holds — so it lands on the right answer without
          // being told what it is.
          textContent: scrambleText({ chars: "uppercase", from: "center" }),
        }),
    ];

    return () => {
      animations.forEach((animation) => animation && animation.revert());
    };
  }, [selectedId, root]);

  return (
    <section
      ref={root}
      id="trials"
      tabIndex={-1}
      className="relative scroll-mt-24 outline-none md:scroll-mt-28 mx-auto max-w-7xl px-6 py-16 md:py-24"
    >
      <SectionHeading
        eyebrow="The Twelve Trials"
        title="Read the wheel"
        lead="Twelve houses, twelve problems. Consult the wheel below — each sign carries a theme you may build against."
      />

      <div
        role="radiogroup"
        aria-label="Challenge themes by sign"
        className="mt-14 grid grid-cols-3 gap-3 sm:grid-cols-4 sm:gap-4 lg:grid-cols-6"
      >
        {CONSTELLATIONS.map((sign) => {
          const active = sign.id === selectedId;

          return (
            <button
              key={sign.id}
              data-sign={sign.id}
              data-reveal
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setSelectedId(sign.id)}
              style={{ boxShadow: ARTEMIS_CARD_SHADOW }}
              className={cn(
                "group relative flex aspect-square flex-col items-center justify-center gap-1 rounded-sm border px-2 py-4 transition-colors duration-300",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--artemis-gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--artemis-void)]",
                active
                  ? "border-[var(--artemis-gold)]/80 bg-[var(--artemis-nebula)]/70"
                  : "border-[var(--artemis-gold)]/20 bg-[var(--artemis-night)]/50 hover:border-[var(--artemis-gold)]/50 hover:bg-[var(--artemis-nebula)]/50"
              )}
            >
              {/* Corner ticks — a cheap way to make a plain square read as an
                  engraved plate. Only the active tile shows all four. */}
              <span
                aria-hidden
                className={cn(
                  "absolute inset-1.5 border border-[var(--artemis-gold)] transition-opacity duration-300",
                  active ? "opacity-25" : "opacity-0 group-hover:opacity-15"
                )}
              />

              <span
                aria-hidden
                data-sign-glyph
                className={cn(
                  "font-cinzel text-2xl leading-none transition-colors duration-300 sm:text-3xl",
                  active
                    ? "text-[var(--artemis-gold-light)]"
                    : "text-[var(--artemis-gold)]/70 group-hover:text-[var(--artemis-gold)]"
                )}
              >
                {sign.glyph}
              </span>

              <span
                className={cn(
                  "font-cinzel text-[0.62rem] font-semibold uppercase tracking-[0.14em] transition-colors duration-300 sm:text-[0.7rem]",
                  active ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"
                )}
              >
                {sign.name}
              </span>

              <span className="px-1 text-center font-cormorant text-[0.6rem] leading-tight text-[var(--text-secondary)]/70 sm:text-[0.68rem]">
                {sign.span}
              </span>
            </button>
          );
        })}
      </div>

      {/* Detail for the selected sign.
          The announcement is a separate visually-hidden node rather than
          aria-live on the card itself. The scramble rewrites the visible line
          around thirty times a second, and a live region wrapped around that
          would read a screen-reader user thirty strings of noise; this one is
          only ever written by React, so it announces the theme once. */}
      <p aria-live="polite" className="sr-only">
        {"House of " + selected.name + ". " + selected.theme}
      </p>

      <div
        data-sign-detail
        data-reveal
        aria-hidden
        className="mt-10 flex flex-col items-center rounded-sm border border-[var(--artemis-gold)]/25 bg-[var(--artemis-night)]/50 px-6 py-8 text-center backdrop-blur-sm"
        style={{ boxShadow: ARTEMIS_CARD_SHADOW }}
      >
        <StarGlyph className="animate-artemis-twinkle h-3 w-3 text-[var(--artemis-gold-light)]" />
        <p className="mt-3 font-cinzel text-xs uppercase tracking-[0.35em] text-[var(--artemis-gold)]">
          House of {selected.name}
        </p>
        <p
          data-sign-theme
          className="mt-3 max-w-2xl font-cormorant text-xl italic leading-relaxed text-[var(--text-primary)] sm:text-2xl"
        >
          {selected.theme}
        </p>
      </div>
    </section>
  );
}
