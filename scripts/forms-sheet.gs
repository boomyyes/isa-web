/**
 * Submissions sheet sync. Paste into Extensions → Apps Script in the sheet owned
 * by isarait.forms@gmail.com. Setup steps are in SETUP.md ("Form submissions sheet").
 *
 * Script properties (Project Settings → Script properties):
 *   SYNC_URL     https://www.isarait.in/api/forms/export
 *   SYNC_SECRET  the exact value of FORMS_SYNC_SECRET on Vercel
 *
 * Triggers:
 *   pullSubmissions  time-driven, every 5 minutes
 *   purgeExpired     time-driven, daily
 */

function config_() {
  const props = PropertiesService.getScriptProperties();
  const url = props.getProperty("SYNC_URL");
  const secret = props.getProperty("SYNC_SECRET");
  if (!url || !secret) throw new Error("Set SYNC_URL and SYNC_SECRET in Script properties.");
  return { url: url.replace(/\/+$/, ""), secret: secret };
}

function call_(url, secret, options) {
  const response = UrlFetchApp.fetch(url, {
    method: options.method || "get",
    contentType: "application/json",
    payload: options.payload ? JSON.stringify(options.payload) : undefined,
    headers: { Authorization: "Bearer " + secret },
    muteHttpExceptions: true,
  });
  const code = response.getResponseCode();
  if (code !== 200) throw new Error(url + " returned " + code + ": " + response.getContentText());
  return JSON.parse(response.getContentText());
}

/** Tab with its header row, created on first use. */
function tab_(spreadsheet, name, header) {
  let sheet = spreadsheet.getSheetByName(name);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(name);
    sheet.appendRow(header);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, header.length).setFontWeight("bold");
  }
  return sheet;
}

function knownRefs_(sheet) {
  const last = sheet.getLastRow();
  if (last < 2) return {};
  const refs = {};
  sheet.getRange(2, 1, last - 1, 1).getValues().forEach(function (r) { refs[r[0]] = true; });
  return refs;
}

function pullSubmissions() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) return;
  try {
    const cfg = config_();
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

    // Drain in batches; the server hands out at most 100 at a time.
    for (let round = 0; round < 10; round++) {
      const data = call_(cfg.url, cfg.secret, {});
      const done = data.expired.slice();
      const known = {};

      data.items.forEach(function (item) {
        const sheet = tab_(spreadsheet, item.tab, data.tabs[item.tab]);
        known[item.tab] = known[item.tab] || knownRefs_(sheet);
        if (!known[item.tab][item.id]) {
          // Plain text format first, so nothing in a cell is ever parsed as a formula or date.
          const row = sheet.getLastRow() + 1;
          sheet.getRange(row, 1, 1, item.row.length).setNumberFormat("@").setValues([item.row]);
          known[item.tab][item.id] = true;
        }
        done.push(item.id);
      });

      if (done.length === 0) break;
      call_(cfg.url + "/ack", cfg.secret, { method: "post", payload: { ids: done } });
      if (data.items.length + data.expired.length < 100) break;
    }
  } finally {
    lock.releaseLock();
  }
}

/** Deletes rows whose "Delete after" date has passed, matching the privacy policy. */
function purgeExpired() {
  const now = new Date();
  SpreadsheetApp.getActiveSpreadsheet().getSheets().forEach(function (sheet) {
    const last = sheet.getLastRow();
    if (last < 2) return;
    const header = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const col = header.indexOf("Delete after");
    if (col === -1) return;

    const values = sheet.getRange(2, col + 1, last - 1, 1).getValues();
    // Bottom-up, so deleting a row doesn't shift the ones still to check.
    for (let i = values.length - 1; i >= 0; i--) {
      const when = new Date(values[i][0]);
      if (!isNaN(when.getTime()) && when < now) sheet.deleteRow(i + 2);
    }
  });
}
