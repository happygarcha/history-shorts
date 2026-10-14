#!/bin/bash
# usage: ./build.sh stories/<file>.json   -> out/<file>.mp4 (1080x1920, 30 s, 30 fps, burned-in subtitles)
set -e
cd "$(dirname "$0")"
STORY="$1"
[ -f "$STORY" ] || { echo "usage: ./build.sh stories/<file>.json"; exit 1; }
[ -d .venv ] || ./setup.sh
. .venv/bin/activate
NAME=$(basename "$STORY" .json)
mkdir -p out vo

python check_story.py "$STORY"
python gen_vo.py "$STORY"
python audio.py "$STORY"
cp "$STORY" web/story.json

PORT=$((8700 + RANDOM % 200))
(cd web && exec python3 -m http.server "$PORT" >/dev/null 2>&1) &
SRV=$!
trap 'kill $SRV 2>/dev/null || true' EXIT
sleep 1

rm -rf frames; mkdir frames
PIDS=""
for r in "0 300" "300 600" "600 900"; do
  set -- $r
  (cd web && PORT=$PORT node render.mjs "$1" "$2" ../frames) &
  PIDS="$PIDS $!"
done
for p in $PIDS; do wait "$p"; done
[ "$(ls frames | wc -l)" -ge 900 ] || { echo "frame render incomplete: $(ls frames | wc -l)/900"; exit 1; }

# mix: voice dominant, music ducked under voice, sfx on top
ffmpeg -y -loglevel error -i vo/voice.wav -i vo/music.wav -i vo/sfx.wav -filter_complex \
 "[0:a]asplit=2[v1][v2];[1:a]volume=0.5[m];[m][v2]sidechaincompress=threshold=0.02:ratio=10:attack=5:release=300[md];[2:a]volume=0.7[s];[v1][md][s]amix=inputs=3:normalize=0:duration=longest,alimiter=limit=0.95,atrim=0:30,apad=whole_dur=30,aformat=channel_layouts=stereo:sample_rates=44100[out]" \
 -map "[out]" -t 30 vo/mix.wav

# compile: frames + audio -> mobile-friendly MP4
ffmpeg -y -loglevel error -framerate 30 -i frames/f_%04d.jpg -i vo/mix.wav \
 -filter_complex "[1:a]loudnorm=I=-14:TP=-1.5:LRA=7,atrim=0:30,apad=whole_dur=30[a]" \
 -map 0:v -map "[a]" -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p -r 30 -c:a aac -b:a 192k -t 30 -movflags +faststart "out/$NAME.mp4"

echo "DONE: $(realpath "out/$NAME.mp4")"
