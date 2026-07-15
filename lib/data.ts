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
const member = (id: string, role: string): TeamMember => ({
  id,
  role,
  name: "[Name]",
  socials: placeholderSocials,
});

export const principal = {
  name: "[Principal's Name]",
  title: "Principal, RAIT",
  message:
    "[Principal's message placeholder — a warm, forward-looking note about the ISA RAIT student chapter, its mission, and the students driving it. Replace this entire block with the real message. Keep it a few paragraphs long so the layout breathes.]",
};

export const faculty: TeamMember[] = [
  member("fac-advisor", "Faculty Advisor"),
  member("fac-coordinator", "Faculty Coordinator"),
];

export const core: TeamMember[] = [
  member("core-president", "President"),
  member("core-vp", "Vice President"),
  member("core-treasurer", "Treasurer"),
  member("core-gen-sec", "General Secretary"),
  member("core-ceo", "Chief Event Organizer"),
];

export const subCore: TeamMember[] = [
  member("sub-pro", "Public Relations Officer"),
  member("sub-sponsorship", "Sponsorship Officer"),
  member("sub-cto", "Chief Technical Officer"),
];

export interface JointCoreDomain {
  domain: string;
  members: TeamMember[];
}

export const jointCore: JointCoreDomain[] = [
  {
    domain: "Technical",
    members: [
      member("jc-tech-1", "Technical Co-head"),
      member("jc-tech-2", "Technical Co-head"),
      member("jc-tech-3", "Technical Co-head"),
      member("jc-tech-4", "Technical Co-head"),
    ],
  },
  {
    domain: "Editorial",
    members: [
      member("jc-edit-1", "Historian"),
      member("jc-edit-2", "Historian"),
    ],
  },
  {
    domain: "Publicity",
    members: [
      member("jc-pub-1", "Publicity Co-head"),
      member("jc-pub-2", "Publicity Co-head"),
      member("jc-pub-3", "Publicity Co-head"),
    ],
  },
  {
    domain: "Administration",
    members: [
      member("jc-admin-1", "Administration Head"),
      member("jc-admin-2", "Administration Co-head"),
      member("jc-admin-3", "Administration Co-head"),
    ],
  },
  {
    domain: "Creativity",
    members: [
      member("jc-create-1", "Creativity Head"),
      member("jc-create-2", "Creativity Co-head"),
      member("jc-create-3", "Creativity Co-head"),
    ],
  },
  {
    domain: "Media",
    members: [
      member("jc-media-1", "Media Head"),
      member("jc-media-2", "Media Co-head"),
      member("jc-media-3", "Media Co-head"),
      member("jc-media-4", "Media Co-head"),
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
  date: string;
  title: string;
  type: string;
}

export const mockEvents: EventItem[] = [
  {
    id: "evt-1",
    date: "[Aug 12, 2026]",
    title: "[Event Title 01]",
    type: "Workshop",
  },
  {
    id: "evt-2",
    date: "[Sep 03, 2026]",
    title: "[Event Title 02]",
    type: "Guest Lecture",
  },
  {
    id: "evt-3",
    date: "[Oct 21, 2026]",
    title: "[Event Title 03]",
    type: "Competition",
  },
  {
    id: "evt-4",
    date: "[Nov 15, 2026]",
    title: "[Event Title 04]",
    type: "Industrial Visit",
  },
  {
    id: "evt-5",
    date: "[Dec 09, 2026]",
    title: "[Event Title 05]",
    type: "Hackathon",
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
