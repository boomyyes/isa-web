// Admin mail (sign-in codes, announcement alerts), sent from the official account
// (lib/send-mail.ts). Never held.

import "server-only";
import { ADMIN_HOST, LOGIN_TTL_SECONDS } from "./config";
import { MAIL_FROM_ADDRESS, mailConfigured, sendMail, type OutgoingMail } from "@/lib/send-mail";

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

const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Gmail caps recipients per message over SMTP; well under it, so a batch is never refused. */
const BCC_BATCH = 90;

/**
 * A new announcement, to every member of the admin workspace except the person
 * who posted it, as one email: addressed to the official inbox with everyone
 * in Bcc, so nobody sees anyone else's address. Larger teams go in batches.
 * Returns how many recipients' batches failed; one failed batch never stops the rest.
 */
export async function sendAnnouncementEmails(
  recipients: string[],
  announcement: { title: string; body: string; postedBy: string }
): Promise<number> {
  const link = `https://${ADMIN_HOST}/announcements`;
  const subject = `ISA-RAIT announcement: ${announcement.title}`;
  const text = [
    announcement.title,
    "",
    announcement.body,
    "",
    `Posted by ${announcement.postedBy}. Read it in the admin workspace: ${link}`,
  ].join("\n");
  const html = `<div style="font-family:system-ui,sans-serif;line-height:1.6;color:#1E293B;max-width:560px">
  <p style="color:#64748B;font-size:13px;text-transform:uppercase;letter-spacing:1px;margin:0">New announcement</p>
  <h2 style="margin:6px 0 14px;font-size:20px">${escapeHtml(announcement.title)}</h2>
  <div style="white-space:pre-wrap">${escapeHtml(announcement.body)}</div>
  <p style="margin-top:22px"><a href="${link}" style="display:inline-block;background:#00A3C4;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600">Open announcements</a></p>
  <p style="color:#64748B;font-size:13px">Posted by ${escapeHtml(announcement.postedBy)}. You get this because you're a member of the ISA-RAIT admin workspace.</p>
</div>`;

  let failed = 0;
  for (let i = 0; i < recipients.length; i += BCC_BATCH) {
    const bcc = recipients.slice(i, i + BCC_BATCH);
    try {
      await send({ to: MAIL_FROM_ADDRESS, bcc, subject, text, html });
    } catch (error) {
      failed += bcc.length;
      console.error(`[announcements] batch of ${bcc.length} failed:`, error);
    }
  }
  return failed;
}
