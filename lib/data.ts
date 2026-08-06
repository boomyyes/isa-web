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
  socials: SocialLink[];
}

// Every member shares the same placeholder links for now.
const placeholderSocials: SocialLink[] = [
  { platform: "github", href: "#" },
  { platform: "linkedin", href: "#" },
];

// Small helper to keep the member list declarations terse.
const member = (id: string, role: string, name: string): TeamMember => ({
  id,
  role,
  name,
  socials: placeholderSocials,
});

export const principal = {
  name: "[Principal's Name]",
  title: "Principal, RAIT",
  message:
    "[Principal's message placeholder — a warm, forward-looking note about the ISA RAIT student chapter, its mission, and the students driving it. Replace this entire block with the real message. Keep it a few paragraphs long so the layout breathes.]",
};

export const faculty: TeamMember[] = [
  member("fac-advisor", "Faculty Advisor", "[Name]"),
  member("fac-coordinator", "Faculty Coordinator", "[Name]"),
];

export const core: TeamMember[] = [
  member("core-president", "President", "Yash Patil"),
  member("core-vp", "Vice President", "Jyotiraditya Patil"),
  member("core-treasurer", "Treasurer", "Arya Bhagwat"),
  member("core-gen-sec", "General Secretary", "Harsh Watkar"),
  member("core-ceo", "Chief Event Organizer", "Janhavi Patankar"),
];

export const subCore: TeamMember[] = [
  member("sub-pro", "Public Relations Officer", "Suhani Guralwar"),
  member("sub-sponsorship", "Sponsorship Officer", "Suhas Dongre"),
  member("sub-cto", "Chief Technical Officer", "Chris Misquitta"),
];

export interface JointCoreDomain {
  domain: string;
  members: TeamMember[];
}

export const jointCore: JointCoreDomain[] = [
  {
    domain: "Technical",
    members: [
      member("jc-tech-1", "Technical Member", "Ujjwal Prajapati"),
      member("jc-tech-2", "Technical Member", "Aryesh Deshmukh"),
      member("jc-tech-3", "Technical Member", "Avanish Wankhede"),
    ],
  },
  {
    domain: "Editorial",
    members: [
      member("jc-edit-1", "Historian", "Keyur Kulkarni"),
      member("jc-edit-2", "Historian", "Aadya Bharde"),
    ],
  },
  {
    domain: "Publicity",
    members: [
      member("jc-pub-1", "Publicity Member", "Eshan Aryaa"),
      member("jc-pub-2", "Publicity Member", "Ansh Bhoir"),
      member("jc-pub-3", "Publicity Member", "Anjali Karpe"),
    ],
  },
  {
    domain: "Administration",
    members: [
      member("jc-admin-1", "Administration Head", "Ayan Varekar"),
      member("jc-admin-2", "Administration Co-head", "Atharv Gharat"),
      member("jc-admin-3", "Administration Co-head", "Atharv Bhoir"),
    ],
  },
  {
    domain: "Creativity",
    members: [
      member("jc-create-1", "Creativity Head", "Yahya Dongarkar"),
      member("jc-create-2", "Creativity Co-head", "Vaibhavi Patil"),
      member("jc-create-3", "Creativity Co-head", "Shriya Dalvi"),
      member("jc-create-4", "Creativity Member", "Angel Bari"),
    ],
  },
  {
    domain: "Media",
    members: [
      member("jc-media-1", "Media Head", "Mazen Zari"),
      member("jc-media-2", "Media Co-head", "Sayan Dutta"),
      member("jc-media-3", "Media Co-head", "Vishesh Karot"),
      member("jc-media-4", "Media Co-head", "Mayuri Varti"),
    ],
  },
];

export const SPONSORS = [
  { name: "Siemens", id: "siemens" },
  { name: "Rockwell Automation", id: "rockwell" },
  { name: "Emerson", id: "emerson" },
  { name: "ABB", id: "abb" },
  { name: "Honeywell", id: "honeywell" },
  { name: "Yokogawa", id: "yokogawa" },
  { name: "Schneider Electric", id: "schneider" },
];

// ---------------------------------------------------------------------------
// Initiatives Hub mock data — replace the [placeholder] values with real content.
// ---------------------------------------------------------------------------

export type ProjectStatus = "Live" | "In Progress" | "Completed";

export interface Project {
  id: string;
  title: string;
  description: string;
  status: ProjectStatus;
}

export const mockProjects: Project[] = [
  {
    id: "proj-1",
    title: "[Project Name 01]",
    description:
      "[Short project description placeholder — what it does, the tech, and the impact.]",
    status: "Live",
  },
  {
    id: "proj-2",
    title: "[Project Name 02]",
    description:
      "[Short project description placeholder — what it does, the tech, and the impact.]",
    status: "In Progress",
  },
  {
    id: "proj-3",
    title: "[Project Name 03]",
    description:
      "[Short project description placeholder — what it does, the tech, and the impact.]",
    status: "In Progress",
  },
  {
    id: "proj-4",
    title: "[Project Name 04]",
    description:
      "[Short project description placeholder — what it does, the tech, and the impact.]",
    status: "Completed",
  },
  {
    id: "proj-5",
    title: "[Project Name 05]",
    description:
      "[Short project description placeholder — what it does, the tech, and the impact.]",
    status: "Live",
  },
  {
    id: "proj-6",
    title: "[Project Name 06]",
    description:
      "[Short project description placeholder — what it does, the tech, and the impact.]",
    status: "Completed",
  },
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
  /** Where it happened / will happen — replaces the old "[Venue placeholder]". */
  venue: string;
  /** Short recap; shown on Finished cards. Optional. */
  description?: string;
  /**
   * Thumbnail for Finished cards. Either a real image path served locally, e.g.
   * "/events/ros-workshop.jpg" (drop files in public/events/ — no config needed),
   * or a "[placeholder]" label to render the empty image box. External URLs would
   * need images.remotePatterns in next.config.ts, so prefer local paths.
   */
  image?: string;
}

// Events auto-partition by date: anything dated in the future shows under
// "Upcoming"; once its day has passed it moves to "Finished" on the next visit
// (no rebuild). Scaffold below mixes both — swap the [placeholders] for real data.
// Past dates here represent the 2025-26 committee tenure.
export const mockEvents: EventItem[] = [
  // ── Upcoming (future-dated) ────────────────────────────────────────────────
  {
    id: "evt-up-1",
    date: "2026-09-14",
    title: "[Upcoming Event 01]",
    type: "Workshop",
    venue: "[Venue placeholder]",
  },
  {
    id: "evt-up-2",
    date: "2026-10-08",
    title: "[Upcoming Event 02]",
    type: "Guest Lecture",
    venue: "[Venue placeholder]",
  },
  {
    id: "evt-up-3",
    date: "2026-11-21",
    title: "[Upcoming Event 03]",
    type: "Competition",
    venue: "[Venue placeholder]",
  },

  // ── Finished — 2025-26 tenure (past-dated), newest first ───────────────────
  {
    id: "evt-fin-1",
    date: "2025-08-23",
    title: "AR/VR Game Development",
    type: "Workshop",
    venue: "AR/VR Lab",
    description:
      "ISA RAIT organized an AR/VR Game Development workshop on 23 August 2025 at the RAIT AR/VR Lab to introduce students to the rapidly growing field of immersive technologies and bridge academic learning with practical exposure. The workshop was attended by enthusiastic participants from multiple departments and included lectures, live demonstrations, and hands-on practice to provide a comprehensive learning experience. The session aimed to introduce beginners to Augmented Reality (AR) and Virtual Reality (VR), offer hands-on training in Unity for AR/VR development, demonstrate the design and coding of interactive VR objects and virtual environments, provide direct VR experience through live demonstrations, and encourage students to explore creative applications of AR/VR in game development and beyond.",
    image: "[hackathon-photo-01]",
  },
  {
    id: "evt-fin-2",
    date: "2025-08-25",
    title: "FE Induction 2025",
    type: "Induction",
    venue: "RAIT",
    description:
      "ISA-RAIT conducted a three-day induction program for first-year students on 25th, 28th, and 29th August 2025. The sessions were held in multiple rooms and time slots to accommodate all participants and ensure maximum engagement. The objective of the induction was to introduce new students to the ISA community, explain its activities and benefits, and encourage them to actively join and contribute to the committee. The program focused on building awareness about ISA’s role in promoting technical skills, leadership development, and community participation.",
    image: "[workshop-photo-02]",
  },
  {
    id: "evt-fin-3",
    date: "2025-10-04",
    title: "IoT Workshop",
    type: "Workshop",
    venue: "IoT Lab",
    description:
      "ISA-RAIT hosted a two-day IoT Innovation Workshop on 4th and 5th October 2025 to provide hands-on exposure to Internet of Things (IoT) technologies. The workshop covered key IoT concepts and practical applications, focusing on microcontrollers, sensors, and cloud integration. Participants learned how to connect sensors, collect data, and transmit it online, while also being encouraged to design and experiment with their own IoT ideas. The workshop aimed to introduce foundational and intermediate IoT concepts, provide practical experience with platforms such as Arduino, Raspberry Pi, and ESP32, demonstrate sensor interfacing and cloud data transmission, and empower participants to conceptualize their own IoT projects. Overall, the session enhanced technical skills and fostered interest in the IoT domain.",
    image: "[visit-photo-03]",
  },
  {
    id: "evt-fin-4",
    date: "2025-10-10",
    title: "PLC Workshop",
    type: "Workshop",
    venue: "011 IA Lab",
    description:
      "ISA RAIT organized a 2-day Hands-On PLC Programming Workshop on 10th and 11th October 2025 at the Industrial Automation Lab (011). The workshop began at 10:30 AM and saw enthusiastic participation from students across various engineering branches. The event was inaugurated by Prof. Sharad Jadhav, Head of the Department of Instrumentation Engineering, who highlighted the importance of skill development in industrial automation and encouraged students to explore PLC technology for their professional growth. The workshop aimed to provide hands-on training in PLC programming and automation systems, familiarize students with real-time industrial applications, and develop an understanding of automation logic, sensors, and control mechanisms. The session focused on enhancing technical and practical skills aligned with industry requirements and motivating students to pursue careers in the industrial automation sector.",
    image: "[lecture-photo-04]",
  },
  {
    id: "evt-fin-5",
    date: "2025-10-11",
    title: "3D Printing Workshop",
    type: "Workshop",
    venue: "Fab Lab",
    description:
      "ISA-RAIT organized a Hands-On 3D Printing Workshop on 11th and 12th October 2025 at the Fab Lab, RAIT. The event was open to all students for a minimal fee of ₹80, with limited seats to ensure personalized attention and practical experience. The workshop provided participants with direct interaction with 3D printing machines and design tools through informative sessions, handson activities, and a design competition. The workshop aimed to introduce participants to the fundamentals of 3D printing, familiarize them with different types of printers and printing techniques, and demonstrate the full process from design to the final printed product. Students gained practical experience using beginner-friendly design tools such as Tinkercad, and were encouraged to explore creativity and innovation through a design contest where they printed their own models.",
    image: "[competition-photo-05]",
  },
  {
    id: "evt-fin-6",
    date: "2025-11-01",
    title: "Fundamentals of Electrical and Electronics Engineering",
    type: "Workshop",
    venue: "IoT Lab",
    description:
      "The ISA-RAIT Student Chapter successfully conducted an insightful Workshop on Foundations and Fundamentals of Electrical and Electronics Engineering under the theme “Bridging Theory and Practice.” The two-day workshop was held on 1st and 2nd November at Room 108, IoT Lab, from 10:00 AM to 5:00 PM. The workshop was designed to strengthen students’ understanding of the core concepts of electrical and electronics engineering, helping them connect theoretical knowledge with real-world applications. It focused on building a solid technical base while encouraging practical thinking — a crucial requirement in today’s rapidly evolving, technology-driven world.",
    image: "[workshop-photo-06]",
  },
  {
    id: "evt-fin-7",
    date: "2026-02-24",
    title: "Industrial Visit to Tarapur Atomic Power Station",
    type: "Industrial Visit",
    venue: "Tarapur Atomic Power unit",
    description:
      "On February 24, 2026, ISA-RAIT and the Department of Electrical & Instrumentation Engineering organized a visit for 45+ students to the Tarapur Atomic Power Station (NPCIL-TAPS). The session began with a PPT explaining atomic energy generation and the critical role of process control and system engineering in monitoring production. Students then saw the live control room, observing real-time panels that manage reactor operations. The tour concluded with a close-up view of the generator rooms and turbines, demonstrating the complete, live working of the power plant. Guided by Dr. Sharad P. Jadhav, Dr. Supriya Bhuran, Dr. Ramakant Patil, and Mr. Prashant Raut (TAPS), the visit successfully connected classroom theory to real-world industrial application.",
    image: "[seminar-photo-07]",
  },
];

export interface Article {
  id: string;
  title: string;
  excerpt: string;
  image: string; // placeholder reference — swap for a real image path/URL later
}

export const mockArticles: Article[] = [
  {
    id: "art-1",
    title: "[Feature Article Title]",
    excerpt:
      "[Longer excerpt placeholder for the featured story — this is the hero card of the bento grid.]",
    image: "[thumbnail-01]",
  },
  {
    id: "art-2",
    title: "[Article Title 02]",
    excerpt: "[Short excerpt placeholder for a secondary article.]",
    image: "[thumbnail-02]",
  },
  {
    id: "art-3",
    title: "[Article Title 03]",
    excerpt: "[Short excerpt placeholder for a secondary article.]",
    image: "[thumbnail-03]",
  },
  {
    id: "art-4",
    title: "[Article Title 04]",
    excerpt: "[Short excerpt placeholder for a secondary article.]",
    image: "[thumbnail-04]",
  },
  {
    id: "art-5",
    title: "[Article Title 05]",
    excerpt: "[Short excerpt placeholder for a secondary article.]",
    image: "[thumbnail-05]",
  },
];

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
