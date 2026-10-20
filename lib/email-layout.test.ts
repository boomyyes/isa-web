import assert from "node:assert/strict";
import { test } from "node:test";
import { button, codeBox, detailRows, emailLayout, paragraph, richText } from "./email-layout";

const EVIL = `<script>alert("x")</script>`;

test("everything a person typed is escaped", () => {
  const html = emailLayout({
    preheader: EVIL,
    brand: "Student Chapter",
    eyebrow: EVIL,
    title: EVIL,
    content: [paragraph(EVIL), codeBox(EVIL), detailRows([[EVIL, EVIL]]), richText(EVIL), button("https://x.test", EVIL)].join(""),
    footerNote: EVIL,
    siteUrl: "https://www.isarait.in",
  });
  assert.ok(!html.includes("<script>"), "no raw <script> anywhere");
  assert.ok(html.includes("&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;"));
});

test("a button link can't break out of its href", () => {
  const html = button(`https://x.test/" onclick="alert(1)`, "Go");
  assert.ok(!html.includes(`" onclick="`));
  assert.ok(html.includes("&quot; onclick=&quot;"));
});

test("the document asks for the dark scheme, carries the preheader and the header GIF", () => {
  const html = emailLayout({
    preheader: "Your sign-in code is 123456.",
    brand: "Admin workspace",
    content: "",
    footerNote: "Why you got this.",
    siteUrl: "https://www.isarait.in/",
  });
  assert.ok(html.includes(`<meta name="color-scheme" content="dark">`));
  assert.ok(html.includes("Your sign-in code is 123456."));
  // Trailing slash on SITE_URL doesn't double up in the image path; alt text names the sender.
  assert.ok(html.includes(`src="https://www.isarait.in/email/isa-header.gif"`));
  assert.ok(html.includes(`alt="ISA-RAIT Admin workspace"`));
});
