// ================================================================ 01-core.js
try {
// ===== 01-core: namespace, hooks, utils, palette, input, time  (OWNER: coordinator) =====
const AF = window.AF;
AF.BUILD = '2026-09-23 10:52:50';
AF.Q = new URLSearchParams(location.search);
AF.TEST = AF.Q.has('test');
AF.SHOT = AF.Q.has('shot');
AF.DBG = AF.Q.has('dbg');
AF.ready = false;

// ---------------------------------------------------------------- graphics tier (R1). Read AF.GFX.tier every frame or AF.GFX.onChange(fn).
// ?gfx=ultra|high|low forces a tier (no auto). 03-render auto-picks at boot, auto-downgrades (frame > 22 ms for 3 s) and runs dynamic resolution.
AF.GFX = {
  tier: 'ultra', cinema: false, forced: false, auto: true, scale: 1, _subs: [],
  // ROUND 2: 'cinema' = the ultra tier + capture quality (native DPR up to 2, no dynamic-resolution drops, no auto-downgrade,
  // props at full detail to 200 m, 4096 far shadow, 16-sample AO, anisotropic textures). tier stays 'ultra' so every
  // `tier === 'ultra'` check elsewhere keeps working; read AF.GFX.cinema (or AF.GFX.name) for the extra quality.
  get name() { return this.cinema ? 'cinema' : this.tier; },
  set(t, why) {
    const cin = t === 'cinema'; if (cin) t = 'ultra';
    if (!['ultra', 'high', 'low'].includes(t) || (t === this.tier && cin === this.cinema)) return;
    const prev = this.tier, prevName = this.name; this.tier = t; this.cinema = cin; if (cin) this.auto = false;
    console.log('[af] gfx tier ' + prevName + ' -> ' + this.name + (why ? ' (' + why + ')' : ''));
    for (const f of this._subs) { try { f(t, prev); } catch (e) { console.error('[af] gfx onChange', e); } }
  },
  onChange(fn) { this._subs.push(fn); },
  is(t) { const o = { low: 0, high: 1, ultra: 2 }; return o[this.tier] >= o[t]; },   // AF.GFX.is('high') -> tier high or better
};
{ const g = AF.Q.get('gfx'); if (g && ['ultra', 'high', 'low', 'cinema'].includes(g)) { AF.GFX.tier = g === 'cinema' ? 'ultra' : g; AF.GFX.cinema = g === 'cinema'; AF.GFX.forced = true; AF.GFX.auto = false; } }

// ---------------------------------------------------------------- hooks
// Build stages run once at boot, sorted by order (see CONTRACT.md for the order table).
// Ticks run every frame sorted by order: fn(dt, t). Errors are caught, logged once per hook, and the hook keeps running.
AF.hooks = { build: [], tick: [], tests: [] };
AF.onBuild = (name, order, fn) => { AF.hooks.build.push({ name, order, fn }); };
AF.onTick = (name, order, fn) => { AF.hooks.tick.push({ name, order, fn, errs: 0 }); AF.hooks.tick.sort((a, b) => a.order - b.order); };
AF.test = (name, fn) => { AF.hooks.tests.push({ name, fn }); };
AF.warnOnce = (() => { const seen = new Set(); return (k, ...a) => { if (!seen.has(k)) { seen.add(k); console.warn('[af]', k, ...a); } }; })();

// ---------------------------------------------------------------- math utils
AF.clamp = (v, a, b) => v < a ? a : v > b ? b : v;
AF.lerp = (a, b, t) => a + (b - a) * t;
AF.smooth = (a, b, v) => { const t = AF.clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
AF.rng = (seed) => { let s = (seed >>> 0) || 1; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
AF.hash2 = (x, z) => { let h = Math.imul(x | 0, 374761393) + Math.imul(z | 0, 668265263); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
AF.hash3 = (x, y, z) => AF.hash2(Math.imul(x | 0, 31) + (y | 0) * 7919, z);
AF.noise2 = (x, z) => { // smooth value noise 0..1
  const xi = Math.floor(x), zi = Math.floor(z), xf = x - xi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = zf * zf * (3 - 2 * zf);
  const a = AF.hash2(xi, zi), b = AF.hash2(xi + 1, zi), c = AF.hash2(xi, zi + 1), d = AF.hash2(xi + 1, zi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
};
AF.fbm2 = (x, z, oct = 4) => { let s = 0, a = 0.5, f = 1, n = 0; for (let i = 0; i < oct; i++) { s += a * AF.noise2(x * f + i * 17.3, z * f - i * 9.1); n += a; a *= 0.5; f *= 2; } return s / n; };
AF.angDiff = (a, b) => { let d = (b - a) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return d; };

// ---------------------------------------------------------------- palette
// AF.col(0xRRGGBB, opts?) -> palette index (1..4095). Same args -> same index.
// opts: { emit: 0xRRGGBB, emitK: strength(1), mode: 'night'|'always', jitter: 0..1 (0.5), edge: 0..1 (0.5), smooth: true (edge 0, jitter <= 0.04, no pattern),
//         solid: true, glass: false, sat: 1 (extra saturation multiplier) }
//   emit+mode 'night'  : glows only when AF.time.night rises (windows, street lamps)
//   emit+mode 'always' : always glows (neon, fire, TV)
//   emit+mode 'neon'   : like 'always', but gated by AF.mat.uniforms.uNeon (0..1, default 1): tubes flicker ON in a
//                        per-voxel-cell sequence as atmos raises uNeon at dusk (engine R2). JS checks 'emit.a >= 2' still mean 'always-ish'.
//   glass              : rendered in the transparent pass, tinted by the colour; solid for collision
//   solid:false        : visible but walk-through (flowers, tall grass, curtains, hanging signs)
AF.SAT = 1.18;
AF.PAL = {
  n: 1, key: new Map(), hex: [0], solid: new Uint8Array(4096), glass: new Uint8Array(4096), opaque: new Uint8Array(4096),
  albedo: new Float32Array(4096 * 4), emit: new Float32Array(4096 * 4), dirty: true, names: {},
  // R1 material channel: r = roughness (-1 = material default), g = metalness, b = pattern (side + 32 * top), a = window kind
  mat: new Float32Array(4096 * 4), explicitPat: new Uint8Array(4096),
};
// ---- surface patterns + material options (R1). AF.col(hex, { rough:0..1, metal:0..1, pat:'brick', patTop:'plank', win:'office' })
//   pat    : sub-block pattern drawn in the shader on SIDE faces (and top faces too unless patTop is given). 'none' opts out of auto-assign.
//   patTop : pattern for top/bottom faces.  win: 'office'|'apartment'|'shop'|'hotel'|'none' — fake rooms behind facade-only window glass.
AF.PAT = { none: 0, brick: 1, stone: 2, tile: 3, checker: 4, plank: 5, shingle: 6, setts: 7, cobble: 7, terracotta: 8, asphalt: 9, grass: 10, panel: 11, slab: 12, marble: 13, metal: 14, tar: 15, stucco: 16, parquet: 17, carpet: 18 };
AF.WIN = { none: 0, office: 1, apartment: 2, shop: 3, hotel: 4 };
AF.PAL.setMat = (i, o) => {
  const P = AF.PAL, M = P.mat, pid = (v) => v == null ? -1 : (typeof v === 'number' ? v : (AF.PAT[v] ?? 0));
  M[i * 4] = o.rough ?? -1; M[i * 4 + 1] = o.metal ?? 0;
  const ps = pid(o.pat), pt = o.patTop != null ? pid(o.patTop) : ps;
  P.explicitPat[i] = (o.pat != null || o.patTop != null) ? 1 : 0;
  M[i * 4 + 2] = Math.max(0, ps) + 32 * Math.max(0, pt);
  M[i * 4 + 3] = o.win == null ? 0 : (typeof o.win === 'number' ? o.win : (AF.WIN[o.win] ?? 0));
  P.explicitWin = P.explicitWin || new Uint8Array(4096); P.explicitWin[i] = o.win != null ? 1 : 0;
  P.dirty = true;
};
// change material options of an existing index (art agents: prefer passing options to AF.col)
AF.setSurface = (i, o) => {
  const M = AF.PAL.mat, pv = M[i * 4 + 2];
  const cur = { rough: M[i * 4] < 0 ? undefined : M[i * 4], metal: M[i * 4 + 1] || undefined, pat: pv % 32, patTop: Math.floor(pv / 32), win: M[i * 4 + 3] || undefined };
  AF.PAL.setMat(i, Object.assign(cur, o));
};
// ---- auto surfaces for v1 content (R1): runs once at build 499 over every palette entry that did not choose a pattern itself.
// Exact hexes grepped from the v1 parts + a conservative hue rule for brick. Opt out per colour with AF.col(hex, { pat: 'none' }),
// or globally with ?noauto. Props meshed finer than ~0.2 m never show patterns (the shader checks the block size).
AF.AUTO_SURF = {
  brick: [0x5a3a22, 0x6a3a30, 0x6b4428, 0x7a3828, 0x7e3a2a, 0x7e4a36, 0x8a3a2c, 0x8a3a2a, 0x8a5a40, 0x9a4a36, 0x9a4a38, 0xa4503a, 0xa8603f, 0xae5a40, 0xb86a50, 0xc9826a],
  stone: [0xcbbb96, 0xd8c9a6, 0xd9b98a, 0xe4d6b4, 0xe6d9bb, 0xefe3c4, 0xf3ecda, 0xe2d6ba, 0xcfc2a4, 0xbab2a0, 0x9c968a],
  plankTop: [0x6a4226, 0x7d5a3c, 0x9a6636, 0x9a6a3a, 0xa8773f, 0x6f4a2a, 0x94724a, 0x9a6a3e, 0xa77b4d, 0xb08a5a, 0xb98a58, 0xc29a68, 0x7a4e2c, 0x7a5a3a, 0x8e5c2d, 0x4e3220, 0x5b3a22, 0xb58656, 0xbb8b55],
  settsTop: [0x8e8478, 0xa8a092, 0x4c4a49, 0x504e4c, 0x52504d, 0x55534f, 0x585550, 0x6e6a60, 0x8a8478, 0xa29a8a],
  tile: [0x222226, 0x2a2a2e, 0xe8e4dc, 0xeeeae0, 0xf2efe6, 0xece4d0],
  marble: [0x2f3038, 0x3c6b58, 0x3f7a68, 0x5e8f6e, 0x8f3d36, 0xd9b877, 0xeee8dc],
  granite: [0x211f25, 0x26262b, 0x2b2a30, 0x3a3640, 0x6a3b36, 0x1d1b1a],
  gold: [0xc2923a, 0xd8a93a, 0xc4a03a, 0xd8ae4a, 0xe2b446, 0xe8c050, 0xb08a3a, 0xc9a24a, 0xc9a24c, 0xd4a93e, 0xd8b050],
  bronze: [0x86592e, 0x5a3b20],
  chrome: [0xd8dcdf, 0xe6eaf0],
  steel: [0x8b9097, 0x5d636b, 0xc3c8cf],
  copper: [0x5da58b, 0x3f7c68, 0x7cc3a6],
  slabTop: [0x8c867c, 0x9e988c, 0xbfae8c, 0xd9cdb2, 0xf2e8d2, 0xb8b2a6],
  paverTop: [0xb86a48],
  shingle: [0x40464e, 0x4a5058],
  tarTop: [0x55524e, 0x6b6863, 0x45403c, 0x57504a, 0x625a52, 0x3a3634],
  asphaltTop: [0x6a6a70],
  win: [0x3a4652, 0x46505a, 0x2a323a, 0x3a4a5a, 0x303a44, 0x283048, 0x2c3240, 0x1d2330, 0x2a3040, 0x3b4a58],
};
AF.PAL.autoSurfaces = () => {
  if (AF.Q.has('noauto')) return 0;
  const P = AF.PAL, A = AF.AUTO_SURF, by = new Map();
  const put = (list, o) => { for (const h of list) by.set(h, Object.assign({}, by.get(h) || {}, o)); };
  put(A.brick, { pat: 'brick', patTop: 'none' }); put(A.stone, { pat: 'stone', patTop: 'slab' }); put(A.plankTop, { pat: 'none', patTop: 'plank' });
  put(A.settsTop, { pat: 'none', patTop: 'setts' }); put(A.tile, { pat: 'none', patTop: 'tile', rough: 0.35 }); put(A.marble, { pat: 'marble', rough: 0.22 });
  put(A.granite, { rough: 0.2 }); put(A.gold, { metal: 0.9, rough: 0.3 }); put(A.bronze, { metal: 0.8, rough: 0.42 }); put(A.chrome, { metal: 1, rough: 0.12 });
  put(A.steel, { metal: 0.75, rough: 0.42 }); put(A.copper, { rough: 0.8 }); put(A.slabTop, { pat: 'none', patTop: 'slab' }); put(A.paverTop, { pat: 'brick', patTop: 'brick' });
  put(A.shingle, { pat: 'shingle' }); put(A.tarTop, { pat: 'none', patTop: 'tar' }); put(A.asphaltTop, { pat: 'none', patTop: 'asphalt' });
  put(A.win, { win: 'office', rough: 0.08 });
  const named = { asphalt: { pat: 'none', patTop: 'asphalt' }, sidewalk: { pat: 'none', patTop: 'slab' }, grass: { pat: 'none', patTop: 'grass' }, stone: { pat: 'stone' }, dirt: { patTop: 'none' }, window: { win: 'office', rough: 0.08 } };
  const nameOf = new Map(); for (const k in P.names) nameOf.set(P.names[k], k);
  const hsl = {}, c = new THREE.Color(); let n = 0;
  for (let i = 1; i < P.n; i++) {
    if (P.glass[i]) continue;
    const M = P.mat, hex = P.hex[i], em = P.emit[i * 4 + 3];
    let o = by.get(hex) || named[nameOf.get(i)];
    if (!o && em < 1) {   // conservative hue rule: brick reds/browns (not emissive, not explicit)
      c.setHex(hex); c.getHSL(hsl, THREE.SRGBColorSpace);
      const h = hsl.h * 360;
      if ((h < 20 || h > 352) && hsl.s > 0.3 && hsl.s < 0.75 && hsl.l > 0.2 && hsl.l < 0.46) o = { pat: 'brick', patTop: 'none' };
    }
    if (!o) continue;
    if (em >= 2 && o.win) continue;          // always-lit signs are not windows
    const hasPat = P.explicitPat[i], hasWin = P.explicitWin && P.explicitWin[i];
    const q = Object.assign({}, o);
    if (hasPat) { delete q.pat; delete q.patTop; }
    if (hasWin) delete q.win;
    if (M[i * 4] >= 0) delete q.rough;
    if (M[i * 4 + 1] > 0) delete q.metal;
    if (!Object.keys(q).length) continue;
    AF.setSurface(i, q); P.explicitPat[i] = hasPat; if (P.explicitWin) P.explicitWin[i] = hasWin; n++;
  }
  P.autoCount = n;
  return n;
};
AF.col = (hex, o = {}) => {
  if (typeof hex === 'string') { if (AF.PAL.names[hex]) return AF.PAL.names[hex]; hex = parseInt(hex.replace('#', ''), 16); }
  if (typeof hex !== 'number' || !isFinite(hex)) { AF.warnOnce('bad colour ' + hex); hex = 0xff00ff; }
  // smooth:true (engine v2) = plaster / wallpaper / painted wood: no block edge lines, almost no per-block jitter, no auto pattern
  if (o.smooth) o = Object.assign({ pat: 'none' }, o, { smooth: undefined, edge: 0, jitter: Math.min(o.jitter ?? 0.04, 0.04) });
  let k = hex + '|' + (o.emit ?? '') + '|' + (o.emitK ?? '') + '|' + (o.mode ?? '') + '|' + (o.jitter ?? '') + '|' + (o.edge ?? '') + '|' + (o.solid ?? '') + '|' + (o.glass ?? '') + '|' + (o.sat ?? '');
  if (o.rough != null || o.metal != null || o.pat != null || o.patTop != null || o.win != null) k += '|m' + (o.rough ?? '') + '|' + (o.metal ?? '') + '|' + (o.pat ?? '') + '|' + (o.patTop ?? '') + '|' + (o.win ?? '');
  const P = AF.PAL; let i = P.key.get(k); if (i) return i;
  if (P.n >= 4095) { AF.warnOnce('palette full'); return 1; }
  i = P.n++; P.key.set(k, i); P.hex[i] = hex;
  const c = new THREE.Color(hex); const hsl = {}; c.getHSL(hsl, THREE.SRGBColorSpace);
  c.setHSL(hsl.h, Math.min(1, hsl.s * AF.SAT * (o.sat ?? 1)), hsl.l, THREE.SRGBColorSpace);
  P.albedo[i * 4] = c.r; P.albedo[i * 4 + 1] = c.g; P.albedo[i * 4 + 2] = c.b; P.albedo[i * 4 + 3] = o.jitter ?? 0.5;
  if (o.emit != null) { const e = new THREE.Color(o.emit); const k2 = o.emitK ?? 1; P.emit[i * 4] = e.r * k2; P.emit[i * 4 + 1] = e.g * k2; P.emit[i * 4 + 2] = e.b * k2; P.emit[i * 4 + 3] = (o.mode === 'neon' ? 3 : o.mode === 'always' ? 2 : 1) + (o.edge ?? 0.5) * 0.5; }
  else P.emit[i * 4 + 3] = (o.edge ?? 0.5) * 0.5;   // 0..0.5 = edge strength, +1 night, +2 always
  P.solid[i] = o.solid === false ? 0 : 1; P.glass[i] = o.glass ? 1 : 0; P.opaque[i] = o.glass ? 0 : 1;
  AF.PAL.setMat(i, o);
  P.dirty = true;
  return i;
};
AF.name = (name, hex, o) => { const i = AF.col(hex, o); AF.PAL.names[name] = i; return i; };
// A few shared colours everyone may use by name: AF.col('grass') etc.
AF.name('grass', 0x6f9a3e, { jitter: 0.9 }); AF.name('dirt', 0x7a5634, { jitter: 0.8 }); AF.name('asphalt', 0x4a4a4f, { jitter: 0.35, edge: 0.15 });
AF.name('sidewalk', 0xb8b0a2, { jitter: 0.3 }); AF.name('stone', 0x8e8a82, { jitter: 0.7 }); AF.name('water', 0x3d6f8e);
AF.name('white', 0xf1ede2, { jitter: 0.2 }); AF.name('black', 0x1d1b1a, { jitter: 0.2 }); AF.name('glass', 0x9fc3cf, { glass: true, jitter: 0.1, edge: 0 });
AF.name('window', 0x3b4a58, { emit: 0xffc46b, emitK: 1.4, mode: 'night', jitter: 0.15, edge: 0.1 });
AF.name('lamp', 0xfff1c9, { emit: 0xffd48a, emitK: 3.0, mode: 'night', jitter: 0, edge: 0 });
// named material presets for art agents: AF.MAT.brass etc. are palette indices (use like any colour)
AF.MAT = {};
{
  const d = (k, hex, o) => { AF.MAT[k] = AF.col(hex, Object.assign({ jitter: 0.12, edge: 0.3 }, o)); };
  d('brass', 0xd4a84a, { metal: 0.95, rough: 0.28 }); d('gold', 0xf2c65a, { metal: 1, rough: 0.2, jitter: 0.05 }); d('goldLeaf', 0xffd978, { metal: 1, rough: 0.14, jitter: 0.04 });
  d('bronze', 0x8a5a30, { metal: 0.85, rough: 0.42 }); d('chrome', 0xe8ecf0, { metal: 1, rough: 0.08, jitter: 0.03 }); d('steel', 0x9aa0a8, { metal: 0.8, rough: 0.4 });
  d('iron', 0x2e3034, { metal: 0.55, rough: 0.6 }); d('copper', 0x5da58b, { rough: 0.82, jitter: 0.5 }); d('copperNew', 0xc8764a, { metal: 0.9, rough: 0.34 });
  d('granite', 0x1e1d22, { rough: 0.16, jitter: 0.08 }); d('graniteRed', 0x6a3b36, { rough: 0.2 }); d('marble', 0xeee8dc, { rough: 0.22, pat: 'marble' });
  d('marbleGreen', 0x3f7a68, { rough: 0.2, pat: 'marble' }); d('marbleBlack', 0x2a2a30, { rough: 0.18, pat: 'marble' });
  d('limestone', 0xe6d9bb, { rough: 0.9, pat: 'stone', patTop: 'slab', jitter: 0.25 }); d('terracotta', 0xd9b27a, { rough: 0.55, pat: 'terracotta' });
  d('brick', 0x8a3a2c, { pat: 'brick', patTop: 'none', jitter: 0.35 }); d('brickRed', 0xa0442e, { pat: 'brick', patTop: 'none', jitter: 0.35 });
  d('brickBrown', 0x6e3a28, { pat: 'brick', patTop: 'none', jitter: 0.35 }); d('brickSalmon', 0xc8765a, { pat: 'brick', patTop: 'none', jitter: 0.35 });
  d('stucco', 0xe8dcc0, { pat: 'stucco', rough: 0.95 }); d('asphalt', 0x4a4a4f, { pat: 'none', patTop: 'asphalt', jitter: 0.35, edge: 0.1 });
  d('setts', 0x7a746c, { pat: 'none', patTop: 'setts', jitter: 0.5 }); d('slab', 0xb8b0a2, { pat: 'none', patTop: 'slab', jitter: 0.3 });
  d('plank', 0x9a6a3e, { pat: 'none', patTop: 'plank', jitter: 0.3 }); d('parquet', 0xa8773f, { pat: 'none', patTop: 'parquet', rough: 0.45 });
  d('panel', 0x7a4e2c, { pat: 'panel', patTop: 'plank', rough: 0.5 }); d('tileWhite', 0xf2efe6, { pat: 'tile', rough: 0.3 });
  d('checker', 0xe8e4dc, { pat: 'none', patTop: 'checker', rough: 0.3 }); d('shingle', 0x4a5058, { pat: 'shingle' });
  d('shingleRed', 0x8a3a2e, { pat: 'shingle' }); d('tar', 0x45403c, { pat: 'none', patTop: 'tar' }); d('carpet', 0x8a2a2a, { pat: 'none', patTop: 'carpet', rough: 1 });
  d('enamel', 0xf4f1e8, { rough: 0.3 }); d('paintGloss', 0x1f5a3a, { rough: 0.3 });
  d('glassDark', 0x2a3440, { rough: 0.05, jitter: 0.04, edge: 0.1 });
  d('winOffice', 0x2e3a46, { win: 'office', rough: 0.06, emit: 0xffd9a0, emitK: 1.2, mode: 'night', jitter: 0.1, edge: 0.1 });
  d('winApartment', 0x34404c, { win: 'apartment', rough: 0.06, emit: 0xffc47a, emitK: 1.2, mode: 'night', jitter: 0.1, edge: 0.1 });
  d('winShop', 0x2a3440, { win: 'shop', rough: 0.06, emit: 0xffe0b0, emitK: 1.3, mode: 'night', jitter: 0.1, edge: 0.1 });
  d('winHotel', 0x303844, { win: 'hotel', rough: 0.06, emit: 0xffc890, emitK: 1.2, mode: 'night', jitter: 0.1, edge: 0.1 });
}

// ---------------------------------------------------------------- input
AF.input = { down: new Set(), pressed: new Set(), released: new Set(), mouse: { x: 0, y: 0, dx: 0, dy: 0, buttons: 0, wheel: 0, clicked: false } };
{
  const I = AF.input;
  addEventListener('keydown', (e) => {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
    if (!I.down.has(e.code)) I.pressed.add(e.code);
    I.down.add(e.code);
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.code)) e.preventDefault();
  });
  addEventListener('keyup', (e) => { I.down.delete(e.code); I.released.add(e.code); });
  addEventListener('blur', () => { I.down.clear(); I.mouse.buttons = 0; });
  const cv = document.getElementById('cv');
  cv.addEventListener('mousedown', (e) => { I.mouse.buttons = e.buttons; I.mouse.x = e.clientX; I.mouse.y = e.clientY; I.mouse.downX = e.clientX; I.mouse.downY = e.clientY; cv.focus(); });
  addEventListener('mouseup', (e) => {
    const m = I.mouse; m.buttons = e.buttons;
    if (m.downX != null && Math.hypot(e.clientX - m.downX, e.clientY - m.downY) < 5) { m.clicked = true; m.clickX = e.clientX; m.clickY = e.clientY; m.clickButton = e.button; }
    m.downX = null;
  });
  addEventListener('mousemove', (e) => {
    const m = I.mouse;
    if (document.pointerLockElement) { m.dx += AF.clamp(e.movementX, -150, 150); m.dy += AF.clamp(e.movementY, -150, 150); }   // clamp: Chrome/macOS sometimes reports huge spikes
    else { m.dx += e.clientX - m.x; m.dy += e.clientY - m.y; }
    m.x = e.clientX; m.y = e.clientY; m.buttons = e.buttons;
  });
  cv.addEventListener('wheel', (e) => { I.mouse.wheel += e.deltaY; e.preventDefault(); }, { passive: false });
  cv.addEventListener('contextmenu', (e) => e.preventDefault());
  I.endFrame = () => { I.pressed.clear(); I.released.clear(); I.mouse.dx = 0; I.mouse.dy = 0; I.mouse.wheel = 0; I.mouse.clicked = false; };
  I.key = (code) => I.down.has(code);
  I.hit = (code) => I.pressed.has(code);
  I.tap = (code) => { I.pressed.add(code); };   // a one-frame press (on-screen buttons)
  I.stick = null;                                 // touch: { x, y } in -1..1 (72-touch)
}

// ---------------------------------------------------------------- time of day
// hours 0..24. speed = game hours per real second (default: one day = 24 real minutes).
// AF.time.night (0 day .. 1 full night) and AF.time.sunDir are maintained by the atmosphere part (fallback below).
AF.time = { hours: +(AF.Q.get('hour') ?? 16.5), speed: 1 / 240, paused: false, day: 1, night: 0, sunDir: new THREE.Vector3(0.5, 0.7, 0.3).normalize() };
AF.clock = { t: 0, frame: 0, dt: 1 / 60 };

// ---------------------------------------------------------------- registries shared between parts (see CONTRACT.md)
AF.buildings = [];   // {id, name, kind, box:[x0,y0,z0,x1,y1,z1], doors:[{x,y,z,yaw}], floors:[y], owner}
AF.spots = [];       // {building, x,y,z, yaw, kind:'sit'|'stand'|'counter'|'browse'|'bed'|'work', path:[[x,z]...] from door}
AF.lights = [];      // {x,y,z, color, intensity, range, kind:'street'|'interior'|'porch'|'sign', night:true}
AF.interacts = [];   // {x,y,z, r, label, can?():bool, act():void}
AF.chimneys = [];    // {x,y,z}
AF.labels = [];      // {name, x, z, kind:'building'|'street'|'place'|'station'}
AF.viewpoints = [];  // {name, pos:[x,y,z], target:[x,y,z]}
AF.addBuilding = (b) => { b.doors = b.doors || []; AF.buildings.push(b); if (b.name && b.label !== false) AF.labels.push({ name: b.name, x: (b.box[0] + b.box[3]) / 2, z: (b.box[2] + b.box[5]) / 2, kind: 'building' }); return b; };
AF.addSpot = (s) => { AF.spots.push(s); return s; };
AF.addLight = (l) => { AF.lights.push(Object.assign({ color: 0xffc67a, intensity: 1, range: 10, kind: 'interior', night: true }, l)); };
// the SAME object goes into the registry, so owners can move it (cars, NPCs) — a copy here left car prompts behind where the car used to be
AF.addInteract = (o) => { if (o.r == null) o.r = 2.2; AF.interacts.push(o); return o; };
AF.removeInteract = (o) => { const i = AF.interacts.indexOf(o); if (i >= 0) AF.interacts.splice(i, 1); };
AF.addChimney = (x, y, z) => AF.chimneys.push({ x, y, z });
AF.addLabel = (name, x, z, kind = 'place') => AF.labels.push({ name, x, z, kind });
AF.addViewpoint = (name, pos, target) => AF.viewpoints.push({ name, pos, target });
AF.buildingAt = (x, y, z) => { for (const b of AF.buildings) { const B = b.box; if (x >= B[0] && x <= B[3] && y >= B[1] && y <= B[4] && z >= B[2] && z <= B[5]) return b; } return null; };

// ---------------------------------------------------------------- modes (who owns the camera + controls)
// AF.modes[name] = { enter(opts), exit(), update(dt) }. Only the active mode's update runs (inside tick order 150).
// Owners: 'aerial' + 'walk' -> player part; 'drive' -> vehicles part; 'ride' -> rail part.
AF.modes = {};
AF.mode = null;
AF.setMode = (name, opts = {}) => {
  const prev = AF.mode && AF.modes[AF.mode];
  if (!AF.modes[name]) { AF.warnOnce('no mode ' + name); return; }
  try { prev && prev.exit && prev.exit(name); } catch (e) { console.error('[af] mode exit', e); }
  const from = AF.mode; AF.mode = name;
  try { AF.modes[name].enter && AF.modes[name].enter(opts, from); } catch (e) { console.error('[af] mode enter', e); }
  AF.emit('mode', name, from);
};
AF.onTick('modes', 150, (dt) => { const m = AF.mode && AF.modes[AF.mode]; if (m && m.update) m.update(dt); });

// ---------------------------------------------------------------- tiny event bus
AF._ev = {};
AF.on = (n, fn) => { (AF._ev[n] = AF._ev[n] || []).push(fn); };
AF.emit = (n, ...a) => { for (const fn of AF._ev[n] || []) { try { fn(...a); } catch (e) { console.error('[af] event ' + n, e); } } };

} catch (e) { AF.partError('01-core.js', e); }

