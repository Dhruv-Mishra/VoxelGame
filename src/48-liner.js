// ================================================================ 48-liner.js
try {
// ===== 48-liner: the SS SOLACE QUEEN â€” a grand 1930s casino liner at anchor far offshore, (-225, 1450)  (OWNER: harbour) =====
// 190 m x 30 m, bow east. One hull + superstructure model (0.5 m voxels, world-aligned) + colliders from the same box list, so every
// deck, wall, stair and rail is walked on like the city. Local coordinates: u = x - CX (bow +), v = z - CZ (north = city side -).
//   DECK 1 (floor y 1.5, in the hull): the boarding door + pontoon (north), the GRAND ATRIUM (3 decks tall, twin stairs to the
//     deck-2 gallery, a bridge stair on to deck 3), the purser's CAGE (staff door = AF.liner.openStaff) with the VAULT and SILAS
//     CRANE's office behind it, the double-height MAIN CASINO HALL (gallery on deck 2, the bar at its fore end) and, behind
//     "Staff only" doors, the CREW CORRIDOR along the south side: the waiters' PANTRY (behind the bar), the dealers' locker room /
//     CREW LOUNGE, the CREW STAIRS (switchback, decks 1 -> 4) and the aft hull door to Silas's launch stage.
//   DECK 3 (y 11.5, the hull top): promenade, aft deck, forecastle; inside the house the atrium gallery, the Palm Court and the
//     STARLIGHT LOUNGE (ballroom under a glass lantern, band, bar), and the guarded grand stair up to
//   DECK 4 (y 16.5): the SUN DECK (funnels, lifeboats, the atrium skylight) and the HIGH ROLLERS' SALON (vestibule + doorman,
//     Mr Prescott's baccarat table, its own bar, the crew stairs' service door). DECK 5 (y 21.5): the salon roof and the bridge.
// The shore launch (tender) shuttles on the world clock between the Pleasure Pier head and the pontoon (mode 'tender').
// Furniture = one InstancedMesh per kind at 1/8 m, drawn only near the ship; people are path walkers (54).
// AF.liner.where(x, y, z) -> 'casino' | 'inside' | 'deck' | ''; .room() names the room; .tables / .spots for 78-casino and 81-heist.
{
  const PI = Math.PI, HP = PI / 2, W = AF.W, WY = AF.PLAN.harbour.waterY;
  const CX = -225, CZ = 1450, LEN = 190, VS = 0.5;
  const U0 = -96, V0 = -16, Y0 = -7, NU = 384, NY = 100, NV = 64;            // the hull model
  const A0U = -92, A0V = -28, A0Y = -2, NAU = 132, NAY = 10, NAV = 108;      // outboard stages (pontoon north, launch stage south)
  const F1 = 1.5, F2 = 6.5, F3 = 11.5, F4 = 16.5, F5 = 21.5, IU0 = -86, IU1 = 66;
  const LN = AF.liner = { x: CX, z: CZ, len: LEN, beam: 30, tables: [], spots: {}, cols: [], doors: {}, paths: { salon: [], crew: [], hall: [], all: [] }, mesh: null, near: false, ready: false };
  const P = (u, y, v, yaw) => yaw == null ? { x: CX + u, y, z: CZ + v } : { x: CX + u, y, z: CZ + v, yaw };
  const hb = (u) => u < -86 ? 15 * (0.4 + 0.6 * Math.sqrt(Math.max(0, (u + 95) / 9))) : u > 66 ? 15 * Math.pow(Math.max(0.03, 1 - (u - 66) / 29), 0.55) : 15;
  const hbAt = (u, y) => hb(u > 60 ? u + Math.max(0, 6 - y) * 0.9 : u < -80 ? u - Math.max(0, -1 - y) * 0.9 : u) * (y < -1 ? 0.75 + 0.25 * (y + 7) / 6 : 1);
  const inHullL = (u, v) => u > -95 && u < 95 && Math.abs(v) < hb(u) - 0.2;
  LN.hb = hb;
  const room = LN.room = (x, y, z) => {
    const u = x - CX, v = z - CZ;
    if (u < -96 || u > 96 || v < -29 || v > 27 || y < -2 || y > 46) return '';
    if (!inHullL(u, v)) return y > -1.5 && y < 4 && ((u > -52.5 && u < -27.5 && v > -27.5 && v < -14) || (u > -91.5 && u < -76.5 && v > 14 && v < 25)) ? 'stage' : '';
    if (y < F1 - 0.6) return '';
    if (u > 60 && u < 66 && v > -9.5 && v < 5.5 && y < F5) return 'stairs';
    if (y < F3 - 0.6) {
      if (y < F2 - 0.6) {
        if (u > 57 || v > 10.25) return 'crew';
        if (u > 49) return v > -2.25 ? 'pantry' : 'crewLounge';
        if (u < -63) return u < -76 ? 'crew' : v < -1.5 ? 'vault' : 'office';
        if (u < -55.5) return 'cage';
      }
      return u < -25.5 ? 'atrium' : 'casino';
    }
    if (y < F4 - 0.6) return Math.abs(v) < 9.5 && u > -59.5 && u < 60 ? (u < -25.5 ? 'atrium' : u < 2.25 ? 'foyer' : 'lounge') : 'deck';
    if (y < F5 - 0.6) { if (u > 26 && u < 36 && v > 5.5 && v < 10) return 'lounge'; if (Math.abs(v) < 9.5 && u > 36.5 && u < 60) return u < 41.25 && v > 0.75 ? 'vestibule' : 'salon'; return 'deck'; }
    if (u > 52 && u < 60 && Math.abs(v) < 6 && y < F5 + 3.5) return 'bridge';
    return 'deck';
  };
  LN.where = (x, y, z) => { const r = room(x, y, z); return !r ? '' : r === 'casino' || r === 'salon' ? 'casino' : r === 'deck' || r === 'stage' ? 'deck' : 'inside'; };
  AF.Vehicle.noLand = (x, z) => { const u = x - CX, v = z - CZ; return u > -97 && u < 97 && Math.abs(v) < hb(Math.max(-95, Math.min(95, u))) + 1.5; };

  // ---------------------------------------------------------------- palette
  const c = (h, o) => AF.col(h, Object.assign({ jitter: 0.25, edge: 0.55 }, o));
  const C = {
    boot: c(0xa8302a), black: c(0x1c1e22, { jitter: 0.18 }), fill: c(0x1c1e22, { jitter: 0.18 }), white: c(0xf4f0e6, { jitter: 0.12 }), cream: c(0xefe2c4, { jitter: 0.12 }),
    gold: c(0xd8a83a, { metal: 0.8, rough: 0.3, jitter: 0.1 }), teak: c(0xb08a5a, { pat: 'plank', jitter: 0.4 }), teakD: c(0x8a6a44, { pat: 'plank' }),
    carpet: c(0x7a1e2a, { pat: 'carpet', jitter: 0.2 }), carpet2: c(0x23305a, { pat: 'carpet', jitter: 0.2 }), salonC: c(0x4a0e1a, { pat: 'carpet', jitter: 0.2 }),
    marbleW: c(0xeee8dc, { pat: 'marble', rough: 0.3 }), marbleK: c(0x2f3038, { pat: 'marble', rough: 0.3 }), panel: c(0x5a3a24, { pat: 'panel' }), mahog: c(0x4a2416, { pat: 'panel' }),
    damask: c(0x6e1c24, { jitter: 0.15, pat: 'none' }), velvet: c(0x5a1020, { jitter: 0.15, pat: 'none' }), ivory: c(0xf3ead2, { jitter: 0.1 }), parquet: c(0xa8773f, { pat: 'parquet' }),
    buff: c(0xe0b870, { jitter: 0.15 }), fblk: c(0x1a1a1c), steel: c(0x8b9097, { metal: 0.7, rough: 0.35 }), glass: AF.col('glass'),
    port: AF.col(0x2a3440, { emit: 0xffd08a, emitK: 1.8, mode: 'night', jitter: 0.1, edge: 0.1 }), lamp: AF.col(0xfff0c8, { emit: 0xffd890, emitK: 2.6, mode: 'night', jitter: 0 }),
    lampA: AF.col(0xfff2cc, { emit: 0xffdca0, emitK: 2.2, mode: 'always', jitter: 0 }), green: c(0x1f6a3a, { jitter: 0.12 }), boatW: c(0xf6f2ea), vaultC: c(0x8a8f96, { metal: 0.85, rough: 0.3 }),
    bars: c(0xc9a24a, { metal: 0.9, rough: 0.3 }), red: c(0xb02a2a, { pat: 'none' }), navy: c(0x1f2a44), wood: c(0x6a4226, { pat: 'plank' }),
    lino: c(0x9aa89a, { jitter: 0.15 }), lino2: c(0x7f8f9c, { jitter: 0.15 }), crewW: c(0xd8d2c0, { jitter: 0.1 }), crewL: c(0x8a9a8c, { jitter: 0.1 }), tileW: c(0xe8e8e0, { jitter: 0.08 }), tileK: c(0x2a2a30, { jitter: 0.08 }),
  };
  const band = (dado, mid, top) => (y) => { const r = ((y - F1) % 5 + 5) % 5; return r < 1.5 ? dado : r < 2 ? C.gold : r >= 3.5 && r < 4 ? top : mid; };
  const GR = band(C.panel, C.damask, C.gold), CR = band(C.crewL, C.crewW, C.crewW), SAL = band(C.mahog, C.velvet, C.gold), WH = band(C.cream, C.ivory, C.gold), OF = band(C.mahog, C.panel, C.gold), VT = band(C.vaultC, C.vaultC, C.steel);

  // ---------------------------------------------------------------- the models + colliders from one box list (local metres, 0.5 m grid)
  const m = new AF.Model(NU, NY, NV), ma = new AF.Model(NAU, NAY, NAV);
  const mbox = (M, o0, o1, o2, u0, y0, v0, u1, y1, v1, k) => M.box(Math.round((u0 - o0) / VS), Math.round((y0 - o1) / VS), Math.round((v0 - o2) / VS), Math.round((u1 - o0) / VS), Math.round((y1 - o1) / VS), Math.round((v1 - o2) / VS), k);
  const D = (u0, y0, v0, u1, y1, v1, k) => { if (Math.min(v0, v1) >= 15 || Math.max(v0, v1) <= -15) mbox(ma, A0U, A0Y, A0V, u0, y0, v0, u1, y1, v1, k); else mbox(m, U0, Y0, V0, u0, y0, v0, u1, y1, v1, k); };
  // k: a colour, a function of y (wall bands) or { at, lo, hi, ax } = two colours split at u (ax 'u') or v (default) â€” walls seen from two rooms
  const paint = (u0, y0, v0, u1, y1, v1, k) => {
    if (!k) return;
    if (typeof k === 'object') { const a = k.at; if (k.ax === 'u') { paint(u0, y0, v0, a, y1, v1, k.lo); paint(a, y0, v0, u1, y1, v1, k.hi); } else { paint(u0, y0, v0, u1, y1, a, k.lo); paint(u0, y0, a, u1, y1, v1, k.hi); } return; }
    if (typeof k !== 'function') { D(u0, y0, v0, u1, y1, v1, k); return; }
    for (let y = Math.min(y0, y1); y < Math.max(y0, y1) - 1e-6; y += VS) D(u0, y, v0, u1, y + VS, v1, k(y));
  };
  const col = (u0, y0, v0, u1, y1, v1) => { const b = AF.addCollider(CX + u0, y0, CZ + v0, CX + u1, y1, CZ + v1, 'liner'); LN.cols.push(b); return b; };
  const S = (u0, y0, v0, u1, y1, v1, k) => { paint(u0, y0, v0, u1, y1, v1, k); return col(u0, y0, v0, u1, y1, v1); };
  // walls along u (v0..v1 thick) or along v, with gaps [a, b, top] along their length (top default: a 3 m door)
  const wallU = (u0, u1, v0, v1, y0, y1, k, gaps = []) => {
    let a = u0;
    for (const [g0, g1, gy] of gaps.slice().sort((p, q) => p[0] - q[0])) { if (g0 > a) S(a, y0, v0, g0, y1, v1, k); const top = gy ?? y0 + 3; if (top < y1) S(g0, top, v0, g1, y1, v1, k); D(g0, y0, v0, g1, Math.min(top, y1), v1, 0); a = g1; }
    if (a < u1) S(a, y0, v0, u1, y1, v1, k);
  };
  const wallV = (v0, v1, u0, u1, y0, y1, k, gaps = []) => {
    let a = v0;
    for (const [g0, g1, gy] of gaps.slice().sort((p, q) => p[0] - q[0])) { if (g0 > a) S(u0, y0, a, u1, y1, g0, k); const top = gy ?? y0 + 3; if (top < y1) S(u0, top, g0, u1, y1, g1, k); D(u0, y0, g0, u1, Math.min(top, y1), g1, 0); a = g1; }
    if (a < v1) S(u0, y0, a, u1, y1, v1, k);
  };
  // gold door frame round a gap in a wall along u (frameU) or along v (frameV)
  const frameU = (g0, g1, v0, v1, y0, h, k = C.gold) => { D(g0 - 0.5, y0, v0, g0, y0 + h + 0.5, v1, k); D(g1, y0, v0, g1 + 0.5, y0 + h + 0.5, v1, k); D(g0 - 0.5, y0 + h, v0, g1 + 0.5, y0 + h + 0.5, v1, k); };
  const frameV = (g0, g1, u0, u1, y0, h, k = C.gold) => { D(u0, y0, g0 - 0.5, u1, y0 + h + 0.5, g0, k); D(u0, y0, g1, u1, y0 + h + 0.5, g1 + 0.5, k); D(u0, y0 + h, g0 - 0.5, u1, y0 + h + 0.5, g1 + 0.5, k); };
  // a rectangle minus holes -> rectangles ([u0, v0, u1, v1])
  const minus = (r, holes) => {
    const us = [r[0], r[2]]; for (const h of holes) for (const q of [h[0], h[2]]) if (q > r[0] && q < r[2]) us.push(q);
    us.sort((a, b) => a - b); const out = [];
    for (let i = 0; i < us.length - 1; i++) {
      const a = us[i], b = us[i + 1]; if (b - a < 1e-6) continue; let iv = [[r[1], r[3]]];
      for (const h of holes) { if (h[0] >= b || h[2] <= a) continue; const n = []; for (const [p, q] of iv) { if (h[3] <= p || h[1] >= q) { n.push([p, q]); continue; } if (h[1] > p) n.push([p, h[1]]); if (h[3] < q) n.push([h[3], q]); } iv = n; }
      for (const [p, q] of iv) out.push([a, p, b, q]);
    }
    return out;
  };
  // a 1 m deck slab at y0..y0+1 (ceiling colour below, floor colour on top) with holes, colliders to match
  const slab = (y0, rect, holes, ceil, flr) => {
    for (const h of holes) D(Math.max(h[0], rect[0]), y0, Math.max(h[1], rect[1]), Math.min(h[2], rect[2]), y0 + 1, Math.min(h[3], rect[3]), 0);
    for (const [u0, v0, u1, v1] of minus(rect, holes)) { if (ceil) D(u0, y0, v0, u1, y0 + 0.5, v1, ceil); if (flr) D(u0, y0 + 0.5, v0, u1, y0 + 1, v1, flr); col(u0, y0, v0, u1, y0 + 1, v1); }
  };
  const floorK = (u0, v0, u1, v1, y, k, holes = []) => { for (const [a, b, p, q] of minus([u0, v0, u1, v1], holes)) D(a, y - 0.5, b, p, y, q, k); };
  const chequer = (u0, v0, u1, v1, y, k1, k2, holes = [], cell = 1) => {
    for (const [a, b, p, q] of minus([u0, v0, u1, v1], holes)) for (let u = a; u < p - 1e-6; u += 0.5) for (let v = b; v < q - 1e-6; v += 0.5) D(u, y - 0.5, v, u + 0.5, y, v + 0.5, ((Math.floor(u / cell) + Math.floor(v / cell)) & 1) ? k1 : k2);
  };
  // an open balustrade 1 m tall (posts every metre under a gold rail; the collider is solid)
  const bal = (u0, y, v0, u1, v1, post = C.marbleW) => {
    col(u0, y, v0, u1, y + 1, v1); D(u0, y + 0.5, v0, u1, y + 1, v1, C.gold);
    if (u1 - u0 >= v1 - v0) for (let u = u0; u < u1 - 0.25; u += 1) D(u, y, v0, u + 0.5, y + 0.5, v1, post); else for (let v = v0; v < v1 - 0.25; v += 1) D(u0, y, v, u1, y + 0.5, v + 0.5, post);
  };
  // a flight of 0.5 m risers on 1 m treads rising along u (dir +-1) from ua at y0, across v0..v1; solid from `base` (a wedge) or
  // a 1 m thick floating flight; rails = [[v0, v1], ...] stringers to the step tops + a 1 m gold balustrade
  const flightU = (ua, dir, y0, n, v0, v1, k, runner, base, rails = [], railK = C.gold) => {
    for (let i = 0; i < n; i++) {
      const a = ua + dir * i, b = a + dir, u0 = Math.min(a, b), u1 = Math.max(a, b), top = y0 + 0.5 * (i + 1), bot = base ?? top - 1;
      S(u0, bot, v0, u1, top, v1, k); if (runner) D(u0, top - 0.5, v0 + 0.5, u1, top, v1 - 0.5, runner);
      for (const [r0, r1] of rails) { S(u0, bot, r0, u1, top, r1, k); S(u0, top, r0, u1, top + 1, r1, railK); }
    }
  };
  const flightV = (va, dir, y0, n, u0, u1, k, runner, base, rails = [], railK = C.gold) => {
    for (let i = 0; i < n; i++) {
      const a = va + dir * i, b = a + dir, v0 = Math.min(a, b), v1 = Math.max(a, b), top = y0 + 0.5 * (i + 1), bot = base ?? top - 1;
      S(u0, bot, v0, u1, top, v1, k); if (runner) D(u0 + 0.5, top - 0.5, v0, u1 - 0.5, top, v1, runner);
      for (const [r0, r1] of rails) { S(r0, bot, v0, r1, top, v1, k); S(r0, top, v0, r1, top + 1, v1, railK); }
    }
  };

  // ---------------------------------------------------------------- hull (voxels by profile, colliders by boxes)
  const buildHull = () => {
    const yTop = Math.round((F3 + 1 - Y0) / VS);
    for (let mu = 0; mu < NU; mu++) {
      const u = U0 + (mu + 0.5) * VS; if (u < -95 || u > 95) continue;
      const intU = u > IU0 && u < IU1, pu = ((u % 2.5) + 2.5) % 2.5, portU = pu >= 1 && pu < 1.5 && u > -92 && u < 86;
      for (let my = 0; my < yTop; my++) {
        const y = Y0 + (my + 0.5) * VS, w = hbAt(u, y);
        for (let mv = 0; mv < NV; mv++) {
          const v = V0 + (mv + 0.5) * VS, d = Math.abs(v); if (d > w) continue;
          const outer = d > w - 0.5;
          if (y > F3) { if (outer) m.set(mu, my, mv, C.white); continue; }
          const shell = d > w - 1, intY = y > F1 && y < F3 - 1;
          if (intU && intY && d < 14) continue;
          let k;
          if (shell && portU && ((y > 3 && y < 4) || (y > 8 && y < 9))) k = C.port;
          else if (outer) k = y < -0.5 ? C.boot : y < 6 ? C.black : y < 6.5 ? C.gold : C.white;
          else if (intU && intY && shell) k = GR(y);
          else if (y > F3 - 0.5) k = C.teak;
          else if (y > F3 - 1 && intU && d < 14) k = C.cream;
          else k = C.fill;
          m.set(mu, my, mv, k);
        }
      }
    }
    for (let u = -96; u < 95; u += 2) {
      const h = hb(Math.max(-95, u + 1)), intr = u >= IU0 && u + 2 <= IU1;
      if (intr) col(u, -7, -h, u + 2, F1, h);
      else { col(u, -7, -h * 0.8, u + 2, F3, h * 0.8); col(u, -1, -h, u + 2, F3, h); }
      col(u, F3, -h, u + 2, F3 + 1.2, -h + 0.5); col(u, F3, h - 0.5, u + 2, F3 + 1.2, h);
    }
    col(-96, F3, -6.5, -95, F3 + 1.2, 6.5); col(94, F3, -1, 95.5, F3 + 1.2, 1);
    // the hull sides round the interior (the boarding door north, the launch door south) and the end bulkheads
    wallU(IU0, IU1, -15, -14, F1, F3 - 1, 0, [[-44, -40, F1 + 3]]); wallU(IU0, IU1, 14, 15, F1, F3 - 1, 0, [[-85, -83, F1 + 3]]);
    frameU(-44, -40, -15, -14.5, F1, 3); frameU(-85, -83, 14.5, 15, F1, 3);
    S(IU0, F1, -14, IU0 + 0.5, F3 - 1, 14, C.crewW); S(IU1 - 0.5, F1, -14, IU1, F3 - 1, 14, C.crewW);
  };
  // ---------------------------------------------------------------- decks 1 + 2 inside the hull
  const ATRIUM_V2 = [-48, -9, 43, 9], STAIR_V2 = [60.5, -9, 65.5, 3];
  const buildInterior = () => {
    slab(F2 - 1, [IU0, -14, IU1, 14], [ATRIUM_V2, STAIR_V2], C.cream, C.carpet2);
    slab(F3 - 1, [IU0, -14, IU1, 14], [[-48, -6, -38, 6], [-38, -6, -32, -2], [-38, 2, -32, 6], [63, -7, 65.5, 3]], C.cream, C.teak);
    // floors
    chequer(-56, -14, -26, 9.5, F1, C.marbleW, C.marbleK);
    floorK(-26, -14, 48, 9.5, F1, C.carpet); floorK(-25, -1.5, 43, 1.5, F1, C.marbleW); floorK(-25, -2, 43, -1.5, F1, C.gold); floorK(-25, 1.5, 43, 2, F1, C.gold);
    floorK(-62, -8, -56, 8, F1, C.marbleK); floorK(-76, -12, -63, -2, F1, C.vaultC); floorK(-76, -1, -63, 9.5, F1, C.green); floorK(-73, 1, -66, 7, F1, C.carpet);
    floorK(-86, 10.5, 60, 14, F1, C.lino); floorK(57.5, -14, 60, 10.5, F1, C.lino); chequer(49, -2, 57, 9.5, F1, C.tileW, C.tileK, [], 0.5);
    floorK(49, -14, 57, -2.5, F1, C.lino2); floorK(60.5, -9, 65.5, 5, F1, C.steel);
    // the crew corridor wall (rooms | crew side): the "Staff only" door from the atrium, the pantry door
    wallU(-86, 57.5, 9.5, 10.5, F1, F2 - 1, { at: 10, lo: GR, hi: CR }, [[-34, -32], [51, 53]]);
    frameU(-34, -32, 9.5, 10, F1, 3); paint(-76, F1, 9.5, -63, F2 - 1, 10, OF); paint(49, F1, 9.5, 51, F2 - 1, 10, CR); paint(53, F1, 9.5, 57.5, F2 - 1, 10, CR);
    // atrium aft wall: the purser's grille + counter, the cage's staff door (AF.liner.openStaff)
    wallV(-14, 9.5, -56, -55, F1, F3 - 1, { ax: 'u', at: -55.5, lo: OF, hi: GR }, [[3, 5, F1 + 3]]); frameV(3, 5, -55.5, -55, F1, 3);
    for (let v = -6; v < 2; v += 0.5) D(-56, F1 + 1, v, -55, F1 + 3, v + 0.5, ((v * 2) & 1) ? 0 : C.bars);
    frameV(-6, 2, -55.5, -55, F1 + 1, 2); S(-55, F1, -6, -54, F1 + 1, 2, C.wood); D(-55, F1 + 0.5, -6, -54, F1 + 1, 2, C.marbleK);
    // the cage, its back wall (vault door, office door), the vault, Silas's office
    wallU(-62, -56, -8.5, -8, F1, F2 - 1, OF); wallU(-62, -56, 8, 8.5, F1, F2 - 1, OF);
    wallV(-12.5, 9.5, -63, -62, F1, F2 - 1, OF, [[-7, -4, F1 + 3], [4, 6, F1 + 3]]);
    paint(-63, F1, -12.5, -62.5, F2 - 1, -7, VT); paint(-63, F1, -4, -62.5, F2 - 1, -1.5, VT); frameV(4, 6, -62.5, -62, F1, 3); frameV(-7, -4, -62.5, -62, F1, 3, C.steel);
    wallU(-76.5, -62, -12.5, -12, F1, F2 - 1, VT); wallV(-12.5, -1, -76.5, -76, F1, F2 - 1, VT); wallU(-76, -63, -2, -1, F1, F2 - 1, { at: -1.5, lo: VT, hi: OF });
    wallV(-1, 9.5, -76.5, -76, F1, F2 - 1, OF);
    for (let v = -11.5; v < -2.5; v += 1.5) S(-75.5, F1, v, -74.5, F1 + 2, v + 1, C.gold);
    S(-73, F1, -12, -64, F1 + 3, -11.5, C.steel); for (const y of [F1 + 1, F1 + 2]) D(-73, y, -12, -64, y + 0.5, -11.5, C.fblk);
    S(-70, F1, -6, -67, F1 + 1, -4, C.green); D(-70, F1 + 0.5, -6, -67, F1 + 1, -4, C.cream);
    S(-61.5, F1, -7, -60.5, F1 + 1, -1, C.wood); D(-61.5, F1 + 0.5, -7, -60.5, F1 + 1, -1, C.green); S(-61.5, F1, 6, -60.5, F1 + 1.5, 7.5, C.vaultC);
    S(-64.5, F1, 8, -63.5, F1 + 1.5, 9.5, C.vaultC); D(-76, F1 + 2, 1.5, -75.5, F1 + 3.5, 5.5, C.gold); D(-76, F1 + 2.5, 2, -75.5, F1 + 3, 5, C.navy);
    // atrium: cloakroom, purser's desk, columns under the gallery
    S(-54, F1, -12.5, -49, F1 + 1, -11.5, C.wood); D(-54, F1 + 0.5, -12.5, -49, F1 + 1, -11.5, C.gold); D(-54, F1 + 2, -14, -49, F1 + 2.5, -13.5, C.steel);
    S(-31, F1, -12.5, -27, F1 + 1, -11.5, C.marbleK); D(-31, F1 + 0.5, -12.5, -27, F1 + 1, -11.5, C.gold);
    for (const u of [-45, -29, -20, -4, 12, 28, 40]) for (const s of [-1, 1]) { const v0 = s < 0 ? -10 : 9, v1 = v0 + 1; S(u, F1, v0, u + 1, F2 - 1, v1, C.marbleW); D(u, F2 - 1.5, v0, u + 1, F2 - 1, v1, C.gold); D(u, F1, v0, u + 1, F1 + 0.5, v1, C.gold); }
    // the arch between the atrium and the casino hall (piers, lintels; the galleries pass through on deck 2)
    S(-26, F1, -9.5, -25, F3 - 1, -8, GR); S(-26, F1, 8, -25, F3 - 1, 9.5, GR); S(-26, F1 + 7, -8, -25, F3 - 1, 8, GR); D(-26, F1 + 6.5, -8, -25, F1 + 7, 8, C.gold);
    S(-26, F1 + 3.5, -14, -25, F2 - 1, -9.5, GR); S(-26, F2 + 3, -14, -25, F3 - 1, -9.5, GR); S(-26, F2 + 3, 9.5, -25, F3 - 1, 14, GR);
    // the hall's fore wall (door behind the bar to the pantry), the bar, the back bar
    wallV(-14, 9.5, 48, 49, F1, F3 - 1, { ax: 'u', at: 48.5, lo: GR, hi: CR }, [[0, 2, F1 + 3]]); S(48, F2, 9.5, 49, F3 - 1, 14, GR);
    S(44, F1, -9, 45, F1 + 1, 9, C.wood); D(44, F1 + 0.5, -9, 45, F1 + 1, 9, C.marbleK);
    for (const [a, b] of [[-9, -0.5], [2.5, 9]]) { D(47.5, F1, a, 48, F1 + 3.5, b, C.wood); for (let v = a; v < b; v += 0.5) D(47.5, F1 + 1.5, v, 48, F1 + 2, v + 0.5, [C.green, C.red, C.gold][Math.floor(v * 2 + 40) % 3]); D(47.5, F1 + 2.5, a, 48, F1 + 3, b, C.gold); }
    // pantry + crew lounge + the cross corridor
    wallU(49, 57, -2.5, -2, F1, F2 - 1, CR); wallV(-14, 9.5, 57, 57.5, F1, F2 - 1, CR, [[-12, -10]]); frameV(-12, -10, 57, 57.5, F1, 3, C.crewL);
    S(55.5, F1, -1.5, 57, F1 + 1, 6, C.steel); D(55.5, F1 + 0.5, -1.5, 57, F1 + 1, 6, C.tileW); D(56.5, F1 + 1.5, -1.5, 57, F1 + 3, 6, C.wood);
    D(55.5, F1 + 1, 0, 56.5, F1 + 1.5, 2, C.steel); D(55.5, F1 + 1, 3, 56.5, F1 + 1.5, 4.5, C.ivory); S(49.5, F1, 7, 51, F1 + 2.5, 9, C.steel);
    S(50.5, F1, -9.5, 55.5, F1 + 0.5, -9, C.wood); D(51, F1 + 1.5, -3, 54, F1 + 3, -2.5, C.cream);
    // the crew stairwell (decks 1 -> 4): walls, the centre wall, three switchback flights; doors at deck 1 (cross corridor) + deck 4 (salon)
    wallV(-14, 14, 60, 60.5, F1, F2 - 1, CR, [[-9, -7]]); frameV(-9, -7, 60, 60.5, F1, 3, C.crewL);
    S(60, F2 - 1, -9.5, 60.5, F3, 5.5, CR); S(60, F3, -9.5, 60.5, F4, 5.5, WH);
    S(65.5, F1, -9.5, 66, F5 - 1, 5.5, CR); S(60.5, F1, -9.5, 65.5, F5 - 1, -9, CR); S(60.5, F1, 5, 65.5, F5 - 1, 5.5, CR); S(62.5, F1, -7, 63, F5 - 1, 3, CR);
    flightV(-7, 1, F1, 10, 60.5, 62.5, C.teakD, C.lino2, F1); flightV(3, -1, F2, 10, 63, 65.5, C.teakD, C.lino2, F1); flightV(-7, 1, F3, 10, 60.5, 62.5, C.teakD, C.lino2, F3 - 1);
    floorK(60.5, 3, 65.5, 5, F2, C.steel); floorK(60.5, -9, 65.5, -7, F3, C.steel); floorK(60.5, 3, 65.5, 5, F4, C.steel);
    for (const y of [F1, F2, F3, F4]) D(65, y + 3, -2, 65.5, y + 3.5, -1.5, C.lampA);
    // the grand staircase: twin flights to the deck-2 aft gallery, a floating flight on over the atrium to the deck-3 bridge
    for (const s of [-1, 1]) flightU(-38, -1, F1, 10, s < 0 ? -8.5 : 5.5, s < 0 ? -5.5 : 8.5, C.marbleW, C.carpet, F1, [[s < 0 ? -9 : 8.5, s < 0 ? -8.5 : 9], [s < 0 ? -5.5 : 5, s < 0 ? -5 : 5.5]]);
    flightU(-48, 1, F2, 10, -2, 2, C.marbleW, C.carpet, undefined, [[-2.5, -2], [2, 2.5]]);
    D(-38, F3 - 0.5, -1.5, -32, F3, 1.5, C.carpet); S(-38, F3 - 1, -2.5, -32, F3 + 1, -2, C.gold); S(-38, F3 - 1, 2, -32, F3 + 1, 2.5, C.gold);
    // balustrades: deck-2 aft gallery, side galleries, the cross gallery over the bar; deck 3 round the atrium well
    bal(-48.5, F2, -5, -48, -2.5); bal(-48.5, F2, 2.5, -48, 5);
    bal(-48, F2, -9.5, 43, -9); bal(-48, F2, 9, 43, 9.5); bal(43, F2, -9, 43.5, 9);
    bal(-48, F3, -6.5, -32, -6); bal(-48, F3, 6, -32, 6.5); bal(-48.5, F3, -6, -48, 6);
    bal(-32, F3, -6, -31.5, -2.5); bal(-32, F3, 2.5, -31.5, 6);
    // ceilings: gold coffers over the hall, lamps under the galleries, sconces, crew-corridor pipes + lamps + hose boxes
    for (let u = -24; u <= 42; u += 6) D(u, F3 - 1.5, -9, u + 0.5, F3 - 1, 9, C.gold);
    D(-25, F3 - 1.5, -9, 43, F3 - 1, -8.5, C.gold); D(-25, F3 - 1.5, 8.5, 43, F3 - 1, 9, C.gold);
    for (let u = -54; u <= 42; u += 6) { D(u, F2 - 1.5, -12, u + 0.5, F2 - 1, -11.5, C.lampA); D(u, F3 - 1.5, -12, u + 0.5, F3 - 1, -11.5, C.lampA); D(u, F3 - 1.5, 11.5, u + 0.5, F3 - 1, 12, C.lampA); }
    for (let u = -54; u <= 44; u += 4) for (const y of [F1 + 3, F2 + 2.5]) { D(u, y, -14, u + 0.5, y + 0.5, -13.5, C.lampA); if (y > F2) D(u, y, 13.5, u + 0.5, y + 0.5, 14, C.lampA); }
    paint(-86, F1, 14, 60, F2 - 1, 14.5, CR); D(-86, F2 - 1.5, 13.5, 57.5, F2 - 1, 14, C.steel);
    for (let u = -82; u < 58; u += 8) D(u, F2 - 1.5, 12, u + 0.5, F2 - 1, 12.5, C.lampA);
    for (let u = -70; u < 58; u += 22) D(u, F1 + 1.5, 13.5, u + 0.5, F1 + 2.5, 14, C.red);
    D(-70, F2 - 1.5, 4, -69.5, F2 - 1, 4.5, C.lampA); D(53, F2 - 1.5, 4, 53.5, F2 - 1, 4.5, C.lampA); D(53, F2 - 1.5, -8, 53.5, F2 - 1, -7.5, C.lampA);
    D(-59, F2 - 1.5, 0, -58.5, F2 - 1, 0.5, C.lampA); D(-70, F2 - 1.5, -7, -69.5, F2 - 1, -6.5, C.lampA);
  };
  // ---------------------------------------------------------------- deck 3 house: atrium gallery, Palm Court, Starlight Lounge
  const buildHouse = () => {
    const T = F4 - 1;
    // outer walls 1 m (white outside, a room colour inside), windows, doors to the promenade and the aft deck
    const sideGaps = [[-30, -27], [20, 22]];
    for (const s of [-1, 1]) {
      const v0 = s < 0 ? -10.5 : 9.5, v1 = v0 + 1, k = s < 0 ? { at: -10, lo: C.white, hi: WH } : { at: 10, lo: WH, hi: C.white };
      wallU(-60, 66, v0, v1, F3, T, k, sideGaps);
      for (const [g0, g1] of sideGaps) frameU(g0, g1, s < 0 ? -10.5 : 10, s < 0 ? -10 : 10.5, F3, 3);
      for (let u = -57; u < 58; u += 4) { if (sideGaps.some(([a, b]) => u + 2.5 > a - 0.5 && u < b + 0.5) || (s > 0 && u > 24 && u < 37)) continue; D(u, F3 + 1, v0, u + 2.5, F3 + 3, v1, C.glass); }
    }
    wallV(-10.5, 10.5, -60, -59, F3, T, { ax: 'u', at: -59.5, lo: C.white, hi: WH }, [[-2, 2]]); frameV(-2, 2, -60, -59.5, F3, 3);
    S(65.5, F3, -10.5, 66, F5 - 1, 10.5, C.white); S(60, F3, 5.5, 60.5, T, 9.5, WH);
    // the deck-4 slab: sun deck on top; holes for the atrium skylight, the lounge lantern, the salon stair, the crew stairs
    slab(F4 - 1, [-60, -10.5, 66, 10.5], [[-48, -6, -32, 6], [18, -5, 32, 5], [26, 6, 36, 9.5], [60.5, -7, 62.5, 3]], C.ivory, C.teak);
    // partitions: the atrium foyer | Palm Court arch, the lounge doors
    S(-26, F3, -9.5, -25, T, -6, WH); S(-26, F3, 6, -25, T, 9.5, WH); S(-26, F3 + 3.5, -6, -25, T, 6, WH); D(-26, F3 + 3, -6, -25, F3 + 3.5, 6, C.gold);
    S(2, F3, -9.5, 2.5, T, -4, WH); S(2, F3, 4, 2.5, T, 9.5, WH); S(2, F3 + 3, -4, 2.5, T, 4, WH); frameV(-4, 4, 2, 2.5, F3, 3);
    // floors
    chequer(-59, -9.5, -25, 9.5, F3, C.marbleW, C.marbleK, [[-48, -6, -38, 6], [-38, -6, -32, -2], [-38, 2, -32, 6]]); D(-38, F3 - 0.5, -1.5, -32, F3, 1.5, C.carpet);
    chequer(-25, -9.5, 2, 9.5, F3, C.marbleW, C.ivory, [], 2); floorK(2.5, -9.5, 60, 9.5, F3, C.carpet2); floorK(18, -5, 32, 5, F3, C.parquet);
    floorK(17.5, -5.5, 32.5, -5, F3, C.gold); floorK(17.5, 5, 32.5, 5.5, F3, C.gold);
    // the Palm Court fountain, the lounge bar, the bandstand, the grand stair up to the salon (guarded at the top)
    S(-13.5, F3, -1.5, -10.5, F3 + 0.5, 1.5, C.marbleW); S(-12.5, F3, -0.5, -11.5, F3 + 2, 0.5, C.gold); D(-13, F3 + 0.5, -1, -11, F3 + 0.5, 1, 0);
    S(8, F3, -8.5, 20, F3 + 1, -7.5, C.wood); D(8, F3 + 0.5, -8.5, 20, F3 + 1, -7.5, C.gold); D(8, F3 + 1.5, -9.5, 20, F3 + 3, -9, C.wood);
    for (let u = 8; u < 20; u += 0.5) D(u, F3 + 2, -9.5, u + 0.5, F3 + 2.5, -9, [C.green, C.red, C.gold, C.ivory][Math.floor(u * 2) & 3]);
    S(50, F3, -6, 58, F3 + 0.5, 6, C.wood); D(50, F3, -6, 50.5, F3 + 0.5, 6, C.gold); D(57.5, F3 + 0.5, -6, 58, F3 + 4, 6, C.navy);
    for (let v = -5.5; v < 6; v += 1) D(57.5, F3 + 2.5, v, 58, F3 + 3, v + 0.5, C.lampA);
    flightU(26, 1, F3, 10, 6, 9.5, C.marbleW, C.carpet, F3, [[5.5, 6]]);
    // wall lamps + gold cornice in the house
    D(-59, T - 0.5, -9.5, 60, T, -9, C.gold); D(-59, T - 0.5, 9, 60, T, 9.5, C.gold);
    for (let u = -56; u < 58; u += 6) for (const v of [-9.5, 9]) D(u, F3 + 2.5, v, u + 0.5, F3 + 3, v + 0.5, C.lampA);
  };

  // ---------------------------------------------------------------- deck 4: sun deck (funnels, lifeboats, skylight, lantern) + the High Rollers' Salon; deck 5 + bridge
  const buildUpper = () => {
    // sun deck rails (gaps: the promenade stairs' landings at u -6..-3)
    for (const s of [-1, 1]) { const v0 = s < 0 ? -10.5 : 10, v1 = v0 + 0.5; wallU(-60, 36, v0, v1, F4, F4 + 1, C.white, [[-6, -3, F4 + 1]]); }
    S(-60, F4, -10, -59.5, F4 + 1, 10, C.white);
    // atrium skylight: a glazed lantern ring on the sun deck
    S(-48.5, F4, -6.5, -31.5, F4 + 1.5, -6, C.white); S(-48.5, F4, 6, -31.5, F4 + 1.5, 6.5, C.white); S(-48.5, F4, -6, -48, F4 + 1.5, 6, C.white); S(-32, F4, -6, -31.5, F4 + 1.5, 6, C.white);
    S(-48, F4 + 1.5, -6, -32, F4 + 2, 6, C.glass); for (let u = -46; u < -32; u += 4) D(u, F4 + 1.5, -6, u + 0.5, F4 + 2, 6, C.gold); D(-48, F4 + 1.5, -0.25 - 0.25, -32, F4 + 2, 0.5, C.gold);
    // the ballroom lantern over the dance floor
    const L0 = 17.5, L1 = 32.5;
    S(L0, F4, -5.5, L1, F4 + 3, -5, C.white); S(L0, F4, 5, L1, F4 + 3, 5.5, C.white); S(L0, F4, -5, L0 + 0.5, F4 + 3, 5, C.white); S(L1 - 0.5, F4, -5, L1, F4 + 3, 5, C.white);
    for (let u = L0 + 1; u < L1 - 1; u += 2) { D(u, F4 + 0.5, -5.5, u + 1.5, F4 + 2.5, -5, C.glass); D(u, F4 + 0.5, 5, u + 1.5, F4 + 2.5, 5.5, C.glass); }
    S(L0, F4 + 3, -5.5, L1, F4 + 3.5, 5.5, C.white); D(L0, F4 + 2.5, -5, L1, F4 + 3, 5, C.ivory); D(L0, F4 + 3.5, -5.5, L1, F4 + 4, -5, C.gold); D(L0, F4 + 3.5, 5, L1, F4 + 4, 5.5, C.gold);
    // the salon stair house (over the grand stair) and the bridge stair (sun deck -> deck 5)
    S(25.5, F4, 5.5, 26, F4 + 3, 10.5, C.white); S(26, F4, 5.5, 36, F4 + 3, 6, C.white); S(26, F4, 10, 36, F4 + 3, 10.5, C.white); S(25.5, F4 + 3, 5.5, 36, F4 + 3.5, 10.5, C.white);
    for (let u = 27; u < 35; u += 3) D(u, F4 + 1, 5.5, u + 2, F4 + 2.5, 6, C.glass);
    flightU(26, 1, F4, 10, -9.5, -7.5, C.teakD, null, F4, [[-7.5, -7]], C.white);
    // funnels, ventilators, lifeboats on davits
    for (const fu of [-22, -6, 10]) { S(fu - 4, F4, -3, fu + 4, F4 + 16, 3, C.buff); D(fu - 4, F4 + 14, -3, fu + 4, F4 + 16, 3, C.fblk); D(fu - 4, F4 + 12.5, -3, fu + 4, F4 + 13, 3, C.red); D(fu - 3.5, F4 + 15.5, -2.5, fu + 3.5, F4 + 16, 2.5, 0); D(fu - 4.5, F4, -3.5, fu + 4.5, F4 + 0.5, 3.5, C.buff); }
    // the Verandah Cafe house aft on the sun deck (closed; lit windows, a gold cornice)
    S(-60, F4, -9.5, -50, F4 + 4, 9.5, C.white); D(-60, F4 + 3, -9.5, -50, F4 + 3.5, 9.5, C.gold); D(-59.5, F4 + 3, -9, -50.5, F4 + 3.5, 9, C.white);
    for (let v = -8.5; v < 8.5; v += 2) D(-50.5, F4 + 1, v, -50, F4 + 2.5, v + 1.5, C.port);
    for (let u = -59; u < -50.5; u += 2) for (const v of [-9.5, 9]) D(u, F4 + 1, v, u + 1.5, F4 + 2.5, v + 0.5, C.port);
    for (const [u, v] of [[-46, -9], [-46, 8.5], [-14, -4], [-14, 3.5], [2, -4], [2, 3.5], [40.5, -9], [40.5, 8.5]]) { const y = u > 36 ? F5 : F4; S(u, y, v, u + 1, y + 2, v + 0.5, C.white); D(u, y + 2, v - 0.5, u + 1, y + 2.5, v + 1, C.white); D(u, y + 2, v, u + 1, y + 2.5, v + 0.5, C.red); }
    for (const lu of [-44, -30, -18, 2, 14]) for (const s of [-1, 1]) {
      if (s < 0 && lu > 24) continue;
      const v0 = s < 0 ? -9.5 : 8, v1 = v0 + 1.5;
      S(lu, F4 + 0.5, v0, lu + 5, F4 + 1.5, v1, C.boatW); D(lu, F4 + 0.5, v0, lu + 5, F4 + 1, v1, C.boot); D(lu + 0.5, F4 + 1.5, v0 + 0.5, lu + 4.5, F4 + 1.5 + 0.5, v1 - 0.5, C.wood);
      for (const du of [0.5, 4]) { S(lu + du, F4, v0 + 0.5, lu + du + 0.5, F4 + 0.5, v1 - 0.5, C.steel); D(lu + du, F4 + 1.5, s < 0 ? v0 : v1 - 0.5, lu + du + 0.5, F4 + 3, s < 0 ? v0 + 0.5 : v1, C.steel); }
    }
    // the salon house (deck 4, u 36..60): walls, windows, the vestibule (doorman) + door, the bar alcove, floors, deck-5 roof
    const T = F5 - 1;
    for (const s of [-1, 1]) {
      const v0 = s < 0 ? -10.5 : 9.5, v1 = v0 + 1;
      wallU(36, 66, v0, v1, F4, T, s < 0 ? { at: -10, lo: C.white, hi: SAL } : { at: 10, lo: SAL, hi: C.white });
      for (let u = 42; u < 59; u += 4) D(u, F4 + 1, v0, u + 2.5, F4 + 3, v1, C.glass);
    }
    wallV(-9.5, 9.5, 36, 37, F4, T, { ax: 'u', at: 36.5, lo: C.white, hi: SAL }, [[6, 9.5, F4 + 3]]);
    wallU(37, 41, 0.5, 1, F4, T, SAL); wallV(1, 9.5, 41, 41.5, F4, T, SAL, [[5, 7.5, F4 + 3]]); frameV(5, 7.5, 41, 41.5, F4, 3);
    wallV(-9.5, 5.5, 60, 60.5, F4, T, SAL, [[3, 5, F4 + 3]]); S(60, F4, 5.5, 60.5, T, 9.5, SAL);
    floorK(37, -9.5, 60, 9.5, F4, C.salonC, [[37, 1, 41.5, 9.5]]); chequer(37, 1, 41, 9.5, F4, C.marbleW, C.marbleK);
    floorK(42, -8.5, 59, -8, F4, C.gold); floorK(42, 8, 59, 8.5, F4, C.gold);
    slab(F5 - 1, [36, -10.5, 66, 10.5], [], C.ivory, C.teak);
    for (let u = 38; u < 60; u += 4) D(u, T - 0.5, -9.5, u + 0.5, T, 9.5, C.gold);
    D(37, T - 0.5, -9.5, 60, T, -9, C.gold); D(37, T - 0.5, 9, 60, T, 9.5, C.gold);
    for (let u = 42; u < 60; u += 5) for (const v of [-9.5, 9]) D(u, F4 + 2.5, v, u + 0.5, F4 + 3, v + 0.5, C.lampA);
    S(38.5, F4, -8, 39.5, F4 + 1, -2, C.mahog); D(38.5, F4 + 0.5, -8, 39.5, F4 + 1, -2, C.gold); D(37, F4 + 1.5, -9, 37.5, F4 + 3, -1, C.mahog);
    for (let v = -9; v < -1; v += 0.5) D(37, F4 + 2, v, 37.5, F4 + 2.5, v + 0.5, [C.green, C.gold, C.red][Math.floor(v * 2 + 40) % 3]);
    D(59.5, F4 + 1.5, -6, 60, F4 + 3.5, -1, C.gold); D(59.5, F4 + 2, -5.5, 60, F4 + 3, -1.5, C.green);   // a painting over the dais
    // deck 5: rails, the bridge house with its wheel
    S(36, F5, -10.5, 66, F5 + 1, -10, C.white); S(36, F5, 10, 66, F5 + 1, 10.5, C.white); S(65.5, F5, -10, 66, F5 + 1, 10, C.white); S(36, F5, -7.5, 36.5, F5 + 1, 10, C.white);
    wallU(52, 60, -6, -5.5, F5, F5 + 3.5, C.white); wallU(52, 60, 5.5, 6, F5, F5 + 3.5, C.white); wallV(-5.5, 5.5, 52, 52.5, F5, F5 + 3.5, C.white, [[-1, 1]]); S(59.5, F5, -5.5, 60, F5 + 3.5, 5.5, C.white);
    D(59.5, F5 + 1.5, -5, 60, F5 + 3, 5, C.glass); D(53, F5 + 1.5, -6, 59, F5 + 3, -5.5, C.glass); D(53, F5 + 1.5, 5.5, 59, F5 + 3, 6, C.glass);
    S(52, F5 + 3.5, -6.5, 60.5, F5 + 4, 6.5, C.white); D(52, F5 + 4, -6.5, 60.5, F5 + 4.5, 6.5, C.gold);
    S(58, F5, -0.5, 58.5, F5 + 1.2, 0.5, C.wood); for (let a = 0; a < 8; a++) D(58, F5 + 1.5 + Math.round(Math.sin(a * PI / 4) * 1) * 0.5, Math.round(Math.cos(a * PI / 4) * 1) * 0.5, 58.5, F5 + 2 + Math.round(Math.sin(a * PI / 4) * 1) * 0.5, Math.round(Math.cos(a * PI / 4) * 1) * 0.5 + 0.5, C.gold);
    D(53, F5 + 3, -5.5, 59.5, F5 + 3.5, 5.5, C.ivory); D(56, F5 + 3, 0, 56.5, F5 + 3.5, 0.5, C.lampA);
    // the promenade stairs up to the sun deck (outboard of the house, both sides) + their landings
    for (const s of [-1, 1]) {
      const v0 = s < 0 ? -14.5 : 12.5, v1 = v0 + 2;
      flightU(-16, 1, F3, 10, v0, v1, C.teakD, null, F3, [[s < 0 ? -12.5 : 12, s < 0 ? -12 : 12.5]], C.white);
      S(-6, F4 - 1, s < 0 ? -14.5 : 10.5, -3, F4, s < 0 ? -10.5 : 14.5, C.teak);
      S(-3, F4, s < 0 ? -14.5 : 10.5, -2.5, F4 + 1, s < 0 ? -10.5 : 14.5, C.white); S(-6, F4, s < 0 ? -15 : 14.5, -2.5, F4 + 1, s < 0 ? -14.5 : 15, C.white);
    }
    for (const s of [-1, 1]) S(-6.5, F4, s < 0 ? -12 : 10.5, -6, F4 + 1, s < 0 ? -10.5 : 12, C.white);
    // aft deck + forecastle: masts, the flagstaff, winches + chain, a capstan, bollards; promenade lamps
    S(-78.5, F3, -0.5, -77.5, 38, 0.5, C.wood); D(-78.25, 33, -5, -77.75, 33.5, 5, C.wood); D(-78.5, 38, -0.5, -77.5, 38.5, 0.5, C.lamp);
    S(77.5, F3, -0.5, 78.5, 42, 0.5, C.wood); D(77.75, 37, -6, 78.25, 37.5, 6, C.wood); D(77.5, 42, -0.5, 78.5, 42.5, 0.5, C.lamp); D(77.5, 30, -1, 78.5, 31.5, 1, C.wood);
    S(-94, F3, -0.25, -93.5, F3 + 7, 0.25, C.white);
    for (const v of [-3, 2]) { S(82, F3, v, 84, F3 + 1, v + 1, C.steel); D(84, F3, v + 0.25, 90, F3 + 0.5, v + 0.75, C.fblk); }
    S(70, F3, -1, 72, F3 + 1, 1, C.steel); D(70.5, F3 + 1, -0.5, 71.5, F3 + 1.5, 0.5, C.gold);
    for (const [u, v] of [[-90, -8], [-90, 7.5], [-70, -13], [-70, 12.5], [86, -5], [86, 4.5], [74, -10], [74, 9.5]]) S(u, F3, v, u + 0.5, F3 + 0.5, v + 0.5, C.fblk);
    for (let u = -84; u < 64; u += 12) for (const v of [-14.75, 14.25]) D(u, F3 + 1, v, u + 0.5, F3 + 1.5, v + 0.5, C.lamp);
  };

  // ---------------------------------------------------------------- outboard: the boarding pontoon (north) and Silas's launch stage (south, aft)
  const buildStages = () => {
    // north: the platform outside the boarding door, stairs down, the pontoon (open on the sea side for the launch and jet skis)
    S(-45, F1 - 0.5, -17.5, -39, F1, -15, C.teak); D(-45, -1.5, -17.5, -44.5, F1 - 0.5, -17, C.steel); D(-39.5, -1.5, -17.5, -39, F1 - 0.5, -17, C.steel);
    for (let k = 0; k < 3; k++) S(-44, 0.5 - 0.5 * k, -18.5 - k, -40, 1 - 0.5 * k, -17.5 - k, C.teak);
    for (const [a, b] of [[-45, -44], [-40, -39]]) { S(a, F1, -17.5, b, F1 + 1, -15, C.white); for (let k = 0; k < 3; k++) S(a, 1 - 0.5 * k, -18.5 - k, b, 2 - 0.5 * k, -17.5 - k, C.white); }
    S(-52, -1.25, -27, -28, -0.5, -20.5, C.teakD); D(-52, -1.5, -27, -28, -1.25, -20.5, C.steel);
    S(-52, -0.5, -27, -51.5, 0.5, -20.5, C.white); S(-28.5, -0.5, -27, -28, 0.5, -20.5, C.white); S(-51.5, -0.5, -21, -45, 0.5, -20.5, C.white); S(-39, -0.5, -21, -28.5, 0.5, -20.5, C.white);
    for (const u of [-50, -34]) D(u, -0.5, -26.75, u + 0.5, 0, -26.25, C.fblk);
    for (const u of [-51, -29]) { D(u, 0.5, -26.5, u + 0.5, 2.5, -26, C.white); D(u, 2.5, -26.5, u + 0.5, 3, -26, C.lamp); }
    // south aft: the launch door's platform, stairs down, the stage where Silas's launch lies
    S(-86, F1 - 0.5, 15, -82, F1, 17.5, C.teak); for (let k = 0; k < 3; k++) S(-85, 0.5 - 0.5 * k, 17.5 + k, -83, 1 - 0.5 * k, 18.5 + k, C.teak);
    for (const [a, b] of [[-86, -85], [-83, -82]]) { S(a, F1, 15, b, F1 + 1, 17.5, C.white); for (let k = 0; k < 3; k++) S(a, 1 - 0.5 * k, 17.5 + k, b, 2 - 0.5 * k, 18.5 + k, C.white); }
    S(-91, -1.25, 20.5, -77, -0.5, 24.5, C.teakD); D(-91, -1.5, 20.5, -77, -1.25, 24.5, C.steel);
    S(-91, -0.5, 20.5, -90.5, 0.5, 24.5, C.white); S(-77.5, -0.5, 20.5, -77, 0.5, 24.5, C.white); S(-90.5, -0.5, 20.5, -86, 0.5, 21, C.white); S(-82, -0.5, 20.5, -77.5, 0.5, 21, C.white);
    for (const u of [-89, -79]) D(u, -0.5, 24, u + 0.5, 0, 24.5, C.fblk);
    D(-90.5, 0.5, 24, -90, 2.5, 24.5, C.white); D(-90.5, 2.5, 24, -90, 3, 24.5, C.lamp);
  };
  // the shore launch's stop on the Pleasure Pier head (where the gangway used to be): the arch, steps down, a floating stage
  const buildPierStop = () => {
    const plank = [AF.col(0x9c7a52, { jitter: 0.6, edge: 0.8 }), AF.col(0x8a6a46, { jitter: 0.6, edge: 0.8 })], pile = AF.col(0x5a4634, { jitter: 0.5 }), rail = AF.col(0xf2ece0, { jitter: 0.15 });
    const gold = AF.col(0xd8a83a, { metal: 0.8, rough: 0.3 }), bulb = AF.col(0xfff2c0, { emit: 0xffd070, emitK: 2.6, mode: 'night' }), steel = AF.col(0x7a8088, { metal: 0.6 });
    const x0 = -232, x1 = -228;
    W.clear(x0, 0.25, 263.5, x1, 1.5, 264.25); W.clear(x0, 0.25, 267.5, x1, 1.5, 268.25);
    for (let z = 264; z < 268; z += 0.25) W.fill(x0, 0, z, x1, 0.25, z + 0.25, plank[Math.floor(z * 4) & 1]);
    W.fill(x0, -0.25, 268, x1, 0, 269, plank[0]); W.fill(x0, -0.5, 269, x1, -0.25, 270, plank[1]);
    for (let z = 270; z < 276; z += 0.25) W.fill(-235, -0.75, z, -225, -0.5, z + 0.25, plank[Math.floor(z * 4) & 1]);
    W.fill(-235, -1.5, 270, -225, -0.75, 276, steel);
    for (const xa of [x0 - 0.25, x1]) W.fill(xa, -0.5, 268, xa + 0.25, 0.75, 270, rail);
    for (const xa of [-235, -225.25]) { W.fill(xa, -0.5, 270, xa + 0.25, 0.5, 276, rail); W.fill(xa, 0.5, 270, xa + 0.25, 0.75, 276, rail); }
    W.fill(-235, -0.5, 270, x0 - 0.25, 0.75, 270.25, rail); W.fill(x1 + 0.25, -0.5, 270, -225, 0.75, 270.25, rail);
    for (const xa of [-234, -226.5]) { W.fill(xa, -0.5, 275.5, xa + 0.5, 0, 276, AF.col(0x1a1a1c)); W.fill(xa, -4, 275.5, xa + 0.5, -1.5, 276, pile); }
    // the arch with its sign + a lamp post on the stage
    W.fill(x0 - 0.75, 0.25, 264, x0 - 0.25, 4.5, 264.5, gold); W.fill(x1 + 0.25, 0.25, 264, x1 + 0.75, 4.5, 264.5, gold); W.fill(x0 - 0.75, 4.5, 264, x1 + 0.75, 4.75, 264.5, gold);
    for (let x = x0 - 0.5; x < x1 + 0.5; x += 0.5) W.setM(x, 4.75, 264.25, bulb);
    if (AF.hbLib && AF.hbLib.sign) AF.placeStatic(AF.hbLib.sign('SOLACE QUEEN LAUNCH', AF.col(0xd8a83a, { emit: 0xffc040, emitK: 1.4, mode: 'night' }), AF.col(0x1c2a44), 1 / 14), (x0 + x1) / 2, 4.85, 264.0, 2, { collide: false });
    W.fill(-234.75, -0.5, 270.5, -234.5, 2.75, 270.75, rail); W.setM(-234.625, 2.875, 270.625, bulb);
    if (AF.spots) for (let i = AF.spots.length - 1; i >= 0; i--) { const s = AF.spots[i]; if (s.x > x0 - 1 && s.x < x1 + 1 && s.z > 261 && s.z < 266) AF.spots.splice(i, 1); }
    AF.addLight({ x: -230, y: 2.5, z: 272, color: 0xffd08a, intensity: 1.1, range: 10, kind: 'street' });
    LN.spots.gangway = { x: -230, y: 0.25, z: 266 };
  };
  // ---------------------------------------------------------------- furniture: one model per kind at 1/8 m, instanced (front = +z)
  const FV = 1 / 8;
  const fc = (h, o) => AF.col(h, Object.assign({ jitter: 0.15, edge: 0.3 }, o));
  const FC = { felt: fc(0x1f7a46, { rough: 0.95 }), feltD: fc(0x14562f), rim: fc(0x5a3418, { rough: 0.5 }), gold: fc(0xd8b04a, { metal: 0.85, rough: 0.3 }), red: fc(0xb8202a), black: fc(0x1a1a1e), white: fc(0xf2efe4),
    chrome: fc(0xd8dcdf, { metal: 0.9, rough: 0.2 }), screen: AF.col(0xfff0c0, { emit: 0xffd070, emitK: 1.8, mode: 'always', jitter: 0 }), bulb: AF.col(0xfff4d0, { emit: 0xffe0a0, emitK: 3, mode: 'always', jitter: 0 }),
    crystal: AF.col(0xe8f4ff, { emit: 0xfff0d0, emitK: 1.3, mode: 'always', jitter: 0 }), leaf: fc(0x3f7a3a), pot: fc(0x8a5a36), velvet: fc(0x6e1c2a), wood: fc(0x7a4a26), chipR: fc(0xc8302a), chipB: fc(0x2a4a9a),
    canvas: fc(0xf2e8d0), stripe: fc(0x2a6a9a), steel: fc(0x7d858e, { metal: 0.6, rough: 0.4 }), steelD: fc(0x50565e, { metal: 0.6 }), leather: fc(0x1e4a30), paper: fc(0xf4f0e2), mahog: fc(0x4a2416) };
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
    grand: () => { const M = new AF.Model(25, 22, 25); M.box(12, 14, 12, 13, 22, 13, FC.gold); M.box(10, 0, 10, 15, 3, 15, FC.crystal); M.box(11, 3, 11, 14, 14, 14, FC.gold);
      for (const [r, y, n] of [[11, 6, 20], [8, 10, 14], [5, 13, 10]]) for (let a = 0; a < n; a++) { const t = a / n * PI * 2, x = Math.round(12 + Math.cos(t) * r), z = Math.round(12 + Math.sin(t) * r); M.line(12, y + 2, 12, x, y + 1, z, FC.gold); M.box(x, y - 3, z, x + 1, y + 1, z + 1, FC.crystal); M.set(x, y + 1, z, FC.bulb); }
      return M; },
    palm: () => { const M = new AF.Model(9, 20, 9); M.box(2, 0, 2, 7, 4, 7, FC.pot); M.box(4, 4, 4, 5, 15, 5, FC.wood); for (let a = 0; a < 6; a++) { const dx = Math.cos(a * 1.05), dz = Math.sin(a * 1.05); for (let t = 0; t < 5; t++) M.set(Math.round(4.5 + dx * t), 15 + Math.round(Math.sin(t / 5 * 2.6) * 3) - (t > 3 ? 1 : 0), Math.round(4.5 + dz * t), FC.leaf); } return M; },
    table: () => { const M = new AF.Model(7, 6, 7); M.box(3, 0, 3, 4, 5, 4, FC.chrome); for (let x = 0; x < 7; x++) for (let z = 0; z < 7; z++) if (Math.hypot(x - 3, z - 3) < 3.4) M.set(x, 5, z, FC.white); M.box(3, 6, 3, 4, 6, 4, FC.bulb); return M; },
    deckchair: () => { const M = new AF.Model(5, 6, 12); M.box(0, 0, 0, 1, 3, 12, FC.wood); M.box(4, 0, 0, 5, 3, 12, FC.wood); for (let z = 0; z < 12; z++) M.box(1, z < 4 ? 2 + Math.round(z * 0.9) : 2, z, 4, (z < 4 ? 2 + Math.round(z * 0.9) : 2) + 1, z + 1, (z >> 1) & 1 ? FC.canvas : FC.stripe); return M; },
    piano: () => { const M = new AF.Model(12, 9, 8); M.box(0, 2, 0, 12, 8, 8, FC.black); M.box(0, 0, 0, 1, 2, 1, FC.black); M.box(11, 0, 0, 12, 2, 1, FC.black); M.box(0, 6, 6, 12, 7, 8, FC.white); M.box(1, 8, 0, 11, 9, 4, FC.black); return M; },
    ringbuoy: () => { const M = new AF.Model(5, 5, 1); for (let x = 0; x < 5; x++) for (let y = 0; y < 5; y++) { const d = Math.hypot(x - 2, y - 2); if (d > 1.2 && d < 2.6) M.set(x, y, 0, (x + y) & 2 ? FC.red : FC.white); } return M; },
    sofa: () => { const M = new AF.Model(16, 7, 6); M.box(0, 0, 0, 16, 1, 6, FC.gold); M.box(0, 1, 0, 16, 3, 6, FC.velvet); M.box(0, 3, 0, 16, 7, 2, FC.velvet); M.box(0, 3, 0, 2, 5, 6, FC.velvet); M.box(14, 3, 0, 16, 5, 6, FC.velvet); M.box(0, 6, 0, 16, 7, 1, FC.gold); return M; },
    locker: () => { const M = new AF.Model(6, 15, 4); M.box(0, 0, 0, 6, 15, 4, FC.steel); M.box(0, 0, 3, 6, 15, 4, FC.steelD); M.box(1, 1, 3, 5, 14, 4, FC.steel); for (const y of [11, 12, 13]) M.box(2, y, 4, 4, y + 1, 4, FC.steelD); M.set(4, 7, 4, FC.chrome); return M; },
    desk: () => { const M = new AF.Model(12, 8, 7); M.box(0, 0, 0, 12, 6, 7, FC.mahog); M.box(4, 0, 2, 8, 5, 7, 0); M.box(0, 6, 0, 12, 7, 7, FC.mahog); M.box(1, 6, 1, 11, 7, 6, FC.leather); M.box(2, 7, 2, 5, 7, 4, FC.paper); M.box(9, 7, 1, 10, 9, 2, FC.gold); M.box(8, 9, 0, 11, 10, 3, FC.felt); return M; },
    shelf: () => { const M = new AF.Model(12, 18, 3); M.box(0, 0, 0, 12, 18, 3, FC.mahog); for (let y = 1; y < 17; y += 4) for (let x = 1; x < 11; x++) M.box(x, y, 1, x + 1, y + 2 + (x % 3 === 0 ? 1 : 0), 3, [FC.red, FC.felt, FC.chipB, FC.paper, FC.gold, FC.black][(x * 7 + y) % 6]); return M; },
  };
  const PLACE = {}; for (const k in MODELS) PLACE[k] = [];
  const FCOL = [];   // furniture colliders (local boxes)
  const put = (k, u, y, v, yaw = 0) => { PLACE[k].push([CX + u, y, CZ + v, yaw]); };
  const putC = (k, u, y, v, yaw, hw, hd, h) => { put(k, u, y, v, yaw); const rot = Math.abs(Math.sin(yaw)) > 0.7; FCOL.push([u - (rot ? hd : hw), y, v - (rot ? hw : hd), u + (rot ? hd : hw), y + h, v + (rot ? hw : hd)]); };
  // a casino table (local u/v): adds the instance(s), the stools / chairs and an AF.liner.tables entry
  const table = (kind, u, y, v, room, extra = {}) => {
    const x = CX + u, z = CZ + v; let t;
    if (kind === 'roulette') { put('roulette', u, y, v); put('wheel', u - 1.06, y + 0.875, v); t = { kind, x, y, z, w: 3.25, d: 1.6 }; }
    else if (kind === 'blackjack') { put('blackjack', u, y, v - 0.65); t = { kind, x, y, z: z - 0.65 + 0.7, w: 2.5, d: 1.4 }; for (const du of [-0.9, 0, 0.9]) put('stool', u + du, y, v + 0.75); }
    else if (kind === 'craps') { put('craps', u, y, v, HP); t = { kind, x, y, z, w: 1.75, d: 3.75 }; }
    else { put('baccarat', u, y, v); t = { kind, x, y, z, w: 3.25, d: 1.75 }; for (const [du, dv] of [[-1.2, 1.2], [0, 1.25], [1.2, 1.2]]) put('chair', u + du, y, v + dv, PI); }
    Object.assign(t, { room }, extra); LN.tables.push(t); return t;
  };
  const slotRow = (u0, n, y, v, face, room = 'floor') => { for (let i = 0; i < n; i++) { const u = u0 + i * 1.25; put('slot', u, y, v, face > 0 ? 0 : PI); LN.tables.push({ kind: 'slot', x: CX + u, y, z: CZ + v, w: 0.75, d: 0.65, face, room }); } };
  const layout = () => {
    // the main hall: two rows of seven stations either side of the marble aisle; slot banks along both walls + the galleries
    const ROW = { '-1': ['roulette', 'blackjack', 'craps', 'blackjack', 'roulette', 'blackjack', 'baccarat'], 1: ['blackjack', 'roulette', 'blackjack', 'craps', 'baccarat', 'roulette', 'blackjack'] };
    [-18, -10, -2, 6, 14, 22, 30].forEach((u, i) => { for (const s of [-1, 1]) table(ROW[s][i], u, F1, s * 4.5, 'floor'); });
    for (const u0 of [-18.5, -2.5, 13.5, 29.5]) { slotRow(u0, 5, F1, -13.4, 1); slotRow(u0, 5, F1, 8.9, -1); }
    for (const u0 of [-18.5, 13.5]) { slotRow(u0, 5, F2, -13.4, 1); slotRow(u0, 5, F2, 13.4, -1); }
    for (let v = -8.5; v <= 8.5; v += 1.25) put('stool', 43.2, F1, v, HP);
    // the High Rollers' Salon: three house tables + MR PRESCOTT'S BACCARAT (no ambient dealer or guest: the heist seats its own)
    table('roulette', 47, F4, -5, 'gilded'); table('blackjack', 47, F4, 4.5, 'gilded'); table('baccarat', 54, F4, -6.5, 'gilded');
    LN.prescott = table('baccarat', 53.5, F4, 1, 'gilded', { prescott: true, noPlay: true });
    // chandeliers: the atrium (three decks), the hall, the lounge lantern; small ones elsewhere
    for (const [u, y, v] of [[-43, 14.5, 0], [-30, 7.5, 0], [-14, 7.5, 0], [4, 7.5, 0], [22, 7.5, 0], [37, 7.5, 0], [25, 16.25, 0]]) put('grand', u, y, v);
    for (const [u, y, v] of [[-54, 14.5, 0], [-12, 14.5, 0], [8, 14.5, 0], [40, 14.5, 0], [48, 14.5, 0], [46, 19.5, 0], [54, 19.5, -3], [-70, 4.5, 4], [-52, 4.5, 0], [53, 4.5, -8]]) put('chandelier', u, y, v);
    for (const [u, y, v] of [[-27.5, F1, -7], [-27.5, F1, 7], [-53, F1, -9], [-53, F1, 7], [42, F1, -11], [42, F1, 11.5 - 3], [-22, F3, -7], [-22, F3, 7], [-8, F3, -7], [-8, F3, 7], [4, F3, -8], [4, F3, 8],
      [42.5, F4, -8.6], [58.5, F4, 8.6], [58.5, F4, -8.6], [37.6, F4, 8.8], [-57, F3, -8.5], [-57, F3, 8.5]]) put('palm', u, y, v);
    // Palm Court + lounge cafÃ© tables, the lounge bar stools, the band's piano
    for (const [u, v] of [[-20, -4], [-20, 4], [-16, -4], [-16, 4], [-6, -4], [-6, 4], [-2, -4], [-2, 4], [6, 3], [6, 7], [12, 3], [12, 7], [36, -4], [36, 3], [40, -4], [40, 4], [44, -4], [44, 4], [45, -11], [45, 11]]) {
      const y = Math.abs(v) > 10 ? F2 : F3, uu = Math.abs(v) > 10 ? u : u; put('table', uu, y, v); put('chair', uu - 0.7, y, v, HP); put('chair', uu + 0.7, y, v, -HP);
    }
    for (let u = 9; u < 20; u += 1.5) put('stool', u, F3, -7, 0);
    put('piano', 53, F3 + 0.5, -4.2, -HP);
    // sun deck + aft deck deck chairs, ring buoys on the rails
    for (let u = -48.6; u < 17; u += 2.2) { if (u > -49 && u < -31) continue; put('deckchair', u, F4, -7, 0); put('deckchair', u, F4, 7, PI); }
    for (let u = -90; u < -64; u += 2.2) { put('deckchair', u, F3, -10, 0); put('deckchair', u, F3, 10, PI); }
    for (let u = -80; u < 70; u += 12) { put('ringbuoy', u, F3 + 0.2, -15.1, PI); put('ringbuoy', u, F3 + 0.2, 15.1, 0); }
    // the salon: sofas; Silas's office: desk, chair, bookcases, sofas; the crew lounge: lockers, a mess table
    putC('sofa', 58.6, F4, -3.5, -HP, 1, 0.4, 0.9); putC('sofa', 58.6, F4, 5.5, -HP, 1, 0.4, 0.9);
    putC('desk', -74.5, F1, 3.5, HP, 0.75, 0.45, 1.0); put('chair', -75.6, F1, 3.5, HP);
    for (const u of [-74, -72.5, -71, -69.5]) putC('shelf', u, F1, -0.6, 0, 0.75, 0.2, 2.2);
    putC('sofa', -72, F1, 9.1, PI, 1, 0.4, 0.9); putC('sofa', -68.5, F1, 9.1, PI, 1, 0.4, 0.9);
    for (let u = 50; u < 56.5; u += 0.75) putC('locker', u, F1, -13.6, 0, 0.375, 0.25, 1.9);
    for (let v = -12; v < -3.5; v += 0.75) putC('locker', 49.3, F1, v, HP, 0.375, 0.25, 1.9);
    put('table', 53, F1, -6); put('chair', 52.3, F1, -6, HP); put('chair', 53.7, F1, -6, -HP);
    // colliders for the tables and slots; chairs and stools stay walk-through
    for (const t of LN.tables) { const hw = t.w / 2, hd = t.d / 2; col(t.x - CX - hw, t.y, t.z - CZ - hd, t.x - CX + hw, t.y + 1.0, t.z - CZ + hd); }
    for (const b of FCOL) col(...b);
    col(52, F3 + 0.5, -5, 54, F3 + 1.6, -3.4);
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
  // ---------------------------------------------------------------- spots (world), for the casino, the heist and the launch
  const setSpots = () => {
    const s = LN.spots, F = F1;
    Object.assign(s, {
      pontoon: P(-40, -0.5, -23.5), dock: { x: CX - 56, z: CZ - 24 }, northDoor: P(-42, F, -14.5), boarding: P(-42, F, -12.5, 0),
      cloak: P(-51.5, F, -13.1, 0), purser: P(-29, F, -13.1, 0), atrium: P(-32, F, 0), staffDoor: P(-33, F, 10, 0), crew: P(0, F, 12.25),
      cage: P(-59, F, -2), cageDoor: P(-55.5, F, 4, -HP), vault: P(-70, F, -7), office: P(-69, F, 4), silas: P(-72.8, F, 3.5, HP), silasMeet: P(-70.8, F, 3.5, -HP),
      casino: P(10, F, 0), gallery: P(10, F2, -11.5), bar: P(42.6, F, 0, HP), pantry: P(54.5, F, 2.5, HP), crewLounge: P(53, F, -9.5, PI),
      crewStairs: P(61.5, F, -8, 0), crewStairsTop: P(61.5, F4, 4, -HP), serviceDoor: P(59.5, F4, 4, -HP),
      foyer: P(-29, F3, 0), lounge: P(24, F3, 0), salonStair: P(24, F3, 7.75, HP), salonDoor: P(41.25, F4, 6.25, HP), salonGuard: P(40.2, F4, 3.6, -HP),
      salon: P(50, F4, 0), gilded: P(50, F4, 0), salonBar: P(40.1, F4, -2.6, -HP),
      prescottSeat: P(53.5, F4, 2.25, PI), salonDealer: P(53.5, F4, -0.325, 0), serve: P(54.6, F4, 3.1, Math.atan2(-1.1, -0.85)),
      sun: P(-14, F4, -5.5), sunStair: P(-17, F3, -13.5), promenade: P(-20, F3, -12), bridge: P(57.5, F5, 0, HP), bow: P(80, F3, 0), aft: P(-80, F3, 0),
      southDoor: P(-84, F, 14.5), launch: P(-84, -0.5, 22.5, PI), launchBoat: P(-84, WY - 0.35, 26.6, HP), tender: { x: -230, y: -0.5, z: 273, yaw: 0 },
    });
    s.detectivePath = [[43, F4, -8.6], [58.5, F4, -8.6], [58.5, F4, 8.6], [43, F4, 8.6]].map(([u, y, v]) => [CX + u, y, CZ + v]);
    s.stewardPath = [[-82, F, 11.6], [58.2, F, 11.6], [58.8, F, -12], [59.4, F, -12], [59, F, 13], [-82, F, 13]].map(([u, y, v]) => [CX + u, y, CZ + v]);
  };

  // ---------------------------------------------------------------- people: gamblers, dealers, the band, dancers, strollers, crew (path walkers)
  const crowd = () => {
    const WK = AF.walkers; if (!WK || !WK.addPath || !AF.peopleKit) return;
    const rng = AF.rng(4242), tux = [0x1a1a1e, 0x22253a, 0x2a2024], gowns = [0xb8202a, 0x2a4a9a, 0xd8b04a, 0x6a2a7a, 0x1d6a5a, 0xf2efe4];
    const look = (pose, yaw, role) => {
      const f = rng() < 0.5, L = AF.peopleKit.makeLook('traveler', f ? 'f' : 'm', 'adult', rng);
      L.top = Object.assign({}, L.top || {}, f ? { col: gowns[(rng() * gowns.length) | 0] } : { col: tux[(rng() * tux.length) | 0] });
      L.bottom = Object.assign({}, L.bottom || {}, { col: f ? L.top.col : 0x1a1a1e });
      if (role === 'dealer' || role === 'band') { L.top.col = 0xf2efe4; L.bottom.col = 0x1a1a1e; }
      if (role === 'crew') { L.top.col = 0xf6f2ea; L.bottom.col = 0xf6f2ea; }
      if (role === 'officer') { L.top.col = 0x1f2a44; L.bottom.col = 0x1f2a44; }
      L.pose = pose; L.yaw = yaw; return L;
    };
    let n = 0;
    const reg = (p, grp) => { if (!p) return p; LN.paths.all.push(p); if (grp) LN.paths[grp].push(p); return p; };
    const one = (name, u, y, v, L, grp) => { try { reg(WK.addPath(name, [[CX + u, y, CZ + v]], { count: 1, speed: 0, activeRadius: 110, looks: [L] }), grp); n++; } catch (e) { AF.warnOnce('liner walkers', e); } };
    const path = (name, pts, count, speed, L, mode = 'loop', grp) => { try { reg(WK.addPath(name, pts.map(([u, y, v]) => [CX + u, y, CZ + v]), { count, speed, mode, activeRadius: 120, looks: L }), grp); n += count; } catch (e) { AF.warnOnce('liner walkers', e); } };
    for (const t of LN.tables) {
      if (t.kind === 'slot' || t.prescott) continue;
      const grp = t.room === 'gilded' ? 'salon' : 'hall', u = t.x - CX, v = t.z - CZ;
      one('liner dealer', t.kind === 'craps' ? u + t.w / 2 + 0.45 : u, t.y, t.kind === 'craps' ? v : v - t.d / 2 - 0.45, look('marshal', t.kind === 'craps' ? -HP : 0, 'dealer'), grp);
      const g = t.kind === 'roulette' || t.kind === 'craps' ? (grp === 'salon' ? 1 : 2) : 1;
      for (let i = 0; i < g; i++) {
        if (t.kind === 'craps') { one('liner gambler', u - t.w / 2 - 0.5, t.y, v - 0.9 + i * 1.8, look('stand', HP), grp); continue; }
        one('liner gambler', u - t.w / 2 + (i + (g > 1 ? 0.6 : 1.1)) * t.w / 2.2, t.y, v + t.d / 2 + 0.45, look('stand', PI), grp);
      }
    }
    const slots = LN.tables.filter((t) => t.kind === 'slot');
    for (let i = 3; i < slots.length; i += 15) { const s = slots[i]; one('liner slots', s.x - CX, s.y, s.z - CZ + s.face * 0.75, look('stand', s.face > 0 ? PI : 0), 'hall'); }
    one('liner bartender', 46, F1, -4, look('marshal', -HP, 'dealer'), 'hall'); one('liner bartender', 46, F1, 4, look('marshal', -HP, 'dealer'), 'hall');
    one('liner bartender', 14, F3, -9, look('marshal', 0, 'dealer')); one('liner bartender', 37.9, F4, -5, look('marshal', HP, 'dealer'), 'salon');
    one('liner guest', 56.5, F4, 7.2, look('stand', HP), 'salon'); one('liner guest', 50, F4, -8.4, look('stand', 0), 'salon');
    path('liner hall', [[-23, F1, -0.7], [41, F1, -0.7]], 2, 0.8, [look(), look()], 'pingpong', 'hall');
    path('liner hall b', [[41, F1, 0.7], [-23, F1, 0.7]], 1, 0.75, [look()], 'pingpong', 'hall');
    path('liner hall n', [[-23, F1, -11.2], [40, F1, -11.2]], 1, 0.7, [look()], 'pingpong', 'hall');
    path('liner waiter', [[-22, F1, 7.1], [40, F1, 7.1]], 1, 1.1, [look('stand', 0, 'crew')], 'pingpong', 'hall');
    path('liner atrium', [[-52, F1, -3], [-28, F1, -3], [-28, F1, 3], [-52, F1, 3]], 2, 0.7, [look(), look()]);
    path('liner gallery', [[-52, F2, -11.5], [42, F2, -11.5]], 1, 0.75, [look()], 'pingpong');
    path('liner gallery s', [[42, F2, 11.5], [-52, F2, 11.5]], 1, 0.75, [look()], 'pingpong');
    path('liner promenade', [[-58, F3, -11.6], [64, F3, -11.6]], 3, 0.9, [look(), look(), look()], 'pingpong');
    path('liner promenade s', [[64, F3, 11.6], [-58, F3, 11.6]], 2, 0.85, [look(), look()], 'pingpong');
    path('liner palm court', [[-24, F3, -8.5], [0, F3, -8.5], [0, F3, 8.5], [-24, F3, 8.5]], 1, 0.6, [look()]);
    path('liner lounge waiter', [[4, F3, -6], [46, F3, -6]], 1, 1.1, [look('stand', 0, 'crew')], 'pingpong');
    path('liner sun deck', [[-30, F4, -5], [16, F4, -5]], 2, 0.8, [look(), look()], 'pingpong');
    for (let i = 0; i < 8; i++) { const a = i * 2.4, r = 0.8 + (i % 4) * 1.1; one('liner dancer', 25 + Math.cos(a) * r * 1.4, F3, Math.sin(a) * r * 0.9, look('dance', rng() * PI * 2)); }
    for (const v of [-1, 1.5, 4]) one('liner band', 55.5, F3 + 0.5, v, look('marshal', -HP, 'band')); one('liner band', 54, F3 + 0.5, -4.2, look('marshal', -HP, 'band'));
    for (const [u, v, a] of [[-26, -6.5, PI], [12, -6.5, PI]]) one('liner sun deck', u, F4, v, look('stand', a));
    one('liner aft deck', -86, F3, -5, look('stand', -HP));
    one('liner captain', 57.5, F5, 0, look('stand', HP, 'officer'));
    one('liner cloakroom', -51.5, F1, -13.1, look('marshal', 0, 'crew')); one('liner purser', -29, F1, -13.1, look('marshal', 0, 'officer'));
    one('liner cashier', -57.5, F1, -2, look('marshal', HP, 'dealer')); one('liner steward', -37, -0.5, -22.2, look('marshal', PI, 'crew'));
    one('liner launch hand', -226 - CX, -0.5, 271.6 - CZ, look('marshal', 0, 'crew'));
    LN.walkers = n; LN.look = look;
  };

  // ---------------------------------------------------------------- the two doors that open: the vault (round steel, hinged at its +v edge) and the cage's staff door
  const DOORS = LN.doorMesh = {};
  const doorMeshes = (grp) => {
    const v = new AF.Model(5, 24, 24), steel = fc(0x9aa0a8, { metal: 0.85, rough: 0.3 }), dark = fc(0x5d636b, { metal: 0.8 });
    v.box(0, 0, 0, 4, 24, 24, steel); for (let y = 0; y < 24; y++) for (let z = 0; z < 24; z++) { const d = Math.hypot(y - 11.5, z - 11.5); if (d < 10 && d > 8.5) v.set(4, y, z, FC.gold); if (d < 2) v.set(4, y, z, FC.gold); }
    v.line(4, 11.5, 4, 4, 11.5, 19, FC.gold); v.line(4, 4, 11.5, 4, 19, 11.5, FC.gold); for (let y = 2; y < 22; y += 4) v.box(0, y, 21, 4, y + 1, 24, dark);
    const s = new AF.Model(3, 24, 16); s.box(0, 0, 0, 2, 24, 16, FC.wood); s.box(2, 10, 12, 3, 12, 13, FC.gold); s.box(0, 18, 3, 2, 22, 13, FC.velvet);
    for (const [k, model, u, vv] of [['vault', v, -62.75, -4], ['staff', s, -55.75, 5]]) {
      const geo = AF.meshModel(model, { vs: 1 / 8, anchor: [0, 0, 1] }); delete geo.userData.src;
      const pivot = new THREE.Group(); pivot.position.set(CX + u, F1, CZ + vv); const mesh = AF.modelMesh(geo); mesh.castShadow = false; pivot.add(mesh); grp.add(pivot);
      DOORS[k] = { pivot, a: 0, want: 0 };
    }
    LN.doors.vault = col(-62.75, F1, -7, -62.25, F1 + 3, -4); LN.doors.staff = col(-56, F1, 3, -55, F1 + 3, 5);
  };
  const setDoor = (k, open) => { const b = LN.doors[k], d = DOORS[k]; if (!b || LN.isOpen(k) === !!open) return; b.y1 = open ? b.y0 : b.y0 + 3; if (d) d.want = open ? (k === 'vault' ? -PI * 0.55 : PI * 0.5) : 0; if (AF.audio) AF.audio.play(k === 'vault' ? 'vault' : open ? 'door_open' : 'door_close', k === 'vault' ? { x: CX - 62, y: F1 + 1.5, z: CZ - 5 } : { x: CX - 55.5, y: F1 + 1.5, z: CZ + 4 }); };
  LN.openVault = (open) => setDoor('vault', open);
  LN.openStaff = (open) => setDoor('staff', open);
  LN.isOpen = (k) => !!(LN.doors[k] && LN.doors[k].y1 === LN.doors[k].y0);

  // ---------------------------------------------------------------- signs (deco letters, merged into the hull mesh): [text, u, y, v, facing, vs, emissive]
  const SIGNS = [
    ['GRAND CASINO', -26, 9.5, 0, '-u', 1 / 8, 1], ['PURSER', -55, 5.0, -2, '+u', 1 / 12, 1], ['PRIVATE', -55, 4.95, 4, '+u', 1 / 16, 0], ['STAFF ONLY', -33, 4.95, 9.5, '-v', 1 / 16, 0],
    ['STAFF ONLY', 48, 4.95, 1, '-u', 1 / 16, 0], ['PANTRY', 52, 4.95, 10.5, '+v', 1 / 16, 0], ['CREW LOUNGE', 57.5, 4.95, -11, '+u', 1 / 16, 0], ['CREW STAIRS', 60, 4.95, -8, '-u', 1 / 16, 0],
    ['STARLIGHT LOUNGE', 2, 14.8, 0, '-u', 1 / 12, 1], ["HIGH ROLLERS' SALON", 41, 20.0, 5.25, '-u', 1 / 16, 1], ['PRIVATE', 60, 20.0, 4, '-u', 1 / 16, 0], ['BOARDING', -42, 5.4, -15, '-v', 1 / 12, 1],
    ['SOLACE QUEEN', 52, 5.0, 15, '+v', 1 / 6, 2], ['SOLACE QUEEN', 52, 5.0, -15, '-v', 1 / 6, 2], ['SOLACE QUEEN', -95, 9.0, 0, '-u', 1 / 8, 2],
  ];
  const signGeos = () => {
    const out = [], fgE = AF.col(0xf2c860, { emit: 0xffc040, emitK: 1.6, mode: 'always', jitter: 0 }), fgN = AF.col(0xd8a83a, { metal: 0.8, rough: 0.3, emit: 0xffc040, emitK: 1.2, mode: 'night' }), bg = AF.col(0x1c2a44, { jitter: 0.1 });
    const ROT = { '+v': 0, '-v': PI, '+u': HP, '-u': -HP };
    for (const [str, u, y, v, face, vs, kind] of SIGNS) {
      const md = AF.textModel(str, kind === 1 ? fgE : kind === 2 ? fgN : fgN, kind === 2 ? { font: 'deco', pad: 0 } : { font: 'deco', pad: 1, bg, depth: 1 });
      const g = AF.meshModel(md, { vs, anchor: [0.5, 0.5, 0] }); delete g.userData.src;
      g.rotateY(ROT[face]); g.translate(u - U0, y - Y0, v - V0); out.push(g);
    }
    return out;
  };
  // ---------------------------------------------------------------- build
  const GRP = new THREE.Group(); GRP.name = 'liner';
  AF.onBuild('harbour-liner', 307, () => {
    const t0 = performance.now();
    buildHull(); buildInterior(); buildHouse(); buildUpper(); buildStages(); buildPierStop(); layout(); setSpots();
    const geo = AF.meshModel(m, { vs: VS, anchor: [0, 0, 0] }); delete geo.userData.src;
    const ag = AF.meshModel(ma, { vs: VS, anchor: [0, 0, 0] }); delete ag.userData.src; ag.translate(A0U - U0, A0Y - Y0, A0V - V0);
    const parts = [geo, ag, ...signGeos()], BGU = AF.addons && AF.addons.BGU;
    let all = null;
    try { all = BGU && BGU.mergeGeometries(parts, false); } catch (e) { AF.warnOnce('liner merge', e); }
    if (all) { all.userData.vs = VS; if (geo.userData.glass) all.userData.glass = geo.userData.glass; }
    const hull = AF.modelMesh(all || geo); hull.position.set(CX + U0, Y0, CZ + V0); hull.castShadow = true; hull.name = 'liner-hull'; GRP.add(hull);
    if (!all) for (const g of parts.slice(1)) { const x = AF.modelMesh(g); x.position.copy(hull.position); GRP.add(x); }
    AF.scene.add(GRP); LN.mesh = GRP; LN.hull = hull; LN.tris = ((all || geo).index ? (all || geo).index.count : 0) / 3;
    instMesh(); crowd(); doorMeshes(GRP); buildTender();
    // dressed overall (signal flags stem -> masts -> funnels -> stern) + the ensign; funnel smoke
    if (AF.makeBunting) { const P3 = [[CX + 95, F3 + 1, CZ], [CX + 78, 42, CZ], [CX - 6, F4 + 16, CZ], [CX - 78, 38, CZ], [CX - 94, F3 + 7, CZ]]; for (let i = 0; i < P3.length - 1; i++) AF.makeBunting(P3[i], P3[i + 1], { shape: 'signal', parent: GRP, spacing: 1.2, size: 0.9 }); }
    if (AF.makeFlag) AF.makeFlag({ parent: GRP, x: CX - 94, y: F3 + 6.4, z: CZ, w: 3.2, h: 2.0, design: 'harbour', vane: false, yaw: -HP });
    const lib = AF.hbLib || {}, smk = lib.smoke ? [0, 1, 2].map(() => lib.smoke(5, 0xd8d4cc, 3.6, 10)) : [];
    const dyn = AF.land && AF.land.hbDyn;
    if (dyn && smk.length) dyn.push({ x: CX, z: CZ, r: 900, update(dt, t) { for (let i = 0; i < smk.length; i++) smk[i].update(dt, t + i * 1.7, CX - 22 + i * 16, F4 + 16, CZ, 0.5); } });
    // lights: chandeliers, crew spaces, deck lamps, the stages (pooled, tier-capped)
    for (const [x, y, z] of PLACE.grand) AF.addLight({ x, y: y + 0.5, z, color: 0xffd9a0, intensity: 1.8, range: 16, kind: 'interior' });
    for (const [x, y, z] of PLACE.chandelier) AF.addLight({ x, y: y + 0.2, z, color: 0xffd9a0, intensity: 1.3, range: 11, kind: 'interior' });
    for (const [u, y, v] of [[-60, F1 + 3.5, 12.25], [-20, F1 + 3.5, 12.25], [20, F1 + 3.5, 12.25], [54, F1 + 3.5, 4], [62, F1 + 3, -2], [62, F3 + 3, -2], [-59, F1 + 3, 0]]) AF.addLight({ x: CX + u, y, z: CZ + v, color: 0xfff0d8, intensity: 0.9, range: 9, kind: 'interior' });
    for (let u = -84; u < 64; u += 12) for (const v of [-13.5, 13.5]) AF.addLight({ x: CX + u, y: F3 + 2.5, z: CZ + v, color: 0xffd08a, intensity: 0.9, range: 9, kind: 'night' });
    AF.addLight({ x: CX - 40, y: 2, z: CZ - 24, color: 0xffd08a, intensity: 1.1, range: 10, kind: 'night' }); AF.addLight({ x: CX - 84, y: 2, z: CZ + 22.5, color: 0xffd08a, intensity: 1.0, range: 9, kind: 'night' });
    if (AF.water2 && AF.water2.cands) for (const du of [-60, -30, 0, 30, 60]) AF.water2.cands.push({ x: CX + du, y: 9, z: CZ - 16, color: 0xffd08a, intensity: 0.9 });
    // rooms for the indoor camera, the banner and the map
    const B = (id, name, kind, b, label) => AF.addBuilding({ id, name, kind, box: [CX + b[0], b[1], CZ + b[2], CX + b[3], b[4], CZ + b[5]], doors: [], interior: true, owner: 'harbour', label });
    B('liner-atrium', 'Grand Atrium \u00b7 SS Solace Queen', 'hall', [-56, F1 - 0.5, -14, -26, 18, 9.5], false);
    B('liner-casino', 'Grand Casino \u00b7 SS Solace Queen', 'casino', [-26, F1 - 0.5, -14, 49, F3 - 1, 9.5], true);
    B('liner-crew', 'Crew quarters', 'service', [-86, F1 - 0.5, -14, -56, F2 - 1, 14], false); B('liner-crew2', 'Crew quarters', 'service', [-56, F1 - 0.5, 9.5, 66, F2 - 1, 14], false);
    B('liner-crew3', 'Crew quarters', 'service', [48, F1 - 0.5, -14, 66, F2 - 1, 14], false); B('liner-stairs', 'Crew stairs', 'service', [60, F1 - 0.5, -9.5, 66, F5 - 1, 5.5], false);
    B('liner-salon', 'High Rollers\u2019 Salon', 'casino', [36.5, F4 - 0.5, -9.5, 60, F5 - 1, 9.5], true);
    B('liner-lounge', 'Starlight Lounge', 'ballroom', [-60, F3 - 0.5, -9.5, 60, F4 + 3, 9.5], true);
    AF.addLabel('SS Solace Queen', CX, CZ, 'place'); AF.addLabel('Solace Queen launch stop', -230, 270, 'place');
    const HR = AF.harbour; if (HR && HR.ships) HR.ships.push({ name: 'Solace Queen', mesh: GRP, x: CX, z: CZ, len: LEN });
    if (AF.land) AF.land.liner = GRP;
    LN.ready = true; LN.buildMs = Math.round(performance.now() - t0);
  });
  // furniture shows within ~120 m of the hull; the roulette wheels turn while someone watches; the doors swing
  const WQ = new THREE.Quaternion(), WE = new THREE.Euler(), WP = new THREE.Vector3(), WS = new THREE.Vector3(1, 1, 1), WM = new THREE.Matrix4();
  AF.onTick('liner', 340, (dt, t) => {
    if (!LN.ready) return;
    for (const k in DOORS) { const d = DOORS[k]; if (Math.abs(d.a - d.want) > 1e-3) { d.a += (d.want - d.a) * Math.min(1, dt * (k === 'vault' ? 0.9 : 4)); d.pivot.rotation.y = d.a; } }
    const cp = AF.camera.position, du = Math.max(0, Math.abs(cp.x - CX) - 95), dv = Math.max(0, Math.abs(cp.z - CZ) - 15), d2 = du * du + dv * dv, near = d2 < 120 * 120 && cp.y < 90;
    if (near !== LN.near) { LN.near = near; for (const im of IMS) im.visible = near; }
    if (!near || !wheelIM || (cp.x - CX - 15) ** 2 + (cp.z - CZ) ** 2 > 75 * 75) return;
    const L = PLACE.wheel;
    for (let i = 0; i < L.length; i++) { const p = L[i]; WP.set(p[0], p[1], p[2]); WE.set(0, t * (0.9 + i * 0.13) + (LN.spin && LN.spin[i] || 0), 0); WQ.setFromEuler(WE); WM.compose(WP, WQ, WS); wheelIM.setMatrixAt(i, WM); }
    wheelIM.instanceMatrix.needsUpdate = true;
  });
  // ---------------------------------------------------------------- the shore launch: the Pleasure Pier head <-> the boarding pontoon, a timetable on the world clock
  // Two launches, half a cycle apart: dwell D at a stop, cross in X (smoothstep progress, the outbound lane bulging east and the
  // return lane west so they pass 30 m apart), swinging alongside each stop at the end. Pure function of W: every co-op client
  // sees the same boats. Riding = mode 'tender' (seated aboard; Space skips the crossing unless AF.noTravel(), E steps off alongside).
  const TD = LN.tender = { D: 25, X: 80, off: 0, boats: [], cur: null, waiting: -1, prompts: [], acc: 0, im: null, pilots: [] };
  TD.P = 2 * (TD.D + TD.X);
  const STOPS = TD.stops = [
    { name: 'the Pleasure Pier', x: -230, y: -0.5, z: 273, bx: -230, bz: 278, yaw: HP, land: { x: -230, z: 273, yaw: PI } },
    { name: 'the SS Solace Queen', x: CX - 40, y: -0.5, z: CZ - 24, bx: CX - 40, bz: CZ - 28.9, yaw: HP, land: { x: CX - 40, z: CZ - 23.5, yaw: 0 } },
  ];
  const AX = STOPS[0].bx, AZ = STOPS[0].bz, RX = STOPS[1].bx - AX, RZ = STOPS[1].bz - AZ, RL = Math.hypot(RX, RZ), NXr = RZ / RL, NZr = -RX / RL, BULGE = 15;
  TD.at = (b, w) => {
    const D = TD.D, X = TD.X, Pd = TD.P, tau = ((w + TD.off + b.i * Pd / 2) % Pd + Pd) % Pd;
    b.tau = tau;
    if (tau < D || (tau >= D + X && tau < 2 * D + X)) {
      const k = tau < D ? 0 : 1, s = STOPS[k];
      b.dock = k; b.from = k; b.to = 1 - k; b.e = 0; b.left = (k ? 2 * D + X : D) - tau; b.x = s.bx; b.z = s.bz; b.yaw = s.yaw; b.speed = 0; return b;
    }
    const back = tau >= 2 * D + X; b.dock = -1; b.from = back ? 1 : 0; b.to = 1 - b.from; b.e = tau - (back ? 2 * D + X : D); b.left = X - b.e;
    const k = b.e / X, p = AF.smooth(0, 1, k), dp = 6 * k * (1 - k) / X, s = back ? 1 - p : p, sg = back ? -1 : 1;
    const bl = Math.sin(PI * s) * BULGE * sg, db = Math.cos(PI * s) * BULGE * PI * sg;
    b.x = AX + RX * s + NXr * bl; b.z = AZ + RZ * s + NZr * bl;
    const tx = (RX + NXr * db) * sg, tz = (RZ + NZr * db) * sg, y0 = STOPS[b.from].yaw, y1 = STOPS[b.to].yaw;
    let yaw = Math.atan2(tx, tz); yaw = y0 + AF.angDiff(y0, yaw) * AF.smooth(0, 0.1, k); yaw += AF.angDiff(yaw, y1) * AF.smooth(0.9, 1, k);
    b.yaw = yaw; b.speed = Math.hypot(tx, tz) * dp; return b;
  };
  const tenderModel = () => {
    const M = new AF.Model(15, 14, 48), K = { boot: fc(0xa8302a), white: fc(0xf4f0e6), mah: fc(0x6a3418, { pat: 'plank' }), deck: fc(0xb08a5a, { pat: 'plank' }), stripe: fc(0xb8202a), screen: fc(0x2a3a4a, { metal: 0.3, rough: 0.2 }) };
    for (let z = 0; z < 48; z++) {
      const t = z / 47, hw = 7.4 * (t > 0.72 ? Math.pow(Math.max(0, 1 - (t - 0.72) / 0.28), 0.6) : t < 0.05 ? 0.9 : 1);
      for (let y = 0; y < 5; y++) {
        const w = hw * (y < 2 ? 0.7 + y * 0.15 : 1);
        for (let x = 0; x < 15; x++) {
          const d = Math.abs(x - 7); if (d > w) continue;
          const edge = d > w - 1;
          if (y >= 3 && !edge && z >= 3 && z < 38) continue;
          M.set(x, y, z, y < 2 ? K.boot : y === 2 ? (edge ? K.white : K.deck) : y === 3 ? (edge ? K.white : K.deck) : edge ? K.mah : K.deck);
        }
      }
      if (z >= 3 && z < 38) for (let x = 0; x < 15; x++) if (Math.abs(x - 7) > hw - 1 && Math.abs(x - 7) <= hw) M.set(x, 5, z, FC.gold);
    }
    for (const x of [2, 12]) M.box(x, 3, 6, x + 1, 4, 30, FC.velvet);
    M.box(2, 3, 4, 13, 4, 6, FC.velvet);
    for (const z of [16, 25, 33]) for (const x of [1, 13]) M.box(x, 5, z, x + 1, 11, z + 1, FC.chrome);
    for (let z = 15; z < 35; z++) M.box(0, 11, z, 15, 12, z + 1, (z >> 1) & 1 ? FC.canvas : K.stripe);
    M.box(2, 5, 34, 13, 7, 35, K.screen); M.box(9, 4, 32, 10, 6, 33, FC.gold); M.box(8, 6, 32, 11, 7, 33, FC.gold);
    M.box(7, 4, 1, 8, 9, 2, FC.chrome); M.box(7, 7, 0, 8, 9, 1, K.stripe);
    return M;
  };
  const SEAT = { x: 0, y: 0, z: 0, yaw: 0, roll: 0, pitch: 0, seatH: 0.45, lean: 0.1 }, SEATL = [-1.0, 1.0, -2.9];
  const toWorld = (b, l, out) => { const s = Math.sin(b.yaw), c = Math.cos(b.yaw); out.x = b.x + c * l[0] + s * l[2]; out.y = b.y + l[1]; out.z = b.z - s * l[0] + c * l[2]; return out; };
  const buildTender = () => {
    const geo = AF.meshModel(tenderModel(), { vs: 0.25, anchor: [0.5, 0, 0.5] }); delete geo.userData.src;
    const im = TD.im = new THREE.InstancedMesh(geo, AF.mat.voxelInst, 3); im.name = 'liner-launches'; im.customDepthMaterial = AF.mat.depthInst;
    im.castShadow = false; im.receiveShadow = true; im.frustumCulled = false; im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); AF.scene.add(im);
    for (let i = 0; i < 2; i++) TD.boats.push({ i, x: AX, y: WY - 0.5, z: AZ, yaw: HP, dock: 0, from: 0, to: 1, e: 0, left: 0, speed: 0, tau: 0, prev: null });
    const dm = new THREE.Object3D(), L = LN.spots.launchBoat; dm.position.set(L.x, WY - 0.5, L.z); dm.rotation.set(0, L.yaw, 0); dm.updateMatrix(); im.setMatrixAt(2, dm.matrix);
    if (AF.water2 && AF.water2.addBoat) AF.water2.addBoat(im);
    const WK = AF.walkers;
    if (WK && WK.addPath && LN.look) for (let i = 0; i < 2; i++) {
      try { const p = WK.addPath('liner launch pilot', [[AX, WY, AZ], [AX + RX, WY, AZ + RZ]], { count: 1, speed: 0, activeRadius: 160, looks: [LN.look('marshal', 0, 'crew')] }); const a = p.actors[0]; a.ctl = { x: AX, y: WY, z: AZ, yaw: 0, moving: false, ph: 0 }; TD.pilots.push(a); LN.paths.all.push(p); } catch (e) { AF.warnOnce('liner pilots', e); }
    }
    for (let k = 0; k < 2; k++) { const s = STOPS[k]; TD.prompts[k] = AF.addInteract({ x: s.x, y: s.y + 1, z: s.z, r: 4, prio: 0.7, label: 'Board the launch', can: () => AF.mode === 'walk', act: () => TD.board(k) }); }
    TD.cam = new AF.Vehicle.Chase({ dist: 11, height: 2.2, ahead: -1.5, shadow: 50, floor: () => WY + 1.2, eye: [SEATL[0], 1.7, SEATL[2] + 0.3] });
    TD.ride = { label: 'Skip the crossing', act: () => TD.skip() };
  };
  const dockedAt = (k) => { for (const b of TD.boats) if (b.dock === k && b.left > 2) return b; return null; };
  TD.waitAt = (k) => { let best = 1e9; for (const b of TD.boats) { if (b.dock === k) return 0; const start = k ? TD.D + TD.X : 0; best = Math.min(best, ((start - b.tau) % TD.P + TD.P) % TD.P); } return best; };
  const land = TD.land = (k) => {
    const s = STOPS[k], L = s.land, y = AF.surfaceBelow(L.x, L.z, s.y + 2, 4);
    AF.setMode('walk', { x: L.x, y: Number.isFinite(y) ? y : s.y, z: L.z, yaw: L.yaw, snap: true });
    AF.emit('toast', k ? 'Welcome aboard the SS Solace Queen' : 'Back on the Pleasure Pier');
  };
  TD.board = (k) => {
    if (AF.mode === 'tender') return;
    const b = dockedAt(k); if (b) { TD.waiting = -1; AF.setMode('tender', { boat: b }); return; }
    TD.waiting = k; AF.emit('toast', 'The launch is on her way \u2014 about ' + Math.max(5, Math.round(TD.waitAt(k))) + ' s.');
  };
  TD.skip = () => {
    const b = TD.cur; if (!b || (AF.stream && AF.stream.traveling)) return;
    if (AF.noTravel && AF.noTravel()) { AF.emit('toast', 'No shortcuts now \u2014 ride her across.'); return; }
    const k = b.dock >= 0 ? 1 - b.dock : b.to;
    if (AF.stream && AF.stream.travel) AF.stream.travel({ label: k ? 'SS Solace Queen' : 'Pleasure Pier', go: () => land(k) }); else land(k);
  };
  const rideHud = { mode: 'drive', speed: 0, car: '' };
  AF.modes.tender = {
    enter(o = {}) {
      const b = o.boat; if (!b) { AF.setMode('walk'); return; }
      TD.cur = b; b.prev = b.dock; TD.cam.set({ dist: 11, height: 2.2, ahead: -1.5, shadow: 50, floor: () => WY + 1.2, eye: [SEATL[0], 1.7, SEATL[2] + 0.3] });
      AF.player.setVisible(true); AF.interactTarget = TD.ride;
      AF.emit('hint', AF.touch ? '' : 'Space skip the crossing \u00b7 E step off while she\u2019s alongside');
      AF.emit('toast', 'Aboard the launch to ' + STOPS[b.dock >= 0 ? 1 - b.dock : b.to].name.replace(/^the /, '') + '.');
    },
    exit() { TD.cur = null; AF.interactTarget = null; AF.PL.seat = null; AF.emit('hud', { speed: null }); AF.emit('hint', ''); },
    update(dt) {
      const b = TD.cur; if (!b) return;
      if (!(AF.ui && AF.ui.modalOpen && AF.ui.modalOpen())) {
        if (AF.input.hit('Space')) { TD.skip(); if (AF.mode !== 'tender') return; }
        if (AF.input.hit('KeyE') || AF.input.hit('KeyF')) { if (b.dock >= 0) { land(b.dock); return; } AF.emit('toast', 'Sit tight until she\u2019s alongside.'); }
      }
      toWorld(b, SEATL, SEAT); SEAT.yaw = b.yaw; SEAT.roll = b.roll || 0; SEAT.pitch = b.pitch || 0; AF.PL.seat = SEAT;
      const pl = AF.player; pl.x = pl.body.x = SEAT.x; pl.y = pl.body.y = SEAT.y - 0.45; pl.z = pl.body.z = SEAT.z; pl.body.vy = 0;
      TD.cam.update(dt, b.x, b.y + 0.8, b.z, b.yaw);
      rideHud.speed = b.speed * 2.237; rideHud.car = 'Launch to ' + STOPS[b.dock >= 0 ? 1 - b.dock : b.to].name.replace(/^the /, ''); AF.emit('hud', rideHud);
    },
  };
  const M4 = new THREE.Matrix4(), Q4 = new THREE.Quaternion(), E4 = new THREE.Euler(0, 0, 0, 'YXZ'), V4 = new THREE.Vector3(), S4 = new THREE.Vector3(1, 1, 1), PL4 = { x: 0, y: 0, z: 0 }, HELM = [0.6, 0.75, 1.9];
  AF.onTick('liner-tender', 146, (dt, t) => {
    const im = TD.im; if (!im) return;
    for (let i = 0; i < TD.boats.length; i++) {
      const b = TD.boats[i], was = b.dock; TD.at(b, t);
      b.y = WY - 0.5 + Math.sin(t * 1.3 + i * 2) * 0.05; b.pitch = -Math.min(0.06, b.speed * 0.004); b.roll = Math.sin(t * 0.9 + i) * 0.015;
      V4.set(b.x, b.y, b.z); E4.set(b.pitch, b.yaw, b.roll); Q4.setFromEuler(E4); M4.compose(V4, Q4, S4); im.setMatrixAt(i, M4);
      const a = TD.pilots[i]; if (a && a.ctl) { toWorld(b, HELM, PL4); a.ctl.x = PL4.x; a.ctl.y = PL4.y; a.ctl.z = PL4.z; a.ctl.yaw = b.yaw; }
      if (TD.cur === b && b.dock >= 0 && was === -1) land(b.dock);
    }
    im.instanceMatrix.needsUpdate = true;
    if (TD.waiting >= 0) {
      const s = STOPS[TD.waiting], p = AF.player;
      if (AF.mode !== 'walk' || !p || Math.hypot(p.x - s.x, p.z - s.z) > 8) TD.waiting = -1;
      else if (dockedAt(TD.waiting)) TD.board(TD.waiting);
    }
    if ((TD.acc += dt) >= 0.25) {
      TD.acc = 0;
      for (let k = 0; k < 2; k++) { const it = TD.prompts[k]; if (!it) continue; const w = TD.waitAt(k), to = k ? 'Port Solace' : 'the Solace Queen'; it.label = w === 0 && dockedAt(k) ? 'Board the launch to ' + to : 'Wait for the launch to ' + to + ' \u00b7 ' + Math.max(1, Math.ceil(w)) + ' s'; }
    }
    if (AF.audio && AF.audio.hold) {
      const cur = TD.cur, cp = AF.camera.position;
      if (cur) AF.audio.hold('liner-launch', 'boat_loop', 0.7, 0.85 + Math.min(0.4, cur.speed / 40));
      else { let best = null, bd = 120; for (const b of TD.boats) { const d = Math.hypot(b.x - cp.x, b.z - cp.z); if (d < bd) { bd = d; best = b; } } AF.audio.hold('liner-launch', 'boat_loop', best ? 0.8 : 0, 0.85 + (best ? Math.min(0.4, best.speed / 40) : 0), best && best.x, 1, best && best.z); }
    }
  });
  // the map: the launch's lane (dashed) and the boats
  AF.on('ready', () => {
    const map = AF.ui && AF.ui.map; if (!map || !map.worldToScreen) return;
    (map.overlays || (map.overlays = [])).push((g) => {
      g.save(); g.strokeStyle = 'rgba(89,123,139,.8)'; g.setLineDash([5, 5]); g.lineWidth = 1.5; g.beginPath();
      for (let i = 0; i <= 16; i++) { const s = i / 16, p = map.worldToScreen(AX + RX * s, AZ + RZ * s), x = p.x, y = p.y; if (i) g.lineTo(x, y); else g.moveTo(x, y); }
      g.stroke(); g.setLineDash([]); g.fillStyle = '#597b8b'; g.strokeStyle = '#f5f8ef'; g.lineWidth = 1.5;
      for (const b of TD.boats) { const p = map.worldToScreen(b.x, b.z); g.beginPath(); g.arc(p.x, p.y, 4, 0, PI * 2); g.fill(); g.stroke(); }
      g.restore();
    });
  });
  // ---------------------------------------------------------------- tests
  const walk = (pts) => {
    const b = { x: CX + pts[0][0], y: pts[0][1], z: CZ + pts[0][2], vy: 0, r: 0.3, h: 1.7, onGround: true }; let stuck = null;
    for (let i = 1; i < pts.length && !stuck; i++) {
      const tx = CX + pts[i][0], tz = CZ + pts[i][2];
      for (let k = 0; k < 4000; k++) { const dx = tx - b.x, dz = tz - b.z, d = Math.hypot(dx, dz); if (d < 0.25) break; const s = Math.min(0.06, d); AF.moveBody(b, dx / d * s, dz / d * s, 1 / 60); if (k === 3999) stuck = [(b.x - CX).toFixed(1), b.y.toFixed(2), (b.z - CZ).toFixed(1), '->', pts[i][0], pts[i][2]].join(' '); }
    }
    return { b, stuck, room: room(b.x, b.y + 0.1, b.z) };
  };
  LN.walk = walk;
  AF.test('liner: decks are walkable and connected (pontoon, atrium, casino, lounge, salon, crew stairs, office, sun deck, bridge, launch)', () => {
    const R = {
      casino: [[[-40, -0.5, -23.5], [-42, -0.5, -21], [-42, F1, -16.5], [-42, F1, -12], [-34, F1, -3], [-20, F1, 0], [10, F1, 0]], 'casino', F1],
      salon: [[[-36, F1, -7], [-49, F1, -7], [-49, F1, 0], [-37.5, F1, 0], [-30, F1, 0], [-20, F1, 3], [-10, F1, 3], [2.25, F1, 0], [20, F1, 7.75], [24, F1, 7.75], [36.5, F1, 7.75], [39, F1, 6.25], [44, F1, 6.25], [50, F1, 0]], 'salon', F4],
      crew: [[[-33, F1, 7], [-33, F1, 12.25], [52, F1, 12.25], [52, F1, 5], [52, F1, 12.25], [58.75, F1, 12.25], [58.75, F1, -11], [55, F1, -11], [58.75, F1, -11], [58.75, F1, -8], [61.5, F1, -8], [61.5, F1, 3.9], [64.25, F1, 4], [64.25, F1, -8], [61.5, F1, -8], [61.5, F1, 4], [59, F1, 4], [57, F1, 4]], 'salon', F4],
      sun: [[[-20, F3, -11.5], [-17, F3, -13.5], [-6.5, F3, -13.5], [-4.5, F3, -12], [-4.5, F3, -6.5], [24, F3, -6.5], [25, F3, -8.5], [36.5, F3, -8.5], [40, F3, -8.5], [40, F3, 0], [56, F3, 0]], 'bridge', F5],
      aft: [[[-75, F3, 0], [-58, F3, 0], [-52, F3, 3]], 'atrium', F3],
      launch: [[[-80, F1, 12.25], [-84, F1, 12.25], [-84, F1, 16.5], [-84, F1, 19], [-84, F1, 22.5]], 'stage', -0.5],
    };
    const out = [], bad = [];
    for (const k in R) { const [pts, want, y] = R[k], r = walk(pts), ok = !r.stuck && r.room === want && Math.abs(r.b.y - y) < 0.3; out.push(k + (ok ? ' ok' : ' FAIL ' + r.room + ' y ' + r.b.y.toFixed(2) + (r.stuck ? ' stuck ' + r.stuck : ''))); if (!ok) bad.push(k); }
    // the cage's staff door gates Silas's office
    const was = LN.isOpen('staff'); LN.openStaff(true);
    const o = walk([[-50, F1, 4], [-57, F1, 4], [-61, F1, 5], [-66, F1, 5], [-70.8, F1, 3.5]]), office = !o.stuck && o.room === 'office';
    LN.openStaff(false); const shut = AF.boxBlocked(CX - 55.5, F1 + 0.05, CZ + 4, 0.3, 1.7) && !!walk([[-50, F1, 4], [-58, F1, 4]]).stuck; LN.openStaff(was);
    if (!office || !shut) bad.push('office');
    return { ok: !bad.length && LN.tables.length >= 20, info: out.join(', ') + ', office ' + office + (o.stuck ? ' stuck ' + o.stuck : '') + ', door shuts ' + shut + ' \u00b7 ' + LN.tables.length + ' tables, ' + LN.walkers + ' people, ' + LN.cols.length + ' colliders, ' + Math.round(LN.tris / 1000) + 'k tris, build ' + LN.buildMs + ' ms' };
  });
  AF.test('liner: the shore launch keeps its timetable over open water and lands her rider at the pontoon', () => {
    const b0 = TD.boats[0], b1 = TD.boats[1]; if (!b0 || !b1) return { ok: false, info: 'no launches' };
    const saved = TD.off, O = AF.outland, p = AF.player, from = { x: p.x, y: p.y, z: p.z };
    let dry = 0, hull = 0, close = 0, docks = 0, vmax = 0, landed = false, aboard = false;
    try {
      TD.off = 0;
      for (let w = 0; w < TD.P; w += 0.5) {
        for (const b of [b0, b1]) { TD.at(b, w); if (b.z > 320 && O && O.h && O.h(b.x, b.z) > WY - 1.2) dry++; if (b.dock < 0 && AF.Vehicle.noLand(b.x, b.z)) hull++; if (b.dock >= 0) docks++; vmax = Math.max(vmax, b.speed); }
        if (Math.hypot(b0.x - b1.x, b0.z - b1.z) < 12) close++;
      }
      // ride without advancing the shared clock (other tests' schedules depend on W): drive the launch hook with chosen times
      const hook = AF.hooks.tick.find((h) => h.name === 'liner-tender'), tA = TD.D - 3;
      TD.off = 0; TD.at(b0, tA); TD.at(b1, tA);
      AF.setMode('walk', { x: STOPS[0].x, y: AF.surfaceBelow(STOPS[0].x, STOPS[0].z, 2, 4), z: STOPS[0].z, snap: true }); TD.board(0); aboard = AF.mode === 'tender' && TD.cur === b0;
      if (hook) { hook.fn(1 / 30, TD.D + 10); hook.fn(1 / 30, TD.D + TD.X - 0.5); hook.fn(1 / 30, TD.D + TD.X + 0.1); }
      const L = STOPS[1].land; landed = AF.mode === 'walk' && Math.hypot(p.x - L.x, p.z - L.z) < 0.6 && Math.abs(p.y + 0.5) < 0.2 && !AF.boxBlocked(p.x, p.y + 0.05, p.z, 0.3, 1.7);
    } finally { TD.off = saved; TD.waiting = -1; if (AF.mode === 'tender') AF.setMode('walk'); AF.setMode('walk', { x: from.x, y: from.y, z: from.z, snap: true }); }
    return { ok: !dry && !hull && !close && aboard && landed && vmax < 25, info: `dry ${dry} hull ${hull} close ${close} docked samples ${docks} vmax ${vmax.toFixed(1)} m/s, aboard ${aboard}, landed ${landed}` };
  });
}
} catch (e) { AF.partError('48-liner.js', e); }
