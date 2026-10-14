"""Validate a story JSON before the 10-minute build.  usage: python check_story.py stories/<file>.json
Exits non-zero with a clear list of problems so the author can fix the JSON and retry."""
import json, sys

MOTIFS = {'world_map', 'stat_chart', 'portrait', 'building', 'city_rain', 'forest_dig', 'ship_sea', 'desert_ruins', 'map_path', 'document', 'castle_night', 'dna_lab', 'cta'}
story = json.load(open(sys.argv[1]))
errs = []
def need(c, msg):
    if not c: errs.append(msg)

need(story.get('kind') in ('history', 'current'), 'kind: must be "history" or "current"')
if story.get('kind') == 'current':
    import re
    need(re.fullmatch(r'\d{4}-\d{2}-\d{2}', str(story.get('asof', ''))), 'asof: current-affairs stories need the date the facts are accurate as of (YYYY-MM-DD)')
    need(all(re.search(r'20\d\d', x) for x in story.get('sources', [])), 'sources: for current affairs every source must include its publication date/year, e.g. "Reuters, 2026-10-12"')
    need(len(story.get('sources', [])) >= 3, 'sources: current-affairs stories need at least 3 independent reputable sources')
need(isinstance(story.get('hud'), str) and 8 <= len(story['hud']) <= 40, 'hud: short case-file title (8-40 chars), e.g. "CASE FILE: THE LOST PRINCESS"')
need(isinstance(story.get('sources'), list) and len(story['sources']) >= 2, 'sources: at least 2 real sources (shown on the last scene and in the post package)')
sc = story.get('scenes', [])
need(len(sc) == 6, f'scenes: need exactly 6 (found {len(sc)})')
tl_years = []
for i, s in enumerate(sc):
    p = f'scene {i + 1}'
    need(s.get('motif') in MOTIFS, f'{p}: motif must be one of {sorted(MOTIFS)}')
    words = len(s.get('vo', '').split())
    need(5 <= words <= 14, f'{p}: vo has {words} words (use 5-14 so it fits 5 s at a natural pace)')
    if s.get('kicker'): need(len(s['kicker']) <= 22, f'{p}: kicker too long (max 22): {s["kicker"]!r}')
    if s.get('sub'): need(len(s['sub']) <= 42, f'{p}: sub too long (max 42): {s["sub"]!r}')
    if s.get('reveal'): need(len(s['reveal']) <= 34, f'{p}: reveal too long (max 34): {s["reveal"]!r}')
    for l in s.get('headline', []): need(len(l) <= 16, f'{p}: headline line too long (max 16): {l!r}')
    f = s.get('facts', [])
    need(len(f) <= 3, f'{p}: at most 3 facts')
    for x in f: need(len(x) <= 40, f'{p}: fact too long (max 40): {x!r}')
    if s.get('motif') not in ('portrait', 'dna_lab', 'cta') and i not in (0, 5):
        need(len(f) >= 2, f'{p}: story scenes need 2-3 on-screen facts (who / where / what) so viewers can follow without sound')
    if s.get('tl'):
        tl_years.append(s['tl'].get('year'))
        need(len(s['tl'].get('year', '')) <= 10 and len(s['tl'].get('label', '')) <= 18, f'{p}: tl year<=10, label<=18 chars')
    if s.get('motif') == 'cta':
        need(len(s.get('recap', [])) >= 2, f'{p}: cta needs recap (2-3 verdict lines: the answer in plain words)')
        need(len(s.get('poll', [])) == 2, f'{p}: cta needs poll with exactly 2 short options (comment bait)')
        for x in s.get('recap', []): need(len(x) <= 40, f'{p}: recap line too long (max 40): {x!r}')
        for x in s.get('poll', []): need(len(x) <= 22, f'{p}: poll option too long (max 22): {x!r}')
    if s.get('motif') == 'world_map':
        need(1 <= len(s.get('pins', [])) <= 4 and all({'name', 'lon', 'lat'} <= set(p) for p in s.get('pins', [])), f'{p}: world_map needs pins[1-4] with name, lon, lat')
    if s.get('motif') == 'stat_chart':
        ch = s.get('chart', {})
        need(ch.get('title') and 2 <= len(ch.get('bars', [])) <= 5 and all({'label', 'value'} <= set(b) for b in ch.get('bars', [])), f'{p}: stat_chart needs chart.title and 2-5 bars with label, value (real figures from your sources)')
    if s.get('motif') == 'dna_lab':
        for k in ('left', 'right'): need(isinstance(s.get(k), dict) and len(s[k].get('labels', [])) == 2 and s[k].get('verdict') and s[k].get('lines'), f'{p}: dna_lab needs {k}.labels[2], verdict, lines')
need(len(tl_years) >= 3, 'timeline: at least 3 scenes need a "tl" {year,label} entry (the running timeline is what makes the story easy to follow)')
if errs:
    print('STORY CHECK FAILED:'); [print(' -', e) for e in errs]; sys.exit(1)
print('story check ok')
