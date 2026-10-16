// Heist music loops -> assets/music/<id>.mp3 + assets/music/CREDITS.txt + assets/music/index.json { id: seconds }.
// `node tools/music-build.mjs [--only=id,id] [--force]`. Needs ffmpeg + curl. Sources are cached in tools/tmp-music/src/.
// Every track is by Kevin MacLeod (incompetech.com), licensed Creative Commons Attribution 4.0 (CC BY 4.0) — shipping it requires the
// credit line in CREDITS.txt (also shown in the game's credits). Titles + lengths come from incompetech's catalogue (pieces.json).
// Loop cut: a window [off, off + len] (len a whole number of bars when the tempo is known, so beats line up across the seam); the
// `xf` seconds after the window are crossfaded (equal power) into its first `xf` seconds, so the end flows straight into the start.
// Level: EBU R128 measured, gained to -22 LUFS (well under the -16 LUFS voices), limited at -1.5 dBFS.
// Encode: mono 32 kHz MP3 at 48 kbps CBR (~6 KB a second; the sfx engine is mono anyway).
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1')), '..');
const TMP = path.join(ROOT, 'tools/tmp-music'), SRC = path.join(TMP, 'src'), OUT = path.join(ROOT, 'assets/music');
for (const d of [TMP, SRC, OUT]) fs.mkdirSync(d, { recursive: true });
const arg = (k) => { const a = process.argv.find((s) => s.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : null; };
const ONLY = arg('only') ? new Set(arg('only').split(',')) : null, FORCE = process.argv.includes('--force');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36';
const sh = (cmd, args) => execFileSync(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 << 20 }).toString();
const ff = (args) => sh('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args]);
const LUFS = -22, RATE = 32000, KBPS = 48;
const BASE = 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/';

// id: [title, bpm (null = free time), off s, bars (or seconds when bpm is null), crossfade s, mood]
const TRACKS = {
  mu_brief: ['Night on the Docks - Sax', null, 12.5, 96, 4, 'smoky noir sax for Vera\u2019s briefing'],
  mu_plan: ['Spy Glass', 110, 4, 44, 2, 'cool, sneaky jazz groove for the city prep'],
  mu_island: ['Secret of Tiki Island', 120, 92, 42, 2, 'tropical but mysterious'],
  mu_tension: ['Ossuary 6 - Air', 50, 100, 20, 4, 'low, dark tension bed (island, tunnel)'],
  mu_casino: ['In Your Arms', 98, 4, 37, 2, '1940 big-band ballad for the liner\u2019s casino'],
  mu_stealth: ['Chase Pulse', 135, 4, 54, 2, 'dark, pulsing low synths (zoo, bank)'],
  mu_action: ['Movement Proposition', 126, 2, 42, 1.5, 'driving percussion + horns for gunfights'],
  mu_chase: ['Mistake the Getaway', 141, 1, 36, 1.5, 'horn-blast car chase for the police getaway'],
  mu_finale: ['Volatile Reaction', 155, 8, 58, 2, 'aggressive brass for the final showdown'],
};

const dur = (f) => +sh('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).trim();
const credits = ['Port Solace \u2014 heist music (assets/music). Built by tools/music-build.mjs from the sources below (trimmed to loops, levelled, re-encoded).', ''];
const MAN_F = path.join(OUT, 'index.json'), man = fs.existsSync(MAN_F) ? JSON.parse(fs.readFileSync(MAN_F, 'utf8')) : {};
for (const [id, [title, bpm, off, n, xf, mood]] of Object.entries(TRACKS)) {
  const src = path.join(SRC, title + '.mp3'), url = BASE + encodeURIComponent(title + '.mp3'), out = path.join(OUT, id + '.mp3');
  credits.push(`${id}.mp3 \u2014 "${title}" Kevin MacLeod (incompetech.com)`, `  Licensed under Creative Commons: By Attribution 4.0 License, http://creativecommons.org/licenses/by/4.0/`, `  Source: ${url}`, `  Use: ${mood}. Cut: ${off} s + ${bpm ? n + ' bars at ' + bpm + ' bpm' : n + ' s'}, looped with a ${xf} s crossfade.`, '');
  if (ONLY && !ONLY.has(id)) continue;
  if (!fs.existsSync(src) || fs.statSync(src).size < 1e5) { console.log('downloading ' + title); sh('curl', ['-s', '-L', '-A', UA, '--retry', '2', '-o', src, url]); }
  if (!FORCE && fs.existsSync(out) && man[id]) { console.log(id + ' up to date'); continue; }
  const len = bpm ? n * 4 * 60 / bpm : n;
  if (off + len + xf > dur(src)) throw new Error(id + ': window runs past the end of ' + title);
  // body = [off + xf, off + len + xf]; its last xf seconds fade out over the window's first xf seconds fading in -> length len
  const fc = `[0:a]atrim=${(off + xf).toFixed(3)}:${(off + len + xf).toFixed(3)},asetpts=N/SR/TB[b];[0:a]atrim=${off.toFixed(3)}:${(off + xf).toFixed(3)},asetpts=N/SR/TB[h];[b][h]acrossfade=d=${xf}:c1=qsin:c2=qsin,aformat=channel_layouts=mono[o]`;
  const cut = path.join(TMP, id + '.cut.wav');
  ff(['-i', src, '-filter_complex', fc, '-map', '[o]', '-ac', '1', '-c:a', 'pcm_s16le', cut]);
  const se = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', cut, '-af', 'loudnorm=print_format=json', '-f', 'null', '-'], { encoding: 'utf8' }).stderr;
  const m = JSON.parse(se.slice(se.lastIndexOf('{'), se.lastIndexOf('}') + 1)), gain = Math.max(-20, Math.min(20, LUFS - +m.input_i));
  ff(['-i', cut, '-af', `volume=${gain.toFixed(2)}dB,alimiter=limit=0.84:level=false,aresample=${RATE}`, '-ac', '1', '-c:a', 'libmp3lame', '-b:a', KBPS + 'k', out]);
  fs.rmSync(cut, { force: true });
  man[id] = Math.round(len * 100) / 100;
  console.log(`${id}: "${title}" ${off}s + ${len.toFixed(1)}s, gain ${gain.toFixed(1)} dB, ${(fs.statSync(out).size / 1024).toFixed(0)} KB`);
}
const keep = {}; for (const id of Object.keys(TRACKS)) if (man[id] && fs.existsSync(path.join(OUT, id + '.mp3'))) keep[id] = man[id];
fs.writeFileSync(MAN_F, JSON.stringify(keep));
fs.writeFileSync(path.join(OUT, 'CREDITS.txt'), credits.join('\n'));
let bytes = 0; for (const id in keep) bytes += fs.statSync(path.join(OUT, id + '.mp3')).size;
console.log(Object.keys(keep).length + ' tracks, ' + (bytes / 1048576).toFixed(2) + ' MB');
