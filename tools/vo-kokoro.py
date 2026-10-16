# Kokoro TTS (82M, kokoro-onnx) batch renderer for tools/vo-build.mjs.
# `python tools/vo-kokoro.py jobs.json` — jobs.json = { "model": path, "voices": path, "jobs": [{ "id", "voice", "lang", "speed", "text", "out" }] }.
# `python tools/vo-kokoro.py --voices <model> <voices.bin>` prints the voice ids the model ships, as JSON.
# Writes 24 kHz mono float WAVs; the node side trims, normalises and encodes them.
import json, sys
import soundfile as sf
from kokoro_onnx import Kokoro

def main():
    if sys.argv[1] == '--voices':
        k = Kokoro(sys.argv[2], sys.argv[3])
        print(json.dumps(sorted(k.get_voices())))
        return
    spec = json.load(open(sys.argv[1], encoding='utf8'))
    k = Kokoro(spec['model'], spec['voices'])
    jobs = spec['jobs']
    for i, j in enumerate(jobs):
        try:
            samples, rate = k.create(j['text'], voice=j['voice'], speed=float(j.get('speed', 1.0)), lang=j.get('lang', 'en-us'))
            sf.write(j['out'], samples, rate, subtype='FLOAT')
            print('ok %d/%d %s %.2fs' % (i + 1, len(jobs), j['id'], len(samples) / rate), flush=True)
        except Exception as e:  # one bad line must not stop the batch
            print('fail %s %s' % (j['id'], e), flush=True)

if __name__ == '__main__':
    main()
