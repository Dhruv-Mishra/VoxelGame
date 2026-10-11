// ================================================================ 48-liner.js
try {
// ===== 48-liner: the SS SOLACE QUEEN — a walkable 1930s ocean liner at anchor off the Pleasure Pier, with a Grand Casino  (OWNER: harbour) =====
// One hull + superstructure model (0.5 m voxels, world-aligned: x along the ship, bow east) and colliders from the same box list, so
// every deck, wall, stair and rail is walked on like the city. Decks: the CASINO DECK (floor y 1.5) inside the hull — Purser's cage +
// vault, the Gilded Room (high stakes), the atrium with the grand staircase and boarding doors, the main casino floor and bar — the
// PROMENADE (y 8.0) round the STARLIGHT LOUNGE (ballroom, band, bar) and the SUN DECK (y 13.0) with funnels, lifeboats and the bridge.
// Boarding: a covered gangway from the Pleasure Pier head (north door) or the sea pontoon on the south side (jet skis, boats).
// Furniture (tables, slots, chairs, chandeliers) = one InstancedMesh per kind at 1/8 m, drawn only near the ship; the crowd, dealers,
// dancers and the band are path walkers (54). AF.liner.where(x, y, z) -> 'casino' | 'inside' | 'deck' | '' for sound and the heist;
// AF.liner.tables / .spots for the casino games (78-casino) and the heist (81-heist).
{
  const PI = Math.PI, W = AF.W;
  const VS = 0.5, X0 = -280, Y0 = -5, Z0 = 297.5, NXm = 220, NYm = 78, NZm = 48, CZ = 306;
  const FLOOR = 1.5, CEIL = 7.0, DECK = 8.0, LROOF = 12.0, SUN = 13.0;
  const LN = AF.liner = { x: -225, z: CZ, len: 110, tables: [], spots: {}, cols: [], doors: {}, mesh: null, near: false, ready: false };
  // half-beam along the hull: a rounded counter stern, a long fine bow from x -192
  const hb = (x) => { const t = (x - X0) / 110; return 8.5 * (t > 0.8 ? Math.pow(Math.max(0.02, 1 - (t - 0.8) / 0.2), 0.55) : t < 0.07 ? 0.72 + 0.28 * Math.sqrt(Math.max(0, t) / 0.07) : 1); };
  const inHull = (x, z) => x > X0 + 0.5 && x < X0 + 110 && Math.abs(z - CZ) < hb(x) - 0.2;
  LN.hb = hb;
  LN.where = (x, y, z) => {
    if (x < X0 - 1 || x > X0 + 111 || z < Z0 - 1 || z > Z0 + 24 || y < -2 || y > 30) return '';
    if (!inHull(x, z) && !(z > 314 && z < 321 && x > -247 && x < -225 && y > -1)) return '';
    if (y < CEIL + 0.2 && y > FLOOR - 0.6) return (x > -250 && x < -238) || x > -222 ? 'casino' : 'inside';
    if (y > DECK - 0.3 && y < LROOF && x > -248 && x < -196 && z > 300 && z < 312) return 'inside';
    return 'deck';
  };
  AF.Vehicle.noLand = (x, z) => inHull(x, z) || (Math.abs(z - CZ) < 9.5 && x > X0 - 1 && x < X0 + 111);

  // ---------------------------------------------------------------- palette
  const c = (h, o) => AF.col(h, Object.assign({ jitter: 0.25, edge: 0.55 }, o));
  const C = {
    boot: c(0xa8302a), black: c(0x1c1e22, { jitter: 0.18 }), white: c(0xf4f0e6, { jitter: 0.12 }), cream: c(0xefe2c4, { jitter: 0.12 }), gold: c(0xd8a83a, { metal: 0.8, rough: 0.3, jitter: 0.1 }),
    teak: c(0xb08a5a, { pat: 'plank', jitter: 0.4 }), teakD: c(0x8a6a44, { pat: 'plank' }), carpet: c(0x7a1e2a, { pat: 'carpet', jitter: 0.2 }), carpet2: c(0x23305a, { pat: 'carpet', jitter: 0.2 }),
    marbleW: c(0xeee8dc, { pat: 'marble', rough: 0.3 }), marbleK: c(0x2f3038, { pat: 'marble', rough: 0.3 }), panel: c(0x5a3a24, { pat: 'panel' }), damask: c(0x6e1c24, { jitter: 0.15 }),
    parquet: c(0xa8773f, { pat: 'parquet' }), buff: c(0xe0b870, { jitter: 0.15 }), fblk: c(0x1a1a1c), steel: c(0x8b9097, { metal: 0.7, rough: 0.35 }), rope: c(0xc8b48a),
    glass: AF.col('glass'), port: AF.col(0x2a3440, { emit: 0xffd08a, emitK: 1.8, mode: 'night', jitter: 0.1, edge: 0.1 }), lamp: AF.col(0xfff0c8, { emit: 0xffd890, emitK: 2.6, mode: 'night', jitter: 0 }),
    neon: AF.col(0xffe8a0, { emit: 0xffc040, emitK: 3.2, mode: 'neon', jitter: 0 }), green: c(0x1f6a3a, { jitter: 0.12 }), boatW: c(0xf6f2ea), vaultC: c(0x8a8f96, { metal: 0.85, rough: 0.3 }),
    bars: c(0xc9a24a, { metal: 0.9, rough: 0.3 }), red: c(0xb02a2a), navy: c(0x1f2a44), wood: c(0x6a4226, { pat: 'plank' }),
  };

  // ---------------------------------------------------------------- the model + colliders from one box list (world metres, 0.5 m grid)
  const m = new AF.Model(NXm, NYm, NZm);
  const ix = (x) => Math.round((x - X0) / VS), iy = (y) => Math.round((y - Y0) / VS), iz = (z) => Math.round((z - Z0) / VS);
  const D = (x0, y0, z0, x1, y1, z1, col) => m.box(ix(x0), iy(y0), iz(z0), ix(x1), iy(y1), iz(z1), col);
  const col = (x0, y0, z0, x1, y1, z1, tag = 'liner') => { const b = AF.addCollider(x0, y0, z0, x1, y1, z1, tag); LN.cols.push(b); return b; };
  const S = (x0, y0, z0, x1, y1, z1, k) => { if (k) D(x0, y0, z0, x1, y1, z1, k); return col(x0, y0, z0, x1, y1, z1); };
  // a wall along x (z0..z1 thick) or z with door gaps [a, b] along its length (gap height to gy, default door 3 m)
  const wallX = (x0, x1, z0, z1, y0, y1, k, gaps = []) => {
    let a = x0; const gs = gaps.slice().sort((p, q) => p[0] - q[0]);
    for (const [g0, g1, gy] of gs) { if (g0 > a) S(a, y0, z0, g0, y1, z1, k); const top = gy ?? y0 + 3; if (top < y1) S(g0, top, z0, g1, y1, z1, k); a = g1; }
    if (a < x1) S(a, y0, z0, x1, y1, z1, k);
  };
  const wallZ = (z0, z1, x0, x1, y0, y1, k, gaps = []) => {
    let a = z0; const gs = gaps.slice().sort((p, q) => p[0] - q[0]);
    for (const [g0, g1, gy] of gs) { if (g0 > a) S(x0, y0, a, x1, y1, g0, k); const top = gy ?? y0 + 3; if (top < y1) S(x0, top, g0, x1, y1, g1, k); a = g1; }
    if (a < z1) S(x0, y0, a, x1, y1, z1, k);
  };

  // ---------------------------------------------------------------- hull (voxels by profile, colliders by boxes)
  const IN0 = -262, IN1 = -192;   // the casino deck interior between the stern and bow bulkheads
  const buildHull = () => {
    const yF = iy(FLOOR), yC = iy(CEIL), yD = iy(DECK);
    for (let mx = 0; mx < NXm; mx++) {
      const x = X0 + (mx + 0.5) * VS, h = hb(x), inner = x > IN0 && x < IN1;
      for (let my = 0; my < yD; my++) {
        const y = Y0 + (my + 0.5) * VS, w = h * (y < -1 ? 0.8 + 0.2 * (y + 5) / 4 : 1);
        for (let mz = 0; mz < 34; mz++) {
          const z = Z0 + (mz + 0.5) * VS, d = Math.abs(z - CZ); if (d > w) continue;
          const outer = d > w - 0.5, shell = d > w - 1.0;
          const hullC = y < -0.75 ? C.boot : y > 5.5 ? C.white : (y > 5.25 ? C.gold : C.black);
          if (inner && my >= yF && my < yC) {
            if (!shell) continue;
            // casino windows: big panes every 3 m (not over the doors or the vault)
            const wx = ((x + 262) % 3 + 3) % 3, win = y > 3 && y < 5.5 && wx > 0.75 && wx < 2.25 && x > -249 && x < -194 && !(x > -233 && x < -226);
            m.set(mx, my, mz, win ? C.glass : outer ? hullC : (y < 3.5 ? C.panel : y < 3.75 ? C.gold : C.damask));
            continue;
          }
          if (inner && my === yF - 1) { m.set(mx, my, mz, outer ? hullC : (x > -222 || (x > -250 && x < -238)) ? C.carpet : x > -238 ? (((Math.floor(x) + Math.floor(z)) & 1) ? C.marbleW : C.marbleK) : C.wood); continue; }
          if (inner && my === yC) { m.set(mx, my, mz, outer ? hullC : C.cream); continue; }
          if (my === yD - 1) { m.set(mx, my, mz, outer ? C.white : C.teak); continue; }
          // portholes in the solid bow / stern
          const port = outer && !inner && y > 2.5 && y < 3.5 && (Math.round(x * 2) % 6 === 0) && x > -276 && x < -176;
          m.set(mx, my, mz, port ? C.port : outer ? hullC : C.black);
        }
      }
      // deck rail round the edge (1 m), gold cap
      for (let mz = 0; mz < 34; mz++) {
        const z = Z0 + (mz + 0.5) * VS, d = Math.abs(z - CZ);
        if (d <= h && d > h - 0.5) { m.set(mx, yD, mz, C.white); m.set(mx, yD + 1, mz, C.white); }
      }
    }
    // colliders: the solid hull under the casino deck and every solid end, stepped along the taper (2 m slices)
    for (let x = X0; x < X0 + 110; x += 2) {
      const h = hb(x + 1), inner = x >= IN0 && x + 2 <= IN1;
      if (inner) col(x, -5, CZ - h, x + 2, FLOOR, CZ + h);
      else { col(x, -5, CZ - h * 0.85, x + 2, DECK, CZ + h * 0.85); col(x, -1, CZ - h, x + 2, DECK, CZ + h); }
      // the rail (1.2 m) on both sides
      col(x, DECK, CZ - h, x + 2, DECK + 1.2, CZ - h + 0.5); col(x, DECK, CZ + h - 0.5, x + 2, DECK + 1.2, CZ + h);
    }
    col(X0 + 110 - 1, DECK, CZ - 1, X0 + 111, DECK + 1.2, CZ + 1);   // the stem
    col(X0, DECK, CZ - 6.5, X0 + 1, DECK + 1.2, CZ + 6.5);            // the stern rail
    // casino-deck shell: side walls (doors: north x -232..-228 to the gangway, south -231..-227 to the pontoon), bulkheads, the deck over it
    wallX(IN0, IN1, Z0, Z0 + 1, FLOOR, CEIL + 1, 0, [[-232, -228, FLOOR + 3]]);
    wallX(IN0, IN1, Z0 + 16, Z0 + 17, FLOOR, CEIL + 1, 0, [[-231, -227, FLOOR + 3]]);
    S(IN0, FLOOR, Z0, IN0 + 1, CEIL, Z0 + 17, C.panel); S(IN1 - 1, FLOOR, Z0, IN1, CEIL, Z0 + 17, C.panel);
    // the deck over the casino (stair opening x -230.5..-223, z 304.5..307.5: 1.7 m of headroom on every step)
    col(IN0, CEIL, Z0, -230.5, DECK, Z0 + 17); col(-223, CEIL, Z0, IN1, DECK, Z0 + 17);
    col(-230.5, CEIL, Z0, -223, DECK, 304.5); col(-230.5, CEIL, 307.5, -223, DECK, Z0 + 17);
    D(-230.5, CEIL, 304.5, -223, DECK, 307.5, 0);
    // door frames (gold) and boarding lamps
    D(-232.5, FLOOR, Z0, -232, FLOOR + 3.5, Z0 + 0.5, C.gold); D(-228, FLOOR, Z0, -227.5, FLOOR + 3.5, Z0 + 0.5, C.gold); D(-232.5, FLOOR + 3, Z0, -227.5, FLOOR + 3.5, Z0 + 0.5, C.gold);
    D(-231.5, FLOOR, Z0 + 16.5, -231, FLOOR + 3.5, Z0 + 17, C.gold); D(-227, FLOOR, Z0 + 16.5, -226.5, FLOOR + 3.5, Z0 + 17, C.gold); D(-231.5, FLOOR + 3, Z0 + 16.5, -226.5, FLOOR + 3.5, Z0 + 17, C.gold);
  };

  // ---------------------------------------------------------------- casino deck rooms
  const buildCasinoDeck = () => {
    const F = FLOOR, T = CEIL;
    // the Purser's cage + VAULT (x -262..-250): vault room behind a round steel door, the cage counter, a staff door to the Gilded Room
    wallZ(Z0 + 1, Z0 + 16, -251, -250, F, T, C.panel, [[310.5, 312.5]]);                  // cage | Gilded Room (staff door z 310.5..312.5)
    LN.doors.staff = col(-251, F, 310.5, -250, F + 3, 312.5);
    D(-251, F + 1.0, 303, -250, F + 2.5, 309, C.bars);                                    // the cashier's grille (decor over the wall)
    S(-252.5, F, 303, -251, F + 1.1, 309, C.marbleK);                                     // the cage counter
    wallZ(Z0 + 1, Z0 + 16, -257, -256, F, T, C.vaultC, [[304.5, 307.5, F + 3]]);          // vault wall (the vault door fills the gap)
    LN.doors.vault = col(-256.75, F, 304.5, -256.25, F + 3, 307.5);
    D(-255.5, F + 0.5, 299, -251.5, F + 1.0, 300, C.wood); D(-261, F, 299, -257.5, F + 2.5, 300.5, C.steel); D(-261, F, 311.5, -257.5, F + 2.5, 313, C.steel);   // desk, deposit boxes
    for (let z = 300; z < 312; z += 1.5) D(-261, F + 0.5, z, -260, F + 2.5, z + 1, C.gold);                               // stacked gold bars in the vault
    LN.spots.vault = { x: -259, y: F, z: CZ }; LN.spots.cage = { x: -253.5, y: F, z: 306 }; LN.spots.staffDoor = { x: -250.5, y: F, z: 311.5 };
    // the Gilded Room (x -250..-238): wall to the atrium with a 3 m doorway
    wallZ(Z0 + 1, Z0 + 16, -239, -238, F, T, C.panel, [[304.5, 307.5]]);
    D(-250, T - 0.5, Z0 + 1, -238, T, Z0 + 16, C.gold);
    LN.spots.gilded = { x: -244, y: F, z: 306 };
    // atrium (x -238..-222): marble, the grand staircase up to the Starlight Lounge, the purser's desk, the cloakroom
    for (let k = 0; k < 13; k++) { const xa = -236 + k, yt = F + 0.5 * k; S(xa, F, 304.5, xa + 1, yt + 0.5, 307.5, C.panel); D(xa, yt, 304.5, xa + 1, yt + 0.5, 307.5, C.marbleW); D(xa, yt, 305, xa + 1, yt + 0.5, 307, C.carpet); }
    for (let k = 0; k < 13; k++) { D(-236 + k, F + 0.5 * (k + 1), 304, -235 + k, F + 0.5 * (k + 1) + 1, 304.5, C.gold); D(-236 + k, F + 0.5 * (k + 1), 307.5, -235 + k, F + 0.5 * (k + 1) + 1, 308, C.gold); }
    col(-236, F, 304, -223, DECK + 1, 304.5); col(-236, F, 307.5, -223, DECK + 1, 308);   // stair balustrades
    S(-226, F, 311, -223, F + 1.1, 313, C.marbleK); D(-226, F + 1.1, 311, -223, F + 1.25, 313, C.gold);                   // purser's desk
    S(-237, F, 298.5, -234, F + 1.1, 299.5, C.wood); D(-237, F + 1.1, 298.5, -234, F + 1.25, 299.5, C.gold);               // cloakroom counter
    for (const [x, z] of [[-237.5, 299], [-237.5, 313], [-222.5, 299], [-222.5, 313]]) S(x - 0.5, F, z - 0.5, x + 0.5, T, z + 0.5, C.marbleW);
    LN.spots.purser = { x: -224.5, y: F, z: 313.6, yaw: PI }; LN.spots.cloak = { x: -235.5, y: F, z: 297.9, yaw: 0 }; LN.spots.atrium = { x: -230, y: F, z: 302 };
    LN.spots.northDoor = { x: -230, y: F, z: 296.5 }; LN.spots.southDoor = { x: -229, y: F, z: 315.5 };
    // main casino (x -222..-192): a wide arch from the atrium, the bar against the bow bulkhead
    wallZ(Z0 + 1, Z0 + 16, -222, -221, F, T, C.panel, [[302, 310, F + 4.5]]);
    D(-222, F + 4.5, 302, -221, F + 5, 310, C.gold);
    S(-196, F, 300, -195, F + 1.1, 312, C.wood); D(-196.2, F + 1.1, 300, -194.8, F + 1.25, 312, C.gold);                  // the bar
    D(-193, F + 1.5, 300, -192.5, F + 3.5, 312, C.wood); for (let z = 300.5; z < 312; z += 0.5) D(-193, F + 2.0, z, -192.5, F + 2.5, z + 0.25, [C.green, C.red, C.gold][Math.floor(z * 2) % 3]);
    D(-221, T - 0.5, Z0 + 1, -193, T, Z0 + 16, C.gold);
    LN.spots.bar = { x: -197.2, y: F, z: 306, yaw: PI / 2 }; LN.spots.casino = { x: -208, y: F, z: 306 };
  };

  // ---------------------------------------------------------------- promenade, Starlight Lounge, sun deck
  const LX0 = -248, LX1 = -196, LZ0 = 300, LZ1 = 312;
  const buildUpper = () => {
    const F = DECK, T = LROOF;
    // lounge walls (white outside, cream inside), glass in between the posts
    const wallRow = (x0, x1, zo, zi) => { const za = Math.min(zo, zi); for (let x = x0; x < x1; x += 0.5) { const win = ((x - x0) % 4) >= 1 && ((x - x0) % 4) < 3.5; D(x, F, zo, x + 0.5, T, zo + 0.5, C.white); D(x, F, zi, x + 0.5, T, zi + 0.5, C.cream); if (win) D(x, F + 1, za, x + 0.5, F + 3, za + 1, C.glass); } };
    wallRow(LX0, LX1, LZ0, LZ0 + 0.5); wallRow(LX0, LX1, LZ1 - 0.5, LZ1 - 1);
    for (const x of [LX0, LX1 - 1]) for (let z = LZ0; z < LZ1; z += 0.5) { D(x, F, z, x + 1, T, z + 0.5, C.white); if (z > 302 && z < 310 && (z < 305 || z >= 307)) D(x, F + 1, z, x + 1, F + 3, z + 0.5, C.glass); }
    wallX(LX0, LX1, LZ0, LZ0 + 1, F, T, 0, [[-240, -238], [-212, -210]]); wallX(LX0, LX1, LZ1 - 1, LZ1, F, T, 0, [[-240, -238], [-212, -210]]);
    wallZ(LZ0, LZ1, LX0, LX0 + 1, F, T, 0, [[305, 307]]); wallZ(LZ0, LZ1, LX1 - 1, LX1, F, T, 0, [[305, 307]]);
    for (const [g0, g1] of [[-240, -238], [-212, -210]]) for (const z of [LZ0, LZ1 - 1]) D(g0, F, z, g1, F + 3, z + 1, 0);
    for (const x of [LX0, LX1 - 1]) D(x, F, 305, x + 1, F + 3, 307, 0);
    // floor inside: parquet dance floor, carpet elsewhere; the bandstand; the bar; the balustrade round the stair well
    D(LX0 + 1, F - 0.5, LZ0 + 1, LX1 - 1, F, LZ1 - 1, C.carpet2);
    D(-216, F - 0.5, 302.5, -204, F, 309.5, C.parquet);
    S(-201, F, 302, -197, F + 0.5, 310, C.wood);
    S(-246, F, LZ0 + 1, -239, F + 1.1, LZ0 + 2, C.wood); D(-246, F + 1.1, LZ0 + 1, -239, F + 1.25, LZ0 + 2, C.gold);
    D(-246, F + 1.5, LZ0 + 1, -239, F + 3, LZ0 + 1.5, C.wood);
    col(-231, F, 304, -223, F + 1, 304.5); col(-231, F, 307.5, -223, F + 1, 308); col(-231, F, 304, -230.5, F + 1, 308);
    D(-231, F, 304, -223, F + 1, 304.5, C.gold); D(-231, F, 307.5, -223, F + 1, 308, C.gold); D(-231, F, 304, -230.5, F + 1, 308, C.gold);
    D(-230.5, CEIL, 304.5, -223, DECK, 307.5, 0);
    // the roof = the sun deck (2 layers: cream ceiling, teak deck), rails with a gap for the aft stair, the stair itself
    S(LX0, T, LZ0, LX1, SUN, LZ1); D(LX0, T, LZ0, LX1, T + 0.5, LZ1, C.cream); D(LX0, T + 0.5, LZ0, LX1, SUN, LZ1, C.teak);
    D(LX0, T - 0.5, LZ0 + 1, LX1, T, LZ1 - 1, C.gold);
    for (let x = LX0; x < LX1; x += 0.5) { D(x, SUN, LZ0, x + 0.5, SUN + 1, LZ0 + 0.5, C.white); D(x, SUN, LZ1 - 0.5, x + 0.5, SUN + 1, LZ1, C.white); }
    for (let z = LZ0; z < LZ1; z += 0.5) { if (!(z >= 302 && z < 304)) D(LX0, SUN, z, LX0 + 0.5, SUN + 1, z + 0.5, C.white); D(LX1 - 0.5, SUN, z, LX1, SUN + 1, z + 0.5, C.white); }
    col(LX0, SUN, LZ0, LX1, SUN + 1.2, LZ0 + 0.5); col(LX0, SUN, LZ1 - 0.5, LX1, SUN + 1.2, LZ1);
    col(LX0, SUN, LZ0, LX0 + 0.5, SUN + 1.2, 302); col(LX0, SUN, 304, LX0 + 0.5, SUN + 1.2, LZ1); col(LX1 - 0.5, SUN, LZ0, LX1, SUN + 1.2, LZ1);
    for (let k = 0; k < 10; k++) S(-258 + k, F, 302, -257 + k, F + 0.5 * (k + 1), 304, C.teakD);
    col(-258, F, 301.5, -248, SUN + 1, 302); D(-258, F, 301.5, -248, F + 1, 302, C.white);
    LN.spots.sunStair = { x: -259.5, y: F, z: 303 };
    // funnels (buff, black tops) with smoke, the bridge, lifeboats, masts
    for (const fx of [-238, -226, -214]) { S(fx - 2.5, SUN, CZ - 1.75, fx + 2.5, SUN + 9.5, CZ + 1.75, C.buff); D(fx - 2.5, SUN + 9.5, CZ - 1.75, fx + 2.5, SUN + 11, CZ + 1.75, C.fblk); D(fx - 2.5, SUN + 8.5, CZ - 1.75, fx + 2.5, SUN + 9, CZ + 1.75, C.red); }
    wallX(-204, -197, 302, 302.5, SUN, SUN + 3.5, C.white); wallX(-204, -197, 309.5, 310, SUN, SUN + 3.5, C.white);
    wallZ(302, 310, -197.5, -197, SUN, SUN + 3.5, C.white); wallZ(302, 310, -204, -203.5, SUN, SUN + 3.5, C.white, [[305, 307]]);
    D(-204, SUN + 3.5, 302, -197, SUN + 4, 310, C.white); col(-204, SUN + 3.5, 302, -197, SUN + 4, 310);
    D(-197.5, SUN + 1.5, 302.5, -197, SUN + 3, 309.5, C.glass); D(-204, SUN + 1.5, 302, -198, SUN + 3, 302.5, C.glass); D(-204, SUN + 1.5, 309.5, -198, SUN + 3, 310, C.glass);
    D(-199.5, SUN, 305.5, -199, SUN + 1.2, 306.5, C.wood); for (let a = 0; a < 8; a++) D(-199.5, SUN + 1.2 + Math.sin(a * PI / 4) * 0.5, CZ + Math.cos(a * PI / 4) * 0.5, -199, SUN + 1.5 + Math.sin(a * PI / 4) * 0.5, CZ + 0.25 + Math.cos(a * PI / 4) * 0.5, C.gold);
    LN.spots.bridge = { x: -200.5, y: SUN, z: CZ, yaw: PI / 2 };
    for (const lx of [-244, -232, -220, -209]) for (const [z0, z1] of [[LZ0 + 0.5, LZ0 + 2], [LZ1 - 2, LZ1 - 0.5]]) { S(lx, SUN + 0.5, z0, lx + 4, SUN + 1.5, z1, C.boatW); D(lx, SUN + 0.5, z0, lx + 4, SUN + 0.75, z1, C.boot); D(lx + 0.5, SUN, z0 + 0.5, lx + 1, SUN + 0.5, z1 - 0.5, C.steel); D(lx + 3, SUN, z0 + 0.5, lx + 3.5, SUN + 0.5, z1 - 0.5, C.steel); }
    S(-186.5, DECK, CZ - 0.5, -185.5, 33, CZ + 0.5, C.wood); D(-190, 28, CZ - 0.25, -182, 28.5, CZ + 0.25, C.wood); D(-186.5, 33, CZ - 0.5, -185.5, 33.5, CZ + 0.5, C.lamp);
    S(-266.5, DECK, CZ - 0.5, -265.5, 30, CZ + 0.5, C.wood); D(-269, 26, CZ - 0.25, -263, 26.5, CZ + 0.25, C.wood);
    S(-279, DECK, CZ - 0.25, -278.5, DECK + 6, CZ + 0.25, C.white);
    // forecastle: anchor winches + chain
    for (const z of [CZ - 2.5, CZ + 1.5]) { S(-182, DECK, z, -180, DECK + 1, z + 1, C.steel); D(-180, DECK, z + 0.25, -176, DECK + 0.25, z + 0.75, C.fblk); }
    // deck lamps on the promenade rail
    for (let x = -270; x < -186; x += 6) for (const z of [Z0 + 0.25, Z0 + 16.75]) { D(x, DECK + 1, z - 0.25, x + 0.5, DECK + 1.5, z + 0.25, C.lamp); }
    LN.spots.promenade = { x: -236, y: F, z: 299 }; LN.spots.sun = { x: -230, y: SUN, z: 303 }; LN.spots.lounge = { x: -220, y: F, z: 306 }; LN.spots.aft = { x: -262, y: F, z: 306 }; LN.spots.bow = { x: -184, y: F, z: 306 };
  };

  // ---------------------------------------------------------------- boarding: the south pontoon (sea level) + its stair; the north gangway (voxels)
  const buildBoarding = () => {
    S(-246, -1.25, 315, -228, -0.5, 320.5, C.teakD); D(-246, -1.25, 315, -228, -0.75, 320.5, C.steel);
    for (let k = 0; k < 4; k++) S(-236 + k, -0.5, 315, -235 + k, 0.5 * k, 317, C.teak);
    S(-232, -0.5, 314.5, -226, FLOOR, 317, C.teak);
    col(-246, -0.5, 320, -228, 0.6, 320.5); col(-246.5, -0.5, 315, -246, 0.6, 320.5); D(-246, -0.5, 320, -228, 0.5, 320.5, C.white);
    col(-236, -0.5, 317, -226, FLOOR + 1, 317.5); D(-236, 0, 317, -226, FLOOR + 1, 317.5, C.white);
    LN.spots.pontoon = { x: -240, y: -0.5, z: 317.5 }; LN.spots.dock = { x: -240, z: 323 };
  };
  const buildGangway = () => {
    // from the Big Wheel platform's south rail (z 264) to the north door (z 297.5): plank deck, a short stair, rails, a striped awning
    const plank = [AF.col(0x9c7a52, { jitter: 0.6, edge: 0.8 }), AF.col(0x8a6a46, { jitter: 0.6, edge: 0.8 })], pile = AF.col(0x5a4634, { jitter: 0.5 }), rail = AF.col(0xf2ece0, { jitter: 0.15 });
    const red = AF.col(0xc8322a, { jitter: 0.2 }), wht = AF.col(0xf4efe4, { jitter: 0.15 }), bulb = AF.col(0xfff2c0, { emit: 0xffd070, emitK: 2.6, mode: 'night' });
    const x0 = -232, x1 = -228;
    W.clear(x0, 0.25, 263.5, x1, 1.5, 264.25); W.clear(x0, 0.25, 267.5, x1, 1.5, 268.25);   // the wheel platform's + the pier head's rails
    const top = (z) => z < 290 ? 0.25 : z < 292.5 ? Math.min(FLOOR, 0.25 + 0.25 * (Math.floor((z - 290) / 0.5) + 1)) : FLOOR;
    for (let z = 264; z < 297.5; z += 0.25) {
      const t = top(z), row = Math.floor(z * 4);
      W.fill(x0, t - 0.25, z, x1, t, z + 0.25, plank[row & 1]);
      if (t > 0.25) W.fill(x0, 0, z, x1, t - 0.25, z + 0.25, pile);
      for (const xa of [x0 - 0.25, x1]) { W.fill(xa, t + 0.75, z, xa + 0.25, t + 1.0, z + 0.25, rail); if (row % 8 === 0) { W.fill(xa, t, z, xa + 0.25, t + 3.0, z + 0.25, rail); W.setM(xa + 0.125, t + 1.125, z + 0.125, bulb); } }
      W.fill(x0 - 0.5, t + 3.0, z, x1 + 0.5, t + 3.25, z + 0.25, (Math.floor(z) & 1) ? red : wht);
    }
    for (let z = 266; z < 297; z += 4) for (const xa of [x0, x1 - 0.5]) W.fill(xa, -4, z, xa + 0.5, top(z) - 0.25, z + 0.5, pile);
    // the arch at the pier end
    W.fill(x0 - 0.75, 0.25, 264, x0 - 0.25, 4.5, 264.5, AF.col(0xd8a83a, { metal: 0.8, rough: 0.3 })); W.fill(x1 + 0.25, 0.25, 264, x1 + 0.75, 4.5, 264.5, AF.col(0xd8a83a, { metal: 0.8, rough: 0.3 }));
    W.fill(x0 - 0.75, 4.5, 264, x1 + 0.75, 4.75, 264.5, AF.col(0xd8a83a, { metal: 0.8, rough: 0.3 }));
    for (let x = x0 - 0.5; x < x1 + 0.5; x += 0.5) W.setM(x, 4.75, 264.25, bulb);
    if (AF.hbLib && AF.hbLib.sign) AF.placeStatic(AF.hbLib.sign('SOLACE QUEEN CASINO', AF.col(0xd8a83a, { emit: 0xffc040, emitK: 1.4, mode: 'night' }), AF.col(0x1c2a44), 1 / 14), (x0 + x1) / 2, 4.85, 264.0, 2, { collide: false });
    // the Big Wheel's fishing spot in the gangway mouth would stand people in the way
    if (AF.spots) for (let i = AF.spots.length - 1; i >= 0; i--) { const s = AF.spots[i]; if (s.x > x0 - 1 && s.x < x1 + 1 && s.z > 261 && s.z < 266) AF.spots.splice(i, 1); }
    AF.addLight({ x: -230, y: 3.5, z: 270, color: 0xffd08a, intensity: 1.1, range: 10, kind: 'street' }); AF.addLight({ x: -230, y: 3.5, z: 285, color: 0xffd08a, intensity: 1.1, range: 10, kind: 'street' });
    LN.spots.gangway = { x: -230, y: 0.25, z: 266 };
  };

  // ---------------------------------------------------------------- furniture: one model per kind at 1/8 m, instanced (front = +z)
  const fm = {}, FV = 1 / 8;
  const fc = (h, o) => AF.col(h, Object.assign({ jitter: 0.15, edge: 0.3 }, o));
  const FC = { felt: fc(0x1f7a46, { rough: 0.95 }), feltD: fc(0x14562f), rim: fc(0x5a3418, { rough: 0.5 }), gold: fc(0xd8b04a, { metal: 0.85, rough: 0.3 }), red: fc(0xb8202a), black: fc(0x1a1a1e), white: fc(0xf2efe4),
    chrome: fc(0xd8dcdf, { metal: 0.9, rough: 0.2 }), screen: AF.col(0xfff0c0, { emit: 0xffd070, emitK: 1.8, mode: 'always', jitter: 0 }), bulb: AF.col(0xfff4d0, { emit: 0xffe0a0, emitK: 3, mode: 'always', jitter: 0 }),
    crystal: AF.col(0xe8f4ff, { emit: 0xfff0d0, emitK: 1.3, mode: 'always', jitter: 0 }), leaf: fc(0x3f7a3a), pot: fc(0x8a5a36), velvet: fc(0x6e1c2a), wood: fc(0x7a4a26), chipR: fc(0xc8302a), chipB: fc(0x2a4a9a), canvas: fc(0xf2e8d0), stripe: fc(0x2a6a9a) };
  const legs = (M, w, d, h) => { for (const [x, z] of [[1, 1], [w - 2, 1], [1, d - 2], [w - 2, d - 2]]) M.box(x, 0, z, x + 1, h, z + 1, FC.rim); };
  const MODELS = {
    roulette: () => { const M = new AF.Model(26, 8, 13); legs(M, 26, 13, 6); M.box(0, 6, 0, 26, 7, 13, FC.rim); M.box(1, 6, 1, 25, 7, 12, FC.felt);
      for (let i = 0; i < 12; i++) for (let j = 0; j < 3; j++) M.set(9 + i, 6, 3 + j * 2, (i + j) % 2 ? FC.red : FC.black); M.box(8, 6, 3, 9, 7, 9, FC.feltD);
      M.box(1, 7, 2, 8, 8, 11, FC.rim); M.box(2, 7, 3, 7, 8, 10, FC.wood); for (const [x, z] of [[12, 10], [15, 10], [18, 2]]) M.box(x, 7, z, x + 1, 8, z + 1, (x & 1) ? FC.chipR : FC.chipB); return M; },
    wheel: () => { const M = new AF.Model(6, 2, 6); for (let x = 0; x < 6; x++) for (let z = 0; z < 6; z++) { const d = Math.hypot(x - 2.5, z - 2.5); if (d < 3) M.set(x, 0, z, d < 1 ? FC.gold : ((x + z) & 1 ? FC.red : FC.black)); } M.box(2, 1, 2, 4, 2, 4, FC.gold); return M; },
    blackjack: () => { const M = new AF.Model(20, 8, 11); for (let x = 0; x < 20; x++) for (let z = 0; z < 11; z++) { const d = Math.hypot((x - 9.5) / 10, (z - 0) / 11); if (d < 1) { M.set(x, 6, z, d > 0.88 ? FC.rim : FC.felt); if (d > 0.88) M.set(x, 7, z, FC.rim); } }
      M.box(8, 0, 1, 12, 6, 5, FC.rim); M.box(7, 7, 0, 13, 8, 2, FC.black); for (let i = 0; i < 5; i++) M.set(8 + i, 7, 1, [FC.chipR, FC.chipB, FC.gold, FC.white, FC.chipR][i]); return M; },
    craps: () => { const M = new AF.Model(30, 9, 14); legs(M, 30, 14, 6); M.box(0, 6, 0, 30, 9, 14, FC.rim); M.box(1, 6, 1, 29, 8, 13, FC.felt); M.box(14, 7, 1, 16, 8, 13, FC.white); M.box(1, 8, 1, 29, 9, 2, FC.chrome); M.box(1, 8, 12, 29, 9, 13, FC.chrome); return M; },
    baccarat: () => { const M = new AF.Model(26, 8, 14); for (let x = 0; x < 26; x++) for (let z = 0; z < 14; z++) { const d = Math.hypot((x - 12.5) / 13, (z - 6.5) / 7); if (d < 1) { M.set(x, 6, z, d > 0.86 ? FC.rim : FC.felt); if (d > 0.86) M.set(x, 7, z, FC.rim); } }
      M.box(10, 0, 5, 16, 6, 9, FC.rim); M.box(11, 7, 1, 15, 8, 3, FC.gold); return M; },
    slot: () => { const M = new AF.Model(6, 15, 5); M.box(0, 0, 0, 6, 11, 5, FC.red); M.box(0, 11, 0, 6, 14, 4, FC.gold); M.box(1, 12, 4, 5, 14, 5, FC.bulb); M.box(1, 7, 4, 5, 10, 5, FC.screen);
      for (let i = 0; i < 3; i++) M.set(1 + i * 1.5, 8, 5, [FC.chipR, FC.gold, FC.chipB][i]); M.box(1, 4, 4, 5, 5, 6, FC.chrome); M.box(6, 7, 2, 7, 12, 3, FC.chrome); M.box(5, 12, 1, 7, 14, 4, FC.red); M.box(0, 14, 1, 6, 15, 3, FC.bulb); return M; },
    stool: () => { const M = new AF.Model(3, 7, 3); M.box(1, 0, 1, 2, 6, 2, FC.chrome); M.box(0, 6, 0, 3, 7, 3, FC.velvet); return M; },
    chair: () => { const M = new AF.Model(4, 8, 4); legs(M, 4, 4, 3); M.box(0, 3, 0, 4, 4, 4, FC.velvet); M.box(0, 4, 0, 4, 8, 1, FC.wood); return M; },
    chandelier: () => { const M = new AF.Model(11, 8, 11); M.box(5, 5, 5, 6, 8, 6, FC.gold); for (let a = 0; a < 8; a++) { const x = Math.round(5 + Math.cos(a * PI / 4) * 4), z = Math.round(5 + Math.sin(a * PI / 4) * 4); M.line(5, 4, 5, x, 3, z, FC.gold); M.box(x, 1, z, x + 1, 4, z + 1, FC.crystal); } M.box(4, 0, 4, 7, 5, 7, FC.crystal); return M; },
    palm: () => { const M = new AF.Model(9, 20, 9); M.box(2, 0, 2, 7, 4, 7, FC.pot); M.box(4, 4, 4, 5, 15, 5, FC.wood); for (let a = 0; a < 6; a++) { const dx = Math.cos(a * 1.05), dz = Math.sin(a * 1.05); for (let t = 0; t < 5; t++) M.set(Math.round(4.5 + dx * t), 15 + Math.round(Math.sin(t / 5 * 2.6) * 3) - (t > 3 ? 1 : 0), Math.round(4.5 + dz * t), FC.leaf); } return M; },
    table: () => { const M = new AF.Model(7, 6, 7); M.box(3, 0, 3, 4, 5, 4, FC.chrome); for (let x = 0; x < 7; x++) for (let z = 0; z < 7; z++) if (Math.hypot(x - 3, z - 3) < 3.4) M.set(x, 5, z, FC.white); M.box(3, 6, 3, 4, 6, 4, FC.bulb); return M; },
    deckchair: () => { const M = new AF.Model(5, 6, 12); M.box(0, 0, 0, 1, 3, 12, FC.wood); M.box(4, 0, 0, 5, 3, 12, FC.wood); for (let z = 0; z < 12; z++) M.box(1, z < 4 ? 2 + Math.round(z * 0.9) : 2, z, 4, (z < 4 ? 2 + Math.round(z * 0.9) : 2) + 1, z + 1, (z >> 1) & 1 ? FC.canvas : FC.stripe); return M; },
    piano: () => { const M = new AF.Model(12, 9, 8); M.box(0, 2, 0, 12, 8, 8, FC.black); M.box(0, 0, 0, 1, 2, 1, FC.black); M.box(11, 0, 0, 12, 2, 1, FC.black); M.box(0, 6, 6, 12, 7, 8, FC.white); M.box(1, 8, 0, 11, 9, 4, FC.black); return M; },
    ringbuoy: () => { const M = new AF.Model(5, 5, 1); for (let x = 0; x < 5; x++) for (let y = 0; y < 5; y++) { const d = Math.hypot(x - 2, y - 2); if (d > 1.2 && d < 2.6) M.set(x, y, 0, (x + y) & 2 ? FC.red : FC.white); } return M; },
  };
  const PLACE = { roulette: [], wheel: [], blackjack: [], craps: [], baccarat: [], slot: [], stool: [], chair: [], chandelier: [], palm: [], table: [], deckchair: [], piano: [], ringbuoy: [] };
  const put = (k, x, y, z, yaw = 0) => { PLACE[k].push([x, y, z, yaw]); };
  const layout = () => {
    const F = FLOOR;
    // the main floor: two roulette wheels, three blackjack tables, craps; slots along both walls; the bar stools
    for (const z of [303, 309]) { put('roulette', -214, F, z, 0); put('wheel', -215.06, F + 0.875, z, 0); LN.tables.push({ kind: 'roulette', x: -214, y: F, z, w: 3.25, d: 1.6 }); }
    for (const z of [301.5, 306, 310.5]) { put('blackjack', -205.5, F, z - 0.65, 0); LN.tables.push({ kind: 'blackjack', x: -205.5, y: F, z: z - 0.65 + 0.7, w: 2.5, d: 1.4 }); for (const dx of [-0.9, 0, 0.9]) put('stool', -205.5 + dx, F, z + 0.75, 0); }
    put('craps', -199.5, F, 306, PI / 2); LN.tables.push({ kind: 'craps', x: -199.5, y: F, z: 306, w: 1.75, d: 3.75 });
    for (let i = 0; i < 9; i++) { const x = -220 + i * 1.25; put('slot', x, F, Z0 + 1.6, 0); LN.tables.push({ kind: 'slot', x, y: F, z: Z0 + 1.6, w: 0.75, d: 0.65, face: 1 }); put('slot', x, F, Z0 + 15.4, PI); LN.tables.push({ kind: 'slot', x, y: F, z: Z0 + 15.4, w: 0.75, d: 0.65, face: -1 }); }
    for (let z = 300.6; z < 312; z += 1.25) put('stool', -197, F, z, PI / 2);
    // the Gilded Room: two baccarat tables with velvet chairs
    for (const z of [303.2, 308.8]) { put('baccarat', -244, F, z, 0); LN.tables.push({ kind: 'baccarat', x: -244, y: F, z, w: 3.25, d: 1.75 }); for (const [dx, dz, a] of [[-1.2, 1.2, PI], [0, 1.25, PI], [1.2, 1.2, PI]]) put('chair', -244 + dx, F, z + dz, a); }
    // chandeliers + palms
    for (const [x, y, z] of [[-215, CEIL - 1.0, 306], [-205, CEIL - 1.0, 306], [-230, CEIL - 1.0, 301], [-244, CEIL - 1.0, 306], [-238, LROOF - 1.0, 306], [-222, LROOF - 1.0, 306], [-208, LROOF - 1.0, 306]]) put('chandelier', x, y, z, 0);
    for (const [x, z] of [[-236.5, 302], [-236.5, 310], [-223.5, 302], [-223.5, 310], [-220.5, 300], [-220.5, 312]]) put('palm', x, F, z, 0);
    // the lounge: café tables round the dance floor, the piano on the bandstand; deck chairs on the sun deck and the aft deck
    for (const x of [-244, -240, -236, -219, -202.5]) for (const z of [302.5, 309.5]) { if (x === -202.5) continue; put('table', x, DECK, z, 0); put('chair', x - 0.7, DECK, z, PI / 2); put('chair', x + 0.7, DECK, z, -PI / 2); }
    put('piano', -199, DECK + 0.5, 303.5, -PI / 2);
    for (let x = -246; x < -206; x += 2.2) { if (x > -241 && x < -235 || x > -229 && x < -223 || x > -217 && x < -211) continue; put('deckchair', x, SUN, 303.5, 0); put('deckchair', x, SUN, 308.5, PI); }
    for (let x = -276; x < -262; x += 2) { put('deckchair', x, DECK, 300.5, 0); put('deckchair', x, DECK, 311.5, PI); }
    for (let x = -268; x < -190; x += 12) { put('ringbuoy', x, DECK + 0.2, Z0 + 0.6, PI); put('ringbuoy', x, DECK + 0.2, Z0 + 16.4, 0); }
    // colliders for the big pieces (tables, slots); chairs and stools stay walk-through
    for (const t of LN.tables) { const hw = t.w / 2, hd = t.d / 2; col(t.x - hw, t.y, t.z - hd, t.x + hw, t.y + 1.0, t.z + hd); }
    col(-200.5, DECK + 0.5, 302.5, -197.5, DECK + 1.6, 304.5);
  };
  const IMS = LN.ims = [];
  let wheelIM = null;
  const instMesh = () => {
    const dm = new THREE.Object3D();
    for (const k in PLACE) {
      const L = PLACE[k]; if (!L.length) continue;
      const geo = AF.meshModel(MODELS[k](), { vs: FV, anchor: [0.5, 0, 0.5] }); delete geo.userData.src;
      const im = new THREE.InstancedMesh(geo, AF.mat.voxelInst, L.length); im.name = 'liner-' + k; im.customDepthMaterial = AF.mat.depthInst;
      im.castShadow = false; im.receiveShadow = true; im.frustumCulled = false; im.visible = false;
      L.forEach(([x, y, z, yaw], i) => { dm.position.set(x, y, z); dm.rotation.set(0, yaw, 0); dm.updateMatrix(); im.setMatrixAt(i, dm.matrix); });
      im.instanceMatrix.needsUpdate = true; AF.scene.add(im); IMS.push(im);
      if (k === 'wheel') { wheelIM = im; im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); }
    }
  };

  // ---------------------------------------------------------------- people: gamblers, dealers, the band, dancers, strollers (path walkers)
  const crowd = () => {
    const WK = AF.walkers; if (!WK || !WK.addPath || !AF.peopleKit) return;
    const rng = AF.rng(4242), tux = [0x1a1a1e, 0x22253a, 0x2a2024], gowns = [0xb8202a, 0x2a4a9a, 0xd8b04a, 0x6a2a7a, 0x1d6a5a, 0xf2efe4];
    const look = (pose, yaw, role) => {
      const f = rng() < 0.5, L = AF.peopleKit.makeLook('traveler', f ? 'f' : 'm', 'adult', rng);
      L.top = Object.assign({}, L.top || {}, f ? { col: gowns[(rng() * gowns.length) | 0] } : { col: tux[(rng() * tux.length) | 0] });
      L.bottom = Object.assign({}, L.bottom || {}, { col: f ? L.top.col : 0x1a1a1e });
      if (role === 'dealer') { L.top.col = 0xf2efe4; L.bottom.col = 0x1a1a1e; }
      if (role === 'band') { L.top.col = 0xf2efe4; L.bottom.col = 0x1a1a1e; }
      if (role === 'crew') { L.top.col = 0xf6f2ea; L.bottom.col = 0xf6f2ea; }
      L.pose = pose; L.yaw = yaw; return L;
    };
    let n = 0;
    const one = (name, x, y, z, L) => { try { WK.addPath(name, [[x, y, z]], { count: 1, speed: 0, activeRadius: 110, looks: [L] }); n++; } catch (e) { AF.warnOnce('liner walkers', e); } };
    const path = (name, pts, count, speed, L, mode = 'loop') => { try { WK.addPath(name, pts, { count, speed, mode, activeRadius: 120, looks: L }); n += count; } catch (e) { AF.warnOnce('liner walkers', e); } };
    for (const t of LN.tables) {
      if (t.kind === 'slot') continue;
      const dealerZ = t.kind === 'craps' ? t.z : t.z - t.d / 2 - 0.45, dealerX = t.kind === 'craps' ? t.x + t.w / 2 + 0.45 : t.x;
      one('liner dealer', dealerX, t.y, dealerZ, look('marshal', t.kind === 'craps' ? -PI / 2 : 0, 'dealer'));
      const k = t.kind === 'roulette' ? 3 : t.kind === 'craps' ? 3 : 2;
      for (let i = 0; i < k; i++) {
        if (t.kind === 'craps') { const z = t.z - 1.2 + i * 1.2; one('liner gambler', t.x - t.w / 2 - 0.5, t.y, z, look('stand', PI / 2)); continue; }
        const x = t.x - t.w / 2 + (i + 0.6) * t.w / (k + 0.2), z = t.z + t.d / 2 + 0.45; one('liner gambler', x, t.y, z, look('stand', PI));
      }
    }
    for (let i = 0; i < 4; i++) { const s = LN.tables.filter((t) => t.kind === 'slot')[i * 4 + 1]; if (s) one('liner slots', s.x, s.y, s.z + s.face * 0.75, look('stand', s.face > 0 ? PI : 0)); }
    one('liner bartender', -193.8, FLOOR, 306, look('marshal', -PI / 2, 'dealer'));
    path('liner floor', [[-219, FLOOR, 306], [-210, FLOOR, 307.8], [-202, FLOOR, 304.2], [-210, FLOOR, 304.2]], 4, 0.8, [look(), look(), look(), look()]);
    path('liner atrium', [[-233, FLOOR, 301.5], [-226, FLOOR, 301.5], [-226, FLOOR, 310.5], [-233, FLOOR, 310.5]], 3, 0.7, [look(), look(), look()]);
    path('liner waiter', [[-218, FLOOR, 305.8], [-198, FLOOR, 305.8]], 1, 1.1, [look('stand', 0, 'crew')], 'pingpong');
    for (let i = 0; i < 12; i++) { const a = i * 2.4, r = 0.8 + (i % 4) * 1.1; one('liner dancer', -210 + Math.cos(a) * r * 1.4, DECK, 306 + Math.sin(a) * r * 0.8, look('dance', rng() * PI * 2)); }
    for (const z of [304.5, 306.5, 308.5]) one('liner band', -199.4, DECK + 0.5, z, look('marshal', -PI / 2, 'band'));
    path('liner promenade', [[-268, DECK, 299], [-190, DECK, 299]], 4, 0.9, [look(), look(), look(), look()], 'pingpong');
    path('liner promenade s', [[-190, DECK, 313], [-268, DECK, 313]], 3, 0.85, [look(), look(), look()], 'pingpong');
    for (const [x, z, a] of [[-234, 301, PI], [-222, 311, 0], [-203, 301.5, PI]]) one('liner sun deck', x, SUN, z, look('stand', a));
    one('liner captain', -199.5, SUN, 306.8, look('stand', PI / 2, 'crew'));
    LN.walkers = n;
  };

  // ---------------------------------------------------------------- build
  AF.onBuild('harbour-liner', 307, () => {
    const t0 = performance.now();
    buildHull(); buildCasinoDeck(); buildUpper(); buildBoarding(); buildGangway(); layout();
    const geo = AF.meshModel(m, { vs: VS, anchor: [0, 0, 0] }); delete geo.userData.src;
    const grp = new THREE.Group(); grp.name = 'liner';
    const hull = AF.modelMesh(geo); hull.position.set(X0, Y0, Z0); hull.castShadow = true; hull.name = 'liner-hull'; grp.add(hull);
    AF.scene.add(grp); LN.mesh = grp; LN.hull = hull;
    instMesh(); crowd(); doorMeshes(grp);
    // the name in gold deco letters on both bows, reading aft -> fore from either side
    const nm = AF.textModel('SOLACE QUEEN', FC.gold, { font: 'deco', pad: 0 }), ng = AF.meshModel(nm, { vs: 1 / 6, anchor: [0, 0, 0] }), nw = nm.w / 6; delete ng.userData.src;
    const n1 = AF.modelMesh(ng); n1.position.set(-196 - nw, 0.3, Z0 + 17); grp.add(n1);
    const n2 = AF.modelMesh(ng); n2.rotation.y = PI; n2.position.set(-196, 0.3, Z0); grp.add(n2);
    // dressed overall (signal flags stem -> masts -> stern) + the ensign; funnel smoke
    if (AF.makeBunting) { const P3 = [[-171, DECK + 1, CZ], [-186, 33, CZ], [-226, SUN + 12, CZ], [-266, 30, CZ], [-279, DECK + 6, CZ]]; for (let i = 0; i < P3.length - 1; i++) AF.makeBunting(P3[i], P3[i + 1], { shape: 'signal', parent: grp, spacing: 1.1, size: 0.9 }); }
    if (AF.makeFlag) AF.makeFlag({ parent: grp, x: -279, y: DECK + 5.4, z: CZ, w: 3.2, h: 2.0, design: 'harbour', vane: false, yaw: -PI / 2 });
    const lib = AF.hbLib || {}, smk = lib.smoke ? [0, 1, 2].map(() => lib.smoke(5, 0xd8d4cc, 3.4, 9)) : [];
    const dyn = AF.land && AF.land.hbDyn;
    if (dyn) dyn.push({ x: -225, z: CZ, r: 700, update(dt, t) { for (let i = 0; i < smk.length; i++) smk[i].update(dt, t + i * 1.7, -238 + i * 12, SUN + 11, CZ, 0.45); } });
    // lights: chandeliers + deck lamps (pooled, tier-capped)
    for (const [x, y, z] of PLACE.chandelier) AF.addLight({ x, y: y + 0.2, z, color: 0xffd9a0, intensity: 1.4, range: 12, kind: 'interior' });
    for (let x = -264; x < -190; x += 12) AF.addLight({ x, y: DECK + 2, z: Z0 - 0.5, color: 0xffd08a, intensity: 0.9, range: 9, kind: 'night' });
    AF.addLight({ x: -240, y: 1, z: 318, color: 0xffd08a, intensity: 1.1, range: 10, kind: 'night' });
    if (AF.water2 && AF.water2.cands) for (const dx of [-40, -20, 0, 20, 40]) AF.water2.cands.push({ x: -225 + dx, y: 6, z: 297, color: 0xffd08a, intensity: 0.9 });
    // rooms for the indoor camera, the banner and the map
    AF.addBuilding({ id: 'liner-casino', name: 'Grand Casino \u00b7 SS Solace Queen', kind: 'casino', box: [IN0, FLOOR - 0.5, Z0, IN1, CEIL, Z0 + 17], doors: [{ x: -230, y: FLOOR, z: Z0, yaw: PI }], interior: true, owner: 'harbour', label: true });
    AF.addBuilding({ id: 'liner-lounge', name: 'Starlight Lounge', kind: 'ballroom', box: [LX0, DECK - 0.5, LZ0, LX1, LROOF, LZ1], doors: [{ x: -239, y: DECK, z: LZ0, yaw: PI }], interior: true, owner: 'harbour', label: false });
    AF.addLabel('SS Solace Queen', -225, CZ, 'place');
    const HR = AF.harbour; if (HR && HR.ships) HR.ships.push({ name: 'Solace Queen', mesh: grp, x: -225, z: CZ, len: 110 });
    if (AF.land) AF.land.liner = grp;
    LN.ready = true; LN.buildMs = Math.round(performance.now() - t0);
  });
  // furniture shows within 140 m of the ship; the roulette wheels turn while someone watches
  const WQ = new THREE.Quaternion(), WE = new THREE.Euler(), WP = new THREE.Vector3(), WS = new THREE.Vector3(1, 1, 1), WM = new THREE.Matrix4();
  AF.onTick('liner', 340, (dt, t) => {
    if (!LN.ready) return;
    for (const k in DOORS) { const d = DOORS[k]; if (Math.abs(d.a - d.want) > 1e-3) { d.a += (d.want - d.a) * Math.min(1, dt * (k === 'vault' ? 0.9 : 4)); d.pivot.rotation.y = d.a; } }
    const cp = AF.camera.position, d2 = (cp.x + 225) ** 2 + (cp.z - CZ) ** 2, near = d2 < 140 * 140 && cp.y < 80;
    if (near !== LN.near) { LN.near = near; for (const im of IMS) im.visible = near; }
    if (!near || !wheelIM || d2 > 60 * 60) return;
    const L = PLACE.wheel;
    for (let i = 0; i < L.length; i++) { const [x, y, z] = L[i]; WP.set(x, y, z); WE.set(0, t * (0.9 + i * 0.13) + (LN.spin && LN.spin[i] || 0), 0); WQ.setFromEuler(WE); WM.compose(WP, WQ, WS); wheelIM.setMatrixAt(i, WM); }
    wheelIM.instanceMatrix.needsUpdate = true;
  });
  // the two doors that open: the vault (a 3 m steel slab with a gold wheel, hinged at its north edge) and the cage's staff door
  const DOORS = LN.doorMesh = {};
  const doorMeshes = (grp) => {
    const v = new AF.Model(5, 24, 24), steel = fc(0x9aa0a8, { metal: 0.85, rough: 0.3 }), dark = fc(0x5d636b, { metal: 0.8 });
    v.box(0, 0, 0, 4, 24, 24, steel); for (let y = 0; y < 24; y++) for (let z = 0; z < 24; z++) { const d = Math.hypot(y - 11.5, z - 11.5); if (d < 10 && d > 8.5) v.set(4, y, z, FC.gold); if (d < 2) v.set(4, y, z, FC.gold); }
    v.line(4, 11.5, 4, 4, 11.5, 19, FC.gold); v.line(4, 4, 11.5, 4, 19, 11.5, FC.gold); for (let y = 2; y < 22; y += 4) v.box(0, y, 21, 4, y + 1, 24, dark);
    const s = new AF.Model(3, 24, 16); s.box(0, 0, 0, 2, 24, 16, FC.wood); s.box(2, 10, 12, 3, 12, 13, FC.gold); s.box(0, 18, 3, 2, 22, 13, FC.velvet);
    for (const [k, model, x, z] of [['vault', v, -256.75, 307.5], ['staff', s, -250.75, 312.5]]) {
      const geo = AF.meshModel(model, { vs: 1 / 8, anchor: [0, 0, 1] }); delete geo.userData.src;
      const pivot = new THREE.Group(); pivot.position.set(x, FLOOR, z); const mesh = AF.modelMesh(geo); mesh.castShadow = false; pivot.add(mesh); grp.add(pivot);
      DOORS[k] = { pivot, a: 0, want: 0 };
    }
  };
  const setDoor = (k, open) => { const b = LN.doors[k], d = DOORS[k]; if (!b || LN.isOpen(k) === !!open) return; b.y1 = open ? b.y0 : b.y0 + 3; if (d) d.want = open ? (k === 'vault' ? -PI * 0.55 : PI * 0.5) : 0; if (AF.audio) AF.audio.play(k === 'vault' ? 'vault' : open ? 'door_open' : 'door_close', { x: -255, y: FLOOR + 1.5, z: 308 }); };
  LN.openVault = (open) => setDoor('vault', open);
  LN.openStaff = (open) => setDoor('staff', open);
  LN.isOpen = (k) => !!(LN.doors[k] && LN.doors[k].y1 === LN.doors[k].y0);

  AF.test('liner: decks are walkable and connected (gangway -> casino -> lounge -> sun deck)', () => {
    const walk = (pts) => {
      const b = { x: pts[0][0], y: pts[0][1], z: pts[0][2], vy: 0, r: 0.3, h: 1.7, onGround: true }; let stuck = null;
      for (let i = 1; i < pts.length && !stuck; i++) { const [tx, , tz] = pts[i]; for (let k = 0; k < 900; k++) { const dx = tx - b.x, dz = tz - b.z, d = Math.hypot(dx, dz); if (d < 0.25) break; const s = Math.min(0.06, d); AF.moveBody(b, dx / d * s, dz / d * s, 1 / 60); if (k === 899) stuck = [b.x.toFixed(1), b.y.toFixed(2), b.z.toFixed(1), '->', tx, tz]; } }
      return { b, stuck };
    };
    const a = walk([[-230, 0.25, 262], [-230, 0.3, 296], [-230, 1.6, 302], [-237.3, 1.6, 302], [-237.3, 1.6, 306], [-223.4, 8.1, 306], [-220, 8.1, 306]]);
    const toLounge = !a.stuck && a.b.y > 7.8;
    const s = walk([[-262, 8.1, 303], [-247, 13.1, 303], [-240, 13.1, 303]]);
    const toSun = !s.stuck && s.b.y > 12.8;
    const p = walk([[-240, -0.4, 318], [-233.5, 0.1, 316], [-229, 1.6, 316], [-229, 1.6, 311]]);
    const fromPontoon = !p.stuck && p.b.y > 1.3 && LN.where(p.b.x, p.b.y, p.b.z) !== '';
    return { ok: toLounge && toSun && fromPontoon && LN.tables.length >= 20, info: 'gangway->lounge ' + toLounge + (a.stuck ? ' stuck ' + a.stuck.join(' ') : '') + ', sun deck ' + toSun + (s.stuck ? ' stuck ' + s.stuck.join(' ') : '') + ', pontoon ' + fromPontoon + (p.stuck ? ' stuck ' + p.stuck.join(' ') : '') + ', ' + LN.tables.length + ' tables, ' + LN.walkers + ' people, ' + LN.cols.length + ' colliders, build ' + LN.buildMs + ' ms' };
  });
}
} catch (e) { AF.partError('48-liner.js', e); }
