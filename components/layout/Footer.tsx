import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { HeroGear } from "@/components/fx/HeroGear";
import { Logo } from "@/components/ui/Logo";
import { BackToTop } from "./BackToTop";
import { JoinLink } from "./JoinLink";

/**
 * A full-height "closing statement" footer: one large line in the middle with
 * the dithered gear turning behind it, a single call to action, and the
 * contact details and links pinned along the bottom edge.
 *
 * The statement's words brighten one after another as the footer scrolls up
 * (.fx-word-in, a CSS view timeline in globals.css). Without view-timeline
 * support, or with reduced motion, they are simply shown.
 */

const EXPLORE = [
  { href: "/initiatives", label: "Initiatives" },
  { href: "/community", label: "Community" },
  { href: "/artemis", label: "Artemis" },
  { href: "/articles", label: "Articles" },
];

const CHAPTER = [
  { href: "/membership", label: "Membership" },
  { href: "/certificates", label: "Certificates" },
  { href: "/help", label: "Support" },
];

const SOCIALS = [
  { label: "LinkedIn", href: "https://www.linkedin.com/in/isa-rait-student-chapter-3a99451b6/" },
  { label: "Instagram", href: "https://www.instagram.com/isa_rait/" },
  { label: "Facebook", href: "https://www.facebook.com/isarait2k18/" },
];

// Two lines; "—" is drawn as the accent rule, as a pause before the last word.
const STATEMENT = [
  ["Every", "system", "starts"],
  ["with", "one", "—", "signal."],
];

const linkClass =
  "inline-flex min-h-11 items-center text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)] focus-visible:text-[var(--text-primary)] focus-visible:outline-none";

export function Footer() {
  let word = 0;
  return (
    // relative z-10 keeps GlobalBackground from painting over the footer.
    <footer
      className="relative z-10 isolate flex min-h-svh flex-col overflow-hidden border-t border-[var(--border-color)]/40 bg-[var(--bg-color)]"
    >
      {/* The gear, large and faded, as the backdrop to the statement. */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[44%] -z-10 aspect-square w-[min(80vh,90vw)] -translate-x-1/2 -translate-y-1/2 opacity-25 [mask-image:radial-gradient(closest-side,black_55%,transparent)]"
      >
        <HeroGear />
      </div>

      {/* Statement. The top padding clears the floating navbar. */}
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col items-center justify-center px-6 pb-16 pt-28 text-center">
        <p className="font-jetbrains text-xs uppercase tracking-[0.3em] text-[var(--border-active)]">
          {"// end of transmission"}
        </p>
        <h2 className="mt-6 text-balance text-5xl font-semibold leading-[1.02] tracking-tight text-[var(--text-primary)] sm:text-7xl lg:text-8xl">
          {STATEMENT.map((line, l) => (
            <span key={l} className="block">
              {line.map((w) => {
                const i = word++;
                return w === "—" ? (
                  <span
                    key={i}
                    aria-hidden
                    className="fx-word-in mx-[0.2em] inline-block h-[0.09em] w-[1.1em] translate-y-[-0.28em] bg-[var(--accent-color)] align-middle"
                    style={{ "--i": i } as React.CSSProperties}
                  />
                ) : (
                  <span key={i} className="fx-word-in mr-[0.25em] inline-block last:mr-0" style={{ "--i": i } as React.CSSProperties}>
                    {w}
                  </span>
                );
              })}
            </span>
          ))}
        </h2>

        <JoinLink
          className="group mt-12 inline-flex min-h-12 items-center gap-4 rounded-full border border-[var(--text-primary)]/30 py-2 pl-7 pr-3 text-sm font-medium text-[var(--text-primary)] backdrop-blur-sm transition-colors hover:border-[var(--border-active)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-active)]"
        >
          <span
            aria-hidden
            className="relative inline-flex h-8 w-8 items-center justify-center rounded-full border border-current transition-transform duration-300 group-hover:rotate-90"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-color)]" />
          </span>
        </JoinLink>
      </div>

      {/* Contact and links */}
      <div className="mx-auto grid w-full max-w-7xl grid-cols-2 gap-x-6 gap-y-10 px-6 pb-8 md:grid-cols-[1fr_auto_auto] md:gap-x-20">
        <div className="col-span-2 md:col-span-1">
          <div className="mb-6 flex items-center gap-6">
            <Link href="/" aria-label="ISA RAIT — home" className="inline-block">
              <Logo className="h-20 lg:h-24" sizes="246px" />
            </Link>
            <a
              href="https://www.rait.ac.in"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Ramrao Adik Institute of Technology (opens in a new tab)"
            >
              <Logo variant="rait" className="h-20 lg:h-24" sizes="218px" />
            </a>
          </div>
          <a
            href="mailto:isa.rait@rait.ac.in"
            className="text-xl text-[var(--text-primary)] underline-offset-4 hover:underline sm:text-2xl"
          >
            isa.rait@rait.ac.in
          </a>
          <p className="mt-2 max-w-sm text-sm text-[var(--text-secondary)]">
            Ramrao Adik Institute of Technology, Sector 7, Nerul, Navi Mumbai 400706.
          </p>
          <ul className="mt-3 flex flex-wrap gap-x-6 text-sm">
            {SOCIALS.map((s) => (
              <li key={s.label}>
                <a href={s.href} target="_blank" rel="noopener noreferrer" className={`${linkClass} gap-1`}>
                  {s.label}
                  <ArrowUpRight aria-hidden className="h-3.5 w-3.5" />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        {[EXPLORE, CHAPTER].map((group, g) => (
          <nav key={g} aria-label={g === 0 ? "Explore" : "Chapter"}>
            <ul className="flex flex-col text-base">
              {group.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={`${linkClass} -my-1`}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-x-8 gap-y-2 border-t border-[var(--border-color)]/30 px-6 py-5 font-jetbrains text-xs text-[var(--text-secondary)]">
        <p>© 2026 ISA RAIT Student Chapter</p>
        <p className="flex gap-6">
          <Link href="/privacy" className={linkClass}>
            Privacy
          </Link>
          <Link href="/terms" className={linkClass}>
            Terms
          </Link>
          <BackToTop className={linkClass} />
        </p>
      </div>
    </footer>
  );
}
