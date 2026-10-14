"""Story JSON -> narration audio (Kokoro, local) + per-word timings.

usage: python gen_vo.py stories/<file>.json
Writes: vo/voice_raw.wav (30 s, 44.1 kHz mono) and web/timings.json
Each scene's voice-over must fit its 5-second slot; speed rises (max 1.32) to fit, otherwise the build fails
so the story author trims words instead of rushing the voice.
"""
import json, re, sys, os
import numpy as np, soundfile as sf
from scipy import signal
from kokoro_onnx import Kokoro

SR = 44100
story = json.load(open(sys.argv[1]))
scenes = story['scenes']
assert len(scenes) == 6, 'story must have exactly 6 scenes'
k = Kokoro('models/kokoro-v1.0.int8.onnx', 'models/voices-v1.0.bin')
VOICE = story.get('voice', 'am_michael')
os.makedirs('vo', exist_ok=True)
full = np.zeros(int(30 * SR))
out = []
for i, sc in enumerate(scenes):
    text = sc['vo']
    start = i * 5 + (0.05 if i == 0 else 0.15)
    speed = 1.12
    while True:
        s, sr = k.create(text, voice=VOICE, speed=speed, lang='en-us')
        s = np.asarray(s, dtype=np.float64)
        if sr != SR:
            s = signal.resample_poly(s, SR, sr)
        idx = np.where(np.abs(s) > 0.01 * np.abs(s).max())[0]
        s = s[idx[0]: idx[-1] + 1]
        dur = len(s) / SR
        if dur <= 4.65 or speed >= 1.32:
            break
        speed += 0.04
    if dur > 4.8:
        sys.exit(f'scene {i + 1} voice-over is {dur:.2f}s even at speed {speed:.2f}; trim the words: {text!r}')
    s *= 0.9 / np.abs(s).max()
    a = int(start * SR)
    full[a:a + len(s)] += s
    words = text.split()
    wt = [len(re.sub(r'\W', '', w)) + (4 if re.search(r'[.?!]$', w) else 2 if w.endswith(',') else 0) + 1.5 for w in words]
    tot = sum(wt); t = start; ws = []
    for w, x in zip(words, wt):
        d = dur * x / tot
        ws.append({'w': w, 't0': round(t, 3), 't1': round(t + d, 3)})
        t += d
    out.append({'scene': i, 'start': start, 'end': start + dur, 'speed': round(speed, 2), 'words': ws})
    print(f'scene {i + 1}: {start:.2f}->{start + dur:.2f} ({dur:.2f}s, speed {speed:.2f})')
os.makedirs('web', exist_ok=True)
json.dump(out, open('web/timings.json', 'w'), indent=1)
sf.write('vo/voice_raw.wav', full.astype(np.float32), SR)
