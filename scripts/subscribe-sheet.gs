/* Google Apps Script that receives blog subscribers and adds them to a Google Sheet.
   This file is not run by the site. It is a copy of the script deployed in Google (kept here for reference).
   The real SECRET and SHEET_ID live only in Google and in Vercel, never in git: the values below are placeholders.

   Setup (already done once)
   1. Create a Google Sheet "Blog subscribers" with row 1: Date | Email.
   2. At script.google.com create a new project and paste this file. Set SECRET to a long random string and
      SHEET_ID to the id in the sheet's URL (docs.google.com/spreadsheets/d/<SHEET_ID>/edit).
   3. Deploy > New deployment > Web app. Execute as: Me. Who has access: Anyone. Authorize when asked.
   4. In Vercel > Project > Settings > Environment Variables add SHEETS_URL (the Web app URL ending in /exec) and
      SHEETS_SECRET (the same SECRET), then redeploy.
   If you edit the script later, use Deploy > Manage deployments > edit > New version so the URL stays the same. */

var SECRET = '';     /* set in Google only */
var SHEET_ID = '';   /* set in Google only */

function doPost(e) {
  var out = function (o) {
    return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
  };
  try {
    var d = JSON.parse(e.postData.contents);
    if (d.secret !== SECRET) return out({ ok: false, error: 'forbidden' });
    var email = String(d.email || '').trim().toLowerCase();
    if (!/^[^\s@,;<>()"\\]+@[^\s@,;<>()"\\]+\.[^\s@,;<>()"\\]+$/.test(email)) return out({ ok: false, error: 'bad email' });

    var lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      var sheet = SpreadsheetApp.openById(SHEET_ID).getSheets()[0];
      var last = sheet.getLastRow();
      var existing = last > 1 ? sheet.getRange(2, 2, last - 1, 1).getValues() : [];
      for (var i = 0; i < existing.length; i++) {
        if (String(existing[i][0]).toLowerCase() === email) return out({ ok: true });   /* already subscribed */
      }
      sheet.appendRow([new Date(), email]);
    } finally {
      lock.releaseLock();
    }
    return out({ ok: true });
  } catch (err) {
    return out({ ok: false, error: String(err) });
  }
}
