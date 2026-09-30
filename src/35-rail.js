// ================================================================ 35-rail.js
try {
// ===== 35-rail: the streetcar loop — girder rails in setts, overhead wires + poles, six stop islands  (OWNER: streets-park) =====
{
  const W = AF.W, P = AF.PLAN, R = P.rail;
  const hash = AF.hash2;
  const RL = AF.rail = AF.rail || {};
  let K = null;
  const pal = () => {
    if (K) return K;
    const c = AF.col;
    K = {
      sett: [c(0x77726a, { jitter: 0.3, edge: 0.12, pat: 'setts' }), c(0x6e6a63, { jitter: 0.3, edge: 0.12, pat: 'setts' }), c(0x817b71, { jitter: 0.3, edge: 0.12, pat: 'setts' }), c(0x69655f, { jitter: 0.3, edge: 0.12, pat: 'setts' })],
      settJ: c(0x4c4a49, { jitter: 0.2, edge: 0.05 }),
      rail: c(0xb8b2a8, { jitter: 0.08, edge: 0.1, metal: 1, rough: 0.28 }), railTop: c(0x2e2c2a, { jitter: 0.1, edge: 0.1 }),   // polished head · dark groove
      pole: c(0x2f5d44, { jitter: 0.15, edge: 0.35 }), poleD: c(0x21432f, { jitter: 0.15, edge: 0.35 }), brass: c(0xc09a45, { jitter: 0.2, edge: 0.3 }),
      conc: c(0xd6cfbf, { jitter: 0.2, edge: 0.15 }), curb: c(0x8f8c88, { jitter: 0.2, edge: 0.35 }), curbSide: c(0x85827d, { jitter: 0.25, edge: 0.2 }), yellow: c(0xe0b23c, { jitter: 0.2, edge: 0.05 }),
      jade: c(0x2e8a7a, { jitter: 0.12, edge: 0.35 }), jadeD: c(0x1f6155, { jitter: 0.12, edge: 0.35 }), cream: c(0xefe3c2, { jitter: 0.12, edge: 0.25 }), gold: c(0xd4a83e, { jitter: 0.15, edge: 0.3 }),
      glass: c(0xa8cad6, { glass: true, jitter: 0.1, edge: 0 }), wood: c(0x9a6a3e, { jitter: 0.4, edge: 0.4 }), woodD: c(0x6f4a2a, { jitter: 0.4, edge: 0.4 }),
      signBg: c(0x1f4f45, { jitter: 0.05, edge: 0.2 }), signFg: c(0xf6ecd0, { emit: 0xfff0c8, emitK: 0.8, mode: 'night', jitter: 0, edge: 0 }),
      board: c(0x1c1b1a, { jitter: 0.1, edge: 0.2 }), chalk: c(0xe8e2d0, { jitter: 0.2, edge: 0 }), iron: c(0x1f2a24, { jitter: 0.15, edge: 0.4 }),
      paint: c(0xe8e3d4, { jitter: 0.2, edge: 0.03 }), safety: c(0xe7b83c, { jitter: 0.1, edge: 0.3 }), clockFace: c(0xfbf4dc, { emit: 0xfff0c8, emitK: 1.0, mode: 'night', jitter: 0, edge: 0.1 }),
      glow: c(0xffe6b8, { emit: 0xffa850, emitK: 1.05, mode: 'night', jitter: 0, edge: 0 }),
    };
    return K;
  };

  // ------------------------------------------------------------ RAIL BED (order 200): setts + two girder rails flush with the road
  AF.onBuild('rail-bed', 200, () => {
    const k = pal(), L = R.length, g = R.gauge / 2;
    const seen = new Uint8Array(W.NX * W.NZ);
    for (let s = 0; s < L; s += 0.1) {
      const p = P.railPoint(s);
      for (let off = -1.5; off <= 1.5; off += 0.125) {
        const x = p.x - p.dz * off, z = p.z + p.dx * off, i = W.col(x, z);
        if (i < 0) continue;
        const ao = Math.abs(off);
        if (Math.abs(ao - g) < 0.14) { W.C[i] = k.rail; seen[i] = 2; }
        else if (Math.abs(ao - g) < 0.26 && ao < g && seen[i] !== 2) { W.C[i] = k.railTop; seen[i] = 3; }   // gauge-side groove lip
        else if (!seen[i]) {
          const bx = Math.floor((x + 300) * 4), bz = Math.floor((z + 300) * 4);
          const hs = hash((bx + (bz & 1)) >> 1, bz);          // 0.5 x 0.25 m setts, staggered each row
          W.C[i] = k.sett[Math.floor(hs * 4) & 3];
          seen[i] = 1;
        }
        W.H[i] = 0;
      }
    }
    // ---- JUNCTION at Park Row x Lantern Ave: straight spurs continue west along Park Row and north up Lantern Ave (to the car barn)
    //      with tapered switch blades where they diverge from the loop curve
    const paintTrack = (ax, az, bx, bz) => {
      const L = Math.hypot(bx - ax, bz - az), dx = (bx - ax) / L, dz = (bz - az) / L;
      for (let s = 0; s < L; s += 0.1) for (let off = -1.5; off <= 1.5; off += 0.125) {
        const x = ax + dx * s - dz * off, z = az + dz * s + dx * off, i = W.col(x, z); if (i < 0 || W.H[i] !== 0) continue;
        const ao = Math.abs(off);
        if (Math.abs(ao - g) < 0.14) { W.C[i] = k.rail; seen[i] = 2; }
        else if (!seen[i]) { const bx2 = Math.floor((x + 300) * 4), bz2 = Math.floor((z + 300) * 4); W.C[i] = k.sett[Math.floor(hash((bx2 + (bz2 & 1)) >> 1, bz2) * 4) & 3]; seen[i] = 1; }
      }
    };
    paintTrack(-140, -160, -200, -160); paintTrack(-160, -140, -160, -205);
    // switch blades: short lighter rail tips on the diverge + a point-lever box in the reservation
    for (const [ax, az, bx, bz] of [[-140, -160.75, -146, -160.75], [-140, -159.25, -146, -159.25], [-160.75, -140, -160.75, -146], [-159.25, -140, -159.25, -146]]) {
      const L = Math.hypot(bx - ax, bz - az); for (let s = 0; s < L; s += 0.1) { const x = ax + (bx - ax) * s / L, z = az + (bz - az) * s / L, i = W.col(x, z); if (i >= 0) W.C[i] = k.rail; }
    }
    RL.junction = { x: -160, z: -160, spurs: [[-200, -160], [-160, -205]] };
    // painted "SLOW / STREET / CAR" on the approaches to the tram boulevards (Grand Ave + the avenues' lanes on the boulevards)
    const G5 = AF.font5x7;
    const paintWord = (word, cx, cz, fx, fz, cols) => {   // centred at (cx,cz), driver heading (fx,fz); rows run along travel (0.5 m each)
      const rx = -fz, rz = fx, px = 0.25, py = 0.5, n = word.length, cw = cols.length, W0 = n * cw + (n - 1) * (cw === 5 ? 1 : 0.5);
      for (let ci = 0; ci < n; ci++) { const gl = G5[word[ci]] || G5['?']; if (!gl) continue;
        for (let r = 0; r < 7; r++) for (let cc = 0; cc < cw; cc++) { if (!(gl[r] & (1 << (4 - cols[cc])))) continue;
          const u = (ci * (cw + (cw === 5 ? 1 : 0.5)) + cc - W0 / 2 + 0.5) * px, v = (3 - r) * py;
          for (let a = 0; a < 2; a++) { const x = cx + rx * u + fx * (v + a * 0.25), z = cz + rz * u + fz * (v + a * 0.25), i = W.col(x, z); if (i >= 0 && W.H[i] === 0) W.C[i] = k.paint; } } }
    };
    const FULL = [0, 1, 2, 3, 4], NARROW = [0, 1, 2, 4];
    const approach = (ix, iz, fx, fz, dEdge, lane) => {   // text in the lane at `lane` m right of the centreline, before the intersection edge
      const rx = -fz, rz = fx;
      (lane < 3 ? [['SLOW', NARROW, 16]] : [['SLOW', FULL, 22], ['STREET', NARROW, 17.5], ['CAR', FULL, 13]]).forEach(([w, cols, back]) => paintWord(w, ix - fx * (dEdge + back) + rx * lane, iz - fz * (dEdge + back) + rz * lane, fx, fz, cols));
    };
    approach(0, -160, 0, -1, 10, 3.6); approach(0, 160, 0, 1, 10, 3.6);                      // Grand Ave -> Park Row / Harbour Blvd
    for (const x of [-80, 80]) { approach(x, -160, 0, -1, 10, 2.5); approach(x, 160, 0, 1, 10, 2.5); }   // Library + Broad (w10 lanes)
    for (const z of [0, -80, 80]) { approach(-160, z, -1, 0, 10, 2.5); approach(160, z, 1, 0, 10, 2.5); }  // E-W streets -> Lantern / Terminal
    // stop islands (raised concrete, curbed, a yellow safety line on the track side)
    for (const st of R.stations) {
      const [x0, z0, x1, z1] = st.platform;
      W.eachCol(x0, z0, x1, z1, (bx, bz, i, x, z) => {
        const e = Math.min(x - x0, x1 - x, z - z0, z1 - z);
        W.H[i] = 1; W.S[i] = k.curbSide;
        const off = Math.hypot(x - st.x, z - st.z);   // (unused)
        W.C[i] = e < 0.25 ? k.curb : k.conc;
      });
      // yellow line 0.5 m in from the track-side edge
      const p = P.railPoint(st.sC);
      for (let s = st.sC - 11.5; s < st.sC + 11.5; s += 0.2) { const q = P.railSide(s, 2.5), i = W.col(q.x, q.z); if (i >= 0 && W.H[i] === 1) W.C[i] = k.yellow; }
    }
    W.tDirty = true;
  });

  // ------------------------------------------------------------ models
  const poleGeo = () => {
    const k = pal(), m = new AF.Model(6, 60, 6);
    m.box(0, 0, 0, 6, 3, 6, k.poleD); m.box(1, 3, 1, 5, 8, 5, k.pole);
    for (let y = 3; y < 8; y++) for (const [x, z] of [[1, 1], [4, 1], [1, 4], [4, 4]]) m.set(x, y, z, k.poleD);   // fluting
    m.box(1, 8, 1, 5, 9, 5, k.brass);
    for (let y = 9; y < 54; y++) m.box(2, y, 2, 4, y + 1, 4, y % 12 === 0 ? k.poleD : k.pole);
    m.box(1, 54, 1, 5, 55, 5, k.brass); m.box(2, 55, 2, 4, 57, 4, k.pole); m.box(2, 57, 2, 4, 58, 4, k.brass); m.set(2, 58, 2, k.brass); m.set(3, 59, 3, k.brass);
    return AF.meshModel(m, { vs: 1 / 8 });
  };
  const shelterGeo = () => {
    const k = pal(), m = new AF.Model(40, 27, 13);
    // floor strip + back glass wall + side glass
    for (let x = 0; x < 40; x++) for (let y = 1; y < 20; y++) m.set(x, y, 0, k.glass);
    for (let z = 0; z < 8; z++) for (let y = 1; y < 20; y++) { m.set(0, y, z, k.glass); m.set(39, y, z, k.glass); }
    for (const x of [0, 13, 26, 39]) m.box(x, 0, 0, x + 1, 21, 1, k.jade);
    for (const x of [0, 39]) m.box(x, 0, 7, x + 1, 21, 8, k.jade);
    m.box(0, 0, 0, 40, 1, 1, k.jadeD); m.box(0, 10, 0, 40, 11, 1, k.jade);
    // roof: cream slab with gold stripe, deco stepped crest
    for (let z = 0; z < 13; z++) { const ry = 21 + Math.round(Math.sin((z + 0.5) / 13 * Math.PI) * 2.4); m.box(0, ry, z, 40, ry + 1, z + 1, (z === 0 || z === 12) ? k.jade : k.cream); if (ry > 21) m.box(0, 21, z, 1, ry, z + 1, k.jade), m.box(39, 21, z, 40, ry, z + 1, k.jade); }
    m.box(0, 21, 12, 40, 22, 13, k.gold);
    for (let x = 1; x < 40; x += 3) { m.set(x, 24, 6, k.iron); m.set(x, 25, 6, x % 6 === 1 ? k.gold : k.iron); }   // ridge cresting
    m.box(16, 24, 0, 24, 25, 1, k.gold);
    m.box(0, 20, 1, 40, 21, 12, k.jadeD);
    for (let x = 4; x < 40; x += 8) m.box(x, 20, 5, x + 2, 21, 7, k.glow);
    // bench
    m.box(3, 3, 1, 37, 4, 4, k.wood); m.box(3, 4, 1, 37, 7, 2, k.woodD); for (const x of [4, 19, 34]) m.box(x, 0, 2, x + 1, 3, 3, k.iron);
    return AF.meshModel(m, { vs: 1 / 8 });
  };
  const signGeo = (name) => {
    const k = pal(), t = AF.textModel(name, k.signFg, { pad: 2 });
    const m = new AF.Model(t.w, t.h + 2, 3);
    m.box(0, 0, 1, t.w, t.h + 2, 2, k.signBg); m.box(0, t.h, 0, t.w, t.h + 2, 3, k.gold); m.box(0, 0, 0, t.w, 1, 3, k.gold);
    for (let x = 0; x < t.w; x++) for (let y = 0; y < t.h; y++) if (t.get(x, y, 0)) { m.set(x, y, 2, k.signFg); m.set(t.w - 1 - x, y, 0, k.signFg); }
    return AF.meshModel(m, { vs: 1 / 20 });
  };
  const signPostGeo = () => { const k = pal(), m = new AF.Model(4, 50, 4); m.box(0, 0, 0, 4, 2, 4, k.poleD); m.box(1, 2, 1, 3, 48, 3, k.pole); m.box(1, 48, 1, 3, 50, 3, k.brass); return AF.meshModel(m, { vs: 1 / 16 }); };
  const timetableGeo = () => {
    const k = pal(), m = new AF.Model(12, 28, 3);
    m.box(5, 0, 1, 7, 12, 2, k.pole); m.box(0, 12, 0, 12, 28, 3, k.jadeD); m.box(1, 13, 2, 11, 27, 3, k.board);
    for (let y = 14; y < 25; y += 2) for (let x = 2; x < 10; x++) if (hash(x, y) < 0.7) m.set(x, y, 3 - 1, k.chalk);
    m.box(1, 25, 2, 11, 27, 3, k.gold);
    return AF.meshModel(m, { vs: 1 / 12 });
  };

  // local +z of a stop model faces the track: rot from the travel direction (see notes)
  const rotFor = (dx, dz) => Math.abs(dx) > Math.abs(dz) ? (dx > 0 ? 2 : 0) : (dz < 0 ? 3 : 1);

  // ------------------------------------------------------------ POLES + WIRES + STOP FURNITURE (order 400)
  AF.onBuild('rail-wires', 485, () => {
    const k = pal(), L = R.length, wy = R.wireY, ST = AF.streets || {};
    const free = typeof ST.free === 'function' ? ST.free : () => true, claim = typeof ST.claim === 'function' ? ST.claim : () => {};
    const pg = poleGeo(), poles = [];
    const segs = [];   // wire line segments
    const inCorner = (x, z) => Math.abs(x) > 140.5 && Math.abs(z) > 140.5;
    for (let s = 0; s < L; s += 25) {
      const p = P.railPoint(s);
      if (inCorner(p.x, p.z)) continue;
      for (const sd of [-1, 1]) {
        const off = sd * 10.45;
        let x = 0, z = 0, ok = false;
        for (const ds of [0, 2, -2, 4, -4]) { const q = P.railPoint(s + ds); x = q.x - q.dz * off; z = q.z + q.dx * off; const i = W.col(x, z); if (i >= 0 && W.H[i] === 1 && free(x, z, 0.3) && !inCorner(q.x, q.z)) { ok = true; break; } }
        if (!ok) continue;
        AF.placeStatic(pg, x, 0.25, z, 0, { collide: false }); AF.addCollider(x - 0.15, 0.25, z - 0.15, x + 0.15, 7, z + 0.15); claim(x, z, 0.5);
        poles.push({ x, z });
        { const ax = x, az = z, ay = 6.9, bx2 = p.x, bz2 = p.z, by2 = wy + 0.55; let px = ax, py = ay, pz = az;   // span wire sags in 6 segments
          for (let q = 1; q <= 6; q++) { const u = q / 6, nx = ax + (bx2 - ax) * u, nz = az + (bz2 - az) * u, ny = ay + (by2 - ay) * u - Math.sin(u * Math.PI) * 0.28; segs.push(px, py, pz, nx, ny, nz); px = nx; py = ny; pz = nz; } }
      }
    }
    // corner pull-off poles at the inner corners of the four loop curves
    for (const [cx, cz] of [[140, 140], [140, -140], [-140, -140], [-140, 140]]) {
      const sx = Math.sign(cx), sz = Math.sign(cz), px = sx * 148.6, pz = sz * 148.6;
      AF.placeStatic(pg, px, 0.25, pz, 0, { collide: false }); AF.addCollider(px - 0.15, 0.25, pz - 0.15, px + 0.15, 7, pz + 0.15); claim(px, pz, 0.5);
      poles.push({ x: px, z: pz });
      for (const a of [15, 45, 75]) { const r = a * Math.PI / 180, ax = cx + sx * Math.cos(r) * 20, az = cz + sz * Math.sin(r) * 20; segs.push(px, 6.7, pz, ax, wy, az); }
    }
    // the contact wire: zig-zag stagger ±0.2 m on the straights, following the curves
    let prev = null;
    for (let s = 0; s <= L + 0.01; s += 2.5) {
      const p = P.railPoint(s), st = ((Math.round(s / 12.5)) & 1 ? 0.18 : -0.18) * (Math.abs(p.x) > 140 && Math.abs(p.z) > 140 ? 0.3 : 1);
      const x = p.x - p.dz * st, z = p.z + p.dx * st;
      if (prev) segs.push(prev[0], wy, prev[1], x, wy, z);
      prev = [x, z];
    }
    // a messenger (catenary) wire above, dipping between span wires
    prev = null;
    for (let s = 0; s <= L + 0.01; s += 2.5) {
      const p = P.railPoint(s), u = (s % 25) / 25, y = wy + 0.55 - Math.sin(u * Math.PI) * 0.42;
      if (prev) segs.push(prev[0], prev[1], prev[2], p.x, y, p.z);
      if (Math.round(s / 2.5) % 2 === 0) segs.push(p.x, y, p.z, p.x, wy, p.z);   // droppers
      prev = [p.x, y, p.z];
    }
    const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(segs, 3));
    const lines = new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: 0x24211e }));
    lines.frustumCulled = false; AF.scene.add(lines); RL.wireMesh = lines;
    AF.tramWire = { y: wy, poles };

    // ---- stop islands: shelter, name sign, timetable, lamp, spots, labels
    const sh = shelterGeo(), sp = signPostGeo(), tt = timetableGeo();
    const lampG = typeof ST.lampGeo === 'function' ? ST.lampGeo(false) : null;
    RL.stops = [];
    const plate = (txt, fg, bg, vs) => { const t = AF.textModel(txt, fg, { pad: 2 }), m = new AF.Model(t.w, t.h + 2, 2); m.box(0, 0, 0, t.w, t.h + 2, 2, bg); m.box(0, 0, 0, t.w, 1, 2, k.gold); m.box(0, t.h + 1, 0, t.w, t.h + 2, 2, k.gold); for (let x = 0; x < t.w; x++) for (let y = 0; y < t.h; y++) if (t.get(x, y, 0)) { m.set(x, y + 1, 1, fg); m.set(t.w - 1 - x, y + 1, 0, fg); } return AF.meshModel(m, { vs }); };
    let routeG = null, fareG = null;
    try { routeG = plate('HARBOUR LOOP - CARS EVERY 6 MIN', k.signFg, k.signBg, 1 / 44); fareG = plate('FARE 5¢ - CHILDREN 3¢', k.chalk, k.board, 1 / 44); } catch (e) { routeG = fareG = null; }
    const clockStops = [];
    const adGs = [];
    try {
      const ad = (l1, l2, fg, bg, bd) => { const t1 = AF.textModel(l1, fg, { pad: 0 }), t2 = AF.textModel(l2, bd, { pad: 0 }), Wd = Math.max(t1.w, t2.w) + 6, Ht = 7 + 7 + 7, m = new AF.Model(Wd, Ht, 2);
        m.box(0, 0, 0, Wd, Ht, 2, bg); m.box(0, 0, 0, Wd, 1, 2, bd); m.box(0, Ht - 1, 0, Wd, Ht, 2, bd); m.box(0, 0, 0, 1, Ht, 2, bd); m.box(Wd - 1, 0, 0, Wd, Ht, 2, bd);
        const put2 = (t, oy) => { const ox = Math.floor((Wd - t.w) / 2); for (let x = 0; x < t.w; x++) for (let y = 0; y < 7; y++) if (t.get(x, y, 0)) { const col = t.get(x, y, 0); m.set(ox + x, oy + y, 1, col); m.set(Wd - 1 - ox - x, oy + y, 0, col); } };
        put2(t1, 11); put2(t2, 3); return AF.meshModel(m, { vs: 1 / 32 }); };
      const c = AF.col, red = c(0xb3242a, { jitter: 0.05, edge: 0.1, rough: 0.3 }), cr = c(0xf2e6c4, { jitter: 0.05, edge: 0, rough: 0.3 }), nv = c(0x1f3a6b, { jitter: 0.05, edge: 0.1, rough: 0.3 }), yl = c(0xe8b84a, { jitter: 0.05, edge: 0, rough: 0.3 }), gr = c(0x2f5a3a, { jitter: 0.05, edge: 0.1, rough: 0.3 });
      adGs.push(ad('SOLACE COLA', 'ICE COLD 5¢', cr, red, yl), ad('GULL BRAND', 'SARDINES', yl, nv, cr), ad('SUNRISE', 'BREAD 10¢', red, cr, nv), ad('FLEET WEEK', 'SEPT 26', cr, gr, yl), ad('BEACON', 'TYRES', cr, nv, yl), ad('ROSE TALC', 'MODERN MISS', red, cr, gr));
    } catch (e) { adGs.length = 0; }
    const safetyGeo = (() => { const t = AF.textModel('SAFETY ZONE', k.board, { pad: 1 }), m = new AF.Model(Math.max(t.w, 12), 44, 3);
      const ox = Math.floor((m.w - t.w) / 2); for (let y = 0; y < 30; y++) m.box(Math.floor(m.w / 2) - 1, y, 1, Math.floor(m.w / 2) + 1, y + 1, 2, (y >> 2) & 1 ? k.board : k.safety);
      m.box(0, 30, 0, m.w, 30 + t.h + 2, 3, k.safety); for (let x = 0; x < t.w; x++) for (let y = 0; y < t.h; y++) if (t.get(x, y, 0)) { m.set(ox + x, 31 + y, 3 - 1 + 0, k.board); m.set(m.w - 1 - ox - x, 31 + y, 0, k.board); }
      return AF.meshModel(m, { vs: 1 / 16 }); })();
    for (const st of R.stations) {
      const p = P.railPoint(st.sC), rot = rotFor(p.dx, p.dz), yawTrack = Math.atan2(p.dz, -p.dx) ;
      const c = P.railSide(st.sC, 3.25);
      AF.placeStatic(sh, c.x, 0.25, c.z, rot, { collide: false });
      // shelter back wall + roof columns as colliders (thin)
      const back = P.railSide(st.sC, 4.0), a = P.railSide(st.sC - 2.5, 4.0), b = P.railSide(st.sC + 2.5, 4.0);
      AF.addCollider(Math.min(a.x, b.x) - 0.08, 0.25, Math.min(a.z, b.z) - 0.08, Math.max(a.x, b.x) + 0.08, 3, Math.max(a.z, b.z) + 0.08);
      // sign on two posts
      const nm = st.name.replace(/Paramount/g, 'Paragon').replace(/·/g, '-').replace(/\s+-\s+/g, ' - ');
      const sg = signGeo(nm), sw = sg.boundingBox ? 0 : (sg.computeBoundingBox(), 0);
      const sc = P.railSide(st.sC + 8.5, 3.3);
      AF.placeStatic(sg, sc.x, 2.3, sc.z, rot, { collide: false });
      const half = (sg.boundingBox.max.x - sg.boundingBox.min.x) / 2;
      for (const e of [-1, 1]) { const q = P.railSide(st.sC + 8.5 + e * Math.min(half, 5) * 0.9, 3.3); AF.placeStatic(sp, q.x, 0.25, q.z, 0, { collide: false }); AF.addCollider(q.x - 0.08, 0.25, q.z - 0.08, q.x + 0.08, 3, q.z + 0.08); }
      const tq = P.railSide(st.sC - 5, 3.6); AF.placeStatic(tt, tq.x, 0.25, tq.z, rot, { collide: false });
      if (lampG) { const lq = P.railSide(st.sC - 9, 3.3); AF.placeStatic(lampG, lq.x, 0.25, lq.z, 0, { collide: false }); AF.addCollider(lq.x - 0.2, 0.25, lq.z - 0.2, lq.x + 0.2, 4.8, lq.z + 0.2); AF.addLight({ x: lq.x, y: 4.4, z: lq.z, color: 0xffcf8a, intensity: 1.2, range: 14, kind: 'street' }); }
      AF.addLight({ x: c.x, y: 2.6, z: c.z, color: 0xffe0b0, intensity: 0.8, range: 7, kind: 'sign' });
      // people: 4 standing (queue along the island, facing the track), 2 sitting on the bench
      const faceYaw = Math.atan2(-(-p.dz), -(p.dx)) ;   // toward the track = -outward normal
      const nx = -p.dz, nz = p.dx, fy = Math.atan2(-nx, -nz);
      for (const o of [-10, -7, 4, 11]) { const q = P.railSide(st.sC + o, 2.9); AF.addSpot({ building: 'stop-' + st.id, x: q.x, y: 0.25, z: q.z, yaw: fy, kind: 'stand' }); }
      for (const o of [-1.2, 1.2]) { const q = P.railSide(st.sC + o, 3.55); AF.addSpot({ building: 'stop-' + st.id, x: q.x, y: 0.25 + 4 / 8, z: q.z, yaw: fy, kind: 'sit' }); }
      for (let qn = 0; qn < 6; qn++) { const q = P.railSide(st.sC - 9.5 + qn * 1.1 + (hash(qn, st.sC | 0) - 0.5) * 0.3, 2.95 + (hash(qn + 7, st.sC | 0) - 0.5) * 0.3); AF.addSpot({ building: 'stop-' + st.id, x: q.x, y: 0.25, z: q.z, yaw: fy + (hash(qn + 3, 5) - 0.5) * 0.8, kind: 'queue', queue: qn }); }
      if (routeG) { const rq = P.railSide(st.sC + 2.5, 4.12); AF.placeStatic(routeG, rq.x, 1.55, rq.z, rot, { collide: false }); }
      if (fareG) { const fq = P.railSide(st.sC - 2.5, 4.12); AF.placeStatic(fareG, fq.x, 1.7, fq.z, rot, { collide: false }); }
      AF.addLabel(st.name.replace(/Paramount/g, 'Paragon').split('·')[0].trim() + ' stop', c.x, c.z, 'station');
      RL.stops.push({ id: st.id, x: c.x, z: c.z });
      // SAFETY ZONE posts (yellow/black) at both ends of the island
      for (const e of [-11.4, 11.4]) { const q = P.railSide(st.sC + e, 3.1); AF.placeStatic(safetyGeo, q.x, 0.25, q.z, rot, { collide: false }); AF.addCollider(q.x - 0.15, 0.25, q.z - 0.15, q.x + 0.15, 2.4, q.z + 0.15); }
      if (st.id === 'paramount' || st.id === 'cityhall') clockStops.push({ x: c.x, z: c.z, rot, p });
      // round 2: enamel advertising panels on the pavement side of the shelter's back glass (period ads, original brands)
      if (adGs.length) { const si = RL.stops.length - 1; for (const [o, ai] of [[-1.25, si], [1.25, si + 3]]) { const aq = P.railSide(st.sC + o, 4.1 + 0.07); AF.placeStatic(adGs[ai % adGs.length], aq.x, 0.25 + 0.55, aq.z, rot, { collide: false }); } }
    }
  });

  // shelter clocks (two stops): a cream drum on the shelter crest with live hands
  AF.onBuild('rail-clocks', 486, () => {
    const k = pal(), hm = new THREE.MeshBasicMaterial({ color: 0x1a1a1a }), hG = new THREE.BoxGeometry(0.035, 0.2, 0.02), mG = new THREE.BoxGeometry(0.03, 0.28, 0.02);
    hG.translate(0, 0.09, 0); mG.translate(0, 0.13, 0);
    const cm = new AF.Model(6, 7, 6); cm.box(0, 0, 0, 6, 6, 6, k.clockFace); cm.box(0, 6, 0, 6, 7, 6, k.gold); cm.box(0, 0, 0, 6, 1, 6, k.jadeD);
    const cg = AF.meshModel(cm, { vs: 1 / 8 });
    const hands = [];
    for (const s of R.stations) {
      if (s.id !== 'paramount' && s.id !== 'cityhall') continue;
      const c = P.railSide(s.sC, 3.25), y = 0.25 + 26 / 8;
      AF.placeStatic(cg, c.x, y, c.z, 0, { collide: false });
      for (const [fx, fz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const g = new THREE.Group(); g.position.set(c.x + fx * 0.385, y + 0.4, c.z + fz * 0.385); g.rotation.y = Math.atan2(fx, fz);
        const h = new THREE.Mesh(hG, hm), m = new THREE.Mesh(mG, hm); g.add(h, m); AF.scene.add(g); hands.push([h, m]);
      }
    }
    AF.onTick('rail-clocks', 330, () => { const hr = AF.time.hours; for (const [h, m] of hands) { h.rotation.z = -(hr % 12) / 12 * Math.PI * 2; m.rotation.z = -(hr % 1) * Math.PI * 2; } });
  });

  AF.test('rail: 6 stop islands raised at their rects', () => {
    const bad = [];
    for (const st of R.stations) { const [x0, z0, x1, z1] = st.platform; const i = W.col((x0 + x1) / 2, (z0 + z1) / 2); if (i < 0 || W.H[i] !== 1) bad.push(st.id); }
    return { ok: R.stations.length === 6 && !bad.length, info: bad.length ? 'missing ' + bad : R.stations.length + ' islands' };
  });
  AF.test('rail: rails flush at road level + wire poles', () => {
    let bad = 0;
    for (let s = 0; s < R.length; s += 37) { const p = P.railPoint(s); const i = W.col(p.x - p.dz * 0.75, p.z + p.dx * 0.75); if (W.H[i] !== 0) bad++; }
    const np = AF.tramWire ? AF.tramWire.poles.length : 0;
    return { ok: bad === 0 && np >= 60, info: 'raised rail samples ' + bad + ', poles ' + np };
  });
}

} catch (e) { AF.partError('35-rail.js', e); }

