/* Watercolor art shared by every page: paint filters, a lemon sprig, a
   hand-painted majolica tile, a little biplane and a lemon brushstroke.
   Injected once so pages can <use> them. */
(function () {
  var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>' +
    '  <filter id="wc" x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="sRGB">' +
    '    <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="4" seed="4" result="n"/>' +
    '    <feDisplacementMap in="SourceGraphic" in2="n" scale="6" xChannelSelector="R" yChannelSelector="G" result="d"/>' +
    '    <feGaussianBlur in="d" stdDeviation="0.8" result="b"/>' +
    '    <feMorphology in="b" operator="erode" radius="2" result="er"/>' +
    '    <feGaussianBlur in="er" stdDeviation="2.5" result="erb"/>' +
    '    <feComposite in="b" in2="erb" operator="out" result="edge"/>' +
    '    <feComponentTransfer in="edge" result="edge2"><feFuncA type="linear" slope="0.55"/></feComponentTransfer>' +
    '    <feTurbulence type="fractalNoise" baseFrequency="0.09" numOctaves="3" seed="9" result="g"/>' +
    '    <feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.1 1.35" result="ga"/>' +
    '    <feComposite in="b" in2="ga" operator="in" result="tex"/>' +
    '    <feComponentTransfer in="tex" result="tex2"><feFuncA type="linear" slope="0.85"/></feComponentTransfer>' +
    '    <feMerge><feMergeNode in="tex2"/><feMergeNode in="edge2"/></feMerge>' +
    '  </filter>' +
    '  <filter id="wash" x="-30%" y="-30%" width="160%" height="160%" color-interpolation-filters="sRGB">' +
    '    <feTurbulence type="fractalNoise" baseFrequency="0.011" numOctaves="4" seed="11" result="n"/>' +
    '    <feDisplacementMap in="SourceGraphic" in2="n" scale="60" xChannelSelector="R" yChannelSelector="G" result="d"/>' +
    '    <feGaussianBlur in="d" stdDeviation="2" result="b"/>' +
    '    <feMorphology in="b" operator="erode" radius="4" result="er"/>' +
    '    <feGaussianBlur in="er" stdDeviation="9" result="erb"/>' +
    '    <feComposite in="b" in2="erb" operator="out" result="edge"/>' +
    '    <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="3" seed="5" result="g"/>' +
    '    <feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.4 1.3" result="ga"/>' +
    '    <feComposite in="b" in2="ga" operator="in" result="tex"/>' +
    '    <feComponentTransfer in="tex" result="tex2"><feFuncA type="linear" slope="0.6"/></feComponentTransfer>' +
    '    <feMerge><feMergeNode in="tex2"/><feMergeNode in="edge"/></feMerge>' +
    '  </filter>' +
    '  <radialGradient id="lemonG" cx="38%" cy="35%" r="70%"><stop offset="0" stop-color="#fff2a8"/><stop offset=".45" stop-color="#f4d04a"/><stop offset="1" stop-color="#d9a21b"/></radialGradient>' +
    '  <linearGradient id="leafG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9fb07a"/><stop offset="1" stop-color="#55703f"/></linearGradient>' +
    '  <linearGradient id="leafG2" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#7f9862"/><stop offset="1" stop-color="#46603a"/></linearGradient>' +
    '  <symbol id="sprig" viewBox="0 0 240 170">' +
    '    <g filter="url(#wc)">' +
    '      <path d="M8 30 C60 40 110 52 150 78 C170 92 186 110 196 128" fill="none" stroke="#6d5a3a" stroke-width="3.2" stroke-linecap="round"/>' +
    '      <path d="M58 40 C70 8 104 0 128 6 C112 22 92 38 58 40Z" fill="url(#leafG)"/>' +
    '      <path d="M96 52 C92 84 112 104 136 110 C134 86 120 64 96 52Z" fill="url(#leafG2)"/>' +
    '      <path d="M150 78 C176 58 206 60 226 72 C206 88 180 92 150 78Z" fill="url(#leafG)"/>' +
    '      <path d="M30 34 C26 58 40 74 58 80 C58 60 48 44 30 34Z" fill="url(#leafG2)"/>' +
    '      <path d="M152 126 L158 121 C162 102 178 92 196 94 C214 93 228 104 232 120 L240 125 L232 130 C228 148 212 158 194 156 C176 158 162 148 158 131 Z" fill="url(#lemonG)"/>' +
    '      <path d="M122 136 L128 132 C130 118 142 110 154 111 C166 110 176 118 178 130 L184 134 L178 138 C176 150 166 158 154 157 C142 158 132 151 128 140 Z" fill="url(#lemonG)" opacity=".92"/>' +
    '    </g>' +
    '  </symbol>' +
    '  <pattern id="tileP" width="48" height="48" patternUnits="userSpaceOnUse">' +
    '    <rect width="48" height="48" fill="#fbf8f1"/>' +
    '    <g fill="#2a55a6" fill-opacity=".85">' +
    '      <path d="M24 6C29 12 29 18 24 24C19 18 19 12 24 6Z"/><path d="M24 6C29 12 29 18 24 24C19 18 19 12 24 6Z" transform="rotate(90 24 24)"/>' +
    '      <path d="M24 6C29 12 29 18 24 24C19 18 19 12 24 6Z" transform="rotate(180 24 24)"/><path d="M24 6C29 12 29 18 24 24C19 18 19 12 24 6Z" transform="rotate(270 24 24)"/>' +
    '      <path d="M0 0H12A12 12 0 0 1 0 12Z"/><path d="M48 0V12A12 12 0 0 1 36 0Z"/><path d="M0 48V36A12 12 0 0 1 12 48Z"/><path d="M48 48H36A12 12 0 0 1 48 36Z"/>' +
    '    </g>' +
    '    <g fill="#f2c94c"><circle cx="24" cy="24" r="3.2"/><circle cx="24" cy="2" r="1.6"/><circle cx="24" cy="46" r="1.6"/><circle cx="2" cy="24" r="1.6"/><circle cx="46" cy="24" r="1.6"/></g>' +
    '  </pattern>' +
    '<symbol id="plane" viewBox="0 0 64 40"><g filter="url(#wc)"><path d="M4 20C10 12 40 12 52 16L60 20L52 24C40 28 10 28 4 20Z" fill="#2a55a6"/><path d="M22 5H40L36 35H20Z" fill="#f2c94c"/><path d="M0 12L8 16L8 24L0 28Z" fill="#2a55a6"/><circle cx="47" cy="19" r="2.5" fill="#cfe1f3"/><path d="M60 13V27" stroke="#5a4130" stroke-width="1.6" stroke-linecap="round"/></g></symbol>' +
    '<symbol id="swash" viewBox="0 0 200 30"><g filter="url(#wc)"><path d="M6 20C40 10 90 8 130 12C160 14 182 18 194 14" fill="none" stroke="#f2c94c" stroke-width="9" stroke-linecap="round"/></g></symbol>' +
    '<pattern id="laceP" width="22" height="16" patternUnits="userSpaceOnUse"><path d="M0 4H22M0 4A11 11 0 0 0 22 4" fill="none" stroke="#22489a" stroke-opacity=".45" stroke-width="1"/><circle cx="11" cy="10" r="1.6" fill="#f2c94c"/></pattern>' +
    botanicals() +
    "</defs></svg>";
  document.body.insertAdjacentHTML("afterbegin", svg);

  /* Cover botanicals, painted like the venue's own garden: a lemon branch in
     blossom, an olive branch from the grove, and an olive wreath. */
  function botanicals() {
    // a leaf of length l and half-width w, laid at (x, y) pointing along angle a
    function leaf(x, y, l, w, a, fill, vein) {
      return '<g transform="translate(' + x + ' ' + y + ') rotate(' + a + ')">' +
        '<path d="M0 0C' + l * 0.25 + ' ' + -w * 1.1 + ' ' + l * 0.7 + ' ' + -w + ' ' + l + ' 0C' + l * 0.7 + ' ' + w * 0.9 + ' ' + l * 0.25 + ' ' + w + ' 0 0Z" fill="' + fill + '"/>' +
        (vein ? '<path d="M2 0Q' + l * 0.5 + ' ' + -w * 0.12 + ' ' + l * 0.94 + ' 0" stroke="' + vein + '" stroke-width="1" fill="none" opacity=".55"/>' : "") +
        "</g>";
    }
    function lemon(x, y, s, a) {
      return '<g transform="translate(' + x + ' ' + y + ') rotate(' + a + ') scale(' + s + ')">' +
        '<path d="M-44 0L-37 -5C-33 -26 -16 -36 2 -35C20 -36 36 -26 39 -6L46 0L39 6C36 26 20 36 2 35C-16 36 -33 26 -37 5Z" fill="url(#lemonG)"/>' +
        '<ellipse cx="-6" cy="-14" rx="14" ry="6" fill="#fffbe0" opacity=".55" transform="rotate(-12)"/>' +
        '<path d="M-40 4C-30 22 -6 32 18 28" stroke="#c99a18" stroke-width="2" fill="none" opacity=".45"/>' +
        "</g>";
    }
    function blossom(x, y, r, a) {
      var g = '<g transform="translate(' + x + ' ' + y + ') rotate(' + (a || 0) + ')">';
      for (var i = 0; i < 5; i++) {
        g += '<ellipse cx="0" cy="' + -r * 0.62 + '" rx="' + r * 0.38 + '" ry="' + r * 0.62 + '" transform="rotate(' + i * 72 + ')" fill="#fffdf6" stroke="#c9c6ad" stroke-width=".8"/>';
      }
      g += '<circle r="' + r * 0.22 + '" fill="#e9c24a"/>';
      for (var j = 0; j < 7; j++) {
        var t = j * 51 * Math.PI / 180;
        g += '<circle cx="' + (Math.cos(t) * r * 0.32).toFixed(1) + '" cy="' + (Math.sin(t) * r * 0.32).toFixed(1) + '" r="1.1" fill="#b8860b"/>';
      }
      return g + "</g>";
    }
    function bud(x, y, s, a) {
      return '<g transform="translate(' + x + ' ' + y + ') rotate(' + a + ') scale(' + s + ')"><path d="M0 0C-5 -6 -5 -15 0 -20C5 -15 5 -6 0 0Z" fill="#fbf6e6" stroke="#cfc8a6" stroke-width=".8"/><path d="M0 0C-3 -3 -4 -6 -3 -8M0 0C3 -3 4 -6 3 -8" stroke="#8fa36b" stroke-width="1.4" fill="none"/></g>';
    }
    var L1 = "url(#leafG)", L2 = "url(#leafG2)", V = "#e7eccb";

    var lemons = '<symbol id="lemon-branch" viewBox="0 0 340 460"><g filter="url(#wc)">' +
      '<path d="M-6 18C70 30 130 62 162 122C184 164 190 214 182 268" stroke="#6d5a3a" stroke-width="5" fill="none" stroke-linecap="round"/>' +
      '<path d="M60 34C40 90 34 150 50 214M120 70C170 80 220 70 262 44M182 268C178 300 168 320 150 336M50 214C56 250 70 280 92 300" stroke="#6d5a3a" stroke-width="3" fill="none" stroke-linecap="round"/>' +
      leaf(14, 22, 88, 20, 62, L2, V) + leaf(30, 26, 82, 18, -22, L1, V) + leaf(70, 40, 92, 22, 104, L1, V) +
      leaf(96, 50, 96, 22, 18, L2, V) + leaf(150, 76, 86, 20, -18, L1, V) + leaf(214, 66, 74, 16, -40, L2, V) +
      leaf(258, 46, 70, 15, -12, L1, V) + leaf(128, 92, 84, 20, 70, L2, V) + leaf(170, 150, 90, 21, 8, L1, V) +
      leaf(176, 196, 82, 19, 132, L2, V) + leaf(48, 130, 80, 18, 168, L1, V) + leaf(44, 170, 84, 20, 30, L2, V) +
      leaf(186, 240, 74, 17, 26, L1, V) + leaf(56, 220, 76, 18, 140, L2, V) +
      lemon(150, 372, 1.25, 78) + lemon(92, 330, 1.05, 104) + lemon(232, 200, 0.95, 62) +
      leaf(150, 336, 60, 14, -30, L1, V) + leaf(92, 300, 56, 13, 210, L2, V) +
      blossom(118, 52, 15, 10) + blossom(222, 112, 13, 40) + blossom(30, 96, 12, 20) + blossom(206, 278, 12, 0) +
      bud(140, 40, 0.9, -20) + bud(250, 98, 0.8, 30) + bud(18, 150, 0.8, -60) +
      "</g></symbol>";

    var O1 = "url(#oliveG)", O2 = "url(#oliveG2)", OV = "#eef0e2";
    var olive = '<symbol id="olive-branch" viewBox="0 0 340 460"><g filter="url(#wc)">' +
      '<path d="M346 14C280 30 222 66 196 128C178 172 176 230 186 290M300 28C318 80 322 140 306 200M232 90C190 84 140 92 96 116" stroke="#7a6a4c" stroke-width="3.4" fill="none" stroke-linecap="round"/>';
    var spots = [[330, 18, 200], [300, 30, 150], [284, 34, 230], [262, 46, 170], [244, 58, 245], [228, 74, 195], [212, 96, 260],
      [200, 120, 150], [194, 146, 215], [188, 176, 155], [186, 206, 225], [184, 236, 160], [186, 266, 210], [186, 290, 110],
      [306, 58, 40], [312, 90, 140], [314, 122, 30], [312, 154, 150], [308, 190, 60], [206, 86, 280], [180, 86, 120],
      [156, 92, 250], [132, 100, 110], [110, 110, 230], [96, 116, 170]];
    spots.forEach(function (sp, i) { olive += leaf(sp[0], sp[1], 54 + (i % 3) * 8, 8, sp[2], i % 2 ? O1 : O2, OV); });
    olive += '<ellipse cx="200" cy="320" rx="11" ry="15" fill="#5f6b3c" transform="rotate(-14 200 320)"/>' +
      '<ellipse cx="178" cy="306" rx="10" ry="14" fill="#7d8a4a" transform="rotate(18 178 306)"/>' +
      '<ellipse cx="320" cy="224" rx="10" ry="14" fill="#4c5636" transform="rotate(-8 320 224)"/>' +
      '<ellipse cx="114" cy="140" rx="9" ry="13" fill="#7d8a4a" transform="rotate(12 114 140)"/>' +
      '<g fill="#fffbe9" opacity=".7"><circle cx="196" cy="314" r="2.4"/><circle cx="175" cy="300" r="2.2"/><circle cx="317" cy="218" r="2.2"/><circle cx="111" cy="135" r="2"/></g>' +
      blossom(250, 138, 13, 12) + blossom(140, 132, 11, 30) + bud(270, 160, 0.8, 30) +
      "</g></symbol>";

    // olive wreath for the monogram: two arcs of small leaves meeting at the bottom
    var wreath = '<symbol id="wreath" viewBox="0 0 120 120"><g filter="url(#wc)">' +
      '<path d="M52 106A46 46 0 0 1 37 20M68 106A46 46 0 0 0 83 20" stroke="#7a6a4c" stroke-width="1.4" fill="none"/>';
    for (var k = 0; k < 9; k++) {
      var th = 100 + k * 16, r = th * Math.PI / 180;
      var x = 60 + Math.cos(r) * 46, y = 60 + Math.sin(r) * 46, dir = th + 90;
      [[dir - 34, 0], [dir + 34, 1]].forEach(function (lf) {
        var c = (k + lf[1]) % 2 ? O1 : O2;
        wreath += leaf(x.toFixed(1), y.toFixed(1), 15, 3.6, lf[0], c) + leaf((120 - x).toFixed(1), y.toFixed(1), 15, 3.6, 180 - lf[0], c);
      });
    }
    wreath += "</g></symbol>";

    return '<linearGradient id="oliveG" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8e9a6c"/><stop offset="1" stop-color="#b9c09a"/></linearGradient>' +
      '<linearGradient id="oliveG2" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5f6e45"/><stop offset="1" stop-color="#93a07a"/></linearGradient>' +
      lemons + olive + wreath;
  }
})();
