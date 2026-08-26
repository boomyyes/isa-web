"use client";

import { motion } from "framer-motion";
import { ParchmentPanel } from "@/components/artemis/ParchmentPanel";
import { Astrolabe, MeanderDivider } from "@/components/artemis/GreekOrnaments";
import { fadeUp } from "@/components/artemis/tokens";
import { PROLOGUE } from "@/lib/artemis";

/**
 * The opening note, set on paper — the "Reader's Note" beat from the reference
 * spread. First paragraph takes a drop cap; the rest run as plain serif prose.
 *
 * The drop cap is `::first-letter`, not a wrapped span, so it stays correct if
 * the copy is swapped in lib/artemis.ts without touching this file.
 */
export function ProloguePanel() {
  return (
    <section
      id="prologue"
      tabIndex={-1}
      className="relative scroll-mt-24 outline-none md:scroll-mt-28 mx-auto max-w-5xl px-6 py-16 md:py-24"
    >
      <motion.div {...fadeUp}>
        <ParchmentPanel corners>
          {/* Engraving, bled off the top-right corner as on the reference. */}
          <Astrolabe
            aria-hidden
            className="absolute -right-8 -top-10 h-40 w-40 text-[var(--artemis-oxblood)] opacity-[0.12] sm:h-52 sm:w-52"
          />

          <div className="relative">
            <h2 className="font-cinzel text-3xl font-bold uppercase tracking-[0.2em] text-[var(--artemis-navy)] sm:text-4xl">
              {PROLOGUE.heading}
            </h2>

            <div className="mt-6 text-[var(--artemis-oxblood)] opacity-60">
              <MeanderDivider className="justify-start" />
            </div>

            <div
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
                <p key={i}>{paragraph}</p>
              ))}
            </div>

            <p className="mt-8 font-cinzel text-sm uppercase tracking-[0.25em] text-[var(--artemis-oxblood)]">
              {PROLOGUE.signature}
            </p>
          </div>
        </ParchmentPanel>
      </motion.div>
    </section>
  );
}
