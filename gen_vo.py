"""Story JSON -> narration audio (Kokoro, local) + per-word subtitle timings.

usage: python gen_vo.py stories/<file>.json
Writes: vo/voice_raw.wav (5 s per scene, 44.1 kHz mono) and web/timings.json
Languages: en, hi (Hindi), pa (Punjabi), ur (Urdu). "vo" is the spoken script (Urdu in Urdu script, Hindi in
Devanagari, Punjabi in Gurmukhi). "cap" (optional, default = vo) is the subtitle text the viewer reads
(Urdu uses Roman Urdu in Latin letters). Each scene's voice-over must fit its 5-second slot; speed rises up
to 1.32 to fit, otherwise the build fails so the author trims words instead of rushing the voice.
"""
import json, re, sys, os
import numpy as np, soundfile as sf
from scipy import signal
from kokoro_onnx import Kokoro

SR = 44100
story = json.load(open(sys.argv[1]))
scenes = story['scenes']
N = len(scenes)
assert N in (6, 9), 'story must have 6 or 9 scenes'
LANG = story.get('lang', 'en')
KLANG = {'en': 'en-us', 'hi': 'hi', 'pa': 'pa', 'ur': 'ur'}[LANG]
VOICE = story.get('voice') or {'en': 'am_michael', 'hi': 'hm_omega', 'pa': 'hm_psi', 'ur': 'hm_omega'}[LANG]
k = Kokoro('models/kokoro-v1.0.int8.onnx', 'models/voices-v1.0.bin')
os.makedirs('vo', exist_ok=True)
full = np.zeros(int(5 * N * SR))
out = []
for i, sc in enumerate(scenes):
    text = sc['vo']
    cap = sc.get('cap', text)
    start = i * 5 + (0.05 if i == 0 else 0.15)
    speed = 1.12 if LANG == 'en' else 1.0
    while True:
        if LANG == 'pa' and os.path.exists(f'vo/pa_{i}.wav'):  # native Punjabi voice (AI4Bharat), rendered by synth_pa.sh
            s, sr = sf.read(f'vo/pa_{i}.wav')
        else:
            s, sr = k.create(text, voice=VOICE, speed=speed, lang=KLANG)
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
    words = cap.split()
    wt = [len(re.sub(r'[\W_]', '', w)) + (4 if re.search(r'[.?!।]$', w) else 2 if re.search(r'[,،]$', w) else 0) + 1.5 for w in words]
    tot = sum(wt); t = start; ws = []
    for w, x in zip(words, wt):
        d = dur * x / tot
        ws.append({'w': w, 't0': round(t, 3), 't1': round(t + d, 3)})
        t += d
    out.append({'scene': i, 'start': start, 'end': start + dur, 'speed': round(speed, 2), 'words': ws})
    print(f'scene {i + 1}: {start:.2f}->{start + dur:.2f} ({dur:.2f}s, speed {speed:.2f})')
os.makedirs('web', exist_ok=True)
json.dump(out, open('web/timings.json', 'w'), indent=1, ensure_ascii=False)
sf.write('vo/voice_raw.wav', full.astype(np.float32), SR)
