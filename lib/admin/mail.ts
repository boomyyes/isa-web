// Login links go out from the chapter forms Gmail, not the account that sends
// certificate mail. Gmail SMTP with an app password; nothing else to configure.

import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { LOGIN_TTL_SECONDS } from "./config";

let transport: Transporter | null = null;

export const adminMailConfigured = () =>
  Boolean(process.env.ADMIN_SMTP_USER && process.env.ADMIN_SMTP_PASS);

function mailer(): Transporter {
  transport ??= nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user: process.env.ADMIN_SMTP_USER, pass: process.env.ADMIN_SMTP_PASS },
  });
  return transport;
}

/** `code` is always six digits, so it's safe to put in the HTML as is. */
export async function sendLoginCode(to: string, code: string) {
  const minutes = LOGIN_TTL_SECONDS / 60;
  await mailer().sendMail({
    from: `ISA-RAIT Admin <${process.env.ADMIN_SMTP_USER}>`,
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
