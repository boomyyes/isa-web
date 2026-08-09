import type { Metadata } from "next";
import { PageTransition } from "@/components/layout/PageTransition";
import { Accordion } from "@/components/ui/Accordion";
import { FormEmbed } from "@/components/ui/FormEmbed";

export const metadata: Metadata = {
  title: "Support | ISA RAIT",
  description:
    "Help desk and support for the ISA RAIT student chapter — browse the FAQ or send us a query about membership, events, and sponsorships.",
};

// Public Tally form link for the query section.
const FORM_EMBED_URL = "https://tally.so/r/gDVdZM";

export default function HelpPage() {
  return (
    <PageTransition>
      <main className="mx-auto max-w-7xl px-6 pt-24 md:pt-32 pb-16 md:pb-24">
        {/* Header */}
        <header className="relative">
          {/* ambient glow behind the title */}
          <div
            aria-hidden
            className="pointer-events-none absolute -top-10 left-0 h-40 w-80 rounded-full opacity-30 blur-3xl"
            style={{ background: "var(--accent-color)" }}
          />
          <p className="relative font-jetbrains text-xs uppercase tracking-[0.3em] text-[var(--accent-color)]">
            [ Section 04 // Support ]
          </p>
          <h1 className="relative mt-4 font-jetbrains text-4xl font-bold tracking-tight text-[var(--text-primary)] sm:text-5xl md:text-6xl">
            Help Desk &amp;{" "}
            <span className="text-[var(--accent-color)] [text-shadow:0_0_30px_var(--accent-color)]">
              Support
            </span>
          </h1>
          <p className="relative mt-5 max-w-2xl text-lg leading-relaxed text-[var(--text-secondary)]">
            Browse the{" "}
            <span className="font-medium text-[var(--text-primary)] [text-shadow:0_0_18px_color-mix(in_srgb,var(--accent-color)_55%,transparent)]">
              knowledge base
            </span>{" "}
            below, or open a direct line to the committee with a query.
          </p>
        </header>

        {/* Two-column: FAQ (left) + Query form (right); stacks on mobile */}
        <div className="mt-12 grid grid-cols-1 gap-8 md:mt-16 md:grid-cols-2 md:gap-10 lg:gap-14">
          {/* FAQ */}
          <section aria-labelledby="faq-heading">
            <h2
              id="faq-heading"
              className="mb-6 font-jetbrains text-xl font-bold uppercase tracking-widest text-[var(--text-primary)]"
            >
              Frequently Asked
            </h2>
            <Accordion />
          </section>

          {/* Query form — live Google Form embedded as a mini page */}
          <section aria-labelledby="query-heading">
            <h2
              id="query-heading"
              className="mb-6 font-jetbrains text-xl font-bold uppercase tracking-widest text-[var(--text-primary)]"
            >
              Send a Query
            </h2>
            <FormEmbed url={FORM_EMBED_URL} />
          </section>
        </div>
      </main>
    </PageTransition>
  );
}
