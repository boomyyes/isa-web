"use client";

import { SectionHeading } from "@/components/artemis/SectionHeading";
import { MeanderDivider } from "@/components/artemis/GreekOrnaments";
import { ParchmentPanel } from "@/components/artemis/ParchmentPanel";
import {
  revealHeadingOnScroll,
  revealOnScroll,
  unfurlOnScroll,
  unrollOnScroll,
} from "@/components/artemis/reveal";
import { useArtemisAnime } from "@/components/artemis/useArtemisAnime";
import { GUIDELINES } from "@/lib/artemis";

/**
 * The rules of the trial — the committee's ten general guidelines, set on paper
 * under the problem statements they govern.
 *
 * Unlike the statements, these are not embargoed and deliberately so: rule six
 * requires teams to submit their component requirements *before* the hackathon,
 * and rule eight makes bringing anything else a disqualification risk. They are
 * only useful published well ahead of the day.
 *
 * The entrance follows ProloguePanel exactly — the paper is unfurled first, so
 * the rules are revealed onto a surface that already exists rather than arriving
 * with it.
 */
export function GuidelinesSection() {
  const root = useArtemisAnime<HTMLElement>((self) => {
    const el = self.root as HTMLElement;

    revealHeadingOnScroll(el);

    unfurlOnScroll("[data-guidelines-panel]", { duration: 760, delay: 120 });
    unrollOnScroll("[data-guidelines-rule]", { delay: 300 });
    revealOnScroll(el.querySelectorAll("[data-guideline]"), {
      y: 20,
      duration: 440,
      delay: 380,
      each: 55,
    });
  });

  return (
    <section
      ref={root}
      id="guidelines"
      tabIndex={-1}
      className="relative scroll-mt-24 outline-none md:scroll-mt-28 mx-auto max-w-4xl px-6 py-16 md:py-24"
    >
      <SectionHeading
        eyebrow="Rules of the Trial"
        title="Before you begin"
        lead="Ten rules govern every entry, whichever trial you take. Two of them bind before the day itself — read six and eight twice."
      />

      <div data-guidelines-panel data-unfurl className="mt-14">
        <ParchmentPanel corners>
          <div data-guidelines-rule data-unroll>
            <MeanderDivider className="text-[var(--artemis-oxblood)] opacity-55" />
          </div>

          {/* A real <ol>: the numbers are the committee's, referred to by number
              in the lead above and in conversation on the day, so they have to
              be structural rather than decorative. The marker is drawn by hand
              in Cinzel to match the page, and the counter is what keeps it
              honest if an item is ever inserted. */}
          <ol className="mt-9 [counter-reset:guideline] space-y-6">
            {GUIDELINES.map((rule, i) => (
              <li
                key={i}
                data-guideline
                data-reveal
                className="flex gap-5 [counter-increment:guideline]"
              >
                <span
                  aria-hidden
                  className="mt-1 w-7 shrink-0 text-right font-cinzel text-lg font-bold leading-none text-[var(--artemis-oxblood)] before:content-[counter(guideline)]"
                />
                <p className="font-cormorant text-lg leading-relaxed text-[var(--text-primary)] sm:text-xl">
                  {rule}
                </p>
              </li>
            ))}
          </ol>
        </ParchmentPanel>
      </div>
    </section>
  );
}
