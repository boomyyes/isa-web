"use client";

import * as React from "react";
import { motion, useTransform } from "framer-motion";
import { useScrollProgress } from "@/hooks/useScrollProgress";

export function SvgPipelines() {
  const { scrollYProgress } = useScrollProgress();
  const yPosition = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);
  const yPositionInverted = useTransform(scrollYProgress, [0, 1], ["100%", "0%"]);

  return (
    <div className="pointer-events-none fixed inset-0 z-40 hidden overflow-hidden mix-blend-difference sm:block">
      {/* Left Pipeline */}
      <svg className="absolute left-4 top-0 w-8 h-full" preserveAspectRatio="none">
        <path
          d="M 16 0 V 10000"
          stroke="var(--border-color)"
          strokeWidth="1"
          fill="none"
          strokeDasharray="4 4"
        />
        <motion.circle
          cx="16"
          cy={yPosition as unknown as number}
          r="4"
          fill="var(--border-active)"
          className="shadow-[0_0_10px_var(--border-active)]"
        />
      </svg>

      {/* Right Pipeline */}
      <svg className="absolute right-4 top-0 w-8 h-full" preserveAspectRatio="none">
        <path
          d="M 16 0 V 10000"
          stroke="var(--border-color)"
          strokeWidth="1"
          fill="none"
        />
        <motion.circle
          cx="16"
          cy={yPositionInverted as unknown as number}
          r="4"
          fill="var(--border-active)"
          className="shadow-[0_0_10px_var(--border-active)]"
        />
      </svg>
    </div>
  );
}
