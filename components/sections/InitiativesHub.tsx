"use client";

import * as React from "react";
import { useMemo, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUpRight,
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  ImageIcon,
  MapPin,
  Medal,
  Tag,
  Trophy,
} from "lucide-react";
import {
  mockAchievements,
  mockArticles,
  mockEvents,
  mockProjects,
  type AchievementScope,
  type ProjectStatus,
} from "@/lib/data";
import { formatEventDate, groupFinishedByTenure, partitionEvents } from "@/lib/events";
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

export function InitiativesHub() {
  const [active, setActive] = useState<TabId>("projects");

  return (
    <div className="mx-auto max-w-7xl px-6 pt-24 md:pt-32 pb-16 md:pb-24">
      {/* Page Header */}
      <header className="relative">
        {/* ambient glow behind the title */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-10 left-0 h-40 w-80 rounded-full blur-3xl opacity-30"
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

      {/* Tabs — `projects` is the default active tab, so #projects lands here
          on the running-projects grid. scroll-mt offsets the fixed navbar. */}
      <div
        id="projects"
        className="mt-12 scroll-mt-24 inline-flex flex-wrap gap-1 rounded-xl border border-[var(--border-color)]/60 bg-[var(--card-color)]/40 p-1 backdrop-blur-md"
      >
        {TABS.map((tab) => {
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActive(tab.id)}
              className={cn(
                "relative rounded-lg px-4 py-2 font-inter text-sm font-medium transition-colors",
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
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {mockProjects.map((project) => {
        const s = STATUS_STYLES[project.status];
        return (
          <div
            key={project.id}
            className="group relative flex flex-col overflow-hidden rounded-2xl border border-[var(--border-color)]/60 bg-[var(--card-color)]/40 p-6 backdrop-blur-md transition-colors duration-300 hover:border-[var(--border-active)]/50"
          >
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
                {project.status}
              </span>
              <ArrowUpRight className="h-5 w-5 text-[var(--text-secondary)] transition-colors group-hover:text-[var(--accent-color)]" />
            </div>

            <h3 className="mt-5 font-jetbrains text-lg font-bold text-[var(--text-primary)]">
              {project.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
              {project.description}
            </p>
          </div>
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
            className="group flex flex-col overflow-hidden rounded-2xl border border-[var(--border-color)]/60 bg-[var(--card-color)]/40 p-6 backdrop-blur-md transition-colors duration-300 hover:border-[var(--border-active)]/50"
          >
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
              <span className="font-jetbrains text-xs text-[var(--accent-color)]">
                {formatEventDate(achievement.date)}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-[var(--border-color)]/60 px-2 py-0.5 font-jetbrains text-[11px] text-[var(--text-secondary)]">
                <Award className="h-3 w-3 shrink-0" />
                {achievement.awardedBy}
              </span>
            </div>

            {achievement.description && (
              <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
                {achievement.description}
              </p>
            )}
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
  // Evaluated once per render on both server and client. Same calendar day →
  // identical output, so no hydration mismatch and no post-mount flash. The
  // partition therefore refreshes on every visit with no rebuild.
  const [now] = useState(() => new Date());
  const { upcoming, finished } = useMemo(
    () => partitionEvents(mockEvents, now),
    [now]
  );
  // Upcoming stays one combined list; only the finished events split by tenure.
  const finishedByTenure = useMemo(() => groupFinishedByTenure(finished), [finished]);

  return (
    <div className="space-y-16">
      {/* ── Upcoming ─────────────────────────────────────────────────── */}
      <section>
        <SubHeading
          eyebrow="Upcoming"
          count={upcoming.length}
          accent="var(--border-active)"
        />

        {upcoming.length === 0 ? (
          <p className="mt-6 font-jetbrains text-sm text-[var(--text-secondary)]">
            No upcoming events scheduled — check back soon.
          </p>
        ) : (
          <div className="relative mt-8 pl-6 sm:pl-8">
            {/* vertical spine */}
            <div className="absolute left-2 sm:left-3 top-2 bottom-2 w-px bg-gradient-to-b from-[var(--border-active)]/60 via-[var(--border-color)] to-transparent" />

            <ul className="space-y-8">
              {upcoming.map((event, i) => (
                <motion.li
                  key={event.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.3 }}
                  className="relative"
                >
                  {/* node */}
                  <span className="absolute -left-[26px] sm:-left-[34px] flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border-active)]/50 bg-[var(--card-color)] text-[var(--border-active)] shadow-[0_0_12px_rgba(0,229,255,0.25)]">
                    {i % 2 === 0 ? (
                      <Calendar className="h-4 w-4" />
                    ) : (
                      <Clock className="h-4 w-4" />
                    )}
                  </span>

                  <div className="rounded-2xl border border-[var(--border-color)]/60 bg-[var(--card-color)]/40 p-5 backdrop-blur-md transition-colors duration-300 hover:border-[var(--border-active)]/50">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="font-jetbrains text-xs text-[var(--accent-color)]">
                        {formatEventDate(event.date)}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full border border-[var(--border-color)]/60 px-2 py-0.5 font-jetbrains text-[11px] text-[var(--text-secondary)]">
                        <Tag className="h-3 w-3" />
                        {event.type}
                      </span>
                    </div>
                    <h3 className="mt-2 font-jetbrains text-base font-bold text-[var(--text-primary)]">
                      {event.title}
                    </h3>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                      <MapPin className="h-3.5 w-3.5" />
                      {event.venue}
                    </p>
                  </div>
                </motion.li>
              ))}
            </ul>
          </div>
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
                  {/* thumbnail */}
                  <div className="relative aspect-[16/9] border-b border-[var(--border-color)]/60 bg-[var(--bg-color)]/60">
                    {isRealImage(event.image) ? (
                      <Image
                        src={event.image}
                        alt={event.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center gap-2 text-[var(--text-secondary)]">
                        <ImageIcon className="h-8 w-8" />
                        <span className="font-jetbrains text-[11px]">
                          [{event.image ?? "photo"}]
                        </span>
                      </div>
                    )}
                    {/* finished badge */}
                    <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full border border-sky-400/40 bg-sky-400/10 px-2 py-0.5 font-jetbrains text-[10px] font-medium text-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.4)] backdrop-blur-sm">
                      <CheckCircle2 className="h-3 w-3" />
                      FINISHED
                    </span>
                  </div>

                  <div className="flex flex-col gap-2 p-5">
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
                      <p className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">
                        {event.description}
                      </p>
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

// Small labeled divider heading used by the Events sub-sections.
function SubHeading({
  eyebrow,
  count,
  accent,
}: {
  eyebrow: string;
  count: number;
  accent: string;
}) {
  return (
    <div className="flex items-center gap-4">
      <h2 className="font-jetbrains text-sm font-bold uppercase tracking-widest text-[var(--text-primary)]">
        {eyebrow}
      </h2>
      <span
        className="font-jetbrains text-xs"
        style={{ color: accent }}
      >
        [{count.toString().padStart(2, "0")}]
      </span>
      <div className="h-px flex-1 bg-[var(--border-color)]" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Articles — bento grid                                               */
/* ------------------------------------------------------------------ */

function ArticlesPanel() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:auto-rows-[minmax(0,1fr)]">
      {mockArticles.map((article, i) => {
        // first card is the featured hero of the bento grid
        const featured = i === 0;
        return (
          <article
            key={article.id}
            className={cn(
              "group flex flex-col overflow-hidden rounded-2xl border border-[var(--border-color)]/60 bg-[var(--card-color)]/40 backdrop-blur-md transition-colors duration-300 hover:border-[var(--border-active)]/50",
              featured && "sm:col-span-2 lg:row-span-2"
            )}
          >
            {/* thumbnail placeholder */}
            <div
              className={cn(
                "relative flex items-center justify-center border-b border-[var(--border-color)]/60 bg-[var(--bg-color)]/60",
                featured ? "aspect-[16/9] lg:aspect-auto lg:flex-1" : "aspect-[16/9]"
              )}
            >
              <div className="flex flex-col items-center gap-2 text-[var(--text-secondary)]">
                <ImageIcon className="h-8 w-8" />
                <span className="font-jetbrains text-[11px]">
                  [{article.image}]
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2 p-5">
              <h3
                className={cn(
                  "font-jetbrains font-bold text-[var(--text-primary)]",
                  featured ? "text-xl" : "text-base"
                )}
              >
                {article.title}
              </h3>
              <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                {article.excerpt}
              </p>
              <span className="mt-1 inline-flex items-center gap-1 font-jetbrains text-xs text-[var(--accent-color)] opacity-0 transition-opacity group-hover:opacity-100">
                Read more <ArrowUpRight className="h-3.5 w-3.5" />
              </span>
            </div>
          </article>
        );
      })}
    </div>
  );
}
