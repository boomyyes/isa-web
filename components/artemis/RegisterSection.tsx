"use client";

import { motion } from "framer-motion";
import { FormEmbed } from "@/components/ui/FormEmbed";
import { SectionHeading } from "@/components/artemis/SectionHeading";
import { ParchmentPanel } from "@/components/artemis/ParchmentPanel";
import { fadeUp } from "@/components/artemis/tokens";
import { ARTEMIS } from "@/lib/artemis";

/**
 * Registration. The shared FormEmbed, dropped onto parchment.
 *
 * No variant prop and no fork of the component: FormEmbed's chrome is drawn
 * entirely from --card-color / --border-color / --text-*, and ParchmentPanel
 * redefines all of those for its subtree, so the embed re-skins itself. The one
 * thing that does not follow is the iframe's own contents — a Tally or Google
 * form renders in whatever theme it was authored in, which is out of our hands.
 */
export function RegisterSection() {
  return (
    <section
      id="register"
      tabIndex={-1}
      className="relative scroll-mt-24 outline-none md:scroll-mt-28 mx-auto max-w-5xl px-6 py-16 md:py-24"
    >
      <motion.div {...fadeUp}>
        <SectionHeading
          eyebrow="Cast Your Lot"
          title="Enter the trials"
          lead="Teams of up to four. Registration closes when the last seat goes."
        />
      </motion.div>

      <motion.div {...fadeUp} className="mt-12">
        <ParchmentPanel corners contentClassName="p-5 sm:p-8 md:p-10">
          <FormEmbed
            url={ARTEMIS.registerUrl}
            title={"Registration — " + ARTEMIS.title}
          />
        </ParchmentPanel>
      </motion.div>
    </section>
  );
}
