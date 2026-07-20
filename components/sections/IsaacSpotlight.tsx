"use client";

import { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { StatusBlock } from "@/components/ui/StatusBlock";

export function IsaacSpotlight() {
  const containerRef = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["15deg", "-15deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-15deg", "15deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <section id="spotlight" className="py-20 md:py-32 relative z-20 bg-[var(--bg-color)]">
      {/* The whole section animates as one block, and it contains a blur-2xl
          glow + a 3D-transformed cover — both of which repaint while it moves.
          Shorter travel and duration keep that window small. */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.45 }}
        className="container mx-auto px-6"
      >
        <div className="flex flex-col md:flex-row items-center justify-between mb-16 gap-6">
          <h2 className="text-4xl md:text-5xl font-black font-inter tracking-tighter uppercase">
            ISAAC Magazine (In Progress)
          </h2>
          <div className="flex flex-wrap gap-4">
            <StatusBlock value="ISSUE: #26" />
            <StatusBlock value="VOL: 2026" />
            <StatusBlock value="INACTIVE" progress={0} label="SUBSCRIBERS" />
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-12 items-center">
          {/* Left Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:block lg:space-y-6">
            <div className="p-6 border border-[var(--border-color)] bg-[var(--card-color)] clip-angular">
              <p className="text-xs font-jetbrains text-[var(--text-secondary)] mb-2">INDUSTRIES IN COLLABORATION</p>
              <p className="text-3xl font-bold font-inter text-[var(--text-primary)]">5</p>
              <p className="text-sm text-[var(--text-secondary)]">Latest Company: Siemens</p>
            </div>
            <div className="p-6 border border-[var(--border-color)] bg-[var(--card-color)] clip-angular">
              <p className="text-xs font-jetbrains text-[var(--text-secondary)] mb-2">UPCOMING WORKSHOP</p>
              <p className="text-xl font-bold font-inter text-[var(--text-primary)]">ROS- Robotic Operating Systems</p>
              <p className="text-sm text-[var(--text-secondary)] mt-1">Coming Soon.</p>
            </div>
          </div>

          {/* Center 3D Cover */}
          <div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="order-first lg:order-none perspective-[1000px] flex items-center justify-center py-12"
          >
            <motion.div
              style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
              className="relative w-full max-w-sm aspect-[3/4] rounded-sm group cursor-pointer"
            >
              {/* Glowing ring under */}
              <div className="absolute inset-0 bg-[var(--border-active)] blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-500 rounded-sm" />

              <div className="absolute inset-0 bg-gradient-to-tr from-[var(--border-color)] to-[var(--bg-color)] border border-[var(--border-active)] shadow-2xl overflow-hidden flex flex-col justify-between p-8">
                <div className="flex justify-between items-start">
                  <h3 className="font-inter font-black text-4xl text-[var(--text-primary)] leading-none tracking-tighter">
                    ISAAC<br />2026
                  </h3>
                  <div className="w-8 h-8 bg-[var(--border-active)] clip-angular" />
                </div>

                <div className="space-y-4">
                  <div className="h-0.5 w-full bg-[var(--text-primary)] opacity-20" />
                  <p className="font-jetbrains text-sm font-bold text-[var(--text-primary)] uppercase tracking-widest">
                    The Automation<br />Singularity
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:block lg:space-y-6">
            <div className="p-6 border border-[var(--border-color)] bg-[var(--card-color)] clip-angular-reverse">
              <p className="text-xs font-jetbrains text-[var(--text-secondary)] mb-2">PRINT STATUS</p>
              <div className="flex items-center gap-4">
                <div className="w-3 h-3 bg-red-500 animate-pulse" />
                <p className="text-xl font-bold font-inter text-[var(--text-primary)]">UNAVAILABLE</p>
              </div>
            </div>
            <div className="p-6 border border-[var(--border-color)] bg-[var(--card-color)] clip-angular-reverse">
              <p className="text-xs font-jetbrains text-[var(--text-secondary)] mb-2">COMMITTEE MEMBERS</p>
              <p className="text-xl font-bold font-inter text-[var(--text-primary)]">29</p>
              <p className="text-sm text-[var(--text-secondary)] mt-1">Students and Faculty.</p>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
