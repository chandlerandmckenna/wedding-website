"""Paint the title page backdrop as an ink-and-watercolor sketch: the view over
the bay from Capo Santa Fortunata, with the pink villa up front and the lit
dinner tables behind it.

    python3 tools/paint-watercolor.py <out.jpg> [--seed N]

Sources: assets/img/venue-garden.jpg (the view) and tools/src/villa-front.jpg.
Needs opencv-python-headless (with ximgproc not required) and numpy.
"""
import argparse
import cv2
import numpy as np

ap = argparse.ArgumentParser()
ap.add_argument("out")
ap.add_argument("--seed", type=int, default=4)
ap.add_argument("--view", default="assets/img/venue-garden.jpg")
ap.add_argument("--villa", default="tools/src/villa-front.jpg")
args = ap.parse_args()
rng = np.random.default_rng(args.seed)

# ---- the scene, still a photo: the view with a band of calm sea taken out so
# the garden fits, and the villa standing in front of the tables
view = cv2.imread(args.view)
SEAM = 40
CUTS = [(900, 1040), (680, 800)]   # some trees, then some calm sea (bottom-up)
for c0, c1 in CUTS:
    a, b = view[:c0 + SEAM].astype(np.float32), view[c1:].astype(np.float32)
    t = np.linspace(0, 1, SEAM)[:, None, None]
    view = np.vstack([a[:-SEAM], a[-SEAM:] * (1 - t) + b[:SEAM] * t, b[SEAM:]]).astype(np.uint8)
view = view[235:1300 - sum(c1 - c0 for c0, c1 in CUTS)]
W = 1800
img = cv2.resize(view, (W, int(view.shape[0] * W / view.shape[1])), interpolation=cv2.INTER_CUBIC)
H = img.shape[0]

# the evening photo is dark down in the garden: lift it to afternoon light
hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV).astype(np.float32)
hh, ss, vv = hsv[..., 0], hsv[..., 1], hsv[..., 2]
pinkish = ((hh > 150) | (hh < 14)) & (vv > 90)
hh[pinkish] = 18; ss[pinkish] *= 0.85              # no pink sunset haze
violet = (hh >= 112) & (hh <= 150)
hh[violet] = 108
blue = (hh > 85) & (hh < 130)
ss[blue] = np.clip(ss[blue] * 1.6 + 25, 0, 255)
vv[:] = np.clip(255 * (vv / 255) ** 0.6 + 10, 0, 255)
img = cv2.cvtColor(np.dstack([hh, ss, vv]).astype(np.uint8), cv2.COLOR_HSV2BGR)
# a clear blue sky, paling toward the horizon
yy = np.linspace(0, 1, H)[:, None, None]
skyw = np.clip(1 - yy / 0.34, 0, 1)
grad = np.array([226, 196, 150], np.float32) * skyw + np.array([236, 230, 222], np.float32) * (1 - skyw)
lum0 = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY).astype(np.float32)[..., None] / 255
sm = (yy < 0.36) * np.clip((lum0 - 0.7) / 0.1, 0, 1)
img = (img * (1 - sm * 0.9) + grad * sm * 0.9).astype(np.uint8)

villa = cv2.imread(args.villa)[118:650, 230:900]
vw = 700
vh = int(villa.shape[0] * vw / villa.shape[1])
villa = cv2.resize(villa, (vw, vh), interpolation=cv2.INTER_AREA)
ph = cv2.cvtColor(villa, cv2.COLOR_BGR2HSV).astype(np.float32)
skyv = (((ph[..., 0] > 88) & (ph[..., 0] < 128) & (ph[..., 2] > 140)) | ((ph[..., 1] < 18) & (ph[..., 2] > 200))).astype(np.float32)
skyv[int(vh * 0.6):] = 0
skyv = cv2.dilate(skyv, np.ones((5, 5), np.uint8))
fx = np.clip(np.minimum(np.arange(vw), vw - 1 - np.arange(vw)) / (vw * 0.1), 0, 1)
fy = np.clip((vh - 1 - np.arange(vh)) / (vh * 0.08), 0, 1)
m = np.minimum(fy[:, None], fx[None, :]) * (1 - skyv)
m = cv2.GaussianBlur(m, (0, 0), 3)[..., None]
flower = (ph[..., 0] > 138) & (ph[..., 0] < 171) & (ph[..., 1] > 55)
ph[..., 1][flower] = np.clip(ph[..., 1][flower] * 1.8 + 30, 0, 255); ph[..., 0][flower] = 164
ph[..., 2] = np.clip(255 * (ph[..., 2] / 255) ** 0.6 + 14, 0, 255)
villa = cv2.cvtColor(ph.astype(np.uint8), cv2.COLOR_HSV2BGR).astype(np.float32)
x0, y0 = W - vw + 40, H - vh + 30                    # bottom right, in front of the tables
xs, ys = max(0, x0), max(0, y0)
roi = img[ys:H, xs:W].astype(np.float32)
pv = villa[ys - y0:ys - y0 + roi.shape[0], xs - x0:xs - x0 + roi.shape[1]]
mv = m[ys - y0:ys - y0 + roi.shape[0], xs - x0:xs - x0 + roi.shape[1]]
img[ys:H, xs:W] = (roi * (1 - mv) + pv * mv).astype(np.uint8)

# sailboats on the bay
for (fx_, fy_, s) in [(0.08, 0.5, 1.4), (0.26, 0.43, 1.0), (0.43, 0.4, 0.75)]:
    x, y = W * fx_, H * fy_
    cv2.fillPoly(img, [np.array([[x - 22 * s, y], [x + 26 * s, y], [x + 18 * s, y + 7 * s], [x - 16 * s, y + 7 * s]], np.int32)], (230, 236, 242), cv2.LINE_AA)
    cv2.fillPoly(img, [np.array([[x, y - 3], [x, y - 58 * s], [x + 22 * s, y - 4]], np.int32)], (252, 252, 252), cv2.LINE_AA)
    cv2.fillPoly(img, [np.array([[x - 3, y - 4], [x - 3, y - 46 * s], [x - 18 * s, y - 4]], np.int32)], (238, 240, 244), cv2.LINE_AA)
    cv2.line(img, (int(x), int(y)), (int(x), int(y - 60 * s)), (90, 70, 60), 2, cv2.LINE_AA)

# ---- watercolor washes: flat pools of colour, thinned with water so the
# paper shows through, a little darker where each wash dries at its edge
smooth = cv2.bilateralFilter(img, 9, 40, 9)
wash = cv2.pyrMeanShiftFiltering(smooth, 12, 34)
wash = cv2.medianBlur(wash, 7)
hsvw = cv2.cvtColor(wash, cv2.COLOR_BGR2HSV).astype(np.float32)
hsvw[..., 1] = np.clip(hsvw[..., 1] * 1.35, 0, 255)
wash = cv2.cvtColor(hsvw.astype(np.uint8), cv2.COLOR_HSV2BGR).astype(np.float32)
wash = 255 - (255 - wash) * 0.7                      # thinned pigment
lum = cv2.cvtColor(wash.astype(np.uint8), cv2.COLOR_BGR2GRAY).astype(np.float32)
edge = cv2.magnitude(cv2.Sobel(lum, cv2.CV_32F, 1, 0, ksize=3), cv2.Sobel(lum, cv2.CV_32F, 0, 1, ksize=3))
edge = cv2.GaussianBlur(np.clip(edge / 60, 0, 1), (0, 0), 1.5)
wash *= (1 - 0.14 * edge)[..., None]                 # pooled pigment at wash edges
blotch = cv2.resize(rng.random((H // 40, W // 40)).astype(np.float32), (W, H), interpolation=cv2.INTER_CUBIC)
blotch2 = cv2.resize(rng.random((H // 12, W // 12)).astype(np.float32), (W, H), interpolation=cv2.INTER_CUBIC)
wash = 255 - (255 - wash) * (0.86 + 0.18 * blotch + 0.1 * (blotch2 - 0.5))[..., None]   # uneven pigment

# ---- ink: a loose pen line over the forms (difference of gaussians), drawn
# slightly off the colour like a quick sketch
g = cv2.cvtColor(smooth, cv2.COLOR_BGR2GRAY).astype(np.float32) / 255
dog = cv2.GaussianBlur(g, (0, 0), 1.2) - cv2.GaussianBlur(g, (0, 0), 2.4)
ink = np.clip((-dog - 0.018) / 0.03, 0, 1)
inkb = (ink > 0.25).astype(np.uint8)
n, lab, stats, _ = cv2.connectedComponentsWithStats(inkb, connectivity=8)
keep = np.zeros(n, bool); keep[1:] = stats[1:, cv2.CC_STAT_AREA] >= 40   # drop specks
ink *= keep[lab]
ink[: int(H * 0.2)] *= 0.3                          # keep the sky open for the title
jx = cv2.resize(rng.normal(0, 1, (H // 60, W // 60)).astype(np.float32), (W, H), interpolation=cv2.INTER_CUBIC) * 3
jy = cv2.resize(rng.normal(0, 1, (H // 60, W // 60)).astype(np.float32), (W, H), interpolation=cv2.INTER_CUBIC) * 3
gx, gy = np.meshgrid(np.arange(W, dtype=np.float32), np.arange(H, dtype=np.float32))
ink = cv2.remap(ink, gx + jx, gy + jy, cv2.INTER_LINEAR)
ink = cv2.GaussianBlur(ink, (0, 0), 0.5)
INK = np.array([78, 52, 40], np.float32)             # BGR deep navy-brown
out = wash * (1 - ink[..., None] * 0.8) + INK * ink[..., None] * 0.8

# ---- string lights over the tables: warm dots on sagging wires
glow = np.zeros((H, W), np.float32)
for (xa, xb, ya, sag) in [(0.06, 0.38, 0.7, 0.035), (0.34, 0.66, 0.68, 0.03), (0.12, 0.6, 0.77, 0.04)]:
    xs_ = np.linspace(W * xa, W * xb, 400)
    u = (xs_ - xs_[0]) / (xs_[-1] - xs_[0])
    ys_ = H * ya + H * sag * 4 * u * (1 - u)
    pts = np.stack([xs_, ys_], 1).astype(np.int32)
    cv2.polylines(out, [pts], False, (90, 80, 70), 1, cv2.LINE_AA)
    for k in range(0, 400, 16):
        cv2.circle(glow, (int(xs_[k]), int(ys_[k]) + 3), 3, 1, -1, cv2.LINE_AA)
halo = cv2.GaussianBlur(glow, (0, 0), 7) * 2.2
WARM = np.array([120, 215, 252], np.float32)
out = out * (1 - np.clip(halo, 0, 0.6)[..., None]) + WARM * np.clip(halo, 0, 0.6)[..., None]
out = out * (1 - glow[..., None]) + np.array([200, 245, 255], np.float32) * glow[..., None]

# ---- paper
grain = cv2.GaussianBlur(rng.random((H, W)).astype(np.float32), (0, 0), 0.7)
out *= (0.965 + 0.05 * grain)[..., None]
cv2.imwrite(args.out, np.clip(out, 0, 255).astype(np.uint8), [cv2.IMWRITE_JPEG_QUALITY, 86])
print(W, H)
