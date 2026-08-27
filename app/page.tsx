import { SvgPipelines } from "@/components/layout/SvgPipelines";
import { Hero } from "@/components/sections/Hero";
import { VisionMission } from "@/components/sections/VisionMission";
import { IsaacSpotlight } from "@/components/sections/IsaacSpotlight";
import { PhotoGallery } from "@/components/sections/PhotoGallery";
import { SponsorTicker } from "@/components/sections/SponsorTicker";
import { PageTransition } from "@/components/layout/PageTransition";
import { isaacPageCount } from "@/lib/isaac.server";

export default async function Home() {
  // Resolved here rather than inside the client component: the Drive file IDs
  // that back the reader must never cross to the browser, so only the count does.
  const isaacPageCountValue = await isaacPageCount();

  return (
    <PageTransition>
      <SvgPipelines />
      <main className="flex flex-col">
        <Hero />
        <VisionMission />
        <IsaacSpotlight pageCount={isaacPageCountValue} />
        <PhotoGallery />
        <SponsorTicker />
      </main>
    </PageTransition>
  );
}
