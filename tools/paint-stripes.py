"""Write assets/img/stripes.jpg: hand-painted ribbon stripes, a cobalt wash
beside a periwinkle wash on cream paper, with wobbly brush edges, pigment
pooling at the edges and paper grain. The tile repeats seamlessly (every
noise field is periodic) and is drawn at 2x for sharp screens.

    python3 tools/paint-stripes.py
"""
import numpy as np
from PIL import Image

W, H = 240, 480          # 2x pixels; shown as a 120 x 240 CSS tile
STRIPE = W // 2
rng = np.random.default_rng(12)


def field(shape, sx, sy=None):
    """Smooth random field that tiles: white noise low-passed in Fourier
    space. sx and sy are the blob sizes across and down (in pixels)."""
    sy = sx if sy is None else sy
    f = np.fft.fft2(rng.normal(size=shape))
    ky = np.fft.fftfreq(shape[0])[:, None]
    kx = np.fft.fftfreq(shape[1])[None, :]
    f *= np.exp(-((kx * sx) ** 2 + (ky * sy) ** 2) * (2 * np.pi) ** 2 / 2)
    n = np.real(np.fft.ifft2(f))
    return (n - n.mean()) / (n.std() + 1e-9)


def edge(seed_scale):
    """A brush edge: a periodic wobble down the tile, a few pixels each way."""
    y = np.arange(H)
    e = np.zeros(H)
    for k, a in [(1, 2.2), (2, 1.6), (3, 1.0), (5, 0.7), (9, 0.4)]:
        e += a * np.sin(2 * np.pi * k * y / H + rng.uniform(0, 6.3))
    return e * seed_scale


paper = np.array([252, 239, 223], float)
peri = np.array([128, 156, 228], float)
cobalt = np.array([46, 82, 196], float)

x = np.arange(W)[None, :].repeat(H, 0).astype(float)
left = 4 + edge(1.0)[:, None]
right = 4 + STRIPE + edge(1.0)[:, None]
inside = np.clip(np.minimum(x - left, right - x) + 0.5, 0, 1)        # cobalt stripe, soft 1px edge
dist = np.minimum(np.abs(x - left), np.abs(x - right))

wash = field((H, W), 22)            # brush loading, broad blooms
streak = field((H, W), 1.6, 40)     # brush streaks running down the stroke
grain = field((H, W), 0.8)          # paper tooth

a_peri = np.clip(0.58 + 0.07 * wash + 0.05 * streak, 0, 1)
a_cob = np.clip(0.80 + 0.06 * wash + 0.07 * streak + 0.14 * np.exp(-dist / 3.0), 0, 1)

out = paper * (1 - a_peri[..., None]) + peri * a_peri[..., None]
a = (inside * a_cob)[..., None]
out = out * (1 - a) + cobalt * a
out *= (1 + 0.018 * grain)[..., None]
Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)).save("assets/img/stripes.jpg", quality=90)
print("wrote assets/img/stripes.jpg")
