// Sending + templates, shared by the API routes and the CLI scripts so message
// wording lives in one place. Everything goes out from the official account
// (lib/send-mail.ts).

import { closeMail, mailConfigured, MAIL_FROM_ADDRESS, sendMail, type OutgoingMail } from "./send-mail";
import { button, detailRows, codeBox, emailLayout, paragraph, richText, type EmailLayout } from "./email-layout";

/**
 * Hold on ALL student mail (certificate codes, resets, form pings, scripts),
 * set 7 Oct 2026 at the chapter's request and lifted 14 Oct 2026. Set it back to
 * true to pause student mail again.
 * A constant rather than an env var, so a dashboard edit can't release it.
 *
 * While held: welcome codes stay queued and go out once lifted; reset requests
 * answer "unavailable"; form pings are skipped; scripts refuse to send.
 * Admin sign-in codes (lib/admin/mail.ts) are not held.
 */
export const OFFICIAL_MAIL_HELD = false;
export const MAIL_HELD_MESSAGE = "Outgoing student mail is on hold (OFFICIAL_MAIL_HELD in lib/mailer.ts).";

let warned = false;

export function mailerConfigured(): boolean {
  if (OFFICIAL_MAIL_HELD) {
    if (!warned) console.warn(MAIL_HELD_MESSAGE);
    warned = true;
    return false;
  }
  return mailConfigured();
}

/** Kept in the old transport's shape so the scripts' send/close calls still work. */
export function mailer() {
  // Second line of defence, for any caller that skips mailerConfigured().
  if (OFFICIAL_MAIL_HELD) throw new Error(MAIL_HELD_MESSAGE);
  return {
    sendMail: (mail: OutgoingMail) => sendMail(mail),
    close: closeMail,
  };
}

export function siteUrl(): string {
  return (process.env.SITE_URL ?? "https://www.isarait.in").replace(/\/+$/, "");
}

const firstNameOf = (name: string) => name.trim().split(/\s+/)[0] || "there";

/** A built email, before it is addressed and sent. */
export type Message = { subject: string; text: string; html: string };

/** The student-facing layout around every message in this file. */
const studentEmail = (opts: Omit<EmailLayout, "brand" | "siteUrl">) =>
  emailLayout({ ...opts, brand: "Student Chapter", siteUrl: siteUrl() });

const FROM_THE_CHAPTER = "Sent by the ISA RAIT Student Chapter.";

/** Sent once, when a student is first registered. */
export async function sendAccessCodeEmail(opts: {
  to: string;
  name: string;
  uid: string;
  password: string;
}) {
  await mailer().sendMail({ to: opts.to, ...accessCodeMessage(opts) });
}

export function accessCodeMessage(opts: { name: string; uid: string; password: string }): Message {
  const url = siteUrl();
  const text = [
    `Hi ${firstNameOf(opts.name)},`,
    ``,
    `Your ISA-RAIT certificate account is ready. Use these details to download`,
    `your workshop certificates:`,
    ``,
    `  UID:         ${opts.uid}`,
    `  Access code: ${opts.password}`,
    ``,
    `Collect them here: ${url}/certificates`,
    ``,
    `The access code is not case-sensitive and the dash is optional.`,
    `Keep this email. If you lose the code you can request a new one from the`,
    `certificates page — we can't look up your existing one.`,
    ``,
    `If you didn't attend an ISA-RAIT workshop, you can ignore this message.`,
    ``,
    `— ISA RAIT Student Chapter`,
  ].join("\n");

  const html = studentEmail({
    preheader: `Your UID and access code for downloading workshop certificates.`,
    eyebrow: "Certificates",
    title: "Your certificate account is ready",
    content: [
      paragraph(`Hi ${firstNameOf(opts.name)},`),
      paragraph("Your ISA-RAIT certificate account is ready. Use these details to download your workshop certificates:"),
      detailRows(
        [
          ["UID", opts.uid],
          ["Access code", opts.password],
        ],
        { mono: true }
      ),
      button(`${url}/certificates`, "Collect your certificates"),
      paragraph("The access code is not case-sensitive and the dash is optional.", { muted: true }),
      paragraph(
        "Keep this email. If you lose the code you can request a new one from the certificates page — we can't look up your existing one.",
        { muted: true }
      ),
    ].join("\n"),
    footerNote: "If you didn't attend an ISA-RAIT workshop, you can ignore this message.",
  });

  return { subject: "Your ISA-RAIT certificate access code", text, html };
}

/** Fills {name}, {firstName} and {uid}. Unknown placeholders are left as written. */
export function personalize(template: string, vars: { name: string; uid: string }) {
  const values: Record<string, string> = {
    name: vars.name || "there",
    firstName: firstNameOf(vars.name),
    uid: vars.uid,
  };
  return template.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match);
}

/**
 * A one-off message written by hand — announcements, corrections, follow-ups.
 * `body` is plain text; blank lines separate paragraphs, and bare URLs become links.
 */
export async function sendCustomEmail(opts: { to: string; subject: string; body: string }) {
  await mailer().sendMail({ to: opts.to, ...customMessage(opts) });
}

export function customMessage(opts: { subject: string; body: string }): Message {
  const text = `${opts.body.trim()}\n\n— ISA RAIT Student Chapter`;
  const html = studentEmail({
    preheader: opts.body.trim().split(/\r?\n/)[0].slice(0, 120),
    content: richText(opts.body),
    footerNote: FROM_THE_CHAPTER,
  });
  return { subject: opts.subject, text, html };
}

/**
 * Carries a link, not a new code: the existing code keeps working until the link
 * is opened, so a stranger spamming resets can't lock a student out.
 */
export async function sendResetEmail(opts: {
  to: string;
  name: string;
  uid: string;
  link: string;
  expiresMinutes: number;
}) {
  await mailer().sendMail({ to: opts.to, ...resetMessage(opts) });
}

export function resetMessage(opts: { name: string; uid: string; link: string; expiresMinutes: number }): Message {
  const text = [
    `Hi ${firstNameOf(opts.name)},`,
    ``,
    `Someone asked for a new ISA-RAIT certificate access code for UID ${opts.uid}.`,
    ``,
    `Open this link to get one:`,
    `${opts.link}`,
    ``,
    `The link expires in ${opts.expiresMinutes} minutes and can be used once.`,
    ``,
    `Your current code keeps working until you open it. If you didn't ask for`,
    `this, ignore this email — nothing has changed.`,
    ``,
    `— ISA RAIT Student Chapter`,
  ].join("\n");

  const html = studentEmail({
    preheader: `A link to get a new access code for UID ${opts.uid}.`,
    eyebrow: "Certificates",
    title: "Reset your access code",
    content: [
      paragraph(`Hi ${firstNameOf(opts.name)},`),
      paragraph(`Someone asked for a new ISA-RAIT certificate access code for UID ${opts.uid}.`),
      button(opts.link, "Get a new access code"),
      paragraph(`The link expires in ${opts.expiresMinutes} minutes and can be used once.`, { muted: true }),
    ].join("\n"),
    footerNote: "Your current code keeps working until you open it. If you didn't ask for this, ignore this email — nothing has changed.",
  });

  return { subject: "Reset your ISA-RAIT access code", text, html };
}

// ------------------------------------------------------------ form submissions

/** A submitted form as label/value pairs, in the order the sheet shows them. */
export type FormRecord = { ref: string; label: string; fields: [string, string][] };

const filled = (fields: [string, string][]) => fields.filter(([, value]) => value !== "");

const recordText = (fields: [string, string][]) =>
  filled(fields)
    .map(([label, value]) => `${label}: ${value}`)
    .join("\n");

/** Where committee copies go: FORMS_NOTIFY_TO, else the official inbox. */
export const committeeInbox = () => process.env.FORMS_NOTIFY_TO || MAIL_FROM_ADDRESS;

/** The full submission, to the committee. Reply-To is the sender, so a reply goes straight to them. */
export async function sendFormRecordToCommittee(record: FormRecord, replyTo?: string) {
  await mailer().sendMail({ to: committeeInbox(), replyTo, ...formRecordMessage(record, Boolean(replyTo)) });
}

export function formRecordMessage(record: FormRecord, hasReplyTo: boolean): Message {
  const intro = `A new ${record.label} (${record.ref}) was submitted on the website.`;
  const footer = `It is also in the admin inbox and the submissions sheet.${hasReplyTo ? " Replying to this email reaches the sender." : ""}`;
  return {
    subject: `New ${record.label} ${record.ref}`,
    text: `${intro}\n\n${recordText(record.fields)}\n\n${footer}`,
    html: studentEmail({
      preheader: intro,
      eyebrow: "New submission",
      title: `${record.label.charAt(0).toUpperCase()}${record.label.slice(1)} ${record.ref}`,
      content: [paragraph(intro), detailRows(filled(record.fields))].join("\n"),
      footerNote: footer,
    }),
  };
}

/**
 * A receipt for the person who sent it: the reference and what happens next.
 * Nothing they typed goes in it, not even their name. The address isn't
 * verified, so echoing input would let anyone mail any text to any inbox from
 * the official account.
 */
export async function sendFormReceipt(record: FormRecord, to: string, next: string) {
  await mailer().sendMail({ to, ...formReceiptMessage(record, next) });
}

export function formReceiptMessage(record: Pick<FormRecord, "ref" | "label">, next: string): Message {
  const intro = `We've received your ${record.label}. Your reference is ${record.ref}; quote it if you follow up.`;
  const notYou = "If this wasn't you, reply to this email and let us know.";
  return {
    subject: `We received your ${record.label} (${record.ref})`,
    text: ["Hello,", "", `${intro} ${next}`, "", notYou, "", "— ISA RAIT Student Chapter"].join("\n"),
    html: studentEmail({
      preheader: `Your reference is ${record.ref}.`,
      eyebrow: "Received",
      title: `We received your ${record.label}`,
      content: [paragraph("Hello,"), paragraph(`${intro} ${next}`), codeBox(record.ref)].join("\n"),
      footerNote: notYou,
    }),
  };
}

