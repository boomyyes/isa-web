import { AdminShell, cardClass, dangerButtonClass, Notice } from "@/components/admin/AdminShell";
import { fieldClass, labelClass } from "@/components/ui/formStyles";
import { requireAdmin } from "@/lib/admin/session";

export const dynamic = "force-dynamic";

export default async function ErasePage({
  searchParams,
}: {
  searchParams: Promise<{ done?: string; error?: string }>;
}) {
  const session = await requireAdmin("president");
  const { base } = session;
  const { done, error } = await searchParams;

  return (
    <AdminShell session={session} base={base} title="Erasure requests">
      {done !== undefined && (
        <Notice>
          Erased {done} submission(s). Their sheet rows are deleted on the next sync. Reply to the
          person to confirm.
        </Notice>
      )}
      {error === "confirm" && <Notice tone="error">The two addresses didn&apos;t match. Nothing was erased.</Notice>}

      <section className={`${cardClass} space-y-3 text-sm text-[var(--text-secondary)]`}>
        <p>
          Use this when someone asks for their data to be deleted (DPDP Act, section 12). It removes
          every form submission made with that email address, here and in the sheet. It cannot be
          undone.
        </p>
        <p>
          Before erasing, make sure the request really comes from that person: reply to the address
          and ask them to confirm.
        </p>
        <p>
          This doesn&apos;t cover certificate records or the old Tally and Google forms. Those are
          handled separately.
        </p>
      </section>

      <form method="post" action="/api/admin/erase" className={`${cardClass} grid gap-4 sm:max-w-md`}>
        <div>
          <label htmlFor="email" className={labelClass}>
            Email address
          </label>
          <input id="email" name="email" type="email" required autoComplete="off" className={fieldClass} />
        </div>
        <div>
          <label htmlFor="confirm" className={labelClass}>
            Type it again to confirm
          </label>
          <input id="confirm" name="confirm" type="email" required autoComplete="off" className={fieldClass} />
        </div>
        <button className={dangerButtonClass}>Erase permanently</button>
      </form>
    </AdminShell>
  );
}
