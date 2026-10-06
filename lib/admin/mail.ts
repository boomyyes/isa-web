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

export async function sendLoginLink(to: string, url: string) {
  const minutes = LOGIN_TTL_SECONDS / 60;
  await mailer().sendMail({
    from: `ISA-RAIT Admin <${process.env.ADMIN_SMTP_USER}>`,
    to,
    subject: "Your ISA-RAIT admin sign-in link",
    text: [
      "Use this link to sign in to the ISA-RAIT admin area:",
      "",
      url,
      "",
      `It works once and expires in ${minutes} minutes.`,
      "If you didn't ask to sign in, ignore this email. Nobody can use the link without access to your inbox.",
    ].join("\n"),
    html: `<div style="font-family:system-ui,sans-serif;line-height:1.6;color:#1E293B;max-width:520px">
  <p>Use this link to sign in to the ISA-RAIT admin area:</p>
  <p><a href="${url}" style="color:#00A3C4">Sign in</a></p>
  <p style="color:#64748B;font-size:14px">It works once and expires in ${minutes} minutes. If you didn't ask to sign in, ignore this email.</p>
</div>`,
  });
}
