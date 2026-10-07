"use client";

// Modelled on the GOV.UK Design System cookie banner, in its essential-only
// form: the site sets no optional cookies, so there is nothing to accept or
// reject, only a message to hide. Dismissal is remembered in this browser.

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { COOKIE_NOTICE_KEY as KEY } from "@/lib/cookieNotice";

const noop = () => () => {};
const dismissedBefore = () => {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
};

export function CookieNotice() {
  // The server renders it visible, so a first visit paints it with the page
  // rather than after hydration (it was the LCP element on short pages, at
  // 4.3s). Returning visitors are covered by COOKIE_NOTICE_SCRIPT (lib/cookieNotice.ts).
  const stored = useSyncExternalStore(noop, dismissedBefore, () => false);
  const [hidden, setHidden] = useState(false);

  if (stored || hidden) return null;

  const hide = () => {
    setHidden(true);
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      // Storage blocked: the message just comes back next visit.
    }
  };

  return (
    <section
      role="region"
      aria-label="Cookie notice"
      data-cookie-notice
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--border-color)] bg-[var(--card-color)]/95 backdrop-blur"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="text-sm leading-relaxed">
          <h2 className="font-jetbrains text-sm font-bold text-[var(--text-primary)]">Cookies on isarait.in</h2>
          <p className="mt-1 text-[var(--text-secondary)]">
            We use some essential cookies to make this site work. We don&apos;t use analytics or advertising cookies.
            Forms embedded from other providers may set their own.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-4">
          <button
            type="button"
            onClick={hide}
            className="rounded-lg bg-[var(--accent-color)] px-4 py-2 text-sm font-semibold text-[var(--bg-color)] transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-color)]"
          >
            Hide cookie message
          </button>
          <Link href="/privacy#cookies" className="text-sm text-[var(--accent-color)] underline underline-offset-2">
            View cookies
          </Link>
        </div>
      </div>
    </section>
  );
}
