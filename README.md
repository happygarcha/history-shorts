# history-shorts

Daily 30-second vertical (9:16) history/genealogy-mystery shorts, built with free local tools only.

- **Voice:** Kokoro neural TTS (local, model downloaded from GitHub releases by `setup.sh`). Piper voices live on Hugging Face, which is blocked in the cloud sandbox.
- **Visuals:** original illustrated motion graphics (11 motifs in `web/scene.js`), driven by a story JSON. No stock or archive downloads (those hosts are blocked, and fake archival photos of real people are not used).
- **Audio:** synthesized music bed and sound effects, ducked under the voice.
- **Subtitles:** bold, uppercase, word-timed, burned in, lower-middle third.
- **Compile:** headless Chromium renders 900 frames, FFmpeg muxes the MP4.

```
./setup.sh                                   # once per container
./build.sh stories/<date>-<slug>.json        # -> out/<date>-<slug>.mp4 (about 10 min)
```

`topic_history.txt` records past topics so the daily job never repeats one. `daily_prompt.md` holds the instructions the scheduled run follows; `daily_shorts.sh` runs them locally with `claude -p`.

Check on-screen claims before posting: the facts come from the model plus web search, not a human editor.
