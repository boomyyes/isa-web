"use client";

import { animate, spring } from "animejs";
import { SectionHeading } from "@/components/artemis/SectionHeading";
import { AstrolabeOuter, StarGlyph } from "@/components/artemis/GreekOrnaments";
import {
  drawOnScroll,
  enterOnce,
  revealHeadingOnScroll,
  revealOnScroll,
} from "@/components/artemis/reveal";
import { useArtemisAnime } from "@/components/artemis/useArtemisAnime";
import { TRACKS } from "@/lib/artemis";

/**
 * The four tracks, as gold-ringed medallions — the "Guiding Your Destiny" row
 * from the reference, with the photographs replaced by engraved discs.
 *
 * Each medallion is a circle with an astrolabe rim that turns only on hover, so
 * a row of four is still at rest by default. `group-hover` drives it via a class
 * rather than a JS handler; the reduced-motion block in globals.css already
 * covers the animation utility.
 *
 * The rims engrave themselves on the way in. AstrolabeOuter is two circles and
 * sixty graduated tick marks, all stroked, so createDrawable can walk the lot —
 * staggered from the middle of the run outward, it reads as an instrument being
 * scribed rather than a graphic fading up. The medallions are offset from each
 * other so the row is scribed left to right.
 */

/** Milliseconds between medallions. */
const MEDALLION_STEP = 80;

export function TrackMedallions() {
  const root = useArtemisAnime<HTMLElement>((self) => {
    const el = self.root as HTMLElement;

    revealHeadingOnScroll(el);

    el.querySelectorAll<HTMLElement>("[data-track]").forEach((track, i) => {
      const base = 80 + i * MEDALLION_STEP;

      drawOnScroll(
        track.querySelector<HTMLElement>("[data-track-rim]"),
        // Only the stroked geometry. Named explicitly because a blanket
        // selector would also catch any <rect> used as a pattern or mask fill
        // elsewhere in GreekOrnaments and blank the ornament instead of
        // drawing it.
        "circle, line",
        { duration: 600, each: 4, from: "center", delay: base }
      );

      animate(track.querySelectorAll("[data-track-disc]"), {
        opacity: [0, 1],
        scale: [0.62, 1],
        delay: base + 150,
        ease: spring({ stiffness: 78, damping: 13 }),
        autoplay: enterOnce(),
      });

      revealOnScroll(track.querySelectorAll("[data-track-blurb]"), {
        y: 22,
        duration: 460,
        delay: base + 210,
      });
    });
  });

  return (
    <section
      ref={root}
      id="tracks"
      tabIndex={-1}
      className="relative scroll-mt-24 outline-none md:scroll-mt-28 mx-auto max-w-7xl px-6 py-16 md:py-24"
    >
      <SectionHeading
        eyebrow="The Four Paths"
        title="Choose your patron"
        lead="Every entrant sails under one of four names. Pick the one whose domain your build belongs to."
      />

      <div className="mt-14 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
        {TRACKS.map((track) => (
          <article
            key={track.id}
            data-track
            className="group flex flex-col items-center text-center"
          >
            {/* Medallion */}
            <div className="relative h-40 w-40 sm:h-44 sm:w-44">
              {/* The rim's resting opacity stays on the SVG so the [data-draw]
                  wrapper only ever goes 0 -> 1. The named utility, not an
                  arbitrary `animation:` value, so the prefers-reduced-motion
                  block in globals.css still catches the hover spin. */}
              <span
                data-track-rim
                data-draw
                className="absolute inset-0 block h-full w-full"
              >
                <AstrolabeOuter className="h-full w-full text-[var(--artemis-gold)] opacity-45 transition-opacity duration-500 group-hover:animate-artemis-orbit group-hover:opacity-90" />
              </span>

              <div
                data-track-disc
                data-reveal
                className="absolute inset-[14%] flex flex-col items-center justify-center rounded-full border border-[var(--artemis-gold)]/30 bg-[var(--artemis-night)]/70 backdrop-blur-sm transition-colors duration-500 group-hover:border-[var(--artemis-gold)]/70"
              >
                <StarGlyph className="h-3 w-3 text-[var(--artemis-gold-light)] opacity-70" />
                <h3 className="mt-2 font-cinzel text-lg font-bold uppercase tracking-[0.12em] text-[var(--text-primary)] sm:text-xl">
                  {track.name}
                </h3>
                <p className="mt-1 px-3 font-cormorant text-sm italic text-[var(--artemis-gold-light)]">
                  {track.domain}
                </p>
              </div>
            </div>

            <p
              data-track-blurb
              data-reveal
              className="mt-6 max-w-xs font-cormorant text-base leading-relaxed text-[var(--text-secondary)] sm:text-lg"
            >
              {track.blurb}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
