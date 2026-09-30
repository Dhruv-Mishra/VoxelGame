// ================================================================ 10-terrain.js
try {
// ===== 10-terrain: Port Solace ground — flat city (h=1), THE SEA south of the quay (z 210), granite quay wall,
//       east breakwater (rubble heightmap) out to the lighthouse rock, Solace Heights (wooded hills + winding lane + villas),
//       Swan Lake + the skating pond; THE ISLAND COAST (noisy shoreline inside every map edge: beaches, NW-bay dunes + mole,
//       rocky shelves, the Heights as sea cliffs, the SW headland) and the ocean water + sea bed out to the horizon  (OWNER: land-harbour) =====
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
    const f = smooth(0, 34, edge) * smooth(-390, -300, x);   // r2: wider flank; the hills fade out over the new west side
    const h = (HT.height * Math.pow(t, 1.15) + (fbm(x * 0.03 + 4, z * 0.03 - 2, 3) - 0.45) * 5 * t) * f;
    return Math.max(0, h);
  };
  L.heightsH = heightsH;
  // winding lane up the east + west heights (gravel, 1-block steps), villas on pads
  const LANES = L.LANES = [
    [[110, -246], [118, -262], [138, -270], [160, -262], [184, -270], [206, -284], [232, -290], [258, -284]],
    [[-196, -246], [-204, -262], [-226, -268], [-248, -262], [-266, -276]],
  ];
  const VILLAS = L.VILLAS = [
    { x: 150, z: -284, w: 14, d: 10, name: 'Belvedere', wall: 0xf1e4c6, roof: 0x4f8a78 },
    { x: 206, z: -296, w: 16, d: 8, name: 'Harrow House', wall: 0xe9d2b0, roof: 0xa8483a },
    { x: 262, z: -270, w: 12, d: 12, name: 'Castellane', wall: 0xf4ecda, roof: 0x3f6f8a },
    { x: -180, z: -270, w: 14, d: 10, name: 'Solace Manor', wall: 0xeadcc0, roof: 0x9a3e32 },
    { x: -280, z: -262, w: 10, d: 12, name: 'The Gables', wall: 0xf0e2c4, roof: 0x4c7a6a },
  ];

  // ---- THE ISLAND COAST: the shoreline runs a noisy ~2-3 m inside each map edge (the north-west bay bites ~40 m in); south of
  //   the city it is the quay / the Solace Sands shore. L.coastS(x, z) = metres inland from the shoreline (< 0 = sea).
  const VSB = W.VS, XE = W.x1, ZN = W.Z0;
  const bayK = L.bayK = (x) => smooth(-452, -414, x) * smooth(-316, -362, x);
  const beachShore = (x) => 221.5 + Math.sin((x + 300) * 0.085) * 3.2 + (N2(x * 0.15, 3.7) - 0.5) * 2 + smooth(-310, -380, x) * fbm(x * 0.012, 5, 3) * 14;
  const INS_N = new Float32Array(W.NX), SHORE_S = new Float32Array(W.NX), INS_W = new Float32Array(W.NZ), INS_E = new Float32Array(W.NZ);
  for (let i = 0; i < W.NX; i++) { const x = W.X0 + (i + 0.5) * VSB; INS_N[i] = 1.5 + 2 * fbm(x * 0.021 + 7, 3.1, 3) + bayK(x) * (36 + (fbm(x * 0.03, 9, 3) - 0.5) * 16); SHORE_S[i] = x < -239 ? beachShore(x) : COAST; }
  for (let k = 0; k < W.NZ; k++) { const z = ZN + (k + 0.5) * VSB; INS_W[k] = 1.5 + 2 * fbm(z * 0.021 - 3, 5.3, 3); INS_E[k] = 1.5 + 2 * fbm(z * 0.021 + 11, 1.7, 3); }
  L.coastS = (x, z) => {
    const i = clamp(Math.floor((x - W.X0) / VSB), 0, W.NX - 1), k = clamp(Math.floor((z - ZN) / VSB), 0, W.NZ - 1);
    return Math.min(x - W.X0 - INS_W[k], XE - x - INS_E[k], z - ZN - INS_N[i], SHORE_S[i] - z);
  };
  const HEADLAND = L.HEADLAND = { x: -634, z: 238, r: 19, r0: 7, top: 8 };   // south-west headland (Cape Solace Light, 48-sea)
  const protectedAt = (x, z) => (z > 166 && x > -300) || (x > PK.x0 - 1 && x < PK.x1 + 1 && z > PK.z0 - 1 && z < PK.z1 + 1) || !!L.inLot(x, z, 1.5)
    || P.nearestRoad(x, z).edge < 2 || VILLAS.some((v) => Math.abs(x - v.x) < v.w / 2 + 5 && Math.abs(z - v.z) < v.d / 2 + 5);

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
      shore: beachShore,
      foot: (x, z) => { if (x > -256 || x < -266 || z > 222.5) return false; for (const [fx, fz] of FP) if (Math.abs(x - fx) < 0.13 && Math.abs(z - fz) < 0.2) return true; return false; },
    };

    const H = W.H, C = W.C, S = W.S, NZ = W.NZ;
    for (let mx = 0; mx < W.NX / 4; mx++) {
      for (let mz = 0; mz < 600; mz++) {
        const x0 = mx + W.X0, z0 = mz - 300, xc = x0 + 0.5, zc = z0 + 0.5;
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
            const hl = Math.hypot(x - HEADLAND.x, (z - HEADLAND.z) * 0.85) + (N2(x * 0.11 + 3, z * 0.11 - 8) - 0.5) * 6;
            if (hl < HEADLAND.r) {
              const rr = hash(Math.floor(x * 1.2), Math.floor(z * 1.2));
              const hh = hl < HEADLAND.r0 ? HEADLAND.top : Math.floor(HEADLAND.top - (hl - HEADLAND.r0) * 1.5 - rr * 3);
              if (hh > hB) { hB = Math.max(-16, hh); top = hl < HEADLAND.r0 ? (hp < 0.6 ? GR.dry : GR.base) : RUB[(rr * 4) | 0]; side = RUB[(rr * 7 | 0) & 3]; }
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
          const q = z0 >= 170 && x0 >= -300 ? GRAN[1] : top;
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
    // ---- THE ISLAND COAST (edge strips only): sea shelf + tide-line rocks, beaches (low dunes in the north-west bay), rocky shelves,
    //      the Heights dropping into the sea as cliffs, a rubble mole in the bay; lots/roads/park/villa pads are never cut
    const CLF = L.CLIFF = [c(0x8a8276, { jitter: 0.7, edge: 1 }), c(0x9c9184, { jitter: 0.7, edge: 1 }), c(0x6f685e, { jitter: 0.7, edge: 1 })];
    const MARRAM = c(0x9aa45a, { jitter: 0.9 }), TIDE = Math.floor(SEA_Y * 4);
    const MOLE = L.MOLE = [[-404, -254], [-401, -276], [-394, -295]];
    const moleD = (x, z) => { let b = 1e9; for (let i = 0; i < MOLE.length - 1; i++) { const [ax, az] = MOLE[i], [bx, bz] = MOLE[i + 1], dx = bx - ax, dz = bz - az, u = clamp(((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz), 0, 1); b = Math.min(b, Math.hypot(x - ax - dx * u, z - az - dz * u)); } return b; };
    const CT = L.coastT = { beach: 0, dune: 0, rock: 0, cliff: 0, sea: 0, wall: 0 };
    // west of the park the Heights meet the sea as a graded rocky slope (shelf at the tide line, then ~1.6 m rise per metre)
    const nwSlope = (x, z) => x < PK.x0 - 1 && z < -236;
    const coastCol = (i, x, z) => {
      const s = L.coastS(x, z), g = H[i];
      if (s >= 9 && !(s < 44 && g > 6 && nwSlope(x, z))) return;
      if (protectedAt(x, z)) { if (s < 2) { S[i] = g > 6 ? CLF[0] : GRAN[0]; CT.wall++; } return; }
      const hp = hash(Math.floor(x * 2), Math.floor(z * 2)), cliff = g > 6, rocky = g > 2 || N2(x * 0.045 + 17, z * 0.045 - 5) > 0.62;
      let h = g, top = C[i], side = S[i];
      if (s < 0) {
        h = Math.min(g, clamp(Math.floor((SEA_Y - 0.35 + s * 0.3) * 4), -16, TIDE - 1));
        top = s > -2.5 ? (hp < 0.5 ? SEA.sand : SEA.sandD) : N2(x * 0.1, z * 0.1) < 0.45 ? SEA.weed : SEA.mud; side = SEA.sandD; CT.sea++;
        if (rocky && s > -7) {
          const rh = hash(Math.floor(x * 1.4) + 3, Math.floor(z * 1.4) - 5);
          if (rh > 0.52) { h = Math.max(h, TIDE - 3 + Math.floor((rh - 0.52) * 12 * (1 + s / 7)) + (cliff ? 2 : 0)); top = RUB[(rh * 37 | 0) & 3]; side = top; CT.rock++; }
        }
      } else if (cliff && nwSlope(x, z)) {
        const r2 = hash(Math.floor(x * 1.5), Math.floor(z * 1.5)), wn = (N2(x * 0.09 + 31, z * 0.09 - 12) - 0.5) * 2.4;
        const gh = Math.max(TIDE + 1, Math.floor((SEA_Y + 0.3 + (s < 4 ? s * 0.35 : 1.4 + (s - 4) * 1.6) + wn + r2 * 0.5) * 4));
        if (gh < g) {
          h = gh; side = RUB[(r2 * 7 | 0) & 3]; CT.rock++;
          if (s < 3) top = hp < 0.35 ? SEA.pebble : RUB[(r2 * 4) | 0];
          else if (g - gh > 10 || r2 < 0.35) top = r2 < 0.08 ? RUB[4] : r2 < 0.5 ? CLF[(r2 * 5) % 3 | 0] : RUB[(r2 * 4) | 0];
          else top = hp < 0.5 ? GR.dry : GR.olive;
        }
      } else if (cliff) {
        if (s < 2.5) { side = CLF[(hp * 3) | 0]; CT.cliff++; }
      } else if (rocky) {
        const r2 = hash(Math.floor(x * 1.5), Math.floor(z * 1.5)), sh = TIDE + 1 + Math.floor(s * 1.6 + r2 * 3);
        if (sh < g) { h = sh; top = r2 < 0.12 ? RUB[4] : RUB[(r2 * 4) | 0]; side = RUB[(r2 * 7 | 0) & 3]; CT.rock++; }
      } else {
        const bh = Math.floor((SEA_Y + 0.2 + s * 0.33) * 4), dk = z < -236 ? bayK(x) : 0;
        const dune = dk > 0.05 && s > 3.9 ? Math.floor(3.4 * dk * Math.sin(Math.PI * Math.min(1, (s - 3.9) / 5.1)) * (0.55 + 0.45 * N2(x * 0.08 + 2, z * 0.08))) : 0;
        if (bh < g) { h = bh; top = s < 0.9 ? BEACH.wet : hp < 0.5 ? BEACH.dry : BEACH.dry2; side = BEACH.wet; CT.beach++; }
        else if (dune > 0) { h = Math.max(g, 1 + dune); top = dune >= 2 && hp < 0.55 ? MARRAM : hp < 0.5 ? BEACH.dry : BEACH.dry2; side = BEACH.dry2; CT.dune++; }
        else if (hp < (9 - s) * 0.06) top = hp < 0.2 ? MARRAM : BEACH.dry2;
      }
      if (z < -250 && x > -412 && x < -386) {
        const md = moleD(x, z) + (N2(x * 0.4, z * 0.4) - 0.5) * 1.1;
        if (md < 1.5) { h = Math.max(h, 2); top = hp < 0.5 ? CAP : CAPD; side = RUB[(hp * 4) | 0]; }
        else if (md < 6) { const hr = Math.max(-16, 1 - Math.floor((md - 1.5) * 2.2) - Math.floor(hash(Math.floor(x * 1.3), Math.floor(z * 1.3)) * 3)); if (hr > h) { h = hr; top = RUB[(hp * 4) | 0]; side = top; } }
      }
      H[i] = h; C[i] = top; S[i] = side;
    };
    // the Solace Sands slope carried up the airfield's south strip
    const sands = (i, x, z) => {
      if (protectedAt(x, z)) return;
      const h = Math.floor((SEA_Y + (SHORE_S[clamp(Math.floor((x - W.X0) / VSB), 0, W.NX - 1)] - z) * 0.11) * 4); if (h >= H[i]) return;
      H[i] = h; C[i] = hash(Math.floor(x * 2), Math.floor(z * 2)) < 0.5 ? BEACH.dry : BEACH.dry2; S[i] = BEACH.wet; CT.beach++;
    };
    W.eachCol(W.X0, ZN, XE, -236, (bx, bz, i, x, z) => coastCol(i, x, z));
    W.eachCol(W.X0, -236, W.X0 + 14, 300, (bx, bz, i, x, z) => coastCol(i, x, z));
    W.eachCol(XE - 14, -236, XE, COAST, (bx, bz, i, x, z) => coastCol(i, x, z));
    W.eachCol(W.X0 + 14, 204, -300, COAST, (bx, bz, i, x, z) => sands(i, x, z));
    // the outermost block ring is always sea bed (the mesher draws no faces against the world edge)
    L.closeEdges = () => { const E = (i) => { H[i] = -16; C[i] = SEA.deep; S[i] = WETG; }; for (let bx = 0; bx < W.NX; bx++) { E(bx * NZ); E(bx * NZ + NZ - 1); } for (let bz = 0; bz < NZ; bz++) { E(bz); E((W.NX - 1) * NZ + bz); } };
    L.closeEdges();
    // ---- side colouring: granite courses on the quay wall, rubble on the breakwater, strata on the heights
    W.sideFn = (bx, bz, by, top) => {
      if (bz >= 1990) {        // z >= 197.5: quay wall / breakwater
        if (by < -5) return by < -12 ? WETG : (by & 1 ? WETG : GRAN[2]);
        if (bz >= 2040) return 0;   // out in the harbour (breakwater): use column side colour
        const course = (by + 16) >> 1, jt = ((bx + (course & 1) * 3) >> 3) & 3;
        return by >= 0 ? GRAN[jt % 3] : (by === -5 ? WEED : GRAN[(jt + 1) % 3]);
      }
      const sc = S[bx * NZ + bz];
      if (sc === CLF[0] || sc === CLF[1] || sc === CLF[2]) return CLF[((by >> 3) + 9 + ((bx >> 5) & 1)) % 3];   // sea-cliff strata
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
    for (let x = W.X0; x < XE; x += 8) for (let z = COAST; z < 300; z += 8) q(x, z, Math.min(XE, x + 8), Math.min(300, z + 8));
    // coastal water inside the map edges: 4 m tiles where the island shore dips under the sea, always along the edge ring
    for (let x = W.X0; x < XE; x += 4) for (let z = ZN; z < COAST; z += 4) {
      if (x > W.X0 && x + 4 < XE && z > ZN) {
        if (L.coastS(x + 2, z + 2) > 14) continue;
        let wet = false;
        for (let i = 0; i < 4 && !wet; i++) for (let k = 0; k < 4; k++) { const px = x + i + 0.5, pz = z + k + 0.5; if (L.coastS(px, pz) < 2 && W.groundY(px, pz) < SEA_Y - 0.01) { wet = true; break; } }
        if (!wet) continue;
      }
      q(x, z, x + 4, Math.min(COAST, z + 4));
    }
    // the open ocean all around the island, out past the camera's far plane (50 m tiles near the coast, 300 m beyond)
    const band = (x0, z0, x1, z1, st) => { for (let x = x0; x < x1; x += st) for (let z = z0; z < z1; z += st) q(x, z, Math.min(x1, x + st), Math.min(z1, z + st)); };
    const ring = (h, o, st) => { band(o[0], o[1], o[2], h[1], st); band(o[0], h[3], o[2], o[3], st); band(o[0], h[1], h[0], h[3], st); band(h[2], h[1], o[2], h[3], st); };
    const MAPR = [W.X0, ZN, XE, W.z1], NEAR = [W.X0 - 300, ZN - 300, XE + 300, W.z1 + 300], FAR = [W.X0 - 2640, ZN - 2640, XE + 2640, W.z1 + 2640];
    ring(MAPR, NEAR, 50); ring(NEAR, FAR, 300);
    const sea = fin('lake', sp, sn, si, sN, SEA_Y); sea.userData.sea = true;
    // sea bed under the ocean (y -4, the in-map bed level), so the translucent water never shows the void
    { const sb = new AF.GeoBuf(), bed = AF.col(0x44564e, { jitter: 0.25 });
      const bq = (x0, z0, x1, z1) => sb.quad([x0, -4, z0], [x0, -4, z1], [x1, -4, z1], [x1, -4, z0], [0, 0], [0, 1], [1, 1], [1, 0], bed, 2, [3, 3, 3, 3]);
      bq(FAR[0], FAR[1], FAR[2], ZN); bq(FAR[0], W.z1, FAR[2], FAR[3]); bq(FAR[0], ZN, W.X0, W.z1); bq(XE, ZN, FAR[2], W.z1);
      const m = new THREE.Mesh(sb.geometry(), AF.mat.voxel); m.name = 'land-seabed'; m.matrixAutoUpdate = false; m.updateMatrix(); m.frustumCulled = false; AF.scene.add(m); }
    const lake = mk('lake', Math.floor(LK.cx - LK.rx - 3), Math.floor(LK.cz - LK.rz - 3), Math.ceil(LK.cx + LK.rx + 3), Math.ceil(LK.cz + LK.rz + 3), L.LAKE_Y, (x, z) => L.lakeE(x, z) <= 1.06);
    const pond = mk('pond', PD.cx - PD.r - 2, PD.cz - PD.r - 2, PD.cx + PD.r + 2, PD.cz + PD.r + 2, L.POND_Y, (x, z) => Math.hypot(x - PD.cx, z - PD.cz) < PD.r + 0.5);
    L.water = { sea, lake, pond };
    for (const g of [sea, lake, pond]) if (g.userData.quads) AF.addWater(g);
    L.waterMs = Math.round(performance.now() - t0);
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
  AF.test('land: island coastline (beaches, dunes, rocks, sea cliffs, north-west bay)', () => {
    const t = L.coastT || {};
    const bay = W.groundY(-425, -285);
    return { ok: t.beach > 5000 && t.dune > 200 && t.rock > 500 && t.cliff > 200 && bay < SEA_Y, info: `${JSON.stringify(t)} bay bed ${bay}` };
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

