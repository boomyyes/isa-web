"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { HeroOrb } from "../three/HeroOrb";
import { AngularButton } from "../ui/AngularButton";
import { Terminal } from "lucide-react";

export function Hero() {
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const headline = "AUTOMATION FOR THE NEXT ERA";

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

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black font-inter tracking-tighter leading-none mb-8 max-w-2xl">
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
            className="text-lg md:text-xl text-[var(--text-secondary)] max-w-xl mb-12 font-medium"
          >
            Building the cyber-mechanical foundation for student-led industrial engineering and tomorrow&apos;s robotic enterprises.
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
            <AngularButton variant="outline" className="w-full sm:w-48">
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
          className="relative w-full h-[50vh] lg:h-[80vh] flex items-center justify-center pointer-events-none"
        >
          <HeroOrb mouseX={mousePos.x} mouseY={mousePos.y} />
        </motion.div>
        
      </div>
    </section>
  );
}
