// Every email the site and its scripts send goes out here, through Resend, as
// MAIL_FROM_ADDRESS (no-reply@isarait.in; the domain is verified in Resend, so
// the mail is DKIM-signed for the chapter's own domain). No other sender exists.
// Plain fetch, so it works in route handlers and the CLI scripts alike.

export const MAIL_FROM_ADDRESS = "no-reply@isarait.in";

export const resendConfigured = () => Boolean(process.env.RESEND_API_KEY);

export type OutgoingMail = { to: string; subject: string; text: string; html: string };

// Resend allows a few requests a second; bulk scripts send one after another,
// so spacing them out here keeps a long run from being rate limited.
const MIN_GAP_MS = 600;
let nextSlot = 0;

export async function sendMail(mail: OutgoingMail, fromName = "ISA RAIT Student Chapter") {
  if (!resendConfigured()) throw new Error("RESEND_API_KEY is not set");

  const now = Date.now();
  const wait = Math.max(0, nextSlot - now);
  nextSlot = Math.max(now, nextSlot) + MIN_GAP_MS;
  if (wait) await new Promise((resolve) => setTimeout(resolve, wait));

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: `${fromName} <${MAIL_FROM_ADDRESS}>`, ...mail }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`Resend ${response.status}: ${(await response.text()).slice(0, 200)}`);
}
