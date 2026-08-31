"use client";

import { animate, eases, spring } from "animejs";
import { SectionHeading } from "@/components/artemis/SectionHeading";
import { ParchmentPanel } from "@/components/artemis/ParchmentPanel";
import {
  enterOnce,
  revealHeadingOnScroll,
} from "@/components/artemis/reveal";
import { useArtemisAnime } from "@/components/artemis/useArtemisAnime";
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
 *
 * They also arrive that way: each card falls from above at a wider angle than
 * it will settle at, on a spring, one after another — three sheets dropped onto
 * a table rather than three boxes fading in.
 */

/**
 * Resting tilt in degrees, cycled across the cards.
 *
 * These are inline transforms rather than Tailwind's `-rotate-1` because
 * anime.js writes the composed `transform` inline while animating, which would
 * outrank a class for the rest of the page's life. Keeping the resting value in
 * the same place the animation writes to means the two never disagree — and it
 * is what leaves the cards correctly tilted under prefers-reduced-motion, where
 * no animation runs at all.
 */
const TILTS = [-1, 1, -2];

/** How much wider the angle is at the top of the fall. */
const DROP_TILT = 4;

export function OracleQuotes() {
  const root = useArtemisAnime<HTMLElement>((self) => {
    const el = self.root as HTMLElement;

    revealHeadingOnScroll(el);

    const cards = Array.from(
      el.querySelectorAll<HTMLElement>("[data-oracle-card]")
    );

    // Hover straightens a sheet, as if picking it up to read. It has to be an
    // animation rather than the `hover:rotate-0` class it replaces, for the
    // same reason the resting tilt is inline: while anime.js owns `transform`
    // on this element, no class can reach it.
    const cleanups = cards.map((card, i) => {
      const rest = TILTS[i % TILTS.length];

      animate(card, {
        opacity: [0, 1],
        translateY: [-48, 0],
        rotate: [rest * DROP_TILT, rest],
        ease: spring({ stiffness: 64, damping: 10 }),
        delay: 150 * i,
        autoplay: enterOnce(),
      });

      const straighten = () =>
        animate(card, { rotate: 0, duration: 450, ease: eases.out(3) });
      const settle = () =>
        animate(card, { rotate: rest, duration: 550, ease: eases.out(3) });

      card.addEventListener("pointerenter", straighten);
      card.addEventListener("pointerleave", settle);
      // Keyboard users reach the card through the text inside it, so focus
      // gets the same treatment as hover.
      card.addEventListener("focusin", straighten);
      card.addEventListener("focusout", settle);

      return () => {
        card.removeEventListener("pointerenter", straighten);
        card.removeEventListener("pointerleave", settle);
        card.removeEventListener("focusin", straighten);
        card.removeEventListener("focusout", settle);
      };
    });

    return () => cleanups.forEach((off) => off());
  });

  return (
    <section
      ref={root}
      id="oracle"
      tabIndex={-1}
      className="relative scroll-mt-24 outline-none md:scroll-mt-28 mx-auto max-w-7xl px-6 py-16 md:py-24"
    >
      <SectionHeading
        eyebrow="The Oracle Speaks"
        title="Voices from past trials"
        lead="What those who came before had to say once the dust settled."
      />

      <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-3">
        {ORACLE_QUOTES.map((entry, i) => (
          <div
            key={entry.id}
            data-oracle-card
            data-reveal
            style={{
              transform: "rotate(" + TILTS[i % TILTS.length] + "deg)",
            }}
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
          </div>
        ))}
      </div>
    </section>
  );
}
