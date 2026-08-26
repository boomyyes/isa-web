"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Subscribe to a CSS media query from React.
 *
 * Read through useSyncExternalStore rather than an effect: the server has no
 * idea how wide the screen is, so React renders the prerendered HTML with the
 * server snapshot (always false — the small-screen case) and swaps in the real
 * answer immediately after hydration. That avoids both a mismatch and the
 * setState-in-effect cascade the lint config rejects.
 *
 * Use this only to gate things that are genuinely optional, like the hero's 3D
 * scene. Anything that must be in the prerendered HTML should be laid out with
 * a CSS media query instead, so it is correct before JS ever runs.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onStoreChange);
      return () => list.removeEventListener("change", onStoreChange);
    },
    [query]
  );

  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query]);

  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
