"use client";

import { motion } from "framer-motion";
import { SectionHeading } from "@/components/artemis/SectionHeading";
import { AstrolabeOuter, StarGlyph } from "@/components/artemis/GreekOrnaments";
import { fadeUp, fadeUpDelayed } from "@/components/artemis/tokens";
import { TRACKS } from "@/lib/artemis";

/**
 * The four tracks, as gold-ringed medallions — the "Guiding Your Destiny" row
 * from the reference, with the photographs replaced by engraved discs.
 *
 * Each medallion is a circle with an astrolabe rim that turns only on hover, so
 * a row of four is still at rest by default. `group-hover` drives it via a class
 * rather than framer state; the reduced-motion block in globals.css already
 * covers the animation utility.
 */
export function TrackMedallions() {
  return (
    <section
      id="tracks"
      tabIndex={-1}
      className="relative scroll-mt-24 outline-none md:scroll-mt-28 mx-auto max-w-7xl px-6 py-16 md:py-24"
    >
      <motion.div {...fadeUp}>
        <SectionHeading
          eyebrow="The Four Paths"
          title="Choose your patron"
          lead="Every entrant sails under one of four names. Pick the one whose domain your build belongs to."
        />
      </motion.div>

      <div className="mt-14 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
        {TRACKS.map((track, i) => (
          <motion.article
            key={track.id}
            {...fadeUpDelayed(i)}
            className="group flex flex-col items-center text-center"
          >
            {/* Medallion */}
            <div className="relative h-40 w-40 sm:h-44 sm:w-44">
              {/* The named utility, not an arbitrary `animation:` value, so the
                  prefers-reduced-motion block in globals.css still catches it. */}
              <AstrolabeOuter className="absolute inset-0 h-full w-full text-[var(--artemis-gold)] opacity-45 transition-opacity duration-500 group-hover:animate-artemis-orbit group-hover:opacity-90" />

              <div className="absolute inset-[14%] flex flex-col items-center justify-center rounded-full border border-[var(--artemis-gold)]/30 bg-[var(--artemis-night)]/70 backdrop-blur-sm transition-colors duration-500 group-hover:border-[var(--artemis-gold)]/70">
                <StarGlyph className="h-3 w-3 text-[var(--artemis-gold-light)] opacity-70" />
                <h3 className="mt-2 font-cinzel text-lg font-bold uppercase tracking-[0.12em] text-[var(--text-primary)] sm:text-xl">
                  {track.name}
                </h3>
                <p className="mt-1 px-3 font-cormorant text-sm italic text-[var(--artemis-gold-light)]">
                  {track.domain}
                </p>
              </div>
            </div>

            <p className="mt-6 max-w-xs font-cormorant text-base leading-relaxed text-[var(--text-secondary)] sm:text-lg">
              {track.blurb}
            </p>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
