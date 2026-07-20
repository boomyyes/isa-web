"use client";

import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { useInView } from "framer-motion";
import { cn } from "@/lib/utils";
import { HolographicCard } from "./HolographicCard";

interface TerminalShellProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  envStatus?: string;
  contentLines: string[];
}

export function TerminalShell({ title, envStatus = "OK", contentLines, className, ...props }: TerminalShellProps) {
  // Number of lines revealed so far. Derived from contentLines below rather
  // than accumulated into state, so a re-render can't duplicate or lose lines.
  const [revealed, setRevealed] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  // Guard so parent re-renders (theme hydration, StrictMode, etc.) can't
  // restart the animation and reset progress.
  const startedRef = useRef(false);

  const total = contentLines.length;

  useEffect(() => {
    if (!isInView || startedRef.current) return;
    startedRef.current = true;

    let interval: ReturnType<typeof setInterval> | undefined;

    // Hold off until the section's entry animation has finished. Revealing a
    // line grows the card, and reflowing while the container is still
    // translating is what makes the pop-in stutter.
    const kickoff = setTimeout(() => {
      interval = setInterval(() => {
        setRevealed((prev) => {
          if (prev >= total) {
            clearInterval(interval);
            return prev;
          }
          return prev + 1;
        });
      }, 400); // 400ms per line
    }, 500);

    return () => {
      clearTimeout(kickoff);
      clearInterval(interval);
    };
  }, [isInView, total]);

  const displayedLines = contentLines.slice(0, revealed);

  return (
    <HolographicCard
      ref={ref}
      // These panels sit on an opaque section background and animate in, so the
      // backdrop blur would re-run every frame to produce identical pixels.
      disableBackdropBlur
      className={cn("clip-angular-reverse flex flex-col font-jetbrains text-sm", className)}
      {...props}
    >
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border-color)] bg-black/10">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-none bg-red-500 clip-angular" />
          <div className="w-3 h-3 rounded-none bg-yellow-500 clip-angular" />
          <div className="w-3 h-3 rounded-none bg-green-500 clip-angular" />
          <span className="ml-4 text-xs text-[var(--text-secondary)]">{title}</span>
        </div>
        <div className="text-xs text-[var(--border-active)]">
          [ ENV // SYS_INIT: {envStatus} ]
        </div>
      </div>

      {/* Content Area */}
      <div className="p-6 space-y-2 min-h-[200px]">
        {displayedLines.map((line, i) => (
          <div key={i} className="flex gap-4">
            <span className="text-[var(--text-secondary)] select-none opacity-50">{(i + 1).toString().padStart(2, "0")}</span>
            <span className="text-[var(--text-primary)]">{line}</span>
          </div>
        ))}
        {isInView && displayedLines.length < contentLines.length && (
          <div className="flex gap-4">
            <span className="text-[var(--text-secondary)] select-none opacity-50">
              {(displayedLines.length + 1).toString().padStart(2, "0")}
            </span>
            <span className="w-2 h-4 bg-[var(--border-active)] animate-pulse" />
          </div>
        )}
      </div>
    </HolographicCard>
  );
}
