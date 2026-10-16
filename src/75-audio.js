// ================================================================ 75-audio.js
try {
// ===== 75-audio: the sound engine — recorded one-shots, loops and location ambience (assets/sfx, built by tools/sfx-build.mjs)  (OWNER: game) =====
// AF.audio.play(id, { x, y, z, vol, rate, ref, bus }) -> voice | null      positional when x/z given (pan + distance falloff from the camera)
// AF.audio.loop(id, { vol, rate, bus }) -> { set(vol, rate), at(x, y, z, ref), stop() }   engines, sirens, fire, the drill
// AF.audio.need(id) -> Promise (loads + decodes on demand; the core set loads on the first tap / key press)
// Beds (city, crowd, park, sea, harbour, wind, night, forest, carnival, casino, airport, room, jungle, frogs) crossfade with where the
// listener is; sprinkles (gulls, horns, dogs, zoo calls, announcements) play at points around them. All of it is local: nothing is sent.
// Files are mono MP3 (one-shots 44.1 kHz, beds 32 kHz); loops trim the encoder padding so they wrap without a click. Decoded audio
// is ~4 bytes a sample: beds unused for two minutes are dropped again (iOS memory, PERF.md §8.9).
{
  const A = AF.audio = { ctx: null, on: true, vol: 0.85, stats: { voices: 0, loops: 0, loaded: 0, bytes: 0, beds: 0 }, zone: '' };
  try { const v = +localStorage.getItem('portSolace.volume'); if (v >= 0 && v <= 1 && localStorage.getItem('portSolace.volume') !== null) A.vol = v; } catch (e) { /* storage blocked */ }
  try { A.on = localStorage.getItem('portSolace.sound') !== '0'; } catch (e) { A.on = true; }
  const BASE = 'assets/sfx/';
  // id: [files, gain, bus, ref m (full volume within), loop]
  const LIB = {
    rev: [['gun_rev'], 0.9, 'sfx', 14], shotgun: [['gun_shotgun'], 1, 'sfx', 14], smg: [['gun_smg'], 0.7, 'sfx', 14], rifle: [['gun_rifle'], 1, 'sfx', 18],
    reload: [['gun_reload'], 0.55, 'sfx', 3], dry: [['gun_dry'], 0.6, 'sfx', 3], ricochet: [['ricochet'], 0.45, 'sfx', 6], bullet_hit: [['bullet_hit'], 0.5, 'sfx', 5],
    sil: [['gun_sil'], 0.55, 'sfx', 4], lmg: [['gun_lmg'], 0.75, 'sfx', 18], hit_tick: [['hit_tick'], 0.35, 'ui', 1], hit_head: [['hit_head'], 0.4, 'ui', 1],
    punch: [['punch_0', 'punch_1', 'punch_2'], 0.85, 'sfx', 4], swing: [['swing'], 0.4, 'sfx', 3],
    grunt_m: [['grunt_m'], 0.65, 'voice', 4], grunt_f: [['grunt_f'], 0.65, 'voice', 4], scream_f: [['scream_f'], 0.55, 'voice', 8], scream_m: [['scream_m'], 0.55, 'voice', 8],
    whistle: [['whistle'], 0.5, 'sfx', 10], boom: [['boom'], 1, 'sfx', 30], boom_far: [['boom_far'], 0.9, 'sfx', 80], crash: [['crash'], 0.85, 'sfx', 10],
    crash_light: [['crash_light'], 0.6, 'sfx', 6], glass: [['glass'], 0.6, 'sfx', 6], horn: [['horn'], 0.7, 'veh', 10], skid: [['skid'], 0.5, 'veh', 8],
    door_car: [['door_car'], 0.6, 'veh', 4], eng_start: [['eng_start'], 0.6, 'veh', 6], bike_bell: [['bike_bell'], 0.5, 'veh', 6], splash: [['splash'], 0.7, 'sfx', 8],
    chute: [['chute'], 0.7, 'sfx', 4], jet_pass: [['jet_pass'], 0.9, 'veh', 90], ship_horn: [['ship_horn'], 0.9, 'amb', 160], tram_bell: [['tram_bell'], 0.5, 'veh', 12],
    train_whistle: [['train_whistle'], 0.7, 'veh', 60],
    // loops
    fire_loop: [['fire_loop'], 0.6, 'sfx', 5, 1], siren_loop: [['siren_loop'], 0.55, 'veh', 25, 1], alarm_loop: [['alarm_loop'], 0.55, 'sfx', 20, 1],
    heli_loop: [['heli_loop'], 0.7, 'veh', 30, 1], eng_idle: [['eng_idle'], 0.45, 'veh', 6, 1], eng_run: [['eng_run'], 0.5, 'veh', 8, 1],
    prop_loop: [['prop_loop'], 0.5, 'veh', 20, 1], boat_loop: [['boat_loop'], 0.5, 'veh', 15, 1], jetski_loop: [['jetski_loop'], 0.5, 'veh', 10, 1], ski_spray: [['ski_spray'], 0.5, 'veh', 8, 1],
    wind_loop: [['wind_loop'], 0.6, 'amb', 1, 1], drill_loop: [['drill_loop'], 0.5, 'sfx', 6, 1], torch_loop: [['torch_loop'], 0.5, 'sfx', 6, 1],
    fall_loop: [['fall_loop'], 0.75, 'amb', 1, 1], canopy_loop: [['canopy_loop'], 0.5, 'amb', 1, 1],
    stream_loop: [['stream_loop'], 0.55, 'amb', 7, 1], falls_loop: [['falls_loop'], 0.75, 'amb', 25, 1], fountain_loop: [['fountain_loop'], 0.5, 'amb', 6, 1], lap_loop: [['lap_loop'], 0.5, 'amb', 8, 1],
    tractor_loop: [['tractor_loop'], 0.55, 'veh', 12, 1], combine_loop: [['combine_loop'], 0.6, 'veh', 16, 1], tram_loop: [['tram_loop'], 0.5, 'veh', 12, 1],
    step_water: [['step_water_0', 'step_water_1'], 0.32, 'sfx', 2],
    // beds
    amb_city: [['amb_city'], 0.38, 'amb', 1, 1], amb_crowd: [['amb_crowd'], 0.32, 'amb', 1, 1], amb_park: [['amb_park'], 0.42, 'amb', 1, 1], amb_sea: [['amb_sea'], 0.45, 'amb', 1, 1],
    amb_harbour: [['amb_harbour'], 0.38, 'amb', 1, 1], amb_wind: [['amb_wind'], 0.35, 'amb', 1, 1], amb_night: [['amb_night'], 0.35, 'amb', 1, 1], amb_forest: [['amb_forest'], 0.42, 'amb', 1, 1],
    amb_carnival: [['amb_carnival'], 0.4, 'amb', 1, 1], amb_casino: [['amb_casino'], 0.45, 'amb', 1, 1], amb_airport: [['amb_airport'], 0.4, 'amb', 1, 1], amb_room: [['amb_room'], 0.3, 'amb', 1, 1],
    amb_jungle: [['amb_jungle'], 0.4, 'amb', 1, 1], amb_frogs: [['amb_frogs'], 0.35, 'amb', 1, 1],
    // animals + people + places
    an_lion: [['an_lion'], 0.8, 'amb', 25], an_tiger: [['an_tiger'], 0.7, 'amb', 20], an_elephant: [['an_elephant'], 0.8, 'amb', 30], an_monkey: [['an_monkey'], 0.6, 'amb', 15],
    an_gorilla: [['an_gorilla'], 0.6, 'amb', 15], an_flamingo: [['an_flamingo'], 0.5, 'amb', 12], an_hippo: [['an_hippo'], 0.6, 'amb', 15], an_penguin: [['an_penguin'], 0.5, 'amb', 10],
    an_bear: [['an_bear'], 0.6, 'amb', 15], an_sheep: [['an_sheep'], 0.55, 'amb', 12], an_cow: [['an_cow'], 0.6, 'amb', 18], an_horse: [['an_horse'], 0.6, 'amb', 15],
    an_dog: [['an_dog'], 0.55, 'amb', 12], an_duck: [['an_duck'], 0.45, 'amb', 8], an_pigeon: [['an_pigeon'], 0.4, 'amb', 6], an_hawk: [['an_hawk'], 0.5, 'amb', 40],
    an_gull: [['an_gull'], 0.5, 'amb', 20], an_owl: [['an_owl'], 0.45, 'amb', 20], an_crow: [['an_crow'], 0.45, 'amb', 15], an_rooster: [['an_rooster'], 0.5, 'amb', 25],
    cheer: [['cheer'], 0.55, 'amb', 10], cash: [['cash'], 0.5, 'ui', 1], coins: [['coins', 'coins_2'], 0.55, 'ui', 1], door_open: [['door_open'], 0.5, 'sfx', 4], door_close: [['door_close'], 0.5, 'sfx', 4],
    money: [['money'], 0.55, 'sfx', 3], vault: [['vault'], 0.8, 'sfx', 10], safe_dial: [['safe_dial'], 0.6, 'sfx', 3], latch: [['latch'], 0.6, 'sfx', 3], click_metal: [['click_metal'], 0.5, 'sfx', 3],
    cloth: [['cloth'], 0.5, 'sfx', 3], zip_bag: [['zip_bag'], 0.5, 'sfx', 3], phone: [['phone'], 0.55, 'sfx', 6],
    step_concrete: [['step_concrete_0', 'step_concrete_1', 'step_concrete_2'], 0.22, 'sfx', 2], step_grass: [['step_grass_0', 'step_grass_1', 'step_grass_2'], 0.22, 'sfx', 2],
    step_wood: [['step_wood_0', 'step_wood_1', 'step_wood_2'], 0.24, 'sfx', 2], step_carpet: [['step_carpet_0', 'step_carpet_1'], 0.2, 'sfx', 2],
    slot_spin: [['slot_spin'], 0.5, 'sfx', 4], slot_win: [['slot_win'], 0.55, 'sfx', 6], roulette: [['roulette'], 0.55, 'sfx', 5], card_deal: [['card_deal'], 0.6, 'sfx', 3],
    card_place: [['card_place'], 0.6, 'sfx', 3], card_shuffle: [['card_shuffle'], 0.6, 'sfx', 3], chips: [['chips', 'chips_2'], 0.6, 'sfx', 3], dice_throw: [['dice_throw'], 0.6, 'sfx', 3], dice_shake: [['dice_shake'], 0.6, 'sfx', 3],
    ui_click: [['ui_click'], 0.4, 'ui', 1], ui_deny: [['ui_deny'], 0.45, 'ui', 1], ui_ding: [['ui_ding'], 0.5, 'ui', 1], ui_check: [['ui_check'], 0.55, 'ui', 1], ui_open: [['ui_open'], 0.4, 'ui', 1], ui_alert: [['ui_alert'], 0.6, 'ui', 1],
    jg_start: [['jg_start'], 0.6, 'ui', 1], jg_pass: [['jg_pass'], 0.65, 'ui', 1], jg_fail: [['jg_fail'], 0.6, 'ui', 1], jg_win: [['jg_win'], 0.55, 'ui', 1], jg_spot: [['jg_spot'], 0.7, 'ui', 1],
    v_complete: [['v_complete'], 0.8, 'voice', 1], v_failed: [['v_failed'], 0.8, 'voice', 1], v_go: [['v_go'], 0.7, 'voice', 1], v_cover: [['v_cover'], 0.7, 'voice', 1], v_lookout: [['v_lookout'], 0.7, 'voice', 1],
    v_fire: [['v_fire'], 0.75, 'voice', 1], v_reload: [['v_reload'], 0.6, 'voice', 1], v_hurry: [['v_hurry'], 0.7, 'voice', 1], v_objective: [['v_objective'], 0.7, 'voice', 1],
    pa_air: [['pa_air_1', 'pa_air_2', 'pa_air_3'], 0.6, 'voice', 30], pa_ferry: [['pa_ferry'], 0.6, 'voice', 25], pa_ship: [['pa_ship_1', 'pa_ship_2'], 0.6, 'voice', 30], pa_station: [['pa_station'], 0.6, 'voice', 30],
    pa_bank: [['pa_bank'], 0.55, 'voice', 25], pa_carnival: [['pa_carnival'], 0.55, 'voice', 15], mega_police: [['mega_police'], 0.75, 'voice', 30], mega_stop: [['mega_stop'], 0.75, 'voice', 30],
    r_copy: [['r_copy'], 0.75, 'voice', 1], r_clear: [['r_clear'], 0.75, 'voice', 1], r_guard: [['r_guard'], 0.75, 'voice', 1], r_spotted: [['r_spotted'], 0.8, 'voice', 1], r_vault: [['r_vault'], 0.75, 'voice', 1],
    r_cops: [['r_cops'], 0.75, 'voice', 1], r_plane: [['r_plane'], 0.75, 'voice', 1], r_jump: [['r_jump'], 0.75, 'voice', 1], r_boat: [['r_boat'], 0.75, 'voice', 1], r_good: [['r_good'], 0.75, 'voice', 1],
    r_checkpoint: [['r_checkpoint'], 0.75, 'voice', 1],
  };
  A.LIB = LIB;
  const CORE = ['rev', 'shotgun', 'smg', 'rifle', 'sil', 'lmg', 'hit_tick', 'punch', 'swing', 'dry', 'reload', 'crash', 'crash_light', 'boom', 'ui_click', 'ui_deny', 'ui_ding', 'cash', 'step_concrete', 'step_grass', 'grunt_m', 'eng_idle', 'eng_run', 'door_car'];
  const BUS_GAIN = { sfx: 0.9, amb: 0.75, veh: 0.8, ui: 0.7, voice: 1 };
  let ctx = null, master = null, ambLP = null;
  const bus = {};
  const files = new Map();        // file -> { buf, p, used, bytes, s0, s1 }
  const voices = new Set();
  const loops = new Set();
  const V3 = new THREE.Vector3();
  // ---------------------------------------------------------------- context (created and unlocked by the first gesture: iOS needs it)
  A.ctxOk = () => !!ctx && ctx.state === 'running';
  const make = () => {
    if (ctx || !A.on) return ctx;
    try {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
      try { ctx = new AC({ latencyHint: 'interactive' }); } catch (e) { ctx = new AC(); }
      master = ctx.createGain(); master.gain.value = A.vol;
      // one gentle compressor on the whole mix: recordings from many sources sit together and peaks never clip
      let out = ctx.destination;
      try { const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -12; comp.knee.value = 10; comp.ratio.value = 2.5; comp.attack.value = 0.006; comp.release.value = 0.3; comp.connect(ctx.destination); out = comp; } catch (e) { /* old webkit: straight out */ }
      master.connect(out);
      for (const k in BUS_GAIN) { const g = ctx.createGain(); g.gain.value = BUS_GAIN[k]; bus[k] = g; }
      // indoors the outdoor beds go dull (one low-pass on the ambience bus)
      ambLP = ctx.createBiquadFilter(); ambLP.type = 'lowpass'; ambLP.frequency.value = 18000; ambLP.Q.value = 0.5;
      bus.amb.connect(ambLP).connect(master);
      for (const k in bus) if (k !== 'amb') bus[k].connect(master);
      A.ctx = ctx;
      for (const id of CORE) A.need(id);
    } catch (e) { ctx = null; AF.warnOnce('audio context', e); }
    return ctx;
  };
  A.bus = (k) => (make(), bus[k] || bus.sfx);
  const unlock = () => {
    const c = make(); if (!c) return;
    if (c.state !== 'running') c.resume().catch(() => {});
    if (!A.unlocked) { A.unlocked = true; try { const b = c.createBuffer(1, 1, 22050), s = c.createBufferSource(); s.buffer = b; s.connect(c.destination); s.start(0); } catch (e) { /* old webkit */ } }
  };
  for (const ev of ['pointerdown', 'keydown', 'touchend']) addEventListener(ev, unlock, true);
  document.addEventListener('visibilitychange', () => { if (!ctx) return; if (document.hidden) ctx.suspend().catch(() => {}); else if (A.on) ctx.resume().catch(() => {}); });
  A.setOn = (on) => {
    A.on = !!on; try { localStorage.setItem('portSolace.sound', on ? '1' : '0'); } catch (e) { /* storage blocked */ }
    if (!ctx) { if (on) make(); return; }
    if (on) ctx.resume().catch(() => {}); else ctx.suspend().catch(() => {});
  };
  A.setVolume = (v) => { A.vol = AF.clamp(+v || 0, 0, 1); if (master) master.gain.setTargetAtTime(A.vol, ctx.currentTime, 0.05); try { localStorage.setItem('portSolace.volume', String(A.vol)); } catch (e) { /* storage blocked */ } };

  // ---------------------------------------------------------------- loading (fetch + decode once per file; loops find their own edges)
  const decode = (ab) => new Promise((res, rej) => { try { const p = ctx.decodeAudioData(ab, res, rej); if (p && p.then) p.then(res, rej); } catch (e) { rej(e); } });
  const edges = (f) => {
    const d = f.buf.getChannelData(0), n = d.length, lim = Math.min(n >> 2, Math.round(f.buf.sampleRate * 0.08));
    let a = 0; while (a < lim && Math.abs(d[a]) < 2e-4) a++;
    let b = n - 1; while (b > n - lim && Math.abs(d[b]) < 2e-4) b--;
    f.s0 = a / f.buf.sampleRate; f.s1 = (b + 1) / f.buf.sampleRate;
  };
  const loadFile = (name, loop) => {
    let f = files.get(name);
    if (f) { f.used = AF.clock.t; return f.p; }
    f = { buf: null, p: null, used: AF.clock.t, bytes: 0, s0: 0, s1: 0, loop };
    files.set(name, f);
    f.p = fetch(BASE + name + '.mp3').then((r) => { if (!r.ok) throw new Error(r.status + ' ' + name); return r.arrayBuffer(); }).then(decode).then((buf) => {
      f.buf = buf; f.bytes = buf.length * buf.numberOfChannels * 4; A.stats.bytes += f.bytes; A.stats.loaded++; if (loop) edges(f); return buf;
    }).catch((e) => { AF.warnOnce('audio load ' + name, e); files.delete(name); return null; });
    return f.p;
  };
  A.need = (id) => { const L = LIB[id]; if (!L || !make()) return Promise.resolve(null); return Promise.all(L[0].map((n) => loadFile(n, !!L[4]))); };
  A.ready = (id) => { const L = LIB[id]; if (!L) return false; for (const n of L[0]) { const f = files.get(n); if (!f || !f.buf) return false; } return true; };
  const pick = (L) => { const names = L[0], n = names.length === 1 ? names[0] : names[(Math.random() * names.length) | 0], f = files.get(n); if (f) f.used = AF.clock.t; return f && f.buf ? f : null; };
  // drop beds and loops nobody has played for two minutes (they reload on demand)
  const reap = () => {
    for (const [n, f] of files) if (f.buf && f.loop && AF.clock.t - f.used > 120 && ![...loops].some((l) => l.f === f)) { A.stats.bytes -= f.bytes; files.delete(n); }
  };

  // ---------------------------------------------------------------- listener geometry: camera position + right vector
  const LS = { x: 0, y: 0, z: 0, rx: 1, rz: 0, vx: 0, vz: 0, vy: 0, px: 0, py: 0, pz: 0, speed: 0 };
  const listen = (dt) => {
    const c = AF.camera, e = c.matrixWorld.elements;
    LS.x = e[12]; LS.y = e[13]; LS.z = e[14];
    const l = Math.hypot(e[0], e[2]) || 1; LS.rx = e[0] / l; LS.rz = e[2] / l;
    if (dt > 0) { const k = Math.min(1, dt * 4); LS.vx += ((LS.x - LS.px) / dt - LS.vx) * k; LS.vy += ((LS.y - LS.py) / dt - LS.vy) * k; LS.vz += ((LS.z - LS.pz) / dt - LS.vz) * k; }
    if (Math.abs(LS.x - LS.px) + Math.abs(LS.z - LS.pz) > 200) LS.vx = LS.vy = LS.vz = 0;
    LS.px = LS.x; LS.py = LS.y; LS.pz = LS.z; LS.speed = Math.hypot(LS.vx, LS.vy, LS.vz);
  };
  A.listener = LS;
  // gain + pan for a source at (x, y, z): full volume within ref metres, then ref / d (inverse distance), panned by the bearing
  const POS = { g: 1, pan: 0, d: 0 };
  const place = (x, y, z, ref) => {
    const dx = x - LS.x, dy = (y ?? LS.y) - LS.y, dz = z - LS.z, d = Math.hypot(dx, dy, dz);
    POS.d = d; POS.g = d <= ref ? 1 : ref / (ref + (d - ref) * 1.15);
    POS.pan = d < 0.5 ? 0 : AF.clamp((dx * LS.rx + dz * LS.rz) / Math.max(d, 1), -1, 1) * 0.8;
    return POS;
  };

  // ---------------------------------------------------------------- one-shots
  const MAX_VOICES = AF.MOBILE ? 20 : 32;
  A.play = (id, o) => {
    if (!A.on || !ctx || ctx.state !== 'running') return null;
    const L = LIB[id]; if (!L) return null;
    const f = pick(L); if (!f) { A.need(id); return null; }
    let g = L[1] * (o && o.vol != null ? o.vol : 1), pan = 0;
    if (o && o.x != null) { const P = place(o.x, o.y, o.z, o.ref || L[3]); g *= P.g; pan = P.pan; if (g < 0.012) return null; }
    if (voices.size >= MAX_VOICES) { let q = null; for (const v of voices) if (!q || v.k < q.k) q = v; if (q && q.k < g) { try { q.src.stop(); } catch (e) { /* ended */ } voices.delete(q); } else return null; }
    try {
      const src = ctx.createBufferSource(), gn = ctx.createGain();
      src.buffer = f.buf; src.playbackRate.value = (o && o.rate) || (0.96 + Math.random() * 0.08);
      gn.gain.value = g;
      let tail = gn;
      if (pan && ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = pan; gn.connect(p); tail = p; }
      src.connect(gn); tail.connect(bus[(o && o.bus) || L[2]] || bus.sfx);
      const v = { src, gn, k: g };
      voices.add(v); src.onended = () => { voices.delete(v); try { tail.disconnect(); } catch (e) { /* gone */ } };
      src.start(ctx.currentTime + ((o && o.delay) || 0));
      A.stats.voices = voices.size;
      return v;
    } catch (e) { AF.warnOnce('audio play', e); return null; }
  };

  // ---------------------------------------------------------------- loops: a handle that fades in when its buffer arrives
  class Loop {
    constructor(id, o = {}) {
      this.id = id; this.L = LIB[id]; this.vol = o.vol ?? 1; this.rate = o.rate ?? 1; this.busK = o.bus || (this.L && this.L[2]) || 'sfx';
      this.pos = null; this.ref = o.ref || (this.L && this.L[3]) || 10; this.src = null; this.gn = null; this.pan = null; this.f = null; this.dead = false; this.cur = 0;
      this.tc = o.tc ?? (this.busK === 'amb' ? 0.5 : 0.12);   // ambience glides slowly, engines follow the throttle
      loops.add(this); A.stats.loops = loops.size; A.need(id);
    }
    at(x, y, z, ref) { if (!this.pos) this.pos = { x: 0, y: 0, z: 0 }; this.pos.x = x; this.pos.y = y; this.pos.z = z; if (ref) this.ref = ref; return this; }
    set(vol, rate) { if (vol != null) this.vol = vol; if (rate != null) this.rate = rate; return this; }
    start() {
      const f = pick(this.L); if (!f || !ctx) return;
      this.f = f;
      const src = ctx.createBufferSource(), gn = ctx.createGain();
      src.buffer = f.buf; src.loop = true; src.loopStart = f.s0; src.loopEnd = f.s1 > f.s0 + 0.05 ? f.s1 : f.buf.duration;
      gn.gain.value = 0; src.connect(gn);
      let tail = gn;
      if (ctx.createStereoPanner) { this.pan = ctx.createStereoPanner(); gn.connect(this.pan); tail = this.pan; }
      tail.connect(bus[this.busK] || bus.sfx);
      src.start(0, f.s0 + Math.random() * Math.max(0, src.loopEnd - f.s0 - 0.05));
      this.src = src; this.gn = gn; this.tail = tail;
    }
    // per tick: gain / pitch / pan glide toward the targets (setTargetAtTime: no zipper noise)
    tick() {
      if (this.dead || !ctx || ctx.state !== 'running') return;
      if (!this.src) { if (this.vol > 0.001) this.start(); if (!this.src) return; }
      let g = this.L[1] * this.vol, pan = 0;
      if (this.pos) { const P = place(this.pos.x, this.pos.y, this.pos.z, this.ref); g *= P.g; pan = P.pan; }
      if (Math.abs(g - this.cur) > 0.002) { this.gn.gain.setTargetAtTime(g, ctx.currentTime, this.tc); this.cur = g; }
      if (Math.abs(this.src.playbackRate.value - this.rate) > 0.005) this.src.playbackRate.setTargetAtTime(this.rate, ctx.currentTime, 0.08);
      if (this.pan && Math.abs(this.pan.pan.value - pan) > 0.02) this.pan.pan.setTargetAtTime(pan, ctx.currentTime, 0.1);
      if (this.f) this.f.used = AF.clock.t;
    }
    stop(fade = 0.25) {
      if (this.dead) return; this.dead = true; loops.delete(this); A.stats.loops = loops.size;
      if (this.src && ctx) { const s = this.src, t = this.tail; this.gn.gain.setTargetAtTime(0, ctx.currentTime, fade / 3); setTimeout(() => { try { s.stop(); t.disconnect(); } catch (e) { /* gone */ } }, fade * 1000 + 60); }
    }
  }
  A.loop = (id, o) => (LIB[id] ? new Loop(id, o) : null);
  // a loop owned by a named slot: created on first use, stopped when its volume stays 0 for a while
  const named = new Map();
  A.holds = named;
  A.hold = (key, id, vol, rate, x, y, z) => {
    let h = named.get(key);
    if (vol <= 0.001) { if (h && (h.idle = (h.idle || 0) + 1) > 30) { h.stop(); named.delete(key); } else if (h) h.set(0); return h; }
    if (!h || h.dead || h.id !== id) { if (h) h.stop(); h = A.loop(id); if (!h) return null; h.owned = true; named.set(key, h); }
    h.idle = 0; h.set(vol, rate); if (x != null) h.at(x, y, z); else h.pos = null;
    return h;
  };
  A.release = (key) => { const h = named.get(key); if (h) { h.stop(); named.delete(key); } };

  // ---------------------------------------------------------------- where is the listener? (zones in plan metres)
  const P = AF.PLAN, inR = (x, z, r) => x >= r[0] && x <= r[2] && z >= r[1] && z <= r[3];
  const ZR = { city: [-300, -260, 460, 212], park: [P.park.x0, P.park.z0, P.park.x1, P.park.z1], zoo: [P.west.zoo.x0, P.west.zoo.z0, P.west.zoo.x1, P.west.zoo.z1],
    terminal: P.west.air.terminal, air: [P.west.air.x0, P.west.air.z0, P.west.air.x1, P.west.air.z1], station: [173, 10, 300, 72], boardwalk: [-300, 170, -140, 272],
    bank: [10, -147, 72, -88], colony: [-436, -230, -300, -6] };
  const isl = P.world.island;
  const wetAt = (x, z) => { try { return AF.W.groundY(x, z) < P.harbour.waterY - 0.3; } catch (e) { return false; } };
  // share of sea within ~45 m (8 probes, refreshed as the listener moves)
  const SEA = { x: 1e9, z: 1e9, k: 0 };
  const seaNear = (x, z) => {
    if (Math.abs(x - SEA.x) + Math.abs(z - SEA.z) < 12) return SEA.k;
    let n = 0; for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; if (wetAt(x + Math.cos(a) * 45, z + Math.sin(a) * 45)) n++; }
    SEA.x = x; SEA.z = z; SEA.k = wetAt(x, z) ? 1 : n / 8; return SEA.k;
  };
  const W8 = { city: 0, crowd: 0, park: 0, sea: 0, harbour: 0, wind: 0, night: 0, forest: 0, carnival: 0, casino: 0, airport: 0, room: 0, jungle: 0, frogs: 0 };
  const BED_ID = { city: 'amb_city', crowd: 'amb_crowd', park: 'amb_park', sea: 'amb_sea', harbour: 'amb_harbour', wind: 'amb_wind', night: 'amb_night', forest: 'amb_forest', carnival: 'amb_carnival', casino: 'amb_casino', airport: 'amb_airport', room: 'amb_room', jungle: 'amb_jungle', frogs: 'amb_frogs' };
  const beds = new Map();
  let crowdN = 0;
  const countCrowd = (x, z) => {
    let n = 0; const C = AF.peopleKit && AF.peopleKit.crowd;
    if (C) for (const w of C.walkers) if (w.act && (w.x - x) ** 2 + (w.z - z) ** 2 < 900) n++;
    const WK = AF.walkers; if (WK && WK.near) n += WK.near(x, z, 30).length;
    return n;
  };
  const weigh = () => {
    const x = LS.x, z = LS.z, night = AF.time.night || 0, day = 1 - night;
    let gy = 0; try { gy = AF.W.groundY(x, z); } catch (e) { gy = 0; }
    const alt = Math.max(0, LS.y - Math.max(gy, P.harbour.waterY)), lowK = 1 - AF.smooth(25, 140, alt);
    const indoor = AF.mode === 'walk' ? AF.PL.walk.indoor || 0 : 0, out = 1 - indoor * 0.85;
    const city = inR(x, z, ZR.city) ? 1 : 0, sea = seaNear(x, z), ship = AF.liner && AF.liner.where ? AF.liner.where(x, LS.y, z) : '';
    for (const k in W8) W8[k] = 0;
    crowdN = countCrowd(x, z);
    W8.city = city * (1 - sea * 0.7) * lowK * out * (0.55 + 0.45 * day) * (inR(x, z, ZR.park) ? 0.35 : 1);
    W8.crowd = Math.min(1, crowdN / 14) * lowK * (indoor > 0.5 ? 0.6 : 1);
    W8.park = (inR(x, z, ZR.park) || inR(x, z, ZR.colony) ? 1 : 0) * day * lowK * out;
    W8.sea = sea * AF.lerp(1, 0.6, 1 - lowK) * out * (ship === 'casino' ? 0 : 1);
    W8.harbour = (z > 150 && z < 320 && x > -300 && x < 300 ? 1 : 0) * day * lowK * out * Math.max(0.4, sea);
    W8.wind = AF.clamp(Math.max(1 - lowK, !city && !inR(x, z, ZR.zoo) ? 0.5 * day : 0, ship && ship !== 'casino' ? 0.4 : 0), 0, 1) * out;
    W8.night = night * (city && !inR(x, z, ZR.park) ? 0.25 : 1) * lowK * out * (sea > 0.6 ? 0.3 : 1);
    W8.forest = !city && !(Math.hypot((x - isl.cx) / isl.rx, (z - isl.cz) / isl.rz) < 1.2) && sea < 0.4 && AF.outland && AF.outland.forestDensity ? AF.clamp(AF.outland.forestDensity(x, z) * 1.6, 0, 1) * day * lowK * out : 0;
    const cd = Math.hypot(x + 195, z - 196);
    W8.carnival = (1 - AF.smooth(18, 75, cd)) * lowK * (indoor > 0.5 ? 0.4 : 1);
    W8.casino = ship === 'casino' ? 1 : 0;
    W8.airport = inR(x, z, ZR.terminal) && LS.y < 12 ? 1 : 0;
    W8.room = Math.max(indoor, ship === 'inside' ? 1 : 0) * (W8.casino || W8.airport ? 0.2 : 1);
    W8.jungle = (inR(x, z, ZR.zoo) ? 0.8 : Math.hypot((x - isl.cx) / isl.rx, (z - isl.cz) / isl.rz) < 1.1 ? 0.7 * day : 0) * lowK * out;
    const lk = P.lake, nearLake = Math.hypot((x - lk.cx) / (lk.rx + 40), (z - lk.cz) / (lk.rz + 40)) < 1 || Math.hypot(x - P.pond.cx, z - P.pond.cz) < P.pond.r + 35;
    W8.frogs = nearLake ? night * lowK : 0;
    A.zone = ship ? 'ship:' + ship : inR(x, z, ZR.zoo) ? 'zoo' : inR(x, z, ZR.air) ? 'airfield' : inR(x, z, ZR.park) ? 'park' : city ? 'city' : 'outland';
    ambLP.frequency.setTargetAtTime(AF.lerp(18000, 900, indoor * (W8.casino ? 0 : 1)), ctx.currentTime, 0.4);
  };
  // beds crossfade over a few seconds (zone edges, doors, time of day): each weight eases toward its target, then the loop glides
  const SMW = {};
  const bedTick = (dt) => {
    let n = 0; const a = 1 - Math.exp(-dt / 1.3);
    for (const k in W8) {
      const s = SMW[k] = (SMW[k] || 0) + (W8[k] - (SMW[k] || 0)) * a, w = s < 0.005 ? 0 : s; let b = beds.get(k);
      if (w > 0.02 && !b) { b = A.loop(BED_ID[k], { bus: 'amb' }); b.owned = true; beds.set(k, b); }
      if (!b) continue;
      b.set(w); b.tick(); if (w > 0.02) n++;
      if (w <= 0.02 && (b.zero = (b.zero || 0) + 1) > 60) { b.stop(1); beds.delete(k); } else if (w > 0.02) b.zero = 0;
    }
    A.stats.beds = n;
  };

  // ---------------------------------------------------------------- sprinkles: one-shots at points around the listener, by zone
  const SP = { t: 3, pa: 20, zoo: 4, ship: 30 };
  const around = (r0, r1) => { const a = Math.random() * Math.PI * 2, r = r0 + Math.random() * (r1 - r0); return { x: LS.x + Math.cos(a) * r, y: LS.y, z: LS.z + Math.sin(a) * r }; };
  const ZOO_SND = { lion: 'an_lion', lioness: 'an_lion', tiger: 'an_tiger', elephant: 'an_elephant', monkey: 'an_monkey', gorilla: 'an_gorilla', flamingo: 'an_flamingo', hippo: 'an_hippo', penguin: 'an_penguin', bear: 'an_bear' };
  const WILD_SND = { sheep: 'an_sheep', cow: 'an_cow', hawk: 'an_hawk' };
  const sprinkle = (dt) => {
    const x = LS.x, z = LS.z, night = AF.time.night || 0, hour = AF.time.hours || 12;
    // the zoo: the nearest awake animal with a voice, every few seconds
    if (inR(x, z, ZR.zoo) && AF.zoo && AF.zoo.list && (SP.zoo -= dt) <= 0) {
      SP.zoo = 4 + Math.random() * 7; let best = null, bd = 60 * 60;
      for (const an of AF.zoo.list) { const s = ZOO_SND[an.sp && an.sp.id]; if (!s || an.state === 'sleep') continue; const d = (an.x - x) ** 2 + (an.z - z) ** 2; if (d < bd && Math.random() < 0.6) { bd = d; best = an; } }
      if (best) A.play(ZOO_SND[best.sp.id], { x: best.x, y: best.y + 1.5, z: best.z });
    }
    if ((SP.t -= dt) > 0) return;
    SP.t = 2.5 + Math.random() * 4;
    const z8 = W8;
    if (z8.harbour > 0.2 && Math.random() < 0.55) { const p = around(15, 60); A.play('an_gull', { x: p.x, y: LS.y + 10, z: p.z }); }
    if (z8.sea > 0.5 && Math.random() < 0.08) { const L = AF.harbour && AF.harbour.ships; const s = L && L[(Math.random() * L.length) | 0]; if (s) A.play('ship_horn', { x: s.x, y: 10, z: s.z }); }
    if (z8.city > 0.3) {
      if (Math.random() < 0.18) { const p = around(20, 70); A.play('horn', p); }
      if (Math.random() < 0.12 && !inR(x, z, [-100, -160, 160, 80])) { const p = around(15, 50); A.play('an_dog', p); }
      if (Math.random() < 0.08) { const p = around(10, 30); A.play('an_pigeon', p); }
    }
    if (z8.park > 0.3) { const lk = P.lake; if (Math.hypot(x - lk.cx, z - lk.cz) < 80 && Math.random() < 0.5) A.play('an_duck', { x: lk.cx + (Math.random() - 0.5) * lk.rx, y: 0, z: lk.cz + (Math.random() - 0.5) * lk.rz }); else if (Math.random() < 0.3) A.play('an_crow', around(15, 40)); }
    if (night > 0.5 && (z8.park > 0 || z8.forest > 0 || (!z8.city && z8.wind > 0)) && Math.random() < 0.2) A.play('an_owl', around(20, 60));
    if (!z8.city && !inR(x, z, ZR.zoo) && z8.sea < 0.5) {
      // farmland + wild herds: the nearest grazing animal answers now and then
      const WD = AF.wild;
      if (WD && WD.herds && Math.random() < 0.5) { let best = null, bd = 90 * 90; for (const h of WD.herds) { const m = h.members && h.members[0]; if (!m || !WILD_SND[h.kind]) continue; const d = (m.x - x) ** 2 + (m.z - z) ** 2; if (d < bd) { bd = d; best = { h, m }; } } if (best) A.play(WILD_SND[best.h.kind], { x: best.m.x, y: LS.y, z: best.m.z }); }
      if (hour > 5 && hour < 8.5 && Math.random() < 0.2) A.play('an_rooster', around(40, 120));
    }
    const ANI = AF.animals;
    if (ANI && Math.random() < 0.25) for (const a of ANI) { const r = a.root || a.mesh, ax = a.x ?? (r && r.position.x), az = a.z ?? (r && r.position.z); if (ax == null || (ax - x) ** 2 + (az - z) ** 2 > 900) continue; A.play(a.species === 'horse' ? 'an_horse' : a.type === 'grazer' ? 'an_horse' : 'an_dog', { x: ax, y: LS.y, z: az }); break; }
    if (z8.carnival > 0.4 && Math.random() < 0.15) A.play('pa_carnival', { x: -230, y: 2, z: 190 });
    if (z8.carnival > 0.3 && Math.random() < 0.2) A.play(Math.random() < 0.5 ? 'scream_f' : 'cheer', { x: -270, y: 8, z: 234, vol: 0.5 });
    // public address: the airport terminal, the ferry piers, Union Terminal, the liner, the bank hall
    if ((SP.pa -= 4) <= 0) {
      SP.pa = 45 + Math.random() * 40;
      if (inR(x, z, ZR.air) && LS.y < 20) A.play('pa_air', { x: -490, y: 6, z: 58, ref: 40 });
      else if (Math.hypot(x, z - 262) < 70 || Math.hypot(x + 20, z - 424) < 70) A.play('pa_ferry', { x: Math.abs(z - 262) < 80 ? 0 : -20, y: 4, z: Math.abs(z - 262) < 80 ? 262 : 424 });
      else if (inR(x, z, ZR.station)) A.play('pa_station', { x: 210, y: 8, z: 40, ref: 40 });
      else if (inR(x, z, ZR.bank) && LS.y < 12) A.play('pa_bank', { x: 40, y: 5, z: -118 });
      else if (AF.liner && AF.liner.where && AF.liner.where(x, LS.y, z)) A.play('pa_ship', { x: LS.x, y: LS.y + 3, z: LS.z, ref: 40 });
      else SP.pa = 8;
    }
  };

  // ---------------------------------------------------------------- vehicles + movement around the listener
  const VT = { start: false, skidT: 0, flights: new Map(), stepT: 0, stepSide: 0, fallT: 0, prevMode: '' };
  const surface = () => {
    const p = AF.player; if (!p) return 'step_concrete';
    try {
      const W = AF.W, bx = W.bx(p.x), bz = W.bz(p.z);
      if (bx < 0 || bz < 0 || bx >= W.NX || bz >= W.NZ) return AF.liner && AF.liner.where && AF.liner.where(p.x, p.y, p.z) ? 'step_wood' : 'step_grass';
      // a voxel floor under the feet, else the terrain column's own colour
      const c = W.get(bx, W.by(p.y - 0.1), bz) || (W.C ? W.C[bx * W.NZ + bz] : 0);
      if (!c) return 'step_concrete';
      const pv = AF.PAL.mat[c * 4 + 2], top = Math.floor(pv / 32);
      return top === 10 ? 'step_grass' : top === 5 || top === 17 || top === 11 ? 'step_wood' : top === 18 ? 'step_carpet' : 'step_concrete';
    } catch (e) { return 'step_concrete'; }
  };
  const moves = (dt) => {
    const mode = AF.mode, VV = AF.vehicles;
    // the player's car: idle + running layers crossfade with speed, the pitch follows the revs
    const car = mode === 'drive' && VV && VV.player;
    if (car) {
      const vmax = (car.type.vmax || 27) * (VV.SPEED_K || 1), k = AF.clamp(Math.abs(car.v) / vmax, 0, 1), I = AF.input;
      const thr = I.key('KeyW') || I.key('ArrowUp') || (I.stick && I.stick.y > 0.2) ? 1 : 0, bike = car.type.kind === 'bike';
      if (!VT.start) { VT.start = true; A.play('door_car', { vol: bike ? 0 : 1 }); A.play('eng_start', { vol: 0.8 }); }
      A.hold('car-idle', 'eng_idle', (1 - AF.smooth(0.05, 0.3, k)) * 0.9, 0.9 + k * 0.4);
      A.hold('car-run', 'eng_run', AF.smooth(0.02, 0.25, k) * (0.55 + 0.45 * thr), 0.7 + k * 0.85 + thr * 0.08);
      const slip = Math.abs(car.steer || 0) * Math.abs(car.v);
      if ((VT.skidT -= dt) <= 0 && (slip > 9 || (I.key('Space') && Math.abs(car.v) > 12))) { VT.skidT = 1.6; A.play('skid', { x: car.x, y: car.y, z: car.z }); }
      if (I.hit('KeyH')) A.play(bike ? 'bike_bell' : 'horn', { x: car.x, y: car.y, z: car.z });
    } else {
      if (VT.start && mode !== 'drive') { VT.start = false; A.play('door_car', { vol: 0.8 }); }
      A.hold('car-idle', 'eng_idle', 0); A.hold('car-run', 'eng_run', 0);
    }
    // planes, jet skis, the ferry
    const pl = mode === 'fly' && AF.planes && AF.planes.cur;
    A.hold('plane', 'prop_loop', pl && pl.engine ? 0.5 + pl.throttle * 0.5 : 0, pl ? 0.75 + pl.throttle * 0.55 + Math.max(0, pl.v) * 0.004 : 1);
    const ski = mode === 'jetski' && AF.island && AF.island.jetski && AF.island.jetski.cur;
    // jet ski: revs follow the throttle + speed (and scream when the jet leaves the water), the hull hisses through the water at speed
    const rpm = ski ? (ski.rpm != null ? ski.rpm : Math.min(1, Math.abs(ski.v) / 14)) : 0, wake = ski && !(ski.air > 0) ? AF.smooth(2, 22, Math.abs(ski.v)) : 0;
    A.hold('ski', 'jetski_loop', ski ? 0.32 + rpm * 0.5 + (ski.load || 0) * 0.18 : 0, ski ? 0.7 + rpm * 0.62 : 1);
    A.hold('ski-wake', 'ski_spray', wake * 0.85, 0.85 + wake * 0.35);
    A.hold('ski-wind', 'wind_loop', ski ? AF.smooth(12, 26, Math.abs(ski.v)) * 0.35 : 0, 0.9 + AF.smooth(12, 26, ski ? Math.abs(ski.v) : 0) * 0.3);
    A.hold('ferry', 'boat_loop', mode === 'ferry-ride' ? 0.7 : 0, 0.9);
    // rushing air: freefall roars, the open canopy flaps, an open cockpit hisses (one wind family, crossfaded by speed)
    const sky = mode === 'skydive', fp = AF.view && AF.view.fp && AF.view.fp();
    if (sky && VT.prevMode !== 'skydive') { VT.fallT = 0; VT.chute = false; }
    if (sky) { VT.fallT += dt; const rig = VT.rig || (VT.rig = AF.scene.getObjectByName('parachute') || null); if (rig && rig.visible && !VT.chute) { VT.chute = true; A.play('chute'); } }
    else VT.chute = false;
    const fall = sky && !VT.chute, canopy = sky && VT.chute;
    A.hold('wind', 'wind_loop', mode === 'fly' ? AF.smooth(12, 50, LS.speed) * (fp ? 1 : 0.7) : canopy ? 0.25 + AF.smooth(4, 12, LS.speed) * 0.3 : fall ? 0.15 + AF.smooth(12, 50, LS.speed) * 0.5 : 0, 0.8 + AF.smooth(20, 60, LS.speed) * 0.4);
    A.hold('fall', 'fall_loop', fall ? 0.25 + AF.smooth(8, 50, LS.speed) * 0.75 : 0, 0.8 + AF.smooth(12, 55, LS.speed) * 0.45);
    A.hold('canopy', 'canopy_loop', canopy ? 0.55 + AF.smooth(3, 10, LS.speed) * 0.45 : 0, 0.9 + AF.smooth(3, 10, LS.speed) * 0.2);
    if (VT.prevMode === 'skydive' && mode === 'walk' && AF.player && AF.player.z > 206 && AF.player.y < -0.5) A.play('splash');
    VT.prevMode = mode;
    // footsteps (wading where the feet are under water)
    if (mode === 'walk' && AF.player && AF.PL.walk) {
      const sp = AF.PL.walk.speed || 0, body = AF.player.body;
      if (sp > 1.2 && body && body.onGround) {
        VT.stepT -= dt * sp;
        if (VT.stepT <= 0) { VT.stepT = sp > 7 ? 2.6 : 2.0; VT.stepSide ^= 1; A.play(wetFeet(AF.player) ? 'step_water' : surface(), { vol: sp > 7 ? 1.25 : 1, rate: 0.92 + Math.random() * 0.16 }); }
      } else VT.stepT = 0.4;
    }
  };
  const wetFeet = (p) => {
    const y = p.y - 0.05;
    for (const q of P.pools) if (p.x > q.x0 && p.x < q.x1 && p.z > q.z0 && p.z < q.z1 && y < q.y) return true;
    const O = AF.outland;
    for (const w of (O && O.waters) || WATERS0) if (y < w.waterY && ((p.x - w.cx) / w.rx) ** 2 + ((p.z - w.cz) / w.rz) ** 2 < 1) return true;
    if (y < P.harbour.waterY && (p.z > 200 || AF.W.col(p.x, p.z) < 0)) return true;
    const R = O && O.riverInfo && O.riverInfo(p.x, p.z);
    return !!(R && R.d < R.hw && y < R.y);
  };
  // 15 Hz: what is moving around the listener
  const scan = () => {
    const VV = AF.vehicles, CB = AF.combat, H = CB && CB.heli;
    // traffic passing: the two nearest moving cars carry their own engine; the nearest squad car's siren, the nearest burning wreck
    if (VV && VV.cars) {
      let a = null, ad = 900, b = null, bd = 900, s = null, sd = 160 * 160, f = null, fd = 60 * 60;
      for (const c of VV.cars) {
        if (c.active === false) continue;
        const d = (c.x - LS.x) ** 2 + (c.z - LS.z) ** 2;
        if (c.squad && d < sd && CB && CB.stars) { sd = d; s = c; }
        if ((c.burnT > 0 || (c.dead && c.smokeT > 10)) && d < fd) { fd = d; f = c; }
        if (c.player || Math.abs(c.v || 0) < 2 || d >= bd) continue;
        if (d < ad) { b = a; bd = ad; a = c; ad = d; } else { b = c; bd = d; }
      }
      A.hold('traffic-a', 'eng_run', a ? 0.5 : 0, a ? 0.7 + Math.min(0.6, Math.abs(a.v) / 30) : 1, a && a.x, a && a.y + 0.6, a && a.z);
      A.hold('traffic-b', 'eng_idle', b ? 0.6 : 0, b ? 0.9 + Math.min(0.5, Math.abs(b.v) / 30) : 1, b && b.x, b && b.y + 0.6, b && b.z);
      A.hold('siren', 'siren_loop', s ? 1 : 0, 1, s && s.x, s && s.y + 1.5, s && s.z);
      A.hold('fire', 'fire_loop', f ? 1 : 0, 1, f && f.x, f && f.y + 1, f && f.z);
    }
    // the police autogyro
    A.hold('heli', 'heli_loop', H && H.on ? 1 : 0, 1, H && H.x, H && H.y, H && H.z);
    // airliners: a fly-by recording as each one passes within ~220 m low and fast
    const T = AF.airTraffic;
    if (T && T.visible) for (const fl of T.flights) {
      if (!fl.enabled) continue;
      const p = fl.pose, d = Math.hypot(p.x - LS.x, p.y - LS.y, p.z - LS.z), was = VT.flights.get(fl) || 1e9;
      if (d < 220 && was >= 220 && (fl.phase === 'takeoff' || fl.phase === 'climb' || fl.phase === 'arrival' || fl.phase === 'go-around' || fl.phase === 'rollout')) A.play('jet_pass', { x: p.x, y: p.y, z: p.z });
      VT.flights.set(fl, d);
    }
  };
  // 4 Hz: water and machines near the listener (positional loops: they pan and fade with distance on their own)
  const FALLS = { pts: null }, LAP = { x: 0, y: 0, z: 0, d: 0 }, FOUNTAINS = [P.parkFeatures.fountain, [-41, -44]], WATERS0 = [P.lake];
  // built once behind the loader (the lazy first build scanned every river point mid-game)
  const buildFalls = (O) => {
    FALLS.pts = [{ x: -459.5, y: 1.5, z: -153, v: 0.35, ref: 4 }];
    for (const R of O.rivers) for (let i = 1; i < R.pts.length; i++) {
      const a = R.pts[i - 1], b = R.pts[i], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      if ((R.levels[i - 1] - R.levels[i]) / L <= 0.2) continue;
      const fx = (a[0] + b[0]) / 2, fz = (a[1] + b[1]) / 2;
      if (!FALLS.pts.some((f) => Math.hypot(f.x - fx, f.z - fz) < 20)) FALLS.pts.push({ x: fx, y: (R.levels[i - 1] + R.levels[i]) / 2, z: fz, v: 1, ref: 20 });
    }
  };
  AF.on('preloaded', () => { const O = AF.outland; if (!FALLS.pts && O && O.rivers && O.rivers.length) try { buildFalls(O); } catch (e) { AF.warnOnce('audio falls', e); } });
  // the nearest point on an elliptical shoreline, kept in LAP when closer than LAP.d
  const shore = (x, z, cx, cz, rx, rz, wy) => {
    const ex = (x - cx) / rx, ez = (z - cz) / rz, e = Math.hypot(ex, ez); if (e < 0.01) return;
    const px = cx + ex / e * rx, pz = cz + ez / e * rz, d = Math.hypot(px - x, pz - z);
    if (d < LAP.d) { LAP.d = d; LAP.x = px; LAP.y = wy; LAP.z = pz; }
  };
  const env = () => {
    const x = LS.x, y = LS.y, z = LS.z, O = AF.outland, ZOO = P.west.zoo;
    // brooks + rivers: the zoo's Solace Brook follows the listener along its bed; outland rivers by distance to the bank
    let sv = 0, sx = null, sz = 0;
    if (ZOO.brookZ && x > -664 && x < -450 && Math.abs(z + 153) < 45) { sx = AF.clamp(x, -650, -458); sz = ZOO.brookZ(sx); sv = 1; }
    else if (O && O.riverInfo) { const R = O.riverInfo(x, z); if (R.d < R.hw + 45) sv = (1 - AF.smooth(R.hw, R.hw + 45, R.d)) * (1 - AF.smooth(6, 45, y - R.y)); }
    A.hold('stream', 'stream_loop', sv, 1, sx, 0, sz);
    // falling water: every steep river reach (where 49-outland draws white water) and the zoo's spring grotto
    if (!FALLS.pts && O && O.rivers && O.rivers.length) buildFalls(O);
    let fb = null, fbd = 1e9;
    for (const f of FALLS.pts || []) { const d = Math.hypot(f.x - x, f.z - z); if (d < f.ref * 9 && d < fbd) { fbd = d; fb = f; } }
    const fh = A.hold('falls', 'falls_loop', fb ? fb.v : 0, 1, fb && fb.x, fb && fb.y, fb && fb.z); if (fh && fb) fh.ref = fb.ref;
    // fountains: the park's and the civic plaza's
    let fo = null, fod = 60; for (const f of FOUNTAINS) { const d = Math.hypot(f[0] - x, f[1] - z); if (d < fod) { fod = d; fo = f; } }
    A.hold('fountain', 'fountain_loop', fo ? 1 : 0, 1, fo && fo[0], 1.5, fo && fo[1]);
    // lake shores: the nearest point on the nearest shoreline within ~30 m
    LAP.d = 30;
    for (const w of (O && O.waters) || WATERS0) shore(x, z, w.cx, w.cz, w.rx, w.rz, w.waterY);
    shore(x, z, P.pond.cx, P.pond.cz, P.pond.r, P.pond.r, 0.25);
    A.hold('lap', 'lap_loop', LAP.d < 30 ? 1 : 0, 1, LAP.x, LAP.y, LAP.z);
    // farm machines working the fields (each kind's nearest), the streetcar, the harbour ferry going by
    const FM = AF.farms, now = AF.clock.t; let cb = null, cd = 100, tb = null, td = 80;
    if (FM && FM.movers) for (const m of FM.movers) {
      if (m.at == null || now - m.at > 1) continue;
      const d = Math.hypot(m.x - x, m.z - z);
      if (m.kind === 'combine') { if (d < cd) { cd = d; cb = m; } } else if (d < td) { td = d; tb = m; }
    }
    A.hold('combine', 'combine_loop', cb ? 1 : 0, 1, cb && cb.x, cb && cb.y + 2, cb && cb.z);
    A.hold('tractor', 'tractor_loop', tb ? 1 : 0, 1, tb && tb.x, tb && tb.y + 1.5, tb && tb.z);
    const TR = AF.train; let tq = null, tqd = 90;
    if (TR && TR.defs) for (const dd of TR.defs) { const o = dd.obj && dd.obj.position; if (!o) continue; const d = Math.hypot(o.x - x, o.z - z); if (d < tqd) { tqd = d; tq = o; } }
    const tsp = TR ? Math.abs(TR.speed || 0) : 0;
    A.hold('tram', 'tram_loop', tq ? 0.25 + Math.min(0.75, tsp / 9) : 0, 0.85 + Math.min(0.35, tsp / 30), tq && tq.x, tq && tq.y + 1, tq && tq.z);
    const FY = AF.harbour && AF.harbour.ferry, fm = FY && FY.mesh && FY.mesh.position, fyd = fm ? Math.hypot(fm.x - x, fm.z - z) : 1e9;
    A.hold('ferry-pass', 'boat_loop', fm && fyd < 120 && AF.mode !== 'ferry-ride' ? 0.8 : 0, 0.85, fm && fm.x, 1, fm && fm.z);
  };

  // ---------------------------------------------------------------- tick (positional loops 15 Hz, beds + sprinkles + water 4 Hz)
  let slowT = 0, fastT = 0, reapT = 0;
  AF.onTick('audio', 965, (dt) => {
    if (!ctx || !A.on || ctx.state !== 'running' || !AF.ready) return;
    listen(dt);
    moves(dt);
    if ((fastT += dt) >= 1 / 15) { fastT = 0; scan(); for (const l of loops) if (!l.owned) l.tick(); for (const h of named.values()) h.tick(); }
    if ((slowT += dt) >= 0.25) { const s = slowT; slowT = 0; weigh(); bedTick(s); sprinkle(s); env(); }
    if ((reapT += dt) > 20) { reapT = 0; reap(); }
  });

  // ---------------------------------------------------------------- settings row: Sound on / off + a volume slider (pause menu)
  AF.on('ready', () => {
    const stack = document.querySelector('#m-menu .stack'); if (!stack) return;
    const row = document.createElement('div'); row.className = 'row';
    row.innerHTML = '<label>Sound</label><div class="seg"><button data-s="1">On</button><button data-s="0">Off</button></div><input data-k="vol" type="range" min="0" max="1" step="0.05" aria-label="Volume">';
    const sync = () => { row.querySelectorAll('button').forEach((b) => b.classList.toggle('on', (b.dataset.s === '1') === A.on)); row.querySelector('input').value = String(A.vol); };
    row.addEventListener('click', (e) => { const b = e.target.closest('[data-s]'); if (b) { A.setOn(b.dataset.s === '1'); if (AF.sfx && AF.sfx.set) AF.sfx.set(A.on); sync(); } e.stopPropagation(); });
    row.querySelector('input').addEventListener('input', (e) => { A.setVolume(+e.target.value); e.stopPropagation(); });
    stack.parentNode.insertBefore(row, stack); sync();
  });

  // ================================================================ spoken lines + heist music (OWNER: audio)
  // AF.audio.voice(id, { x, y, z, vol, ref, radio }) -> seconds   a line from AF.VO (assets/vo/<id>.mp3, Kokoro TTS via tools/vo-build.mjs).
  //   Channels: radio (band-passed, squelch clicks), plain (non-positional), positional (x/y/z; up to 3 barks overlap). A new radio or
  //   plain line replaces the one on its channel. Returns the length from assets/vo/index.json (fetched at unlock; before that an
  //   estimate from the text), 0 for an unknown id; the duration is returned even while the sound is off (subtitles time on it).
  // AF.audio.voiceLen(id) -> seconds · AF.audio.voicePreload([ids]) -> Promise (fetch + decode ahead) · AF.audio.stopVoice(channel?)
  // AF.audio.music(id | null, { fade = 2, vol = 1 })   crossfades heist loops (assets/music/<id>.mp3, tools/music-build.mjs), fetched
  //   on first request; muted with Sound off; its own gain (AF.audio.musicVol, menu slider) ducked under speech, as are the beds.
  // Decoded lines live in a small LRU (reaped after 90 s unused); music keeps at most the playing + previous track decoded.
  {
    const VO_BASE = 'assets/vo/', MU_BASE = 'assets/music/';
    let voMan = null, voManP = null, muMan = null;
    A.musicVol = 0.6;
    try { const v = localStorage.getItem('portSolace.musicVol'); if (v !== null && +v >= 0 && +v <= 1) A.musicVol = +v; } catch (e) { /* storage blocked */ }
    const getJSON = (u) => fetch(u).then((r) => (r.ok ? r.json() : {})).catch(() => ({}));
    const loadMan = () => voManP || (voManP = Promise.all([getJSON(VO_BASE + 'index.json'), getJSON(MU_BASE + 'index.json')]).then(([v, m]) => { voMan = v || {}; muMan = m || {}; return voMan; }));
    const onUnlock = () => loadMan();
    for (const ev of ['pointerdown', 'keydown', 'touchend']) addEventListener(ev, onUnlock, { capture: true, once: true });
    const lineOf = (id) => (AF.VO && AF.VO[id]) || null;
    A.voiceLen = (id) => {
      if (voMan && voMan[id] != null) return voMan[id];
      const L = lineOf(id); if (!L) return 0;
      return Math.max(0.8, Math.round((String(L[2]).length / 14.5 + 0.3) * 100) / 100);
    };
    // ---- graph: voice lines -> bus.voice; music tracks -> mus (setting) -> duck -> master
    let mus = null, musDuck = null, radioCurve = null, squelch = null;
    const graph = () => {
      if (!make()) return null;
      if (!mus) {
        mus = ctx.createGain(); mus.gain.value = A.musicVol; musDuck = ctx.createGain(); musDuck.gain.value = 1; mus.connect(musDuck).connect(master);
        radioCurve = new Float32Array(1024); for (let i = 0; i < 1024; i++) { const x = i / 511.5 - 1; radioCurve[i] = Math.tanh(2.4 * x) / Math.tanh(2.4); }
        // the squelch: 70 ms of decaying noise, band-passed on the way out like the line itself
        const n = Math.round(ctx.sampleRate * 0.07); squelch = ctx.createBuffer(1, n, ctx.sampleRate);
        const d = squelch.getChannelData(0); let s = 0x9e37; for (let i = 0; i < n; i++) { s = (s * 1103515245 + 12345) & 0x7fffffff; d[i] = (s / 0x3fffffff - 1) * Math.exp(-i / (n * 0.28)) * (i < 24 ? i / 24 : 1); }
      }
      return ctx;
    };
    // ---- decoded line cache (LRU)
    const vo = new Map();           // id -> { buf, p, used, bytes }
    const VO_KEEP = AF.MOBILE ? 16 : 32;
    const loadVo = (id) => {
      let f = vo.get(id); if (f) { f.used = AF.clock.t; return f.p; }
      if (!graph()) return Promise.resolve(null);
      f = { buf: null, p: null, used: AF.clock.t, bytes: 0 }; vo.set(id, f);
      f.p = fetch(VO_BASE + encodeURIComponent(id) + '.mp3').then((r) => { if (!r.ok) throw new Error(r.status + ' ' + id); return r.arrayBuffer(); }).then(decode).then((buf) => {
        f.buf = buf; f.bytes = buf.length * buf.numberOfChannels * 4; A.stats.bytes += f.bytes; return buf;
      }).catch((e) => { AF.warnOnce('voice load ' + id, e); vo.delete(id); return null; });
      if (vo.size > VO_KEEP) { let old = null; for (const [k, g] of vo) if (g.buf && !playing(k) && (!old || g.used < old[1].used)) old = [k, g]; if (old) { A.stats.bytes -= old[1].bytes; vo.delete(old[0]); } }
      return f.p;
    };
    A.voicePreload = (ids) => { if (!A.on || !graph()) return Promise.resolve([]); loadMan(); return Promise.all((ids || []).filter(lineOf).map(loadVo)); };
    // ---- playing lines: { id, ch, src, gn, pan, nodes, pos, ref, vol, k, end, sq }
    const lines = [];
    const playing = (id) => { for (const l of lines) if (l.id === id) return true; return false; };
    const kill = (l, fade) => {
      const i = lines.indexOf(l); if (i >= 0) lines.splice(i, 1);
      voices.delete(l); A.stats.voices = voices.size;
      if (!l.src || !ctx) { l.dead = true; return; }
      const t = ctx.currentTime, f = fade || 0.06;
      try { l.gn.gain.cancelScheduledValues(t); l.gn.gain.setTargetAtTime(0, t, f / 3); l.src.stop(t + f + 0.02); if (l.sq) l.sq.stop(t + 0.001); } catch (e) { /* ended */ }
      if (l.ch === 'radio' && !l.ended) chirp(t + 0.02, 0.25);
    };
    A.stopVoice = (ch) => { for (let i = lines.length - 1; i >= 0; i--) if (!ch || lines[i].ch === ch) kill(lines[i], 0.08); };
    const chirp = (t, g) => {
      if (!squelch || !ctx) return null;
      try {
        const s = ctx.createBufferSource(), hp = ctx.createBiquadFilter(), gn = ctx.createGain();
        s.buffer = squelch; hp.type = 'bandpass'; hp.frequency.value = 1800; hp.Q.value = 0.7; gn.gain.value = g;
        s.connect(hp).connect(gn).connect(bus.voice); s.onended = () => { try { gn.disconnect(); } catch (e) { /* gone */ } }; s.start(t); return s;
      } catch (e) { return null; }
    };
    const start = (l, buf) => {
      if (l.dead || !ctx) return;
      if (voices.size >= MAX_VOICES) { let q = null; for (const v of voices) if (!q || v.k < q.k) q = v; if (q && q.k < l.k) { try { q.src.stop(); } catch (e) { /* ended */ } voices.delete(q); } else { const i = lines.indexOf(l); if (i >= 0) lines.splice(i, 1); return; } }
      const src = ctx.createBufferSource(), gn = ctx.createGain(); src.buffer = buf; gn.gain.value = 0;
      let head = gn;
      if (l.ch === 'radio') {
        // a hand radio: 350 Hz - 3.2 kHz, a little drive, squelch clicks either side
        const hp = ctx.createBiquadFilter(), lp = ctx.createBiquadFilter(), ws = ctx.createWaveShaper(), mk = ctx.createGain();
        hp.type = 'highpass'; hp.frequency.value = 350; hp.Q.value = 0.8; lp.type = 'lowpass'; lp.frequency.value = 3200; lp.Q.value = 1.1;
        ws.curve = radioCurve; ws.oversample = 'none'; mk.gain.value = 0.75;
        src.connect(hp).connect(ws).connect(lp).connect(mk).connect(gn); l.nodes = [hp, ws, lp, mk];
      } else src.connect(gn);
      if (l.pos && ctx.createStereoPanner) { l.pan = ctx.createStereoPanner(); gn.connect(l.pan); head = l.pan; }
      head.connect(bus.voice);
      const t = ctx.currentTime + (l.ch === 'radio' ? 0.06 : 0.01);
      l.src = src; l.gn = gn; l.tail = head; l.end = t + buf.duration;
      gain(l, true);
      src.onended = () => { l.ended = true; const i = lines.indexOf(l); if (i >= 0) lines.splice(i, 1); voices.delete(l); A.stats.voices = voices.size; try { head.disconnect(); } catch (e) { /* gone */ } };
      src.start(t);
      if (l.ch === 'radio') { chirp(t - 0.06, 0.3); l.sq = chirp(l.end + 0.01, 0.25); }
      voices.add(l); A.stats.voices = voices.size;
    };
    // gain + pan from the listener (positional lines follow the listener at the audio tick rate)
    const gain = (l, now) => {
      let g = l.vol, pan = 0;
      if (l.pos) { const P = place(l.pos.x, l.pos.y, l.pos.z, l.ref); g *= P.g; pan = P.pan; }
      if (now) { l.gn.gain.value = g; if (l.pan) l.pan.pan.value = pan; }
      else { l.gn.gain.setTargetAtTime(g, ctx.currentTime, 0.08); if (l.pan) l.pan.pan.setTargetAtTime(pan, ctx.currentTime, 0.1); }
    };
    A.voice = (id, o) => {
      const L = lineOf(id); if (!L) return 0;
      const d = A.voiceLen(id);
      loadMan();
      if (!A.on || !graph() || ctx.state !== 'running') return d;
      const pos = o && o.x != null, ch = o && o.radio ? 'radio' : pos ? 'pos' : 'line';
      // one line per channel; positional barks overlap up to three (the oldest makes way)
      if (ch !== 'pos') A.stopVoice(ch);
      else { let n = 0, old = null; for (const q of lines) if (q.ch === 'pos') { n++; if (!old) old = q; } if (n >= 3) kill(old, 0.1); }
      const l = { id, ch, src: null, gn: null, pan: null, nodes: null, pos: pos ? { x: o.x, y: o.y ?? LS.y, z: o.z } : null, ref: (o && o.ref) || 7, vol: (o && o.vol != null ? o.vol : 1) * (ch === 'radio' ? 1.1 : 1), k: 4, end: 0, sq: null, dead: false, ended: false, t0: ctx.currentTime };
      lines.push(l);
      const f = vo.get(id);
      if (f && f.buf) { f.used = AF.clock.t; start(l, f.buf); }
      else loadVo(id).then((buf) => {
        // a line still loading after a beat is dropped for barks (they would land late); story lines start late instead
        if (!buf || l.dead || lines.indexOf(l) < 0 || (ch === 'pos' && ctx.currentTime - l.t0 > 0.7) || ctx.currentTime - l.t0 > 3) { const i = lines.indexOf(l); if (i >= 0) lines.splice(i, 1); return; }
        start(l, buf);
      });
      return d;
    };

    // ---- music: one looping source per track, crossfaded; the loop seam gets a 10 ms blend at decode so it never clicks
    const mu = new Map();           // id -> { buf, p, used, bytes }
    const MU = { want: null, vol: 1, fade: 2, cur: null, old: [] };   // cur/old = { id, src, g }
    const seam = (buf) => {
      const N = Math.min(512, buf.length >> 3);
      for (let c = 0; c < buf.numberOfChannels; c++) { const d = buf.getChannelData(c), n = d.length; for (let i = 0; i < N; i++) { const w = i / N; d[n - N + i] = d[n - N + i] * (1 - w) + d[i] * w; } }
      return N / buf.sampleRate;
    };
    const loadMu = (id) => {
      let f = mu.get(id); if (f) { f.used = AF.clock.t; return f.p; }
      f = { buf: null, p: null, used: AF.clock.t, bytes: 0, s0: 0 }; mu.set(id, f);
      f.p = fetch(MU_BASE + encodeURIComponent(id) + '.mp3').then((r) => { if (!r.ok) throw new Error(r.status + ' ' + id); return r.arrayBuffer(); }).then(decode).then((buf) => {
        f.s0 = seam(buf); f.buf = buf; f.bytes = buf.length * buf.numberOfChannels * 4; A.stats.bytes += f.bytes; return buf;
      }).catch((e) => { AF.warnOnce('music load ' + id, e); mu.delete(id); return null; });
      return f.p;
    };
    const fadeOut = (m, fade) => {
      if (!m || !ctx) return;
      const t = ctx.currentTime; try { m.g.gain.cancelScheduledValues(t); m.g.gain.setValueAtTime(m.g.gain.value, t); m.g.gain.linearRampToValueAtTime(0, t + Math.max(0.05, fade)); m.src.stop(t + Math.max(0.05, fade) + 0.05); } catch (e) { /* stopped */ }
      MU.old.push(m); m.src.onended = () => { const i = MU.old.indexOf(m); if (i >= 0) MU.old.splice(i, 1); try { m.g.disconnect(); } catch (e) { /* gone */ } };
    };
    const startMu = (id) => {
      const f = mu.get(id); if (!f || !f.buf || !graph() || ctx.state !== 'running') return false;
      const src = ctx.createBufferSource(), g = ctx.createGain(), t = ctx.currentTime;
      src.buffer = f.buf; src.loop = true; src.loopStart = f.s0; src.loopEnd = f.buf.duration;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(MU.vol, t + Math.max(0.05, MU.fade));
      src.connect(g).connect(mus); src.start(t);
      MU.cur = { id, src, g }; A.stats.music = id;
      // keep the playing + the previous track decoded; drop the rest
      const keep = [...mu.entries()].filter(([, q]) => q.buf).sort((a, b) => b[1].used - a[1].used);
      for (let i = 2; i < keep.length; i++) if (keep[i][0] !== id) { A.stats.bytes -= keep[i][1].bytes; mu.delete(keep[i][0]); }
      return true;
    };
    A.music = (id, o) => {
      const fade = o && o.fade != null ? o.fade : 2, vol = o && o.vol != null ? o.vol : 1;
      MU.fade = fade;
      if (!id) { MU.want = null; if (MU.cur) { fadeOut(MU.cur, fade); MU.cur = null; A.stats.music = ''; } return; }
      if (MU.cur && MU.cur.id === id) { if (vol !== MU.vol && ctx) MU.cur.g.gain.setTargetAtTime(vol, ctx.currentTime, Math.max(0.05, fade) / 3); MU.vol = vol; MU.want = id; return; }
      MU.want = id; MU.vol = vol;
      if (MU.cur) { fadeOut(MU.cur, fade); MU.cur = null; }
      if (!A.on || !graph()) return;
      loadMu(id).then(() => { if (MU.want === id && !MU.cur) startMu(id); });
    };
    A.musicId = () => MU.want;
    A.setMusicVol = (v) => { A.musicVol = AF.clamp(+v || 0, 0, 1); if (mus && ctx) mus.gain.setTargetAtTime(A.musicVol, ctx.currentTime, 0.05); try { localStorage.setItem('portSolace.musicVol', String(A.musicVol)); } catch (e) { /* storage blocked */ } };

    // ---- 15 Hz: positional lines follow the listener; speech ducks the music and the ambience beds
    let duckT = 0, duckK = -1, reapVoT = 0;
    AF.onTick('audio-voice', 966, (dt) => {
      if (!ctx || !A.on || ctx.state !== 'running' || (duckT += dt) < 1 / 15) return;
      const step = duckT; duckT = 0;
      let k = 1;
      for (let i = 0; i < lines.length; i++) { const l = lines[i]; if (!l.src) continue; if (l.pos) gain(l, false); k = Math.min(k, l.ch === 'pos' ? 0.75 : 0.4); }
      if (k !== duckK) {
        // dip fast (0.12 s), recover slowly (0.6 s) once the line has ended
        const tc = k < duckK ? 0.12 : 0.6; duckK = k;
        if (musDuck) musDuck.gain.setTargetAtTime(k, ctx.currentTime, tc);
        if (bus.amb) bus.amb.gain.setTargetAtTime(BUS_GAIN.amb * (0.45 + 0.55 * k), ctx.currentTime, tc);
      }
      // a track asked for before the context ran (or while it was still loading) starts now
      if (MU.want && !MU.cur) { const f = mu.get(MU.want); if (!f) loadMu(MU.want); else if (f.buf) startMu(MU.want); }
      if ((reapVoT += step) > 20) { reapVoT = 0; for (const [id, f] of vo) if (f.buf && AF.clock.t - f.used > 90 && !playing(id)) { A.stats.bytes -= f.bytes; vo.delete(id); } }
    });

    // ---- menu: a music volume slider under the Sound row
    AF.on('ready', () => {
      const stack = document.querySelector('#m-menu .stack'); if (!stack) return;
      const row = document.createElement('div'); row.className = 'row';
      row.innerHTML = '<label>Music</label><input data-k="musicVol" type="range" min="0" max="1" step="0.05" aria-label="Music volume">';
      const inp = row.querySelector('input'); inp.value = String(A.musicVol);
      inp.addEventListener('input', (e) => { A.setMusicVol(+e.target.value); e.stopPropagation(); });
      row.addEventListener('click', (e) => e.stopPropagation());
      stack.parentNode.insertBefore(row, stack);
    });
    AF.test('audio: voice lines resolve to lengths, unknown ids to 0', () => {
      const ids = AF.VO ? Object.keys(AF.VO) : [], n = ids.filter((id) => A.voiceLen(id) > 0).length;
      return { ok: ids.length > 0 && n === ids.length && A.voiceLen('no.such.line') === 0 && A.voice('no.such.line') === 0, info: n + '/' + ids.length + ' lines, manifest ' + (voMan ? Object.keys(voMan).length : 'not loaded') };
    });
  }

  AF.test('audio: library ids are wired and the zone weights stay in range', () => {
    const bad = Object.entries(LIB).filter(([, L]) => !Array.isArray(L[0]) || !L[0].length || !(L[1] > 0) || !BUS_GAIN[L[2]]).map(([k]) => k);
    LS.x = -40; LS.y = 1.6; LS.z = -230; LS.vx = LS.vy = LS.vz = 0;
    let ok = true; if (ctx) { weigh(); for (const k in W8) if (!(W8[k] >= 0 && W8[k] <= 1)) ok = false; }
    return { ok: !bad.length && ok, info: Object.keys(LIB).length + ' sounds, bad ' + bad.join(',') + ', ctx ' + (ctx ? ctx.state : 'none') + ', zone ' + A.zone };
  });
}
} catch (e) { AF.partError('75-audio.js', e); }
