"use client";

import { AdminShell, buttonClass, cardClass } from "@/components/admin/AdminShell";

/**
 * A page that failed to load, inside the workspace frame: the sidebar and
 * header stay usable, so the member can go elsewhere or try again.
 */
export default function WorkspaceError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <AdminShell title="Couldn't load this page">
      <div className={`${cardClass} space-y-4`}>
        <p className="text-sm text-[var(--text-secondary)]">
          The database or another service didn&apos;t answer. Nothing you saved was lost. Try again, or open another
          page from the menu.
        </p>
        <button onClick={retry} className={buttonClass}>Try again</button>
        {error.digest && <p className="font-jetbrains text-xs text-[var(--text-secondary)]/60">Ref {error.digest}</p>}
      </div>
    </AdminShell>
  );
}
