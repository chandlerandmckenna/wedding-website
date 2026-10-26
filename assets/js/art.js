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

  // a watercolor treatment: wobbly edges, uneven pigment and a darker rim
  // where the wash dries, so the little pieces sit with the painted car
  var paint = '<filter id="wc" x="-10%" y="-10%" width="120%" height="120%" color-interpolation-filters="sRGB">' +
    '<feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" seed="3" result="n"/>' +
    '<feDisplacementMap in="SourceGraphic" in2="n" scale="5" xChannelSelector="R" yChannelSelector="G" result="d"/>' +
    '<feTurbulence type="fractalNoise" baseFrequency="0.12" numOctaves="2" seed="8" result="g"/>' +
    '<feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -0.55 1.3" result="ga"/>' +
    '<feComposite in="d" in2="ga" operator="in" result="tex"/>' +
    '<feMorphology in="d" operator="erode" radius="1.4" result="er"/>' +
    '<feComposite in="d" in2="er" operator="out" result="rim"/>' +
    '<feColorMatrix in="rim" type="matrix" values="0.7 0 0 0 0  0 0.7 0 0 0  0 0 0.7 0 0  0 0 0 0.55 0" result="rim2"/>' +
    '<feComponentTransfer in="tex" result="tex2"><feFuncA type="linear" slope="0.88"/></feComponentTransfer>' +
    '<feMerge><feMergeNode in="tex2"/><feMergeNode in="rim2"/></feMerge></filter>';

  /* Little Amalfi pieces in the same flat style as the stamp. */
  var PERI = "#7d9be6", CREAM = "#fcefdf", ORANGE = "#f07f22", INK = "#17245a";

  // a testa di moro: the painted ceramic head vases of Sicily and the coast,
  // a nod to Capo Santa Fortunata; drawn in blue-and-white majolica
  var moor = '<symbol id="moor" viewBox="0 0 100 140"><g filter="url(#wc)">' +
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
    '</g></symbol>';

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
  var spritz = '<symbol id="spritz" viewBox="0 -4 180 114"><g filter="url(#wc)">' + spritzGlass(4, -12) + spritzGlass(86, 12) +
    '<path d="M85 4V14M76 8L80 16M94 8L90 16" stroke="' + GOLD + '" stroke-width="3" stroke-linecap="round"/></g></symbol>';


  // a little plane towing a banner across the travel page, like the one
  // on the couple's painted save-the-date
  var plane = '<symbol id="plane" viewBox="0 0 300 70"><g filter="url(#wc)">' +
    '<path d="M70 34H200" stroke="' + INK + '" stroke-width="1.5" opacity=".6"/>' +
    '<path d="M196 18H290L280 34L290 50H196Z" fill="' + LEMON + '"/>' +
    '<text x="243" y="40" text-anchor="middle" font-family="Norican, cursive" font-size="17" fill="' + COBALT + '">Benvenuti!</text>' +
    '<path d="M8 30C8 24 16 22 30 22H58C66 22 70 28 70 32C70 38 64 40 56 40H24C14 40 8 36 8 30Z" fill="' + COBALT + '"/>' +
    '<path d="M30 30L22 8H32L46 30Z" fill="' + PERI + '"/><path d="M30 34L20 56H30L46 34Z" fill="' + PERI + '"/>' +
    '<path d="M8 30L2 18H10L16 28Z" fill="' + PERI + '"/>' +
    '<circle cx="54" cy="29" r="4" fill="#fff"/><path d="M70 22V42" stroke="' + INK + '" stroke-width="3" stroke-linecap="round"/>' +
    '</g></symbol>';

  /* Stamp pictures for the travel page's day trips, painted in the same
     watercolor treatment: Capri, Positano, Pompeii, the Path of the Gods,
     limoncello and the Bagni della Regina Giovanna. */
  var SKY = "#d6e1f7", SEA = "#4c72d0", TERRA = "#c8673e", OLIVE = "#7f9a52", STONE = "#e6d6b8";
  function view(id, body) {
    return '<symbol id="' + id + '" viewBox="0 0 120 100"><g filter="url(#wc)"><rect width="120" height="100" fill="' + SKY + '"/>' + body + '</g></symbol>';
  }
  var waves = '<path d="M0 84C10 81 18 87 28 84S46 81 56 84S74 87 84 84S102 81 120 84" fill="none" stroke="' + PERI + '" stroke-width="2.5" stroke-linecap="round"/>';
  var trips =
    view("trip-capri",
      '<circle cx="94" cy="24" r="10" fill="' + LEMON + '"/>' +
      '<path d="M0 70H120V100H0Z" fill="' + SEA + '"/>' +
      '<path d="M14 72C16 50 24 40 30 40C36 40 40 54 42 72Z" fill="' + STONE + '"/>' +
      '<path d="M44 72C46 44 54 30 60 30C68 30 72 48 74 72Z" fill="#d8c29c"/>' +
      '<path d="M78 72C80 56 86 50 92 50C98 50 102 60 104 72Z" fill="' + STONE + '"/>' +
      '<path d="M52 72C56 64 64 64 66 72Z" fill="' + SEA + '"/>' + waves +
      '<path d="M86 78L88 66L94 77Z" fill="#fff"/><path d="M82 79H98L95 82H85Z" fill="' + COBALT + '"/>') +
    view("trip-positano",
      '<path d="M0 30C30 20 60 26 90 18L120 14V100H0Z" fill="' + OLIVE + '" opacity=".7"/>' +
      '<path d="M0 74H120V100H0Z" fill="' + SEA + '"/>' +
      '<g>' +
      '<rect x="16" y="56" width="16" height="16" fill="' + LEMON + '"/><rect x="34" y="50" width="14" height="22" fill="' + CREAM + '"/>' +
      '<rect x="50" y="44" width="16" height="28" fill="' + TERRA + '"/><rect x="68" y="52" width="14" height="20" fill="#fff"/>' +
      '<rect x="84" y="46" width="18" height="26" fill="' + LEMON + '"/><rect x="40" y="34" width="14" height="14" fill="#fff"/>' +
      '<rect x="60" y="30" width="14" height="14" fill="' + CREAM + '"/><rect x="78" y="34" width="12" height="12" fill="' + TERRA + '"/>' +
      '<path d="M54 44C54 32 66 32 66 44Z" fill="' + COBALT + '"/><path d="M58 40C58 36 62 36 62 40" stroke="' + GOLD + '" stroke-width="1.5" fill="none"/>' +
      '</g>' +
      '<path d="M20 62h3M38 58h3M72 58h3M88 54h3M88 62h3M44 40h3M64 36h3" stroke="' + INK + '" stroke-width="2" opacity=".6"/>' + waves) +
    view("trip-pompeii",
      '<path d="M0 62L34 22C38 18 42 18 46 22L84 62Z" fill="#9a8f9c"/>' +
      '<path d="M30 26C30 18 36 12 42 14C46 8 54 10 54 16" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".8"/>' +
      '<path d="M0 62H120V100H0Z" fill="' + STONE + '"/>' +
      '<rect x="56" y="34" width="56" height="7" fill="#d8c29c"/>' +
      '<rect x="60" y="41" width="8" height="40" fill="#f3e9d6"/><rect x="78" y="41" width="8" height="40" fill="#f3e9d6"/><rect x="96" y="41" width="8" height="34" fill="#f3e9d6"/>' +
      '<rect x="56" y="81" width="52" height="5" fill="#d8c29c"/>' +
      '<path d="M10 90H40" stroke="#d8c29c" stroke-width="3" stroke-linecap="round"/>') +
    view("trip-gods",
      '<circle cx="26" cy="22" r="10" fill="' + LEMON + '"/>' +
      '<path d="M0 60L30 34L52 48L78 26L120 52V100H0Z" fill="' + OLIVE + '"/>' +
      '<path d="M0 78H120V100H0Z" fill="' + SEA + '"/>' +
      '<path d="M10 70C30 62 44 60 58 52S86 40 108 46" fill="none" stroke="' + CREAM + '" stroke-width="2.5" stroke-dasharray="4 4" stroke-linecap="round"/>' +
      '<path d="M86 44L84 38L88 38Z" fill="' + COBALT + '"/><circle cx="86" cy="35" r="2.4" fill="' + COBALT + '"/>' + waves) +
    view("trip-lemons",
      '<path d="M0 72H120V100H0Z" fill="' + STONE + '"/>' +
      '<path d="M50 20H62V30C70 36 72 44 72 54V84H40V54C40 44 42 36 50 30Z" fill="#f7e48a"/>' +
      '<path d="M50 14H62V22H50Z" fill="' + COBALT + '"/>' +
      '<rect x="44" y="52" width="24" height="16" rx="2" fill="#fff"/><path d="M48 60H64" stroke="' + COBALT + '" stroke-width="2"/>' +
      '<ellipse cx="88" cy="80" rx="12" ry="9" fill="' + LEMON + '"/><ellipse cx="24" cy="82" rx="11" ry="8" fill="' + LEMON + '"/>' +
      '<path d="M84 70C90 62 98 62 102 66C96 70 90 72 84 70Z" fill="' + OLIVE + '"/><path d="M28 74C22 66 14 66 10 70C16 74 22 76 28 74Z" fill="' + OLIVE + '"/>') +
    view("trip-bagni",
      '<path d="M0 40C20 34 34 40 44 46V100H0Z" fill="' + STONE + '"/>' +
      '<path d="M120 36C100 32 86 40 78 46V100H120Z" fill="' + STONE + '"/>' +
      '<path d="M40 50C46 36 74 36 82 50V58H40Z" fill="' + STONE + '"/>' +
      '<path d="M46 58C48 46 74 46 76 58Z" fill="' + SKY + '"/>' +
      '<path d="M22 66C40 60 82 60 100 66C96 82 74 88 60 88C44 88 26 82 22 66Z" fill="#5fc0d0"/>' +
      '<path d="M34 72C44 70 52 74 62 72S80 70 88 72" stroke="#fff" stroke-width="2" fill="none" opacity=".8" stroke-linecap="round"/>' +
      '<circle cx="60" cy="74" r="2.6" fill="' + TERRA + '"/>');

  document.body.insertAdjacentHTML("afterbegin",
    '<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>' +
    sprig + bow + swash + postmark + stampView + paint + moor + spritz + trips + plane + "</defs></svg>");
})();
