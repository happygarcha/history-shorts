"""Validate a story JSON before the long build.  usage: python check_story.py stories/<file>.json
Exits non-zero with a clear list of problems so the author can fix the JSON and retry."""
import json, re, sys

MOTIFS = {'icons', 'alert', 'world_map', 'stat_chart', 'portrait', 'building', 'city_rain', 'forest_dig', 'ship_sea', 'desert_ruins',
          'map_path', 'document', 'castle_night', 'dna_lab', 'cta'}
ICONS = {'globe', 'coin', 'arrowUp', 'arrowDown', 'chip', 'flame', 'bank', 'people', 'clock', 'scale', 'house', 'shield', 'check', 'cross'}
ACRONYM_OK = {'DNA', 'AI', 'USA', 'UK', 'UN'}
story = json.load(open(sys.argv[1]))
errs = []
def need(c, msg):
    if not c: errs.append(msg)
ARABIC = re.compile(r'[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]')

lang = story.get('lang', 'en')
need(lang in ('en', 'hi', 'pa', 'ur'), 'lang: must be en, hi (Hindi), pa (Punjabi) or ur (Urdu)')
need(story.get('kind') in ('history', 'current'), 'kind: must be "history" or "current"')
if story.get('kind') == 'current':
    need(re.fullmatch(r'\d{4}-\d{2}-\d{2}', str(story.get('asof', ''))), 'asof: current-affairs stories need the date the facts are accurate as of (YYYY-MM-DD)')
    need(all(re.search(r'20\d\d', x) for x in story.get('sources', [])), 'sources: for current affairs every source must include its date, e.g. "Reuters, 2026-10-12"')
    need(len(story.get('sources', [])) >= 3, 'sources: current-affairs stories need at least 3 independent reputable sources')
need(isinstance(story.get('hud'), str) and 8 <= len(story['hud']) <= 40, 'hud: short title (8-40 chars)')
need(isinstance(story.get('sources'), list) and len(story['sources']) >= 2, 'sources: at least 2 real sources')
sc = story.get('scenes', [])
NS = len(sc)
need(NS in (6, 9), f'scenes: need 6 (30 s) or 9 (45 s, preferred: more detail); found {NS}')
chain_n = 0
maxw = 14 if lang == 'en' else 12

def shown(s):  # every field the viewer reads on screen
    out = []
    for k in ('cap', 'kicker', 'sub', 'reveal', 'bubble', 'cta', 'title', 'footer', 'headline', 'recap', 'poll', 'facts'):
        v = s.get(k)
        if isinstance(v, str): out.append(v)
        elif isinstance(v, list): out += [x for x in v if isinstance(x, str)]
    ch = s.get('chart', {}); out += [ch.get('title', ''), *[b.get('label', '') for b in ch.get('bars', [])]]
    out += [s.get('chain', {}).get('label', ''), s.get('chain', {}).get('link', '')]
    out += [i.get('t', '') for i in s.get('icons', [])] + [p.get('name', '') for p in s.get('pins', [])]
    for k in ('left', 'right'):
        if isinstance(s.get(k), dict): out += s[k].get('labels', []) + s[k].get('lines', []) + [s[k].get('verdict', '')]
    return out

for i, s in enumerate(sc):
    p = f'scene {i + 1}'
    first, last = i == 0, i == NS - 1
    need(s.get('motif') in MOTIFS, f'{p}: motif must be one of {sorted(MOTIFS)}')
    vo = s.get('vo', '')
    words = len(vo.split())
    need(4 <= words <= maxw, f'{p}: vo has {words} words (use 4-{maxw} so it fits 5 s at a natural pace)')
    if lang == 'ur':
        need(bool(s.get('cap')), f'{p}: Urdu needs "cap": the subtitle text in Roman Urdu (Latin letters); the owner cannot read Urdu script')
    for txt in shown(s): need(not ARABIC.search(txt), f'{p}: on-screen text must not be in Urdu/Arabic script (use Roman Urdu or Hindi/English): {txt!r}')
    if lang == 'en':
        for a in re.findall(r'\b[A-Z]{3,}\b', vo):
            need(a in ACRONYM_OK, f'{p}: acronym {a!r} in the spoken text; say it in plain words (e.g. "a group that watches the world\'s money")')
        for w in re.findall(r'[A-Za-z]{13,}', vo): need(False, f'{p}: very long word {w!r}; use a simpler word')
    if s.get('kicker'): need(len(s['kicker']) <= 22, f'{p}: kicker too long (max 22): {s["kicker"]!r}')
    if s.get('sub'): need(len(s['sub']) <= 42, f'{p}: sub too long (max 42): {s["sub"]!r}')
    if s.get('reveal'): need(len(s['reveal']) <= 34, f'{p}: reveal too long (max 34): {s["reveal"]!r}')
    for l in s.get('headline', []): need(len(l) <= 16, f'{p}: headline line too long (max 16): {l!r}')
    f = s.get('facts', [])
    need(len(f) <= 3, f'{p}: at most 3 facts')
    for x in f: need(len(x) <= 40, f'{p}: fact too long (max 40): {x!r}')
    if not first and not last:
        c = s.get('chain')
        need(isinstance(c, dict) and c.get('label'), f'{p}: needs "chain": {{"label": <=18 chars, "link": <=9 chars}} (the story chain bar: each step links to the last)')
        if isinstance(c, dict) and c.get('label'):
            chain_n += 1
            need(len(c['label']) <= 18, f'{p}: chain label too long (max 18): {c["label"]!r}')
            need(len(c.get('link', '')) <= 9, f'{p}: chain link word too long (max 9): {c.get("link")!r}')
        need(len(f) >= 2, f'{p}: story scenes need 2-3 on-screen facts (who / where / what) so viewers can follow without sound')
    if s.get('motif') == 'icons':
        ic = s.get('icons', [])
        need(2 <= len(ic) <= 3 and all(i.get('n') in ICONS and 0 < len(i.get('t', '')) <= 20 for i in ic), f'{p}: icons needs 2-3 items {{n: one of {sorted(ICONS)}, t: <=20 chars}}')
    if s.get('motif') == 'cta':
        need(len(s.get('recap', [])) >= 2, f'{p}: cta needs recap (2-3 verdict lines: the answer in plain words)')
        need(len(s.get('poll', [])) == 2, f'{p}: cta needs poll with exactly 2 short options (comment bait)')
        for x in s.get('recap', []): need(len(x) <= 40, f'{p}: recap line too long (max 40): {x!r}')
        for x in s.get('poll', []): need(len(x) <= 22, f'{p}: poll option too long (max 22): {x!r}')
    if s.get('motif') == 'world_map':
        need(1 <= len(s.get('pins', [])) <= 4 and all({'name', 'lon', 'lat'} <= set(q) for q in s.get('pins', [])), f'{p}: world_map needs pins[1-4] with name, lon, lat')
    if s.get('motif') == 'stat_chart':
        ch = s.get('chart', {})
        need(ch.get('title') and 2 <= len(ch.get('bars', [])) <= 5 and all({'label', 'value'} <= set(b) for b in ch.get('bars', [])), f'{p}: stat_chart needs chart.title and 2-5 bars with label, value (real figures from your sources)')
    if s.get('motif') == 'dna_lab':
        for k in ('left', 'right'): need(isinstance(s.get(k), dict) and len(s[k].get('labels', [])) == 2 and s[k].get('verdict') and s[k].get('lines'), f'{p}: dna_lab needs {k}.labels[2], verdict, lines')
need(sc and sc[-1].get('motif') == 'cta', 'last scene must be motif "cta"')
need(chain_n >= 4, f'chain: at least 4 scenes need a chain node (found {chain_n}); the chain is what lets viewers follow the story step by step')
if errs:
    print('STORY CHECK FAILED:'); [print(' -', e) for e in errs]; sys.exit(1)
print('story check ok')
