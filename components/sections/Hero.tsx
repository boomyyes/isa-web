import { AngularButton } from "@/components/ui/AngularButton";
import { Terminal } from "lucide-react";
import { HeroGear } from "@/components/fx/HeroGear";
import { ScrambleText } from "@/components/fx/ScrambleText";

// A server component: the copy below is in the prerendered HTML and visible on
// first paint. Its entrance is CSS (animate-hero-* in globals.css), and the only
// client pieces are the boot line's scramble and the gear canvas.

export function Hero() {
  const headline = "INTERNATIONAL SOCIETY OF AUTOMATION, RAIT";

  return (
    // pt clears the floating nav island rather than the old flat pt-20: the
    // island sits at top-3/sm:top-4 with an h-16/sm:h-20 row while the page is
    // at the top, so its bottom edge lands at 76px / 96px. At 80px the boot
    // line tucked under the logo on desktop.
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24 sm:pt-32">
      {/* Background Layer */}
      <div
        className="absolute inset-0 pointer-events-none z-10 opacity-10 dark:opacity-20"
        style={{
          backgroundSize: "40px 40px",
          backgroundImage: "linear-gradient(to right, var(--border-color) 1px, transparent 1px), linear-gradient(to bottom, var(--border-color) 1px, transparent 1px)",
          transform: "perspective(500px) rotateX(60deg) translateY(100px) translateZ(-200px)",
        }}
      />

      <div className="container relative z-20 mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center min-h-[80vh]">

        {/* Left Column: Text */}
        <div className="flex flex-col items-start text-left pt-12 lg:pt-0">
          <div className="flex items-center gap-2 mb-6 text-[var(--border-active)] font-jetbrains text-sm font-bold tracking-widest">
            <Terminal size={16} />
            <ScrambleText text="> SYS.BOOT SEQUENCE INITIATED" />
          </div>

          {/* text-3xl at the base step, not text-4xl: each word below is an
              inline-block with overflow-hidden (that clip is what masks the
              slide-up reveal), so "INTERNATIONAL" too wide for the column gets
              cut mid-letter instead of wrapping. At 36px it overflowed a 360px
              screen. sm: and up are unchanged. */}
          <h1 className="text-3xl sm:text-6xl md:text-7xl lg:text-8xl font-black font-inter tracking-tighter leading-none mb-6 md:mb-8 max-w-2xl">
            {headline.split(" ").map((word, i) => (
              <span key={i} className="inline-block mr-[0.2em] overflow-hidden">
                <span
                  className="inline-block animate-hero-rise"
                  style={{ animationDelay: `${i * 0.08}s` }}
                >
                  {word}
                </span>
              </span>
            ))}
          </h1>

          <p
            className="animate-hero-nudge text-lg md:text-xl text-[var(--text-secondary)] max-w-xl mb-6 md:mb-8 font-medium"
          >
            ISA-RAIT is a student chapter of ISA international under the ISA Maharashtra section.
            ISA-RAIT aims to bridge the gap between the students and the Industry by developing technical knowledge of the students.
            We conduct workshops and arrange seminars to develop the technical and other required skills of the students
            to make them industry-ready.
            ISA was founded in 1945 and excels in technical competence.
            The organization certifies Industry professionals; provides education and training; publishes books and technical articles;
            hosts conferences and has 40,000 members around the world creating a better world through Automation.
          </p>

          <div
            className="animate-hero-nudge flex flex-col sm:flex-row gap-6 w-full sm:w-auto"
          >
            <AngularButton variant="primary" href="https://docs.google.com/forms/d/e/1FAIpQLSf52x6Y3TAjj6o5lhfVtmYiNagKXgpyX4Qd-OLkZQUMhKXdSg/viewform?usp=dialog" target="_blank" className="w-full sm:w-48">
              Join the Committee
            </AngularButton>
            <AngularButton variant="outline" href="/initiatives#projects" className="w-full sm:w-48">
              Explore Projects
            </AngularButton>
          </div>
        </div>

        {/* Right column: the dithered gear (md+ only). */}
        <div className="relative hidden w-full h-[40vh] sm:h-[50vh] lg:h-[80vh] items-center justify-center pointer-events-none md:flex">
          <HeroGear />
        </div>

      </div>
    </section>
  );
}
