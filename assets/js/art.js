/* Art shared by every page, in the flat style of the couple's "Salute!" card:
   a cobalt lemon sprig with one ripe lemon (#sprig), a little gold bow
   (#bow), a gold underline (#swash), a postmark and a stamp picture. Injected once so pages can <use> them. */
(function () {
  var COBALT = "#1d3fbd", LEMON = "#f5b324", LEMON_DEEP = "#dc951a", GOLD = "#eeaa22";

  // an almond leaf of length l and half-width w, from (x, y) along angle a
  function leaf(x, y, l, w, a) {
    return '<path transform="translate(' + x + " " + y + ") rotate(" + a + ')" d="M0 0C' + l * 0.22 + " " + -w * 1.25 + " " + l * 0.72 + " " + -w * 1.1 + " " + l + " 0C" + l * 0.68 + " " + w * 0.75 + " " + l * 0.2 + " " + w * 0.8 + ' 0 0Z" fill="' + COBALT + '"/>';
  }
  // a white daisy, like the one painted on the lemon
  function daisy(x, y, r) {
    var g = '<g transform="translate(' + x + " " + y + ')">';
    for (var i = 0; i < 10; i++) g += '<ellipse cx="0" cy="' + -r * 0.55 + '" rx="' + r * 0.17 + '" ry="' + r * 0.45 + '" fill="#fff" transform="rotate(' + i * 36 + ')"/>';
    return g + '<circle r="' + r * 0.2 + '" fill="' + LEMON_DEEP + '"/></g>';
  }

  var sprig = '<symbol id="sprig" viewBox="0 0 240 170"><g transform="translate(6 16) scale(.88)">' +
    '<path d="M8 50C60 46 104 52 140 64C164 72 180 82 192 96" fill="none" stroke="' + COBALT + '" stroke-width="6" stroke-linecap="round"/>' +
    '<path d="M70 52C82 38 92 30 108 24" fill="none" stroke="' + COBALT + '" stroke-width="4" stroke-linecap="round"/>' +
    leaf(104, 26, 58, 15, -28) + leaf(138, 62, 78, 19, -24) + leaf(84, 54, 70, 15, 72) + leaf(128, 64, 58, 13, 68) +
    // the lemon, hanging from the end of the stem
    '<g transform="translate(200 118) rotate(-14)">' +
    '<path d="M0 -34C18 -34 27 -16 27 4C27 24 16 38 2 40L0 44L-2 40C-16 38 -27 24 -27 4C-27 -16 -18 -34 0 -34Z" fill="' + LEMON + '"/>' +
    daisy(-4, -2, 16) +
    '<circle cx="8" cy="22" r="2.2" fill="' + LEMON_DEEP + '"/><circle cx="13" cy="18" r="1.8" fill="' + LEMON_DEEP + '"/><circle cx="12" cy="25" r="1.6" fill="' + LEMON_DEEP + '"/>' +
    '<circle cx="0" cy="45" r="3.4" fill="' + COBALT + '"/></g>' +
    "</g></symbol>";

  var bow = '<symbol id="bow" viewBox="0 0 120 40"><g fill="none" stroke="' + GOLD + '" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M60 18C50 6 34 4 34 14C34 22 50 22 60 18C70 22 86 22 86 14C86 4 70 6 60 18Z"/>' +
    '<path d="M60 18L48 36M60 18L72 36"/><path d="M0 18H34M86 18H120"/></g></symbol>';

  var swash = '<symbol id="swash" viewBox="0 0 200 30"><path d="M8 18C50 12 120 11 192 16" fill="none" stroke="' + GOLD + '" stroke-width="4" stroke-linecap="round"/></symbol>';

  // the stamp's picture: the sun setting over the bay and a little sailboat
  var stampView = '<symbol id="stamp-view" viewBox="0 0 64 58">' +
    '<rect width="64" height="58" fill="#fffdf8"/>' +
    '<circle cx="40" cy="30" r="13" fill="' + GOLD + '"/>' +
    '<path d="M0 34H64V58H0Z" fill="' + COBALT + '"/>' +
    '<path d="M0 41C8 38 14 44 22 41S36 38 44 41S56 44 64 41M0 49C8 46 14 52 22 49S36 46 44 49S56 52 64 49" fill="none" stroke="#7d9be6" stroke-width="2" stroke-linecap="round"/>' +
    '<path d="M17 31L17 15L26 30Z" fill="#fff" stroke="' + COBALT + '" stroke-width="1"/><path d="M15 17L15 30L8 30Z" fill="#fff" stroke="' + COBALT + '" stroke-width="1"/><path d="M6 32H28L25 36H9Z" fill="' + LEMON + '"/>' +
    '</symbol>';

  // a round Sorrento postmark with wavy cancellation lines
  var postmark = '<symbol id="postmark" viewBox="0 0 200 120"><g fill="none" stroke="' + COBALT + '" stroke-width="2" opacity=".75">' +
    '<circle cx="60" cy="60" r="46"/><circle cx="60" cy="60" r="32"/>' +
    '<path id="pm-arc" d="M24 60A36 36 0 0 1 96 60" stroke="none"/>' +
    '<path d="M112 36C124 30 136 42 148 36S172 30 196 36M112 52C124 46 136 58 148 52S172 46 196 52M112 68C124 62 136 74 148 68S172 62 196 68M112 84C124 78 136 90 148 84S172 78 196 84"/></g>' +
    '<g fill="' + COBALT + '" opacity=".8" font-family="Jost, sans-serif" font-weight="500" text-anchor="middle">' +
    '<text font-size="11" letter-spacing="2"><textPath href="#pm-arc" startOffset="50%">SORRENTO</textPath></text>' +
    '<text x="60" y="64" font-size="12">1·10·27</text><text x="60" y="94" font-size="9" letter-spacing="2">ITALIA</text></g></symbol>';

  /* Little Amalfi pieces in the same flat style as the stamp. */
  var PERI = "#7d9be6", CREAM = "#fcefdf", ORANGE = "#f07f22", INK = "#17245a";

  // a testa di moro: the painted ceramic head vases of Sicily and the coast,
  // a nod to Capo Santa Fortunata; drawn in blue-and-white majolica
  var moor = '<symbol id="moor" viewBox="0 0 100 140">' +
    '<path d="M24 46C18 34 26 22 34 28C34 16 46 12 50 24C54 12 66 16 66 28C74 22 82 34 76 46Z" fill="' + PERI + '"/>' +
    '<ellipse cx="32" cy="28" rx="9" ry="7" fill="' + LEMON + '"/><ellipse cx="50" cy="20" rx="9" ry="7" fill="' + LEMON + '"/><ellipse cx="68" cy="28" rx="9" ry="7" fill="' + LEMON + '"/>' +
    '<path d="M28 36L23 24M72 36L77 24" stroke="' + COBALT + '" stroke-width="3" stroke-linecap="round"/>' +
    '<path d="M24 62C24 44 36 40 50 40C64 40 76 44 76 62C76 88 66 100 50 100C34 100 24 88 24 62Z" fill="' + COBALT + '"/>' +
    '<path d="M22 48H78L74 58H26Z" fill="' + GOLD + '"/>' +
    '<circle cx="34" cy="53" r="2.2" fill="' + CREAM + '"/><circle cx="50" cy="53" r="2.6" fill="' + CREAM + '"/><circle cx="66" cy="53" r="2.2" fill="' + CREAM + '"/>' +
    '<g fill="none" stroke="' + CREAM + '" stroke-width="2.2" stroke-linecap="round">' +
    '<path d="M36 69C39 72 43 72 46 69M54 69C57 72 61 72 64 69"/><path d="M50 72L48 82H53"/><path d="M44 89C48 92 52 92 56 89"/></g>' +
    '<circle cx="25" cy="78" r="3.4" fill="' + GOLD + '"/><circle cx="75" cy="78" r="3.4" fill="' + GOLD + '"/>' +
    '<path d="M38 99L35 116H65L62 99Z" fill="' + COBALT + '"/>' +
    '<rect x="28" y="116" width="44" height="10" rx="3" fill="' + GOLD + '"/>' +
    '<path d="M38 107H62" stroke="' + CREAM + '" stroke-width="2" stroke-dasharray="2 4" stroke-linecap="round"/>' +
    '</symbol>';

  // an Aperol spritz with a slice of orange
  function spritzGlass(x, a) {
    return '<g transform="translate(' + x + ' 0) rotate(' + a + ' 40 100)">' +
      '<path d="M16 26C16 58 26 72 40 72C54 72 64 58 64 26Z" fill="' + ORANGE + '"/>' +
      '<rect x="28" y="40" width="10" height="10" rx="2" fill="#fff" opacity=".55"/><rect x="42" y="46" width="9" height="9" rx="2" fill="#fff" opacity=".45"/>' +
      '<path d="M14 12H66C66 56 56 74 40 74C24 74 14 56 14 12Z" fill="none" stroke="' + COBALT + '" stroke-width="3"/>' +
      '<path d="M40 74V100M26 102H54" stroke="' + COBALT + '" stroke-width="3" stroke-linecap="round"/>' +
      '<path d="M50 4L44 40" stroke="' + COBALT + '" stroke-width="2.5" stroke-linecap="round"/>' +
      '<circle cx="62" cy="22" r="11" fill="' + ORANGE + '" stroke="#fff" stroke-width="2"/><path d="M62 13V31M53 22H71M56 16L68 28M68 16L56 28" stroke="#fff" stroke-width="1.2"/>' +
      '</g>';
  }
  var spritz = '<symbol id="spritz" viewBox="0 -4 180 114">' + spritzGlass(4, -12) + spritzGlass(86, 12) +
    '<path d="M85 4V14M76 8L80 16M94 8L90 16" stroke="' + GOLD + '" stroke-width="3" stroke-linecap="round"/></symbol>';

  // a Vespa carrying a crate of lemons
  var vespa = '<symbol id="vespa" viewBox="0 0 170 104">' +
    '<circle cx="40" cy="84" r="15" fill="' + INK + '"/><circle cx="40" cy="84" r="5.5" fill="' + CREAM + '"/>' +
    '<circle cx="128" cy="84" r="15" fill="' + INK + '"/><circle cx="128" cy="84" r="5.5" fill="' + CREAM + '"/>' +
    '<path d="M22 78C22 66 30 60 40 60C50 60 58 66 58 78Z" fill="' + COBALT + '"/>' +
    '<path d="M32 74C32 52 38 36 46 22H56C50 38 48 56 54 70H98C98 50 112 40 132 42C148 44 156 58 154 78H40Z" fill="' + COBALT + '"/>' +
    '<path d="M98 40C108 33 124 33 136 37L134 46C122 43 110 43 100 46Z" fill="' + INK + '"/>' +
    '<path d="M38 20H64" stroke="' + INK + '" stroke-width="4" stroke-linecap="round"/><circle cx="46" cy="30" r="5" fill="' + GOLD + '"/>' +
    '<path d="M112 64C120 58 134 58 144 64" stroke="' + PERI + '" stroke-width="3" fill="none" stroke-linecap="round"/>' +
    '<path d="M136 46H162" stroke="' + INK + '" stroke-width="3" stroke-linecap="round"/>' +
    '<rect x="138" y="28" width="22" height="16" rx="2" fill="' + GOLD + '"/><path d="M138 36H160" stroke="' + CREAM + '" stroke-width="1.5"/>' +
    '<ellipse cx="143" cy="26" rx="5.5" ry="4.5" fill="' + LEMON + '" stroke="' + CREAM + '" stroke-width="1"/><ellipse cx="152" cy="24" rx="5.5" ry="4.5" fill="' + LEMON + '" stroke="' + CREAM + '" stroke-width="1"/><ellipse cx="158" cy="27" rx="4.5" ry="4" fill="' + LEMON + '" stroke="' + CREAM + '" stroke-width="1"/>' +
    '</symbol>';

  document.body.insertAdjacentHTML("afterbegin",
    '<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>' +
    sprig + bow + swash + postmark + stampView + moor + spritz + vespa + "</defs></svg>");
})();
