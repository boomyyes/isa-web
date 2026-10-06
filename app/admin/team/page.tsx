import { AdminShell, buttonClass, cardClass, dangerButtonClass, formatTime, Notice } from "@/components/admin/AdminShell";
import { fieldClass, labelClass } from "@/components/ui/formStyles";
import { requireAdmin } from "@/lib/admin/session";
import { listAdmins, ROLES } from "@/lib/admin/store";

export const dynamic = "force-dynamic";

const ROLE_HELP = {
  viewer: "Reads submissions.",
  editor: "Also changes status and adds notes.",
  owner: "Also manages admins, handles erasure requests and reads the audit log.",
};

const ERRORS: Record<string, string> = {
  email: "Enter a valid email address.",
  fixed: "That owner is set in Vercel (ADMIN_OWNERS) and can only be changed there.",
};

export default async function TeamPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const session = await requireAdmin("owner");
  const { base } = session;
  const { saved, error } = await searchParams;
  const admins = await listAdmins();

  return (
    <AdminShell session={session} base={base} title="Team">
      {saved && <Notice>Saved. Removed admins are signed out immediately.</Notice>}
      {error && ERRORS[error] && <Notice tone="error">{ERRORS[error]}</Notice>}

      <form method="post" action="/api/admin/team" className={`${cardClass} grid gap-4 sm:grid-cols-[1fr_auto_auto] sm:items-end`}>
        <input type="hidden" name="action" value="set" />
        <div>
          <label htmlFor="email" className={labelClass}>
            Add or change an admin
          </label>
          <input id="email" name="email" type="email" required placeholder="name@example.com" className={fieldClass} />
        </div>
        <select name="role" defaultValue="viewer" aria-label="Role" className={`${fieldClass} w-auto`}>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <button className={buttonClass}>Save</button>
        <ul className="text-xs text-[var(--text-secondary)] sm:col-span-3">
          {ROLES.map((r) => (
            <li key={r}>
              <strong className="uppercase">{r}</strong>: {ROLE_HELP[r]}
            </li>
          ))}
        </ul>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-[var(--border-color)]">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--card-color)] font-jetbrains text-xs uppercase tracking-widest text-[var(--text-secondary)]">
            <tr>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Added</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {admins.map((a) => (
              <tr key={a.email} className="border-t border-[var(--border-color)] text-[var(--text-primary)]">
                <td className="px-4 py-3">{a.email}</td>
                <td className="px-4 py-3 uppercase">{a.role}</td>
                <td className="px-4 py-3 text-[var(--text-secondary)]">
                  {a.fixed ? "Set in Vercel" : `${a.addedBy}, ${formatTime(a.addedAt)}`}
                </td>
                <td className="px-4 py-3 text-right">
                  {!a.fixed && (
                    <form method="post" action="/api/admin/team">
                      <input type="hidden" name="action" value="remove" />
                      <input type="hidden" name="email" value={a.email} />
                      <button className={dangerButtonClass}>Remove</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
