/* Hand-painted art shared by every page, in the style of an illustrated
   postcard: loose ink lines over watercolor fills. The Sorrento scene is
   drawn from code with a fixed seed, so it looks the same on every visit.
   Injected once so pages can <use> the symbols. */
(function () {
  // Small seeded random generator so the town is identical every time.
  var seed = 20271001;
  function rand() {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  function pick(list) { return list[Math.floor(rand() * list.length)]; }
  function r(n) { return Math.round(n * 10) / 10; }

  var INK = "#5a4130";
  var WALLS = ["#f7ead2", "#f4d9a6", "#fbf3e4", "#f1c9a4", "#f3df96", "#ecbf9a", "#f8e6c4"];
  var ROOF = "#d9774a";

  // Hill line: where the town meets the sky, from the sea up to the right.
  function hillY(x) { return 150 + 190 * Math.pow(Math.max(0, 1 - (x - 250) / 560), 2); }

  function house(x, y, w, h) {
    var fill = "", ink = "";
    var wall = pick(WALLS);
    fill += '<rect x="' + r(x) + '" y="' + r(y - h) + '" width="' + r(w) + '" height="' + r(h) + '" fill="' + wall + '"/>';
    ink += '<rect x="' + r(x) + '" y="' + r(y - h) + '" width="' + r(w) + '" height="' + r(h) + '"/>';
    var roll = rand();
    if (roll < 0.06) {
      // a majolica church dome, yellow and green like the Amalfi duomos
      var cx = x + w / 2, rr = Math.min(w, 34) / 2;
      fill += '<path d="M' + r(cx - rr) + ' ' + r(y - h) + 'A' + r(rr) + ' ' + r(rr * 1.1) + ' 0 0 1 ' + r(cx + rr) + ' ' + r(y - h) + 'Z" fill="#f0c43c"/>';
      ink += '<path d="M' + r(cx - rr) + ' ' + r(y - h) + 'A' + r(rr) + ' ' + r(rr * 1.1) + ' 0 0 1 ' + r(cx + rr) + ' ' + r(y - h) + 'M' + r(cx) + ' ' + r(y - h - rr * 1.1) + 'v-6"/>';
      fill += '<path d="M' + r(cx - rr * 0.5) + ' ' + r(y - h - 2) + 'Q' + r(cx) + ' ' + r(y - h - rr * 1.6) + ' ' + r(cx + rr * 0.5) + ' ' + r(y - h - 2) + '" fill="none" stroke="#5b8a3c" stroke-width="2"/>';
    } else if (roll < 0.55) {
      // flat terrace roof with a terracotta parapet
      fill += '<rect x="' + r(x - 1) + '" y="' + r(y - h - 4) + '" width="' + r(w + 2) + '" height="5" fill="' + ROOF + '"/>';
      if (rand() < 0.4) fill += '<rect x="' + r(x + w * 0.2) + '" y="' + r(y - h - 9) + '" width="' + r(w * 0.6) + '" height="5" fill="#8aa94a"/>';
    } else {
      // pitched terracotta roof
      fill += '<path d="M' + r(x - 3) + ' ' + r(y - h) + 'L' + r(x + w / 2) + ' ' + r(y - h - 10) + 'L' + r(x + w + 3) + ' ' + r(y - h) + 'Z" fill="' + ROOF + '"/>';
      ink += '<path d="M' + r(x - 3) + ' ' + r(y - h) + 'L' + r(x + w / 2) + ' ' + r(y - h - 10) + 'L' + r(x + w + 3) + ' ' + r(y - h) + '"/>';
    }
    // windows
    var cols = Math.max(1, Math.floor(w / 14)), rows = Math.max(1, Math.floor(h / 16));
    for (var i = 0; i < cols; i++) {
      for (var j = 0; j < rows; j++) {
        if (rand() < 0.3) continue;
        var wx = x + (w / cols) * (i + 0.5) - 2.5, wy = y - h + 6 + j * 15;
        if (rand() < 0.3) {
          ink += '<path d="M' + r(wx) + ' ' + r(wy + 8) + 'v-5a2.5 2.5 0 0 1 5 0v5"/>';
        } else {
          fill += '<rect x="' + r(wx) + '" y="' + r(wy) + '" width="5" height="7" fill="#7d6450" fill-opacity=".75"/>';
        }
      }
    }
    return { fill: fill, ink: ink };
  }

  function tree(x, y, s) {
    var fill = "";
    var greens = ["#8aa94a", "#a9c25a", "#6f9a45", "#c3d36d"];
    if (rand() < 0.25) {
      fill += '<ellipse cx="' + r(x) + '" cy="' + r(y - 16 * s) + '" rx="' + r(4 * s) + '" ry="' + r(17 * s) + '" fill="#4f7a3a"/>';
    } else {
      for (var k = 0; k < 4; k++) {
        fill += '<circle cx="' + r(x + (rand() - 0.5) * 16 * s) + '" cy="' + r(y - 6 * s - rand() * 10 * s) + '" r="' + r((6 + rand() * 6) * s) + '" fill="' + pick(greens) + '"/>';
      }
      // a lemon tree now and then
      if (rand() < 0.45) {
        for (var l = 0; l < 4; l++) {
          fill += '<ellipse cx="' + r(x + (rand() - 0.5) * 18 * s) + '" cy="' + r(y - 4 * s - rand() * 14 * s) + '" rx="' + r(2.4 * s) + '" ry="' + r(1.8 * s) + '" fill="#f4cf3a"/>';
        }
      }
    }
    return fill;
  }

  function scene() {
    var fill = "", ink = "";
    // sky, sea and hillside
    fill += '<rect width="800" height="440" fill="url(#skyG)"/>';
    fill += '<path d="M0 175 H800 V440 H0Z" fill="#79b4de"/>';
    fill += '<path d="M0 230 H380 M0 280 H360 M20 330 H330" stroke="#a9d0ec" stroke-width="2.4" fill="none"/>';
    fill += '<path d="M230 440 C270 330 330 250 420 205 C520 160 650 135 800 125 V440Z" fill="#dfe6a8"/>';
    // the town, back rows first
    for (var row = 0; row < 10; row++) {
      var baseY = 160 + row * 30;
      var x = 800 - 20 * rand();
      while (x > 0) {
        var w = 26 + rand() * 30, h = 22 + rand() * 26;
        x -= w + 2 + rand() * 10;
        if (baseY - h < hillY(x + w / 2) - 4 || x < 330 - row * 14) continue;
        if (rand() < 0.2) { fill += tree(x + w / 2, baseY, 1 + rand() * 0.4); continue; }
        var hs = house(x, baseY + rand() * 6, w, h);
        fill += hs.fill + '<g fill="none" stroke="' + INK + '" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round" stroke-opacity=".85">' + hs.ink + '</g>';
      }
    }
    // the coast road
    fill += '<path d="M-10 420 C120 380 260 392 420 440" stroke="#f6ead3" stroke-width="44" fill="none"/>';
    // foreground greenery
    for (var t = 0; t < 7; t++) fill += tree(360 + t * 70 + rand() * 30, 440 - rand() * 10, 1.8);
    return '<g filter="url(#paint)">' + fill + '</g>';
  }

  // A red vintage convertible, as on the postcard.
  var carBody = "M6 52 C8 42 20 38 36 38 L64 38 L70 27 L74 27 L72 38 L120 38 C138 38 150 44 152 53 L152 60 H6Z";
  var car =
    '<g filter="url(#paint)">' +
      // the couple, arms up
      '<path d="M84 38 L78 14 M96 38 L104 14" stroke="#e9b98f" stroke-width="3" stroke-linecap="round"/>' +
      '<circle cx="86" cy="30" r="6" fill="#3b2f2a"/><circle cx="100" cy="30" r="6" fill="#3b2f2a"/>' +
      '<rect x="81" y="35" width="10" height="5" fill="#f7efe0"/><rect x="95" y="35" width="10" height="5" fill="#2b2b33"/>' +
      '<path d="' + carBody + '" fill="#d8433b"/>' +
      '<path d="M70 27 L74 27 L72 38 L66 38Z" fill="#cfe6f5"/>' +
      '<circle cx="34" cy="62" r="12" fill="#3b2f2a"/><circle cx="122" cy="62" r="12" fill="#3b2f2a"/>' +
      '<circle cx="34" cy="62" r="5" fill="#e8e1d4"/><circle cx="122" cy="62" r="5" fill="#e8e1d4"/>' +
      '<rect x="145" y="46" width="7" height="6" fill="#f3df96"/>' +
      '<g fill="none" stroke="' + INK + '" stroke-width="1.2" stroke-linecap="round">' +
        '<path d="' + carBody + '"/><path d="M22 48 H142 M112 40 V58"/>' +
        '<circle cx="34" cy="62" r="12"/><circle cx="122" cy="62" r="12"/>' +
      '</g>' +
    '</g>';

  // A little biplane towing a banner. The banner text is set in the page.
  var plane =
    '<g filter="url(#paint)">' +
      '<path d="M4 20 C10 12 40 12 52 16 L60 20 L52 24 C40 28 10 28 4 20Z" fill="#d8433b"/>' +
      '<path d="M22 6 H40 L36 34 H20Z" fill="#e8655c"/>' +
      '<path d="M0 12 L8 16 L8 24 L0 28Z" fill="#d8433b"/>' +
      '<g fill="none" stroke="' + INK + '" stroke-width="1.1" stroke-linecap="round">' +
        '<path d="M4 20 C10 12 40 12 52 16 L60 20 L52 24 C40 28 10 28 4 20Z M22 6 H40 L36 34 H20Z M60 14 V26"/>' +
      '</g>' +
    '</g>';

  var svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>' +
    '<filter id="paint" x="-5%" y="-5%" width="110%" height="110%" color-interpolation-filters="sRGB">' +
      '<feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" seed="4" result="n"/>' +
      '<feDisplacementMap in="SourceGraphic" in2="n" scale="5" xChannelSelector="R" yChannelSelector="G" result="d"/>' +
      '<feGaussianBlur in="d" stdDeviation="0.5" result="b"/>' +
      '<feTurbulence type="fractalNoise" baseFrequency="0.09" numOctaves="3" seed="9" result="g"/>' +
      '<feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -0.9 1.35" result="ga"/>' +
      '<feComposite in="b" in2="ga" operator="in" result="tex"/>' +
      '<feComponentTransfer in="tex"><feFuncA type="linear" slope="0.92"/></feComponentTransfer>' +
    '</filter>' +
    '<linearGradient id="skyG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bfe0f4"/><stop offset=".45" stop-color="#eaf5fb"/></linearGradient>' +
    '<symbol id="scene" viewBox="0 0 800 440">' + scene() + '</symbol>' +
    '<symbol id="car" viewBox="0 0 160 76">' + car + '</symbol>' +
    '<symbol id="plane" viewBox="0 0 64 40">' + plane + '</symbol>' +
    '</defs></svg>';
  document.body.insertAdjacentHTML("afterbegin", svg);
})();
