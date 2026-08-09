"use client";

import { useCallback, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, CircleAlert, Copy, KeyRound, Loader2, MailCheck } from "lucide-react";
import { AngularButton } from "@/components/ui/AngularButton";
import { fieldClass, labelClass } from "@/components/ui/formStyles";
import { MIN_CODE_LENGTH, validateAccessCode } from "@/lib/certificates";

const SUPPORT_HREF = "/help";

/** Two screens: ask for a UID, or redeem the link if the URL carries a token. */
export function CertificateReset() {
  const params = useSearchParams();
  const token = params.get("t");

  return token ? <RedeemLink token={token} /> : <RequestLink />;
}

function RequestLink() {
  const [uid, setUid] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setBusy(true);
      setError(null);

      try {
        const res = await fetch("/api/certificates/reset", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uid }),
        });
        const body = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;

        if (res.ok) setSent(true);
        else setError(body?.error ?? "Something went wrong. Please try again.");
      } catch {
        setError("Couldn't reach the server. Check your connection and try again.");
      } finally {
        setBusy(false);
      }
    },
    [uid]
  );

  if (sent) {
    return (
      <div className="rounded-2xl border border-[var(--border-active)]/40 bg-[var(--card-color)]/60 p-6 backdrop-blur-md md:p-8">
        <MailCheck className="h-8 w-8 text-[var(--border-active)]" />
        <h2 className="mt-4 font-jetbrains text-lg font-semibold text-[var(--text-primary)]">
          Check your inbox
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
          If that UID is on our roster, we&apos;ve emailed a reset link to the
          address on file. It expires in 30 minutes and can be used once.
        </p>
        <p className="mt-4 text-sm leading-relaxed text-[var(--text-secondary)]">
          Your current access code keeps working until you open that link. Nothing
          arrived?{" "}
          <Link
            href={SUPPORT_HREF}
            className="inline-flex items-center gap-1 text-[var(--accent-color)] transition-opacity hover:opacity-80"
          >
            Contact Support
            <ArrowRight className="h-3 w-3" />
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-[var(--border-color)] bg-[var(--card-color)]/60 p-6 backdrop-blur-md md:p-8"
    >
      <label htmlFor="reset-uid" className={labelClass}>
        Your UID
      </label>
      <input
        id="reset-uid"
        name="uid"
        type="text"
        required
        inputMode="numeric"
        value={uid}
        onChange={(e) => setUid(e.target.value)}
        placeholder="1042"
        className={fieldClass}
      />

      <AngularButton
        type="submit"
        variant="primary"
        disabled={busy}
        className="mt-6 w-full disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
        {busy ? "Sending…" : "Email Me A Reset Link"}
      </AngularButton>

      {error && (
        <p
          role="alert"
          className="mt-4 flex items-center justify-center gap-2 font-jetbrains text-sm text-red-400"
        >
          <CircleAlert className="h-4 w-4 shrink-0" />
          {error}
        </p>
      )}

      <p className="mt-4 text-center text-xs leading-relaxed text-[var(--text-secondary)]">
        We can&apos;t look up your existing code — it&apos;s stored scrambled. This
        issues a brand-new one, which replaces the old.
      </p>
    </form>
  );
}

/**
 * The link is only spent on submit, never on load — a mail scanner following it
 * would otherwise consume someone's reset before they read the email.
 */
function RedeemLink({ token }: { token: string }) {
  const [code, setCode] = useState("");
  const [confirmCode, setConfirmCode] = useState("");
  const [busy, setBusy] = useState<"chosen" | "generated" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [state, setState] = useState<
    | { status: "form" }
    | { status: "done"; uid: string; password: string }
    | { status: "failed"; error: string }
  >({ status: "form" });

  const submit = useCallback(
    async (chosen: string | null) => {
      if (chosen !== null) {
        const problem = validateAccessCode(chosen);
        if (problem) return setError(problem);
        if (chosen !== confirmCode) return setError("Those two codes don't match.");
      }

      setBusy(chosen === null ? "generated" : "chosen");
      setError(null);

      try {
        const res = await fetch("/api/certificates/reset/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(chosen === null ? { token } : { token, password: chosen }),
        });
        const body = (await res.json().catch(() => null)) as
          | { uid?: string; password?: string; error?: string; reason?: string }
          | null;

        if (res.ok && body?.uid && body?.password) {
          setState({ status: "done", uid: body.uid, password: body.password });
        } else if (body?.reason === "code") {
          // Their code was rejected, not the link — stay put so they can retry.
          setError(body.error ?? "Pick a different code.");
        } else {
          setState({
            status: "failed",
            error: body?.error ?? "This reset link is no longer valid.",
          });
        }
      } catch {
        setError("Couldn't reach the server. Check your connection and try again.");
      } finally {
        setBusy(null);
      }
    },
    [token, confirmCode]
  );

  if (state.status === "failed") {
    return (
      <div className="rounded-2xl border border-red-500/40 bg-[var(--card-color)]/60 p-6 backdrop-blur-md md:p-8">
        <CircleAlert className="h-8 w-8 text-red-400" />
        <h2 className="mt-4 font-jetbrains text-lg font-semibold text-[var(--text-primary)]">
          Link no longer valid
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">{state.error}</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <AngularButton href="/certificates/reset" variant="primary">
            Request a new link
          </AngularButton>
          <AngularButton href={SUPPORT_HREF} variant="outline">
            Contact Support
          </AngularButton>
        </div>
      </div>
    );
  }

  if (state.status === "form") {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(code);
        }}
        className="rounded-2xl border border-[var(--border-color)] bg-[var(--card-color)]/60 p-6 backdrop-blur-md md:p-8"
      >
        <h2 className="font-jetbrains text-lg font-semibold text-[var(--text-primary)]">
          Choose your new access code
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
          Pick something you&apos;ll remember. It replaces your current code, and
          it&apos;s stored scrambled — so we won&apos;t be able to read it back to you.
        </p>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="reset-code" className={labelClass}>
              New access code
            </label>
            <input
              id="reset-code"
              name="new-password"
              type="password"
              required
              autoComplete="new-password"
              spellCheck={false}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className={`${fieldClass} font-jetbrains tracking-widest`}
            />
          </div>
          <div>
            <label htmlFor="reset-code-confirm" className={labelClass}>
              Confirm it
            </label>
            <input
              id="reset-code-confirm"
              name="confirm-password"
              type="password"
              required
              autoComplete="new-password"
              spellCheck={false}
              value={confirmCode}
              onChange={(e) => setConfirmCode(e.target.value)}
              className={`${fieldClass} font-jetbrains tracking-widest`}
            />
          </div>
        </div>

        <p className="mt-3 text-xs text-[var(--text-secondary)]">
          At least {MIN_CODE_LENGTH} letters or numbers. Capitals, spaces and
          punctuation are ignored when you sign in.
        </p>

        {error && (
          <p
            role="alert"
            className="mt-4 flex items-center gap-2 font-jetbrains text-sm text-red-400"
          >
            <CircleAlert className="h-4 w-4 shrink-0" />
            {error}
          </p>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <AngularButton
            type="submit"
            variant="primary"
            disabled={busy !== null}
            className="disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy === "chosen" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <KeyRound className="h-4 w-4" />
            )}
            Set this code
          </AngularButton>
          <AngularButton
            type="button"
            variant="outline"
            disabled={busy !== null}
            onClick={() => submit(null)}
            className="disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy === "generated" && <Loader2 className="h-4 w-4 animate-spin" />}
            Generate one for me
          </AngularButton>
        </div>
      </form>
    );
  }

  return (
    <div className="rounded-2xl border border-[var(--border-active)]/40 bg-[var(--card-color)]/60 p-6 backdrop-blur-md md:p-8">
      <h2 className="font-jetbrains text-lg font-semibold text-[var(--text-primary)]">
        Here&apos;s your new access code
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
        Save it now — this is the only time it will be shown. Your previous code no
        longer works.
      </p>

      <dl className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-color)]/50 px-4 py-3">
          <dt className={labelClass}>UID</dt>
          <dd className="font-jetbrains text-xl font-bold text-[var(--text-primary)]">
            {state.uid}
          </dd>
        </div>
        <div className="rounded-xl border border-[var(--border-active)]/50 bg-[var(--bg-color)]/50 px-4 py-3">
          <dt className={labelClass}>Access code</dt>
          <dd className="font-jetbrains text-xl font-bold tracking-widest text-[var(--border-active)]">
            {state.password}
          </dd>
        </div>
      </dl>

      <div className="mt-6 flex flex-wrap gap-3">
        <AngularButton
          type="button"
          variant="outline"
          onClick={() => {
            navigator.clipboard?.writeText(state.password).then(
              () => {
                setCopied(true);
                window.setTimeout(() => setCopied(false), 2500);
              },
              () => setCopied(false)
            );
          }}
        >
          <Copy className="h-4 w-4" />
          {copied ? "Copied" : "Copy code"}
        </AngularButton>
        <AngularButton href="/certificates" variant="primary">
          Go to certificates
          <ArrowRight className="h-4 w-4" />
        </AngularButton>
      </div>
    </div>
  );
}
