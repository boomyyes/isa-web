import * as React from "react";
import { cn } from "@/lib/utils";
import { StarGlyph } from "@/components/artemis/GreekOrnaments";

/**
 * The heading lockup every Artemis section shares: a starred eyebrow in small
 * caps, a Cinzel title, and an optional lead paragraph.
 *
 * Colours are all `var(--accent-color)` / `var(--text-*)`, so the same component
 * renders gold on the cosmic ground and oxblood inside a ParchmentPanel with no
 * prop — the panel's scope class swaps the vars underneath it.
 *
 * The three `data-heading-*` attributes are the handles revealHeadingOnScroll
 * in reveal.ts animates against. They live here rather than being passed in by
 * each section so that all eleven headings enter identically, and so this stays
 * a server component — the animation is declared by whichever client section
 * wraps it.
 *
 * Server component.
 */
export function SectionHeading({
  eyebrow,
  title,
  lead,
  align = "center",
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  eyebrow: string;
  title: React.ReactNode;
  lead?: string;
  align?: "center" | "left";
}) {
  const centered = align === "center";

  return (
    <div
      className={cn(centered && "flex flex-col items-center text-center", className)}
      {...props}
    >
      <p
        data-heading-eyebrow
        data-reveal
        className={cn(
          "flex items-center gap-2.5 font-cinzel text-[0.7rem] font-semibold uppercase tracking-[0.42em] text-[var(--accent-color)]",
          centered && "justify-center"
        )}
      >
        <StarGlyph className="h-2.5 w-2.5 shrink-0" />
        {eyebrow}
        <StarGlyph className="h-2.5 w-2.5 shrink-0" />
      </p>

      <h2
        data-heading-title
        data-reveal
        className="mt-4 font-cinzel text-3xl font-bold tracking-tight text-[var(--text-primary)] sm:text-4xl md:text-5xl"
      >
        {title}
      </h2>

      {lead && (
        <p
          data-heading-lead
          data-reveal
          className={cn(
            "mt-5 max-w-2xl font-cormorant text-lg leading-relaxed text-[var(--text-secondary)] sm:text-xl",
            !centered && "max-w-3xl"
          )}
        >
          {lead}
        </p>
      )}
    </div>
  );
}
