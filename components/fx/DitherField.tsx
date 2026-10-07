"use client";

// The hero's gear, redrawn as an ordered (Bayer) dither on a plain 2D canvas.
// It replaces components/three/HeroOrb.tsx: the same twelve-tooth gear and
// sweeping highlight in the same two colours, without three.js and
// @react-three/fiber (~170KB gzipped). Style after the dither and ASCII fields
// on Animata and ibelick; the code is our own.
//
// Cost control, in order of how much each saves:
//  - Low-res: one dot per CELL px, so ~8k cells for a 600px-square canvas.
//  - 30fps cap, and the loop stops entirely when the canvas is offscreen or
//    the tab is hidden.
//  - The pointer lives in a ref, so moving the mouse never re-renders React.
//  - Reduced motion: one still frame, no loop.

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";

const CELL = 6;
const FRAME_MS = 1000 / 30;
const TEETH = 12;

// 4x4 Bayer matrix, normalised to 0-1 thresholds.
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);

function readColor(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export function DitherField({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointer = useRef({ x: 0.5, y: 0.5 });
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Read after the theme class has been applied, so these are the live values.
    const gear = readColor("--border-active");
    const highlight = readColor("--fx-highlight");
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let cols = 0;
    let rows = 0;
    const resize = () => {
      const { width, height } = canvas.getBoundingClientRect();
      cols = Math.max(1, Math.floor(width / CELL));
      rows = Math.max(1, Math.floor(height / CELL));
      // One canvas pixel per cell; CSS scales it up with crisp edges.
      canvas.width = cols;
      canvas.height = rows;
    };
    resize();

    const draw = (t: number) => {
      ctx.clearRect(0, 0, cols, rows);
      const spin = t * 0.00025;
      const sweep = t * 0.0009;
      // The gear leans toward the pointer, as the orb's tilt did.
      const cx = cols / 2 + (pointer.current.x - 0.5) * cols * 0.08;
      const cy = rows / 2 + (pointer.current.y - 0.5) * rows * 0.08;
      const scale = Math.min(cols, rows) / 7;
      const outer = 3 * scale;
      const inner = 2.4 * scale;
      const hole = 1.2 * scale;

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const dx = x - cx;
          const dy = y - cy;
          const r = Math.hypot(dx, dy);
          if (r > outer + 1 || r < hole - 1) continue;

          const a = Math.atan2(dy, dx) - spin;
          // Smoothed square wave: flat-topped teeth with bevelled flanks.
          const wave = Math.max(-1, Math.min(1, Math.cos(a * TEETH) * 2.5));
          const edge = inner + ((outer - inner) * (wave + 1)) / 2;
          if (r > edge || r < hole) continue;

          // Brighter toward the rim, plus a narrow band sweeping round the ring.
          const rim = (r - hole) / (edge - hole);
          const band = Math.max(0, Math.cos(a + spin - sweep)) ** 8;
          const value = 0.25 + rim * 0.45 + band * 0.6;

          if (value > BAYER[(y & 3) * 4 + (x & 3)]) {
            ctx.fillStyle = band > 0.5 ? highlight : gear;
            ctx.fillRect(x, y, 1, 1);
          }
        }
      }
    };

    if (still) {
      draw(0);
      return;
    }

    let raf = 0;
    let last = 0;
    let visible = false;
    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      if (t - last < FRAME_MS) return;
      last = t;
      draw(t);
    };
    const start = () => {
      if (!raf && visible && !document.hidden) raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
      else stop();
    });
    io.observe(canvas);

    const onVisibility = () => (document.hidden ? stop() : start());
    const onPointer = (e: PointerEvent) => {
      pointer.current = { x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight };
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pointermove", onPointer, { passive: true });
    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointermove", onPointer);
    };
  }, [resolvedTheme]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={className}
      style={{ imageRendering: "pixelated" }}
    />
  );
}
