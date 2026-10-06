import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/layout/LegalPage";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...pageMetadata({
    path: "/terms",
    title: "Terms of Use",
    description: "The terms for using isarait.in, the ISA RAIT Student Chapter website.",
  }),
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Use" updated="5 October 2026">
      <p>
        isarait.in is run by the ISA RAIT Student Chapter at Ramrao Adik Institute of
        Technology, Navi Mumbai. By using it you agree to these terms.
      </p>

      <h2>Using the site</h2>
      <p>
        Use the site for its purpose: finding out about the chapter, joining it, registering for
        events and getting your certificates. Do not try to access another person&apos;s
        certificates, get around the rate limits, or interfere with the site&apos;s operation.
      </p>

      <h2>Certificates</h2>
      <p>
        Certificates are issued only for recorded attendance. A certificate is genuine only if
        it can be downloaded from the certificate portal on this site. We may withdraw a
        certificate that was obtained by misrepresentation.
      </p>

      <h2>Content and marks</h2>
      <p>
        Text, photographs and designs on this site belong to the chapter or their respective
        authors. The ISA name and logo are trademarks of the International Society of
        Automation. Do not reuse them
        without permission.
      </p>

      <h2>No warranty</h2>
      <p>
        We keep the site accurate and available as best we can, but it is provided as it is.
        Event details can change, and the announcement from the committee is the one that
        counts.
      </p>

      <h2>Privacy</h2>
      <p>
        How we handle personal data is set out in our <Link href="/privacy">Privacy Policy</Link>.
      </p>

      <h2>Law</h2>
      <p>
        These terms are governed by the laws of India, and the courts at Navi Mumbai have
        jurisdiction.
      </p>
    </LegalPage>
  );
}
