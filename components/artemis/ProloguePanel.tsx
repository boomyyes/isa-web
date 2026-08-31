"use client";

import { animate } from "animejs";
import { ParchmentPanel } from "@/components/artemis/ParchmentPanel";
import { Astrolabe, MeanderDivider } from "@/components/artemis/GreekOrnaments";
import {
  ARTEMIS_EASE,
  useArtemisAnime,
} from "@/components/artemis/useArtemisAnime";
import {
  enterOnce,
  revealOnScroll,
  revealWordsOnScroll,
  unfurlOnScroll,
  unrollOnScroll,
} from "@/components/artemis/reveal";
import { PROLOGUE } from "@/lib/artemis";

/**
 * The opening note, set on paper — the "Reader's Note" beat from the reference
 * spread. First paragraph takes a drop cap; the rest run as plain serif prose.
 *
 * The drop cap is `::first-letter`, not a wrapped span, so it stays correct if
 * the copy is swapped in lib/artemis.ts without touching this file.
 *
 * That is also why the prose is revealed a paragraph at a time rather than a
 * line at a time. anime.js's splitText rewrites an element's innerHTML into
 * per-line spans, which would put the drop cap's `::first-letter` on a span
 * instead of the paragraph and lose it — and line splitting has to re-run on
 * every resize, which would replay a reveal the visitor had already watched.
 */
export function ProloguePanel() {
  const root = useArtemisAnime<HTMLElement>((self) => {
    const el = self.root as HTMLElement;

    // The paper is laid open first, so everything below is revealed onto a
    // surface that already exists.
    unfurlOnScroll("[data-prologue-panel]", { duration: 780 });

    // The engraving settles into place as if it were stamped on the sheet.
    animate("[data-prologue-astrolabe]", {
      opacity: [0, 1],
      rotate: [-40, 0],
      scale: [0.85, 1],
      duration: 900,
      ease: ARTEMIS_EASE,
      delay: 140,
      autoplay: enterOnce(),
    });

    revealWordsOnScroll(el.querySelector("[data-prologue-heading]"), {
      delay: 210,
    });
    unrollOnScroll("[data-prologue-rule]", { delay: 300 });
    revealOnScroll("[data-prologue-body] > p", {
      y: 26,
      delay: 380,
      each: 70,
    });
    revealOnScroll("[data-prologue-signature]", { y: 18, delay: 620 });
  });

  return (
    <section
      ref={root}
      id="prologue"
      tabIndex={-1}
      className="relative scroll-mt-24 outline-none md:scroll-mt-28 mx-auto max-w-5xl px-6 py-16 md:py-24"
    >
      <div data-prologue-panel data-unfurl>
        <ParchmentPanel corners>
          {/* Engraving, bled off the top-right corner as on the reference. The
              wrapper is what animates: the opacity that makes it read as a
              watermark stays on the Astrolabe itself, so the animation is
              always a plain 0 -> 1 and never has to know the resting value. */}
          <div
            aria-hidden
            data-prologue-astrolabe
            data-reveal
            className="absolute -right-8 -top-10"
          >
            <Astrolabe className="h-40 w-40 text-[var(--artemis-oxblood)] opacity-[0.12] sm:h-52 sm:w-52" />
          </div>

          <div className="relative">
            <h2
              data-prologue-heading
              data-reveal
              className="font-cinzel text-3xl font-bold uppercase tracking-[0.2em] text-[var(--artemis-navy)] sm:text-4xl"
            >
              {PROLOGUE.heading}
            </h2>

            <div data-prologue-rule data-unroll className="mt-6">
              <MeanderDivider className="justify-start text-[var(--artemis-oxblood)] opacity-60" />
            </div>

            <div
              data-prologue-body
              className="mt-6 space-y-5 font-cormorant text-lg leading-relaxed text-[var(--text-primary)] sm:text-xl
                         [&>p:first-of-type::first-letter]:float-left
                         [&>p:first-of-type::first-letter]:mr-3
                         [&>p:first-of-type::first-letter]:mt-1
                         [&>p:first-of-type::first-letter]:font-cinzel
                         [&>p:first-of-type::first-letter]:text-6xl
                         [&>p:first-of-type::first-letter]:font-bold
                         [&>p:first-of-type::first-letter]:leading-[0.8]
                         [&>p:first-of-type::first-letter]:text-[var(--artemis-oxblood)]"
            >
              {PROLOGUE.paragraphs.map((paragraph, i) => (
                <p key={i} data-reveal>
                  {paragraph}
                </p>
              ))}
            </div>

            <p
              data-prologue-signature
              data-reveal
              className="mt-8 font-cinzel text-sm uppercase tracking-[0.25em] text-[var(--artemis-oxblood)]"
            >
              {PROLOGUE.signature}
            </p>
          </div>
        </ParchmentPanel>
      </div>
    </section>
  );
}
