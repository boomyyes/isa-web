import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * The site's button. Two looks, both adapted from the Uiverse.io community
 * library (MIT) and recoloured to the theme tokens; the CSS is in globals.css.
 *  - primary: the cyberpunk glitch button by namecho. A cut corner, an offset
 *    bar in the second colour, and on hover the label tears into RGB slices.
 *  - outline: the corner-bracket button by Shoh2008. Four brackets that snap
 *    out into a full frame on hover, like a crosshair locking on.
 */

type Variant = "primary" | "outline";

function buttonClasses(variant: Variant, className?: string) {
  return cn(
    "relative inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-bold uppercase tracking-wider focus:outline-none disabled:cursor-not-allowed disabled:opacity-60",
    variant === "primary" ? "btn-glitch px-6 py-3" : "btn-bracket px-6 py-3",
    className
  );
}

/** The glitch layer repeats the label, so it can only do that for plain text. */
function glitchText(children: React.ReactNode) {
  const text = React.Children.toArray(children)
    .filter((c) => typeof c === "string" || typeof c === "number")
    .join("")
    .trim();
  return text || undefined;
}

export interface AngularButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  /** When set, the control renders as a Next.js Link for navigation. */
  href?: string;
  /** Passed to the underlying anchor when `href` is set. */
  target?: React.HTMLAttributeAnchorTarget;
  /** Passed to the underlying anchor when `href` is set. */
  rel?: string;
}

export const AngularButton = React.forwardRef<HTMLButtonElement, AngularButtonProps>(
  ({ className, variant = "primary", children, href, target, rel, ...props }, ref) => {
    const data = variant === "primary" ? { "data-text": glitchText(children) } : {};
    const inner = <span className="relative z-10 flex items-center gap-2">{children}</span>;

    if (href) {
      return (
        <Link
          href={href}
          target={target}
          rel={rel}
          className={buttonClasses(variant, className)}
          {...data}
          // Forwarded so the link branch is not a dead end for onClick, id,
          // aria-*, and the rest. The cast is because the prop bag is typed for
          // a <button>; the button-only members (type, disabled, form*) are
          // meaningless rather than harmful on an anchor.
          {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
        >
          {inner}
        </Link>
      );
    }

    return (
      <button ref={ref} className={buttonClasses(variant, className)} {...data} {...props}>
        {inner}
      </button>
    );
  }
);
AngularButton.displayName = "AngularButton";
