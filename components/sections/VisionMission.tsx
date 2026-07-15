"use client";

import { motion } from "framer-motion";
import { TerminalShell } from "@/components/ui/TerminalShell";

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
              "",
              "> Create a better world through automation.",
              "",
              "Status: ALIGNED",
            ]}
          />

          <TerminalShell
            title="bin/mission.sh"
            envStatus="OK"
            contentLines={[
              "Executing mission parameters...",
              "",
              "> Empowering the global automation community",
              "> through standards and knowledge sharing.",
              "",
              "Status: ACTIVE",
            ]}
          />
        </div>

        <div className="mt-8 lg:mt-16">
          <TerminalShell
            title="bin/values.sh"
            envStatus="OK"
            contentLines={[
              "Enumerating core values...",
              "",
              "[EXCELLENCE]    We provide industry-leading unbiased content developed and vetted by a community of experts.",
              "[INTEGRITY]     We act with honesty, integrity, and trust — respecting others in all that we do.",
              "[DIVERSITY]     We are committed to being a global, diverse, and inclusive organization.",
              "[COLLABORATION] We seek out opportunities to work together for the benefit of the Society, its members and our profession.",
              "[PROFESSIONAL]  We uphold the highest standards of competence and skill in everything we do.",
              "",
              "Status: LOADED // 5 values initialized",
            ]}
          />
        </div>
      </motion.div>
    </section>
  );
}
