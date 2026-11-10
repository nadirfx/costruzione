"""Sound design sintetizzato (originale, senza diritti) per lo script 2 – Zeigarnik.
Uso: python3 sfx.py out.wav
Tutti i suoni sono generati da zero con numpy/scipy e sincronizzati alla timeline della scena.
"""
import json, sys, wave
from pathlib import Path
import numpy as np
from scipy.signal import butter, sosfilt

SR = 48000
HERE = Path(__file__).parent
TL = json.loads((HERE / "timeline.json").read_text())
DUR = TL["duration"]
N = int(SR * DUR)
mix = np.zeros((2, N))
rng = np.random.default_rng(7)


def t_(d):
    return np.arange(int(SR * d)) / SR


def env(n, a=0.002, r=0.1, curve=6.0):
    t = np.arange(n) / SR
    att = np.clip(t / max(a, 1e-4), 0, 1)
    dec = np.exp(-curve * np.maximum(t - a, 0) / max(r, 1e-4))
    return att * dec


def filt(x, kind, f):
    sos = butter(2, f, btype=kind, fs=SR, output="sos")
    return sosfilt(sos, x)


def place(x, at, gain=1.0, pan=0.0):
    i = int(at * SR)
    if i >= N or i + len(x) <= 0:
        return
    x = x[: max(0, N - i)] * gain
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    mix[0, i:i + len(x)] += x * l * 1.414
    mix[1, i:i + len(x)] += x * r * 1.414


# ── suoni base ───────────────────────────────────────────────
def thump(f0=130, f1=42, d=0.55):
    t = t_(d)
    f = f1 + (f0 - f1) * np.exp(-t * 18)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(t), 0.002, d * 0.5, 5)
    click = filt(rng.standard_normal(len(t)), "highpass", 2500) * env(len(t), 0.0005, 0.01, 8) * 0.3
    return np.tanh((x + click) * 1.6)


def tick(f=3200, d=0.04, noise=0.5):
    t = t_(d)
    x = np.sin(2 * np.pi * f * t) * env(len(t), 0.0005, d * 0.4, 6)
    x += filt(rng.standard_normal(len(t)), "highpass", 4000) * env(len(t), 0.0003, 0.008, 6) * noise
    return x


def pop(f0=900, f1=280, d=0.07):
    t = t_(d)
    f = f1 + (f0 - f1) * np.exp(-t * 60)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(t), 0.001, d * 0.5, 5)


def whoosh(d=0.45, f0=300, f1=4000, rev=False):
    """Rumore filtrato su bande fisse, pesate nel tempo: sweep morbido senza click."""
    n = int(SR * d)
    p = np.linspace(0, 1, n)
    prof = p if rev else np.sin(np.pi * p)
    lfc = np.log(f0) + (np.log(f1) - np.log(f0)) * prof
    out = np.zeros(n)
    for fc in [200, 400, 800, 1600, 3200, 6400]:
        band = filt(rng.standard_normal(n), "bandpass", [fc * 0.7, min(fc * 1.4, SR / 2 - 100)])
        w = np.exp(-((np.log(fc) - lfc) ** 2) / 0.5)
        out += band * w
    shape = np.sin(np.pi * p) ** 2 if not rev else p ** 3 * np.clip((1 - p) / 0.04, 0, 1)
    return out * shape * 0.8


def glitch(d=0.15):
    n = int(SR * d)
    x = np.zeros(n)
    k = 0
    while k < n:
        L = int(rng.integers(150, 1400))
        kind = rng.integers(0, 3)
        tt = np.arange(L) / SR
        if kind == 0:
            seg = np.sign(np.sin(2 * np.pi * rng.uniform(200, 2400) * tt))
        elif kind == 1:
            seg = rng.standard_normal(L)
        else:
            seg = np.round(np.sin(2 * np.pi * rng.uniform(80, 600) * tt) * 3) / 3
        x[k:k + L] = seg[: len(x[k:k + L])] * rng.uniform(0.3, 1)
        k += L
    return filt(x, "highpass", 150) * env(n, 0.001, d, 1.5) * 0.6


def riser(d=0.7, f0=180, f1=1400):
    t = t_(d)
    p = t / d
    f = f0 * (f1 / f0) ** p
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.4
    x += filt(rng.standard_normal(len(t)), "highpass", 1500) * 0.35 * p
    return x * p ** 2


def shimmer(d=0.9, seed=1):
    r = np.random.default_rng(seed)
    out = np.zeros(int(SR * d))
    for i in range(14):
        f = r.uniform(2400, 6200)
        st = int(r.uniform(0, d * 0.5) * SR)
        L = int(0.35 * SR)
        tt = np.arange(L) / SR
        s = np.sin(2 * np.pi * f * tt) * env(L, 0.002, 0.18, 4) * 0.25
        out[st:st + L] += s[: len(out[st:st + L])]
    return out


def keyclick():
    d = 0.035
    x = filt(rng.standard_normal(int(SR * d)), "bandpass", [1500, 5000]) * env(int(SR * d), 0.0005, 0.008, 6)
    k = tick(rng.uniform(1800, 2400), 0.02, 0.0) * 0.3
    x[:len(k)] += k
    return x


def ding():
    """Ding originale: due toni puliti con parziali di campana."""
    out = np.zeros(int(SR * 1.2))
    for st, f in [(0.0, 1046.5), (0.09, 1568.0)]:
        L = int(SR * 1.0)
        tt = np.arange(L) / SR
        s = sum(a * np.sin(2 * np.pi * f * m * tt) for m, a in [(1, 1), (2.76, 0.25), (5.4, 0.08)])
        s *= env(L, 0.002, 0.45, 4)
        i = int(st * SR)
        out[i:i + L] += s[: len(out[i:i + L])] * 0.45
    return out


def chord(freqs, d=2.6, attack=0.05):
    t = t_(d)
    x = np.zeros(len(t))
    for f in freqs:
        for det in (-0.25, 0.25):
            ph = rng.uniform(0, 2 * np.pi)
            x += np.sin(2 * np.pi * (f + det) * t + ph) + 0.3 * np.sin(4 * np.pi * (f + det) * t)
    x = filt(x, "lowpass", 3200) / len(freqs)
    e = np.clip(t / attack, 0, 1) * np.exp(-t * 1.1)
    return x * e


# ── tappeti ──────────────────────────────────────────────────
def drone(start, end, resolve_at):
    """Drone teso con dissonanza (seconda minore) che non si risolve mai."""
    d = end - start
    t = t_(d)
    lfo = 0.5 + 0.5 * np.sin(2 * np.pi * 0.22 * t)
    rise = 1 + 0.03 * (t / d)                     # sale di tono lentamente
    x = np.zeros(len(t))
    for f, a in [(55, 1.0), (58.27, 0.55), (110, 0.35), (116.54, 0.25), (164.8, 0.12)]:
        ph = 2 * np.pi * np.cumsum(f * rise) / SR
        x += a * (np.sin(ph) + 0.25 * np.sin(2 * ph) + 0.1 * np.sin(3 * ph))
    x = filt(x, "lowpass", 900) * (0.6 + 0.4 * lfo)
    fade = np.clip(t / 1.0, 0, 1) * np.clip((resolve_at - start - t) / 0.08, 0, 1)
    x *= fade * (0.75 + 0.5 * t / d)
    return x


def buzz(d, f=100):
    t = t_(d)
    x = np.sign(np.sin(2 * np.pi * f * t)) * 0.25 + np.sin(2 * np.pi * 2 * f * t) * 0.2
    x = filt(x, "bandpass", [150, 2500]) * (0.55 + 0.45 * np.sin(2 * np.pi * 9 * t))
    return x * np.clip(t / 0.15, 0, 1) * np.clip((d - t) / 0.1, 0, 1)


# ── TIMELINE AUDIO ───────────────────────────────────────────
# Aggancio
# parole che entrano una dopo l'altra (stessi ritardi della scena)
for d, big in [(0.0, 0), (0.06, 0), (0.16, 2), (0.32, 1), (0.40, 0), (0.46, 0), (0.56, 0), (0.63, 0), (0.69, 0)]:
    if big == 2:
        place(thump(170, 40, 0.8), d, 1.0)
        place(whoosh(0.18, 2000, 6000), d - 0.08, 0.3)
    elif big == 1:
        place(thump(140, 55, 0.4), d, 0.7)
    else:
        place(pop(1100, 380, 0.06), d, 0.45, (d * 7 % 2) - 0.5)
        place(tick(3400, 0.02), d, 0.2)
place(shimmer(0.6, 11), 1.0, 0.3)
place(glitch(0.16), 1.65, 0.6)

# Il cursore cade
place(whoosh(0.4, 400, 3000), 1.95, 0.35, -0.2)
for i, (tm, g) in enumerate([(2.47, .55), (2.62, .3), (2.71, .18)]):
    place(pop(700, 250, 0.06), tm, g)

# Drone continuo 2.0 → 21.5 (non si risolve mai)
place(drone(2.0, 21.6, 21.5), 2.0, 0.42)

# La barra
place(riser(0.4, 300, 1200), 3.2, 0.25)
place(riser(1.3, 400, 2200), 3.6, 0.22)
place(thump(90, 50, 0.25), 4.9, 0.45)
place(buzz(2.1, 100), 4.9, 0.10)
for k in range(8):                                  # orologio
    place(tick(1900 if k % 2 else 2300, 0.03, 0.2), 3.3 + k * 0.5, 0.22, -0.3 if k % 2 else 0.3)

# TV + countdown
place(whoosh(0.5, 250, 3500), 6.95, 0.45, 0.2)
for i in range(4):
    place(whoosh(0.25, 600, 3000), 7.42 + i * 0.6, 0.25)
    place(thump(180, 70, 0.3), 7.5 + i * 0.6 + 0.12, 0.45)
    place(tick(3000, 0.03), 7.5 + i * 0.6, 0.18)

# Telefono
place(whoosh(0.5, 300, 3800), 9.45, 0.45, -0.2)
place(riser(0.6, 500, 1800), 10.05, 0.15)
place(tick(2500, 0.03), 10.8, 0.25)

# Titolo ZEIGARNIK
place(whoosh(0.35, 800, 6000), 12.0, 0.4)
place(thump(120, 45, 0.5), 12.4, 0.5)
for i in range(9):
    place(tick(2200 + i * 120, 0.03, 0.3), 12.4 + i * 0.04, 0.2, (i - 4) / 6)
place(shimmer(1.0, 3), 12.95, 0.5)

# Rivelazione (zoom out)
place(whoosh(0.6, 3000, 200, rev=True), 14.6, 0.45)
place(thump(100, 40, 0.5), 15.0, 0.5)
for i in range(5):
    place(pop(900 + i * 90, 300, 0.07), 15.15 + i * 0.1, 0.35, (i - 2) / 3)
place(shimmer(0.7, 5), 15.7, 0.35)
place(riser(0.75, 200, 1600), 16.75, 0.35)
# 17.5 → 18.0: la pausa (solo il drone)

# La frase scende (linea lineare = tensione)
for k in range(4):
    place(thump(70, 38, 0.4), 18.0 + k * 0.8, 0.35)
place(buzz(3.1, 100), 18.4, 0.08)
place(riser(1.2, 150, 900), 20.3, 0.3)

# "…di dire." → la risoluzione
for i in range(3):
    place(keyclick(), 21.0 + i * 0.12, 0.55)
place(whoosh(0.5, 3000, 200, rev=True), 21.0, 0.35)
place(thump(160, 35, 1.0), 21.5, 1.0)
place(chord([110, 138.59, 164.81, 220, 277.18], 3.0, 0.03), 21.5, 0.75)   # La maggiore: sollievo
place(shimmer(1.4, 9), 21.52, 0.7)
place(whoosh(0.7, 4000, 300), 21.5, 0.35)

# CTA
place(whoosh(0.4, 400, 4000), 22.95, 0.35)
place(buzz(0.35, 120), 23.1, 0.15)
for i in range(4):
    place(keyclick(), 23.6 + i * 0.12, 0.55)
place(pop(1200, 500, 0.05), 24.15, 0.5)
place(ding(), 24.55, 0.6)
place(whoosh(0.4, 3000, 300, rev=True), 24.95, 0.3)
place(pop(500, 150, 0.08), 25.35, 0.3)

# Micro-tick per ogni parola dei sottotitoli (molto bassi)
for a, b, tokens in TL["captions"]:
    words = [w for txt, _ in tokens for w in txt.split(" ") if w]
    dt = min(0.16, ((b - a) * 0.55) / len(words))
    for i, (w) in enumerate(words):
        colored = any(w in txt.split(" ") and c != "w" for txt, c in tokens)
        place(tick(2800 if colored else 3600, 0.025, 0.2), a + 0.05 + i * dt, 0.16 if colored else 0.07, (i % 3 - 1) * 0.15)

# ── master ───────────────────────────────────────────────────
m = mix.copy()
m = np.vstack([filt(ch, "highpass", 28) for ch in m])
m = np.tanh(m * 1.1) / np.tanh(1.1)                 # saturazione dolce
peak = np.max(np.abs(m))
m = m / peak * 0.89
fo = int(0.25 * SR)
m[:, -fo:] *= np.linspace(1, 0, fo)

out = sys.argv[1] if len(sys.argv) > 1 else "sfx.wav"
with wave.open(out, "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((m.T * 32767).astype(np.int16).tobytes())
print("scritto", out, f"{DUR}s")
