"use client";

import * as React from "react";
import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
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
  const pathname = usePathname();

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
        {/* Top row — always visible */}
        <div className="flex h-14 items-center gap-2 px-3 sm:gap-3 sm:px-4">
          <Link
            href="/"
            onClick={() => setIsOpen(false)}
            className="flex shrink-0 items-center gap-2 font-jetbrains font-bold tracking-tight text-[var(--text-primary)]"
          >
            <Logo className="h-7" />
            <span>RAIT</span>
          </Link>

          {/* Desktop links */}
          <nav className="hidden items-center gap-0.5 md:flex">
            <div className="mx-1 h-5 w-px bg-[var(--border-color)]/70" />
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
          <div className="flex items-center gap-1 md:hidden">
            <ThemeToggle />
            <button
              type="button"
              aria-label="Toggle navigation menu"
              aria-expanded={isOpen}
              className="rounded-full p-2 text-[var(--text-primary)] transition-colors hover:bg-[var(--card-color)]/60 focus:outline-none"
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
                      "rounded-xl px-3 py-2 font-inter text-sm font-medium transition-colors",
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
