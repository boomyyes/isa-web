import type { Metadata } from "next";
import { LegalPage } from "@/components/layout/LegalPage";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...pageMetadata({
    path: "/privacy",
    title: "Privacy Policy",
    description:
      "What personal data the ISA RAIT Student Chapter collects, why, who processes it, how long it is kept, and how to exercise your rights under India's DPDP Act, 2023.",
  }),
};

const CONTACT = "isa.rait@rait.ac.in";

// Written against the Digital Personal Data Protection Act, 2023 and its 2025
// Rules. Section numbers in comments are the Act's, for whoever next revises
// this. Change `updated` whenever the substance changes.
export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="5 October 2026">
      <p>
        This policy explains how the ISA RAIT Student Chapter handles personal data collected
        through isarait.in. We have tried to keep it short and specific. If anything here is
        unclear, write to us at <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.
      </p>

      {/* s.2(i) Data Fiduciary; s.8(9) contact */}
      <h2>Who is responsible</h2>
      <p>
        The ISA RAIT Student Chapter, Ramrao Adik Institute of Technology, DY Patil University,
        Sector 7, Nerul, Navi Mumbai 400706, decides why and how your data is used. Privacy
        questions, requests and complaints go to the Chapter Secretary at{" "}
        <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.
      </p>

      {/* s.5 notice: itemised data and purpose */}
      <h2>What we collect and why</h2>
      <p>
        <strong>Certificates.</strong> When you attend a chapter workshop, we hold your UID,
        name, college, email address, which workshops you attended, and a one-way hash of your
        access code (never the code itself). We use these only to issue your certificates, let
        you download them, and email you your access code or a reset link. Your email address
        is never shown on the site or returned by it.
      </p>
      <p>
        <strong>Abuse protection.</strong> When you sign in to the certificate portal or request
        a reset, your IP address is counted to limit repeated attempts. These counters expire on
        their own within about two hours and are not used for anything else.
      </p>
      <p>
        <strong>Forms.</strong> Membership sign-up, event registration and support queries use
        forms hosted by Google Forms and Tally. They collect what each form asks for, and we use
        it only for the purpose stated on that form.
      </p>
      <p>
        We do not run analytics or advertising, and we do not sell or share your data for
        marketing.
      </p>

      {/* s.6 consent, s.7(a) voluntarily provided data */}
      <h2>Our basis for using it</h2>
      <p>
        Certificate data is data you gave us yourself in order to receive a certificate, and we
        use it for nothing beyond that. Form submissions are processed with your consent, which
        you can withdraw at any time by emailing us. Withdrawing consent does not affect anything
        done before it.
      </p>

      {/* s.8(2) processors; s.16 cross-border transfer */}
      <h2>Who processes it for us</h2>
      <ul>
        <li>Vercel hosts the website.</li>
        <li>Upstash stores certificate records and the abuse-protection counters.</li>
        <li>Cloudflare R2 stores the certificate files.</li>
        <li>
          Google stores the attendance roster (Sheets), sends our emails (Gmail), and hosts some
          of our forms.
        </li>
        <li>Tally hosts the support and event registration forms.</li>
      </ul>
      <p>
        Some of these providers store data outside India. They process it only on our
        instructions and under their own security commitments.
      </p>

      {/* s.8(7) erasure once the purpose is served */}
      <h2>How long we keep it</h2>
      <p>
        Certificate records are kept so you can download your certificates later, and are
        deleted one year after you graduate or leave the chapter, whichever comes first. Form
        responses are deleted once the event or query they relate to is over and no longer needs
        follow-up. You can ask us to delete your data sooner.
      </p>

      {/* ss.11-14 rights; s.13(3) the Board */}
      <h2>Your rights</h2>
      <ul>
        <li>Ask what personal data we hold about you and who we have shared it with.</li>
        <li>Ask us to correct, complete, update or erase it.</li>
        <li>Withdraw consent you have given.</li>
        <li>Nominate someone to exercise these rights if you die or become incapacitated.</li>
        <li>Complain to us, and get a response within 30 days.</li>
      </ul>
      <p>
        Email <a href={`mailto:${CONTACT}`}>{CONTACT}</a> from the address we have on file, or
        tell us your UID. If you are not satisfied with how we handle a complaint, you can take
        it to the Data Protection Board of India.
      </p>

      {/* s.9 children */}
      <h2>If you are under 18</h2>
      <p>
        Indian law requires a parent or guardian&apos;s consent before we process the data of
        anyone under 18. If you are under 18, please ask a parent or guardian to email us before
        you fill in any of our forms.
      </p>

      {/* s.8(5) safeguards; s.8(6) breach intimation */}
      <h2>Security</h2>
      <p>
        Access codes are stored only as salted hashes, certificate downloads use short-lived
        signed links, and access to our systems is limited to the committee members who need it.
        If a breach affects your data, we will tell you and the Data Protection Board of India.
      </p>

      <h2>Cookies</h2>
      <p>
        This site sets no tracking or advertising cookies. Your light or dark theme choice is
        saved in your own browser and never sent to us.
      </p>

      <h2>Changes</h2>
      <p>
        If we change this policy, we will update the date at the top of this page.
      </p>
    </LegalPage>
  );
}
