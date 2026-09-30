// ================================================================ 40-homes.js
try {
// ===== 40-homes: RESIDENTIAL KIT — colours, furniture/prop models, parcel frames, the rowhouse generator  (OWNER: residential) =====
// Exposes AF.resKit (used by 41-homes-2.js for the Old Town / Eastside blocks and by 42-fill.js).
// Parcel frame: u = along the frontage (to your right standing on the street facing the house), v = depth into the lot, y up.
// Model facing inside a frame: k=0 faces the street (-v), k=2 faces the back (+v), k=1 faces +u, k=3 faces -u.
{
const RK = AF.resKit = {};
const q4 = (v) => Math.round(v * 4) / 4;
RK.q4 = q4;
RK.hash = (a, b = 0, c = 0) => { let h = (a * 374761393 + b * 668265263 + c * 2147483647) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296; };

// ---------------------------------------------------------------- frames
RK.frame = (P) => {
  const f = P.face;
  const Wd = (f === 'n' || f === 's') ? P.x1 - P.x0 : P.z1 - P.z0;
  const Dp = (f === 'n' || f === 's') ? P.z1 - P.z0 : P.x1 - P.x0;
  const map = (u, v) => f === 's' ? [P.x0 + u, P.z1 - v] : f === 'n' ? [P.x1 - u, P.z0 + v] : f === 'e' ? [P.x1 - v, P.z1 - u] : [P.x0 + v, P.z0 + u];
  const base = { s: 0, n: 2, e: 1, w: 3 }[f];
  const F = {
    W: Wd, D: Dp, map, base, face: f,
    fill(u0, y0, v0, u1, y1, v1, c) { if (u1 === u0 || v1 === v0 || y1 === y0) return; const a = map(u0, v0), b = map(u1, v1); AF.W.fill(Math.min(a[0], b[0]), Math.min(y0, y1), Math.min(a[1], b[1]), Math.max(a[0], b[0]), Math.max(y0, y1), Math.max(a[1], b[1]), c); },
    ground(u0, v0, u1, v1, h, c) { const a = map(u0, v0), b = map(u1, v1); AF.W.ground(Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[0], b[0]), Math.max(a[1], b[1]), h, c); },
    place(geo, u, y, v, k = 0, o) { if (!geo) return; const p = map(u, v); AF.placeStatic(geo, p[0], y, p[1], (base + k) % 4, o || { collide: false }); },
    w(u, v) { return map(u, v); },
    // world yaw of the direction k (0 = toward street -v, 1 = +u, 2 = +v into house, 3 = -u)
    yaw(k) { const d = [[0, -1], [1, 0], [0, 1], [-1, 0]][k % 4]; const a = map(0, 0), b = map(d[0], d[1]); return Math.atan2(b[0] - a[0], b[1] - a[1]); },
    box(u0, y0, v0, u1, y1, v1) { const a = map(u0, v0), b = map(u1, v1); return [Math.min(a[0], b[0]), y0, Math.min(a[1], b[1]), Math.max(a[0], b[0]), y1, Math.max(a[1], b[1])]; },
  };
  return F;
};
RK.sub = (F, ou, W, D) => ({  // a narrower frame (same face) offset ou along u
  W, D: D ?? F.D, parent: F, face: F.face, base: F.base,
  fill(u0, y0, v0, u1, y1, v1, c) { F.fill(ou + u0, y0, v0, ou + u1, y1, v1, c); },
  ground(u0, v0, u1, v1, h, c) { F.ground(ou + u0, v0, ou + u1, v1, h, c); },
  place(geo, u, y, v, k = 0, o) { F.place(geo, ou + u, y, v, k, o); },
  w(u, v) { return F.w(ou + u, v); },
  yaw(k) { return F.yaw(k); },
  box(u0, y0, v0, u1, y1, v1) { return F.box(ou + u0, y0, v0, ou + u1, y1, v1); },
});

// ---------------------------------------------------------------- colours (defined once)
let C = null;
RK.colours = () => {
  if (C) return C;
  const col = AF.col;
  const br = (hex) => ({ a: col(hex, { jitter: 0.5, edge: 0.45 }), b: col(new THREE.Color(hex).multiplyScalar(0.88).getHex(), { jitter: 0.5, edge: 0.45 }), hex });
  C = {
    bricks: [br(0x9a4032), br(0x7c3328), br(0xb8664c), br(0xc98468), br(0x6e4636), br(0xa8573c), br(0x8a4a3a), br(0xd6c3a0), br(0xc4a878)],
    brownstone: br(0x6b4636), brownstone2: br(0x7a5240),
    stone: [col(0xe2d6ba, { jitter: 0.25, edge: 0.35 }), col(0xcfc2a4, { jitter: 0.25, edge: 0.35 }), col(0x5c3c2e, { jitter: 0.3, edge: 0.35 }), col(0xbab2a0, { jitter: 0.3, edge: 0.35 })],
    cornice: [col(0xe6dcc4, { jitter: 0.15, edge: 0.4 }), col(0x3e3a36, { jitter: 0.15, edge: 0.4 }), col(0x4f6a58, { jitter: 0.15, edge: 0.4 }), col(0x8a3a2e, { jitter: 0.15, edge: 0.4 }), col(0xc9b48a, { jitter: 0.15, edge: 0.4 })],
    doors: [col(0x9a2a24, { jitter: 0.1 }), col(0x2f5a3a, { jitter: 0.1 }), col(0x222024, { jitter: 0.1 }), col(0x2d4a6e, { jitter: 0.1 }), col(0x6a3a22, { jitter: 0.2 }), col(0x1f5a5a, { jitter: 0.1 })],
    tar: col(0x45403c, { jitter: 0.35, edge: 0.3 }), tar2: col(0x57504a, { jitter: 0.35, edge: 0.3 }),
    coping: col(0xbdb3a0, { jitter: 0.25, edge: 0.45 }),
    copingL: col(0xe6dfcf, { jitter: 0.2, edge: 0.45 }), tar3: col(0x625a52, { jitter: 0.4, edge: 0.3 }), tar4: col(0x3a3634, { jitter: 0.3, edge: 0.3 }),
    darkGlass: col(0x98b4bc, { glass: true, jitter: 0.1, edge: 0 }),
    iron: col(0x2a2c2e, { jitter: 0.1, edge: 0.2 }),
    glass: AF.col('glass'),
    // lit glass for hollow rooms (transparent) and window panes for solid floors: warm / cream / dark / tv-blue
    litGlass: col(0xa8c4cc, { glass: true, jitter: 0.1, edge: 0, emit: 0xffb45a, emitK: 0.55, mode: 'night' }),
    win: [col(0x3a4652, { jitter: 0.1, edge: 0.1, emit: 0xffb050, emitK: 0.95, mode: 'night', win: 'apartment', rough: 0.1 }), col(0x46505a, { jitter: 0.1, edge: 0.1, emit: 0xffe0a0, emitK: 0.75, mode: 'night', win: 'apartment', rough: 0.1 }),
          col(0x2a323a, { jitter: 0.1, edge: 0.1, win: 'apartment', rough: 0.1 }), col(0x3a4a5a, { jitter: 0.1, edge: 0.1, emit: 0x7aa8ff, emitK: 0.55, mode: 'night', win: 'apartment', rough: 0.1 }), col(0x303a44, { jitter: 0.1, edge: 0.1, win: 'apartment', rough: 0.1 })],
    // v2: roof finishes (tar, gravel, silver paint, red oxide, green felt, old tar), coping colours, sash paints, Boston ivy, slate/terracotta/copper roofs
    roofs: [col(0x45403c, { jitter: 0.35, edge: 0.3, pat: 'none', patTop: 'tar' }), col(0x9a9488, { jitter: 0.7, edge: 0.2, pat: 'none', patTop: 'stucco' }), col(0xb8b8b0, { jitter: 0.25, edge: 0.3, pat: 'none', patTop: 'metal', metal: 0.3, rough: 0.5 }),
            col(0x8a4a38, { jitter: 0.3, edge: 0.3, pat: 'none', patTop: 'tar' }), col(0x4a6a4a, { jitter: 0.35, edge: 0.3, pat: 'none', patTop: 'tar' }), col(0x57504a, { jitter: 0.35, edge: 0.3, pat: 'none', patTop: 'tar' })],
    copings: [col(0xe6dfcf, { jitter: 0.2, edge: 0.45 }), col(0xb0603f, { jitter: 0.25, edge: 0.45, pat: 'terracotta' }), col(0x8a8680, { jitter: 0.25, edge: 0.45 }), col(0x3e5a48, { jitter: 0.2, edge: 0.45 })],
    sashF: [col(0xf2eee2, { jitter: 0.05, edge: 0.2 }), col(0x2f4a36, { jitter: 0.08, edge: 0.2 }), col(0x5c2220, { jitter: 0.08, edge: 0.2 }), col(0x1e1e22, { jitter: 0.05, edge: 0.2 })],
    ivy: [col(0x8a2a22, { jitter: 0.6, edge: 0.3 }), col(0xa8452a, { jitter: 0.6, edge: 0.3 }), col(0x6a7a2a, { jitter: 0.6, edge: 0.3 }), col(0xc0602a, { jitter: 0.6, edge: 0.3 }), col(0x4a5a26, { jitter: 0.6, edge: 0.3 })],
    slate: col(0x4a5560, { jitter: 0.35, edge: 0.4, pat: 'shingle' }), slate2: col(0x3e4852, { jitter: 0.35, edge: 0.4, pat: 'shingle' }),
    terra: col(0xb0553a, { jitter: 0.3, edge: 0.4, pat: 'terracotta' }), terra2: col(0x9a4832, { jitter: 0.3, edge: 0.4, pat: 'terracotta' }),
    copperR: col(0x5f9e8a, { jitter: 0.35, edge: 0.4, pat: 'metal', rough: 0.7 }), copperR2: col(0x4f8a78, { jitter: 0.35, edge: 0.4, pat: 'metal', rough: 0.7 }),
    shopWin: col(0x4a4438, { jitter: 0.08, edge: 0.1, win: 'shop', emit: 0xffd9a0, emitK: 0.8, mode: 'night', rough: 0.1 }),
    shade: col(0xe8dcb8, { jitter: 0.1, edge: 0.05 }),
    paper: [[0xf0e6cc, 0xb89a70], [0xd8e6d4, 0x8fa88c], [0xf2d8cc, 0xa8806e], [0xd8e0ea, 0x8b9cb0], [0xf4e6b4, 0xb89a60], [0xe8dcd0, 0x7a5a44]].map(([a, b]) => ({ paper: col(a, { smooth: true }), wains: col(b, { jitter: 0.15, edge: 0.2, pat: 'panel' }) })),
    moulding: col(0xf4ecd8, { smooth: true }),
    ceil: col(0xf6f1e6, { jitter: 0.06, edge: 0.05 }),
    floors: [[0xb5834e, 0xa87444], [0x9c6a3e, 0x8f6036], [0xc49a66, 0xb58a58]].map(([a, b]) => [col(a, { jitter: 0.35, edge: 0.35 }), col(b, { jitter: 0.35, edge: 0.35 })]),
    lino: [[0xb83a32, 0xf2eee6], [0x2a2a2e, 0xf2eee6], [0x5f8a5a, 0xf0e8cf], [0x3f5f8a, 0xf0ece2]].map(([a, b]) => [col(a, { jitter: 0.08, edge: 0.15 }), col(b, { jitter: 0.08, edge: 0.15 })]),
    tile: [col(0xf2efe6, { jitter: 0.06, edge: 0.2 }), col(0x2a2a2e, { jitter: 0.06, edge: 0.2 })],
    stair: [col(0x8a5a32, { jitter: 0.3 }), col(0x6e4628, { jitter: 0.3 })],
    ceilLamp: col(0xfff3d6, { emit: 0xffe0a8, emitK: 2.0, mode: 'always', jitter: 0, edge: 0 }),
    yard: [col(0x6e8a45, { jitter: 0.7, edge: 0.1 }), col(0x7a9450, { jitter: 0.7, edge: 0.1 }), col(0x8a7a5a, { jitter: 0.6, edge: 0.2 }), col(0xa89a86, { jitter: 0.5, edge: 0.5 })],
    dirt: col(0x5e4128, { jitter: 0.6 }), paving: col(0xa8a092, { jitter: 0.45, edge: 0.5 }), cobble: col(0x8e8478, { jitter: 0.6, edge: 0.6 }),
    fence: [col(0x8a6a4a, { jitter: 0.4, edge: 0.4 }), col(0x76583c, { jitter: 0.4, edge: 0.4 })],
    wood: col(0x7a4e2c, { jitter: 0.3 }), woodD: col(0x4e3220, { jitter: 0.25 }), woodL: col(0xb58656, { jitter: 0.3 }),
    shed: [col(0x6a7a5a, { jitter: 0.3, edge: 0.4 }), col(0x8a5a3a, { jitter: 0.3, edge: 0.4 }), col(0x5a6a7a, { jitter: 0.3, edge: 0.4 })],
    awning: [[0x2f6a4a, 0xf0e8d0], [0xb03a30, 0xf0e8d0], [0x2d4a7a, 0xf0e8d0], [0xd8a02a, 0x6a3a22], [0x7a2a4a, 0xf0e0c8]].map(([a, b]) => [col(a, { jitter: 0.1, edge: 0.3 }), col(b, { jitter: 0.1, edge: 0.3 })]),
    signBg: [col(0x1f3a2e, { jitter: 0.05 }), col(0x7a1f1a, { jitter: 0.05 }), col(0x1a2a4a, { jitter: 0.05 }), col(0x2a2622, { jitter: 0.05 })],
    gold: col(0xe8c050, { jitter: 0.05, edge: 0.2, emit: 0xffc860, emitK: 0.5, mode: 'night' }),
    cream: col(0xf4ecd4, { jitter: 0.05, emit: 0xfff0c0, emitK: 0.6, mode: 'night' }),
    shopPaper: { grocery: [0xe8e8d0, 0x3a6a4a], candy: [0xf8dce8, 0xc86a8a], tailor: [0xd8d0c0, 0x4a3a2a], deli: [0xf0ecd8, 0x8a3a2a], laundry: [0xdce8f0, 0x6a8aa8], bar: [0x6a3a2a, 0x3a2418], doctor: [0xf0f4f0, 0x7a9a8a], bakery: [0xf4e4c0, 0xa86a3a], hardware: [0xd8c8a0, 0x5a5a4a] },
    redPaint: col(0xb82a22, { jitter: 0.12, edge: 0.3 }), brass: col(0xd8b050, { jitter: 0.1, edge: 0.2 }),
  };
  return C;
};

// ---------------------------------------------------------------- models (shared geometry, built once)
let G = null;
RK.geos = () => {
  if (G) return G;
  const col = AF.col, M = AF.Model;
  const mesh = (m, vs, o = {}) => AF.meshModel(m, Object.assign({ vs }, o));
  G = {};
  const wood = col(0x7a4e2c, { jitter: 0.25 }), woodD = col(0x4e3220, { jitter: 0.2 }), woodL = col(0xb58656, { jitter: 0.25 });
  const chrome = col(0xd8dcdf, { jitter: 0.05, edge: 0.3 }), enamel = col(0xf4f1e8, { jitter: 0.05, edge: 0.3 }), blackI = col(0x222124, { jitter: 0.1 });
  const shadeGlow = col(0xf8e2b0, { emit: 0xffcf80, emitK: 1.6, mode: 'always', jitter: 0, edge: 0.1 });
  const brass = col(0xc9a24a, { jitter: 0.1 });
  const jarC = [0xd8322a, 0xe8a030, 0x6a9a3a, 0xf0e0b0, 0x8a4a8a, 0xc86a2a].map((h) => col(h, { jitter: 0.2 }));
  // sofas
  G.sofa = [[0x7a3b36, 0x8d4a42], [0x3f6150, 0x4c7360], [0x7a6a45, 0x8c7c55], [0x4a5a7a, 0x5a6a8a], [0x8a6a3a, 0x9a7a4a]].map(([a, b], i) => {
    const f = col(a, { jitter: 0.25 }), c = col(b, { jitter: 0.25 }), acc = col([0xe0b04a, 0xe8d8b8, 0xc05a3a, 0xf0e8d0, 0x3a5a7a][i], { jitter: 0.2 });
    const m = new M(16, 7, 7);
    for (const [x, z] of [[1, 1], [14, 1], [1, 5], [14, 5]]) m.box(x, 0, z, x + 1, 1, z + 1, woodD);
    m.box(0, 1, 0, 16, 3, 7, f); m.box(0, 3, 0, 16, 7, 2, f); m.box(0, 3, 0, 2, 5, 7, c); m.box(14, 3, 0, 16, 5, 7, c);
    m.box(2, 3, 2, 8, 4, 7, c); m.box(8, 3, 2, 14, 4, 7, f); m.box(2, 4, 2, 4, 6, 3, acc); m.box(12, 4, 2, 14, 6, 3, acc);
    return mesh(m, 1 / 8);
  });
  G.armchair = [[0x6a4a7a, 0x7a5a8a], [0x8a5a2a, 0x9a6a3a], [0x3f5f6a, 0x4f6f7a], [0x8a3a3a, 0x9a4a44]].map(([a, b]) => {
    const f = col(a, { jitter: 0.25 }), c = col(b, { jitter: 0.25 });
    const m = new M(8, 8, 7);
    for (const [x, z] of [[0, 0], [7, 0], [0, 6], [7, 6]]) m.box(x, 0, z, x + 1, 1, z + 1, woodD);
    m.box(0, 1, 0, 8, 3, 7, f); m.box(0, 3, 0, 8, 8, 2, f); m.box(0, 3, 0, 1, 5, 7, c); m.box(7, 3, 0, 8, 5, 7, c); m.box(1, 3, 2, 7, 4, 7, c);
    return mesh(m, 1 / 8);
  });
  G.rug = [[0x8a2a2a, 0xd9b77a, 0x2f4a6a], [0x2f4a6a, 0xe0d0a8, 0x8a2a2a], [0x4a6a3a, 0xe8d8b0, 0x9a5a2a], [0x6a2a4a, 0xe8c890, 0x2a5a5a]].map(([a, b, c2]) => {
    const A = col(a, { jitter: 0.2, edge: 0 }), B = col(b, { jitter: 0.2, edge: 0 }), Cc = col(c2, { jitter: 0.2, edge: 0 });
    const m = new M(28, 1, 40);
    m.box(0, 0, 0, 28, 1, 40, A); m.box(2, 0, 2, 26, 1, 38, B); m.box(4, 0, 4, 24, 1, 36, A); m.box(10, 0, 14, 18, 1, 26, Cc);
    for (let z = 6; z < 34; z += 4) { m.set(6, 0, z, Cc); m.set(21, 0, z, Cc); }
    return mesh(m, 1 / 16);
  });
  { // radio console with glowing dial
    const m = new M(7, 9, 4); const grille = col(0xc9b48a, { jitter: 0.4 }), dial = col(0xffc060, { emit: 0xffa040, emitK: 1.8, mode: 'always', jitter: 0 });
    m.box(0, 0, 0, 7, 8, 4, wood); m.box(1, 2, 3, 6, 5, 4, grille); m.box(2, 6, 3, 5, 7, 4, dial); m.box(0, 0, 0, 7, 1, 4, woodD); m.set(1, 6, 3, blackI); m.set(5, 6, 3, blackI);
    m.box(1, 8, 1, 6, 9, 3, woodD);
    G.radio = mesh(m, 1 / 8);
  }
  { // fireplace (stands against a wall, front +z) with fire
    const brick = col(0x8a3a2c, { jitter: 0.5 }), mantel = col(0x6b4428, { jitter: 0.3 }), soot = col(0x2a2522, {}), fire = col(0xffa23a, { emit: 0xff7a1a, emitK: 3.0, mode: 'always', jitter: 0.6, edge: 0 }), ember = col(0xd9471c, { emit: 0xc03a10, emitK: 2.0, mode: 'always', jitter: 0.5, edge: 0 }), log = col(0x5a3a22, {});
    const m = new M(14, 12, 4);
    m.box(0, 0, 0, 14, 11, 3, brick); m.box(4, 1, 1, 10, 6, 3, soot); m.box(4, 0, 1, 10, 1, 4, col(0x6a6260, {}));
    m.box(5, 1, 2, 9, 2, 3, log); m.box(5, 2, 2, 9, 3, 3, ember); m.set(6, 3, 2, fire); m.set(7, 3, 2, fire); m.set(7, 4, 2, fire); m.set(8, 3, 2, fire);
    m.box(0, 8, 0, 14, 9, 4, mantel); m.box(1, 9, 3, 2, 10, 4, brass); m.box(12, 9, 3, 13, 10, 4, brass); m.box(5, 9, 2, 9, 11, 3, col(0x4a3020, {})); m.box(6, 9, 3, 8, 10, 4, enamel);
    G.fireplace = mesh(m, 1 / 8);
  }
  { // floor lamp + table lamp
    const m = new M(3, 13, 3);
    m.box(0, 0, 0, 3, 1, 3, brass); m.box(1, 1, 1, 2, 9, 2, brass); m.box(0, 9, 0, 3, 12, 3, shadeGlow); m.set(1, 12, 1, brass);
    G.floorLamp = mesh(m, 1 / 8);
  }
  { // pictures
    const gilt = col(0xb8923a, { jitter: 0.2 });
    G.pic = [[0x8fb8d8, 0x6a9a4a, 0xe8c050], [0xd8c8a0, 0x7a5a3a, 0x3a3a3a], [0xe0a060, 0x3a5a7a, 0xf0e0c0], [0xa8c8a8, 0xc04a3a, 0xf0f0e8], [0x2a4a6a, 0xe8e0d0, 0xd84a3a]].map(([a, b, c2]) => {
      const A = col(a, { jitter: 0.1, edge: 0 }), B = col(b, { jitter: 0.2, edge: 0 }), Cc = col(c2, { jitter: 0.1, edge: 0 });
      const m = new M(7, 6, 1); m.box(0, 0, 0, 7, 6, 1, gilt); m.box(1, 3, 0, 6, 5, 1, A); m.box(1, 1, 0, 6, 3, 1, B); m.set(4, 4, 0, Cc); m.set(2, 2, 0, Cc);
      return mesh(m, 1 / 8, { anchor: [0.5, 0, 0] });
    });
  }
  { // range stove
    const m = new M(6, 9, 5);
    m.box(0, 0, 0, 6, 7, 5, enamel); m.box(0, 7, 0, 6, 9, 1, enamel); m.box(1, 1, 4, 5, 5, 5, chrome); m.box(1, 5, 4, 5, 6, 5, blackI);
    m.set(1, 7, 1, blackI); m.set(4, 7, 1, blackI); m.set(1, 7, 3, blackI); m.set(4, 7, 3, blackI);
    m.set(2, 8, 2, col(0xd84a3a, { jitter: 0 })); m.set(3, 8, 2, col(0x9aa0a8, { jitter: 0.1 }));
    G.stove = mesh(m, 1 / 8);
  }
  { // icebox (oak)
    const m = new M(6, 13, 5); const oak = col(0xb08050, { jitter: 0.25 });
    m.box(0, 0, 0, 6, 13, 5, oak); m.box(0, 6, 4, 6, 7, 5, woodD); m.box(4, 8, 4, 5, 10, 5, brass); m.box(4, 3, 4, 5, 5, 5, brass); m.box(0, 12, 0, 6, 13, 5, woodD);
    G.icebox = mesh(m, 1 / 8);
  }
  { // sink cabinet + counter with canisters
    const cab = col(0xe8e0c8, { jitter: 0.1 }), top = col(0xc84a3a, { jitter: 0.15 });
    const m = new M(8, 9, 5); m.box(0, 0, 0, 8, 7, 5, cab); m.box(0, 7, 0, 8, 8, 5, top); m.box(2, 7, 1, 6, 8, 4, col(0xb8bcc0, { jitter: 0.1 }));
    m.box(3, 8, 0, 5, 9, 1, chrome); m.set(4, 8, 1, chrome); m.box(0, 0, 4, 8, 1, 5, col(0x2a2622, {})); m.set(2, 4, 4, chrome); m.set(5, 4, 4, chrome);
    G.sink = mesh(m, 1 / 8);
    const n = new M(8, 10, 5); n.box(0, 0, 0, 8, 7, 5, cab); n.box(0, 7, 0, 8, 8, 5, top); n.box(0, 0, 4, 8, 1, 5, col(0x2a2622, {}));
    n.set(1, 4, 4, chrome); n.set(6, 4, 4, chrome);
    n.box(1, 8, 1, 2, 10, 2, col(0xd8c8a0, {})); n.box(3, 8, 1, 4, 9, 2, col(0x8a5a3a, {})); n.box(5, 8, 2, 7, 9, 4, col(0xf2d27a, {}));
    G.counter = mesh(n, 1 / 8);
  }
  { // wall shelves with jars
    const m = new M(10, 12, 2);
    for (const y of [0, 5, 10]) m.box(0, y, 0, 10, y + 1, 2, woodL);
    m.box(0, 0, 0, 1, 11, 2, woodL); m.box(9, 0, 0, 10, 11, 2, woodL);
    for (const y of [1, 6]) for (let x = 1; x < 9; x++) { if ((x + y) % 4 === 3) continue; const hh = 2 + ((x * 3 + y) % 2); m.box(x, y, 0, x + 1, y + hh, 2, jarC[(x * 5 + y) % jarC.length]); }
    G.jarShelf = mesh(m, 1 / 8, { anchor: [0.5, 0, 0] });
  }
  { // kitchen table with gingham cloth + chair
    const red = col(0xc83a32, { jitter: 0.05, edge: 0 }), wht = col(0xf4efe4, { jitter: 0.05, edge: 0 });
    const t2 = new M(10, 8, 8);
    for (const [x, z] of [[1, 1], [8, 1], [1, 6], [8, 6]]) t2.box(x, 0, z, x + 1, 6, z + 1, woodL);
    for (let x = 0; x < 10; x++) for (let z = 0; z < 8; z++) t2.set(x, 6, z, ((x >> 1) + (z >> 1)) & 1 ? red : wht);
    for (const x of [0, 9]) for (let z = 0; z < 8; z++) t2.set(x, 5, z, (z >> 1) & 1 ? red : wht);
    t2.box(4, 7, 3, 6, 8, 5, col(0xe8a040, {})); t2.set(1, 7, 1, wht); t2.set(8, 7, 6, wht);
    G.table = mesh(t2, 1 / 8);
    const c = new M(4, 8, 4); for (const [x, z] of [[0, 0], [3, 0], [0, 3], [3, 3]]) c.box(x, 0, z, x + 1, 3, z + 1, woodL);
    c.box(0, 3, 0, 4, 4, 4, woodL); c.box(0, 4, 0, 4, 8, 1, woodL); c.box(1, 5, 0, 3, 7, 1, 0);
    G.chair = mesh(c, 1 / 8);
  }
  { // beds, dresser, wardrobe, nightstand
    const quiltSets = [[0xc84a3a, 0xf0e0b0, 0x4a6a9a, 0xe8a040, 0x6a9a5a, 0xf4efe4], [0x3a5a8a, 0xf4efe4, 0x8ab0d0, 0xd8c8a0, 0x2a3a5a, 0xc8a878], [0xd87a8a, 0xf8e8d8, 0x9ac8a8, 0xf0d070, 0xb05a6a, 0xe8d8e8]];
    G.bed = quiltSets.map((qs, s) => {
      const Q = qs.map((h) => col(h, { jitter: 0.15, edge: 0.1 }));
      const m = new M(11, 7, 17);
      m.box(0, 0, 0, 11, 7, 1, wood); m.box(0, 0, 16, 11, 4, 17, wood); m.box(0, 1, 1, 11, 2, 16, woodD);
      m.box(0, 2, 1, 11, 3, 16, col(0xf4efe4, { jitter: 0.05 })); m.box(1, 3, 1, 10, 4, 4, col(0xf8f6f0, { jitter: 0.05 }));
      for (let x = 0; x < 11; x++) for (let z = 4; z < 16; z++) { const pc = Q[(((x >> 1) * 3 + (z >> 1) * 5 + s) % 6 + 6) % 6]; m.set(x, 3, z, pc); if (x === 0 || x === 10) m.set(x, 2, z, pc); }
      return mesh(m, 1 / 8, { anchor: [0.5, 0, 0] });
    });
    const d = new M(8, 13, 4); d.box(0, 0, 0, 8, 7, 4, wood);
    for (const y of [1, 3, 5]) { d.set(2, y, 3, brass); d.set(5, y, 3, brass); }
    for (const y of [2, 4]) d.box(0, y, 3, 8, y + 1, 4, woodD);
    d.box(1, 7, 0, 7, 13, 1, wood); d.box(2, 8, 0, 6, 12, 1, col(0xc8dce0, { jitter: 0, edge: 0 })); d.set(1, 7, 2, col(0xd8a0b0, {}));
    G.dresser = mesh(d, 1 / 8);
    const w = new M(9, 17, 5); w.box(0, 0, 0, 9, 17, 5, wood); w.box(0, 16, 0, 9, 17, 5, woodD); w.box(4, 1, 4, 5, 15, 5, woodD); w.set(3, 8, 4, brass); w.set(5, 8, 4, brass); w.box(0, 0, 0, 9, 1, 5, woodD);
    G.wardrobe = mesh(w, 1 / 8);
    const n = new M(3, 8, 3); n.box(0, 0, 0, 3, 4, 3, wood); n.box(1, 4, 1, 2, 5, 2, brass); n.box(0, 5, 0, 3, 8, 3, shadeGlow);
    G.nightstand = mesh(n, 1 / 8);
  }
  { // ceiling lamp (hangs from the ceiling: origin at top)
    const m = new M(4, 5, 4); m.box(1, 3, 1, 3, 5, 3, brass); m.box(0, 0, 0, 4, 3, 4, shadeGlow); m.box(1, 0, 1, 3, 1, 3, col(0xfff6e0, { emit: 0xffe0a0, emitK: 2.4, mode: 'always', jitter: 0 }));
    G.hangLamp = mesh(m, 1 / 8, { anchor: [0.5, 1, 0.5] });
  }
  // ---- shop fittings
  { // shop counter with cash register
    const top = col(0x5a3a22, { jitter: 0.2 }), front = col(0x8a5a32, { jitter: 0.25 }), reg = col(0x9a8a6a, { jitter: 0.1 });
    const m = new M(20, 11, 5);
    m.box(0, 0, 0, 20, 7, 5, front); m.box(0, 7, 0, 20, 8, 5, top); for (let x = 1; x < 20; x += 4) m.box(x, 1, 4, x + 2, 6, 5, woodD);
    m.box(14, 8, 1, 18, 10, 4, reg); m.box(14, 10, 1, 18, 11, 2, brass); m.set(15, 9, 4, blackI); m.set(16, 9, 4, blackI);
    m.box(2, 8, 1, 4, 11, 3, col(0xe8e0c8, { glass: true, jitter: 0 })); m.box(5, 8, 1, 7, 10, 3, col(0xd8c8a0, { glass: true, jitter: 0 }));
    G.shopCounter = mesh(m, 1 / 8);
  }
  G.stockShelf = {};
  const stockPal = {
    grocery: [0xd8322a, 0xe8a030, 0x6a9a3a, 0xf0e0b0, 0x3a6aa8, 0xc86a2a, 0xf4f0e0],
    candy: [0xe84a8a, 0xf0d040, 0x5ac8e8, 0xf08a3a, 0x8ae05a, 0xe8e0f0, 0xd83a3a],
    tailor: [0x2a3a5a, 0x5a4a3a, 0x8a8a8a, 0x3a5a3a, 0xd8d0c0, 0x6a2a2a],
    deli: [0xc84a3a, 0xd8a870, 0xf0e8c0, 0x8a4a2a, 0x6a8a3a, 0xe8c050],
    laundry: [0xf4f2ec, 0xe8e0d0, 0x8ab0d8, 0xd8c8a8, 0xf0f0f0, 0xa8c8e0],
    bar: [0x5a8a3a, 0x8a4a1a, 0xe8c070, 0x3a6a3a, 0xd8d0b0, 0x6a2a1a],
    doctor: [0xf4f2ec, 0x8a3a2a, 0x3a5a8a, 0xd8c8a0, 0x6a8a6a],
    bakery: [0xd8a060, 0xc88040, 0xf0d8a0, 0xa86030, 0xf4e8d0, 0x8a5a2a],
  };
  for (const k in stockPal) {
    const P = stockPal[k].map((h) => col(h, { jitter: 0.25 }));
    const m = new M(12, 18, 3);
    m.box(0, 0, 0, 12, 18, 3, woodD); m.box(1, 1, 1, 11, 17, 3, 0);
    for (const y of [1, 5, 9, 13]) m.box(1, y, 0, 11, y + 1, 3, wood);
    for (const y of [2, 6, 10, 14]) for (let x = 1; x < 11; x++) { if ((x * 7 + y) % 9 === 4) continue; const hh = 2 + ((x + y) % 2); m.box(x, y, 1, x + 1, y + hh, 3, P[(x * 3 + y * 5) % P.length]); }
    G.stockShelf[k] = mesh(m, 1 / 8, { anchor: [0.5, 0, 0] });
  }
  { // bar stool + round bar table
    const m = new M(3, 6, 3); m.box(1, 0, 1, 2, 5, 2, chrome); m.box(0, 5, 0, 3, 6, 3, col(0x9a2a24, {})); m.box(0, 0, 0, 3, 1, 3, chrome);
    G.stool = mesh(m, 1 / 8);
    const b = new M(12, 10, 3); b.box(0, 0, 0, 12, 10, 1, woodD); const bot = [0x3a6a3a, 0x8a4a1a, 0xd8c070, 0x2a4a2a, 0x7a2a1a].map((h) => col(h, { glass: true, jitter: 0.2 }));
    for (const y of [2, 6]) { b.box(0, y, 0, 12, y + 1, 3, wood); for (let x = 1; x < 11; x += 2) b.box(x, y + 1, 1, x + 1, y + 4, 2, bot[(x + y) % 5]); }
    b.box(3, 0, 1, 9, 1, 3, col(0xd8dcdf, {}));
    G.bottles = mesh(b, 1 / 8, { anchor: [0.5, 0, 0] });
  }
  { // shop centrepieces
    const crate = col(0xa8804a, { jitter: 0.3 }), fr = [0xd8322a, 0xe8a030, 0x7ab040, 0xf0d040, 0x6a3a8a].map((h) => col(h, { jitter: 0.35 }));
    const m = new M(20, 7, 10);
    for (let i = 0; i < 3; i++) { const x0 = i * 7; m.box(x0, 0, 0, x0 + 6, 4, 10, crate); m.box(x0 + 1, 1, 1, x0 + 5, 4, 9, 0); for (let x = x0 + 1; x < x0 + 5; x++) for (let z = 1; z < 9; z++) { m.set(x, 3, z, fr[(i + ((x + z) % 3 === 0 ? 3 : 0)) % 5]); if ((x + z) % 2) m.set(x, 4, z, fr[i]); } }
    G.crates = mesh(m, 1 / 8);
    const t = new M(12, 10, 8); for (const [x, z] of [[0, 0], [11, 0], [0, 7], [11, 7]]) t.box(x, 0, z, x + 1, 6, z + 1, woodD);
    t.box(0, 6, 0, 12, 7, 8, woodL);
    const cj = [0xe84a8a, 0xf0d040, 0x5ac8e8, 0xf08a3a, 0x8ae05a].map((h) => col(h, { jitter: 0.3 })), jg = col(0xe8f0f0, { glass: true, jitter: 0 });
    for (let i = 0; i < 6; i++) { const x = 1 + (i % 3) * 4, z = i < 3 ? 1 : 5; t.box(x, 7, z, x + 2, 9, z + 2, cj[i % 5]); t.box(x, 9, z, x + 2, 10, z + 2, jg); }
    G.candyTable = mesh(t, 1 / 8);
    const dc = new M(16, 9, 6); dc.box(0, 0, 0, 16, 5, 6, enamel); dc.box(0, 5, 0, 16, 9, 1, col(0xd8e8f0, { glass: true, jitter: 0 })); dc.box(0, 8, 0, 16, 9, 6, col(0xd8e8f0, { glass: true, jitter: 0 }));
    const meat = [0xc84a3a, 0xe8b090, 0xf0e0b0, 0x8a3a2a, 0xe8c050].map((h) => col(h, { jitter: 0.3 }));
    for (let x = 1; x < 15; x += 3) dc.box(x, 5, 2, x + 2, 7, 5, meat[x % 5]);
    G.deliCase = mesh(dc, 1 / 8);
    const sal = new M(12, 10, 2); sal.box(0, 9, 0, 12, 10, 2, woodD); for (let x = 1; x < 12; x += 2) sal.box(x, 9 - 3 - (x % 3), 0, x + 1, 9, 1, col(x % 4 ? 0x8a3a2a : 0xd8b070, { jitter: 0.3 }));
    G.salami = mesh(sal, 1 / 8, { anchor: [0.5, 1, 0.5] });
    const wm = new M(8, 9, 7); wm.box(0, 0, 0, 8, 9, 7, enamel); wm.box(2, 2, 6, 6, 6, 7, chrome); wm.box(3, 3, 6, 5, 5, 7, col(0x8ab0d0, { glass: true, jitter: 0 })); wm.box(0, 8, 0, 8, 9, 2, col(0xa8b0b8, {}));
    G.washer = mesh(wm, 1 / 8);
    const ov = new M(14, 14, 8), ob = col(0xa8553a, { jitter: 0.45 }), fire = col(0xffa23a, { emit: 0xff7a1a, emitK: 3.0, mode: 'always', jitter: 0.6, edge: 0 });
    ov.box(0, 0, 0, 14, 12, 8, ob); ov.box(4, 3, 6, 10, 7, 8, col(0x2a2522, {})); ov.box(5, 3, 6, 9, 5, 7, fire); ov.box(3, 7, 7, 11, 8, 8, col(0x6a6260, {})); ov.box(5, 12, 2, 9, 14, 6, ob);
    for (let x = 1; x < 13; x += 3) ov.box(x, 9, 7, x + 2, 10, 8, col(0xd8a060, {}));
    G.oven = mesh(ov, 1 / 8);
    const mq = new M(5, 15, 3), mc = col(0xe8dcc8, { jitter: 0.1 }); mq.box(2, 0, 1, 3, 5, 2, woodD); mq.box(0, 0, 0, 5, 1, 3, woodD); mq.box(1, 5, 0, 4, 11, 3, col(0x3a4a6a, { jitter: 0.2 })); mq.box(0, 9, 0, 5, 11, 3, col(0x3a4a6a, { jitter: 0.2 })); mq.box(2, 11, 1, 3, 12, 2, mc); mq.box(1, 12, 0, 4, 15, 3, mc);
    G.mannequin = mesh(mq, 1 / 8);
  }
  { // ---- TRADE FITTINGS (one look per shop trade)
    const T = G.trade = {};
    const shelfFrame = (m, w, h, d, c) => { m.box(0, 0, 0, w, h, d, c); m.box(1, 1, 1, w - 1, h - 1, d, 0); };
    const P = (arr, o = { jitter: 0.2 }) => arr.map((h) => col(h, o));
    const silver = col(0xc8ccd0, { jitter: 0.1 }), tan = col(0xc8a070, { jitter: 0.25 }), twine = col(0x8a6a40, {}), burlap = col(0xb89a68, { jitter: 0.5 }), green = col(0x3a7a3a, { jitter: 0.3 });
    const white = col(0xf4f2ec, { jitter: 0.05 }), glassJ = col(0xe0f0f0, { glass: true, jitter: 0 }), mirror = col(0x7a9098, { jitter: 0.08, edge: 0.1 });
    // grocery: cans with labels + cereal boxes
    { const lab = P([0xd8322a, 0x3a6aa8, 0xe8a030, 0x5a9a3a, 0xf0e0b0]); const m = new M(12, 18, 3); shelfFrame(m, 12, 18, 3, woodL);
      for (const y of [1, 5, 9, 13]) m.box(1, y, 0, 11, y + 1, 3, woodL);
      for (const y of [2, 6]) for (let x = 1; x < 11; x += 2) { m.box(x, y, 1, x + 2, y + 2, 3, lab[(x + y) % 5]); m.box(x, y + 2, 1, x + 2, y + 3, 3, silver); if (x % 4 === 1) m.box(x, y + 1, 2, x + 2, y + 2, 3, white); }
      for (const y of [10, 14]) for (let x = 1; x < 11; x += 3) m.box(x, y, 1, x + 2, y + 3, 3, lab[(x * 3 + y) % 5]);
      T.grocery = mesh(m, 1 / 8, { anchor: [0.5, 0, 0] });
      const py = new M(9, 6, 5); let k = 0; for (let l = 0; l < 3; l++) for (let x = l; x < 9 - l; x += 2) { py.box(x, l * 2, 1 + (l % 2), x + 2, l * 2 + 2, 3 + (l % 2), lab[(k++) % 5]); py.box(x, l * 2 + 1, 1 + (l % 2), x + 2, l * 2 + 2, 3 + (l % 2), silver); }
      T.canPyramid = mesh(py, 1 / 8);
      const sk = new M(12, 6, 6); for (let i = 0; i < 3; i++) { sk.box(i * 4, 0, 0, i * 4 + 4, 5, 5, burlap); sk.box(i * 4 + 1, 5, 1, i * 4 + 3, 6, 4, twine); sk.box(i * 4 + 1, 2, 5, i * 4 + 3, 4, 6, col(0x8a3a2a, {})); }
      T.sacks = mesh(sk, 1 / 8);
      const sc = new M(4, 5, 3); sc.box(0, 0, 0, 4, 1, 3, white); sc.box(1, 1, 1, 3, 3, 2, white); sc.box(0, 3, 0, 4, 4, 3, silver); sc.box(1, 4, 0, 3, 5, 1, col(0xf8f4e0, {})); T.scale = mesh(sc, 1 / 8);
      const br = new M(6, 8, 6); for (let x = 0; x < 6; x++) for (let z = 0; z < 6; z++) if (Math.hypot(x - 2.5, z - 2.5) < 3.1) { for (let y = 0; y < 7; y++) br.set(x, y, z, (y === 1 || y === 5) ? col(0x3a3634, {}) : wood); br.set(x, 7, z, woodL); } br.box(2, 7, 2, 4, 8, 4, col(0xe8d0a0, {})); T.barrel = mesh(br, 1 / 8);
      const pk = new M(6, 8, 6); for (let x = 0; x < 6; x++) for (let z = 0; z < 6; z++) if (Math.hypot(x - 2.5, z - 2.5) < 3.1) { for (let y = 0; y < 7; y++) pk.set(x, y, z, (y === 1 || y === 5) ? col(0x3a3634, {}) : woodL); pk.set(x, 7, z, (x + z) % 2 ? green : col(0x5a8a3a, {})); } T.pickles = mesh(pk, 1 / 8);
    }
    // deli: jars of pickles, cheese wheels, tins; slicer
    { const m = new M(12, 18, 3); shelfFrame(m, 12, 18, 3, wood); for (const y of [1, 6, 11]) m.box(1, y, 0, 11, y + 1, 3, wood);
      const ch = col(0xf0c850, { jitter: 0.2 }), rind = col(0xc8a040, {});
      for (let x = 1; x < 11; x += 3) { m.box(x, 2, 1, x + 2, 5, 3, glassJ); m.box(x, 2, 1, x + 2, 4, 2, green); m.box(x, 7, 1, x + 3, 9, 3, ch); m.box(x, 9, 1, x + 3, 10, 3, rind); m.box(x, 12, 1, x + 2, 14, 3, P([0xd8322a, 0x3a6aa8, 0xe8a030])[x % 3]); }
      T.deli = mesh(m, 1 / 8, { anchor: [0.5, 0, 0] });
      const sl = new M(6, 5, 4); sl.box(0, 0, 0, 6, 1, 4, silver); for (let x = 1; x < 5; x++) for (let y = 1; y < 5; y++) if (Math.hypot(x - 2.5, y - 2.5) < 2) sl.set(x, y, 1, silver); sl.box(4, 1, 2, 6, 3, 4, col(0xc84a3a, {})); T.slicer = mesh(sl, 1 / 8);
    }
    // candy: tiered jar steps (tall at the wall, stepping down into the room)
    { const cj = P([0xe84a8a, 0xf0d040, 0x5ac8e8, 0xf08a3a, 0x8ae05a, 0xd83a3a, 0xa05ae0]); const m = new M(12, 16, 8), pink = col(0xe8a0b8, { jitter: 0.1 });
      for (let t = 0; t < 4; t++) { const y = 12 - t * 3, z0 = t * 2; m.box(0, 0, z0, 12, y, z0 + 2, t % 2 ? pink : col(0xf4e0e8, { jitter: 0.1 }));
        for (let x = 0; x < 12; x += 2) { m.box(x, y, z0, x + 2, y + 2, z0 + 1, cj[(x + t * 3) % 7]); m.box(x, y + 2, z0, x + 2, y + 3, z0 + 1, glassJ); } }
      T.candy = mesh(m, 1 / 8, { anchor: [0.5, 0, 0] });
    }
    // tailor: cloth bolts in cubbies + sewing machine table
    { const cl = P([0x2a3a5a, 0x5a4a3a, 0x8a8a8a, 0x3a5a3a, 0xd8d0c0, 0x6a2a2a, 0xa88a5a, 0x3a3a4a]); const m = new M(12, 18, 3); shelfFrame(m, 12, 18, 3, woodD);
      for (const y of [1, 5, 9, 13]) m.box(1, y, 0, 11, y + 1, 3, woodD); for (const x of [4, 8]) m.box(x, 1, 0, x + 1, 17, 3, woodD);
      for (const y of [2, 6, 10, 14]) for (const x0 of [1, 5, 9]) for (let r = 0; r < 2; r++) { const w = x0 === 9 ? 2 : 3; m.box(x0, y + r * 1.5 | 0, 1, x0 + w, (y + r * 1.5 | 0) + 1 + (r ? 1 : 0), 3, cl[(x0 + y * 3 + r) % 8]); }
      T.tailor = mesh(m, 1 / 8, { anchor: [0.5, 0, 0] });
      const sw = new M(8, 10, 5); for (const [x, z] of [[0, 0], [7, 0], [0, 4], [7, 4]]) sw.box(x, 0, z, x + 1, 6, z + 1, col(0x2a2a2a, {})); sw.box(0, 6, 0, 8, 7, 5, woodL);
      sw.box(1, 7, 2, 7, 8, 3, col(0x1a1a1a, {})); sw.box(5, 8, 2, 7, 10, 3, col(0x1a1a1a, {})); sw.box(1, 9, 2, 7, 10, 3, col(0x1a1a1a, {})); sw.set(3, 9, 3, col(0xd8b050, {})); sw.box(2, 0, 1, 6, 1, 4, col(0x2a2a2a, {}));
      T.sewing = mesh(sw, 1 / 8);
    }
    // laundry: brown-paper parcels + presser
    { const m = new M(12, 18, 3); shelfFrame(m, 12, 18, 3, woodL); for (const y of [1, 5, 9, 13]) m.box(1, y, 0, 11, y + 1, 3, woodL);
      for (const y of [2, 6, 10, 14]) for (let x = 1; x < 11; x += 3) { const hh = 2 + ((x + y) % 2); m.box(x, y, 1, x + 3 - (x > 8 ? 1 : 0), y + hh, 3, tan); m.box(x + 1, y, 2, x + 2, y + hh, 3, twine); m.box(x, y + 1, 2, x + 3 - (x > 8 ? 1 : 0), y + 2, 3, twine); if (x === 4) m.set(x + 2, y + hh - 1, 2, white); }
      T.laundry = mesh(m, 1 / 8, { anchor: [0.5, 0, 0] });
      const pr = new M(10, 10, 6); pr.box(0, 0, 0, 10, 6, 6, col(0x6a7a7a, { jitter: 0.1 })); pr.box(0, 6, 1, 10, 7, 5, white); pr.box(1, 8, 1, 9, 9, 5, silver); pr.box(4, 7, 5, 6, 10, 6, col(0x6a7a7a, {})); pr.box(8, 9, 2, 10, 10, 4, col(0x2a2a2a, {}));
      T.presser = mesh(pr, 1 / 8);
    }
    // bar: back-bar with mirror + bottles; beer taps
    { const bot = P([0x3a6a3a, 0x8a4a1a, 0xd8c070, 0x2a4a2a, 0x7a2a1a, 0xc8d8c0], { glass: true, jitter: 0.2 }); const m = new M(16, 22, 4);
      m.box(0, 0, 0, 16, 8, 4, woodD); m.box(0, 8, 0, 16, 9, 4, wood); m.box(0, 9, 0, 16, 22, 1, woodD); m.box(2, 12, 0, 14, 20, 1, mirror); m.box(0, 20, 0, 16, 22, 3, wood);
      for (const y of [9, 16]) { m.box(1, y, 1, 15, y + 1, 3, wood); for (let x = 1; x < 15; x += 2) m.box(x, y + 1, 1, x + 1, y + 4 + (x % 3 === 0 ? 1 : 0), 2, bot[(x + y) % 6]); }
      for (let x = 2; x < 14; x += 4) m.box(x, 2, 3, x + 2, 6, 4, col(0x6a3a22, {}));
      T.backbar = mesh(m, 1 / 8, { anchor: [0.5, 0, 0] });
      const tp = new M(6, 5, 2); tp.box(0, 0, 0, 6, 1, 2, brass); for (const x of [0, 2, 4]) { tp.box(x, 1, 0, x + 1, 4, 1, brass); tp.set(x, 4, 0, col(0x1a1a1a, {})); } T.taps = mesh(tp, 1 / 8);
      T.bar = T.backbar;
    }
    // doctor: glass cabinet, exam table, eye chart
    { const m = new M(12, 18, 3); m.box(0, 0, 0, 12, 18, 3, white); m.box(1, 8, 1, 11, 17, 3, 0); m.box(1, 8, 2, 11, 17, 3, 0);
      for (const y of [8, 12]) m.box(1, y, 0, 11, y + 1, 3, white); const bt = P([0x8a3a2a, 0x3a5a8a, 0xd8c8a0, 0xf4f2ec, 0x6a8a6a], { glass: true, jitter: 0.1 });
      for (const y of [9, 13]) for (let x = 1; x < 11; x += 2) m.box(x, y, 1, x + 1, y + 2 + (x % 2), 2, bt[(x + y) % 5]);
      m.box(1, 8, 2, 11, 17, 3, col(0xe0f0f0, { glass: true, jitter: 0 })); m.box(1, 2, 2, 11, 3, 3, silver); m.box(1, 5, 2, 11, 6, 3, silver);
      T.doctor = mesh(m, 1 / 8, { anchor: [0.5, 0, 0] });
      const et = new M(16, 7, 6); for (const [x, z] of [[0, 0], [15, 0], [0, 5], [15, 5]]) et.box(x, 0, z, x + 1, 5, z + 1, silver); et.box(0, 5, 0, 16, 6, 6, col(0x4a3a2a, {})); et.box(0, 6, 0, 16, 7, 6, col(0x3a6a5a, {})); et.box(12, 6, 0, 16, 7, 6, white); et.box(0, 7, 0, 16, 7, 6, 0);
      T.exam = mesh(et, 1 / 8);
      const ec = new M(6, 9, 1); ec.box(0, 0, 0, 6, 9, 1, white); const bl = col(0x1a1a1a, {}); ec.box(2, 7, 0, 4, 8, 0 + 1, bl); for (const [y, n] of [[5, 2], [3, 3], [1, 4]]) for (let i = 0; i < n; i++) ec.set(1 + i + (4 - n) / 2 | 0, y, 0, bl);
      T.eyeChart = mesh(ec, 1 / 12, { anchor: [0.5, 0, 0] });
    }
    // hardware: pegboard with tools + paint-can shelf
    { const peg = col(0xb89a70, { jitter: 0.3 }), iron = col(0x4a4a4e, {}), red = col(0xc83a2a, {}), m = new M(12, 18, 3);
      m.box(0, 0, 0, 12, 7, 3, woodD); m.box(0, 7, 0, 12, 8, 3, wood); m.box(0, 8, 0, 12, 18, 1, peg);
      for (let x = 1; x < 11; x += 2) for (let y = 9; y < 17; y += 2) m.set(x, y, 0, col(0x8a7050, {}));
      m.box(1, 13, 1, 2, 17, 2, woodL); m.box(0, 16, 1, 3, 17, 2, iron);                // hammer
      m.box(4, 10, 1, 5, 16, 2, silver); m.box(4, 15, 1, 5, 17, 2, red);               // saw-ish
      m.box(7, 12, 1, 8, 17, 2, red); m.box(7, 10, 1, 8, 12, 2, silver);               // screwdriver
      m.box(9, 9, 1, 11, 11, 2, iron); m.box(9, 14, 1, 11, 16, 2, col(0x3a6aa8, {}));  // pliers + wrench
      const pc = P([0xd8322a, 0x3a6aa8, 0xf0d040, 0xf4f2ec, 0x3a8a4a]); for (let x = 0; x < 12; x += 3) { m.box(x, 8, 1, x + 2, 10, 3, pc[(x / 3) % 5]); m.box(x, 10, 1, x + 2, 10, 3, silver); }
      for (let x = 1; x < 11; x += 3) m.box(x, 1, 2, x + 2, 6, 3, col(0x8a5a32, {}));
      T.hardware = mesh(m, 1 / 8, { anchor: [0.5, 0, 0] });
      const cans = new M(8, 5, 6); for (let i = 0; i < 6; i++) { const x = (i % 3) * 3, z = (i / 3 | 0) * 3; cans.box(x, 0, z, x + 2, 3, z + 2, pc[i % 5]); cans.box(x, 3, z, x + 2, 3, z + 2, silver); } cans.box(3, 3, 0, 5, 5, 2, pc[2]); T.paintCans = mesh(cans, 1 / 8);
    }
    // bakery: bread loaves on racks
    { const lf = P([0xc88040, 0xd8a060, 0xa86030, 0xe8c080]); const m = new M(12, 18, 3); shelfFrame(m, 12, 18, 3, woodL);
      for (const y of [1, 5, 9, 13]) m.box(1, y, 0, 11, y + 1, 3, woodL);
      for (const y of [2, 6, 10, 14]) for (let x = 1; x < 11; x += 3) { m.box(x, y, 1, x + 3 - (x > 8 ? 1 : 0), y + 2, 3, lf[(x + y) % 4]); m.box(x + 1, y + 2, 1, x + 2, y + 3, 3, lf[(x + y + 1) % 4]); }
      T.bakery = mesh(m, 1 / 8, { anchor: [0.5, 0, 0] });
    }
    // lamps: globe pendant + green enamel shade
    const globe = col(0xfff6e4, { emit: 0xffe8c0, emitK: 2.2, mode: 'always', jitter: 0 });
    { const m = new M(5, 8, 5); m.box(2, 5, 2, 3, 8, 3, brass); m.sphere(2.5, 2.5, 2.5, 2.6, globe); T.globeLamp = mesh(m, 1 / 8, { anchor: [0.5, 1, 0.5] }); }
    { const m = new M(6, 6, 6); m.box(2, 3, 2, 4, 6, 4, col(0x2a6a4a, {})); m.box(0, 1, 0, 6, 3, 6, col(0x2a6a4a, { jitter: 0.1 })); m.box(1, 0, 1, 5, 1, 5, globe); m.box(0, 3, 0, 6, 3, 6, 0); T.greenLamp = mesh(m, 1 / 8, { anchor: [0.5, 1, 0.5] }); }
  }
  { // ---- home variety pieces
    const V = G.vary = {};
    const ivory = col(0xf4efe0, { jitter: 0.05 }), ebony = col(0x1e1a18, { jitter: 0.1 }), piano = col(0x3a2418, { jitter: 0.2 });
    { const m = new M(12, 11, 5); m.box(0, 0, 0, 12, 10, 3, piano); m.box(0, 10, 0, 12, 11, 3, piano); m.box(0, 4, 3, 12, 5, 5, piano); m.box(1, 5, 3, 11, 6, 5, ivory); for (let x = 1; x < 11; x += 2) m.set(x, 6, 3, ebony); m.box(0, 0, 3, 1, 4, 5, piano); m.box(11, 0, 3, 12, 4, 5, piano); m.box(3, 6, 1, 9, 9, 2, col(0xd8c8a0, {})); m.box(9, 10, 1, 11, 11, 2, brass);
      V.piano = mesh(m, 1 / 8, { anchor: [0.5, 0, 0] }); }
    { const m = new M(5, 16, 5), wire = col(0xc9a24a, { solid: false }), bird = col(0xf0d040, {}); m.box(2, 0, 2, 3, 9, 3, brass); m.box(1, 0, 1, 4, 1, 4, brass);
      for (let y = 9; y < 15; y++) for (let x = 0; x < 5; x++) for (let z = 0; z < 5; z++) if ((x === 0 || x === 4 || z === 0 || z === 4) && (x + z) % 2 === 0) m.set(x, y, z, wire);
      m.box(0, 9, 0, 5, 10, 5, brass); m.box(1, 15, 1, 4, 16, 4, brass); m.set(2, 11, 2, bird); m.set(2, 12, 2, bird); m.set(3, 12, 2, col(0xe87a2a, {}));
      V.birdcage = mesh(m, 1 / 8); }
    { const m = new M(12, 8, 6), cloth = col(0xf4f0e6, { jitter: 0.03 }), plate = col(0xffffff, { jitter: 0 }), food = col(0xc8783a, {}), cand = col(0xffd070, { emit: 0xffb040, emitK: 2.5, mode: 'always', jitter: 0 });
      for (const [x, z] of [[0, 0], [11, 0], [0, 5], [11, 5]]) m.box(x, 0, z, x + 1, 5, z + 1, wood); m.box(0, 5, 0, 12, 6, 6, cloth); m.box(0, 4, 0, 12, 5, 1, cloth); m.box(0, 4, 5, 12, 5, 6, cloth);
      for (const [x, z] of [[2, 1], [9, 1], [2, 4], [9, 4]]) { m.set(x, 6, z, plate); m.set(x + 1, 6, z, plate); } m.box(5, 6, 2, 7, 7, 4, food); m.set(4, 6, 3, brass); m.set(4, 7, 3, cand); m.set(8, 6, 2, col(0xa8c8e0, { glass: true }));
      V.dinner = mesh(m, 1 / 8); }
    { const m = new M(6, 7, 10), crib = col(0xf4f0e6, { jitter: 0.05 }), blanket = col(0xa8c8e8, {}); m.box(0, 0, 0, 6, 1, 10, crib); for (let z = 0; z < 10; z += 2) { m.box(0, 1, z, 1, 6, z + 1, crib); m.box(5, 1, z, 6, 6, z + 1, crib); } m.box(0, 6, 0, 6, 7, 10, crib); m.box(1, 6, 1, 5, 7, 9, 0); m.box(0, 1, 0, 6, 7, 1, crib); m.box(0, 1, 9, 6, 7, 10, crib); m.box(1, 2, 1, 5, 3, 9, blanket); m.box(2, 3, 2, 4, 4, 3, col(0xf8e8e0, {}));
      V.crib = mesh(m, 1 / 8); }
    { const m = new M(12, 6, 8), tc = col(0x4a6a9a, { jitter: 0.2 }); m.box(0, 0, 0, 8, 4, 4, tc); m.box(0, 4, 0, 8, 5, 4, col(0xd8a040, {})); const bl = [0xd8322a, 0x3a6aa8, 0xf0d040, 0x3a8a4a].map((h) => col(h, {}));
      m.box(9, 0, 1, 11, 2, 3, bl[0]); m.box(9, 2, 1, 11, 4, 3, bl[1]); m.box(1, 0, 5, 3, 2, 7, bl[2]); m.box(4, 0, 5, 6, 2, 7, bl[3]); m.box(4, 2, 5, 6, 4, 7, bl[0]); m.set(10, 4, 2, bl[2]);
      m.box(8, 0, 5, 12, 2, 8, col(0x8a5a32, {})); m.box(9, 2, 6, 11, 5, 7, col(0xd8b890, {})); m.set(9, 5, 6, col(0x6a4a2a, {})); m.set(10, 5, 6, col(0x6a4a2a, {}));
      V.toys = mesh(m, 1 / 8); }
    { const bookC = [0x8a2a2a, 0x2f4a6a, 0x3f6a3a, 0xc9a24a, 0x6a3a6a, 0xd9d0b8, 0x9a5a2a, 0x2a2a2a].map((h) => col(h, { jitter: 0.3 })); const m = new M(10, 16, 3);
      m.box(0, 0, 0, 10, 16, 3, wood); m.box(1, 1, 1, 9, 15, 3, 0); for (const y of [5, 10]) m.box(1, y, 0, 9, y + 1, 3, wood);
      for (const y0 of [1, 6, 11]) for (let x = 1; x < 9; x++) { if ((x + y0) % 6 === 5) continue; m.box(x, y0, 1, x + 1, y0 + 3 + ((x * 7 + y0) % 2), 3, bookC[(x * 3 + y0) % 8]); }
      V.books = mesh(m, 1 / 8, { anchor: [0.5, 0, 0] }); }
    { const m = new M(5, 7, 1), pg = col(0xf4f0e6, {}), red = col(0xc8322a, {}), gr = col(0x9a9a9a, {}); m.box(0, 0, 0, 5, 7, 1, pg); m.box(0, 5, 0, 5, 7, 1, red); for (let y = 1; y < 5; y++) for (let x = 0; x < 5; x += 2) m.set(x, y, 0, gr); V.calendar = mesh(m, 1 / 12, { anchor: [0.5, 0, 0] }); }
    { const m = new M(9, 4, 1), fr = col(0x2a2622, {}), sep = [col(0xc8b090, {}), col(0x8a7a60, {}), col(0xe0d0b0, {})]; for (let i = 0; i < 3; i++) { m.box(i * 3, (i % 2), 0, i * 3 + 2, (i % 2) + 3, 1, fr); m.set(i * 3, (i % 2) + 1, 0, sep[i]); m.set(i * 3 + 1, (i % 2) + 1, 0, sep[(i + 1) % 3]); } V.photos = mesh(m, 1 / 8, { anchor: [0.5, 0, 0] }); }
  }
  { // ---- v2 household archetypes: signature pieces (dock worker, widow, musician, artist, sea captain, young couple)
    const A = G.arch = {}, brassA = col(0xc9a24a, { jitter: 0.1, metal: 0.8, rough: 0.35 });
    { const m = new M(20, 20, 2), wd = col(0x8a5a2a, { jitter: 0.2 });   // ship's wheel
      for (let x = 0; x < 20; x++) for (let y = 0; y < 20; y++) { const d = Math.hypot(x - 9.5, y - 9.5); if ((d > 6.2 && d < 7.6) || d < 1.6) m.set(x, y, 0, wd); }
      for (let a = 0; a < 8; a++) { const ca = Math.cos(a * Math.PI / 4), sa = Math.sin(a * Math.PI / 4); for (let r = 1; r < 10.5; r += 0.5) m.set(Math.round(9.5 + ca * r), Math.round(9.5 + sa * r), 0, wd); }
      m.box(8, 8, 1, 12, 12, 2, brassA); A.wheel = mesh(m, 1 / 16, { anchor: [0.5, 0, 0] }); }
    { const m = new M(8, 14, 1), bd = col(0x5a3a22, {}), face = col(0xf4efe0, {}); m.box(1, 0, 0, 7, 14, 1, bd); for (let x = 0; x < 8; x++) for (let y = 5; y < 13; y++) { const d = Math.hypot(x - 3.5, y - 8.5); if (d < 3.9) m.set(x, y, 0, d > 3 ? brassA : face); } m.set(4, 9, 0, col(0x1a1a1a, {})); m.set(5, 10, 0, col(0x1a1a1a, {})); m.box(3, 1, 0, 5, 4, 0 + 1, brassA); A.barometer = mesh(m, 1 / 16, { anchor: [0.5, 0, 0] }); }
    { const m = new M(14, 7, 5), gl = col(0xb8d8c8, { glass: true, jitter: 0 }), stand = col(0x5a3a22, {}); m.box(2, 0, 1, 12, 1, 4, stand); for (let x = 1; x < 12; x++) for (let y = 1; y < 6; y++) for (let z = 0; z < 5; z++) if (Math.hypot(y - 3.5, z - 2) < 2.3 && (Math.hypot(y - 3.5, z - 2) > 1.4 || x === 1 || x === 11)) m.set(x, y, z, gl); m.box(12, 3, 2, 14, 4, 3, col(0x8a6a4a, {})); m.box(4, 2, 2, 9, 3, 3, col(0x6a3a22, {})); m.box(6, 3, 2, 7, 5, 3, col(0xf4f0e6, {})); m.set(5, 4, 2, col(0xf4f0e6, {})); A.bottle = mesh(m, 1 / 16); }
    { const m = new M(4, 15, 4), pole = col(0x4e3220, {}), coat = col(0x1e2a44, { jitter: 0.15 }), cap = col(0x5a5046, { jitter: 0.2 }), pail = col(0x7a8084, { jitter: 0.2 }); m.box(1, 0, 1, 3, 1, 3, pole); m.box(1, 0, 1, 2, 14, 2, pole); m.box(0, 5, 0, 4, 12, 3, coat); m.box(0, 13, 0, 3, 14, 3, cap); m.box(0, 14, 0, 3, 15, 3, cap); m.box(2, 0, 3, 4, 2, 4, pail); A.coatRack = mesh(m, 1 / 8); }
    { const m = new M(8, 14, 6), leg = col(0x8a6a4a, {}), cv = col(0xf4efe0, {}); m.line(1, 0, 4, 3, 13, 2, leg); m.line(6, 0, 4, 4, 13, 2, leg); m.line(4, 0, 0, 4, 11, 2, leg); m.box(0, 4, 3, 8, 5, 4, leg);
      m.box(0, 5, 3, 8, 12, 4, cv); m.box(1, 9, 4, 7, 11, 4 + 0, col(0x8ab8d8, {})); m.box(1, 6, 4, 7, 9, 4, col(0x5a8a4a, {})); m.box(4, 7, 4, 6, 10, 4, col(0xd8743a, {})); m.set(2, 10, 4, col(0xf0d060, {}));
      A.easel = mesh(m, 1 / 8); }
    { const m = new M(10, 7, 8), wick = col(0xb8905a, { jitter: 0.3 }), yarn = [0xc83a4a, 0x3a6aa8, 0xe8c050, 0x6a9a5a].map((h) => col(h, { jitter: 0.2 })); m.box(0, 0, 0, 10, 4, 8, wick); m.box(1, 1, 1, 9, 4, 7, 0); m.box(1, 3, 1, 9, 4, 7, yarn[0]); m.box(2, 4, 2, 4, 6, 4, yarn[1]); m.box(5, 4, 3, 7, 6, 5, yarn[2]); m.box(3, 4, 5, 5, 5, 7, yarn[3]); m.line(6, 4, 2, 9, 7, 1, col(0xd8d8d8, {})); A.basket = mesh(m, 1 / 16); }
    { const m = new M(8, 14, 10), wd = col(0x6a3a22, { jitter: 0.2 }), horn = col(0xc9a24a, { metal: 0.8, rough: 0.35 }); for (const [x, z] of [[1, 1], [6, 1], [1, 8], [6, 8]]) m.box(x, 0, z, x + 1, 5, z + 1, wd); m.box(0, 5, 0, 8, 6, 10, wd); m.box(1, 6, 2, 7, 9, 8, wd); m.box(2, 9, 3, 6, 10, 7, col(0x1a1a1a, {})); m.box(3, 10, 5, 4, 12, 6, horn);
      for (let i = 0; i < 4; i++) m.box(3 - i, 11 + i, 5 - i - 1, 5 + i, 12 + i, 5 - i, horn); A.gramophone = mesh(m, 1 / 8); }
    { const m = new M(6, 8, 12), body = col(0x2a3a5a, { jitter: 0.1 }), wh = col(0x1a1a1a, {}), ch = col(0xc8ccd0, {}); m.box(0, 3, 1, 6, 6, 10, body); m.box(1, 4, 2, 5, 6, 9, col(0xf4efe6, {})); for (let y = 6; y < 8; y++) m.box(0, y, 1, 6, y + 1, 4 - (y - 6), body); m.line(3, 6, 10, 3, 8, 12, ch); m.box(0, 8, 11, 6, 8, 12, ch);
      for (const z of [2, 9]) for (const x of [0, 5]) m.box(x, 0, z - 1, x + 1, 3, z + 2, wh); A.pram = mesh(m, 1 / 8); }
  }
  // ---- exterior props
  { // rooftop water tank on legs (wood staves, conical cap)
    const stave = col(0x8a6a4a, { jitter: 0.35, edge: 0.3 }), staveD = col(0x6a4e36, { jitter: 0.35 }), hoop = col(0x2a2826, {}), cap = col(0x4a3a2e, { jitter: 0.3 }), leg = col(0x3a3634, {});
    const m = new M(20, 40, 20);
    for (const [x, z] of [[3, 3], [16, 3], [3, 16], [16, 16]]) m.box(x, 0, z, x + 1, 13, z + 1, leg);
    m.line(3, 2, 3, 16, 11, 3, leg); m.line(3, 2, 16, 16, 11, 16, leg); m.line(3, 11, 3, 3, 2, 16, leg); m.line(16, 11, 3, 16, 2, 16, leg);
    m.box(1, 12, 1, 19, 13, 19, leg);
    for (let x = 0; x < 20; x++) for (let z = 0; z < 20; z++) {
      const d = Math.hypot(x + 0.5 - 10, z + 0.5 - 10);
      if (d <= 9.5) for (let y = 13; y < 32; y++) { if (d > 8.4 || y === 13) m.set(x, y, z, (y === 16 || y === 23 || y === 29) ? hoop : ((x + z) % 3 === 0 ? staveD : stave)); }
      for (let y = 32; y < 40; y++) { const r = 10 - (y - 32) * 1.3; if (d <= r) m.set(x, y, z, cap); }
    }
    m.box(10, 13, 19, 11, 30, 20, col(0x5a5a5a, {}));
    G.waterTank = mesh(m, 1 / 8);
  }
  { // chimney pot set
    const m = new M(6, 4, 3); const pot = col(0xb86a48, { jitter: 0.3 });
    m.box(0, 0, 0, 2, 4, 2, pot); m.box(3, 0, 0, 5, 3, 2, pot);
    G.pots = mesh(m, 1 / 8);
    const clay = [col(0xb86a48, { jitter: 0.3 }), col(0xa85a3a, { jitter: 0.3 }), col(0x8a8680, { jitter: 0.3 }), col(0xc88a60, { jitter: 0.3 })], rim = col(0x6a4a3a, {});
    const spots = { 2: [[0, 2], [4, 2]], 3: [[0, 2], [2, 2], [4, 2]], 4: [[0, 0], [4, 0], [0, 4], [4, 4]] };
    G.potsN = [2, 3, 4].map((n) => { const p = new M(6, 6, 6); spots[n].forEach(([x, z], i) => { const hh = 3 + ((i * 2 + n) % 3); p.box(x, 0, z, x + 2, hh, z + 2, clay[(i + n) % 4]); p.box(x, hh - 1, z, x + 2, hh, z + 2, rim); }); return mesh(p, 1 / 8); });
    // radio aerial: two masts + a sagging wire, 6 m along z (1/16)
    const a = new M(3, 36, 96), ir = col(0x2a2c2e, {}), wire = col(0x3a3a3a, { solid: false });
    for (const z of [1, 94]) { a.box(1, 0, z, 2, 34, z + 1, ir); a.box(0, 32, z, 3, 33, z + 1, ir); }
    for (let z = 1; z < 95; z++) { const t = (z - 1) / 93, y = Math.round(33 - Math.sin(t * Math.PI) * 4); a.set(1, y, z, wire); }
    a.line(1, 33, 50, 1, 8, 50, wire);
    G.aerial = mesh(a, 1 / 16);
    // flower pot pair + kid's scooter
    const fp = new M(6, 7, 3), terra = col(0xc06a40, { jitter: 0.3 }), fl = [col(0xe84a5a, { solid: false }), col(0xf0d040, { solid: false }), col(0xf4f0f0, { solid: false })], lf = col(0x4f7a32, { jitter: 0.5, solid: false });
    for (const x of [0, 4]) { fp.box(x, 0, 0, x + 2, 2, 2, terra); fp.box(x, 2, 0, x + 2, 4, 2, lf); fp.set(x, 4, 0, fl[x % 3]); fp.set(x + 1, 5, 1, fl[(x + 1) % 3]); fp.set(x, 4, 1, fl[(x + 2) % 3]); }
    G.flowerPots = mesh(fp, 1 / 8);
    const sc = new M(2, 12, 12), red2 = col(0xc8322a, {}), blk = col(0x222222, {});
    sc.box(0, 1, 2, 2, 2, 10, red2); sc.box(0, 0, 1, 2, 2, 3, blk); sc.box(0, 0, 9, 2, 2, 11, blk); sc.line(1, 2, 9, 1, 11, 10, red2); sc.box(0, 11, 10, 2, 12, 11, blk);
    G.scooter = mesh(sc, 1 / 12);
    // unlit pendant for dark homes
    const m2 = new M(4, 5, 4); m2.box(1, 3, 1, 3, 5, 3, brass); m2.box(0, 0, 0, 4, 3, 4, col(0xe8dcc0, { jitter: 0.05 })); G.hangLampOff = mesh(m2, 1 / 8, { anchor: [0.5, 1, 0.5] });
  }
  { // trash cans (galvanised), milk bottles, window box, bicycle, wagon, hopscotch chalk
    const galv = col(0x9aa0a4, { jitter: 0.2, edge: 0.3 }), galvD = col(0x7a8084, { jitter: 0.2 });
    const m = new M(5, 7, 5); m.box(0, 0, 0, 5, 6, 5, galv); for (const y of [1, 4]) m.box(0, y, 0, 5, y + 1, 5, galvD); m.box(0, 6, 0, 5, 7, 5, galvD); m.set(2, 6, 2, galv);
    for (const [x, z] of [[0, 0], [4, 0], [0, 4], [4, 4]]) m.set(x, 6, z, 0);
    G.trash = mesh(m, 1 / 8);
    const mb = new M(6, 5, 2); const glassW = col(0xf4f4f0, { jitter: 0 }), capC = col(0xd8b030, {});
    for (const x of [0, 2, 4]) { m; mb.box(x, 0, 0, x + 1, 4, 1, glassW); mb.set(x, 4, 0, capC); }
    G.milk = mesh(mb, 1 / 16);
    const fl = [0xd83a4a, 0xf0d040, 0xf4f0f0, 0xe87a2a, 0x9a4ac8].map((h) => col(h, { jitter: 0.3, solid: false })), lf = col(0x4f7a32, { jitter: 0.5, solid: false }), boxW = col(0x5a3a22, {});
    G.windowBox = [0, 1, 2].map((s) => { const b = new M(16, 6, 4); b.box(0, 0, 0, 16, 3, 4, boxW); for (let x = 0; x < 16; x++) { b.set(x, 3, 1 + (x % 2), lf); if ((x + s) % 2 === 0) b.set(x, 4, 1 + ((x + s) % 3 === 0 ? 1 : 2), fl[(x + s * 2) % 5]); if ((x * 3 + s) % 5 === 0) b.set(x, 5, 2, fl[(x + s) % 5]); } return mesh(b, 1 / 16, { anchor: [0.5, 0, 0] }); });
    G.bike = [0xc8322a, 0x3a6aa8, 0x3a8a5a].map((hx) => {
      const f = col(hx, { jitter: 0.1 }), t = col(0x2a2a2a, {}), ch = col(0xc8ccd0, {});
      const b = new M(3, 16, 30);
      for (const cz of [6, 23]) for (let y = 0; y < 13; y++) for (let z = cz - 7; z <= cz + 7; z++) { const d = Math.hypot(y + 0.5 - 6.5, z + 0.5 - cz); if (d > 5.2 && d < 6.6) b.set(1, y, z, t); else if (d < 1.2) b.set(1, y, z, ch); }
      b.line(1, 6, 6, 1, 12, 12, f); b.line(1, 6, 23, 1, 12, 20, f); b.line(1, 12, 12, 1, 12, 20, f); b.line(1, 6, 13, 1, 12, 12, f); b.line(1, 6, 13, 1, 6, 6, f);
      b.box(1, 13, 11, 2, 14, 14, col(0x3a2a22, {})); b.box(0, 14, 20, 3, 15, 21, ch); b.set(1, 13, 20, ch);
      return mesh(b, 1 / 16);
    });
    const wg = new M(10, 10, 18); const red = col(0xc8322a, { jitter: 0.1 });
    wg.box(0, 3, 2, 10, 7, 16, red); wg.box(1, 4, 3, 9, 7, 15, 0); for (const z of [3, 14]) for (const x of [0, 9]) wg.box(x, 0, z - 1, x + 1, 3, z + 2, blackI);
    wg.line(5, 5, 16, 5, 9, 18, blackI);
    G.wagon = mesh(wg, 1 / 16);
  }
  { // wooden shed 2.5 x 2 m (voxel-ish at 1/8)
    G.shed = [0x6a7a5a, 0x8a5a3a, 0x5a6a7a].map((h) => {
      const wal = col(h, { jitter: 0.35, edge: 0.4 }), rf = col(0x3a3634, { jitter: 0.3 }), trim = col(0xe8e0d0, {});
      const m = new M(20, 20, 16);
      m.box(0, 0, 0, 20, 16, 16, wal); m.box(1, 0, 1, 19, 16, 15, 0);
      for (let x = 0; x < 20; x += 3) m.box(x, 0, 15, x + 1, 16, 16, col(new THREE.Color(h).multiplyScalar(0.85).getHex(), { jitter: 0.3 }));
      m.box(7, 0, 15, 13, 13, 16, col(0x5a3a22, {})); m.box(6, 13, 15, 14, 14, 16, trim);
      for (let z = -1; z < 17; z++) { const y = 16 + Math.floor((16 - Math.abs(z * 2 - 15)) / 4); m.box(0, 16, z, 20, Math.min(20, y), z + 1, rf); }
      m.box(2, 8, 0, 5, 11, 1, col(0x3a4652, {}));
      return mesh(m, 1 / 8);
    });
  }
  { // garden plot plants (tomatoes on stakes + cabbages)
    const g1 = col(0x4f8a3a, { jitter: 0.6, solid: false }), g2 = col(0x6aa04a, { jitter: 0.6, solid: false }), tom = col(0xd8322a, { solid: false }), stake = col(0xa8885a, { solid: false }), cab = col(0x9ac87a, { jitter: 0.5, solid: false });
    const m = new M(32, 12, 6);
    for (let i = 0; i < 5; i++) { const x = 3 + i * 6.5; m.box(x, 0, 2, x + 1, 12, 3, stake); m.sphere(x, 6, 2.5, 3, 0, (xx, yy, zz) => ((xx * 7 + yy * 3 + zz) % 7 === 0) ? tom : ((xx + yy) % 2 ? g1 : g2)); }
    G.tomatoes = mesh(m, 1 / 16);
    const c = new M(32, 5, 6); for (let i = 0; i < 6; i++) c.sphere(2.7 + i * 5.3, 1.5, 3, 2.6, 0, (xx, yy) => yy === 0 ? g1 : cab);
    G.cabbages = mesh(c, 1 / 16);
  }
  { // bench (park)
    const slat = col(0x3a6a4a, { jitter: 0.2 }), ironC = blackI;
    const m = new M(16, 7, 5); for (const x of [1, 14]) { m.box(x, 0, 0, x + 1, 3, 4, ironC); m.box(x, 3, 3, x + 1, 7, 5, ironC); }
    m.box(0, 3, 0, 16, 4, 4, slat); m.box(0, 5, 4, 16, 7, 5, slat);
    G.bench = mesh(m, 1 / 8);
  }
  { // pigeon coop (roof) 3 x 2 m
    const wal = col(0xd8d0bc, { jitter: 0.3 }), wire = col(0x6a6a6a, { solid: false }), rf = col(0x5a3a2a, {});
    const m = new M(24, 16, 16);
    for (const [x, z] of [[0, 0], [23, 0], [0, 15], [23, 15]]) m.box(x, 0, z, x + 1, 5, z + 1, col(0x5a4a3a, {}));
    m.box(0, 5, 0, 24, 13, 16, wal); m.box(1, 6, 1, 23, 13, 15, 0);
    for (let x = 1; x < 23; x += 2) m.box(x, 6, 15, x + 1, 13, 16, wire);
    m.box(0, 6, 15, 24, 7, 16, wal);
    for (let x = 3; x < 22; x += 4) m.box(x, 9, 0, x + 2, 11, 1, 0);
    m.box(-1, 13, -1, 25, 14, 17, rf); m.box(2, 14, 2, 22, 15, 14, rf); m.box(6, 15, 5, 18, 16, 11, rf);
    G.coop = mesh(m, 1 / 8);
  }
  return G;
};

// ---------------------------------------------------------------- fire escape (front of tenements), cached per (storeys)
const FE = new Map();
RK.fireEscape = (n, sh) => {
  const key = n + '|' + sh; if (FE.has(key)) return FE.get(key);
  const col = AF.col, ir = col(0x26282a, { jitter: 0.1, edge: 0.2 }), irL = col(0x3a3c3e, { jitter: 0.1 });
  const S = Math.round(sh * 8);                 // storey in 1/8 voxels
  const W = 32, D = 10, H = (n - 1) * S + 10;   // platforms at storeys 2..n; bottom = storey-2 floor minus hanging ladder
  const m = new AF.Model(W, H + 2, D);
  const pl = (s) => (s - 2) * S + 2;            // platform y (voxels) for storey s (relative: storey 2 at 2)
  for (let s = 2; s <= n; s++) {
    const y = pl(s);
    m.box(0, y, 0, W, y + 1, D, irL);                       // grating
    for (let x = 0; x < W; x += 2) m.set(x, y, 5, ir);
    m.box(0, y + 7, 0, W, y + 8, 1, ir); m.box(0, y + 4, 0, W, y + 5, 1, ir);   // rails (front)
    m.box(0, y + 1, 0, 1, y + 8, D, ir); m.box(W - 1, y + 1, 0, W, y + 8, D, ir); // end rails
    for (let x = 0; x < W; x += 4) m.box(x, y + 1, 0, x + 1, y + 7, 1, ir);
    m.box(0, y + 7, 0, 1, y + 8, D, ir); m.box(W - 1, y + 7, 0, W, y + 8, D, ir);
    // brackets under the platform
    for (const x of [1, W - 2]) m.line(x, y - 3, D - 1, x, y, 1, ir);
    // stair down to the storey below (alternating direction)
    if (s > 2) {
      const yb = pl(s - 1), dir = s % 2;
      const xa = dir ? 3 : W - 4, xb = dir ? W - 10 : 9;
      for (let t = 0; t <= S; t++) { const x = Math.round(xa + (xb - xa) * t / S); m.box(x, yb + t, 2, x + 1, yb + t + 1, 7, irL); if (t % 2 === 0) m.set(x, yb + t + 6, 2, ir); }
    }
  }
  // drop ladder hanging from the storey-2 platform
  for (let y = 0; y < 2; y++) m.set(4, y, 3, ir);
  for (let y = 0; y < pl(2); y++) { m.set(3, y, 3, ir); m.set(6, y, 3, ir); if (y % 2 === 0) m.box(3, y, 3, 7, y + 1, 4, ir); }
  const g = AF.meshModel(m, { vs: 1 / 8, anchor: [0.5, 0, 0] });
  FE.set(key, g);
  return g;
};

// ---------------------------------------------------------------- sign on a board (1/16 text)
const SIGNS = new Map();
RK.sign = (text, fg, bg) => {
  const k = text + '|' + fg + '|' + bg; if (SIGNS.has(k)) return SIGNS.get(k);
  const m = AF.textModel(text, fg, { bg, pad: 2, depth: 1, bold: true });
  const g = AF.meshModel(m, { vs: 1 / 16, anchor: [0.5, 0, 0] });
  SIGNS.set(k, g); return g;
};

// ---------------------------------------------------------------- awning (1/8, protrudes along +z of the model)
const AW = new Map();
RK.awning = (w, ci) => {   // w in metres
  const k = w + '|' + ci; if (AW.has(k)) return AW.get(k);
  const C = RK.colours(), [a, b] = C.awning[ci % C.awning.length];
  const W = Math.round(w * 8), m = new AF.Model(W, 8, 12);
  for (let z = 0; z < 12; z++) { const y = 7 - Math.floor(z / 2); for (let x = 0; x < W; x++) m.set(x, y, z, ((x >> 2) & 1) ? a : b); }
  for (let x = 0; x < W; x++) { m.set(x, 1, 11, ((x >> 2) & 1) ? a : b); m.set(x, 0, 11, (x & 3) === 1 ? ((x >> 2) & 1 ? a : b) : 0); }
  for (const x of [0, W - 1]) for (let z = 0; z < 12; z++) m.set(x, 7 - Math.floor(z / 2), z, a);
  const g = AF.meshModel(m, { vs: 1 / 8, anchor: [0.5, 0, 0] });
  AW.set(k, g); return g;
};

// ---------------------------------------------------------------- v2 WINDOW KIT: painted sash frame, 2-over-2 muntins, a blind at a random height or lace (1/16)
// sh: 0 none · 1 blind 1/4 · 2 blind 1/2 · 3 blind 3/4 · 4 lace curtains · 5 green blind 1/3 ; lit = the pane behind glows at night (the blind glows too)
const SA = new Map();
RK.sash = (ww, wh, fi, sh, lit) => {
  const k = [ww, wh, fi, sh, lit ? 1 : 0].join('|'); if (SA.has(k)) return SA.get(k);
  const C = RK.colours(), col = AF.col, fr = C.sashF[fi % C.sashF.length];
  const W = Math.round(ww * 16), Hh = Math.round(wh * 16), m = new AF.Model(W, Hh, 1);
  const blind = sh === 5 ? col(0x3e5e3e, { jitter: 0.08, edge: 0, emit: lit ? 0x9ac080 : undefined, emitK: lit ? 0.35 : undefined, mode: lit ? 'night' : undefined })
    : col(0xe8dab0, { jitter: 0.06, edge: 0, emit: lit ? 0xffc070 : undefined, emitK: lit ? 1.1 : undefined, mode: lit ? 'night' : undefined });
  const lace = col(0xf6f2ea, { jitter: 0.04, edge: 0, solid: false, emit: lit ? 0xffd8a0 : undefined, emitK: lit ? 0.9 : undefined, mode: lit ? 'night' : undefined });
  const mid = Hh >> 1;
  if (sh >= 1 && sh <= 3 || sh === 5) { const d = sh === 5 ? Math.round(Hh / 3) : Math.round(Hh * sh / 4); m.box(1, Hh - 1 - d, 0, W - 1, Hh - 1, 1, blind); m.set(W >> 1, Hh - 2 - d, 0, fr); }
  if (sh === 4) for (let y = 1; y < Hh - 1; y++) for (let x = 1; x < W - 1; x++) { const edgeX = Math.min(x, W - 1 - x); const drape = y > mid - 2 ? edgeX < 4 + ((y >> 1) & 1) : edgeX < 3; if (drape || (y > mid - 2 && y < mid + 3 && (x + y) % 2 === 0)) m.set(x, y, 0, lace); }
  m.box(0, 0, 0, W, 1, 1, fr); m.box(0, Hh - 1, 0, W, Hh, 1, fr); m.box(0, 0, 0, 1, Hh, 1, fr); m.box(W - 1, 0, 0, W, Hh, 1, fr);
  m.box(0, mid - 1, 0, W, mid + 1, 1, fr);                // meeting rail
  m.box(W >> 1, 0, 0, (W >> 1) + 1, Hh, 1, fr);           // one muntin per sash = 2-over-2
  const g = AF.meshModel(m, { vs: 1 / 16, anchor: [0.5, 0, 0.5] });
  SA.set(k, g); return g;
};
// a neighbour leaning on a cushion in an open window (arms folded on the sill)
let LEAN = null;
RK.leaners = () => {
  if (LEAN) return LEAN;
  const col = AF.col;
  const skins = [0xe8b896, 0xc89070, 0x8a5a3c, 0xf0c8a8], hairs = [0x2a1e16, 0x6a3a1e, 0xb8b0a0, 0x8a5a2a, 0x1a1a1a], tops = [0xc84a3a, 0x3a6aa8, 0xf0e8d8, 0x6a8a4a, 0xd8a0b0, 0x5a4a6a];
  LEAN = [0, 1, 2, 3, 4, 5].map((i) => {
    const sk = col(skins[i % 4], { jitter: 0.05, edge: 0.1 }), hr = col(hairs[(i * 3) % 5], { jitter: 0.1 }), tp = col(tops[i], { jitter: 0.1 }), cu = col([0xc8322a, 0xe8c050, 0x3a6aa8][i % 3], { jitter: 0.1 });
    const m = new AF.Model(12, 16, 6);
    m.box(1, 0, 3, 11, 2, 6, cu);                    // cushion on the sill
    m.box(2, 2, 2, 10, 10, 5, tp);                   // shoulders + chest
    m.box(1, 2, 4, 11, 4, 6, tp); m.box(2, 2, 5, 4, 3, 6, sk); m.box(8, 2, 5, 10, 3, 6, sk);   // folded arms, hands
    m.box(4, 10, 2, 8, 15, 5, sk); m.box(4, 13, 1, 8, 16, 5, hr); m.box(3, 12, 1, 4, 15, 4, hr); m.box(8, 12, 1, 9, 15, 4, hr);
    if (i % 2) { m.box(3, 15, 1, 9, 16, 5, hr); m.set(5, 12, 5, col(0x2a2a2a, {})); m.set(6, 12, 5, col(0x2a2a2a, {})); }
    else { m.set(5, 12, 5, col(0x2a2a2a, {})); m.set(6, 12, 5, col(0x2a2a2a, {})); m.set(5, 11, 5, col(0xb85a5a, {})); }
    return AF.meshModel(m, { vs: 1 / 16, anchor: [0.5, 0, 0.5] });
  });
  return LEAN;
};
// autumn stoop dressing: pumpkins, a jack-o'-lantern (glows at night), potted mums
let AUT = null;
RK.autumn = () => {
  if (AUT) return AUT;
  const col = AF.col, M = AF.Model;
  const or = col(0xd8741e, { jitter: 0.15, edge: 0.3 }), orD = col(0xb85a16, { jitter: 0.15 }), stem = col(0x5a4a22, {}), face = col(0x2a1a0a, { emit: 0xff9a30, emitK: 2.6, mode: 'night', jitter: 0 });
  const terra = col(0xb8643e, { jitter: 0.25 }), leaf = col(0x3f6a2e, { jitter: 0.4, solid: false });
  const mumC = [0xe8b020, 0xb8482a, 0x8a4a9a, 0xf0e8d8, 0xd87a2a].map((h) => col(h, { jitter: 0.3, solid: false }));
  const pumpkin = (m, cx, cz, r, jack) => { for (let x = -r; x <= r; x++) for (let y = 0; y <= r * 1.5; y++) for (let z = -r; z <= r; z++) { const d = (x * x + z * z) / (r * r) + ((y - r * 0.75) * (y - r * 0.75)) / (r * r * 0.56); if (d <= 1.05) m.set(cx + x, y, cz + z, (x + z + 64) % 3 === 0 ? orD : or); } m.set(cx, Math.round(r * 1.5) + 1, cz, stem);
    if (jack) { const fz = cz + r; m.set(cx - 2, Math.round(r * 0.9), fz, face); m.set(cx + 2, Math.round(r * 0.9), fz, face); for (let x = -2; x <= 2; x++) m.set(cx + x, Math.round(r * 0.45), fz, face); } };
  const mum = (m, cx, cz, c) => { m.box(cx - 2, 0, cz - 2, cx + 3, 4, cz + 3, terra); for (let x = -3; x <= 3; x++) for (let y = 4; y <= 7; y++) for (let z = -3; z <= 3; z++) if (x * x + z * z + (y - 4) * (y - 4) * 1.4 <= 11) m.set(cx + x, y, cz + z, (x + y + z + 64) % 5 === 0 ? leaf : c); };
  AUT = [];
  { const m = new M(14, 8, 8); pumpkin(m, 4, 4, 4, false); pumpkin(m, 11, 4, 2, false); AUT.push(AF.meshModel(m, { vs: 1 / 16, anchor: [0.5, 0, 0.5] })); }
  { const m = new M(10, 9, 10); pumpkin(m, 5, 5, 4, true); AUT.push(AF.meshModel(m, { vs: 1 / 16, anchor: [0.5, 0, 0.5] })); }
  { const m = new M(18, 9, 8); mum(m, 4, 4, mumC[0]); pumpkin(m, 12, 4, 3, false); AUT.push(AF.meshModel(m, { vs: 1 / 16, anchor: [0.5, 0, 0.5] })); }
  { const m = new M(8, 9, 8); mum(m, 4, 4, mumC[1]); AUT.push(AF.meshModel(m, { vs: 1 / 16, anchor: [0.5, 0, 0.5] })); }
  { const m = new M(18, 9, 8); mum(m, 4, 4, mumC[2]); mum(m, 13, 4, mumC[3]); AUT.push(AF.meshModel(m, { vs: 1 / 16, anchor: [0.5, 0, 0.5] })); }
  { const m = new M(18, 10, 10); pumpkin(m, 5, 5, 4, true); mum(m, 13, 5, mumC[4]); AUT.push(AF.meshModel(m, { vs: 1 / 16, anchor: [0.5, 0, 0.5] })); }
  return AUT;
};
// tar-beach sunbather on a striped towel + a deck chair with a newspaper
let SUN = null;
RK.sunbather = () => {
  if (SUN) return SUN;
  const col = AF.col, m = new AF.Model(12, 5, 30);
  const tw = [col(0xe8c050, { jitter: 0.05 }), col(0xf4f0e6, { jitter: 0.05 })], sk = col(0xe0a888, { jitter: 0.05 }), suit = col(0x2a4a8a, {}), hr = col(0x6a3a1e, {});
  for (let z = 0; z < 30; z++) for (let x = 0; x < 12; x++) m.set(x, 0, z, tw[(z >> 2) & 1]);
  m.box(4, 1, 3, 8, 3, 8, sk); m.box(4, 1, 3, 8, 2, 4, hr); m.box(3, 1, 8, 9, 3, 16, suit); m.box(4, 1, 16, 8, 2, 26, sk); m.box(1, 1, 9, 3, 2, 15, sk); m.box(9, 1, 9, 11, 2, 15, sk);
  m.box(8, 1, 1, 11, 2, 3, col(0xc8322a, {}));
  SUN = AF.meshModel(m, { vs: 1 / 16, anchor: [0.5, 0, 0.5] });
  return SUN;
};
// big painted sign (1/8 letters, 0.875 m) for rooftop billboards readable from the air
const SIGNB = new Map();
RK.signBig = (text, fg, bg) => {
  const k = text + '|' + fg + '|' + bg; if (SIGNB.has(k)) return SIGNB.get(k);
  const g = AF.meshModel(AF.textModel(text, fg, { bg, pad: 2, depth: 1, bold: true }), { vs: 1 / 8, anchor: [0.5, 0, 0] });
  SIGNB.set(k, g); return g;
};
// v3 ENGINE CO. 7 kit: the old ladder truck (bay B), brass alarm bell, duty board, checkers table, helmet rack, bunker boots
let FIREK = null;
RK.fireKit = () => {
  if (FIREK) return FIREK;
  const col = AF.col, M = AF.Model, mm = (m, vs, an) => AF.meshModel(m, { vs, anchor: an || [0.5, 0, 0.5] });
  const red = col(0xc41e1a, { jitter: 0.04, edge: 0.2, rough: 0.3 }), redD = col(0x8a1612, { jitter: 0.05, rough: 0.4 }), blk = col(0x1a1a1c, { jitter: 0.05 });
  const chrome = AF.MAT && AF.MAT.chrome || col(0xd8dce0, { metal: 1, rough: 0.2 }), brass = AF.MAT && AF.MAT.brass || col(0xd8a840, { metal: 1, rough: 0.25 });
  const gold = col(0xf0c040, { metal: 0.8, rough: 0.3, jitter: 0 }), wood = col(0xc89a58, { jitter: 0.12 }), woodD = col(0x6a4424, { jitter: 0.1 });
  const lamp = col(0xfff2c8, { emit: 0xffe4a0, emitK: 2.2, mode: 'night', jitter: 0 }), redL = col(0xff2a1a, { emit: 0xff2010, emitK: 2.4, mode: 'always', jitter: 0 });
  const glass = col(0x40505a, { glass: true, jitter: 0 });
  FIREK = {};
  { // ladder truck: 17 x 24 x 56 at 1/8 (2.1 x 3 x 7 m), nose along +z
    const m = new M(17, 24, 58);
    for (const [z0, z1] of [[6, 13], [40, 47]]) for (const [x0, x1] of [[0, 3], [14, 17]]) { m.box(x0, 0, z0, x1, 7, z1, blk); m.box(x0, 2, z0 + 2, x1, 5, z1 - 2, red); m.box(x0, 3, z0 + 3, x1, 4, z1 - 3, chrome); }
    m.box(3, 3, 2, 14, 6, 56, redD);                                       // frame
    m.box(1, 6, 2, 16, 11, 40, red); m.box(1, 9, 2, 16, 10, 40, gold);     // body + gold stripe
    for (let z = 5; z < 38; z += 8) { m.box(0, 7, z, 1, 8, z + 2, chrome); m.box(16, 7, z, 17, 8, z + 2, chrome); }   // compartment handles
    m.box(1, 5, 13, 16, 7, 40, red); m.box(0, 5, 13, 1, 6, 40, chrome); m.box(16, 5, 13, 17, 6, 40, chrome);   // running boards
    m.box(2, 6, 40, 15, 10, 48, red); m.box(2, 10, 40, 15, 14, 42, blk);  // cab + seat back
    m.box(3, 8, 44, 14, 11, 47, blk);                                      // seat
    m.box(1, 6, 48, 16, 12, 56, red); m.box(2, 12, 48, 15, 13, 55, redD);  // hood
    m.box(3, 5, 56, 14, 12, 57, chrome); for (let y = 6; y < 12; y += 2) m.box(4, y, 57, 13, y + 1, 58, blk);   // radiator grille
    m.box(0, 10, 55, 3, 13, 58, chrome); m.box(14, 10, 55, 17, 13, 58, chrome); m.box(1, 11, 57, 2, 12, 58, lamp); m.box(15, 11, 57, 16, 12, 58, lamp);   // headlamps
    m.box(2, 12, 47, 3, 18, 48, chrome); m.box(14, 12, 47, 15, 18, 48, chrome); m.box(3, 13, 47, 14, 17, 48, glass); m.box(2, 17, 47, 15, 18, 48, chrome);   // windscreen
    m.box(7, 11, 44, 10, 14, 45, blk); m.box(6, 14, 44, 11, 15, 45, blk);                    // steering wheel
    m.box(7, 13, 50, 10, 16, 53, brass); m.box(8, 16, 51, 9, 17, 52, brass);                 // brass bell on the hood
    m.box(8, 18, 47, 9, 19, 48, redL);                                                      // red beacon
    for (const x of [1, 15]) for (const z of [6, 22, 38]) m.box(x, 11, z, x + 1, 14, z + 1, chrome);   // ladder rack posts
    for (const [x0, x1, y] of [[2, 7, 14], [10, 15, 14], [4, 13, 16]]) {                   // three wooden ladders
      m.box(x0, y, 0, x0 + 1, y + 1, 56, wood); m.box(x1 - 1, y, 0, x1, y + 1, 56, wood);
      for (let z = 1; z < 56; z += 3) m.box(x0 + 1, y, z, x1 - 1, y + 1, z + 1, wood);
    }
    m.box(5, 11, 0, 12, 12, 3, chrome); m.box(6, 13, 1, 11, 20, 3, blk); m.box(7, 19, 3, 10, 20, 5, blk);   // tiller seat at the back
    m.box(3, 3, 0, 14, 4, 2, chrome);                                                     // rear step
    m.box(2, 10, 2, 15, 13, 5, redD); for (let x = 3; x < 14; x += 2) m.box(x, 13, 3, x + 1, 14, 4, col(0x8a8a78, { jitter: 0.3 }));   // hose bed
    FIREK.ladder = mm(m, 1 / 8);
  }
  { // brass alarm bell on a wall bracket (faces +z)
    const m = new M(10, 12, 7);
    m.box(4, 10, 0, 6, 12, 5, woodD);
    for (let y = 0; y < 9; y++) { const r = 1.5 + y * 0.35; for (let x = 0; x < 10; x++) for (let z = 0; z < 7; z++) if (Math.hypot(x - 4.5, z - 3.5) <= (8 - y) * 0.45 + 1.2 && Math.hypot(x - 4.5, z - 3.5) >= r - 10) m.set(x, y + 1, z, brass); }
    m.box(4, 0, 3, 6, 1, 5, brass);
    FIREK.bell = mm(m, 1 / 16, [0.5, 0, 0]);
  }
  { // duty board: slate with chalk lines + a heading
    const slate = col(0x2a3430, { jitter: 0.06 }), chalk = col(0xe8e4d8, { jitter: 0.05 }), fr = col(0x6a4424, { jitter: 0.1 });
    const m = new M(26, 18, 1);
    m.box(0, 0, 0, 26, 18, 1, fr); m.box(1, 1, 0, 25, 17, 1, slate);
    const t = AF.textModel('ON DUTY', 1, { pad: 0, spacing: 1 }); const ox = Math.floor((26 - t.w) / 2);
    for (let x = 0; x < t.w; x++) for (let y = 0; y < t.h; y++) if (t.get(x, y, 0)) m.set(ox + x, 16 - t.h + y, 0, chalk);
    for (let y = 3; y < 9; y += 2) for (let x = 3; x < 23; x++) if ((x * 7 + y * 3) % 5 !== 0) m.set(x, y, 0, chalk);
    FIREK.board = mm(m, 1 / 16, [0.5, 0, 0]);
  }
  { // checkers table with a game in progress + two mugs
    const m = new M(14, 14, 14), tb = col(0x7a4a26, { jitter: 0.1 }), sq = [col(0xc8322a, { jitter: 0.05 }), col(0x1e1e1e, { jitter: 0.05 })], pw = col(0xe8e0d0, { jitter: 0.05 }), pr = col(0xb8201a, { jitter: 0.05 });
    for (const [x, z] of [[1, 1], [12, 1], [1, 12], [12, 12]]) m.box(x, 0, z, x + 1, 11, z + 1, tb);
    m.box(0, 11, 0, 14, 12, 14, tb);
    for (let x = 0; x < 8; x++) for (let z = 0; z < 8; z++) m.set(3 + x, 12, 3 + z, sq[(x + z) & 1]);
    for (const [x, z, c] of [[3, 3, pr], [5, 3, pr], [4, 4, pr], [8, 4, pr], [7, 6, pr], [4, 9, pw], [6, 9, pw], [9, 10, pw], [8, 8, pw], [10, 7, pw]]) m.set(x, 13, z, c);
    m.box(0, 12, 6, 2, 14, 8, col(0xf0ece0, {})); m.box(12, 12, 5, 14, 14, 7, col(0x3a5a8a, {}));
    FIREK.checkers = mm(m, 1 / 16);
  }
  { // helmet rack: 4 leather helmets with brass shields on pegs (faces +z)
    const m = new M(40, 8, 6), hel = [col(0x1a1a1a, { jitter: 0.05 }), col(0xb01e18, { jitter: 0.05 })];
    m.box(0, 0, 0, 40, 2, 1, woodD);
    for (let i = 0; i < 4; i++) { const x = 2 + i * 10; m.box(x, 1, 1, x + 7, 5, 5, hel[i & 1]); m.box(x + 1, 5, 1, x + 6, 7, 5, hel[i & 1]); m.box(x - 1, 1, 1, x + 8, 2, 6, hel[i & 1]); m.box(x + 2, 3, 5, x + 5, 6, 6, brass); }
    FIREK.helmetRack = mm(m, 1 / 16, [0.5, 0, 0]);
  }
  { // bunker boots with trousers folded down over them
    const m = new M(12, 10, 7), rub = col(0x1a1a1a, {}), tan = col(0x3a3630, { jitter: 0.1 }), ref = col(0xe8d050, { jitter: 0.05 });
    m.box(0, 0, 1, 5, 6, 6, rub); m.box(7, 0, 1, 12, 6, 6, rub); m.box(0, 6, 0, 12, 9, 7, tan); m.box(0, 7, 0, 12, 8, 7, ref);
    FIREK.boots = mm(m, 1 / 16);
  }
  return FIREK;
};
// v3 SHOP KIT: centre islands and counter-top goods so no shop has an empty middle; a ceiling fan (animated in 41's tick)
let SHOPK = null;
RK.shopKit = () => {
  if (SHOPK) return SHOPK;
  const col = AF.col, M = AF.Model, mm = (m, vs, an) => AF.meshModel(m, { vs, anchor: an || [0.5, 0, 0.5] });
  const wood = col(0x9a6a3e, { jitter: 0.15 }), woodD = col(0x5a3a22, { jitter: 0.12 }), brass = AF.MAT && AF.MAT.brass || col(0xd8a840, { metal: 1, rough: 0.25 });
  const glass = col(0x9ab0b8, { glass: true, jitter: 0 }), white = col(0xf2eee4, { jitter: 0.05 }), blk = col(0x1e1e20, {});
  SHOPK = {};
  { // produce stand: tilted crates of apples, oranges, greens, pumpkins, potatoes + a price card (1/16, 1.5 x 1.0 m)
    const m = new M(24, 16, 16), fr = [[0xc8281e, 0x8a1a14], [0xf08a1e, 0xd06a10], [0x5a9a3a, 0x3a7a2a], [0xd8741e, 0xb85a16], [0xb89a60, 0x8a7040], [0xe8d040, 0xc8b020]];
    for (const [x, z] of [[0, 0], [22, 0], [0, 14], [22, 14]]) m.box(x, 0, z, x + 2, 8, z + 2, woodD);
    m.box(0, 7, 0, 24, 8, 16, wood);
    for (let i = 0; i < 6; i++) { const cx = (i % 3) * 8, cz = i < 3 ? 0 : 8, h0 = i < 3 ? 8 : 10, a = col(fr[i][0], { jitter: 0.2 }), b = col(fr[i][1], { jitter: 0.2 });
      m.box(cx, h0, cz, cx + 8, h0 + 2, cz + 8, wood); m.box(cx + 1, h0 + 1, cz + 1, cx + 7, h0 + 2, cz + 7, 0);
      for (let x = 1; x < 7; x++) for (let z = 1; z < 7; z++) { m.set(cx + x, h0 + 1, cz + z, (x * 3 + z * 5) % 4 ? a : b); if ((x + z) % 2 === 0 && x > 1 && x < 6 && z > 1 && z < 6) m.set(cx + x, h0 + 2, cz + z, (x + z) % 4 ? a : b); } }
    m.box(10, 13, 7, 14, 16, 8, white); m.box(11, 14, 7, 13, 15, 8, blk);
    SHOPK.produce = mm(m, 1 / 16);
  }
  { // glass cake case on legs with three cakes + a tiered wedding cake (1/16, 1.25 x 0.75 m)
    const m = new M(20, 22, 12), pink = col(0xf0b8c8, { jitter: 0.1 }), cream = col(0xf6ecd0, { jitter: 0.08 }), choc = col(0x5a3420, { jitter: 0.1 }), cher = col(0xd81e28, {});
    for (const [x, z] of [[0, 0], [18, 0], [0, 10], [18, 10]]) m.box(x, 0, z, x + 2, 9, z + 2, woodD);
    m.box(0, 9, 0, 20, 10, 12, woodD); m.box(0, 10, 0, 20, 20, 1, glass); m.box(0, 10, 11, 20, 20, 12, glass); m.box(0, 10, 0, 1, 20, 12, glass); m.box(19, 10, 0, 20, 20, 12, glass); m.box(0, 20, 0, 20, 21, 12, wood);
    m.box(2, 10, 3, 6, 13, 7, pink); m.set(4, 13, 5, cher); m.box(8, 10, 3, 12, 12, 7, choc); m.box(8, 12, 3, 12, 13, 7, cream);
    m.box(13, 10, 2, 18, 12, 9, cream); m.box(14, 12, 3, 17, 14, 8, cream); m.box(15, 14, 4, 16, 16, 7, cream); m.set(15, 16, 5, pink);
    SHOPK.cakes = mm(m, 1 / 16);
  }
  { // bolts of cloth on a cutting table with shears + a tape (1/16)
    const m = new M(24, 16, 14), cl = [0x3a4a6a, 0x8a3a2a, 0x5a6a4a, 0xc8b890, 0x2a2a2a, 0x9a7aa0].map((h) => col(h, { jitter: 0.12 }));
    for (const [x, z] of [[0, 0], [22, 0], [0, 12], [22, 12]]) m.box(x, 0, z, x + 2, 11, z + 2, woodD);
    m.box(0, 11, 0, 24, 12, 14, wood);
    for (let i = 0; i < 6; i++) m.box(1 + i * 4, 12, 1, 4 + i * 4, 15 - (i & 1), 9, cl[i]);
    m.box(4, 12, 10, 20, 13, 13, col(0xe8e0c8, {})); m.box(20, 12, 10, 23, 13, 12, AF.MAT && AF.MAT.steel || white);
    SHOPK.cloth = mm(m, 1 /16);
  }
  { // folding table with brown-paper laundry parcels tied with string (1/16)
    const m = new M(24, 16, 14), kraft = col(0xb8905a, { jitter: 0.15 }), str = col(0xf0ece0, {});
    for (const [x, z] of [[0, 0], [22, 0], [0, 12], [22, 12]]) m.box(x, 0, z, x + 2, 11, z + 2, woodD);
    m.box(0, 11, 0, 24, 12, 14, wood);
    for (const [x, z, h] of [[1, 1, 3], [8, 1, 4], [15, 2, 3], [2, 7, 2], [10, 7, 3], [17, 8, 4]]) { m.box(x, 12, z, x + 6, 12 + h, z + 5, kraft); m.box(x + 3, 12, z, x + 4, 13 + h, z + 5, str); }
    SHOPK.parcels = mm(m, 1 / 16);
  }
  { // brass cash register (1/16, faces +z = the clerk sees the keys from -z)
    const m = new M(8, 9, 7);
    m.box(0, 0, 0, 8, 3, 7, brass); m.box(1, 3, 0, 7, 6, 4, brass); m.box(2, 6, 1, 6, 8, 3, brass); m.box(3, 6, 0, 5, 7, 1, white);
    for (let x = 1; x < 7; x += 2) for (let z = 4; z < 7; z += 2) m.set(x, 3, z, white);
    SHOPK.register = mm(m, 1 / 16);
  }
  { // coffee mill (big red two-wheel grinder) (1/16)
    const m = new M(10, 12, 6), red = col(0xb8281e, {});
    m.box(3, 0, 1, 7, 7, 5, red); m.box(4, 7, 2, 6, 10, 4, brass); m.box(3, 10, 1, 7, 11, 5, red);
    for (const x of [0, 9]) for (let y = 2; y < 10; y++) for (let z = 0; z < 6; z++) if (Math.hypot(y - 6, z - 2.5) <= 3.4 && Math.hypot(y - 6, z - 2.5) >= 2.2) m.set(x, y, z, red);
    SHOPK.mill = mm(m, 1 / 16);
  }
  { // dartboard in a cabinet (1/16, faces +z)
    const m = new M(12, 12, 2), ring = [col(0x1a1a1a, {}), col(0xe8dcb0, {}), col(0xc8281e, {}), col(0x2a7a3a, {})];
    m.box(0, 0, 0, 12, 12, 1, woodD);
    for (let x = 1; x < 11; x++) for (let y = 1; y < 11; y++) { const r = Math.hypot(x - 5.5, y - 5.5), a = Math.atan2(y - 5.5, x - 5.5); if (r > 4.9) continue; m.set(x, y, 1, r < 1 ? ring[2] : r > 4 ? (((a + 7) * 3.2 | 0) & 1 ? ring[2] : ring[3]) : (((a + 7) * 3.2 | 0) & 1 ? ring[0] : ring[1])); }
    SHOPK.darts = mm(m, 1 / 16, [0.5, 0.5, 0]);
  }
  { // four-blade ceiling fan (1/16, hub at the top, blades spin around y): drawn once, animated
    const m = new M(22, 5, 22), bl = col(0x6a4a2a, { jitter: 0.08 });
    m.box(10, 1, 10, 12, 5, 12, brass); m.box(9, 0, 9, 13, 2, 13, brass);
    m.box(0, 1, 10, 9, 2, 12, bl); m.box(13, 1, 10, 22, 2, 12, bl); m.box(10, 1, 0, 12, 2, 9, bl); m.box(10, 1, 13, 12, 2, 22, bl);
    SHOPK.fan = mm(m, 1 / 16, [0.5, 1, 0.5]);
  }
  { // sweet jars on a tiered stand (candy) (1/16)
    const m = new M(20, 18, 10), jar = [0xe83a5a, 0xf0c030, 0x3ab0e0, 0x8ad04a, 0xf08ac0, 0xffffff].map((h) => col(h, { jitter: 0.25 }));
    m.box(0, 0, 0, 20, 5, 10, wood); m.box(0, 5, 3, 20, 10, 10, wood); m.box(0, 10, 6, 20, 13, 10, wood);
    for (let t = 0; t < 3; t++) for (let i = 0; i < 5; i++) { const x = 1 + i * 4, y = [5, 10, 13][t], z = [0, 3, 6][t] + 1; m.box(x, y, z, x + 3, y + 4, z + 3, jar[(i + t * 2) % 6]); m.box(x, y + 4, z, x + 3, y + 5, z + 3, brass); }
    SHOPK.jars = mm(m, 1 / 16);
  }
  return SHOPK;
};
// v3 kids (1/16, ~1.2 m): 0 arms up (splashing), 1 bathing-suit arms out, 2 overalls arms up, 3 dress hands on hips
let KIDS = null;
RK.kids = () => {
  if (KIDS) return KIDS;
  const col = AF.col, sk = [0xe8b896, 0x8a5a3c, 0xf0c8a8, 0xc89070], hr = [0x6a3a1e, 0x1a1a1a, 0xd8b060, 0x2a1e16];
  const top = [0xc8322a, 0x3a6aa8, 0x6a8ac8, 0xe8c050], bot = [0x3a3a5a, 0x2a4a8a, 0x4a6a9a, 0xe8c050];
  KIDS = [0, 1, 2, 3].map((i) => {
    const S = col(sk[i], { jitter: 0.05 }), Hh = col(hr[i], { jitter: 0.1 }), T = col(top[i], { jitter: 0.08 }), B = col(bot[i], { jitter: 0.08 }), shoe = col(0x2a2a2a, {});
    const m = new AF.Model(12, 21, 6);
    m.box(3, 0, 1, 5, 1, 5, shoe); m.box(7, 0, 1, 9, 1, 5, shoe);
    m.box(3, 1, 2, 5, 6, 4, i === 1 ? S : B); m.box(7, 1, 2, 9, 6, 4, i === 1 ? S : B);
    if (i === 3) m.box(2, 5, 1, 10, 9, 5, T); else m.box(3, 5, 2, 9, 8, 4, B);
    m.box(3, 8, 2, 9, 13, 4, i === 1 ? S : T); if (i === 1) m.box(3, 8, 2, 9, 10, 4, B);
    if (i === 2) { m.box(3, 8, 2, 9, 12, 4, B); m.box(4, 12, 3, 5, 13, 4, B); m.box(7, 12, 3, 8, 13, 4, B); }
    if (i === 0 || i === 2) { m.box(1, 12, 2, 3, 19, 4, S); m.box(9, 12, 2, 11, 19, 4, S); }
    else if (i === 1) { m.box(0, 11, 2, 3, 13, 4, S); m.box(9, 11, 2, 12, 13, 4, S); }
    else { m.box(1, 9, 2, 3, 13, 4, S); m.box(9, 9, 2, 11, 13, 4, S); }
    m.box(4, 13, 1, 8, 18, 5, S); m.box(4, 17, 1, 8, 19, 5, Hh); m.box(3, 15, 1, 4, 18, 5, Hh); m.box(8, 15, 1, 9, 18, 5, Hh); m.box(4, 15, 0, 8, 17, 1, Hh);
    m.set(5, 16, 5, col(0x1a1a1a, {})); m.set(7, 16, 5, col(0x1a1a1a, {})); m.set(6, 14, 5, col(0xb85a5a, {}));
    if (i === 0) m.box(3, 19, 1, 9, 20, 5, col(0x3a6aa8, {}));   // cap
    return AF.meshModel(m, { vs: 1 / 16, anchor: [0.5, 0, 0.5] });
  });
  return KIDS;
};
// v3 DOOR KIT: 4-panel door (raised stiles/rails, recessed panels, brass knob + letter slot + knocker), a fanlight muntin
// overlay for the transom with a gilt house number, and a wrought-iron stoop railing with a scroll newel (1/16)
const DOORK = new Map();
RK.door = (c) => {
  if (DOORK.has(c)) return DOORK.get(c);
  const brass = AF.MAT && AF.MAT.brass || AF.col(0xd8a840, { metal: 1, rough: 0.25 }), m = new AF.Model(24, 40, 2);
  m.box(0, 0, 0, 24, 40, 1, c);
  const fr = (x0, y0, x1, y1) => { m.box(x0, y0, 1, x1, y0 + 1, 2, c); m.box(x0, y1 - 1, 1, x1, y1, 2, c); m.box(x0, y0, 1, x0 + 1, y1, 2, c); m.box(x1 - 1, y0, 1, x1, y1, 2, c); };
  m.box(0, 0, 1, 24, 3, 2, c); m.box(0, 37, 1, 24, 40, 2, c); m.box(0, 0, 1, 3, 40, 2, c); m.box(21, 0, 1, 24, 40, 2, c); m.box(11, 0, 1, 13, 40, 2, c); m.box(0, 17, 1, 24, 20, 2, c);   // stiles + rails
  fr(4, 4, 10, 16); fr(14, 4, 20, 16); fr(4, 21, 10, 36); fr(14, 21, 20, 36);                                                                   // panel mouldings
  m.box(18, 18, 1, 20, 20, 2, 0); m.set(19, 19, 1, brass); m.box(18, 18, 2, 20, 20, 2, 0);
  const M2 = new AF.Model(24, 40, 3); for (let x = 0; x < 24; x++) for (let y = 0; y < 40; y++) for (let z = 0; z < 2; z++) { const v = m.get(x, y, z); if (v) M2.set(x, y, z, v); }
  M2.set(19, 18, 2, brass); M2.set(19, 19, 2, brass); M2.box(9, 18, 2, 15, 19, 3, brass); M2.box(11, 26, 2, 13, 30, 3, brass); M2.set(12, 25, 2, brass);   // knob, letter slot, knocker
  const g = AF.meshModel(M2, { vs: 1 / 16, anchor: [0.5, 0, 0] }); DOORK.set(c, g); return g;
};
const FANL = new Map();
RK.fanlight = (num, trimC) => {
  const k = num + '|' + trimC; if (FANL.has(k)) return FANL.get(k);
  const gold = AF.col(0xf2c65a, { metal: 1, rough: 0.25, jitter: 0 }), m = new AF.Model(24, 8, 1);
  for (let x = 0; x < 24; x++) for (let y = 0; y < 8; y++) { const dx = x - 11.5, a = Math.atan2(y + 0.5, dx), r = Math.hypot(dx, y + 0.5);
    if (y === 0 || x === 0 || x === 23 || y === 7 || (r > 3 && Math.abs(((a / Math.PI) * 6) % 1) < 0.14) || (r > 10.5 && r < 11.6)) m.set(x, y, 0, trimC); }
  const t = AF.textModel(String(num), 1, { pad: 0, spacing: 1 }); const ox = Math.floor((24 - t.w) / 2);
  for (let x = 0; x < t.w; x++) for (let y = 0; y < t.h; y++) if (t.get(x, y, 0) && y + 1 < 8) m.set(ox + x, y + 1, 0, gold);
  const g = AF.meshModel(m, { vs: 1 / 16, anchor: [0.5, 0, 0] }); FANL.set(k, g); return g;
};
let RAIL = null;
RK.stoopRail = () => {
  if (RAIL) return RAIL;
  const C = RK.colours(), ir = AF.col(0x1e2022, { jitter: 0.05, rough: 0.5, metal: 0.4 }), brass = AF.MAT && AF.MAT.brass || ir, m = new AF.Model(3, 38, 48);
  const base = (z) => Math.min(4, z >> 3) * 4, rail = (z) => 13 + Math.min(16, z * 16 / 38);
  for (let z = 0; z < 48; z++) { const r = Math.round(rail(z)); m.set(1, r, z, ir); m.set(1, r + 1, z, ir); if (z % 4 === 2) m.box(1, base(z), z, 2, r, z + 1, ir); if (z % 8 === 6) m.set(1, r - 3, z, ir); }
  m.box(0, 0, 0, 3, 17, 3, ir); m.box(0, 17, 0, 3, 18, 3, brass);                                                          // newel post + brass cap
  for (const [y, z] of [[2, 3], [3, 4], [4, 4], [5, 3], [5, 2], [4, 1], [6, 5], [8, 5], [9, 4], [10, 3], [10, 5]]) m.set(1, y, z + 1, ir);   // scroll at the foot
  RAIL = AF.meshModel(m, { vs: 1 / 16, anchor: [0.5, 0, 0] }); return RAIL;
};
// Boston ivy creeping up a wall: recolours the outer wall voxels (only those still showing colour `wallC`) in a ragged patch
RK.ivy = (H, u0, u1, yTop, vw, wallC, sd) => {
  const C = RK.colours();
  for (let u = u0; u < u1; u += 0.25) {
    const reach = yTop * (0.55 + 0.45 * RK.hash(sd, Math.round(u * 4), 71)) * (1 - Math.pow(Math.abs((u - u0) / (u1 - u0) - 0.35) * 1.3, 2));
    for (let y = 0.25; y < reach; y += 0.25) {
      if (RK.hash(sd, Math.round(u * 4), Math.round(y * 4)) < 0.18 + 0.5 * (y / Math.max(1, reach))) continue;
      const p = H.w(u + 0.125, vw + 0.125), x0 = Math.floor(p[0] * 4) / 4, z0 = Math.floor(p[1] * 4) / 4;
      if (AF.W.getM(x0 + 0.125, y + 0.125, z0 + 0.125) !== wallC) continue;
      AF.W.fill(x0, y, z0, x0 + 0.25, y + 0.25, z0 + 0.25, C.ivy[Math.floor(RK.hash(sd + 3, Math.round(u * 4), Math.round(y * 4)) * C.ivy.length)]);
    }
  }
};
// roof caps for the fill blocks: 'mansard' (slate, dormers) · 'copper' (green mansard) · 'hip' (terracotta) · flat roofs are drawn by the caller
RK.roofCap = (H, u0, u1, v0, v1, top, kind, sd) => {
  const C = RK.colours();
  if (kind === 'hip') {
    for (let i = 0; i < 14; i++) { const ins = i * 0.25; if (u1 - u0 - 2 * ins < 0.5 || v1 - v0 - 2 * ins < 0.5) break; H.fill(u0 + ins, top + i * 0.25, v0 + ins, u1 - ins, top + (i + 1) * 0.25, v1 - ins, i % 3 === 2 ? C.terra2 : C.terra); }
    return;
  }
  const a = kind === 'copper' ? C.copperR : C.slate, b = kind === 'copper' ? C.copperR2 : C.slate2;
  for (let i = 0; i < 11; i++) { const ins = 0.25 + Math.floor(i / 2) * 0.25; H.fill(u0 + ins, top + i * 0.25, v0 + ins, u1 - ins, top + (i + 1) * 0.25, v1 - ins, i % 2 ? a : b); }
  H.fill(u0 + 1.75, top + 2.75, v0 + 1.75, u1 - 1.75, top + 3.0, v1 - 1.75, C.copingL);
  // dormers on the street slope
  for (let u = u0 + 1.25; u + 1.5 <= u1 - 1.0; u += 2.75) {
    H.fill(u, top, v0 + 0.25, u + 1.5, top + 2.0, v0 + 1.5, b); H.fill(u + 0.25, top + 0.5, v0 + 0.25, u + 1.25, top + 1.75, v0 + 0.5, C.win[(sd + Math.round(u)) % 5]);
    H.fill(u - 0.25, top + 2.0, v0, u + 1.75, top + 2.25, v0 + 1.75, kind === 'copper' ? C.copperR2 : C.cornice[0]);
  }
};

// ---------------------------------------------------------------- window helper
// punch a window in the wall plane at v = vw (wall's outer face), wall thickness 2 blocks (outer 0.25 carved, inner 0.25 = pane)
RK.windowAt = (H, u0, y0, w, h, vw, pane, sill, lintel, opts = {}) => {
  H.fill(u0, y0, vw, u0 + w, y0 + h, vw + 0.25, 0);
  H.fill(u0, y0, vw + 0.25, u0 + w, y0 + h, vw + 0.5, pane);
  if (w >= 1) H.fill(u0 + w / 2 - 0.125, y0, vw + 0.25, u0 + w / 2 + 0.125, y0 + h, vw + 0.5, opts.mullion ?? sill);   // mullion
  if (opts.shade) H.fill(u0, y0 + h - 0.25 - (opts.shadeDrop || 0), vw + 0.25, u0 + w, y0 + h, vw + 0.5, opts.shade);
  if (sill) H.fill(u0 - 0.25, y0 - 0.25, vw - 0.25, u0 + w + 0.25, y0, vw + 0.25, sill);
  if (lintel) H.fill(u0 - 0.25, y0 + h, vw, u0 + w + 0.25, y0 + h + 0.25, vw + 0.25, lintel);
};
}

} catch (e) { AF.partError('40-homes.js', e); }

