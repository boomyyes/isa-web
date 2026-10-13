// Every email the site and its scripts send goes out here, from the chapter's
// official account (isa.rait@rait.ac.in) over Google's SMTP, authenticated with
// an app password. No other sender exists. Node runtime only: SMTP needs a socket.

import nodemailer, { type Transporter } from "nodemailer";

export const MAIL_FROM_ADDRESS = "isa.rait@rait.ac.in";

export const mailConfigured = () => Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);

export type OutgoingMail = { to: string; subject: string; text: string; html: string; replyTo?: string };

let transport: Transporter | null = null;

function transporter(): Transporter {
  const port = Number(process.env.SMTP_PORT ?? 465);
  transport ??= nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port,
    secure: port === 465, // 465 is implicit TLS; 587 upgrades via STARTTLS
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    // One connection, reused: Gmail throttles parallel bursts.
    pool: true,
    maxConnections: 1,
    maxMessages: 50,
  });
  return transport;
}

// Bulk scripts send one after another; spacing them keeps Gmail from rate limiting a long run.
const MIN_GAP_MS = 600;
let nextSlot = 0;

export async function sendMail(mail: OutgoingMail, fromName = "ISA RAIT Student Chapter") {
  if (!mailConfigured()) throw new Error("SMTP_USER / SMTP_PASS are not set");

  const now = Date.now();
  const wait = Math.max(0, nextSlot - now);
  nextSlot = Math.max(now, nextSlot) + MIN_GAP_MS;
  if (wait) await new Promise((resolve) => setTimeout(resolve, wait));

  await transporter().sendMail({ from: `${fromName} <${MAIL_FROM_ADDRESS}>`, ...mail });
}

/** Lets a CLI script exit once its last message is sent. */
export function closeMail() {
  transport?.close();
  transport = null;
}
