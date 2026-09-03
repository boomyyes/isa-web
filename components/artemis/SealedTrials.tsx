"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { animate, createDrawable, eases, spring, stagger } from "animejs";
import { cn } from "@/lib/utils";
import {
  AstrolabeOuter,
  CrescentBow,
  StarGlyph,
} from "@/components/artemis/GreekOrnaments";
import { ParchmentPanel } from "@/components/artemis/ParchmentPanel";
import { undash } from "@/components/artemis/reveal";
import { prefersReducedMotion } from "@/components/artemis/useArtemisAnime";
import { ARTEMIS_RELEASE_AT } from "@/lib/artemis";

/**
 * What stands in for the problem statements until the hackathon opens: a sealed
 * sheet, and a clock counting down to the hour the seal breaks.
 *
 * The statements are not hidden here — they were never sent. The server decides
 * whether the embargo has lifted and only serialises them once it has, so this
 * component is what the page *is* before then, rather than a lid over something
 * already present in the response. See lib/artemis-trials.ts.
 *
 * Two things this has to get right, and both are easy to miss:
 *
 * 1. The countdown renders as em-dashes until an effect has run. A live clock
 *    rendered during SSR is a guaranteed hydration mismatch — the server's
 *    second and the client's are never the same one.
 *
 * 2. It counts against the *server's* clock, not the visitor's. The page hands
 *    down the time it rendered at; the offset from local time is measured once
 *    and applied to every tick after. Without that, a laptop three minutes fast
 *    would show the seal breaking, ask the server for the statements, be told
 *    no, and sit there looking broken.
 *
 * Neither of those is a security control. The security control is that the
 * server never sends the text early — this is only about the moment reading
 * correctly for the people watching it happen.
 */

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * How long the seal takes to come apart, and when the page asks for the
 * statements. The request goes out *during* the animation rather than after it,
 * so a round trip under a second is invisible.
 */
const BREAK_MS = 1000;

/** Retry cadence if the server does not agree the hour has come yet. */
const RETRY_MS = 3000;

/**
 * The escalation. Quiet until the last minute, then the seal starts working
 * itself loose, then the final ten seconds where the rim drains like a fuse.
 */
type Phase = "quiet" | "final-minute" | "final-ten" | "breaking";

function unitsOf(ms: number) {
  const left = Math.max(0, ms);
  return [
    { key: "days", label: "Days", value: Math.floor(left / DAY) },
    { key: "hours", label: "Hours", value: Math.floor((left % DAY) / HOUR) },
    { key: "minutes", label: "Minutes", value: Math.floor((left % HOUR) / MINUTE) },
    { key: "seconds", label: "Seconds", value: Math.floor((left % MINUTE) / SECOND) },
  ];
}

/** The wax seal: an engraved rim around the crescent-and-bow mark. */
function SealCrest() {
  return (
    <>
      <span data-seal-rim className="absolute inset-0 block">
        <AstrolabeOuter className="h-full w-full text-[var(--artemis-oxblood)] opacity-60" />
      </span>
      <span className="absolute inset-[26%] flex items-center justify-center">
        <CrescentBow
          maskId="artemis-seal-crescent"
          className="h-full w-full text-[var(--artemis-oxblood)] opacity-80"
        />
      </span>
    </>
  );
}

export function SealedTrials({ serverNow }: { serverNow: number }) {
  const router = useRouter();
  const root = useRef<HTMLDivElement>(null);

  // null means "not yet measured" — the state the server renders in.
  const [remaining, setRemaining] = useState<number | null>(null);
  const [broken, setBroken] = useState(false);

  // How far the visitor's clock sits from the one that actually decides.
  const skew = useRef(0);
  // Read by the drain, which needs the current value without re-running on it.
  const latest = useRef<number | null>(null);

  useEffect(() => {
    skew.current = serverNow - Date.now();

    const tick = () => {
      const left = ARTEMIS_RELEASE_AT - (Date.now() + skew.current);
      latest.current = left;
      setRemaining(left);
      // Set from the timer rather than from an effect watching `remaining`:
      // the clock is the external system here, and this is the callback it
      // reports through. It is also sticky — once the hour has come it stays
      // come, so a clock that jitters backwards cannot re-seal the page.
      if (left <= 0) setBroken(true);
    };

    tick();
    // Four times a second, so the displayed second turns over close to when it
    // actually does rather than up to a second late.
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [serverNow]);

  const phase: Phase = broken
    ? "breaking"
    : remaining == null || remaining > MINUTE
      ? "quiet"
      : remaining > 10 * SECOND
        ? "final-minute"
        : "final-ten";

  /* ---- The final ten seconds: the rim drains ---- */

  useEffect(() => {
    if (phase !== "final-ten" || prefersReducedMotion()) return;

    const rim = root.current?.querySelector<HTMLElement>("[data-seal-rim]");
    if (!rim) return;

    const strokes = Array.from(
      rim.querySelectorAll<SVGGeometryElement>("circle, line")
    );
    if (!strokes.length) return;

    // Drawn away rather than on, over whatever is actually left — so arriving
    // at four seconds shows four seconds of rim, not a restarted ten.
    const drain = animate(createDrawable(strokes), {
      draw: ["0 1", "0 0"],
      duration: Math.max(1, latest.current ?? 10 * SECOND),
      ease: eases.linear,
      delay: stagger(6),
    });

    return () => {
      drain.revert();
      // revert() restores the geometry but leaves createDrawable's dash
      // attributes on it, and a dashed stroke is markedly more expensive to
      // rasterise than a solid one. Same reasoning as reveal.ts.
      undash(strokes);
    };
  }, [phase]);

  /* ---- The final ten seconds: one pulse per second ---- */

  const seconds =
    remaining == null ? null : Math.floor(Math.max(0, remaining) / SECOND);

  useEffect(() => {
    if (phase !== "final-ten" || prefersReducedMotion()) return;

    const node = root.current?.querySelector<HTMLElement>("[data-seal-seconds]");
    if (!node) return;

    const pulse = animate(node, {
      scale: [1.28, 1],
      ease: spring({ stiffness: 200, damping: 12 }),
    });

    return () => {
      pulse.revert();
    };
  }, [seconds, phase]);

  /* ---- Zero: the seal comes apart, and the page asks for the statements ---- */

  useEffect(() => {
    if (!broken) return;

    const el = root.current;
    const pull = () => router.refresh();

    // When the server agrees the hour has come, the re-render unmounts this
    // component and every timer below goes with it. When it does not — a server
    // clock a shade behind this one — the retry keeps asking and the broken-seal
    // state holds. Snapping back to a countdown would read as a bug.
    const retry = window.setInterval(pull, RETRY_MS);

    if (!el || prefersReducedMotion()) {
      pull();
      return () => window.clearInterval(retry);
    }

    const pullAt = window.setTimeout(pull, BREAK_MS);

    const halves: { node: HTMLElement | null; x: number; r: number }[] = [
      { node: el.querySelector("[data-seal-half-left]"), x: -90, r: -22 },
      { node: el.querySelector("[data-seal-half-right]"), x: 90, r: 22 },
    ];

    halves.forEach(({ node, x, r }) => {
      if (!node) return;
      animate(node, {
        translateX: x,
        translateY: 26,
        rotate: r,
        opacity: 0,
        duration: 900,
        // Accelerating away: the halves are falling, not easing to a stop.
        ease: eases.in(2),
      });
    });

    // Twelve glyphs stacked at the centre, thrown out along evenly spaced
    // bearings. Animated one at a time rather than as a set with a function
    // value: each needs its own bearing, and a per-target function is typed on
    // AnimationParams as an easing rather than a value, so the loop is both
    // clearer and the only version that type-checks.
    const sparks = el.querySelectorAll<HTMLElement>("[data-seal-spark]");
    sparks.forEach((spark, i) => {
      const bearing = (i / sparks.length) * Math.PI * 2;

      animate(spark, {
        translateX: Math.cos(bearing) * 150,
        translateY: Math.sin(bearing) * 150,
        scale: [0.4, 1.6],
        opacity: [1, 0],
        duration: 900,
        delay: i * 18,
        ease: eases.out(3),
      });
    });

    animate(el.querySelectorAll("[data-seal-flare]"), {
      opacity: [0, 0.85, 0],
      scale: [0.25, 3.4],
      duration: 1100,
      ease: eases.out(3),
    });

    animate(el.querySelectorAll("[data-seal-clock]"), {
      opacity: 0,
      translateY: -16,
      duration: 420,
      ease: eases.in(2),
    });

    return () => {
      window.clearTimeout(pullAt);
      window.clearInterval(retry);
    };
  }, [broken, router]);

  const values = unitsOf(remaining ?? 0);
  // The rim turns for the last minute and keeps turning through the final ten.
  const stirring = phase === "final-minute" || phase === "final-ten";

  return (
    <div ref={root} className="mt-14">
      <ParchmentPanel corners contentClassName="flex flex-col items-center text-center">
        {/* The seal. Two copies of the same crest under complementary clips,
            stacked exactly on top of each other — at rest they read as one
            engraving, and at zero they can be thrown apart. */}
        <div className="relative h-36 w-36 sm:h-44 sm:w-44">
          <span
            aria-hidden
            data-seal-flare
            className="pointer-events-none absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-0"
            style={{
              background:
                "radial-gradient(circle, rgba(217,169,76,0.95) 0%, rgba(140,106,42,0.5) 45%, transparent 70%)",
            }}
          />

          {/* The named utility rather than an arbitrary `animation:` value, so
              the prefers-reduced-motion block in globals.css catches the stir. */}
          <span
            aria-hidden
            data-seal-half-left
            className={cn(
              "absolute inset-0 block [clip-path:inset(0_50%_0_0)]",
              stirring && "animate-artemis-orbit"
            )}
          >
            <SealCrest />
          </span>

          <span
            aria-hidden
            data-seal-half-right
            className={cn(
              "absolute inset-0 block [clip-path:inset(0_0_0_50%)]",
              stirring && "animate-artemis-orbit"
            )}
          >
            <SealCrest />
          </span>

          {/* The burst. Stacked at the centre and invisible until thrown. */}
          {Array.from({ length: 12 }).map((_, i) => (
            <StarGlyph
              key={i}
              aria-hidden
              data-seal-spark
              className="pointer-events-none absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 text-[var(--artemis-oxblood)] opacity-0"
            />
          ))}
        </div>

        <p className="mt-8 font-cinzel text-sm uppercase tracking-[0.35em] text-[var(--artemis-oxblood)]">
          {broken ? "The seal is broken" : "The seal holds"}
        </p>

        {broken ? (
          <p
            aria-live="polite"
            className="mt-6 max-w-md font-cormorant text-xl italic leading-relaxed text-[var(--text-primary)]"
          >
            The trials are being brought out. A moment.
          </p>
        ) : (
          <div
            data-seal-clock
            className="mt-6 flex items-start justify-center gap-5 sm:gap-9"
          >
            {values.map((unit) => {
              const isSeconds = unit.key === "seconds";

              return (
                <div key={unit.key} className="flex flex-col items-center">
                  <span
                    {...(isSeconds ? { "data-seal-seconds": "" } : null)}
                    className={cn(
                      "font-cinzel font-bold leading-none tabular-nums text-[var(--artemis-navy)] transition-[font-size] duration-500",
                      phase === "final-ten" && isSeconds
                        ? "text-5xl sm:text-6xl"
                        : "text-3xl sm:text-4xl"
                    )}
                  >
                    {/* Em-dash until the clock has been set against the
                        server's — see the hydration note at the top. */}
                    {remaining == null
                      ? "—"
                      : unit.key === "days"
                        ? unit.value
                        : String(unit.value).padStart(2, "0")}
                  </span>
                  <span className="mt-2 font-cinzel text-[0.55rem] uppercase tracking-[0.3em] text-[var(--artemis-oxblood)]">
                    {unit.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        <p className="mt-8 max-w-lg font-cormorant text-lg leading-relaxed text-[var(--text-primary)] sm:text-xl">
          The three trials are sealed until 26 September, twelve noon. They are
          not held on this page before then — there is nothing here to read
          early, however you look.
        </p>
      </ParchmentPanel>
    </div>
  );
}
