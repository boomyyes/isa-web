"use client";

import { useCallback, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CircleAlert,
  CircleSlash,
  Download,
  FileWarning,
  KeyRound,
  Loader2,
  Printer,
  Search,
} from "lucide-react";
import { AngularButton } from "@/components/ui/AngularButton";
import { HolographicCard } from "@/components/ui/HolographicCard";
import { TerminalShell } from "@/components/ui/TerminalShell";
import { fieldClass, labelClass } from "@/components/ui/formStyles";
import { formatEventDate } from "@/lib/events";
import {
  MIN_CODE_LENGTH,
  validateAccessCode,
  type PublicCertView,
  type PublicWorkshopView,
} from "@/lib/certificates";

/** The directory is `help`; the UI calls it "Support". */
const SUPPORT_HREF = "/help";

/** Tokens last 10 min — refresh early so a tab left open doesn't hit a bare 403. */
const TOKEN_STALE_MS = 9 * 60 * 1000;

type LookupResult =
  | { ok: true; view: PublicCertView }
  | { ok: false; error: string; status: number };

type ProbeResult =
  | { ok: true; url: string }
  | { ok: false; reason: string; error: string };

/**
 * Resolves the download without leaving the page, so a certificate that was
 * never uploaded surfaces as a card state instead of an error page.
 */
async function probeDownload(token: string): Promise<ProbeResult> {
  try {
    const res = await fetch(
      `/api/certificates/download?probe=1&t=${encodeURIComponent(token)}`
    );
    const body = (await res.json().catch(() => null)) as {
      url?: unknown;
      reason?: unknown;
      error?: unknown;
    } | null;

    if (res.ok && typeof body?.url === "string") {
      return { ok: true, url: body.url };
    }
    return {
      ok: false,
      reason: typeof body?.reason === "string" ? body.reason : "unavailable",
      error:
        typeof body?.error === "string"
          ? body.error
          : "That certificate couldn't be fetched. Please try again.",
    };
  } catch {
    return {
      ok: false,
      reason: "unavailable",
      error: "Couldn't reach the server. Check your connection and try again.",
    };
  }
}

async function lookup(uid: string, password: string): Promise<LookupResult> {
  try {
    const res = await fetch("/api/certificates/lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid, password }),
    });

    if (res.ok) {
      return { ok: true, view: (await res.json()) as PublicCertView };
    }

    const body = (await res.json().catch(() => null)) as { error?: unknown } | null;
    return {
      ok: false,
      status: res.status,
      error:
        typeof body?.error === "string"
          ? body.error
          : "Something went wrong. Please try again.",
    };
  } catch {
    return {
      ok: false,
      status: 0,
      error: "Couldn't reach the server. Check your connection and try again.",
    };
  }
}

export function CertificateLookup() {
  // Component state only — never the URL, never localStorage.
  const [uid, setUid] = useState("");
  const [password, setPassword] = useState("");

  const [searching, setSearching] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [result, setResult] = useState<PublicCertView | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchedAt, setFetchedAt] = useState(0);
  /** Workshops whose image turned out to be missing when we went to fetch it. */
  const [missing, setMissing] = useState<Set<string>>(() => new Set());

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setSearching(true);
      setError(null);
      setNotFound(false);
      setResult(null);
      setMissing(new Set());

      const res = await lookup(uid, password);
      setSearching(false);

      if (res.ok) {
        setResult(res.view);
        setFetchedAt(Date.now());
      } else if (res.status === 401) {
        setNotFound(true);
      } else {
        setError(res.error);
      }
    },
    [uid, password]
  );

  const markMissing = useCallback((workshopId: string) => {
    setMissing((current) => new Set(current).add(workshopId));
  }, []);

  const handleDownload = useCallback(
    async (workshopId: string) => {
      if (!result) return;

      let token = result.workshops.find((w) => w.id === workshopId)?.downloadToken ?? null;
      setDownloading(workshopId);
      setError(null);

      // Token is close to expiry — quietly re-run the lookup for a fresh one.
      if (token && Date.now() - fetchedAt > TOKEN_STALE_MS) {
        const res = await lookup(uid, password);
        if (!res.ok) {
          setDownloading(null);
          setError("Your session expired. Please search again.");
          return;
        }
        setResult(res.view);
        setFetchedAt(Date.now());
        token = res.view.workshops.find((w) => w.id === workshopId)?.downloadToken ?? null;
      }

      if (!token) {
        setDownloading(null);
        markMissing(workshopId);
        return;
      }

      const probe = await probeDownload(token);
      setDownloading(null);

      if (probe.ok) {
        // Presigned with Content-Disposition: attachment, so this downloads
        // rather than navigating away.
        window.location.href = probe.url;
      } else if (probe.reason === "missing") {
        markMissing(workshopId);
      } else {
        setError(probe.error);
      }
    },
    [result, fetchedAt, uid, password, markMissing]
  );

  return (
    <div>
      {/* Lookup form */}
      <div className="relative">
        {/* Ambient accent glow behind the card. */}
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-4 -z-10 rounded-[2rem] opacity-20 blur-3xl"
          style={{ background: "var(--border-active)" }}
        />

        <form
          onSubmit={handleSubmit}
          className="relative overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--card-color)]/60 p-6 backdrop-blur-md md:p-8"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label htmlFor="cert-uid" className={labelClass}>
                UID
              </label>
              {/* No inputMode: UIDs come from the roster sheet verbatim and are
                  not guaranteed numeric — normalizeUid preserves leading zeros,
                  so "01" is a real UID. A numeric inputMode gives iOS a keypad
                  with no letters, making an alphanumeric UID untypeable. */}
              <input
                id="cert-uid"
                name="uid"
                type="text"
                required
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                autoComplete="username"
                value={uid}
                onChange={(e) => setUid(e.target.value)}
                placeholder="1042"
                className={fieldClass}
              />
            </div>

            <div>
              <label htmlFor="cert-password" className={labelClass}>
                Access Code
              </label>
              <input
                id="cert-password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                spellCheck={false}
                autoCapitalize="characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="XXXX-XXXX"
                className={`${fieldClass} font-jetbrains tracking-widest`}
              />
            </div>
          </div>

          <AngularButton
            type="submit"
            variant="primary"
            disabled={searching}
            className="mt-6 w-full shadow-[0_0_24px_-4px_var(--accent-color)] transition-shadow duration-300 hover:shadow-[0_0_34px_-2px_var(--accent-color)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {searching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            {searching ? "Searching…" : "Find My Certificates"}
          </AngularButton>

          <p className="mt-4 text-center text-xs leading-relaxed text-[var(--text-secondary)]">
            Your UID and access code were emailed to you when you registered.{" "}
            <Link
              href="/certificates/reset"
              className="text-[var(--accent-color)] transition-opacity hover:opacity-80"
            >
              Lost your code?
            </Link>
          </p>
        </form>
      </div>

      {/* Error banner */}
      {error && (
        <p
          role="alert"
          className="mt-6 flex items-center justify-center gap-2 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 font-jetbrains text-sm text-red-400"
        >
          <CircleAlert className="h-4 w-4 shrink-0" />
          {error}
        </p>
      )}

      {/* No matching record */}
      {notFound && (
        <div className="mt-10">
          <TerminalShell
            title="bin/certificates.sh"
            envStatus="NO_MATCH"
            contentLines={[
              "Verifying credentials...",
              "> Access denied.",
              "Check your UID and access code against the email we sent you.",
              "The code is case-insensitive; the dash is optional.",
              "Lost the email? Raise a query on the Support page.",
            ]}
          />
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-center">
            <Link
              href="/certificates/reset"
              className="inline-flex items-center gap-1.5 font-jetbrains text-sm text-[var(--accent-color)] transition-opacity hover:opacity-80"
            >
              Get a new access code
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={SUPPORT_HREF}
              className="inline-flex items-center gap-1.5 font-jetbrains text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
            >
              Contact Support
            </Link>
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <section className="mt-12">
          <header>
            <p className="font-jetbrains text-xs uppercase tracking-[0.3em] text-[var(--accent-color)]">
              [ Record matched ]
            </p>
            {/* Wraps rather than squashing a long name on narrow screens. */}
            <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
              <h2 className="font-jetbrains text-2xl font-bold tracking-tight text-[var(--text-primary)] md:text-3xl">
                {result.name}
              </h2>
              <span className="shrink-0 rounded-full border border-[var(--border-active)]/40 bg-[var(--border-active)]/10 px-3 py-1 font-jetbrains text-xs font-medium uppercase tracking-widest text-[var(--border-active)]">
                UID {result.uid}
              </span>
            </div>
          </header>

          <ChangeCodePanel
            uid={result.uid}
            currentPassword={password}
            onChanged={(next) => setPassword(next)}
          />

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {result.workshops.map((workshop) => (
              <WorkshopCard
                key={workshop.id}
                workshop={workshop}
                busy={downloading === workshop.id}
                missing={missing.has(workshop.id)}
                onDownload={handleDownload}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

/**
 * Collapsed by default — most students just want their certificate. The current
 * code isn't asked for again; they signed in with it moments ago.
 */
function ChangeCodePanel({
  uid,
  currentPassword,
  onChanged,
}: {
  uid: string;
  currentPassword: string;
  onChanged: (next: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [confirmCode, setConfirmCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      const problem = validateAccessCode(code);
      if (problem) return setError(problem);
      if (code !== confirmCode) return setError("Those two codes don't match.");

      setBusy(true);
      setError(null);
      try {
        const res = await fetch("/api/certificates/password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uid, password: currentPassword, newPassword: code }),
        });
        const body = (await res.json().catch(() => null)) as { error?: string } | null;

        if (res.ok) {
          // Keeps the stale-token refresh working with the code that now applies.
          onChanged(code);
          setDone(true);
          setCode("");
          setConfirmCode("");
        } else {
          setError(body?.error ?? "Couldn't change your code. Please try again.");
        }
      } catch {
        setError("Couldn't reach the server. Check your connection and try again.");
      } finally {
        setBusy(false);
      }
    },
    [uid, currentPassword, code, confirmCode, onChanged]
  );

  if (done) {
    return (
      <p className="mt-6 flex items-center gap-2 rounded-lg border border-[var(--border-active)]/40 bg-[var(--border-active)]/10 px-4 py-3 font-jetbrains text-sm text-[var(--border-active)]">
        <BadgeCheck className="h-4 w-4 shrink-0" />
        Access code updated. Use it next time you sign in.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-5 inline-flex items-center gap-1.5 font-jetbrains text-xs text-[var(--text-secondary)] transition-colors hover:text-[var(--accent-color)]"
      >
        <KeyRound className="h-3.5 w-3.5" />
        Change my access code
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-5 rounded-2xl border border-[var(--border-color)]/60 bg-[var(--card-color)]/40 p-5 backdrop-blur-md"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="change-code" className={labelClass}>
            New access code
          </label>
          <input
            id="change-code"
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
          <label htmlFor="change-code-confirm" className={labelClass}>
            Confirm it
          </label>
          <input
            id="change-code-confirm"
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
          className="mt-3 flex items-center gap-2 font-jetbrains text-sm text-red-400"
        >
          <CircleAlert className="h-4 w-4 shrink-0" />
          {error}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-3">
        <AngularButton
          type="submit"
          variant="primary"
          disabled={busy}
          className="disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <KeyRound className="h-4 w-4" />
          )}
          Save new code
        </AngularButton>
        <AngularButton type="button" variant="outline" onClick={() => setOpen(false)}>
          Cancel
        </AngularButton>
      </div>
    </form>
  );
}

function WorkshopCard({
  workshop,
  busy,
  missing,
  onDownload,
}: {
  workshop: PublicWorkshopView;
  busy: boolean;
  missing: boolean;
  onDownload: (workshopId: string) => void;
}) {
  const { attended, physical } = workshop;
  const downloadable = Boolean(workshop.downloadToken) && !missing;

  return (
    <HolographicCard className="clip-angular-reverse flex flex-col p-5">
      <div className="flex items-center gap-2">
        {attended ? (
          <BadgeCheck className="h-4 w-4 text-[var(--border-active)]" />
        ) : (
          <CircleSlash className="h-4 w-4 text-[var(--text-secondary)] opacity-60" />
        )}
        <span
          className={
            attended
              ? "font-jetbrains text-[0.65rem] font-medium uppercase tracking-widest text-[var(--border-active)]"
              : "font-jetbrains text-[0.65rem] font-medium uppercase tracking-widest text-[var(--text-secondary)]"
          }
        >
          {attended ? "Attended" : "Not Attended"}
        </span>
      </div>

      <h3 className="mt-3 font-jetbrains text-base font-semibold leading-snug text-[var(--text-primary)]">
        {workshop.title}
      </h3>
      <p className="mt-1 font-jetbrains text-xs text-[var(--text-secondary)]">
        {formatEventDate(workshop.date)}
      </p>

      {attended ? (
        <div className="mt-5 flex flex-1 flex-col justify-end gap-4">
          {downloadable ? (
            <AngularButton
              type="button"
              variant="primary"
              disabled={busy}
              onClick={() => onDownload(workshop.id)}
              className="w-full disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Digital Copy
            </AngularButton>
          ) : (
            <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
              <FileWarning className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
              <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
                Your digital certificate hasn&apos;t been uploaded yet — your
                attendance is recorded, so it&apos;s on the way.{" "}
                <Link
                  href={SUPPORT_HREF}
                  className="inline-flex items-center gap-1 text-[var(--accent-color)] transition-opacity hover:opacity-80"
                >
                  Chase it up
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </p>
            </div>
          )}

          <p className="flex items-start gap-2 border-t border-[var(--border-color)]/60 pt-4 text-xs leading-relaxed text-[var(--text-secondary)]">
            <Printer className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent-color)]" />
            <span>
              {physical === "chargeable" ? (
                <>
                  You&apos;ve already collected a physical copy — any{" "}
                  <strong className="font-semibold text-[var(--text-primary)]">
                    additional copy is chargeable
                  </strong>
                  .{" "}
                </>
              ) : (
                <>
                  Want it printed? Your{" "}
                  <strong className="font-semibold text-[var(--text-primary)]">
                    first physical copy is free of cost
                  </strong>
                  .{" "}
                </>
              )}
              <Link
                href={SUPPORT_HREF}
                className="inline-flex items-center gap-1 text-[var(--accent-color)] transition-opacity hover:opacity-80"
              >
                Request it
                <ArrowRight className="h-3 w-3" />
              </Link>
            </span>
          </p>
        </div>
      ) : (
        <div className="mt-5 flex flex-1 flex-col justify-end gap-3">
          <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
            No attendance is recorded for this workshop, so no certificate is
            available.
          </p>
          <Link
            href={SUPPORT_HREF}
            className="inline-flex items-center gap-1.5 font-jetbrains text-xs text-[var(--accent-color)] transition-opacity hover:opacity-80"
          >
            Think this is wrong? Raise a query
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}
    </HolographicCard>
  );
}
