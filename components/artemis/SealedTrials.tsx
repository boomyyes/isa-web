"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { animate, createDrawable, eases, spring, stagger } from "animejs";
import { cn } from "@/lib/utils";
import {
  AstrolabeInner,
  AstrolabeOuter,
  CrescentBow,
  StarGlyph,
} from "@/components/artemis/GreekOrnaments";
import { ParchmentPanel } from "@/components/artemis/ParchmentPanel";
import { undash } from "@/components/artemis/reveal";
import { prefersReducedMotion } from "@/components/artemis/useArtemisAnime";

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

/** Retry cadence if the server does not agree the hour has come yet. */
const RETRY_MS = 3000;

/**
 * The wind-up before the burst. The seal draws in on itself for a beat — a
 * break with no anticipation in front of it reads as a glitch rather than an
 * event, and this is the cheapest possible anticipation.
 */
const WIND_UP_MS = 150;

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

/** Bearings for the things thrown outward, in radians. */
function bearing(i: number, total: number, offset = 0) {
  return (i / total) * Math.PI * 2 + offset;
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

export function SealedTrials({
  serverNow,
  releaseAt,
  onBreak,
}: {
  serverNow: number;
  /**
   * Handed down rather than imported from lib/artemis. The server resolves the
   * instant — which a rehearsal can move — and the clock here has to be counting
   * to the same one the gate is measuring against, or the two drift apart.
   */
  releaseAt: number;
  /**
   * Called once, at zero. TrialsSection uses it to hold the sealed view on
   * screen for the length of the burst, so the statements arriving mid-flight
   * cannot cut the best part of it off.
   */
  onBreak: () => void;
}) {
  const router = useRouter();
  const root = useRef<HTMLDivElement>(null);

  // null means "not yet measured" — the state the server renders in.
  const [remaining, setRemaining] = useState<number | null>(null);
  const [broken, setBroken] = useState(false);

  // How far the visitor's clock sits from the one that actually decides.
  const skew = useRef(0);
  // Read by the drain, which needs the current value without re-running on it.
  const latest = useRef<number | null>(null);
  // Held in a ref, and kept current from an effect rather than during render.
  // The break effect must not list `onBreak` in its dependencies: if the parent
  // ever handed down a fresh callback the effect would re-run, and the entire
  // burst would replay from the top.
  const announce = useRef(onBreak);

  useEffect(() => {
    announce.current = onBreak;
  }, [onBreak]);

  useEffect(() => {
    skew.current = serverNow - Date.now();

    const tick = () => {
      const left = releaseAt - (Date.now() + skew.current);
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
  }, [serverNow, releaseAt]);

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
      scale: [1.34, 1],
      ease: spring({ stiffness: 200, damping: 12 }),
    });

    return () => {
      pulse.revert();
    };
  }, [seconds, phase]);

  /* ---- Zero: the seal comes apart ---- */

  useEffect(() => {
    if (!broken) return;

    const el = root.current;
    const pull = () => router.refresh();

    // Asked for immediately, so the round trip runs underneath the whole burst
    // rather than after it. Nothing is cut short by an early answer: the parent
    // holds this view on screen for the length of the sequence — that is what
    // onBreak is for.
    announce.current();
    pull();

    // When the server agrees the hour has come, the re-render unmounts this
    // component and the timer goes with it. When it does not — a server clock a
    // shade behind this one — the retry keeps asking and the broken-seal state
    // holds. Snapping back to a countdown would read as a bug.
    const retry = window.setInterval(pull, RETRY_MS);

    if (!el || prefersReducedMotion()) {
      return () => window.clearInterval(retry);
    }

    /* The burst is staged on a layer *outside* the parchment. ParchmentPanel is
       `overflow-hidden` — paper has edges — so anything thrown from inside it is
       clipped at the panel border within about forty pixels. The layer is a
       sibling instead, and is moved onto the seal here by measurement rather
       than by a hard-coded offset, which would have to track the panel's
       responsive padding and the seal's two sizes. */
    const stage = el.querySelector<HTMLElement>("[data-burst]");
    const seal = el.querySelector<HTMLElement>("[data-seal]");

    if (stage && seal) {
      const from = el.getBoundingClientRect();
      const at = seal.getBoundingClientRect();
      stage.style.left = at.left - from.left + at.width / 2 + "px";
      stage.style.top = at.top - from.top + at.height / 2 + "px";
      stage.style.opacity = "1";
    }

    /* ---- The wind-up ---- */

    animate(el.querySelectorAll("[data-seal-half]"), {
      scale: 0.84,
      duration: WIND_UP_MS,
      ease: eases.out(2),
    });

    /* ---- The burst ---- */

    // The rings are the whole idea: an astrolabe blown apart is engraved rings
    // travelling outward, not a white flash. Three of them at different sizes
    // and speeds so the shockwave has depth.
    animate(el.querySelectorAll("[data-burst-ring]"), {
      scale: [0.25, 5.5],
      opacity: [0.95, 0],
      rotate: 42,
      duration: 900,
      delay: stagger(90, { start: WIND_UP_MS }),
      ease: eases.out(3),
    });

    // A hard, short gold bloom. Sharp attack is what reads as a flash; the
    // previous one rose and fell over a second, which reads as a glow.
    animate(el.querySelectorAll("[data-burst-flare]"), {
      opacity: [0, 1, 0],
      scale: [0.2, 3.6],
      duration: 560,
      delay: WIND_UP_MS,
      ease: eases.out(4),
    });

    // Meteors. The wrapper carries the bearing as a static rotation and the
    // streak inside travels along it, so anime never has to compose a rotation
    // with a translation on the same element.
    const streaks = el.querySelectorAll<HTMLElement>("[data-burst-streak]");
    streaks.forEach((streak, i) => {
      animate(streak, {
        translateX: [0, 230],
        scaleX: [0.25, 1],
        opacity: [0, 1, 0],
        duration: 700,
        delay: WIND_UP_MS + i * 26,
        ease: eases.out(3),
      });
    });

    // Stars, on varied bearings and radii — an even ring of twelve at one
    // radius reads as a diagram rather than an explosion.
    const sparks = el.querySelectorAll<HTMLElement>("[data-burst-star]");
    sparks.forEach((spark, i) => {
      const angle = bearing(i, sparks.length, 0.26);
      const reach = 130 + ((i * 37) % 120);

      animate(spark, {
        translateX: Math.cos(angle) * reach,
        translateY: Math.sin(angle) * reach,
        rotate: i % 2 ? 200 : -200,
        scale: [0.3, 1.7],
        opacity: [1, 0],
        duration: 860,
        delay: WIND_UP_MS + i * 14,
        ease: eases.out(3),
      });
    });

    // The halves are flung, not dropped.
    (
      [
        ["[data-seal-half-left]", -130, -44],
        ["[data-seal-half-right]", 130, 44],
      ] as const
    ).forEach(([selector, x, r]) => {
      const node = el.querySelector<HTMLElement>(selector);
      if (!node) return;

      animate(node, {
        translateX: x,
        translateY: 90,
        rotate: r,
        scale: 0.7,
        opacity: 0,
        duration: 620,
        delay: WIND_UP_MS,
        // Accelerating away: they are falling, not easing to a stop.
        ease: eases.in(3),
      });
    });

    // The impact, felt rather than seen. An underdamped spring from an offset
    // oscillates and settles on its own, which is a shake without keyframes.
    animate(el, {
      translateX: [-10, 0],
      delay: WIND_UP_MS,
      ease: spring({ stiffness: 340, damping: 6 }),
    });

    // The clock snaps out rather than drifting up — it has been overtaken.
    animate(el.querySelectorAll("[data-seal-clock]"), {
      opacity: 0,
      scale: 0.86,
      duration: 220,
      delay: WIND_UP_MS,
      ease: eases.in(2),
    });

    // ...and the paper goes with it, so the statements land on the night sky
    // rather than being pasted over a sheet that is still sitting there.
    animate(el.querySelectorAll("[data-seal-paper]"), {
      opacity: 0,
      scale: 0.965,
      translateY: 22,
      duration: 460,
      delay: WIND_UP_MS + 190,
      ease: eases.in(2),
    });

    return () => window.clearInterval(retry);
  }, [broken, router]);

  const values = unitsOf(remaining ?? 0);
  // The rim turns for the last minute and keeps turning through the final ten.
  const stirring = phase === "final-minute" || phase === "final-ten";

  return (
    <div ref={root} className="relative mt-14">
      {/* The burst stage. Outside the parchment and above it, with nothing to
          clip it; parked at the origin until the break measures the seal and
          moves it there. Children are centred on the stage, so each one only
          has to describe how far out it travels. */}
      <div
        aria-hidden
        data-burst
        className="pointer-events-none absolute left-0 top-0 z-30 h-0 w-0 opacity-0"
      >
        <span
          data-burst-flare
          className="absolute left-0 top-0 block h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-0"
          style={{
            background:
              "radial-gradient(circle, rgba(255,241,209,0.98) 0%, rgba(217,169,76,0.85) 32%, rgba(140,106,42,0.35) 58%, transparent 74%)",
          }}
        />

        {/* Engraved rings travelling outward — the astrolabe coming apart. */}
        <span className="absolute left-0 top-0 block h-40 w-40 -translate-x-1/2 -translate-y-1/2">
          <AstrolabeOuter
            data-burst-ring
            className="absolute inset-0 h-full w-full text-[var(--artemis-gold-light)] opacity-0"
          />
        </span>
        <span className="absolute left-0 top-0 block h-40 w-40 -translate-x-1/2 -translate-y-1/2">
          <AstrolabeInner
            data-burst-ring
            className="absolute inset-0 h-full w-full text-[var(--artemis-gold)] opacity-0"
          />
        </span>
        <span className="absolute left-0 top-0 block h-40 w-40 -translate-x-1/2 -translate-y-1/2">
          <AstrolabeOuter
            data-burst-ring
            className="absolute inset-0 h-full w-full text-[var(--artemis-gold)] opacity-0"
          />
        </span>

        {/* Meteors. The wrapper holds the bearing, the streak inside travels. */}
        {Array.from({ length: 10 }).map((_, i) => (
          <span
            key={"streak-" + i}
            className="absolute left-0 top-0 block h-0 w-0"
            style={{ transform: `rotate(${(i / 10) * 360 + 12}deg)` }}
          >
            <span
              data-burst-streak
              className="absolute left-0 top-0 block h-px w-28 origin-left opacity-0"
              style={{
                background:
                  "linear-gradient(90deg, transparent, var(--artemis-gold-light), transparent)",
              }}
            />
          </span>
        ))}

        {/* Stars thrown clear. */}
        {Array.from({ length: 18 }).map((_, i) => (
          <StarGlyph
            key={"star-" + i}
            data-burst-star
            className="absolute left-0 top-0 h-3 w-3 -translate-x-1/2 -translate-y-1/2 text-[var(--artemis-gold-light)] opacity-0"
          />
        ))}
      </div>

      <div data-seal-paper>
        <ParchmentPanel corners contentClassName="flex flex-col items-center text-center">
          {/* The seal. Two copies of the same crest under complementary clips,
              stacked exactly on top of each other — at rest they read as one
              engraving, and at zero they can be thrown apart. */}
          <div data-seal className="relative h-36 w-36 sm:h-44 sm:w-44">
            {/* The named utility rather than an arbitrary `animation:` value, so
                the prefers-reduced-motion block in globals.css catches the stir. */}
            <span
              aria-hidden
              data-seal-half
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
              data-seal-half
              data-seal-half-right
              className={cn(
                "absolute inset-0 block [clip-path:inset(0_0_0_50%)]",
                stirring && "animate-artemis-orbit"
              )}
            >
              <SealCrest />
            </span>
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
            The afflictions you are destined to cure at this great contest
            shall remain veiled within the sanctuary until the appointed dawn of the twenty-sixth of September.
            Stay your hand and rest your mind;
            no oracle can divine these decrees before the fates deem it time.
          </p>
        </ParchmentPanel>
      </div>
    </div>
  );
}
