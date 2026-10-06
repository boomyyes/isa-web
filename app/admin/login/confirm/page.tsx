import { buttonClass, cardClass } from "@/components/admin/AdminShell";

export const dynamic = "force-dynamic";

/**
 * Where the emailed link lands. Opening it does nothing by itself: the click on
 * the button is what spends the token, so link scanners in mail clients can't.
 */
export default async function ConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token = "" } = await searchParams;

  return (
    <div className="mx-auto max-w-md px-4 py-16 md:py-24">
      <p className="font-jetbrains text-xs font-bold uppercase tracking-[0.3em] text-[var(--accent-color)]">
        ISA-RAIT Admin
      </p>
      <h1 className="mt-3 font-jetbrains text-2xl font-bold text-[var(--text-primary)]">
        Finish signing in
      </h1>
      <form method="post" action="/api/admin/login/verify" className={`${cardClass} mt-8`}>
        <input type="hidden" name="token" value={token} />
        <p className="text-sm text-[var(--text-secondary)]">
          Continue to sign in on this device. Your session lasts 8 hours.
        </p>
        <button type="submit" className={`${buttonClass} mt-5 w-full`}>
          Sign in
        </button>
      </form>
    </div>
  );
}
