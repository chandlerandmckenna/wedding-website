/*
 * Shared site setup: wedding details, guest sign-in, navigation,
 * header/footer, countdown, page-turn animations and the hidden schedule.
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
    day: "Wednesday", date: "29 September",
    events: [
      { time: "5:00 pm", title: "Welcome party", place: "Sorrento" }
    ]
  },
  {
    day: "Thursday", date: "30 September",
    events: [
      { time: "11:00 am", title: "Beach club", place: "Sorrento" }
    ]
  },
  {
    day: "Friday", date: "1 October", main: true,
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

  // Normalise to digits with a country code. 10 digits = US/Canada.
  function normalizePhone(raw) {
    var digits = String(raw || "").replace(/\D/g, "");
    if (/^\+/.test(String(raw).trim()) || digits.length > 10) return digits.replace(/^00/, "");
    if (digits.length === 10) return "1" + digits;
    return digits;
  }

  var memory = null; // session fallback when storage is blocked

  window.Guest = {
    normalizePhone: normalizePhone,
    current: function () { return read(SESSION_KEY) || memory; },
    save: function (guest) { memory = guest; write(SESSION_KEY, guest); },
    signOut: function () { memory = null; remove(SESSION_KEY); }
  };

  // Preview mode keeps a small guest book in this browser only.
  var demo = {
    all: function () { return read(DEMO_KEY) || {}; },
    put: function (g) { var all = demo.all(); all[g.phone] = g; write(DEMO_KEY, all); return g; }
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
    // Resolves to the guest record, or null if this number isn't known yet.
    lookup: function (phone) {
      return call("lookup", { phone: phone }) ||
        Promise.resolve(demo.all()[phone] || null);
    },
    register: function (guest) {
      return call("register", guest) || Promise.resolve(demo.put(guest));
    },
    reply: function (phone, feeling) {
      var p = call("reply", { phone: phone, feeling: feeling });
      if (p) return p;
      var g = demo.all()[phone];
      if (g) { g.feeling = feeling; demo.put(g); }
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
      '<div class="awning" aria-hidden="true"></div>' +
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
    if (days > 1) el.innerHTML = '<span class="count-num">' + days + '</span> days to go';
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

  // Page turns: anything with .turn that starts below the fold swings in
  // like a page as it scrolls into view. Things already on screen stay put.
  window.setupPageTurns = function (root) {
    var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.remove("pending");
        io.unobserve(en.target);
      });
    }, { threshold: 0.15 });
    (root || document).querySelectorAll(".turn").forEach(function (el) {
      if (el.getBoundingClientRect().top > window.innerHeight * 0.9) {
        el.classList.add("pending");
        io.observe(el);
      }
    });
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
  if (!isHome) window.setupPageTurns();
})();
