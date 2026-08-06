import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageTransition } from "@/components/layout/PageTransition";
import { CertificateLookup } from "@/components/sections/CertificateLookup";
import { Accordion, type FAQItem } from "@/components/ui/Accordion";

export const metadata: Metadata = {
  title: "Certificates | ISA RAIT",
  description:
    "Look up and download your ISA RAIT workshop participation certificates, or request a printed copy.",
};

const CERTIFICATE_FAQS: FAQItem[] = [
  {
    question: "Where do I find my UID and access code?",
    answer:
      "They were emailed to you when you were registered onto the roster, in a message titled \"Your ISA-RAIT certificate access code\". Check your spam folder before anything else. The code isn't case-sensitive and the dash is optional — K7P2-9XQM and k7p29xqm both work.",
  },
  {
    question: "I've lost the email. Can you resend it?",
    answer:
      "The access code is stored scrambled, so nobody — including us — can look up what yours was. We can issue you a new one instead. Raise a query on the Support page with your name and UID, and we'll reissue and email it.",
  },
  {
    question: "I attended, but a workshop shows as not attended. What now?",
    answer:
      "Attendance is entered by the event team after each session, so a recent workshop may not be on the roster yet. If it's been a while, raise a query on the Support page with your name, UID and the workshop you attended, and we'll check the register.",
  },
  {
    question: "How do I get a printed certificate?",
    answer:
      "Anyone who attended can request one from the Support page. Your first physical copy is free of cost. If you've already collected one, additional copies are chargeable.",
  },
  {
    question: "Can I download my certificate more than once?",
    answer:
      "Yes — the digital copy is always available once your attendance is recorded. Download links expire after a couple of minutes for security, so just sign in again to get a fresh one.",
  },
];

export default function CertificatesPage() {
  return (
    <PageTransition>
      <main className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 pt-28 pb-16 md:pt-36 md:pb-24">
        {/* Header */}
        <header className="relative">
          {/* ambient glow behind the title */}
          <div
            aria-hidden
            className="pointer-events-none absolute -top-10 left-0 h-40 w-80 rounded-full opacity-30 blur-3xl"
            style={{ background: "var(--accent-color)" }}
          />
          <p className="relative font-jetbrains text-xs uppercase tracking-[0.3em] text-[var(--accent-color)]">
            [ Section 06 // Certificates ]
          </p>
          <h1 className="relative mt-4 font-jetbrains text-4xl font-bold tracking-tight text-[var(--text-primary)] sm:text-5xl md:text-6xl">
            Certi
            <span className="text-[var(--accent-color)] [text-shadow:0_0_30px_var(--accent-color)]">
              ficates
            </span>
          </h1>

          <p className="relative mt-5 max-w-2xl text-lg leading-relaxed text-[var(--text-secondary)]">
            Sign in with the UID and access code we emailed you to download your
            participation certificates, or request a printed copy.
          </p>
        </header>

        {/* Lookup */}
        <div className="mt-10">
          <CertificateLookup />
        </div>

        {/* FAQs */}
        <section className="mt-16">
          <h2 className="font-jetbrains text-xs uppercase tracking-[0.3em] text-[var(--accent-color)]">
            [ Common Questions ]
          </h2>
          <Accordion items={CERTIFICATE_FAQS} defaultOpen={null} className="mt-6" />

          <p className="mt-6 text-sm text-[var(--text-secondary)]">
            Something else on your mind?{" "}
            <Link
              href="/help"
              className="inline-flex items-center gap-1 text-[var(--accent-color)] transition-opacity hover:opacity-80"
            >
              Head to Support
              <ArrowRight className="h-4 w-4" />
            </Link>
          </p>
        </section>
      </main>
    </PageTransition>
  );
}
