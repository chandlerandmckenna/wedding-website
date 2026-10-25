/*
 * Shared site setup: wedding details, guest sign-in, navigation,
 * header/footer, countdown, section fades and the hidden schedule.
 * Edit WEDDING to change details everywhere. Add a page by creating the
 * HTML file and adding one line to PAGES.
 */
window.WEDDING = {
  coupleA: "McKenna",
  coupleB: "Chandler",
  surname: "Queenan",
  monogram: "M & C",
  dateISO: "2027-10-01T16:00:00+02:00",
  dateLabel: "Friday, October 1, 2027",
  town: "Sorrento",
  venue: "Capo Santa Fortunata",
  // Google Apps Script web app URL (see backend/apps-script.gs). It looks up
  // guests by phone number and saves their answers to a Google Sheet.
  // Leave empty for preview mode: sign-ins and answers stay in this browser.
  apiEndpoint: "",
  // Turn on when you're ready to share the schedule.
  showSchedule: false
};

// Events every guest sees. Private events (rehearsal, rehearsal dinner) are
// not listed here: they live in the guest list backend and are sent only to
// the guests invited to them, as guest.privateEvents.
window.SCHEDULE = [
  {
    day: "Wednesday", date: "September 29",
    events: [
      { time: "5:00 pm", title: "Welcome party", place: "Sorrento" }
    ]
  },
  {
    day: "Thursday", date: "September 30",
    events: [
      { time: "11:00 am", title: "Beach club", place: "Sorrento" }
    ]
  },
  {
    day: "Friday", date: "October 1", main: true,
    events: [
      { time: "", title: "Wedding ceremony", place: "Capo Santa Fortunata" },
      { time: "", title: "Reception", place: "Immediately following" }
    ]
  }
];

window.PAGES = [
  { href: "index.html", label: "Save the date" },
  { href: "travel.html", label: "Travel" }
];

/* ---------- Guest session and API ---------- */
(function () {
  var W = window.WEDDING;
  var SESSION_KEY = "mc-guest";
  var DEMO_KEY = "mc-demo-guests";

  function read(key) {
    try { return JSON.parse(localStorage.getItem(key)); } catch (e) { return null; }
  }
  function write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage blocked */ }
  }
  function remove(key) {
    try { localStorage.removeItem(key); } catch (e) { /* storage blocked */ }
  }

  var memory = null; // session fallback when storage is blocked

  window.Guest = {
    current: function () { return read(SESSION_KEY) || memory; },
    save: function (guest) { memory = guest; write(SESSION_KEY, guest); },
    signOut: function () { memory = null; remove(SESSION_KEY); }
  };

  // Guests are found by phone (digits with country code, e.g. 19259636950)
  // or by email (lower case). id is { phone } or { email }.
  function keysFor(g) {
    var keys = [];
    if (g.phone) keys.push("p:" + g.phone);
    if (g.email) keys.push("e:" + String(g.email).toLowerCase());
    return keys;
  }

  // Preview mode keeps a small guest book in this browser only.
  var demo = {
    all: function () { return read(DEMO_KEY) || {}; },
    find: function (id) { return demo.all()[keysFor(id)[0]] || null; },
    put: function (g) {
      var all = demo.all();
      keysFor(g).forEach(function (k) { all[k] = g; });
      write(DEMO_KEY, all);
      return g;
    }
  };

  function call(action, payload) {
    if (!W.apiEndpoint) return null;
    // text/plain avoids a CORS preflight, which Apps Script can't answer.
    return fetch(W.apiEndpoint, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(Object.assign({ action: action }, payload))
    }).then(function (res) {
      if (!res.ok) throw new Error(action + " failed: " + res.status);
      return res.json();
    });
  }

  window.GuestAPI = {
    preview: !W.apiEndpoint,
    // Resolves to the guest record, or null if we don't know them yet.
    lookup: function (id) {
      return call("lookup", id) || Promise.resolve(demo.find(id));
    },
    register: function (guest) {
      return call("register", guest) || Promise.resolve(demo.put(guest));
    },
    reply: function (guest, feeling) {
      var p = call("reply", { phone: guest.phone, email: guest.email, feeling: feeling });
      if (p) return p;
      var g = demo.find(guest);
      if (g) { g.feeling = feeling; demo.put(g); }
      return Promise.resolve({ ok: true });
    },
    // address is { line1, line2, city, state, zip, country }
    address: function (guest, address) {
      var p = call("address", { phone: guest.phone, email: guest.email, address: address });
      if (p) return p;
      var g = demo.find(guest);
      if (g) { g.address = address; demo.put(g); }
      return Promise.resolve({ ok: true });
    }
  };
})();

/* ---------- Page chrome ---------- */
(function () {
  var W = window.WEDDING;

  function homeHref() { return window.PAGES[0].href; }

  function currentPage() {
    var file = location.pathname.split("/").pop() || homeHref();
    var hit = window.PAGES.some(function (p) { return p.href === file; });
    return hit ? file : homeHref();
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  window.esc = esc;

  window.renderHeader = function () {
    var el = document.getElementById("site-header");
    if (!el) return;
    var here = currentPage();
    var guest = window.Guest.current();
    var links = window.PAGES.map(function (p) {
      var cur = p.href === here ? ' aria-current="page"' : "";
      return '<a href="' + p.href + '"' + cur + ">" + p.label + "</a>";
    }).join("");
    el.innerHTML =
      '<div class="tile-band" aria-hidden="true"></div>' +
      '<div class="header-inner">' +
      '<a class="monogram" href="' + homeHref() + '">' + W.monogram + "</a>" +
      '<nav class="site-nav" aria-label="Main">' + links + "</nav>" +
      (guest ? '<p class="who">Ciao, ' + esc(guest.name.split(/[ &]/)[0]) +
        ' <button type="button" class="link-button" id="sign-out">Not you?</button></p>' : "") +
      "</div>";
    var out = document.getElementById("sign-out");
    if (out) out.addEventListener("click", function () {
      window.Guest.signOut();
      location.href = homeHref();
    });
  };

  function renderFooter() {
    var el = document.getElementById("site-footer");
    if (!el) return;
    el.innerHTML =
      '<div class="footer-inner">' +
      '<p class="script">Ci vediamo a Sorrento!</p>' +
      '<p class="footer-names">' + W.coupleA + " &amp; " + W.coupleB + "</p>" +
      "<p>" + W.dateLabel + " · " + W.venue + ", " + W.town + "</p>" +
      "</div>" +
      '<div class="tile-band" aria-hidden="true"></div>';
  }

  function fillDetails() {
    document.querySelectorAll("[data-w]").forEach(function (el) {
      var v = W[el.getAttribute("data-w")];
      if (v != null) el.textContent = v;
    });
  }

  function countdown() {
    var el = document.getElementById("countdown");
    if (!el) return;
    var days = Math.ceil((new Date(W.dateISO) - new Date()) / 86400000);
    if (days > 1) el.innerHTML = '<span class="count-num">' + days + '</span> Days to go';
    else if (days === 1) el.textContent = "Tomorrow!";
    else if (days === 0) el.textContent = "Today is the day";
    else el.textContent = "Grazie for celebrating with us";
  }

  window.renderSchedule = renderSchedule;
  function renderSchedule() {
    var section = document.getElementById("schedule");
    var el = document.getElementById("schedule-days");
    if (!section || !el) return;
    if (!W.showSchedule) { section.hidden = true; return; }
    var guest = window.Guest.current() || {};
    var extra = guest.privateEvents || [];
    el.innerHTML = window.SCHEDULE.map(function (d) {
      var events = d.events.concat(extra.filter(function (e) { return e.date === d.date; })
        .map(function (e) { return Object.assign({ private: true }, e); }));
      return '<article class="day' + (d.main ? " main" : "") + '">' +
        '<div class="day-head"><span class="dow">' + esc(d.day) + '</span><span class="date">' + esc(d.date) + "</span></div>" +
        events.map(function (e) {
          return '<div class="event">' +
            (e.private ? '<span class="private">Wedding party &amp; family</span>' : "") +
            (e.time ? "<time>" + esc(e.time) + "</time>" : "") +
            "<h3>" + esc(e.title) + "</h3>" +
            (e.place ? "<p>" + esc(e.place) + "</p>" : "") +
            "</div>";
        }).join("") +
        "</article>";
    }).join("");
    section.hidden = false;
  }

  // Page flips: each .flip section folds down from its top edge as it
  // scrolls in. Browsers with scroll-driven animations do this in CSS, tied
  // to the scroll; others get the same flip once, when the section arrives.
  // Sections already on screen stay put.
  // Each section fills the screen; scrolling settles on the next one, which
  // fades in as the one before fades out.
  window.setupPageFades = function (root) {
    var head = document.getElementById("site-header");
    var html = document.documentElement;
    function measure() {
      var h = head ? head.offsetHeight : 0;
      html.style.setProperty("--head", h + "px");
      // Snapping only works when every section fits on the screen. If one is
      // taller (phones, short windows), scroll freely so nothing is skipped.
      var room = window.innerHeight - h + 2;
      var tall = Array.prototype.some.call((root || document).querySelectorAll(".page, .page-hero"), function (el) {
        var spare = parseFloat(getComputedStyle(el).paddingBottom) || 0;   // empty space may tuck under
        return !el.hidden && el.offsetHeight - spare > room;
      });
      html.classList.toggle("free-scroll", tall);
    }
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("load", measure);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
    var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) return;
    document.documentElement.classList.add("paged");
    measure();   // sections grow to a full screen once paged
    // the section crossing the middle of the screen is the one showing
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { en.target.classList.toggle("shown", en.isIntersecting); });
    }, { rootMargin: "-45% 0px -45% 0px" });
    (root || document).querySelectorAll(".fade").forEach(function (el) { io.observe(el); });
  };

  // Every page except the cover needs a signed-in guest.
  var isHome = currentPage() === homeHref();
  if (!isHome && !window.Guest.current()) {
    location.replace(homeHref());
    return;
  }

  window.renderHeader();
  renderFooter();
  fillDetails();
  countdown();
  renderSchedule();
  if (!isHome) window.setupPageFades();
})();
