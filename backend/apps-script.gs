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
 *   Household is filled in for guests found on the guest list; everyone in a
 *   household gets their own row with the same Household value. People is
 *   only used by rows saved before that (one row for a whole household).
 *
 * Guest list (GUEST_LIST below, a separate spreadsheet Chandler keeps):
 *   Anyone whose phone is on it is recognised when they sign in, without
 *   typing their name. People sharing a Household label sign in together:
 *   any of them sees everyone in the household on the site and can answer
 *   the gut feeling and leave an email and phone for each person. Each
 *   person has their own row in Guests; the mailing address is shared.
 *   Columns are found by their header names.
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
    if (req.action === "reply") return json(reply(id, req));
    if (req.action === "address") return json(saveAddress(id, req));
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

// The guest's row in Guests. Someone on the guest list (by phone, by email if
// the list has an Email column, or by their name when they first sign up)
// gets their own row, and the first time anyone in a household signs in a
// row is added for everyone in it, so nobody is counted twice.
function findRow(id, name) {
  var sheet = guests(), rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    var phone = digits(rows[i][COLS.phone]);
    var email = String(rows[i][COLS.email]).trim().toLowerCase();
    if ((id.phone && phone === id.phone) || (id.email && email === id.email)) {
      if (Number(rows[i][COLS.people]) > 1) return splitRow(sheet, rows[i], id);
      return fillIn(sheet, i + 1, rows[i], id);
    }
  }
  var home = household(id, name);
  if (!home) return null;
  rows = householdRows(sheet, home);
  var mine = rows.filter(function (r) { return simple(r.row[COLS.name]) === simple(home.me.name); })[0] || rows[0];
  return fillIn(sheet, mine.index, mine.row, id);
}

// A household saved on one row before people had their own rows: give
// everyone their own row and return the signed-in guest's.
function splitRow(sheet, row, id) {
  var home = household(id, "", row[COLS.household]);
  if (!home) return null;
  var rows = householdRows(sheet, home);
  var mine = rows.filter(function (r) {
    return (id.phone && digits(r.row[COLS.phone]) === id.phone) ||
      (id.email && String(r.row[COLS.email]).trim().toLowerCase() === id.email);
  })[0] || rows[0];
  return fillIn(sheet, mine.index, mine.row, id);
}

// Rows in Guests for everyone in the household, adding any that are missing.
// A household saved before people had their own rows ("Angi & Kevin
// Queenan" on one row) is split into one row each, keeping its answer and
// address.
function householdRows(sheet, home) {
  var rows = sheet.getDataRange().getValues(), found = [];
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][COLS.household] === home.key) found.push({ index: i + 1, row: rows[i] });
  }
  var shared = found[0] ? found[0].row : null;
  var old = found.filter(function (r) { return Number(r.row[COLS.people]) > 1; })[0];
  if (old) {
    var who = home.members.filter(function (m) {
      return (m.phone && m.phone === digits(old.row[COLS.phone])) ||
        (m.email && m.email === String(old.row[COLS.email]).trim().toLowerCase());
    })[0] || home.members[0];
    old.row[COLS.name] = who.name;
    old.row[COLS.people] = "";
    sheet.getRange(old.index, 1, 1, old.row.length).setValues([old.row]);
    shared = old.row;
  }
  home.members.forEach(function (m) {
    var has = found.some(function (r) { return simple(r.row[COLS.name]) === simple(m.name); });
    if (has) return;
    var row = [phoneValue(m.phone), m.name, m.email || "", home.party ? "party" : "", "", new Date(),
      "", "", "", "", "", "", home.key, ""];
    if (shared) {
      if (old) row[COLS.feeling] = shared[COLS.feeling];   // they used to answer together
      for (var k = 0; k < ADDRESS.length; k++) row[COLS.address + k] = shared[COLS.address + k];
    }
    sheet.appendRow(row);
    found.push({ index: sheet.getLastRow(), row: row });
  });
  return found;
}

// Save a phone or email the row doesn't have yet, so either signs in next time.
function fillIn(sheet, index, row, id) {
  if (id.phone && !digits(row[COLS.phone])) {
    row[COLS.phone] = phoneValue(id.phone);
    sheet.getRange(index, COLS.phone + 1).setValue(row[COLS.phone]);
  }
  if (id.email && !String(row[COLS.email]).trim()) {
    row[COLS.email] = id.email;
    sheet.getRange(index, COLS.email + 1).setValue(id.email);
  }
  return { index: index, row: row };
}

function lookup(id) {
  return describe(findRow(id));
}

function describe(hit) {
  if (!hit) return null;
  var r = hit.row;
  var guest = {
    phone: digits(r[COLS.phone]),
    name: r[COLS.name],
    first: firstNames(r),
    email: r[COLS.email],
    feeling: r[COLS.feeling] || "",
    address: readAddress(r),
    privateEvents: privateEvents(r[COLS.group])
  };
  // Everyone in the household, this guest first, so the site can ask each of them.
  var family = sameHousehold(hit);
  if (family.length > 1) {
    family.sort(function (a, b) { return (b.index === hit.index) - (a.index === hit.index); });
    guest.household = family.map(function (m) {
      return {
        name: String(m.row[COLS.name]),
        email: String(m.row[COLS.email] || ""),
        phone: digits(m.row[COLS.phone]),
        feeling: m.row[COLS.feeling] || "",
        me: m.index === hit.index
      };
    });
    guest.first = joinFirst(guest.household.map(function (m) { return m.name; }));
  }
  return guest;
}

// The rows in Guests sharing this guest's Household (just theirs if none).
function sameHousehold(hit) {
  var key = hit.row[COLS.household];
  if (!key) return [hit];
  var rows = guests().getDataRange().getValues(), out = [];
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][COLS.household] === key) out.push({ index: i + 1, row: rows[i] });
  }
  return out;
}

// The household row for one of its members, by name.
function member(family, name) {
  return family.filter(function (m) { return simple(m.row[COLS.name]) === simple(name); })[0];
}

function privateEvents(group) {
  if (!group) return [];
  var sheet = tab("Private events");
  return sheet.getDataRange().getValues().slice(1)
    .filter(function (r) { return r[0] === group; })
    .map(function (r) { return { date: r[1], time: r[2], title: r[3], place: r[4] }; });
}

function register(id, req) {
  var hit = findRow(id, req.name);
  if (hit) return describe(hit);
  guests().appendRow([phoneValue(id.phone), String(req.name || "").slice(0, 200), id.email || String(req.email || "").slice(0, 200), "", "", new Date()]);
  return lookup(id);
}

// One gut feeling, or { name, feeling } for each person in the household.
function reply(id, req) {
  var hit = findRow(id);
  if (!hit) return { error: "not found" };
  var answers = req.feelings || [{ feeling: req.feeling }];
  var family = sameHousehold(hit), sheet = guests();
  answers.forEach(function (a) {
    if (!FEELINGS[a.feeling]) return;
    var m = a.name ? member(family, a.name) : hit;
    if (m) sheet.getRange(m.index, COLS.feeling + 1, 1, 2).setValues([[a.feeling, new Date()]]);
  });
  return { ok: true };
}

function readAddress(r) {
  var a = {}, any = false;
  ADDRESS.forEach(function (k, i) { a[k] = String(r[COLS.address + i] || ""); if (a[k]) any = true; });
  return any ? a : null;
}

// The postcard: a mailing address for the household, and an email and a
// phone for each person in it, any of them optional.
function saveAddress(id, req) {
  var address = req.address && req.address.line1 ? req.address : null;
  var contacts = (req.contacts || [req.contact || {}]).map(function (c) {
    return {
      name: c.name,
      email: String(c.email || "").trim().toLowerCase().slice(0, 200),
      phone: digits(c.phone)
    };
  }).filter(function (c) { return c.email || c.phone; });
  if (!address && !contacts.length) return { error: "nothing to save" };
  var hit = findRow(id);
  if (!hit) return { error: "not found" };
  var sheet = guests(), family = sameHousehold(hit);
  if (address) {
    var values = ADDRESS.map(function (k) { return String(address[k] || "").slice(0, 200); });
    family.forEach(function (m) {
      sheet.getRange(m.index, COLS.address + 1, 1, ADDRESS.length).setValues([values]);
      sheet.getRange(m.index, COLS.updated + 1).setValue(new Date());
    });
  }
  contacts.forEach(function (c) {
    var m = c.name ? member(family, c.name) : hit;
    if (!m) return;
    if (c.email) sheet.getRange(m.index, COLS.email + 1).setValue(c.email);
    if (c.phone) sheet.getRange(m.index, COLS.phone + 1).setValue(phoneValue(c.phone));
    sheet.getRange(m.index, COLS.updated + 1).setValue(new Date());
  });
  return { ok: true };
}

// Each guest can leave this many notes a day, so nobody can flood the sheet.
var NOTES_PER_DAY = 10;
function notesToday(id) {
  var since = Date.now() - 24 * 60 * 60 * 1000;
  return tab("Notes").getDataRange().getValues().slice(1).filter(function (r) {
    return new Date(r[0]).getTime() > since &&
      ((id.phone && digits(r[2]) === id.phone) || (id.email && String(r[3]).trim().toLowerCase() === id.email));
  }).length;
}

function saveNote(id, req) {
  var note = String(req.note || "").trim().slice(0, 1500);
  if (!note) return { error: "note required" };
  var hit = findRow(id);
  if (!hit) return { error: "not found" };
  if (notesToday(id) >= NOTES_PER_DAY) return { error: "too many notes" };
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
    invite: col("Italy Invite?"), phone: col("Phone"), email: col("Email"), home: col("Household") };
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
  if (withPhone.length) Logger.log("First phone's household: " + JSON.stringify(household({ phone: digits(withPhone[0][list.c.phone]) })));
}

// The household of the guest-list person with this phone, email or name, or
// else the household with this label.
function household(id, name, label) {
  var list = guestList();
  if (!list) return null;
  var c = list.c, people = list.people;
  var me = people.filter(function (r) {
    return (id.phone && digits(r[c.phone]) === id.phone) ||
      (id.email && c.email >= 0 && String(r[c.email]).trim().toLowerCase() === id.email) ||
      (name && simple(r[c.person]) === simple(name));
  })[0] || (label && c.home >= 0 && people.filter(function (r) { return String(r[c.home]).trim() === label; })[0]);
  if (!me) return null;
  label = c.home >= 0 ? String(me[c.home]).trim() : "";
  var members = label ? people.filter(function (r) { return String(r[c.home]).trim() === label; }) : [me];
  var person = function (r) {
    return {
      name: String(r[c.person]).trim(),
      phone: digits(r[c.phone]),
      email: c.email >= 0 ? String(r[c.email]).trim().toLowerCase() : ""
    };
  };
  return {
    key: label || person(me).name,
    me: person(me),
    members: members.map(person),
    party: members.some(function (r) {
      return (c.title >= 0 && String(r[c.title]).trim()) || PARTY_RELATIONSHIPS.indexOf(r[c.rel]) >= 0;
    })
  };
}

// "  chandler  QUEENAN." -> "chandler queenan", for matching typed names.
function simple(name) {
  return String(name || "").toLowerCase().replace(/[^a-z ]/g, "").replace(/\s+/g, " ").trim();
}

// ["Angi Queenan", "Kevin Queenan"] -> "Angi & Kevin", used to greet a
// household on the site.
function joinFirst(names) {
  var parts = names.map(function (n) { return String(n).trim().split(" ")[0]; });
  return parts.length > 1 ? parts.slice(0, -1).join(", ") + " & " + parts[parts.length - 1] : parts[0];
}

// The same for a row saved before people had their own rows.
function firstNames(r) {
  var name = String(r[COLS.name]);
  return name.indexOf(" & ") < 0 ? "" : joinFirst(name.split(/, | & /));
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

// How many households have a row matching the condition (a row without a
// Household counts as its own).
function households(condition) {
  var key = "IF(Guests!M2:M<>\"\",Guests!M2:M,ROW(Guests!M2:M))";
  return "IFERROR(COUNTUNIQUE(ARRAYFORMULA(FILTER(" + key + "," + condition + "))),0)";
}

function overview() {
  var book = SpreadsheetApp.getActive();
  var sheet = book.getSheetByName("Overview") || book.insertSheet("Overview", 0);
  sheet.clear();
  sheet.getCharts().forEach(function (c) { sheet.removeChart(c); });
  book.setActiveSheet(sheet);
  book.moveActiveSheet(1);

  // Each row is one person; rows saved before that count everyone in their
  // household (the People column). Addresses count once per household.
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
    ["Address received", "=" + households("Guests!G2:G<>\"\""), ""],
    ["Still needed", "=" + households("LEN(Guests!A2:A&Guests!B2:B&Guests!C2:C)>0") + "-B12", ""],
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
