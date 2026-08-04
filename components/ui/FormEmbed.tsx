"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Live embedded form (Tally, Google Forms, Jotform, …) inside a themed "mini
 * browser" frame. The chrome (window dots, address bar, ambient glow) matches
 * the site; the form renders the provider's own UI since it's a cross-origin
 * iframe. For Tally, set a transparent/dark theme in the form's own settings and
 * it'll blend with this frame. Google Forms links get `embedded=true` appended.
 */

function toEmbedUrl(url: string): string {
  try {
    const u = new URL(url);
    // `embedded=true` is a Google Forms flag; leave other providers (Tally,
    // Jotform, …) untouched so the same frame works for any embed URL.
    if (u.hostname.endsWith("docs.google.com")) {
      u.searchParams.set("embedded", "true");
    }
    return u.toString();
  } catch {
    return url;
  }
}

function hostLabel(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return "";
  }
}

interface FormEmbedProps {
  /** Public share/embed link for the form. */
  url: string;
  title?: string;
  className?: string;
}

export function FormEmbed({
  url,
  title = "ISA RAIT query form",
  className,
}: FormEmbedProps) {
  const [loaded, setLoaded] = useState(false);
  const src = toEmbedUrl(url);

  return (
    <div className={cn("relative", className)}>
      {/* ambient accent glow behind the frame */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-4 -z-10 rounded-[2rem] opacity-20 blur-3xl"
        style={{ background: "var(--border-active)" }}
      />

      <div className="overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--card-color)]/60 backdrop-blur-md">
        {/* faux browser chrome */}
        <div className="flex items-center gap-3 border-b border-[var(--border-color)] px-4 py-2.5">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 bg-red-500 clip-angular" />
            <span className="h-3 w-3 bg-yellow-500 clip-angular" />
            <span className="h-3 w-3 bg-green-500 clip-angular" />
          </div>
          <div className="min-w-0 flex-1 truncate rounded-md border border-[var(--border-color)] bg-[var(--bg-color)]/60 px-3 py-1 text-center font-jetbrains text-[11px] text-[var(--text-secondary)]">
            {hostLabel(url)}/…
          </div>
        </div>

        {/* form viewport */}
        <div className="relative h-[70vh] min-h-[540px] w-full">
          {!loaded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-[var(--text-secondary)]">
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--border-color)] border-t-[var(--border-active)]" />
              <span className="font-jetbrains text-xs uppercase tracking-widest">
                Loading form…
              </span>
            </div>
          )}
          <iframe
            src={src}
            title={title}
            loading="lazy"
            onLoad={() => setLoaded(true)}
            className={cn(
              "h-full w-full transition-opacity duration-500",
              loaded ? "opacity-100" : "opacity-0"
            )}
          >
            Loading…
          </iframe>
        </div>
      </div>

      {/* Fallback for anyone whose browser blocks the embed. */}
      <p className="mt-3 text-center font-jetbrains text-xs text-[var(--text-secondary)]">
        Form not loading?{" "}
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[var(--accent-color)] underline underline-offset-2 hover:text-[var(--border-active)]"
        >
          Open it in a new tab
          <ExternalLink className="h-3 w-3" />
        </a>
      </p>
    </div>
  );
}
