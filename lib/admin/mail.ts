// Admin sign-in codes. Never from the official rait.ac.in account.
//
// Preferred: Resend (RESEND_API_KEY), sending as ADMIN_MAIL_FROM
// (no-reply@isarait.in; the domain is verified in Resend), so the mail is
// DKIM-signed for the chapter's own domain and doesn't look like a stranger's Gmail.
// Fallback: the chapter forms Gmail over SMTP with an app password, used when
// Resend isn't configured, or if a Resend send fails, so sign-in keeps working.

import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { LOGIN_TTL_SECONDS } from "./config";

let transport: Transporter | null = null;

const resendConfigured = () => Boolean(process.env.RESEND_API_KEY && process.env.ADMIN_MAIL_FROM);
const gmailConfigured = () => Boolean(process.env.ADMIN_SMTP_USER && process.env.ADMIN_SMTP_PASS);

export const adminMailConfigured = () => resendConfigured() || gmailConfigured();

function mailer(): Transporter {
  transport ??= nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user: process.env.ADMIN_SMTP_USER, pass: process.env.ADMIN_SMTP_PASS },
  });
  return transport;
}

type Message = { to: string; subject: string; text: string; html: string };

async function sendWithResend(message: Message) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: `ISA-RAIT Admin <${process.env.ADMIN_MAIL_FROM}>`, ...message }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`Resend ${response.status}: ${(await response.text()).slice(0, 200)}`);
}

async function send(message: Message) {
  if (resendConfigured()) {
    try {
      return await sendWithResend(message);
    } catch (error) {
      if (!gmailConfigured()) throw error;
      console.error("[admin mail] Resend failed, falling back to Gmail:", error);
    }
  }
  await mailer().sendMail({ from: `ISA-RAIT Admin <${process.env.ADMIN_SMTP_USER}>`, ...message });
}

/** `code` is always six digits, so it's safe to put in the HTML as is. */
export async function sendLoginCode(to: string, code: string) {
  const minutes = LOGIN_TTL_SECONDS / 60;
  await send({
    to,
    subject: `Your ISA-RAIT admin sign-in code: ${code}`,
    text: [
      "Your code to sign in to the ISA-RAIT admin area:",
      "",
      code,
      "",
      `It works once and expires in ${minutes} minutes.`,
      "Never share this code. If you didn't ask to sign in, ignore this email.",
    ].join("\n"),
    html: `<div style="font-family:system-ui,sans-serif;line-height:1.6;color:#1E293B;max-width:520px">
  <p>Your code to sign in to the ISA-RAIT admin area:</p>
  <p style="font-family:ui-monospace,monospace;font-size:32px;font-weight:700;letter-spacing:8px;margin:16px 0">${code}</p>
  <p style="color:#64748B;font-size:14px">It works once and expires in ${minutes} minutes. Never share this code. If you didn't ask to sign in, ignore this email.</p>
</div>`,
  });
}
