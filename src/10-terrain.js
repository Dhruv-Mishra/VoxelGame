// ================================================================ 10-terrain.js
try {
// ===== 10-terrain: Port Solace ground — flat city (h=1), THE SEA south of the quay (z 210), granite quay wall,
//       east breakwater (rubble heightmap) out to the lighthouse rock, Solace Heights (wooded hills + winding lane + villas),
//       Swan Lake + the skating pond, water meshes, horizon ring (N/E/W hills; the south is open sea)  (OWNER: land-harbour) =====
{
  const P = AF.PLAN, W = AF.W;
  const L = AF.land = AF.land || {};
  const clamp = AF.clamp, smooth = AF.smooth, N2 = AF.noise2, fbm = AF.fbm2, hash = AF.hash2;
  const HB = P.harbour, COAST = HB.coastZ, SEA_Y = HB.waterY;

  // ------------------------------------------------------------ shared helpers (nature + other parts use these)
  L.riverDist = () => ({ d: 999, s: 0 }); L.riverPoint = () => ({ x: -990, z: -990, dx: 0, dz: 1 }); L.riverLen = 0;
  L.creekEff = () => 999; L.upperCreek = () => false; L.poolEff = () => 999;
  const sdLoop = (x, z) => { const qx = Math.abs(x) - 140, qz = Math.abs(z) - 140; return Math.hypot(Math.max(qx, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qz), 0) - 20; };
  L.railDist = (x, z) => Math.abs(sdLoop(x, z));
  L.insideLoop = (x, z) => sdLoop(x, z) < 0;
  const LK = P.lake, PD = P.pond, PK = P.park;
  L.lakeE = (x, z) => Math.hypot((x - LK.cx) / LK.rx, (z - LK.cz) / LK.rz);
  L.rectDist = (x, z, r) => Math.hypot(Math.max(r[0] - x, 0, x - r[2]), Math.max(r[1] - z, 0, z - r[3]));
  L.inLot = (x, z, m = 0) => { for (const l of P.lots) { const r = l.rect; if (x > r[0] - m && x < r[2] + m && z > r[1] - m && z < r[3] + m) return l; } return null; };
  L.WATER_LOW = SEA_Y;          // -1.25 (the sea)
  L.SEA_Y = SEA_Y;
  L.LAKE_Y = LK.waterY ?? -0.75;
  L.POND_Y = -0.5;
  L.COAST = COAST;

  // ---- the east breakwater: polyline from the quay (x 280) out to the lighthouse rock
  const LH = HB.lighthouse;
  const BW = L.BREAKWATER = [[281, 208], [283, 232], [276, 256], [LH.x, LH.z]];
  const bwSegs = []; { let acc = 0; for (let i = 0; i < BW.length - 1; i++) { const [ax, az] = BW[i], [bx, bz] = BW[i + 1], len = Math.hypot(bx - ax, bz - az); bwSegs.push({ ax, az, dx: bx - ax, dz: bz - az, len, acc }); acc += len; } L.bwLen = acc; }
  L.bwDist = (x, z) => { let best = 1e18, s = 0; for (const g of bwSegs) { const u = clamp(((x - g.ax) * g.dx + (z - g.az) * g.dz) / (g.len * g.len), 0, 1); const ex = x - g.ax - g.dx * u, ez = z - g.az - g.dz * u, d = ex * ex + ez * ez; if (d < best) { best = d; s = g.acc + u * g.len; } } return { d: Math.sqrt(best), s }; };
  L.bwPoint = (s) => { for (const g of bwSegs) { if (s <= g.len || g === bwSegs[bwSegs.length - 1]) { const u = clamp(s / g.len, 0, 1); return { x: g.ax + g.dx * u, z: g.az + g.dz * u, dx: g.dx / g.len, dz: g.dz / g.len }; } s -= g.len; } return { x: LH.x, z: LH.z, dx: 0, dz: 1 }; };
  L.LH_ROCK = { x: LH.x, z: LH.z, r: 7.5 };

  // ---- Solace Heights: height (metres above y 0.25) for z < -248 outside Central Park
  const HT = P.heights;
  const heightsH = (x, z) => {
    if (z > HT.z1 + 2) return 0;
    let edge;
    if (x < PK.x0) edge = PK.x0 - 2 - x; else if (x > PK.x1) edge = x - PK.x1 - 2; else return 0;
    const t = clamp((HT.z1 + 2 - z) / 50, 0, 1);
    const f = smooth(0, 34, edge);   // r2: wider flank so the Heights meet the park as a wooded slope, not a cliff
    const h = (HT.height * Math.pow(t, 1.15) + (fbm(x * 0.03 + 4, z * 0.03 - 2, 3) - 0.45) * 5 * t) * f;
    return Math.max(0, h);
  };
  L.heightsH = heightsH;
  // winding lane up the east + west heights (gravel, 1-block steps), villas on pads
  const LANES = L.LANES = [
    [[110, -246], [118, -262], [138, -270], [160, -262], [184, -270], [206, -284], [232, -290], [258, -284]],
    [[-196, -246], [-204, -262], [-226, -268], [-248, -262], [-266, -276], [-282, -290]],
  ];
  const VILLAS = L.VILLAS = [
    { x: 150, z: -284, w: 14, d: 10, name: 'Belvedere', wall: 0xf1e4c6, roof: 0x4f8a78 },
    { x: 206, z: -296, w: 16, d: 8, name: 'Harrow House', wall: 0xe9d2b0, roof: 0xa8483a },
    { x: 262, z: -270, w: 12, d: 12, name: 'Castellane', wall: 0xf4ecda, roof: 0x3f6f8a },
    { x: -230, z: -284, w: 14, d: 10, name: 'Solace Manor', wall: 0xeadcc0, roof: 0x9a3e32 },
    { x: -280, z: -262, w: 10, d: 12, name: 'The Gables', wall: 0xf0e2c4, roof: 0x4c7a6a },
  ];

  AF.onBuild('land-terrain', 100, () => {
    const t0 = performance.now();
    const c = (hex, o) => AF.col(hex, o);
    const GR = {
      dark: c(0x5d8a37, { jitter: 0.9 }), base: AF.col('grass'), light: c(0x7da646, { jitter: 0.9 }), dry: c(0x88a049, { jitter: 0.9 }),
      litO: c(0x9c7a3e, { jitter: 1 }), litR: c(0x8e5a34, { jitter: 1 }), litG: c(0xa5953f, { jitter: 1 }), moss: c(0x557a34, { jitter: 0.9 }), olive: c(0x6e8a3a, { jitter: 0.9 }),
    };
    const ST = { light: c(0xa39e94, { jitter: 0.8 }), grey: c(0x8e8a82, { jitter: 0.8 }), dark: c(0x75716a, { jitter: 0.8 }), dirt: AF.col('dirt'), earth: c(0x67603f, { jitter: 0.8 }), loam: c(0x736a43, { jitter: 0.8 }) };
    const SEA = { sand: c(0xb8a878, { jitter: 0.7 }), sandD: c(0x9a8c64, { jitter: 0.7 }), weed: c(0x5e6a44, { jitter: 0.8 }), mud: c(0x6a624c, { jitter: 0.7 }), deep: c(0x4a5448, { jitter: 0.7 }), pebble: c(0x857f72, { jitter: 1 }) };
    const GRAN = [c(0x8f8b84, { jitter: 0.5, edge: 1 }), c(0x9f9a90, { jitter: 0.5, edge: 1 }), c(0x7d7a74, { jitter: 0.5, edge: 1 })];
    const WETG = c(0x4e5048, { jitter: 0.5, edge: 0.9 }), WEED = c(0x3f5234, { jitter: 0.6, edge: 0.6 });
    const RUB = [c(0x9a8a84, { jitter: 0.9, edge: 1, rough: 0.8 }), c(0xa89690, { jitter: 0.9, edge: 1, rough: 0.8 }), c(0x7e706c, { jitter: 0.9, edge: 1, rough: 0.8 }), c(0xb09c8c, { jitter: 0.9, edge: 1, rough: 0.8 }), c(0xc0803a, { jitter: 0.8, edge: 0.8 })];   // r2: grey-pink granite + orange lichen
    const CAP = c(0xb8a69c, { jitter: 0.4, edge: 0.9, pat: 'stone' }), CAPD = c(0xa4948a, { jitter: 0.4, edge: 0.9, pat: 'stone' });
    const LAKEB = { sand: c(0xc2ae7c, { jitter: 0.6 }), mid: c(0x7d7556, { jitter: 0.7 }), deep: c(0x4f5a46, { jitter: 0.7 }), pebble: c(0x8c877c, { jitter: 1 }), wet: c(0xa8956a, { jitter: 0.7 }) };
    const GRS = c(0x4f7432, { jitter: 0.9 }); const GRAV = [c(0xb8a888, { jitter: 1 }), c(0xa49678, { jitter: 1 })], CURB = c(0x8e8272, { jitter: 0.6, edge: 0.8 });
    L.cols = { GRAN, RUB, CAP, SEA };
    // r2: beach palette + shoreline + a trail of footprints down to the water
    const FP = []; { let x = -258, z = 211.2, k = 0; while (z < 222) { const sgn = k++ & 1 ? 1 : -1; FP.push([x + sgn * 0.18, z]); x -= 0.28; z += 0.62; } }
    const BEACH = L.BEACH = {
      dry: c(0xe6d6b0, { jitter: 0.6 }), dry2: c(0xdccaa0, { jitter: 0.6 }), wet: c(0xb8a888, { jitter: 0.5 }), wrack: c(0x6a6440, { jitter: 0.8 }), print: c(0xc8b48a, { jitter: 0.3 }),
      shore: (x) => 221.5 + Math.sin((x + 300) * 0.085) * 3.2 + (N2(x * 0.15, 3.7) - 0.5) * 2,
      foot: (x, z) => { if (x > -256 || x < -266 || z > 222.5) return false; for (const [fx, fz] of FP) if (Math.abs(x - fx) < 0.13 && Math.abs(z - fz) < 0.2) return true; return false; },
    };

    const H = W.H, C = W.C, S = W.S, NZ = W.NZ;
    for (let mx = 0; mx < 600; mx++) {
      for (let mz = 0; mz < 600; mz++) {
        const x0 = mx - 300, z0 = mz - 300, xc = x0 + 0.5, zc = z0 + 0.5;
        const bx0 = W.bx(x0), bz0 = W.bz(z0);
        const n1 = N2(xc * 0.022, zc * 0.022) * 0.8 + N2(xc * 0.07, zc * 0.07) * 0.2;
        // ---- sea (south of the quay)
        if (z0 >= COAST) {
          const dq = z0 - COAST, bw = L.bwDist(xc, zc).d, lr = Math.hypot(xc - LH.x, zc - LH.z);
          for (let i = 0; i < 4; i++) for (let k = 0; k < 4; k++) {
            const x = x0 + (i + 0.5) / 4, z = z0 + (k + 0.5) / 4, ci = (bx0 + i) * NZ + bz0 + k;
            const hp = hash(Math.floor(x * 2), Math.floor(z * 2));
            let hB = -16, top = dq < 5 ? (hp < 0.5 ? SEA.sand : SEA.sandD) : n1 < 0.3 ? SEA.weed : n1 < 0.62 ? SEA.mud : n1 < 0.75 ? SEA.sandD : SEA.deep;
            if (dq < 5 && hp > 0.85) top = SEA.pebble;
            let side = 0;
            // r2: SOLACE SANDS — a little bathing beach under the west boardwalk (curving shoreline, wet band, wrack line, footprints)
            if (x < -239 && z < 252) {
              const shore = BEACH.shore(x), yb = SEA_Y + (shore - z) * 0.11 - smooth(-247, -239, x) * 2.2;
              if (yb > -3.4) {
                const hb2 = clamp(Math.floor(yb * 4), -15, -2);
                if (hb2 > hB) {
                  hB = hb2; const dy = hb2 * 0.25 - SEA_Y;
                  top = dy > 0.5 ? (hp < 0.05 ? SEA.pebble : hp < 0.5 ? BEACH.dry : BEACH.dry2) : dy > -0.05 ? BEACH.wet : SEA.sandD;
                  if (dy > 0.72 && dy < 0.98 && hash(Math.floor(x * 3), 7) < 0.55) top = BEACH.wrack;
                  if (dy > 0.5 && BEACH.foot(x, z)) top = BEACH.print;
                  side = BEACH.wet;
                }
              }
            }
            // breakwater: capped walkway (y 0.5) on a rubble mound
            const bd = L.bwDist(x, z).d + (N2(x * 0.4, z * 0.4) - 0.5) * 1.2;
            const rk = Math.hypot(x - LH.x, z - LH.z) + (N2(x * 0.35 + 5, z * 0.35) - 0.5) * 1.6;
            const md = Math.min(bd, rk - 5.5 < 0 ? 0 : rk - 5.5 + 1.75);
            if (bd < 1.75 || rk < 5.5) { hB = 2; top = hp < 0.5 ? CAP : CAPD; side = RUB[(hp * 4) | 0]; }
            else if (md < 8) {
              const hr = 1 - Math.floor((md - 1.75) * 2.2) - Math.floor(hash(Math.floor(x * 1.3), Math.floor(z * 1.3)) * 3);
              hB = Math.max(-16, hr); const hr2 = hash(Math.floor(x * 1.5), Math.floor(z * 1.5)); top = RUB[hr2 < 0.14 && hB > -5 ? 4 : (hr2 * 4) | 0]; side = hr2 < 0.14 ? RUB[1] : top;
              if (hB < -4 && hp < 0.3) top = WEED;
            }
            H[ci] = hB; C[ci] = top; S[ci] = side;
          }
          continue;
        }
        // ---- quay apron + all of the city south of the heights: flat h=1
        const hh = z0 < -240 ? heightsH(xc, zc) : 0;
        const le = L.lakeE(xc, zc), pd = Math.hypot(xc - PD.cx, zc - PD.cz);
        let top = n1 < 0.36 ? GR.dark : n1 < 0.64 ? GR.base : GR.light;
        if (hh <= 0 && le > 1.12 && pd > PD.r + 2.5) {
          const q = z0 >= 170 ? GRAN[1] : top;
          for (let i = 0; i < 4; i++) for (let k = 0; k < 4; k++) { const ci = (bx0 + i) * NZ + bz0 + k; H[ci] = 1; C[ci] = q; S[ci] = z0 >= 205 ? GRAN[0] : 0; }
          continue;
        }
        for (let i = 0; i < 4; i++) for (let k = 0; k < 4; k++) {
          const x = x0 + (i + 0.5) / 4, z = z0 + (k + 0.5) / 4, ci = (bx0 + i) * NZ + bz0 + k;
          const hp = hash(Math.floor(x * 2), Math.floor(z * 2));
          let hB = 1, colT = top, colS = 0;
          if (hh > 0) {
            // terraced wooded hills: 3-block steps whose edges wander, the odd rock outcrop
            const h = heightsH(x, z), warp = (N2(x * 0.05 + 9, z * 0.05 - 4) - 0.5) * 1.6;
            const st = 2;
            hB = Math.max(1, Math.floor((h * 4 + warp * st) / st) * st + 1);
            const n2 = N2(x * 0.06 + 50, z * 0.06);
            colT = n2 < 0.16 ? GR.litO : n2 < 0.4 ? GR.dark : n2 < 0.62 ? GR.base : n2 < 0.78 ? GR.moss : n2 < 0.9 ? GR.light : GR.litR;
            const rn = N2(x * 0.045 + 2, z * 0.045 + 7);
            colS = rn > 0.74 ? ST.grey : GRS;
          }
          const lz = L.lakeE(x, z) + (N2(x * 0.25, z * 0.25) - 0.5) * 0.03;
          if (lz < 1.12) {
            if (lz < 0.72) { hB = -8; colT = LAKEB.deep; colS = ST.dark; }
            else if (lz < 0.86) { hB = -7; colT = LAKEB.mid; colS = ST.grey; }
            else if (lz < 0.96) { hB = -5; colT = LAKEB.sand; colS = LAKEB.wet; }
            else if (lz < 1.0) { hB = -4; colT = hp < 0.5 ? LAKEB.pebble : LAKEB.wet; colS = LAKEB.wet; }
            else if (lz < 1.05) { hB = -1; colT = hp < 0.5 ? LAKEB.wet : LAKEB.pebble; colS = LAKEB.wet; }
            else { hB = 0; colT = hp < 0.7 ? LAKEB.sand : GR.dry; colS = LAKEB.wet; }
          }
          const pz = Math.hypot(x - PD.cx, z - PD.cz);
          if (pz < PD.r + 2.5) {
            if (pz < PD.r - 1.5) { hB = -6; colT = hp < 0.6 ? LAKEB.mid : LAKEB.pebble; colS = ST.dark; }
            else if (pz < PD.r) { hB = -4; colT = LAKEB.pebble; colS = ST.grey; }
            else if (pz < PD.r + 1) { hB = 0; colT = LAKEB.wet; colS = ST.grey; }
          }
          H[ci] = hB; C[ci] = colT; S[ci] = colS;
        }
      }
    }
    // ---- lanes on the heights: gravel with a stone curb, 1-block steps following the ground
    L.lanePts = [];
    for (const lane of LANES) {
      let tot = 0; const segs2 = [];
      for (let i = 0; i < lane.length - 1; i++) { const [ax, az] = lane[i], [bx, bz] = lane[i + 1], len = Math.hypot(bx - ax, bz - az); segs2.push({ ax, az, dx: bx - ax, dz: bz - az, len }); tot += len; }
      for (const g of segs2) {
        for (let s = 0; s < g.len; s += 0.25) {
          const x = g.ax + g.dx * s / g.len, z = g.az + g.dz * s / g.len, nx = -g.dz / g.len, nz = g.dx / g.len;
          const hb = Math.max(1, Math.round(heightsH(x, z) * 4) + 1);
          if (((s * 4) | 0) % 40 === 0) L.lanePts.push([x, z, hb * 0.25]);
          for (let o = -2.5; o <= 2.5; o += 0.25) {
            const ci = W.col(x + nx * o, z + nz * o); if (ci < 0) continue;
            const ao = Math.abs(o);
            if (ao < 1.9) { H[ci] = hb; C[ci] = GRAV[hash(Math.floor((x + nx * o) * 2), Math.floor((z + nz * o) * 2)) < 0.6 ? 0 : 1]; S[ci] = ST.dirt; }
            else if (ao < 2.2) { H[ci] = hb + 1; C[ci] = CURB; S[ci] = CURB; }
            else if (H[ci] > hb + 4) { H[ci] = hb + 4; S[ci] = ST.grey; }
          }
        }
      }
    }
    // ---- villa pads (flat terraces at the pad-centre height)
    for (const v of VILLAS) {
      const hb = Math.max(1, Math.round(heightsH(v.x, v.z) * 4) + 1); v.y = hb * 0.25;
      W.eachCol(v.x - v.w / 2 - 4, v.z - v.d / 2 - 4, v.x + v.w / 2 + 4, v.z + v.d / 2 + 4, (bx, bz, i) => { H[i] = hb; S[i] = ST.grey; });
    }
    // ---- side colouring: granite courses on the quay wall, rubble on the breakwater, strata on the heights
    W.sideFn = (bx, bz, by, top) => {
      if (bz >= 1990) {        // z >= 197.5: quay wall / breakwater
        if (by < -5) return by < -12 ? WETG : (by & 1 ? WETG : GRAN[2]);
        if (bz >= 2040) return 0;   // out in the harbour (breakwater): use column side colour
        const course = (by + 16) >> 1, jt = ((bx + (course & 1) * 3) >> 3) & 3;
        return by >= 0 ? GRAN[jt % 3] : (by === -5 ? WEED : GRAN[(jt + 1) % 3]);
      }
      return 0;
    };
    W.tDirty = true;
    L.terrainMs = Math.round(performance.now() - t0);
  });

  // ------------------------------------------------------------ water meshes: the sea (far past the map edge), Swan Lake, the skating pond
  AF.onBuild('land-water', 120, () => {
    const t0 = performance.now();
    const mk = (kind, x0, z0, x1, z1, y, test) => {
      const pos = [], nrm = [], idx = []; let n = 0;
      for (let x = x0; x < x1; x++) for (let z = z0; z < z1; z++) {
        if (!test(x + 0.5, z + 0.5)) continue;
        let low = false;
        for (let i = 0; i < 4 && !low; i++) for (let k = 0; k < 4; k++) { if (W.groundY(x + i * 0.25 + 0.1, z + k * 0.25 + 0.1) < y - 0.01) { low = true; break; } }
        if (!low) continue;
        pos.push(x, y, z, x, y, z + 1, x + 1, y, z + 1, x + 1, y, z); nrm.push(0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0);
        idx.push(n, n + 1, n + 2, n, n + 2, n + 3); n += 4;
      }
      return fin(kind, pos, nrm, idx, n, y);
    };
    const fin = (kind, pos, nrm, idx, n, y) => {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
      g.setIndex(n > 65535 ? new THREE.Uint32BufferAttribute(idx, 1) : new THREE.Uint16BufferAttribute(idx, 1));
      g.computeBoundingSphere(); g.computeBoundingBox();
      g.userData.kind = kind; g.userData.waterY = y; g.userData.quads = n / 4;
      return g;
    };
    // the sea: big quads (the harbour inside the map is 8 m tiles so the shader's view vector stays precise)
    const sp = [], sn = [], si = []; let sN = 0;
    const q = (x0, z0, x1, z1) => { sp.push(x0, SEA_Y, z0, x0, SEA_Y, z1, x1, SEA_Y, z1, x1, SEA_Y, z0); sn.push(0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0); si.push(sN, sN + 1, sN + 2, sN, sN + 2, sN + 3); sN += 4; };
    for (let x = -300; x < 300; x += 8) for (let z = COAST; z < 300; z += 8) q(x, z, x + 8, Math.min(300, z + 8));
    for (let x = -1500; x < 1500; x += 100) for (let z = 300; z < 1500; z += 100) q(x, z, x + 100, z + 100);
    for (let z = 150; z < 300; z += 50) { for (let x = -1500; x < -300; x += 100) q(x, Math.max(z, 200), Math.min(x + 100, -300), z + 50); for (let x = 300; x < 1500; x += 100) q(x, Math.max(z, 200), x + 100, z + 50); }
    const sea = fin('lake', sp, sn, si, sN, SEA_Y); sea.userData.sea = true;
    const lake = mk('lake', Math.floor(LK.cx - LK.rx - 3), Math.floor(LK.cz - LK.rz - 3), Math.ceil(LK.cx + LK.rx + 3), Math.ceil(LK.cz + LK.rz + 3), L.LAKE_Y, (x, z) => L.lakeE(x, z) <= 1.06);
    const pond = mk('pond', PD.cx - PD.r - 2, PD.cz - PD.r - 2, PD.cx + PD.r + 2, PD.cz + PD.r + 2, L.POND_Y, (x, z) => Math.hypot(x - PD.cx, z - PD.cz) < PD.r + 0.5);
    L.water = { sea, lake, pond };
    for (const g of [sea, lake, pond]) if (g.userData.quads) AF.addWater(g);
    L.waterMs = Math.round(performance.now() - t0);
  });

  // ------------------------------------------------------------ horizon v2: a WORLD around the city — rolling autumn hills (Euclidean, noise-warped,
  //   smooth sloped quads with baked slope light + aerial-perspective tint), ridges at ~600/900/1300 m, curving headlands framing the bay,
  //   far canopy clumps (autumn / evergreen / bare), farm fields + farmhouses, hill villages, a steeple town (W), a lattice radio mast with a
  //   blinking red light + a railway viaduct (E), the Heights continuing north with a SOLACE HEIGHTS sign, an observatory and a water tower,
  //   and the open sea south with islands, a far lighthouse and steamers on the horizon.
  AF.onBuild('land-horizon', 125, () => {
    const t0 = performance.now();
    const G = AF.GeoBuf; if (typeof G !== 'function') return;
    const R0 = 300, lerp = AF.lerp;
    const sdSq = (x, z) => Math.hypot(Math.max(Math.abs(x) - R0, 0), Math.max(Math.abs(z) - R0, 0));
    // coast: the bay mouth is the map's south edge; headlands east + west curve south to frame the harbour
    const coastZ = (x) => { const ax = Math.abs(x); return ax < R0 ? COAST : COAST + (ax - R0) * 0.35 + 170 * smooth(330, 820, ax) + (fbm(x * 0.006, 3, 3) - 0.5) * 60; };
    L.coastZ = coastZ;
    const edgeGround = (x, z) => W.groundY(clamp(x, -R0 + 0.5, R0 - 0.5), clamp(z, -R0 + 0.5, COAST - 1));
    const hgt = (x, z) => {
      const sd = sdSq(x, z), d = Math.hypot(x, z * 1.05);
      const wp = (fbm(x * 0.0021 + 3, z * 0.0021 - 5, 3) - 0.5) * 160;
      let h = 3 + fbm(x * 0.006 + 4, z * 0.006, 4) * 16 * smooth(0, 160, sd);
      const ang = Math.atan2(z, x);
      for (const [Rr, A, Wd] of [[620, 26, 110], [900, 52, 150], [1300, 120, 230]]) {
        const tt = (d - Rr - wp) / Wd; h += A * Math.exp(-tt * tt * 2) * (0.45 + fbm(ang * 2.2 + Rr, Rr * 0.01, 3) * 1.1);
      }
      if (z < -R0) h += smooth(0, 140, -z - R0) * (34 + fbm(x * 0.01, 7, 3) * 22);        // the Heights keep climbing north
      const w = smooth(2, 70, sd);
      const e0 = edgeGround(x, z);
      h = lerp(e0, Math.max(e0 * 0.9, h), w);
      // r2: behind Central Park the hillside climbs straight up from the park's north edge (an amphitheatre of woods facing
      // the city, the sign on its steep face) instead of a flat brown bowl between the two in-map Heights
      if (z < -R0 + 1) { const dN = -z - R0; h = Math.max(h, (60 + (fbm(x * 0.012 + 3, 9, 3) - 0.5) * 16) * smooth(0, 115, dN) * smooth(640, 380, Math.abs(x))); }
      // shore: down to a beach and under the sea past the coastline
      const inland = coastZ(x) - z;
      if (z > COAST - 90) h = Math.min(h, inland < 0 ? -4 : lerp(0.35, h, smooth(4, 90, inland)));
      return h;
    };
    // ---- palette: autumn ramp × slope light × aerial perspective (warm toward the western sun, cool away)
    const HUES = { rust: 0x8a4a2a, ochre: 0xb08a3a, olive: 0x5a6a3a, ever: 0x2e4a34, field: 0xc8a860, beach: 0xd8c8a0, rock: 0x8a847c, meadow: 0x7a8a42, plough: 0x7a5a3e, scrub: 0xa08a4a };
    const HZW = 0xc9a98f, HZC = 0x9aa4c0;
    const mixHex = (a, b, t) => { const f = (s) => Math.round(((a >> s) & 255) * (1 - t) + ((b >> s) & 255) * t); return (f(16) << 16) | (f(8) << 8) | f(0); };
    const scaleHex = (a, k) => { const f = (s) => Math.min(255, Math.round(((a >> s) & 255) * k)); return (f(16) << 16) | (f(8) << 8) | f(0); };
    const pcache = new Map();
    const pc = (hue, lit, hz, warm) => {
      const key = hue + '|' + lit + '|' + hz + '|' + warm; let c = pcache.get(key);
      if (c == null) { const base = scaleHex(HUES[hue], [0.72, 0.9, 1.08][lit]); c = AF.col(mixHex(base, warm ? HZW : HZC, hz * 0.065), { jitter: 0.35 }); pcache.set(key, c); }   // r2 clarity: half the baked haze
      return c;
    };
    const Ld = [-0.62, 0.62, 0.3]; { const l = Math.hypot(...Ld); Ld[0] /= l; Ld[1] /= l; Ld[2] /= l; }
    const SGX = 0, SGZ = -372;
    const nearN = (x, z) => z < -R0 + 1 && z > -R0 - 170 && Math.abs(x) < 420;
    const inClearing = (x, z) => { const ex = (x - SGX) / (74 + (N2(z * 0.08, 3) - 0.5) * 14), ez = (z - SGZ - 7) / (15 + (N2(x * 0.06, 7) - 0.5) * 8); return ex * ex + ez * ez < 1; };
    L.nearN = nearN;
    const hueAt = (x, z, h, slope) => {
      if (h < 1.6 && z > coastZ(x) - 45) return 'beach';
      const nn = nearN(x, z);
      if (nn && inClearing(x, z)) return N2(x * 0.09 + 4, z * 0.09) < 0.5 ? 'scrub' : 'meadow';
      if (slope > (nn ? 1.7 : 0.9)) return 'rock';
      const f = fbm(x * 0.0045 + 11, z * 0.0045 - 3, 3), g = N2(x * 0.02 + 5, z * 0.02 + 1);
      if (!nn && h < 30 && slope < 0.25 && f > 0.56) return g < 0.5 ? 'field' : g < 0.75 ? 'plough' : 'meadow';
      const a = fbm(x * 0.008 - 2, z * 0.008 + 6, 3);
      return a < 0.38 ? 'ever' : a < 0.5 ? 'olive' : a < 0.62 ? 'rust' : 'ochre';
    };
    // r2: the horizon is split into ~500 m chunks so the camera frustum culls what is behind it (was one 1M-quad mesh)
    const CHS = 508, NCH = 6, chunks = new Map();
    const bufAt = (x, z) => { const i = clamp(Math.floor((x + 1524) / CHS), 0, NCH - 1), k = clamp(Math.floor((z + 1524) / CHS), 0, NCH - 1), key = i * NCH + k; let b = chunks.get(key); if (!b) { b = new G(); chunks.set(key, b); } return b; };
    const buf = { quad(a, b, c, d, e, f, g, h, i, j, k) { bufAt(a[0], a[2]).quad(a, b, c, d, e, f, g, h, i, j, k); } };
    const cells = [];         // [x,z,y,hue] for clump + house placement
    const mesh = (cs, RI, R1) => {
      const n = Math.round((R1 * 2) / cs), V = new Float32Array((n + 1) * (n + 1));
      for (let i = 0; i <= n; i++) for (let k = 0; k <= n; k++) V[i * (n + 1) + k] = hgt(-R1 + i * cs, -R1 + k * cs);
      const hv = (i, k) => V[i * (n + 1) + k];
      for (let i = 0; i < n; i++) for (let k = 0; k < n; k++) {
        const xa = -R1 + i * cs, za = -R1 + k * cs, xb = xa + cs, zb = za + cs;
        if (xa >= -RI && xb <= RI && za >= -RI && zb <= RI) continue;
        const h00 = hv(i, k), h01 = hv(i, k + 1), h11 = hv(i + 1, k + 1), h10 = hv(i + 1, k);
        if (Math.max(h00, h01, h11, h10) < -3.5) continue;
        const xc = xa + cs / 2, zc = za + cs / 2, hc = (h00 + h01 + h11 + h10) / 4;
        const gx = ((h10 + h11) - (h00 + h01)) / (2 * cs), gz = ((h01 + h11) - (h00 + h10)) / (2 * cs);
        const nl = Math.hypot(gx, 1, gz), dot = (-gx * Ld[0] + Ld[1] - gz * Ld[2]) / nl, slope = Math.hypot(gx, gz);
        const lit = dot > 0.78 ? 2 : dot > 0.5 ? 1 : 0;
        const dd = Math.hypot(xc, zc), hz = Math.min(5, Math.floor(smooth(350, 1500, dd) * 6)), warm = xc < -100 ? 1 : 0;
        const hue = hueAt(xc, zc, hc, slope);
        buf.quad([xa, h00, za], [xa, h01, zb], [xb, h11, zb], [xb, h10, za], [xa / 2, za / 2], [xa / 2, zb / 2], [xb / 2, zb / 2], [xb / 2, za / 2], pc(hue, lit, hz, warm), 2, [3, 3, 3, 3]);
        if (hc > 2 && hue !== 'beach' && hue !== 'rock') cells.push([xc, zc, hc, hue, cs, sdSq(xc, zc), slope]);
      }
      // skirt around the inner hole (hides cracks against the voxel map edge / the finer grid)
      const sk = (ax, az, bx, bz, ha, hb, nI) => { const c = pc('olive', 0, 0, 0); buf.quad([ax, -6, az], [bx, -6, bz], [bx, hb, bz], [ax, ha, az], [0, 0], [1, 0], [1, 1], [0, 1], c, nI, [2, 2, 2, 2]); buf.quad([ax, ha, az], [bx, hb, bz], [bx, -6, bz], [ax, -6, az], [0, 1], [1, 1], [1, 0], [0, 0], c, nI ^ 1, [2, 2, 2, 2]); };
      const i0 = Math.round((R1 - RI) / cs), i1 = n - i0;
      for (let t = i0; t < i1; t++) {
        const a = -R1 + t * cs, b = a + cs;
        if (a < COAST) { sk(-RI, a, -RI, b, hv(i0, t), hv(i0, t + 1), 1); sk(RI, b, RI, a, hv(i1, t + 1), hv(i1, t), 0); }
        sk(b, -RI, a, -RI, hv(t + 1, i0), hv(t, i0), 5);
      }
    };
    const TM = L.horizonT = {};
    mesh(6, R0, 516);
    mesh(24, 516, 1524);
    TM.ground = Math.round(performance.now() - t0);

    // ---- far canopy clumps: 1 m voxel trees from the nature specs, merged into the horizon mesh
    const specs = L.treeSpecs || [];
    const clumpLib = { autumn: [], ever: [], bare: [] };
    if (L.makeTree && specs.length) {
      const pickS = (id) => specs.find((s) => s.id === id);
      const mk = (spec, seed, vs, kind) => { if (!spec) return; const t = L.makeTree(spec, seed, vs); const g = AF.meshModel(t.m, { vs, anchor: [0.5, 0, 0.5] }); clumpLib[kind].push({ g, vs }); };
      let sd = 900;
      for (const id of ['maple-scarlet', 'maple-orange', 'maple-gold', 'red-oak', 'oak', 'elm', 'sweetgum', 'pin-oak']) for (const sc of [0.7, 1.05]) { const s0 = pickS(id); if (s0) mk(Object.assign({}, s0, { h: s0.h * sc, w: s0.w * sc }), sd++, 1, 'autumn'); }
      for (const id of ['pine', 'spruce']) for (const sc of [0.8, 1.2]) { const s0 = pickS(id); if (s0) mk(Object.assign({}, s0, { h: s0.h * sc, w: s0.w * sc }), sd++, 1, 'ever'); }
      const s0 = pickS('oak'); if (s0) for (const sc of [0.8, 1.1]) mk(Object.assign({}, s0, { h: s0.h * sc, w: s0.w * sc * 0.8, leaves: [0x6a5446, 0x5a4a3e, 0x4e4036, 0x7a6450] }), sd++, 1, 'bare');
      // r2: a finer (1/2 m) set for the first ~28 m of hillside behind the park, where eye-level cameras get close
      clumpLib.fine = []; clumpLib.fineEver = [];
      for (const id of ['maple-scarlet', 'maple-orange', 'maple-gold', 'red-oak', 'elm', 'sweetgum']) { const s1 = pickS(id); if (s1) { const t = L.makeTree(Object.assign({}, s1), sd++, 0.5); clumpLib.fine.push({ g: AF.meshModel(t.m, { vs: 0.5, anchor: [0.5, 0, 0.5] }), vs: 0.5 }); } }
      for (const id of ['pine', 'spruce']) { const s1 = pickS(id); if (s1) { const t = L.makeTree(Object.assign({}, s1), sd++, 0.5); clumpLib.fineEver.push({ g: AF.meshModel(t.m, { vs: 0.5, anchor: [0.5, 0, 0.5] }), vs: 0.5 }); } }
    }
    const appendGeo = (g, x, y, z, s = 1) => {
      const p = g.attributes.position.array, uv = g.attributes.aBU.array, pal = g.attributes.aPal.array, an = g.attributes.aAN.array, ix = g.index.array;
      const B = bufAt(x, z), b = B.n;
      for (let v = 0; v < p.length / 3; v++) { B.p.push(x + p[v * 3] * s, y + p[v * 3 + 1] * s, z + p[v * 3 + 2] * s); B.uv.push(uv[v * 2], uv[v * 2 + 1]); B.pal.push(pal[v]); B.an.push(an[v]); }
      for (let q = 0; q < ix.length; q++) B.idx.push(b + ix[q]);
      B.n += p.length / 3;
    };
    TM.lib = Math.round(performance.now() - t0);
    // r2: HEIGHTS DRIVE — a lamp-lit switchback climbing the wooded face behind Central Park, past villas to the crest
    const DRIVE = L.DRIVE = [
      [[74, -301], [30, -310], [-40, -318], [-100, -326], [-128, -338], [-104, -350], [-40, -349], [30, -347], [96, -352], [128, -366],
       [112, -386], [70, -396], [0, -402], [-80, -404], [-150, -396], [-196, -378], [-212, -362]],
      [[96, -352], [140, -348], [168, -338]],
    ];
    const driveSegs = [];
    for (const pl of DRIVE) for (let i = 0; i < pl.length - 1; i++) { const [ax, az] = pl[i], [bx, bz] = pl[i + 1], len = Math.hypot(bx - ax, bz - az); driveSegs.push({ ax, az, dx: bx - ax, dz: bz - az, len }); }
    const INC = L.INCLINE = { x: -152, z0: -303, z1: -388 };      // r2: Heights Incline Railway (funicular) up the wooded face
    L.roadNear = (x, z, m) => { for (const g of driveSegs) { const u = clamp(((x - g.ax) * g.dx + (z - g.az) * g.dz) / (g.len * g.len), 0, 1); if (Math.hypot(x - g.ax - g.dx * u, z - g.az - g.dz * u) < m) return true; } return false; };
    let clumps = 0;
    const RC = AF.rng(4417);
    const hasClumps = clumpLib.autumn.length > 0;
    for (const [x, z, h, hue, cs, sd, slope] of cells) {
      const nn = nearN(x, z);
      if (!hasClumps || sd < 3 || sd > 520 || slope > (nn ? 1.6 : 0.7)) continue;
      const forest = hue === 'ever' || hue === 'rust' || hue === 'ochre' || hue === 'olive';
      const dens = forest ? (nn ? 1 : sd < 100 ? 0.8 : 0.45) : (nn && (hue === 'meadow' || hue === 'scrub') ? 1 : 0.05);
      const nper = cs <= 6 ? 1 : 3;
      for (let q = 0; q < nper; q++) {
        if (RC() > dens * (cs <= 6 ? (nn ? 0.92 : 0.5) : 0.35)) continue;
        const px = x + (RC() - 0.5) * cs * 0.9, pz = z + (RC() - 0.5) * cs * 0.9;
        if (sdSq(px, pz) < 3 || pz > coastZ(px) - 6) continue;
        const behindSign = Math.abs(px - SGX) < 70 && pz < SGZ + 3 && pz > SGZ - 16;
        if (inClearing(px, pz) || behindSign) {      // the scrub clearing keeps the SOLACE HEIGHTS sign readable: only low bushes
          if (RC() < 0.3) { const lb = clumpLib.autumn; appendGeo(lb[(RC() * lb.length) | 0].g, Math.round(px * 2) / 2, hgt(px, pz) - 0.3, Math.round(pz * 2) / 2, 0.32 + RC() * 0.12); clumps++; }
          continue;
        }
        if (L.roadNear && L.roadNear(px, pz, 6.5)) continue;
        if (Math.abs(px - INC.x) < 6 && pz < INC.z0 + 2 && pz > INC.z1 - 10) continue;
        const r = RC(), kind = hue === 'ever' ? (r < 0.75 ? 'ever' : 'autumn') : (r < 0.72 ? 'autumn' : r < 0.87 ? 'ever' : 'bare');
        let lib = clumpLib[kind].length ? clumpLib[kind] : clumpLib.autumn;
        if (nn && sd < 28 && clumpLib.fine && clumpLib.fine.length) lib = kind === 'ever' && clumpLib.fineEver.length ? clumpLib.fineEver : clumpLib.fine;
        const it = lib[(RC() * lib.length) | 0];
        appendGeo(it.g, Math.round(px * 2) / 2, hgt(px, pz) - 0.5, Math.round(pz * 2) / 2, sd > 260 ? 1.25 : nn ? 1.1 + RC() * 0.25 : sd > 100 ? 1.2 : 1);
        clumps++;
      }
    }

    TM.clumps = Math.round(performance.now() - t0);
    // ---- simple far buildings: farmhouses, hill-village houses, a steeple town (W), barns
    const box = (x0, y0, z0, x1, y1, z1, c, cTop) => {
      const T = cTop ?? c;
      buf.quad([x0, y1, z0], [x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0 * 4, z0 * 4], [x0 * 4, z1 * 4], [x1 * 4, z1 * 4], [x1 * 4, z0 * 4], T, 2, [3, 3, 3, 3]);
      buf.quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [z1 * 4, y0 * 4], [z0 * 4, y0 * 4], [z0 * 4, y1 * 4], [z1 * 4, y1 * 4], c, 0, [1, 1, 3, 3]);
      buf.quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [z0 * 4, y0 * 4], [z1 * 4, y0 * 4], [z1 * 4, y1 * 4], [z0 * 4, y1 * 4], c, 1, [1, 1, 3, 3]);
      buf.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [x0 * 4, y0 * 4], [x1 * 4, y0 * 4], [x1 * 4, y1 * 4], [x0 * 4, y1 * 4], c, 4, [1, 1, 3, 3]);
      buf.quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [x1 * 4, y0 * 4], [x0 * 4, y0 * 4], [x0 * 4, y1 * 4], [x1 * 4, y1 * 4], c, 5, [1, 1, 3, 3]);
    };
    // stepped gable roof along x
    const roof = (x0, y0, z0, x1, z1, c) => { const d = z1 - z0; for (let i = 0; i < 4; i++) { const ins = d * 0.13 * i; box(x0, y0 + i * d * 0.12, z0 + ins, x1, y0 + (i + 1) * d * 0.12, z1 - ins, c); } };
    const WALLS = [0xf2ede2, 0xe8dcc4, 0xd8c8a8, 0xf4ecda, 0xc8b89a].map((h) => AF.col(h, { jitter: 0.3 }));
    const ROOFS = [0xb35a3a, 0x8a4a3a, 0x6a5a5a, 0x4f7a6a, 0x9a3e32].map((h) => AF.col(h, { jitter: 0.4 }));
    const WINL = AF.col(0xffd89a, { emit: 0xffb060, emitK: 2.2, mode: 'night' });
    const barnR = AF.col(0x9a3a2a, { jitter: 0.4 }), stoneW = AF.col(0xb8b0a0, { jitter: 0.4 }), steelC = AF.col(0x6a6660, { jitter: 0.2, metal: 0.6, rough: 0.5 });
    const house = (x, z, s, rng) => {
      const y = hgt(x, z) - 0.3, w = (6 + rng() * 5) * s, d = (5 + rng() * 3) * s, hh = (4 + rng() * 3) * s;
      const wc = WALLS[(rng() * WALLS.length) | 0], rc = ROOFS[(rng() * ROOFS.length) | 0];
      box(x - w / 2, y, z - d / 2, x + w / 2, y + hh, z + d / 2, wc);
      roof(x - w / 2 - 0.4, y + hh, z - d / 2 - 0.4, x + w / 2 + 0.4, z + d / 2 + 0.4, rc);
      if (rng() < 0.55) box(x - w / 4, y + hh * 0.35, z + d / 2, x - w / 4 + 1.2 * s, y + hh * 0.35 + 1.4 * s, z + d / 2 + 0.15, WINL);
      if (rng() < 0.35) box(x + w / 5, y + hh * 0.35, z + d / 2, x + w / 5 + 1.2 * s, y + hh * 0.35 + 1.4 * s, z + d / 2 + 0.15, WINL);
      if (rng() < 0.5) box(x + w / 2 - 1.6 * s, y + hh, z - 0.6 * s, x + w / 2 - 0.6 * s, y + hh + 3 * s, z + 0.4 * s, AF.col(0x8a4a38, { jitter: 0.4 }));
    };
    const RH = AF.rng(733);
    let houses = 0;
    // farmhouses + barns on field cells, villages clustered on the near hills
    for (const [x, z, h, hue, cs, sd] of cells) {
      if (sd < 20 || sd > 700) continue;
      if ((hue === 'field' || hue === 'meadow' || hue === 'plough') && RH() < (cs <= 6 ? 0.012 : 0.05)) {
        house(x, z, 1, RH); houses++;
        if (RH() < 0.6) { const bx = x + 12, bz = z + 4, by = hgt(bx, bz) - 0.3; box(bx - 5, by, bz - 4, bx + 5, by + 6, bz + 4, barnR); roof(bx - 5.4, by + 6, bz - 4.4, bx + 5.4, bz + 4.4, ROOFS[2]); }
      }
      const vil = N2(x * 0.004 + 21, z * 0.004 - 13);
      if (vil > 0.66 && sd < 450 && RH() < (cs <= 6 ? 0.1 : 0.4)) { house(x + (RH() - 0.5) * cs, z + (RH() - 0.5) * cs, 1, RH); houses++; }
    }
    // r2: Heights Drive surface (draped quads), kerb lamps (bulbs glow at dusk), and hillside villas along it
    { const ROADC = AF.col(0x6a6258, { jitter: 0.5, rough: 0.85 }), KERB = AF.col(0xb8ae9a, { jitter: 0.3 }), POLE = AF.col(0x2e3a32, { jitter: 0.1, metal: 0.5, rough: 0.5 });
      const BULB = AF.col(0xfff0c8, { emit: 0xffc878, emitK: 3.4, mode: 'night' });
      const VW = [0xf2ede2, 0xf4ecda, 0xefe6d2, 0xe8dcc4].map((h) => AF.col(h, { jitter: 0.25 })), VR = [0xb35a3a, 0xa8483a, 0x9a3e32, 0x4f7a6a].map((h) => AF.col(h, { jitter: 0.35 }));
      const RV = AF.rng(1936); let lampAcc = 0, lamps = 0, vil = 0, villaAcc = 0;
      const W2 = 2.6, st = 3;
      for (const g of driveSegs) {
        const ux = g.dx / g.len, uz = g.dz / g.len, nx = -uz, nz = ux;
        for (let s = 0; s < g.len; s += st) {
          const s1 = Math.min(g.len, s + st), ax = g.ax + ux * s, az = g.az + uz * s, bx = g.ax + ux * s1, bz = g.az + uz * s1;
          const ya = hgt(ax, az) + 0.55, yb = hgt(bx, bz) + 0.55;
          buf.quad([ax + nx * W2, ya, az + nz * W2], [bx + nx * W2, yb, bz + nz * W2], [bx - nx * W2, yb, bz - nz * W2], [ax - nx * W2, ya, az - nz * W2], [0, 0], [0, 1], [1, 1], [1, 0], ROADC, 2, [3, 3, 3, 3]);
          for (const sg of [1, -1]) { const ox = nx * sg, oz = nz * sg;
            buf.quad([ax + ox * (W2 + 0.5), ya + 0.3, az + oz * (W2 + 0.5)], [bx + ox * (W2 + 0.5), yb + 0.3, bz + oz * (W2 + 0.5)], [bx + ox * W2, yb + 0.3, bz + oz * W2], [ax + ox * W2, ya + 0.3, az + oz * W2], [0, 0], [0, 1], [1, 1], [1, 0], KERB, 2, [3, 3, 3, 3]); }
          lampAcc += st; villaAcc += st;
          if (lampAcc >= 18) { lampAcc = 0; lamps++;
            const lx = ax + nx * (W2 + 1), lz = az + nz * (W2 + 1), ly = hgt(lx, lz) - 0.2;
            box(lx - 0.15, ly, lz - 0.15, lx + 0.15, ly + 4.6, lz + 0.15, POLE); box(lx - 0.35, ly + 4.4, lz - 0.35, lx + 0.35, ly + 5.2, lz + 0.35, BULB); }
          if (villaAcc >= 34 && RV() < 0.8) { villaAcc = 0;
            const sd2 = RV() < 0.5 ? 1 : -1, off = W2 + 9 + RV() * 4, vx = ax + nx * off * sd2, vz = az + nz * off * sd2;
            if (inClearing(vx, vz) || L.roadNear(vx, vz, 7.5) || sdSq(vx, vz) < 8 || (Math.abs(vx - INC.x) < 12 && vz > INC.z1 - 14)) continue;
            const vy = hgt(vx, vz), w = 9 + RV() * 5, d = 7 + RV() * 3, hh = 4.5 + RV() * 2.5, wc = VW[(RV() * 4) | 0];
            const y0 = vy - 3.5;       // a stone terrace under the house bites into the slope
            box(vx - w / 2 - 1.2, y0, vz - d / 2 - 1.2, vx + w / 2 + 1.2, vy + 0.6, vz + d / 2 + 1.2, stoneW);
            box(vx - w / 2, vy + 0.6, vz - d / 2, vx + w / 2, vy + 0.6 + hh, vz + d / 2, wc);
            if (RV() < 0.45) { box(vx - w / 2 - 0.3, vy + 0.6 + hh, vz - d / 2 - 0.3, vx + w / 2 + 0.3, vy + 1.0 + hh, vz + d / 2 + 0.3, wc);       // streamline moderne: flat roof + a round-cornered upper storey
              box(vx - w / 4, vy + 1.0 + hh, vz - d / 3, vx + w / 2 - 0.5, vy + 3.6 + hh, vz + d / 3, wc);
              box(vx - w / 4 + 0.5, vy + 2 + hh, vz + d / 3, vx + w / 2 - 1, vy + 2.9 + hh, vz + d / 3 + 0.12, WINL); }
            else roof(vx - w / 2 - 0.5, vy + 0.6 + hh, vz - d / 2 - 0.5, vx + w / 2 + 0.5, vz + d / 2 + 0.5, VR[(RV() * 4) | 0]);
            for (let k = 0; k < 3; k++) if (RV() < 0.7) { const wx = vx - w / 2 + 1.2 + k * (w - 2.4) / 2; box(wx - 0.6, vy + 1.8, vz + d / 2, wx + 0.6, vy + 3.4, vz + d / 2 + 0.12, WINL); }
            if (RV() < 0.6) { box(vx + w / 2 - 2, vy + 0.6 + hh, vz - 0.5, vx + w / 2 - 1, vy + 3.6 + hh, vz + 0.5, AF.col(0x8a4a38, { jitter: 0.4 })); if (vil % 2 === 0 && AF.addChimney) AF.addChimney(vx + w / 2 - 1.5, vy + 3.7 + hh, vz); }
            vil++; houses++; }
        }
      }
      TM.drive = { lamps, villas: vil };
    }
    // r2: THE HEIGHTS INCLINE — two counterbalanced funicular cars on a trestle, passing on a loop halfway up
    { const len = INC.z0 - INC.z1, N = Math.ceil(len), Y = new Float32Array(N + 1);
      for (let i = 0; i <= N; i++) { const z = INC.z0 - i; let a = 0; for (let k = -3; k <= 3; k++) a += hgt(INC.x, z - k * 1.5); Y[i] = Math.max(a / 7, hgt(INC.x, z)) + 1.1; }
      const loopOff = (i) => 2.2 * smooth(len * 0.35, len * 0.45, i) * smooth(len * 0.65, len * 0.55, i);
      INC.Y = Y; INC.len = len; INC.loopOff = loopOff;
      const sleeper = AF.col(0x4a3a2a, { jitter: 0.5 }), rail = AF.col(0x8a8a88, { metal: 0.8, rough: 0.35 }), tres = AF.col(0x5a4632, { jitter: 0.5, edge: 0.8 });
      const strip = (x0, x1, i, y, cc) => { const za = INC.z0 - i, zb = za - 1, ya = Y[i] + y, yb = Y[Math.min(N, i + 1)] + y;
        buf.quad([x0, ya, za], [x0, yb, zb], [x1, yb, zb], [x1, ya, za], [0, 0], [0, 1], [1, 1], [1, 0], cc, 2, [3, 3, 3, 3]); buf.quad([x1, ya, za], [x1, yb, zb], [x0, yb, zb], [x0, ya, za], [0, 0], [0, 1], [1, 1], [1, 0], cc, 3, [3, 3, 3, 3]); };
      for (let i = 0; i < N; i++) {
        const offs = loopOff(i + 0.5) > 0.05 ? [-loopOff(i + 0.5), loopOff(i + 0.5)] : [0];
        for (const o of offs) { const x = INC.x + o; strip(x - 1.6, x + 1.6, i, -0.12, sleeper); strip(x - 1.05, x - 0.85, i, 0.05, rail); strip(x + 0.85, x + 1.05, i, 0.05, rail); }
        if (i % 4 === 0) { const z = INC.z0 - i, g = hgt(INC.x, z); if (Y[i] - g > 0.9) for (const sx of [-1.3, 1.3]) box(INC.x + sx - 0.18, g - 0.5, z - 0.18, INC.x + sx + 0.18, Y[i] - 0.1, z + 0.18, tres); }
      }
      // stations: a deco kiosk at the foot, a station house + lookout terrace at the top
      const cream = AF.col(0xf2e8d2, { jitter: 0.25, pat: 'stucco' }), maroon = AF.col(0x7a2a2a, { jitter: 0.2 }), gold = AF.col(0xd8b04a, { metal: 0.7, rough: 0.35 });
      { const z = INC.z0 + 1, y = Y[0] - 1.2; box(INC.x - 3.5, y, z - 4, INC.x + 3.5, y + 4.2, z, cream); box(INC.x - 3.9, y + 4.2, z - 4.4, INC.x + 3.9, y + 4.7, z + 0.4, maroon); box(INC.x - 1.6, y + 4.7, z - 0.1, INC.x + 1.6, y + 6.2, z + 0.1, gold);
        box(INC.x - 2.8, y + 1.4, z, INC.x - 1, y + 3, z + 0.12, WINL); box(INC.x + 1, y + 1.4, z, INC.x + 2.8, y + 3, z + 0.12, WINL); }
      { const z = INC.z1 - 1, y = Y[N] - 1.2; box(INC.x - 6, y - 3, z - 8, INC.x + 6, y + 0.4, z + 3, stoneW); box(INC.x - 5, y + 0.4, z - 7, INC.x + 5, y + 5.5, z - 1, cream);
        box(INC.x - 5.5, y + 5.5, z - 7.5, INC.x + 5.5, y + 6.1, z - 0.5, maroon); box(INC.x - 1.5, y + 6.1, z - 4.5, INC.x + 1.5, y + 9, z - 3.5, cream); box(INC.x - 0.4, y + 9, z - 4.4, INC.x + 0.4, y + 12, z - 3.6, gold);
        for (const dx of [-3.5, 0, 3.5]) box(INC.x + dx - 0.9, y + 1.8, z - 1, INC.x + dx + 0.9, y + 3.8, z - 0.88, WINL);
        box(INC.x - 6, y + 0.4, z + 2.8, INC.x + 6, y + 1.5, z + 3, cream); }
      // the two cars (stepped compartments, cream + maroon, lit at night) — one dynamic mesh each, moved by one tick
      if (typeof AF.Model === 'function' && typeof AF.modelMesh === 'function') {
        const glass = AF.col(0xffe2a0, { emit: 0xffc070, emitK: 2.4, mode: 'night' }), dark = AF.col(0x2a2e34, { jitter: 0.1 });
        const mk = (livery) => { const m = new AF.Model(18, 26, 34);
          for (let k = 0; k < 4; k++) { const z0 = k * 8, y0 = k * 3; m.box(1, y0 + 2, z0, 17, y0 + 19, z0 + 8, cream); m.box(1, y0 + 2, z0, 17, y0 + 6, z0 + 8, livery); m.box(0, y0 + 9, z0 + 1, 18, y0 + 15, z0 + 7, glass); m.box(2, y0 + 10, z0, 16, y0 + 15, z0 + 1, glass); m.box(0, y0 + 19, z0, 18, y0 + 20, z0 + 8, livery); }
          m.box(3, 0, 2, 6, 3, 5, dark); m.box(12, 0, 2, 15, 3, 5, dark); m.box(3, 0, 28, 6, 3, 31, dark); m.box(12, 0, 28, 15, 3, 31, dark);
          m.box(4, 23, 30, 14, 25, 32, gold); return AF.meshModel(m, { vs: 1 / 6, anchor: [0.5, 0, 0.5] }); };
        const cars = [mk(maroon), mk(AF.col(0x2f5a4a, { jitter: 0.2 }))].map((g) => { const me = AF.modelMesh(g); me.frustumCulled = false; me.castShadow = false; me.rotation.order = 'YXZ'; me.rotation.y = Math.PI; AF.scene.add(me); return me; });
        INC.cars = cars;
        const place = (me, s, side) => { const i = clamp(s, 0, len - 0.001), i0 = Math.floor(i), f = i - i0, y = Y[i0] * (1 - f) + Y[Math.min(N, i0 + 1)] * f, gr = Y[Math.min(N, i0 + 1)] - Y[i0];
          me.position.set(INC.x + side * loopOff(i), y + 0.08, INC.z0 - i); me.rotation.x = -(Math.atan(gr) - 0.36); };
        const CYC = 96, RUN = 38;
        AF.onTick('land-incline', 320, (dt, t) => {
          const ph = t % CYC, leg = ph < CYC / 2 ? 0 : 1, u = clamp(((ph % (CYC / 2)) - 5) / RUN, 0, 1), e = u * u * (3 - 2 * u);
          const sA = leg === 0 ? e * (len - 4) + 2 : (1 - e) * (len - 4) + 2;
          place(cars[0], sA, -1); place(cars[1], len - sA, 1);
        });
      }
    }
    // steeple town on the western hills
    const ST0 = { x: -560, z: -80 };
    for (let i = 0; i < 46; i++) { const a = RH() * Math.PI * 2, r = 10 + RH() * 60; house(ST0.x + Math.cos(a) * r, ST0.z + Math.sin(a) * r * 0.8, 1.1, RH); houses++; }
    { const y = hgt(ST0.x, ST0.z) - 0.3, x = ST0.x, z = ST0.z;
      box(x - 5, y, z - 10, x + 5, y + 12, z + 10, stoneW); roof(x - 5.5, y + 12, z - 10.5, x + 5.5, z + 10.5, ROOFS[2]);
      box(x - 3.5, y, z + 8, x + 3.5, y + 24, z + 15, stoneW);
      for (let i = 0; i < 9; i++) { const ins = i * 0.38; box(x - 3.5 + ins, y + 24 + i * 1.9, z + 8 + ins, x + 3.5 - ins, y + 24 + (i + 1) * 1.9, z + 15 - ins, i < 1 ? stoneW : ROOFS[3]); }
      box(x - 1, y + 17, z + 15, x + 1, y + 19, z + 15.2, WINL); }
    // eastern lattice radio mast (WSOL relay) with a blinking red light + a stone railway viaduct
    const MS = { x: 620, z: -260 }; let mastTop = null;
    { const y = hgt(MS.x, MS.z) - 0.5;
      for (let i = 0; i < 16; i++) { const w = 3.2 - i * 0.18, yy = y + i * 5; for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) box(MS.x + sx * w - 0.3, yy, MS.z + sz * w - 0.3, MS.x + sx * w + 0.3, yy + 5, MS.z + sz * w + 0.3, steelC); box(MS.x - w, yy + 4.6, MS.z - w, MS.x + w, yy + 5, MS.z + w, steelC); }
      mastTop = [MS.x, y + 81, MS.z]; }
    { // viaduct: a row of stone arches crossing a valley east of the Terminal
      const vz = -40, vx0 = 380, vx1 = 560, top = 26;
      for (let x = vx0; x < vx1; x += 14) { const g = hgt(x + 7, vz) - 1; box(x, g, vz - 3, x + 3, top, vz + 3, stoneW); }
      box(vx0, top, vz - 3.4, vx1, top + 3, vz + 3.4, stoneW); box(vx0, top + 3, vz - 3.4, vx1, top + 3.6, vz - 2.9, steelC); box(vx0, top + 3, vz + 2.9, vx1, top + 3.6, vz + 3.4, steelC);
      for (let x = vx0; x < vx1 - 1; x += 14) box(x + 3, top - 4, vz - 3, x + 14, top, vz + 3, stoneW);
    }
    // a sister-city skyline far to the north-east, blue in the haze
    { const SK = AF.col(0x8a96ae, { jitter: 0.2 }), SKL = AF.col(0xffe0a8, { emit: 0xffc070, emitK: 1.8, mode: 'night' }), RS = AF.rng(99);
      for (let i = 0; i < 22; i++) { const x = 900 + i * 22 + RS() * 10, z = -1150 + RS() * 60 - i * 6, g = hgt(x, z) - 2, hh = 20 + RS() * 70 * (1 - Math.abs(i - 11) / 14); const w = 10 + RS() * 10;
        box(x, g, z, x + w, g + hh, z + w, SK); if (hh > 50) box(x + w * 0.25, g + hh, z + w * 0.25, x + w * 0.75, g + hh + 12, z + w * 0.75, SK);
        for (let k = 0; k < 3; k++) if (RS() < 0.6) box(x + 2, g + 6 + RS() * (hh - 10), z + w, x + w - 2, g + 7 + RS() * (hh - 10), z + w + 0.3, SKL); } }

    // ---- the sea horizon: islands with a far lighthouse, a breakwater, steamers + schooners
    const ISL = [{ x: -720, z: 900, r: 70, h: 18 }, { x: 520, z: 1150, r: 110, h: 30 }, { x: -120, z: 1350, r: 45, h: 10 }];
    L.islands = ISL;
    const rockC = AF.col(0x8a847c, { jitter: 0.5 }), grassI = AF.col(0x6a7a3a, { jitter: 0.5 }), sandI = AF.col(0xd8c8a0, { jitter: 0.4 });
    for (const I of ISL) {
      for (let a = -I.r; a < I.r; a += 6) for (let b = -I.r; b < I.r; b += 6) {
        const dd = Math.hypot(a, b) / I.r + (N2((I.x + a) * 0.03, (I.z + b) * 0.03) - 0.5) * 0.35; if (dd > 1) continue;
        const h = Math.max(-1, I.h * Math.pow(1 - dd, 0.8) + (dd > 0.85 ? -1 : 0));
        box(I.x + a, -4, I.z + b, I.x + a + 6, h, I.z + b + 6, dd > 0.8 ? rockC : dd > 0.7 ? sandI : grassI, dd > 0.82 ? rockC : dd > 0.72 ? sandI : grassI);
      }
    }
    const LHw = AF.col(0xf4efe4, { jitter: 0.2 }), LHr = AF.col(0xb8322a, { jitter: 0.2 });
    let farBeam = null;
    { const I = ISL[0], x = I.x + 30, z = I.z - 30, y = I.h * 0.35;
      for (let i = 0; i < 8; i++) { const w = 3 - i * 0.18; box(x - w, y + i * 3, z - w, x + w, y + (i + 1) * 3, z + w, i % 2 ? LHr : LHw); }
      box(x - 2, y + 24, z - 2, x + 2, y + 27, z + 2, AF.col(0xfff2c0, { emit: 0xffe8a0, emitK: 3, mode: 'night' })); box(x - 2.4, y + 27, z - 2.4, x + 2.4, y + 28.2, z + 2.4, LHr);
      farBeam = [x, y + 25.5, z]; }
    const hullC = [0x2a2e38, 0x3a2a24, 0x28323a].map((h) => AF.col(h, { jitter: 0.2 })), whiteC = AF.col(0xf2ede2, { jitter: 0.2 }), funC = AF.col(0xc8402a, { jitter: 0.2 }), sailC = AF.col(0xf0e8d8, { jitter: 0.2 });
    const SHIPS = [];
    const RSH = AF.rng(2024);
    for (let i = 0; i < 5; i++) {       // steamers (static; far enough that motion would not read)
      const x = -900 + i * 420 + RSH() * 150, z = 700 + RSH() * 700, L2 = 40 + RSH() * 30, y = SEA_Y;
      box(x - L2 / 2, y - 1, z - 4, x + L2 / 2, y + 4, z + 4, hullC[i % 3], whiteC);
      box(x - L2 / 4, y + 4, z - 3, x + L2 / 6, y + 9, z + 3, whiteC);
      box(x - 2, y + 9, z - 1.5, x + 2, y + 16, z + 1.5, funC);
      SHIPS.push([x, y + 17, z]);
    }
    for (let i = 0; i < 8; i++) {       // schooners
      const x = -1100 + RSH() * 2200, z = 520 + RSH() * 800, y = SEA_Y;
      if (Math.abs(x) < 320 && z < 560) continue;
      box(x - 7, y - 0.6, z - 1.8, x + 7, y + 1.6, z + 1.8, hullC[1], whiteC);
      box(x - 5, y + 2, z - 0.1, x - 0.5, y + 13, z + 0.1, sailC); box(x + 0.5, y + 2, z - 0.1, x + 5, y + 10, z + 0.1, sailC);
    }
    L.farShips = SHIPS;

    // ---- north hero: the SOLACE HEIGHTS hillside sign on scaffold legs, an observatory dome + a water tower on the crest
    const SG = L.SIGN = { x: 0, z: -372, vs: 1.5 };
    SG.y = hgt(SG.x, SG.z) + 3;
    const SHW = (14 * 6 - 1) * SG.vs / 2 + 1;
    for (let x = -SHW; x <= SHW; x += 5.5) { const g = hgt(x, SG.z - 2) - 1; box(x - 0.35, g, SG.z - 2.6, x + 0.35, SG.y + 9.8, SG.z - 1.9, steelC); box(x - 0.3, g, SG.z - 5.5, x + 0.3, SG.y + 4, SG.z - 4.9, steelC); }
    box(-SHW, SG.y + 1, SG.z - 2.8, SHW, SG.y + 1.5, SG.z - 1.8, steelC); box(-SHW, SG.y + 7.5, SG.z - 2.8, SHW, SG.y + 8, SG.z - 1.8, steelC);
    { const OB = { x: -215, z: -350 }, y = hgt(OB.x, OB.z) - 0.5, dome = AF.col(0xe8e4dc, { jitter: 0.15, metal: 0.3, rough: 0.4 }), slit = AF.col(0x2a2e38, { jitter: 0.1 });
      box(OB.x - 9, y, OB.z - 9, OB.x + 9, y + 8, OB.z + 9, stoneW); box(OB.x - 9.6, y + 8, OB.z - 9.6, OB.x + 9.6, y + 9, OB.z + 9.6, WALLS[0]);
      for (let i = 0; i < 8; i++) { const r = 8 * Math.cos(Math.asin(i / 8)); box(OB.x - r, y + 9 + i, OB.z - r, OB.x + r, y + 10 + i, OB.z + r, dome); }
      box(OB.x - 0.8, y + 10, OB.z + 5, OB.x + 0.8, y + 17, OB.z + 8.2, slit);
      for (const dx of [-5, 0, 5]) box(OB.x + dx - 0.8, y + 3, OB.z + 9, OB.x + dx + 0.8, y + 6, OB.z + 9.2, WINL);
      L.observatory = { x: OB.x, y, z: OB.z }; }
    { const WT = { x: 175, z: -345 }, y = hgt(WT.x, WT.z) - 0.5, tank = AF.col(0xb8b4a8, { jitter: 0.2, metal: 0.5, rough: 0.5 }), cap = AF.col(0x4f7a6a, { jitter: 0.2 });
      for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) box(WT.x + sx * 5 - 0.4, y, WT.z + sz * 5 - 0.4, WT.x + sx * 5 + 0.4, y + 20, WT.z + sz * 5 + 0.4, steelC);
      box(WT.x - 5.2, y + 9, WT.z - 5.2, WT.x + 5.2, y + 9.4, WT.z + 5.2, steelC);
      for (let i = 0; i < 4; i++) { const r = 6.5 - (i === 0 || i === 3 ? 0.8 : 0); box(WT.x - r, y + 20 + i * 2.5, WT.z - r * 0.42, WT.x + r, y + 22.5 + i * 2.5, WT.z + r * 0.42, tank); box(WT.x - r * 0.42, y + 20 + i * 2.5, WT.z - r, WT.x + r * 0.42, y + 22.5 + i * 2.5, WT.z + r, tank); box(WT.x - r * 0.78, y + 20 + i * 2.5, WT.z - r * 0.78, WT.x + r * 0.78, y + 22.5 + i * 2.5, WT.z + r * 0.78, tank); }
      for (let i = 0; i < 5; i++) { const r = 6 - i * 1.25; box(WT.x - r, y + 30 + i * 0.9, WT.z - r, WT.x + r, y + 30.9 + i * 0.9, WT.z + r, cap); } }
    { const grp = new THREE.Group(); grp.name = 'land-horizon'; let nq = 0;
      for (const b of chunks.values()) { if (!b.n) continue;
        const meshH = new THREE.Mesh(b.geometry(), AF.mat.voxel);
        meshH.name = 'land-horizon-chunk'; meshH.receiveShadow = false; meshH.castShadow = false; meshH.matrixAutoUpdate = false; meshH.updateMatrix();
        meshH.frustumCulled = true; grp.add(meshH); nq += b.n / 4; }
      grp.matrixAutoUpdate = false; AF.scene.add(grp); L.horizon = grp;
      AF.stats = Object.assign(AF.stats || {}, { horizonQuads: nq, horizonChunks: grp.children.length, horizonClumps: clumps, horizonHouses: houses });
    }
    // sign letters: cream letters + a bulb layer per word that flashes word by word at night
    if (typeof AF.textModel === 'function') {
      const cream = AF.col(0xf4efe2, { jitter: 0.15, rough: 0.6 }), bulb = AF.col(0xfff0c0, { emit: 0xffe0a0, emitK: 3.2, mode: 'always' });
      const tm = AF.textModel('SOLACE HEIGHTS', cream, { depth: 1 });
      const g = AF.meshModel(tm, { vs: SG.vs, anchor: [0.5, 0, 0.5] });
      const m = AF.modelMesh(g); m.position.set(SG.x, SG.y, SG.z); m.castShadow = false; m.frustumCulled = false; AF.scene.add(m);
      const words = [];
      for (const [wd, off] of [['SOLACE', -(14 * 6 - 1) / 2 + (6 * 6 - 1) / 2], ['HEIGHTS', -(14 * 6 - 1) / 2 + 7 * 6 + (7 * 6 - 1) / 2]]) {
        const bm = AF.textModel(wd, bulb, { depth: 1 });
        const bg = AF.meshModel(bm, { vs: SG.vs, anchor: [0.5, 0, 0.5] });
        const mm = AF.modelMesh(bg); mm.position.set(SG.x + off * SG.vs, SG.y, SG.z + 0.2); mm.castShadow = false; mm.frustumCulled = false; mm.visible = false; AF.scene.add(mm); words.push(mm);
      }
      SG.mesh = m; SG.words = words;
    }
    // seabed under the open sea beyond the map (so the water never shows the void)
    { const sb = new G(), bed = AF.col(0x44564e, { jitter: 0.25 });
      const bq = (x0, z0, x1, z1) => sb.quad([x0, -4, z0], [x0, -4, z1], [x1, -4, z1], [x1, -4, z0], [0, 0], [0, 1], [1, 1], [1, 0], bed, 2, [3, 3, 3, 3]);
      bq(-1500, 300, 1500, 1520); bq(-1500, COAST - 4, -300, 300); bq(300, COAST - 4, 1500, 300);
      const m = new THREE.Mesh(sb.geometry(), AF.mat.voxel); m.name = 'land-seabed'; m.matrixAutoUpdate = false; m.updateMatrix(); m.frustumCulled = false; AF.scene.add(m); }
    // blinking red aviation light on the mast + the far lighthouse lamp (tiny dynamic meshes, one tick)
    { const red = new THREE.Mesh(new THREE.SphereGeometry(2, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff2a1a, fog: false }));
      red.position.set(...mastTop); red.frustumCulled = false; AF.scene.add(red);
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(2.2, 8, 6), new THREE.MeshBasicMaterial({ color: 0xfff0b0, fog: false, transparent: true, opacity: 0.9 }));
      lamp.position.set(...farBeam); lamp.frustumCulled = false; AF.scene.add(lamp);
      L.farLights = { red, lamp };
      AF.onTick('land-far-lights', 705, (dt, t) => {
        const night = AF.time ? AF.time.night : 0, hr = AF.time ? AF.time.hours : 12;
        const dusk = hr > 18.4 || hr < 6.3;
        red.visible = (t % 1.6) < 0.5;
        lamp.visible = dusk && (t % 6) < 0.9;
        if (SG.words && SG.words.length === 2) { const ph = t % 5; SG.words[0].visible = dusk && ph < 3.8; SG.words[1].visible = dusk && ph > 1.2 && ph < 3.8; }
      });
    }
    L.horizonMs = Math.round(performance.now() - t0);
  });

  // ------------------------------------------------------------ r2: SOLACE SANDS beach dressing (closed for the season):
  //   a timber groyne with rubble, furled umbrellas, striped bathing huts, a lifeguard chair, an upturned dory, a sandcastle
  AF.onBuild('land-beach', 410, () => {
    const t0 = performance.now(), B = L.BEACH; if (!B) return;
    const sandY = (x, z) => { const ci = W.col(x, z); return ci < 0 ? 0 : W.H[ci] * 0.25; };
    const F = (x0, y0, z0, x1, y1, z1, cc) => W.fill(x0, y0, z0, x1, y1, z1, cc);
    const wood = AF.col(0x6a5238, { jitter: 0.7, edge: 0.8 }), woodW = AF.col(0x4e4032, { jitter: 0.7, edge: 0.8 }), weed = AF.col(0x3f5234, { jitter: 0.6 });
    const RUB = (L.cols && L.cols.RUB) || [AF.col(0x8a867e)];
    // groyne: posts + planks running out to sea, a rubble apron either side
    const GX = -271;
    for (let z = 209.75; z < 247; z += 0.5) {
      const g = sandY(GX, z), top = Math.max(g + 0.75, SEA_Y + 0.75) + (hash(Math.round(z * 2), 3) < 0.3 ? 0.25 : 0) - (z > 240 ? 0.25 : 0);
      F(GX, -3.5, z, GX + 0.5, top, z + 0.25, z > 226 && hash(Math.round(z * 2), 5) < 0.5 ? woodW : wood);
      F(GX + 0.125, -3.5, z + 0.25, GX + 0.375, top - 0.25, z + 0.5, woodW);
      if (z > 222) F(GX - 0.25, SEA_Y - 0.5, z, GX + 0.75, SEA_Y, z + 0.5, weed);
      for (const sx of [-1, 1]) if (hash(Math.round(z * 2), sx + 9) < 0.6) { const w = 0.5 + hash(Math.round(z * 4), sx) * 1.0, rx = sx < 0 ? GX - w : GX + 0.5; F(rx, -3.5, z, rx + w, Math.max(g, SEA_Y - 0.5) + 0.25 + hash(Math.round(z * 3), sx) * 0.5, z + 0.5, RUB[(hash(Math.round(z * 2), sx + 4) * RUB.length) | 0]); }
      if (((z * 2) | 0) % 14 === 0) AF.addSpot && AF.addSpot({ building: null, x: GX + 0.25, y: top, z: z + 0.2, yaw: Math.PI / 2, kind: 'gull' });
    }
    if (typeof AF.Model !== 'function' || typeof AF.meshModel !== 'function') return;
    const vs = 1 / 8, M = (w, h, d) => new AF.Model(w, h, d), geo = (m) => AF.meshModel(m, { vs, anchor: [0.5, 0, 0.5] });
    const white = AF.col(0xf4efe4, { jitter: 0.2 }), pole = AF.col(0xd8cbb0, { jitter: 0.3 }), red = AF.col(0xc8322e, { jitter: 0.2 }), blue = AF.col(0x2f5a8a, { jitter: 0.2 }), yel = AF.col(0xe8b83a, { jitter: 0.2 }), grn = AF.col(0x3f7a5a, { jitter: 0.2 });
    const brass = AF.col(0xc8a040, { metal: 0.7, rough: 0.35 }), navy = AF.col(0x243044, { jitter: 0.2 }), sand = AF.col(0xe0cfa4, { jitter: 0.5 }), sandW = AF.col(0xc4b08a, { jitter: 0.5 });
    // furled umbrellas (3 designs)
    const umb = [red, blue, yel, grn].map((cc) => { const m = M(5, 24, 5); m.box(2, 0, 2, 3, 24, 3, pole);
      for (let y = 9; y < 22; y++) { const r = y < 11 ? 1.4 : y < 19 ? 1.2 : 0.8; for (let x = 0; x < 5; x++) for (let z = 0; z < 5; z++) if (Math.hypot(x - 2, z - 2) <= r) m.set(x, y, z, ((y + x) >> 1) % 2 ? cc : white); }
      m.box(1, 21, 2, 4, 22, 3, cc); return geo(m); });
    let props = 0;
    for (let i = 0; i < 14; i++) { const x = -296 + i * 3.1 + (hash(i, 1) - 0.5) * 1.2, z = 212.4 + (i % 3) * 1.6 + hash(i, 2); if (Math.abs(x - GX) < 1.2 || x > -242) continue; AF.placeStatic(umb[i % 4], x, sandY(x, z), z, 0, { collide: false }); props++; }
    // striped bathing huts with pyramid roofs, one door ajar, a CLOSED FOR THE SEASON board on the last
    const hut = (cc) => { const m = M(16, 24, 16); for (let x = 0; x < 16; x++) for (let z = 0; z < 16; z++) for (let y = 0; y < 17; y++) { const edge = x === 0 || x === 15 || z === 0 || z === 15; if (!edge) continue; const st = ((x + z) >> 1) % 2 ? cc : white; m.set(x, y, z, st); }
      m.box(5, 0, 15, 11, 14, 16, 0); m.box(4, 14, 15, 12, 15, 16, white); m.box(11, 0, 15, 12, 14, 16, navy);
      for (let i = 0; i < 7; i++) m.box(i - 1, 17 + i, i - 1, 17 - i, 18 + i, 17 - i, i % 2 ? cc : white); m.box(7, 24, 7, 9, 24, 9, brass); m.box(0, 0, 0, 16, 1, 16, AF.col(0x8a7456, { jitter: 0.5 })); return geo(m); };
    const HUTS = [red, blue, grn, yel].map(hut);
    for (let i = 0; i < 5; i++) { const x = -294 + i * 3.2, z = 211.6; AF.placeStatic(HUTS[i % 4], x, sandY(x, z), z, 0); props++; }
    if (typeof AF.textModel === 'function') {
      const tm = AF.textModel('CLOSED FOR THE SEASON', navy, { bg: white, pad: 1, depth: 1 }); const g = AF.meshModel(tm, { vs: 1 / 16, anchor: [0.5, 0, 0.5] });
      AF.placeStatic(g, -281.5, sandY(-281.5, 213.9) + 1.1, 213.9, 0, { collide: false }); props++;
      const pst = M(2, 12, 2).box(0, 0, 0, 2, 12, 2, wood); const pg = geo(pst); AF.placeStatic(pg, -284, sandY(-284, 213.8), 213.8, 0, { collide: false }); AF.placeStatic(pg, -279, sandY(-279, 213.8), 213.8, 0, { collide: false });
    }
    // lifeguard chair (white timber, red lifebuoy, OFF DUTY board)
    { const m = M(12, 30, 12);
      for (const [x, z] of [[1, 1], [10, 1], [1, 10], [10, 10]]) m.line(x, 0, z, x + (x < 6 ? 2 : -2), 22, z + (z < 6 ? 2 : -2), white);
      m.box(2, 22, 2, 10, 23, 10, white); m.box(2, 23, 9, 10, 29, 10, white); m.box(2, 23, 2, 3, 26, 10, white); m.box(9, 23, 2, 10, 26, 10, white);
      for (let y = 2; y < 22; y += 3) m.box(3, y, 10, 9, y + 1, 11, white);
      for (let a = 0; a < 24; a++) { const t = a / 24 * Math.PI * 2; m.set(11, 14 + Math.round(Math.sin(t) * 3), 5 + Math.round(Math.cos(t) * 3), a % 6 < 3 ? red : white); }
      const x = -262, z = 215.5; AF.placeStatic(geo(m), x, sandY(x, z), z, 0); props++;
      if (typeof AF.textModel === 'function') { const g = AF.meshModel(AF.textModel('OFF DUTY', white, { bg: red, pad: 1, depth: 1 }), { vs: 1 / 16, anchor: [0.5, 0, 0.5] }); AF.placeStatic(g, x, sandY(x, z) + 3.3, z + 0.72, 0, { collide: false }); props++; } }
    // upturned dory on the sand + oars, a sandcastle with a paper flag, bucket + spade, a stack of folded deckchairs
    { const m = M(30, 8, 12); for (let x = 0; x < 30; x++) { const t = Math.abs(x - 15) / 15, hw = Math.round(5.5 * Math.sqrt(1 - t * t * 0.85)); for (let z = 6 - hw; z < 6 + hw; z++) { const dz = Math.abs(z - 5.5) / Math.max(1, hw), h = Math.round(6 * (1 - dz * dz * 0.6)); m.box(x, 0, z, x + 1, h, z + 1, x % 7 === 0 ? white : AF.col(0x2f6a7a, { jitter: 0.3 })); } } m.box(0, 0, 5, 30, 7, 7, woodW);
      const x = -250.5, z = 217; AF.placeStatic(geo(m), x, sandY(x, z), z, 1); props++;
      const oar = M(26, 2, 3); oar.box(0, 0, 1, 20, 1, 2, wood); oar.box(20, 0, 0, 26, 1, 3, wood); AF.placeStatic(geo(oar), -248, sandY(-248, 213.5), 213.5, 0, { collide: false }); }
    { const m = M(20, 14, 20); m.box(0, 0, 0, 20, 3, 20, sandW); m.box(2, 3, 2, 18, 6, 18, sand);
      for (const [x, z] of [[2, 2], [14, 2], [2, 14], [14, 14]]) { m.box(x, 6, z, x + 4, 10, z + 4, sand); for (let k = 0; k < 4; k += 2) m.box(x + k, 10, z, x + k + 1, 11, z + 4, sand); }
      m.box(7, 6, 7, 13, 12, 13, sand); m.box(10, 12, 10, 11, 14, 11, pole); m.box(11, 13, 10, 13, 14, 11, red);
      const x = -266, z = 219; AF.placeStatic(AF.meshModel(m, { vs: 1 / 16, anchor: [0.5, 0, 0.5] }), x, sandY(x, z), z, 0, { collide: false }); props++;
      const bk = M(5, 5, 5); bk.box(0, 0, 0, 5, 5, 5, red); bk.box(1, 1, 1, 4, 5, 4, 0); bk.box(0, 4, 2, 5, 5, 3, brass); AF.placeStatic(AF.meshModel(bk, { vs: 1 / 16, anchor: [0.5, 0, 0.5] }), -264.6, sandY(-264.6, 219.4), 219.4, 0, { collide: false }); }
    { const m = M(6, 16, 12); for (let i = 0; i < 5; i++) { m.box(0, i * 3, 0, 6, i * 3 + 1, 12, wood); m.box(1, i * 3 + 1, 1, 5, i * 3 + 2, 11, [red, blue, grn, yel, red][i]); }
      AF.placeStatic(geo(m), -288, sandY(-288, 214.8), 214.8, 1); props++; }
    L.beachT = { ms: Math.round(performance.now() - t0), props };
  });

  // ------------------------------------------------------------ r2: yachts beating across the outer bay (life in every sea aerial)
  AF.onBuild('land-sails', 610, () => {
    if (typeof AF.Model !== 'function' || typeof AF.modelMesh !== 'function') return;
    const hullC = [0xf2ede2, 0x1f3a5b, 0x7a2a2a].map((h) => AF.col(h, { jitter: 0.15 })), deck = AF.col(0xb08a5a, { jitter: 0.4 }), sail = AF.col(0xf6f0e2, { jitter: 0.12 }), sailR = AF.col(0xc8643a, { jitter: 0.15 });
    const mast = AF.col(0x8a6a4a, { jitter: 0.2 }), lant = AF.col(0xffe6a0, { emit: 0xffd070, emitK: 3, mode: 'night' }), stripe = AF.col(0xd8b04a, { jitter: 0.1 });
    const mk = (hc, sc) => { const m = new AF.Model(12, 52, 36);
      for (let z = 0; z < 36; z++) { const t = Math.abs(z - 16) / (z < 16 ? 16 : 20), hw = Math.max(1, Math.round(5.5 * Math.sqrt(Math.max(0, 1 - t * t)))); for (let x = 6 - hw; x < 6 + hw; x++) { m.box(x, 0, z, x + 1, 4, z + 1, hc); m.set(x, 4, z, deck); } if (hw > 1) { m.set(6 - hw, 3, z, stripe); m.set(5 + hw, 3, z, stripe); } }
      m.box(6, 4, 14, 7, 50, 15, mast); m.box(6, 12, 15, 7, 13, 30, mast);
      for (let y = 13; y < 48; y++) { const w = Math.round((48 - y) / 35 * 15); m.box(6, y, 15, 7, y + 1, 15 + w, sc); }
      for (let y = 8; y < 44; y++) { const w = Math.round((44 - y) / 36 * 12); m.box(6, y, Math.max(1, 14 - w), 7, y + 1, 14, sail); }
      m.box(5, 50, 13, 8, 52, 16, lant); return AF.meshModel(m, { vs: 1 / 4, anchor: [0.5, 0, 0.5] }); };
    const geos = [mk(hullC[0], sail), mk(hullC[1], sailR), mk(hullC[2], sail)];
    const Y = [];
    for (let i = 0; i < 5; i++) { const me = AF.modelMesh(geos[i % 3]); me.frustumCulled = false; me.castShadow = false; me.rotation.order = 'YXZ'; AF.scene.add(me);
      Y.push({ me, z: 330 + i * 52 + (i % 2) * 18, v: (i % 2 ? -1 : 1) * (2.2 + i * 0.35), x0: -650 + i * 290, ph: i * 1.7 }); }
    L.yachts = Y;
    AF.onTick('land-sails', 330, (dt, t) => {
      for (const y of Y) {
        let x = y.x0 + y.v * t; x = ((x + 700) % 1400 + 1400) % 1400 - 700;
        y.me.position.set(x, SEA_Y - 0.35 + Math.sin(t * 0.9 + y.ph) * 0.18, y.z + Math.sin(t * 0.05 + y.ph) * 6);
        y.me.rotation.y = y.v > 0 ? Math.PI / 2 : -Math.PI / 2; y.me.rotation.z = (y.v > 0 ? -1 : 1) * (0.12 + Math.sin(t * 0.7 + y.ph) * 0.03); y.me.rotation.x = Math.sin(t * 1.1 + y.ph) * 0.03;
      }
    });
  });

  // ------------------------------------------------------------ r2: lamp posts along the in-map Heights lanes (bishop's-crook, glow at dusk)
  AF.onBuild('land-lane-lamps', 415, () => {
    if (typeof AF.Model !== 'function' || !L.lanePts) return;
    const post = AF.col(0x2e3a32, { jitter: 0.1, metal: 0.5, rough: 0.5 }), glow = AF.col(0xfff0c8, { emit: 0xffc878, emitK: 3.2, mode: 'night' });
    const m = new AF.Model(10, 38, 4); m.box(1, 0, 1, 4, 2, 3, post); m.box(2, 2, 1, 3, 34, 3, post); m.box(3, 33, 1, 8, 34, 3, post); m.box(7, 30, 1, 8, 33, 3, post); m.box(6, 27, 0, 9, 30, 4, glow); m.box(6, 30, 0, 9, 31, 4, post);
    const g = AF.meshModel(m, { vs: 1 / 8, anchor: [0.2, 0, 0.5] });
    let n = 0;
    for (let i = 0; i < L.lanePts.length; i += 2) {
      const [x, z, y] = L.lanePts[i], j = Math.min(L.lanePts.length - 1, i + 1), dx = L.lanePts[j][0] - x, dz = L.lanePts[j][1] - z, l = Math.hypot(dx, dz) || 1;
      const sx = x - dz / l * 2.6, sz = z + dx / l * 2.6, ci = W.col(sx, sz); if (ci < 0) continue;
      const gy = W.H[ci] * 0.25; if (Math.abs(gy - y) > 1.2) continue;
      AF.placeStatic(g, sx, gy, sz, Math.abs(dx) > Math.abs(dz) ? (dz / l * 2.6 > 0 ? 0 : 2) : 1, { collide: true });
      AF.addLight && n % 2 === 0 && AF.addLight({ x: sx, y: gy + 3.6, z: sz, color: 0xffc878, intensity: 1.2, range: 12, kind: 'street' });
      n++;
    }
    L.laneLamps = n;
  });

  // ------------------------------------------------------------ villas on Solace Heights (exterior only, solid)
  AF.onBuild('land-villas', 300, () => {
    const F = (x0, y0, z0, x1, y1, z1, cc) => W.fill(x0, y0, z0, x1, y1, z1, cc);
    const win = AF.col('window'), dark = AF.col(0x2e3440, { jitter: 0.2 }), trim = AF.col(0xfaf4e6, { jitter: 0.2, edge: 0.6 }), stone = AF.col(0x9c968a, { jitter: 0.6, edge: 0.9 });
    const warm = AF.col(0xffd89a, { emit: 0xffc070, emitK: 1.6, mode: 'night' }), hedge = AF.col(0x3f6a34, { jitter: 0.9, edge: 0.5 }), chim = AF.col(0x9a4a38, { jitter: 0.6, edge: 0.8 });
    const gravel = AF.col(0xc8b898, { jitter: 1 });
    for (const [vi, v] of VILLAS.entries()) {
      const wall = AF.col(v.wall, { jitter: 0.3, edge: 0.6 }), roof = AF.col(v.roof, { jitter: 0.5, edge: 0.8 }), roofD = AF.col(v.roof, { jitter: 0.5, edge: 0.8, sat: 0.8 });
      const x0 = v.x - v.w / 2, x1 = v.x + v.w / 2, z0 = v.z - v.d / 2, z1 = v.z + v.d / 2, y0 = v.y, fl = 2;
      const H2 = fl * 3.75;
      F(x0 - 0.5, y0, z0 - 0.5, x1 + 0.5, y0 + 0.75, z1 + 0.5, stone);                        // plinth
      F(x0, y0 + 0.75, z0, x1, y0 + 0.75 + H2, z1, wall);                                     // solid body
      F(x0 - 0.25, y0 + 0.75 + 3.75, z0 - 0.25, x1 + 0.25, y0 + 1.0 + 3.75, z1 + 0.25, trim);  // belt course
      F(x0 - 0.5, y0 + 0.75 + H2, z0 - 0.5, x1 + 0.5, y0 + 1.0 + H2, z1 + 0.5, trim);        // cornice
      // hipped roof
      for (let i = 0; ; i++) {
        const y = y0 + 1.0 + H2 + i * 0.25, ins = i * 0.25 * 1.2;
        const a0 = x0 - 0.5 + ins, a1 = x1 + 0.5 - ins, b0 = z0 - 0.5 + ins, b1 = z1 + 0.5 - ins;
        if (a1 - a0 < 0.5 || b1 - b0 < 0.5) break;
        F(a0, y, b0, a1, y + 0.25, b1, i % 3 === 0 ? roofD : roof);
      }
      F(x1 - 3, y0 + H2, z0 + 1.5, x1 - 2, y0 + H2 + 5.5, z0 + 2.5, chim); F(x1 - 3.25, y0 + H2 + 5.5, z0 + 1.25, x1 - 1.75, y0 + H2 + 5.75, z0 + 2.75, stone);
      AF.addChimney && AF.addChimney(x1 - 2.5, y0 + H2 + 5.9, z0 + 2);
      // window grid on all four faces (1-block recess), shutters of the roof colour, some lit at night
      for (let f = 0; f < fl; f++) {
        const wy = y0 + 0.75 + f * 3.75 + 1.0;
        for (let x = x0 + 1.25; x < x1 - 1.5; x += 2.5) {
          const lit = hash(vi * 31 + Math.round(x), f) < 0.45 ? warm : win;
          for (const [zf, zi] of [[z1 - 0.25, z1], [z0, z0 + 0.25]]) { F(x, wy, zf, x + 1, wy + 1.75, zi, lit); }
          F(x - 0.25, wy - 0.25, z1, x + 1.25, wy, z1 + 0.25, trim); F(x - 0.25, wy - 0.25, z0 - 0.25, x + 1.25, wy, z0, trim);
          F(x - 0.5, wy, z1, x - 0.25, wy + 1.75, z1 + 0.25, roof); F(x + 1, wy, z1, x + 1.25, wy + 1.75, z1 + 0.25, roof);
        }
        for (let z = z0 + 1.25; z < z1 - 1.5; z += 2.5) {
          const lit = hash(vi * 17 + Math.round(z), f + 5) < 0.45 ? warm : win;
          F(x0, wy, z, x0 + 0.25, wy + 1.75, z + 1, lit); F(x1 - 0.25, wy, z, x1, wy + 1.75, z + 1, lit);
        }
      }
      // front door (south) under a portico with two columns
      const dx = v.x - 0.75;
      F(dx, y0 + 0.75, z1 - 0.25, dx + 1.5, y0 + 3.25, z1, dark);
      F(dx - 1.5, y0 + 0.5, z1, dx + 3, y0 + 0.75, z1 + 2.5, stone);
      for (const cx of [dx - 1.25, dx + 2.5]) F(cx, y0 + 0.75, z1 + 2, cx + 0.25, y0 + 3.5, z1 + 2.25, trim);
      F(dx - 1.5, y0 + 3.5, z1, dx + 3, y0 + 3.75, z1 + 2.5, trim);
      // gravel forecourt + hedges
      F(x0 - 2, y0, z1 + 0.5, x1 + 2, y0 + 0.01, z1 + 4, 0);
      W.eachCol(x0 - 2, z1 + 0.5, x1 + 2, z1 + 4, (bx, bz, i) => { W.C[i] = gravel; });
      for (let x = x0 - 3; x < x1 + 3; x += 0.25) { if (Math.abs(x - v.x) < 2) continue; F(x, y0, z1 + 4, x + 0.25, y0 + 1.0, z1 + 4.75, hedge); }
    }
  });

  // ------------------------------------------------------------ labels, tests
  AF.addLabel(HT.name, 190, -278, 'place');
  AF.addLabel(HT.name, -240, -278, 'place');
  AF.addLabel(LK.name, LK.cx, LK.cz, 'place');
  AF.addLabel(HB.name, 40, 250, 'place');

  AF.test('land: sea exists (open water south of the quay)', () => {
    const w = AF.world.water.find((e) => e.geo.userData.sea);
    const gy = W.groundY(0, 240), gy2 = W.groundY(-200, 290);
    const bb = w && w.geo.boundingBox;
    return { ok: !!w && gy <= -3.9 && gy2 <= -3.9 && bb && bb.max.z >= 1400, info: `sea quads ${w && w.geo.userData.quads} bed ${gy} extent z ${bb && bb.max.z}` };
  });
  AF.test('land: Swan Lake + skating pond water', () => {
    const lk = AF.world.water.find((e) => e.geo.userData.kind === 'lake' && !e.geo.userData.sea), pd = AF.world.water.find((e) => e.geo.userData.kind === 'pond');
    const by = W.groundY(LK.cx, LK.cz);
    return { ok: !!lk && lk.geo.userData.quads > 800 && !!pd && pd.geo.userData.quads > 200 && by <= -1.75, info: `lake ${lk && lk.geo.userData.quads} pond ${pd && pd.geo.userData.quads} bed ${by}` };
  });
  AF.test('land: ground at spawn is flat h=1', () => {
    const s = P.spawn; let ok = true, bad = '';
    for (const [dx, dz] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) { const h = W.H[W.col(s.x + dx, s.z + dz)]; if (h !== 1 && h !== 0) { ok = false; bad += ` (${dx},${dz})=${h}`; } }
    return { ok, info: ok ? 'flat' : bad };
  });
  AF.test('land: Solace Heights rise to ~40 m, park stays flat', () => {
    const hE = W.groundY(200, -296), hW = W.groundY(-270, -296), park = W.groundY(-20, -290);
    return { ok: Math.max(hE, hW) > 25 && park < 1, info: `E ${hE} W ${hW} park ${park}` };
  });
  AF.test('land: horizon world (hills, clumps, houses, open sea south)', () => {
    const s = AF.stats || {};
    const seaOpen = L.coastZ ? L.coastZ(0) === COAST : false;
    return { ok: !!L.horizon && (s.horizonClumps || 0) > 300 && (s.horizonHouses || 0) > 40 && seaOpen, info: `quads ${s.horizonQuads} clumps ${s.horizonClumps} houses ${s.horizonHouses} ms ${L.horizonMs} ${JSON.stringify(L.horizonT || {})} canopies ${(AF.canopies || []).length} kit ${AF.TREEKIT ? JSON.stringify(AF.TREEKIT.stats()) : '-'}` };
  });
  AF.test('land: breakwater walkable to the lighthouse', () => {
    const p0 = L.bwPoint(0.5);
    const b = { x: p0.x, y: W.groundY(p0.x, p0.z - 3) , z: p0.z - 3, vy: 0, r: 0.3, h: 1.7, onGround: true };
    for (let s = 0; s <= L.bwLen - 4; s += 1) {
      const p = L.bwPoint(s);
      for (let k = 0; k < 60; k++) { const dx = p.x - b.x, dz = p.z - b.z, d = Math.hypot(dx, dz); if (d < 0.3) break; const st = Math.min(0.06, d); AF.moveBody(b, dx / d * st, dz / d * st, 1 / 60); }
    }
    const d = Math.hypot(b.x - LH.x, b.z - LH.z);
    return { ok: d < 8 && b.y > 0, info: `end ${b.x.toFixed(1)},${b.y.toFixed(2)},${b.z.toFixed(1)} dist ${d.toFixed(1)}` };
  });
}

} catch (e) { AF.partError('10-terrain.js', e); }

