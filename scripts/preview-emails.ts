/**
 * Every email the site sends, rendered with made-up sample data.
 *
 *   npx tsx --conditions=react-server scripts/preview-emails.ts                    # write .email-preview/
 *   npx tsx --conditions=react-server scripts/preview-emails.ts --send you@x.com    # also mail all of them to you
 *
 * Open .email-preview/index.html to see them. --send mails each sample to that one
 * address from the official account, so you can check how Gmail, Outlook and phone
 * apps render them. Sample data only: nothing is read from the roster or database.
 * (--conditions=react-server: the admin templates import server-only code.)
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  accessCodeMessage,
  customMessage,
  formReceiptMessage,
  formRecordMessage,
  mailer,
  mailerConfigured,
  resetMessage,
  siteUrl,
  type Message,
} from "../lib/mailer";
import { announcementMessage, loginCodeMessage } from "../lib/admin/mail";

function loadEnv(file: string) {
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/i.exec(line);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key]) continue;
    process.env[key] = rawValue.trim().replace(/^(['"])(.*)\1$/, "$2");
  }
}

function samples(): [string, Message][] {
  const form = {
    ref: "Q-7K3M9X",
    label: "query",
    fields: [
      ["Name", "Asha Patil"],
      ["Email", "asha@example.com"],
      ["Subject", "Workshop timings"],
      ["Message", "When is the next PLC workshop?\nAre seats limited?"],
    ] as [string, string][],
  };
  return [
    ["admin-sign-in-code", loginCodeMessage("482917")],
    [
      "admin-announcement",
      announcementMessage({
        title: "Core meeting moved to Friday",
        body: "The core meeting is now on Friday at 4 pm in Room 402.\n\nAgenda and slides: https://www.isarait.in",
        postedBy: "Avanish",
      }),
    ],
    ["certificate-access-code", accessCodeMessage({ name: "Asha Patil", uid: "22CE1001", password: "K7QM-4XPA" })],
    [
      "certificate-reset",
      resetMessage({ name: "Asha Patil", uid: "22CE1001", link: `${siteUrl()}/certificates/reset?t=sample`, expiresMinutes: 30 }),
    ],
    [
      "custom-email",
      customMessage({
        subject: "Certificates for the PLC workshop are ready",
        body: "Hi Asha,\n\nYour certificate for the PLC workshop is ready to download.\n\nCollect it at https://www.isarait.in/certificates",
      }),
    ],
    ["form-to-committee", formRecordMessage(form, true)],
    ["form-receipt", formReceiptMessage(form, "The committee will reply to this address.")],
  ];
}

async function main() {
  loadEnv(resolve(process.cwd(), ".env.local"));
  const args = process.argv.slice(2);
  const sendIndex = args.indexOf("--send");
  const to = sendIndex === -1 ? undefined : args[sendIndex + 1];
  if (sendIndex !== -1 && !to?.includes("@")) {
    console.error("Usage: npx tsx --conditions=react-server scripts/preview-emails.ts [--send <your email>]");
    process.exit(1);
  }

  const all = samples();
  const dir = resolve(process.cwd(), ".email-preview");
  mkdirSync(dir, { recursive: true });
  // The files on disk load the header from this checkout, so it shows before it's
  // deployed. Mail sent with --send keeps the live URL.
  const live = `${siteUrl()}/email/isa-header.gif`;
  const local = pathToFileURL(resolve(process.cwd(), "public/email/isa-header.gif")).href;
  for (const [name, message] of all) writeFileSync(resolve(dir, `${name}.html`), message.html.replaceAll(live, local));
  writeFileSync(
    resolve(dir, "index.html"),
    `<!doctype html><meta charset="utf-8"><title>Email previews</title><body style="font-family:sans-serif;padding:24px">
<h1>Email previews</h1><ul>${all.map(([name, m]) => `<li><a href="${name}.html">${name}</a>: ${m.subject.replace(/</g, "&lt;")}</li>`).join("")}</ul></body>`
  );
  console.log(`Wrote ${all.length} previews to ${dir}\\index.html`);

  if (!to) return;
  if (!mailerConfigured()) {
    console.error("Mail isn't configured (SMTP_* in .env.local), or student mail is held.");
    process.exit(1);
  }
  const transport = mailer();
  for (const [name, message] of all) {
    await transport.sendMail({ to, ...message, subject: `[Preview] ${message.subject}` });
    console.log(`Sent ${name}`);
  }
  await transport.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
