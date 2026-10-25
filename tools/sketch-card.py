"""Turn a photo into a pen-and-wash sketch, like a hand-painted save-the-date
card: thin dark pen lines on white paper, loose light washes of colour laid a
little off the lines, and plenty of bare paper.

    python3 tools/sketch-card.py <photo> <out.png> [--crop x,y,w,h] [--width 1800]
        [--lines 1.0] [--wash 0.55] [--seed N]

--lines scales how many pen lines are kept (higher = more detail);
--wash is how strong the colour is (0 = bare paper, 1 = full photo colour).
Needs opencv-python-headless and numpy.
"""
import argparse
import cv2
import numpy as np

ap = argparse.ArgumentParser()
ap.add_argument("src"); ap.add_argument("out")
ap.add_argument("--crop"); ap.add_argument("--width", type=int, default=1800)
ap.add_argument("--lines", type=float, default=1.0)
ap.add_argument("--wash", type=float, default=0.55)
ap.add_argument("--seed", type=int, default=7)
ap.add_argument("--sky", type=float, default=0, help="paint a blue sky wash over the bright top fraction of the picture")
ap.add_argument("--nopink", action="store_true", help="turn pink sunset light to warm ochre")
args = ap.parse_args()
rng = np.random.default_rng(args.seed)

img = cv2.imread(args.src)
if args.crop:
    x, y, w, h = map(int, args.crop.split(","))
    img = img[y:y + h, x:x + w]
W = args.width
H = int(img.shape[0] * W / img.shape[1])
img = cv2.resize(img, (W, H), interpolation=cv2.INTER_AREA if img.shape[1] > W else cv2.INTER_CUBIC)

# daylight: lift the shadows so dark corners don't turn to mud, no pink haze in the sky
hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV).astype(np.float32)
hh, ss, vv = hsv[..., 0], hsv[..., 1], hsv[..., 2]
if args.nopink:
    pink = ((hh > 145) | (hh < 13)) & (ss < 140)
    hh[pink] = 18
    violet = (hh >= 112) & (hh <= 145)
    hh[violet] = 108
    sea = (hh > 85) & (hh < 130)
    sea[int(H * 0.45):] = False           # the bay only, not white tablecloths in blue dusk light
    ss[sea] = np.clip(ss[sea] * 1.9 + 35, 0, 255)
vv[:] = np.clip(255 * (vv / 255) ** 0.55 + 12, 0, 255)
ss[:] = np.clip(ss * 1.25, 0, 255)
img = cv2.cvtColor(np.dstack([hh, ss, vv]).astype(np.uint8), cv2.COLOR_HSV2BGR)

# ---- simplify the photo into shapes: the pen only follows the big forms
simple = img
for _ in range(3):
    simple = cv2.bilateralFilter(simple, 9, 30, 7)
simple = cv2.pyrMeanShiftFiltering(simple, 10, 28)

# ---- pen lines
gray = cv2.cvtColor(simple, cv2.COLOR_BGR2GRAY)
lo = int(40 / args.lines); hi = int(110 / args.lines)
edges = cv2.Canny(gray, lo, hi, L2gradient=True)
n, lab, stats, _ = cv2.connectedComponentsWithStats(edges, connectivity=8)
minlen = max(8, int(28 / args.lines))
keep = np.zeros(n, bool); keep[1:] = stats[1:, cv2.CC_STAT_AREA] >= minlen   # no stray specks
pen = (keep[lab] & (edges > 0)).astype(np.float32)
# break long contours into dashes now and then, like a quick hand
breaks = cv2.resize((rng.random((H // 14 + 1, W // 14 + 1)) > 0.16).astype(np.float32), (W, H), interpolation=cv2.INTER_NEAREST)
pen *= breaks
# a hand isn't a ruler: wobble the lines a little, vary their weight
gx, gy = np.meshgrid(np.arange(W, dtype=np.float32), np.arange(H, dtype=np.float32))
jx = cv2.resize(rng.normal(0, 1, (H // 50 + 2, W // 50 + 2)).astype(np.float32), (W, H), interpolation=cv2.INTER_CUBIC) * 2.2
jy = cv2.resize(rng.normal(0, 1, (H // 50 + 2, W // 50 + 2)).astype(np.float32), (W, H), interpolation=cv2.INTER_CUBIC) * 2.2
pen = cv2.remap(pen, gx + jx, gy + jy, cv2.INTER_LINEAR)
weight = cv2.resize(rng.random((H // 30 + 2, W // 30 + 2)).astype(np.float32), (W, H), interpolation=cv2.INTER_CUBIC)
thick = cv2.dilate(pen, np.ones((2, 2), np.uint8))
pen = np.where(weight > 0.55, thick, pen)
pen = np.clip(cv2.GaussianBlur(pen, (0, 0), 0.6) * 1.4, 0, 1)

# ---- washes: the shapes' colours, thinned with water, laid a touch off the lines
wash = cv2.medianBlur(simple, 9).astype(np.float32)
hw = cv2.cvtColor(wash.astype(np.uint8), cv2.COLOR_BGR2HSV).astype(np.float32)
hw[..., 1] = np.clip(hw[..., 1] * 1.5, 0, 255)
wash = cv2.cvtColor(hw.astype(np.uint8), cv2.COLOR_HSV2BGR).astype(np.float32)
shift = np.float32([[1, 0, 5], [0, 1, 3]])
wash = cv2.warpAffine(wash, shift, (W, H), borderMode=cv2.BORDER_REFLECT)
lum = cv2.cvtColor(wash.astype(np.uint8), cv2.COLOR_BGR2GRAY).astype(np.float32) / 255
# strength: light areas go to bare paper, others get a thin wash
paint = np.clip((0.86 - lum) / 0.3, 0, 1) * 0.35 + 0.65
paint *= args.wash
# the brush loads and runs dry: the wash is uneven
flow = cv2.resize(rng.random((H // 90 + 2, W // 90 + 2)).astype(np.float32), (W, H), interpolation=cv2.INTER_CUBIC)
paint *= 0.8 + 0.3 * flow
paint[lum > 0.86] *= 0.25
# pigment pools at the edge of each wash as it dries
wl = cv2.cvtColor(wash.astype(np.uint8), cv2.COLOR_BGR2GRAY).astype(np.float32)
rim = cv2.magnitude(cv2.Sobel(wl, cv2.CV_32F, 1, 0), cv2.Sobel(wl, cv2.CV_32F, 0, 1))
rim = cv2.GaussianBlur(np.clip(rim / 50, 0, 1), (0, 0), 1.2)
paint = np.clip(paint * (1 + 0.35 * rim), 0, 1)
grain = cv2.GaussianBlur(rng.random((H, W)).astype(np.float32), (0, 0), 1.1)
paint *= 0.85 + 0.3 * grain
paper = np.array([250, 252, 253], np.float32)
out = paper * (1 - paint[..., None]) + wash * paint[..., None]

if args.sky:
    yy = np.linspace(0, 1, H)[:, None]
    lum0 = cv2.cvtColor(simple, cv2.COLOR_BGR2GRAY).astype(np.float32) / 255
    sk = np.clip((lum0 - 0.72) / 0.1, 0, 1) * np.clip((args.sky - yy) / 0.05, 0, 1)
    sk *= (0.55 + 0.25 * np.clip(1 - yy / args.sky, 0, 1)) * (0.85 + 0.3 * flow)
    SKY = np.array([232, 196, 150], np.float32)   # BGR soft sky blue
    out = out * (1 - sk[..., None]) + SKY * sk[..., None]

INK = np.array([62, 44, 36], np.float32)            # BGR dark slate-navy
out = out * (1 - pen[..., None] * 0.85) + INK * pen[..., None] * 0.85
tooth = cv2.GaussianBlur(rng.random((H, W)).astype(np.float32), (0, 0), 0.8)
out *= (0.975 + 0.03 * tooth)[..., None]
cv2.imwrite(args.out, np.clip(out, 0, 255).astype(np.uint8))
print(W, H)
