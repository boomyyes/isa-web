import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Variant = "primary" | "outline";

function buttonClasses(variant: Variant, className?: string) {
  return cn(
    "relative group inline-flex items-center justify-center px-6 py-3 text-sm font-bold tracking-wider uppercase transition-all duration-300 clip-angular focus:outline-none",
    variant === "primary"
      ? "bg-[var(--accent-color)] text-[var(--bg-color)] hover:bg-[var(--border-active)]"
      : "bg-transparent text-[var(--text-primary)] hover:bg-[var(--accent-color)] hover:text-[var(--bg-color)]",
    className
  );
}

function ButtonInner({ variant, children }: { variant: Variant; children: React.ReactNode }) {
  return (
    <>
      {variant === "outline" && (
        <div className="absolute inset-0 z-0 border border-[var(--border-active)] clip-angular opacity-50 group-hover:opacity-100 transition-opacity" />
      )}
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </>
  );
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
    if (href) {
      return (
        <Link
          href={href}
          target={target}
          rel={rel}
          className={buttonClasses(variant, className)}
          // Forwarded so the link branch is not a dead end for onClick, id,
          // aria-*, and the rest — previously anything beyond href/target/rel
          // was accepted by the types and then silently dropped. The cast is
          // because the prop bag is typed for a <button>; the overlap is what
          // callers actually pass, and the button-only members (type, disabled,
          // form*) are meaningless rather than harmful on an anchor.
          {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
        >
          <ButtonInner variant={variant}>{children}</ButtonInner>
        </Link>
      );
    }

    return (
      <button ref={ref} className={buttonClasses(variant, className)} {...props}>
        <ButtonInner variant={variant}>{children}</ButtonInner>
      </button>
    );
  }
);
AngularButton.displayName = "AngularButton";
