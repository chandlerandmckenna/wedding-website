"""Write assets/img/tiles.svg: a strip of six hand-painted majolica tiles
(blue cross, lemon, olive-wreath roundel, tulip diamond, flower lattice,
leaf border) that the tile bands repeat along the top and bottom of pages.

    python3 tools/make-tiles.py
"""
import math

T = 100   # one tile
BLUE, BLUE2, SKY = "#2f5db0", "#3f6fc4", "#7b9de0"
YEL, OCHRE, GOLD = "#f4c94e", "#e6a73a", "#c9a24a"
GREEN, GREEN2 = "#93ab5f", "#5f7f3e"
WHITE = "#fdfbf4"


def rot(shape, n=4, cx=50, cy=50, start=0):
    return "".join(f'<g transform="rotate({start + i * 360 / n} {cx} {cy})">{shape}</g>' for i in range(n))


def leaf(x, y, l, w, a, fill, vein=None):
    s = (f'<g transform="translate({x:.1f} {y:.1f}) rotate({a:.1f})">'
         f'<path d="M0 0C{l*.25:.1f} {-w*1.1:.1f} {l*.7:.1f} {-w:.1f} {l:.1f} 0C{l*.7:.1f} {w*.9:.1f} {l*.25:.1f} {w:.1f} 0 0Z" fill="{fill}"/>')
    if vein:
        s += f'<path d="M1 0L{l*.9:.1f} 0" stroke="{vein}" stroke-width=".6" opacity=".6"/>'
    return s + "</g>"


def blossom(x, y, r, petals=5, fill=WHITE, centre=OCHRE, edge="#b9b294"):
    g = f'<g transform="translate({x} {y})">'
    for i in range(petals):
        g += (f'<ellipse cx="0" cy="{-r*.58:.1f}" rx="{r*.42:.1f}" ry="{r*.58:.1f}" transform="rotate({i*360/petals:.0f})" '
              f'fill="{fill}" stroke="{edge}" stroke-width=".7"/>')
    return g + f'<circle r="{r*.3:.1f}" fill="{centre}"/></g>'


def tile_cross():
    frame = ("M50 9C68 9 76 3 85 15C97 24 91 32 91 50C91 68 97 76 85 85C76 97 68 91 50 91"
             "C32 91 24 97 15 85C3 76 9 68 9 50C9 32 3 24 15 15C24 3 32 9 50 9Z")
    petal = "M50 50C45 44 41 34 41 22L46 26L50 16L54 26L59 22C59 34 55 44 50 50Z"
    corner = f'<path d="M0 0H20C14 4 12 10 13 18C8 13 4 14 0 20Z" fill="{YEL}"/><path d="M0 0H9L0 9Z" fill="{WHITE}"/>'
    return (f'<rect width="100" height="100" fill="{BLUE2}"/>'
            f'<path d="{frame}" fill="{BLUE}" stroke="{GOLD}" stroke-width="2.6"/>'
            + rot(corner, 4, 50, 50)
            + rot(f'<path d="{petal}" fill="{YEL}"/>', 4)
            + rot(f'<path d="M50 50L47 41L50 37L53 41Z" fill="{BLUE}"/>', 4, start=45)
            + f'<circle cx="50" cy="50" r="5.5" fill="{OCHRE}"/>')


def tile_lemon():
    s = f'<rect width="100" height="100" fill="{WHITE}"/>'
    s += f'<path d="M4 6C14 12 22 22 30 34" stroke="#7a5b3a" stroke-width="2.2" fill="none" stroke-linecap="round"/>'
    s += leaf(26, 30, 26, 8, -20, GREEN, GREEN2) + leaf(30, 36, 22, 7, 60, GREEN2, "#3f5a2a")
    s += leaf(60, 78, 24, 8, 10, GREEN, GREEN2) + leaf(58, 80, 20, 7, 120, GREEN2)
    s += ('<g transform="translate(48 56) rotate(-28)">'
          f'<path d="M-24 0L-20 -4C-17 -17 -7 -22 2 -22C13 -22 21 -15 22 -4L26 0L22 4C21 15 13 22 2 22C-9 22 -18 16 -20 4Z" fill="{YEL}"/>'
          f'<path d="M-20 4C-16 15 -6 21 4 21C14 21 21 14 22 4C14 12 -2 14 -20 4Z" fill="{OCHRE}" opacity=".75"/>'
          '<ellipse cx="-4" cy="-10" rx="9" ry="4" fill="#fff6c8" opacity=".7"/>'
          + "".join(f'<circle cx="{x}" cy="{y}" r=".9" fill="#b9771e"/>' for x, y in [(6, 6), (10, 2), (2, 10), (12, 10), (-2, 14), (14, -2)])
          + "</g>")
    s += blossom(72, 22, 9) + blossom(30, 84, 8)
    s += '<path d="M78 34c4-2 8 0 8 4" stroke="#8a6a3a" stroke-width=".9" fill="none"/><path d="M14 66c-3 2-3 6 0 8" stroke="#8a6a3a" stroke-width=".9" fill="none"/>'
    return s


def tile_roundel():
    s = f'<rect width="100" height="100" fill="{WHITE}"/>'
    s += rot(f'<path d="M0 0H16C10 3 6 8 4 16C2 10 1 5 0 0Z" fill="{SKY}"/>', 4, start=0)
    s += f'<circle cx="50" cy="50" r="45" fill="none" stroke="{GOLD}" stroke-width="1.6"/>'
    s += f'<circle cx="50" cy="50" r="37" fill="none" stroke="#7a6a4a" stroke-width=".6"/>'
    for i in range(22):
        a = i / 22 * 2 * math.pi
        x, y = 50 + 37 * math.cos(a), 50 + 37 * math.sin(a)
        s += leaf(x, y, 9, 2.8, math.degrees(a) + 90 + (35 if i % 2 else -35) * (1 if i % 2 else 1), BLUE2)
    s += f'<circle cx="50" cy="50" r="29" fill="none" stroke="{GOLD}" stroke-width="2.2"/>'
    s += f'<circle cx="50" cy="50" r="23" fill="{SKY}"/><circle cx="50" cy="50" r="23" fill="{BLUE2}" opacity=".55"/>'
    s += f'<circle cx="50" cy="50" r="12" fill="{WHITE}"/>'
    s += blossom(50, 50, 9, 4, WHITE, OCHRE, "#7f8fb0")
    return s


def tile_tulip():
    s = f'<rect width="100" height="100" fill="{WHITE}"/>'
    s += f'<path d="M50 8L92 50L50 92L8 50Z" fill="none" stroke="{SKY}" stroke-width="5.5"/>'
    tul = "M50 50C44 45 40 38 42 28C44 24 46 22 46 22L50 27L54 22C54 22 56 24 58 28C60 38 56 45 50 50Z"
    s += rot(f'<path d="{tul}" fill="{OCHRE}"/><path d="M50 46C47 41 46 35 48 30L50 33Z" fill="{YEL}"/>', 4)
    s += rot(leaf(50, 50, 20, 4.5, -45 - 90, GREEN) , 4)
    s += f'<circle cx="50" cy="50" r="3.6" fill="{BLUE}"/>'
    corner = (f'<path d="M0 0C10 0 18 4 18 12C12 10 8 12 6 18C2 14 0 8 0 0Z" fill="{OCHRE}" opacity=".9"/>'
              + leaf(4, 22, 12, 3, 80, GREEN) + leaf(22, 4, 12, 3, 10, GREEN))
    s += rot(corner, 4)
    return s


def tile_lattice():
    s = f'<rect width="100" height="100" fill="{WHITE}"/>'
    for off in (0, 7):
        s += (f'<path d="M50 {0+off}L{100-off} 50L50 {100-off}L{off} 50Z" fill="none" stroke="{SKY}" '
              f'stroke-width="{2.4 if off == 0 else 1.2}"/>')
    s += f'<path d="M0 0L22 22M100 0L78 22M0 100L22 78M100 100L78 78" stroke="{SKY}" stroke-width="1.6"/>'
    s += f'<path d="M50 26L74 50L50 74L26 50Z" fill="none" stroke="#c9b26a" stroke-width="1"/>'
    s += blossom(50, 50, 13, 4, WHITE, OCHRE, "#8a8268")
    for (x, y, a) in [(14, 50, -30), (86, 50, 150), (50, 12, 60), (50, 88, 240)]:
        s += leaf(x, y, 11, 3.5, a, GREEN, GREEN2) + leaf(x, y, 10, 3.2, a + 70, GREEN2)
    s += blossom(0, 0, 9, 4, WHITE, OCHRE, "#8a8268") + blossom(100, 0, 9, 4, WHITE, OCHRE, "#8a8268")
    s += blossom(0, 100, 9, 4, WHITE, OCHRE, "#8a8268") + blossom(100, 100, 9, 4, WHITE, OCHRE, "#8a8268")
    return s


def tile_border():
    s = f'<rect width="100" height="100" fill="{WHITE}"/>'
    s += f'<rect x="16" y="16" width="68" height="68" fill="none" stroke="#c9b26a" stroke-width="1"/>'
    s += f'<rect x="20" y="20" width="60" height="60" fill="none" stroke="{GREEN}" stroke-width=".8"/>'
    garland = ""
    for i in range(9):
        x = 10 + i * 10
        garland += leaf(x - 3, 9, 6, 2.2, -40, BLUE2) + leaf(x - 3, 9, 6, 2.2, 40, SKY)
    garland += f'<path d="M6 9H94" stroke="{BLUE}" stroke-width=".7"/>'
    s += rot(garland, 4)
    for i in range(8):
        s += leaf(50, 50, 16, 4.2, i * 45 + 22, GREEN if i % 2 else GREEN2, GREEN2)
    s += blossom(50, 50, 10, 5)
    return s


TILES = [tile_cross, tile_lemon, tile_roundel, tile_tulip, tile_lattice, tile_border]
N = len(TILES)
parts = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {N*T} {T}" width="{N*T}" height="{T}">',
         '<defs><filter id="paint" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">'
         '<feTurbulence type="fractalNoise" baseFrequency="0.08" numOctaves="3" seed="4" result="n"/>'
         '<feDisplacementMap in="SourceGraphic" in2="n" scale="1.6" xChannelSelector="R" yChannelSelector="G" result="d"/>'
         '<feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="3" seed="9" result="g"/>'
         '<feColorMatrix in="g" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 -0.4 0.32" result="wash"/>'
         '<feBlend in="d" in2="wash" mode="screen"/></filter></defs>',
         '<g filter="url(#paint)">']
for i, t in enumerate(TILES):
    parts.append(f'<g transform="translate({i*T} 0)"><svg width="{T}" height="{T}" viewBox="0 0 100 100" overflow="hidden">{t()}</svg></g>')
parts.append('</g>')
# grout between tiles
parts.append("".join(f'<rect x="{i*T - 1}" y="0" width="2" height="{T}" fill="#e9e4d6"/>' for i in range(N + 1)))
parts.append("</svg>")
open("assets/img/tiles.svg", "w").write("".join(parts))
print("wrote assets/img/tiles.svg")
