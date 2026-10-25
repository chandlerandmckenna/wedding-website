/* "Have a gut feeling?" form: an early, non-binding answer before the
   formal invitation. Sends the reply to WEDDING.replyEndpoint if set. */
(function () {
  var W = window.WEDDING;
  var form = document.getElementById("reply-form");
  if (!form) return;

  var errorEl = document.getElementById("form-error");
  var confirmEl = document.getElementById("confirm");

  var RESPONSES = {
    yes: {
      label: "Absolutely, count me in!",
      title: "Amazing, see you in Sorrento!",
      text: "We're so happy. Keep an eye out for the formal invitation."
    },
    maybe: {
      label: "I still need some time to think.",
      title: "Of course, take your time",
      text: "Thanks for letting us know. The formal invitation will follow, and you can change your answer here any time."
    },
    no: {
      label: "Likely not, count me out.",
      title: "We'll miss you",
      text: "Thank you for telling us early. We'll raise a glass to you in Sorrento."
    }
  };

  function feeling() {
    var c = form.querySelector('input[name="feeling"]:checked');
    return c ? c.value : "";
  }

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
    if (!name) return fail("Please add your name.", form.name);
    if (!/^\S+@\S+\.\S+$/.test(email)) return fail("Please add an email address so we can send your invitation.", form.email);
    if (!feeling()) return fail("Please pick the answer closest to your gut feeling.", document.getElementById("feel-yes"));

    var reply = {
      name: name,
      email: email,
      feeling: feeling(),
      feelingLabel: RESPONSES[feeling()].label,
      message: form.message.value.trim(),
      submittedAt: new Date().toISOString()
    };

    var btn = document.getElementById("submit");
    btn.disabled = true;
    btn.textContent = "Sending…";

    send(reply).then(function (saved) {
      showConfirmation(reply, saved);
    }).catch(function () {
      fail("We couldn't send your answer. Please check your connection and try again.");
    }).then(function () {
      btn.disabled = false;
      btn.textContent = "Send";
    });
  });

  function send(reply) {
    if (!W.replyEndpoint) return Promise.resolve(false);
    return fetch(W.replyEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(reply)
    }).then(function (res) {
      if (!res.ok) throw new Error("Reply failed: " + res.status);
      return true;
    });
  }

  function showConfirmation(reply, saved) {
    var r = RESPONSES[reply.feeling];
    document.getElementById("confirm-title").textContent = r.title;
    document.getElementById("confirm-text").textContent = r.text;
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
})();
