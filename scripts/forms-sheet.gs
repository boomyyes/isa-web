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
  // Only for protected Vercel preview deployments; leave unset for the live site.
  const bypass = props.getProperty("VERCEL_BYPASS");
  return { url: url.replace(/\/+$/, ""), secret: secret, bypass: bypass };
}

function call_(url, cfg, options) {
  const headers = { Authorization: "Bearer " + cfg.secret };
  if (cfg.bypass) headers["x-vercel-protection-bypass"] = cfg.bypass;
  const response = UrlFetchApp.fetch(url, {
    method: options.method || "get",
    contentType: "application/json",
    payload: options.payload ? JSON.stringify(options.payload) : undefined,
    headers: headers,
    muteHttpExceptions: true,
  });
  const code = response.getResponseCode();
  if (code !== 200) throw new Error(url + " returned " + code + ": " + response.getContentText());
  return JSON.parse(response.getContentText());
}

/**
 * Tab with its header row, created on first use. If the site adds a column,
 * the header is rewritten; rows written before the change keep the old layout.
 */
function tab_(spreadsheet, name, header) {
  let sheet = spreadsheet.getSheetByName(name);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(name);
    sheet.setFrozenRows(1);
  }
  const current = sheet.getLastColumn() > 0
    ? sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].join("|")
    : "";
  if (current !== header.join("|")) {
    sheet.getRange(1, 1, 1, header.length).setValues([header]).setFontWeight("bold");
  }
  return sheet;
}

/** Ref -> row number, for every tab. */
function rowsByRef_(sheet) {
  const last = sheet.getLastRow();
  const rows = {};
  if (last < 2) return rows;
  sheet.getRange(2, 1, last - 1, 1).getValues().forEach(function (r, i) { rows[r[0]] = i + 2; });
  return rows;
}

/** Deletes the rows for erased refs, wherever they are. */
function eraseRows_(spreadsheet, refs) {
  if (refs.length === 0) return;
  const wanted = {};
  refs.forEach(function (ref) { wanted[ref] = true; });
  spreadsheet.getSheets().forEach(function (sheet) {
    const rows = rowsByRef_(sheet);
    // Bottom-up, so deleting a row doesn't shift the ones still to delete.
    Object.keys(rows)
      .filter(function (ref) { return wanted[ref]; })
      .map(function (ref) { return rows[ref]; })
      .sort(function (a, b) { return b - a; })
      .forEach(function (row) { sheet.deleteRow(row); });
  });
}

function pullSubmissions() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) return;
  try {
    const cfg = config_();
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

    // Drain in batches; the server hands out at most 100 of each at a time.
    for (let round = 0; round < 10; round++) {
      const data = call_(cfg.url, cfg, {});
      const done = data.expired.slice();
      const rows = {};

      data.items.forEach(function (item) {
        const sheet = tab_(spreadsheet, item.tab, data.tabs[item.tab]);
        rows[item.tab] = rows[item.tab] || rowsByRef_(sheet);
        // Edited in the admin area: update in place. New: append.
        const row = rows[item.tab][item.id] || sheet.getLastRow() + 1;
        // Plain text format first, so nothing in a cell is ever parsed as a formula or date.
        sheet.getRange(row, 1, 1, item.row.length).setNumberFormat("@").setValues([item.row]);
        rows[item.tab][item.id] = row;
        done.push(item.id);
      });

      eraseRows_(spreadsheet, data.erase);

      if (done.length === 0 && data.erase.length === 0) break;
      call_(cfg.url + "/ack", cfg, { method: "post", payload: { ids: done, erased: data.erase } });
      if (data.items.length + data.expired.length < 100 && data.erase.length < 100) break;
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
