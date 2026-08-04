import * as React from "react";
import { cn } from "@/lib/utils";

// Orange → blue neon sweep used for both the ring and the halo.
const NEON_GRADIENT =
  "linear-gradient(130deg, #FF5A00 0%, #FF7A1A 22%, #1E9CFF 68%, #00E5FF 100%)";

interface NeonFrameProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Wraps a `clip-angular-reverse` container in a breathing orange/blue neon
 * gradient outline. Two layers, both following the same angular clip:
 *   - a blurred halo behind the content for the outward neon glow, and
 *   - a masked hollow gradient ring hugging the edge (the mask keeps the fill
 *     hollow so it never bleeds through a translucent glass card in light mode).
 * Both pulse via the shared `neon-breathe` keyframes. The wrapped child should
 * itself be clipped with `clip-angular-reverse` so the ring lines up.
 */
export function NeonFrame({ children, className }: NeonFrameProps) {
  return (
    // The ring is absolute to this box, so the box must hug the card exactly.
    // Keep this wrapper at its content's natural height (don't let a grid row
    // stretch it — the parent uses items-start) or the gradient would float free.
    <div className={cn("relative", className)}>
      {/* outward halo — blurred, unclipped so it can bleed past the edge */}
      <div
        aria-hidden
        className="animate-neon-breathe-glow pointer-events-none absolute -inset-2 rounded-2xl blur-xl"
        style={{ background: NEON_GRADIENT }}
      />

      {/* gradient ring — hollow via mask-exclude, clipped to the angular shape */}
      <div
        aria-hidden
        className="clip-angular-reverse animate-neon-breathe pointer-events-none absolute inset-0 z-20"
        style={{
          background: NEON_GRADIENT,
          padding: "1.5px",
          WebkitMask:
            "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
          WebkitMaskComposite: "xor",
          mask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
          maskComposite: "exclude",
        }}
      />

      {/* actual content sits above the halo, below the ring */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
