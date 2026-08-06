// Shared form field styling.
//
// Extracted from QueryForm so the certificate lookup uses the same inputs rather
// than a second, drifting copy. The ring alpha + soft glow use --border-active,
// so it's cyan in dark mode and orange in light, matching the rest of the site.

export const fieldClass =
  "w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-color)]/50 px-4 py-3 font-inter text-sm text-[var(--text-primary)] outline-none transition duration-300 placeholder:text-[var(--text-secondary)]/60 focus:border-[var(--border-active)] focus:ring-2 focus:ring-[var(--border-active)]/35 focus:shadow-[0_0_22px_-6px_var(--border-active)]";

export const labelClass =
  "mb-2 block font-jetbrains text-xs font-medium uppercase tracking-widest text-[var(--text-secondary)]";
