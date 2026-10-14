#!/bin/bash
# One-time setup in a fresh container: python venv, Kokoro voice model, playwright-core.
set -e
cd "$(dirname "$0")"
command -v uv >/dev/null || pip install -q uv
[ -d .venv ] || uv venv --python 3.11 .venv -q
. .venv/bin/activate
uv pip install -q kokoro-onnx soundfile scipy numpy
mkdir -p models
BASE=https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0
[ -s models/kokoro-v1.0.int8.onnx ] || curl -sSL -m 600 -o models/kokoro-v1.0.int8.onnx "$BASE/kokoro-v1.0.int8.onnx"
[ -s models/voices-v1.0.bin ] || curl -sSL -m 600 -o models/voices-v1.0.bin "$BASE/voices-v1.0.bin"
(cd web && { [ -d node_modules/playwright-core ] || npm i playwright-core@1.49.1 >/dev/null 2>&1; })
command -v ffmpeg >/dev/null || { echo "ffmpeg missing"; exit 1; }
ls /opt/pw-browsers/chromium-*/chrome-linux/chrome >/dev/null 2>&1 || { echo "chromium missing"; exit 1; }
echo "setup ok"
