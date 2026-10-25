/*
 * Shared site setup: wedding details, navigation, header/footer, countdown.
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
  weekendLabel: "29 September – 2 October 2027",
  town: "Sorrento",
  region: "Amalfi Coast, Italy",
  venue: "[Venue to be announced]",
  rsvpBy: "[RSVP deadline]",
  // Where RSVP answers are sent (Formspree, Google Apps Script, etc.).
  // Leave empty to show the confirmation without saving anything.
  rsvpEndpoint: "",
  // Shows the "draft" ribbon while details are still being filled in.
  draft: true
};

window.PAGES = [
  { href: "index.html", label: "Overview" },
  { href: "travel.html", label: "Travel" },
  { href: "rsvp.html", label: "RSVP" }
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
      (W.draft ? '<p class="draft-ribbon">Draft preview. Venue, times and hotels are still placeholders.</p>' : "") +
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

  renderHeader();
  renderFooter();
  fillDetails();
  countdown();
})();
