import Link from "next/link";
import { AdminShell, cardClass, Notice } from "@/components/admin/AdminShell";
import { requireCapability } from "@/lib/admin/session";
import { COLLECTIONS } from "@/lib/content/collections";
import { contentBranch, githubConfigured } from "@/lib/content/github";

export const dynamic = "force-dynamic";

export default async function ContentIndexPage() {
  const session = await requireCapability("content");
  const { base } = session;

  return (
    <AdminShell session={session} base={base} title="Website content">
      {!githubConfigured() && (
        <Notice tone="error">Publishing isn&apos;t set up: GITHUB_CONTENT_TOKEN is missing on this deployment.</Notice>
      )}
      <p className="text-sm text-[var(--text-secondary)]">
        Changes publish to the <code className="font-jetbrains">{contentBranch()}</code> branch and go
        live after the automatic redeploy, about 2 minutes. Every publish is kept in history and can be
        restored.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {COLLECTIONS.map((c) => (
          <Link key={c.name} href={`${base}/content/${c.name}`} className={`${cardClass} block transition hover:border-[var(--border-active)]`}>
            <p className="font-jetbrains text-sm font-bold text-[var(--text-primary)]">{c.label}</p>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">{c.description}</p>
          </Link>
        ))}
        <Link href={`${base}/content/isaac-issue`} className={`${cardClass} block transition hover:border-[var(--border-active)]`}>
          <p className="font-jetbrains text-sm font-bold text-[var(--text-primary)]">ISAAC issue (PDF)</p>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Upload a new issue of the magazine for the reader on the home page.</p>
        </Link>
      </div>
    </AdminShell>
  );
}
