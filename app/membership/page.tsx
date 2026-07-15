import type { Metadata } from "next";
import { PageTransition } from "@/components/layout/PageTransition";

export const metadata: Metadata = {
  title: "Membership | ISA RAIT",
  description: "[Membership page description placeholder]",
};

export default function MembershipPage() {
  return (
    <PageTransition>
      <main className="mx-auto max-w-7xl px-6 pt-32 pb-24 min-h-screen">
        <p className="font-jetbrains text-xs uppercase tracking-widest text-[var(--accent-color)]">
          [ Section 03 ]
        </p>
        <h1 className="mt-4 font-jetbrains text-4xl md:text-6xl font-bold tracking-tight text-[var(--text-primary)]">
          [Membership]
        </h1>
        <p className="mt-6 max-w-2xl text-[var(--text-secondary)]">
          [ Membership content placeholder — outline tiers, benefits, and the
          sign-up flow here. ]
        </p>
      </main>
    </PageTransition>
  );
}
