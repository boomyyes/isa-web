import type { Metadata } from "next";
import { PageTransition } from "@/components/layout/PageTransition";
import { InitiativesHub } from "@/components/sections/InitiativesHub";

export const metadata: Metadata = {
  title: "Initiatives Hub | ISA RAIT",
  description:
    "Running projects, upcoming events, and articles from the ISA RAIT student chapter.",
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
