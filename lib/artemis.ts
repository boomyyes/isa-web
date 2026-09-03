/**
 * Artemis Hackathon — all page copy and data for /artemis.
 *
 * Everything the page renders as text lives here, so swapping the placeholder
 * Latin for the real details is a single-file edit and never touches layout.
 * The section components import from this file and nothing else.
 *
 * Counts matter in one place, noted per-export: the boons are laid out for
 * exactly three entries.
 *
 * One thing is deliberately NOT here. The problem statements are embargoed until
 * the hackathon opens, and this file is committed to a public repository — so
 * they live in lib/artemis-trials.ts, which reads them at runtime from an
 * environment variable and is fenced off from client code. The release instant
 * itself is below, and is public: the countdown needs something to count toward.
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
  registerUrl: "https://tally.so/r/RG905j",
} as const;

/**
 * When the problem statements are published: noon on the day, in Nerul.
 *
 * A fixed instant with an explicit +05:30 offset, not a local-time string — the
 * seal has to break at the same moment for everyone, so a visitor reading the
 * page from another timezone sees the same countdown as someone in the hall.
 *
 * Public on purpose. Only the statements are secret; the hour they arrive is
 * already printed on the page. lib/artemis-trials.ts checks this server-side,
 * which is the check that actually gates the content — this export exists so the
 * countdown has something to count toward.
 */
export const ARTEMIS_RELEASE_AT = Date.parse("2026-09-26T12:00:00+05:30");

/**
 * The shape of a problem statement — but never one of them.
 *
 * The interface lives out here, in the public module, so the client components
 * that render a statement can type their props without importing
 * lib/artemis-trials.ts. That module carries `import "server-only"`, which turns
 * a client import into a build error; keeping the type separate means the guard
 * only ever fires on a real mistake, rather than on a component that legitimately
 * needs to describe what it was handed.
 */
export interface ProblemStatement {
  /** Also the deep-link anchor: #trial-i. */
  id: string;
  /** "I", "II", "III" — set large on the crest. */
  numeral: string;
  /** The Greek patron the trial is placed under. Framing only. */
  patron: string;
  /** One word: the patron's domain. "Healing", "Water", "Lightning". */
  patronDomain: string;
  /** The statement's own title, as the committee wrote it. */
  title: string;
  /** Each array is rendered as separate <p> blocks, in order. */
  background: string[];
  challenge: string[];
  scope: string[];
}

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
 * Guidelines — the rules of the trial.
 *
 * The problem statements these govern are not in this file; see the note at the
 * top. The guidelines are, because they are not embargoed: rule 6 requires teams
 * to submit their component requirements *before* the hackathon, so they are
 * only useful if published well ahead of it.
 * ------------------------------------------------------------------ */

/** Verbatim from the committee's document, rendered as a numbered list. */
export const GUIDELINES: string[] = [
  "Participants are free to select their own technical approach and implementation methodology.",
  "Teams may use hardware, software, mechanical design, automation logic, or a combination of multiple approaches to develop their solution.",
  "The proposed solution must demonstrate a functional prototype at the end of the hackathon.",
  "The solution should demonstrate meaningful automation and should not be limited to basic monitoring or indication.",
  "Innovation may be demonstrated through technical design, automation methodology, software intelligence, mechanical design, system efficiency, reliability, cost optimisation, accessibility, or practical implementation.",
  "Teams will be required to submit their proposed component requirements prior to the hackathon, as per the instructions provided by the organizing committee.",
  "The approved components provided to each team shall form the basis of their hardware implementation during the hackathon.",
  "The use of unauthorized or externally procured hardware components during the hackathon may result in disqualification, subject to the rules of the event.",
  "Mechanical components and structures may be fabricated through the facilities and resources permitted by the organizing committee.",
  "Final evaluation will be based on the functionality, innovation, automation capability, technical implementation, practical relevance, and overall effectiveness of the proposed solution.",
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
