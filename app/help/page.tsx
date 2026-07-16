import type { Metadata } from "next";
import { PageTransition } from "@/components/layout/PageTransition";

export const metadata: Metadata = {
  title: "Support | ISA RAIT",
  description: "[Support page description placeholder]",
};

export default function HelpPage() {
  return (
    <PageTransition>
      <main className="mx-auto max-w-7xl px-6 pt-24 md:pt-32 pb-16 md:pb-24 min-h-screen">
        <p className="font-jetbrains text-xs uppercase tracking-widest text-[var(--accent-color)]">
          [ Section 04 ]
        </p>
        <h1 className="mt-4 font-jetbrains text-4xl md:text-6xl font-bold tracking-tight text-[var(--text-primary)]">
          [Support]
        </h1>
        <p className="mt-6 max-w-2xl text-[var(--text-secondary)]">
          [ Support content placeholder — add FAQs, contact channels, and help
          resources here. ]
        </p>
      </main>
    </PageTransition>
  );
}
