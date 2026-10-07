"use client";

import * as React from "react";
import { m, useTransform } from "framer-motion";
import { useScrollProgress } from "@/hooks/useScrollProgress";

// Two dashed rails down the screen edges, each with a dot that tracks scroll.
//
// The dots move on transform (translateY in vh), not an SVG `cy` attribute, so
// scrolling never triggers layout or paint. There is deliberately no
// mix-blend-mode on this layer: blending a full-viewport fixed overlay forced
// the browser to recomposite the whole screen on every frame.
export function SvgPipelines() {
  const { scrollYProgress } = useScrollProgress();
  const down = useTransform(scrollYProgress, [0, 1], ["0vh", "100vh"]);
  const up = useTransform(scrollYProgress, [0, 1], ["100vh", "0vh"]);

  return (
    <div className="pointer-events-none fixed inset-0 z-40 hidden overflow-hidden sm:block" aria-hidden="true">
      <Rail side="left-4" dashed y={down} />
      <Rail side="right-4" y={up} />
    </div>
  );
}

function Rail({
  side,
  dashed,
  y,
}: {
  side: string;
  dashed?: boolean;
  y: ReturnType<typeof useTransform<number, string>>;
}) {
  return (
    <div className={`absolute top-0 h-full w-8 ${side}`}>
      <div
        className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2"
        style={{
          backgroundImage: dashed
            ? "repeating-linear-gradient(to bottom, var(--border-color) 0 4px, transparent 4px 8px)"
            : "linear-gradient(var(--border-color), var(--border-color))",
        }}
      />
      <m.div
        style={{ y }}
        className="absolute left-1/2 -top-1 -ml-1 h-2 w-2 rounded-full bg-[var(--border-active)] shadow-[0_0_10px_var(--border-active)]"
      />
    </div>
  );
}
