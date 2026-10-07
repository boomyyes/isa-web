"use client";

import dynamic from "next/dynamic";
import { useMediaQuery } from "@/hooks/useMediaQuery";

// Loaded only on md+ screens, after hydration. Phones never download it, and
// the canvas can never be the LCP element because the headline paints first.
const DitherField = dynamic(() => import("./DitherField").then((mod) => mod.DitherField), {
  ssr: false,
});

export function HeroGear() {
  const show = useMediaQuery("(min-width: 768px)");
  return show ? <DitherField className="h-full w-full" /> : null;
}
