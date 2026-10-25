/* RSVP form: shows extra questions for guests who accept, builds one
   card per guest, and sends the reply to WEDDING.rsvpEndpoint if set. */
(function () {
  var W = window.WEDDING;
  var form = document.getElementById("rsvp-form");
  if (!form) return;

  var attendingFields = document.getElementById("attending-fields");
  var partySize = document.getElementById("party-size");
  var guestsEl = document.getElementById("guests");
  var errorEl = document.getElementById("form-error");
  var confirmEl = document.getElementById("confirm");

  var MEALS = ["Fish", "Meat", "Vegetarian"];
  var EVENT_NAMES = {
    welcome: "Welcome aperitivo",
    boat: "Day on the water",
    wedding: "Wedding ceremony & reception",
    brunch: "Farewell brunch"
  };

  function guestCard(i, saved) {
    var n = i + 1;
    var meals = MEALS.map(function (m) {
      var sel = saved.meal === m ? " selected" : "";
      return "<option" + sel + ">" + m + "</option>";
    }).join("");
    var nameField = i === 0
      ? '<p class="hint">You (name from above)</p>'
      : '<div class="field"><label for="guest-' + n + '-name">Name</label>' +
        '<input type="text" id="guest-' + n + '-name" value="' + (saved.name || "").replace(/"/g, "&quot;") + '"></div>';
    return '<div class="guest" data-guest="' + n + '">' +
      "<h3>Guest " + n + "</h3>" + nameField +
      '<div class="field-row">' +
      '<div class="field"><label for="guest-' + n + '-meal">Dinner choice</label>' +
      '<select id="guest-' + n + '-meal"><option value="">Choose one</option>' + meals + "</select></div>" +
      '<div class="field"><label for="guest-' + n + '-diet">Allergies or dietary needs</label>' +
      '<input type="text" id="guest-' + n + '-diet" value="' + (saved.diet || "").replace(/"/g, "&quot;") + '"></div>' +
      "</div></div>";
  }

  function readGuests() {
    return Array.prototype.map.call(guestsEl.querySelectorAll(".guest"), function (g) {
      var n = g.getAttribute("data-guest");
      var nameInput = document.getElementById("guest-" + n + "-name");
      return {
        name: nameInput ? nameInput.value.trim() : form.name.value.trim(),
        meal: document.getElementById("guest-" + n + "-meal").value,
        diet: document.getElementById("guest-" + n + "-diet").value.trim()
      };
    });
  }

  function renderGuests() {
    var saved = readGuests();
    var count = parseInt(partySize.value, 10);
    var html = "";
    for (var i = 0; i < count; i++) html += guestCard(i, saved[i] || {});
    guestsEl.innerHTML = html;
  }

  function attending() {
    var c = form.querySelector('input[name="attending"]:checked');
    return c ? c.value : "";
  }

  form.addEventListener("change", function (e) {
    if (e.target.name === "attending") attendingFields.hidden = attending() !== "yes";
    if (e.target === partySize) renderGuests();
  });

  function fail(msg, field) {
    errorEl.textContent = msg;
    errorEl.hidden = false;
    if (field) field.focus();
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    errorEl.hidden = true;
    var name = form.name.value.trim();
    var email = form.email.value.trim();
    if (!name) return fail("Please add your full name.", form.name);
    if (!/^\S+@\S+\.\S+$/.test(email)) return fail("Please add an email address so we can send updates.", form.email);
    if (!attending()) return fail("Please let us know whether you can come.", document.getElementById("attend-yes"));

    var reply = {
      name: name,
      email: email,
      attending: attending() === "yes",
      message: form.message.value.trim(),
      submittedAt: new Date().toISOString()
    };

    if (reply.attending) {
      reply.guests = readGuests();
      var missing = reply.guests.findIndex(function (g) { return !g.name || !g.meal; });
      if (missing > -1) {
        var n = missing + 1;
        var target = document.getElementById(reply.guests[missing].name ? "guest-" + n + "-meal" : "guest-" + n + "-name");
        return fail("Please add a name and dinner choice for guest " + n + ".", target);
      }
      reply.events = Array.prototype.map.call(form.querySelectorAll('input[name="events"]:checked'), function (c) { return c.value; });
      if (!reply.events.length) return fail("Please pick at least one event.", document.getElementById("ev-wedding"));
      reply.arrival = form.arrival.value;
      reply.staying = form.staying.value;
      reply.song = form.song.value.trim();
    }

    var btn = document.getElementById("submit");
    btn.disabled = true;
    btn.textContent = "Sending…";

    send(reply).then(function (saved) {
      showConfirmation(reply, saved);
    }).catch(function () {
      fail("We couldn't send your RSVP. Please check your connection and try again.");
    }).then(function () {
      btn.disabled = false;
      btn.textContent = "Send RSVP";
    });
  });

  function send(reply) {
    if (!W.rsvpEndpoint) return Promise.resolve(false);
    return fetch(W.rsvpEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(reply)
    }).then(function (res) {
      if (!res.ok) throw new Error("RSVP failed: " + res.status);
      return true;
    });
  }

  function li(text) {
    var el = document.createElement("li");
    el.textContent = text;
    return el;
  }

  function showConfirmation(reply, saved) {
    var title = document.getElementById("confirm-title");
    var text = document.getElementById("confirm-text");
    var list = document.getElementById("confirm-list");
    list.innerHTML = "";
    if (reply.attending) {
      title.textContent = "Grazie, " + reply.name.split(" ")[0] + "!";
      text.textContent = "We can't wait to see you in " + W.town + ". Here's what we have:";
      reply.guests.forEach(function (g) {
        list.appendChild(li(g.name + ": " + g.meal + (g.diet ? " (" + g.diet + ")" : "")));
      });
      list.appendChild(li("Events: " + reply.events.map(function (k) { return EVENT_NAMES[k]; }).join(", ")));
    } else {
      title.textContent = "We'll miss you";
      text.textContent = "Thank you for letting us know, " + reply.name.split(" ")[0] + ". We'll raise a glass to you in " + W.town + ".";
    }
    document.getElementById("confirm-draft").hidden = saved;
    form.hidden = true;
    confirmEl.hidden = false;
    confirmEl.focus();
  }

  document.getElementById("edit-reply").addEventListener("click", function () {
    confirmEl.hidden = true;
    form.hidden = false;
    form.name.focus();
  });

  renderGuests();
})();
