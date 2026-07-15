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
}

export const AngularButton = React.forwardRef<HTMLButtonElement, AngularButtonProps>(
  ({ className, variant = "primary", children, href, ...props }, ref) => {
    if (href) {
      return (
        <Link href={href} className={buttonClasses(variant, className)}>
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
