# Builds the art-directed image set for the Delicious redesign (v9).
# Inputs: approved Unsplash downloads + Canva exports + the project's own photos.
# Output: client/imgs/art/*.webp (+ a JPG fallback for the hero arch).
import sys, os, json
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
from skimage import color, measure, morphology, transform

SRC, PROJECT = sys.argv[1], sys.argv[2]
OUT = os.path.join(PROJECT, 'client', 'imgs', 'art')
os.makedirs(OUT, exist_ok=True)
report = {}

GROUND = np.array([16, 13, 11], np.float32) / 255  # --bg (Ember)

def grade(im, contrast=0.10, sat=1.05, warm=0.035, lift=1.0):
    """Ember grade: gentle S-curve, warm split-tone, blacks lifted to the oven-charcoal ground."""
    a = np.asarray(im.convert('RGB')).astype(np.float32) / 255
    L = (0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2])[..., None]
    a = L + (a - L) * sat
    a = np.clip(a, 0, 1)
    s = a * a * (3 - 2 * a)
    a = a + (s - a) * contrast
    hi = np.clip((L - 0.5) * 2, 0, 1)
    sh = np.clip((0.5 - L) * 2, 0, 1)
    a = a + hi * np.array([warm, warm * 0.45, -warm * 0.7]) + sh * np.array([warm * 0.5, warm * 0.18, -warm * 0.35])
    g = GROUND * lift
    a = g + np.clip(a, 0, 1) * (1 - g)
    return Image.fromarray((np.clip(a, 0, 1) * 255 + 0.5).astype(np.uint8))

def crop_aspect(im, aspect, fx=0.5, fy=0.5):
    """Crop to width/height = aspect around a focal point (relative coords)."""
    w, h = im.size
    if w / h > aspect:
        nw, nh = round(h * aspect), h
    else:
        nw, nh = w, round(w / aspect)
    x = min(max(round(fx * w - nw / 2), 0), w - nw)
    y = min(max(round(fy * h - nh / 2), 0), h - nh)
    return im.crop((x, y, x + nw, y + nh))

def save_sizes(im, name, widths, q=80, jpg=False):
    out = []
    for wdt in widths:
        r = im if im.width <= wdt else im.resize((wdt, round(im.height * wdt / im.width)), Image.LANCZOS)
        p = os.path.join(OUT, f'{name}-{wdt}.webp')
        r.save(p, 'WEBP', quality=q, method=6)
        out.append((os.path.basename(p), r.size, os.path.getsize(p)))
        if jpg and wdt == widths[-2 if len(widths) > 1 else -1]:
            pj = os.path.join(OUT, f'{name}-{wdt}.jpg')
            r.convert('RGB').save(pj, 'JPEG', quality=82, optimize=True, progressive=True)
            out.append((os.path.basename(pj), r.size, os.path.getsize(pj)))
    report[name] = out

U = lambda f: os.path.join(SRC, 'unsplash', f)
C = lambda f: os.path.join(SRC, 'canva', f)
P = lambda f: os.path.join(PROJECT, 'client', 'imgs', f)

# ---- Hero (project photo by Ivan Torres / Unsplash): 4:5 arch crop for desktop, 3:2 for phones
hero = Image.open(P('frontpic.jpg')).convert('RGB')
hero_g = grade(hero, contrast=0.06, sat=1.03, warm=0.02)
save_sizes(crop_aspect(hero_g, 4 / 5, fx=0.62, fy=0.5), 'hero-arch', [800, 1200, 1600], q=80, jpg=True)
save_sizes(crop_aspect(hero_g, 3 / 2, fx=0.55, fy=0.5), 'hero-wide', [760, 1200, 2000], q=80)

# ---- Mood images (4:5 portrait unless noted)
moods = [
    ('dough-hands', U('dough-hands.jpg'), 0.5, 0.62, dict(contrast=0.10, warm=0.04)),
    ('pizza-box', U('pizza-box.jpg'), 0.45, 0.52, dict(contrast=0.10, warm=0.04)),
    ('cheese-pull', U('cheese-pull.jpg'), 0.6, 0.38, dict(contrast=0.08, warm=0.03)),
    ('pizza-in-oven', U('pizza-in-oven.jpg'), 0.4, 0.5, dict(contrast=0.06, warm=0.02)),
    ('ai-dough', C('ai-dough.jpg'), 0.5, 0.5, dict(contrast=0.06, warm=0.035)),
    ('ai-ingredients', C('ai-ingredients.jpg'), 0.5, 0.5, dict(contrast=0.05, warm=0.02)),
    ('ai-into-oven', C('ai-into-oven.jpg'), 0.5, 0.5, dict(contrast=0.05, warm=0.02)),
]
for name, path, fx, fy, g in moods:
    im = Image.open(path).convert('RGB')
    im = crop_aspect(grade(im, **g), 4 / 5, fx, fy)
    save_sizes(im, name, [560, 1120], q=78)

# AI oven fire, landscape (final CTA background)
fire = grade(Image.open(C('ai-oven-fire.jpg')).convert('RGB'), contrast=0.05, warm=0.02)
save_sizes(fire, 'ai-oven-fire', [960, 1680], q=76)

# ---- Pizza cut-out (Unsplash, Inna Gurina): saturation segmentation -> natural crust edge
im = Image.open(U('pizza-top-dark.jpg')).convert('RGB')
a = np.asarray(im).astype(np.float32) / 255
hsv = color.rgb2hsv(a)
m = (hsv[..., 1] > 0.30) & (hsv[..., 2] > 0.22)
small = transform.rescale(m.astype(float), 0.25, anti_aliasing=False) > 0.5
small = morphology.closing(small, morphology.disk(6))
small = ndi.binary_fill_holes(small)
lab = measure.label(small)
best = max(measure.regionprops(lab), key=lambda p: p.area)
keep = morphology.opening(lab == best.label, morphology.disk(3))
keep = ndi.binary_fill_holes(keep)
big = np.asarray(Image.fromarray((keep * 255).astype(np.uint8)).resize(im.size, Image.BILINEAR)).astype(np.float32) / 255
big = ndi.gaussian_filter(big, 3)
alpha = np.clip((big - 0.5) * 6 + 0.5, 0, 1)
ys, xs = np.nonzero(alpha > 0.5)
cx, cy = (xs.min() + xs.max()) / 2, (ys.min() + ys.max()) / 2
half = max(xs.max() - xs.min(), ys.max() - ys.min()) / 2 + 10
box = tuple(int(round(v)) for v in (cx - half, cy - half, cx + half, cy + half))
graded = grade(im, contrast=0.06, sat=1.04, warm=0.02, lift=0.0)
rgba = Image.fromarray(np.dstack([np.asarray(graded), (alpha * 255).astype(np.uint8)]), 'RGBA').crop(box)
for wdt in (1000, 520, 160):
    r = rgba.resize((wdt, wdt), Image.LANCZOS)
    p = os.path.join(OUT, f'pizza-cut-{wdt}.webp')
    r.save(p, 'WEBP', quality=84, alpha_quality=90, method=6)
    report.setdefault('pizza-cut', []).append((os.path.basename(p), r.size, os.path.getsize(p)))

print(json.dumps(report, indent=1))
