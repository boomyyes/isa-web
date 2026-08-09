import type { Metadata } from "next";
import Image from "next/image";
import { UserRound } from "lucide-react";
import { PageTransition } from "@/components/layout/PageTransition";
import { LinkedinIcon } from "@/components/ui/BrandIcons";
import { ClampedText } from "@/components/ui/ClampedText";
import { ProfileCard } from "@/components/ui/ProfileCard";
import {
  core,
  faculty,
  facultyMentor,
  jointCore,
  principal,
  subCore,
  type TeamMember,
} from "@/lib/data";
import { isRealImage } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Community | ISA RAIT",
  description:
    "Meet the faculty, core, sub-core, and joint-core team behind the ISA RAIT student chapter.",
};

/**
 * One leader's note: portrait, heading, paragraphs, optional footer.
 *
 * The inner layout goes row at md (card is still full width) and back to a
 * column at lg, because that is where the page splits into two columns and each
 * card drops to roughly half width — a 224px portrait beside the text there
 * would leave the paragraphs in a ~330px gutter.
 */
function BlogNote({
  eyebrow,
  name,
  title,
  photo,
  message,
  headingLevel = "h2",
  footer,
}: {
  eyebrow: string;
  name: string;
  title: string;
  photo: string;
  message: string[];
  /** The principal's note is the page's h1; anything alongside it is an h2. */
  headingLevel?: "h1" | "h2";
  footer?: React.ReactNode;
}) {
  const Heading = headingLevel;
  return (
    <section className="relative flex flex-col overflow-hidden rounded-3xl border border-[var(--border-color)]/60 bg-[var(--card-color)]/40 p-8 backdrop-blur-md md:p-12">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-16 -right-10 h-48 w-72 rounded-full opacity-20 blur-3xl"
        style={{ background: "var(--border-active)" }}
      />
      <p className="relative font-jetbrains text-xs uppercase tracking-[0.3em] text-[var(--accent-color)]">
        {eyebrow}
      </p>

      <div className="relative mt-6 flex flex-1 flex-col gap-8 md:flex-row md:items-start lg:flex-col">
        {/* Portrait, framed 4:5. object-top so a taller source crops from the
            bottom rather than cutting the face. */}
        <div className="relative aspect-[4/5] w-44 shrink-0 overflow-hidden rounded-2xl border border-[var(--border-active)]/40 bg-[var(--bg-color)]/60 shadow-[0_0_24px_rgba(0,229,255,0.12)] md:w-56">
          {isRealImage(photo) ? (
            <Image
              src={photo}
              alt={`${name}, ${title}`}
              fill
              sizes="(max-width: 768px) 176px, 224px"
              className="object-cover object-top"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-3 text-center text-[var(--text-secondary)]">
              <UserRound className="h-12 w-12" />
              <span className="font-jetbrains text-[10px] opacity-70 break-all">
                {photo}
              </span>
            </div>
          )}
        </div>

        {/* Message */}
        <div className="flex flex-1 flex-col">
          <Heading className="font-jetbrains text-2xl font-bold tracking-tight text-[var(--text-primary)] md:text-4xl lg:text-3xl">
            {name} — A Message to ISA
          </Heading>
          <p className="mt-1 font-jetbrains text-xs uppercase tracking-widest text-[var(--text-secondary)]">
            {title}
          </p>
          {/* Collapsed on phones only — these notes run to roughly 50 lines
              there, and two of them stacked would push the whole roster below
              three screenfuls. */}
          <ClampedText
            text={message}
            lines={8}
            className="mt-6 max-w-3xl"
            textClassName="space-y-4 text-base leading-relaxed text-[var(--text-secondary)]"
          />
          {/* mt-auto pins the footer to the bottom of the card even when this
              note is shorter than the one beside it. */}
          {footer && <div className="mt-auto flex justify-end pt-8">{footer}</div>}
        </div>
      </div>
    </section>
  );
}

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mb-8">
      <p className="font-jetbrains text-xs uppercase tracking-[0.3em] text-[var(--accent-color)]">
        {eyebrow}
      </p>
      <h2 className="mt-2 font-jetbrains text-3xl md:text-4xl font-bold tracking-tight text-[var(--text-primary)]">
        {title}
      </h2>
    </div>
  );
}

function ProfileGrid({
  members,
  type = "student",
}: {
  members: TeamMember[];
  type?: "faculty" | "student";
}) {
  return (
    <div className="grid grid-cols-2 items-start gap-4 md:grid-cols-4 lg:grid-cols-5">
      {members.map((m) => (
        <ProfileCard
          key={m.id}
          role={m.role}
          name={m.name}
          type={type}
          photo={m.photo}
          socials={m.socials}
        />
      ))}
    </div>
  );
}

export default function CommunityPage() {
  // Pulled off the shared roster record rather than hardcoded. Undefined until a
  // real URL is set, which is what hides the corner link below.
  const mentorLinkedin = facultyMentor.socials.find(
    (link) => link.platform === "linkedin"
  )?.href;

  return (
    <PageTransition>
      <main className="mx-auto max-w-7xl px-6 pt-24 md:pt-32 pb-16 md:pb-24">
        {/* Leadership notes. Two columns from lg, where there is room for the
            mentor's note beside the principal's; stacked below that. */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <BlogNote
            eyebrow="[ Principal's Blog ]"
            name={principal.name}
            title={principal.title}
            photo={principal.photo}
            message={principal.message}
            headingLevel="h1"
          />
          <BlogNote
            eyebrow="[ Faculty Mentor's Blog ]"
            name={facultyMentor.name}
            title={facultyMentor.title}
            photo={facultyMentor.photo}
            message={facultyMentor.message}
            footer={
              mentorLinkedin && (
              <a
                href={mentorLinkedin}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex min-h-11 items-center gap-2 rounded-md border border-[var(--border-color)]/60 px-4 py-1.5 font-jetbrains text-xs text-[var(--text-secondary)] transition-colors hover:border-[var(--border-active)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-active)]"
              >
                <LinkedinIcon className="h-3.5 w-3.5" />
                LinkedIn
              </a>
              )
            }
          />
        </div>

        {/* Faculty */}
        <section className="mt-20">
          <SectionHeading eyebrow="[ Guidance ]" title="Faculty" />
          {/* auto-fit + justify-center so the row stays centred whatever the
              count: one card sits in the middle rather than hugging the left,
              and adding faculty back fills the second column automatically. */}
          <div className="mx-auto max-w-2xl">
            <div className="grid grid-cols-1 justify-center gap-6 sm:grid-cols-[repeat(auto-fit,minmax(0,16rem))]">
              {faculty.map((m) => (
                <ProfileCard
                  key={m.id}
                  role={m.role}
                  name={m.name}
                  type="faculty"
                  photo={m.photo}
                  socials={m.socials}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Core */}
        <section className="mt-20">
          <SectionHeading eyebrow="[ Leadership ]" title="Core Team" />
          <ProfileGrid members={core} />
        </section>

        {/* Sub-Core */}
        <section className="mt-20">
          <SectionHeading eyebrow="[ Operations ]" title="Sub-Core Team" />
          <ProfileGrid members={subCore} />
        </section>

        {/* Joint-Core */}
        <section className="mt-20">
          <SectionHeading eyebrow="[ Domains ]" title="Joint-Core Team" />
          <div className="space-y-12">
            {jointCore.map((domain) => (
              <div key={domain.domain}>
                <div className="mb-5 flex items-center gap-4">
                  <h3 className="font-jetbrains text-lg font-bold text-[var(--text-primary)]">
                    {domain.domain}
                  </h3>
                  <span className="font-jetbrains text-xs text-[var(--text-secondary)]">
                    {domain.members.length} member
                    {domain.members.length > 1 ? "s" : ""}
                  </span>
                  <div className="h-px flex-1 bg-[var(--border-color)]/60" />
                </div>
                <ProfileGrid members={domain.members} />
              </div>
            ))}
          </div>
        </section>
      </main>
    </PageTransition>
  );
}
