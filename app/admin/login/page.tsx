import { buttonClass, cardClass, Notice } from "@/components/admin/AdminShell";
import { fieldClass, labelClass } from "@/components/ui/formStyles";

export const dynamic = "force-dynamic";

const ERRORS: Record<string, string> = {
  email: "Enter your email address.",
  limit: "Too many sign-in requests. Wait an hour and try again.",
  expired: "That code has expired, was already used, or had too many wrong tries. Request a new one.",
  unavailable: "Sign-in is unavailable right now. Try again later.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="mx-auto max-w-md px-4 py-16 md:py-24">
      <p className="font-jetbrains text-xs font-bold uppercase tracking-[0.3em] text-[var(--accent-color)]">
        ISA-RAIT Admin
      </p>
      <h1 className="mt-3 font-jetbrains text-2xl font-bold text-[var(--text-primary)]">Sign in</h1>

      <div className="mt-8 space-y-5">
        {error && ERRORS[error] && <Notice tone="error">{ERRORS[error]}</Notice>}

        <form method="post" action="/api/admin/login" className={cardClass}>
          <label htmlFor="email" className={labelClass}>
            Email
          </label>
          <input id="email" name="email" type="email" autoComplete="email" required className={fieldClass} />
          <button type="submit" className={`${buttonClass} mt-5 w-full`}>
            Email me a sign-in code
          </button>
        </form>
      </div>
    </div>
  );
}
