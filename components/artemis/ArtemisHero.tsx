"use client";

import {
  animate,
  createDrawable,
  eases,
  splitText,
  spring,
  stagger,
  utils,
} from "animejs";
import { CalendarDays, MapPin } from "lucide-react";
import { AngularButton } from "@/components/ui/AngularButton";
import {
  AstrolabeInner,
  AstrolabeOuter,
  CrescentBow,
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
 * The opening. A counter-rotating astrolabe sits behind the wordmark, with the
 * crescent-and-bow mark above it.
 *
 * The two astrolabe rings turn at different speeds in opposite directions — one
 * ring alone reads as a spinning graphic, two reads as an instrument. That
 * perpetual turn stays a CSS animation rather than anime.js so the existing
 * prefers-reduced-motion block in globals.css switches it off. What anime.js
 * adds is the arrival: the instrument scribes itself into existence, the mark
 * is drawn, and the wordmark is set a letter at a time.
 *
 * Everything here is time-based rather than scroll-triggered, because the hero
 * is on screen the moment the page is. The rest of the page uses the scroll
 * helpers in reveal.ts instead.
 */

/** Where the wordmark's letters start, in milliseconds after mount. */
const WORDMARK_AT = 380;

export function ArtemisHero() {
  const root = useArtemisAnime<HTMLElement>((self) => {
    const el = self.root as HTMLElement;

    // Undo work done to the DOM itself. Everything anime.js creates is reverted
    // by the scope; class changes made by hand are not.
    const cleanups: (() => void)[] = [];

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
      // strength across the wordmark.
      // The [data-draw] wrapper is faded up rather than set to 1 outright, so
      // there is no arrangement of frames in which the rings could be caught
      // already scribed. Same for the mark and the wordmark below.
      animate(rings, { opacity: [0, 1], duration: 240, ease: ARTEMIS_EASE });
    }

    /* ---- The mark ---- */

    const mark = el.querySelector<HTMLElement>("[data-hero-mark]");
    if (mark) {
      // Moon first, bow drawn beneath it.
      animate(mark.querySelectorAll("rect"), {
        opacity: [0, 1],
        delay: 220,
        ease: spring({ stiffness: 92, damping: 14 }),
      });
      const bowStrokes = Array.from(
        mark.querySelectorAll<SVGGeometryElement>("path")
      );
      animate(createDrawable(bowStrokes), {
        draw: ["0 0", "0 1"],
        duration: 550,
        delay: stagger(90, { start: 300 }),
        ease: eases.inOut(2),
        onComplete: () => undash(bowStrokes),
      });
      animate(mark, {
        scale: [0.86, 1],
        delay: 220,
        ease: spring({ stiffness: 92, damping: 14 }),
      });
      animate(mark, {
        opacity: [0, 1],
        duration: 300,
        delay: 220,
        ease: ARTEMIS_EASE,
      });
    }

    /* ---- Type ---- */

    animate("[data-hero-eyebrow]", {
      opacity: [0, 1],
      translateY: [14, 0],
      duration: 500,
      delay: 300,
      ease: ARTEMIS_EASE,
    });

    const wordmark = el.querySelector<HTMLElement>("[data-hero-wordmark]");
    if (wordmark) {
      // `words: false` puts the character spans directly inside the <h1>. One
      // word, so no word grouping is lost.
      //
      // Each letter carries its own copy of the gilt gradient rather than
      // inheriting one clipped from the <h1>.
      const { chars } = splitText(wordmark, {
        words: false,
        chars: { class: "artemis-gilt" },
        accessible: true,
      });

      // ...and now the <h1> has to give its own gilt up. `background-clip:
      // text` clips an element's background to its text, descendants included,
      // but only while those descendants paint into the same layer. Each letter
      // below takes a 3D transform and a filter, both of which promote it to a
      // layer of its own, and at that point Chrome clips the h1's gradient to
      // the span's *box* instead of its glyphs — painting a solid gold
      // rectangle over the letter for as long as the entrance runs.
      //
      // The class stays in the markup because it is still correct for the two
      // paths that never split the text: reduced motion, where no scope is
      // built at all, and scripting disabled. It is only wrong once the letters
      // exist, so it is dropped here and restored if this scope is torn down.
      wordmark.classList.remove("artemis-gilt");

      // Perspective per letter, not one on the <h1>. A shared perspective has a
      // single vanishing point at the centre of the word, so letters out at the
      // ends are sheared and scaled by their distance from it — mid-flight the
      // A and the S came out visibly larger and slanted. Giving each glyph its
      // own centred vanishing point keeps them upright and the same size.
      // `perspective` is first in anime.js's transform order, so it composes
      // ahead of the translate and rotate below, which is where it must be.
      utils.set(chars, { perspective: 640 });

      animate(chars, {
        opacity: [0, 1],
        translateY: [55, 0],
        // Deliberately shallow. A letter tipped much further than this is
        // foreshortened hard enough to stop looking like itself — at -78 the
        // trailing I and S read as a lowercase "is" while they were still on
        // their way in, which is the wrong kind of surprise on a wordmark.
        // Forty-odd degrees still catches the light as they land.
        rotateX: [-42, 0],
        duration: 800,
        // Tight enough that the word arrives as a word rather than as seven
        // letters at seven different sizes.
        delay: stagger(26, { start: WORDMARK_AT }),
        ease: spring({ stiffness: 58, damping: 12 }),
        // Landed letters have no more use for a perspective transform, and
        // leaving one on keeps all seven promoted to their own compositing
        // layers for the life of the page. Clearing it hands them back to
        // ordinary text rendering.
        onComplete: () => {
          chars.forEach((c) => {
            (c as HTMLElement).style.transform = "";
          });
        },
      });

      // There is deliberately no perpetual glint on the wordmark.
      //
      // It was an animated `filter` over these letters, which is the most
      // expensive thing that could run here and the least willing to stop: each
      // letter carries a background-clip:text gradient and a 3D transform, so
      // an animating filter keeps seven text-clipped gradient layers being
      // re-rasterised on the compositor for as long as the tab is open, whether
      // or not the hero is still on screen. The navbar pill already carries
      // that idea with a plain CSS keyframe; the hero does not need a second.

      animate(wordmark, {
        opacity: [0, 1],
        duration: 300,
        delay: WORDMARK_AT,
        ease: ARTEMIS_EASE,
      });

      cleanups.push(() => wordmark.classList.add("artemis-gilt"));
    }

    animate("[data-hero-subtitle]", {
      opacity: [0, 1],
      translateY: [16, 0],
      duration: 540,
      delay: WORDMARK_AT + 330,
      ease: ARTEMIS_EASE,
    });

    animate("[data-hero-rule]", {
      opacity: [0, 1],
      clipPath: ["inset(0% 50% 0% 50%)", "inset(0% 0% 0% 0%)"],
      duration: 640,
      delay: WORDMARK_AT + 420,
      ease: ARTEMIS_EASE,
    });

    animate(
      ["[data-hero-tagline]", "[data-hero-chips]", "[data-hero-cta]"],
      {
        opacity: [0, 1],
        translateY: [18, 0],
        duration: 560,
        delay: stagger(90, { start: WORDMARK_AT + 520 }),
        ease: ARTEMIS_EASE,
      }
    );

    return () => cleanups.forEach((off) => off());
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
          with the wordmark on narrow screens, and capped so it does not
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
        {/* Mark */}
        <span data-hero-mark data-draw className="block">
          <CrescentBow
            maskId="artemis-hero-crescent"
            className="h-20 w-20 text-[var(--artemis-gold)] sm:h-24 sm:w-24"
          />
        </span>

        {/* Eyebrow */}
        <p
          data-hero-eyebrow
          data-reveal
          className="mt-6 flex items-center gap-3 font-cinzel text-[0.68rem] font-semibold uppercase tracking-[0.5em] text-[var(--artemis-gold-light)]"
        >
          <StarGlyph className="animate-artemis-twinkle h-2 w-2" />
          {ARTEMIS.eyebrow}
          <StarGlyph className="animate-artemis-twinkle h-2 w-2" />
        </p>

        {/* Wordmark. The tracking is wide enough that the trailing letter-space
            would push the block visually off-centre, so the last letter carries
            a negative margin to pull it back.

            .artemis-gilt is correct here only until the text is split; see the
            note in the setup above, which removes it and hands the gradient to
            the individual letters. */}
        <h1
          data-hero-wordmark
          data-reveal
          className="artemis-gilt mt-4 font-cinzel text-[clamp(2.75rem,13vw,8.5rem)] font-bold leading-[0.95] tracking-[0.08em] [margin-right:-0.08em]"
        >
          ARTEMIS
        </h1>

        <p
          data-hero-subtitle
          data-reveal
          className="font-cinzel text-lg uppercase tracking-[0.6em] text-[var(--text-primary)] [margin-right:-0.6em] sm:text-2xl"
        >
          Hackathon
        </p>

        <div data-hero-rule data-unroll className="mt-8 w-full">
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
