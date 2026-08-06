/**
 * ISA-RAIT certificate sync — paste this into the attendance spreadsheet.
 *
 * SETUP (once, ~5 minutes)
 * -----------------------------------------------------------------------------
 * 1. Open the attendance sheet -> Extensions -> Apps Script.
 * 2. Delete whatever is in Code.gs and paste this whole file in. Save.
 * 3. Project Settings (gear icon) -> Script Properties -> Add script property:
 *
 *      SITE_URL      https://your-site.example         (no trailing slash)
 *      SYNC_SECRET   <the same value as ROSTER_SYNC_SECRET on the website>
 *
 *    Script Properties are not visible to people who only have access to the
 *    spreadsheet, which is why the secret goes here and not in a cell.
 *
 * 4. Back in the editor, choose `syncNow` from the function dropdown and press
 *    Run. Google will ask you to authorise the script — approve it. Check the
 *    execution log; you should see a summary rather than an error.
 * 5. Triggers (clock icon) -> Add Trigger:
 *      Function:            scheduledSync
 *      Event source:        Time-driven
 *      Type:                Minutes timer
 *      Interval:            Every 15 minutes
 *
 * After that the sheet is the only thing anyone needs to touch. Edits reach the
 * website within 15 minutes, and newly added students are emailed their UID and
 * access code automatically.
 *
 * The "ISA Certificates" menu appears on the sheet's toolbar for manual runs.
 */

var SHEET_NAME = ''; // '' = the first sheet. Set a name if the roster moves tabs.

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('ISA Certificates')
    .addItem('Sync now', 'syncNow')
    .addItem('Preview sync (changes nothing)', 'previewSync')
    .addSeparator()
    .addItem('Sync now (allow large deletions)', 'syncNowForce')
    .addToUi();
}

/** Time-driven trigger target. Silent unless something needs attention. */
function scheduledSync() {
  var result = postSync({ dryRun: false, force: false });

  // A refusal means the brake tripped — that needs a human, so make noise in the
  // execution log where the trigger's failure notifications will pick it up.
  if (result && result.refused) {
    throw new Error(
      'Roster sync refused: ' + result.refused +
      '. Check the sheet is complete, then use "Sync now (allow large deletions)".'
    );
  }

  // More students waiting than one run could email — come back sooner.
  if (result && result.emails && result.emails.remaining > 0) {
    postSync({ dryRun: false, force: false });
  }
}

function syncNow() {
  report(postSync({ dryRun: false, force: false }));
}

function syncNowForce() {
  var ui = SpreadsheetApp.getUi();
  var answer = ui.alert(
    'Allow large deletions?',
    'This removes every student who is no longer in the sheet, even if that is ' +
    'most of the roster. Only continue if you know the sheet is complete.',
    ui.ButtonSet.YES_NO
  );
  if (answer !== ui.Button.YES) return;
  report(postSync({ dryRun: false, force: true }));
}

function previewSync() {
  report(postSync({ dryRun: true, force: false }));
}

// -----------------------------------------------------------------------------

function postSync(options) {
  var props = PropertiesService.getScriptProperties();
  var siteUrl = (props.getProperty('SITE_URL') || '').replace(/\/+$/, '');
  var secret = props.getProperty('SYNC_SECRET');

  if (!siteUrl || !secret) {
    throw new Error('Set SITE_URL and SYNC_SECRET in Project Settings -> Script Properties.');
  }

  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = SHEET_NAME ? spreadsheet.getSheetByName(SHEET_NAME) : spreadsheet.getSheets()[0];
  if (!sheet) throw new Error('Could not find the roster sheet named "' + SHEET_NAME + '".');

  // getDisplayValues gives what a human sees — checkboxes come through as
  // "TRUE"/"FALSE" and numbers keep their formatting, which is exactly what the
  // CSV export would have produced.
  var rows = sheet.getDataRange().getDisplayValues();

  var response = UrlFetchApp.fetch(siteUrl + '/api/certificates/sync', {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + secret },
    payload: JSON.stringify({
      rows: rows,
      dryRun: !!options.dryRun,
      force: !!options.force
    }),
    muteHttpExceptions: true
  });

  var code = response.getResponseCode();
  var text = response.getContentText();
  var body;
  try {
    body = JSON.parse(text);
  } catch (e) {
    throw new Error('Sync endpoint returned non-JSON (HTTP ' + code + '): ' + text.slice(0, 300));
  }

  if (code === 401) throw new Error('Sync rejected: SYNC_SECRET does not match the website.');
  if (code === 409) return body;                       // brake tripped — caller decides
  if (code >= 400) throw new Error('Sync failed (HTTP ' + code + '): ' + (body.error || text));

  Logger.log(JSON.stringify(body));
  return body;
}

function report(body) {
  var ui = SpreadsheetApp.getUi();
  if (!body) return;

  if (body.refused) {
    ui.alert(
      'Sync refused',
      body.refused + '\n\n' +
      'That usually means rows were deleted by accident. If it is intended, use ' +
      '"Sync now (allow large deletions)".',
      ui.ButtonSet.OK
    );
    return;
  }

  var lines = [
    (body.dryRun ? 'PREVIEW — nothing was changed.\n' : ''),
    'Workshops matched: ' + body.workshopsMatched,
    'Students in sheet: ' + body.rowsParsed,
    'Written: ' + body.written,
    'Removed: ' + body.deleted,
    'Newly registered: ' + body.registered
  ];

  if (body.emails) {
    lines.push(
      'Emails sent: ' + body.emails.sent +
      (body.emails.failed ? ', failed ' + body.emails.failed : '') +
      (body.emails.remaining ? ', still queued ' + body.emails.remaining : '')
    );
  }
  if (body.deliveryError) lines.push('\nEmail problem: ' + body.deliveryError);
  if (body.warning) lines.push('\n' + body.warning);
  if (body.warnings && body.warnings.length) {
    lines.push('\nWarnings:\n- ' + body.warnings.slice(0, 12).join('\n- '));
    if (body.warnings.length > 12) lines.push('(+' + (body.warnings.length - 12) + ' more)');
  }

  ui.alert('Roster sync', lines.join('\n'), ui.ButtonSet.OK);
}
