"use client";

import { motion } from "framer-motion";
import { CrescentBow, MeanderDivider } from "@/components/artemis/GreekOrnaments";
import { fadeUp } from "@/components/artemis/tokens";
import { EPILOGUE } from "@/lib/artemis";

/**
 * The sign-off, mirroring the closing of the reference spread: a rule, a short
 * note, and a signature.
 *
 * Set directly on the cosmic ground rather than on parchment — the page opened
 * on paper and closes back under the sky, and two parchment panels bracketing
 * the page would make the Prologue read as a repeated template.
 */
export function EpilogueNote() {
  return (
    <section className="relative mx-auto max-w-3xl px-6 pb-24 pt-16 text-center md:pb-32 md:pt-24">
      <motion.div {...fadeUp} className="flex flex-col items-center">
        <CrescentBow
          maskId="artemis-epilogue-crescent"
          className="h-16 w-16 text-[var(--artemis-gold)] opacity-80"
        />

        <div className="mt-6 w-full text-[var(--artemis-gold)] opacity-60">
          <MeanderDivider />
        </div>

        <h2 className="mt-8 font-cinzel text-2xl font-bold uppercase tracking-[0.28em] text-[var(--text-primary)] sm:text-3xl">
          {EPILOGUE.heading}
        </h2>

        <div className="mt-6 space-y-4 font-cormorant text-lg leading-relaxed text-[var(--text-secondary)] sm:text-xl">
          {EPILOGUE.paragraphs.map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>

        <p className="mt-8 font-cinzel text-sm uppercase tracking-[0.25em] text-[var(--artemis-gold)]">
          {EPILOGUE.signature}
        </p>

        <div className="mt-8 w-full text-[var(--artemis-gold)] opacity-40">
          <MeanderDivider />
        </div>
      </motion.div>
    </section>
  );
}
