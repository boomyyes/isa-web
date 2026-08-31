"use client";

import { animate, spring, scrambleText, stagger } from "animejs";
import { cn } from "@/lib/utils";
import { SectionHeading } from "@/components/artemis/SectionHeading";
import { Laurel } from "@/components/artemis/GreekOrnaments";
import {
  drawOnScroll,
  enterOnce,
  revealHeadingOnScroll,
  revealOnScroll,
} from "@/components/artemis/reveal";
import { ARTEMIS_CARD_SHADOW } from "@/components/artemis/tokens";
import { useArtemisAnime } from "@/components/artemis/useArtemisAnime";
import { BOONS } from "@/lib/artemis";

/**
 * The prizes, as three plinths under laurel.
 *
 * The first entry is the tall one. On desktop it is pulled up and given a
 * brighter rim so the row reads as a podium; on mobile the grid is a single
 * column and the lift is dropped — a "podium" one card wide is just a card
 * sitting slightly higher than the others for no reason.
 *
 * They rise in podium order, third to first, so the winner lands last. That
 * only makes sense while there is a podium to read: below md the grid is a
 * single column and the cards arrive top to bottom instead, which is the order
 * you actually scroll past them in.
 */

/** Milliseconds between plinths. */
const PLINTH_STEP = 85;

export function BoonsSection() {
  const root = useArtemisAnime<HTMLElement>((self) => {
    const el = self.root as HTMLElement;
    const podium = self.matches.md;

    revealHeadingOnScroll(el);

    el.querySelectorAll<HTMLElement>("[data-boon]").forEach((card, i) => {
      const base = 90 + (podium ? BOONS.length - 1 - i : i) * PLINTH_STEP;

      animate(card, {
        opacity: [0, 1],
        translateY: [56, 0],
        delay: base,
        ease: spring({ stiffness: 72, damping: 14 }),
        autoplay: enterOnce(),
      });

      // Only the stems are stroked geometry; the six leaves on each are filled
      // ellipses, so they are scaled in behind the stem instead — stem to tip,
      // which is the direction a wreath is drawn.
      drawOnScroll(
        card.querySelector<HTMLElement>("[data-boon-wreath]"),
        "path",
        { duration: 520, delay: base + 100 }
      );

      // Per wreath rather than per card, so the two halves grow together from
      // stem to tip instead of the left one finishing before the right starts.
      card
        .querySelectorAll<SVGSVGElement>("[data-boon-wreath] svg")
        .forEach((wreath) => {
          animate(wreath.querySelectorAll("ellipse"), {
            opacity: [0, 1],
            scale: [0, 1],
            delay: stagger(38, { start: base + 180 }),
            ease: spring({ stiffness: 130, damping: 14 }),
            autoplay: enterOnce(),
          });
        });

      revealOnScroll(card.querySelectorAll("[data-boon-rank]"), {
        y: 0,
        duration: 400,
        delay: base + 160,
      });

      revealOnScroll(card.querySelectorAll("[data-boon-title]"), {
        y: 18,
        duration: 460,
        delay: base + 250,
      });

      // The sum resolves out of noise rather than fading in — the one moment on
      // the page where a number is the thing being revealed. It reads the same
      // way against the current placeholder as it will against real figures.
      animate(card.querySelectorAll("[data-boon-amount]"), {
        opacity: [0, 1],
        textContent: scrambleText({ chars: "numbers", from: "left" }),
        delay: base + 250,
        autoplay: enterOnce(),
      });

      revealOnScroll(card.querySelectorAll("[data-boon-detail]"), {
        y: 18,
        duration: 420,
        delay: base + 300,
      });
    });
  });

  return (
    <section
      ref={root}
      id="boons"
      tabIndex={-1}
      className="relative scroll-mt-24 outline-none md:scroll-mt-28 mx-auto max-w-6xl px-6 py-16 md:py-24"
    >
      <SectionHeading
        eyebrow="The Boons"
        title="Gifts of the gods"
        lead="Laurels, and rather more practical rewards, for those whose work the judges favour."
      />

      <div className="mt-14 grid grid-cols-1 items-end gap-6 md:grid-cols-3 md:gap-5">
        {BOONS.map((boon, i) => {
          const isFirst = i === 0;

          return (
            <article
              key={boon.id}
              data-boon
              data-reveal
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
              <div
                data-boon-wreath
                data-draw
                className="flex items-center justify-center gap-1"
              >
                <Laurel
                  side="left"
                  className={cn(
                    "h-16 w-6 text-[var(--artemis-gold)]",
                    isFirst ? "opacity-80" : "opacity-45"
                  )}
                />
                <span
                  data-boon-rank
                  data-reveal
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

              <h3
                data-boon-title
                data-reveal
                className="mt-5 font-cinzel text-xl font-bold uppercase tracking-[0.15em] text-[var(--text-primary)]"
              >
                {boon.title}
              </h3>

              <p
                data-boon-amount
                data-reveal
                className={cn(
                  "mt-3 font-cinzel font-bold",
                  isFirst
                    ? "text-3xl text-[var(--artemis-gold-light)]"
                    : "text-2xl text-[var(--artemis-gold)]"
                )}
              >
                {boon.amount}
              </p>

              <p
                data-boon-detail
                data-reveal
                className="mt-4 font-cormorant text-base leading-relaxed text-[var(--text-secondary)] sm:text-lg"
              >
                {boon.detail}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
