"use client";

import { useState } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Live embedded form (Tally, Google Forms, Jotform, …) in a plain bordered
 * card; the form renders the provider's own UI since it's a cross-origin
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
      <div className="overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--card-color)]/60">
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

      {/* Collection notice at the point of collection (DPDP Act s.5). */}
      <p className="mt-3 text-center text-xs text-[var(--text-secondary)]">
        This form is hosted by a third-party form service. See our{" "}
        <Link href="/privacy" className="text-[var(--accent-color)] underline underline-offset-2">
          Privacy Policy
        </Link>{" "}
        for how we use what you submit.
      </p>

      {/* Fallback for anyone whose browser blocks the embed. */}
      <p className="mt-2 text-center font-jetbrains text-xs text-[var(--text-secondary)]">
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
