"""Scena 1 dello spot da foto reale: "foto viva" cinematica (9:16, 2160x3840, 24 fps).

- camera: lenta spinta in avanti con parallasse 2.5D (auto e cavalletti in primo piano
  si muovono più dello sfondo), micro-movimento a mano
- gancio: buio totale, la luce si accende con due sfarfallii
- atmosfera: fumo che scorre, polvere che galleggia nel fascio, lampada arancione che tremola
- finitura: grana, vignettatura

Uso: python3 shot1.py <foto.jpg> <out_dir>   (scrive i fotogrammi PNG)
"""
import os
import sys

import cv2
import numpy as np

SRC, OUT = sys.argv[1], sys.argv[2]
FPS, DUR = 24, 5.0
OW, OH = 2160, 3840
os.makedirs(OUT, exist_ok=True)

img = cv2.imread(SRC).astype(np.float32) / 255.0
h0, w0 = img.shape[:2]
k = OW / w0  # scala sorgente -> uscita
S = cv2.resize(img, (OW, int(round(h0 * k))), interpolation=cv2.INTER_LANCZOS4)
SH = S.shape[0]
# leggera nitidezza dopo l'ingrandimento
blur = cv2.GaussianBlur(S, (0, 0), 2.0)
S = np.clip(S * 1.35 - blur * 0.35, 0, 1)


def poly_mask(pts, feather):
    m = np.zeros((SH, OW), np.float32)
    cv2.fillPoly(m, [np.array([[x * k, y * k] for x, y in pts], np.int32)], 1.0)
    return cv2.GaussianBlur(m, (0, 0), feather)


# primo piano: scocca + cavalletti (coordinate della foto originale 1116x2000)
car = [(318, 1316), (600, 1312), (705, 1338), (760, 1418), (905, 1458), (910, 1530), (948, 1530),
       (1040, 1640), (1010, 1662), (905, 1708), (700, 1692), (700, 1655), (560, 1578), (330, 1632),
       (185, 1622), (185, 1600), (240, 1505), (290, 1490), (290, 1420)]
FLOOR = [(150, 1480), (1070, 1480), (1090, 1740), (130, 1740)]  # ombra e pavimento sotto l'auto
FG = np.maximum(poly_mask(car, 6), poly_mask(FLOOR, 45))[..., None]
# sfondo senza auto: l'area dell'auto viene ricostruita (inpainting) così non spuntano doppioni
_m0 = np.zeros((h0, w0), np.uint8)
cv2.fillPoly(_m0, [np.array(car, np.int32)], 255)
cv2.fillPoly(_m0, [np.array(FLOOR, np.int32)], 255)
_m0 = cv2.dilate(_m0, np.ones((25, 25), np.uint8))
_bg0 = cv2.inpaint((img * 255).astype(np.uint8), _m0, 12, cv2.INPAINT_TELEA).astype(np.float32) / 255.0
S_BG = cv2.resize(_bg0, (OW, SH), interpolation=cv2.INTER_LANCZOS4)
# fascio di luce
BEAM = poly_mask([(10, 20), (100, 10), (800, 1250), (230, 1340)], 60)
# fascia di fumo esistente
yy = np.linspace(0, 1, SH)[:, None] * np.ones((1, OW))
BAND = np.exp(-((yy * h0 - 1050) / 330) ** 2).astype(np.float32)
LAMP = (855 * k, 1372 * k)

# texture di rumore per il fumo (precalcolata, poi fatta scorrere)
rng = np.random.default_rng(3)


def noise_tex(size, sigma):
    n = rng.standard_normal((size, size)).astype(np.float32)
    n = cv2.GaussianBlur(np.tile(n, (3, 3)), (0, 0), sigma)[size:2 * size, size:2 * size]  # bordi che si ripetono
    n = (n - n.min()) / (n.max() - n.min())
    return n


NT1, NT2 = noise_tex(512, 18), noise_tex(512, 7)


def smoke_field(t):
    small = np.zeros((SH // 8, OW // 8), np.float32)
    hs, ws = small.shape
    ys, xs = np.mgrid[0:hs, 0:ws].astype(np.float32)
    a = cv2.remap(NT1, (xs * 1.0 + t * 9) % 512, (ys * 1.0 - t * 4) % 512, cv2.INTER_LINEAR)
    b = cv2.remap(NT2, (xs * 2.0 - t * 15) % 512, (ys * 2.0 - t * 7) % 512, cv2.INTER_LINEAR)
    f = np.clip((0.65 * a + 0.35 * b - 0.42) * 2.4, 0, 1) ** 1.5
    return cv2.resize(f, (OW, SH), interpolation=cv2.INTER_CUBIC)


# polvere nel fascio: particelle in coordinate sorgente (ingrandite)
NP = 260
px = rng.uniform(0, 820, NP) * k
py = rng.uniform(40, 1350, NP) * k
pr = rng.uniform(1.2, 3.6, NP) * (k / 1.9)
pph = rng.uniform(0, 6.28, NP)
pv = rng.uniform(4, 16, NP)


def ease(x):
    x = min(1.0, max(0.0, x))
    return x * x * (3 - 2 * x)


def affine(scale, cx, cy, dx, dy):
    return np.float32([[scale, 0, (1 - scale) * cx + dx], [0, scale, (1 - scale) * cy + dy]])


def light_level(t):
    """Gancio: buio, poi la luce si accende con due sfarfallii."""
    if t < 0.35:
        return 0.0
    if t < 0.42:
        return 1.0
    if t < 0.50:
        return 0.08
    if t < 0.56:
        return 0.7
    if t < 0.62:
        return 0.25
    return 1.0


frames = int(FPS * DUR)
yy_out = (np.arange(OH) - OH / 2)[:, None] / (OH / 2)
xx_out = (np.arange(OW) - OW / 2)[None, :] / (OW / 2)
VIG = np.clip(1 - 0.35 * (xx_out ** 2 + yy_out ** 2) ** 1.4, 0, 1).astype(np.float32)[..., None]
crop_y0 = (SH - OH) // 2

ONLY = [int(x) for x in sys.argv[3].split(',')] if len(sys.argv) > 3 else range(frames)
for f in ONLY:
    t = f / FPS
    p = ease(t / DUR)
    shake_x = 3.0 * np.sin(t * 1.7) + 1.5 * np.sin(t * 4.3 + 1)
    shake_y = 2.5 * np.sin(t * 1.3 + 2) + 1.2 * np.sin(t * 3.7)
    # sfondo: spinta leggera; primo piano: spinta più forte (parallasse)
    Mb = affine(1.0 + 0.06 * p, OW / 2, SH / 2, shake_x, shake_y - 40 * p)
    Mf = affine(1.0 + 0.105 * p, 610 * k, 1520 * k, shake_x * 1.4, shake_y * 1.4 - 55 * p)
    bg = cv2.warpAffine(S_BG, Mb, (OW, SH), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
    fg = cv2.warpAffine(S, Mf, (OW, SH), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
    m = cv2.warpAffine(FG, Mf, (OW, SH))[..., None]
    comp = fg * m + bg * (1 - m)

    beam = cv2.warpAffine(BEAM, Mb, (OW, SH))[..., None]
    band = cv2.warpAffine(BAND, Mb, (OW, SH))[..., None]

    # luce che respira leggermente
    flick = 1 + 0.035 * np.sin(t * 9.1) * np.sin(t * 2.3)
    L = light_level(t)
    lit = comp * (1 + 0.10 * (flick - 1) * 10 * beam)

    # fumo che scorre, più denso nel fascio e nella fascia centrale
    sm = smoke_field(t)[..., None]
    smoke_amt = sm * (0.22 * beam + 0.10 * band)
    lit = 1 - (1 - lit) * (1 - smoke_amt * np.float32([0.78, 0.72, 0.62]))  # screen, tinta ciano (BGR)

    # polvere che galleggia nel fascio
    dust = np.zeros((SH, OW), np.float32)
    dx_ = px + np.sin(t * 0.6 + pph) * 18 * k / 1.9 + t * 6
    dy_ = py + t * pv * k / 1.9 + np.cos(t * 0.8 + pph) * 10
    for x, y, r in zip(dx_, dy_, pr):
        cv2.circle(dust, (int(x), int(y)), max(1, int(r)), 1.0, -1, cv2.LINE_AA)
    dust = cv2.GaussianBlur(dust, (0, 0), 1.2)
    dust = cv2.warpAffine(dust, Mb, (OW, SH)) * BEAM * 0.55
    lit = lit + dust[..., None] * np.float32([0.95, 0.95, 0.85])

    # buio del gancio: senza luce resta solo la lampada arancione
    dark = comp * 0.035
    frame = dark * (1 - L) + lit * L

    # lampada arancione che tremola (sempre accesa)
    lamp_i = 0.75 + 0.25 * np.sin(t * 13) * np.sin(t * 5.7 + 1)
    lx, ly = Mb @ np.float32([LAMP[0], LAMP[1], 1])
    glow = np.zeros((SH, OW), np.float32)
    cv2.circle(glow, (int(lx), int(ly)), int(70 * k / 1.9), 1.0, -1, cv2.LINE_AA)
    glow = cv2.GaussianBlur(glow, (0, 0), 60) * lamp_i * (0.35 + 0.25 * (1 - L))
    frame = frame + glow[..., None] * np.float32([0.25, 0.6, 1.0])

    out = frame[crop_y0:crop_y0 + OH]
    out = out * VIG
    grain = rng.standard_normal((OH // 2, OW // 2)).astype(np.float32)
    grain = cv2.resize(grain, (OW, OH), interpolation=cv2.INTER_LINEAR)[..., None] * 0.018
    out = np.clip(out + grain, 0, 1)
    cv2.imwrite(os.path.join(OUT, f"f{f:04d}.png"), (out * 255).astype(np.uint8))
    if f % 24 == 0:
        print("frame", f, flush=True)
print("fatto")
