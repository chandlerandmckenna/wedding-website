/* Watercolor art shared by every page: paint filters, a lemon sprig and a
   hand-painted majolica tile. Injected once so pages can <use> them. */
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
    "</defs></svg>";
  document.body.insertAdjacentHTML("afterbegin", svg);
})();
