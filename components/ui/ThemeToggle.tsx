"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { AngularButton } from "./AngularButton";

/**
 * "Has this hydrated yet?" as an external store rather than a mount effect.
 * React renders the server snapshot (false) for the prerendered HTML and swaps
 * to the client one (true) right after hydration — no setState in an effect,
 * which the repo's react-hooks rules reject, and no cascading render. Same
 * approach as the hash reader in InitiativesHub.
 *
 * The subscribe callback is a no-op: this value never changes again once true.
 */
const subscribeNever = () => () => {};
const getHydrated = () => true;
const getHydratedOnServer = () => false;

export interface ThemeToggleProps {
  /**
   * Renders the control inert, for pages that pin their own palette and would
   * not visibly respond to it (see lib/themeLock.ts). The caller owns this
   * decision — the toggle itself has no opinion about routes.
   */
  disabled?: boolean;
  /**
   * Shown on hover and to assistive tech in place of the usual label, so a
   * disabled control says why rather than just failing quietly.
   */
  disabledReason?: string;
  className?: string;
}

export function ThemeToggle({
  disabled = false,
  disabledReason = "Theme is fixed on this page",
  className,
}: ThemeToggleProps) {
  const { theme, setTheme, systemTheme } = useTheme();

  // next-themes knows nothing on the server, so anything rendered from its
  // state has to wait for hydration or the markup will not match.
  const hydrated = React.useSyncExternalStore(
    subscribeNever,
    getHydrated,
    getHydratedOnServer
  );

  // The visitor's own setting, which a forced page theme deliberately does not
  // overwrite. "system" is resolved so the icon shows what they actually see.
  const saved = theme === "system" ? systemTheme : theme;

  // While a page forces its theme, the icon tracks the *saved* setting rather
  // than the one temporarily applied: the button is the visitor's reassurance
  // that their choice survived, so showing a moon to someone who picked light
  // says the opposite of what is true. Everywhere else the icon is driven off
  // the `.dark` class in CSS, which needs no hydration guard and cannot flash.
  const showSaved =
    disabled && hydrated && (saved === "light" || saved === "dark");

  // Gated on `hydrated` for the same reason the icon is, and it is easy to miss:
  // this string feeds both the title attribute and the sr-only text, so reading
  // `saved` here unguarded made the server render one label and the client
  // render another — a hydration mismatch, even though the icon beside it was
  // already handled. Server and first client render must agree; the setting is
  // appended on the re-render straight after.
  const label = disabled
    ? hydrated && saved
      ? `${disabledReason}. Your saved setting: ${saved}.`
      : disabledReason
    : "Toggle theme";

  return (
    <AngularButton
      variant="outline"
      disabled={disabled}
      // Native tooltip on hover. Deliberately no `pointer-events-none` in the
      // disabled styles below, or this would never surface — a disabled button
      // already refuses clicks, so hover is the only thing left to keep.
      title={disabled ? label : undefined}
      className={cn(
        "p-2 min-h-11 min-w-11 aspect-square flex items-center justify-center",
        // AngularButton's outline variant fills on hover; that reads as "this
        // will do something", so it has to be neutralised rather than just
        // dimmed. The inner border is driven by group-hover, hence the reset.
        "disabled:cursor-not-allowed disabled:opacity-40",
        "disabled:hover:bg-transparent disabled:hover:text-[var(--text-primary)]",
        "[&:disabled_div]:opacity-50",
        className
      )}
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
    >
      {showSaved ? (
        saved === "dark" ? (
          <Moon className="h-[1.2rem] w-[1.2rem]" />
        ) : (
          <Sun className="h-[1.2rem] w-[1.2rem]" />
        )
      ) : (
        <>
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </>
      )}
      <span className="sr-only">{label}</span>
    </AngularButton>
  );
}
