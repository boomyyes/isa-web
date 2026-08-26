/**
 * Artemis Hackathon — all page copy and data for /artemis.
 *
 * Everything the page renders as text lives here, so swapping the placeholder
 * Latin for the real details is a single-file edit and never touches layout.
 * The section components import from this file and nothing else.
 *
 * Counts matter in a couple of places, noted per-export: the constellation grid
 * is laid out for exactly twelve entries and the boons for exactly three.
 */

/* ------------------------------------------------------------------ *
 * Event meta — the header block, the hero chips, and page metadata.
 * ------------------------------------------------------------------ */

export const ARTEMIS = {
  /** Kept in sync with the `evt-up-artemis` entry in lib/data.ts. */
  title: "Artemis Hackathon",
  /** Sits above the wordmark in the hero. */
  eyebrow: "ISA-RAIT Presents",
  /** Free text, printed exactly as written — same convention as UpcomingEvent.when. */
  when: "26 September 2026",
  venue: "Ramrao Adik Institute of Technology, Nerul",
  /** One-line summary; also used as the page's meta description. */
  tagline: "Chart your course by the stars — a night of building under the old constellations.",
  intro:
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod, nunc ut laoreet dictum, mi sapien vulputate quam, in tincidunt arcu urna vitae leo. Duis aute irure dolor in reprehenderit.",
  /**
   * Registration form. Any Tally / Google Forms / Jotform link works — FormEmbed
   * handles the embed-parameter differences. Swap for the real one when it exists.
   */
  registerUrl: "https://tally.so/r/gDVdZM",
} as const;

/* ------------------------------------------------------------------ *
 * Prologue — the long-form opening note on parchment.
 * ------------------------------------------------------------------ */

export const PROLOGUE = {
  heading: "Prologue",
  /**
   * Rendered as separate <p> blocks in order. The first character of the first
   * paragraph becomes a drop cap, so lead with a letter, not a quote mark.
   */
  paragraphs: [
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
    "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.",
  ],
  /** Printed under the closing rule, in the manner of a signed note. */
  signature: "— The Organising Committee",
} as const;

/* ------------------------------------------------------------------ *
 * Tracks — the four medallions.
 * ------------------------------------------------------------------ */

export interface ArtemisTrack {
  id: string;
  /** Greek name, set in Cinzel caps on the medallion. */
  name: string;
  /** English subtitle under the name. */
  domain: string;
  blurb: string;
}

/** Laid out as a 4-up row on desktop, 2-up tablet, 1-up mobile. */
export const TRACKS: ArtemisTrack[] = [
  {
    id: "track-daedalus",
    name: "Daedalus",
    domain: "Automation & Control",
    blurb:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent felis leo, gravida et tincidunt nascetur.",
  },
  {
    id: "track-athena",
    name: "Athena",
    domain: "Machine Intelligence",
    blurb:
      "Praesent felis leo, gravida et tincidunt. Faucibus neque interdum justo, curabitur vel sapien in dolor.",
  },
  {
    id: "track-hephaestus",
    name: "Hephaestus",
    domain: "Embedded & Robotics",
    blurb:
      "Aenean ut enim ut odio porttitor efficitur. Nulla sollicitudo laoreet pretium, cras tempus odio nec.",
  },
  {
    id: "track-hermes",
    name: "Hermes",
    domain: "Open Innovation",
    blurb:
      "Vehicula nibh ut diam auctor dignissim. Nunc aliquam matris, aliquam erat volutpat class aptent taciti.",
  },
];

/* ------------------------------------------------------------------ *
 * Constellation grid — the signature visual.
 * ------------------------------------------------------------------ */

export interface Constellation {
  id: string;
  /** Zodiac sign name. */
  name: string;
  /** The zodiac glyph, as a literal character — no icon font needed. */
  glyph: string;
  /** The date range, printed small under the name. */
  span: string;
  /** The challenge theme this sign stands for. */
  theme: string;
}

/**
 * Exactly twelve — the grid is a 6x2 on desktop, 4x3 tablet, 3x4 mobile, and
 * anything other than twelve leaves a ragged last row.
 */
export const CONSTELLATIONS: Constellation[] = [
  { id: "aries", name: "Aries", glyph: "♈", span: "Mar 21 — Apr 19", theme: "Lorem ipsum dolor sit" },
  { id: "taurus", name: "Taurus", glyph: "♉", span: "Apr 20 — May 20", theme: "Consectetur adipiscing" },
  { id: "gemini", name: "Gemini", glyph: "♊", span: "May 21 — Jun 20", theme: "Sed do eiusmod tempor" },
  { id: "cancer", name: "Cancer", glyph: "♋", span: "Jun 21 — Jul 22", theme: "Incididunt ut labore" },
  { id: "leo", name: "Leo", glyph: "♌", span: "Jul 23 — Aug 22", theme: "Dolore magna aliqua" },
  { id: "virgo", name: "Virgo", glyph: "♍", span: "Aug 23 — Sep 22", theme: "Ut enim ad minim" },
  { id: "libra", name: "Libra", glyph: "♎", span: "Sep 23 — Oct 22", theme: "Quis nostrud exercitation" },
  { id: "scorpio", name: "Scorpio", glyph: "♏", span: "Oct 23 — Nov 21", theme: "Ullamco laboris nisi" },
  { id: "sagittarius", name: "Sagittarius", glyph: "♐", span: "Nov 22 — Dec 21", theme: "Aliquip ex ea commodo" },
  { id: "capricorn", name: "Capricorn", glyph: "♑", span: "Dec 22 — Jan 19", theme: "Duis aute irure dolor" },
  { id: "aquarius", name: "Aquarius", glyph: "♒", span: "Jan 20 — Feb 18", theme: "Velit esse cillum" },
  { id: "pisces", name: "Pisces", glyph: "♓", span: "Feb 19 — Mar 20", theme: "Excepteur sint occaecat" },
];

/* ------------------------------------------------------------------ *
 * Odyssey — the schedule, as a timeline.
 * ------------------------------------------------------------------ */

export interface OdysseyStop {
  id: string;
  /** Free text, printed as written: "09:00", "Hour 12", "Day 2 — Morning". */
  time: string;
  title: string;
  detail: string;
}

/** Rendered top to bottom in the order written here. */
export const ODYSSEY: OdysseyStop[] = [
  {
    id: "stop-1",
    time: "08:00",
    title: "The Gathering",
    detail: "Lorem ipsum dolor sit amet, consectetur adipiscing elit sed do eiusmod tempor.",
  },
  {
    id: "stop-2",
    time: "09:30",
    title: "Reading of the Omens",
    detail: "Incididunt ut labore et dolore magna aliqua, ut enim ad minim veniam quis.",
  },
  {
    id: "stop-3",
    time: "10:00",
    title: "The Trials Begin",
    detail: "Nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
  },
  {
    id: "stop-4",
    time: "16:00",
    title: "First Augury",
    detail: "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore.",
  },
  {
    id: "stop-5",
    time: "23:00",
    title: "The Long Night",
    detail: "Excepteur sint occaecat cupidatat non proident sunt in culpa qui officia.",
  },
  {
    id: "stop-6",
    time: "06:00",
    title: "Second Augury",
    detail: "Deserunt mollit anim id est laborum sed ut perspiciatis unde omnis iste.",
  },
  {
    id: "stop-7",
    time: "10:00",
    title: "The Final Reckoning",
    detail: "Natus error sit voluptatem accusantium doloremque laudantium totam rem.",
  },
  {
    id: "stop-8",
    time: "13:00",
    title: "Crowning of the Laurels",
    detail: "Aperiam eaque ipsa quae ab illo inventore veritatis et quasi architecto.",
  },
];

/* ------------------------------------------------------------------ *
 * Boons — the prizes.
 * ------------------------------------------------------------------ */

export interface Boon {
  id: string;
  /** "I", "II", "III" — set large in Cinzel on the plinth. */
  rank: string;
  title: string;
  amount: string;
  detail: string;
}

/**
 * Exactly three. The middle entry is rendered taller than its neighbours, so
 * the order here is first / second / third, not podium order.
 */
export const BOONS: Boon[] = [
  {
    id: "boon-1",
    rank: "I",
    title: "The Golden Bough",
    amount: "₹ XX,XXX",
    detail: "Lorem ipsum dolor sit amet, consectetur adipiscing elit praesent.",
  },
  {
    id: "boon-2",
    rank: "II",
    title: "The Silver Arrow",
    amount: "₹ XX,XXX",
    detail: "Felis leo gravida et tincidunt, faucibus neque interdum justo.",
  },
  {
    id: "boon-3",
    rank: "III",
    title: "The Bronze Aegis",
    amount: "₹ X,XXX",
    detail: "Curabitur vel sapien in dolor aenean ut enim ut odio porttitor.",
  },
];

/* ------------------------------------------------------------------ *
 * Oracle — participant quotes.
 * ------------------------------------------------------------------ */

export interface OracleQuote {
  id: string;
  quote: string;
  name: string;
  /** Year, branch, or whatever attribution line fits. */
  attribution: string;
}

export const ORACLE_QUOTES: OracleQuote[] = [
  {
    id: "quote-1",
    quote:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod nunc ut laoreet dictum, mi sapien vulputate quam in tincidunt arcu urna vitae leo.",
    name: "Lorem Ipsum",
    attribution: "T.E. Instrumentation",
  },
  {
    id: "quote-2",
    quote:
      "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident.",
    name: "Dolor Sit",
    attribution: "B.E. Electronics",
  },
  {
    id: "quote-3",
    quote:
      "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium totam rem aperiam eaque ipsa quae ab illo inventore.",
    name: "Amet Consectetur",
    attribution: "S.E. Computer Engineering",
  },
];

/* ------------------------------------------------------------------ *
 * FAQ — passed to the shared Accordion, which takes `items` directly.
 * ------------------------------------------------------------------ */

export const ARTEMIS_FAQS = [
  {
    question: "Quis nostrud exercitation ullamco laboris?",
    answer:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam quis nostrud.",
  },
  {
    question: "Duis aute irure dolor in reprehenderit?",
    answer:
      "Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum sed ut perspiciatis unde omnis iste natus.",
  },
  {
    question: "Sed ut perspiciatis unde omnis iste natus error?",
    answer:
      "Totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo nemo enim ipsam voluptatem quia.",
  },
  {
    question: "Nemo enim ipsam voluptatem quia voluptas?",
    answer:
      "Aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt neque porro quisquam est qui dolorem.",
  },
  {
    question: "Neque porro quisquam est qui dolorem ipsum?",
    answer:
      "Quia dolor sit amet consectetur adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem.",
  },
];

/* ------------------------------------------------------------------ *
 * Epilogue — the closing note.
 * ------------------------------------------------------------------ */

export const EPILOGUE = {
  heading: "Epilogue",
  paragraphs: [
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip.",
    "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur, excepteur sint occaecat cupidatat non proident.",
  ],
  signature: "~ ISA-RAIT Student Chapter",
} as const;
