/* Watercolor art shared by every page: paint filters, a lemon sprig and a
   lemon branch and a lemon brushstroke (the tile bands are assets/img/tiles.svg).
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
    '  <radialGradient id="tomG" cx="36%" cy="32%" r="72%"><stop offset="0" stop-color="#ff8a66"/><stop offset=".45" stop-color="#e2412a"/><stop offset="1" stop-color="#a8231a"/></radialGradient>' +
    '  <symbol id="sprig-lemon" viewBox="0 0 240 170">' +
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
    '<symbol id="swash" viewBox="0 0 200 30"><g filter="url(#wc)"><path d="M6 20C40 10 90 8 130 12C160 14 182 18 194 14" fill="none" stroke="#f2c94c" stroke-width="9" stroke-linecap="round"/></g></symbol>' +
    lemonBranch() + tomatoes() +
    "</defs></svg>";
  document.body.insertAdjacentHTML("afterbegin", svg);

  /* Tomatoes on the vine: a long vine for the corners (#tomato-vine) and a
     small cluster (#sprig) for the photo and reply panels. */
  function tomatoes() {
    function leaf(x, y, l, w, a, fill) {
      // a tomato leaflet: a pointed leaf with a toothed edge
      var d = "M0 0", n = 5, i;
      for (i = 1; i <= n; i++) d += "L" + (l * i / (n + 1)).toFixed(1) + " " + (-w * Math.sin(Math.PI * i / (n + 1)) * (i % 2 ? 1 : 0.72)).toFixed(1);
      d += "L" + l + " 0";
      for (i = n; i >= 1; i--) d += "L" + (l * i / (n + 1)).toFixed(1) + " " + (w * Math.sin(Math.PI * i / (n + 1)) * (i % 2 ? 1 : 0.72)).toFixed(1);
      return '<g transform="translate(' + x + ' ' + y + ') rotate(' + a + ')"><path d="' + d + 'Z" fill="' + fill + '"/>' +
        '<path d="M2 0L' + (l * 0.9) + ' 0" stroke="#e7eccb" stroke-width="1" opacity=".5"/></g>';
    }
    function frond(x, y, a, s) {
      // a compound leaf: leaflets in pairs along a stem
      var g = '<g transform="translate(' + x + ' ' + y + ') rotate(' + a + ') scale(' + s + ')">' +
        '<path d="M0 0L96 0" stroke="#5c7a3a" stroke-width="2.4" stroke-linecap="round"/>';
      g += leaf(28, 0, 34, 10, -58, "url(#leafG)") + leaf(28, 0, 34, 10, 58, "url(#leafG2)");
      g += leaf(58, 0, 30, 9, -52, "url(#leafG2)") + leaf(58, 0, 30, 9, 52, "url(#leafG)");
      g += leaf(92, 0, 38, 12, 0, "url(#leafG)");
      return g + "</g>";
    }
    function tomato(x, y, r, a) {
      var g = '<g transform="translate(' + x + ' ' + y + ') rotate(' + (a || 0) + ')">' +
        '<path d="M0 ' + (-r * 0.86) + 'C' + (r * 0.62) + ' ' + (-r * 0.98) + ' ' + (r * 1.04) + ' ' + (-r * 0.5) + ' ' + (r * 1.02) + ' 0C' + r + ' ' + (r * 0.62) + ' ' + (r * 0.55) + ' ' + (r * 0.92) + ' 0 ' + (r * 0.9) +
        'C' + (-r * 0.55) + ' ' + (r * 0.92) + ' ' + (-r) + ' ' + (r * 0.62) + ' ' + (-r * 1.02) + ' 0C' + (-r * 1.04) + ' ' + (-r * 0.5) + ' ' + (-r * 0.62) + ' ' + (-r * 0.98) + ' 0 ' + (-r * 0.86) + 'Z" fill="url(#tomG)"/>' +
        '<path d="M' + (-r * 0.35) + ' ' + (-r * 0.7) + 'C' + (-r * 0.5) + ' ' + (-r * 0.1) + ' ' + (-r * 0.4) + ' ' + (r * 0.5) + ' ' + (-r * 0.1) + ' ' + (r * 0.85) + '" stroke="#b42a1d" stroke-width="1.6" fill="none" opacity=".45"/>' +
        '<path d="M' + (r * 0.35) + ' ' + (-r * 0.7) + 'C' + (r * 0.5) + ' ' + (-r * 0.1) + ' ' + (r * 0.4) + ' ' + (r * 0.5) + ' ' + (r * 0.1) + ' ' + (r * 0.85) + '" stroke="#b42a1d" stroke-width="1.6" fill="none" opacity=".45"/>' +
        '<ellipse cx="' + (-r * 0.38) + '" cy="' + (-r * 0.42) + '" rx="' + (r * 0.26) + '" ry="' + (r * 0.14) + '" fill="#fff3e6" opacity=".55" transform="rotate(-30 ' + (-r * 0.38) + ' ' + (-r * 0.42) + ')"/>';
      // the green star of a calyx
      var c = "";
      for (var i = 0; i < 5; i++) {
        c += '<path d="M0 0C' + (r * 0.12) + ' ' + (-r * 0.08) + ' ' + (r * 0.36) + ' ' + (-r * 0.05) + ' ' + (r * 0.48) + ' ' + (r * 0.06) + 'C' + (r * 0.3) + ' ' + (r * 0.08) + ' ' + (r * 0.12) + ' ' + (r * 0.08) + ' 0 0Z" fill="#4f7a34" transform="rotate(' + (i * 72 - 90) + ')"/>';
      }
      g += '<g transform="translate(0 ' + (-r * 0.84) + ')">' + c + '<path d="M0 0L0 ' + (-r * 0.26) + '" stroke="#4f7a34" stroke-width="3" stroke-linecap="round"/></g>';
      return g + "</g>";
    }
    function flower(x, y, r) {
      var g = '<g transform="translate(' + x + ' ' + y + ')">';
      for (var i = 0; i < 5; i++) g += '<path d="M0 0L' + (r * 0.32) + ' ' + (-r * 0.5) + 'L0 ' + (-r) + 'L' + (-r * 0.32) + ' ' + (-r * 0.5) + 'Z" fill="#f2c94c" transform="rotate(' + i * 72 + ')"/>';
      return g + '<circle r="' + r * 0.22 + '" fill="#d9a21b"/></g>';
    }
    var vine = '<symbol id="tomato-vine" viewBox="0 0 340 460"><g filter="url(#wc)">' +
      '<path d="M-6 16C70 28 132 60 162 118C182 160 186 206 176 262" stroke="#5c7a3a" stroke-width="5" fill="none" stroke-linecap="round"/>' +
      '<path d="M70 34C52 90 48 150 62 208M124 72C170 82 218 72 258 46M176 262C170 292 160 312 146 326M62 208C68 236 80 262 98 282M150 104C168 140 210 170 236 190" stroke="#5c7a3a" stroke-width="3" fill="none" stroke-linecap="round"/>' +
      frond(10, 18, 58, 1.0) + frond(40, 26, -18, 0.9) + frond(96, 50, 24, 1.05) + frond(150, 82, -22, 0.9) +
      frond(214, 64, -34, 0.8) + frond(132, 96, 78, 0.95) + frond(170, 160, 6, 0.95) + frond(52, 138, 160, 0.9) +
      frond(176, 210, 140, 0.85) + frond(62, 176, 34, 0.85) +
      tomato(146, 360, 44, 6) + tomato(98, 318, 36, -10) + tomato(236, 212, 32, 12) + tomato(192, 330, 26, 18) +
      flower(116, 54, 11) + flower(236, 104, 10) + flower(30, 100, 9) + flower(250, 54, 8) +
      "</g></symbol>";
    var sprig = '<symbol id="sprig" viewBox="0 0 240 170"><g filter="url(#wc)">' +
      '<path d="M8 30C60 40 110 52 150 78C170 92 182 104 190 118M150 78C140 96 132 108 120 116" fill="none" stroke="#5c7a3a" stroke-width="3.2" stroke-linecap="round"/>' +
      frond(20, 32, -12, 0.75) + frond(80, 46, -40, 0.7) + frond(110, 58, 40, 0.6) +
      tomato(190, 138, 26, 8) + tomato(124, 136, 20, -8) + flower(64, 30, 8) +
      "</g></symbol>";
    return vine + sprig;
  }

  /* A lemon branch in blossom that hangs into the title page's corners. */
  function lemonBranch() {
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

    return lemons;
  }
})();
