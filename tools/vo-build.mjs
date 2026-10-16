// Render every heist line in src/81-heist-lines.js (AF.VO: id -> [Kokoro voice, speaker, text]) to assets/vo/<id>.mp3 with Kokoro TTS
// (82M, kokoro-onnx via tools/vo-kokoro.py) and write assets/vo/index.json { id: seconds }.
// `node tools/vo-build.mjs [--list] [--only=id,id] [--force] [--reencode]`. Needs python (pip install kokoro-onnx soundfile) and ffmpeg.
// The model (kokoro-v1.0.onnx + voices-v1.0.bin) is fetched into tools/tmp-vo/models/ on first run (~350 MB).
// Raw WAVs are cached in tools/tmp-vo/raw/ keyed by voice + speed + text: only changed / new lines are synthesised again (--force: all).
// mp3s whose id left the table (or whose line changed but failed to render) are deleted; index.json is rebuilt from the files on disk.
// --reencode re-runs the ffmpeg chain on every cached WAV (trim / level / encoder changes).
// Chain: trim leading + trailing silence (keeps a breath), measure EBU R128 loudness, gain to -16 LUFS, limit at -2 dBFS, 30 ms lead-in,
// mono 24 kHz MP3 at 32 kbps CBR (Kokoro renders at 24 kHz, so nothing above 12 kHz is lost; ~4 KB a second).
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import { execFile, spawn, spawnSync, execFileSync } from 'node:child_process';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1')), '..');
const TMP = path.join(ROOT, 'tools/tmp-vo'), RAW = path.join(TMP, 'raw'), PROC = path.join(TMP, 'proc'), MODELS = path.join(TMP, 'models'), OUT = path.join(ROOT, 'assets/vo');
for (const d of [TMP, RAW, PROC, MODELS, OUT]) fs.mkdirSync(d, { recursive: true });
const arg = (k) => { const a = process.argv.find((s) => s.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : null; };
const ONLY = arg('only') ? new Set(arg('only').split(',')) : null, FORCE = process.argv.includes('--force'), REENC = process.argv.includes('--reencode'), LIST = process.argv.includes('--list');
const PY = process.env.PYTHON || 'python';
const MODEL = path.join(MODELS, 'kokoro-v1.0.onnx'), VOICES = path.join(MODELS, 'voices-v1.0.bin');
// the fp32 v1.0 graph from Hugging Face (same weights as the kokoro-onnx release, much faster CDN); the voice pack from the release
const URLS = { 'kokoro-v1.0.onnx': 'https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX/resolve/main/onnx/model.onnx',
  'voices-v1.0.bin': 'https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin' };
const TARGET_LUFS = -16, RATE = 24000, KBPS = 32;

// ---------------------------------------------------------------- the line table (evaluated in a sandbox with a stub AF)
const table = () => {
  const AF = { partError: (n, e) => { throw e; } };
  vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'src/81-heist-lines.js'), 'utf8'), { AF }, { filename: '81-heist-lines.js' });
  if (!AF.VO) throw new Error('AF.VO missing');
  return AF.VO;
};
// pace per speaker (the part before the dot): guards bark a little quicker, Silas and Prescott take their time
const SPEED = { silas: 0.9, prescott: 0.94, ezra: 0.96, kestrel: 0.98, tower: 1.04, gate: 1.0, g1: 1.08, g2: 1.08, g3: 1.08, g4: 1.08, zw: 1.04, m1: 1.06, m2: 1.06, tony: 1.03 };
const speedOf = (id) => SPEED[id.split('.')[0]] || 1;
// Kokoro's phonemiser reads the plain apostrophe best; interjections it would spell out letter by letter get spelled the way they sound
const SAY = (t) => t.replace(/[\u2018\u2019]/g, "'").replace(/[\u201c\u201d]/g, '"').replace(/\u2026/g, '...').replace(/\bHmph\b/g, 'Humph').replace(/\bHm\b/g, 'Hmm');
const hash = (s) => crypto.createHash('sha1').update(s).digest('hex').slice(0, 12);

// ---------------------------------------------------------------- helpers
const run = (cmd, args) => new Promise((res, rej) => execFile(cmd, args, { maxBuffer: 64 << 20 }, (e, so, se) => (e ? rej(new Error(se || e.message)) : res({ so, se }))));
const ff = (args) => run('ffmpeg', ['-hide_banner', '-nostats', '-y', ...args]);
const probeDur = (f) => +execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString().trim();
const pool = async (items, n, fn) => { let i = 0; await Promise.all(Array.from({ length: n }, async () => { while (i < items.length) { const k = i++; await fn(items[k], k); } })); };

const ensureModel = () => {
  for (const [f, name] of [[MODEL, 'kokoro-v1.0.onnx'], [VOICES, 'voices-v1.0.bin']]) {
    if (fs.existsSync(f) && fs.statSync(f).size > 1e6) continue;
    console.log('downloading ' + name + ' ...');
    execFileSync('curl', ['-s', '-L', '--retry', '3', '-o', f, URLS[name]], { stdio: 'inherit' });
    if (!fs.existsSync(f) || fs.statSync(f).size < 1e6) throw new Error('download failed: ' + name);
  }
};
// a voice the model does not ship -> the first one of the same accent + gender (af_, am_, bf_, bm_)
const mapVoices = (VO) => {
  const r = spawnSync(PY, [path.join(ROOT, 'tools/vo-kokoro.py'), '--voices', MODEL, VOICES], { encoding: 'utf8' });
  if (r.status) throw new Error('vo-kokoro --voices: ' + r.stderr);
  const have = new Set(JSON.parse(r.stdout.trim().split('\n').pop())), map = {};
  for (const id in VO) {
    const v = VO[id][0]; if (have.has(v) || map[v]) continue;
    map[v] = [...have].find((h) => h.slice(0, 3) === v.slice(0, 3)) || 'af_heart';
    console.log('voice ' + v + ' not in the model -> ' + map[v]);
  }
  return (v) => map[v] || v;
};

// ---------------------------------------------------------------- main
const VO = table();
const ids = Object.keys(VO).filter((id) => !ONLY || ONLY.has(id));
const CACHE_F = path.join(TMP, 'cache.json'), cache = fs.existsSync(CACHE_F) ? JSON.parse(fs.readFileSync(CACHE_F, 'utf8')) : {};
const keyOf = (id, voice) => hash(voice + '|' + speedOf(id) + '|' + SAY(VO[id][2]));
if (LIST) {
  for (const id of ids) { const [v, who, text] = VO[id]; const done = fs.existsSync(path.join(OUT, id + '.mp3')) && cache[id] === keyOf(id, v); console.log((done ? '  ' : '* ') + id.padEnd(16) + v.padEnd(11) + (who + ' x' + speedOf(id)).padEnd(22) + text); }
  console.log(ids.length + ' lines (* = not built yet)');
  process.exit(0);
}
ensureModel();
const voiceOf = mapVoices(VO);
// 1. synthesise what changed
const jobs = [];
for (const id of ids) {
  const voice = voiceOf(VO[id][0]), key = keyOf(id, voice), raw = path.join(RAW, id + '.wav');
  if (!FORCE && cache[id] === key && fs.existsSync(raw)) continue;
  jobs.push({ id, voice, lang: voice[0] === 'b' ? 'en-gb' : 'en-us', speed: speedOf(id), text: SAY(VO[id][2]), out: raw, key });
}
const failed = [];
if (jobs.length) {
  console.log('synthesising ' + jobs.length + ' lines with Kokoro ...');
  const jf = path.join(TMP, 'jobs.json');
  fs.writeFileSync(jf, JSON.stringify({ model: MODEL, voices: VOICES, jobs }));
  await new Promise((res) => {
    const p = spawn(PY, [path.join(ROOT, 'tools/vo-kokoro.py'), jf], { stdio: ['ignore', 'pipe', 'inherit'] });
    let buf = '';
    p.stdout.on('data', (d) => { buf += d; let i; while ((i = buf.indexOf('\n')) >= 0) { const ln = buf.slice(0, i).trim(); buf = buf.slice(i + 1); if (!ln) continue; const [st, a, b] = ln.split(' '); const id = st === 'ok' ? b : a; const j = jobs.find((q) => q.id === id); if (st === 'ok' && j) { cache[id] = j.key; if (+a.split('/')[0] % 25 === 0 || a.split('/')[0] === a.split('/')[1]) console.log('  ' + ln); } else if (st === 'fail') { failed.push(id); console.log('  ' + ln); } } });
    p.on('close', res);
  });
  fs.writeFileSync(CACHE_F, JSON.stringify(cache, null, 1));
  fs.rmSync(jf, { force: true });
}
// 2. trim, level, encode (only lines whose WAV changed, unless --reencode)
const redo = new Set(jobs.map((j) => j.id));
const MAN_F = path.join(OUT, 'index.json'), man = fs.existsSync(MAN_F) ? JSON.parse(fs.readFileSync(MAN_F, 'utf8')) : {};
const report = [], encoded = new Set();
await pool(ids, 6, async (id) => {
  const raw = path.join(RAW, id + '.wav'), cut = path.join(PROC, id + '.cut.wav'), lev = path.join(PROC, id + '.wav'), mp3 = path.join(OUT, id + '.mp3');
  if (!fs.existsSync(raw) || failed.includes(id)) { if (!failed.includes(id)) failed.push(id); return; }
  if (!REENC && !redo.has(id) && fs.existsSync(mp3) && man[id]) return;
  try {
    // silenceremove keeps 40 ms before the first word and 120 ms after the last
    await ff(['-i', raw, '-af', 'silenceremove=start_periods=1:start_threshold=-48dB:start_silence=0.04,areverse,silenceremove=start_periods=1:start_threshold=-48dB:start_silence=0.12,areverse', '-ac', '1', cut]);
    const { se } = await ff(['-i', cut, '-af', 'loudnorm=print_format=json', '-f', 'null', '-']);
    const m = JSON.parse(se.slice(se.lastIndexOf('{'), se.lastIndexOf('}') + 1));
    let gi = +m.input_i; if (!isFinite(gi) || gi < -70) gi = -30;
    const gain = AF_clamp(TARGET_LUFS - gi, -12, 24);
    await ff(['-i', cut, '-af', `volume=${gain.toFixed(2)}dB,alimiter=limit=0.8:attack=3:release=40:level=false,adelay=30,aresample=${RATE}`, '-ac', '1', '-c:a', 'pcm_s16le', lev]);
    await ff(['-i', lev, '-ac', '1', '-ar', String(RATE), '-c:a', 'libmp3lame', '-b:a', KBPS + 'k', '-write_xing', '1', mp3]);
    man[id] = Math.round(probeDur(lev) * 100) / 100; encoded.add(id);
    fs.rmSync(cut, { force: true });
  } catch (e) { failed.push(id); console.log('  ffmpeg failed ' + id + ': ' + String(e.message).split('\n').slice(-3).join(' ')); }
});
function AF_clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
// 3. stale files out: ids gone from the table, and lines whose text / voice changed but did not render (old words, new subtitle)
const all = Object.keys(VO), out = {};
for (const f of fs.readdirSync(OUT)) {
  if (!f.endsWith('.mp3')) continue;
  const id = f.slice(0, -4), cur = VO[id] && (cache[id] === keyOf(id, voiceOf(VO[id][0])) || (ONLY && !ONLY.has(id)));
  if (!cur) { fs.rmSync(path.join(OUT, f)); fs.rmSync(path.join(PROC, id + '.wav'), { force: true }); delete man[id]; console.log('removed ' + (VO[id] ? 'outdated ' : 'stale ') + f); }
}
// 4. manifest regenerated from what is on disk: the levelled WAV's length (exact), else the mp3's own (includes encoder padding)
for (const id of all.sort()) {
  const mp3 = path.join(OUT, id + '.mp3'), lev = path.join(PROC, id + '.wav'); if (!fs.existsSync(mp3)) continue;
  out[id] = man[id] && fs.existsSync(lev) && fs.statSync(lev).mtimeMs <= fs.statSync(mp3).mtimeMs + 5000 ? man[id] : Math.round(probeDur(fs.existsSync(lev) ? lev : mp3) * 100) / 100;
}
fs.writeFileSync(MAN_F, JSON.stringify(out));
// 5. sanity: empty or clipped lines, total size
let bytes = 0, secs = 0;
for (const id of Object.keys(out)) {
  const f = path.join(OUT, id + '.mp3'); bytes += fs.statSync(f).size; secs += out[id];
  if (encoded.has(id)) {
    const se = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', f, '-af', 'volumedetect', '-f', 'null', '-'], { encoding: 'utf8' }).stderr || '';
    const mx = +((se.match(/max_volume: (-?[\d.]+) dB/) || [])[1]), mean = +((se.match(/mean_volume: (-?[\d.]+) dB/) || [])[1]);
    if (out[id] < 0.3 || mean < -40) report.push(id + ' looks empty (' + out[id] + ' s, mean ' + mean + ' dB)');
    if (mx > -0.2) report.push(id + ' may clip (max ' + mx + ' dB)');
  }
}
for (const r of report) console.log('  ! ' + r);
console.log(`${Object.keys(out).length}/${all.length} lines in assets/vo, ${(secs / 60).toFixed(1)} min, ${(bytes / 1048576).toFixed(2)} MB` + (failed.length ? '; FAILED: ' + failed.join(', ') : ''));
if (failed.length) process.exitCode = 1;
