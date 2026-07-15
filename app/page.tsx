import { Navbar } from "@/components/layout/Navbar";
import { SvgPipelines } from "@/components/layout/SvgPipelines";
import { Hero } from "@/components/sections/Hero";
import { VisionMission } from "@/components/sections/VisionMission";
import { IsaacSpotlight } from "@/components/sections/IsaacSpotlight";
import { PhotoGallery } from "@/components/sections/PhotoGallery";
import { SponsorTicker } from "@/components/sections/SponsorTicker";

export default function Home() {
  return (
    <>
      <Navbar />
      <SvgPipelines />
      <main className="flex flex-col">
        <Hero />
        <VisionMission />
        <IsaacSpotlight />
        <PhotoGallery />
        <SponsorTicker />
      </main>
      <footer className="py-8 bg-black text-[var(--text-secondary)] text-center font-jetbrains text-sm">
        <p>© 2026 ISA Student Committee. All rights reserved.</p>
        <p className="mt-2 text-xs opacity-50">[ SYS_HALT ]</p>
      </footer>
    </>
  );
}
