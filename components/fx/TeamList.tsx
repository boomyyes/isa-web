// The /community roster as an editorial list, after the team page on
// quatrecentquatre.com/agence: role pills on the left, a large name on the
// right, hairlines between rows, and the person's portrait appearing over the
// middle column while their row is hovered or focused. The code is our own.
//
// A server component with no client JS. The hover is CSS (group-hover and
// group-focus-within, so tabbing onto a name shows the portrait too), and the
// scroll slide-in is a CSS view timeline (.fx-row-in in globals.css).
//
// Images: the portrait column is display:none below md, so phones never
// download the large portraits; they get a 48px thumbnail beside the name
// instead. On desktop the portraits are lazy and load as their rows near the
// viewport.

import Image from "next/image";
import { ArrowUpRight, UserRound } from "lucide-react";
import { GithubIcon } from "@/components/ui/BrandIcons";
import type { TeamMember } from "@/lib/data";
import { cn, isRealImage } from "@/lib/utils";

export type TeamGroup = {
  /** Shown in the divider, e.g. "Core" or "Joint-Core · Technical". */
  label: string;
  /** The first pill on each row, e.g. "Core". */
  tag: string;
  members: TeamMember[];
};

export function TeamList({ groups }: { groups: TeamGroup[] }) {
  return (
    <div>
      {groups
        .filter((group) => group.members.length > 0)
        .map((group) => (
          <section key={group.label} aria-label={group.label} className="mt-14 first:mt-0">
            <h3 className="mb-2 flex items-center gap-3 font-jetbrains text-xs font-bold uppercase tracking-[0.3em] text-[var(--accent-color)]">
              <span>{"// "}{group.label}</span>
              <span aria-hidden className="h-px flex-1 bg-[var(--border-color)]/60" />
              <span className="font-normal tracking-normal text-[var(--text-secondary)]">
                {String(group.members.length).padStart(2, "0")}
              </span>
            </h3>
            <ul>
              {group.members.map((member) => (
                <TeamRow key={member.id} member={member} tag={group.tag} />
              ))}
            </ul>
          </section>
        ))}
    </div>
  );
}

function TeamRow({ member, tag }: { member: TeamMember; tag: string }) {
  const linkedin = member.socials.find((link) => link.platform === "linkedin")?.href;
  const github = member.socials.find((link) => link.platform === "github")?.href;
  const hasPhoto = isRealImage(member.photo);

  return (
    // hover:z-10 lifts the active row so its portrait, which overhangs the
    // rows below, paints above them.
    <li className="fx-row-in group relative border-b border-[var(--border-color)]/60 transition-colors duration-200 hover:z-10 hover:border-[var(--border-active)] focus-within:z-10 focus-within:border-[var(--border-active)]">
      <div className="grid grid-cols-1 items-center gap-3 py-5 md:grid-cols-[minmax(0,4fr)_minmax(0,4fr)_minmax(0,8fr)] md:gap-6">
        {/* Pills */}
        <div className="order-2 flex flex-wrap gap-1.5 md:order-none">
          {[tag, member.role].filter(Boolean).map((label) => (
            <span
              key={label}
              className="clip-angular border border-[var(--border-color)] px-3 py-1 font-jetbrains text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] transition-colors duration-150 group-hover:border-transparent group-hover:bg-[var(--accent-color)] group-hover:text-[var(--bg-color)] group-focus-within:border-transparent group-focus-within:bg-[var(--accent-color)] group-focus-within:text-[var(--bg-color)]"
            >
              {label}
            </span>
          ))}
        </div>

        {/* Portrait, md+ only. Sits in the middle column, centred a quarter of
            the way down the row like the reference, and overhangs the rows
            below. Decorative: the name beside it says who this is. */}
        <div aria-hidden className="relative hidden self-stretch md:block">
          {hasPhoto && (
            <div className="pointer-events-none absolute left-0 top-1/4 z-10 aspect-[492/569] w-full max-w-[280px] -translate-y-1/2 opacity-0 transition-opacity duration-100 group-hover:opacity-100 group-focus-within:opacity-100">
              <Image
                src={member.photo}
                alt=""
                fill
                sizes="280px"
                loading="lazy"
                className="clip-angular object-cover"
              />
            </div>
          )}
        </div>

        {/* Thumbnail (phones) and name */}
        <div className="order-1 flex items-center gap-4 md:order-none">
          <div className="relative size-12 shrink-0 overflow-hidden rounded-full border border-[var(--border-color)]/60 bg-[var(--card-color)] md:hidden">
            {hasPhoto ? (
              <Image src={member.photo} alt="" fill sizes="48px" loading="lazy" className="object-cover" />
            ) : (
              <UserRound aria-hidden className="m-auto mt-3 size-6 text-[var(--text-secondary)]" />
            )}
          </div>

          <div className="flex min-w-0 items-center gap-3">
            {linkedin ? (
              <a
                href={linkedin}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-2 font-inter text-2xl font-semibold tracking-tight text-[var(--text-primary)] outline-none md:text-4xl"
              >
                <span className="group-focus-within:underline group-focus-within:decoration-[var(--border-active)] group-focus-within:underline-offset-8">
                  {member.name}
                </span>
                <ArrowUpRight
                  aria-hidden
                  className="size-6 -translate-x-2 text-[var(--border-active)] opacity-0 transition duration-200 group-hover:translate-x-0 group-hover:opacity-100 group-focus-within:translate-x-0 group-focus-within:opacity-100"
                />
                <span className="sr-only">(LinkedIn, opens in a new tab)</span>
              </a>
            ) : (
              <span className="font-inter text-2xl font-semibold tracking-tight text-[var(--text-primary)] md:text-4xl">
                {member.name}
              </span>
            )}
            {github && (
              <a
                href={github}
                target="_blank"
                rel="noreferrer noopener"
                aria-label={`${member.name} on GitHub`}
                className={cn(
                  "inline-flex size-11 items-center justify-center text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-active)]"
                )}
              >
                <GithubIcon className="size-4" />
              </a>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}
