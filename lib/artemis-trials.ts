import "server-only";

import { ARTEMIS_RELEASE_AT, type ProblemStatement } from "@/lib/artemis";

/**
 * The Artemis problem statements, and the embargo on them.
 *
 * These are held back until the hackathon opens, and "held back" has to mean
 * more than "not rendered": anyone can read a page's source, and this
 * repository is public. So the statements live nowhere in the tree — they are
 * read at runtime from ARTEMIS_TRIALS, and this is the only module that touches
 * that variable.
 *
 * `import "server-only"` is the load-bearing line above. It makes importing
 * this file from a component marked "use client" a *build* error rather than a
 * silent inclusion of the statements in the JS bundle, which is the one mistake
 * that would undo the whole arrangement. app/artemis/page.tsx is a server
 * component; it reads these and passes them down as props only once the embargo
 * has lifted, so before that there is nothing in the HTML or the RSC payload to
 * find.
 *
 * The variable is deliberately not NEXT_PUBLIC_-prefixed. That prefix inlines a
 * value into the client bundle at build time, which is exactly the leak this
 * module exists to prevent.
 */

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
 * Whether the embargo has lifted.
 *
 * Called on the server, against the server's clock. A visitor moving their own
 * clock forward changes what their countdown reads and nothing else — the
 * statements are only ever sent by a server that agrees the hour has come.
 */
export function trialsReleased(now: number = Date.now()): boolean {
  return now >= ARTEMIS_RELEASE_AT;
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
} {
  const serverNow = Date.now();

  return {
    statements: trialsReleased(serverNow) ? getProblemStatements() : null,
    serverNow,
  };
}
