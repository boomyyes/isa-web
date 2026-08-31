"use client";

import { animate, spring } from "animejs";
import { CrescentBow, MeanderDivider } from "@/components/artemis/GreekOrnaments";
import {
  drawOnScroll,
  enterOnce,
  revealOnScroll,
  revealWordsOnScroll,
  unrollOnScroll,
} from "@/components/artemis/reveal";
import { useArtemisAnime } from "@/components/artemis/useArtemisAnime";
import { EPILOGUE } from "@/lib/artemis";

/**
 * The sign-off, mirroring the closing of the reference spread: a rule, a short
 * note, and a signature.
 *
 * Set directly on the cosmic ground rather than on parchment — the page opened
 * on paper and closes back under the sky, and two parchment panels bracketing
 * the page would make the Prologue read as a repeated template.
 *
 * The mark is built the same way as the hero's: the moon swells in while the
 * bow draws itself beneath. Deliberately the same gesture at a smaller size, so
 * the page closes on the note it opened with.
 */
export function EpilogueNote() {
  const root = useArtemisAnime<HTMLElement>((self) => {
    const el = self.root as HTMLElement;
    const mark = el.querySelector<HTMLElement>("[data-epilogue-mark]");

    // Ordered before drawOnScroll only for readability — both are created in
    // the same task, so neither is ever painted in its from-state.
    animate("[data-epilogue-mark] rect", {
      opacity: [0, 0.8],
      duration: 520,
      ease: spring({ stiffness: 90, damping: 14 }),
      autoplay: enterOnce(),
    });

    drawOnScroll(mark, "path", { duration: 620, each: 90, delay: 120 });

    unrollOnScroll("[data-epilogue-rule]", { each: 380, delay: 160 });
    revealWordsOnScroll(el.querySelector("[data-epilogue-heading]"), {
      delay: 250,
    });
    revealOnScroll("[data-epilogue-body] > p", {
      y: 26,
      delay: 340,
      each: 60,
    });
    revealOnScroll("[data-epilogue-signature]", { y: 18, delay: 480 });
  });

  return (
    <section
      ref={root}
      className="relative mx-auto max-w-3xl px-6 pb-24 pt-16 text-center md:pb-32 md:pt-24"
    >
      <div className="flex flex-col items-center">
        <span data-epilogue-mark data-draw className="block">
          <CrescentBow
            maskId="artemis-epilogue-crescent"
            className="h-16 w-16 text-[var(--artemis-gold)]"
          />
        </span>

        <div data-epilogue-rule data-unroll className="mt-6 w-full">
          <MeanderDivider className="text-[var(--artemis-gold)] opacity-60" />
        </div>

        <h2
          data-epilogue-heading
          data-reveal
          className="mt-8 font-cinzel text-2xl font-bold uppercase tracking-[0.28em] text-[var(--text-primary)] sm:text-3xl"
        >
          {EPILOGUE.heading}
        </h2>

        <div
          data-epilogue-body
          className="mt-6 space-y-4 font-cormorant text-lg leading-relaxed text-[var(--text-secondary)] sm:text-xl"
        >
          {EPILOGUE.paragraphs.map((paragraph, i) => (
            <p key={i} data-reveal>
              {paragraph}
            </p>
          ))}
        </div>

        <p
          data-epilogue-signature
          data-reveal
          className="mt-8 font-cinzel text-sm uppercase tracking-[0.25em] text-[var(--artemis-gold)]"
        >
          {EPILOGUE.signature}
        </p>

        <div data-epilogue-rule data-unroll className="mt-8 w-full">
          <MeanderDivider className="text-[var(--artemis-gold)] opacity-40" />
        </div>
      </div>
    </section>
  );
}
