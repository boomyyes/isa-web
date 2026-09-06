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
  when: "26–27 September 2026",
  venue: "Ramrao Adik Institute of Technology, Nerul",
  /** One-line summary; also used as the page's meta description. */
  tagline: "The masterpiece is not the first stroke of the brush, but the final victory over a canvas of mistakes.",
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
export const ARTEMIS_RELEASE_AT = Date.parse("2026-09-09T18:00:00+05:30");

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
    "In Greek legends, Artemis is worshipped as the goddess of hunt and wilderness. She represents unwavering determination and will to navigate through the challenges unknown to the rest. More than having the greatest resources, a successful hunt demands skilful observation, tricky strategies and adaptability to your environment, overall aiding you to make the right decisions when faced with uncertainty.  ",
    "ARTEMIS draws inspiration from this unique spirit of the goddess, challenging innovators to step into the unknown and find solutions to real world problems, while within the constraints of limited time and resources. In those 24 hours, we expect ideas to move beyond presentations and imagination to the actual difficulties of confronting the design, failure, testing, and iteration of your solution, before finally becoming something that helps our society.",
    " Every team at ARTEMIS must analyse its challenge, make important engineering decisions, and transform limited resources into a meaningful innovation of their own. ARTEMIS is all about the pursuit of a solution, where your solutions will ultimately be judged by its ability to work in the real world beyond the canvas. Let the challenge begin! ",
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
  "Each participating team must consist of a minimum of 2 members and a maximum of 4 members.",
  "The hackathon will be conducted continuously for a duration of 24 hours. All participating teams must complete and submit their work within the specified event timeline.",
  "Participants must strictly follow the instructions, timelines, and guidelines provided by the organizing committee throughout the hackathon.",
  "For Round 1, teams must strictly use the official presentation template provided by the organizing committee and adhere to the prescribed slide limit.",
  "All ideas, presentations, designs, code, and prototypes submitted by participating teams must represent their original work. Any form of plagiarism, copying, or misrepresentation of another individual's or team's work is strictly prohibited.",
  "AI tools may be used only as supporting tools. Participants must be able to understand, explain, and justify their proposed solution, implementation, and technical decisions during evaluation.",
  "Each team must submit its required component list within the deadline specified by the organizing committee. The total cost of the requested sensors and electronic components must strictly remain within the maximum budget of ₹2,000 per team.",
  "Only the approved and provided components may be used for prototype development during the hackathon. The use of unauthorized or externally procured components without prior permission from the organizing committee is prohibited. Permitted 3D-printed mechanical structures may be used as per the event guidelines.",
  "Final evaluation will consider factors including innovation and novelty, prototype functionality, technical implementation, automation capability, practical relevance, cost efficiency, and presentation.",
  "Participants must maintain discipline and professional conduct throughout the event. Any misconduct, unfair practices, deliberate interference with another team, damage to equipment, or violation of the event rules may result in penalties or disqualification. The decision of the organizing committee and judging panel shall be final.",
];

/* ------------------------------------------------------------------ *
 * Odyssey — the schedule, as a timeline across two days.
 * ------------------------------------------------------------------ */

export interface OdysseyStop {
  id: string;
  /** Free text, printed as written: "09:00", "Hour 12", "Midnight". */
  time: string;
  title: string;
  detail: string;
}

/**
 * One date of the event, and everything that happens on it.
 *
 * The schedule is grouped rather than flat because the hackathon runs over two
 * dates: a single list of times would put 23:00 directly above 06:00 with
 * nothing to say the night had turned over. Each day carries its own station on
 * the timeline's spine, so the break is shown rather than inferred.
 *
 * Any number of days renders; two is what the event has.
 */
export interface OdysseyDay {
  id: string;
  /** "Day I" — set beside the date at the head of the day. */
  label: string;
  /** Free text, printed as written: "26 September". */
  date: string;
  stops: OdysseyStop[];
}

/** Days, and stops within a day, rendered top to bottom as written here. */
export const ODYSSEY: OdysseyDay[] = [
  {
    id: "day-i",
    label: "Day I",
    date: "26 September",
    stops: [
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
        time: "12:00",
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
    ],
  },
  {
    id: "day-ii",
    label: "Day II",
    date: "27 September",
    stops: [
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
    ],
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
    amount: "₹ 30,000",
    detail: "By the branch of gold, the gates of the unseen open. You topped it all.",
  },
  {
    id: "boon-2",
    rank: "II",
    title: "The Silver Arrow",
    amount: "₹ 15,000",
    detail: "The arrow that hits the bullseye is the result of a hundred misses you didn't let stop you. Don't seek a paved path.",
  },
  {
    id: "boon-3",
    rank: "III",
    title: "The Bronze Aegis",
    amount: "₹ 5,000",
    detail: "Forged under pressure to protect the future of the craft. You made the podium.",
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
