// ================================================================ 15-harbour-2.js
try {
// ===== 15-harbour-2: the east waterfront — quay wall dressing (coping, ladders, fenders, bollards) for the whole harbour,
//       THE CARGO DOCKS (warehouse row, Pier 9, gantry crane + 2 jib cranes, rail spurs, crates/barrels/sacks),
//       2 CARGO SHIPS + 2 TUGBOATS, the east BREAKWATER + SOLACE POINT LIGHT (rotating beam), the warehouse block with
//       the cannery, the freight yard (coal + ice depot)  (OWNER: land-harbour) =====
{
  const P = AF.PLAN, W = AF.W;
  const L = AF.land = AF.land || {};
  const HB = P.harbour, COAST = HB.coastZ, SEA_Y = HB.waterY, LH = HB.lighthouse;
  const hash = AF.hash2, clamp = AF.clamp, TAU = Math.PI * 2;
  const PIER = {}; for (const p of HB.piers) PIER[p.id] = p;
  const HR = AF.harbour = AF.harbour || { ships: [], ferry: null, tug: null, lighthouse: { x: LH.x, y: 26, z: LH.z }, boats: [] };
  const dyn = L.hbDyn = L.hbDyn || [];
  const F = (x0, y0, z0, x1, y1, z1, c) => W.fill(x0, y0, z0, x1, y1, z1, c);
  const geo = (m, vs = 1 / 8, anchor = [0.5, 0, 0.5]) => AF.meshModel(m, { vs, anchor });
  const put = (g, x, y, z, rot = 0, collide = false) => AF.placeStatic(g, x, y, z, rot, { collide });
  const LIB = () => AF.hbLib || {};

  AF.onBuild('harbour-east', 305, () => {
    const t0 = performance.now();
    const c = (hex, o = {}) => AF.col(hex, Object.assign({ jitter: 0.4, edge: 0.7 }, o));
    const C = {
      cope: c(0xc4bcaa, { jitter: 0.4, edge: 0.9 }), gran: c(0x8f8b84, { jitter: 0.5, edge: 1 }), iron: c(0x2c2f33, { jitter: 0.2 }), rust: c(0x8a4a2a, { jitter: 0.6 }),
      tyre: c(0x1e1e20, { jitter: 0.2, edge: 0.4 }), concrete: c(0xa8a294, { jitter: 0.8 }), concreteD: c(0x948e80, { jitter: 0.8 }), rail: c(0x5a5550, { jitter: 0.3 }), sleeper: c(0x5e4a38, { jitter: 0.5 }),
      brick: c(0x9a4a36, { jitter: 0.8, edge: 0.9 }), brickD: c(0x7a3828, { jitter: 0.8, edge: 0.9 }), brickB: c(0x8a5a40, { jitter: 0.8, edge: 0.9 }), brickS: c(0xb86a50, { jitter: 0.8, edge: 0.9 }),
      stone: c(0xb4ac9a, { jitter: 0.5, edge: 0.9 }), cream: c(0xf2e8d2, { jitter: 0.2 }), white: c(0xf6f2ea, { jitter: 0.15 }), red: c(0xb8302a), navy: c(0x1f3552), black: c(0x1e2024, { jitter: 0.2 }),
      yellow: c(0xe8b830), green: c(0x3a6a4a), teal: c(0x2f8a86), gold: c(0xd8a83a, { jitter: 0.3 }), wood: c(0x8a6a44, { jitter: 0.6 }), woodD: c(0x5a4230, { jitter: 0.5 }), sack: c(0xd8c9a0, { jitter: 0.5 }),
      slat: c(0x6a7a7a, { jitter: 0.3 }), slatD: c(0x56666a, { jitter: 0.3 }), win: AF.col('window'), glass: AF.col('glass'), dark: c(0x2a2e34, { jitter: 0.2 }),
      warm: AF.col(0xffd89a, { emit: 0xffc070, emitK: 1.6, mode: 'night' }), cool: AF.col(0xa8c8ff, { emit: 0x80a8ff, emitK: 1.2, mode: 'night' }),
      bulb: AF.col(0xfff2c0, { emit: 0xffe0a0, emitK: 3, mode: 'night' }), lampA: AF.col(0xfff0c8, { emit: 0xffd48a, emitK: 2.6, mode: 'always' }),
      coal: c(0x26262a, { jitter: 1 }), coalL: c(0x3a3a40, { jitter: 1 }), ice: c(0xdcecf2, { jitter: 0.3 }),
      crate: [c(0xa8845a, { jitter: 0.5 }), c(0x8e6e48, { jitter: 0.5 }), c(0x6a8a5a, { jitter: 0.5 }), c(0x4a6a8a, { jitter: 0.5 }), c(0xa85a3a, { jitter: 0.5 })],
    };
    const lib = LIB();
    const pierX = (x) => HB.piers.some((p) => x >= p.x0 - 0.5 && x < p.x1 + 0.5) || (x >= 278 && x < 285);

    // =============================================================== quay wall dressing along the whole coast
    for (let x = -300; x < 300; x += 0.25) {
      if (pierX(x)) continue;
      F(x, 0.25, COAST - 0.5, x + 0.25, 0.5, COAST, C.cope);
    }
    const bollard = lib.bollardGeo ? lib.bollardGeo() : null;
    for (let x = -296; x < 296; x += 3) {
      if (pierX(x) || pierX(x + 1)) continue;
      const k = Math.round((x + 296) / 3);
      if (k % 10 === 0) {   // iron ladder down the wall face
        for (let y = -2.5; y < 0.25; y += 0.5) F(x, y, COAST, x + 0.75, y + 0.125, COAST + 0.25, C.iron);
        F(x, -2.5, COAST, x + 0.125, 0.75, COAST + 0.25, C.iron); F(x + 0.625, -2.5, COAST, x + 0.75, 0.75, COAST + 0.25, C.iron);
      } else if (k % 3 === 1) {   // rubber tyre fender hanging on the face
        F(x, -1.25, COAST, x + 1, -0.25, COAST + 0.5, C.tyre); F(x + 0.25, -1.0, COAST + 0.25, x + 0.75, -0.5, COAST + 0.5, 0);
        F(x + 0.375, -0.25, COAST, x + 0.625, 0.25, COAST + 0.125, C.rust);
      }
      if (x > -150 && k % 4 === 2 && bollard) put(bollard, x + 0.5, 0.25, COAST - 1.3, 0, true);
      if (x > -150 && k % 12 === 2 && bollard) AF.addSpot({ building: null, x: x + 0.5, y: 0.85, z: COAST - 1.3, yaw: Math.PI, kind: 'gull' });
      if (k % 5 === 3) F(x + 0.375, 0.0, COAST, x + 0.625, 0.25, COAST + 0.125, C.rust);                          // mooring ring
    }

    // =============================================================== THE CARGO DOCKS (x 40..292, z 173..210)
    const DX0 = 40, DX1 = 292;
    W.eachCol(DX0, 173.5, DX1, COAST, (bx, bz, i, x, z) => { W.C[i] = ((bx >> 4) + (bz >> 4)) & 1 ? C.concrete : C.concreteD; });
    // two rail spurs along the quay (flush rails + sleepers painted into the apron)
    for (const rz of [195.5, 201.5]) W.eachCol(DX0 + 2, rz - 1, 250, rz + 1, (bx, bz, i, x, z) => { const o = z - rz; if (Math.abs(Math.abs(o) - 0.75) < 0.13) W.C[i] = C.rail; else if ((bx & 3) === 0) W.C[i] = C.sleeper; });
    // warehouse helper: brick shell with window recesses, roll-up doors + loading dock on the quay face, parapet, painted name
    const warehouse = (x0, z0, x1, z1, h, wall, name, o = {}) => {
      W.walls(x0, 0.25, z0, x1, h, z1, wall, 0.5);
      F(x0 + 0.5, h - 0.5, z0 + 0.5, x1 - 0.5, h, z1 - 0.5, C.concreteD);
      F(x0 - 0.25, h, z0 - 0.25, x1 + 0.25, h + 0.75, z1 + 0.25, wall); F(x0 - 0.5, h + 0.75, z0 - 0.5, x1 + 0.5, h + 1.0, z1 + 0.5, C.stone);
      W.walls(x0 - 0.25, 0.25, z0 - 0.25, x1 + 0.25, 1.0, z1 + 0.25, C.brickD, 0.5);
      // stepped centre gable on the name faces
      const mx = (x0 + x1) / 2, gw = Math.min(10, (x1 - x0) * 0.4);
      for (const [za, zb] of [[z0 - 0.25, z0 + 0.25], [z1 - 0.25, z1 + 0.25]]) { F(mx - gw / 2, h + 0.75, za, mx + gw / 2, h + 2.25, zb, wall); F(mx - gw / 4, h + 2.25, za, mx + gw / 4, h + 3.25, zb, wall); F(mx - gw / 4 - 0.25, h + 3.25, za - 0.25, mx + gw / 4 + 0.25, h + 3.5, zb + 0.25, C.stone); }
      // windows: storey rows, some lit
      const storeys = Math.max(1, Math.floor((h - 2) / 4));
      for (let s = 0; s < storeys; s++) {
        const wy = 1.75 + s * 4 + (s === 0 ? 2.25 : 0.5); if (wy + 2 > h - 1) break;
        for (let x = x0 + 2; x < x1 - 2.5; x += 3.5) for (const [za, zb] of [[z0, z0 + 0.25], [z1 - 0.25, z1]]) {
          const lit = hash(Math.round(x * 3) + s * 7, Math.round(za)) < 0.3 ? C.warm : hash(Math.round(x), Math.round(za) + s) < 0.08 ? C.cool : C.win;
          F(x, wy, za, x + 1.5, wy + 2, zb, lit); F(x - 0.25, wy - 0.25, za - 0.25, x + 1.75, wy, zb + 0.25, C.stone);
          F(x - 0.25, wy + 2, za, x + 1.75, wy + 2.25, zb, C.brickS);
        }
        for (let z = z0 + 2; z < z1 - 2.5; z += 3.5) for (const [xa, xb] of [[x0, x0 + 0.25], [x1 - 0.25, x1]]) F(xa, wy, z, xb, wy + 2, z + 1.5, hash(Math.round(z), s + Math.round(xa)) < 0.25 ? C.warm : C.win);
      }
      // roll-up doors + loading dock on the face (o.face 's' = +z side)
      const zf = o.face === 'n' ? z0 : z1, dir = o.face === 'n' ? -1 : 1;
      for (let x = x0 + 3; x < x1 - 4; x += 7) {
        const za = dir > 0 ? zf - 0.25 : zf, zb = za + 0.25;
        F(x, 1.25, za, x + 3.5, 4.5, zb, 0);
        for (let y = 1.25; y < 4.5; y += 0.25) F(x, y, dir > 0 ? zf - 0.5 : zf + 0.25, x + 3.5, y + 0.25, dir > 0 ? zf - 0.25 : zf + 0.5, Math.round(y * 4) % 2 ? C.slat : C.slatD);
        F(x - 0.25, 4.5, dir > 0 ? zf : zf - 0.5, x + 3.75, 4.75, dir > 0 ? zf + 0.5 : zf, C.stone);
        F(x + 1.5, 4.9, dir > 0 ? zf : zf - 0.25, x + 2, 5.15, dir > 0 ? zf + 0.25 : zf, C.bulb);
      }
      const dz0 = dir > 0 ? zf : zf - 2, dz1 = dir > 0 ? zf + 2 : zf;
      F(x0 + 1, 0.25, dz0, x1 - 1, 1.25, dz1, C.concrete);
      for (let x = x0 + 1; x < x1 - 1; x += 2) F(x, 0.75, dir > 0 ? dz1 : dz0 - 0.25, x + 1, 1.0, dir > 0 ? dz1 + 0.25 : dz0, C.tyre);
      for (let i = 0; i < 4; i++) F(x1 - 1 - (i + 1) * 0.5 + 0.5, 0.25, dz0, x1 - 1 - i * 0.5 + 0.5, 1.25 - i * 0.25, dz1, C.concreteD);
      // downspouts + a water tank on the roof, skylights
      for (const x of [x0 + 0.5, x1 - 1]) F(x, 1, dir > 0 ? z1 : z0 - 0.25, x + 0.25, h, dir > 0 ? z1 + 0.25 : z0, C.iron);
      if (o.tank) {
        const tx = x0 + 4, tz = z0 + 3, ty = h;
        for (const [lx, lz] of [[0, 0], [2.5, 0], [0, 2.5], [2.5, 2.5]]) F(tx + lx, ty, tz + lz, tx + lx + 0.25, ty + 3, tz + lz + 0.25, C.iron);
        for (let y = ty + 3; y < ty + 6; y += 0.25) for (let a = 0; a < TAU; a += 0.12) W.setM(tx + 1.4 + Math.cos(a) * 1.6, y, tz + 1.4 + Math.sin(a) * 1.6, Math.floor(y * 4) % 5 ? C.wood : C.iron);
        for (let r = 0; r < 1.8; r += 0.25) for (let a = 0; a < TAU; a += 0.15) W.setM(tx + 1.4 + Math.cos(a) * r, ty + 6 + (1.8 - r) * 0.5, tz + 1.4 + Math.sin(a) * r, C.woodD);
      }
      for (let x = x0 + 5; x < x1 - 5; x += 8) F(x, h, (z0 + z1) / 2 - 1, x + 3, h + 0.5, (z0 + z1) / 2 + 1, C.glass);
      if (name) {
        const tw = name.length * 1.5 - 0.25, sx = mx - tw / 2, ty2 = h - 2.5;
        F(sx - 0.5, ty2 - 0.5, dir > 0 ? z1 : z0 - 0.25, sx + tw + 0.5, ty2 + 2.25, dir > 0 ? z1 + 0.25 : z0, o.signBg || C.cream);
        if (dir > 0) lib.wallText(name, o.signFg || C.navy, sx, ty2, z1 + 0.25, 's'); else lib.wallText(name, o.signFg || C.navy, sx + tw, ty2, z0 - 0.25, 'n');
      }
    };
    // back-of-quay warehouse row (faces south onto the apron; street side has windows)
    const WH = [
      [44, 175, 84, 187.5, 12, C.brick, 'SOLACE COLD STORAGE', { tank: true }],
      [88, 175, 108, 188, 9, C.brickB, 'SHED 7', {}],
      [112, 175, 148, 188, 10, C.brickS, 'PIER 9', { signBg: C.white, signFg: C.red }],
      [154, 175, 196, 190, 13, C.brick, 'MERIDIAN IMPORTS', { tank: true, signBg: C.navy, signFg: C.cream }],
      [200, 175, 240, 189, 11, C.brickB, 'HARBOUR BONDED STORES', {}],
    ];
    for (const w of WH) warehouse(w[0], w[1], w[2], w[3], w[4], w[5], w[6], Object.assign({ face: 's' }, w[7]));
    // stacks of crates, barrels, sacks on the apron
    const crateStack = (x, z, nx, nz, ny, seed) => { for (let i = 0; i < nx; i++) for (let k = 0; k < nz; k++) { const hh = 1 + Math.floor(hash(seed + i, k) * ny); for (let j = 0; j < hh; j++) { const col = C.crate[(hash(seed + i * 3 + j, k * 5) * C.crate.length) | 0]; F(x + i * 1.5, 0.25 + j * 1.25, z + k * 1.5, x + i * 1.5 + 1.25, 0.25 + j * 1.25 + 1.25, z + k * 1.5 + 1.25, col); F(x + i * 1.5 + 0.25, 0.25 + j * 1.25 + 0.5, z + k * 1.5 - 0.02, x + i * 1.5 + 1.0, 0.25 + j * 1.25 + 0.75, z + k * 1.5, C.woodD); } } };
    const barrels = (x, z, n, seed) => { for (let i = 0; i < n; i++) { const bx = x + (i % 4) * 1.0, bz = z + Math.floor(i / 4) * 1.0; F(bx, 0.25, bz, bx + 0.75, 1.25, bz + 0.75, hash(seed, i) < 0.5 ? C.wood : C.rust); F(bx, 0.5, bz, bx + 0.75, 0.625, bz + 0.75, C.iron); F(bx, 1.0, bz, bx + 0.75, 1.125, bz + 0.75, C.iron); } };
    const sacks = (x, z, n) => { for (let i = 0; i < n; i++) { const bx = x + (i % 3) * 0.9, bz = z + Math.floor(i / 3) % 2 * 0.8, by = 0.25 + Math.floor(i / 6) * 0.5; F(bx, by, bz, bx + 0.75, by + 0.5, bz + 0.6, C.sack); } };
    crateStack(46, 192, 4, 2, 3, 11); barrels(56, 192.5, 8, 3); sacks(64, 192, 12);
    // ---- two enterable warehouses (street doors on Harbour Blvd): SHED 7 + HARBOUR BONDED STORES
    L.whDoors = [];
    const whInterior = (x0, z0, x1, z1, h, id, name) => {
      const dx = x0 + 4.5;
      W.eachCol(x0 + 0.5, z0 + 0.5, x1 - 0.5, z1 - 0.5, (bx, bz, i) => { W.H[i] = 1; W.C[i] = ((bx >> 3) + (bz >> 3)) & 1 ? C.concrete : C.concreteD; });
      F(dx, 0.25, z0 - 0.25, dx + 3, 3.75, z0 + 0.5, 0);                                          // open doorway (3 x 3.5 m)
      F(dx - 0.25, 3.75, z0 - 0.5, dx + 3.25, 4.0, z0 + 0.5, C.stone);
      for (let y = 3.5; y < 3.75; y += 0.25) F(dx, y, z0 + 0.5, dx + 3, y + 0.25, z0 + 0.75, C.slat);   // rolled-up door drum
      F(dx + 3.25, 0.25, z0 - 1.5, dx + 3.5, 3.25, z0 - 0.25, C.slatD);                               // a door leaf standing open
      const pal = C.woodD;
      const pallet = (px, pz, load) => { F(px, 0.25, pz, px + 1.25, 0.5, pz + 1.25, pal); if (load === 's') { for (let k = 0; k < 4; k++) F(px + (k % 2) * 0.6, 0.5 + Math.floor(k / 2) * 0.5, pz + 0.1, px + (k % 2) * 0.6 + 0.6, 1.0 + Math.floor(k / 2) * 0.5, pz + 1.15, C.sack); } else { const hh = 1 + (hash(px | 0, pz | 0) * 2 | 0); for (let k = 0; k < hh; k++) F(px + 0.1, 0.5 + k * 1.0, pz + 0.1, px + 1.15, 1.5 + k * 1.0, pz + 1.15, C.crate[(k + (px | 0)) % 5]); } };
      for (let x = x0 + 9; x < x1 - 3; x += 2) for (const pz of [z0 + 2.5, z0 + 4, z1 - 4, z1 - 2.5]) if (hash(x | 0, pz | 0) < 0.75) pallet(x, pz, hash(pz | 0, x | 0) < 0.5 ? 's' : 'c');
      // steel shelving racks down the middle
      for (let x = x0 + 9; x < x1 - 4; x += 0.25) { const post = Math.round((x - x0) * 4) % 12 === 0; if (post) F(x, 0.25, z0 + 6.5, x + 0.25, 4.5, z0 + 7.5, C.rust); for (const y of [1.25, 2.75, 4.25]) { F(x, y, z0 + 6.5, x + 0.25, y + 0.25, z0 + 7.5, C.iron); if (hash(Math.floor(x * 2), y * 4 | 0) < 0.7) F(x, y + 0.25, z0 + 6.6, x + 0.25, y + 0.75 + (Math.floor(x) % 2) * 0.25, z0 + 7.4, C.crate[Math.floor(x + y) % 5]); } }
      // a 1930s hand truck (v2: the modern forklift is gone)
      { const m = new AF.Model(6, 12, 5); m.box(0, 0, 0, 1, 12, 1, C.red); m.box(5, 0, 0, 6, 12, 1, C.red); m.box(0, 11, 0, 6, 12, 1, C.red); m.box(0, 0, 0, 6, 1, 4, C.iron); m.box(0, 0, 1, 1, 2, 3, C.black); m.box(5, 0, 1, 6, 2, 3, C.black); m.box(1, 1, 1, 5, 5, 4, C.crate[0]);
        put(geo(m, 1 / 8), dx - 2.5, 0.25, z0 + 2, 0, true); }
      // hanging lamps + light
      for (let x = x0 + 5; x < x1 - 3; x += 7) for (const z of [z0 + 4.5, z1 - 4.5]) { F(x + 0.4, 5.5, z + 0.4, x + 0.6, h - 0.5, z + 0.6, C.iron); F(x, 5.25, z, x + 1, 5.5, z + 1, C.iron); F(x + 0.25, 5.0, z + 0.25, x + 0.75, 5.25, z + 0.75, C.lampA); }
      AF.addLight({ x: (x0 + x1) / 2, y: 5, z: (z0 + z1) / 2, color: 0xffe0b0, intensity: 1.3, range: 16, kind: 'interior' });
      AF.addBuilding({ id, name, kind: 'warehouse', box: [x0, 0.25, z0, x1, h, z1], doors: [{ x: dx + 1.5, y: 0.25, z: z0 - 1.2, yaw: 0 }], floors: [0.25], interior: true, owner: 'land-harbour' });
      const pth = (px, pz) => [[dx + 1.5, z0 - 1.2], [dx + 1.5, z0 + 2], [px, z0 + 5.5], [px, pz]];
      AF.addSpot({ building: id, x: x0 + 12, y: 0.25, z: z0 + 5.5, yaw: 0, kind: 'work', path: pth(x0 + 12, z0 + 5.5) });
      AF.addSpot({ building: id, x: x1 - 6, y: 0.25, z: z0 + 5.5, yaw: Math.PI, kind: 'work', path: pth(x1 - 6, z0 + 5.5) });
      AF.addSpot({ building: id, x: x0 + 7, y: 0.25, z: z1 - 8, yaw: Math.PI / 2, kind: 'work', path: [[dx + 1.5, z0 - 1.2], [dx + 1.5, z0 + 2], [x0 + 7, z0 + 5.5], [x0 + 7, z1 - 8]] });
      L.whDoors.push({ id, x: dx + 1.5, z: z0 });
    };
    whInterior(88, 175, 108, 188, 9, 'shed-7', 'Shed 7 Warehouse');
    whInterior(200, 175, 240, 189, 11, 'bonded-stores', 'Harbour Bonded Stores');
    { // v2: SHED 7 is the fish shed — iced fish boxes, ice blocks, a crane hook through the roof hatch, a cat asleep on the sacks
      const fishS = [c(0xb8c4cc), c(0xd8584a), c(0x3a6a7a)], hx = 90, hz = 181;
      for (let i = 0; i < 12; i++) { const x = hx + (i % 3) * 1.1, z = hz + Math.floor(i / 3) % 2 * 1.3, y = 0.25 + Math.floor(i / 6) * 0.5; F(x, y, z, x + 1, y + 0.5, z + 1.2, C.wood); F(x + 0.125, y + 0.375, z + 0.125, x + 0.875, y + 0.5, z + 1.075, i % 2 ? C.ice : fishS[i % 3]); }
      for (let i = 0; i < 6; i++) { const x = hx + (i % 3) * 1.0, z = 185.5, y = 0.25 + Math.floor(i / 3) * 0.75; F(x, y, z, x + 0.75, y + 0.75, z + 0.75, C.ice); }
      F(98, 8.75, 179.5, 100, 9.0, 181.5, 0); for (let y = 3.5; y < 9; y += 0.25) F(98.875, y, 180.375, 99.125, y + 0.25, 180.625, C.iron);   // hatch + chain
      F(98.25, 2.0, 179.75, 99.75, 3.5, 181.25, c(0x6a7a5a, { solid: false })); F(98.5, 2.25, 180, 99.5, 3.0, 181, fishS[0]);            // net of fish on the hook
      F(96.5, 0.25, 186, 98.5, 0.75, 187.25, C.sack); F(96.75, 0.75, 186.25, 97.5, 1.0, 186.75, c(0xe08a3a)); F(97.4, 0.75, 186.3, 97.6, 0.95, 186.55, c(0xe08a3a));   // ginger cat
      AF.addSpot({ building: 'shed-7', x: 94, y: 0.25, z: 182, yaw: -Math.PI / 2, kind: 'work' });
    }
    { // v2: the BONDED STORES are the dry-goods vault — tea chests, rum casks in racks, tobacco bales, a foreman's glass office, a card game
      const tea = c(0xc8a878), teaS = c(0x2a2a2e), tob = c(0x8a6a3a), tobB = c(0x4a3a2a), rum = c(0x6a3a22), card = c(0x2f6a3a);
      for (let i = 0; i < 16; i++) { const x = 201 + (i % 4) * 0.9, z = 179 + Math.floor(i / 4) % 2 * 0.9, y = 0.25 + Math.floor(i / 8) * 0.8; F(x, y, z, x + 0.8, y + 0.8, z + 0.8, tea); F(x + 0.2, y + 0.3, z - 0.01, x + 0.6, y + 0.5, z, teaS); }
      for (let r = 0; r < 2; r++) { F(201, 0.25 + r * 1.1, 184, 208, 0.5 + r * 1.1, 184.25, C.woodD); F(201, 0.25 + r * 1.1, 186.25, 208, 0.5 + r * 1.1, 186.5, C.woodD); for (let x = 201.2; x < 207.5; x += 1.0) { F(x, 0.5 + r * 1.1, 184.25, x + 0.85, 1.35 + r * 1.1, 186.25, rum); F(x, 0.75 + r * 1.1, 184.25, x + 0.85, 0.85 + r * 1.1, 186.25, C.iron); } }
      for (let i = 0; i < 8; i++) { const x = 228 + (i % 4) * 1.3, y = 0.25 + Math.floor(i / 4) * 0.75; F(x, y, 186, x + 1.2, y + 0.75, 187.8, tob); F(x + 0.5, y, 186, x + 0.7, y + 0.75, 187.8, tobB); }
      // foreman's office: glass box with a desk + lamp (north-east corner)
      F(234, 0.25, 180, 239.5, 2.75, 180.25, C.glass); F(234, 0.25, 180, 234.25, 2.75, 184, C.glass); F(234, 0.25, 184, 239.5, 2.75, 184.25, C.glass); F(234, 2.75, 180, 239.5, 3.0, 184.25, C.woodD);
      F(234.25, 0.25, 181.5, 234.5, 2.5, 182.75, 0); F(236, 0.25, 180.75, 238.5, 1.0, 181.75, C.wood); F(236.25, 1.0, 181, 236.5, 1.5, 181.25, C.warm);
      AF.addSpot({ building: 'bonded-stores', x: 237, y: 0.25, z: 182.4, yaw: Math.PI, kind: 'sit' });
      // dockers playing cards on an upturned crate
      F(214, 0.25, 185, 215, 1.0, 186, C.wood); F(214, 1.0, 185, 215, 1.05, 186, card);
      for (const [sx, sz, yaw] of [[213.2, 185.5, Math.PI / 2], [215.8, 185.5, -Math.PI / 2], [214.5, 184.2, 0], [214.5, 186.8, Math.PI]]) { F(sx - 0.25, 0.25, sz - 0.25, sx + 0.25, 0.75, sz + 0.25, C.crate[1]); AF.addSpot({ building: 'bonded-stores', x: sx, y: 0.75, z: sz, yaw, kind: 'sit' }); }
    }
    // freight wagons standing on the rail spur + handcarts
    const wagon = (kind) => {
      const m = new AF.Model(40, 16, 11), bogie = C.black, wheel = C.iron;
      m.box(1, 2, 1, 39, 3, 10, C.black); for (const x of [4, 10, 28, 34]) { m.box(x, 0, 0, x + 3, 3, 1, wheel); m.box(x, 0, 10, x + 3, 3, 11, wheel); }
      m.box(0, 2, 4, 1, 3, 7, bogie); m.box(39, 2, 4, 40, 3, 7, bogie);
      if (kind === 'box' || kind === 'box2') { const bc = kind === 'box' ? c(0x8a3a2a) : c(0x6a4a34); m.box(1, 3, 1, 39, 14, 10, bc); m.box(0, 14, 0, 40, 15, 11, C.iron); m.box(16, 4, 0, 24, 13, 1, c(0x5a2a20)); m.box(16, 4, 10, 24, 13, 11, c(0x5a2a20)); for (let x = 2; x < 39; x += 4) { m.box(x, 3, 0, x + 1, 14, 1, C.black); m.box(x, 3, 10, x + 1, 14, 11, C.black); } }
      else if (kind === 'tank') { for (let x = 2; x < 38; x++) for (let y = 3; y < 13; y++) for (let z = 1; z < 10; z++) if (Math.hypot(y + 0.5 - 8, z + 0.5 - 5.5) < 4.6) m.set(x, y, z, x % 9 === 0 ? C.iron : C.black); m.box(18, 13, 4, 22, 15, 7, C.iron); }
      else { m.box(1, 3, 1, 39, 4, 10, C.woodD); for (let x = 3; x < 36; x += 6) m.box(x, 4, 2, x + 5, 8, 9, C.crate[(x / 6 | 0) % 5]); }
      return geo(m, 1 / 4, [0.5, 0, 0.5]);
    };
    const WG = { box: wagon('box'), box2: wagon('box2'), tank: wagon('tank'), flat: wagon('flat') };
    for (const [wx, k] of [[50, 'box'], [61, 'flat'], [72, 'box2'], [90, 'tank'], [101, 'box'], [245, 'flat']]) put(WG[k], wx, 0.25, 201.5, 0, true);
    const hcart = (() => { const m = new AF.Model(6, 12, 5); m.box(0, 0, 0, 1, 12, 1, C.red); m.box(5, 0, 0, 6, 12, 1, C.red); m.box(0, 11, 0, 6, 12, 1, C.red); m.box(0, 0, 0, 6, 1, 4, C.iron); m.box(0, 0, 1, 1, 2, 3, C.black); m.box(5, 0, 1, 6, 2, 3, C.black); m.box(1, 1, 1, 5, 6, 4, C.sack); return geo(m, 1 / 8); })();
    for (const [hx, hz] of [[68, 193], [96, 194], [158, 197], [206, 196], [228, 199], [252, 193]]) put(hcart, hx, 0.25, hz, (hx | 0) % 4, true);
    crateStack(78, 205, 3, 2, 2, 111); crateStack(196, 205, 3, 2, 2, 121); barrels(236, 205, 8, 19); sacks(88, 205.5, 9);

    crateStack(90, 191, 3, 2, 2, 21); barrels(154, 192.5, 12, 5); crateStack(170, 192, 5, 2, 3, 31); sacks(182, 192, 18);
    crateStack(204, 191.5, 4, 2, 3, 41); barrels(222, 192, 8, 7); crateStack(244, 178, 6, 4, 4, 51); barrels(256, 186, 12, 9); sacks(262, 178, 18);
    for (let x = 60; x < 250; x += 30) lib.lamp && lib.lamp(x, 0.25, 205.5);
    // workers
    for (const [x, z] of [[60, 196], [120, 198], [176, 197], [215, 198], [250, 196]]) AF.addSpot({ building: null, x, y: 0.25, z, yaw: Math.PI, kind: 'work' });

    // ---- Pier 9 (concrete, wide) — the cargo pier
    const CP = PIER.cargo;
    {
      for (let z = COAST - 0.25; z < CP.z1; z += 0.25) F(CP.x0, -0.5, z, CP.x1, 0.25, z + 0.25, ((Math.floor(z * 0.25) + 0) & 1) ? C.concrete : C.concreteD);
      for (let z = COAST + 3; z < CP.z1; z += 6) for (let x = CP.x0 + 1; x < CP.x1; x += 6) F(x, -4, z, x + 1, -0.5, z + 1, C.gran);
      for (let z = COAST + 3; z < CP.z1 - 1; z += 8) { bollard && put(bollard, CP.x0 + 0.6, 0.25, z, 0, true); bollard && put(bollard, CP.x1 - 0.6, 0.25, z + 4, 0, true); }
      for (let z = COAST + 2; z < CP.z1; z += 4) { F(CP.x0 - 0.25, -1.25, z, CP.x0, -0.25, z + 1, C.tyre); F(CP.x1, -1.25, z, CP.x1 + 0.25, -0.25, z + 1, C.tyre); }
      W.eachCol(0, 0, 0, 0, () => {});
      for (const rx of [CP.x0 + 6, CP.x1 - 6]) for (let z = COAST; z < CP.z1 - 2; z += 0.25) { F(rx - 0.75, 0.25, z, rx - 0.5, 0.3125, z + 0.25, C.rail); F(rx + 0.5, 0.25, z, rx + 0.75, 0.3125, z + 0.25, C.rail); }
      crateStack(CP.x0 + 12, COAST + 20, 3, 3, 3, 61); crateStack(CP.x0 + 22, COAST + 36, 3, 4, 2, 71); barrels(CP.x0 + 12, COAST + 44, 8, 11); sacks(CP.x0 + 24, COAST + 12, 12);
      for (let z = COAST + 10; z < CP.z1; z += 16) lib.lamp && (lib.lamp(CP.x0 + 1, 0.25, z), lib.lamp(CP.x1 - 1, 0.25, z));
      AF.addLabel(CP.name, (CP.x0 + CP.x1) / 2, CP.z1 - 6, 'place');
      AF.addLabel('Cargo Docks', 200, 195, 'place');
    }

    // ---- CRANES
    const craneYellow = c(0xd8a830, { jitter: 0.3 }), craneRed = c(0xa83a2a, { jitter: 0.3 }), cab = c(0x2f5a6a);
    // gantry crane on the quay (x traverse 160..240): two A-legs spanning z 196..209, beam at 16 m, trolley + hook
    {
      const m = new AF.Model(24, 80, 70), leg = craneYellow;
      for (const x of [0, 20]) { m.line(x + 2, 0, 4, x + 2, 64, 4, leg, 1.4); m.line(x + 2, 0, 56, x + 2, 64, 56, leg, 1.4); m.line(x + 2, 8, 4, x + 2, 56, 56, leg, 0.6); m.line(x + 2, 8, 56, x + 2, 56, 4, leg, 0.6); m.box(x, 0, 0, x + 4, 3, 60, C.iron); }
      m.box(0, 62, 0, 24, 68, 70, leg); for (let z = 2; z < 70; z += 6) m.box(1, 68, z, 23, 70, z + 1, leg);
      m.box(4, 56, 58, 20, 62, 68, cab); m.box(5, 58, 57, 19, 61, 58, C.glass);
      m.box(10, 70, 30, 14, 74, 34, C.red); m.box(11, 74, 31, 13, 76, 33, C.bulb);
      const g = AF.meshModel(m, { vs: 1 / 4, anchor: [0.5, 0, 0] });
      const gantry = AF.modelMesh(g); gantry.position.set(200, 0.25, 194); AF.scene.add(gantry);
      const trolley = AF.modelMesh(AF.meshModel(new AF.Model(12, 6, 12).box(0, 0, 0, 12, 6, 12, craneRed), { vs: 1 / 4, anchor: [0.5, 0, 0.5] })); gantry.add(trolley); trolley.position.set(0, 15.5, 8);
      const cableG = AF.meshModel(new AF.Model(1, 16, 1).box(0, 0, 0, 1, 16, 1, C.iron), { vs: 1 / 4, anchor: [0.5, 1, 0.5] });
      const cable = AF.modelMesh(cableG); trolley.add(cable);
      const box = AF.modelMesh(AF.meshModel(new AF.Model(10, 8, 20).box(0, 0, 0, 10, 8, 20, C.crate[3]).box(0, 7, 0, 10, 8, 20, C.iron), { vs: 1 / 4, anchor: [0.5, 1, 0.5] }));
      trolley.add(box);
      L.gantry = gantry;
      dyn.push({ x: 200, z: 200, r: 260, update(dt, t) {
        const u = (Math.sin(t * 0.04) + 1) / 2; gantry.position.x = 165 + u * 70;
        const zz = 3 + (Math.sin(t * 0.13) + 1) * 5; trolley.position.z = zz;
        const drop = 4 + (Math.sin(t * 0.21) + 1) * 3.5; cable.scale.y = drop / 4; cable.position.y = 0; box.position.y = -drop;
      } });
    }
    // two jib cranes on Pier 9 that slew with a crate hanging on the hook
    const jib = (x, z, ph, col, cyc) => {
      const base = new AF.Model(24, 56, 24);
      base.box(2, 0, 2, 22, 3, 22, C.iron);
      for (const [a, b] of [[4, 4], [18, 4], [4, 18], [18, 18]]) base.line(a + 1, 3, b + 1, 12, 44, 12, col, 0.9);
      base.box(9, 40, 9, 15, 56, 15, col);
      put(geo(base, 1 / 4, [0.5, 0, 0.5]), x, 0.25, z, 0, true);
      const hm = new AF.Model(20, 20, 110);
      hm.box(4, 0, 0, 16, 12, 16, cab); hm.box(5, 4, 16, 15, 10, 17, C.glass); hm.box(3, 12, 0, 17, 14, 18, col);
      for (let z2 = 10; z2 < 110; z2++) { const hh = Math.max(2, 10 - z2 * 0.07); hm.box(8, 12, z2, 12, 12 + hh, z2 + 1, (z2 % 6 < 1) ? C.iron : col); }
      hm.box(8, 14, 0, 12, 20, 4, C.iron); hm.box(9, 20, 100, 11, 22, 104, C.bulb);
      const head = AF.modelMesh(AF.meshModel(hm, { vs: 1 / 4, anchor: [0.5, 0, 0.15] })); head.position.set(x, 14.25, z); AF.scene.add(head);
      const cable = AF.modelMesh(AF.meshModel(new AF.Model(1, 16, 1).box(0, 0, 0, 1, 16, 1, C.iron), { vs: 1 / 4, anchor: [0.5, 1, 0.5] }));
      const crate = AF.modelMesh(AF.meshModel(new AF.Model(8, 7, 8).box(0, 0, 0, 8, 7, 8, C.crate[(ph * 3 | 0) % 5]).box(0, 6, 0, 8, 7, 8, C.iron), { vs: 1 / 4, anchor: [0.5, 1, 0.5] }));
      head.add(cable); head.add(crate); cable.position.set(0, 3, 22); crate.position.set(0, 3, 22);
      if (cyc) dyn.push(cyc(head, cable, crate));
      else dyn.push({ x, z, r: 220, update(dt, t) { head.rotation.y = Math.sin(t * 0.05 + ph) * 1.4 + ph; const d = 5 + (Math.sin(t * 0.17 + ph) + 1) * 3.5; cable.scale.y = d / 4; crate.position.y = 3 - d; crate.rotation.y = Math.sin(t * 0.3) * 0.2; } });
      return head;
    };
    // v2 r2: the red jib works a real 45 s cycle — hook down into the Meridian Star's after hold, a cargo net of crates comes
    //        up, slews over Pier 9, lands on the deck (where it stays until the stevedores clear it), hook goes back.
    const jx = CP.x1 - 4, jz = COAST + 44, holdP = [CP.x1 + 6.2, 212 + 60 * 0.58 - 2.5], landP = [CP.x1 - 13, COAST + 50];
    const netM = new AF.Model(12, 12, 12), netR = c(0x8a6a44, { jitter: 0.5, solid: false });
    for (let y = 0; y < 11; y++) for (let x = 0; x < 12; x++) for (let z = 0; z < 12; z++) { const d = Math.hypot(x - 5.5, z - 5.5) - (y > 7 ? (y - 7) * 1.4 : 0); if (d > 6) continue; const edge = d > 4.8 || y === 0; if (edge && ((x + y + z) & 1)) netM.set(x, y, z, netR); else if (!edge && y < 8) netM.set(x, y, z, C.crate[(x >> 2) + (z >> 2) & 3]); }
    netM.box(5, 10, 5, 7, 12, 7, C.iron);
    const netG = AF.meshModel(netM, { vs: 1 / 8, anchor: [0.5, 1, 0.5] });
    const landed = AF.modelMesh(netG); landed.position.set(landP[0], 0.25 + 1.5, landP[1]); landed.visible = false; AF.scene.add(landed);
    for (const [ox, oz] of [[-1.8, 0.4], [-1.6, -1.4]]) { const pile = AF.modelMesh(netG); pile.position.set(landP[0] + ox, 0.25 + 1.5, landP[1] + oz); pile.rotation.y = ox; AF.scene.add(pile); }
    const angTo = (p) => Math.atan2(p[0] - jx, p[1] - jz), rHold = Math.hypot(holdP[0] - jx, holdP[1] - jz), rLand = Math.hypot(landP[0] - jx, landP[1] - jz);
    const aHold = angTo(holdP), aLand = angTo(landP);
    const smooth = (k) => k <= 0 ? 0 : k >= 1 ? 1 : k * k * (3 - 2 * k);
    const craneCycle = (head, cable, crate) => {
      crate.geometry = netG; if (crate.children[0]) crate.remove(crate.children[0]);
      const st = { phase: '', u: 0 }; L.craneCycle = st;
      return { x: jx, z: jz, r: 260, update(dt, t) {
        const u = ((t % 45) + 45) % 45; st.u = u;
        let a, reach, drop, loaded;
        if (u < 4) { a = aHold; reach = rHold; drop = 4 + 11.5 * smooth(u / 4); loaded = false; st.phase = 'lower-hold'; }
        else if (u < 7) { a = aHold; reach = rHold; drop = 15.5; loaded = false; st.phase = 'hook-on'; }
        else if (u < 12) { a = aHold; reach = rHold; drop = 15.5 - 12.5 * smooth((u - 7) / 5); loaded = true; st.phase = 'lift'; }
        else if (u < 22) { const k = smooth((u - 12) / 10); a = aHold + (aLand - aHold) * k; reach = rHold + (rLand - rHold) * k; drop = 3; loaded = true; st.phase = 'slew'; }
        else if (u < 27) { a = aLand; reach = rLand; drop = 3 + 12.5 * smooth((u - 22) / 5); loaded = true; st.phase = 'land'; }
        else if (u < 31) { a = aLand; reach = rLand; drop = 15.5 - 11.5 * smooth((u - 27) / 4); loaded = false; st.phase = 'raise'; }
        else { const k = smooth((u - 31) / 12); a = aLand + (aHold - aLand) * k; reach = rLand + (rHold - rLand) * k; drop = 4; loaded = false; st.phase = 'return'; }
        head.rotation.y = a; cable.position.z = reach; crate.position.z = reach;
        cable.scale.y = drop / 4; crate.position.y = 3 - drop; crate.visible = loaded;
        crate.rotation.y = Math.sin(t * 0.4) * 0.15; crate.rotation.x = st.phase === 'slew' ? Math.sin(t * 1.3) * 0.05 : 0;
        landed.visible = u >= 27 && u < 44;
      } };
    };
    L.jibs = [jib(CP.x0 + 4, COAST + 22, 0.6, craneYellow), jib(jx, jz, 2.4, craneRed, craneCycle)];
    for (const [x, z, yaw] of [[landP[0] + 1.6, landP[1] - 1.2, -Math.PI / 2], [landP[0] - 0.4, landP[1] + 2.0, Math.PI], [landP[0] + 2.2, landP[1] + 1.0, -Math.PI / 2]]) AF.addSpot({ building: null, x, y: 0.25, z, yaw, kind: 'work' });

    // =============================================================== CARGO SHIPS (black hull + red boot-top, white superstructure, banded funnel)
    const ship = (len, beam, name, bandC, funnelC, hullC) => {
      const VS = 0.25, NL = Math.round(len / VS), NB = Math.round(beam / VS), HH = 32, m = new AF.Model(NB + 2, 96, NL);
      const cx = (NB + 2) / 2, deck = c(0x9a7a58), white = C.white, boot = C.red, hull = hullC || C.black;
      for (let z = 0; z < NL; z++) {
        const t = z / (NL - 1), bow = t > 0.82 ? 1 - (t - 0.82) / 0.18 : 1, stern = t < 0.05 ? 0.75 + t * 5 : 1;
        const half = NB / 2 * Math.pow(Math.max(0.03, bow), 0.5) * stern;
        const sheer = HH + Math.round(t > 0.85 ? (t - 0.85) * 40 : t < 0.1 ? (0.1 - t) * 20 : 0);
        for (let y = 0; y < sheer; y++) {
          const hw = half * (0.72 + 0.28 * Math.min(1, y / 10));
          for (let x = Math.floor(cx - hw); x < Math.ceil(cx + hw); x++) {
            const edge = x <= cx - hw + 1 || x >= cx + hw - 1 || y === 0; if (!edge && y < sheer - 1) continue;
            let col = y < 12 ? boot : y === sheer - 1 && !edge ? deck : hull;
            if (edge && y === 22 && z % 10 < 2 && t > 0.1 && t < 0.8) col = C.warm;
            if (y >= sheer - 2 && edge) col = white;
            if (y === sheer - 1 && edge && z % 12 === 0) col = C.bulb;
            m.set(x, y, z, col);
          }
        }
      }
      // superstructure aft (bridge) + midship house
      const aft0 = Math.round(NL * 0.08), aft1 = Math.round(NL * 0.3), x0 = Math.round(cx - NB * 0.38), x1 = Math.round(cx + NB * 0.38);
      for (let lvl = 0; lvl < 4; lvl++) {
        const y0 = HH + lvl * 12, ins = lvl * 2;
        m.box(x0 + ins, y0, aft0 + ins, x1 - ins, y0 + 11, aft1 - ins, white);
        m.box(x0 + ins - 1, y0 + 11, aft0 + ins - 1, x1 - ins + 1, y0 + 12, aft1 - ins + 1, deck);
        for (let z = aft0 + ins + 2; z < aft1 - ins - 2; z += 4) { m.set(x0 + ins, y0 + 6, z, (z + lvl) % 3 ? C.warm : C.win); m.set(x1 - ins - 1, y0 + 6, z, (z + lvl) % 3 ? C.win : C.warm); }
        for (let x = x0 + ins + 2; x < x1 - ins - 2; x += 3) m.set(x, y0 + 6, aft1 - ins - 1, lvl === 3 ? C.glass : C.win);
      }
      m.box(x0 - 3, HH + 36, aft1 - 12, x1 + 3, HH + 44, aft1 - 6, white); m.box(x0 - 3, HH + 39, aft1 - 6, x1 + 3, HH + 42, aft1 - 5, C.glass);   // bridge wings
      // funnel
      const fz = Math.round((aft0 + aft1) / 2) - 4;
      m.box(cx - 6, HH + 48, fz, cx + 6, HH + 64, fz + 12, funnelC); m.box(cx - 6, HH + 54, fz, cx + 6, HH + 58, fz + 12, bandC); m.box(cx - 6, HH + 62, fz, cx + 6, HH + 64, fz + 12, C.black);
      // lifeboats on davits
      for (const sx of [x0 - 4, x1]) { m.box(sx, HH + 14, aft0 + 6, sx + 4, HH + 18, aft0 + 22, white); m.box(sx, HH + 14, aft0 + 6, sx + 4, HH + 15, aft0 + 22, C.red); }
      // derricks / masts + hatches forward
      const holds = [0.42, 0.58, 0.72];
      for (const h of holds) { const z = Math.round(NL * h); m.box(cx - NB * 0.3, HH, z - 10, cx + NB * 0.3, HH + 3, z + 10, c(0x4a5a4a)); m.box(cx - 1, HH, z + 11, cx + 1, HH + 40, z + 13, C.cream); m.line(cx, HH + 38, z + 12, cx + NB * 0.3, HH + 8, z - 4, C.cream); m.line(cx, HH + 38, z + 12, cx - NB * 0.3, HH + 8, z - 4, C.cream); }
      m.box(cx - 1, HH, NL - 20, cx + 1, HH + 48, NL - 18, C.cream); m.set(cx, HH + 48, NL - 19, C.bulb);
      // name on the bow
      const tm = AF.textModel(name, C.white, { pad: 0 });
      for (let i = 0; i < tm.w; i++) for (let j = 0; j < 7; j++) if (tm.get(i, j, 0)) { const z = NL - 30 - tm.w + i; const t = z / (NL - 1), bow = t > 0.82 ? 1 - (t - 0.82) / 0.18 : 1, hw = NB / 2 * Math.pow(Math.max(0.03, bow), 0.5); m.set(Math.floor(cx - hw) , 24 + j, z, C.white); }
      return AF.meshModel(m, { vs: VS, anchor: [0.5, 0, 0.5] });
    };
    const shipA = AF.modelMesh(ship(60, 11, 'MERIDIAN STAR', C.red, C.cream)); shipA.position.set(CP.x1 + 6.2, SEA_Y - 2.8, 242); AF.scene.add(shipA);
    const shipB = AF.modelMesh(ship(45, 9, 'ALICE GRAY', C.navy, c(0xd87a2a), c(0x2a3a4a))); shipB.position.set(CP.x0 - 5.2, SEA_Y - 2.4, 238); shipB.rotation.y = Math.PI; AF.scene.add(shipB);
    const smA = lib.smoke ? lib.smoke(6, 0xd0ccc4, 2.6, 7) : null, smB = lib.smoke ? lib.smoke(5, 0xd0ccc4, 2.2, 6) : null;
    // gull perches: mast tops + bows of both ships
    for (const [sx, sz] of [[shipA.position.x, 242 + 30 - 5], [shipA.position.x, 242 - 30 + 18], [shipB.position.x, 238 - 22 + 5]]) AF.addSpot({ building: null, x: sx, y: SEA_Y - 2.4 + 20, z: sz, yaw: 0, kind: 'gull' });
    // far steamers on the horizon (static, flat) + a harbour-mouth buoy with a blinking light
    { const fm = new AF.Model(6, 12, 40), hull = c(0x2a2e36, { jitter: 0.2 }), sup = c(0xd8d4cc, { jitter: 0.2 });
      fm.box(0, 0, 0, 6, 4, 40, hull); fm.box(1, 4, 8, 5, 7, 22, sup); fm.box(2, 7, 14, 4, 11, 17, c(0x8a3a2a)); fm.box(2, 4, 32, 4, 10, 33, hull); fm.box(2, 4, 4, 4, 9, 5, hull);
      const fg = AF.meshModel(fm, { vs: 1, anchor: [0.5, 0, 0.5], flat: true });
      for (const [x, z, ry] of [[-420, 820, 1.3], [380, 1080, -1.4], [60, 1300, 1.5]]) { const me = new THREE.Mesh(fg, AF.mat.voxel); me.position.set(x, SEA_Y - 1, z); me.rotation.y = ry; me.castShadow = false; me.frustumCulled = false; AF.scene.add(me); }
      L.steamers = 3; }
    { const bym = new AF.Model(8, 20, 8), red = c(0xc0302a); bym.box(0, 0, 0, 8, 6, 8, red); bym.box(1, 6, 1, 7, 7, 7, C.white); bym.box(3, 7, 3, 5, 16, 5, red); bym.box(2, 16, 2, 6, 17, 6, C.iron);
      const buoy = AF.modelMesh(AF.meshModel(bym, { vs: 1 / 6, anchor: [0.5, 0, 0.5] })); buoy.position.set(236, SEA_Y - 0.6, 305); AF.scene.add(buoy);
      const lampM = new THREE.MeshBasicMaterial({ color: 0xff5040 }), lamp = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 6), lampM); lamp.position.set(0, 17.6 / 6, 0); buoy.add(lamp);
      const glowM = new THREE.SpriteMaterial({ map: lib.softTex ? lib.softTex() : null, color: 0xff4030, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }), glow = new THREE.Sprite(glowM); glow.scale.set(3, 3, 1); lamp.add(glow);
      L.buoy = buoy;
      dyn.push({ x: 236, z: 305, r: 1e9, always: true, update(dt, t) { buoy.position.y = SEA_Y - 0.6 + Math.sin(t * 1.3) * 0.15; buoy.rotation.z = Math.sin(t * 1.1) * 0.08; const on = (t % 3) < 0.6; lampM.color.setHex(on ? 0xff5040 : 0x401010); glow.visible = on; glowM.opacity = 0.6 + 0.4 * ((AF.time && AF.time.night) || 0); } });
      AF.addLabel('Harbour Mouth Buoy', 236, 305, 'place'); }
    HR.ships.push({ name: 'Meridian Star', mesh: shipA, x: shipA.position.x, z: 242, len: 60 }, { name: 'Alice Gray', mesh: shipB, x: shipB.position.x, z: 238, len: 45 });
    dyn.push({ x: 130, z: 240, r: 350, update(dt, t) {
      shipA.position.y = SEA_Y - 2.8 + Math.sin(t * 0.4) * 0.05; shipA.rotation.z = Math.sin(t * 0.3) * 0.006;
      shipB.position.y = SEA_Y - 2.4 + Math.sin(t * 0.45 + 1) * 0.06; shipB.rotation.z = Math.sin(t * 0.33 + 2) * 0.008;
      smA && smA.update(dt, t, shipA.position.x, shipA.position.y + 8 + 16 + 2, 242 - 60 / 2 + 60 * 0.19, 0.6);
      smB && smB.update(dt, t, shipB.position.x, shipB.position.y + 8 + 16 + 2, 238 + 45 / 2 - 45 * 0.19, 0.5);
    } });
    AF.addLabel('Meridian Star', shipA.position.x, 242, 'place');
    for (const [sx, sz] of [[CP.x1 + 0.2, 225], [CP.x1 + 0.2, 262], [CP.x0 - 0.2, 222], [CP.x0 - 0.2, 256]]) { F(Math.min(sx, sx + (sx > CP.x1 ? 0.25 : -0.25)), 0.25, sz, Math.max(sx, sx + (sx > CP.x1 ? 0.25 : -0.25)), 0.5, sz + 0.25, C.rust); }

    // =============================================================== TUGBOATS (one moored, one working a loop, puffing)
    const tugGeo = () => {
      const m = new AF.Model(28, 48, 64), hull = c(0x2a2a2e), red = C.red, wh = C.white;
      for (let z = 0; z < 64; z++) {
        const t = z / 63, bow = t > 0.7 ? 1 - (t - 0.7) / 0.3 : 1, half = 13 * Math.pow(Math.max(0.05, bow), 0.5) * (t < 0.08 ? 0.8 + t * 2.5 : 1);
        for (let y = 0; y < 14; y++) { const hw = half * (0.65 + 0.35 * Math.min(1, y / 6)); for (let x = Math.floor(14 - hw); x < Math.ceil(14 + hw); x++) { const e = x <= 14 - hw + 1 || x >= 14 + hw - 1 || y === 0; if (!e && y < 13) continue; m.set(x, y, z, y < 5 ? red : y > 11 ? C.tyre : hull); } }
      }
      m.box(7, 14, 14, 21, 26, 42, wh); m.box(8, 20, 13, 20, 24, 43, C.glass); m.box(6, 26, 12, 22, 28, 44, C.red);
      m.box(9, 28, 30, 19, 34, 40, wh); m.box(10, 30, 40, 18, 33, 41, C.glass);
      m.box(11, 28, 18, 17, 42, 24, C.black); m.box(11, 36, 18, 17, 38, 24, C.red); m.box(11, 38, 18, 17, 39, 24, C.white);
      m.box(4, 12, 58, 24, 14, 64, C.tyre);
      return AF.meshModel(m, { vs: 1 / 8, anchor: [0.5, 0, 0.5] });
    };
    const TG = tugGeo();
    const tugA = AF.modelMesh(TG); tugA.position.set(66, SEA_Y - 0.7, 216); tugA.rotation.y = Math.PI / 2; AF.scene.add(tugA);
    const tugB = AF.modelMesh(TG); AF.scene.add(tugB);
    const tugPath = new THREE.CatmullRomCurve3([[170, 225], [240, 240], [250, 300], [180, 330], [110, 310], [60, 262], [100, 222]].map(([x, z]) => new THREE.Vector3(x, 0, z)), true, 'centripetal');
    const tugLen = tugPath.getLength(), tsm = lib.smoke ? lib.smoke(6, 0x6a6a70, 1.6, 5) : null;
    const tst = { s: 0 };
    HR.tug = { mesh: tugB, path: tugPath, st: tst, get x() { return tugB.position.x; }, get z() { return tugB.position.z; } };
    HR.tugs = [tugA, tugB];
    const tugUpd = (dt, t) => {
      tst.s = (tst.s + dt * 3.2) % tugLen;
      const u = tst.s / tugLen, p = tugPath.getPointAt(u), tg = tugPath.getTangentAt(u);
      tugB.position.set(p.x, SEA_Y - 0.7 + Math.sin(t * 1.1) * 0.08, p.z); tugB.rotation.y = Math.atan2(tg.x, tg.z); tugB.rotation.z = Math.sin(t * 0.9) * 0.03;
      tugA.position.y = SEA_Y - 0.7 + Math.sin(t * 0.9 + 2) * 0.07; tugA.rotation.z = Math.sin(t * 0.7) * 0.025;
      tsm && tsm.update(dt, t, p.x - tg.x * 1.4, SEA_Y - 0.7 + 5.4, p.z - tg.z * 1.4, 1);
    };
    tugUpd(0, 0);
    dyn.push({ x: 0, z: 0, r: 1e9, always: true, update: tugUpd });

    // =============================================================== BREAKWATER dressing + SOLACE POINT LIGHT
    {
      // iron railing posts + chain along the walkway, lamps
      for (let s = 3; s < (L.bwLen || 70) - 6; s += 2.5) {
        const p = L.bwPoint(s);
        for (const side of [-1, 1]) { const x = p.x + p.dz * side * 1.5, z = p.z - p.dx * side * 1.5; F(x, 0.5, z, x + 0.25, 1.5, z + 0.25, C.iron); }
      }
      for (let s = 8; s < (L.bwLen || 70) - 6; s += 18) { const p = L.bwPoint(s); lib.lamp && lib.lamp(p.x + p.dz * 1.2, 0.5, p.z - p.dx * 1.2); }
      // the lighthouse: 24 m white tower with red bands, gallery, lantern room, red cap
      const X = LH.x, Z = LH.z, Y0 = 0.5, TOP = 20.5;
      const whiteT = c(0xf4f0e6, { jitter: 0.2 }), redT = c(0xb82a2a, { jitter: 0.3 });
      for (let y = Y0; y < TOP; y += 0.25) {
        const r = 3.0 - (y - Y0) / (TOP - Y0) * 1.1, band = Math.floor((y - Y0) / 3.25) % 2 === 1;
        for (let a = 0; a < TAU; a += 0.25 / r / 1.2) W.setM(X + Math.cos(a) * r, y, Z + Math.sin(a) * r, band ? redT : whiteT);
        for (let a = 0; a < TAU; a += 0.25 / (r - 0.25) / 1.2) W.setM(X + Math.cos(a) * (r - 0.25), y, Z + Math.sin(a) * (r - 0.25), band ? redT : whiteT);
      }
      F(X - 0.75, Y0, Z + 2.2, X + 0.75, Y0 + 2.5, Z + 3.2, 0); F(X - 0.75, Y0, Z + 2.2, X + 0.75, Y0 + 0.25, Z + 3.2, C.stone);   // door facing the breakwater? (north)
      for (let a = 0; a < TAU; a += 0.06) { for (let r = 0; r < 2.9; r += 0.25) W.setM(X + Math.cos(a) * r, TOP, Z + Math.sin(a) * r, C.iron); W.setM(X + Math.cos(a) * 2.9, TOP + 0.25, Z + Math.sin(a) * 2.9, C.iron); if (Math.round(a * 16) % 3 === 0) W.setM(X + Math.cos(a) * 2.9, TOP + 0.5, Z + Math.sin(a) * 2.9, C.iron); W.setM(X + Math.cos(a) * 2.9, TOP + 1.0, Z + Math.sin(a) * 2.9, C.iron); }
      const lampC = AF.col(0xfff6d8, { emit: 0xfff0b0, emitK: 4, mode: 'night' });
      for (let y = TOP + 0.25; y < TOP + 3; y += 0.25) for (let a = 0; a < TAU; a += 0.1) W.setM(X + Math.cos(a) * 1.5, y, Z + Math.sin(a) * 1.5, (Math.round(a * 10) % 8 === 0) ? C.iron : C.glass);
      F(X - 0.75, TOP + 0.75, Z - 0.75, X + 0.75, TOP + 2.25, Z + 0.75, lampC);
      for (let i = 0; i < 8; i++) { const r = 1.75 - i * 0.22; for (let a = 0; a < TAU; a += 0.1) for (let rr = 0; rr <= r; rr += 0.25) W.setM(X + Math.cos(a) * rr, TOP + 3 + i * 0.25, Z + Math.sin(a) * rr, redT); }
      F(X - 0.125, TOP + 5, Z - 0.125, X + 0.125, TOP + 6, Z + 0.125, C.iron); F(X - 0.25, TOP + 5.75, Z - 0.25, X + 0.25, TOP + 6, Z + 0.25, C.gold);
      // keeper's hut on the rock
      F(X - 5, Y0, Z - 3, X - 1.5, Y0 + 3, Z + 1, whiteT); F(X - 5.25, Y0 + 3, Z - 3.25, X - 1.25, Y0 + 3.25, Z + 1.25, redT); F(X - 4.75, Y0 + 3.25, Z - 2.75, X - 1.75, Y0 + 3.5, Z + 0.75, redT);
      F(X - 5, Y0 + 1.25, Z - 1.5, X - 4.75, Y0 + 2.25, Z - 0.5, C.warm); F(X - 3.5, Y0 + 3.5, Z - 2.5, X - 3, Y0 + 4.5, Z - 2, C.brick);
      HR.lighthouse = { x: X, y: TOP + 1.5, z: Z };
      AF.addLight({ x: X, y: TOP + 1.5, z: Z, color: 0xfff0c0, intensity: 2.5, range: 30, kind: 'sign' });
      AF.addLabel(LH.name, X, Z, 'building');
      AF.addLabel('Breakwater', 282, 232, 'place');
      // rotating beam: two long additive cones from the lantern
      const beamMat = new THREE.MeshBasicMaterial({ color: 0xfff2c8, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, forceSinglePass: true, fog: false });
      const cg = new THREE.ConeGeometry(4.5, 120, 16, 1, true); cg.translate(0, -60, 0); cg.rotateZ(Math.PI / 2);
      const beam = new THREE.Group(); beam.position.set(X, TOP + 1.5, Z); AF.scene.add(beam);
      const b1 = new THREE.Mesh(cg, beamMat), b2 = new THREE.Mesh(cg, beamMat); b2.rotation.y = Math.PI; b1.renderOrder = b2.renderOrder = 6; b1.frustumCulled = b2.frustumCulled = false;
      b1.rotation.z = -0.03; b2.rotation.z = 0.03; beam.add(b1, b2);
      L.lhBeam = beam;
      dyn.push({ x: X, z: Z, r: 1e9, always: true, update(dt, t) { beam.rotation.y -= dt * 0.7; const n = (AF.time && AF.time.night) || 0; beamMat.opacity = 0.11 * n; beam.visible = n > 0.05; } });
    }

    // =============================================================== WAREHOUSE BLOCK + CANNERY (hb-warehouses x 173..232, z 88..147)
    {
      warehouse(173, 88, 205, 108, 13, C.brick, 'SOLACE CANNING CO', { face: 'n', tank: true, signBg: C.teal, signFg: C.cream });
      warehouse(209, 88, 232, 110, 10, C.brickB, 'ROPE WORKS', { face: 'n' });
      warehouse(173, 125, 204, 147, 11, C.brickS, 'NETS + TACKLE', { face: 's' });
      warehouse(209, 122, 232, 147, 14, C.brickD, 'BAYSIDE STORAGE', { face: 's', tank: true });
      // cannery chimney (tall brick stack with a white band + name)
      const CX = 199, CZ = 114;
      for (let y = 0.25; y < 26; y += 0.25) { const r = 1.6 - y * 0.02; const band = y > 22 && y < 23; for (let a = 0; a < TAU; a += 0.12) W.setM(CX + Math.cos(a) * r, y, CZ + Math.sin(a) * r, band ? C.white : (Math.floor(y * 4) % 6 ? C.brick : C.brickD)); }
      for (let a = 0; a < TAU; a += 0.1) W.setM(CX + Math.cos(a) * 1.4, 26, CZ + Math.sin(a) * 1.4, C.iron);
      AF.addChimney(CX, 26.5, CZ); AF.addChimney(CX + 0.3, 26.5, CZ + 0.2);
      F(CX - 2.5, 0.25, CZ - 2.5, CX + 2.5, 1.5, CZ + 2.5, C.brickD);
      // courtyard: carts, crates, a delivery truck bay
      crateStack(176, 112, 4, 2, 2, 81); barrels(186, 112, 8, 13); crateStack(214, 113, 3, 3, 3, 91); sacks(222, 114, 12);
      for (const [x, z] of [[190, 116], [218, 118]]) AF.addSpot({ building: null, x, y: 0.25, z, yaw: 0, kind: 'work' });
      AF.addLabel('Solace Canning Co.', 189, 98, 'building');
    }
    // =============================================================== FREIGHT YARD (hb-yard x 248..292, z 88..147): brick depot, coal pile, ice house, gantry
    {
      warehouse(252, 90, 290, 108, 10, C.brick, 'COAL + ICE', { face: 's' });
      W.eachCol(250, 112, 292, 147, (bx, bz, i) => { W.C[i] = ((bx >> 3) + (bz >> 3)) & 1 ? C.concrete : C.concreteD; });
      // coal pile (voxel heap)
      for (let x = 256; x < 272; x += 0.25) for (let z = 118; z < 132; z += 0.25) { const d = Math.hypot((x - 264) / 8, (z - 125) / 7); if (d > 1) continue; const h = Math.round((1 - d * d) * 16 + hash(Math.floor(x * 4), Math.floor(z * 4)) * 2) * 0.25; if (h > 0) F(x, 0.25, z, x + 0.25, 0.25 + h, z + 0.25, hash(Math.floor(x * 3), Math.floor(z * 3)) < 0.3 ? C.coalL : C.coal); }
      // gantry over the coal pile
      for (const x of [254, 274]) for (const z of [116, 134]) F(x, 0.25, z, x + 0.5, 8, z + 0.5, C.rust);
      F(254, 8, 116, 274.5, 8.75, 116.5, C.rust); F(254, 8, 134, 274.5, 8.75, 134.5, C.rust); F(263, 8.75, 116, 264, 9.5, 134.5, C.rust);
      F(263, 5.5, 124, 265, 7.5, 126, C.iron); F(263.5, 7.5, 124.5, 264.5, 8.75, 125.5, C.iron);
      // ice house: white insulated box with a loading platform + blocks of ice
      F(276, 0.25, 116, 290, 6, 132, C.white); F(275.75, 6, 115.75, 290.25, 6.5, 132.25, C.teal);
      F(276, 1.25, 124, 276.25, 4.5, 128, C.slat); F(273, 0.25, 122, 276, 1.25, 130, C.concrete);
      for (let i = 0; i < 6; i++) F(273.25 + (i % 2) * 1.2, 1.25, 122.5 + Math.floor(i / 2) * 2.2, 274.25 + (i % 2) * 1.2, 2.0, 124 + Math.floor(i / 2) * 2.2, C.ice);
      lib.wallText && lib.wallText('ICE', C.navy, 280.5, 3.0, 132, 's');
      crateStack(252, 138, 6, 2, 3, 101); barrels(272, 138, 12, 17);
      for (const [x, z] of [[270, 122], [262, 136]]) AF.addSpot({ building: null, x, y: 0.25, z, yaw: 0, kind: 'work' });
      AF.addLabel('Freight Yard', 270, 125, 'place');
    }
    L.hbEastMs = Math.round(performance.now() - t0);
  });

  // ------------------------------------------------------------ ROUND 2 SHOWCASE: chasing bulbs, THE SKY JUMP tower (60 m), running lights
  // LIB.chaser(parent, pts[x,y,z,..], seq[], o): an InstancedMesh of little HDR bulbs that chase in sequence at night
  //   (o.K = pattern length, o.on = lit slots per K, o.speed = steps/s, o.pal = [[r,g,b]..] night colours, o.pi = per-bulb palette index)
  const chaser = (parent, pts, seq, o = {}) => {
    const n = pts.length / 3; if (!n) return null;
    const s = o.size || 0.2, g = new THREE.BoxGeometry(s, s, s);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const im = new THREE.InstancedMesh(g, mat, n), m4 = new THREE.Matrix4();
    for (let i = 0; i < n; i++) { m4.makeTranslation(pts[i * 3], pts[i * 3 + 1], pts[i * 3 + 2]); im.setMatrixAt(i, m4); }
    const col = new Float32Array(n * 3); im.instanceColor = new THREE.InstancedBufferAttribute(col, 3);
    im.castShadow = false; im.receiveShadow = false; im.computeBoundingSphere && im.computeBoundingSphere();
    parent.add(im);
    const K = o.K || 4, ON = o.on ?? 3, SP = o.speed || 8, pal = o.pal || [[4.2, 3.0, 1.5]], pi = o.pi || null, day = o.day || [0.78, 0.72, 0.56];
    const st = { step: -1, nt: -1 };
    const upd = (t) => {
      const nt = o.always ? 1 : ((AF.time && AF.time.night) || 0), step = Math.floor(t * SP);
      if (step === st.step && Math.abs(nt - st.nt) < 0.02) return;
      st.step = step; st.nt = nt;
      for (let i = 0; i < n; i++) {
        const p = pal[pi ? pi[i] % pal.length : 0], on = (((seq[i] - step) % K) + K) % K < ON;
        const k = on ? 1 : 0.07;
        for (let j = 0; j < 3; j++) col[i * 3 + j] = day[j] * (1 - nt) + p[j] * k * nt;
      }
      im.instanceColor.needsUpdate = true;
    };
    upd(0);
    return { im, upd };
  };
  LIB().chaser = chaser;
  const WARM = [4.4, 3.1, 1.5], RED = [4.6, 1.1, 0.6], TEAL = [0.8, 3.6, 3.3], PINK = [4.2, 1.2, 2.6];

  AF.onBuild('harbour-showcase', 306, () => {
    const t0 = performance.now();
    const c = (hex, o = {}) => AF.col(hex, Object.assign({ jitter: 0.35, edge: 0.7 }, o));
    const lib = LIB();

    // ---- 1. the Big Wheel: chasing rim lights + radial pulses up the spokes (children of the rotating wheel mesh)
    const FW = L.ferris;
    if (FW && FW.wheel) {
      const R = FW.WR + 0.12, pts = [], seq = [], sp = [], ss = [], spi = [];
      for (const x of [-1.34, 1.34]) for (let i = 0; i < 144; i++) { const a = i / 144 * TAU; pts.push(x, Math.sin(a) * R, Math.cos(a) * R); seq.push(i); }
      FW.rimChase = chaser(FW.wheel, pts, seq, { K: 6, on: 4, speed: 12, pal: [WARM], size: 0.24 });
      for (const x of [-1.3, 1.3]) for (let k = 0; k < 24; k++) { const a = k / 24 * TAU; for (let j = 0; j < 13; j++) { const r = 3.2 + j * 1.3; sp.push(x, Math.sin(a) * r, Math.cos(a) * r); ss.push(j); spi.push(k % 3); } }
      FW.spokeChase = chaser(FW.wheel, sp, ss, { K: 9, on: 3, speed: 7, pal: [WARM, RED, TEAL], pi: spi, size: 0.2 });
      dyn.push({ x: FW.WX, z: FW.WZ, r: 500, update(dt, t) { FW.rimChase.upd(t); FW.spokeChase.upd(t); } });
    }

    // ---- 2. the Sea Serpent: running lights along both safety rails (the train of light chases the train)
    const CO = L.coaster;
    if (CO && CO.curve) {
      const p = new THREE.Vector3(), tg = new THREE.Vector3(), pts = [], seq = [], pi = [];
      let i = 0;
      for (let s = 0; s < CO.LEN; s += 1.25, i++) {
        const u = s / CO.LEN; CO.curve.getPointAt(u, p); CO.curve.getTangentAt(u, tg);
        const nl = Math.hypot(tg.x, tg.z) || 1, nx = -tg.z / nl, nz = tg.x / nl, h = CO.hAt(u);
        for (const w of [-1.12, 1.12]) { pts.push(p.x + nx * w, h + 1.0, p.z + nz * w); seq.push(i); pi.push((i >> 3) % 2); }
      }
      CO.chase = chaser(AF.scene, pts, seq, { K: 10, on: 6, speed: 9, pal: [WARM, PINK], pi, size: 0.2 });
      dyn.push({ x: -270, z: 234, r: 500, update(dt, t) { CO.chase.upd(t); } });
    }

    // ---- 2b. festoon bulb strings across the boardwalk (points laid out by 14-harbour): a slow twinkle at night
    const FE = L.bwFestoon;
    if (FE && FE.pts.length) { FE.chase = chaser(AF.scene, FE.pts, FE.seq, { K: 7, on: 6, speed: 2.5, pal: [WARM, [4.4, 2.4, 1.0]], pi: FE.seq.map((q) => q % 2), size: 0.16 }); dyn.push({ x: -220, z: 195, r: 300, update(dt, t) { FE.chase.upd(t); } }); }

    // ---- 2d. carousel valance + Pleasure Pier arch: chasing marquee bulbs
    {
      const pts = [], seq = [], pi = [];
      for (let i = 0; i < 112; i++) { const a = i / 112 * TAU; pts.push(-195 + Math.cos(a) * 9.75, 4.85, 190 + Math.sin(a) * 9.75); seq.push(i); pi.push(0); }
      const PPr = PIER.pleasure; let q = 0;
      for (let y = 0.6; y < 5.2; y += 0.45, q++) { pts.push(PPr.x0 + 0.62, y, COAST + 1.62); seq.push(q); pi.push(1); pts.push(PPr.x1 - 0.62, y, COAST + 1.62); seq.push(q); pi.push(1); }
      for (let x = PPr.x0 + 0.62, j = 0; x < (PPr.x0 + PPr.x1) / 2; x += 0.45, j++) { pts.push(x, 5.55, COAST + 1.62); seq.push(q + j); pi.push(1); pts.push(PPr.x0 + PPr.x1 - x, 5.55, COAST + 1.62); seq.push(q + j); pi.push(1); }
      const ch = chaser(AF.scene, pts, seq, { K: 5, on: 3, speed: 8, pal: [WARM, [4.4, 3.4, 1.9]], pi, size: 0.2 });
      if (ch) dyn.push({ x: -210, z: 200, r: 400, update(dt, t) { ch.upd(t); } });
      L.marquee = ch;
    }

    if (L.arcadeBulbs) { const AB = L.arcadeBulbs, ch = chaser(AF.scene, AB.pts, AB.seq, { K: 6, on: 4, speed: 7, pal: [WARM, PINK, TEAL], pi: AB.seq.map((q) => q % 3), size: 0.14, always: true }); if (ch) dyn.push({ x: -274, z: 187, r: 120, update(dt, t) { ch.upd(t); } }); }

    // ---- 2c. HARBOUR DAYS: the Meridian Star "dressed overall" — signal flags from the stem over the masts to the stern,
    //       an ensign at the stern, a house flag at the foremast, and her deck lights / portholes on the water at night
    const SA = HR.ships && HR.ships[0] && HR.ships[0].mesh, SB = HR.ships && HR.ships[1] && HR.ships[1].mesh;
    if (SA && AF.makeBunting) {
      const pts = [[0, 9.9, 29.6], [0, 20.1, 25.3], [0, 18.1, 16.3], [0, 18.1, 7.8], [0, 18.1, -1.7], [0, 19.3, -14.2], [0, 24.3, -18], [0, 9.2, -29.6]];
      for (let i = 0; i < pts.length - 1; i++) AF.makeBunting(pts[i], pts[i + 1], { shape: 'signal', parent: SA, spacing: 0.75, size: 0.62 });
      if (AF.makeFlag) { AF.makeFlag({ parent: SA, x: 0, y: 12.4, z: -29.9, w: 2.2, h: 1.4, design: 'harbour', vane: false, yaw: -Math.PI / 2 }); AF.makeFlag({ parent: SA, x: 0, y: 21.4, z: 25.3, w: 1.4, h: 0.9, design: 'burgee', colors: [0xc0392b, 0xf4f1ea], vane: false, yaw: -Math.PI / 2 }); }
    }
    if (SB && AF.makeBunting) {
      const pts = [[0, 9.6, 22.4], [0, 20.1, 17.5], [0, 18.1, 13], [0, 18.1, 6.5], [0, 18.1, -0.5], [0, 19.2, -10.5], [0, 24.2, -13.5], [0, 8.8, -22.4]];
      for (let i = 0; i < pts.length - 1; i++) AF.makeBunting(pts[i], pts[i + 1], { shape: 'signal', parent: SB, spacing: 0.75, size: 0.55 });
    }
    // whistle: every 24 s a white burst of steam shoots up from the Meridian Star's whistle (front of the funnel) and billows away
    if (SA && lib.softTex) {
      const puffs = [];
      for (let i = 0; i < 7; i++) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: lib.softTex(), color: 0xffffff, transparent: true, depthWrite: false, opacity: 0 })); sp.renderOrder = 5; sp.visible = false; SA.add(sp); puffs.push(sp); }
      dyn.push({ x: SA.position.x, z: SA.position.z, r: 420, update(dt, t) {
        const u = ((t + 5) % 24);
        for (let i = 0; i < 7; i++) { const sp = puffs[i], k = u - i * 0.18; if (k < 0 || k > 4) { sp.visible = false; continue; }
          sp.visible = true; const e = 1 - Math.exp(-k * 1.6); sp.position.set(Math.sin(i * 2.1) * 0.4 + e * 1.2, 24.6 + e * 5 + i * 0.25, -15.2 + e * 2.5);
          const sc = 0.8 + e * 3.2; sp.scale.set(sc, sc, 1); sp.material.opacity = 0.75 * (1 - k / 4); }
      } });
      L.whistle = puffs;
    }
    if (AF.water2 && AF.water2.cands) for (const sh of (HR.ships || [])) for (const dz of [-18, -6, 6, 18]) AF.water2.cands.push({ x: sh.mesh.position.x + (sh.mesh.position.x > 130 ? 6 : -6), y: 3, z: sh.mesh.position.z + dz, color: 0xffd08a, intensity: 0.8 });

    // ---- 3. THE SKY JUMP: a 60 m red-and-white steel parachute tower at the west end of the boardwalk.
    //      Lattice legs (aviation bands), a cupola hub at 50 m, a 12-arm umbrella crown with a bulb ring, cables to the
    //      ground, 6 striped chutes with riders that are winched up and drop, and running lights that climb the legs at night.
    {
      const TX = -292, TZ = 202.5, VS = 0.25, CX = 42;
      const red = c(0xc23a2e, { jitter: 0.3, metal: 0.3, rough: 0.55 }), redD = c(0x9a2c24, { jitter: 0.3, metal: 0.3, rough: 0.6 }), wht = c(0xf2eee4, { jitter: 0.2 });
      const iron = c(0x2e3034, { jitter: 0.2, metal: 0.6, rough: 0.5 }), gold = c(0xd8a83a, { metal: 0.9, rough: 0.3 }), cream = c(0xf3ead6, { jitter: 0.2 });
      const winC = AF.col(0x3a4a58, { emit: 0xffd08a, emitK: 1.6, mode: 'night', jitter: 0.1, edge: 0.1 });
      const m = new AF.Model(84, 252, 84);
      const hw = (y) => 16 - 12 * y / 200;
      const band = (y) => (Math.floor(y / 24) % 2 ? wht : red);
      // legs, with red / white aviation bands
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        for (let y = 0; y <= 200; y += 0.5) { const h = hw(y), x = CX + sx * h, z = CX + sz * h; m.sphere(x, y, z, 1.05, band(y)); }
      }
      // horizontal rings every 4 m + X-bracing on the four faces
      for (let y = 8; y <= 192; y += 16) {
        const h = hw(y), h2 = hw(Math.min(200, y + 16));
        for (const [a, b] of [[[-1, -1], [1, -1]], [[1, -1], [1, 1]], [[1, 1], [-1, 1]], [[-1, 1], [-1, -1]]]) {
          m.line(CX + a[0] * h, y, CX + a[1] * h, CX + b[0] * h, y, CX + b[1] * h, redD, 0.55);
          if (y + 16 <= 200) { m.line(CX + a[0] * h, y, CX + a[1] * h, CX + b[0] * h2, y + 16, CX + b[1] * h2, redD); m.line(CX + b[0] * h, y, CX + b[1] * h, CX + a[0] * h2, y + 16, CX + a[1] * h2, redD); }
        }
      }
      // centre elevator mast + car
      m.box(CX - 1, 0, CX - 1, CX + 1, 200, CX + 1, iron);
      // gallery + hub house (cupola) at 50 m
      m.box(CX - 11, 196, CX - 11, CX + 11, 198, CX + 11, iron);
      for (let x = CX - 11; x < CX + 11; x++) for (const z of [CX - 11, CX + 10]) { m.set(x, 199, z, iron); if (x % 3 === 0) m.set(x, 198, z, iron); m.set(z, 199, x, iron); if (x % 3 === 0) m.set(z, 198, x, iron); }
      m.box(CX - 8, 198, CX - 8, CX + 8, 214, CX + 8, cream);
      for (let k = -6; k <= 4; k += 5) for (const f of [CX - 8, CX + 7]) { m.box(CX + k, 203, f, CX + k + 3, 209, f + 1, winC); m.box(f, 203, CX + k, f + 1, 209, CX + k + 3, winC); }
      m.box(CX - 9, 214, CX - 9, CX + 9, 216, CX + 9, red);
      for (let i = 0; i < 6; i++) m.box(CX - 7 + i, 216 + i * 2, CX - 7 + i, CX + 7 - i, 218 + i * 2, CX + 7 - i, i % 2 ? wht : red);   // stepped deco cap
      m.box(CX - 1, 228, CX - 1, CX + 1, 246, CX + 1, iron); m.sphere(CX, 247.5, CX, 1.8, gold);
      // the umbrella crown: 12 arms from the hub to a 10 m bulb ring, stays from the cap, cables to the ground
      const tips = [];
      for (let i = 0; i < 12; i++) {
        const a = i / 12 * TAU + TAU / 24, tx = CX + Math.cos(a) * 40, tz = CX + Math.sin(a) * 40;
        m.line(CX, 210, CX, tx, 203, tz, red, 0.7); m.line(CX, 226, CX, tx, 204, tz, redD);
        m.box(Math.round(tx) - 1, 200, Math.round(tz) - 1, Math.round(tx) + 1, 203, Math.round(tz) + 1, iron);
        if (i % 2 === 0) m.line(tx, 199, tz, tx, 6, tz, iron);
        tips.push([(tx - CX) * VS, (tz - CX) * VS, a]);
      }
      for (let a = 0; a < TAU; a += 0.012) { const x = CX + Math.cos(a) * 40, z = CX + Math.sin(a) * 40; m.set(Math.floor(x), 203, Math.floor(z), wht); m.set(Math.floor(x), 204, Math.floor(z), red); }
      // landing ring at the foot of each cable (shock frame)
      for (let i = 0; i < 12; i += 2) { const [lx, lz] = tips[i], x = CX + lx / VS, z = CX + lz / VS; for (let aa = 0; aa < TAU; aa += 0.2) m.set(Math.floor(x + Math.cos(aa) * 3), 6, Math.floor(z + Math.sin(aa) * 3), iron); }
      const tower = AF.modelMesh(m, { vs: VS, anchor: [0.5, 0, 0.5] }); tower.position.set(TX, 0.25, TZ); tower.castShadow = true; AF.scene.add(tower);
      // collision + a planked deck with a kerb + ticket booth + queue
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) F(TX + sx * 4 - 0.5, 0.25, TZ + sz * 4 - 0.5, TX + sx * 4 + 0.5, 3, TZ + sz * 4 + 0.5, red);
      const plank = c(0xa8865c, { jitter: 0.6 }), plankD = c(0x8a6a46, { jitter: 0.6 });
      for (let x = TX - 6; x < TX + 6; x += 0.25) for (let z = TZ - 6; z < Math.min(TZ + 6, COAST - 0.5); z += 0.25) {
        const d = Math.max(Math.abs(x + 0.125 - TX), Math.abs(z + 0.125 - TZ), (Math.abs(x + 0.125 - TX) + Math.abs(z + 0.125 - TZ)) * 0.72);
        if (d < 5.6 && W.getM(x, 0.25, z) === 0) F(x, 0.25, z, x + 0.25, 0.375, z + 0.25, d > 5.2 ? red : (Math.floor(z * 4) % 2 ? plank : plankD));
      }
      const tb = new AF.Model(16, 26, 12);
      tb.box(0, 0, 0, 16, 16, 12, red); tb.box(2, 8, 11, 14, 14, 12, AF.col('glass')); tb.box(1, 7, 11, 15, 8, 13, gold);
      tb.box(-1, 16, -1, 17, 18, 13, wht); for (let x = 0; x < 16; x += 2) tb.set(x, 18, 12, AF.col(0xfff2c0, { emit: 0xffe0a0, emitK: 3.2, mode: 'night' }));
      tb.box(3, 18, 4, 13, 24, 8, red); tb.box(6, 24, 5, 10, 26, 7, gold);
      put(geo(tb, 1 / 8), TX, 0.375, TZ - 7.2, 2, true);
      AF.addSpot({ building: null, x: TX, y: 0.375, z: TZ - 7.9, yaw: 0, kind: 'counter' });
      for (let i = 0; i < 6; i++) AF.addSpot({ building: null, x: TX + 1.6 + (i % 2) * 0.5, y: 0.25, z: TZ - 8.6 - i * 0.85, yaw: 0, kind: 'stand' });
      if (lib.sign) {
        const bulbTxt = AF.col(0xfff2c0, { emit: 0xffd070, emitK: 2.8, mode: 'always' });
        put(lib.sign('SKY JUMP', bulbTxt, red, 1 / 8), TX, 7.0, TZ - 3.95, 2, false);
        put(lib.sign('SKY JUMP', bulbTxt, red, 1 / 8), TX, 7.0, TZ + 3.95, 0, false);
        put(lib.sign('25 CENTS  THRILL OF A LIFETIME', c(0x1f3552), cream, 1 / 16), TX, 2.1, TZ - 8.05, 2, false);
      }
      AF.addLight({ x: TX, y: 51, z: TZ, color: 0xffd890, intensity: 2.4, range: 28, kind: 'sign' });
      AF.addLight({ x: TX, y: 4, z: TZ - 6, color: 0xffd08a, intensity: 1.3, range: 12, kind: 'sign' });
      AF.addLabel('The Sky Jump', TX, TZ, 'building');
      if (AF.makeFlag) AF.makeFlag({ x: TX, y: 0.25 + 62.2, z: TZ, w: 2.4, h: 1.5, design: 'solace' });
      // running lights: up the four legs (bulb every 1.5 m, seq = height), round the crown ring, and along the arms
      const lp = [], ls = [], rp = [], rs = [], rpi = [];
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) for (let y = 4; y <= 196; y += 6) { const h = hw(y) * VS + 0.32; lp.push(sx * h, y * VS, sz * h); ls.push(y / 6 | 0); }
      for (let i = 0; i < 96; i++) { const a = i / 96 * TAU, r = 10.15; rp.push(Math.cos(a) * r, 204.5 * VS - 0.2, Math.sin(a) * r); rs.push(i); rpi.push(0); }
      for (const [x, z] of tips) for (let k = 1; k < 8; k++) { const f = k / 8; rp.push(x * f, (210 - 7 * f) * VS + 0.3, z * f); rs.push(k * 3); rpi.push(1); }
      const legC = chaser(tower, lp, ls, { K: 8, on: 3, speed: 6, pal: [WARM], size: 0.3 });
      const ringC = chaser(tower, rp, rs, { K: 6, on: 4, speed: 10, pal: [WARM, RED], pi: rpi, size: 0.3 });
      // six chutes (vs 1/8): striped canopy, shroud lines, a bench seat with two riders; winched up slowly, then they drop
      const chuteGeo = (ca, cb, seed) => {
        const g = new AF.Model(36, 36, 36), cc = 18;
        for (let x = 0; x < 36; x++) for (let z = 0; z < 36; z++) {
          const dx = x + 0.5 - cc, dz = z + 0.5 - cc, d = Math.hypot(dx, dz); if (d > 16.5) continue;
          const top = 27 + Math.round(8 * Math.sqrt(Math.max(0, 1 - (d / 16.5) ** 2))), gore = Math.floor((Math.atan2(dz, dx) + Math.PI) / TAU * 12) % 2;
          for (let y = top - 1; y <= top; y++) g.set(x, y, z, gore ? ca : cb);
          if (d > 15.2) g.set(x, 26, z, gore ? cb : ca);
        }
        for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; g.line(cc + Math.cos(a) * 15.5, 26, cc + Math.sin(a) * 15.5, cc + Math.cos(a) * 5, 6, cc + Math.sin(a) * 1.5, iron); }
        g.box(11, 2, 15, 25, 4, 21, c(0x7a5a3a)); g.box(11, 4, 20, 25, 9, 21, c(0x7a5a3a)); g.box(11, 0, 15, 12, 2, 21, iron); g.box(24, 0, 15, 25, 2, 21, iron);
        const coatC = [c(0x1f3552), c(0x7a2a2a), c(0x3a5a3a), c(0xe8dcc0)], skin = c(0xe8b890, { jitter: 0.2 });
        for (const [px, k] of [[14, 0], [21, 1]]) { const cc2 = coatC[(seed + k) % 4]; g.box(px - 2, 4, 16, px + 2, 11, 20, cc2); g.box(px - 1, 11, 16, px + 2, 14, 19, skin); g.box(px - 2, 14, 16, px + 2, 15, 19, coatC[(seed + k + 2) % 4]); g.box(px - 3, 10, 17, px - 2, 16, 18, cc2); g.box(px + 2, 10, 17, px + 3, 16, 18, cc2); g.box(px - 1, 0, 14, px + 1, 5, 16, c(0x2a2a2e)); }
        return AF.meshModel(g, { vs: 1 / 8, anchor: [0.5, 1, 0.5] });
      };
      const CC = [[0xc23a2e, 0xf6f2ea], [0x2a4a9a, 0xf2d040], [0xf2d040, 0xc23a2e], [0x2f8a86, 0xf6f2ea], [0xe86aa0, 0xf6f2ea], [0x1f3552, 0xe8a030]];
      const chutes = [];
      for (let i = 0; i < 6; i++) {
        const [x, z] = tips[i * 2], mm = AF.modelMesh(chuteGeo(c(CC[i][0], { solid: false }), c(CC[i][1], { solid: false }), i));
        mm.castShadow = true; mm.position.set(TX + x, 12, TZ + z); AF.scene.add(mm);
        chutes.push({ m: mm, x: TX + x, z: TZ + z, ph: i / 6 + (i % 2) * 0.07 });
      }
      const Y0 = 6.2, Y1 = 50.2, PER = 44;
      const chuteY = (u) => u < 0.12 ? Y0 : u < 0.72 ? Y0 + (Y1 - Y0) * (0.5 - 0.5 * Math.cos((u - 0.12) / 0.6 * Math.PI)) : u < 0.8 ? Y1 : u < 0.9 ? Y1 - (Y1 - Y0) * Math.pow((u - 0.8) / 0.1, 1.35) : Y0;
      const updT = (dt, t) => {
        for (const ch of chutes) {
          const u = ((t / PER + ch.ph) % 1 + 1) % 1, y = chuteY(u);
          ch.m.position.y = y; ch.m.rotation.y = Math.sin(t * 0.3 + ch.ph * 9) * 0.5;
          const drop = u > 0.8 && u < 0.9; ch.m.rotation.z = drop ? Math.sin(t * 5 + ch.ph) * 0.05 : Math.sin(t * 0.8 + ch.ph * 5) * 0.02;
          ch.m.scale.y = drop ? 0.94 : 1;
        }
        legC && legC.upd(t); ringC && ringC.upd(t);
      };
      updT(0, 0);
      dyn.push({ x: TX, z: TZ, r: 520, update: updT });
      L.skyJump = { tower, chutes, legC, ringC, x: TX, z: TZ };
    }
    L.hbShowMs = Math.round(performance.now() - t0);
  });

  // ------------------------------------------------------------ ROUND 2: the liner SS SOLACE QUEEN at anchor in the west roads
  //   (x -280..-170, z ~305, clear of the ferry + puttering-boat loops): black hull, red boot-top, 4 white tiers, 3 raked buff
  //   funnels with black tops (smoke), 2 masts, lifeboats, rows of portholes that light at night, dressed overall, whistle.
  AF.onBuild('harbour-liner', 307, () => {
    const c = (hex, o = {}) => AF.col(hex, Object.assign({ jitter: 0.3, edge: 0.6 }, o));
    const blk = c(0x1c1e22, { jitter: 0.2 }), boot = c(0xa8302a), wht = c(0xf4f0e6, { jitter: 0.15 }), deck = c(0xb89a70), buff = c(0xe0b870), fblk = c(0x1a1a1c);
    const port = AF.col(0x2a3440, { emit: 0xffd08a, emitK: 1.8, mode: 'night', jitter: 0.1, edge: 0.1 }), win = AF.col(0x34404c, { emit: 0xffc47a, emitK: 1.5, mode: 'night', jitter: 0.1, edge: 0.1 });
    const boatC = c(0xf6f2ea), mastC = c(0xd8c8a0), goldC = c(0xd8a83a, { metal: 0.8, rough: 0.3 });
    const NL = 220, NB = 32, cx = NB / 2 + 1, HH = 26, m = new AF.Model(NB + 2, 100, NL);
    for (let z = 0; z < NL; z++) {
      const t = z / (NL - 1), bow = t > 0.8 ? 1 - (t - 0.8) / 0.2 : 1, stern = t < 0.06 ? 0.7 + t * 5 : 1;
      const half = NB / 2 * Math.pow(Math.max(0.03, bow), 0.55) * stern, sheer = HH + Math.round(t > 0.85 ? (t - 0.85) * 30 : 0);
      for (let y = 0; y < sheer; y++) {
        const hw = half * (0.75 + 0.25 * Math.min(1, y / 8));
        for (let x = Math.floor(cx - hw); x < Math.ceil(cx + hw); x++) {
          const edge = x <= cx - hw + 1 || x >= cx + hw - 1 || y === 0; if (!edge && y < sheer - 1) continue;
          let col = y < 8 ? boot : (y === sheer - 1 && !edge) ? deck : blk;
          if (edge && y >= sheer - 2) col = wht;
          if (edge && (y === 15 || y === 19) && z % 3 === 0 && t > 0.08 && t < 0.86) col = port;
          m.set(x, y, z, col);
        }
      }
    }
    // superstructure tiers
    const tiers = [[26, 34, 40, 170, 2], [34, 42, 50, 160, 3], [42, 50, 62, 148, 4], [50, 56, 120, 146, 6]];
    for (const [y0, y1, z0, z1, ins] of tiers) {
      m.box(ins, y0, z0, NB + 2 - ins, y1, z1, wht); m.box(ins - 1, y1 - 1, z0 - 1, NB + 3 - ins, y1, z1 + 1, deck);
      for (let z = z0 + 2; z < z1 - 2; z += 2) { const w = (z >> 1) % 7 === 0 ? port : win; m.set(ins, y0 + 3, z, w); m.set(NB + 1 - ins, y0 + 3, z, w); }
      for (let z = z0; z < z1; z += 4) { m.set(ins - 1, y1, z, wht); m.set(NB + 2 - ins, y1, z, wht); }
    }
    m.box(4, 50, 140, NB - 2, 58, 150, wht); m.box(3, 53, 149, NB - 1, 56, 151, c(0x2a3440, { jitter: 0.1 }));   // bridge
    // lifeboats on davits along the boat deck
    for (let z = 66; z < 142; z += 12) for (const sx of [1, NB - 1]) { m.box(sx, 44, z, sx + 3, 47, z + 9, boatC); m.box(sx, 44, z, sx + 3, 45, z + 9, boot); }
    // three raked funnels (buff, black tops)
    for (const fz of [70, 96, 122]) for (let y = 56; y < 90; y++) { const rk = Math.round((y - 56) * 0.25); m.box(cx - 5, y, fz - 7 - rk, cx + 5, y + 1, fz + 7 - rk, y > 84 ? fblk : buff); }
    // masts + a stay line + cargo hatches fore and aft
    m.box(cx - 1, 26, 186, cx + 1, 92, 188, mastC); m.box(cx - 1, 26, 22, cx + 1, 84, 24, mastC); m.box(cx - 8, 76, 186, cx + 8, 77, 188, mastC);
    for (const hz of [176, 30]) m.box(cx - 7, 26, hz - 6, cx + 7, 28, hz + 6, c(0x4a5a4a));
    const tm = AF.textModel('SOLACE QUEEN', goldC, { pad: 0 });
    for (let i = 0; i < tm.w; i++) for (let j = 0; j < 7; j++) if (tm.get(i, j, 0)) { const z = NL - 26 - tm.w + i; const t = z / (NL - 1), hw = NB / 2 * Math.pow(Math.max(0.03, t > 0.8 ? 1 - (t - 0.8) / 0.2 : 1), 0.55); m.set(Math.floor(cx - hw), 17 + j, z, goldC); m.set(Math.ceil(cx + hw) - 1, 17 + j, NL - 1 - (z - (NL - 26 - tm.w)) - 26 - (NL - 26 - tm.w) + (NL - 26 - tm.w), goldC); }
    const VS = 0.5, liner = AF.modelMesh(m, { vs: VS, anchor: [0.5, 0, 0.5] });
    liner.position.set(-225, SEA_Y - 3.6, 306); liner.rotation.y = Math.PI / 2; liner.castShadow = true; AF.scene.add(liner);
    const lib = LIB();
    if (AF.makeBunting) { const P3 = [[0, 16.2, 55], [0, 46, 38], [0, 45, 12.5], [0, 45, -0.5], [0, 45, -13.5], [0, 42, -44], [0, 13.5, -54.5]]; for (let i = 0; i < P3.length - 1; i++) AF.makeBunting(P3[i], P3[i + 1], { shape: 'signal', parent: liner, spacing: 1.1, size: 0.9 }); }
    if (AF.makeFlag) AF.makeFlag({ parent: liner, x: 0, y: 16.5, z: -54.6, w: 3.2, h: 2.0, design: 'harbour', vane: false, yaw: -Math.PI / 2 });
    const smk = lib.smoke ? [0, 1, 2].map(() => lib.smoke(5, 0xd8d4cc, 3.4, 9)) : [];
    const funW = [70, 96, 122].map((fz) => (fz - NL / 2) * VS - 8.5 * 0.25 * VS * 4);
    dyn.push({ x: -225, z: 306, r: 700, update(dt, t) {
      liner.position.y = SEA_Y - 3.6 + Math.sin(t * 0.35) * 0.06; liner.rotation.z = Math.sin(t * 0.27) * 0.004;
      for (let i = 0; i < smk.length; i++) smk[i].update(dt, t + i * 1.7, -225 + funW[i], SEA_Y - 3.6 + 45.5, 306, 0.45);
    } });
    HR.ships.push({ name: 'Solace Queen', mesh: liner, x: -225, z: 306, len: 110 });
    AF.addLabel('SS Solace Queen', -225, 306, 'place');
    if (AF.water2 && AF.water2.cands) for (const dx of [-40, -20, 0, 20, 40]) AF.water2.cands.push({ x: -225 + dx, y: 6, z: 297, color: 0xffd08a, intensity: 0.9 });
    L.liner = liner;
  });
  // ------------------------------------------------------------ ROUND 2: a navy-grey cruiser, the HARBOUR DAYS guardship, dressed overall
  //   for HARBOUR DAYS at anchor south-west of the liner (-305, 366, bow west): raked bow, 2 twin turrets fore + 1 aft, a stepped
  //   bridge tower, tripod mast, 2 funnels, a rainbow of signal flags stem -> mast -> funnels -> stern.
  AF.onBuild('harbour-navy', 308, () => {
    const c = (hex, o = {}) => AF.col(hex, Object.assign({ jitter: 0.25, edge: 0.6 }, o));
    const grey = c(0x8a9096, { jitter: 0.2 }), greyD = c(0x6a7076, { jitter: 0.2 }), greyL = c(0xa8aeb2, { jitter: 0.2 }), boot = c(0x3a2a2a), deckC = c(0x9a8a70), gun = c(0x4a5056);
    const port = AF.col(0x2a3440, { emit: 0xffd08a, emitK: 1.6, mode: 'night', jitter: 0.1, edge: 0.1 });
    const NL = 180, NB = 20, cx = NB / 2 + 1, HH = 16, m = new AF.Model(NB + 2, 80, NL);
    for (let z = 0; z < NL; z++) {
      const t = z / (NL - 1), bow = t > 0.7 ? 1 - (t - 0.7) / 0.3 : 1, half = NB / 2 * Math.pow(Math.max(0.04, bow), 0.6) * (t < 0.05 ? 0.8 + t * 4 : 1), sheer = HH + Math.round(t > 0.75 ? (t - 0.75) * 24 : 0);
      for (let y = 0; y < sheer; y++) { const hw = half * (0.7 + 0.3 * Math.min(1, y / 6)); for (let x = Math.floor(cx - hw); x < Math.ceil(cx + hw); x++) {
        const edge = x <= cx - hw + 1 || x >= cx + hw - 1 || y === 0; if (!edge && y < sheer - 1) continue;
        m.set(x, y, z, y < 5 ? boot : (y === sheer - 1 && !edge) ? deckC : (edge && y === 11 && z % 4 === 0 && t > 0.2 && t < 0.7) ? port : grey); } }
    }
    const turret = (z0, y0, dir) => { m.box(cx - 4, y0, z0, cx + 4, y0 + 4, z0 + 9, greyD); m.box(cx - 3, y0 + 4, z0 + 1, cx + 3, y0 + 5, z0 + 8, grey);
      for (const gx of [cx - 2, cx + 1]) { if (dir > 0) m.box(gx, y0 + 2, z0 + 9, gx + 1, y0 + 3, z0 + 22, gun); else m.box(gx, y0 + 2, z0 - 13, gx + 1, y0 + 3, z0, gun); } };
    turret(118, HH + 1, 1); turret(100, HH + 5, 1); m.box(cx - 3, HH, 100, cx + 3, HH + 5, 110, grey); turret(30, HH, -1);
    for (let l = 0; l < 5; l++) m.box(cx - 6 + l, HH + l * 5, 72 + l * 2, cx + 6 - l, HH + l * 5 + 5, 96 - l, l % 2 ? greyL : grey);
    m.box(cx - 5, HH + 22, 84, cx + 5, HH + 24, 92, c(0x2a3440)); m.box(cx - 7, HH + 20, 90, cx + 7, HH + 21, 93, greyD);
    m.line(cx, HH + 25, 84, cx, HH + 58, 82, greyD, 0.6); m.line(cx - 4, HH + 25, 76, cx, HH + 52, 82, greyD); m.line(cx + 4, HH + 25, 76, cx, HH + 52, 82, greyD); m.box(cx - 2, HH + 50, 80, cx + 2, HH + 53, 84, greyL);
    for (const fz of [56, 44]) m.box(cx - 3, HH, fz, cx + 3, HH + 16, fz + 7, greyD);
    m.box(cx - 4, HH, 36, cx + 4, HH + 6, 62, grey); m.box(cx - 1, HH, 6, cx + 1, HH + 22, 8, greyD);
    const ship = AF.modelMesh(m, { vs: 0.5, anchor: [0.5, 0, 0.5] });
    ship.position.set(-305, SEA_Y - 2.2, 366); ship.rotation.y = -Math.PI / 2; ship.castShadow = true; AF.scene.add(ship);
    if (AF.makeBunting) { const P3 = [[0, 11, 44.8], [0, 37.5, -4], [0, 16.4, -15.3], [0, 16.4, -21.3], [0, 19.3, -41.5], [0, 8.6, -44.8]]; for (let i = 0; i < P3.length - 1; i++) AF.makeBunting(P3[i], P3[i + 1], { shape: 'signal', parent: ship, spacing: 0.9, size: 0.75 }); }
    if (AF.makeFlag) AF.makeFlag({ parent: ship, x: 0, y: 11.2, z: -44.6, w: 2.4, h: 1.5, design: 'harbour', vane: false, yaw: -Math.PI / 2 });
    dyn.push({ x: -305, z: 366, r: 700, update(dt, t) { ship.position.y = SEA_Y - 2.2 + Math.sin(t * 0.42 + 1) * 0.07; ship.rotation.z = Math.sin(t * 0.31) * 0.006; } });
    HR.ships.push({ name: 'Guardship', mesh: ship, x: -305, z: 366, len: 90 });
    AF.addLabel('Guardship (Harbour Days)', -305, 366, 'place');
    L.navy = ship;
  });
  AF.test('harbour: liner at anchor', () => ({ ok: !!L.liner && !!L.navy, info: (L.liner ? 'SS Solace Queen at ' + L.liner.position.x.toFixed(0) + ',' + L.liner.position.z.toFixed(0) : 'no liner') + (L.navy ? ' + guardship' : ' no guardship') }));

  AF.test('harbour: quay edge walkable (Harbour Blvd sidewalk -> coping)', () => {
    const b = { x: 16.5, y: 0.25, z: 176, vy: 0, r: 0.3, h: 1.7, onGround: true };
    for (let i = 0; i < 800; i++) { AF.moveBody(b, 0, 0.05, 1 / 60); if (b.z > 209.3) break; }
    return { ok: b.z > 208.8 && b.y >= 0.2, info: `reached z ${b.z.toFixed(2)} y ${b.y}` };
  });
  AF.test('harbour: warehouse doors walkable (Shed 7, Bonded Stores)', () => {
    const out = [];
    for (const d of (L.whDoors || [])) { const b = { x: d.x, y: 0.25, z: d.z - 2, vy: 0, r: 0.3, h: 1.7, onGround: true }; for (let i = 0; i < 160; i++) AF.moveBody(b, 0, 0.05, 1 / 60); out.push(d.id + ' ' + (b.z - d.z).toFixed(1)); if (b.z < d.z + 3) return { ok: false, info: out.join(' | ') }; }
    return { ok: (L.whDoors || []).length === 2, info: out.join(' | ') };
  });
  AF.test('harbour: round-2 life (puttering boat moves, buoy, steamers, gull perches)', () => {
    const pb = L.puttBoat; if (!pb || !L.buoy) return { ok: false, info: 'missing boat/buoy' };
    const x0 = pb.bm.position.x, z0 = pb.bm.position.z; L.hbUpdate && L.hbUpdate(1, 30);
    const d = Math.hypot(pb.bm.position.x - x0, pb.bm.position.z - z0), gulls = AF.spots.filter((s) => s.kind === 'gull').length;
    return { ok: d > 0.5 && gulls >= 10 && L.steamers === 3, info: `boat moved ${d.toFixed(1)} gull spots ${gulls}` };
  });
  AF.test('harbour: Sky Jump chutes + chasing bulbs', () => {
    const S = L.skyJump; if (!S) return { ok: false, info: 'no sky jump' };
    const y0 = S.chutes[0].m.position.y; L.hbUpdate && L.hbUpdate(0.5, 17.3);
    const y1 = S.chutes[0].m.position.y, fw = L.ferris && L.ferris.rimChase, co = L.coaster && L.coaster.chase;
    return { ok: y1 !== y0 && !!fw && !!co && S.chutes.length === 6, info: `chute y ${y0.toFixed(1)}->${y1.toFixed(1)} rim bulbs ${fw ? fw.im.count : 0} coaster bulbs ${co ? co.im.count : 0} build ${L.hbShowMs} ms` };
  });
  AF.test('harbour: ships, tugs, lighthouse registered', () => {
    const h = AF.harbour || {};
    return { ok: (h.ships || []).length >= 2 && !!h.tug && !!h.ferry && !!h.lighthouse && !!L.lhBeam, info: `ships ${(h.ships || []).length} tugs ${(h.tugs || []).length} lighthouse ${h.lighthouse && h.lighthouse.y}` };
  });
}

} catch (e) { AF.partError('15-harbour-2.js', e); }

