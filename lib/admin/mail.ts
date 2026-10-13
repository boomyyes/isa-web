// Admin sign-in codes, sent from the official account (lib/send-mail.ts). Never held.

import "server-only";
import { LOGIN_TTL_SECONDS } from "./config";
import { mailConfigured, sendMail, type OutgoingMail } from "@/lib/send-mail";

export const adminMailConfigured = mailConfigured;

const send = (message: OutgoingMail) => sendMail(message, "ISA-RAIT Admin");

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
