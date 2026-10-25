/**
 * Guest list backend for the wedding site, as a Google Apps Script web app
 * bound to a Google Sheet.
 *
 * Sheet "Guests" (row 1 is headers):
 *   Phone | Name | Email | Group | Feeling | Updated
 *   Phone is digits only with country code, e.g. 15551234567.
 *   Group is optional, e.g. "party" for the wedding party and families.
 *
 * Sheet "Private events" (row 1 is headers):
 *   Group | Date | Time | Title | Place
 *   Date must match the site's schedule, e.g. "30 September".
 *
 * Deploy: Extensions > Apps Script, paste this file, then
 * Deploy > New deployment > Web app, execute as "Me", access "Anyone".
 * Put the web app URL in WEDDING.apiEndpoint in assets/js/site.js.
 */

var COLS = { phone: 0, name: 1, email: 2, group: 3, feeling: 4, updated: 5 };
var FEELINGS = { yes: true, maybe: true, no: true };

function doPost(e) {
  var req = JSON.parse(e.postData.contents || "{}");
  var phone = String(req.phone || "").replace(/\D/g, "");
  if (!phone) return json({ error: "phone required" });

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    if (req.action === "lookup") return json(lookup(phone));
    if (req.action === "register") return json(register(phone, req));
    if (req.action === "reply") return json(reply(phone, req.feeling));
    return json({ error: "unknown action" });
  } finally {
    lock.releaseLock();
  }
}

function guests() {
  return SpreadsheetApp.getActive().getSheetByName("Guests");
}

function findRow(phone) {
  var rows = guests().getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][COLS.phone]).replace(/\D/g, "") === phone) return { index: i + 1, row: rows[i] };
  }
  return null;
}

function lookup(phone) {
  var hit = findRow(phone);
  if (!hit) return null;
  var r = hit.row;
  return {
    phone: phone,
    name: r[COLS.name],
    email: r[COLS.email],
    feeling: r[COLS.feeling] || "",
    privateEvents: privateEvents(r[COLS.group])
  };
}

function privateEvents(group) {
  if (!group) return [];
  var sheet = SpreadsheetApp.getActive().getSheetByName("Private events");
  if (!sheet) return [];
  return sheet.getDataRange().getValues().slice(1)
    .filter(function (r) { return r[0] === group; })
    .map(function (r) { return { date: r[1], time: r[2], title: r[3], place: r[4] }; });
}

function register(phone, req) {
  var hit = findRow(phone);
  if (hit) return lookup(phone);
  guests().appendRow([phone, String(req.name || "").slice(0, 200), String(req.email || "").slice(0, 200), "", "", new Date()]);
  return lookup(phone);
}

function reply(phone, feeling) {
  if (!FEELINGS[feeling]) return { error: "unknown feeling" };
  var hit = findRow(phone);
  if (!hit) return { error: "not found" };
  guests().getRange(hit.index, COLS.feeling + 1, 1, 2).setValues([[feeling, new Date()]]);
  return { ok: true };
}

function json(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
