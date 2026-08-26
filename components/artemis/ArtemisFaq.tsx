"use client";

import { motion } from "framer-motion";
import { Accordion } from "@/components/ui/Accordion";
import { SectionHeading } from "@/components/artemis/SectionHeading";
import { fadeUp } from "@/components/artemis/tokens";
import { ARTEMIS_FAQS } from "@/lib/artemis";

/**
 * FAQ. The shared Accordion with Artemis questions passed in — it already takes
 * an `items` prop and reads its colours from the semantic vars, so it needs no
 * changes to sit on the cosmic ground.
 */
export function ArtemisFaq() {
  return (
    <section
      id="faq"
      tabIndex={-1}
      className="relative scroll-mt-24 outline-none md:scroll-mt-28 mx-auto max-w-3xl px-6 py-16 md:py-24"
    >
      <motion.div {...fadeUp}>
        <SectionHeading eyebrow="Consult the Priestess" title="Questions answered" />
      </motion.div>

      <motion.div {...fadeUp} className="mt-12">
        <Accordion items={ARTEMIS_FAQS} />
      </motion.div>
    </section>
  );
}
