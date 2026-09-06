import "server-only";

import { ARTEMIS_RELEASE_AT, type ProblemStatement } from "@/lib/artemis";

/** Every field a statement must carry to be rendered at all. */
const STRING_FIELDS = [
  "id",
  "numeral",
  "patron",
  "patronDomain",
  "title",
] as const;

const PARAGRAPH_FIELDS = ["background", "challenge", "scope"] as const;

function isStatement(value: unknown): value is ProblemStatement {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;

  return (
    STRING_FIELDS.every(
      (key) => typeof record[key] === "string" && record[key] !== ""
    ) &&
    PARAGRAPH_FIELDS.every(
      (key) =>
        Array.isArray(record[key]) &&
        (record[key] as unknown[]).every((p) => typeof p === "string")
    )
  );
}

/**
 * The statements, or an empty array.
 *
 * Every failure path here returns nothing rather than throwing or returning
 * something half-formed: an unset variable, malformed JSON, or an entry missing
 * a field. The page treats an empty result as "still sealed", so the failure
 * mode of this function is the safe one — a typo in the environment cannot
 * publish a partial statement, it can only keep the seal on.
 */
export type { ProblemStatement };

export function getProblemStatements(): ProblemStatement[] {
  const raw = process.env.ARTEMIS_TRIALS;
  if (!raw) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    console.error("[artemis] ARTEMIS_TRIALS is not valid JSON — staying sealed");
    return [];
  }

  if (!Array.isArray(parsed) || !parsed.every(isStatement)) {
    console.error("[artemis] ARTEMIS_TRIALS does not match the expected shape — staying sealed");
    return [];
  }

  return parsed;
}

/**
 * The instant the seal breaks — the real one, or a rehearsal.
 *
 * The moment is worth rehearsing: the build-up and the break only play for
 * someone already on the page when the clock runs out, so there is exactly one
 * chance to see it for real. ARTEMIS_RELEASE_AT_DEV moves the instant to
 * whenever you like, which is what scripts/artemis-rehearse.ts sets.
 *
 * Two things keep that from being a way to publish the statements early:
 *
 * - It is ignored outright in a production build. The check is on NODE_ENV,
 *   which Next fixes at build time and which no request can influence, so the
 *   override cannot be switched on against a deployed site.
 * - Setting it requires write access to the server's environment — and anyone
 *   with that already has ARTEMIS_TRIALS itself, so it grants nothing new.
 *
 * A malformed value is ignored rather than guessed at: a typo here must not
 * quietly move the release, in either direction.
 */
function releaseInstant(): number {
  if (process.env.NODE_ENV === "production") return ARTEMIS_RELEASE_AT;

  const override = process.env.ARTEMIS_RELEASE_AT_DEV;
  if (!override) return ARTEMIS_RELEASE_AT;

  // Epoch milliseconds, or anything Date can parse — the script writes the
  // former, a human editing .env.local by hand will reach for the latter.
  const parsed = /^\d+$/.test(override.trim())
    ? Number(override.trim())
    : Date.parse(override);

  if (!Number.isFinite(parsed)) {
    console.error(
      "[artemis] ARTEMIS_RELEASE_AT_DEV is not a date or an epoch — ignoring it"
    );
    return ARTEMIS_RELEASE_AT;
  }

  console.warn(
    "[artemis] rehearsal: release overridden to " + new Date(parsed).toISOString()
  );
  return parsed;
}

/**
 * Whether the embargo has lifted.
 *
 * Called on the server, against the server's clock. A visitor moving their own
 * clock forward changes what their countdown reads and nothing else — the
 * statements are only ever sent by a server that agrees the hour has come.
 */
export function trialsReleased(now: number = Date.now()): boolean {
  return now >= releaseInstant();
}

/**
 * The gate, as the page consumes it: what to render, and the instant that
 * decision was made at.
 *
 * Both come from a single clock read on purpose. Asking twice — once to decide
 * whether the embargo has lifted, once for the timestamp the countdown
 * calibrates against — leaves a window, however small, where the two disagree.
 *
 * It also keeps the clock read out of the component body. Reading the time
 * during render is impure, and react-hooks/purity is right to flag it in the
 * general case; here the page is `force-dynamic` and renders exactly once per
 * request, which is precisely when asking the clock is the correct thing to do.
 * Naming that intent in one server-side function is more honest than an inline
 * call with a suppression comment over it.
 */
export function readTrials(): {
  statements: ProblemStatement[] | null;
  serverNow: number;
  releaseAt: number;
} {
  const serverNow = Date.now();
  // Resolved once and handed down, rather than imported directly by the
  // countdown. That is what lets a rehearsal move the moment for the clock and
  // the gate together — a client that read the constant for itself would go on
  // counting to September while the server had already opened.
  const releaseAt = releaseInstant();

  return {
    statements: serverNow >= releaseAt ? getProblemStatements() : null,
    serverNow,
    releaseAt,
  };
}
