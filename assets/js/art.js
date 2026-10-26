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

  document.body.insertAdjacentHTML("afterbegin",
    '<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>' +
    sprig + bow + swash + postmark + stampView + "</defs></svg>");
})();
