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

export const querySchema = z.object({
  name: line("Name", 2, 100),
  email,
  subject: line("Subject", 3, 150),
  message: text("Message", 10, 3000),
  ...declarations,
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
