"use client";

import * as React from "react";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUpRight,
  Calendar,
  Clock,
  ImageIcon,
  MapPin,
  Tag,
} from "lucide-react";
import {
  mockArticles,
  mockEvents,
  mockProjects,
  type ProjectStatus,
} from "@/lib/data";
import { cn } from "@/lib/utils";

type TabId = "projects" | "events" | "articles";

const TABS: { id: TabId; label: string }[] = [
  { id: "projects", label: "Running Projects" },
  { id: "events", label: "Upcoming Events" },
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
        <p className="relative mt-4 max-w-2xl text-[var(--text-secondary)]">
          [ Intro placeholder — a short line describing projects, events, and
          articles from the ISA RAIT chapter. ]
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
/* Events — vertical timeline                                          */
/* ------------------------------------------------------------------ */

function EventsPanel() {
  return (
    <div className="relative pl-6 sm:pl-8">
      {/* vertical spine */}
      <div className="absolute left-2 sm:left-3 top-2 bottom-2 w-px bg-gradient-to-b from-[var(--border-active)]/60 via-[var(--border-color)] to-transparent" />

      <ul className="space-y-8">
        {mockEvents.map((event, i) => (
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
                  {event.date}
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
                [Venue placeholder]
              </p>
            </div>
          </motion.li>
        ))}
      </ul>
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
