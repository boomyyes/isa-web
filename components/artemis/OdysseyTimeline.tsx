"use client";

import { motion } from "framer-motion";
import { SectionHeading } from "@/components/artemis/SectionHeading";
import { fadeUp, fadeUpDelayed } from "@/components/artemis/tokens";
import { ODYSSEY } from "@/lib/artemis";

/**
 * The schedule, as a vertical timeline on a gilt spine with diamond nodes —
 * the left rail from the reference spread.
 *
 * The spine is a single absolutely-positioned line behind the list rather than
 * a border on each row, so it never breaks between items of unequal height. It
 * stops short at both ends via a mask-free inset (top-2 / bottom-2) so it reads
 * as terminating at the first and last node rather than running off.
 */
export function OdysseyTimeline() {
  return (
    <section
      id="odyssey"
      tabIndex={-1}
      className="relative scroll-mt-24 outline-none md:scroll-mt-28 mx-auto max-w-4xl px-6 py-16 md:py-24"
    >
      <motion.div {...fadeUp}>
        <SectionHeading
          eyebrow="The Odyssey"
          title="Order of the night"
          lead="Times are provisional and will be fixed nearer the day."
        />
      </motion.div>

      <ol className="relative mt-14 space-y-8 pl-10 sm:pl-14">
        {/* Spine */}
        <span
          aria-hidden
          className="absolute bottom-2 left-[7px] top-2 w-px bg-gradient-to-b from-transparent via-[var(--artemis-gold)]/45 to-transparent sm:left-[11px]"
        />

        {ODYSSEY.map((stop, i) => (
          <motion.li key={stop.id} {...fadeUpDelayed(i, 0.06)} className="relative">
            {/* Node. Rotated square rather than a circle — it matches the
                diamonds punctuating the reference's rail. */}
            <span
              aria-hidden
              className="absolute -left-10 top-1.5 h-[15px] w-[15px] rotate-45 border border-[var(--artemis-gold)] bg-[var(--artemis-void)] sm:-left-14 sm:h-[23px] sm:w-[23px]"
            />
            <span
              aria-hidden
              className="absolute -left-[34px] top-[13px] h-[5px] w-[5px] rotate-45 bg-[var(--artemis-gold-light)] sm:-left-[45px] sm:top-[15px] sm:h-[7px] sm:w-[7px]"
            />

            <p className="font-cinzel text-xs font-semibold uppercase tracking-[0.3em] text-[var(--artemis-gold)]">
              {stop.time}
            </p>
            <h3 className="mt-1.5 font-cinzel text-xl font-bold text-[var(--text-primary)] sm:text-2xl">
              {stop.title}
            </h3>
            <p className="mt-2 font-cormorant text-base leading-relaxed text-[var(--text-secondary)] sm:text-lg">
              {stop.detail}
            </p>
          </motion.li>
        ))}
      </ol>
    </section>
  );
}
