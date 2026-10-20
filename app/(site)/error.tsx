"use client";

import { AngularButton } from "@/components/ui/AngularButton";

/**
 * A page that failed to load (usually the database or an upstream API being
 * down). The navbar and footer stay; only the page area is replaced.
 */
export default function SiteError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center gap-6 px-4 py-24 text-center">
      <p className="font-jetbrains text-xs uppercase tracking-[0.3em] text-[var(--accent-color)]">Connection lost</p>
      <h1 className="text-3xl font-bold text-[var(--text-primary)] md:text-4xl">This page couldn&apos;t load</h1>
      <p className="text-[var(--text-secondary)]">
        Something on our side didn&apos;t answer in time. It&apos;s usually brief, so try again in a moment.
      </p>
      <div className="flex flex-wrap justify-center gap-4">
        <AngularButton onClick={retry}>Try again</AngularButton>
        <AngularButton variant="outline" href="/">Home</AngularButton>
      </div>
      {error.digest && <p className="font-jetbrains text-xs text-[var(--text-secondary)]/60">Ref {error.digest}</p>}
    </main>
  );
}
