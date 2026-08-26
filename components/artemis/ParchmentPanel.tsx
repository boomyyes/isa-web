import * as React from "react";
import { cn } from "@/lib/utils";
import { CornerKey, MeanderFrame } from "@/components/artemis/GreekOrnaments";
import { ARTEMIS_PANEL_SHADOW } from "@/components/artemis/tokens";

/**
 * An aged-parchment surface, in the manner of the reference magazine spread.
 *
 * The `.artemis-parchment` class is the load-bearing part: it redefines the
 * same semantic vars the rest of the site uses (--accent-color, --text-primary,
 * --card-color …) to cream-and-oxblood for everything inside. So an
 * AngularButton, an Accordion or a FormEmbed dropped into a panel inverts on its
 * own, with no variant prop and no component changes. See app/globals.css.
 *
 * Server component.
 */
export interface ParchmentPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Greek-key border traced around the edge. */
  meander?: boolean;
  /** Stepped blocks in all four corners, as on the reference spread. */
  corners?: boolean;
  /** Extra classes for the inner content box, inside the panel's padding. */
  contentClassName?: string;
}

export function ParchmentPanel({
  meander = true,
  corners = false,
  className,
  contentClassName,
  children,
  ...props
}: ParchmentPanelProps) {
  return (
    <div
      className={cn(
        "artemis-parchment artemis-grain relative isolate overflow-hidden rounded-sm",
        "bg-[var(--artemis-parchment)] text-[var(--text-primary)]",
        className
      )}
      style={{ boxShadow: ARTEMIS_PANEL_SHADOW }}
      {...props}
    >
      {/* Ornament layer. Oxblood at low opacity so the key reads as printed on
          the paper rather than drawn over it. */}
      {meander && (
        <MeanderFrame className="text-[var(--artemis-oxblood)] opacity-25" />
      )}

      {corners && (
        <>
          <CornerKey corner="tl" className="absolute left-0 top-0 h-12 w-12 text-[var(--artemis-oxblood)] opacity-40 sm:h-16 sm:w-16" />
          <CornerKey corner="tr" className="absolute right-0 top-0 h-12 w-12 text-[var(--artemis-oxblood)] opacity-40 sm:h-16 sm:w-16" />
          <CornerKey corner="bl" className="absolute bottom-0 left-0 h-12 w-12 text-[var(--artemis-oxblood)] opacity-40 sm:h-16 sm:w-16" />
          <CornerKey corner="br" className="absolute bottom-0 right-0 h-12 w-12 text-[var(--artemis-oxblood)] opacity-40 sm:h-16 sm:w-16" />
        </>
      )}

      {/* Content sits above the ornaments. The padding clears the meander band,
          which is 14px of stroke inset 7px from the edge. */}
      <div className={cn("relative z-10 p-7 sm:p-10 md:p-14", contentClassName)}>
        {children}
      </div>
    </div>
  );
}
