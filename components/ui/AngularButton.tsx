import * as React from "react";
import { cn } from "@/lib/utils";

export interface AngularButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline";
}

export const AngularButton = React.forwardRef<HTMLButtonElement, AngularButtonProps>(
  ({ className, variant = "primary", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "relative group inline-flex items-center justify-center px-6 py-3 text-sm font-bold tracking-wider uppercase transition-all duration-300 clip-angular focus:outline-none",
          variant === "primary"
            ? "bg-[var(--accent-color)] text-[var(--bg-color)] hover:bg-[var(--border-active)]"
            : "bg-transparent text-[var(--text-primary)] hover:bg-[var(--accent-color)] hover:text-[var(--bg-color)]",
          className
        )}
        {...props}
      >
        {variant === "outline" && (
          <div className="absolute inset-0 z-0 border border-[var(--border-active)] clip-angular opacity-50 group-hover:opacity-100 transition-opacity" />
        )}
        <span className="relative z-10 flex items-center gap-2">{children}</span>
      </button>
    );
  }
);
AngularButton.displayName = "AngularButton";
