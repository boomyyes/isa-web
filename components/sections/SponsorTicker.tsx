"use client";

import { motion } from "framer-motion";
import { SPONSORS } from "@/lib/data";

export function SponsorTicker() {
  // Duplicate for seamless loop
  const marqueeItems = [...SPONSORS, ...SPONSORS];

  return (
    <section id="sponsors" className="py-16 md:py-24 relative z-20 bg-[var(--bg-color)] border-y border-[var(--border-color)] overflow-hidden">
      <motion.div 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 1 }}
        className="w-full"
      >
        <div className="container mx-auto px-6 mb-12">
          <h2 className="font-jetbrains text-sm font-bold tracking-widest uppercase text-[var(--text-secondary)] text-center">
            Supported By Industry Leaders
          </h2>
        </div>

        <div className="relative w-full flex overflow-hidden group">
          <div className="flex animate-marquee">
            {marqueeItems.map((sponsor, i) => (
              <div
                key={`${sponsor.id}-${i}`}
                className="flex-shrink-0 w-64 mx-8 relative group/logo"
              >
                <div className="h-24 flex items-center justify-center border border-[var(--border-color)] bg-[var(--card-color)] opacity-40 hover:opacity-100 transition-all duration-300 cursor-pointer clip-angular">
                  <span className="font-inter font-black text-2xl uppercase tracking-tighter text-[var(--text-primary)]">
                    {sponsor.name}
                  </span>
                </div>
                {/* Neon Underglow */}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-[var(--border-active)] shadow-[0_0_15px_var(--border-active)] opacity-0 group-hover/logo:opacity-100 transition-opacity duration-300" />
              </div>
            ))}
          </div>
          <div className="flex animate-marquee" aria-hidden="true">
            {marqueeItems.map((sponsor, i) => (
              <div
                key={`${sponsor.id}-${i}-dup`}
                className="flex-shrink-0 w-64 mx-8 relative group/logo"
              >
                <div className="h-24 flex items-center justify-center border border-[var(--border-color)] bg-[var(--card-color)] opacity-40 hover:opacity-100 transition-all duration-300 cursor-pointer clip-angular">
                  <span className="font-inter font-black text-2xl uppercase tracking-tighter text-[var(--text-primary)]">
                    {sponsor.name}
                  </span>
                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-[var(--border-active)] shadow-[0_0_15px_var(--border-active)] opacity-0 group-hover/logo:opacity-100 transition-opacity duration-300" />
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
