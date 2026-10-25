# Paints an Amalfi Coast village (Positano-like) as a watercolor, in numpy.
import cv2, numpy as np, sys
W, H = 2400, 1500
rng = np.random.default_rng(int(sys.argv[2]) if len(sys.argv) > 2 else 3)

def noise(scale, seed=None):
    r = rng if seed is None else np.random.default_rng(seed)
    n = r.random((H // scale + 3, W // scale + 3)).astype(np.float32)
    return cv2.resize(n, (W + 3 * scale, H + 3 * scale), interpolation=cv2.INTER_CUBIC)[:H, :W]

def fbm(scales=(160, 60, 20), weights=(0.55, 0.3, 0.15)):
    return sum(w * noise(s) for s, w in zip(scales, weights))

paper = np.ones((H, W, 3), np.float32) * np.array([241, 246, 250], np.float32) / 255  # BGR ivory
# warp fields reused for wobbly edges
WX = (fbm((90, 30, 10)) - 0.5) * 2
WY = (fbm((90, 30, 10)) - 0.5) * 2
gx, gy = np.meshgrid(np.arange(W, dtype=np.float32), np.arange(H, dtype=np.float32))
GRAN = noise(3)
BLOOM = fbm((220, 80, 30))

def hexc(h):
    h = h.lstrip('#'); return np.array([int(h[4:6], 16), int(h[2:4], 16), int(h[0:2], 16)], np.float32) / 255

def wash(mask, color, op=0.8, wobble=5, soft=1.4, edge=0.45, gran=0.3, var=0.5, cover=0.0):
    m = mask.astype(np.float32)
    if wobble:
        m = cv2.remap(m, gx + WX * wobble, gy + WY * wobble, cv2.INTER_LINEAR)
    m = cv2.GaussianBlur(m, (0, 0), soft)
    e = np.clip(m - cv2.GaussianBlur(m, (0, 0), 5), 0, 1)
    p = op * m * (1 - var / 2 + var * BLOOM) * (1 - gran / 2 + gran * GRAN) + edge * op * e
    p = np.clip(p, 0, 1)[..., None]
    c = hexc(color) if isinstance(color, str) else color
    global paper
    if cover:  # body colour: lays light paint over what is below, like gouache
        q = np.clip(m * cover, 0, 1)[..., None]
        paper = paper * (1 - q) + q * np.array([0.97, 0.98, 0.99], np.float32)
    paper = paper * (1 - p + p * c)

def poly(pts):
    m = np.zeros((H, W), np.uint8)
    cv2.fillPoly(m, [np.array(pts, np.int32)], 1)
    return m

def rect(x, y, w, h):
    return poly([(x, y), (x + w, y), (x + w, y + h), (x, y + h)])

# ---- sky: soft blue from the top, warm near the horizon
HZ = 700
yy = gy / H
sky = np.clip(1 - gy / HZ, 0, 1) ** 1.3
wash(sky * (0.75 + 0.5 * fbm((300, 120, 40))), '#a9c8ea', op=0.55, wobble=0, soft=3, edge=0, gran=0.15)
wash(np.clip(1 - np.abs(gy - 560) / 160, 0, 1) * (gy < HZ), '#f3dfae', op=0.25, wobble=0, soft=8, edge=0)

# ---- distant headlands (left), cool and faded
def ridge(x0, x1, ybase, amp, seed, freq=3):
    xs = np.linspace(x0, x1, 60)
    r = np.random.default_rng(seed)
    ph = r.random(3) * 6
    ys = ybase - amp * (np.sin(np.linspace(0, np.pi, 60)) ** 0.8) * (1 + 0.12 * np.sin(xs / 90 + ph[0]) + 0.06 * np.sin(xs / 31 + ph[1]))
    return [(x0, ybase)] + list(zip(xs, ys)) + [(x1, ybase)]
wash(poly(ridge(-100, 1300, HZ, 230, 1)), '#b7c3d6', op=0.5, wobble=14, soft=3, edge=0.6)
wash(poly(ridge(-200, 800, HZ, 330, 2)), '#9eb0c9', op=0.5, wobble=14, soft=2.5, edge=0.7)
wash(poly(ridge(-300, 420, HZ + 5, 420, 5)), '#7f97b5', op=0.5, wobble=14, soft=2, edge=0.8)

# ---- the village cliff (right): hill from top right down to the sea
t = np.linspace(0, 1, 40)
hx = 2480 - 1400 * t
hy = 150 + 960 * (t ** 1.35) - 90 * np.sin(np.pi * t) + 18 * np.sin(t * 23) + 10 * np.sin(t * 57)
hill = [(2500, 140)] + [(float(a), float(b)) for a, b in zip(hx, hy)] + [(1060, 1180), (2500, 1180)]
# ---- sea
sea = (gy >= HZ).astype(np.float32) * (1 - cv2.GaussianBlur(poly(hill).astype(np.float32), (0, 0), 2))
wash(sea, '#5d93c9', op=0.62, wobble=0, soft=1.2, edge=0, gran=0.2)
wash(sea * np.clip((gy - HZ) / (H - HZ), 0, 1), '#2f68a8', op=0.6, wobble=0, soft=1, edge=0)
# light streaks on the water
streaks = np.zeros((H, W), np.float32)
for i in range(60):
    y = rng.uniform(HZ + 20, H); x = rng.uniform(-100, W); l = rng.uniform(80, 300) * (0.4 + (y - HZ) / (H - HZ))
    m = np.zeros((H, W), np.uint8); cv2.ellipse(m, (int(x), int(y)), (int(l), int(2 + 5 * (y - HZ) / (H - HZ))), 0, 0, 360, 1, -1)
    streaks = np.maximum(streaks, m)
streaks = cv2.remap(streaks, gx + WX * 8, gy + WY * 3, cv2.INTER_LINEAR)
streaks = cv2.GaussianBlur(streaks, (0, 0), 3) * sea
paper = paper + (1 - paper) * streaks[..., None] * 0.35

wash(poly(hill), '#93ad78', op=0.6, wobble=10, soft=3, edge=0.35)
wash(cv2.GaussianBlur(poly(hill).astype(np.float32) * (fbm((70, 25, 8)) > 0.55), (0, 0), 4), '#5f7f45', op=0.4, wobble=8, soft=2.5, edge=0.4)
wash(poly([(2500, 60), (2380, 80), (2250, 150), (2150, 230), (2280, 300), (2500, 330)]), '#8a8f7a', op=0.45, wobble=12, soft=3, edge=0.35)  # rock above town

def hill_x(y):
    pts = np.array(hill[1:41], np.float32)
    return float(np.interp(y, pts[:, 1], pts[:, 0]))

walls = ['#fffaf0', '#f8e6b2', '#f6d571', '#f2c46b', '#eeb36a', '#fbf4e2', '#f7dc93', '#f1e3c4', '#fff3d6', '#e9a35a', '#f4cf86', '#cfe0e8']
roofs = ['#c56a3e', '#b8623f', '#d08454', '#efe6d4']
houses = []
y = 330
while y < 1100:
    x = hill_x(y) + rng.uniform(20, 70)
    while x < 2420:
        sc = 0.6 + 0.5 * (y - 330) / 770
        w = rng.uniform(46, 110) * sc; h = rng.uniform(40, 80) * sc
        if rng.random() < 0.82:
            houses.append((x, y, w, h))
        x += w + rng.uniform(-8, 26)
    y += rng.uniform(26, 44) * (0.6 + 0.5 * (y - 330) / 770)
houses.sort(key=lambda b: b[1])
for (x, y, w, h) in houses:
    col = walls[rng.integers(len(walls))]
    depth = (y - 330) / 770  # 0 far up the hill, 1 by the sea
    wash(rect(x, y, w, h), col, op=0.55 + 0.35 * depth, wobble=2.5, soft=1.6 - 0.6 * depth, edge=0.5, gran=0.2, cover=0.85)
    # shade side
    wash(rect(x + w * 0.72, y, w * 0.28, h), '#9fb2c8', op=0.22, wobble=1.5, soft=1, edge=0)
    r = rng.random()
    if r < 0.3:
        wash(poly([(x - 3, y + 2), (x + w + 3, y + 2), (x + w * 0.5, y - h * 0.22)]), roofs[rng.integers(3)], op=0.75, wobble=2, soft=1, edge=0.4)
    elif r < 0.55:
        wash(rect(x - 2, y - 5, w + 4, 7), roofs[rng.integers(4)], op=0.6, wobble=1.5, soft=1, edge=0.3)
    # windows and green shutters
    nw = max(1, int(w // 24)); rows = max(1, int(h // 30))
    for i in range(nw):
        for j in range(rows):
            if rng.random() < 0.45:
                wx = x + 6 + i * (w - 12) / max(1, nw) + 3; wy = y + 8 + j * 24 * sc
                c = '#3d5a3a' if rng.random() < 0.5 else '#2c3e66'
                wash(rect(wx, wy, 6 * sc + 2, 10 * sc + 2), c, op=0.55, wobble=1, soft=0.8, edge=0.2, gran=0.1)
    # greenery between houses
    if rng.random() < 0.35:
        cx, cy = x + rng.uniform(0, w), y + h * rng.uniform(0.6, 1.0)
        m = np.zeros((H, W), np.uint8); cv2.ellipse(m, (int(cx), int(cy)), (int(rng.uniform(14, 30)), int(rng.uniform(10, 18))), 0, 0, 360, 1, -1)
        wash(m, '#5f7f45' if rng.random() < 0.6 else '#7a9a55', op=0.75, wobble=5, soft=1.5, edge=0.5)
    if rng.random() < 0.06:  # cypress
        cx = x + rng.uniform(0, w)
        m = np.zeros((H, W), np.uint8); cv2.ellipse(m, (int(cx), int(y)), (9, 46), 0, 0, 360, 1, -1)
        wash(m, '#3f5a35', op=0.8, wobble=3, soft=1.2, edge=0.5)

# ---- the church with its majolica dome
cx, cy = 1640, 930
wash(rect(cx - 70, cy - 10, 140, 120), '#fbf1d6', op=0.9, wobble=2, soft=1, edge=0.5)
wash(rect(cx + 40, cy - 70, 40, 180), '#f5e2b4', op=0.9, wobble=2, soft=1, edge=0.5)  # bell tower
wash(rect(cx + 50, cy - 50, 20, 26), '#2c3e66', op=0.6, wobble=1, soft=0.8, edge=0.2)
dome = np.zeros((H, W), np.uint8); cv2.ellipse(dome, (cx - 10, cy - 10), (64, 72), 0, 180, 360, 1, -1)
wash(dome, '#f2c94c', op=0.9, wobble=1.5, soft=1, edge=0.5, cover=0.9)
for k, (rx, col) in enumerate([(52, '#3f8a5a'), (34, '#22489a'), (16, '#3f8a5a')]):
    m = np.zeros((H, W), np.uint8); cv2.ellipse(m, (cx - 10, cy - 10), (rx, 72), 0, 180, 360, 1, 5)
    wash(m * dome, col, op=0.6, wobble=0.8, soft=1, edge=0.1)
m = np.zeros((H, W), np.uint8); cv2.line(m, (cx - 10, cy - 82), (cx - 10, cy - 10), 1, 5)
wash(m * dome, '#22489a', op=0.6, wobble=0.8, soft=1, edge=0.1)
wash(rect(cx - 16, cy - 98, 12, 20), '#f8eccc', op=0.9, wobble=1, soft=0.8, edge=0.4)

# ---- a low sea wall of rock under the town
pts = [(1080, 1150)] + [(x, 1108 + 10 * np.sin(x / 53) + rng.uniform(-4, 4)) for x in np.linspace(1110, 2500, 30)] + [(2500, 1160)]
wash(poly(pts), '#c8b28c', op=0.55, wobble=4, soft=1.5, edge=0.5, cover=0.4)

# ---- beach with umbrellas, then boats
wash(poly([(1020, 1150), (1300, 1120), (1700, 1125), (2100, 1135), (2500, 1140), (2500, 1185), (1050, 1195)]), '#d8c6a0', op=0.75, wobble=4, soft=1.2, edge=0.4)
for i in range(46):
    ux = rng.uniform(1140, 2350); uy = rng.uniform(1118, 1150)
    m = np.zeros((H, W), np.uint8); cv2.ellipse(m, (int(ux), int(uy)), (13, 7), 0, 180, 360, 1, -1)
    wash(m, ['#e08a3c', '#22489a', '#f2c94c', '#3f8a8f'][rng.integers(4)], op=0.85, wobble=1, soft=0.8, edge=0.3)
for i in range(16):
    bx = rng.uniform(150, 2200); by = rng.uniform(HZ + 80, H - 60); s = 0.6 + (by - HZ) / (H - HZ)
    wash(poly([(bx, by), (bx + 46 * s, by), (bx + 38 * s, by + 10 * s), (bx + 6 * s, by + 10 * s)]), '#fbfbf6', op=0.95, wobble=0.5, soft=0.7, edge=0.2)
    paper[int(by + 10 * s):int(by + 13 * s), int(bx + 4):int(bx + 40 * s)] *= 0.9

# ---- overall: paper grain, gentle vignette of pigment pooling
paper *= (0.965 + 0.05 * GRAN[..., None])
out = np.clip(paper * 255, 0, 255).astype(np.uint8)
out = cv2.resize(out[:1280], (1800, 960), interpolation=cv2.INTER_AREA)
cv2.imwrite(sys.argv[1], out, [cv2.IMWRITE_JPEG_QUALITY, 84])
