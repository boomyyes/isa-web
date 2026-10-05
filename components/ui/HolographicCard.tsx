"use client";

import * as React from "react";
import { useRef } from "react";
import { useMouseGlare } from "@/hooks/useMouseGlare";
import { cn } from "@/lib/utils";

interface HolographicCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  /**
   * Drop `backdrop-blur` (the translucent fill is kept). Backdrop filters force
   * the browser to re-blur everything behind the card on every frame it moves,
   * so cards that animate in should opt out. It's visually free wherever the
   * backdrop is a flat color — blurring a solid fill returns the same pixels.
   */
  disableBackdropBlur?: boolean;
}

export const HolographicCard = React.forwardRef<HTMLDivElement, HolographicCardProps>(
  ({ children, className, disableBackdropBlur = false, ...props }, ref) => {
    // The glare hook needs its own ref, and callers (TerminalShell's useInView)
    // need theirs on the same root element, so the two are merged below.
    
    const internalRef = useRef<HTMLDivElement>(null);
    const { glarePosition, isHovered } = useMouseGlare(internalRef);

    const mergedRef = (node: HTMLDivElement) => {
      internalRef.current = node;
      if (typeof ref === "function") {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    };

    return (
      <div
        ref={mergedRef}
        className={cn(
          "relative overflow-hidden bg-white/5 dark:bg-[#1A1A1A]/90 border border-[var(--border-color)] transition-colors duration-300",
          !disableBackdropBlur && "backdrop-blur-sm",
          className
        )}
        {...props}
      >
        <div
          className="pointer-events-none absolute inset-0 z-10 transition-opacity duration-300"
          style={{
            opacity: isHovered ? 1 : 0,
            background: `radial-gradient(circle 300px at ${glarePosition.x}% ${glarePosition.y}%, rgba(255,255,255,0.05), transparent 50%)`,
          }}
        />
        {children}
      </div>
    );
  }
);
HolographicCard.displayName = "HolographicCard";
