"""Story JSON -> music bed + sound effects (all synthesized, no downloads), plus a processed voice track.

usage: python audio.py stories/<file>.json
Writes vo/voice.wav, vo/music.wav, vo/sfx.wav (30 s each). build.sh mixes them with ducking.
"""
import json, sys
import numpy as np, soundfile as sf
from scipy import signal

SR = 44100; DUR = 30.0; N = int(SR * DUR)
rng = np.random.default_rng(11)
story = json.load(open(sys.argv[1]))
motifs = [s['motif'] for s in story['scenes']]


def place(buf, x, at, g=1.0):
    i = int(at * SR)
    if i >= len(buf): return
    j = min(len(buf), i + len(x)); buf[i:j] += x[: j - i] * g
def env(n, a=0.003, d=0.05):
    e = np.ones(n); na = max(1, int(a * SR)); e[:na] = np.linspace(0, 1, na); nd = max(1, int(d * SR)); e[-nd:] *= np.linspace(1, 0, nd); return e
def lp(x, f): b, a = signal.butter(2, f / (SR / 2), 'low'); return signal.lfilter(b, a, x)
def hp(x, f): b, a = signal.butter(2, f / (SR / 2), 'high'); return signal.lfilter(b, a, x)
def bp(x, f0, f1): b, a = signal.butter(2, [f0 / (SR / 2), f1 / (SR / 2)], 'band'); return signal.lfilter(b, a, x)
def tone(f, d, kind='sine'):
    t = np.arange(int(d * SR)) / SR
    if kind == 'sine': return np.sin(2 * np.pi * f * t)
    if kind == 'square': return np.sign(np.sin(2 * np.pi * f * t)) * 0.6
    if kind == 'saw': return 2 * ((f * t) % 1) - 1
def glide(f0, f1, d):
    n = int(d * SR); ph = 2 * np.pi * np.cumsum(np.linspace(f0, f1, n)) / SR; return np.sin(ph)
def noise(d): return rng.standard_normal(int(d * SR))


# voice: presence EQ + soft limit
v, _ = sf.read('vo/voice_raw.wav'); v = hp(v, 70); v = v + 0.25 * bp(v, 2200, 5200); v = np.tanh(v * 1.25) / 1.25
sf.write('vo/voice.wav', v.astype(np.float32), SR)

t = np.arange(N) / SR
# ---- music: dark pad, heartbeat, building arpeggio, risers, resolve ----
mus = np.zeros(N); pad = np.zeros(N)
for f in [73.42, 110.0, 146.83, 174.61, 220.0]:
    for det in (-0.5, 0.0, 0.5): pad += (2 * (((f + det) * t) % 1) - 1) * 0.1
pad = lp(pad, 650) * np.clip(t / 2.0, 0, 1); mus += pad * 0.55
sh = np.zeros(N)
for f in [87.31, 130.81, 164.81, 196.0]: sh += np.sin(2 * np.pi * f * t) * 0.1
mus += sh * np.clip((t - 15) / 1.0, 0, 1) * (1 - np.clip((t - 25) / 0.5, 0, 1))
res = np.zeros(N)
for f in [146.83, 185.0, 220.0, 293.66]: res += np.sin(2 * np.pi * f * t) * 0.1
mus += res * np.clip((t - 25) / 1.5, 0, 1)
tt = 0.0
while tt < 29.5:
    bpm = 72 + 28 * min(1, tt / 25); period = 60 / bpm
    for k, (off, g) in enumerate([(0, 0.55), (0.17, 0.4)]):
        n = int(0.22 * SR); note = np.sin(2 * np.pi * (58 - 8 * k) * np.arange(n) / SR) * np.exp(-np.arange(n) / SR * 14)
        place(mus, note, tt + off, g * (0.5 + 0.5 * min(1, tt / 5)))
    tt += period
arp = [293.66, 349.23, 440.0, 523.25]
for i in range(int(30 / 0.2)):
    at = i * 0.2
    if at < 10 or at > 25: continue
    n = int(0.08 * SR); note = np.sin(2 * np.pi * arp[i % 4] * np.arange(n) / SR) * np.exp(-np.arange(n) / SR * 45)
    place(mus, note, at, 0.05 + 0.08 * (at - 10) / 15)
for cut in [5, 10, 15, 20, 25]:
    n = int(0.9 * SR); r = bp(noise(0.9), 600, 7000) * np.linspace(0, 1, n) ** 2; place(mus, r, cut - 0.9, 0.11)
mus = np.tanh(mus * 1.3) * np.clip((DUR - t) / 1.0, 0, 1)
sf.write('vo/music.wav', mus.astype(np.float32), SR)

# ---- SFX ----
sfx = np.zeros(N)
def impact(at, g=1.0):
    place(sfx, glide(110, 38, 0.5) * env(int(0.5 * SR), 0.002, 0.45) * 0.9, at, g)
    place(sfx, bp(noise(0.12), 400, 5000) * env(int(0.12 * SR), 0.001, 0.1) * 0.6, at, g * 0.7)
def whoosh(at, d=0.6, g=0.5):
    w = noise(d); sw = np.linspace(0, 1, len(w)); place(sfx, bp(w, 300, 4500) * np.sin(np.pi * sw) ** 2, at, g)
def typer(at, n, step):
    for i in range(n): place(sfx, bp(noise(0.02), 1500, 6000) * env(int(0.02 * SR), 0.0005, 0.018), at + i * step, 0.35)
impact(0.0, 1.1)
for c in [5, 10, 15, 20, 25]:
    whoosh(c - 0.35, 0.5, 0.45); impact(c, 0.85)
for i, sc in enumerate(story['scenes']):
    b = i * 5; m = sc['motif']
    if sc.get('kicker'): typer(b + 0.15, min(14, len(sc['kicker'])), 1 / 10)
    if m == 'building':
        for j in range(7): place(sfx, tone(880 * 0.75 ** (j % 3), 0.25) * env(int(0.25 * SR), 0.003, 0.22) * 0.2, b + 2.4 + j * 0.25, 1.0)
    elif m == 'city_rain':
        place(sfx, hp(noise(5.0), 3500) * 0.12 * env(int(5 * SR), 0.5, 0.8), b, 1.0)
        place(sfx, glide(300, 150, 0.6) * env(int(0.6 * SR), 0.01, 0.5) * 0.4, b + 2.15, 1.0)
    elif m in ('forest_dig', 'desert_ruins'):
        for j in range(4): place(sfx, glide(90, 50, 0.18) * env(int(0.18 * SR), 0.002, 0.15) * 0.7, b + 0.9 + j * 0.28, 0.8)
        place(sfx, glide(300, 1600, 1.1) * env(int(1.1 * SR), 0.05, 0.4) * 0.2, b + 1.3, 1.0)
    elif m == 'ship_sea':
        place(sfx, lp(noise(5.0), 700) * 0.25 * env(int(5 * SR), 0.6, 0.8), b, 1.0)
        for j in range(3): place(sfx, tone(330, 0.5) * env(int(0.5 * SR), 0.003, 0.45) * 0.12, b + 1.2 + j * 1.0, 1.0)
    elif m == 'castle_night':
        place(sfx, lp(noise(5.0), 500) * 0.2 * env(int(5 * SR), 0.6, 0.8), b, 1.0)
        place(sfx, glide(200, 90, 1.2) * env(int(1.2 * SR), 0.1, 0.9) * 0.25, b + 2.0, 1.0)
    elif m in ('map_path', 'document'):
        for j in range(6): place(sfx, bp(noise(0.05), 800, 4000) * env(int(0.05 * SR), 0.002, 0.04) * 0.5, b + 0.8 + j * 0.45, 0.6)
        place(sfx, bp(noise(0.12), 200, 2500) * env(int(0.12 * SR), 0.001, 0.1) * 0.9, b + 3.2, 0.7)
    elif m == 'dna_lab':
        for j in range(10): place(sfx, tone(1320 + 120 * (j % 4), 0.04, 'square') * env(int(0.04 * SR), 0.002, 0.03) * 0.3, b + 0.3 + j * 0.07, 0.6)
        place(sfx, (tone(1175, 0.45) + tone(1760, 0.45) * 0.6) * env(int(0.45 * SR), 0.003, 0.4) * 0.3, b + 1.3, 1.0)
        place(sfx, tone(110, 0.55, 'saw') * env(int(0.55 * SR), 0.005, 0.1) * 0.35, b + 2.9, 1.0)
        place(sfx, glide(500, 900, 0.3) * env(int(0.3 * SR), 0.005, 0.2) * 0.2, b + 3.7, 1.0)
    elif m == 'cta':
        place(sfx, glide(600, 1500, 0.12) * env(int(0.12 * SR), 0.002, 0.1) * 0.35, b + 1.0, 1.0)
        place(sfx, (tone(988, 0.25) + tone(1318, 0.25)) * env(int(0.25 * SR), 0.002, 0.2) * 0.2, b + 2.2, 1.0)
sf.write('vo/sfx.wav', sfx.astype(np.float32), SR)
print('audio ok')
