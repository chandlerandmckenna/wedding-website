"""Re-colour the title watercolor in the palette of a sunny painted postcard:
pale blue sky (no peach sunset), bright chartreuse and sage greens, warm
terracotta and cream town, clear turquoise-blue sea, and crisp ink edges.

    python3 tools/postcard-grade.py <in.jpg> <out.jpg> [--ink 0.5]
"""
import argparse
import cv2
import numpy as np

ap = argparse.ArgumentParser()
ap.add_argument("src"); ap.add_argument("out")
ap.add_argument("--ink", type=float, default=0.22)
a = ap.parse_args()
img = cv2.imread(a.src)
H, W = img.shape[:2]
hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV).astype(np.float32)
h, s, v = hsv[..., 0], hsv[..., 1], hsv[..., 2]
yy = np.linspace(0, 1, H)[:, None] * np.ones((1, W))

# sky: peach and pink sunset bands become pale summer blue
warm_sky = ((h < 25) | (h > 160)) & (yy < 0.48) & (v > 170) & (s < 120)
h[warm_sky] = 104
s[warm_sky] = np.clip(s[warm_sky] * 0.7 + 20, 0, 255)
v[warm_sky] = np.clip(v[warm_sky] * 1.03, 0, 255)

# sea and mountains: clearer, brighter blue
blue = (h >= 90) & (h <= 125)
s[blue] = np.clip(s[blue] * 1.35 + 8, 0, 255)
v[blue] = np.clip(v[blue] * 1.04, 0, 255)

# greens: toward chartreuse and yellow-green, brighter
green = (h > 22) & (h < 90) & (s > 25)
h[green] = np.clip(h[green] * 0.85 + 3, 28, 62)
s[green] = np.clip(s[green] * 1.3 + 8, 0, 255)
v[green] = np.clip(v[green] * 1.07 + 6, 0, 255)

# cliffs and town lower down: warm terracotta and cream
warm = ((h <= 22) | (h >= 165)) & (yy >= 0.36) & (yy <= 0.6)   # the cliffs and town only
h[warm] = 15
s[warm] = np.clip(s[warm] * 1.25 + 6, 0, 150)

out = cv2.cvtColor(np.dstack([h, s, v]).astype(np.uint8), cv2.COLOR_HSV2BGR)

# a touch of fine red-brown ink along the strongest edges, like the card's pen work
g = cv2.cvtColor(out, cv2.COLOR_BGR2GRAY).astype(np.float32)
e = cv2.magnitude(cv2.Sobel(g, cv2.CV_32F, 1, 0, ksize=3), cv2.Sobel(g, cv2.CV_32F, 0, 1, ksize=3))
e = np.clip((e - 70) / 120, 0, 1) * a.ink
e[: int(H * 0.25)] *= 0.2
INK = np.array([52, 62, 120], np.float32)
out = out.astype(np.float32) * (1 - e[..., None]) + INK * e[..., None]
cv2.imwrite(a.out, np.clip(out, 0, 255).astype(np.uint8), [cv2.IMWRITE_JPEG_QUALITY, 90])
