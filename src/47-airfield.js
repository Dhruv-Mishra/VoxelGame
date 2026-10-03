// ================================================================ 47-airfield.js
try {
// ===== 47-airfield: WESTGATE AIRFIELD on the west coast — an east-west runway (planes climb out over the sea), taxiway, apron,
//       a deco terminal with a control tower, two hangars, a car park, windsock + runway lights  (OWNER: west) =====
{
  const P = AF.PLAN, W = AF.W, A = P.west.air, PI = Math.PI;
  const K = () => AF.westKit;
  AF.onBuild('west-airfield', 314, () => {
    const t0 = performance.now(), col = K().col, glow = K().glow;
    const asph = [col(0x3e3e42, { jitter: 0.35, pat: 'none', patTop: 'asphalt' }), col(0x46464a, { jitter: 0.35, pat: 'none', patTop: 'asphalt' })];
    const conc = [col(0xb8b4aa, { jitter: 0.3, pat: 'none', patTop: 'slab' }), col(0xaca89e, { jitter: 0.3, pat: 'none', patTop: 'slab' })];
    const white = col(0xf2f0e8, { jitter: 0.1, pat: 'none' }), yellow = col(0xe8c23a, { jitter: 0.1, pat: 'none' });
    const paint = (a, b, c, d, fn) => W.eachCol(a, b, c, d, (bx, bz, i, x, z) => { const v = fn(x, z, bx, bz); if (v) W.C[i] = v; });
    const grassA = col(0x7a9a44, { jitter: 0.9 }), grassB = col(0x8aa84e, { jitter: 0.9 });
    paint(A.x0, A.z0, A.x1, A.z1, (x, z) => ((Math.floor(z / 6) & 1) ? grassA : grassB));        // mown stripes
    const RW = A.runway, rz0 = RW.z - RW.w / 2, rz1 = RW.z + RW.w / 2;
    paint(RW.x0, rz0, RW.x1, rz1, (x, z, bx, bz) => asph[AF.hash2(bx >> 2, bz >> 2) < 0.5 ? 0 : 1]);
    // markings: centreline dashes, edge lines, threshold piano keys, runway numbers
    paint(RW.x0 + 30, RW.z - 0.5, RW.x1 - 30, RW.z + 0.5, (x) => ((Math.floor(x / 6) & 1) ? white : null));
    paint(RW.x0, rz0 + 0.5, RW.x1, rz0 + 1, () => white); paint(RW.x0, rz1 - 1, RW.x1, rz1 - 0.5, () => white);
    for (const [ex, dir] of [[RW.x0 + 3, 1], [RW.x1 - 3, -1]]) {
      for (let k = -4; k < 4; k++) { const zz = RW.z + k * 2.6 + 0.4; paint(Math.min(ex, ex + dir * 12), zz, Math.max(ex, ex + dir * 12), zz + 1.6, () => white); }
      const txt = dir > 0 ? '09' : '27', tm = AF.textModel(txt, 1, { pad: 0, font: 'deco' });
      for (let i = 0; i < tm.w; i++) for (let j = 0; j < tm.h; j++) if (tm.get(i, j, 0)) {
        const u = ex + dir * (16 + j * 1.0), v = RW.z + (dir > 0 ? (i - tm.w / 2) : (tm.w / 2 - i)) * 1.0;
        paint(u - 0.5, v - 0.5, u + 0.5, v + 0.5, () => white);
      }
    }
    // taxiway (+ yellow centreline), connectors to both runway ends, the apron
    paint(-612, A.taxiZ - 6, -338, A.taxiZ + 6, (x, z, bx, bz) => asph[AF.hash2(bx >> 2, bz >> 2) < 0.5 ? 0 : 1]);
    for (const tx of [-612, -350]) paint(tx, A.taxiZ, tx + 12, rz0, (x, z, bx, bz) => asph[AF.hash2(bx >> 2, bz >> 2) < 0.5 ? 0 : 1]);
    paint(-606, A.taxiZ - 0.25, -344, A.taxiZ + 0.25, () => yellow);
    const [ax0, az0, ax1, az1] = A.apron;
    paint(ax0, az0, ax1, az1, (x, z) => conc[((Math.floor(x / 5) + Math.floor(z / 5)) & 1)]);
    paint(ax0, az1, ax1, A.taxiZ - 6, (x, z, bx, bz) => asph[AF.hash2(bx >> 2, bz >> 2) < 0.5 ? 0 : 1]);
    for (let x = -580; x <= -380; x += 40) paint(x - 0.25, az0 + 6, x + 0.25, az1, () => yellow);   // stand lines
    for (const x of [-450, -360]) { paint(x - 0.25, 84, x + 0.25, 118, () => yellow); paint(x - 3, 92, x + 3, 92.5, () => yellow); }
    // car park + forecourt off Airfield Road
    paint(-520, 12, -420, 42, (x, z, bx, bz) => asph[AF.hash2(bx >> 2, bz >> 2) < 0.5 ? 0 : 1]);
    for (let x = -516; x < -424; x += 3) { paint(x, 14, x + 0.2, 20, () => white); paint(x, 34, x + 0.2, 40, () => white); }
    // runway edge lights (glow at night) + the approach lights over the grass
    const rl = glow(0xfff2c0, 2.6, 'night'), gl = glow(0x40ff80, 2.6, 'night'), rd = glow(0xff4030, 2.6, 'night'), bl = glow(0x4a8aff, 2.2, 'night');
    for (let x = RW.x0; x <= RW.x1; x += 12) for (const z of [rz0 - 0.5, rz1 + 0.25]) W.fill(x, 0.25, z, x + 0.25, 0.5, z + 0.25, x < RW.x0 + 2 ? gl : x > RW.x1 - 2 ? rd : rl);
    for (let x = -600; x <= -350; x += 10) for (const z of [A.taxiZ - 6.25, A.taxiZ + 6]) W.fill(x, 0.25, z, x + 0.25, 0.5, z + 0.25, bl);
    // ---- terminal: deco, two storeys, glass wall on the apron side, the name on the roof line
    const [tx0, tz0, tx1, tz1] = A.terminal, cream = col(0xf2ece0, { pat: 'stucco', rough: 0.9 }), teal = col(0x2f6a7a), glass = col(0xa9c9d6, { glass: true, jitter: 0.05, edge: 0 });
    W.fill(tx0, 0.25, tz0, tx1, 8.5, tz0 + 0.5, cream); W.fill(tx0, 0.25, tz1 - 0.5, tx1, 8.5, tz1, cream);
    W.fill(tx0, 0.25, tz0, tx0 + 0.5, 8.5, tz1, cream); W.fill(tx1 - 0.5, 0.25, tz0, tx1, 8.5, tz1, cream);
    W.fill(tx0, 8, tz0, tx1, 8.5, tz1, cream);
    W.fill(tx0 + 0.25, 0.25, tz0 + 0.25, tx1 - 0.25, 0.5, tz1 - 0.25, col(0xe8e4dc, { pat: 'none', patTop: 'checker', rough: 0.3 }));
    W.fill(tx0 - 0.5, 8.5, tz0 - 0.5, tx1 + 0.5, 9, tz1 + 0.5, teal);
    W.fill(tx0 - 0.5, 4.25, tz0 - 0.5, tx1 + 0.5, 4.5, tz0 + 0.5, teal); W.fill(tx0 - 0.5, 4.25, tz1 - 0.5, tx1 + 0.5, 4.5, tz1 + 0.5, teal);
    for (let x = tx0 + 2; x < tx1 - 2; x += 4) { W.fill(x, 1.0, tz1 - 0.5, x + 3, 4.0, tz1, glass); W.fill(x, 5.0, tz1 - 0.5, x + 3, 7.75, tz1, glass); W.fill(x, 5.0, tz0, x + 3, 7.75, tz0 + 0.5, glass); }
    const mid = (tx0 + tx1) / 2;
    W.clear(mid - 3, 0.5, tz0, mid + 3, 4.5, tz0 + 0.5);
    W.fill(mid - 3, 3.5, tz0 - 2, mid + 3, 3.75, tz0, teal); W.fill(mid - 3, 3.5, tz1, mid + 3, 3.75, tz1 + 2, teal);   // canopies
    const nameG = K().text('WESTGATE AIRFIELD', 0xffe9b0, { font: 'deco', vs: 1 / 10, k: 1.5 });
    AF.placeStatic(nameG, mid, 15.6, tz0 - 0.75, 2, { collide: false }); AF.placeStatic(nameG, mid, 11.1, tz1 + 0.35, 0, { collide: false });
    // inside: check-in desks, benches, a departures board, a café counter
    const wood = col(0x8a5a34, { rough: 0.5 }), brass = AF.MAT.brass;
    for (let x = tx0 + 4; x < tx0 + 20; x += 5) { W.fill(x, 0.5, tz0 + 4, x + 3.5, 1.5, tz0 + 5, wood); W.fill(x, 1.5, tz0 + 4, x + 3.5, 1.6, tz0 + 5, brass); }
    for (let x = tx0 + 6; x < tx1 - 12; x += 8) { W.fill(x, 0.5, 63, x + 4, 1, 64, teal); W.fill(x, 1, 63.75, x + 4, 1.75, 64, teal); }
    W.fill(mid - 17, 4.75, tz0 + 0.5, mid - 5, 7.5, tz0 + 0.75, col(0x141414));
    W.fill(tx1 - 12, 0.5, tz0 + 3, tx1 - 3, 1.5, tz0 + 4.5, col(0x2f6a7a)); W.fill(tx1 - 12, 1.5, tz0 + 3, tx1 - 3, 1.6, tz0 + 4.5, col(0xeeeae0, { pat: 'marble' }));
    const lamp = glow(0xfff4dc, 1.8), ink = col(0x17252a), steel = AF.MAT.steel;
    const sign = (text, x, y, z, vs = 0.125) => AF.placeStatic(K().text(text, 0xffe9b0, { font: 'deco', vs, k: 1.5 }), x, y, z, 2, { collide: false });
    W.fill(tx0 + 4, 8.75, 49, tx1 - 4, 9.5, 65, cream); W.fill(mid - 13, 9.5, 50, mid + 13, 11, 64, teal);
    for (let x = tx0 + 4; x < tx1 - 2; x += 8) W.fill(x, 7.5, 48, x + 1, 7.75, 68, lamp);
    for (let depth = 0; depth < 6; depth += 0.25) {
      const inset = Math.ceil((6 - Math.sqrt(36 - (6 - depth - 0.125) ** 2)) * 4) / 4;
      for (const front of [true, false]) {
        const edgeZ = front ? tz0 + depth : tz1 - depth - 0.25;
        W.clear(tx0 - 0.5, 0.5, edgeZ, tx0 + inset, 9.25, edgeZ + 0.25);
        W.clear(tx1 - inset, 0.5, edgeZ, tx1 + 0.5, 9.25, edgeZ + 0.25);
        for (const edgeX of [tx0 + inset, tx1 - inset - 0.5]) {
          W.fill(edgeX, 0.5, edgeZ, edgeX + 0.5, 8, edgeZ + 0.25, cream);
          for (const height of [2, 5.5]) W.fill(edgeX, height, edgeZ, edgeX + 0.5, height + 1.5, edgeZ + 0.25, glass);
        }
        W.fill(tx0 + inset - 0.5, 8, edgeZ, tx1 - inset + 0.5, 8.5, edgeZ + 0.25, cream);
        W.fill(tx0 + inset - 0.75, 8.5, edgeZ, tx1 - inset + 0.75, 8.75, edgeZ + 0.25, teal);
      }
    }
    for (let x = tx0 + 10; x < tx1 - 7; x += 7) {
      if (Math.abs(x - mid) < 15) continue;
      for (const faceZ of [tz0 - 0.5, tz1]) {
        W.fill(x, 0.5, faceZ, x + 0.75, 9.5, faceZ + 0.5, cream);
        W.fill(x + 0.25, 2, faceZ - 0.25, x + 0.5, 8.75, faceZ, brass);
      }
      W.fill(x + 1.25, 1.5, tz0, x + 5.75, 3.5, tz0 + 0.5, glass);
    }
    for (const height of [3.75, 4.25, 7.75]) {
      W.fill(tx0 + 6, height, tz0 - 0.25, tx1 - 6, height + 0.25, tz0, teal);
      W.fill(tx0 + 6, height, tz1, tx1 - 6, height + 0.25, tz1 + 0.25, teal);
    }
    W.clear(mid - 12, 8, tz0, mid + 12, 11, 55.5);
    for (const x of [mid - 12.5, mid + 12]) W.fill(x, 8, tz0, x + 0.5, 14, 55.5, cream);
    W.fill(mid - 12, 8, 55.5, mid + 12, 14, 56, cream);
    W.fill(mid - 12, 4.5, tz0, mid + 12, 14, tz0 + 0.5, cream);
    W.fill(mid - 10, 6.5, tz0, mid + 10, 13.5, tz0 + 0.5, glass);
    for (let offset = -10; offset <= 10; offset += 5) {
      const finTop = 14 - Math.abs(offset) * 0.125;
      W.fill(mid + offset - 0.25, 5.5, tz0 - 0.75, mid + offset + 0.25, finTop, tz0 + 0.75, cream);
      W.fill(mid + offset - 0.25, 6.75, tz0 - 1, mid + offset + 0.25, finTop - 0.5, tz0 - 0.75, brass);
    }
    W.fill(mid - 13.5, 14, tz0 - 1, mid + 13.5, 14.5, 57, teal);
    W.fill(mid - 11, 14.5, tz0 + 1, mid + 11, 15, 55, cream);
    W.fill(mid - 8, 15, tz0 + 2, mid + 8, 15.5, 54, cream);
    W.fill(mid - 11, 14.5, tz0 - 0.5, mid + 11, 16.75, tz0, teal);
    for (let clockX = -1.75; clockX <= 1.75; clockX += 0.25) for (let clockY = -1.75; clockY <= 1.75; clockY += 0.25) {
      const radius = Math.hypot(clockX, clockY);
      if (radius > 1.75) continue;
      W.fill(mid + clockX, 11.25 + clockY, tz0 - 1.25, mid + clockX + 0.25, 11.5 + clockY, tz0 - 1, radius > 1.4 ? brass : lamp);
    }
    W.fill(mid - 0.125, 11.25, tz0 - 1.5, mid + 0.125, 12.5, tz0 - 1.25, ink);
    W.fill(mid, 11.25, tz0 - 1.5, mid + 1, 11.5, tz0 - 1.25, ink);
    for (const doorX of [mid - 6, mid, mid + 6]) {
      W.clear(doorX - 2.75, 0.5, tz0, doorX + 2.75, 4.25, tz0 + 0.5);
      W.fill(doorX - 3, 0.5, tz0 - 0.25, doorX - 2.75, 4.5, tz0 + 0.5, brass);
      W.fill(doorX + 2.75, 0.5, tz0 - 0.25, doorX + 3, 4.5, tz0 + 0.5, brass);
    }
    sign('DEPARTURES', mid - 6, 4.8, tz0 - 0.75, 0.1); sign('ARRIVALS', mid + 6, 4.8, tz0 - 0.75, 0.1);
    W.fill(mid - 25, 5.75, 30, mid + 25, 6.5, 44, cream);
    W.fill(mid - 25.5, 6.5, 29.5, mid + 25.5, 6.75, 44, teal);
    W.fill(mid - 24, 5.5, 30.5, mid + 24, 5.75, 31, brass);
    for (const offset of [-23, -14, 14, 23]) {
      W.fill(mid + offset, 0.25, 30.5, mid + offset + 0.5, 5.75, 31, steel);
      W.fill(mid + offset - 0.5, 5.25, 30, mid + offset + 1, 5.75, 31.5, cream);
    }
    for (let x = mid - 21; x < mid + 22; x += 7) W.fill(x, 5.5, 32, x + 0.5, 5.75, 42, lamp);
    paint(mid - 25, 31.5, mid + 25, 36.5, () => asph[0]);
    paint(mid - 25, 32, mid + 25, 32.25, () => yellow); paint(mid - 25, 36, mid + 25, 36.25, () => yellow);
    for (let z = 30; z < 38; z += 1) paint(mid - 3, z, mid + 3, z + 0.5, () => white);
    for (const x of [mid - 19, mid + 17]) {
      W.fill(x, 0.25, 39.5, x + 3, 1, 42, cream);
      W.fill(x + 0.25, 1, 39.75, x + 2.75, 1.5, 41.75, grassA);
      W.fill(x - 4, 0.5, 40, x - 1, 1, 41, wood); W.fill(x - 4, 1, 40.75, x - 1, 1.75, 41, teal);
    }
    for (const x of [mid - 28, mid + 28]) {
      W.fill(x, 0.25, 29, x + 0.25, 10, 29.25, steel);
      W.fill(x + 0.25, 7.75, 29, x + 2.75, 9.5, 29.25, teal); W.fill(x + 0.25, 8.5, 28.75, x + 2.75, 8.75, 29, brass);
      W.fill(x, 0.25, 39, x + 0.5, 5, 39.5, ink);
      W.fill(x - 0.5, 4.75, 38.5, x + 1, 5, 40, cream); W.fill(x - 0.25, 5, 38.75, x + 0.75, 5.75, 39.75, lamp);
    }
    for (const railZ of [59, 66]) {
      W.fill(mid - 24, 9.5, railZ, mid + 24, 9.75, railZ + 0.25, steel);
      W.fill(mid - 24, 10.75, railZ, mid + 24, 11, railZ + 0.25, brass);
      for (let x = mid - 24; x <= mid + 24; x += 2) W.fill(x, 9.5, railZ, x + 0.25, 10.75, railZ + 0.25, steel);
    }
    for (const x of [mid - 24, mid + 23.75]) { W.fill(x, 10.75, 59, x + 0.25, 11, 66, brass); for (let z = 59; z <= 66; z += 2) W.fill(x, 9.5, z, x + 0.25, 10.75, z + 0.25, steel); }
    W.fill(-473, 3.75, 21, -467, 4.25, 38, teal);
    for (const z of [22, 29, 36]) for (const x of [-473, -467.5]) W.fill(x, 0.25, z, x + 0.5, 3.75, z + 0.5, cream);
    W.fill(mid - 4, 4.5, 43.5, mid + 4, 5, 45, AF.MAT.brass);
    for (const x of [mid - 3, mid + 2.75]) W.fill(x, 0.5, 43.5, x + 0.25, 4.5, 44.5, AF.MAT.brass);
    for (const x of [mid - 2.75, mid + 2.5]) { W.fill(x, 0.5, 44.5, x + 0.25, 3.75, 46.5, glass); W.fill(x, 3.75, 44.5, x + 0.25, 4, 46.5, AF.MAT.brass); }
    W.fill(mid - 3, 0.25, 37, mid + 3, 0.5, 44, col(0x9f3034));
    W.fill(tx0 + 0.5, 0.5, 56, tx1 - 0.5, 8, 56.5, cream);
    for (const x of [-490, -484]) {
      W.clear(x - 1, 0.5, 56, x + 1, 3.5, 56.5);
      W.fill(x - 1.25, 0.5, 55.5, x - 1, 3.5, 57, steel); W.fill(x + 1, 0.5, 55.5, x + 1.25, 3.5, 57, steel);
      W.fill(x - 1.25, 3.5, 55.5, x + 1.25, 3.75, 57, teal); W.fill(x - 0.5, 3.25, 55.5, x + 0.5, 3.5, 55.75, glow(0x56ff98, 2));
      for (const side of [-1.5, 1.5]) { W.fill(x + side, 0.5, 51, x + side + 0.25, 2, 55.5, steel); }
      W.fill(x + 1.75, 0.75, 51, x + 3.5, 1.25, 58, ink); W.fill(x + 1.75, 1.25, 54, x + 3.5, 2.75, 56, teal);
      W.clear(x + 2, 1.25, 54, x + 3.25, 1.75, 56);
      for (const z of [51.5, 52.75, 57]) W.fill(x + 2, 1.25, z, x + 3.25, 1.5, z + 0.75, steel);
      W.fill(x - 2.75, 0.5, 58, x - 1.5, 1.5, 59, teal);
    }
    for (const x of [-499, -493]) for (let z = 49; z <= 54; z += 2.5) { W.fill(x, 0.5, z, x + 0.25, 1.5, z + 0.25, AF.MAT.brass); W.fill(x, 1.25, z, x + 0.25, 1.5, Math.min(55, z + 2.5), col(0x9f3034)); }
    sign('SECURITY', -487, 4.3, 55.75); sign('CHECK IN', -534, 3, 48); sign('CAFE / NEWS', -445, 3, 61);
    W.fill(-454, 0.5, 59, -438, 1.5, 60.5, teal); W.fill(-454, 1.5, 59, -438, 1.75, 60.5, brass);
    for (let x = -452; x < -440; x += 2) W.fill(x, 1.75, 60, x + 1, 2.75, 60.5, wood);
    W.fill(-542, 0.5, 50, -521, 1, 54, ink); W.fill(-540, 1, 51, -523, 1.5, 53, steel);
    sign('ARRIVALS / BAGGAGE', -531, 3, 54.5);
    for (let x = tx0 + 4; x < tx0 + 21; x += 5) { W.fill(x + 3.5, 0.5, 48, x + 4.5, 1, 51, ink); W.fill(x + 3.5, 1, 49, x + 4.5, 1.25, 50, steel); W.fill(x, 1.75, 48.5, x + 0.75, 2.25, 49, ink); }
    AF.placeStatic(K().text('SA109 COAST G1', 0xffc84a, { font: 'deco', vs: 0.1, k: 1.5 }), -502, 5.25, 45, 0, { collide: false });
    AF.placeStatic(K().text('SA227 ISLES G2', 0xffc84a, { font: 'deco', vs: 0.1, k: 1.5 }), -502, 6.5, 45, 0, { collide: false });
    for (const gx of [-450, -440]) {
      W.clear(gx - 1.5, 0.5, 69.5, gx + 1.5, 5.25, 70.5);
      sign(gx === -450 ? 'GATE 1' : 'GATE 2', gx, 5.75, 69.25);
      W.clear(gx - 1.5, 0.5, 62, gx + 1.5, 4, 69.5);
      for (let step = 0; step < 5; step++) W.fill(gx - 1.5, 0.5, 62 + step * 1.5, gx + 1.5, 0.75 + step * 0.25, 63.5 + step * 1.5, cream);
      for (const x of [gx - 1.75, gx + 1.5]) {
        for (let step = 0; step < 5; step++) W.fill(x, 1.75 + step * 0.25, 62 + step * 1.5, x + 0.25, 2 + step * 0.25, 63.5 + step * 1.5, brass);
      }
    }
    W.fill(-453, 1.5, 69.5, -354, 1.75, 78, cream);
    W.fill(-453, 1.75, 77.5, -354, 2.75, 78, cream); W.fill(-453, 2.75, 77.5, -354, 4.75, 78, glass);
    W.fill(-434, 1.75, 69.5, -354, 2.75, 70, cream); W.fill(-434, 2.75, 69.5, -354, 4.75, 70, glass);
    W.fill(-453, 4.75, 69.5, -354, 5.5, 78, cream); W.fill(-454, 5.5, 69, -353, 5.75, 78.5, teal);
    W.fill(-453, 1.75, 70, -452.5, 4.75, 77.5, cream); W.fill(-354.5, 1.75, 70, -354, 4.75, 77.5, cream);
    for (let x = -450; x < -354; x += 8) {
      W.fill(x, 1.75, 77.25, x + 0.5, 5.5, 78.25, cream);
      if (x > -432) W.fill(x, 1.75, 69.25, x + 0.5, 5.5, 70.25, cream);
      W.fill(x, 0.25, 73, x + 0.75, 1.5, 74.5, steel);
      W.fill(x + 2, 5, 71, x + 2.5, 5.25, 76, lamp);
    }
    for (const stand of [-450, -360]) {
      const bridgeX = stand + 2;
      for (let slice = -3.5; slice < 3.5; slice += 0.25) {
        const reach = Math.floor(Math.sqrt(12.25 - (slice + 0.125) ** 2) * 4) / 4;
        W.fill(bridgeX + slice, 1.5, 74 - reach, bridgeX + slice + 0.25, 1.75, 74 + reach, cream);
        W.fill(bridgeX + slice, 5.25, 74 - reach, bridgeX + slice + 0.25, 5.75, 74 + reach, teal);
      }
      for (let slice = -4.25; slice < 4.25; slice += 0.25) {
        const reach = Math.floor(Math.sqrt(18.0625 - (slice + 0.125) ** 2) * 4) / 4;
        if (reach < 0.25) continue;
        W.fill(bridgeX + slice, 5.75, 74 - reach, bridgeX + slice + 0.25, 6.5, 74 - reach + 0.25, glass);
        W.fill(bridgeX + slice, 5.75, 74 + reach - 0.25, bridgeX + slice + 0.25, 6.5, 74 + reach, glass);
        W.fill(bridgeX + slice, 6.5, 74 - reach - 0.25, bridgeX + slice + 0.25, 6.75, 74 + reach + 0.25, teal);
      }
      for (const offset of [-3, 0, 3]) for (const z of [70.5, 77.25]) W.fill(bridgeX + offset, 5.75, z, bridgeX + offset + 0.25, 6.5, z + 0.25, brass);
      W.clear(bridgeX - 1.5, 1.75, 77.25, bridgeX + 1.5, 5.25, 78.25);
      W.fill(bridgeX - 1.5, 1.5, 76, bridgeX + 1.5, 1.75, 83, steel);
      W.fill(bridgeX - 1.5, 5, 76, bridgeX + 1.5, 5.5, 83, cream);
      for (const x of [bridgeX - 1.5, bridgeX + 1.25]) {
        W.fill(x, 1.75, 76, x + 0.25, 2.75, 83, cream);
        W.fill(x, 2.75, 76, x + 0.25, 4.25, 83, glass);
        W.fill(x, 4.25, 76, x + 0.25, 5, 83, cream);
        for (const z of [78, 80, 82]) W.fill(x, 2.75, z, x + 0.25, 4.25, z + 0.25, steel);
      }
      W.fill(bridgeX - 0.5, 0.5, 79.5, bridgeX + 0.5, 1.5, 80.5, steel);
      W.fill(bridgeX - 1.25, 0.75, 79.75, bridgeX + 1.25, 1, 80.25, steel);
      for (const x of [bridgeX - 1.5, bridgeX + 1]) W.fill(x, 0.25, 79.5, x + 0.5, 1, 80.5, ink);
      sign(stand === -450 ? '01' : '02', bridgeX, 4.3, 76.75, 0.2);
    }
    for (const x of [-531, -495, -460, -442]) AF.addLight({ x, y: 6.8, z: 61, color: 0xffe6c0, intensity: 1, range: 18, kind: 'interior' });
    AF.addBuilding({ id: 'terminal-west', name: 'Westgate Airfield Terminal', kind: 'airport', box: [tx0, 0, tz0, tx1, 16.75, tz1], doors: [{ x: mid, y: 0.5, z: tz0, yaw: 0 }, { x: mid - 6, y: 0.5, z: tz0, yaw: 0 }, { x: mid + 6, y: 0.5, z: tz0, yaw: 0 }, { x: -450, y: 1.75, z: tz1, yaw: PI }, { x: -440, y: 1.75, z: tz1, yaw: PI }], interior: true, owner: 'west' });
    // ---- control tower with a glass cab + a rotating-looking beacon (glows at night)
    const [twx, twz] = A.tower;
    W.fill(twx - 3, 0.25, twz - 3, twx + 3, 16, twz + 3, cream); W.fill(twx - 3.5, 16, twz - 3.5, twx + 3.5, 16.5, twz + 3.5, teal);
    W.fill(twx - 3.25, 16.5, twz - 3.25, twx + 3.25, 19.5, twz + 3.25, glass); W.clear(twx - 2.75, 16.5, twz - 2.75, twx + 2.75, 19.5, twz + 2.75);
    W.fill(twx - 3.75, 19.5, twz - 3.75, twx + 3.75, 20, twz + 3.75, teal); W.fill(twx - 0.5, 20, twz - 0.5, twx + 0.5, 21.5, twz + 0.5, glow(0x40c0ff, 3, 'night'));
    for (let y = 2; y < 15; y += 3) W.fill(twx - 1, y, twz + 3, twx + 1, y + 1.5, twz + 3.25, glass);
    AF.addLight({ x: twx, y: 18, z: twz, color: 0xc8e8ff, intensity: 1, range: 12, kind: 'sign' });
    // ---- hangars: stepped barrel roofs, open to the apron
    const tin = [col(0x9aa0a8, { metal: 0.6, rough: 0.45 }), col(0x8a9098, { metal: 0.6, rough: 0.45 })], rust = col(0xa8603a, { metal: 0.3, rough: 0.7 });
    for (const [h0, hz0, h1, hz1] of A.hangars) {
      const w = h1 - h0, cxh = (h0 + h1) / 2;
      for (let x = h0; x < h1; x += 0.25) { const t = (x - cxh) / (w / 2), top = 4 + 8 * Math.sqrt(Math.max(0, 1 - t * t)); W.fill(x, 0.25, hz0, x + 0.25, top, hz0 + 0.25, tin[0]); W.fill(x, top - 0.25, hz0, x + 0.25, top, hz1, tin[(Math.floor(x) & 1)]); W.fill(x, top - 1, hz1 - 0.25, x + 0.25, top, hz1, rust); }
      W.fill(h0, 0.25, hz0, h0 + 0.25, 4, hz1, tin[0]); W.fill(h1 - 0.25, 0.25, hz0, h1, 4, hz1, tin[0]);
      W.eachCol(h0, hz0, h1, hz1, (bx, bz, i) => { W.C[i] = conc[(bx >> 3) & 1]; });
      for (let x = h0 + 3; x < h1 - 2; x += 6) W.fill(x, 9, hz0 + 4, x + 1, 9.25, hz1 - 4, glow(0xfff4dc, 1.6, 'night'));
      AF.addLight({ x: cxh, y: 8, z: (hz0 + hz1) / 2, color: 0xfff0d0, intensity: 1, range: 16, kind: 'interior' });
      AF.addBuilding({ id: 'hangar' + h0, name: 'Hangar', kind: 'airport', box: [h0, 0, hz0, h1, 12, hz1], doors: [{ x: cxh, y: 0.25, z: hz1, yaw: PI }], interior: true, owner: 'west', label: false });
    }
    // ---- windsock + closed airside boundary, joined to the terminal at z56
    if (AF.makeFlag) {
      W.fill(-332, 0.25, 172, -331.75, 6, 172.25, AF.MAT.steel);
      AF.makeFlag({ x: -331.9, y: 6, z: 172.1, w: 3, h: 0.9, design: 'custom', key: 'windsock', draw: (g) => { for (let i = 0; i < 5; i++) g(i * 12, 0, 12, 39, i % 2 ? '#f2f0e8' : '#ff6a1a'); } });
    }
    const post = AF.MAT.iron, mesh = col(0x697b7d, { pat: 'checker', metal: 0.65, rough: 0.75, jitter: 0.03 });
    A.perimeter = [[-650,32,-548,32],[-548,32,-548,56],[-434,56,-308,56],[-650,32,-650,246],[-308,56,-308,246],[-650,246,-308,246]];
    for (const [x0,z0,x1,z1] of A.perimeter) {
      const length = Math.hypot(x1-x0,z1-z0), dx = (x1-x0)/length, dz = (z1-z0)/length;
      for (let distance=0; distance<length; distance+=0.25) {
        const x=x0+dx*distance, z=z0+dz*distance, y=Math.max(-4,W.groundY(x,z));
        W.fill(x,y,z,x+0.25,y+2.75,z+0.25,mesh);
        if (distance%4===0) W.fill(x,y,z,x+0.5,y+3,z+0.5,post);
        W.fill(x,y+2.75,z,x+0.25,y+3,z+0.25,post);
      }
    }
    W.fill(-434.5,0.25,55.5,-434,8,56.5,cream);
    W.fill(-642,0.25,31.75,-636,3,32.5,post);
    W.fill(-642,1.25,31.5,-636,1.75,31.75,col(0xe8c23a,{pat:'checker'}));
    sign('SERVICE / CLOSED',-639,3.2,31.5,0.08);
    for(const x of [-497,-493,-481]) W.fill(x,0.25,43,x+0.25,1,43.25,brass);
    W.clear(-460,0.5,69.25,-457,3.5,70.5);
    W.clear(-460,0.5,62,-457,3.5,69.25);
    sign('APRON',-458.5,3.8,69.25,0.1);
    W.fill(-461,0.25,70,-456.5,0.5,87,cream);
    for(const x of [-523,-513,-503]) {paint(x-3,39,x+3,43,()=>yellow);sign('TAXI',x,0.6,43.25,0.08);}
    paint(-525,21,-466,30,()=>asph[0]);paint(-467,27,-460,39,()=>asph[0]);
    paint(-521,29,-518,38,()=>asph[0]);paint(-509,32,-462,36,()=>asph[0]);
    paint(-520,34,-454,40,()=>asph[0]);paint(-454,34,-442,40,()=>asph[0]);paint(-476,14,-464,20,()=>asph[0]);
    paint(-536,3,-416,9,()=>asph[0]);paint(-536,4,-530,37,()=>asph[0]);paint(-422,4,-416,26,()=>asph[0]);paint(-533,31,-526,36,()=>asph[0]);paint(-533,21,-416,25,()=>asph[0]);
    sign('SHUTTLE',-529,2.8,36.75,0.08);
    W.fill(-529.25,0.25,36.5,-529,2.75,36.75,steel);
    AF.addLabel('Westgate Airfield', (A.x0 + A.x1) / 2, 150, 'place');
    A.buildMs = Math.round(performance.now() - t0);
  });
  let securityAt = -30, securityZ = 0;
  AF.onTick('airfield-security', 445, (dt, t) => {
    const player = AF.player;
    if (AF.mode !== 'walk' || !player || Math.abs(player.x + 487) > 10 || Math.abs(player.z - 56) > 8) { securityZ = 0; return; }
    if (securityZ > 0 && securityZ < 56.25 && player.z >= 56.25 && player.y < 2 && (Math.abs(player.x + 490) < 0.85 || Math.abs(player.x + 484) < 0.85) && t - securityAt > 12) { AF.emit('toast', 'Security: all clear, enjoy your flight'); securityAt = t; }
    securityZ = player.z;
  });
  AF.onBuild('airfield-circulation-clearance',480.5,()=>{
    const lanes=[[-540,0,-526,14],[-427,0,-411,14],[-536,6,-530,37],[-422,6,-416,29],[-536,21,-416,25],[-540,27,-526,40],[-526,24,-460,28]];
    A.clearedFurniture=0;for(let index=AF.world.props.length-1;index>=0;index--){const prop=AF.world.props[index],boxes=AF.colliders.get(Math.floor(prop.x/8)*100000+Math.floor(prop.z/8)),box=prop.col||boxes?.find(box=>box.x1-box.x0<=0.8&&box.z1-box.z0<=0.8&&Math.abs((box.x0+box.x1)/2-prop.x)<0.1&&Math.abs((box.z0+box.z1)/2-prop.z)<0.1&&box.y1<=5.1);if(!box||box.y1>5.1)continue;
      if(lanes.some(([x0,z0,x1,z1])=>box.x1>x0&&box.x0<x1&&box.z1>z0&&box.z0<z1)){AF.removeStatic(prop);if(!prop.col)AF.removeCollider(box);A.clearedFurniture++;}
    }
  });
  AF.onBuild('airfield-parking',481,()=>{
    A.parking={bays:[],cars:[],taxis:[]};
    for(const z of [17,37]) for(let x=-514.5,index=0;x<-425;x+=3,index++) {
      if(z===37&&(x<-454||x>-454&&x<-442)||z===17&&x>-476&&x<-464)continue;
      A.parking.bays.push([x,z]);
    }
    const count=Math.round(A.parking.bays.length*0.7);
    const bays=A.parking.bays.map((point,index)=>({point,key:AF.hash2(index,471)})).sort((first,second)=>first.key-second.key);
    for(let index=0;index<count;index++){const [x,z]=bays[index].point;A.parking.cars.push(AF.vehicles.placeParked(null,x,z,z===17?0:PI,{seed:470+index}));}
    for(const x of [-523,-513,-503])A.parking.taxis.push(AF.vehicles.placeParked('taxi',x,41,PI/2,{noDrive:true}));
  });
  AF.onBuild('airfield-life',660,()=>{
    const VV=AF.vehicles;
    A.dropoff=VV.addRoute('Westgate drop-off',[[-471.5,10],[-471.5,25],[-478,26],[-512,26],[-522,30],[-522,34],[-508,34],[-464,34],[-464,29],[-468.5,25],[-468.5,10]],{count:5,types:['taxi','sedan','taxi','sedan','taxi'],stops:[{s:86,dwell:8}],activeRadius:350});
    A.shuttle=VV.addRoute('Westgate shuttle',[[-419,6],[-533,6],[-533,34],[-529,34],[-529,23],[-419,23]],{count:1,types:['bus'],stops:[{s:144,dwell:10}],activeRadius:350});
    for(const car of A.dropoff.cars)car.ai.v0=4;
    A.shuttle.cars[0].ai.v0=3;
    const add=(name,points,options)=>AF.walkers.addPath('airport-'+name,points,Object.assign({mode:'flow',activeRadius:350,luggage:0.7},options));
    const entrance=[[-491,0.5,38],[-491,0.5,50],[-490,0.5,50],[-490,0.5,58],[-490,0.5,61],[-458.5,0.5,61]];
    A.passengers=[
      add('departures-kerb',[[-506,0.25,37],[-506,0.5,38],...entrance],{count:10,dwell:[{i:3,t:7},{i:5,t:2}],speed:1.05}),
      add('departures-parking',[[-438,0.25,26],[-458,0.25,26],[-458,0.5,38],...entrance],{count:8,dwell:[{i:4,t:6},{i:6,t:2}],speed:1.15}),
      add('departures-bus',[[-529,0.25,37],[-516,0.5,38],...entrance],{count:6,dwell:[{i:3,t:8}],speed:1.1}),
      add('arrivals',[[-458.5,0.5,61],[-483.7,0.5,61],[-484,0.5,58],[-484,0.5,50],[-485,0.5,50],[-485,0.5,38],[-476,0.25,38],[-476,0.25,26],[-435,0.25,26]],{count:9,speed:1.1}),
      add('arrivals-taxi',[[-458.5,0.5,61],[-484,0.5,61],[-484,0.5,50],[-485,0.5,50],[-485,0.5,38],[-497,0.5,38],[-497,0.25,41],[-499,0.25,41]],{count:6,speed:1}),
    ];
    A.boarding=[];
    for(const stand of [-450,-360]){
      const points=[[-458.5,0.5,61],[-450,0.5,61],[-450,0.75,62.75],[-450,1,64.25],[-450,1.25,65.75],[-450,1.5,67.25],[-450,1.75,68.75],[-450,1.75,74],[stand+2,1.75,74],[stand+2,1.75,83]];
      const path=add('boarding-'+stand,points,{count:8,speed:1.25,mode:'pingpong',dwell:[{i:0,t:4},{i:9,t:5}]});path.enabled=false;A.boarding.push(path);
    }
    const staff=(name,x,y,z,col,pose='stand',yaw=PI)=>{
      const look=AF.peopleKit.makeLook(col===0x26324e?'police':'ticket','m','adult',AF.rng(name.length*71));look.top.col=col;look.bottom.col=0x26324e;look.pose=pose;look.yaw=yaw;
      return AF.walkers.addPath('airport-staff-'+name,[[x,y,z]],{count:1,speed:0,activeRadius:230,looks:[look]});
    };
    for(const [name,x,y,z,col] of [['security',-488.5,0.5,58.7,0x26324e],['lane2',-482,0.5,58.7,0x26324e],['checkin',-534,0.5,49.5,0x3f7f7c],['desk2',-529,0.5,49.5,0x3f7f7c],['cafe',-445,0.5,61.5,0xf3f0e6],['crew1',-566,0.25,92,0xff8a32],['crew2',-375,0.25,98,0xff8a32]])staff(name,x,y,z,col);
    A.marshallers=[staff('marshal1',-450,0.25,79,0xff8a32,'marshal',0),staff('marshal2',-360,0.25,79,0xff8a32,'marshal',0)];
  });
  AF.onBuild('airfield-staff',826,()=>{
    const spawn=(id,name,role,x,y,z,lines)=>AF.npc.spawn({id,name,role,x,y,z,visual:false,look:{},greet:[lines[0]],lines:[lines]});
    A.staff=[spawn('airport-security','Officer Reed','Airport security',-488.5,0.5,58.7,['Boarding pass, please... you are all clear.','Enjoy your flight. The apron door is beyond the lounge.']),spawn('airport-checkin','Mabel','Check-in agent',-534,0.5,49.5,['Welcome to Westgate. I can check that bag for you.','Departures through the checkpoint, gates straight ahead.']),spawn('airport-crew','Otto','Ground crew',-566,0.25,92,['The Sky Cub is ready for you.','Keep clear of the taxiway when an airliner arrives.'])];
  });
  AF.onTick('airfield-boarding',304,()=>{
    const camera=AF.camera.position;
    if(camera.x<-1000||camera.x>-50||camera.z<-320||camera.z>600)return;
    for(let index=0;index<2;index++){
      const parked=!!AF.airTraffic?.bridges[index];if(A.boarding)A.boarding[index].enabled=parked;
      let guiding=false;if(AF.airTraffic)for(const flight of AF.airTraffic.flights)if(flight.enabled&&flight.stand===(index===0?-450:-360)&&flight.phase==='taxi-in')guiding=true;
      if(A.marshallers)A.marshallers[index].actors[0].look.pose=guiding?'marshal':'stand';
    }
  });
  AF.test('airfield: painted parking is approximately seventy percent full',()=>({ok:A.parking.cars.length/A.parking.bays.length>=0.68&&A.parking.cars.length/A.parking.bays.length<=0.72&&A.parking.taxis.length===3,info:A.parking.cars.length+'/'+A.parking.bays.length+' bays + three taxis'}));
  AF.test('airfield: departure and arrival paths stay clear of static obstacles',()=>{
    let blocked=0,probes=0;for(const path of A.passengers)for(let index=1;index<path.points.length;index++){
      const before=path.points[index-1],after=path.points[index],steps=Math.ceil(Math.hypot(after[0]-before[0],after[2]-before[2])*2);
      for(let step=0;step<=steps;step++){const fraction=step/steps;probes++;if(AF.boxBlocked(before[0]+(after[0]-before[0])*fraction,before[1]+(after[1]-before[1])*fraction,before[2]+(after[2]-before[2])*fraction,0.22,1.7))blocked++;}
    }return{ok:blocked===0,info:probes+' passenger-path probes, '+blocked+' blocked'};
  });
  AF.test('airfield: local vehicles and passengers deactivate remotely',()=>{
    const camera=AF.camera.position.clone();try{AF.camera.position.set(10000,20,10000);AF.vehicles.simTraffic(1/15);AF.walkers.update(0.1,1);return{ok:A.dropoff.cars.every(car=>!car.active)&&A.shuttle.cars.every(car=>!car.active)&&A.passengers.every(path=>!path.active),info:'drop-off, shuttle and departures/arrivals gated'};}finally{AF.camera.position.copy(camera);AF.vehicles.simTraffic(1/15);AF.walkers.update(0,AF.clock.t);}
  });
  AF.test('airfield: entry and security arches are walkable', () => {
    let ok = true;
    const feet = (x, z) => Math.max(AF.surfaceBelow(x - 0.3, z, 2, 3), AF.surfaceBelow(x + 0.3, z, 2, 3), AF.surfaceBelow(x, z - 0.3, 2, 3), AF.surfaceBelow(x, z + 0.3, 2, 3));
    for (const x of [-491, -490, -484]) for (let z = x === -491 ? 38 : 52; z < (x === -491 ? 50 : 60); z += 0.5) if (AF.boxBlocked(x, 0.5, z, 0.3, 1.75)) ok = false;
    for (let z = 22; z < 38; z += 0.5) { const y = feet(-470, z); if (y > 0.5 || AF.boxBlocked(-470, y, z, 0.3, 1.75)) ok = false; }
    for (let x = -470; x >= -491; x -= 0.5) { const y = feet(x, 38); if (y > 0.5 || AF.boxBlocked(x, y, 38, 0.3, 1.75)) ok = false; }
    return { ok, info: 'car park, covered entrance and two checkpoint lanes' };
  });
  AF.test('airfield: covered concourse and raised boarding tubes are walkable', () => {
    let ok = true;
    for (const x of [-504, -503.5, -503, -479, -478.5, -478]) if (AF.boxBlocked(x, 0.5, 49, 0.3, 1.75)) ok = false;
    for (let x = -450; x <= -357; x += 0.5) if (AF.boxBlocked(x, 1.75, 74, 0.3, 1.75)) ok = false;
    for (const x of [-448, -358]) for (let z = 74; z < 83; z += 0.5) {
      if (AF.boxBlocked(x, 1.75, z, 0.3, 1.75) || Math.abs(AF.surfaceBelow(x, z, 2, 3) - 1.75) > 0.01) ok = false;
    }
    for (const x of [-450, -440]) for (let step = 0; step < 5; step++) {
      const z = 62.75 + step * 1.5, y = 0.75 + step * 0.25;
      if (AF.boxBlocked(x, y, z, 0.3, 1.75)) ok = false;
    }
    return { ok, info: 'two gate stairs, continuous covered pier, bridge floors at 1.75m' };
  });
  AF.test('airfield: perimeter blocks bodies and cars on every land and beach edge', () => {
    let probes=0, gaps=0;
    for(const [x0,z0,x1,z1] of A.perimeter) {
      const length=Math.hypot(x1-x0,z1-z0);
      for(let distance=0.5;distance<length;distance+=0.5) {
        const x=x0+(x1-x0)*distance/length+0.125,z=z0+(z1-z0)*distance/length+0.125,y=Math.max(-4,W.groundY(x,z));
        probes++; if(!AF.boxBlocked(x,y+0.05,z,0.3,1.75)||!AF.boxBlocked(x,y+0.3,z,1,1.5)) gaps++;
      }
    }
    return {ok:gaps===0&&AF.land.coastS(-650,246)<-12,info:probes+' probes, '+gaps+' gaps; sea closure z246'};
  });
  AF.test('airfield: forecourt to apron succeeds only through security', () => {
    const clear=(points)=>{
      for(let index=1;index<points.length;index++) {
        const before=points[index-1],at=points[index],steps=Math.ceil(Math.hypot(at[0]-before[0],at[1]-before[1])*4);
        for(let step=0;step<=steps;step++) {const x=before[0]+(at[0]-before[0])*step/steps,z=before[1]+(at[1]-before[1])*step/steps;if(AF.boxBlocked(x,0.5,z,0.3,1.75))return false;}
      }
      return true;
    };
    const through=clear([[-491,38],[-491,50],[-490,50],[-490,61],[-458.5,61],[-458.5,85]]);
    const west=clear([[-550,28],[-550,80]]),east=clear([[-430,38],[-430,85]]);
    return {ok:through&&!west&&!east,info:'terminal '+through+', bypass west/east '+west+'/'+east};
  });
}

} catch (e) { AF.partError('47-airfield.js', e); }
