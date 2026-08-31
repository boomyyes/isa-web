"use client";

import { useEffect, useRef } from "react";
import { animate, onScroll } from "animejs";
import { useArtemisAnime } from "@/components/artemis/useArtemisAnime";

/**
 * The Artemis night sky — the page's own background layer.
 *
 * This has to *cover* the site background rather than replace it: the 40px grid
 * lives on <body> and <GlobalBackground /> is mounted at z-0 in the root layout,
 * and a page can remove neither. But app/layout.tsx wraps page content in
 * `relative z-10`, which is a stacking context, so a `fixed inset-0 -z-10` layer
 * rendered inside the page is trapped in that context — it paints above the
 * global z-0 starfield and below the page's own content. That is exactly the
 * slot we need, and it is why the -z-10 here is not a bug.
 *
 * Conventions follow components/layout/GlobalBackground.tsx: DPR-aware backing
 * store, star coordinates kept in CSS units, and a single static frame under
 * prefers-reduced-motion instead of an animation loop.
 *
 * The canvas is left alone by anime.js — it is already a hand-tuned rAF loop
 * with its own reduced-motion path, and there is nothing anime.js would do for
 * it that it does not already do for itself. What anime.js adds is depth: the
 * nebula wash is scrubbed against page scroll, so the sky drifts behind the
 * content at a different rate from the stars in front of it.
 */

type Star = {
  x: number;
  y: number;
  size: number;
  /** Base opacity; the twinkle oscillates around it. */
  opacity: number;
  /** Radians per frame for the twinkle, plus a phase so they do not pulse in unison. */
  twinkleSpeed: number;
  phase: number;
  /** Gold for a minority of stars, parchment-white for the rest. */
  gold: boolean;
};

/**
 * Constellation figures, in fractions of the viewport so they reposition on
 * resize instead of drifting off-screen. Loosely Orion, the Plough, and a bow —
 * decorative, not astronomically accurate.
 */
const CONSTELLATIONS: { points: [number, number][]; closed?: boolean }[] = [
  // Bow, upper left
  { points: [[0.08, 0.12], [0.14, 0.2], [0.13, 0.31], [0.07, 0.38]] },
  // Belt-and-shoulders figure, right
  {
    points: [[0.82, 0.16], [0.88, 0.24], [0.84, 0.34], [0.9, 0.42], [0.81, 0.47]],
  },
  // Plough, lower left
  {
    points: [[0.12, 0.72], [0.19, 0.7], [0.24, 0.75], [0.22, 0.83], [0.15, 0.85], [0.12, 0.79]],
    closed: true,
  },
];

function createStars(width: number, height: number): Star[] {
  // Same density split as GlobalBackground — a phone does not need 150 stars.
  const count = width < 768 ? 70 : 190;

  return Array.from({ length: count }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    size: Math.random() * 1.4 + 0.4,
    opacity: Math.random() * 0.5 + 0.25,
    twinkleSpeed: Math.random() * 0.012 + 0.004,
    phase: Math.random() * Math.PI * 2,
    gold: Math.random() < 0.28,
  }));
}

function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let stars = createStars(width, height);
    let frameId = 0;
    let tick = 0;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      stars = createStars(width, height);
    };

    const drawConstellations = () => {
      ctx.lineWidth = 0.7;
      ctx.strokeStyle = "rgba(217, 169, 76, 0.22)";

      for (const figure of CONSTELLATIONS) {
        ctx.beginPath();
        figure.points.forEach(([fx, fy], i) => {
          const x = fx * width;
          const y = fy * height;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        if (figure.closed) ctx.closePath();
        ctx.stroke();

        // A brighter node at each vertex so the figure reads as stars joined by
        // lines rather than as a bare polygon.
        for (const [fx, fy] of figure.points) {
          ctx.beginPath();
          ctx.arc(fx * width, fy * height, 1.6, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(242, 208, 138, 0.8)";
          ctx.fill();
        }
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      drawConstellations();

      for (const star of stars) {
        // sin() around the base opacity rather than a bouncing counter: no state
        // to keep per star beyond the phase, and it can never drift out of range.
        const flicker = prefersReducedMotion
          ? star.opacity
          : star.opacity + Math.sin(tick * star.twinkleSpeed + star.phase) * 0.3;
        const alpha = Math.max(0.05, Math.min(1, flicker));

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = star.gold
          ? "rgba(242, 208, 138, " + alpha + ")"
          : "rgba(237, 230, 214, " + alpha + ")";
        ctx.fill();
      }
    };

    const loop = () => {
      tick += 1;
      draw();
      frameId = requestAnimationFrame(loop);
    };

    resize();

    if (prefersReducedMotion) {
      draw();
    } else {
      loop();
    }

    const onResize = () => {
      resize();
      // Repaint immediately so a reduced-motion viewport is not left blank
      // between the resize and a frame that will never come.
      if (prefersReducedMotion) draw();
    };

    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(frameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />;
}

/** How far the nebula travels, in pixels, over the whole page. */
const NEBULA_DRIFT = 90;

export function ArtemisSky() {
  const root = useArtemisAnime<HTMLDivElement>(() => {
    animate("[data-sky-nebula]", {
      translateY: [0, -NEBULA_DRIFT],
      // Scrubbed rather than triggered: `sync` ties the tween's progress to the
      // scroll position itself, so the wash tracks the page in both directions.
      // The thresholds map the full document travel onto 0 -> 1.
      autoplay: onScroll({
        sync: true,
        target: document.documentElement,
        enter: "top top",
        leave: "bottom bottom",
      }),
    });
  });

  return (
    <div
      ref={root}
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* Opaque ground. This is the layer that actually hides the site's grid
          and global starfield, so it must not be translucent. */}
      <div className="absolute inset-0 bg-[var(--artemis-void)]" />

      {/* Nebula wash — warm gold low, cool indigo high, so the page reads as
          dawn breaking over a night sky from top to bottom.

          Overhangs the viewport by more than it can ever travel, so drifting it
          upward never uncovers the ground layer along the bottom edge. */}
      <div
        data-sky-nebula
        className="absolute -inset-y-32 inset-x-0"
        style={{
          background:
            "radial-gradient(ellipse 90% 55% at 50% 0%, rgba(36, 31, 61, 0.95), transparent 65%)," +
            "radial-gradient(ellipse 70% 45% at 12% 32%, rgba(27, 42, 94, 0.5), transparent 70%)," +
            "radial-gradient(ellipse 80% 50% at 88% 68%, rgba(123, 30, 40, 0.28), transparent 70%)," +
            "radial-gradient(ellipse 120% 60% at 50% 100%, rgba(140, 106, 42, 0.22), transparent 70%)",
        }}
      />

      <Starfield />

      {/* Vignette, to settle the edges and keep the navbar island legible. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 75% 65% at 50% 45%, transparent 40%, rgba(10, 9, 18, 0.75) 100%)",
        }}
      />
    </div>
  );
}
