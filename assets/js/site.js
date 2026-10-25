/*
 * Shared site setup: wedding details, navigation, header/footer, countdown,
 * and the (currently hidden) schedule.
 * Edit WEDDING to change details everywhere. Add a page by creating the
 * HTML file and adding one line to PAGES.
 */
window.WEDDING = {
  coupleA: "McKenna",
  coupleB: "Chandler",
  surname: "Queenan",
  monogram: "M & C",
  dateISO: "2027-10-01T16:00:00+02:00",
  dateLabel: "Friday, 1 October 2027",
  weekendLabel: "29 September – 1 October 2027",
  town: "Sorrento",
  region: "Amalfi Coast, Italy",
  venue: "Capo Santa Fortunata",
  // Where "gut feeling" replies are sent (Formspree, Google Apps Script, etc.).
  // Leave empty to show the thank-you without saving anything.
  replyEndpoint: "",
  // Turn on when you're ready to share the schedule.
  showSchedule: false,
  // Events marked audience "party" only show when this is true. This hides
  // them from the page, but anyone reading the source can still see them.
  showPartyEvents: false,
  // Shows a ribbon across the top while the site is a draft.
  draft: false
};

window.SCHEDULE = [
  {
    day: "Wednesday", date: "29 September",
    events: [
      { time: "5:00 pm", title: "Welcome party", place: "Sorrento", audience: "all" }
    ]
  },
  {
    day: "Thursday", date: "30 September",
    events: [
      { time: "11:00 am", title: "Beach club", place: "Sorrento", audience: "all" },
      { time: "4:00 pm", title: "Rehearsal", place: "Capo Santa Fortunata", audience: "party" },
      { time: "6:00 pm", title: "Rehearsal dinner", place: "Location to be announced", audience: "party" }
    ]
  },
  {
    day: "Friday", date: "1 October", main: true,
    events: [
      { time: "", title: "Wedding ceremony", place: "Capo Santa Fortunata", audience: "all" },
      { time: "", title: "Reception", place: "Immediately following", audience: "all" }
    ]
  }
];

window.PAGES = [
  { href: "index.html", label: "Save the date" },
  { href: "travel.html", label: "Travel" }
];

(function () {
  var W = window.WEDDING;

  function currentPage() {
    var file = location.pathname.split("/").pop() || "index.html";
    var hit = window.PAGES.some(function (p) { return p.href === file; });
    return hit ? file : "index.html";
  }

  function renderHeader() {
    var el = document.getElementById("site-header");
    if (!el) return;
    var here = currentPage();
    var links = window.PAGES.map(function (p) {
      var cur = p.href === here ? ' aria-current="page"' : "";
      return '<a href="' + p.href + '"' + cur + ">" + p.label + "</a>";
    }).join("");
    el.innerHTML =
      (W.draft ? '<p class="draft-ribbon">Draft preview</p>' : "") +
      '<div class="tile-band" aria-hidden="true"></div>' +
      '<div class="header-inner">' +
      '<a class="monogram" href="index.html">' + W.monogram + "</a>" +
      '<nav class="site-nav" aria-label="Main">' + links + "</nav>" +
      "</div>";
  }

  function renderFooter() {
    var el = document.getElementById("site-footer");
    if (!el) return;
    el.innerHTML =
      '<div class="footer-inner">' +
      '<p class="footer-names">' + W.coupleA + " &amp; " + W.coupleB + "</p>" +
      "<p>" + W.dateLabel + " · " + W.town + ", Italia</p>" +
      "</div>" +
      '<div class="tile-band" aria-hidden="true"></div>';
  }

  // Fill any element with data-w="key" from WEDDING.
  // Values in [brackets] are placeholders and get marked as such.
  function fillDetails() {
    document.querySelectorAll("[data-w]").forEach(function (el) {
      var v = W[el.getAttribute("data-w")];
      if (v == null) return;
      el.textContent = v;
      if (/^\[.*\]$/.test(v)) {
        el.textContent = v.slice(1, -1);
        el.classList.add("tbd");
      }
    });
  }

  function countdown() {
    var el = document.getElementById("countdown");
    if (!el) return;
    var days = Math.ceil((new Date(W.dateISO) - new Date()) / 86400000);
    if (days > 1) el.innerHTML = '<span class="count-num">' + days + '</span> days to go';
    else if (days === 1) el.textContent = "Tomorrow!";
    else if (days === 0) el.textContent = "Today is the day";
    else el.textContent = "Grazie for celebrating with us";
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function renderSchedule() {
    var section = document.getElementById("schedule");
    var el = document.getElementById("schedule-days");
    if (!section || !el) return;
    if (!W.showSchedule) { section.hidden = true; return; }
    el.innerHTML = window.SCHEDULE.map(function (d) {
      var events = d.events.filter(function (e) {
        return e.audience !== "party" || W.showPartyEvents;
      });
      if (!events.length) return "";
      return '<article class="day' + (d.main ? " main" : "") + '">' +
        '<div class="day-head"><span class="dow">' + esc(d.day) + '</span><span class="date">' + esc(d.date) + "</span></div>" +
        events.map(function (e) {
          return '<div class="event">' +
            (e.time ? "<time>" + esc(e.time) + "</time>" : "") +
            "<h3>" + esc(e.title) + "</h3>" +
            (e.place ? "<p>" + esc(e.place) + "</p>" : "") +
            "</div>";
        }).join("") +
        "</article>";
    }).join("");
    section.hidden = false;
  }

  renderHeader();
  renderFooter();
  fillDetails();
  countdown();
  renderSchedule();
})();
