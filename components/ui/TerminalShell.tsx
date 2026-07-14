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
  const [displayedLines, setDisplayedLines] = useState<string[]>([]);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (!isInView) return;

    let currentLine = 0;
    const interval = setInterval(() => {
      if (currentLine < contentLines.length) {
        setDisplayedLines((prev) => [...prev, contentLines[currentLine]]);
        currentLine++;
      } else {
        clearInterval(interval);
      }
    }, 400); // 400ms per line

    return () => clearInterval(interval);
  }, [isInView, contentLines]);

  return (
    <HolographicCard
      ref={ref}
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
