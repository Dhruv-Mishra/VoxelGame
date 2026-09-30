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
        const u = ex + dir * (16 + (tm.h - 1 - j) * 1.0), v = RW.z + (dir > 0 ? (i - tm.w / 2) : (tm.w / 2 - i)) * 1.0;
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
    // car park + forecourt off Airfield Road
    paint(-520, 12, -420, 42, (x, z, bx, bz) => asph[AF.hash2(bx >> 2, bz >> 2) < 0.5 ? 0 : 1]);
    for (let x = -516; x < -424; x += 3) { paint(x, 14, x + 0.2, 20, () => white); paint(x, 34, x + 0.2, 40, () => white); }
    // runway edge lights (glow at night) + the approach lights over the grass
    const rl = glow(0xfff2c0, 2.6, 'night'), gl = glow(0x40ff80, 2.6, 'night'), rd = glow(0xff4030, 2.6, 'night'), bl = glow(0x4a8aff, 2.2, 'night');
    for (let x = RW.x0; x <= RW.x1; x += 12) for (const z of [rz0 - 0.5, rz1 + 0.25]) W.fill(x, 0.25, z, x + 0.25, 0.5, z + 0.25, x < RW.x0 + 2 ? gl : x > RW.x1 - 2 ? rd : rl);
    for (let x = -600; x <= -350; x += 10) for (const z of [A.taxiZ - 6.25, A.taxiZ + 6]) W.fill(x, 0.25, z, x + 0.25, 0.5, z + 0.25, bl);
    // ---- terminal: deco, two storeys, glass wall on the apron side, the name on the roof line
    const [tx0, tz0, tx1, tz1] = A.terminal, cream = col(0xf2ece0, { pat: 'stucco', rough: 0.9 }), teal = col(0x2f6a7a), glass = col(0xa9c9d6, { glass: true, jitter: 0.05, edge: 0 });
    W.fill(tx0, 0.25, tz0, tx1, 8.5, tz1, cream); W.clear(tx0 + 0.25, 0.5, tz0 + 0.25, tx1 - 0.25, 7.25, tz1 - 0.25);
    W.fill(tx0 + 0.25, 0.25, tz0 + 0.25, tx1 - 0.25, 0.5, tz1 - 0.25, col(0xe8e4dc, { pat: 'none', patTop: 'checker', rough: 0.3 }));
    W.fill(tx0 - 0.5, 8.5, tz0 - 0.5, tx1 + 0.5, 9, tz1 + 0.5, teal); W.fill(tx0 - 0.5, 4.25, tz0 - 0.5, tx1 + 0.5, 4.5, tz1 + 0.5, teal);
    for (let x = tx0 + 2; x < tx1 - 2; x += 4) { W.fill(x, 1.0, tz1 - 0.25, x + 3, 4.0, tz1, glass); W.fill(x, 5.0, tz1 - 0.25, x + 3, 7.75, tz1, glass); W.fill(x, 5.0, tz0, x + 3, 7.75, tz0 + 0.25, glass); }
    const mid = (tx0 + tx1) / 2;
    W.clear(mid - 2, 0.5, tz0, mid + 2, 3.5, tz0 + 0.25); W.clear(mid - 2, 0.5, tz1 - 0.25, mid + 2, 3.5, tz1);   // doors both sides
    W.fill(mid - 3, 3.5, tz0 - 2, mid + 3, 3.75, tz0, teal); W.fill(mid - 3, 3.5, tz1, mid + 3, 3.75, tz1 + 2, teal);   // canopies
    const nameG = K().text('WESTGATE AIRFIELD', 0xffe9b0, { font: 'deco', vs: 1 / 10, k: 2.2 });
    AF.placeStatic(nameG, mid, 9.1, tz0 - 0.35, 2, { collide: false }); AF.placeStatic(nameG, mid, 9.1, tz1 + 0.35, 0, { collide: false });
    // inside: check-in desks, benches, a departures board, a café counter
    const wood = col(0x8a5a34, { rough: 0.5 }), brass = AF.MAT.brass;
    for (let x = tx0 + 4; x < tx0 + 20; x += 5) { W.fill(x, 0.5, tz0 + 4, x + 3.5, 1.5, tz0 + 5, wood); W.fill(x, 1.5, tz0 + 4, x + 3.5, 1.6, tz0 + 5, brass); }
    for (let x = mid - 10; x < mid + 12; x += 6) { W.fill(x, 0.5, tz0 + 12, x + 4, 1.0, tz0 + 13, wood); W.fill(x, 1.0, tz0 + 12.75, x + 4, 1.75, tz0 + 13, wood); }
    W.fill(mid - 6, 3.0, tz0 + 0.25, mid + 6, 6.5, tz0 + 0.5, col(0x141414)); for (let r = 0; r < 5; r++) W.fill(mid - 5.5, 3.4 + r * 0.6, tz0 + 0.5, mid + 5.5, 3.6 + r * 0.6, tz0 + 0.55, glow(0xffc84a, 1.2));
    W.fill(tx1 - 12, 0.5, tz0 + 3, tx1 - 3, 1.5, tz0 + 4.5, col(0x2f6a7a)); W.fill(tx1 - 12, 1.5, tz0 + 3, tx1 - 3, 1.6, tz0 + 4.5, col(0xeeeae0, { pat: 'marble' }));
    for (let x = tx0 + 5; x < tx1 - 4; x += 10) { W.fill(x, 7.0, tz0 + 8, x + 1, 7.25, tz0 + 16, glow(0xfff4dc, 1.8, 'night')); AF.addLight({ x: x + 0.5, y: 6.8, z: tz0 + 12, color: 0xffe6c0, intensity: 1, range: 12, kind: 'interior' }); }
    AF.addBuilding({ id: 'terminal-west', name: 'Westgate Airfield Terminal', kind: 'airport', box: [tx0, 0, tz0, tx1, 9, tz1], doors: [{ x: mid, y: 0.5, z: tz0, yaw: 0 }, { x: mid, y: 0.5, z: tz1, yaw: PI }], interior: true, owner: 'west' });
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
    // ---- windsock + the perimeter fence along the road (gap for the car park)
    if (AF.makeFlag) {
      W.fill(-332, 0.25, 172, -331.75, 6, 172.25, AF.MAT.steel);
      AF.makeFlag({ x: -331.9, y: 6, z: 172.1, w: 3, h: 0.9, design: 'custom', key: 'windsock', draw: (g) => { for (let i = 0; i < 5; i++) g(i * 12, 0, 12, 39, i % 2 ? '#f2f0e8' : '#ff6a1a'); } });
    }
    const post = AF.MAT.iron;
    for (let x = A.x0; x < A.x1; x += 3) { if (x > -522 && x < -418) continue; W.fill(x, 0.25, A.z0, x + 0.125, 2, A.z0 + 0.125, post); }
    W.fill(A.x0, 1.75, A.z0, -522, 1.875, A.z0 + 0.125, post); W.fill(-418, 1.75, A.z0, A.x1, 1.875, A.z0 + 0.125, post);
    AF.addLabel('Westgate Airfield', (A.x0 + A.x1) / 2, 150, 'place');
    A.buildMs = Math.round(performance.now() - t0);
  });
}

} catch (e) { AF.partError('47-airfield.js', e); }
