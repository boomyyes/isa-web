"use client";

import { animate, spring } from "animejs";
import { SectionHeading } from "@/components/artemis/SectionHeading";
import {
  AstrolabeOuter,
  MeanderDivider,
  StarGlyph,
} from "@/components/artemis/GreekOrnaments";
import { SealedTrials } from "@/components/artemis/SealedTrials";
import {
  drawOnScroll,
  enterOnce,
  revealHeadingOnScroll,
  revealOnScroll,
} from "@/components/artemis/reveal";
import { ARTEMIS_CARD_SHADOW } from "@/components/artemis/tokens";
import { useArtemisAnime } from "@/components/artemis/useArtemisAnime";
import type { ProblemStatement } from "@/lib/artemis";

/**
 * The three problem statements — or, before the hackathon opens, the sealed
 * sheet standing in for them.
 *
 * Which of the two this renders is not its decision. `statements` arrives null
 * from app/artemis/page.tsx until the embargo lifts, and a null prop means the
 * text was never in the response at all — not that it is present and withheld.
 * Everything about the gate lives on the server side of that prop; see
 * lib/artemis-trials.ts.
 *
 * The type is imported from lib/artemis.ts, the public module, precisely so this
 * file never reaches for lib/artemis-trials.ts — that one carries
 * `import "server-only"` and would fail the build if a client component pulled
 * it in, which is the guard working as intended.
 *
 * This replaces two sections that described an event that does not exist: a row
 * of four Greek "tracks" and a twelve-house zodiac wheel of themes. There are
 * three problem statements and each is its own theme, so there is one section.
 * The medallion visual is carried over from the tracks row — an AstrolabeOuter
 * rim that engraves itself on the way in — now crowning each statement.
 */

/** Milliseconds between one statement panel and the next. */
const PANEL_STEP = 130;

export function TrialsSection({
  statements,
  serverNow,
}: {
  statements: ProblemStatement[] | null;
  serverNow: number;
}) {
  const open = statements != null && statements.length > 0;

  const root = useArtemisAnime<HTMLElement>(
    (self) => {
      const el = self.root as HTMLElement;

      revealHeadingOnScroll(el);

      // Nothing below exists while the seal holds — SealedTrials drives its own
      // animation, because its timing is a clock rather than a scroll position.
      if (!open) return;

      el.querySelectorAll<HTMLElement>("[data-trial]").forEach((panel, i) => {
        const base = 90 + i * PANEL_STEP;

        revealOnScroll(panel, { y: 34, duration: 560, delay: base });

        drawOnScroll(
          panel.querySelector<HTMLElement>("[data-trial-rim]"),
          // Only the stroked geometry, named explicitly: a blanket selector
          // would also catch a <rect> used as a mask fill elsewhere in
          // GreekOrnaments and blank the ornament instead of drawing it.
          "circle, line",
          { duration: 600, each: 4, from: "center", delay: base + 80 }
        );

        animate(panel.querySelectorAll("[data-trial-numeral]"), {
          opacity: [0, 1],
          scale: [0.62, 1],
          delay: base + 220,
          ease: spring({ stiffness: 78, damping: 13 }),
          autoplay: enterOnce(),
        });

        revealOnScroll(panel.querySelectorAll("[data-trial-block]"), {
          y: 22,
          duration: 460,
          delay: base + 260,
          each: 70,
        });
      });
    },
    // Rebuilt when the seal breaks: the scope reverts, and the statements that
    // have just arrived enter on the same helpers everything else uses.
    [open]
  );

  return (
    <section
      ref={root}
      // The anchor the deleted zodiac wheel owned, kept so any link already
      // pointing at #trials still lands somewhere sensible.
      id="trials"
      tabIndex={-1}
      className="relative scroll-mt-24 outline-none md:scroll-mt-28 mx-auto max-w-4xl px-6 py-16 md:py-24"
    >
      <SectionHeading
        eyebrow="The Three Trials"
        title={open ? "Choose your trial" : "Sealed until the hour"}
        lead={
          open
            ? "Three trials, one for each theme. Build against whichever you choose — your prototype is judged on the one you name."
            : "Three trials, one for each theme. They are published the moment the hackathon opens, and not a minute before."
        }
      />

      {open ? (
        <div className="mt-14 space-y-10">
          {statements.map((trial) => (
            <article
              key={trial.id}
              id={trial.id}
              data-trial
              data-reveal
              style={{ boxShadow: ARTEMIS_CARD_SHADOW }}
              className="scroll-mt-24 rounded-sm border border-[var(--artemis-gold)]/25 bg-[var(--artemis-night)]/50 px-6 py-9 backdrop-blur-sm sm:px-10 sm:py-12 md:scroll-mt-28"
            >
              {/* Crest and title. Stacked on a narrow screen, side by side once
                  there is room for the medallion to sit beside the type. */}
              <header className="flex flex-col items-center gap-6 text-center sm:flex-row sm:items-center sm:gap-7 sm:text-left">
                <div className="relative h-24 w-24 shrink-0">
                  <span
                    aria-hidden
                    data-trial-rim
                    data-draw
                    className="absolute inset-0 block h-full w-full"
                  >
                    {/* The resting opacity stays on the SVG so the [data-draw]
                        wrapper only ever animates a plain 0 -> 1. */}
                    <AstrolabeOuter className="h-full w-full text-[var(--artemis-gold)] opacity-55" />
                  </span>

                  <span
                    data-trial-numeral
                    data-reveal
                    aria-hidden
                    className="absolute inset-[18%] flex items-center justify-center rounded-full border border-[var(--artemis-gold)]/30 bg-[var(--artemis-night)]/80 font-cinzel text-2xl font-bold text-[var(--artemis-gold-light)]"
                  >
                    {trial.numeral}
                  </span>
                </div>

                <div data-trial-block data-reveal className="min-w-0">
                  <p className="flex items-center justify-center gap-2.5 font-cinzel text-[0.62rem] font-semibold uppercase tracking-[0.32em] text-[var(--artemis-gold)] sm:justify-start">
                    <StarGlyph className="h-2 w-2 shrink-0" />
                    {trial.patron} · {trial.patronDomain}
                  </p>

                  <h3 className="mt-3 font-cinzel text-xl font-bold leading-snug text-[var(--text-primary)] sm:text-2xl">
                    {trial.title}
                  </h3>
                </div>
              </header>

              <div data-trial-block data-reveal className="mt-8">
                <MeanderDivider className="text-[var(--artemis-gold)] opacity-45" />
              </div>

              {/* The committee's text, unaltered. The Greek framing above is
                  decoration around it, never a substitute for it. */}
              {(
                [
                  { label: "Background", paragraphs: trial.background },
                  { label: "Challenge", paragraphs: trial.challenge },
                  { label: "Scope for Innovation", paragraphs: trial.scope },
                ] as const
              ).map((block) => (
                <section
                  key={block.label}
                  data-trial-block
                  data-reveal
                  className="mt-8"
                >
                  <h4 className="font-cinzel text-[0.68rem] font-semibold uppercase tracking-[0.3em] text-[var(--artemis-gold-light)]">
                    {block.label}
                  </h4>

                  <div className="mt-3 space-y-4 font-cormorant text-lg leading-relaxed text-[var(--text-secondary)] sm:text-xl">
                    {block.paragraphs.map((paragraph, i) => (
                      <p key={i}>{paragraph}</p>
                    ))}
                  </div>
                </section>
              ))}
            </article>
          ))}
        </div>
      ) : (
        <SealedTrials serverNow={serverNow} />
      )}
    </section>
  );
}
