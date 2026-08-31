"use client";

import { Accordion } from "@/components/ui/Accordion";
import { SectionHeading } from "@/components/artemis/SectionHeading";
import {
  revealHeadingOnScroll,
  revealOnScroll,
} from "@/components/artemis/reveal";
import { useArtemisAnime } from "@/components/artemis/useArtemisAnime";
import { ARTEMIS_FAQS } from "@/lib/artemis";

/**
 * FAQ. The shared Accordion with Artemis questions passed in — it already takes
 * an `items` prop and reads its colours from the semantic vars, so it needs no
 * changes to sit on the cosmic ground.
 *
 * The Accordion is one of the components outside components/artemis/ that keeps
 * its framer-motion open/close transition; only the entrance of the block as a
 * whole is anime.js.
 */
export function ArtemisFaq() {
  const root = useArtemisAnime<HTMLElement>((self) => {
    revealHeadingOnScroll(self.root as HTMLElement);
    revealOnScroll("[data-faq-list]", { y: 30, delay: 150 });
  });

  return (
    <section
      ref={root}
      id="faq"
      tabIndex={-1}
      className="relative scroll-mt-24 outline-none md:scroll-mt-28 mx-auto max-w-3xl px-6 py-16 md:py-24"
    >
      <SectionHeading eyebrow="Consult the Priestess" title="Questions answered" />

      <div data-faq-list data-reveal className="mt-12">
        <Accordion items={ARTEMIS_FAQS} />
      </div>
    </section>
  );
}
