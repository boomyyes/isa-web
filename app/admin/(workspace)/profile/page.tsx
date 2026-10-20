import Link from "next/link";
import { AdminShell, buttonClass, cardClass, Notice } from "@/components/admin/AdminShell";
import { fieldClass, labelClass } from "@/components/ui/formStyles";
import { requireAdmin } from "@/lib/admin/session";
import { domainLabel, NAME_MAX, phoneOf, ROLE_LABELS } from "@/lib/admin/store";

export const dynamic = "force-dynamic";

const ERRORS: Record<string, string> = {
  phone: "That doesn't look like an Indian mobile number. Use 10 digits, e.g. 98765 43210.",
  save: "Your profile couldn't be saved. Try again in a moment.",
};

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const session = await requireAdmin();
  const { base } = session;
  const { saved, error } = await searchParams;
  const phone = await phoneOf(session.email).catch(() => null);

  return (
    <AdminShell session={session} base={base} title="Your profile" subtitle="How you appear in the workspace">
      {saved && <Notice>Saved.</Notice>}
      {error && ERRORS[error] && <Notice tone="error">{ERRORS[error]}</Notice>}

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <form method="post" action="/api/admin/profile" className={`${cardClass} space-y-5`}>
          <div>
            <label htmlFor="name" className={labelClass}>
              Display name
            </label>
            <input id="name" name="name" type="text" maxLength={NAME_MAX} defaultValue={session.name ?? ""} autoComplete="name" placeholder="Leave blank to show only your email" className={fieldClass} />
            <p className="mt-1.5 text-xs text-[var(--text-secondary)]">Shown in the top bar, the greeting, and to the President on the Team page.</p>
          </div>
          <div>
            <label htmlFor="phone" className={labelClass}>
              Phone (optional)
            </label>
            <input id="phone" name="phone" type="tel" inputMode="tel" defaultValue={phone ?? ""} autoComplete="tel" placeholder="98765 43210" className={fieldClass} />
            <p className="mt-1.5 text-xs text-[var(--text-secondary)]">
              For urgent committee contact. Only the Faculty Advisor, the President, the Treasurer and Admins can see it.
            </p>
          </div>
          <button className={buttonClass}>Save profile</button>
        </form>

        <div className={`${cardClass} space-y-4 text-sm`}>
          <h2 className="font-semibold">Your access</h2>
          <dl className="space-y-3">
            <div>
              <dt className={labelClass}>Email</dt>
              <dd className="break-all">{session.email}</dd>
            </div>
            <div>
              <dt className={labelClass}>Role</dt>
              <dd>
                {ROLE_LABELS[session.role]}
                {session.domain && ` · ${domainLabel(session.domain)}`}
              </dd>
            </div>
          </dl>
          <p className="text-xs text-[var(--text-secondary)]">
            Email and role are managed by the President. What the workspace keeps about you is set out in the{" "}
            <Link href={`${base}/notice`} className="text-[var(--border-active)] underline underline-offset-2">
              notice to members
            </Link>
            .
          </p>
        </div>
      </div>
    </AdminShell>
  );
}
