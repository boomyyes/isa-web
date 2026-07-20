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
  { href: "/help", label: "Support" },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-[var(--bg-color)]/70 backdrop-blur-xl border-b border-[var(--border-color)]/60 transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-6">
        <div className="h-16 flex items-center justify-between">
          {/* Logo — theme-aware placeholder, swap slots for real PNGs in Logo.tsx */}
          <Link
            href="/"
            className="flex items-center gap-2 font-jetbrains font-bold tracking-tight text-[var(--text-primary)]"
          >
            <Logo className="h-8" />
            <span>RAIT</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => {
              const active = isActive(pathname, link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "px-3 py-2 rounded-md font-inter text-sm font-medium transition-colors",
                    active
                      ? "text-[var(--text-primary)]"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
            <div className="w-px h-4 bg-[var(--border-color)] mx-2" />
            <ThemeToggle />
          </nav>

          {/* Mobile Toggle */}
          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle />
            <button
              type="button"
              aria-label="Toggle navigation menu"
              aria-expanded={isOpen}
              className="p-2 text-[var(--text-primary)] focus:outline-none"
              onClick={() => setIsOpen((prev) => !prev)}
            >
              {isOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.nav
            key="mobile-menu"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            // No backdrop-blur here: the fill is 90% opaque so the blur is all
            // but invisible, and this panel animates its height open/closed —
            // which would force the filter to recompute every frame.
            className="md:hidden overflow-hidden border-t border-[var(--border-color)]/60 bg-[var(--bg-color)]/90"
          >
            <div className="flex flex-col px-6 py-4 gap-1">
              {NAV_LINKS.map((link) => {
                const active = isActive(pathname, link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "px-3 py-2 rounded-md font-inter text-sm font-medium transition-colors",
                      active
                        ? "text-[var(--text-primary)] bg-[var(--card-color)]"
                        : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
