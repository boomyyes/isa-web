import Link from "next/link";
import { AdminShell, buttonClass, formatTime, Notice, tableHeadClass, tableRowClass, tableWrapClass } from "@/components/admin/AdminShell";
import { fieldClass } from "@/components/ui/formStyles";
import { requireAdmin } from "@/lib/admin/session";
import { listSubmissions } from "@/lib/admin/submissions";
import { FORMS } from "@/lib/forms/schemas";

export const dynamic = "force-dynamic";

export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<{ form?: string; q?: string; denied?: string; error?: string }>;
}) {
  const session = await requireAdmin();
  const { base } = session;
  const { form, q, denied, error } = await searchParams;
  const subs = await listSubmissions({ form, q });

  return (
    <AdminShell session={session} base={base} title="Inbox">
      {denied && <Notice tone="error">Your role doesn&apos;t allow that.</Notice>}
      {error === "missing" && <Notice tone="error">That submission no longer exists.</Notice>}

      <form method="get" action={`${base}/inbox`} className="flex flex-wrap gap-3">
        <input
          name="q"
          defaultValue={q}
          placeholder="Reference (Q-7K3M9X) or email"
          className={`${fieldClass} max-w-sm`}
        />
        <select name="form" defaultValue={form ?? ""} className={`${fieldClass} w-auto`}>
          <option value="">All forms</option>
          {Object.entries(FORMS).map(([name, { label }]) => (
            <option key={name} value={name}>
              {label}
            </option>
          ))}
        </select>
        <button className={buttonClass}>Search</button>
      </form>

      {subs.length === 0 ? (
        <p className="text-sm text-[var(--text-secondary)]">No submissions found.</p>
      ) : (
        <div className={tableWrapClass}>
          <table className="w-full text-left text-sm">
            <thead className={tableHeadClass}>
              <tr>
                <th className="px-4 py-3">Ref</th>
                <th className="px-4 py-3">Form</th>
                <th className="px-4 py-3">Received</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {subs.map((s) => (
                <tr key={s.id} className={tableRowClass}>
                  <td className="px-4 py-3 font-jetbrains">
                    <Link href={`${base}/s/${s.id}`} className="text-[var(--accent-color)] underline underline-offset-2">
                      {s.id}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{FORMS[s.form]?.label ?? s.form}</td>
                  <td className="whitespace-nowrap px-4 py-3">{formatTime(s.receivedAt)}</td>
                  <td className="px-4 py-3">{String(s.data.name ?? "")}</td>
                  <td className="px-4 py-3">{String(s.data.email ?? "")}</td>
                  <td className="px-4 py-3">{s.status ?? "new"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-[var(--text-secondary)]">
        Shows the latest 200. Search by reference or email to find older ones.
      </p>
    </AdminShell>
  );
}
