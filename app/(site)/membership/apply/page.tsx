import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "@/lib/seo";
import { PageTransition } from "@/components/layout/PageTransition";
import { MembershipForm } from "@/components/forms/MembershipForm";

export const metadata: Metadata = {
  ...pageMetadata({
    path: "/membership/apply",
    title: "Join ISA",
    description:
      "RAIT students: leave your details and the ISA-RAIT committee will call you and set up your ISA membership with you.",
  }),
};

export default function MembershipApplyPage() {
  return (
    <PageTransition>
      <main className="mx-auto max-w-3xl px-6 pt-24 pb-16 md:pt-32 md:pb-24">
        <header className="relative mb-10">
          {/* ambient glow behind the title */}
          <div
            aria-hidden
            className="pointer-events-none absolute -top-10 left-0 h-40 w-80 max-w-full rounded-full opacity-30 blur-3xl"
            style={{ background: "var(--accent-color)" }}
          />
          <p className="relative font-jetbrains text-xs uppercase tracking-[0.3em] text-[var(--accent-color)]">
            <Link href="/membership" className="hover:underline">
              Membership
            </Link>
          </p>
          <h1 className="relative mt-4 font-jetbrains text-4xl font-bold tracking-tight text-[var(--text-primary)] sm:text-5xl">
            Join{" "}
            <span className="text-[var(--accent-color)] [text-shadow:0_0_30px_var(--accent-color)]">ISA</span>
          </h1>
          <p className="relative mt-5 text-lg leading-relaxed text-[var(--text-secondary)]">
            For RAIT students. Leave your details and someone from the committee will call you, answer your questions
            and set up your ISA membership with you.
          </p>
        </header>

        <MembershipForm />
      </main>
    </PageTransition>
  );
}
