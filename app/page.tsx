import { SvgPipelines } from "@/components/layout/SvgPipelines";
import { Hero } from "@/components/sections/Hero";
import { VisionMission } from "@/components/sections/VisionMission";
import { IsaacSpotlight } from "@/components/sections/IsaacSpotlight";
import { PhotoGallery } from "@/components/sections/PhotoGallery";
import { SponsorTicker } from "@/components/sections/SponsorTicker";
import { PageTransition } from "@/components/layout/PageTransition";

export default function Home() {
  return (
    <PageTransition>
      <SvgPipelines />
      <main className="flex flex-col">
        <Hero />
        <VisionMission />
        <IsaacSpotlight />
        <PhotoGallery />
        <SponsorTicker />
      </main>
    </PageTransition>
  );
}
