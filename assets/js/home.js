/* Home page: sign-in on the cover (phone, or email as a fallback), the
   cover fading away, the "Have a gut feeling?" answer and the guest's
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

  var lastDigits = "";
  phoneInput.addEventListener("input", function (e) {
    var el = phoneInput;
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
    window.GuestAPI.register(guest).then(function () {
      signedIn(guest);
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

  // The cover fades away, then the title page fades in line by line.
  function openBook(animate) {
    var guest = window.Guest.current();
    window.renderHeader();
    window.renderSchedule();
    setupFeelings(guest);
    fillAddress(guest);
    book.hidden = false;
    var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!animate || reduce) {
      cover.hidden = true;
      window.setupPageFades(book);
      return;
    }
    window.scrollTo(0, 0);
    book.classList.add("arriving");
    cover.classList.add("opening");
    setTimeout(function () {
      cover.hidden = true;
      cover.classList.remove("opening");
      window.setupPageFades(book);
    }, 900);
    setTimeout(function () { book.classList.remove("arriving"); }, 2800);
  }

  /* ---------- Gut feeling: pick one, then send ---------- */
  var MESSAGES = {
    yes: "Evviva! We can't wait to celebrate with you.",
    maybe: "Of course, take your time. You can change your answer here whenever you like.",
    no: "We'll miss you, and we'll raise a glass to you in Sorrento."
  };
  var sendBtn = document.getElementById("feel-send");
  var statusEl = document.getElementById("feel-status");
  var selected = "";
  var saved = "";

  function mark(value) {
    document.querySelectorAll(".feel").forEach(function (b) {
      b.setAttribute("aria-checked", b.getAttribute("data-feeling") === value ? "true" : "false");
    });
    document.querySelector(".feel-options").classList.toggle("has-choice", !!value);
  }

  function refreshSend() {
    if (!selected) {
      sendBtn.disabled = true;
      sendBtn.textContent = "Send my answer";
    } else if (selected === saved) {
      sendBtn.disabled = true;
      sendBtn.textContent = "Answer sent";
    } else {
      sendBtn.disabled = false;
      sendBtn.textContent = saved ? "Update my answer" : "Send my answer";
    }
  }

  function setupFeelings(guest) {
    var first = guest.name.split(/[ &]/)[0];
    document.getElementById("feel-hello").textContent = "Ciao, " + first + "!";
    saved = selected = guest.feeling || "";
    mark(selected);
    statusEl.textContent = saved ? MESSAGES[saved] : "";
    refreshSend();
  }

  document.querySelectorAll(".feel").forEach(function (btn) {
    btn.addEventListener("click", function () {
      selected = btn.getAttribute("data-feeling");
      mark(selected);
      statusEl.textContent = "";
      refreshSend();
    });
  });

  sendBtn.addEventListener("click", function () {
    var guest = window.Guest.current();
    if (!guest || !selected) return;
    var value = selected;
    sendBtn.disabled = true;
    sendBtn.textContent = "Sending…";
    window.GuestAPI.reply(guest, value).then(function () {
      guest.feeling = value;
      window.Guest.save(guest);
      saved = value;
      statusEl.textContent = MESSAGES[value];
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

  function fillAddress(guest) {
    var a = guest.address || {};
    ADDRESS_FIELDS.forEach(function (k) {
      var el = addressForm.elements[k];
      if (a[k]) el.value = a[k];
    });
    addressStatus.textContent = guest.address ? "We have your address. Update it here any time." : "";
  }

  addressForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var a = {};
    ADDRESS_FIELDS.forEach(function (k) { a[k] = addressForm.elements[k].value.trim(); });
    var missing = ["line1", "city", "country"].filter(function (k) { return !a[k]; })[0];
    if (missing) {
      addressStatus.textContent = "Please add your " + { line1: "street address", city: "city", country: "country" }[missing] + ".";
      addressForm.elements[missing].focus();
      return;
    }
    var guest = window.Guest.current();
    var btn = document.getElementById("address-send");
    busy(btn, true);
    window.GuestAPI.address(guest, a).then(function () {
      guest.address = a;
      window.Guest.save(guest);
      addressStatus.textContent = "Grazie! Your invitation will be sent there.";
    }).catch(function () {
      addressStatus.textContent = "We couldn't save that. Please try again.";
    }).then(function () { busy(btn, false, "Save my address"); });
  });

  // Returning guests skip the cover.
  if (window.Guest.current()) openBook(false);
})();
