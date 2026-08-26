"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { SectionHeading } from "@/components/artemis/SectionHeading";
import { ParchmentPanel } from "@/components/artemis/ParchmentPanel";
import { fadeUp, fadeUpDelayed } from "@/components/artemis/tokens";
import { ORACLE_QUOTES } from "@/lib/artemis";

/**
 * Participant quotes, set on paper — the testimonial band from the reference,
 * traded for pinned notes.
 *
 * Each card is a ParchmentPanel, so the cream scope inverts the text colours
 * for free. The cards are given alternating slight rotations so the row reads
 * as three pieces of paper laid down rather than a tidy grid of boxes; the
 * rotation is on the wrapper, not the panel, so the panel's own shadow does not
 * skew with it.
 */
/** Cycled across the cards so the row reads as laid-down paper, not a grid. */
const TILTS = ["-rotate-1", "rotate-1", "-rotate-2"];

export function OracleQuotes() {
  return (
    <section
      id="oracle"
      tabIndex={-1}
      className="relative scroll-mt-24 outline-none md:scroll-mt-28 mx-auto max-w-7xl px-6 py-16 md:py-24"
    >
      <motion.div {...fadeUp}>
        <SectionHeading
          eyebrow="The Oracle Speaks"
          title="Voices from past trials"
          lead="What those who came before had to say once the dust settled."
        />
      </motion.div>

      <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-3">
        {ORACLE_QUOTES.map((entry, i) => (
          <motion.div
            key={entry.id}
            {...fadeUpDelayed(i)}
            className={cn(
              "transition-transform duration-500 hover:rotate-0",
              // Written as whole literal classes, not built from a value:
              // Tailwind scans source text, so an interpolated class name would
              // never be generated. Inline styles are avoided here for the same
              // reason the hover exists — an inline transform would outrank it.
              TILTS[i % TILTS.length]
            )}
          >
            <ParchmentPanel
              meander={false}
              className="h-full"
              contentClassName="flex h-full flex-col p-7 sm:p-8 md:p-9"
            >
              {/* Oversized opening quote, as a printed ornament. */}
              <span
                aria-hidden
                className="font-cinzel text-6xl leading-[0.6] text-[var(--artemis-oxblood)] opacity-30"
              >
                &ldquo;
              </span>

              <blockquote className="mt-3 flex-1 font-cormorant text-lg italic leading-relaxed text-[var(--text-primary)] sm:text-xl">
                {entry.quote}
              </blockquote>

              <footer className="mt-6 border-t border-[var(--artemis-oxblood)]/25 pt-4">
                <p className="font-cinzel text-sm font-bold uppercase tracking-[0.16em] text-[var(--artemis-navy)]">
                  {entry.name}
                </p>
                <p className="mt-1 font-cormorant text-sm text-[var(--text-secondary)]">
                  {entry.attribution}
                </p>
              </footer>
            </ParchmentPanel>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
