"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, CircleAlert, Copy, KeyRound, Loader2, MailCheck } from "lucide-react";
import { AngularButton } from "@/components/ui/AngularButton";
import { fieldClass, labelClass } from "@/components/ui/formStyles";

const SUPPORT_HREF = "/help";

/**
 * Two screens in one component, chosen by whether the URL carries a token:
 *
 *   /certificates/reset          -> ask for a UID, email a link
 *   /certificates/reset?t=<tok>  -> redeem that link, show the new code once
 */
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

function RedeemLink({ token }: { token: string }) {
  const [state, setState] = useState<
    { status: "working" } | { status: "done"; uid: string; password: string } | { status: "failed"; error: string }
  >({ status: "working" });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/certificates/reset/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const body = (await res.json().catch(() => null)) as
          | { uid?: string; password?: string; error?: string }
          | null;
        if (cancelled) return;

        if (res.ok && body?.uid && body?.password) {
          setState({ status: "done", uid: body.uid, password: body.password });
        } else {
          setState({
            status: "failed",
            error: body?.error ?? "This reset link is no longer valid.",
          });
        }
      } catch {
        if (!cancelled) {
          setState({ status: "failed", error: "Couldn't reach the server. Try the link again." });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  if (state.status === "working") {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-[var(--border-color)] bg-[var(--card-color)]/60 p-8 backdrop-blur-md">
        <Loader2 className="h-5 w-5 animate-spin text-[var(--border-active)]" />
        <p className="font-jetbrains text-sm text-[var(--text-secondary)]">
          Issuing a new access code…
        </p>
      </div>
    );
  }

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
