import type { Metadata } from "next";
import { Construction } from "lucide-react";
import { PageTransition } from "@/components/layout/PageTransition";
import { TerminalShell } from "@/components/ui/TerminalShell";

export const metadata: Metadata = {
  title: "Certificates | ISA RAIT",
  description:
    "Verify and download ISA RAIT participation and achievement certificates. This section is under construction.",
};

export default function CertificatesPage() {
  return (
    <PageTransition>
      <main className="mx-auto flex min-h-screen max-w-4xl flex-col px-6 pt-28 pb-16 md:pt-36 md:pb-24">
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

          {/* WIP badge */}
          <div className="relative mt-6 inline-flex items-center gap-2 rounded-full border border-[var(--border-active)]/40 bg-[var(--border-active)]/10 px-3 py-1.5 font-jetbrains text-xs font-medium uppercase tracking-widest text-[var(--border-active)] shadow-[0_0_18px_rgba(0,229,255,0.25)]">
            <Construction className="h-4 w-4 animate-pulse" />
            Work in Progress
          </div>

          <p className="relative mt-5 max-w-2xl text-lg leading-relaxed text-[var(--text-secondary)]">
            A home for issuing, verifying, and downloading your ISA-RAIT
            participation and achievement certificates is being built. Check back
            soon — it&apos;s coming with the next release.
          </p>
        </header>

        {/* On-brand terminal status readout */}
        <div className="mt-12">
          <TerminalShell
            title="bin/certificates.sh"
            envStatus="BUILD"
            contentLines={[
              "Initializing certificates module...",
              "Mounting verification pipeline... [pending]",
              "Wiring download + lookup endpoints... [pending]",
              "> This feature is under active development.",
              "Status: UNDER CONSTRUCTION // ETA: soon",
            ]}
          />
        </div>
      </main>
    </PageTransition>
  );
}
