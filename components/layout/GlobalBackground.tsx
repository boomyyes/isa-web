"use client";

import { useEffect, useRef } from "react";

/**
 * Site-wide animated backdrop: a drifting starfield under a soft nebula wash.
 *
 * Sits at z-0, directly on top of the body's grid pattern. Everything else is
 * lifted above it in app/layout.tsx — page content and the footer get `relative
 * z-10`, and the navbar island is already z-50. That ordering is load-bearing:
 * a `fixed` element with z-index 0 paints ABOVE non-positioned in-flow content,
 * so without it this canvas would cover the footer and every page body.
 */

type Star = {
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
  fadeSpeed: number;
  fadeDir: 1 | -1;
};

function createStars(width: number, height: number) {
  const isMobile = width < 768;
  const starCount = isMobile ? 50 : 150;

  return Array.from({ length: starCount }, (): Star => ({
    x: Math.random() * width,
    y: Math.random() * height,
    size: Math.random() * 1.5 + 0.5,
    speed: Math.random() * 0.2 + 0.02,
    opacity: Math.random(),
    fadeSpeed: Math.random() * 0.03 + 0.01,
    fadeDir: Math.random() > 0.5 ? 1 : -1,
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
    let animationFrameId = 0;

    const resizeCanvas = () => {
      const nextWidth = window.innerWidth;
      const nextHeight = window.innerHeight;

      // Size the backing store in device pixels so the stars stay crisp on
      // high-DPI screens, then scale the context back to CSS pixels so all the
      // star coordinates below can stay in CSS units.
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(nextWidth * dpr);
      canvas.height = Math.floor(nextHeight * dpr);
      // Setting canvas.width resets the transform, so re-apply it every resize.
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Only reseed on a width change. On mobile the address bar showing and
      // hiding fires resize constantly with a new height, and regenerating the
      // field each time makes the stars visibly jump.
      if (nextWidth !== width) {
        stars = createStars(nextWidth, nextHeight);
      }

      width = nextWidth;
      height = nextHeight;
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "#ffffff";

      for (const star of stars) {
        ctx.globalAlpha = star.opacity;
        ctx.fillRect(star.x, star.y, star.size, star.size);
      }

      ctx.globalAlpha = 1;
    };

    const render = () => {
      for (const star of stars) {
        star.y -= star.speed;
        if (star.y < 0) {
          star.y = height;
          star.x = Math.random() * width;
        }

        star.opacity += star.fadeSpeed * star.fadeDir;
        if (star.opacity <= 0.05) {
          star.fadeDir = 1;
        } else if (star.opacity >= 1) {
          star.fadeDir = -1;
        }
      }

      draw();
      animationFrameId = window.requestAnimationFrame(render);
    };

    resizeCanvas();

    // Matches the reduced-motion handling already in globals.css: hold a single
    // static frame rather than running an animation loop forever.
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const start = () => {
      window.cancelAnimationFrame(animationFrameId);
      if (motionQuery.matches) draw();
      else render();
    };

    start();
    window.addEventListener("resize", resizeCanvas);
    motionQuery.addEventListener("change", start);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      motionQuery.removeEventListener("change", start);
      window.cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 opacity-60 dark:opacity-90"
      style={{ transform: "translateZ(0)" }}
    />
  );
}

export function GlobalBackground() {
  return (
    <>
      <Starfield />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 opacity-45 dark:opacity-55"
        style={{
          transform: "translateZ(0)",
          backgroundImage:
            "radial-gradient(circle at 15% 20%, rgba(75, 25, 130, 0.5) 0%, transparent 40%), radial-gradient(circle at 85% 70%, rgba(10, 60, 120, 0.4) 0%, transparent 45%), radial-gradient(circle at 50% 50%, rgba(0, 229, 255, 0.05) 0%, transparent 60%)",
        }}
      />
    </>
  );
}
