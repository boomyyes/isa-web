"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FAQItem {
  question: string;
  answer: string;
}

interface AccordionProps {
  /**
   * Required: this component carries no content of its own. Each page owns its
   * own list — SUPPORT_FAQS in lib/data.ts, ARTEMIS_FAQS in lib/artemis.ts,
   * CERTIFICATE_FAQS beside the page that asks the questions.
   */
  items: FAQItem[];
  className?: string;
  /** Index expanded on first render; pass null for all-collapsed. */
  defaultOpen?: number | null;
}

export function Accordion({
  items,
  className,
  defaultOpen = 0,
}: AccordionProps) {
  // Single-open accordion: only one panel is expanded at a time.
  const [openIndex, setOpenIndex] = useState<number | null>(defaultOpen);

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {items.map((item, i) => {
        const isOpen = i === openIndex;
        const panelId = `faq-panel-${i}`;
        const buttonId = `faq-button-${i}`;

        return (
          <div
            key={i}
            className={cn(
              "overflow-hidden rounded-xl border bg-[var(--card-color)]/60 backdrop-blur-md transition-colors duration-300",
              isOpen
                ? "border-[var(--border-active)]/60"
                : "border-[var(--border-color)] hover:border-[var(--border-active)]/40"
            )}
          >
            <h3>
              <button
                id={buttonId}
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : i)}
                aria-expanded={isOpen}
                aria-controls={panelId}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-active)] focus-visible:ring-inset"
              >
                <span className="font-jetbrains text-sm font-medium leading-snug text-[var(--text-primary)] md:text-base">
                  {item.question}
                </span>
                <ChevronDown
                  aria-hidden
                  className={cn(
                    "h-5 w-5 shrink-0 text-[var(--accent-color)] transition-transform duration-300",
                    isOpen && "rotate-180"
                  )}
                />
              </button>
            </h3>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  key="content"
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{
                    height: { duration: 0.34, ease: [0.22, 1, 0.36, 1] },
                    opacity: { duration: 0.22, ease: "easeOut" },
                  }}
                  className="overflow-hidden"
                >
                  <p className="px-5 pb-5 text-sm leading-relaxed text-[var(--text-secondary)]">
                    {item.answer}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
