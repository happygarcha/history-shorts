# Punjabi TTS trial: jsaluja/punjabi-tts (IndexTTS2 fine-tune)

Inspected 2026-10-15. Repo: https://github.com/jsaluja/punjabi-tts (last commit 2026-06-06). Model: Akira2049/punjabi-indextts2-gpt on Hugging Face.

## What it is
Zero-shot Punjabi (Gurmukhi) text-to-speech with voice cloning. A Punjabi fine-tuned GPT on top of IndexTTS2 (Bilibili) plus shared base models: w2v-BERT 2.0, CAMPPlus, MaskGCT codec, S2Mel, BigVGAN v2, Qwen-0.6B emotion model. About 800 hours of Punjabi training data. The reference clip supplies the voice.

## Requirements (from the README)
- NVIDIA GPU, CUDA 12.8, torch 2.8.0+cu128 (torch 2.9 gives muffled audio), Python 3.10 to 3.12.
- Engine code from github.com/index-tts/index-tts (uv sync), model downloaded with `hf download Akira2049/punjabi-indextts2-gpt --local-dir checkpoints` (bundles the base models under hf_cache/).
- Model size and VRAM are not stated; I could not check them (Hugging Face is blocked from this session).

## Licence
- IndexTTS2 uses the bilibili Model Use License: free use including output, except companies with over 100 million monthly users or over RMB 1 billion yearly revenue; you are responsible for the content (no false information, no privacy or personality-rights violations); outputs may not be used to train other AI models unless non-commercial; keep the licence notice.
- The repo's own text says the pipeline code is "for research and educational use" and has no LICENSE file at the root. The Hugging Face model card licence could not be read. Confirm both before commercial use.
- Voice cloning needs consent: only clone a voice you own or have written permission for. The repo's example reference clips are real people, so they are not used here.

## This session cannot run it
No GPU (4 CPUs, 15 GB RAM, about 7 GB free disk) and Hugging Face is blocked, so the model cannot be downloaded or run here.

## Run it on a GPU (free options: Google Colab free T4, Kaggle)
1. Record 15 to 30 seconds of clean Punjabi speech (your own voice, or someone who agrees in writing). Save as reference.wav.
2. In a GPU notebook:
   - `git clone https://github.com/index-tts/index-tts && cd index-tts && pip install -U uv && uv sync --all-extras`
   - install torch 2.8.0 (cu128)
   - `hf download Akira2049/punjabi-indextts2-gpt --local-dir checkpoints`
   - `git clone https://github.com/jsaluja/punjabi-tts` and run
     `python punjabi-tts/engine/inference_v1.py --model-dir checkpoints --reference reference.wav --text "<text below>" --output sample.wav`
3. Send sample.wav back; check pronunciation before it goes anywhere near the video pipeline.

## 15-second sample text (Gurmukhi)
ਪੰਜਾਬ ਦੀ ਮਿੱਟੀ ਹੇਠ ਇੱਕ ਸ਼ਹਿਰ ਦੱਬਿਆ ਹੋਇਆ ਸੀ। ਇਹ ਹੜੱਪਾ ਏ, ਰਾਵੀ ਦੇ ਕੰਢੇ। ਸਾਢੇ ਚਾਰ ਹਜ਼ਾਰ ਸਾਲ ਪਹਿਲਾਂ ਇੱਥੇ ਸਿੱਧੀਆਂ ਗਲੀਆਂ ਤੇ ਇੱਟਾਂ ਦੇ ਨਾਲ਼ੇ ਸਨ। ਪਰ ਇਸ ਦੀ ਲਿਖਤ ਅੱਜ ਵੀ ਕੋਈ ਪੜ੍ਹ ਨਹੀਂ ਸਕਿਆ।

## Notes on the current voice (AI4Bharat FastPitch)
The words it skipped came from speeding the voice up to fit 5-second scenes and from the sentence splitter. A better fix is longer scenes or fewer words per scene, not faster speech.
