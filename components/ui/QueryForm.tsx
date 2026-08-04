"use client";

import { useState, type FormEvent } from "react";
import { ChevronDown, Send, CheckCircle2 } from "lucide-react";
import { AngularButton } from "@/components/ui/AngularButton";

const CATEGORIES = ["Membership", "Events", "Sponsorship", "Other"] as const;

// Shared field styling: dark-tech input with a theme-aware glowing focus ring.
// The ring alpha + soft glow use --border-active, so it's cyan in dark mode and
// orange in light, matching the rest of the site.
const fieldClass =
  "w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-color)]/50 px-4 py-3 font-inter text-sm text-[var(--text-primary)] outline-none transition duration-300 placeholder:text-[var(--text-secondary)]/60 focus:border-[var(--border-active)] focus:ring-2 focus:ring-[var(--border-active)]/35 focus:shadow-[0_0_22px_-6px_var(--border-active)]";

const labelClass =
  "mb-2 block font-jetbrains text-xs font-medium uppercase tracking-widest text-[var(--text-secondary)]";

export function QueryForm() {
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Mock submission — no backend yet.
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    console.log("[Support Query]", data);
    e.currentTarget.reset();
    setSent(true);
    window.setTimeout(() => setSent(false), 4000);
  };

  return (
    <div className="relative">
      {/* Ambient accent glow behind the card. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-4 -z-10 rounded-[2rem] opacity-20 blur-3xl"
        style={{ background: "var(--border-active)" }}
      />

      <form
        onSubmit={handleSubmit}
        className="relative overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--card-color)]/60 p-6 backdrop-blur-md md:p-8"
      >
        {/* Name */}
        <div className="mb-5">
          <label htmlFor="q-name" className={labelClass}>
            Name
          </label>
          <input
            id="q-name"
            name="name"
            type="text"
            required
            placeholder="Ada Lovelace"
            className={fieldClass}
          />
        </div>

        {/* Email */}
        <div className="mb-5">
          <label htmlFor="q-email" className={labelClass}>
            Email
          </label>
          <input
            id="q-email"
            name="email"
            type="email"
            required
            placeholder="you@rait.ac.in"
            className={fieldClass}
          />
        </div>

        {/* Category */}
        <div className="mb-5">
          <label htmlFor="q-category" className={labelClass}>
            Query Category
          </label>
          <div className="relative">
            <select
              id="q-category"
              name="category"
              required
              defaultValue=""
              className={`${fieldClass} appearance-none pr-11`}
            >
              <option value="" disabled>
                Select a category…
              </option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c} className="bg-[var(--card-color)] text-[var(--text-primary)]">
                  {c}
                </option>
              ))}
            </select>
            <ChevronDown
              aria-hidden
              className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--accent-color)]"
            />
          </div>
        </div>

        {/* Message */}
        <div className="mb-6">
          <label htmlFor="q-message" className={labelClass}>
            Message
          </label>
          <textarea
            id="q-message"
            name="message"
            required
            rows={6}
            placeholder="Tell us how we can help…"
            className={`${fieldClass} min-h-[160px] resize-y`}
          />
        </div>

        <AngularButton
          type="submit"
          variant="primary"
          className="w-full shadow-[0_0_24px_-4px_var(--accent-color)] transition-shadow duration-300 hover:shadow-[0_0_34px_-2px_var(--accent-color)]"
        >
          <Send className="h-4 w-4" />
          Transmit Query
        </AngularButton>

        {/* Mock confirmation */}
        {sent && (
          <p
            role="status"
            className="mt-4 flex items-center justify-center gap-2 font-jetbrains text-sm text-[var(--border-active)] [text-shadow:0_0_16px_var(--border-active)]"
          >
            <CheckCircle2 className="h-4 w-4" />
            Query transmitted — we&apos;ll be in touch.
          </p>
        )}
      </form>
    </div>
  );
}
