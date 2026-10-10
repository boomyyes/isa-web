import Link from "next/link";
import {
  AdminShell,
  buttonClass,
  cardClass,
  formatTime,
  Notice,
} from "@/components/admin/AdminShell";
import { fieldClass, labelClass } from "@/components/ui/formStyles";
import { requireAdmin } from "@/lib/admin/session";
import { getSubmission } from "@/lib/admin/submissions";
import { can } from "@/lib/admin/store";
import { FORMS } from "@/lib/forms/schemas";
import { SUBMISSION_STATUSES } from "@/lib/forms/server";
import { isAnonymous, SHEET_LAYOUT, shownValue } from "@/lib/forms/sheet";

export const dynamic = "force-dynamic";

export default async function SubmissionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const session = await requireAdmin();
  const { base } = session;
  const { id } = await params;
  const { saved, error } = await searchParams;
  const sub = await getSubmission(id);

  if (!sub) {
    return (
      <AdminShell session={session} base={base} title="Not found">
        <p className="text-sm text-[var(--text-secondary)]">
          No submission {id}. It may have passed its retention date or been erased.{" "}
          <Link href={`${base}/inbox`} className="text-[var(--accent-color)] underline">
            Back to the inbox
          </Link>
        </p>
      </AdminShell>
    );
  }

  const editor = can(session.role, "core");
  const fields = SHEET_LAYOUT[sub.form].columns;

  return (
    <AdminShell session={session} base={base} title={`${FORMS[sub.form].label} ${sub.id}`}>
      {saved && <Notice>Saved. The sheet updates on its next sync.</Notice>}
      {error === "denied" && <Notice tone="error">Viewers can&apos;t change submissions.</Notice>}

      <section className={cardClass}>
        <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-[10rem_1fr]">
          <dt className={labelClass}>Received</dt>
          <dd className="text-sm text-[var(--text-primary)]">{formatTime(sub.receivedAt)}</dd>
          {fields.map(([key, title]) => (
            <div key={key} className="contents">
              <dt className={labelClass}>{title}</dt>
              {/* Rendered as text: React escapes it, so submitted markup can't run. */}
              <dd className="whitespace-pre-wrap break-words text-sm text-[var(--text-primary)]">
                {shownValue(sub, key)}
              </dd>
            </div>
          ))}
          <dt className={labelClass}>Declarations</dt>
          <dd className="text-sm text-[var(--text-primary)]">
            Consent {sub.data.consent ? "given" : "missing"} · 18+ {sub.data.adult ? "confirmed" : "not confirmed"}
          </dd>
          <dt className={labelClass}>Delete after</dt>
          <dd className="text-sm text-[var(--text-primary)]">{formatTime(sub.retainUntil)}</dd>
        </dl>
      </section>

      <section className={cardClass}>
        <h2 className={labelClass}>Status and notes</h2>
        <p className="text-sm text-[var(--text-primary)]">
          Status: <strong>{sub.status ?? "new"}</strong>
        </p>
        {(sub.notes ?? []).length > 0 && (
          <ul className="mt-4 space-y-3">
            {sub.notes!.map((n, i) => (
              <li key={i} className="border-l-2 border-[var(--border-color)] pl-3 text-sm">
                <p className="whitespace-pre-wrap text-[var(--text-primary)]">{n.text}</p>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">
                  {n.by} · {formatTime(n.at)}
                </p>
              </li>
            ))}
          </ul>
        )}

        {editor && (
          <form method="post" action={`/api/admin/submissions/${sub.id}`} className="mt-6 space-y-4">
            <div>
              <label htmlFor="status" className={labelClass}>
                Change status
              </label>
              <select id="status" name="status" defaultValue="" className={`${fieldClass} w-auto`}>
                <option value="">Keep “{sub.status ?? "new"}”</option>
                {SUBMISSION_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="note" className={labelClass}>
                Add a note
              </label>
              <textarea id="note" name="note" rows={3} maxLength={1000} className={fieldClass} />
            </div>
            <button className={buttonClass}>Save</button>
          </form>
        )}
      </section>

      <p className="text-sm">
        {isAnonymous(sub) ? (
          <span className="text-[var(--text-secondary)]">Sent anonymously: there&apos;s no address to reply to.</span>
        ) : (
          <a href={`mailto:${String(sub.data.email ?? "")}?subject=${encodeURIComponent(`Re: your query ${sub.id}`)}`} className="text-[var(--accent-color)] underline underline-offset-2">
            Reply by email
          </a>
        )}
      </p>
    </AdminShell>
  );
}
