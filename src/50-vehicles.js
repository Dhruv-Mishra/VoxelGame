// ================================================================ 50-vehicles.js
try {
// ===== 50-vehicles: 1936 car models, instanced AI traffic on a lane graph, static kerb parking, night lamps, 'drive' mode  (OWNER: transport) =====
const VP = AF.PLAN;
const VV = AF.vehicles = AF.vehicles || { cars: [], player: null, models: {}, parked: [], ai: [] };
const CVS = 0.1;                      // car model voxel size (m)

// ---------------------------------------------------------------- palette (defined once, lazily inside build)
let K = null;
const kcols = () => {
  if (K) return K;
  const c = (h, o) => AF.col(h, Object.assign({ jitter: 0.12, edge: 0.3 }, o || {}));
  K = {
    chrome: c(0xd2d8de, { jitter: 0.25, edge: 0.5, sat: 0.6, metal: 1, rough: 0.18 }), chromeD: c(0x8b9197, { jitter: 0.2, edge: 0.4, metal: 0.8, rough: 0.35 }),
    tyre: c(0x1c1c1e, { jitter: 0.3, edge: 0.3, rough: 0.95 }), white: c(0xf4f1e8, { jitter: 0.05 }), well: c(0x141313, { jitter: 0.1, edge: 0 }),
    glass: AF.col(0xa9c9d6, { glass: true, jitter: 0.05, edge: 0 }), dark: c(0x26272a, { jitter: 0.2 }), seam: c(0x2c2a28, { jitter: 0.1, edge: 0 }),
    head: AF.col(0xfff6dc, { emit: 0xfff0c0, emitK: 4, mode: 'night', jitter: 0, edge: 0.2 }),
    tail: AF.col(0xd3261e, { emit: 0xff2010, emitK: 2.2, mode: 'night', jitter: 0, edge: 0.2 }),
    amber: AF.col(0xf0a22a, { emit: 0xffa020, emitK: 1.5, mode: 'night', jitter: 0, edge: 0.2 }),
    beacon: AF.col(0xff3020, { emit: 0xff2010, emitK: 3.5, mode: 'always', jitter: 0, edge: 0 }),
    plate: c(0xf2d25a, { jitter: 0.05 }), plateT: c(0x2a3050, { jitter: 0 }),
    seatR: c(0xa8322c, { jitter: 0.35 }), seatT: c(0xc9a878, { jitter: 0.35 }), seatG: c(0x4f7a5a, { jitter: 0.35 }), seatB: c(0x3d4f78, { jitter: 0.35 }),
    floor: c(0x3a3432, { jitter: 0.3 }), dash: c(0x5a3d2a, { jitter: 0.2 }), wheel: c(0xe8e0c8, { jitter: 0.1 }),
    wood: c(0xa8703c, { jitter: 0.45 }), woodL: c(0xd9b27a, { jitter: 0.3 }), woodD: c(0x6e4526, { jitter: 0.4 }),
    crate: c(0xb88a50, { jitter: 0.5 }), apple: c(0xc7302a, { jitter: 0.4 }), pumpkin: c(0xe07a22, { jitter: 0.4 }), stem: c(0x4d6a2a),
    canvas: c(0xd8c9a0, { jitter: 0.3 }), gold: c(0xd8b04a, { jitter: 0.1, sat: 1.1, metal: 1, rough: 0.3 }), black: c(0x151516, { jitter: 0.15 }),
    red: c(0xb8241e, { jitter: 0.15 }), blue: c(0x2d4f9a, { jitter: 0.15 }), pink: c(0xf3a6b8, { jitter: 0.1 }), mint: c(0xa7dcc8, { jitter: 0.1 }),
    cone: c(0xd09a52, { jitter: 0.5 }), scoop: c(0xf6b6c8, { jitter: 0.3 }), scoopW: c(0xfbf1d8, { jitter: 0.2 }), cherry: c(0xd0202a),
    yellowBus: c(0xf2b41c, { jitter: 0.1 }), stopRed: c(0xc01e1e), silver: c(0xbfc3c6, { jitter: 0.2 }), hose: c(0xd9c9a0, { jitter: 0.3 }),
    ladder: c(0xcfcfcf, { jitter: 0.2, edge: 0.5 }), rung: c(0x9a7a4a, { jitter: 0.3 }), milk: c(0xf6f4ec, { jitter: 0.05 }), bottle: AF.col(0xf8f8f2, { jitter: 0.1 }),
    skin: c(0xe2b08c, { jitter: 0.1 }), skin2: c(0xb07a52, { jitter: 0.1 }), hat: c(0x5a4a3a, { jitter: 0.2 }), hat2: c(0x2c3440),
    shirt: c(0x5d7fa8, { jitter: 0.3 }), shirt2: c(0xb24d4a, { jitter: 0.3 }), shirt3: c(0xe6d8b0, { jitter: 0.3 }), hair: c(0x5a3a22), scarf: c(0xe8c84a),
    taxiSign: AF.col(0xfff2b0, { emit: 0xffe080, emitK: 2, mode: 'night', jitter: 0, edge: 0.3 }),
    domeLit: AF.col(0xfff0c8, { emit: 0xffe6a0, emitK: 2.6, mode: 'night', jitter: 0, edge: 0.2 }),
    flag: c(0xc8221c, { jitter: 0.05 }), checkerB: c(0x141414, { jitter: 0.05, edge: 0 }), checkerW: c(0xf2ecd8, { jitter: 0.05, edge: 0 }),
    whiteRim: c(0xf1eee2, { jitter: 0.04, edge: 0.1 }), hub: c(0xd8dde2, { jitter: 0.1, metal: 1, rough: 0.2 }),
  };
  // body paints (two-tone pairs)
  const p = (h) => c(h, { jitter: 0.06, edge: 0.3, rough: 0.32 });   // glossy enamel paint (sky reflections)
  K.paint = {
    mint: p(0x8fd1bd), cherry: p(0xc4332c), cream: p(0xf0e3c0), powder: p(0x8fb5d6), teal: p(0x3a9e9a), butter: p(0xf0d075), coral: p(0xe68f84),
    forest: p(0x3f6a4b), black: p(0x202124), burgundy: p(0x7b2533), tan: p(0xc7a574), taxi: p(0xf2c12a), white: p(0xf3efe4), fire: p(0xc0231d),
    navy: p(0x28406a), lilac: p(0xb7a4cf), orange: p(0xe08a3a), sage: p(0x9db48a), grey: p(0x8f9398),
    maroon: p(0x5e1a22), bottle: p(0x1e4a32), jet: p(0x17181a), tanP: p(0xa88c62), greyP: p(0x62676d), olive: p(0x4a5238), dove: p(0xb9b4a6),
    cabYel: p(0xe8b820), gull: p(0x6fa3c8), beacon: p(0x6e2230), dairy: p(0xf2efe4), bread: p(0xefe2c4), deco: p(0xe8dcb8), busGreen: p(0x1f5a3a), busCream: p(0xeee0bc), coal: p(0x2a2a2c), ice: p(0x9fd0e0),
    goldP: c(0xd4a84a, { jitter: 0.05, edge: 0.3, metal: 0.7, rough: 0.25 }), silverP: c(0xc8ccd2, { jitter: 0.05, edge: 0.3, metal: 0.8, rough: 0.2 }), pinkP: p(0xff6fb0), lilacP: p(0xb68ae0),
    cash: p(0x2f7a4a), racer: p(0xc8221c), sunY: p(0xf2c21b), midnight: p(0x1c2440),
  };
  return K;
};

// ---------------------------------------------------------------- model helpers
const blitText = (m, str, fg, side, zStart, y0, xFace) => {   // side +1: +x face (reads toward -z), -1: -x face (reads toward +z)
  const tm = AF.textModel(str, fg, { pad: 0, depth: 1 });
  for (let i = 0; i < tm.w; i++) for (let j = 0; j < tm.h; j++) {
    if (!tm.get(i, j, 0)) continue;
    const z = side > 0 ? zStart - i : zStart + i;
    m.set(xFace, y0 + j, z, fg);
  }
  return tm.w;
};
// outermost body voxel at (y,z) on a side -> recolour
const sideSet = (m, y, z, col, side, depth = 1) => {
  if (side > 0) { for (let x = m.w - 1; x >= 0; x--) if (m.get(x, y, z)) { for (let d = 0; d < depth; d++) if (m.get(x - d, y, z)) m.set(x - d, y, z, col); return true; } }
  else { for (let x = 0; x < m.w; x++) if (m.get(x, y, z)) { for (let d = 0; d < depth; d++) if (m.get(x + d, y, z)) m.set(x + d, y, z, col); return true; } }
  return false;
};
const frontSet = (m, x, y, col, front) => {   // front: outermost at max z; else min z
  if (front) { for (let z = m.d - 1; z >= 0; z--) if (m.get(x, y, z)) { m.set(x, y, z, col); return z; } }
  else { for (let z = 0; z < m.d; z++) if (m.get(x, y, z)) { m.set(x, y, z, col); return z; } }
  return -1;
};

// ---------------------------------------------------------------- the car builder
// spec: {L, W, H, belt, bottom, axles:[zr,zf], wr (wheel radius voxels), cab:{z0,z1,r0,r1,top,b}, ...style flags}
function buildCar(S, pal) {
  const k = kcols();
  const L = S.L, Wd = S.W, H = S.H, bot = S.bottom ?? 2, belt = S.belt;
  const m = new AF.Model(Wd, H, L);
  const A = pal.a, B = pal.b ?? pal.a, trim = pal.trim ?? k.chrome;
  const beltAt = (z) => belt - (z >= L - 2 ? 1 : 0) - (!S.fins && z <= 1 ? 1 : 0) - (S.noseDrop && z > L - 12 ? 1 : 0);
  // --- lower body
  for (let z = 1; z < L - 1; z++) {
    const bt = beltAt(z);
    for (let y = bot; y < bt; y++) {
      let ins = 0;
      if (y === bt - 1) ins++;
      if (y === bot) ins++;
      if (z <= 2 || z >= L - 3) ins++;
      if ((z === 1 || z === L - 2) && (y === bot || y === bt - 1)) ins++;
      const col = (S.twoTone && y >= bt - 2) ? B : A;
      for (let x = ins; x < Wd - ins; x++) m.set(x, y, z, col);
    }
  }
  // tail fins
  if (S.fins) for (let z = 1; z < 12; z++) { const h = z < 3 ? 2 : z < 8 ? 2 : 1; for (let y = belt; y < belt + h - (z > 9 ? 1 : 0); y++) { m.set(1, y, z, B); m.set(Wd - 2, y, z, B); } }
  // --- cabin
  const cab = S.cab;
  const inCab = (x, y, z) => {
    if (!cab || y < belt || y >= cab.top) return false;
    const t = (y - belt) / Math.max(1, cab.top - 1 - belt);
    const zr = Math.round(cab.z0 + (cab.r0 - cab.z0) * t), zf = Math.round(cab.z1 + (cab.r1 - cab.z1) * t);
    const ins = 1 + (y === cab.top - 1 ? 1 : 0);
    return x >= ins && x < Wd - ins && z >= zr && z <= zf;
  };
  if (cab && !S.open) {
    const bp = cab.b ?? Math.round((cab.z0 + cab.z1) / 2);
    for (let y = belt; y < cab.top; y++) for (let z = 0; z < L; z++) for (let x = 0; x < Wd; x++) {
      if (!inCab(x, y, z)) continue;
      const sx = !inCab(x - 1, y, z) || !inCab(x + 1, y, z), sz = !inCab(x, y, z - 1) || !inCab(x, y, z + 1), top = !inCab(x, y + 1, z);
      if (!(sx || sz || top)) continue;
      let col;
      const xEdge = !inCab(x - 1, y, z) || !inCab(x + 1, y, z) || !inCab(x - 2, y, z) || !inCab(x + 2, y, z);
      if (top) col = B;
      else if (y === belt) col = sx ? trim : A;
      else if (sz) col = xEdge ? B : k.glass;
      else col = (z === bp || (cab.b2 != null && z === cab.b2)) ? B : k.glass;
      if (S.wagonRear && sz && z < cab.z0 + 2 && !sx && y > belt + 1) col = k.glass;
      m.set(x, y, z, col);
    }
  }
  // --- wheel arches (wheel meshes sit in them)
  const ay = S.wr;
  for (let ai = 0; ai < S.axles.length; ai++) {
    const za = S.axles[ai], R = S.wr + 1.3;
    for (let z = Math.floor(za - R - 1); z <= za + R + 1; z++) for (let y = 0; y < ay + R + 1; y++) {
      const d = Math.hypot(z + 0.5 - za, y + 0.5 - ay);
      if (d > R) continue;
      const skirt = S.skirts && ai === 0 && y >= ay - 1;
      for (let x = 0; x < Wd; x++) {
        const outer = x < 4 || x >= Wd - 4;
        if (outer && !skirt) m.set(x, y, z, 0);
        else if ((x === 4 || x === Wd - 5) && m.get(x, y, z)) m.set(x, y, z, k.well);
      }
    }
  }
  // --- interior: carve + seats + dash + steering wheel
  if (cab && !S.noInterior) {
    const zr = cab.z0 + 1, zf = cab.z1 - 1;
    for (let z = zr; z < zf; z++) for (let y = bot + 2; y < belt + (S.open ? 1 : 0); y++) for (let x = 2; x < Wd - 2; x++) m.set(x, y, z, 0);
    for (let z = zr; z < zf; z++) for (let x = 2; x < Wd - 2; x++) m.set(x, bot + 1, z, k.floor);
    const seat = pal.seat ?? k.seatR;
    const benches = S.benches || [zf - 9, zr + 2];
    for (const sz of benches) {
      if (sz < zr || sz + 4 > zf) continue;
      for (let x = 3; x < Wd - 3; x++) { for (let z = sz; z < sz + 4; z++) for (let y = bot + 2; y < bot + 4; y++) m.set(x, y, z, seat); for (let y = bot + 4; y < belt + 2; y++) m.set(x, y, sz, seat); }
      for (let x = 3; x < Wd - 3; x += 3) m.set(x, bot + 4, sz + 3, k.white);   // piping
    }
    // dash
    for (let x = 2; x < Wd - 2; x++) for (let y = belt - 2; y < belt + 1; y++) m.set(x, y, zf - 1, k.dash);
    for (let x = 3; x < Wd - 3; x += 4) m.set(x, belt, zf - 1, trim);
    // steering wheel (driver on the +x side = left when facing +z)
    const wx = Wd - 6, wz = zf - 3;
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, 1], [1, 1], [-1, -1], [1, -1]]) m.set(wx + dx, belt + 1 + dy, wz, k.wheel);
    m.set(wx, belt, wz + 1, k.dark);
  }
  // --- bumpers
  for (const z of [0, L - 1]) for (let x = 1; x < Wd - 1; x++) for (let y = bot; y < bot + 2; y++) m.set(x, y, z, k.chrome);
  for (const x of [1, Wd - 2]) { m.set(x, bot, 1, k.chrome); m.set(x, bot, L - 2, k.chrome); m.set(x, bot + 1, 1, k.chrome); m.set(x, bot + 1, L - 2, k.chrome); }
  if (S.bullets) for (const x of [4, Wd - 5]) { m.set(x, bot + 2, L - 1, k.chrome); m.set(x, bot + 3, L - 1, k.black); }
  // --- grille + headlights
  const nt = beltAt(L - 2);
  for (let x = 4; x < Wd - 4; x++) for (let y = bot + 2; y <= nt - 2; y++) frontSet(m, x, y, (x % 2 === 0 || y === nt - 2 || y === bot + 2) ? k.chrome : k.dark, true);
  for (const [a, b] of [[1, 2], [Wd - 3, Wd - 2]]) {
    for (const hx of [a, b]) { frontSet(m, hx, nt - 2, k.head, true); frontSet(m, hx, nt - 3, k.head, true); if (nt - 4 >= bot + 2) frontSet(m, hx, nt - 4, k.amber, true); }
    frontSet(m, a === 1 ? 3 : Wd - 4, nt - 2, k.chrome, true); frontSet(m, a === 1 ? 3 : Wd - 4, nt - 3, k.chrome, true);
  }
  // taillights
  for (const tx of [1, 2, Wd - 3, Wd - 2]) { const y = (S.fins ? belt : beltAt(2) - 2); frontSet(m, tx, y, k.tail, false); frontSet(m, tx, y - 1, k.tail, false); frontSet(m, tx, y - 2, tx === 2 || tx === Wd - 3 ? k.chrome : k.tail, false); }
  // plate
  for (let x = (Wd >> 1) - 2; x < (Wd >> 1) + 2; x++) for (let y = bot + 2; y < bot + 4; y++) frontSet(m, x, y, (y === bot + 2 && x % 2) ? k.plateT : k.plate, false);
  // side chrome spear + door seams + handles
  if (!S.noSpear) for (let z = 4; z < L - 5; z++) for (const s of [1, -1]) sideSet(m, belt - 3, z, trim, s);
  if (cab && !S.open && !S.noDoors) {
    for (const s of [1, -1]) {
      const seams = S.fourDoor ? [cab.z1 - 1, cab.b ?? ((cab.z0 + cab.z1) >> 1), cab.z0 + 2] : [cab.z1 - 1, cab.z0 + 3];
      for (const zs of seams) for (let y = bot + 1; y < belt; y++) if (y !== belt - 3) sideSet(m, y, zs, k.seam, s);
      for (let i = 1; i < seams.length; i++) sideSet(m, belt - 1, seams[i] + 2, k.chrome, s);
    }
  }
  // hood ornament
  if (!S.box) m.set(Wd >> 1, beltAt(L - 5), L - 5, k.chrome);
  return m;
}

// boxy vehicles (vans, bus, fire truck): body from bottom to top over [zb0, zb1), with a hood in front
function buildBox(S, pal) {
  const k = kcols();
  const L = S.L, Wd = S.W, H = S.H, bot = S.bottom ?? 2;
  const m = new AF.Model(Wd, H, L);
  const A = pal.a, B = pal.b ?? pal.a;
  const hoodZ = L - S.hood;           // cab front face at z = hoodZ - 1
  for (let z = 1; z < L - 1; z++) {
    const inHood = z >= hoodZ;
    const top = inHood ? S.hoodTop - (z >= L - 3 ? 1 : 0) : S.top;
    for (let y = bot; y < top; y++) {
      let ins = 0;
      if (y === bot) ins++;
      if (y >= top - 1) ins++;
      if (!inHood && y >= top - 2 && (z <= 1 || z >= hoodZ - 2)) ins++;
      if (inHood && (z >= L - 3)) ins++;
      if (z <= 1) ins++;
      const col = S.bandY && y >= S.bandY[0] && y < S.bandY[1] ? B : (inHood && S.hoodCol ? S.hoodCol : A);
      for (let x = ins; x < Wd - ins; x++) m.set(x, y, z, col);
    }
  }
  // roof rounding at front/back top edges
  for (let x = 0; x < Wd; x++) { m.set(x, S.top - 1, hoodZ - 1, 0); m.set(x, S.top - 1, 1, 0); m.set(x, S.top - 1, 2, 0); }
  // windshield + cab side windows
  const wy0 = S.winY[0], wy1 = S.winY[1];
  for (let x = 3; x < Wd - 3; x++) for (let y = wy0; y < wy1; y++) if (x !== (Wd >> 1)) m.set(x, y, hoodZ - 1, k.glass);
  for (const x of [1, Wd - 2]) for (let y = wy0; y < wy1; y++) for (let z = hoodZ - 7; z < hoodZ - 2; z++) m.set(x, y, z, k.glass);
  // interior carve behind the windshield + seat + wheel
  for (let x = 2; x < Wd - 2; x++) for (let y = bot + 2; y < S.top - 2; y++) for (let z = hoodZ - 9; z < hoodZ - 1; z++) m.set(x, y, z, 0);
  for (let x = 2; x < Wd - 2; x++) for (let z = hoodZ - 9; z < hoodZ - 1; z++) m.set(x, bot + 2, z, k.floor);
  for (let x = 2; x < Wd - 2; x++) for (let y = bot + 3; y < wy0 + 2; y++) m.set(x, y, hoodZ - 9, pal.seat ?? k.seatT);
  for (let x = 2; x < Wd - 2; x++) for (let y = bot + 3; y < bot + 6; y++) for (let z = hoodZ - 8; z < hoodZ - 5; z++) m.set(x, y, z, pal.seat ?? k.seatT);
  for (let x = 2; x < Wd - 2; x++) m.set(x, wy0 - 1, hoodZ - 2, k.dash);
  const wx = Wd - 6, wz = hoodZ - 3;
  for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, 1], [1, 1], [-1, -1], [1, -1]]) m.set(wx + dx, wy0 + dy, wz, k.wheel);
  // wheel arches
  const ay = S.wr;
  for (const za of S.axles) {
    const R = S.wr + 1.3;
    for (let z = Math.floor(za - R - 1); z <= za + R + 1; z++) for (let y = 0; y < ay + R + 1; y++) {
      if (Math.hypot(z + 0.5 - za, y + 0.5 - ay) > R) continue;
      for (let x = 0; x < Wd; x++) { if (x < 4 || x >= Wd - 4) m.set(x, y, z, 0); else if ((x === 4 || x === Wd - 5) && m.get(x, y, z)) m.set(x, y, z, k.well); }
    }
  }
  // bumpers, grille, lights
  for (const z of [0, L - 1]) for (let x = 1; x < Wd - 1; x++) for (let y = bot; y < bot + 2; y++) m.set(x, y, z, k.chrome);
  const gTop = S.hoodTop - 3;
  for (let x = 5; x < Wd - 5; x++) for (let y = bot + 2; y <= gTop; y++) frontSet(m, x, y, (x % 2 === 0 || y === gTop) ? k.chrome : k.dark, true);
  for (const hx of [2, 3, Wd - 4, Wd - 3]) { frontSet(m, hx, S.hoodTop - 3, k.head, true); frontSet(m, hx, S.hoodTop - 4, k.head, true); frontSet(m, hx, S.hoodTop - 5, k.chrome, true); }
  for (const tx of [1, 2, Wd - 3, Wd - 2]) { frontSet(m, tx, bot + 4, k.tail, false); frontSet(m, tx, bot + 5, k.tail, false); frontSet(m, tx, S.top - 3, k.amber, false); }
  for (let x = (Wd >> 1) - 2; x < (Wd >> 1) + 2; x++) for (let y = bot + 2; y < bot + 4; y++) frontSet(m, x, y, (y === bot + 2 && x % 2) ? k.plateT : k.plate, false);
  // rear door seam + handle
  for (let y = bot + 2; y < S.top - 2; y++) frontSet(m, Wd >> 1, y, k.seam, false);
  frontSet(m, (Wd >> 1) + 2, (S.top >> 1) + 1, k.chrome, false);
  // cab door seams
  for (const s of [1, -1]) { for (let y = bot + 2; y < S.top - 2; y++) { sideSet(m, y, hoodZ - 8, k.seam, s); } sideSet(m, wy0 - 2, hoodZ - 6, k.chrome, s); }
  return m;
}

// ---------------------------------------------------------------- 1930s styling pass: separate fenders, running boards, upright grille, spare wheel
function thirties(m, S, pal) {
  const k = kcols(), Wd = m.w, L = m.d, bot = S.bottom ?? 2, belt = S.belt, fc = pal.f ?? k.paint.jet;
  const R = S.wr + 2.4, [za0, za1] = S.axles;
  for (let z = 0; z < L; z++) for (let y = 0; y < belt; y++) for (const x of [0, 1, Wd - 2, Wd - 1]) {
    let c = 0;
    for (const za of S.axles) {
      const dz = z + 0.5 - za, d = Math.hypot(dz, y + 0.5 - S.wr);
      if (Math.abs(dz) < R + 0.5 && y + 0.5 >= S.wr - 0.3 && d <= R && d > R - 1.7) c = fc;
      if (za === za1 && dz > 0 && dz < R + 3 && y + 0.5 >= S.wr - 0.3 && y < S.wr + R - dz * 0.55 && d > R - 1.7) c = fc;   // front fender sweeps forward
    }
    if (!c && z > za0 + R - 1 && z < za1 - R + 1 && y === bot) c = k.dark;                                                 // running board
    if (!c && z > za0 + R - 1 && z < za1 - R + 1 && y === bot + 1 && (x === 1 || x === Wd - 2)) c = fc;
    m.set(x, y, z, c);
  }
  // re-skin the now-outer body wall (x = 2 / W-3) so the interior never shows, except in the wheel arches
  for (let z = 2; z < L - 2; z++) for (let y = bot; y < belt; y++) {
    if (S.axles.some((za) => Math.hypot(z + 0.5 - za, y + 0.5 - S.wr) <= S.wr + 1.8)) continue;
    for (const x of [2, Wd - 3]) { const v = m.get(x, y, z); if (!v || v === k.floor || v === pal.seat || v === k.seatR || v === k.seatT || v === k.seatG || v === k.seatB || v === k.dash) m.set(x, y, z, pal.a); }
  }
  // upright grille (tall, narrow, chrome bars) + hood louvres
  const gx0 = (Wd >> 1) - 3, gx1 = (Wd >> 1) + 3;
  for (let x = gx0; x < gx1; x++) for (let y = bot + 1; y <= belt + 1; y++) { m.set(x, y, L - 1, (x === gx0 || x === gx1 - 1 || y === belt + 1 || x % 2 === 0) ? k.chrome : k.dark); }
  for (const s of [1, -1]) for (let z = L - 12; z < L - 5; z += 2) sideSet(m, belt - 2, z, k.chromeD, s);
  // bullet headlamps on the fenders
  for (const hx of [1, Wd - 2]) { m.set(hx, belt - 1, L - 3, k.chrome); m.set(hx, belt, L - 3, k.chrome); m.set(hx, belt - 1, L - 2, k.head); m.set(hx, belt, L - 2, k.head); }
  // spare wheel on the tail
  const cx = (Wd >> 1), cy = bot + 5;
  for (let x = cx - 4; x <= cx + 4; x++) for (let y = cy - 4; y <= cy + 4; y++) { const d = Math.hypot(x - cx, y - cy); if (d <= 4.2) m.set(x, y, 0, d > 3.3 ? k.tyre : d > 2.7 ? k.chrome : d < 0.9 ? k.chrome : pal.a); }
  return m;
}
const car30 = (spec, p, extra) => { const m = buildCar(spec, p); thirties(m, spec, p); if (extra) extra(m, kcols()); return m; };
const SED = { L: 48, W: 18, H: 19, belt: 10, axles: [10, 37], wr: 3.6, cab: { z0: 11, z1: 31, r0: 13, r1: 29, top: 18 }, fourDoor: true, noSpear: true };
const CPE = { L: 46, W: 17, H: 18, belt: 10, axles: [9, 36], wr: 3.6, cab: { z0: 13, z1: 28, r0: 15, r1: 27, top: 17 }, noSpear: true };
// double-decker bus: lower + upper saloon, green and cream
function buildDecker(k) {
  const S = { L: 96, W: 24, H: 44, top: 43, hood: 1, hoodTop: 12, axles: [16, 78], wr: 4.5, winY: [13, 20], bandY: [20, 29] };
  const m = buildBox(S, { a: k.paint.busGreen, b: k.paint.busCream });
  for (const s of [1, -1]) {
    for (let z = 4; z < 86; z++) { for (let y = 12; y < 20; y++) sideSet(m, y, z, (y === 12 || (z - 4) % 8 === 0) ? k.paint.busGreen : k.glass, s); for (let y = 20; y < 29; y++) sideSet(m, y, z, k.paint.busCream, s); for (let y = 29; y < 37; y++) sideSet(m, y, z, (y === 36 || (z - 4) % 8 === 0) ? k.paint.busGreen : k.glass, s); sideSet(m, 38, z, k.paint.busCream, s); sideSet(m, 39, z, k.paint.busCream, s); }
    // adverts: SOLACE COLA on the between-decks panel (red board), WSOL 880 on the lower panel
    for (let z = 10; z < 82; z++) for (let y = 20; y < 29; y++) sideSet(m, y, z, (z === 10 || z === 81 || y === 20 || y === 28) ? k.gold : k.red, s);
    blitText(m, 'SOLACE COLA', k.white, s, s > 0 ? 78 : 13, 21, s > 0 ? 23 : 0);
    for (let z = 26; z < 76; z++) for (let y = 5; y < 12; y++) if (!(Math.hypot(z + 0.5 - 16, y + 0.5 - 4.5) < 7 || Math.hypot(z + 0.5 - 78, y + 0.5 - 4.5) < 7)) sideSet(m, y, z, k.paint.busCream, s);
    blitText(m, 'WSOL 880', k.paint.busGreen, s, s > 0 ? 74 : 28, 5, s > 0 ? 23 : 0);
  }
  // open rear platform on the kerb side (local -x), with a chrome grab pole
  for (let z = 0; z < 10; z++) for (let y = 4; y < 22; y++) for (let x = 0; x < 11; x++) if (z < 2 || x < 2) m.set(x, y, z, 0);
  for (let y = 4; y < 22; y++) m.set(1, y, 1, k.chrome);
  for (let x = 0; x < 11; x++) for (let z = 0; z < 10; z++) m.set(x, 3, z, k.dark);
  // flat 1930s front: upper-deck front windows + a radiator panel
  for (let x = 3; x < 21; x++) for (let y = 29; y < 36; y++) if (x !== 12) m.set(x, y, 94, k.glass);
  for (let x = 8; x < 16; x++) for (let y = 4; y < 11; y++) m.set(x, y, 95, (x % 2 === 0 || y === 10) ? k.chrome : k.dark);
  for (let x = 2; x < 22; x++) for (let y = 4; y < 41; y++) for (let z = 3; z < 84; z++) if (y < 24 || y > 26) m.set(x, y, z, 0);
  for (let x = 2; x < 22; x++) for (let z = 3; z < 84; z++) { m.set(x, 4, z, k.floor); m.set(x, 27, z, k.floor); m.set(x, 41, z, k.white); }
  for (let z = 8; z < 82; z += 8) for (const [x0, x1] of [[2, 10], [14, 22]]) { m.box(x0, 5, z, x1, 9, z + 3, k.seatR); m.box(x0, 9, z, x1, 14, z + 1, k.seatR); m.box(x0, 28, z, x1, 31, z + 3, k.seatR); m.box(x0, 31, z, x1, 35, z + 1, k.seatR); }
  // destination blind on the front, upper deck
  for (let x = 4; x < 20; x++) for (let y = 37; y < 41; y++) frontSet(m, x, y, k.black, true);
  const tm = AF.textModel('HARBOUR', k.taxiSign, { pad: 0 });
  for (let i = 0; i < tm.w; i++) for (let j = 0; j < tm.h; j++) if (tm.get(i, j, 0) && j % 2 === 0) frontSet(m, 5 + Math.round(i * 14 / tm.w), 37 + (j >> 1), k.taxiSign, true);
  return m;
}
const vanText = (label, a, b, fg) => (p) => { const k = kcols(); const S = { L: 44, W: 19, H: 27, top: 26, hood: 9, hoodTop: 12, axles: [9, 34], wr: 3.6, winY: [13, 20], bandY: [9, 11] };
  const m = buildBox(S, { a: k.paint[a] || k[a], b: k.paint[b] || k[b] }); thirties(m, { axles: S.axles, wr: S.wr, belt: 11, bottom: 2 }, { f: k.paint.jet });
  for (const s of [1, -1]) { blitText(m, label, k[fg] || k.paint[fg], s, s > 0 ? 32 : 3, 14, s > 0 ? 17 : 1); for (let z = 3; z < 35; z++) sideSet(m, 23, z, k.paint[b] || k[b], s); }
  return m; };
// cabs: a long-hood sedan (5.0 x 1.8 m) with a lit roof TAXI dome, a red meter flag (up = for hire) and optional checker belt
const CAB = { L: 50, W: 18, H: 21, belt: 10, axles: [10, 38], wr: 3.6, cab: { z0: 11, z1: 29, r0: 13, r1: 27, top: 18 }, fourDoor: true, noSpear: true, twoTone: true };
const cabBuild = (checker) => (p) => car30(CAB, Object.assign({}, p, { f: kcols().paint.jet }), (m, k) => {
  if (checker) for (const s of [1, -1]) for (let z = 6; z < 44; z++) { sideSet(m, 8, z, (z >> 1) % 2 ? k.checkerB : k.checkerW, s); sideSet(m, 7, z, (z >> 1) % 2 ? k.checkerW : k.checkerB, s); }
  for (let x = 6; x < 12; x++) for (let z = 18; z < 22; z++) { m.set(x, 18, z, k.domeLit); m.set(x, 19, z, (z === 18 || z === 21) ? k.domeLit : (x === 6 || x === 11 ? k.domeLit : k.checkerB)); }
  for (let z = 18; z < 22; z++) m.set(8, 20, z, k.domeLit);
  const fx = m.w - 1; m.set(fx, 11, 30, k.chromeD); m.set(fx, 12, 30, k.chromeD); m.set(fx, 13, 30, k.flag); m.set(fx, 13, 31, k.flag); m.set(fx, 12, 31, k.flag);   // meter flag, up
});
const TYPES = [
  { id: 'coupe', name: 'Roadster Coupe', kind: 'car', paints: [['maroon', 'jet'], ['deco', 'jet'], ['navy', 'jet']], seat: 'seatR',
    build: (p) => car30(CPE, p) },
  { id: 'sedan', name: 'De Luxe Sedan', kind: 'car', paints: [['jet', 'jet'], ['bottle', 'jet'], ['deco', 'maroon'], ['navy', 'deco'], ['maroon', 'jet'], ['tanP', 'jet'], ['greyP', 'jet'], ['navy', 'navy'], ['olive', 'jet']], seat: 'seatT',
    build: (p) => car30(Object.assign({}, SED, { twoTone: true }), p) },
  { id: 'stream', name: 'Streamliner Sedan', kind: 'car', paints: [['dove', 'navy'], ['jet', 'jet'], ['deco', 'maroon'], ['greyP', 'greyP'], ['bottle', 'bottle']], seat: 'seatB',
    build: (p) => car30({ L: 50, W: 18, H: 18, belt: 10, axles: [10, 38], wr: 3.6, cab: { z0: 9, z1: 31, r0: 17, r1: 27, top: 17 }, fourDoor: true, noSpear: false, noseDrop: true, twoTone: true, skirts: true }, p, (m, k) => {
      for (let x = 5; x < 13; x++) for (let y = 3; y < 9; y++) if ((y + x) % 2 === 0) m.set(x, y, 49, k.chrome);   // waterfall grille
      for (const s of [1, -1]) for (let z = 40; z < 47; z += 2) sideSet(m, 9, z, k.chrome, s);                          // chrome speed-lines
    }) },
  { id: 'wagon', name: 'Town Limousine', kind: 'car', paints: [['jet', 'jet'], ['maroon', 'jet'], ['bottle', 'deco']], seat: 'seatG',
    build: (p) => car30(Object.assign({}, SED, { L: 54, axles: [10, 43], cab: { z0: 9, z1: 36, r0: 11, r1: 34, top: 18, b: 23 } }), p) },
  { id: 'pickup', name: 'Coal Truck', kind: 'car', paints: [['coal', 'coal']], seat: 'seatT',
    build: (p) => car30({ L: 50, W: 18, H: 19, belt: 10, axles: [9, 39], wr: 3.8, cab: { z0: 23, z1: 33, r0: 24, r1: 31, top: 18, b: 100 }, noSpear: true, benches: [25] }, p, (m, k) => {
      for (let x = 2; x < 16; x++) for (let z = 2; z < 22; z++) { for (let y = 5; y < 12; y++) m.set(x, y, z, y < 11 ? 0 : 0); m.set(x, 4, z, k.woodD); }
      for (let z = 2; z < 22; z++) for (let y = 4; y < 12; y++) { m.set(2, y, z, k.woodD); m.set(15, y, z, k.woodD); }
      for (let x = 3; x < 15; x++) for (let z = 3; z < 21; z++) { const h = 9 + ((x * 7 + z * 3) % 3) - Math.abs(x - 9) / 3; for (let y = 5; y < h; y++) m.set(x, y, z, (x + y + z) % 3 ? k.black : k.chromeD); }
    }) },
  { id: 'convertible', name: 'Phaeton Tourer', kind: 'car', paints: [['deco', 'maroon'], ['bottle', 'deco'], ['navy', 'deco']], seat: 'seatT',
    build: (p) => car30({ L: 48, W: 18, H: 16, belt: 9, axles: [9, 38], wr: 3.6, cab: { z0: 12, z1: 30, r0: 12, r1: 30, top: 13 }, open: true, benches: [21, 13], noSpear: true }, p, (m, k) => {
      for (let x = 2; x < 16; x++) for (let y = 9; y < 14; y++) m.set(x, y, 30, (x === 2 || x === 15 || y === 13) ? k.chrome : k.glass);
      for (let x = 2; x < 16; x++) for (let z = 8; z < 12; z++) m.set(x, 9, z, k.canvas);
    }) },
  { id: 'taxi', name: 'Harbour Cab Co. taxi', kind: 'car', cab: true, paints: [['cabYel', 'cabYel']], seat: 'seatB', ai: true, build: cabBuild(true) },
  { id: 'gullcab', name: 'Blue Gull Taxi', kind: 'car', cab: true, paints: [['gull', 'deco']], seat: 'seatT', ai: true, build: cabBuild(false) },
  { id: 'beaconcab', name: 'Beacon Cab', kind: 'car', cab: true, paints: [['beacon', 'deco']], seat: 'seatR', ai: true, build: cabBuild(false) },
  { id: 'police', name: 'Police Car', kind: 'car', paints: [['jet', 'white']], seat: 'seatB', ai: true,
    build: (p) => car30(SED, p, (m, k) => {
      for (const s of [1, -1]) for (let z = 13; z < 31; z++) for (let y = 4; y < 10; y++) sideSet(m, y, z, (z === 22) ? k.seam : k.white, s);
      const star = [[0, 2], [-1, 1], [0, 1], [1, 1], [-2, 0], [-1, 0], [0, 0], [1, 0], [2, 0], [-1, -1], [1, -1]];
      for (const s of [1, -1]) for (const [dz, dy] of star) sideSet(m, 6 + dy, 27 + dz, k.gold, s);
      m.box(8, 18, 20, 10, 20, 22, k.beacon);
    }) },
  { id: 'milk', name: 'Solace Dairy milk truck', kind: 'van', paints: [['dairy', 'blue']], seat: 'seatT', ai: true, build: vanText('SOLACE DAIRY', 'dairy', 'blue', 'blue') },
  { id: 'icecream', name: 'Harbour Ice Co. truck', kind: 'van', paints: [['ice', 'navy']], seat: 'seatR', ai: true, build: vanText('HARBOUR ICE', 'ice', 'navy', 'navy') },
  { id: 'mail', name: 'Sunrise Bread van', kind: 'van', paints: [['bread', 'maroon']], seat: 'seatB', ai: true, build: vanText('SUNRISE BREAD', 'bread', 'maroon', 'maroon') },
  { id: 'laundry', name: 'Solace Laundry Van', kind: 'van', paints: [['white', 'teal']], seat: 'seatB', ai: true, build: vanText('LAUNDRY', 'white', 'teal', 'teal') },
  // airport ground support (53-airtraffic drives them to the stands)
  { id: 'fuel', name: 'Westgate fuel truck', kind: 'van', paints: [['white', 'fire']], seat: 'seatB', ai: true, build: vanText('AVGAS', 'white', 'fire', 'fire') },
  { id: 'catering', name: 'Sky Catering truck', kind: 'van', paints: [['white', 'navy']], seat: 'seatR', ai: true, build: vanText('CATERING', 'white', 'navy', 'navy') },
  { id: 'baggage', name: 'Baggage tractor', kind: 'van', paints: [['sunY', 'jet']], seat: 'seatB', ai: true, build: vanText('RAMP', 'sunY', 'jet', 'jet') },
  { id: 'followme', name: 'Follow-me car', kind: 'van', paints: [['cabYel', 'jet']], seat: 'seatT', ai: true, build: vanText('FOLLOW ME', 'cabYel', 'jet', 'jet') },
  { id: 'bus', name: 'Double-Decker Bus', kind: 'bus', paints: [['busGreen', 'busCream']], seat: 'seatG', ai: true, big: true, build: () => buildDecker(kcols()) },
  { id: 'firetruck', name: 'Engine Co. 7', kind: 'truck', paints: [['fire', 'white']], seat: 'seatB', big: true,
    build: (p) => { const k = kcols(); const S = { L: 88, W: 22, H: 30, top: 23, hood: 18, hoodTop: 15, axles: [16, 66], wr: 4.5, winY: [14, 20], bandY: [11, 12] };
      const m = buildBox(S, { a: k.paint.fire, b: k.gold });
      const cabBack = 88 - 18 - 10;
      for (let x = 0; x < 22; x++) for (let y = 17; y < 23; y++) for (let z = 1; z < cabBack; z++) m.set(x, y, z, 0);
      for (const s of [1, -1]) for (let z = 3; z < cabBack; z++) for (let y = 4; y < 16; y++) { const door = (z - 3) % 12 === 0 || y === 4 || y === 15; if (door) sideSet(m, y, z, k.chrome, s); }
      for (let x = 2; x < 20; x++) for (let z = 2; z < cabBack - 1; z++) m.set(x, 16, z, k.hose);
      for (let z = 2; z < 84; z++) { m.set(3, 24, z, k.woodL); m.set(18, 24, z, k.woodL); if (z % 3 === 0) for (let x = 4; x < 18; x++) m.set(x, 24, z, k.rung); }
      for (const z of [4, 40, 60]) for (const x of [3, 18]) for (let y = 17; y < 24; y++) m.set(x, y, z, k.chromeD);
      for (const s of [1, -1]) blitText(m, 'ENGINE 7', k.gold, s, s > 0 ? 58 : 13, 6, s > 0 ? 21 : 0);
      m.box(9, 23, 66, 13, 25, 69, k.beacon);
      m.sphere(11, 12, 86, 1.6, k.gold);
      thirties(m, { axles: S.axles, wr: S.wr, belt: 12, bottom: 2 }, { f: k.paint.fire });
      return m; } },
];
// v2 r2: horse-drawn wagons (a bay horse in the shafts; its four legs are instanced and walk a diagonal gait) — they set the pace of the street
const HORSE = { bay: 0x7a4a2a, dark: 0x352015, blaze: 0xf2ece0 };
function buildHorseCart(label, a, b, fg) {
  const k = kcols(), L = 66, Wd = 16, m = new AF.Model(Wd, 26, L);
  const bay = AF.col(HORSE.bay, { jitter: 0.12, edge: 0.25, rough: 0.6 }), dk = AF.col(HORSE.dark, { jitter: 0.1 }), wh = AF.col(HORSE.blaze, { jitter: 0.05 });
  const A = k.paint[a] || k[a], B = k.paint[b] || k[b];
  // wagon box (rear 3.1 m): white panels, a coloured waist band, rounded roof, open driver's front
  for (let z = 1; z < 31; z++) for (let y = 6; y < 22; y++) for (let x = 1; x < Wd - 1; x++) {
    const sh = x === 1 || x === Wd - 2 || z === 1 || y === 6 || y === 21 || z === 30;
    if (!sh) continue;
    if (z === 30 && y > 9 && y < 20 && x > 2 && x < Wd - 3) continue;          // open front
    m.set(x, y, z, (y === 11 || y === 12) ? B : (y === 21 ? k.white : A));
  }
  for (let z = 0; z < 33; z++) for (let x = 0; x < Wd; x++) m.set(x, 22, z, B);                                 // roof with overhang
  for (let z = 1; z < 31; z++) for (let x = 2; x < Wd - 2; x++) m.set(x, 6, z, k.woodD);                       // floor
  for (let x = 2; x < Wd - 2; x++) for (let z = 31; z < 35; z++) m.set(x, 9, z, k.woodD);                      // footboard
  for (let x = 3; x < Wd - 3; x++) { m.set(x, 12, 28, k.seatT); m.set(x, 12, 29, k.seatT); for (let y = 12; y < 16; y++) m.set(x, y, 27, k.seatT); }   // driver's bench
  for (let z = 4; z < 28; z += 3) for (let y = 13; y < 20; y += 3) { m.set(3, y, z, k.bottle); m.set(Wd - 4, y, z, k.bottle); }                        // crates of bottles inside
  const tw = Math.min(28, AF.textModel(label, B, { pad: 0, depth: 1 }).w);   // centred on the 3 m box
  for (const s of [1, -1]) blitText(m, label, fg ? (k.paint[fg] || k[fg]) : B, s, s > 0 ? Math.round(16 + tw / 2) : Math.round(16 - tw / 2), 14, s > 0 ? Wd - 2 : 1);
  // spoked wheels, baked (big rear, smaller front)
  for (const [az, R] of [[8, 5.6], [25, 4.2]]) for (let y = 0; y < 12; y++) for (let z = 0; z < L; z++) {
    const d = Math.hypot(z + 0.5 - az, y + 0.5 - R); if (d > R) continue;
    const ang = Math.atan2(y + 0.5 - R, z + 0.5 - az), spoke = Math.abs(Math.sin(ang * 4)) < 0.28;
    const c = d > R - 0.9 ? k.dark : d < 1.2 ? k.chromeD : spoke ? B : 0;
    for (const x of [0, Wd - 1]) m.set(x, y, z, c);
  }
  for (let x = 1; x < Wd - 1; x++) { m.set(x, 5, 8, k.dark); m.set(x, 4, 25, k.dark); }                       // axles
  // shafts to the horse's collar
  for (let z = 31; z < 52; z++) { m.set(3, 10, z, k.woodL); m.set(Wd - 4, 10, z, k.woodL); }
  // the horse: barrel, chest, neck, head, mane, tail, collar + harness
  const cx = Wd / 2;
  for (let z = 38; z < 56; z++) for (let y = 10; y < 18; y++) for (let x = 0; x < Wd; x++) {
    const ex = (x + 0.5 - cx) / 3.3, ey = (y + 0.5 - 14) / 4, ez = (z + 0.5 - 47) / 9.2;
    if (ex * ex + ey * ey + ez * ez * ez * ez <= 1) m.set(x, y, z, bay);
  }
  for (let i = 0; i < 9; i++) for (let y = 15 + i; y < 19 + i; y++) for (let x = cx - 2; x < cx + 2; x++) { const z = 53 + Math.round(i * 0.55); m.set(x, y, z, bay); m.set(x, y, z + 1, bay); if (i > 1) m.set(x, y + 1, z - 1, (x === cx - 1 || x === cx) ? dk : bay); }
  for (let z = 57; z < 63; z++) for (let y = 19; y < 24; y++) for (let x = cx - 2; x < cx + 2; x++) { if (z > 60 && y > 22) continue; if (y < 20 + (z - 57) * 0.2) continue; m.set(x, y, z, (z === 62 || (z > 58 && y === 20)) ? dk : bay); }
  for (let z = 58; z < 63; z++) m.set(cx - 1, 23 - (z > 60 ? 1 : 0), z, wh); for (const x of [cx - 3, cx + 2]) m.set(x, 22, 59, k.black);          // blaze + eyes
  for (const x of [cx - 2, cx + 1]) { m.set(x, 24, 57, bay); m.set(x, 25, 57, dk); }                                                             // ears
  for (let y = 11; y < 16; y++) { m.set(cx - 1, y, 37, dk); m.set(cx, y, 37, dk); } m.set(cx - 1, 10, 36, dk); m.set(cx, 10, 36, dk);          // tail
  for (let y = 12; y < 20; y++) for (let x = cx - 3; x <= cx + 2; x++) if (x === cx - 3 || x === cx + 2 || y === 12 || y === 19) m.set(x, y, 52, k.woodD);   // collar
  for (let z = 40; z < 52; z++) { m.set(cx - 4, 14, z, k.black); m.set(cx + 3, 14, z, k.black); }                                             // traces
  for (let x = cx - 3; x <= cx + 2; x++) m.set(x, 18, 46, k.black);                                                                             // saddle strap
  return m;
}
TYPES.push({ id: 'dairycart', name: 'Solace Dairy milk wagon', kind: 'cart', horse: true, paints: [['dairy', 'blue']], seat: 'seatT', ai: true, build: () => buildHorseCart('DAIRY', 'dairy', 'blue', 'blue') });
TYPES.push({ id: 'icecart', name: 'Harbour Ice wagon', kind: 'cart', horse: true, paints: [['ice', 'navy']], seat: 'seatT', ai: true, build: () => buildHorseCart('ICE', 'ice', 'navy', 'navy') });
// v2 r2: a police motorcycle with a sidecar (rider + a sergeant in the chair), wheels baked
function buildSidecar() {
  const k = kcols(), L = 24, Wd = 16, m = new AF.Model(Wd, 16, L), P = k.paint.navy, bx = 11;   // bike on local +x side (x 9..13), chair on -x
  const wheel = (x0, x1, az, R) => { for (let y = 0; y < 8; y++) for (let z = 0; z < L; z++) { const d = Math.hypot(z + 0.5 - az, y + 0.5 - R); if (d > R) continue; for (let x = x0; x < x1; x++) m.set(x, y, z, d > R - 1 ? k.tyre : d < 1.2 ? k.chrome : k.dark); } };
  wheel(bx - 1, bx + 1, 3.5, 3.4); wheel(bx - 1, bx + 1, 20, 3.4); wheel(2, 4, 8, 3.0);
  for (let z = 4; z < 19; z++) for (let y = 3; y < 6; y++) for (let x = bx - 1; x < bx + 1; x++) m.set(x, y, z, k.dark);          // frame
  for (let z = 7; z < 14; z++) for (let y = 5; y < 8; y++) for (let x = bx - 2; x < bx + 2; x++) m.set(x, y, z, y === 7 ? P : k.chromeD);   // engine + tank
  for (let z = 10; z < 16; z++) for (let x = bx - 2; x < bx + 2; x++) { m.set(x, 8, z, P); m.set(x, 9, z, z === 15 ? k.chrome : P); }     // fuel tank
  for (let z = 5; z < 9; z++) for (let x = bx - 2; x < bx + 2; x++) m.set(x, 8, z, k.black);                                       // saddle
  for (let y = 4; y < 11; y++) m.set(bx, y, 18, k.chrome); for (let x = bx - 3; x <= bx + 3; x++) m.set(x, 11, 17, k.chrome);    // forks + bars
  m.set(bx, 9, 19, k.head); m.set(bx, 10, 19, k.chrome); m.set(bx, 6, 0, k.tail);                                                 // lamps
  for (let z = 1; z < 7; z++) for (let x = bx - 2; x < bx + 2; x++) m.set(x, 7, z, P);                                              // rear mudguard
  // the sidecar chair: a boat-tail tub
  for (let z = 3; z < 17; z++) for (let y = 3; y < 9; y++) for (let x = 1; x < 7; x++) { const e = (z < 5 || z > 14) ? 1 : 0; if (x < 1 + e || x > 5 - e) continue; const shell = x === 1 + e || x === 5 - e || y === 3 || z === 3 || z === 16 || (y === 8 && z > 11); if (shell) m.set(x, y, z, y === 8 ? k.chrome : P); }
  for (let z = 5; z < 11; z++) for (let x = 2; x < 5; x++) m.set(x, 4, z, k.seatB);
  for (let x = 4; x < bx - 1; x++) { m.set(x, 4, 6, k.chromeD); m.set(x, 4, 14, k.chromeD); }                                     // struts
  // rider (bike) + sergeant (chair), baked: navy tunics, peaked caps
  const man = (x0, y0, z0, sit) => { for (let x = x0; x < x0 + 3; x++) { for (let y = y0; y < y0 + 5; y++) for (let z = z0; z < z0 + 2; z++) m.set(x, y, z, P); for (let y = y0 + 5; y < y0 + 7; y++) for (let z = z0; z < z0 + 2; z++) m.set(x, y, z, k.skin); m.set(x, y0 + 7, z0, P); m.set(x, y0 + 7, z0 + 1, P); m.set(x, y0 + 7, z0 + 2, k.black); } if (!sit) for (let z = z0 + 2; z < z0 + 7; z++) { m.set(x0, y0 + 3, z, P); m.set(x0 + 2, y0 + 3, z, P); } };
  man(bx - 1, 9, 6, false); man(2, 5, 7, true);
  return m;
}
TYPES.push({ id: 'sidecar', name: 'Police Sidecar Motorcycle', kind: 'bike', paints: [['navy', 'navy']], seat: 'seatB', ai: true, build: () => buildSidecar() });
// ---------------------------------------------------------------- the friends' garages: four high-end cars + a solo motorcycle
// tail taper: carve the body behind z0 into a boat tail / teardrop
const taper = (m, z0, k = 1) => { const cx = (m.w - 1) / 2; for (let z = 0; z < z0; z++) { const hw = (m.w / 2) * Math.pow(z / z0, 0.6 * k) + 0.6; for (let x = 0; x < m.w; x++) if (Math.abs(x - cx) > hw) for (let y = 0; y < m.h; y++) m.set(x, y, z, 0); } };
const pipes = (m, k, z0, z1, y) => { for (const x of [0, m.w - 1]) for (let z = z0; z < z1; z++) { m.set(x, y, z, k.chrome); if ((z - z0) % 5 === 0) m.set(x, y + 1, z, k.chrome); } };
TYPES.push(
  { id: 'speedster', name: 'Boattail Speedster', kind: 'car', lux: true, vmax: 36, acc: 10, paints: [['goldP', 'jet'], ['pinkP', 'deco'], ['racer', 'deco'], ['midnight', 'goldP']], seat: 'seatT',
    build: (p) => car30({ L: 52, W: 18, H: 15, belt: 9, axles: [11, 41], wr: 3.8, cab: { z0: 14, z1: 26, r0: 14, r1: 26, top: 12 }, open: true, benches: [16], noSpear: false }, p, (m, k) => {
      taper(m, 13, 1.2);
      for (let x = 3; x < 15; x++) for (let y = 9; y < 13; y++) m.set(x, y, 26, (x === 3 || x === 14 || y === 12) ? k.chrome : k.glass);
      pipes(m, k, 31, 43, 6);
      for (let z = 2; z < 13; z++) m.set(8, 9, z, k.chrome), m.set(9, 9, z, k.chrome);                         // chrome spine down the tail
    }) },
  { id: 'duesy', name: 'Duesenberg SJ', kind: 'car', lux: true, vmax: 34, acc: 9, paints: [['cash', 'jet'], ['midnight', 'silverP'], ['maroon', 'jet'], ['goldP', 'jet']], seat: 'seatR',
    build: (p) => car30({ L: 58, W: 18, H: 18, belt: 10, axles: [10, 46], wr: 3.9, cab: { z0: 9, z1: 25, r0: 11, r1: 23, top: 17 }, twoTone: true, noSpear: true }, p, (m, k) => {
      pipes(m, k, 30, 44, 7);
      for (let x = 6; x < 12; x++) m.set(x, 12, 56, k.gold);                                                        // mascot bar
    }) },
  { id: 'arrow', name: 'Silver Arrow', kind: 'car', lux: true, vmax: 42, acc: 12, paints: [['silverP', 'silverP'], ['racer', 'deco'], ['sunY', 'jet']], seat: 'seatR',
    build: (p) => { const k = kcols(); const m = buildCar({ L: 50, W: 16, H: 12, belt: 8, bottom: 1, axles: [9, 39], wr: 3.8, cab: { z0: 17, z1: 24, r0: 17, r1: 24, top: 10 }, open: true, benches: [18], skirts: true, noseDrop: true, noSpear: true }, p);
      taper(m, 12, 0.8);
      for (let z = 8; z < 17; z++) { const h = Math.round(3 * (z - 8) / 9); for (let x = 7; x < 9; x++) for (let y = 8; y < 8 + h; y++) m.set(x, y, z, p.a); }   // headrest fairing
      for (let x = 4; x < 12; x++) for (let y = 8; y < 10; y++) m.set(x, y, 24, (y === 9) ? k.chrome : k.glass);
      for (const s of [1, -1]) { for (let z = 26; z < 31; z++) for (let y = 3; y < 8; y++) if (Math.hypot(z - 28, y - 5.5) < 2.7) sideSet(m, y, z, k.white, s); blitText(m, '7', k.black, s, s > 0 ? 30 : 26, 2, s > 0 ? 15 : 0); }
      return m; } },
  { id: 'cord', name: 'Cord 810 Coupe', kind: 'car', lux: true, vmax: 33, acc: 9, paints: [['midnight', 'midnight'], ['lilacP', 'deco'], ['cash', 'cash'], ['deco', 'maroon']], seat: 'seatB',
    build: (p) => car30({ L: 52, W: 18, H: 17, belt: 10, axles: [10, 40], wr: 3.6, cab: { z0: 12, z1: 29, r0: 16, r1: 26, top: 16 }, noseDrop: true, noSpear: true }, p, (m, k) => {
      for (let y = 3; y < 9; y += 2) for (let x = 2; x < 16; x++) frontSet(m, x, y, k.chrome, true);                // wrap-around coffin-nose louvres
      for (const s of [1, -1]) for (let z = 42; z < 50; z++) for (let y = 3; y < 9; y += 2) sideSet(m, y, z, k.chrome, s);
    }) },
);
function buildMoto(p) {
  const k = kcols(), L = 22, Wd = 6, m = new AF.Model(Wd, 12, L), P = p.a, bx = 3;
  const wheel = (az, R) => { for (let y = 0; y < 8; y++) for (let z = 0; z < L; z++) { const d = Math.hypot(z + 0.5 - az, y + 0.5 - R); if (d > R) continue; for (let x = bx - 1; x < bx + 1; x++) m.set(x, y, z, d > R - 1 ? k.tyre : d < 1.2 ? k.chrome : k.dark); } };
  wheel(3.5, 3.4); wheel(18.5, 3.4);
  for (let z = 4; z < 18; z++) for (let y = 3; y < 5; y++) m.set(bx - 1, y, z, k.dark), m.set(bx, y, z, k.dark);   // frame
  for (let z = 7; z < 13; z++) for (let y = 4; y < 7; y++) for (let x = bx - 2; x < bx + 2; x++) m.set(x, y, z, y === 6 ? k.chromeD : k.chrome);   // engine
  for (let z = 10; z < 16; z++) for (let x = bx - 2; x < bx + 2; x++) { m.set(x, 7, z, P); m.set(x, 8, z, P); m.set(x, 9, z, z > 13 ? P : 0); }   // tank
  for (let z = 4; z < 10; z++) for (let x = bx - 2; x < bx + 2; x++) m.set(x, 7, z, k.black);                        // saddle
  for (let z = 1; z < 6; z++) for (let x = bx - 1; x < bx + 1; x++) m.set(x, 6, z, P);                              // tail
  for (let y = 4; y < 11; y++) m.set(bx, y, 17 + (y > 8 ? 1 : 0), k.chrome);                                         // forks
  for (let x = 0; x < Wd; x++) m.set(x, 11, 16, k.chrome);                                                            // bars
  m.set(bx, 9, 20, k.head); m.set(bx - 1, 9, 20, k.head); m.set(bx, 10, 19, P); m.set(bx, 6, 0, k.tail);
  for (let z = 3; z < 10; z++) m.set(bx + 2, 3, z, k.chrome);                                                         // exhaust
  return m;
}
TYPES.push({ id: 'moto', name: 'Moto Racer', kind: 'bike', solo: true, vmax: 38, acc: 13, paints: [['jet', 'jet'], ['pinkP', 'pinkP'], ['goldP', 'jet'], ['lilacP', 'lilacP'], ['cash', 'jet'], ['racer', 'jet']], seat: 'seatB', build: (p) => buildMoto(p) });
let LEG_IM = null;
const legGeo = () => { const k = kcols(); const m = new AF.Model(3, 17, 3); m.box(0, 3, 0, 3, 17, 3, AF.col(HORSE.bay, { jitter: 0.1 })); m.box(0, 0, 0, 3, 3, 3, AF.col(HORSE.dark, { jitter: 0.1 })); m.box(0, 3, 0, 3, 4, 3, k.white); return AF.meshModel(m, { vs: 1 / 16, anchor: [0.5, 1, 0.5] }); };
VV.TYPES = TYPES;

// ---------------------------------------------------------------- shared geometry: wheels + drivers
let WHEEL_GEO = null, DRIVER_GEOS = null;
const wheelGeo = () => {
  if (WHEEL_GEO) return WHEEL_GEO;
  const k = kcols(); const n = 15, c = n / 2, th = 5;
  const m = new AF.Model(th, n, n);
  for (let y = 0; y < n; y++) for (let z = 0; z < n; z++) {
    const d = Math.hypot(y + 0.5 - c, z + 0.5 - c); if (d > 7.4) continue;
    for (let x = 0; x < th; x++) {
      let col = k.tyre;
      const face = x === 0 || x === th - 1;
      if (d < 5.2 && face) col = k.white;
      if (d < 3.6) col = face ? k.chrome : k.chromeD;
      if (d < 1.2 && face) col = k.chromeD;
      if (d < 3.6 && d > 2.2 && face && Math.abs(y + 0.5 - c) < 0.8) col = k.dark;   // hubcap bar so the spin reads
      if (!face && d < 5.2) col = k.dark;
      m.set(x, y, z, col);
    }
  }
  WHEEL_GEO = AF.meshModel(m, { vs: 0.05, anchor: [0.5, 0.5, 0.5] });
  return WHEEL_GEO;
};
const driverGeos = () => {
  if (DRIVER_GEOS) return DRIVER_GEOS;
  const k = kcols();
  const mk = (shirt, skin, hat, woman) => {
    const m = new AF.Model(8, 16, 6);
    m.box(1, 0, 1, 7, 7, 5, shirt);             // torso
    m.box(0, 3, 2, 1, 7, 4, shirt); m.box(7, 3, 2, 8, 7, 4, shirt);
    m.box(0, 3, 4, 1, 4, 6, skin); m.box(7, 3, 4, 8, 4, 6, skin);   // hands forward to the wheel
    m.box(3, 7, 2, 5, 8, 4, skin);               // neck
    m.box(2, 8, 1, 6, 12, 5, skin);              // head
    m.set(3, 10, 4, k.black); m.set(4, 10, 4, k.black);
    if (woman) { m.box(2, 11, 1, 6, 13, 5, k.hair); m.box(1, 9, 1, 7, 12, 2, k.hair); m.box(2, 12, 1, 6, 13, 5, hat); m.box(1, 8, 2, 7, 9, 5, k.scarf); }
    else { m.box(1, 12, 0, 7, 13, 6, hat); m.box(2, 13, 1, 6, 15, 5, hat); m.box(2, 13, 1, 6, 14, 5, k.black); }
    return AF.meshModel(m, { vs: 1 / 14, anchor: [0.5, 0, 0.5] });
  };
  DRIVER_GEOS = [mk(k.shirt, k.skin, k.hat, false), mk(k.shirt2, k.skin, k.scarf, true), mk(k.shirt3, k.skin2, k.hat2, false)];
  return DRIVER_GEOS;
};

// ---------------------------------------------------------------- car instances
const tmpM = new THREE.Matrix4(), tmpM2 = new THREE.Matrix4(), tmpQ = new THREE.Quaternion(), tmpE = new THREE.Euler(0, 0, 0, 'YXZ'), tmpV = new THREE.Vector3(), tmpS = new THREE.Vector3(1, 1, 1);
const getGeo = (T, pi) => {
  pi = pi % T.paints.length;
  const key = T.id + ':' + pi;
  if (VV.models[key]) return VV.models[key];
  const k = kcols(); const pr = T.paints[pi];
  const pal = { a: k.paint[pr[0]] || k[pr[0]], b: k.paint[pr[1]] || k[pr[1]], seat: k[T.seat], f: ['deco', 'taxi', 'jet'].includes(pr[0]) ? k.paint.jet : (k.paint[pr[1]] || k.paint.jet) };
  const m = T.build(pal);
  const g = AF.meshModel(m, { vs: CVS, anchor: [0.5, 0, 0.5] });
  const spec = { L: m.d * CVS, W: m.w * CVS, H: m.h * CVS };
  return (VV.models[key] = { geo: g, spec, m, key, pal });
};
// wheel layout per type (from the spec used in build)
const WHEELS = {
  coupe: { axles: [9, 36], wr: 3.6, L: 46, W: 17 }, sedan: { axles: [10, 37], wr: 3.6, L: 48, W: 18 }, wagon: { axles: [10, 43], wr: 3.6, L: 54, W: 18 },
  pickup: { axles: [9, 39], wr: 3.8, L: 50, W: 18 }, convertible: { axles: [9, 38], wr: 3.6, L: 48, W: 18 }, taxi: { axles: [10, 38], wr: 3.6, L: 50, W: 18 }, gullcab: { axles: [10, 38], wr: 3.6, L: 50, W: 18 }, beaconcab: { axles: [10, 38], wr: 3.6, L: 50, W: 18 }, stream: { axles: [10, 38], wr: 3.6, L: 50, W: 18 },
  police: { axles: [10, 37], wr: 3.6, L: 48, W: 18 }, milk: { axles: [9, 34], wr: 3.6, L: 44, W: 19 }, icecream: { axles: [9, 34], wr: 3.6, L: 44, W: 19 },
  mail: { axles: [9, 34], wr: 3.6, L: 44, W: 19 }, laundry: { axles: [9, 34], wr: 3.6, L: 44, W: 19 }, bus: { axles: [16, 78], wr: 4.5, L: 96, W: 24 }, firetruck: { axles: [16, 66], wr: 4.5, L: 88, W: 22 },
  fuel: { axles: [9, 34], wr: 3.6, L: 44, W: 19 }, catering: { axles: [9, 34], wr: 3.6, L: 44, W: 19 }, baggage: { axles: [9, 34], wr: 3.6, L: 44, W: 19 }, followme: { axles: [9, 34], wr: 3.6, L: 44, W: 19 },
  dairycart: { axles: [], wr: 5.6, L: 66, W: 16 }, sidecar: { axles: [], wr: 3.4, L: 24, W: 16 }, icecart: { axles: [], wr: 5.6, L: 66, W: 16 },
  speedster: { axles: [11, 41], wr: 3.8, L: 52, W: 18 }, duesy: { axles: [10, 46], wr: 3.9, L: 58, W: 18 }, arrow: { axles: [9, 39], wr: 3.8, L: 50, W: 16 }, cord: { axles: [10, 40], wr: 3.6, L: 52, W: 18 },
  moto: { axles: [], wr: 3.4, L: 22, W: 6, wb: 1.5 },
};
// distance from (px,pz) to a car's footprint (0 inside): you are "at" a car when you are next to its body, not its middle
const bodyDist = (car, px, pz) => { const s = Math.sin(car.yaw), c = Math.cos(car.yaw), rx = px - car.x, rz = pz - car.z; const lx = rx * c - rz * s, lz = rx * s + rz * c; return Math.hypot(Math.max(0, Math.abs(lx) - car.halfW), Math.max(0, Math.abs(lz) - car.halfL)); };
VV.bodyDist = bodyDist;
// the driver's seat in car-local [right, up, forward] (instanced AI drivers and the seated player share it)
const SEAT_L = [0, 0, 0];
const seatLocal = (car) => {
  const T = car.type, k = T.kind;
  SEAT_L[0] = k === 'bike' ? 0 : car.halfW - 0.62;
  SEAT_L[1] = k === 'cart' ? 1.3 : k === 'car' ? 0.4 : k === 'bike' ? 0.02 : T.big ? 0.45 : 0.42;
  SEAT_L[2] = k === 'bike' ? -0.3 : k === 'cart' ? -0.45 : k === 'car' ? (T.id === 'convertible' ? 0.2 : 0.35) : car.halfL - (T.big ? T.id === 'bus' ? 2.1 : 2.6 : 1.3);
  return SEAT_L;
};
VV.seatLocal = seatLocal;
function makeCar(typeId, paintIdx, x, z, yaw, o = {}) {
  const T = TYPES.find((t) => t.id === typeId);
  const G = getGeo(T, paintIdx);
  // v2: every car body is drawn through one InstancedMesh per model (see syncInstances); car.mesh is a transform proxy only
  const mesh = new THREE.Object3D();
  mesh.rotation.order = 'YXZ';
  mesh.name = 'car';
  const Wl = WHEELS[typeId];
  const halfL = Wl.L * CVS / 2, halfW = Wl.W * CVS / 2;
  const wr = Wl.wr * CVS, ws = wr / 0.37;
  const wheels = [];
  for (const [ai, az] of Wl.axles.entries()) for (const s of [1, -1]) wheels.push({ lx: s * (halfW - 0.17), ly: wr, lz: (az + 0.5) * CVS - halfL, front: ai === 1, side: s });
  const car = Object.assign(new AF.Vehicle({ name: T.name, x, z, yaw }), {
    id: VV.cars.length, type: T, name: T.name, mesh, x, z, y: 0, yaw, pitch: 0, roll: 0, v: 0, vx: 0, vz: 0, steer: 0, spin: 0,
    halfL, halfW, wr, ws, wheels, wheelbase: Wl.wb || (Wl.axles.length > 1 ? (Wl.axles[1] - Wl.axles[0]) * CVS : 2.4), gait: Math.random() * 6, height: G.spec.H,
    ai: null, parked: true, player: false, driver: -1, bob: 0, bobV: 0, sway: 0, key: G.key, vPrev: 0, brake: 0,
  });
  car.y = AF.surfaceBelow(x, z, (o.y ?? 0) + 2.5, 6);
  VV.cars.push(car);
  if (WHEEL_IM) { let count = 4; for (const existing of VV.cars) if (existing.type.id === typeId) count++; ensureIM(typeId, count); }
  if (!o.noDrive && !T.horse) car.attach({ r: 1.6, lift: 0.6, label: (T.kind === 'bike' ? 'Ride the ' : 'Drive the ') + T.name, dist: (px, pz) => bodyDist(car, px, pz), prio: 0.1,
    can: () => AF.mode === 'walk' && car.active !== false && !car.player && !car.dead && (!car.ai || Math.abs(car.v) < 0.6), act: () => AF.setMode('drive', { car }) });
  placeMesh(car);
  return car;
}
function placeMesh(car) {
  const m = car.mesh;
  m.position.set(car.x, car.y + car.bob, car.z);
  m.rotation.set(car.pitch, car.yaw, car.roll, 'YXZ');
  m.updateMatrix();
}

// ---------------------------------------------------------------- drive mode
const DR = { car: null, chase: new AF.Vehicle.Chase(), seat: { seatH: 0.7, lean: 0.35 } }, CAR_SEAT = { seatH: 0.45, lean: 0.1 };
const DRIVE_INPUT = { up: false, down: false, left: 0, right: 0, brake: false };
const POINTS = new Float64Array(24), LOCAL_POINTS = new Float64Array([1, 1, -1, 1, 0, 1, 1, -1, -1, -1, 0, -1, 1, 0, -1, 0, 1, 0.5, -1, 0.5, 1, -0.5, -1, -0.5]);
const CONTACT = new Float64Array(3), AXES = new Float64Array(8);
const carPts = (car, x, z, yaw, inset = 0) => {
  const s = Math.sin(yaw), c = Math.cos(yaw), hl = car.halfL - 0.1 - inset, hw = car.halfW - 0.08 - inset;
  for (let index = 0; index < 24; index += 2) {
    const lx = LOCAL_POINTS[index] * hw, lz = LOCAL_POINTS[index + 1] * hl;
    POINTS[index] = x + lx * c + lz * s; POINTS[index + 1] = z - lx * s + lz * c;
  }
  return POINTS;
};
const worldHits = (car, x, z, yaw) => {
  const feet = car.y + 0.5, h = Math.min(1.2, car.height - 0.6);
  const pts = carPts(car, x, z, yaw); let hits = 0;
  for (let index = 0; index < 24; index += 2) if (AF.boxBlocked(pts[index], feet, pts[index + 1], 0.12, h)) hits++;
  return hits;
};
const overlap = (car, x, z, yaw, other) => {
  const sine = Math.sin(yaw), cosine = Math.cos(yaw), os = Math.sin(other.yaw), oc = Math.cos(other.yaw);
  AXES[0] = cosine; AXES[1] = -sine; AXES[2] = sine; AXES[3] = cosine;
  AXES[4] = oc; AXES[5] = -os; AXES[6] = os; AXES[7] = oc;
  const dx = x - other.x, dz = z - other.z;
  let depth = Infinity, normalX = 0, normalZ = 0;
  for (let index = 0; index < 8; index += 2) {
    const ax = AXES[index], az = AXES[index + 1], distance = dx * ax + dz * az;
    const radius = car.halfW * Math.abs(cosine * ax - sine * az) + car.halfL * Math.abs(sine * ax + cosine * az)
      + other.halfW * Math.abs(oc * ax - os * az) + other.halfL * Math.abs(os * ax + oc * az);
    const penetration = radius - Math.abs(distance);
    if (penetration <= 0) { CONTACT[2] = 0; return 0; }
    if (penetration < depth) { depth = penetration; const sign = distance < 0 ? -1 : 1; normalX = ax * sign; normalZ = az * sign; }
  }
  CONTACT[0] = normalX; CONTACT[1] = normalZ; CONTACT[2] = depth;
  return depth;
};
const nearby = (car, x, z, other) => other !== car && other.active !== false && Math.abs(other.x - x) < car.halfL + other.halfL + 1 && Math.abs(other.z - z) < car.halfL + other.halfL + 1 && Math.abs((other.y || 0) - car.y) < 2;
const carBlocked = (car, x, z, yaw) => {
  if (worldHits(car, x, z, yaw)) return 'world';
  for (const o of VV.cars) {
    if (nearby(car, x, z, o) && overlap(car, x, z, yaw, o)) return o;
  }
  return null;
};
const moveAllowed = (car, x, z, yaw) => {
  const hits = worldHits(car, x, z, yaw);
  if (hits && hits >= worldHits(car, car.x, car.z, car.yaw)) return false;
  for (let group = 0; group < 2; group++) {
    const cars = group ? VV.parkedStatic : VV.cars;
    for (const other of cars) {
      if (!nearby(car, x, z, other)) continue;
      const next = overlap(car, x, z, yaw, other);
      if (next > 0 && next >= overlap(car, car.x, car.z, car.yaw, other)) return false;
    }
  }
  return true;
};
const PUSH_POS = { x: 0, z: 0, dx: 0, dz: 1 };
function stepPush(car, dt) {
  if (car.player || !(car.pushLife > 0)) return;
  car.pushLife = Math.max(0, car.pushLife - dt);
  const steps = Math.max(1, Math.ceil(Math.hypot(car.pushX || 0, car.pushZ || 0) * dt / 0.2)), slice = dt / steps;
  for (let index = 0; index < steps; index++) {
    const nx = car.x + (car.pushX || 0) * slice, nz = car.z + (car.pushZ || 0) * slice, yaw = car.yaw + (car.pushSpin || 0) * slice;
    if (!worldHits(car, nx, nz, yaw)) { car.x = nx; car.z = nz; car.yaw = yaw; }
    else { car.pushX = car.pushZ = car.pushSpin = 0; break; }
  }
  const decay = Math.exp(-dt * 3);
  car.pushX *= decay; car.pushZ *= decay; car.pushSpin *= decay;
  if (car.ai) {
    VV.pieceAt(car.ai.piece, car.ai.s, PUSH_POS);
    car.ai.offsetX = car.x - PUSH_POS.x; car.ai.offsetZ = car.z - PUSH_POS.z;
    car.ai.pushYaw = AF.angDiff(Math.atan2(PUSH_POS.dx, PUSH_POS.dz), car.yaw);
  } else car.v = (car.pushX || 0) * Math.sin(car.yaw) + (car.pushZ || 0) * Math.cos(car.yaw);
  if (car.interact) car.sync();
  placeMesh(car);
}
function carContacts(car, dt) {
  for (let group = 0; group < 2; group++) {
    const cars = group ? VV.parkedStatic : VV.cars;
    for (const other of cars) {
      if (!nearby(car, car.x, car.z, other)) continue;
      const depth = overlap(car, car.x, car.z, car.yaw, other);
      if (!depth) continue;
      const normalX = CONTACT[0], normalZ = CONTACT[1];
      const approach = Math.max(0, -(car.vx * normalX + car.vz * normalZ));
      if (car.player && !other.static && approach > 0.05) {
        const share = other.type.big ? 0.035 : other.type.kind === 'bike' ? 0.8 : other.type.kind === 'van' ? 0.3 : 0.5;
        const nudge = Math.min(depth + 0.03, 0.2 + approach * dt) * share;
        const ox = other.x - normalX * nudge, oz = other.z - normalZ * nudge;
        if (!worldHits(other, ox, oz, other.yaw)) {
          other.x = ox; other.z = oz;
          const impulse = Math.min(12, approach) * share;
          if (VV.onImpact) VV.onImpact(other, approach * share, car);
          other.pushX = AF.clamp((other.pushX || 0) - normalX * impulse, -12, 12);
          other.pushZ = AF.clamp((other.pushZ || 0) - normalZ * impulse, -12, 12);
          other.pushSpin = AF.clamp((other.pushSpin || 0) + ((car.x - other.x) * normalZ - (car.z - other.z) * normalX) * impulse * 0.12, -1, 1);
          other.pushLife = 2;
          if (other.ai) { other.ai.pushT = 0.35; other.ai.stuck = other.ai.stuckLong = other.ai.ghost = 0; other.ai.ghostAll = false; }
          stepPush(other, 0);
        }
      }
      const remaining = overlap(car, car.x, car.z, car.yaw, other);
      const separateX = car.x + normalX * (remaining + 0.025), separateZ = car.z + normalZ * (remaining + 0.025);
      if (remaining && moveAllowed(car, separateX, separateZ, car.yaw)) { car.x = separateX; car.z = separateZ; }
      else if (remaining) {
        const distance = Math.min(remaining + 0.025, 0.25);
        if (moveAllowed(car, car.x + normalX * distance, car.z + normalZ * distance, car.yaw)) { car.x += normalX * distance; car.z += normalZ * distance; }
      }
      if (approach > 0) {
        const rebound = other.static || other.type.big ? 1.2 : 0.75;
        car.vx += normalX * approach * rebound; car.vz += normalZ * approach * rebound;
        car.lastHit = other; car.hitT = (car.hitT || 0) + 1;
        if (approach > 6 && !(car.crunchCd > 0)) { car.crunchCd = 1.2; AF.emit('toast', 'Crunch! Easy there.'); }
      }
    }
  }
}
VV.carBlocked = carBlocked;
VV.makeCar = (...a) => makeCar(...a);
VV.placeMesh = (c) => placeMesh(c);
VV.getGeo = getGeo;
// drop a runtime car from every registry (the forget policy in 76-game, wrecks, police cars)
VV.removeCar = (car) => {
  if (car.player) return false;
  if (car.ai) { VV.detachTraffic(car); const i = VV.ai.indexOf(car); if (i >= 0) VV.ai.splice(i, 1); car.ai = null; }
  for (const list of [VV.cars, VV.parked, AF.Vehicle.all]) { const i = list.indexOf(car); if (i >= 0) list.splice(i, 1); }
  if (car.interact) { AF.removeInteract(car.interact); car.interact = null; }
  car.active = false; return true;
};
// a kerb car taken for a drive goes back to its kerb (merged static) once forgotten, if the spot is still free
VV.forget = (car) => {
  const h = car.home;
  if (!VV.removeCar(car)) return;
  if (h && !car.dead && !VV.cars.some((c) => Math.abs(c.x - h.x) < 4 && Math.abs(c.z - h.z) < 4)) { try { VV.placeParked(h.type, h.x, h.z, h.yaw, { paint: h.pi, y: h.y }); } catch (e) { /* spot unusable */ } }
};
const GROUND = { front: 0, rear: 0, left: 0, right: 0 }, GROUND_HEIGHTS = new Float64Array(4);
const groundUnder = (car) => {
  const s = Math.sin(car.yaw), c = Math.cos(car.yaw), hb = car.wheelbase / 2, hw = car.halfW - 0.2, top = car.y + 0.6;
  for (let index = 0; index < 4; index++) {
    const lx = index % 2 ? -hw : hw, lz = index < 2 ? hb : -hb;
    GROUND_HEIGHTS[index] = AF.surfaceBelow(car.x + lx * c + lz * s, car.z - lx * s + lz * c, top, 3);
  }
  GROUND.front = (GROUND_HEIGHTS[0] + GROUND_HEIGHTS[1]) / 2; GROUND.rear = (GROUND_HEIGHTS[2] + GROUND_HEIGHTS[3]) / 2;
  GROUND.left = (GROUND_HEIGHTS[0] + GROUND_HEIGHTS[2]) / 2; GROUND.right = (GROUND_HEIGHTS[1] + GROUND_HEIGHTS[3]) / 2;
  return GROUND;
};
VV.SPEED_K = 0.82;
function physics(car, dt, inp) {
  car.crunchCd = Math.max(0, (car.crunchCd || 0) - dt);
  const sp0 = Math.hypot(car.vx, car.vz);
  carContacts(car, dt);
  const hx = Math.sin(car.yaw), hz = Math.cos(car.yaw), rx = -hz, rz = hx;   // right-hand (screen) vector = -local x
  let f = car.vx * hx + car.vz * hz, lat = car.vx * rx + car.vz * rz;
  const big = car.type.big ? 0.7 : 1;
  // VV.SPEED_K: every vehicle runs a little slower than its rated top speed (more time for the streamers ahead of it)
  const maxF = (car.type.vmax || 27) * (big < 1 ? 0.72 : 1) * VV.SPEED_K, maxR = 7, pull = (car.type.acc || 7.5) * (0.5 + VV.SPEED_K * 0.5);
  let acc = 0;
  if (inp.up) acc = f < 0 ? 14 : pull * big * (1 - Math.max(0, f) / maxF) * (inp.thr ?? 1);
  else if (inp.down) acc = f > 0.3 ? -15 : -4.5 * (1 + f / maxR);
  acc -= f * 0.08 + Math.sign(f) * (inp.up || inp.down ? 0 : 1.1);
  if (inp.brake) acc -= Math.sign(f) * 9;
  if (!inp.up && !inp.down && Math.abs(f) < 0.25) f = 0;
  f += acc * dt;
  const grip = inp.brake ? 1.4 : 9;
  lat *= Math.exp(-grip * dt);
  // steering (speed-sensitive)
  const sp = Math.abs(f);
  const maxSteer = 0.62 / (1 + sp * 0.07);
  car.steer += ((inp.left - inp.right) * maxSteer - car.steer) * Math.min(1, dt * 7);
  const yawRate = f / car.wheelbase * Math.tan(car.steer) * (inp.brake ? 1.35 : 1);
  const nextYaw = car.yaw + yawRate * dt;
  if (moveAllowed(car, car.x, car.z, nextYaw)) car.yaw = nextYaw;
  const nhx = Math.sin(car.yaw), nhz = Math.cos(car.yaw), nrx = -nhz, nrz = nhx;
  car.vx = nhx * f + nrx * lat; car.vz = nhz * f + nrz * lat;
  car.v = f;
  // move with collision + slide
  const steps = Math.max(1, Math.ceil(Math.hypot(car.vx, car.vz) * dt / 0.2)), slice = dt / steps;
  for (let index = 0; index < steps; index++) {
    const nx = car.x + car.vx * slice, nz = car.z + car.vz * slice;
    if (moveAllowed(car, nx, nz, car.yaw)) { car.x = nx; car.z = nz; }
    else {
      const savedX = car.x, savedZ = car.z;
      car.x = nx; car.z = nz;
      carContacts(car, slice);
      const correctedX = car.x, correctedZ = car.z;
      car.x = savedX; car.z = savedZ;
      if (moveAllowed(car, correctedX, correctedZ, car.yaw)) { car.x = correctedX; car.z = correctedZ; }
      else {
        const slideX = car.x + car.vx * slice, slideZ = car.z + car.vz * slice;
        const clearX = moveAllowed(car, slideX, car.z, car.yaw), clearZ = moveAllowed(car, car.x, slideZ, car.yaw);
        if (clearX) car.x = slideX;
        if (clearZ && moveAllowed(car, car.x, slideZ, car.yaw)) car.z = slideZ;
        if (!clearX) car.vx *= -0.12;
        if (!clearZ) car.vz *= -0.12;
      }
    }
  }
  car.v = car.vx * nhx + car.vz * nhz;
  // a sudden loss of speed (wall, car) is an impact: 77-combat turns it into damage
  const lost = sp0 - Math.hypot(car.vx, car.vz) - Math.abs(acc) * dt;
  if (lost > 2.5 && VV.onImpact) VV.onImpact(car, lost, car.lastHit);
  // ground follow: pitch / roll / height
  const g = groundUnder(car);
  const gy = (g.front + g.rear) / 2;
  if (gy >= car.y - 0.02) { car.y += (gy - car.y) * Math.min(1, dt * 18); car.vy = 0; }
  else { car.vy = (car.vy || 0) - 22 * dt; car.y = Math.max(gy, car.y + car.vy * dt); if (car.y <= gy) car.vy = 0; }
  const pT = Math.atan2(g.rear - g.front, car.wheelbase), rT = Math.atan2(g.left - g.right, car.halfW * 2 - 0.4);
  // suspension: squat on accel, dive on brake, lean in corners
  const lean = AF.clamp(-yawRate * f * 0.004, -0.06, 0.06);
  const dive = AF.clamp(-acc * 0.0035, -0.04, 0.05);
  car.pitch += (pT + dive - car.pitch) * Math.min(1, dt * 9);
  if (!car.type.solo) car.roll += (rT + lean - car.roll) * Math.min(1, dt * 9);
  // a faint, position-keyed road texture (was per-frame random noise, which made flat asphalt feel bumpy)
  car.bobV += (-car.bob * 90 - car.bobV * 9) * dt + (AF.noise2(car.x * 0.8, car.z * 0.8) - 0.5) * Math.min(sp, 20) * 0.006 * dt;
  car.bob += car.bobV * dt; car.bob = AF.clamp(car.bob, -0.025, 0.025);
}
VV.physics = physics;
function exitSpot(car) {
  const s = Math.sin(car.yaw), c = Math.cos(car.yaw);
  for (const [lx, lz] of [[car.halfW + 0.7, 0.4], [-(car.halfW + 0.7), 0.4], [0, -(car.halfL + 0.9)], [0, car.halfL + 0.9], [car.halfW + 1.5, -1.5]]) {
    const x = car.x + lx * c + lz * s, z = car.z - lx * s + lz * c;
    const y = AF.surfaceBelow(x, z, car.y + 1.5, 4);
    if (!AF.boxBlocked(x, y + 0.05, z, 0.3, 1.7)) return { x, y, z };
  }
  return { x: car.x + (car.halfW + 0.7) * c, y: car.y + 0.1, z: car.z - (car.halfW + 0.7) * s };
}
VV.exitCar = () => {
  const car = DR.car; if (!car) return;
  const p = exitSpot(car);
  AF.setMode('walk', { x: p.x, y: p.y, z: p.z, yaw: car.yaw + Math.PI });
};
// the seated driver inside a car body sits in the car's own shadow: skip its shadow draws (bikes keep them)
const avatarShadow = (on) => { const m = AF.player && AF.player.mesh; if (m) m.traverse((o) => { if (o.isMesh && o.name !== 'held') o.castShadow = on; }); };
AF.modes.drive = {
  enter(opts = {}, from) {
    const car = opts.car || VV.cars.find((c) => c.parked) || VV.cars[0];
    if (!car) { AF.setMode(from || 'aerial'); return; }
    DR.car = car; VV.player = car;
    if (car.ai) { VV.detachTraffic(car); VV.ai.splice(VV.ai.indexOf(car), 1); car.ai = null; }
    car.player = true; car.active = true; car.parked = false; car.driver = -1;
    car.pushLife = car.pushX = car.pushZ = car.pushSpin = 0;
    car.vx = Math.sin(car.yaw) * car.v; car.vz = Math.cos(car.yaw) * car.v;
    DR.bike = car.type.kind === 'bike' && !!car.type.solo;
    if (AF.player && AF.player.setVisible) AF.player.setVisible(true);
    avatarShadow(DR.bike);
    const L = seatLocal(car);
    DR.chase.set({ dist: car.type.big ? 13 : DR.bike ? 5.5 : 8.5, height: (DR.bike ? 1.5 : 1.3) + (car.type.big ? 1.2 : 0), eye: [L[0], L[1] + (DR.bike ? 1.4 : 1.0), L[2] + 0.1] });
    AF.emit('toast', (DR.bike ? 'You swing onto the ' : 'You slide behind the wheel of the ') + car.name + '.');
    AF.emit('hint', AF.touch ? '' : 'W/S throttle · A/D steer · Space brake · E to get out');
  },
  exit(to) {
    const car = DR.car;
    if (car) { car.player = false; car.parked = true; car.v = 0; car.vx = car.vz = 0; car.steer *= 0.5; car.roll = 0; placeMesh(car); if (car.interact) car.sync(); }
    DR.car = null; VV.player = null; if (AF.PL) AF.PL.seat = null;
    if (AF.player && AF.player.setVisible) AF.player.setVisible(true);
    avatarShadow(true);
    AF.emit('hud', { speed: null, mode: to });
    AF.emit('hint', '');
  },
  update(dt) {
    const car = DR.car; if (!car) return;
    const V = AF.Vehicle.input(), inp = DRIVE_INPUT;
    inp.up = V.thr > 0; inp.down = V.thr < 0; inp.thr = V.thr > 0 ? V.thr : 1;
    inp.left = Math.max(0, -V.steer); inp.right = Math.max(0, V.steer); inp.brake = V.brake;
    if (VV.autoInput) Object.assign(inp, VV.autoInput);
    // fixed <= 1/60 s substeps: a phone's uneven frame times no longer shake the suspension and contacts
    const nSub = Math.min(4, Math.ceil(dt * 60 - 0.01)) || 1;
    for (let i = 0; i < nSub; i++) physics(car, dt / nSub, inp);
    if (DR.bike) {
      const lean = -car.steer * AF.clamp(Math.abs(car.v) / 9, 0, 1) * 1.1;
      car.roll += (lean - car.roll) * Math.min(1, dt * 6);
    }
    // the player rides in every vehicle (open cars and bikes show them): the avatar root sits seatH + 0.12 below a car's seat surface
    const L = seatLocal(car); if (!DR.bike) L[1] -= 0.57;
    AF.Vehicle.seat(car, L, DR.bike ? DR.seat : CAR_SEAT);
    placeMesh(car);
    if (car.interact) car.sync();
    DR.chase.update(dt, car.x, car.y, car.z, car.yaw, car.pitch, car.roll);
    AF.Vehicle.hud(car.v, car.name);
    if (V.exit) VV.exitCar();
  },
};

// ---------------------------------------------------------------- per-frame: instanced bodies + wheels + drivers + night lamps
let WHEEL_IM = null, DRV_IM = null;
const tmpObj = new THREE.Object3D();
const FRUSTUM = new THREE.Frustum(), FR_M = new THREE.Matrix4(), FR_S = new THREE.Sphere();
const IMS = VV.ims = new Map();          // model key -> { full, glass, lod, cap, n, nl }
const LOD_D = 90, FAR_D = 300, LAMP_D = 720, DETAIL_D = 110;
const REAR_Q = new THREE.Quaternion(), FRONT_Q = new THREE.Quaternion();
const BATCHES = new Map(), DRIVER_COUNTS = new Uint16Array(3);
let PAINT_MAT = null;
function batchGeo(tid) {
  if (BATCHES.has(tid)) return BATCHES.get(tid);
  const T = TYPES.find(type => type.id === tid), slots = [AF.col(0x010203), AF.col(0x020304), AF.col(0x030405)];
  const m = T.build({ a: slots[0], b: slots[1], f: slots[2], seat: kcols()[T.seat] }), geo = AF.meshModel(m, { vs: CVS, anchor: [0.5, 0, 0.5] }), lod = AF.lodOf(geo);
  for (const geometry of [geo, lod]) if (geometry) { const source = geometry.getAttribute('aPal'), values = new Float32Array(source.count); for (let index = 0; index < source.count; index++) { const value = source.getX(index), slot = slots.indexOf(value); values[index] = slot < 0 ? value : -slot - 1; } geometry.setAttribute('aPal', new THREE.BufferAttribute(values, 1)); }
  const result = { geo, lod }; BATCHES.set(tid, result); return result;
}
function paintMaterial() {
  if (PAINT_MAT) return PAINT_MAT;
  PAINT_MAT = AF.mat.patchVoxel(AF.mat.voxelInst.clone(), 'car-paint'); const compile = PAINT_MAT.onBeforeCompile;
  PAINT_MAT.onBeforeCompile = (shader, renderer) => {
    compile(shader, renderer);
    shader.vertexShader = shader.vertexShader.replace('attribute float aPal;', 'attribute float aPal; attribute vec3 carPaint; attribute float carDmg; varying float vCarDmg;').replace('vec2 pUV =', 'vCarDmg = carDmg; float carPal = aPal < -2.5 ? carPaint.z : aPal < -1.5 ? carPaint.y : aPal < -0.5 ? carPaint.x : aPal;\nvec2 pUV =').replace('mod(aPal,', 'mod(carPal,').replace('floor(aPal /', 'floor(carPal /');
    // damage (0..1): soot and dents in blotches keyed to the model position, so a wreck reads charred, not just dark
    shader.fragmentShader = shader.fragmentShader.replace('varying vec3 vAlb;', 'varying float vCarDmg; varying vec3 vAlb;').replace('diffuseColor.rgb *= vAlb * ao * shade * patMul;', 'diffuseColor.rgb *= vAlb * ao * shade * patMul;\n      if (vCarDmg > 0.0) diffuseColor.rgb *= 1.0 - vCarDmg * (0.3 + 0.62 * step(1.0 - vCarDmg, afHash(floor(vAfOP * 6.0))));');
  }; return PAINT_MAT;
}
function ensureIM(key, cap) {
  key = key.split(':')[0];
  let r = IMS.get(key);
  if (r && r.cap >= cap) return r;
  const G = batchGeo(key);
  if (r) for (const o of [r.full, r.glass, r.lod]) if (o) { AF.scene.remove(o); o.dispose && o.dispose(); }
  const mk = (geo, mat, shadow) => { const im = new THREE.InstancedMesh(geo, mat, cap); im.castShadow = shadow; im.customDepthMaterial = AF.mat.depthInst; im.receiveShadow = true; im.frustumCulled = false; im.count = 0; im.name = 'cars:' + key; AF.scene.add(im); return im; };
  const full = mk(G.geo, paintMaterial(), true);
  const glass = G.geo.userData.glass ? mk(G.geo.userData.glass, AF.mat.glass, false) : null; if (glass) glass.renderOrder = 2;
  const lod = G.lod ? mk(G.lod, paintMaterial(), false) : null;
  const paint = new THREE.InstancedBufferAttribute(new Float32Array(cap * 3), 3), farPaint = new THREE.InstancedBufferAttribute(new Float32Array(cap * 3), 3), dmg = new THREE.InstancedBufferAttribute(new Float32Array(cap), 1);
  full.geometry.setAttribute('carPaint', paint); full.geometry.setAttribute('carDmg', dmg); if (lod) lod.geometry.setAttribute('carPaint', farPaint);
  r = { full, glass, lod, paint, farPaint, dmg, dmgRange: { start: 0, count: 0 }, paintRange: { start: 0, count: 0 }, farRange: { start: 0, count: 0 }, cap, n: 0, nl: 0 }; IMS.set(key, r);
  return r;
}
// night lamps: one additive Points cloud (2 head + 2 tail per car) + instanced headlight pools on the road
const LAMP = { pts: null, pos: null, col: null, pool: null, max: 0 };
const glowTex = () => { const cv = document.createElement('canvas'); cv.width = cv.height = 64; const g = cv.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.2, 'rgba(255,255,255,0.8)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.18)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(cv); };
function buildLamps(maxCars) {
  const n = maxCars * 4; LAMP.max = maxCars;
  LAMP.pos = new Float32Array(n * 3); LAMP.col = new Float32Array(n * 3);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(LAMP.pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(LAMP.col, 3));
  const tex = glowTex();
  LAMP.pts = new THREE.Points(g, new THREE.PointsMaterial({ size: 1.5, map: tex, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true, fog: false }));
  LAMP.pts.frustumCulled = false; LAMP.pts.renderOrder = 6; LAMP.pts.name = 'car-lamps'; AF.scene.add(LAMP.pts);
  // pool: an elongated soft wedge on the asphalt ahead of the car
  const cv = document.createElement('canvas'); cv.width = 64; cv.height = 128; { const c = cv.getContext('2d'); const im = c.createImageData(64, 128);
    for (let y = 0; y < 128; y++) for (let x = 0; x < 64; x++) { const v = y / 127, u = (x - 31.5) / 32, wid = 0.25 + 0.75 * v; const a = Math.max(0, 1 - Math.abs(u) / wid) * Math.sin(Math.PI * Math.min(1, v * 1.15)) * (1 - v * 0.55); const i = (y * 64 + x) * 4; im.data[i] = 255; im.data[i + 1] = 214; im.data[i + 2] = 150; im.data[i + 3] = Math.round(255 * Math.max(0, a) ** 1.4); }
    c.putImageData(im, 0, 0); }
  const pg = new THREE.PlaneGeometry(4.2, 11); pg.rotateX(-Math.PI / 2); pg.translate(0, 0, 5.5 + 0.5);
  const pm = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cv), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.55, fog: true, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  LAMP.pool = new THREE.InstancedMesh(pg, pm, maxCars); LAMP.pool.frustumCulled = false; LAMP.pool.renderOrder = 3; LAMP.pool.count = 0; LAMP.pool.name = 'car-pools'; LAMP.pool.castShadow = false; LAMP.pool.receiveShadow = false; AF.scene.add(LAMP.pool);
}
const LV3 = new THREE.Vector3();
function syncInstances(dt) {
  if (!WHEEL_IM) return;
  let wi = 0, li = 0, pi = 0; const dc = DRIVER_COUNTS; dc.fill(0);
  const camO = AF.camera, cam = camO.position;
  camO.updateMatrixWorld();
  FR_M.multiplyMatrices(camO.projectionMatrix, camO.matrixWorldInverse); FRUSTUM.setFromProjectionMatrix(FR_M);
  for (const r of IMS.values()) { r.n = 0; r.nl = 0; }
  if (LEG_IM) LEG_IM.count0 = 0;
  const tm = AF.time, night = tm?.night ?? ((tm?.hours < 6.3 || tm?.hours > 18.9) ? 1 : 0);
  const lampsOn = night > 0.15 && LAMP.pts, lampK = Math.min(1, (night - 0.15) / 0.35);
  for (const car of VV.cars) {
    if (car.active === false) { car.inView = false; continue; }
    car.spin += (car.v * dt) / car.wr;
    if (dt > 0) { const dv = (car.v - car.vPrev) / dt, want = (dv < -1.2 || (car.v < 0.3 && car.ai)) ? 1 : 0; car.brake = want > car.brake ? Math.min(1, car.brake + dt * 8) : Math.max(0, car.brake - dt * 3); car.vPrev = car.v; }
    const d = Math.hypot(car.x - cam.x, car.y - cam.y, car.z - cam.z);
    FR_S.center.set(car.x, car.y + 1, car.z); FR_S.radius = car.halfL + 1.5;
    const inView = FRUSTUM.intersectsSphere(FR_S), far = d > FAR_D || !inView;
    car.inView = inView;
    if (!car.player && car.interact && car.ai && d < 60) car.sync();
    if (far && (!lampsOn || !inView || d > LAMP_D)) continue;
    const alpha = VV.renderAlpha ?? 1, interpolate = car.ai && car.renderNear && car.prevX != null;
    const drawX = interpolate ? car.prevX + (car.x - car.prevX) * alpha : car.x, drawZ = interpolate ? car.prevZ + (car.z - car.prevZ) * alpha : car.z, drawYaw = interpolate ? car.prevYaw + AF.angDiff(car.prevYaw, car.yaw) * alpha : car.yaw;
    if (!car.player) { const m = car.mesh; m.position.set(drawX, car.y + car.bob, drawZ); m.rotation.set(car.pitch, drawYaw, car.roll, 'YXZ'); }
    if (!car.pitch && !car.roll) tmpQ.set(0, Math.sin(drawYaw / 2), 0, Math.cos(drawYaw / 2)); else { tmpE.set(car.pitch, drawYaw, car.roll, 'YXZ'); tmpQ.setFromEuler(tmpE); }
    tmpM.compose(tmpV.set(drawX, car.y + car.bob, drawZ), tmpQ, tmpS.set(1, 1, 1));
    const r = IMS.get(car.type.id) || ensureIM(car.type.id, 4), pal = VV.models[car.key].pal;
    if (!r) continue;
    if (far) { /* lamps only */ }
    else if (d < LOD_D || !r.lod) {
      if (r.n < r.cap) { r.full.setMatrixAt(r.n, tmpM); r.paint.setXYZ(r.n, pal.a, pal.b, pal.f); r.dmg.array[r.n] = car.dmg || 0; if (r.glass) r.glass.setMatrixAt(r.n, tmpM); r.n++; }
    } else if (r.nl < r.cap) { r.lod.setMatrixAt(r.nl, tmpM); r.farPaint.setXYZ(r.nl++, pal.a, pal.b, pal.f); }
    if (!far && d < DETAIL_D) {
      tmpE.set(car.spin, 0, 0, 'YXZ'); REAR_Q.setFromEuler(tmpE); tmpE.set(car.spin, car.steer, 0, 'YXZ'); FRONT_Q.setFromEuler(tmpE);
      for (const w of car.wheels) {
        if (wi >= WHEEL_IM.userData.max) break;
        tmpM2.compose(tmpV.set(w.lx, w.ly - car.bob, w.lz), w.front ? FRONT_Q : REAR_Q, tmpS.setScalar(car.ws)).premultiply(tmpM);
        WHEEL_IM.setMatrixAt(wi++, tmpM2);
      }
      if (car.type.horse && LEG_IM) {
        car.gait += car.v * dt * 1.55;
        const sw = Math.sin(car.gait), amp = Math.min(1, car.v * 0.6) * 0.42;
        for (let li2 = 0; li2 < 4; li2++) {
          if (LEG_IM.count0 >= LEG_IM.userData.max) break;
          const fr2 = li2 < 2, sd = li2 % 2 ? 1 : -1, ph2 = (fr2 ? 1 : -1) * sd * sw;   // diagonal pairs move together
          tmpObj.position.set(sd * 0.17, 1.12, fr2 ? 2.05 : 0.85); tmpObj.rotation.set(ph2 * amp, 0, 0); tmpObj.scale.setScalar(1); tmpObj.updateMatrix();
          tmpM2.multiplyMatrices(tmpM, tmpObj.matrix); LEG_IM.setMatrixAt(LEG_IM.count0++, tmpM2);
        }
      }
      if (car.driver >= 0 && DRV_IM) {
        const im = DRV_IM[car.driver], i = dc[car.driver];
        if (i < im.userData.max) {
          const L = seatLocal(car);
          tmpM2.makeTranslation(L[0], L[1], L[2]).premultiply(tmpM); im.setMatrixAt(i, tmpM2); dc[car.driver]++;
        }
      }
    }
    // night: head + tail lamps for every moving (or driven) car, pools under the near ones
    if (lampsOn && (car.ai || car.player) && !car.type.horse && li + 4 <= LAMP.max * 4) {
      const hy = car.type.big ? 0.95 : 0.78, hw = car.halfW - 0.22;
      const far2 = d > 220 ? 1.6 : 1;   // far lamps a touch brighter so the avenues read as rivers of light
      for (let lamp = 0; lamp < 4; lamp++) {
        const tail = lamp > 1, lx = lamp % 2 ? -hw : hw, ly = tail ? 0.7 : hy, lz = (tail ? -1 : 1) * (car.halfL + 0.05), cr = tail ? 0.9 : 1, cg = tail ? 0.08 : 0.86, cb = tail ? 0.04 : 0.6;
        LV3.set(lx, ly, lz).applyMatrix4(tmpM); const i3 = li * 3;
        LAMP.pos[i3] = LV3.x; LAMP.pos[i3 + 1] = LV3.y; LAMP.pos[i3 + 2] = LV3.z;
        const kk = lampK * far2 * (lz < 0 ? 0.55 + car.brake * 0.9 : 1);
        LAMP.col[i3] = cr * kk; LAMP.col[i3 + 1] = cg * kk; LAMP.col[i3 + 2] = cb * kk; li++;
      }
      if (d < 260 && pi < LAMP.max) { tmpObj.position.set(car.x, car.y + 0.04, car.z); tmpObj.rotation.set(0, car.yaw, 0); tmpObj.scale.setScalar(car.type.big ? 1.2 : 1); tmpObj.updateMatrix(); LAMP.pool.setMatrixAt(pi++, tmpObj.matrix); }
    }
  }
  for (const r of IMS.values()) {
    if (r.n) { r.paint.clearUpdateRanges(); r.paintRange.count = r.n * 3; r.paint.updateRanges.push(r.paintRange); r.paint.needsUpdate = true; r.dmg.clearUpdateRanges(); r.dmgRange.count = r.n; r.dmg.updateRanges.push(r.dmgRange); r.dmg.needsUpdate = true; }
    if (r.nl) { r.farPaint.clearUpdateRanges(); r.farRange.count = r.nl * 3; r.farPaint.updateRanges.push(r.farRange); r.farPaint.needsUpdate = true; }
    r.full.count = r.n; if (r.n) r.full.instanceMatrix.needsUpdate = true;
    if (r.glass) { r.glass.count = r.n; if (r.n) r.glass.instanceMatrix.needsUpdate = true; }
    if (r.lod) { r.lod.count = r.nl; if (r.nl) r.lod.instanceMatrix.needsUpdate = true; }
  }
  WHEEL_IM.count = wi; WHEEL_IM.instanceMatrix.needsUpdate = true;
  if (LEG_IM) { LEG_IM.count = LEG_IM.count0; LEG_IM.instanceMatrix.needsUpdate = true; }
  if (DRV_IM) for (let i = 0; i < 3; i++) { DRV_IM[i].count = dc[i]; DRV_IM[i].instanceMatrix.needsUpdate = true; }
  if (LAMP.pts) {
    LAMP.pts.visible = li > 0; LAMP.pts.geometry.setDrawRange(0, li);
    if (li) { LAMP.pts.geometry.attributes.position.needsUpdate = true; LAMP.pts.geometry.attributes.color.needsUpdate = true; }
    LAMP.pool.count = pi; LAMP.pool.visible = pi > 0; if (pi) { LAMP.pool.instanceMatrix.needsUpdate = true; LAMP.pool.material.opacity = 0.5 * lampK; }
  }
  VV.lampCount = li;
}

// ---------------------------------------------------------------- period paint pick: black ~45%, then dark green / navy / maroon, tan, grey, a few two-tones
const pickPaint = (T, rnd) => {
  const P = T.paints; if (P.length < 3) return Math.floor(rnd() * P.length);
  const r = rnd(), find = (a) => { const i = P.findIndex((q) => q[0] === a); return i < 0 ? Math.floor(rnd() * P.length) : i; };
  if (r < 0.45) return find('jet');
  if (r < 0.57) return find('bottle');
  if (r < 0.69) return find('navy');
  if (r < 0.8) return find('maroon');
  if (r < 0.87) return find('tanP');
  if (r < 0.94) return find('greyP');
  return Math.floor(rnd() * P.length);
};
VV.pickPaint = pickPaint;
const NIGHT_CABS = ['taxi', 'gullcab', 'taxi', 'beaconcab'];
VV.nightCabs = () => {
  const hours = AF.time?.hours, night = hours != null && (hours > 19.6 || hours < 5.5), cam = AF.camera.position;
  for (const car of VV.ai) {
    if (car.ai?.piece.kind === 'route') continue;
    const want = night && car.id % 2 === 0 && (car.nightCab || /^(sedan|coupe|wagon|stream|convertible)$/.test(car.type.id));
    if (want === !!car.isNightCab || (car.x - cam.x) ** 2 + (car.z - cam.z) ** 2 < 12100) continue;
    if (want) { car.dayType = car.type; car.dayKey = car.key; car.type = TYPES.find(type => type.id === NIGHT_CABS[car.id % 4]); car.key = getGeo(car.type, 0).key; car.nightCab = true; }
    else { car.type = car.dayType; car.key = car.dayKey; }
    const wheel = WHEELS[car.type.id]; car.halfL = wheel.L * CVS / 2; car.halfW = wheel.W * CVS / 2; car.wr = wheel.wr * CVS; car.ws = car.wr / 0.37; car.height = VV.models[car.key].spec.H; car.wheelbase = (wheel.axles[1] - wheel.axles[0]) * CVS;
    for (let index = 0; index < car.wheels.length; index++) { const spec = car.wheels[index]; spec.lx = spec.side * (car.halfW - 0.17); spec.ly = car.wr; spec.lz = (wheel.axles[index >> 1] + 0.5) * CVS - car.halfL; }
    car.isNightCab = want; let count = 4; for (const existing of VV.cars) if (existing.type === car.type) count++; ensureIM(car.type.id, count);
  }
};

// ---------------------------------------------------------------- static kerb parking (build 480: merged into the region meshes, collide, LOD-streamed)
// wheels baked into the body model (no instanced wheels needed); one geometry per type:paint
const staticGeos = {};
const staticGeo = (tid, pi) => {
  const T = TYPES.find((t) => t.id === tid); pi = pi % T.paints.length;
  const key = tid + ':' + pi; if (staticGeos[key]) return staticGeos[key];
  const k = kcols(), pr = T.paints[pi];
  const pal = { a: k.paint[pr[0]] || k[pr[0]], b: k.paint[pr[1]] || k[pr[1]], seat: k[T.seat], f: ['deco', 'taxi', 'jet', 'cabYel', 'gull', 'beacon', 'dove'].includes(pr[0]) ? k.paint.jet : (k.paint[pr[1]] || k.paint.jet) };
  const m = T.build(pal), Wl = WHEELS[tid];
  const R = Wl.wr + 0.1;
  for (const az of Wl.axles) for (let y = 0; y < m.h; y++) for (let z = 0; z < m.d; z++) {
    const d = Math.hypot(z + 0.5 - (az + 0.5), y + 0.5 - Wl.wr); if (d > R) continue;
    for (const [x, face] of [[0, 1], [1, 0], [2, 0], [m.w - 1, 1], [m.w - 2, 0], [m.w - 3, 0]]) {
      let c = k.tyre;
      if (face && d < R - 1.1) c = k.whiteRim;
      if (face && d < R - 1.9) c = k.hub;
      if (!face && d < R - 1.1) c = k.dark;
      m.set(x, y, z, c);
    }
  }
  const g = AF.meshModel(m, { vs: CVS, anchor: [0.5, 0, 0.5] });
  return (staticGeos[key] = g);
};
VV.parkedStatic = [];
VV.placeParked = (typeId, x, z, yaw = 0, opts = {}) => {
  const random = AF.rng(opts.seed ?? ((x * 113 + z * 997) | 0)), tid = typeId ?? ['coupe', 'sedan', 'wagon', 'stream'][Math.floor(random() * 4)], T = TYPES.find(type => type.id === tid);
  if (!T || !Number.isFinite(x + z + yaw)) throw new Error('Invalid parked vehicle');
  const pi = opts.paint ?? opts.pi ?? pickPaint(T, random), rot = ((Math.round(yaw / (Math.PI / 2)) % 4) + 4) % 4, y = opts.y ?? AF.W.groundY(x, z), wheel = WHEELS[T.id];
  if (!Number.isInteger(pi) || pi < 0 || !Number.isFinite(y)) throw new Error('Invalid parked vehicle paint or height');
  const outland = x < AF.W.X0 || x >= AF.W.x1 || z < AF.W.Z0 || z >= AF.W.z1, geo = staticGeo(T.id, pi);
  if (outland && !AF.outland?.addProp) throw new Error('Outland renderer is required for parking outside the voxel grid');
  const pr = outland ? AF.outland.addProp(geo, x, y, z, rot, { collide: opts.collide !== false }) : AF.placeStatic(geo, x, y, z, rot, { collide: opts.collide !== false });
  const parked = { static: true, pr, outland, pi, x, z, y, yaw: rot * Math.PI / 2, type: T, name: T.name, kind: T.kind, parked: true, halfL: wheel.L * CVS / 2, halfW: wheel.W * CVS / 2, noDrive: opts.noDrive || T.horse };
  if (AF.ready && !outland) AF.W.dirty.add((AF.W.bx(x) >> 7) * 64 + (AF.W.bz(z) >> 7));
  VV.parkedStatic.push(parked); if (AF.ready) VV.parked.push(parked); return parked;
};
AF.onBuild('vehicles-parking', 480, () => {
  const t0 = performance.now();
  kcols();
  const rnd = AF.rng(1936), out = VV.parkedStatic;
  const ST = AF.streets || {};
  const noPark = Array.isArray(ST.noPark) ? ST.noPark.slice() : [];
  const busStops = AF.busStops || [];
  const stations = (VP.rail && VP.rail.stations) || [];
  const bays = AF.fireStationBays || [];
  const ranks = [[151.1, 24.5, 16], [6.05, -27, 12], [-121, -76, 7], [41, -76, 7], [121, -84, 7]];
  const roads = VP.roads.filter((r) => r.a && r.b);
  // junctions (crossing roads) with the crossing road's half width
  const nodes = [];
  for (const r of roads) for (const q of roads) {
    if (r === q) continue;
    const rh = r.a[1] === r.b[1], qh = q.a[1] === q.b[1]; if (rh === qh) continue;
    const x = rh ? q.a[0] : r.a[0], z = rh ? r.a[1] : q.a[1];
    const inR = rh ? (x >= Math.min(r.a[0], r.b[0]) - 1 && x <= Math.max(r.a[0], r.b[0]) + 1) : (z >= Math.min(r.a[1], r.b[1]) - 1 && z <= Math.max(r.a[1], r.b[1]) + 1);
    const inQ = qh ? (x >= Math.min(q.a[0], q.b[0]) - 1 && x <= Math.max(q.a[0], q.b[0]) + 1) : (z >= Math.min(q.a[1], q.b[1]) - 1 && z <= Math.max(q.a[1], q.b[1]) + 1);
    if (inR && inQ) nodes.push({ x, z, hw: (q.w || 10) / 2, road: r });
  }
  // v2 r2: delivery scenes — a van at the kerb outside a named shop with its rear doors open (the kerb run is kept clear for it)
  VV.deliv = [];
  for (const [re, tid] of [[/MANCINI/i, 'milk'], [/Golden Crust/i, 'mail'], [/Starlite/i, 'icecream'], [/SOLACE DELI/i, 'laundry']]) {
    const b = (AF.buildings || []).find((q) => q.name && re.test(q.name) && q.doors && q.doors.length); if (!b) continue;
    let best = null;
    for (const d of b.doors) {
      const nr = VP.nearestRoad(d.x, d.z), r = nr.road; if (!r || r.tram || !r.a) continue;
      const ax = r.a[0], az = r.a[1], ddx = r.b[0] - ax, ddz = r.b[1] - az, L = Math.hypot(ddx, ddz), ux = ddx / L, uz = ddz / L;
      const t = (d.x - ax) * ux + (d.z - az) * uz; if (t < 2 || t > L - 2) continue;
      const cx = ax + ux * t, cz = az + uz * t; let nx = d.x - cx, nz = d.z - cz; const nl = Math.hypot(nx, nz) || 1; nx /= nl; nz /= nl;
      const kerbO = (r.w || 10) / 2 - 1.0, hx = nz, hz = -nx;
      if (nl > (r.w || 10) / 2 + 9) continue;
      // slide the van along the kerb (up to 14 m) until it is clear of junctions + crosswalks (a corner shop's door is near one)
      let sh = null;
      for (const s0 of [0, 3, -3, 6, -6, 9, -9, 12, -12, 14, -14]) {
        const vx = cx + hx * (2.4 + s0), vz = cz + hz * (2.4 + s0), tv = (vx - ax) * ux + (vz - az) * uz;
        if (tv < 10 || tv > L - 10) continue;
        const jn = nodes.filter((n) => n.road === r).reduce((m, n) => Math.min(m, Math.abs((r.a[1] === r.b[1]) ? n.x - vx : n.z - vz) - n.hw), 1e9);
        if (jn >= 6.5) { sh = s0; break; }
      }
      if (sh == null) continue;
      const cx2 = cx + hx * sh, cz2 = cz + hz * sh;
      if (!best || nl + Math.abs(sh) * 0.3 < best.nl) best = { tid, nl: nl + Math.abs(sh) * 0.3, x: cx2 + nx * kerbO + hx * 2.4, z: cz2 + nz * kerbO + hz * 2.4, yaw: Math.atan2(hx, hz), hx, hz, nx, nz, door: { x: d.x, z: d.z }, name: b.name };
    }
    if (best) { VV.deliv.push(best); noPark.push({ x: best.x, z: best.z, r: 7.5 }); }
  }
  const mix = [['sedan', 30], ['stream', 9], ['coupe', 14], ['wagon', 8], ['convertible', 6], ['taxi', 3], ['gullcab', 2], ['beaconcab', 2], ['milk', 1], ['mail', 1], ['laundry', 1], ['cord', 2], ['duesy', 1], ['speedster', 1]];
  const mixT = mix.reduce((a, b) => a + b[1], 0);
  const pickType = () => { let r = rnd() * mixT; for (const [t, w] of mix) if ((r -= w) < 0) return t; return 'sedan'; };
  const probe = { halfL: 2.55, halfW: 0.92, height: 1.5, y: 0 };
  let tries = 0; const rej = {}, perRoad = {};
  const totL = roads.reduce((a, r) => a + Math.hypot(r.b[0] - r.a[0], r.b[1] - r.a[1]), 0);   // v2 r2: per-road share of the 400 cap, so the last roads get cars too
  for (const r of roads) {
    const rShare = Math.ceil(400 * Math.hypot(r.b[0] - r.a[0], r.b[1] - r.a[1]) / totL * 0.6);   // per side
    const w = r.w || 10, hor = r.a[1] === r.b[1], tram = !!r.tram;
    const dx = r.b[0] - r.a[0], dz = r.b[1] - r.a[1], L = Math.hypot(dx, dz), ux = dx / L, uz = dz / L;
    const kerb = w / 2 - 1.0;
    const fill = tram ? 0.55 : /Meridian|Grand/.test(r.name) ? 0.8 : 0.72;
    for (const side of [1, -1]) {
      let t = 6 + rnd() * 5; const rCap = out.length + rShare;
      while (t < L - 6 && out.length < 400 && out.length < rCap) {
        tries++;
        const x = r.a[0] + ux * t - uz * kerb * side, z = r.a[1] + uz * t + ux * kerb * side;
        const step = 6.3 + rnd() * 1.6;
        // clear of junctions + crosswalks (the crossing road's half width + 6 m)
        if (nodes.some((n) => n.road === r && Math.abs(hor ? n.x - x : n.z - z) < n.hw + 6.5)) { t += 2; continue; }
        if (Math.abs(x) > 292 || Math.abs(z) > 292) { t += step; continue; }
        if (/Grand/.test(r.name) && z > 8) { t += step; continue; }   // the Great White Way: kept clear for cabs, queues and theatre doors
        if (busStops.some((b) => Math.hypot(b.x - x, b.z - z) < 13)) { t += 3; continue; }
        if (stations.some((s) => { const p = s.platform; if (!p) return false; const cx = (p[0] + p[2]) / 2, cz = (p[1] + p[3]) / 2; return Math.hypot(cx - x, cz - z) < 26; })) { t += 3; continue; }
        if (bays.some((b) => Math.hypot(b.x - x, b.z - z) < 12) || ranks.some(([rx, rz, rr]) => Math.hypot(rx - x, rz - z) < rr)) { t += 3; continue; }
        if (noPark.some((q) => (q.r != null ? Math.hypot(q.x - x, q.z - z) < q.r : (x >= q[0] && x <= q[2] && z >= q[1] && z <= q[3])))) { t += 3; continue; }
        if (rnd() > fill) { t += step; continue; }        // an empty space here and there
        const yaw = Math.atan2(ux * side, uz * side);
        if (AF.W.groundY && AF.W.groundY(x, z) > 0.12) { rej.ground = (rej.ground || 0) + 1; t += step; continue; }
        if (carBlocked(probe, x, z, yaw)) { rej.blocked = (rej.blocked || 0) + 1; t += 2; continue; }
        const tid = pickType(), T = TYPES.find((q) => q.id === tid), pi = pickPaint(T, rnd);
        const gy = AF.W.groundY ? AF.W.groundY(x, z) : 0;
        VV.placeParked(tid, x, z, yaw, { paint: pi, y: gy }); perRoad[r.name] = (perRoad[r.name] || 0) + 1;
        t += step;
      }
    }
  }
  VV.parkMs = Math.round(performance.now() - t0);
  console.log('[af] parked (static):', out.length, 'models', Object.keys(staticGeos).length, 'in', VV.parkMs, 'ms', JSON.stringify(perRoad), JSON.stringify(rej));
  // every kerb car is drivable: one prompt follows the nearest parked car; using it swaps the merged prop for a real car
  const proxy = VV.parkProxy = AF.addInteract({ x: 0, y: -999, z: 0, r: 1.6, label: 'Drive', prio: 0.1, target: null,
    dist: (px, pz) => proxy.target ? bodyDist(proxy.target, px, pz) : 99,
    can: () => AF.mode === 'walk' && !!proxy.target,
    act: () => {
      const s = proxy.target; if (!s) return;
      if (!s.outland) AF.removeStatic(s.pr);
      else if (AF.outland.removeProp) AF.outland.removeProp(s.pr);
      else { const props = AF.outland.props; props.splice(props.indexOf(s.pr), 1); if (s.pr.col) AF.removeCollider(s.pr.col); AF.outland.addProp(s.pr.geo, s.x, s.y, s.z, s.pr.rot, { collide: false }); props.pop(); }
      const i = VV.parkedStatic.indexOf(s); if (i >= 0) VV.parkedStatic.splice(i, 1);
      const j = VV.parked.indexOf(s); if (j >= 0) VV.parked.splice(j, 1);
      proxy.target = null; proxy.y = -999;
      const car = makeCar(s.type.id, s.pi, s.x, s.z, s.yaw, { y: s.y }); VV.parked.push(car);
      car.temp = true; car.home = { type: s.type.id, pi: s.pi, x: s.x, z: s.z, y: s.y, yaw: s.yaw };
      AF.setMode('drive', { car });
    } });
  let pf = 0;
  AF.onTick('park-proxy', 170, () => {
    if (AF.mode !== 'walk' || (pf++ % 5)) return;
    const p = AF.player; let best = null, bd = 36;
    for (const s of VV.parkedStatic) { if (s.noDrive) continue; const d = (s.x - p.x) ** 2 + (s.z - p.z) ** 2; if (d < bd) { bd = d; best = s; } }
    proxy.target = best;
    if (best) { proxy.x = best.x; proxy.z = best.z; proxy.y = best.y + 0.6; proxy.label = 'Drive the ' + best.name; } else proxy.y = -999;
  });
});

// ---------------------------------------------------------------- v2 r2: delivery scenes (van, rear doors open, stacked goods, a roundsman carrying loads in)
const DLV = VV.delivery = [];
function roundsmanGeo(k, coat, cap, load, pose) {   // vs 1/16, +z facing; pose 0 stand, 1/2 stride; load: null | colour pair
  const m = new AF.Model(12, 31, 14), vs = 1 / 16, q = (v) => Math.round(v / vs);
  const B = (x0, y0, z0, x1, y1, z1, c) => m.box(q(x0 + 0.375), q(y0), q(z0 + 0.375), q(x1 + 0.375), q(y1), q(z1 + 0.375), c);
  const f = pose === 0 ? 0 : pose === 1 ? 1 : -1;
  B(-0.17, 0, -0.07 + f * 0.13, -0.03, 0.07, 0.15 + f * 0.13, k.black); B(0.03, 0, -0.07 - f * 0.13, 0.17, 0.07, 0.15 - f * 0.13, k.black);
  B(-0.16, 0.07, -0.07 + f * 0.1, -0.03, 0.82, 0.07 + f * 0.1, k.dark); B(0.03, 0.07, -0.07 - f * 0.1, 0.16, 0.82, 0.07 - f * 0.1, k.dark);
  B(-0.2, 0.62, -0.11, 0.2, 1.38, 0.11, coat);                                             // white / tan work coat
  if (load) {
    B(-0.28, 0.98, -0.04, -0.2, 1.36, 0.3, coat); B(0.2, 0.98, -0.04, 0.28, 1.36, 0.3, coat);   // arms forward
    B(-0.26, 0.9, 0.12, 0.26, 1.2, 0.5, load[0]); B(-0.22, 1.2, 0.16, 0.22, 1.26, 0.46, load[1]);  // the load, at chest height
  } else {
    B(-0.28, 0.84, -0.05 - f * 0.1, -0.2, 1.36, 0.06 - f * 0.1, coat); B(0.2, 0.84, -0.05 + f * 0.1, 0.28, 1.36, 0.06 + f * 0.1, coat);
    B(-0.28, 0.76, -0.05 - f * 0.12, -0.2, 0.84, 0.06 - f * 0.12, k.skin); B(0.2, 0.76, -0.05 + f * 0.12, 0.28, 0.84, 0.06 + f * 0.12, k.skin);
  }
  const hy = 1.38;
  B(-0.05, hy, -0.05, 0.05, hy + 0.05, 0.05, k.skin); B(-0.11, hy + 0.05, -0.1, 0.11, hy + 0.29, 0.11, k.skin);
  B(-0.07, hy + 0.18, 0.11, -0.03, hy + 0.21, 0.12, k.black); B(0.03, hy + 0.18, 0.11, 0.07, hy + 0.21, 0.12, k.black);
  B(-0.12, hy + 0.08, -0.12, 0.12, hy + 0.27, -0.08, k.hair);
  B(-0.13, hy + 0.25, -0.13, 0.13, hy + 0.36, 0.13, cap); B(-0.13, hy + 0.25, 0.1, 0.13, hy + 0.28, 0.24, cap === k.white ? k.black : cap);   // peaked cap
  return AF.meshModel(m, { vs, anchor: [0.5, 0, 0.5] });
}
function buildDelivery(D) {
  const k = kcols(), T = TYPES.find((t) => t.id === D.tid), G = getGeo(T, 0), A = G.pal.a;
  const van = makeCar(D.tid, 0, D.x, D.z, D.yaw); van.parked = true; VV.parked.push(van); D.van = van;
  const grp = new THREE.Group(); grp.position.set(D.x, van.y, D.z); grp.rotation.y = D.yaw; grp.name = 'delivery'; AF.scene.add(grp); D.grp = grp;
  // rear doors swung open (hinged at the rear corners)
  const lm = new AF.Model(9, 20, 1);
  for (let x = 0; x < 9; x++) for (let y = 0; y < 20; y++) lm.set(x, y, 0, (y > 11 && y < 17 && x > 1 && x < 8) ? k.glass : A);
  lm.set(7, 9, 0, k.chrome);
  const lg = AF.meshModel(lm, { vs: CVS, anchor: [0.5, 0, 0.5] });
  for (const sg of [1, -1]) {
    const piv = new THREE.Group(); piv.position.set(sg * 0.9, 0.3, -2.2); piv.rotation.y = sg * -1.9;
    const leaf = AF.modelMesh(lg); leaf.position.set(-sg * 0.45, 0, 0); piv.add(leaf); grp.add(piv);
  }
  // goods stacked on the sidewalk by the tailboard
  const load = D.tid === 'milk' ? [k.crate, k.milk] : D.tid === 'mail' ? [k.woodL, k.paint.bread] : D.tid === 'icecream' ? [k.paint.ice, k.white] : [k.canvas, k.white];
  const sm = new AF.Model(10, 16, 18);
  for (let i = 0; i < 3; i++) for (let j = 0; j < (i === 2 ? 2 : 3); j++) { const z0 = i * 6, y0 = j * 5; sm.box(1, y0, z0, 9, y0 + 4, z0 + 5, load[0]); for (let x = 2; x < 9; x += 2) for (let z = z0 + 1; z < z0 + 5; z += 2) sm.set(x, y0 + 4, z, load[1]); }
  const stack = AF.modelMesh(AF.meshModel(sm, { vs: 1 / 16, anchor: [0.5, 0, 0.5] }));
  stack.position.set(-1.75, 0.25 - van.y + AF.surfaceBelow(D.x + D.nx * 1.75, D.z + D.nz * 1.75, 1.5, 3), -2.6); grp.add(stack);
  // the roundsman: carries a load from the tailboard to the shop door and walks back empty
  const coat = D.tid === 'milk' ? k.white : D.tid === 'mail' ? k.canvas : D.tid === 'icecream' ? k.shirt : k.shirt3, cap = D.tid === 'milk' ? k.white : D.tid === 'icecream' ? k.hat2 : k.hat;
  D.geos = [0, 1, 2].map((p) => roundsmanGeo(k, coat, cap, load, p)).concat([0, 1, 2].map((p) => roundsmanGeo(k, coat, cap, null, p)));
  D.man = new THREE.Mesh(D.geos[0], AF.mat.voxel); D.man.castShadow = true; D.man.receiveShadow = true; D.man.name = 'roundsman'; AF.scene.add(D.man);
  const P0 = [D.x - D.hx * 2.95 + D.nx * 0.2, D.z - D.hz * 2.95 + D.nz * 0.2], P1 = [D.x - D.hx * 2.95 + D.nx * 1.8, D.z - D.hz * 2.95 + D.nz * 1.8];
  D.route = [P0, P1, [D.door.x, D.door.z]]; D.st = 0; D.t = 1 + Math.random(); D.i = 0; D.px = P0[0]; D.pz = P0[1]; D.yaw0 = D.yaw; D.ph = 0; D.gy = van.y;
  DLV.push(D);
}
const stepDelivery = (dt) => {
  const cam = AF.camera && AF.camera.position;
  for (const D of DLV) {
    if (cam && (D.x - cam.x) ** 2 + (D.z - cam.z) ** 2 > 180 * 180) { D.man.visible = false; continue; }
    D.man.visible = true;
    let pose = 0; const carry = D.st <= 1;   // 0 pick up at the tailboard, 1 walk in, 2 hand over at the door, 3 walk back
    if (D.st === 0 || D.st === 2) { D.t -= dt; if (D.t <= 0) { D.st = (D.st + 1) % 4; D.i = D.st === 1 ? 1 : 1; } }
    else {
      const path = D.route, idx = D.st === 1 ? D.i : path.length - 1 - D.i, tx = path[idx][0], tz = path[idx][1];
      const dx = tx - D.px, dz = tz - D.pz, d = Math.hypot(dx, dz), sp = (carry ? 0.95 : 1.25) * dt;
      if (d <= sp) { D.px = tx; D.pz = tz; D.i++; if (D.i >= path.length) { D.st = (D.st + 1) % 4; D.t = D.st === 2 ? 1.6 : 1.2; } }
      else { D.px += dx / d * sp; D.pz += dz / d * sp; D.yaw0 = Math.atan2(dx, dz); }
      D.ph += dt * 1.8; const ph = Math.floor(D.ph * 2) % 4; pose = ph === 0 ? 1 : ph === 2 ? 2 : 0;
      if ((D.gt = (D.gt || 0) - dt) <= 0) { D.gt = 0.25; D.gy = AF.surfaceBelow(D.px, D.pz, 1.6, 3); }
    }
    if (D.st === 0) D.yaw0 = D.yaw;                    // faces the tailboard while he lifts
    D.man.geometry = D.geos[(carry ? 0 : 3) + pose];
    D.man.position.set(D.px, D.gy + (pose ? 0.025 : 0), D.pz); D.man.rotation.y = D.yaw0;
  }
};

// ---------------------------------------------------------------- build
AF.onBuild('vehicles', 600, async () => {
  const t0 = performance.now();
  kcols();
  VV.stepPush = stepPush; VV.worldHits = worldHits; VV.overlap = overlap;
  const park = (tid, pi, x, z, yaw) => { const c = makeCar(tid, pi, x, z, yaw); VV.parked.push(c); return c; };
  // cab ranks (drivable): Union Terminal (Terminal Ave, west kerb) + the Grand Solace Hotel (Grand Ave); one of each company
  const rankCabs = ['taxi', 'gullcab', 'taxi', 'beaconcab', 'taxi', 'gullcab', 'taxi'];
  [[151.1, 14, 0], [151.1, 21, 0], [151.1, 28, 0], [151.1, 35, 0], [6.05, -20, Math.PI], [6.05, -27, Math.PI], [6.05, -34, Math.PI]].forEach(([x, z, yaw], i) => { const probe = { halfL: 2.6, halfW: 0.9, height: 1.5, y: 0 }; if (!carBlocked(probe, x, z, yaw)) park(rankCabs[i], 0, x, z, yaw); });
  // a few drivable private cars on Charter St (the drive-mode demo cars)
  for (const [tid, pi, x, z, yaw] of [['coupe', 0, -121, -75.95, Math.PI / 2], ['stream', 0, 41, -75.95, Math.PI / 2], ['convertible', 0, 121, -84.05, -Math.PI / 2]]) { const probe = { halfL: 2.6, halfW: 0.9, height: 1.5, y: 0 }; if (!carBlocked(probe, x, z, yaw)) park(tid, pi, x, z, yaw); }
  // fire engine in the Engine Co. 7 bay (residential publishes AF.fireStationBays; else parked on Wren St)
  const bays = AF.fireStationBays || (AF.CIV && AF.CIV.fireBays) || [{ x: -236.5, z: -40, yaw: 0 }];
  const b0 = bays[0];
  const ft = park('firetruck', 0, b0.x, b0.z, b0.yaw ?? 0);
  ft.y = AF.surfaceBelow(ft.x, ft.z, 2.5, 6); placeMesh(ft);
  // AI traffic (all instanced, so the city can carry a real fleet)
  VV.cabDrops = [];
  for (const re of [/Grand Solace/i, /^The Paragon$/i, /Blue Heron/i, /Rialto/i, /Union Terminal/i]) {
    const b = (AF.buildings || []).find((q) => q.name && re.test(q.name) && q.doors && q.doors.length); if (!b) continue;
    const d = b.doors[0], ix = d.x + Math.sin(d.yaw || 0) * 1.6, iz = d.z + Math.cos(d.yaw || 0) * 1.6;
    VV.cabDrops.push({ name: b.name, x: d.x, z: d.z, ix, iz, cd: 0 });
  }
  VV.buildTraffic();
  for (const D of (VV.deliv || [])) { try { buildDelivery(D); } catch (e) { console.warn('[af] delivery', D.name, e); } }
  // the static kerb cars count as parked for the probes (after the drivable ones, so find() hits a drivable car first)
  for (const c of VV.parkedStatic) VV.parked.push(c);
  // instanced bodies (sized to the fleet), wheels, drivers, lamps
  const per = {}; for (const c of VV.cars) per[c.type.id] = (per[c.type.id] || 0) + 1;
  for (const key in per) ensureIM(key, per[key] + 2);
  const nW = VV.cars.reduce((n, c) => n + c.wheels.length, 0) + 16;
  WHEEL_IM = new THREE.InstancedMesh(wheelGeo(), AF.mat.voxelInst, nW + 64); WHEEL_IM.customDepthMaterial = AF.mat.depthInst; WHEEL_IM.userData.max = nW + 64;
  WHEEL_IM.castShadow = true; WHEEL_IM.receiveShadow = true; WHEEL_IM.frustumCulled = false;
  AF.scene.add(WHEEL_IM);
  LEG_IM = new THREE.InstancedMesh(legGeo(), AF.mat.voxelInst, 64); LEG_IM.customDepthMaterial = AF.mat.depthInst; LEG_IM.userData.max = 64; LEG_IM.castShadow = true; LEG_IM.receiveShadow = true; LEG_IM.frustumCulled = false; LEG_IM.count = 0; LEG_IM.count0 = 0; LEG_IM.name = 'horse-legs'; AF.scene.add(LEG_IM);
  DRV_IM = driverGeos().map((g) => { const im = new THREE.InstancedMesh(g, AF.mat.voxelInst, 120); im.customDepthMaterial = AF.mat.depthInst; im.userData.max = 120; im.castShadow = true; im.frustumCulled = false; im.count = 0; AF.scene.add(im); return im; });
  buildLamps(VV.cars.length + 8);
  syncInstances(0);
  VV.buildMs = Math.round(performance.now() - t0);
  console.log('[af] vehicles:', VV.cars.length, 'cars (', VV.ai.length, 'AI ) + static parked', VV.parkedStatic.length, 'models', Object.keys(VV.models).length, 'lanes', VV.graph.lanes.length, 'conns', VV.graph.conns.length, 'in', VV.buildMs, 'ms', 'deliveries', DLV.map((D) => D.name + '@' + D.x.toFixed(0) + ',' + D.z.toFixed(0)).join(' | '));
});
AF.onTick('traffic', 200, (dt) => {
  if (!WHEEL_IM) return;
  VV.simTraffic(Math.min(dt, 0.05));
  syncInstances(dt);
  stepDelivery(Math.min(dt, 0.05));
});

// ---------------------------------------------------------------- tests
AF.test('vehicles: 60+ AI cars run 60 s (no NaN, stay on the asphalt)', () => {
  if (VV.ai.length < 60) return { ok: false, info: 'ai cars ' + VV.ai.length };
  let worst = 0, nan = 0, moved = 0;
  const start = VV.ai.map((c) => [c.x, c.z]);
  const clock = AF.clock.t;
  try { for (let i = 0; i < 1800; i++) {
    AF.clock.t += 1 / 30; VV.simTraffic(1 / 30);
    if (i % 10 === 0) for (const c of VV.ai) { if (!isFinite(c.x) || !isFinite(c.z) || !isFinite(c.yaw)) nan++; else if (c.ai.piece.kind !== 'route') worst = Math.max(worst, VP.nearestRoad(c.x, c.z).edge + 1); }
  } } finally { AF.clock.t = clock; }
  VV.ai.forEach((c, i) => { if (Math.hypot(c.x - start[i][0], c.z - start[i][1]) > 20) moved++; });
  const live = VV.ai.filter((c) => c.active !== false).length;
  syncInstances(0);
  return { ok: nan === 0 && worst < 1.3 && moved >= live * 0.6, info: `nan ${nan}, max past kerb+1 ${worst.toFixed(2)} m, moved ${moved}/${live} active of ${VV.ai.length}` };
});
AF.test('vehicles: drive mode enter + exit returns to walk', () => {
  const prev = AF.mode;
  const car = VV.parked.find((c) => !c.static && c.type.id === 'coupe');
  if (!car || !AF.modes.walk) return { ok: false, info: 'no car or no walk mode' };
  AF.setMode('drive', { car });
  const inDrive = AF.mode === 'drive' && DR.car === car;
  VV.autoInput = { up: false, down: false, left: 0, right: 0, brake: true };
  for (let i = 0; i < 10; i++) AF.modes.drive.update(1 / 60);
  VV.autoInput = null;
  VV.exitCar();
  const ok = inDrive && AF.mode === 'walk' && !car.player && car.parked;
  if (prev && prev !== 'walk' && AF.modes[prev]) AF.setMode(prev);
  return { ok, info: `drive ${inDrive}, now ${AF.mode}` };
});
AF.test('vehicles: player bump displaces AI and can drive away', () => {
  const source = VV.cars.find((car) => !car.type.big && car.type.kind === 'car');
  if (!source) return { ok: false, info: 'no car' };
  const savedCars = VV.cars, savedStatic = VV.parkedStatic, savedBlocked = AF.boxBlocked, savedSurface = AF.surfaceBelow, savedEmit = AF.emit;
  const player = Object.assign({}, source, { mesh: new THREE.Object3D(), interact: null, ai: null, player: true, x: 10000, z: 0, y: 0, yaw: 0, vx: 0, vz: 10, v: 10, steer: 0, bob: 0, bobV: 0, pitch: 0, roll: 0, pushLife: 0, crunchCd: 0, hitT: 0 });
  const lane = { kind: 'lane', pts: [10000, 5, 10000, 1005], cum: [0, 1000], len: 1000, next: [], B: { light: false } };
  const other = Object.assign({}, player, { mesh: new THREE.Object3D(), id: player.id + 1, player: false, parked: false, z: 5, v: 2, vx: 0, vz: 0, ai: { piece: lane, s: 0, v: 2, v0: 2, next: null, stuck: 0, ghost: 0 } });
  const input = { up: true, down: false, left: 0, right: 0, brake: false };
  let offset = 0, afterContact = 0, forward = 0, reverse = 0;
  try {
    VV.cars = [player, other]; VV.parkedStatic = [];
    AF.boxBlocked = () => false; AF.surfaceBelow = () => 0; AF.emit = () => {};
    for (let frame = 0; frame < 120; frame++) {
      physics(player, 1 / 60, input); VV.aiStep(other, 1 / 60);
      offset = Math.max(offset, Math.hypot(other.ai.offsetX || 0, other.ai.offsetZ || 0));
      if (frame === 89) afterContact = player.z;
    }
    forward = player.z - afterContact;
    input.up = false; input.down = true;
    for (let frame = 0; frame < 120; frame++) physics(player, 1 / 60, input);
    const reverseStart = player.z;
    for (let frame = 0; frame < 60; frame++) physics(player, 1 / 60, input);
    reverse = reverseStart - player.z;
    return { ok: player.hitT > 0 && offset > 0.05 && forward > 0.1 && reverse > 0.5 && Number.isFinite(player.z), info: `hits ${player.hitT}, push ${offset.toFixed(2)}, forward ${forward.toFixed(2)}, reverse ${reverse.toFixed(2)}` };
  } finally { VV.cars = savedCars; VV.parkedStatic = savedStatic; AF.boxBlocked = savedBlocked; AF.surfaceBelow = savedSurface; AF.emit = savedEmit; }
});
AF.test('vehicles: player car cannot pass through a wall', () => {
  // a temporary voxel wall across Charter Street at x = 200; drive east into it from x = 185
  const car = VV.parked.find((c) => !c.static && (c.type.id === 'coupe' || c.type.id === 'stream' || c.type.id === 'sedan'));
  if (!car) return { ok: false, info: 'no parked car' };
  const save = { x: car.x, z: car.z, y: car.y, yaw: car.yaw, pitch: car.pitch, roll: car.roll };
  AF.W.fill(200, 0.25, -86, 201, 3, -74, AF.col('stone'));
  const tx = 185, tz = -80;
  car.x = tx; car.z = tz; car.yaw = Math.PI / 2; car.vx = car.vz = 0; car.v = 0; car.y = AF.surfaceBelow(tx, tz, 3, 5);
  car.player = true;
  let passed = false;
  for (let i = 0; i < 300; i++) { physics(car, 1 / 60, { up: true, down: false, left: 0, right: 0, brake: false }); if (car.x + car.halfL > 200.4) passed = true; }
  const info = `stopped at ${car.x.toFixed(2)}, ${car.z.toFixed(2)} v ${car.v.toFixed(2)}`;
  AF.W.clear(200, 0.25, -86, 201, 3, -74);
  Object.assign(car, save); car.player = false; car.v = car.vx = car.vz = 0; placeMesh(car);
  return { ok: !passed, info };
});

} catch (e) { AF.partError('50-vehicles.js', e); }

