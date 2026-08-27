"use client";

import { motion } from "framer-motion";
import { CalendarDays, MapPin } from "lucide-react";
import { AngularButton } from "@/components/ui/AngularButton";
import {
  AstrolabeInner,
  AstrolabeOuter,
  CrescentBow,
  MeanderDivider,
  StarGlyph,
} from "@/components/artemis/GreekOrnaments";
import { scrollToSection } from "@/components/artemis/scrollToSection";
import { ARTEMIS } from "@/lib/artemis";

/**
 * The opening. A counter-rotating astrolabe sits behind the wordmark, with the
 * crescent-and-bow mark above it.
 *
 * The two astrolabe rings turn at different speeds in opposite directions — one
 * ring alone reads as a spinning graphic, two reads as an instrument. Both are
 * CSS animations rather than framer-motion so the existing
 * prefers-reduced-motion block in globals.css switches them off; framer's own
 * MotionConfig only covers motion components.
 */
export function ArtemisHero() {
  return (
    // id + tabIndex make the hero a scroll target like every other section, so
    // the back-to-top control is an ordinary #top link and reuses the same
    // animation. scroll-mt is deliberately absent: clamping in resolveTargetY
    // takes the negative result to 0, which is the actual top of the page.
    <section
      id="top"
      tabIndex={-1}
      className="relative flex min-h-[92vh] flex-col items-center justify-center px-6 pb-20 pt-32 outline-none md:pt-40"
    >
      {/* Astrolabe. Sized in vw so it stays a backdrop rather than colliding
          with the wordmark on narrow screens, and capped so it does not
          swallow the section on a wide desktop. */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[min(78vw,620px)] w-[min(78vw,620px)] -translate-x-1/2 -translate-y-1/2"
      >
        <AstrolabeOuter className="animate-artemis-orbit absolute inset-0 h-full w-full text-[var(--artemis-gold)] opacity-40" />
        <AstrolabeInner className="animate-artemis-orbit-reverse absolute inset-0 h-full w-full text-[var(--artemis-gold-light)] opacity-30" />
      </div>

      <div className="relative flex flex-col items-center text-center">
        {/* Mark */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.33, 1, 0.68, 1] }}
        >
          <CrescentBow
            maskId="artemis-hero-crescent"
            className="h-20 w-20 text-[var(--artemis-gold)] sm:h-24 sm:w-24"
          />
        </motion.div>

        {/* Eyebrow */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.33, 1, 0.68, 1] }}
          className="mt-6 flex items-center gap-3 font-cinzel text-[0.68rem] font-semibold uppercase tracking-[0.5em] text-[var(--artemis-gold-light)]"
        >
          <StarGlyph className="animate-artemis-twinkle h-2 w-2" />
          {ARTEMIS.eyebrow}
          <StarGlyph className="animate-artemis-twinkle h-2 w-2" />
        </motion.p>

        {/* Wordmark. The tracking is wide enough that the trailing letter-space
            would push the block visually off-centre, so the last letter carries
            a negative margin to pull it back. */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25, ease: [0.33, 1, 0.68, 1] }}
          className="artemis-gilt mt-4 font-cinzel text-[clamp(2.75rem,13vw,8.5rem)] font-bold leading-[0.95] tracking-[0.08em] [margin-right:-0.08em]"
        >
          ARTEMIS
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4, ease: [0.33, 1, 0.68, 1] }}
          className="font-cinzel text-lg uppercase tracking-[0.6em] text-[var(--text-primary)] [margin-right:-0.6em] sm:text-2xl"
        >
          Hackathon
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="mt-8 w-full text-[var(--artemis-gold)] opacity-70"
        >
          <MeanderDivider />
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.55, ease: [0.33, 1, 0.68, 1] }}
          className="mt-6 max-w-xl font-cormorant text-xl italic leading-relaxed text-[var(--text-secondary)] sm:text-2xl"
        >
          {ARTEMIS.tagline}
        </motion.p>

        {/* Date + venue chips */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.65, ease: [0.33, 1, 0.68, 1] }}
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--artemis-gold)]/35 bg-[var(--artemis-night)]/60 px-4 py-2 font-cinzel text-xs uppercase tracking-[0.2em] text-[var(--artemis-gold-light)] backdrop-blur-sm">
            <CalendarDays className="h-3.5 w-3.5" />
            {ARTEMIS.when}
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--artemis-gold)]/35 bg-[var(--artemis-night)]/60 px-4 py-2 font-cinzel text-xs uppercase tracking-[0.2em] text-[var(--artemis-gold-light)] backdrop-blur-sm">
            <MapPin className="h-3.5 w-3.5" />
            {ARTEMIS.venue}
          </span>
        </motion.div>

        {/* CTAs. AngularButton reads --accent-color / --border-active, both of
            which the .artemis scope has already remapped to gold.

            These stay real anchors with a real href — middle-click, "copy link
            address" and a JS-less load all keep working — and scrollToSection
            takes over on a plain left click, purely so that pressing the same
            button twice works. See its comment. */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.75, ease: [0.33, 1, 0.68, 1] }}
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          <AngularButton
            href="#register"
            onClick={(e) => scrollToSection(e, "register")}
            className="font-cinzel tracking-[0.2em]"
          >
            Claim your fate
          </AngularButton>
          <AngularButton
            href="#prologue"
            variant="outline"
            onClick={(e) => scrollToSection(e, "prologue")}
            className="font-cinzel tracking-[0.2em]"
          >
            Read the omens
          </AngularButton>
        </motion.div>
      </div>
    </section>
  );
}
