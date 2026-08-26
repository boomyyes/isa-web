"use client";

import * as React from "react";
import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ClampedTextProps {
  /** One paragraph, or one entry per paragraph — same contract as principal.message. */
  text: string | string[];
  /**
   * Height of the collapsed block below md, in lines. Resolved in CSS against
   * this box's own line-height (`1lh`), so it stays exact whatever text-* the
   * caller sets — see the [data-clamp-body] rules in app/globals.css.
   */
  lines?: number;
  /**
   * Below this many characters the block is never clamped and no toggle is
   * rendered. Counted from `text`, which is a build-time constant, so the server
   * and the client always reach the same answer and there is nothing to measure
   * in the browser. The default assumes a deliberately generous 55 characters
   * per line (the real figure on a phone is 33-41), so a block only marginally
   * over budget renders in full rather than behind a toggle that barely moves it.
   */
  minChars?: number;
  /** Outer wrapper — margins and max-width belong here. */
  className?: string;
  /**
   * The clamped box. Put the type scale and the paragraph gap HERE, not on the
   * paragraphs: the collapsed height is `lines * 1lh`, which resolves against
   * this element's computed line-height, and the <p> children inherit it.
   */
  textClassName?: string;
  moreLabel?: string;
  lessLabel?: string;
}

/**
 * Collapses a block of prose behind a Read more / Show less toggle on phones
 * only. At md and up the clamp does not exist: every rule that hides anything
 * lives inside a media query in globals.css, and the toggle is `md:hidden`.
 *
 * There is deliberately no viewport check in JS here. The server cannot know how
 * wide the screen is, so reading matchMedia during render would either mismatch
 * on hydration or flash. Leaving the breakpoint to CSS also means rotating a
 * tablet across 768px is correct for free — no resize listener, no state to
 * reconcile.
 *
 * framer-motion is avoided for the same reason it is used everywhere else in
 * this codebase: it writes animated values as an inline style attribute, and an
 * inline height would beat `md:` utilities and leak the mobile clamp onto
 * desktop. The CSS transition below reuses the exact easing curve from
 * ProfileCard's revealTransition so the reveal still feels like the rest of the
 * site.
 */
export function ClampedText({
  text,
  lines = 8,
  minChars,
  className,
  textClassName,
  moreLabel = "Read more",
  lessLabel = "Show less",
}: ClampedTextProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  // useId keeps aria-controls stable across hydration and unique across the
  // eleven instances that can share the Initiatives page.
  const bodyId = `clamped-${useId()}`;

  const paragraphs = Array.isArray(text) ? text : [text];
  const body = paragraphs.map((paragraph, i) => <p key={i}>{paragraph}</p>);

  // Too short to be worth a control: render exactly what the call site rendered
  // before this component existed — no button, no data attributes.
  if (paragraphs.reduce((n, p) => n + p.length, 0) < (minChars ?? lines * 55)) {
    return <div className={cn(className, textClassName)}>{body}</div>;
  }

  return (
    <div className={className}>
      <div
        id={bodyId}
        data-clamp-body
        data-expanded={isExpanded}
        style={{ "--clamp-lines": lines } as React.CSSProperties}
        className={textClassName}
      >
        {body}
      </div>

      {/* min-h-11 is the 44px tap target; -ml-2 cancels the padding so the label
          still lines up with the left edge of the text above it. */}
      <button
        type="button"
        onClick={() => setIsExpanded((v) => !v)}
        aria-expanded={isExpanded}
        aria-controls={bodyId}
        data-clamp-toggle
        className="-ml-2 inline-flex min-h-11 items-center gap-1.5 rounded-md px-2 font-jetbrains text-xs font-medium text-[var(--accent-color)] outline-none transition-colors hover:text-[var(--border-active)] focus-visible:ring-2 focus-visible:ring-[var(--border-active)] md:hidden"
      >
        {isExpanded ? lessLabel : moreLabel}
        <ChevronDown
          aria-hidden
          className={cn(
            "h-3.5 w-3.5 transition-transform duration-300",
            isExpanded && "rotate-180"
          )}
        />
      </button>
    </div>
  );
}
