// ================================================================ 22-theatre.js
try {
// ===== 22-theatre: the Great White Way — shared shop kit (AF.TS), THE PARAGON, Bay St shops, the Blue Heron, the Rialto,
// hat shop + florist  (OWNER: theatre-shops). 23-shops.js reuses AF.TS for the diner block, the shops row and the bay row.
// Frames: f = TS.frame(ox, oz, face) — u runs along the frontage (to the viewer's right when looking in), v runs INTO the lot,
// the facade is at v = 0 and faces the street (-v). f.place(geo,u,y,v,du,dv) turns a model so its +z face points along (du,dv).
{
  const TS = AF.TS = { geos: new Map(), bulbs: [0, 0, 0], flick: [], screen: 0, spin: [], shops: [], balls: [] };
  const M = (w, h, d) => new AF.Model(w, h, d);
  TS.geo = (key, fn, vs = 1 / 8, anchor = [0.5, 0, 0.5]) => { let g = TS.geos.get(key); if (!g) { g = AF.meshModel(fn(), { vs, anchor }); TS.geos.set(key, g); } return g; };
  TS.hash = (a, b, c = 0) => { let h = (Math.imul((a | 0) ^ 0x9e3779b1, 73856093) ^ Math.imul((b | 0) + 7, 19349663) ^ Math.imul((c | 0) + 13, 83492791)) >>> 0; h ^= h >>> 13; h = Math.imul(h, 0x5bd1e995) >>> 0; h ^= h >>> 15; return ((h >>> 0) % 10007) / 10007; };   // (h >>> 0): was signed → half the values negative

  // ---------------------------------------------------------------- colours (once)
  TS.cols = () => {
    if (TS.C) return TS.C;
    if (AF.font5x7 && !AF.font5x7['¢']) AF.font5x7['¢'] = [0x04, 0x0F, 0x14, 0x14, 0x14, 0x0F, 0x04];
    const c = AF.col, neon = (hex, e) => c(hex, { emit: e, emitK: 3.0, mode: 'always', jitter: 0, edge: 0 });
    const C = TS.C = {
      cream: c(0xefe3c4, { jitter: 0.3, edge: 0.4 }), buff: c(0xd9b98a, { jitter: 0.35 }), terra: c(0xc98f5e, { jitter: 0.4 }), lime: c(0xe4d6b4, { jitter: 0.35 }),
      brickR: c(0xa4503a, { jitter: 0.6 }), brickB: c(0x7e4a36, { jitter: 0.6 }), brickS: c(0xc9826a, { jitter: 0.6 }), brickY: c(0xc9a878, { jitter: 0.5 }), brickD: c(0x6a3a30, { jitter: 0.6 }),
      granite: c(0x26262b, { jitter: 0.2, edge: 0.3 }), gold: c(0xd8a93a, { jitter: 0.2, edge: 0.3 }), brass: c(0xc2923a, { jitter: 0.2 }), bronze: c(0x7a5a32, { jitter: 0.2 }),
      jade: c(0x3f9a86, { jitter: 0.3 }), teal: c(0x2f7f86, { jitter: 0.3 }), red: c(0xb3202e, { jitter: 0.25 }), redD: c(0x7e1624, { jitter: 0.25 }), navy: c(0x1f3050, { jitter: 0.25 }),
      navyD: c(0x141c30, { jitter: 0.2 }), white: AF.col('white'), black: AF.col('black'), iron: c(0x2e2f33, { jitter: 0.2 }), chrome: c(0xd6dde2, { jitter: 0.1, edge: 0.2 }),
      steel: c(0xaeb8bf, { jitter: 0.15, edge: 0.3 }), wood: c(0x8a5a34, { jitter: 0.5 }), woodD: c(0x5a3a22, { jitter: 0.4 }), woodL: c(0xb98a58, { jitter: 0.4 }),
      tileW: c(0xeeeae0, { jitter: 0.15 }), tileK: c(0x2a2a2e, { jitter: 0.15 }), tileG: c(0x5e8f6e, { jitter: 0.2 }), marble: c(0xe8e4dc, { jitter: 0.3 }), marbleG: c(0x3c6b58, { jitter: 0.4 }),
      plaster: c(0xf2e8d2, { jitter: 0.2 }), pave: c(0x9e988c, { jitter: 0.45 }), tar: c(0x55524e, { jitter: 0.4 }), gravel: c(0x8c867c, { jitter: 0.8 }), felt: c(0x2f7a3e, { jitter: 0.15 }),
      paper: [c(0xe6d3a8, { jitter: 0.2 }), c(0xcfe0d2, { jitter: 0.2 }), c(0xf0d6d0, { jitter: 0.2 }), c(0xd8d8ea, { jitter: 0.2 }), c(0xf2e6c8, { jitter: 0.2 })],
      glass: AF.col('glass'), prism: c(0xcfe6ea, { glass: true, emit: 0xfff0c8, emitK: 0.6, mode: 'night', jitter: 0, edge: 0 }),
      win: [AF.col('window'), c(0x3b4a58, { emit: 0xffe9c0, emitK: 1.2, mode: 'night', jitter: 0.15, edge: 0.1 }), c(0x2a3440, { jitter: 0.1, edge: 0.1 }), c(0x34405a, { emit: 0x8fb4ff, emitK: 1.0, mode: 'night', jitter: 0.1, edge: 0.1 })],
      lamp: c(0xfff1c9, { emit: 0xffd48a, emitK: 2.6, mode: 'always', jitter: 0, edge: 0 }), lampN: AF.col('lamp'),
      lampR: c(0xff6b5a, { emit: 0xff3a2a, emitK: 2.2, mode: 'always', jitter: 0, edge: 0 }),
      neonPink: neon(0xff6fd0, 0xff3fb0), neonBlue: neon(0x7fc8ff, 0x3a9cff), neonRed: neon(0xff5a4a, 0xff2a1a), neonGreen: neon(0x7dff9a, 0x2aff60),
      neonYellow: neon(0xfff07a, 0xffd23a), neonTeal: neon(0x7affee, 0x2af0d8), neonWhite: neon(0xfff6e6, 0xfff0d0), neonOrange: neon(0xffb06a, 0xff8a2a),
      exit: c(0xff3030, { emit: 0xff2020, emitK: 2.0, mode: 'always', jitter: 0, edge: 0 }),
      seat: c(0xa01a28, { jitter: 0.2 }), velvet: c(0x8e1b2c, { jitter: 0.2 }), carpet: c(0x8e2430, { jitter: 0.25, edge: 0.1 }), carpetG: c(0xc79a3a, { jitter: 0.2, edge: 0.1 }),
      curtain: c(0x9a1626, { jitter: 0.3, solid: false }), leaf: c(0x4f8a3a, { jitter: 0.6, solid: false }),
      screen: c(0xf4f1ea, { emit: 0xdfe8ff, emitK: 1.3, mode: 'always', jitter: 0, edge: 0 }),
      bright: [0xd23a3a, 0x3a6ed2, 0xe8c040, 0x3aa05a, 0xe07a30, 0x8a4ab0, 0xf0f0e8, 0x2a2a30, 0xe070a0, 0x40b0b0, 0x9a6a3a, 0xc8d860].map((h) => c(h, { jitter: 0.2 })),
      flowers: [0xe83a5a, 0xf0c030, 0xf07ad0, 0xffffff, 0xe86a2a, 0x9a5ae0].map((h) => c(h, { jitter: 0.3, solid: false })),
    };
    // chasing bulbs: three entries swapped in brightness by the tick
    TS.bulbs = [0, 1, 2].map((k) => c(0xfff2c0 + k, { emit: 0xffd070, emitK: 3.0, mode: 'always', jitter: 0, edge: 0 }));
    C.bulb = TS.bulbs[0];
    // neon that flickers now and then (own palette entries)
    C.flickPink = neon(0xff6fd1, 0xff3fb1); C.flickBlue = neon(0x7fc8fe, 0x3a9cfe); C.flickRed = neon(0xff5a4b, 0xff2a1b); C.flickGreen = neon(0x7dff9b, 0x2aff61);
    TS.flick = [C.flickPink, C.flickBlue, C.flickRed, C.flickGreen].map((i) => ({ i, base: [AF.PAL.emit[i * 4], AF.PAL.emit[i * 4 + 1], AF.PAL.emit[i * 4 + 2]], off: 0 }));
    C.screen2 = c(0x8a8a90, { emit: 0x9aa0b0, emitK: 0.9, mode: 'always', jitter: 0, edge: 0 }); C.screen3 = c(0x2a2a30, { emit: 0x30343c, emitK: 0.6, mode: 'always', jitter: 0, edge: 0 });
    TS.screens = [C.screen, C.screen2, C.screen3].map((i) => ({ i, base: [AF.PAL.emit[i * 4], AF.PAL.emit[i * 4 + 1], AF.PAL.emit[i * 4 + 2]] }));
    C.poseA = c(0x2a2a31, { emit: 0x9aa0b1, emitK: 0.9, mode: 'always', jitter: 0, edge: 0 }); C.poseB = c(0x2a2a32, { emit: 0x9aa0b2, emitK: 0.9, mode: 'always', jitter: 0, edge: 0 });
    C.starA = c(0xdde8fe, { emit: 0xcfe0ff, emitK: 1.6, mode: 'always', jitter: 0, edge: 0 }); C.starB = c(0xdde8fd, { emit: 0xcfe0fe, emitK: 1.6, mode: 'always', jitter: 0, edge: 0 });
    TS.stars = [C.starA, C.starB].map((i) => ({ i, base: [AF.PAL.emit[i * 4], AF.PAL.emit[i * 4 + 1], AF.PAL.emit[i * 4 + 2]] }));
    TS.screen = C.screen; TS.screenBase = [AF.PAL.emit[C.screen * 4], AF.PAL.emit[C.screen * 4 + 1], AF.PAL.emit[C.screen * 4 + 2]];
    return C;
  };
  // a black-and-white film frame: two dancers (one in a silk hat) in a spotlight pool. x,y in 0..1
  TS.filmPix = (x, y) => {
    const C = TS.C, sp = Math.hypot((x - 0.5) * 1.6, y - 0.25);
    const dancer = (cx, hat) => { const dx = Math.abs(x - cx); if (y > 0.2 && y < 0.5 && dx < 0.025) return true; if (y >= 0.5 && y < 0.62 && dx < 0.035) return true; if (y >= 0.62 && y < 0.68 && dx < 0.02) return true; if (hat && y >= 0.68 && y < 0.76 && dx < 0.018) return true; if (hat && y >= 0.68 && y < 0.7 && dx < 0.03) return true; if (!hat && y > 0.2 && y < 0.38 && dx < 0.06 - (y - 0.2) * 0.2) return true; return false; };
    const dancer2 = (cx, hat) => { const dx = x - cx, ax = Math.abs(dx); if (y > 0.2 && y < 0.5 && Math.abs(ax - 0.035 - (0.5 - y) * 0.12) < 0.018) return true; if (y >= 0.5 && y < 0.64 && ax < 0.035) return true; if (y >= 0.58 && y < 0.62 && ax < 0.09) return true; if (y >= 0.64 && y < 0.7 && ax < 0.02) return true; if (hat && y >= 0.7 && y < 0.78 && ax < 0.018) return true; if (hat && y >= 0.7 && y < 0.72 && ax < 0.03) return true; if (!hat && y > 0.2 && y < 0.4 && ax < 0.07 - (y - 0.2) * 0.2) return true; return false; };
    const inA = dancer(0.44, true) || dancer(0.56, false), inB = dancer2(0.4, true) || dancer2(0.6, false);
    if (inA && inB) return C.screen3; if (inA && C.poseA) return C.poseA; if (inB && C.poseB) return C.poseB;
    if (y < 0.2) return sp < 0.35 ? C.screen : C.screen2;
    if (x < 0.08 || x > 0.92) return (Math.floor(x * 60) % 2) ? C.screen3 : C.screen2;
    if (y > 0.9) return C.screen3;
    return sp < 0.45 ? C.screen : C.screen2;
  };
  TS.b3 = (i) => TS.bulbs[((i % 3) + 3) % 3];

  // ---------------------------------------------------------------- frames
  TS.frame = (ox, oz, face) => {
    const V = { W: [1, 0], E: [-1, 0], N: [0, 1], S: [0, -1] }[face], U = [-V[1], V[0]];
    const rotOf = (dx, dz) => (Math.abs(dz) >= Math.abs(dx) ? (dz > 0 ? 0 : 2) : (dx > 0 ? 1 : 3));
    const f = { ox, oz, face, U, V };
    f.w = (u, v) => [ox + U[0] * u + V[0] * v, oz + U[1] * u + V[1] * v];
    f.dir = (du, dv) => [U[0] * du + V[0] * dv, U[1] * du + V[1] * dv];
    f.yaw = (du, dv) => { const d = f.dir(du, dv); return Math.atan2(d[0], d[1]); };
    f.box = (u0, y0, v0, u1, y1, v1) => { const a = f.w(u0, v0), b = f.w(u1, v1); return [Math.min(a[0], b[0]), y0, Math.min(a[1], b[1]), Math.max(a[0], b[0]), y1, Math.max(a[1], b[1])]; };
    f.fill = (u0, y0, v0, u1, y1, v1, c) => { const b = f.box(u0, y0, v0, u1, y1, v1); AF.W.fill(b[0], b[1], b[2], b[3], b[4], b[5], c); };
    f.clear = (u0, y0, v0, u1, y1, v1) => f.fill(u0, y0, v0, u1, y1, v1, 0);
    f.each = (u0, y0, v0, u1, y1, v1, fn) => {
      for (let u = u0; u < u1 - 1e-6; u += 0.25) for (let y = y0; y < y1 - 1e-6; y += 0.25) for (let v = v0; v < v1 - 1e-6; v += 0.25) {
        const c = fn(u, y, v); if (c == null) continue; const p = f.w(u + 0.125, v + 0.125); AF.W.setM(p[0], y + 0.125, p[1], c);
      }
    };
    f.place = (geo, u, y, v, du = 0, dv = -1, collide = false) => { const p = f.w(u, v), d = f.dir(du, dv); AF.placeStatic(geo, p[0], y, p[1], rotOf(d[0], d[1]), { collide }); };
    f.light = (u, y, v, color = 0xffc67a, intensity = 1.2, range = 10, kind = 'interior') => { const p = f.w(u, v); AF.addLight({ x: p[0], y, z: p[1], color, intensity, range, kind }); };
    return f;
  };

  // ---------------------------------------------------------------- props (cached models)
  TS.props = {
    pendant: () => TS.geo('pendant', () => { const C = TS.C, m = M(6, 12, 6); m.box(2, 5, 2, 4, 12, 4, C.brass); m.box(0, 2, 0, 6, 5, 6, C.jade); m.box(1, 1, 1, 5, 2, 5, C.lamp); m.box(2, 0, 2, 4, 1, 4, C.lamp); return m; }, 1 / 8, [0.5, 1, 0.5]),
    globe: () => TS.geo('globe', () => { const C = TS.C, m = M(7, 12, 7); m.box(3, 6, 3, 4, 12, 4, C.brass); m.sphere(3.5, 3.5, 3.5, 3.2, C.lamp); m.box(2, 6, 2, 5, 7, 5, C.brass); return m; }, 1 / 8, [0.5, 1, 0.5]),
    brassLamp: () => TS.geo('brasslamp', () => { const C = TS.C, m = M(12, 10, 12); m.box(5, 3, 5, 7, 10, 7, C.brass); m.box(1, 3, 5, 11, 4, 7, C.brass); m.box(5, 3, 1, 7, 4, 11, C.brass); for (const [x, z] of [[1, 5], [10, 5], [5, 1], [5, 10]]) { m.box(x, 0, z, x + 2, 3, z + 2, C.lamp); m.box(x, 3, z, x + 2, 4, z + 2, C.gold); } return m; }, 1 / 8, [0.5, 1, 0.5]),
    stool: () => TS.geo('stool', () => { const C = TS.C, m = M(4, 6, 4); m.box(1, 0, 1, 3, 5, 3, C.chrome); m.box(0, 0, 0, 4, 1, 4, C.chrome); m.box(0, 5, 0, 4, 6, 4, C.red); return m; }, 1 / 8, [0.5, 0, 0.5]),
    chair: (col) => TS.geo('chair' + col, () => { const C = TS.C, m = M(4, 8, 4); m.box(0, 0, 0, 1, 3, 1, C.woodD); m.box(3, 0, 0, 4, 3, 1, C.woodD); m.box(0, 0, 3, 1, 3, 4, C.woodD); m.box(3, 0, 3, 4, 3, 4, C.woodD); m.box(0, 3, 0, 4, 4, 4, col); m.box(0, 4, 0, 4, 8, 1, C.woodD); return m; }, 1 / 8, [0.5, 0, 0.5]),
    table: (top) => TS.geo('rtable' + top, () => { const C = TS.C, m = M(8, 6, 8); m.box(3, 0, 3, 5, 6, 5, C.iron); m.box(2, 0, 2, 6, 1, 6, C.iron); m.sphere(3.5, 5.5, 3.5, 3.9, top, (x, y) => (y === 5 ? top : 0)); return m; }, 1 / 8, [0.5, 0, 0.5]),
    tlamp: (col) => TS.geo('tlamp' + col, () => { const m = M(3, 4, 3); m.box(1, 0, 1, 2, 2, 2, TS.C.brass); m.box(0, 2, 0, 3, 4, 3, col); return m; }, 1 / 8, [0.5, 0, 0.5]),
    register: () => TS.geo('register', () => { const C = TS.C, m = M(5, 5, 4); m.box(0, 0, 0, 5, 3, 4, C.brass); m.box(1, 3, 0, 4, 5, 2, C.brass); m.box(1, 3, 2, 4, 4, 4, C.black); return m; }, 1 / 8, [0.5, 0, 0.5]),
    tank: () => TS.geo('tank', () => { const C = TS.C, m = M(20, 38, 20), wd = AF.col(0x7a5a3a, { jitter: 0.6 }); for (const [x, z] of [[3, 3], [16, 3], [3, 16], [16, 16]]) m.box(x, 0, z, x + 1, 14, z + 1, C.iron); m.box(2, 13, 2, 18, 14, 18, C.iron); m.sphere(9.5, 24, 9.5, 8.5, wd, (x, y) => (y >= 14 && y < 32 ? ((y % 5 === 0) ? C.iron : wd) : 0)); for (let y = 32; y < 38; y++) { const r = 8.5 - (y - 32) * 1.4; m.sphere(9.5, y, 9.5, Math.max(0.5, r), C.iron, (x, yy) => (yy === y ? C.iron : 0)); } m.line(18, 0, 10, 18, 30, 10, C.iron); return m; }, 1 / 8, [0.5, 0, 0.5]),
    picture: (i) => TS.geo('pic' + (i % 6), () => { const C = TS.C, r = AF.rng(i * 31 + 5), m = M(8, 6, 1); m.box(0, 0, 0, 8, 6, 1, C.gold); for (let x = 1; x < 7; x++) for (let y = 1; y < 5; y++) m.set(x, y, 0, y < 3 ? C.bright[(i + (x > 3 ? 1 : 3)) % 12] : C.bright[Math.floor(r() * 12)]); return m; }, 1 / 8, [0.5, 0, 0]),
    poster: (i) => TS.geo('poster' + (i % 8), () => { const C = TS.C, r = AF.rng(i * 17 + 3), m = M(7, 10, 1), bg = C.bright[i % 12]; m.box(0, 0, 0, 7, 10, 1, C.gold); m.box(1, 1, 0, 6, 9, 1, bg); m.box(2, 3, 0, 5, 7, 1, C.bright[(i + 5) % 12]); m.box(1, 8, 0, 6, 9, 1, C.white); m.set(3, 5, 0, C.white); m.set(2 + Math.floor(r() * 3), 2, 0, C.black); return m; }, 1 / 8, [0.5, 0, 0]),
    plant: () => TS.geo('plant', () => { const C = TS.C, m = M(6, 12, 6); m.box(1, 0, 1, 5, 3, 5, C.terra); m.sphere(3, 7, 3, 3.2, C.leaf); m.box(2, 3, 2, 4, 6, 4, C.wood); return m; }, 1 / 8, [0.5, 0, 0.5]),
    crate: (i) => TS.geo('crate' + (i % 3), () => { const C = TS.C, m = M(6, 5, 6); m.box(0, 0, 0, 6, 5, 6, C.woodL); m.box(0, 4, 0, 6, 5, 6, C.wood); for (let x = 0; x < 6; x++) { m.set(x, 2, 0, C.wood); m.set(x, 2, 5, C.wood); } const k = C.bright[(i * 3) % 12]; m.box(1, 5, 1, 5, 6, 5, k); return m; }, 1 / 8, [0.5, 0, 0.5]),
    bench: () => TS.geo('pbench', () => { const C = TS.C, m = M(16, 7, 5); m.box(0, 0, 1, 1, 3, 4, C.iron); m.box(15, 0, 1, 16, 3, 4, C.iron); m.box(0, 3, 0, 16, 4, 5, C.woodL); m.box(0, 4, 4, 16, 7, 5, C.woodL); return m; }, 1 / 8, [0.5, 0, 0.5]),
  };
  // shelf unit full of goods (3 m wide, 2.5 m tall, 0.5 m deep), front on +z — one look per kind of shop
  TS.goods = (kind, seed) => TS.geo('goods-' + kind + (seed % 3), () => {
    const C = TS.C, r = AF.rng(seed * 97 + kind.length * 13), m = M(24, 20, 4);
    const dark = ['records', 'tobacco', 'chandlery', 'luggage', 'pawn'].includes(kind), fr = kind === 'camera' || kind === 'bottles' ? C.chrome : kind === 'candy' ? C.white : dark ? C.woodD : C.wood;
    const tan = AF.col(0xc8a870, { jitter: 0.3 }), leather = AF.col(0x7a4a2a, { jitter: 0.3 }), paint = C.bright;
    if (kind === 'hardware') {   // pegboard with hanging tools over paint cans
      m.box(0, 0, 0, 24, 20, 1, AF.col(0xa88a5a, { jitter: 0.2 }));
      for (let x = 1; x < 24; x += 2) for (let y = 9; y < 20; y += 2) m.set(x, y, 1, C.woodD);
      for (let x = 2; x < 22; x += 3) { const t = Math.floor(r() * 3); if (t === 0) { m.box(x, 13, 1, x + 1, 18, 2, C.woodL); m.box(x - 1, 17, 1, x + 2, 18, 2, C.iron); } else if (t === 1) { m.box(x, 11, 1, x + 2, 17, 2, C.steel); m.box(x, 17, 1, x + 2, 18, 2, C.woodL); } else { m.box(x, 12, 1, x + 1, 18, 2, C.red); m.box(x - 1, 12, 1, x + 2, 13, 2, C.steel); } }
      m.box(0, 0, 0, 24, 1, 4, C.woodD); m.box(0, 5, 0, 24, 6, 4, C.woodD);
      for (let x = 1; x < 23; x += 3) for (const y of [1, 6]) { m.box(x, y, 1, x + 2, y + 3, 3, C.steel); m.box(x, y + 1, 1, x + 2, y + 2, 3, paint[Math.floor(r() * 12)]); }
      return m;
    }
    m.box(0, 0, 0, 24, 20, 1, fr); m.box(0, 0, 0, 1, 20, 4, fr); m.box(23, 0, 0, 24, 20, 4, fr);
    for (const y of [0, 5, 10, 15]) m.box(0, y, 0, 24, y + 1, 4, kind === 'camera' || kind === 'candy' ? C.glass : fr);
    m.box(0, 19, 0, 24, 20, 4, fr); m.box(0, 0, 0, 24, 1, 4, fr);
    for (const y of [1, 6, 11, 16]) for (let x = 1; x < 23;) {
      const pick = C.bright[Math.floor(r() * 12)];
      if (kind === 'books') { const w = 1, h = 2 + Math.floor(r() * 2); m.box(x, y, 1, x + w, y + h, 4, pick); x += w; }
      else if (kind === 'bread') { if (y === 16) { m.box(x, y, 1, x + 3, y + 1, 4, AF.col(0xc8a060)); m.box(x, y + 1, 1, x + 3, y + 2, 4, AF.col(0xe8d0a0)); m.set(x + 1, y + 2, 2, C.red); x += 4; } else { m.box(x, y, 1, x + 3, y + 2, 4, [AF.col(0xc8883a), AF.col(0xa8662a), AF.col(0xe0b070)][Math.floor(r() * 3)]); x += 4; } }
      else if (kind === 'bottles') { m.box(x, y, 2, x + 1, y + 3, 3, [C.glass, C.jade, AF.col(0x8a4a1a), C.red][Math.floor(r() * 4)]); m.set(x, y + 3, 2, C.gold); x += 2; }
      else if (kind === 'records') { if (y >= 11) { m.box(x, y, 3, x + 3, y + 3, 4, pick); m.set(x + 1, y + 1, 3, C.black); m.set(x + 2, y + 2, 3, C.white); x += 4; } else { m.box(x, y, 1, x + 1, y + 3, 4, r() < 0.5 ? C.black : pick); x += 1; } }
      else if (kind === 'hats') { m.box(x, y, 1, x + 3, y + 1, 4, pick); m.box(x + 1, y + 1, 1, x + 2, y + 2, 3, pick); m.set(x + 1, y + 1, 3, C.black); x += 4; }
      else if (kind === 'candy') { m.box(x, y, 1, x + 3, y + 3, 4, C.glass); m.box(x, y, 2, x + 3, y + 2, 3, pick); m.box(x, y + 3, 1, x + 3, y + 4, 4, C.gold); x += 4; }
      else if (kind === 'tobacco') { if (y === 16) { for (let k = 0; k < 3; k++) m.box(x + k, y, 2, x + k + 1, y + 2, 3, k % 2 ? C.woodL : C.black); m.box(x, y + 2, 1, x + 3, y + 3, 4, C.woodD); x += 4; } else { m.box(x, y, 1, x + 4, y + 1, 4, AF.col(0xa8703a)); m.box(x, y + 1, 1, x + 4, y + 2, 4, y % 2 ? C.red : C.gold); m.box(x + 1, y + 2, 2, x + 3, y + 3, 3, C.steel); x += 5; } }
      else if (kind === 'chandlery') { const t = Math.floor(r() * 3); if (t === 0) { m.box(x, y, 1, x + 3, y + 2, 4, tan); m.set(x + 1, y + 1, 3, C.woodD); x += 4; } else if (t === 1) { m.box(x, y, 1, x + 2, y + 1, 3, C.brass); m.box(x, y + 1, 1, x + 2, y + 3, 3, C.glass); m.box(x, y + 3, 1, x + 2, y + 4, 3, C.brass); x += 3; } else { m.box(x, y, 1, x + 2, y + 2, 3, C.brass); m.set(x, y + 2, 2, C.brass); x += 3; } }
      else if (kind === 'camera') { m.box(x, y, 1, x + 3, y + 2, 3, C.black); m.set(x + 1, y + 1, 3, C.steel); m.set(x, y + 2, 2, C.chrome); x += 4; }
      else if (kind === 'pawn') { const t = Math.floor(r() * 4); if (t === 0) { m.box(x, y, 1, x + 3, y + 3, 3, C.woodD); m.box(x + 1, y + 1, 3, x + 2, y + 2, 4, C.white); } else if (t === 1) { m.box(x, y, 2, x + 3, y + 1, 3, C.gold); m.box(x + 2, y + 1, 2, x + 3, y + 3, 3, C.gold); } else if (t === 2) { m.box(x, y, 1, x + 3, y + 2, 4, C.woodL); m.box(x + 1, y + 1, 4 - 1, x + 2, y + 2, 4, C.gold); } else { m.box(x, y, 1, x + 2, y + 1, 3, C.steel); m.set(x, y + 1, 2, C.bright[2]); } x += 4; }
      else if (kind === 'paper') { m.box(x, y, 1, x + 3, y + 1 + Math.floor(r() * 3), 4, r() < 0.5 ? C.white : C.cream); m.set(x + 1, y, 3, pick); x += 4; }
      else if (kind === 'luggage') { m.box(x, y, 1, x + 5, y + 3, 4, r() < 0.5 ? leather : C.woodL); m.box(x + 2, y + 3, 2, x + 3, y + 4, 3, C.brass); m.box(x, y + 1, 3, x + 5, y + 2, 4, C.brass); x += 6; }
      else if (kind === 'toys') { const t = Math.floor(r() * 3); if (t === 0) { m.box(x, y, 1, x + 2, y + 2, 3, pick); m.set(x, y + 2, 2, C.bright[(x + 3) % 12]); } else if (t === 1) { m.box(x, y, 1, x + 3, y + 1, 3, C.red); m.set(x, y, 3, C.black); m.set(x + 2, y, 3, C.black); m.box(x + 1, y + 1, 1, x + 2, y + 2, 3, C.navy); } else { m.box(x, y, 1, x + 2, y + 3, 3, pick); m.set(x, y + 3, 2, C.cream); } x += 3; }
      else if (kind === 'cans') { m.box(x, y, 1, x + 2, y + 2, 3, pick); m.box(x, y + 2, 1, x + 2, y + 3, 3, C.steel); x += 2; }
      else { const w = 2 + Math.floor(r() * 2), h = 1 + Math.floor(r() * 2); m.box(x, y, 1, x + w, y + h, 4, pick); x += w + 1; }
    }
    return m;
  }, 1 / 8, [0.5, 0, 0]);
  // per-kind interior styles: wallpaper treatment, lamp, shelves, floor props
  TS.KIT = { 'bs-music': 'records', 'bs-candy': 'candy', 'bs-stationer': 'paper', 'bs-luggage': 'luggage', 'bs-cigar': 'tobacco', hatshop: 'hats', florist: 'florist', drugstore: 'bottles', tobacconist: 'tobacco', bakery: 'bread', records: 'records', bookshop: 'books', camera: 'camera', fivedime: 'toys', chandlery: 'chandlery', pawn: 'pawn', hardware: 'hardware' };
  TS.styleOf = (kit) => {
    const C = TS.C, c = AF.col;
    const rose = c(0xe8b0b4, { jitter: 0.2 }), roseW = c(0xf6e2e0, { jitter: 0.2 }), blue = c(0x8fb0cc, { jitter: 0.2 }), blueL = c(0xd8e6f0, { jitter: 0.2 }), green = c(0x9cc3a4, { jitter: 0.2 }), greenL = c(0xe0eedc, { jitter: 0.2 }), yellow = c(0xf0d890, { jitter: 0.2 }), yellowL = c(0xfaf0cc, { jitter: 0.2 }), sage = c(0xb8c4b0, { jitter: 0.2 });
    const S = {
      candy: { walls: 'stripe', a: rose, b: roseW, lamp: 'globe' }, chandlery: { walls: 'panel', a: c(0x4f6f88, { jitter: 0.2 }), b: C.white, lamp: 'globe' }, tobacco: { walls: 'panel', a: C.woodD, b: C.bronze, lamp: 'brass' },
      records: { walls: 'plain', a: blue, lamp: 'pendant' }, camera: { walls: 'plain', a: sage, lamp: 'globe' }, bread: { walls: 'stripe', a: yellowL, b: C.cream, lamp: 'globe' },
      hats: { walls: 'stripe', a: rose, b: C.cream, lamp: 'brass' }, pawn: { walls: 'plain', a: green, lamp: 'pendant' }, hardware: { walls: 'panel', a: C.woodL, b: C.wood, lamp: 'pendant' },
      florist: { walls: 'stripe', a: green, b: greenL, lamp: 'globe' }, books: { walls: 'panel', a: C.woodD, b: C.wood, lamp: 'pendant' }, paper: { walls: 'stripe', a: blue, b: blueL, lamp: 'globe' },
      luggage: { walls: 'panel', a: C.wood, b: C.woodD, lamp: 'brass' }, toys: { walls: 'stripe', a: yellow, b: yellowL, lamp: 'globe' }, bottles: { walls: 'plain', a: greenL, lamp: 'globe' },
    };
    return S[kit] || { walls: 'plain', a: C.plaster, lamp: 'pendant' };
  };
  // floor props per kind (ctx from TS.shop; counter on side L or R, free side = the other)
  TS.kitFloor = (kit, x, left) => {
    const C = TS.C, f = x.f, u0 = x.u0, u1 = x.u1, d = x.d, mid = (u0 + u1) / 2, free = left ? u1 - 1.4 : u0 + 1.4, fd = left ? -1 : 1;
    const g = (k, fn, vs = 1 / 8, an = [0.5, 0, 0.5]) => TS.geo('kit-' + k, fn, vs, an);
    const glassCase = (fill) => g('case-' + fill, () => { const m = M(16, 8, 6); m.box(0, 0, 0, 16, 5, 6, C.woodD); m.box(0, 5, 0, 16, 8, 6, C.glass); m.box(0, 7, 0, 16, 8, 6, C.chrome); const r = AF.rng(fill.length * 7); for (let xx = 1; xx < 15; xx += 2) m.box(xx, 5, 1 + (xx % 3), xx + 1, 6, 2 + (xx % 3), fill === 'jewel' ? [C.gold, C.chrome, C.bright[1], C.bright[0]][Math.floor(r() * 4)] : fill === 'cam' ? C.black : C.bright[Math.floor(r() * 12)]); m.box(1, 6, 1, 15, 7, 5, C.lamp); return m; });
    if (kit === 'candy') { f.place(glassCase('sweets'), mid, 0.5, d * 0.5, 0, -1, true); f.place(g('gumball', () => { const m = M(6, 12, 6); m.box(2, 0, 2, 4, 6, 4, C.red); m.sphere(3, 9, 3, 2.8, C.glass); for (let k = 0; k < 8; k++) m.set(2 + (k % 3), 7 + (k % 3), 2 + (k >> 1) % 3, C.bright[k]); m.box(2, 11, 2, 4, 12, 4, C.red); return m; }), free, 0.5, 2.2, 0, -1, true); }
    else if (kit === 'chandlery') {
      f.place(g('wheel', () => { const m = M(15, 15, 2); for (let a = 0; a < 48; a++) { const t = a / 48 * Math.PI * 2; m.set(Math.round(7 + Math.cos(t) * 5), Math.round(7 + Math.sin(t) * 5), 0, C.wood); } for (let k = 0; k < 8; k++) { const t = k / 8 * Math.PI * 2; m.line(7, 7, 1, Math.round(7 + Math.cos(t) * 7), Math.round(7 + Math.sin(t) * 7), 1, C.woodD); } m.box(6, 6, 0, 9, 9, 2, C.brass); return m; }, 1 / 8, [0.5, 0, 0]), left ? u1 - 0.5 : u0 + 0.5, 1.6, d * 0.5, fd, 0);
      for (let i = 0; i < 3; i++) f.place(g('coil', () => { const m = M(8, 3, 8); m.sphere(4, 1, 4, 3.8, AF.col(0xc8a870), (xx, y, z) => (Math.hypot(xx - 3.5, z - 3.5) > 1.2 ? AF.col(0xc8a870) : 0)); return m; }), mid - 1 + i, 0.5, 3.0 + (i % 2), 0, -1, true);
      f.place(g('oars', () => { const m = M(6, 28, 3); for (const xx of [0, 3]) { m.box(xx, 4, 1, xx + 1, 28, 2, C.woodL); m.box(xx, 0, 0, xx + 2, 5, 3, C.woodL); } return m; }), free, 0.5, d - 2.2, fd, 0, true);
    } else if (kit === 'tobacco') {
      f.place(g('sailor', () => { const m = M(8, 16, 6); const navy = C.navy; m.box(2, 0, 2, 6, 3, 5, C.woodD); m.box(2, 3, 2, 3, 7, 4, navy); m.box(5, 3, 2, 6, 7, 4, navy); m.box(1, 7, 1, 7, 11, 5, navy); m.box(2, 9, 4, 6, 11, 5, C.white); m.box(2, 11, 2, 6, 14, 5, AF.col(0xe0b090)); m.box(2, 14, 1, 6, 15, 6, C.white); m.box(3, 15, 2, 5, 16, 5, C.white); m.box(0, 7, 2, 1, 11, 4, navy); m.box(7, 8, 3, 8, 12, 5, AF.col(0xe0b090)); m.box(6, 12, 4, 8, 13, 6, C.woodD); m.box(0, 0, 0, 8, 1, 6, C.gold); return m; }), free, 0.5, 2.0, 0, -1, true);
      f.place(g('piperack', () => { const m = M(12, 6, 4); m.box(0, 0, 0, 12, 1, 4, C.woodD); m.box(0, 4, 0, 12, 5, 4, C.woodD); for (let xx = 1; xx < 12; xx += 2) { m.box(xx, 1, 2, xx + 1, 5, 3, C.black); m.set(xx, 5, 2, C.woodL); } return m; }), left ? u0 + 2.125 : u1 - 2.125, 1.5, d * 0.5 + 1.5, fd, 0);
    } else if (kit === 'records') {
      f.place(g('gramophone', () => { const m = M(8, 14, 8); m.box(1, 0, 1, 7, 4, 7, C.woodD); m.box(2, 4, 2, 6, 5, 6, C.black); m.line(4, 5, 4, 4, 9, 6, C.brass); for (let rr = 1; rr < 5; rr++) m.sphere(4, 9 + rr, 7, rr, C.brass, (xx, y, z) => (y === 9 + rr && z >= 6 ? C.brass : 0)); return m; }), free, 0.5, 2.5, 0, -1, true);
      for (let i = 0; i < 2; i++) f.place(g('recbin', () => { const m = M(20, 7, 6); m.box(0, 0, 0, 20, 4, 6, C.woodD); for (let xx = 1; xx < 19; xx++) m.box(xx, 4, 1, xx + 1, 7, 5, (xx % 3 === 0) ? C.black : C.bright[xx % 12]); return m; }), mid, 0.5, 5.5 + i * 3, 0, -1, true);
      f.place(g('console', () => { const m = M(8, 10, 5); m.box(0, 0, 0, 8, 10, 5, C.wood); m.sphere(4, 6, 5, 3, C.woodL, (xx, y, z) => (z >= 4 ? C.woodL : 0)); m.box(1, 1, 5, 7, 3, 5, C.gold); m.set(2, 2, 5, C.black); m.set(6, 2, 5, C.black); return m; }, 1 / 8, [0.5, 0, 0.5]), free, 0.5, d - 3, fd, 0, true);
    } else if (kit === 'camera') { f.place(glassCase('cam'), mid, 0.5, d * 0.4, 0, -1, true); f.place(glassCase('cam'), mid, 0.5, d * 0.65, 0, -1, true); f.place(g('tripod', () => { const m = M(6, 14, 6); m.line(3, 10, 3, 0, 0, 0, C.woodL); m.line(3, 10, 3, 5, 0, 1, C.woodL); m.line(3, 10, 3, 3, 0, 5, C.woodL); m.box(1, 10, 1, 5, 13, 5, C.black); m.box(2, 11, 5, 4, 12, 6, C.steel); return m; }), free, 0.5, 2.3, 0, -1, true); }
    else if (kit === 'bread') { const rack = g('breadrack', () => { const m = M(10, 16, 5); for (const xx of [0, 9]) m.box(xx, 0, 0, xx + 1, 16, 5, C.chrome); for (let y = 2; y < 16; y += 4) { m.box(0, y, 0, 10, y + 1, 5, C.chrome); for (let xx = 1; xx < 9; xx += 3) m.box(xx, y + 1, 1, xx + 2, y + 3, 4, [AF.col(0xc8883a), AF.col(0xe0b070)][(xx + y) % 2]); } return m; }); f.place(rack, free, 0.5, 5, fd, 0, true); f.place(rack, free, 0.5, 7, fd, 0, true); f.place(g('cake', () => { const m = M(6, 7, 6); m.box(2, 0, 2, 4, 2, 4, C.chrome); m.box(0, 2, 0, 6, 3, 6, C.chrome); m.box(1, 3, 1, 5, 6, 5, C.white); m.box(1, 4, 1, 5, 5, 5, C.bright[8]); m.set(3, 6, 3, C.red); return m; }), left ? u0 + 2.125 : u1 - 2.125, 1.5, 6.5, 0, -1); }
    else if (kit === 'hats') { const hs = g('hatstand2', () => { const m = M(4, 14, 4); m.box(0, 0, 0, 4, 1, 4, C.brass); m.box(1, 1, 1, 3, 11, 3, C.brass); m.box(0, 11, 0, 4, 12, 4, C.bright[8]); m.box(1, 12, 1, 3, 14, 3, C.bright[8]); m.set(3, 12, 1, C.navy); return m; }); for (let i = 0; i < 4; i++) f.place(hs, mid + (i % 2 ? 0.6 : -0.6), 0.5, 5 + i * 1.6, 0, -1, true); f.fill(free + fd * 0.8, 1.0, 9, free + fd * 0.8 + 0.25 * fd, 3.0, 10.5, C.glass); }
    else if (kit === 'pawn') { f.place(glassCase('jewel'), mid, 0.5, d * 0.45, 0, -1, true); f.place(g('guitar', () => { const m = M(6, 16, 2); m.sphere(3, 3, 1, 2.8, C.woodL); m.box(2, 6, 0, 4, 15, 1, C.woodD); m.box(1, 15, 0, 5, 16, 1, C.woodD); m.set(3, 3, 1, C.black); return m; }, 1 / 8, [0.5, 0, 0]), left ? u1 - 0.5 : u0 + 0.5, 1.5, 5, fd, 0); for (let i = 0; i < 3; i++) f.place(g('wclock', () => { const m = M(5, 5, 1); m.box(0, 0, 0, 5, 5, 1, C.woodD); m.box(1, 1, 0, 4, 4, 1, C.white); m.set(2, 2, 0, C.black); m.set(2, 3, 0, C.black); return m; }, 1 / 8, [0.5, 0, 0]), left ? u1 - 0.5 : u0 + 0.5, 2.4 + (i % 2) * 0.6, 8 + i * 1.2, fd, 0); }
    else if (kit === 'hardware') { const can = g('paintpyr', () => { const m = M(12, 9, 6); for (let row = 0; row < 3; row++) for (let k = 0; k < 3 - row; k++) { const xx = row * 2 + k * 4; m.box(xx, row * 3, 1, xx + 3, row * 3 + 3, 5, C.steel); m.box(xx, row * 3 + 1, 1, xx + 3, row * 3 + 2, 5, C.bright[(row * 3 + k) % 12]); } return m; }); f.place(can, mid, 0.5, 3.0, 0, -1, true); f.place(g('ladder', () => { const m = M(6, 24, 2); m.box(0, 0, 0, 1, 24, 2, C.woodL); m.box(5, 0, 0, 6, 24, 2, C.woodL); for (let y = 2; y < 24; y += 4) m.box(0, y, 0, 6, y + 1, 2, C.woodL); return m; }, 1 / 8, [0.5, 0, 0]), free, 0.5, d - 1.5, 0, -1); }
    else if (kit === 'florist') { const bucket = g('bucket', () => { const m = M(5, 9, 5); m.box(0, 0, 0, 5, 3, 5, C.steel); m.box(1, 3, 1, 4, 5, 4, C.leaf); for (let k = 0; k < 7; k++) m.set(k % 5, 5 + (k % 4), (k * 2) % 5, C.flowers[k % 6]); return m; }); for (let v = 3; v < d - 2; v += 0.8) f.place(bucket, free, 0.5, v, 0, -1); for (let k = 0; k < 5; k++) f.place(bucket, mid - 1 + k * 0.6, 0.5, d * 0.5, 0, -1); }
    else if (kit === 'books') { f.place(g('booktable', () => { const m = M(14, 8, 8); m.box(0, 5, 0, 14, 6, 8, C.woodD); for (const [a, b] of [[0, 0], [13, 0], [0, 7], [13, 7]]) m.box(a, 0, b, a + 1, 5, b + 1, C.woodD); for (let xx = 1; xx < 13; xx += 3) m.box(xx, 6, 2, xx + 2, 6 + 1 + (xx % 2), 6, C.bright[xx % 12]); return m; }), mid, 0.5, d * 0.5, 0, -1, true); }
    else if (kit === 'paper' || kit === 'toys' || kit === 'luggage') { const tbl = g('disp-' + kit, () => { const m = M(14, 9, 8), r = AF.rng(kit.length); m.box(0, 5, 0, 14, 6, 8, C.woodL); m.box(1, 0, 1, 13, 5, 7, C.woodD); for (let xx = 1; xx < 13; xx += 3) { const h = kit === 'luggage' ? 3 : 1 + Math.floor(r() * 3); m.box(xx, 6, 2, xx + 2, 6 + h, 6, kit === 'paper' ? C.white : kit === 'luggage' ? AF.col(0x7a4a2a) : C.bright[Math.floor(r() * 12)]); } return m; }); f.place(tbl, mid, 0.5, d * 0.5, 0, -1, true); if (kit === 'toys') f.place(g('rockhorse', () => { const m = M(10, 9, 4); for (let xx = 0; xx < 10; xx++) m.set(xx, Math.abs(xx - 4.5) > 3.5 ? 1 : 0, 1, C.red); m.box(2, 2, 1, 3, 4, 3, C.woodL); m.box(7, 2, 1, 8, 4, 3, C.woodL); m.box(2, 4, 1, 8, 6, 3, C.white); m.box(7, 6, 1, 9, 9, 3, C.white); m.set(9, 8, 2, C.black); return m; }), free, 0.5, 2.5, fd, 0, true); }
  };
  // striped awning, w metres wide, 1.75 m deep, top at the wall
  TS.awning = (w, c1, c2) => TS.geo('awn' + w + '-' + c1 + '-' + c2, () => {
    const W = Math.round(w * 8), m = M(W, 8, 15);
    for (let z = 0; z < 14; z++) { const y = 7 - Math.floor(z * 5 / 14); for (let x = 0; x < W; x++) { const c = (Math.floor(x / 4) & 1) ? c2 : c1; m.set(x, y, z, c); m.set(x, y - 1, z, c); } }
    for (let x = 0; x < W; x++) { const c = (Math.floor(x / 4) & 1) ? c2 : c1, drop = (x % 4 === 1 || x % 4 === 2) ? 3 : 2; for (let y = 1; y < 1 + drop; y++) m.set(x, y, 14, c); }
    for (let z = 0; z < 14; z++) { m.set(0, 6 - Math.floor(z * 5 / 14), z, TS.C.iron); m.set(W - 1, 6 - Math.floor(z * 5 / 14), z, TS.C.iron); }
    return m;
  }, 1 / 8, [0.5, 1, 0]);
  // sign: text on a board. neon = letters glow.
  TS.sign = (text, fg, bg, vs, key) => TS.geo('sign-' + (key || text) + fg + '-' + bg + '-' + vs, () => AF.textModel(text, fg, bg ? { bg, pad: 1, depth: 1 } : { pad: 0, depth: 1 }), vs, [0.5, 0.5, 0]);
  // vertical blade sign (letters stacked, visible on both faces), bulbs up the edges
  // neon sign where one letter flickers on its own
  TS.signFlick = (text, fg, idx, fcol, vs) => TS.geo('signf-' + text + fg + '-' + idx + '-' + vs, () => { const m = AF.textModel(text, fg, { pad: 0, depth: 1 }); for (let x = idx * 6; x < idx * 6 + 5; x++) for (let y = 0; y < m.h; y++) for (let z = 0; z < m.d; z++) if (m.get(x, y, z)) m.set(x, y, z, fcol); return m; }, vs, [0.5, 0.5, 0]);
  TS.blade = (text, fg, bg, key, vs = 1 / 6) => TS.geo('blade-' + key, () => {
    const n = text.length, m = M(11, n * 9 + 4, 3);
    m.box(0, 0, 0, 11, n * 9 + 4, 3, bg);
    for (let i = 0; i < n; i++) {
      const g = AF.font5x7[text[i]] || AF.font5x7['?'], y0 = (n - 1 - i) * 9 + 3;
      for (let r = 0; r < 7; r++) for (let c = 0; c < 5; c++) if (g[r] & (1 << (4 - c))) { m.set(3 + c, y0 + 6 - r, 2, fg); m.set(3 + (4 - c), y0 + 6 - r, 0, fg); }
    }
    for (let y = 0; y < m.h; y++) for (const x of [0, 10]) { m.set(x, y, 0, TS.b3(y + x)); m.set(x, y, 2, TS.b3(y + x)); m.set(x, y, 1, TS.b3(y + x)); }
    for (let x = 0; x < 11; x++) { m.set(x, 0, 1, TS.b3(x)); m.set(x, m.h - 1, 1, TS.b3(x)); }
    return m;
  }, vs, [0, 0, 0.5]);

  // ---------------------------------------------------------------- facade pieces
  // punched windows on a facade face (v = 0) between y0..y1, u0..u1
  TS.windows = (f, u0, u1, y0, y1, trim, seed, storey = 3.75, h = 2.25, sp = 2.5) => {
    const C = TS.C, n = Math.max(1, Math.floor((u1 - u0 - 0.5) / sp)), start = u0 + (u1 - u0 - (n * sp - (sp - 1.25))) / 2;
    let k = 0;
    for (let y = y0; y + h <= y1 + 1e-6; y += storey) for (let i = 0; i < n; i++, k++) {
      const u = Math.round((start + i * sp) * 4) / 4, t = TS.hash(seed, k), wc = C.win[t < 0.42 ? 0 : t < 0.62 ? 1 : t < 0.9 ? 2 : 3];
      f.clear(u, y, 0, u + 1.25, y + h, 0.25); f.fill(u, y, 0.25, u + 1.25, y + h, 0.5, wc); f.fill(u + 0.5, y, 0.25, u + 0.75, y + h, 0.5, trim);
      f.fill(u - 0.25, y - 0.25, -0.25, u + 1.5, y, 0.25, trim); f.fill(u - 0.25, y + h, 0, u + 1.5, y + h + 0.25, 0.25, trim);
    }
  };
  // a side face of a building (u = uEdge, the face points along -du) → a rotated frame for windows
  TS.sideFrame = (f, uEdge, v0, left) => {
    // left side (u = u0) faces -u; its own frame: v' into the building = +u, u' = along -v ... build from world vectors
    const out = left ? f.dir(-1, 0) : f.dir(1, 0), face = out[0] < -0.5 ? 'W' : out[0] > 0.5 ? 'E' : out[1] < -0.5 ? 'N' : 'S';
    const p = f.w(uEdge, v0), g = TS.frame(0, 0, face);
    // choose origin so that side u' increases along the building depth either way; return frame + range mapper
    const s = TS.frame(p[0], p[1], face); return s;
  };
  TS.fireEscape = (floors) => TS.geo('fe' + floors, () => {
    const C = TS.C, H = Math.round(floors * 3.75 * 8), m = M(32, H + 8, 10);
    for (let k = 0; k < floors; k++) {
      const y = Math.round(k * 3.75 * 8);
      m.box(0, y, 0, 32, y + 1, 10, C.iron);
      for (let x = 0; x < 32; x += 2) m.box(x, y + 1, 9, x + 1, y + 8, 10, C.iron);
      m.box(0, y + 7, 9, 32, y + 8, 10, C.iron); m.box(0, y + 1, 0, 1, y + 8, 10, C.iron); m.box(31, y + 1, 0, 32, y + 8, 10, C.iron);
      if (k < floors - 1) for (let s = 0; s < 24; s++) { const yy = y + 1 + Math.round(s * 30 / 24); m.box(4 + s, yy, 2, 5 + s, yy + 1, 8, C.iron); }
      if (k === 0) { for (let yy = y - 20; yy < y; yy += 3) if (yy >= 0) m.box(26, yy, 3, 30, yy + 1, 4, C.iron); }
    }
    return m;
  }, 1 / 8, [0.5, 0, 0]);

  // roof dressing on a flat roof (top at y = H over u0..u1, v 0..d)
  TS.roof = (f, u0, u1, d, H, seed, o = {}) => {
    const C = TS.C, r = AF.rng(seed * 131 + 7), w = u1 - u0, wall = o.wall ?? C.brickR, trim = o.trim ?? C.cream;
    f.fill(u0 + 0.25, H - 0.25, 0.25, u1 - 0.25, H, d - 0.25, C.tar);
    // parapet + coping
    f.fill(u0, H, 0, u1, H + 0.75, 0.25, wall); f.fill(u0, H, d - 0.25, u1, H + 0.75, d, wall);
    f.fill(u0, H, 0, u0 + 0.25, H + 0.75, d, wall); f.fill(u1 - 0.25, H, 0, u1, H + 0.75, d, wall);
    f.fill(u0, H + 0.75, -0.25, u1, H + 1.0, 0.5, trim);
    // cornice
    f.fill(u0, H - 1.0, -0.5, u1, H - 0.5, 0, trim); f.fill(u0, H - 0.5, -0.25, u1, H, 0, trim);
    for (let u = u0 + 0.5; u < u1 - 0.5; u += 1.0) f.fill(u, H - 1.25, -0.25, u + 0.25, H - 1.0, 0, trim);   // dentils
    if (o.tank !== false && (o.tank || r() < 0.55) && w >= 6) { const tu = u0 + 1.8 + r() * (w - 3.6); f.place(TS.props.tank(), tu, H, d * (0.45 + r() * 0.25), 0, -1, false); }
    // stair bulkhead with a door
    if (w >= 7 && d >= 8) { const bu = u0 + (r() < 0.5 ? 1 : w - 4), bv = d - 4.5; f.fill(bu, H, bv, bu + 3, H + 2.75, bv + 3, wall); f.fill(bu - 0.25, H + 2.75, bv - 0.25, bu + 3.25, H + 3.0, bv + 3.25, trim); f.fill(bu + 1, H, bv - 0.25, bu + 2, H + 2.25, bv, C.woodD); }
    // chimney / vents / skylight
    const cu = u0 + 0.75 + r() * (w - 2); f.fill(cu, H, d - 1.5, cu + 0.75, H + 2.25, d - 0.75, C.brickB); f.fill(cu - 0.25, H + 2.25, d - 1.75, cu + 1, H + 2.5, d - 0.5, C.granite);
    if (o.chimney) { const p = f.w(cu + 0.375, d - 1.125); AF.addChimney(p[0], H + 2.6, p[1]); }
    if (w >= 5) { const su = u0 + w * 0.5 - 1, sv = d * 0.35; f.fill(su, H, sv, su + 2, H + 0.5, sv + 1.5, C.iron); f.fill(su + 0.25, H + 0.5, sv + 0.25, su + 1.75, H + 0.75, sv + 1.25, C.glass); }
    if (r() < 0.5) { const au = u0 + 1 + r() * (w - 2); f.fill(au, H, 2, au + 0.25, H + 3.5, 2.25, C.iron); f.fill(au - 0.75, H + 3.0, 2, au + 1.0, H + 3.25, 2.25, C.iron); }
  };

  // ---------------------------------------------------------------- generic enterable shop
  // s = {id,name,u0,w,d,h, wall,trim,base, floor:'check'|'wood'|'tile'|'green', paper, sign:{text,fg,bg,vs}, awning:[c1,c2]|null,
  //      door (u offset), goods:'kind', counter:'L'|'R', fit(ctx), left/right: exposed side faces, fe:'L'|'R', roof opts, noDefault}
  TS.shop = (f, s) => {
    const C = TS.cols(), u0 = s.u0, u1 = s.u0 + s.w, d = s.d, H = s.h, SH = s.shopH ?? 4.75;
    const wall = s.wall ?? C.brickR, trim = s.trim ?? C.cream, base = s.base ?? C.granite, pap = s.paper ?? C.plaster;
    const du = u0 + (s.door ?? s.w / 2), dw = s.doorW ?? 2.0, da = du - dw / 2, db = du + dw / 2;
    // mass + hollow ground floor
    f.fill(u0, 0.25, 0, u1, H, d, wall);
    f.clear(u0 + 0.5, 0.5, 0.5, u1 - 0.5, SH, d - 0.5);
    f.fill(u0 + 0.25, SH, 0.5, u1 - 0.25, SH + 0.25, d - 0.25, C.plaster);
    // walls inside
    const kit = s.kit ?? TS.KIT[s.id], sty = kit ? TS.styleOf(kit) : null;
    if (sty && !s.paper) {
      const wfn = (a2) => (u, y, v) => { if (sty.walls === 'panel') return (Math.floor(a2(u, v) * 4) % 6 === 0 || Math.floor(y * 4) % 10 === 0) ? sty.b : sty.a; if (sty.walls === 'stripe') return (Math.floor(a2(u, v) * 2) & 1) ? sty.a : sty.b; return sty.a; };
      f.each(u0 + 0.25, 0.5, 0.5, u0 + 0.5, SH, d - 0.25, wfn((u, v) => v)); f.each(u1 - 0.5, 0.5, 0.5, u1 - 0.25, SH, d - 0.25, wfn((u, v) => v)); f.each(u0 + 0.25, 0.5, d - 0.5, u1 - 0.25, SH, d - 0.25, wfn((u) => u));
      f.fill(u0 + 0.25, SH - 0.5, 0.5, u1 - 0.25, SH - 0.25, d - 0.25, 0); f.fill(u0 + 0.25, SH - 0.5, 0.5, u0 + 0.5, SH - 0.25, d - 0.25, trim); f.fill(u1 - 0.5, SH - 0.5, 0.5, u1 - 0.25, SH - 0.25, d - 0.25, trim); f.fill(u0 + 0.25, SH - 0.5, d - 0.5, u1 - 0.25, SH - 0.25, d - 0.25, trim);
    } else { f.fill(u0 + 0.25, 0.5, 0.5, u0 + 0.5, SH, d - 0.25, pap); f.fill(u1 - 0.5, 0.5, 0.5, u1 - 0.25, SH, d - 0.25, pap); f.fill(u0 + 0.25, 0.5, d - 0.5, u1 - 0.25, SH, d - 0.25, pap); }
    f.fill(u0 + 0.25, 0.5, 0.5, u0 + 0.5, 1.25, d - 0.25, s.dado ?? C.woodD); f.fill(u1 - 0.5, 0.5, 0.5, u1 - 0.25, 1.25, d - 0.25, s.dado ?? C.woodD); f.fill(u0 + 0.25, 0.5, d - 0.5, u1 - 0.25, 1.25, d - 0.25, s.dado ?? C.woodD);
    // floor
    const fl = s.floor ?? 'check', fA = fl === 'wood' ? C.wood : fl === 'green' ? C.tileW : C.tileW, fB = fl === 'wood' ? C.woodL : fl === 'green' ? C.tileG : C.tileK;
    f.each(u0 + 0.25, 0.25, 0, u1 - 0.25, 0.5, d - 0.25, (u, y, v) => {
      if (fl === 'wood') return (Math.floor(u * 4) % 4 === 0) ? C.woodD : ((Math.floor(v * 4 + Math.floor(u) * 3) % 12 === 0) ? fB : fA);
      if (fl === 'tile') return (Math.floor(u * 4) % 4 === 0 || Math.floor(v * 4) % 4 === 0) ? C.tileK : C.tileW;
      return ((Math.floor(u * 2) + Math.floor(v * 2)) & 1) ? fB : fA;
    });
    // shopfront: piers + bulkheads + display glass + transom + sign band
    f.fill(u0, 0.25, 0, u1, SH + 0.25, 0.5, base);
    f.fill(u0, 3.75, 0, u1, SH + 0.25, 0.5, s.signBg ?? trim);
    for (const [a, b] of [[u0 + 0.75, da - 0.5], [db + 0.5, u1 - 0.75]]) if (b - a >= 0.75) {
      f.fill(a, 1.25, 0.25, b, 3.25, 0.5, C.glass); f.clear(a, 1.25, 0, b, 3.25, 0.25);
      f.fill(a, 1.0, -0.25, b, 1.25, 0.25, C.brass);
      f.fill(a, 0.5, 0.5, b, 1.0, 1.25, s.dispC ?? C.woodD);
      if (s.display) s.display(a, b);
      else if (s.goods) for (let u = a + 0.5; u < b - 0.3; u += 0.9) f.place(TS.props.crate(Math.floor(u * 7)), u, 1.0, 0.9, 0, -1);
    }
    f.fill(u0 + 0.5, 3.25, 0.25, u1 - 0.5, 3.75, 0.5, C.prism);
    f.clear(da, 0.5, 0, db, 3.25, 0.5); f.fill(da, 0.25, -0.25, db, 0.5, 0.5, C.marble);
    f.fill(da - 0.25, 0.5, 0, da, 3.5, 0.5, C.brass); f.fill(db, 0.5, 0, db + 0.25, 3.5, 0.5, C.brass);
    f.fill(db, 0.5, 0.5, db + 0.25, 3.0, 1.75, C.woodD); f.fill(db, 1.25, 0.75, db + 0.25, 2.75, 1.5, C.glass);   // door leaf standing open
    // sign
    if (s.sign) {
      const t = s.sign.text, vs = s.sign.vs ?? Math.min(1 / 10, (s.w - 1.0) / (t.length * 6 + 2));
      f.place(TS.sign(t, s.sign.fg ?? C.white, s.sign.bg === undefined ? null : s.sign.bg, vs), (u0 + u1) / 2, 4.25, 0, 0, -1);
    }
    if (s.blade) { const bu = u1 - 0.7; f.fill(bu - 0.375, SH + 0.5, -2.0, bu + 0.375, SH + 0.75, 0, C.iron); f.place(TS.blade(s.blade.text, s.blade.fg, C.black, 'shop-' + s.id, 1 / 8), bu, SH + 0.75, -0.25, -1, 0); f.light(bu, SH + 2, -1.5, s.blade.light ?? 0xff80c0, 1.2, 12, 'sign'); }
    if (s.awning) f.place(TS.awning(s.w - 1.0, s.awning[0], s.awning[1]), (u0 + u1) / 2, 3.75, 0, 0, -1);
    // upper storeys
    if (H > SH + 3) TS.windows(f, u0, u1, SH + 1.25, H - 1.25, trim, TS.hash(u0 * 13, d * 7, H) * 1e4 | 0);
    TS.roof(f, u0, u1, d, H, (u0 * 17 + d) | 0, { wall, trim, chimney: s.chimney, tank: s.tank });
    // exposed sides: windows + fire escape
    for (const side of ['L', 'R']) if (s[side === 'L' ? 'left' : 'right']) {
      const out = side === 'L' ? f.dir(-1, 0) : f.dir(1, 0), face = out[0] < -0.5 ? 'W' : out[0] > 0.5 ? 'E' : out[1] < -0.5 ? 'N' : 'S';
      const pA = f.w(side === 'L' ? u0 : u1, 0), pB = f.w(side === 'L' ? u0 : u1, d);
      const sf = TS.frame(0, 0, face); const U = sf.U;
      // origin: the end with the smaller u' along the side
      const ua = pA[0] * U[0] + pA[1] * U[1], ub = pB[0] * U[0] + pB[1] * U[1], o = ua < ub ? pA : pB;
      const g = TS.frame(o[0], o[1], face);
      if (H > SH + 3) TS.windows(g, 0.5, d - 0.5, SH + 1.25, H - 1.25, trim, (u0 * 7 + 3) | 0);
      g.fill(0, H - 1.0, -0.5, d, H - 0.5, 0, trim);
      if (s.fe === side && H > SH + 4) { const floors = Math.floor((H - SH - 1) / 3.75); g.place(TS.fireEscape(floors), d * 0.5, SH + 0.75, 0, 0, -1); }
    }
    // registration
    const door = f.w(du, -1.2), inside = f.w(du, 1.5);
    AF.addBuilding({ id: s.id, name: s.name, kind: s.kind ?? 'shop', box: f.box(u0, 0.25, 0, u1, H + 1, d), doors: [{ x: door[0], y: 0.25, z: door[1], yaw: f.yaw(0, 1) }], floors: [0.5], interior: true, owner: 'theatre-shops' });
    const ctx = {
      f, s, u0, u1, d, SH, du, C,
      spot: (kind, u, v, lu, lv, y = 0.5) => { const p = f.w(u, v); return AF.addSpot({ building: s.id, x: p[0], y, z: p[1], yaw: f.yaw(lu, lv), kind, path: [door, inside, f.w(u, Math.min(v, 1.5)), p] }); },
    };
    // default furnishing: lamps, shelves on the back wall, a counter along one side, a picture, a rug
    const nL = Math.max(1, Math.round((d - 2) / 4));
    const lampG = (s.lamp ?? (sty && sty.lamp)) === 'globe' ? TS.props.globe() : (s.lamp ?? (sty && sty.lamp)) === 'brass' ? TS.props.brassLamp() : TS.props.pendant();
    for (let i = 0; i < nL; i++) f.place(lampG, (u0 + u1) / 2, SH, 2 + (i + 0.5) * (d - 3) / nL, 0, -1);
    f.light((u0 + u1) / 2, SH - 1, d / 2, s.lightC ?? 0xffd8a0, 1.3, Math.max(8, d));
    if (!s.noDefault) {
      const gk = kit ?? s.goods ?? 'mixed', gk2 = kit ?? s.goods2;
      if (gk !== 'florist' && gk !== 'hardware') for (let u = u0 + 0.75; u + 3 <= u1 - 0.6; u += 3.0) f.place(TS.goods(gk, Math.floor(u * 3)), u + 1.5, 0.5, d - 0.5, 0, -1, true);
      if (gk === 'hardware') for (let u = u0 + 0.75; u + 3 <= u1 - 0.6; u += 3.0) f.place(TS.goods('hardware', 1), u + 1.5, 0.5, d - 0.5, 0, -1, true);
      const left = (s.counter ?? 'L') === 'L', cu = left ? u0 + 1.75 : u1 - 2.5;
      f.fill(cu, 0.5, 3.0, cu + 0.75, 1.25, d - 3.0, C.woodD); f.fill(cu - 0.125 > 0 ? cu : cu, 1.25, 3.0, cu + 0.75, 1.5, d - 3.0, s.counterTop ?? C.marble);
      f.place(TS.props.register(), cu + 0.375, 1.5, 4.0, left ? 1 : -1, 0);
      if (gk2 && gk2 !== 'florist') for (let v = 4.2; v + 3 < d - 3; v += 3.2) f.place(TS.goods(gk2, Math.floor(v * 5)), left ? u1 - 0.5 : u0 + 0.5, 0.5, v + 1.5, left ? -1 : 1, 0, true);
      ctx.spot('work', left ? cu - 0.5 : cu + 1.25, d / 2, left ? 1 : -1, 0);
      ctx.spot('counter', left ? cu + 1.3 : cu - 0.6, 4.5, left ? -1 : 1, 0);
      ctx.spot('browse', (u0 + u1) / 2 + (left ? 0.8 : -0.8), d - 1.6, 0, 1);
      f.place(TS.props.picture(u0 | 0), left ? u1 - 0.5 : u0 + 0.5, 2.2, 2.2, left ? -1 : 1, 0);
      if (kit) TS.kitFloor(kit, ctx, left);
    }
    if (s.fit) s.fit(ctx);
    TS.shops.push(s);
    return ctx;
  };
  // exterior-only building in a street wall (solid, punched windows, closed door, cornice, roof dressing)
  TS.fillBldg = (f, u0, w, d, H, seed, o = {}) => {
    const C = TS.cols(), r = AF.rng(seed), walls = [C.brickR, C.brickB, C.brickS, C.brickY, C.buff, C.lime, C.brickD], trims = [C.cream, C.lime, C.buff, C.white];
    const wall = o.wall ?? walls[Math.floor(r() * walls.length)], trim = o.trim ?? trims[Math.floor(r() * trims.length)], u1 = u0 + w;
    f.fill(u0, 0.25, 0, u1, H, d, wall);
    f.fill(u0, 0.25, 0, u1, 1.0, 0.25, C.granite);
    TS.windows(f, u0, u1, 1.5, H - 1.25, trim, seed);
    const du = u0 + w / 2; f.clear(du - 0.75, 0.5, 0, du + 0.75, 3.0, 0.25); f.fill(du - 0.75, 0.5, 0.25, du + 0.75, 3.0, 0.5, C.woodD); f.fill(du - 1, 3.0, -0.5, du + 1, 3.25, 0.25, trim);
    f.fill(du - 1, 0.25, -0.5, du + 1, 0.5, 0, trim);
    TS.roof(f, u0, u1, d, H, seed, { wall, trim });
    return { wall, trim };
  };
  TS.fillRow = (f, u0, u1, d, seed, hMin = 12, hMax = 22) => {
    const r = AF.rng(seed); let u = u0, k = 0;
    while (u < u1 - 1) { let w = Math.round((7 + r() * 7) * 4) / 4; if (u1 - (u + w) < 6) w = u1 - u; TS.fillBldg(f, u, w, d, Math.round((hMin + r() * (hMax - hMin)) * 4) / 4, seed * 7 + k++); u += w; }
  };

  // ================================================================= THE PARAGON
  // frame faces W on Grand Ave: origin (10, 106); u = z - 106 (0..41), v = x - 10 (0..56). Lobby v 0..16, auditorium v 16..56.
  const buildParamount = () => {
    const C = TS.cols(), f = TS.frame(10, 106, 'W'), U1 = 41, VL = 16, VA = 56, TOP = 21, AUD = 17.5;
    const cream = C.cream, gold = C.gold, red = C.redD;
    // ---- shell
    f.fill(0, 0.25, 0, U1, TOP, VL, cream);                       // front block (5 storeys)
    f.fill(0, 0.25, VL, U1, AUD, VA, C.buff);                     // auditorium box
    f.clear(0.5, 0.5, 0.5, U1 - 0.5, 11.0, VL);                   // lobby volume
    f.clear(0.5, 0.5, VL + 0.5, U1 - 0.5, AUD - 1.0, VA - 0.5);   // auditorium volume
    f.clear(0.5, 0.5, VL, 3.0, 3.5, VL + 0.5); f.clear(U1 - 3.0, 0.5, VL, U1 - 0.5, 3.5, VL + 0.5);   // doors lobby→side aisles
    f.clear(2.5, 7.5, VL, 6.0, 10.75, VL + 0.5);  // doors gallery→balcony
    // lobby: carpet with gold diamonds, red walls with gold bands, cream above
    f.each(0.5, 0.25, 0.5, U1 - 0.5, 0.5, VL, (u, y, v) => { const iu = Math.floor(u * 4), iv = Math.floor(v * 4); return (((iu + iv) % 10) === 0 || ((iu - iv + 1000) % 10) === 0) ? C.carpetG : C.carpet; });
    f.fill(0.5, 0.5, VL - 0.25, U1 - 0.5, 2.0, VL, red); f.fill(0.5, 2.0, VL - 0.25, U1 - 0.5, 2.25, VL, gold);
    f.fill(0.5, 0.5, 0.5, 0.75, 2.0, VL, red); f.fill(U1 - 0.75, 0.5, 0.5, U1 - 0.5, 2.0, VL, red);
    for (let u = 2; u < U1 - 1; u += 4) f.fill(u, 2.25, VL - 0.5, u + 0.5, 11.0, VL - 0.25, gold);   // gilded pilasters
    f.fill(0.5, 10.5, 0.5, U1 - 0.5, 11.0, VL, gold);                                                   // gold ceiling band
    f.each(1, 11.0, 1, U1 - 1, 11.25, VL - 1, (u, y, v) => ((Math.floor(u) + Math.floor(v)) % 4 === 0 ? C.gold : C.cream));   // coffers
    // ---- facade (v 0..0.5 is the front wall): granite base, entrance recess u 12..29, tall windows, piers, crown
    f.fill(0, 0.25, -0.25, U1, 1.25, 0.5, AF.MAT.graniteRed ?? C.redD); for (const [ra, rb] of [[0, 11.75], [29.25, U1]]) f.fill(ra, 1.0, -0.5, rb, 1.25, -0.25, AF.MAT.brass ?? C.brass);
    const e0 = 12, e1 = 29;
    f.clear(e0, 0.5, -0.25, e1, 4.5, 0.5);
    f.each(e0, 0.25, -0.5, e1, 0.5, 4.0, (u, y, v) => (((Math.floor(u * 2) + Math.floor(v * 2)) & 1) ? C.tileK : C.marble));
    // bronze doors row at v 3.5..4 with 4 openings
    f.fill(e0, 0.5, 3.5, e1, 4.5, 4.0, C.bronze);
    for (const a of [e0 + 0.75, e0 + 4.5, e1 - 6.5, e1 - 2.75]) { f.clear(a, 0.5, 3.5, a + 2.0, 3.25, 4.0); f.fill(a, 3.25, 3.5, a + 2.0, 4.25, 4.0, C.prism); }
    f.clear(e0, 0.5, 0.5, e1, 4.5, 3.5);
    f.each(e0, 4.25, 0, e1, 4.5, 3.5, (u, y, v) => ((Math.floor(u * 4) % 4 === 1 && Math.floor(v * 4) % 4 === 1) ? TS.b3(Math.floor(u * 4 / 4)) : C.gold));   // bulb ceiling in the recess
    f.fill(e0 - 0.25, 0.5, 0, e0, 4.5, 3.5, red); f.fill(e1, 0.5, 0, e1 + 0.25, 4.5, 3.5, red);
    // ticket booth in the recess centre
    const tb = (e0 + e1) / 2;
    f.fill(tb - 1.25, 0.5, 0.5, tb + 1.25, 1.25, 2.5, red); f.fill(tb - 1.25, 1.25, 0.5, tb + 1.25, 3.0, 2.5, C.glass); f.clear(tb - 1.0, 1.25, 0.75, tb + 1.0, 3.0, 2.5);
    f.fill(tb - 1.25, 1.25, 0.5, tb - 1.0, 3.0, 0.75, gold); f.fill(tb + 1.0, 1.25, 0.5, tb + 1.25, 3.0, 0.75, gold);
    f.fill(tb - 1.5, 3.0, 0.25, tb + 1.5, 3.25, 2.75, gold); f.fill(tb - 1.0, 3.25, 0.5, tb + 1.0, 3.75, 2.5, red); f.fill(tb - 0.25, 3.75, 1.25, tb + 0.25, 4.25, 1.75, gold);
    f.fill(tb - 1.0, 1.25, 0.75, tb + 1.0, 1.5, 1.25, C.woodD); f.fill(tb - 1.25, 0.5, 2.5, tb + 1.25, 3.0, 2.75, red);
    f.place(TS.props.register(), tb, 1.5, 1.6, 0, -1);
    const pbooth = f.w(tb, 1.9); AF.addSpot({ building: 'paramount', x: pbooth[0], y: 0.5, z: pbooth[1], yaw: f.yaw(0, -1), kind: 'work' });
    // queue on the sidewalk (outside the booth, along the facade)
    // the queue: 3 at the window, then south along the kerb under the marquee toward Harbour Blvd (20 places; the first 6 are
    // resident spots, the other 14 are the theatre's own shuffling figures), a brass stanchion line with red velvet rope
    TS.queue = [];
    for (let i = 0; i < 20; i++) { const u = i < 3 ? tb : tb + 0.9 + (i - 3) * 0.95, v = i < 3 ? -0.45 - i * 0.8 : -1.7; const p = f.w(u, v), yaw = i < 3 ? f.yaw(0, 1) : f.yaw(-1, 0.15); if (i < 6) AF.addSpot({ building: 'paramount', x: p[0], y: 0.25, z: p[1], yaw, kind: 'stand', queue: i }); else TS.queue.push({ x: p[0], z: p[1], yaw, k: i }); }
    { const post = TS.geo('stanchion', () => { const m = M(3, 16, 3); m.box(0, 0, 0, 3, 1, 3, C.brass); m.box(1, 1, 1, 2, 14, 2, C.brass); m.box(0, 14, 0, 3, 16, 3, C.brass); return m; }, 1 / 16, [0.5, 0, 0.5]);
      const rope = TS.geo('rope', () => { const m = M(32, 4, 1); for (let x = 0; x < 32; x++) m.set(x, Math.round(3 - 2.4 * Math.sin(x / 31 * Math.PI)), 0, C.velvet); return m; }, 1 / 16, [0, 0, 0.5]);
      for (let u = tb + 1.5; u < tb + 16.5; u += 2) { f.place(post, u, 0.25, -2.45, 0, -1); if (u + 2 < tb + 16.5) f.place(rope, u, 0.25 + 0.72, -2.45, 0, -1); } }
    // posters in frames either side of the recess
    // six lit poster cases with original one-sheets (bulb borders), a red marble plinth with a brass rail
    [1.9, 5.1, 8.4, 31.4, 34.6, 39.4].forEach((u, i) => { f.fill(u - 0.75, 1.25, -0.25, u + 0.75, 3.5, 0, C.redD); f.place(TS.oneSheet(i), u, 1.3, -0.25, 0, -1); });
    f.light(5, 2.5, -1.5, 0xffd890, 0.55, 9, 'shop'); f.light(35, 2.5, -1.5, 0xffd890, 0.55, 9, 'shop');
    // tall lobby windows over the marquee (y 6..10.5) + upper office storeys
    TS.windows(f, 0.5, e0 - 1, 6.0, 10.5, gold, 901, 4.5, 2.5, 3);
    TS.windows(f, e1 + 1, U1 - 0.5, 6.0, 10.5, gold, 902, 4.5, 2.5, 3);
    TS.windows(f, 0.5, e0 - 1, 12.25, TOP - 1.5, C.lime, 903, 3.75, 2.25, 2.5);
    TS.windows(f, e1 + 1, U1 - 0.5, 12.25, TOP - 1.5, C.lime, 904, 3.75, 2.25, 2.5);
    // the great arched window bay over the entrance (u 14.5..26.5, y 8.5..20): gold frame, sunburst glazing
    { const ac = tb, ar = 6.0, ay = 14.0, a0 = ac - ar, a1 = ac + ar;
      const inA = (u, y) => (y < ay ? (u >= a0 && u < a1 && y >= 8.5) : Math.hypot(u + 0.125 - ac, y + 0.125 - ay) < ar);
      f.each(a0 - 0.75, 8.0, -0.25, a1 + 0.75, ay + ar + 0.75, 0.5, (u, y, v) => {
        const i = inA(u, y), near = !i && (inA(u + 0.5, y) || inA(u - 0.5, y) || inA(u, y + 0.5) || inA(u, y - 0.5) || inA(u + 0.5, y + 0.5) || inA(u - 0.5, y + 0.5));
        if (near) return v < 0 ? C.gold : null;
        if (!i) return null;
        if (v < 0.25) return 0;
        const dx = u + 0.125 - ac, dy = y + 0.125 - 8.5, ang = Math.atan2(dy, dx), rad = Math.hypot(dx, dy);
        return ((Math.floor(ang * 16 / Math.PI) % 2 === 0 && rad < 3.0) || Math.abs(rad - 3.0) < 0.15 || Math.floor((u + 0.125) * 4) % 8 === 0 || Math.floor((y + 0.125) * 4) % 10 === 0) ? C.gold : C.prism;
      });
      // fluted piers flanking the bay
      for (const pu of [a0 - 2.5, a1 + 0.75]) f.each(pu, 5.25, -0.75, pu + 1.75, TOP + 2.0, 0, (u, y, v) => ((Math.floor(u * 4) % 2) ? (v < -0.5 ? null : C.lime) : C.cream));
      // bulb-edged arch
      f.each(a0 - 1, ay, -0.5, a1 + 1, ay + ar + 1.0, -0.25, (u, y) => { const r = Math.hypot(u + 0.125 - ac, y + 0.125 - ay); return (r > ar + 0.5 && r < ar + 0.75 && Math.floor(Math.atan2(y - ay, u - ac) * 20) % 2 === 0) ? TS.b3(Math.floor(Math.atan2(y - ay, u - ac) * 20)) : null; });
    }
    // polychrome terracotta bands (jade / red / gold chevrons) across the frontage
    for (const by of [11.25, TOP - 2.5]) f.each(0, by, -0.25, U1, by + 0.75, 0, (u, y) => { if (u > tb - 7 && u < tb + 7 && by < 12) return null; const k = (Math.floor(u * 4) + Math.floor((y - by) * 4)) % 6; return k < 2 ? C.jade : k < 4 ? C.red : C.gold; });
    // piers (gold-edged cream) rising to a stepped crown with a sunburst
    for (const u of [0, 5.5, 11, 29.75, 35.25, U1 - 1]) { f.fill(u, 5.0, -0.5, u + 1, TOP + 1.5, 0, C.lime); f.fill(u + 0.25, TOP + 1.5, -0.25, u + 0.75, TOP + 2.5, 0.25, gold); }
    f.fill(0, 4.75, -0.5, U1, 5.25, 0, gold);
    f.fill(e0 - 1, TOP, 0, e1 + 1, TOP + 3, 1.0, cream); f.fill(e0 + 2, TOP + 3, 0, e1 - 2, TOP + 5, 1.0, cream); f.fill(tb - 3, TOP + 5, 0, tb + 3, TOP + 6.5, 1.0, cream);
    f.each(e0 - 1, TOP - 0.5, -0.25, e1 + 1, TOP + 6.5, 0, (u, y) => { const dx = u - tb, dy = y - (TOP - 0.5); const a = Math.atan2(dy, dx); if (dy < 0) return null; if (Math.hypot(dx, dy) > 6.8) return null; return (Math.floor(a * 12 / Math.PI) & 1) ? C.gold : null; });
    TS.roof(f, 0, U1, VL, TOP, 911, { wall: cream, trim: C.gold, tank: false });
    // ---- ROOF: a copper-green barrel vault over the auditorium (bronze ribs, standing seams), a stepped fly tower over the stage
    // with 3.5 m THE PARAGON letters facing Grand Ave, and a Hollywood-style PARAGON bulb sign on the south slope facing the harbour
    { const cu = AF.MAT.copper ?? AF.col(0x5da58b, { rough: 0.82 }), cuS = AF.col(0x3f7c68, { rough: 0.7, jitter: 0.3 }), rib = AF.MAT.bronze ?? C.bronze, gl = AF.MAT.gold ?? gold;
      const FV = 46.5, rise = 6.5, half = U1 / 2, R = (half * half + rise * rise) / (2 * rise), vh = (u) => AUD + Math.sqrt(Math.max(0, R * R - (u - half) * (u - half))) - (R - rise);
      TS.vaultH = vh;
      for (let u = 0; u < U1; u += 0.25) { const top = vh(u + 0.125), col = (Math.floor(u * 4) % 6 === 0) ? cuS : cu; f.fill(u, Math.max(AUD - 0.5, top - 1.25), VL, u + 0.25, top, FV, col); for (let v = VL + 2; v < FV - 0.5; v += 4) f.fill(u, top - 0.25, v, u + 0.25, top + 0.25, v + 0.5, rib); }
      // west gable over the front block: cream lunette with a gilded sunburst
      for (let u = 0; u < U1; u += 0.25) { const top = vh(u + 0.125); if (top > TOP) f.each(u, TOP, VL - 0.25, u + 0.25, top, VL + 0.25, (uu, y) => { const dx = uu + 0.125 - half, dy = y + 0.125 - TOP, a = Math.atan2(dy, dx), r = Math.hypot(dx, dy); return (r < 1.5 || (Math.floor(a * 18 / Math.PI) & 1) === 0) ? gl : cream; }); }
      // eaves: cream parapet with gold coping + a bulb line
      for (const [a, b] of [[0, 0.5], [U1 - 0.5, U1]]) { f.fill(a, AUD, VL, b, AUD + 0.75, FV, cream); f.fill(a, AUD + 0.75, VL, b, AUD + 1.0, FV, gl); }
      // fly tower
      const FT = 30.5;
      f.fill(1, AUD - 0.5, FV, U1 - 1, FT, VA, C.buff);
      for (let u = 1; u < U1 - 1; u += 4) f.fill(u, AUD, FV - 0.25, u + 0.75, FT, FV, C.lime);
      for (let v = FV + 1; v < VA - 1; v += 3) for (const [a, b] of [[0.75, 1], [U1 - 1, U1 - 0.75]]) f.fill(a, AUD, v, b, FT, v + 0.75, C.lime);
      f.each(1, FT - 2.0, FV - 0.5, U1 - 1, FT - 1.25, FV - 0.25, (u, y) => { const k = (Math.floor(u * 4) + Math.floor(y * 4)) % 6; return k < 2 ? C.jade : k < 4 ? C.red : gold; });
      f.fill(0.75, FT, FV - 0.5, U1 - 0.75, FT + 0.5, VA + 0.25, cream); f.fill(3, FT + 0.5, FV + 1, U1 - 3, FT + 1.25, VA - 1, cream); f.fill(8, FT + 1.25, FV + 2.5, U1 - 8, FT + 2.0, VA - 2.5, gl);
      f.fill(1, FT - 0.25, FV - 0.75, U1 - 1, FT, FV - 0.5, gl);
      f.each(1, FT - 0.75, FV - 0.75, U1 - 1, FT - 0.5, FV - 0.5, (u) => (Math.floor(u * 4) % 2 ? TS.b3(Math.floor(u * 2)) : null));
      // big letters (0.5 m per font pixel), stamped into the grid so they read from the air
      const bigText = (fr, text, uc, y0, v, px, colA, colB) => {
        const w = text.length * 6 - 1, u0 = uc - w * px / 2;
        for (let i = 0; i < text.length; i++) { const g = AF.font5x7[text[i]] || AF.font5x7['?']; for (let r = 0; r < 7; r++) for (let c = 0; c < 5; c++) if (g[r] & (1 << (4 - c))) { const uu = u0 + (i * 6 + c) * px, yy = y0 + (6 - r) * px; fr.each(uu, yy, v, uu + px, yy + px, v + 0.25, (a, b) => ((Math.floor(a * 4) + Math.floor(b * 4)) % 2 === 0 && colB != null ? TS.b3(Math.floor(a * 4) + Math.floor(b * 4)) : colA)); } }
      };
      bigText(f, 'THE PARAGON', half, FT - 7.5, FV - 0.75, 0.5, C.neonRed, null);
      f.each(3, FT - 8.25, FV - 0.75, U1 - 3, FT - 8.0, FV - 0.5, (u) => (Math.floor(u * 4) % 2 ? TS.b3(Math.floor(u * 4)) : C.gold));
      // south slope bulb sign (sf-style frame: u' = x - 10, v' = 147 - z)
      const ss = TS.frame(10, 147, 'S'), sv = 4.25, sy = 21.25;
      for (let u = 19; u < 43; u += 2) { const base = vh(147 - sv - 106 - 0.25); ss.fill(u, base - 0.5, sv + 0.25, u + 0.25, sy + 3.75, sv + 0.5, C.iron); }
      ss.fill(18.75, sy - 0.25, sv + 0.25, 43.25, sy, sv + 0.5, C.iron); ss.fill(18.75, sy + 3.5, sv + 0.25, 43.25, sy + 3.75, sv + 0.5, C.iron);
      bigText(ss, 'PARAGON', 31, sy, sv, 0.5, C.neonRed, 1);
      AF.addLight({ x: 41, y: sy + 2, z: 141, color: 0xff6050, intensity: 1.2, range: 16, kind: 'sign' });
      TS.flyTop = FT;
    }
    // Harbour Blvd side of the auditorium: pilasters, poster cases, stage door, fire escape (u = U1 face)
    const sf = TS.frame(10, 147, 'S');   // u' = x - 10, v' = 147 - z
    for (let u = VL + 1; u < VA - 1; u += 4) { sf.fill(u, 1.0, -0.25, u + 1, AUD - 0.5, 0, C.lime); sf.fill(u + 0.25, AUD - 1.5, -0.5, u + 0.75, AUD - 0.5, -0.25, gold); }
    for (let u = VL + 2.5; u < VA - 3; u += 8) { sf.fill(u - 0.25, 1.25, -0.25, u + 2.0, 4.25, 0, gold); sf.place(TS.props.poster(u | 0), u + 0.875, 1.5, -0.25, 0, -1); sf.place(TS.sign('NOW PLAYING', C.red, C.cream, 1 / 24), u + 0.875, 3.85, -0.25, 0, -1); }
    sf.fill(0, AUD - 2.5, -0.5, VA, AUD - 2.0, 0, gold); sf.fill(0, 4.5, -0.25, VA, 4.75, 0, gold);
    sf.fill((VL + VA) / 2 - 11.5, 8.0, -0.25, (VL + VA) / 2 + 11.5, 11.25, 0, C.redD);
    sf.place(TS.sign('THE PARAGON', C.neonRed, null, 1 / 5), (VL + VA) / 2, 9.6, -0.25, 0, -1);
    // chasing bulb lines: auditorium cornice (south face) + front-block cornices (west + south faces)
    sf.each(0, AUD - 2.5, -0.5, VA, AUD - 2.25, -0.25, (u) => (Math.floor(u * 4) % 2 ? TS.b3(Math.floor(u * 2)) : null));
    sf.each(0, TOP - 1.25, -0.75, VL, TOP - 1.0, -0.5, (u) => (Math.floor(u * 4) % 2 ? TS.b3(Math.floor(u * 2)) : null));
    f.each(0, TOP - 1.25, -0.75, U1, TOP - 1.0, -0.5, (u) => (Math.floor(u * 4) % 2 ? TS.b3(Math.floor(u * 2)) : null));
    for (const u of [0, U1 - 0.25]) f.each(u, 5.25, -0.75, u + 0.25, TOP - 1.25, -0.5, (uu, y) => (Math.floor(y * 4) % 2 ? TS.b3(Math.floor(y * 2)) : null));
    f.light(40, 9, -4, 0xffd080, 0.8, 16, 'sign');
    TS.windows(sf, 0.5, VL - 0.5, 6.0, TOP - 1.5, gold, 905, 3.75, 2.25, 2.5);
    sf.fill(VA - 5, 0.5, -0.1, VA - 3, 3.0, 0, C.woodD); sf.place(TS.sign('STAGE DOOR', C.white, C.navy, 1 / 24), VA - 4, 3.2, -0.1, 0, -1);
    // Harbour Blvd glow: a second marquee over a side exit, a vertical PARAGON, warm uplights, bulbs round the poster cases
    { const m0 = VL + 6, m1 = VL + 18;
      sf.each(m0, 4.0, -2.25, m1, 5.5, 0, (u, y, v) => { const edge = v < -2.0 || u < m0 + 0.25 || u >= m1 - 0.25, bot = y < 4.25, top = y >= 5.25; if (bot) return (Math.floor(u * 4) % 3 === 1 && Math.floor(v * 4) % 3 === 1) ? TS.b3(Math.floor(u * 4)) : C.gold; if (top || (edge && Math.floor(y * 4) % 2 === 0)) return TS.b3(Math.floor(u * 4) + Math.floor(y * 4)); return C.cream; });
      sf.place(TS.sign('STARDUST AVENUE', C.black, null, 1 / 16), (m0 + m1) / 2, 4.8, -2.3, 0, -1);
      sf.place(TS.sign('PARAGON', C.neonRed, null, 1 / 10), (m0 + m1) / 2, 5.95, -1.2, 0, -1);
      sf.light((m0 + m1) / 2, 3.2, -2.5, 0xffd080, 0.9, 12, 'sign'); }
    sf.fill(3.5, 7.0, -2.75, 4.25, 7.25, 0, C.iron); sf.place(TS.blade('PARAGON', C.neonRed, C.redD, 'paragon-s', 1 / 8), 3.875, 7.25, -0.25, -1, 0);
    { const up = AF.col(0xf0d8b0, { emit: 0xffb060, emitK: 0.3, mode: 'night', jitter: 0, edge: 0 });
      for (let u = VL + 3; u < VA - 1; u += 8) { sf.fill(u, 0.25, -0.75, u + 0.75, 0.75, -0.25, C.iron); sf.fill(u + 0.125, 0.75, -0.75, u + 0.625, 1.0, -0.5, C.lamp); sf.each(u - 0.5, 1.0, -0.25, u + 1.25, AUD - 3.0, 0, (uu, y) => (Math.abs(uu + 0.125 - (u + 0.375)) < 0.2 + (y - 1) * 0.06 && Math.floor(y * 4) % 3 === 0 ? up : null)); } }
    for (const x of [22, 34, 46, 58]) AF.addLight({ x, y: 3, z: 148.5, color: 0xffc070, intensity: 0.6, range: 10, kind: 'sign' });
    for (let u = VL + 2.5; u < VA - 3; u += 8) sf.each(u - 0.5, 1.0, -0.5, u + 2.25, 4.5, -0.25, (uu, y) => ((uu < u - 0.25 || uu >= u + 2.0 || y < 1.25 || y >= 4.25) && (Math.floor(uu * 4) + Math.floor(y * 4)) % 2 === 0 ? TS.b3(Math.floor(uu * 4) + Math.floor(y * 4)) : null));
    // ---- MARQUEE: a deep canopy over the sidewalk (u 7..34, v -3..0, y 4.75..8.25) with a 3-row milk-glass readerboard,
    // 3 rows of chasing bulbs (top edge, bottom edge, the soffit grid) and THE PARAGON in red neon on the crest
    const mq0 = 7, mq1 = 34, mc = (mq0 + mq1) / 2;
    const panel = AF.col(0xf7f1de, { emit: 0xfff1cf, emitK: 0.75, mode: 'night', jitter: 0.05, edge: 0.1 });
    f.each(mq0, 4.75, -3.0, mq1, 8.25, 0, (u, y, v) => {
      const edge = v < -2.75 || u < mq0 + 0.25 || u >= mq1 - 0.25, yb = Math.floor(y * 4 + 1e-6);
      if (yb === 19) { const iu = Math.floor(u * 4), iv = Math.floor(v * 4); return (iu % 3 === 1 && (iv + 400) % 3 === 1) ? TS.b3(Math.floor(iu / 3)) : C.gold; }
      if (!edge) return yb >= 32 ? C.gold : null;
      if (yb === 20 || yb === 31) return (Math.floor(u * 4) + Math.floor(v * 4)) % 2 ? TS.b3(Math.floor(u * 4) + Math.floor(v * 4)) : C.gold;
      if (yb === 32) return C.gold;
      return panel;
    });
    f.fill(mq0 + 0.25, 5.0, -2.75, mq1 - 0.25, 8.0, -0.25, C.cream);
    f.fill(mq0 + 2, 8.25, -2.5, mq1 - 2, 8.75, -0.5, C.redD); f.fill(mq0 + 2, 8.25, -2.75, mq1 - 2, 8.5, -2.5, C.gold);
    for (let u = mq0 + 2.25; u < mq1 - 2; u += 0.5) f.fill(u, 8.5, -2.75, u + 0.25, 8.75, -2.5, TS.b3(Math.floor(u * 2)));
    // readerboard (original titles, CANON)
    const RB = [['RHYTHM ON THE PIER  *  THE GILDED ANCHOR', C.red], ['2 FEATURES 25¢ TILL 5 PM  *  CHILDREN 10¢', C.black], ['ALSO: CARTOON * NEWSREEL * DISH NIGHT THURS', C.black]];
    RB.forEach(([t, col], i) => f.place(TS.sign(t, col, null, 1 / 14), mc, 7.25 - i * 0.75, -3.02, 0, -1));
    // the two ends of the canopy (seen along Grand Ave)
    for (const [uu, du] of [[mq0 - 0.02, -1], [mq1 + 0.02, 1]]) { f.place(TS.sign('PARAGON', C.red, null, 1 / 16), uu, 7.25, -1.5, du, 0); f.place(TS.sign('RHYTHM', C.black, null, 1 / 20), uu, 6.5, -1.5, du, 0); f.place(TS.sign('ON THE PIER', C.black, null, 1 / 24), uu, 5.85, -1.5, du, 0); }
    // COOLED BY REFRIGERATION in icicle letters on a drop board under the front edge
    f.place(TS.geo('icicle', () => { const m = AF.textModel('COOLED BY REFRIGERATION', C.neonBlue, { pad: 1, depth: 1, bg: C.navyD }), ice = C.neonWhite; for (let x = 1; x < m.w - 1; x++) { let lit = false; for (let z = 0; z < m.d; z++) if (m.get(x, 1, z) === C.neonBlue) lit = true; if (lit) m.set(x, 1, m.d - 1, ice); } const n = M(m.w, m.h + 4, m.d); for (let x = 0; x < m.w; x++) for (let y = 0; y < m.h; y++) for (let z = 0; z < m.d; z++) { const c = m.get(x, y, z); if (c) n.set(x, y + 4, z, c); } for (let x = 2; x < m.w - 2; x += 2) { const L = 1 + ((x * 7) % 4); for (let y = 4 - L; y < 4; y++) n.set(x, y, n.d - 1, ice); } return n; }, 1 / 20, [0.5, 1, 0]), mc, 4.75, -2.9, 0, -1);
    // neon THE PARAGON on the marquee crest
    f.place(TS.geo('deco-paragon-crest', () => AF.textModel('THE PARAGON', C.flickRed, { font: 'deco', pad: 0, depth: 2, shadow: AF.MAT.gold ?? C.gold }), 1 / 6, [0.5, 0.5, 0]), mc, 9.55, -1.6, 0, -1);
    f.light(mc, 4.0, -3.0, 0xffcf80, 1.2, 14, 'sign'); f.light(mq0 + 3, 3.5, -2.5, 0xffd890, 0.7, 9, 'shop'); f.light(mq1 - 3, 3.5, -2.5, 0xffd890, 0.7, 9, 'shop');
    // ---- the tall blade: 18 m of bulb-outlined PARAGON rising past the crown, a pulsing star on top
    // per-letter neon entries so the blade can spell P-A-R-A-G-O-N letter by letter (animated in the tick)
    TS.bladeL = [0, 1, 2, 3, 4, 5, 6].map((i) => { const ix = AF.col(0xff5a40 + i, { emit: 0xff2a10 + i, emitK: 3.0, mode: 'always', jitter: 0, edge: 0 }); return { i: ix, base: [AF.PAL.emit[ix * 4], AF.PAL.emit[ix * 4 + 1], AF.PAL.emit[ix * 4 + 2]] }; });
    const blade = TS.geo('blade-paragon-big', () => {
      const t = 'PARAGON', n = t.length, W = 13, m = M(W, n * 9 + 6, 3), lit = new Set();
      m.box(0, 0, 0, W, m.h, 3, C.cream); m.box(1, 1, 1, W - 1, m.h - 1, 2, C.redD);
      for (let i = 0; i < n; i++) {
        const g = AF.font5x7[t[i]], y0 = (n - 1 - i) * 9 + 4;
        const L = TS.bladeL[i].i;
        for (let r = 0; r < 7; r++) for (let c = 0; c < 5; c++) if (g[r] & (1 << (4 - c))) { lit.add((4 + c) + ',' + (y0 + 6 - r)); m.set(4 + c, y0 + 6 - r, 2, L); m.set(4 + (4 - c), y0 + 6 - r, 0, L); }
      }
      for (let y = 1; y < m.h - 1; y++) for (let x = 2; x < W - 2; x++) { if (lit.has(x + ',' + y)) continue; let nb = false; for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (lit.has((x + a) + ',' + (y + b))) nb = true; if (nb && (x + y) % 2 === 0) { m.set(x, y, 2, TS.b3(x + y)); m.set(W - 1 - x, y, 0, TS.b3(x + y)); } }
      for (let y = 0; y < m.h; y++) for (const x of [0, W - 1]) for (let z = 0; z < 3; z++) m.set(x, y, z, (y % 2) ? C.gold : TS.b3(y));
      for (let x = 0; x < W; x++) for (let z = 0; z < 3; z++) { m.set(x, 0, z, TS.b3(x)); m.set(x, m.h - 1, z, TS.b3(x)); }
      return m;
    }, 1 / 4, [0, 0, 0.5]);
    f.fill(37.25, 8.25, -3.5, 38.0, 8.5, 0, C.iron); f.fill(37.25, 23.5, -3.0, 38.0, 23.75, 0, C.iron);
    f.place(blade, 37.625, 8.5, -0.25, -1, 0);
    f.fill(37.5, 25.25, -1.75, 37.75, 26.5, -1.5, C.iron);
    C.star = AF.col(0xfff07c, { emit: 0xffd23c, emitK: 3.2, mode: 'always', jitter: 0, edge: 0 }); TS.starI = C.star; TS.starBase = [AF.PAL.emit[C.star * 4], AF.PAL.emit[C.star * 4 + 1], AF.PAL.emit[C.star * 4 + 2]];
    f.place(TS.geo('star2', () => { const m = M(11, 11, 2); for (let i = 0; i < 11; i++) { m.set(5, i, 0, C.star); m.set(i, 5, 0, C.star); m.set(i, i, 1, C.star); m.set(10 - i, i, 1, C.star); } m.box(4, 4, 0, 7, 7, 2, C.star); return m; }, 1 / 5, [0.5, 0, 0.5]), 37.625, 26.25, -1.6, 1, 0);
    f.light(37.6, 14, -3, 0xff5040, 1.1, 16, 'sign');
    // searchlights on the roof
    const sl = TS.geo('searchlight', () => { const m = M(10, 10, 10); m.box(2, 0, 2, 8, 2, 8, C.iron); m.box(4, 2, 4, 6, 5, 6, C.iron); m.sphere(5, 7, 5, 3.2, C.steel); m.box(3, 5, 3, 7, 9, 7, C.lamp); return m; }, 1 / 8, [0.5, 0, 0.5]);
    AF.searchlightSpots = [];
    for (const u of [3, U1 - 3]) { f.place(sl, u, TOP, 3.0, 0, -1, false); const p = f.w(u, 3.0); AF.searchlightSpots.push({ x: p[0], y: TOP + 1.2, z: p[1] }); }
    // ---- LOBBY furniture: candy counter, chandeliers, posters, grand stair + gallery
    const cvv = 12.0;
    f.fill(10, 0.5, cvv, 22, 1.0, cvv + 0.75, red); f.fill(10, 1.0, cvv, 22, 1.25, cvv + 0.75, gold); f.fill(10, 1.25, cvv, 22, 1.75, cvv + 0.75, C.glass);
    const candy = TS.geo('candy', () => { const r = AF.rng(77), m = M(10, 5, 10); for (let x = 0; x < 10; x += 2) for (let z = 1; z < 9; z += 3) m.box(x, 0, z, x + 2, 1 + Math.floor(r() * 3), z + 2, C.bright[Math.floor(r() * 12)]); return m; }, 1 / 8, [0.5, 0, 0.5]);
    for (let u = 10.6; u < 21.6; u += 1.3) f.place(candy, u, 1.25, cvv + 0.35, 0, -1);
    const popcorn = TS.geo('popcorn', () => { const m = M(12, 26, 10); m.box(0, 0, 0, 12, 10, 10, C.red); m.box(0, 10, 0, 12, 22, 10, C.glass); m.box(1, 10, 1, 11, 15, 9, C.cream); m.box(0, 22, 0, 12, 26, 10, C.red); m.box(2, 23, 10, 10, 25, 11, C.neonYellow); return m; }, 1 / 16, [0.5, 0, 0.5]);
    f.place(popcorn, 23.0, 0.5, cvv + 0.4, 0, -1, true);
    for (const u of [12.5, 16, 19.5]) { const p = f.w(u, cvv + 1.3); AF.addSpot({ building: 'paramount', x: p[0], y: 0.5, z: p[1], yaw: f.yaw(0, -1), kind: 'work' }); const q = f.w(u, cvv - 0.9); AF.addSpot({ building: 'paramount', x: q[0], y: 0.5, z: q[1], yaw: f.yaw(0, 1), kind: 'counter', path: [f.w(tb, -1.5), f.w(tb, 5), q] }); }
    const chand = TS.geo('chandelier', () => { const m = M(24, 28, 24); m.box(11, 14, 11, 13, 28, 13, C.gold); for (let r = 0; r < 3; r++) { const rr = 10 - r * 3, y = 4 + r * 4; for (let a = 0; a < 64; a++) { const t = a / 64 * Math.PI * 2; m.set(Math.floor(12 + Math.cos(t) * rr), y, Math.floor(12 + Math.sin(t) * rr), C.gold); } for (let k = 0; k < 8; k++) { const t = k / 8 * Math.PI * 2 + r; m.box(Math.floor(12 + Math.cos(t) * rr), y + 1, Math.floor(12 + Math.sin(t) * rr), Math.floor(12 + Math.cos(t) * rr) + 1, y + 3, Math.floor(12 + Math.sin(t) * rr) + 1, C.lamp); } } m.sphere(12, 3, 12, 2.5, C.glass); return m; }, 1 / 12, [0.5, 1, 0.5]);
    f.place(chand, 10, 11.0, 6.5, 0, -1); f.place(chand, 31, 11.0, 6.5, 0, -1);
    f.light(20.5, 8, 6.5, 0xffd890, 1.6, 20); f.light(8, 4, 10, 0xffd890, 1.0, 12);
    for (let i = 0; i < 6; i++) f.place(TS.props.poster(i), 3.5 + i * 1.6, 2.6, VL - 0.5, 0, -1);
    for (let i = 0; i < 3; i++) { f.place(TS.props.poster(i + 3), 0.75, 2.6, 3 + i * 2.2, 1, 0); f.place(TS.props.plant(), 1.5, 0.5, 1.5 + i * 0.01, 0, 1, true); }
    f.place(TS.props.bench(), 1.5, 0.5, 8, 1, 0, true); f.place(TS.props.bench(), U1 - 1.5, 0.5, 5, -1, 0, true);
    { const p = f.w(1.6, 8); AF.addSpot({ building: 'paramount', x: p[0], y: 0.95, z: p[1], yaw: f.yaw(1, 0), kind: 'sit', path: [f.w(tb, -1.5), f.w(tb, 5), f.w(3, 8), p] }); }
    // grand stair: 28 steps along -u from u 36.75 (y 0.75) to u 29.75 (y 7.5), v 13..15.75; gallery y 7.5 along v 12.5..16 from u 1 to u 30
    for (let k = 1; k <= 28; k++) { const u = 36.75 - k * 0.25; f.fill(u, 0.5, 13.0, u + 0.25, 0.5 + k * 0.25, 15.75, k % 2 ? C.carpet : C.carpetG); }
    f.fill(29.75, 0.5, 13.0, 30.0, 7.5, 15.75, C.carpet);
    f.fill(36.75, 0.5, 12.75, 37.0, 1.75, 13.0, gold);   // newel
    for (let k = 0; k < 28; k++) { const u = 36.75 - k * 0.25; f.fill(u, 1.0 + k * 0.25, 12.75, u + 0.25, 1.75 + k * 0.25, 13.0, gold); }
    f.fill(1.0, 7.25, 12.5, 29.75, 7.5, 16.0, C.carpet);                  // gallery floor
    f.fill(1.0, 7.5, 12.5, 29.75, 8.5, 12.75, gold);                      // gallery rail
    f.clear(0.5, 0.5, 12.5, 1.0, 7.25, 16);                               // keep the wall edge tidy
    f.clear(0.5, 0.5, VL - 0.5, 3.0, 3.5, VL + 0.5); f.clear(U1 - 3.0, 0.5, VL - 0.5, U1 - 0.5, 3.5, VL + 0.5);   // side doors (re-cut after the wall dressing)
    // ---- AUDITORIUM
    const aud0 = VL + 0.5;   // v 16.5
    // side aisles flat at y 0.5 (u 0.5..3 and U1-3..U1-0.5), rows rise toward the back; centre aisle u 19.5..21.5 stepped
    const rowY = (v) => 0.5 + 0.25 * Math.max(0, Math.floor((46 - v) / 2));
    f.each(0.5, 0.25, aud0, U1 - 0.5, 0.5, VA - 0.5, (u, y, v) => ((Math.floor(u * 2) + Math.floor(v * 2)) % 7 === 0) ? C.carpetG : C.carpet);
    for (let v = 22; v < 46; v += 2) { const y = rowY(v); if (y > 0.5) f.fill(3.0, 0.5, v, U1 - 3.0, y, v + 2, C.carpet); }
    f.fill(3.0, 0.5, aud0, U1 - 3.0, rowY(22), 22, C.carpet);                         // rear cross-aisle (under the balcony)
    for (let v = 22; v < 46; v += 2) f.fill(3.0, 0.5, v + 1.75, 3.25, rowY(v) + 0.75, v + 2, gold);   // row-end lamps line
    // walls: red velvet dado, cream above, gold pilasters with lamps
    f.fill(0.5, 0.5, aud0, 0.75, 3.0, VA - 0.5, red); f.fill(U1 - 0.75, 0.5, aud0, U1 - 0.5, 3.0, VA - 0.5, red);
    for (let v = aud0 + 3; v < VA - 7; v += 5) for (const u of [0.5, U1 - 1.0]) { f.fill(u, 3.0, v, u + 0.5, AUD - 1.0, v + 0.75, gold); f.fill(u + (u < 1 ? 0.5 : -0.25), 6.0, v, u + (u < 1 ? 0.75 : 0), 6.75, v + 0.75, C.lamp); }
    f.each(1, AUD - 1.25, aud0, U1 - 1, AUD - 1.0, VA - 0.5, (u, y, v) => ((Math.floor(u) % 5 === 0 || Math.floor(v) % 5 === 0) ? C.gold : (TS.hash(u * 4, v * 4, 3) < 0.035 ? (TS.hash(u * 4, v * 4, 9) < 0.5 ? C.starA : C.starB) : C.navy)));   // ceiling
    for (const [u, v] of [[10, 30], [30, 30], [20, 40], [10, 44], [30, 44]]) f.fill(u, AUD - 1.5, v, u + 0.5, AUD - 1.25, v + 0.5, C.lamp);
    // seats: row models (occupant faces +v, toward the screen)
    const seatRow = (n, key) => TS.geo('seatrow' + key, () => { const m = M(n * 5, 8, 6); for (let i = 0; i < n; i++) { const x = i * 5; m.box(x, 0, 1, x + 1, 4, 6, C.iron); m.box(x + 1, 2, 2, x + 5, 3, 6, C.seat); m.box(x + 1, 3, 0, x + 5, 8, 2, C.velvet); m.box(x + 1, 3, 2, x + 5, 3, 5, C.seat); m.box(x, 4, 2, x + 1, 5, 5, C.gold); } m.box(n * 5 - 1, 0, 1, n * 5, 5, 6, C.iron); return m; }, 1 / 8, [0.5, 0, 0.5]);
    const rowL = seatRow(26, 'L'), rowR = seatRow(26, 'R');   // 26 seats × 0.625 = 16.25 m
    let seats = 0, sits = 0;
    for (let v = 23; v <= 45; v += 1) {
      const y = rowY(v);
      f.place(rowL, 3.25 + 16.25 / 2, y, v, 0, 1); f.place(rowR, 21.5 + 16.25 / 2, y, v, 0, 1); seats += 52;
      if (v % 3 === 0) for (const u of [8.1, 14.35, 27.1, 33.35]) { const p = f.w(u, v + 0.05); AF.addSpot({ building: 'paramount', x: p[0], y: y + 0.4, z: p[1], yaw: f.yaw(0, 1), kind: 'sit' }); sits++; }
    }
    // centre aisle stays clear u 19.5..21.5 (rowL ends at 19.5, rowR starts at 21.5)
    // stage, proscenium, curtains, screen, organ
    f.fill(1, 0.5, 49, U1 - 1, 1.75, VA - 0.5, C.woodD); f.fill(1, 1.5, 49, U1 - 1, 1.75, 49.25, gold);
    f.fill(1, 0.5, 48.75, U1 - 1, 1.5, 49, C.redD);
    f.fill(0.5, 1.75, 49, 4.5, AUD - 1.0, 50, gold); f.fill(U1 - 4.5, 1.75, 49, U1 - 0.5, AUD - 1.0, 50, gold); f.fill(0.5, 12.5, 49, U1 - 0.5, AUD - 1.0, 50, gold);
    f.each(4.5, 12.0, 49, U1 - 4.5, 12.5, 49.5, (u) => (Math.floor(u * 2) % 3 === 0 ? C.gold : C.redD));
    f.each(4.5, 10.75, 49.5, U1 - 4.5, 12.0, 49.75, (u, y) => ((Math.floor(u * 2) % 2 === 0 && y < 11.25) ? null : C.curtain));   // valance
    for (const [a, b] of [[4.5, 8.0], [U1 - 8.0, U1 - 4.5]]) f.each(a, 1.75, 49.5, b, 11.0, 50.25, (u, y, v) => (Math.floor(u * 4) % 3 === 0 && v > 49.9 ? null : C.curtain));
    f.each(8.0, 2.5, 55.0, U1 - 8.0, 11.0, 55.25, (u, y) => TS.filmPix((u - 8) / (U1 - 16), (y - 2.5) / 8.5)); f.fill(7.75, 2.25, 55.25, U1 - 7.75, 11.25, 55.5, C.black);
    f.light(20.5, 6, 52, 0xdfe8ff, 1.4, 22);
    TS.beamFrom = f.w(20.5, 17.2).concat([12.4]); TS.beamTo = f.w(20.5, 55).concat([6.75]);
    const organ = TS.geo('organ', () => { const m = M(20, 14, 12); m.box(0, 0, 0, 20, 7, 10, C.gold); m.box(1, 7, 3, 19, 13, 10, C.redD); for (let x = 2; x < 18; x += 1) m.set(x, 7, 2, x % 2 ? C.white : C.black); m.box(2, 6, 0, 18, 7, 3, C.white); m.box(0, 13, 3, 20, 14, 10, C.gold); for (let x = 2; x < 18; x += 3) m.box(x, 8, 10, x + 1, 13, 12, C.brass); return m; }, 1 / 8, [0.5, 0, 0.5]);
    f.place(organ, 6, 0.5, 47.5, 0, -1, true);
    { const p = f.w(6, 46.2); AF.addSpot({ building: 'paramount', x: p[0], y: 0.5, z: p[1], yaw: f.yaw(0, 1), kind: 'work' }); }
    // exit signs over the side doors + stage-end exits
    const exitG = TS.sign('EXIT', C.exit, C.black, 1 / 24);
    f.place(exitG, 1.75, 3.9, VL + 0.5, 0, 1); f.place(exitG, U1 - 1.75, 3.9, VL + 0.5, 0, 1);
    f.place(exitG, 0.75, 3.5, 47.5, 1, 0); f.place(exitG, U1 - 0.75, 3.5, 47.5, -1, 0);
    // ---- BALCONY: v 16.5..28 at y 7.5, rows rising toward the back, gold rail at the front edge (v 28)
    f.fill(0.5, 7.0, aud0, U1 - 0.5, 7.5, 28.0, C.carpet);
    f.fill(0.5, 6.5, 27.5, U1 - 0.5, 7.0, 28.25, gold);   // fascia
    for (let v = 19; v < 27; v += 1) { const y = 7.5 + 0.25 * Math.floor((27 - v) / 2); if (y > 7.5) f.fill(0.5, 7.5, v, U1 - 0.5, y, v + 1, C.carpet); }
    f.fill(0.5, 7.5, 17.5, U1 - 0.5, 8.5, 19, C.carpet);
    for (let k = 1; k <= 3; k++) f.fill(0.5, 7.5, aud0 + (k - 1) * 0.25, U1 - 0.5, 7.5 + k * 0.25, aud0 + k * 0.25, C.carpet);
    f.fill(0.5, 7.5, aud0 + 0.75, U1 - 0.5, 8.5, 17.5, C.carpet);
    f.fill(0.5, 7.5, 27.75, U1 - 0.5, 8.5, 28.0, gold);    // balcony rail
    f.fill(0.5, 8.5, 27.75, U1 - 0.5, 8.75, 28.0, C.redD);
    const bRow = seatRow(24, 'B');
    for (let v = 20; v <= 26; v += 1) {
      const y = 7.5 + 0.25 * Math.floor((27 - v) / 2);
      f.place(bRow, 4 + 7.5, y, v, 0, 1); f.place(bRow, U1 - 4 - 7.5, y, v, 0, 1); seats += 48;
      if (v % 2 === 0) for (const u of [7.0, 14.0, 26.9, 33.9]) { const p = f.w(u, v + 0.05); AF.addSpot({ building: 'paramount', x: p[0], y: y + 0.4, z: p[1], yaw: f.yaw(0, 1), kind: 'sit' }); sits++; }
    }
    TS.paramountSeats = seats; TS.paramountSits = sits;
    // ---- the audience: seated patrons (static figures), usherettes with torches, a lit organ, bright EXIT signs
    const skin = [AF.col(0xe8c0a0), AF.col(0xc89070), AF.col(0x8a5a3a), AF.col(0xf0d0b8)], hair = [C.black, AF.col(0x5a3a22), AF.col(0xc8a060), AF.col(0x8a3a1a)];
    const coats = [C.navy, C.redD, AF.col(0x4a4a50), AF.col(0x3a5a3a), AF.col(0x6a4a8a), C.woodD, AF.col(0x8a7a60)];
    TS.patron = (k) => TS.geo('patron' + k, () => { const m = M(4, 8, 3), coat = coats[k % coats.length]; m.box(0, 0, 0, 4, 4, 3, coat); m.box(1, 4, 1, 3, 6, 3, skin[k % 4]); m.box(1, 6, 1, 3, 7, 3, hair[(k >> 1) % 4]); if (k % 3 === 0) { m.box(0, 6, 0, 4, 7, 3, C.black); m.box(1, 7, 0, 3, 8, 3, C.black); } else m.box(1, 5, 0, 3, 7, 1, hair[(k >> 1) % 4]); return m; }, 1 / 8, [0.5, 0, 0.5]);
    const aud = AF.rng(4242); let patrons = 0;
    for (let v = 23; v <= 45; v++) for (const side of [0, 1]) for (let i = 0; i < 26; i++) { if (aud() > 0.22) continue; f.place(TS.patron(Math.floor(aud() * 12)), (side ? 21.5 : 3.25) + i * 0.625 + 0.375, rowY(v) + 0.4, v + 0.05, 0, 1); patrons++; }
    for (let v = 20; v <= 26; v++) for (const side of [0, 1]) for (let i = 0; i < 24; i++) { if (aud() > 0.25) continue; const y = 7.5 + 0.25 * Math.floor((27 - v) / 2), u = (side ? U1 - 19 : 4) + i * 0.625 + 0.375; f.place(TS.patron(Math.floor(aud() * 12)), u, y + 0.4, v + 0.05, 0, 1); patrons++; }
    TS.paramountPatrons = patrons;
    const usher = TS.geo('usherette', () => { const m = M(4, 14, 3); m.box(1, 0, 1, 2, 6, 2, C.black); m.box(2, 0, 1, 3, 6, 2, C.black); m.box(0, 5, 0, 4, 10, 3, C.red); m.box(0, 9, 0, 4, 10, 3, C.gold); m.box(1, 10, 1, 3, 12, 3, skin[0]); m.box(1, 12, 0, 3, 13, 3, hair[2]); m.box(1, 13, 1, 3, 14, 2, C.red); m.box(3, 6, 2, 4, 8, 3, C.brass); m.set(3, 7, 2, C.lamp); return m; }, 1 / 8, [0.5, 0, 0.5]);
    for (const [u, v, du] of [[1.75, 30, 1], [U1 - 1.75, 36, -1], [20.5, 26.5, 0], [1.75, 17.5, 1]]) { const y = u > 19 && u < 22 ? rowY(v) : 0.5; f.place(usher, u, y, v, du, du ? 0 : 1); const p = f.w(u, v + 0.6); AF.addSpot({ building: 'paramount', x: p[0], y, z: p[1], yaw: f.yaw(du, du ? 0 : 1), kind: 'stand' }); }
    for (const [u, v] of [[2.2, 31], [U1 - 2.7, 37]]) f.fill(u, 0.5, v, u + 0.5, 0.55, v + 0.5, C.lamp);
    const bigExit = TS.sign('EXIT', C.exit, C.black, 1 / 12);
    for (const [u, du] of [[0.75, 1], [U1 - 0.75, -1]]) { f.place(bigExit, u, 4.2, 40, du, 0); f.place(bigExit, u, 4.2, 22, du, 0); f.light(u + du, 4, 40, 0xff3030, 0.6, 5); }
    f.fill(4.5, 1.75, 46.9, 7.5, 2.0, 47.0, C.lamp); f.fill(4.25, 2.25, 47.5, 7.75, 2.5, 48.9, C.lampR); f.light(6, 2.5, 46.5, 0xffb070, 1.0, 6);
    for (const v of [30, 40]) f.light(20.5, 6, v, 0xffb080, 0.8, 14);
    // registration
    const door = f.w(tb - 3, -1.5);
    AF.addBuilding({ id: 'paramount', name: 'The Paragon', kind: 'theatre', box: f.box(0, 0.25, -5, U1, TOP + 7, VA), doors: [{ x: door[0], y: 0.25, z: door[1], yaw: f.yaw(0, 1) }, { x: f.w(tb + 3, -1.5)[0], y: 0.25, z: f.w(tb + 3, -1.5)[1], yaw: f.yaw(0, 1) }], floors: [0.5, 7.5], interior: true, owner: 'theatre-shops' });
    TS.paramount = { f, U1, VL, VA, tb, TOP };
    { const p = f.w(tb, -0.8); AF.addInteract({ x: p[0], y: 1.5, z: p[1], r: 2.2, label: 'Buy a ticket (25c)', act: () => AF.emit('toast', 'One for RHYTHM ON THE PIER, balcony. "Enjoy the picture — the newsreel starts at seven."') }); }
    { const p = f.w(16, cvv - 0.9); AF.addInteract({ x: p[0], y: 1.5, z: p[1], r: 2.2, label: 'Buy popcorn', act: () => AF.emit('toast', 'A striped bag of hot buttered popcorn — a nickel.') }); }
    AF.addViewpoint('Theatre Row', [12, 9, 190], [2, 7, 90]);
    AF.addViewpoint('The Paragon', [-6, 3, 150], [12, 8, 126]);
    AF.addViewpoint('Inside the Paragon', [48, 9.5, 110.5], [48, 5, 146]);
    AF.addLabel('Theatre Row', 0, 118, 'place');
  };

  // ================================================================= THE PARAGON — round 2 showcase dressing (lobby + auditorium)
  // deco murals (1/8 m pixels, 10 m x 6 m): 'harbour' = sunset harbour with a liner, 'stardust' = night skyline with searchlights
  TS.mural = (kind) => TS.geo('mural-' + kind, () => {
    const C = TS.C, W = 80, H = 48, m = M(W, H, 2), s = (h) => AF.col(h, { smooth: true, rough: 0.7, win: 'none' });
    const gold = AF.MAT.gold ?? C.gold, bronze = AF.MAT.bronze ?? C.bronze;
    const glow = AF.col(0xffe7a8, { emit: 0xffd070, emitK: 0.7, mode: 'night', jitter: 0, edge: 0, pat: 'none' });
    for (let x = 0; x < W; x++) for (let y = 0; y < H; y++) {
      const e = Math.min(x, y, W - 1 - x, H - 1 - y);
      if (e < 2) { m.set(x, y, 0, gold); m.set(x, y, 1, (e === 0 || ((x + y) % 4 === 0)) ? gold : bronze); continue; }
      m.set(x, y, 0, C.black);
      const nx = (x - 2) / (W - 4), ny = (y - 2) / (H - 4);
      let c;
      if (kind === 'harbour') {
        const hz = 0.36, dx = (nx - 0.5) * 1.73, dy = ny - hz, r = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
        const bands = [s(0xf4a24a), s(0xf6be78), s(0xee8e8a), s(0xb66e9a), s(0x5a4a8a), s(0x2e3264)];
        const bi = Math.min(5, Math.max(0, Math.floor((ny - hz) / 0.11)));
        if (ny >= hz) {
          c = bands[bi];
          if (r > 0.2 && (Math.floor(a * 14 / Math.PI) & 1)) c = bands[Math.max(0, bi - 1)];
          if (r < 0.17) c = (ny < hz + 0.1 && Math.floor(y) % 3 === 0) ? bands[0] : s(0xfff0a0);
          const tw = (nx < 0.3) ? [0.18, 0.3, 0.22, 0.4, 0.26, 0.34, 0.2][Math.floor(nx * 23) % 7] : (nx > 0.74 ? [0.28, 0.46, 0.24, 0.36, 0.3, 0.52, 0.22][Math.floor(nx * 23) % 7] : 0);
          if (ny < hz + tw) { c = s(0x3a2a4a); if (x % 3 === 1 && y % 3 === 1 && TS.hash(x, y, 5) < 0.35) c = glow; if (nx > 0.74 && tw > 0.5 && ny > hz + tw - 0.05 && Math.abs(nx - 0.9) < 0.01) c = gold; }
          if (ny > 0.8 && TS.hash(x, y, 9) < 0.02) c = s(0xfff4d8);
          const gx = [[0.2, 0.8], [0.3, 0.74], [0.62, 0.86]]; for (const [gxx, gyy] of gx) if (Math.abs(ny - gyy + Math.abs(nx - gxx) * 0.9) < 0.012 && Math.abs(nx - gxx) < 0.025) c = s(0x2a2030);
        } else {
          c = (Math.floor(y) % 2) ? s(0x1e3a62) : s(0x2a5a7a);
          if (Math.abs(dx) < 0.12 * (1 - (hz - ny) * 1.2) && Math.floor(y) % 2 === 0 && TS.hash(x, y, 3) < 0.7) c = s(0xffd070);
          if (ny < 0.06) c = s(0x16243a);
        }
        // the liner
        if (nx > 0.54 && nx < 0.88 && ny > 0.27 && ny < 0.36 && nx < 0.88 - (ny - 0.27) * 0.3 * 0 - (0.36 - ny) * 0.4 + 0.02) c = ny < 0.295 ? s(0xa02a2a) : s(0x141418);
        if (nx > 0.6 && nx < 0.8 && ny >= 0.36 && ny < 0.42) c = (Math.floor(y) === 39 - 0 || x % 2) ? s(0xf2ece0) : glow;
        for (const fx of [0.64, 0.7, 0.76]) if (Math.abs(nx - fx) < 0.018 && ny >= 0.42 && ny < 0.52) c = ny > 0.48 ? s(0x141418) : s(0xc83a2a);
        if (nx > 0.57 && nx < 0.83 && Math.abs(ny - 0.63) < 0.004) c = C.black;
      } else {
        const dy = ny, sky = [s(0x0e1434), s(0x18204a), s(0x262c64), s(0x3a3474)];
        c = sky[Math.min(3, Math.max(0, 3 - Math.floor(dy * 4)))];
        if (TS.hash(x, y, 11) < 0.035 && ny > 0.4) c = s(0xfff4d8);
        const mx = (nx - 0.8) * 1.73, my = ny - 0.8; if (Math.hypot(mx, my) < 0.1 && Math.hypot(mx + 0.05, my - 0.03) > 0.09) c = s(0xfff0c0);
        // searchlight beams from the foot of the tower
        for (const [bx, sl] of [[0.36, -1.4], [0.64, 1.1]]) { const lx = bx + (ny - 0.1) / sl; if (Math.abs(nx - lx) < 0.012 + ny * 0.03 && ny > 0.1) c = (Math.floor(y) + x) % 2 ? s(0xf6eec0) : s(0xd8d2b0); }
        // the tower: stepped setbacks, a spire, lit windows
        const tw = Math.abs(nx - 0.5), top = tw < 0.012 ? 0.97 : tw < 0.03 ? 0.86 : tw < 0.06 ? 0.78 : tw < 0.09 ? 0.68 : tw < 0.12 ? 0.56 : -1;
        if (ny < top) { c = s(0x2a2444); if (x % 2 === 0 && y % 3 === 1 && TS.hash(x, y, 7) < 0.55) c = glow; if (tw < 0.012 && ny > 0.86) c = gold; }
        const side = (nx < 0.28 ? [0.3, 0.42, 0.26, 0.36][Math.floor(nx * 17) % 4] : nx > 0.72 ? [0.34, 0.24, 0.44, 0.3][Math.floor(nx * 17) % 4] : 0);
        if (ny < side) { c = s(0x1c1830); if (x % 3 === 0 && y % 3 === 2 && TS.hash(x, y, 13) < 0.4) c = glow; }
        if (ny < 0.1) c = (x % 3 === 0) ? gold : s(0x141020);
        if (ny < 0.12 && ny >= 0.1) c = gold;
      }
      m.set(x, y, 1, c);
    }
    // stepped deco crown on the frame
    for (let x = W / 2 - 10; x < W / 2 + 10; x++) for (let y = H - 2; y < H; y++) m.set(x, y, 1, gold);
    return m;
  }, 1 / 8, [0.5, 0, 0]);
  TS.fanSconce = () => TS.geo('fan-sconce', () => {
    const C = TS.C, m = M(10, 12, 3), gold = AF.MAT.gold ?? C.gold, glass = AF.col(0xfff2d8, { emit: 0xffcf88, emitK: 1.9, mode: 'always', jitter: 0, edge: 0, pat: 'none' });
    m.box(4, 0, 0, 6, 12, 1, gold);
    for (let x = 0; x < 10; x++) for (let y = 4; y < 12; y++) { const dx = x + 0.5 - 5, dy = y + 0.5 - 4, r = Math.hypot(dx, dy); if (r < 5.2) { const a = Math.atan2(dy, dx); m.set(x, y, 1, (r > 4.4 || Math.floor(a * 8 / Math.PI) % 2 === 0) ? gold : glass); m.set(x, y, 2, r < 4.4 && Math.floor(a * 8 / Math.PI) % 2 === 1 ? glass : 0); } }
    m.box(4, 2, 1, 6, 4, 2, gold); m.set(4, 1, 1, gold);
    return m;
  }, 1 / 16, [0.5, 0, 0]);
  TS.grandChand = () => TS.geo('grand-chandelier', () => {
    const C = TS.C, m = M(36, 46, 36), gold = AF.MAT.gold ?? C.gold, cryst = AF.col(0xf4f8ff, { emit: 0xfff0d8, emitK: 1.1, mode: 'always', jitter: 0, edge: 0, pat: 'none', glass: true }), lamp = C.lamp;
    m.box(17, 32, 17, 19, 46, 19, gold); m.box(14, 44, 14, 22, 46, 22, gold);
    const ring = (r, y, n) => { for (let a = 0; a < 160; a++) { const t = a / 160 * Math.PI * 2; m.set(Math.floor(18 + Math.cos(t) * r), y, Math.floor(18 + Math.sin(t) * r), gold); }
      for (let k = 0; k < n; k++) { const t = k / n * Math.PI * 2, x = Math.floor(18 + Math.cos(t) * r), z = Math.floor(18 + Math.sin(t) * r); m.box(x, y + 1, z, x + 1, y + 3, z + 1, lamp); for (let d = 1; d < 5 + (k % 3) * 2; d++) m.set(x, y - d, z, d % 2 ? cryst : gold); m.line(x, y, z, 18, y + 8, 18, gold); } };
    ring(16, 14, 20); ring(12, 21, 16); ring(8, 27, 12); ring(4, 32, 8);
    for (let a = 0; a < 48; a++) { const t = a / 48 * Math.PI * 2; for (let y = 6; y < 14; y++) { const r = 3 + (y - 6) * 1.5; if ((a + y) % 2) m.set(Math.floor(18 + Math.cos(t) * r), y, Math.floor(18 + Math.sin(t) * r), cryst); } }
    m.sphere(18, 6, 18, 4, lamp); m.box(17, 0, 17, 19, 3, 19, gold);
    return m;
  }, 1 / 10, [0.5, 1, 0.5]);
  const paragonPlus = () => {
    const P = TS.paramount; if (!P) return;
    const C = TS.C, f = P.f, U1 = P.U1, VL = P.VL, VA = P.VA, gold = AF.MAT.gold ?? C.gold, red = C.redD;
    const cream = AF.col(0xf2e4c4, { smooth: true }), jadeP = AF.col(0x2f6f62, { smooth: true }), damask = AF.col(0x7e1a2a, { smooth: true }), damG = AF.col(0xa8783a, { smooth: true, metal: 0.5, rough: 0.45 });
    const ros = AF.col(0xfff0d0, { emit: 0xffd8a0, emitK: 1.3, mode: 'always', jitter: 0, edge: 0, pat: 'none' });
    const cove = AF.col(0xfff0d8, { emit: 0xffc878, emitK: 1.6, mode: 'always', jitter: 0, edge: 0, pat: 'none' });
    const mirror = AF.col(0xcfc4a6, { metal: 1, rough: 0.06, jitter: 0, edge: 0, pat: 'none' });
    // ---- coffered ceiling: gold beams on a 2.5 m grid, jade coffers with glowing rosettes, a lit cove round the edge
    f.clear(0.75, 10.5, 0.75, U1 - 0.75, 11.0, VL - 0.25);
    f.each(0.75, 10.5, 0.75, U1 - 0.75, 11.0, VL - 0.25, (u, y, v) => {
      const gu = (u - 0.75) % 2.5, gv = (v - 0.75) % 2.5; if (gu < 0.25 || gv < 0.25) return gold;
      if (y < 10.75) return null; const r = Math.hypot(gu + 0.125 - 1.375, gv + 0.125 - 1.375);
      return r < 0.3 ? ros : r < 0.6 ? gold : (((Math.floor((u - 0.75) / 2.5) + Math.floor((v - 0.75) / 2.5)) & 1) ? jadeP : cream);
    });
    for (const [a, b, c2, d] of [[0.5, 10.0, 0.5, U1 - 0.5], [0.5, 10.0, VL - 0.5, U1 - 0.5]]) { f.fill(a, b, c2, d, b + 0.25, c2 + 0.25, gold); f.fill(a, b + 0.25, c2, d, b + 0.5, c2 + 0.25, cove); }
    for (const u of [0.75, U1 - 1.0]) { f.fill(u, 10.0, 0.5, u + 0.25, 10.25, VL - 0.25, gold); f.fill(u, 10.25, 0.5, u + 0.25, 10.5, VL - 0.25, cove); }
    // ---- back wall: smoked mirrors under the gallery between the gilded pilasters, damask above, fan sconces on every pilaster
    const mir = TS.geo('lobby-mirror', () => { const m = M(26, 34, 2); m.box(0, 0, 0, 26, 34, 1, gold); m.box(1, 1, 1, 25, 33, 2, gold); m.box(2, 2, 1, 24, 32, 2, mirror); for (let y = 2; y < 32; y += 6) m.box(2, y, 1, 24, y + 1, 2, AF.MAT.bronze ?? C.bronze); for (let x = 9; x < 17; x++) for (let y = 26; y < 32; y++) if ((x + y) % 3 === 0) m.set(x, y, 1, gold); return m; }, 1 / 8, [0.5, 0, 0]);
    for (let u = 6.5; u + 3.5 <= U1 - 1; u += 4) { if (u + 3.5 > 29.5) continue; f.place(mir, u + 1.75, 2.5, VL - 0.25, 0, -1); }
    f.each(0.75, 8.5, VL - 0.5, U1 - 0.75, 10.0, VL - 0.25, (u, y) => { if (u >= 2.5 && u < 6.0) return null;   // keep the gallery→balcony door clear
      const iu = Math.floor(u * 4), iy = Math.floor(y * 4); const kk = iu % 16; if (kk === 8 || kk === 9) return null; return (iu % 4 === 2 && iy % 4 === 2) ? damG : damask; });
    for (let u = 2; u < U1 - 1; u += 4) { if (u < 29 || u > 37) f.place(TS.fanSconce(), u + 0.25, 4.6, VL - 0.5, 0, -1); f.place(TS.fanSconce(), u + 0.25, 8.9, VL - 0.5, 0, -1); }
    for (let u = 6; u < U1 - 4; u += 8) f.light(u, 5, VL - 1.5, 0xffc880, 0.7, 7);
    // ---- the gallery: a gilded balustrade (open balusters, velvet handrail) and a bulb-lit fascia
    f.clear(1.0, 7.5, 12.5, 29.75, 8.5, 12.75);
    f.each(1.0, 7.5, 12.5, 29.75, 8.5, 12.75, (u, y) => (y >= 8.25 ? C.velvet : y >= 8.0 ? gold : (Math.floor(u * 4) % 2 === 0 ? gold : null)));
    f.each(1.0, 6.75, 12.25, 29.75, 7.25, 12.5, (u, y) => (y < 7.0 ? ((Math.floor(u * 4) % 3 === 1) ? TS.b3(Math.floor(u * 4)) : gold) : red));
    // ---- grand stair: open gilt balusters with a mahogany handrail, stair rods, and a torchère on the newel
    for (let k = 0; k < 28; k++) { const u = 36.75 - k * 0.25; f.clear(u, 1.0 + k * 0.25, 12.75, u + 0.25, 1.75 + k * 0.25, 13.0); }
    for (let k = 1; k <= 28; k++) { const u = 36.75 - k * 0.25, top = 0.5 + k * 0.25; if (k % 2) f.fill(u, top, 12.75, u + 0.25, top + 0.75, 13.0, gold); f.fill(u, top + 0.75, 12.75, u + 0.25, top + 1.0, 13.0, C.woodD); }
    const torch = TS.geo('torchere', () => { const m = M(8, 40, 8), br = AF.MAT.bronze ?? C.bronze; m.box(1, 0, 1, 7, 3, 7, br); m.box(3, 3, 3, 5, 30, 5, br); for (let y = 8; y < 30; y += 7) m.box(2, y, 2, 6, y + 1, 6, gold); m.sphere(4, 34, 4, 3.6, C.lamp); m.box(2, 30, 2, 6, 31, 6, gold); return m; }, 1 / 16, [0.5, 0, 0.5]);
    f.place(torch, 37.3, 0.5, 12.6, 0, -1, true); f.light(37.3, 2.5, 12.2, 0xffd49a, 0.9, 8);
    // ---- murals at both ends of the lobby, sconces flanking them
    f.place(TS.mural('harbour'), 0.5, 4.0, 6.5, 1, 0);
    f.place(TS.mural('stardust'), U1 - 0.5, 4.0, 6.5, -1, 0);
    for (const [u, du] of [[0.75, 1], [U1 - 0.75, -1]]) { for (const v of [0.9, 12.1]) f.place(TS.fanSconce(), u, 6.2, v, du, 0); f.light(u + du * 2.5, 7.5, 6.5, 0xffd8a0, 1.0, 11); }
    // ---- the great chandelier (+ two more small ones at the ends), lit
    f.place(TS.grandChand(), 20.5, 10.5, 8.0, 0, -1);
    f.light(20.5, 6.5, 8.0, 0xffd49a, 1.8, 18); f.light(9, 7, 7, 0xffd49a, 1.0, 12); f.light(32, 7, 7, 0xffd49a, 1.0, 12);
    // ---- floor: two round velvet ottomans with palms, a standee, the ticket chopper, ushers and early patrons
    const otto = TS.geo('ottoman', () => { const m = M(20, 30, 20); m.sphere(10, 0, 10, 9.6, C.velvet, (x, y) => (y < 4 ? (y === 3 ? C.velvet : (y === 0 ? gold : C.redD)) : 0)); m.sphere(10, 4, 10, 5.5, C.velvet, (x, y) => (y >= 4 && y < 9 ? C.velvet : 0)); m.box(8, 9, 8, 12, 11, 12, gold); m.box(9, 11, 9, 11, 16, 11, C.woodD); for (let k = 0; k < 10; k++) { const t = k / 10 * Math.PI * 2; m.line(10, 16, 10, Math.round(10 + Math.cos(t) * 7), 22 + (k % 3) * 2, Math.round(10 + Math.sin(t) * 7), C.leaf); m.line(10, 16, 10, Math.round(10 + Math.cos(t + 0.3) * 5), 27, Math.round(10 + Math.sin(t + 0.3) * 5), C.leaf); } return m; }, 1 / 8, [0.5, 0, 0.5]);
    f.place(otto, 7, 0.5, 10.3, 0, -1, true); f.place(otto, 34, 0.5, 8.0, 0, -1, true);
    const easel = TS.geo('standee-easel', () => { const m = M(12, 8, 8), br = AF.MAT.brass ?? C.brass; m.box(1, 0, 5, 2, 8, 6, br); m.box(10, 0, 5, 11, 8, 6, br); m.box(1, 7, 5, 11, 8, 6, br); m.box(5, 0, 1, 7, 7, 3, br); return m; }, 1 / 8, [0.5, 0, 0.5]);
    for (const [u, v, i] of [[26.5, 6.0, 0], [14.2, 7.5, 3]]) { f.place(easel, u, 0.5, v, 0, -1); f.place(TS.oneSheet(i), u, 1.0, v - 0.1, 0, -1); f.place(TS.oneSheet(i), u, 1.0, v + 0.1, 0, 1); }
    const chop = TS.geo('ticket-chopper', () => { const m = M(6, 10, 5), br = AF.MAT.brass ?? C.brass; m.box(0, 0, 0, 6, 1, 5, br); m.box(1, 1, 1, 5, 7, 4, C.woodD); m.box(0, 7, 0, 6, 10, 5, C.glass); m.box(0, 9, 0, 6, 10, 5, br); m.box(2, 3, 4, 4, 5, 5, br); return m; }, 1 / 8, [0.5, 0, 0.5]);
    f.place(chop, 15.6, 0.5, 5.0, 0, -1, true);
    const usher = TS.geo('usher-m', () => { const m = M(8, 30, 5), sk = AF.col(0xc89070, { jitter: 0.1 }), jk = AF.col(0x9a1a24), br = AF.MAT.brass ?? C.brass; m.box(2, 0, 1, 6, 1, 4, C.black); m.box(2, 1, 1, 4, 11, 4, C.black); m.box(4, 1, 1, 6, 11, 4, C.black); m.box(1, 10, 1, 7, 21, 4, jk); for (let y = 12; y < 20; y += 2) { m.set(3, y, 4, br); m.set(5, y, 4, br); } m.box(0, 12, 1, 1, 20, 4, jk); m.box(7, 12, 1, 8, 20, 4, jk); m.box(0, 11, 2, 1, 12, 3, C.white); m.box(7, 11, 2, 8, 12, 3, C.white); m.box(1, 19, 1, 7, 21, 4, br); m.box(3, 21, 1, 5, 22, 4, sk); m.box(2, 22, 1, 6, 26, 4, sk); m.box(2, 25, 0, 6, 27, 4, C.black); m.set(3, 24, 4, C.black); m.set(5, 24, 4, C.black); m.box(2, 27, 1, 6, 29, 4, jk); m.box(2, 28, 1, 6, 29, 4, br); m.box(7, 10, 3, 8, 14, 5, C.black); m.set(7, 9, 4, C.lamp); return m; }, 1 / 16, [0.5, 0, 0.5]);
    for (const [u, v, du, dv] of [[16.3, 5.6, -1, 0], [3.9, 14.6, 0, -1], [38.7, 11.0, -1, 0], [30.6, 8.4, -1, 0]]) f.place(usher, u, 0.5, v, du, dv);
    for (const [u, v, k, du, dv] of [[5.2, 5.0, 1, 1, 0.2], [6.0, 5.2, 4, -1, 0], [27.6, 7.2, 3, -0.3, -1], [28.3, 7.0, 7, -0.5, -1], [11.6, 9.5, 5, 0, 1], [36.2, 5.2, 0, 1, 0], [36.8, 5.8, 9, -1, -0.3], [24.3, 10.4, 8, 0, 1]]) f.place(TS.figure(k), u, 0.5, v, du, dv);
    // ---- AUDITORIUM: a deep midnight dome with sparse stars (not noise), organ grilles glowing amber either side of the proscenium,
    // gilded box seats, a stepped fan of bulbs over the proscenium and a lit footlight trough
    const sky = AF.col(0x1a2350, { smooth: true, win: 'none' }), sky2 = AF.col(0x243066, { smooth: true, win: 'none' }), cloud = AF.col(0x3a4278, { smooth: true, win: 'none' });
    f.each(1, 16.25, VL + 0.5, U1 - 1, 16.5, VA - 0.5, (u, y, v) => { const h = TS.hash(u * 4, v * 4, 3); if (h < 0.012) return h < 0.006 ? C.starA : C.starB; const n = AF.noise2 ? AF.noise2(u * 0.12, v * 0.12) : 0.5; return n > 0.68 ? cloud : n > 0.52 ? sky2 : sky; });
    f.each(1, 16.0, VL + 0.5, U1 - 1, 16.25, VA - 0.5, (u, y, v) => ((u < 1.5 || u > U1 - 1.5 || v > VA - 1.0 || v < VL + 1.0) ? gold : null));
    const amber = AF.col(0xffc070, { emit: 0xffa040, emitK: 1.3, mode: 'always', jitter: 0, edge: 0, pat: 'none' });
    for (const [u0, u1, uf] of [[0.5, 0.75, 1], [U1 - 0.75, U1 - 0.5, -1]]) {
      f.clear(uf > 0 ? 0.5 : U1 - 1.25, 3.0, 40.5, uf > 0 ? 1.25 : U1 - 0.5, 16.0, 47.5);
      f.each(u0, 5.0, 40.5, u1, 13.0, 47.5, (u, y, v) => { const cy = 9, cv = 44, r = Math.hypot((v + 0.125 - cv) * 1.1, y + 0.125 - cy); if (r > 4.0) return null; if (r > 3.6) return gold; const a = Math.atan2(y + 0.125 - cy, v + 0.125 - cv); return (Math.floor(a * 10 / Math.PI) & 1) && r > 0.8 ? gold : amber; });
      f.light(u0 + uf * 2, 9, 44, 0xffa860, 1.0, 12);
      // box seats: a gilded balcony box with a velvet front and two patrons
      const bu = uf > 0 ? 0.75 : U1 - 2.75; f.fill(bu, 5.0, 33, bu + 2.0, 5.25, 37, gold); f.fill(bu + (uf > 0 ? 1.75 : 0), 5.25, 33, bu + (uf > 0 ? 2.0 : 0.25), 6.25, 37, C.velvet); f.fill(bu + (uf > 0 ? 1.75 : 0), 6.25, 33, bu + (uf > 0 ? 2.0 : 0.25), 6.5, 37, gold);
      f.each(bu, 4.5, 33, bu + 2.0, 5.0, 37, (u, y, v) => (y < 4.75 && Math.floor(v * 4) % 3 === 0 ? TS.b3(Math.floor(v * 4)) : gold));
      for (const v of [34.2, 35.8]) f.place(TS.patron((v * 7) | 0), bu + 1.0, 5.25, v, uf, 0);
    }
    f.each(4.5, 12.5, 49.0, U1 - 4.5, 16.0, 49.25, (u, y) => { const dx = u + 0.125 - U1 / 2, dy = y + 0.125 - 12.5, a = Math.atan2(dy, dx), r = Math.hypot(dx, dy); if (r > 15.5) return null; return (Math.floor(a * 16 / Math.PI) & 1) ? ((Math.floor(r * 2) % 3 === 0) ? TS.b3(Math.floor(r * 4)) : gold) : red; });
    f.fill(4.5, 1.75, 48.5, U1 - 4.5, 2.0, 48.75, cove);
    // side walls: gilt-framed damask panels between the pilasters (the balcony edge and the organ grilles are left alone)
    const pil = (v) => { const k = v - (VL + 3.5); return k >= 0 && (k % 5) < 0.75; };
    for (const [u0, u1] of [[0.5, 0.75], [U1 - 0.75, U1 - 0.5]]) f.each(u0, 3.0, VL + 1.0, u1, 15.75, 40.25, (u, y, v) => {
      if (pil(v) || pil(v - 0.25 + 0.25) || (v < 28.75 && y >= 6.25 && y < 9.25)) return null;
      const k = v - (VL + 3.5), inP = ((k % 5) + 5) % 5, edge = inP < 1.0 || inP >= 4.75 || y < 3.25 || y >= 15.5 || (y >= 9.25 && y < 9.5);
      if (edge) return gold; const iv = Math.floor(v * 4), iy = Math.floor(y * 4); return (iv % 4 === 2 && iy % 4 === 2) ? damG : damask; });
  };

  // ================================================================= Bay Street shops (north face of the Paragon lot)
  const buildBayShops = () => {
    const C = TS.cols(), f = TS.frame(72, 88, 'N');   // u = 72 - x, v = z - 88
    TS.fillBldg(f, 0, 6, 16, 14, 4401);
    TS.shop(f, { id: 'bs-music', name: 'Solace Music Co.', u0: 6, w: 10, d: 16, h: 16, wall: C.brickB, trim: C.cream, sign: { text: 'SOLACE MUSIC CO', fg: C.gold, bg: C.navy }, awning: [C.navy, C.white], goods: 'records', goods2: 'mixed', floor: 'wood', left: false,
      fit: (x) => { const piano = TS.geo('piano', () => { const m = M(12, 10, 8); m.box(0, 0, 0, 12, 8, 6, C.black); m.box(0, 3, 6, 12, 4, 8, C.black); for (let i = 0; i < 12; i++) m.set(i, 4, 7, i % 2 ? C.white : C.black); m.box(0, 8, 0, 12, 9, 6, C.black); m.box(1, 9, 0, 11, 10, 1, C.woodD); return m; }, 1 / 8, [0.5, 0, 0.5]); x.f.place(piano, x.u1 - 2.5, 0.5, 7, 0, -1, true); x.spot('sit', x.u1 - 2.5, 5.8, 0, 1, 0.9); } });
    TS.shop(f, { id: 'bs-candy', name: 'Candy Kitchen', u0: 16, w: 9, d: 16, h: 14, wall: C.brickS, trim: C.white, sign: { text: 'CANDY KITCHEN', fg: C.flickPink, bg: C.navyD }, awning: [C.red, C.white], goods: 'mixed', floor: 'check', counter: 'R' });
    TS.shop(f, { id: 'bs-stationer', name: 'Harbour Stationers', u0: 25, w: 9, d: 16, h: 17, wall: C.buff, trim: C.cream, sign: { text: 'STATIONERS', fg: C.navy, bg: C.cream }, awning: [C.jade, C.cream], goods: 'books', goods2: 'mixed', floor: 'wood' });
    TS.shop(f, { id: 'bs-luggage', name: 'Mercer Luggage', u0: 34, w: 10, d: 16, h: 15, wall: C.brickR, trim: C.lime, sign: { text: 'MERCER LUGGAGE', fg: C.cream, bg: C.bronze }, awning: [C.bronze, C.cream], goods: 'hats', floor: 'wood', counter: 'R' });
    TS.shop(f, { id: 'bs-cigar', name: 'Paragon Cigars', u0: 44, w: 18, d: 16, h: 19, wall: C.cream, trim: C.gold, sign: { text: 'PARAGON CIGARS', fg: C.neonOrange, bg: C.black }, awning: [C.redD, C.gold], goods: 'cans', goods2: 'mixed', floor: 'tile', right: true, fe: 'R' });
  };

  // ================================================================= the Blue Heron + hat shop + florist (Grand Ave, east face of th-jazz)
  const buildJazzLot = () => {
    const C = TS.cols(), f = TS.frame(-10, 147, 'E');   // u = 147 - z (0 at Harbour Blvd), v = -10 - x
    // back fills first (Bay St north face + Library St west face) so the landmarks overwrite
    const fb = TS.frame(-10, 88, 'N'); TS.fillRow(fb, 0, 62, 14, 5501, 12, 20);           // u = -10 - x
    const fw = TS.frame(-72, 88, 'W'); TS.fillRow(fw, 14, 36, 12, 5502, 10, 16);          // u = z - 88
    TS.fillRow(f, 38, 45, 16, 5503, 14, 18);
    // ---- THE BLUE HERON (u 0..22, v 0..26)
    const U1 = 22, D = 26, H = 14, SH = 6.0, navy = C.navyD, wall = C.navy;
    f.fill(0, 0.25, 0, U1, H, D, wall);
    f.clear(0.5, 0.5, 0.5, U1 - 0.5, SH, D - 0.5);
    { const tin = AF.col(0x6e6456, { jitter: 0.2, metal: 0.4, rough: 0.5 }), tinD = AF.col(0x4e463c, { jitter: 0.2 }); f.each(0.25, SH, 0.5, U1 - 0.25, SH + 0.25, D - 0.25, (u, y, v) => (Math.floor(v * 4) % 12 < 2 ? C.woodD : ((Math.floor(u * 4) + Math.floor(v * 4)) % 4 === 0 ? tinD : tin))); f.fill(0.25, SH - 0.5, 0.5, U1 - 0.25, SH, D - 0.25, 0); for (let v = 1.5; v < D - 1; v += 3) f.fill(0.75, SH - 0.5, v, U1 - 0.75, SH, v + 0.5, C.woodD); f.fill(0.75, SH - 0.75, 0.75, 1.0, SH - 0.5, D - 1.0, C.neonBlue); f.fill(U1 - 1.0, SH - 0.75, 0.75, U1 - 0.75, SH - 0.5, D - 1.0, C.neonBlue); }
    f.each(0.5, 0.25, 0, U1 - 0.5, 0.5, D - 0.5, (u, y, v) => ((u > 6 && u < 16 && v > 12 && v < 20) ? (((Math.floor(u) + Math.floor(v)) & 1) ? C.black : C.white) : ((Math.floor(v * 4) % 4 === 0) ? C.woodD : C.wood)));
    f.fill(0.5, 0.5, 0.5, 0.75, SH, D - 0.5, C.redD); f.fill(U1 - 0.75, 0.5, 0.5, U1 - 0.5, SH, D - 0.5, C.redD); f.fill(0.5, 0.5, D - 0.75, U1 - 0.5, SH, D - 0.5, C.redD);
    f.fill(0.5, 2.25, 0.5, 0.75, 2.5, D - 0.5, C.gold); f.fill(U1 - 0.75, 2.25, 0.5, U1 - 0.5, 2.5, D - 0.5, C.gold);
    // facade: black granite + chrome bands, round porthole windows, a canopy, blue neon heron
    f.fill(0, 0.25, 0, U1, 6.5, 0.5, C.black);
    for (let y = 1.0; y < 6.5; y += 1.0) f.fill(0, y, -0.1, U1, y + 0.125, 0, C.chrome);
    const dU = 7; f.clear(dU - 1.0, 0.5, 0, dU + 1.0, 3.25, 0.5); f.fill(dU - 1.25, 0.5, 0, dU - 1.0, 3.5, 0.5, C.chrome); f.fill(dU + 1.0, 0.5, 0, dU + 1.25, 3.5, 0.5, C.chrome);
    for (const u of [2.5, 12, 16.5]) { f.each(u - 1, 1.25, 0, u + 1, 3.25, 0.5, (uu, y) => (Math.hypot(uu + 0.125 - u, y + 0.125 - 2.25) < 0.95 ? (Math.hypot(uu + 0.125 - u, y + 0.125 - 2.25) < 0.7 ? C.win[3] : C.chrome) : null)); }
    f.fill(dU - 2.5, 3.5, -3.0, dU + 2.5, 3.75, 0, C.navy); f.fill(dU - 2.5, 3.75, -3.0, dU + 2.5, 4.0, -2.75, C.flickBlue);
    for (const uu of [dU - 2.25, dU + 2.0]) f.fill(uu, 0.25, -2.75, uu + 0.25, 3.5, -2.5, C.chrome);
    TS.windows(f, 0.5, U1 - 0.5, 7.5, H - 1.25, C.chrome, 6601, 3.5, 2.0, 2.5);
    TS.roof(f, 0, U1, D, H, 6602, { wall, trim: C.chrome });
    // heron in blue neon (built as a model: legs, body, long neck, beak) + BLUE HERON lettering
    const heron = TS.geo('heron', () => {
      const m = M(28, 44, 2), b = C.neonBlue, w = C.neonWhite;
      m.line(10, 0, 0, 11, 14, 0, b); m.line(14, 0, 0, 13, 14, 0, b);                // legs
      for (let a = 0; a < 40; a++) { const t = a / 40 * Math.PI * 2; m.set(Math.round(12 + Math.cos(t) * 7), Math.round(19 + Math.sin(t) * 4), 0, b); }   // body
      m.line(18, 21, 0, 21, 30, 0, b); m.line(21, 30, 0, 19, 36, 0, b); m.line(19, 36, 0, 21, 40, 0, b);   // neck
      m.set(22, 40, 0, w); m.line(22, 39, 0, 27, 38, 0, C.neonYellow);                 // eye + beak
      m.line(5, 19, 0, 0, 16, 0, b);                                                   // tail
      for (let x = 7; x < 16; x += 2) m.line(x, 18, 1, x + 2, 21, 1, b);               // wing feathers
      return m;
    }, 1 / 8, [0.5, 0, 0]);
    f.fill(12.5, 6.5, -0.25, 21.5, 13.25, 0, C.navyD);
    f.place(heron, 17, 7.0, -0.25, 0, -1);
    f.place(TS.signFlick('BLUE HERON', C.neonBlue, 5, C.flickBlue, 1 / 10), 6.5, 4.6, -0.1, 0, -1);
    f.place(TS.sign('JAZZ NIGHTLY', C.neonPink, null, 1 / 16), dU, 3.1, -3.05, 0, -1);
    f.light(12, 6, -2, 0x4aa0ff, 2.0, 16, 'sign');
    // the rooftop heron: a 10 m blue-neon bird on a steel frame facing the harbour, wings flapping in two neon frames
    { const wA = AF.col(0x2a3a52, { emit: 0x5ab0ff, emitK: 3.0, mode: 'always', jitter: 0, edge: 0 }), wB = AF.col(0x2a3a53, { emit: 0x5ab0fe, emitK: 3.0, mode: 'always', jitter: 0, edge: 0 });
      TS.wings = [wA, wB].map((i) => ({ i, base: [AF.PAL.emit[i * 4], AF.PAL.emit[i * 4 + 1], AF.PAL.emit[i * 4 + 2]] }));
      const big = TS.geo('heron-roof', () => {
        const m = M(34, 44, 2), b = C.neonBlue, w = C.neonWhite, y4 = 4;
        m.line(13, 0 + y4, 0, 14, 14 + y4, 0, b); m.line(17, 0 + y4, 0, 16, 14 + y4, 0, b); m.line(14, y4, 0, 11, y4, 0, b); m.line(17, y4, 0, 20, y4, 0, b);
        for (let a = 0; a < 60; a++) { const t = a / 60 * Math.PI * 2; m.set(Math.round(15 + Math.cos(t) * 7), Math.round(18 + y4 + Math.sin(t) * 4), 0, b); }
        m.line(21, 21 + y4, 0, 24, 28 + y4, 0, b); m.line(24, 28 + y4, 0, 22, 33 + y4, 0, b); m.line(22, 33 + y4, 0, 24, 36 + y4, 0, b);
        for (let a = 0; a < 16; a++) { const t = a / 16 * Math.PI * 2; m.set(Math.round(25 + Math.cos(t) * 1.6), Math.round(37 + y4 + Math.sin(t) * 1.6), 0, b); }
        m.set(25, 37 + y4, 0, w); m.line(27, 37 + y4, 0, 33, 36 + y4, 0, C.neonYellow); m.line(8, 18 + y4, 0, 3, 15 + y4, 0, b); m.line(8, 17 + y4, 0, 4, 13 + y4, 0, b);
        // wings up (frame A) and down (frame B)
        m.line(12, 21 + y4, 1, 5, 34 + y4, 1, wA); m.line(5, 34 + y4, 1, 12, 30 + y4, 1, wA); m.line(12, 30 + y4, 1, 18, 21 + y4, 1, wA); m.line(8, 29 + y4, 1, 11, 25 + y4, 1, wA);
        m.line(12, 17 + y4, 1, 4, 6 + y4, 1, wB); m.line(4, 6 + y4, 1, 12, 9 + y4, 1, wB); m.line(12, 9 + y4, 1, 18, 17 + y4, 1, wB); m.line(8, 9 + y4, 1, 11, 13 + y4, 1, wB);
        for (let x = 1; x < 33; x += 4) m.box(x, 0, 1, x + 1, 3, 2, C.iron); m.box(0, 3, 1, 34, 4, 2, C.iron);
        return m;
      }, 1 / 4, [0.5, 0, 0.5]);
      f.place(big, 11, H + 0.75, 5, -1, 0); f.fill(10.5, H, 4.5, 11.5, H + 0.75, 5.5, C.iron);
      AF.addLight({ x: f.w(11, 5)[0], y: H + 4, z: f.w(11, 5)[1], color: 0x4aa0ff, intensity: 1.2, range: 16, kind: 'sign' });
    }
    // Harbour Blvd side (u = 0 face → south): windows + a neon JAZZ blade + fire escape
    const sh = TS.frame(-10 - D, 147, 'S');   // u' = x - (-36), v' = 147 - z
    TS.windows(sh, 0.5, D - 0.5, 7.5, H - 1.25, C.chrome, 6603, 3.5, 2.0, 2.5);
    sh.fill(0, 0.25, 0, D, 1.0, 0.25, C.black);
    sh.place(TS.fireEscape(2), 8, 6.75, 0, 0, -1);
    sh.place(TS.blade('JAZZ', C.flickPink, C.navyD, 'jazz'), 22, 4.0, -0.2, -1, 0);
    // interior: stage (back wall), bar (left wall), 12 tables with red lamps, dance floor centre
    f.fill(3, 0.5, 21, 19, 1.25, D - 0.75, C.woodD); f.fill(3, 1.0, 21, 19, 1.25, 21.25, C.gold);
    f.each(3, 1.25, D - 1.0, 19, SH, D - 0.75, (u, y) => (Math.floor(u * 4) % 3 === 0 ? C.navy : C.curtain));
    f.each(3, 5.0, 21, 19, 5.25, D - 1, (u) => (Math.floor(u * 2) % 2 ? C.lampR : C.lamp));
    const band = [[5, 23.5], [8, 24], [11, 24.2], [14, 24], [17, 23.5]];
    const bandProps = TS.geo('drums', () => { const m = M(10, 8, 10); m.sphere(5, 3, 5, 3.5, C.white, (x, y) => (y < 5 ? (y === 4 ? C.red : C.white) : 0)); m.box(8, 0, 1, 9, 8, 2, C.chrome); m.box(7, 7, 0, 10, 8, 3, C.gold); return m; }, 1 / 8, [0.5, 0, 0.5]);
    f.place(bandProps, 11, 1.25, 25.0, 0, -1, true);
    f.place(TS.geo('grand', () => { const m = M(12, 8, 16); m.box(0, 0, 0, 1, 5, 1, C.black); m.box(11, 0, 0, 12, 5, 1, C.black); m.box(0, 4, 0, 12, 7, 12, C.black); m.box(3, 4, 12, 12, 7, 16, C.black); for (let x = 0; x < 12; x++) m.set(x, 6, 0, x % 2 ? C.white : C.black); m.line(0, 7, 12, 10, 11, 4, C.black); return m; }, 1 / 8, [0.5, 0, 0.5]), 4.8, 1.25, 23.2, 1, 0, true);
    TS.band = band.map(([u, v], i) => { const p = f.w(u, v - 0.6); f.fill(u - 0.1, 1.25, v - 1.45, u + 0.1, 2.25, v - 1.3, C.chrome); return { x: p[0], y: 1.25, z: p[1], yaw: f.yaw(0, -1), role: ['trumpet', 'sax', 'drums', 'bass', 'singer'][i] }; });
    // bar along the u = U1 side, bottles on a back bar with a mirror
    f.fill(U1 - 3.5, 0.5, 3, U1 - 2.75, 1.5, 17, C.woodD); f.fill(U1 - 3.75, 1.5, 3, U1 - 2.75, 1.75, 17, C.bronze);
    f.fill(U1 - 1.0, 0.5, 3, U1 - 0.75, 1.25, 17, C.woodD); f.fill(U1 - 0.85, 2.0, 3.5, U1 - 0.75, 3.75, 16.5, C.chrome);
    for (let v = 4; v < 16; v += 3) f.place(TS.goods('bottles', v), U1 - 0.75, 1.25, v + 1.5, -1, 0);
    for (let v = 4; v < 17; v += 1.25) { f.place(TS.props.stool(), U1 - 4.2, 0.5, v, 1, 0); const p = f.w(U1 - 4.2, v); AF.addSpot({ building: 'blue-heron', x: p[0], y: 1.25, z: p[1], yaw: f.yaw(1, 0), kind: 'sit' }); }
    { const p = f.w(U1 - 1.8, 10); AF.addSpot({ building: 'blue-heron', x: p[0], y: 0.5, z: p[1], yaw: f.yaw(-1, 0), kind: 'work' }); }
    let tables = 0;
    for (const [u, v] of [[2.5, 4], [6, 4], [9.5, 4], [13, 4], [2.5, 8], [13, 8], [2.5, 12], [2.5, 16], [4.5, 19], [16.5, 19], [9.5, 8], [6, 8]]) {
      f.place(TS.props.table(C.white), u, 0.5, v, 0, -1, true); f.place(TS.props.tlamp(C.lampR), u, 1.25, v, 0, -1); tables++;
      for (const [a, b] of [[-0.8, 0], [0.8, 0]]) { f.place(TS.props.chair(C.red), u + a, 0.5, v + b, -Math.sign(a), 0); const p = f.w(u + a, v + b); AF.addSpot({ building: 'blue-heron', x: p[0], y: 1.0, z: p[1], yaw: f.yaw(-Math.sign(a), 0), kind: 'sit' }); }
    }
    for (let i = 0; i < 4; i++) f.light(4 + i * 5, 4, 10, 0xff5a4a, 0.9, 9);
    f.light(11, 4.5, 23, 0x6aa0ff, 1.4, 10);
    for (let i = 0; i < 4; i++) f.place(TS.props.picture(i + 30), 0.75, 3.2, 5 + i * 4, 1, 0);
    AF.addBuilding({ id: 'blue-heron', name: 'The Blue Heron', kind: 'club', box: f.box(0, 0.25, 0, U1, H + 1, D), doors: [{ x: f.w(dU, -1.5)[0], y: 0.25, z: f.w(dU, -1.5)[1], yaw: f.yaw(0, 1) }], floors: [0.5], interior: true, owner: 'theatre-shops' });
    TS.heron = { tables };
    { const p = f.w(11, 19.5); AF.addInteract({ x: p[0], y: 1.5, z: p[1], r: 2.5, label: 'Request a song', act: () => AF.emit('toast', 'The bandleader grins: "Harbour Lights Blues, coming up — for the lady in blue."') }); }
    // ---- hat shop + florist
    TS.shop(f, { id: 'hatshop', name: 'Delphine Hats', blade: { text: 'HATS', fg: C.neonPink }, u0: 22, w: 8, d: 16, h: 15, wall: C.brickS, trim: C.cream, sign: { text: 'DELPHINE HATS', fg: C.flickPink, bg: C.black }, awning: [C.teal, C.cream], goods: 'hats', goods2: 'hats', floor: 'wood', paper: C.paper[2],
      display: (a, b) => { const hat = TS.geo('hatstand', () => { const m = M(4, 10, 4); m.box(1, 0, 1, 3, 1, 3, C.brass); m.box(1.5 | 0, 1, 1, 2, 7, 2, C.brass); m.box(0, 7, 0, 4, 8, 4, C.bright[1]); m.box(1, 8, 1, 3, 10, 3, C.bright[1]); m.set(3, 8, 1, C.red); return m; }, 1 / 8, [0.5, 0, 0.5]); for (let u = a + 0.4; u < b - 0.2; u += 0.7) f.place(hat, u, 1.0, 0.9, 0, -1); } });
    TS.shop(f, { id: 'florist', name: 'Wren & Rose Florist', blade: { text: 'ROSES', fg: C.neonGreen, light: 0x80ff90 }, u0: 30, w: 8, d: 16, h: 13, wall: C.brickY, trim: C.white, sign: { text: 'WREN & ROSE', fg: C.jade, bg: C.cream }, awning: [C.jade, C.white], goods: 'mixed', floor: 'tile', counter: 'R', paper: C.paper[1],
      display: (a, b) => { for (let u = a + 0.3; u < b - 0.2; u += 0.6) f.place(TS.flowerPot(Math.floor(u * 5)), u, 1.0, 0.9, 0, -1); },
      fit: (x) => { for (let i = 0; i < 6; i++) { f.place(TS.flowerPot(i + 40), 31 + i * 1.1, 0.25, -0.6, 0, -1); f.place(TS.flowerPot(i + 50), 31.5 + i * 1.1, 0.25, -1.3, 0, -1); } for (let v = 3; v < 14; v += 1.2) f.place(TS.flowerPot(v * 3 | 0), 30.9, 0.5, v, 1, 0); } });
    // ---- THE RIALTO (Harbour Blvd, u' 10..34 on the south frame: x -62..-38)
    const fr = TS.frame(-72, 147, 'S');   // u = x + 72, v = 147 - z
    TS.fillRow(fr, 0, 10, 18, 5504, 12, 16);
    const R0 = 10, R1 = 34, RD = 22, RH = 16;
    fr.fill(R0, 0.25, 0, R1, RH, RD, C.terra);
    fr.clear(R0 + 0.5, 0.5, 0.5, R1 - 0.5, 5.5, 10);
    fr.each(R0 + 0.5, 0.25, 0, R1 - 0.5, 0.5, 10, (u, y, v) => (((Math.floor(u * 2) + Math.floor(v * 2)) & 1) ? C.carpetG : C.carpet));
    fr.fill(R0, 0.25, 0, R1, 1.0, 0.5, C.granite);
    fr.clear(R0 + 6, 0.5, 0, R1 - 6, 3.5, 0.5);
    fr.fill(R0 + 6, 3.5, 0, R1 - 6, 4.0, 0.5, C.prism);
    fr.place(TS.props.pendant(), (R0 + R1) / 2, 5.5, 5, 0, -1);
    fr.fill(R0 + 1, 0.5, 8, R0 + 7, 1.25, 8.75, C.redD); fr.fill(R0 + 1, 1.25, 8, R0 + 7, 1.5, 8.75, C.gold);
    for (let i = 0; i < 5; i++) fr.place(TS.props.poster(i + 11), R0 + 1.5 + i * 1.5, 2.2, 9.75, 0, -1);
    fr.fill(R0 + 0.5, 0.5, 9.75, R1 - 0.5, 5.5, 10, C.redD);
    // the Rialto's newsreel auditorium behind the lobby (v 10..21.5)
    fr.clear(R0 + 0.5, 0.5, 10, R1 - 0.5, 8.5, RD - 0.5); fr.clear(20.5, 0.5, 9.75, 23.5, 3.25, 10);
    fr.each(R0 + 0.5, 0.25, 10, R1 - 0.5, 0.5, RD - 0.5, (u, y, v) => ((Math.floor(u * 2) + Math.floor(v * 2)) % 5 === 0 ? C.carpetG : C.carpet));
    fr.each(R0 + 0.5, 8.25, 10, R1 - 0.5, 8.5, RD - 0.5, (u, y, v) => (TS.hash(u * 4 + 7, v * 4, 5) < 0.04 ? (TS.hash(u * 4, v * 4, 11) < 0.5 ? C.starA : C.starB) : (TS.hash(Math.floor(u / 3), Math.floor(v / 2), 2) < 0.2 ? AF.col(0x3a4a78) : C.navyD)));
    for (const u of [R0 + 0.5, R1 - 0.75]) { fr.fill(u, 0.5, 10, u + 0.25, 8.25, RD - 0.5, C.redD); for (let v = 11.5; v < RD - 2; v += 3) fr.fill(u + (u < R0 + 1 ? 0.25 : -0.25), 4.0, v, u + (u < R0 + 1 ? 0.5 : 0), 4.5, v + 0.5, C.lamp); }
    fr.each(R0 + 3, 1.5, RD - 0.75, R1 - 3, 7.0, RD - 0.5, (u, y) => TS.filmPix((u - R0 - 3) / (R1 - R0 - 6), (y - 1.5) / 5.5)); fr.fill(R0 + 2.5, 1.25, RD - 0.5, R1 - 2.5, 7.25, RD - 0.25, C.black);
    fr.fill(R0 + 1, 0.5, RD - 2.5, R1 - 1, 1.0, RD - 0.5, C.woodD); fr.fill(R0 + 1, 7.0, RD - 1.0, R1 - 1, 8.0, RD - 0.5, C.curtain);
    let rs = 0; const rialtoRow = TS.geo('rialtorow', () => { const m = M(14 * 5, 8, 6); for (let i = 0; i < 14; i++) { const x = i * 5; m.box(x, 0, 1, x + 1, 4, 6, C.iron); m.box(x + 1, 2, 2, x + 5, 3, 6, C.seat); m.box(x + 1, 3, 0, x + 5, 8, 2, C.velvet); m.box(x + 1, 3, 2, x + 5, 3, 5, C.seat); } return m; }, 1 / 8, [0.5, 0, 0.5]);
    for (let k = 0; k < 7; k++) { const v = 11.5 + k * 1.1, y = 0.5 + 0.25 * Math.floor((6 - k) / 2); if (y > 0.5) fr.fill(R0 + 0.75, 0.5, v - 0.45, R1 - 0.75, y, v + 0.65, C.carpet); fr.place(rialtoRow, 16.4, y, v, 0, 1); fr.place(rialtoRow, 27.6, y, v, 0, 1); rs += 28;
      if (k % 2 === 0) for (const u of [14, 18, 26, 30]) { const p = fr.w(u, v - 0.05); AF.addSpot({ building: 'rialto', x: p[0], y: y + 0.4, z: p[1], yaw: fr.yaw(0, 1), kind: 'sit' }); } }
    TS.rialtoSeats = rs;
    fr.place(TS.sign('NEWSREEL', C.flickGreen, C.black, 1 / 16), 22, 3.8, 9.75, 0, 1);
    fr.light(22, 4, RD - 3, 0xdfe8ff, 1.0, 12);
    fr.light((R0 + R1) / 2, 4, 5, 0xffd890, 1.2, 12);
    { const p = fr.w(R0 + 4, 9.3); AF.addSpot({ building: 'rialto', x: p[0], y: 0.5, z: p[1], yaw: fr.yaw(0, -1), kind: 'work' }); const q = fr.w(R0 + 4, 6.5); AF.addSpot({ building: 'rialto', x: q[0], y: 0.5, z: q[1], yaw: fr.yaw(0, 1), kind: 'counter', path: [fr.w(22, -1.5), fr.w(22, 3), q] }); }
    // rialto facade: stepped terracotta, jade chevrons, a small marquee, vertical RIALTO sign
    fr.each(R0, 6.0, -0.25, R1, RH - 1, 0, (u, y) => { const k = Math.floor(u * 2) + Math.floor(y * 2); return (Math.floor(u) % 4 === 0) ? C.jade : ((k % 6 === 0 && y > 12) ? C.gold : null); });
    TS.windows(fr, R0 + 1, R1 - 1, 9.0, RH - 1.5, C.cream, 7701, 3.5, 2.0, 2.5);
    fr.fill(R0 + 6, RH, 0, R1 - 6, RH + 2, 1, C.terra); fr.fill(R0 + 9, RH + 2, 0, R1 - 9, RH + 3.5, 1, C.jade);
    TS.roof(fr, R0, R1, RD, RH, 7702, { wall: C.terra, trim: C.jade, tank: true });
    // small marquee (flat, with bulbs)
    fr.each(R0 + 4, 4.5, -3.0, R1 - 4, 6.25, 0, (u, y, v) => { const edge = v < -2.75 || y >= 6.0 || y < 4.75; if (!edge) return C.cream; return (y < 4.75) ? ((Math.floor(u * 4) % 3 === 1 && Math.floor(v * 4) % 3 === 1) ? TS.b3(Math.floor(u * 4)) : C.jade) : TS.b3(Math.floor(u * 4) + Math.floor(y * 4)); });
    fr.place(TS.sign('NEWS * CARTOONS * SHORTS', C.black, null, 1 / 15), 22, 5.62, -3.1, 0, -1); fr.place(TS.sign('CONTINUOUS 10¢', C.red, null, 1 / 15), 22, 5.0, -3.1, 0, -1);
    fr.place(TS.sign('RIALTO', C.flickGreen, null, 1 / 7), 22, 6.8, -2.2, 0, -1);
    TS.rialtoFront = { fr, R0, R1 };
    fr.fill(R1 - 3.75, 7.0, -3.0, R1 - 3.0, 7.25, 0, C.iron);
    fr.place(TS.blade('RIALTO', C.neonGreen, C.navyD, 'rialto'), R1 - 3.375, 7.25, -0.25, -1, 0);
    AF.addBuilding({ id: 'rialto', name: 'The Rialto', kind: 'theatre', box: fr.box(R0, 0.25, 0, R1, RH + 1, RD), doors: [{ x: fr.w(22, -1.5)[0], y: 0.25, z: fr.w(22, -1.5)[1], yaw: fr.yaw(0, 1) }], floors: [0.5], interior: true, owner: 'theatre-shops' });
    fr.light(22, 4.0, -2.0, 0x9affb0, 1.2, 12, 'sign');
  };
  // original one-sheets (16 x 24 px) in bulb-bordered cases: gorilla on a tower, a dancing couple, a tramp with a cane,
  // a sailor and his girl, a ship in a storm, a crooner under the moon
  TS.oneSheet = (i) => TS.geo('onesheet' + (i % 6), () => {
    const C = TS.C, m = M(20, 30, 2), k = i % 6, cc = (h) => AF.col(h, { jitter: 0.05 });
    const sky = [cc(0x1c2a5a), cc(0xe07aa0), cc(0xf0e2c0), cc(0xf09a4a), cc(0x2a4a6a), cc(0x1a1a3a)][k], sky2 = [cc(0x3a4a8a), cc(0xf6b0c8), cc(0xd8c8a0), cc(0xf8c870), cc(0x4a6a8a), cc(0x2a2a5a)][k];
    const band = [C.red, C.navy, C.redD, C.jade, C.gold, C.redD][k];
    for (let x = 0; x < 20; x++) for (let y = 0; y < 30; y++) { const edge = x === 0 || x === 19 || y === 0 || y === 29; m.set(x, y, 0, edge ? ((x + y) % 2 ? C.gold : TS.b3(x + y)) : C.black); }
    const P = (x, y, c) => { if (x >= 0 && x < 16 && y >= 0 && y < 24) m.set(x + 2, y + 3, 1, c); };
    for (let x = 0; x < 16; x++) for (let y = 0; y < 24; y++) P(x, y, y < 5 ? band : y > 20 ? C.gold : (y > 12 ? sky2 : sky));
    for (let x = 1; x < 15; x += 2) P(x, 2, C.cream); for (let x = 2; x < 14; x += 3) P(x, 22, C.redD);
    const blk = C.black, wht = C.white, skin = cc(0xe8c0a0);
    if (k === 0) { for (let y = 5; y < 17; y++) for (let x = 7 - (y > 12 ? 0 : 1); x < 9 + (y > 12 ? 0 : 1); x++) P(x, y, cc(0x9a9aa0)); P(8, 18, cc(0x9a9aa0)); for (let y = 17; y < 21; y++) for (let x = 6; x < 10; x++) P(x, y, blk); P(5, 19, blk); P(10, 20, blk); P(11, 21, blk); P(7, 20, cc(0xffe0a0)); P(2, 17, wht); P(13, 15, wht); P(12, 15, wht); P(3, 16, wht); }
    else if (k === 1) { for (let x = 3; x < 13; x++) for (let y = 5; y < 20; y++) if (Math.hypot(x - 7.5, y - 12) < 6) P(x, y, cc(0xfff0d0)); for (let y = 6; y < 17; y++) { P(6, y, blk); P(9, y, wht); } P(6, 17, skin); P(9, 17, skin); P(6, 18, blk); P(7, 14, blk); P(8, 14, wht); for (let x = 8; x < 12; x++) P(x, 6 + (x - 8), wht); P(5, 18, blk); P(7, 18, blk); }
    else if (k === 2) { for (let y = 7; y < 15; y++) { P(7, y, blk); P(8, y, blk); } P(6, 6, blk); P(9, 6, blk); P(7, 15, skin); P(8, 15, skin); P(7, 16, skin); P(8, 16, blk); for (let x = 6; x < 10; x++) P(x, 17, blk); P(7, 18, blk); P(8, 18, blk); P(7, 15, blk); for (let y = 5; y < 11; y++) P(11, y, cc(0x6a4a2a)); P(10, 11, cc(0x6a4a2a)); P(4, 5, blk); P(3, 5, blk); P(10, 5, blk); P(11, 5, blk); }
    else if (k === 3) { for (let x = 0; x < 16; x++) for (let y = 5; y < 9; y++) P(x, y, cc(0x2a5a8a)); for (let y = 8; y < 17; y++) P(5, y, wht); P(4, 12, wht); P(6, 12, wht); P(5, 17, skin); P(5, 18, wht); for (let y = 8; y < 16; y++) { P(10, y, C.red); P(11, y, y < 12 ? C.red : 0 || C.red); } P(10, 16, skin); P(10, 17, cc(0x8a3a1a)); P(7, 14, C.red); P(8, 14, C.red); for (let y = 9; y < 14; y++) P(13, y, C.gold); P(12, 9, C.gold); P(14, 9, C.gold); }
    else if (k === 4) { for (let x = 0; x < 16; x++) { const w = 7 + Math.round(Math.sin(x * 0.9) * 1.5); for (let y = 5; y < w; y++) P(x, y, cc(0x1e3a5a)); P(x, w, wht); } for (let x = 4; x < 12; x++) P(x, 9, cc(0x3a2a1a)); for (let x = 5; x < 11; x++) P(x, 10, cc(0x3a2a1a)); for (let y = 10; y < 18; y++) P(8, y, cc(0x3a2a1a)); for (let x = 5; x < 12; x++) for (let y = 12; y < 17; y++) if (x - 5 < (y - 11) * 1.3) P(x, y, wht); P(3, 19, cc(0xfff0a0)); P(12, 18, cc(0xfff0a0)); }
    else { for (let x = 9; x < 14; x++) for (let y = 15; y < 20; y++) if (Math.hypot(x - 11.5, y - 17.5) < 2.5) P(x, y, cc(0xfff4c0)); for (let y = 5; y < 14; y++) { P(5, y, blk); P(6, y, blk); } P(5, 14, skin); P(6, 14, skin); P(5, 15, blk); P(6, 15, blk); P(7, 12, blk); P(8, 13, C.chrome); P(8, 5, C.chrome); for (let y = 5; y < 13; y++) P(8, y, C.chrome); for (const [a, b] of [[2, 18], [4, 20], [13, 12], [1, 14]]) P(a, b, wht); }
    return m;
  }, 1 / 16, [0.5, 0, 0]);
  TS.flowerPot = (i) => TS.geo('fpot' + (i % 6), () => { const C = TS.C, m = M(4, 6, 4); m.box(0, 0, 0, 4, 2, 4, i % 2 ? C.terra : C.steel); m.box(1, 2, 1, 3, 3, 3, C.leaf); for (let k = 0; k < 6; k++) m.set(k % 4, 3 + (k % 3), (k * 3) % 4, C.flowers[(i + k) % 6]); return m; }, 1 / 8, [0.5, 0, 0.5]);

  // ================================================================= the Blue Heron — round 2: dancing couples, a spotlight on the singer,
  // a photographer whose flash pops every few seconds, a cigarette girl, drinkers along the bar
  const heronPlus = () => {
    const C = TS.C, f = TS.frame(-10, 147, 'E'), U1 = 22;
    TS.dancers = [];
    for (const [u, v, k1, k2, ph] of [[8.5, 14.0, 1, 2, 0], [12.8, 13.6, 3, 4, 1.7], [10.4, 17.4, 5, 0, 3.1], [14.0, 17.0, 7, 8, 4.4]]) { const p = f.w(u, v); TS.dancers.push({ x: p[0], z: p[1], k1, k2, ph }); }
    C.flash = AF.col(0xfffef0, { emit: 0xfffef8, emitK: 4.0, mode: 'always', jitter: 0, edge: 0, pat: 'none' });
    TS.flashI = { i: C.flash, base: [AF.PAL.emit[C.flash * 4], AF.PAL.emit[C.flash * 4 + 1], AF.PAL.emit[C.flash * 4 + 2]] };
    const cam = TS.geo('press-camera', () => { const m = M(4, 5, 6); m.box(0, 0, 0, 4, 3, 3, C.black); m.box(1, 1, 3, 3, 2, 5, C.chrome); m.box(0, 3, 0, 4, 5, 1, C.chrome); m.box(1, 3, 1, 3, 5, 2, C.flash); return m; }, 1 / 16, [0.5, 0, 0.5]);
    f.place(TS.figure(2), 7.6, 0.5, 20.0, 0, 1); f.place(cam, 7.6, 1.55, 20.25, 0, 1);
    const tray = TS.geo('cig-tray', () => { const m = M(8, 3, 5); m.box(0, 0, 0, 8, 1, 5, C.red); m.box(0, 1, 0, 8, 3, 1, C.gold); for (let x = 1; x < 7; x += 2) m.box(x, 1, 2, x + 1, 2, 4, C.bright[x % 12]); return m; }, 1 / 16, [0.5, 0, 0.5]);
    f.place(TS.figure(5), 4.3, 0.5, 10.2, 1, 0); f.place(tray, 4.55, 1.3, 10.2, 1, 0);
    for (const [v, k] of [[5.4, 0], [9.2, 4], [13.6, 8]]) f.place(TS.figure(k), U1 - 5.0, 0.5, v, 1, 0);
    { const p = f.w(17, 22.9); TS.spotAt = [p[0], 1.25, p[1]]; }
    f.light(17, 3.5, 22.4, 0xfff0d0, 1.2, 6);
  };
  AF.onBuild('theatre-dancers', 601, () => {
    if (!AF.scene || typeof AF.modelMesh !== 'function' || typeof THREE === 'undefined') return;
    TS.danceMeshes = [];
    for (const d of TS.dancers || []) {
      const g = new THREE.Group(); g.position.set(d.x, 0.5, d.z); g.name = 'heron-dancers';
      const a = AF.modelMesh(TS.figure(d.k1)); a.position.set(-0.2, 0, 0); a.rotation.y = Math.PI / 2; g.add(a);
      const b = AF.modelMesh(TS.figure(d.k2)); b.position.set(0.2, 0, 0); b.rotation.y = -Math.PI / 2; g.add(b);
      AF.scene.add(g); TS.danceMeshes.push({ g, d });
    }
    if (TS.spotAt) {
      const [x, y, z] = TS.spotAt, L = 4.6, geo = new THREE.CylinderGeometry(0.12, 0.85, L, 12, 1, true);
      const mat = new THREE.MeshBasicMaterial({ color: 0xfff0c8, transparent: true, opacity: 0.07, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
      const cone = new THREE.Mesh(geo, mat); cone.position.set(x, y + L / 2, z); cone.renderOrder = 7; cone.castShadow = false; cone.name = 'heron-spot'; AF.scene.add(cone); TS.spotCone = cone;
    }
  });
  AF.onTick('theatre-dancers', 706, (dt, t) => {
    if (!TS.danceMeshes || !TS.danceMeshes.length || !AF.camera) return;
    const d0 = TS.danceMeshes[0].d; if (Math.hypot(AF.camera.position.x - d0.x, AF.camera.position.z - d0.z) > 70) return;
    for (const { g, d } of TS.danceMeshes) { const T = t + d.ph; g.rotation.y = T * 0.9; g.position.x = d.x + Math.cos(T * 0.45) * 0.35; g.position.z = d.z + Math.sin(T * 0.45) * 0.35; g.position.y = 0.5 + Math.abs(Math.sin(T * 3.4)) * 0.04; g.rotation.z = Math.sin(T * 1.7) * 0.05; }
    if (TS.flashI) { const E = AF.PAL.emit, c = t % 9.5, k = c < 0.12 ? 1 : 0.02, b = TS.flashI.base, i = TS.flashI.i; E[i * 4] = b[0] * k; E[i * 4 + 1] = b[1] * k; E[i * 4 + 2] = b[2] * k; AF.PAL.dirty = true; }
    if (TS.spotCone) TS.spotCone.material.opacity = 0.06 + 0.01 * Math.sin(t * 1.3);
  });


  // ================================================================= Rialto + Blue Heron fronts — round 2: poster cases, a script neon
  const frontsPlus = () => {
    const C = TS.C, R = TS.rialtoFront;
    if (R) { const { fr, R0, R1 } = R;
      [R0 + 1.6, R0 + 4.0, R1 - 4.0, R1 - 1.6].forEach((u, i) => { fr.fill(u - 0.85, 1.0, -0.25, u + 0.85, 3.6, 0, C.jade); fr.place(TS.oneSheet(i + 2), u, 1.3, -0.25, 0, -1);
        fr.each(u - 1.1, 0.75, -0.5, u + 1.1, 3.85, -0.25, (uu, y) => ((uu < u - 0.85 || uu >= u + 0.85 || y < 1.0 || y >= 3.6) && (Math.floor(uu * 4) + Math.floor(y * 4)) % 2 === 0 ? TS.b3(Math.floor(uu * 4) + Math.floor(y * 4)) : null)); });
      fr.each(R0 + 6, 3.5, -0.5, R1 - 6, 3.75, 0, (u) => (Math.floor(u * 4) % 2 ? TS.b3(Math.floor(u * 4)) : C.gold));
      fr.light(R0 + 3, 2.5, -1.5, 0xffd890, 0.5, 7, 'shop'); fr.light(R1 - 3, 2.5, -1.5, 0xffd890, 0.5, 7, 'shop'); }
    // "Blue Heron" in pink neon-tube script across the club front, on a thin iron mount in front of the first-floor windows
    const f = TS.frame(-10, 147, 'E');
    const pink = AF.col(0xff7ac8, { emit: 0xff4fb0, emitK: 3.2, mode: 'always', jitter: 0, edge: 0, pat: 'none' });
    const g = TS.geo('heron-script', () => AF.textModel('Blue Heron', pink, { font: 'script', pad: 0, depth: 1 }), 1 / 8, [0.5, 0, 0]);
    f.fill(2.5, 7.0, -0.5, 19.5, 7.125, -0.25, C.iron);
    f.place(g, 11, 7.1, -0.5, 0, -1);
    f.light(11, 8, -2, 0xff60c0, 0.8, 12, 'sign');
  };

  // ================================================================= queue figures (dynamic, shared geometries, shuffling)
  TS.figure = (k) => TS.geo('qfig' + (k % 10), () => {
    const C = TS.C, m = M(8, 29, 5), fem = k % 2 === 1, skin = [0xe8c0a0, 0xc89070, 0x8a5a3a, 0xf0d0b8].map((h) => AF.col(h, { jitter: 0.1 }))[k % 4];
    const coats = [C.navy, C.redD, AF.col(0x4a4a50), AF.col(0x3a5a3a), AF.col(0x6a4a8a), C.woodD, AF.col(0x8a7a60), AF.col(0xb8a07a), C.teal, AF.col(0x5a2a3a)];
    const coat = coats[(k * 3) % 10], hat = [C.black, AF.col(0x4a3a2a), C.navyD, C.redD, AF.col(0x7a6a50)][k % 5], sailor = k === 6;
    const hair = [C.black, AF.col(0x5a3a22), AF.col(0xc8a060), AF.col(0x8a3a1a)][(k >> 1) % 4];
    if (sailor) { m.box(2, 0, 1, 6, 1, 4, C.black); m.box(2, 1, 1, 6, 12, 4, C.white); m.box(1, 12, 1, 7, 21, 4, C.white); m.box(2, 19, 3, 6, 21, 4, C.navy); m.box(0, 12, 1, 1, 20, 4, C.white); m.box(7, 12, 1, 8, 20, 4, C.white); m.box(3, 21, 1, 5, 22, 4, skin); m.box(2, 22, 1, 6, 26, 4, skin); m.box(2, 25, 0, 6, 26, 1, hair); m.box(2, 26, 1, 6, 28, 4, C.white); m.box(1, 26, 1, 7, 27, 4, C.white); m.set(3, 24, 4, C.black); m.set(5, 24, 4, C.black); return m; }
    m.box(2, 0, 1, 4, 1, 4, C.black); m.box(4, 0, 1, 6, 1, 4, C.black);
    if (fem) { m.box(2, 1, 2, 3, 8, 3, skin); m.box(5, 1, 2, 6, 8, 3, skin); for (let y = 7; y < 21; y++) { const w = y < 14 ? 1 : 0; m.box(1 + w, y, 1, 7 - w, y + 1, 4, coat); } m.box(2, 19, 1, 6, 20, 4, C.gold); }
    else { m.box(2, 1, 1, 4, 11, 4, AF.col(0x3a3a40)); m.box(4, 1, 1, 6, 11, 4, AF.col(0x3a3a40)); m.box(1, 10, 1, 7, 21, 4, coat); m.box(3, 17, 4, 5, 21, 5, C.white); m.box(4, 17, 4, 5, 20, 5, C.redD); }
    m.box(0, 12, 1, 1, 20, 4, coat); m.box(7, 12, 1, 8, 20, 4, coat); m.box(0, 11, 2, 1, 12, 3, skin); m.box(7, 11, 2, 8, 12, 3, skin);
    if (k % 3 === 0) m.box(7, 8, 1, 8, 11, 3, AF.col(0x7a4a2a));   // a handbag / parcel
    m.box(3, 21, 1, 5, 22, 4, skin); m.box(2, 22, 1, 6, 26, 4, skin); m.box(2, 23, 0, 6, 27, 1, hair); m.set(3, 24, 4, C.black); m.set(5, 24, 4, C.black); m.set(4, 22, 4, AF.col(0xa05050));
    if (fem) { m.box(2, 25, 0, 6, 28, 4, hat); m.box(1, 25, 0, 7, 26, 5, hat); if (k % 4 === 1) m.set(6, 27, 2, C.bright[0]); }
    else if (k % 4 !== 2) { m.box(1, 26, 0, 7, 27, 5, hat); m.box(2, 27, 1, 6, 29, 4, hat); m.box(2, 27, 1, 6, 28, 4, C.black); }
    else m.box(2, 26, 1, 6, 27, 4, hair);
    return m;
  }, 1 / 16, [0.5, 0, 0.5]);
  TS.qMeshes = [];
  TS.musicianGeo = (role) => TS.geo('mus-' + role, () => {
    const C = TS.C, m = M(8, 29, 5), skin = AF.col([0x8a5a3a, 0xc89070, 0x6a4028, 0xe8c0a0, 0xf0d0b8][['trumpet', 'sax', 'drums', 'bass', 'singer'].indexOf(role)], { jitter: 0.1 }), tux = role === 'singer' ? AF.col(0xe6e0d0) : C.black;
    m.box(2, 0, 1, 6, 1, 4, C.black); m.box(2, 1, 1, 4, 11, 4, C.black); m.box(4, 1, 1, 6, 11, 4, C.black); m.box(1, 10, 1, 7, 21, 4, tux); m.box(3, 16, 4, 5, 21, 5, C.white); m.box(3, 20, 5, 5, 21, 5, C.black);
    if (role !== 'trumpet' && role !== 'sax') { m.box(0, 12, 1, 1, 20, 4, tux); m.box(7, 12, 1, 8, 20, 4, tux); m.box(0, 11, 2, 1, 12, 3, skin); m.box(7, 11, 2, 8, 12, 3, skin); }
    m.box(3, 21, 1, 5, 22, 4, skin); m.box(2, 22, 1, 6, 26, 4, skin); m.box(2, 25, 0, 6, 27, 4, C.black); m.set(3, 24, 4, C.black); m.set(5, 24, 4, C.black);
    if (role === 'singer') { m.box(1, 26, 0, 7, 27, 5, AF.col(0x3a3a40)); m.box(2, 27, 1, 6, 29, 4, AF.col(0x3a3a40)); }
    return m;
  }, 1 / 16, [0.5, 0, 0.5]);
  TS.instrGeo = (role) => TS.geo('ins-' + role, () => {
    const C = TS.C, skin = AF.col(0x9a6a4a, { jitter: 0.1 });
    if (role === 'trumpet' || role === 'sax') { const m = M(8, 6, 12); m.box(0, 2, 0, 1, 4, 5, C.black); m.box(7, 2, 0, 8, 4, 5, C.black); m.box(1, 2, 4, 3, 3, 6, skin); m.box(5, 2, 4, 7, 3, 6, skin); if (role === 'trumpet') { m.box(3, 2, 3, 5, 3, 10, C.gold); m.box(2, 1, 10, 6, 5, 12, C.gold); m.box(3, 3, 5, 5, 4, 7, C.gold); } else { m.box(3, 0, 2, 5, 5, 4, C.gold); m.box(3, 0, 4, 5, 1, 8, C.gold); m.box(2, 0, 7, 6, 3, 9, C.gold); m.box(3, 5, 2, 4, 6, 3, C.black); } return m; }
    if (role === 'drums') { const m = M(2, 2, 9); m.box(0, 0, 0, 2, 2, 3, skin); m.box(0, 0, 3, 1, 1, 9, C.woodL); return m; }
    if (role === 'bass') { const m = M(8, 30, 5); m.sphere(4, 7, 2, 3.6, C.wood, (x, y) => (y < 10 ? C.wood : 0)); m.box(1, 9, 1, 7, 15, 4, C.wood); m.box(2, 12, 1, 6, 15, 4, C.wood); m.box(3, 15, 2, 5, 28, 3, C.woodD); m.box(3, 28, 1, 5, 30, 3, C.woodD); m.box(3, 1, 0, 5, 26, 1, C.white); return m; }
    const m = M(3, 26, 3); m.box(1, 0, 1, 2, 24, 2, C.chrome); m.box(0, 22, 0, 3, 26, 3, C.chrome); m.box(0, 0, 0, 3, 1, 3, C.chrome); return m;   // the singer's mike
  }, 1 / 16, [0.5, 0, 0]);
  TS.bandMeshes = [];
  AF.onBuild('theatre-actors', 600, () => {
    if (TS.band && AF.scene && typeof AF.modelMesh === 'function') for (const b of TS.band) {
      const body = AF.modelMesh(TS.musicianGeo(b.role)); body.position.set(b.x, b.y, b.z); body.rotation.y = b.yaw; body.name = 'heron-band'; AF.scene.add(body);
      const parts = [];
      const add = (geo, x, y, z) => { const pv = new THREE.Group(); pv.position.set(x, y, z); const mm = AF.modelMesh(geo); pv.add(mm); body.add(pv); parts.push(pv); return pv; };
      if (b.role === 'trumpet' || b.role === 'sax') add(TS.instrGeo(b.role), 0, 1.2, 0.1);
      else if (b.role === 'drums') { add(TS.instrGeo('drums'), -0.3, 1.0, 0.15); add(TS.instrGeo('drums'), 0.3, 1.0, 0.15); const kit = AF.modelMesh(TS.geo('snare', () => { const C = TS.C, m = M(10, 12, 8); m.sphere(5, 9, 4, 3.4, C.white, (x, y) => (y >= 8 && y <= 10 ? (y === 10 ? C.cream : C.red) : 0)); m.box(4, 0, 3, 6, 8, 5, C.chrome); m.box(0, 11, 0, 4, 12, 3, C.gold); m.box(1, 0, 1, 2, 11, 2, C.chrome); return m; }, 1 / 16, [0.5, 0, 0])); kit.position.set(0, 0, 0.3); body.add(kit); }
      else if (b.role === 'bass') add(TS.instrGeo('bass'), 0.25, 0, 0.3);
      else { const mic = AF.modelMesh(TS.instrGeo('mic')); mic.position.set(0, 0, 0.45); body.add(mic); }
      TS.bandMeshes.push({ body, parts, b, ph: TS.bandMeshes.length * 1.3 });
    }
    if (TS.beamFrom && typeof THREE !== 'undefined' && AF.scene) {
      const a = new THREE.Vector3(TS.beamFrom[0], TS.beamFrom[2], TS.beamFrom[1]), b = new THREE.Vector3(TS.beamTo[0], TS.beamTo[2], TS.beamTo[1]), L = a.distanceTo(b);
      const g = new THREE.CylinderGeometry(0.12, 8.5, L, 4, 1, true); g.rotateY(Math.PI / 4); g.scale(1, 1, 0.55);
      const mat = new THREE.MeshBasicMaterial({ color: 0xc8d6ff, transparent: true, opacity: 0.05, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
      const beam = new THREE.Mesh(g, mat); beam.position.copy(a).add(b).multiplyScalar(0.5); beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), a.clone().sub(b).normalize());
      beam.renderOrder = 7; beam.castShadow = false; beam.name = 'paragon-projector-beam'; AF.scene.add(beam); TS.beam = beam;
    }
    if (!TS.queue || !AF.scene || typeof AF.modelMesh !== 'function') return;
    for (const q of TS.queue) { const mesh = AF.modelMesh(TS.figure(q.k)); mesh.position.set(q.x, 0.25, q.z); mesh.rotation.y = q.yaw; mesh.name = 'paragon-queue'; AF.scene.add(mesh); TS.qMeshes.push({ mesh, q }); }
  });

  // ================================================================= animation (palette tricks: cheap, no geometry churn)
  let bt = 0, phase = 0, ft = 0, st = 0;
  AF.onTick('theatre-anim', 705, (dt, t) => {
    if (!TS.C) return;
    const E = AF.PAL.emit; let dirty = false;
    bt += dt; if (bt >= 0.18) { bt = 0; phase = (phase + 1) % 3; TS.bulbs.forEach((i, idx) => { const k = idx === phase ? 0.35 : 3.0; E[i * 4] = 1.0 * k; E[i * 4 + 1] = 0.816 * k; E[i * 4 + 2] = 0.44 * k; }); dirty = true; }
    ft += dt; if (ft >= 0.07) {
      ft = 0;
      for (const fl of TS.flick) { if (fl.off > 0) fl.off--; else if (Math.random() < 0.012) fl.off = 1 + Math.floor(Math.random() * 4); const k = fl.off > 0 ? (fl.off % 2 ? 0.15 : 0.6) : 1; E[fl.i * 4] = fl.base[0] * k; E[fl.i * 4 + 1] = fl.base[1] * k; E[fl.i * 4 + 2] = fl.base[2] * k; }
      // the film: brightness flicker + a slow colour drift (scene changes)
      const sc = Math.floor(t / 4) % 5, tint = [[1, 1, 1], [0.8, 0.85, 1], [1, 0.9, 0.75], [0.6, 0.65, 0.8], [1, 1, 0.95]][sc], k = 0.8 + Math.random() * 0.25;
      for (const sE of TS.screens || []) { const i = sE.i, sb = sE.base; E[i * 4] = sb[0] * tint[0] * k; E[i * 4 + 1] = sb[1] * tint[1] * k; E[i * 4 + 2] = sb[2] * tint[2] * k; }
      if (TS.C.poseA) { const s2 = TS.screens[1].base, s3 = TS.screens[2].base, pa = Math.floor(t / 0.45) % 2 === 0; for (const [i, on] of [[TS.C.poseA, pa], [TS.C.poseB, !pa]]) { const b = on ? s3 : s2; E[i * 4] = b[0] * tint[0] * k; E[i * 4 + 1] = b[1] * tint[1] * k; E[i * 4 + 2] = b[2] * tint[2] * k; } }
      if (TS.beam) TS.beam.material.opacity = 0.05 * k * (0.5 + 0.5 * tint[1]);
      dirty = true;
    }
    // the blade spells P-A-R-A-G-O-N letter by letter, holds, blinks twice, holds (a 7 s cycle)
    if (TS.bladeL) { const c7 = t % 7, n = c7 < 2.1 ? Math.floor(c7 / 0.3) + 1 : 7, blink = c7 >= 4.2 && c7 < 5.4 && Math.floor((c7 - 4.2) / 0.3) % 2 === 0;
      TS.bladeL.forEach((L, j) => { const k = blink || j >= n ? 0.06 : 1; E[L.i * 4] = L.base[0] * k; E[L.i * 4 + 1] = L.base[1] * k; E[L.i * 4 + 2] = L.base[2] * k; }); dirty = true; }
    // pulsing star on the blade + flapping rooftop heron
    if (TS.starI) { const k = 0.55 + 0.45 * Math.abs(Math.sin(t * 2.2)); E[TS.starI * 4] = TS.starBase[0] * k; E[TS.starI * 4 + 1] = TS.starBase[1] * k; E[TS.starI * 4 + 2] = TS.starBase[2] * k; dirty = true; }
    if (TS.wings) { const up = Math.floor(t / 0.7) % 2 === 0; TS.wings.forEach((wg, j) => { const k = (j === 0) === up ? 1 : 0.04; E[wg.i * 4] = wg.base[0] * k; E[wg.i * 4 + 1] = wg.base[1] * k; E[wg.i * 4 + 2] = wg.base[2] * k; }); dirty = true; }
    if (dirty) AF.PAL.dirty = true;
    // the Blue Heron band plays: trumpet and sax lift, sticks strike, the bass sways, the singer leans into the mike
    if (TS.bandMeshes.length && AF.camera) {
      const b0 = TS.bandMeshes[0].b;
      if (Math.hypot(AF.camera.position.x - b0.x, AF.camera.position.z - b0.z) < 70) for (const bm of TS.bandMeshes) {
        const r = bm.b.role, T = t * 2.1 + bm.ph, P = bm.parts;
        bm.body.rotation.y = bm.b.yaw + Math.sin(T * 0.5) * 0.12;
        if (r === 'trumpet') P[0].rotation.x = -0.15 - 0.35 * Math.max(0, Math.sin(T * 0.45)) + 0.05 * Math.sin(T * 4);
        else if (r === 'sax') { P[0].rotation.x = 0.1 * Math.sin(T * 1.3); bm.body.rotation.z = 0.06 * Math.sin(T * 0.9); }
        else if (r === 'drums') { P[0].rotation.x = 0.5 * Math.sin(T * 5.2); P[1].rotation.x = 0.5 * Math.sin(T * 5.2 + Math.PI); }
        else if (r === 'bass') { P[0].rotation.z = 0.08 * Math.sin(T * 1.05); bm.body.rotation.z = 0.04 * Math.sin(T * 1.05); }
        else bm.body.rotation.x = 0.06 + 0.05 * Math.sin(T * 0.7);
      }
    }
    // twinkling star ceilings (Paragon + Rialto)
    if (TS.stars) { TS.stars.forEach((st, j) => { const k = 0.55 + 0.45 * Math.sin(t * (1.3 + j * 0.7) + j * 2); E[st.i * 4] = st.base[0] * k; E[st.i * 4 + 1] = st.base[1] * k; E[st.i * 4 + 2] = st.base[2] * k; }); AF.PAL.dirty = true; }
    // the queue shuffles: a slow wave of half-steps along the line, small sways and head-turns
    if (TS.qMeshes.length && AF.camera) {
      const q0 = TS.qMeshes[0].q, far = Math.hypot(AF.camera.position.x - q0.x, AF.camera.position.z - q0.z) > 90;
      if (!far) for (let i = 0; i < TS.qMeshes.length; i++) { const { mesh, q } = TS.qMeshes[i], ph = t * 0.35 - i * 0.45, step = Math.max(0, Math.sin(ph)) * 0.22; mesh.position.z = q.z - step; mesh.position.y = 0.25 + Math.abs(Math.sin(ph * 6)) * (step > 0.05 ? 0.02 : 0); mesh.rotation.y = q.yaw + 0.25 * Math.sin(t * 0.3 + i * 1.7) * Math.sin(t * 0.11 + i); }
    }
  });

  AF.onBuild('theatre', 300, () => {
    const t0 = performance.now();
    TS.cols();
    for (const id of ['th-paramount', 'th-jazz']) { const L = AF.PLAN.lot(id); if (L) AF.W.ground(L.rect[0], L.rect[1], L.rect[2], L.rect[3], 1, TS.C.pave); }
    for (const [n, fn] of [['paramount', buildParamount], ['paragon-plus', paragonPlus], ['bay-shops', buildBayShops], ['jazz', buildJazzLot], ['heron-plus', heronPlus], ['fronts-plus', frontsPlus]]) {
      try { fn(); } catch (e) { console.error('[theatre] ' + n + ' failed', e); AF.errors && AF.errors.push({ part: 'theatre:' + n, msg: String(e && e.stack || e) }); }
    }
    AF.stats = Object.assign(AF.stats || {}, { theatreMs: Math.round(performance.now() - t0) });
  });

  // ---------------------------------------------------------------- tests
  const walk = (x, y, z, dx, dz, m) => { const body = { x, y, z, vy: 0, r: 0.3, h: 1.75, onGround: true }; const L = Math.hypot(dx, dz); for (let i = 0; i < m / 0.05; i++) AF.moveBody(body, dx / L * 0.05, dz / L * 0.05, 1 / 30, { step: 0.55 }); return body; };
  AF.test('theatre: Paragon door walkable into the lobby', () => {
    const P = TS.paramount; if (!P) return { ok: false, info: 'no paramount' };
    const a = P.f.w(P.tb - 3, -2), b = walk(a[0], 0.25, a[1], P.f.dir(0, 1)[0], P.f.dir(0, 1)[1], 8);
    const inside = P.f.w(P.tb - 3, 6), d = Math.hypot(b.x - inside[0], b.z - inside[1]);
    return { ok: d < 1.0, info: `reached (${b.x.toFixed(1)},${b.y.toFixed(2)},${b.z.toFixed(1)}) d=${d.toFixed(2)}` };
  });
  AF.test('theatre: Paragon auditorium reachable (side aisle to the stage front)', () => {
    const P = TS.paramount; if (!P) return { ok: false, info: 'no paramount' };
    const a = P.f.w(1.75, 12), dv = P.f.dir(0, 1), b = walk(a[0], 0.5, a[1], dv[0], dv[1], 34);
    const tgt = P.f.w(1.75, 46), d = Math.hypot(b.x - tgt[0], b.z - tgt[1]);
    return { ok: d < 1.2, info: `side aisle end d=${d.toFixed(2)} seats=${TS.paramountSeats} sits=${TS.paramountSits}` };
  });
  AF.test('theatre: Paragon grand stair reaches the balcony', () => {
    const P = TS.paramount; if (!P) return { ok: false, info: 'no paramount' };
    const a = P.f.w(38.5, 14.4), du = P.f.dir(-1, 0), dv = P.f.dir(0, 1);
    const body = { x: a[0], y: 0.5, z: a[1], vy: 0, r: 0.3, h: 1.75, onGround: true };
    for (let i = 0; i < 12 / 0.05; i++) AF.moveBody(body, du[0] * 0.05, du[1] * 0.05, 1 / 30, { step: 0.55 });
    const y1 = body.y;
    for (let i = 0; i < 22 / 0.05; i++) AF.moveBody(body, du[0] * 0.05, du[1] * 0.05, 1 / 30, { step: 0.55 });
    for (let i = 0; i < 6 / 0.05; i++) AF.moveBody(body, dv[0] * 0.05, dv[1] * 0.05, 1 / 30, { step: 0.55 });
    const inB = P.f.w(4.25, 20), d = Math.hypot(body.x - inB[0], body.z - inB[1]);
    return { ok: y1 >= 7.4 && body.y >= 7.4 && d < 1.5, info: `stair top y=${y1.toFixed(2)} balcony y=${body.y.toFixed(2)} d=${d.toFixed(2)}` };
  });
  AF.test('theatre: Blue Heron + Rialto + ≥200 seats', () => {
    const ok = ['blue-heron', 'rialto', 'paramount'].every((id) => AF.buildings.some((b) => b.id === id));
    return { ok: ok && TS.paramountSeats >= 200 && TS.paramountSits >= 30 && AF.searchlightSpots && AF.searchlightSpots.length === 2, info: `seats ${TS.paramountSeats}, sit spots ${TS.paramountSits}, tables ${TS.heron && TS.heron.tables}` };
  });
}

} catch (e) { AF.partError('22-theatre.js', e); }

