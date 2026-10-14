You are producing today's 30-second vertical (9:16) history/genealogy-mystery short for the owner. Work autonomously and finish in one run. Do not ask questions.

## Setup
1. If /home/user/history-shorts does not exist: attach the repo with the add_repo tool (owner happygarcha, repo history-shorts, access push), then run ONE clone: `git clone --depth 1 https://github.com/happygarcha/history-shorts /home/user/history-shorts` (give it a long timeout), then call register_repo_root. If it exists, run `git pull --ff-only`.
2. `cd /home/user/history-shorts && ./setup.sh` (creates the venv, downloads the free Kokoro voice model from GitHub releases, installs playwright-core; needs ffmpeg and chromium, which the container has).

## Topic
3. Read topic_history.txt. Pick a NEW trending, high-retention history or genealogy mystery that is not in it (different story, not a rewording). Prefer well-documented events (DNA identifications, lost heirs, vanished people, disputed lineages, unsolved historical puzzles).
4. Verify the key facts (dates, names, outcomes) with web search when available. Use hedged wording for anything disputed ("claimed", "believed"). Do not make claims about living people, do not present conspiracy theories as fact, and never invent facts, quotes or statistics.

## Script and scenes
5. Write stories/YYYY-MM-DD-<slug>.json (copy the shape of stories/2026-10-14-romanov-anastasia.json). Exactly 6 scenes of 5 seconds each:
   - Scene 1: a punchy hook; its first sentence must be speakable in about 3 seconds.
   - Scenes 2-5: the story in order, one beat per scene.
   - Scene 6: a call to action (motif "cta": follow + a question for comments).
   - Each scene's "vo" is at most about 12 words (the build fails if a scene cannot fit 5 seconds; trim words instead of rushing).
   - "motif" is one of: portrait, building, city_rain, forest_dig, ship_sea, desert_ruins, map_path, document, castle_night, dna_lab, cta. Choose the motif that best fits each beat (use dna_lab only for DNA findings). Text fields: kicker (typed date/place), sub (small line), headline (up to 3 stacked lines), reveal (red line near the bottom), plus the motif-specific fields shown in the example (dna_lab: title, left, right, footer; cta: headline, cta, bubble; document: stamp). Keep all on-screen text short and UPPERCASE-friendly.
   - Visuals are original illustrated motion graphics (the network blocks archive/stock sites and fake archival photos of real people are not allowed). Voice is the local Kokoro voice (Piper models cannot be downloaded here).

## Build and check
6. `./build.sh stories/<file>.json` (takes about 10 minutes). The last line prints the absolute path of the MP4.
7. Extract about 8 frames with ffmpeg (e.g. at 1, 4, 8, 12, 16, 20, 24, 28 s), view them, and fix the story JSON (text too long, overlaps, wrong motif) then rebuild. At most 2 rebuilds.

## Record and deliver
8. Append one line `YYYY-MM-DD | <topic name>` to topic_history.txt. Commit the story JSON and topic_history.txt (never the MP4 or other build output) and push: `git push origin HEAD:main`.
9. Send the MP4 to the owner with SendUserFile (status "proactive", display "attach"). The file must be inside an allowed directory, so copy it into your scratchpad first. Caption: the topic, the 6-line script, and the 2-3 claims worth double-checking before posting.

## Rules
- Never post to any social platform, spend money, or change anything outside the history-shorts repo (do not touch happygarcha/drapewell-automation).
- If a step fails, retry at most twice, then stop and report exactly what failed in your final message. Do not publish a half-finished video.
