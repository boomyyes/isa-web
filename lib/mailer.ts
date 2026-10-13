// Sending + templates, shared by the API routes and the CLI scripts so message
// wording lives in one place. Everything goes out from the official account
// (lib/send-mail.ts).

import { closeMail, mailConfigured, MAIL_FROM_ADDRESS, sendMail, type OutgoingMail } from "./send-mail";

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

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const firstNameOf = (name: string) => name.trim().split(/\s+/)[0] || "there";

function shell(body: string) {
  return `<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;line-height:1.6;color:#1E293B;max-width:520px">
${body}
  <p style="color:#64748B;font-size:14px">— ISA RAIT Student Chapter</p>
</div>`;
}

function credentialsTable(uid: string, password: string) {
  return `  <table style="border-collapse:collapse;margin:20px 0;background:#F4F7FA;border-radius:8px">
    <tr><td style="padding:10px 16px;color:#64748B">UID</td>
        <td style="padding:10px 16px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:16px;font-weight:600">${escapeHtml(uid)}</td></tr>
    <tr><td style="padding:10px 16px;color:#64748B">Access code</td>
        <td style="padding:10px 16px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:16px;font-weight:600;letter-spacing:1px">${escapeHtml(password)}</td></tr>
  </table>`;
}

function button(href: string, label: string) {
  return `  <p><a href="${escapeHtml(href)}" style="display:inline-block;background:#00A3C4;color:#fff;padding:11px 22px;border-radius:6px;text-decoration:none;font-weight:600">${escapeHtml(label)}</a></p>`;
}

/** Sent once, when a student is first registered. */
export async function sendAccessCodeEmail(opts: {
  to: string;
  name: string;
  uid: string;
  password: string;
}) {
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

  const html = shell(
    `  <p>Hi ${escapeHtml(firstNameOf(opts.name))},</p>
  <p>Your ISA-RAIT certificate account is ready. Use these details to download your workshop certificates:</p>
${credentialsTable(opts.uid, opts.password)}
${button(`${url}/certificates`, "Collect your certificates")}
  <p style="color:#64748B;font-size:14px">The access code is not case-sensitive and the dash is optional.<br>
  Keep this email. If you lose the code you can request a new one from the certificates page — we can't look up your existing one.</p>
  <p style="color:#64748B;font-size:14px">If you didn't attend an ISA-RAIT workshop, you can ignore this message.</p>`
  );

  await mailer().sendMail({
    to: opts.to,
    subject: "Your ISA-RAIT certificate access code",
    text,
    html,
  });
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
  const text = `${opts.body.trim()}\n\n— ISA RAIT Student Chapter`;

  const paragraphs = opts.body
    .trim()
    .split(/\r?\n\s*\r?\n/)
    .map(
      (paragraph) =>
        `  <p>${escapeHtml(paragraph)
          .replace(/https?:\/\/[^\s<]+/g, (href) => `<a href="${href}" style="color:#00A3C4">${href}</a>`)
          .replace(/\r?\n/g, "<br>")}</p>`
    )
    .join("\n");

  await mailer().sendMail({
    to: opts.to,
    subject: opts.subject,
    text,
    html: shell(paragraphs),
  });
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

  const html = shell(
    `  <p>Hi ${escapeHtml(firstNameOf(opts.name))},</p>
  <p>Someone asked for a new ISA-RAIT certificate access code for UID <strong>${escapeHtml(opts.uid)}</strong>.</p>
${button(opts.link, "Get a new access code")}
  <p style="color:#64748B;font-size:14px">The link expires in ${opts.expiresMinutes} minutes and can be used once.</p>
  <p style="color:#64748B;font-size:14px">Your current code keeps working until you open it. If you didn't ask for this, ignore this email — nothing has changed.</p>`
  );

  await mailer().sendMail({
    to: opts.to,
    subject: "Reset your ISA-RAIT access code",
    text,
    html,
  });
}

// ------------------------------------------------------------ form submissions

/** A submitted form as label/value pairs, in the order the sheet shows them. */
export type FormRecord = { ref: string; label: string; fields: [string, string][] };

const filled = (fields: [string, string][]) => fields.filter(([, value]) => value !== "");

function recordTable(fields: [string, string][]) {
  const rows = filled(fields)
    .map(
      ([label, value]) =>
        `    <tr><td style="padding:8px 14px;color:#64748B;vertical-align:top;white-space:nowrap">${escapeHtml(label)}</td><td style="padding:8px 14px;white-space:pre-wrap">${escapeHtml(value)}</td></tr>`
    )
    .join("\n");
  return `  <table style="border-collapse:collapse;margin:16px 0;background:#F4F7FA;border-radius:8px">\n${rows}\n  </table>`;
}

const recordText = (fields: [string, string][]) =>
  filled(fields)
    .map(([label, value]) => `${label}: ${value}`)
    .join("\n");

/** Where committee copies go: FORMS_NOTIFY_TO, else the official inbox. */
export const committeeInbox = () => process.env.FORMS_NOTIFY_TO || MAIL_FROM_ADDRESS;

/** The full submission, to the committee. Reply-To is the sender, so a reply goes straight to them. */
export async function sendFormRecordToCommittee(record: FormRecord, replyTo?: string) {
  const intro = `A new ${record.label} (${record.ref}) was submitted on the website.`;
  const footer = `It is also in the admin inbox and the submissions sheet.${replyTo ? " Replying to this email reaches the sender." : ""}`;
  await mailer().sendMail({
    to: committeeInbox(),
    replyTo,
    subject: `New ${record.label} ${record.ref}`,
    text: `${intro}\n\n${recordText(record.fields)}\n\n${footer}`,
    html: shell(`  <p>${escapeHtml(intro)}</p>
${recordTable(record.fields)}
  <p style="color:#64748B;font-size:14px">${escapeHtml(footer)}</p>`),
  });
}

/** A copy for the person who sent it, with their reference and what happens next. */
export async function sendFormReceipt(record: FormRecord, to: string, name: string, next: string) {
  const greeting = `Hi ${firstNameOf(name)},`;
  const intro = `We've received your ${record.label}. Your reference is ${record.ref}; quote it if you follow up.`;
  const notYou = "If this wasn't you, reply to this email and let us know.";
  await mailer().sendMail({
    to,
    subject: `We received your ${record.label} (${record.ref})`,
    text: [greeting, "", `${intro} ${next}`, "", "What you sent:", recordText(record.fields), "", notYou, "", "— ISA RAIT Student Chapter"].join("\n"),
    html: shell(`  <p>${escapeHtml(greeting)}</p>
  <p>${escapeHtml(intro)} ${escapeHtml(next)}</p>
  <p style="margin-bottom:0">What you sent:</p>
${recordTable(record.fields)}
  <p style="color:#64748B;font-size:14px">${escapeHtml(notYou)}</p>`),
  });
}

