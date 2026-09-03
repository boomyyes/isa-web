import type { Metadata } from "next";
import { PageTransition } from "@/components/layout/PageTransition";
import { ArtemisSky } from "@/components/artemis/ArtemisSky";
import { ArtemisHero } from "@/components/artemis/ArtemisHero";
import { ProloguePanel } from "@/components/artemis/ProloguePanel";
import { TrialsSection } from "@/components/artemis/TrialsSection";
import { GuidelinesSection } from "@/components/artemis/GuidelinesSection";
import { OdysseyTimeline } from "@/components/artemis/OdysseyTimeline";
import { BoonsSection } from "@/components/artemis/BoonsSection";
import { OracleQuotes } from "@/components/artemis/OracleQuotes";
import { RegisterSection } from "@/components/artemis/RegisterSection";
import { ArtemisFaq } from "@/components/artemis/ArtemisFaq";
import { EpilogueNote } from "@/components/artemis/EpilogueNote";
import { BackToTop } from "@/components/artemis/BackToTop";
import { ARTEMIS } from "@/lib/artemis";
import { readTrials } from "@/lib/artemis-trials";

/**
 * The Artemis Hackathon landing page.
 *
 * Server component on purpose — `metadata` only works from one, so every piece
 * of interactivity lives in the client components under components/artemis/.
 * The theme scope and the page's fonts are applied one level up, in
 * app/artemis/layout.tsx.
 *
 * It is also the page's embargo. The problem statements are held back until the
 * hackathon opens, and this is where that is decided: the text is fetched only
 * once the hour has come, and until then `statements` is null, so there is
 * nothing in the HTML, the RSC payload, or any client bundle to find early.
 * TrialsSection renders the sealed sheet in its place. See lib/artemis-trials.ts
 * for the rest of the reasoning.
 */

/**
 * The check has to run per request. A statically prerendered page would freeze
 * whichever side of the release it happened to be built on — either sealed
 * forever, or, far worse, open from the moment it was built.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  // Deliberately the tagline and nothing else. Statement text must not reach
  // the description, the OG tags or the sitemap.
  title: ARTEMIS.title + " | ISA RAIT",
  description: ARTEMIS.tagline,
};

export default function ArtemisPage() {
  // `statements` is null until the hour comes — nothing to serialise, so nothing
  // to find in the response. `serverNow` is read from the same clock, so the
  // countdown can never be calibrated against a different instant than the one
  // that made the decision.
  const { statements, serverNow } = readTrials();

  return (
    <PageTransition>
      {/* `relative` anchors the sections; ArtemisSky pins itself to the viewport
          from inside, which is what lets it cover the site's global background.
          See the note in ArtemisSky for why -z-10 is correct there. */}
      <main className="relative min-h-screen">
        <ArtemisSky />

        <ArtemisHero />
        <ProloguePanel />
        {/* `serverNow` is what the countdown measures the visitor's clock
            against, so the seal breaks on the server's hour rather than on a
            laptop that happens to be running fast. */}
        <TrialsSection statements={statements} serverNow={serverNow} />
        <GuidelinesSection />
        <OdysseyTimeline />
        <BoonsSection />
        <OracleQuotes />
        <RegisterSection />
        <ArtemisFaq />
        <EpilogueNote />

        {/* Fixed to the viewport, so its position in the tree is only about
            reading order — last, after the content it scrolls you back through. */}
        <BackToTop />
      </main>
    </PageTransition>
  );
}
