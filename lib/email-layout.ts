// The one HTML layout every email uses, black-themed: the animated ASCII header
// (public/email/isa-header.gif, made by scripts/make-email-gif.ts), a card, a
// footer. Tables, inline styles and bgcolor attributes throughout, because
// that is what Outlook on Windows and Gmail actually render. No server-only, so
// scripts/preview-emails.ts and the tests can import it.
//
// Every value that came from a person goes through escapeHtml here; `content`
// is trusted HTML built from the helpers below.

export const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// The site's dark-theme tokens (app/globals.css). Contrast on the card (#141414):
// text 18.4:1, muted 8.8:1, cyan 12.0:1, orange 5.9:1; the button's dark text
// on cyan 12.6:1.
const INK = "#FFFFFF";
const MUTED = "#B3B3B3";
const PAGE = "#0D0D0D";
const CARD = "#141414";
const EDGE = "#333333";
const CYAN = "#00E5FF";
const ORANGE = "#FF5A00";

const FONT = "Inter,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const MONO = "'JetBrains Mono',SFMono-Regular,Menlo,Consolas,monospace";

const ADDRESS = "ISA Student Chapter, Ramrao Adik Institute of Technology, Sector 7, Nerul, Navi Mumbai 400706";

/** A paragraph of plain text. */
export function paragraph(text: string, { muted = false }: { muted?: boolean } = {}) {
  const style = muted ? `color:${MUTED};font-size:14px` : `color:${INK};font-size:16px`;
  return `<p style="margin:0 0 16px;line-height:1.6;${style}">${escapeHtml(text)}</p>`;
}

/** The one action. A table so the whole button is clickable in Outlook too. */
export function button(href: string, label: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px"><tr>
<td bgcolor="${CYAN}" style="border-radius:6px"><a href="${escapeHtml(href)}" style="display:inline-block;padding:14px 24px;font-family:${FONT};font-size:16px;font-weight:700;color:${PAGE};text-decoration:none;border-radius:6px">${escapeHtml(label)}</a></td>
</tr></table>`;
}

/** A code to read or copy: sign-in codes, references. */
export function codeBox(code: string) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px"><tr>
<td align="center" style="border:2px solid ${CYAN};border-radius:8px;padding:18px 12px;font-family:${MONO};font-size:32px;font-weight:700;letter-spacing:6px;color:${INK}">${escapeHtml(code)}</td>
</tr></table>`;
}

/** Label / value rows. `mono` sets the values in the code face (UIDs, access codes). */
export function detailRows(rows: [string, string][], { mono = false }: { mono?: boolean } = {}) {
  const value = mono ? `font-family:${MONO};font-weight:700;letter-spacing:1px` : "";
  const body = rows
    .map(
      ([label, val]) =>
        `<tr><td valign="top" style="padding:10px 16px;color:${MUTED};font-size:14px;white-space:nowrap">${escapeHtml(label)}</td><td style="padding:10px 16px;color:${INK};font-size:15px;white-space:pre-wrap;${value}">${escapeHtml(val)}</td></tr>`
    )
    .join("\n");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${PAGE}" style="margin:8px 0 24px;border-radius:8px">
${body}
</table>`;
}

/** Plain text with blank-line paragraphs; bare URLs become links. */
export function richText(text: string) {
  return text
    .trim()
    .split(/\r?\n\s*\r?\n/)
    .map(
      (para) =>
        `<p style="margin:0 0 16px;line-height:1.6;color:${INK};font-size:16px">${escapeHtml(para)
          .replace(/https?:\/\/[^\s<]+/g, (href) => `<a href="${href}" style="color:${CYAN}">${href}</a>`)
          .replace(/\r?\n/g, "<br>")}</p>`
    )
    .join("\n");
}

export type EmailLayout = {
  /** The line inbox lists show after the subject. */
  preheader: string;
  /** Beside the logo: who the email is from. */
  brand: "Student Chapter" | "Admin workspace";
  eyebrow?: string;
  title?: string;
  /** Trusted HTML, from the helpers above. */
  content: string;
  /** Why this person got this email. */
  footerNote: string;
  /** The public site, for the logo and the footer link. */
  siteUrl: string;
};

export function emailLayout({ preheader, brand, eyebrow, title, content, footerNote, siteUrl }: EmailLayout) {
  const site = siteUrl.replace(/\/+$/, "");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark">
<meta name="supported-color-schemes" content="dark">
<title>${escapeHtml(title ?? brand)}</title>
</head>
<body style="margin:0;padding:0;background:${PAGE};font-family:${FONT}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${PAGE}">${escapeHtml(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${PAGE}">
<tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px">
<tr><td bgcolor="${PAGE}" style="border:1px solid ${EDGE};border-bottom:0;border-radius:8px 8px 0 0;overflow:hidden">
<img src="${escapeHtml(site)}/email/isa-header.gif" width="600" height="180" alt="ISA-RAIT ${escapeHtml(brand)}" style="display:block;width:100%;max-width:600px;height:auto;border:0;border-radius:8px 8px 0 0">
</td></tr>
<tr><td bgcolor="${PAGE}" style="padding:10px 28px;border-left:1px solid ${EDGE};border-right:1px solid ${EDGE};border-bottom:3px solid ${CYAN};font-family:${MONO};color:${CYAN};font-size:12px;letter-spacing:2px;text-transform:uppercase">&gt; ${escapeHtml(brand)}</td></tr>
<tr><td bgcolor="${CARD}" style="padding:32px 28px 8px;border:1px solid ${EDGE};border-top:0;border-radius:0 0 8px 8px;font-family:${FONT}">
${eyebrow ? `<p style="margin:0 0 8px;color:${ORANGE};font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase">${escapeHtml(eyebrow)}</p>` : ""}
${title ? `<h1 style="margin:0 0 20px;color:${INK};font-size:24px;line-height:1.3;font-weight:700">${escapeHtml(title)}</h1>` : ""}
${content}
</td></tr>
<tr><td style="padding:20px 28px;font-family:${FONT};color:${MUTED};font-size:13px;line-height:1.6">
<p style="margin:0 0 8px">${escapeHtml(footerNote)}</p>
<p style="margin:0">${escapeHtml(ADDRESS)} &middot; <a href="${escapeHtml(site)}" style="color:${CYAN}">${escapeHtml(site.replace(/^https?:\/\//, ""))}</a></p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}
