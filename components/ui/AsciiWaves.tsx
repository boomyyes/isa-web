"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

/**
 * ASCII Waves — an interactive field of monospace characters animated by layered
 * pseudo-noise, with cursor ripples. Adapted from an Originkit / Framer component
 * to a plain React client component:
 *   - The Framer `RenderTarget` / `useIsStaticRenderer` gating is gone; it always
 *     runs the live rAF loop.
 *   - Cursor tracking listens on `window`, not the element, so the waves still
 *     ripple to the pointer when this sits *behind* page content as a background.
 *   - `background: "transparent"` clears each frame instead of painting, so it
 *     composites over whatever is beneath it.
 */

type Direction = "left" | "right" | "top" | "bottom";

interface AsciiWavesProps {
  characters?: string;
  elementSize?: number;
  color?: string;
  direction?: Direction;
  /** A CSS color, or "transparent" to overlay whatever is behind. */
  background?: string;
  invert?: boolean;
  fontWeight?: string | number;
  speed?: number;
  waveTension?: number;
  noiseScale?: number;
  intensity?: number;
  hasCursorInteraction?: boolean;
  interactionIntensity?: number;
  interactionRadius?: number;
  /** Cap on device-pixel-ratio. Lower = cheaper (fewer pixels to rasterize). */
  maxDpr?: number;
  /** Redraw rate. Slow waves read fine at a low fps and it scales cost ~linearly. */
  fps?: number;
  className?: string;
  style?: CSSProperties;
}

const DEFAULTS: Required<Omit<AsciiWavesProps, "className" | "style">> = {
  characters: " .:-+*=%@#",
  elementSize: 16,
  color: "#ffffff",
  direction: "left",
  background: "transparent",
  invert: false,
  fontWeight: "400",
  speed: 20,
  waveTension: 5,
  noiseScale: 12,
  intensity: 10,
  hasCursorInteraction: true,
  interactionIntensity: 15,
  interactionRadius: 160,
  maxDpr: 2,
  fps: 30,
};

export function AsciiWaves(props: AsciiWavesProps) {
  const {
    characters,
    elementSize,
    color,
    direction,
    background,
    invert,
    fontWeight,
    speed,
    waveTension,
    noiseScale,
    intensity,
    hasCursorInteraction,
    interactionIntensity,
    interactionRadius,
    maxDpr,
    fps,
    className,
    style,
  } = { ...DEFAULTS, ...props };

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const startRef = useRef(performance.now());
  const pointerRef = useRef({ x: -9999, y: -9999, active: false });
  const [size, setSize] = useState({ w: 0, h: 0 });

  const isTransparent = !background || background === "transparent";

  const rampArr = (characters && characters.length > 0 ? characters : " .:-+*=%@#")
    .split("")
    [invert ? "reverse" : "slice"]()
    .join("");

  // Track the box size.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const cr = entry.contentRect;
        setSize({
          w: Math.max(1, Math.floor(cr.width)),
          h: Math.max(1, Math.floor(cr.height)),
        });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Cursor ripples. Listen on window (relative to our box) so this reacts even
  // when it's a background layer sitting behind other content.
  useEffect(() => {
    if (!hasCursorInteraction) return;
    const el = containerRef.current;
    if (!el) return;
    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      pointerRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        active: true,
      };
    };
    const onLeave = () => {
      pointerRef.current.active = false;
    };
    window.addEventListener("pointermove", onMove);
    document.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, [hasCursorInteraction]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.max(
      1,
      Math.min(maxDpr, typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1)
    );
    const { w, h } = size;
    if (w === 0 || h === 0) return;

    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.scale(dpr, dpr);

    // Sliders → internal fractional ranges (see original component notes).
    const speedVal = speed / 20;
    const tensionVal = waveTension / 10;
    const twistVal = 0.1;
    const scaleVal = noiseScale / 100;
    const intensityVal = intensity / 10;
    const cursorForceVal = interactionIntensity / 10;

    const driftMap: Record<Direction, [number, number]> = {
      left: [1, 0],
      right: [-1, 0],
      top: [0, 1],
      bottom: [0, -1],
    };
    const [driftX, driftY] = driftMap[direction] || driftMap.left;
    const driftRate = 1.5;

    const cell = Math.max(4, elementSize);
    const colStep = cell * 0.6;
    const cols = Math.ceil(w / colStep) + 1;
    const rows = Math.ceil(h / cell) + 1;

    ctx.font = `${fontWeight} ${cell}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`;
    ctx.textBaseline = "top";
    ctx.textAlign = "left";

    const noise = (x: number, y: number, t: number) => {
      const a = Math.sin(x * 1.3 + t) * Math.cos(y * 1.1 - t * 0.7);
      const b = Math.sin((x + y) * 0.7 + t * 0.5);
      const c = Math.sin(x * 0.4 - y * 0.6 + t * 0.3);
      return (a + b + c) / 3;
    };

    const rampMax = rampArr.length - 1;
    const r2 = interactionRadius * interactionRadius;

    // Constant per-cell geometry — computed once, not every frame.
    const colX = new Float32Array(cols); // pixel x per column
    const colScale = new Float32Array(cols); // noise-space x per column
    for (let i = 0; i < cols; i++) {
      colX[i] = i * colStep;
      colScale[i] = i * scaleVal;
    }
    const rowY = new Float32Array(rows); // pixel y per row
    const rowScale = new Float32Array(rows); // noise-space y per row
    for (let j = 0; j < rows; j++) {
      rowY[j] = j * cell;
      rowScale[j] = j * scaleVal;
    }
    // The "twist" terms are separable — one depends only on the row, the other
    // only on the column — so we compute rows+cols sines per frame instead of
    // rows*cols. Buffers are reused across frames to avoid per-frame allocation.
    const twistRow = new Float32Array(rows);
    const twistCol = new Float32Array(cols);

    const draw = (now: number) => {
      const t = ((now - startRef.current) / 1000) * speedVal;
      if (isTransparent) {
        ctx.clearRect(0, 0, w, h);
      } else {
        ctx.fillStyle = background;
        ctx.fillRect(0, 0, w, h);
      }
      ctx.fillStyle = color;

      const p = pointerRef.current;
      const cursorOn = hasCursorInteraction && p.active;
      const ox = t * driftRate * driftX;
      const oy = t * driftRate * driftY;
      const tTension = t * tensionVal;
      const cursorPhase = t * 4;

      for (let j = 0; j < rows; j++) twistRow[j] = Math.sin((j + t) * twistVal) * 2;
      for (let i = 0; i < cols; i++) twistCol[i] = Math.cos((i + t) * twistVal) * 2;

      for (let j = 0; j < rows; j++) {
        const py = rowY[j];
        const nxRow = ox + twistRow[j];
        const nyBase = rowScale[j] + oy;
        const dyBase = py - p.y;
        for (let i = 0; i < cols; i++) {
          const nx = colScale[i] + nxRow;
          const ny = nyBase + twistCol[i];
          let v = noise(nx, ny, tTension);

          if (cursorOn) {
            const dx = colX[i] - p.x;
            const d2 = dx * dx + dyBase * dyBase;
            if (d2 < r2) {
              const d = Math.sqrt(d2);
              const falloff = 1 - d / interactionRadius;
              v += Math.sin(d * 0.08 - cursorPhase) * falloff * cursorForceVal;
            }
          }

          const norm = Math.max(0, Math.min(1, (v * intensityVal + 1) / 2));
          const ch = rampArr.charAt(Math.round(norm * rampMax));
          if (ch !== " ") ctx.fillText(ch, colX[i], py);
        }
      }
    };

    // Cap the redraw rate. fillText dominates the per-frame cost, so this scales
    // it near-linearly — and slow waves stay smooth at a low refresh.
    const frameInterval = 1000 / Math.max(1, fps);
    let lastDraw = 0;
    const loop = (now: number) => {
      rafRef.current = requestAnimationFrame(loop);
      if (now - lastDraw < frameInterval) return;
      lastDraw = now;
      draw(now);
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(loop);
    };
    const stop = () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      }
    };

    // Stop drawing entirely once the field scrolls off screen — when scoped to a
    // section (the homepage hero) it would otherwise keep burning frames for the
    // whole page. rootMargin keeps it warm just before it scrolls back in.
    const container = containerRef.current;
    let io: IntersectionObserver | null = null;
    if (container) {
      io = new IntersectionObserver(
        ([entry]) => (entry.isIntersecting ? start() : stop()),
        { rootMargin: "200px" }
      );
      io.observe(container);
    } else {
      start();
    }

    return () => {
      io?.disconnect();
      stop();
    };
  }, [
    size,
    elementSize,
    color,
    direction,
    background,
    isTransparent,
    rampArr,
    waveTension,
    speed,
    noiseScale,
    intensity,
    hasCursorInteraction,
    interactionIntensity,
    interactionRadius,
    fontWeight,
    maxDpr,
    fps,
  ]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        ...style,
        position: "relative",
        overflow: "hidden",
        background: isTransparent ? undefined : background,
        width: "100%",
        height: "100%",
      }}
    >
      <canvas ref={canvasRef} style={{ display: "block" }} />
    </div>
  );
}

export default AsciiWaves;
