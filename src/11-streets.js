// ================================================================ 11-streets.js
try {
// ===== 11-streets: Port Solace roads, sidewalks, markings, street furniture, traffic lights, street trees, flags + bunting  (OWNER: streets-park) =====
{
  const W = AF.W, P = AF.PLAN;
  const ST = AF.streets = AF.streets || {};
  const hash = AF.hash2;
  let K = null;
  const pal = () => {
    if (K) return K;
    const c = AF.col;
    K = {
      asph: [c(0x4a4a4f, { jitter: 0.25, edge: 0.03 }), c(0x47474c, { jitter: 0.25, edge: 0.03 }), c(0x4f4f54, { jitter: 0.25, edge: 0.03 }), c(0x535257, { jitter: 0.25, edge: 0.03 })],
      patch: c(0x524e49, { jitter: 0.2, edge: 0.03, pat: 'tar' }), patch2: c(0x7a746a, { jitter: 0.2, edge: 0.03, pat: 'asphalt' }),
      white: c(0xe8e3d4, { jitter: 0.2, edge: 0.03 }), yellow: c(0xe0b23c, { jitter: 0.2, edge: 0.03 }),
      manhole: c(0x3a3531, { jitter: 0.2, edge: 0.25 }), manhole2: c(0x4f4841, { jitter: 0.2, edge: 0.25 }),
      conc: [c(0xcdc6b6, { jitter: 0.22, edge: 0.12 }), c(0xc6bfae, { jitter: 0.22, edge: 0.12 }), c(0xd3cdbf, { jitter: 0.22, edge: 0.12 })],
      joint: c(0xa59e90, { jitter: 0.15, edge: 0.05 }), curb: c(0x8f8c88, { jitter: 0.2, edge: 0.35 }), curbSide: c(0x85827d, { jitter: 0.25, edge: 0.2 }),
      grate: c(0x2a2b2a, { jitter: 0.1, edge: 0.4 }), soil: c(0x4e3b2b, { jitter: 0.6 }),
      leafR: c(0xb8452a, { jitter: 0.5 }), leafO: c(0xd57a2c, { jitter: 0.5 }), leafY: c(0xd9a93a, { jitter: 0.5 }),
      iron: c(0x1f2a24, { jitter: 0.15, edge: 0.4 }), ironHi: c(0x33423a, { jitter: 0.15, edge: 0.4 }), brass: c(0xc09a45, { jitter: 0.2, edge: 0.3 }),
      glow: c(0xffe6b8, { emit: 0xffa850, emitK: 1.05, mode: 'night', jitter: 0, edge: 0 }),
      signG: c(0x1f3a6b, { jitter: 0.06, edge: 0.2, rough: 0.25 }), signW: c(0xf2efe4, { jitter: 0, edge: 0, rough: 0.25 }),   // porcelain-enamel blue plates
      red: c(0xc03a2c, { jitter: 0.2, edge: 0.3 }), redD: c(0x8e2a21, { jitter: 0.2, edge: 0.3 }), chrome: c(0xe4e2dc, { jitter: 0.1, edge: 0.3 }),
      blue: c(0x2d4f8a, { jitter: 0.15, edge: 0.3 }), blueD: c(0x213a66, { jitter: 0.15, edge: 0.3 }), navy: c(0x1d2d52, { jitter: 0.15, edge: 0.3 }),
      wood: c(0x9a6a3e, { jitter: 0.4, edge: 0.4 }), woodD: c(0x6f4a2a, { jitter: 0.4, edge: 0.4 }), woodL: c(0xb98a58, { jitter: 0.4, edge: 0.4 }),
      bark: c(0x5a4232, { jitter: 0.5, edge: 0.3 }), bark2: c(0x4a372a, { jitter: 0.5, edge: 0.3 }),
      black: c(0x1c1b1a, { jitter: 0.1, edge: 0.2 }), greenP: c(0x2f5d3a, { jitter: 0.2, edge: 0.3 }), cream: c(0xefe3c2, { jitter: 0.15, edge: 0.2 }),
      paper: c(0xe8e4d8, { jitter: 0.3, edge: 0.1 }), paper2: c(0xd9d2bf, { jitter: 0.3, edge: 0.1 }), jade: c(0x2e8a7a, { jitter: 0.15, edge: 0.3 }),
      face: c(0xfbf4dc, { emit: 0xfff0c8, emitK: 1.2, mode: 'night', jitter: 0, edge: 0.1 }),
      canopy: [c(0xc4462a, { jitter: 0.45, edge: 0.05 }), c(0xd9772b, { jitter: 0.45, edge: 0.05 }), c(0xe0a834, { jitter: 0.45, edge: 0.05 }), c(0xb7572c, { jitter: 0.45, edge: 0.05 }), c(0x9a3a26, { jitter: 0.45, edge: 0.05 })],
      canopyG: [c(0x6f8a38, { jitter: 0.45, edge: 0.05 }), c(0x8b9a3a, { jitter: 0.45, edge: 0.05 }), c(0xa89a3a, { jitter: 0.45, edge: 0.05 })],
      // v2 paving by district (sub-block patterns from the R1 surface system)
      slab: [c(0xc2bcaf, { jitter: 0.1, edge: 0.04, pat: 'slab' }), c(0xbab4a7, { jitter: 0.1, edge: 0.04, pat: 'slab' }), c(0xc9c3b6, { jitter: 0.1, edge: 0.04, pat: 'slab' })],
      brickP: [c(0x9a4a38, { jitter: 0.25, edge: 0.05, pat: 'brick', patTop: 'brick' }), c(0x8c4232, { jitter: 0.25, edge: 0.05, pat: 'brick', patTop: 'brick' }), c(0xa5553f, { jitter: 0.25, edge: 0.05, pat: 'brick', patTop: 'brick' })],
      settP: [c(0x77726a, { jitter: 0.3, edge: 0.05, pat: 'setts' }), c(0x6d6862, { jitter: 0.3, edge: 0.05, pat: 'setts' }), c(0x817b72, { jitter: 0.3, edge: 0.05, pat: 'setts' })],
      terr: [c(0xd9caa6, { jitter: 0.12, edge: 0.03, pat: 'slab', rough: 0.45 }), c(0xd2c29c, { jitter: 0.12, edge: 0.03, pat: 'slab', rough: 0.45 })],
      star: c(0xd4a847, { metal: 1, rough: 0.25, jitter: 0.05, edge: 0 }),
      coal: c(0x2e2c2a, { jitter: 0.1, edge: 0.3, metal: 0.6, rough: 0.5 }),
      kerb: c(0x9a968f, { jitter: 0.15, edge: 0.3, pat: 'stone', rough: 0.6 }),
      gutter: c(0x46423d, { jitter: 0.2, edge: 0.02, pat: 'asphalt' }), gutterW: c(0x363330, { jitter: 0.2, edge: 0.02, rough: 0.3 }),
      oil: c(0x45413c, { jitter: 0.25, edge: 0.02, rough: 0.35 }),
      // round 2 (clarity): asphalt lifted from near-black to a sun-bleached warm grey so the street floor reads at golden hour
      asphW: [c(0x67625b, { jitter: 0.2, edge: 0.02, pat: 'asphalt' }), c(0x625d56, { jitter: 0.2, edge: 0.02, pat: 'asphalt' }), c(0x6c675f, { jitter: 0.2, edge: 0.02, pat: 'asphalt' }), c(0x726c63, { jitter: 0.2, edge: 0.02, pat: 'asphalt' })],
      yellowW: c(0xcfa640, { jitter: 0.35, edge: 0.03 }), whiteW: c(0xdcd6c6, { jitter: 0.3, edge: 0.03 }),
      lampG: c(0x2c4a36, { jitter: 0.12, edge: 0.35, metal: 0.3, rough: 0.5 }), lampGH: c(0x3d6049, { jitter: 0.12, edge: 0.35, metal: 0.3, rough: 0.45 }),
      bronze: c(0x7a5a32, { metal: 1, rough: 0.4, jitter: 0.1, edge: 0.3 }),
      vault: c(0xa89cc4, { jitter: 0.1, edge: 0.25, rough: 0.12 }), vaultF: c(0x5a5a58, { jitter: 0.1, edge: 0.3, metal: 0.6, rough: 0.4 }),
      chalk: c(0xf2f0ea, { jitter: 0.15, edge: 0 }), chalkP: c(0xf0a8c0, { jitter: 0.15, edge: 0 }),
    };
    return K;
  };
  ST.pal = pal;

  // ------------------------------------------------------------ shared tree builder (stamped into the grid; canopy on a 0.5 m lattice)
  // opts: {h: trunk height m, r: canopy radius m, bare: 0..1, green: bool, seed}
  ST.tree = (x, y0, z, o = {}) => {
    const k = pal(), seed = o.seed ?? (hash(Math.round(x * 4), Math.round(z * 4)) * 1e6 | 0), rnd = AF.rng(seed);
    const th = o.h ?? 4, R = o.r ?? 2.4, bare = o.bare ?? 0;
    const cols = o.green ? k.canopyG : k.canopy;
    const base = cols[Math.floor(rnd() * cols.length)], alt = cols[Math.floor(rnd() * cols.length)];
    const setIf = (bx, by, bz, c) => { if (!W.get(bx, by, bz)) W.set(bx, by, bz, c); };
    const bx0 = W.bx(x), bz0 = W.bz(z), by0 = W.by(y0);
    const tw = R > 3 ? 2 : 1;                                   // trunk half-size in blocks (2 -> 1.0 m wide... tw=1 -> 0.5 m)
    const tb = Math.round(th * 4) + Math.round(R * 2);
    for (let j = 0; j < tb; j++) for (let a = -tw; a < tw; a++) for (let b = -tw; b < tw; b++) setIf(bx0 + a, by0 + j, bz0 + b, (j + a) % 5 === 0 ? k.bark2 : k.bark);
    if (tw === 2) for (const [a, b] of [[-3, 0], [2, -1], [0, 2], [-1, -3]]) for (let j = 0; j < 2; j++) setIf(bx0 + a, by0 + j, bz0 + b, k.bark2);   // root flare
    // branches
    const nb = 3 + Math.floor(rnd() * 3);
    for (let i = 0; i < nb; i++) {
      const ang = rnd() * Math.PI * 2, L = R * (0.6 + rnd() * 0.35) * 4, y1 = Math.round(th * 4 * (0.7 + rnd() * 0.3));
      for (let s = 0; s < L; s++) { const t = s / L; setIf(bx0 + Math.round(Math.cos(ang) * s), by0 + y1 + Math.round(t * L * 0.6), bz0 + Math.round(Math.sin(ang) * s), k.bark); }
    }
    // canopy blobs on a 2-block lattice
    const cy = y0 + th + R * 0.75;
    const blobs = [[0, 0, 0, R]];
    const nBl = 3 + Math.floor(rnd() * 3);
    for (let i = 0; i < nBl; i++) { const a = rnd() * 6.28; blobs.push([Math.cos(a) * R * 0.55, (rnd() - 0.3) * R * 0.6, Math.sin(a) * R * 0.55, R * (0.55 + rnd() * 0.25)]); }
    const cr = Math.ceil(R * 1.6);
    for (let gx = -cr; gx <= cr; gx += 0.5) for (let gy = -cr; gy <= cr; gy += 0.5) for (let gz = -cr; gz <= cr; gz += 0.5) {
      let inside = false, edge = 1;
      for (const [ox, oy, oz, r] of blobs) { const d = Math.hypot(gx - ox, (gy - oy) * 1.25, gz - oz) / r; if (d < 1) { inside = true; edge = Math.min(edge, d); } }
      if (!inside) continue;
      const hsh = hash(Math.round((x + gx) * 2) * 7 + Math.round(gy * 2), Math.round((z + gz) * 2) * 13 + seed);
      if (edge > 0.72 && hsh < 0.35 + bare * 0.5) continue;
      if (bare > 0 && hsh < bare * 0.6) continue;
      if (edge < 0.55 && gy < 0) continue;   // hollow-ish lower core (cheaper, reads as dappled)
      const c = hsh < 0.3 ? alt : hsh < 0.38 ? k.leafY : base;
      const X = W.bx(x + gx), Y = W.by(cy + gy), Z = W.bz(z + gz);
      for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) for (let d = 0; d < 2; d++) setIf(X + a, Y + b, Z + d, c);
    }
    // leaf litter
    if (o.litter !== false) W.eachCol(x - R * 1.2, z - R * 1.2, x + R * 1.2, z + R * 1.2, (bx, bz, i, px, pz) => {
      if (Math.hypot(px - x, pz - z) > R * 1.15 || W.H[i] < 1) return;
      const hh = hash(bx * 3 + 1, bz * 5 + 2); if (hh < 0.45) W.C[i] = hh < 0.15 ? k.leafR : hh < 0.3 ? k.leafO : k.leafY;
    });
  };


  // ------------------------------------------------------------ PROP TREES (cached Model geometries at 0.25 m, placed with placeStatic)
  // kinds: 'street' (clear trunk to 4.5 m, small layered clusters), 'oak' (broad, many clusters, gaps), 'elm' (tall vase),
  //        'conifer' (tiered spruce), 'bare' (limbs + twigs + a few last leaves). variant = integer seed.
  const TREE_COLS = [[0xb8322a, 0xcf4a2c, 0x8a2420, 0xe8703c], [0xd66a28, 0xe4882e, 0xa84c1e, 0xf4a846], [0xdca22c, 0xe9b93c, 0xb07e22, 0xf6d45c],
    [0x9a3a24, 0xb8522c, 0x6e2618, 0xcc7440], [0x7a9a3a, 0xd48a30, 0x55702a, 0xe8ac4a], [0xa8843a, 0xc49c4a, 0x74602a, 0xd8b85a]];
  const treeCache = new Map();
  ST.treeGeo = (kind, variant) => {
    const key = kind + '|' + variant;
    if (treeCache.has(key)) return treeCache.get(key);
    const rnd = AF.rng(variant * 7919 + kind.length * 104729 + 17), c = AF.col;
    const bark = c(0x4e3e30, { jitter: 0.4, edge: 0.3 }), barkD = c(0x3a2e24, { jitter: 0.4, edge: 0.3 });
    const set = TREE_COLS[kind === 'oak' ? [3, 5, 1, 0][variant % 4] : kind === 'elm' ? [2, 4, 5][variant % 3] : (variant % TREE_COLS.length)];
    const lv = set.map((h) => c(h, { jitter: 0.9, edge: 0.3, solid: false }));   // [base, light, dark, highlight]
    const nd = c(0x2c4e3a, { jitter: 0.6, edge: 0.3, solid: false }), nd2 = c(0x3a6446, { jitter: 0.6, edge: 0.3, solid: false }), ndD = c(0x1e382a, { jitter: 0.6, edge: 0.3, solid: false });
    const S = { street: [22, 40], oak: [56, 52], elm: [52, 64], conifer: [30, 64], bare: [44, 52] }[kind] || [40, 48];
    const Wd = S[0], Ht = S[1], cx = Wd / 2, cz = Wd / 2, m = new AF.Model(Wd, Ht, Wd);
    const limb = (x0, y0, z0, x1, y1, z1, r) => { const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0, z1 - z0)); for (let i = 0; i <= n; i++) { const t = i / n, rr = r * (1 - t * 0.5); const x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t, z = z0 + (z1 - z0) * t; for (let a = -Math.ceil(rr); a <= Math.ceil(rr); a++) for (let b = -Math.ceil(rr); b <= Math.ceil(rr); b++) if (a * a + b * b <= rr * rr + 0.3) m.set(Math.floor(x + a), Math.floor(y), Math.floor(z + b), (i + a) % 4 === 0 ? barkD : bark); } };
    const cluster = (x, y, z, r, dens = 1) => {
      for (let i = Math.floor(x - r); i <= x + r; i++) for (let j = Math.floor(y - r * 0.8); j <= y + r * 0.8; j++) for (let k2 = Math.floor(z - r); k2 <= z + r; k2++) {
        const dx = i + 0.5 - x, dy = (j + 0.5 - y) / 0.8, dz = k2 + 0.5 - z, d = Math.sqrt(dx * dx + dy * dy + dz * dz) / r;
        if (d > 1) continue;
        const h = hash(i * 31 + j * 7 + variant, k2 * 17 + j);
        if (d > 0.7 && h < 0.35) continue;
        if (h > dens + 0.02) continue;
        if (m.get(i, j, k2)) continue;
        const rel = (j + 0.5 - y) / r;
        m.set(i, j, k2, rel < -0.35 ? lv[2] : rel > 0.45 && h < 0.5 ? lv[3] : h < 0.25 ? lv[1] : lv[0]);
      }
    };
    let trunkH = 3, trunkR = 0.25;
    if (kind === 'street') {
      trunkH = 4.5; limb(cx, 0, cz, cx, 18, cz, 1.0);
      const n = 5 + Math.floor(rnd() * 3);
      for (let i = 0; i < n; i++) { const a = i / n * 6.28 + rnd(), r = 2 + rnd() * 3.5, y = 22 + rnd() * 10; limb(cx, 16, cz, cx + Math.cos(a) * r * 0.7, y - 2, cz + Math.sin(a) * r * 0.7, 0.5); cluster(cx + Math.cos(a) * r, y, cz + Math.sin(a) * r, 3 + rnd() * 1.5); }
      cluster(cx, 33 + rnd() * 3, cz, 3.5);
    } else if (kind === 'oak' || kind === 'bare') {
      const bare = kind === 'bare'; trunkH = 3; trunkR = 0.4;
      limb(cx, 0, cz, cx, 14, cz, 2.2); m.box(cx - 3, 0, cz - 1, cx + 3, 2, cz + 1, barkD); m.box(cx - 1, 0, cz - 3, cx + 1, 2, cz + 3, barkD);
      const n = 5 + Math.floor(rnd() * 2);
      for (let i = 0; i < n; i++) {
        const a = i / n * 6.28 + rnd() * 0.6, L = (bare ? 16 : 17) + rnd() * 7, ey = 20 + rnd() * 14;
        const ex = cx + Math.cos(a) * L, ez = cz + Math.sin(a) * L;
        limb(cx, 12, cz, ex, ey, ez, 1.3);
        for (let tw = 0; tw < 3; tw++) { const b = a + (rnd() - 0.5) * 1.6; limb(ex, ey, ez, ex + Math.cos(b) * 5, ey + 3 + rnd() * 5, ez + Math.sin(b) * 5, 0.4); }
        if (!bare) { cluster(ex, ey + 3, ez, 6 + rnd() * 2.5); cluster(cx + Math.cos(a) * L * 0.55, ey + 5, cz + Math.sin(a) * L * 0.55, 5 + rnd() * 2, 0.9); }
        else if (rnd() < 0.5) cluster(ex, ey + 4, ez, 3.2, 0.35);
      }
      if (!bare) { cluster(cx, 40 + rnd() * 5, cz, 7); cluster(cx + (rnd() - 0.5) * 10, 36, cz + (rnd() - 0.5) * 10, 6); }
    } else if (kind === 'elm') {
      trunkH = 3.5; trunkR = 0.35; limb(cx, 0, cz, cx, 14, cz, 1.8);
      const n = 6;
      for (let i = 0; i < n; i++) {
        const a = i / n * 6.28 + rnd() * 0.5, L = 13 + rnd() * 6, ey = 44 + rnd() * 10;
        const ex = cx + Math.cos(a) * L, ez = cz + Math.sin(a) * L;
        limb(cx, 12, cz, ex, ey, ez, 1.0);
        cluster(ex, ey + 1, ez, 5.5 + rnd() * 2); cluster(cx + Math.cos(a) * L * 0.75, ey - 8, cz + Math.sin(a) * L * 0.75, 4 + rnd() * 1.5, 0.85);
      }
      cluster(cx, 56, cz, 6);
    } else {   // conifer
      trunkH = 1.5; trunkR = 0.3; limb(cx, 0, cz, cx, 60, cz, 1.0);
      for (let tier = 0; tier < 8; tier++) {
        const y0 = 8 + tier * 6.5, r0 = 13 - tier * 1.5;
        for (let j = 0; j < 8; j++) { const rr = r0 * (1 - j / 8); for (let i = Math.floor(cx - rr); i <= cx + rr; i++) for (let k2 = Math.floor(cz - rr); k2 <= cz + rr; k2++) { const d = Math.hypot(i + 0.5 - cx, k2 + 0.5 - cz); if (d > rr) continue; const h = hash(i * 13 + tier, k2 * 7 + j); if (d > rr - 1.2 && h < 0.3) continue; if (!m.get(i, y0 + j, k2)) m.set(i, y0 + j, k2, j < 2 ? ndD : h < 0.3 ? nd2 : nd); } }
      }
      m.set(cx, 63, cz, nd2);
    }
    const geo = AF.meshModel(m, { vs: 0.25, anchor: [0.5, 0, 0.5] });
    const out = { geo, trunkH, trunkR, crownR: Wd * 0.25 * 0.42 };
    treeCache.set(key, out);
    return out;
  };
  ST.plantTree = (kind, x, z, variant, o = {}) => {
    const t = ST.treeGeo(kind, variant), y = o.y ?? 0.25;
    AF.placeStatic(t.geo, x, y, z, (hash(Math.floor(x * 7), Math.floor(z * 5)) * 4) | 0, { collide: false });
    AF.addCollider(x - t.trunkR, y, z - t.trunkR, x + t.trunkR, y + Math.max(2.5, t.trunkH), z + t.trunkR);
    return t;
  };

  // ------------------------------------------------------------ road pieces + intersections
  const pieces = [];
  for (const r of P.roads) {
    const hor = r.a[1] === r.b[1];
    pieces.push({ name: r.name, hor, c: hor ? r.a[1] : r.a[0], t0: hor ? Math.min(r.a[0], r.b[0]) : Math.min(r.a[1], r.b[1]), t1: hor ? Math.max(r.a[0], r.b[0]) : Math.max(r.a[1], r.b[1]), w: r.w, tram: !!r.tram });
  }
  ST.pieces = pieces;
  const inter = [];
  for (const A of pieces) for (const B of pieces) {
    if (!A.hor || B.hor) continue;
    if (B.c >= A.t0 && B.c <= A.t1 && A.c >= B.t0 && A.c <= B.t1) {
      if (inter.find((I) => I.x === B.c && I.z === A.c)) continue;
      inter.push({ x: B.c, z: A.c, h: A, v: B, wh: A.w, wv: B.w });
    }
  }
  ST.intersections = inter;
  const crossAt = (p, t) => { for (const I of inter) { if (p.hor ? (I.z === p.c && I.x === t) : (I.x === p.c && I.z === t)) return I; } return null; };
  const nearInter = (p, t, pad) => { for (const I of inter) { if (p.hor ? I.z === p.c : I.x === p.c) { const ti = p.hor ? I.x : I.z, wo = p.hor ? I.wv : I.wh; if (Math.abs(t - ti) < wo / 2 + pad) return I; } } return null; };
  const extAt = (p, t) => { const I = crossAt(p, t); return I ? (p.hor ? I.wv : I.wh) / 2 : 0; };

  // ------------------------------------------------------------ v2 PAVING BY DISTRICT
  //   Old Town (x < -120): red brick · Harbour (z > 140): granite setts · Grand Ave theatre blocks: buff terrazzo with brass stars
  //   everywhere else (downtown): pale granite flags in 1 m slabs (pattern draws the joints; tone varies per flag)
  ST.district = (x, z) => z > 140 ? 'harbour' : x < -300 ? 'down' : x < -120 ? 'old' : (Math.abs(x) < 12 && z > 6 && z < 150) ? 'grand' : 'down';
  ST.paveCol = (x, z, bx, bz) => {
    const k = pal(), d = ST.district(x, z);
    if (d === 'old') { const h = hash(bx >> 1, bz); return (h > 0.985 && ((bx + bz) & 7) === 0) ? k.coal : k.brickP[Math.floor(h * 3) % 3]; }
    if (d === 'harbour') return k.settP[Math.floor(hash(bx >> 1, bz >> 1) * 3) % 3];
    if (d === 'grand') {
      const sx = ((bx % 16) + 16) % 16, sz = ((bz % 16) + 16) % 16;           // a brass star (plus + diagonals) every 4 m
      if ((sx === 8 && sz >= 6 && sz <= 10) || (sz === 8 && sx >= 6 && sx <= 10) || (Math.abs(sx - 8) === 1 && Math.abs(sz - 8) === 1)) return k.star;
      return k.terr[Math.floor(hash(bx >> 3, bz >> 3) * 2) & 1];
    }
    return k.slab[Math.floor(hash(bx >> 2, (bz >> 2) + 17) * 3) % 3];
  };

  // ------------------------------------------------------------ ROADS (order 150)
  AF.onBuild('streets-roads', 150, () => {
    const k = pal(), H = W.H, C = W.C, S = W.S;
    const mask = ST.mask = new Uint8Array(W.NX * W.NZ);   // 1 asphalt, 2 sidewalk
    const eachP = (p, e0, e1, band, fn) => {
      const x0 = p.hor ? p.t0 - e0 : p.c - band, x1 = p.hor ? p.t1 + e1 : p.c + band, z0 = p.hor ? p.c - band : p.t0 - e0, z1 = p.hor ? p.c + band : p.t1 + e1;
      W.eachCol(x0, z0, x1, z1, (bx, bz, i, x, z) => fn(i, p.hor ? x : z, p.hor ? z - p.c : x - p.c, bx, bz, x, z));
    };
    // sidewalks
    for (const p of pieces) {
      const e0 = extAt(p, p.t0) + 3, e1 = extAt(p, p.t1) + 3, sw = p.w / 2 + 3;
      eachP(p, e0, e1, sw, (i, t, d, bx, bz, x, z) => {
        const ad = Math.abs(d);
        H[i] = 1; mask[i] = 2; S[i] = k.kerb;
        if (ad < p.w / 2 + 0.25) { C[i] = k.kerb; return; }
        C[i] = ST.paveCol(x, z, bx, bz);
        // downtown: violet vault-light prism panels + the odd brass survey plaque along the building line
        if (ad > p.w / 2 + 2.0 && ad < p.w / 2 + 2.75 && ST.district(x, z) === 'down') {
          const seg = Math.floor(t / 2.5), hs = hash(seg + 3, (p.c | 0) * 7 + (d > 0 ? 1 : 0));
          if (hs < 0.07) C[i] = ((bx + bz) & 1) ? k.vault : k.vaultF;
          else if (hs > 0.995 && ((bx ^ bz) & 3) === 0) C[i] = k.star;
        }
      });
    }
    // asphalt
    for (const p of pieces) {
      const e0 = extAt(p, p.t0), e1 = extAt(p, p.t1);
      eachP(p, e0, e1, p.w / 2, (i, t, d, bx, bz) => {
        H[i] = 0; mask[i] = 1; S[i] = k.kerb;
        const n = AF.noise2(bx * 0.05, bz * 0.05), h1 = hash(bx, bz), ad = Math.abs(d);
        if (ad > p.w / 2 - 0.5) {   // dark gutter strip along the kerb, with drifts of fallen leaves
          const lf = AF.noise2(bx * 0.23 + 3.1, bz * 0.23 - 7.7);
          C[i] = lf > 0.62 && h1 < 0.8 ? (h1 < 0.3 ? k.leafR : h1 < 0.55 ? k.leafO : k.leafY) : (ad > p.w / 2 - 0.25 ? k.gutterW : k.gutter);
          return;
        }
        C[i] = k.asphW[Math.min(3, Math.floor((n * 0.8 + h1 * 0.2) * 4))];
      });
    }
    // rare rectangular patches (utility cuts)
    const rnd = AF.rng(1937);
    for (const p of pieces) for (let t = p.t0 + 20; t < p.t1 - 20; t += 30) {
      if (rnd() > 0.35) continue;
      const tt = t + rnd() * 10, dd = (rnd() - 0.5) * (p.w - 3), L = 1.5 + rnd() * 3, Wd = 1 + rnd() * 1.5, col = rnd() < 0.5 ? k.patch : k.patch2;
      eachP(p, 0, 0, p.w / 2, (i, t2, d) => { if (t2 > tt && t2 < tt + L && d > dd && d < dd + Wd && ST.mask[i] === 1) C[i] = col; });
    }
    // oil stains down the middle of each lane (dark ovals where cars idle)
    for (const p of pieces) for (let t = p.t0 + 7; t < p.t1 - 7; t += 9) {
      if (hash(t | 0, (p.c | 0) + 5) > 0.45) continue;
      const lane = (p.w === 20 ? 7.2 : p.w === 14 ? 3.5 : 2.5) * (hash((t | 0) + 3, p.c | 0) < 0.5 ? -1 : 1), cx = p.hor ? t : p.c + lane, cz = p.hor ? p.c + lane : t;
      W.eachCol(cx - 0.8, cz - 0.8, cx + 0.8, cz + 0.8, (bx, bz, i, px, pz) => { const a = p.hor ? (px - cx) / 0.8 : (px - cx) / 0.45, b = p.hor ? (pz - cz) / 0.45 : (pz - cz) / 0.8; if (a * a + b * b < 1 && mask[i] === 1 && hash(bx, bz + 3) < 0.8) C[i] = k.oil; });
    }
    // markings (worn: a few blocks of each line have scuffed off)
    for (const p of pieces) {
      const avenue = p.w === 14, tram = p.w === 20;
      eachP(p, 0, 0, p.w / 2, (i, t, d, bx, bz) => {
        if (nearInter(p, t, 4.5)) return;
        const ad = Math.abs(d), tb = Math.floor(t * 4), worn = hash(bx + 11, bz - 5) < 0.16;
        if (worn) return;
        if (avenue) { if (ad > 0.125 && ad < 0.375) C[i] = k.yellowW; else if (Math.abs(ad - 3.5) < 0.125 && tb % 24 < 12) C[i] = k.whiteW; }
        else if (tram) { if (ad > 3.0 && ad < 3.25) C[i] = k.whiteW; }
        else if (ad < 0.125 && tb % 24 < 12) C[i] = k.yellowW;
      });
    }
    // zebra crosswalks on every leg of every intersection (avenue ones are wider)
    for (const I of inter) {
      const big = I.wh >= 14 || I.wv >= 14;
      const wz = big ? 3.5 : 2.5;
      // legs along the horizontal road (east + west): stripes run along x
      for (const sgn of [-1, 1]) {
        const x0 = I.x + sgn * (I.wv / 2 + 0.75), x1 = x0 + sgn * wz;
        W.eachCol(Math.min(x0, x1), I.z - I.wh / 2, Math.max(x0, x1), I.z + I.wh / 2, (bx, bz, i, x, z) => { if (ST.mask[i] === 1 && (bz & 3) < 2 && Math.abs(z - I.z) < I.wh / 2 - 0.4) C[i] = k.white; });
        const z0 = I.z + sgn * (I.wh / 2 + 0.75), z1 = z0 + sgn * wz;
        W.eachCol(I.x - I.wv / 2, Math.min(z0, z1), I.x + I.wv / 2, Math.max(z0, z1), (bx, bz, i, x, z) => { if (ST.mask[i] === 1 && (bx & 3) < 2 && Math.abs(x - I.x) < I.wv / 2 - 0.4) C[i] = k.white; });
      }
    }
    // manholes (painted iron covers in the lanes)
    const man = AF.manholes = [];
    for (const p of pieces) for (let t = p.t0 + 13; t < p.t1 - 5; t += 37) {
      if (nearInter(p, t, 5)) continue;
      const lane = p.w === 20 ? 6.5 : p.w === 14 ? 1.8 : 1.3, d = (hash(t | 0, p.c | 0) < 0.5 ? -1 : 1) * lane;
      const x = p.hor ? t : p.c + d, z = p.hor ? p.c + d : t;
      W.eachCol(x - 0.5, z - 0.5, x + 0.5, z + 0.5, (bx, bz, i, px, pz) => { const r = Math.hypot(px - x, pz - z); if (r < 0.5) C[i] = r > 0.34 ? k.manhole : ((bx + bz) & 1) ? k.manhole2 : k.manhole; });
      man.push({ x, z });
    }
    W.tDirty = true;
  });

  // ------------------------------------------------------------ prop models
  const geoCache = {};
  const G = (name, fn) => geoCache[name] || (geoCache[name] = fn());
  // v2 lamps: bottle-green fluted cast iron with brass bands. false = acorn-globe post · true = twin-globe avenue standard · 'crook' = bishop's crook
  const lampGeo = (twin) => G('lamp' + twin, () => {
    const k = pal(), G1 = k.lampG, G2 = k.lampGH, B = k.brass;
    if (twin === 'crook') {
      const m = new AF.Model(13, 44, 7);
      m.box(0, 0, 0, 7, 3, 7, G1); m.box(1, 3, 1, 6, 6, 6, G2); m.box(1, 6, 1, 6, 7, 6, B);
      for (let y = 7; y < 38; y++) { m.box(2, y, 2, 5, y + 1, 5, G1); m.set(2, y, 2, G2); m.set(4, y, 4, G2); if (y % 10 === 0) m.box(2, y, 2, 5, y + 1, 5, B); }
      // the crook: up, over and down to a hanging lantern
      for (const [x, y] of [[3, 38], [3, 39], [4, 40], [5, 41], [6, 41], [7, 41], [8, 41], [9, 40], [10, 39], [10, 38]]) m.box(x, y, 3, x + 1, y + 1, 4, G1);
      m.box(4, 34, 3, 5, 35, 4, G1); m.box(5, 35, 3, 6, 36, 4, G1); m.box(6, 36, 3, 7, 38, 4, G1);   // scroll brace
      m.box(9, 36, 2, 12, 38, 5, G1); m.set(10, 38, 3, B);
      m.box(9, 31, 2, 12, 36, 5, k.glow); m.box(8, 30, 1, 13, 31, 6, G1); m.box(10, 29, 3, 11, 30, 4, B);
      return AF.meshModel(m, { vs: 1 / 8 });
    }
    const m = new AF.Model(twin ? 17 : 7, 42, 7), cx = twin ? 8 : 3;
    m.box(cx - 3, 0, 0, cx + 4, 3, 7, G1); m.box(cx - 2, 3, 1, cx + 3, 6, 6, G2); m.box(cx - 2, 6, 1, cx + 3, 7, 6, B);
    for (let y = 7; y < 30; y++) { m.box(cx - 1, y, 2, cx + 2, y + 1, 5, G1); m.set(cx - 1, y, 2, G2); m.set(cx + 1, y, 4, G2); if (y === 14 || y === 22) m.box(cx - 1, y, 2, cx + 2, y + 1, 5, B); }
    m.box(cx - 1, 30, 2, cx + 2, 31, 5, B);
    if (!twin) { m.box(0, 27, 3, 7, 28, 4, G1); m.box(1, 31, 1, 6, 32, 6, G1); m.sphere(3.5, 35, 3.5, 3.2, k.glow); m.box(2, 38, 2, 5, 39, 5, G1); m.set(3, 39, 3, B); m.set(3, 40, 3, B); }
    else {
      m.box(1, 31, 3, 16, 32, 4, G1); m.box(cx, 31, 3, cx + 1, 36, 4, G1); m.sphere(cx + 0.5, 37.5, 3.5, 1.6, k.glow); m.set(cx, 40, 3, B);
      for (const lx of [2, 14]) { m.box(lx - 1, 30, 2, lx + 2, 31, 5, G1); m.sphere(lx + 0.5, 27, 3.5, 2.6, k.glow); m.box(lx - 1, 29, 2, lx + 2, 30, 5, B); m.set(lx, 23, 3, G1); }
      m.box(3, 32, 3, 4, 33, 4, G2); m.box(13, 32, 3, 14, 33, 4, G2);
    }
    return AF.meshModel(m, { vs: 1 / 8 });
  });
  const guardGeo = () => G('guard', () => { const k = pal(), m = new AF.Model(12, 8, 12); for (let x = 0; x < 12; x++) for (let z = 0; z < 12; z++) { if (x > 0 && x < 11 && z > 0 && z < 11) continue; if ((x + z) % 2 === 0) m.box(x, 0, z, x + 1, 7, z + 1, k.lampG); m.set(x, 7, z, k.lampG); m.set(x, 3, z, k.lampG); } for (const [x, z] of [[0, 0], [11, 0], [0, 11], [11, 11]]) m.set(x, 7, z, k.brass); return AF.meshModel(m, { vs: 1 / 8 }); });
  const hydrantGeo = () => G('hyd', () => { const k = pal(), m = new AF.Model(6, 8, 6); m.box(1, 0, 1, 5, 1, 5, k.redD); m.box(2, 1, 2, 4, 6, 4, k.red); m.box(0, 3, 2, 6, 4, 4, k.redD); m.box(2, 6, 2, 4, 7, 4, k.chrome); m.set(2, 7, 2, k.red); return AF.meshModel(m, { vs: 1 / 8 }); });
  const mailboxGeo = () => G('mail', () => { const k = pal(), ol = AF.col(0x4e5b3a, { jitter: 0.12, edge: 0.3, rough: 0.5 }), olD = AF.col(0x3a4429, { jitter: 0.12, edge: 0.3 }), m = new AF.Model(5, 10, 5); m.box(0, 0, 0, 1, 3, 1, olD); m.box(4, 0, 0, 5, 3, 1, olD); m.box(0, 0, 4, 1, 3, 5, olD); m.box(4, 0, 4, 5, 3, 5, olD); m.box(0, 3, 0, 5, 9, 5, ol); m.box(1, 9, 0, 4, 10, 5, ol); m.box(1, 7, 4, 4, 8, 5, olD); m.box(1, 5, 4, 4, 6, 5, k.cream); m.set(2, 8, 4, k.brass); return AF.meshModel(m, { vs: 1 / 8 }); });
  const callboxGeo = () => G('call', () => { const k = pal(), m = new AF.Model(5, 22, 5); m.box(1, 0, 1, 4, 2, 4, k.navy); m.box(2, 2, 2, 3, 13, 3, k.navy); m.box(0, 13, 0, 5, 19, 5, k.blue); m.box(1, 14, 4, 4, 18, 5, k.blueD); m.box(2, 16, 4, 3, 17, 5, k.brass); m.box(1, 19, 1, 4, 20, 4, k.navy); m.box(2, 20, 2, 3, 22, 3, k.glow); return AF.meshModel(m, { vs: 1 / 8 }); });
  const trashGeo = () => G('trash', () => { const k = pal(), m = new AF.Model(5, 8, 5); for (let y = 0; y < 7; y++) for (let x = 0; x < 5; x++) for (let z = 0; z < 5; z++) { if (x > 0 && x < 4 && z > 0 && z < 4 && y > 0) continue; if ((x + z + y) % 2 === 0 || y === 0 || y === 6) m.set(x, y, z, k.greenP); } m.box(1, 5, 1, 4, 6, 4, k.paper); return AF.meshModel(m, { vs: 1 / 8 }); });
  const benchGeo = () => G('bench', () => { const k = pal(), m = new AF.Model(14, 7, 5); for (const x of [1, 12]) { m.box(x, 0, 0, x + 1, 4, 4, k.iron); m.box(x, 4, 3, x + 1, 7, 5, k.iron); } for (const z of [0, 1.5 | 0, 3]) m.box(0, 3, z, 14, 4, z + 1, k.wood); m.box(0, 5, 4, 14, 6, 5, k.woodL); m.box(0, 6, 4, 14, 7, 5, k.wood); return AF.meshModel(m, { vs: 1 / 8 }); });
  ST.benchGeo = benchGeo; ST.lampGeo = lampGeo; ST.trashGeo = trashGeo;
  const newsstandGeo = () => G('news', () => {
    const k = pal(), m = new AF.Model(16, 20, 10);
    m.box(0, 0, 0, 16, 1, 10, k.woodD); m.box(0, 1, 0, 1, 16, 10, k.greenP); m.box(15, 1, 0, 16, 16, 10, k.greenP); m.box(0, 1, 0, 16, 16, 1, k.greenP);
    // posters + a NEWS panel on the back and sides
    for (const [x0, y0, c1] of [[1, 3, k.red], [6, 3, k.cream], [11, 3, k.jade], [1, 9, k.paper], [6, 9, k.blue], [11, 9, k.red]]) { m.box(x0, y0, 0, x0 + 4, y0 + 5, 1, c1); m.box(x0 + 1, y0 + 3, 0, x0 + 3, y0 + 4, 1, k.black); }
    for (const x of [0, 15]) for (const [z0, c1] of [[1, k.cream], [5, k.red]]) m.box(x, 4, z0, x + 1, 12, z0 + 3, c1);
    m.box(1, 1, 7, 15, 6, 10, k.wood);                                // counter
    for (let x = 1; x < 15; x += 2) { m.box(x, 6, 7, x + 2, 7, 10, (x & 2) ? k.paper : k.paper2); m.set(x, 7, 8, k.paper); }
    for (let y = 8; y < 15; y += 3) for (let x = 1; x < 15; x += 3) m.box(x, y, 1, x + 2, y + 2, 2, [k.red, k.paper, k.jade, k.cream, k.blue][(x + y) % 5]);
    m.box(0, 16, 0, 16, 17, 10, k.greenP); for (let x = -0; x < 16; x++) m.box(x, 15, 10 - 0, x + 1, 16, 10, (x >> 1) & 1 ? k.cream : k.greenP);
    for (let x = 0; x < 16; x++) m.set(x, 15, 9, (x >> 1) & 1 ? k.cream : k.greenP);
    m.box(2, 17, 1, 14, 20, 2, k.cream); for (let x = 3; x < 13; x += 2) m.set(x, 18, 2, k.red);
    return AF.meshModel(m, { vs: 1 / 8 });
  });
  const clockPostGeo = () => G('clock', () => {
    const k = pal(), m = new AF.Model(9, 38, 9);
    m.box(1, 0, 1, 8, 3, 8, k.iron); m.box(2, 3, 2, 7, 5, 7, k.ironHi); m.box(3, 5, 3, 6, 28, 6, k.greenP);
    for (let y = 8; y < 28; y += 5) m.box(3, y, 3, 6, y + 1, 6, k.brass);
    m.box(1, 28, 1, 8, 37, 8, k.greenP); m.box(1, 29, 0, 8, 36, 9, k.face); m.box(0, 29, 1, 9, 36, 8, k.face);
    m.box(1, 37, 1, 8, 38, 8, k.brass); m.set(4, 37, 4, k.brass);
    return AF.meshModel(m, { vs: 1 / 8 });
  });
  const bladeGeo = (name) => G('blade' + name, () => {
    const k = pal(), txt = AF.textModel(name, k.signW, { pad: 1 });
    const m = new AF.Model(txt.w, txt.h, 3);
    m.box(0, 0, 1, txt.w, txt.h, 2, k.signG);
    for (let x = 0; x < txt.w; x++) for (let y = 0; y < txt.h; y++) if (txt.get(x, y, 0)) { m.set(x, y, 2, k.signW); m.set(txt.w - 1 - x, y, 0, k.signW); }
    return AF.meshModel(m, { vs: 1 / 28, anchor: [0.5, 0, 0.5] });
  });
  const postGeo = () => G('post', () => { const k = pal(), m = new AF.Model(3, 54, 3); m.box(0, 0, 0, 3, 3, 3, k.iron); m.box(1, 3, 1, 2, 53, 2, k.greenP); m.set(1, 53, 1, k.brass); return AF.meshModel(m, { vs: 1 / 16 }); });
  const busSignGeo = () => G('bus', () => {
    const k = pal(), m = new AF.Model(9, 42, 3);
    m.box(4, 0, 1, 5, 32, 2, k.iron); m.sphere(4.5, 36, 1.5, 4.2, k.red, (x, y, z) => (z === 1 ? (Math.hypot(x + 0.5 - 4.5, y + 0.5 - 36) < 2.6 ? k.cream : k.red) : 0));
    m.box(2, 35, 0, 7, 37, 3, k.navy);
    return AF.meshModel(m, { vs: 1 / 8 });
  });
  const grateGeo = () => G('grate', () => { const k = pal(), m = new AF.Model(10, 1, 10); for (let x = 0; x < 10; x++) for (let z = 0; z < 10; z++) if (x === 0 || z === 0 || x === 9 || z === 9 || ((x + z) & 1) === 0) if (!(x > 3 && x < 6 && z > 3 && z < 6)) m.set(x, 0, z, k.grate); return AF.meshModel(m, { vs: 1 / 8 }); });
  const flagGeo = () => G('flag', () => { const k = pal(), m = new AF.Model(1, 6, 10); for (let y = 0; y < 6; y++) for (let z = 0; z < 10; z++) m.set(0, y, z, z < 4 && y > 2 ? k.navy : (y & 1) ? k.red : k.cream); if (1) { m.set(0, 4, 1, k.cream); m.set(0, 4, 3, k.cream); } return AF.meshModel(m, { vs: 1 / 8, anchor: [0.5, 0, 0] }); });

  const put = (geo, x, y, z, rot, collide) => AF.placeStatic(geo, x, y, z, rot, { collide: !!collide });
  const onWalk = (x, z) => { const i = W.col(x, z); return i >= 0 && ST.mask && ST.mask[i] === 2 && W.H[i] === 1 && !W.getM(x, 0.4, z) && !W.getM(x, 1.2, z); };
  const claimed = [];
  const free = (x, z, r) => { for (const c of claimed) if (Math.abs(c[0] - x) < r + c[2] && Math.abs(c[1] - z) < r + c[2]) return false; return true; };
  const claim = (x, z, r) => claimed.push([x, z, r]);
  ST.claim = claim; ST.free = free; ST.onWalk = onWalk;

  // ------------------------------------------------------------ STREET FURNITURE (order 400)
  AF.onBuild('streets-furniture', 480, () => {
    const noPark = ST.noPark = [];
    const k = pal(), cnt = ST.counts = { lamps: 0, hydrants: 0, mailboxes: 0, callboxes: 0, newsstands: 0, clocks: 0, benches: 0, trash: 0, blades: 0, busStops: 0, trees: 0, trafficLights: 0 };
    // pave the gaps between the Wren St / Anchor St sidewalks and the fill walls (never under a building voxel)
    {
      const strips = [[-253, -232, -248, 147], [248, -232, 253, -10]];
      for (const [x0, z0, x1, z1] of strips) W.eachCol(x0, z0, x1, z1, (bx, bz, i, x, z) => {
        if (W.getM(x, 0.375, z) || W.getM(x, 0.625, z) || W.getM(x, 0.875, z)) return;
        W.H[i] = 1; ST.mask[i] = 2; W.S[i] = k.kerb;
        W.C[i] = ST.paveCol(x, z, bx, bz);
      });
      W.tDirty = true;
      for (const [sx, zs] of [[-250.5, [-190, -110, -30, 50, 120]], [250.5, [-190, -130, -70]]]) for (const z of zs) {
        if (!onWalk(sx, z) || !free(sx, z, 0.6)) continue;
        put(lampGeo(false), sx, 0.25, z, 1); AF.addCollider(sx - 0.2, 0.25, z - 0.2, sx + 0.2, 4.8, z + 0.2); claim(sx, z, 0.8);
        AF.addLight({ x: sx, y: 4.4, z, color: 0xffcf8a, intensity: 1.2, range: 15, kind: 'street' });
        const hz = z + 9; if (onWalk(sx, hz) && free(sx, hz, 0.4)) { put(hydrantGeo(), sx, 0.25, hz, 0, true); noPark.push({ x: sx, z: hz, r: 3, kind: 'hydrant' }); claim(sx, hz, 0.5); }
      }
    }
    // Civic Plaza -> City Hall walking axis: keep x -44..-38 clear on both Charter St sidewalks
    for (let x = -44; x <= -38; x += 1) for (const z of [-86.5, -84.5, -75.5, -73.5]) claim(x, z, 1.1);
    // keep every registered doorway clear of furniture
    for (const b of AF.buildings) for (const d of b.doors || []) { claim(d.x, d.z, 1.5); claim(d.x + Math.sin(d.yaw || 0) * -1.2, d.z + Math.cos(d.yaw || 0) * -1.2, 1.3); }
    const abbrev = (n) => n.replace('Street', 'St').replace('Avenue', 'Ave').replace('Boulevard', 'Blvd');
    // --- traffic lights (Grand / Meridian / Broad / Library crossings)
    const TL = [];
    {
      const poleM = new AF.Model(6, 96, 6); poleM.box(1, 0, 1, 5, 4, 5, k.iron); poleM.box(2, 4, 2, 4, 94, 4, k.greenP); poleM.box(1, 94, 1, 5, 96, 5, k.brass);
      for (let y = 10; y < 90; y += 12) poleM.box(2, y, 2, 4, y + 1, 4, k.brass);
      const headM = new AF.Model(10, 16, 10); headM.box(2, 1, 2, 8, 15, 8, k.greenP); headM.box(4, 15, 4, 6, 16, 6, k.brass); headM.box(3, 0, 3, 7, 1, 7, k.iron);
      for (const ly of [3, 7, 11]) { headM.box(3, ly, 1, 7, ly + 3, 2, k.black); headM.box(3, ly, 8, 7, ly + 3, 9, k.black); headM.box(1, ly, 3, 2, ly + 3, 7, k.black); headM.box(8, ly, 3, 9, ly + 3, 7, k.black);
        headM.box(3, ly + 3, 0, 7, ly + 4, 2, k.iron); headM.box(3, ly + 3, 8, 7, ly + 4, 10, k.iron); headM.box(0, ly + 3, 3, 2, ly + 4, 7, k.iron); headM.box(8, ly + 3, 3, 10, ly + 4, 7, k.iron); }
      const pole = AF.meshModel(poleM, { vs: 1 / 16 }), head = AF.meshModel(headM, { vs: 1 / 16 });
      const lensGeo = new THREE.BoxGeometry(0.2, 0.2, 0.05), lensMat = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
      const sel = inter.filter((I) => /Grand|Meridian|Broad|Library/.test(I.h.name) || /Grand|Meridian|Broad|Library/.test(I.v.name));
      const lens = new THREE.InstancedMesh(lensGeo, lensMat, sel.length * 4 * 6);
      const dummy = new THREE.Object3D(); let li = 0;
      sel.forEach((I, n) => {
        const L = { x: I.x, z: I.z, off: (n * 7.3) % 28, idx: [] };
        for (const [sx, sz] of [[1, 1], [-1, -1], [1, -1], [-1, 1]]) {
          const px = I.x + sx * (I.wv / 2 + 0.6), pz = I.z + sz * (I.wh / 2 + 0.6);
          put(pole, px, 0.25, pz, 0); AF.addCollider(px - 0.15, 0.25, pz - 0.15, px + 0.15, 6, pz + 0.15); claim(px, pz, 1.2);
          const hy = 4.3; put(head, px, hy, pz, 0);
          for (const [fx, fz] of [[sx, 0], [0, sz]]) {
            ['red', 'amber', 'green'].forEach((colName, r) => {
              dummy.position.set(px + fx * 0.315, hy + [11.5, 7.5, 3.5][r] / 16 + 0.03, pz + fz * 0.315);
              dummy.rotation.set(0, Math.atan2(fx, fz), 0); dummy.updateMatrix(); lens.setMatrixAt(li, dummy.matrix);
              L.idx.push({ i: li, axis: fz !== 0 ? 'z' : 'x', col: colName }); li++;
            });
          }
        }
        TL.push(L);
      });
      lens.count = li; lens.frustumCulled = false; AF.scene.add(lens);
      const COL = { red: [new THREE.Color(0xff2a1a), new THREE.Color(0x3a1210)], amber: [new THREE.Color(0xffb020), new THREE.Color(0x3a2a10)], green: [new THREE.Color(0x40ff70), new THREE.Color(0x10301a)] };
      const CYCLE = 28;
      const stateAt = (L, axis) => {
        const ph = ((AF.clock.t + L.off) % CYCLE + CYCLE) % CYCLE;
        if (axis === 'x') return ph < 10.5 ? 'green' : ph < 13.5 ? 'amber' : 'red';
        return ph < 14 ? 'red' : ph < 24.5 ? 'green' : ph < 27.5 ? 'amber' : 'red';
      };
      AF.trafficLight = {
        at: TL.map((L) => [L.x, L.z]), stateAt,
        state(x, z, dirAxis) {
          let axis = 'x';
          if (dirAxis === 'z' || dirAxis === 1 || dirAxis === 2 || dirAxis === false) axis = 'z';
          else if (Array.isArray(dirAxis)) axis = Math.abs(dirAxis[0]) >= Math.abs(dirAxis[1]) ? 'x' : 'z';
          else if (dirAxis && typeof dirAxis === 'object') { const dx = dirAxis.x ?? dirAxis.dx ?? 0, dz = dirAxis.z ?? dirAxis.dz ?? 0; axis = Math.abs(dx) >= Math.abs(dz) ? 'x' : 'z'; }
          let best = null, bd = 20;
          for (const L of TL) { const d = Math.hypot(L.x - x, L.z - z); if (d < bd) { bd = d; best = L; } }
          return best ? stateAt(best, axis) : 'green';
        },
      };
      let acc = 0;
      AF.onTick('streets-traffic-lights', 190, (dt) => {
        acc += dt; if (acc < 0.2) return; acc = 0;
        for (const L of TL) { const sx = stateAt(L, 'x'), sz = stateAt(L, 'z'); for (const e of L.idx) lens.setColorAt(e.i, COL[e.col][(e.axis === 'x' ? sx : sz) === e.col ? 0 : 1]); }
        if (lens.instanceColor) lens.instanceColor.needsUpdate = true;
      });
      for (const L of TL) for (const e of L.idx) lens.setColorAt(e.i, COL[e.col][1]);
      cnt.trafficLights = TL.length;
    }
    // --- corners: street-name blades at EVERY corner, + hydrants / mailboxes / call boxes / trash by hash
    const post = postGeo();
    let ci = 0;
    for (const I of inter) {
      const nh = abbrev(I.h.name).toUpperCase(), nv = abbrev(I.v.name).toUpperCase();
      for (const [sx, sz] of [[1, 1], [-1, -1], [1, -1], [-1, 1]]) {
        const cx = I.x + sx * (I.wv / 2 + 1.6), cz = I.z + sz * (I.wh / 2 + 1.6);
        if (!onWalk(cx, cz)) continue;
        ci++;
        // name blade post at the corner (nudged if a traffic light owns it)
        const bx = I.x + sx * (I.wv / 2 + 0.55), bz = I.z + sz * (I.wh / 2 + 2.2);
        if (onWalk(bx, bz) && free(bx, bz, 0.4)) {
          put(post, bx, 0.25, bz, 0); AF.addCollider(bx - 0.1, 0.25, bz - 0.1, bx + 0.1, 3.5, bz + 0.1); claim(bx, bz, 0.5);
          put(bladeGeo(nh), bx, 2.92, bz, 0); put(bladeGeo(nv), bx, 3.19, bz, 1); cnt.blades++;
        }
        const r = hash(ci * 7 + 3, 91);
        const hx = I.x + sx * (I.wv / 2 + 0.6), hz = I.z + sz * (I.wh / 2 + 4.0);
        if (onWalk(hx, hz) && free(hx, hz, 0.4)) { put(hydrantGeo(), hx, 0.25, hz, 0, true); noPark.push({ x: hx, z: hz, r: 3, kind: 'hydrant' }); claim(hx, hz, 0.5); cnt.hydrants++; }
        const mx = I.x + sx * (I.wv / 2 + 4.2), mz = I.z + sz * (I.wh / 2 + 0.6);
        if (onWalk(mx, mz) && free(mx, mz, 0.5)) {
          if (r < 0.4) { put(mailboxGeo(), mx, 0.25, mz, sz > 0 ? 2 : 0, true); cnt.mailboxes++; }
          else if (r < 0.62) { put(callboxGeo(), mx, 0.25, mz, 0, true); cnt.callboxes++; (ST.callboxPts = ST.callboxPts || []).push([mx, mz]); }
          else { put(trashGeo(), mx, 0.25, mz, 0, true); cnt.trash++; }
          claim(mx, mz, 0.6);
        }
      }
    }
    // --- newsstands, street clocks, bus stops (explicit, on avenue corners)
    const newsAt = [[0, 0, 1, 1], [0, 80, -1, 1], [-80, 0, 1, -1], [80, 0, -1, 1], [0, -80, 1, -1], [-160, 0, 1, 1], [160, 0, -1, -1], [0, 160, 1, -1], [80, -80, -1, 1], [-80, 80, 1, -1], [80, 80, 1, 1], [-80, -80, -1, 1], [160, -80, -1, 1], [-160, 80, 1, -1], [0, -160, -1, 1]];
    for (const [x, z, sx, sz] of newsAt) {
      const I = inter.find((q) => q.x === x && q.z === z); if (!I) continue;
      const px = I.x + sx * (I.wv / 2 + 8), pz = I.z + sz * (I.wh / 2 + 1.9);
      if (!onWalk(px, pz) || !free(px, pz, 1.2)) continue;
      put(newsstandGeo(), px, 0.25, pz, sz > 0 ? 2 : 0, true); claim(px, pz, 1.4); cnt.newsstands++; (ST.newsPts = ST.newsPts || []).push({ x: px, z: pz, rot: sz > 0 ? 2 : 0 });
      AF.addSpot({ building: 'street', x: px, y: 0.25, z: pz - sz * 1.4, yaw: sz > 0 ? 0 : Math.PI, kind: 'browse' });
    }
    const clockAt = [[0, 0, -1, -1], [0, 160, -1, -1], [-80, 0, -1, 1], [80, -160, -1, 1]];
    const clocks = ST.clocks = [];
    for (const [x, z, sx, sz] of clockAt) {
      const I = inter.find((q) => q.x === x && q.z === z); if (!I) continue;
      const px = I.x + sx * (I.wv / 2 + 5), pz = I.z + sz * (I.wh / 2 + 0.7);
      put(clockPostGeo(), px, 0.25, pz, 0); AF.addCollider(px - 0.3, 0.25, pz - 0.3, px + 0.3, 5, pz + 0.3); claim(px, pz, 0.8); cnt.clocks++;
      clocks.push({ x: px, z: pz, y: 0.25 + 32.5 / 8 });
    }
    {
      const hm = new THREE.MeshBasicMaterial({ color: 0x1a1a1a });
      const hG = new THREE.BoxGeometry(0.05, 0.3, 0.02), mG = new THREE.BoxGeometry(0.04, 0.42, 0.02);
      hG.translate(0, 0.13, 0); mG.translate(0, 0.19, 0);
      const hands = [];
      for (const c of clocks) for (let f = 0; f < 4; f++) {
        const a = f * Math.PI / 2, off = 0.57;
        const g = new THREE.Group(); g.position.set(c.x + Math.sin(a) * off, c.y, c.z + Math.cos(a) * off); g.rotation.y = a;
        const h = new THREE.Mesh(hG, hm), m = new THREE.Mesh(mG, hm); g.add(h, m); AF.scene.add(g); hands.push([h, m]);
      }
      AF.onTick('streets-clocks', 330, () => {
        const hr = AF.time.hours;
        for (const [h, m] of hands) { h.rotation.z = -(hr % 12) / 12 * Math.PI * 2; m.rotation.z = -(hr % 1) * Math.PI * 2; }
      });
    }
    const busStops = AF.busStops = [];
    for (const p of pieces) {
      if (!/Meridian|Grand|Bay|Charter|Broad/.test(p.name)) continue;
      for (let t = p.t0 + 40; t < p.t1 - 20; t += 80) {
        for (const sd of [-1, 1]) {
          const tt = t + sd * 6, d = sd * (p.w / 2 + 0.7);
          const x = p.hor ? tt : p.c + d, z = p.hor ? p.c + d : tt;
          if (nearInter(p, tt, 10) || !onWalk(x, z) || !free(x, z, 0.8)) continue;
          put(busSignGeo(), x, 0.25, z, p.hor ? 0 : 1); AF.addCollider(x - 0.1, 0.25, z - 0.1, x + 0.1, 3, z + 0.1); claim(x, z, 1);
          const yaw = p.hor ? (sd > 0 ? Math.PI / 2 : -Math.PI / 2) : (sd > 0 ? Math.PI : 0);
          const ld = sd * (p.w / 2 - 1.3);
          busStops.push({ x: p.hor ? tt : p.c + ld, z: p.hor ? p.c + ld : tt, yaw, signX: x, signZ: z, road: p.name });
          cnt.busStops++;
          for (let q = 0; q < 2; q++) AF.addSpot({ building: 'street', x: p.hor ? x + 1 + q : x + sd * 1.2, y: 0.25, z: p.hor ? z + sd * 1.2 : z + 1 + q, yaw: p.hor ? (sd > 0 ? Math.PI : 0) : (sd > 0 ? -Math.PI / 2 : Math.PI / 2), kind: 'stand' });
        }
      }
    }
    // --- STREET LIFE: traffic cop, flower carts, hot-dog stands, shoeshine, sandwich boards, NO PARKING / STREETCAR STOP signs,
    //     fire-alarm boxes, café tables (all keep doors clear via claim/free)
    {
      const c = AF.col, cream = k.cream, canv = c(0xc8372b, { jitter: 0.1, edge: 0.2 }), yel = c(0xe7b83c, { jitter: 0.2, edge: 0.3 });
      const flw = [c(0xd23b3b, { jitter: 0.5 }), c(0xf0c040, { jitter: 0.5 }), c(0xe070a0, { jitter: 0.5 }), c(0xf2ece0, { jitter: 0.5 }), c(0x9a5ad0, { jitter: 0.5 })];
      const umb = (m, cx, cy, cz, r, a, b) => { for (let x = 0; x < m.w; x++) for (let z = 0; z < m.d; z++) { const d = Math.hypot(x + 0.5 - cx, z + 0.5 - cz); if (d < r) m.set(x, cy - Math.floor(d / (r / 2.5)), z, (Math.floor((Math.atan2(z + 0.5 - cz, x + 0.5 - cx) + Math.PI) / (Math.PI * 2) * 12) & 1) ? a : b); } };
      const copG = G('cop', () => { const m = new AF.Model(29, 32, 29); for (let x = 0; x < 29; x++) for (let z = 0; z < 29; z++) { const d = Math.hypot(x + 0.5 - 14.5, z + 0.5 - 14.5); if (d < 5.2) for (let y = 0; y < 10; y++) m.set(x, y, z, y === 9 ? k.iron : d > 4.3 ? ((y >> 1) & 1 ? k.black : k.white) : k.white); } m.box(14, 10, 14, 15, 29, 15, k.iron); umb(m, 14.5, 30, 14.5, 14.5, canv, cream); m.set(14, 31, 14, k.brass); return AF.meshModel(m, { vs: 1 / 8 }); });
      const flowerG = G('flowercart', () => { const m = new AF.Model(16, 24, 9); m.box(0, 3, 0, 16, 7, 9, k.woodL); m.box(0, 7, 0, 16, 8, 9, k.wood); for (const x of [2, 13]) m.box(x, 0, 0, x + 2, 4, 1, k.woodD), m.box(x, 0, 8, x + 2, 4, 9, k.woodD); for (let x = 1; x < 15; x += 3) for (let z = 1; z < 8; z += 3) { m.box(x, 8, z, x + 2, 10, z + 2, k.greenP); m.box(x, 10, z, x + 2, 12, z + 2, flw[(x + z) % 5]); } m.box(7, 8, 4, 8, 22, 5, k.woodD); umb(m, 7.5, 22, 4.5, 8, cream, k.greenP); m.line(15, 5, 4, 16, 5, 4, k.woodD); return AF.meshModel(m, { vs: 1 / 8 }); });
      const hotdogG = G('hotdog', () => { const m = new AF.Model(14, 24, 8); m.box(1, 3, 1, 13, 9, 7, k.chrome); m.box(1, 5, 7, 13, 7, 8, yel); m.box(0, 9, 0, 14, 10, 8, k.chrome); m.box(2, 10, 2, 5, 12, 5, k.chrome); m.box(8, 10, 3, 10, 11, 5, yel); for (const x of [2, 11]) m.box(x, 0, 0, x + 1, 3, 2, k.black), m.box(x, 0, 6, x + 1, 3, 8, k.black); m.box(6, 10, 3, 7, 22, 4, k.chrome); umb(m, 6.5, 22, 3.5, 7.5, yel, canv); return AF.meshModel(m, { vs: 1 / 8 }); });
      const shineG = G('shine', () => { const m = new AF.Model(10, 16, 10); m.box(0, 0, 0, 10, 4, 10, k.woodD); m.box(1, 4, 3, 9, 6, 9, k.wood); m.box(1, 6, 8, 9, 14, 10, k.redD); m.box(0, 6, 3, 1, 9, 10, k.wood); m.box(9, 6, 3, 10, 9, 10, k.wood); m.box(2, 4, 0, 4, 5, 2, k.brass); m.box(6, 4, 0, 8, 5, 2, k.brass); m.box(3, 0, -0, 7, 2, 0 + 1, k.brass); return AF.meshModel(m, { vs: 1 / 8 }); });
      const boardG = (v) => G('sboard' + v, () => { const m = new AF.Model(6, 8, 4); for (let y = 0; y < 8; y++) { const o = Math.floor(y / 4); m.box(0, y, o, 6, y + 1, o + 1, y === 7 ? k.woodD : k.black); m.box(0, y, 3 - o, 6, y + 1, 4 - o, y === 7 ? k.woodD : k.black); } for (let y = 1; y < 6; y += 2) for (let x = 1; x < 5; x++) if (hash(x + v, y) < 0.7) m.set(x, y, 0, y === 5 ? [canv, yel, k.white][v % 3] : k.white); return AF.meshModel(m, { vs: 1 / 8 }); });
      const plateG = (txt, fg, bg) => G('plate' + txt, () => { const t = AF.textModel(txt, fg, { pad: 1 }), m = new AF.Model(t.w, t.h + 2, 3); m.box(0, 0, 1, t.w, t.h + 2, 2, bg); m.box(0, t.h + 1, 0, t.w, t.h + 2, 3, fg); for (let x = 0; x < t.w; x++) for (let y = 0; y < t.h; y++) if (t.get(x, y, 0)) { m.set(x, y + 1, 2, fg); m.set(t.w - 1 - x, y + 1, 0, fg); } return AF.meshModel(m, { vs: 1 / 36 }); });
      const alarmG = G('alarm', () => { const m = new AF.Model(5, 24, 5); m.box(1, 0, 1, 4, 2, 4, k.redD); m.box(2, 2, 2, 3, 14, 3, k.red); m.box(0, 14, 0, 5, 20, 5, k.red); m.box(1, 15, 4, 4, 19, 5, k.redD); m.box(2, 17, 4, 3, 18, 5, k.chrome); m.box(1, 20, 1, 4, 21, 4, k.redD); m.box(1, 21, 1, 4, 23, 4, c(0xff6a4a, { emit: 0xff4020, emitK: 1.2, mode: 'night', jitter: 0, edge: 0 })); return AF.meshModel(m, { vs: 1 / 8 }); });
      const tableG = G('cafe', () => { const m = new AF.Model(18, 22, 18); m.box(8, 0, 8, 10, 6, 10, k.iron); for (let x = 5; x < 13; x++) for (let z = 5; z < 13; z++) if (Math.hypot(x - 8.5, z - 8.5) < 4) m.set(x, 6, z, k.white); for (const [x, z] of [[1, 8], [15, 8]]) { m.box(x, 0, z, x + 2, 3, z + 2, k.iron); m.box(x, 3, z, x + 2, 4, z + 2, k.woodL); m.box(x === 1 ? 0 : 17, 3, z, x === 1 ? 1 : 18, 7, z + 2, k.iron); } m.box(8, 6, 8, 9, 20, 9, k.woodD); umb(m, 8.5, 20, 8.5, 9, c(0x2e8a7a, { jitter: 0.1, edge: 0.2 }), cream); return AF.meshModel(m, { vs: 1 / 8 }); });
      const tp = (geo, x, z, rot, r, col = true) => { if (!onWalk(x, z) || !free(x, z, r)) return false; put(geo, x, 0.25, z, rot, col); claim(x, z, r + 0.2); return true; };
      const I0 = (x, z) => inter.find((q) => q.x === x && q.z === z);
      const at = (I, sx, sz, along, into = 1.8) => [I.x + sx * (I.wv / 2 + along), I.z + sz * (I.wh / 2 + into)];
      const faceRot = (sz) => sz > 0 ? 2 : 0;
      // traffic cop on his podium, in the middle of Grand x Meridian
      put(copG, 0, 0, 0, 0, false); AF.addCollider(-0.62, 0, -0.62, 0.62, 1.2, 0.62);
      AF.addSpot({ building: 'traffic-cop', x: 0, y: 1.25, z: 0, yaw: Math.PI / 2, kind: 'stand' }); cnt.cop = 1;
      cnt.flowerCarts = cnt.hotdogs = cnt.shoeshine = cnt.boards = cnt.noParking = cnt.tramSigns = cnt.alarms = cnt.cafe = 0;
      for (const [x, z, sx, sz, al] of [[0, 0, -1, 1, 9], [0, 160, 1, -1, 12], [80, 0, 1, -1, 10], [-80, 80, -1, -1, 9]]) { const I = I0(x, z); if (!I) continue; const [px, pz] = at(I, sx, sz, al); if (tp(flowerG, px, pz, faceRot(sz), 1.2)) { cnt.flowerCarts++; AF.addSpot({ building: 'street-flowers', x: px, y: 0.25, z: pz + sz * 1.0, yaw: sz > 0 ? Math.PI : 0, kind: 'work' }); } }
      for (const [x, z, sx, sz, al] of [[0, 80, -1, 1, 7], [80, 0, -1, -1, 12], [-80, -80, 1, 1, 8], [0, -80, -1, 1, 8]]) { const I = I0(x, z); if (!I) continue; const [px, pz] = at(I, sx, sz, al); if (tp(hotdogG, px, pz, faceRot(sz), 1.1)) { cnt.hotdogs++; (ST.steamPts = ST.steamPts || []).push([px + (sz > 0 ? 0.56 : -0.56) * 0, 1.62, pz]); AF.addSpot({ building: 'street-hotdog', x: px, y: 0.25, z: pz + sz * 0.9, yaw: sz > 0 ? Math.PI : 0, kind: 'work' }); } }
      for (const [x, z, sx, sz, al] of [[0, 0, 1, -1, 6], [80, 80, 1, 1, 6], [-160, 0, 1, -1, 7]]) { const I = I0(x, z); if (!I) continue; const [px, pz] = at(I, sx, sz, al, 2.0); if (tp(shineG, px, pz, faceRot(-sz), 0.8)) { cnt.shoeshine++; AF.addSpot({ building: 'street-shoeshine', x: px, y: 0.25 + 6 / 8, z: pz, yaw: sz > 0 ? 0 : Math.PI, kind: 'sit' }); } }
      // sandwich boards along the shopping sidewalks of Grand Ave (south of Meridian) and Bay St
      for (let z = 16; z < 150; z += 13) for (const sd of [-1, 1]) { const x = sd * 9.4, zz = z + (sd > 0 ? 5 : 0); if (!nearInter({ hor: false, c: 0 }, zz, 4) && tp(boardG(cnt.boards), x, zz, sd > 0 ? 3 : 1, 0.4, false)) cnt.boards++; }
      // NO PARKING signs along Grand + Meridian + Park Row curbs
      for (const p of pieces) { if (!/Grand|Meridian|Broad/.test(p.name)) continue; for (let t = p.t0 + 30; t < p.t1 - 10; t += 55) { const sd = (Math.round(t / 55) & 1) ? 1 : -1, d = sd * (p.w / 2 + 0.4), x = p.hor ? t : p.c + d, z = p.hor ? p.c + d : t; if (nearInter(p, t, 5) || !onWalk(x, z) || !free(x, z, 0.3)) continue; put(postGeo(), x, 0.25, z, 0); put(plateG('NO PARKING', k.red, k.white), x, 2.55, z, p.hor ? 0 : 1); claim(x, z, 0.4); cnt.noParking++; } }
      // STREETCAR STOP signs on the curb opposite each stop island
      if (P.rail && P.rail.stations) for (const st of P.rail.stations) { for (const o of [-6, 6]) { const q = P.railSide(st.sC + o, 10.5); if (!onWalk(q.x, q.z) || !free(q.x, q.z, 0.3)) continue; put(postGeo(), q.x, 0.25, q.z, 0); const rot = Math.abs(q.yaw % Math.PI) > 0.7 && Math.abs(q.yaw % Math.PI) < 2.4 ? 0 : 1; put(plateG('STREETCAR STOP', k.cream, k.greenP), q.x, 2.55, q.z, rot); claim(q.x, q.z, 0.4); cnt.tramSigns++; break; } }
      // fire-alarm boxes on alternate corners
      let ai = 0; for (const I of inter) { const [sx, sz] = (ai++ & 1) ? [-1, -1] : [1, 1]; const x = I.x + sx * (I.wv / 2 + 0.55), z = I.z + sz * (I.wh / 2 + 6.5); if (tp(alarmG, x, z, 0, 0.4)) cnt.alarms++; }
      // café tables (teal parasols) on the Meridian sidewalk outside the diner + shop rows, and on Grand Ave outside the diner block
      const cafe = (x, z) => { if (tp(tableG, x, z, 0, 1.2)) { cnt.cafe++; for (const dx of [-0.9, 0.9]) AF.addSpot({ building: 'street-cafe', x: x + dx, y: 0.25 + 4 / 8, z, yaw: dx < 0 ? Math.PI / 2 : -Math.PI / 2, kind: 'sit' }); } };
      for (const x of [22, 28, 34, -24, -30, -36, 46, -48]) cafe(x, 8.9);
      for (const z of [30, 36, -30]) cafe(z > 0 ? 8.9 : -8.9, Math.abs(z));
    }
    // --- streetlamps every 18 m both sides (twin-globe standards on the avenues, bishop's crooks on side streets),
    //     + benches / trash between; street trees on EVERY street except the theatre blocks of Grand Ave
    const lampsXZ = [];
    const flagPts = [];
    for (const p of pieces) {
      const twin = p.w >= 14, kind = p.w >= 14 ? true : p.w >= 20 ? true : 'crook';
      for (const sd of [-1, 1]) {
        const d = sd * (p.w / 2 + 0.5);
        for (let t = p.t0 + 9; t <= p.t1 - 2; t += 18) {
          if (nearInter(p, t, 3.5)) continue;
          const x = p.hor ? t : p.c + d, z = p.hor ? p.c + d : t;
          if (!onWalk(x, z) || !free(x, z, 0.5)) continue;
          const lk = p.w >= 20 ? false : kind;
          put(lampGeo(lk), x, 0.25, z, lk === 'crook' ? (p.hor ? (sd > 0 ? 3 : 1) : (sd > 0 ? 2 : 0)) : (p.hor ? 0 : 1)); AF.addCollider(x - 0.2, 0.25, z - 0.2, x + 0.2, 4.8, z + 0.2); claim(x, z, 0.8);
          const lo = lk === 'crook' ? -sd * 0.85 : 0, lx = p.hor ? x : x + lo, lz = p.hor ? z + lo : z;
          AF.addLight({ x: lx, y: lk === 'crook' ? 4.1 : 4.4, z: lz, color: 0xffcf8a, intensity: 1.2, range: 15, kind: 'street' });
          lampsXZ.push({ x, z, p, sd, t }); cnt.lamps++;
          if (/Meridian|Grand/.test(p.name)) flagPts.push({ x, z, sd, hor: p.hor });
          // bench + trash half way to the next lamp, alternating
          const tb = t + 9;
          if (tb < p.t1 - 6 && !nearInter(p, tb, 5) && hash(tb | 0, (p.c | 0) + sd) < 0.78) {
            const bd = sd * (p.w / 2 + 2.3), bx = p.hor ? tb : p.c + bd, bz = p.hor ? p.c + bd : tb;
            if (onWalk(bx, bz) && onWalk(p.hor ? bx : bx + sd * 0.5, p.hor ? bz + sd * 0.5 : bz) && free(bx, bz, 1)) {
              const rot = p.hor ? (sd > 0 ? 0 : 2) : (sd > 0 ? 1 : 3);
              put(benchGeo(), bx, 0.25, bz, rot, true); claim(bx, bz, 1.1); cnt.benches++;
              const yaw = p.hor ? (sd > 0 ? Math.PI : 0) : (sd > 0 ? -Math.PI / 2 : Math.PI / 2);
              AF.addSpot({ x: bx, y: 0.25 + 3 / 8 + 0.12, z: bz, yaw, kind: 'bench' });
              const tx = p.hor ? bx + 1.4 : bx, tz = p.hor ? bz : bz + 1.4;
              if (free(tx, tz, 0.3) && onWalk(tx, tz)) { put(trashGeo(), tx, 0.25, tz, 0, true); claim(tx, tz, 0.4); cnt.trash++; }
            }
          }
        }
      }
    }
    // street trees: ~16 m apart, 1.25 m in from the kerb, in iron grates (every 5th with a guard), never under an overhang
    //   (marquees, awnings, canopies, balconies) and never on the Great White Way's theatre blocks
    // overhang probe: above the pit, 2 m each way along the kerb, 0.9 m toward the facade (walls further back are fine)
    const overhang = (x, z, hor, sd) => { const pts = hor ? [[0, 0], [2, 0], [-2, 0], [0, sd * 0.9], [0, -sd * 1.5]] : [[0, 0], [0, 2], [0, -2], [sd * 0.9, 0], [-sd * 1.5, 0]]; for (let y = 2.0; y < 8; y += 0.5) for (const [ox, oz] of pts) if (W.getM(x + ox, y, z + oz)) return true; return false; };
    const useKit = AF.TREEKIT && typeof AF.TREEKIT.plantStreet === 'function';
    for (const p of pieces) for (const sd of [-1, 1]) {
      const isGrand = /Grand Avenue/.test(p.name);
      for (let t = p.t0 + 17; t <= p.t1 - 5; t += 16) {
        if (isGrand && t > 4 && t < 156) continue;       // theatre district: marquees + bulbs instead
        if (nearInter(p, t, 7)) continue;
        const td = sd * (p.w / 2 + 1.25), x = p.hor ? t : p.c + td, z = p.hor ? p.c + td : t;
        if (!onWalk(x, z) || !free(x, z, 1.0) || overhang(x, z, p.hor, sd)) continue;
        put(grateGeo(), x, 0.25, z, 0, false);
        W.eachCol(x - 0.5, z - 0.5, x + 0.5, z + 0.5, (bx, bz, i) => { W.C[i] = k.soil; });
        const v = Math.floor(hash(t | 0, sd + 9 + (p.c | 0)) * 6);
        if (useKit) { try { AF.TREEKIT.plantStreet(x, z, v); } catch (e) { ST.plantTree('street', x, z, v); } } else ST.plantTree('street', x, z, v);
        (AF.streetTrees = AF.streetTrees || []).push({ x, z, h: 9 });
        if (hash((t | 0) + 1, sd + (p.c | 0)) < 0.2) put(guardGeo(), x, 0.25, z, 0, false);
        W.eachCol(x - 2.4, z - 2.4, x + 2.4, z + 2.4, (bx, bz, i, px, pz) => { if (ST.mask[i] === 2 && W.H[i] === 1 && Math.hypot(px - x, pz - z) < 2.4 && Math.hypot(px - x, pz - z) > 0.65) { const hh = hash(bx * 3 + 1, bz * 5 + 2); if (hh < 0.3) W.C[i] = hh < 0.1 ? k.leafR : hh < 0.17 ? k.leafO : k.leafY; } });
        AF.addCollider(x - 0.2, 0.25, z - 0.2, x + 0.2, 3, z + 0.2); claim(x, z, 1.1); cnt.trees++;
      }
    }
    W.tDirty = true;
    // extra hydrants along long blocks
    for (const L of lampsXZ) {
      if (cnt.hydrants > 70) break;
      if (hash(L.t | 0, L.p.c | 0) > 0.3) continue;
      const tt = L.t + 5, d = L.sd * (L.p.w / 2 + 0.55), x = L.p.hor ? tt : L.p.c + d, z = L.p.hor ? L.p.c + d : tt;
      if (onWalk(x, z) && free(x, z, 0.4) && !nearInter(L.p, tt, 4)) { put(hydrantGeo(), x, 0.25, z, 0, true); noPark.push({ x: x, z: z, r: 3, kind: 'hydrant' }); claim(x, z, 0.5); cnt.hydrants++; }
    }
    ST.lamps = lampsXZ;

    // --- FLAGS on the Meridian + Grand lampposts. Round 2: GPU-rippled vertical deco banners (AF.makeFlag hang mode, 63-sky) on
    //     iron bracket arms; the rigid InstancedMesh flags stay only as a fallback when the cloth API is missing.
    const hasCloth = typeof AF.makeFlag === 'function' && typeof AF.makeBunting === 'function';
    ST.hasCloth = hasCloth;
    if (hasCloth) {
      const brM = new AF.Model(2, 12, 6); brM.box(0, 11, 0, 2, 12, 6, k.lampG); brM.box(0, 0, 0, 2, 1, 6, k.lampG); brM.set(0, 11, 5, k.brass); brM.set(0, 0, 5, k.brass); brM.box(0, 0, 0, 2, 12, 1, k.lampG);
      const brG = AF.meshModel(brM, { vs: 1 / 8, anchor: [0.5, 0, 0] });
      const DRAW = [
        (g) => { g(0, 0, 60, 39, '#1f3563'); g(0, 0, 60, 2, '#e8b84a'); g(0, 37, 60, 2, '#e8b84a'); g(0, 0, 3, 39, '#e8b84a'); g(57, 0, 3, 39, '#e8b84a');
          for (let r = 0; r < 7; r++) { const a = Math.PI * (0.1 + r * 0.133); for (let q = 7; q < 20; q++) g(Math.round(30 - Math.cos(a) * q * 1.6), Math.round(24 - Math.sin(a) * q * 0.7), 2, 1, '#e8b84a'); }
          g(12, 24, 36, 2, '#f2ead8'); g(0, 28, 60, 9, '#2e7d6a'); for (let x = 4; x < 56; x += 8) g(x, 31, 4, 2, '#e8b84a'); },
        (g) => { g(0, 0, 60, 39, '#b3242a'); g(0, 0, 60, 3, '#f2e6c4'); g(0, 36, 60, 3, '#f2e6c4');
          for (let k2 = 0; k2 < 3; k2++) for (let x = 0; x < 60; x++) { const y = 7 + k2 * 9 + Math.round(Math.abs(((x % 20) - 10)) * 0.35); g(x, y, 1, 2, '#e8b84a'); }
          g(22, 15, 16, 8, '#1f3563'); g(26, 17, 8, 4, '#f2e6c4'); },
      ];
      let fi = 0;
      for (const f of flagPts) {
        const nx = f.hor ? 0 : -f.sd, nz = f.hor ? -f.sd : 0;           // toward the roadway
        const hx = f.x + nx * 0.14, hz = f.z + nz * 0.14, top = 3.45;
        AF.makeFlag({ x: hx, y: top, z: hz, w: 0.62, h: 1.25, hang: true, dir: [nx, nz], design: 'custom', key: 'ps-lampban-' + (fi & 1), draw: DRAW[fi & 1] });
        put(brG, f.x, top - 1.45, f.z, f.hor ? (f.sd > 0 ? 2 : 0) : (f.sd > 0 ? 3 : 1));
        fi++;
      }
      cnt.lampBanners = fi;
    }
    if (!hasCloth) {
      const fg = flagGeo();
      const fm = new THREE.InstancedMesh(fg, AF.mat.voxel, flagPts.length);
      const dm = new THREE.Object3D();
      const base = flagPts.map((f) => ({ x: f.x, z: f.z, y: 3.2, yaw: f.hor ? (f.sd > 0 ? Math.PI : 0) : (f.sd > 0 ? -Math.PI / 2 : Math.PI / 2) }));
      const upd = (t) => {
        base.forEach((b, i) => { dm.position.set(b.x, b.y, b.z); dm.rotation.set(Math.sin(t * 2.1 + i) * 0.08, b.yaw + Math.sin(t * 1.3 + i * 0.7) * 0.35, 0); dm.updateMatrix(); fm.setMatrixAt(i, dm.matrix); });
        fm.instanceMatrix.needsUpdate = true;
      };
      upd(0); fm.frustumCulled = false; fm.castShadow = false; AF.scene.add(fm);
      AF.onTick('streets-flags', 331, (dt, t) => { const c = AF.camera; if (c && c.position.y < 60 && Math.abs(c.position.z) > 90) return; upd(t); });   // freeze only when the camera is at street level well off Meridian
    }
    // --- HARBOUR DAYS: pennant bunting across Grand Ave (with Great White Way bulb strings), Bay St and Harbour Blvd;
    //     cloth banners "HARBOUR DAYS · SAT SEPT 26" across Grand (z 60, 150) and Meridian (x -40, 40). One InstancedMesh for all pennants.
    {
      const strings = [];
      for (let z = 12.5; z < 160; z += 25) strings.push({ x0: -7.3, z0: z, x1: 7.3, z1: z, y: 4.6, sag: 0.9, bulbs: true });
      for (let z = -150; z < -10; z += 30) strings.push({ x0: -7.3, z0: z, x1: 7.3, z1: z, y: 4.6, sag: 0.8 });
      for (let x = -225; x < 230; x += 30) { if (Math.abs(((x % 80) + 80) % 80) < 9 || Math.abs(((x % 80) + 80) % 80) > 71) continue; strings.push({ x0: x, z0: 74.7, x1: x, z1: 85.3, y: 4.9, sag: 0.7 }); }
      for (let x = -225; x < 230; x += 30) { if (Math.abs(((x % 80) + 80) % 80) < 12 || Math.abs(((x % 80) + 80) % 80) > 68) continue; strings.push({ x0: x, z0: 149.7, x1: x, z1: 170.3, y: 5.4, sag: 1.3 }); }
      for (const s2 of strings) { s2.len = Math.hypot(s2.x1 - s2.x0, s2.z1 - s2.z0); s2.n = Math.round(s2.len / 0.62); }
      // extra festoon-only strings over the Great White Way (between the pennant strings) — the night wow on Grand
      const festoon = [];
      for (let z = 25; z < 160; z += 25) festoon.push({ x0: -7.3, z0: z, x1: 7.3, z1: z, y: 5.0, sag: 0.7, bulbs: true });
      for (let z = 18.75; z < 160; z += 25) festoon.push({ x0: -7.3, z0: z, x1: 7.3, z1: z, y: 5.3, sag: 0.55, bulbs: true });
      for (const s2 of festoon) { s2.len = Math.hypot(s2.x1 - s2.x0, s2.z1 - s2.z0); s2.n = 0; }
      if (hasCloth) {
        const PCOL = [['#c0392b', '#f4f1ea', '#1f3563', '#e8b84a', '#2e7d6a'], ['#b3242a', '#f2e6c4', '#e8b84a'], ['#1f3563', '#f4f1ea', '#c0392b']];
        strings.forEach((s2, si) => AF.makeBunting([s2.x0, s2.y, s2.z0], [s2.x1, s2.y, s2.z1], { shape: 'pennant', sag: s2.sag, spacing: 0.5, size: 0.36, colors: PCOL[si % 3] }));
        for (const s2 of festoon) AF.makeBunting([s2.x0, s2.y, s2.z0], [s2.x1, s2.y, s2.z1], { shape: 'pennant', sag: s2.sag, spacing: 3.0, size: 0.05, colors: ['#2a2622'] });
      }
      for (const s2 of festoon) strings.push(s2);
      const n = hasCloth ? 1 : strings.reduce((a2, s2) => a2 + s2.n, 0);
      const pg = new THREE.ConeGeometry(0.22, 0.45, 3); pg.rotateX(Math.PI); pg.translate(0, -0.22, 0);
      const pm = new THREE.MeshLambertMaterial({ color: 0xffffff });
      const im = new THREE.InstancedMesh(pg, pm, n), dm = new THREE.Object3D();
      const cols = [0xc8372b, 0xf0e4c0, 0x2e8a7a, 0xd8a53a, 0x1d2d52].map((h) => new THREE.Color(h));
      for (let i = 0; i < n; i++) im.setColorAt(i, cols[i % cols.length]);
      const lineMat = new THREE.LineBasicMaterial({ color: 0x2a2622 });
      const lp = [], sagY = (s2, u) => s2.y - Math.sin(u * Math.PI) * s2.sag;
      for (const s2 of strings) for (let j = 0; j < 20; j++) { const u0 = j / 20, u1 = (j + 1) / 20; lp.push(s2.x0 + (s2.x1 - s2.x0) * u0, sagY(s2, u0), s2.z0 + (s2.z1 - s2.z0) * u0, s2.x0 + (s2.x1 - s2.x0) * u1, sagY(s2, u1), s2.z0 + (s2.z1 - s2.z0) * u1); }
      const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3));
      const ropes = new THREE.LineSegments(lg, lineMat); ropes.frustumCulled = false; if (!hasCloth) AF.scene.add(ropes);
      const upd = (t) => {
        let i = 0; const g = AF.wind && AF.wind.gust != null ? 1 + AF.wind.gust : 1;
        for (const s2 of strings) { const yaw = Math.atan2(s2.x1 - s2.x0, s2.z1 - s2.z0) + Math.PI / 2; for (let j = 0; j < s2.n; j++) {
          const u = (j + 0.5) / s2.n;
          dm.position.set(s2.x0 + (s2.x1 - s2.x0) * u, sagY(s2, u), s2.z0 + (s2.z1 - s2.z0) * u);
          dm.rotation.set(Math.sin(t * 2.4 + j * 0.5 + s2.z0 + s2.x0) * 0.35 * g, yaw, 0, 'YXZ'); dm.updateMatrix(); im.setMatrixAt(i++, dm.matrix);
        } }
        im.instanceMatrix.needsUpdate = true;
      };
      if (!hasCloth) { upd(0); im.frustumCulled = false; AF.scene.add(im); }
      if (!hasCloth) AF.onTick('streets-bunting', 332, (dt, t) => { const c = AF.camera; if (c && c.position.y < 60 && c.position.distanceTo(AF.shadowFocus || c.position) > 400) return; upd(t); });
      cnt.bunting = strings.length - festoon.length; cnt.festoons = strings.filter((s2) => s2.bulbs).length;
      // Great White Way: festoon bulbs along the Grand Ave strings (dim cream by day, blazing at night, chasing gently)
      const bl = strings.filter((s2) => s2.bulbs), per = 24, bn = bl.length * per;
      const bgeo = new THREE.SphereGeometry(0.075, 6, 4), bmat = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
      const bim = new THREE.InstancedMesh(bgeo, bmat, bn); let bi = 0;
      for (const s2 of bl) for (let j = 0; j < per; j++) { const u = (j + 0.5) / per; dm.position.set(s2.x0 + (s2.x1 - s2.x0) * u, (hasCloth ? s2.y - s2.sag * 4 * u * (1 - u) - 0.03 : sagY(s2, u) + 0.02), s2.z0); dm.rotation.set(0, 0, 0); dm.updateMatrix(); bim.setMatrixAt(bi++, dm.matrix); }
      const cDay = new THREE.Color(0xe9dcc0), cOn = new THREE.Color(0xffd27a).multiplyScalar(3.2), cDim = new THREE.Color(0xffb85a).multiplyScalar(1.6);
      for (let i = 0; i < bn; i++) bim.setColorAt(i, cDay);
      bim.frustumCulled = false; AF.scene.add(bim);
      let bacc = 0, wasNight = null;
      AF.onTick('streets-gww-bulbs', 333, (dt, t) => {
        bacc += dt; if (bacc < 0.12) return; bacc = 0;
        const night = AF.time && (AF.time.hours > 18.4 || AF.time.hours < 6.2);
        if (!night) { if (wasNight !== false) { for (let i = 0; i < bn; i++) bim.setColorAt(i, cDay); bim.instanceColor.needsUpdate = true; wasNight = false; } return; }
        wasNight = true; const ph = Math.floor(t * 6);
        for (let i = 0; i < bn; i++) bim.setColorAt(i, ((i + ph) % 4 === 0) ? cDim : cOn);
        bim.instanceColor.needsUpdate = true;
      });
      for (const s2 of bl) AF.addLight({ x: (s2.x0 + s2.x1) / 2, y: 4, z: s2.z0, color: 0xffd28a, intensity: 1.0, range: 12, kind: 'sign' });
      // cloth banners
      const red = AF.col(0xb3242a, { jitter: 0.08, edge: 0.1, solid: false }), creamB = AF.col(0xf2e6c4, { jitter: 0.05, edge: 0, solid: false }), navyB = AF.col(0x1d2d52, { jitter: 0.05, edge: 0.1, solid: false }), goldB = AF.col(0xd8a53a, { jitter: 0.05, edge: 0, solid: false });
      const bannerGeo = G('banner', () => {
        const t1 = AF.textModel('HARBOUR DAYS', creamB, { pad: 0 }), t2 = AF.textModel('SAT SEPT 26 - FLEET WEEK', goldB, { pad: 0 });
        const Wd = Math.max(t1.w, Math.ceil(t2.w / 2)) + 8, Ht = 7 + 5 + 10, m = new AF.Model(Wd, Ht, 3);
        m.box(0, 0, 0, Wd, Ht, 3, red); m.box(0, 0, 0, Wd, 1, 3, navyB); m.box(0, Ht - 1, 0, Wd, Ht, 3, navyB); m.box(0, 0, 0, 1, Ht, 3, navyB); m.box(Wd - 1, 0, 0, Wd, Ht, 3, navyB);
        const both = (x, y, c2) => { m.set(x, y, 2, c2); m.set(Wd - 1 - x, y, 0, c2); };
        const ox = Math.floor((Wd - t1.w) / 2); for (let x = 0; x < t1.w; x++) for (let y = 0; y < 7; y++) if (t1.get(x, y, 0)) both(ox + x, 12 + y, creamB);
        // second line at half scale: sample every other font pixel is illegible -> draw a gold rule + stars instead of tiny text
        for (let x = 3; x < Wd - 3; x++) both(x, 9, goldB);
        for (let x = 6; x < Wd - 5; x += 8) { both(x, 5, goldB); both(x - 1, 5, goldB); both(x + 1, 5, goldB); both(x, 4, goldB); both(x, 6, goldB); }
        for (let x = 1; x < Wd - 1; x += 3) both(x, 0, goldB);   // fringe
        return AF.meshModel(m, { vs: 1 / 10, anchor: [0.5, 1, 0.5] });
      });
      const banners = [];
      for (const [x, z, rotY] of [[0, 60, 0], [0, 150, 0], [-40, 0, Math.PI / 2], [40, 0, Math.PI / 2]]) {
        const mesh = AF.modelMesh(bannerGeo); mesh.position.set(x, 6.4, z); mesh.rotation.order = "YXZ"; mesh.rotation.y = rotY; AF.scene.add(mesh); banners.push(mesh);
      }
      { const rp = []; for (const [x, z, hor] of [[0, 60, 0], [0, 150, 0], [-40, 0, 1], [40, 0, 1]]) { const hw = 3.3; const A = hor ? [[x, 5.0, z - 7.3], [x, 6.4, z - hw], [x, 6.4, z + hw], [x, 5.0, z + 7.3]] : [[-7.3, 5.0, z], [-hw, 6.4, z], [hw, 6.4, z], [7.3, 5.0, z]]; for (let q = 0; q < 3; q++) rp.push(...A[q], ...A[q + 1]); }
        const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.Float32BufferAttribute(rp, 3)); const rl = new THREE.LineSegments(rg, lineMat); rl.frustumCulled = false; AF.scene.add(rl); }
      AF.onTick('streets-banners', 334, (dt, t) => { for (let i = 0; i < banners.length; i++) banners[i].rotation.x = Math.sin(t * 1.7 + i * 1.3) * 0.12 + 0.05; });
      cnt.banners = banners.length;
      ST.harbourDays = { strings: strings.length, banners: cnt.banners };
    }
    for (const I of inter) noPark.push({ x: I.x, z: I.z, r: Math.max(I.wh, I.wv) / 2 + 5, kind: 'crosswalk' });
    if (P.rail && P.rail.stations) for (const st of P.rail.stations) noPark.push({ x: st.x ?? (st.platform[0] + st.platform[2]) / 2, z: st.z ?? (st.platform[1] + st.platform[3]) / 2, r: 13, kind: 'stop' });
    for (const b of AF.buildings) for (const d of b.doors || []) noPark.push({ x: d.x, z: d.z, r: 2.5, kind: 'door' });
    for (const bs of AF.busStops || []) noPark.push({ x: bs.x, z: bs.z, r: 6, kind: 'bus' });
    ST.isNoPark = (x, z) => { for (const q of noPark) if (Math.abs(q.x - x) < q.r && Math.abs(q.z - z) < q.r) return true; return false; };
    AF.addLabel('Meridian Avenue', 120, 0, 'street'); AF.addLabel('Grand Avenue', 0, 120, 'street'); AF.addLabel('Park Row', 120, -160, 'street'); AF.addLabel('Harbour Boulevard', 120, 160, 'street');
    AF.addLabel('Lantern Avenue', -160, 120, 'street'); AF.addLabel('Terminal Avenue', 160, -120, 'street'); AF.addLabel('Broad Street', 80, 120, 'street'); AF.addLabel('Library Street', -80, 40, 'street');
  });


  // ------------------------------------------------------------ ROUND 2: SIDEWALK LIFE (order 488) — something every 10–15 m of pavement
  //   granite planters of autumn mums, mum pots + pumpkins on the stoops, lit wooden TELEPHONE booths (someone may be inside),
  //   bicycles leaning on lamp posts, produce crates + barrels outside grocers/delis/chandleries, newspaper bundles + headline boards
  //   on every newsstand, a granite horse trough, blinking amber police call-box lamps.
  AF.onBuild('streets-clutter', 488, () => {
    const k = pal(), c = AF.col, cnt = ST.counts || (ST.counts = {});
    const Rot = (lx, lz, r) => r === 0 ? [lx, lz] : r === 1 ? [lz, -lx] : r === 2 ? [-lx, -lz] : [-lz, lx];
    const tp = (geo, x, z, rot, r, collide = true) => { if (!onWalk(x, z) || !free(x, z, r)) return false; put(geo, x, 0.25, z, rot, collide); claim(x, z, r + 0.1); return true; };
    const mumC = [c(0xd9772b, { jitter: 0.4 }), c(0xe0b23c, { jitter: 0.4 }), c(0x8e2a3a, { jitter: 0.4 }), c(0xc4462a, { jitter: 0.4 }), c(0xf0e0c0, { jitter: 0.3 })];
    const leaf = c(0x3f6a34, { jitter: 0.4 }), pot = c(0xa9542f, { jitter: 0.25, edge: 0.3 }), potD = c(0x7e3c22, { jitter: 0.25, edge: 0.3 });
    const pumpk = c(0xe07a1f, { jitter: 0.2, edge: 0.35 }), pumpkD = c(0xb85a14, { jitter: 0.2, edge: 0.35 }), stem = c(0x4e5a2a, { jitter: 0.3 }), gourd = c(0xe8d8a0, { jitter: 0.2, edge: 0.3 });
    const stoneP = c(0xb9b2a4, { jitter: 0.15, edge: 0.35 }), stonePD = c(0x8f897d, { jitter: 0.15, edge: 0.35 });
    const oak = c(0x5a3a22, { jitter: 0.3, edge: 0.35 }), oakL = c(0x7a5230, { jitter: 0.3, edge: 0.35 }), glassB = AF.col('glass');
    const lampOn = c(0xfff0c8, { emit: 0xffd9a0, emitK: 1.6, mode: 'night', jitter: 0, edge: 0 });
    const signOn = c(0xf6ecd0, { emit: 0xfff0c8, emitK: 1.3, mode: 'night', jitter: 0, edge: 0 });
    const crate = c(0xb08a58, { jitter: 0.35, edge: 0.4 }), crateD = c(0x8a6a40, { jitter: 0.35, edge: 0.4 });
    const produce = [[c(0xc0302a, { jitter: 0.35 }), c(0x8ab040, { jitter: 0.35 })], [c(0xe88a22, { jitter: 0.3 }), c(0xe0c040, { jitter: 0.3 })], [c(0x9ac070, { jitter: 0.3 }), c(0xa88a5a, { jitter: 0.4 })], [c(0x6a2a5a, { jitter: 0.3 }), c(0xd04030, { jitter: 0.3 })]];
    const barrelC = c(0x8a5a32, { jitter: 0.3, edge: 0.4 }), hoop = c(0x3a3632, { jitter: 0.1, edge: 0.3, metal: 0.6, rough: 0.5 });
    const bikeF = [c(0x1f5a36, { jitter: 0.1, edge: 0.3 }), c(0x8e2a21, { jitter: 0.1, edge: 0.3 }), c(0x1d2d52, { jitter: 0.1, edge: 0.3 }), c(0x1c1b1a, { jitter: 0.1, edge: 0.3 })];
    const tyre = c(0x1a1918, { jitter: 0.05, edge: 0.2 }), spoke = c(0xb8b4ac, { jitter: 0.05, edge: 0.1, metal: 0.8, rough: 0.4 }), saddle = c(0x5a3a22, { jitter: 0.2 });
    const water = c(0x3f6f7a, { jitter: 0.1, edge: 0, rough: 0.08 }), twine = c(0xc8a870, { jitter: 0.2 });
    // ---- models
    const planterG = (v) => G('planter' + v, () => { const m = new AF.Model(12, 7, 5); m.box(0, 0, 0, 12, 1, 5, stonePD); m.box(0, 1, 0, 12, 3, 5, stoneP); m.box(0, 3, 0, 12, 4, 5, stonePD);
      for (let x = 1; x < 11; x++) for (let z = 1; z < 4; z++) { const h = hash(x * 7 + v, z * 13 + v), mc = mumC[(Math.floor(x / 3) + v) % mumC.length]; m.set(x, 4, z, leaf); if (h < 0.88) m.set(x, 5, z, h < 0.18 ? leaf : mc); if (h < 0.4 && z === 2) m.set(x, 6, z, mc); }
      return AF.meshModel(m, { vs: 1 / 8 }); });
    const stoopG = (v) => G('stoop' + v, () => { const m = new AF.Model(9, 7, 6);
      m.box(0, 0, 1, 4, 3, 5, pot); m.box(0, 2, 1, 4, 3, 5, potD); m.sphere(2, 4.2, 3, 2.3, mumC[v % 5], (x, y) => y >= 3 ? mumC[v % 5] : 0); m.set(1, 5, 2, mumC[(v + 2) % 5]); m.set(2, 6, 3, mumC[(v + 2) % 5]);
      m.sphere(6.5, 1.6, 2.5, 1.9, pumpk, (x, y, z) => ((x + z) & 1) ? pumpk : pumpkD); m.box(6, 3, 2, 7, 4, 3, stem);
      if (v & 1) { m.sphere(7.5, 0.9, 4.8, 1.1, gourd); } else { m.sphere(4.8, 0.9, 5.0, 1.0, pumpk); }
      return AF.meshModel(m, { vs: 1 / 8 }); });
    const boothG = G('booth', () => { const m = new AF.Model(8, 21, 8);
      m.box(0, 0, 0, 8, 1, 8, oak);
      for (const [x, z] of [[0, 0], [7, 0], [0, 7], [7, 7]]) m.box(x, 1, z, x + 1, 19, z + 1, oak);
      for (let y = 1; y < 16; y++) for (let i = 1; i < 7; i++) { const col = y < 6 ? oakL : (y === 11 ? oak : glassB); m.set(i, y, 0, col); m.set(0, y, i, col); m.set(7, y, i, col); m.set(i, y, 7, y < 6 ? oakL : (i === 1 || i === 6 || y === 11 ? oak : glassB)); }
      m.box(0, 16, 0, 8, 18, 8, k.navy); m.box(1, 16, 1, 7, 18, 7, 0); m.box(0, 18, 0, 8, 19, 8, oak); m.box(1, 19, 1, 7, 20, 7, oakL); m.box(3, 20, 3, 5, 21, 5, lampOn);
      m.box(2, 9, 1, 6, 10, 3, oakL); m.box(3, 10, 1, 5, 14, 2, k.black); m.set(3, 12, 2, k.chrome); m.set(4, 13, 2, k.chrome); m.box(3, 15, 3, 5, 16, 5, lampOn);
      m.set(6, 8, 6, k.brass);   // door handle
      return AF.meshModel(m, { vs: 1 / 8 }); });
    const textPlate = (txt, fg, bg, vs) => G('tp' + txt + vs, () => { const t = AF.textModel(txt, fg, { pad: 1 }), m = new AF.Model(t.w, t.h + 2, 2); m.box(0, 0, 0, t.w, t.h + 2, 2, bg); for (let x = 0; x < t.w; x++) for (let y = 0; y < t.h; y++) if (t.get(x, y, 0)) { m.set(x, y + 1, 1, fg); m.set(t.w - 1 - x, y + 1, 0, fg); } return AF.meshModel(m, { vs }); });
    const bikeG = (v) => G('bike' + v, () => { const m = new AF.Model(15, 9, 3), f = bikeF[v % 4];
      for (const cx of [3, 11.5]) for (let a = 0; a < 40; a++) { const t = a / 40 * Math.PI * 2; m.set(Math.floor(cx + Math.cos(t) * 2.9), Math.floor(3.2 + Math.sin(t) * 2.9), 1, tyre); }
      for (const cx of [3, 11.5]) { m.line(cx - 2, 3, 1, cx + 2, 3, 1, spoke); m.line(cx, 1, 1, cx, 5, 1, spoke); }
      m.line(3, 3, 1, 7, 3, 1, f); m.line(7, 3, 1, 6, 6, 1, f); m.line(6, 6, 1, 10, 6, 1, f); m.line(7, 3, 1, 10, 6, 1, f); m.line(10, 6, 1, 11.5, 3, 1, f); m.line(3, 3, 1, 6, 6, 1, f);
      m.box(5, 7, 1, 8, 8, 2, saddle); m.set(6, 6, 1, f); m.box(10, 7, 0, 11, 8, 3, spoke); m.set(10, 6, 1, f);
      if (v % 3 === 0) m.box(11, 5, 0, 14, 7, 3, c(0x9a7a4a, { jitter: 0.3 }));   // a wicker basket
      return AF.meshModel(m, { vs: 1 / 8 }); });
    const cratesG = (v) => G('crates' + v, () => { const m = new AF.Model(12, 8, 7), pr = produce[v % produce.length];
      for (const x0 of [0, 6]) { m.box(x0, 0, 0, x0 + 6, 3, 7, crate); for (let y = 0; y < 3; y += 2) m.box(x0, y, 0, x0 + 6, y + 1, 7, crateD); }
      for (let x = 0; x < 12; x++) for (let z = 0; z < 4; z++) { m.box(x, 3, z, x + 1, 4 + (z > 1 ? 0 : 0), z + 1, crate); }
      for (let x = 0; x < 12; x++) for (let z = 0; z < 7; z++) { const h = hash(x * 5 + v, z * 3); if (z < 4) m.set(x, 6, z, pr[h < 0.5 ? 0 : 1]); else m.set(x, 3, z, pr[h < 0.5 ? 1 : 0]); }
      m.box(0, 3, 0, 12, 6, 4, crate); m.box(0, 5, 0, 12, 6, 4, crateD); for (let x = 0; x < 12; x++) for (let z = 0; z < 4; z++) m.set(x, 6, z, pr[hash(x + v * 3, z + 11) < 0.5 ? 0 : 1]);
      m.box(1, 6, 3, 4, 8, 4, k.cream); m.set(2, 7, 4, k.red);   // price card
      return AF.meshModel(m, { vs: 1 / 8 }); });
    const barrelG = G('barrel', () => { const m = new AF.Model(5, 8, 5); for (let y = 0; y < 8; y++) { const r = 2.1 + (y > 1 && y < 6 ? 0.35 : 0); for (let x = 0; x < 5; x++) for (let z = 0; z < 5; z++) if (Math.hypot(x + 0.5 - 2.5, z + 0.5 - 2.5) < r) m.set(x, y, z, (y === 1 || y === 6) ? hoop : barrelC); } for (let x = 1; x < 4; x++) for (let z = 1; z < 4; z++) m.set(x, 7, z, produce[0][0]); return AF.meshModel(m, { vs: 1 / 8 }); });
    const bundleG = G('bundle', () => { const m = new AF.Model(6, 5, 4); m.box(0, 0, 0, 6, 4, 4, k.paper); m.box(0, 2, 0, 6, 3, 4, k.paper2); m.box(2, 0, 0, 3, 4, 4, twine); m.box(0, 3, 1, 6, 4, 2, twine); m.box(1, 4, 0, 5, 5, 3, k.paper); return AF.meshModel(m, { vs: 1 / 10 }); });
    const troughG = G('trough', () => { const m = new AF.Model(18, 8, 7); m.box(0, 0, 0, 18, 6, 7, stoneP); m.box(0, 0, 0, 18, 1, 7, stonePD); m.box(1, 3, 1, 17, 6, 6, 0); m.box(1, 3, 1, 17, 5, 6, water); m.box(0, 5, 0, 18, 6, 7, stonePD); m.box(1, 5, 1, 17, 6, 6, 0);
      m.box(7, 6, 0, 11, 8, 2, stonePD); m.set(8, 6, 1, k.brass); m.set(9, 6, 1, k.brass); m.set(8, 7, 0, k.black); m.set(10, 7, 0, k.black);   // lion-head spout block
      return AF.meshModel(m, { vs: 1 / 8 }); });
    Object.assign(cnt, { planters: 0, stoops: 0, booths: 0, bikes: 0, crates: 0, barrels: 0, bundles: 0, headlines: 0, troughs: 0 });
    const lamps = ST.lamps || [];
    // 1) granite planters of mums along the building line, between the lamps
    for (const L of lamps) {
      const p = L.p, tb = L.t + 4.5; if (nearInter(p, tb, 5) || hash((tb | 0) + 7, (p.c | 0) - L.sd) > 0.42) continue;
      const d = L.sd * (p.w / 2 + 2.55), x = p.hor ? tb : p.c + d, z = p.hor ? p.c + d : tb;
      if (onWalk(x, z) && onWalk(p.hor ? x - 0.8 : x, p.hor ? z : z - 0.8) && onWalk(p.hor ? x + 0.8 : x, p.hor ? z : z + 0.8) && tp(planterG(cnt.planters % 5), x, z, p.hor ? 0 : 1, 0.8)) { cnt.planters++; (ST.planterPts = ST.planterPts || []).push([x, z]); }
    }
    // 2) bicycles leaning against lamp posts (kerb side)
    for (const L of lamps) {
      if (hash((L.t | 0) + 31, (L.p.c | 0) + L.sd * 3) > 0.11) continue;
      const p = L.p, tb = L.t + 1.45, d = L.sd * (p.w / 2 + 0.55), x = p.hor ? tb : p.c + d, z = p.hor ? p.c + d : tb;
      if (!nearInter(p, tb, 4) && tp(bikeG(cnt.bikes), x, z, p.hor ? 0 : 1, 0.25, false)) cnt.bikes++;
    }
    // 3) lit wooden TELEPHONE booths near the kerb (door toward the pavement); someone may be making a call
    const plateTel = textPlate('TELEPHONE', signOn, k.navy, 1 / 60);
    for (const L of lamps) {
      if (cnt.booths >= 16) break;
      const p = L.p, dist = ST.district(L.x, L.z); if (dist === 'harbour') continue;
      if (hash((L.t | 0) + 77, (p.c | 0) + L.sd * 5) > 0.07) continue;
      const tb = L.t - 4.5, d = L.sd * (p.w / 2 + 1.05), x = p.hor ? tb : p.c + d, z = p.hor ? p.c + d : tb;
      if (nearInter(p, tb, 5)) continue;
      const rot = p.hor ? (L.sd > 0 ? 0 : 2) : (L.sd > 0 ? 1 : 3);
      if (!onWalk(x, z) || !tp(boothG, x, z, rot, 0.6, true)) continue;
      for (const [o, rr] of [[0.51, rot], [-0.51, (rot + 2) % 4]]) { const [ox, oz] = Rot(0, o, rot); put(plateTel, x + ox, 0.25 + 16 / 8 + 0.02, z + oz, rr); }
      AF.addLight({ x, y: 2.2, z, color: 0xffe2b0, intensity: 0.7, range: 5, kind: 'sign' });
      const [fx, fz] = Rot(0, 1, rot);
      if (cnt.booths % 2 === 0) AF.addSpot({ building: 'phone-booth', x, y: 0.375, z, yaw: Math.atan2(-fx, -fz), kind: 'stand' });
      (ST.noPark || []).push({ x, z, r: 2, kind: 'booth' }); cnt.booths++;
    }
    // 4) stoops: a mum pot + pumpkins beside house and shop doors (never in the doorway)
    const formal = /bank|hall|terminal|library|museum|tower|hotel|theatre|theater|paragon|rialto|station|court|post office|fire/i;
    for (const b of AF.buildings) {
      if (formal.test((b.name || '') + ' ' + (b.id || ''))) continue;
      (b.doors || []).forEach((d, di) => {
        if (cnt.stoops > 190 || hash(Math.floor(d.x * 3) + di, Math.floor(d.z * 3)) > 0.62) return;
        const yaw = d.yaw || 0, fx = Math.sin(yaw), fz = Math.cos(yaw), tx = Math.cos(yaw), tz = -Math.sin(yaw);
        const side = hash(Math.floor(d.x), Math.floor(d.z) + 3) < 0.5 ? -1 : 1;
        for (const [sd2, fo] of [[side, 0.35], [-side, 0.35], [side, -0.2]]) {
          const x = d.x + tx * sd2 * 1.9 + fx * fo, z = d.z + tz * sd2 * 1.9 + fz * fo, ci = W.col(x, z);
          if (ci < 0 || W.H[ci] < 1 || W.H[ci] > 3 || !free(x, z, 0.4)) continue;
          const gy = W.H[ci] * 0.25; if (W.getM(x, gy + 0.15, z) || W.getM(x, gy + 0.9, z) || W.getM(x + 0.3, gy + 0.15, z) || W.getM(x - 0.3, gy + 0.15, z) || W.getM(x, gy + 0.15, z + 0.3) || W.getM(x, gy + 0.15, z - 0.3)) continue;
          put(stoopG(cnt.stoops % 6), x, gy, z, (hash(cnt.stoops, 5) * 4) | 0, false); claim(x, z, 0.5); cnt.stoops++; break;
        }
      });
    }
    // 5) produce crates + barrels outside the grocers, delis, bakeries and chandleries
    const trade = /grocer|deli|fruit|produce|market|chandl|hardware|green|bakery|general|provision|pantry|corner/i;
    for (const b of AF.buildings) {
      if (!trade.test((b.name || '') + ' ' + (b.kind || '') + ' ' + (b.id || ''))) continue;
      for (const d of (b.doors || []).slice(0, 1)) {
        const yaw = d.yaw || 0, fx = Math.sin(yaw), fz = Math.cos(yaw), tx = Math.cos(yaw), tz = -Math.sin(yaw);
        const rot = Math.abs(fx) > Math.abs(fz) ? (fx > 0 ? 3 : 1) : (fz > 0 ? 2 : 0);   // crates face out to the street
        for (const side of [-1, 1]) {
          const x = d.x + tx * side * 2.4 + fx * 0.25, z = d.z + tz * side * 2.4 + fz * 0.25;
          if (tp(cratesG(cnt.crates), x, z, rot, 0.75)) { cnt.crates++; const bxp = x + tx * side * 1.3, bzp = z + tz * side * 1.3; if (onWalk(bxp, bzp)) { put(barrelG, bxp, 0.25, bzp, 0, true); claim(bxp, bzp, 0.35); cnt.barrels++; } }
        }
      }
    }
    // 6) newsstands: tied bundles of the evening edition + a headline board across the top
    const HEAD = ['BLIMP MOORS!', 'PARAGON GALA', 'STRIKE ENDS!', 'FLEET IS IN!', 'SOLACE WINS!', 'EXTRA! EXTRA!', 'HEAT WAVE OVER', 'NEW TOWER OPENS'];
    (ST.newsPts || []).forEach((n, i) => {
      const h = HEAD[i % HEAD.length], pg = textPlate(h, k.black, k.cream, 1 / (h.length > 12 ? 56 : 48));
      const [ox, oz] = Rot(0, -0.36, n.rot); put(pg, n.x + ox, 0.25 + 17 / 8 + 0.03, n.z + oz, n.rot); cnt.headlines++;
      for (const [lx, lz] of [[-1.35, 0.3], [1.3, 0.45]]) { const [bx, bz] = Rot(lx, lz, n.rot); if (onWalk(n.x + bx, n.z + bz)) { put(bundleG, n.x + bx, 0.25, n.z + bz, (i + lx > 0) & 3, false); cnt.bundles++; } }
    });
    // 7) granite horse trough with a lion spout near Harbour Blvd x Grand Ave
    { const I = inter.find((q) => q.x === 0 && q.z === 160) || inter.find((q) => q.x === 0 && q.z === 80);
      if (I) for (const [sx, al] of [[-1, 7], [1, 7], [-1, 12]]) { const x = I.x + sx * (I.wv / 2 + al), z = I.z - (I.wh / 2 + 2.2); if (tp(troughG, x, z, 2, 1.2)) { cnt.troughs++; ST.troughAt = [x, z]; break; } } }
    // 7a) chalk hopscotch grids on Old Town / residential pavements (painted, 1 block = 0.25 m)
    { let hn = 0; for (const L of lamps) { if (hn >= 10) break; const p = L.p; if (p.w > 10 || hash((L.t | 0) + 5, (p.c | 0) + 91) > 0.12) continue;
        const d0 = L.sd * (p.w / 2 + 1.6), cells = [[0, 0], [1, 0], [2, -0.5], [2, 0.5], [3, 0], [4, -0.5], [4, 0.5], [5, 0]];
        let ok = true; const pts = [];
        for (const [a, b] of cells) for (let u = 0; u < 3; u++) for (let v = 0; v < 3; v++) { const tt = L.t + 3 + a * 0.75 + u * 0.25, dd = d0 + L.sd * b * 0.75 + (v - 1) * 0.25; const x = p.hor ? tt : p.c + dd, z = p.hor ? p.c + dd : tt, i = W.col(x, z); if (i < 0 || ST.mask[i] !== 2 || W.H[i] !== 1 || W.getM(x, 0.4, z)) { ok = false; break; } pts.push([i, u === 1 && v === 1]); }
        if (!ok) continue; for (const [i, mid] of pts) if (!mid) W.C[i] = (hn & 1) ? k.chalkP : k.chalk; hn++; }
      cnt.hopscotch = hn; }
    // 7b) chestnut roasters: black iron barrow, glowing brazier (coals always lit), a paper-cone stack, a vendor spot
    { const coal = c(0xff6a20, { emit: 0xff5a10, emitK: 2.2, mode: 'always', jitter: 0.3, edge: 0 }), ironB = c(0x2a2826, { jitter: 0.1, edge: 0.3, metal: 0.4, rough: 0.5 });
      const nutG = G('chestnut', () => { const m = new AF.Model(12, 16, 7);
        for (const x of [1, 10]) { m.box(x, 0, 0, x + 1, 5, 1, ironB); m.box(x, 0, 6, x + 1, 5, 7, ironB); }
        m.box(0, 5, 0, 12, 9, 7, ironB); m.box(1, 9, 1, 11, 10, 6, ironB); m.box(2, 10, 2, 10, 11, 5, coal); for (let x = 2; x < 10; x += 2) m.set(x, 11, 3, k.woodD);
        m.box(8, 11, 2, 11, 12, 5, ironB); m.box(9, 12, 3, 10, 16, 4, ironB);   // stovepipe
        m.box(0, 9, 0, 3, 11, 2, k.paper); m.set(1, 11, 1, k.paper2); m.line(12, 6, 3, 15, 8, 3, k.woodD);
        return AF.meshModel(m, { vs: 1 / 8 }); });
      cnt.chestnuts = 0;
      for (const [x, z, sx, sz, al] of [[0, 80, 1, -1, 8], [-80, 0, -1, 1, 11], [80, 80, -1, -1, 9], [0, -80, 1, 1, 10], [-160, 80, 1, 1, 9]]) {
        const I = inter.find((q) => q.x === x && q.z === z); if (!I) continue;
        let px = 0, pz = 0, okp = false;
        for (const a2 of [al, al + 4, al - 3, al + 8]) { px = I.x + sx * (I.wv / 2 + a2); pz = I.z + sz * (I.wh / 2 + 1.7); if (onWalk(px, pz) && free(px, pz, 1.0) && onWalk(px + 0.8, pz) && onWalk(px - 0.8, pz)) { okp = true; break; } }
        if (okp && tp(nutG, px, pz, sz > 0 ? 2 : 0, 1.0)) { cnt.chestnuts++; (ST.nutPts = ST.nutPts || []).push([px, pz]); (ST.steamPts = ST.steamPts || []).push([px + (sz > 0 ? -1 : 1) * 0.56, 0.25 + 2.0, pz]); AF.addSpot({ building: 'street-chestnuts', x: px, y: 0.25, z: pz + sz * 0.9, yaw: sz > 0 ? Math.PI : 0, kind: 'work' }); AF.addLight({ x: px, y: 1.6, z: pz, color: 0xff8a40, intensity: 0.6, range: 4, kind: 'sign' }); }
      }
    }
    // 7c) steam / smoke wisps from the cart pots and roaster pipes (tiny instanced puffs, only near the camera)
    { const sp = ST.steamPts || [], PER = 7, N = sp.length * PER;
      if (N) {
        const g = new THREE.IcosahedronGeometry(0.09, 0), mat = new THREE.MeshBasicMaterial({ color: 0xf2eee6, transparent: true, opacity: 0.32, depthWrite: false });
        const im = new THREE.InstancedMesh(g, mat, N), dm = new THREE.Object3D(); im.frustumCulled = false; im.castShadow = false; AF.scene.add(im);
        AF.onTick('streets-cart-steam', 337, (dt, t) => {
          const cam = AF.camera; if (!cam) return; let near = false;
          for (const q of sp) if (Math.abs(q[0] - cam.position.x) < 60 && Math.abs(q[2] - cam.position.z) < 60 && cam.position.y < 40) { near = true; break; }
          im.visible = near; if (!near) return;
          const WD = AF.wind || {}, wx = WD.x ?? 0.3, wz = WD.z ?? -0.9;
          let i = 0; for (let a = 0; a < sp.length; a++) { const q = sp[a]; for (let k2 = 0; k2 < PER; k2++, i++) {
            const age = ((t / 2.6 + k2 / PER + a * 0.37) % 1 + 1) % 1, sc = 0.6 + age * 3.2 * (1 - age * 0.45);
            dm.position.set(q[0] + wx * age * age * 0.9 + Math.sin(t * 2 + k2) * 0.05, q[1] + age * 1.3, q[2] + wz * age * age * 0.9);
            dm.scale.setScalar(age > 0.85 ? sc * (1 - (age - 0.85) / 0.15) : sc); dm.updateMatrix(); im.setMatrixAt(i, dm.matrix);
          } }
          im.instanceMatrix.needsUpdate = true;
        });
      }
    }
    // 8) police call boxes: amber lamp that blinks at night (one InstancedMesh, colour flips 3x a second)
    const cb = ST.callboxPts || [];
    if (cb.length) {
      const g = new THREE.BoxGeometry(0.16, 0.27, 0.16), mat = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
      const im = new THREE.InstancedMesh(g, mat, cb.length), dm = new THREE.Object3D();
      cb.forEach(([x, z], i) => { dm.position.set(x, 0.25 + 21 / 8, z); dm.updateMatrix(); im.setMatrixAt(i, dm.matrix); });
      const cOn = new THREE.Color(0xffb030).multiplyScalar(3.0), cOff = new THREE.Color(0x6a4a20), cDay = new THREE.Color(0xd8a050);
      for (let i = 0; i < cb.length; i++) im.setColorAt(i, cDay);
      im.frustumCulled = false; AF.scene.add(im);
      let acc = 0, was = -1;
      AF.onTick('streets-callbox-blink', 335, (dt, t) => {
        acc += dt; if (acc < 0.15) return; acc = 0;
        const night = AF.time && (AF.time.hours > 18.6 || AF.time.hours < 6.2);
        const st = night ? (Math.floor(t * 1.6) & 1) : 2; if (st === was) return; was = st;
        for (let i = 0; i < cb.length; i++) im.setColorAt(i, st === 2 ? cDay : ((st + i) & 1) ? cOn : cOff);
        im.instanceColor.needsUpdate = true;
      });
    }
    W.tDirty = true;
  });
  // ------------------------------------------------------------ ROUND 2: loose newspaper sheets tumbling down the street on the breeze
  //   (24 instanced sheets live within ~28 m of a street-level camera; they skip, flip and settle, and lift in the gusts)
  AF.onBuild('streets-papers', 489, () => {
    const N = 14, g = new THREE.PlaneGeometry(0.34, 0.26);
    const mat = new THREE.MeshLambertMaterial({ color: 0xf2ede0, emissive: 0x4a463c, side: THREE.DoubleSide });
    const im = new THREE.InstancedMesh(g, mat, N), dm = new THREE.Object3D();
    im.frustumCulled = false; im.castShadow = false; AF.scene.add(im);
    const S = []; for (let i = 0; i < N; i++) S.push({ x: 0, z: 0, y: -50, vy: 0, ph: i * 1.7, rest: 0, spin: 0, a: 0, live: false });
    const rnd = AF.rng(4242);
    const spawn = (s, cx, cz, wx, wz, near) => {
      for (let tries = 0; tries < 6; tries++) {
        const r = near ? 5 + rnd() * 20 : 24 + rnd() * 4, a = rnd() * Math.PI * 2;
        const x = near ? cx + Math.cos(a) * r : cx - wx * r + (rnd() - 0.5) * 30, z = near ? cz + Math.sin(a) * r : cz - wz * r + (rnd() - 0.5) * 30;
        const i = W.col(x, z); if (i < 0 || !ST.mask || !ST.mask[i] || W.getM(x, 0.6, z)) continue;
        s.x = x; s.z = z; s.y = W.H[i] * 0.25 + 0.02; s.vy = 0; s.rest = rnd() * 3; s.a = rnd() * 6.28; s.spin = (rnd() - 0.5) * 4; s.live = true; return;
      }
      s.live = false; s.y = -50;
    };
    let wasOn = false;
    AF.onTick('streets-papers', 336, (dt, t) => {
      const cam = AF.camera; if (!cam) return;
      const on = cam.position.y < 25;
      if (!on) { if (wasOn) { dm.position.set(0, -50, 0); dm.updateMatrix(); for (let i = 0; i < N; i++) im.setMatrixAt(i, dm.matrix); im.instanceMatrix.needsUpdate = true; wasOn = false; } return; }
      const cx = cam.position.x, cz = cam.position.z, WD = AF.wind || {}, wx = WD.x ?? 0.34, wz = WD.z ?? -0.94;
      dt = Math.min(dt, 0.05);
      for (let i = 0; i < N; i++) {
        const s = S[i];
        if (!s.live || Math.hypot(s.x - cx, s.z - cz) > 30) { spawn(s, cx, cz, wx, wz, !wasOn || !s.live); continue; }
        const str = typeof WD.at === 'function' ? WD.at(s.x, s.z) : 0.6;
        const col = W.col(s.x, s.z), gy = col >= 0 ? W.H[col] * 0.25 + 0.02 : 0.02;
        if (s.rest > 0) { s.rest -= dt * (0.4 + str); if (s.y > gy) s.y = Math.max(gy, s.y - dt * 0.8); }
        else {
          const sp = 0.8 + str * 2.2, nx = s.x + wx * sp * dt + Math.sin(t * 1.3 + s.ph) * 0.4 * dt, nz = s.z + wz * sp * dt + Math.cos(t * 1.1 + s.ph) * 0.4 * dt;
          if (W.getM(nx, s.y + 0.1, nz)) { s.rest = 1 + rnd() * 3; }
          else { s.x = nx; s.z = nz; }
          s.vy += (str > 0.9 && s.y < gy + 0.2 ? 6 : 0) * dt - 3.2 * dt; s.y += s.vy * dt;
          if (s.y < gy) { s.y = gy; s.vy = str * (0.6 + rnd() * 0.8); if (rnd() < 0.08) s.rest = 1 + rnd() * 4; }
          s.a += s.spin * dt * (0.5 + str);
        }
        const air = s.y - gy;
        dm.position.set(s.x, s.y + 0.005, s.z);
        dm.rotation.set(-Math.PI / 2 + Math.sin(s.a * 1.7) * Math.min(1.2, air * 3), s.a, Math.cos(s.a) * Math.min(0.9, air * 2), 'YXZ');
        dm.updateMatrix(); im.setMatrixAt(i, dm.matrix);
      }
      im.instanceMatrix.needsUpdate = true; wasOn = true;
    });
    ST.papers = N;
  });

  AF.onBuild('streets-door-check', 495, () => {
    const bad = [];
    for (const b of AF.buildings) for (const d of b.doors || []) for (const c of claimed) if (c[2] < 1.2 && Math.abs(c[0] - d.x) < 1 + c[2] && Math.abs(c[1] - d.z) < 1 + c[2]) bad.push(b.id);
    ST.doorConflicts = bad; if (bad.length) console.warn('[streets] furniture near late doors', bad.slice(0, 12).join(','));
  });
  // ------------------------------------------------------------ tests
  AF.test('streets: roads h0 + sidewalks h1', () => {
    const pts = [[0, 0, 0], [120, 0, 0], [0, 100, 0], [-160, 50, 0], [120, -160, 0], [30, -160 + 11.5, 1], [0 + 8.5, 40, 1], [120, 8.5, 1], [-160 - 11.5, 30, 1], [50, 80 + 6.5, 1]];
    const bad = pts.filter(([x, z, h]) => W.H[W.col(x, z)] !== h);
    return { ok: bad.length === 0, info: bad.length ? 'bad ' + JSON.stringify(bad) : pts.length + ' samples ok' };
  });
  AF.test('streets: traffic lights cycle', () => {
    const T = AF.trafficLight; if (!T || !T.at || T.at.length < 8) return { ok: false, info: 'lights ' + (T && T.at ? T.at.length : 0) };
    const [x, z] = T.at[0], seen = new Set(), t0 = AF.clock.t;
    for (let s = 0; s < 28; s += 0.5) { AF.clock.t = t0 + s; seen.add(T.state(x, z, [1, 0]) + T.state(x, z, [0, 1])); }
    AF.clock.t = t0;
    return { ok: seen.size >= 4, info: T.at.length + ' intersections, ' + seen.size + ' phase combos' };
  });
  AF.test('streets: sidewalk life (r2)', () => {
    const c = ST.counts || {};
    const ok = c.benches >= 120 && c.planters >= 60 && c.booths >= 8 && c.bikes >= 15 && c.stoops >= 30 && c.headlines >= 8;
    return { ok, info: ['benches', 'planters', 'booths', 'bikes', 'stoops', 'crates', 'barrels', 'bundles', 'headlines', 'troughs', 'lampBanners', 'festoons'].map((n) => n + ' ' + c[n]).join(', ') };
  });
  AF.test('streets: furniture counts', () => {
    const c = ST.counts || {};
    const ok = c.lamps > 200 && c.hydrants >= 40 && c.mailboxes >= 20 && c.callboxes >= 10 && c.newsstands >= 8 && c.clocks >= 4 && (AF.manholes || []).length >= 60 && c.busStops >= 6;
    return { ok, info: JSON.stringify(c) + ' manholes ' + (AF.manholes || []).length };
  });
}

} catch (e) { AF.partError('11-streets.js', e); }

