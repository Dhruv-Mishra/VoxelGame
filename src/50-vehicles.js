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
  dairycart: { axles: [], wr: 5.6, L: 66, W: 16 }, sidecar: { axles: [], wr: 3.4, L: 24, W: 16 }, icecart: { axles: [], wr: 5.6, L: 66, W: 16 },
  speedster: { axles: [11, 41], wr: 3.8, L: 52, W: 18 }, duesy: { axles: [10, 46], wr: 3.9, L: 58, W: 18 }, arrow: { axles: [9, 39], wr: 3.8, L: 50, W: 16 }, cord: { axles: [10, 40], wr: 3.6, L: 52, W: 18 },
  moto: { axles: [], wr: 3.4, L: 22, W: 6, wb: 1.5 },
};
// distance from (px,pz) to a car's footprint (0 inside): you are "at" a car when you are next to its body, not its middle
const bodyDist = (car, px, pz) => { const s = Math.sin(car.yaw), c = Math.cos(car.yaw), rx = px - car.x, rz = pz - car.z; const lx = rx * c - rz * s, lz = rx * s + rz * c; return Math.hypot(Math.max(0, Math.abs(lx) - car.halfW), Math.max(0, Math.abs(lz) - car.halfL)); };
VV.bodyDist = bodyDist;
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
  const car = {
    id: VV.cars.length, type: T, name: T.name, mesh, x, z, y: 0, yaw, pitch: 0, roll: 0, v: 0, vx: 0, vz: 0, steer: 0, spin: 0,
    halfL, halfW, wr, ws, wheels, wheelbase: Wl.wb || (Wl.axles.length > 1 ? (Wl.axles[1] - Wl.axles[0]) * CVS : 2.4), gait: Math.random() * 6, height: G.spec.H,
    ai: null, parked: true, player: false, driver: -1, bob: 0, bobV: 0, sway: 0, key: G.key, vPrev: 0, brake: 0,
  };
  car.y = AF.surfaceBelow(x, z, (o.y ?? 0) + 2.5, 6);
  VV.cars.push(car);
  if (!o.noDrive && !T.horse) car.interact = AF.addInteract({ x, y: car.y + 0.6, z, r: 1.6, label: (T.kind === 'bike' ? 'Ride the ' : 'Drive the ') + T.name, dist: (px, pz) => bodyDist(car, px, pz), prio: 0.1,
    can: () => AF.mode === 'walk' && !car.player && (!car.ai || Math.abs(car.v) < 0.6), act: () => AF.setMode('drive', { car }) });
  placeMesh(car);
  return car;
}
function placeMesh(car) {
  const m = car.mesh;
  m.position.set(car.x, car.y + car.bob, car.z);
  m.rotation.set(car.pitch, car.yaw, car.roll, 'YXZ');
  m.updateMatrix();
}

// ---------------------------------------------------------------- lane graph
const G = VV.graph = { nodes: [], lanes: [], conns: [], pieces: [] };
function buildGraph() {
  const segs = [];
  for (const r of VP.roads) {
    if (r.name === 'Harvest Road' || r.name === 'Lakeshore Drive') continue;
    let a = r.a.slice(), b = r.b.slice();
    if (r.name === 'Covered Bridge Road') b = [178, 0];
    if (r.name === 'Depot Road') b = [0, 158];
    segs.push({ a, b, name: r.name, w: r.w || 10 });
  }
  const pts = [];
  const addPt = (p) => { if (!pts.some((q) => Math.hypot(q[0] - p[0], q[1] - p[1]) < 0.5)) pts.push(p); };
  for (const s of segs) { addPt(s.a); addPt(s.b); }
  const edges = [];
  for (const s of segs) {
    const dx = s.b[0] - s.a[0], dz = s.b[1] - s.a[1], L2 = dx * dx + dz * dz;
    const cuts = [0, 1];
    for (const p of pts) {
      const t = ((p[0] - s.a[0]) * dx + (p[1] - s.a[1]) * dz) / L2;
      if (t <= 0.001 || t >= 0.999) continue;
      if (Math.hypot(s.a[0] + dx * t - p[0], s.a[1] + dz * t - p[1]) < 0.5) cuts.push(t);
    }
    cuts.sort((p, q) => p - q);
    for (let i = 0; i + 1 < cuts.length; i++) edges.push({ a: [s.a[0] + dx * cuts[i], s.a[1] + dz * cuts[i]], b: [s.a[0] + dx * cuts[i + 1], s.a[1] + dz * cuts[i + 1]], name: s.name, w: s.w });
  }
  const nodeOf = (p) => { let n = G.nodes.find((q) => Math.hypot(q.x - p[0], q.z - p[1]) < 0.5); if (!n) { n = { x: p[0], z: p[1], id: G.nodes.length, inL: [], outL: [], deg: 0 }; G.nodes.push(n); } return n; };
  for (const e of edges) { e.A = nodeOf(e.a); e.B = nodeOf(e.b); e.A.deg++; e.B.deg++; e.A.wmax = Math.max(e.A.wmax || 0, e.w); e.B.wmax = Math.max(e.B.wmax || 0, e.w); }
  const lights = (AF.trafficLight && AF.trafficLight.at) || [];
  for (const n of G.nodes) n.light = lights.some((l) => Math.hypot(l[0] - n.x, l[1] - n.z) < 1);
  const setback = (n) => (n.wmax || 10) / 2 + (n.deg >= 3 ? 4.5 : 3);
  const samplePiece = (pc) => {
    const cum = [0]; for (let i = 1; i < pc.pts.length / 2; i++) cum.push(cum[i - 1] + Math.hypot(pc.pts[i * 2] - pc.pts[i * 2 - 2], pc.pts[i * 2 + 1] - pc.pts[i * 2 - 1]));
    pc.cum = cum; pc.len = cum[cum.length - 1]; pc.id = G.pieces.length; G.pieces.push(pc); return pc;
  };
  for (const e of edges) {
    const off = e.w >= 20 ? 6.5 : e.w >= 14 ? 3.2 : 2.2;
    for (const [A, B] of [[e.A, e.B], [e.B, e.A]]) {
      const L = Math.hypot(B.x - A.x, B.z - A.z), dx = (B.x - A.x) / L, dz = (B.z - A.z) / L, rx = -dz, rz = dx;
      const sa = setback(A), sb = setback(B);
      const pc = samplePiece({ kind: 'lane', A, B, dx, dz, off, name: e.name, pts: [A.x + dx * sa + rx * off, A.z + dz * sa + rz * off, B.x - dx * sb + rx * off, B.z - dz * sb + rz * off], next: [] });
      G.lanes.push(pc); A.outL.push(pc); B.inL.push(pc);
    }
  }
  for (const n of G.nodes) {
    for (const li of n.inL) for (const lo of n.outL) {
      const uturn = lo.B === li.A;
      if (uturn && n.deg > 1) continue;
      const P0 = [li.pts[2], li.pts[3]], P3 = [lo.pts[0], lo.pts[1]];
      const d0 = [li.dx, li.dz], d3 = [lo.dx, lo.dz];
      const cross = d0[0] * d3[1] - d0[1] * d3[0], dot = d0[0] * d3[0] + d0[1] * d3[1];
      const dist = Math.hypot(P3[0] - P0[0], P3[1] - P0[1]);
      const kk = uturn ? 5.5 : dist * 0.5;
      const P1 = [P0[0] + d0[0] * kk, P0[1] + d0[1] * kk], P2 = [P3[0] - d3[0] * kk, P3[1] - d3[1] * kk];
      const pts = [];
      const N = dot > 0.9 ? 2 : 14;
      for (let i = 0; i <= N; i++) {
        const t = i / N, u = 1 - t;
        if (N === 2 && i === 1) continue;
        pts.push(u * u * u * P0[0] + 3 * u * u * t * P1[0] + 3 * u * t * t * P2[0] + t * t * t * P3[0], u * u * u * P0[1] + 3 * u * u * t * P1[1] + 3 * u * t * t * P2[1] + t * t * t * P3[1]);
      }
      // turn type: in this frame (x east, z south) a right turn has cross < 0? right of (dx,dz) is (-dz,dx): d3 = right -> cross = dx*dx - dz*(-dz) ... = 1 > 0
      const turn = uturn ? 'u' : dot > 0.9 ? 'straight' : cross > 0 ? 'right' : 'left';
      const pc = samplePiece({ kind: 'conn', node: n, turn, from: li, to: lo, pts, next: [lo], turnV: turn === 'straight' ? 99 : turn === 'right' ? 5 : turn === 'left' ? 6.5 : 3.2 });
      li.next.push(pc); G.conns.push(pc);
    }
  }
}
const pieceAt = (pc, s, out) => {
  const c = pc.cum, n = c.length;
  let i = 1; while (i < n - 1 && c[i] < s) i++;
  const s0 = c[i - 1], s1 = c[i], t = s1 > s0 ? AF.clamp((s - s0) / (s1 - s0), 0, 1) : 0;
  const x0 = pc.pts[(i - 1) * 2], z0 = pc.pts[(i - 1) * 2 + 1], x1 = pc.pts[i * 2], z1 = pc.pts[i * 2 + 1];
  const L = Math.hypot(x1 - x0, z1 - z0) || 1;
  out.x = x0 + (x1 - x0) * t; out.z = z0 + (z1 - z0) * t; out.dx = (x1 - x0) / L; out.dz = (z1 - z0) / L;
  return out;
};

// ---------------------------------------------------------------- AI traffic
const PP = { x: 0, z: 0, dx: 0, dz: 1 };
const pickNext = (pc, rnd) => {
  const opts = pc.next; if (!opts.length) return null;
  const straight = opts.find((o) => o.turn === 'straight');
  if (straight && rnd() < 0.55) return straight;
  return opts[Math.floor(rnd() * opts.length)];
};
const trafficRnd = AF.rng(1952);
const PED = { ped: true };
function aiStep(car, dt, all) {
  const A = car.ai; let pc = A.piece;
  if (!A.next) A.next = pickNext(pc, trafficRnd);
  const toEnd = pc.len - A.s;
  let vT = A.v0;
  // intersections: slow for the coming turn
  if (pc.kind === 'lane' && A.next) {
    const nv = A.next.turnV;
    if (nv < vT) vT = Math.min(vT, Math.sqrt(nv * nv + 2 * 2.2 * Math.max(0, toEnd - 1)));
    // traffic light
    if (pc.B.light && AF.trafficLight && typeof AF.trafficLight.state === 'function') {
      const st = AF.trafficLight.state(pc.B.x, pc.B.z, [pc.dx, pc.dz]);
      const stopD = toEnd - car.halfL + 0.4;
      if (st !== 'green' && stopD > -0.3) {
        const need = (A.v * A.v) / (2 * Math.max(0.1, stopD));
        if (st === 'red' || need < 4.5) { vT = Math.min(vT, stopD < 0.25 ? 0 : Math.sqrt(2 * 3.5 * Math.max(0, stopD - 0.2))); A.light = true; }
      }
    }
  } else if (pc.kind === 'conn') vT = Math.min(vT, pc.turnV);
  // double-deckers pull up at AF.busStops (streets part) for a few seconds
  if (car.type.id === 'bus' && AF.busStops && AF.busStops.length) {
    A.busCd = (A.busCd || 0) - dt;
    if (A.dwell > 0) { A.dwell -= dt; vT = 0; if (A.dwell <= 0) A.busCd = 25; }
    else if (A.busCd <= 0 && pc.kind === 'lane') {
      const hx0 = Math.sin(car.yaw), hz0 = Math.cos(car.yaw);
      for (const b of AF.busStops) {
        const rx = b.x - car.x, rz = b.z - car.z, al = rx * hx0 + rz * hz0, lat = Math.abs(rx * hz0 - rz * hx0);
        if (al > -0.5 && al < 18 && lat < 4.5) { vT = Math.min(vT, Math.sqrt(2 * 1.8 * Math.max(0, al - 0.5))); if (al < 1.2) { A.dwell = 7; vT = 0; busRiders(car); } break; }
      }
    }
  }
  // v2 r2: cabs pull up outside the hotel / theatres / the Terminal, a fare steps out and walks in
  if (car.type.cab && VV.cabDrops && VV.cabDrops.length) {
    A.cabCd = (A.cabCd || 20 + trafficRnd() * 40) - dt;
    if (A.drop > 0) { A.drop -= dt; vT = 0; if (A.drop <= 0) A.cabCd = 70 + trafficRnd() * 60; }
    else if (A.cabCd <= 0 && pc.kind === 'lane') {
      const hx0 = Math.sin(car.yaw), hz0 = Math.cos(car.yaw);
      for (const q of VV.cabDrops) {
        if (q.cd > VV.clockT) continue;
        const rx = q.x - car.x, rz = q.z - car.z, al = rx * hx0 + rz * hz0, lat = -(rx * hz0 - rz * hx0);   // lat > 0: on the right (kerb) side
        if (al > -0.5 && al < 20 && lat > 1 && lat < 9) {
          vT = Math.min(vT, Math.sqrt(2 * 2.2 * Math.max(0, al - 0.3)));
          if (al < 1) { A.drop = 6; vT = 0; q.cd = VV.clockT + 25 + trafficRnd() * 25; cabFare(car, q); }
          break;
        }
      }
    }
  }
  // obstacles ahead (cars, the player)
  const hx = Math.sin(car.yaw), hz = Math.cos(car.yaw);
  let gap = 1e9, blocker = null;
  for (const o of all) {
    if (o === car) continue;
    const rx = o.x - car.x, rz = o.z - car.z;
    if (rx * rx + rz * rz > 900) continue;
    const fwd = rx * hx + rz * hz; if (fwd <= 0) continue;
    const lat = Math.abs(rx * hz - rz * hx);
    const ohx = Math.sin(o.yaw), ohz = Math.cos(o.yaw), align = ohx * hx + ohz * hz;
    const tol = 1.25 + Math.abs(align) * 0.25 + (1 - Math.abs(align)) * (o.halfL * 0.9);
    if (lat > tol) continue;
    if (A.ghost > 0 && (align < 0.7 || A.ghostAll)) continue;
    if (o.ai && o.ai.blocker === car && align < 0.7 && car.id < o.id) continue;   // mutual crossing standoff: lower id goes
    const g = fwd - car.halfL - (Math.abs(align) > 0.5 ? o.halfL : o.halfW);
    if (g < gap) { gap = g; blocker = o; }
  }
  const P = AF.player;
  if (P && AF.mode === 'walk') {
    const px = P.body ? P.body.x : P.x, pz = P.body ? P.body.z : P.z;
    const rx = px - car.x, rz = pz - car.z, fwd = rx * hx + rz * hz;
    if (fwd > 0 && fwd < 16 && Math.abs(rx * hz - rz * hx) < 1.7) { const g = fwd - car.halfL - 0.4; if (g < gap) { gap = g; blocker = P; } }
  }
  // residents crossing ahead (only cars near the camera; cheap distance test; give up after 7 s so nobody jams)
  const cam = AF.camera && AF.camera.position, PPL = AF.people;
  if (PPL && PPL.length && cam && (car.x - cam.x) ** 2 + (car.z - cam.z) ** 2 < 22500 && !(A.pedIgnore > 0)) {
    let pedG = 1e9;
    for (const q of PPL) {
      if (!q || q.hidden || q.visible === false || !isFinite(q.x)) continue;
      const rx = q.x - car.x, rz = q.z - car.z; if (rx * rx + rz * rz > 256) continue;
      const fwd = rx * hx + rz * hz; if (fwd <= 0) continue;
      if (Math.abs(rx * hz - rz * hx) < car.halfW + 0.8) { const g = fwd - car.halfL - 0.6; if (g < pedG) pedG = g; }
    }
    if (pedG < gap) { gap = pedG; blocker = PED; }
  }
  // v2 r2: streetcar / bus riders crossing to the sidewalk (AF.rail.walkers) — every car yields, not just the ones near the camera
  const WKL = AF.rail && AF.rail.walkers && AF.rail.walkers.list;
  if (WKL && !(A.pedIgnore > 0)) {
    let pedG = 1e9;
    for (const q of WKL) {
      if (q.st !== 'walk') continue;
      const rx = q.x - car.x, rz = q.z - car.z; if (rx * rx + rz * rz > 256) continue;
      const fwd = rx * hx + rz * hz; if (fwd <= 0) continue;
      if (Math.abs(rx * hz - rz * hx) < car.halfW + 1.0) { const g = fwd - car.halfL - 0.8; if (g < pedG) pedG = g; }
    }
    if (pedG < gap) { gap = pedG; blocker = PED; }
  }
  if (A.pedIgnore > 0) A.pedIgnore -= dt;
  if (blocker === PED && A.v < 0.2) { A.pedWait = (A.pedWait || 0) + dt; if (A.pedWait > 7) { A.pedIgnore = 3; A.pedWait = 0; } } else if (blocker !== PED) A.pedWait = 0;
  A.blocker = blocker;
  if (blocker) vT = Math.min(vT, gap < 1.2 ? 0 : Math.sqrt(2 * 4 * Math.max(0, gap - 1.2)));
  // stuck -> briefly ignore crossing traffic
  if (A.v < 0.2 && blocker && blocker !== P && blocker !== PED && !A.light) { A.stuck += dt; A.stuckLong = (A.stuckLong || 0) + dt; if (A.stuck > 4) { A.ghost = 2.5; A.stuck = 0; A.ghostAll = A.stuckLong > 12; } } else if (A.v > 3) { A.stuck = 0; A.stuckLong = 0; }
  if (A.ghost > 0) A.ghost -= dt; else A.ghostAll = false;
  A.light = false;
  // speed
  if (A.v < vT) A.v = Math.min(vT, A.v + 2.6 * dt); else A.v = Math.max(vT, A.v - 8 * dt);
  A.s += A.v * dt;
  while (A.s > pc.len) {
    A.s -= pc.len;
    pc = A.piece = A.next || pickNext(pc, trafficRnd) || pc; A.next = null;
    if (!A.next) A.next = pickNext(pc, trafficRnd);
  }
  pieceAt(pc, A.s, PP);
  const newYaw = Math.atan2(PP.dx, PP.dz);
  const dy = AF.angDiff(car.yaw, newYaw);
  const yawRate = dt > 0 ? dy / dt : 0;
  car.yaw = car.yaw + dy;
  car.x = PP.x; car.z = PP.z; car.v = A.v;
  if ((A.yT = (A.yT || 0) + 1) % 4 === 0) { const gy = AF.surfaceBelow(car.x, car.z, car.y + 1.2, 2.5); car.y += (gy - car.y) * 0.5; }
  const st = A.v > 0.5 ? Math.atan(car.wheelbase * yawRate / A.v) : 0;
  car.steer += (AF.clamp(st, -0.6, 0.6) - car.steer) * Math.min(1, dt * 8);
}
// v2 r2: at a bus stop 1-2 riders step down off the open rear platform and walk off along the sidewalk; sometimes someone hops on
function busRiders(car) {
  const WK = AF.rail && AF.rail.walkers; if (!WK || !WK.spawn) return;
  const cam = AF.camera && AF.camera.position; if (cam && (car.x - cam.x) ** 2 + (car.z - cam.z) ** 2 > 250 * 250) return;
  const hx = Math.sin(car.yaw), hz = Math.cos(car.yaw), rx = -hz, rz = hx;   // right = kerb side
  const at = (along, lat) => [car.x + hx * along + rx * lat, car.z + hz * along + rz * lat];
  const n = 1 + (trafficRnd() < 0.5 ? 1 : 0);
  for (let i = 0; i < n; i++) {
    const [x0, z0] = at(-car.halfL + 0.5, car.halfW - 0.4), [x1, z1] = at(-car.halfL + 0.2 - i * 0.6, car.halfW + 1.9), e = trafficRnd() < 0.5 ? -1 : 1, [x2, z2] = at(e * (12 + trafficRnd() * 14), car.halfW + 2.4 + trafficRnd() * 0.8);
    WK.spawn(x0, z0, car.yaw, { y: car.y + 0.45, path: [x1, z1, x2, z2], wait: 0.8 + i * 1.3, onEnd: (q) => WK.off(q) });
  }
  if (trafficRnd() < 0.55) {
    const [x0, z0] = at(-car.halfL - 9, car.halfW + 2.3), [x1, z1] = at(-car.halfL + 0.3, car.halfW + 1.0), [x2, z2] = at(-car.halfL + 0.5, car.halfW - 0.6);
    WK.spawn(x0, z0, car.yaw, { path: [x1, z1, x2, z2], v: 2.6, wait: 1.5, onEnd: (q) => WK.off(q) });
  }
}
function cabFare(car, q) {
  const WK = AF.rail && AF.rail.walkers; if (!WK || !WK.spawn) return;
  const cam = AF.camera && AF.camera.position; if (cam && (car.x - cam.x) ** 2 + (car.z - cam.z) ** 2 > 250 * 250) return;
  const hx = Math.sin(car.yaw), hz = Math.cos(car.yaw), rx = -hz, rz = hx;
  const x0 = car.x - hx * 0.4 + rx * (car.halfW - 0.3), z0 = car.z - hz * 0.4 + rz * (car.halfW - 0.3);
  const x1 = car.x - hx * 0.4 + rx * (car.halfW + 1.2), z1 = car.z - hz * 0.4 + rz * (car.halfW + 1.2);
  const n = trafficRnd() < 0.4 ? 2 : 1;
  for (let i = 0; i < n; i++) WK.spawn(x0, z0, car.yaw, { y: car.y + 0.3, path: [x1 - hx * i * 0.7, z1 - hz * i * 0.7, q.x + (i ? 0.6 : 0), q.z, q.ix, q.iz], wait: 1.2 + i * 0.9, v: 1.25, onEnd: (w) => WK.off(w) });
}
VV.clockT = 0;
// v2 r2: after dark the private cars go home and the cabs come out — half the AI sedans/coupes turn into cabs (swapped out of sight, > 110 m)
const NIGHT_CABS = ['taxi', 'gullcab', 'taxi', 'beaconcab'];
let cabSwapT = 0;
function nightCabs() {
  const tm = AF.time || {}, h = tm.hours, night = h != null && (h > 19.6 || h < 5.5);
  const cam = AF.camera && AF.camera.position; if (!cam) return;
  const need = {};
  for (const c of VV.ai) {
    const want = night && c.id % 2 === 0 && (c.nightCab || /^(sedan|coupe|wagon|stream|convertible)$/.test(c.type.id));
    if (want === !!c.isNightCab) continue;
    if ((c.x - cam.x) ** 2 + (c.z - cam.z) ** 2 < 110 * 110) continue;
    if (want) { c.dayType = c.type; c.dayKey = c.key; const T = TYPES.find((t) => t.id === NIGHT_CABS[c.id % 4]); c.type = T; c.key = getGeo(T, 0).key; c.nightCab = true; c.isNightCab = true; }
    else { c.type = c.dayType; c.key = c.dayKey; c.isNightCab = false; }
    need[c.key] = 1;
  }
  for (const key in need) { let n = 2; for (const c of VV.cars) if (c.key === key) n++; ensureIM(key, n + 6); }
}
VV.simTraffic = (dt) => {
  VV.clockT += dt;
  if ((cabSwapT -= dt) <= 0) { cabSwapT = 3; nightCabs(); }
  const all = VV.cars, cam = AF.camera && AF.camera.position, fr = AF.clock.frame;
  // cars far from the camera tick at a quarter rate with the accumulated time (nobody can see them take bigger steps)
  for (const c of VV.ai) {
    if (!c.ai) continue;
    c.aiAcc = (c.aiAcc || 0) + dt;
    if (cam && ((fr + c.id) & 3) !== 0 && (c.x - cam.x) ** 2 + (c.z - cam.z) ** 2 > 240 * 240) continue;
    aiStep(c, Math.min(c.aiAcc, 0.25), all); c.aiAcc = 0;
  }
};
const spawnTraffic = (n) => {
  const rnd = AF.rng(777);
  const aiTypes = ['taxi', 'sedan', 'bus', 'coupe', 'gullcab', 'stream', 'milk', 'sedan', 'wagon', 'police', 'taxi', 'sedan', 'beaconcab', 'icecream', 'sedan', 'mail', 'coupe', 'taxi', 'laundry', 'stream', 'pickup', 'convertible', 'sedan', 'bus', 'gullcab', 'wagon', 'sedan', 'taxi', 'coupe', 'sedan', 'cord', 'duesy', 'speedster'];
  const carts = ['dairycart', 'icecart', 'dairycart'];   // v2 r2: 3 horse-drawn wagons among the fleet, on the side streets
  const lanes = G.lanes.filter((l) => l.len > 16);
  const wOf = (l) => /Grand|Meridian/.test(l.name) ? 6 : /Park Row|Harbour Boulevard/.test(l.name) ? 4 : /Terminal|Lantern|Broad|Charter|Bay/.test(l.name) ? 1.4 : 1;   // v2 r2: the main avenues carry the dense flow
  const cum = []; let tot = 0; for (const l of lanes) cum.push(tot += wOf(l) * l.len);
  const pickLane = () => { const r = rnd() * tot; let i = 0; while (cum[i] < r) i++; return lanes[i]; };
  let tries = 0;
  while (VV.ai.length < n && tries++ < 4000) {
    const pc = pickLane();
    const s = 3 + rnd() * (pc.len - 6);
    pieceAt(pc, s, PP);
    if (VV.cars.some((c) => Math.abs(c.x - PP.x) < 8.5 && Math.abs(c.z - PP.z) < 8.5)) continue;
    const nCart = VV.ai.filter((c) => c.type.horse).length, nBike = VV.ai.filter((c) => c.type.kind === 'bike').length, tid = (VV.ai.length % 29 === 11 && nBike < 2) ? 'sidecar' : (VV.ai.length % 23 === 5 && nCart < carts.length && !/Grand|Meridian/.test(pc.name)) ? carts[nCart] : aiTypes[VV.ai.length % aiTypes.length], T = TYPES.find((q) => q.id === tid);
    const car = makeCar(tid, pickPaint(T, rnd), PP.x, PP.z, Math.atan2(PP.dx, PP.dz));
    car.parked = false;
    car.ai = { piece: pc, s, v: 6, v0: T.horse ? 2.6 + rnd() * 0.5 : tid === 'bus' ? 8 : 8.5 + rnd() * 3.5, next: null, stuck: 0, ghost: 0, blocker: null };
    car.driver = T.kind === 'bike' ? -1 : Math.floor(rnd() * 3);
    VV.ai.push(car);
  }
};

// ---------------------------------------------------------------- drive mode
const DR = { car: null, camPos: new THREE.Vector3(), camLook: new THREE.Vector3(), orbit: 0, orbitP: 0, dist: 8.5, init: false };
const carPts = (car, x, z, yaw, inset = 0) => {
  const s = Math.sin(yaw), c = Math.cos(yaw), hl = car.halfL - 0.1 - inset, hw = car.halfW - 0.08 - inset;
  const pts = [];
  for (const [lx, lz] of [[hw, hl], [-hw, hl], [0, hl], [hw, -hl], [-hw, -hl], [0, -hl], [hw, 0], [-hw, 0], [hw, hl * 0.5], [-hw, hl * 0.5], [hw, -hl * 0.5], [-hw, -hl * 0.5]])
    pts.push([x + lx * c + lz * s, z - lx * s + lz * c]);
  return pts;
};
const carBlocked = (car, x, z, yaw) => {
  const feet = car.y + 0.5, h = Math.min(1.2, car.height - 0.6);
  for (const [px, pz] of carPts(car, x, z, yaw)) if (AF.boxBlocked(px, feet, pz, 0.12, h)) return 'world';
  // other cars (oriented boxes)
  for (const o of VV.cars) {
    if (o === car || Math.abs(o.x - x) > 8 || Math.abs(o.z - z) > 8) continue;
    const s = Math.sin(o.yaw), c = Math.cos(o.yaw);
    for (const [px, pz] of carPts(car, x, z, yaw)) {
      const rx = px - o.x, rz = pz - o.z, lx = rx * c - rz * s, lz = rx * s + rz * c;
      if (Math.abs(lx) < o.halfW && Math.abs(lz) < o.halfL) return o;
    }
    const s2 = Math.sin(yaw), c2 = Math.cos(yaw);
    for (const [px, pz] of carPts(o, o.x, o.z, o.yaw)) {
      const rx = px - x, rz = pz - z, lx = rx * c2 - rz * s2, lz = rx * s2 + rz * c2;
      if (Math.abs(lx) < car.halfW && Math.abs(lz) < car.halfL) return o;
    }
  }
  return null;
};
VV.carBlocked = carBlocked;
VV.makeCar = (...a) => makeCar(...a);
VV.placeMesh = (c) => placeMesh(c);
const groundUnder = (car) => {
  const s = Math.sin(car.yaw), c = Math.cos(car.yaw), hb = car.wheelbase / 2, hw = car.halfW - 0.2, top = car.y + 0.6;
  const h = (lx, lz) => AF.surfaceBelow(car.x + lx * c + lz * s, car.z - lx * s + lz * c, top, 3);
  const fl = h(hw, hb), fr = h(-hw, hb), rl = h(hw, -hb), rr = h(-hw, -hb);
  return { front: (fl + fr) / 2, rear: (rl + rr) / 2, left: (fl + rl) / 2, right: (fr + rr) / 2 };
};
function physics(car, dt, inp) {
  const hx = Math.sin(car.yaw), hz = Math.cos(car.yaw), rx = -hz, rz = hx;   // right-hand (screen) vector = -local x
  let f = car.vx * hx + car.vz * hz, lat = car.vx * rx + car.vz * rz;
  const big = car.type.big ? 0.7 : 1;
  const maxF = (car.type.vmax || 27) * (big < 1 ? 0.72 : 1), maxR = 7, pull = car.type.acc || 7.5;
  let acc = 0;
  if (inp.up) acc = f < 0 ? 14 : pull * big * (1 - Math.max(0, f) / maxF);
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
  car.yaw += yawRate * dt;
  const nhx = Math.sin(car.yaw), nhz = Math.cos(car.yaw), nrx = -nhz, nrz = nhx;
  car.vx = nhx * f + nrx * lat; car.vz = nhz * f + nrz * lat;
  car.v = f;
  // move with collision + slide
  const nx = car.x + car.vx * dt, nz = car.z + car.vz * dt;
  let hit = carBlocked(car, nx, nz, car.yaw);
  if (!hit) { car.x = nx; car.z = nz; }
  else {
    const hx2 = carBlocked(car, nx, car.z, car.yaw), hz2 = carBlocked(car, car.x, nz, car.yaw);
    if (!hx2 && Math.abs(car.vx) > 0.05) { car.x = nx; car.vz *= -0.1; }
    else if (!hz2 && Math.abs(car.vz) > 0.05) { car.z = nz; car.vx *= -0.1; }
    else { car.vx *= -0.2; car.vz *= -0.2; }
    const nf = car.vx * nhx + car.vz * nhz;
    car.vx *= 0.6; car.vz *= 0.6; car.v = nf * 0.6;
    if (carBlocked(car, car.x, car.z, car.yaw)) { car.yaw -= yawRate * dt; }
    if (hit && hit.ai && hit.ai) hit.ai.v = 0;
    car.lastHit = hit; car.hitT = (car.hitT || 0) + 1;
    if (typeof hit === 'object' && sp > 6) AF.emit('toast', 'Crunch! Easy there.');
  }
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
  car.bobV += (-car.bob * 90 - car.bobV * 9) * dt + (Math.random() - 0.5) * sp * 0.01;
  car.bob += car.bobV * dt; car.bob = AF.clamp(car.bob, -0.06, 0.06);
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
AF.modes.drive = {
  enter(opts = {}, from) {
    const car = opts.car || VV.cars.find((c) => c.parked) || VV.cars[0];
    if (!car) { AF.setMode(from || 'aerial'); return; }
    DR.car = car; VV.player = car;
    if (car.ai) { VV.ai.splice(VV.ai.indexOf(car), 1); car.ai = null; }
    car.player = true; car.parked = false; car.driver = -1;
    car.vx = Math.sin(car.yaw) * car.v; car.vz = Math.cos(car.yaw) * car.v;
    DR.bike = car.type.kind === 'bike' && !!car.type.solo;
    if (AF.player && AF.player.setVisible) AF.player.setVisible(DR.bike);
    DR.orbit = 0; DR.orbitP = 0; DR.dist = car.type.big ? 13 : DR.bike ? 5.5 : 8.5; DR.init = false;
    AF.emit('toast', (DR.bike ? 'You swing onto the ' : 'You slide behind the wheel of the ') + car.name + '.');
    AF.emit('hint', AF.touch ? '' : 'W/S throttle · A/D steer · Space brake · E to get out');
  },
  exit(to) {
    const car = DR.car;
    if (car) { car.player = false; car.parked = true; car.v = 0; car.vx = car.vz = 0; car.steer *= 0.5; car.roll = 0; placeMesh(car); if (car.interact) { car.interact.x = car.x; car.interact.y = car.y + 0.6; car.interact.z = car.z; } }
    DR.car = null; VV.player = null; if (AF.PL) AF.PL.seat = null;
    if (AF.player && AF.player.setVisible) AF.player.setVisible(true);
    AF.emit('hud', { speed: null, mode: to });
    AF.emit('hint', '');
  },
  update(dt) {
    const car = DR.car; if (!car) return;
    const I = AF.input, S = I.stick;
    const inp = { up: I.key('KeyW') || I.key('ArrowUp'), down: I.key('KeyS') || I.key('ArrowDown'), left: (I.key('KeyA') || I.key('ArrowLeft')) ? 1 : 0, right: (I.key('KeyD') || I.key('ArrowRight')) ? 1 : 0, brake: I.key('Space') };
    if (S && (S.x || S.y)) { if (S.y > 0.3) inp.up = true; if (S.y < -0.3) inp.down = true; if (S.x < -0.15) inp.left = Math.min(1, -S.x * 1.3); if (S.x > 0.15) inp.right = Math.min(1, S.x * 1.3); }
    if (VV.autoInput) Object.assign(inp, VV.autoInput);
    physics(car, dt, inp);
    if (DR.bike) {
      const lean = -car.steer * AF.clamp(Math.abs(car.v) / 9, 0, 1) * 1.1;
      car.roll += (lean - car.roll) * Math.min(1, dt * 6);
      const hx = Math.sin(car.yaw), hz = Math.cos(car.yaw);
      AF.PL.seat = { x: car.x - hx * 0.3, y: car.y + car.bob + 0.02, z: car.z - hz * 0.3, yaw: car.yaw, roll: car.roll, pitch: car.pitch, seatH: 0.7, lean: 0.35 };
    }
    placeMesh(car);
    if (car.interact) { car.interact.x = car.x; car.interact.y = car.y + 0.6; car.interact.z = car.z; }
    // chase camera
    const m = I.mouse;
    if (m.buttons & 1) { DR.orbit -= m.dx * 0.006; DR.orbitP = AF.clamp(DR.orbitP + m.dy * 0.004, -0.25, 0.9); DR.dragT = 1.2; }
    else if ((DR.dragT = (DR.dragT || 0) - dt) < 0) { DR.orbit *= Math.exp(-dt * 1.8); DR.orbitP *= Math.exp(-dt * 1.8); }
    if (m.wheel) DR.dist = AF.clamp(DR.dist * Math.exp(m.wheel * 0.001), 4, 28);
    const a = car.yaw + DR.orbit, pitch = 0.2 + DR.orbitP + DR.dist * 0.004;
    const tx = car.x + Math.sin(car.yaw) * 1.5, ty = car.y + (DR.bike ? 1.5 : 1.3) + (car.type.big ? 1.2 : 0), tz = car.z + Math.cos(car.yaw) * 1.5;
    let d = DR.dist;
    const want = new THREE.Vector3(tx - Math.sin(a) * Math.cos(pitch) * d, ty + Math.sin(pitch) * d, tz - Math.cos(a) * Math.cos(pitch) * d);
    // keep the camera out of walls
    for (let t = 0.25; t <= 1.0001; t += 0.125) {
      const px = tx + (want.x - tx) * t, py = ty + (want.y - ty) * t, pz = tz + (want.z - tz) * t;
      if (AF.solidAt(px, py, pz)) { const tt = Math.max(0.12, t - 0.15); want.set(tx + (want.x - tx) * tt, ty + (want.y - ty) * tt, tz + (want.z - tz) * tt); break; }
    }
    const k = DR.init ? 1 - Math.exp(-dt * 7) : 1; DR.init = true;
    DR.camPos.lerp(want, k); DR.camLook.lerp(tmpV.set(tx, ty, tz), DR.init ? Math.min(1, k * 2) : 1);
    const cam = AF.camera;
    cam.position.copy(DR.camPos);
    const gy = AF.W.groundY(cam.position.x, cam.position.z) + 0.4; if (cam.position.y < gy) cam.position.y = gy;
    cam.lookAt(DR.camLook);
    if (AF.camTarget) AF.camTarget.copy(DR.camLook);
    AF.shadowFocus.set(car.x, car.y, car.z); AF.shadowRadius = 60;
    const kmh = Math.abs(car.v) * 3.6;
    AF.emit('hud', { speed: Math.round(kmh / 1.609), unit: 'mph', kmh: Math.round(kmh), mode: 'drive', car: car.name, gear: car.v < -0.3 ? 'R' : 'D' });
    if (I.hit('KeyE') || I.hit('KeyF') || I.hit('Escape')) VV.exitCar();
  },
};

// ---------------------------------------------------------------- per-frame: instanced bodies + wheels + drivers + night lamps
let WHEEL_IM = null, DRV_IM = null;
const tmpObj = new THREE.Object3D();
const FRUSTUM = new THREE.Frustum(), FR_M = new THREE.Matrix4(), FR_S = new THREE.Sphere();
const IMS = VV.ims = new Map();          // model key -> { full, glass, lod, cap, n, nl }
const LOD_D = 150, FAR_D = 720, DETAIL_D = 170;
function ensureIM(key, cap) {
  let r = IMS.get(key);
  if (r && r.cap >= cap) return r;
  const G = VV.models[key]; if (!G) return null;
  if (r) for (const o of [r.full, r.glass, r.lod]) if (o) { AF.scene.remove(o); o.dispose && o.dispose(); }
  const mk = (geo, mat, shadow) => { const im = new THREE.InstancedMesh(geo, mat, cap); im.castShadow = shadow; im.receiveShadow = true; im.frustumCulled = false; im.count = 0; im.name = 'cars:' + key; AF.scene.add(im); return im; };
  const full = mk(G.geo, AF.mat.voxel, true);
  const glass = G.geo.userData.glass ? mk(G.geo.userData.glass, AF.mat.glass, false) : null; if (glass) glass.renderOrder = 2;
  const lg = AF.lodOf ? AF.lodOf(G.geo) : null;
  const lod = lg ? mk(lg, AF.mat.voxel, false) : null;
  r = { full, glass, lod, cap, n: 0, nl: 0 }; IMS.set(key, r);
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
  let wi = 0, li = 0, pi = 0; const dc = [0, 0, 0];
  const camO = AF.camera, cam = camO.position;
  camO.updateMatrixWorld();
  FR_M.multiplyMatrices(camO.projectionMatrix, camO.matrixWorldInverse); FRUSTUM.setFromProjectionMatrix(FR_M);
  for (const r of IMS.values()) { r.n = 0; r.nl = 0; }
  if (LEG_IM) LEG_IM.count0 = 0;
  const tm = AF.time || {}, night = tm.night != null ? tm.night : ((tm.hours < 6.3 || tm.hours > 18.9) ? 1 : 0);
  const lampsOn = night > 0.15 && LAMP.pts, lampK = Math.min(1, (night - 0.15) / 0.35);
  for (const car of VV.cars) {
    car.spin += (car.v * dt) / car.wr;
    if (dt > 0) { const dv = (car.v - car.vPrev) / dt, want = (dv < -1.2 || (car.v < 0.3 && car.ai)) ? 1 : 0; car.brake = want > car.brake ? Math.min(1, car.brake + dt * 8) : Math.max(0, car.brake - dt * 3); car.vPrev = car.v; }
    const d = Math.hypot(car.x - cam.x, car.y - cam.y, car.z - cam.z);
    FR_S.center.set(car.x, car.y + 1, car.z); FR_S.radius = car.halfL + 1.5;
    const far = d > FAR_D || !FRUSTUM.intersectsSphere(FR_S);
    if (!car.player && car.interact && car.ai) { car.interact.x = car.x; car.interact.y = car.y + 0.6; car.interact.z = car.z; }
    if (!car.player) { const m = car.mesh; m.position.set(car.x, car.y + car.bob, car.z); m.rotation.set(car.pitch, car.yaw, car.roll, 'YXZ'); }
    if (far) continue;
    tmpE.set(car.pitch, car.yaw, car.roll, 'YXZ'); tmpQ.setFromEuler(tmpE);
    tmpM.compose(tmpV.set(car.x, car.y + car.bob, car.z), tmpQ, tmpS.set(1, 1, 1));
    const r = IMS.get(car.key) || ensureIM(car.key, 4);
    if (!r) continue;
    if (d < LOD_D || !r.lod) {
      if (r.n < r.cap) { r.full.setMatrixAt(r.n, tmpM); if (r.glass) r.glass.setMatrixAt(r.n, tmpM); r.n++; }
    } else if (r.nl < r.cap) r.lod.setMatrixAt(r.nl++, tmpM);
    if (d < DETAIL_D) {
      for (const w of car.wheels) {
        if (wi >= WHEEL_IM.userData.max) break;
        tmpObj.position.set(w.lx, w.ly - car.bob, w.lz);
        tmpObj.rotation.set(car.spin, w.front ? car.steer : 0, 0, 'YXZ');
        tmpObj.scale.setScalar(car.ws);
        tmpObj.updateMatrix();
        tmpM2.multiplyMatrices(tmpM, tmpObj.matrix);
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
          const seatY = car.type.kind === 'cart' ? 1.3 : car.type.kind === 'car' ? 0.4 : car.type.big ? 0.45 : 0.42;
          const lz = car.type.kind === 'cart' ? -0.45 : car.type.kind === 'car' ? (car.type.id === 'convertible' ? 0.2 : 0.35) : car.halfL - (car.type.big ? car.type.id === 'bus' ? 2.1 : 2.6 : 1.3);
          tmpObj.position.set(car.halfW - 0.62, seatY, lz); tmpObj.rotation.set(0, 0, 0); tmpObj.scale.setScalar(1); tmpObj.updateMatrix();
          tmpM2.multiplyMatrices(tmpM, tmpObj.matrix); im.setMatrixAt(i, tmpM2); dc[car.driver]++;
        }
      }
    }
    // night: head + tail lamps for every moving (or driven) car, pools under the near ones
    if (lampsOn && (car.ai || car.player) && !car.type.horse && li + 4 <= LAMP.max * 4) {
      const hy = car.type.big ? 0.95 : 0.78, hw = car.halfW - 0.22;
      const far2 = d > 220 ? 1.6 : 1;   // far lamps a touch brighter so the avenues read as rivers of light
      for (const [lx, ly, lz, cr, cg, cb] of [[hw, hy, car.halfL + 0.05, 1, 0.86, 0.6], [-hw, hy, car.halfL + 0.05, 1, 0.86, 0.6], [hw, 0.7, -car.halfL - 0.05, 0.9, 0.08, 0.04], [-hw, 0.7, -car.halfL - 0.05, 0.9, 0.08, 0.04]]) {
        LV3.set(lx, ly, lz).applyMatrix4(tmpM); const i3 = li * 3;
        LAMP.pos[i3] = LV3.x; LAMP.pos[i3 + 1] = LV3.y; LAMP.pos[i3 + 2] = LV3.z;
        const kk = lampK * far2 * (lz < 0 ? 0.55 + car.brake * 0.9 : 1);
        LAMP.col[i3] = cr * kk; LAMP.col[i3 + 1] = cg * kk; LAMP.col[i3 + 2] = cb * kk; li++;
      }
      if (d < 260 && pi < LAMP.max) { tmpObj.position.set(car.x, car.y + 0.04, car.z); tmpObj.rotation.set(0, car.yaw, 0); tmpObj.scale.setScalar(car.type.big ? 1.2 : 1); tmpObj.updateMatrix(); LAMP.pool.setMatrixAt(pi++, tmpObj.matrix); }
    }
  }
  for (const r of IMS.values()) {
    r.full.count = r.n; r.full.instanceMatrix.needsUpdate = true;
    if (r.glass) { r.glass.count = r.n; r.glass.instanceMatrix.needsUpdate = true; }
    if (r.lod) { r.lod.count = r.nl; r.lod.instanceMatrix.needsUpdate = true; }
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
        const rot = ((Math.round(yaw / (Math.PI / 2)) % 4) + 4) % 4;
        const gy = AF.W.groundY ? AF.W.groundY(x, z) : 0;
        const pr = AF.placeStatic(staticGeo(tid, pi), x, gy, z, rot, { collide: true });
        perRoad[r.name] = (perRoad[r.name] || 0) + 1; out.push({ static: true, pr, pi, x, z, y: gy, yaw: rot * Math.PI / 2, type: T, name: T.name, kind: T.kind, parked: true, halfL: 2.5, halfW: 0.9 });
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
      AF.removeStatic(s.pr);
      const i = VV.parkedStatic.indexOf(s); if (i >= 0) VV.parkedStatic.splice(i, 1);
      const j = VV.parked.indexOf(s); if (j >= 0) VV.parked.splice(j, 1);
      proxy.target = null; proxy.y = -999;
      const car = makeCar(s.type.id, s.pi, s.x, s.z, s.yaw, { y: s.y }); VV.parked.push(car);
      AF.setMode('drive', { car });
    } });
  let pf = 0;
  AF.onTick('park-proxy', 170, () => {
    if (AF.mode !== 'walk' || (pf++ % 5)) return;
    const p = AF.player; let best = null, bd = 36;
    for (const s of VV.parkedStatic) { const d = (s.x - p.x) ** 2 + (s.z - p.z) ** 2; if (d < bd) { bd = d; best = s; } }
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
  buildGraph();
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
  spawnTraffic(VV.AI_N || 150);
  for (const D of (VV.deliv || [])) { try { buildDelivery(D); } catch (e) { console.warn('[af] delivery', D.name, e); } }
  // the static kerb cars count as parked for the probes (after the drivable ones, so find() hits a drivable car first)
  for (const c of VV.parkedStatic) VV.parked.push(c);
  // instanced bodies (sized to the fleet), wheels, drivers, lamps
  const per = {}; for (const c of VV.cars) per[c.key] = (per[c.key] || 0) + 1;
  for (const key in per) ensureIM(key, per[key] + 2);
  const nW = VV.cars.reduce((n, c) => n + c.wheels.length, 0) + 16;
  WHEEL_IM = new THREE.InstancedMesh(wheelGeo(), AF.mat.voxel, nW + 64); WHEEL_IM.userData.max = nW + 64;
  WHEEL_IM.castShadow = true; WHEEL_IM.receiveShadow = true; WHEEL_IM.frustumCulled = false;
  AF.scene.add(WHEEL_IM);
  LEG_IM = new THREE.InstancedMesh(legGeo(), AF.mat.voxel, 64); LEG_IM.userData.max = 64; LEG_IM.castShadow = true; LEG_IM.receiveShadow = true; LEG_IM.frustumCulled = false; LEG_IM.count = 0; LEG_IM.count0 = 0; LEG_IM.name = 'horse-legs'; AF.scene.add(LEG_IM);
  DRV_IM = driverGeos().map((g) => { const im = new THREE.InstancedMesh(g, AF.mat.voxel, 120); im.userData.max = 120; im.castShadow = true; im.frustumCulled = false; im.count = 0; AF.scene.add(im); return im; });
  buildLamps(VV.cars.length + 8);
  syncInstances(0);
  VV.buildMs = Math.round(performance.now() - t0);
  console.log('[af] vehicles:', VV.cars.length, 'cars (', VV.ai.length, 'AI ) + static parked', VV.parkedStatic.length, 'models', Object.keys(VV.models).length, 'lanes', G.lanes.length, 'conns', G.conns.length, 'in', VV.buildMs, 'ms', 'deliveries', DLV.map((D) => D.name + '@' + D.x.toFixed(0) + ',' + D.z.toFixed(0)).join(' | '));
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
  for (let i = 0; i < 1800; i++) {
    VV.simTraffic(1 / 30);
    if (i % 10 === 0) for (const c of VV.ai) { if (!isFinite(c.x) || !isFinite(c.z) || !isFinite(c.yaw)) nan++; else worst = Math.max(worst, VP.nearestRoad(c.x, c.z).edge + 1); }
  }
  VV.ai.forEach((c, i) => { if (Math.hypot(c.x - start[i][0], c.z - start[i][1]) > 20) moved++; });
  syncInstances(0);
  return { ok: nan === 0 && worst < 1.3 && moved >= VV.ai.length * 0.6, info: `nan ${nan}, max past kerb+1 ${worst.toFixed(2)} m, moved ${moved}/${VV.ai.length}` };
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

