// Render every heist line in src/81-heist-lines.js (AF.VO: id -> [Kokoro voice, speaker, text]) to assets/vo/<id>.mp3 with Kokoro TTS
// (82M, kokoro-onnx via tools/vo-kokoro.py) and write assets/vo/index.json { id: seconds }.
// `node tools/vo-build.mjs [--list] [--only=id,id] [--force] [--reencode]`. Needs python (pip install kokoro-onnx soundfile) and ffmpeg.
// Fish web UI: `--fish-export [--only=id,id] [--fish-export-dir=folder]`, save each download as <id>.mp3/.wav beside manifest.json,
// then `--fish-import=folder`; partial imports enable only matching lines and preserve legacy files/durations for the rest.
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

// Fish Audio Web UI imports are explicit; partial batches update only their files, with runtime text+audio hash gates on every line.
// WAV originals get lossless FLAC masters; MP3 originals remain byte-for-byte and are never relabelled as lossless.
const FISH_MODEL = 'Fish Audio Drama 3 Newest', FISH_LIMIT = 500, FISH_SCHEMA = 1;
const FISH_MAN_F = path.join(OUT, 'fish-manifest.json');
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
const fishLine = (id, tuple) => {
  const [legacyVoice, speaker, displayText, meta] = tuple;
  if (!meta || !meta.speakerId || !meta.voiceSlot || !meta.fishVoiceName || !meta.expressionText) throw new Error('missing Fish metadata for ' + id);
  const fishTags = Array.isArray(meta.fishTags) ? meta.fishTags : [];
  const generationText = String(meta.generationText || (fishTags.map((tag) => '[' + tag + ']').join(' ') + ' ' + displayText));
  if ([...generationText].length > FISH_LIMIT) throw new Error(id + ' is ' + [...generationText].length + ' characters; Fish Audio allows ' + FISH_LIMIT);
  const inputHash = sha256(JSON.stringify([id, meta.speakerId, speaker, legacyVoice, meta.voiceSlot, meta.fishVoiceName,
    String(displayText), String(meta.expressionText), fishTags, generationText]));
  return { id, fileId: id, filename: id + '.mp3', speakerId: meta.speakerId, speaker, legacyVoice,
    voiceSlot: meta.voiceSlot, fishVoiceName: meta.fishVoiceName, displayText: String(displayText),
    generationText, expressionText: String(meta.expressionText), fishTags, inputHash };
};
const fishManifest = (VO, ids) => {
  const all = Object.keys(VO), chosen = ids || all;
  const entries = chosen.map((id) => {
    if (!VO[id]) throw new Error('unknown voice line: ' + id);
    return fishLine(id, VO[id]);
  });
  if (new Set(entries.map((e) => e.id)).size !== entries.length) throw new Error('duplicate voice line in Fish manifest');
  const voiceConfigSlots = {};
  for (const e of entries) voiceConfigSlots[e.voiceSlot] = { speakerId: e.speakerId, speaker: e.speaker,
    fishVoiceName: e.fishVoiceName, legacyVoice: e.legacyVoice };
  const idsSet = new Set(entries.map((e) => e.id));
  return { schemaVersion: FISH_SCHEMA, model: FISH_MODEL, generatedBy: 'Fish Audio web UI',
    characterLimit: FISH_LIMIT, complete: entries.length === all.length && all.every((id) => idsSet.has(id)),
    lineCount: all.length, voiceConfigSlots, entries };
};
const writeFishExport = (VO, ids) => {
  const manifest = fishManifest(VO, ids), dir = path.resolve(arg('fish-export-dir') || path.join(TMP, 'fish-export'));
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  const batch = manifest.entries.map((e) => JSON.stringify({ id: e.id, fileId: e.fileId, voiceSlot: e.voiceSlot,
    fishVoiceName: e.fishVoiceName, text: e.generationText, inputHash: e.inputHash })).join('\n');
  fs.writeFileSync(path.join(dir, 'fish-web-batch.jsonl'), batch + (batch ? '\n' : ''));
  console.log(`Fish Audio web export: ${manifest.entries.length}/${manifest.lineCount} lines${manifest.complete ? '' : ' (partial batch)'}`);
  console.log('Manifest: ' + path.relative(ROOT, path.join(dir, 'manifest.json')));
  console.log('Batch:    ' + path.relative(ROOT, path.join(dir, 'fish-web-batch.jsonl')));
};
const verifyFishManifest = (from, VO) => {
  const current = fishManifest(VO), file = path.join(from, 'manifest.json');
  if (!fs.existsSync(file)) throw new Error('Fish import is missing manifest.json: ' + file);
  const m = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (m.schemaVersion !== FISH_SCHEMA || m.model !== FISH_MODEL || !Array.isArray(m.entries) || !m.entries.length) throw new Error('unsupported or empty Fish manifest');
  const expected = new Map(current.entries.map((e) => [e.id, e])), seen = new Set(), bad = [];
  const fields = ['fileId', 'speakerId', 'speaker', 'legacyVoice', 'voiceSlot', 'fishVoiceName', 'displayText', 'generationText', 'expressionText', 'inputHash'];
  for (const e of m.entries) {
    if (!e || typeof e.id !== 'string' || !expected.has(e.id) || seen.has(e.id)) { bad.push('unknown or duplicate id ' + (e && e.id)); continue; }
    seen.add(e.id);
    const x = expected.get(e.id);
    for (const k of fields) if (JSON.stringify(e[k]) !== JSON.stringify(x[k])) { bad.push(e.id + ' has stale/mismatched ' + k); break; }
    if (JSON.stringify(e.fishTags) !== JSON.stringify(x.fishTags)) bad.push(e.id + ' has stale/mismatched fishTags');
  }
  if (bad.length) throw new Error('Fish manifest mismatch: ' + bad.slice(0, 12).join('; '));
  if (m.complete && (m.entries.length !== current.entries.length || current.entries.some((e) => !seen.has(e.id)))) throw new Error('manifest claims a full import but does not contain every current line');
  if (m.complete && m.lineCount !== current.lineCount) throw new Error('manifest line count differs from the current source');
  return m;
};
const findFishAudio = (dir, fileId) => {
  if (!/^[a-z0-9._-]+$/i.test(fileId)) throw new Error('unsafe Fish fileId: ' + fileId);
  const choices = {};
  for (const ext of ['wav', 'mp3']) {
    const hits = [path.join(dir, fileId + '.' + ext), path.join(dir, 'audio', fileId + '.' + ext)].filter((f) => fs.existsSync(f));
    if (hits.length > 1) throw new Error('duplicate Fish downloads for ' + fileId + '.' + ext + '; keep one file in the import folder');
    if (hits.length) choices[ext] = hits[0];
  }
  const ext = choices.wav ? 'wav' : choices.mp3 ? 'mp3' : null;
  if (!ext) throw new Error('missing Fish download for ' + fileId + ' (expected audio/' + fileId + '.wav or .mp3)');
  const f = choices[ext];
  if (fs.statSync(f).size < 1024) throw new Error('Fish download is empty or too small: ' + f);
  return { path: f, ext, other: choices[ext === 'wav' ? 'mp3' : 'wav'] || null };
};
const fileHash = (f) => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const fishImport = async (from, VO) => {
  const dir = path.resolve(from), manifest = verifyFishManifest(dir, VO);
  const downloads = manifest.entries.map((e) => { const source = findFishAudio(dir, e.fileId); return { entry: e, source: { ...source, hash: fileHash(source.path) } }; });
  const originals = path.join(ROOT, 'tools/vo-originals'), masters = path.join(ROOT, 'tools/vo-masters');
  const archives = new Map(), masterFiles = new Map();
  const archivedPath = (id, ext, file, hash) => {
    const base = path.join(originals, id + '.' + ext);
    const versioned = path.join(originals, id + '.' + hash + '.' + ext);
    if (fs.existsSync(versioned)) {
      if (fileHash(versioned) !== hash) throw new Error('original archive hash collision for ' + id + '.' + ext);
      return versioned;
    }
    if (!fs.existsSync(base) || fileHash(base) === hash) return base;
    return versioned;
  };
  for (const { entry: e, source: s } of downloads) for (const q of [s, ...(s.other ? [{ path: s.other, ext: path.extname(s.other).slice(1) }] : [])]) {
    const hash = q.path === s.path ? s.hash : fileHash(q.path);
    archives.set(e.fileId + '.' + q.ext, archivedPath(e.fileId, q.ext, q.path, hash));
  }
  for (const { entry: e, source: s } of downloads) if (s.ext === 'wav') {
    const base = path.join(masters, e.fileId + '.flac'), versioned = path.join(masters, e.fileId + '.' + s.hash + '.flac');
    const original = path.join(originals, e.fileId + '.wav');
    const sameOriginal = fs.existsSync(original) && fileHash(original) === s.hash;
    masterFiles.set(e.id, fs.existsSync(versioned) ? versioned : !fs.existsSync(base) || sameOriginal ? base : versioned);
  }
  for (const cmd of ['ffmpeg', 'ffprobe']) {
    const r = spawnSync(cmd, ['-version'], { stdio: 'ignore' });
    if (r.error || r.status !== 0) throw new Error(cmd + ' is required for a Fish import; install it before retrying');
  }
  const stage = path.join(TMP, 'fish-import-stage');
  if (fs.existsSync(stage)) throw new Error('unfinished import staging exists; inspect/remove it before retrying: ' + stage);
  const runtime = path.join(stage, 'runtime'), stagedMasters = path.join(stage, 'masters');
  fs.mkdirSync(runtime, { recursive: true }); fs.mkdirSync(stagedMasters, { recursive: true });
  const durations = {}, sourceFormats = {};
  try {
    for (const { entry: e, source: s } of downloads) {
      const cut = path.join(stage, e.fileId + '.cut.wav'), mp3 = path.join(runtime, e.fileId + '.mp3');
      const master = masterFiles.get(e.id);
      if (master && !fs.existsSync(master)) {
        await ff(['-i', s.path, '-map_metadata', '0', '-c:a', 'flac', '-compression_level', '8', path.join(stagedMasters, path.basename(master))]);
      }
      await ff(['-i', s.path, '-af', 'silenceremove=start_periods=1:start_threshold=-48dB:start_silence=0.04,areverse,silenceremove=start_periods=1:start_threshold=-48dB:start_silence=0.12,areverse', '-ac', '1', cut]);
      const { se } = await ff(['-i', cut, '-af', 'loudnorm=print_format=json', '-f', 'null', '-']);
      const reportStart = se.lastIndexOf('{'), reportEnd = se.lastIndexOf('}') + 1;
      if (reportStart < 0 || reportEnd <= reportStart) throw new Error('could not measure loudness for ' + e.id);
      const measured = JSON.parse(se.slice(reportStart, reportEnd));
      let inputLufs = +measured.input_i; if (!isFinite(inputLufs) || inputLufs < -70) inputLufs = -30;
      const gain = Math.max(-12, Math.min(24, -16 - inputLufs));
      await ff(['-i', cut, '-af', `volume=${gain.toFixed(2)}dB,alimiter=limit=0.8:attack=3:release=40:level=false,adelay=30,aresample=24000`,
        '-ac', '1', '-ar', '24000', '-c:a', 'libmp3lame', '-b:a', '32k', '-write_xing', '1', mp3]);
      fs.rmSync(cut, { force: true });
      const duration = Math.round(probeDur(mp3) * 100) / 100;
      if (duration < 0.3 || fs.statSync(mp3).size < 1024) throw new Error('converted line is empty or clipped short: ' + e.id);
      durations[e.id] = duration; sourceFormats[e.id] = s.ext;
    }
    for (const { entry: e, source: s } of downloads) {
      fs.mkdirSync(originals, { recursive: true });
      for (const q of [s, ...(s.other ? [{ path: s.other, ext: path.extname(s.other).slice(1) }] : [])]) {
        const archive = archives.get(e.fileId + '.' + q.ext);
        if (!fs.existsSync(archive)) fs.copyFileSync(q.path, archive);
      }
    }
    for (const f of fs.readdirSync(stagedMasters)) {
      fs.mkdirSync(masters, { recursive: true });
      const dest = path.join(masters, f); if (!fs.existsSync(dest)) fs.copyFileSync(path.join(stagedMasters, f), dest);
    }
    const indexFile = path.join(OUT, 'index.json'), index = fs.existsSync(indexFile) ? JSON.parse(fs.readFileSync(indexFile, 'utf8')) : {};
    if (!index || Array.isArray(index) || typeof index !== 'object') throw new Error('assets/vo/index.json is not a duration map');
    Object.assign(index, durations);
    fs.writeFileSync(path.join(stage, 'index.json'), JSON.stringify(index));
    const current = fishManifest(VO), expected = new Map(current.entries.map((e) => [e.id, e]));
    const installed = Object.create(null);
    if (fs.existsSync(FISH_MAN_F)) {
      const previous = JSON.parse(fs.readFileSync(FISH_MAN_F, 'utf8'));
      if (previous.schemaVersion === FISH_SCHEMA && previous.model === FISH_MODEL && previous.generatedBy === 'Fish Audio web UI') {
        const rows = Array.isArray(previous.entries) ? Object.fromEntries(previous.entries.map((e) => [e.id, e])) : previous.entries;
        if (rows && typeof rows === 'object') for (const id of Object.keys(rows)) {
          const row = rows[id], want = expected.get(id), audio = path.join(OUT, id + '.mp3');
          if (want && row && row.fileId === id && row.inputHash === want.inputHash && /^[\da-f]{64}$/i.test(row.assetHash || '') &&
            fs.existsSync(audio) && fileHash(audio) === row.assetHash) installed[id] = row;
        }
      }
    }
    const imported = Object.fromEntries(manifest.entries.map((e) => [e.id, { ...e,
      assetHash: fileHash(path.join(runtime, e.fileId + '.mp3')), duration: durations[e.id], sourceFormat: sourceFormats[e.id],
      losslessMaster: masterFiles.has(e.id) ? path.relative(ROOT, masterFiles.get(e.id)).replace(/\\/g, '/') : null }]));
    Object.assign(installed, imported);
    const complete = current.entries.every((e) => installed[e.id] && installed[e.id].inputHash === e.inputHash);
    fs.writeFileSync(path.join(stage, 'fish-manifest.json'), JSON.stringify({ schemaVersion: FISH_SCHEMA, model: FISH_MODEL,
      generatedBy: 'Fish Audio web UI', complete, lineCount: current.lineCount, voiceConfigSlots: current.voiceConfigSlots, entries: installed }, null, 2));
    const backup = path.join(stage, 'backup'); fs.mkdirSync(backup);
    const pairs = [...manifest.entries.map((e) => ({ from: path.join(runtime, e.fileId + '.mp3'), to: path.join(OUT, e.fileId + '.mp3') })),
      { from: path.join(stage, 'index.json'), to: indexFile }, { from: path.join(stage, 'fish-manifest.json'), to: FISH_MAN_F }];
    const moved = [];
    try {
      for (let i = 0; i < pairs.length; i++) {
        const p = pairs[i], b = path.join(backup, String(i));
        const q = { to: p.to, backup: null, installed: false };
        if (fs.existsSync(p.to)) { fs.renameSync(p.to, b); q.backup = b; }
        moved.push(q); fs.renameSync(p.from, p.to); q.installed = true;
      }
    } catch (e) {
      for (let i = moved.length - 1; i >= 0; i--) {
        const q = moved[i]; if (q.installed) fs.rmSync(q.to, { force: true });
        if (q.backup) fs.renameSync(q.backup, q.to);
      }
      throw e;
    }
    const noWav = downloads.filter((q) => q.source.ext !== 'wav').length;
    const masterCount = downloads.filter((q) => masterFiles.has(q.entry.id) && fs.existsSync(masterFiles.get(q.entry.id))).length;
    const readyCount = Object.keys(installed).length;
    console.log(`Imported ${downloads.length} Fish line(s): mono 24 kHz / 32 kbps MP3 runtime, -16 LUFS. ${readyCount}/${current.lineCount} current lines have hash-matched Fish audio.`);
    console.log(`Preserved originals in ${path.relative(ROOT, originals)}; ${masterCount} WAV-derived FLAC master(s) available in ${path.relative(ROOT, masters)}.`);
    if (!complete) console.warn(`${current.lineCount - readyCount} current line(s) remain subtitle-only; matching legacy audio was preserved but will not play.`);
    if (noWav) console.warn(`${noWav} download(s) were MP3 only: the original MP3 was preserved; no lossless FLAC master was claimed.`);
  } finally { fs.rmSync(stage, { recursive: true, force: true }); }
};

// ---------------------------------------------------------------- main
const VO = table();
const ids = Object.keys(VO).filter((id) => !ONLY || ONLY.has(id));
if (process.argv.includes('--fish-export')) {
  if (ONLY && ids.length !== ONLY.size) throw new Error('unknown --only id(s): ' + [...ONLY].filter((id) => !VO[id]).join(', '));
  writeFishExport(VO, ids); process.exit(0);
}
if (process.argv.some((s) => s === '--fish-import' || s.startsWith('--fish-import='))) {
  if (!arg('fish-import')) throw new Error('use --fish-import=<folder> with a folder containing manifest.json and each named audio file');
  if (ONLY) throw new Error('--only cannot be combined with --fish-import; the import manifest selects the exact lines');
  await fishImport(arg('fish-import'), VO); process.exit(0);
}
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
