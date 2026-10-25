/**
 * Guest list backend for the wedding site, as a Google Apps Script web app
 * bound to a Google Sheet.
 *
 * Sheet "Guests" (row 1 is headers):
 *   Phone | Name | Email | Group | Feeling | Updated
 *   Phone is digits only with country code, e.g. 19259636950.
 *   Guests can sign in with either their phone or their email.
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
  var id = {
    phone: String(req.phone || "").replace(/\D/g, ""),
    email: String(req.email || "").trim().toLowerCase()
  };
  if (!id.phone && !id.email) return json({ error: "phone or email required" });

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    if (req.action === "lookup") return json(lookup(id));
    if (req.action === "register") return json(register(id, req));
    if (req.action === "reply") return json(reply(id, req.feeling));
    return json({ error: "unknown action" });
  } finally {
    lock.releaseLock();
  }
}

function guests() {
  return SpreadsheetApp.getActive().getSheetByName("Guests");
}

function findRow(id) {
  var rows = guests().getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    var phone = String(rows[i][COLS.phone]).replace(/\D/g, "");
    var email = String(rows[i][COLS.email]).trim().toLowerCase();
    if ((id.phone && phone === id.phone) || (id.email && email === id.email)) return { index: i + 1, row: rows[i] };
  }
  return null;
}

function lookup(id) {
  var hit = findRow(id);
  if (!hit) return null;
  var r = hit.row;
  return {
    phone: String(r[COLS.phone]).replace(/\D/g, ""),
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

function register(id, req) {
  if (findRow(id)) return lookup(id);
  guests().appendRow([id.phone, String(req.name || "").slice(0, 200), id.email || String(req.email || "").slice(0, 200), "", "", new Date()]);
  return lookup(id);
}

function reply(id, feeling) {
  if (!FEELINGS[feeling]) return { error: "unknown feeling" };
  var hit = findRow(id);
  if (!hit) return { error: "not found" };
  guests().getRange(hit.index, COLS.feeling + 1, 1, 2).setValues([[feeling, new Date()]]);
  return { ok: true };
}

function json(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
