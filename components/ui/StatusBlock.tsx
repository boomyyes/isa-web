import * as React from "react";
import { cn } from "@/lib/utils";

interface StatusBlockProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string;
  value: string;
  progress?: number; // 0 to 100
}

export function StatusBlock({ label, value, progress, className, ...props }: StatusBlockProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1 text-xs font-jetbrains font-bold tracking-widest uppercase border border-[var(--border-color)] bg-[var(--card-color)]",
        className
      )}
      {...props}
    >
      <span className="text-[var(--text-secondary)]">[</span>
      {label && <span className="text-[var(--text-secondary)]">{label} //</span>}
      <span className="text-[var(--border-active)]">{value}</span>
      
      {progress !== undefined && (
        <div className="flex gap-[2px] ml-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "w-1 h-3",
                i < progress / 10 ? "bg-[var(--border-active)]" : "bg-[var(--border-color)]"
              )}
            />
          ))}
        </div>
      )}
      
      <span className="text-[var(--text-secondary)]">]</span>
    </div>
  );
}
