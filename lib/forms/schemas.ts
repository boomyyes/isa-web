// Form schemas, shared by the client (inline errors) and the API (the check that
// counts). Client-safe: no Node imports here.

import { z } from "zod";

/** One line of text: trimmed, inner whitespace collapsed, length-capped. */
const line = (label: string, min: number, max: number) =>
  z
    .string()
    .transform((value) => value.replace(/\s+/g, " ").trim())
    .pipe(
      z
        .string()
        .min(min, `${label} is too short.`)
        .max(max, `${label} must be ${max} characters or fewer.`)
    );

/** Free text: trimmed, line breaks kept but runs of blank lines squashed. */
const text = (label: string, min: number, max: number) =>
  z
    .string()
    .transform((value) => value.replace(/\r\n?/g, "\n").replace(/\n{3,}/g, "\n\n").trim())
    .pipe(
      z
        .string()
        .min(min, `${label} is too short.`)
        .max(max, `${label} must be ${max} characters or fewer.`)
    );

const email = z
  .string()
  .transform((value) => value.trim().toLowerCase())
  .pipe(z.email("Enter a valid email address.").max(254, "That email address is too long."));

/**
 * Required on every form. Consent is the lawful basis for form data (DPDP Act
 * s.6), and the age line is how we avoid processing a minor's data without a
 * guardian's consent (s.9).
 */
const declarations = {
  consent: z.literal(true, "Tick the box to agree to the Privacy Policy."),
  adult: z.literal(true, "You must be 18 or older to submit this form."),
};

const name = line("Name", 2, 100);

/**
 * Name and email are required unless `anonymous` is ticked, in which case
 * they're dropped entirely, even if the browser sent them, so nothing
 * identifying is stored for an anonymous query. The committee can't reply to
 * those; the form says so.
 */
export const querySchema = z
  .object({
    anonymous: z.boolean().optional(),
    name: z.string().optional(),
    email: z.string().optional(),
    subject: line("Subject", 3, 150),
    message: text("Message", 10, 3000),
    ...declarations,
  })
  // `when`: runs even if other fields failed, so name and email errors show in
  // the same pass as the rest instead of only after everything else is fixed.
  .superRefine(
    (value, ctx) => {
      if (value?.anonymous === true) return;
      const blank = (v: unknown) => typeof v !== "string" || !v.trim();
      const n = name.safeParse(typeof value?.name === "string" ? value.name : "");
      const e = email.safeParse(typeof value?.email === "string" ? value.email : "");
      if (!n.success) {
        const message = blank(value?.name) ? "Enter your name, or choose to send without it." : n.error.issues[0].message;
        ctx.addIssue({ code: "custom", path: ["name"], message });
      }
      if (!e.success) {
        const message = blank(value?.email) ? "Enter your email address, or choose to send without it." : e.error.issues[0].message;
        ctx.addIssue({ code: "custom", path: ["email"], message });
      }
    },
    { when: () => true }
  )
  .transform((value) => {
    const { anonymous, name: rawName, email: rawEmail, ...rest } = value;
    if (anonymous) return { ...rest, anonymous: true as const };
    // Already checked above; parse again only for the cleaned-up values.
    return { ...rest, name: name.parse(rawName), email: email.parse(rawEmail) };
  });

export type QueryInput = z.input<typeof querySchema>;
export type QueryData = z.output<typeof querySchema>;

export const FORMS = {
  query: { schema: querySchema, prefix: "Q", label: "query" },
} as const;

export type FormName = keyof typeof FORMS;

export const isFormName = (value: string): value is FormName => Object.hasOwn(FORMS, value);

/**
 * Anti-bot fields every form posts alongside its data. `website` is a honeypot
 * hidden from people; `elapsed` is milliseconds since the form mounted.
 */
export const HONEYPOT_FIELD = "website";
export const MIN_FILL_MS = 3000;

/** First error per field, for showing under each input. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}
