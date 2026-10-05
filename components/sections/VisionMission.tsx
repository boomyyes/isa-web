"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { NeonFrame } from "@/components/ui/NeonFrame";

const MISSION = [
  "To promote experiential learning through technical workshops, industrial visits, research initiatives, competitions, and hands-on projects in automation and emerging technologies.",
  "To bridge the gap between academia and industry by fostering innovation, practical skills, professional networking, and industry collaboration.",
  "To encourage interdisciplinary collaboration, ethical engineering practices, leadership, and a culture of lifelong learning.",
  "To empower students to become competent professionals who contribute meaningfully to automation, industry, and society through creativity, technological excellence, and responsible innovation.",
];

// ISA's own core values, worded as the Society publishes them.
const VALUES = [
  ["Excellence", "We provide industry-leading unbiased content developed and vetted by a community of experts."],
  ["Integrity", "We act with honesty, integrity, and trust, respecting others in all that we do."],
  ["Diversity", "We are committed to being a global, diverse, and inclusive organization."],
  ["Collaboration", "We seek out opportunities to work together for the benefit of the Society, its members and our profession."],
  ["Professionalism", "We uphold the highest standards of competence and skill in everything we do."],
] as const;

function Statement({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <div className="clip-angular-reverse bg-[var(--card-color)]/60 p-6 md:p-8">
      <h3 className="font-jetbrains text-sm font-bold uppercase tracking-widest text-[var(--accent-color)]">
        {heading}
      </h3>
      <div className="mt-4 leading-relaxed text-[var(--text-primary)]">{children}</div>
    </div>
  );
}

export function VisionMission() {
  return (
    <section id="vision" className="py-20 md:py-32 relative z-20">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.45 }}
        className="container mx-auto px-6"
      >
        <div className="mb-16 flex items-center gap-4">
          <div className="h-px bg-[var(--border-color)] flex-1" />
          <h2 className="font-jetbrains text-xl font-bold tracking-widest uppercase text-[var(--text-primary)]">
            Who We Are
          </h2>
          <div className="h-px bg-[var(--border-color)] flex-1" />
        </div>

        {/* items-start: let each card keep its natural height so its neon frame
            hugs it, instead of stretching to match the taller sibling. */}
        <div className="grid items-start md:grid-cols-2 gap-8 lg:gap-16">
          <NeonFrame>
            <Statement heading="Vision">
              <p>
                To be a premier student community driving innovation, leadership, and engineering
                excellence, empowering the next generation of automation professionals to
                transform industries and create a smarter, sustainable future.
              </p>
            </Statement>
          </NeonFrame>

          <NeonFrame>
            <Statement heading="Mission">
              <ul className="space-y-3">
                {MISSION.map((line) => (
                  <li key={line} className="flex gap-3">
                    <span className="mt-[0.6em] h-1.5 w-1.5 shrink-0 bg-[var(--accent-color)]" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </Statement>
          </NeonFrame>
        </div>

        <div className="mt-8 lg:mt-16">
          <NeonFrame>
            <Statement heading="ISA Core Values">
              <dl className="grid gap-x-10 gap-y-5 md:grid-cols-2">
                {VALUES.map(([name, text]) => (
                  <div key={name}>
                    <dt className="font-jetbrains text-sm font-bold uppercase tracking-wider">
                      {name}
                    </dt>
                    <dd className="mt-1 text-[var(--text-secondary)]">{text}</dd>
                  </div>
                ))}
              </dl>
            </Statement>
          </NeonFrame>
        </div>
      </motion.div>
    </section>
  );
}
