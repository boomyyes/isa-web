"use client";

import * as React from "react";
import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "../ui/ThemeToggle";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "#vision", label: "Vision" },
  { href: "#spotlight", label: "Magazine" },
  { href: "#gallery", label: "Gallery" },
  { href: "#sponsors", label: "Sponsors" },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredPath, setHoveredPath] = useState<string | null>(null);

  return (
    <div className="fixed top-6 inset-x-0 z-50 flex justify-center pointer-events-none">
      <header className="pointer-events-auto bg-white/10 dark:bg-[#1A1A1A]/30 backdrop-blur-2xl border border-white/20 dark:border-white/10 shadow-xl rounded-full transition-colors duration-300">
        <div className="px-6 h-16 flex items-center justify-between gap-8 md:gap-16">
          {/* Logo */}
          <Link href="/" className="font-jetbrains font-bold text-lg tracking-tighter flex items-center gap-2">
            <div className="w-5 h-5 bg-[var(--text-primary)] clip-angular flex items-center justify-center">
              <span className="text-[var(--bg-color)] text-[10px]">ISA</span>
            </div>
            <span className="hidden sm:block">STUDENT COM</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="relative px-2 py-1 font-inter font-medium text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                onMouseEnter={() => setHoveredPath(link.href)}
                onMouseLeave={() => setHoveredPath(null)}
              >
                {link.label}
                {link.href === hoveredPath && (
                  <motion.div
                    layoutId="navbar-indicator"
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--text-primary)]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  />
                )}
              </Link>
            ))}
            <div className="w-px h-4 bg-[var(--border-color)] mx-1" />
            <ThemeToggle />
          </nav>

          {/* Mobile Toggle */}
          <div className="md:hidden flex items-center gap-4">
            <ThemeToggle />
            <button
              className="p-2 text-[var(--text-primary)] focus:outline-none"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        <motion.div
          initial={false}
          animate={isOpen ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }}
          className="md:hidden overflow-hidden bg-[var(--card-color)]/90 backdrop-blur-3xl rounded-b-3xl border-t border-[var(--border-color)]"
        >
          <nav className="flex flex-col p-6 gap-4 text-center">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-inter font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </motion.div>
      </header>
    </div>
  );
}
