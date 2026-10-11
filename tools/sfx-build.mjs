// Fetch + compress the game's sounds into assets/sfx/*.mp3 (CC0 / public-domain sources only; credits -> assets/sfx/CREDITS.txt).
// `node tools/sfx-build.mjs [--only=id,id] [--force] [--list]`. Needs ffmpeg (with libmp3lame + libflite) and curl on PATH.
// Sources: Kenney audio packs (CC0), Freesound previews of CC0-licensed sounds (licence checked on each sound page), and lines
// spoken by ffmpeg's built-in flite synthesiser (PA announcements, crew radio). Loops are cut with an equal-power crossfade so the
// end flows into the start; the game trims MP3 encoder padding at load time.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1')), '..');
const TMP = path.join(ROOT, 'tools/tmp-sfx'), RAW = path.join(TMP, 'raw'), KEN = path.join(TMP, 'kenney'), OUT = path.join(ROOT, 'assets/sfx');
for (const d of [TMP, RAW, KEN, OUT]) fs.mkdirSync(d, { recursive: true });
const arg = (k) => { const a = process.argv.find((s) => s.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : null; };
const ONLY = arg('only') ? new Set(arg('only').split(',')) : null, FORCE = process.argv.includes('--force');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const sh = (cmd, args, o = {}) => execFileSync(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 << 20, ...o }).toString();
const curl = (url, out) => sh('curl', ['-s', '-L', '-A', UA, '--retry', '2', ...(out ? ['-o', out] : []), url]);
const ff = (args, cwd = TMP) => sh('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { cwd });
const dur = (f) => +sh('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).trim();
// volumedetect prints to stderr; spawnSync keeps it whatever the exit code
const volDetect = (f) => spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', f, '-af', 'volumedetect', '-f', 'null', '-'], { encoding: 'utf8' }).stderr || '';

// ---------------------------------------------------------------- Kenney packs (CC0)
const KENNEY = {
  casino: 'https://kenney.nl/media/pages/assets/casino-audio/2472606a04-1721639069/kenney_casino-audio.zip',
  impact: 'https://kenney.nl/media/pages/assets/impact-sounds/87b4ddecda-1677589768/kenney_impact-sounds.zip',
  interface: 'https://kenney.nl/media/pages/assets/interface-sounds/fa43c1dd4d-1677589452/kenney_interface-sounds.zip',
  voice: 'https://kenney.nl/media/pages/assets/voiceover-pack/3f7f168698-1677589897/kenney_voiceover-pack.zip',
  jingles: 'https://kenney.nl/media/pages/assets/music-jingles/f37e530b9e-1677590399/kenney_music-jingles.zip',
  rpg: 'https://kenney.nl/media/pages/assets/rpg-audio/8e99002d76-1677590336/kenney_rpg-audio.zip',
};
const kenFile = (pack, name) => {
  const dir = path.join(KEN, pack);
  if (!fs.existsSync(dir)) {
    const z = path.join(KEN, pack + '.zip'); curl(KENNEY[pack], z);
    sh('powershell', ['-NoProfile', '-Command', `Expand-Archive -Force '${z}' '${dir}'`]);
  }
  const want = name.toLowerCase(), hits = [];
  const walk = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (/\.(ogg|wav|mp3)$/i.test(e.name) && e.name.replace(/\.\w+$/, '').toLowerCase() === want) hits.push(p); } };
  walk(dir);
  // the voiceover pack ships a Female and a Male folder: prefer the one named in the path filter
  hits.sort((a, b) => (/male/i.test(b) && !/female/i.test(b) ? 1 : 0) - (/male/i.test(a) && !/female/i.test(a) ? 1 : 0));
  if (!hits.length) throw new Error('kenney ' + pack + '/' + name + ' not found');
  return hits[0];
};

// ---------------------------------------------------------------- Freesound (CC0 filter + licence check on the sound page)
const FS_CACHE = path.join(TMP, 'freesound.json');
const fsCache = fs.existsSync(FS_CACHE) ? JSON.parse(fs.readFileSync(FS_CACHE, 'utf8')) : {};
const attr = (s, k) => { const m = s.match(new RegExp('data-' + k + '="([^"]*)"')); return m ? m[1] : null; };
const unent = (s) => String(s || '').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
async function fsSearch(q, d0, d1) {
  const url = 'https://freesound.org/search/?q=' + encodeURIComponent(q).replace(/%20/g, '+') + '&f=' + encodeURIComponent('license:"Creative Commons 0"') + '&d0=' + d0 + '&d1=' + d1;
  const ck = 'search|' + url;
  if (fsCache[ck] && !FORCE) return fsCache[ck];
  const html = curl(url); await sleep(700);
  const out = [];
  for (const chunk of html.split('class="bw-player"').slice(1)) {
    const id = attr(chunk, 'sound-id'), mp3 = attr(chunk, 'mp3');
    if (!id || !mp3) continue;
    out.push({ id, user: attr(chunk, 'username'), title: unent(attr(chunk, 'title')), dur: +attr(chunk, 'duration'), dl: +attr(chunk, 'num-downloads'), mp3: mp3.replace('-lq.mp3', '-hq.mp3') });
  }
  fsCache[ck] = out; fs.writeFileSync(FS_CACHE, JSON.stringify(fsCache, null, 1));
  return out;
}
// relevance order, titles filtered (want / not), then the most downloaded of the first few: popular CC0 takes are usually clean
const candidates = (res, d, o) => res.filter((r) => r.dur >= d[0] && r.dur <= d[1] && (!o.want || o.want.test(r.title)) && !(o.not && o.not.test(r.title))).slice(0, 6).sort((a, b) => b.dl - a.dl);
async function fsPick(id, queries, d, o) {
  const key = id + '|' + JSON.stringify(queries) + '|' + d + '|' + (o.want || '') + '|' + (o.not || '') + '|' + (o.skip || 0);
  if (fsCache[key] && !FORCE) return fsCache[key];
  for (const q of [].concat(queries)) {
    const res = candidates(await fsSearch(q, d[0], d[1]), d, o);
    for (const r of res.slice(o.skip || 0)) {
      const page = curl('https://freesound.org/people/' + encodeURIComponent(r.user) + '/sounds/' + r.id + '/'); await sleep(500);
      if (!/publicdomain\/zero/.test(page)) { console.log('  skip (licence) ' + r.title); continue; }
      const pick = Object.assign(r, { q, url: 'https://freesound.org/people/' + r.user + '/sounds/' + r.id + '/' });
      fsCache[key] = pick; fs.writeFileSync(FS_CACHE, JSON.stringify(fsCache, null, 1));
      return pick;
    }
  }
  throw new Error('no CC0 result for ' + id + ' ' + JSON.stringify(queries));
}

// ---------------------------------------------------------------- the list
// ['id', 'fs', query | [queries], [minDur, maxDur], opts] | ['id', 'kn', 'pack/name', opts] | ['id', 'tts', text, opts]
// opts: loop (s) = seamless loop of that length · max (s) = cut + fade · off (s) = start offset · rate (Hz) · kbps · af = extra filter
//       gain (dB) · skip = take the nth result · voice / fx ('pa' | 'radio' | 'megaphone') for tts
const ONE = { rate: 44100, kbps: 64 }, BED = { rate: 32000, kbps: 48 };
const LIST = [
  // weapons + fights
  ['gun_rev', 'fs', ['revolver shot', 'pistol shot'], [0.3, 4], { max: 1.6, want: /magnum revolver gunshot|revolver.*gunshot/i }],
  ['gun_shotgun', 'fs', ['shotgun shot', 'shotgun blast'], [0.3, 4], { max: 1.8 }],
  ['gun_smg', 'fs', ['pistol gunshot', 'gunshot single'], [0.2, 3], { max: 0.6 }],
  ['gun_rifle', 'fs', ['rifle shot', 'rifle gunshot'], [0.3, 5], { max: 2.2 }],
  ['gun_reload', 'fs', ['gun reload', 'revolver reload'], [0.3, 3], { max: 1.6 }],
  ['gun_dry', 'fs', ['gun dry fire', 'gun empty click'], [0.05, 1.5], { max: 0.4, want: /dry|trigger|click/i }],
  ['ricochet', 'fs', ['bullet ricochet', 'ricochet'], [0.2, 2.5], { max: 1.2 }],
  ['bullet_hit', 'fs', ['bullet impact', 'bullet hit'], [0.05, 1.5], { max: 0.5, want: /impact ground|bullet.*hit/i }],
  ['punch_0', 'kn', 'impact/impactPunch_medium_000'], ['punch_1', 'kn', 'impact/impactPunch_medium_001'], ['punch_2', 'kn', 'impact/impactPunch_heavy_002'],
  ['swing', 'fs', ['whoosh swing', 'swoosh'], [0.1, 1.2], { max: 0.5 }],
  ['grunt_m', 'fs', ['male pain grunt', 'man hurt grunt'], [0.2, 2], { max: 0.9 }],
  ['grunt_f', 'fs', ['female pain grunt', 'woman hurt'], [0.2, 2], { max: 0.9 }],
  ['scream_f', 'fs', ['woman scream', 'female scream'], [0.4, 3], { max: 1.8, not: /cartoon|robot/i }],
  ['scream_m', 'fs', ['man scream', 'male scream'], [0.4, 3], { max: 1.6 }],
  ['whistle', 'fs', ['police whistle', 'referee whistle'], [0.3, 3], { max: 1.5 }],
  ['boom', 'fs', ['explosion', 'big explosion'], [1.5, 9], { max: 4 }],
  ['boom_far', 'fs', ['explosion', 'big explosion'], [1.5, 9], { max: 4, af: 'lowpass=f=700,aecho=0.8:0.7:180|420:0.35|0.25', same: 'boom' }],
  ['crash', 'fs', ['car crash', 'car collision'], [0.8, 5], { max: 2.2 }],
  ['crash_light', 'kn', 'impact/impactMetal_heavy_001'],
  ['glass', 'kn', 'impact/impactGlass_heavy_000'],
  ['fire_loop', 'fs', ['fire crackling', 'campfire'], [8, 180], { loop: 6, ...BED }],
  ['siren_loop', 'fs', ['siren wail', 'police siren'], [4, 90], { loop: 6, ...BED, want: /wail/i }],
  ['alarm_loop', 'fs', ['alarm bell ringing', 'fire alarm bell'], [2, 60], { loop: 3, ...BED, want: /fire alarm bell|bell/i, not: /clock/i }],
  ['heli_loop', 'fs', ['helicopter loop', 'helicopter'], [4, 90], { loop: 3, ...BED }],
  // vehicles
  ['eng_idle', 'fs', ['car engine idle loop', 'car engine idle'], [2, 60], { loop: 2.4, ...BED }],
  ['eng_run', 'fs', ['car engine loop', 'engine running loop'], [2, 60], { loop: 2.8, ...BED, want: /sedan|car/i, not: /idle|hover|synth/i }],
  ['eng_start', 'fs', ['car engine start', 'engine start'], [1, 6], { max: 2.6 }],
  ['horn', 'fs', ['klaxon horn', 'old car horn', 'car horn'], [0.3, 3], { max: 1.4, want: /ahooga|klaxon/i, not: /off axis|traffic/i }],
  ['skid', 'fs', ['tire screech', 'car skid'], [0.5, 4], { max: 2 }],
  ['door_car', 'fs', ['car door close', 'car door slam'], [0.2, 2], { max: 0.9 }],
  ['bike_bell', 'fs', ['bicycle bell', 'bike bell'], [0.2, 2], { max: 1.2 }],
  ['prop_loop', 'fs', ['propeller engine loop', 'airplane cockpit engine', 'propeller plane engine'], [3, 120], { loop: 2.6, ...BED }],
  ['jet_pass', 'fs', ['airplane flyby', 'airplane passing', 'plane flyover'], [3, 25], { max: 12 }],
  ['boat_loop', 'fs', ['boat engine', 'outboard motor', 'motorboat'], [4, 120], { loop: 3, ...BED }],
  ['jetski_loop', 'fs', ['jet ski', 'jetski', 'outboard motor'], [3, 120], { loop: 3, ...BED, skip: 0 }],
  ['ship_horn', 'fs', ['ship horn', 'boat horn', 'foghorn'], [1, 9], { max: 5.5, want: /cruise|ship horn/i }],
  ['tram_bell', 'fs', ['tram bell', 'trolley bell', 'streetcar bell'], [0.3, 4], { max: 2 }],
  ['train_whistle', 'fs', ['steam train whistle', 'train whistle'], [1, 6], { max: 3 }],
  ['wind_loop', 'fs', ['wind rushing', 'wind howling', 'strong wind'], [5, 120], { loop: 6, ...BED }],
  ['splash', 'fs', ['water splash', 'splash'], [0.3, 3], { max: 1.6 }],
  ['chute', 'fs', ['parachute open', 'cloth flap', 'flag flapping'], [0.3, 4], { max: 1.2 }],
  // ambience beds
  ['amb_city', 'fs', ['city ambience traffic', 'city street ambience'], [20, 600], { loop: 16, off: 4, ...BED, want: /street|traffic/i, not: /subway|saw|surround|fantasy/i }],
  ['amb_crowd', 'fs', ['crowd walla', 'crowd murmur', 'people talking crowd'], [10, 600], { loop: 12, off: 3, ...BED }],
  ['amb_park', 'fs', ['birds park ambience', 'birdsong park'], [20, 600], { loop: 16, off: 3, ...BED }],
  ['amb_sea', 'fs', ['ocean waves', 'sea waves beach'], [20, 600], { loop: 16, off: 4, ...BED }],
  ['amb_harbour', 'fs', ['harbor seagulls', 'harbour ambience', 'port ambience seagulls'], [10, 600], { loop: 14, off: 3, ...BED }],
  ['amb_wind', 'fs', ['wind field ambience', 'wind meadow', 'wind ambience'], [10, 600], { loop: 14, off: 3, ...BED }],
  ['amb_night', 'fs', ['crickets night', 'night crickets'], [10, 600], { loop: 12, off: 3, ...BED }],
  ['amb_forest', 'fs', ['forest birds ambience', 'forest ambience birds'], [20, 600], { loop: 16, off: 4, ...BED, want: /bird|forest/i }],
  ['amb_carnival', 'fs', ['carousel music', 'fairground organ', 'calliope', 'music box'], [10, 600], { loop: 22, off: 2, ...BED }],
  ['amb_casino', 'fs', ['casino ambience', 'slot machines casino'], [10, 600], { loop: 16, off: 3, ...BED }],
  ['amb_airport', 'fs', ['airport terminal ambience', 'airport ambience'], [10, 600], { loop: 14, off: 3, ...BED }],
  ['amb_room', 'fs', ['room tone', 'room tone interior'], [5, 600], { loop: 8, off: 1, ...BED }],
  ['amb_jungle', 'fs', ['jungle ambience', 'tropical birds ambience', 'rainforest ambience'], [10, 600], { loop: 14, off: 3, ...BED, want: /daytime|bako|tropical|birds/i, not: /alien|sci-?fi|fantasy|planet/i }],
  ['amb_frogs', 'fs', ['frogs night', 'frogs pond'], [5, 600], { loop: 10, off: 2, ...BED, want: /frogs at night|frogs/i, not: /dog|donkey/i }],
  // animals
  ['an_lion', 'fs', ['lion roar'], [1, 8], { max: 4, want: /big lion|lion/i }], ['an_tiger', 'fs', ['tiger growl', 'tiger roar'], [0.8, 6], { max: 3, want: /tiger/i, not: /fantasy|creature/i }],
  ['an_elephant', 'fs', ['elephant trumpet', 'elephant'], [0.8, 6], { max: 3 }], ['an_monkey', 'fs', ['monkey', 'chimpanzee'], [0.5, 6], { max: 3 }],
  ['an_gorilla', 'fs', ['gorilla', 'ape grunt'], [0.5, 6], { max: 2.5 }], ['an_flamingo', 'fs', ['flamingo', 'goose honk'], [0.4, 6], { max: 2, want: /goose|flamingo/i }],
  ['an_hippo', 'fs', ['hippo', 'hippopotamus'], [0.5, 6], { max: 3 }], ['an_penguin', 'fs', ['penguin colony', 'african penguin', 'penguin'], [0.5, 8], { max: 2.5, not: /alien|toy|kitty|loop/i }],
  ['an_bear', 'fs', ['bear growl', 'bear roar'], [0.5, 6], { max: 2.5, want: /bear/i, not: /synthetic/i }], ['an_sheep', 'fs', ['sheep baa', 'sheep'], [0.4, 4], { max: 2 }],
  ['an_cow', 'fs', ['cow moo', 'cow'], [0.5, 5], { max: 2.5 }], ['an_horse', 'fs', ['horse neigh', 'horse whinny'], [0.5, 4], { max: 2.2 }],
  ['an_dog', 'fs', ['dog bark', 'dog barking'], [0.2, 3], { max: 1.4 }], ['an_duck', 'fs', ['duck quack', 'ducks'], [0.2, 3], { max: 1.4 }],
  ['an_pigeon', 'fs', ['pigeon coo', 'pigeon'], [0.5, 4], { max: 2 }], ['an_hawk', 'fs', ['hawk screech', 'hawk call', 'eagle'], [0.5, 4], { max: 2 }],
  ['an_gull', 'fs', ['seagull', 'seagulls'], [0.4, 4], { max: 2 }], ['an_owl', 'fs', ['owl hoot', 'owl'], [0.5, 4], { max: 2 }],
  ['an_crow', 'fs', ['crow caw', 'crow'], [0.3, 3], { max: 1.5 }], ['an_rooster', 'fs', ['rooster crow', 'rooster'], [1, 5], { max: 3 }],
  // people + places
  ['cheer', 'fs', ['crowd cheer', 'crowd cheering'], [1, 6], { max: 3 }],
  ['cash', 'fs', ['cash register', 'cash register ching'], [0.3, 3], { max: 1.2 }],
  ['coins', 'kn', 'rpg/handleCoins'], ['coins_2', 'kn', 'rpg/handleCoins2'],
  ['door_open', 'kn', 'rpg/doorOpen_1'], ['door_close', 'kn', 'rpg/doorClose_1'],
  ['money', 'fs', ['money counting', 'counting bills', 'paper money'], [0.5, 5], { max: 2.5 }],
  ['drill_loop', 'fs', ['power drill', 'electric drill', 'drilling metal'], [2, 60], { loop: 2, ...BED, want: /drill/i, not: /beat|synth|brain|snare|hip hop|mixins|bass/i }],
  ['torch_loop', 'fs', ['acetylene torch', 'blowtorch', 'welding torch'], [2, 60], { loop: 2.4, ...BED, want: /torch|weld|acetylene|flame/i }],
  ['vault', 'fs', ['vault door', 'heavy metal door', 'heavy door open'], [1, 8], { max: 4 }],
  ['safe_dial', 'fs', ['vault combination lock', 'safe dial', 'combination lock'], [0.5, 6], { max: 2.5, want: /combination|dial|safe/i }],
  ['latch', 'kn', 'rpg/metalLatch'], ['click_metal', 'kn', 'rpg/metalClick'],
  ['cloth', 'kn', 'rpg/cloth1'], ['zip_bag', 'kn', 'rpg/clothBelt'],
  ['phone', 'fs', ['old telephone ring', 'telephone ring'], [1, 6], { max: 3 }],
  ['step_concrete_0', 'kn', 'impact/footstep_concrete_000'], ['step_concrete_1', 'kn', 'impact/footstep_concrete_001'], ['step_concrete_2', 'kn', 'impact/footstep_concrete_002'],
  ['step_grass_0', 'kn', 'impact/footstep_grass_000'], ['step_grass_1', 'kn', 'impact/footstep_grass_001'], ['step_grass_2', 'kn', 'impact/footstep_grass_002'],
  ['step_wood_0', 'kn', 'impact/footstep_wood_000'], ['step_wood_1', 'kn', 'impact/footstep_wood_001'], ['step_wood_2', 'kn', 'impact/footstep_wood_002'],
  ['step_carpet_0', 'kn', 'impact/footstep_carpet_000'], ['step_carpet_1', 'kn', 'impact/footstep_carpet_001'],
  // casino
  ['slot_spin', 'kn', 'casino/card-fan-1'],
  ['slot_win', 'fs', ['slot machine jackpot', 'jackpot coins', 'coins payout'], [1, 6], { max: 3.2 }],
  ['roulette', 'fs', ['roulette wheel', 'roulette ball'], [2, 12], { max: 5 }],
  ['card_deal', 'kn', 'casino/card-slide-1'], ['card_place', 'kn', 'casino/card-place-1'], ['card_shuffle', 'kn', 'casino/card-shuffle'],
  ['chips', 'kn', 'casino/chips-stack-1'], ['chips_2', 'kn', 'casino/chips-collide-2'], ['dice_throw', 'kn', 'casino/dice-throw-1'], ['dice_shake', 'kn', 'casino/dice-shake-1'],
  // UI + music stings + crew voice
  ['ui_click', 'kn', 'interface/click_002'], ['ui_deny', 'kn', 'interface/error_004'], ['ui_ding', 'kn', 'interface/confirmation_002'],
  ['ui_check', 'kn', 'interface/confirmation_004'], ['ui_open', 'kn', 'interface/maximize_006'], ['ui_alert', 'kn', 'interface/glitch_002'],
  ['jg_start', 'kn', 'jingles/jingles_SAX03'], ['jg_pass', 'kn', 'jingles/jingles_SAX00'], ['jg_fail', 'kn', 'jingles/jingles_SAX10'], ['jg_win', 'kn', 'jingles/jingles_STEEL02'],
  ['jg_spot', 'kn', 'jingles/jingles_HIT05'],
  ['v_complete', 'kn', 'voice/mission_completed'], ['v_failed', 'kn', 'voice/mission_failed'], ['v_go', 'kn', 'voice/war_go_go_go'],
  ['v_cover', 'kn', 'voice/war_cover_me'], ['v_lookout', 'kn', 'voice/war_look_out'], ['v_fire', 'kn', 'voice/war_fire_in_the_hole'],
  ['v_reload', 'kn', 'voice/war_reloading'], ['v_hurry', 'kn', 'voice/hurry_up'], ['v_objective', 'kn', 'voice/objective_achieved'],
  // announcements (flite) — PA chime + bandpass + hall echo
  ['pa_air_1', 'tts', 'Attention please. Solace Air flight two seven to the capital is now boarding at stand three.', { fx: 'pa', voice: 'slt' }],
  ['pa_air_2', 'tts', 'Passengers are reminded to keep their luggage with them at all times.', { fx: 'pa', voice: 'slt' }],
  ['pa_air_3', 'tts', 'Westgate tower reports the runway clear. Have a pleasant flight.', { fx: 'pa', voice: 'rms' }],
  ['pa_ferry', 'tts', 'The island ferry departs from pier one in five minutes. All aboard, please.', { fx: 'pa', voice: 'awb' }],
  ['pa_ship_1', 'tts', 'Good evening, and welcome aboard the Solace Queen. The Grand Casino on the casino deck is now open.', { fx: 'pa', voice: 'slt' }],
  ['pa_ship_2', 'tts', 'Ladies and gentlemen, dinner is served in the Starlight ballroom. Enjoy your evening.', { fx: 'pa', voice: 'rms' }],
  ['pa_station', 'tts', 'The Coastline Limited to the capital is now departing from platform one.', { fx: 'pa', voice: 'rms' }],
  ['pa_bank', 'tts', 'The Harbour Trust will close in fifteen minutes. Thank you for banking with us.', { fx: 'pa', voice: 'slt' }],
  ['pa_carnival', 'tts', 'Step right up! Test your strength, win a prize!', { fx: 'megaphone', voice: 'awb' }],
  ['mega_police', 'tts', 'This is the police! Come out with your hands up!', { fx: 'megaphone', voice: 'rms' }],
  ['mega_stop', 'tts', 'Pull over! Pull over now!', { fx: 'megaphone', voice: 'kal16' }],
  // crew radio (flite through a walkie-talkie)
  ['r_copy', 'tts', 'Copy that.', { fx: 'radio', voice: 'awb' }],
  ['r_clear', 'tts', 'You are clear. Move now.', { fx: 'radio', voice: 'awb' }],
  ['r_guard', 'tts', 'Guard coming your way. Stay out of sight.', { fx: 'radio', voice: 'awb' }],
  ['r_spotted', 'tts', 'You have been made! Abort, abort!', { fx: 'radio', voice: 'awb' }],
  ['r_vault', 'tts', 'The vault is open. Grab the cash and go.', { fx: 'radio', voice: 'awb' }],
  ['r_cops', 'tts', 'The police scanner is lit up. Lose them!', { fx: 'radio', voice: 'awb' }],
  ['r_plane', 'tts', 'The plane is fuelled. Get airborne.', { fx: 'radio', voice: 'slt' }],
  ['r_jump', 'tts', 'Green light! Jump, jump, jump!', { fx: 'radio', voice: 'slt' }],
  ['r_boat', 'tts', 'The boat is waiting at the jetty.', { fx: 'radio', voice: 'slt' }],
  ['r_good', 'tts', 'Nice work, crew. Head to the drop.', { fx: 'radio', voice: 'awb' }],
  ['r_checkpoint', 'tts', 'Okay. Regroup and try that again.', { fx: 'radio', voice: 'awb' }],
];

// ---------------------------------------------------------------- processing
const maxDb = (f) => {
  const r = volDetect(f), m = r.match(/max_volume:\s*(-?[\d.]+) dB/), mean = r.match(/mean_volume:\s*(-?[\d.]+) dB/);
  return { max: m ? +m[1] : 0, mean: mean ? +mean[1] : -20 };
};
const enc = (o) => ['-ac', '1', '-ar', String(o.rate || ONE.rate), '-c:a', 'libmp3lame', '-b:a', (o.kbps || ONE.kbps) + 'k'];
function finish(src, id, o) {
  const out = path.join(OUT, id + '.mp3'), tmp = path.join(TMP, id + '.wav');
  const len = dur(src), pre = [];
  if (o.af) pre.push(o.af);
  if (o.loop) {
    const L = Math.min(o.loop, len - 0.2), X = Math.min(1.5, Math.max(0.2, L * 0.15)), off = Math.min(o.off ?? Math.min(1, len * 0.1), Math.max(0, len - L - X - 0.05));
    const g = `[0:a]${pre.length ? pre.join(',') + ',' : ''}atrim=${off}:${off + L + X},asetpts=N/SR/TB,aformat=channel_layouts=mono,asplit=3[a][b][c];` +
      `[a]atrim=${X}:${L},asetpts=N/SR/TB[body];[b]atrim=${L}:${L + X},asetpts=N/SR/TB,afade=t=out:d=${X}:curve=qsin[tail];` +
      `[c]atrim=0:${X},asetpts=N/SR/TB,afade=t=in:d=${X}:curve=qsin[head];[tail][head]amix=inputs=2:normalize=0[xf];[body][xf]concat=n=2:v=0:a=1[o]`;
    ff(['-i', src, '-filter_complex', g, '-map', '[o]', '-ar', String(o.rate), tmp]);
    // loudness-matched beds (EBU R128 single pass is fine for steady ambience)
    ff(['-i', tmp, '-af', 'loudnorm=I=-21:TP=-2:LRA=9', ...enc(o), out]);
  } else {
    const max = o.max || 6, chain = [...pre, 'aformat=channel_layouts=mono', 'silenceremove=start_periods=1:start_threshold=-48dB:start_silence=0.005', 'areverse', 'silenceremove=start_periods=1:start_threshold=-52dB', 'areverse', `atrim=0:${max}`];
    ff(['-i', src, '-af', chain.join(','), tmp]);
    const L = dur(tmp), fade = Math.min(0.25, L * 0.2), v = maxDb(tmp), gain = -1 - v.max + (o.gain || 0);
    ff(['-i', tmp, '-af', `afade=t=out:st=${Math.max(0, L - fade).toFixed(3)}:d=${fade.toFixed(3)},volume=${gain.toFixed(2)}dB`, ...enc(o), out]);
  }
  fs.rmSync(tmp, { force: true });
  return out;
}
function tts(id, text, o) {
  const tf = path.join(TMP, id + '.txt'); fs.writeFileSync(tf, text.replace(/[^\w .,!?'-]/g, ' '));
  const voice = path.join(TMP, id + '-v.wav'), chime = path.join(TMP, 'chime.wav'), out = path.join(OUT, id + '.mp3');
  ff(['-f', 'lavfi', '-i', `flite=textfile=${id}.txt:voice=${o.voice || 'slt'}`, '-ar', '22050', '-ac', '1', voice]);
  let fx;
  if (o.fx === 'pa') {
    if (!fs.existsSync(chime)) ff(['-f', 'lavfi', '-i', "aevalsrc=exprs='0.45*sin(2*PI*784*t)*exp(-2.6*t)*lt(t,0.55)+0.45*sin(2*PI*622*(t-0.5))*exp(-2.2*(t-0.5))*gte(t,0.5)':d=1.6:s=22050", chime]);
    fx = `[1:a]highpass=f=320,lowpass=f=3600,acompressor=threshold=-18dB:ratio=3,aecho=0.8:0.55:90|230:0.32|0.18,volume=1.6[v];[0:a][v]concat=n=2:v=0:a=1,apad=pad_dur=0.6[o]`;
    ff(['-i', chime, '-i', voice, '-filter_complex', fx, '-map', '[o]', '-ac', '1', '-ar', '22050', '-c:a', 'libmp3lame', '-b:a', '32k', out]);
  } else if (o.fx === 'radio') {
    fx = `[0:a]highpass=f=480,lowpass=f=2900,acrusher=bits=10:mix=0.4,acompressor=threshold=-20dB:ratio=4,volume=1.8[v];anoisesrc=d=0.18:c=white:a=0.12:r=22050,highpass=f=900,lowpass=f=4000[n];[v][n]concat=n=2:v=0:a=1[o]`;
    ff(['-i', voice, '-filter_complex', fx, '-map', '[o]', '-ac', '1', '-ar', '22050', '-c:a', 'libmp3lame', '-b:a', '32k', out]);
  } else {
    ff(['-i', voice, '-af', 'highpass=f=650,lowpass=f=3200,acrusher=bits=8:mix=0.25,aecho=0.7:0.4:60:0.3,volume=2', '-ac', '1', '-ar', '22050', '-c:a', 'libmp3lame', '-b:a', '32k', out]);
  }
  fs.rmSync(tf, { force: true }); fs.rmSync(voice, { force: true });
  return out;
}

// ---------------------------------------------------------------- run
if (process.argv.includes('--list')) {
  for (const [id, kind, src, a, b] of LIST) {
    if (kind !== 'fs' || (ONLY && !ONLY.has(id))) continue;
    const o = b || {};
    for (const q of [].concat(src)) {
      const all = await fsSearch(q, a[0], a[1]), c = candidates(all, a, o);
      console.log(id + ' [' + q + '] ' + all.slice(0, 8).map((r) => (c[0] === r ? '*' : '') + r.title + ' (' + r.dur.toFixed(1) + 's ' + r.dl + ')').join(' | '));
      if (c.length) break;
    }
  }
  process.exit(0);
}
const credits = [];
const CRED = path.join(TMP, 'credits.json'), prev = fs.existsSync(CRED) ? JSON.parse(fs.readFileSync(CRED, 'utf8')) : {};
let n = 0, bytes = 0;
for (const [id, kind, src, a, b] of LIST) {
  if (ONLY && !ONLY.has(id)) { if (prev[id]) credits.push(prev[id]); continue; }
  const out = path.join(OUT, id + '.mp3');
  try {
    if (fs.existsSync(out) && !FORCE && prev[id]) { credits.push(prev[id]); bytes += fs.statSync(out).size; continue; }
    let line;
    if (kind === 'kn') {
      const [pack, name] = src.split('/'); finish(kenFile(pack, name), id, Object.assign({}, ONE, a || {}));
      line = `${id}: Kenney "${pack}" pack, ${name} \u2014 CC0 (kenney.nl)`;
    } else if (kind === 'tts') {
      tts(id, src, a || {}); line = `${id}: spoken by the flite synthesiser (ffmpeg) \u2014 generated for this game`;
    } else {
      const o = Object.assign({}, ONE, b || {});
      const pick = await fsPick(o.same || id, src, a, o);
      const raw = path.join(RAW, pick.id + '.mp3');
      if (!fs.existsSync(raw)) { curl(pick.mp3, raw); await sleep(400); }
      finish(raw, id, o);
      line = `${id}: "${pick.title}" by ${pick.user} \u2014 CC0 \u2014 ${pick.url}`;
    }
    prev[id] = line; credits.push(line); n++; bytes += fs.statSync(out).size;
    console.log('ok   ' + id.padEnd(16) + (fs.statSync(out).size / 1024).toFixed(1).padStart(6) + ' KB  ' + line.replace(/^[^:]+: /, ''));
  } catch (e) { console.log('FAIL ' + id + ' ' + String(e.message || e).split('\n')[0]); }
  fs.writeFileSync(CRED, JSON.stringify(prev, null, 1));
}
fs.writeFileSync(path.join(OUT, 'CREDITS.txt'), 'Port Solace sound credits. Every sound is CC0 / public domain or generated for this game; thank you to the authors.\n\n' + credits.join('\n') + '\n');
console.log(`\n${n} built, ${LIST.length} listed, assets/sfx total ${(bytes / 1024).toFixed(0)} KB`);
