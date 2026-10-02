// ================================================================ 30-civic.js
try {
// ===== 30-civic: civic kit (AF.CIV) + CITY HALL (dome, rotunda, council, mayor) + CIVIC PLAZA  (OWNER: civic) =====
// Shared helpers live on AF.CIV so 31-civic-2.js (library, museum, Union Terminal) can use them.
{
  const W = AF.W, col = AF.col;
  const CIV = AF.CIV = {};
  // ---------------------------------------------------------------- palette (defined once)
  const K = CIV.K = {
    lime: col(0xe6d9bb, { jitter: 0.4, edge: 0.35 }), limeD: col(0xcbbb96, { jitter: 0.45, edge: 0.4 }), limeW: col(0xf3ecda, { jitter: 0.15, edge: 0.3 }),
    limeN: col(0xe6d9bb, { jitter: 0.35, edge: 0.3, emit: 0xffe1b0, emitK: 0.22, mode: 'night' }),
    limeWN: col(0xf3ecda, { jitter: 0.15, edge: 0.3, emit: 0xffe8c0, emitK: 0.3, mode: 'night' }),
    buff: col(0xd8b389, { jitter: 0.5, edge: 0.4 }), buffD: col(0xbf9670, { jitter: 0.5, edge: 0.4 }),
    granite: col(0x2b2a30, { jitter: 0.25, edge: 0.3 }), graniteR: col(0x6a3b36, { jitter: 0.3, edge: 0.3 }),
    bronze: col(0x86592e, { jitter: 0.25, edge: 0.25 }), bronzeD: col(0x5a3b20, { jitter: 0.25, edge: 0.25 }),
    brass: col(0xc9a24c, { jitter: 0.2, edge: 0.15 }), gold: col(0xe2b446, { jitter: 0.2, edge: 0.2 }),
    goldN: col(0xe2b446, { jitter: 0.15, edge: 0.2, emit: 0xffcc66, emitK: 0.9, mode: 'night' }),
    copper: col(0x5da58b, { jitter: 0.35, edge: 0.3, emit: 0x86d8b8, emitK: 0.3, mode: 'night' }),
    copperL: col(0x7cc3a6, { jitter: 0.3, edge: 0.3, emit: 0xa0f0d0, emitK: 0.4, mode: 'night' }),
    copperD: col(0x3f7c68, { jitter: 0.35, edge: 0.3 }),
    jade: col(0x2f8a78, { jitter: 0.3, edge: 0.3 }), teal: col(0x2a6a74, { jitter: 0.3 }), navy: col(0x253a63, { jitter: 0.3 }),
    red: col(0xa8302a, { jitter: 0.3 }), redD: col(0x7a2220, { jitter: 0.3 }), green: col(0x2f6b45, { jitter: 0.3 }), greenD: col(0x22503a, { jitter: 0.3 }),
    blue: col(0x3e79b3, { jitter: 0.25 }), land: col(0x79a35a, { jitter: 0.4 }),
    plaster: col(0xf1e7d0, { jitter: 0.12, edge: 0.08 }), plasterJ: col(0xd8e6dc, { jitter: 0.12, edge: 0.08 }), plasterR: col(0xecd3bf, { jitter: 0.12, edge: 0.08 }),
    wain: col(0x6d4427, { jitter: 0.35, edge: 0.3 }), wood: col(0x8e5c2d, { jitter: 0.5, edge: 0.3 }), woodD: col(0x5b3a22, { jitter: 0.45, edge: 0.3 }), woodL: col(0xbb8b55, { jitter: 0.55, edge: 0.3 }),
    oak: col(0xa8773f, { jitter: 0.45, edge: 0.3 }), floorW: col(0x9a6a3a, { jitter: 0.6, edge: 0.35 }),
    marbleW: col(0xeee8dc, { jitter: 0.2, edge: 0.3 }), marbleB: col(0x2f3038, { jitter: 0.25, edge: 0.3 }), marbleR: col(0x8f3d36, { jitter: 0.3, edge: 0.3 }), marbleG: col(0x3f7a68, { jitter: 0.3, edge: 0.3 }), marbleY: col(0xd9b877, { jitter: 0.3, edge: 0.3 }),
    white: col(0xf4f0e6, { jitter: 0.12, edge: 0.2 }), black: AF.col('black'), glass: AF.col('glass'), paper: col(0xf4efdc, { jitter: 0.1 }),
    steel: col(0x8b9097, { jitter: 0.2 }), steelD: col(0x5d636b, { jitter: 0.2 }), steelL: col(0xc3c8cf, { jitter: 0.15, edge: 0.25 }), iron: col(0x2c2c30, { jitter: 0.2, edge: 0.1 }),
    fabricR: col(0x9a3030, { jitter: 0.35 }), fabricG: col(0x3d6e4e, { jitter: 0.35 }), fabricB: col(0x3a5a8a, { jitter: 0.35 }), fabricGo: col(0xc79a45, { jitter: 0.35 }),
    curtain: col(0x8e2626, { jitter: 0.3, solid: false }),
    lampA: col(0xfff0c8, { emit: 0xffd48a, emitK: 2.6, mode: 'always', jitter: 0, edge: 0 }),
    lampG: col(0x2f7a4a, { emit: 0x3f9a5a, emitK: 0.5, mode: 'always', jitter: 0.1, edge: 0 }),
    bulbN: col(0xfff3d0, { emit: 0xffdd99, emitK: 3.2, mode: 'night', jitter: 0, edge: 0 }),
    flood: col(0xfff6dc, { emit: 0xffe6b0, emitK: 3.0, mode: 'night', jitter: 0, edge: 0 }),
    leaf: col(0x3e7a3a, { jitter: 0.8, solid: false }), leafD: col(0x2e5e2e, { jitter: 0.8, solid: false }), leafA: col(0xc7702a, { jitter: 0.8, solid: false }), leafY: col(0xd9a33a, { jitter: 0.8, solid: false }),
    soil: col(0x4a3524, { jitter: 0.5 }), hedge: col(0x3a6b34, { jitter: 0.9, edge: 0.4 }),
    flowerR: col(0xd2443a, { solid: false, jitter: 0.6 }), flowerY: col(0xe8b83a, { solid: false, jitter: 0.6 }), flowerP: col(0xc05a9a, { solid: false, jitter: 0.6 }),
    pave: col(0xd9cdb2, { jitter: 0.35, edge: 0.3 }), paveD: col(0xbfae8c, { jitter: 0.35, edge: 0.3 }), paveR: col(0xb86a48, { jitter: 0.4, edge: 0.3 }), paveJ: col(0x5f9a86, { jitter: 0.35, edge: 0.3 }),
    ivory: col(0xeee4c8, { jitter: 0.25, edge: 0.35 }), ivoryD: col(0xcfc09c, { jitter: 0.3, edge: 0.35 }),
    winW: col(0x2a3040, { emit: 0xffc46a, emitK: 1.5, mode: 'night', jitter: 0.05, edge: 0.15 }),
    winC: col(0x2c3240, { emit: 0xffe6b0, emitK: 1.2, mode: 'night', jitter: 0.05, edge: 0.15 }),
    winD: col(0x1d2330, { jitter: 0.05, edge: 0.15 }),
    winB: col(0x283048, { emit: 0x8ab4ff, emitK: 0.9, mode: 'night', jitter: 0.05, edge: 0.15 }),
    water: col(0xd8f0ff, { emit: 0xa8d8ff, emitK: 0.35, mode: 'always', jitter: 0, edge: 0 }),
    waterB: col(0x3f7f8f, { jitter: 0.2, edge: 0.1 }),
  };
  const BOOKS = CIV.BOOKS = [0x7a2a26, 0x2f4f7a, 0x2f6a45, 0x8a6a2a, 0x5a2f5a, 0x9a4a2a, 0x3a3a3a, 0xc9b48a, 0x4a6a6a, 0xa8563a].map((h) => col(h, { jitter: 0.3, edge: 0.6 }));
  const WINS = [K.winW, K.winW, K.winC, K.winD, K.winD, K.winB];
  CIV.winCol = (a, b) => WINS[(AF.hash2(a * 7 + 3, b * 13 + 1) * WINS.length) | 0];

  // ---------------------------------------------------------------- voxel helpers (metres)
  const F = CIV.F = (x0, y0, z0, x1, y1, z1, c) => W.fill(Math.min(x0, x1), Math.min(y0, y1), Math.min(z0, z1), Math.max(x0, x1), Math.max(y0, y1), Math.max(z0, z1), c);
  // per-block visitor over a metre box: fn(x,y,z) (block centres) -> colour (0 = air) or undefined (skip)
  const each = CIV.each = (x0, y0, z0, x1, y1, z1, fn) => {
    const a = W.bx(x0 + 1e-4), b = W.bx(x1 - 1e-4), c = W.by(y0 + 1e-4), d = W.by(y1 - 1e-4), e = W.bz(z0 + 1e-4), f = W.bz(z1 - 1e-4);
    for (let bx = a; bx <= b; bx++) { const x = W.xOf(bx) + 0.125; for (let bz = e; bz <= f; bz++) { const z = W.zOf(bz) + 0.125; for (let by = c; by <= d; by++) { const r = fn(x, W.yOf(by) + 0.125, z); if (r !== undefined) W.set(bx, by, bz, r); } } }
  };
  // column visitor: fn(x,z) -> [y0,y1,colour] | null
  const cols = CIV.cols = (x0, z0, x1, z1, fn) => {
    const a = W.bx(x0 + 1e-4), b = W.bx(x1 - 1e-4), e = W.bz(z0 + 1e-4), f = W.bz(z1 - 1e-4);
    for (let bx = a; bx <= b; bx++) { const x = W.xOf(bx) + 0.125; for (let bz = e; bz <= f; bz++) { const r = fn(x, W.zOf(bz) + 0.125); if (r) W.fillB(bx, W.by(r[0] + 1e-4), bz, bx + 1, W.by(r[1] + 1e-4), bz + 1, r[2]); } }
  };
  // face frame on rect [x0,z0,x1,z1]: u along the wall (from min coord), d = outward distance from the outer plane
  const face = CIV.face = (r, side) => {
    const [x0, z0, x1, z1] = r;
    const map = side === 's' ? (u, d) => [x0 + u, z1 + d] : side === 'n' ? (u, d) => [x0 + u, z0 - d] : side === 'e' ? (u, d) => [x1 + d, z0 + u] : (u, d) => [x0 - d, z0 + u];
    const len = (side === 's' || side === 'n') ? x1 - x0 : z1 - z0;
    const out = side === 's' ? 0 : side === 'e' ? 1 : side === 'n' ? 2 : 3;
    return { len, side, map, rotOut: out, rotIn: (out + 2) % 4, fill(u0, u1, y0, y1, d0, d1, c) { const a = map(u0, d0), b = map(u1, d1); F(a[0], y0, a[1], b[0], y1, b[1], c); } };
  };
  // recessed window grid on a SOLID (or thick) facade: bays of width bay, window w x h, rows at ys[]
  CIV.winGrid = (f, u0, u1, bay, w, ys, h, o = {}) => {
    const n = Math.floor((u1 - u0) / bay);
    const off = u0 + ((u1 - u0) - n * bay) / 2;
    for (let i = 0; i < n; i++) {
      const uc = off + bay * (i + 0.5);
      if (o.skip && o.skip(uc)) continue;
      for (let j = 0; j < ys.length; j++) {
        const y = ys[j], a = uc - w / 2, b = uc + w / 2;
        if (o.glass) { f.fill(a, b, y, y + h, -(o.t ?? 0.5), 0, 0); f.fill(a, b, y, y + h, -(o.t ?? 0.5), -(o.t ?? 0.5) + 0.25, K.glass); }
        else { f.fill(a, b, y, y + h, -0.25, 0, 0); f.fill(a, b, y, y + h, -0.5, -0.25, CIV.winCol(Math.round(uc * 4) + f.rotOut * 997, Math.round(y * 4))); }
        if (w >= 1.25) f.fill(uc - 0.125, uc + 0.125, y, y + h, o.glass ? -(o.t ?? 0.5) : -0.5, o.glass ? -(o.t ?? 0.5) + 0.25 : -0.25, o.mull ?? K.bronzeD);
        if (o.sill !== false) f.fill(a - 0.25, b + 0.25, y - 0.25, y, 0, 0.25, o.sill ?? K.limeW);
        if (o.spandrel) f.fill(a, b, y + h, y + h + 0.5, -0.25, 0, o.spandrel);
      }
      if (o.pier) f.fill(uc + bay / 2 - 0.25, uc + bay / 2 + 0.25, o.pierY0, o.pierY1, 0, 0.25, o.pier);
    }
  };
  // open doorway through a wall t thick (+ frame, transom, open bronze leaves)
  CIV.door = (f, uc, y0, w, h, o = {}) => {
    const t = o.t ?? 0.5, a = uc - w / 2, b = uc + w / 2;
    f.fill(a, b, y0, y0 + h, -t - 0.01, 0.26, 0);
    const fr = o.frame ?? K.bronze;
    f.fill(a - 0.25, a, y0, y0 + h + 0.25, 0, 0.25, fr); f.fill(b, b + 0.25, y0, y0 + h + 0.25, 0, 0.25, fr); f.fill(a - 0.25, b + 0.25, y0 + h, y0 + h + 0.25, 0, 0.25, fr);
    if (o.transom) { f.fill(a, b, y0 + h, y0 + h + o.transom, -t, 0, 0); f.fill(a, b, y0 + h, y0 + h + o.transom, -t, -t + 0.25, K.glass); for (let u = a + 0.5; u < b - 0.2; u += 0.75) f.fill(u, u + 0.25, y0 + h, y0 + h + o.transom, -t, -t + 0.25, fr); f.fill(a - 0.25, b + 0.25, y0 + h + o.transom, y0 + h + o.transom + 0.25, 0, 0.25, fr); }
    if (o.leaf) { f.fill(a, a + 0.25, y0, y0 + h, -t - 1.0, -t, o.leaf); f.fill(b - 0.25, b, y0, y0 + h, -t - 1.0, -t, o.leaf); }
  };
  // straight flight: n steps of 0.25 rise, `run` metres each; first step (lowest) starts at `start`, ascending in dir along axis
  CIV.steps = (axis, start, dir, c0, c1, yBase, n, run, c, nose) => {
    for (let k = 1; k <= n; k++) {
      const p0 = start + dir * (k - 1) * run, p1 = start + dir * k * run, top = yBase + k * 0.25;
      if (axis === 'x') F(p0, yBase, c0, p1, top, c1, c); else F(c0, yBase, p0, c1, top, p1, c);
      if (nose && k % 2 === 0) { if (axis === 'x') F(p0, top - 0.25, c0, p1, top, c1, nose); else F(c0, top - 0.25, p0, c1, top, p1, nose); }
    }
    return start + dir * n * run;
  };
  CIV.rail = (x0, z0, x1, z1, y, c = K.brass, top = K.bronzeD, hgt = 1.0) => {
    const ax = Math.abs(x1 - x0) >= Math.abs(z1 - z0);
    if (ax) { F(x0, y + hgt - 0.25, z0, x1, y + hgt, z0 + 0.25, top); for (let x = Math.min(x0, x1); x < Math.max(x0, x1) - 1e-6; x += 0.75) F(x, y, z0, x + 0.25, y + hgt - 0.25, z0 + 0.25, c); }
    else { F(x0, y + hgt - 0.25, z0, x0 + 0.25, y + hgt, z1, top); for (let z = Math.min(z0, z1); z < Math.max(z0, z1) - 1e-6; z += 0.75) F(x0, y, z, x0 + 0.25, y + hgt - 0.25, z + 0.25, c); }
  };
  // round-ish column (fluted look) with base + capital
  CIV.column = (cx, cz, y0, y1, c = K.limeN, cap = K.limeD, rad = 0.5) => {
    F(cx - rad - 0.25, y0, cz - rad - 0.25, cx + rad + 0.25, y0 + 0.5, cz + rad + 0.25, cap);
    F(cx - rad, y0 + 0.5, cz - rad + 0.25, cx + rad, y1 - 0.5, cz + rad - 0.25, c);
    F(cx - rad + 0.25, y0 + 0.5, cz - rad, cx + rad - 0.25, y1 - 0.5, cz + rad, c);
    F(cx - rad - 0.25, y1 - 0.5, cz - rad - 0.25, cx + rad + 0.25, y1, cz + rad + 0.25, cap);
    F(cx - rad, y1 - 0.75, cz - rad, cx + rad, y1 - 0.5, cz + rad, K.gold);
  };
  CIV.band = (r, y0, y1, p, c) => { const [x0, z0, x1, z1] = r; W.walls(x0 - p, y0, z0 - p, x1 + p, y1, z1 + p, c, p + 0.25); };
  CIV.chevrons = (f, u0, u1, y, c1, c2) => { for (let u = u0, i = 0; u < u1 - 0.4; u += 1, i++) { f.fill(u, u + 1, y, y + 0.25, 0, 0.25, c1); f.fill(u + 0.25, u + 0.75, y + 0.25, y + 0.5, 0, 0.25, i % 2 ? c1 : c2); f.fill(u + 0.375 - 0.125, u + 0.625 + 0.125 - 0.25, y + 0.5, y + 0.75, 0, 0.25, c2); } };
  CIV.lotGround = (id, c) => { const l = AF.PLAN.lot(id); if (!l) return; W.ground(l.rect[0], l.rect[1], l.rect[2], l.rect[3], 1, c); };
  CIV.light = (x, y, z, intensity = 1.2, range = 14, color = 0xffd9a0, kind = 'interior') => AF.addLight({ x, y, z, color, intensity, range, kind });
  CIV.spot = (building, x, y, z, yaw, kind, path) => AF.addSpot(path ? { building, x, y, z, yaw, kind, path } : { building, x, y, z, yaw, kind });
  CIV.toast = (msg) => AF.emit('toast', msg);
  CIV.text = (str, fg, x, y, z, rot = 0, o = {}) => { const m = AF.textModel(str, fg, Object.assign({ pad: 0 }, o)); W.stamp(m, x, y, z, rot); return m.w * 0.25; };
  CIV.textProp = (str, fg, x, y, z, rot, vs = 1 / 16, o = {}) => { const m = AF.textModel(str, fg, Object.assign({ pad: 0 }, o)); const g = AF.meshModel(m, { vs, anchor: [0.5, 0, 0] }); AF.placeStatic(g, x, y, z, rot, { collide: false }); return m.w * vs; };
  CIV.walkTest = (name, x0, y0, z0, pts, expectY, tol = 0.6) => AF.test(name, () => {
    const b = { x: x0, y: y0, z: z0, vy: 0, r: 0.3, h: 1.7, onGround: true };
    for (let i = 0; i < 30; i++) AF.moveBody(b, 0, 0, 1 / 60);
    for (const [tx, tz] of pts) for (let i = 0; i < 2500; i++) { const ex = tx - b.x, ez = tz - b.z, d = Math.hypot(ex, ez); if (d < 0.1) break; const s = Math.min(d, 0.075); AF.moveBody(b, ex / d * s, ez / d * s, 1 / 60); }
    for (let i = 0; i < 30; i++) AF.moveBody(b, 0, 0, 1 / 60);
    const [tx, tz] = pts[pts.length - 1];
    const ok = Math.abs(b.y - expectY) < tol && Math.hypot(b.x - tx, b.z - tz) < 1.0;
    return { ok, info: `end ${b.x.toFixed(2)},${b.y.toFixed(2)},${b.z.toFixed(2)} expected (${tx},${expectY},${tz})` };
  });

  // ---------------------------------------------------------------- props (Models, cached geometry)
  const GEO = CIV.GEO = {};
  const M = CIV.M = (w, h, d) => new AF.Model(w, h, d);
  const def = CIV.def = (key, fn, vs = 1 / 8, anchor = [0.5, 0, 0.5]) => { CIV._defs = CIV._defs || {}; CIV._defs[key] = { fn, vs, anchor }; };
  const geo = CIV.geo = (key) => { if (GEO[key]) return GEO[key]; const d = CIV._defs[key]; return (GEO[key] = AF.meshModel(d.fn(), { vs: d.vs, anchor: d.anchor })); };
  const put = CIV.put = (key, x, y, z, rot = 0, collide = true) => AF.placeStatic(geo(key), x, y, z, rot, { collide });
  // furniture: 1/8 m voxels, front faces +z, anchor bottom-centre
  def('chair', () => { const m = M(4, 8, 4); for (const [x, z] of [[0, 0], [3, 0], [0, 3], [3, 3]]) m.box(x, 0, z, x + 1, 3, z + 1, K.woodD); m.box(0, 3, 0, 4, 4, 4, K.wood); m.box(0, 4, 0, 4, 8, 1, K.woodD); m.box(1, 5, 0, 3, 7, 1, K.fabricR); return m; });
  def('chairG', () => { const m = M(4, 8, 4); for (const [x, z] of [[0, 0], [3, 0], [0, 3], [3, 3]]) m.box(x, 0, z, x + 1, 3, z + 1, K.woodD); m.box(0, 3, 0, 4, 4, 4, K.fabricG); m.box(0, 4, 0, 4, 8, 1, K.woodD); return m; });
  def('desk', () => { const m = M(12, 7, 7); m.box(0, 0, 1, 4, 5, 7, K.wood); m.box(8, 0, 1, 12, 5, 7, K.wood); m.box(0, 5, 0, 12, 6, 7, K.woodD); m.box(1, 1, 6, 3, 2, 7, K.brass); m.box(9, 1, 6, 11, 2, 7, K.brass); m.box(4, 6, 2, 9, 7, 5, K.greenD); m.box(5, 6, 3, 7, 7, 4, K.paper); m.set(10, 6, 2, K.black); return m; });
  def('bigdesk', () => { const m = M(18, 8, 9); m.box(0, 0, 1, 6, 6, 9, K.woodD); m.box(12, 0, 1, 18, 6, 9, K.woodD); m.box(6, 3, 8, 12, 6, 9, K.woodD); m.box(0, 6, 0, 18, 7, 9, K.wood); for (let y = 1; y < 6; y += 2) { m.box(2, y, 8, 4, y + 1, 9, K.brass); m.box(14, y, 8, 16, y + 1, 9, K.brass); } m.box(5, 7, 2, 12, 8, 6, K.greenD); m.box(6, 7, 3, 9, 8, 5, K.paper); m.box(14, 7, 3, 15, 8, 4, K.black); m.box(2, 7, 3, 4, 8, 5, K.paper); return m; });
  def('longtable', () => { const m = M(32, 6, 9); m.box(0, 5, 0, 32, 6, 9, K.oak); for (const x of [1, 15, 30]) m.box(x, 0, 1, x + 1, 5, 8, K.woodD); m.box(1, 2, 4, 31, 3, 5, K.woodD); return m; });
  def('armchair', () => { const m = M(7, 7, 7); m.box(0, 0, 0, 7, 3, 7, K.fabricR); m.box(0, 3, 0, 7, 7, 2, K.fabricR); m.box(0, 3, 0, 1, 5, 7, K.redD); m.box(6, 3, 0, 7, 5, 7, K.redD); m.box(1, 3, 2, 6, 4, 7, K.fabricGo); return m; });
  def('sofa', () => { const m = M(16, 7, 7); m.box(0, 0, 0, 16, 3, 7, K.fabricG); m.box(0, 3, 0, 16, 7, 2, K.fabricG); m.box(0, 3, 0, 2, 5, 7, K.greenD); m.box(14, 3, 0, 16, 5, 7, K.greenD); m.box(2, 3, 2, 14, 4, 7, K.fabricG); return m; });
  // floor lamp with a tapered pleated silk shade: the glow shows only under the rim and through the top (round 2)
  def('floorlamp', () => { const m = M(8, 18, 8), sa = col(0xf0dcb0, { jitter: 0.08, edge: 0.1 }), sb = col(0xd6b886, { jitter: 0.08, edge: 0.1 });
    m.box(2, 0, 2, 6, 1, 6, K.brass); m.box(3, 1, 3, 5, 2, 5, K.bronzeD); m.box(3, 2, 3, 4, 13, 4, K.brass); m.box(2, 7, 2, 5, 8, 5, K.gold);
    const ring = (y, a, b) => { for (let x = a; x < b; x++) for (let z = a; z < b; z++) if (x === a || z === a || x === b - 1 || z === b - 1) m.set(x, y, z, (x + z + y) % 2 ? sa : sb); };
    ring(12, 0, 8); ring(13, 0, 8); ring(14, 1, 7); ring(15, 1, 7); ring(16, 2, 6); m.box(3, 12, 3, 5, 14, 5, K.lampA); m.box(3, 16, 3, 5, 17, 5, K.lampA); m.box(3, 17, 3, 5, 18, 5, K.brass); return m; }, 1 / 10);
  def('bankers', () => { const m = M(6, 6, 4); m.box(2, 0, 1, 4, 1, 3, K.brass); m.box(2, 1, 1, 3, 4, 2, K.brass); m.box(0, 4, 0, 6, 6, 4, K.lampG); m.box(1, 3, 1, 5, 4, 3, K.lampA); return m; }, 1 / 16);
  def('globe', () => { const m = M(10, 18, 10); m.box(3, 0, 3, 7, 1, 7, K.woodD); m.box(4, 1, 4, 6, 8, 6, K.woodD); m.sphere(5, 13, 5, 4.6, K.blue, (x, y, z) => (AF.hash3(x, y, z) > 0.62 ? K.land : K.blue)); m.box(5, 7, 0, 6, 18, 1, K.brass); return m; }, 1 / 16);
  def('portrait', () => { const m = M(8, 10, 1); m.box(0, 0, 0, 8, 10, 1, K.gold); m.box(1, 1, 0, 7, 9, 1, col(0x3a2f26)); m.box(3, 5, 0, 5, 8, 1, col(0xd8b08a)); m.box(2, 1, 0, 6, 5, 1, K.black); m.set(4, 4, 0, K.white); return m; });
  def('painting', () => { const m = M(12, 8, 1); m.box(0, 0, 0, 12, 8, 1, K.gold); m.box(1, 1, 0, 11, 7, 1, col(0x8cb4d4)); m.box(1, 1, 0, 11, 3, 1, col(0x3f6a8a)); m.box(6, 3, 0, 9, 5, 1, K.white); m.box(7, 5, 0, 8, 7, 1, K.woodD); m.box(2, 4, 0, 4, 6, 1, col(0xf0e0b0)); return m; });
  def('palm', () => { const m = M(10, 26, 10); m.box(3, 0, 3, 7, 4, 7, K.buffD); m.box(2, 3, 2, 8, 4, 8, K.buffD); m.box(4, 4, 4, 6, 16, 6, col(0x6b5a3a)); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; for (let s = 0; s < 6; s++) m.set(5 + Math.cos(a) * s, 16 + s * 0.6 - (s * s) * 0.18 + 2, 5 + Math.sin(a) * s, s % 2 ? K.leaf : K.leafD); } m.box(4, 16, 4, 6, 20, 6, K.leaf); return m; });
  def('chandelier', () => { const m = M(16, 16, 16); m.box(7, 10, 7, 9, 16, 9, K.brass); m.sphere(8, 7, 8, 2.2, K.brass); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, x = 8 + Math.cos(a) * 6, z = 8 + Math.sin(a) * 6; m.line(8, 7, 8, x, 8, z, K.brass); m.set(x, 9, z, K.lampA); m.set(x, 8, z, K.brass); } m.box(6, 4, 6, 10, 5, 10, K.brass); m.box(7, 11, 7, 9, 12, 9, K.lampA); return m; });
  def('decolamp', () => { const m = M(8, 20, 8); m.box(3, 8, 3, 5, 20, 5, K.brass); m.box(1, 3, 1, 7, 8, 7, K.lampA); m.box(0, 5, 0, 8, 6, 8, K.brass); m.box(2, 1, 2, 6, 3, 6, K.lampA); m.box(3, 0, 3, 5, 1, 5, K.brass); m.box(2, 8, 2, 6, 9, 6, K.brass); return m; });
  def('bookshelf', () => { const m = M(16, 20, 4); m.box(0, 0, 0, 16, 20, 4, K.woodD); m.box(1, 1, 1, 15, 19, 4, 0); for (const y of [1, 6, 11, 16]) { m.box(1, y - 1, 1, 15, y, 4, K.woodD); let x = 1; while (x < 15) { const w = 2 + ((AF.hash2(x * 5 + 1, y) * 3) | 0), x2 = Math.min(15, x + w), hgt = 3 + ((AF.hash2(x, y * 7 + 3) * 2) | 0), c = BOOKS[(AF.hash2(x * 7, y * 3) * BOOKS.length) | 0]; m.box(x, y, 1, x2, y + hgt, 4, c); x = x2; } } return m; });
  def('filing', () => { const m = M(4, 11, 6); m.box(0, 0, 0, 4, 11, 6, col(0x6d7a66, { jitter: 0.2 })); for (let y = 1; y < 11; y += 3) { m.box(0, y + 1, 5, 4, y + 2, 6, K.steel); m.set(1, y, 5, K.paper); } return m; });
  def('rugR', () => { const m = M(24, 1, 16); m.box(0, 0, 0, 24, 1, 16, K.fabricGo); m.box(1, 0, 1, 23, 1, 15, K.redD); m.box(3, 0, 3, 21, 1, 13, K.fabricR); m.box(10, 0, 6, 14, 1, 10, K.fabricGo); return m; });
  def('rugB', () => { const m = M(16, 1, 12); m.box(0, 0, 0, 16, 1, 12, K.fabricGo); m.box(1, 0, 1, 15, 1, 11, K.navy); m.box(3, 0, 3, 13, 1, 9, K.fabricB); return m; });
  def('pew', () => { const m = M(32, 8, 5); m.box(0, 0, 0, 1, 7, 5, K.woodD); m.box(31, 0, 0, 32, 7, 5, K.woodD); m.box(1, 3, 1, 31, 4, 5, K.wood); m.box(1, 4, 0, 31, 8, 1, K.wood); m.box(1, 1, 4, 31, 2, 5, K.woodD); return m; });
  def('bench', () => { const m = M(16, 4, 4); m.box(0, 3, 0, 16, 4, 4, K.wood); for (const x of [1, 14]) m.box(x, 0, 0, x + 1, 3, 4, K.iron); return m; });
  def('parkbench', () => { const m = M(14, 7, 5); for (const x of [1, 12]) { m.box(x, 0, 1, x + 1, 3, 5, K.iron); m.box(x, 3, 0, x + 1, 7, 1, K.iron); } m.box(0, 3, 1, 14, 4, 5, K.green); m.box(0, 4, 0, 14, 7, 1, K.green); return m; });
  def('flagsmall', () => { const m = M(10, 26, 2); m.box(0, 0, 0, 1, 26, 1, K.brass); m.set(0, 25, 0, K.gold); for (let y = 15; y < 23; y++) m.box(1, y, 0, 10, y + 1, 1, y > 19 ? K.navy : (y % 2 ? K.white : K.red)); m.box(1, 20, 0, 4, 23, 1, K.navy); m.box(0, 0, 0, 3, 1, 2, K.brass); return m; });
  def('cabinetglass', () => { const m = M(10, 16, 5); m.box(0, 0, 0, 10, 16, 5, K.woodD); m.box(1, 6, 1, 9, 15, 5, K.glass); m.box(2, 7, 2, 4, 9, 4, K.gold); m.box(5, 7, 2, 8, 8, 3, K.paper); m.box(2, 11, 2, 7, 12, 3, K.brass); return m; });
  def('gavel', () => { const m = M(8, 4, 4); m.box(0, 0, 0, 4, 1, 4, K.woodD); m.box(4, 1, 1, 8, 2, 2, K.wood); m.box(1, 1, 0, 3, 3, 4, K.woodD); return m; }, 1 / 16);
  def('typewriter', () => { const m = M(6, 3, 5); m.box(0, 0, 0, 6, 2, 5, K.black); m.box(1, 2, 3, 5, 3, 4, K.paper); m.box(0, 1, 0, 6, 2, 2, K.steelD); return m; }, 1 / 16);
  def('coatrack', () => { const m = M(4, 15, 4); m.box(1, 0, 1, 3, 1, 3, K.woodD); m.box(1, 0, 1, 2, 15, 2, K.woodD); m.box(0, 12, 1, 4, 13, 2, K.woodD); m.box(2, 11, 1, 3, 12, 3, K.navy); m.box(0, 13, 0, 3, 15, 2, col(0x6a4a2a)); return m; });
  def('grandfather', () => { const m = M(5, 18, 4); m.box(0, 0, 0, 5, 18, 4, K.woodD); m.box(1, 12, 3, 4, 16, 4, K.paper); m.set(2, 14, 3, K.black); m.box(2, 3, 3, 3, 10, 4, K.brass); return m; });
  def('tellercage', () => { const m = M(24, 22, 2); for (let x = 0; x < 24; x++) { if (x % 2 === 0) m.box(x, 0, 0, x + 1, 22, 1, K.brass); } m.box(0, 21, 0, 24, 22, 2, K.brass); m.box(0, 10, 0, 24, 11, 2, K.brass); m.box(8, 0, 0, 16, 10, 2, 0); m.box(8, 3, 0, 16, 4, 2, K.brass); return m; });
  def('urn', () => { const m = M(6, 8, 6); m.box(2, 0, 2, 4, 2, 4, K.lime); m.sphere(3, 4, 3, 2.8, K.lime); m.box(1, 6, 1, 5, 7, 5, K.lime); m.sphere(3, 8, 3, 2.2, K.leaf, (x, y, z) => y >= 7 ? (AF.hash3(x, y, z) > 0.7 ? K.flowerR : K.leaf) : 0); return m; });
  def('lamppost', () => { const m = M(8, 40, 8); m.box(1, 0, 1, 7, 2, 7, K.iron); m.box(2, 2, 2, 6, 4, 6, K.iron); m.box(3, 4, 3, 5, 29, 5, K.iron); m.box(2, 12, 2, 6, 13, 6, K.iron); m.box(2, 28, 2, 6, 29, 6, K.iron); m.box(2, 29, 2, 6, 35, 6, K.lampA); for (const [x, z] of [[1, 1], [6, 1], [1, 6], [6, 6]]) m.box(x, 29, z, x + 1, 35, z + 1, K.iron); m.box(1, 35, 1, 7, 36, 7, K.iron); m.box(2, 36, 2, 6, 37, 6, K.iron); m.box(3, 37, 3, 5, 38, 5, K.iron); m.box(3, 38, 3, 5, 40, 5, K.gold); return m; });
  def('floodlamp', () => { const m = M(4, 3, 4); m.box(0, 0, 0, 4, 1, 4, K.iron); m.box(1, 1, 0, 3, 3, 3, K.iron); m.box(1, 2, 3, 3, 3, 4, K.flood); m.box(1, 1, 3, 3, 2, 4, K.flood); return m; });
  def('statueFig', () => { const m = M(10, 26, 8); const br = K.bronze, bd = K.bronzeD; m.box(2, 0, 1, 8, 1, 7, bd); m.box(3, 1, 2, 5, 11, 5, br); m.box(5, 1, 2, 7, 11, 5, br); m.box(2, 10, 2, 8, 19, 6, br); m.box(1, 12, 1, 9, 18, 3, bd); m.box(0, 12, 3, 2, 18, 5, br); m.box(8, 14, 3, 10, 21, 5, br); m.box(9, 21, 3, 10, 24, 4, K.gold); m.box(3, 19, 3, 7, 23, 6, br); m.box(2, 23, 2, 8, 24, 7, bd); m.box(3, 24, 3, 7, 26, 6, bd); m.box(3, 1, 0, 7, 11, 1, bd); return m; });
  def('tree', () => { const m = M(27, 30, 27), bark = col(0x5a4330, { jitter: 0.7 }); for (let y = 0; y < 12; y++) m.box(12, y, 12, 15, y + 1, 15, bark); m.line(13.5, 9.5, 13.5, 6.5, 17.5, 9, bark, 1); m.line(13.5, 9.5, 13.5, 20.5, 18.5, 17.5, bark, 1); const lf = [K.leafA, col(0xb34a24, { jitter: 0.9, edge: 0.5, solid: false }), K.leafY, col(0x7a8a3a, { jitter: 0.9, edge: 0.5, solid: false })]; for (const [cx, cy, cz, r] of [[13.5, 21, 13.5, 8.5], [8, 18, 10, 5.5], [19, 19, 17, 5.5], [14, 25, 12, 5.5]]) m.sphere(cx, cy, cz, r, lf[0], (x, y, z) => AF.hash3(x, y, z) > 0.12 ? lf[(AF.hash3(z, x, y) * 4) | 0] : 0); return m; }, 1 / 4);
  CIV.floor = (x0, z0, x1, z1, yTop, c) => F(x0, yTop - 0.25, z0, x1, yTop, z1, c);
  CIV.checker = (x0, z0, x1, z1, yTop, a, b, s = 0.5) => { for (let x = x0, i = 0; x < x1 - 1e-6; x += s, i++) for (let z = z0, j = 0; z < z1 - 1e-6; z += s, j++) F(x, yTop - 0.25, z, Math.min(x1, x + s), yTop, Math.min(z1, z + s), (i + j) % 2 ? a : b); };

  // ---------------------------------------------------------------- dynamic: swaying flags (one merged strip mesh per flag)
  CIV.flags = [];
  CIV.flag = (x, y, z, yaw, design = 0, wPx = 24, hPx = 16) => {
    const BGU = AF.addons && AF.addons.BGU; if (!BGU || !AF.scene) return false;
    const cA = [K.navy, K.jade, K.red, K.navy][design % 4], cB = [K.gold, K.white, K.white, K.white][design % 4], cC = [K.white, K.gold, K.navy, K.red][design % 4];
    const colAt = (x, y) => {
      if (design % 2 === 0) { const dx = x - 7, dy = y - hPx / 2; if (dx * dx + dy * dy < 12) return cB; if (Math.abs(dy) < 1 && x > 11) return cC; return (Math.floor(y / 2) % 3 === 0 && x > 14) ? cC : cA; }
      if (x < 8) return (x + y) % 5 === 0 ? cB : cA; return y < hPx / 3 ? cA : y < 2 * hPx / 3 ? cB : cC;
    };
    try {
      const geos = []; let v0 = 0;
      for (let s = 0; s < wPx / 2; s++) {
        const m = new AF.Model(2, hPx, 1); for (let xx = 0; xx < 2; xx++) for (let yy = 0; yy < hPx; yy++) m.set(xx, yy, 0, colAt(s * 2 + xx, yy));
        const g = AF.meshModel(m, { vs: 1 / 16, anchor: [0, 0, 0.5] }); g.translate(s * 2 / 16, 0, 0);
        if (g.index && g.index.array instanceof Uint32Array) throw new Error('idx32');
        v0 += g.attributes.position.count; geos.push(g);
      }
      const fg = BGU.mergeGeometries(geos, false); if (!fg) return false;
      const mesh = AF.modelMesh(fg); mesh.position.set(x, y, z); mesh.rotation.y = yaw; mesh.frustumCulled = false; mesh.castShadow = false; AF.scene.add(mesh);
      CIV.flags.push({ mesh, pos: fg.attributes.position, base: Float32Array.from(fg.attributes.position.array), len: wPx / 16, ph: CIV.flags.length * 1.7, x, z });
      return true;
    } catch (e) { return false; }
  };
  const flagFr = new THREE.Frustum(), flagM = new THREE.Matrix4(), flagS = new THREE.Sphere();
  let flagFrame = 0;
  AF.onTick('civic-flags', 330, (dt, t) => {
    const cam = AF.camera; if (!cam) return;
    flagFrame++;
    flagFr.setFromProjectionMatrix(flagM.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse));
    for (const f of CIV.flags) {
      const d = Math.hypot(cam.position.x - f.x, cam.position.z - f.z);
      if (d > 230) continue;
      // off-screen flags hold their pose; beyond 90 m they wave at 10 Hz
      flagS.center.copy(f.mesh.position); flagS.radius = f.len + 1;
      if (!flagFr.intersectsSphere(flagS) || (d > 90 && (flagFrame + f.ph * 10 | 0) % 3)) continue;
      const a = f.pos.array, b = f.base;
      for (let v = 0; v < a.length; v += 3) { const u = b[v] / f.len; a[v + 2] = b[v + 2] + Math.sin(t * 3.4 - b[v] * 4.2 + f.ph) * 0.14 * u; a[v] = b[v] - Math.abs(Math.sin(t * 1.1 + f.ph)) * 0.05 * u; a[v + 1] = b[v + 1] - 0.04 * u * u; }
      f.pos.needsUpdate = true;
    }
  });
  // flagpole (world voxels at 1/4 m would be fat: a fine prop) + dynamic flag at the top
  def('pole12', () => { const m = M(4, 96, 4); m.box(0, 0, 0, 4, 3, 4, K.bronzeD); m.box(1, 3, 1, 3, 94, 3, K.white); m.box(0, 94, 0, 4, 96, 4, K.gold); return m; });
  CIV.flagpole = (x, y, z, design, yaw = Math.PI / 2) => { put('pole12', x, y, z, 0, false); AF.addCollider(x - 0.25, y, z - 0.25, x + 0.25, y + 12, z + 0.25); if (!CIV.flag(x + 0.2 * Math.sin(yaw), y + 10.6, z + 0.2 * Math.cos(yaw), yaw - Math.PI / 2, design)) put('flagsmall', x, y + 9, z, 0, false); };

  // ---------------------------------------------------------------- dynamic: clock faces (hands follow AF.time.hours)
  CIV.clockHands = [];
  CIV.clock = (x, y, z, rotY, R = 1.5) => {
    if (!GEO['clockface' + R]) {
      const n = Math.round(R * 2 * 16), c0 = n / 2, m = M(n, n, 2), lit = col(0xf4efdc, { emit: 0xfff0c0, emitK: 1.0, mode: 'night', jitter: 0.05, edge: 0 });
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const r = Math.hypot(i + 0.5 - c0, j + 0.5 - c0); if (r < c0) { m.set(i, j, 0, r > c0 - 3 ? K.bronze : lit); if (r > c0 - 3) m.set(i, j, 1, K.gold); } }
      for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2, rr = c0 - 5; const px = c0 + Math.sin(a) * rr, py = c0 + Math.cos(a) * rr; m.box(Math.floor(px) - (k % 3 ? 0 : 1), Math.floor(py) - (k % 3 ? 0 : 1), 1, Math.floor(px) + 1, Math.floor(py) + 1, 2, K.black); }
      GEO['clockface' + R] = AF.meshModel(m, { vs: 1 / 16, anchor: [0.5, 0.5, 0] });
    }
    AF.placeStatic(GEO['clockface' + R], x, y, z, rotY, { collide: false });
    if (!AF.scene) return;
    const L = Math.round(R * 16);
    const hand = (len, wid) => { const key = 'hand' + len + '_' + wid; if (!GEO[key]) { const m = M(wid, len + 3, 1); m.box(0, 0, 0, wid, len + 3, 1, K.black); m.box(0, len, 0, wid, len + 2, 1, K.gold); GEO[key] = AF.meshModel(m, { vs: 1 / 16, anchor: [0.5, 3 / (len + 3), 0.5] }); } return GEO[key]; };
    const grp = new THREE.Group(); grp.position.set(x, y, z); grp.rotation.y = rotY * Math.PI / 2;
    const hh = AF.modelMesh(hand(Math.round(L * 0.5), 3)), mh = AF.modelMesh(hand(Math.round(L * 0.78), 2));
    hh.position.z = 0.16; mh.position.z = 0.22; hh.castShadow = mh.castShadow = false; hh.frustumCulled = mh.frustumCulled = false;
    grp.add(hh, mh); AF.scene.add(grp); CIV.clockHands.push({ hh, mh, grp });
  };
  AF.onTick('civic-clocks', 310, () => { const h = AF.time.hours; const ma = (h % 1) * Math.PI * 2, ha = ((h % 12) / 12) * Math.PI * 2; for (const c of CIV.clockHands) { c.hh.rotation.z = -ha; c.mh.rotation.z = -ma; } });

  // ---------------------------------------------------------------- dome / cylinder helpers
  // annulus column fill: rIn <= r < rOut between y0..y1, colour fn(angle, r) or colour
  CIV.ring = (cx, cz, y0, y1, rOut, rIn, c) => cols(cx - rOut, cz - rOut, cx + rOut, cz + rOut, (x, z) => { const r = Math.hypot(x - cx, z - cz); if (r >= rOut || r < rIn) return null; return [y0, y1, typeof c === 'function' ? c(Math.atan2(z - cz, x - cx), r) : c]; });
  // hemispherical shell (outer Ro, inner Ri) from base y; cOut(angle, elev) / cIn(angle, elev) for the outer / inner skin
  CIV.dome = (cx, cz, yb, Ro, Ri, cOut, cIn, hole = 0) => {
    each(cx - Ro, yb, cz - Ro, cx + Ro, yb + Ro, cz + Ro, (x, y, z) => {
      const dx = x - cx, dy = y - yb, dz = z - cz, h = Math.hypot(dx, dz), d = Math.hypot(h, dy);
      if (d >= Ro || d < Ri) return undefined;
      if (h < hole) return undefined;
      const a = Math.atan2(dz, dx), el = Math.atan2(dy, h);
      return d < Ri + 0.3 ? cIn(a, el, x, y, z) : cOut(a, el);
    });
  };

  // =====================================================================================================
  // CITY HALL  (lot x -72..-10, z -147..-88; faces south onto Charter St + the plaza)
  // =====================================================================================================
  const CH = CIV.CH = { x0: -66, x1: -16, z0: -134, z1: -96, cx: -41, rz: -115, G: 1.25, CEIL: 10, ROOF: 19.5, rotR: 10.5 };
  AF.onBuild('civic-cityhall', 300, () => {
    const { x0, x1, z0, z1, cx, rz, G, CEIL, ROOF } = CH, rotR = CH.rotR;
    CIV.lotGround('cv-cityhall', K.pave);
    // lawn strips + paving around the building
    W.ground(-72, -147, -10, -97, 1, K.pave);
    W.ground(-71, -95, -57, -89, 1, AF.col('grass')); W.ground(-25, -95, -11, -89, 1, AF.col('grass'));
    // --- massing: granite plinth, solid body, hollow ground storey
    F(x0, 0.25, z0, x1, G, z1, K.granite);
    F(x0, G, z0, x1, ROOF, z1, K.lime);
    F(x0 + 0.75, G, z0 + 0.75, x1 - 0.75, CEIL, z1 - 0.75, 0);                           // hollow ground storey (8.75 m)
    F(x0 + 0.75, CEIL - 0.25, z0 + 0.75, x1 - 0.75, CEIL, z1 - 0.75, K.plaster);           // ceiling
    // ceiling coffers
    for (let x = x0 + 3; x < x1 - 1; x += 3) F(x, CEIL - 0.5, z0 + 0.75, x + 0.25, CEIL - 0.25, z1 - 0.75, K.limeW);
    for (let z = z0 + 3; z < z1 - 1; z += 3) F(x0 + 0.75, CEIL - 0.5, z, x1 - 0.75, CEIL - 0.25, z + 0.25, K.limeW);
    for (let x = x0 + 4.5; x < x1 - 1; x += 3) for (let z = z0 + 4.5; z < z1 - 1; z += 3) F(x - 0.125, CEIL - 0.25, z - 0.125, x + 0.375, CEIL, z + 0.375, K.gold);
    // --- rotunda shaft through everything up to the drum
    CIV.ring(cx, rz, G, ROOF + 7.5, rotR, 0, 0);
    // rotunda wall lining: jade marble pilasters between niches (ring r 10.5..11)
    CIV.ring(cx, rz, G, CEIL, rotR + 0.5, rotR, (a) => (Math.floor((a + Math.PI) / (Math.PI * 2) * 32) % 4 === 0 ? K.marbleG : K.limeW));
    // arched openings in the rotunda lining (south to the vestibule, north to the back hall)
    for (const sz of [1, -1]) { F(cx - 2.5, G, rz + sz * 9.5, cx + 2.5, G + 4.0, rz + sz * 11.25, 0); F(cx - 1.75, G + 4.0, rz + sz * 9.5, cx + 1.75, G + 4.5, rz + sz * 11.25, 0); F(cx - 2.75, G + 4.5, rz + sz * 10.9, cx + 2.75, G + 4.75, rz + sz * 11.1, K.gold); }
    // --- interior partitions (council west, clerks + mayor east, back hall north)
    F(-52, G, z0 + 0.75, -51.5, CEIL, z1 - 0.75, K.plaster); F(-30.5, G, z0 + 0.75, -30, CEIL, z1 - 0.75, K.plaster);
    F(-30, G, -112.5, x1 - 0.75, CEIL, -112, K.plaster);
    // re-open the rotunda through the partitions
    CIV.ring(cx, rz, G, CEIL, rotR, 0, 0);
    // doorways: council (west) at z -103, clerks (east) at z -103, mayor via clerks door + corridor door at z -128
    for (const [xa, xb, zc] of [[-52, -51.5, -101], [-30.5, -30, -101], [-52, -51.5, -129], [-30.5, -30, -129]]) F(xa - 0.01, G, zc - 1.25, xb + 0.01, G + 3.5, zc + 1.25, 0);
    F(-24, G, -112.5, -21.5, G + 3.5, -112, 0);
    // --- floors: marble checker + rotunda sunburst mosaic
    CIV.checker(x0 + 0.75, z0 + 0.75, x1 - 0.75, z1 - 0.75, G, K.marbleW, K.marbleY, 1);
    cols(cx - rotR, rz - rotR, cx + rotR, rz + rotR, (x, z) => {
      const r = Math.hypot(x - cx, z - rz); if (r >= rotR) return null;
      const a = Math.atan2(z - rz, x - cx), ray = Math.floor((a + Math.PI) / (Math.PI * 2) * 24);
      let c = ray % 2 ? K.marbleW : K.marbleY;
      if (r < 1.5) c = K.gold; else if (r < 2.0) c = K.marbleB; else if (r < 4 && ray % 2 === 0) c = K.gold;
      if (r > 8.5 && r < 9.25) c = K.marbleG; else if (r > 9.25) c = K.marbleB;
      if (r > 6 && r < 8.5 && ray % 4 === 1) c = K.marbleR;
      return [G - 0.25, G, c];
    });
    // walls: wainscot + plaster colours per room
    W.walls(x0 + 0.75, G, z0 + 0.75, -52, G + 1.25, z1 - 0.75, K.wain);                  // council wainscot
    W.walls(-30, G, z0 + 0.75, x1 - 0.75, G + 1.25, z1 - 0.75, K.wain);
    // --- gallery ring at y 5.75 inside the rotunda (with brass railing)
    CIV.ring(cx, rz, 5.5, 5.75, rotR, rotR - 1.5, K.limeW);
    CIV.ring(cx, rz, 5.75, 6.75, rotR - 1.25, rotR - 1.5, (a) => (Math.floor((a + Math.PI) * 12) % 2 ? K.brass : 0));
    CIV.ring(cx, rz, 6.75, 7.0, rotR - 1.25, rotR - 1.5, K.bronzeD);
    CIV.ring(cx, rz, 5.25, 5.5, rotR - 1.25, rotR - 1.5, K.gold);
    // upper rotunda wall (CEIL..drum): alternating pilasters
    CIV.ring(cx, rz, CEIL, ROOF, rotR + 0.25, rotR, (a) => (Math.floor((a + Math.PI) / (Math.PI * 2) * 32) % 4 === 0 ? K.limeD : K.plasterJ));
    // --- exterior: piers, window grids, cornice, chevron frieze
    const R = [x0, z0, x1, z1];
    for (const s of ['s', 'n', 'e', 'w']) {
      const f = face(R, s);
      CIV.winGrid(f, 1, f.len - 1, 3.5, 2.0, [2.75], 5.75, { glass: true, t: 0.75, sill: K.limeW, skip: (u) => s === 's' && Math.abs(x0 + u - cx) < 14.5, pier: K.limeW, pierY0: G, pierY1: ROOF - 0.75 });
      CIV.winGrid(f, 1, f.len - 1, 3.5, 1.75, [11.25, 15.25], 2.5, { spandrel: K.bronzeD, skip: (u) => s === 's' && Math.abs(x0 + u - cx) < 14.5 });
      f.fill(-0.25, f.len + 0.25, ROOF - 1.0, ROOF - 0.5, 0, 0.5, K.limeD);
      CIV.chevrons(f, 0, f.len, ROOF - 2.25, K.goldN, K.limeW);
      f.fill(-0.5, f.len + 0.5, ROOF - 0.5, ROOF + 0.75, 0, 0.5, K.limeW);            // parapet + coping
      f.fill(0, f.len, G, G + 0.5, 0, 0.25, K.granite);
    }
    F(x0 + 0.5, ROOF, z0 + 0.5, x1 - 0.5, ROOF + 0.5, z1 - 0.5, 0); F(x0 + 0.5, ROOF - 0.25, z0 + 0.5, x1 - 0.5, ROOF, z1 - 0.5, K.limeD);
    // corner pavilions on the roof with lit crowns + flags
    for (const [px, pz] of [[x0 + 1, z0 + 1], [x1 - 7, z0 + 1], [x0 + 1, z1 - 7], [x1 - 7, z1 - 7]]) {
      F(px, ROOF, pz, px + 6, ROOF + 2.5, pz + 6, K.lime); F(px - 0.25, ROOF + 2.5, pz - 0.25, px + 6.25, ROOF + 3, pz + 6.25, K.limeW);
      F(px + 1, ROOF + 3, pz + 1, px + 5, ROOF + 3.75, pz + 5, K.goldN); F(px + 2, ROOF + 3.75, pz + 2, px + 4, ROOF + 4.25, pz + 4, K.goldN);
      for (const u of [1.5, 3, 4.5]) { F(px + u - 0.25, ROOF + 0.5, pz - 0.01, px + u + 0.25, ROOF + 2, pz + 0.25, K.winW); F(px + u - 0.25, ROOF + 0.5, pz + 5.75, px + u + 0.25, ROOF + 2, pz + 6.01, K.winW); }
    }
    // rooftop clutter: stair bulkhead, vents, skylights over the wings
    F(-62, ROOF, -120, -58, ROOF + 3, -116, K.limeD); F(-61.5, ROOF, -116.01, -60, ROOF + 2.25, -115.75, K.bronzeD);
    for (const [vx, vz] of [[-24, -120], [-22, -110], [-60, -106]]) { F(vx, ROOF, vz, vx + 1, ROOF + 1.25, vz + 1, K.steelD); F(vx - 0.25, ROOF + 1.25, vz - 0.25, vx + 1.25, ROOF + 1.5, vz + 1.25, K.steel); }
    for (const sx of [-64, -24]) for (let z = -128; z < -102; z += 4) { F(sx, ROOF, z, sx + 6, ROOF + 0.75, z + 2.5, K.steelD); F(sx + 0.25, ROOF + 0.75, z + 0.25, sx + 5.75, ROOF + 1, z + 2.25, K.glass); }

    CIV.ring(cx, rz, CEIL, ROOF + 1, rotR, 0, 0);                                     // re-open the shaft through the roof slab
    // --- DRUM + COLONNADE + DOME + LANTERN
    const DB = ROOF, DT = ROOF + 7.5, Ro = 12.75, Ri = 12.0, DOMEY = DT + 0.5;
    CIV.ring(cx, rz, DB, DT, 12.5, rotR, K.limeN);
    // drum windows (16 tall arched slots, glass)
    for (let i = 0; i < 16; i++) {
      const a = (i + 0.5) / 16 * Math.PI * 2;
      each(cx - 13, DB + 1.5, rz - 13, cx + 13, DT - 1, rz + 13, (x, y, z) => { const dx = x - cx, dz = z - rz, r = Math.hypot(dx, dz); if (r < rotR || r >= 12.5) return undefined; let da = Math.atan2(dz, dx) - a; da = Math.atan2(Math.sin(da), Math.cos(da)); const hw = 0.09 - Math.max(0, (y - (DT - 2.5)) / 1.5) * 0.06; if (Math.abs(da) > hw) return undefined; return r < rotR + 0.5 ? K.glass : 0; });
    }
    CIV.ring(cx, rz, DB, DB + 0.75, 15, 12.5, K.limeD);                                // stylobate
    for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; CIV.column(cx + Math.cos(a) * 14, rz + Math.sin(a) * 14, DB + 0.75, DT, K.limeN, K.limeD, 0.5); }
    CIV.ring(cx, rz, DT, DT + 1.0, 15.25, 11.5, K.limeWN);                             // entablature
    CIV.ring(cx, rz, DT + 0.25, DT + 0.75, 15.5, 15.25, (a) => (Math.floor((a + Math.PI) * 16) % 2 ? K.goldN : K.limeW));
    CIV.ring(cx, rz, DT + 1.0, DT + 1.5, 14.75, 12.5, K.limeD);                        // attic step
    // the dome: green copper, 16 lighter ribs, coffered inner skin (jade + cream + gold rosettes), oculus
    CIV.dome(cx, rz, DOMEY, Ro, Ri,
      (a, el) => (Math.abs(((a + Math.PI) / (Math.PI * 2) * 16) % 1 - 0.5) > 0.44 ? K.copperL : (Math.floor(el * 20) % 5 === 0 ? K.copperD : K.copper)),
      (a, el) => { const ca = Math.floor((a + Math.PI) / (Math.PI * 2) * 24), ce = Math.floor(el / (Math.PI / 2) * 9); const inA = ((a + Math.PI) / (Math.PI * 2) * 24) % 1, inE = (el / (Math.PI / 2) * 9) % 1; if (inA < 0.2 || inE < 0.2) return K.limeW; if (inA > 0.45 && inA < 0.6 && inE > 0.45 && inE < 0.65) return K.gold; return (ca + ce) % 2 ? K.plasterJ : K.jade; }, 2.0);
    // raised ribs (outer) - one block proud
    for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; for (let el = 0; el < 1.35; el += 0.02) { const h = Math.cos(el) * (Ro + 0.2), y = DOMEY + Math.sin(el) * (Ro + 0.2); W.setM(cx + Math.cos(a) * h, y, rz + Math.sin(a) * h, K.copperL); } }
    // oculus ring + LANTERN
    const LY = DOMEY + Math.sqrt(Ro * Ro - 2.25 * 2.25) - 0.25;
    CIV.ring(cx, rz, LY, LY + 0.5, 3.0, 2.0, K.limeWN);
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; F(cx + Math.cos(a) * 2.25 - 0.25, LY + 0.5, rz + Math.sin(a) * 2.25 - 0.25, cx + Math.cos(a) * 2.25 + 0.25, LY + 3.5, rz + Math.sin(a) * 2.25 + 0.25, K.limeWN); }
    CIV.ring(cx, rz, LY + 0.5, LY + 3.5, 1.75, 0, K.glass);
    CIV.ring(cx, rz, LY + 0.5, LY + 3.5, 1.25, 0, 0);
    CIV.ring(cx, rz, LY + 1.5, LY + 2.5, 0.6, 0, K.bulbN);                               // the lantern's light
    CIV.ring(cx, rz, LY + 3.5, LY + 4.0, 2.75, 0, K.limeWN);
    const gild = col(0xe8c25a, { jitter: 0.12, edge: 0.15, metal: 1, rough: 0.22, emit: 0xffc860, emitK: 0.45, mode: 'night' }), gildD = col(0xc99a38, { jitter: 0.12, edge: 0.15, metal: 1, rough: 0.3 });
    CIV.dome(cx, rz, LY + 4.0, 2.25, 0, (a) => (Math.floor((a + Math.PI) * 2.6) % 2 ? gild : gildD), () => K.copper);
    F(cx - 0.5, LY + 6.0, rz - 0.5, cx + 0.5, LY + 6.5, rz + 0.5, gild);
    // "CIVIC FORTUNE": a 4 m gilded winged figure with a torch held high, catching the low sun from the whole city
    { const m = M(22, 34, 12), g = gild, d = gildD, fl = col(0xffd070, { emit: 0xffb040, emitK: 2.4, mode: 'always', jitter: 0, edge: 0 });
      m.sphere(11, 3, 6, 3.2, d, (x, y) => (y < 5 ? d : 0));                                 // orb
      m.box(8, 5, 4, 14, 20, 9, g); m.box(7, 5, 3, 15, 10, 10, g); m.box(9, 20, 5, 13, 22, 8, d);  // robe, waist
      m.box(9, 22, 5, 13, 27, 8, g); m.box(10, 27, 5, 12, 30, 8, g); m.box(9, 30, 5, 13, 32, 8, g); // torso, neck, head
      m.box(13, 24, 5, 15, 26, 7, g); m.box(14, 26, 5, 16, 33, 7, g); m.box(13, 32, 4, 17, 33, 8, d); m.box(14, 33, 5, 16, 34, 7, fl); // arm + torch
      m.box(7, 23, 5, 9, 25, 7, g); m.box(5, 19, 5, 7, 24, 7, g);                                // other arm with a wreath
      m.sphere(5, 17, 6, 1.8, d, (x, y, z) => (Math.hypot(x - 5, y - 17) > 1 ? d : 0));
      for (let y = 0; y < 14; y++) { const w = Math.round(9 - Math.abs(y - 6) * 0.9); m.box(Math.max(0, 9 - w), 16 + y, 9, 9, 17 + y, 10, y % 3 ? g : d); m.box(13, 16 + y, 9, Math.min(22, 13 + w), 17 + y, 10, y % 3 ? g : d); }  // spread wings
      AF.placeStatic(AF.meshModel(m, { vs: 1 / 8, anchor: [0.5, 0, 0.5] }), cx, LY + 6.5, rz, 0, { collide: false }); }
    if (typeof AF.setSurface === 'function') { for (const c of [K.copper, K.copperL, K.copperD]) AF.setSurface(c, { rough: 0.78, metal: 0.05 }); }
    CH.domeTop = LY + 10.75;
    // --- PORTICO + GRAND STEPS + PEDIMENT CLOCK (south, z -96 .. -88)
    const PZ0 = z1, PZ1 = -90.5;
    F(-56, 0.25, PZ0, -26, G, PZ1, K.granite); F(-56, G - 0.25, PZ0, -26, G, PZ1, K.marbleW);
    CIV.steps('z', -88.0, -1, -58, -24, 0.25, 4, 0.625, K.limeW, K.limeD);
    for (const sx of [-1, 1]) { F(cx + sx * 16.5 - 1, 0.25, -91, cx + sx * 16.5 + 1, 2.25, -88, K.limeD); F(cx + sx * 16.5 - 1.25, 2.25, -91.25, cx + sx * 16.5 + 1.25, 2.5, -87.75, K.limeW); put(CIV._defs.candelabra ? 'candelabra' : 'decolamp', cx + sx * 16.5, 2.5, -89.5, 0, false); put('urn', cx + sx * 15.5, G, -94.5, 0); }
    const colX = [-13, -9.5, -6, -2.6, 2.6, 6, 9.5, 13];
    for (const ox of colX) CIV.column(cx + ox, -92.5, G, 13.0, K.limeN, K.limeD, 0.75);
    F(-56, 13.0, -96, -26, 14.5, -91.25, K.limeWN);                                         // entablature
    { const f = face([-56, -96, -26, -91.25], 's'); CIV.chevrons(f, 0.5, 29.5, 13.25, K.goldN, K.limeW); CIV.text('CITY OF PORT SOLACE', K.bronze, cx - 9.2, 13.25, -91.25, 0); }
    // stepped (ziggurat) deco pediment with the clock
    for (let k = 0; k < 5; k++) F(-54 + k * 3, 14.5 + k * 0.75, -95.5, -28 - k * 3, 15.25 + k * 0.75, -91.5, k % 2 ? K.limeW : K.lime);
    F(cx - 2.5, 14.5, -91.75, cx + 2.5, 19.5, -91.25, K.limeW); F(cx - 1.25, 19.5, -91.75, cx + 1.25, 20.5, -91.25, K.goldN);
    CIV.clock(cx, 17.0, -91.25, 0, 1.75);
    for (const sx of [-1, 1]) for (let i = 0; i < 5; i++) F(cx + sx * (3.25 + i * 0.75) - 0.125, 16.25 - i * 0.3, -91.5, cx + sx * (3.25 + i * 0.75) + 0.125, 17.75 + i * 0.3, -91.25, K.goldN); // sunburst rays
    // bronze doors x3 with transoms
    const fS = face(R, 's');
    for (const ox of [-4, 0, 4]) CIV.door(fS, cx + ox - x0, G, 2.5, 4.5, { t: 0.75, transom: 1.5, leaf: K.bronze, frame: K.bronze });
    // floodlamps on the portico + roof edge (night)
    for (const ox of colX) put('floodlamp', cx + ox, G, -90.9, 2, false);
    for (let x = x0 + 2; x < x1 - 1; x += 6) put('floodlamp', x, 0.25, -95.5, 2, false);
    AF.addLight({ x: cx, y: 6, z: -89, color: 0xffe0b0, intensity: 1.4, range: 22, kind: 'sign' });
    AF.addLight({ x: cx, y: DT + 4, z: rz + 16, color: 0xa8f0d8, intensity: 1.2, range: 26, kind: 'sign' });
    // roof flags (dynamic sway) on the two front pavilions + two on the portico
    CIV.flagpole(x0 + 4, ROOF + 3, z1 - 4, 0); CIV.flagpole(x1 - 4, ROOF + 3, z1 - 4, 1);
    // name sign over the doors
    CIV.textProp('CITY HALL', K.gold, cx, G + 6.5, -95.95, 0, 1 / 10, { bold: true });

    // --- INTERIOR: vestibule + rotunda
    put('chandelier', cx, CEIL - 2.2, -100.5, 0, false);
    put('chandelier', cx, CEIL - 2.2, -130, 0, false);
    // central pendant lamp hanging in the rotunda from the oculus
    F(cx - 0.125, 12, rz - 0.125, cx + 0.125, DOMEY + 11, rz + 0.125, K.brass);
    { const m = M(24, 24, 24); m.sphere(12, 12, 12, 11, K.brass, (x, y, z) => { const r = Math.hypot(x + 0.5 - 12, y + 0.5 - 12, z + 0.5 - 12); return r > 9.5 ? (y % 3 === 0 ? K.brass : K.lampA) : 0; }); m.box(10, 22, 10, 14, 24, 14, K.brass); AF.placeStatic(AF.meshModel(m, { vs: 1 / 8 }), cx, 9.5, rz, 0, { collide: false }); }
    // 4 statues on plinths (diagonals) + benches between
    for (let i = 0; i < 4; i++) {
      const a = Math.PI / 4 + i * Math.PI / 2, sx = cx + Math.cos(a) * 8.0, sz = rz + Math.sin(a) * 8.0;
      F(sx - 0.75, G, sz - 0.75, sx + 0.75, G + 1.5, sz + 0.75, K.marbleG); F(sx - 0.875, G + 1.5, sz - 0.875, sx + 0.875, G + 1.75, sz + 0.875, K.limeW);
      const rot = Math.abs(Math.cos(a)) > Math.abs(Math.sin(a)) ? (Math.cos(a) > 0 ? 3 : 1) : (Math.sin(a) > 0 ? 2 : 0);
      put('statueFig', sx, G + 1.75, sz, (i + 2) % 4);
    }
    for (const [bx, bz, rot, yaw] of [[cx - 7.5, rz, 1, Math.PI / 2], [cx + 7.5, rz, 3, -Math.PI / 2]]) { put('bench', bx, G, bz, rot); for (const o of [-0.6, 0.6]) CIV.spot('cityhall', bx + (rot === 1 ? 0.1 : -0.1), G + 0.5, bz + o, yaw, 'sit'); }
    // info desk in the vestibule
    F(cx + 5, G, -101.5, cx + 9, G + 1.0, -100.75, K.woodD); F(cx + 4.75, G + 1.0, -101.75, cx + 9.25, G + 1.25, -100.5, K.marbleG);
    CIV.spot('cityhall', cx + 7, G, -102.3, 0, 'work', [[cx + 3, -97.5], [cx + 3, -102.3], [cx + 7, -102.3]]);
    CIV.spot('cityhall', cx + 7, G, -99.8, Math.PI, 'counter', [[cx + 3, -97.5], [cx + 7, -99.8]]);
    for (const [px, pz] of [[cx - 9.5, -98], [cx + 9.5, -98]]) put('palm', px, G, pz, 0);
    CIV.light(cx, 5, rz, 1.6, 20); CIV.light(cx, 6, -100, 1.2, 12);
    // stand spots in the rotunda (visitors admiring the dome)
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + 0.3, x = cx + Math.cos(a) * 4.5, z = rz + Math.sin(a) * 4.5; CIV.spot('cityhall', x, G, z, Math.atan2(cx - x, rz - z), 'stand', [[cx, -97], [cx, -104.5], [x, z]]); }

    // --- COUNCIL CHAMBER (west, x -65.25..-52): curved dais on the west wall, public benches facing west
    const CCx = -64.5, CCz = -115;
    cols(CCx - 7, CCz - 7, CCx + 7, CCz + 7, (x, z) => { const r = Math.hypot(x - CCx, z - CCz); if (x < x0 + 0.75 || r >= 6.5) return null; return [G, G + (r < 4.5 ? 0.75 : 0.5), r < 4.5 ? K.woodD : K.wood]; });
    cols(CCx - 7, CCz - 7, CCx + 7, CCz + 7, (x, z) => { const r = Math.hypot(x - CCx, z - CCz); if (x < x0 + 0.75 || r >= 6.0 || r < 5.25) return null; return [G + 0.5, G + 1.5, K.woodD]; });  // curved council desk
    cols(CCx - 7, CCz - 7, CCx + 7, CCz + 7, (x, z) => { const r = Math.hypot(x - CCx, z - CCz); if (x < x0 + 0.75 || r >= 6.25 || r < 5.0) return null; return [G + 1.5, G + 1.75, K.marbleG]; });
    for (let i = -3; i <= 3; i++) { const a = i * 0.36, x = CCx + Math.cos(a) * 4.5, z = CCz + Math.sin(a) * 4.5; put('chairG', x, G + 0.75, z, 1); CIV.spot('cityhall', x, G + 1.25, z, Math.PI / 2, 'sit'); }
    F(x0 + 0.75, G + 0.75, CCz - 1.5, x0 + 2, G + 2.25, CCz + 1.5, K.woodD); put('gavel', x0 + 1.5, G + 2.25, CCz, 1, false);
    // seal of the city on the wall behind the dais
    { const m = M(40, 40, 2); for (let i = 0; i < 40; i++) for (let j = 0; j < 40; j++) { const r = Math.hypot(i + 0.5 - 20, j + 0.5 - 20); if (r < 20) { const a = Math.atan2(j - 20, i - 20); m.set(i, j, 0, r > 18 ? K.gold : r > 16 ? K.navy : r < 6 ? K.gold : (Math.floor((a + Math.PI) / (Math.PI * 2) * 16) % 2 ? K.gold : K.navy)); } } AF.placeStatic(AF.meshModel(m, { vs: 1 / 12, anchor: [0.5, 0.5, 0] }), x0 + 0.76, G + 5.0, CCz, 1, { collide: false }); }
    put('flagsmall', x0 + 1.5, G + 0.75, CCz - 3.5, 1, false); put('flagsmall', x0 + 1.5, G + 0.75, CCz + 3.5, 1, false);
    for (let r = 0; r < 3; r++) for (const zc of [-121, -109]) { const bx = -57 + r * 1.9; put('pew', bx, G, zc, 3); for (const o of [-1.2, 0, 1.2]) CIV.spot('cityhall', bx + 0.1, G + 0.5, zc + o, -Math.PI / 2, 'sit'); }
    put('rugR', -58.5, G, -115, 1, false);
    for (const z of [-104, -126]) put('chandelier', -58.5, CEIL - 2.2, z, 0, false);
    put('chandelier', -58.5, CEIL - 2.2, -115, 0, false);
    for (const z of [-103, -127]) put('portrait', x0 + 0.76, G + 3.5, z, 1, false);
    CIV.light(-59, 6, -115, 1.5, 16);
    CIV.textProp('COUNCIL CHAMBER', K.gold, -52.26, G + 3.75, -101, 3, 1 / 16);
    // --- CLERKS' HALL (east, x -30..-16.75, z -112..-96.75): counter with brass grilles, work spots behind
    F(-29.5, G, -109.5, -17.5, G + 1.25, -108.75, K.woodD); F(-29.75, G + 1.25, -109.75, -17.25, G + 1.5, -108.5, K.marbleG);
    for (let i = 0; i < 4; i++) { const x = -27.5 + i * 3; put('tellercage', x, G + 1.5, -109.1, 0, false); CIV.spot('cityhall', x, G, -110.5, 0, 'work'); put('chair', x, G, -111.1, 0); put('typewriter', x - 0.6, G + 1.5, -109.2, 0, false); CIV.spot('cityhall', x, G, -107.6, Math.PI, 'counter', [[-29.25, -101], [x, -104], [x, -107.6]]); }
    for (const x of [-29.3, -28.8]) put('filing', x, G, -111.7, 0);
    for (const z of [-104, -100]) { put('bench', -17.8, G, z, 3); CIV.spot('cityhall', -17.9, G + 0.5, z, -Math.PI / 2, 'sit', [[-29.25, -101], [-19, z], [-17.9, z]]); }
    put('grandfather', -29.5, G, -97.6, 1); put('palm', -18.5, G, -97.8, 0);
    CIV.clock(-23, G + 5.5, -111.99, 0, 0.75);
    put('chandelier', -23.5, CEIL - 2.2, -104, 0, false); CIV.light(-23.5, 6, -104, 1.2, 12);
    CIV.textProp('LICENSES  PERMITS  TAXES', K.gold, -23.5, G + 3.4, -108.6, 0, 1 / 20);
    // --- MAYOR'S OFFICE (east, z -133.25..-112.5): big desk, flags, bookcases, globe, rug, sofa
    put('rugR', -23.5, G, -123, 0, false);
    put('bigdesk', -23.5, G, -128.5, 0); put('chair', -23.5, G, -130.2, 0); CIV.spot('cityhall', -23.5, G + 0.5, -130.2, 0, 'sit');
    put('armchair', -25, G, -125.5, 2); put('armchair', -22, G, -125.5, 2);
    for (let x = -29.25; x < -18; x += 2.1) put('bookshelf', x + 1, G, -132.9, 0);
    put('flagsmall', -27.5, G, -131.5, 0, false); put('flagsmall', -19.5, G, -131.5, 0, false);
    put('globe', -18.5, G, -127, 0); put('sofa', -29.3, G, -120, 1); put('portrait', -17.26, G + 3, -122, 3, false); put('painting', -17.26, G + 3, -118, 3, false);
    put('bankers', -21.5, G + 1.0, -128.0, 0, false); put('floorlamp', -18, G, -115.5, 0, false); put('coatrack', -29.2, G, -114, 0);
    put('chandelier', -23.5, CEIL - 2.2, -122.5, 0, false); CIV.light(-23.5, 5, -123, 1.3, 12);
    // conference end: table + 6 chairs, fireplace on the east wall, curtains, second rug, cabinet, plants
    put('rugB', -23.5, G, -116.5, 1, false); put('longtable', -23.5, G, -116.5, 1);
    for (const o of [-1.2, 0, 1.2]) { put('chair', -24.4, G, -116.5 + o, 1); put('chair', -22.6, G, -116.5 + o, 3); CIV.spot('cityhall', -24.4, G + 0.5, -116.5 + o, Math.PI / 2, 'sit'); CIV.spot('cityhall', -22.6, G + 0.5, -116.5 + o, -Math.PI / 2, 'sit'); }
    F(-17.5, G, -125, -16.75, G + 2.0, -121, K.marbleG); F(-17.25, G + 0.25, -124, -16.75, G + 1.5, -122, K.black); F(-17.1, G + 0.25, -123.6, -16.9, G + 0.75, -122.4, K.fabricGo); F(-17.75, G + 2.0, -125.25, -16.75, G + 2.25, -120.75, K.woodD);
    put('portrait', -17.26, G + 3.6, -123, 3, false); put('floorlamp', -29.2, G, -126, 0, false); put('floorlamp', -18, G, -130.5, 0, false);
    put('cabinetglass', -29.2, G, -123.5, 1); put('palm', -29, G, -131.8, 0); put('palm', -18, G, -113.5, 0);
    for (let i = 0; i < 10; i++) { const zc = z0 + 3.25 + 3.5 * i; for (const [xa, xb] of [[x1 - 1.0, x1 - 0.75], [x0 + 0.75, x0 + 1.0]]) { if (xa > -30 && zc > -113) continue; F(xa, G + 1.25, zc - 1.5, xb, G + 8.75, zc - 1.0, K.curtain); F(xa, G + 1.25, zc + 1.0, xb, G + 8.75, zc + 1.5, K.curtain); F(xa, G + 8.5, zc - 1.5, xb, G + 8.75, zc + 1.5, K.gold); } }
    CIV.textProp('MAYOR', K.gold, -22.75, G + 3.0, -112.49, 2, 1 / 16);
    // back hall: benches + portraits
    for (const x of [-47, -35]) { put('bench', x, G, -132.5, 0); CIV.spot('cityhall', x, G + 0.5, -132.2, 0, 'sit'); }
    for (const x of [-49, -41, -33]) put('portrait', x, G + 3.2, z0 + 0.76, 0, false);

    AF.addBuilding({ id: 'cityhall', name: 'City Hall', kind: 'civic', box: [x0, 0, z0, x1, CH.domeTop, -88], doors: [{ x: cx, y: 0.25, z: -87.5, yaw: Math.PI }, { x: cx - 4, y: 0.25, z: -87.5, yaw: Math.PI }], floors: [G], interior: true });
    AF.addLabel('Rotunda', cx, rz, 'place');
  });
  // ---------------------------------------------------------------- POLISH kit: entrances (runners, medallions, borders, sconces, turnstiles, directory boards)
  K.glassLit = col(0xfff2d8, { glass: true, emit: 0xffc870, emitK: 0.7, mode: 'night', jitter: 0, edge: 0 });
  K.runner = col(0x9a2a2a, { jitter: 0.25, edge: 0.15 }); K.runnerB = col(0xd9a84a, { jitter: 0.2, edge: 0.15 });
  // floor recolour helpers (flush: they repaint the top floor layer G-0.25..G)
  CIV.runner = (axis, a0, a1, c, half, G) => { if (axis === 'x') { F(a0, G - 0.25, c - half, a1, G, c + half, K.runner); F(a0, G - 0.25, c - half, a1, G, c - half + 0.25, K.runnerB); F(a0, G - 0.25, c + half - 0.25, a1, G, c + half, K.runnerB); } else { F(c - half, G - 0.25, a0, c + half, G, a1, K.runner); F(c - half, G - 0.25, a0, c - half + 0.25, G, a1, K.runnerB); F(c + half - 0.25, G - 0.25, a0, c + half, G, a1, K.runnerB); } };
  CIV.medallion = (x, z, R, G, cA = K.marbleG, cB = K.marbleW, cC = K.gold) => cols(x - R, z - R, x + R, z + R, (xx, zz) => { const r = Math.hypot(xx - x, zz - z); if (r >= R) return null; const a = Math.atan2(zz - z, xx - x), ray = Math.floor((a + Math.PI) / (Math.PI * 2) * 16); let c = r > R - 0.3 ? K.marbleB : r > R - 0.55 ? cC : (ray % 2 ? cA : cB); if (r < R * 0.3) c = r < R * 0.15 ? cC : K.marbleB; return [G - 0.25, G, c]; });
  CIV.border = (x0, z0, x1, z1, G, c = K.marbleB, w = 0.5, c2 = K.gold) => { W.walls(x0, G - 0.25, z0, x1, G, z1, c, w); W.walls(x0 + w, G - 0.25, z0 + w, x1 - w, G, z1 - w, c2, 0.25); };
  def('sconce', () => { const m = M(6, 10, 4); m.box(2, 0, 0, 4, 2, 1, K.brass); m.box(1, 2, 0, 5, 3, 3, K.brass); m.box(1, 3, 1, 5, 8, 4, K.lampA); m.box(0, 8, 0, 6, 9, 4, K.brass); m.box(2, 9, 1, 4, 10, 3, K.gold); m.box(2, 4, 0, 4, 7, 1, K.brass); return m; }, 1 / 12);
  def('turnstile', () => { const m = M(6, 9, 6); m.box(2, 0, 2, 4, 7, 4, K.brass); m.box(1, 7, 1, 5, 8, 5, K.bronze); m.box(4, 5, 2, 6, 6, 4, K.steelL); m.box(0, 5, 2, 2, 6, 4, K.steelL); m.box(2, 5, 4, 4, 6, 6, K.steelL); m.box(1, 0, 1, 5, 1, 5, K.bronzeD); return m; });
  def('directory', () => { const m = M(20, 22, 2); m.box(0, 0, 0, 1, 22, 2, K.bronzeD); m.box(19, 0, 0, 20, 22, 2, K.bronzeD); m.box(1, 6, 0, 19, 22, 1, K.woodD); m.box(2, 7, 0, 18, 20, 1, K.black); for (let y = 8; y < 19; y += 2) for (let x = 3; x < 17; x++) if (AF.hash2(x * 3, y) > 0.25 && !(x > 11 && x < 13)) m.set(x, y, 1, x > 12 ? K.gold : K.white); m.box(1, 20, 0, 19, 22, 2, K.gold); return m; });
  def('placard', () => { const m = M(8, 9, 4); m.box(3, 0, 1, 5, 6, 3, K.brass); m.box(2, 0, 0, 6, 1, 4, K.bronzeD); for (let k = 0; k < 3; k++) m.box(0, 6 + k, k, 8, 7 + k, k + 1, K.bronzeD); m.box(1, 7, 1, 7, 8, 2, K.paper); m.box(1, 8, 2, 7, 9, 3, K.paper); return m; }, 1 / 16);
  def('lantern', () => { const m = M(8, 40, 8); m.box(3.5, 14, 3.5, 4.5, 40, 4.5, K.brass); m.box(1, 2, 1, 7, 12, 7, K.bronzeD); m.box(2, 3, 1, 6, 11, 7, K.lampA); m.box(1, 3, 2, 7, 11, 6, K.lampA); m.box(0, 12, 0, 8, 13, 8, K.bronze); m.box(2, 13, 2, 6, 14, 6, K.gold); m.box(3, 0, 3, 5, 2, 5, K.gold); return m; }, 1 / 8);
  def('postB', () => { const m = M(3, 9, 3); m.box(1, 0, 1, 2, 8, 2, K.brass); m.box(0, 0, 0, 3, 1, 3, K.brass); m.box(0, 8, 0, 3, 9, 3, K.gold); return m; });

  // =====================================================================================================
  // CITY HALL polish: portico + vestibule, gallery stair, city model
  // =====================================================================================================
  AF.onBuild('civic-cityhall-polish', 305, () => {
    const { cx, rz, G, CEIL } = CH;
    // portico floor: black border, gold rosettes between columns, red runners to the three doors
    CIV.checker(-56, -96, -26, -90.5, G, K.marbleW, K.marbleY, 1);
    CIV.border(-56, -96, -26, -90.5, G);
    for (const sx of [-1, 1]) put('palm', cx + sx * 2.0, G, -95.4, 0);
    for (const ox of [-11.25, -7.75, 7.75, 11.25]) CIV.medallion(cx + ox, -93.2, 0.9, G);
    put('lantern', cx, 8.0, -93.2, 0, false); put('lantern', cx - 4, 8.0, -94.5, 0, false); put('lantern', cx + 4, 8.0, -94.5, 0, false);
    for (const ox of [-4, 0, 4]) CIV.runner('z', -96, -90.5, cx + ox, 0.75, G);
    for (const ox of [-13, -9.5, -6, -2.6, 2.6, 6, 9.5, 13]) put('sconce', cx + ox, 3.4, -91.68, 0, false);
    for (const ox of [-14, 14]) { put('palm', cx + ox, G, -91.5, 0); put('bench', cx + ox, G, -95.2, 0); for (const o of [-0.6, 0.6]) CIV.spot('cityhall', cx + ox + o, G + 0.5, -94.9, 0, 'sit'); }
    // vestibule: border, medallion, runner through to the rotunda, directory board, benches, sconces, bronze grille over the doors
    CIV.border(-51.5, -104.5, -30.5, -96.75, G);
    CIV.runner('z', -104.5, -96.75, cx, 1.0, G); CIV.medallion(cx, -100.6, 2.4, G, K.marbleR, K.marbleW);
    put('directory', cx - 7.5, G, -100.5, 1); CIV.textProp('DIRECTORY', K.gold, cx - 7.35, G + 2.85, -100.5, 1, 1 / 24);
    CIV.textProp('INFORMATION', K.gold, cx + 7, G + 1.3, -100.49, 0, 1 / 22); put('deskbellC', cx + 6, G + 1.25, -101, 0, false);
    for (const z of [-99, -103]) { put('bench', cx - 9.9, G, z, 1); for (const o of [-0.6, 0.6]) CIV.spot('cityhall', cx - 9.8, G + 0.5, z + o, Math.PI / 2, 'sit'); }
    for (const ox of [-8, 8]) put('sconce', cx + ox, G + 3.2, -97.0, 2, false);
    F(cx - 6.5, G + 4.75, -97.0, cx + 6.5, G + 6.75, -96.75, K.bronze); for (let x = cx - 6.25; x < cx + 6.3; x += 0.75) F(x, G + 5.0, -97.25, x + 0.25, G + 6.5, -97.0, K.gold);
    F(cx - 6.5, G + 6.75, -97.25, cx + 6.5, G + 7.0, -96.75, K.gold);
    CIV.light(cx, 4, -99, 1.0, 10);
    // --- ROTUNDA GALLERY STAIR (back hall, rising east) + landing + bridge through the rotunda lining
    CIV.steps('x', -39.25, 1, -128.25, -126.5, G, 18, 0.25, K.marbleW, K.limeD);
    F(-34.75, 5.5, -128.25, -31.5, 5.75, -124, K.limeW); F(-38.25, 5.5, -126.5, -34.75, 5.75, -124, K.limeW);
    F(-34.75, 5.25, -128.25, -31.5, 5.5, -124, K.gold);
    F(-39, 5.75, -126.25, -35.25, 8.25, -123.75, 0);
    CIV.rail(-34.75, -128.5, -31.5, -128.5, 5.75, K.brass, K.bronzeD, 1.0); CIV.rail(-31.75, -128.25, -31.75, -124, 5.75, K.brass, K.bronzeD, 1.0);
    CIV.rail(-39.25, -128.5, -34.75, -128.5, G, K.brass, K.bronzeD, 1.0);
    // portraits round the gallery + the mayor's portrait over the council door, city model
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2 + Math.PI / 8, x = cx + Math.cos(a) * 10.45, z = rz + Math.sin(a) * 10.45; const rot = Math.abs(Math.cos(a)) > Math.abs(Math.sin(a)) ? (Math.cos(a) > 0 ? 3 : 1) : (Math.sin(a) > 0 ? 2 : 0); if (a > 4.8 && a < 5.4) continue; put('portrait', x, 6.6, z, rot, false); }
    { const m = M(12, 16, 1); m.box(0, 0, 0, 12, 16, 1, K.gold); m.box(1, 1, 0, 11, 15, 1, col(0x2a3a4a)); m.box(4, 8, 0, 8, 13, 1, col(0xd8b08a)); m.box(4, 12, 0, 8, 14, 1, col(0x6a6a6a)); m.box(2, 1, 0, 10, 8, 1, K.black); m.box(5, 5, 0, 7, 8, 1, K.white); m.box(5.5, 5, 0, 6.5, 7, 1, K.red); AF.placeStatic(AF.meshModel(m, { vs: 1 / 6, anchor: [0.5, 0, 0] }), -22.75, G + 4.2, -112.51, 2, { collide: false }); CIV.textProp('MAYOR H. FENWICK', K.gold, -22.75, G + 3.85, -112.51, 2, 1 / 28); }
    // a big model of Port Solace on a table (back hall, west)
    { F(-50.5, G, -132, -44.5, G + 0.75, -127.5, K.woodD); F(-50.75, G + 0.75, -132.25, -44.25, G + 1.0, -127.25, K.oak);
      const m = M(48, 12, 34), sea = col(0x3f78a8, { jitter: 0.2 }), grassC = col(0x6a9a4a, { jitter: 0.4 }), road = col(0x6a6a70, { jitter: 0.1 }), bld = [K.limeW, K.buff, col(0xa85a3a), col(0xc07a5a), K.limeD, col(0x9a4a3a)];
      for (let x = 0; x < 48; x++) for (let z = 0; z < 34; z++) { let c = z > 28 ? sea : ((x % 8 === 0 || z % 8 === 0) ? road : grassC); m.set(x, 0, z, c); if (c === grassC && !(x > 16 && x < 32 && z < 8)) { const h = 1 + ((AF.hash2(x >> 2, z >> 2) * (x > 26 && x < 40 && z < 20 ? 10 : 4)) | 0); if (AF.hash2(x, z) > 0.2) m.box(x, 1, z, x + 1, 1 + h, z + 1, bld[(AF.hash2(x >> 1, z >> 1) * bld.length) | 0]); } }
      m.sphere(21, 3, 11, 2.5, K.copperL); m.box(20, 1, 9, 23, 3, 13, K.limeW); m.box(36, 1, 4, 38, 11, 6, K.limeW); m.box(36.5, 11, 4.5, 37.5, 12, 5.5, K.gold);
      for (let x = 30; x < 46; x++) for (let z = 29; z < 34; z++) if (x % 5 === 0) m.set(x, 1, z, K.steel);
      AF.placeStatic(AF.meshModel(m, { vs: 1 / 8, anchor: [0.5, 0, 0.5] }), -47.5, G + 1.0, -129.75, 0);
      for (const [x, z, y] of [[-47.5, -126.4, Math.PI], [-51.4, -129.75, Math.PI / 2], [-43.6, -129.75, -Math.PI / 2]]) CIV.spot('cityhall', x, G, z, y, 'browse', [[cx, -97.5], [cx, -127], [x, z]]);
      CIV.textProp('PORT SOLACE 1936', K.gold, -47.5, G + 0.2, -127.24, 0, 1 / 24); }
    CIV.light(-47.5, 5, -129.75, 0.9, 10);
  });
  def('deskbellC', () => { const m = M(6, 5, 6); m.box(0, 0, 0, 6, 1, 6, K.woodD); m.sphere(3, 1, 3, 2.5, K.brass, (x, y) => (y >= 1 ? K.brass : 0)); m.set(3, 4, 3, K.steel); return m; }, 1 / 32);
  CIV.walkTest('civic: City Hall rotunda gallery stair', -41, 1.25, -112, [[-41, -129.5], [-40, -127.4], [-35.1, -127.4], [-33.2, -127.4], [-33.2, -125], [-38.3, -124.8]], 5.75);
  CIV.walkTest('civic: plaza -> City Hall rotunda floor', -43, 0.25, -70.5, [[-43, -86], [-41, -89], [-41, -97.5], [-41, -112]], 1.25);
  AF.test('civic: dome lantern ~40 m', () => { let top = 0; for (let y = 60; y > 20; y -= 0.25) if (AF.W.getM(-41, y, -115)) { top = y; break; } return { ok: top > 36 && top < 50, info: 'top y=' + top }; });

  // =====================================================================================================
  // CIVIC PLAZA  (lot x -72..-10, z -72..-10)  — keep x -32..-24, z -40..-12 clear (spawn corridor)
  // =====================================================================================================
  const PL = CIV.PL = { fx: -41, fz: -44, R: 7.5 };
  AF.onBuild('civic-plaza', 310, () => {
    const { fx, fz, R } = PL;
    CIV.lotGround('cv-plaza', K.pave);
    // paving (v2): a 3-tone deco sunburst radiating from the fountain over the WHOLE plaza (0.25 m tiles), concentric jade
    // bands, 8 radial sett paths with granite kerbs, a gold ring, a terracotta border — no 2 m checkerboard anywhere
    const PZ = CIV.PZ = {
      c: col(0xe2d6b8, { jitter: 0.22, edge: 0.18, pat: 'tile' }), b: col(0xcdb690, { jitter: 0.25, edge: 0.2, pat: 'tile' }),
      r: col(0xb8643f, { jitter: 0.3, edge: 0.2, pat: 'terracotta' }), j: col(0x5c9884, { jitter: 0.25, edge: 0.2, pat: 'tile' }),
      s: col(0x8e8274, { jitter: 0.35, edge: 0.25, pat: 'setts' }), k: col(0x3a383e, { jitter: 0.15, edge: 0.2, rough: 0.3 }),
      g: col(0xd9ad4a, { jitter: 0.1, edge: 0.1, metal: 0.8, rough: 0.35 }), w: col(0xf0e8d4, { jitter: 0.15, edge: 0.15, pat: 'tile' }),
    };
    W.eachCol(-72, -72, -10, -10, (bx, bz, i, x, z) => {
      const r = Math.hypot(x - fx, z - fz), a = Math.atan2(z - fz, x - fx);
      const ang = (a + Math.PI) / (Math.PI * 2);
      let c;
      if (r < 17) {                                                   // inner sunburst: 32 rays, cream / terracotta
        const k = Math.floor(ang * 32), fr = ang * 32 - k;
        c = k % 2 ? PZ.w : PZ.r; if (fr < 0.08 || fr > 0.92) c = PZ.b;
        if (r > 11.5 && r < 12) c = PZ.g;
        if (r > 16.5) c = PZ.j;
      } else {                                                        // outer field: 36 rays of cream / buff, thin terracotta ray lines
        const k = Math.floor(ang * 36), arc = (ang * 36 - k) * (Math.PI * 2 * r / 36);
        c = k % 2 ? PZ.c : PZ.b;
        if (arc < 0.26) c = PZ.r;
        const band = (r - 17) % 7; if (band > 6.5) c = PZ.j; else if (band > 6.25 || band < 0.25) c = PZ.w;
        for (let q = 0; q < 8; q++) {                                 // 8 radial sett paths, granite kerbs
          const qa = q * Math.PI / 4, along = (x - fx) * Math.cos(qa) + (z - fz) * Math.sin(qa), perp = Math.abs(-(x - fx) * Math.sin(qa) + (z - fz) * Math.cos(qa));
          if (along > 0 && perp < 1.0) { c = perp > 0.75 ? PZ.k : PZ.s; break; }
        }
      }
      if (x < -71 || x > -11 || z < -71 || z > -11) c = PZ.j;
      else if (x < -70.5 || x > -11.5 || z < -70.5 || z > -11.5) c = PZ.r;
      W.C[i] = c;
    });
    // --- FOUNTAIN: stepped deco basin (world voxels), central tiers (fine model), live jets (instanced)
    CIV.ring(fx, fz, 0.25, 1.0, R + 0.75, R, K.limeW);
    CIV.ring(fx, fz, 1.0, 1.25, R + 1.0, R - 0.25, K.limeD);
    CIV.ring(fx, fz, 0.25, 0.5, R + 1.75, R + 0.75, K.limeD);
    W.ground(fx - R, fz - R, fx + R, fz + R, 1, K.waterB);
    cols(fx - R, fz - R, fx + R, fz + R, (x, z) => (Math.hypot(x - fx, z - fz) < R ? [0.25, 0.5, K.waterB] : null));
    { const wg = new THREE.CircleGeometry(R - 0.05, 48); wg.rotateX(-Math.PI / 2); wg.translate(fx, 0.8, fz); AF.addWater(wg); }
    {
      const m = M(48, 72, 48), c0 = 24;
      const ring = (y0, y1, rOut, rIn, c) => { for (let y = y0; y < y1; y++) for (let x = 0; x < 48; x++) for (let z = 0; z < 48; z++) { const r = Math.hypot(x + 0.5 - c0, z + 0.5 - c0); if (r < rOut && r >= rIn) m.set(x, y, z, typeof c === 'function' ? c(x, y, z) : c); } };
      ring(0, 10, 6, 0, K.limeW); ring(4, 5, 7, 0, K.gold);
      for (let y = 10; y < 16; y++) ring(y, y + 1, 6 + (y - 10) * 2.6, y < 15 ? 4 + (y - 10) * 2.6 : 0, y === 15 ? K.limeD : K.limeW);
      ring(14, 15, 18, 0, K.waterB);
      ring(16, 34, 3.2, 0, K.limeW); for (let y = 18; y < 34; y += 4) ring(y, y + 1, 3.8, 0, K.jade);
      for (let y = 34; y < 38; y++) ring(y, y + 1, 3 + (y - 34) * 2.4, y < 37 ? 1.5 + (y - 34) * 2.4 : 0, y === 37 ? K.gold : K.limeW);
      ring(36, 37, 11, 0, K.waterB);
      // crowning gilt sunburst figure: a stepped deco finial with rays
      ring(38, 48, 2, 0, K.limeW); ring(48, 52, 3, 0, K.goldN);
      for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; m.line(c0, 54, c0, c0 + Math.cos(a) * 6, 54 + Math.sin(a) * 0 + (k % 2 ? 4 : 7), c0 + Math.sin(a) * 6, K.goldN); }
      m.sphere(c0, 56, c0, 3, K.goldN);
      // water curtains falling from the two bowls
      for (let y = 16; y < 36; y++) for (let x = 0; x < 48; x++) for (let z = 0; z < 48; z++) { const r = Math.hypot(x + 0.5 - c0, z + 0.5 - c0); if (r >= 11 && r < 11.9) { const a = Math.floor((Math.atan2(z - c0, x - c0) + 3.1416) * 11); if (a % 2 === 0) m.set(x, y, z, K.water); } }
      for (let y = 2; y < 14; y++) for (let x = 0; x < 48; x++) for (let z = 0; z < 48; z++) { const r = Math.hypot(x + 0.5 - c0, z + 0.5 - c0); if (r >= 18 && r < 19) { const a = Math.floor((Math.atan2(z - c0, x - c0) + 3.1416) * 18); if (a % 3 === 0) m.set(x, y, z, K.water); } }
      AF.placeStatic(AF.meshModel(m, { vs: 1 / 8 }), fx, 0.4, fz, 0, { collide: false });
      AF.addCollider(fx - 1.0, 0, fz - 1.0, fx + 1.0, 7.5, fz + 1.0);
      AF.addCollider(fx - R - 0.75, 0, fz - R - 0.75, fx + R + 0.75, 1.0, fz + R + 0.75);
    }
    // live jets: 16 arcs from the basin rim into the lower bowl + a centre plume (InstancedMesh, cheap)
    if (AF.scene && AF.mat && AF.mat.voxel) {
      const dg = AF.meshModel(M(1, 1, 1).set(0, 0, 0, K.water), { vs: 0.12, anchor: [0.5, 0.5, 0.5] });
      const NJ = 16, PER = 26, NC = 36, N = NJ * PER + NC;
      const im = new THREE.InstancedMesh(dg, AF.mat.voxel, N); im.frustumCulled = false; im.castShadow = false; AF.scene.add(im);
      const mtx = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(1, 1, 1), p = new THREE.Vector3();
      const jets = [];
      for (let j = 0; j < NJ; j++) { const a = j / NJ * Math.PI * 2, sx = fx + Math.cos(a) * (R - 0.3), sz = fz + Math.sin(a) * (R - 0.3), ex = fx + Math.cos(a) * 2.6, ez = fz + Math.sin(a) * 2.6; jets.push({ sx, sy: 1.1, sz, ex, ey: 2.3, ez, h: 2.4 }); }
      CIV.fountain = { im, frames: 0 };
      const upd = (t) => {
        let k = 0;
        for (const J of jets) for (let i = 0; i < PER; i++) { const u = ((t * 0.55 + i / PER) % 1); p.set(J.sx + (J.ex - J.sx) * u, J.sy + (J.ey - J.sy) * u + 4 * J.h * u * (1 - u), J.sz + (J.ez - J.sz) * u); const s = 0.8 + 0.4 * Math.sin(i * 1.7); sc.set(s, s, s); mtx.compose(p, q, sc); im.setMatrixAt(k++, mtx); }
        for (let i = 0; i < NC; i++) { const u = ((t * 0.4 + i / NC) % 1), a = i * 2.39996, rr = 0.25 + u * 1.4; p.set(fx + Math.cos(a) * rr, 7.4 + 6 * u * (1 - u) * 2.2 - u * 1.5, fz + Math.sin(a) * rr); const s = 1.1 - u * 0.5; sc.set(s, s, s); mtx.compose(p, q, sc); im.setMatrixAt(k++, mtx); }
        im.instanceMatrix.needsUpdate = true; CIV.fountain.frames++;
      };
      upd(0);
      AF.onTick('civic-fountain', 335, (dt, t) => { const cam = AF.camera; if (cam && Math.hypot(cam.position.x - fx, cam.position.z - fz) > 160) return; upd(t); });
    }
    AF.addInteract({ x: fx, y: 1, z: fz + R + 1.2, r: 2.6, label: 'Toss a nickel in the fountain', act: () => { const w = ['You wish for a ticket on the Coastline Limited.', 'Plink! The nickel joins a thousand others.', 'You wish the lights never go out on Grand Avenue.', 'A goldfish? No, just the lamplight on the water.']; CIV.toast(w[Math.floor(Math.random() * w.length)]); } });
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + 0.4; AF.addSpot({ building: null, x: fx + Math.cos(a) * (R + 1.5), y: 0.25, z: fz + Math.sin(a) * (R + 1.5), yaw: 0, kind: 'pigeon' }); }
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2 + 0.2, x = fx + Math.cos(a) * (R + 2.4), z = fz + Math.sin(a) * (R + 2.4); if (x > -33 && z > -41) continue; AF.addSpot({ building: null, x, y: 0.25, z, yaw: Math.atan2(fx - x, fz - z), kind: 'stand' }); }
    // benches in a ring (r 12.5), facing the fountain, skipping the spawn corridor
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * Math.PI * 2 + Math.PI / 12, x = fx + Math.cos(a) * 12.5, z = fz + Math.sin(a) * 12.5;
      if (x > -34 && z > -42) continue;
      if (Math.abs(x - fx) < 2.5) continue;                                           // keep the N-S axis open
      const yaw = Math.atan2(fx - x, fz - z), rot = ((Math.round(yaw / (Math.PI / 2)) % 4) + 4) % 4;
      const qa = rot * Math.PI / 2;
      put('parkbench', x, 0.25, z, rot);
      for (const o of [-0.45, 0.45]) AF.addSpot({ building: null, x: x + Math.cos(qa) * o, y: 0.69, z: z - Math.sin(qa) * o, yaw: qa, kind: 'bench' });
    }
    // the pigeon lady's bench (west) with a bag of crumbs
    put('parkbench', -60, 0.25, -30, 0); AF.addSpot({ building: null, x: -60, y: 0.69, z: -29.9, yaw: 0, kind: 'bench' });
    for (let i = 0; i < 4; i++) AF.addSpot({ building: null, x: -61.5 + i, y: 0.25, z: -27.5 + (i % 2) * 0.6, yaw: 0, kind: 'pigeon' });
    // --- STATUE of Captain Josiah Solace on a granite plinth (north of the fountain, on axis)
    const SX = fx, SZ = -63;
    F(SX - 2.25, 0.25, SZ - 2.25, SX + 2.25, 0.75, SZ + 2.25, K.granite); F(SX - 1.75, 0.75, SZ - 1.75, SX + 1.75, 3.5, SZ + 1.75, K.granite);
    F(SX - 2.0, 3.5, SZ - 2.0, SX + 2.0, 3.75, SZ + 2.0, K.limeW); F(SX - 1.75, 1.25, SZ + 1.75, SX + 1.75, 1.5, SZ + 2.0, K.gold);
    {
      const m = M(20, 40, 14), br = K.bronze, bd = K.bronzeD, gl = K.gold;
      m.box(3, 0, 2, 17, 1, 12, bd);
      m.box(5, 1, 5, 9, 15, 9, br); m.box(11, 1, 5, 15, 15, 9, br); m.box(5, 1, 9, 9, 3, 12, bd); m.box(11, 1, 9, 15, 3, 12, bd);   // legs + boots
      m.box(4, 12, 4, 16, 16, 10, bd);                                     // coat skirt
      m.box(5, 16, 5, 15, 27, 9, br); m.box(9, 17, 9, 11, 26, 10, gl);     // body + buttons
      m.box(3, 18, 5, 5, 26, 9, br); m.box(15, 22, 5, 17, 28, 9, br); m.box(15, 28, 6, 17, 34, 8, br); // arms, right raised
      m.line(16, 33, 7, 16, 37, 12, gl, 0.8);                             // spyglass
      m.box(7, 27, 5, 13, 28, 9, bd); m.box(7, 28, 6, 13, 34, 10, br);     // head
      m.box(5, 33, 5, 15, 35, 11, bd); m.box(7, 35, 6, 13, 38, 10, bd);   // tricorn
      m.box(4, 22, 3, 6, 25, 5, br); m.box(0, 1, 6, 4, 6, 10, bd); m.box(1, 6, 7, 3, 8, 9, bd);    // anchor-coil at the feet
      AF.placeStatic(AF.meshModel(m, { vs: 1 / 8, anchor: [0.5, 0, 0.5] }), SX, 3.75, SZ, 0, { collide: false });
    }
    AF.addCollider(SX - 2.25, 0, SZ - 2.25, SX + 2.25, 8.5, SZ + 2.25);
    CIV.textProp('CAPT. JOSIAH SOLACE', K.gold, SX, 2.4, SZ + 1.76, 0, 1 / 20);
    CIV.textProp('FOUNDER  1791', K.gold, SX, 1.8, SZ + 1.76, 0, 1 / 24); CIV.textProp('CITY CHARTERED 1851', K.gold, SX, 1.3, SZ + 1.76, 0, 1 / 26);
    for (const [dx, dz] of [[-2.25, 2.25], [2.25, 2.25]]) put('floodlamp', SX + dx * 1.1, 0.25, SZ + dz + 0.5, 2, false);
    AF.addLight({ x: SX, y: 3, z: SZ + 3, color: 0xffe0b0, intensity: 1.0, range: 12, kind: 'sign' });
    AF.addInteract({ x: SX, y: 1, z: SZ + 3.2, r: 2.4, label: 'Read the plaque', act: () => CIV.toast('CAPT. JOSIAH SOLACE, 1752-1819. He found shelter here from the storm of 1791 and named the harbour for it. CITY CHARTERED 1851.') });
    // --- SIX FLAGPOLES along the north edge (Charter St), dynamic flags
    const fxs = [-66, -58, -50, -32, -24, -16];
    fxs.forEach((x, i) => { F(x - 0.75, 0.25, -69.75, x + 0.75, 0.75, -68.25, K.granite); CIV.flagpole(x, 0.75, -69, i % 4); });
    // --- WAR MEMORIAL (south-west): stepped cenotaph + obelisk, wreaths, inscription
    const MX = -61, MZ = -21;
    F(MX - 3.5, 0.25, MZ - 3.5, MX + 3.5, 0.5, MZ + 3.5, K.limeD); F(MX - 2.75, 0.5, MZ - 2.75, MX + 2.75, 0.75, MZ + 2.75, K.limeW);
    F(MX - 1.75, 0.75, MZ - 1.75, MX + 1.75, 3.25, MZ + 1.75, K.limeW); F(MX - 2.0, 3.25, MZ - 2.0, MX + 2.0, 3.75, MZ + 2.0, K.limeD);
    for (let k = 0; k < 16; k++) { const h = 1.25 - k * 0.06; F(MX - h, 3.75 + k * 0.5, MZ - h, MX + h, 4.25 + k * 0.5, MZ + h, k % 5 === 4 ? K.limeD : K.limeW); }
    F(MX - 0.5, 11.75, MZ - 0.5, MX + 0.5, 12.5, MZ + 0.5, K.goldN); F(MX - 0.25, 12.5, MZ - 0.25, MX + 0.25, 13.0, MZ + 0.25, K.goldN);
    { const m = M(16, 16, 3); for (let i = 0; i < 16; i++) for (let j = 0; j < 16; j++) { const r = Math.hypot(i + 0.5 - 8, j + 0.5 - 8); if (r < 8 && r > 5) m.set(i, j, 1, AF.hash2(i, j) > 0.2 ? K.greenD : K.red); } m.box(6, 0, 1, 10, 3, 2, K.red); const g = AF.meshModel(m, { vs: 1 / 10, anchor: [0.5, 0.5, 0] }); for (let r = 0; r < 4; r++) { const ox = [0, 1.76, 0, -1.76][r], oz = [1.76, 0, -1.76, 0][r]; AF.placeStatic(g, MX + ox, 2.0, MZ + oz, r, { collide: false }); } }
    CIV.textProp('1917  1918', K.bronze, MX, 2.9, MZ + 1.76, 0, 1 / 16); CIV.textProp('WE REMEMBER', K.bronze, MX + 1.76, 2.9, MZ, 1, 1 / 20);
    AF.addCollider(MX - 2.0, 0, MZ - 2.0, MX + 2.0, 13, MZ + 2.0);
    for (let i = 0; i < 4; i++) AF.addSpot({ building: null, x: MX - 1.2 + i * 0.8, y: 0.5, z: MZ + 3.2, yaw: Math.PI, kind: 'stand' });
    // --- planters with autumn trees + flower beds, lampposts, litter bins
    for (const [px, pz] of [[-66, -58], [-66, -44], [-16, -58], [-16, -48], [-54, -16], [-66, -34]]) {
      F(px - 2, 0.25, pz - 2, px + 2, 1.0, pz + 2, K.limeD); F(px - 2.25, 1.0, pz - 2.25, px + 2.25, 1.25, pz + 2.25, K.limeW); F(px - 1.75, 0.75, pz - 1.75, px + 1.75, 1.0, pz + 1.75, K.soil);
      put('tree', px, 1.0, pz, (px * 7 + pz) & 3, false); AF.addCollider(px - 2, 0, pz - 2, px + 2, 1.25, pz + 2);
      for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2; W.setM(px + Math.cos(a) * 1.45, 1.0, pz + Math.sin(a) * 1.45, [K.flowerR, K.flowerY, K.flowerP][k % 3]); }
    }
    for (const [lx, lz] of [[-50, -28], [-50, -60], [-20, -30], [-58, -44], [-34, -62], [-14, -20], [-68, -20], [-40, -14]]) { if (lx > -33 && lx < -23 && lz > -41) continue; put('lamppost', lx, 0.25, lz, 0); AF.addLight({ x: lx, y: 4.5, z: lz, color: 0xffd9a0, intensity: 0.8, range: 10, kind: 'street' }); }
    // hedges framing the corners (low, clear of the corridor)
    for (const [a, b, c, d] of [[-71, -71, -60, -70], [-22, -71, -11, -70], [-71, -12, -66, -11], [-18, -12, -11, -11]]) { F(a, 0.25, b, c, 1.0, d, K.hedge); }
    // news kiosk + popcorn cart feel: a newsstand on the east side
    F(-16, 0.25, -38, -12, 2.75, -34, K.jade); F(-16.5, 2.75, -38.5, -11.5, 3.0, -33.5, K.gold); F(-16.01, 1.0, -37.5, -15.75, 2.25, -34.5, 0);
    CIV.textProp('DAILY CLARION', K.gold, -16.3, 2.3, -36, 3, 1 / 20); AF.addSpot({ building: null, x: -14, y: 0.25, z: -36, yaw: -Math.PI / 2, kind: 'work' });
    AF.addLabel('Civic Plaza', fx, -30, 'place');
    AF.addViewpoint('Civic Plaza', [-41, 22, 25], [-41, 12, -110]);
  });
  // =====================================================================================================
  // CIVIC PLAZA v2 LIFE: HARBOUR DAYS speaker's stand + bunting, balloon seller, flower stall, mum pots, autumn trees,
  // election column, newsboy, civic-works corner, a pigeon on the founder's hat, 30+ crowd spots for the extras tier
  // =====================================================================================================
  CIV.swing = [];
  const MUMC = [col(0xd9702a, { jitter: 0.5, solid: false }), col(0xe8b830, { jitter: 0.5, solid: false }), col(0x8a2a3a, { jitter: 0.5, solid: false }), col(0xc84a30, { jitter: 0.5, solid: false })];
  const potC = col(0xb05a36, { jitter: 0.3, edge: 0.3 }), potD = col(0x8a4428, { jitter: 0.3 });
  for (let v = 0; v < 3; v++) def('mumpot' + v, () => { const m = M(10, 11, 10); for (let y = 0; y < 5; y++) { const rr = 3.2 + y * 0.35; for (let x = 0; x < 10; x++) for (let z = 0; z < 10; z++) if (Math.hypot(x + 0.5 - 5, z + 0.5 - 5) < rr) m.set(x, y, z, y === 4 ? potD : potC); } m.sphere(5, 6.5, 5, 4.6, K.leaf, (x, y, z) => (y < 5 ? 0 : AF.hash3(x, y, z) > 0.28 ? MUMC[(v + (AF.hash3(z, y, x) > 0.8 ? 1 : 0)) % 4] : K.leafD)); return m; }, 1 / 16);
  def('balloons', () => { const m = M(22, 46, 22), BC = [col(0xd23a32, { emit: 0x401010, emitK: 0.2, mode: 'always' }), col(0xe8c040), col(0x3a7ad0), col(0x3aa060), col(0xe070a8), col(0xf4f0e6)], str = col(0xe8e0d0);
    const B = [[11, 38, 11], [6, 34, 8], [16, 35, 9], [8, 40, 15], [15, 41, 14], [11, 32, 16], [4, 39, 13], [18, 38, 6], [11, 43, 7]];
    B.forEach(([x, y, z], i) => { m.line(11, 0, 11, x, y - 3, z, str, 0.5); for (let a = -3; a <= 3; a++) for (let b = -4; b <= 3; b++) for (let c = -3; c <= 3; c++) if (a * a / 9.6 + b * b / 14 + c * c / 9.6 < 1) m.set(x + a, y + b, z + c, BC[i % BC.length]); m.set(x, y - 5, z, BC[i % BC.length]); });
    return m; }, 1 / 16);
  def('flowerstall', () => { const m = M(20, 23, 14), red = K.red, wh = K.white, fl = [K.flowerR, K.flowerY, K.flowerP, col(0xf4f0e6, { solid: false, jitter: 0.4 }), MUMC[0]];
    for (const x of [0, 19]) m.box(x, 0, 4, x + 1, 6, 10, K.iron); m.box(1, 5, 2, 19, 7, 12, K.wood); m.box(1, 7, 2, 19, 8, 3, K.woodD); m.box(1, 7, 11, 19, 8, 12, K.woodD);
    for (let i = 0; i < 12; i++) { const x = 2 + (i % 6) * 3, z = 3 + ((i / 6) | 0) * 4 + (i % 2); m.box(x, 7, z, x + 2, 10 + (i % 3), z + 2, K.steel); m.box(x - 1, 10 + (i % 3), z - 1, x + 3, 12 + (i % 3), z + 3, fl[(i * 7) % fl.length]); m.set(x, 12 + (i % 3), z, fl[(i * 3 + 1) % fl.length]); }
    for (const [x, z] of [[1, 2], [18, 2], [1, 11], [18, 11]]) m.box(x, 7, z, x + 1, 20, z + 1, K.woodD);
    for (let x = 0; x < 20; x++) m.box(x, 20, 0, x + 1, 21, 14, (x >> 1) % 2 ? red : wh); for (let x = 0; x < 20; x++) m.set(x, 19, 0, (x >> 1) % 2 ? red : wh);
    return m; }, 1 / 8);
  def('lectern', () => { const m = M(10, 19, 7); m.box(1, 0, 0, 9, 1, 7, K.woodD); m.box(2, 1, 1, 8, 15, 6, K.wood); m.box(0, 15, 0, 10, 17, 7, K.woodD); m.box(3, 5, 6, 7, 11, 7, K.gold); m.box(4, 6, 6, 6, 10, 7, K.navy); m.box(4, 17, 4, 5, 19, 5, K.iron); m.set(4, 19, 4, K.steelL); return m; }, 1 / 16);
  def('pigeonHat', () => { const m = M(3, 4, 6), g = col(0x8a8f9a), d = col(0x5a5f6a); m.box(0, 0, 1, 3, 2, 5, g); m.box(1, 2, 3, 2, 4, 5, d); m.set(1, 3, 5, col(0xd8a040)); m.box(1, 1, 0, 2, 2, 1, d); return m; }, 1 / 16);
  def('sawhorse', () => { const m = M(20, 8, 4); for (const x of [1, 18]) { m.box(x, 0, 0, x + 1, 6, 1, K.woodD); m.box(x, 0, 3, x + 1, 6, 4, K.woodD); } for (let x = 0; x < 20; x++) m.box(x, 6, 1, x + 1, 8, 3, (x >> 1) % 2 ? K.red : K.white); return m; }, 1 / 8);
  def('tarkettle', () => { const m = M(10, 10, 8); for (const z of [0, 7]) m.box(1, 0, z, 4, 3, z + 1, K.iron); m.box(0, 3, 1, 10, 8, 7, col(0x2a2622)); m.box(7, 8, 3, 9, 10, 5, K.iron); m.box(-0, 5, 3, 1, 6, 5, K.iron); return m; }, 1 / 8);
  def('shoeshine', () => { const m = M(10, 16, 8); m.box(0, 0, 0, 10, 5, 8, K.woodD); m.box(1, 5, 1, 9, 7, 8, K.wood); m.box(1, 7, 6, 9, 14, 8, K.fabricR); m.box(0, 7, 1, 1, 10, 7, K.brass); m.box(9, 7, 1, 10, 10, 7, K.brass); m.box(2, 5, 0, 4, 7, 1, K.brass); m.box(6, 5, 0, 8, 7, 1, K.brass); m.box(0, 14, 6, 10, 16, 8, K.gold); return m; }, 1 / 8);
  // a pennant string (dynamic, sways about its own axis): from (x,y,z) running len metres along +x (dir 0) or +z (dir 1)
  CIV.pennants = (x, y, z, len, dir, sag = 0.6) => {
    if (!AF.scene) return;
    const n = Math.max(8, Math.round(len * 16)), sp = Math.round(sag * 16), m = M(n, sp + 12, 1), cs = [K.red, K.white, K.navy, K.gold, K.jade], str = K.white;
    for (let i = 0; i < n; i++) { const u = i / (n - 1), yy = sp + 11 - Math.round(4 * sp * u * (1 - u)); m.set(i, yy, 0, str); const q = i % 9, k = Math.floor(i / 9); if (q >= 1 && q <= 7) { const dep = Math.round((4 - Math.abs(q - 4)) * 2.2); for (let d = 1; d <= dep; d++) m.set(i, yy - d, 0, cs[k % cs.length]); } }
    const mesh = AF.modelMesh(AF.meshModel(m, { vs: 1 / 16, anchor: [0, 1, 0.5] })); mesh.rotation.order = 'YXZ'; mesh.position.set(x, y, z); mesh.rotation.y = dir ? -Math.PI / 2 : 0; mesh.castShadow = false; mesh.frustumCulled = false; AF.scene.add(mesh);
    CIV.swing.push({ o: mesh, kind: 'pen', ph: CIV.swing.length * 1.3, x: x + (dir ? 0 : len / 2), z: z + (dir ? len / 2 : 0), by: y });
  };
  AF.onTick('civic-swing', 332, (dt, t) => {
    const cam = AF.camera; if (!cam) return;
    for (const s of CIV.swing) {
      if (Math.abs(cam.position.x - s.x) + Math.abs(cam.position.z - s.z) > 150) continue;
      if (s.kind === 'pen') s.o.rotation.x = Math.sin(t * 1.7 + s.ph) * 0.22 + Math.sin(t * 3.1 + s.ph * 2) * 0.06;
      else { s.o.rotation.z = Math.sin(t * 1.2 + s.ph) * 0.07; s.o.rotation.x = Math.sin(t * 0.9 + s.ph + 1) * 0.06; s.o.position.y = s.by + Math.sin(t * 2.1 + s.ph) * 0.04; }
    }
  });
  AF.onBuild('civic-plaza-life', 312, () => {
    const { fx, fz } = PL, sp = (x, y, z, yaw, kind, extra) => AF.addSpot(Object.assign({ building: null, x, y, z, yaw, kind }, extra || {}));
    // --- HARBOUR DAYS speaker's stand (x -30..-25, z -66.5..-63.25), striped skirt, steps, lectern, banner, band
    const skR = K.red, skW = K.white, skB = K.navy;
    F(-30, 0.25, -66.5, -25, 1.25, -63.25, K.woodD); F(-30.25, 1.0, -66.75, -24.75, 1.25, -63.0, K.oak);
    CIV.cols(-30.25, -66.75, -24.75, -63.0, (x, z) => { const edge = z > -63.3 || x < -30 || x > -25; if (!edge) return null; const u = Math.floor((z > -63.3 ? x : z) * 2); return [0.25, 1.0, u % 3 === 0 ? skR : u % 3 === 1 ? skW : skB]; });
    CIV.steps('z', -62.25, -1, -28.25, -26.75, 0.25, 3, 0.25, K.oak);
    put('lectern', -27.5, 1.25, -64.1, 0, false);
    for (const x of [-29.9, -25.1]) { F(x - 0.125, 1.25, -66.5, x + 0.125, 5.5, -66.25, K.bronze); F(x - 0.25, 5.5, -66.625, x + 0.25, 5.75, -66.125, K.gold); }
    F(-29.75, 3.5, -66.5, -25.25, 5.0, -66.25, K.navy); F(-29.75, 4.95, -66.5, -25.25, 5.1, -66.25, K.gold); F(-29.75, 3.4, -66.5, -25.25, 3.5, -66.25, K.gold);
    CIV.textProp('HARBOUR DAYS', K.gold, -27.5, 4.15, -66.24, 0, 1 / 18);
    CIV.textProp('SAT SEPT 26', K.white, -27.5, 3.62, -66.24, 0, 1 / 30);
    AF.addCollider(-30.25, 0, -66.75, -24.75, 1.25, -63.0);
    CIV.pennants(-29.9, 5.6, -66.4, 4.8, 0, 0.35);
    for (const [x, z] of [[-30.6, -63.4], [-24.4, -63.4], [-28.8, -62.0], [-26.2, -62.0]]) put('mumpot' + ((x * 3) & 1 ? 0 : 2), x, 0.25, z, 0, false);
    sp(-27.5, 1.25, -64.9, 0, 'work', { role: 'orator' });
    for (const [x, z] of [[-29.3, -65.6], [-28.5, -65.95], [-25.9, -65.7]]) sp(x, 1.25, z, 0, 'work', { role: 'band' });
    for (const zz of [-60.5, -58.7, -57.0]) for (const xx of [-31, -29.4, -27.8, -26.2, -24.6]) sp(xx + (zz === -58.7 ? 0.6 : 0), 0.25, zz, Math.PI, 'audience');
    AF.addInteract({ x: -27.5, y: 1, z: -61.6, r: 2.4, label: 'Listen to the speech', act: () => { const w = ['"...and on Saturday, friends, every pier from here to the lighthouse will be strung with lights!"', '"Chartered in 1851, and never once late with the mail!"', '"Mayor Fenwick has kept his promises. Well, most of them. Well, some of them."', '"HARBOUR DAYS, Saturday the 26th! Fleet parade at ten, fireworks at nine!"']; CIV.toast(w[Math.floor(Math.random() * w.length)]); } });
    // --- bunting over the plaza (dynamic pennants): across the spawn walk, down the west walk, along the flag row
    CIV.pennants(-50, 4.7, -29, 30, 0, 0.9);
    CIV.pennants(-50, 4.7, -60, 32, 1, 0.9);
    CIV.pennants(-66, 11.4, -69, 16, 0, 1.4); CIV.pennants(-32, 11.4, -69, 16, 0, 1.4);
    CIV.pennants(-20, 4.7, -60, 30, 1, 0.9);
    // --- autumn trees in iron grates at r 21 (off the sett paths and the spawn walk)
    for (const deg of [30, 160, 210, 330]) {
      const a = deg * Math.PI / 180, x = Math.round((fx + Math.cos(a) * 21) * 4) / 4, z = Math.round((fz + Math.sin(a) * 21) * 4) / 4;
      W.eachCol(x - 1.5, z - 1.5, x + 1.5, z + 1.5, (bx, bz, i, px, pz) => { const r = Math.hypot(px - x, pz - z); if (r < 1.5) W.C[i] = r > 1.2 ? K.iron : K.soil; });
      put('tree', x, 0.25, z, deg & 3, false); AF.addCollider(x - 0.5, 0, z - 0.5, x + 0.5, 3, z + 0.5);
      for (let k = 0; k < 3; k++) { const b = a + 0.6 + k * 2.1; put('mumpot' + k, x + Math.cos(b) * 1.9, 0.25, z + Math.sin(b) * 1.9, 0, false); }
    }
    // --- mum pots ringing the benches (r 14.5), skipping the N-S axis and the spawn walk
    for (let i = 0; i < 28; i++) { const a = i / 28 * Math.PI * 2, x = fx + Math.cos(a) * 14.6, z = fz + Math.sin(a) * 14.6; if (Math.abs(x - fx) < 2) continue; if (x > -33 && x < -23 && z > -41) continue; put('mumpot' + (i % 3), x, 0.25, z, 0, false); }
    // --- balloon seller at the spawn walk's west edge + flower stall on its east edge
    put('shoeshine', -35.8, 0.25, -14.6, 1, true);
    sp(-35.8, 0.25, -13.5, Math.PI, 'work', { role: 'shoeshine' }); sp(-35.8, 0.9, -14.7, 0, 'sit');
    if (AF.scene) { const g = AF.modelMesh(geo('balloons')); g.position.set(-34.2, 1.25, -25); g.castShadow = false; g.frustumCulled = false; AF.scene.add(g); CIV.swing.push({ o: g, kind: 'bal', ph: 0.4, x: -34.2, z: -25, by: 1.25 }); }
    sp(-34.6, 0.25, -25, Math.PI / 2, 'work', { role: 'balloons' }); sp(-33.1, 0.25, -24.3, -Math.PI / 2, 'stand', { age: 'kid' }); sp(-33.2, 0.25, -26.0, -Math.PI / 2 - 0.3, 'queue', { age: 'kid' });
    put('flowerstall', -19.5, 0.25, -24, 3, true);
    CIV.textProp('FRESH FLOWERS 5c', K.red, -20.45, 1.05, -24, 3, 1 / 26);
    sp(-17.9, 0.25, -24, -Math.PI / 2, 'work', { role: 'florist' }); sp(-21.6, 0.25, -23.4, Math.PI / 2, 'queue'); sp(-21.9, 0.25, -25.0, Math.PI / 2, 'queue');
    // --- newsboy at the corner of the walk, election column, pigeon on the founder's hat
    sp(-33.3, 0.25, -19.2, Math.PI / 2, 'work', { role: 'newsboy' });
    { const cx = -47, cz = -22;
      CIV.ring(cx, cz, 0.25, 0.5, 1.25, 0, K.granite); CIV.ring(cx, cz, 0.5, 3.5, 1.0, 0, K.greenD); CIV.ring(cx, cz, 3.5, 3.75, 1.25, 0, K.green); CIV.ring(cx, cz, 3.75, 4.0, 0.75, 0, K.green); F(cx - 0.25, 4.0, cz - 0.25, cx + 0.25, 4.5, cz + 0.25, K.gold);
      const pst = (a, b, fg, bg, rot, ox, oz) => { const m1 = AF.textModel(a, fg, { pad: 2, bg }), m2 = AF.textModel(b, fg, { pad: 2, bg }); AF.placeStatic(AF.meshModel(m1, { vs: 1 / 22, anchor: [0.5, 0, 0] }), cx + ox, 2.35, cz + oz, rot, { collide: false }); AF.placeStatic(AF.meshModel(m2, { vs: 1 / 22, anchor: [0.5, 0, 0] }), cx + ox, 1.75, cz + oz, rot, { collide: false }); };
      pst('RE-ELECT', 'FENWICK', K.navy, K.white, 0, 0, 1.01); pst('VOTE', 'PRITCHARD', K.white, K.red, 2, 0, -1.01); pst('HARBOUR', 'DAYS 26', K.gold, K.navy, 1, 1.01, 0); pst('PARAGON', 'TONITE', K.red, K.paper, 3, -1.01, 0);
      AF.addCollider(cx - 1.1, 0, cz - 1.1, cx + 1.1, 4, cz + 1.1);
      sp(cx + 0.3, 0.25, cz + 2.1, Math.PI, 'stand'); sp(cx - 2.1, 0.25, cz - 0.2, Math.PI / 2, 'stand'); }
    put('pigeonHat', fx + 0.1, 3.75 + 4.75, -63 + 0.1, 1, false);
    // --- CIVIC WORKS corner (NE): sawhorses, a smoking tar kettle, the WPA-style sign
    put('sawhorse', -19.5, 0.25, -65.5, 0, true); put('sawhorse', -21.5, 0.25, -63.5, 1, true); put('tarkettle', -18.5, 0.25, -63.6, 0, true);
    if (typeof AF.addChimney === 'function') AF.addChimney(-18.0, 1.6, -63.4);
    F(-22.5, 0.25, -67.25, -22.25, 2.75, -67.0, K.woodD); F(-17.75, 0.25, -67.25, -17.5, 2.75, -67.0, K.woodD); F(-22.5, 1.75, -67.25, -17.5, 3.0, -67.0, K.paper);
    CIV.textProp('CIVIC WORKS PROJECT', K.navy, -20, 2.5, -66.99, 0, 1 / 26); CIV.textProp('NEW LAMPS FOR HARBOUR DAYS', K.red, -20, 2.0, -66.99, 0, 1 / 34);
    sp(-19.2, 0.25, -62.4, Math.PI, 'work', { role: 'workman' }); sp(-21.0, 0.25, -61.9, Math.PI * 0.8, 'work', { role: 'workman' });
    // --- chatting pairs + fountain watchers
    for (const [x, z, x2, z2] of [[-47, -30, -46.1, -30.7], [-36, -56.5, -35.1, -55.8], [-52.5, -50, -51.7, -50.9], [-20.5, -44.5, -21.3, -43.6], [-55, -24.5, -54.1, -24.0]]) { sp(x, 0.25, z, Math.atan2(x2 - x, z2 - z), 'stand'); sp(x2, 0.25, z2, Math.atan2(x - x2, z - z2), 'stand'); }
    for (const [x, z] of [[-30, -30], [-27, -37], [-35, -33], [-45, -26]]) sp(x, 0.25, z, 0, 'pigeon');
  });
  AF.test('civic: spawn corridor clear (x -32..-24, z -40..-12)', () => {
    let bad = 0; for (let x = -31.9; x < -24; x += 0.5) for (let z = -39.9; z < -12; z += 0.5) for (let y = 0.3; y < 2.5; y += 0.5) if (AF.solidAt(x, y, z)) bad++;
    return { ok: bad === 0, info: bad + ' solid samples' };
  });
  AF.test('civic: fountain jets animate', () => { const f = CIV.fountain; if (!f) return { ok: false, info: 'no fountain mesh' }; const a = f.frames; AF.step(2); return { ok: f.frames > a || a > 0, info: 'frames ' + f.frames }; });
  AF.test('civic: plaza crowd spots >= 25', () => { const n = (AF.spots || []).filter((q) => !q.building && q.x > -72 && q.x < -10 && q.z > -72 && q.z < -10 && q.kind !== 'pigeon').length; return { ok: n >= 25, info: n + ' spots' }; });
  AF.test('civic: flags sway (dynamic)', () => ({ ok: CIV.flags.length >= 8, info: CIV.flags.length + ' flags' }));
  // =====================================================================================================
  // ROUND 2 (showcase): City Hall candelabra, bronze relief panels, polychrome seal, rotunda murals, wedding photo
  // =====================================================================================================
  // harness guard: with no active mode (fixed camera) never render the avatar when the camera sits in its head
  AF.onTick('civic-avatar-guard', 905, () => {
    const p = AF.player, cam = AF.camera; if (!p || !p.mesh || !cam || AF.mode) return;
    if (p.mesh.visible && Math.hypot(cam.position.x - p.x, cam.position.z - p.z) < 0.9 && cam.position.y - (p.y || 0) < 2.4) p.mesh.visible = false;
  });
  // WPA-style paint palette (smooth paint, no block grid)
  const PNT = CIV.PNT = {};
  for (const [k, h] of Object.entries({ sky: 0x9cc3cf, skyH: 0xe9dcb8, peach: 0xf2c48a, sun: 0xf7d060, sea: 0x2f6f7e, seaD: 0x214a5c, sand: 0xd9b477, hill: 0x7a9150, hillD: 0x4c6b3c,
    rust: 0xb4562e, ochre: 0xd99a3a, navy: 0x2a3a5e, cream: 0xf1e4c4, brown: 0x6a4428, skin: 0xd8a47a, red: 0xa8342a, white: 0xf4efe0, grey: 0x8a8d92, dark: 0x2c2c33, blue: 0x3f6fa8, olive: 0x8a8a3a }))
    PNT[k] = col(h, { smooth: true, jitter: 0.12, edge: 0 });
  // painter: 2-D canvas of colour indices -> Model (paint at z 0, gilt frame proud at z 1)
  CIV.canvas = (w, h) => {
    const g = new Array(w * h).fill(0);
    const c = {
      w, h, g,
      px(x, y, v) { x |= 0; y |= 0; if (x >= 0 && y >= 0 && x < w && y < h) g[y * w + x] = v; },
      rect(x0, y0, x1, y1, v) { for (let y = Math.max(0, y0 | 0); y < Math.min(h, y1); y++) for (let x = Math.max(0, x0 | 0); x < Math.min(w, x1); x++) g[y * w + x] = v; },
      disc(cx, cy, r, v, fn) { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy); if (d < r && (!fn || fn(x, y, d))) g[y * w + x] = v; } },
      tri(ax, ay, bx, by, cx2, cy2, v) { const d = (by - cy2) * (ax - cx2) + (cx2 - bx) * (ay - cy2); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const px = x + 0.5, py = y + 0.5; const l1 = ((by - cy2) * (px - cx2) + (cx2 - bx) * (py - cy2)) / d, l2 = ((cy2 - ay) * (px - cx2) + (ax - cx2) * (py - cy2)) / d; if (l1 >= 0 && l2 >= 0 && l1 + l2 <= 1) g[y * w + x] = v; } },
      line(x0, y0, x1, y1, v) { const n = Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2) + 1; for (let i = 0; i <= n; i++) c.px(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, v); },
      man(x, y, shirt, pants = PNT.navy, hat) { c.rect(x, y, x + 1, y + 3, pants); c.rect(x + 2, y, x + 3, y + 3, pants); c.rect(x, y + 3, x + 3, y + 7, shirt); c.rect(x + 1, y + 7, x + 2, y + 9, PNT.skin); c.px(x + 2, y + 8, PNT.skin); if (hat) c.rect(x, y + 9, x + 3, y + 10, hat); },
      sky(top = PNT.sky, mid = PNT.skyH, low = PNT.peach, y0 = 0) { for (let y = y0; y < h; y++) { const t = (y - y0) / (h - y0); c.rect(0, y, w, y + 1, t > 0.62 ? top : t > 0.3 ? mid : low); } for (let y = y0; y < h; y++) { const t = (y - y0) / (h - y0); if (Math.abs(t - 0.62) < 0.03 || Math.abs(t - 0.3) < 0.03) for (let x = (y % 2); x < w; x += 2) c.px(x, y, t > 0.46 ? top : mid); } },
      model(frame = K.gold, back = K.bronzeD) { const m = M(w + 2, h + 2, 2); m.box(0, 0, 0, w + 2, h + 2, 1, back); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (g[y * w + x]) m.set(x + 1, y + 1, 1, g[y * w + x]); m.box(0, 0, 1, w + 2, 1, 2, frame); m.box(0, h + 1, 1, w + 2, h + 2, 2, frame); m.box(0, 0, 1, 1, h + 2, 2, frame); m.box(w + 1, 0, 1, w + 2, h + 2, 2, frame); return m; },
    };
    return c;
  };
  // eight WPA murals: the story of Port Solace
  CIV.MURALS = ['FOUNDING 1851', 'THE HARBOUR', 'THE RAILROAD', 'INDUSTRY', 'THE HARVEST', 'LEARNING', 'THE CITY', 'THE LIGHT'];
  CIV.mural = (i, w = 40, h = 48) => {
    const P = PNT, c = CIV.canvas(w, h);
    c.sky(P.sky, P.skyH, P.peach, 12);
    const sea = (y1) => { c.rect(0, 0, w, y1, P.sea); for (let y = 1; y < y1; y += 3) for (let x = (y * 5) % 7; x < w; x += 7) c.rect(x, y, x + 3, y + 1, P.seaD); };
    const hills = (y, col2 = P.hill) => { for (let x = 0; x < w; x++) c.rect(x, 0, x + 1, y + Math.round(Math.sin(x * 0.21 + i) * 2.5 + Math.sin(x * 0.07) * 3), col2); };
    const sunAt = (x, y, r = 5) => { c.disc(x, y, r, P.sun); for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; c.line(x + Math.cos(a) * (r + 1.5), y + Math.sin(a) * (r + 1.5), x + Math.cos(a) * (r + 4), y + Math.sin(a) * (r + 4), P.sun); } };
    if (i === 0) {        // FOUNDING: a tall ship arrives, settlers on the shore
      sunAt(31, 38, 4); sea(15); c.tri(-1, 0, 16, 0, -1, 13, P.sand); c.rect(0, 0, 12, 4, P.sand);
      c.tri(15, 13, 34, 13, 17, 17, P.brown); c.rect(17, 13, 34, 17, P.brown); c.rect(17, 16, 34, 17, P.ochre);
      for (const [mx, mh] of [[21, 22], [27, 26], [32, 18]]) { c.rect(mx, 17, mx + 1, 17 + mh, P.brown); for (let s = 0; s < 3; s++) c.rect(mx - 4 + s, 20 + s * 6, mx + 5 - s, 25 + s * 6, P.white); }
      c.rect(27, 43, 30, 45, P.red); c.man(3, 4, P.rust, P.navy, P.dark); c.man(7, 3, P.cream, P.brown); c.man(10, 5, P.blue, P.navy, P.ochre); c.rect(8, 11, 9, 14, P.brown); c.rect(8, 13, 11, 14, P.red);
    } else if (i === 1) { // HARBOUR: freighter, cranes, gulls
      sea(10); c.rect(0, 10, w, 12, P.ochre); c.rect(4, 12, 34, 18, P.navy); c.rect(4, 12, 34, 13, P.red); c.rect(20, 18, 30, 23, P.cream); for (const fx of [22, 27]) { c.rect(fx, 23, fx + 2, 29, P.red); c.rect(fx, 29, fx + 2, 30, P.dark); c.disc(fx + 2, 33, 2.5, P.grey); c.disc(fx + 4, 36, 2, P.grey); }
      for (const cx2 of [3, 36]) { c.rect(cx2, 12, cx2 + 1, 34, P.rust); c.line(cx2, 34, cx2 + (cx2 < 20 ? 12 : -12), 30, P.rust); c.line(cx2 + (cx2 < 20 ? 10 : -10), 30.5, cx2 + (cx2 < 20 ? 10 : -10), 20, P.dark); c.rect(cx2 + (cx2 < 20 ? 9 : -11), 18, cx2 + (cx2 < 20 ? 12 : -8), 20, P.ochre); }
      for (const [gx, gy] of [[12, 40], [17, 43], [8, 36]]) { c.px(gx, gy, P.white); c.px(gx + 1, gy + 1, P.white); c.px(gx - 1, gy + 1, P.white); }
    } else if (i === 2) { // RAILROAD: a streamliner crosses a trestle over the valley
      sunAt(8, 38, 4); hills(14, P.hillD); for (let x = 0; x < w; x += 6) { c.rect(x, 0, x + 1, 20, P.rust); c.line(x, 8, x + 6, 20, P.rust); } c.rect(0, 20, w, 22, P.rust); c.rect(0, 22, w, 23, P.dark);
      c.rect(10, 23, 38, 29, P.navy); c.rect(10, 27, 38, 28, P.ochre); c.tri(6, 23, 10, 23, 10, 29, P.navy); c.rect(28, 29, 30, 31, P.dark); for (let x = 12; x < 38; x += 4) c.rect(x, 25, x + 2, 27, P.cream);
      c.disc(29, 34, 3, P.white); c.disc(33, 37, 3.5, P.cream); c.disc(38, 40, 4, P.skyH); c.rect(0, 0, w, 4, P.hill);
    } else if (i === 3) { // INDUSTRY: mill, smokestacks, the great gear and a smith
      c.rect(0, 0, w, 16, P.brown); c.rect(2, 16, 22, 26, P.rust); for (let x = 3; x < 22; x += 4) c.tri(x, 26, x + 4, 26, x + 4, 29, P.rust); for (const sx of [25, 30, 35]) { c.rect(sx, 16, sx + 3, 38, P.red); c.rect(sx, 36, sx + 3, 37, P.cream); c.disc(sx + 3, 41, 2.5, P.grey); }
      for (let x = 4; x < 21; x += 3) c.rect(x, 19, x + 2, 22, P.sun);
      c.disc(12, 10, 9, P.ochre, (x, y, d) => d > 5.5 || d < 2); for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2; c.rect(12 + Math.cos(a) * 9.5 - 1, 10 + Math.sin(a) * 9.5 - 1, 12 + Math.cos(a) * 9.5 + 1, 10 + Math.sin(a) * 9.5 + 1, P.ochre); }
      c.man(27, 2, P.blue, P.navy); c.rect(26, 9, 27, 13, P.brown); c.rect(25, 12, 28, 14, P.grey); c.rect(33, 2, 38, 5, P.dark); c.rect(34, 5, 37, 6, P.red);
    } else if (i === 4) { // HARVEST: striped fields to the horizon, the big sun, a farmer and sheaves
      sunAt(20, 30, 6); for (let y = 0; y < 18; y++) for (let x = 0; x < w; x++) { const u = (x - 20) / (18 - y + 3); c.px(x, y, (Math.floor(u * 3) & 1) ? P.ochre : P.olive); }
      c.rect(0, 17, w, 18, P.hillD); c.man(6, 2, P.red, P.navy, P.ochre); c.line(4, 3, 4, 14, P.brown); c.line(4, 14, 9, 12, P.grey);
      for (const sx of [26, 32]) { c.tri(sx, 0, sx + 5, 0, sx + 2.5, 9, P.sun); c.rect(sx + 1, 4, sx + 4, 5, P.brown); }
    } else if (i === 5) { // LEARNING: a colonnade, a teacher, children with books, a globe
      c.rect(0, 0, w, 6, P.cream); c.rect(0, 30, w, 34, P.cream); c.tri(0, 34, 40, 34, 20, 42, P.cream); c.tri(4, 34.5, 36, 34.5, 20, 40, P.skyH);
      for (let x = 2; x < w; x += 7) { c.rect(x, 6, x + 3, 30, P.white); c.rect(x - 1, 29, x + 4, 30, P.cream); }
      c.man(14, 6, P.navy, P.dark); c.rect(12, 12, 15, 14, P.white); c.man(20, 6, P.red, P.brown); c.man(24, 6, P.ochre, P.navy); c.rect(19, 11, 24, 13, P.white); c.rect(21, 11, 22, 13, P.red);
      c.disc(32, 12, 3.5, P.blue, (x, y) => ((x * 7 + y * 3) % 5 ? true : true)); c.disc(32, 12, 3.5, P.olive, (x, y) => (x + y) % 3 === 0); c.rect(31, 6, 33, 9, P.brown);
    } else if (i === 6) { // THE CITY: towers, searchlights, the blimp
      for (let k = 0; k < 5; k++) { const a = -0.5 + k * 0.25; c.line(20, 8, 20 + Math.sin(a) * 40, 8 + Math.cos(a) * 40, P.cream); }
      for (const [x0, bw, bh, cc] of [[1, 6, 22, P.navy], [8, 5, 30, P.cream], [14, 8, 38, P.ochre], [23, 5, 27, P.rust], [29, 7, 33, P.navy], [36, 4, 19, P.cream]]) { c.rect(x0, 0, x0 + bw, bh, cc); c.rect(x0 + 1, bh, x0 + bw - 1, bh + 2, cc); c.rect(x0 + (bw >> 1), bh + 2, x0 + (bw >> 1) + 1, bh + 5, cc); for (let y = 2; y < bh - 1; y += 3) for (let x = x0 + 1; x < x0 + bw - 1; x += 2) c.px(x, y, P.sun); }
      c.disc(28, 42, 1, P.grey); for (let x = 20; x < 36; x++) { const t = (x - 28) / 8, hh = Math.sqrt(Math.max(0, 1 - t * t)) * 3; c.rect(x, 42 - hh, x + 1, 42 + hh, P.grey); } c.rect(27, 38, 30, 39, P.dark); c.rect(33, 41, 36, 44, P.grey);
    } else {              // THE LIGHT: the lighthouse on the point, a sloop, the sweeping beam
      sea(12); c.tri(-1, 0, 22, 0, -1, 16, P.brown); c.rect(0, 0, 18, 12, P.brown); c.tri(5, 12, 15, 12, 10, 16, P.hillD);
      for (let y = 16; y < 36; y++) { const hw = 3 - (y - 16) * 0.06; c.rect(10 - hw, y, 10 + hw, y + 1, Math.floor((y - 16) / 4) % 2 ? P.red : P.white); }
      c.rect(8, 36, 13, 39, P.sun); c.rect(7, 39, 14, 40, P.dark); c.tri(8.5, 40, 12.5, 40, 10.5, 42, P.red); c.tri(13, 38, 40, 44, 40, 32, P.skyH);
      c.tri(26, 12, 36, 12, 34, 14, P.white); c.rect(26, 11, 36, 12, P.brown); c.tri(30, 14, 30, 30, 38, 14, P.white); c.rect(30, 14, 31, 30, P.brown);
    }
    return c;
  };
  // 5-globe candelabrum (1/8), bronze relief panel (1/16), polychrome city seal (1/12)
  def('candelabra', () => { const m = M(20, 42, 20), g = K.bulbN, b = K.bronze, d = K.bronzeD;
    m.box(5, 0, 5, 15, 3, 15, K.granite); m.box(6, 3, 6, 14, 5, 14, d); m.box(8, 5, 8, 12, 8, 12, b); m.box(9, 8, 9, 11, 32, 11, b); for (const y of [12, 20, 28]) m.box(8, y, 8, 12, y + 1, 12, K.gold);
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { for (let s = 1; s <= 7; s++) m.set(10 + dx * s - (dx < 0 ? 1 : 0), 30 + Math.round(Math.sin(s / 7 * Math.PI) * 1.5), 10 + dz * s - (dz < 0 ? 1 : 0), d); m.sphere(10 + dx * 7.5, 34, 10 + dz * 7.5, 2.3, g); m.box(9 + dx * 7.5, 30, 9 + dz * 7.5, 11 + dx * 7.5, 32, 11 + dz * 7.5, K.gold); }
    m.sphere(10, 38.5, 10, 2.8, g); m.box(9, 32, 9, 11, 36, 11, K.gold); m.box(9.5, 41, 9.5, 10.5, 42, 10.5, K.gold); return m; });
  const MOTIF = [
    (c, x, y, v) => { c.rect(x + 5, y + 2, x + 7, y + 12, v); c.rect(x + 3, y + 10, x + 9, y + 11, v); c.disc(x + 6, y + 12.5, 1.6, v, (a, b, d) => d > 0.7); c.line(x + 1, y + 5, x + 3, y + 2, v); c.line(x + 11, y + 5, x + 9, y + 2, v); c.rect(x + 3, y + 1, x + 9, y + 2, v); },               // anchor
    (c, x, y, v) => { c.disc(x + 6, y + 7, 5, v, (a, b, d) => d > 2.4); for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; c.px(x + 6 + Math.cos(a) * 5.6, y + 7 + Math.sin(a) * 5.6, v); } },                    // gear
    (c, x, y, v) => { c.tri(x + 1, y + 4, x + 11, y + 4, x + 3, y + 1, v); c.rect(x + 3, y + 1, x + 11, y + 4, v); c.rect(x + 6, y + 4, x + 7, y + 13, v); c.tri(x + 7, y + 5, x + 7, y + 12, x + 11, y + 5, v); },     // ship
    (c, x, y, v) => { c.disc(x + 6, y + 7, 2.6, v); for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; c.line(x + 6 + Math.cos(a) * 3.6, y + 7 + Math.sin(a) * 3.6, x + 6 + Math.cos(a) * 5.6, y + 7 + Math.sin(a) * 5.6, v); } }, // sun
    (c, x, y, v) => { for (const sx of [3, 6, 9]) { c.line(x + 6, y + 1, x + sx, y + 9, v); c.rect(x + sx - 1, y + 9, x + sx + 1, y + 13, v); } c.rect(x + 4, y + 4, x + 9, y + 5, v); },                                    // wheat
    (c, x, y, v) => { c.tri(x + 3, y + 1, x + 9, y + 1, x + 6, y + 11, v); c.rect(x + 4, y + 1, x + 8, y + 10, v); c.rect(x + 3, y + 11, x + 9, y + 12, v); c.line(x + 9, y + 11, x + 12, y + 13, v); },                  // lighthouse
    (c, x, y, v) => { c.rect(x + 1, y + 3, x + 6, y + 11, v); c.rect(x + 7, y + 3, x + 12, y + 11, v); c.rect(x + 6, y + 2, x + 7, y + 11, v); },                                                                           // book
    (c, x, y, v) => { c.disc(x + 4, y + 4, 2.6, v, (a, b, d) => d > 1.2); c.disc(x + 9, y + 4, 2.6, v, (a, b, d) => d > 1.2); c.rect(x + 1, y + 7, x + 12, y + 11, v); c.rect(x + 10, y + 11, x + 11, y + 13, v); },   // locomotive
  ];
  CIV.reliefPanel = (seed) => { const c = CIV.canvas(38, 70), B = K.bronze, L = K.brass;
    c.rect(0, 0, 38, 70, K.bronzeD);
    for (let r = 0; r < 4; r++) for (let q = 0; q < 2; q++) { const x = 3 + q * 18, y = 4 + r * 16; c.rect(x - 1, y - 1, x + 15, y + 15, L); c.rect(x, y, x + 14, y + 14, B); MOTIF[(r * 2 + q + seed) % 8](c, x + 1, y, L); }
    return c.model(K.gold, K.bronzeD); };
  CIV.seal = () => { const n = 44, c = CIV.canvas(n, n), o = n / 2, P = PNT;
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const d = Math.hypot(x + 0.5 - o, y + 0.5 - o), a = Math.atan2(y + 0.5 - o, x + 0.5 - o);
      if (d >= o) continue; let v;
      if (d > o - 1.2) v = K.gold; else if (d > o - 5) v = (Math.floor((a + Math.PI) / (Math.PI * 2) * 36) % 3 === 0 && d > o - 3.8 && d < o - 2.2) ? K.gold : K.navy; else if (d > o - 6) v = K.gold;
      else { v = y < o - 3 ? (((x + (y >> 1)) % 5) ? P.sea : P.seaD) : y < o + 7 ? P.peach : P.sky; if (y >= o - 3 && Math.hypot(x + 0.5 - o, y + 0.5 - (o - 2)) < 6.5 && y > o - 3) v = P.sun; }
      c.px(x, y, v); }
    c.rect(13, 16, 31, 19, K.red); c.tri(11, 19, 33, 19, 13, 16, K.red); c.rect(21, 19, 22, 31, P.brown); c.tri(22, 20, 22, 30, 29, 20, P.white); c.tri(21, 21, 21, 29, 15, 21, P.white); c.rect(21, 31, 24, 32, K.red);
    for (let k = 0; k < 5; k++) c.px(o - 4 + k * 2, 36, K.gold);
    return c.model(K.gold, K.gold); };
  AF.onBuild('civic-r2-hall', 307, () => {
    const { cx, rz, G, CEIL, ROOF } = CH, rotR = CH.rotR;
    // candelabra at the foot of the grand steps + portico ends
    for (const ox of [-16.5, 16.5]) AF.addLight({ x: cx + ox, y: 7, z: -89.5, color: 0xffe2b0, intensity: 1.1, range: 14, kind: 'street' });
    // bronze relief panels (blind doors) flanking the three doors + a polychrome seal above the centre door
    for (const [ox, sd] of [[-7.75, 0], [7.75, 3]]) { const g = AF.meshModel(CIV.reliefPanel(sd), { vs: 1 / 16, anchor: [0.5, 0, 0] }); AF.placeStatic(g, cx + ox, G + 0.25, -95.99, 0, { collide: false }); F(cx + ox - 1.5, G, -95.99, cx + ox + 1.5, G + 0.25, -95.5, K.granite); }
    AF.placeStatic(AF.meshModel(CIV.seal(), { vs: 1 / 12, anchor: [0.5, 0, 0] }), cx, 8.95, -95.98, 0, { collide: false });
    // rotunda murals: eight 5 x 6 m WPA panels on the upper drum wall between the pilasters, titles beneath
    for (let i = 0; i < 8; i++) {
      const a = -Math.PI + i * Math.PI / 4 + Math.PI / 32 + Math.PI / 8, rr = rotR - 0.27, x = cx + Math.cos(a) * rr, z = rz + Math.sin(a) * rr;
      const g = AF.meshModel(CIV.mural(i).model(K.gold, K.bronzeD), { vs: 1 / 8, anchor: [0.5, 0, 0] });
      g.rotateY(Math.atan2(-Math.cos(a), -Math.sin(a))); AF.placeStatic(g, x, CEIL + 1.6, z, 0, { collide: false });
      const tm = AF.textModel(CIV.MURALS[i], K.gold, { pad: 0 }), tg = AF.meshModel(tm, { vs: 1 / 22, anchor: [0.5, 0, 0] }); tg.rotateY(Math.atan2(-Math.cos(a), -Math.sin(a)));
      AF.placeStatic(tg, x - Math.cos(a) * 0.05, CEIL + 0.9, z - Math.sin(a) * 0.05, 0, { collide: false });
    }
    CIV.ring(cx, rz, CEIL + 0.6, CEIL + 0.85, rotR, rotR - 0.25, K.goldN);             // gilt string course under the murals
    for (const [dx, dz] of [[6, 0], [-6, 0], [0, 6], [0, -6]]) CIV.light(cx + dx, CEIL + 3, rz + dz, 0.9, 12, 0xffe2b8);
    // council chamber story: a citizen at the public lectern addressing the dais, a press table with two reporters
    put('lectern', -57.4, G, -115, 3, false); AF.addCollider(-58.1, G, -115.6, -56.8, G + 2.3, -114.4);
    AF.addSpot({ building: 'cityhall', x: -56.6, y: G, z: -115, yaw: -Math.PI / 2, kind: 'stand', role: 'speaker', path: [[-41, -97.5], [-41, -104.5], [-50, -101], [-56.6, -113.2], [-56.6, -115]] });
    put('desk', -55.2, G, -127.6, 0); put('typewriter', -55.9, G + 0.75, -127.6, 0, false); put('typewriter', -54.5, G + 0.75, -127.4, 0, false);
    for (const x of [-56, -54.4]) { put('chair', x, G, -126.7, 2); AF.addSpot({ building: 'cityhall', x, y: G + 0.5, z: -126.7, yaw: Math.PI, kind: 'sit', role: 'reporter' }); }
    CIV.textProp('PRESS', K.gold, -55.2, G + 0.45, -127.18, 0, 1 / 40);
    // the wedding photograph on the steps: a tiered group facing the photographer, rice on the treads
    const sp = (x, y, z, yaw, kind, extra) => AF.addSpot(Object.assign({ building: null, x, y, z, yaw, kind }, extra || {}));
    for (let i = 0; i < 5; i++) { const x = cx - 11.2 + i * 1.05; sp(x, 1.0, -89.5, 0, 'stand', { path: [[x, -84], [x, -89.5]], role: 'wedding' }); }
    for (let i = 0; i < 4; i++) { const x = cx - 10.7 + i * 1.05; sp(x, 1.25, -90.3, 0, 'stand', { path: [[x, -84], [x, -90.3]], role: 'wedding' }); }
    put('tripod', cx - 8.7, 0.25, -85.9, 0, false); sp(cx - 8.7, 0.25, -85.1, Math.PI, 'work', { role: 'photographer' });
    { const m = M(40, 1, 22); for (let k = 0; k < 90; k++) { const x = (AF.hash2(k, 3) * 40) | 0, z = (AF.hash2(k, 7) * 22) | 0; m.set(x, 0, z, [K.white, K.paper, K.flowerP, K.flowerY][k % 4]); } AF.placeStatic(AF.meshModel(m, { vs: 1 / 16, anchor: [0.5, 0, 0.5] }), cx - 8.6, 0.26, -87.2, 0, { collide: false }); }
  });
  AF.test('civic: round-2 hall (murals, seal, candelabra)', () => ({ ok: CIV.MURALS.length === 8 && typeof CIV.seal === 'function' && !!CIV._defs.candelabra, info: 'murals ' + CIV.MURALS.length }));
}

} catch (e) { AF.partError('30-civic.js', e); }

