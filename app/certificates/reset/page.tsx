import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageTransition } from "@/components/layout/PageTransition";
import { CertificateReset } from "@/components/sections/CertificateReset";

export const metadata: Metadata = {
  title: "Reset Access Code | ISA RAIT",
  description: "Request a new access code for your ISA RAIT certificates.",
  // A reset link should never end up in a search index.
  robots: { index: false, follow: false },
};

export default function CertificateResetPage() {
  return (
    <PageTransition>
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col px-6 pt-28 pb-16 md:pt-36 md:pb-24">
        <header className="relative">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-10 left-0 h-40 w-80 max-w-full rounded-full opacity-30 blur-3xl"
            style={{ background: "var(--accent-color)" }}
          />
          <p className="relative font-jetbrains text-xs uppercase tracking-[0.3em] text-[var(--accent-color)]">
            [ Section 06 // Recovery ]
          </p>
          <h1 className="relative mt-4 font-jetbrains text-3xl font-bold tracking-tight text-[var(--text-primary)] sm:text-4xl">
            Reset Your{" "}
            <span className="text-[var(--accent-color)] [text-shadow:0_0_30px_var(--accent-color)]">
              Access Code
            </span>
          </h1>
        </header>

        <div className="mt-10">
          {/* useSearchParams needs a Suspense boundary to keep the shell static. */}
          <Suspense
            fallback={
              <div className="h-56 animate-pulse rounded-2xl border border-[var(--border-color)] bg-[var(--card-color)]/40" />
            }
          >
            <CertificateReset />
          </Suspense>
        </div>

        <p className="mt-8">
          <Link
            href="/certificates"
            className="inline-flex items-center gap-1.5 font-jetbrains text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to certificates
          </Link>
        </p>
      </main>
    </PageTransition>
  );
}
