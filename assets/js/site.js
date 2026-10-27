/*
 * Shared site setup: wedding details, guest sign-in, navigation,
 * header/footer, countdown, section fades and the hidden schedule.
 * Edit WEDDING to change details everywhere. Add a page by creating the
 * HTML file and adding one line to PAGES.
 */
/*
 * Big screens: the design is laid out for a window about 1440 x 760. On
 * computers we zoom the whole page so it fills the window the same way,
 * bigger on a large monitor and a little smaller on a short laptop
 * screen. --vw and --vh stand in for the vw/vh units in styles.css so
 * they still mean the real window once the page is zoomed.
 */
(function () {
  var html = document.documentElement;
  var canZoom = window.CSS && CSS.supports && CSS.supports("zoom", "1.5");
  function fit() {
    var w = window.innerWidth, h = window.innerHeight;
    var z = 1;
    if (canZoom && w >= 1000) z = Math.max(0.85, Math.min(1.6, w / 1440, h / 760));
    z = Math.round(z * 100) / 100;
    html.style.zoom = z === 1 ? "" : z;
    html.style.setProperty("--vw", (w / z / 100) + "px");
    html.style.setProperty("--vh", (h / z / 100) + "px");
    window.pageZoom = z;
  }
  fit();
  window.addEventListener("resize", fit);
})();

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
  apiEndpoint: "https://script.google.com/macros/s/AKfycbw89GGyUV6FwVLychrs_3ZxH8vONSvbC4A1LqT-xWkLtjlIgROk9hDHnwAx0DQgOhZD/exec",
  // Turn on when you're ready to share the schedule.
  showSchedule: false
};

// The developer site (Cloudflare's ….workers.dev, dev.….pages.dev or dev--….netlify.app, built from the dev branch) runs in
// preview mode so testing there never touches the real guest Sheet.
if (/^dev(--|\.)|\.workers\.dev$/.test(location.hostname)) window.WEDDING.apiEndpoint = "";

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

  // Preview mode: Chandler's and their mom's numbers (kept as fingerprints,
  // not the numbers themselves, since this file is public) sign in as Angi &
  // Kevin's household, to try the household version without the guest list.
  function sample(id) {
    var h = 5381;
    String(id.phone || "").split("").forEach(function (c) { h = (h * 33 + c.charCodeAt(0)) >>> 0; });
    if (h !== 1491194378 && h !== 313861232) return null;
    return demo.put(demoHousehold({ phone: id.phone, email: "", name: "Angi & Kevin Queenan", feeling: "" }));
  }

  // Preview mode keeps a small guest book in this browser only.
  var demo = {
    all: function () { return read(DEMO_KEY) || {}; },
    find: function (id) {
      var g = demo.all()[keysFor(id)[0]] || null;
      return g && g.household ? g : sample(id) || g;
    },
    put: function (g) {
      var all = demo.all();
      keysFor(g).forEach(function (k) { all[k] = g; });
      write(DEMO_KEY, all);
      return g;
    }
  };

  // "Angi & Kevin" for a household from the guest list, else the first name.
  window.firstName = function (guest) {
    return guest.first || String(guest.name || "").split(/[ &]/)[0];
  };

  // A household (couples, families) lists everyone in it, the signed-in guest
  // first: [{ name, email, phone, feeling, me }]. Singles have none.
  window.householdOf = function (guest) {
    return guest.household && guest.household.length > 1 ? guest.household : null;
  };

  // The one answer the header shows: the guest's own, or else the first one
  // anyone in their household has given.
  window.feelingOf = function (guest) {
    var home = window.householdOf(guest);
    if (guest.feeling || !home) return guest.feeling || "";
    var answered = home.filter(function (m) { return m.feeling; })[0];
    return answered ? answered.feeling : "";
  };

  // Preview mode: a name typed as "Angi & Kevin Queenan" signs in as a
  // household of two, so the household version can be tried without the Sheet.
  function demoHousehold(guest) {
    var parts = String(guest.name || "").split(/\s*(?:,|&| and )\s*/i).filter(Boolean);
    if (parts.length < 2) return guest;
    var last = parts[parts.length - 1].split(" ").slice(1).join(" ");
    var names = parts.map(function (n) { return n.indexOf(" ") < 0 && last ? n + " " + last : n; });
    guest.household = names.map(function (n, i) {
      return { name: n, email: i ? "" : guest.email || "", phone: i ? "" : guest.phone || "", feeling: "", me: !i };
    });
    guest.first = names.map(function (n) { return n.split(" ")[0]; }).join(" & ");
    return guest;
  }

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

  // Copies one field from [{ name, ... }] onto the guest and their household.
  function apply(g, list, field) {
    (list || []).forEach(function (a) {
      if (!a[field]) return;
      var m = (g.household || []).filter(function (h) { return h.name === a.name; })[0];
      if (m) m[field] = a[field];
      if (!m || m.me) g[field] = a[field];
    });
  }
  window.applyAnswers = apply;

  window.GuestAPI = {
    preview: !W.apiEndpoint,
    // Resolves to the guest record, or null if we don't know them yet.
    lookup: function (id) {
      return call("lookup", id) || Promise.resolve(demo.find(id));
    },
    // Resolves to the guest record as saved (a household gets its members).
    register: function (guest) {
      var p = call("register", guest);
      return p ? p.then(function (g) { return g || guest; }) : Promise.resolve(demo.put(demoHousehold(guest)));
    },
    // answers is [{ name, feeling }], one for each person answering
    reply: function (guest, answers) {
      var p = call("reply", { phone: guest.phone, email: guest.email, feelings: answers });
      if (p) return p;
      var g = demo.find(guest);
      if (g) { apply(g, answers, "feeling"); demo.put(g); }
      return Promise.resolve({ ok: true });
    },
    // address is { line1, line2, city, state, zip, country } for the household;
    // contacts is [{ name, email, phone }], one for each person
    address: function (guest, address, contacts) {
      var p = call("address", { phone: guest.phone, email: guest.email, address: address, contacts: contacts });
      if (p) return p;
      var g = demo.find(guest);
      if (g) {
        if (address) g.address = address;
        apply(g, contacts, "email");
        apply(g, contacts, "phone");
        demo.put(g);
      }
      return Promise.resolve({ ok: true });
    },
    // a note for the couple; kind is "Advice", "Song request" and so on, or ""
    note: function (guest, kind, text) {
      var p = call("note", { phone: guest.phone, email: guest.email, name: guest.name, kind: kind, note: text });
      if (p) return p;
      var g = demo.find(guest);
      if (g) { g.notes = (g.notes || []).concat([{ kind: kind, note: text, at: new Date().toISOString() }]); demo.put(g); }
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

  // A pill in the header that leads to the gut-feeling question, so nobody
  // misses it. Once answered it shows the guest's answer instead.
  var FEEL_LABELS = {
    yes: '<span aria-hidden="true">✓</span> Count me in!',
    maybe: '<span aria-hidden="true">…</span> Still thinking',
    no: '<span aria-hidden="true">✕</span> Likely not'
  };
  function feelButton(guest) {
    var feeling = window.feelingOf(guest);
    var answer = FEEL_LABELS[feeling];
    return '<a class="feel-jump' + (answer ? " answered is-" + feeling : "") + '" id="feel-jump" href="' + homeHref() + '#reply"' +
      (answer ? ' aria-label="Your gut feeling: ' + feeling + '. Change it"' : "") + ">" +
      (answer || "Have a gut feeling?") + "</a>";
  }
  window.goToFeeling = function (smooth) {
    var el = document.getElementById("reply");
    if (!el) return;
    var head = document.getElementById("site-header");
    // show the section at once so its fade-in nudge doesn't throw off where it is
    el.style.transition = "none";
    el.classList.add("shown");
    var y = el.getBoundingClientRect().top + window.scrollY - (head ? head.getBoundingClientRect().height : 0);
    el.offsetHeight;   // apply before the transition comes back
    el.style.transition = "";
    window.scrollTo({ top: Math.max(0, y), behavior: smooth ? "smooth" : "auto" });
  };

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
      (guest ? feelButton(guest) : "") +
      (guest ? '<p class="who">Ciao, ' + esc(window.firstName(guest)) +
        ' <button type="button" class="link-button" id="sign-out">Not you?</button></p>' : "") +
      "</div>";
    var feel = document.getElementById("feel-jump");
    if (feel) feel.addEventListener("click", function (e) {
      if (!document.getElementById("reply")) return;   // on Travel: follow the link home
      e.preventDefault();
      window.goToFeeling(true);
    });
    var out = document.getElementById("sign-out");
    if (out) out.addEventListener("click", function () {
      window.Guest.signOut();
      location.href = homeHref();
    });
  };

  function renderFooter() {
    var el = document.getElementById("site-footer");
    if (!el) return;
    // little ocean ripples for the boat to sail on
    function waves(x0, x1, y) {
      var d = "", w = 11;
      for (var x = x0; x < x1; x += w) d += "Q" + (x + w / 2) + " " + (y + ((x - x0) / w % 2 ? 3 : -3)) + " " + (x + w) + " " + y;
      return d;
    }
    el.innerHTML =
      '<div class="footer-inner">' +
      '<svg class="footer-sail" viewBox="0 0 220 34" aria-hidden="true" focusable="false">' +
      '<path d="M0 31' + waves(0, 220, 31) + '" fill="none" stroke="#eeaa22" stroke-width="2" stroke-linecap="round"/>' +
      '<g class="sail"><path d="M110 4V25L124 24Z" fill="#fff" stroke="#1d3fbd" stroke-width="1.6" stroke-linejoin="round"/>' +
      '<path d="M107 8V25L97 25Z" fill="#fff" stroke="#1d3fbd" stroke-width="1.6" stroke-linejoin="round"/>' +
      '<path d="M94 26H128L123 31H99Z" fill="#1d3fbd"/></g></svg>' +
      '<p class="script">Ci vediamo a Sorrento!</p>' +
      '<p class="footer-names">The Queenans</p>' +
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
    if (days > 1) el.textContent = days + " Days to go";
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
    floatHeroText(root);
    // the Vespa and the plane set off only once they are well up the screen,
    // and park again when their section scrolls away
    function setOff(entries) {
      entries.forEach(function (en) { if (en.isIntersecting) en.target.classList.add("go"); });
    }
    var carGo = new IntersectionObserver(setOff, { threshold: 1 });     // the whole scooter is on screen
    var planeGo = new IntersectionObserver(setOff, { rootMargin: "0px 0px -50% 0px", threshold: 1 });  // up in the top half
    (root || document).querySelectorAll(".story-car, .flights-plane, .ferry-boat").forEach(function (el) {
      (el.classList.contains("story-car") ? carGo : planeGo).observe(el);
      var page = el.closest(".page");
      new IntersectionObserver(function (entries) {
        if (!entries[0].isIntersecting) el.classList.remove("go");
      }).observe(page);
    });
    // venue photos fan out only when the whole gallery is in view, and tuck
    // away again once it has scrolled off
    (root || document).querySelectorAll(".gallery").forEach(function (el) {
      new IntersectionObserver(function (entries) {
        var en = entries[0];
        if (en.intersectionRatio >= 0.9) el.classList.add("fanned");
        else if (!en.isIntersecting) { el.classList.remove("fanned"); tuck(); }
      }, { threshold: [0, 0.9], rootMargin: "0px 0px -4% 0px" }).observe(el);
      // scrolling on down, the side photos slide back behind the middle one
      // step by step with the scroll
      var sides = [el.querySelector("figure:first-child"), el.querySelector("figure:last-child")];
      var ticking = false;
      function tuck() {
        ticking = false;
        // starts once the photos' middle rises above 40% of the screen and
        // is done as it reaches the top
        var r = el.getBoundingClientRect();
        var line = window.innerHeight * 0.4;
        var t = Math.min(1, Math.max(0, (line - (r.top + r.height / 2)) / line));
        sides.forEach(function (f, i) {
          if (!f) return;
          if (!t || !el.classList.contains("fanned")) { f.style.transform = f.style.opacity = f.style.transition = ""; return; }
          var dir = i ? -1 : 1;
          f.style.transition = "transform 0.25s ease-out, opacity 0.25s ease-out";
          f.style.transform = "translateX(calc((100% + var(--gg)) * " + (dir * t).toFixed(3) + ")) rotate(" + (dir * 4 * t).toFixed(2) + "deg) scale(" + (1 - 0.1 * t).toFixed(3) + ")";
          f.style.opacity = (1 - t).toFixed(3);
        });
      }
      window.addEventListener("scroll", function () {
        if (!ticking) { ticking = true; requestAnimationFrame(tuck); }
      }, { passive: true });
    });
  };

  // On the title page the words hang in place while the painting scrolls
  // up beneath them, fading out by the time the page is half gone. The
  // travel welcome does the same, and its painting fades away with it.
  function floatHeroText(root) {
    var hero = (root || document).querySelector(".page-hero, .page-intro");
    var text = hero && hero.querySelector(".hero-text, .intro-card");
    var art = hero && hero.querySelector(".intro-bg");
    if (!text) return;
    var ticking = false;
    function update() {
      ticking = false;
      var y = Math.max(0, -hero.getBoundingClientRect().top);
      var t = Math.min(1, y / (hero.offsetHeight * 0.55));
      text.style.transform = y ? "translate3d(0," + (y * 0.85).toFixed(1) + "px,0)" : "";
      text.style.opacity = (1 - t).toFixed(3);
      if (art) art.style.opacity = (1 - Math.min(1, y / (hero.offsetHeight * 0.8))).toFixed(3);
    }
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  // Scalloped cards: draw the whole scalloped outline as one SVG at the
  // card's exact size and use it as the card's mask. Repeating mask tiles
  // drift in Safari and cut off the scallops on the right and bottom.
  function fitScallops(el) {
    var d = 2 * (parseFloat(getComputedStyle(el).getPropertyValue("--r")) || 13);
    var w = el.offsetWidth, h = el.offsetHeight;
    if (!w || !h) return;
    var nx = Math.max(1, Math.round(w / d)), ny = Math.max(1, Math.round(h / d));
    var sx = w / nx, sy = h / ny, rad = Math.min(sx, sy) / 2;
    var c = "", i;
    function dot(x, y) { c += "M" + (x - rad).toFixed(2) + " " + y.toFixed(2) + "a" + rad.toFixed(2) + " " + rad.toFixed(2) + " 0 1 0 " + (2 * rad).toFixed(2) + " 0a" + rad.toFixed(2) + " " + rad.toFixed(2) + " 0 1 0 " + (-2 * rad).toFixed(2) + " 0"; }
    for (i = 0; i < nx; i++) { dot(sx * (i + 0.5), sy / 2); dot(sx * (i + 0.5), h - sy / 2); }
    for (i = 1; i < ny - 1; i++) { dot(sx / 2, sy * (i + 0.5)); dot(w - sx / 2, sy * (i + 0.5)); }
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + " " + h + '">' +
      '<rect x="' + (sx / 2).toFixed(2) + '" y="' + (sy / 2).toFixed(2) + '" width="' + (w - sx).toFixed(2) + '" height="' + (h - sy).toFixed(2) + '"/>' +
      '<path d="' + c + '"/></svg>';
    el.style.setProperty("--scallop", 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '")');
  }
  window.fitScallops = function () { document.querySelectorAll(".scallop").forEach(fitScallops); };
  if ("ResizeObserver" in window) {
    var ro = new ResizeObserver(function (entries) { entries.forEach(function (en) { fitScallops(en.target); }); });
    document.querySelectorAll(".scallop").forEach(function (el) { ro.observe(el); });
  } else {
    window.addEventListener("resize", window.fitScallops);
  }
  window.fitScallops();

  // The plane's banner, cut into strips that flap a beat apart (see styles.css).
  document.querySelectorAll(".plane-banner").forEach(function (b) {
    var n = 56, html = "";
    for (var i = 0; i < n; i++) {
      var d = n - 1 - i;                                // distance back from the tow rope
      html += '<span style="--i:' + i + ";--n:" + n + ";--d:" + d + ";--a:" + (0.4 + d * 4.4 / (n - 1)).toFixed(2) + '"></span>';
    }
    b.innerHTML = html;
  });

  // Moving between Save the date and Travel always starts at the top.
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  // jump straight there: the page's smooth scrolling would visibly race up
  window.jumpToTop = function () {
    var html = document.documentElement;
    html.style.scrollBehavior = "auto";
    window.scrollTo(0, 0);
    requestAnimationFrame(function () { html.style.scrollBehavior = ""; });
  };
  window.jumpToTop();
  window.addEventListener("pageshow", window.jumpToTop);

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
