"use client";

import { useEffect, useRef } from "react";

/**
 * Drifting starfield under a nebula wash, at z-0.
 *
 * The z-10 wrappers in app/layout.tsx are load-bearing: a fixed z-0 element
 * paints above non-positioned in-flow content, so without them this would cover
 * the footer and every page body.
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

      // Backing store in device pixels for crispness, context scaled back so the
      // star coordinates stay in CSS units.
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(nextWidth * dpr);
      canvas.height = Math.floor(nextHeight * dpr);
      // Setting canvas.width resets the transform.
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Width only: on mobile the address bar fires resize constantly with a new
      // height, and reseeding each time makes the stars jump.
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

    // Hold one static frame instead of looping forever, as globals.css does.
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
