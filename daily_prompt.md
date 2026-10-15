You are producing today's 45-second vertical (9:16) explainer short for the owner. The goals: a viewer who watches with or without sound understands the whole story step by step, stays to the end, and is moved to follow, like, comment and rewatch. Work autonomously and finish in one run. Do not ask questions.

## Setup
1. If /home/user/history-shorts does not exist: attach the repo with the add_repo tool (owner happygarcha, repo history-shorts, access push), then run ONE clone: `git clone --depth 1 https://github.com/happygarcha/history-shorts /home/user/history-shorts` (long timeout), then call register_repo_root. If it exists, run `git pull --ff-only`.
2. `cd /home/user/history-shorts && ./setup.sh` (venv, free Kokoro voice model from GitHub releases, playwright-core; ffmpeg and chromium come with the container).

## Language and topic
3. Read topic_history.txt (format `date | lang | kind | topic`). Languages are ONLY English (en), Hindi (hi), Punjabi (pa), Urdu (ur). Rotate: use the language that was used least recently (en, hi, pa, ur order if tied). The owner cannot read Urdu script, only hear it: for Urdu, "vo" (spoken) is in Urdu script, but EVERY on-screen text (cap, headline, sub, kicker, reveal, facts, chain, recap, poll, bubble, hud) is Roman Urdu in Latin letters.
4. Alternate the kind between **history** (a high-retention history or genealogy mystery with a satisfying answer or a real open question) and **current** (an interesting, verifiable world-affairs development from the last 7 days, reported by at least 3 independent reputable sources found by web search). Pick a topic NOT already in the history (a different story, not a rewording).
5. Verify every date, name, place, number and outcome in at least 2 independent sources (3 for current). Put the source names in "sources" (current: include the date, e.g. "Reuters, 2026-10-12", and set "asof" to today).

### Plain words (hard rule)
Write for an ordinary viewer. No jargon or heavy words: not "IMF", "inflation", "GDP", "tariff", "DNA" etc. unless explained in the same breath in simple words (say "a world money group", "prices going up"). Short sentences, one idea each, everyday vocabulary. Numbers: say them simply. For non-English languages write natural spoken language, not translated-sounding text, and write spelled-out numbers in "vo" and digits in "cap". check_story.py rejects hard words.

### Accuracy, legality and legitimacy (hard rules)
- Only state what the sources support. Attribute contested claims. Mark the date current facts are accurate as of. Never invent facts, quotes, numbers or statistics; chart only real figures from the sources.
- Skip unconfirmed or breaking facts, active tragedies, ongoing criminal cases naming private individuals, rumors and conspiracy theories.
- Stay neutral on politics: no persuasion, no insults or attacks on any person, group, religion, nationality or party.
- No medical, legal or financial advice or miracle claims; no hate, harassment, graphic violence, or content unsafe for minors.
- Everything on screen is original: illustrations, synthesized music and effects, a generated voice. No copyrighted images, clips, music, logos or brand marks; never fabricate photos, video, voices or quotes of real people. Keep the "ILLUSTRATIVE" labels on maps and charts.

## Story: the viewer must be able to follow it like a chain
6. Write stories/YYYY-MM-DD-<slug>-<lang>.json, copying the shape of stories/2026-10-14-world-money-news-en.json (use ...-hi.json as the example for a non-English story). Set "lang". Default is 9 scenes of 5 seconds (6 allowed only if the topic is tiny). Plain words, one idea per sentence.
   - Scene 1 (hook): a curiosity gap with real stakes in the first 3 seconds. 3-line "headline", "sub" naming the subject.
   - Middle scenes: one beat each (setup, twist, evidence, answer; for current news: what happened, why, who is affected, what comes next, what is unknown). Each has "kicker", "sub", "reveal" (key sentence), "facts" (2-3 bullets, max 40 chars: WHO / WHERE / WHAT), "tl" ({"year","label"}), and **"chain"**: {"label","link"}. The chain bar shows the story as linked steps, each step caused by the one before (link words like "BECAUSE", "SO", "THEN"). Every step must follow logically from the previous one so a viewer sees what leads to what.
   - Last scene: motif "cta" with "recap" (2-3 lines), "poll" (2 short opposing options, 22 chars max), "bubble" (a debate question), "cta" ("FOLLOW"). The voice ends with a follow call and a question that loops back to the hook.
   - Top level: "kind", "asof" (current), "lang", "hud" (8-40 chars), "sources", "topic", "slug".
   - Each scene's "vo": at most 14 words for English, at most 12 for hi/pa/ur (a scene's voice must fit 4.8 s). Vary motifs: portrait, building, city_rain, forest_dig, ship_sea, desert_ruins, map_path, document, castle_night, dna_lab (real DNA only), world_map (1-4 pins), stat_chart (real numbers), alert, icons, cta.
7. `python check_story.py stories/<file>.json` and fix every reported problem before building.

## Build and check
8. `./build.sh stories/<file>.json` (10-15 minutes, run it in the background and poll the log). The last line prints the MP4's absolute path.
9. Extract about 12 frames with ffmpeg (one per scene plus the end), view them, and check: text not cut off or overlapping, no empty boxes (tofu) for Hindi/Punjabi letters, chain bar fills in order, scene 9 shows the recap. Fix the JSON and rebuild if not. At most 2 rebuilds.

## Post package
10. Write posts/<same-name>.md: Title (60 chars max, in the video's language), Description (hook, 3-4 line plain summary, Sources, follow call, question), Hashtags (#shorts plus 4-6), Pinned comment (matches the poll), two reply seeds, Chapters (timestamps for all scenes), Cover frame, Fact-check list (2-3 claims to verify), Compliance checklist (sources and dates; synthetic voice, consider the platform's altered/synthetic disclosure; all visuals/music original). For non-English videos ALSO include an English review copy of the title, description, and the full English script, and say plainly that the native-language narration was not listened to and the owner should check it before posting.

## Record and deliver
11. Append `YYYY-MM-DD | <lang> | <kind> | <topic>` to topic_history.txt. Commit the story JSON, post package and topic_history.txt (never the MP4 or build output) and push: `git push origin HEAD:main`.
12. Copy the MP4 into your scratchpad directory and send it with SendUserFile (status "proactive", display "attach") with a caption: topic, language, title, the English script, the fact-check list. Also send the post package file.

## Rules
- Never post to any social platform, spend money, or change anything outside the history-shorts repo (do not touch happygarcha/drapewell-automation).
- If a step fails, retry at most twice, then stop and report exactly what failed. Never deliver a half-finished video.
