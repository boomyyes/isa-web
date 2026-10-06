import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { PageTransition } from "@/components/layout/PageTransition";
import { InitiativesHub } from "@/components/sections/InitiativesHub";

export const metadata: Metadata = {
  ...pageMetadata({
    path: "/initiatives",
    title: "Initiatives Hub",
    description:
      "Running projects, upcoming events, achievements, and articles from the ISA RAIT student chapter.",
  }),
};

export default function InitiativesPage() {
  return (
    <PageTransition>
      <main className="min-h-screen">
        <InitiativesHub />
      </main>
    </PageTransition>
  );
}
