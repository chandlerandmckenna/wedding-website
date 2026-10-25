"""Draw the venue by hand, as an SVG ink-and-watercolor illustration in the
style of a painted save-the-date card: the Bay of Naples and the Sorrento
cliffs, the pink villa with its bougainvillea, olive trees, dinner tables
under string lights and a corner of the pool.

Every stroke is placed here (traced by eye from the venue photos) and given a
little hand wobble; the washes get ragged, uneven edges from SVG filters.

    python3 tools/draw-venue.py <out.svg> [--seed N]

Render to an image with tools/render-svg.js.
"""
import argparse
import math
import random

ap = argparse.ArgumentParser()
ap.add_argument("out")
ap.add_argument("--seed", type=int, default=11)
args = ap.parse_args()
R = random.Random(args.seed)

W, H = 1600, 1100
INK = "#2c3446"
out = []


def fmt(v):
    return f"{v:.1f}"


def resample(pts, step=7):
    res = [pts[0]]
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
        d = math.hypot(x1 - x0, y1 - y0)
        n = max(1, int(d / step))
        for k in range(1, n + 1):
            res.append((x0 + (x1 - x0) * k / n, y0 + (y1 - y0) * k / n))
    return res


def wobble(pts, amp=1.1, step=7):
    pts = resample(pts, step)
    ph1, ph2 = R.random() * 6.3, R.random() * 6.3
    f1, f2 = R.uniform(0.15, 0.3), R.uniform(0.35, 0.6)
    res = []
    for i, (x, y) in enumerate(pts):
        res.append((x + amp * (math.sin(i * f1 + ph1) * 0.7 + R.uniform(-0.3, 0.3)),
                    y + amp * (math.sin(i * f2 + ph2) * 0.7 + R.uniform(-0.3, 0.3))))
    return res


def smooth_d(pts, closed=False):
    if len(pts) < 3:
        return "M" + " L".join(f"{fmt(x)} {fmt(y)}" for x, y in pts)
    d = f"M{fmt(pts[0][0])} {fmt(pts[0][1])}"
    for i in range(1, len(pts) - 1):
        mx, my = (pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2
        d += f" Q{fmt(pts[i][0])} {fmt(pts[i][1])} {fmt(mx)} {fmt(my)}"
    d += f" L{fmt(pts[-1][0])} {fmt(pts[-1][1])}"
    return d + (" Z" if closed else "")


def ink(pts, w=2.0, color=INK, op=0.92, over=True, amp=1.0):
    """A pen line; hand-drawn lines run a little past their corners."""
    pts = list(pts)
    if over and len(pts) >= 2:
        (x0, y0), (x1, y1) = pts[0], pts[1]
        d = math.hypot(x1 - x0, y1 - y0) or 1
        e = R.uniform(2, 7)
        pts[0] = (x0 - (x1 - x0) / d * e, y0 - (y1 - y0) / d * e)
        (x0, y0), (x1, y1) = pts[-1], pts[-2]
        d = math.hypot(x1 - x0, y1 - y0) or 1
        e = R.uniform(2, 7)
        pts[-1] = (x0 - (x1 - x0) / d * e, y0 - (y1 - y0) / d * e)
    out.append(f'<path d="{smooth_d(wobble(pts, amp))}" fill="none" stroke="{color}" '
               f'stroke-width="{w * R.uniform(0.85, 1.15):.2f}" stroke-linecap="round" stroke-linejoin="round" opacity="{op}"/>')


def wash(pts, color, op=0.6, filt="wash", rim=True, amp=2.0):
    d = smooth_d(wobble(pts, amp, 10), closed=True)
    out.append(f'<path d="{d}" fill="{color}" opacity="{op}" filter="url(#{filt})"/>')
    if rim:   # pigment dries darker at the edge of a wash
        out.append(f'<path d="{d}" fill="none" stroke="{color}" stroke-width="2.2" opacity="{op * 0.55:.2f}" filter="url(#{filt})"/>')


def blob(cx, cy, r, color, op=0.6, filt="wash", squash=1.0, rim=True):
    n = 14
    pts = []
    for k in range(n):
        a = 2 * math.pi * k / n
        rr = r * R.uniform(0.72, 1.12)
        pts.append((cx + rr * math.cos(a), cy + rr * squash * math.sin(a)))
    wash(pts, color, op, filt, rim=rim, amp=1.2)


def rect(x, y, w, h):
    return [(x, y), (x + w, y), (x + w, y + h), (x, y + h)]


def ink_rect(x, y, w, h, wd=1.5, color=INK, op=0.9):
    ink([(x, y), (x + w, y)], wd, color, op)
    ink([(x + w, y), (x + w, y + h)], wd, color, op)
    ink([(x, y + h), (x + w, y + h)], wd, color, op)
    ink([(x, y), (x, y + h)], wd, color, op)


def curls(cx, cy, rx, ry, n, color="#2f4a2c", w=1.3, op=0.85):
    """Pen marks for foliage: a few loose loops, dark dabs and flicks, never in a row."""
    for _ in range(n):
        x0, y0 = cx + R.gauss(0, rx * 0.5), cy + R.gauss(0, ry * 0.5)
        kind = R.random()
        if kind < 0.3:      # a loose loop or two
            r = R.uniform(2.5, 6)
            pts = []
            turns = R.uniform(1.2, 2.2)
            ang0 = R.uniform(0, 6.3)
            for k in range(int(turns * 12)):
                a = ang0 + k / 12 * 2 * math.pi
                rr = r * R.uniform(0.7, 1.2)
                pts.append((x0 + k * R.uniform(0.4, 1.4) + rr * math.cos(a), y0 + rr * 0.75 * math.sin(a)))
            out.append(f'<path d="{smooth_d(pts)}" fill="none" stroke="{color}" stroke-width="{w * R.uniform(0.7, 1.1):.2f}" '
                       f'stroke-linecap="round" opacity="{op * R.uniform(0.6, 1):.2f}"/>')
        elif kind < 0.75:   # a dark dab of shadow pigment
            n_ = 8
            r = R.uniform(2.5, 6)
            pts = [(x0 + r * R.uniform(0.6, 1.3) * math.cos(2 * math.pi * k / n_), y0 + r * 0.7 * R.uniform(0.6, 1.3) * math.sin(2 * math.pi * k / n_)) for k in range(n_)]
            out.append(f'<path d="{smooth_d(pts, True)}" fill="{color}" opacity="{op * R.uniform(0.45, 0.8):.2f}"/>')
        else:               # a quick flick
            a = R.uniform(-2.6, -0.5); L = R.uniform(5, 12)
            ink([(x0, y0), (x0 + L * math.cos(a) * 0.5, y0 + L * math.sin(a) * 0.5 + 1), (x0 + L * math.cos(a), y0 + L * math.sin(a))], w, color, op * 0.8, over=False, amp=0.3)


# ------------------------------------------------------------------ defs
out.append(f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">
<defs>
  <filter id="wash" x="-10%" y="-10%" width="120%" height="120%">
    <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="3" seed="4" result="n"/>
    <feDisplacementMap in="SourceGraphic" in2="n" scale="9" xChannelSelector="R" yChannelSelector="G" result="d"/>
    <feTurbulence type="fractalNoise" baseFrequency="0.011" numOctaves="2" seed="9" result="p"/>
    <feColorMatrix in="p" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -0.7 1.3" result="pa"/>
    <feComposite in="d" in2="pa" operator="in"/>
  </filter>
  <filter id="soft" x="-10%" y="-10%" width="120%" height="120%">
    <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="2" seed="2" result="n"/>
    <feDisplacementMap in="SourceGraphic" in2="n" scale="16" xChannelSelector="R" yChannelSelector="G" result="d"/>
    <feGaussianBlur in="d" stdDeviation="1.2"/>
  </filter>
  <filter id="glow"><feGaussianBlur stdDeviation="5"/></filter>
  <filter id="paper" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed="5" result="g"/>
    <feColorMatrix in="g" type="matrix" values="0 0 0 0 0.45  0 0 0 0 0.42  0 0 0 0 0.38  0 0 0 0.07 0"/>
  </filter>
</defs>
<rect width="{W}" height="{H}" fill="#fbf9f4"/>
''')

# ------------------------------------------------------------------ sky
out.append('<linearGradient id="skyg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9ebfe6"/><stop offset="1" stop-color="#d9e7f4"/></linearGradient>')
wash([(-20, -20), (W + 20, -20), (W + 20, 560), (-20, 560)], "url(#skyg)", 0.85, "soft", rim=False, amp=4)
for _ in range(5):   # loose horizontal brush marks in the sky
    y = R.uniform(40, 300); x = R.uniform(0, W - 400)
    wash([(x, y), (x + R.uniform(250, 520), y - 6), (x + R.uniform(250, 520), y + 14), (x, y + 18)], "#b9d1ec", 0.35, "soft", rim=False)

# far mountains across the bay (left), pale and blue
far = [(0, 498), (90, 486), (170, 492), (260, 474), (360, 486), (460, 480), (560, 496), (660, 512), (700, 528)]
wash(far + [(700, 548), (0, 548)], "#9fb0d6", 0.45)
ink(far[:5], 1.1, "#5a6a94", 0.6)
ink(far[5:], 1.1, "#5a6a94", 0.55)

# the mountain behind Sorrento
mount = [(640, 552), (690, 522), (750, 478), (820, 430), (900, 382), (990, 340), (1090, 300), (1200, 268), (1320, 246), (1450, 228), (1600, 214)]
wash(mount + [(1600, 560), (640, 560)], "#7f9bd0", 0.55)
wash([(760, 520), (900, 420), (1100, 340), (1400, 268), (1600, 250), (1600, 470), (900, 500)], "#6f89c2", 0.3, rim=False)
ink(mount[:6], 2.2)
ink(mount[5:], 2.2)
ink([(p[0] + 3, p[1] + 4) for p in mount[2:7]], 1.0, INK, 0.5)
for _ in range(22):   # green on the lower slopes
    x = R.uniform(700, 1600); ytop = 560 - (x - 640) * 0.35 + 40
    blob(x, R.uniform(max(ytop, 380), 470), R.uniform(14, 30), R.choice(["#7d9a6a", "#6f8e63", "#8fa77a"]), 0.25, squash=0.4, rim=False)
for _ in range(14):   # ridges
    x = R.uniform(820, 1580); y = 470 - (x - 640) * 0.3 + R.uniform(10, 60)
    ink([(x, y), (x + R.uniform(-30, 30), y + R.uniform(18, 40))], 0.9, "#4a5c8c", 0.5)

# the cliff with Sorrento on top
plateau = [(905, 560), (912, 506), (950, 492), (1060, 486), (1200, 480), (1340, 476), (1480, 472), (1600, 468)]
wash(plateau + [(1600, 562), (905, 562)], "#e6c99c", 0.75)
wash([(910, 530), (1600, 515), (1600, 562), (910, 562)], "#d2a774", 0.4, rim=False)
ink(plateau, 1.6)
for _ in range(40):   # cliff face strata
    x = R.uniform(915, 1595)
    ink([(x, R.uniform(500, 515)), (x + R.uniform(-3, 3), R.uniform(535, 558))], 0.9, "#8a6a48", 0.55, over=False)
# houses along the cliff top
x = 925
while x < 1590:
    w = R.uniform(14, 30); h = R.uniform(10, 24)
    yb = 498 - (x - 905) * 0.035 + R.uniform(-2, 3)
    col = R.choice(["#f6efe2", "#f2dfb8", "#efc58f", "#f4e7cf", "#e9b57e", "#fbf6ec"])
    wash(rect(x, yb - h, w, h), col, 0.9, rim=False, amp=0.6)
    ink([(x, yb - h), (x + w, yb - h)], 0.9, INK, 0.7)
    ink([(x + w, yb - h), (x + w, yb)], 0.8, INK, 0.6)
    for k in range(int(w // 8)):
        ink([(x + 4 + k * 7, yb - h + 4), (x + 4 + k * 7, yb - h + 8)], 1.2, "#4a5a7a", 0.7, over=False)
    if R.random() < 0.35:
        blob(x + w + 4, yb - 6, R.uniform(6, 11), "#6f8f52", 0.7)
    x += w + R.uniform(-2, 6)

# ------------------------------------------------------------------ the bay
wash([(0, 546), (W, 546), (W, 800), (0, 800)], "#5f97cf", 0.55, rim=False, amp=3)
wash([(0, 556), (W, 560), (W, 640), (0, 630)], "#7fb0de", 0.45, rim=False)
wash([(0, 680), (W, 690), (W, 800), (0, 800)], "#3f7cbf", 0.35, rim=False)
for _ in range(34):   # ripples
    x = R.uniform(0, W - 60); y = R.uniform(575, 760); L = R.uniform(25, 90)
    ink([(x, y), (x + L, y + R.uniform(-2, 2))], 1.1, "#2f5f99", 0.45, over=False)
ink([(0, 548), (640, 550)], 1.0, "#3f5f8f", 0.5)


def sailboat(x, y, s):
    wash([(x, y - 62 * s), (x + 26 * s, y - 4), (x, y - 4)], "#ffffff", 1, rim=False, amp=0.4)
    wash([(x - 3, y - 50 * s), (x - 3, y - 5), (x - 20 * s, y - 5)], "#ffffff", 1, rim=False, amp=0.4)
    ink([(x, y - 64 * s), (x, y)], 1.2)
    ink([(x, y - 62 * s), (x + 26 * s, y - 4)], 1.0)
    ink([(x - 3, y - 50 * s), (x - 20 * s, y - 5)], 1.0)
    ink([(x - 24 * s, y), (x + 28 * s, y), (x + 20 * s, y + 8 * s), (x - 17 * s, y + 8 * s), (x - 24 * s, y)], 1.3)
    ink([(x - 30 * s, y + 12 * s), (x + 30 * s, y + 13 * s)], 0.9, "#2f5f99", 0.5, over=False)


sailboat(170, 640, 1.2)
sailboat(420, 600, 0.85)
sailboat(760, 612, 0.9)

# ------------------------------------------------------------------ olive grove behind the tables
def olive(cx, cy, r, trunk=True):
    for k in range(11):
        blob(cx + R.uniform(-r, r) * 0.95, cy + R.uniform(-r, r) * 0.5, r * R.uniform(0.38, 0.62),
             R.choice(["#93a86e", "#7f9a5d", "#a9b884", "#6e8a50"]), R.uniform(0.55, 0.75), squash=0.75)
    curls(cx, cy + r * 0.12, r * 0.9, r * 0.45, int(r / 3), "#2f4a2a", 1.2, 0.8)
    for k in range(R.randint(2, 4)):   # a few quick outline arcs along the top of the canopy
        a0 = R.uniform(math.pi * 1.05, math.pi * 1.6); a1 = a0 + R.uniform(0.4, 0.9)
        pts = [(cx + r * 1.0 * math.cos(a0 + (a1 - a0) * t / 8), cy + r * 0.55 * math.sin(a0 + (a1 - a0) * t / 8)) for t in range(9)]
        ink(pts, 1.4, "#2f4a2a", 0.75, over=False)
    if trunk:
        bx = cx + R.uniform(-8, 8)
        for side in (-1, 1):
            ink([(bx + side * 5, cy + r * 0.45), (bx + side * 7 + R.uniform(-4, 4), cy + r * 0.7), (bx + side * 6, cy + r * 0.95)], 1.5, "#4a3f36", 0.85)
        wash([(bx - 5, cy + r * 0.45), (bx + 5, cy + r * 0.45), (bx + 7, cy + r * 0.95), (bx - 7, cy + r * 0.95)], "#8b7b68", 0.6, rim=False, amp=0.8)


wash([(0, 760), (1100, 760), (1100, 1100), (0, 1100)], "#a9c47e", 0.45, rim=False, amp=3)   # lawn
wash([(0, 840), (1000, 830), (1000, 1100), (0, 1100)], "#93b56b", 0.35, rim=False)
for cx, cy, r in [(30, 730, 92), (170, 712, 100), (330, 728, 92), (480, 706, 100), (640, 726, 94), (800, 712, 100), (950, 730, 96), (1060, 742, 80)]:
    olive(cx, cy, r)

# ------------------------------------------------------------------ string lights and tables
lights = []
for (xa, xb, ya, sag) in [(20, 560, 812, 34), (520, 1040, 806, 30), (90, 900, 868, 40)]:
    pts = [(xa + (xb - xa) * t, ya + 4 * sag * t * (1 - t)) for t in [k / 40 for k in range(41)]]
    ink(pts, 0.9, "#3b3a3a", 0.6, over=False)
    lights += pts[1:-1:2]
for x, y in lights:
    out.append(f'<circle cx="{fmt(x)}" cy="{fmt(y + 4)}" r="9" fill="#ffd36a" opacity="0.45" filter="url(#glow)"/>')
    out.append(f'<circle cx="{fmt(x)}" cy="{fmt(y + 4)}" r="2.6" fill="#fff3c4"/>')

rows = [(880, 6, 150, 860), (930, 6, 120, 880), (985, 5, 140, 900), (1050, 4, 160, 920)]
for y, n, x0, x1 in rows:
    rx = 24 + (y - 860) * 0.17
    for k in range(n):
        x = x0 + (x1 - x0) * (k + 0.5) / n + R.uniform(-10, 10)
        yy = y + R.uniform(-6, 6)
        # chairs: little gold ticks around the table
        for a in range(10):
            ang = math.pi * 2 * a / 10 + 0.3
            cx_, cy_ = x + (rx + 6) * math.cos(ang), yy + (rx * 0.42 + 4) * math.sin(ang)
            if math.sin(ang) < -0.2:
                continue   # chairs behind the table are hidden by the cloth
            ink([(cx_ - 2.5, cy_ + 2), (cx_ - 2.5, cy_ - 5), (cx_ + 2.5, cy_ - 5), (cx_ + 2.5, cy_ + 2)], 1.0, "#a5844d", 0.85, over=False, amp=0.2)
        cloth = [(x + rx * math.cos(t / 12 * math.pi), yy + rx * 0.4 * math.sin(t / 12 * math.pi)) for t in range(0, 13)]
        skirt = [(x - rx, yy), (x - rx * 0.96, yy + rx * 0.45)] + [(x + rx * math.cos(t / 12 * math.pi), yy + rx * 0.45 + rx * 0.4 * math.sin(t / 12 * math.pi)) for t in range(12, -1, -1)] + [(x + rx, yy)]
        wash(skirt, "#c9d3e3", 0.6, rim=False, amp=0.6)
        wash([(x + rx * math.cos(t / 12 * math.pi * 2), yy + rx * 0.4 * math.sin(t / 12 * math.pi * 2)) for t in range(12)], "#ffffff", 1, rim=False, amp=0.5)
        ink([(x + rx * math.cos(t / 16 * math.pi * 2), yy + rx * 0.4 * math.sin(t / 16 * math.pi * 2)) for t in range(17)], 1.1, INK, 0.75, over=False)
        ink([(x - rx * 0.97, yy + 2), (x - rx * 0.95, yy + rx * 0.45)], 0.9, INK, 0.6, over=False)
        ink([(x + rx * 0.97, yy + 2), (x + rx * 0.95, yy + rx * 0.45)], 0.9, INK, 0.6, over=False)
        for f in range(3):   # flowers and candles
            blob(x + R.uniform(-rx * 0.4, rx * 0.4), yy + R.uniform(-3, 2), R.uniform(2.5, 4.5), R.choice(["#e9a23b", "#f0c94e", "#d9785a", "#f4e2a1"]), 0.9, rim=False)

# ------------------------------------------------------------------ the pool, bottom left
pool = [(-20, 1040), (60, 1020), (180, 1022), (260, 1004), (360, 1000), (460, 1018), (520, 1060), (540, 1110), (-20, 1110)]
wash([(x, y - 16) for x, y in pool[:-2]] + [(560, 1110), (-20, 1110)], "#d98a5c", 0.7)   # terracotta edge
wash(pool, "#3f86c9", 0.75)
wash([(40, 1050), (300, 1030), (480, 1060), (500, 1100), (40, 1100)], "#2a6fb3", 0.35, rim=False)
ink(pool[:-1], 1.6)
ink([(x, y - 16) for x, y in pool[:-2]], 1.2, INK, 0.7)
for k in range(9):
    x = 20 + k * 58
    ink([(x, 1018 - (8 if 200 < x < 400 else 0)), (x + 8, 1004 - (8 if 200 < x < 400 else 0))], 1.0, "#8a4a2a", 0.6, over=False)
for _ in range(8):
    x = R.uniform(60, 460); y = R.uniform(1040, 1090)
    ink([(x, y), (x + R.uniform(20, 50), y + R.uniform(-2, 2))], 1.4, "#e7f1fb", 0.9, over=False)

# ------------------------------------------------------------------ the grove continues behind the villa
wash([(1100, 760), (W, 760), (W, 1040), (1100, 1040)], "#a9c47e", 0.45, rim=False, amp=3)
for cx, cy, r in [(1180, 724, 90), (1330, 716, 96), (1480, 728, 100), (1590, 736, 90)]:
    olive(cx, cy, r)

# ------------------------------------------------------------------ the villa
PINK, PINK2 = "#efa9a0", "#dc8f88"
TERRA = "#cf6f3e"
# courtyard
wash([(940, 1040), (W, 1036), (W, 1100), (920, 1100)], "#d9d4c8", 0.75, rim=False)
for k in range(10):
    x = 950 + k * 66
    ink([(x, 1046), (x - 14, 1100)], 0.9, "#8a8478", 0.5, over=False)
ink([(940, 1068), (W, 1066)], 0.9, "#8a8478", 0.5, over=False)

# porch wing on the left
wash(rect(985, 880, 105, 160), PINK, 0.95)
wash([(965, 884), (1095, 856), (1100, 880), (970, 900)], TERRA, 0.85)
ink([(965, 884), (1095, 856)], 1.6); ink([(970, 900), (1100, 880)], 1.4)
for k in range(8):
    ink([(975 + k * 16, 897 - k * 3.4), (972 + k * 16, 886 - k * 3.4)], 1.0, "#7a3a20", 0.7, over=False)
wash(rect(1000, 915, 75, 110), "#7f9fb4", 0.55)    # glass porch
ink_rect(1000, 915, 75, 110, 1.3)
ink([(1037, 915), (1037, 1025)], 1.0)
ink([(985, 880), (985, 1040)], 1.5)

# main house and tower
wash(rect(1090, 655, 350, 385), PINK, 0.95)
wash(rect(1090, 655, 70, 385), PINK2, 0.5, rim=False)     # shade side
wash(rect(1185, 585, 150, 75), PINK, 0.95)
ink([(1090, 660), (1090, 1040)], 2.2); ink([(1440, 660), (1440, 1040)], 2.2)
ink([(1093, 700), (1092, 900)], 1.0, INK, 0.5); ink([(1437, 680), (1438, 960)], 1.0, INK, 0.5)
ink([(1185, 588), (1185, 652)], 1.5); ink([(1335, 588), (1335, 652)], 1.5)
# roofs: terracotta eaves with a white cornice beneath
for (x0, x1, y) in [(1070, 1460, 640), (1170, 1350, 572)]:
    wash([(x0, y + 14), (x1, y + 14), (x1 - 12, y - 4), (x0 + 12, y - 4)], TERRA, 0.9)
    ink([(x0 + 12, y - 4), (x1 - 12, y - 4)], 1.4); ink([(x0, y + 14), (x1, y + 14)], 1.6)
    for k in range(int((x1 - x0) / 13)):
        xx = x0 + 6 + k * 13
        ink([(xx, y + 14), (xx + 6, y + 20), (xx + 12, y + 14)], 1.0, "#7a3a20", 0.75, over=False)
    ink([(x0 + 6, y + 24), (x1 - 6, y + 24)], 1.1, INK, 0.7)

# windows: white stone frames, wooden shutters
def window(x, y, w, h, arch=False):
    wash(rect(x - 7, y - 7, w + 14, h + 14), "#ffffff", 1, rim=False, amp=0.5)
    wash(rect(x, y, w, h), "#9b6a44", 0.75, rim=False, amp=0.5)
    wash(rect(x + 3, y + 4, w / 2 - 4, h - 8), "#6f8fa8", 0.6, rim=False, amp=0.4)
    if arch:
        ink([(x - 7, y + 4), (x - 7, y - 4)] + [(x + w / 2 + (w / 2 + 7) * math.cos(math.pi - t / 10 * math.pi), y - 4 - (w / 2 + 7) * 0.7 * math.sin(t / 10 * math.pi)) for t in range(11)] + [(x + w + 7, y + 4)], 1.3, INK, 0.85, over=False)
    else:
        ink_rect(x - 7, y - 7, w + 14, h + 14, 1.2, INK, 0.8)
    ink_rect(x, y, w, h, 1.0, INK, 0.75)
    ink([(x + w / 2, y), (x + w / 2, y + h)], 0.9, INK, 0.7)
    ink([(x - 10, y + h + 9), (x + w + 10, y + h + 9)], 1.3, INK, 0.8)


window(1240, 598, 40, 44)
for (x, y, arch) in [(1120, 690, False), (1243, 680, True), (1370, 690, False),
                     (1120, 800, False), (1243, 795, True), (1370, 800, False),
                     (1125, 925, False), (1375, 925, False)]:
    window(x, y, 36 if not arch else 34, 58 if not arch else 52, arch)
# balcony on the tower window
ink([(1228, 652), (1292, 652)], 1.4)
for k in range(7):
    ink([(1232 + k * 9.5, 652), (1232 + k * 9.5, 636)], 0.9, INK, 0.75, over=False)

# the arched front door in its grey stone surround
wash([(1228, 1040), (1228, 965), (1265, 940), (1302, 965), (1302, 1040)], "#8e8a84", 0.7)
wash([(1240, 1040), (1240, 972), (1265, 955), (1290, 972), (1290, 1040)], "#b0743f", 0.85)
ink([(1228, 1040), (1228, 965), (1265, 938), (1302, 965), (1302, 1040)], 1.5)
ink([(1240, 1040), (1240, 972), (1265, 955), (1290, 972), (1290, 1040)], 1.2)
ink([(1265, 958), (1265, 1040)], 1.0)

# vines and bougainvillea climbing the front
vine_pts = [(1265, 940), (1250, 880), (1275, 830), (1250, 760), (1280, 700), (1258, 660), (1300, 620)]
for (x, y) in vine_pts:
    for _ in range(5):
        blob(x + R.uniform(-48, 48), y + R.uniform(-30, 30), R.uniform(10, 20), R.choice(["#5f8a45", "#4c7a3c", "#79a05a"]), 0.75)
for (x, y) in [(1105, 760), (1110, 860), (1150, 980), (1210, 740), (1330, 840), (1405, 770), (1420, 870), (1060, 980)]:
    for _ in range(4):
        blob(x + R.uniform(-30, 30), y + R.uniform(-40, 40), R.uniform(9, 16), R.choice(["#5f8a45", "#4c7a3c"]), 0.7)
for (x, y) in [(1100, 720), (1112, 780), (1100, 850), (1135, 900), (1205, 860), (1330, 760), (1418, 820), (1430, 760), (1400, 900), (1180, 1000), (1340, 990)]:
    for _ in range(6):
        blob(x + R.uniform(-22, 22), y + R.uniform(-26, 26), R.uniform(4, 8), R.choice(["#c2357a", "#d14b8e", "#a82a6a"]), 0.85, rim=False)
curls(1265, 800, 70, 150, 70, "#24401f", 1.2, 0.85)
curls(1120, 820, 30, 110, 26, "#24401f", 1.1, 0.8)
curls(1410, 820, 30, 100, 26, "#24401f", 1.1, 0.8)

# terracotta pots, a white bench
for (x, s) in [(1000, 1.0), (1040, 0.8), (1460, 1.1)]:
    wash([(x - 14 * s, 1040), (x - 18 * s, 1008), (x + 18 * s, 1008), (x + 14 * s, 1040)], "#d07a48", 0.85)
    ink([(x - 14 * s, 1040), (x - 18 * s, 1008), (x + 18 * s, 1008), (x + 14 * s, 1040)], 1.2)
    blob(x, 996, 14 * s, "#6f9a55", 0.75)
ink([(1340, 1012), (1400, 1012)], 1.6, "#55606e"); ink([(1340, 994), (1340, 1036)], 1.3, "#55606e"); ink([(1400, 994), (1400, 1036)], 1.3, "#55606e")
for k in range(5):
    ink([(1348 + k * 12, 996), (1348 + k * 12, 1010)], 0.9, "#55606e", 0.8, over=False)

# paper grain over everything
out.append(f'<rect width="{W}" height="{H}" filter="url(#paper)"/>')
out.append("</svg>")
open(args.out, "w").write("\n".join(out))
print("wrote", args.out)
