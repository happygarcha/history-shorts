You are producing today's 30-second vertical (9:16) history/genealogy-mystery short for the owner. The goals are: a viewer who watches with or without sound understands the whole story, stays to the end, and is moved to follow, like, comment and rewatch. Work autonomously and finish in one run. Do not ask questions.

## Setup
1. If /home/user/history-shorts does not exist: attach the repo with the add_repo tool (owner happygarcha, repo history-shorts, access push), then run ONE clone: `git clone --depth 1 https://github.com/happygarcha/history-shorts /home/user/history-shorts` (long timeout), then call register_repo_root. If it exists, run `git pull --ff-only`.
2. `cd /home/user/history-shorts && ./setup.sh` (venv, free Kokoro voice model from GitHub releases, playwright-core; ffmpeg and chromium come with the container).

## Topic (research it properly)
3. Read topic_history.txt. Alternate between two kinds of story, and pick a topic that is NOT already in the history (a different story, not a rewording):
   - **history** ("kind": "history"): a trending, high-retention history or genealogy mystery with a satisfying answer or a genuine open question (DNA identifications, lost heirs, vanished people, disputed lineages, unsolved puzzles).
   - **current** ("kind": "current"): an interesting, verifiable development in world affairs that people are searching for right now (science and space, technology, economy, climate and nature, global culture, notable discoveries, major events). Use web search to find stories from the last 7 days that at least 3 independent reputable sources report. Explain what happened, why it matters, and what is still unknown. Use the world_map and stat_chart motifs where they help.
4. Research it with web search and verify every date, name, place, number and outcome in at least 2 independent sources (3 for current affairs, each with its publication date). Put the source names in the story JSON ("sources"; for current affairs include the date, e.g. "Reuters, 2026-10-12", and set "asof" to today's date).

### Accuracy, legality and legitimacy (hard rules)
- Only state what the sources support. Attribute contested claims ("according to ...", "claimed", "believed"). Mark the date current facts are accurate as of. Never invent facts, quotes, numbers or statistics, and chart only real figures taken from your sources.
- Skip topics where facts are still unconfirmed or breaking, active tragedies where the story would be graphic or exploit victims, ongoing criminal cases naming private individuals, rumors, and conspiracy theories.
- Stay neutral on politics: no election persuasion, no campaigning, no insults or attacks on any person, group, religion, nationality or party; present contested political issues as "what happened / what each side says", sourced.
- No medical, legal or financial advice or miracle claims; no hate, harassment, graphic violence, or content unsafe for minors; nothing that targets or identifies private people; no claims about living people beyond what reputable outlets report.
- Everything on screen is original: illustrations, synthesized music and sound effects, a generated voice. Do not use copyrighted images, clips, music, logos or brand marks, and never fabricate photos, video, voices or quotes of real people. No real-world logos.
- Maps and charts are illustrative: keep the on-screen "ILLUSTRATIVE" labels.

## Story: the viewer must be able to follow it
5. Write stories/YYYY-MM-DD-<slug>.json, copying the shape of stories/2026-10-14-romanov-anastasia.json. Exactly 6 scenes of 5 seconds. Narrate in plain words, one idea per sentence, and name the who, where and when of the story on screen as well as in the voice.
   - Scene 1 (hook): open a curiosity gap with real stakes in the first 3 seconds (a surprising claim, a question, a contradiction). Its first sentence must be speakable in about 3 seconds. Give it a 3-line "headline" and a "sub" that names the subject.
   - Scenes 2-5 (story, in order): one beat each (setup, twist, evidence, answer). Each needs: "kicker" (typed year/place), "sub" (one explanatory line), "reveal" (the key sentence in red), "facts" (2-3 bullets of at most 40 characters answering WHO / WHERE / WHAT: this is how silent viewers follow the story), and "tl" ({"year","label"}) for the running timeline. Define any jargon in a fact (e.g. "DNA TEST = COMPARES FAMILY TRAITS").
   - Scene 6 (payoff and call to action): motif "cta" with "recap" (2-3 lines stating the answer in plain words), "poll" (2 short opposing options, 22 characters max, to bait comments), "bubble" (a question that invites a debate or a topic vote), "cta" ("FOLLOW"). The voice-over ends with a CTA and an open question or tease that points back to the opening hook so the video loops.
   - Top level: "kind" ("history" or "current"), "asof" (YYYY-MM-DD, current only), "hud" (short title, 8-40 chars, e.g. CASE FILE: THE LOST PRINCESS or WORLD WATCH: <TOPIC>), "sources" (the real sources from step 4), "topic", "slug".
   - Each scene's "vo" is 5-14 words. Motif per scene: portrait, building, city_rain, forest_dig, alert, ship_sea, desert_ruins, map_path, document, castle_night, dna_lab (only for real DNA results), cta. Vary the motifs, and match them to the beat (sea mystery: ship_sea; lost route or treasure: map_path; secret papers: document; where something happened or spread: world_map with 1-4 pins {name, lon, lat}; numbers that tell the story: stat_chart with chart {title, suffix, bars:[{label, value}]}; etc.).
   - Visuals are original illustrated motion graphics (stock and archive hosts are blocked in this environment, and fake archival photos of real people are not allowed). Voice is local Kokoro (Piper models cannot be downloaded).
6. `python check_story.py stories/<file>.json` and fix every reported problem before building.

## Build and check
7. `./build.sh stories/<file>.json` (about 10 minutes). The last line prints the MP4's absolute path.
8. Extract about 10 frames with ffmpeg (1, 4, 6, 9, 12, 14, 17, 21, 24, 28 s), view them, and check: no cut-off or overlapping text, facts readable, the timeline fills in order, scene 6 shows the recap. Fix the story JSON and rebuild if not. At most 2 rebuilds.

## Post package (so the owner can publish in one minute)
9. Write posts/<same-name>.md containing:
   - **Title** (60 chars max; a curiosity-gap title with the main keyword, no clickbait lies)
   - **Description**: a one-line hook, a 3-4 line plain summary of the story, "Sources:" with the 2+ sources, a call to follow, and the topic question
   - **Hashtags**: #shorts plus 4-6 specific ones
   - **Pinned comment**: a debate question with two clear sides that matches the on-screen poll
   - **Two reply seeds** the owner can use to keep the thread going
   - **Chapters** with timestamps for the 6 scenes
   - **Cover frame**: the best timestamp for a thumbnail and why
   - **Fact-check list**: the 2-3 claims to verify before posting
   - **Compliance checklist**: sources and dates used; the voice is synthetic (consider the platform's altered/synthetic-content disclosure); all visuals, music and effects are original; no copyrighted material; nothing violates the platform's community guidelines (no hate, harassment, graphic content, medical/financial advice, misinformation)

## Record and deliver
10. Append one line `YYYY-MM-DD | <topic name>` to topic_history.txt. Commit the story JSON, the post package and topic_history.txt (never the MP4 or other build output) and push: `git push origin HEAD:main`.
11. Copy the MP4 into your scratchpad directory and send it to the owner with SendUserFile (status "proactive", display "attach"), with a caption: the topic, the title, the 6-line script, and the fact-check list. Also send the post package file.

## Rules
- Never post to any social platform, spend money, or change anything outside the history-shorts repo (do not touch happygarcha/drapewell-automation).
- If a step fails, retry at most twice, then stop and report exactly what failed. Never deliver a half-finished video.
