"use client";

import * as React from "react";
import { useMemo, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUpRight,
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  MapPin,
  Medal,
  PenLine,
  Tag,
  Trophy,
} from "lucide-react";
import { ClampedText } from "@/components/ui/ClampedText";
import { articles, readingMinutes } from "@/lib/articles";
import {
  mockAchievements,
  mockEvents,
  mockProjects,
  upcomingEvents,
  type AchievementScope,
  type ProjectStatus,
} from "@/lib/data";
import { formatEventDate, groupFinishedByTenure } from "@/lib/events";
import { cn, isRealImage } from "@/lib/utils";

type TabId = "projects" | "events" | "achievements" | "articles";

const TABS: { id: TabId; label: string }[] = [
  { id: "projects", label: "Running Projects" },
  { id: "events", label: "Events" },
  { id: "achievements", label: "Achievements" },
  { id: "articles", label: "ISA Articles" },
];

// Glowing status-badge styles keyed by project status.
const STATUS_STYLES: Record<
  ProjectStatus,
  { dot: string; text: string; ring: string; glow: string }
> = {
  Live: {
    dot: "bg-emerald-400",
    text: "text-emerald-400",
    ring: "border-emerald-400/40 bg-emerald-400/10",
    glow: "shadow-[0_0_12px_rgba(16,185,129,0.45)]",
  },
  "In Progress": {
    dot: "bg-amber-400",
    text: "text-amber-400",
    ring: "border-amber-400/40 bg-amber-400/10",
    glow: "shadow-[0_0_12px_rgba(245,158,11,0.45)]",
  },
  Completed: {
    dot: "bg-sky-400",
    text: "text-sky-400",
    ring: "border-sky-400/40 bg-sky-400/10",
    glow: "shadow-[0_0_12px_rgba(56,189,248,0.4)]",
  },
};

// Scope badge styles, same shape as STATUS_STYLES. Warmer = wider reach, so the
// tier reads at a glance without needing the label.
const SCOPE_STYLES: Record<
  AchievementScope,
  { dot: string; text: string; ring: string; glow: string }
> = {
  International: {
    dot: "bg-amber-400",
    text: "text-amber-400",
    ring: "border-amber-400/40 bg-amber-400/10",
    glow: "shadow-[0_0_12px_rgba(245,158,11,0.45)]",
  },
  National: {
    dot: "bg-violet-400",
    text: "text-violet-400",
    ring: "border-violet-400/40 bg-violet-400/10",
    glow: "shadow-[0_0_12px_rgba(167,139,250,0.45)]",
  },
  State: {
    dot: "bg-emerald-400",
    text: "text-emerald-400",
    ring: "border-emerald-400/40 bg-emerald-400/10",
    glow: "shadow-[0_0_12px_rgba(16,185,129,0.45)]",
  },
  Institute: {
    dot: "bg-sky-400",
    text: "text-sky-400",
    ring: "border-sky-400/40 bg-sky-400/10",
    glow: "shadow-[0_0_12px_rgba(56,189,248,0.4)]",
  },
};

const panelVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

// The URL hash names the open tab: /initiatives#articles is where the article
// reader's "Back to Articles" link points, and #projects is what the hero CTA
// has always used. Read through useSyncExternalStore rather than an effect —
// React renders the prerendered HTML with the server snapshot ("") and swaps in
// the real hash right after hydration, so there is no mismatch and no
// setState-in-effect cascade.
function subscribeToHash(onStoreChange: () => void) {
  window.addEventListener("hashchange", onStoreChange);
  return () => window.removeEventListener("hashchange", onStoreChange);
}
const getHash = () => window.location.hash.slice(1);
const getServerHash = () => "";

export function InitiativesHub() {
  const hash = useSyncExternalStore(subscribeToHash, getHash, getServerHash);
  // A tab the visitor clicked, remembered against the hash it was clicked under
  // so that navigating to a different hash (e.g. the back button) hands control
  // back to the URL instead of being stuck on the manual choice.
  const [picked, setPicked] = useState<{ forHash: string; tab: TabId } | null>(
    null
  );

  const hashTab = TABS.find((tab) => tab.id === hash)?.id;
  const active =
    picked?.forHash === hash ? picked.tab : (hashTab ?? "projects");

  return (
    <div className="mx-auto max-w-7xl px-6 pt-24 md:pt-32 pb-16 md:pb-24">
      {/* Page Header */}
      <header className="relative">
        {/* ambient glow behind the title */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-10 left-0 h-40 w-80 max-w-full rounded-full blur-3xl opacity-30"
          style={{ background: "var(--accent-color)" }}
        />
        <p className="relative font-jetbrains text-xs uppercase tracking-[0.3em] text-[var(--accent-color)]">
          [ Initiatives ]
        </p>
        <h1 className="relative mt-4 font-jetbrains text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight text-[var(--text-primary)]">
          Initiatives{" "}
          <span className="text-[var(--accent-color)] [text-shadow:0_0_30px_var(--accent-color)]">
            Hub
          </span>
        </h1>
        {/* mt-5 / text-lg / leading-relaxed to match the intro paragraph on the
            Help and Certificates pages. No accent-highlighted span here — the
            heading above already carries one on "Hub". */}
        <p className="relative mt-5 max-w-2xl text-lg leading-relaxed text-[var(--text-secondary)]">
          Everything the chapter has in motion, in one place: projects in build,
          events past and upcoming, awards the teams have brought home, and
          articles written by our members.
        </p>
      </header>

      {/* Tabs. One hash anchor per tab sits just above the bar — /initiatives#projects
          (linked from the hero) and /initiatives#articles both scroll here and,
          via the hash reader above, select that tab. -top-24 clears the fixed navbar,
          the job scroll-mt used to do. */}
      <div className="relative mt-12">
        {TABS.map((tab) => (
          <span
            key={tab.id}
            id={tab.id}
            aria-hidden
            className="absolute -top-24 block h-0 w-0"
          />
        ))}

      <div className="inline-flex flex-wrap gap-1 rounded-xl border border-[var(--border-color)]/60 bg-[var(--card-color)]/40 p-1 backdrop-blur-md">
        {TABS.map((tab) => {
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setPicked({ forHash: hash, tab: tab.id })}
              className={cn(
                "relative inline-flex min-h-11 items-center rounded-lg px-4 py-2 font-inter text-sm font-medium transition-colors",
                isActive
                  ? "text-[var(--text-primary)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              )}
            >
              {isActive && (
                <motion.span
                  layoutId="initiatives-tab-pill"
                  className="absolute inset-0 rounded-lg border border-[var(--border-active)]/40 bg-[var(--border-active)]/10"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <span className="relative">{tab.label}</span>
            </button>
          );
        })}
      </div>
      </div>

      {/* Panels */}
      <div className="mt-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            variants={panelVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            {active === "projects" && <ProjectsPanel />}
            {active === "events" && <EventsPanel />}
            {active === "achievements" && <AchievementsPanel />}
            {active === "articles" && <ArticlesPanel />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Projects                                                            */
/* ------------------------------------------------------------------ */

function ProjectsPanel() {
  if (mockProjects.length === 0) {
    return (
      <p className="font-jetbrains text-sm text-[var(--text-secondary)]">
        No projects listed yet.
      </p>
    );
  }

  return (
    /* One panel per project rather than a card in a grid: a project carries its
       verticals and its development approach with it, which is far more than a
       third of a row can hold. Sections inside the panel are separated by the
       same hairline the rest of the hub uses. */
    <div className="space-y-10">
      {mockProjects.map((project, i) => {
        const s = STATUS_STYLES[project.status];
        return (
          <motion.article
            key={project.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
            className="overflow-hidden rounded-2xl border border-[var(--border-color)]/60 bg-[var(--card-color)]/40 backdrop-blur-md transition-colors duration-300 hover:border-[var(--border-active)]/50"
          >
            {/* Lead — photo beside the summary on a wide screen, stacked below
                it on a phone. A project with no photo just gets the one column. */}
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
              {isRealImage(project.image) && (
                <div className="relative aspect-[16/10] border-b border-[var(--border-color)]/60 bg-[var(--bg-color)]/60 lg:aspect-auto lg:border-b-0 lg:border-r">
                  <Image
                    src={project.image}
                    alt={project.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 42vw"
                    className="object-cover"
                  />
                </div>
              )}

              <div className="flex flex-col p-6 sm:p-8">
                <span
                  className={cn(
                    "inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 font-jetbrains text-[11px] font-medium",
                    s.ring,
                    s.text,
                    s.glow
                  )}
                >
                  <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
                  {project.status}
                </span>

                <h3 className="mt-5 font-jetbrains text-2xl font-bold text-[var(--text-primary)]">
                  {project.title}
                </h3>

                {project.tagline && (
                  <p className="mt-2 text-base leading-relaxed text-[var(--text-secondary)]">
                    {project.tagline}
                  </p>
                )}

                <ClampedText
                  text={project.description}
                  lines={6}
                  className="mt-4"
                  textClassName="text-sm leading-relaxed text-[var(--text-secondary)]"
                />
              </div>
            </div>

            {project.verticals && project.verticals.length > 0 && (
              <div className="border-t border-[var(--border-color)]/60 p-6 sm:p-8">
                <SubHeading
                  eyebrow="Verticals"
                  count={project.verticals.length}
                  accent="var(--border-active)"
                />
                <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {project.verticals.map((vertical) => (
                    <div
                      key={vertical.name}
                      className="rounded-xl border border-[var(--border-color)]/60 bg-[var(--bg-color)]/40 p-5 transition-colors duration-300 hover:border-[var(--border-active)]/40"
                    >
                      <dt className="font-jetbrains text-sm font-bold text-[var(--text-primary)]">
                        <span className="mr-2 text-[var(--accent-color)]">
                          {"//"}
                        </span>
                        {vertical.name}
                      </dt>
                      <dd>
                        <ClampedText
                          text={vertical.description}
                          lines={6}
                          className="mt-2"
                          textClassName="text-sm leading-relaxed text-[var(--text-secondary)]"
                        />
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            {project.approach && (
              <div className="border-t border-[var(--border-color)]/60 p-6 sm:p-8">
                <SubHeading eyebrow="Development Approach" accent="var(--accent-color)" />
                <ClampedText
                  text={project.approach}
                  lines={6}
                  className="mt-6 max-w-4xl"
                  textClassName="text-sm leading-relaxed text-[var(--text-secondary)]"
                />
              </div>
            )}
          </motion.article>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Achievements                                                        */
/* ------------------------------------------------------------------ */

function AchievementsPanel() {
  // Sorted here rather than relying on the order in data.ts, so adding a win to
  // the end of that array still lands it in the right place.
  const achievements = useMemo(
    () => [...mockAchievements].sort((a, b) => b.date.localeCompare(a.date)),
    []
  );

  if (achievements.length === 0) {
    return (
      <p className="font-jetbrains text-sm text-[var(--text-secondary)]">
        No achievements recorded yet.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {achievements.map((achievement, i) => {
        const s = SCOPE_STYLES[achievement.scope];
        return (
          <motion.article
            key={achievement.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
            className="group flex flex-col overflow-hidden rounded-2xl border border-[var(--border-color)]/60 bg-[var(--card-color)]/40 backdrop-blur-md transition-colors duration-300 hover:border-[var(--border-active)]/50"
          >
            {/* Optional photo. Padding moved off the article and onto the body
                below so this sits full-bleed; cards without one just start at
                the badge row, with no empty placeholder box. */}
            {isRealImage(achievement.image) && (
              <div className="relative aspect-[16/9] border-b border-[var(--border-color)]/60 bg-[var(--bg-color)]/60">
                <Image
                  src={achievement.image}
                  alt={`${achievement.title} — ${achievement.awardedTo}`}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover"
                />
              </div>
            )}

            <div className="flex flex-1 flex-col p-6">
              <div className="flex items-start justify-between gap-3">
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-jetbrains text-[11px] font-medium",
                    s.ring,
                    s.text,
                    s.glow
                  )}
                >
                  <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
                  {achievement.scope}
                </span>
                <Trophy className={cn("h-5 w-5 shrink-0", s.text)} />
            </div>

            <h3 className="mt-5 font-jetbrains text-lg font-bold text-[var(--text-primary)]">
              {achievement.title}
            </h3>

            <p className="mt-2 flex items-center gap-1.5 text-sm text-[var(--text-primary)]">
              <Medal className="h-3.5 w-3.5 shrink-0 text-[var(--text-secondary)]" />
              {achievement.awardedTo}
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
              {/* dateLabel wins when the real precision is coarser than a day —
                  see Achievement.dateLabel. */}
              <span className="font-jetbrains text-xs text-[var(--accent-color)]">
                {achievement.dateLabel ?? formatEventDate(achievement.date)}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-[var(--border-color)]/60 px-2 py-0.5 font-jetbrains text-[11px] text-[var(--text-secondary)]">
                <Award className="h-3 w-3 shrink-0" />
                {achievement.awardedBy}
              </span>
            </div>

            {achievement.description && (
              <ClampedText
                text={achievement.description}
                lines={6}
                className="mt-3"
                textClassName="text-sm leading-relaxed text-[var(--text-secondary)]"
              />
            )}
            </div>
          </motion.article>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Events — Upcoming timeline + Finished card grid                     */
/* ------------------------------------------------------------------ */

function EventsPanel() {
  const finishedByTenure = useMemo(
    () => groupFinishedByTenure(mockEvents),
    []
  );

  return (
    <div className="space-y-16">
      {/* ── Upcoming ─────────────────────────────────────────────────── */}
      <section>
        <SubHeading
          eyebrow="Upcoming"
          count={upcomingEvents.length}
          accent="var(--border-active)"
        />

        {upcomingEvents.length === 0 ? (
          <p className="mt-6 font-jetbrains text-sm text-[var(--text-secondary)]">
            No upcoming events scheduled — check back soon.
          </p>
        ) : (
          /* One panel, rows flush against each other and separated by hairlines,
             so the announced events read as a single stacked block rather than a
             column of detached cards. There is only a name and a rough date to
             show, and a card each would be mostly empty space. */
          <ul className="mt-8 divide-y divide-[var(--border-color)]/60 overflow-hidden rounded-2xl border border-[var(--border-color)]/60 bg-[var(--card-color)]/40 backdrop-blur-md">
            {upcomingEvents.map((event, i) => (
              <motion.li
                key={event.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
                className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 px-5 py-4 transition-colors hover:bg-[var(--border-active)]/5"
              >
                <span className="flex items-center gap-2.5 font-jetbrains text-base font-bold text-[var(--text-primary)]">
                  <Calendar className="h-4 w-4 shrink-0 text-[var(--border-active)]" />
                  {event.title}
                </span>
                {/* Free text, printed as written — see UpcomingEvent.when. */}
                <span className="font-jetbrains text-xs text-[var(--accent-color)]">
                  {event.when}
                </span>
              </motion.li>
            ))}
          </ul>
        )}
      </section>

      {/* ── Finished — one section per committee tenure, newest first ── */}
      {finishedByTenure.map(({ id, label, events }) => (
        <section key={id}>
          <SubHeading
            eyebrow={`Finished — ${label} Tenure`}
            count={events.length}
            accent="var(--accent-color)"
          />

          {events.length === 0 ? (
            <p className="mt-6 font-jetbrains text-sm text-[var(--text-secondary)]">
              No events finished yet this tenure.
            </p>
          ) : (
            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {events.map((event, i) => (
                <motion.article
                  key={event.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-[var(--border-color)]/60 bg-[var(--card-color)]/40 backdrop-blur-md transition-colors duration-300 hover:border-[var(--border-active)]/50"
                >
                  {/* Thumbnail, only when there is a real photo to show — an
                      event still waiting on one renders as a text card rather
                      than an empty box, the same as the achievement cards. */}
                  {isRealImage(event.image) && (
                    <div className="relative aspect-[16/9] border-b border-[var(--border-color)]/60 bg-[var(--bg-color)]/60">
                      <Image
                        src={event.image}
                        alt={event.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        // object-top: event art is often a portrait poster, and a centred
                        // crop into this 16:9 box lands mid-poster and cuts the title off.
                        // The top carries the branding either way.
                        className="object-cover object-top"
                      />
                      <FinishedBadge className="absolute left-3 top-3 backdrop-blur-sm" />
                    </div>
                  )}

                  <div className="flex flex-col gap-2 p-5">
                    {/* With no thumbnail to overlay, the badge leads the body. */}
                    {!isRealImage(event.image) && (
                      <FinishedBadge className="self-start" />
                    )}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="font-jetbrains text-xs text-[var(--accent-color)]">
                        {formatEventDate(event.date)}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full border border-[var(--border-color)]/60 px-2 py-0.5 font-jetbrains text-[11px] text-[var(--text-secondary)]">
                        <Tag className="h-3 w-3" />
                        {event.type}
                      </span>
                    </div>
                    <h3 className="font-jetbrains text-base font-bold text-[var(--text-primary)]">
                      {event.title}
                    </h3>
                    <p className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                      <MapPin className="h-3.5 w-3.5" />
                      {event.venue}
                    </p>
                    {event.description && (
                      <ClampedText
                        text={event.description}
                        lines={6}
                        className="mt-1"
                        textClassName="text-sm leading-relaxed text-[var(--text-secondary)]"
                      />
                    )}
                  </div>
                </motion.article>
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}

// "FINISHED" pill. Overlays the thumbnail when a card has one, otherwise leads
// the card body — hence the caller-supplied positioning.
function FinishedBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-sky-400/40 bg-sky-400/10 px-2 py-0.5 font-jetbrains text-[10px] font-medium text-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.4)]",
        className
      )}
    >
      <CheckCircle2 className="h-3 w-3" />
      FINISHED
    </span>
  );
}

// Small labeled divider heading used by the Events and Projects sub-sections.
function SubHeading({
  eyebrow,
  count,
  accent,
}: {
  eyebrow: string;
  /** Omit for a section that isn't a list — the counter is dropped entirely. */
  count?: number;
  accent: string;
}) {
  return (
    <div className="flex items-center gap-4">
      <h2 className="font-jetbrains text-sm font-bold uppercase tracking-widest text-[var(--text-primary)]">
        {eyebrow}
      </h2>
      {count !== undefined && (
        <span
          className="font-jetbrains text-xs"
          style={{ color: accent }}
        >
          [{count.toString().padStart(2, "0")}]
        </span>
      )}
      <div className="h-px flex-1 bg-[var(--border-color)]" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Articles — bento grid                                               */
/* ------------------------------------------------------------------ */

function ArticlesPanel() {
  if (articles.length === 0) {
    return (
      <p className="font-jetbrains text-sm text-[var(--text-secondary)]">
        No articles published yet.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:auto-rows-[minmax(0,1fr)]">
      {articles.map((article, i) => {
        // first card is the featured hero of the bento grid
        const featured = i === 0;
        return (
          // The whole card is the link — clicking anywhere opens the full piece
          // at /articles/[slug], where it is rendered as a page on the site.
          <Link
            key={article.slug}
            href={`/articles/${article.slug}`}
            className={cn(
              "group flex flex-col overflow-hidden rounded-2xl border border-[var(--border-color)]/60 bg-[var(--card-color)]/40 backdrop-blur-md transition-colors duration-300 hover:border-[var(--border-active)]/50",
              featured && "sm:col-span-2 lg:row-span-2"
            )}
          >
            <ArticleCover article={article} index={i} featured={featured} />

            <div className="flex flex-1 flex-col gap-2 p-5">
              <h3
                className={cn(
                  "font-jetbrains font-bold text-[var(--text-primary)]",
                  featured ? "text-xl" : "text-base"
                )}
              >
                {article.title}
              </h3>

              {/* The featured card has the vertical room for the source's own
                  cover line; the smaller cards do not. */}
              {featured && article.subtitle && (
                <p className="text-sm text-[var(--text-secondary)]">
                  {article.subtitle}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-jetbrains text-[11px] text-[var(--text-secondary)]">
                {article.author && (
                  <span className="inline-flex items-center gap-1 text-[var(--text-primary)]">
                    <PenLine className="h-3 w-3 shrink-0 text-[var(--accent-color)]" />
                    {article.author}
                  </span>
                )}
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3 shrink-0" />
                  {readingMinutes(article)} min read
                </span>
              </div>

              {/* Summary only — the full text lives on the article page. The
                  featured card has the room for all of it; the smaller ones
                  clamp so the grid rows stay even. */}
              <p
                className={cn(
                  "text-sm leading-relaxed text-[var(--text-secondary)]",
                  !featured && "line-clamp-4"
                )}
              >
                {article.summary}
              </p>

              <span
                className={cn(
                  "mt-auto inline-flex items-center gap-1 pt-2 font-jetbrains text-xs text-[var(--accent-color)] transition-opacity",
                  // The small cards reveal the CTA on hover, as the rest of the
                  // hub's cards do. The featured card sits above a tall gap, so
                  // hiding it there just leaves the card looking unfinished.
                  !featured && "md:opacity-0 md:group-hover:opacity-100"
                )}
              >
                Read full article <ArrowUpRight className="h-3.5 w-3.5" />
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

/**
 * Card header for an article. The source pieces ship as text with no cover art,
 * so this draws one from the article's own metadata — index, first tag, and the
 * accent grid — instead of showing an empty image placeholder.
 */
function ArticleCover({
  article,
  index,
  featured,
}: {
  article: (typeof articles)[number];
  index: number;
  featured: boolean;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden border-b border-[var(--border-color)]/60 bg-[var(--bg-color)]/60",
        // The featured card spans two grid rows, so on large screens its cover
        // takes the slack the summary does not need — which is why the index
        // number below scales up with it rather than floating in dead space.
        featured ? "aspect-[16/9] lg:aspect-auto lg:flex-1" : "aspect-[16/9]"
      )}
    >
      {/* blueprint grid */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage:
            "linear-gradient(to right, var(--border-color) 1px, transparent 1px), linear-gradient(to bottom, var(--border-color) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      {/* accent bloom, brightening on hover */}
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-16 -right-10 h-48 w-48 rounded-full opacity-25 blur-3xl transition-opacity duration-300 group-hover:opacity-45"
        style={{ background: "var(--accent-color)" }}
      />

      <div className="relative flex h-full flex-col justify-between p-5">
        <span
          className={cn(
            "font-jetbrains font-bold leading-none text-[var(--text-primary)]/15",
            featured ? "text-7xl lg:text-[9rem]" : "text-5xl"
          )}
        >
          {(index + 1).toString().padStart(2, "0")}
        </span>
        <div className="flex flex-wrap gap-2">
          {article.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-[var(--border-color)]/60 bg-[var(--card-color)]/60 px-2 py-0.5 font-jetbrains text-[10px] text-[var(--text-secondary)] backdrop-blur-sm"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
