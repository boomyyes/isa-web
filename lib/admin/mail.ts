// Admin mail (sign-in codes, announcement alerts), sent from the official account
// (lib/send-mail.ts). Never held.

import "server-only";
import { ADMIN_HOST, LOGIN_TTL_SECONDS } from "./config";
import { MAIL_FROM_ADDRESS, mailConfigured, sendMail, type OutgoingMail } from "@/lib/send-mail";
import { button, codeBox, emailLayout, paragraph, richText, type EmailLayout } from "@/lib/email-layout";
import { siteUrl, type Message } from "@/lib/mailer";

export const adminMailConfigured = mailConfigured;

const send = (message: OutgoingMail) => sendMail(message, "ISA-RAIT Admin");

/** The admin layout: same as student mail, with the workspace named in the band. */
const adminEmail = (opts: Omit<EmailLayout, "brand" | "siteUrl">) =>
  emailLayout({ ...opts, brand: "Admin workspace", siteUrl: siteUrl() });

export async function sendLoginCode(to: string, code: string) {
  await send({ to, ...loginCodeMessage(code) });
}

export function loginCodeMessage(code: string): Message {
  const minutes = LOGIN_TTL_SECONDS / 60;
  return {
    subject: `Your ISA-RAIT admin sign-in code: ${code}`,
    text: [
      "Your code to sign in to the ISA-RAIT admin area:",
      "",
      code,
      "",
      `It works once and expires in ${minutes} minutes.`,
      "Never share this code. If you didn't ask to sign in, ignore this email.",
    ].join("\n"),
    html: adminEmail({
      preheader: `Your sign-in code is ${code}. It expires in ${minutes} minutes.`,
      eyebrow: "Sign in",
      title: "Your sign-in code",
      content: [
        paragraph("Your code to sign in to the ISA-RAIT admin area:"),
        codeBox(code),
        paragraph(`It works once and expires in ${minutes} minutes.`, { muted: true }),
      ].join("\n"),
      footerNote: "Never share this code. If you didn't ask to sign in, ignore this email.",
    }),
  };
}

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
  const { subject, text, html } = announcementMessage(announcement);

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

export function announcementMessage(announcement: { title: string; body: string; postedBy: string }): Message {
  const link = `https://${ADMIN_HOST}/announcements`;
  const subject = `ISA-RAIT announcement: ${announcement.title}`;
  const text = [
    announcement.title,
    "",
    announcement.body,
    "",
    `Posted by ${announcement.postedBy}. Read it in the admin workspace: ${link}`,
  ].join("\n");
  const html = adminEmail({
    preheader: `Posted by ${announcement.postedBy}.`,
    eyebrow: "New announcement",
    title: announcement.title,
    // Line breaks and links as the announcements page shows them.
    content: [richText(announcement.body), button(link, "Open announcements")].join("\n"),
    footerNote: `Posted by ${announcement.postedBy}. You get this because you're a member of the ISA-RAIT admin workspace.`,
  });
  return { subject, text, html };
}
