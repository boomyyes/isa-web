"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Answers are authored as plain strings (lib/data.ts, lib/artemis.ts), so any
 * URL or email address in the copy is picked out here and turned into a real
 * link. Capturing group keeps the matches in the split() output.
 */
const LINK_PATTERN =
  /(https?:\/\/[^\s<>]+|www\.[^\s<>]+|[^\s<>()]+@[^\s<>()]+\.[a-z]{2,})/gi;

/** Sentence punctuation that trails a link belongs to the prose, not the href. */
const TRAILING_PUNCTUATION = /[.,;:!?)\]]+$/;

/** Our own domain — those links stay in-app via next/link. */
const INTERNAL_HOSTS = new Set(["isarait.in", "www.isarait.in"]);

const linkClass =
  "font-medium text-[var(--accent-color)] underline decoration-[var(--accent-color)]/40 underline-offset-4 transition-colors hover:decoration-[var(--accent-color)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-active)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--card-color)]";

function linkify(text: string) {
  return text.split(LINK_PATTERN).map((part, i) => {
    // Odd indices are the captured matches; even indices are plain prose.
    if (i % 2 === 0 || !part) return <Fragment key={i}>{part}</Fragment>;

    const trailing = part.match(TRAILING_PUNCTUATION)?.[0] ?? "";
    const target = trailing ? part.slice(0, -trailing.length) : part;
    const isEmail = target.includes("@") && !target.startsWith("http");

    let href: string;
    let internalPath: string | null = null;

    if (isEmail) {
      href = `mailto:${target}`;
    } else {
      const absolute = target.startsWith("http") ? target : `https://${target}`;
      href = absolute;
      try {
        const url = new URL(absolute);
        if (INTERNAL_HOSTS.has(url.host)) {
          internalPath = `${url.pathname}${url.search}${url.hash}`;
        }
      } catch {
        // Not a parseable URL after all — fall through to a plain anchor.
      }
    }

    return (
      <Fragment key={i}>
        {internalPath ? (
          <Link href={internalPath} className={linkClass}>
            {target}
          </Link>
        ) : (
          <a
            href={href}
            className={linkClass}
            {...(isEmail
              ? {}
              : { target: "_blank", rel: "noopener noreferrer" })}
          >
            {target}
          </a>
        )}
        {trailing}
      </Fragment>
    );
  });
}

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
                    {linkify(item.answer)}
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
