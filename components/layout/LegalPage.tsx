import type { ReactNode } from "react";

/** Plain long-form layout shared by /privacy and /terms. */
export function LegalPage({
  title,
  updated,
  effective,
  children,
}: {
  title: string;
  /** Human-readable date the text last changed in substance. */
  updated: string;
  /** Date the current text took effect, when it differs from `updated` or must be stated. */
  effective?: string;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto max-w-3xl px-6 pt-24 md:pt-32 pb-16 md:pb-24">
      <h1 className="font-jetbrains text-3xl font-bold tracking-tight text-[var(--text-primary)] sm:text-4xl">
        {title}
      </h1>
      <p className="mt-3 text-sm text-[var(--text-secondary)]">
        {effective && <>Effective {effective} · </>}Last updated {updated}
      </p>
      <div className="mt-10 space-y-5 text-[16px] leading-[1.75] text-[var(--text-secondary)] [&_a]:text-[var(--accent-color)] [&_a]:underline [&_a]:underline-offset-2 [&_h2]:pt-6 [&_h2]:font-jetbrains [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-[var(--text-primary)] [&_h3]:pt-2 [&_h3]:font-bold [&_h3]:text-[var(--text-primary)] [&_ul>li]:ml-5 [&_ul>li]:list-disc [&_ol>li]:ml-5 [&_ol>li]:list-decimal [&_ol]:space-y-2 [&_strong]:text-[var(--text-primary)] [&_ul]:space-y-2">
        {children}
      </div>
    </main>
  );
}
