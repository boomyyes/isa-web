"use client";

import * as React from "react";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { UserRound } from "lucide-react";
import type { SocialLink, SocialPlatform } from "@/lib/data";
import { GithubIcon, LinkedinIcon } from "@/components/ui/BrandIcons";
import { cn } from "@/lib/utils";

const SOCIAL_META: Record<
  SocialPlatform,
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  github: { label: "GitHub", icon: GithubIcon },
  linkedin: { label: "LinkedIn", icon: LinkedinIcon },
};

// Smooth easing for the reveal — animates the real height so everything below
// the card slides down gradually instead of snapping.
const revealTransition = {
  height: { duration: 0.38, ease: [0.22, 1, 0.36, 1] as const },
  opacity: { duration: 0.25, ease: "easeOut" as const },
};

interface ProfileCardProps {
  role: string;
  name: string;
  type: "faculty" | "student";
  socials: SocialLink[];
}

function Socials({ socials }: { socials: SocialLink[] }) {
  return (
    <div
      className="mt-3 flex items-center justify-center gap-2"
      onClick={(e) => e.stopPropagation()}
    >
      {socials.map(({ platform, href }) => {
        const { label, icon: Icon } = SOCIAL_META[platform];
        return (
          <a
            key={platform}
            href={href}
            aria-label={`[${label} Placeholder]`}
            className="rounded-md border border-[var(--border-color)]/60 p-1.5 text-[var(--text-secondary)] transition-colors hover:border-[var(--border-active)] hover:text-[var(--text-primary)]"
          >
            <Icon className="h-3.5 w-3.5" />
          </a>
        );
      })}
    </div>
  );
}

export function ProfileCard({ role, name, type, socials }: ProfileCardProps) {
  const isFaculty = type === "faculty";
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      onClick={isFaculty ? undefined : () => setIsExpanded((v) => !v)}
      role={isFaculty ? undefined : "button"}
      tabIndex={isFaculty ? undefined : 0}
      aria-expanded={isFaculty ? undefined : isExpanded}
      onKeyDown={
        isFaculty
          ? undefined
          : (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setIsExpanded((v) => !v);
              }
            }
      }
      className={cn(
        "flex flex-col overflow-hidden rounded-2xl border text-center transition-colors duration-300",
        isFaculty
          ? "border-[var(--border-active)]/50 bg-[var(--card-color)] shadow-[0_0_24px_rgba(0,229,255,0.12)]"
          : "cursor-pointer border-[var(--border-color)] bg-[var(--card-color)] hover:border-[var(--border-active)]/50"
      )}
    >
      {/* Full-bleed rectangular photo placeholder.
          Swap the icon block for:
          <img src="..." alt="[Name]" className="absolute inset-0 h-full w-full object-cover" /> */}
      <div
        className={cn(
          "relative w-full shrink-0 border-b border-[var(--border-color)]/60 bg-[var(--bg-color)]/60",
          isFaculty ? "aspect-[4/5]" : "aspect-square"
        )}
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-[var(--text-secondary)]">
          <UserRound className={isFaculty ? "h-12 w-12" : "h-8 w-8"} />
          <span className="font-jetbrains text-[10px] opacity-70">[Photo]</span>
        </div>
      </div>

      {/* Text area */}
      <div className={cn("px-3", isFaculty ? "py-4" : "py-3")}>
        {/* Role — always visible */}
        <p
          className={cn(
            "font-jetbrains font-medium leading-tight text-[var(--text-primary)]",
            isFaculty ? "text-sm" : "text-xs"
          )}
        >
          {role}
        </p>

        {/* Faculty: always shown. Student: smoothly reveals on click. */}
        {isFaculty ? (
          <div>
            <p className="mt-1 font-inter text-sm text-[var(--text-secondary)]">
              {name}
            </p>
            <Socials socials={socials} />
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {isExpanded && (
              <motion.div
                key="details"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={revealTransition}
                className="overflow-hidden"
              >
                <p className="mt-1 font-inter text-xs text-[var(--text-secondary)]">
                  {name}
                </p>
                <Socials socials={socials} />
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
