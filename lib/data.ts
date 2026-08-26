// ---------------------------------------------------------------------------
// Community / team hierarchy mock data — swap [Name] and socials for real data.
// ---------------------------------------------------------------------------

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

/** Stand-in href for a profile whose real URL we do not have yet. */
interface MemberOptions {
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
 * Small helper to keep the member list declarations terse. Each member owns its
 * own socials array, and an entry only exists once its URL does — so icons
 * appear one at a time as real profiles get filled in, with no dead "#" state.
 */
const member = (
  id: string,
  role: string,
  name: string,
  { photo, linkedin, github, technical = false }: MemberOptions = {}
): TeamMember => {
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

// Through profileUrl() for the same reason every member entry is: a blank or
// scheme-less URL collapses to undefined, and the link below is dropped rather
// than rendered pointing nowhere.
const principalSocials: SocialLink[] = (() => {
  const linkedin = profileUrl(
    "https://www.linkedin.com/in/dr-mukesh-d-patil-42785039/"
  );
  return linkedin ? [{ platform: "linkedin", href: linkedin }] : [];
})();

export const principal = {
  name: "Dr. Mukesh D. Patil",
  title: "Principal, RAIT",
  /** 544x700 — intrinsic size is declared at the call site. Kept as JPEG, not the
   *  GIF it was sourced from: next/image passes GIF through unconverted (~170 KB),
   *  while a JPEG source lets the optimizer emit WebP/AVIF instead. */
  photo: "/principal.jpg",
  /**
   * Same shape as a TeamMember's socials, so the community page can pull the
   * link out of the principal and the mentor through one code path.
   */
  socials: principalSocials,
  /** One entry per rendered paragraph. */
  message: [
    "As the Principal of Ramrao Adik Institute of Technology, I am pleased to see our students taking an active part in activities beyond their regular academic work. The ISA-RAIT Student Chapter has been one such platform where students come together with an interest in automation, technology and practical engineering.",
    "Throughout the year, the chapter has conducted technical workshops, industrial visits, expert sessions, competitions and other activities that give students opportunities to learn outside the classroom. These activities allow them to interact with professionals, understand how technology is used in industry and gain practical experience alongside their academic studies.",
    "I believe that students learn a great deal from such experiences. Taking responsibility for an event, working with a team, presenting a project or participating in a competition helps develop skills that cannot always be learned from a textbook. It teaches them to communicate, work together, handle challenges and become more confident in their own abilities. It has also been encouraging to see students take the initiative to organise activities for their peers.",
    "The support of the faculty mentors and the efforts of the student committee have helped the chapter carry out its activities during the year. I appreciate everyone associated with ISA-RAIT and congratulate the students for their work and enthusiasm. I hope they continue to learn, take on new responsibilities and make the most of the opportunities ahead.",
  ],
};

const facultyMentorEntry = member(
  "fac-mentor",
  "Faculty Mentor",
  "Dr. Sharad P Jadhav",
  {
    photo: "/team/sharad-jadhav.jpg",
    linkedin: "https://www.linkedin.com/in/dr-sharad-p-jadhav-b884b939/",
  }
);

export const faculty: TeamMember[] = [
  member("fac-coordinator", "Faculty Coordinator", "Dr. Supriya Bhuran", { photo: "/team/supriya-bhuran.jpg", linkedin: "https://www.linkedin.com/in/dr-supriya-bhuran-yadav-2899211a/" }),
];

/** The mentor's note, shown beside the principal's. Same shape as `principal`. */
export const facultyMentor = {
  ...facultyMentorEntry,
  title: "Faculty Mentor, ISA-RAIT",
  /** One entry per rendered paragraph — same contract as principal.message. */
  message: [
    "The ISA-RAIT Student Chapter gives students an opportunity to explore automation, technology and practical engineering beyond the classroom. During the year, the chapter has conducted technical workshops, industrial visits, expert sessions, competitions and student projects, giving students the chance to learn through practical experience.",
    "It has been encouraging to see students take an active role in planning and conducting these activities. Organising a workshop, arranging an industrial visit, preparing a competition or working on a project helps students learn teamwork, planning and responsibility while dealing with real situations. It also gives them the confidence to take decisions, solve problems and handle responsibilities on their own.",
    "At ISA-RAIT, we have always tried to keep the focus on practical learning. A workshop should give students something useful to take forward, an industrial visit should show them how technology is used in industry, and a project or competition should give them a chance to apply what they have learned. The efforts of the student committee and faculty team have helped make these activities possible, and I appreciate the students who have taken responsibility and worked together to make them successful.",
    "I congratulate the entire ISA-RAIT team for their work during the year. I hope the chapter continues to give students opportunities to learn, experiment, work together and take on new responsibilities in the years ahead.",
  ],
};

export const core: TeamMember[] = [
  member("core-president", "President", "Yash Patil", { photo: "/team/yash-patil.jpg", linkedin: "https://www.linkedin.com/in/yash-v-patil/" }),
  member("core-vp", "Vice President", "Jyotiraditya Patil", { photo: "/team/jyotiraditya-patil.jpg", linkedin: "https://www.linkedin.com/in/jyotiraditya-patil-73b394274/" }),
  member("core-treasurer", "Treasurer", "Arya Bhagwat", { photo: "/team/arya-bhagwat.jpg", linkedin: "https://www.linkedin.com/in/arya-bhagwat-08653334b/" }),
  member("core-gen-sec", "General Secretary", "Harsh Watkar", { photo: "/team/harsh-watkar.jpg", linkedin: "https://www.linkedin.com/in/harsh-watkar-00105a346/" }),
  member("core-ceo", "Chief Event Organizer", "Janhavi Patankar", { photo: "/team/janhavi-patankar.jpg", linkedin: "https://www.linkedin.com/in/janhavi-patankar-264292397/" }),
];

export const subCore: TeamMember[] = [
  member("sub-pro", "Public Relations Officer", "Suhani Guralwar", { photo: "/team/suhani-guralwar.jpg", linkedin: "https://www.linkedin.com/in/suhani-guralwar-b43807421/" }),
  member("sub-sponsorship", "Sponsorship Officer", "Suhas Dongre", { photo: "/team/suhas-dongre.jpg", linkedin: "https://www.linkedin.com/in/suhasdongre/" }),
  member("sub-cto", "Chief Technical Officer", "Chris Misquitta", { technical: true, photo: "/team/chris-misquitta.jpg", linkedin: "https://www.linkedin.com/in/chrismm31313/", github: "https://github.com/CMM31313" }),
];

export interface JointCoreDomain {
  domain: string;
  members: TeamMember[];
}

export const jointCore: JointCoreDomain[] = [
  {
    domain: "Technical",
    members: [
      member("jc-tech-1", "Technical Member", "Ujjwal Prajapati", { technical: true, photo: "/team/ujjwal-prajapati.jpg", linkedin: "www.linkedin.com/in/ujjwalprajapati915/", github: "https://github.com/minoubs" }),
      member("jc-tech-2", "Technical Member", "Aryesh Deshmukh", { technical: true, photo: "/team/aryesh-deshmukh.jpg", linkedin: "https://www.linkedin.com/in/aryesh-deshmukh-9373693b7/", github: "https://github.com/Aryesh0/" }),
      member("jc-tech-3", "Technical Member", "Avanish Wankhede", { technical: true, photo: "/team/avanish-wankhede.jpg", linkedin: "https://www.linkedin.com/in/avanishwankhede/", github: "https://github.com/boomyyes/" }),
    ],
  },
  {
    domain: "Editorial",
    members: [
      member("jc-edit-1", "Historian", "Keyur Kulkarni", { photo: "/team/keyur-kulkarni.jpg", linkedin: "https://www.linkedin.com/in/keyur-anand-kulkarni-b89508333/" }),
      member("jc-edit-2", "Historian", "Aadya Bharde", { photo: "/team/aadya-bharde.jpg" }),
    ],
  },
  {
    domain: "Publicity",
    members: [
      member("jc-pub-1", "Publicity Member", "Eshan Aryaa", { photo: "/team/eshan-aryaa.jpg", linkedin: "https://www.linkedin.com/in/eshan-arya-696848312/" }),
      member("jc-pub-2", "Publicity Member", "Ansh Bhoir", { photo: "/team/ansh-bhoir.jpg", linkedin: "https://www.linkedin.com/in/ansh-bhoir-5238b2329/" }),
      member("jc-pub-3", "Publicity Member", "Anjali Karpe", { photo: "/team/anjali-karpe.jpg" }),
    ],
  },
  {
    domain: "Administration",
    members: [
      member("jc-admin-1", "Administration Head", "Ayan Varekar", { photo: "/team/ayan-varekar.jpg", linkedin: "https://www.linkedin.com/in/ayanvarekar/" }),
      // member("jc-admin-3", "Administration Co-head", "Atharv Gharat", { linkedin: "https://www.linkedin.com/in/atharva-gharat-b12a6b306/" }),
      member("jc-admin-2", "Administration Co-head", "Atharv Bhoir", { technical: true, photo: "/team/atharv-bhoir.jpg", linkedin: "https://www.linkedin.com/in/atharv-bhoir-800352388", github: "https://github.com/AtharvKB" }),
    ],
  },
  {
    domain: "Creativity",
    members: [
      member("jc-create-1", "Creativity Head", "Yahya Dongarkar", { photo: "/team/yahya-dongarkar.jpg" }),
      member("jc-create-2", "Creativity Co-head", "Vaibhavi Patil", { photo: "/team/vaibhavi-patil.jpg", linkedin: "https://www.linkedin.com/in/vaibhavi-patil-836b1a382" }),
      member("jc-create-3", "Creativity Co-head", "Shriya Dalvi", { photo: "/team/shriya-dalvi.jpg" }),
      member("jc-create-4", "Creativity Co-head", "Angel Bari", { photo: "/team/angel-bari.jpg", linkedin: "https://www.linkedin.com/in/angel-bari-75441b300/" }),
      member("jc-create-5", "Creativity Co-head", "Tanmayi Rathod", { photo: "/team/tanmayi-rathod.jpg" }),
    ],
  },
  {
    domain: "Media",
    members: [
      member("jc-media-1", "Media Head", "Mazen Zari", { photo: "/team/mazen-zari.jpg", linkedin: "https://www.linkedin.com/in/mazen-ejaj-zari-63968b243" }),
      member("jc-media-2", "Media Co-head", "Sayan Dutta", { photo: "/team/sayan-dutta.jpg" }),
      member("jc-media-3", "Media Co-head", "Vishesh Karot", { photo: "/team/vishesh-karot.jpg", linkedin: "https://www.linkedin.com/in/vishesh-karoth-0061273aa/" }),
      member("jc-media-4", "Media Co-head", "Mayuri Varti", { photo: "/team/mayuri-varti.jpg" }),
    ],
  },
];

export const SPONSORS = [
  { name: "Siemens Sitrain India", id: "siemens" },
  { name: "Eduvance India", id: "eduvance" },
  { name: "Yokogawa India LTD", id: "yokogawa" },
  { name: "Ceryle Innovative Tech", id: "ceryle" },
];

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

export const mockProjects: Project[] = [
  {
    id: "proj-ignite",
    title: "Project IGNITE",
    tagline: "Experimental rocketry — design, simulation, fabrication and instrumentation",
    description:
      "Project IGNITE is the rocketry programme of the ISA RAIT Student Chapter, focused on the design, simulation, fabrication and instrumentation of experimental rockets. The project covers the development of the rocket from initial analysis and CAD design through to physical fabrication, avionics integration and testing. It is divided into three technical verticals, each handling a specific part of the rocket development process and contributing to the design and testing of the overall vehicle.",
    status: "In Progress",
    image: "/projects/ignite.jpeg",
    verticals: [
      {
        name: "Sensors and Avionics",
        description:
          "Handles the electronics and instrumentation of the rocket. The team develops the flight computer, sensor integration, power distribution, data acquisition and telemetry systems, with the flight computer designed to record parameters such as acceleration, altitude and orientation during flight. The team also works on the physical layout of the avionics and sensor bay, including component mounting, wiring and integration within the rocket.",
      },
      {
        name: "Research and Simulations",
        description:
          "Handles the analytical work behind the rocket, covering propulsion calculations, rocket performance analysis, trajectory modelling and flight simulations. CAD models and simulation results are used to evaluate the vehicle before fabrication and testing, and the team analyses experimental data to compare actual flight behaviour against predicted performance.",
      },
      {
        name: "Hardware",
        description:
          "Responsible for developing the physical rocket, working on CAD modelling, structural design, fabrication, assembly and mechanical integration. This covers the rocket body and the internal component layout, accommodating the propulsion system, flight computer, sensors and other subsystems, and converts the designs developed through analysis and simulation into the physical rocket structure.",
      },
    ],
    approach:
      "Project IGNITE follows an iterative development process. Research and Simulations develops and evaluates the technical parameters, Hardware implements the physical design, and Sensors and Avionics integrates the systems required to measure and record flight data. Results from testing are used to validate the simulations and improve subsequent designs. Through this process IGNITE continues to build capability in rocket propulsion, structural engineering, CAD design, computational simulation, avionics and flight instrumentation, with each development cycle contributing to the next stage of the project.",
  },
];

/**
 * A committee tenure (academic year). Add the next one here and to TENURES when
 * the committee changes over.
 */
export type TenureId = "2025-26" | "2026-27";

/**
 * Every tenure that gets a "Finished" section, newest first — this array is the
 * render order, so put new tenures at the top.
 */
export const TENURES: { id: TenureId; label: string }[] = [
  { id: "2026-27", label: "2026-27" },
  { id: "2025-26", label: "2025-26" },
];

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
   * rule, and events do fall on the "wrong" side of the calendar year — the
   * Tarapur visit below is dated Feb 2026 but belongs to the 2025-26 tenure.
   * Pinning it here is what keeps a finished event in its own tenure's section
   * permanently, however far the clock moves on.
   */
  tenure: TenureId;
}

/**
 * An event that has been announced but not held yet. Deliberately thinner than
 * EventItem: before an event runs, the name and a rough sense of when are
 * usually all that is settled, so that is all this asks for.
 *
 * Once it has actually happened, move it into `mockEvents` below as a full
 * EventItem — with the real date, venue, and a recap — and delete it from here.
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
   * Optional. When set, the row's title becomes a link to this path — for the
   * few events that get a page of their own. Omit it and the row renders as
   * plain text, which is the case for most entries.
   */
  href?: string;
}

/**
 * The upcoming list, rendered top to bottom in the order written here — rough
 * dates cannot be sorted reliably, so ordering is yours to decide. Empty is a
 * valid state; the panel shows a "nothing scheduled" line.
 *
 * Shape:
 *   { id: "evt-up-plc", title: "PLC Bootcamp", when: "Mid-September 2026" },
 */
export const upcomingEvents: UpcomingEvent[] = [
  { id: "evt-up-ros", title: "ROS Bootcamp", when: "21 August 2026" },
  {
    id: "evt-up-3d-printing",
    title: "3D Printing Workshop",
    when: "5 September 2026",
  },
  { id: "evt-up-arvr", title: "AR/VR Workshop", when: "25 September 2026" },
  {
    id: "evt-up-artemis",
    title: "Artemis Hackathon",
    when: "26 September 2026",
    href: "/artemis",
  },
];

// The archive: events that have already happened. Grouped into per-tenure
// sections by their `tenure` field, NOT by date — see groupFinishedByTenure in
// lib/events.ts — and sorted newest first within each section.
export const mockEvents: EventItem[] = [

  // ── 2026-27 tenure, newest first ───────────────────────────────────────────
  {
    id: "evt-cvml-2026",
    date: "2026-08-14",
    title: "Computer Vision & Machine Learning: From Data to Intelligence",
    type: "Workshop",
    venue: "RAIT",
    image: "/events/CVML_2026.jpg",
    description:
      "ISA-RAIT organised a hands-on workshop on Computer Vision and Machine Learning on 14th August 2026, introducing participants to real-world AI workflows and practical implementation. The session focused on building end-to-end AI pipelines while bridging the gap between theoretical understanding and applied intelligence. Participants worked through the Titanic Survival Prediction dataset from Kaggle, covering data preprocessing, feature engineering and model building with Logistic Regression and Decision Trees, alongside an introduction to the core concepts of supervised learning and model evaluation. The workshop also featured a live demonstration of moon crater detection using computer vision techniques with OpenCV, and exposure to real-time vision system concepts using Python libraries including Pandas, NumPy, Scikit-learn and OpenCV. It was conducted by Yash Patil, an ISA-RAIT Joint Core Member, who guided participants through each stage of the AI pipeline with practical insights and interactive learning. ISA-RAIT extends its gratitude to Dr. Sharad P. Jadhav, Head of the Department, the organising team and all participants for making the event a success.",
    tenure: "2026-27",
  },
  {
    id: "evt-automationx-2026",
    // Ran 1-2 August 2026; `date` holds the opening day and the span is spelled
    // out in the description, as with the other multi-day workshops below.
    date: "2026-08-01",
    title: "AutomationX 2026",
    type: "Workshop",
    venue: "011 Lab",
    description:
      "ISA-RAIT organised AutomationX 2026, a two-day hands-on workshop on industrial automation, on 1st and 2nd August 2026. The workshop gave participants practical exposure to PLC programming and control, SCADA systems, Cyber-Physical Systems (CPS), IT-OT convergence and core industrial automation concepts through interactive sessions and laboratory-based learning, enabling students to gain valuable hands-on experience with industrial automation technologies. Guest speakers Mr. Lalit Bangera and Ms. Deepti Chacko Bangera shared their industry expertise and real-world insights into industrial automation, digital transformation, Industry 4.0 and manufacturing excellence. Dr. Supriya Bhuran, Dr. Vivek Kadam, Dr. Ramakant Patil and Mr. Abhay Pakhare conducted technical sessions, provided hands-on guidance and mentored participants throughout, making it a truly enriching learning experience. ISA-RAIT extends its gratitude to all participants for their enthusiasm and active involvement, and to the entire ISA-RAIT team for their dedication in organising the workshop.",
    tenure: "2026-27",
  },

  // ── Finished — 2025-26 tenure. Pinned by `tenure`, so these stay in the
  //    2025-26 section permanently regardless of how dates compare to today. ──
  {
    id: "evt-fin-1",
    date: "2025-08-23",
    title: "AR/VR Game Development",
    type: "Workshop",
    venue: "AR/VR Lab",
    description:
      "ISA RAIT organized an AR/VR Game Development workshop on 23 August 2025 at the RAIT AR/VR Lab to introduce students to the rapidly growing field of immersive technologies and bridge academic learning with practical exposure. The workshop was attended by enthusiastic participants from multiple departments and included lectures, live demonstrations, and hands-on practice to provide a comprehensive learning experience. The session aimed to introduce beginners to Augmented Reality (AR) and Virtual Reality (VR), offer hands-on training in Unity for AR/VR development, demonstrate the design and coding of interactive VR objects and virtual environments, provide direct VR experience through live demonstrations, and encourage students to explore creative applications of AR/VR in game development and beyond.",
    tenure: "2025-26",
  },
  {
    id: "evt-fin-2",
    date: "2025-08-25",
    title: "FE Induction 2025",
    type: "Induction",
    venue: "RAIT",
    description:
      "ISA-RAIT conducted a three-day induction program for first-year students on 25th, 28th, and 29th August 2025. The sessions were held in multiple rooms and time slots to accommodate all participants and ensure maximum engagement. The objective of the induction was to introduce new students to the ISA community, explain its activities and benefits, and encourage them to actively join and contribute to the committee. The program focused on building awareness about ISA’s role in promoting technical skills, leadership development, and community participation.",
    tenure: "2025-26",
  },
  {
    id: "evt-fin-3",
    date: "2025-10-04",
    title: "IoT Workshop",
    type: "Workshop",
    venue: "IoT Lab",
    description:
      "ISA-RAIT hosted a two-day IoT Innovation Workshop on 4th and 5th October 2025 to provide hands-on exposure to Internet of Things (IoT) technologies. The workshop covered key IoT concepts and practical applications, focusing on microcontrollers, sensors, and cloud integration. Participants learned how to connect sensors, collect data, and transmit it online, while also being encouraged to design and experiment with their own IoT ideas. The workshop aimed to introduce foundational and intermediate IoT concepts, provide practical experience with platforms such as Arduino, Raspberry Pi, and ESP32, demonstrate sensor interfacing and cloud data transmission, and empower participants to conceptualize their own IoT projects. Overall, the session enhanced technical skills and fostered interest in the IoT domain.",
    tenure: "2025-26",
  },
  {
    id: "evt-fin-4",
    date: "2025-10-10",
    title: "PLC Workshop",
    type: "Workshop",
    venue: "011 IA Lab",
    description:
      "ISA RAIT organized a 2-day Hands-On PLC Programming Workshop on 10th and 11th October 2025 at the Industrial Automation Lab (011). The workshop began at 10:30 AM and saw enthusiastic participation from students across various engineering branches. The event was inaugurated by Prof. Sharad Jadhav, Head of the Department of Instrumentation Engineering, who highlighted the importance of skill development in industrial automation and encouraged students to explore PLC technology for their professional growth. The workshop aimed to provide hands-on training in PLC programming and automation systems, familiarize students with real-time industrial applications, and develop an understanding of automation logic, sensors, and control mechanisms. The session focused on enhancing technical and practical skills aligned with industry requirements and motivating students to pursue careers in the industrial automation sector.",
    tenure: "2025-26",
  },
  {
    id: "evt-fin-5",
    date: "2025-10-11",
    title: "3D Printing Workshop",
    type: "Workshop",
    venue: "Fab Lab",
    description:
      "ISA-RAIT organized a Hands-On 3D Printing Workshop on 11th and 12th October 2025 at the Fab Lab, RAIT. The event was open to all students for a minimal fee of ₹80, with limited seats to ensure personalized attention and practical experience. The workshop provided participants with direct interaction with 3D printing machines and design tools through informative sessions, handson activities, and a design competition. The workshop aimed to introduce participants to the fundamentals of 3D printing, familiarize them with different types of printers and printing techniques, and demonstrate the full process from design to the final printed product. Students gained practical experience using beginner-friendly design tools such as Tinkercad, and were encouraged to explore creativity and innovation through a design contest where they printed their own models.",
    tenure: "2025-26",
  },
  {
    id: "evt-fin-6",
    date: "2025-11-01",
    title: "Fundamentals of Electrical and Electronics Engineering",
    type: "Workshop",
    venue: "IoT Lab",
    description:
      "The ISA-RAIT Student Chapter successfully conducted an insightful Workshop on Foundations and Fundamentals of Electrical and Electronics Engineering under the theme “Bridging Theory and Practice.” The two-day workshop was held on 1st and 2nd November at Room 108, IoT Lab, from 10:00 AM to 5:00 PM. The workshop was designed to strengthen students’ understanding of the core concepts of electrical and electronics engineering, helping them connect theoretical knowledge with real-world applications. It focused on building a solid technical base while encouraging practical thinking — a crucial requirement in today’s rapidly evolving, technology-driven world.",
    tenure: "2025-26",
  },
  {
    id: "evt-fin-7",
    date: "2026-02-24",
    title: "Industrial Visit to Tarapur Atomic Power Station",
    type: "Industrial Visit",
    venue: "Tarapur Atomic Power unit",
    description:
      "On February 24, 2026, ISA-RAIT and the Department of Electrical & Instrumentation Engineering organized a visit for 45+ students to the Tarapur Atomic Power Station (NPCIL-TAPS). The session began with a PPT explaining atomic energy generation and the critical role of process control and system engineering in monitoring production. Students then saw the live control room, observing real-time panels that manage reactor operations. The tour concluded with a close-up view of the generator rooms and turbines, demonstrating the complete, live working of the power plant. Guided by Dr. Sharad P. Jadhav, Dr. Supriya Bhuran, Dr. Ramakant Patil, and Mr. Prashant Raut (TAPS), the visit successfully connected classroom theory to real-world industrial application.",
    tenure: "2025-26",
  },
];

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
export const mockAchievements: Achievement[] = [
  {
    id: "ach-ignite-isro-felicitation",
    // Only the month is on record, so this is the 1st purely as a sort key —
    // `dateLabel` is what actually renders. See Achievement.dateLabel.
    date: "2025-10-01",
    dateLabel: "October 2025",
    title: "Felicitation by the Chairman, ISRO",
    awardedTo: "Team IGNITE",
    awardedBy: "Dr. V. Narayanan, Chairman, ISRO",
    scope: "State",
    image: "/achievements/ignite-felicitation.jpeg",
    description:
      "Team IGNITE was felicitated by Dr. V. Narayanan, Chairman of the Indian Space Research Organisation, at the Conquer Space Inter-Collegiate Exhibition organised by the Navi Mumbai Tamil Sangam. The team was recognised for its work on a solid fuel rocket prototype developed under Project IGNITE, a significant step in its pursuit of practical rocketry and aerospace engineering. The team showcased the complete technical development of the rocket, including its CAD-based structural design, propulsion modelling, flight simulations and performance analysis. The exhibition also featured the rocket's flight computer and avionics architecture, with a dedicated sensor bay integrating flight sensors for the measurement of acceleration, altitude and orientation, developed to support onboard data acquisition and flight monitoring. Presenting the project on a platform associated with the Indian space sector and receiving felicitation from the Chairman of ISRO marked a notable achievement for Team IGNITE and the ISA RAIT Student Chapter, highlighting the team's efforts in integrating rocket propulsion, structural engineering, computational simulation and avionics into a single student-developed rocketry system.",
  },
  {
    id: "ach-solaris",
    // The meet ran 10-11 April 2026; `date` holds a single day, so it carries the
    // opening date and the span is spelled out in the description — same as the
    // multi-day workshops in mockEvents.
    date: "2026-04-10",
    title: "2nd Runner-Up — SOLARIS",
    awardedTo: "Yash Patil",
    awardedBy: "India Automation Competition, PPPA Meet 2026",
    scope: "State",
    image: "/achievements/solaris.jpg",
    description:
      "Awarded at the India Automation Competition held during the PPPA Meet on 10 and 11 April 2026. SOLARIS — an autonomous space weather intelligence system for CME detection, classification and incident response — links space weather forecasting to real infrastructure protection, spotting solar storm events and triggering automated responses for high-risk systems such as power grids. It pairs solar wind telemetry analysis with computer-vision CME detection, running an ensemble of XGBoost and Isolation Forest models into a low-latency control pipeline that fires protective action for grid infrastructure. Guided by Dr. Sharad P. Jadhav and Dr. Supriya Bhuran (Yadav).",
  },
  {
    id: "ach-best-student-leader-2026",
    // Same meet as the SOLARIS award above — 10-11 April 2026.
    date: "2026-04-10",
    title: "Best Student Leader 2026",
    awardedTo: "Shreya Srivastava",
    awardedBy: "ISA Maharashtra Section, PPPA Meet 2026",
    scope: "State",
    image: "/achievements/shreya-srivastava.jpg",
    description:
      "Awarded at the PPPA Meet held on 10 and 11 April 2026 at the CIDCO Exhibition Centre, Vashi, organised by the ISA Maharashtra Section. As President of the ISA-RAIT Student Chapter through the 2025-26 tenure, Shreya Srivastava drove the chapter's student-led initiatives, kept the committee aligned and held its programme of activity steady across the year while balancing the role alongside her academics.",
  },
];

// Articles live in lib/articles.ts — they carry full body content, so they are
// kept out of this file. The initiatives hub and /articles/[slug] both read
// from there.

// Unsplash is asked for display-sized renders, not native resolution. The grid
// cells top out around 640px wide (the 2x2 hero) / 320px (the rest); w= here
// targets ~2x DPR so the browser decodes a few hundred KB per image instead of
// several MB. Without w=, Unsplash serves the full ~5000px source (the hero was
// 8 MB), and decoding all four on the main thread stalls the entrance animation.
export const GALLERY_IMAGES = [
  {
    id: "img1", // 2x2 hero — widest cell
    url: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=75&w=1280",
    alt: "Automation Lab 1",
  },
  {
    id: "img2",
    url: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&q=75&w=800",
    alt: "Robotics Workshop",
  },
  {
    id: "img3",
    url: "https://images.unsplash.com/photo-1581092335397-9583eb92d232?auto=format&fit=crop&q=75&w=800",
    alt: "Industrial Control Systems",
  },
  {
    id: "img4", // spans 2 columns — wider than the single cells
    url: "https://images.unsplash.com/photo-1537462715879-360eeb61a0ad?auto=format&fit=crop&q=75&w=1280",
    alt: "PCB Manufacturing",
  },
];
