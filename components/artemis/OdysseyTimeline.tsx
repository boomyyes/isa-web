"use client";

import { animate, spring, onScroll } from "animejs";
import { SectionHeading } from "@/components/artemis/SectionHeading";
import { StarGlyph } from "@/components/artemis/GreekOrnaments";
import {
  enterOnce,
  revealHeadingOnScroll,
} from "@/components/artemis/reveal";
import {
  ARTEMIS_EASE,
  useArtemisAnime,
} from "@/components/artemis/useArtemisAnime";
import { ODYSSEY } from "@/lib/artemis";

/**
 * The schedule, as a vertical timeline on a gilt spine with diamond nodes —
 * the left rail from the reference spread.
 *
 * The spine is a single absolutely-positioned line behind the list rather than
 * a border on each row, so it never breaks between items of unequal height. It
 * stops short at both ends via a mask-free inset (top-2 / bottom-2) so it reads
 * as terminating at the first and last node rather than running off.
 *
 * The event runs over two dates, so the spine carries two kinds of marker: a
 * star where a day begins, and a diamond for each stop within it. A day's stops
 * are their own <ol> under that day's heading — one flat list would have put
 * 23:00 directly above 06:00 with nothing to say the night had turned over. The
 * spine stays on the wrapper spanning every day, so it runs unbroken through the
 * turn rather than restarting each morning.
 *
 * The spine is also the one thing on the page tied directly to scroll position
 * rather than merely triggered by it: `onScroll({ sync: true })` maps the fill
 * to how far the list has travelled through the viewport, so it fills as you
 * descend and empties if you scroll back up. Each stop then arrives on its own
 * observer as the fill reaches it, instead of the whole list animating at once.
 */
export function OdysseyTimeline() {
  const root = useArtemisAnime<HTMLElement>((self) => {
    const el = self.root as HTMLElement;

    revealHeadingOnScroll(el);

    // clip-path rather than scaleY: the spine is a
    // transparent -> gold -> transparent gradient, and scaling it would drag
    // the stops along with it instead of uncovering them in place.
    animate("[data-odyssey-spine]", {
      clipPath: ["inset(0% 0% 100% 0%)", "inset(0% 0% 0% 0%)"],
      autoplay: onScroll({
        sync: true,
        // "<container edge> <target edge>" — container first. Starts filling
        // once the list top has risen to a fifth above the fold, and is full by
        // the time its bottom is 40% down the screen.
        enter: "bottom-=20% top",
        leave: "top+=40% bottom",
      }),
    });

    // Day headings arrive like stops, but their star turns into place rather
    // than punching in — a station on the line, not another stop along it.
    el.querySelectorAll<HTMLElement>("[data-odyssey-day]").forEach((day) => {
      animate(day, {
        opacity: [0, 1],
        translateX: [-30, 0],
        duration: 520,
        ease: ARTEMIS_EASE,
        autoplay: enterOnce(),
      });

      animate(day.querySelectorAll("[data-odyssey-star]"), {
        scale: [0, 1],
        rotate: [-120, 0],
        delay: 80,
        ease: spring({ stiffness: 110, damping: 13 }),
        autoplay: enterOnce(),
      });
    });

    el.querySelectorAll<HTMLElement>("[data-odyssey-stop]").forEach((stop, i) => {
      animate(stop, {
        opacity: [0, 1],
        translateX: [-30, 0],
        duration: 520,
        ease: ARTEMIS_EASE,
        autoplay: enterOnce(),
      });

      // The diamonds punch in behind their row, so the eye reads the node
      // landing on the spine and then the text arriving beside it.
      animate(stop.querySelectorAll("[data-odyssey-node]"), {
        scale: [0, 1],
        rotate: 45,
        delay: 60 + i * 12,
        ease: spring({ stiffness: 120, damping: 12 }),
        autoplay: enterOnce(),
      });
    });
  });

  return (
    <section
      ref={root}
      id="odyssey"
      tabIndex={-1}
      className="relative scroll-mt-24 outline-none md:scroll-mt-28 mx-auto max-w-4xl px-6 py-16 md:py-24"
    >
      <SectionHeading
        eyebrow="The Odyssey"
        title="Order of the two days"
        lead="Two days and the night between them. Times are provisional and will be fixed nearer the day."
      />

      {/* The padding that clears the spine lives here rather than on each day's
          list, so every marker measures from the same edge and the two days
          cannot drift out of line with one another. */}
      <div className="relative mt-14 pl-10 sm:pl-14">
        {/* Spine */}
        <span
          aria-hidden
          data-odyssey-spine
          className="absolute bottom-2 left-[7px] top-2 w-px bg-gradient-to-b from-transparent via-[var(--artemis-gold)]/45 to-transparent sm:left-[11px]"
        />

        {ODYSSEY.map((day) => (
          <section key={day.id} className="relative pt-14 first:pt-0">
            <header data-odyssey-day data-reveal className="relative">
              {/* The star sits on the spine and carries the page background, so
                  the line stops at the day and resumes below it. Centring is by
                  flexbox inside a box one diamond wide, which is what keeps it
                  aligned at both breakpoints without a second magic offset. */}
              <span
                aria-hidden
                data-odyssey-star
                className="absolute -left-10 top-0 flex w-[15px] justify-center bg-[var(--artemis-void)] py-1.5 sm:-left-14 sm:w-[23px]"
              >
                <StarGlyph className="h-3.5 w-3.5 text-[var(--artemis-gold-light)] sm:h-[18px] sm:w-[18px]" />
              </span>

              <h3 className="font-cinzel text-sm font-bold uppercase tracking-[0.34em] text-[var(--artemis-gold-light)]">
                {day.label}
              </h3>
              <p className="mt-1 font-cormorant text-lg italic text-[var(--text-secondary)] sm:text-xl">
                {day.date}
              </p>
            </header>

            <ol className="mt-8 space-y-8">
              {day.stops.map((stop) => (
                <li
                  key={stop.id}
                  data-odyssey-stop
                  data-reveal
                  className="relative"
                >
                  {/* Node. Rotated square rather than a circle — it matches the
                      diamonds punctuating the reference's rail.

                      The 45° lives in an inline transform, not a `rotate-45`
                      class: anime.js writes the composed transform inline while
                      the node pops in, which would drop a class-supplied
                      rotation. Inline also means the diamonds are still
                      diamonds under reduced motion, where nothing animates. */}
                  <span
                    aria-hidden
                    data-odyssey-node
                    style={{ transform: "rotate(45deg)" }}
                    className="absolute -left-10 top-1.5 h-[15px] w-[15px] border border-[var(--artemis-gold)] bg-[var(--artemis-void)] sm:-left-14 sm:h-[23px] sm:w-[23px]"
                  />
                  <span
                    aria-hidden
                    data-odyssey-node
                    style={{ transform: "rotate(45deg)" }}
                    className="absolute -left-[34px] top-[13px] h-[5px] w-[5px] bg-[var(--artemis-gold-light)] sm:-left-[45px] sm:top-[15px] sm:h-[7px] sm:w-[7px]"
                  />

                  <p className="font-cinzel text-xs font-semibold uppercase tracking-[0.3em] text-[var(--artemis-gold)]">
                    {stop.time}
                  </p>
                  <h4 className="mt-1.5 font-cinzel text-xl font-bold text-[var(--text-primary)] sm:text-2xl">
                    {stop.title}
                  </h4>
                  <p className="mt-2 font-cormorant text-base leading-relaxed text-[var(--text-secondary)] sm:text-lg">
                    {stop.detail}
                  </p>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>
    </section>
  );
}
