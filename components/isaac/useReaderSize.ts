"use client";

import { useSyncExternalStore } from "react";
import { ISAAC_PAGE_ASPECT } from "@/lib/isaac";

/**
 * Paper dimensions for the open reader, derived from the viewport.
 *
 * A resize listener feeding useState would set state from an effect, which
 * React 19's react-hooks/set-state-in-effect rule rejects — and which flashes
 * a wrong size for one frame besides. useSyncExternalStore subscribes to the
 * resize event directly and is the supported shape for reading a browser value
 * that changes over time.
 */

/** Below this the two-page spread is too narrow to read, so we show one page. */
const SPREAD_MIN_WIDTH = 768;

/** Vertical room taken by the reader's chrome: the close button and the bar. */
const CHROME_Y = 148;

/**
 * Horizontal room kept clear as page margin. The turn controls live in the
 * bottom bar rather than down the sides, so this is breathing room and nothing
 * else — which is what lets a phone give the sheet almost the full width.
 */
const CHROME_X_SPREAD = 96;
const CHROME_X_SINGLE = 48;

export type ReaderSize = {
  /** Width of one page, in CSS pixels. */
  pageW: number;
  /** Height of one page, in CSS pixels. */
  pageH: number;
  /** True when there is room to show a real two-page spread. */
  spread: boolean;
  /** False until the first client measurement — nothing should paint before. */
  measured: boolean;
};

function subscribe(onChange: () => void): () => void {
  window.addEventListener("resize", onChange);
  window.addEventListener("orientationchange", onChange);
  return () => {
    window.removeEventListener("resize", onChange);
    window.removeEventListener("orientationchange", onChange);
  };
}

function getSnapshot(): string {
  return `${window.innerWidth}x${window.innerHeight}`;
}

/** The server has no viewport; the sentinel makes `measured` false there. */
function getServerSnapshot(): string {
  return "0x0";
}

export function useReaderSize(): ReaderSize {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [vw, vh] = snapshot.split("x").map(Number);

  if (!vw || !vh) {
    return { pageW: 0, pageH: 0, spread: true, measured: false };
  }

  const spread = vw >= SPREAD_MIN_WIDTH;
  const availableH = Math.max(240, vh - CHROME_Y);
  const availableW = Math.max(
    200,
    vw - (spread ? CHROME_X_SPREAD : CHROME_X_SINGLE)
  );

  // Start from the tallest page that fits, then shrink if the resulting spread
  // is wider than the room across. Height-first is the right order: a magazine
  // is read at whatever size makes the type legible, and that tracks height.
  let pageH = availableH;
  let pageW = pageH * ISAAC_PAGE_ASPECT;

  const maxPageW = spread ? availableW / 2 : availableW;
  if (pageW > maxPageW) {
    pageW = maxPageW;
    pageH = pageW / ISAAC_PAGE_ASPECT;
  }

  return {
    pageW: Math.round(pageW),
    pageH: Math.round(pageH),
    spread,
    measured: true,
  };
}
