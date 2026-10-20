"use client";

import { buttonClass, cardClass } from "@/components/admin/AdminShell";

/** The workspace frame itself failed (the session lookup, usually Redis being down). */
export default function AdminError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <main className="grid min-h-screen place-items-center p-4">
      <div className={`${cardClass} max-w-md space-y-4 text-center`}>
        <h1 className="text-xl font-semibold text-[var(--text-primary)]">The workspace is unavailable</h1>
        <p className="text-sm text-[var(--text-secondary)]">
          A service it depends on didn&apos;t answer. It&apos;s usually brief; try again in a moment.
        </p>
        <button onClick={retry} className={buttonClass}>Try again</button>
        {error.digest && <p className="font-jetbrains text-xs text-[var(--text-secondary)]/60">Ref {error.digest}</p>}
      </div>
    </main>
  );
}
