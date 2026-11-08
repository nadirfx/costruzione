"""Sound design sintetico per lo spot G 63 "PROJECT NERO" (30 s, 48 kHz, stereo).

Uso: python3 audio.py out.wav
Tutto generato da zero (nessun campione esterno): motore V8, colpi metallici,
bassi, riser, beep dell'HUD, passaggi nel tunnel.
"""
import sys
import wave

import numpy as np

SR = 48000
DUR = 30.0
N = int(SR * DUR)
t = np.arange(N) / SR
rng = np.random.default_rng(7)
L = np.zeros(N)
R = np.zeros(N)


def idx(s):
    return int(s * SR)


def onepole_lp(x, cutoff):
    """Passa-basso a un polo; cutoff può essere scalare o array."""
    c = np.broadcast_to(np.asarray(cutoff, dtype=float), x.shape)
    a = 1 - np.exp(-2 * np.pi * c / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i in range(len(x)):
        acc += a[i] * (x[i] - acc)
        y[i] = acc
    return y


def add(sig, start, gain=1.0, pan=0.0):
    i0 = idx(start)
    i1 = min(N, i0 + len(sig))
    if i1 <= i0:
        return
    s = sig[: i1 - i0] * gain
    L[i0:i1] += s * np.sqrt(0.5 * (1 - pan))
    R[i0:i1] += s * np.sqrt(0.5 * (1 + pan))


def env(n, attack, decay_tau):
    tt = np.arange(n) / SR
    e = np.exp(-tt / decay_tau)
    a = int(attack * SR)
    if a > 0:
        e[:a] *= np.linspace(0, 1, a)
    return e


def boom(length=2.5, f0=110, f1=34, gain=1.0):
    n = int(length * SR)
    tt = np.arange(n) / SR
    f = f1 + (f0 - f1) * np.exp(-tt * 9)
    ph = 2 * np.pi * np.cumsum(f) / SR
    s = np.sin(ph) * env(n, 0.003, 0.7)
    s += 0.25 * np.tanh(3 * s)
    click = rng.standard_normal(n) * env(n, 0.0005, 0.012) * 0.5
    return (s + click) * gain


def clank(length=1.6, base=420, gain=1.0, seed=0):
    """Colpo metallico: parziali inarmoniche che decadono + transiente di rumore."""
    r = np.random.default_rng(seed)
    n = int(length * SR)
    tt = np.arange(n) / SR
    s = np.zeros(n)
    for ratio, amp, tau in [(1, 1, .35), (2.76, .6, .22), (5.4, .45, .12), (8.93, .3, .07), (13.3, .2, .04)]:
        f = base * ratio * (1 + r.uniform(-0.01, 0.01))
        s += amp * np.sin(2 * np.pi * f * tt + r.uniform(0, 6)) * np.exp(-tt / tau)
    noise = onepole_lp(r.standard_normal(n), 6000) * env(n, 0.0005, 0.02)
    low = np.sin(2 * np.pi * 90 * tt) * np.exp(-tt / 0.12)
    return (0.35 * s + 0.6 * noise + 0.5 * low) * gain


def ratchet(clicks=6, rate=14, gain=0.4, seed=1):
    r = np.random.default_rng(seed)
    n = int((clicks / rate + 0.1) * SR)
    s = np.zeros(n)
    for k in range(clicks):
        i = int(k / rate * SR)
        m = int(0.025 * SR)
        burst = r.standard_normal(m) * np.exp(-np.arange(m) / (0.004 * SR))
        burst += 0.5 * np.sin(2 * np.pi * 3200 * np.arange(m) / SR) * np.exp(-np.arange(m) / (0.003 * SR))
        s[i:i + m] += burst
    return s * gain


def zap(length=0.35, gain=0.5):
    """Accensione LED: ronzio elettrico breve."""
    n = int(length * SR)
    tt = np.arange(n) / SR
    s = np.sign(np.sin(2 * np.pi * 120 * tt)) * 0.3 + rng.standard_normal(n) * 0.4
    s = onepole_lp(s, 4000) * env(n, 0.002, 0.08)
    s += 0.4 * np.sin(2 * np.pi * 2400 * tt) * env(n, 0.001, 0.05)
    return s * gain


def riser(length, f_from=300, f_to=6000, gain=0.5):
    n = int(length * SR)
    x = np.linspace(0, 1, n)
    noise = rng.standard_normal(n)
    cutoff = f_from * (f_to / f_from) ** (x ** 2)
    s = onepole_lp(noise, cutoff) * (x ** 2.2)
    tone_f = 80 + 400 * x ** 3
    s += 0.35 * np.sin(2 * np.pi * np.cumsum(tone_f) / SR) * x ** 2
    return s * gain


def whoosh(length=1.2, gain=0.6, peak=0.35):
    n = int(length * SR)
    x = np.linspace(0, 1, n)
    shape = np.where(x < peak, (x / peak) ** 2, np.exp(-(x - peak) * 6))
    cutoff = 400 + 5000 * shape
    return onepole_lp(rng.standard_normal(n), cutoff) * shape * gain


def ping(f=1250, length=0.5, gain=0.25):
    n = int(length * SR)
    tt = np.arange(n) / SR
    s = (np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(2 * np.pi * f * 2.01 * tt)) * env(n, 0.002, 0.09)
    return s * gain


def engine(rpm_curve, gain=1.0, seed=3):
    """V8: treno di scoppi alla frequenza di accensione (rpm/60*4) con borbottio casuale."""
    r = np.random.default_rng(seed)
    n = len(rpm_curve)
    f_fire = rpm_curve / 60 * 4
    ph = np.cumsum(f_fire) / SR
    frac = ph % 1
    # impulso per ogni scoppio, con ampiezze irregolari (burble)
    which = np.floor(ph).astype(int)
    amps = 0.65 + 0.35 * r.random(which.max() + 2)
    pulse = np.exp(-frac * 9) * amps[which]
    base = np.zeros(n)
    for k, a in enumerate([1, .7, .5, .35, .25, .18], start=1):
        base += a * np.sin(2 * np.pi * k * np.cumsum(f_fire / 2) / SR)
    s = base * (0.35 + pulse) + 0.6 * r.standard_normal(n) * pulse
    load = np.clip((rpm_curve - 700) / 5500, 0, 1)
    s = onepole_lp(s, 250 + 2500 * load)
    s = np.tanh(1.8 * s)
    return s * gain


def drone(length, f=41.2, gain=0.3):
    n = int(length * SR)
    tt = np.arange(n) / SR
    s = np.zeros(n)
    for det in (-0.6, 0, 0.7):
        ff = f + det
        s += np.sin(2 * np.pi * ff * tt) + 0.5 * np.sin(2 * np.pi * ff * 2 * tt) + 0.25 * np.sin(2 * np.pi * ff * 3.01 * tt)
    s = onepole_lp(s, 400)
    fade = np.minimum(1, np.minimum(tt / 1.5, (length - tt) / 0.6))
    return s / 3 * fade * gain


# ---------------- timeline ----------------
# 0–4: gancio — faro che si accende, avviamento, carrellata indietro
add(clank(1.8, 360, 1.0, seed=10), 0.25, 0.9)
add(zap(0.3, 0.6), 0.25, 0.7)
add(zap(0.15, 0.3), 0.44)
start_len = 4.0
rpm = np.full(int(start_len * SR), 750.0)
tt = np.arange(len(rpm)) / SR
rpm += 2600 * np.exp(-((tt - 0.75) / 0.22) ** 2)  # colpo di gas all'avviamento
crank = (tt < 0.45) & (tt > 0.15)
eng = engine(rpm, 0.55)
eng[: int(0.5 * SR)] *= np.linspace(0, 1, int(0.5 * SR)) ** 2
eng += crank * np.sin(2 * np.pi * 11 * tt) * 0.25 * onepole_lp(rng.standard_normal(len(tt)), 900)
eng *= np.where(tt > 2.2, np.exp(-(tt - 2.2) * 0.9), 1)
add(eng, 0.5, 0.8)
add(boom(3.0, 120, 32, 1.0), 1.0, 1.1)
add(whoosh(1.1, 0.5, 0.25), 0.95)

# 1–12: tappeto di bassi
add(drone(10.8, 41.2, 0.32), 1.0)

# 4–10: montaggio — un colpo per pezzo, cricchetti al riempimento
build = [(0.15, 0.9), (0.5, 1.2), (0.75, 1.45), (1.25, 2.0), (1.8, 2.55), (2.4, 3.0), (2.5, 3.2), (3.1, 3.8)]
for k, (w, f) in enumerate(build):
    pan = [-0.5, 0.4, -0.3, 0.5, -0.4, 0.3, -0.2, 0.2][k]
    add(clank(1.4, 300 + 70 * (k % 4), 0.55, seed=20 + k), 4 + w, 1.0, pan)
    add(ratchet(5 + k % 3, 16, 0.35, seed=40 + k), 4 + f, 1.0, -pan)
add(zap(0.35, 0.6), 4 + 4.2)
add(boom(2.0, 90, 38, 0.6), 4 + 4.2)

# 10–12: ruota che gira, riser verso l'HUD
n = int(2.0 * SR)
x = np.linspace(0, 1, n)
whine = np.sin(2 * np.pi * np.cumsum(180 + 900 * x ** 2) / SR) * x ** 1.5 * 0.18
add(whine, 10.0)
add(riser(2.0, 200, 7000, 0.45), 10.0)

# 12–20: HUD
add(zap(0.25, 0.35), 12.05)
for k, g in enumerate([0.9, 1.35, 1.8]):
    add(ping(1100 + 220 * k, 0.6, 0.3), 12 + g, 1.0, [-0.6, 0, 0.6][k])
    add(ratchet(10, 30, 0.12, seed=60 + k), 12 + g + 0.2, 1.0, [-0.6, 0, 0.6][k])
add(drone(6.0, 55, 0.25), 12.0)
add(riser(2.0, 300, 9000, 0.55), 15.6)
add(boom(3.0, 140, 30, 1.1), 17.6)
add(whoosh(1.4, 0.6, 0.1), 17.6)
add(ping(880, 2.5, 0.18), 17.75)

# 20–24: l'auto esce dal fumo (0,5 s di silenzio, poi fari e accelerata)
add(clank(0.9, 220, 0.5, seed=80), 20.55)
add(zap(0.3, 0.5), 20.55)
emerge_len = 4.0
tt = np.arange(int(emerge_len * SR)) / SR
rpm = 900 + 5200 * np.clip((tt - 0.1) / 3.2, 0, 1) ** 1.6
rpm += 700 * np.sin(tt * 3) * (tt < 1)
eng2 = engine(rpm, 0.75, seed=5) * np.clip(tt / 0.3, 0, 1)
add(eng2, 20.6, 0.9)
add(riser(1.0, 500, 9000, 0.4), 23.0)
add(whoosh(1.6, 0.8, 0.6), 23.2)

# 24–27: tunnel ad alta velocità
tun_len = 3.0
tt = np.arange(int(tun_len * SR)) / SR
rpm = 6200 - 600 * np.sin(tt * 2.1)
eng3 = engine(rpm, 0.8, seed=9)
eng3[: int(0.1 * SR)] *= np.linspace(0, 1, int(0.1 * SR))
add(eng3, 24.0, 0.85)
wind = onepole_lp(rng.standard_normal(len(tt)), 1800) * 0.25
add(wind, 24.0)
for k in range(6):
    add(whoosh(0.7, 0.35, 0.3), 24.1 + k * 0.48, 1.0, 0.6 if k % 2 else -0.6)

# 27–30: finale — motore che si spegne, ultimo colpo, coda
tt = np.arange(int(1.6 * SR)) / SR
rpm = 6000 * np.exp(-tt * 4) + 700
eng4 = engine(rpm, 0.6, seed=11) * np.exp(-tt * 2.2)
add(eng4, 27.0, 0.8)
add(boom(3.0, 100, 28, 1.0), 27.3)
add(ping(660, 2.6, 0.12), 27.9)
add(ping(990, 2.6, 0.08), 27.95)

# ---------------- mix ----------------
mix = np.stack([L, R], axis=1)
# riverbero semplice: alcune eco filtrate
rev = np.zeros_like(mix)
for d, g in [(0.031, 0.35), (0.047, 0.3), (0.071, 0.25), (0.113, 0.2), (0.173, 0.15), (0.241, 0.1)]:
    k = idx(d)
    rev[k:, 0] += mix[:-k, 1] * g
    rev[k:, 1] += mix[:-k, 0] * g
mix = mix + 0.35 * rev
peak = np.max(np.abs(mix))
mix = np.tanh(mix / peak * 1.4) / np.tanh(1.4) * 0.92
fade = np.ones(N)
fo = idx(1.2)
fade[-fo:] = np.linspace(1, 0, fo)
mix *= fade[:, None]

out = sys.argv[1] if len(sys.argv) > 1 else "audio.wav"
pcm = (mix * 32767).astype(np.int16)
with wave.open(out, "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print("scritto", out)
