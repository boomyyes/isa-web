"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { AngularButton } from "@/components/ui/AngularButton";
import { Terminal } from "lucide-react";
import { useMediaQuery } from "@/hooks/useMediaQuery";

// three + @react-three/fiber is ~170KB gzipped and the scene's only input is
// the mouse, so it is dead weight on a phone. Loading it lazily keeps it out of
// the homepage's first bundle entirely; the md gate below keeps it off small
// screens even after hydration.
const HeroOrb = dynamic(
  () => import("@/components/three/HeroOrb").then((m) => m.HeroOrb),
  { ssr: false }
);

export function Hero() {
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  // False on the server and on phones, so the orb never mounts there.
  const showOrb = useMediaQuery("(min-width: 768px)");

  useEffect(() => {
    // No orb, no reason to re-render this whole section on every pointer move.
    if (!showOrb) return;
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [showOrb]);

  const headline = "INTERNATIONAL SOCIETY OF AUTOMATION, RAIT";

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
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

          {/* text-3xl at the base step, not text-4xl: each word below is an
              inline-block with overflow-hidden (that clip is what masks the
              slide-up reveal), so "INTERNATIONAL" too wide for the column gets
              cut mid-letter instead of wrapping. At 36px it overflowed a 360px
              screen. sm: and up are unchanged. */}
          <h1 className="text-3xl sm:text-6xl md:text-7xl lg:text-8xl font-black font-inter tracking-tighter leading-none mb-6 md:mb-8 max-w-2xl">
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
            className="text-lg md:text-xl text-[var(--text-secondary)] max-w-xl mb-6 md:mb-8 font-medium"
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
            <AngularButton variant="primary" href="https://forms.gle/ZL1QSLHD2SkmDpS66g" target="_blank" className="w-full sm:w-48">
              Join the Committee
            </AngularButton>
            <AngularButton variant="outline" href="/initiatives#projects" className="w-full sm:w-48">
              Explore Projects
            </AngularButton>
          </motion.div>
        </motion.div>

        {/* Right Column: 3D Orb */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="relative hidden w-full h-[40vh] sm:h-[50vh] lg:h-[80vh] items-center justify-center pointer-events-none md:flex"
        >
          {showOrb && <HeroOrb mouseX={mousePos.x} mouseY={mousePos.y} />}
        </motion.div>

      </div>
    </section>
  );
}
