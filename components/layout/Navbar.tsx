"use client";

import * as React from "react";
import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/initiatives", label: "Initiatives" },
  { href: "/community", label: "Community" },
  { href: "/membership", label: "Membership" },
  { href: "/certificates", label: "Certificates" },
  { href: "/help", label: "Support" },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [atTop, setAtTop] = useState(true);
  const pathname = usePathname();
  const { scrollY } = useScroll();

  // Hysteresis, not a single threshold: the lockup only returns at the very top
  // but does not leave until you are clearly scrolling, so a scroll that hovers
  // around one boundary can never flip it back and forth.
  //
  // No mount effect is needed to seed this. useScroll measures on mount and emits
  // if the position is non-zero, so a page restored part-way down (reload, back
  // button, hash link) collapses the brand on its own.
  useMotionValueEvent(scrollY, "change", (y) => {
    setAtTop((wasAtTop) => (wasAtTop ? y < 48 : y < 8));
  });

  return (
    // Floating wrapper: fixed so the island persists on scroll, centered, and
    // pointer-events-none so the empty area around the pill stays click-through.
    <header className="pointer-events-none fixed inset-x-0 top-3 z-50 flex justify-center px-4 sm:top-4">
      <motion.div
        layout
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 380, damping: 30 }}
        className="pointer-events-auto w-full max-w-fit overflow-hidden rounded-[26px] border border-[var(--border-color)]/60 bg-[var(--bg-color)]/55 shadow-lg shadow-black/20 ring-1 ring-white/5 backdrop-blur-xl supports-[backdrop-filter]:bg-[var(--bg-color)]/45"
      >
        {/* Top row — always visible. Height is class-driven rather than a motion
            value so it stays responsive, and the CSS transition only starts after
            the pill's `layout` prop has taken its measurement, so the two never
            fight over the same box. No flex `gap` here: the brand below collapses
            to zero width, and a gap would survive it and leave the island padded
            lopsidedly — the spacing lives inside the brand instead. */}
        <div
          className={cn(
            "flex items-center px-3 transition-[height] duration-300 ease-out sm:px-4",
            atTop ? "h-16 sm:h-20" : "h-14"
          )}
        >
          {/* Brand. The lockup's lower two lines are only legible at size, so it
              rides large while the page is at the top, then zooms and fades out of
              the island once you scroll — width included, so the links slide over
              rather than leaving a hole. `inert` keeps the invisible link out of
              the tab order; the "Home" nav link is the standing affordance. */}
          <motion.div
            initial={false}
            animate={atTop ? "shown" : "hidden"}
            variants={{
              // Opacity is deliberately out of step with width in both directions.
              // The wrapper clips (overflow-hidden) as its width animates, so if the
              // fade tracked the spring the lockup would be fully opaque while still
              // half-clipped — it read as a wipe cutting words mid-letter. Fading out
              // fast, and in only once the box is nearly open, keeps it a zoom.
              shown: {
                width: "auto",
                opacity: 1,
                scale: 1,
                transition: {
                  type: "spring",
                  stiffness: 300,
                  damping: 32,
                  opacity: { delay: 0.12, duration: 0.22, ease: "easeOut" },
                },
              },
              hidden: {
                width: 0,
                opacity: 0,
                scale: 0.5,
                transition: {
                  type: "spring",
                  stiffness: 300,
                  damping: 32,
                  opacity: { duration: 0.15, ease: "easeIn" },
                },
              },
            }}
            inert={!atTop}
            style={{ transformOrigin: "left center" }}
            className="flex shrink-0 items-center overflow-hidden pr-2 sm:pr-3"
          >
            <Link
              href="/"
              onClick={() => setIsOpen(false)}
              aria-label="ISA RAIT — home"
              className="flex shrink-0 items-center"
            >
              {/* The lockup carries the wordmark itself, so no text label beside it. */}
              <Logo className="h-12 sm:h-16" sizes="163px" eager />
            </Link>
            {/* Divider lives in the brand, not the nav, so it collapses with it
                instead of being left dangling at the island's edge. */}
            <div className="ml-2 hidden h-5 w-px bg-[var(--border-color)]/70 sm:ml-3 md:block" />
          </motion.div>

          {/* Desktop links */}
          <nav className="hidden items-center gap-0.5 md:flex">
            {NAV_LINKS.map((link) => {
              const active = isActive(pathname, link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "relative rounded-full px-3 py-1.5 font-inter text-sm font-medium transition-colors",
                    active
                      ? "text-[var(--text-primary)]"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="island-active-pill"
                      className="absolute inset-0 rounded-full border border-[var(--border-active)]/30 bg-[var(--border-active)]/10"
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    />
                  )}
                  <span className="relative">{link.label}</span>
                </Link>
              );
            })}
            <div className="mx-1 h-5 w-px bg-[var(--border-color)]/70" />
            <ThemeToggle />
          </nav>

          {/* Mobile controls */}
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <button
              type="button"
              aria-label="Toggle navigation menu"
              aria-expanded={isOpen}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full text-[var(--text-primary)] transition-colors hover:bg-[var(--card-color)]/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-active)]"
              onClick={() => setIsOpen((prev) => !prev)}
            >
              {isOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile expansion — grows the island (layout animates its height) */}
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.nav
              key="mobile-links"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-1 px-3 pb-3 md:hidden"
            >
              <div className="mb-1 h-px bg-[var(--border-color)]/60" />
              {NAV_LINKS.map((link) => {
                const active = isActive(pathname, link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "flex min-h-11 items-center rounded-xl px-3 py-2 font-inter text-sm font-medium transition-colors",
                      active
                        ? "bg-[var(--border-active)]/10 text-[var(--text-primary)]"
                        : "text-[var(--text-secondary)] hover:bg-[var(--card-color)]/60 hover:text-[var(--text-primary)]"
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </motion.nav>
          )}
        </AnimatePresence>
      </motion.div>
    </header>
  );
}
