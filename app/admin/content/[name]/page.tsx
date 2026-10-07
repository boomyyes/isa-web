import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell, buttonClass, cardClass, formatTime, Notice } from "@/components/admin/AdminShell";
import { ContentEditor } from "@/components/admin/ContentEditor";
import { requireCapability } from "@/lib/admin/session";
import { collectionByName } from "@/lib/content/collections";
import { contentBranch, fileHistory, githubConfigured, readFile, type HistoryEntry } from "@/lib/content/github";

export const dynamic = "force-dynamic";

const ERRORS: Record<string, string> = {
  restore: "That version couldn't be restored. Try again.",
  "restore-invalid": "That version no longer passes today's checks, so it can't be restored as-is.",
  conflict: "Someone published while you were restoring. Reload and try again.",
};

export default async function ContentCollectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ name: string }>;
  searchParams: Promise<{ restored?: string; error?: string }>;
}) {
  const session = await requireCapability("content");
  const { base } = session;
  const { name } = await params;
  const { restored, error } = await searchParams;
  const collection = collectionByName(name);
  if (!collection) notFound();

  if (!githubConfigured()) {
    return (
      <AdminShell session={session} base={base} title={collection.label}>
        <Notice tone="error">Publishing isn&apos;t set up: GITHUB_CONTENT_TOKEN is missing on this deployment.</Notice>
      </AdminShell>
    );
  }

  // Always the branch's latest, not the copy built into this deployment, so an
  // edit published a minute ago (and not yet deployed) isn't silently reverted.
  let file: { sha: string; text: string };
  let history: HistoryEntry[] = [];
  try {
    [file, history] = await Promise.all([readFile(collection.file), fileHistory(collection.file)]);
  } catch {
    return (
      <AdminShell session={session} base={base} title={collection.label}>
        <Notice tone="error">Couldn&apos;t load this from GitHub. Check the token, or try again shortly.</Notice>
      </AdminShell>
    );
  }

  return (
    <AdminShell session={session} base={base} title={collection.label}>
      <Link href={`${base}/content`} className="text-sm text-[var(--accent-color)] underline underline-offset-2">
        All content
      </Link>
      {restored && <Notice>Restored as a new version ({restored}). The site updates in about 2 minutes.</Notice>}
      {error && ERRORS[error] && <Notice tone="error">{ERRORS[error]}</Notice>}

      {/* Keyed by the file version, so a restore or reload starts the editor fresh. */}
      <ContentEditor key={file.sha} name={collection.name} initial={JSON.parse(file.text)} sha={file.sha} commitBase={contentBranch()} />

      <section className={cardClass}>
        <h2 className="font-jetbrains text-sm font-bold uppercase tracking-widest text-[var(--text-primary)]">History</h2>
        <ul className="mt-4 divide-y divide-[var(--border-color)]">
          {history.map((h, i) => (
            <li key={h.sha} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
              <div className="min-w-0">
                <p className="truncate text-[var(--text-primary)]">{h.message}</p>
                <p className="text-xs text-[var(--text-secondary)]">
                  {formatTime(h.date)} ·{" "}
                  <a href={h.url} target="_blank" rel="noreferrer" className="underline">
                    {h.sha.slice(0, 7)}
                  </a>
                  {i === 0 && " · current"}
                </p>
              </div>
              {i > 0 && (
                <form method="post" action={`/api/admin/content/${collection.name}/restore`}>
                  <input type="hidden" name="ref" value={h.sha} />
                  <button className={`${buttonClass} !px-3 !py-1.5`}>Restore this version</button>
                </form>
              )}
            </li>
          ))}
        </ul>
      </section>
    </AdminShell>
  );
}
