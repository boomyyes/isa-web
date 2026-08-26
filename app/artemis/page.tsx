import type { Metadata } from "next";
import { PageTransition } from "@/components/layout/PageTransition";
import { ArtemisSky } from "@/components/artemis/ArtemisSky";
import { ArtemisHero } from "@/components/artemis/ArtemisHero";
import { ProloguePanel } from "@/components/artemis/ProloguePanel";
import { TrackMedallions } from "@/components/artemis/TrackMedallions";
import { ConstellationGrid } from "@/components/artemis/ConstellationGrid";
import { OdysseyTimeline } from "@/components/artemis/OdysseyTimeline";
import { BoonsSection } from "@/components/artemis/BoonsSection";
import { OracleQuotes } from "@/components/artemis/OracleQuotes";
import { RegisterSection } from "@/components/artemis/RegisterSection";
import { ArtemisFaq } from "@/components/artemis/ArtemisFaq";
import { EpilogueNote } from "@/components/artemis/EpilogueNote";
import { ARTEMIS } from "@/lib/artemis";

/**
 * The Artemis Hackathon landing page.
 *
 * Server component on purpose — `metadata` only works from one, so every piece
 * of interactivity lives in the client components under components/artemis/.
 * The theme scope and the page's fonts are applied one level up, in
 * app/artemis/layout.tsx.
 */

export const metadata: Metadata = {
  title: ARTEMIS.title + " | ISA RAIT",
  description: ARTEMIS.tagline,
};

export default function ArtemisPage() {
  return (
    <PageTransition>
      {/* `relative` anchors the sections; ArtemisSky pins itself to the viewport
          from inside, which is what lets it cover the site's global background.
          See the note in ArtemisSky for why -z-10 is correct there. */}
      <main className="relative min-h-screen">
        <ArtemisSky />

        <ArtemisHero />
        <ProloguePanel />
        <TrackMedallions />
        <ConstellationGrid />
        <OdysseyTimeline />
        <BoonsSection />
        <OracleQuotes />
        <RegisterSection />
        <ArtemisFaq />
        <EpilogueNote />
      </main>
    </PageTransition>
  );
}
