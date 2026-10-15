# history-shorts

Daily 30-45 second vertical (9:16) explainer shorts in English, Hindi, Punjabi or Urdu: history/genealogy mysteries and verified current world affairs, in plain words, built with free local tools only.

- **Languages:** en, hi (Devanagari), pa (Gurmukhi), ur (spoken Urdu; every on-screen word in Roman Urdu because the owner cannot read Urdu script). Noto fonts are bundled in `web/fonts`.
- **Voice:** Kokoro neural TTS (local, model downloaded from GitHub releases by `setup.sh`). Piper voices live on Hugging Face, which is blocked in the cloud sandbox.
- **Visuals:** original illustrated motion graphics (16 motifs in `web/scene.js`: map, charts, line icons, warning sign, silhouettes and more), driven by a story JSON. No stock or archive downloads (those hosts are blocked, and fake archival photos of real people are not used).
- **Audio:** synthesized music bed and sound effects, ducked under the voice.
- **Subtitles:** bold, uppercase, word-timed, burned in, lower-middle third.
- **Compile:** headless Chromium renders 900 frames, FFmpeg muxes the MP4.

```
./setup.sh                                   # once per container
./build.sh stories/<date>-<slug>.json        # -> out/<date>-<slug>.mp4 (6 scenes = 30 s, 9 scenes = 45 s; about 10-15 min)
```

**What makes each video easy to follow (retention and engagement):** a **story chain** bar (each step links to the previous one: A BIG REPORT > THE QUESTION > THE ANSWER ...), a chapter progress bar, on-screen WHO/WHERE/WHAT fact cards, a red "reveal" line, a running timeline of dates, word-by-word subtitles, a verdict recap, a two-option comment poll and a question bubble, plus a ready-to-paste post package (`posts/`: title, description, hashtags, pinned comment, chapters, cover frame, fact-check list). `check_story.py` rejects stories that lack these before the 10-minute build.

`topic_history.txt` records past topics so the daily job never repeats one. `daily_prompt.md` holds the instructions the scheduled run follows; `daily_shorts.sh` runs them locally with `claude -p`.

Check on-screen claims before posting: the facts come from the model plus web search, not a human editor.
