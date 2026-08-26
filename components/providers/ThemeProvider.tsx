"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { MotionConfig } from "framer-motion";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes";
import { themeLockFor } from "@/lib/themeLock";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const pathname = usePathname();

  // Pages that paint their own palette pin the chrome to match — see
  // lib/themeLock.ts. `forcedTheme` overrides what is applied without touching
  // the stored preference, so navigating away restores the visitor's own theme
  // on its own; there is no save/restore to get wrong. undefined on every other
  // route, which is the same as not passing it.
  const lock = themeLockFor(pathname);

  return (
    <NextThemesProvider {...props} forcedTheme={lock?.theme}>
      {/* reducedMotion="user" honours the OS setting for every framer-motion
          animation on the site at once — transforms and opacity stop animating,
          layout-critical values still apply. CSS animations are handled
          separately, in the prefers-reduced-motion block in globals.css. */}
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </NextThemesProvider>
  );
}
