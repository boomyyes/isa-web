"use client";

import * as React from "react";
import { motion } from "framer-motion";

/**
 * Wraps a page's content so it fades in and slides up slightly on mount.
 * Apply this inside individual page components (not the root layout) to
 * avoid hydration mismatches.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
