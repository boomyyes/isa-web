import { AdminShell, formatTime } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/admin/session";
import { listAudit } from "@/lib/admin/store";

export const dynamic = "force-dynamic";

export default async function AuditPage() {
  const session = await requireAdmin("president");
  const entries = await listAudit();

  return (
    <AdminShell session={session} base={session.base} title="Audit log">
      <p className="text-sm text-[var(--text-secondary)]">
        Every sign-in and change, newest first. Entries are kept for one year.
      </p>
      <div className="overflow-x-auto rounded-2xl border border-[var(--border-color)]">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--card-color)] font-jetbrains text-xs uppercase tracking-widest text-[var(--text-secondary)]">
            <tr>
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">Who</th>
              <th className="px-4 py-3">What</th>
              <th className="px-4 py-3">On</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e, i) => (
              <tr key={i} className="border-t border-[var(--border-color)] text-[var(--text-primary)]">
                <td className="whitespace-nowrap px-4 py-3">{formatTime(e.at)}</td>
                <td className="px-4 py-3">{e.by}</td>
                <td className="px-4 py-3">{e.action}</td>
                <td className="px-4 py-3 font-jetbrains text-xs">{e.target ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
