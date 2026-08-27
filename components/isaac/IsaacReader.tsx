"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Book } from "./Book";
import { useReaderSize } from "./useReaderSize";
import { cn } from "@/lib/utils";

/**
 * Full-screen ISAAC magazine reader.
 *
 * Rendered into document.body rather than in place: the spotlight card sits
 * inside `<div className="relative z-10">` in the root layout, which is a
 * stacking context, so nothing rendered under it can paint above the z-50
 * navbar no matter what z-index it asks for. A portal escapes that.
 */

/** Where on screen the magazine cover was when it was clicked. */
export type ReaderOrigin = {
  cx: number;
  cy: number;
  width: number;
  height: number;
};

type IsaacReaderProps = {
  open: boolean;
  onClose: () => void;
  pageCount: number;
  origin: ReaderOrigin | null;
};

/**
 * createPortal needs a real document, so nothing may render on the server pass
 * or the first client one. Same useSyncExternalStore hydration guard the theme
 * toggle uses — a boolean flipped from an effect would be a set-state-in-effect.
 */
const subscribeNever = () => () => {};
const getMounted = () => true;
const getMountedOnServer = () => false;

export function IsaacReader({ open, onClose, pageCount, origin }: IsaacReaderProps) {
  const mounted = useSyncExternalStore(subscribeNever, getMounted, getMountedOnServer);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <ReaderOverlay onClose={onClose} pageCount={pageCount} origin={origin} />
      ) : null}
    </AnimatePresence>,
    document.body
  );
}

function ReaderOverlay({
  onClose,
  pageCount,
  origin,
}: {
  onClose: () => void;
  pageCount: number;
  origin: ReaderOrigin | null;
}) {
  const { pageW, pageH, spread, measured } = useReaderSize();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // `page` is the index of the right-hand sheet in the spread, and of the only
  // sheet when unspread — one number that survives crossing the breakpoint.
  const [page, setPage] = useState(0);
  const [lastTurned, setLastTurned] = useState<number | null>(null);
  const [direction, setDirection] = useState<1 | -1>(1);

  const step = spread ? 2 : 1;

  // Crossing the breakpoint can leave `page` on an odd sheet, which a spread
  // cannot show on its right-hand side. Snapping down to the leaf it belongs to
  // is what keeps one piece of state valid in both layouts.
  const current = spread ? Math.floor(page / 2) * 2 : page;

  // The last position worth turning to is the one that still shows a real
  // sheet: page-1 lands on the right when the count is odd, and on the left —
  // one step further along — when it is even. Stopping here is what keeps the
  // reader off the blank back of the final leaf.
  const maxPage = spread
    ? pageCount % 2 === 0
      ? pageCount
      : pageCount - 1
    : pageCount - 1;

  const canNext = current + step <= maxPage;
  const canPrev = current - step >= 0;

  // Plain assignments rather than an updater: a setState updater has to be
  // pure, so the sibling state cannot be set from inside one.
  const next = useCallback(() => {
    if (current + step > maxPage) return;
    setLastTurned(Math.floor(current / 2));
    setDirection(1);
    setPage(current + step);
  }, [current, maxPage, step]);

  const prev = useCallback(() => {
    if (current - step < 0) return;
    setLastTurned(Math.floor(current / 2) - 1);
    setDirection(-1);
    setPage(current - step);
  }, [current, step]);

  // Escape closes; the arrow keys turn pages. Bound to the window rather than
  // the dialog so it works before anything inside has been focused.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      } else if (event.key === "ArrowRight" || event.key === "PageDown") {
        event.preventDefault();
        next();
      } else if (event.key === "ArrowLeft" || event.key === "PageUp") {
        event.preventDefault();
        prev();
      } else if (event.key === "Home") {
        event.preventDefault();
        setDirection(-1);
        setLastTurned(null);
        setPage(0);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [next, onClose, prev]);

  // Freeze the page behind the reader. Restoring the previous inline values
  // rather than clearing them keeps this from stomping any other lock.
  useEffect(() => {
    const { body } = document;
    const previousOverflow = body.style.overflow;
    const previousPadding = body.style.paddingRight;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;

    body.style.overflow = "hidden";
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;

    return () => {
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPadding;
    };
  }, []);

  // Move focus into the dialog on open and hand it back to whatever had it —
  // the spotlight cover — on close.
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    return () => previous?.focus?.();
  }, []);

  // Keep Tab inside the dialog. Only the chrome is tabbable, so this is a
  // three-stop loop rather than a general-purpose trap.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || !dialogRef.current) return;
      const stops = dialogRef.current.querySelectorAll<HTMLElement>(
        "button:not([tabindex='-1']):not([disabled]), a[href]"
      );
      if (stops.length === 0) return;

      const first = stops[0];
      const last = stops[stops.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // The opening beat: the book starts as the cover did, in the card, and grows
  // to the middle of the screen. The chrome is absolutely positioned so the
  // book area really is centred on the viewport, which is what lets these
  // offsets be plain arithmetic instead of a measured rect.
  const fromCover = useMemo(() => {
    if (!origin || !measured || pageH === 0) {
      return { x: 0, y: 0, scale: 0.92 };
    }
    return {
      x: origin.cx - window.innerWidth / 2,
      y: origin.cy - window.innerHeight / 2,
      scale: origin.height / pageH,
    };
  }, [measured, origin, pageH]);

  const leftPage = spread ? current - 1 : current;
  const rightPage = current;

  return (
    <motion.div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label="ISAAC magazine reader"
      className="fixed inset-0 z-[100] flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.28 }}
    >
      {/* The blur is the whole point of the backdrop: it is what pushes the rest
          of the home page back. A button so a click anywhere off the book
          closes, and so screen readers get the escape hatch too. */}
      <button
        type="button"
        aria-label="Close the magazine"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-zoom-out bg-black/70 backdrop-blur-xl"
      />

      {measured ? (
        <motion.div
          className="relative"
          initial={{ opacity: 0, ...fromCover }}
          animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
          exit={{ opacity: 0, ...fromCover }}
          transition={{ duration: 0.55, ease: [0.33, 1, 0.68, 1] }}
        >
          <Book
            page={current}
            pageCount={pageCount}
            pageW={pageW}
            pageH={pageH}
            spread={spread}
            lastTurned={lastTurned}
            direction={direction}
            onNext={next}
            onPrev={prev}
          />
        </motion.div>
      ) : null}

      {/* ---- chrome ---------------------------------------------------- */}

      <ReaderButton
        ref={closeRef}
        onClick={onClose}
        label="Close the magazine"
        className="absolute top-4 right-4 sm:top-6 sm:right-6"
      >
        <X className="h-5 w-5" />
      </ReaderButton>

      {/* One bar for both layouts. Keeping the turn controls out of the side
          margins is what lets a phone give the sheet nearly the full width,
          and it means there is a single set of focusable stops to trap. */}
      <div className="absolute inset-x-0 bottom-4 flex justify-center px-4 sm:bottom-6">
        <div className="flex items-center gap-1 rounded-full border border-white/15 bg-black/60 p-1 backdrop-blur-md">
          <ReaderButton onClick={prev} disabled={!canPrev} label="Previous page">
            <ChevronLeft className="h-5 w-5" />
          </ReaderButton>

          <p className="min-w-28 px-2 text-center font-jetbrains text-xs tracking-widest text-white/80">
            {formatCounter(leftPage, rightPage, pageCount, spread)}
          </p>

          <ReaderButton onClick={next} disabled={!canNext} label="Next page">
            <ChevronRight className="h-5 w-5" />
          </ReaderButton>
        </div>
      </div>

    </motion.div>
  );
}

/** "COVER" / "2 – 3 / 24". 1-based for readers, 0-based everywhere else. */
function formatCounter(
  leftPage: number,
  rightPage: number,
  pageCount: number,
  spread: boolean
): string {
  if (!spread) return `${rightPage + 1} / ${pageCount}`;

  const left = leftPage >= 0 && leftPage < pageCount ? leftPage + 1 : null;
  const right = rightPage >= 0 && rightPage < pageCount ? rightPage + 1 : null;

  if (left === null && right === 1) return `COVER / ${pageCount}`;
  if (left === null) return `${right} / ${pageCount}`;
  if (right === null) return `${left} / ${pageCount}`;
  return `${left} – ${right} / ${pageCount}`;
}

function ReaderButton({
  ref,
  onClick,
  label,
  disabled = false,
  className,
  children,
}: {
  ref?: React.Ref<HTMLButtonElement>;
  onClick: () => void;
  label: string;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        "z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full",
        "border border-white/20 bg-black/55 text-white/85 backdrop-blur-sm",
        "transition hover:border-white/50 hover:bg-black/75 hover:text-white",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
        // Kept in the layout when unavailable — the bar must not resize as you
        // turn the first and last pages.
        "disabled:pointer-events-none disabled:opacity-25",
        className
      )}
    >
      {children}
    </button>
  );
}
