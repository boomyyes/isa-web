"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { SectionHeading } from "@/components/artemis/SectionHeading";
import { StarGlyph } from "@/components/artemis/GreekOrnaments";
import { ARTEMIS_CARD_SHADOW, fadeUp, fadeUpDelayed } from "@/components/artemis/tokens";
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
 */
export function ConstellationGrid() {
  const [selectedId, setSelectedId] = useState(CONSTELLATIONS[0].id);
  const selected =
    CONSTELLATIONS.find((c) => c.id === selectedId) ?? CONSTELLATIONS[0];

  return (
    <section
      id="trials"
      tabIndex={-1}
      className="relative scroll-mt-24 outline-none md:scroll-mt-28 mx-auto max-w-7xl px-6 py-16 md:py-24"
    >
      <motion.div {...fadeUp}>
        <SectionHeading
          eyebrow="The Twelve Trials"
          title="Read the wheel"
          lead="Twelve houses, twelve problems. Consult the wheel below — each sign carries a theme you may build against."
        />
      </motion.div>

      <div
        role="radiogroup"
        aria-label="Challenge themes by sign"
        className="mt-14 grid grid-cols-3 gap-3 sm:grid-cols-4 sm:gap-4 lg:grid-cols-6"
      >
        {CONSTELLATIONS.map((sign, i) => {
          const active = sign.id === selectedId;

          return (
            <motion.button
              key={sign.id}
              {...fadeUpDelayed(i, 0.04)}
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
            </motion.button>
          );
        })}
      </div>

      {/* Detail for the selected sign. aria-live so a screen-reader user hears
          the theme change without moving focus off the tile they just picked. */}
      <motion.div
        {...fadeUp}
        aria-live="polite"
        className="mt-10 flex flex-col items-center rounded-sm border border-[var(--artemis-gold)]/25 bg-[var(--artemis-night)]/50 px-6 py-8 text-center backdrop-blur-sm"
        style={{ boxShadow: ARTEMIS_CARD_SHADOW }}
      >
        <StarGlyph className="animate-artemis-twinkle h-3 w-3 text-[var(--artemis-gold-light)]" />
        <p className="mt-3 font-cinzel text-xs uppercase tracking-[0.35em] text-[var(--artemis-gold)]">
          House of {selected.name}
        </p>
        <p className="mt-3 max-w-2xl font-cormorant text-xl italic leading-relaxed text-[var(--text-primary)] sm:text-2xl">
          {selected.theme}
        </p>
      </motion.div>
    </section>
  );
}
