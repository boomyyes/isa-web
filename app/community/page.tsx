import type { Metadata } from "next";
import Image from "next/image";
import { PageTransition } from "@/components/layout/PageTransition";
import { ProfileCard } from "@/components/ui/ProfileCard";
import {
  core,
  faculty,
  jointCore,
  principal,
  subCore,
  type TeamMember,
} from "@/lib/data";

export const metadata: Metadata = {
  title: "Community | ISA RAIT",
  description:
    "Meet the faculty, core, sub-core, and joint-core team behind the ISA RAIT student chapter.",
};

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
          socials={m.socials}
        />
      ))}
    </div>
  );
}

export default function CommunityPage() {
  return (
    <PageTransition>
      <main className="mx-auto max-w-7xl px-6 pt-24 md:pt-32 pb-16 md:pb-24">
        {/* Principal's Blog */}
        <section className="relative overflow-hidden rounded-3xl border border-[var(--border-color)]/60 bg-[var(--card-color)]/40 p-8 backdrop-blur-md md:p-12">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-16 -right-10 h-48 w-72 rounded-full opacity-20 blur-3xl"
            style={{ background: "var(--border-active)" }}
          />
          <p className="relative font-jetbrains text-xs uppercase tracking-[0.3em] text-[var(--accent-color)]">
            [ Principal&apos;s Blog ]
          </p>

          <div className="relative mt-6 flex flex-col gap-8 md:flex-row md:items-start">
            {/* Portrait. The source is 544x700, so it is framed at its own 4:5-ish
                ratio rather than cropped square — a square would cut the shot. */}
            <div className="w-fit shrink-0 overflow-hidden rounded-2xl border border-[var(--border-active)]/40 bg-[var(--bg-color)]/60 shadow-[0_0_24px_rgba(0,229,255,0.12)]">
              <Image
                src={principal.photo}
                alt={`${principal.name}, ${principal.title}`}
                width={544}
                height={700}
                sizes="(max-width: 768px) 176px, 224px"
                className="h-auto w-44 md:w-56"
              />
            </div>

            {/* Message */}
            <div className="flex-1">
              <h1 className="font-jetbrains text-2xl md:text-4xl font-bold tracking-tight text-[var(--text-primary)]">
                {principal.name} — A Message to ISA
              </h1>
              <p className="mt-1 font-jetbrains text-xs uppercase tracking-widest text-[var(--text-secondary)]">
                {principal.title}
              </p>
              <div className="mt-6 max-w-3xl space-y-4">
                {principal.message.map((paragraph, i) => (
                  <p key={i} className="text-base leading-relaxed text-[var(--text-secondary)]">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Faculty */}
        <section className="mt-20">
          <SectionHeading eyebrow="[ Guidance ]" title="Faculty" />
          <div className="mx-auto max-w-2xl">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {faculty.map((m) => (
                <ProfileCard
                  key={m.id}
                  role={m.role}
                  name={m.name}
                  type="faculty"
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
