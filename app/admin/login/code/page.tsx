import Link from "next/link";
import { buttonClass, cardClass, Notice } from "@/components/admin/AdminShell";
import { fieldClass, labelClass } from "@/components/ui/formStyles";
import { currentBase } from "@/lib/admin/session";

export const dynamic = "force-dynamic";

const ERRORS: Record<string, string> = {
  format: "Enter the 6-digit code from the email.",
  wrong: "That code isn't right. Check the latest email and try again; a code stops working after 5 wrong tries.",
  limit: "Too many attempts from this network. Wait an hour and try again.",
};

export default async function CodePage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; error?: string }>;
}) {
  const { email = "", error } = await searchParams;
  const base = await currentBase();

  return (
    <main className="mx-auto max-w-md px-4 py-16 md:py-24">
      <p className="font-jetbrains text-xs font-bold uppercase tracking-[0.3em] text-[var(--accent-color)]">
        ISA-RAIT Admin
      </p>
      <h1 className="mt-3 font-jetbrains text-2xl font-bold text-[var(--text-primary)]">Enter your code</h1>

      <div className="mt-8 space-y-5">
        {error && ERRORS[error] ? (
          <Notice tone="error">{ERRORS[error]}</Notice>
        ) : (
          <Notice>
            If <strong className="break-all">{email}</strong> belongs to an admin, a 6-digit code is on its way. It
            expires in 10 minutes and works once.
          </Notice>
        )}

        <form method="post" action="/api/admin/login/verify" className={cardClass}>
          <input type="hidden" name="email" value={email} />
          <label htmlFor="code" className={labelClass}>
            Sign-in code
          </label>
          <input
            id="code"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="\s*\d{3}\s*\d{3}\s*"
            maxLength={7}
            required
            autoFocus
            className={`${fieldClass} font-jetbrains text-lg tracking-[0.4em]`}
          />
          <button type="submit" className={`${buttonClass} mt-5 w-full`}>
            Sign in
          </button>
        </form>

        <p className="text-sm text-[var(--text-secondary)]">
          No email after a few minutes? Check spam, or{" "}
          <Link href={`${base}/login`} className="text-[var(--accent-color)] underline underline-offset-2">
            send a new code
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
