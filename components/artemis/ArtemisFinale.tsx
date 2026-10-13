"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { animate, eases, spring, stagger } from "animejs";
import { ChevronDown } from "lucide-react";
import { CrescentBow, MeanderDivider, StarGlyph } from "@/components/artemis/GreekOrnaments";
import { drawOnScroll, enterOnce, revealOnScroll, unrollOnScroll } from "@/components/artemis/reveal";
import { scrollToId } from "@/components/artemis/scrollToSection";
import { ARTEMIS_CARD_SHADOW } from "@/components/artemis/tokens";
import { ARTEMIS_EASE, prefersReducedMotion, useArtemisAnime } from "@/components/artemis/useArtemisAnime";
import { EPILOGUE, FINALE } from "@/lib/artemis";

/** Rays thrown off the button when it is pressed. */
const RAYS = 18;
const CHRONICLE_ID = "chronicle";

/**
 * What /artemis opens on now that the hunt is over: the epilogue, a promise of
 * next year, and one button that lays the rest of the page back open.
 *
 * The rest of the page arrives as `children` and is only mounted once opened,
 * so every section's scroll reveals are created against a page that actually
 * contains them, and play as the visitor scrolls down into the chronicle.
 *
 * A link straight to a section (/artemis#trial-i, #odyssey…) opens the chronicle
 * on arrival, without the flourish, and lands on that section.
 */
export function ArtemisFinale({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [bursting, setBursting] = useState(false);
  const burst = useRef<HTMLDivElement>(null);
  const flash = useRef<HTMLDivElement>(null);
  const chronicle = useRef<HTMLDivElement>(null);
  const arrivedViaHash = useRef(false);

  const root = useArtemisAnime<HTMLElement>((self) => {
    const el = self.root as HTMLElement;

    revealOnScroll("[data-finale-eyebrow]", { y: 14, duration: 460 });
    animate("[data-finale-mark] rect", {
      opacity: [0, 0.85],
      duration: 520,
      ease: spring({ stiffness: 90, damping: 14 }),
      autoplay: enterOnce(),
    });
    drawOnScroll(el.querySelector("[data-finale-mark]"), "path", { duration: 620, each: 90, delay: 120 });
    unrollOnScroll("[data-finale-rule]", { each: 380, delay: 160 });
    // A plain rise, not word by word: splitting the gilt heading into words
    // puts each on its own layer, and background-clip: text does not survive it.
    revealOnScroll("[data-finale-heading]", { y: 30, delay: 220 });
    revealOnScroll("[data-finale-body] > p", { y: 26, delay: 320, each: 70 });
    revealOnScroll("[data-finale-signature]", { y: 18, delay: 460 });
    revealOnScroll("[data-finale-return]", { y: 34, delay: 560, duration: 640 });
    revealOnScroll("[data-finale-cta]", { y: 24, delay: 720 });
  });

  // Deep links: open straight away and let the effect below do the landing.
  // The hash is only readable on the client, so this can't be the initial state
  // without a hydration mismatch; it opens a frame after mounting instead.
  // A hash changed in place (a pasted link, an in-page anchor) opens it the same way.
  useEffect(() => {
    const openForHash = () => {
      if (window.location.hash.length <= 1) return;
      arrivedViaHash.current = true;
      setOpen(true);
    };
    const frame = requestAnimationFrame(openForHash);
    window.addEventListener("hashchange", openForHash);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("hashchange", openForHash);
    };
  }, []);

  // Once the chronicle is in the DOM: fade it up, then take the visitor to it
  // (or to the section their link named).
  useEffect(() => {
    if (!open) return;
    const hash = window.location.hash.slice(1);
    const target = arrivedViaHash.current && hash ? hash : CHRONICLE_ID;

    if (!prefersReducedMotion() && chronicle.current && !arrivedViaHash.current) {
      animate(chronicle.current, { opacity: [0, 1], duration: 700, ease: ARTEMIS_EASE });
    }
    // A frame for the sections to lay out before measuring where to go.
    const frame = requestAnimationFrame(() => {
      if (arrivedViaHash.current) {
        document.getElementById(target)?.scrollIntoView();
      } else {
        scrollToId(target);
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [open]);

  function relive() {
    if (open || bursting) return;
    if (prefersReducedMotion() || !burst.current) {
      setOpen(true);
      return;
    }
    setBursting(true);

    const rings = burst.current.querySelectorAll("[data-burst-ring]");
    const rays = burst.current.querySelectorAll("[data-burst-ray]");
    const button = burst.current.querySelector("[data-burst-button]");

    // The press: a quick swell and settle, as a bowstring is drawn and loosed.
    animate(button!, {
      scale: [1, 1.12, 0.96, 1],
      duration: 620,
      ease: eases.out(3),
    });
    // Moonlight rings spreading out from the button.
    animate(rings, {
      scale: [0.4, 7],
      opacity: [0.9, 0],
      duration: 1100,
      delay: stagger(140),
      ease: eases.out(3),
    });
    // Arrows of light thrown outward in every direction.
    animate(rays, {
      scaleX: [0, 1, 0.2],
      translateX: [0, 170],
      opacity: [1, 1, 0],
      duration: 900,
      delay: stagger(18, { from: "random" }),
      ease: eases.out(2),
    });
    // A wash of gold over the whole sky.
    if (flash.current) {
      animate(flash.current, {
        opacity: [0, 0.32, 0],
        duration: 900,
        delay: 120,
        ease: eases.inOut(2),
      });
    }

    window.setTimeout(() => {
      setOpen(true);
      setBursting(false);
    }, 680);
  }

  return (
    <>
      <section
        ref={root}
        className="relative mx-auto flex min-h-[100svh] max-w-3xl flex-col items-center justify-center px-6 pb-20 pt-32 text-center md:pt-36"
      >
        <p
          data-finale-eyebrow
          data-reveal
          className="flex items-center gap-3 font-cinzel text-[0.68rem] font-semibold uppercase tracking-[0.45em] text-[var(--artemis-gold-light)]"
        >
          <StarGlyph className="animate-artemis-twinkle h-2 w-2" />
          {FINALE.eyebrow}
          <StarGlyph className="animate-artemis-twinkle h-2 w-2" />
        </p>

        <span data-finale-mark data-draw className="mt-8 block">
          <CrescentBow maskId="artemis-finale-crescent" className="h-20 w-20 text-[var(--artemis-gold)]" />
        </span>

        <div data-finale-rule data-unroll className="mt-6 w-full">
          <MeanderDivider className="text-[var(--artemis-gold)] opacity-60" />
        </div>

        <h1
          data-finale-heading
          data-reveal
          className="artemis-gilt mt-8 font-cinzel text-4xl font-bold uppercase tracking-[0.28em] sm:text-5xl"
        >
          {EPILOGUE.heading}
        </h1>

        <div
          data-finale-body
          className="mt-6 space-y-4 font-cormorant text-lg leading-relaxed text-[var(--text-secondary)] sm:text-xl"
        >
          {EPILOGUE.paragraphs.map((paragraph, i) => (
            <p key={i} data-reveal>
              {paragraph}
            </p>
          ))}
        </div>

        <p
          data-finale-signature
          data-reveal
          className="mt-8 font-cinzel text-sm uppercase tracking-[0.25em] text-[var(--artemis-gold)]"
        >
          {EPILOGUE.signature}
        </p>

        {/* Next year */}
        <div
          data-finale-return
          data-reveal
          style={{ boxShadow: ARTEMIS_CARD_SHADOW }}
          className="relative mt-12 w-full overflow-hidden rounded-2xl border border-[var(--artemis-gold)]/30 bg-[var(--artemis-night)]/60 px-6 py-8 backdrop-blur-sm sm:px-10"
        >
          <p className="font-cinzel text-[0.65rem] font-semibold uppercase tracking-[0.45em] text-[var(--artemis-gold-light)]">
            {FINALE.returnEyebrow}
          </p>
          <h2 className="artemis-gilt mt-3 font-cinzel text-2xl font-bold uppercase tracking-[0.18em] sm:text-3xl">
            {FINALE.returnTitle}
          </h2>
          <p className="mx-auto mt-4 max-w-xl font-cormorant text-lg italic leading-relaxed text-[var(--text-secondary)]">
            {FINALE.returnBody}
          </p>
        </div>

        {/* The way back in */}
        <div data-finale-cta data-reveal className="mt-14">
          {open ? (
            <p className="flex flex-col items-center gap-2 font-cinzel text-xs uppercase tracking-[0.35em] text-[var(--artemis-gold-light)]">
              {FINALE.openedNote}
              <ChevronDown className="h-4 w-4 animate-bounce" />
            </p>
          ) : (
            <div ref={burst} className="animate-artemis-halo relative grid place-items-center">
              {/* Rings and rays sit behind the button, centred on it. */}
              <span aria-hidden className="pointer-events-none absolute inset-0 grid place-items-center">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    data-burst-ring
                    className="absolute h-16 w-16 rounded-full border-2 border-[var(--artemis-gold-light)] opacity-0"
                  />
                ))}
                {Array.from({ length: RAYS }, (_, i) => (
                  <span
                    key={i}
                    className="absolute left-1/2 top-1/2 h-0.5 w-0"
                    style={{ transform: `rotate(${(360 / RAYS) * i}deg)` }}
                  >
                    <span
                      data-burst-ray
                      className="absolute left-6 top-0 block h-0.5 w-20 origin-left rounded-full bg-gradient-to-r from-[var(--artemis-gold-light)] to-transparent opacity-0"
                    />
                  </span>
                ))}
              </span>

              <button
                type="button"
                data-burst-button
                onClick={relive}
                disabled={bursting}
                aria-label={FINALE.openHint}
                aria-controls={CHRONICLE_ID}
                aria-expanded={open}
                className="group relative overflow-hidden whitespace-nowrap clip-angular px-7 py-4 font-cinzel text-sm font-bold uppercase tracking-[0.2em] sm:px-10 sm:tracking-[0.3em] text-[var(--artemis-void)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--artemis-gold-light)] focus-visible:ring-offset-4 focus-visible:ring-offset-[var(--artemis-void)] sm:text-base"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, var(--artemis-gold-light) 0%, var(--artemis-gold) 45%, var(--artemis-gold-deep) 100%)",
                }}
              >
                {/* Glint, as on the navbar's Artemis pill. */}
                <span
                  aria-hidden
                  className="animate-artemis-shimmer pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-white/60 to-transparent"
                />
                <span className="relative flex items-center gap-3">
                  <StarGlyph className="h-3 w-3" />
                  {FINALE.openLabel}
                  <StarGlyph className="h-3 w-3" />
                </span>
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Full-sky gold wash for the moment the button is loosed. */}
      <div
        ref={flash}
        aria-hidden
        className="pointer-events-none fixed inset-0 z-40 opacity-0"
        style={{ background: "radial-gradient(circle at 50% 70%, var(--artemis-gold-light), transparent 70%)" }}
      />

      {open && (
        <div ref={chronicle} id={CHRONICLE_ID} tabIndex={-1} className="scroll-mt-24 outline-none">
          <div className="mx-auto flex max-w-3xl flex-col items-center px-6 pt-16 text-center">
            <MeanderDivider className="text-[var(--artemis-gold)] opacity-50" />
            <p className="mt-8 font-cinzel text-[0.68rem] font-semibold uppercase tracking-[0.45em] text-[var(--artemis-gold-light)]">
              {FINALE.chronicleEyebrow}
            </p>
            <h2 className="artemis-gilt mt-3 font-cinzel text-2xl font-bold uppercase tracking-[0.2em] sm:text-3xl">
              {FINALE.chronicleTitle}
            </h2>
          </div>
          {children}
        </div>
      )}
    </>
  );
}
