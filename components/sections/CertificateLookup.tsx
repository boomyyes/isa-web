"use client";

import { useCallback, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CircleAlert,
  CircleSlash,
  Download,
  Loader2,
  Printer,
  Search,
} from "lucide-react";
import { AngularButton } from "@/components/ui/AngularButton";
import { HolographicCard } from "@/components/ui/HolographicCard";
import { TerminalShell } from "@/components/ui/TerminalShell";
import { fieldClass, labelClass } from "@/components/ui/formStyles";
import { formatEventDate } from "@/lib/events";
import type { PublicCertView, PublicWorkshopView } from "@/lib/certificates";

/** The support page lives at /help — the directory is `help`, the UI calls it "Support". */
const SUPPORT_HREF = "/help";

// Download tokens are valid for 10 minutes. Refresh a little before that, so a
// result left open in a background tab never drops the student on a bare 403.
const TOKEN_STALE_MS = 9 * 60 * 1000;

type LookupResult =
  | { ok: true; view: PublicCertView }
  | { ok: false; error: string; status: number };

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
  // The access code stays in component state only — never in the URL, never in
  // localStorage, never logged.
  const [uid, setUid] = useState("");
  const [password, setPassword] = useState("");

  const [searching, setSearching] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [result, setResult] = useState<PublicCertView | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchedAt, setFetchedAt] = useState(0);

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setSearching(true);
      setError(null);
      setNotFound(false);
      setResult(null);

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

  const handleDownload = useCallback(
    async (workshopId: string) => {
      if (!result) return;

      let token = result.workshops.find((w) => w.id === workshopId)?.downloadToken ?? null;

      // Token is close to expiry — quietly re-run the lookup for a fresh one.
      if (token && Date.now() - fetchedAt > TOKEN_STALE_MS) {
        setDownloading(workshopId);
        const res = await lookup(uid, password);
        setDownloading(null);

        if (!res.ok) {
          setError("Your session expired. Please search again.");
          return;
        }
        setResult(res.view);
        setFetchedAt(Date.now());
        token = res.view.workshops.find((w) => w.id === workshopId)?.downloadToken ?? null;
      }

      if (!token) {
        setError("That certificate isn't available right now. Please search again.");
        return;
      }

      // The endpoint responds with Content-Disposition: attachment, so this
      // starts a download rather than navigating the page away.
      window.location.href = `/api/certificates/download?t=${encodeURIComponent(token)}`;
    },
    [result, fetchedAt, uid, password]
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
              <input
                id="cert-uid"
                name="uid"
                type="text"
                required
                inputMode="numeric"
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
            Your UID and access code were emailed to you when you registered. We
            only ever show your name and attendance — never your contact details.
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
          <div className="mt-5 text-center">
            <Link
              href={SUPPORT_HREF}
              className="inline-flex items-center gap-1.5 font-jetbrains text-sm text-[var(--accent-color)] transition-opacity hover:opacity-80"
            >
              Contact Support
              <ArrowRight className="h-4 w-4" />
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
            <h2 className="mt-2 font-jetbrains text-2xl font-bold tracking-tight text-[var(--text-primary)] md:text-3xl">
              {result.name}
            </h2>
          </header>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {result.workshops.map((workshop) => (
              <WorkshopCard
                key={workshop.id}
                workshop={workshop}
                busy={downloading === workshop.id}
                onDownload={handleDownload}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function WorkshopCard({
  workshop,
  busy,
  onDownload,
}: {
  workshop: PublicWorkshopView;
  busy: boolean;
  onDownload: (workshopId: string) => void;
}) {
  const { attended, physical } = workshop;

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
          {workshop.downloadToken ? (
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
            <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
              Your digital certificate hasn&apos;t been uploaded yet — it&apos;s on
              the way.
            </p>
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
