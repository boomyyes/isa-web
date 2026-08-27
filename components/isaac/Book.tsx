"use client";

import { useEffect } from "react";
import {
  animate,
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";
import { BookPage } from "./BookPage";

/*
 * The book itself: a stack of leaves hinged on a shared spine.
 *
 * Leaf i carries two pages — 2i on its front (which faces right, unturned) and
 * 2i+1 on its back (which faces left, once turned). Every leaf is positioned on
 * the right half of the spread with `transform-origin: left center`, so turning
 * one is a single rotateY from 0deg to -180deg and it lands, mirrored, on the
 * left half. That is the whole trick; everything else here is stacking order
 * and shading.
 *
 * Below `spread` the two-page layout is too narrow to read type at, so the same
 * page sequence renders one sheet at a time with a lighter hinge animation.
 */

export const TURN_DURATION = 0.75;

/** Leaves this far from the current spread do not fetch their images. */
const PRELOAD_RADIUS = 2;

type BookProps = {
  /** 0-based index of the right-hand page (or, unspread, the only page). */
  page: number;
  pageCount: number;
  pageW: number;
  pageH: number;
  spread: boolean;
  /** Leaf most recently turned — it must sit above the rest of the stack. */
  lastTurned: number | null;
  /** 1 forward, -1 back. Only used to pick a direction unspread. */
  direction: 1 | -1;
  onNext: () => void;
  onPrev: () => void;
};

export function Book({
  page,
  pageCount,
  pageW,
  pageH,
  spread,
  lastTurned,
  direction,
  onNext,
  onPrev,
}: BookProps) {
  const leafCount = Math.ceil(pageCount / 2);
  const flipped = Math.min(Math.floor(page / 2), leafCount);

  if (!spread) {
    return (
      <SinglePage
        page={Math.min(page, pageCount - 1)}
        pageCount={pageCount}
        pageW={pageW}
        pageH={pageH}
        direction={direction}
        onNext={onNext}
        onPrev={onPrev}
      />
    );
  }

  // A closed book should sit in the middle of the screen, not off to the right
  // of the spine — and the same once every leaf has been turned to the left.
  // Shifting the whole stack by half a page keeps whatever is actually visible
  // centred, and animating it is the "book opening out" beat.
  const shift = flipped === 0 ? -pageW / 2 : flipped === leafCount ? pageW / 2 : 0;

  return (
    <div
      className="relative"
      style={{ width: pageW * 2, height: pageH, perspective: pageH * 2.2 }}
    >
      <motion.div
        className="absolute inset-0"
        animate={{ x: shift }}
        transition={{ duration: TURN_DURATION, ease: [0.65, 0, 0.35, 1] }}
        // Without this the x transform above would flatten the leaves' 3D and
        // the turn would collapse into a horizontal squash.
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Spine shadow, painted on the board under the stack. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-1/2 w-6 -translate-x-1/2 bg-black/40 blur-md"
        />

        {Array.from({ length: leafCount }, (_, i) => (
          <Leaf
            key={i}
            index={i}
            flipped={i < flipped}
            leafCount={leafCount}
            lastTurned={lastTurned}
            distance={Math.abs(i - flipped)}
            pageCount={pageCount}
            pageW={pageW}
            pageH={pageH}
            onNext={onNext}
            onPrev={onPrev}
          />
        ))}
      </motion.div>
    </div>
  );
}

type LeafProps = {
  index: number;
  flipped: boolean;
  leafCount: number;
  lastTurned: number | null;
  distance: number;
  pageCount: number;
  pageW: number;
  pageH: number;
  onNext: () => void;
  onPrev: () => void;
};

function Leaf({
  index,
  flipped,
  leafCount,
  lastTurned,
  distance,
  pageCount,
  pageW,
  pageH,
  onNext,
  onPrev,
}: LeafProps) {
  const reduced = useReducedMotion();

  // Driven by hand rather than through `animate={{ rotateY }}` so the shading
  // below can read the live angle: a page is darkest edge-on, halfway through
  // its turn, which is what sells the paper as paper.
  const rotateY = useMotionValue(flipped ? -180 : 0);
  const shade = useTransform(rotateY, [0, -90, -180], [0, 0.45, 0]);

  useEffect(() => {
    const target = flipped ? -180 : 0;
    if (reduced) {
      rotateY.set(target);
      return;
    }
    const controls = animate(rotateY, target, {
      duration: TURN_DURATION,
      ease: [0.65, 0, 0.35, 1],
    });
    return () => controls.stop();
  }, [flipped, reduced, rotateY]);

  // Unturned leaves stack front-to-back from the spine, turned ones the other
  // way round, so in both directions the sheet you are looking at is on top.
  // The leaf that moved most recently outranks both: mid-turn it sweeps across
  // the whole spread and must not clip through the stack it is leaving.
  const zIndex =
    index === lastTurned ? leafCount + 2 : flipped ? index + 1 : leafCount - index;

  const loadImage = distance <= PRELOAD_RADIUS;

  return (
    <motion.div
      className="absolute top-0 left-1/2"
      style={{
        width: pageW,
        height: pageH,
        rotateY,
        zIndex,
        transformStyle: "preserve-3d",
        transformOrigin: "left center",
      }}
    >
      {/* Front — page 2i, the right-hand sheet. Clicking it turns forward. */}
      <Face onClick={onNext} label="Next page" active={!flipped}>
        <BookPage
          index={index * 2}
          pageCount={pageCount}
          side="right"
          loadImage={loadImage}
          pageW={pageW}
          priority={index === 0}
        />
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-black"
          style={{ opacity: shade }}
        />
      </Face>

      {/* Back — page 2i+1, the left-hand sheet. Clicking it turns back. */}
      <Face
        onClick={onPrev}
        label="Previous page"
        active={flipped}
        style={{ transform: "rotateY(180deg)" }}
      >
        <BookPage
          index={index * 2 + 1}
          pageCount={pageCount}
          side="left"
          loadImage={loadImage}
          pageW={pageW}
        />
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-black"
          style={{ opacity: shade }}
        />
      </Face>
    </motion.div>
  );
}

/**
 * One side of a leaf. A button so a mouse can turn pages by clicking the paper,
 * but `tabIndex={-1}`: the reader's own arrows and the left/right keys are the
 * accessible controls, and tabbing through two buttons per leaf would bury them.
 *
 * `active` is what decides whether this side answers clicks, and it has to be
 * stated explicitly: `backface-visibility: hidden` governs painting, not hit
 * testing. A turned leaf's front face is invisible but still takes the click —
 * so clicking the left-hand page turned the page *forward*, because the sheet
 * you were looking at was the back of a leaf whose front was intercepting.
 */
function Face({
  onClick,
  label,
  active,
  style,
  children,
}: {
  onClick: () => void;
  label: string;
  active: boolean;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      tabIndex={-1}
      aria-hidden={!active}
      aria-label={label}
      onClick={onClick}
      className="absolute inset-0 cursor-pointer appearance-none"
      style={{
        backfaceVisibility: "hidden",
        WebkitBackfaceVisibility: "hidden",
        pointerEvents: active ? "auto" : "none",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------------- *
 * Narrow screens: one sheet at a time.
 * ------------------------------------------------------------------------- */

const singleVariants = {
  enter: (d: 1 | -1) => ({ rotateY: d > 0 ? 70 : -70, opacity: 0 }),
  center: { rotateY: 0, opacity: 1 },
  exit: (d: 1 | -1) => ({ rotateY: d > 0 ? -70 : 70, opacity: 0 }),
};

function SinglePage({
  page,
  pageCount,
  pageW,
  pageH,
  direction,
  onNext,
  onPrev,
}: {
  page: number;
  pageCount: number;
  pageW: number;
  pageH: number;
  direction: 1 | -1;
  onNext: () => void;
  onPrev: () => void;
}) {
  return (
    <div
      className="relative"
      style={{ width: pageW, height: pageH, perspective: pageH * 2.2 }}
    >
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={page}
          custom={direction}
          variants={singleVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.42, ease: [0.65, 0, 0.35, 1] }}
          className="absolute inset-0"
          style={{ transformOrigin: direction > 0 ? "left center" : "right center" }}
        >
          {/* Halves of the sheet turn in the direction they are nearest to,
              matching the spread's click zones. */}
          <button
            type="button"
            tabIndex={-1}
            aria-label="Previous page"
            onClick={onPrev}
            className="absolute inset-y-0 left-0 z-20 w-1/3 cursor-pointer appearance-none"
          />
          <button
            type="button"
            tabIndex={-1}
            aria-label="Next page"
            onClick={onNext}
            className="absolute inset-y-0 right-0 z-20 w-2/3 cursor-pointer appearance-none"
          />
          <BookPage
            index={page}
            pageCount={pageCount}
            side="right"
            loadImage
            pageW={pageW}
            priority={page === 0}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
