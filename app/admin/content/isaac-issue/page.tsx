import Link from "next/link";
import { AdminShell, buttonClass, cardClass, formatTime, Notice } from "@/components/admin/AdminShell";
import { IsaacUploader } from "@/components/admin/IsaacUploader";
import { requireCapability } from "@/lib/admin/session";
import { contentBranch, githubConfigured, readFile } from "@/lib/content/github";
import type { IsaacIssue } from "@/lib/isaac";

export const dynamic = "force-dynamic";

export default async function IsaacIssuePage() {
  const session = await requireCapability("content");
  const { base } = session;

  // What's on the publishing branch now, not what this deployment was built with.
  let current: IsaacIssue | null = null;
  try {
    current = JSON.parse((await readFile("content/site/isaac-issue.json")).text) as IsaacIssue;
  } catch {
    current = null;
  }

  return (
    <AdminShell session={session} base={base} title="ISAAC issue">
      <Link href={`${base}/content`} className="text-sm text-[var(--accent-color)] underline underline-offset-2">
        All website content
      </Link>
      {!githubConfigured() && (
        <Notice tone="error">Publishing isn&apos;t set up: GITHUB_CONTENT_TOKEN is missing on this deployment.</Notice>
      )}

      <section className={`${cardClass} space-y-2 text-sm text-[var(--text-secondary)]`}>
        <p>
          Upload the new issue here. It replaces the current one in the reader on the home page; only the latest issue
          is kept. The PDF is stored privately: visitors only ever get one page image at a time, never the file.
        </p>
        <p>
          It publishes to the <code className="font-jetbrains">{contentBranch()}</code> branch and goes live after the
          automatic redeploy, about 2 minutes. The issue number and the stats beside the cover are edited in{" "}
          <Link href={`${base}/content/isaac`} className="text-[var(--accent-color)] underline">
            ISAAC magazine
          </Link>
          .
        </p>
        <p className="text-[var(--text-primary)]">
          Current issue:{" "}
          {current === null
            ? "couldn't be read right now."
            : current.pdf
              ? `uploaded ${current.uploadedAt ? formatTime(current.uploadedAt) : ""}`.trim()
              : "still served from the older Google Drive setup."}
        </p>
      </section>

      <section className={cardClass}>
        <IsaacUploader buttonClass={buttonClass} />
      </section>
    </AdminShell>
  );
}
