// ---------------------------------------------------------------------------
// Site content. The values live in content/site/*.json and are edited from the
// admin area (Website → Content), which commits the JSON and triggers a
// redeploy. This file holds the types and the small transforms that turn the
// stored entries into what the components render. Editing the JSON by hand
// still works; `npm run build` validates it first (scripts/check-content.ts).
// ---------------------------------------------------------------------------

import leadershipJson from "@/content/site/leadership.json";
import teamJson from "@/content/site/team.json";
import sponsorsJson from "@/content/site/sponsors.json";
import projectsJson from "@/content/site/projects.json";
import tenuresJson from "@/content/site/tenures.json";
import upcomingEventsJson from "@/content/site/upcoming-events.json";
import eventsJson from "@/content/site/events.json";
import achievementsJson from "@/content/site/achievements.json";
import galleryJson from "@/content/site/gallery.json";
import supportFaqsJson from "@/content/site/support-faqs.json";

export type SocialPlatform = "github" | "linkedin";

export interface SocialLink {
  platform: SocialPlatform;
  href: string;
}

export interface TeamMember {
  id: string;
  role: string;
  name: string;
  /**
   * Headshot. Either a real image served locally, e.g. "/team/yash-patil.jpg"
   * (drop files in public/team/ — no config needed), or a "[placeholder]" label,
   * which renders the empty photo box instead. Same convention as EventItem.image.
   */
  photo: string;
  socials: SocialLink[];
}

/** A member as stored in content/site/team.json, before member() derives the rest. */
export interface MemberEntry {
  id: string;
  role: string;
  name: string;
  /**
   * Headshot path under public/team/. Omit and the card falls back to the
   * "[photo-<id>]" placeholder box naming the slot it is waiting for.
   */
  photo?: string;
  /**
   * LinkedIn profile URL. Omit it and no LinkedIn icon renders at all — an icon
   * that goes nowhere is worse than no icon.
   */
  linkedin?: string;
  /**
   * GitHub profile URL. Needs `technical` as well; either one missing means no
   * GitHub icon.
   */
  github?: string;
  /**
   * Adds the GitHub link. Opt-in per member rather than inferred from the domain
   * heading, because the CTO sits under Sub-Core rather than the Technical
   * domain but is just as much a code role.
   */
  technical?: boolean;
  /** Kept in the file but not shown on the site (a former or not-yet-announced member). */
  hidden?: boolean;
}

/**
 * Normalise a hand-pasted profile URL, returning undefined when there is nothing
 * real to link to. These are filled in by hand, one member at a time, so it
 * absorbs the two ways that goes wrong:
 *
 *   - "" or "#" — a slot someone started but has not filled. Treated as absent,
 *     which is what keeps the icon off the card entirely.
 *   - "www.linkedin.com/in/x" — pasted without a scheme. A bare host in an href
 *     is a RELATIVE path, so it would resolve to /community/www.linkedin.com/...
 *     and 404 rather than leaving the site.
 */
const profileUrl = (url?: string): string | undefined => {
  const trimmed = url?.trim();
  if (!trimmed || trimmed === "#") return undefined;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
};

/**
 * Turns a stored entry into a renderable member. Each member owns its own
 * socials array, and an entry only exists once its URL does — so icons appear
 * one at a time as real profiles get filled in, with no dead "#" state.
 */
const member = ({ id, role, name, photo, linkedin, github, technical = false }: MemberEntry): TeamMember => {
  // profileUrl() decides both whether an icon exists and where it points, so a
  // half-filled entry can never render a link that goes nowhere.
  const linkedinHref = profileUrl(linkedin);
  const githubHref = profileUrl(github);

  const socials: SocialLink[] = [];
  if (linkedinHref) socials.push({ platform: "linkedin", href: linkedinHref });
  if (technical && githubHref) {
    socials.push({ platform: "github", href: githubHref });
  }

  return { id, role, name, photo: photo || `[photo-${id}]`, socials };
};

const visibleMembers = (entries: MemberEntry[]) => entries.filter((e) => !e.hidden).map(member);

const leadership = leadershipJson as {
  principal: { name: string; title: string; photo: string; linkedin?: string; message: string[] };
  facultyMentor: MemberEntry & { title: string; message: string[] };
};
const team = teamJson as {
  faculty: MemberEntry[];
  core: MemberEntry[];
  subCore: MemberEntry[];
  jointCore: { domain: string; members: MemberEntry[] }[];
};

// Through profileUrl() for the same reason every member entry is: a blank or
// scheme-less URL collapses to undefined, and the link below is dropped rather
// than rendered pointing nowhere.
const principalLinkedin = profileUrl(leadership.principal.linkedin);

export const principal = {
  name: leadership.principal.name,
  title: leadership.principal.title,
  /** 544x700 — intrinsic size is declared at the call site. Kept as JPEG, not the
   *  GIF it was sourced from: next/image passes GIF through unconverted (~170 KB),
   *  while a JPEG source lets the optimizer emit WebP/AVIF instead. */
  photo: leadership.principal.photo,
  /**
   * Same shape as a TeamMember's socials, so the community page can pull the
   * link out of the principal and the mentor through one code path.
   */
  socials: principalLinkedin ? [{ platform: "linkedin", href: principalLinkedin } as SocialLink] : [],
  /** One entry per rendered paragraph. */
  message: leadership.principal.message,
};

export const faculty: TeamMember[] = visibleMembers(team.faculty);

/** The mentor's note, shown beside the principal's. Same shape as `principal`. */
export const facultyMentor = {
  ...member(leadership.facultyMentor),
  title: leadership.facultyMentor.title,
  /** One entry per rendered paragraph — same contract as principal.message. */
  message: leadership.facultyMentor.message,
};

export const core: TeamMember[] = visibleMembers(team.core);

export const subCore: TeamMember[] = visibleMembers(team.subCore);

export interface JointCoreDomain {
  domain: string;
  members: TeamMember[];
}

export const jointCore: JointCoreDomain[] = team.jointCore.map((group) => ({
  domain: group.domain,
  members: visibleMembers(group.members),
}));

export const SPONSORS: { name: string; id: string }[] = sponsorsJson;

// ---------------------------------------------------------------------------
// Initiatives Hub data
// ---------------------------------------------------------------------------

export type ProjectStatus = "Live" | "In Progress" | "Completed";

/**
 * A working group within a project. Optional on Project — a smaller project
 * that is not split into teams simply omits `verticals` and the panel skips
 * that whole block rather than rendering an empty heading.
 */
export interface ProjectVertical {
  name: string;
  description: string;
}

export interface Project {
  id: string;
  title: string;
  /** One line under the title — what the project is, in a breath. */
  tagline?: string;
  /** The lead paragraph. Everything else on the card is optional; this is not. */
  description: string;
  status: ProjectStatus;
  /**
   * Hero photo, e.g. "/projects/ignite.jpeg" (drop files in public/projects/ —
   * no config needed). Omit it and the panel runs full width with no image
   * column, the same way the event cards handle a missing thumbnail.
   */
  image?: string;
  /** The teams the work is split across, rendered as labelled rows. */
  verticals?: ProjectVertical[];
  /** How the verticals actually feed each other. Closes the panel. */
  approach?: string;
}

export const mockProjects = projectsJson as Project[];

/**
 * A committee tenure (academic year), e.g. "2026-27". Add the next one to
 * content/site/tenures.json when the committee changes over.
 */
export type TenureId = string;

/**
 * Every tenure that gets a "Finished" section, newest first — this array is the
 * render order, so put new tenures at the top.
 */
export const TENURES: { id: TenureId; label: string }[] = tenuresJson;

export interface EventItem {
  id: string;
  /**
   * ISO calendar date, "YYYY-MM-DD". Machine-comparable — this is what drives the
   * automatic Upcoming → Finished split (see lib/events.ts). Render it for humans
   * with formatEventDate(); never show this raw string.
   */
  date: string;
  title: string;
  /** Workshop | Industrial Visit | Guest Lecture | Competition | Hackathon | … */
  type: string;
  /** Where it happened / will happen. */
  venue: string;
  /** Short recap; shown on Finished cards. Optional. */
  description?: string;
  /**
   * Thumbnail for Finished cards, e.g. "/events/ros-workshop.jpg" (drop files in
   * public/events/ — no config needed). Omit it and the card renders as a text
   * card with no image box. External URLs would need images.remotePatterns in
   * next.config.ts, so prefer local paths.
   */
  image?: string;
  /**
   * Which committee tenure ran this event. Deliberately explicit rather than
   * derived from `date`: the handover is a committee milestone, not a calendar
   * rule, and events do fall on the "wrong" side of the calendar year — an
   * event dated Feb 2026 can belong to the 2025-26 tenure. Pinning it here is
   * what keeps a finished event in its own tenure's section permanently,
   * however far the clock moves on.
   */
  tenure: TenureId;
}

/**
 * An event that has been announced but not held yet. Deliberately thinner than
 * EventItem: before an event runs, the name and a rough sense of when are
 * usually all that is settled, so that is all this asks for.
 *
 * Once it has actually happened, add it to the events list as a full EventItem
 * — with the real date, venue, and a recap — and remove it from upcoming.
 */
export interface UpcomingEvent {
  id: string;
  title: string;
  /**
   * Free text, shown exactly as written — no parsing, no formatting. Whatever
   * precision you actually have is fine: "September 2026", "Mid-October",
   * "Late Nov 2026", "Q1 2027", "TBA".
   */
  when: string;
  /**
   * Optional "YYYY-MM-DD". Puts the event on the calendar feed (/events.ics)
   * and the admin calendar; `when` is still what the site displays.
   */
  start?: string;
  /**
   * Optional. When set, the row's title becomes a link to this path — for the
   * few events that get a page of their own. Omit it and the row renders as
   * plain text, which is the case for most entries.
   */
  href?: string;
}

/**
 * The upcoming list, rendered top to bottom in the order stored — rough dates
 * cannot be sorted reliably, so ordering is yours to decide. Empty is a valid
 * state; the panel shows a "nothing scheduled" line.
 */
export const upcomingEvents = upcomingEventsJson as UpcomingEvent[];

// The archive: events that have already happened. Grouped into per-tenure
// sections by their `tenure` field, NOT by date — see groupFinishedByTenure in
// lib/events.ts — and sorted newest first within each section.
export const mockEvents = eventsJson as EventItem[];

/**
 * How far an achievement reached. Drives the badge colour, ordered here from
 * broadest to narrowest reach.
 */
export type AchievementScope =
  | "International"
  | "National"
  | "State"
  | "Institute";

export interface Achievement {
  id: string;
  /**
   * ISO calendar date, "YYYY-MM-DD" — same contract as EventItem.date. Render it
   * with formatEventDate(); never show this raw string. Also the sort key: the
   * panel orders achievements newest first, so data order here does not matter.
   */
  date: string;
  /**
   * Overrides the rendered date when `date` is more precise than what is
   * actually known. formatEventDate() always prints a specific day, so an award
   * known only to the month would otherwise show an invented one — set this to
   * "October 2025" and keep `date` as the first of that month purely as the sort
   * key. Same idea as UpcomingEvent.when: shown exactly as written.
   */
  dateLabel?: string;
  title: string;
  /** Who earned it — an individual, a team, or the chapter itself. */
  awardedTo: string;
  /** The competition, conference, or body that conferred it. */
  awardedBy: string;
  scope: AchievementScope;
  /** Optional context line shown under the card's metadata. */
  description?: string;
  /**
   * Optional photo, e.g. "/achievements/solaris.jpg" (drop files in
   * public/achievements/). Same convention as EventItem.image — omit it and the
   * card simply renders without a thumbnail rather than showing an empty box.
   */
  image?: string;
}

// Order is irrelevant; the panel sorts by date descending.
export const mockAchievements = achievementsJson as Achievement[];

// Articles live in lib/articles.ts — they carry full body content, so they are
// kept out of this file. The initiatives hub and /articles/[slug] both read
// from there.

// Chapter photos only. Order matters: the first cell is 2x2 (square-ish, so the
// workshop collage), the fourth spans two columns (the wide rocket shot).
export const GALLERY_IMAGES: { id: string; url: string; alt: string }[] = galleryJson;

// ---------------------------------------------------------------------------
// Support page FAQ (/help) — passed to the shared Accordion, which takes
// `items` directly and carries no content of its own. The other two lists live
// with the pages that ask their questions: ARTEMIS_FAQS in lib/artemis.ts,
// CERTIFICATE_FAQS in app/(site)/certificates/page.tsx.
// ---------------------------------------------------------------------------

export const SUPPORT_FAQS: { question: string; answer: string }[] = supportFaqsJson;
