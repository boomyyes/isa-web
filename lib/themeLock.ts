/**
 * Routes that pin the site chrome to one theme.
 *
 * A page like /artemis paints its own palette through the `.artemis` scope in
 * globals.css, but the navbar and footer sit *outside* that scope and would
 * still follow the visitor's light/dark choice — a pale navbar floating over a
 * night sky. Forcing the theme for the duration of the page keeps the chrome in
 * step with the content.
 *
 * This is handed to next-themes' `forcedTheme`, which overrides the applied
 * theme **without writing to the stored preference**. So there is nothing to
 * save and restore: a visitor who arrives in light mode is still in light mode
 * the moment they navigate away, because their setting was never changed in the
 * first place. The toggle is disabled while here only because it would appear
 * to do nothing — see components/ui/ThemeToggle.tsx.
 *
 * Matched by prefix, so nested routes under a locked path inherit the lock.
 */
export interface ThemeLock {
  /** Path prefix; `/artemis` also covers `/artemis/anything`. */
  prefix: string;
  /** The theme to pin the chrome to while on this route. */
  theme: "dark" | "light";
  /** Surfaced on the disabled toggle, as a tooltip and to assistive tech. */
  reason: string;
}

export const THEME_LOCKS: ThemeLock[] = [
  {
    prefix: "/artemis",
    theme: "dark",
    reason: "Artemis is always dark — your theme is restored when you leave",
  },
];

/**
 * The lock covering `pathname`, or undefined where the visitor's own theme
 * applies. Both the provider and the navbar call this, so the forced theme and
 * the disabled toggle can never disagree about which pages are locked.
 */
export function themeLockFor(pathname: string | null): ThemeLock | undefined {
  if (!pathname) return undefined;
  return THEME_LOCKS.find(
    (lock) => pathname === lock.prefix || pathname.startsWith(lock.prefix + "/")
  );
}
