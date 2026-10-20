// ================================================================ 44-hideout.js
try {
// ===== 44-hideout: DRY CREEK DEPOT — Vera Lark's hideout on the Ochre Flats (desert east of the city), the heist's briefing room.
//       An old adobe mine depot under the mesa, 30 m off the Ochre Trail down a dirt track: flat roof on vigas, a tin porch, a water
//       tank, a windpump and a radio mast. Inside, the map room: a voxel relief map of Port Solace on the table (flags on the
//       targets), the photo board with red string, the bank vault blueprint, a chalk timeline, a radio desk, a cot, crates.
//       Everything is merged outland props (44-sites geometry: 3 LODs, no draws of its own); the shell is collide:false with one
//       collider per wall so it is walk-in. Pads, colliders, lights and spots exist at build; meshes stream in ('hideout', gen).
//       AF.hideout = { name, at, door, inside, park, road, roadYaw, drive, table, vera, crew[4], board, photos{}, pins{}, shots[], mapPoint(x, z) }
{
  const O = AF.outland, PI = Math.PI;
  const HO = AF.hideout = { name: 'Dry Creek Depot', at: null, door: null, inside: null, park: null, road: null, roadYaw: 0, drive: [], table: null, vera: null, crew: [], board: null, pins: {}, shots: [], props: [], pads: [],
    stats: { ready: false, props: 0, tris: 0, colliders: 0, workMs: 0, maxStepMs: 0 } };
  // building frame: the depot's NW outer corner; local x runs east, z south. 16 x 12 m, the door in the north wall faces the trail
  const BX = 834, BZ = 110, TX = 8, TZ = 6.95, TAG = 'hideout';
  let Y = 13, FY = 13.125;                       // pad ground, floor top (set at build from the road height)
  const X = (lx) => BX + lx, Z = (lz) => BZ + lz, r2 = (v) => Math.round(v * 100) / 100;
  // ---------------------------------------------------------------- palette
  const col = (hex, o = {}) => AF.col(hex, Object.assign({ jitter: 0.3, edge: 0.15, pat: 'none' }, o));
  const C = {
    adobe: col(0xc8a07a, { pat: 'stucco', jitter: 0.45 }), plinth: col(0x9c7656, { pat: 'stucco', jitter: 0.5 }), wash: col(0xe2d6bc, { pat: 'stucco', jitter: 0.2 }), wains: col(0xa8835e, { jitter: 0.3 }),
    plank: col(0x7a5a3c, { pat: 'plank', jitter: 0.4 }), latilla: col(0x9a7a52, { pat: 'plank', jitter: 0.35 }), viga: col(0x5a4030, { jitter: 0.3 }), roof: col(0x8a6e52, { jitter: 0.5 }),
    wood: col(0x8a6a48, { pat: 'plank', jitter: 0.35 }), woodD: col(0x5e4430, { jitter: 0.3 }), oak: col(0x6e4a2e, { jitter: 0.25 }), tin: col(0x8f9496, { metal: 0.6, rough: 0.5, jitter: 0.25 }), rust: col(0x8a5238, { jitter: 0.4 }),
    sack: col(0xb59a6a, { jitter: 0.35 }), pane: AF.col(0x5a5040, { win: 'hotel', emit: 0xffc890, emitK: 1.1, mode: 'night', edge: 0.1 }), bulb: col(0xfff0c8, { emit: 0xffd890, emitK: 1.4, mode: 'night', jitter: 0, edge: 0 }), glow: col(0xfff0c8, { emit: 0xffd890, emitK: 3, mode: 'night', jitter: 0, edge: 0 }),
    dial: col(0xffe0a0, { emit: 0xffc060, emitK: 1.6, mode: 'always', jitter: 0, edge: 0 }), dialG: col(0xb8f0a0, { emit: 0x80ff80, emitK: 1.3, mode: 'always', jitter: 0, edge: 0 }),
    beacon: col(0xff4030, { emit: 0xff2010, emitK: 3, mode: 'night', jitter: 0, edge: 0 }),
    olive: col(0x55603f, { jitter: 0.3 }), steel: col(0x4a4f52, { metal: 0.6, rough: 0.45, jitter: 0.2 }), dark: col(0x262626, { jitter: 0.15 }), canvas: col(0x6b6a48, { jitter: 0.3 }),
    blanket: col(0x8a3a2e, { jitter: 0.25 }), white: col(0xeeeae0, { jitter: 0.08, edge: 0.05 }), brass: col(0xc89a48, { metal: 0.85, rough: 0.35, jitter: 0.1 }), green: col(0x2f5a3a, { jitter: 0.15 }),
    drumR: col(0x9a3a2a, { jitter: 0.35 }), drumB: col(0x2f4a6a, { jitter: 0.35 }), cream: col(0xe8dcc0, { jitter: 0.15 }), rugA: col(0x8a2e24, { jitter: 0.2 }), rugB: col(0xc8a060, { jitter: 0.2 }), rugC: col(0x2a3a5a, { jitter: 0.2 }),
  };
  // map table + wall boards (fine voxels: no auto patterns, little jitter)
  const fine = (hex, o = {}) => AF.col(hex, Object.assign({ jitter: 0.08, edge: 0.05, pat: 'none' }, o));
  const M = {
    sea: fine(0x2e6a86), shallow: fine(0x5a9ab0), sand: fine(0xdcc89a), park: fine(0x6f9a4e), forest: fine(0x48703c), farmA: fine(0xb0a85c), farmB: fine(0x8ea050), desert: fine(0xcca46c),
    hills: fine(0x86966a), rock: fine(0x9a8c78), town: fine(0xc4bba8), street: fine(0x6e6a66), bldg: fine(0xf0ebdf), tall: fine(0xd2c8b4), tree: fine(0x3e6a34), lake: fine(0x4a8aa8),
    gold: fine(0xe2b446, { metal: 0.85, rough: 0.3 }), rim: fine(0x5e4430), hull: fine(0xf4f2ea), hullD: fine(0x23384f), funnel: fine(0xb8302a), route: fine(0xfaf6e8),
    cork: AF.col(0xb8875a, { jitter: 0.5, edge: 0, pat: 'none' }), frame: fine(0x4a3424), paper: fine(0xf4f0e4), ink: fine(0x1a1a1e), red: fine(0xc8202a), string: fine(0xd01e24), pinY: fine(0xf0c030),
    slate: AF.col(0x2a332e, { jitter: 0.12, edge: 0, pat: 'none' }), chalk: fine(0xe4e4d8), chalkY: fine(0xf0e08a), blue: fine(0x2a5a9a), line: fine(0xdfe8f2),
    flags: { bank: fine(0xd0202a), zoo: fine(0xf0c030), westgate: fine(0x3a78d0), island: fine(0xf07a20), liner: fine(0xf8f8f8), key: fine(0x18181c), farm: fine(0x8a3ab0), kovac: fine(0x2aa04a) },
  };
  // 5x7 glyph pixels: fn(px, py) with px along the line and py up from the bottom row
  const glyphs = (str, fn) => { const G = AF.font5x7; str = String(str).toUpperCase(); for (let i = 0; i < str.length; i++) { const g = G[str[i]] || G['?']; for (let r = 0; r < 7; r++) for (let c = 0; c < 5; c++) if (g[r] & (1 << (4 - c))) fn(i * 6 + c, 6 - r); } };
  const textW = (str) => str.length * 6 - 1;
  const textModel = (str, fg, bg, pad = 1) => { const m = new AF.Model(textW(str) + pad * 2, 7 + pad * 2, bg ? 2 : 1); if (bg) m.box(0, 0, 0, m.w, m.h, 1, bg); glyphs(str, (px, py) => m.set(pad + px, pad + py, bg ? 1 : 0, fg)); return m; };

  // ---------------------------------------------------------------- the map (1/32 m): Port Solace to scale, the open sea folded
  // map cells: u east (90), v south (60). World x [-880, 720] spans the width; z rows: the city to scale, then the sea folded in
  // three steps (the liner band and the islands band each keep a readable scale; the islands band is drawn round x -60)
  const MV = 1 / 32, MW = 90, MD = 60, RIM = 3, MAPW = MW + RIM * 2, MAPD = MD + RIM * 2, MAPH = 12;
  const MX0 = -880, KU = MW / 1600, ZK = [[-330, 0], [330, 37], [1380, 41], [1520, 46], [2950, 48], [3290, 60]];
  const ISLE_V = 48, ISLE_K = 12 / 340, PIV = -60, PIVU = (PIV - MX0) * KU;
  const mapV = (z) => { if (z <= ZK[0][0]) return 0; for (let i = 1; i < ZK.length; i++) if (z <= ZK[i][0]) { const a = ZK[i - 1], b = ZK[i]; return a[1] + (b[1] - a[1]) * (z - a[0]) / (b[0] - a[0]); } return ZK[ZK.length - 1][1]; };
  const mapU = (x, v) => (v >= ISLE_V ? PIVU + (x - PIV) * ISLE_K : (x - MX0) * KU);
  const worldZ = (v) => { for (let i = 1; i < ZK.length; i++) if (v <= ZK[i][1]) { const a = ZK[i - 1], b = ZK[i]; return a[0] + (b[0] - a[0]) * (v - a[1]) / (b[1] - a[1]); } return ZK[ZK.length - 1][0]; };
  const worldX = (u, v) => (v >= ISLE_V ? PIV + (u - PIVU) / ISLE_K : MX0 + u / KU);
  // map model min corner (world), set at build
  const MAP = { x0: 0, y0: 0, z0: 0, heights: new Uint8Array(MW * MD), colors: new Uint16Array(MW * MD), done: new Uint8Array(MW * MD) };
  const cellWorld = (iu, iv, y) => ({ x: r2(MAP.x0 + (RIM + iu + 0.5) * MV), y: r2(MAP.y0 + y * MV), z: r2(MAP.z0 + (RIM + iv + 0.5) * MV) });
  HO.mapPoint = (x, z) => { const v = mapV(z), u = mapU(x, v), iu = AF.clamp(Math.floor(u), 0, MW - 1), iv = AF.clamp(Math.floor(v), 0, MD - 1); return cellWorld(iu, iv, MAP.done[iu * MD + iv] ? MAP.heights[iu * MD + iv] : 1); };
  const PINS = {
    bank: () => [30, -125], kovac: () => { const l = AF.labels.find((q) => q.name === 'Kovac Tailor'); return l ? [l.x, l.z] : [-225, -94]; },
    zoo: () => [-549, -153], westgate: () => [-479, 150], farm: () => { const s = AF.outlandSites && AF.outlandSites.sites.find((q) => q.name === 'Southfield Farm'); return s ? [s.x, s.z] : [-820, 48]; },
    liner: () => [-225, 1450], island: () => [-170, 3131], key: () => { const k = AF.PLAN.world.key; return k ? [k.cx, k.cz] : [560, 3192]; },
  };
  // one map cell: [height in voxels (1 = the sea surface), colour]
  const bankLot = () => { const L = AF.PLAN.lot && AF.PLAN.lot('dt-bank'); return L ? L.rect : [10, -147, 72, -88]; };
  const cls = (hex) => { const r = (hex >> 16) & 255, g = (hex >> 8) & 255, b = hex & 255; if (g > r + 10 && g > b + 4) return 'green'; if (Math.abs(r - g) < 22 && Math.abs(g - b) < 26) return r + g + b < 380 ? 'road' : 'pave'; if (r > 170 && g > 150 && b < 150 && r - b > 50) return 'sand'; return 'ground'; };
  const W = AF.W;
  function colTop(x, z) {
    const bx = W.bx(x), bz = W.bz(z), g = W.hB(bx, bz) * 0.25, stop = W.by(g);
    for (let by = W.by(110); by > stop; by -= 4) { const c = W.get(bx, by, bz); if (c && AF.PAL.solid[c] && AF.PAL.opaque[c]) { let top = by; while (top < by + 3) { const u = W.get(bx, top + 1, bz); if (!(u && AF.PAL.solid[u])) break; top++; } return { t: W.yOf(top + 1), hex: AF.PAL.hex[c] }; } }
    return { t: g, hex: 0 };
  }
  function cell(iu, iv) {
    const v = iv + 0.5, z = worldZ(v), u = iu + 0.5, x = worldX(u, v);
    const city = W.col(x, z) >= 0, B = bankLot();
    if (city) {
      let water = 0, bt = 0, tree = 0, gsum = 0, bank = false; const kinds = { green: 0, road: 0, pave: 0, sand: 0, ground: 0 };
      const du = 0.25 / KU, dv = (worldZ(v + 0.25) - worldZ(v - 0.25)) / 2;
      for (const [ox, oz] of [[-du, -dv], [du, -dv], [-du, dv], [du, dv]]) {
        const sx = x + ox, sz = z + oz, g = W.groundY(sx, sz);
        if (g < -0.5) { water++; continue; }
        gsum += g; if (sx >= B[0] && sx <= B[2] && sz >= B[1] && sz <= B[3]) bank = true;
        const top = colTop(sx, sz), rise = top.t - g;
        if (rise > 2.5) { if (cls(top.hex) === 'green') tree++; else bt = Math.max(bt, rise); }
        const i = W.col(sx, sz); kinds[cls(AF.PAL.hex[W.C[i]] || 0)]++;
      }
      if (water >= 3) return [1, M.sea];
      const terr = 2 + AF.clamp(Math.floor(gsum / Math.max(1, 4 - water) / 6), 0, 3);
      if (bank) return [9, M.gold];
      if (bt > 2.5) return [Math.min(8, terr + AF.clamp(Math.round(bt / 6), 1, 6)), bt > 24 ? M.tall : M.bldg];
      if (tree >= 2) return [terr + 1, M.tree];
      if (water) return [terr, M.sand];
      let best = 'ground'; for (const k in kinds) if (kinds[k] > kinds[best]) best = k;
      return [terr, best === 'green' ? M.park : best === 'road' ? M.street : best === 'sand' ? M.sand : best === 'pave' ? M.town : M.town];
    }
    const h = O.h(x, z);
    if (h < -1.25) return [1, z > 300 && h > -2.6 ? M.shallow : M.sea];
    if (O.waterY(x, z) !== null) return [1, M.lake];
    const lift = 2 + AF.clamp(Math.floor(h / 8), 0, 4), b = O.biome(x, z);
    if (z > 300) return [h < 1.6 ? 2 : lift, h < 1.6 ? M.sand : h > 9 ? M.forest : M.park];
    if (b === 'farmland') return [lift, (Math.floor(x / 70) + Math.floor(z / 50)) & 1 ? M.farmA : M.farmB];
    if (b === 'desert') return [lift, M.desert];
    if (b === 'forest' || b === 'jungle') return [lift, M.forest];
    return [lift, h > 40 ? M.rock : M.hills];
  }
  const setCell = (iu, iv, h, c) => { const i = iu * MD + iv; MAP.heights[i] = h; MAP.colors[i] = c; MAP.done[i] = 1; };

  // ---------------------------------------------------------------- the site: pads, colliders, lights and spots at build
  const collide = (lx0, y0, lz0, lx1, y1, lz1) => { AF.addCollider(X(lx0), y0, Z(lz0), X(lx1), y1, Z(lz1), TAG); HO.stats.colliders++; };
  function roadNear(x, z) {
    let best = null;
    for (let dz = -50; dz <= 10; dz += 1) for (let dx = -40; dx <= 40; dx += 1) {
      const px = x + dx, pz = z + dz, q = O.roadInfo(px, pz);
      if (q.d < 0.8 && q.kind !== 2) { const d = Math.hypot(dx, dz); if (!best || d < best.d) best = { x: px, z: pz, d, road: q.road }; }
    }
    return best;
  }
  const surf = (x, z, y) => AF.surfaceBelow(x, z, y + 1, 4);
  AF.onBuild('hideout-site', 496.5, () => {
    const R = roadNear(X(TX), Z(-6));
    if (!R) { AF.warnOnce('hideout: no road near the depot'); return; }
    const ry = O.roadInfo(R.x, R.z).y, roadY = surf(R.x, R.z, ry);
    Y = Math.round((roadY - 0.2) * 4) / 4; FY = Y + 0.125;
    // the yard pad (flat, cut into the mesa foot) + a dirt track (a 'hamlet' pad: gravel down its middle) out to the trail
    const pad = { name: HO.name, kind: 'hideout', x: X(TX), z: Z(5), rx: 15, rz: 11, y: Y, bank: 10, props: [] };
    const z0 = R.z + 3, z1 = pad.z - pad.rz + 1, track = { name: HO.name + ' track', kind: 'hamlet', x: X(TX), z: (z0 + z1) / 2, rx: 3, rz: (z1 - z0) / 2, y: Y, bank: 4, props: [] };
    O.pads.push(pad, track); HO.pads.push(pad, track);
    AF.addLabel(HO.name, pad.x, pad.z, 'place');
    // the shell: floor, four walls (a 2 m doorway in the north wall), the roof
    collide(0, FY - 0.25, 0, 16, FY, 12);
    collide(0, FY, 0, 7, FY + 3.5, 0.5); collide(9, FY, 0, 16, FY + 3.5, 0.5); collide(7, FY + 2.5, 0, 9, FY + 3.5, 0.5);
    collide(0, FY, 11.5, 16, FY + 3.5, 12); collide(0, FY, 0, 0.5, FY + 3.5, 12); collide(15.5, FY, 0, 16, FY + 3.5, 12);
    collide(0, FY + 3.5, 0, 16, FY + 4.25, 12);
    // furniture: the map table, cot, radio desk + stool, crates, barrel
    collide(TX - 1.5, FY, TZ - 1.0625, TX + 1.5, FY + 0.97, TZ + 1.0625);
    collide(0.55, FY, 1.6, 1.43, FY + 0.55, 3.6);
    collide(0.55, FY, 0.55, 1.3, FY + 1.2, 1.3);
    collide(14.75, FY, 1.0, 15.5, FY + 0.8, 2.82); collide(14.0, FY, 1.75, 14.4, FY + 0.6, 2.15);
    collide(13.9, FY, 9.85, 15.5, FY + 1.5, 11.5); collide(12.3, FY, 10.85, 13.3, FY + 0.5, 11.5);
    collide(0.6, FY, 10.6, 1.4, FY + 0.9, 11.4);
    // outside: porch posts, crates + drums, water tank, windpump, trough, mast
    collide(6.0, Y, -2.25, 6.25, Y + 2.6, -2.0); collide(9.75, Y, -2.25, 10.0, Y + 2.6, -2.0);
    collide(4.1, Y, -1.4, 5.6, Y + 1.1, -0.1); collide(1.8, Y, -1.5, 3.1, Y + 0.9, -0.2);
    collide(-5.5, Y, 2.5, -2.5, Y + 5.5, 5.5); collide(-6.25, Y, 7.75, -2.75, Y + 9.5, 11.25); collide(-2.6, Y, 7.25, -1.9, Y + 0.6, 8.75);
    collide(17.85, Y, 10.35, 18.15, Y + 11.5, 10.65); collide(-1.2, Y, 1.2, 0, Y + 0.8, 2.6);
    // light: the pendant over the table, the board's picture lamp, the radio desk lamp, the porch
    AF.addLight({ x: X(TX), y: FY + 2.2, z: Z(TZ), color: 0xffcf8a, intensity: 0.9, range: 6.5, kind: 'interior' });
    AF.addLight({ x: X(TX), y: FY + 2.75, z: Z(9.6), color: 0xffd9a0, intensity: 0.5, range: 5, kind: 'interior' });
    AF.addLight({ x: X(15.0), y: FY + 1.2, z: Z(2.7), color: 0xffc070, intensity: 0.6, range: 5, kind: 'interior' });
    AF.addLight({ x: X(TX), y: Y + 2.35, z: Z(-1.1), color: 0xffc878, intensity: 0.45, range: 10, kind: 'street' });
    // spots (every standing spot on a real surface)
    const spot = (lx, lz, yaw, y0 = FY) => { const x = X(lx), z = Z(lz); return { x: r2(x), y: surf(x, z, y0 + 0.4), z: r2(z), yaw: r2(yaw) }; };
    const face = (lx, lz, tx, tz) => Math.atan2(tx - lx, tz - lz);
    HO.at = { x: X(8), y: FY, z: Z(6) };
    HO.door = spot(TX, -1.1, 0, Y); HO.inside = spot(TX, 1.3, 0); delete HO.inside.yaw;
    HO.road = { x: r2(R.x), y: r2(roadY), z: r2(R.z) };
    const px = X(12), pz = Z(-4.2);
    HO.park = { x: r2(px), y: surf(px, pz, Y + 0.4), z: r2(pz), yaw: r2(Math.atan2(R.x - px, R.z - pz)) };
    MAP.x0 = X(TX) - MAPW * MV / 2; MAP.z0 = Z(TZ) - MAPD * MV / 2; MAP.y0 = FY + 0.875;
    HO.table = { x: r2(X(TX)), y: r2(MAP.y0 + MV), z: r2(Z(TZ)), yaw: PI, w: 3, d: 2.125 };
    HO.vera = spot(TX, TZ + 1.6, PI);
    HO.crew = [spot(7.3, 5.3, face(7.3, 5.3, TX, TZ)), spot(8.7, 5.3, face(8.7, 5.3, TX, TZ)), spot(5.85, TZ, PI / 2), spot(10.15, TZ, -PI / 2)];
    HO.board = { x: r2(X(TX)), y: r2(FY + 1.55), z: r2(Z(11.5) - 0.07), yaw: PI };
    // centres of the four polaroids (board hung rot 2: board x runs west) and of the vault blueprint, on their front faces
    HO.photos = {};
    for (const k in BOARD.photos) { const [bx, by] = BOARD.photos[k]; HO.photos[k] = { x: r2(X(TX) - (bx + 14 - BOARD.w / 2) * BOARD.vs), y: r2(FY + 0.75 + (by + 17) * BOARD.vs), z: r2(Z(11.5) - 0.004 - 3 * BOARD.vs) }; }
    HO.photos.vault = { x: r2(X(12.1)), y: r2(FY + 1.05 + 35 / 64), z: r2(Z(11.5) - 0.004 - 2 / 64) };
    // the approach along the trail: ~120 m of road ending at the turn-off, then the parking spot
    // the approach: the trail back from the turn-off, prefixed by the road it leaves at its first point (the Eastwood Loop),
    // from the city side; drive = points 120 / 90 / 60 / 30 m before the turn-off, the turn-off, the parking spot
    const proj = (q, x, z) => { let best = null; for (let i = 1; i < q.length; i++) { const a = q[i - 1], b = q[i], dx = b[0] - a[0], dz = b[1] - a[1], t = AF.clamp(((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz || 1), 0, 1), px = a[0] + dx * t, pz = a[1] + dz * t, d = Math.hypot(px - x, pz - z); if (!best || d < best.d) best = { i, t, d, p: [px, pz] }; } return best; };
    const road = R.road, pts = road && road.points;
    let line = [[R.x, R.z]];
    if (pts && pts.length > 1) {
      const f = proj(pts, R.x, R.z); line = pts.slice(0, f.i).concat([f.p]);
      const s0 = pts[0];
      for (const other of AF.PLAN.world.roads) {
        if (other === road || other.kind === 2 || !other.points || other.points.length < 2) continue;
        const q = other.points, j = proj(q, s0[0], s0[1]); if (!j || j.d > 8) continue;
        const westFirst = q[0][0] < q[q.length - 1][0];
        line = (westFirst ? q.slice(0, j.i) : q.slice(j.i).reverse()).concat([j.p], line); break;
      }
    }
    const back = (s) => { let left = s; for (let i = line.length - 1; i > 0; i--) { const a = line[i - 1], b = line[i], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (left <= L) { const t = 1 - left / (L || 1); return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; } left -= L; } return line[0]; };
    const pre = back(4); HO.roadYaw = r2(Math.atan2(R.x - pre[0], R.z - pre[1]));
    for (const s of [120, 90, 60, 30]) { const [x, z] = back(s); HO.drive.push([r2(x), r2(surf(x, z, O.roadInfo(x, z).y)), r2(z)]); }
    HO.drive.push([HO.road.x, HO.road.y, HO.road.z], [HO.park.x, HO.park.y, HO.park.z]);    // flags on the map: the pin's foot on the relief (its column sampled now, the generator keeps it)
    for (const k in PINS) {
      const [x, z] = PINS[k](), v = mapV(z), u = mapU(x, v), iu = AF.clamp(Math.floor(u), 1, MW - 6), iv = AF.clamp(Math.floor(v), 1, MD - 2);
      const [h, c] = cell(iu, iv); setCell(iu, iv, h, c); HO.pins[k] = cellWorld(iu, iv, h); HO.pins[k].cell = [iu, iv];
    }
    // cinematic cameras
    const P = (lx, y, lz) => [r2(X(lx)), r2(y), r2(Z(lz))];
    // the road camera: across the trail from the turn-off, a little up the road, watching the car come in and turn down the track
    const dl = Math.hypot(X(TX) - R.x, Z(-2) - R.z) || 1, nx = (R.x - X(TX)) / dl, nz = (R.z - Z(-2)) / dl, up = back(12), mid = [(R.x + HO.park.x) / 2, (R.z + HO.park.z) / 2];
    const rcx = up[0] + nx * 13, rcz = up[1] + nz * 13;
    HO.shots = [
      { name: 'exterior', cam: P(22, Y + 3.4, -15), look: P(6, FY + 1.4, 5) },
      { name: 'door', cam: P(TX - 0.3, FY + 1.7, -4.6), look: P(TX, FY + 1.3, 9.5) },
      { name: 'table', cam: P(TX, FY + 2.85, TZ + 1.05), look: P(TX, FY + 0.9, TZ - 0.15) },
      { name: 'board', cam: P(TX - 0.2, FY + 1.6, 9.4), look: P(TX, FY + 1.55, 11.5) },
      { name: 'vera', cam: P(TX + 0.45, FY + 1.8, TZ + 2.55), look: P(TX - 0.3, FY + 1.2, TZ - 1.6) },
      { name: 'road', cam: [r2(rcx), r2(O.groundY(rcx, rcz) + 1.7), r2(rcz)], look: [r2(mid[0]), r2(Y + 1.2), r2(mid[1])] },
    ];
  });

  // ---------------------------------------------------------------- models
  // the shell (0.25 m): adobe walls 0.5 m thick on a plank floor, whitewashed inside over a dark wainscot, vigas under a latilla
  // ceiling poking out front and back, sacking over the windows (amber at night), a parapet. open=false: the closed coarse box
  function shell(open) {
    const m = new AF.Model(64, 19, 52), Z0 = 2, Z1 = 50;
    m.box(0, 0, Z0, 64, 1, Z1, open ? C.plank : C.plinth);
    m.box(0, 1, Z0, 64, 3, Z1, C.plinth); m.box(0, 3, Z0, 64, 15, Z1, C.adobe);
    if (open) {
      m.box(1, 1, Z0 + 1, 63, 15, Z1 - 1, C.wains); m.box(1, 5, Z0 + 1, 63, 15, Z1 - 1, C.wash); m.box(2, 1, Z0 + 2, 62, 15, Z1 - 2, 0);
      m.box(28, 1, Z0, 36, 11, Z0 + 2, 0);
    } else m.box(28, 1, Z0, 36, 11, Z0 + 1, C.woodD);
    m.box(27, 11, Z0, 37, 12, Z0 + 1, C.wood);
    const win = (x0, z0, x1, z1, outer) => { m.box(x0, 5, z0, x1, 9, z1, C.sack); m.box(outer[0], 5, outer[1], outer[2], 9, outer[3], C.pane); };
    for (const x of [8, 50]) { win(x, Z0, x + 6, Z0 + 2, [x, Z0, x + 6, Z0 + 1]); m.box(x - 1, 9, Z0, x + 7, 10, Z0 + 1, C.wood); m.box(x - 1, 4, Z0, x + 7, 5, Z0 + 1, C.wood); }
    win(62, 22, 64, 28, [63, 22, 64, 28]); m.box(63, 9, 21, 64, 10, 29, C.wood);
    win(0, 30, 2, 36, [0, 30, 1, 36]); m.box(0, 9, 29, 1, 10, 37, C.wood);
    // ceiling, roof, parapet (stepped up over the door)
    m.box(0, 15, Z0, 64, 17, Z1, C.adobe);
    if (open) m.box(2, 15, Z0 + 2, 62, 16, Z1 - 2, C.latilla);
    m.box(1, 16, Z0 + 1, 63, 17, Z1 - 1, C.roof);
    m.box(0, 17, Z0, 64, 18, Z1, C.adobe); m.box(1, 17, Z0 + 1, 63, 18, Z1 - 1, 0); m.box(22, 18, Z0, 42, 19, Z0 + 1, C.adobe);
    for (let x = 5; x < 60; x += 4) { m.box(x, 14, 0, x + 1, 15, Z0, C.viga); m.box(x, 14, Z1, x + 1, 15, 52, C.viga); if (open) m.box(x, 14, Z0 + 2, x + 1, 15, Z1 - 2, C.viga); }
    // canales (roof spouts) on the east wall
    for (const z of [12, 40]) m.box(63, 16, z, 64, 17, z + 1, C.tin);
    return m;
  }
  // tin porch over the door (1/8): two posts, corrugated roof, the door's two plank leaves swung back against the wall, a lamp
  function porch() {
    const m = new AF.Model(32, 22, 18);
    for (const x of [0, 30]) m.box(x, 0, 0, x + 2, 21, 2, C.woodD);
    m.box(0, 20, 0, 32, 21, 2, C.wood); for (const x of [0, 30]) m.box(x, 20, 0, x + 2, 21, 18, C.woodD);
    for (let x = 0; x < 32; x++) m.box(x, 21, 0, x + 1, 22, 18, x % 2 ? C.tin : x % 7 === 3 ? C.rust : C.tin);
    for (let x = 1; x < 32; x += 2) m.box(x, 21, 0, x + 1, 22, 18, (x * 7) % 5 === 1 ? C.rust : AF.col(0x7c8284, { metal: 0.6, rough: 0.5, jitter: 0.25, pat: 'none' }));
    for (const x0 of [0, 24]) { m.box(x0, 0, 17, x0 + 8, 20, 18, C.wood); m.box(x0, 4, 17, x0 + 8, 5, 18, C.woodD); m.box(x0, 15, 17, x0 + 8, 16, 18, C.woodD); m.line(x0, 5, 17, x0 + 7, 14, 17, C.woodD); m.box(x0 === 0 ? 7 : 24, 9, 16, x0 === 0 ? 8 : 25, 11, 17, C.steel); }
    m.box(15, 20, 14, 17, 21, 16, C.dark); m.box(15, 19, 14, 17, 20, 16, C.bulb);
    return m;
  }
  function table() {
    const m = new AF.Model(24, 7, 17);
    m.box(0, 6, 0, 24, 7, 17, C.oak);
    for (const [x, z] of [[1, 1], [21, 1], [1, 14], [21, 14]]) m.box(x, 0, z, x + 2, 6, z + 2, C.oak);
    m.box(1, 5, 1, 23, 6, 2, C.woodD); m.box(1, 5, 15, 23, 6, 16, C.woodD); m.box(1, 5, 1, 2, 6, 16, C.woodD); m.box(22, 5, 1, 23, 6, 16, C.woodD);
    m.box(3, 1, 8, 21, 2, 9, C.woodD);
    return m;
  }
  function cot() {
    const m = new AF.Model(7, 5, 16);
    for (const x of [0, 6]) { m.box(x, 3, 0, x + 1, 4, 16, C.olive); for (const z of [1, 7, 14]) m.box(x, 0, z, x + 1, 3, z + 1, C.steel); }
    m.box(1, 3, 0, 6, 4, 16, C.canvas); m.box(1, 4, 0, 6, 5, 3, C.white);
    m.box(0, 4, 7, 7, 5, 15, C.blanket); m.box(0, 3, 7, 1, 4, 15, C.blanket); m.box(6, 3, 7, 7, 4, 15, C.blanket);
    return m;
  }
  function crate(c = C.wood) { const m = new AF.Model(6, 6, 6); m.box(0, 0, 0, 6, 6, 6, c); for (const y of [0, 5]) { m.box(0, y, 0, 6, y + 1, 1, C.woodD); m.box(0, y, 5, 6, y + 1, 6, C.woodD); m.box(0, y, 0, 1, y + 1, 6, C.woodD); m.box(5, y, 0, 6, y + 1, 6, C.woodD); } return m; }
  function ammo() { const m = new AF.Model(8, 4, 5); m.box(0, 0, 0, 8, 4, 5, C.olive); m.box(0, 3, 0, 8, 4, 5, C.dark); m.box(3, 1, 0, 5, 2, 1, C.cream); for (const x of [0, 7]) m.box(x, 0, 0, x + 1, 4, 5, C.dark); return m; }
  function drum(c) { const m = new AF.Model(5, 7, 5); for (let y = 0; y < 7; y++) for (let x = 0; x < 5; x++) for (let z = 0; z < 5; z++) if (Math.hypot(x - 2, z - 2) < 2.6) m.set(x, y, z, y === 2 || y === 5 ? C.dark : c); return m; }
  function lantern() { const m = new AF.Model(4, 6, 4); m.box(0, 0, 0, 4, 1, 4, C.steel); m.box(1, 1, 1, 3, 4, 3, C.glow); for (const [x, z] of [[0, 0], [3, 0], [0, 3], [3, 3]]) m.box(x, 1, z, x + 1, 4, z + 1, C.steel); m.box(0, 4, 0, 4, 5, 4, C.steel); m.box(1, 5, 1, 3, 6, 3, C.steel); return m; }
  // radio desk (1/16) against the east wall, the radio facing west into the room
  function desk() {
    const m = new AF.Model(12, 27, 29);
    m.box(0, 11, 0, 12, 12, 29, C.oak);
    for (const [x, z] of [[1, 1], [10, 1], [1, 27], [10, 27]]) m.box(x, 0, z, x + 1, 11, z + 1, C.oak);
    m.box(1, 8, 2, 11, 11, 10, C.woodD); m.box(0, 9, 5, 1, 10, 7, C.brass);
    // receiver: olive case, two amber dials, knobs, a speaker grille
    m.box(5, 12, 3, 12, 20, 15, C.olive); m.box(4, 13, 4, 5, 19, 14, C.steel);
    m.box(3, 16, 5, 4, 18, 8, C.dial); m.box(3, 16, 10, 4, 18, 13, C.dial);
    for (const z of [5, 7, 10, 12]) m.box(3, 14, z, 4, 15, z + 1, C.dark);
    for (let z = 5; z < 13; z += 2) m.box(4, 19, z, 5, 20, z + 1, C.dark);
    // transmitter with green meters, a morse key, the microphone on its stand, headphones
    m.box(6, 12, 16, 12, 17, 23, C.steel); m.box(5, 14, 17, 6, 16, 22, C.dark); m.box(4, 15, 17, 5, 16, 19, C.dialG); m.box(4, 15, 20, 5, 16, 22, C.dialG);
    m.box(2, 12, 18, 4, 13, 21, C.dark); m.box(2, 13, 19, 3, 14, 20, C.brass);
    m.box(1, 12, 13, 3, 13, 15, C.dark); m.box(1, 13, 14, 2, 17, 15, C.steel); m.box(0, 17, 13, 3, 19, 16, C.steel);
    m.box(2, 12, 24, 5, 13, 27, C.dark); m.box(3, 13, 24, 4, 14, 27, C.dark);
    // papers + the desk lamp (green shade over a bulb)
    m.box(0, 12, 1, 4, 13, 3, C.white);
    m.box(8, 12, 24, 11, 13, 27, C.brass); m.box(9, 13, 25, 10, 22, 26, C.brass); m.box(5, 21, 25, 10, 22, 26, C.brass);
    m.box(3, 22, 23, 8, 23, 28, C.green); m.box(2, 21, 22, 9, 22, 29, C.green); m.box(4, 20, 24, 7, 21, 27, C.bulb);
    return m;
  }
  function stool() { const m = new AF.Model(6, 10, 6); m.box(0, 9, 0, 6, 10, 6, C.oak); for (const [x, z] of [[0, 0], [5, 0], [0, 5], [5, 5]]) m.box(x, 0, z, x + 1, 9, z + 1, C.oak); m.box(0, 3, 0, 6, 4, 1, C.woodD); return m; }
  function pendant() { const m = new AF.Model(6, 22, 6); m.box(2, 6, 2, 4, 22, 4, C.dark); m.box(2, 5, 2, 4, 6, 4, C.green); m.box(1, 4, 1, 5, 5, 5, C.green); m.box(0, 3, 0, 6, 4, 6, C.green); m.box(2, 2, 2, 4, 3, 4, C.bulb); return m; }
  function picture() { const m = new AF.Model(40, 4, 6); m.box(2, 1, 3, 38, 3, 6, C.brass); m.box(4, 0, 4, 36, 1, 5, C.bulb); for (const x of [5, 34]) m.box(x, 2, 0, x + 1, 3, 3, C.brass); return m; }
  function barrel() { const m = new AF.Model(12, 18, 12); for (let y = 0; y < 14; y++) for (let x = 0; x < 12; x++) for (let z = 0; z < 12; z++) if (Math.hypot(x - 5.5, z - 5.5) < 5.6) m.set(x, y, z, y % 6 === 1 ? C.dark : C.wood); m.box(2, 1, 2, 10, 14, 10, 0); for (const [x, z, h] of [[3, 4, 18], [6, 3, 16], [7, 7, 17], [4, 7, 15]]) { m.box(x, 1, z, x + 2, h, z + 2, C.white); m.box(x, h - 1, z, x + 2, h, z + 2, C.cream); } return m; }
  function rug() { const m = new AF.Model(64, 1, 48); m.box(0, 0, 0, 64, 1, 48, C.rugA); m.box(3, 0, 3, 61, 1, 45, C.rugB); m.box(5, 0, 5, 59, 1, 43, C.rugA); for (let x = 8; x < 56; x++) for (let z = 8; z < 40; z++) if ((Math.abs(x - 31.5) + Math.abs(z - 23.5)) % 12 < 2) m.set(x, 0, z, C.rugC); return m; }
  // outside: a water tank on a timber stand, a windpump, a stock trough, a radio mast with guy wires and a red beacon
  function tank() {
    const m = new AF.Model(12, 22, 12);
    for (const [x, z] of [[1, 1], [10, 1], [1, 10], [10, 10]]) m.box(x, 0, z, x + 1, 10, z + 1, C.woodD);
    for (const y of [3, 7]) { m.box(1, y, 1, 11, y + 1, 2, C.woodD); m.box(1, y, 10, 11, y + 1, 11, C.woodD); m.box(1, y, 1, 2, y + 1, 11, C.woodD); m.box(10, y, 1, 11, y + 1, 11, C.woodD); }
    m.box(0, 10, 0, 12, 11, 12, C.wood);
    for (let y = 11; y < 21; y++) for (let x = 0; x < 12; x++) for (let z = 0; z < 12; z++) { const d = Math.hypot(x - 5.5, z - 5.5); if (d < 5.9 && (y < 19 || d < 5.9 - (y - 18) * 2)) m.set(x, y, z, y % 3 === 0 ? C.rust : C.tin); }
    for (let y = 0; y < 11; y++) if (y % 2) m.set(6, y, 0, C.wood);
    return m;
  }
  function windpump() {
    const m = new AF.Model(14, 40, 14);
    for (const [sx, sz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) m.line(sx ? 13 : 0, 0, sz ? 13 : 0, sx ? 8 : 5, 32, sz ? 8 : 5, C.steel);
    for (let y = 4; y < 32; y += 7) { const i = Math.round(y * 5 / 32); m.box(i, y, i, 14 - i, y + 1, i + 1, C.steel); m.box(i, y, 13 - i, 14 - i, y + 1, 14 - i, C.steel); m.box(i, y, i, i + 1, y + 1, 14 - i, C.steel); m.box(13 - i, y, i, 14 - i, y + 1, 14 - i, C.steel); }
    m.box(5, 32, 5, 9, 34, 9, C.dark); m.box(6, 0, 6, 8, 32, 8, C.dark);
    // the wheel faces north (-z): blades on a ring, a tail vane to the south
    for (let a = 0; a < 18; a++) { const ang = a / 18 * PI * 2; for (let r = 1.5; r < 6.5; r += 0.5) m.set(Math.round(7 + Math.cos(ang) * r), Math.round(33 + Math.sin(ang) * r), 4, a % 2 ? C.tin : C.rust); }
    m.box(6, 32, 4, 8, 34, 5, C.dark);
    m.box(7, 33, 9, 8, 34, 14, C.dark); m.box(7, 31, 11, 8, 37, 14, C.tin);
    return m;
  }
  function trough() { const m = new AF.Model(6, 5, 12); m.box(0, 0, 0, 6, 5, 12, C.tin); m.box(1, 1, 1, 5, 5, 11, 0); m.box(1, 1, 1, 5, 4, 11, AF.col(0x3a6a7a, { jitter: 0.1, edge: 0, pat: 'none' })); return m; }
  function mast() {
    const m = new AF.Model(32, 92, 32);
    m.box(15, 0, 15, 17, 90, 17, C.steel);
    for (const y of [60, 72, 84]) { m.box(9, y, 15, 23, y + 1, 17, C.steel); m.box(15, y, 9, 17, y + 1, 23, C.steel); }
    m.box(14, 90, 14, 18, 92, 18, C.beacon);
    for (const [x, z] of [[1, 1], [30, 1], [1, 30], [30, 30]]) { m.line(16, 64, 16, x, 0, z, C.dark); m.box(x - 1, 0, z - 1, x + 2, 1, z + 2, C.steel); }
    return m;
  }
  // ---- the relief map (1/32 m): a wooden rim round the sea, the land in tiers, buildings as white blocks, the Harbour Trust in
  //      gold, the Solace Queen drawn in, a dotted launch route out to the islands, a compass arrow, flags on the targets
  function* mapModel() {
    const m = new AF.Model(MAPW, MAPH, MAPD);
    m.box(0, 0, 0, MAPW, 3, RIM, M.rim); m.box(0, 0, MAPD - RIM, MAPW, 3, MAPD, M.rim); m.box(0, 0, 0, RIM, 3, MAPD, M.rim); m.box(MAPW - RIM, 0, 0, MAPW, 3, MAPD, M.rim);
    for (let iu = 0; iu < MW; iu++) { for (let iv = 0; iv < MD; iv++) if (!MAP.done[iu * MD + iv]) { const [h, c] = cell(iu, iv); setCell(iu, iv, h, c); } yield; }
    // outland roads (the city's streets come from its own ground colours)
    for (const road of AF.PLAN.world.roads) {
      if (road.surface === 'trail' || road.kind === 2) continue;
      const p = road.points;
      for (let i = 1; i < p.length; i++) { const L = Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); for (let s = 0; s <= L; s += 6) { const x = AF.lerp(p[i - 1][0], p[i][0], s / L), z = AF.lerp(p[i - 1][1], p[i][1], s / L); if (W.col(x, z) >= 0) continue; const v = mapV(z), iu = Math.floor(mapU(x, v)), iv = Math.floor(v); if (iu >= 0 && iu < MW && iv >= 0 && iv < MD && MAP.heights[iu * MD + iv] > 1) MAP.colors[iu * MD + iv] = M.street; } }
    }
    yield;
    // the launch route: Pleasure Pier -> the liner -> Hotel Serena -> Corsair Key, a dashed line over the sea
    const route = [[-230, 262], [-225, 1440], PINS.island(), PINS.key()].map(([x, z]) => { const v = mapV(z); return [mapU(x, v), v]; });
    for (let i = 1; i < route.length; i++) { const [u0, v0] = route[i - 1], [u1, v1] = route[i], n = Math.ceil(Math.hypot(u1 - u0, v1 - v0)); for (let k = 0; k <= n; k++) { if (k % 3 === 2) continue; const iu = Math.floor(AF.lerp(u0, u1, k / n)), iv = Math.floor(AF.lerp(v0, v1, k / n)), j = iu * MD + iv; if (iu >= 0 && iu < MW && iv >= 0 && iv < MD && MAP.heights[j] === 1) MAP.colors[j] = M.route; } }
    for (let iu = 0; iu < MW; iu++) for (let iv = 0; iv < MD; iv++) { const j = iu * MD + iv; m.box(RIM + iu, 0, RIM + iv, RIM + iu + 1, MAP.heights[j], RIM + iv + 1, MAP.colors[j]); }
    yield;
    // the Solace Queen: navy hull, white decks, a red funnel
    { const v = mapV(1450), iv = RIM + Math.floor(v), u0 = RIM + Math.floor(mapU(-318, v)), u1 = RIM + Math.ceil(mapU(-132, v)); m.box(u0 + 1, 1, iv, u1 - 1, 2, iv + 1, M.hullD); m.box(u0, 1, iv, u0 + 1, 2, iv + 1, M.hullD); m.box(u0 + 2, 2, iv, u1 - 2, 3, iv + 1, M.hull); const f = (u0 + u1) >> 1; m.box(f, 3, iv, f + 2, 4, iv + 1, M.funnel); }
    // a compass arrow in the south-west sea
    for (let v = 51; v < 57; v++) m.set(RIM + 6, 1, RIM + v, M.route); m.box(RIM + 5, 1, RIM + 52, RIM + 8, 2, RIM + 53, M.route); m.set(RIM + 6, 2, RIM + 51, M.route);
    // flags: a stick from the relief up to 11 voxels, a 4 x 3 cloth flying east
    for (const k in PINS) { const pin = HO.pins[k]; if (!pin) continue; const [iu, iv] = pin.cell, x = RIM + iu, z = RIM + iv, base = MAP.heights[iu * MD + iv]; m.box(x, base, z, x + 1, 12, z + 1, M.ink); m.box(x + 1, 10, z, x + 4, 12, z + 1, M.flags[k]); m.set(x, 12, z, M.pinY); }
    return m;
  }
  // ---- the photo board (1/64, 180 x 102): cork in a dark frame, four polaroids (Prescott, Kit, Silas, Moretti), the Harbour Trust
  //      card in the middle, a clipping, push-pins and red string. Built facing +z, hung with rot 2 (reads left to right in the room)
  const L = AF.PLAN && null;
  void L;
  const LOOK = {
    prescott: { skin: 0xf0c8a8, hair: 0xe0dcd0, top: 0x22253a, shirt: 0xf2efe4, glasses: 0xd8b04a, bg: 0x8a9aa8 },
    kit: { skin: 0xc68a5e, hair: 0x2a1a10, top: 0xf2efe4, shirt: 0x2a4a9a, glasses: 0x2a2a2e, hat: 0xe8d8a8, bg: 0x9ab0a0 },
    silas: { skin: 0xefc19f, hair: 0x9a9a9a, top: 0x6a1a24, shirt: 0xf2efe4, chain: 0xd8b04a, bg: 0x6a5a5a },
    tony: { skin: 0xe0b090, hair: 0x14100c, top: 0x2c2c34, shirt: 0xd8d0c0, tie: 0x7a1a20, cigar: 0x6a4a2a, bg: 0x7a7a6a },
  };
  const pcols = new Map(), pc = (hex) => { let c = pcols.get(hex); if (!c) { c = fine(hex); pcols.set(hex, c); } return c; };
  function portrait(m, x0, y0, z, P) {
    m.box(x0, y0, z, x0 + 28, y0 + 34, z + 1, M.paper);
    const dk = (hex, k) => (((hex >> 16 & 255) * k) << 16) | (((hex >> 8 & 255) * k) << 8) | ((hex & 255) * k) | 0;
    for (let px = 0; px < 24; px++) for (let py = 0; py < 26; py++) {
      const x = px + 0.5 - 12, y = py + 0.5;
      let c = P.bg;
      const head = (x / 5.4) ** 2 + ((y - 15) / 7) ** 2 < 1, hairCap = (x / 6) ** 2 + ((y - 15.6) / 7.8) ** 2 < 1;
      if (y < 7.5 && Math.abs(x) < 11 - (7.5 - y) * 0.3) { c = P.top; if (Math.abs(x) < (7.5 - y) * 0.5 && y > 1) c = P.shirt; if (P.tie && Math.abs(x) < 1 && y < 6.5) c = P.tie; }
      if (y >= 6 && y < 9.5 && Math.abs(x) < 2.6) c = P.chain && y < 7.5 ? P.chain : dk(P.skin, 0.88);
      if (hairCap && !head) c = P.hair;
      if (head) { c = P.skin; if (y > 18.3 || (Math.abs(x) > 4.2 && y > 14)) c = P.hair; }
      if (head && y > 14.5 && y < 15.5 && (Math.abs(x + 2.5) < 0.6 || Math.abs(x - 2.5) < 0.6)) c = 0x1a1410;
      if (head && y > 16.6 && y < 17.4 && Math.abs(Math.abs(x) - 2.5) < 1.3) c = dk(P.hair, 0.7);
      if (head && y > 12.5 && y < 13.5 && Math.abs(x) < 0.8) c = dk(P.skin, 0.8);
      if (head && y > 10.5 && y < 11.5 && Math.abs(x) < 1.8) c = dk(P.skin, 0.65);
      if (P.glasses && y > 13.5 && y < 16.5 && (Math.abs(Math.abs(x) - 2.5) < 2) && !(y > 14.5 && y < 15.5 && Math.abs(Math.abs(x) - 2.5) < 1)) c = P.glasses;
      if (P.cigar && y > 10.5 && y < 11.5 && x > 1.5 && x < 6) c = x > 5 ? 0xff7030 : P.cigar;
      if (P.hat && ((y > 19.5 && y < 21.5 && Math.abs(x) < 10) || (y >= 21.5 && y < 25.5 && Math.abs(x) < 5.5))) c = y > 21.4 && y < 22.6 ? 0x5a3a20 : P.hat;
      m.set(x0 + 2 + px, y0 + 6 + py, z, pc(c));
    }
  }
  const BOARD = { w: 180, h: 102, d: 4, vs: 1 / 64, photos: { prescott: [14, 56], kit: [36, 10], silas: [124, 56], tony: [142, 10] } };
  function board() {
    const m = new AF.Model(BOARD.w, BOARD.h, BOARD.d);
    m.box(0, 0, 0, 180, 102, 2, M.cork);
    m.box(0, 0, 0, 180, 3, 3, M.frame); m.box(0, 99, 0, 180, 102, 3, M.frame); m.box(0, 0, 0, 3, 102, 3, M.frame); m.box(177, 0, 0, 180, 102, 3, M.frame);
    for (const k in BOARD.photos) { const [x, y] = BOARD.photos[k]; portrait(m, x, y, 2, LOOK[k]); m.box(x + 13, y + 32, 3, x + 15, y + 34, 4, M.red); }
    // header strip + the Harbour Trust card: a gold deco tower sketched on an index card
    m.box(46, 86, 2, 134, 97, 3, M.paper);
    m.box(76, 34, 2, 104, 68, 3, M.paper);
    for (let y = 38; y < 62; y++) { const w = y < 52 ? 4 : y < 56 ? 3 : y < 59 ? 2 : 1; m.box(90 - w, y, 2, 90 + w, y + 1, 3, M.gold); }
    m.box(89, 62, 2, 91, 65, 3, M.gold); m.box(82, 38, 2, 98, 39, 3, M.ink);
    m.box(89, 66, 3, 91, 68, 4, M.pinY);
    // a newspaper clipping (lines of grey type) and two note cards
    m.box(60, 12, 2, 82, 30, 3, fine(0xd8d2c0)); for (let y = 14; y < 28; y += 2) m.box(62, y, 2, y === 26 ? 80 : 78 - ((y * 7) % 5), y + 1, 3, fine(0x6a6a6a)); m.box(62, 26, 2, 80, 28, 3, M.ink);
    m.box(100, 12, 2, 122, 26, 3, fine(0xf2e27a)); m.box(103, 22, 2, 119, 23, 3, M.ink); m.box(103, 18, 2, 114, 19, 3, M.ink);
    m.box(150, 74, 2, 172, 92, 3, fine(0x9ad0e0)); for (let x = 155; x < 168; x++) for (let y = 78; y < 88; y++) if (((x - 161) / 6) ** 2 + ((y - 83) / 4) ** 2 < 1) m.set(x, y, 2, fine(0x5a9a4a));
    m.box(160, 90, 3, 162, 92, 4, M.pinY); m.box(110, 24, 3, 112, 26, 4, M.red); m.box(70, 28, 3, 72, 30, 4, M.pinY);
    // red string between the pins
    const pin = (k) => { const [x, y] = BOARD.photos[k]; return [x + 14, y + 33]; }, bank = [90, 67];
    const strings = [[pin('prescott'), pin('kit')], [pin('prescott'), bank], [pin('kit'), bank], [bank, pin('silas')], [pin('silas'), pin('tony')], [pin('tony'), pin('kit')], [pin('silas'), [161, 91]]];
    for (const [a, b] of strings) m.line(a[0], a[1], 3, b[0], b[1], 3, M.string);
    return m;
  }
  // chalk timeline (1/64, 154 x 77): the six acts down a chalk line, a circled FRIDAY and dollar doodles
  const ACTS = ['I PAPERS', 'II SERENA ISLE', 'III THE QUEEN', 'IV MIDNIGHT', 'V THE GETAWAY', 'VI CORSAIR KEY'];
  function chalkboard() {
    const m = new AF.Model(154, 77, 6);
    m.box(0, 0, 0, 154, 77, 2, M.slate);
    m.box(0, 0, 0, 154, 3, 3, M.frame); m.box(0, 74, 0, 154, 77, 3, M.frame); m.box(0, 0, 0, 3, 77, 3, M.frame); m.box(151, 0, 0, 154, 77, 3, M.frame);
    m.box(3, 0, 2, 151, 2, 6, M.frame); m.box(30, 2, 3, 36, 3, 5, M.chalk); m.box(44, 2, 3, 48, 3, 5, M.chalkY);
    m.box(11, 8, 2, 12, 70, 3, M.chalk);
    ACTS.forEach((s, i) => { const y = 62 - i * 11; m.box(9, y + 2, 2, 14, y + 5, 3, i === 5 ? M.chalkY : M.chalk); glyphs(s, (px, py) => m.set(19 + px, y + py, 2, M.chalk)); });
    glyphs('FRIDAY', (px, py) => m.set(112 + px, 54 + py, 2, M.chalkY));
    for (let a = 0; a < 64; a++) { const t = a / 64 * PI * 2; m.set(Math.round(129 + Math.cos(t) * 23), Math.round(57.5 + Math.sin(t) * 9), 2, M.chalkY); }
    glyphs('2 AM', (px, py) => m.set(118 + px, 40 + py, 2, M.chalk));
    glyphs('$$$', (px, py) => m.set(114 + px, 16 + py, 2, M.chalk));
    m.line(108, 30, 2, 136, 34, 2, M.chalk); m.line(132, 36, 2, 136, 34, 2, M.chalk); m.line(132, 32, 2, 136, 34, 2, M.chalk);
    return m;
  }
  // the bank vault blueprint (1/64, 102 x 70): white lines on blue, the round door, rows of deposit boxes, a red X
  function blueprint() {
    const m = new AF.Model(102, 70, 3);
    m.box(0, 0, 0, 102, 70, 1, M.blue);
    const rect = (x0, y0, x1, y1) => { m.box(x0, y0, 1, x1, y0 + 1, 2, M.line); m.box(x0, y1 - 1, 1, x1, y1, 2, M.line); m.box(x0, y0, 1, x0 + 1, y1, 2, M.line); m.box(x1 - 1, y0, 1, x1, y1, 2, M.line); };
    rect(2, 2, 100, 68); rect(44, 8, 96, 52); rect(8, 8, 30, 30);
    glyphs('VAULT', (px, py) => m.set(6 + px, 58 + py, 1, M.line));
    for (let a = 0; a < 80; a++) { const t = a / 80 * PI * 2; m.set(Math.round(44 + Math.cos(t) * 11), Math.round(30 + Math.sin(t) * 11), 1, M.line); if (a % 10 === 0) m.line(44, 30, 1, Math.round(44 + Math.cos(t) * 10), Math.round(30 + Math.sin(t) * 10), 1, M.line); }
    for (let x = 60; x < 92; x += 6) for (let y = 12; y < 48; y += 5) rect(x, y, x + 5, y + 4);
    m.box(30, 18, 1, 33, 19, 2, M.line); m.box(30, 18, 1, 31, 30, 2, M.line); m.line(14, 36, 1, 40, 36, 1, M.line); m.line(14, 34, 1, 14, 38, 1, M.line); m.line(40, 34, 1, 40, 38, 1, M.line);
    m.line(70, 26, 1, 80, 36, 1, M.red); m.line(70, 36, 1, 80, 26, 1, M.red); m.line(71, 26, 1, 81, 36, 1, M.red); m.line(71, 36, 1, 81, 26, 1, M.red);
    for (const [x, y] of [[3, 66], [97, 66], [3, 2], [97, 2]]) m.box(x, y, 1, x + 2, y + 2, 3, M.red);
    return m;
  }

  // ---------------------------------------------------------------- placement (streamed generator)
  const put = (geo, lx, y, lz, rot = 0, opts = {}) => { const p = O.addProp(geo, X(lx), y, Z(lz), rot, Object.assign({ tag: TAG, collide: false }, opts)); HO.props.push(p); HO.stats.props++; HO.stats.tris += geo.index.count / 3; return p; };
  // a model of w x d voxels at vs with its min corner at local (lx0, lz0)
  const putAt = (geo, w, d, vs, lx0, y, lz0, rot = 0) => put(geo, lx0 + w * vs / 2, y, lz0 + d * vs / 2, rot);
  // a wall-hung model (rot 2: faces north, into the room from the south wall) centred at lx, its back on the wall face
  const hang = (geo, m, vs, lx, yBottom, wallZ, gap = 0.004) => put(geo, lx, yBottom, wallZ - gap - m.d * vs / 2, 2);
  let generator = null;
  function* build() {
    const G = AF.outlandSites.lib.geometry, g = function* (key, make, vs, o) { return yield* G('hideout-' + key, make, vs, o); };
    // shell, porch, sign
    put(yield* g('shell', () => shell(true), 0.25, { outer: () => shell(false) }), 8, Y - 0.125, 6); yield;
    putAt(yield* g('porch', porch, 1 / 8), 32, 18, 1 / 8, 6, Y, -2.25); yield;
    const sign = textModel('DRY CREEK DEPOT', C.cream, AF.col(0x6e5038, { pat: 'plank', jitter: 0.4, edge: 0.2 }), 2);
    hang(yield* g('sign', () => sign, 1 / 20), sign, 1 / 20, 8, FY + 2.68, 0); yield;
    // the map table: table, relief map, brass plate, the pendant lamp, the rug under it all
    put(yield* g('rug', rug, 1 / 16), TX, FY + 0.001, TZ); yield;
    put(yield* g('table', table, 1 / 8), TX, FY, TZ); yield;
    const relief = yield* mapModel(); yield;
    put(yield* g('map', () => relief, MV), TX, MAP.y0, TZ); yield;
    const plate = textModel('PORT SOLACE', C.dark, C.brass, 1);
    put(yield* g('plate', () => plate, 1 / 64), TX, FY + 0.6, TZ - 0.9375 - 0.004 - plate.d / 128, 2); yield;
    put(yield* g('pendant', pendant, 1 / 16), TX, FY + 3.5 - 22 / 16, TZ); yield;
    // the south wall: chalk timeline, photo board, blueprint, the picture lamp
    const wallZ = 11.5;
    const cb = chalkboard(); hang(yield* g('chalkboard', () => cb, 1 / 64), cb, 1 / 64, 3.9, FY + 0.85, wallZ); yield;
    const bd = board(); hang(yield* g('board', () => bd, 1 / 64), bd, 1 / 64, TX, FY + 0.75, wallZ); yield;
    const bp = blueprint(); hang(yield* g('blueprint', () => bp, 1 / 64), bp, 1 / 64, 12.1, FY + 1.05, wallZ); yield;
    const lamp = picture(); hang(yield* g('picture-lamp', () => lamp, 1 / 16), lamp, 1 / 16, TX, FY + 2.42, wallZ); yield;
    // name tags on the polaroids + the header (separate fine text props over the board)
    const bvs = BOARD.vs, faceZ = wallZ - 0.004 - 3 * bvs, header = textModel('THE HARBOUR TRUST JOB', M.red, 0, 0);
    const onBoard = (geo, m, vs, bx, by) => put(geo, TX - (bx - BOARD.w / 2) * bvs, FY + 0.75 + by * bvs - m.h * vs / 2, faceZ - 0.002 - m.d * vs / 2, 2);
    onBoard(yield* g('header', () => header, 1 / 96), header, 1 / 96, 90, 91.5); yield;
    for (const [k, name] of [['prescott', 'MR PRESCOTT'], ['kit', 'KIT MORROW'], ['silas', 'SILAS CRANE'], ['tony', 'TONY MORETTI']]) {
      const t = textModel(name, M.ink, 0, 0), [x, y] = BOARD.photos[k];
      onBoard(yield* g('tag-' + k, () => t, 1 / 176), t, 1 / 176, x + 14, y + 3); yield;
    }
    // the rest of the room: cot + lantern crate, radio desk + stool, crates, map barrel
    putAt(yield* g('cot', cot, 1 / 8), 7, 16, 1 / 8, 0.56, FY, 1.6); yield;
    const crateGeo = yield* g('crate', () => crate(), 1 / 8), crateO = yield* g('crate-o', () => crate(C.olive), 1 / 8);
    putAt(crateGeo, 6, 6, 1 / 8, 0.55, FY, 0.55); putAt(yield* g('lantern', lantern, 1 / 16), 4, 4, 1 / 16, 0.8, FY + 0.75, 0.8); yield;
    putAt(yield* g('desk', desk, 1 / 16), 12, 29, 1 / 16, 14.75, FY, 1.0); putAt(yield* g('stool', stool, 1 / 16), 6, 6, 1 / 16, 14.0, FY, 1.75); yield;
    putAt(crateGeo, 6, 6, 1 / 8, 14.0, FY, 10.65); putAt(crateO, 6, 6, 1 / 8, 14.75, FY, 10.65); putAt(crateGeo, 6, 6, 1 / 8, 14.4, FY + 0.75, 10.65); putAt(crateO, 6, 6, 1 / 8, 14.75, FY, 9.9);
    putAt(yield* g('ammo', ammo, 1 / 8), 8, 5, 1 / 8, 12.3, FY, 10.85); yield;
    putAt(yield* g('barrel', barrel, 1 / 16), 12, 12, 1 / 16, 0.65, FY, 10.65); yield;
    // outside: crates + drums by the door, the tank, windpump, trough, mast, more drums by the tank
    putAt(crateGeo, 6, 6, 1 / 8, 4.1, Y, -0.85); putAt(crateO, 6, 6, 1 / 8, 4.85, Y, -1.4); putAt(crateGeo, 6, 6, 1 / 8, 4.5, Y + 0.75, -0.95);
    const drumR = yield* g('drum-r', () => drum(C.drumR), 1 / 8), drumB = yield* g('drum-b', () => drum(C.drumB), 1 / 8);
    putAt(drumR, 5, 5, 1 / 8, 1.85, Y, -0.85); putAt(drumB, 5, 5, 1 / 8, 2.5, Y, -1.45); putAt(drumR, 5, 5, 1 / 8, -1.15, Y, 1.25); putAt(drumB, 5, 5, 1 / 8, -0.65, Y, 1.95); yield;
    putAt(yield* g('tank', tank, 0.25), 12, 12, 0.25, -5.5, Y, 2.5); yield;
    putAt(yield* g('windpump', windpump, 0.25), 14, 14, 0.25, -6.25, Y, 7.75); yield;
    putAt(yield* g('trough', trough, 1 / 8), 6, 12, 1 / 8, -2.6, Y, 7.25); yield;
    putAt(yield* g('mast', mast, 1 / 8), 32, 32, 1 / 8, 16, Y, 8.5); yield;
    // a few desert plants round the pad
    if (AF.flora && AF.flora.add) for (const [x, z, k] of [[-15, -4, 'cactus'], [22, -8, 'dry-bush'], [-11, 16, 'dry-bush'], [24, 14, 'cactus'], [-4, -15, 'dry-bush'], [20, 20, 'dry-bush']]) { AF.flora.add(k, X(x), Z(z), { planted: true, scale: 0.8 }); yield; }
    HO.stats.ready = true;
  }
  const work = HO.work = (ms) => {
    if (!AF.ready || HO.stats.ready || !HO.table || !AF.outlandSites || !AF.outlandSites.lib) return false;
    const start = performance.now(), end = start + Math.min(ms, AF.MOBILE ? 2 : 3);
    if (!generator) generator = build();
    while (performance.now() < end && !HO.stats.ready) { const t = performance.now(); generator.next(); HO.stats.maxStepMs = Math.max(HO.stats.maxStepMs, performance.now() - t); }
    HO.stats.workMs += performance.now() - start; return !HO.stats.ready;
  };
  HO.settle = () => { while (work(6)); };
  AF.stream.register('hideout', { order: 26, gen: true, work, near: () => AF.ready && !!HO.table && !HO.stats.ready });

  // ---------------------------------------------------------------- tests
  const free = (p, r = 0.3, h = 1.7) => !AF.boxBlocked(p.x, p.y + 0.05, p.z, r, h);
  const onSurface = (p) => Math.abs(AF.surfaceBelow(p.x, p.z, p.y + 0.4, 2) - p.y) < 0.05;
  AF.test('hideout: Dry Creek Depot stands in the desert off the Ochre Trail, built under budget', () => {
    HO.settle();
    const at = HO.at; if (!at) return { ok: false, info: 'not built' };
    const desert = O.biome(at.x, at.z) === 'desert', roadD = Math.hypot(HO.park.x - HO.road.x, HO.park.z - HO.road.z), dy = Math.abs(HO.park.y - HO.road.y);
    const carFree = !AF.boxBlocked(HO.park.x, HO.park.y + 0.3, HO.park.z, 1.1, 1.3), parkGround = Math.abs(HO.park.y - O.groundY(HO.park.x, HO.park.z)) < 0.3;
    const drive = HO.drive.length >= 4 && HO.drive.slice(0, -1).every((p) => O.roadInfo(p[0], p[2]).d < O.roadInfo(p[0], p[2]).hw) && Math.hypot(HO.drive[0][0] - HO.road.x, HO.drive[0][2] - HO.road.z) > 80;
    const site = Math.hypot(at.x - HO.road.x, at.z - HO.road.z), clear = O.pads.every((p) => HO.pads.includes(p) || Math.max(Math.abs(p.x - HO.pads[0].x) - p.rx - HO.pads[0].rx, Math.abs(p.z - HO.pads[0].z) - p.rz - HO.pads[0].rz) > 10);
    const ok = desert && HO.stats.ready && HO.stats.tris < 60000 && roadD < 60 && dy <= 0.5 && carFree && parkGround && drive && site > 20 && site < 60 && clear && Object.keys(HO.pins).length === 8 && HO.shots.length >= 6;
    return { ok, info: (desert ? 'desert' : O.biome(at.x, at.z)) + ', ' + HO.stats.props + ' props / ' + Math.round(HO.stats.tris) + ' tris, site ' + site.toFixed(1) + ' m off the road, park ' + roadD.toFixed(1) + ' m / dy ' + dy.toFixed(2) + (carFree ? '' : ' BLOCKED') + (parkGround ? '' : ' OFF-GROUND') + ', drive ' + HO.drive.length + (drive ? '' : ' OFF-ROAD') + (clear ? '' : ', overlaps a pad') };
  });
  AF.test('hideout: door -> inside -> map table walk is clear; crew, Vera and the door spots stand free', () => {
    const path = [HO.door, HO.inside, HO.crew[0]], hits = []; let blocked = 0, steps = 0, worst = 0, y = HO.door.y;
    for (let i = 1; i < path.length; i++) for (let t = 0; t <= 1.0001; t += 0.05) {
      const x = AF.lerp(path[i - 1].x, path[i].x, t), z = AF.lerp(path[i - 1].z, path[i].z, t);
      let ny = AF.surfaceBelow(x, z, y + 0.6, 2); for (const dx of [-0.3, 0.29]) for (const dz of [-0.3, 0.29]) ny = Math.max(ny, AF.surfaceBelow(x + dx, z + dz, y + 0.55, 1)); worst = Math.max(worst, ny - y); y = ny; steps++;
      if (AF.boxBlocked(x, y + 0.05, z, 0.3, 1.7)) { blocked++; if (hits.length < 4) hits.push([+x.toFixed(2), +y.toFixed(2), +z.toFixed(2), (AF.colliders.get(Math.floor(x / 8) * 100000 + Math.floor(z / 8)) || []).filter((b) => x + 0.3 > b.x0 && x - 0.3 < b.x1 && z + 0.3 > b.z0 && z - 0.3 < b.z1 && y + 1.75 > b.y0 && y + 0.05 < b.y1).map((b) => b.tag + ' ' + [b.x0, b.y0, b.z0, b.x1, b.y1, b.z1].map((v) => +v.toFixed(2)).join(','))]); }
    }
    const spots = [HO.door, HO.inside, HO.vera, ...HO.crew], bad = spots.filter((p) => !free(p) || !onSurface(p)).length;
    const pins = Object.values(HO.pins).every((p) => Math.abs(p.x - HO.table.x) < 1.5 && Math.abs(p.z - HO.table.z) < 1.06 && p.y >= HO.table.y - 0.01);
    return { ok: !blocked && worst <= 0.55 && !bad && HO.crew.length === 4 && pins, info: 'walk ' + blocked + '/' + steps + ' blocked, max step ' + worst.toFixed(2) + ', bad spots ' + bad + '/' + spots.length + ', pins on the table ' + pins + (hits.length ? ' ' + JSON.stringify(hits) : '') };
  });
}
} catch (e) { AF.partError('44-hideout.js', e); }
