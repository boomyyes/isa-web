"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import dynamic from "next/dynamic";
import { AngularButton } from "@/components/ui/AngularButton";
import { AsciiBackground } from "@/components/ui/AsciiBackground";
import { Terminal } from "lucide-react";

// three.js pulls in WebGL/DOM APIs, so the globe is client-only (no SSR).
const Globe = dynamic(() => import("@/components/ui/Globe"), { ssr: false });

// Navi Mumbai, Maharashtra, India. Stable array identity so the marker prop
// doesn't churn between renders (color/size are folded in per-theme below).
const NAVI_MUMBAI = { lat: 19.033, lng: 73.0297 };
const GLOBE_MARKER_POINTS = [NAVI_MUMBAI];

export function Hero() {
  const headline = "INTERNATIONAL SOCIETY OF AUTOMATION, RAIT.";

  // Theme-aware globe palette. The ocean matches the page background so it
  // occludes the far hemisphere; the marker + glow use the site accent (cyan in
  // dark, orange in light). Memoized per theme so the Globe effect only rebuilds
  // on an actual toggle.
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme !== "light";

  // Hold the globe back ~2s after mount. Keeps its heavy three.js build well off
  // the critical path, and gives the hero a beat before the globe animates in.
  const [showGlobe, setShowGlobe] = useState(false);
  useEffect(() => {
    const id = window.setTimeout(() => setShowGlobe(true), 2000);
    return () => clearTimeout(id);
  }, []);
  const globe = useMemo(
    () => ({
      dots: { color: dark ? "#ffffff" : "#1A1A1A", size: 5, density: 8, allDots: false },
      ocean: dark ? "#0D0D0D" : "#F4F7FA",
      graticule: dark ? "rgba(255,255,255,0.12)" : "rgba(13,13,13,0.12)",
      accent: dark ? "#00E5FF" : "#E65100",
      marker: {
        markers: GLOBE_MARKER_POINTS,
        color: dark ? "#00E5FF" : "#E65100",
        size: 60,
      },
    }),
    [dark]
  );

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* ASCII waves, scoped to this section. The site-wide backdrop in the root
          layout opts out on "/" so the waves stop at the end of the hero. */}
      <AsciiBackground contained />

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
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-start text-left pt-12 lg:pt-0"
        >
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-2 mb-6 text-[var(--border-active)] font-jetbrains text-sm font-bold tracking-widest"
          >
            <Terminal size={16} />
            <span>&gt; SYS.BOOT SEQUENCE INITIATED</span>
          </motion.div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black font-inter tracking-tighter leading-none mb-6 md:mb-8 max-w-2xl">
            {headline.split(" ").map((word, i) => (
              <span key={i} className="inline-block mr-[0.2em] overflow-hidden">
                <motion.span
                  className="inline-block"
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  transition={{
                    duration: 0.5,
                    delay: i * 0.1,
                    ease: [0.33, 1, 0.68, 1],
                  }}
                >
                  {word}
                </motion.span>
              </span>
            ))}
          </h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="text-lg md:text-xl text-[var(--text-secondary)] max-w-xl mb-8 md:mb-12 font-medium"
          >
            ISA-RAIT is a student chapter of ISA international under the ISA Maharashtra section.
            ISA-RAIT aims to bridge the gap between the students and the Industry by developing technical knowledge of the students.
            We conduct workshops and arrange seminars to develop the technical and other required skills of the students
            to make them industry-ready.
            ISA was founded in 1945 and excels in technical competence.
            The organization certifies Industry professionals; provides education and training; publishes books and technical articles;
            hosts conferences and has 40,000 members around the world creating a better world through Automation.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
            className="flex flex-col sm:flex-row gap-6 w-full sm:w-auto"
          >
            <AngularButton variant="primary" className="w-full sm:w-48">
              Join the Committee
            </AngularButton>
            <AngularButton variant="outline" href="/initiatives#projects" className="w-full sm:w-48">
              Explore Projects
            </AngularButton>
          </motion.div>
        </motion.div>

        {/* Right Column: interactive, drag-to-rotate globe */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="relative w-full h-[40vh] sm:h-[50vh] lg:h-[80vh] flex items-center justify-center"
        >
          {/* Ambient accent glow bloom. Held back with the globe and eased in
              alongside it, so the whole column arrives as one entrance. */}
          <motion.div
            aria-hidden
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: showGlobe ? 0.5 : 0, scale: showGlobe ? 1 : 0.8 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="pointer-events-none absolute aspect-square h-[70%] rounded-full blur-3xl"
            style={{ background: `radial-gradient(circle, ${globe.accent} 0%, transparent 70%)` }}
          />
          {showGlobe && (
            <Globe
              initialLatitude={NAVI_MUMBAI.lat}
              initialLongitude={-NAVI_MUMBAI.lng}
              markerConfig={globe.marker}
              dots={globe.dots}
              oceanColor={globe.ocean}
              graticuleColor={globe.graticule}
              // Land is already drawn by the dots; skipping the continent
              // outlines avoids building a TubeGeometry per coastline ring,
              // which was the bulk of the mount-time main-thread stall.
              showOutline={false}
              style={{ filter: `drop-shadow(0 0 24px ${globe.accent})` }}
            />
          )}
        </motion.div>

      </div>
    </section>
  );
}
