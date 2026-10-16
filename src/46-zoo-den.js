// ================================================================ 46-zoo-den.js
try {
// ===== 46-zoo-den: the LION HOUSE (Pride Rock's night den) and the keepers' yard, and under them an old war bunker, a storm
//       drain and the Kestrel Systems fibre junction, with a stair up to Westgate Road (OWNER: den).
//       Static world: voxels + merged props (no new draws). Heist-only lions: one shared InstancedMesh per part (5 draws), drawn and
//       ticked only while AF.den.setActive(true) and the player is within ~60 m. Underground lights are parked unless the camera
//       is down there (they would light the paths from below and take light-pool slots). LEDs / lamps blink via palette entries.
//   AF.den = { spots, lions:[{x,y,z,yaw,state,level}], setActive(on), reset(), calm(), awake(), setHatch(open), hatchOpen,
//              hatchInteract (false | () => bool: who may work the lion-house hatch; 81-heist limits it to the hacker at night),
//              setDrain(open), drainOpen (the locked street hatch over the drain stair; shut unless the heist opens it), onWake, dmg }
{
  const W = AF.W, PI = Math.PI, GOFF = Math.round(-W.Y0 * 4);
  const D = AF.den = { lions: [], active: false, onWake: null, hatchOpen: false, hatchInteract: false, dmg: 34, hits: 0, stats: { draws: 0, ticks: 0 } };
  // den interior (lions are confined to it) and the hatch opening in the back cave (stair flight A)
  const BOX = D.box = { x0: -514.25, z0: -105.25, x1: -496.25, z1: -90.25 };
  const HATCH = D.hatchRect = { x0: -512.25, z0: -104.75, x1: -509.5, z1: -103.5 };
  const S = D.spots = {
    yard: { x: -497.0, y: 0.25, z: -86.5, yaw: -PI / 2 },                 // just inside the keepers' gate off the east walk
    locker: { x: -530.75, y: 0.25, z: -87.9, yaw: PI },                    // facing the open locker with the keeper uniform
    watchPath: [[-526.75, 0.25, -88.25], [-497.25, 0.25, -88.25], [-497.25, 0.25, -83.75], [-526.75, 0.25, -83.75]],
    denGate: { x: -498.75, y: 0.25, z: -89.0, yaw: PI },                   // outside the keepers' door, facing into the den
    denCentre: { x: -505.25, y: 0.25, z: -97.75 },
    hatch: { x: -510.625, y: 0.25, z: -104.125 },
    hatchTop: { x: -509.0, y: 0.25, z: -104.125, yaw: -PI / 2 },
    hatchBottom: { x: -508.75, y: -4.75, z: -102.625, yaw: PI / 2 },
    bunkerIn: { x: -508.75, y: -4.75, z: -102.625, yaw: PI / 2 },
    sewerIn: { x: -491.9, y: -5.75, z: -100.25, yaw: PI },
    server: { x: -480.75, y: -5.75, z: -18.9, yaw: 0 },                    // stand / sit at the Kestrel terminal (desk to +z)
    manhole: { x: -488.125, y: -5.75, z: -17.25, yaw: 0 },                 // foot of the drain stair (up = +z)
    street: { x: -488.125, y: 0.25, z: -9.25, yaw: 0 },                    // the verge of Westgate Road, opposite Airfield Road
  };
  const BEDS = [
    { name: 'Brutus', male: true, s: 1.0, x0: -507.5, z0: -97, x1: -503.5, z1: -94, yaw: 2.6 },
    { name: 'Nala', male: false, s: 0.88, x0: -502.5, z0: -101.5, x1: -498.5, z1: -98.5, yaw: 0.35 },
    { name: 'Sheba', male: false, s: 0.88, x0: -513, z0: -95.5, x1: -509, z1: -92.5, yaw: 1.9 },
  ];
  // ---------------------------------------------------------------- build helpers
  const col = (hex, o) => AF.col(hex, Object.assign({ jitter: 0.3, edge: 0.2 }, o || {}));
  const glow = (hex, k = 2.2, mode = 'always') => AF.col(hex, { emit: hex, emitK: k, mode, jitter: 0, edge: 0.1 });
  const F = (x0, y0, z0, x1, y1, z1, c) => W.fill(x0, y0, z0, x1, y1, z1, c);
  const CL = (x0, y0, z0, x1, y1, z1) => W.clear(x0, y0, z0, x1, y1, z1);
  const rb = (v, o) => Math.round((v - o) * 4);
  // per-block colour function (returns -1 to skip)
  const fillF = (x0, y0, z0, x1, y1, z1, fn) => {
    const a = rb(x0, W.X0), b = rb(x1, W.X0), c0 = rb(y0, W.Y0), c1 = rb(y1, W.Y0), d = rb(z0, W.Z0), e = rb(z1, W.Z0);
    for (let x = a; x < b; x++) for (let y = c0; y < c1; y++) for (let z = d; z < e; z++) { const v = typeof fn === 'function' ? fn(x, y, z) : fn; if (v >= 0) W.set(x, y, z, v); }
  };
  const pick = (arr, x, y, z) => arr[Math.floor(AF.hash2(x * 7 + y * 131, z * 3 + y) * arr.length) % arr.length];
  // the ground is a heightmap: anything under a column's top is solid. sink() lowers a rect of columns to floorY and refills them
  // with soil voxels up to the old surface (the top block keeps the surface colour), so rooms can be carved below untouched ground.
  const SUNK = D._sunk = new Map();
  const sink = (x0, z0, x1, z1, floorY, soil, flatTop, topC) => {
    const fb = Math.round(floorY * 4);
    W.eachCol(x0, z0, x1, z1, (bx, bz, i) => {
      const s = SUNK.get(i);
      if (!s) {
        const H = W.H[i], C = W.C[i], top = flatTop != null ? Math.round(flatTop * 4) : H;
        SUNK.set(i, { H, C });
        for (let b = fb; b < top; b++) { const by = b + GOFF; if (!W.get(bx, by, bz)) W.set(bx, by, bz, b === top - 1 ? (topC || C) : soil); }
        W.H[i] = fb; W.C[i] = soil;
      } else if (fb < W.H[i]) { for (let b = fb; b < W.H[i]; b++) { const by = b + GOFF; if (!W.get(bx, by, bz)) W.set(bx, by, bz, soil); } W.H[i] = fb; }
    });
    W.tDirty = true;
  };
  // a room: shell (walls t thick, 0.25 floor + ceiling layers) then the interior carved; wall/floor/ceiling may be colour functions
  const room = (x0, y0, z0, x1, y1, z1, wallC, floorC, ceilC, t = 0.25) => {
    fillF(x0 - t, y0 - 0.25, z0 - t, x1 + t, y1 + 0.25, z1 + t, wallC);
    if (floorC) fillF(x0, y0 - 0.25, z0, x1, y0, z1, floorC);
    if (ceilC) fillF(x0, y1, z0, x1, y1 + 0.25, z1, ceilC);
    CL(x0, y0, z0, x1, y1, z1);
  };
  // rough rock lump (cover): an ellipse of columns, domed
  const lump = (x0, z0, x1, z1, h, cols) => {
    const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, rx = (x1 - x0) / 2, rz = (z1 - z0) / 2;
    W.eachCol(x0, z0, x1, z1, (bx, bz, i, x, z) => {
      const e = ((x - cx) / rx) ** 2 + ((z - cz) / rz) ** 2; if (e > 1.05) return;
      const top = 0.25 + Math.max(0.25, Math.round(h * Math.sqrt(Math.max(0, 1 - e * 0.75)) * 4 + (AF.hash2(bx, bz) - 0.5) * 1.2) / 4);
      fillF(x - 0.125, 0.25, z - 0.125, x + 0.125, top, z + 0.125, (a, b, c) => pick(cols, a >> 1, b >> 1, c >> 1));
    });
  };
  const K = () => AF.westKit;
  const fitText = (str, hex, maxW, maxH, glowK) => {
    const m = AF.textModel(str, 1, { font: 'deco', depth: 1, pad: 0 }), vs = Math.min(maxW / (m.w || 1), maxH / (m.h || 1));
    return glowK ? K().text(str, hex, { font: 'deco', pad: 0, vs, k: glowK }) : K().text(str, hex, { lit: false, font: 'deco', pad: 0, vs });
  };
  const sign = (str, hex, maxW, maxH, x, y, z, rot, glowK) => AF.placeStatic(fitText(str, hex, maxW, maxH, glowK), x, y, z, rot, { collide: false });
  const prop = (m, x, y, z, rot, anchor = [0.5, 0, 0.5], vs = 1 / 16) => AF.placeStatic(AF.meshModel(m, { vs, anchor }), x, y, z, rot, { collide: false });
  const lightsUnder = D._under = [];
  const light = (o, under) => { AF.addLight(o); const l = AF.lights[AF.lights.length - 1]; if (under) { l._y = l.y; l.y = -9999; lightsUnder.push(l); } return l; };
  // blinking / flickering palette entries (animated by the tick while the camera is underground)
  const FX = D._fx = { lamps: [], leds: [] };
  const flick = (hex, emit, k) => { const i = AF.col(hex, { emit, emitK: k, mode: 'always', jitter: 0, edge: 0 }); const e = AF.PAL.emit; return { i, base: [e[i * 4], e[i * 4 + 1], e[i * 4 + 2]], off: 0 }; };

  AF.onBuild('zoo-den', 315, () => {
    const t0 = performance.now();
    // ---- palette
    const soil = col(0x4a3c2e, { jitter: 0.6 });
    const rockC = [col(0xa8875a, { jitter: 0.5 }), col(0x98784e, { jitter: 0.5 }), col(0xb89868, { jitter: 0.5 }), col(0x8a6c46, { jitter: 0.5 })];
    const caveC = [col(0x6e5a44, { jitter: 0.5 }), col(0x5e4c38, { jitter: 0.5 }), col(0x7a6650, { jitter: 0.5 })];
    const strawC = [col(0xd6be72, { jitter: 0.7 }), col(0xc8ac5a, { jitter: 0.7 }), col(0xe2cc86, { jitter: 0.7 })];
    const denFloor = col(0x8a8274, { jitter: 0.5 }), dirt = col(0x5a4632, { jitter: 0.7 });
    const timber = col(0x6a4a2e, { jitter: 0.4 }), timberD = col(0x4a3220, { jitter: 0.4 }), bark = col(0x5a4632, { jitter: 0.6 });
    const bale = col(0xd2b468, { jitter: 0.6 }), roofC = col(0x5a4a38, { jitter: 0.5 });
    const iron = AF.MAT.iron, steel = col(0x5a6066, { metal: 0.7, rough: 0.45 }), steelD = col(0x3a3e42, { metal: 0.6, rough: 0.5 });
    const rust = col(0x7a4628, { metal: 0.3, rough: 0.85, jitter: 0.6 }), red = col(0xa8321e), cream = col(0xe8dcc0, { jitter: 0.15 });
    const water = col(0x24382f, { rough: 0.05, jitter: 0.2, edge: 0 }), glass = AF.col('glass');
    const gravel = [col(0x9a9284, { jitter: 0.8 }), col(0x8a8274, { jitter: 0.8 }), col(0xa8a092, { jitter: 0.8 })];
    const crate = col(0x9a7448, { jitter: 0.5 }), crateD = col(0x7a5a36, { jitter: 0.5 }), sack = col(0xc8b088, { jitter: 0.6 }), green = col(0x3f6a3a, { rough: 0.6 });
    const lockerC = col(0x4f6e5c, { metal: 0.4, rough: 0.5 }), hutWall = col(0xc8b896, { pat: 'stucco', jitter: 0.3 }), tar = AF.MAT.tar;
    const lampNight = AF.col(0xfff0c8, { emit: 0xffd890, emitK: 2.6, mode: 'night', jitter: 0, edge: 0 });
    const heat = glow(0xff6a28, 2.4), lantern = glow(0xffb060, 1.8), cool = glow(0xb8c8ff, 1.4);

    // ================================================================ KEEPERS' YARD (the lawn strip between Pride Rock and the tigers)
    CL(-536, 0.25, -89.5, -495.5, 6, -82.5);
    W.eachCol(-536, -89.5, -495.5, -82.5, (bx, bz, i) => { W.C[i] = pick(gravel, bx, 0, bz); });
    W.tDirty = true;
    // locker room hut (its west wall closes the yard off the promenade)
    F(-536.25, 0.25, -89.75, -528.25, 3.0, -82.25, hutWall);
    CL(-535.5, 0.25, -89.25, -528.5, 2.75, -82.75);
    F(-536.5, 3.0, -90.0, -528.0, 3.25, -82.0, tar);
    W.eachCol(-535.5, -89.25, -528.5, -82.75, (bx, bz, i) => { W.C[i] = denFloor; });
    CL(-528.5, 0.25, -86.75, -528.25, 2.5, -85.25);                                      // door, east
    F(-528.5, 1.25, -88.75, -528.25, 2.0, -87.5, glass); F(-528.5, 1.25, -84.5, -528.25, 2.0, -83.25, glass);
    F(-528.25, 2.5, -87.0, -528.0, 2.75, -85.0, timberD);                                  // lintel
    // lockers along the north wall (1 m each); the 5th stands open with the uniform (spots.locker)
    for (let k = 0; k < 6; k++) { const x = -535.25 + k; if (k === 4) continue; F(x, 0.25, -89.25, x + 1, 2.25, -88.75, lockerC); }
    F(-531.25, 0.25, -89.25, -530.25, 0.5, -88.75, lockerC); F(-531.25, 2.0, -89.25, -530.25, 2.25, -88.75, lockerC);
    F(-530.25, 0.5, -88.75, -530.0, 2.0, -88.0, lockerC);                                   // its door, swung open
    {
      const back = col(0x1a1e1c, { jitter: 0.1 }), khaki = col(0x9a8a58, { jitter: 0.25 }), khakiD = col(0x7a6a40, { jitter: 0.25 }), cap = col(0x6a7a3a, { jitter: 0.2 }), badge = AF.MAT.brass;
      const u = new AF.Model(16, 24, 8); u.box(0, 0, 0, 16, 24, 1, back);
      u.box(7, 21, 2, 9, 22, 6, AF.MAT.steel); u.box(3, 18, 3, 13, 21, 5, khaki);                // hanger rail, shoulders
      u.box(4, 9, 3, 12, 18, 5, khaki); u.box(2, 12, 3, 4, 18, 5, khaki); u.box(12, 12, 3, 14, 18, 5, khaki); u.set(6, 16, 5, badge);
      u.box(7, 9, 5, 9, 18, 6, khakiD); u.box(4, 3, 3, 7, 9, 5, khakiD); u.box(9, 3, 3, 12, 9, 5, khakiD);
      u.box(5, 0, 2, 11, 2, 6, cap); u.box(4, 0, 5, 12, 1, 7, cap);                            // the cap on the locker shelf
      prop(u, -530.75, 0.5, -89.0, 0);
    }
    F(-534.25, 0.25, -86.25, -530.75, 0.75, -85.75, timber);                               // bench
    F(-535.5, 1.25, -85.0, -535.25, 2.25, -83.25, cream);                                  // notice board
    F(-535.5, 1.0, -88.0, -535.25, 1.25, -86.5, timberD);                                  // hat hooks
    F(-532.25, 2.5, -86.25, -532.0, 2.75, -86.0, glow(0xffe2b0, 2.0));
    light({ x: -532.1, y: 2.35, z: -86.1, color: 0xffe2b0, intensity: 0.55, range: 6, kind: 'interior' });
    // fences: east (staff gate, left open) and the gap by the den
    F(-536.5, 0.25, -89.75, -536.25, 2.75, -82.25, timber);
    for (const [za, zb] of [[-89.5, -87.75], [-85.25, -82.5]]) { F(-495.5, 0.25, za, -495.25, 2.25, zb, timber); F(-495.5, 2.25, za, -495.25, 2.5, zb, timberD); }
    F(-496.75, 0.25, -87.75, -495.5, 2.0, -87.5, timberD); F(-496.75, 0.25, -85.5, -495.5, 2.0, -85.25, timberD);   // gate leaves swung in
    F(-495.25, 1.25, -89.25, -495.0, 2.0, -87.75, red);
    sign('STAFF ONLY', 0xf2ead0, 1.4, 0.5, -494.955, 1.38, -88.5, 1);
    // yard lamp + the caged lamp over the den door
    F(-520, 0.25, -83.0, -519.75, 3.25, -82.75, iron); F(-520.25, 3.25, -83.25, -519.5, 3.5, -82.5, lampNight);
    light({ x: -519.9, y: 3.15, z: -83.3, color: 0xffd9a0, intensity: 0.7, range: 9, kind: 'lamp' });
    // cover down the middle of the yard (the watchman loops round it)
    F(-525.5, 0.25, -86.75, -523.5, 1.5, -85.25, crate); F(-525.0, 1.5, -86.5, -524.0, 2.25, -85.5, crateD);
    F(-519.5, 0.25, -86.5, -517.5, 0.75, -85.5, sack); F(-519.0, 0.75, -86.25, -518.0, 1.0, -85.75, sack);
    F(-513.5, 0.5, -86.75, -510.5, 0.75, -85.25, green); F(-513.5, 0.75, -86.75, -510.5, 1.25, -86.5, green); F(-513.5, 0.75, -85.5, -510.5, 1.25, -85.25, green);
    F(-513.25, 0.75, -86.5, -510.75, 1.25, -85.5, bale);
    for (const [wx, wz] of [[-513.25, -87.0], [-511.0, -87.0], [-513.25, -85.25], [-511.0, -85.25]]) F(wx, 0.25, wz, wx + 0.5, 0.75, wz + 0.25, AF.col('black'));
    F(-510.5, 0.75, -86.25, -509.75, 1.0, -85.75, iron);                                   // handle
    F(-507.5, 0.25, -86.75, -505.5, 1.25, -85.25, bale); F(-507.0, 1.25, -86.5, -506.0, 2.0, -85.5, bale);
    F(-504.0, 0.25, -86.5, -502.5, 0.75, -85.5, steel); F(-503.75, 0.5, -86.25, -502.75, 0.75, -85.75, water);

    // ================================================================ THE LION HOUSE (night den, SE corner of Pride Rock)
    CL(-515, 0.25, -106, -495.5, 14, -89.5);                                               // glass, kerb, tufts, any tree under the roof
    sink(-515, -106, -495.5, -89.5, -5.0, soil, 0.25, denFloor);
    // shell of rough sandstone, timber band, flat roof with a parapet
    const rockAt = (x, y, z) => pick(rockC, x >> 1, y >> 1, z >> 1);
    fillF(-515, 0.25, -106, -495.5, 5.25, -89.5, rockAt);
    F(-515.25, 3.75, -106.25, -495.25, 4.0, -89.25, timber);
    fillF(-515, 5.25, -106, -495.5, 5.75, -89.5, rockAt); CL(-514.5, 5.25, -105.5, -496, 5.75, -90);
    F(-514.5, 5.0, -105.5, -496, 5.25, -90, roofC);
    CL(BOX.x0, 0.25, BOX.z0, BOX.x1, 4.75, BOX.z1);
    // floor: straw over concrete; dark earth in the back cave
    fillF(BOX.x0, 0, BOX.z0, BOX.x1, 0.25, BOX.z1, (x, y, z) => AF.hash2(x >> 1, z >> 1) < 0.68 ? pick(strawC, x, 0, z) : denFloor);
    fillF(-514.25, 0, -105.25, -508.0, 0.25, -99.0, (x, y, z) => pick([dirt, caveC[1]], x, 0, z));
    for (const z of [-104, -101, -98, -95, -92]) F(BOX.x0, 4.25, z, BOX.x1, 4.75, z + 0.5, timberD);
    // high barred windows to the enclosure (moonlight)
    for (const wx of [-511, -505, -499]) { CL(wx - 0.5, 3.25, -106, wx + 0.5, 4.0, -105.25); F(wx - 0.5, 3.25, -105.75, wx + 0.5, 4.0, -105.5, glass); F(wx - 0.125, 3.25, -106, wx + 0.125, 4.0, -105.75, iron); }
    // the lion slide door to the enclosure (shut) and the facade sign on the east walk
    F(-515.25, 0.25, -99.0, -515.0, 2.5, -96.5, steelD); F(-515.25, 2.5, -99.5, -515.0, 2.75, -96.0, iron);
    F(-495.5, 2.75, -100.25, -495.25, 3.5, -95.25, timberD);
    sign('LION HOUSE', 0xe8d8a8, 4.6, 0.6, -495.205, 2.84, -97.75, 1);
    // the keepers' door from the yard (spots.denGate): steel frame, the leaf swung open inside, a caged lamp and a warning board
    CL(-499.5, 0.25, -90.25, -498, 2.75, -89.5);
    F(-499.75, 0.25, -89.5, -499.5, 3.0, -89.25, steel); F(-498, 0.25, -89.5, -497.75, 3.0, -89.25, steel); F(-499.75, 2.75, -89.5, -497.75, 3.0, -89.25, steel);
    F(-498.0, 0.25, -90.5, -496.5, 2.75, -90.25, steelD);
    F(-499.0, 3.0, -89.25, -498.5, 3.25, -89.0, lampNight);
    light({ x: -498.75, y: 2.9, z: -88.8, color: 0xffd9a0, intensity: 0.5, range: 6, kind: 'lamp' });
    F(-501.0, 3.25, -89.5, -496.5, 3.75, -89.25, red);
    sign('KEEPERS ONLY - LIONS', 0xf2ead0, 4.2, 0.4, -498.75, 3.32, -89.205, 0);
    // sleeping beds (timber frames, straw on top)
    for (const B of BEDS) { F(B.x0, 0.25, B.z0, B.x1, 0.75, B.z1, timber); fillF(B.x0 + 0.25, 0.5, B.z0 + 0.25, B.x1 - 0.25, 0.75, B.z1 - 0.25, (x, y, z) => pick(strawC, x, 1, z)); }
    // drinking pool with a rock rim
    CL(-502.25, -0.25, -96, -499.25, 0.25, -93.5); F(-502.25, -0.25, -96, -499.25, 0, -93.5, water);
    W.eachCol(-502.75, -96.5, -498.75, -93, (bx, bz, i, x, z) => { if (x > -502.25 && x < -499.25 && z > -96 && z < -93.5) return; if (AF.hash2(bx, bz) < 0.55) fillF(x - 0.125, 0.25, z - 0.125, x + 0.125, 0.5, z + 0.125, pick(rockC, bx, 3, bz)); });
    // cover: rocks, straw bales along the south wall, a log and a trough on the east side
    lump(-505.5, -100.0, -504.0, -98.75, 1.25, rockC); lump(-510.25, -98.25, -508.75, -97.0, 1.25, rockC); lump(-502.0, -105.0, -500.5, -104.0, 1.0, rockC);
    for (const bx of [-503, -507, -510.5]) F(bx, 0.25, -91.25, bx + 1.5, 1.25, -90.5, bale);
    F(-497.0, 0.25, -97.5, -496.5, 0.75, -93.0, bark);
    F(-497.25, 0.25, -104.75, -496.25, 0.75, -103.0, steel); F(-497.0, 0.5, -104.5, -496.5, 0.75, -103.25, water);
    // heat lamp over Brutus's bed, a blue keeper's lamp by the door
    F(-506.25, 4.25, -96.25, -504.75, 4.5, -94.75, iron); F(-506.0, 4.0, -96.0, -505.0, 4.25, -95.0, heat);
    F(-498.0, 3.25, -91.0, -497.75, 3.5, -90.75, cool);
    light({ x: -505.5, y: 3.8, z: -95.5, color: 0xff7a3a, intensity: 0.55, range: 8, kind: 'interior' });
    light({ x: -498.0, y: 3.2, z: -91.2, color: 0x9fb4ff, intensity: 0.3, range: 6, kind: 'interior' });
    // THE BACK CAVE (NW corner): rock walls + low ceiling, entrance from the east; the iron hatch in its floor
    const caveAt = (x, y, z) => pick(caveC, x >> 1, y >> 1, z >> 1);
    fillF(-514.25, 0.25, -99.0, -507.5, 4.75, -98.5, caveAt);
    fillF(-508.0, 0.25, -105.25, -507.5, 4.75, -99.0, caveAt);
    fillF(-514.25, 2.75, -105.25, -507.5, 4.75, -98.5, caveAt);
    CL(-508.0, 0.25, -103.5, -507.5, 2.5, -101.0);
    fillF(-514.25, 2.5, -105.25, -508.0, 2.75, -99.0, (x, y, z) => AF.hash2(x * 5, z * 3) < 0.18 ? pick(caveC, x, y, z) : -1);
    lump(-514.25, -100.5, -513.25, -99.0, 0.75, caveC);
    F(-511.25, 2.25, -100.75, -511.0, 2.5, -100.5, iron); F(-511.25, 2.0, -100.75, -511.0, 2.25, -100.5, lantern);
    light({ x: -511.1, y: 1.9, z: -100.6, color: 0xffb060, intensity: 0.3, range: 5, kind: 'interior' });
    F(-512.5, 0, -105.0, -509.25, 0.25, -103.25, rust);                                   // the hatch's iron frame

    // ================================================================ THE BUNKER (1941 air-raid shelter No. 7; floor -4.75)
    const conc = col(0x8c887f, { jitter: 0.5, edge: 0.12 }), concF = col(0x6f6b64, { jitter: 0.5 }), concC = col(0x76736c, { jitter: 0.4 });
    const paintG = col(0x56604a, { jitter: 0.45 }), paintC = col(0xbdb49a, { jitter: 0.45 }), stain = col(0x8a7a5a, { jitter: 0.6 });
    const twoTone = (x, y, z) => { const wy = W.yOf(y); return wy < -3.5 ? paintG : AF.hash2(x * 3, z * 5 + y) < 0.12 ? stain : paintC; };
    const lampA = flick(0xffe2a8, 0xffd27a, 2.4), lampB = flick(0xffe2a9, 0xffd27b, 2.4), lampS = flick(0xe8f0c0, 0xd8e8a0, 2.0);
    FX.lamps.push(lampA, lampB, lampS);
    const lampSteady = glow(0xe8f0c1, 1.8);
    // stair shaft under the cave: flight A (west, from the hatch) -> landing -> flight B (east), a wall between the flights
    room(-513.5, -4.75, -104.75, -509.5, -0.25, -102.0, conc, concF, null);
    CL(HATCH.x0, -0.25, HATCH.z0, HATCH.x1, 0.25, HATCH.z1);
    for (let k = 1; k <= 10; k++) F(-509.5 - 0.25 * k, -4.75, -104.75, -509.25 - 0.25 * k, 0.25 - 0.25 * k, -103.5, concF);
    F(-513.5, -4.75, -104.75, -512.0, -2.25, -102.0, concF);
    for (let j = 1; j <= 10; j++) F(-512.0 + 0.25 * (j - 1), -4.75, -103.25, -512.0 + 0.25 * j, -2.25 - 0.25 * j, -102.0, concF);
    F(-512.0, -4.75, -103.5, -509.5, -0.25, -103.25, conc);
    F(-513.5, -1.0, -103.5, -513.25, -0.75, -103.25, lampA.i);
    // corridor + blast door
    room(-509.25, -4.75, -103.5, -506.0, -2.25, -101.75, conc, concF, concC);
    CL(-509.5, -4.75, -103.25, -509.25, -2.25, -102.0);
    F(-507.75, -2.5, -102.75, -507.5, -2.25, -102.5, lampB.i);
    // barracks + map room (two-tone wartime paint)
    room(-505.5, -4.75, -105.0, -497.0, -1.75, -97.75, twoTone, concF, concC);
    room(-505.5, -4.75, -97.5, -497.0, -1.75, -91.0, twoTone, concF, concC);
    F(-506.0, -4.75, -104.0, -505.5, -2.0, -101.25, steelD); CL(-506.0, -4.75, -103.25, -505.5, -2.5, -102.0);
    F(-505.5, -4.75, -104.75, -505.0, -2.5, -103.5, steelD);                               // blast door leaf, swung open
    CL(-502.0, -4.75, -97.75, -500.75, -2.5, -97.5);                                       // barracks -> map room
    // exit corridor east, four steps down to the storm drain (the drain's columns are sunk first)
    sink(-495.5, -101.25, -493.25, -99.25, -6.0, soil);
    sink(-493.25, -101.75, -486.75, -16.0, -7.0, soil);
    room(-496.75, -5.75, -101.0, -493.25, -2.5, -99.5, conc, concF, concC);
    CL(-497.0, -4.75, -101.0, -496.75, -2.5, -99.5);
    F(-496.75, -5.75, -101.0, -495.75, -4.75, -99.5, concF);
    for (let k = 0; k < 3; k++) F(-495.75 + k * 0.25, -5.75, -101.0, -495.5 + k * 0.25, -5.0 - k * 0.25, -99.5, concF);
    // bunks, table + chairs, stove, lockers, crates
    const mattress = col(0x7a7a5a, { jitter: 0.4 }), blanket = col(0x5a6040, { jitter: 0.4 }), wood = col(0x7a5a3a, { jitter: 0.4 }), oldLocker = col(0x5f6a5a, { metal: 0.4, rough: 0.6, jitter: 0.5 });
    for (const bx of [-505.0, -502.25, -499.5]) {
      for (const [px, pz] of [[0, -105.0], [1.75, -105.0], [0, -104.25], [1.75, -104.25]]) F(bx + px, -4.75, pz, bx + px + 0.25, -2.25, pz + 0.25, iron);
      F(bx, -4.25, -105.0, bx + 2.0, -4.0, -104.0, mattress); F(bx, -3.0, -105.0, bx + 2.0, -2.75, -104.0, blanket);
      F(bx + 0.25, -4.0, -105.0, bx + 0.75, -3.75, -104.25, cream);
    }
    F(-502.5, -4.25, -101.5, -500.0, -4.0, -100.25, wood);
    for (const [lx, lz] of [[-502.5, -101.5], [-500.25, -101.5], [-502.5, -100.5], [-500.25, -100.5]]) F(lx, -4.75, lz, lx + 0.25, -4.25, lz + 0.25, wood);
    for (const [cx, cz, bz] of [[-502.0, -102.25, -102.25], [-500.75, -102.25, -102.25], [-501.5, -99.75, -99.5]]) { F(cx, -4.75, cz, cx + 0.5, -4.25, cz + 0.5, wood); F(cx, -4.25, bz, cx + 0.5, -3.75, bz + 0.25, wood); }
    F(-505.25, -4.75, -99.75, -504.5, -4.0, -99.0, iron); F(-505.0, -4.0, -99.5, -504.75, -1.75, -99.25, iron); F(-505.0, -4.5, -99.0, -504.75, -4.25, -98.75, glow(0xff5a1a, 1.2));
    F(-505.5, -4.75, -101.0, -505.0, -2.75, -100.0, oldLocker);
    F(-498.5, -4.75, -104.0, -497.0, -4.0, -102.75, crate); F(-498.25, -4.0, -103.75, -497.25, -3.25, -103.0, crateD); F(-498.0, -4.75, -92.0, -497.25, -4.25, -91.25, rust);
    F(-503.25, -2.0, -101.75, -503.0, -1.75, -101.5, lampA.i); F(-499.25, -2.0, -101.75, -499.0, -1.75, -101.5, lampB.i);
    // map room: map table, wall map, radio desk
    F(-503.0, -4.25, -95.25, -499.5, -4.0, -93.25, wood);
    for (const [lx, lz] of [[-503.0, -95.25], [-499.75, -95.25], [-503.0, -93.5], [-499.75, -93.5]]) F(lx, -4.75, lz, lx + 0.25, -4.25, lz + 0.25, wood);
    F(-505.5, -4.75, -96.5, -504.5, -4.0, -94.5, wood); F(-505.5, -4.0, -96.25, -505.0, -3.5, -95.25, col(0x4a4a3a, { metal: 0.3 }));
    F(-505.0, -3.75, -96.0, -504.75, -3.5, -95.75, glow(0xffb040, 1.4)); F(-505.0, -3.75, -95.5, -504.75, -3.5, -95.25, glow(0x60ff80, 1.0));
    for (const [cx, cz] of [[-504.25, -95.75], [-501.5, -92.75], [-498.75, -94.5]]) F(cx, -4.75, cz, cx + 0.5, -4.25, cz + 0.5, wood);
    F(-501.5, -2.0, -94.25, -501.25, -1.75, -94.0, lampA.i);
    {
      const sea = AF.col(0x3a6a8a, { jitter: 0.1, edge: 0 }), land = AF.col(0x8a9a5a, { jitter: 0.15, edge: 0 }), sand = AF.col(0xd8c890, { jitter: 0.1, edge: 0 }), ink = AF.col(0x2a2a2a, { jitter: 0, edge: 0 }), pin = AF.col(0xc0281e, { jitter: 0, edge: 0 }), paper = AF.col(0xe8dcb8, { jitter: 0.05, edge: 0 });
      const coast = (x) => 18 + Math.sin(x * 0.21) * 3 + Math.sin(x * 0.07 + 1) * 4;
      const mt = new AF.Model(56, 1, 32);
      for (let x = 0; x < 56; x++) for (let z = 0; z < 32; z++) { const cz = coast(x), cl = z < cz - 1 ? land : z < cz ? sand : sea; m2set(mt, x, 0, z, (x % 8 === 0 || z % 8 === 0) && cl === sea ? ink : cl); }
      for (const [px, pz] of [[12, 10], [30, 14], [44, 9], [20, 26]]) m2set(mt, px, 0, pz, pin);
      prop(mt, -501.25, -3.99, -94.25, 0);
      const wm = new AF.Model(64, 32, 1);
      wm.box(0, 0, 0, 64, 32, 1, paper);
      for (let x = 2; x < 62; x++) for (let y = 2; y < 30; y++) { const cy = 14 + Math.sin(x * 0.18) * 4; wm.set(x, y, 0, y > cy ? land : y > cy - 1 ? sand : (x % 10 === 2 || y % 10 === 2) ? ink : sea); }
      for (let k = 0; k < 12; k++) { wm.set(10 + k * 3, 6 + (k % 3), 0, pin); }
      prop(wm, -501.25, -4.0, -91.045, 2);
      function m2set(m, x, y, z, c) { m.set(x, y, z, c); }
    }
    sign('SHELTER NO 7 - 1941', 0x7a3a1a, 2.4, 0.35, -505.455, -2.55, -99.0, 1);
    sign('NO SMOKING', 0x7a3a1a, 1.8, 0.3, -497.045, -2.6, -103.0, 3);
    sign('MAP ROOM', 0x2a2a2a, 1.4, 0.25, -501.375, -2.35, -97.795, 2);
    sign('STORM DRAIN', 0x2a2a2a, 1.6, 0.25, -494.5, -2.85, -100.955, 0);
    light({ x: -501.25, y: -2.2, z: -101.5, color: 0xffd08a, intensity: 0.6, range: 8, kind: 'interior' }, true);
    light({ x: -501.25, y: -2.2, z: -94.0, color: 0xffc880, intensity: 0.5, range: 7, kind: 'interior' }, true);
    light({ x: -511.5, y: -1.2, z: -103.4, color: 0xffd08a, intensity: 0.3, range: 5, kind: 'interior' }, true);

    // ================================================================ THE STORM DRAIN (brick, under the east walk; floor -5.75)
    const brick = col(0x6a3a2a, { pat: 'brick', patTop: 'none', jitter: 0.4 }), brickDamp = col(0x4e3226, { pat: 'brick', patTop: 'none', jitter: 0.5 });
    const slime = col(0x4a5a30, { jitter: 0.7 }), walk = col(0x7a766e, { jitter: 0.5 }), kerbG = col(0x9a968c, { jitter: 0.4 }), dark = col(0x141210, { jitter: 0.1 });
    const orange = col(0xd8661c, { rough: 0.5, jitter: 0.15 }), orangeD = col(0xb04e14, { rough: 0.5, jitter: 0.15 }), pipeC = col(0x6a4a30, { metal: 0.4, rough: 0.8, jitter: 0.5 });
    const SZ0 = -101.25, SZ1 = -16.5;
    room(-492.75, -6.75, SZ0, -487.25, -2.25, SZ1, brick, brickDamp, brick, 0.5);
    F(-492.75, -2.75, SZ0, -492.25, -2.25, SZ1, brick); F(-492.25, -2.5, SZ0, -491.75, -2.25, SZ1, brick);
    F(-487.75, -2.75, SZ0, -487.25, -2.25, SZ1, brick); F(-488.25, -2.5, SZ0, -487.75, -2.25, SZ1, brick);
    F(-492.75, -6.75, SZ0, -491.0, -5.75, SZ1, walk); F(-489.0, -6.75, SZ0, -487.25, -5.75, SZ1, walk);
    F(-491.25, -6.0, SZ0, -491.0, -5.75, SZ1, kerbG); F(-489.0, -6.0, SZ0, -488.75, -5.75, SZ1, kerbG);
    F(-491.25, -6.75, SZ0, -491.0, -6.25, SZ1, slime); F(-489.0, -6.75, SZ0, -488.75, -6.25, SZ1, slime);
    F(-491.0, -6.75, SZ0, -489.0, -6.25, SZ1, water);
    F(-493.0, -5.75, SZ0, -492.75, -5.25, SZ1, brickDamp); F(-487.25, -5.75, SZ0, -487.0, -5.25, SZ1, brickDamp);
    F(-492.75, -3.75, SZ0, -492.5, -3.5, SZ1, pipeC);                                      // old water main
    F(-487.5, -3.75, SZ0, -487.25, -3.5, -21.75, orange); F(-487.5, -3.25, SZ0, -487.25, -3.0, -21.75, orangeD);   // Kestrel fibre trunk
    for (let z = SZ0 + 2; z < -22; z += 6) { F(-487.5, -3.5, z, -487.25, -3.25, z + 0.25, iron); F(-492.75, -3.5, z + 3, -492.5, -3.25, z + 3.25, iron); }
    // grate bridges over the channel
    for (const zb of [-98.5, -59.5, -22.0]) fillF(-491.0, -6.0, zb, -489.0, -5.75, zb + 1.0, (x, y, z) => (x + z) & 1 ? iron : steelD);
    // wall lamps, side drains, the culverts at both ends
    for (const z of [-96, -84, -72, -60, -48, -36, -24]) F(-492.75, -3.25, z, -492.5, -3.0, z + 0.25, z === -60 || z === -84 ? lampS.i : lampSteady);
    for (const z of [-90, -66, -45, -31]) { CL(-493.0, -5.75, z, -492.75, -5.0, z + 0.75); F(-493.25, -5.75, z, -493.0, -5.0, z + 0.75, dark); F(-492.75, -6.0, z, -492.5, -5.75, z + 0.75, slime); }
    F(-491.0, -6.25, SZ0 - 0.5, -489.0, -5.0, SZ0, dark); for (const bx of [-490.5, -489.75]) F(bx, -6.25, SZ0, bx + 0.25, -5.0, SZ0 + 0.25, iron);
    F(-491.0, -6.25, SZ1, -489.0, -5.0, SZ1 + 0.25, dark); for (const bx of [-490.5, -489.75]) F(bx, -6.25, SZ1 - 0.25, bx + 0.25, -5.0, SZ1, iron);
    // bunker -> drain doorway, the server-room door with its frame
    CL(-493.25, -5.75, -101.0, -492.75, -3.0, -99.5);
    CL(-487.25, -5.75, -21.5, -486.5, -3.75, -20.25);
    F(-487.5, -5.75, -21.75, -487.25, -3.5, -21.5, steel); F(-487.5, -5.75, -20.25, -487.25, -3.5, -20.0, steel); F(-487.5, -3.75, -21.75, -487.25, -3.5, -20.0, steel);
    sign('STORM DRAIN 4 - WESTGATE', 0xe8dcc0, 3.2, 0.3, -492.705, -4.4, -96.0, 1);
    sign('KESTREL SYSTEMS', 0x30e0d0, 1.6, 0.3, -487.295, -3.42, -20.875, 3, 2.2);
    sign('FIBRE JUNCTION 7 - AUTHORISED ONLY', 0xe8dcc0, 2.6, 0.18, -487.295, -4.95, -23.0, 3);
    sign('EXIT TO STREET', 0xe8dcc0, 1.6, 0.25, -487.295, -4.4, -17.6, 3);
    light({ x: -490, y: -3.0, z: -95, color: 0xd8e0a8, intensity: 0.55, range: 10, kind: 'interior' }, true);
    light({ x: -490, y: -3.0, z: -58, color: 0xd8e0a8, intensity: 0.5, range: 10, kind: 'interior' }, true);
    light({ x: -490, y: -3.0, z: -26, color: 0xd8e0a8, intensity: 0.5, range: 10, kind: 'interior' }, true);

    // ================================================================ KESTREL SYSTEMS FIBRE JUNCTION 7 (server room; floor -5.75)
    sink(-486.75, -24.5, -478.5, -17.0, -6.0, soil);
    const sWall = col(0xb8bcbe, { smooth: true }), tile = col(0xb6bac0, { pat: 'none', patTop: 'tile', rough: 0.4, jitter: 0.15 }), ceilP = col(0x9a9ea2, { jitter: 0.2 });
    const rackC = col(0x1e2124, { metal: 0.5, rough: 0.5, jitter: 0.15 }), tray = col(0x5a5e62, { metal: 0.6, rough: 0.5 }), cracC = col(0xd0d2cc, { rough: 0.5 });
    room(-486.5, -5.75, -24.0, -479.0, -3.25, -17.5, sWall, tile, ceilP);
    CL(-486.75, -5.75, -21.5, -486.5, -3.75, -20.25);
    F(-486.5, -5.75, -21.75, -485.25, -3.75, -21.5, steelD);                                // door leaf, open
    F(-486.0, -5.75, -24.0, -481.0, -3.75, -23.25, rackC);                                 // rack row against the north wall
    F(-485.5, -5.75, -21.0, -481.5, -3.75, -20.25, rackC);                                 // island row
    F(-480.0, -5.75, -24.0, -479.0, -3.75, -22.0, cracC);                                   // air handler
    F(-486.5, -3.5, -22.75, -479.0, -3.25, -22.5, tray); F(-486.5, -3.25, -23.0, -479.0, -3.0, -22.75, orange);   // cable tray + fibre run
    F(-486.5, -3.5, -19.75, -479.0, -3.25, -19.5, tray);
    F(-486.5, -3.5, -21.5, -486.25, -3.25, -20.25, orange);
    for (const [px, pz] of [[-485.0, -22.25], [-482.5, -22.25], [-485.0, -19.0], [-482.5, -19.0]]) F(px, -3.25, pz, px + 1.0, -3.0, pz + 0.5, glow(0xdfeeff, 1.6));
    // desk with the terminal (spots.server)
    F(-482.25, -5.25, -18.25, -479.25, -5.0, -17.5, wood);
    for (const [lx, lz] of [[-482.25, -18.25], [-479.5, -18.25], [-482.25, -17.75], [-479.5, -17.75]]) F(lx, -5.75, lz, lx + 0.25, -5.25, lz + 0.25, iron);
    sign('KESTREL SYSTEMS', 0x30e0d0, 2.4, 0.4, -479.045, -4.2, -19.75, 3, 2.4);
    light({ x: -482.75, y: -3.6, z: -20.75, color: 0xbfe6ff, intensity: 0.6, range: 7, kind: 'interior' }, true);
    // LEDs: six palette entries that blink on their own clocks; rack fronts as 1/16 m props
    const ledHex = [[0x40ff70, 0x20ff50], [0x40ff71, 0x20ff51], [0xffb030, 0xffa010], [0xffb031, 0xffa011], [0xff4040, 0xff2020], [0x40a0ff, 0x2080ff]];
    for (const [h, e] of ledHex) FX.leds.push(flick(h, e, 3.0));
    const rackFront = (seed) => {
      const m = new AF.Model(16, 32, 1), panel = col(0x34383d, { metal: 0.4, rough: 0.5, jitter: 0.1 }), slot = col(0x111214, { jitter: 0 });
      m.box(0, 0, 0, 16, 32, 1, rackC);
      for (let u = 0; u < 7; u++) {
        const y0 = 2 + u * 4; m.box(1, y0, 0, 15, y0 + 3, 1, panel); m.box(6, y0 + 1, 0, 14, y0 + 2, 1, slot);
        for (let x = 1; x < 6; x += 2) { const r = AF.hash2(seed * 97 + u * 13, x); if (r < 0.75) m.set(x, y0 + 1, 0, FX.leds[Math.floor(r / 0.75 * 6) % 6].i); }
      }
      return AF.meshModel(m, { vs: 1 / 16, anchor: [0.5, 0, 0.5] });
    };
    const fronts = [rackFront(1), rackFront(2), rackFront(3)];
    for (let k = 0; k < 5; k++) AF.placeStatic(fronts[k % 3], -485.5 + k, -5.75, -23.25 + 0.05, 0, { collide: false });
    for (let k = 0; k < 4; k++) { AF.placeStatic(fronts[(k + 1) % 3], -485.0 + k, -5.75, -21.0 - 0.05, 2, { collide: false }); AF.placeStatic(fronts[(k + 2) % 3], -485.0 + k, -5.75, -20.25 + 0.05, 0, { collide: false }); }
    // the terminal: two green CRTs + keyboard, and the operator's chair (not solid: the player sits in it)
    {
      const scrA = AF.col(0x1a6a3a, { emit: 0x40ff90, emitK: 1.5, mode: 'always', jitter: 0, edge: 0 }), scrB = AF.col(0x2a8a50, { emit: 0x70ffb0, emitK: 1.8, mode: 'always', jitter: 0, edge: 0 });
      const beige = col(0xc8c0a8, { jitter: 0.1 }), key = col(0x3a3a36, { jitter: 0.2 });
      const crt = new AF.Model(14, 12, 8); crt.box(0, 0, 0, 14, 12, 8, beige);
      for (let x = 2; x < 12; x++) for (let y = 2; y < 10; y++) crt.set(x, y, 7, y % 2 && AF.hash2(x, y) < 0.7 ? scrB : scrA);
      const crtG = AF.meshModel(crt, { vs: 1 / 16, anchor: [0.5, 0, 0.5] });
      AF.placeStatic(crtG, -481.1, -5.0, -17.78, 2, { collide: false }); AF.placeStatic(crtG, -480.2, -5.0, -17.78, 2, { collide: false });
      const kb = new AF.Model(16, 1, 6); kb.box(0, 0, 0, 16, 1, 6, key); for (let x = 1; x < 15; x += 2) for (let z = 1; z < 5; z += 2) kb.set(x, 0, z, beige);
      prop(kb, -480.75, -4.99, -18.2, 0);
      const ch = new AF.Model(9, 16, 9), chC = col(0x2a3a4a, { jitter: 0.2 });
      ch.box(4, 0, 4, 5, 7, 5, iron); ch.box(1, 0, 1, 8, 1, 2, iron); ch.box(1, 0, 7, 8, 1, 8, iron); ch.box(0, 7, 0, 9, 8, 9, chC); ch.box(0, 8, 0, 9, 16, 1, chC);
      prop(ch, -480.75, -5.75, -19.2, 0);
    }

    // ================================================================ THE DRAIN STAIR up to Westgate Road (spots.manhole -> spots.street)
    const G = (() => { const i = W.col(-488.1, -9.5); const s = SUNK.get(i); return (s ? s.H : W.H[i]) * 0.25; })();
    const nSteps = Math.max(8, Math.round((G + 5.75) / 0.25)), zEnd = SZ1 + nSteps * 0.25;
    S.street.y = G;
    sink(-489.25, -16.0, -486.75, zEnd + 0.25, -6.25, soil);
    F(-489.25, -6.25, SZ1, -487.0, G - 0.25, zEnd + 0.25, conc);
    CL(-489.0, -6.0, SZ1, -487.25, -0.25, zEnd);
    for (let k = 1; k <= nSteps; k++) {
      const z0 = SZ1 + 0.25 * (k - 1), top = -5.75 + 0.25 * k;
      F(-489.0, -6.0, z0, -487.25, top, z0 + 0.25, concF);
      if (top > -2.75) CL(-489.0, top, z0, -487.25, G, z0 + 0.25);   // open to the sky once a head would touch the roof
    }
    const openZ = SZ1 + 0.25 * 12;
    for (let z = openZ - 0.25; z < zEnd; z += 0.75) { F(-489.25, G, z, -489.0, G + 1.0, z + 0.25, iron); F(-487.25, G, z, -487.0, G + 1.0, z + 0.25, iron); }
    F(-489.25, G + 0.75, openZ - 0.25, -489.0, G + 1.0, zEnd, iron); F(-487.25, G + 0.75, openZ - 0.25, -487.0, G + 1.0, zEnd, iron);
    F(-489.25, G, openZ - 0.25, -487.0, G + 1.0, openZ, iron); CL(-489.0, G, openZ - 0.25, -487.25, G + 0.75, openZ);
    W.eachCol(-486.75, -12.75, -485.0, -11.0, (bx, bz, i, x, z) => { if (Math.hypot(x + 485.875, z + 11.875) < 0.8) F(x - 0.125, G, z - 0.125, x + 0.125, G + 0.25, z + 0.125, iron); });
    F(-486.25, G, zEnd - 0.25, -486.0, G + 1.25, zEnd, orange); F(-486.25, G + 1.25, zEnd - 0.25, -486.0, G + 1.5, zEnd, AF.col('white'));
    CL(-489.0, -5.75, SZ1, -487.25, -2.25, SZ1 + 0.5);
    for (let k = 1; k <= 2; k++) F(-489.0, -6.0, SZ1 + 0.25 * (k - 1), -487.25, -5.75 + 0.25 * k, SZ1 + 0.25 * k, concF);
    W.tDirty = true;
    D.drainRect = { x0: -489.0, x1: -487.25, z0: openZ, z1: zEnd, y: G };
    D.stats.buildMs = Math.round(performance.now() - t0);
    D.built = true;
  });
  // ---------------------------------------------------------------- the hatch lid (one small mesh near the den) + interaction
  let lid = null, lidCol = null;
  D.setHatch = (open) => {
    D.hatchOpen = !!open;
    if (lidCol) { AF.removeCollider(lidCol); lidCol = null; }
    if (!D.hatchOpen) lidCol = AF.addCollider(HATCH.x0, -0.25, HATCH.z0, HATCH.x1, 2.5, HATCH.z1, 'den-hatch');   // shut: nobody steps onto it
    if (lid) { lid.position.set((HATCH.x0 + HATCH.x1) / 2, 0.251, D.hatchOpen ? HATCH.z1 + 0.625 : (HATCH.z0 + HATCH.z1) / 2); lid.rotation.set(D.hatchOpen ? PI : 0, 0, 0); if (D.hatchOpen) lid.position.y += 0.0625; lid.updateMatrix(); lid.updateMatrixWorld(true); }
  };
  AF.onBuild('zoo-den-lid', 646, () => {
    const LW = Math.round((HATCH.x1 - HATCH.x0) * 16), m = new AF.Model(LW, 1, 20), r1 = AF.col(0x6a3a20, { metal: 0.35, rough: 0.85, jitter: 0.6 }), r2 = AF.col(0x4a2a18, { metal: 0.4, rough: 0.8, jitter: 0.5 }), rv = AF.col(0x8a6a50, { metal: 0.6, rough: 0.5, jitter: 0.2 });
    for (let x = 0; x < LW; x++) for (let z = 0; z < 20; z++) m.set(x, 0, z, (x === 0 || z === 0 || x === LW - 1 || z === 19) ? r2 : (x % 6 === 3 && (z === 2 || z === 17)) || (z % 6 === 3 && (x === 2 || x === LW - 3)) ? rv : AF.hash2(x >> 1, z >> 1) < 0.3 ? r2 : r1);
    m.box((LW >> 1) - 2, 0, 9, (LW >> 1) + 2, 1, 11, rv);
    lid = AF.modelMesh(m, { vs: 1 / 16, anchor: [0.5, 0, 0.5], cast: false }); lid.name = 'den-hatch-lid'; lid.visible = false; lid.matrixAutoUpdate = false;
    AF.scene.add(lid); D.setHatch(false);
    AF.addInteract({ x: (HATCH.x0 + HATCH.x1) / 2, y: 0.75, z: HATCH.z1 + 0.2, r: 1.7, prio: 1.1, get label() { return D.hatchOpen ? 'Close the hatch' : 'Open the old hatch'; },
      can: () => (typeof D.hatchInteract === 'function' ? D.hatchInteract() : D.hatchInteract !== false) && AF.mode === 'walk', act: () => { D.setHatch(!D.hatchOpen); snd('latch', HATCH.x0 + 1, 0.5, HATCH.z0 + 0.5, 0.8); } });
    // the storm drain's street hatch over the stair up to Westgate Road: shut + locked (a raised steel cover filling the railed
    // stairwell, rail-high so nobody climbs in or out); only the heist opens it (81 D.setDrain), for the hacker's escape
    const R = D.drainRect;
    if (R) {
      const DW = Math.round((R.x1 - R.x0) * 16), DL = Math.round((R.z1 - R.z0) * 16), DH = 16, g = new AF.Model(DW, DH, DL), st = AF.col(0x4a4e54, { metal: 0.7, rough: 0.5, jitter: 0.2 }), dk = AF.col(0x1e2024, { metal: 0.5, rough: 0.7 }), ye = AF.col(0xe8c23a, { jitter: 0.1 });
      for (let x = 0; x < DW; x++) for (let z = 0; z < DL; z++) for (let y = 0; y < DH; y++) {
        const top = y === DH - 1, rim = x < 2 || z < 2 || x >= DW - 2 || z >= DL - 2;
        g.set(x, y, z, top ? (rim ? ((((x + z) >> 2) & 1) ? ye : dk) : (x % 4 === 1 || z % 6 === 2) ? st : dk) : y >= DH - 3 && (x === 0 || z === 0 || x === DW - 1 || z === DL - 1) ? ((((x + z + y) >> 2) & 1) ? ye : dk) : st);
      }
      drainLid = AF.modelMesh(g, { vs: 1 / 16, anchor: [0.5, 0, 0], cast: false }); drainLid.name = 'den-drain-lid'; drainLid.visible = false; drainLid.matrixAutoUpdate = false;
      drainLid.position.set((R.x0 + R.x1) / 2, R.y, R.z0); drainLid.updateMatrix(); drainLid.updateMatrixWorld(true);
      AF.scene.add(drainLid); D.setDrain(false);
    }
  });
  let drainLid = null, drainCol = null;
  D.drainOpen = false;
  D.setDrain = (open) => {
    const R = D.drainRect; if (!R) return;
    open = !!open; if (open === D.drainOpen && (open || drainCol)) return;
    D.drainOpen = open;
    if (drainCol) { AF.removeCollider(drainCol); drainCol = null; }
    if (!open) drainCol = AF.addCollider(R.x0, R.y - 0.25, R.z0, R.x1, R.y + 1, R.z1, 'den-drain');
    if (AF.ready && !AF.TEST) snd('latch', (R.x0 + R.x1) / 2, R.y + 0.3, (R.z0 + R.z1) / 2, 0.9);
  };
  const snd = (id, x, y, z, vol = 1, rate) => { if (AF.audio && AF.audio.play) AF.audio.play(id, { x, y, z, vol, rate }); };

  // ---------------------------------------------------------------- lions: shared InstancedMeshes (body, head, maned head, leg, tail)
  const M = {};
  const lionGeos = () => {
    const c = (hex, o) => AF.col(hex, Object.assign({ jitter: 0.45, edge: 0.12 }, o || {}));
    const C = { fur: c(0xc8954a), furD: c(0xa87a38), furL: c(0xe0c088), mane: c(0x6a3a16, { jitter: 0.6 }), maneL: c(0x8a5222, { jitter: 0.6 }), nose: c(0x3a2420, { jitter: 0.1 }),
      eye: AF.col(0xd8b030, { emit: 0x9a7a10, emitK: 0.7, mode: 'night', jitter: 0, edge: 0 }), tuft: c(0x3a2412, { jitter: 0.4 }), mouth: c(0x2a1610, { jitter: 0.1 }) };
    const body = new AF.Model(14, 12, 30);
    for (let x = 0; x < 14; x++) for (let y = 0; y < 12; y++) for (let z = 0; z < 30; z++) {
      const u = (x + 0.5) / 14 - 0.5, v = (y + 0.5) / 12 - 0.5, t = (z + 0.5) / 30 - 0.5, w = t > 0.1 ? 0.5 : 0.5 * (0.9 + t);
      if ((u / w) ** 2 + ((v - (t > 0.15 ? 0.03 : 0)) / 0.5) ** 2 + (t / 0.5) ** 6 <= 1) body.set(x, y, z, v < -0.22 ? C.furL : v > 0.3 ? C.furD : C.fur);
    }
    const head = (mane) => {
      const ox = mane ? 4 : 0, oy = mane ? 4 : 0, oz = mane ? 1 : 0, m = new AF.Model(10 + ox * 2, 11 + oy * 2, 12 + oz);
      if (mane) for (let x = 0; x < m.w; x++) for (let y = 0; y < m.h; y++) for (let z = 0; z < 9; z++) {
        const d = ((x - (m.w - 1) / 2) / (m.w / 2)) ** 2 + ((y - (oy + 5)) / (m.h / 2)) ** 2;
        if (d <= 1 && z <= 6 + (1 - d) * 3) m.set(x, y, z, AF.hash2(x * 3 + z, y) < 0.5 ? C.mane : C.maneL);
      }
      for (let x = 0; x < 10; x++) for (let y = 0; y < 10; y++) for (let z = 0; z < 12; z++) {
        const u = (x + 0.5) / 10, v = (y + 0.5) / 10, t = (z + 0.5) / 12;
        const skull = ((u - 0.5) / 0.5) ** 2 + ((v - 0.6) / 0.42) ** 2 + ((t - 0.38) / 0.4) ** 2 <= 1;
        const muzzle = t > 0.55 && t < 0.98 && Math.abs(u - 0.5) < 0.28 && v > 0.12 && v < 0.55;
        if (skull || muzzle) m.set(x + ox, y + oy, z + oz, muzzle && v < 0.3 ? C.furL : C.fur);
      }
      m.box(ox + 4, oy + 4, oz + 11, ox + 6, oy + 6, oz + 12, C.nose); m.box(ox + 4, oy + 1, oz + 11, ox + 6, oy + 2, oz + 12, C.mouth);
      for (const ex of [2, 7]) { let z = 11; while (z > 0 && !m.get(ex + ox, oy + 6, z + oz)) z--; m.set(ex + ox, oy + 6, z + oz, C.eye); }
      if (!mane) { m.box(1, 10, 3, 3, 11, 5, C.furD); m.box(7, 10, 3, 9, 11, 5, C.furD); }
      return AF.meshModel(m, { vs: 1 / 16, anchor: [(5 + ox) / m.w, (2.5 + oy) / m.h, (1.8 + oz) / m.d] });
    };
    const leg = new AF.Model(4, 10, 5);
    for (let y = 0; y < 10; y++) for (let x = 0; x < 4; x++) for (let z = 0; z < 4; z++) if (y > 1 || z < 5) leg.set(x, y, z, y < 2 ? C.furL : C.fur);
    leg.box(0, 0, 4, 4, 2, 5, C.furL);
    const tail = new AF.Model(3, 3, 15); tail.box(1, 1, 3, 2, 2, 15, C.fur); tail.box(0, 0, 0, 3, 3, 3, C.tuft);
    return { body: AF.meshModel(body, { vs: 1 / 16, anchor: [0.5, 0, 0.5] }), headF: head(false), headM: head(true),
      leg: AF.meshModel(leg, { vs: 1 / 16, anchor: [0.5, 1, 0.4] }), tail: AF.meshModel(tail, { vs: 1 / 16, anchor: [0.5, 0.5, 1] }) };
  };
  const mk = (geo, cap, name) => {
    const m = new THREE.InstancedMesh(geo, AF.mat.voxelInst, cap); m.name = 'den-lion-' + name; m.count = cap; m.frustumCulled = false; m.castShadow = false; m.receiveShadow = true;
    m.customDepthMaterial = AF.mat.depthInst; m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); m.visible = false; m.matrixAutoUpdate = false; AF.scene.add(m); return m;
  };
  const mR = new THREE.Matrix4(), mL = new THREE.Matrix4(), mO = new THREE.Matrix4(), V = new THREE.Vector3(), Q = new THREE.Quaternion(), E = new THREE.Euler(0, 0, 0, 'YXZ'), SC = new THREE.Vector3();
  const put = (mesh, idx, ox, oy, oz, pitch, yaw, sy) => { E.set(pitch, yaw, 0); Q.setFromEuler(E); V.set(ox, oy, oz); SC.set(1, sy, 1); mL.compose(V, Q, SC); mO.multiplyMatrices(mR, mL); mesh.setMatrixAt(idx, mO); };
  const newLion = (B, i) => {
    const bx = (B.x0 + B.x1) / 2, bz = (B.z0 + B.z1) / 2;
    return { i, name: B.name, male: B.male, s: B.s, fi: B.male ? 0 : i - 1, bed: { x: bx, y: 0.75, z: bz, yaw: B.yaw },
      x: bx, y: 0.75, z: bz, yaw: B.yaw, st: 'sleep', state: 'sleeping', level: 0, t: 0, tx: bx, tz: bz, lostT: 0, cd: 0, hit: false, roared: false, flinch: 0,
      doze: 0, dozeCd: 6 + i * 7, snoreT: 2 + i * 2.5, los: false, losT: i * 0.033, blockT: 0, blockDir: 1, wakeIn: 0, marked: false, ph: i,
      b: { x: bx, y: 0.75, z: bz, vy: 0, r: 0.45, h: 1.0, onGround: true },
      P: { by: 0.03, hp: 0.45, hy: 0, legF: -1.45, legB: -1.35, spread: 0.2, sw: 0, lift: 0, bsy: 0.85, tp: -1.1, bp: 0 } };
  };
  const placeLion = (L) => { const B = L.bed; L.x = L.b.x = B.x; L.z = L.b.z = B.z; L.y = L.b.y = B.y; L.b.vy = 0; L.yaw = B.yaw; };
  D.lions = BEDS.map(newLion);
  AF.onBuild('zoo-den-lions', 647, () => {
    const G = lionGeos();
    M.body = mk(G.body, 3, 'body'); M.headF = mk(G.headF, 2, 'headF'); M.headM = mk(G.headM, 1, 'headM'); M.leg = mk(G.leg, 12, 'leg'); M.tail = mk(G.tail, 3, 'tail');
    M.list = [M.body, M.headF, M.headM, M.leg, M.tail];
    for (const L of D.lions) writeLion(L, 0);
  });
  // compile the instanced lion program variants and the lid ahead (they stay hidden otherwise)
  AF.on('preloaded', () => {
    if (!AF.stream || !AF.stream.compileAhead) return;
    for (const m of (M.list || []).concat(lid ? [lid] : [])) { const v = m.visible; m.visible = true; try { AF.stream.compileAhead(m); } finally { m.visible = v; } }
  });
  const ease = (a, b, k) => a + (b - a) * k;
  function writeLion(L, t) {
    const P = L.P, s = L.s; E.set(0, L.yaw, 0); Q.setFromEuler(E); V.set(L.x, L.y, L.z); SC.set(s, s, s); mR.compose(V, Q, SC);
    const breathe = (L.st === 'sleep' ? 0.035 : 0.015) * Math.sin(t * 1.7 + L.i * 2);
    put(M.body, L.i, 0, P.by, 0, P.bp, 0, P.bsy * (1 + breathe));
    const fl = L.flinch > 0 ? L.flinch : 0;
    put(L.male ? M.headM : M.headF, L.male ? 0 : L.fi, 0, P.by + 0.55 * P.bsy + 0.08, 0.86, P.hp - fl * 1.2, P.hy + Math.sin(t * 31) * fl * 0.3, 1);
    for (let k = 0; k < 4; k++) {
      const front = k < 2, side = k & 1 ? 1 : -1;
      let a = (front ? P.legF : P.legB) + Math.sin(L.ph + (front ? 0 : PI) + (side > 0 ? PI : 0)) * P.sw;
      if (front && side > 0) a -= P.lift * 1.9;
      put(M.leg, L.i * 4 + k, side * (front ? 0.26 : 0.26 + P.spread), P.by + 0.12, front ? 0.62 : -0.6, a, 0, 1);
    }
    put(M.tail, L.i, 0, P.by + 0.6 * P.bsy, -0.9, P.tp, Math.sin(t * 1.3 + L.i) * (L.st === 'sleep' ? 0.15 : 0.45), 1);
  }
  // pose targets per state, eased each frame
  const pose = (L, dt, t) => {
    const P = L.P, lying = L.st === 'sleep' || L.st === 'stir' || L.st === 'lie', k = Math.min(1, dt * (lying ? 3 : 7));
    const moving = L.st === 'chase' || L.st === 'prowl' || L.st === 'return', run = L.st === 'chase' && L.lostT === 0;
    P.by = ease(P.by, lying ? 0.03 : 0.52, k); P.bsy = ease(P.bsy, lying ? 0.85 : 1, k);
    P.legF = ease(P.legF, lying ? -1.45 : 0, k); P.legB = ease(P.legB, lying ? -1.35 : 0, k); P.spread = ease(P.spread, lying ? 0.2 : 0, k);
    P.sw = ease(P.sw, moving ? (run ? 0.85 : 0.45) : 0, Math.min(1, dt * 6));
    if (moving) L.ph += dt * (run ? 13 : 6);
    P.lift = ease(P.lift, L.st === 'swipe' && L.t < 0.55 ? 1 : 0, Math.min(1, dt * 14));
    P.bp = ease(P.bp, L.st === 'swipe' ? -0.12 : L.st === 'roar' ? -0.1 : run ? 0.06 : 0, k);
    const look = L.st === 'stir' || L.doze > 0 || L.st === 'roar' || !lying;
    let hy = 0;
    if (L.st === 'stir' || (!lying && L.st !== 'return')) hy = Math.max(-1.1, Math.min(1.1, AF.angDiff(L.yaw, Math.atan2(L.tx - L.x, L.tz - L.z))));
    else if (L.doze > 0) hy = Math.sin(t * 0.9 + L.i) * 0.8;
    if (moving) hy *= 0.3;
    P.hy = ease(P.hy, hy, Math.min(1, dt * 4));
    P.hp = ease(P.hp, L.st === 'roar' ? -0.55 : L.st === 'sleep' && L.doze <= 0 ? 0.45 : look ? -0.12 : 0.2, Math.min(1, dt * 4));
    P.tp = ease(P.tp, lying ? -1.25 : moving ? -0.4 : -0.9, k);
    if (L.flinch > 0) L.flinch -= dt;
  };
  // ---------------------------------------------------------------- lion behaviour (local; only while active and near)
  const HEAR = 15, SIGHT = 6, RUN = 7.2, LOST = 40, AWAKE = new Set(['rise', 'roar', 'chase', 'swipe', 'prowl', 'return', 'lie']);
  const PL0 = { x: 0, y: 0, z: 0, eye: 1.55, noise: 0, crouch: false, inDen: false, alive: false, px: 0, pz: 0 };
  const inDen = (x, y, z) => x > BOX.x0 && x < BOX.x1 && z > BOX.z0 && z < BOX.z1 && y > -0.6 && y < 4.5;
  const allowed = (x, z) => x > BOX.x0 + 0.45 && x < BOX.x1 - 0.45 && z > BOX.z0 + 0.45 && z < BOX.z1 - 0.45
    && !(x > HATCH.x0 - 0.6 && x < HATCH.x1 + 0.6 && z > HATCH.z0 - 0.6 && z < HATCH.z1 + 0.6);
  const losClear = (ax, ay, az, bx, by, bz) => {
    const dx = bx - ax, dy = by - ay, dz = bz - az, d = Math.hypot(dx, dy, dz); if (d < 0.8) return true;
    for (let s = 0.45; s < d - 0.35; s += 0.35) if (AF.solidAt(ax + dx * s / d, ay + dy * s / d, az + dz * s / d)) return false;
    return true;
  };
  const eyeOf = (L, out) => { const s = L.s, f = 1.05 * s; out.x = L.x + Math.sin(L.yaw) * f; out.z = L.z + Math.cos(L.yaw) * f; out.y = L.y + (L.P.by + 0.7) * s; return out; };
  const EYE = { x: 0, y: 0, z: 0 };
  const exposeState = (L) => { L.state = L.st === 'sleep' ? 'sleeping' : L.st === 'stir' ? 'stirring' : L.st === 'return' || L.st === 'lie' ? 'returning' : 'awake'; };
  const wake = (L, delay) => {
    if (AWAKE.has(L.st) && L.st !== 'return' && L.st !== 'lie') return;
    if (delay) { L.wakeIn = delay; return; }
    L.st = 'rise'; L.t = 0.6; L.level = 1; L.lostT = 0; L.calm = 0; L.b.x = L.x; L.b.y = L.y; L.b.z = L.z; L.b.vy = 0; L.doze = 0; L.wakeIn = 0;
    if (!D._woke) { D._woke = true; if (typeof D.onWake === 'function') { try { D.onWake(L); } catch (e) { AF.warnOnce && AF.warnOnce('den onWake', e); } } }
  };
  const roar = (L) => {
    snd('an_lion', L.x, L.y + 1, L.z, 1, 0.9);
    if (AF.camfx && AF.camfx.shake && Math.hypot(PL0.x - L.x, PL0.z - L.z) < 14) AF.camfx.shake(0.02, 0.6);
    for (const o of D.lions) if (o !== L) { o.tx = L.tx; o.tz = L.tz; if (!AWAKE.has(o.st) || o.st === 'return' || o.st === 'lie') wake(o, 0.5 + o.i * 0.45); }
  };
  const flinchLion = (L, fx, fz) => {
    L.flinch = 0.5; L.level = 1.2; L.tx = PL0.x; L.tz = PL0.z; L.lostT = 0;
    if (AWAKE.has(L.st) && L.st !== 'return' && L.st !== 'lie') { if (L.st !== 'roar') snd('an_lion', L.x, L.y + 1, L.z, 0.9, 1.05); if (L.st === 'prowl') L.st = 'chase'; }
    else wake(L);
  };
  const hurtPlayer = (L) => {
    const p = AF.player, dx = p.x - L.x, dz = p.z - L.z, d = Math.hypot(dx, dz) || 1;
    D.hits++;
    if (AF.health && AF.health.hurt) AF.health.hurt(D.dmg, 'lion');
    if (AF.PL && AF.PL.push) AF.PL.push(dx / d * 7.5, dz / d * 7.5, 3.5);
    if (AF.camfx && AF.camfx.shake) AF.camfx.shake(0.05, 0.4);
    snd('punch', p.x, p.y + 1, p.z, 1); snd('an_lion', L.x, L.y + 1, L.z, 0.6, 1.25);
  };
  // the back cave has one doorway (east side): crossing in or out, head for the doorway on your own side first
  const inCave = (x, z) => x < -507.5 && z < -98.5;
  const NAV = { x: 0, z: 0 };
  const nav = (L, tx, tz) => {
    NAV.x = tx; NAV.z = tz;
    if (inCave(L.x, L.z) !== inCave(tx, tz) && !(L.x > -509.3 && L.x < -506.3 && Math.abs(L.z + 102.25) < 1.0)) { NAV.x = inCave(L.x, L.z) ? -509.0 : -506.6; NAV.z = -102.25; }
    return NAV;
  };
  const stepTo = (L, tx0, tz0, speed, dt) => {
    const d0 = Math.hypot(tx0 - L.x, tz0 - L.z), nv = nav(L, tx0, tz0), tx = nv.x, tz = nv.z;
    const dx = tx - L.x, dz = tz - L.z, d = Math.hypot(dx, dz);
    let ang = Math.atan2(dx, dz);
    if (L.blockT > 0) { ang += L.blockDir * 1.2; L.blockT -= dt; }
    L.yaw += AF.angDiff(L.yaw, ang) * Math.min(1, dt * 7);
    const align = Math.cos(AF.angDiff(L.yaw, ang)), mv = d < 0.05 ? 0 : Math.min(d, speed * dt) * Math.max(0.15, align);
    let nx = Math.sin(L.yaw) * mv, nz = Math.cos(L.yaw) * mv;
    if (mv && !allowed(L.b.x + nx, L.b.z + nz)) { nx = 0; nz = 0; if (L.blockT <= 0) { L.blockT = 0.5; L.blockDir = -L.blockDir; } }
    AF.moveBody(L.b, nx, nz, dt, { step: 0.55 });
    if (L.b.hitWall && L.blockT <= 0) { L.blockT = 0.45; L.blockDir = AF.hash2(L.i, (L.ph * 10) | 0) < 0.5 ? 1 : -1; }
    L.x = L.b.x; L.y = L.b.y; L.z = L.b.z;
    return d0;
  };
  const face = (L, x, z, dt) => { L.yaw += AF.angDiff(L.yaw, Math.atan2(x - L.x, z - L.z)) * Math.min(1, dt * 8); };
  const settle = (L, dt) => { AF.moveBody(L.b, 0, 0, dt, { step: 0.55 }); L.x = L.b.x; L.y = L.b.y; L.z = L.b.z; };
  const think = (L, dt) => {
    const P = PL0, dx = P.x - L.x, dz = P.z - L.z, d = Math.hypot(dx, dz, (P.y - L.y) * 0.6);
    const awake = AWAKE.has(L.st), lying = L.st === 'sleep' || L.st === 'stir';
    if (L.wakeIn > 0 && (L.wakeIn -= dt) <= 0) wake(L);
    // dozing: every so often a sleeping lion lifts its head and looks round (eyes open)
    if (L.st === 'sleep') { if (L.doze > 0) L.doze -= dt; else if ((L.dozeCd -= dt) <= 0) { L.doze = 3.5 + L.i * 0.5; L.dozeCd = 16 + AF.hash2(L.i, (AF.clock.t * 3) | 0) * 14; } }
    const eyes = L.st !== 'sleep' || L.doze > 0;
    if ((L.losT -= dt) <= 0) { L.losT = 0.1; L.los = P.alive && (eyes ? d < (awake ? 18 : SIGHT + 1) : false) && losClear(eyeOf(L, EYE).x, EYE.y, EYE.z, P.x, P.y + P.eye * 0.9, P.z); }
    if (lying) {
      let gain = 0;
      if (L.calm > 0) L.calm -= dt;
      else if (P.alive) {
        const R = P.noise * HEAR * (P.inDen ? 1 : 0.35);
        if (R > 0.3 && d < R) { gain += (1 - d / R) * (L.st === 'sleep' ? 2.6 : 3.2); L.tx = P.x; L.tz = P.z; }
        if (eyes && L.los) {
          const range = SIGHT * (P.crouch ? 0.65 : 1), a = Math.abs(AF.angDiff(L.yaw + L.P.hy, Math.atan2(dx, dz)));
          if (d < range && a < 1.05) { gain += (1.25 - d / range) * 2.2 * (P.crouch ? 0.6 : 1); L.tx = P.x; L.tz = P.z; }
        }
      }
      if (gain > 0) L.level = Math.min(1.2, L.level + gain * dt); else L.level = Math.max(0, L.level - (L.st === 'sleep' ? 0.1 : 0.05) * dt);
      if (L.level >= 1) wake(L);
      else if (L.st === 'sleep' && L.level >= 0.35) { L.st = 'stir'; snd('an_lion', L.x, L.y + 0.8, L.z, 0.25, 0.62); }
      else if (L.st === 'stir' && L.level < 0.2) L.st = 'sleep';
      if (L.st === 'sleep' && d < 14 && (L.snoreT -= dt) <= 0) { L.snoreT = 7 + AF.hash2(L.i, (AF.clock.t | 0)) * 5; snd('an_lion', L.x, L.y + 0.6, L.z, 0.1, 0.45); }
      return;
    }
    // awake: hunt the player inside the den; give up when they leave it (~6 s) or stay hidden and quiet for LOST s
    if (L.calm > 0) L.calm -= dt;
    const seen = !(L.calm > 0) && P.alive && P.inDen && L.los, heard = !(L.calm > 0) && P.alive && P.inDen && P.noise * HEAR * 1.3 > d;
    if (seen || heard) { L.lostT = 0; L.tx = P.x; L.tz = P.z; L.level = 1; } else L.lostT += dt * (P.inDen && P.alive ? 1 : 6);
    if ((L.st === 'prowl' || L.st === 'return') && L.lostT === 0 && P.inDen) L.st = 'chase';
    if (L.st !== 'return' && L.st !== 'lie' && L.lostT > LOST) { L.st = 'return'; L.level = 0.6; L.t = 0; }
    if (!P.alive && L.st !== 'return' && L.st !== 'lie') { L.st = 'return'; L.level = 0.6; L.t = 0; }
    switch (L.st) {
      case 'rise': L.t -= dt; face(L, L.tx, L.tz, dt); settle(L, dt); if (L.t <= 0) { if (!L.roared) { L.roared = true; L.st = 'roar'; L.t = 1.4; roar(L); } else L.st = 'chase'; } break;
      case 'roar': L.t -= dt; face(L, L.tx, L.tz, dt); settle(L, dt); if (L.t <= 0) L.st = 'chase'; break;
      case 'chase': {
        if (L.cd > 0) L.cd -= dt;
        const td = Math.hypot(L.tx - L.x, L.tz - L.z);
        if (L.lostT === 0 && d < 1.9 && L.cd <= 0) { L.st = 'swipe'; L.t = 0; L.hit = false; settle(L, dt); }
        else if (L.lostT > 0 && td < 1.0) { L.st = 'prowl'; L.t = 2.5; }
        else stepTo(L, L.tx, L.tz, L.lostT > 0 ? 3.0 : RUN, dt);
        break;
      }
      case 'swipe': L.t += dt; face(L, P.x, P.z, dt); settle(L, dt);
        if (!L.hit && L.t >= 0.35) { L.hit = true; const a = Math.abs(AF.angDiff(L.yaw, Math.atan2(dx, dz))); if (P.alive && d < 2.4 * L.s + 0.2 && a < 1.1) hurtPlayer(L); }
        if (L.t >= 0.85) { L.st = 'chase'; L.cd = 1.1; }
        break;
      case 'prowl': L.t -= dt; if (L.t <= 0) { L.t = 2.5 + AF.hash2(L.i, (AF.clock.t * 2) | 0) * 2; L.tx = Math.max(BOX.x0 + 1, Math.min(BOX.x1 - 1, L.x + (AF.hash2(L.i * 3, (AF.clock.t * 5) | 0) - 0.5) * 8)); L.tz = Math.max(BOX.z0 + 1, Math.min(BOX.z1 - 1, L.z + (AF.hash2(L.i * 7, (AF.clock.t * 5) | 0) - 0.5) * 8)); }
        stepTo(L, L.tx, L.tz, 1.6, dt); break;
      case 'return': { const B = L.bed; if (stepTo(L, B.x, B.z, 1.8, dt) < 0.35 || (L.t += dt) > 30) { L.st = 'lie'; L.t = 1.0; L.b.x = L.x = B.x; L.b.z = L.z = B.z; } break; }
      case 'lie': L.t -= dt; L.yaw += AF.angDiff(L.yaw, L.bed.yaw) * Math.min(1, dt * 3); settle(L, dt);
        if (L.t <= 0) { L.st = 'sleep'; L.level = 0.25; L.roared = false; L.lostT = 0; L.cd = 0; L.doze = 0; L.dozeCd = 8 + L.i * 3; L.y = L.b.y = L.bed.y; if (!D.awake()) D._woke = false; }
        break;
    }
  };
  // ---------------------------------------------------------------- public API
  D.awake = () => D.lions.some((L) => AWAKE.has(L.st) && L.st !== 'return' && L.st !== 'lie');
  const clearMarks = () => { for (const L of D.lions) if (L.marked) { L.marked = false; if (AF.alertMark) AF.alertMark.clear('den-lion-' + L.i); } };
  D.reset = () => {
    for (const L of D.lions) { placeLion(L); Object.assign(L, { calm: 0, st: 'sleep', level: 0, t: 0, lostT: 0, cd: 0, roared: false, flinch: 0, doze: 0, wakeIn: 0, blockT: 0 }); Object.assign(L.P, { by: 0.03, hp: 0.45, hy: 0, legF: -1.45, legB: -1.35, spread: 0.2, sw: 0, lift: 0, bsy: 0.85, tp: -1.1, bp: 0 }); L.tx = L.x; L.tz = L.z; exposeState(L); if (M.body) writeLion(L, 0); }
    D._woke = false; clearMarks();
    if (M.list) for (const m of M.list) m.instanceMatrix.needsUpdate = true;
  };
  // calm: awake lions pad back to bed (snap if nobody is near to see it); levels drop
  D.calm = () => { if (!vis) { D.reset(); return; } for (const L of D.lions) { L.level = 0; L.wakeIn = 0; L.calm = 10; if (AWAKE.has(L.st) && L.st !== 'lie') { L.st = 'return'; L.t = 0; L.lostT = LOST + 1; } else if (L.st === 'stir') L.st = 'sleep'; } };
  D.setActive = (on) => { on = !!on; if (on === D.active) return; D.active = on; D.reset(); if (!on) showLions(false); };
  let vis = false;
  const showLions = (on) => { vis = on; if (M.list) for (const m of M.list) m.visible = on; D.stats.draws = on ? 5 : 0; if (!on) clearMarks(); };
  // gunshots (79/77 emit 'gunshot'): loud shots anywhere near the den wake the pride; a round aimed at a lion makes it flinch
  const CAMD = new THREE.Vector3();
  AF.on('gunshot', (e) => {
    if (!D.active || !vis || !e) return;
    const inside = inDen(e.x, e.y, e.z), silenced = !!e.silenced, loud = silenced ? Math.min(e.loud || 7, 7) : (e.loud || 60);
    for (const L of D.lions) {
      const d = Math.hypot(e.x - L.x, e.z - L.z), R = loud * (inside ? 1 : 0.5);
      if (d < R) { L.level = Math.min(1.2, L.level + (1 - d / R) * (silenced ? 1.3 : 3)); L.tx = e.x; L.tz = e.z; if (L.level >= 1) wake(L); else if (L.st === 'sleep' && L.level >= 0.35) L.st = 'stir'; }
    }
    if (e.remote || AF.mode !== 'walk') return;
    const p = AF.player, aim = AF.PL && AF.PL.aim;
    let ox = p.x, oy = p.y + 1.4, oz = p.z, dx = Math.sin(p.yaw), dy = 0, dz = Math.cos(p.yaw);
    if (aim && AF.camera) { AF.camera.getWorldDirection(CAMD); ox = AF.camera.position.x; oy = AF.camera.position.y; oz = AF.camera.position.z; dx = CAMD.x; dy = CAMD.y; dz = CAMD.z; }
    let best = null, bt = 50;
    for (const L of D.lions) {
      const cx = L.x - ox, cy = L.y + (L.P.by + 0.45) * L.s - oy, cz = L.z - oz, t = cx * dx + cy * dy + cz * dz; if (t < 0 || t > bt) continue;
      const qx = cx - dx * t, qy = cy - dy * t, qz = cz - dz * t, r = (aim ? 0.85 : 1.6) * L.s;
      if (qx * qx + qy * qy + qz * qz < r * r && losClear(ox, oy, oz, L.x, L.y + 0.6, L.z)) { best = L; bt = t; }
    }
    if (best) flinchLion(best);
  });
  // ---------------------------------------------------------------- tick: underground lights + blinking palette, then the lions
  let fxT = 0, underOn = false, prevSwing = 0, lastX = 0, lastZ = 0;
  const underCam = (c) => c.y < -0.75 && c.x > -516 && c.x < -476 && c.z > -107 && c.z < -8;
  const setK = (f, k) => { const e = AF.PAL.emit, i = f.i; e[i * 4] = f.base[0] * k; e[i * 4 + 1] = f.base[1] * k; e[i * 4 + 2] = f.base[2] * k; };
  AF.onTick('zoo-den', 437, (dt, t) => {
    if (!AF.ready || !D.built) return;
    const cam = AF.camera.position, under = underCam(cam);
    if (under !== underOn) { underOn = under; for (const l of lightsUnder) l.y = under ? l._y : -9999; }
    if (under && (fxT -= dt) <= 0) {
      fxT = 0.1; const ct = AF.clock.t;
      for (const f of FX.lamps) { if (f.off > 0) f.off--; else if (Math.random() < 0.04) f.off = 1 + ((Math.random() * 5) | 0); setK(f, f.off > 0 ? (f.off % 2 ? 0.12 : 0.55) : 1); }
      FX.leds.forEach((f, j) => setK(f, AF.hash2((ct * (2 + j * 0.7)) | 0, j * 31) < 0.62 ? 1 : 0.08));
      AF.PAL.dirty = true;
    }
    if (lid) { const nearLid = Math.abs(cam.x - S.hatch.x) < 45 && Math.abs(cam.z - S.hatch.z) < 45; if (lid.visible !== nearLid) lid.visible = nearLid; }
    if (drainLid) { const R = D.drainRect, nearD = !D.drainOpen && Math.abs(cam.x - R.x0) < 70 && Math.abs(cam.z - R.z0) < 70; if (drainLid.visible !== nearD) drainLid.visible = nearD; }
    if (!D.active || !M.list) return;
    const p = AF.player, nearP = Math.hypot(p.x - S.denCentre.x, p.z - S.denCentre.z) < 60, nearC = Math.hypot(cam.x - S.denCentre.x, cam.z - S.denCentre.z) < 60;
    if (!(nearP || nearC)) { if (vis) { showLions(false); if (D.awake() || D.lions.some((L) => L.level > 0)) D.reset(); } return; }
    if (!vis) showLions(true);
    D.stats.ticks++;
    const walk = AF.mode === 'walk';
    PL0.x = p.x; PL0.y = p.y; PL0.z = p.z; PL0.eye = p.eyeH || 1.55; PL0.crouch = !!p.crouch;
    PL0.alive = walk && !(AF.health && AF.health.dead);
    let n = walk ? p.noise : 0;
    if (n == null) { const sp = dt > 0 ? Math.hypot(p.x - lastX, p.z - lastZ) / dt : 0; n = sp < 0.4 ? 0 : sp > 7 ? 1 : 0.35 * Math.min(1, sp / 4); }
    lastX = p.x; lastZ = p.z;
    PL0.noise = n; PL0.inDen = inDen(p.x, p.y, p.z);
    // melee: a swing that lands on a lion only makes it flinch (lions are not peds: 77 can't hurt them)
    const sw = (AF.combat && AF.combat.swing) || 0;
    if (sw > 0 && prevSwing <= 0 && walk) { const fx = Math.sin(p.yaw), fz = Math.cos(p.yaw); for (const L of D.lions) { const dx = L.x - p.x, dz = L.z - p.z, d = Math.hypot(dx, dz); if (d < 2.4 * L.s && (dx * fx + dz * fz) / (d || 1) > 0.3) { flinchLion(L); break; } } }
    prevSwing = sw;
    for (const L of D.lions) {
      think(L, dt); pose(L, dt, t); exposeState(L); writeLion(L, t);
      if (AF.alertMark) {
        const awake = AWAKE.has(L.st) && L.st !== 'return' && L.st !== 'lie', show = awake || L.level > 0.03;
        if (show) { L.marked = true; AF.alertMark.set('den-lion-' + L.i, L.x, L.y + (L.P.by + 1.25) * L.s, L.z, awake ? 1 : Math.min(1, L.level), awake ? 2 : 1); }
        else if (L.marked) { L.marked = false; AF.alertMark.clear('den-lion-' + L.i); }
      }
    }
    for (const m of M.list) m.instanceMatrix.needsUpdate = true;
  });
  // ---------------------------------------------------------------- self-tests (?test)
  // walk a 0.3 m / 1.7 m body (the player's) along a route with the real mover: stairs, doorways and headroom all have to work
  const walkRoute = (pts) => {
    const b = { x: pts[0][0], y: pts[0][1], z: pts[0][2], vy: 0, r: 0.3, h: 1.7, onGround: true }, dt = 1 / 30;
    for (let k = 1; k < pts.length; k++) {
      const [tx, ty, tz] = pts[k]; let n = 0, best = 1e9, stuck = 0;
      for (;;) {
        const dx = tx - b.x, dz = tz - b.z, d = Math.hypot(dx, dz);
        if (d < 0.3) break;
        if (++n > 900 || !Number.isFinite(b.y) || b.y < -9) return { ok: false, at: k, info: 'stuck before ' + pts[k].join(',') + ' at ' + [b.x, b.y, b.z].map((v) => v.toFixed(2)).join(',') };
        const st = Math.min(d, 3.5 * dt); AF.moveBody(b, dx / d * st, dz / d * st, dt, { step: 0.55 });
        if (d < best - 0.01) { best = d; stuck = 0; } else if (++stuck > 150) return { ok: false, at: k, info: 'blocked before ' + pts[k].join(',') + ' at ' + [b.x, b.y, b.z].map((v) => v.toFixed(2)).join(',') };
      }
      for (let i = 0; i < 20; i++) AF.moveBody(b, 0, 0, dt, { step: 0.55 });
      if (ty != null && Math.abs(b.y - ty) > 0.3) return { ok: false, at: k, info: 'wrong level at ' + pts[k].join(',') + ': y ' + b.y.toFixed(2) };
    }
    return { ok: true, info: pts.length + ' legs' };
  };
  D.routes = {
    down: [[-497.0, 0.25, -86.5], [-498.75, 0.25, -88.5], [-498.75, 0.25, -91.6], [-503.0, 0.25, -92.2], [-508.1, 0.25, -92.2], [-508.25, 0.25, -96.4], [-507.0, 0.25, -97.75],
      [-506.6, 0.25, -102.25], [-509.0, 0.25, -102.25], [-509.1, 0.25, -104.1], [-512.9, -2.25, -104.1], [-512.9, -2.25, -102.6], [-508.75, -4.75, -102.6], [-505.75, -4.75, -102.6],
      [-503.5, -4.75, -102.6], [-499.0, -4.75, -102.6], [-498.0, -4.75, -100.25], [-494.5, -5.75, -100.25], [-491.9, -5.75, -100.25], [-491.9, -5.75, -98.0], [-488.1, -5.75, -98.0], [-488.1, -5.75, -20.9],
      [-486.0, -5.75, -20.9], [-486.0, -5.75, -19.0], [S.server.x, S.server.y, S.server.z]],
    up: [[S.server.x, S.server.y, S.server.z], [-486.0, -5.75, -19.0], [-486.0, -5.75, -20.9], [-488.1, -5.75, -20.9], [S.manhole.x, S.manhole.y, S.manhole.z], [S.street.x, null, -10.2], [S.street.x, S.street.y, S.street.z]],
  };
  AF.test('den: yard -> den -> hatch -> bunker -> drain -> server and server -> drain stair -> street are walkable', () => {
    const was = D.hatchOpen, wasDrain = D.drainOpen; D.setHatch(true); D.setDrain(true);
    try {
      const a = walkRoute(D.routes.down), b = walkRoute(D.routes.up);
      const probes = [[S.locker, 0.25], [S.denGate, 0.25], [S.bunkerIn, -4.75], [S.server, -5.75], [S.manhole, -5.75], [S.street, S.street.y]].map(([p, y]) => Math.abs(AF.surfaceBelow(p.x, p.z, p.y + 0.5, 3) - y) < 0.05);
      const head = [S.bunkerIn, S.server, S.manhole, S.sewerIn].every((p) => !AF.boxBlocked(p.x, p.y + 0.01, p.z, 0.3, 1.7));
      // shut, the street hatch seals the stairwell: the stair up is blocked, and a body walking in from the street stays at street level
      D.setDrain(false); const R = D.drainRect, wb = { x: (R.x0 + R.x1) / 2, y: R.y, z: R.z1 + 1.5, vy: 0, r: 0.3, h: 1.7, onGround: true };
      for (let i = 0; i < 60; i++) AF.moveBody(wb, 0, -3.5 / 30, 1 / 30, { step: 0.55 });
      const shut = !walkRoute(D.routes.up).ok && wb.y > R.y - 0.05 && wb.z > R.z1 - 0.1;
      return { ok: a.ok && b.ok && probes.every(Boolean) && head && shut, info: 'down ' + a.info + ' | up ' + b.info + ' | spots ' + probes.map((v) => v ? 1 : 0).join('') + ' head ' + head + ' | street hatch shut ' + shut };
    } finally { D.setHatch(was); D.setDrain(wasDrain); }
  });
  AF.test('den: hatch lid closes the shaft, surface over the drain unchanged, zoo lions kept out of the night house', () => {
    D.setHatch(false); const closed = AF.boxBlocked(-510.6, 0.26, -104.1, 0.3, 1.7) && AF.boxBlocked(-509.9, 0.26, -104.1, 0.3, 1.7);
    D.setHatch(true); const open = AF.surfaceBelow(-510.6, -104.1, 1, 6) < -0.5; D.setHatch(false);
    // the path over the drain still stands at 0.25 and is not solid above it
    let surf = 0, tot = 0; for (let z = -95; z < -20; z += 7.5) for (const x of [-492, -490, -488]) { tot++; const y = AF.surfaceBelow(x, z, 2, 4); if (Math.abs(y - 0.25) < 0.01 && !AF.solidAt(x, 0.4, z)) surf++; }
    const lions = (AF.zoo && AF.zoo.list || []).filter((an) => an.hab === 'lions');
    const out = lions.length > 0 && lions.every((an) => an.rect[3] <= -103 && an.z < -106 - 0.5);
    return { ok: closed && open && surf === tot && out, info: `lid closed ${closed} open ${open}, surface ${surf}/${tot}, zoo lions ${lions.length} out ${out}` };
  });
  AF.test('den: lions idle off the heist, wake on a loud shot when active, calm back to bed, cannot be hurt', () => {
    if (!M.list) return { ok: false, info: 'no lion meshes' };
    const offDraws = M.list.every((m) => !m.visible) && !D.active;
    // no clock stepping here (the world clock drives the crowd tests after this one): drive the pieces directly
    D.setActive(true); showLions(true);
    const shown = M.list.every((m) => m.visible);
    AF.emit('gunshot', { x: -503, y: 1.65, z: -92, loud: 60, silenced: false, weapon: 'pistol', remote: true });
    const woke = D.awake() && D.lions.every((L) => L.level >= 1);
    const killable = ['hurt', 'hp', 'dead'].some((k) => k in D.lions[0]) || (AF.walkers && AF.walkers.near ? AF.walkers.near(-505, -97, 15).some((a) => a.den) : false);
    D.calm(); D.reset(); const calm = !D.awake() && D.lions.every((L) => L.state === 'sleeping' && L.level === 0);
    D.setActive(false);
    const hidden = M.list.every((m) => !m.visible);
    return { ok: offDraws && shown && woke && !killable && calm && hidden, info: `off ${offDraws} shown ${shown} woke ${woke} killable ${killable} calm ${calm} hidden ${hidden}` };
  });
}

} catch (e) { AF.partError('46-zoo-den.js', e); }
