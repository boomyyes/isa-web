"use client";

// Uploads a new ISAAC issue: the PDF goes from the browser straight into the
// private R2 bucket (too big to pass through the server), then the server
// checks it and publishes it. See app/api/admin/content/isaac-issue.

import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { labelClass } from "@/components/ui/formStyles";
import { ISAAC_MAX_UPLOAD_BYTES, ISAAC_MAX_UPLOAD_MB } from "@/lib/isaac";

type Status =
  | { kind: "idle" }
  | { kind: "uploading"; percent: number }
  | { kind: "checking" }
  | { kind: "preparing"; done: number; pages: number }
  | { kind: "publishing" }
  | { kind: "done"; pages: number; url: string }
  | { kind: "error"; message: string };

async function api(body: object): Promise<{ error?: string } & Record<string, unknown>> {
  const response = await fetch("/api/admin/content/isaac-issue", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await response.json().catch(() => ({}))) as { error?: string } & Record<string, unknown>;
  if (!response.ok) throw new Error(data.error ?? "Something went wrong. Try again.");
  return data;
}

/** XHR rather than fetch, for upload progress. */
function put(url: string, file: File, onProgress: (percent: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", "application/pdf");
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Storage refused the upload (${xhr.status}).`));
    // Status 0 with no response is almost always the bucket's CORS policy.
    xhr.onerror = () => reject(new Error("The upload was blocked. The storage bucket may not allow uploads from this site yet."));
    xhr.send(file);
  });
}

export function IsaacUploader({ buttonClass }: { buttonClass: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const busy = ["uploading", "checking", "preparing", "publishing"].includes(status.kind);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!file || busy) return;
    if (file.type && file.type !== "application/pdf") return setStatus({ kind: "error", message: "Choose a PDF file." });
    if (file.size > ISAAC_MAX_UPLOAD_BYTES) {
      return setStatus({ kind: "error", message: `The PDF is over ${ISAAC_MAX_UPLOAD_MB} MB. Export it smaller and try again.` });
    }

    try {
      setStatus({ kind: "uploading", percent: 0 });
      const start = await api({ action: "start", size: file.size });
      await put(String(start.url), file, (percent) => setStatus({ kind: "uploading", percent }));
      setStatus({ kind: "checking" });
      const { pages } = (await api({ action: "check", version: start.version })) as { pages: number };
      // Draw every page now, in batches, so readers only ever get stored images.
      for (let from = 0; from < pages; ) {
        setStatus({ kind: "preparing", done: from, pages });
        const step = (await api({ action: "render", version: start.version, from })) as { next: number };
        from = step.next;
      }
      setStatus({ kind: "publishing" });
      const done = await api({ action: "publish", version: start.version, pages });
      setStatus({ kind: "done", pages: Number(done.pages), url: String(done.commitUrl) });
      setFile(null);
    } catch (error) {
      setStatus({ kind: "error", message: (error as Error).message });
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label htmlFor="issue-pdf" className={labelClass}>
          Issue PDF
        </label>
        <input
          id="issue-pdf"
          type="file"
          accept="application/pdf"
          disabled={busy}
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null);
            setStatus({ kind: "idle" });
          }}
          className="mt-1 block text-sm text-[var(--text-secondary)]"
        />
        <p className="mt-1 text-xs text-[var(--text-secondary)]">
          The whole issue as one PDF, up to {ISAAC_MAX_UPLOAD_MB} MB, without a password. The first page is used as the cover. Every page is prepared as an image before publishing, which takes a minute or two; keep this page open until it finishes.
        </p>
      </div>

      <button type="submit" disabled={!file || busy} className={buttonClass}>
        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
        {status.kind === "uploading"
          ? `Uploading… ${status.percent}%`
          : status.kind === "checking"
            ? "Checking the PDF…"
            : status.kind === "preparing"
              ? `Preparing pages… ${status.done}/${status.pages}`
              : status.kind === "publishing"
                ? "Publishing…"
                : "Upload and publish"}
      </button>

      <div aria-live="polite" className="text-sm">
        {status.kind === "done" && (
          <p className="text-emerald-400">
            Published ({status.pages} pages). The site shows it after the automatic redeploy, about 2 minutes.{" "}
            <a href={status.url} target="_blank" rel="noreferrer" className="text-[var(--accent-color)] underline">
              View the commit
            </a>
          </p>
        )}
        {status.kind === "error" && <p className="text-red-400">{status.message}</p>}
      </div>
    </form>
  );
}
