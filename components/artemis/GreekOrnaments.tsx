import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Inline SVG ornaments for the Artemis page.
 *
 * Every stroke is `currentColor`, so an ornament takes its colour from the
 * `text-*` class on itself or an ancestor. That is what lets the same meander
 * render as gold on the cosmic ground and as oxblood inside a parchment panel
 * without a second copy or a colour prop.
 *
 * All of these are server components — no hooks beyond useId, no handlers.
 */

/* ------------------------------------------------------------------ *
 * Meander (Greek key)
 * ------------------------------------------------------------------ */

/**
 * One tile of the key pattern, drawn as a single open path on a 24x24 grid.
 * Shared by the divider and the frame so the two always agree on scale and
 * stroke weight.
 */
const MEANDER_TILE = "M0 20 L0 4 L16 4 L16 16 L8 16 L8 10 L20 10 L20 20";

/**
 * Registers the repeating key as an SVG <pattern>.
 *
 * `id` has to be unique per document — two patterns sharing an id means the
 * first one wins everywhere, silently — so callers pass one from useId.
 */
function MeanderPatternDef({ id, size = 24 }: { id: string; size?: number }) {
  return (
    <defs>
      <pattern id={id} width={size} height={size} patternUnits="userSpaceOnUse">
        <path
          d={MEANDER_TILE}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          vectorEffect="non-scaling-stroke"
        />
      </pattern>
    </defs>
  );
}

/**
 * A horizontal rule in the manner of the reference spread: a run of Greek key
 * on each side, arrowheads pointing inward, and a diamond at the centre.
 *
 * The key runs are rects filled with the pattern rather than repeated paths, so
 * the rule stretches to any width without a tile ever being cut at an odd
 * place — the pattern simply clips at the rect edge.
 */
export function MeanderDivider({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const patternId = React.useId();

  return (
    <div
      aria-hidden
      className={cn("flex w-full items-center justify-center", className)}
      {...props}
    >
      <svg
        className="h-6 w-full max-w-2xl"
        viewBox="0 0 400 24"
        preserveAspectRatio="none"
        fill="none"
      >
        <MeanderPatternDef id={patternId} />
        {/* Left run + inward arrowhead */}
        <rect x="0" y="0" width="150" height="24" fill={"url(#" + patternId + ")"} />
        <path d="M158 12 L170 5 L170 19 Z" fill="currentColor" />
        {/* Centre diamond */}
        <path d="M200 4 L208 12 L200 20 L192 12 Z" fill="currentColor" />
        <path
          d="M182 12 L192 12 M208 12 L218 12"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        {/* Right run + inward arrowhead */}
        <path d="M242 12 L230 5 L230 19 Z" fill="currentColor" />
        <rect x="250" y="0" width="150" height="24" fill={"url(#" + patternId + ")"} />
      </svg>
    </div>
  );
}

/**
 * A Greek key border traced around the parent's edges. Absolutely positioned at
 * inset-0, so the parent needs `relative`.
 *
 * It is one stroked rect filled with the key pattern rather than four separate
 * runs, so the corners always meet cleanly at any panel size.
 */
export function MeanderFrame({
  className,
  ...props
}: React.SVGAttributes<SVGSVGElement>) {
  const patternId = React.useId();

  return (
    <svg
      aria-hidden
      // Inset by half the stroke width, on the <svg> rather than the <rect>.
      // A stroke straddles its path, so a rect filling this box paints 7px
      // outward and lands flush with the parent's edge — and the inset is done
      // in CSS, avoiding calc() in an SVG geometry attribute, which browsers
      // support unevenly.
      className={cn("pointer-events-none absolute inset-[7px]", className)}
      fill="none"
      {...props}
    >
      <MeanderPatternDef id={patternId} size={20} />
      <rect
        x="0"
        y="0"
        width="100%"
        height="100%"
        fill="none"
        stroke={"url(#" + patternId + ")"}
        strokeWidth={14}
      />
    </svg>
  );
}

/**
 * The heavy stepped corner block from the reference spread. `corner` rotates
 * the one path into place rather than defining four of them.
 */
export function CornerKey({
  corner = "tl",
  className,
  ...props
}: React.SVGAttributes<SVGSVGElement> & {
  corner?: "tl" | "tr" | "bl" | "br";
}) {
  const rotation = { tl: 0, tr: 90, br: 180, bl: 270 }[corner];

  return (
    <svg
      aria-hidden
      viewBox="0 0 64 64"
      className={cn("pointer-events-none", className)}
      style={{ transform: "rotate(" + rotation + "deg)" }}
      fill="none"
      {...props}
    >
      <path d="M4 60 L4 4 L60 4 L60 16 L16 16 L16 60 Z" fill="currentColor" opacity="0.85" />
      <path d="M26 54 L26 26 L54 26 L54 34 L34 34 L34 54 Z" fill="currentColor" opacity="0.5" />
    </svg>
  );
}

/* ------------------------------------------------------------------ *
 * Celestial
 * ------------------------------------------------------------------ */

/**
 * The engraved compass rose. Split into two exported rings so the hero can
 * counter-rotate them against each other; <Astrolabe> stacks both for static
 * use.
 */
export function AstrolabeOuter({ className, ...props }: React.SVGAttributes<SVGSVGElement>) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 200 200"
      className={cn("pointer-events-none", className)}
      fill="none"
      {...props}
    >
      <circle cx="100" cy="100" r="96" stroke="currentColor" strokeWidth="1" opacity="0.5" />
      <circle cx="100" cy="100" r="88" stroke="currentColor" strokeWidth="0.6" opacity="0.35" />
      {/* Graduated rim — 60 ticks, every fifth one long. */}
      {Array.from({ length: 60 }, (_, i) => {
        const long = i % 5 === 0;
        return (
          <line
            key={i}
            x1="100"
            y1={long ? 76 : 80}
            x2="100"
            y2="88"
            stroke="currentColor"
            strokeWidth={long ? 1.2 : 0.6}
            opacity={long ? 0.7 : 0.4}
            transform={"rotate(" + i * 6 + " 100 100)"}
          />
        );
      })}
    </svg>
  );
}

export function AstrolabeInner({ className, ...props }: React.SVGAttributes<SVGSVGElement>) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 200 200"
      className={cn("pointer-events-none", className)}
      fill="none"
      {...props}
    >
      <circle cx="100" cy="100" r="62" stroke="currentColor" strokeWidth="0.8" opacity="0.45" />
      <circle cx="100" cy="100" r="40" stroke="currentColor" strokeWidth="0.6" opacity="0.3" />
      {/* Eight-point rose, with a half-scale set rotated into the gaps. */}
      <path
        d="M100 24 L108 92 L176 100 L108 108 L100 176 L92 108 L24 100 L92 92 Z"
        fill="currentColor"
        opacity="0.26"
      />
      <path
        d="M100 48 L105 95 L152 100 L105 105 L100 152 L95 105 L48 100 L95 95 Z"
        fill="currentColor"
        opacity="0.18"
        transform="rotate(45 100 100)"
      />
    </svg>
  );
}

export function Astrolabe({ className, ...props }: React.SVGAttributes<SVGSVGElement>) {
  return (
    <span className={cn("pointer-events-none relative block", className)}>
      <AstrolabeOuter className="absolute inset-0 h-full w-full" {...props} />
      <AstrolabeInner className="absolute inset-0 h-full w-full" {...props} />
    </span>
  );
}

/**
 * Artemis' mark — crescent moon over a drawn bow. The hero lockup.
 *
 * `maskId` is required rather than defaulted: an SVG mask id is document-global,
 * so two instances with the same id would share one mask.
 */
export function CrescentBow({
  maskId,
  className,
  ...props
}: React.SVGAttributes<SVGSVGElement> & { maskId: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 120 120"
      className={cn("pointer-events-none", className)}
      fill="none"
      {...props}
    >
      {/* The crescent is a disc cut by an offset disc rather than two arcs, so
          the horns stay sharp at any size. */}
      <mask id={maskId}>
        <rect width="120" height="120" fill="black" />
        <circle cx="58" cy="40" r="26" fill="white" />
        <circle cx="70" cy="33" r="24" fill="black" />
      </mask>
      <rect width="120" height="120" fill="currentColor" mask={"url(#" + maskId + ")"} />
      {/* Bow stave, string, nocked arrow */}
      <path d="M30 78 Q60 60 90 78" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M30 78 L90 78" stroke="currentColor" strokeWidth="1.2" opacity="0.7" />
      <path
        d="M60 70 L60 98 M54 92 L60 98 L66 92"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Laurel half-wreath. `side` mirrors it for the pair around a prize rank. */
export function Laurel({
  side = "left",
  className,
  ...props
}: React.SVGAttributes<SVGSVGElement> & { side?: "left" | "right" }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 40 100"
      className={cn("pointer-events-none", className)}
      style={side === "right" ? { transform: "scaleX(-1)" } : undefined}
      fill="none"
      {...props}
    >
      <path
        d="M34 6 Q10 34 12 94"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.8"
      />
      {/* Leaves along the stem, tightening toward the tip. */}
      {[
        { cy: 18, rx: 11, ry: 5, rot: -32 },
        { cy: 33, rx: 12, ry: 5.5, rot: -20 },
        { cy: 48, rx: 12, ry: 5.5, rot: -10 },
        { cy: 63, rx: 11, ry: 5, rot: 0 },
        { cy: 78, rx: 9, ry: 4.5, rot: 10 },
        { cy: 90, rx: 7, ry: 3.5, rot: 18 },
      ].map((leaf, i) => (
        <ellipse
          key={i}
          cx={22}
          cy={leaf.cy}
          rx={leaf.rx}
          ry={leaf.ry}
          fill="currentColor"
          opacity="0.5"
          transform={"rotate(" + leaf.rot + " 22 " + leaf.cy + ")"}
        />
      ))}
    </svg>
  );
}

/** Four-point star — the page's punctuation mark, used inline and scattered. */
export function StarGlyph({ className, ...props }: React.SVGAttributes<SVGSVGElement>) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className={cn("pointer-events-none", className)}
      fill="none"
      {...props}
    >
      <path d="M12 0 L14 10 L24 12 L14 14 L12 24 L10 14 L0 12 L10 10 Z" fill="currentColor" />
    </svg>
  );
}
