"""Paint a venue photo as a sunny, painterly view (lemon branches are added by the page).

    python3 tools/paint-venue.py <photo> <out.jpg> <top> <bottom> [options]

    --cut A,B        drop photo rows A..B (a calm band of sea) so more of the
                     garden fits below the view
    --villa SPEC     lift a villa out of another photo and blend it in:
                     <photo>:<x>,<y>,<w>,<h>:<cx>,<cy>,<width>[:cream]
                     box in that photo, centred at cx,cy (fractions of the
                     view), scaled to width px; "cream" repaints the walls
                     cream, otherwise its real colours (pink, bougainvillea) stay
    --vivid F        extra colour saturation at the end (1 = none)
    --town-soft F    blur of the pastel town on the far cliffs
    --seed N

Needs opencv-python-headless and numpy.
"""
import argparse
import cv2
import numpy as np

ap = argparse.ArgumentParser()
ap.add_argument("src"); ap.add_argument("out"); ap.add_argument("top", type=int); ap.add_argument("bottom", type=int)
ap.add_argument("--cut"); ap.add_argument("--villa")
ap.add_argument("--vivid", type=float, default=1.0); ap.add_argument("--town-soft", type=float, default=1.2)
ap.add_argument("--seed", type=int, default=4)
ap.add_argument("--boats", default="0.1,0.6,1.4;0.27,0.5,1.0;0.45,0.46,0.75;0.6,0.55,1.1", help="x,y,size;... as fractions of the view")
args = ap.parse_args()
rng = np.random.default_rng(args.seed)
VIVID, TOWN_SOFT = args.vivid, args.town_soft
BOATS = [tuple(map(float, b.split(","))) for b in args.boats.split(";") if b]

img = cv2.imread(args.src)
if args.cut:
    c0, c1 = map(int, args.cut.split(","))
    seam = 40   # cross-fade the sea either side of the cut
    above, below = img[:c0 + seam].astype(np.float32), img[c1:].astype(np.float32)
    t = np.linspace(0, 1, seam)[:, None, None]
    mixed = above[-seam:] * (1 - t) + below[:seam] * t
    img = np.vstack([above[:-seam], mixed, below[seam:]]).astype(np.uint8)
    args.bottom -= c1 - c0
img = img[args.top:args.bottom]
W = 1800
img = cv2.resize(img, (W, int(img.shape[0] * W / img.shape[1])), interpolation=cv2.INTER_CUBIC)
H = img.shape[0]


def paste_villa(dst, spec, tex):
    parts = spec.split(":")
    vsrc, box, at = parts[0], parts[1], parts[2]
    cream = len(parts) > 3 and parts[3] == "cream"
    bx, by, bw, bh = map(int, box.split(","))
    cx, cy, vw = map(float, at.split(","))
    patch = cv2.imread(vsrc)[by:by + bh, bx:bx + bw]
    vh = int(bh * vw / bw); vw = int(vw)
    patch = cv2.resize(patch, (vw, vh), interpolation=cv2.INTER_AREA)
    fx = np.clip(np.minimum(np.arange(vw), vw - 1 - np.arange(vw)) / (vw * 0.12), 0, 1)
    fy = np.clip(np.minimum(np.arange(vh) / 0.6, vh - 1 - np.arange(vh)) / (vh * 0.12), 0, 1)   # sky does the top edge
    m = (np.minimum(fy[:, None], fx[None, :]) ** 1.5).astype(np.float32)   # soft edges all round
    ph = cv2.cvtColor(patch, cv2.COLOR_BGR2HSV).astype(np.float32)
    skyp = (((ph[..., 0] > 88) & (ph[..., 0] < 128) & (ph[..., 2] > 140)) | ((ph[..., 1] < 18) & (ph[..., 2] > 200))).astype(np.float32)
    skyp[int(vh * 0.75):] = 0                        # only the sky and clouds above the trees
    skyp = cv2.dilate(skyp, np.ones((5, 5), np.uint8))
    m *= 1 - skyp
    m = cv2.GaussianBlur(m, (0, 0), vw * 0.012)[..., None]
    pv = patch.astype(np.float32)
    x0, y0 = int(W * cx - vw / 2), int(H * cy - vh / 2)
    xs, ys = max(0, x0), max(0, y0)
    xe, ye = min(W, x0 + vw), min(H, y0 + vh)
    pv, mv = pv[ys - y0:ye - y0, xs - x0:xe - x0], m[ys - y0:ye - y0, xs - x0:xe - x0]
    roi = dst[ys:ye, xs:xe].astype(np.float32)
    ph = cv2.cvtColor(pv.astype(np.uint8), cv2.COLOR_BGR2HSV).astype(np.float32)
    if cream:   # sunlit cream walls and terracotta roofs
        wall = (ph[..., 2] > 95) & (ph[..., 1] < 80)
        lilac = (ph[..., 0] > 115) | (ph[..., 0] < 8)
        ph[..., 0][lilac] = 16
        ph[..., 0][wall] = 21; ph[..., 1][wall] = 70
    else:       # keep the real pink walls; make the bougainvillea sing
        flower = (ph[..., 0] > 138) & (ph[..., 0] < 171) & (ph[..., 1] > 55)
        ph[..., 1][flower] = np.clip(ph[..., 1][flower] * 1.7 + 20, 0, 255)
        ph[..., 0][flower] = 164
        green = (ph[..., 0] > 25) & (ph[..., 0] < 85)
        ph[..., 1][green] = np.clip(ph[..., 1][green] * 1.2, 0, 255)
    ph[..., 2] = np.clip(255 * (ph[..., 2] / 255) ** 0.85 + 6, 0, 255)   # same lifted shadows as the view
    pv = cv2.cvtColor(ph.astype(np.uint8), cv2.COLOR_HSV2BGR)
    # a lighter version of the paint pass, so the villa stays crisp up front
    pv = cv2.pyrMeanShiftFiltering(pv, 8, 22)
    pv = cv2.edgePreservingFilter(pv, flags=1, sigma_s=10, sigma_r=0.25)
    pv = cv2.GaussianBlur(pv, (0, 0), 0.9).astype(np.float32) * tex[ys:ye, xs:xe, None]
    dst[ys:ye, xs:xe] = np.clip(roi * (1 - mv) + pv * mv, 0, 255).astype(np.uint8)


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
for (fx, fy, s) in BOATS:
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
if args.villa:
    paste_villa(p, args.villa, tex)
if VIVID != 1.0:
    q = cv2.cvtColor(p, cv2.COLOR_BGR2HSV).astype(np.float32)
    q[..., 1] = np.clip(q[..., 1] * VIVID, 0, 255)
    p = cv2.cvtColor(q.astype(np.uint8), cv2.COLOR_HSV2BGR)
cv2.imwrite(args.out, p, [cv2.IMWRITE_JPEG_QUALITY, 84])
print(W, H)
# Current title page backdrop:
#   python3 tools/paint-venue.py assets/img/venue-garden.jpg assets/img/hero-venue.jpg 235 1300 --cut 680,800 \
#     --villa "tools/src/villa-front.jpg:250,118,620,482:0.8,0.61,520" --town-soft 3 --vivid 1.45 \
#     --boats "0.1,0.5,1.4;0.27,0.43,1.0;0.45,0.4,0.75;0.6,0.47,1.1"
