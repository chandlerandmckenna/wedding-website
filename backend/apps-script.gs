/**
 * Guest list backend for the wedding site, as a Google Apps Script web app
 * bound to a Google Sheet.
 *
 * Sheet "Guests" (row 1 is headers):
 *   Phone | Name | Email | Group | Feeling | Updated | Street | Apt | City | State | ZIP | Country | Household | People
 *   Phone is stored as a number with country code, e.g. 19259636950, and
 *   shown as +1 (925) 963-6950.
 *   Guests can sign in with either their phone or their email.
 *   Group is optional, e.g. "party" for the wedding party and families.
 *   Household and People are filled in for guests found on the guest list.
 *
 * Guest list (GUEST_LIST below, a separate spreadsheet Chandler keeps):
 *   Anyone whose phone is on it is recognised when they sign in, without
 *   typing their name. People sharing a Household label answer together:
 *   one row in Guests, one gut feeling for all of them, and any of their
 *   phones signs them in. Columns are found by their header names.
 *
 * Sheet "Notes" (row 1 is headers), one row per note left on the site:
 *   Sent | Name | Phone | Email | Kind | Note
 *
 * Sheet "Private events" (row 1 is headers):
 *   Group | Date | Time | Title | Place
 *   Date must match the site's schedule, e.g. "September 30".
 *
 * The tabs are created automatically (run setup() once to make them now).
 * Run styleSheet() once to format every tab and build the Overview tab.
 * Deploy: Extensions > Apps Script, paste this file, then
 * Deploy > New deployment > Web app, execute as "Me", access "Anyone".
 * Put the web app URL in WEDDING.apiEndpoint in assets/js/site.js.
 */

var COLS = { phone: 0, name: 1, email: 2, group: 3, feeling: 4, updated: 5, address: 6, household: 12, people: 13 };
var ADDRESS = ["line1", "line2", "city", "state", "zip", "country"];
var FEELINGS = { yes: true, maybe: true, no: true };

function doPost(e) {
  var req = JSON.parse(e.postData.contents || "{}");
  var id = {
    phone: digits(req.phone),
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
  "Guests": ["Phone", "Name", "Email", "Group", "Feeling", "Updated", "Street", "Apt", "City", "State", "ZIP", "Country", "Household", "People"],
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
  }
  return sheet;
}
// Run once from the Apps Script editor to create all three tabs up front.
function setup() {
  Object.keys(HEADERS).forEach(function (name) {
    tab(name).getRange(1, 1, 1, HEADERS[name].length).setValues([HEADERS[name]]);
  });
}

function guests() {
  return tab("Guests");
}

// The guest's row in Guests. A phone on the guest list finds its household's
// row, which is added the first time anyone in the household signs in.
function findRow(id) {
  var sheet = guests(), rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    var phone = digits(rows[i][COLS.phone]);
    var email = String(rows[i][COLS.email]).trim().toLowerCase();
    if ((id.phone && phone === id.phone) || (id.email && email === id.email)) return { index: i + 1, row: rows[i] };
  }
  var home = id.phone && household(id.phone);
  if (!home) return null;
  for (i = 1; i < rows.length; i++) {
    if (rows[i][COLS.household] === home.key) return { index: i + 1, row: rows[i] };
  }
  var row = [phoneValue(id.phone), home.name, "", home.party ? "party" : "", "", new Date(),
    "", "", "", "", "", "", home.key, home.size];
  sheet.appendRow(row);
  return { index: sheet.getLastRow(), row: row };
}

function lookup(id) {
  var hit = findRow(id);
  if (!hit) return null;
  var r = hit.row;
  return {
    phone: digits(r[COLS.phone]),
    name: r[COLS.name],
    first: firstNames(r),
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
  guests().appendRow([phoneValue(id.phone), String(req.name || "").slice(0, 200), id.email || String(req.email || "").slice(0, 200), "", "", new Date()]);
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
    new Date(), String(hit.row[COLS.name] || req.name || ""), phoneValue(id.phone), id.email,
    String(req.kind || "").slice(0, 40), note
  ]);
  return { ok: true };
}

// ---- Guest list ----------------------------------------------------------------

var GUEST_LIST = {
  id: "1qDTUEo1zvmuj-F8JfudauHMlELVLQ7j2_dbLiouZut8",
  tab: "Full Invite",
  skip: "No"   // rows whose "Italy Invite?" is this aren't recognised
};
// Anyone with a title (Bride, Best man...) or in these relationships sees the
// private events, along with the rest of their household.
var PARTY_RELATIONSHIPS = ["BETROTHED", "M Family", "C Family", "Groomsmen", "Groomsman", "Bridesmaid", "Bridesmaids"];

// The guest list's rows (skipping uninvited ones) and where each column is.
function guestList() {
  var values = SpreadsheetApp.openById(GUEST_LIST.id).getSheetByName(GUEST_LIST.tab).getDataRange().getValues();
  for (var h = 0; h < values.length; h++) {
    var head = values[h].map(function (v) { return String(v).trim(); });
    if (head.indexOf("Person") >= 0 && head.indexOf("Phone") >= 0) break;
  }
  if (h === values.length) return null;
  var col = function (name) { return head.indexOf(name); };
  var c = { person: col("Person"), title: col("Title (if Applicable)"), rel: col("Relationship"),
    invite: col("Italy Invite?"), phone: col("Phone"), home: col("Household") };
  var people = values.slice(h + 1).filter(function (r) {
    return String(r[c.person]).trim() && (c.invite < 0 || String(r[c.invite]).trim() !== GUEST_LIST.skip);
  });
  return { c: c, people: people };
}

// Run from the Apps Script editor, then open View > Logs (or the Execution
// log below the code) to see whether the guest list is being read.
function testGuestList() {
  var list = guestList();
  if (!list) return Logger.log("Couldn't find a header row with Person and Phone in the '" + GUEST_LIST.tab + "' tab.");
  var withPhone = list.people.filter(function (r) { return digits(r[list.c.phone]); });
  Logger.log("Columns found: " + JSON.stringify(list.c));
  Logger.log(list.people.length + " invited people, " + withPhone.length + " with a phone.");
  if (withPhone.length) Logger.log("First phone signs in as: " + JSON.stringify(household(digits(withPhone[0][list.c.phone]))));
}

// The household of the guest-list person with this phone, or null.
function household(phone) {
  var list = guestList();
  if (!list) return null;
  var c = list.c, people = list.people;
  var me = people.filter(function (r) { return digits(r[c.phone]) === phone; })[0];
  if (!me) return null;
  var label = c.home >= 0 ? String(me[c.home]).trim() : "";
  var members = label ? people.filter(function (r) { return String(r[c.home]).trim() === label; }) : [me];
  var names = members.map(function (r) { return String(r[c.person]).trim(); });
  return {
    key: label || names[0],
    name: joinNames(names),
    size: members.length,
    party: members.some(function (r) {
      return (c.title >= 0 && String(r[c.title]).trim()) || PARTY_RELATIONSHIPS.indexOf(r[c.rel]) >= 0;
    })
  };
}

// ["Angi Queenan", "Kevin Queenan"] -> "Angi & Kevin Queenan"
function joinNames(names) {
  var last = names.map(function (n) { return n.split(" ").slice(1).join(" "); });
  var same = names.length > 1 && last[0] && last.every(function (l) { return l === last[0]; });
  var parts = same ? names.map(function (n) { return n.split(" ")[0]; }) : names;
  var joined = parts.length > 1 ? parts.slice(0, -1).join(", ") + " & " + parts[parts.length - 1] : parts[0];
  return same ? joined + " " + last[0] : joined;
}

// "Angi & Kevin" for a household, used to greet them on the site.
function firstNames(r) {
  var name = String(r[COLS.name]);
  if (name.indexOf(" & ") < 0) return "";
  var parts = name.split(/, | & /).map(function (n) { return n.trim().split(" ")[0]; });
  return parts.slice(0, -1).join(", ") + " & " + parts[parts.length - 1];
}

// Digits only, with the US country code added to plain 10-digit numbers, so a
// phone typed into the sheet as (925) 963-6950 matches one entered on the site.
function digits(value) {
  var d = String(value || "").replace(/\D/g, "");
  return d.length === 10 ? "1" + d : d;
}

// Phones are stored as numbers so the sheet can show them formatted.
function phoneValue(digits) {
  return digits ? Number(digits) : "";
}

function json(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

// ---- Looks ------------------------------------------------------------------
// Run styleSheet() once from the Apps Script editor (or the Wedding menu).
// It only changes how the sheet looks, never the answers in it, so it is safe
// to run again any time.

var COBALT = "#1f4e9c", CREAM = "#fbf6ea", GOLD = "#c9a24a", INK = "#2b2b2b";
var PHONE_FORMAT = '"+"0" ("000") "000"-"0000';
var DATE_FORMAT = "mmm d, yyyy h:mm am/pm";
var FEEL_TEXT = { yes: "Count me in!", maybe: "Still thinking", no: "Likely not" };
var NOTE_KINDS = ["Advice", "Well wishes", "Song request", "Italy tip", "Honeymoon rec", "Memory"];

var WIDTHS = {
  "Guests": [150, 200, 220, 90, 110, 160, 200, 80, 120, 70, 80, 110, 150, 70],
  "Notes": [160, 160, 150, 210, 120, 460],
  "Private events": [100, 130, 100, 220, 220]
};

function onOpen() {
  SpreadsheetApp.getUi().createMenu("Wedding")
    .addItem("Style sheet & refresh Overview", "styleSheet")
    .addToUi();
}

function styleSheet() {
  setup();
  Object.keys(HEADERS).forEach(function (name) { styleTab(tab(name), WIDTHS[name]); });

  var g = tab("Guests"), n = tab("Notes");
  phonesToNumbers(g, COLS.phone + 1);
  phonesToNumbers(n, 3);
  g.getRange("A2:A").setNumberFormat(PHONE_FORMAT).setHorizontalAlignment("left");
  n.getRange("C2:C").setNumberFormat(PHONE_FORMAT).setHorizontalAlignment("left");
  g.getRange("F2:F").setNumberFormat(DATE_FORMAT);
  n.getRange("A2:A").setNumberFormat(DATE_FORMAT);
  g.getRange("K2:K").setNumberFormat("@");          // keep ZIP leading zeros
  g.getRange("E2:E").setHorizontalAlignment("center").setFontWeight("bold");
  n.getRange("F2:F").setWrap(true).setVerticalAlignment("top");
  n.getRange("A2:E").setVerticalAlignment("top");
  g.setFrozenColumns(2);

  // Colour the Feeling column. The site reads these codes back, so the cells
  // keep yes / maybe / no and only the colours change.
  var feel = g.getRange("E2:E");
  g.setConditionalFormatRules([
    rule(feel, "yes", "#dcefd9", "#1e6b34"),
    rule(feel, "maybe", "#fdf0c8", "#8a6400"),
    rule(feel, "no", "#e6e8ee", "#4a5266")
  ]);
  feel.setDataValidation(SpreadsheetApp.newDataValidation()
    .requireValueInList(["yes", "maybe", "no"], true).setAllowInvalid(false).build());

  overview();
}

function styleTab(sheet, widths) {
  var cols = widths.length, rows = Math.max(sheet.getMaxRows(), 2);
  sheet.getBandings().forEach(function (b) { b.remove(); });
  var all = sheet.getRange(1, 1, rows, cols);
  all.setFontFamily("Lato").setFontSize(10).setFontColor(INK).setVerticalAlignment("middle");
  all.applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY, true, false)
    .setHeaderRowColor(COBALT).setFirstRowColor("#ffffff").setSecondRowColor(CREAM);
  sheet.getRange(1, 1, 1, cols).setFontColor("#ffffff").setFontWeight("bold")
    .setFontSize(11).setHorizontalAlignment("left")
    .setBorder(null, null, true, null, null, null, GOLD, SpreadsheetApp.BorderStyle.SOLID_THICK);
  sheet.setRowHeight(1, 34);
  sheet.setFrozenRows(1);
  widths.forEach(function (w, i) { sheet.setColumnWidth(i + 1, w); });
}

function rule(range, text, bg, fg) {
  return SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo(text)
    .setBackground(bg).setFontColor(fg).setRanges([range]).build();
}

// Older rows saved phones as text; turn them into numbers so they format.
function phonesToNumbers(sheet, col) {
  var last = sheet.getLastRow();
  if (last < 2) return;
  var range = sheet.getRange(2, col, last - 1, 1);
  range.setValues(range.getValues().map(function (r) {
    var d = digits(r[0]);
    return [d ? Number(d) : ""];
  }));
}

function overview() {
  var book = SpreadsheetApp.getActive();
  var sheet = book.getSheetByName("Overview") || book.insertSheet("Overview", 0);
  sheet.clear();
  sheet.getCharts().forEach(function (c) { sheet.removeChart(c); });
  book.setActiveSheet(sheet);
  book.moveActiveSheet(1);

  // Households count each person in them (the People column).
  var people = "(1+(Guests!N2:N<>\"\")*(Guests!N2:N-1))";
  var signed = "SUMPRODUCT((LEN(Guests!A2:A&Guests!B2:B&Guests!C2:C)>0)*" + people + ")";
  var feeling = function (f) { return "=SUMPRODUCT((Guests!E2:E=\"" + f + "\")*" + people + ")"; };
  var rows = [
    ["McKenna & Chandler · Save the Date", "", ""],
    ["Updates live as guests answer on the site.", "", ""],
    ["", "", ""],
    ["Gut feeling", "People", "Share"],
    [FEEL_TEXT.yes, feeling("yes"), ""],
    [FEEL_TEXT.maybe, feeling("maybe"), ""],
    [FEEL_TEXT.no, feeling("no"), ""],
    ["No answer yet", "=" + signed + "-SUM(B5:B7)", ""],
    ["Total signed in", "=" + signed, ""],
    ["", "", ""],
    ["Mailing addresses", "Households", "Share"],
    ["Address received", "=COUNTA(Guests!G2:G)", ""],
    ["Still needed", "=SUMPRODUCT(--(LEN(Guests!A2:A&Guests!B2:B&Guests!C2:C)>0))-B12", ""],
    ["", "", ""],
    ["Notes for the couple", "Notes", "Share"]
  ];
  NOTE_KINDS.forEach(function (k) { rows.push([k, '=COUNTIF(Notes!E2:E,"' + k + '")', ""]); });
  var notesTotal = rows.length + 1;
  rows.push(["Total notes", "=COUNTA(Notes!F2:F)", ""]);
  sheet.getRange(1, 1, rows.length, 3).setValues(rows);

  // Shares
  [5, 6, 7, 8].forEach(function (r) { sheet.getRange(r, 3).setFormula("=IFERROR(B" + r + "/$B$9,0)"); });
  [12, 13].forEach(function (r) { sheet.getRange(r, 3).setFormula("=IFERROR(B" + r + "/($B$12+$B$13),0)"); });
  for (var r = 16; r < notesTotal; r++) sheet.getRange(r, 3).setFormula("=IFERROR(B" + r + "/$B$" + notesTotal + ",0)");
  sheet.getRange(1, 3, rows.length, 1).setNumberFormat("0%");

  // Looks
  sheet.setHiddenGridlines(true);
  sheet.getRange(1, 1, rows.length, 3).setFontFamily("Lato").setFontSize(11).setFontColor(INK)
    .setVerticalAlignment("middle");
  sheet.getRange("B:C").setHorizontalAlignment("right");
  sheet.setColumnWidth(1, 240); sheet.setColumnWidth(2, 110); sheet.setColumnWidth(3, 90);
  sheet.getRange("A1").setFontFamily("Playfair Display").setFontSize(20).setFontColor(COBALT);
  sheet.getRange("A2").setFontColor("#7a7a7a").setFontStyle("italic").setFontSize(10);
  sheet.setRowHeight(1, 44);
  [4, 11, 15].forEach(function (r) {
    sheet.getRange(r, 1, 1, 3).setBackground(COBALT).setFontColor("#ffffff").setFontWeight("bold")
      .setBorder(null, null, true, null, null, null, GOLD, SpreadsheetApp.BorderStyle.SOLID_THICK);
    sheet.setRowHeight(r, 30);
  });
  [[5, 9], [12, 13], [16, notesTotal]].forEach(function (b) {
    for (var r = b[0]; r <= b[1]; r++) sheet.getRange(r, 1, 1, 3).setBackground((r - b[0]) % 2 ? CREAM : "#ffffff");
  });
  [9, notesTotal].forEach(function (r) {
    sheet.getRange(r, 1, 1, 3).setFontWeight("bold")
      .setBorder(true, null, null, null, null, null, GOLD, SpreadsheetApp.BorderStyle.SOLID);
  });
  sheet.getRange("A5").setFontColor("#1e6b34");
  sheet.getRange("A6").setFontColor("#8a6400");
  sheet.getRange("A7").setFontColor("#4a5266");

  // Pie chart of gut feelings
  sheet.insertChart(sheet.newChart().asPieChart()
    .addRange(sheet.getRange("A5:B8"))
    .setOption("title", "Gut feelings")
    .setOption("pieHole", 0.45)
    .setOption("colors", ["#3f8f55", "#e0b03a", "#8a93a8", "#d9dce3"])
    .setOption("legend", { position: "right" })
    .setPosition(4, 5, 10, 0)
    .setOption("width", 420).setOption("height", 280)
    .build());
}
