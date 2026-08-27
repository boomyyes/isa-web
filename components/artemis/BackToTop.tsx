"use client";

import { useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
} from "framer-motion";
import { ArrowUp } from "lucide-react";
import { AstrolabeOuter } from "@/components/artemis/GreekOrnaments";
import { scrollToSection } from "@/components/artemis/scrollToSection";

/**
 * Back to the top of the page, bottom right, once there is enough page behind
 * you to be worth it.
 *
 * It is a real anchor to #top — the hero carries that id — rather than a button
 * with a scroll handler. That means it reuses scrollToSection unchanged (same
 * eased framer-motion scroll, same repeat-press behaviour, same reduced-motion
 * fallback), it still works with scripting off, and it can be middle-clicked or
 * copied like any other link.
 *
 * Focus is the reason the anchor points at a real element rather than scrolling
 * to a bare 0: the control hides once you reach the top, so a keyboard user who
 * activated it would be left with focus on a vanished element and no position in
 * the document. scrollToSection moves focus to the hero instead.
 */

/**
 * Roughly one screen of scrolling before it appears, with a lower threshold to
 * hide again — the gap is hysteresis, so a scroll that hovers around the
 * boundary cannot flicker the button in and out. Same approach the navbar uses
 * for collapsing its brand lockup.
 */
const SHOW_AFTER = 700;
const HIDE_BELOW = 500;

export function BackToTop() {
  const [visible, setVisible] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (y) => {
    setVisible((wasVisible) => (wasVisible ? y > HIDE_BELOW : y > SHOW_AFTER));
  });

  return (
    <AnimatePresence>
      {visible && (
        <motion.a
          key="artemis-back-to-top"
          href="#top"
          onClick={(e) => scrollToSection(e, "top")}
          aria-label="Back to top"
          initial={{ opacity: 0, y: 16, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.9 }}
          transition={{ duration: 0.28, ease: [0.33, 1, 0.68, 1] }}
          // z-40 keeps it under the navbar island (z-50) but over the page.
          className="group fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full border border-[var(--artemis-gold)]/40 bg-[var(--artemis-night)]/80 text-[var(--artemis-gold-light)] backdrop-blur-sm transition-colors hover:border-[var(--artemis-gold)] hover:bg-[var(--artemis-nebula)]/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--artemis-gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--artemis-void)] sm:bottom-8 sm:right-8"
        >
          {/* Engraved rim, echoing the hero's astrolabe. Only turns on hover, so
              a control that sits on screen for most of the page is not a
              permanent piece of motion in the corner of the eye. */}
          <AstrolabeOuter
            className="absolute inset-0 h-full w-full text-[var(--artemis-gold)] opacity-30 transition-opacity duration-500 group-hover:animate-artemis-orbit group-hover:opacity-70"
          />
          <ArrowUp className="relative h-5 w-5 transition-transform duration-300 group-hover:-translate-y-0.5" />
        </motion.a>
      )}
    </AnimatePresence>
  );
}
