/**
 * Guest list backend for the wedding site, as a Google Apps Script web app
 * bound to a Google Sheet.
 *
 * Sheet "Guests" (row 1 is headers):
 *   Phone | Name | Email | Group | Feeling | Updated | Street | Apt | City | State | ZIP | Country
 *   Phone is digits only with country code, e.g. 19259636950.
 *   Guests can sign in with either their phone or their email.
 *   Group is optional, e.g. "party" for the wedding party and families.
 *
 * Sheet "Notes" (row 1 is headers), one row per note left on the site:
 *   Sent | Name | Phone | Email | Kind | Note
 *
 * Sheet "Private events" (row 1 is headers):
 *   Group | Date | Time | Title | Place
 *   Date must match the site's schedule, e.g. "September 30".
 *
 * The tabs are created automatically (run setup() once to make them now).
 * Deploy: Extensions > Apps Script, paste this file, then
 * Deploy > New deployment > Web app, execute as "Me", access "Anyone".
 * Put the web app URL in WEDDING.apiEndpoint in assets/js/site.js.
 */

var COLS = { phone: 0, name: 1, email: 2, group: 3, feeling: 4, updated: 5, address: 6 };
var ADDRESS = ["line1", "line2", "city", "state", "zip", "country"];
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
    if (req.action === "address") return json(saveAddress(id, req.address));
    if (req.action === "note") return json(saveNote(id, req));
    return json({ error: "unknown action" });
  } finally {
    lock.releaseLock();
  }
}

// Each tab is created with its header row the first time it's needed, so a
// brand new, empty Google Sheet is all the setup this script needs.
var HEADERS = {
  "Guests": ["Phone", "Name", "Email", "Group", "Feeling", "Updated", "Street", "Apt", "City", "State", "ZIP", "Country"],
  "Notes": ["Sent", "Name", "Phone", "Email", "Kind", "Note"],
  "Private events": ["Group", "Date", "Time", "Title", "Place"]
};
function tab(name) {
  var book = SpreadsheetApp.getActive();
  var sheet = book.getSheetByName(name);
  if (!sheet) {
    sheet = book.insertSheet(name);
    sheet.appendRow(HEADERS[name]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, HEADERS[name].length).setFontWeight("bold");
    sheet.getRange("A:A").setNumberFormat("@");   // keep phone numbers as text
  }
  return sheet;
}
// Run once from the Apps Script editor to create all three tabs up front.
function setup() {
  Object.keys(HEADERS).forEach(tab);
}

function guests() {
  return tab("Guests");
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
    address: readAddress(r),
    privateEvents: privateEvents(r[COLS.group])
  };
}

function privateEvents(group) {
  if (!group) return [];
  var sheet = tab("Private events");
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

function readAddress(r) {
  var a = {}, any = false;
  ADDRESS.forEach(function (k, i) { a[k] = String(r[COLS.address + i] || ""); if (a[k]) any = true; });
  return any ? a : null;
}

function saveAddress(id, address) {
  if (!address || !address.line1) return { error: "address required" };
  var hit = findRow(id);
  if (!hit) return { error: "not found" };
  var values = ADDRESS.map(function (k) { return String(address[k] || "").slice(0, 200); });
  guests().getRange(hit.index, COLS.address + 1, 1, ADDRESS.length).setValues([values]);
  guests().getRange(hit.index, COLS.updated + 1).setValue(new Date());
  return { ok: true };
}

function saveNote(id, req) {
  var note = String(req.note || "").trim().slice(0, 1500);
  if (!note) return { error: "note required" };
  var hit = findRow(id);
  if (!hit) return { error: "not found" };
  tab("Notes").appendRow([
    new Date(), String(hit.row[COLS.name] || req.name || ""), id.phone, id.email,
    String(req.kind || "").slice(0, 40), note
  ]);
  return { ok: true };
}

function json(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
