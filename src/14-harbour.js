// ================================================================ 14-harbour.js
try {
// ===== 14-harbour: the west + centre waterfront — THE BOARDWALK (carousel, taffy + hot dogs, penny arcade, photo booth),
//       the PLEASURE PIER (Ferris wheel, shooting gallery, fishing spots), the FISH MARKET + Fish Pier (3 bobbing boats),
//       HARBOUR SQUARE (harbourmaster + clock tower, ferry kiosk, anchor monument, signal flags) + the Ferry Pier + the ferry
//       (OWNER: land-harbour) =====
{
  const P = AF.PLAN, W = AF.W;
  const L = AF.land = AF.land || {};
  const HB = P.harbour, COAST = HB.coastZ, SEA_Y = HB.waterY;
  const hash = AF.hash2, clamp = AF.clamp;
  const PIER = {}; for (const p of HB.piers) PIER[p.id] = p;
  const TAU = Math.PI * 2;
  const HR = AF.harbour = AF.harbour || { ships: [], ferry: null, tug: null, lighthouse: { x: HB.lighthouse.x, y: 26, z: HB.lighthouse.z }, boats: [] };
  const LIB = AF.hbLib = AF.hbLib || {};
  const dyn = L.hbDyn = L.hbDyn || [];         // {update(dt,t,camDist2)} animated things

  // ------------------------------------------------------------ shared helpers (15-harbour-2 reuses them through AF.hbLib)
  const F = (x0, y0, z0, x1, y1, z1, c) => W.fill(x0, y0, z0, x1, y1, z1, c);
  const geo = (m, vs = 1 / 8, anchor = [0.5, 0, 0.5]) => AF.meshModel(m, { vs, anchor });
  const put = (g, x, y, z, rot = 0, collide = false) => AF.placeStatic(g, x, y, z, rot, { collide });
  LIB.F = F; LIB.geo = geo; LIB.put = put;
  // soft puff texture for smoke / wake
  LIB.softTex = () => {
    if (LIB._soft) return LIB._soft;
    const cv = document.createElement('canvas'); cv.width = cv.height = 64;
    const g2 = cv.getContext('2d'), gr = g2.createRadialGradient(32, 32, 2, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g2.fillStyle = gr; g2.fillRect(0, 0, 64, 64);
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return (LIB._soft = t);
  };
  // a smoke plume: N sprites that rise from a moving (or fixed) emitter; returns {update(dt,t,x,y,z,k)}
  LIB.smoke = (n = 7, col = 0xe8e4dc, size = 2.2, rise = 5) => {
    const mat = new THREE.SpriteMaterial({ map: LIB.softTex(), color: col, transparent: true, depthWrite: false, opacity: 0.4, fog: true });
    const sp = []; for (let i = 0; i < n; i++) { const s = new THREE.Sprite(mat.clone()); s.renderOrder = 5; AF.scene.add(s); sp.push(s); }
    return { sp, update(dt, t, x, y, z, k = 1) {
      for (let i = 0; i < n; i++) {
        const u = ((t * 0.18 + i / n) % 1), s = sp[i];
        s.position.set(x + u * 2.5 + Math.sin(t * 0.7 + i) * 0.3 * u, y + u * rise, z + u * 1.2);
        const sc = size * (0.5 + u * 1.6); s.scale.set(sc, sc, 1); s.material.opacity = 0.42 * Math.sin(u * Math.PI) * k;
        s.visible = k > 0.01;
      }
    } };
  };
  // a planked pier on pilings: deck top y 0.25, from the quay (z COAST) south to z1
  LIB.pier = (x0, x1, z1, o = {}) => {
    const z0 = o.z0 ?? COAST - 0.25;
    const dk = o.deck || [AF.col(0x9c7a52, { jitter: 0.6, edge: 0.8 }), AF.col(0x8a6a46, { jitter: 0.6, edge: 0.8 }), AF.col(0xa8865c, { jitter: 0.6, edge: 0.8 })];
    const pile = o.pile || AF.col(0x5a4634, { jitter: 0.5, edge: 0.7 }), wet = AF.col(0x3a3a30, { jitter: 0.5, edge: 0.6 });
    const rail = o.rail || AF.col(0xf2ece0, { jitter: 0.15, edge: 0.6 });
    for (let z = z0; z < z1; z += 0.25) {
      const row = Math.floor((z - z0) * 4);
      F(x0, 0, z, x1, 0.25, z + 0.25, dk[(hash(row, x0 | 0) * dk.length) | 0]);
    }
    F(x0, -0.5, z0, x0 + 0.5, 0, z1, pile); F(x1 - 0.5, -0.5, z0, x1, 0, z1, pile);
    for (let z = z0 + 2; z < z1; z += 3) for (let x = x0; x < x1; x += Math.max(2.5, (x1 - x0 - 0.5) / Math.max(1, Math.round((x1 - x0) / 5)))) {
      const px = Math.min(x, x1 - 0.5);
      F(px, -4, z, px + 0.5, -1.5, z + 0.5, wet); F(px, -1.5, z, px + 0.5, 0, z + 0.5, pile);
      F(px - 0.25, -0.75, z, px + 0.75, -0.5, z + 0.5, pile);
    }
    if (o.rails !== false) {
      const gaps = o.gaps || [];
      const inGap = (s, side) => gaps.some((g) => g[0] === side && s >= g[1] && s < g[2]);
      for (let z = z0 + 0.5; z < z1; z += 0.25) {
        for (const [xa, side] of [[x0, 'w'], [x1 - 0.25, 'e']]) {
          if (inGap(z, side)) continue;
          if (Math.round((z - z0) * 4) % 8 === 0) F(xa, 0.25, z, xa + 0.25, 1.25, z + 0.25, rail);
          F(xa, 1.0, z, xa + 0.25, 1.25, z + 0.25, rail); F(xa, 0.5, z, xa + 0.25, 0.625, z + 0.25, rail);
        }
      }
      for (let x = x0; x < x1; x += 0.25) { if (inGap(x, 's')) continue; if (Math.round((x - x0) * 4) % 8 === 0) F(x, 0.25, z1 - 0.25, x + 0.25, 1.25, z1); F(x, 1.0, z1 - 0.25, x + 0.25, 1.25, z1, rail); }
    }
  };
  // globe street lamp (vs 1/16): black post, cream globe that glows at night
  LIB.lampGeo = () => {
    if (LIB._lamp) return LIB._lamp;
    const m = new AF.Model(9, 72, 9), post = AF.col(0x2a2c2e, { jitter: 0.2, edge: 0.5 }), brass = AF.col(0xb08a3a, { jitter: 0.2, edge: 0.5 });
    const glob = AF.col(0xfff0d0, { emit: 0xffd890, emitK: 2.4, mode: 'night' });
    m.box(2, 0, 2, 7, 4, 7, post); m.box(3, 4, 3, 6, 56, 6, post); m.box(2, 20, 2, 7, 22, 7, brass); m.box(2, 56, 2, 7, 58, 7, brass);
    m.sphere(4.5, 63.5, 4.5, 4.5, glob); m.box(3, 69, 3, 6, 72, 6, post);
    return (LIB._lamp = geo(m, 1 / 16));
  };
  LIB.lamp = (x, y, z) => { put(LIB.lampGeo(), x, y, z, 0, true); AF.addLight({ x, y: y + 4, z, color: 0xffd08a, intensity: 1.1, range: 11, kind: 'street' }); };
  // bench facing +z (vs 1/8)
  LIB.benchGeo = () => {
    if (LIB._bench) return LIB._bench;
    const m = new AF.Model(14, 8, 5), wood = AF.col(0x7a5a3a, { jitter: 0.5, edge: 0.7 }), iron = AF.col(0x2e3032, { jitter: 0.2, edge: 0.5 });
    m.box(0, 3, 1, 14, 4, 5, wood); m.box(0, 5, 0, 14, 6, 1, wood); m.box(0, 7, 0, 14, 8, 1, wood);
    for (const x of [1, 12]) { m.box(x, 0, 1, x + 1, 3, 2, iron); m.box(x, 0, 4, x + 1, 3, 5, iron); m.box(x, 3, 0, x + 1, 8, 1, iron); }
    return (LIB._bench = geo(m, 1 / 8));
  };
  LIB.bench = (x, y, z, rot, building) => {
    put(LIB.benchGeo(), x, y, z, rot, true);
    const yaw = [0, Math.PI / 2, Math.PI, -Math.PI / 2][rot & 3];
    AF.addSpot({ building: building || null, x: x + Math.sin(yaw) * 0.1, y: y + 0.45, z: z + Math.cos(yaw) * 0.1, yaw, kind: 'bench' });
  };
  // bollard (vs 1/16)
  LIB.bollardGeo = () => {
    if (LIB._boll) return LIB._boll;
    const m = new AF.Model(8, 10, 8), iron = AF.col(0x2e3236, { jitter: 0.3, edge: 0.6 }), rope = AF.col(0xc8b48a, { jitter: 0.4, edge: 0.4 });
    m.box(1, 0, 1, 7, 7, 7, iron); m.box(0, 7, 0, 8, 9, 8, iron); m.box(2, 3, 0, 6, 5, 1, rope);
    return (LIB._boll = geo(m, 1 / 16));
  };
  // text sign helper: textModel meshed at vs 1/16 (letters 0.44 m) with an optional frame
  LIB.sign = (text, fg, bg, vs = 1 / 16, o = {}) => {
    const tm = AF.textModel(text, fg, Object.assign({ bg, pad: 2, depth: 1 }, o));
    return geo(tm, vs, [0.5, 0, 0]);
  };
  // stamp letters onto a WORLD wall (letters 1.75 m): face: 's' (+z), 'n' (-z), 'e' (+x), 'w' (-x); (x,y,z) = left end on the wall face
  LIB.wallText = (text, fg, x, y, z, face, o = {}) => {
    const tm = AF.textModel(text, fg, Object.assign({ pad: 0, depth: 1 }, o));
    const rot = face === 's' ? 0 : face === 'n' ? 2 : face === 'e' ? 1 : 3;
    if (face === 's') W.stamp(tm, x, y, z, 0);
    else if (face === 'n') W.stamp(tm, x - tm.w * 0.25, y, z - tm.d * 0.25, 2);
    else if (face === 'e') W.stamp(tm, x, y, z - tm.w * 0.25, 1);
    else W.stamp(tm, x - tm.d * 0.25, y, z, 3);
    return tm.w * 0.25;
  };

  // ------------------------------------------------------------ the build
  AF.onBuild('harbour-west', 300, () => {
    const t0 = performance.now();
    const c = (hex, o = {}) => AF.col(hex, Object.assign({ jitter: 0.4, edge: 0.7 }, o));
    const C = {
      plank: c(0xb08a5a, { jitter: 0.6 }), plankD: c(0x94724a, { jitter: 0.6 }), plankL: c(0xc29a68, { jitter: 0.6 }),
      cream: c(0xf3ead6, { jitter: 0.2 }), red: c(0xc0342e), white: c(0xf6f2ea, { jitter: 0.15 }), gold: c(0xd8a83a, { jitter: 0.3 }), brass: c(0xb8903e, { jitter: 0.3 }),
      navy: c(0x1f3552), teal: c(0x2f8a86), pink: c(0xf0a0b8), mint: c(0x9ad8c0), iron: c(0x2c2f33, { jitter: 0.2 }), black: c(0x1c1c20, { jitter: 0.1 }),
      brick: c(0x9a4a36, { jitter: 0.8, edge: 0.9 }), brickD: c(0x7e3a2a, { jitter: 0.8, edge: 0.9 }), brickL: c(0xae5a40, { jitter: 0.8, edge: 0.9 }),
      steel: c(0x4a6a6a, { jitter: 0.3 }), steelL: c(0x6a8a88, { jitter: 0.3 }), stone: c(0xb4ac9a, { jitter: 0.5, edge: 0.9 }), stoneD: c(0x8e877a, { jitter: 0.5, edge: 0.9 }),
      tileA: c(0xece4d0, { jitter: 0.2, edge: 0.3 }), tileB: c(0x2e4a5a, { jitter: 0.2, edge: 0.3 }), setts: c(0x8a8478, { jitter: 1 }), settsL: c(0xa29a8a, { jitter: 1 }), settsD: c(0x6e6a60, { jitter: 1 }),
      glass: AF.col('glass'), win: AF.col('window'),
      bulb: AF.col(0xfff2c0, { emit: 0xffe0a0, emitK: 3.2, mode: 'night' }), bulbA: AF.col(0xfff2c0, { emit: 0xffd890, emitK: 2.6, mode: 'always' }),
      lampA: AF.col(0xfff0c8, { emit: 0xffd48a, emitK: 2.6, mode: 'always' }), neonP: AF.col(0xff7ab8, { emit: 0xff4aa0, emitK: 3, mode: 'night' }), neonB: AF.col(0x8ad8ff, { emit: 0x40b8ff, emitK: 3, mode: 'night' }),
      screen: AF.col(0x9af0c0, { emit: 0x60e0a0, emitK: 2.2, mode: 'always' }), screen2: AF.col(0xffc070, { emit: 0xffa040, emitK: 2.2, mode: 'always' }),
      ice: c(0xe4f2f6, { jitter: 0.4, edge: 0.3 }), chalk: c(0x2a3430, { jitter: 0.2 }), chalkW: c(0xe8e8e0, { jitter: 0.1 }),
      wood: c(0x7a5a3a, { jitter: 0.5 }), woodD: c(0x5a4230, { jitter: 0.5 }), rope: c(0xc8b48a, { jitter: 0.4 }), net: c(0x6a7a5a, { jitter: 0.6, solid: false }), netB: c(0x8a6a4a, { jitter: 0.6, solid: false }),
    };
    L.hbC = C;
    const paint = (x0, z0, x1, z1, fn) => W.eachCol(x0, z0, x1, z1, (bx, bz, i, x, z) => { const cc = fn(x, z, bx, bz); if (cc) W.C[i] = cc; });

    // =============================================================== 1. THE BOARDWALK (x -292..-150)
    const BWX0 = -292, BWX1 = -150;
    { // v2 r2: herringbone (chevron) boardwalk in two close tones + the odd replaced board, planked on top
      const hbA = c(0xb48c5c, { jitter: 0.25, edge: 0.5, patTop: 'plank' }), hbB = c(0x9e784c, { jitter: 0.25, edge: 0.5, patTop: 'plank' }), hbN = c(0xc4a070, { jitter: 0.25, edge: 0.5, patTop: 'plank' });
      paint(BWX0, 173.5, BWX1, COAST, (x, z, bx, bz) => { const j = bz & 7, tri = j < 4 ? j : 7 - j, band = ((bx + tri) >> 2); if (hash(band, bz >> 3) < 0.04) return hbN; return (band & 1) ? hbA : hbB; });
    }
    // sea railing along the quay edge (gap for the Pleasure Pier)
    const PP = PIER.pleasure;
    for (let x = BWX0; x < BWX1; x += 0.25) {
      if (x >= PP.x0 && x < PP.x1) continue;
      const k = Math.round((x - BWX0) * 4);
      if (k % 8 === 0) F(x, 0.25, COAST - 0.5, x + 0.25, 1.25, COAST - 0.25, C.white);
      F(x, 1.0, COAST - 0.5, x + 0.25, 1.25, COAST - 0.25, C.white); F(x, 0.5, COAST - 0.5, x + 0.25, 0.625, COAST - 0.25, C.white);
    }
    for (let x = BWX0 + 4; x < BWX1; x += 12) { if (x > PP.x0 - 2 && x < PP.x1 + 2) continue; LIB.lamp(x, 0.25, COAST - 1.2); }
    for (let x = BWX0 + 10; x < BWX1; x += 16) { if (x > PP.x0 - 4 && x < PP.x1 + 4) continue; if (x > -212 && x < -178) continue; LIB.bench(x, 0.25, COAST - 2.2, 0); }

    // ---- CAROUSEL pavilion (centre -195, 190)
    const CX = -195, CZ = 190, CR = 8;
    {
      // round base + step
      for (let x = CX - CR - 1; x < CX + CR + 1; x += 0.25) for (let z = CZ - CR - 1; z < CZ + CR + 1; z += 0.25) {
        const d = Math.hypot(x + 0.125 - CX, z + 0.125 - CZ);
        if (d < CR + 0.75) F(x, 0.25, z, x + 0.25, 0.5, z + 0.25, d > CR ? C.stoneD : C.stone);
      }
      // 12 outer posts (brass-gilt) + central mirrored column
      for (let i = 0; i < 12; i++) { const a = i / 12 * TAU, px = CX + Math.cos(a) * (CR - 0.1), pz = CZ + Math.sin(a) * (CR - 0.1); F(px - 0.125, 0.5, pz - 0.125, px + 0.125, 5.0, pz + 0.125, C.gold); }
      const mirror = AF.col(0xdfe8ee, { emit: 0xfff0d0, emitK: 0.6, mode: 'always', jitter: 0.5, edge: 0.4 });
      for (let y = 0.5; y < 5.5; y += 0.25) for (let x = CX - 1.25; x < CX + 1.25; x += 0.25) for (let z = CZ - 1.25; z < CZ + 1.25; z += 0.25) {
        const d = Math.hypot(x + 0.125 - CX, z + 0.125 - CZ); if (d > 1.25) continue;
        const band = Math.floor(y * 2) % 4 === 0;
        W.setM(x, y, z, d > 0.9 ? (band ? C.gold : mirror) : C.cream);
      }
      // striped conical roof with a scalloped valance of bulbs + a flag on top (Model, vs 1/4)
      const RR = 38, RH = 20, m = new AF.Model(RR * 2 + 2, RH + 8, RR * 2 + 2);
      for (let x = 0; x < m.w; x++) for (let z = 0; z < m.d; z++) {
        const dx = x + 0.5 - (RR + 1), dz = z + 0.5 - (RR + 1), d = Math.hypot(dx, dz); if (d > RR) continue;
        const a = Math.atan2(dz, dx), stripe = Math.floor((a + Math.PI) / TAU * 24) % 2;
        const top = Math.round((1 - d / RR) * RH) + 2;
        for (let y = Math.max(0, top - 2); y < top; y++) m.set(x, y, z, stripe ? C.red : C.cream);
        if (d > RR - 2.2) { const sc = Math.floor((a + Math.PI) / TAU * 48); m.set(x, 1, z, C.gold); m.set(x, 0, z, (sc % 2) ? C.bulb : C.gold); }
      }
      m.box(RR - 1, RH + 2, RR - 1, RR + 3, RH + 5, RR + 3, C.gold); m.box(RR, RH + 5, RR, RR + 2, RH + 8, RR + 2, C.gold);
      put(geo(m, 0.25, [0.5, 0, 0.5]), CX, 5.0, CZ, 0, false);
      AF.addLight({ x: CX, y: 4.2, z: CZ, color: 0xffd890, intensity: 1.6, range: 14, kind: 'sign' });
      // rotating platform + 24 horses (2 rings) on brass poles
      const grp = new THREE.Group(); grp.position.set(CX, 0.5, CZ); AF.scene.add(grp);
      const pm = new AF.Model(60, 2, 60), boards = [c(0xb8905e), c(0xa07a4c)];
      for (let x = 0; x < 60; x++) for (let z = 0; z < 60; z++) { const d = Math.hypot(x + 0.5 - 30, z + 0.5 - 30); if (d < 29.5 && d > 9) { pm.set(x, 0, z, boards[(Math.floor(d / 3)) % 2]); if (d > 28.5) pm.set(x, 1, z, C.gold); } }
      const plat = AF.modelMesh(pm, { vs: 1 / 4, anchor: [0.5, 0, 0.5] }); plat.castShadow = false; grp.add(plat);
      const horseGeo = (body, mane, saddle) => {
        const h = new AF.Model(26, 22, 7);
        h.box(6, 8, 1, 18, 14, 6, body); h.box(5, 9, 2, 6, 13, 5, body);
        h.line(17, 12, 3.5, 20, 17, 3.5, body, 1.6); h.box(19, 16, 2, 25, 20, 5, body); h.box(23, 15, 2, 26, 17, 5, body);
        h.line(16, 18, 3.5, 19, 13, 3.5, mane, 0.9); h.box(18, 18, 2, 21, 21, 5, mane); h.box(21, 20, 2, 22, 22, 3, body); h.box(21, 20, 4, 22, 22, 5, body);
        h.line(16, 8, 2, 21, 3, 2, body, 0.8); h.line(16, 8, 5, 20, 2, 5, body, 0.8); h.line(8, 8, 2, 4, 3, 2, body, 0.8); h.line(8, 8, 5, 5, 1, 5, body, 0.8);
        h.line(6, 13, 3.5, 1, 7, 3.5, mane, 1.0);
        h.box(10, 14, 1, 15, 15, 6, saddle); h.box(11, 8, 0, 14, 14, 1, saddle); h.box(11, 8, 6, 14, 14, 7, saddle);
        h.box(20, 17, 1, 23, 18, 6, C.gold); h.box(24, 16, 2, 25, 17, 5, C.black);
        h.box(12, 0, 3, 13, 22, 4, C.brass);   // pole through the saddle
        return AF.meshModel(h, { vs: 1 / 16, anchor: [0.5, 0, 0.5] });
      };
      const HG = [horseGeo(C.white, C.gold, C.red), horseGeo(c(0x2a2420), C.cream, C.teal), horseGeo(c(0xc8a070), c(0x5a3a2a), C.navy), horseGeo(c(0xe8dcc8), c(0x8a2a2a), C.gold)];
      const horses = [];
      for (let ring = 0; ring < 2; ring++) for (let i = 0; i < 12; i++) {
        const a = (i + ring * 0.5) / 12 * TAU, r = ring ? 4.4 : 6.5;
        const hm = AF.modelMesh(HG[(i + ring * 2) % 4]); hm.castShadow = false;
        const pole = new THREE.Object3D(); pole.position.set(Math.cos(a) * r, 0.25, Math.sin(a) * r); pole.rotation.y = -a;
        hm.position.y = 0.6; pole.add(hm); grp.add(pole);
        const rod = AF.modelMesh(LIB._rod || (LIB._rod = AF.meshModel(new AF.Model(1, 72, 1).box(0, 0, 0, 1, 72, 1, C.brass), { vs: 1 / 16, anchor: [0.5, 0, 0.5] }))); rod.castShadow = false; pole.add(rod);
        horses.push({ m: hm, ph: i * 0.9 + ring * 0.45 });
      }
      L.carousel = { grp, horses };
      dyn.push({ x: CX, z: CZ, r: 170, update(dt, t) { grp.rotation.y -= dt * 0.55; for (const h of horses) h.m.position.y = 0.55 + Math.sin(t * 2.2 + h.ph) * 0.28; } });
      // sign
      const sg = LIB.sign('CAROUSEL', C.gold, C.red, 1 / 12); put(sg, CX, 5.6, CZ + CR + 0.6, 0, false);
      AF.addSpot({ building: null, x: CX + 3, y: 0.5, z: CZ + CR + 2.4, yaw: Math.PI, kind: 'stand' });
      AF.addSpot({ building: null, x: CX - 3, y: 0.5, z: CZ + CR + 2.6, yaw: Math.PI, kind: 'stand' });
      AF.addLabel('Carousel', CX, CZ, 'building');
    }

    // ---- stands: saltwater taffy kiosk, hot dog cart, photo booth (vs 1/8 models)
    const kiosk = (w, d, wall, stripeA, stripeB, text, textFg, textBg) => {
      const m = new AF.Model(w, 30, d);
      m.box(0, 0, 0, w, 8, d, wall); m.box(1, 8, 1, w - 1, 9, d - 1, C.cream);                 // counter
      m.box(0, 8, 0, 1, 20, 1, wall); m.box(w - 1, 8, 0, w, 20, 1, wall); m.box(0, 8, d - 1, 1, 20, d, wall); m.box(w - 1, 8, d - 1, w, 20, d, wall);
      m.box(0, 8, d - 1, w, 20, d, wall);                                                       // back wall
      for (let y = 20; y < 26; y++) { const ins = y - 20; for (let x = -1 + ins; x < w + 1 - ins; x++) for (let z = -2 + ins; z < d + 1 - ins; z++) m.set(x, y, z, (Math.floor((x + 1) / 2) % 2) ? stripeA : stripeB); }
      for (let x = 0; x < w; x++) m.set(x, 19, 0, (x % 2) ? stripeA : C.bulb);
      for (let x = -1; x < w + 1; x += 2) m.set(x, 20, -2, C.bulb);
      // jars / goods on the counter
      for (let x = 2; x < w - 2; x += 2) { m.box(x, 9, 2, x + 1, 11, 3, (x % 4) ? C.pink : C.mint); }
      const tm = AF.textModel(text, textFg, { bg: textBg, pad: 1, depth: 1 });
      for (let x = 0; x < tm.w && x < w; x++) for (let y = 0; y < tm.h; y++) { const v = tm.get(x, y, 1) || tm.get(x, y, 0); if (v) m.set(x + Math.max(0, ((w - tm.w) >> 1)), 26 + y - 9 + 9, 1, v); }
      return geo(m, 1 / 8);
    };
    put(kiosk(24, 14, C.white, C.pink, C.white, 'TAFFY', C.red, C.white), -176, 0.25, 182, 0, true);
    AF.addSpot({ building: null, x: -176, y: 0.25, z: 181.4, yaw: 0, kind: 'counter' });
    put(kiosk(20, 12, C.red, C.gold, C.red, 'HOT DOGS', C.gold, C.red), -162, 0.25, 182, 0, true);
    AF.addSpot({ building: null, x: -162, y: 0.25, z: 181.6, yaw: 0, kind: 'counter' });
    for (const qx of [-176, -162, -214, -238]) for (let i = 0; i < 4; i++) AF.addSpot({ building: null, x: qx + (i % 2) * 0.3 - 0.15, y: 0.25, z: 179.9 - i * 0.85, yaw: 0, kind: 'stand' });
    { // photo booth
      const m = new AF.Model(12, 20, 10);
      m.box(0, 0, 0, 12, 18, 10, C.navy); m.box(1, 2, 9, 7, 16, 10, 0); m.box(1, 3, 10 - 1, 7, 16, 10, c(0xa82a3a, { solid: false }));
      m.box(0, 18, 0, 12, 20, 10, C.gold); m.box(8, 8, 9, 11, 14, 10, C.bulbA);
      const tm = AF.textModel('PHOTOS', C.gold, { pad: 0 }); for (let x = 0; x < tm.w; x++) for (let y = 0; y < tm.h; y++) if (tm.get(x, y, 0)) m.set(x - 11 + 12, 16 + y - 7 + 7 - 7 + 3, 10 - 1, tm.get(x, y, 0));
      put(geo(m, 1 / 8), -152.5, 0.25, 186, 3, true);
    }

    // ---- more stalls along the promenade: ice cream, corn dogs, fortune teller, a high striker, bunting between the lamps
    put(kiosk(18, 12, C.mint, C.white, C.mint, 'ICE CREAM', C.navy, C.white), -214, 0.25, 181, 0, true);
    AF.addSpot({ building: null, x: -214, y: 0.25, z: 180.6, yaw: 0, kind: 'counter' });
    put(kiosk(18, 12, C.gold, C.red, C.gold, 'CORN DOGS', C.red, C.cream), -238, 0.25, 181, 0, true);
    AF.addSpot({ building: null, x: -238, y: 0.25, z: 180.6, yaw: 0, kind: 'counter' });
    put(kiosk(16, 12, c(0x5a2a6a), c(0x8a4aa0), C.gold, 'FORTUNES', C.gold, c(0x3a1a4a)), -245, 0.25, 201, 2, true);
    { // high striker: tall post with a bell, a puck that slides up and down, the mallet stand
      const hx = -226, hz = 199;
      F(hx - 0.25, 0.25, hz - 0.75, hx + 0.25, 7.0, hz - 0.25, C.red); F(hx - 0.5, 0.25, hz - 1.0, hx + 0.5, 0.75, hz, C.woodD);
      for (let y = 1; y < 7; y += 0.5) F(hx - 0.375, y, hz - 0.25, hx + 0.375, y + 0.125, hz - 0.125, C.white);
      F(hx - 0.5, 7.0, hz - 0.875, hx + 0.5, 7.5, hz - 0.125, C.gold); F(hx - 0.75, 0.25, hz + 0.25, hx + 0.75, 0.75, hz + 1.25, C.woodD);
      const puck = AF.modelMesh(AF.meshModel(new AF.Model(4, 2, 2).box(0, 0, 0, 4, 2, 2, C.gold), { vs: 1 / 8, anchor: [0.5, 0, 0.5] })); puck.position.set(hx, 1, hz - 0.05); AF.scene.add(puck);
      dyn.push({ x: hx, z: hz, r: 90, update(dt, t) { const k = (t * 0.35) % 1; puck.position.y = 1 + 5.9 * (k < 0.25 ? Math.sin(k / 0.25 * Math.PI / 2) : k < 0.5 ? Math.cos((k - 0.25) / 0.25 * Math.PI / 2) : 0); } });
      AF.addSpot({ building: null, x: hx, y: 0.25, z: hz + 1.8, yaw: Math.PI, kind: 'play' });
    }
    { // bunting: pennant strings between promenade lamps (static, colourful)
      const cols = [C.red, C.white, C.navy, C.gold, C.teal].map((h) => h);
      for (let x = BWX0 + 4; x < BWX1 - 12; x += 12) {
        if (x > PP.x0 - 14 && x < PP.x1 + 2) continue;
        for (let k = 0; k < 48; k++) { const u = k / 48, px = x + u * 12, py = 4.4 - Math.sin(u * Math.PI) * 0.9, pz = COAST - 1.2; W.setM(px, py, pz, (k % 4 === 2) ? C.bulb : C.iron); if (k % 3 === 1) { W.setM(px, py - 0.25, pz, cols[(k / 3 | 0) % cols.length]); if (k % 6 === 1) W.setM(px, py - 0.5, pz, cols[(k / 3 | 0) % cols.length]); } }
      }
    }
    { // v2 r2: festoon poles down the middle of the boardwalk: bulb strings + pennants sagging across to the sea lamps,
      // striped deck chairs facing the sea, sea-watchers at the rail, two stands boarded up "CLOSED FOR THE SEASON"
      const bulbPts = [], bulbSeq = [];
      let pi = 0;
      for (let x = BWX0 + 4; x < BWX1 - 4; x += 12, pi++) {
        if (x > PP.x0 - 4 && x < PP.x1 + 4) continue; if (x > -212 && x < -178) continue;
        const pz = 188.5;
        F(x - 0.125, 0.25, pz - 0.125, x + 0.125, 5.5, pz + 0.125, C.iron); F(x - 0.25, 0.25, pz - 0.25, x + 0.25, 0.75, pz + 0.25, C.iron);
        F(x - 0.25, 5.5, pz - 0.25, x + 0.25, 5.75, pz + 0.25, C.gold); W.setM(x, 5.75, pz, C.gold);
        if (AF.makeFlag) AF.makeFlag({ x, y: 7.2, z: pz, w: 1.3, h: 0.7, design: 'pennant', colors: [[0xc0342e, 0x1f3552, 0x2f8a86, 0xd8a83a][pi % 4]] });
        F(x - 0.0625, 5.75, pz - 0.0625, x + 0.0625, 7.25, pz + 0.0625, C.white);
        for (const tx of [x, x + 12]) {
          if (tx > PP.x0 - 2 && tx < PP.x1 + 2) continue;
          const a = [x, 5.3, pz], b = [tx, 4.3, COAST - 1.2];
          if (AF.makeBunting && tx === x) AF.makeBunting([x, 5.0, pz], [tx, 4.0, COAST - 1.2], { shape: 'pennant', spacing: 0.6, size: 0.36 });
          const span = Math.hypot(b[0] - a[0], b[2] - a[2]), nb = Math.round(span / 0.9);
          for (let k = 1; k < nb; k++) { const u = k / nb; bulbPts.push(a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u - Math.sin(u * Math.PI) * 0.9, a[2] + (b[2] - a[2]) * u); bulbSeq.push(k); }
        }
      }
      L.bwFestoon = { pts: bulbPts, seq: bulbSeq };
      // striped canvas deck chairs in pairs facing the sea (+z), with a 'sit' spot on half of them
      const dc = (ca, cb) => { const m = new AF.Model(10, 14, 16), wd = C.woodD;
        for (const x of [0, 9]) { m.line(x, 0, 2, x, 12, 12, wd); m.line(x, 0, 13, x, 7, 6, wd); m.box(x, 6, 3, x + 1, 7, 12, wd); }
        for (let k = 0; k < 11; k++) for (let x = 1; x < 9; x++) m.set(x, 11 - k, 12 - k * 0.9 | 0, (x >> 1) % 2 ? ca : cb);
        return geo(m, 1 / 16); };
      const DC = [dc(C.red, C.white), dc(C.navy, C.cream), dc(C.teal, C.white), dc(C.gold, C.white)];
      let di = 0;
      for (let x = BWX0 + 16; x < BWX1 - 4; x += 16) {
        if (x > PP.x0 - 6 && x < PP.x1 + 6) continue;
        for (const ox of [-2.2, -1.2]) { put(DC[di % 4], x + ox, 0.25, 205.6, 2, true); if (di % 2 === 0) AF.addSpot({ building: null, x: x + ox, y: 0.55, z: 205.4, yaw: 0, kind: 'sit' }); di++; }
        AF.addSpot({ building: null, x: x + 3.5, y: 0.25, z: COAST - 1.0, yaw: 0, kind: 'stand' });
      }
      // CLOSED FOR THE SEASON: two stands with boards nailed across the counter
      for (const [kx, kz, txt, a, b] of [[-258, 204, 'LEMONADE', C.gold, C.white], [-168, 203, 'SNO-CONES', C.teal, C.white]]) {
        put(kiosk(18, 12, C.white, a, b, txt, C.navy, C.white), kx, 0.25, kz, 0, true);
        for (const y of [1.25, 1.75, 2.25]) F(kx - 1.125, y, kz - 0.875, kx + 1.125, y + 0.25, kz - 0.75, C.plankD);
        put(LIB.sign('CLOSED FOR', C.red, C.cream, 1 / 32), kx, 2.05, kz - 0.95, 2, false); put(LIB.sign('THE SEASON', C.red, C.cream, 1 / 32), kx, 1.6, kz - 0.95, 2, false);
      }
    }

    // ---- PENNY ARCADE (enterable) x -286..-262, z 177..197; door on the south (boardwalk) face
    {
      const X0 = -286, X1 = -262, Z0 = 177, Z1 = 197, YT = 6.5;
      const wallC = c(0xf0e0c0, { jitter: 0.25 }), trim = C.teal;
      W.walls(X0, 0.25, Z0, X1, YT, Z1, wallC, 0.5);
      for (let x = X0 + 0.5; x < X1 - 0.5; x += 0.5) for (let z = Z0 + 0.5; z < Z1 - 0.5; z += 0.5) F(x, 0.25, z, x + 0.5, 0.5, z + 0.5, ((Math.floor(x * 2) + Math.floor(z * 2)) & 1) ? C.tileA : C.tileB);
      F(X0, YT, Z0, X1, YT + 0.25, Z1, C.cream);                                                 // roof slab
      F(X0 - 0.25, YT + 0.25, Z0 - 0.25, X1 + 0.25, YT + 0.75, Z0, trim); F(X0 - 0.25, YT + 0.25, Z1, X1 + 0.25, YT + 0.75, Z1 + 0.25, trim);
      F(X0 - 0.25, YT + 0.25, Z0, X0, YT + 0.75, Z1, trim); F(X1, YT + 0.25, Z0, X1 + 0.25, YT + 0.75, Z1, trim);
      // stepped deco parapet on the south face + bulb-lit sign
      F(X0 + 6, YT + 0.25, Z1 - 0.5, X1 - 6, YT + 3.25, Z1, wallC); F(X0 + 9, YT + 3.25, Z1 - 0.5, X1 - 9, YT + 4.25, Z1, wallC);
      F(X0 + 11.5, YT + 4.25, Z1 - 0.5, X1 - 11.5, YT + 5.5, Z1, C.gold);
      const tw = LIB.wallText('ARCADE', C.red, X0 + 6.6, YT + 0.9, Z1, 's', { spacing: 1 });
      for (let x = X0 + 6.25; x < X1 - 6.25; x += 0.5) { W.setM(x, YT + 0.5, Z1, C.bulb); W.setM(x, YT + 3.0, Z1, C.bulb); }
      // door (3 m wide, 3 m tall) + transom, big arched windows either side
      const DX = (X0 + X1) / 2;
      F(DX - 1.5, 0.5, Z1 - 0.5, DX + 1.5, 3.5, Z1, 0); F(DX - 1.75, 3.5, Z1 - 0.5, DX + 1.75, 3.75, Z1 + 0.25, C.gold);
      F(DX - 1.5, 3.75, Z1 - 0.25, DX + 1.5, 4.5, Z1, C.bulbA);
      F(DX - 1.5, 0.25, Z1, DX + 1.5, 0.5, Z1 + 0.75, C.stone);
      for (const wx of [X0 + 1.5, X0 + 5, X1 - 8, X1 - 4.5]) { F(wx, 1.25, Z1 - 0.5, wx + 2.5, 4.25, Z1, C.glass); F(wx - 0.25, 1.0, Z1 - 0.5, wx + 2.75, 1.25, Z1 + 0.25, trim); }
      for (let z = Z0 + 2; z < Z1 - 3; z += 4) { F(X0, 2, z, X0 + 0.5, 4, z + 2, C.glass); F(X1 - 0.5, 2, z, X1, 4, z + 2, C.glass); }
      // machines along the walls: cabinets with glowing screens, coin slots, some pinball tables in the middle
      const cab = [c(0xa83a2a), c(0x2a5a8a), c(0x3a7a4a), c(0x8a3a7a)];
      for (let i = 0, x = X0 + 1; x < X1 - 1.5; x += 1.75, i++) {
        F(x, 0.5, Z0 + 0.5, x + 1.25, 2.25, Z0 + 1.5, cab[i % 4]); F(x + 0.25, 1.5, Z0 + 1.5, x + 1.0, 2.0, Z0 + 1.75, i % 2 ? C.screen : C.screen2);
        F(x, 2.25, Z0 + 0.5, x + 1.25, 2.5, Z0 + 1.5, C.gold); F(x + 0.5, 1.0, Z0 + 1.5, x + 0.75, 1.25, Z0 + 1.75, C.brass);
        AF.addSpot({ building: 'penny-arcade', x: x + 0.62, y: 0.5, z: Z0 + 2.4, yaw: Math.PI, kind: 'play' });
      }
      for (let i = 0, z = Z0 + 3; z < Z1 - 5; z += 2, i++) {
        F(X0 + 0.5, 0.5, z, X0 + 1.5, 2.25, z + 1.25, cab[(i + 1) % 4]); F(X0 + 1.5, 1.5, z + 0.25, X0 + 1.75, 2.0, z + 1.0, C.screen2);
      }
      for (let i = 0; i < 4; i++) { const px = X0 + 6 + i * 3.5, pz = Z0 + 8; F(px, 0.5, pz, px + 1.25, 1.25, pz + 2.25, cab[i]); F(px, 1.25, pz, px + 1.25, 1.5, pz + 2.25, C.screen); F(px, 1.5, pz + 1.75, px + 1.25, 2.25, pz + 2.25, cab[(i + 2) % 4]); }
      // prize counter on the east wall with shelves of prizes (teddy bears, kewpie dolls)
      F(X1 - 3.5, 0.5, Z0 + 3, X1 - 2.75, 1.5, Z0 + 12, C.wood); F(X1 - 3.75, 1.5, Z0 + 3, X1 - 2.5, 1.75, Z0 + 12, C.cream);
      for (let y = 1.0; y < 4.5; y += 1.0) { F(X1 - 1.25, y, Z0 + 3, X1 - 0.5, y + 0.25, Z0 + 12, C.wood); for (let z = Z0 + 3.25; z < Z0 + 11.8; z += 0.75) F(X1 - 1.0, y + 0.25, z, X1 - 0.5, y + 0.75, z + 0.5, [C.pink, C.mint, c(0xc89a5a), C.red, c(0xf0d060)][(Math.floor(z * 4) + Math.floor(y)) % 5]); }
      AF.addSpot({ building: 'penny-arcade', x: X1 - 2.0, y: 0.5, z: Z0 + 7, yaw: -Math.PI / 2, kind: 'counter' });
      // teal dado + gold picture rail inside, bright posters between the windows
      for (const [a0, b0, a1, b1] of [[X0 + 0.5, Z0 + 0.5, X1 - 0.5, Z0 + 0.75], [X0 + 0.5, Z1 - 0.75, X1 - 0.5, Z1 - 0.5], [X0 + 0.5, Z0 + 0.5, X0 + 0.75, Z1 - 0.5], [X1 - 0.75, Z0 + 0.5, X1 - 0.5, Z1 - 0.5]]) { F(a0, 0.5, b0, a1, 1.25, b1, trim); F(a0, 4.75, b0, a1, 5.0, b1, C.gold); }
      F(DX - 1.5, 0.5, Z1 - 0.75, DX + 1.5, 1.25, Z1 - 0.5, 0);
      const posterC = [C.red, C.gold, C.pink, C.navy, C.mint];
      for (let i = 0, x = X0 + 2; x < X1 - 3; x += 3.5, i++) { F(x, 3.0, Z0 + 0.5, x + 1.5, 4.5, Z0 + 0.75, posterC[i % 5]); F(x + 0.25, 3.25, Z0 + 0.75, x + 1.25, 3.75, Z0 + 0.8, C.cream); }
      // ceiling lamps
      for (let x = X0 + 4; x < X1 - 2; x += 6) for (let z = Z0 + 4; z < Z1 - 2; z += 7) { F(x, YT - 0.25, z, x + 1, YT, z + 1, C.lampA); }
      AF.addLight({ x: DX, y: 5, z: (Z0 + Z1) / 2, color: 0xffe0b0, intensity: 1.4, range: 16, kind: 'interior' });
      { // v2 r2: the machines — mutoscopes, a fortune automaton, claw diggers, Skee-Ball lanes and a love tester (vs 1/16)
        const iron = C.iron, red = C.red, gold = C.gold, cream = C.cream, glassC = AF.col('glass');
        const glow = AF.col(0xfff0c8, { emit: 0xffd890, emitK: 2.2, mode: 'always' }), glowR = AF.col(0xff9a8a, { emit: 0xff4a3a, emitK: 2.6, mode: 'always' }), glowB = AF.col(0x9ad8ff, { emit: 0x50b0ff, emitK: 2.4, mode: 'always' });
        const skin = c(0xe8b890, { jitter: 0.2 }), purple = c(0x5a2a6a), velvet = c(0x7a1a2a);
        const muto = (() => { const m = new AF.Model(8, 30, 8); m.box(2, 0, 2, 6, 2, 6, iron); m.box(3, 2, 3, 5, 12, 5, iron); m.box(1, 12, 1, 7, 24, 7, red); m.box(1, 14, 7, 7, 22, 8, gold); m.box(2, 16, 7, 6, 20, 8, glow);
          m.box(2, 24, 3, 6, 28, 7, iron); m.box(3, 25, 7, 5, 27, 8, C.black); m.box(7, 16, 3, 8, 18, 5, C.brass); m.box(0, 20, 3, 1, 22, 5, gold); m.box(3, 28, 3, 5, 30, 5, gold); return geo(m, 1 / 16); })();
        const fortune = (() => { const m = new AF.Model(16, 40, 12); m.box(0, 0, 0, 16, 10, 12, purple); m.box(0, 10, 0, 16, 34, 1, purple); m.box(0, 10, 0, 1, 34, 12, purple); m.box(15, 10, 0, 16, 34, 12, purple);
          m.box(1, 10, 11, 15, 34, 12, glassC); m.box(0, 34, 0, 16, 36, 12, gold); for (let x = 0; x < 16; x += 2) m.set(x, 36, 11, glow); m.box(4, 36, 3, 12, 40, 9, gold);
          m.box(5, 10, 4, 11, 20, 8, velvet); m.box(6, 20, 5, 10, 25, 8, skin); m.box(5, 25, 4, 11, 28, 8, gold); m.box(7, 28, 5, 9, 29, 7, glowR); m.box(4, 16, 8, 12, 17, 10, velvet); m.box(7, 17, 8, 9, 19, 10, glowB);
          m.box(2, 6, 11, 5, 8, 12, C.brass); m.box(11, 4, 11, 14, 9, 12, cream); return geo(m, 1 / 16); })();
        const claw = (() => { const m = new AF.Model(14, 36, 14); m.box(0, 0, 0, 14, 12, 14, C.teal); m.box(0, 12, 0, 14, 30, 14, glassC); m.box(0, 12, 0, 1, 30, 1, gold); m.box(13, 12, 0, 14, 30, 1, gold); m.box(0, 12, 13, 1, 30, 14, gold); m.box(13, 12, 13, 14, 30, 14, gold);
          for (let x = 1; x < 13; x++) for (let z = 1; z < 13; z++) { const h = 13 + ((x * 7 + z * 3) % 4); for (let y = 12; y < h; y++) m.set(x, y, z, [C.pink, C.mint, C.red, c(0xf0d060), C.white][(x + z + y) % 5]); }
          m.box(0, 30, 0, 14, 34, 14, C.teal); m.box(1, 31, 13, 13, 33, 14, glow); m.box(6, 22, 6, 8, 30, 8, iron); m.box(5, 20, 5, 9, 22, 9, C.brass); m.box(5, 18, 5, 6, 20, 6, C.brass); m.box(8, 18, 8, 9, 20, 9, C.brass);
          m.box(3, 9, 13, 11, 12, 14, C.navy); m.box(5, 10, 14, 6, 12, 15, C.black); m.box(9, 10, 14, 10, 11, 15, glowR); return geo(m, 1 / 16); })();
        const skee = (() => { const m = new AF.Model(12, 22, 56); for (let z = 0; z < 44; z++) { const y = Math.round(4 + z * 0.12); m.box(0, 0, z, 12, y, z + 1, C.woodD); m.box(1, y, z, 11, y + 1, z + 1, c(0xc8a070)); m.box(0, y, z, 1, y + 3, z + 1, gold); m.box(11, y, z, 12, y + 3, z + 1, gold); }
          m.box(0, 0, 44, 12, 22, 56, C.navy); for (const [r, cy] of [[5, 13], [3.4, 13], [1.8, 13]]) for (let a = 0; a < TAU; a += 0.15) m.set(Math.round(6 + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r * 0.8), 44, r > 4 ? gold : r > 3 ? C.red : C.white);
          m.box(1, 18, 43, 11, 21, 44, glow); for (let x = 2; x < 10; x += 2) m.box(x, 5, 1, x + 1, 6, 2, C.brass); return geo(m, 1 / 16); })();
        const love = (() => { const m = new AF.Model(10, 40, 8); m.box(0, 0, 0, 10, 12, 8, velvet); m.box(1, 12, 1, 9, 38, 7, velvet); m.box(0, 38, 0, 10, 40, 8, gold);
          for (let y = 14; y < 36; y += 2) m.box(3, y, 7, 7, y + 1, 8, [glowR, glowR, AF.col(0xffb0c8, { emit: 0xff70a0, emitK: 2.4, mode: 'always' }), glow][(y >> 1) % 4]);
          m.box(4, 8, 8, 6, 10, 10, C.brass); m.box(3, 10, 9, 7, 11, 10, C.brass); return geo(m, 1 / 16); })();
        const A0 = { X0, X1, Z0, Z1 };
        for (let i = 0; i < 5; i++) { const x = -270 + i * 1.1; put(muto, x, 0.5, 191, 2, true); AF.addSpot({ building: 'penny-arcade', x, y: 0.5, z: 190.35, yaw: 0, kind: 'play' }); }
        put(LIB.sign('WHAT THE BUTLER SAW  1 CENT', C.gold, C.red, 1 / 32), -267.8, 2.1, 190.7, 2, false);
        put(fortune, -268.5, 0.5, 178.6, 0, true); AF.addSpot({ building: 'penny-arcade', x: -268.5, y: 0.5, z: 180.1, yaw: Math.PI, kind: 'play' });
        put(LIB.sign('MADAME ZENOBIA', C.gold, c(0x3a1a4a), 1 / 32), -268.5, 2.7, 179.4, 0, false);
        for (const x of [-284.2, -282.2]) { put(claw, x, 0.5, 194.6, 2, true); AF.addSpot({ building: 'penny-arcade', x, y: 0.5, z: 193.6, yaw: 0, kind: 'play' }); }
        for (let i = 0; i < 3; i++) { const x = -281 + i * 1.0; put(skee, x, 0.5, 187.5, 2, true); if (i !== 1) AF.addSpot({ building: 'penny-arcade', x, y: 0.5, z: 190.4, yaw: Math.PI, kind: 'play' }); }
        put(LIB.sign('BALL-ROLL 5 CENTS', C.red, C.cream, 1 / 24), -280, 2.05, 184.0, 2, false);
        put(love, -285.3, 0.5, 189.5, 1, true); AF.addSpot({ building: 'penny-arcade', x: -284.4, y: 0.5, z: 189.5, yaw: -Math.PI / 2, kind: 'play' });
        put(LIB.sign('LOVE TESTER', C.pink, C.navy, 1 / 32), -285.4, 3.0, 189.5, 1, false);
        AF.addLight({ x: -268.5, y: 2.4, z: 180, color: 0xc080ff, intensity: 0.8, range: 5, kind: 'interior' });
        AF.addLight({ x: -283, y: 2.2, z: 193.5, color: 0x80e0ff, intensity: 0.7, range: 5, kind: 'interior' });
        // neon on the back wall, a change booth by the door, and festoons of marquee bulbs under the ceiling (chased by 15-harbour-2)
        const neonP = AF.col(0xffa0d0, { emit: 0xff4aa0, emitK: 3.2, mode: 'always' }), neonT = AF.col(0xa0fff0, { emit: 0x30e0d0, emitK: 3.0, mode: 'always' });
        put(LIB.sign('PENNY ARCADE', neonP, null, 1 / 14), -274, 5.15, 177.8, 0, false);
        put(LIB.sign('PLAY  WIN  PRIZES', neonT, null, 1 / 24), -285.2, 5.3, 186, 1, false);
        F(-279.5, 0.5, 194.2, -277.5, 1.5, 195.2, C.wood); F(-279.75, 1.5, 194, -277.25, 1.75, 195.4, C.brass); F(-279.5, 1.75, 194.9, -277.5, 2.9, 195.0, AF.col('glass')); F(-279.75, 2.9, 194, -277.25, 3.1, 195.4, C.red);
        put(LIB.sign('CHANGE', C.gold, C.red, 1 / 32), -278.5, 3.12, 194.0, 2, false);
        AF.addSpot({ building: 'penny-arcade', x: -278.5, y: 0.5, z: 195.8, yaw: Math.PI, kind: 'counter' });
        const ap = [], as = [];
        for (let row = 0; row < 3; row++) { const z = 180.5 + row * 6; for (let x = X0 + 1, k = 0; x < X1 - 1; x += 0.6, k++) { ap.push(x, YT - 0.45 - Math.abs(Math.sin((x - X0) / (X1 - X0) * Math.PI * 4)) * 0.5, z); as.push(k); } }
        L.arcadeBulbs = { pts: ap, seq: as };
        void A0;
      }
      AF.addBuilding({ id: 'penny-arcade', name: 'Penny Arcade', kind: 'arcade', box: [X0, 0.25, Z0, X1, YT + 5.5, Z1], doors: [{ x: DX, y: 0.25, z: Z1 + 1.2, yaw: Math.PI }], floors: [0.5], interior: true, owner: 'land-harbour' });
      L.arcade = { X0, X1, Z0, Z1, DX };
    }

    // =============================================================== 2. THE PLEASURE PIER + FERRIS WHEEL
    {
      LIB.pier(PP.x0, PP.x1, PP.z1, { deck: [C.plank, C.plankD, C.plankL], gaps: [['w', 238, 264], ['e', 238, 264]] });
      for (let z = COAST + 6; z < PP.z1 - 2; z += 10) { LIB.lamp(PP.x0 + 0.8, 0.25, z); LIB.lamp(PP.x1 - 0.8, 0.25, z); }
      // fishing spots along the rails
      for (let z = COAST + 12; z < PP.z1 - 4; z += 7) { AF.addSpot({ building: null, x: PP.x0 + 0.9, y: 0.25, z, yaw: -Math.PI / 2, kind: 'fish' }); AF.addSpot({ building: null, x: PP.x1 - 0.9, y: 0.25, z: z + 3, yaw: Math.PI / 2, kind: 'fish' }); }
      // shooting gallery booth
      {
        const m = new AF.Model(40, 28, 16), wall = c(0x2a4a6a);
        m.box(0, 0, 10, 40, 24, 16, wall); m.box(0, 0, 0, 2, 24, 16, wall); m.box(38, 0, 0, 40, 24, 16, wall);
        m.box(2, 0, 0, 38, 8, 3, C.red); m.box(2, 8, 0, 38, 9, 3, C.gold);
        for (let x = -1; x < 41; x++) for (let k = 0; k < 4; k++) m.set(x, 24 + k, -1 + k * 2, (Math.floor((x + 1) / 3) % 2) ? C.red : C.white), m.set(x, 24 + k, k * 2, (Math.floor((x + 1) / 3) % 2) ? C.red : C.white);
        for (let row = 0; row < 3; row++) for (let x = 5 + row * 2; x < 36; x += 5) { m.box(x, 11 + row * 4, 9, x + 2, 13 + row * 4, 10, row === 1 ? C.gold : C.white); m.set(x + 2, 12 + row * 4, 9, C.red); }
        for (let x = 4; x < 38; x += 3) m.set(x, 22, 9, C.bulbA);
        const tm = AF.textModel('SHOOTING GALLERY', C.gold, { pad: 0 }); for (let x = 0; x < tm.w && x < 38; x++) for (let y = 0; y < 7; y++) if (tm.get(x, y, 0)) m.set(x + 2, 15 + y, 10, 0);
        put(geo(m, 1 / 8), PP.x0 + 3.5, 0.25, COAST + 16, 3, true);   // v2 r2: counter faces the walkway (was the water)
        { // two rows of tin ducks that run along the back of the gallery in opposite directions
          const dm = new AF.Model(7, 6, 2), yl = c(0xf2c230, { jitter: 0.2 }), orng = c(0xe8702a);
          dm.box(0, 0, 0, 5, 3, 2, yl); dm.box(3, 3, 0, 6, 5, 2, yl); dm.box(6, 3, 0, 7, 4, 2, orng); dm.box(4, 4, 0, 5, 5, 2, C.black); dm.box(0, 2, 0, 1, 4, 2, yl);
          const dg = AF.meshModel(dm, { vs: 1 / 16, anchor: [0.5, 0, 0.5] }), ducks = [], gx = PP.x0 + 3.5 + 0.2, gz = COAST + 16;
          for (let i = 0; i < 12; i++) { const d = AF.modelMesh(dg); d.castShadow = false; d.rotation.y = i < 6 ? 0 : Math.PI; AF.scene.add(d); ducks.push(d); }
          dyn.push({ x: gx, z: gz, r: 60, update(dt, t) { for (let i = 0; i < 12; i++) { const row = i < 6 ? 0 : 1, u = (((row ? -t : t) * 0.12 + (i % 6) / 6) % 1 + 1) % 1; const d = ducks[i]; d.position.set(gx, 0.25 + (row ? 2.35 : 1.7), gz - 2.1 + u * 4.2); d.rotation.y = (row ? 1 : -1) * Math.PI / 2; } } });
          L.ducks = ducks;
        }
        AF.addSpot({ building: null, x: PP.x0 + 5.5, y: 0.25, z: COAST + 16, yaw: -Math.PI / 2, kind: 'play' });
      }
      // THE BIG WHEEL (v2): 44 m tall, facing the pier approach (axle along z), on a widened pier-head platform.
      // Two white A-frames straddle the pier, 24 spokes lined with bulbs, 24 swinging gondolas in red / teal / cream.
      const WX = (PP.x0 + PP.x1) / 2, WZ = 250, WR = 20, WY = WR + 3.0;
      const frame = C.white, frameD = c(0xdcd6c8, { jitter: 0.2 });
      { // pier-head platform (x WX-15..WX+15, z 238..264) on pilings, white rail round it
        const PX0 = WX - 15, PX1 = WX + 15, PZ0 = 238, PZ1 = 264;
        for (let z = PZ0; z < PZ1; z += 0.25) { const row = Math.floor(z * 4); F(PX0, 0, z, PX1, 0.25, z + 0.25, [C.plank, C.plankD, C.plankL][(hash(row, 3) * 3) | 0]); }
        for (let x = PX0 + 1; x < PX1; x += 3.5) for (let z = PZ0 + 1; z < PZ1; z += 3.5) { F(x, -4, z, x + 0.5, 0, z + 0.5, C.woodD); }
        for (let x = PX0; x < PX1; x += 0.25) for (const z of [PZ0, PZ1 - 0.25]) { if (z === PZ0 && x >= PP.x0 && x < PP.x1) continue; if (Math.round(x * 4) % 8 === 0) F(x, 0.25, z, x + 0.25, 1.25, z + 0.25, C.white); F(x, 1.0, z, x + 0.25, 1.25, z + 0.25, C.white); }
        for (let z = PZ0; z < PZ1; z += 0.25) for (const x of [PX0, PX1 - 0.25]) { if (Math.round(z * 4) % 8 === 0) F(x, 0.25, z, x + 0.25, 1.25, z + 0.25, C.white); F(x, 1.0, z, x + 0.25, 1.25, z + 0.25, C.white); }
        for (const [lx, lz] of [[PX0 + 0.6, PZ1 - 0.6], [PX1 - 0.6, PZ1 - 0.6], [PX0 + 0.6, PZ0 + 0.6], [PX1 - 0.6, PZ0 + 0.6]]) LIB.lamp(lx, 0.25, lz);
        for (let x = PX0 + 3; x < PX1 - 3; x += 6) { AF.addSpot({ building: null, x, y: 0.25, z: PZ1 - 1.0, yaw: 0, kind: 'fish' }); }
        for (const x of [PX0 + 2, PX1 - 4]) LIB.bench(x, 0.25, PZ0 + 2.5, 2);
      }
      for (const fz of [WZ - 2.5, WZ + 2.25]) {       // A-frames in the x-y plane (legs spread along x)
        for (let t = 0; t <= 1.0001; t += 0.008) {
          for (const dx of [-11, 11]) { const x = WX + dx * (1 - t), y = 0.25 + (WY - 0.25) * t; F(x - 0.375, y, fz, x + 0.375, y + 0.25, fz + 0.25, frame); }
        }
        for (const hy of [6, 12, 17]) { const k = 1 - (hy - 0.25) / (WY - 0.25); F(WX - 11 * k, hy, fz, WX + 11 * k, hy + 0.25, fz + 0.25, frameD); }
        F(WX - 11.5, 0.25, fz - 0.25, WX - 10.25, 0.75, fz + 0.5, C.iron); F(WX + 10.25, 0.25, fz - 0.25, WX + 11.5, 0.75, fz + 0.5, C.iron);
      }
      F(WX - 0.375, WY - 0.375, WZ - 2.75, WX + 0.375, WY + 0.375, WZ + 2.75, C.iron);     // axle
      // bulb-arch ticket booth at the wheel foot (faces the approach, -z)
      F(WX + 5, 0.25, WZ - 9, WX + 8, 2.75, WZ - 6.5, C.red); F(WX + 4.75, 2.75, WZ - 9.25, WX + 8.25, 3.0, WZ - 6.25, C.gold);
      F(WX + 5.5, 1.25, WZ - 9.25, WX + 7.5, 2.25, WZ - 9, C.glass); F(WX + 5.25, 3.0, WZ - 9.0, WX + 7.75, 3.5, WZ - 8.75, C.bulbA);
      AF.addSpot({ building: null, x: WX + 6.5, y: 0.25, z: WZ - 10.2, yaw: 0, kind: 'counter' });
      for (let i = 0; i < 6; i++) AF.addSpot({ building: null, x: WX + 2 - (i % 2) * 0.5, y: 0.25, z: WZ - 10.5 - i * 0.8, yaw: Math.PI, kind: 'stand' });
      // rim model (vs 1/8, axle along model x): 2 rims, 24 spokes each side, cross ties, bulbs chasing along rim + spokes
      const RV = Math.round(WR * 8), SZ = RV * 2 + 6, rm = new AF.Model(22, SZ, SZ), cc = SZ / 2;
      const rimC = C.white, bulbN = C.bulb, spokeC = c(0xe8e0d0), bulbR = AF.col(0xffb0a0, { emit: 0xff5a40, emitK: 3.2, mode: 'night' }), bulbT = AF.col(0xb0fff0, { emit: 0x40e0d0, emitK: 3.0, mode: 'night' });
      const NS = 24;
      for (let y = 0; y < SZ; y++) for (let z = 0; z < SZ; z++) {
        const dy = y + 0.5 - cc, dz = z + 0.5 - cc, d = Math.hypot(dy, dz); if (d > RV + 1.2) continue;
        const a = Math.atan2(dy, dz);
        if (d <= RV && d > RV - 3) for (const x of [1, 2, 19, 20]) rm.set(x, y, z, rimC);
        if (d <= RV - 14 && d > RV - 16) for (const x of [1, 20]) rm.set(x, y, z, spokeC);
        const sp = Math.abs(AF.angDiff(a, Math.round(a / (TAU / NS)) * (TAU / NS))) * d;
        if (d < RV && d > 3 && sp < 1.1) for (const x of [1, 20]) rm.set(x, y, z, (Math.round(d) % 7 === 0) ? ((Math.round(a / (TAU / NS)) % 3 === 0) ? bulbR : bulbN) : spokeC);
        if (d > RV && d < RV + 1.2) { const k = Math.floor((a + Math.PI) / TAU * 144); if (k % 2 === 0) for (const x of [1, 20]) rm.set(x, y, z, spokeC); void bulbT; }   // v2 r2: the rim lights are now chasers (15-harbour-2)
        if (d <= 6) for (let x = 0; x < 22; x++) rm.set(x, y, z, d < 3 ? C.iron : d < 5 ? C.gold : C.red);
      }
      for (let i = 0; i < NS; i++) { const a = i / NS * TAU, y = Math.round(cc + Math.sin(a) * (RV - 1.5)), z = Math.round(cc + Math.cos(a) * (RV - 1.5)); rm.box(1, y - 1, z - 1, 21, y + 1, z + 1, rimC); }
      const wheelHold = new THREE.Group(); wheelHold.position.set(WX, WY, WZ); wheelHold.rotation.y = Math.PI / 2; AF.scene.add(wheelHold);
      const wheel = AF.modelMesh(rm, { vs: 1 / 8, anchor: [0.5, 0.5, 0.5] }); wheel.castShadow = true; wheelHold.add(wheel);
      // gondolas (vs 1/16): open car with a scalloped canopy, 3 colours + riders
      const skin = c(0xe8b890, { jitter: 0.2 }), coatC = [C.navy, c(0x7a2a2a), c(0x3a5a3a), c(0x5a4a3a)];
      const gond = (col, seed) => {
        const g = new AF.Model(22, 26, 18);
        g.box(0, 0, 0, 22, 8, 18, col); g.box(2, 2, 2, 20, 8, 16, 0); g.box(2, 2, 2, 20, 3, 16, C.cream);
        g.box(0, 18, 0, 22, 21, 18, col); g.box(1, 21, 1, 21, 22, 17, C.gold); g.box(10, 22, 8, 12, 26, 10, C.iron);
        for (let x = 0; x < 22; x += 2) { g.set(x, 17, 0, col); g.set(x, 17, 17, col); }
        for (const [x, z] of [[0, 0], [21, 0], [0, 17], [21, 17]]) g.box(x, 8, z, x + 1, 18, z + 1, C.gold);
        g.box(0, 9, 0, 22, 10, 1, C.gold); g.box(0, 9, 17, 22, 10, 18, C.gold);
        if (seed % 2 === 0) for (const px of [6, 15]) { g.box(px - 2, 3, 7, px + 2, 10, 11, coatC[(seed + px) % 4]); g.box(px - 1, 10, 8, px + 2, 13, 11, skin); g.box(px - 2, 13, 7, px + 2, 14, 11, coatC[(seed + 1) % 4]); }
        return AF.meshModel(g, { vs: 1 / 16, anchor: [0.5, 1, 0.5] });
      };
      const GG = [gond(C.red, 0), gond(C.teal, 1), gond(C.cream, 2), gond(C.red, 3), gond(C.teal, 4), gond(C.cream, 5)];
      const gonds = [];
      for (let i = 0; i < NS; i++) { const gm = AF.modelMesh(GG[i % 6]); gm.castShadow = false; gm.rotation.y = Math.PI / 2; AF.scene.add(gm); gonds.push(gm); }
      L.ferris = { wheel, gonds, WX, WY, WZ, WR };
      dyn.push({ x: WX, z: WZ, r: 400, update(dt, t) {
        wheel.rotation.x += dt * 0.07 * (L.ferris.k || 1);
        for (let i = 0; i < NS; i++) { const a = wheel.rotation.x + i / NS * TAU; gonds[i].position.set(WX - Math.cos(a) * (WR - 0.4), WY + Math.sin(a) * (WR - 0.4) + 0.1, WZ); gonds[i].rotation.x = Math.sin(t * 0.8 + i) * 0.05; }
      } });
      AF.addLight({ x: WX, y: WY, z: WZ - 3, color: 0xffe0a0, intensity: 2.2, range: 26, kind: 'sign' });
      AF.addLight({ x: WX, y: 3, z: WZ - 8, color: 0xffd08a, intensity: 1.4, range: 14, kind: 'sign' });
      { const sgw = LIB.sign('THE BIG WHEEL', C.gold, C.red, 1 / 10); put(sgw, WX, 4.2, WZ - 2.9, 2, false); }
      const sg = LIB.sign('PLEASURE PIER', C.gold, C.red, 1 / 12);
      F(PP.x0 + 0.5, 0.25, COAST + 1, PP.x0 + 1, 5, COAST + 1.5, C.white); F(PP.x1 - 1, 0.25, COAST + 1, PP.x1 - 0.5, 5, COAST + 1.5, C.white);
      F(PP.x0 + 0.5, 5, COAST + 1, PP.x1 - 0.5, 5.25, COAST + 1.5, C.gold);
      for (let x = PP.x0 + 0.5; x < PP.x1 - 0.5; x += 0.5) W.setM(x, 5.25, COAST + 1.25, C.bulb);
      for (let y = 0.5; y < 5; y += 0.5) { W.setM(PP.x0 + 0.5, y, COAST + 1.5, C.bulb); W.setM(PP.x1 - 0.75, y, COAST + 1.5, C.bulb); }
      put(sg, (PP.x0 + PP.x1) / 2, 5.25, COAST + 1.0, 2, false);
      AF.addLabel(PP.name, (PP.x0 + PP.x1) / 2, PP.z1 - 6, 'place');
      AF.addLabel('The Big Wheel', WX, WZ, 'building');
      AF.addLabel('The Boardwalk', -250, 200, 'place');
    }

    // =============================================================== 2b. THE SEA SERPENT — a white wooden lattice roller coaster on pilings
    //       over the water west of the Pleasure Pier (x -297..-244, z 212..254), lift hill ~23 m, a 3-car train that runs the track.
    {
      const wht = c(0xf4efe4, { jitter: 0.25, edge: 0.6 }), whtD = c(0xd8d0c0, { jitter: 0.3, edge: 0.6 }), railC = c(0x44464a, { jitter: 0.1, metal: 0.8, rough: 0.35 }), tie = c(0x8a6a48, { jitter: 0.5 });
      const ring = [[-251, 216.5], [-262, 216], [-276, 216], [-288, 217.5], [-295, 225], [-295, 237], [-289, 247], [-278, 251], [-264, 251], [-254, 248], [-249.5, 240], [-248.5, 229], [-249.5, 221]];
      const curve = new THREE.CatmullRomCurve3(ring.map(([x, z]) => new THREE.Vector3(x, 0, z)), true, 'centripetal');
      const LEN = curve.getLength();
      const KF = [[0, 2.5], [0.03, 2.5], [0.24, 23], [0.275, 23.2], [0.36, 3.2], [0.44, 15], [0.52, 4.5], [0.6, 12], [0.67, 4], [0.75, 9.5], [0.83, 3.5], [0.9, 6], [0.96, 2.5], [1, 2.5]];
      const hAt = (u) => { u = ((u % 1) + 1) % 1; for (let i = 1; i < KF.length; i++) if (u <= KF[i][0]) { const [u0, h0] = KF[i - 1], [u1, h1] = KF[i], k = (u - u0) / (u1 - u0); return h0 + (h1 - h0) * (0.5 - 0.5 * Math.cos(k * Math.PI)); } return KF[0][1]; };
      const vset = (x, y, z, col) => { if (y > -4) W.setM(x, y, z, col); };
      const vline = (x0, y0, z0, x1, y1, z1, col) => { const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0, z1 - z0) / 0.2)); for (let i = 0; i <= n; i++) { const k = i / n; vset(x0 + (x1 - x0) * k, y0 + (y1 - y0) * k, z0 + (z1 - z0) * k, col); } };
      const p = new THREE.Vector3(), tg = new THREE.Vector3();
      // track: rails + ties every 0.2 m, bulbs along the outer rail on the lift hill
      for (let s = 0; s < LEN; s += 0.2) {
        const u = s / LEN; curve.getPointAt(u, p); curve.getTangentAt(u, tg);
        const h = hAt(u), nx = -tg.z, nz = tg.x, nl = Math.hypot(nx, nz) || 1;
        for (let w = -0.75; w <= 0.76; w += 0.25) vset(p.x + nx / nl * w, h - 0.25, p.z + nz / nl * w, tie);
        for (const w of [-0.625, 0.625]) vset(p.x + nx / nl * w, h, p.z + nz / nl * w, railC);
        for (const w of [-1.0, 1.0]) vset(p.x + nx / nl * w, h + 0.75, p.z + nz / nl * w, wht);      // safety rail
        if (Math.round(s * 5) % 10 === 0) for (const w of [-1.0, 1.0]) { vset(p.x + nx / nl * w, h + 0.25, p.z + nz / nl * w, wht); vset(p.x + nx / nl * w, h + 0.5, p.z + nz / nl * w, wht); }
        if (Math.round(s * 5) % 5 === 0 && (u < 0.3 || (u > 0.42 && u < 0.46) || (u > 0.58 && u < 0.62))) vset(p.x + nx / nl * 1.0, h + 1.0, p.z + nz / nl * 1.0, C.bulb);
      }
      // bents every 2.4 m: two posts to the seabed, ledgers every 2 m, X-braced lattice; longitudinal ledgers + diagonals
      let prev = null;
      for (let s = 0; s < LEN; s += 2.4) {
        const u = s / LEN; curve.getPointAt(u, p); curve.getTangentAt(u, tg);
        const h = hAt(u), nx = -tg.z / Math.hypot(tg.x, tg.z), nz = tg.x / Math.hypot(tg.x, tg.z);
        const L0 = [p.x - nx * 1.1, p.z - nz * 1.1], R0 = [p.x + nx * 1.1, p.z + nz * 1.1];
        const spread = 0.12 * h;                                             // tall bents splay out at the foot
        const Lb = [p.x - nx * (1.1 + spread), p.z - nz * (1.1 + spread)], Rb = [p.x + nx * (1.1 + spread), p.z + nz * (1.1 + spread)];
        vline(Lb[0], -4, Lb[1], L0[0], h - 0.5, L0[1], wht); vline(Rb[0], -4, Rb[1], R0[0], h - 0.5, R0[1], wht);
        const lerpP = (A, B, y) => { const k = (y + 4) / (h - 0.5 + 4); return [A[0] + (B[0] - A[0]) * k, A[1] + (B[1] - A[1]) * k]; };
        let lastY = -1.5;
        for (let y = -1.5; y < h - 0.6; y += 2) {
          const a = lerpP(Lb, L0, y), b = lerpP(Rb, R0, y);
          vline(a[0], y, a[1], b[0], y, b[1], whtD);
          const y2 = Math.min(y + 2, h - 0.5), a2 = lerpP(Lb, L0, y2), b2 = lerpP(Rb, R0, y2);
          if (y2 - y > 0.6) { vline(a[0], y, a[1], b2[0], y2, b2[1], whtD); vline(b[0], y, b[1], a2[0], y2, a2[1], whtD); }
          lastY = y;
        }
        const cur = { L: L0, R: R0, Lb, Rb, h };
        if (prev) {
          const top = Math.min(prev.h, h) - 0.6;
          for (let y = -1.5; y < top; y += 4) {
            for (const side of ['L', 'R']) {
              const A = prev[side], Ab = prev[side + 'b'], B = cur[side], Bb = cur[side + 'b'];
              const ka = (y + 4) / (prev.h - 0.5 + 4), kb = (y + 4) / (h - 0.5 + 4);
              const ax = Ab[0] + (A[0] - Ab[0]) * ka, az = Ab[1] + (A[1] - Ab[1]) * ka, bx = Bb[0] + (B[0] - Bb[0]) * kb, bz = Bb[1] + (B[1] - Bb[1]) * kb;
              vline(ax, y, az, bx, y, bz, whtD);
            }
          }
        }
        prev = cur; void lastY;
      }
      // station: a striped-roof shed over the track at u≈0.015, a stair down to a landing stage off the boardwalk
      curve.getPointAt(0.015, p);
      const SX = p.x, SZ = p.z;
      F(SX - 4, 0, 210, SX + 4, 0.25, SZ + 3, C.plankD);                                         // landing stage from the quay
      for (let x = SX - 3.5; x < SX + 4; x += 3.5) for (const z of [211, SZ + 2.5]) F(x, -4, z, x + 0.5, 0, z + 0.5, C.woodD);
      for (let i = 0; i < 8; i++) F(SX - 3.75 + i * 0.25 * 0, 0.25 + i * 0.25, 211 + i * 0.25 + 0.5, SX - 2.25, 0.5 + i * 0.25, 211.5 + i * 0.25 + 0.5, C.plank);
      F(SX - 4, 2.25, SZ - 2.25, SX + 4, 2.5, SZ + 2.25, C.plank);                               // platform beside the track
      for (const [px, pz] of [[SX - 4, SZ - 2.5], [SX + 3.75, SZ - 2.5], [SX - 4, SZ + 2.25], [SX + 3.75, SZ + 2.25]]) F(px, -4, pz, px + 0.25, 5.5, pz + 0.25, C.white);
      for (let x = SX - 4.5; x < SX + 4.5; x += 0.25) { const k = Math.round((x - SX) * 4); F(x, 5.5, SZ - 3, x + 0.25, 5.75, SZ + 3, (k >> 2) % 2 ? C.red : C.cream); }
      for (let x = SX - 4.5; x < SX + 4.5; x += 0.5) W.setM(x, 5.25, SZ - 3, C.bulb);
      put(LIB.sign('SEA SERPENT', C.gold, C.red, 1 / 10), SX, 5.9, SZ - 3.05, 2, false);
      put(LIB.sign('10 CENTS A RIDE', C.red, C.cream, 1 / 16), SX - 5, 1.2, 209.2, 2, false);
      AF.addLight({ x: SX, y: 5, z: SZ, color: 0xffd890, intensity: 1.5, range: 14, kind: 'sign' });
      AF.addSpot({ building: null, x: SX + 2, y: 2.5, z: SZ - 1.6, yaw: 0, kind: 'work' });
      for (let i = 0; i < 5; i++) AF.addSpot({ building: null, x: SX - 3 + (i % 2) * 0.4, y: 0.25, z: 208 - i * 0.8, yaw: Math.PI, kind: 'stand' });
      // big billboard on the lift-hill crest, facing the boardwalk
      curve.getPointAt(0.26, p);
      for (const ox of [-5, 5]) F(p.x + ox - 0.25, hAt(0.26) - 1, p.z - 2.5, p.x + ox, hAt(0.26) + 4.5, p.z - 2.25, C.iron);
      put(LIB.sign('THE SEA SERPENT', C.red, C.cream, 1 / 8), p.x, hAt(0.26) + 2.5, p.z - 2.6, 2, false);
      // the train: 3 cars (vs 1/16), a green serpent-head prow on the lead car, riders with arms up
      const skin = c(0xe8b890, { jitter: 0.2 }), carC = c(0xc0342e), serp = c(0x2f7a4a), coats = [C.navy, c(0x7a2a2a), c(0x3a5a3a), c(0x6a5a8a), c(0xe8dcc0)];
      const carGeo = (lead) => {
        const m = new AF.Model(22, 30, 38);
        m.box(1, 0, 0, 21, 3, 36, C.iron); m.box(0, 3, 0, 22, 10, 36, carC); m.box(2, 5, 2, 20, 10, 34, 0); m.box(2, 5, 2, 20, 6, 34, C.cream);
        m.box(0, 8, 0, 22, 9, 36, C.gold); m.box(2, 5, 17, 20, 11, 19, carC);
        for (const [rz, sd] of [[5, 1], [21, 3]]) for (const rx of [6, 15]) {
          const col = coats[(rx + rz + sd + (lead ? 2 : 0)) % 5];
          m.box(rx - 2, 6, rz, rx + 2, 14, rz + 5, col); m.box(rx - 1, 14, rz + 1, rx + 2, 17, rz + 4, skin); m.box(rx - 2, 17, rz + 1, rx + 2, 18, rz + 4, coats[(rx + sd) % 5]);
          m.box(rx - 3, 13, rz + 2, rx - 2, 21, rz + 3, col); m.box(rx + 2, 13, rz + 2, rx + 3, 21, rz + 3, col); m.box(rx - 3, 21, rz + 2, rx - 2, 22, rz + 3, skin); m.box(rx + 2, 21, rz + 2, rx + 3, 22, rz + 3, skin);
        }
        if (lead) { m.box(5, 3, 34, 17, 16, 38, serp); m.box(6, 16, 33, 16, 20, 38, serp); m.box(6, 13, 38, 16, 16, 38, C.red); m.box(5, 18, 36, 6, 19, 37, C.gold); m.box(16, 18, 36, 17, 19, 37, C.gold); for (let z = 30; z < 36; z += 2) m.box(10, 20, z, 12, 23, z + 1, C.gold); }
        return AF.meshModel(m, { vs: 1 / 16, anchor: [0.5, 0, 0.5] });
      };
      const leadG = carGeo(true), carG = carGeo(false);
      const cars = [0, 1, 2].map((i) => { const mm = AF.modelMesh(i === 0 ? leadG : carG); mm.castShadow = true; AF.scene.add(mm); return mm; });
      const st = { s: LEN * 0.05, v: 3, dwell: 0 }, CARL = 2.5, ahead = new THREE.Vector3(), q = new THREE.Vector3();
      const placeCar = (mm, s) => {
        const u = (((s / LEN) % 1) + 1) % 1, u2 = ((((s + 0.8) / LEN) % 1) + 1) % 1;
        curve.getPointAt(u, q); curve.getPointAt(u2, ahead);
        mm.position.set(q.x, hAt(u) + 0.25, q.z); ahead.y = hAt(u2) + 0.25; mm.lookAt(ahead);
      };
      const upd = (dt) => {
        const u = st.s / LEN;
        if (st.dwell > 0) { st.dwell -= dt; st.v = 0; }
        else if (u < 0.03 || u > 0.965) st.v = 3;
        else if (u < 0.255) st.v = 2.6;                                                    // chain lift (clack clack)
        else st.v = Math.max(3.2, Math.sqrt(Math.max(0, 2 * 9.81 * (23.6 - hAt(u)))) * 0.92);
        const s0 = st.s; st.s = (st.s + st.v * dt) % LEN;
        if (s0 < LEN * 0.015 && st.s >= LEN * 0.015) st.dwell = 7;                          // load at the station
        for (let i = 0; i < 3; i++) placeCar(cars[i], st.s - i * CARL);
      };
      upd(0);
      L.coaster = { cars, st, LEN, curve, hAt };
      dyn.push({ x: -270, z: 234, r: 420, update: upd });
      AF.addLabel('Sea Serpent Coaster', -270, 234, 'building');
    }

    // =============================================================== 3. THE FISH MARKET (x -142..-106, z 177..201) + Fish Pier
    {
      const X0 = -142, X1 = -106, Z0 = 177, Z1 = 201, WH = 7, CLX0 = X0 + 8, CLX1 = X1 - 8;
      // brick walls with arched windows between steel piers
      for (let y = 0.25; y < WH; y += 0.25) {
        const row = Math.floor(y * 4);
        const b = row % 8 === 0 ? C.brickD : (row % 3 ? C.brick : C.brickL);
        F(X0, y, Z0, X1, y + 0.25, Z0 + 0.5, b); F(X0, y, Z1 - 0.5, X1, y + 0.25, Z1, b);
        F(X0, y, Z0, X0 + 0.5, y + 0.25, Z1, b); F(X1 - 0.5, y, Z0, X1, y + 0.25, Z1, b);
      }
      F(X0 - 0.25, WH, Z0 - 0.25, X1 + 0.25, WH + 0.5, Z1 + 0.25, C.stone);
      for (let x = X0 + 2; x < X1 - 2; x += 4) {
        if (Math.abs(x + 1 - (X0 + X1) / 2) < 3) continue;
        for (const [za, zb] of [[Z0, Z0 + 0.5], [Z1 - 0.5, Z1]]) { F(x, 2, za, x + 2, 5.5, zb, C.glass); F(x + 0.25, 5.5, za, x + 1.75, 5.75, zb, C.glass); F(x - 0.25, 1.75, za - 0.25, x + 2.25, 2.0, zb + 0.25, C.stone); F(x - 0.25, 5.75, za - 0.25, x + 2.25, 6.0, zb + 0.25, C.stone); }
        F(x + 2.5, 0.25, Z0 - 0.25, x + 3, WH, Z0, C.steel); F(x + 2.5, 0.25, Z1, x + 3, WH, Z1 + 0.25, C.steel);
      }
      for (let z = Z0 + 3; z < Z1 - 3; z += 4) { F(X0, 2, z, X0 + 0.5, 5.5, z + 2, C.glass); F(X1 - 0.5, 2, z, X1, 5.5, z + 2, C.glass); }
      // roof: low-pitch steel on the aisles, a glazed clerestory over the nave
      for (let x = X0; x < X1; x += 0.25) {
        const inNave = x >= CLX0 && x < CLX1;
        if (!inNave) { F(x, WH + 0.5, Z0, x + 0.25, WH + 0.75, Z1, Math.floor(x * 2) % 2 ? C.steel : C.steelL); continue; }
      }
      for (let y = WH + 0.5; y < WH + 3.5; y += 0.25) { F(CLX0, y, Z0, CLX0 + 0.25, y + 0.25, Z1, (Math.floor(y * 4) % 3) ? C.glass : C.steel); F(CLX1 - 0.25, y, Z0, CLX1, y + 0.25, Z1, (Math.floor(y * 4) % 3) ? C.glass : C.steel); }
      for (let z = Z0; z < Z1; z += 3) { F(CLX0, WH + 0.5, z, CLX0 + 0.25, WH + 3.5, z + 0.25, C.steel); F(CLX1 - 0.25, WH + 0.5, z, CLX1, WH + 3.5, z + 0.25, C.steel); }
      F(CLX0 - 0.25, WH + 3.5, Z0 - 0.25, CLX1 + 0.25, WH + 3.75, Z1 + 0.25, C.steelL);
      for (let x = CLX0; x < CLX1; x += 0.25) { const k = Math.min(x - CLX0, CLX1 - x); F(x, WH + 3.75, Z0 - 0.25, x + 0.25, WH + 3.75 + Math.min(1.5, k * 0.18), Z1 + 0.25, C.steel); }
      // gable ends with the name
      F(CLX0, WH + 0.5, Z0 - 0.25, CLX1, WH + 3.5, Z0, C.brick); F(CLX0, WH + 0.5, Z1, CLX1, WH + 3.5, Z1 + 0.25, C.brick);
      LIB.wallText('FISH MARKET', C.cream, CLX1 - 1.4, WH + 0.95, Z0 - 0.25, 'n');
      LIB.wallText('FISH MARKET', C.cream, CLX0 + 1.4, WH + 0.95, Z1 + 0.25, 's');
      // floor: wet stone tiles, drains
      for (let x = X0 + 0.5; x < X1 - 0.5; x += 0.5) for (let z = Z0 + 0.5; z < Z1 - 0.5; z += 0.5) F(x, 0.25, z, x + 0.5, 0.5, z + 0.5, ((Math.floor(x * 2) + Math.floor(z * 2)) & 1) ? C.stone : c(0xc4bca8));
      // doors: big openings north (street) + south (quay), 3 m x 4 m, with open steel doors
      const DX = (X0 + X1) / 2;
      for (const [za, zb, zo] of [[Z0, Z0 + 0.5, Z0 - 1.25], [Z1 - 0.5, Z1, Z1 + 1.25]]) {
        F(DX - 1.75, 0.5, za, DX + 1.75, 4.5, zb, 0);
        F(DX - 2, 4.5, za - 0.25, DX + 2, 4.75, zb + 0.25, C.stone);
        F(DX - 1.5, 4.75, za, DX + 1.5, 5.75, zb, C.glass);
        F(DX - 1.75, 0.25, Math.min(za, zo), DX + 1.75, 0.5, Math.max(zb, zo + 0.25), C.stone);
      }
      // ice tables of fish (4 long tables), crates, scales, chalk price boards, hanging lamps
      const fishC = [c(0xc0c8d0), c(0xe07a5a), c(0x8aa0b0), c(0xd8c070), c(0xb05a6a), c(0x6a8aa8), c(0xe8e0d0)];
      const tables = [[X0 + 3, Z0 + 4], [X0 + 3, Z0 + 14], [X1 - 11, Z0 + 4], [X1 - 11, Z0 + 14]];
      for (const [tx, tz] of tables) {
        F(tx, 0.5, tz, tx + 8, 1.25, tz + 2.5, C.wood); F(tx, 1.25, tz, tx + 8, 1.5, tz + 2.5, C.ice);
        F(tx + 1, 1.5, tz + 2.25, tx + 1.75, 2.5, tz + 2.5, C.chalk); F(tx + 1.125, 2.0, tz + 2.5, tx + 1.625, 2.25, tz + 2.55, C.chalkW);
        F(tx + 5, 1.5, tz + 2.25, tx + 5.75, 2.5, tz + 2.5, C.chalk); F(tx + 5.125, 2.0, tz + 2.5, tx + 5.625, 2.25, tz + 2.55, C.chalkW);
        F(tx + 3.9, 3.0, tz + 1.1, tx + 4.1, WH, tz + 1.3, C.iron); F(tx + 3.6, 2.6, tz + 0.9, tx + 4.4, 3.0, tz + 1.5, C.brass);   // hanging scale
        AF.addSpot({ building: 'fish-market', x: tx + 2, y: 0.5, z: tz - 0.8, yaw: 0, kind: 'counter' });
        AF.addSpot({ building: 'fish-market', x: tx + 6, y: 0.5, z: tz + 3.4, yaw: Math.PI, kind: 'browse' });
      }
      // fishmonger counter along the west wall + crates of fish + barrels
      F(X0 + 0.5, 0.5, Z0 + 8, X0 + 1.5, 1.5, Z1 - 8, C.woodD); F(X0 + 0.5, 1.5, Z0 + 8, X0 + 1.75, 1.75, Z1 - 8, C.ice);
      for (let z = Z0 + 8.25; z < Z1 - 8.25; z += 0.75) F(X0 + 0.75, 1.75, z, X0 + 1.5, 2.0, z + 0.5, fishC[(Math.floor(z * 3)) % fishC.length]);
      for (let i = 0; i < 10; i++) { const x = X1 - 3 + (i % 2) * 1, z = Z0 + 2 + Math.floor(i / 2) * 1.25, y = 0.5; F(x, y, z, x + 0.75, y + 0.5, z + 1, C.wood); F(x + 0.125, y + 0.5, z + 0.125, x + 0.625, y + 0.625, z + 0.875, fishC[i % fishC.length]); }
      for (let x = CLX0 + 1; x < CLX1 - 1; x += 4) for (const z of [Z0 + 6, Z0 + 12, Z0 + 18]) { F(x + 0.4, WH - 1.75, z + 0.4, x + 0.6, WH + 0.5, z + 0.6, C.iron); F(x, WH - 2.25, z, x + 1, WH - 1.75, z + 1, C.lampA); }
      for (const z of [Z0 + 6, Z0 + 16]) AF.addLight({ x: DX, y: 5, z, color: 0xffe6c0, intensity: 1.5, range: 16, kind: 'interior' });
      AF.addBuilding({ id: 'fish-market', name: 'Solace Fish Market', kind: 'market', box: [X0, 0.25, Z0, X1, WH + 5, Z1], doors: [{ x: DX, y: 0.25, z: Z0 - 1.25, yaw: 0 }, { x: DX, y: 0.25, z: Z1 + 1.25, yaw: Math.PI }], floors: [0.5], interior: true, owner: 'land-harbour' });
      L.fishMarket = { X0, X1, Z0, Z1, DX };
      // outside: net-drying racks, lobster pots, barrels (between the hall and the Fish Pier)
      for (let i = 0; i < 4; i++) {
        const rx = -102 + i * 4.5, rz = 182;
        F(rx, 0.25, rz, rx + 0.25, 3, rz + 0.25, C.woodD); F(rx + 3, 0.25, rz, rx + 3.25, 3, rz + 0.25, C.woodD); F(rx, 3, rz, rx + 3.25, 3.25, rz + 0.25, C.woodD);
        for (let x = rx + 0.25; x < rx + 3; x += 0.25) for (let y = 1.0; y < 3; y += 0.25) if (((Math.floor(x * 4) + Math.floor(y * 4)) & 1) === 0) W.setM(x, y, rz, i % 2 ? C.net : C.netB);
      }
      for (let i = 0; i < 14; i++) { const x = -100 + (i % 7) * 1.1, z = 195 + Math.floor(i / 7) * 1.1 + (i % 2) * 0.2; F(x, 0.25, z, x + 0.75, 0.75, z + 0.75, (i % 3) ? C.netB : C.woodD); F(x + 0.25, 0.75, z + 0.25, x + 0.5, 0.8, z + 0.5, C.rope); }
      for (let i = 0; i < 6; i++) { const x = -70 + (i % 3) * 1.1, z = 198 + Math.floor(i / 3) * 1.1; F(x, 0.25, z, x + 0.75, 1.25, z + 0.75, C.wood); F(x, 0.5, z, x + 0.75, 0.625, z + 0.75, C.iron); F(x, 1.0, z, x + 0.75, 1.125, z + 0.75, C.iron); }
      for (let i = 0; i < 3; i++) { const x = -64 + i * 3; LIB.bench(x, 0.25, COAST - 2.5, 0); }
    }
    { // THE CRAB SHACK: a little weatherboard seafood stand with a lobster sign, picnic tables
      const sx = -66, sz = 180, wb = c(0x5a8aa0), wbD = c(0x4a7a90);
      for (let y = 0.25; y < 3.5; y += 0.25) W.walls(sx, y, sz, sx + 8, y + 0.25, sz + 5, Math.floor(y * 4) % 2 ? wb : wbD, 0.25);
      F(sx + 1, 1.25, sz + 4.75, sx + 7, 2.75, sz + 5, 0); F(sx + 1, 1.0, sz + 4.75, sx + 7, 1.25, sz + 5.5, C.white);
      F(sx + 0.25, 0.25, sz + 0.25, sx + 7.75, 0.5, sz + 4.75, C.plankD); F(sx + 1, 0.5, sz + 1, sx + 3, 1.5, sz + 2, C.ice);
      for (let x = sx - 0.5; x < sx + 8.5; x += 0.25) { const k = Math.round((x - sx) * 4); F(x, 3.5, sz - 0.5, x + 0.25, 3.75, sz + 6, (k >> 2) % 2 ? C.red : C.white); }
      F(sx + 3, 3.5, sz + 1.5, sx + 5, 4.75, sz + 3, C.red); F(sx + 3.25, 4.75, sz + 1.75, sx + 4.75, 5.0, sz + 2.75, C.red);   // lobster
      F(sx + 3.5, 2.75, sz + 2.5, sx + 4.5, 3.25, sz + 3.5, C.lampA);
      put(LIB.sign('CRAB SHACK', C.cream, C.red, 1 / 16), sx + 4, 3.75, sz + 6.05, 0, false);
      AF.addSpot({ building: null, x: sx + 4, y: 0.5, z: sz + 3.6, yaw: 0, kind: 'counter' });
      for (let i = 0; i < 3; i++) { const tx = sx - 1 + i * 4, tz = sz + 9; F(tx, 0.25, tz, tx + 2.5, 1.0, tz + 1.25, C.wood); F(tx, 0.25, tz - 0.75, tx + 2.5, 0.75, tz - 0.5, C.woodD); F(tx, 0.25, tz + 1.75, tx + 2.5, 0.75, tz + 2.0, C.woodD); AF.addSpot({ building: null, x: tx + 1.25, y: 0.75, z: tz - 0.6, yaw: 0, kind: 'sit' }); }
    }
    // Fish Pier + 3 moored fishing boats (bobbing)
    const FP = PIER.fish;
    {
      LIB.pier(FP.x0, FP.x1, FP.z1, { gaps: [['w', COAST + 6, FP.z1 - 2], ['e', COAST + 22, FP.z1 - 2]] });
      for (let z = COAST + 5; z < FP.z1 - 1; z += 8) { put(LIB.bollardGeo(), FP.x0 + 0.5, 0.25, z, 0, true); put(LIB.bollardGeo(), FP.x1 - 0.5, 0.25, z + 4, 0, true); }
      for (let z = COAST + 5; z < FP.z1 - 1; z += 16) AF.addSpot({ building: null, x: FP.x0 + 0.5, y: 0.85, z, yaw: 0, kind: 'gull' });
      for (const pp of [PIER.pleasure, PIER.ferry]) for (let z = COAST + 9; z < pp.z1 - 2; z += 13) { AF.addSpot({ building: null, x: pp.x0 + 0.12, y: 1.25, z, yaw: -Math.PI / 2, kind: 'gull' }); AF.addSpot({ building: null, x: pp.x1 - 0.12, y: 1.25, z: z + 6, yaw: Math.PI / 2, kind: 'gull' }); }
      for (let z = COAST + 8; z < FP.z1; z += 12) LIB.lamp((FP.x0 + FP.x1) / 2, 0.25, z);
      for (let i = 0; i < 6; i++) { const z = COAST + 10 + i * 4; F(FP.x0 + 3, 0.25, z, FP.x0 + 3.75, 0.75, z + 0.75, i % 2 ? C.woodD : C.netB); }
      AF.addSpot({ building: null, x: FP.x1 - 1, y: 0.25, z: FP.z1 - 2, yaw: Math.PI, kind: 'fish' });
      AF.addLabel(FP.name, (FP.x0 + FP.x1) / 2, FP.z1 - 4, 'place');
      const boatGeo = (hullC, stripe, cabinC) => {
        const m = new AF.Model(28, 44, 80), wood = C.wood;
        for (let z = 0; z < 80; z++) {
          const t = z / 79, bow = t > 0.72 ? 1 - (t - 0.72) / 0.28 : 1, stern = t < 0.08 ? 0.85 + t * 1.9 : 1;
          const half = 13 * Math.pow(Math.max(0.05, bow), 0.6) * Math.min(1, stern);
          for (let y = 0; y < 14 + Math.round((t > 0.7 ? (t - 0.7) * 12 : 0)); y++) {
            const hw = half * (0.55 + 0.45 * Math.min(1, y / 7));
            for (let x = Math.floor(14 - hw); x < Math.ceil(14 + hw); x++) {
              const edge = x <= 14 - hw + 1 || x >= 14 + hw - 1 || y === 0;
              if (!edge && y > 1) continue;
              m.set(x, y, z, y < 3 ? C.iron : y > 10 ? stripe : hullC);
            }
          }
          for (let x = Math.floor(14 - half * 0.9); x < Math.ceil(14 + half * 0.9); x++) m.set(x, 9, z, wood);
        }
        m.box(8, 10, 12, 20, 28, 28, cabinC); m.box(9, 20, 11, 19, 25, 12, C.glass); m.box(7, 28, 11, 21, 30, 29, C.navy);
        m.box(13, 30, 16, 15, 44, 18, C.woodD); m.box(13, 36, 18, 15, 37, 50, C.woodD);          // mast + boom
        m.box(10, 10, 40, 18, 13, 52, C.netB); m.box(11, 13, 42, 17, 15, 50, C.net);             // net pile
        m.box(12, 10, 60, 16, 14, 64, C.red);                                                      // float
        return AF.meshModel(m, { vs: 1 / 8, anchor: [0.5, 0, 0.5] });
      };
      const BG = [boatGeo(C.red, C.white, C.cream), boatGeo(c(0x2a5a8a), C.white, C.white), boatGeo(c(0x2f6a4a), C.cream, c(0xe8dcc0))];
      const spots = [[FP.x0 - 2.6, COAST + 12, 0], [FP.x0 - 2.6, COAST + 26, 1], [FP.x1 + 2.6, COAST + 30, 2]];
      for (const [bx, bz, k] of spots) {
        const bm = AF.modelMesh(BG[k]); bm.position.set(bx, SEA_Y - 0.3, bz); bm.rotation.y = k === 1 ? Math.PI : 0; AF.scene.add(bm);
        const b = { m: bm, x: bx, z: bz, ph: k * 1.7, y0: SEA_Y - 0.3, yaw: bm.rotation.y };
        HR.boats.push(b);
        dyn.push({ x: bx, z: bz, r: 150, update(dt, t) { bm.position.y = b.y0 + Math.sin(t * 0.9 + b.ph) * 0.08; bm.rotation.z = Math.sin(t * 0.7 + b.ph) * 0.035; bm.rotation.x = Math.sin(t * 0.5 + b.ph * 2) * 0.02; } });
      }
      { // a fourth boat putters out past the breakwater and back on a slow loop
        const bm = AF.modelMesh(BG[0]); AF.scene.add(bm);
        const path = new THREE.CatmullRomCurve3([[-80,232],[-70,280],[-80,330],[-130,370],[-175,345],[-165,285],[-120,245]].map(([x, z]) => new THREE.Vector3(x, 0, z)), true, 'centripetal');
        const len = path.getLength(), st = { s: 0 }, sm = LIB.smoke(4, 0x8a8a90, 0.9, 3);
        const upd = (dt, t) => { st.s = (st.s + dt * 2.6) % len; const u = st.s / len, p = path.getPointAt(u), tg = path.getTangentAt(u);
          bm.position.set(p.x, SEA_Y - 0.3 + Math.sin(t * 1.2) * 0.1, p.z); bm.rotation.y = Math.atan2(tg.x, tg.z); bm.rotation.z = Math.sin(t * 0.9) * 0.05; bm.rotation.x = Math.sin(t * 0.7) * 0.03;
          sm.update(dt, t, p.x - tg.x * 2, SEA_Y + 3.4, p.z - tg.z * 2, 0.8); };
        upd(0, 0); dyn.push({ x: 0, z: 0, r: 1e9, always: true, update: upd });
        HR.boats.push({ m: bm, moving: true, path }); L.puttBoat = { bm, st };
      }
    }

    // =============================================================== 4. HARBOUR SQUARE (x -40..40): setts, harbourmaster + clock tower, kiosk, anchor, flags
    {
      { // v2 r2: a brass-and-granite COMPASS ROSE inlaid in the setts round the anchor (8 split-shaded points, 2 brass rings)
        const roseD = c(0x34383e, { jitter: 0.2, edge: 0.4, rough: 0.35 }), roseL = c(0xe2dccc, { jitter: 0.2, edge: 0.4, rough: 0.35 }), roseB = c(0xc09a4a, { jitter: 0.2, edge: 0.3, metal: 0.85, rough: 0.3 }), roseR = c(0x9a2c24, { jitter: 0.2, edge: 0.4 });
        paint(-40, 173.5, 40, COAST, (x, z, bx, bz) => {
          const dx = x + 0.125, dz = z + 0.125 - 190, r = Math.hypot(dx, dz);
          if (r < 11.2) {
            if (r > 10.6) return roseB; if (r > 10.2) return roseD;
            const a = Math.atan2(dz, dx), k = Math.round(a / (Math.PI / 4)), da = a - k * Math.PI / 4, card = (k & 1) === 0;
            const T = card ? 10.1 : 7.2, w = (1 - r / T) * (card ? 1.7 : 1.2);
            if (r < T && Math.abs(da) * r < w) return (k === -2 && da < 0) || (k === -2 && da >= 0) ? (da < 0 ? roseR : roseL) : (da < 0 ? roseD : roseL);
            if (r > 5.0 && r < 5.5) return roseB;
            return (hash(bx, bz) < 0.5) ? C.settsL : c(0xb8b0a0, { jitter: 0.8 });
          }
          const h = hash(bx >> 1, bz >> 1); return h < 0.3 ? C.settsD : h < 0.75 ? C.setts : C.settsL; });
      }
      // anchor monument on a granite plinth
      F(-1.5, 0.25, 188.5, 1.5, 1.25, 191.5, C.stoneD); F(-1.25, 1.25, 188.75, 1.25, 1.5, 191.25, C.stone);
      {
        // v2: a proper 3D bronze anchor (stock across the arms, crown, ring) with its chain draped to the plinth
        const m = new AF.Model(34, 46, 16), br = c(0x8a6a3a, { jitter: 0.35, metal: 0.9, rough: 0.4 }), pat = c(0x5a8a78, { jitter: 0.4 }), ir = c(0x2e3236, { jitter: 0.2 });
        const bz = (x, y, z) => (hash(x * 7 + z, y) < 0.05 ? pat : br);
        for (let y = 7; y < 36; y++) for (let x = 15; x < 19; x++) for (let z = 6; z < 10; z++) m.set(x, y, z, bz(x, y, z));      // shank
        m.box(8, 31, 7, 26, 33, 9, ir); m.box(7, 30, 6, 9, 34, 10, ir); m.box(25, 30, 6, 27, 34, 10, ir);                                 // stock (iron)
        for (let a = 0; a <= Math.PI; a += 0.02) { const x = 17 + Math.cos(a) * 12, y = 13 - Math.sin(a) * 8; for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (let z = 6; z < 10; z++) m.set(Math.round(x + dx), Math.round(y + dy), z, bz(Math.round(x), Math.round(y), z)); }
        for (const [fx, s] of [[5, 1], [29, -1]]) for (let y = 11; y < 18; y++) { const w = Math.round((18 - y) * 0.3); for (let x = fx - w; x <= fx + w; x++) for (let z = 7; z < 9; z++) m.set(x, y, z, bz(x, y, z)); void s; }   // flukes
        m.sphere(17, 6, 8, 3, br);                                                                                               // crown
        for (let a = 0; a < TAU; a += 0.08) for (let z = 7; z < 9; z++) m.set(Math.round(17 + Math.cos(a) * 3.5), Math.round(40 + Math.sin(a) * 3.5), z, ir);   // ring
        for (let i = 0; i < 26; i++) { const k = i / 25, x = 14 - k * 13, y = 38 - 38 * k + Math.sin(k * Math.PI) * -3, z = 8; if (i % 2) m.box(Math.round(x) - 1, Math.round(y), z - 1, Math.round(x) + 1, Math.round(y) + 1, z + 1, ir); else m.box(Math.round(x), Math.round(y) - 1, z, Math.round(x) + 1, Math.round(y) + 1, z + 1, ir); }
        put(geo(m, 1 / 8, [0.5, 0, 0.5]), 0, 1.5, 190, 0, true);
        for (const [qx, qz] of [[-3, 187], [3, 187], [-3, 193], [3, 193]]) put(LIB.bollardGeo(), qx, 0.25, qz, 0, true);
        for (const [x0, z0, x1, z1] of [[-3, 187.25, 3, 187.25], [-3, 193.25, 3, 193.25]]) for (let k = 0; k <= 24; k++) { const u = k / 24; W.setM(x0 + (x1 - x0) * u, 0.75 - Math.sin(u * Math.PI) * 0.35, z0, c(0x2e3236, { jitter: 0.2 })); }
        const pl = LIB.sign('LOST AT SEA 1934', C.gold, c(0x3a3a3a), 1 / 24); put(pl, 0, 0.55, 191.55, 0, false);
      }
      for (const [bx, bz] of [[-8, 186], [8, 186], [-8, 194], [8, 194]]) LIB.bench(bx, 0.25, bz, bz < 190 ? 0 : 2);
      for (const [lx, lz] of [[-12, 182], [12, 182], [-12, 204], [12, 204]]) LIB.lamp(lx, 0.25, lz);
      // planters with autumn flowers, a cannon, a newsstand, a telescope for the view
      const flowerC = [c(0xd84a3a, { solid: false }), c(0xe8a030, { solid: false }), c(0xf2d060, { solid: false }), c(0x8a3a8a, { solid: false })], leaf = c(0x4a7a3a, { solid: false });
      for (const [px, pz] of [[-20, 200], [-6, 200], [6, 200], [20, 200], [-14, 176], [14, 176], [30, 182], [30, 188]]) {
        F(px - 1, 0.25, pz - 1, px + 1, 1.0, pz + 1, C.stoneD); F(px - 0.75, 1.0, pz - 0.75, px + 0.75, 1.25, pz + 0.75, leaf);
        for (let i = 0; i < 6; i++) W.setM(px - 0.75 + hash(px * 3 + i, pz) * 1.5, 1.25, pz - 0.75 + hash(pz * 5 + i, px) * 1.5, flowerC[(i + (px | 0)) & 3]);
      }
      F(-26, 0.25, 203, -24, 0.75, 205, C.woodD); F(-25.25, 0.75, 203.25, -24.75, 1.5, 206.5, C.iron);
      F(18, 0.25, 204.5, 18.25, 1.25, 204.75, C.brass); F(17.75, 1.25, 204.25, 18.5, 1.5, 205.25, C.brass);
      AF.addInteract && AF.addInteract({ x: 18, y: 1.3, z: 204.5, r: 2, label: 'Look through the telescope', act: () => AF.emit('toast', 'Out past the breakwater the Solace Point Light turns slowly; a tug butts a freighter toward Pier 9.') });
      { // newsstand
        const m = new AF.Model(20, 22, 12); m.box(0, 0, 0, 20, 8, 12, C.green || c(0x2f6a4a)); m.box(0, 8, 10, 20, 18, 12, c(0x2f6a4a)); m.box(0, 18, -2, 20, 20, 12, c(0x2f6a4a));
        for (let x = 1; x < 19; x += 2) for (let y = 9; y < 17; y += 3) m.box(x, y, 9, x + 2, y + 2, 10, [C.white, C.cream, C.red, C.gold][(x + y) & 3]);
        m.box(0, 20, -2, 20, 22, 0, C.gold);
        put(geo(m, 1 / 8), 30, 0.25, 176.5, 0, true); AF.addSpot({ building: null, x: 30, y: 0.25, z: 177.9, yaw: Math.PI, kind: 'counter' });
      }
      // HARBOURMASTER'S OFFICE x -36..-16, z 176..192 (2 storeys, cream + navy trim) + clock tower at the SE corner
      const X0 = -36, X1 = -16, Z0 = 176, Z1 = 192, S1 = 4.25, S2 = 8.25;
      const wallC = c(0xf2e8d2, { jitter: 0.25 }), baseC = c(0x3a3e44, { jitter: 0.3 });
      W.walls(X0, 0.25, Z0, X1, S2, Z1, wallC, 0.5);
      F(X0 - 0.25, 0.25, Z0 - 0.25, X1 + 0.25, 1.25, Z1 + 0.25, baseC);
      F(X0 + 0.5, 0.25, Z0 + 0.5, X1 - 0.5, 0.5, Z1 - 0.5, C.plankD);
      F(X0 + 0.5, S1, Z0 + 0.5, X1 - 0.5, S1 + 0.25, Z1 - 0.5, C.plank);
      F(X0 - 0.25, S1, Z0 - 0.25, X1 + 0.25, S1 + 0.25, Z1 + 0.25, C.navy);
      F(X0 - 0.5, S2, Z0 - 0.5, X1 + 0.5, S2 + 0.5, Z1 + 0.5, C.navy); F(X0, S2 + 0.5, Z0, X1, S2 + 1.25, Z1, wallC); F(X0 - 0.25, S2 + 1.25, Z0 - 0.25, X1 + 0.25, S2 + 1.5, Z1 + 0.25, C.cream);
      for (const [yy] of [[1.5], [5.25]]) {
        for (let x = X0 + 1.5; x < X1 - 5; x += 3) { for (const [za, zb] of [[Z0, Z0 + 0.5], [Z1 - 0.5, Z1]]) { F(x, yy, za, x + 1.5, yy + 2, zb, C.glass); F(x - 0.25, yy - 0.25, za - 0.25, x + 1.75, yy, zb + 0.25, C.navy); } }
        for (let z = Z0 + 2; z < Z1 - 2; z += 3.5) { F(X0, yy, z, X0 + 0.5, yy + 2, z + 1.5, C.glass); }
      }
      // porthole windows + door on the east (facing the square)
      const DZ = 181;
      F(X1 - 0.5, 0.5, DZ - 1, X1, 3.25, DZ + 1, 0); F(X1, 3.25, DZ - 1.25, X1 + 0.25, 3.5, DZ + 1.25, C.navy); F(X1, 0.25, DZ - 1.5, X1 + 1, 0.5, DZ + 1.5, C.stone);
      F(X1, 3.75, DZ - 1.75, X1 + 1.5, 4.0, DZ + 1.75, C.navy);                                   // canopy
      LIB.wallText('HARBOURMASTER', C.navy, X0 + 1.25, S2 + 0.5 - 0.1, Z0 - 0.25, 'n', { spacing: 1 });
      // interior: chart table, desk, telescope at the south window, ship's wheel on the wall, lamps
      F(X0 + 2, 0.5, Z0 + 3, X0 + 5, 1.5, Z0 + 5, C.wood); F(X0 + 2, 1.5, Z0 + 3, X0 + 5, 1.55, Z0 + 5, c(0xe8dcb8));
      F(X0 + 8, 0.5, Z0 + 2, X0 + 11, 1.25, Z0 + 3, C.woodD); F(X0 + 9, 0.5, Z0 + 4, X0 + 10, 1.25, Z0 + 5, C.red);
      F(X1 - 4, 0.5, Z1 - 2, X1 - 3.75, 1.75, Z1 - 1.75, C.brass); F(X1 - 4.5, 1.75, Z1 - 2.25, X1 - 3.25, 2.0, Z1 - 1.5, C.brass);
      for (let a = 0; a < TAU; a += 0.2) W.setM(X0 + 0.55, 2.5 + Math.sin(a) * 0.75, Z0 + 8 + Math.cos(a) * 0.75, C.wood);
      for (const x of [X0 + 5, X1 - 6]) { F(x, S1 - 0.25, Z0 + 7, x + 1, S1, Z0 + 8, C.lampA); F(x, S2 - 0.25, Z0 + 7, x + 1, S2, Z0 + 8, C.lampA); }
      AF.addLight({ x: (X0 + X1) / 2, y: 3, z: (Z0 + Z1) / 2, color: 0xffe0b0, intensity: 1.2, range: 13, kind: 'interior' });
      { // furnish the office: rug, big chart table, wall charts, flag locker, stove, ship model, desk lamp, logbook shelf
        const rug = c(0x7a2a2a, { jitter: 0.3 }), rugB = c(0xc89a4a, { jitter: 0.3 }), chart = c(0xd8e4e0, { jitter: 0.2 }), sea = c(0x9ac0c8, { jitter: 0.3 }), land = c(0xe0cc98, { jitter: 0.2 });
        for (let x = X0 + 7; x < X1 - 6; x += 0.25) for (let z = Z0 + 6; z < Z1 - 3; z += 0.25) F(x, 0.25, z, x + 0.25, 0.5, z + 0.25, (x < X0 + 7.5 || x >= X1 - 6.5 || z < Z0 + 6.5 || z >= Z1 - 3.5) ? rugB : rug);
        // big chart table (centre) with a harbour chart, brass dividers and a lamp
        F(X0 + 9, 0.5, Z0 + 8, X0 + 9.25, 1.5, Z0 + 8.25, C.woodD); F(X0 + 13.75, 0.5, Z0 + 8, X0 + 14, 1.5, Z0 + 8.25, C.woodD); F(X0 + 9, 0.5, Z0 + 11.25, X0 + 9.25, 1.5, Z0 + 11.5, C.woodD); F(X0 + 13.75, 0.5, Z0 + 11.25, X0 + 14, 1.5, Z0 + 11.5, C.woodD);
        F(X0 + 8.75, 1.5, Z0 + 7.75, X0 + 14.25, 1.75, Z0 + 11.75, C.wood);
        for (let x = X0 + 9; x < X0 + 14; x += 0.25) for (let z = Z0 + 8; z < Z0 + 11.5; z += 0.25) W.setM(x, 1.75, z, hash(Math.floor(x * 1.3), Math.floor(z * 1.1)) < 0.35 && x < X0 + 11 ? land : ((Math.floor(x * 4) + Math.floor(z * 4)) % 9 === 0 ? chart : sea));
        W.setM(X0 + 12, 2.0, Z0 + 9, C.brass); W.setM(X0 + 12.25, 2.0, Z0 + 9.25, C.brass);
        F(X0 + 10, 0.5, Z0 + 12.5, X0 + 10.75, 1.25, Z0 + 13.25, C.woodD); AF.addSpot({ building: 'harbourmaster', x: X0 + 11.5, y: 0.5, z: Z0 + 12.4, yaw: Math.PI, kind: 'stand', path: [[X1 + 1.3, DZ], [X1 - 2, DZ], [X0 + 7.5, DZ + 0.5], [X0 + 7.5, Z0 + 12.4], [X0 + 11.5, Z0 + 12.4]] });
        // wall charts on the west wall between the windows
        for (const zc of [180.5, 184, 187.5]) { F(X0 + 0.5, 1.5, zc - 0.75, X0 + 0.75, 3.5, zc + 0.75, C.cream); F(X0 + 0.75, 1.75, zc - 0.5, X0 + 0.8, 3.25, zc + 0.5, sea); F(X0 + 0.8, 2.25, zc - 0.25, X0 + 0.85, 2.75, zc + 0.25, land); }
        // signal-flag locker (north wall, east end): a grid of cubbies full of rolled flags
        const fl = [C.red, C.gold, C.navy, C.white, c(0x2a8a4a), c(0xd86a2a)];
        F(X1 - 5, 0.5, Z0 + 0.5, X1 - 1, 3.25, Z0 + 1.25, C.woodD);
        for (let i = 0; i < 5; i++) for (let j = 0; j < 4; j++) F(X1 - 4.75 + i * 0.75, 0.75 + j * 0.625, Z0 + 1.0, X1 - 4.25 + i * 0.75, 1.125 + j * 0.625, Z0 + 1.3, fl[(i + j * 2) % 6]);
        // cast-iron stove with a flue + a coal scuttle
        F(X0 + 1, 0.5, Z1 - 3.5, X0 + 2.25, 1.75, Z1 - 2.25, C.black); F(X0 + 1.25, 0.75, Z1 - 2.25, X0 + 2, 1.25, Z1 - 2.2, AF.col(0xff9040, { emit: 0xff7020, emitK: 2, mode: 'always' }));
        F(X0 + 1.5, 1.75, Z1 - 3.1, X0 + 1.75, S1, Z1 - 2.85, C.black); F(X0 + 2.5, 0.5, Z1 - 2.5, X0 + 3, 0.875, Z1 - 2, C.iron);
        // ship model in a glass case on a plinth
        F(X0 + 5, 0.5, Z1 - 2.5, X0 + 8, 1.5, Z1 - 1.25, C.woodD);
        for (let x = X0 + 5.25; x < X0 + 7.75; x += 0.125) { const t2 = (x - X0 - 5.25) / 2.5, w = 0.25 * Math.sin(Math.PI * Math.min(1, t2 * 1.3)); F(x, 1.5, Z1 - 1.875 - w, x + 0.125, 1.75, Z1 - 1.875 + w + 0.01, t2 > 0.1 ? C.black : C.red); }
        for (const mx of [X0 + 5.9, X0 + 6.6, X0 + 7.2]) { F(mx, 1.75, Z1 - 1.9, mx + 0.0625, 2.75, Z1 - 1.85, C.woodD); F(mx - 0.25, 2.2, Z1 - 1.95, mx + 0.3, 2.55, Z1 - 1.9, C.cream); }
        // desk lamp + papers + logbook shelf behind the desk
        F(X0 + 10.25, 1.25, Z0 + 2.25, X0 + 10.5, 1.75, Z0 + 2.5, AF.col(0x3a8a5a, { emit: 0xffd080, emitK: 1.5, mode: 'always' })); F(X0 + 8.5, 1.25, Z0 + 2.25, X0 + 9.5, 1.3, Z0 + 2.75, C.cream);
        F(X0 + 8, 0.5, Z0 + 0.5, X0 + 12, 3.0, Z0 + 1.0, C.woodD); for (let y = 0.75; y < 3; y += 0.75) for (let x = X0 + 8.1; x < X0 + 11.9; x += 0.25) F(x, y, Z0 + 0.6, x + 0.2, y + 0.5, Z0 + 0.95, [C.red, C.navy, c(0x2a6a3a), c(0x6a4a2a)][Math.floor(x * 4 + y) % 4]);
        // brass telescope on a tripod at the south window
        F(X1 - 7, 0.5, Z1 - 1.75, X1 - 6.875, 1.5, Z1 - 1.625, C.brass); F(X1 - 7.5, 0.5, Z1 - 2.5, X1 - 7.375, 1.5, Z1 - 2.375, C.brass); F(X1 - 6.5, 0.5, Z1 - 2.5, X1 - 6.375, 1.5, Z1 - 2.375, C.brass);
        for (let k = 0; k < 8; k++) F(X1 - 7.1, 1.5 + k * 0.08, Z1 - 2.6 + k * 0.15, X1 - 6.85, 1.75 + k * 0.08, Z1 - 2.35 + k * 0.15, C.brass);
        // east half (by the door): public counter + bell, waiting bench, notice board, filing cabinets, coat stand, barometer, tide board, painting, life ring, palm
        F(X1 - 6, 0.5, Z0 + 7, X1 - 5.25, 1.75, Z1 - 5, C.wood); F(X1 - 6.25, 1.75, Z0 + 6.75, X1 - 5, 2.0, Z1 - 4.75, C.plankL);
        F(X1 - 5.75, 2.0, Z0 + 8, X1 - 5.5, 2.25, Z0 + 8.25, C.brass); F(X1 - 6, 2.0, Z0 + 10, X1 - 5.5, 2.25, Z0 + 10.5, C.cream);
        AF.addSpot({ building: 'harbourmaster', x: X1 - 6.9, y: 0.5, z: Z0 + 9, yaw: Math.PI / 2, kind: 'counter' });
        F(X1 - 3.5, 0.5, Z0 + 0.75, X1 - 1, 1.0, Z0 + 1.5, C.woodD); F(X1 - 3.5, 1.0, Z0 + 0.5, X1 - 1, 1.75, Z0 + 0.75, C.woodD);
        AF.addSpot({ building: 'harbourmaster', x: X1 - 2.2, y: 1.0, z: Z0 + 1.2, yaw: 0, kind: 'sit' });
        F(X1 - 0.75, 1.5, Z0 + 6, X1 - 0.5, 3.25, Z0 + 9, C.woodD); for (let i = 0; i < 6; i++) F(X1 - 1.0, 1.75 + (i % 2) * 0.75, Z0 + 6.25 + (i >> 1) * 0.9, X1 - 0.75, 2.25 + (i % 2) * 0.75, Z0 + 6.75 + (i >> 1) * 0.9, [C.cream, C.white, c(0xe8d8a8)][i % 3]);
        for (let i = 0; i < 3; i++) { F(X1 - 1.5, 0.5, Z1 - 7 + i * 0.9, X1 - 0.5, 1.75, Z1 - 6.25 + i * 0.9, c(0x6a7478)); F(X1 - 1.75, 1.0, Z1 - 6.75 + i * 0.9, X1 - 1.5, 1.25, Z1 - 6.5 + i * 0.9, C.brass); }
        F(X1 - 2.5, 0.5, Z0 + 3, X1 - 2.25, 2.5, Z0 + 3.25, C.woodD); F(X1 - 2.75, 2.25, Z0 + 2.75, X1 - 2.0, 2.5, Z0 + 3.5, C.woodD); F(X1 - 2.75, 1.5, Z0 + 2.75, X1 - 2.5, 2.25, Z0 + 3.25, C.navy);
        for (let a2 = 0; a2 < TAU; a2 += 0.3) W.setM(X1 - 0.75, 2.75 + Math.sin(a2) * 0.4, Z0 + 11 + Math.cos(a2) * 0.4, C.brass);
        F(X1 - 0.75, 2.25, Z0 + 12.25, X1 - 0.5, 3.75, Z0 + 14, C.chalk); for (let r = 0; r < 4; r++) F(X1 - 0.75, 2.5 + r * 0.25, Z0 + 12.5, X1 - 0.5, 2.75 + r * 0.25, Z0 + 12.75 + r * 0.25, C.chalkW);
        { const zA = Z1 - 0.75, zB = Z1 - 0.5; F(X1 - 5, 1.75, zA, X1 - 1.5, 3.75, zB, C.gold); F(X1 - 4.75, 2.0, zA, X1 - 1.75, 3.5, zB, c(0x8ab8d0)); F(X1 - 4.75, 2.0, zA, X1 - 1.75, 2.5, zB, C.navy);
          F(X1 - 4.0, 2.5, zA, X1 - 2.5, 2.75, zB, C.woodD); F(X1 - 3.5, 2.75, zA, X1 - 3.25, 3.5, zB, C.woodD); F(X1 - 4.0, 2.75, zA, X1 - 3.5, 3.25, zB, C.white); F(X1 - 3.25, 2.75, zA, X1 - 2.75, 3.25, zB, C.white); }
        for (let a2 = 0; a2 < TAU; a2 += 0.2) { const on = Math.floor(a2 / (TAU / 8)) % 2; W.setM(X1 - 7 + Math.cos(a2) * 0.55, 2.6 + Math.sin(a2) * 0.55, Z1 - 0.75, on ? C.red : C.white); }
        F(X1 - 1.5, 0.5, Z1 - 1.5, X1 - 0.75, 1.25, Z1 - 0.75, c(0xa85a3a)); F(X1 - 1.25, 1.25, Z1 - 1.25, X1 - 1.0, 1.75, Z1 - 1.0, C.woodD); F(X1 - 1.75, 1.75, Z1 - 1.75, X1 - 0.5, 2.25, Z1 - 0.5, c(0x3f7a3a, { solid: false }));
        F(X1 - 5, S1 - 0.25, Z0 + 13, X1 - 4, S1, Z0 + 14, C.lampA); AF.addLight({ x: X1 - 4, y: 3.4, z: Z0 + 11, color: 0xffe0b0, intensity: 1.4, range: 12, kind: 'interior' });
        AF.addLight({ x: X0 + 11, y: 3.4, z: Z0 + 9, color: 0xffd8a0, intensity: 1.6, range: 14, kind: 'interior' });
        for (const [lx, lz] of [[X0 + 11, Z0 + 9], [X0 + 3, Z0 + 12], [X1 - 5, Z0 + 12]]) { F(lx - 0.5, S1 - 0.25, lz - 0.5, lx + 0.5, S1, lz + 0.5, C.lampA); }
      }
      AF.addBuilding({ id: 'harbourmaster', name: "Harbourmaster's Office", kind: 'office', box: [X0, 0.25, Z0, X1, 18, Z1], doors: [{ x: X1 + 1.3, y: 0.25, z: DZ, yaw: -Math.PI / 2 }], floors: [0.5], interior: true, owner: 'land-harbour' });
      AF.addSpot({ building: 'harbourmaster', x: X0 + 9.5, y: 0.5, z: Z0 + 4.2, yaw: Math.PI, kind: 'work', path: [[X1 + 1.3, DZ], [X1 - 2, DZ], [X0 + 9.5, Z0 + 5.5], [X0 + 9.5, Z0 + 4.2]] });
      AF.addSpot({ building: 'harbourmaster', x: X0 + 3.5, y: 0.5, z: Z0 + 5.8, yaw: Math.PI, kind: 'stand', path: [[X1 + 1.3, DZ], [X1 - 2, DZ], [X0 + 3.5, Z0 + 6.5]] });
      // clock tower: 4.5 m square to 16 m, clock faces at 12.5 m, copper cap + weather vane
      const TX0 = X1 - 4.5, TZ0 = Z1 - 4.5, TX1 = X1 + 0.25, TZ1 = Z1 + 0.25, TT = 16;
      for (let y = S2 + 1.5; y < TT; y += 0.25) { const b = Math.floor(y * 4) % 12 === 0 ? C.navy : wallC; W.walls(TX0, y, TZ0, TX1, y + 0.25, TZ1, b, 0.5); }
      F(TX0 - 0.25, TT, TZ0 - 0.25, TX1 + 0.25, TT + 0.5, TZ1 + 0.25, C.navy);
      const copper = c(0x5aa08a, { jitter: 0.5 });
      for (let i = 0; i < 9; i++) F(TX0 + i * 0.25, TT + 0.5 + i * 0.25, TZ0 + i * 0.25, TX1 - i * 0.25, TT + 0.75 + i * 0.25, TZ1 - i * 0.25, copper);
      F((TX0 + TX1) / 2 - 0.125, TT + 2.75, (TZ0 + TZ1) / 2 - 0.125, (TX0 + TX1) / 2 + 0.125, TT + 4.5, (TZ0 + TZ1) / 2 + 0.125, C.gold);
      const tcx = (TX0 + TX1) / 2, tcz = (TZ0 + TZ1) / 2, cy = 12.75, faceC = AF.col(0xfaf4e0, { emit: 0xfff0c8, emitK: 1.2, mode: 'night' });
      const faces = [[0, 1], [0, -1], [1, 0], [-1, 0]];
      for (const [fx, fz] of faces) {
        for (let a = -1.5; a < 1.5; a += 0.25) for (let b = -1.5; b < 1.5; b += 0.25) {
          const d = Math.hypot(a + 0.125, b + 0.125); if (d > 1.55) continue;
          const col = d > 1.3 ? C.gold : faceC;
          if (fz) W.setM(tcx + a, cy + b, fz > 0 ? TZ1 : TZ0 - 0.25, col); else W.setM(fx > 0 ? TX1 : TX0 - 0.25, cy + b, tcz + a, col);
        }
      }
      const handGeo = (len) => AF.meshModel(new AF.Model(2, len, 1).box(0, 0, 0, 2, len, 1, C.black), { vs: 1 / 16, anchor: [0.5, 0.05, 0.5] });
      const hH = handGeo(14), hM = handGeo(21), hands = [];
      for (const [fx, fz] of faces) {
        const o = new THREE.Object3D(); o.position.set(tcx + fx * 2.7, cy, tcz + fz * 2.7); o.rotation.y = Math.atan2(fx, fz); AF.scene.add(o);
        const h1 = AF.modelMesh(hH), h2 = AF.modelMesh(hM); h1.castShadow = h2.castShadow = false; h1.position.z = 0.03; h2.position.z = 0.06; o.add(h1, h2); hands.push([h1, h2]);
      }
      dyn.push({ x: tcx, z: tcz, r: 250, update() { const hrs = (AF.time && AF.time.hours) || 12; const aH = -((hrs % 12) / 12) * TAU, aM = -((hrs % 1)) * TAU; for (const [h1, h2] of hands) { h1.rotation.z = aH; h2.rotation.z = aM; } } });
      L.clock = { hands };
      // FERRY TICKET KIOSK (x 9..15, z 193..199): round-cornered deco booth, enterable
      {
        const KX0 = 9, KX1 = 15, KZ0 = 193, KZ1 = 199;
        W.walls(KX0, 0.25, KZ0, KX1, 3.25, KZ1, C.white, 0.25);
        F(KX0 + 0.25, 0.25, KZ0 + 0.25, KX1 - 0.25, 0.5, KZ1 - 0.25, C.tileB);
        F(KX0 - 0.5, 3.25, KZ0 - 0.5, KX1 + 0.5, 3.75, KZ1 + 0.5, C.teal); F(KX0, 3.75, KZ0, KX1, 4.0, KZ1, C.gold);
        F(KX0 + 1, 1.25, KZ0, KX1 - 1, 2.75, KZ0 + 0.25, C.glass); F(KX0 + 1, 1.0, KZ0 - 0.25, KX1 - 1, 1.25, KZ0 + 0.25, C.brass);   // ticket window (north)
        F(KX0 + 2, 0.5, KZ1 - 0.25, KX0 + 3.75, 3.0, KZ1, 0);                                     // door (south)
        F(KX0 + 1, 0.5, KZ0 + 0.5, KX1 - 1, 1.25, KZ0 + 1, C.wood); F(KX1 - 1, 0.5, KZ0 + 2, KX1 - 0.25, 2.5, KZ0 + 2.25, C.wood);
        F(KX0 + 2.75, 2.75, KZ0 + 2.75, KX0 + 3.25, 3.0, KZ0 + 3.25, C.lampA);
        const sg2 = LIB.sign('FERRY TICKETS', C.navy, C.white, 1 / 16); put(sg2, (KX0 + KX1) / 2, 4.0, KZ0 - 0.2, 2, false);
        AF.addLight({ x: 12, y: 2.6, z: 196, color: 0xffe0b0, intensity: 0.9, range: 7, kind: 'interior' });
        AF.addBuilding({ id: 'ferry-kiosk', name: 'Ferry Ticket Kiosk', kind: 'kiosk', box: [KX0, 0.25, KZ0, KX1, 4.2, KZ1], doors: [{ x: KX0 + 2.9, y: 0.25, z: KZ1 + 1.2, yaw: Math.PI }], floors: [0.5], interior: true, owner: 'land-harbour' });
        AF.addSpot({ building: 'ferry-kiosk', x: 12, y: 0.5, z: KZ0 + 1.6, yaw: Math.PI, kind: 'counter', path: [[KX0 + 2.9, KZ1 + 1.2], [KX0 + 2.9, KZ1 - 1], [12, KZ0 + 1.6]] });
        AF.addSpot({ building: null, x: 12, y: 0.25, z: KZ0 - 1.2, yaw: 0, kind: 'stand' });
        AF.addSpot({ building: null, x: 13.2, y: 0.25, z: KZ0 - 2.2, yaw: 0, kind: 'stand' });
      }
      { // fill the square: flower ring round the anchor, bandstand, fish-and-chips + tram-ticket booths, carts, lobster pots, clock, lamps, benches
        const soil = c(0x5a4030, { jitter: 0.8 }), kerb = C.stone, flw = [c(0xd84a3a, { solid: false }), c(0xe8a030, { solid: false }), c(0xf2d060, { solid: false }), c(0x8a3a8a, { solid: false }), c(0xf2ece0, { solid: false })], lv = c(0x3f6e34, { solid: false });
        for (let x = -4.5; x < 4.5; x += 0.25) for (let z = 185.5; z < 194.5; z += 0.25) {
          const d = Math.hypot(x + 0.125, z + 0.125 - 190); if (d < 2.4 || d > 4.25) continue;
          if (d > 4.0) { F(x, 0.25, z, x + 0.25, 0.5, z + 0.25, kerb); continue; }
          const ci = W.col(x, z); if (ci >= 0) W.C[ci] = soil;
          const h = hash(Math.floor(x * 4) + 99, Math.floor(z * 4)); if (h < 0.75) W.setM(x, 0.25, z, h < 0.3 ? lv : flw[(h * 17 | 0) % 5]);
        }
        // bandstand (octagonal, green copper roof, bulbs)
        const BX = 24, BZ = 185, cop = c(0x5aa08a);
        for (let x = BX - 4; x < BX + 4; x += 0.25) for (let z = BZ - 4; z < BZ + 4; z += 0.25) { const d = Math.max(Math.abs(x + 0.125 - BX), Math.abs(z + 0.125 - BZ), (Math.abs(x + 0.125 - BX) + Math.abs(z + 0.125 - BZ)) * 0.72); if (d < 3.6) F(x, 0.25, z, x + 0.25, 0.75, z + 0.25, d > 3.35 ? C.stoneD : C.plank); }
        for (let i = 0; i < 8; i++) { const a2 = i / 8 * TAU + 0.39, px = BX + Math.cos(a2) * 3.2, pz = BZ + Math.sin(a2) * 3.2; F(px - 0.125, 0.75, pz - 0.125, px + 0.125, 4.0, pz + 0.125, C.white); }
        for (let k = 0; k < 10; k++) { const r = 4.0 - k * 0.4; for (let a2 = 0; a2 < TAU; a2 += 0.04) { const x = BX + Math.cos(a2) * r, z = BZ + Math.sin(a2) * r; W.setM(x, 4.0 + k * 0.25, z, k === 0 && Math.round(a2 * 25) % 4 === 0 ? C.bulb : k === 0 ? C.white : cop); } }
        F(BX - 0.125, 6.5, BZ - 0.125, BX + 0.125, 7.5, BZ + 0.125, C.gold);
        for (let a2 = 0; a2 < TAU; a2 += 0.05) { const x = BX + Math.cos(a2) * 3.3, z = BZ + Math.sin(a2) * 3.3; if (Math.abs(AF.angDiff(a2, Math.PI)) < 0.4) continue; W.setM(x, 1.5, z, C.white); }
        for (let i = 0; i < 4; i++) AF.addSpot({ building: null, x: BX - 1.2 + i * 0.8, y: 0.75, z: BZ + (i % 2) * 0.8, yaw: Math.PI / 2 * (i - 1.5), kind: 'stand' });
        AF.addLight({ x: BX, y: 3.6, z: BZ, color: 0xffd890, intensity: 1.0, range: 9, kind: 'sign' });
        AF.addLabel('Bandstand', BX, BZ, 'building');
        // fish-and-chips kiosk + tram ticket booth on the street side
        put(kiosk(22, 12, C.white, C.navy, C.white, 'FISH+CHIPS', C.navy, C.cream), -6, 0.25, 177.5, 0, true);
        AF.addSpot({ building: null, x: -6, y: 0.25, z: 176.9, yaw: 0, kind: 'counter' });
        AF.addSpot({ building: null, x: -6.4, y: 0.25, z: 180.6, yaw: Math.PI, kind: 'stand' });
        { const m = new AF.Model(12, 24, 12); m.box(0, 0, 0, 12, 18, 12, c(0x2f6a4a)); m.box(1, 8, 11, 11, 15, 12, C.glass); m.box(0, 7, 11, 12, 8, 13, C.brass); m.box(-1, 18, -1, 13, 20, 13, C.cream); m.box(2, 20, 2, 10, 24, 10, c(0x2f6a4a));
          const tm = AF.textModel('TRAM', C.gold, { pad: 0 }); for (let x = 0; x < tm.w && x < 12; x++) for (let y = 0; y < 7; y++) if (tm.get(x, y, 0)) m.set(x - 6 + 6, 13 + y - 12 + 7 - 7 + 3, 12 - 1 + 1, C.gold);
          put(geo(m, 1 / 8), 4, 0.25, 176.5, 2, true); AF.addSpot({ building: null, x: 4, y: 0.25, z: 175.4, yaw: 0, kind: 'stand' }); }
        // a row of parked delivery handcarts near the quay + stacked lobster pots
        const cartG = (() => { const m = new AF.Model(10, 10, 18), wd = C.wood; m.box(0, 3, 0, 10, 4, 14, wd); m.box(0, 4, 0, 1, 7, 14, wd); m.box(9, 4, 0, 10, 7, 14, wd); m.box(0, 4, 0, 10, 7, 1, wd); m.box(1, 4, 2, 9, 6, 6, C.ice); m.box(2, 6, 3, 8, 7, 5, c(0xc0c8d0));
          for (const x of [-1, 10]) m.box(x < 0 ? 0 : 9, 0, 4, x < 0 ? 1 : 10, 5, 8, C.black); m.box(3, 4, 14, 4, 5, 18, wd); m.box(6, 4, 14, 7, 5, 18, wd); m.box(1, 1, 12, 2, 3, 13, wd); m.box(8, 1, 12, 9, 3, 13, wd); return geo(m, 1 / 8); })();
        for (let i = 0; i < 4; i++) put(cartG, -30 + i * 1.8, 0.25, 205.5, 0, true);
        for (let i = 0; i < 18; i++) { const x = 32 + (i % 4) * 0.9, z = 203 + (Math.floor(i / 4) % 2) * 0.9, y = 0.25 + Math.floor(i / 8) * 0.6; F(x, y, z, x + 0.75, y + 0.55, z + 0.75, i % 3 ? C.netB : C.woodD); F(x + 0.1, y + 0.1, z - 0.02, x + 0.65, y + 0.45, z, C.net); }
        // street clock on a post (two dials)
        F(-10.125, 0.25, 198.875, -9.875, 3.5, 199.125, C.iron); F(-10.375, 0.25, 198.625, -9.625, 0.75, 199.375, C.iron);
        for (let a2 = -0.6; a2 <= 0.6; a2 += 0.125) for (let b2 = -0.6; b2 <= 0.6; b2 += 0.125) { if (Math.hypot(a2, b2) > 0.62) continue; const edge = Math.hypot(a2, b2) > 0.5; F(-10 + a2, 4.1 + b2, 198.75, -10 + a2 + 0.125, 4.1 + b2 + 0.125, 199.25, edge ? C.iron : AF.col(0xfaf4e0, { emit: 0xfff0c8, emitK: 1.2, mode: 'night' })); }
        F(-10.03, 4.1, 198.7, -9.97, 4.5, 198.75, C.black); F(-10, 4.1, 198.7, -9.7, 4.16, 198.75, C.black); F(-10.03, 4.1, 199.25, -9.97, 4.5, 199.3, C.black); F(-10.3, 4.1, 199.25, -10, 4.16, 199.3, C.black);
        F(-10.25, 4.7, 198.75, -9.75, 4.95, 199.25, C.iron);
        for (const [lx, lz] of [[-24, 200], [24, 200], [0, 206.5], [-30, 190], [36, 192]]) LIB.lamp(lx, 0.25, lz);
        for (const bx2 of [-6, 6]) LIB.bench(bx2, 0.25, 206, 0);
        LIB.bench(-24, 0.25, 205.5, 0); LIB.bench(18, 0.25, 196.5, 3);
      }
      // signal-flag mast: yard with a string of signal flags that sway
      {
        const MX = 26, MZ = 196;
        F(MX - 0.125, 0.25, MZ - 0.125, MX + 0.125, 12, MZ + 0.125, C.white); F(MX - 3, 9, MZ - 0.1, MX + 3, 9.2, MZ + 0.1, C.white);
        F(MX - 1, 0.25, MZ - 1, MX + 1, 0.75, MZ + 1, C.stoneD);
        const flagCols = [[0xd8302a, 0xf2d040], [0x2a4a9a, 0xf6f2ea], [0xf2d040, 0x2a4a9a], [0xf6f2ea, 0xd8302a], [0x2a8a4a, 0xf6f2ea], [0xd8302a, 0xf6f2ea]];
        const flags = [];
        for (let side = -1; side <= 1; side += 2) for (let i = 0; i < 6; i++) {
          const [a, b] = flagCols[(i + (side > 0 ? 3 : 0)) % 6], fm = new AF.Model(1, 10, 10), ca = c(a, { solid: false }), cb = c(b, { solid: false });
          for (let y = 0; y < 10; y++) for (let z = 0; z < 10; z++) fm.set(0, y, z, ((y < 5) !== (z < 5)) ? ca : cb);
          const fl = AF.modelMesh(AF.meshModel(fm, { vs: 1 / 16, anchor: [0.5, 1, 0] })); fl.castShadow = false;
          const t = (i + 1) / 7, px = MX + side * 3 * (1 - t) + side * 0.2, py = 9 - (9 - 1.2) * t * 0.9, pz = MZ;
          fl.position.set(px, py, pz); AF.scene.add(fl); flags.push({ m: fl, ph: i * 0.7 + side });
        }
        dyn.push({ x: MX, z: MZ, r: 140, update(dt, t) { for (const f of flags) { f.m.rotation.y = Math.sin(t * 2.1 + f.ph) * 0.45 + 0.3; f.m.rotation.x = Math.sin(t * 1.3 + f.ph) * 0.12; } } });
      }
      AF.addLabel('Harbour Square', 0, 186, 'place');
      AF.addViewpoint('The Harbour', [60, 35, 298], [0, 3, 195]);
    }

    // =============================================================== 5. FERRY PIER + THE FERRY (sails a slow loop across the harbour)
    const FY = PIER.ferry;
    {
      LIB.pier(FY.x0, FY.x1, FY.z1, { deck: [C.plank, C.plankD, C.plankL], gaps: [['s', FY.x0 + 3, FY.x1 - 3]] });
      for (let z = COAST + 6; z < FY.z1; z += 10) { LIB.lamp(FY.x0 + 0.8, 0.25, z); LIB.lamp(FY.x1 - 0.8, 0.25, z); }
      // waiting shelter at the pier head
      F(FY.x0 + 2, 0.25, FY.z1 - 8, FY.x1 - 2, 0.5, FY.z1 - 3, C.plankD);
      for (const [px, pz] of [[FY.x0 + 2, FY.z1 - 8], [FY.x1 - 2.25, FY.z1 - 8], [FY.x0 + 2, FY.z1 - 3.25], [FY.x1 - 2.25, FY.z1 - 3.25]]) F(px, 0.5, pz, px + 0.25, 3.25, pz + 0.25, C.white);
      F(FY.x0 + 1.5, 3.25, FY.z1 - 8.5, FY.x1 - 1.5, 3.5, FY.z1 - 2.75, C.teal); F(FY.x0 + 2.5, 3.5, FY.z1 - 8, FY.x1 - 2.5, 3.75, FY.z1 - 3.25, C.teal);
      LIB.bench(FY.x0 + 4, 0.5, FY.z1 - 7.5, 0); LIB.bench(FY.x1 - 4, 0.5, FY.z1 - 7.5, 0);
      for (const x of [FY.x0 + 0.5, FY.x1 - 0.5]) put(LIB.bollardGeo(), x, 0.25, FY.z1 - 0.6, 0, true);
      AF.addLabel(FY.name, 0, FY.z1 - 4, 'place');
      // the ferry "SOLACE BELLE": white hull, navy boot-top, two decks, a buff funnel with a navy band
      const fm = new AF.Model(36, 44, 112), hullC = C.white, boot = C.navy, deckC = c(0xc8a878), rail = C.white, funnel = c(0xe8c890);
      for (let z = 0; z < 112; z++) {
        const t = z / 111, bow = t > 0.78 ? 1 - (t - 0.78) / 0.22 : 1, stern = t < 0.06 ? 0.8 + t * 3.3 : 1;
        const half = 17 * Math.pow(Math.max(0.04, bow), 0.55) * stern;
        for (let y = 0; y < 16; y++) {
          const hw = half * (0.6 + 0.4 * Math.min(1, y / 6));
          for (let x = Math.floor(18 - hw); x < Math.ceil(18 + hw); x++) {
            const edge = x <= 18 - hw + 1 || x >= 18 + hw - 1 || y === 0; if (!edge && y < 15) continue;
            fm.set(x, y, z, y < 5 ? boot : y === 15 ? deckC : (y === 10 && z % 6 < 2 && edge) ? C.win : hullC);
          }
        }
      }
      fm.box(6, 16, 14, 30, 26, 88, C.white); fm.box(7, 18, 13, 29, 22, 89, C.glass); fm.box(5, 26, 12, 31, 27, 90, deckC);
      for (let z = 12; z < 90; z += 2) { fm.set(5, 28, z, rail); fm.set(30, 28, z, rail); }
      fm.box(10, 27, 30, 26, 34, 70, C.white); fm.box(11, 29, 29, 25, 32, 71, C.glass); fm.box(9, 34, 28, 27, 35, 72, C.navy);
      fm.box(12, 35, 60, 24, 38, 68, C.white); fm.box(13, 36, 68, 23, 38, 69, C.glass);            // wheelhouse
      fm.box(15, 35, 40, 21, 44, 46, funnel); fm.box(15, 40, 40, 21, 42, 46, C.navy);                  // funnel
      fm.box(17, 38, 76, 19, 44, 78, C.white);                                                       // flag mast
      for (const lz of [36, 56]) { fm.box(4, 22, lz, 6, 25, lz + 6, C.red); fm.box(30, 22, lz, 32, 25, lz + 6, C.red); }   // lifebuoys/boats
      for(let x=0;x<fm.w;x++)for(let y=0;y<fm.h;y++)for(let z=0;z<fm.d;z++)if(fm.get(x,y,z)===C.glass)fm.set(x,y,z,C.win);
      const ferry = new THREE.Mesh(AF.meshModel(fm,{vs:0.25,anchor:[0.5,0,0.5],flat:true}),AF.mat.voxel);
      ferry.name='serena-ferry';ferry.receiveShadow=true;ferry.position.set(0,SEA_Y-1,277);AF.scene.add(ferry);
      HR.ferry={mesh:ferry,st:{dwell:25,v:0},get x(){return ferry.position.x;},get z(){return ferry.position.z;}};
    }

    L.hbWestMs = Math.round(performance.now() - t0);
  });

  // ------------------------------------------------------------ v2: QUAY APRON cargo + FISH MARKET fish trays (vs 1/8 + 1/16 prop kit)
  AF.onBuild('harbour-apron', 302, () => {
    const t0 = performance.now();
    const c = (hex, o = {}) => AF.col(hex, Object.assign({ jitter: 0.4, edge: 0.7 }, o));
    const K = {
      crate: [c(0xa8845a, { jitter: 0.5 }), c(0x8e6e48, { jitter: 0.5 }), c(0xb89a6a, { jitter: 0.5 }), c(0x6a7a5a, { jitter: 0.5 })], crateD: c(0x5e4630, { jitter: 0.3 }),
      sten: [c(0x2a2a2e, { jitter: 0.1 }), c(0x9a2a26, { jitter: 0.1 }), c(0x1f3552, { jitter: 0.1 })],
      barrel: c(0x8a6038, { jitter: 0.5 }), barrelD: c(0x6a4628, { jitter: 0.5 }), hoop: c(0x3a3a3e, { jitter: 0.1 }),
      sack: c(0xd8c9a0, { jitter: 0.5 }), sackD: c(0xbfae84, { jitter: 0.5 }), twine: c(0x8a7a5a), bale: c(0xc8b070, { jitter: 0.6 }), baleBand: c(0x5a4a3a),
      iron: c(0x2c2f33, { jitter: 0.2 }), red: c(0xb8302a), wood: c(0x7a5a3a, { jitter: 0.5 }), woodL: c(0xa07a4c, { jitter: 0.5 }),
      horse: c(0x6a4a30, { jitter: 0.3 }), horseW: c(0xe8dcc8, { jitter: 0.2 }), harness: c(0x1e1a18), brass: c(0xc09a4a, { metal: 1, rough: 0.35 }), green: c(0x2f5a3a), cream: c(0xf2e8d2, { jitter: 0.2 }),
      net: c(0x6a7a5a, { jitter: 0.6, solid: false }), rope: c(0xc8b48a, { jitter: 0.4 }), float: c(0xe86a2a),
      ice: c(0xe6f2f4, { jitter: 0.5, edge: 0.3 }), zinc: c(0xa8b0b4, { metal: 0.7, rough: 0.35, jitter: 0.2 }), eye: c(0x101014),
      mack: c(0x3a6a7a, { jitter: 0.3 }), mackS: c(0x1a2a30), belly: c(0xdfe6e8, { jitter: 0.2 }), cod: c(0x8a8a5a, { jitter: 0.5 }), snap: c(0xd8584a, { jitter: 0.3 }), snapL: c(0xf0a090),
      herr: c(0x9ab4c8, { jitter: 0.4 }), lob: c(0x8a2a22, { jitter: 0.3 }), oyster: c(0x8a8478, { jitter: 0.8 }), chalk: c(0x2a3430), chalkW: c(0xe8e8e0),
    };
    const crate = (m, x, y, z, col, st) => {
      m.box(x, y, z, x + 8, y + 8, z + 8, col);
      for (const [a, b] of [[0, 0], [7, 0], [0, 7], [7, 7]]) m.box(x + a, y, z + b, x + a + 1, y + 8, z + b + 1, K.crateD);
      m.box(x, y + 3, z, x + 8, y + 4, z + 8, K.crateD);
      if (st != null) { m.box(x + 2, y + 5, z - 0, x + 6, y + 6, z + 8, K.sten[st]); m.box(x + 3, y + 1, z, x + 5, y + 2, z + 8, K.sten[st]); }
    };
    const stackGeo = (layout, seed) => {
      const m = new AF.Model(24, 32, 16);
      layout.forEach(([x, y, z], i) => crate(m, x * 8, y * 8, z * 8, K.crate[(seed + i) % 4], (seed + i) % 3 === 0 ? (seed + i) % 3 : null));
      return LIB.geo(m, 1 / 8);
    };
    const STACK = [
      stackGeo([[0, 0, 0], [1, 0, 0], [2, 0, 0], [0, 0, 1], [1, 0, 1], [0, 1, 0], [1, 1, 0], [0, 1, 1], [0, 2, 0]], 0),
      stackGeo([[0, 0, 0], [1, 0, 0], [1, 0, 1], [2, 0, 1], [1, 1, 0], [1, 1, 1], [2, 1, 1], [1, 2, 1]], 1),
      stackGeo([[0, 0, 0], [0, 0, 1], [1, 0, 0], [1, 0, 1], [2, 0, 0], [2, 0, 1], [0, 1, 0], [1, 1, 1], [2, 1, 0]], 2),
    ];
    const barrelGeo = (() => {
      const m = new AF.Model(26, 16, 18);
      const barrel = (cx, cz, y0) => { for (let y = 0; y < 9; y++) { const r = 3.2 + Math.sin(y / 8 * Math.PI) * 0.6; for (let x = -4; x <= 4; x++) for (let z = -4; z <= 4; z++) if (x * x + z * z <= r * r) m.set(cx + x, y0 + y, cz + z, (y === 1 || y === 7) ? K.hoop : ((x + z) & 1) ? K.barrel : K.barrelD); } m.box(cx - 1, y0 + 9, cz - 1, cx + 1, y0 + 9, cz + 1, K.barrelD); };
      barrel(4, 4, 0); barrel(12, 4, 0); barrel(20, 5, 0); barrel(5, 12, 0); barrel(13, 13, 0); barrel(8, 8, 9);
      return LIB.geo(m, 1 / 8);
    })();
    const sackGeo = (() => {
      const m = new AF.Model(20, 10, 10);
      const sack = (x, y, z, col) => { m.box(x, y, z + 1, x + 6, y + 3, z + 4, col); m.box(x + 1, y, z, x + 5, y + 3, z + 5, col); m.box(x, y + 1, z + 2, x + 6, y + 2, z + 3, K.twine); };
      let i = 0; for (let l = 0; l < 3; l++) for (let k = 0; k < 3 - l; k++) { sack(k * 6 + l * 3, l * 3, 0, (i++ % 2) ? K.sack : K.sackD); sack(k * 6 + l * 3 + 1, l * 3, 5, (i++ % 3) ? K.sackD : K.sack); }
      return LIB.geo(m, 1 / 8);
    })();
    const baleGeo = (() => { const m = new AF.Model(20, 12, 10); for (const [x, y] of [[0, 0], [10, 0], [5, 6]]) { m.box(x, y, 0, x + 10, y + 6, 10, K.bale); m.box(x + 2, y, 0, x + 3, y + 6, 10, K.baleBand); m.box(x + 7, y, 0, x + 8, y + 6, 10, K.baleBand); } return LIB.geo(m, 1 / 8); })();
    const truckGeo = (() => {   // 1930s two-wheel hand truck with a crate
      const m = new AF.Model(10, 16, 10);
      m.box(1, 1, 1, 2, 16, 2, K.iron); m.box(8, 1, 1, 9, 16, 2, K.iron); for (const y of [5, 10, 15]) m.box(1, y, 1, 9, y + 1, 2, K.iron);
      m.box(1, 0, 1, 9, 1, 5, K.iron); for (const x of [0, 9]) { m.box(x, 0, 0, x + 1, 3, 3, K.harness); }
      crate(m, 1, 1, 2, K.crate[1], 1);
      return LIB.geo(m, 1 / 8);
    })();
    const drayGeo = (() => {   // horse-drawn dray with barrels, facing +z
      const m = new AF.Model(18, 24, 64);
      m.box(1, 6, 0, 17, 7, 32, K.woodL); m.box(0, 7, 0, 1, 9, 32, K.wood); m.box(17, 7, 0, 18, 9, 32, K.wood); m.box(1, 7, 0, 17, 9, 1, K.wood);
      for (const x of [0, 17]) for (let y = 0; y < 11; y++) for (let z = 0; z < 11; z++) { const d = Math.hypot(y - 5, z - 5); if (d < 5.5 && (d > 4.3 || (Math.abs(y - 5) < 0.6 || Math.abs(z - 5) < 0.6))) m.set(x, y, z + 12, d > 4.3 ? K.iron : K.red); }
      for (const x of [3, 14]) m.box(x, 6, 32, x + 1, 7, 44, K.wood);
      for (const [bx, bz] of [[5, 5], [12, 5], [5, 14], [12, 14], [5, 23], [12, 23]]) for (let y = 0; y < 7; y++) for (let x = -3; x <= 3; x++) for (let z = -3; z <= 3; z++) if (x * x + z * z <= 8.5) m.set(bx + x, 7 + y, bz + z, (y === 1 || y === 5) ? K.hoop : K.barrel);
      m.box(6, 9, 30, 12, 15, 32, K.wood);                                                                     // driver's box
      // the horse (a big Percheron with white feathered socks)
      const H = K.horse; m.box(5, 8, 36, 13, 14, 50, H); m.box(6, 13, 48, 12, 18, 52, H); m.box(7, 16, 51, 11, 20, 57, H); m.box(8, 15, 56, 10, 17, 59, H);
      m.box(8, 17, 47, 10, 21, 51, K.harness); m.box(4, 10, 44, 14, 15, 46, K.harness); m.box(7, 12, 32, 11, 14, 36, H);
      for (const [lx, lz] of [[5, 37], [11, 37], [5, 47], [11, 47]]) { m.box(lx, 2, lz, lx + 2, 8, lz + 2, H); m.box(lx, 0, lz, lx + 2, 2, lz + 2, K.horseW); }
      m.box(6, 18, 55, 7, 20, 56, K.eye); m.box(11, 18, 55, 12, 20, 56, K.eye); m.box(8, 20, 51, 10, 22, 53, K.brass);
      return LIB.geo(m, 1 / 8);
    })();
    const potGeo = (() => {   // lobster pots, stacked 2-1
      const m = new AF.Model(16, 12, 8);
      const pot = (x, y) => { m.box(x, y, 0, x + 8, y + 1, 8, K.wood); for (let a = 0; a <= 8; a++) { const yy = y + Math.round(Math.sin(a / 8 * Math.PI) * 5); m.box(x + a, y + 1, 0, x + a + 1, yy + 1, 1, K.net); m.box(x + a, y + 1, 7, x + a + 1, yy + 1, 8, K.net); m.box(x + a, yy, 0, x + a + 1, yy + 1, 8, (a % 2) ? K.wood : K.net); } };
      pot(0, 0); pot(8, 0); pot(4, 6); m.box(3, 5, 3, 5, 6, 5, K.float);
      return LIB.geo(m, 1 / 8);
    })();
    const coilGeo = (() => { const m = new AF.Model(14, 4, 14); for (let y = 0; y < 4; y++) for (let x = 0; x < 14; x++) for (let z = 0; z < 14; z++) { const d = Math.hypot(x - 6.5, z - 6.5); if (d < 6.5 - y * 0.6 && d > 2.5) m.set(x, y, z, K.rope); } return LIB.geo(m, 1 / 16); })();
    const netGeo = (() => { const m = new AF.Model(24, 6, 18); for (let x = 0; x < 24; x++) for (let z = 0; z < 18; z++) { const h = Math.round(5 * Math.max(0, 1 - Math.hypot((x - 12) / 12, (z - 9) / 9)) + (hash(x, z) < 0.3 ? 1 : 0)); for (let y = 0; y < h; y++) m.set(x, y, z, K.net); if (hash(x * 3, z) < 0.03) m.set(x, h, z, K.float); } return LIB.geo(m, 1 / 8); })();
    // fish trays (vs 1/16): a zinc tray of shaved ice holding one species, 2 m x 1.25 m
    const fishTray = (kind) => {
      const m = new AF.Model(32, 6, 20);
      m.box(0, 0, 0, 32, 3, 20, K.zinc); m.box(1, 1, 1, 31, 3, 19, K.ice);
      const fish = (x, z, len, body, top, stripe, flip) => {
        for (let i = 0; i < len; i++) {
          const k = i / (len - 1), w = k < 0.8 ? Math.round(Math.sin(Math.min(1, k / 0.8) * Math.PI) * 1.5 + 0.6) : 0;
          const xx = flip ? x + len - 1 - i : x + i;
          for (let dz = -w; dz <= w; dz++) m.set(xx, 3, z + dz, dz < 0 ? K.belly : (stripe && i % 3 === 0 ? stripe : top || body));
          if (w > 0) m.set(xx, 4, z, body);
          if (k >= 0.8) { m.set(xx, 3, z - 1, body); m.set(xx, 3, z + 1, body); m.set(xx, 3, z, body); }
        }
        m.set(flip ? x + len - 2 : x + 1, 4, z + 1, K.eye);
      };
      if (kind === 'lobster') {
        for (let r = 0; r < 3; r++) for (let q = 0; q < 3; q++) { const x = 3 + q * 10, z = 3 + r * 6; m.box(x, 3, z, x + 7, 5, z + 3, K.lob); m.box(x + 7, 3, z - 1, x + 9, 4, z, K.lob); m.box(x + 7, 3, z + 3, x + 9, 4, z + 4, K.lob); m.set(x + 1, 5, z + 1, K.eye); }
      } else if (kind === 'oyster') {
        for (let x = 2; x < 30; x += 3) for (let z = 2; z < 18; z += 3) { m.box(x, 3, z, x + 2, 4, z + 2, K.oyster); if (hash(x, z) < 0.4) m.set(x, 4, z, K.belly); }
      } else {
        const S = { mackerel: [K.mack, null, K.mackS, 12], cod: [K.cod, null, null, 14], snapper: [K.snap, K.snapL, null, 11], herring: [K.herr, null, null, 8] }[kind];
        let r = 0; for (let z = 3; z < 18; z += 3, r++) for (let x = 1 + (r % 2) * 3; x + S[3] < 32; x += S[3] + 1) fish(x, z, S[3], S[0], S[1], S[2], (r + x) % 2);
      }
      return LIB.geo(m, 1 / 16);
    };
    const TRAYS = ['mackerel', 'cod', 'snapper', 'herring', 'lobster', 'oyster'].map(fishTray);
    const P2 = (g, x, z, rot = 0, y = 0.25, col = true) => LIB.put(g, x, y, z, rot, col);

    // ---- FISH MARKET: trays on every ice table (replaces the v1 cube fish), chalk prices, spill-out onto the quay
    const M = L.fishMarket;
    if (M) {
      const tables = [[M.X0 + 3, M.Z0 + 4], [M.X0 + 3, M.Z0 + 14], [M.X1 - 11, M.Z0 + 4], [M.X1 - 11, M.Z0 + 14]];
      tables.forEach(([tx, tz], ti) => { for (let k = 0; k < 4; k++) P2(TRAYS[(ti * 2 + k) % 6], tx + 1 + k * 2, tz + 1.25, 0, 1.5, false); });
      // quay side (south door): crates of fish, lobster pots, barrels, a net pile; keep the doorway lane clear
      for (const [x, z, g, r] of [[M.X0 + 3, M.Z1 + 3, potGeo, 0], [M.X0 + 7, M.Z1 + 3.5, STACK[1], 1], [M.X0 + 11, M.Z1 + 4, barrelGeo, 0], [M.X0 + 14.5, M.Z1 + 2.2, TRAYS[0], 0],
        [M.X1 - 4, M.Z1 + 3, potGeo, 2], [M.X1 - 8, M.Z1 + 4, netGeo, 0], [M.X1 - 12, M.Z1 + 3.5, sackGeo, 0], [M.X1 - 14.5, M.Z1 + 2.2, TRAYS[3], 0]]) P2(g, x, z, r, 0.25, true);
      for (const [x, z, g, r] of [[M.X0 + 3, M.Z0 - 2.5, potGeo, 0], [M.X1 - 4, M.Z0 - 2.4, TRAYS[4], 0], [M.X1 - 8, M.Z0 - 2.4, TRAYS[2], 0]]) P2(g, x, z, r, 0.25, true);
      // two long zinc stalls down the nave (either side of the door-to-door aisle), 5 trays each, chalk price boards overhead
      for (const sx of [M.DX - 5.5, M.DX + 4]) {
        LIB.F(sx, 0.5, M.Z0 + 6, sx + 1.5, 1.25, M.Z0 + 18.5, K.wood); LIB.F(sx - 0.125, 1.25, M.Z0 + 6, sx + 1.625, 1.5, M.Z0 + 18.5, K.zinc);
        for (let k = 0; k < 5; k++) P2(TRAYS[(k + (sx > M.DX ? 3 : 0)) % 6], sx + 0.75, M.Z0 + 7.25 + k * 2.4, 1, 1.5, false);
        for (let z = M.Z0 + 7; z < M.Z0 + 18; z += 4) { LIB.F(sx + 0.625, 2.75, z, sx + 0.875, 7, z + 0.25, K.iron); LIB.F(sx + 0.5, 2.25, z - 0.5, sx + 1.0, 2.75, z + 0.75, K.chalk); LIB.F(sx + (sx > M.DX ? 1.0 : 0.45), 2.4, z - 0.25, sx + (sx > M.DX ? 1.05 : 0.5), 2.6, z + 0.5, K.chalkW); }
        for (let z = M.Z0 + 8; z < M.Z0 + 18; z += 3.5) { AF.addSpot({ building: 'fish-market', x: sx + (sx > M.DX ? 2.3 : -0.8), y: 0.5, z, yaw: sx > M.DX ? -Math.PI / 2 : Math.PI / 2, kind: 'counter' }); AF.addSpot({ building: 'fish-market', x: sx + (sx > M.DX ? -0.8 : 2.3), y: 0.5, z: z + 1.2, yaw: sx > M.DX ? Math.PI / 2 : -Math.PI / 2, kind: 'browse' }); }
      }
      // the auction rostrum with a brass bell (south-east corner)
      LIB.F(M.X1 - 5, 0.5, M.Z1 - 5, M.X1 - 2, 1.5, M.Z1 - 2.5, K.wood); LIB.F(M.X1 - 4, 1.5, M.Z1 - 3.25, M.X1 - 3, 2.75, M.Z1 - 2.75, K.wood);
      LIB.F(M.X1 - 3.75, 3.5, M.Z1 - 3.25, M.X1 - 3.25, 3.75, M.Z1 - 2.75, K.brass); LIB.F(M.X1 - 3.625, 2.75, M.Z1 - 3.125, M.X1 - 3.375, 3.5, M.Z1 - 2.875, K.iron);
      AF.addSpot({ building: 'fish-market', x: M.X1 - 3.5, y: 1.5, z: M.Z1 - 4, yaw: Math.PI, kind: 'work' });
      for (let i = 0; i < 6; i++) AF.addSpot({ building: 'fish-market', x: M.X1 - 6 + (i % 3) * 1.1, y: 0.5, z: M.Z1 - 7.5 - Math.floor(i / 3) * 1.1, yaw: 0, kind: 'stand' });
      // v2 r2: steel tie beams across the hall with gulls perched in the rafters, a hanging sign over the aisle, pennants
      for (const tz of [M.Z0 + 6, M.Z0 + 12, M.Z0 + 18]) { LIB.F(M.X0 + 0.5, 6.25, tz, M.X1 - 0.5, 6.5, tz + 0.25, K.iron); for (let x = M.X0 + 2; x < M.X1 - 1; x += 3) LIB.F(x, 5.9, tz, x + 0.25, 6.25, tz + 0.25, K.iron); }
      for (const [x, tz] of [[M.X0 + 7, M.Z0 + 6], [M.X1 - 9, M.Z0 + 12], [M.X0 + 13, M.Z0 + 18], [M.X1 - 4, M.Z0 + 6]]) AF.addSpot({ building: 'fish-market', x, y: 6.5, z: tz + 0.12, yaw: 0, kind: 'gull' });
      if (LIB.sign) { const fg = c(0xf2e8d2, { jitter: 0.1 }), bg = c(0x1f4a5a, { jitter: 0.1 }); LIB.put(LIB.sign('FRESH OFF THE BOATS', fg, bg, 1 / 20), M.DX, 4.9, M.Z0 + 12.4, 0, false); LIB.put(LIB.sign('FRESH OFF THE BOATS', fg, bg, 1 / 20), M.DX, 4.9, M.Z0 + 12.1, 2, false); LIB.F(M.DX - 1.5, 5.4, M.Z0 + 12.15, M.DX - 1.4, 6.25, M.Z0 + 12.35, K.iron); LIB.F(M.DX + 1.4, 5.4, M.Z0 + 12.15, M.DX + 1.5, 6.25, M.Z0 + 12.35, K.iron); }
      if (AF.makeBunting) for (const tz of [M.Z0 + 6.1, M.Z0 + 18.1]) AF.makeBunting([M.X0 + 1, 6.2, tz], [M.X1 - 1, 6.2, tz], { shape: 'pennant', spacing: 0.7, size: 0.34, sag: 0.9 });
      // street side: spill of pots, barrels and a tray stand flanking the door, and a gilded fish cut-out sign over it
      for (const [x, z, g, r] of [[M.DX - 5, M.Z0 - 2.2, potGeo, 0], [M.DX - 8, M.Z0 - 2.3, barrelGeo, 0], [M.DX + 5, M.Z0 - 2.2, TRAYS[2], 0], [M.DX + 7.5, M.Z0 - 2.2, TRAYS[4], 0], [M.DX + 10, M.Z0 - 2.4, STACK[1], 0]]) P2(g, x, z, r, 0.25, true);
      for (const x of [M.DX + 4, M.DX + 6.5]) LIB.F(x, 0.25, M.Z0 - 2.8, x + 2, 1.25, M.Z0 - 1.6, K.wood);
      for (const [x, z, g] of [[M.DX + 5, M.Z0 - 2.2, TRAYS[2]], [M.DX + 7.5, M.Z0 - 2.2, TRAYS[4]]]) P2(g, x, z, 0, 1.25, false);
      {
        const fm = new AF.Model(56, 16, 2), gold = c(0xe0b040, { metal: 1, rough: 0.3 }), fin = c(0xc88a2a, { metal: 1, rough: 0.35 });
        for (let x = 0; x < 44; x++) { const k = x / 43, h = Math.round(Math.sin(k * Math.PI) * 6.5); for (let y = 8 - h; y < 8 + h; y++) fm.set(x + 6, y, 0, gold); }
        for (let y = 1; y < 15; y++) { const w = Math.round(Math.abs(y - 8) * 0.6) + 1; for (let x = 0; x < w + 2; x++) fm.set(x, y, 0, fin); }
        fm.box(40, 9, 1, 43, 12, 2, K.eye); for (let x = 16; x < 40; x += 4) fm.box(x, 7, 1, x + 1, 9, 2, fin); fm.box(22, 14, 0, 32, 16, 1, fin);
        LIB.put(LIB.geo(fm, 1 / 8, [0.5, 0, 0]), M.DX, 5.8, M.Z0 - 0.5, 2, false);
      }
      for (const [x, z] of [[M.X0 + 9, M.Z1 + 1.6], [M.X1 - 10, M.Z1 + 1.6], [M.DX + 5, M.Z1 + 5]]) AF.addSpot({ building: null, x, y: 0.25, z, yaw: Math.PI, kind: 'work' });
      for (let x = M.X0 + 4; x < M.X1 - 4; x += 8) AF.addSpot({ building: null, x, y: 10.8, z: (M.Z0 + M.Z1) / 2, yaw: 0, kind: 'gull' });
    }
    // ---- THE WEST QUAY APRON (x -106..-40): dock gang, drays, crates, barrels, sacks, bales, hand trucks, rope, nets
    const clutter = [
      [STACK[0], -82, 188, 0], [STACK[2], -79, 191.5, 1], [sackGeo, -84.5, 192, 0], [truckGeo, -80.5, 194.5, 0], [barrelGeo, -76, 187.5, 0],
      [drayGeo, -52, 193, 1], [baleGeo, -47, 188, 0], [baleGeo, -44.5, 191, 1], [STACK[1], -56, 188, 0], [truckGeo, -50, 188.5, 3],
      [STACK[2], -74, 203.5, 0], [barrelGeo, -78, 204, 1], [coilGeo, -81, 207.5, 0], [coilGeo, -58, 207.3, 0], [netGeo, -104, 205, 0], [potGeo, -101, 202, 1],
      [STACK[0], -46, 203, 2], [sackGeo, -49, 205.5, 1], [truckGeo, -44, 206.5, 2], [drayGeo, -110, 205.5, 3],
      // Harbour Square: a couple of stacks by the ferry pier foot, rope + bollard coils
      [coilGeo, -9, 207.4, 0], [coilGeo, 9, 207.4, 0], [STACK[1], 22, 204, 0], [barrelGeo, 26, 203.5, 1],
      // east quay (docks) gets extra life along the edge
      [coilGeo, 62, 207.4, 0], [coilGeo, 104, 207.4, 0], [truckGeo, 142, 197, 1], [netGeo, 270, 205, 0],
    ];
    for (const [g, x, z, r] of clutter) P2(g, x, z, r);
    for (const [x, z, yaw] of [[-78, 195.5, 0], [-83, 190, Math.PI / 2], [-54, 190, Math.PI], [-48.5, 190.2, -Math.PI / 2], [-76, 201.5, Math.PI], [-47, 201.5, 0], [-106, 203, 0], [-80.5, 196.2, Math.PI]]) AF.addSpot({ building: null, x, y: 0.25, z, yaw, kind: 'work' });
    // the shape-up crowd at the Pier 9 gate + a ferry queue on the Ferry Pier
    for (let i = 0; i < 10; i++) AF.addSpot({ building: null, x: 108 + (i % 5) * 1.1, y: 0.25, z: 196 + Math.floor(i / 5) * 1.2, yaw: Math.PI / 2, kind: 'stand' });
    for (let i = 0; i < 8; i++) AF.addSpot({ building: null, x: -2 + (i % 2) * 0.8, y: 0.25, z: 214 + i * 1.0, yaw: 0, kind: 'stand' });
    L.hbApronMs = Math.round(performance.now() - t0); L.hbApronN = clutter.length;
  });
  AF.test('harbour: apron cargo + fish trays placed', () => ({ ok: (L.hbApronN || 0) > 20, info: `${L.hbApronN} cargo props, ${L.hbApronMs} ms` }));

  // ------------------------------------------------------------ one tick for all harbour life (near-camera gating)
  AF.onTick('harbour-life', 330, (dt, t) => {
    const cam = AF.camera; if (!cam) return;
    const cx = cam.position.x, cz = cam.position.z, hy = cam.position.y;
    dt = Math.min(dt, 0.1);
    for (const d of dyn) {
      if (!d.always) { const r = d.r + hy * 2; if ((d.x - cx) ** 2 + (d.z - cz) ** 2 > r * r) continue; }
      d.update(dt, t);
    }
  });
  L.hbUpdate = (dt, t) => { for (const d of dyn) d.update(dt, t); };

  // ------------------------------------------------------------ tests
  AF.test('harbour: carousel + Ferris wheel animate', () => {
    if (!L.carousel || !L.ferris) return { ok: false, info: 'missing' };
    const a0 = L.carousel.grp.rotation.y, w0 = L.ferris.wheel.rotation.x, h0 = L.carousel.horses[0].m.position.y;
    L.hbUpdate(0.5, 12.3);
    const a1 = L.carousel.grp.rotation.y, w1 = L.ferris.wheel.rotation.x, h1 = L.carousel.horses[0].m.position.y;
    return { ok: a1 !== a0 && w1 !== w0 && h1 !== h0, info: `carousel ${a0.toFixed(2)}->${a1.toFixed(2)} wheel ${w0.toFixed(2)}->${w1.toFixed(2)} horses ${L.carousel.horses.length} gondolas ${L.ferris.gonds.length}` };
  });
  AF.test('harbour: fish market door walkable', () => {
    const M = L.fishMarket; if (!M) return { ok: false, info: 'no market' };
    const b = { x: M.DX, y: 0.25, z: M.Z0 - 2.5, vy: 0, r: 0.3, h: 1.7, onGround: true };
    for (let i = 0; i < 200; i++) AF.moveBody(b, 0, 0.05, 1 / 60);
    return { ok: b.z > M.Z0 + 3, info: `reached z ${b.z.toFixed(2)} y ${b.y}` };
  });
  AF.test('harbour: penny arcade door walkable', () => {
    const A = L.arcade; if (!A) return { ok: false, info: 'no arcade' };
    const b = { x: A.DX, y: 0.25, z: A.Z1 + 2, vy: 0, r: 0.3, h: 1.7, onGround: true };
    for (let i = 0; i < 200; i++) AF.moveBody(b, 0, -0.05, 1 / 60);
    return { ok: b.z < A.Z1 - 3, info: `reached z ${b.z.toFixed(2)} y ${b.y}` };
  });
  AF.test('harbour: ferry sails its loop', () => {
    const f = HR.ferry; if (!f) return { ok: false, info: 'no ferry' };
    const x0 = f.mesh.position.x, z0 = f.mesh.position.z; f.st.dwell = 0;
    for (let i = 0; i < 30; i++) AF.island.ferry.update(0.2, 20 + i * 0.2);
    const d = Math.hypot(f.mesh.position.x - x0, f.mesh.position.z - z0);
    return { ok: d > 3, info: `moved ${d.toFixed(1)} m` };
  });
}

} catch (e) { AF.partError('14-harbour.js', e); }

