"""Paint a venue photo as a sunny, painterly view (lemon branches are added by the page).

    python3 tools/paint-venue.py <photo> <out.jpg> <top> <bottom> [seed] [extras]

extras: none, or villa:<photo>:<x>,<y>,<w>,<h>:<cx>,<cy>,<width>, which lifts
that box out of another photo (a villa in its trees) and blends it into the
view, centred at cx,cy (fractions of the view) and scaled to width px.

Needs opencv-python-headless and numpy.
"""
import sys
import cv2
import numpy as np

src, out, y0, y1 = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
rng = np.random.default_rng(int(sys.argv[5]) if len(sys.argv) > 5 else 4)
extras = sys.argv[6] if len(sys.argv) > 6 else "none"
VIVID = float(sys.argv[8]) if len(sys.argv) > 8 else 1.0   # extra colour saturation
TOWN_SOFT = float(sys.argv[7]) if len(sys.argv) > 7 else 1.2   # blur of the pastel town; higher is softer

img = cv2.imread(src)[y0:y1]
W = 1800
img = cv2.resize(img, (W, int(img.shape[0] * W / img.shape[1])), interpolation=cv2.INTER_CUBIC)
H = img.shape[0]

if extras.startswith("villa:"):
    _, vsrc, box, at = extras.split(":")
    bx, by, bw, bh = map(int, box.split(","))
    cx, cy, vw = map(float, at.split(","))
    patch = cv2.imread(vsrc)[by:by + bh, bx:bx + bw]
    vh = int(bh * vw / bw); vw = int(vw)
    patch = cv2.resize(patch, (vw, vh), interpolation=cv2.INTER_CUBIC).astype(np.float32)
    m = np.zeros((vh, vw), np.float32)
    cv2.ellipse(m, (vw // 2, vh // 2), (int(vw * 0.42), int(vh * 0.4)), 0, 0, 360, 1, -1)
    m = cv2.GaussianBlur(m, (0, 0), vw * 0.06)[..., None]
    x0, y0 = int(W * cx - vw / 2), int(H * cy - vh / 2)
    xs, ys = max(0, x0), max(0, y0)
    xe, ye = min(W, x0 + vw), min(H, y0 + vh)
    pv, mv = patch[ys - y0:ye - y0, xs - x0:xe - x0], m[ys - y0:ye - y0, xs - x0:xe - x0]
    roi = img[ys:ye, xs:xe].astype(np.float32)
    pv = pv * (roi.mean((0, 1)) / pv.mean((0, 1))) ** 0.5   # match the light of the view
    # warm the walls to sunlit cream and the roofs to terracotta (never pink)
    ph = cv2.cvtColor(np.clip(pv, 0, 255).astype(np.uint8), cv2.COLOR_BGR2HSV).astype(np.float32)
    wall = (ph[..., 2] > 95) & (ph[..., 1] < 80)
    lilac = (ph[..., 0] > 115) | (ph[..., 0] < 8)
    ph[..., 0][lilac] = 16
    ph[..., 0][wall] = 21; ph[..., 1][wall] = 70; ph[..., 2][wall] = np.clip(ph[..., 2][wall] * 1.06, 0, 255)
    roof = (ph[..., 2] > 120) & ((ph[..., 0] < 22) | (ph[..., 0] > 160)) & (ph[..., 1] >= 40)
    ph[..., 0][roof] = 11; ph[..., 1][roof] = np.clip(ph[..., 1][roof] * 1.5, 0, 200)
    pv = cv2.cvtColor(ph.astype(np.uint8), cv2.COLOR_HSV2BGR).astype(np.float32)
    img[ys:ye, xs:xe] = np.clip(roi * (1 - mv) + pv * mv, 0, 255).astype(np.uint8)

# ---- colour: golden afternoon, no pink in the sky, bluer sea, richer greens
hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV).astype(np.float32)
h, s, v = hsv[..., 0], hsv[..., 1], hsv[..., 2]
pinkish = ((h > 150) | (h < 12)) & (v > 120)
h[pinkish] = 22                                   # sunset pink -> warm gold
s[pinkish] *= 0.55
violet = (h >= 112) & (h <= 150)
h[violet] = 108                                   # hazy mountains stay blue, never lilac
blue = (h > 85) & (h < 130)
s[blue] = np.clip(s[blue] * 1.7 + 20, 0, 255)     # sea
green = (h > 25) & (h < 85)
s[green] = np.clip(s[green] * 1.5, 0, 255)
h[green] = np.clip(h[green] + 4, 0, 179)
v[:] = np.clip(255 * (v / 255) ** 0.78 * 1.04 + 8, 0, 255)  # lift the shadows
hsv = np.dstack([h, s, v])
img = cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR)

# sky: a soft blue-to-gold gradient laid over the hazy top
yy = np.linspace(0, 1, H)[:, None, None]
sky = np.clip(1 - yy / 0.33, 0, 1) ** 1.2
top = np.array([236, 214, 178], np.float32)       # BGR pale blue
mid = np.array([196, 228, 246], np.float32)       # BGR warm cream
grad = top * (1 - yy / 0.33) + mid * (yy / 0.33)
lum = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY).astype(np.float32)[..., None] / 255
skymask = sky * np.clip((lum - 0.45) / 0.3, 0, 1)
img = (img * (1 - skymask * 0.85) + grad * skymask * 0.85).astype(np.uint8)

# ---- Amalfi colour: the white villages on the far cliffs become pastel
# yellow, apricot and ochre houses, and a few sailboats cross the bay
region = np.zeros((H, W), np.float32)
region[int(H * 0.2):int(H * 0.42), int(W * 0.4):] = 1
region = cv2.GaussianBlur(region, (0, 0), 12)
hsv2 = cv2.cvtColor(img, cv2.COLOR_BGR2HSV).astype(np.float32)
g = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY).astype(np.float32)
busy = np.sqrt(np.clip(cv2.blur(g * g, (9, 9)) - cv2.blur(g, (9, 9)) ** 2, 0, None))
busy = np.clip((busy - 6) / 10, 0, 1)                 # buildings, not smooth sky or sea
bright = np.clip((hsv2[..., 2] - 175) / 40, 0, 1) * np.clip((90 - hsv2[..., 1]) / 60, 0, 1) * region * busy
cells = rng.integers(0, 6, (H // 7 + 1, W // 11 + 1)).astype(np.uint8)
cells = cv2.resize(cells, (W + 11, H + 7), interpolation=cv2.INTER_NEAREST)[:H, :W]
PASTELS = np.array([[80, 205, 250], [90, 170, 240], [150, 225, 252], [70, 140, 215], [225, 240, 250], [110, 200, 235]], np.float32)  # BGR
tint = PASTELS[cells]
a = np.clip(cv2.GaussianBlur(bright * 1.6, (0, 0), TOWN_SOFT), 0, 0.95)[..., None]
img = np.clip(img * (1 - a) + tint * a, 0, 255).astype(np.uint8)



boats = img.copy()
def sailboat(x, y, s):
    hull = np.array([[x - 22 * s, y], [x + 26 * s, y], [x + 18 * s, y + 7 * s], [x - 16 * s, y + 7 * s]], np.int32)
    cv2.fillPoly(boats, [hull], (235, 240, 246), cv2.LINE_AA)
    cv2.fillPoly(boats, [np.array([[x, y - 3], [x, y - 58 * s], [x + 22 * s, y - 4]], np.int32)], (250, 252, 253), cv2.LINE_AA)
    cv2.fillPoly(boats, [np.array([[x - 3, y - 4], [x - 3, y - 46 * s], [x - 18 * s, y - 4]], np.int32)], (232, 238, 244), cv2.LINE_AA)
    cv2.line(boats, (int(x), int(y)), (int(x), int(y - 60 * s)), (120, 125, 135), 2, cv2.LINE_AA)
for (fx, fy, s) in [(0.1, 0.6, 1.4), (0.27, 0.5, 1.0), (0.45, 0.46, 0.75), (0.6, 0.55, 1.1)]:
    sailboat(W * fx, H * fy, s)
img = cv2.GaussianBlur(boats, (0, 0), 0.9)

# ---- paint it: flat washes of colour with soft edges, then paper texture
p = cv2.pyrMeanShiftFiltering(img, 14, 26)
p = cv2.edgePreservingFilter(p, flags=1, sigma_s=30, sigma_r=0.3)
p = cv2.GaussianBlur(p, (0, 0), 1.2)
grain = rng.random((H, W)).astype(np.float32)
grain = cv2.GaussianBlur(grain, (0, 0), 0.8)
strokes = cv2.GaussianBlur(rng.random((H // 3, W // 3)).astype(np.float32), (0, 0), 1)
strokes = cv2.resize(strokes, (W, H))
strokes = cv2.filter2D(strokes, -1, np.ones((1, 9), np.float32) / 9)  # horizontal brush drag
tex = 0.95 + 0.05 * grain + 0.06 * (strokes - 0.5)
p = np.clip(p.astype(np.float32) * tex[..., None], 0, 255).astype(np.uint8)
if VIVID != 1.0:
    q = cv2.cvtColor(p, cv2.COLOR_BGR2HSV).astype(np.float32)
    q[..., 1] = np.clip(q[..., 1] * VIVID, 0, 255)
    p = cv2.cvtColor(q.astype(np.uint8), cv2.COLOR_HSV2BGR)
cv2.imwrite(out, p, [cv2.IMWRITE_JPEG_QUALITY, 84])
print(W, H)
