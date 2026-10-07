import { AdminShell, buttonClass, cardClass, dangerButtonClass, formatTime, Notice, tableHeadClass, tableRowClass, tableWrapClass } from "@/components/admin/AdminShell";
import { fieldClass, labelClass } from "@/components/ui/formStyles";
import { requireAdmin } from "@/lib/admin/session";
import {
  ASSIGNABLE_ROLES,
  CAPABILITIES,
  CAPABILITY_NAMES,
  capsFor,
  DOMAINS,
  domainLabel,
  listAdmins,
  NAME_MAX,
  namesOf,
  ROLE_LABELS,
  type Role,
} from "@/lib/admin/store";

export const dynamic = "force-dynamic";

const ROLE_HELP: Record<Role, string> = {
  admin: "Backup access to everything. Set only in Vercel (ADMIN_OWNERS).",
  faculty: "Everything, including the team, treasury audit, record deletion and erasure.",
  president: "Same as Faculty.",
  core: "Announcements, calendar, forum and chat moderation across all domains, submitting and approving bills. No treasury audit or team management.",
  jointcore: "Chat and forum for their own domain plus general ones, and submitting bills.",
};

const ERRORS: Record<string, string> = {
  email: "Enter a valid email address.",
  fixed: "That address is an Admin set in Vercel (ADMIN_OWNERS) and can only be changed there.",
  domain: "Joint Core need a domain.",
};

export default async function TeamPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const session = await requireAdmin("president");
  const { base } = session;
  const { saved, error } = await searchParams;
  const [admins, names] = await Promise.all([listAdmins(), namesOf()]);

  return (
    <AdminShell session={session} base={base} title="Team">
      {saved && <Notice>Saved. Changes apply on the person&apos;s next click; removed admins are signed out immediately.</Notice>}
      {error && ERRORS[error] && <Notice tone="error">{ERRORS[error]}</Notice>}

      <form method="post" action="/api/admin/team" className={`${cardClass} grid gap-4 sm:grid-cols-[1fr_1fr_auto_auto_auto] sm:items-end`}>
        <input type="hidden" name="action" value="set" />
        <div>
          <label htmlFor="email" className={labelClass}>
            Add or change an admin
          </label>
          <input id="email" name="email" type="email" required placeholder="name@example.com" className={fieldClass} />
        </div>
        <div>
          <label htmlFor="name" className={labelClass}>
            Name (optional)
          </label>
          {/* Blank leaves an existing name as it is; members can also set their own. */}
          <input id="name" name="name" type="text" maxLength={NAME_MAX} autoComplete="off" placeholder="Shown in the admin area" className={fieldClass} />
        </div>
        <select name="role" defaultValue="jointcore" aria-label="Role" className={`${fieldClass} w-auto`}>
          {ASSIGNABLE_ROLES.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r]}
            </option>
          ))}
        </select>
        <select name="domain" defaultValue="" aria-label="Domain" className={`${fieldClass} w-auto`}>
          <option value="">No domain</option>
          {DOMAINS.map((d) => (
            <option key={d} value={d}>
              {domainLabel(d)}
            </option>
          ))}
        </select>
        <button className={buttonClass}>Save</button>
        <div className="space-y-1 text-xs text-[var(--text-secondary)] sm:col-span-5">
          <ul>
            {(["admin", ...ASSIGNABLE_ROLES] as Role[]).map((r) => (
              <li key={r}>
                <strong className="uppercase">{ROLE_LABELS[r]}</strong>: {ROLE_HELP[r]}
              </li>
            ))}
          </ul>
          <p>
            Domain applies to Core and Joint Core (required for Joint Core) and is ignored for Faculty and President.
            Anyone in the Technical domain can also edit the website and its events.
          </p>
        </div>
      </form>

      <div className={tableWrapClass}>
        <table className="w-full text-left text-sm">
          <thead className={tableHeadClass}>
            <tr>
              <th className="px-4 py-3">Member</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Can</th>
              <th className="px-4 py-3">Added</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {admins.map((a) => {
              const caps = capsFor(a.role, a.domain);
              return (
                <tr key={a.email} className={`${tableRowClass} align-top`}>
                  <td className="px-4 py-3">
                    {names[a.email] && <span className="block font-medium">{names[a.email]}</span>}
                    <span className={names[a.email] ? "text-xs text-[var(--text-secondary)]" : undefined}>{a.email}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="uppercase">{ROLE_LABELS[a.role]}</span>
                    {a.domain && <span className="block text-xs text-[var(--text-secondary)]">{domainLabel(a.domain)}</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">
                    {caps.length === CAPABILITY_NAMES.length ? "Everything" : caps.map((c) => CAPABILITIES[c]).join(" · ")}
                  </td>
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
              );
            })}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
