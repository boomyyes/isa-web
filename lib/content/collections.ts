// Every editable content file, described once. The admin editor renders its
// forms from these fields, and the same description builds the validation used
// before publishing and at build time (scripts/check-content.ts), so the form
// and the check can't drift apart. Client-safe: no Node imports.

import { z } from "zod";

export type Field =
  | {
      key: string;
      label: string;
      type: "text" | "textarea" | "url" | "date" | "path";
      required?: boolean;
      help?: string;
    }
  | { key: string; label: string; type: "image"; folder: string; required?: boolean; help?: string }
  | { key: string; label: string; type: "select"; options: readonly string[]; required?: boolean; help?: string }
  | { key: string; label: string; type: "boolean"; help?: string }
  | { key: string; label: string; type: "paragraphs"; help?: string }
  | { key: string; label: string; type: "group"; fields: Field[]; help?: string }
  | { key: string; label: string; type: "list"; fields: Field[]; itemTitle: string; help?: string };

export type Collection = {
  name: string;
  label: string;
  file: string;
  description: string;
  /** "list": the file is an array of items; "object": a single object of fields. */
  shape: "list" | "object";
  fields: Field[];
  /** For lists: the field shown as each item's title in the editor. */
  itemTitle?: string;
};

const SITE_PATH = /^\/[A-Za-z0-9/_.-]*$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const memberFields: Field[] = [
  { key: "id", label: "ID", type: "text", required: true, help: "Unique, lowercase, never changed once published (e.g. jc-tech-4)." },
  { key: "name", label: "Name", type: "text", required: true },
  { key: "role", label: "Role", type: "text", required: true },
  { key: "photo", label: "Photo", type: "image", folder: "team", help: "Leave empty to show the placeholder box." },
  { key: "linkedin", label: "LinkedIn URL", type: "url" },
  { key: "technical", label: "Technical role (shows GitHub link)", type: "boolean" },
  { key: "github", label: "GitHub URL", type: "url", help: "Only shown when Technical role is ticked." },
  { key: "hidden", label: "Hidden from the site", type: "boolean" },
];

export const COLLECTIONS: Collection[] = [
  {
    name: "team",
    label: "Team",
    file: "content/site/team.json",
    description: "Faculty, core, sub-core and joint-core members on /community.",
    shape: "object",
    fields: [
      { key: "faculty", label: "Faculty", type: "list", itemTitle: "name", fields: memberFields },
      { key: "core", label: "Core", type: "list", itemTitle: "name", fields: memberFields },
      { key: "subCore", label: "Sub-core", type: "list", itemTitle: "name", fields: memberFields },
      {
        key: "jointCore",
        label: "Joint core domains",
        type: "list",
        itemTitle: "domain",
        fields: [
          { key: "domain", label: "Domain", type: "text", required: true },
          { key: "members", label: "Members", type: "list", itemTitle: "name", fields: memberFields },
        ],
      },
    ],
  },
  {
    name: "leadership",
    label: "Principal & mentor",
    file: "content/site/leadership.json",
    description: "The principal's and faculty mentor's messages on /community.",
    shape: "object",
    fields: [
      {
        key: "principal",
        label: "Principal",
        type: "group",
        fields: [
          { key: "name", label: "Name", type: "text", required: true },
          { key: "title", label: "Title", type: "text", required: true },
          { key: "photo", label: "Photo", type: "image", folder: "", required: true },
          { key: "linkedin", label: "LinkedIn URL", type: "url" },
          { key: "message", label: "Message", type: "paragraphs", help: "One box per paragraph." },
        ],
      },
      {
        key: "facultyMentor",
        label: "Faculty mentor",
        type: "group",
        fields: [
          ...memberFields.filter((f) => f.key !== "hidden" && f.key !== "technical" && f.key !== "github"),
          { key: "title", label: "Title shown with the message", type: "text", required: true },
          { key: "message", label: "Message", type: "paragraphs", help: "One box per paragraph." },
        ],
      },
    ],
  },
  {
    name: "upcoming-events",
    label: "Upcoming events",
    file: "content/site/upcoming-events.json",
    description: "Announced events not held yet. Shown in this order.",
    shape: "list",
    itemTitle: "title",
    fields: [
      { key: "id", label: "ID", type: "text", required: true, help: "Unique, e.g. evt-up-plc." },
      { key: "title", label: "Title", type: "text", required: true },
      { key: "when", label: "When (shown as written)", type: "text", required: true, help: "e.g. Mid-October 2026, TBA." },
      { key: "start", label: "Start date (for the calendar)", type: "date", help: "Optional. Puts the event on the calendar feed." },
      { key: "href", label: "Link to a page on this site", type: "path", help: "e.g. /artemis. Leave empty for plain text." },
    ],
  },
  {
    name: "events",
    label: "Past events",
    file: "content/site/events.json",
    description: "The archive on /initiatives, grouped by tenure.",
    shape: "list",
    itemTitle: "title",
    fields: [
      { key: "id", label: "ID", type: "text", required: true },
      { key: "title", label: "Title", type: "text", required: true },
      { key: "date", label: "Date (first day)", type: "date", required: true },
      { key: "type", label: "Type", type: "text", required: true, help: "Workshop, Industrial Visit, Guest Lecture…" },
      { key: "venue", label: "Venue", type: "text", required: true },
      { key: "tenure", label: "Tenure", type: "text", required: true, help: "Must match one in Tenures, e.g. 2026-27." },
      { key: "image", label: "Photo", type: "image", folder: "events" },
      { key: "description", label: "Recap", type: "textarea" },
    ],
  },
  {
    name: "tenures",
    label: "Tenures",
    file: "content/site/tenures.json",
    description: "Committee years with a Finished section, newest first.",
    shape: "list",
    itemTitle: "label",
    fields: [
      { key: "id", label: "ID", type: "text", required: true, help: "e.g. 2027-28" },
      { key: "label", label: "Label", type: "text", required: true },
    ],
  },
  {
    name: "projects",
    label: "Projects",
    file: "content/site/projects.json",
    description: "Projects on /initiatives.",
    shape: "list",
    itemTitle: "title",
    fields: [
      { key: "id", label: "ID", type: "text", required: true },
      { key: "title", label: "Title", type: "text", required: true },
      { key: "tagline", label: "Tagline", type: "text" },
      { key: "status", label: "Status", type: "select", options: ["Live", "In Progress", "Completed"], required: true },
      { key: "image", label: "Photo", type: "image", folder: "projects" },
      { key: "description", label: "Description", type: "textarea", required: true },
      {
        key: "verticals",
        label: "Verticals",
        type: "list",
        itemTitle: "name",
        fields: [
          { key: "name", label: "Name", type: "text", required: true },
          { key: "description", label: "Description", type: "textarea", required: true },
        ],
      },
      { key: "approach", label: "Approach", type: "textarea" },
    ],
  },
  {
    name: "achievements",
    label: "Achievements",
    file: "content/site/achievements.json",
    description: "Awards on /initiatives, sorted by date automatically.",
    shape: "list",
    itemTitle: "title",
    fields: [
      { key: "id", label: "ID", type: "text", required: true },
      { key: "title", label: "Title", type: "text", required: true },
      { key: "date", label: "Date (sort key)", type: "date", required: true },
      { key: "dateLabel", label: "Date as shown", type: "text", help: "Optional, e.g. October 2025 when the day isn't known." },
      { key: "awardedTo", label: "Awarded to", type: "text", required: true },
      { key: "awardedBy", label: "Awarded by", type: "text", required: true },
      { key: "scope", label: "Scope", type: "select", options: ["International", "National", "State", "Institute"], required: true },
      { key: "image", label: "Photo", type: "image", folder: "achievements" },
      { key: "description", label: "Description", type: "textarea" },
    ],
  },
  {
    name: "gallery",
    label: "Gallery",
    file: "content/site/gallery.json",
    description: "Home page photos. The 1st is large, the 4th is wide.",
    shape: "list",
    itemTitle: "alt",
    fields: [
      { key: "id", label: "ID", type: "text", required: true },
      { key: "url", label: "Photo", type: "image", folder: "gallery", required: true },
      { key: "alt", label: "Caption (also read by screen readers)", type: "text", required: true },
    ],
  },
  {
    name: "sponsors",
    label: "Sponsors",
    file: "content/site/sponsors.json",
    description: "The sponsor ticker on the home page.",
    shape: "list",
    itemTitle: "name",
    fields: [
      { key: "id", label: "ID", type: "text", required: true },
      { key: "name", label: "Name", type: "text", required: true },
    ],
  },
  {
    name: "support-faqs",
    label: "Support FAQs",
    file: "content/site/support-faqs.json",
    description: "Questions on /help.",
    shape: "list",
    itemTitle: "question",
    fields: [
      { key: "question", label: "Question", type: "text", required: true },
      { key: "answer", label: "Answer", type: "textarea", required: true },
    ],
  },
];

export const collectionByName = (name: string) => COLLECTIONS.find((c) => c.name === name);

// ------------------------------------------------------------------ validation

/** Optional fields are dropped when empty, so the JSON stays as tidy as hand-written. */
function fieldSchema(field: Field): z.ZodType {
  const req = "required" in field && field.required;
  // A required field left empty is removed by tidy(), so "missing" must read as "required".
  const str = () => z.string(`${field.label} is required.`);
  // An optional field may also be "", which the site treats the same as absent.
  const wrap = (s: z.ZodType) => (req ? s : z.union([z.literal(""), s]).optional());
  switch (field.type) {
    case "text":
    case "textarea":
      return wrap(str().trim().min(req ? 1 : 0, `${field.label} is required.`).max(field.type === "text" ? 300 : 10000));
    case "url":
      return wrap(str().trim().max(500).refine((v) => v === "" || /^(https?:\/\/)?[^\s]+\.[^\s]+$/i.test(v), `${field.label} must be a web address.`));
    case "date":
      return wrap(str().regex(ISO_DATE, `${field.label} must be a date.`));
    case "path":
      return wrap(str().regex(SITE_PATH, `${field.label} must start with / and be a path on this site.`));
    case "image":
      return wrap(str().regex(SITE_PATH, `${field.label} must be an image on this site.`));
    case "select":
      return wrap(z.enum(field.options as [string, ...string[]], `${field.label}: choose one of the options.`));
    case "boolean":
      return z.boolean().optional();
    case "paragraphs":
      return z.array(z.string().trim().min(1).max(10000)).max(50);
    case "group":
      return objectSchema(field.fields);
    case "list":
      return z.array(objectSchema(field.fields)).max(500);
  }
}

function objectSchema(fields: Field[]) {
  return z.strictObject(Object.fromEntries(fields.map((f) => [f.key, fieldSchema(f)])));
}

/** The full-file schema, plus checks that span items (unique ids, known tenures). */
export function collectionSchema(collection: Collection) {
  const item = objectSchema(collection.fields);
  const base = collection.shape === "list" ? z.array(item).max(500) : item;
  return base.superRefine((value, ctx) => {
    const seen = new Set<string>();
    const visit = (node: unknown, path: (string | number)[]) => {
      if (Array.isArray(node)) return node.forEach((n, i) => visit(n, [...path, i]));
      if (!node || typeof node !== "object") return;
      const obj = node as Record<string, unknown>;
      if (typeof obj.id === "string") {
        if (seen.has(obj.id)) ctx.addIssue({ code: "custom", path: [...path, "id"], message: `Duplicate ID "${obj.id}".` });
        seen.add(obj.id);
      }
      for (const [k, v] of Object.entries(obj)) if (typeof v === "object") visit(v, [...path, k]);
    };
    visit(value, []);
  });
}

/** Removes empty optional strings and false booleans before saving. */
export function tidy(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(tidy);
  if (!value || typeof value !== "object") return value;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value)) {
    if (v === "" || v === undefined || v === null || v === false) continue;
    out[k] = tidy(v);
  }
  return out;
}
