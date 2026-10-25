/* Home page: phone sign-in on the cover, the cover opening like a book,
   and the "Have a gut feeling?" buttons. */
(function () {
  var cover = document.getElementById("cover");
  var book = document.getElementById("book");
  var phoneForm = document.getElementById("phone-form");
  var nameForm = document.getElementById("name-form");
  var errorEl = document.getElementById("cover-error");
  var pendingPhone = null;

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

  phoneForm.addEventListener("submit", function (e) {
    e.preventDefault();
    errorEl.hidden = true;
    var input = document.getElementById("phone");
    var digits = usDigits(input.value);
    if (digits.length !== 10) {
      return showError("Please enter your 10-digit phone number, area code first.", input);
    }
    var phone = "1" + digits;
    var btn = document.getElementById("phone-submit");
    busy(btn, true);
    window.GuestAPI.lookup(phone).then(function (guest) {
      if (guest) return signedIn(guest);
      pendingPhone = phone;
      phoneForm.hidden = true;
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
    var email = document.getElementById("guest-email");
    if (!name.value.trim()) return showError("Please add your name.", name);
    if (!/^\S+@\S+\.\S+$/.test(email.value.trim())) return showError("Please add an email so we can send your invitation.", email);
    var guest = { phone: pendingPhone, name: name.value.trim(), email: email.value.trim(), feeling: "" };
    var btn = document.getElementById("name-submit");
    busy(btn, true);
    window.GuestAPI.register(guest).then(function () {
      signedIn(guest);
    }).catch(function () {
      showError("We couldn't save your details. Please try again.");
    }).then(function () { busy(btn, false, "Continue"); });
  });

  document.getElementById("change-number").addEventListener("click", function () {
    nameForm.hidden = true;
    phoneForm.hidden = false;
    errorEl.hidden = true;
    document.getElementById("phone").focus();
  });

  function signedIn(guest) {
    window.Guest.save(guest);
    openBook(true);
  }

  // The cover swings open from its left edge, then the book underneath shows.
  function openBook(animate) {
    var guest = window.Guest.current();
    window.renderHeader();
    window.renderSchedule();
    setupFeelings(guest);
    book.hidden = false;
    var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!animate || reduce) {
      cover.hidden = true;
      window.setupPageTurns(book);
      return;
    }
    window.scrollTo(0, 0);
    cover.classList.add("opening");
    setTimeout(function () {
      cover.hidden = true;
      cover.classList.remove("opening");
      window.setupPageTurns(book);
    }, 1100);
  }

  /* ---------- Gut feeling ---------- */
  var MESSAGES = {
    yes: "Evviva! We can't wait to celebrate with you.",
    maybe: "Of course, take your time. You can change your answer here whenever you like.",
    no: "We'll miss you, and we'll raise a glass to you in Sorrento."
  };

  function setupFeelings(guest) {
    var first = guest.name.split(/[ &]/)[0];
    document.getElementById("feel-hello").textContent = "Ciao, " + first + "!";
    mark(guest.feeling);
    if (guest.feeling) document.getElementById("feel-status").textContent = MESSAGES[guest.feeling];
  }

  function mark(value) {
    document.querySelectorAll(".feel").forEach(function (b) {
      b.setAttribute("aria-checked", b.getAttribute("data-feeling") === value ? "true" : "false");
    });
    document.querySelector(".feel-options").classList.toggle("has-choice", !!value);
  }

  document.querySelectorAll(".feel").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var guest = window.Guest.current();
      if (!guest) return;
      var value = btn.getAttribute("data-feeling");
      var previous = guest.feeling;
      var status = document.getElementById("feel-status");
      mark(value);
      status.textContent = "Saving…";
      window.GuestAPI.reply(guest.phone, value).then(function () {
        guest.feeling = value;
        window.Guest.save(guest);
        status.textContent = MESSAGES[value];
      }).catch(function () {
        mark(previous);
        status.textContent = "We couldn't save that. Please try again.";
      });
    });
  });

  // Returning guests skip the cover.
  if (window.Guest.current()) openBook(false);
})();
