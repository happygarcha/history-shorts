# Native Punjabi voice (AI4Bharat Indic-TTS). Needs a separate venv with torch + TTS==0.22.0 and the pa checkpoint; see docs. usage: python tools_synth_pa.py story.json vo male
import sys, json, torch, functools, numpy as np, soundfile as sf, re
_l = torch.load
torch.load = functools.partial(_l, weights_only=False)
from TTS.utils.synthesizer import Synthesizer
d='/tmp/indic/pa/'
syn = Synthesizer(tts_checkpoint=d+'fastpitch/best_model.pth', tts_config_path=d+'fastpitch/config.json',
   tts_speakers_file=d+'fastpitch/speakers.pth', vocoder_checkpoint=d+'hifigan/best_model.pth', vocoder_config=d+'hifigan/config.json', use_cuda=False)
story=json.load(open(sys.argv[1])); outdir=sys.argv[2]; spk=sys.argv[3] if len(sys.argv)>3 else 'male'
for i,sc in enumerate(story['scenes']):
    text=sc['vo'].replace('।','.')
    ls=1.0
    while True:
        syn.tts_model.length_scale = ls
        wav=np.array(syn.tts(text, speaker_name=spk),dtype=np.float32)
        dur=len(wav)/syn.output_sample_rate
        if dur<=4.6 or ls<=0.8: break
        ls=round(ls-0.05,2)
    sf.write(f'{outdir}/pa_{i}.wav', wav, syn.output_sample_rate)
    print(i+1, round(dur,2), 'length_scale', ls, flush=True)
