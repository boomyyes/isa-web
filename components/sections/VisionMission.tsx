"use client";

import { motion } from "framer-motion";
import { TerminalShell } from "../ui/TerminalShell";

export function VisionMission() {
  return (
    <section id="vision" className="py-32 relative z-20 bg-[var(--bg-color)]">
      <motion.div 
        initial={{ opacity: 0, y: 100 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.8 }}
        className="container mx-auto px-6"
      >
        <div className="mb-16 flex items-center gap-4">
          <div className="h-px bg-[var(--border-color)] flex-1" />
          <h2 className="font-jetbrains text-xl font-bold tracking-widest uppercase text-[var(--text-primary)]">
            Core Directives
          </h2>
          <div className="h-px bg-[var(--border-color)] flex-1" />
        </div>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-16">
          <TerminalShell
            title="bin/vision.sh"
            envStatus="OK"
            contentLines={[
              "Loading vision protocol...",
              "> To be the premier student platform for industrial automation.",
              "> Fostering innovation through robotics, PLC programming, and AI.",
              "> Bridging the gap between academic theory and industry reality.",
              "",
              "Status: ALIGNED",
            ]}
          />

          <TerminalShell
            title="bin/mission.sh"
            envStatus="OK"
            contentLines={[
              "Executing mission parameters...",
              "1. Organize cutting-edge technical workshops.",
              "2. Connect students with industry titans.",
              "3. Build autonomous systems that solve real problems.",
              "4. Publish Isaac magazine to share our findings.",
              "",
              "Status: ACTIVE",
            ]}
          />
        </div>
      </motion.div>
    </section>
  );
}
