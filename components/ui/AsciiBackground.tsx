"use client";

import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { AsciiWaves } from "@/components/ui/AsciiWaves";

/** Route that scopes the waves to its hero instead of the whole page. */
const HERO_SCOPED_ROUTE = "/";

/**
 * Vertical fade for the contained (hero) variant, so the waves dissolve toward
 * the bottom of the section — roughly from the CTA buttons down — instead of
 * ending on a hard edge against the plain background below.
 */
const HERO_FADE = "linear-gradient(to bottom, #000 0%, #000 72%, transparent 96%)";

interface AsciiBackgroundProps {
  /**
   * Fill the nearest positioned ancestor (`absolute`) rather than the viewport
   * (`fixed`). Used by the homepage hero to confine the waves to that section.
   */
  contained?: boolean;
}

/**
 * Interactive ASCII backdrop. Rendered `fixed` behind the page content (which
 * sits in a `relative z-10` wrapper in the root layout) and above the body's
 * base background color, so the transparent canvas composites over it.
 * pointer-events are off; the waves track the cursor via a window listener.
 *
 * On the homepage the site-wide instance opts out and the Hero renders its own
 * `contained` copy, so the waves stop at the bottom of the hero section. Every
 * other route keeps the full-page backdrop.
 */
export function AsciiBackground({ contained = false }: AsciiBackgroundProps) {
  const pathname = usePathname();
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme !== "light";

  if (!contained && pathname === HERO_SCOPED_ROUTE) return null;

  return (
    <div
      aria-hidden
      className={`pointer-events-none z-0 ${contained ? "absolute inset-0" : "fixed inset-0"}`}
      style={
        contained
          ? { maskImage: HERO_FADE, WebkitMaskImage: HERO_FADE }
          : undefined
      }
    >
      <AsciiWaves
        // Kept deliberately below the text tier: at these alphas the glyphs
        // composite to ~#393939 on the dark bg and ~#B4B8C0 on the light one —
        // clear of the text colors, so body copy reads on top of the noise.
        color={dark ? "rgba(255,255,255,0.18)" : "rgba(15,23,42,0.28)"}
        // Slow drift + a reduced refresh + larger cells: the three biggest cost
        // levers (fillText calls scale with fps and glyph count). 12fps read as
        // steppy in practice; 20 is the floor that still looks smooth here.
        speed={6}
        fps={60}
        elementSize={22}
        direction="left"
        maxDpr={1.5}
      />
    </div>
  );
}

export default AsciiBackground;
