// ================================================================ 45-west.js
try {
// ===== 45-west: THE WEST SIDE — New Friends Colony (six friends' houses + closed neighbours, garages with their cars),
//       the colony gateway, and the shared kit (plot frames, furniture, neon) the zoo + airfield parts reuse  (OWNER: west) =====
{
  const P = AF.PLAN, W = AF.W, WS = P.west, PI = Math.PI;
  const K = AF.westKit = {};
  const cache = new Map();
  const col = K.col = (hex, o) => { const k = hex + JSON.stringify(o || {}); let c = cache.get(k); if (!c) { c = AF.col(hex, Object.assign({ jitter: 0.15, edge: 0.25 }, o || {})); cache.set(k, c); } return c; };
  const glow = K.glow = (hex, k = 2.2, mode = 'always') => col(hex, { emit: hex, emitK: k, mode, jitter: 0, edge: 0.1 });
  const smoothC = K.smooth = (hex, o) => col(hex, Object.assign({ smooth: true }, o || {}));

  // ---- a local frame on a plot: u = metres back from the lane, v = metres along the lane (from the plot's z0)
  K.frame = (pl) => {
    const s = pl.side, fx = s < 0 ? pl.x1 : pl.x0, dir = s < 0 ? -1 : 1;
    const X = (u) => fx + dir * u, Z = (v) => pl.z0 + v;
    const F = {
      s, X, Z, dir,
      rotLane: s < 0 ? 1 : 3,              // prop rotation whose +z (front) faces the lane
      rotBack: s < 0 ? 3 : 1,
      inYaw: s < 0 ? -PI / 2 : PI / 2,     // from the front door into the house
      w: (u, v) => [X(u), Z(v)],
      box: (u0, v0, u1, v1) => [Math.min(X(u0), X(u1)), Math.min(Z(v0), Z(v1)), Math.max(X(u0), X(u1)), Math.max(Z(v0), Z(v1))],
      fill(u0, y0, v0, u1, y1, v1, c) { const b = F.box(u0, v0, u1, v1); W.fill(b[0], y0, b[1], b[2], y1, b[3], c); },
      clear(u0, y0, v0, u1, y1, v1) { F.fill(u0, y0, v0, u1, y1, v1, 0); },
      paint(u0, v0, u1, v1, c) { const b = F.box(u0, v0, u1, v1); W.paint(b[0], b[1], b[2], b[3], c); },
      place(geo, u, y, v, rot, o) { const [x, z] = F.w(u, v); return AF.placeStatic(geo, x, y, z, rot, o || { collide: false }); },
    };
    return F;
  };
  // ---- neon / sign text as a prop (vs 1/16): faces +z of the model; rot turns it to face the room
  const textGeo = new Map();
  K.text = (str, hex, o = {}) => {
    const k = str + hex + JSON.stringify(o); let g = textGeo.get(k);
    if (!g) { const c = o.lit === false ? col(hex) : glow(hex, o.k || 2.8); g = AF.meshModel(AF.textModel(str, c, Object.assign({ depth: 1 }, o)), { vs: o.vs || 1 / 16, anchor: [0.5, 0, 0.5] }); textGeo.set(k, g); }
    return g;
  };
  K.model = (w, h, d, fn, vs = 1 / 16, anchor = [0.5, 0, 0.5]) => { const m = new AF.Model(w, h, d); fn(m); return AF.meshModel(m, { vs, anchor }); };

  // ---- themes (walls, trims, floors, accents) per friend; the rest of the colony picks from the pastel set
  const TH = K.themes = {
    dhruv:   { name: "Dhruv's House",   wall: 0xf1f3f6, trim: 0x2d3e57, accent: 0x3aa0ff, roof: 0x3b4658, floor: 0x9a6a3e, rug: 0x2d4a7a, sofa: 0x3d4f78, door: 0x2d3e57 },
    hunar:   { name: "Hunar's Dreamhouse", wall: 0xf7b6cf, trim: 0xffffff, accent: 0xff4fa3, roof: 0xe86aa6, floor: 0xf6d9e6, rug: 0xff7fbf, sofa: 0xff5fae, door: 0xffffff },
    tanishk: { name: "Tanishk's House", wall: 0x2e2e33, trim: 0xd4a84a, accent: 0xf7931a, roof: 0x1d1d20, floor: 0x3a3a40, rug: 0x7a5a1a, sofa: 0x202024, door: 0xd4a84a },
    diksha:  { name: "Diksha's House",  wall: 0xdcc8f0, trim: 0xfaf6ff, accent: 0x8e5ad6, roof: 0x7a4fb8, floor: 0xe8dcc8, rug: 0xc27ad6, sofa: 0xb68ae0, door: 0x7a4fb8 },
    kush:    { name: "Kush & Divyangana's House", wall: 0xeaf1e6, trim: 0x2f7a4a, accent: 0x3bbf6a, roof: 0x2a5a3a, floor: 0xa8773f, rug: 0x2f7a4a, sofa: 0x5a8a5a, door: 0x2f7a4a },
    kaybee:  { name: "Kaybee's House",  wall: 0xf3e3c3, trim: 0xb8322a, accent: 0xf2c21b, roof: 0x8a2a22, floor: 0x8a5a34, rug: 0xb8322a, sofa: 0x6a4a2a, door: 0xb8322a },
  };
  const FILLER = [
    { wall: 0xe9e2d0, trim: 0x5a6a7a, roof: 0x4a5058, door: 0x6a4028 }, { wall: 0xd9e6ec, trim: 0x2f4f6a, roof: 0x34414e, door: 0x2f4f6a },
    { wall: 0xf0e0c8, trim: 0x8a4a2a, roof: 0x7a3a2a, door: 0x8a4a2a }, { wall: 0xe4ecd8, trim: 0x4a6a3a, roof: 0x3a4a34, door: 0x4a6a3a },
    { wall: 0xf4ecda, trim: 0x6a4a6a, roof: 0x5a4a5a, door: 0x6a4a6a }, { wall: 0xe2dcd2, trim: 0x3a3a3a, roof: 0x2a2a2a, door: 0x9a3a2a },
  ];
  // which plot is whose (index = row*2 + (east side ? 1 : 0)); the rest are neighbours' closed houses
  const OWNERS = { 0: 'dhruv', 3: 'hunar', 4: 'tanishk', 5: 'diksha', 7: 'kush', 8: 'kaybee' };
  WS.homes = {};   // friend id -> { door:{x,y,z,yaw}, spawn:{x,y,z,yaw}, npc:[{x,y,z,yaw,pose}], garage:[{x,z,yaw}], box }

  // ------------------------------------------------------------ furniture kit (voxel furniture straight into the world grid)
  const FU = K.furn = {
    rug(F, u0, v0, u1, v1, hex, hex2) { const c1 = col(hex, { pat: 'none', patTop: 'carpet', rough: 1 }), c2 = col(hex2 || hex, { pat: 'none', patTop: 'carpet', rough: 1 }); F.fill(u0, 0.5, v0, u1, 0.52, v1, c1); if (hex2) F.fill(u0 + 0.5, 0.5, v0 + 0.5, u1 - 0.5, 0.53, v1 - 0.5, c2); },
    sofa(F, u0, v0, u1, v1, hex, backSide) {        // backSide: 'u0'|'u1'|'v0'|'v1' — where the backrest is
      const c = smoothC(hex), cd = smoothC(shade(hex, 0.78));
      F.fill(u0, 0.5, v0, u1, 1.0, v1, cd); F.fill(u0, 1.0, v0, u1, 1.25, v1, c);
      const t = 0.5;
      if (backSide === 'u0') F.fill(u0, 1.0, v0, u0 + t, 2.0, v1, cd); if (backSide === 'u1') F.fill(u1 - t, 1.0, v0, u1, 2.0, v1, cd);
      if (backSide === 'v0') F.fill(u0, 1.0, v0, u1, 2.0, v0 + t, cd); if (backSide === 'v1') F.fill(u0, 1.0, v1 - t, u1, 2.0, v1, cd);
      if (backSide === 'u0' || backSide === 'u1') { F.fill(u0, 1.25, v0, u1, 1.75, v0 + 0.25, cd); F.fill(u0, 1.25, v1 - 0.25, u1, 1.75, v1, cd); }
      else { F.fill(u0, 1.25, v0, u0 + 0.25, 1.75, v1, cd); F.fill(u1 - 0.25, 1.25, v0, u1, 1.75, v1, cd); }
    },
    table(F, u0, v0, u1, v1, top, h = 0.75, leg) { const t = smoothC(top), l = col(leg ?? shade(top, 0.6)); F.fill(u0, h + 0.25, v0, u1, h + 0.5, v1, t); for (const [a, b] of [[u0, v0], [u1 - 0.25, v0], [u0, v1 - 0.25], [u1 - 0.25, v1 - 0.25]]) F.fill(a, 0.5, b, a + 0.25, h + 0.25, b + 0.25, l); },
    bed(F, u0, v0, u1, v1, sheet, frame, headSide) {
      const fr = smoothC(frame), sh = smoothC(sheet), pw = smoothC(0xf6f2ea);
      F.fill(u0, 0.5, v0, u1, 1.0, v1, fr); F.fill(u0, 1.0, v0, u1, 1.25, v1, sh);
      if (headSide === 'u1') { F.fill(u1 - 0.25, 0.5, v0, u1, 2.0, v1, fr); F.fill(u1 - 1.0, 1.25, v0 + 0.25, u1 - 0.25, 1.5, v1 - 0.25, pw); }
      else { F.fill(u0, 0.5, v0, u0 + 0.25, 2.0, v1, fr); F.fill(u0 + 0.25, 1.25, v0 + 0.25, u0 + 1.0, 1.5, v1 - 0.25, pw); }
    },
    counter(F, u0, v0, u1, v1, body, top) { F.fill(u0, 0.5, v0, u1, 1.25, v1, smoothC(body)); F.fill(u0, 1.25, v0, u1, 1.5, v1, col(top ?? 0xeeeae0, { pat: 'marble', rough: 0.25 })); },
    plant(F, u, v, big) { const pot = col(0xb8643a), lf = col(0x4f8a3a, { jitter: 0.6 }), lf2 = col(0x6aa84a, { jitter: 0.6 }); F.fill(u, 0.5, v, u + 0.5, 1.0, v + 0.5, pot); const h = big ? 2.25 : 1.5; F.fill(u - 0.25, 1.0, v - 0.25, u + 0.75, h, v + 0.75, lf); F.fill(u, h, v, u + 0.5, h + 0.5, v + 0.5, lf2); },
    lamp(F, u, v, hex = 0xfff0c8) { F.fill(u, 0.5, v, u + 0.25, 2.0, v + 0.25, col(0x2a2a2a, { metal: 0.6, rough: 0.4 })); F.fill(u - 0.25, 2.0, v - 0.25, u + 0.5, 2.5, v + 0.5, glow(hex, 2, 'night')); },
    screen(F, u0, y0, v0, u1, y1, v1, hex = 0x3aa0ff) { F.fill(u0, y0, v0, u1, y1, v1, glow(hex, 0.75)); },
    shelf(F, u0, v0, u1, v1, h, wood, items) {
      const w = smoothC(wood); F.fill(u0, 0.5, v0, u1, h, v1, w);
      const inset = (u1 - u0) < (v1 - v0);
      for (let y = 1.0; y < h - 0.25; y += 0.75) {
        if (inset) F.clear(u0 + 0.25, y, v0 + 0.25, u1, y + 0.5, v1 - 0.25); else F.clear(u0 + 0.25, y, v0 + 0.25, u1 - 0.25, y + 0.5, v1);
        let k = 0; for (let t = (inset ? v0 : u0) + 0.25; t < (inset ? v1 : u1) - 0.25; t += 0.25) { const c = items[(k++ * 7 + (y * 4 | 0)) % items.length]; if (!c) continue; const hh = 0.25 + ((k * 13) % 3) * 0.125; if (inset) F.fill(u0 + 0.25, y, t, u1 - 0.25, y + hh, t + 0.25, c); else F.fill(t, y, v0 + 0.25, t + 0.25, y + hh, v1 - 0.25, c); }
      }
    },
  };
  function shade(hex, k) { const f = (s) => Math.max(0, Math.min(255, Math.round(((hex >> s) & 255) * k))); return (f(16) << 16) | (f(8) << 8) | f(0); }
  K.shade = shade;

  // ------------------------------------------------------------ one house: shell, garage, yard; interior only for the friends
  const FLOOR = 0.5, CEIL = 3.75, TOP = 7.25;
  const house = (pl, th, owner) => {
    const F = K.frame(pl);
    const wall = col(th.wall, { pat: 'stucco', rough: 0.9, jitter: 0.12 }), trim = col(th.trim, { rough: 0.5 }), roof = col(th.roof, { pat: 'none', patTop: 'tar' });
    const glass = col(0xa9c9d6, { glass: true, jitter: 0.05, edge: 0 }), frameC = col(shade(th.trim, 0.85));
    const lawn = col(0x6f9a3e, { jitter: 0.9 }), path = col(0xd8d0c0, { pat: 'none', patTop: 'slab', jitter: 0.3 }), drive = col(0x8a8680, { jitter: 0.4, pat: 'none', patTop: 'slab' });
    // yard + hedge boundary (front stays open)
    F.paint(0, 0, 50, 34, lawn);
    F.paint(0, 9.5, 8, 12.5, path); F.paint(0, 24.5, 8.25, 33, drive);
    const hedge = col(0x3f6a2e, { jitter: 0.7 });
    F.fill(8, 0.25, 0, 50, 1.25, 0.5, hedge); F.fill(8, 0.25, 33.5, 50, 1.25, 34, hedge); F.fill(49.5, 0.25, 0, 50, 1.25, 34, hedge);
    // mailbox + porch lamp post
    F.fill(1.0, 0.25, 8.0, 1.25, 1.25, 8.25, col(0x2a2a2a)); F.fill(0.75, 1.25, 7.75, 1.5, 1.75, 8.5, trim);
    // ---- house body: 16 x 21 m, two storeys, flat roof with parapet
    F.fill(8, 0.25, 3, 24, FLOOR, 24, trim);                                    // plinth / floor slab
    F.fill(8, FLOOR, 3, 24, TOP, 24, wall);                                     // solid, carved below
    F.fill(7.75, CEIL, 2.75, 24.25, CEIL + 0.25, 24.25, trim);                 // storey band
    F.fill(7.75, TOP - 0.25, 2.75, 24.25, TOP + 0.5, 24.25, trim); F.clear(8.25, TOP, 3.25, 23.75, TOP + 0.5, 23.75);   // parapet
    F.fill(8.25, TOP - 0.25, 3.25, 23.75, TOP, 23.75, roof);
    // upper storey windows: facade-only rooms (lit at night by the shader)
    for (const [v0, v1] of [[4.5, 9], [12, 16], [18.5, 22.5]]) F.fill(8, CEIL + 1, v0, 8.25, CEIL + 2.75, v1, AF.MAT.winApartment);
    for (const [u0, u1] of [[10, 14], [17, 22]]) { F.fill(u0, CEIL + 1, 3, u1, CEIL + 2.75, 3.25, AF.MAT.winApartment); F.fill(u0, CEIL + 1, 23.75, u1, CEIL + 2.75, 24, AF.MAT.winApartment); }
    // front door
    const doorV0 = 10, doorV1 = 11.75;
    F.fill(7.75, FLOOR, doorV0 - 0.5, 8, 3.25, doorV0, trim); F.fill(7.75, FLOOR, doorV1, 8, 3.25, doorV1 + 0.5, trim); F.fill(7.75, 3.0, doorV0, 8, 3.25, doorV1, trim);   // door surround
    F.fill(7.25, 3.25, doorV0 - 1.25, 8, 3.5, doorV1 + 1.25, trim);            // canopy
    const [dx, dz] = F.w(8, (doorV0 + doorV1) / 2);
    const door = { x: dx, y: FLOOR, z: dz, yaw: F.inYaw };
    const b = F.box(8, 3, 24, 33);
    // ---- garage (v 24..33): open front so the cars can drive out
    const gw = col(shade(th.wall, 0.92), { pat: 'stucco', rough: 0.9 });
    F.fill(8, 0.25, 24, 22, 3.5, 33, gw); F.fill(7.75, 3.5, 23.75, 22.25, 3.75, 33.25, trim);
    F.clear(8.25, 0.25, 24.25, 21.75, 3.25, 32.75); F.clear(7.9, 0.25, 24.75, 8.3, 3.0, 32.25);
    F.paint(8, 24, 22, 33, drive);
    F.fill(8.25, 3.0, 24.75, 8.5, 3.25, 32.25, trim);                          // open roll-up door, rolled up
    F.fill(21.5, 2.25, 26, 21.75, 2.5, 31, glow(0xfff0d0, 1.6, 'night'));      // garage strip light
    const garage = [{ ...xz(F, 15, 27.2), yaw: F.inYaw + PI }, { ...xz(F, 16, 31.4), yaw: F.inYaw + PI }];
    AF.addLight({ x: garage[0].x, y: 3.0, z: garage[0].z, color: 0xfff0d0, intensity: 0.7, range: 9, kind: 'interior' });
    const rec = { box: [b[0], 0, b[1], b[2], TOP + 0.5, b[3]], door, garage, F, npc: [] };
    if (!owner) {
      // a neighbour's house: closed door, lit rooms behind every window
      F.fill(8, FLOOR, doorV0, 8.25, 3.0, doorV1, col(th.door, { rough: 0.4 }));
      F.fill(7.75, 1.5, doorV1 - 0.5, 8, 1.75, doorV1 - 0.25, AF.MAT.brass);
      for (const [v0, v1] of [[4.5, 8.5], [13.5, 22.5]]) F.fill(8, 1.25, v0, 8.25, 3.0, v1, AF.MAT.winApartment);
      for (const [u0, u1] of [[10, 14], [17, 22]]) { F.fill(u0, 1.25, 3, u1, 3.0, 3.25, AF.MAT.winApartment); }
      AF.addLight({ x: dx + F.dir * -0.6, y: 3.2, z: dz, color: 0xffd9a0, intensity: 0.6, range: 7, kind: 'porch' });
      F.fill(7.25, 2.75, doorV1 + 0.5, 7.5, 3.25, doorV1 + 0.75, glow(0xffe0a0, 2, 'night'));
      return rec;
    }
    // ---- a friend's house: open door, carved ground floor, big windows
    F.clear(8.25, FLOOR, 3.25, 23.75, CEIL, 23.75);                           // the room
    F.fill(8.25, CEIL - 0.25, 3.25, 23.75, CEIL, 23.75, smoothC(0xf6f2ea));   // ceiling
    F.fill(8.25, 0.25, 3.25, 23.75, FLOOR, 23.75, col(th.floor, { pat: 'none', patTop: 'parquet', rough: 0.45 }));
    F.clear(7.9, FLOOR, doorV0, 8.3, 3.0, doorV1);                             // doorway
    F.fill(8, FLOOR - 0.05, doorV0, 8.25, FLOOR, doorV1, trim);
    for (const [v0, v1] of [[4, 8.75], [13.25, 22.75]]) { F.fill(8, 1.25, v0, 8.25, 3.0, v1, glass); F.fill(8, 1.0, v0 - 0.25, 8.25, 1.25, v1 + 0.25, frameC); }
    for (const [u0, u1] of [[10, 14], [17, 22]]) { F.fill(u0, 1.25, 3, u1, 3.0, 3.25, glass); F.fill(u0, 1.25, 23.75, u1, 3.0, 24, glass); }
    F.fill(23.75, 1.25, 12, 24, 3.0, 16, glass);
    // ceiling lights (emissive) + two interior light sources
    for (const [u, v] of [[12, 8], [12, 18], [20, 8], [20, 18]]) F.fill(u - 0.5, CEIL - 0.5, v - 0.5, u + 0.5, CEIL - 0.25, v + 0.5, glow(0xfff4dc, 1.8, 'night'));
    for (const [u, v] of [[12, 13], [20, 13]]) { const [x, z] = F.w(u, v); AF.addLight({ x, y: CEIL - 0.6, z, color: 0xffe6c0, intensity: 1.1, range: 11, kind: 'interior' }); }
    AF.addLight({ x: dx - F.dir * 0.8, y: 3.2, z: dz, color: 0xffd9a0, intensity: 0.7, range: 7, kind: 'porch' });
    // common furniture: kitchen corner (front-left), a bed at the back-left
    FU.counter(F, 8.25, 3.25, 13, 4.25, shade(th.trim, 1), 0xeeeae0); FU.counter(F, 8.25, 3.25, 9.25, 7, shade(th.trim, 1));
    F.fill(10.5, 1.5, 3.25, 12, 2.25, 3.5, col(0xd8dde2, { metal: 0.9, rough: 0.25 }));
    FU.table(F, 10, 5.5, 12, 7.5, 0xf2eee6);
    FU.plant(F, 8.75, 22.75, true); FU.plant(F, 22.75, 12.5, false);
    rec.F = F; rec.th = th;
    return rec;
  };
  const xz = (F, u, v) => { const [x, z] = F.w(u, v); return { x, z }; };

  // ------------------------------------------------------------ the six friends' interiors
  const G = {};   // shared prop geometries built lazily
  const flagDraw = {
    jollyRoger: (g) => {   // a straw-hat Jolly Roger
      g(0, 0, 60, 39, '#141414');
      g(22, 14, 16, 13, '#f4efe4'); g(24, 27, 12, 4, '#f4efe4');               // skull + jaw
      g(25, 18, 3, 3, '#141414'); g(32, 18, 3, 3, '#141414'); g(29, 22, 2, 2, '#141414');
      g(18, 11, 24, 3, '#e8c23a'); g(22, 6, 16, 6, '#e8c23a'); g(22, 10, 16, 2, '#c8322a');   // straw hat + red band
      for (let i = 0; i < 6; i++) { g(12 + i * 2, 30 + i, 4, 2, '#f4efe4'); g(44 - i * 2, 30 + i, 4, 2, '#f4efe4'); g(12 + i * 2, 38 - i, 4, 2, '#f4efe4'); g(44 - i * 2, 38 - i, 4, 2, '#f4efe4'); }
    },
  };
  const INTERIOR = {
    dhruv(F, th) {            // computers + gym
      FU.rug(F, 12, 12, 19, 21, th.rug, 0x3aa0ff);
      FU.sofa(F, 12.5, 20.5, 18.5, 22.75, th.sofa, 'v1');
      F.fill(14, 0.5, 13, 17, 1.0, 13.75, smoothC(0x2a2a2e)); FU.screen(F, 14.25, 1.0, 13.25, 16.75, 2.75, 13.5, 0x5ab4ff);  // TV
      // the battlestation: long desk, three glowing monitors, tower PC with RGB, a gaming chair
      FU.table(F, 20.5, 14, 23.5, 22.5, 0x1d1d20, 0.75, 0x1d1d20);
      FU.screen(F, 23, 1.5, 14.75, 23.25, 2.5, 16.75, 0x6adf8a); FU.screen(F, 23, 1.5, 17.25, 23.25, 2.75, 19.75, 0x5ab4ff); FU.screen(F, 23, 1.5, 20.25, 23.25, 2.5, 22.25, 0x6adf8a);
      F.fill(22.75, 0.5, 22.5, 23.5, 1.75, 23.5, smoothC(0x141416)); F.fill(22.7, 0.75, 22.6, 22.75, 1.6, 23.4, glow(0xff3aa0, 2.4)); F.fill(22.7, 0.75, 22.6, 22.75, 0.9, 23.4, glow(0x3affd0, 2.4));
      F.fill(19.25, 0.5, 17.5, 20, 1.25, 18.5, smoothC(0x202024)); F.fill(18.75, 1.25, 17.5, 19.25, 2.5, 18.5, smoothC(0x3a6ad0));   // chair
      // server rack with blinking LEDs
      F.fill(22.5, 0.5, 9.5, 23.75, 3.0, 11, smoothC(0x18181a)); for (let y = 0.75; y < 2.75; y += 0.25) F.fill(22.45, y, 9.75, 22.5, y + 0.125, 10.75, glow(y % 0.5 ? 0x3aff6a : 0x3aa0ff, 3));
      // gym corner: bench press, rack of dumbbells, a treadmill
      F.fill(15, 0.5, 4.5, 16.5, 1.0, 7.5, smoothC(0x202024)); F.fill(14.5, 1.0, 5, 17, 1.25, 7, smoothC(0x2d3e57));
      F.fill(14, 1.0, 4, 14.25, 2.5, 4.25, col(0x8b9097, { metal: 0.8 })); F.fill(17.25, 1.0, 4, 17.5, 2.5, 4.25, col(0x8b9097, { metal: 0.8 }));
      F.fill(13.75, 2.25, 4, 17.75, 2.5, 4.25, col(0xc3c8cf, { metal: 0.9 })); F.fill(13.5, 2.0, 3.75, 14, 2.75, 4.5, smoothC(0x141414)); F.fill(17.5, 2.0, 3.75, 18, 2.75, 4.5, smoothC(0x141414));
      F.fill(19, 0.5, 3.5, 22, 1.0, 4.25, smoothC(0x2a2a2e)); for (let i = 0; i < 6; i++) F.fill(19.25 + i * 0.5, 1.0, 3.6, 19.5 + i * 0.5, 1.25, 4.15, smoothC(i % 2 ? 0x141414 : 0x3a3a3e));
      F.fill(19.5, 0.5, 6, 22.5, 0.75, 7.25, smoothC(0x202024)); F.fill(22.25, 0.75, 6, 22.5, 2.25, 7.25, smoothC(0x2a2a2e)); FU.screen(F, 22.2, 1.75, 6.25, 22.25, 2.0, 7.0, 0x3aff6a);
      return { sign: ['console.log', 0x3affd0], npc: [19.6, 18, 'sit', 'back'] };
    },
    hunar(F, th) {            // pink, Barbie, fashion
      FU.rug(F, 11.5, 11.5, 20, 21.5, 0xff8fc8, 0xffc4e1);
      FU.sofa(F, 12, 20.75, 19, 23, th.sofa, 'v1'); FU.table(F, 14.5, 16, 17, 18, 0xffffff, 0.5, 0xff4fa3);
      F.fill(14, 0.5, 12.5, 17, 1.0, 13.25, smoothC(0xffffff)); FU.screen(F, 14.25, 1.0, 12.75, 16.75, 2.5, 13.0, 0xff8fd0);
      // the wardrobe: clothes rails with dresses in every colour + a wall of shoes
      const dress = [0xff4fa3, 0xffffff, 0xf7b6cf, 0xc02a7a, 0x9a6ad6, 0xffd0e8, 0x2a2a2e, 0xe8c23a];
      F.fill(23, 2.75, 13, 23.25, 2.9, 22.5, col(0xd8b04a, { metal: 0.9, rough: 0.3 }));
      for (let v = 13.25, i = 0; v < 22.25; v += 0.5, i++) F.fill(22.25, 1.25, v, 23.25, 2.75, v + 0.25, smoothC(dress[i % dress.length]));
      FU.shelf(F, 22.75, 7.5, 23.75, 11.5, 3.0, 0xffffff, [smoothC(0xff4fa3), smoothC(0xffc4e1), smoothC(0xc02a7a), 0, smoothC(0xffffff)]);
      // the vanity with a bulb-lit mirror
      FU.table(F, 18, 3.25, 21, 4.25, 0xffffff, 0.75, 0xffc4e1);
      F.fill(18.25, 1.5, 3.25, 20.75, 3.25, 3.4, col(0xe8f0f6, { metal: 1, rough: 0.05 }));
      for (let u = 18.25; u <= 20.5; u += 0.5) { F.fill(u, 3.25, 3.3, u + 0.25, 3.5, 3.5, glow(0xfff0d0, 3)); }
      F.fill(19, 0.5, 5, 20, 1.25, 6, smoothC(0xff4fa3));   // stool
      FU.bed(F, 17, 7.5, 21.5, 11, 0xff8fc8, 0xffffff, 'u1');
      F.fill(20.5, 1.5, 7.75, 21.25, 2.25, 8.5, smoothC(0xffffff)); F.fill(20.5, 1.5, 10, 21.25, 2.25, 10.75, smoothC(0xff4fa3));
      return { sign: ['Barbie', 0xff4fa3, { font: 'script' }], npc: [16, 9.5, 'stand', 'front'] };
    },
    tanishk(F, th) {          // crypto + gym
      FU.rug(F, 12, 12, 19, 21, 0x2a2a2e, 0xd4a84a);
      FU.sofa(F, 12.5, 20.5, 18.5, 22.75, 0x202024, 'v1'); FU.table(F, 14.5, 16, 17, 18, 0xd4a84a, 0.5, 0x202024);
      // the trading desk: six screens of green candles
      FU.table(F, 20.5, 13, 23.5, 22.75, 0x141416, 0.75, 0x141416);
      for (const [v0, y0] of [[13.5, 1.5], [16.5, 1.5], [19.5, 1.5], [13.5, 2.5], [16.5, 2.5], [19.5, 2.5]]) {
        F.fill(23.1, y0, v0, 23.25, y0 + 0.875, v0 + 2.75, smoothC(0x0a0a0c));
        for (let k = 0; k < 10; k++) { const up = (k * 7 + v0 * 3) % 5 < 3, h = 0.125 + ((k * 13 + y0 * 8) % 5) * 0.0625; F.fill(23.05, y0 + 0.25 + (k % 3) * 0.125, v0 + 0.25 + k * 0.25, 23.1, y0 + 0.25 + (k % 3) * 0.125 + h, v0 + 0.375 + k * 0.25, glow(up ? 0x2adf6a : 0xff3a3a, 2.2)); }
      }
      F.fill(19.25, 0.5, 17, 20, 1.25, 18, smoothC(0x202024)); F.fill(18.75, 1.25, 17, 19.25, 2.5, 18, smoothC(0xd4a84a));
      // a gold vault door + stacks of gold coins, the gym corner: squat rack + punching bag
      F.fill(23.5, 0.5, 8.5, 23.75, 3.0, 11, col(0xd4a84a, { metal: 1, rough: 0.25 })); F.fill(23.4, 1.5, 9.5, 23.5, 2.0, 10, col(0x8a6a2a, { metal: 1 }));
      for (let i = 0; i < 5; i++) F.fill(21.5 + (i % 2) * 0.5, 0.5, 8.75 + i * 0.4, 21.75 + (i % 2) * 0.5, 0.75 + (i % 3) * 0.25, 9.0 + i * 0.4, col(0xf2c65a, { metal: 1, rough: 0.2 }));
      for (const u of [14, 17]) { F.fill(u, 0.5, 4, u + 0.25, 3.0, 4.25, col(0x2a2a2e, { metal: 0.6 })); F.fill(u, 0.5, 6.5, u + 0.25, 3.0, 6.75, col(0x2a2a2e, { metal: 0.6 })); }
      F.fill(13.5, 2.0, 4, 17.75, 2.25, 6.75, col(0xc3c8cf, { metal: 0.9 })); F.clear(14.25, 2.0, 4.25, 17, 2.25, 6.5);
      F.fill(13.25, 1.75, 5.25, 17.75, 2.0, 5.5, col(0xc3c8cf, { metal: 0.9 })); F.fill(13, 1.5, 5, 13.5, 2.25, 5.75, smoothC(0x141414)); F.fill(17.5, 1.5, 5, 18, 2.25, 5.75, smoothC(0x141414));
      F.fill(20.5, 3.25, 4.5, 20.75, CEIL - 0.25, 4.75, col(0x2a2a2e)); F.fill(20.25, 1.0, 4.25, 21, 3.25, 5, smoothC(0xb8322a));
      return { sign: ['HODL', 0xf7931a, { font: 'deco' }], sign2: ['BTC', 0xf7931a], npc: [19.6, 17.5, 'sit', 'back'] };
    },
    diksha(F, th) {           // Taylor Swift + Barbie
      FU.rug(F, 11.5, 11.5, 20, 21.5, 0xc27ad6, 0xf2c6e6);
      FU.sofa(F, 12, 20.75, 19, 23, 0xf7b6cf, 'v1'); FU.table(F, 14.5, 16, 17, 18, 0xfaf6ff, 0.5, 0x7a4fb8);
      // a white upright piano, a guitar on a stand, the record wall, the lucky 13
      F.fill(21.75, 0.5, 13, 23.5, 2.25, 16.5, smoothC(0xf8f6f2)); F.fill(21.25, 1.25, 13.25, 21.75, 1.5, 16.25, smoothC(0x141414));
      for (let v = 13.25; v < 16.25; v += 0.25) F.fill(21.25, 1.5, v, 21.75, 1.55, v + 0.125, smoothC(0xffffff));
      F.fill(22.5, 0.5, 18, 22.75, 1.75, 18.25, col(0x2a2a2a)); F.fill(22.25, 0.75, 17.75, 23.0, 1.5, 18.5, smoothC(0xc8844a)); F.fill(22.5, 1.5, 18, 22.75, 2.75, 18.25, smoothC(0x6a3a1a));
      const eras = [0xd6b1e8, 0x9a6ad6, 0xe8c23a, 0x2a2a2e, 0xc02a2a, 0x7ab8e8, 0xf2c6e6, 0x5a3a2a, 0xa8b8c8, 0xe86aa6];
      for (let i = 0; i < 10; i++) { const v = 18.75 + (i % 5) * 0.9, y = 1.75 + Math.floor(i / 5) * 0.9; F.fill(23.6, y, v, 23.75, y + 0.75, v + 0.75, smoothC(eras[i])); F.fill(23.55, y + 0.25, v + 0.25, 23.6, y + 0.5, v + 0.5, smoothC(0x141414)); }
      FU.bed(F, 17, 3.5, 21.5, 7, 0xd6b1e8, 0xfaf6ff, 'u1');
      F.fill(20.5, 1.5, 3.75, 21.25, 2.25, 4.5, smoothC(0xff8fc8)); F.fill(20.5, 1.5, 6, 21.25, 2.25, 6.75, smoothC(0xc27ad6));
      FU.table(F, 18, 8.5, 21, 9.5, 0xffffff, 0.75, 0xff8fc8); F.fill(18.25, 1.5, 8.5, 20.75, 3.0, 8.65, col(0xe8f0f6, { metal: 1, rough: 0.05 }));
      return { sign: ['Eras', 0xd6b1e8, { font: 'script' }], sign2: ['13', 0x8e5ad6], npc: [19.5, 11, 'stand', 'front'] };
    },
    kush(F, th) {             // video games + cash, with Divyangana
      FU.rug(F, 11.5, 11.5, 20, 21.5, 0x2f7a4a, 0x8adf9a);
      FU.sofa(F, 12, 20.75, 19.5, 23, 0x3a5a3a, 'v1');
      F.fill(13.5, 0.5, 12, 18, 1.0, 12.75, smoothC(0x141416)); FU.screen(F, 13.75, 1.0, 12.25, 17.75, 3.0, 12.5, 0x7a5aff);   // the big TV
      F.fill(15, 1.0, 12.8, 16.5, 1.25, 13.3, smoothC(0xf2f2f2));                                                              // console
      // an arcade cabinet, the money safe with stacks of cash, two gaming chairs
      F.fill(22.5, 0.5, 19.5, 23.75, 3.0, 21, smoothC(0x2a2a8a)); FU.screen(F, 22.4, 1.75, 19.75, 22.5, 2.5, 20.75, 0xffd23a); F.fill(22, 1.25, 19.5, 22.5, 1.5, 21, smoothC(0x141414));
      F.fill(22.75, 0.5, 8.5, 23.75, 2.0, 10.5, col(0x3a3a40, { metal: 0.8, rough: 0.4 })); F.fill(22.7, 1.0, 9.25, 22.75, 1.5, 9.75, col(0xd4a84a, { metal: 1 }));
      for (let i = 0; i < 8; i++) F.fill(20.5 + (i % 4) * 0.5, 0.5, 8.75 + Math.floor(i / 4) * 0.75, 20.75 + (i % 4) * 0.5, 0.75 + (i % 3) * 0.125, 9.25 + Math.floor(i / 4) * 0.75, smoothC(0x5aa84a));
      for (const v of [14.25, 16.5]) { F.fill(19, 0.5, v, 19.75, 1.25, v + 1, smoothC(0x141416)); F.fill(19.75, 1.25, v, 20.25, 2.5, v + 1, smoothC(v < 15 ? 0x2f7a4a : 0xff6fae)); }
      FU.bed(F, 17, 3.5, 21.5, 7.5, 0xf2f2f2, 0x2f7a4a, 'u1');
      F.fill(20.5, 1.5, 3.75, 21.25, 2.25, 4.75, smoothC(0xff4f7a)); F.fill(20.5, 1.5, 6.25, 21.25, 2.25, 7.25, smoothC(0xff4f7a));
      return { sign: ['Kush & Div', 0xff4f7a, { font: 'script' }], npc: [15, 21.7, 'sit', 'v-'], npc2: [16.9, 21.7, 'sit', 'v-'] };
    },
    kaybee(F, th) {           // video games, One Piece, chess
      // a giant chessboard floor with waist-high pieces
      const cw = col(0xf2ecd8, { pat: 'none', rough: 0.4 }), cb = col(0x2a2a2e, { pat: 'none', rough: 0.4 });
      for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) F.fill(12 + i, 0.5, 13.5 + j, 13 + i, 0.55, 14.5 + j, (i + j) % 2 ? cb : cw);
      const piece = (u, v, dark, tall) => { const c = dark ? cb : cw; F.fill(u + 0.25, 0.55, v + 0.25, u + 0.75, 0.8, v + 0.75, c); F.fill(u + 0.375, 0.8, v + 0.375, u + 0.625, tall ? 1.8 : 1.3, v + 0.625, c); F.fill(u + 0.25, tall ? 1.8 : 1.3, v + 0.25, u + 0.75, tall ? 2.05 : 1.55, v + 0.75, c); };
      piece(12, 13.5, false, true); piece(15, 13.5, false, false); piece(16, 14.5, false, false); piece(19, 21.5, true, true); piece(16, 18.5, true, false); piece(14, 19.5, true, false);
      // gaming desk, the straw hat on a stand, a treasure chest, a ship's wheel on the wall
      FU.table(F, 20.75, 3.5, 23.5, 9, 0x3a2a1a, 0.75, 0x2a1a0a); FU.screen(F, 23, 1.5, 4.25, 23.25, 2.75, 8.25, 0x3affd0);
      F.fill(19.5, 0.5, 5.75, 20.25, 1.25, 6.75, smoothC(0x202024)); F.fill(19.0, 1.25, 5.75, 19.5, 2.5, 6.75, smoothC(0xb8322a));
      F.fill(22.75, 0.5, 11, 23, 1.75, 11.25, col(0x6a4a2a)); F.fill(22.25, 1.75, 10.5, 23.5, 1.85, 11.75, smoothC(0xf2c21b)); F.fill(22.5, 1.85, 10.75, 23.25, 2.25, 11.5, smoothC(0xf2c21b)); F.fill(22.5, 1.85, 10.75, 23.25, 1.95, 11.5, smoothC(0xc8322a));
      F.fill(21.5, 0.5, 21.75, 23.25, 1.25, 23.5, smoothC(0x6a4a2a)); F.fill(21.5, 1.25, 21.75, 23.25, 1.5, 23.5, smoothC(0x8a5a2a)); F.fill(21.5, 0.75, 21.7, 23.25, 0.9, 21.75, col(0xd8b04a, { metal: 1 }));
      F.fill(22.4, 1.5, 22, 23, 1.75, 23.2, col(0xf2c65a, { metal: 1, rough: 0.2 }));
      const wc = smoothC(0x8a5a2a); F.fill(23.6, 2.0, 16.75, 23.75, 3.25, 17.0, wc); F.fill(23.6, 2.5, 16.25, 23.75, 2.75, 17.5, wc);
      FU.sofa(F, 12, 3.5, 18, 5.5, 0x6a4a2a, 'v0');
      FU.bed(F, 8.5, 18, 12, 23.5, 0xb8322a, 0x6a4a2a, 'u0');
      return { sign: ['ONE PIECE', 0xf2c21b, { font: 'deco' }], npc: [19.85, 6.25, 'sit', 'back'], flag: true };
    },
  };

  // ------------------------------------------------------------ BUILD
  AF.onBuild('west-colony', 310, () => {
    const t0 = performance.now();
    let fi = 0;
    for (const pl of WS.plots) {
      const owner = OWNERS[pl.i] || null;
      const th = owner ? TH[owner] : FILLER[fi++ % FILLER.length];
      const rec = house(pl, th, owner);
      const F = rec.F;
      const name = owner ? th.name : null;
      AF.addBuilding({ id: owner ? 'friend-' + owner : 'colony-' + pl.i, name: name || 'a neighbour\u2019s house', label: !!owner, kind: 'house', box: rec.box, doors: [rec.door], interior: !!owner, owner: 'west' });
      if (!owner) continue;
      const S = INTERIOR[owner](F, th);
      // the name plate over the door + an indoor neon sign on the back wall
      F.place(K.text(owner === 'kush' ? 'KUSH & DIV' : owner.toUpperCase(), th.trim === 0xffffff ? 0x2a2a2e : th.trim, { lit: false, font: 'deco', vs: 1 / 12 }), 7.9, 3.55, 10.9, F.rotLane);
      F.place(K.text(S.sign[0], S.sign[1], S.sign[2] || {}), 23.6, 2.35, 13, F.rotLane);
      if (S.sign2) F.place(K.text(S.sign2[0], S.sign2[1], { font: 'deco', vs: 1 / 10 }), 23.6, 2.3, 5.5, F.rotLane);
      if (S.flag && AF.makeFlag) {
        const [x, z] = F.w(20, 20); F.fill(19.9, TOP, 19.9, 20.1, TOP + 5, 20.1, col(0x6a4a2a));
        AF.makeFlag({ x, y: TOP + 5, z, w: 2.4, h: 1.6, design: 'custom', key: 'jolly', draw: flagDraw.jollyRoger });
      }
      const at = (u, v) => xz(F, u, v);
      const face = (f) => f === 'back' ? F.inYaw : f === 'front' ? F.inYaw + PI : f === 'v+' ? 0 : PI;
      const npc = [];
      for (const q of [S.npc, S.npc2]) if (q) npc.push({ ...at(q[0], q[1]), y: FLOOR, yaw: face(q[3]), pose: q[2] });
      const sp = at(10, 11); sp.y = FLOOR; sp.yaw = F.inYaw;
      WS.homes[owner] = { door: rec.door, spawn: sp, npc, garage: rec.garage, box: rec.box, frame: F, theme: th };
    }
    // ---- the colony gateway over Friends Lane (clear 6 m for the buses)
    {
      const x = WS.lane, z = -11.5, pc = col(0xf2ece0, { pat: 'stone' }), cap = col(0x2f6a8a);
      for (const sx of [-7, 6]) { W.fill(x + sx, 0.25, z - 0.5, x + sx + 1, 7, z + 0.5, pc); W.fill(x + sx - 0.25, 7, z - 0.75, x + sx + 1.25, 7.5, z + 0.75, cap); W.fill(x + sx + 0.25, 7.5, z - 0.25, x + sx + 0.75, 8, z + 0.25, glow(0xffe0a0, 2.4, 'night')); }
      W.fill(x - 7, 6, z - 0.25, x + 7, 7, z + 0.25, cap);
      const g = K.text('NEW FRIENDS COLONY', 0xffe9b0, { font: 'deco', vs: 1 / 11, k: 2.2 });
      AF.placeStatic(g, x, 6.05, z + 0.3, 0, { collide: false }); AF.placeStatic(g, x, 6.05, z - 0.3, 2, { collide: false });
      AF.addLabel('New Friends Colony', x, -120, 'place');
      for (const sx of [-6.5, 6.5]) AF.addLight({ x: x + sx, y: 7.8, z, color: 0xffe0a0, intensity: 1, range: 10, kind: 'street' });
    }
    // trees in the back gardens + along the plots' back line
    if (AF.TREEKIT) for (const pl of WS.plots) { const F = K.frame(pl); for (const [u, v] of [[36, 8], [44, 25], [40, 16]]) { const [x, z] = F.w(u, v); AF.TREEKIT.place(x, z, pl.i % 3 ? 'autumn' : 'maple', pl.i % 2 ? 1 : 0, pl.i * 7 + u); } }
    AF.stats.westColonyMs = Math.round(performance.now() - t0);
  });
}

} catch (e) { AF.partError('45-west.js', e); }
