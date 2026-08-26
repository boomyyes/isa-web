"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { SectionHeading } from "@/components/artemis/SectionHeading";
import { Laurel } from "@/components/artemis/GreekOrnaments";
import { ARTEMIS_CARD_SHADOW, fadeUp, fadeUpDelayed } from "@/components/artemis/tokens";
import { BOONS } from "@/lib/artemis";

/**
 * The prizes, as three plinths under laurel.
 *
 * The first entry is the tall one. On desktop it is pulled up and given a
 * brighter rim so the row reads as a podium; on mobile the grid is a single
 * column and the lift is dropped — a "podium" one card wide is just a card
 * sitting slightly higher than the others for no reason.
 */
export function BoonsSection() {
  return (
    <section
      id="boons"
      tabIndex={-1}
      className="relative scroll-mt-24 outline-none md:scroll-mt-28 mx-auto max-w-6xl px-6 py-16 md:py-24"
    >
      <motion.div {...fadeUp}>
        <SectionHeading
          eyebrow="The Boons"
          title="Gifts of the gods"
          lead="Laurels, and rather more practical rewards, for those whose work the judges favour."
        />
      </motion.div>

      <div className="mt-14 grid grid-cols-1 items-end gap-6 md:grid-cols-3 md:gap-5">
        {BOONS.map((boon, i) => {
          const isFirst = i === 0;

          return (
            <motion.article
              key={boon.id}
              {...fadeUpDelayed(i, 0.1)}
              style={{ boxShadow: ARTEMIS_CARD_SHADOW }}
              className={cn(
                "relative flex flex-col items-center rounded-sm border bg-[var(--artemis-night)]/55 px-6 text-center backdrop-blur-sm transition-colors duration-300",
                isFirst
                  ? "border-[var(--artemis-gold)]/60 py-12 md:order-2 md:-translate-y-6 md:py-16"
                  : "border-[var(--artemis-gold)]/25 py-10 hover:border-[var(--artemis-gold)]/45",
                // Silver reads second, bronze third — the source order is
                // first/second/third, so the flanks are reordered on desktop.
                i === 1 && "md:order-1",
                i === 2 && "md:order-3"
              )}
            >
              {/* Laurel pair, flanking the rank numeral. */}
              <div className="flex items-center justify-center gap-1">
                <Laurel
                  side="left"
                  className={cn(
                    "h-16 w-6 text-[var(--artemis-gold)]",
                    isFirst ? "opacity-80" : "opacity-45"
                  )}
                />
                <span
                  className={cn(
                    "font-cinzel font-bold leading-none",
                    isFirst
                      ? "artemis-gilt text-6xl md:text-7xl"
                      : "text-5xl text-[var(--artemis-gold)]/80"
                  )}
                >
                  {boon.rank}
                </span>
                <Laurel
                  side="right"
                  className={cn(
                    "h-16 w-6 text-[var(--artemis-gold)]",
                    isFirst ? "opacity-80" : "opacity-45"
                  )}
                />
              </div>

              <h3 className="mt-5 font-cinzel text-xl font-bold uppercase tracking-[0.15em] text-[var(--text-primary)]">
                {boon.title}
              </h3>

              <p
                className={cn(
                  "mt-3 font-cinzel font-bold",
                  isFirst
                    ? "text-3xl text-[var(--artemis-gold-light)]"
                    : "text-2xl text-[var(--artemis-gold)]"
                )}
              >
                {boon.amount}
              </p>

              <p className="mt-4 font-cormorant text-base leading-relaxed text-[var(--text-secondary)] sm:text-lg">
                {boon.detail}
              </p>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}
