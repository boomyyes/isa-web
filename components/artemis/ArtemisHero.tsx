"use client";

import { animate, createDrawable, eases, spring, stagger } from "animejs";
import { CalendarDays, MapPin } from "lucide-react";
import Image from "next/image";
import { AngularButton } from "@/components/ui/AngularButton";
import {
  AstrolabeInner,
  AstrolabeOuter,
  MeanderDivider,
  StarGlyph,
} from "@/components/artemis/GreekOrnaments";
import { undash } from "@/components/artemis/reveal";
import { scrollToSection } from "@/components/artemis/scrollToSection";
import {
  ARTEMIS_EASE,
  useArtemisAnime,
} from "@/components/artemis/useArtemisAnime";
import { ARTEMIS } from "@/lib/artemis";

/**
 * The opening. A counter-rotating astrolabe sits behind the logo lockup.
 *
 * The two astrolabe rings turn at different speeds in opposite directions — one
 * ring alone reads as a spinning graphic, two reads as an instrument. That
 * perpetual turn stays a CSS animation rather than anime.js so the existing
 * prefers-reduced-motion block in globals.css switches it off. What anime.js
 * adds is the arrival: the instrument scribes itself into existence and the
 * lockup settles onto it.
 *
 * Everything here is time-based rather than scroll-triggered, because the hero
 * is on screen the moment the page is. The rest of the page uses the scroll
 * helpers in reveal.ts instead.
 */

/** Where the lockup lands, in milliseconds after mount. */
const LOGO_AT = 380;

export function ArtemisHero() {
  const root = useArtemisAnime<HTMLElement>((self) => {
    const el = self.root as HTMLElement;

    /* ---- The instrument scribes itself ---- */

    // Two circles and sixty graduated ticks per ring. Staggering outward from
    // the middle of that run is what makes it read as an instrument being
    // engraved rather than a graphic wiping on.
    const rings = el.querySelector<HTMLElement>("[data-hero-astrolabe]");
    if (rings) {
      const ringStrokes = Array.from(
        rings.querySelectorAll<SVGGeometryElement>("circle, line")
      );

      animate(createDrawable(ringStrokes), {
        draw: ["0 0", "0 1"],
        duration: 800,
        ease: eases.inOut(2),
        delay: stagger(4, { from: "center" }),
        // These sixty-four strokes sit inside the two rings that turn for as
        // long as the page is open. Dropping the dash pattern the drawing
        // leaves behind takes them back to solid strokes, which is what they
        // were before and what the compositor can rotate cheaply.
        onComplete: () => undash(ringStrokes),
      });
      // The rose at the centre of the inner ring is filled rather than stroked,
      // so createDrawable cannot touch it. It is left to the wrapper fade below
      // instead of being animated on its own: the two rose paths carry their
      // own opacity attributes (0.26 and 0.18) to sit back as a watermark, and
      // animating them to 1 would override those and blow the star out to full
      // strength behind the lockup.
      // The [data-draw] wrapper is faded up rather than set to 1 outright, so
      // there is no arrangement of frames in which the rings could be caught
      // already scribed. Same for the type and the lockup below.
      animate(rings, { opacity: [0, 1], duration: 240, ease: ARTEMIS_EASE });
    }

    /* ---- Type ---- */

    animate("[data-hero-eyebrow]", {
      opacity: [0, 1],
      translateY: [14, 0],
      duration: 500,
      delay: 300,
      ease: ARTEMIS_EASE,
    });

    /* ---- The lockup ---- */

    // The logo carries the mark, the wordmark and the "national level
    // hackathon" line as one raster, so there is nothing here to draw or to
    // split a letter at a time. It settles in as a single object instead: a
    // shallow scale and a short rise, sprung so it overshoots by a hair and
    // beds down onto the rings that have just finished scribing themselves.
    const logo = el.querySelector<HTMLElement>("[data-hero-logo]");
    if (logo) {
      animate(logo, {
        opacity: [0, 1],
        duration: 620,
        delay: LOGO_AT,
        ease: ARTEMIS_EASE,
      });
      animate(logo, {
        scale: [0.92, 1],
        translateY: [26, 0],
        delay: LOGO_AT,
        ease: spring({ stiffness: 62, damping: 14 }),
        // A landed lockup has no more use for a transform, and leaving one on
        // keeps a full-width image promoted to its own compositing layer for
        // the life of the page. Clearing it hands the element back to ordinary
        // painting.
        onComplete: () => {
          logo.style.transform = "";
        },
      });
    }

    animate("[data-hero-rule]", {
      opacity: [0, 1],
      clipPath: ["inset(0% 50% 0% 50%)", "inset(0% 0% 0% 0%)"],
      duration: 640,
      delay: LOGO_AT + 420,
      ease: ARTEMIS_EASE,
    });

    animate(["[data-hero-tagline]", "[data-hero-chips]", "[data-hero-cta]"], {
      opacity: [0, 1],
      translateY: [18, 0],
      duration: 560,
      delay: stagger(90, { start: LOGO_AT + 520 }),
      ease: ARTEMIS_EASE,
    });
  });

  return (
    // id + tabIndex make the hero a scroll target like every other section, so
    // the back-to-top control is an ordinary #top link and reuses the same
    // animation. scroll-mt is deliberately absent: clamping in resolveTargetY
    // takes the negative result to 0, which is the actual top of the page.
    <section
      ref={root}
      id="top"
      tabIndex={-1}
      className="relative flex min-h-[92vh] flex-col items-center justify-center px-6 pb-20 pt-32 outline-none md:pt-40"
    >
      {/* Astrolabe. Sized in vw so it stays a backdrop rather than colliding
          with the lockup on narrow screens, and capped so it does not
          swallow the section on a wide desktop. */}
      <div
        aria-hidden
        data-hero-astrolabe
        data-draw
        className="pointer-events-none absolute left-1/2 top-1/2 h-[min(78vw,620px)] w-[min(78vw,620px)] -translate-x-1/2 -translate-y-1/2"
      >
        <AstrolabeOuter className="animate-artemis-orbit absolute inset-0 h-full w-full text-[var(--artemis-gold)] opacity-40" />
        <AstrolabeInner className="animate-artemis-orbit-reverse absolute inset-0 h-full w-full text-[var(--artemis-gold-light)] opacity-30" />
      </div>

      <div className="relative flex flex-col items-center text-center">
        {/* Eyebrow */}
        <p
          data-hero-eyebrow
          data-reveal
          className="flex items-center gap-3 font-cinzel text-[0.68rem] font-semibold uppercase tracking-[0.5em] text-[var(--artemis-gold-light)]"
        >
          <StarGlyph className="animate-artemis-twinkle h-2 w-2" />
          {ARTEMIS.eyebrow}
          <StarGlyph className="animate-artemis-twinkle h-2 w-2" />
        </p>

        {/* The lockup, standing in for the three elements that used to sit
            here — the crescent-and-bow mark, the ARTEMIS wordmark set a letter
            at a time, and the "hackathon" line. The artwork carries all three.
            This is still the page's <h1>; the heading text lives in the alt.

            The art arrived as a JPEG on a pure-black field, which is the one
            thing that cannot go over the night sky. It is now a PNG with a real
            alpha channel, recovered from that black and trimmed to the
            artwork's own bounds — so this is an ordinary transparent image with
            an intrinsic 1630x941, and it needs no blend mode and no cropping
            box to sit on the astrolabe.

            mix-blend-screen was doing that job, and it is deliberately gone:
            the entrance below animates opacity and transform together, which
            promotes this element to its own compositing layer, and a blend mode
            against the backdrop is the first thing dropped when the compositor
            takes a layer over. The black field flashed for the length of the
            animation and vanished the moment the layer was released. */}
        <h1 data-hero-logo data-reveal className="mt-4 block">
          <Image
            src="/artemis/logo.png"
            alt={`${ARTEMIS.title} — National Level Hackathon`}
            width={1630}
            height={941}
            priority
            sizes="(min-width: 768px) 760px, 92vw"
            className="h-auto w-[min(92vw,760px)]"
          />
        </h1>

        <div data-hero-rule data-unroll className="mt-2 w-full">
          <MeanderDivider className="text-[var(--artemis-gold)] opacity-70" />
        </div>

        <p
          data-hero-tagline
          data-reveal
          className="mt-6 max-w-xl font-cormorant text-xl italic leading-relaxed text-[var(--text-secondary)] sm:text-2xl"
        >
          {ARTEMIS.tagline}
        </p>

        {/* Date + venue chips */}
        <div
          data-hero-chips
          data-reveal
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--artemis-gold)]/35 bg-[var(--artemis-night)]/60 px-4 py-2 font-cinzel text-xs uppercase tracking-[0.2em] text-[var(--artemis-gold-light)] backdrop-blur-sm">
            <CalendarDays className="h-3.5 w-3.5" />
            {ARTEMIS.when}
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--artemis-gold)]/35 bg-[var(--artemis-night)]/60 px-4 py-2 font-cinzel text-xs uppercase tracking-[0.2em] text-[var(--artemis-gold-light)] backdrop-blur-sm">
            <MapPin className="h-3.5 w-3.5" />
            {ARTEMIS.venue}
          </span>
        </div>

        {/* CTAs. AngularButton reads --accent-color / --border-active, both of
            which the .artemis scope has already remapped to gold.

            These stay real anchors with a real href — middle-click, "copy link
            address" and a JS-less load all keep working — and scrollToSection
            takes over on a plain left click, purely so that pressing the same
            button twice works. See its comment. */}
        <div
          data-hero-cta
          data-reveal
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          <AngularButton
            href="#register"
            onClick={(e) => scrollToSection(e, "register")}
            className="font-cinzel tracking-[0.2em]"
          >
            Claim your fate
          </AngularButton>
          <AngularButton
            href="#prologue"
            variant="outline"
            onClick={(e) => scrollToSection(e, "prologue")}
            className="font-cinzel tracking-[0.2em]"
          >
            Read the omens
          </AngularButton>
        </div>
      </div>
    </section>
  );
}
