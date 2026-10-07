"use client";

// Decrypt-style reveal: each character cycles through random glyphs, then
// settles left to right. After Motion Primitives' Text Scramble (MIT).
//
// The real text is server-rendered and visible on first paint; the scramble is
// a decoration that runs once after hydration, so it never delays LCP. Use it
// on monospace text only, where every glyph has the same width and nothing
// around it shifts while it runs.

import { useEffect, useRef } from "react";

// Letters and digits only: punctuation like "/" is a line-break opportunity,
// and a mid-scramble re-wrap shifts everything below (it showed up as CLS).
const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

export function ScrambleText({
  text,
  duration = 900,
  className,
}: {
  text: string;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const settled = Math.floor(((now - start) / duration) * text.length);
      if (settled >= text.length) {
        el.textContent = text;
        return;
      }
      let out = text.slice(0, settled);
      for (let i = settled; i < text.length; i++) {
        out += text[i] === " " ? " " : GLYPHS[(Math.random() * GLYPHS.length) | 0];
      }
      el.textContent = out;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      el.textContent = text;
    };
  }, [text, duration]);

  // Screen readers get the real text once; the animated copy is hidden from them.
  return (
    <span className={className}>
      <span className="sr-only">{text}</span>
      <span ref={ref} aria-hidden="true">
        {text}
      </span>
    </span>
  );
}
