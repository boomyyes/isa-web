"use client";

import Image from "next/image";
import { isaacPageSrc } from "@/lib/isaac";
import { cn } from "@/lib/utils";

type BookPageProps = {
  /** 0-based page number. 0 is the cover. */
  index: number;
  /** Total pages in the issue; anything past it renders as blank paper. */
  pageCount: number;
  /** Which half of the spread this page sits on, so the gutter falls inside. */
  side: "left" | "right";
  /**
   * False for pages far from the reader's current position: the paper still
   * renders (it is part of the stack's thickness) but the image is not
   * requested. A forty-page issue would otherwise fetch forty images to show
   * two.
   */
  loadImage: boolean;
  /** Width used for the optimizer's `sizes` hint. */
  pageW: number;
  priority?: boolean;
  className?: string;
  style?: React.CSSProperties;
};

export function BookPage({
  index,
  pageCount,
  side,
  loadImage,
  pageW,
  priority = false,
  className,
  style,
}: BookPageProps) {
  const exists = index < pageCount;

  return (
    <div
      className={cn(
        "absolute inset-0 overflow-hidden",
        // Warm paper white in both themes — a magazine page is not a UI
        // surface, and tinting it with --card-color made the scans look
        // colour-cast. The ring is the cut edge of the sheet.
        "bg-[#F6F3EA] ring-1 ring-black/25",
        side === "right" ? "rounded-r-sm" : "rounded-l-sm",
        className
      )}
      style={style}
    >
      {exists && loadImage ? (
        <Image
          src={isaacPageSrc(index)}
          alt={index === 0 ? "ISAAC magazine cover" : `ISAAC magazine, page ${index}`}
          fill
          priority={priority}
          // Above the default 75: these are scans of print, and the optimizer
          // re-encoding an already-compressed JPEG at 75 visibly softens type.
          // Allowed via images.qualities in next.config.ts.
          quality={90}
          draggable={false}
          sizes={`${Math.max(1, Math.round(pageW))}px`}
          // contain, never cover: cropping a magazine page cuts off type.
          className="pointer-events-none select-none object-contain"
        />
      ) : null}

      {/* Gutter: the shadow a bound page casts into the spine, on the inner
          edge — the opposite side from the sheet's cut edge. Pitched dark on
          purpose. The artwork here is a night sky, and a gentler gradient
          disappeared into it, leaving the spread looking like one wide image
          rather than two bound sheets. */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-y-0 w-[9%]",
          side === "right"
            ? "left-0 bg-gradient-to-r from-black/70 via-black/25 to-transparent"
            : "right-0 bg-gradient-to-l from-black/70 via-black/25 to-transparent"
        )}
      />

      {/* Transparent guard above the image so right-click and drag target this
          layer rather than the <img>, making a casual "save image" harder —
          same trick the spotlight cover uses. Clicks still bubble to the page
          turn handler. */}
      <div
        className="absolute inset-0 z-10"
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
        aria-hidden
      />
    </div>
  );
}
