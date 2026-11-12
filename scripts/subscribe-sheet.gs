/* Google Apps Script that receives blog subscribers and adds them to a Google Sheet.
   This file is not run by the site. You paste it into Google once (steps below).

   One-time setup
   1. Create a new Google Sheet (name it e.g. "Blog subscribers"). In row 1 type: Date | Email
   2. In the Sheet: Extensions > Apps Script. Delete the sample code and paste this whole file.
   3. Change SECRET below to a long random string (it is only a password between this script and the site).
   4. Deploy > New deployment > type "Web app". Execute as: Me. Who has access: Anyone. Deploy, and allow access when asked.
   5. Copy the Web app URL (ends in /exec).
   6. In Vercel > Project > Settings > Environment Variables add SHEETS_URL (that URL) and SHEETS_SECRET (the same SECRET), then redeploy.
   Do not put the URL or secret in this file's copy in git: keep SECRET below as a placeholder here and set the real one in Google only. */

var SECRET = 'CHANGE-ME';

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
      var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
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
