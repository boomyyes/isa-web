import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { PageTransition } from "@/components/layout/PageTransition";
import { MembershipContent } from "@/components/sections/MembershipContent";

export const metadata: Metadata = {
  ...pageMetadata({
    path: "/membership",
    title: "Membership",
    description:
      "Join the ISA-RAIT student community and connect with knowledge, networks, and opportunities to build a successful career in automation.",
  }),
};

export default function MembershipPage() {
  return (
    <PageTransition>
      <MembershipContent />
    </PageTransition>
  );
}
