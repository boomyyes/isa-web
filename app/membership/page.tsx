import type { Metadata } from "next";
import { PageTransition } from "@/components/layout/PageTransition";
import { MembershipContent } from "@/components/sections/MembershipContent";

export const metadata: Metadata = {
  title: "Membership | ISA RAIT",
  description:
    "Join the ISA-RAIT student community — connect with knowledge, networks, and opportunities to build a successful career in automation.",
};

export default function MembershipPage() {
  return (
    <PageTransition>
      <MembershipContent />
    </PageTransition>
  );
}
