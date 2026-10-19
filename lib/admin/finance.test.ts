// Money and date rules the treasury totals rest on. Run: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { csvCell, fyOf, parseRupees } from "./finance";

test("parseRupees: rupee strings to integer paise", () => {
  assert.equal(parseRupees("1,234.5"), 123450);
  assert.equal(parseRupees("₹ 1250"), 125000);
  assert.equal(parseRupees("0.05"), 5);
  for (const bad of ["", "1.234", "-5", "1e3", "abc", "1234567890"]) assert.equal(parseRupees(bad), null, bad);
});

test("fyOf: April to March", () => {
  assert.equal(fyOf("2026-04-01"), 2026);
  assert.equal(fyOf("2027-03-31"), 2026);
});

test("csvCell: a leading = can't become a formula", () => {
  assert.equal(csvCell("=SUM(A1)"), `"'=SUM(A1)"`);
  assert.equal(csvCell('say "hi"'), `"say ""hi"""`);
});
