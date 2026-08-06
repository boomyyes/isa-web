// Outbound email: transport + templates.
//
// Shared by the API routes (automatic registration mail, password resets) and by
// the CLI scripts, so there is exactly one place where message wording lives.
//
// Node runtime only — nodemailer opens a TCP socket, so any route importing this
// must not run on the edge.

import nodemailer, { type Transporter } from "nodemailer";

let transport: Transporter | null = null;

/** True when enough SMTP settings exist to attempt a send. */
export function mailerConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      process.env.MAIL_FROM
  );
}

/**
 * Lazily-built transport singleton. Reused across warm invocations so a batch of
 * sends shares one authenticated connection instead of reconnecting per message.
 */
export function mailer(): Transporter {
  if (transport) return transport;

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass || !process.env.MAIL_FROM) {
    throw new Error("SMTP_HOST / SMTP_USER / SMTP_PASS / MAIL_FROM are not set");
  }

  const port = Number(process.env.SMTP_PORT ?? 587);
  transport = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // 465 is implicit TLS; 587 upgrades via STARTTLS
    auth: { user, pass },
    // Keep the connection open across a batch, but cap concurrency — consumer
    // SMTP relays throttle or blacklist on parallel bursts.
    pool: true,
    maxConnections: 1,
    maxMessages: 50,
  });
  return transport;
}

export function siteUrl(): string {
  return (process.env.SITE_URL ?? "https://isarait.org").replace(/\/+$/, "");
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

/** Sent once, when a student is first registered onto the roster. */
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
    from: process.env.MAIL_FROM,
    to: opts.to,
    subject: "Your ISA-RAIT certificate access code",
    text,
    html,
  });
}

/**
 * Sent when someone requests a reset. Carries a link, not a new code — the
 * existing code keeps working until the link is actually opened, so a stranger
 * spamming this endpoint can't lock a student out of their own certificates.
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
    from: process.env.MAIL_FROM,
    to: opts.to,
    subject: "Reset your ISA-RAIT access code",
    text,
    html,
  });
}
