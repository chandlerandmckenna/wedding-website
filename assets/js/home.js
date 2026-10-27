/* Home page: sign-in on the cover (phone, or email as a fallback), the
   cover fading into the title page, the "Have a gut feeling?" answer and the guest's
   mailing address. */
(function () {
  var cover = document.getElementById("cover");
  var book = document.getElementById("book");
  var signinForm = document.getElementById("signin-form");
  var nameForm = document.getElementById("name-form");
  var errorEl = document.getElementById("cover-error");
  var phoneMode = document.getElementById("phone-mode");
  var emailMode = document.getElementById("email-mode");
  var switchBtn = document.getElementById("switch-mode");
  var mode = "phone";
  var pendingId = null;

  document.getElementById("preview-note").hidden = !window.GuestAPI.preview;

  function showError(msg, field) {
    errorEl.textContent = msg;
    errorEl.hidden = false;
    if (field) field.focus();
  }

  function busy(btn, on, label) {
    btn.disabled = on;
    btn.textContent = on ? "One moment…" : label;
  }

  function isEmail(v) { return /^\S+@\S+\.\S+$/.test(v); }

  /* ---------- US phone formatting: 9259636950 shows as (925) 963-6950 ---------- */
  var phoneInput = document.getElementById("phone");

  // Digits only, dropping a leading US country code from pasted numbers.
  function usDigits(value) {
    var d = String(value).replace(/\D/g, "");
    if (d.length === 11 && d.charAt(0) === "1") d = d.slice(1);
    return d.slice(0, 10);
  }

  function formatUS(d) {
    if (!d) return "";
    if (d.length < 4) return "(" + d;
    if (d.length < 7) return "(" + d.slice(0, 3) + ") " + d.slice(3);
    return "(" + d.slice(0, 3) + ") " + d.slice(3, 6) + "-" + d.slice(6);
  }

  // Formats a phone field as it's typed, keeping the caret in place.
  function phoneField(el) {
    var lastDigits = "";
    el.addEventListener("input", function (e) {
      var caret = el.selectionStart == null ? el.value.length : el.selectionStart;
      var before = el.value.slice(0, caret).replace(/\D/g, "").length;
      var d = usDigits(el.value);
      // Backspacing over "(", ")", " " or "-" removes the digit before it.
      if (e.inputType === "deleteContentBackward" && d === lastDigits && before > 0) {
        d = d.slice(0, before - 1) + d.slice(before);
        before -= 1;
      }
      lastDigits = d;
      el.value = formatUS(d);
      // Put the caret back after the same number of digits.
      var pos = 0, seen = 0;
      while (pos < el.value.length && seen < before) {
        if (/\d/.test(el.value.charAt(pos))) seen++;
        pos++;
      }
      if (seen === d.length && pos < el.value.length && !/\d/.test(el.value.charAt(pos))) pos = el.value.length;
      try { el.setSelectionRange(pos, pos); } catch (err) { /* not focused */ }
    });
  }
  phoneField(phoneInput);

  /* ---------- Phone or email ---------- */
  function setMode(next) {
    mode = next;
    phoneMode.hidden = mode !== "phone";
    emailMode.hidden = mode !== "email";
    switchBtn.textContent = mode === "phone"
      ? "Number not working? Use your email instead"
      : "Use your phone number instead";
    errorEl.hidden = true;
    (mode === "phone" ? phoneInput : document.getElementById("signin-email")).focus();
  }
  switchBtn.addEventListener("click", function () { setMode(mode === "phone" ? "email" : "phone"); });

  signinForm.addEventListener("submit", function (e) {
    e.preventDefault();
    errorEl.hidden = true;
    var id, btn;
    if (mode === "phone") {
      var digits = usDigits(phoneInput.value);
      if (digits.length !== 10) return showError("Please enter your 10-digit phone number, area code first.", phoneInput);
      id = { phone: "1" + digits };
      btn = document.getElementById("phone-submit");
    } else {
      var emailInput = document.getElementById("signin-email");
      var email = emailInput.value.trim().toLowerCase();
      if (!isEmail(email)) return showError("Please enter a valid email address.", emailInput);
      id = { email: email };
      btn = document.getElementById("email-submit");
    }
    busy(btn, true);
    window.GuestAPI.lookup(id).then(function (guest) {
      if (guest) return signedIn(guest);
      pendingId = id;
      document.getElementById("guest-email-field").hidden = !!id.email;
      signinForm.hidden = true;
      nameForm.hidden = false;
      document.getElementById("guest-name").focus();
    }).catch(function () {
      showError("We couldn't reach the guest list. Please check your connection and try again.");
    }).then(function () { busy(btn, false, "Enter"); });
  });

  nameForm.addEventListener("submit", function (e) {
    e.preventDefault();
    errorEl.hidden = true;
    var name = document.getElementById("guest-name");
    var emailField = document.getElementById("guest-email");
    var email = pendingId.email || emailField.value.trim().toLowerCase();
    if (!name.value.trim()) return showError("Please add your name.", name);
    if (!isEmail(email)) return showError("Please add an email so we can send your invitation.", emailField);
    var guest = { phone: pendingId.phone || "", email: email, name: name.value.trim(), feeling: "" };
    var btn = document.getElementById("name-submit");
    busy(btn, true);
    window.GuestAPI.register(guest).then(function (saved) {
      signedIn(saved);
    }).catch(function () {
      showError("We couldn't save your details. Please try again.");
    }).then(function () { busy(btn, false, "Continue"); });
  });

  document.getElementById("start-over").addEventListener("click", function () {
    nameForm.hidden = true;
    signinForm.hidden = false;
    setMode(mode);
  });

  function signedIn(guest) {
    window.Guest.save(guest);
    openBook(true);
  }

  // The cover melts away, the painting fades in, then the title rises in
  // line by line.
  function openBook(animate) {
    var guest = window.Guest.current();
    window.renderHeader();
    window.renderSchedule();
    setupFeelings(guest);
    fillAddress(guest);
    book.hidden = false;
    var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      cover.hidden = true;
      window.setupPageFades(book);
      return;
    }
    // Coming from the header's gut-feeling pill on Travel: go straight there.
    if (!animate && location.hash === "#reply") {
      cover.hidden = true;
      window.setupPageFades(book);
      history.replaceState(null, "", location.pathname + location.search);
      // again once the page has loaded: fonts and the jump-to-top on load
      // can move things after the first try
      function go() { window.goToFeeling(false); }
      requestAnimationFrame(go);
      if (document.readyState === "complete") setTimeout(go, 150);
      else window.addEventListener("load", function () { setTimeout(go, 150); });
      return;
    }
    // Returning guests (back from Travel, or a new visit) skip the cover but
    // still see the painting fade in and the title rise in, as on day one.
    window.jumpToTop();
    book.classList.add("arriving", "waiting");
    // Start once the painting is ready to show (or after 1.5s regardless).
    var hero = book.querySelector(".hero-bg");
    var ready = function () { book.classList.remove("waiting"); };
    if (hero && !hero.complete) {
      hero.addEventListener("load", ready);
      hero.addEventListener("error", ready);
      setTimeout(ready, 1500);
    } else if (hero && hero.decode) {
      hero.decode().then(ready, ready);
    } else {
      ready();
    }
    if (animate) {
      cover.classList.add("opening");
      setTimeout(function () {
        cover.hidden = true;
        cover.classList.remove("opening");
        window.setupPageFades(book);
      }, 700);
    } else {
      cover.hidden = true;
      window.setupPageFades(book);
    }
    setTimeout(function () { book.classList.remove("arriving"); }, 6000);
  }

  /* ---------- Gut feeling: pick one, then send ---------- */
  var MESSAGES = {
    yes: "Evviva! We can't wait to celebrate with you.",
    maybe: "Of course, take your time. You can change your answer here whenever you like.",
    no: "We'll miss you, and we'll raise a glass to you in Sorrento."
  };
  var sendBtn = document.getElementById("feel-send");
  var statusEl = document.getElementById("feel-status");
  var template = document.querySelector(".feel-options");
  // One set of choices for a single guest; one per person for a household,
  // each under that person's name. { name, saved, selected, el } each.
  var people = [];

  function mark(p) {
    p.el.querySelectorAll(".feel").forEach(function (b) {
      b.setAttribute("aria-checked", b.getAttribute("data-feeling") === p.selected ? "true" : "false");
    });
    p.el.classList.toggle("has-choice", !!p.selected);
  }

  function changed() {
    return people.filter(function (p) { return p.selected && p.selected !== p.saved; });
  }

  function refreshSend() {
    var our = people.length > 1;
    var anySaved = people.some(function (p) { return p.saved; });
    var anySelected = people.some(function (p) { return p.selected; });
    sendBtn.disabled = !changed().length;
    sendBtn.textContent =
      !anySelected ? (our ? "Send our answers" : "Send my answer") :
      !changed().length ? (our ? "Answers sent" : "Answer sent") :
      anySaved ? (our ? "Update our answers" : "Update my answer") : (our ? "Send our answers" : "Send my answer");
  }

  // The thank-you under the button: the usual one when everyone gave the
  // same answer, a general one when they differ.
  function thanks() {
    var given = people.map(function (p) { return p.saved; }).filter(Boolean);
    if (!given.length) return "";
    var same = given.every(function (f) { return f === given[0]; });
    return same ? MESSAGES[given[0]] : "Grazie! We have everyone's answers. You can change them here whenever you like.";
  }

  function setupFeelings(guest) {
    var first = window.firstName(guest);
    document.getElementById("feel-hello").textContent = "Ciao, " + first + "!";
    var panel = template.parentNode;
    panel.querySelectorAll(".feel-person").forEach(function (el) { el.remove(); });
    var home = window.householdOf(guest);
    if (!home) {
      template.hidden = false;
      people = [{ name: guest.name, saved: guest.feeling || "", el: template }];
    } else {
      template.hidden = true;
      people = home.map(function (m, i) {
        var el = document.createElement("div");
        el.className = "feel-person";
        var label = String(m.name).split(" ")[0];
        el.innerHTML = '<p class="feel-who" id="feel-who-' + i + '">' + window.esc(label) + "</p>";
        var options = template.cloneNode(true);
        options.hidden = false;
        options.setAttribute("aria-labelledby", "feel-who-" + i);
        options.removeAttribute("aria-label");
        el.appendChild(options);
        panel.insertBefore(el, sendBtn);
        return { name: m.name, saved: m.feeling || "", el: options };
      });
    }
    people.forEach(function (p) {
      p.selected = p.saved;
      mark(p);
      p.el.querySelectorAll(".feel").forEach(function (btn) {
        btn.onclick = function () {
          p.selected = btn.getAttribute("data-feeling");
          mark(p);
          statusEl.textContent = "";
          refreshSend();
        };
      });
    });
    statusEl.textContent = thanks();
    refreshSend();
  }

  sendBtn.addEventListener("click", function () {
    var guest = window.Guest.current();
    var answers = changed().map(function (p) { return { name: p.name, feeling: p.selected }; });
    if (!guest || !answers.length) return;
    sendBtn.disabled = true;
    sendBtn.textContent = "Sending…";
    window.GuestAPI.reply(guest, answers).then(function () {
      window.applyAnswers(guest, answers, "feeling");
      window.Guest.save(guest);
      window.renderHeader();   // the header pill now shows their answer
      changed().forEach(function (p) { p.saved = p.selected; });
      statusEl.textContent = thanks();
      refreshSend();
    }).catch(function () {
      statusEl.textContent = "We couldn't send that. Please try again.";
      refreshSend();
    });
  });

  /* ---------- A better address for the invitation ---------- */
  var addressForm = document.getElementById("address-form");
  var addressStatus = document.getElementById("address-status");
  var ADDRESS_FIELDS = ["line1", "line2", "city", "state", "zip", "country"];

  // the state is a two-letter code, kept in capitals as it is typed
  addressForm.elements.state.addEventListener("input", function () {
    var v = this.value.replace(/[^a-z]/gi, "").slice(0, 2).toUpperCase();
    if (v !== this.value) this.value = v;
  });

  phoneField(addressForm.elements.phone);
  var emailField = document.getElementById("addr-email").parentNode;
  var phoneFieldEl = document.getElementById("addr-phone").parentNode;
  // [{ name, email, phone }] inputs, one for each person on the postcard
  var contactInputs = [];

  // A household gets an email and a mobile number line for each person,
  // labelled with their first name; a single guest keeps the plain two.
  function contactFields(guest) {
    addressForm.querySelectorAll(".pc-person").forEach(function (el) { el.remove(); });
    var home = window.householdOf(guest);
    emailField.hidden = phoneFieldEl.hidden = !!home;
    if (!home) {
      contactInputs = [{ name: guest.name, email: addressForm.elements.email, phone: addressForm.elements.phone, me: guest }];
      return;
    }
    contactInputs = home.map(function (m, i) {
      var first = window.esc(String(m.name).split(" ")[0]);
      var email = document.createElement("div");
      email.className = "field span-2 pc-person" + (i ? " pc-next" : "");
      email.innerHTML = '<label for="addr-email-' + i + '">' + first + "\u2019s email</label>" +
        '<input type="email" id="addr-email-' + i + '" autocomplete="' + (m.me ? "email" : "off") + '" autocapitalize="none" spellcheck="false" placeholder="' + (i ? "them" : "you") + '@example.com">';
      var phone = document.createElement("div");
      phone.className = email.className;
      phone.innerHTML = '<label for="addr-phone-' + i + '">' + first + "\u2019s mobile number</label>" +
        '<input type="tel" id="addr-phone-' + i + '" inputmode="tel" autocomplete="' + (m.me ? "tel-national" : "off") + '" placeholder="(555) 123-4567">';
      phoneFieldEl.parentNode.appendChild(email);
      phoneFieldEl.parentNode.appendChild(phone);
      var row = { name: m.name, email: email.querySelector("input"), phone: phone.querySelector("input"), me: m };
      phoneField(row.phone);
      return row;
    });
  }

  function fillAddress(guest) {
    var a = guest.address || {};
    ADDRESS_FIELDS.forEach(function (k) {
      var el = addressForm.elements[k];
      if (a[k]) el.value = a[k];
    });
    contactFields(guest);
    contactInputs.forEach(function (c) {
      if (c.me.email) c.email.value = c.me.email;
      if (c.me.phone) c.phone.value = formatUS(usDigits(c.me.phone));
    });
    addressStatus.textContent = guest.address ? "We have your address. Update it here any time." : "";
  }

  addressForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var a = {};
    ADDRESS_FIELDS.forEach(function (k) { a[k] = addressForm.elements[k].value.trim(); });
    var contacts = contactInputs.map(function (c) {
      return { name: c.name, email: c.email.value.trim().toLowerCase(), phone: usDigits(c.phone.value), inputs: c };
    });
    // The address can be left for later if they only want to leave an email or phone.
    var started = ["line1", "line2", "city", "state", "zip"].some(function (k) { return a[k]; });
    var missing = ["line1", "city", "country"].filter(function (k) { return !a[k]; })[0];
    var badEmail = contacts.filter(function (c) { return c.email && !isEmail(c.email); })[0];
    var badPhone = contacts.filter(function (c) { return c.phone && c.phone.length !== 10; })[0];
    var any = contacts.some(function (c) { return c.email || c.phone; });
    var problem =
      started && missing ? missing :
      badEmail ? "email" :
      badPhone ? "phone" :
      !started && !any ? "line1" : "";
    if (problem) {
      addressStatus.textContent = {
        line1: "Please add your street address.", city: "Please add your city.", country: "Please add your country.",
        email: "Please check the email address.", phone: "Please enter a 10-digit phone number, area code first."
      }[problem];
      (problem === "email" ? badEmail.inputs.email : problem === "phone" ? badPhone.inputs.phone : addressForm.elements[problem]).focus();
      return;
    }
    contacts = contacts.map(function (c) {
      return { name: c.name, email: c.email, phone: c.phone ? "1" + c.phone : "" };
    });
    var guest = window.Guest.current();
    var btn = document.getElementById("address-send");
    busy(btn, true);
    window.GuestAPI.address(guest, started ? a : null, contacts).then(function () {
      if (started) guest.address = a;
      window.applyAnswers(guest, contacts, "email");
      window.applyAnswers(guest, contacts, "phone");
      window.Guest.save(guest);
      addressStatus.textContent = started ? "Grazie! Your invitation will be sent there." : "Grazie! We'll be in touch.";
    }).catch(function () {
      addressStatus.textContent = "We couldn't save that. Please try again.";
    }).then(function () { busy(btn, false, "Save my details"); });
  });

  /* ---------- Notes for the couple ---------- */
  var notesForm = document.getElementById("notes-form");
  var noteText = document.getElementById("note-text");
  var noteStatus = document.getElementById("note-status");
  var noteKind = "";
  notesForm.querySelectorAll(".note-kinds button").forEach(function (b) {
    b.addEventListener("click", function () {
      var on = b.getAttribute("aria-pressed") !== "true";
      notesForm.querySelectorAll(".note-kinds button").forEach(function (o) { o.setAttribute("aria-pressed", "false"); });
      b.setAttribute("aria-pressed", String(on));
      noteKind = on ? b.dataset.kind : "";
      noteText.placeholder = on ? b.dataset.hint : "Write anything you like…";
      noteText.focus();
    });
  });
  notesForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var text = noteText.value.trim();
    if (!text) { noteStatus.textContent = "Write a little something first."; noteText.focus(); return; }
    var btn = document.getElementById("note-send");
    busy(btn, true);
    window.GuestAPI.note(window.Guest.current(), noteKind, text).then(function () {
      noteText.value = "";
      noteStatus.textContent = "Grazie mille! We can't wait to read it. Leave another any time.";
    }).catch(function () {
      noteStatus.textContent = "We couldn't send that. Please try again.";
    }).then(function () { busy(btn, false, "Send my note"); });
  });

  // Coming back with the browser's Back button restores a frozen page; load
  // it fresh instead so the title page plays its opening again.
  /* ---------- Venue photos: tap one to see it big, tap again to close ---------- */
  (function () {
    var photos = Array.prototype.slice.call(document.querySelectorAll(".gallery img"));
    if (!photos.length) return;
    var box = document.createElement("div");
    box.className = "lightbox";
    box.hidden = true;
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    box.setAttribute("aria-label", "Photo");
    box.innerHTML = '<figure class="lightbox-frame"><img alt=""></figure>' +
      '<button type="button" class="lightbox-close" aria-label="Close">&times;</button>';
    document.body.appendChild(box);
    var big = box.querySelector("img");
    var opener = null;

    function open(img) {
      opener = img;
      big.src = img.currentSrc || img.src;
      big.alt = img.alt;
      box.hidden = false;
      document.documentElement.classList.add("lightbox-open");
      requestAnimationFrame(function () { box.classList.add("shown"); });
      box.querySelector(".lightbox-close").focus({ preventScroll: true });
    }
    function close() {
      if (box.hidden) return;
      box.classList.remove("shown");
      document.documentElement.classList.remove("lightbox-open");
      setTimeout(function () { box.hidden = true; }, 250);
      if (opener) opener.focus({ preventScroll: true });
    }

    photos.forEach(function (img) {
      img.tabIndex = 0;
      img.setAttribute("role", "button");
      img.addEventListener("click", function () { open(img); });
      // Phones: open on the tap itself rather than waiting for a click,
      // which some iPhone browsers never send for a photo.
      var start = null;
      img.addEventListener("touchstart", function (e) {
        var t = e.touches[0];
        start = e.touches.length === 1 ? { x: t.clientX, y: t.clientY, at: Date.now() } : null;
      }, { passive: true });
      img.addEventListener("touchend", function (e) {
        var t = e.changedTouches[0];
        if (!start || Math.abs(t.clientX - start.x) > 10 || Math.abs(t.clientY - start.y) > 10 || Date.now() - start.at > 600) return;
        start = null;
        e.preventDefault();   // no follow-up click, which would land on the open photo and close it
        open(img);
      });
      img.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(img); }
      });
    });
    box.addEventListener("click", close);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
  })();

  window.addEventListener("pageshow", function (e) { if (e.persisted) location.reload(); });

  // Returning guests skip the cover.
  if (window.Guest.current()) openBook(false);
})();
