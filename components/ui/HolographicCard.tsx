"use client";

import * as React from "react";
import { useRef } from "react";
import { useMouseGlare } from "@/hooks/useMouseGlare";
import { cn } from "@/lib/utils";

interface HolographicCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const HolographicCard = React.forwardRef<HTMLDivElement, HolographicCardProps>(
  ({ children, className, ...props }, ref) => {
    // We need an internal ref for mouse glare if external ref isn't provided, 
    // but a combined ref is better. For simplicity, we just create our own internal ref
    // for the hook and merge it. Or just use a local ref and pass the external ref to the div.
    // Let's use a local ref for the hook, and pass the forwarded ref as well using a callback ref or mergeRefs.
    // Actually, simplest is to use the local ref for the div, and sync it to the forwarded ref if needed.
    // Or just use the local ref for the mouse glare hook, and attach it to the outer div.
    // Wait, the `useInView` hook in TerminalShell requires the ref to be attached to the root element.
    // So we need to merge refs.
    
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
          "relative overflow-hidden bg-white/5 dark:bg-[#1A1A1A]/90 backdrop-blur-sm border border-[var(--border-color)] transition-colors duration-300",
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
