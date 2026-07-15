"use client";

import { motion } from "framer-motion";
import { GALLERY_IMAGES } from "@/lib/data";
import { HolographicCard } from "@/components/ui/HolographicCard";
import { cn } from "@/lib/utils";

export function PhotoGallery() {
  return (
    <section id="gallery" className="py-32 relative z-20 bg-[var(--bg-color)] border-t border-[var(--border-color)]">
      <div className="container mx-auto px-6">
        <motion.h2 
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5 }}
          className="text-4xl md:text-5xl font-black font-inter tracking-tighter uppercase mb-16"
        >
          Visual Telemetry
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-[300px]">
          {GALLERY_IMAGES.map((img, i) => (
            <motion.div
              key={img.id}
              initial={{ opacity: 0, y: 100 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ duration: 0.8, delay: i * 0.1 }}
              className={cn(
                i === 0 ? "md:col-span-2 md:row-span-2" : "",
                i === 3 ? "lg:col-span-2" : "",
                "h-full w-full"
              )}
            >
              <HolographicCard
                className={cn(
                  "group relative overflow-hidden w-full h-full",
                  i === 0 ? "clip-angular" : "clip-angular-reverse"
                )}
              >
                {/* Base image with grayscale and scanlines by default */}
                <div 
                  className="absolute inset-0 bg-cover bg-center transition-all duration-500 grayscale group-hover:grayscale-0 group-hover:scale-105"
                  style={{ backgroundImage: `url(${img.url})` }}
                />
                
                {/* Scanline overlay - disappears on hover */}
                <div className="absolute inset-0 scanline opacity-100 group-hover:opacity-0 transition-opacity duration-500 pointer-events-none" />
                
                {/* Optional Color Tint Overlay */}
                <div className="absolute inset-0 bg-[var(--bg-color)]/20 mix-blend-overlay group-hover:opacity-0 transition-opacity duration-500 pointer-events-none" />

                {/* Label */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                  <p className="font-jetbrains text-sm font-bold text-white uppercase tracking-widest">{img.alt}</p>
                </div>
              </HolographicCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
