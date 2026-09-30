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
  // white ceilings carry a faint self-light: indoor fill is cut and nothing lights them from above
  const ceilC = () => glow(0xf2ede4, 0.3, 'always');

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
      u: (x) => (x - fx) * dir,
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
    dhruv:   { name: "Dhruv's House",   wall: 0xf1f3f6, trim: 0x2d3e57, accent: 0x3aa0ff, roof: 0x3b4658, floor: 0x9a6a3e, rug: 0x2d4a7a, sofa: 0x3d4f78, door: 0x2d3e57, board: 0x2d3e57, ink: 0xffffff, flag: 0xe8402a },
    hunar:   { name: "Hunar's Dreamhouse", wall: 0xf7b6cf, trim: 0xffffff, accent: 0xff4fa3, roof: 0xe86aa6, floor: 0xf6d9e6, rug: 0xff7fbf, sofa: 0xff5fae, door: 0xffffff, board: 0xff4fa3, ink: 0xffffff, flag: 0xffffff },
    tanishk: { name: "Tanishk's House", wall: 0x2e2e33, trim: 0xd4a84a, accent: 0xf7931a, roof: 0x1d1d20, floor: 0x9a7a5e, rug: 0x7a5a1a, sofa: 0x202024, door: 0xd4a84a, inner: 0xe6e0d4, board: 0x1d1d20, ink: 0xd4a84a, flag: 0xf7931a },
    diksha:  { name: "Diksha's House",  wall: 0xdcc8f0, trim: 0xfaf6ff, accent: 0x8e5ad6, roof: 0x7a4fb8, floor: 0xe8dcc8, rug: 0xc27ad6, sofa: 0xb68ae0, door: 0x7a4fb8, board: 0x7a4fb8, ink: 0xffffff, flag: 0xff8fc8 },
    kush:    { name: "Kush & Divyangana's House", wall: 0xeaf1e6, trim: 0x2f7a4a, accent: 0x3bbf6a, roof: 0x2a5a3a, floor: 0xa8773f, rug: 0x2f7a4a, sofa: 0x5a8a5a, door: 0x2f7a4a, board: 0x2f7a4a, ink: 0xffffff, flag: 0xf2c21b },
    kaybee:  { name: "Kaybee's House",  wall: 0xf3e3c3, trim: 0xb8322a, accent: 0xf2c21b, roof: 0x8a2a22, floor: 0xa06e42, rug: 0xb8322a, sofa: 0x6a4a2a, door: 0xb8322a, board: 0xb8322a, ink: 0xf2c21b, flag: 0xf2c21b },
    niranjan: { name: "Niranjan's Music House", wall: 0x2f4a56, trim: 0xe0c078, accent: 0xff9a3c, roof: 0x1c2a32, floor: 0x8a5a36, rug: 0x7a2a36, sofa: 0x5a3424, door: 0xe0c078, inner: 0xeadfcc, board: 0x2f4a56, ink: 0xe0c078, flag: 0xff9a3c },
  };
  const FILLER = [
    { wall: 0xe9e2d0, trim: 0x5a6a7a, roof: 0x4a5058, door: 0x6a4028 }, { wall: 0xd9e6ec, trim: 0x2f4f6a, roof: 0x34414e, door: 0x2f4f6a },
    { wall: 0xf0e0c8, trim: 0x8a4a2a, roof: 0x7a3a2a, door: 0x8a4a2a }, { wall: 0xe4ecd8, trim: 0x4a6a3a, roof: 0x3a4a34, door: 0x4a6a3a },
    { wall: 0xf4ecda, trim: 0x6a4a6a, roof: 0x5a4a5a, door: 0x6a4a6a }, { wall: 0xe2dcd2, trim: 0x3a3a3a, roof: 0x2a2a2a, door: 0x9a3a2a },
  ];
  // which plot is whose (index = row*2 + (east side ? 1 : 0)); the rest are neighbours' closed houses
  const OWNERS = { 0: 'dhruv', 2: 'niranjan', 3: 'hunar', 4: 'tanishk', 5: 'diksha', 7: 'kush', 8: 'kaybee' };
  WS.homes = {};   // friend id -> { door:{x,y,z,yaw}, spawn:{x,y,z,yaw}, npc:[{x,y,z,yaw,pose}], garage:[{x,z,yaw}], box }

  // ------------------------------------------------------------ furniture kit (voxel furniture straight into the world grid)
  const FU = K.furn = {
    rug(F, u0, v0, u1, v1, hex, hex2) { F.place(PROPS.rug(u1 - u0, v1 - v0, hex, hex2), (u0 + u1) / 2, F.level ?? 0.5, (v0 + v1) / 2, 0); },
    sofa(F, u0, v0, u1, v1, hex, backSide) {        // backSide: 'u0'|'u1'|'v0'|'v1' — where the backrest is
      const across = backSide === 'u0' || backSide === 'u1';
      const rot = across ? (backSide === 'u0' ? F.rotBack : F.rotLane) : (backSide === 'v0' ? 0 : 2);
      F.place(PROPS.sofa(hex, Math.min(2.75, across ? v1 - v0 : u1 - u0)), (u0 + u1) / 2, F.level ?? 0.5, (v0 + v1) / 2, rot);
    },
    table(F, u0, v0, u1, v1, top, h = 0.75, leg) { F.place(PROPS.worktable(Math.min(2, u1 - u0), Math.min(1, v1 - v0), h, top, leg ?? shade(top, 0.6)), (u0 + u1) / 2, F.level ?? 0.5, (v0 + v1) / 2, 0); },
    bed(F, u0, v0, u1, v1, sheet, frame, headSide) {
      F.place(PROPS.bed(sheet, frame), (u0 + u1) / 2, F.level ?? 0.5, (v0 + v1) / 2, headSide === 'u1' ? F.rotLane : F.rotBack);
    },
    counter(F, u0, v0, u1, v1, body, top) { F.place(PROPS.counter(u1 - u0, v1 - v0, body, top ?? 0xeeeae0), (u0 + u1) / 2, F.level ?? 0.5, (v0 + v1) / 2, 0); },
    plant(F, u, v, big) { F.place(PROPS.plant(big), u, F.level ?? 0.5, v, 0); },
    lamp(F, u, v, hex = 0xfff0c8) { F.place(PROPS.floorlamp(hex), u, F.level ?? 0.5, v, 0); },
    screen(F, u0, y0, v0, u1, y1, v1, tile = 0) { addScreen(F, u0, y0, v0, u1, y1, v1, tile); },
    shelf(F, u0, v0, u1, v1, h, wood, items) {
      const inset = u1 - u0 < v1 - v0;
      F.place(PROPS.books(Math.min(2, inset ? v1 - v0 : u1 - u0), Math.min(3, h - (F.level ?? 0.5)), wood, items), (u0 + u1) / 2, F.level ?? 0.5, (v0 + v1) / 2, inset ? F.rotLane : 0);
    },
  };
  function shade(hex, k) { const f = (s) => Math.max(0, Math.min(255, Math.round(((hex >> s) & 255) * k))); return (f(16) << 16) | (f(8) << 8) | f(0); }
  K.shade = shade;

  // ------------------------------------------------------------ one house: shell, garage, yard; interior only for the friends
  const FLOOR = 0.5, CEIL = 3.75, UPPER = 4, TOP = 7.25;
  const WIN_F = [[4, 8.75], [13.25, 22.75]];   // front windows, both storeys
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
    // neighbours' voxel mailbox (friends get a name board + mailbox prop)
    if (!owner) { F.fill(1.0, 0.25, 8.0, 1.25, 1.25, 8.25, col(0x2a2a2a)); F.fill(0.75, 1.25, 7.75, 1.5, 1.75, 8.5, trim); }
    // ---- house body: 16 x 21 m, two storeys, flat roof with parapet
    F.fill(8, 0.25, 3, 24, FLOOR, 24, trim);                                    // plinth / floor slab
    F.fill(8, FLOOR, 3, 24, TOP, 24, wall);                                     // solid, carved below
    F.fill(7.75, CEIL, 2.75, 24.25, CEIL + 0.25, 24.25, trim);                 // storey band
    F.fill(7.75, TOP - 0.25, 2.75, 24.25, TOP + 0.5, 24.25, trim); F.clear(8.25, TOP, 3.25, 23.75, TOP + 0.5, 23.75);   // parapet
    F.fill(8.25, TOP - 0.25, 3.25, 23.75, TOP, 23.75, roof);
    // upper storey windows: facade-only rooms (lit at night by the shader)
    for (const [v0, v1] of owner ? WIN_F : [[4.5, 8.5], [13.5, 22.5]]) {
      F.fill(8, CEIL + 1, v0, 8.25, CEIL + 2.75, v1, owner ? glass : AF.MAT.winApartment);
      if (owner) F.fill(8, CEIL + 0.75, v0 - 0.25, 8.25, CEIL + 1, v1 + 0.25, frameC);
    }
    for (const [u0, u1] of [[10, 14], [17, 22]]) { F.fill(u0, CEIL + 1, 3, u1, CEIL + 2.75, 3.25, owner ? glass : AF.MAT.winApartment); F.fill(u0, CEIL + 1, 23.75, u1, CEIL + 2.75, 24, owner ? glass : AF.MAT.winApartment); }
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
    F.fill(8.25, CEIL - 0.25, 3.25, 23.75, CEIL, 23.75, ceilC());   // ceiling
    F.fill(8.25, 0.25, 3.25, 23.75, FLOOR, 23.75, col(th.floor, { pat: 'none', patTop: 'parquet', rough: 0.45 }));
    F.clear(7.75, FLOOR, doorV0, 8.5, 2.75, doorV1);
    F.fill(7.75, 2.75, doorV0, 8.25, 3.0, doorV1, trim);
    F.place(PROPS.lintel(1.75, th.trim), 8.125, FLOOR + 2.125, (doorV0 + doorV1) / 2, F.rotLane);
    F.fill(8, FLOOR - 0.05, doorV0, 8.25, FLOOR, doorV1, trim);
    for (const [v0, v1] of WIN_F) { F.fill(8, 1.25, v0, 8.25, 3.0, v1, glass); F.fill(8, 1.0, v0 - 0.25, 8.25, 1.25, v1 + 0.25, frameC); }
    for (const [u0, u1] of [[10, 14], [17, 22]]) { F.fill(u0, 1.25, 3, u1, 3.0, 3.25, glass); F.fill(u0, 1.25, 23.75, u1, 3.0, 24, glass); }
    F.fill(23.75, 1.25, 12, 24, 3.0, 16, glass);
    // ceiling lights (emissive) + two interior light sources
    for (const [u, v] of [[12, 8], [12, 18], [20, 8], [20, 18]]) F.fill(u - 0.5, CEIL - 0.5, v - 0.5, u + 0.5, CEIL - 0.25, v + 0.5, glow(0xfff4dc, 1.5, 'always'));
    for (const [u, v] of [[12, 13], [20, 13]]) { const [x, z] = F.w(u, v); AF.addLight({ x, y: CEIL - 0.6, z, color: 0xffe6c0, intensity: 1.1, range: 11, kind: 'interior' }); }
    AF.addLight({ x: dx - F.dir * 0.8, y: 3.2, z: dz, color: 0xffd9a0, intensity: 0.7, range: 7, kind: 'porch' });
    // common furniture: a kitchen run along the side wall under its window, a dining table by the front window
    FU.counter(F, 8.25, 3.25, 14, 4.25, th.trim, 0xeeeae0);
    FU.table(F, 9.75, 6, 11.75, 7, 0xf2eee6);
    FU.plant(F, 8.75, 22.75, true);
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
  const INTERIOR = {};
  const SCREEN_THEME = { dhruv: 3, hunar: 7, tanishk: 2, diksha: 6, kush: 4, kaybee: 4, niranjan: 6 };
  const TV_THEME = { dhruv: 1, hunar: 0, tanishk: 5, diksha: 6, kush: 4, kaybee: 7, niranjan: 3 };
  // back-wall neon: [text, colour, opts, v centre, y bottom] placed clear of the patio window, doors and tall furniture
  const SIGNS = { dhruv: ['console.log', 0x3affd0, { font: 'script', vs: 1 / 20 }, 20, 2.2], hunar: ['Barbie', 0xff4fa3, { font: 'script' }, 20.9, 2.3], tanishk: ['HODL', 0xf7931a, {}, 21.2, 2.4], diksha: ['Eras', 0xd6b1e8, { font: 'script' }, 17.9, 2.3], kush: ['Kush & Div', 0xff4f7a, { font: 'script', vs: 1 / 20 }, 18.3, 2.4], kaybee: ['ONE PIECE', 0xf2c21b, {}, 9, 2.4], niranjan: ['Encore', 0xffb060, { font: 'script' }, 20.4, 2.3] };
  for (const owner of Object.keys(TH)) INTERIOR[owner] = (F, th) => {
    FU.rug(F, 9.5, 13.5, 13.75, 19, th.rug, th.accent);
    F.place(PROPS.sofa(th.sofa), 11.75, FLOOR, 17, 2);
    F.place(PROPS.worktable(1, 0.6, 0.4375, th.trim, th.trim), 11.75, FLOOR, 15.2, 0);
    F.place(PROPS.tvStand(th.trim), 11.75, FLOOR, 12.5, 0);
    F.place(PROPS.monitorStand(), 11.75, FLOOR + 0.5, 12.5, 0);
    FU.screen(F, 11.0625, 1.125, 12.6, 12.4375, 1.875, 12.6, TV_THEME[owner]);
    for (const [u, v, r] of [[10.25, 5.35, 0], [11.25, 5.35, 0], [10.25, 7.65, 2], [11.25, 7.65, 2]]) F.place(PROPS.chair(th.trim), u, FLOOR, v, r);
    F.place(PROPS.plant(false), 23.1, FLOOR, 16.6, 0);
    const desk = (v, count, tile) => {
      F.place(PROPS.worktable(1.875, 0.75, 0.75, th.trim, th.trim), 23.3, FLOOR, v, F.rotLane);
      F.place(PROPS.chair(th.sofa), 22.2, FLOOR, v, F.rotBack);
      for (let screen = 0; screen < count; screen++) {
        const sv = v + (screen - (count - 1) / 2) * 0.625;
        F.place(PROPS.monitorStand(), 23.45, 1.25, sv, F.rotLane);
        FU.screen(F, 23.37, 1.4375, sv - 0.28125, 23.37, 1.75, sv + 0.28125, tile);
        if (owner === 'tanishk') FU.screen(F, 23.37, 1.875, sv - 0.28125, 23.37, 2.1875, sv + 0.28125, tile);
      }
      F.place(PROPS.desklamp(th.accent), 23.3, 1.25, v + 0.8, 0);
      F.place(PROPS.tower(th.accent), 23.3, FLOOR, v + 1.15, F.rotLane);
    };
    if (owner === 'dhruv' || owner === 'tanishk') {
      desk(18, 3, SCREEN_THEME[owner]);
      F.place(PROPS.bench(th.trim), 17, FLOOR, 6, 0);
      F.place(PROPS.treadmill(), 20.5, FLOOR, 8.5, F.rotLane);
      F.place(PROPS.weights(), 17, FLOOR, 9.5, 0);
      F.place(PROPS.safe(), 23.3, FLOOR, 10.5, F.rotLane);
    } else if (owner === 'hunar') {
      F.place(PROPS.worktable(1.25, 0.5, 0.75, th.trim, th.trim), 23.45, FLOOR, 8, F.rotLane);
      F.place(PROPS.mirror(), 23.65, 1.4, 8, F.rotLane);
      F.place(PROPS.desklamp(th.accent), 23.45, 1.25, 8.45, 0);
      F.place(PROPS.chair(th.sofa), 22.65, FLOOR, 8, F.rotBack);
      F.place(PROPS.wardrobe(th.accent), 23.3, FLOOR, 18, F.rotLane);
      FU.shelf(F, 23.2, 9.5, 23.5, 11.5, 2.5, th.trim, [smoothC(th.accent), smoothC(0xffffff), smoothC(0xe8c23a)]);
    } else if (owner === 'diksha') {
      F.place(PROPS.piano(), 23.4, FLOOR, 17.9, F.rotLane);
      F.place(PROPS.chair(th.sofa), 22.35, FLOOR, 17.9, F.rotBack);
      F.place(PROPS.guitar(), 23.5, FLOOR, 19.4, F.rotLane);
      FU.shelf(F, 23.2, 20.6, 23.5, 22.6, 2.5, th.trim, [smoothC(th.accent), smoothC(0xd6b1e8), smoothC(0xff8fc8)]);
    } else if (owner === 'niranjan') {
      // the music corner: an upright piano, three guitars on stands, a stack amp, a lamp and a shelf of records
      F.place(PROPS.piano(), 23.4, FLOOR, 7.2, F.rotLane);
      F.place(PROPS.chair(th.sofa), 22.35, FLOOR, 7.2, F.rotBack);
      for (const v of [16.6, 17.6, 18.6]) F.place(PROPS.guitar(), 23.5, FLOOR, v, F.rotLane);
      F.place(PROPS.worktable(0.75, 0.5, 1.0, 0x1a1a1c, 0x1a1a1c), 23.35, FLOOR, 20.2, F.rotLane);
      F.place(PROPS.worktable(0.625, 0.4375, 0.625, 0x2a2a2e, 0x2a2a2e), 23.4, FLOOR + 1.0, 20.2, F.rotLane);
      F.place(PROPS.floorlamp(0xffb060), 21.4, FLOOR, 19.4, 0);
      FU.shelf(F, 23.2, 21.4, 23.5, 23.4, 2.5, th.trim, [smoothC(th.accent), smoothC(0x222226), smoothC(0xe0c078), smoothC(0x7a2a36)]);
    } else {
      desk(owner === 'kush' ? 8.5 : 6, 1, 4);
      F.place(PROPS.console(), 12.25, FLOOR + 0.5, 12.5, 0);
      F.place(PROPS.arcade(th.trim), 23.3, FLOOR, 20, F.rotLane);
      FU.screen(F, 22.78, 1.625, 19.71875, 22.78, 2.125, 20.28125, 4);
      F.place(PROPS.safe(), 23.3, FLOOR, owner === 'kush' ? 10.6 : 10.5, F.rotLane);
      if (owner === 'kaybee') {
        F.place(PROPS.chest(), 22, FLOOR, 23.2, 2);
        F.place(PROPS.worktable(1, 1, 0.75, th.floor, th.trim), 19, FLOOR, 16, 0);
        F.place(PROPS.chess(), 19, 1.25, 16, 0);
        F.place(PROPS.hat(), 23.3, 1.25, 5.4, 0);
      }
    }
    return { sign: SIGNS[owner], sign2: owner === 'tanishk' ? ['BTC', th.accent, 5.5] : owner === 'diksha' ? ['13', th.accent, 9] : null, npc: owner === 'dhruv' || owner === 'tanishk' ? [22.2, 18, 'sit', 'back'] : owner === 'kaybee' ? [22.2, 6, 'sit', 'back'] : [11.25, 17, 'sit', 'v-'], npc2: owner === 'kush' ? [12.3, 17, 'sit', 'v-'] : null, flag: owner === 'kaybee' };
  };

  // ------------------------------------------------------------ friend homes v2: a distinct silhouette per friend, a bathroom annex, a kitchen
  //   upgrade, a patio door and a themed back garden (pool / swings / beds / trees). Fine props are 1/16 m models placed as statics.
  const PM = {};
  const pm = (k, fn) => PM[k] || (PM[k] = fn());
  const M16 = (w, h, d, fn) => K.model(w, h, d, fn, 1 / 16);
  const PROPS = {
    lintel: (width, hex) => pm('lintel' + [width, hex], () => M16(Math.round(width * 16), 2, 4, (m) => m.box(0, 0, 0, m.w, 2, 4, smoothC(hex)))),
    rug: (w, d, hex, border) => pm('rug' + [w, d, hex, border], () => M16(Math.round(w * 16), 1, Math.round(d * 16), (m) => { m.box(0, 0, 0, m.w, 1, m.d, smoothC(border ?? hex)); m.box(2, 0, 2, m.w - 2, 1, m.d - 2, smoothC(hex)); })),
    worktable: (w, d, h, hex, leg) => pm('desk' + [w, d, h, hex, leg], () => M16(Math.round(w * 16), Math.round(h * 16), Math.round(d * 16), (m) => { const c = smoothC(leg); for (const x of [1, m.w - 3]) for (const z of [1, m.d - 3]) m.box(x, 0, z, x + 2, m.h - 1, z + 2, c); m.box(0, m.h - 1, 0, m.w, m.h, m.d, smoothC(hex)); })),
    sofa: (hex, width = 2.25) => pm('sofa' + [hex, width], () => M16(Math.round(width * 16), 14, 15, (m) => { const c = smoothC(hex), dark = smoothC(shade(hex, 0.75)); for (const x of [1, m.w - 3]) for (const z of [1, 12]) m.box(x, 0, z, x + 2, 3, z + 2, dark); m.box(0, 3, 0, m.w, 6, 15, dark); m.box(2, 6, 3, m.w - 2, 7, 14, c); m.box(0, 6, 0, m.w, 14, 3, dark); m.box(0, 6, 0, 2, 10, 15, dark); m.box(m.w - 2, 6, 0, m.w, 10, 15, dark); })),
    bed: (sheet, frame) => pm('bed' + [sheet, frame], () => M16(26, 18, 34, (m) => { const fr = smoothC(frame), wt = smoothC(0xf6f2ea); m.box(1, 2, 1, 25, 6, 34, fr); m.box(2, 6, 2, 24, 8, 33, wt); m.box(2, 8, 10, 24, 9, 33, smoothC(sheet)); m.box(0, 0, 0, 26, 18, 2, fr); for (const x of [3, 14]) m.box(x, 8, 3, x + 9, 10, 9, wt); for (const x of [2, 22]) for (const z of [2, 30]) m.box(x, 0, z, x + 2, 2, z + 2, fr); })),
    counter: (w, d, body, top) => pm('counter' + [w, d, body, top], () => M16(Math.round(w * 16), 14, Math.round(d * 16), (m) => { m.box(0, 0, 0, m.w, 13, m.d, smoothC(body)); m.box(0, 13, 0, m.w, 14, m.d, smoothC(top)); for (let x = 8; x < m.w; x += 10) m.box(x, 9, m.d - 1, x + 2, 10, m.d, col(0xc8ccd2, { metal: 0.8 })); })),
    books: (width, height, wood, items) => pm('books' + [width, height, wood, ...items], () => M16(Math.round(width * 16), Math.round(height * 16), 6, (m) => { const fr = smoothC(wood); m.box(0, 0, 0, 1, m.h, 6, fr); m.box(m.w - 1, 0, 0, m.w, m.h, 6, fr); m.box(0, 0, 0, m.w, m.h, 1, fr); for (let y = 0; y < m.h; y += 7) { m.box(0, y, 0, m.w, y + 1, 6, fr); for (let x = 2; x < m.w - 2; x += 2) { const c = items[(x + y) % items.length]; if (c) m.box(x, y + 1, 1, x + 1, Math.min(m.h, y + 4 + x % 3), 5, c); } } m.box(0, m.h - 1, 0, m.w, m.h, 6, fr); })),
    plant: (big) => pm('plant' + big, () => M16(10, big ? 26 : 16, 10, (m) => { m.box(2, 0, 2, 8, 5, 8, smoothC(0xb8643a)); m.box(4, 5, 4, 6, m.h - 2, 6, smoothC(0x426b35)); for (let y = 6; y < m.h - 2; y += 4) m.box(y % 8 ? 1 : 4, y, 1, y % 8 ? 6 : 9, y + 3, 9, smoothC(0x649a48)); })),
    floorlamp: (hex) => pm('floorlamp' + hex, () => M16(7, 26, 7, (m) => { const fr = smoothC(0x28282c); m.box(1, 0, 1, 6, 1, 6, fr); m.box(3, 1, 3, 4, 22, 4, fr); m.box(0, 22, 0, 7, 26, 7, glow(hex, 1.3, 'night')); })),
    desklamp: (hex) => pm('desklamp' + hex, () => M16(5, 7, 5, (m) => { const fr = smoothC(hex); m.box(0, 0, 0, 5, 1, 5, fr); m.box(2, 1, 2, 3, 5, 3, fr); m.box(0, 5, 0, 5, 7, 5, glow(0xffebc4, 1.1, 'night')); })),
    wardrobe: (hex) => pm('wardrobe' + hex, () => M16(24, 35, 11, (m) => { m.box(0, 0, 0, 24, 35, 10, smoothC(hex)); const h = col(0xc8ccd2, { metal: 0.8 }); m.box(11, 2, 9, 12, 34, 10, smoothC(shade(hex, 0.8))); for (const x of [9, 13]) m.box(x, 15, 10, x + 1, 19, 11, h); })),
    bezel: (width, height) => pm('bezel' + [width, height], () => M16(Math.round(width * 16) + 2, Math.round(height * 16) + 2, 1, (m) => { m.box(0, 0, 0, m.w, m.h, 1, smoothC(0x151519)); m.box(1, 1, 0, m.w - 1, m.h - 1, 1, 0); })),
    monitorStand: () => pm('monitorStand', () => M16(7, 3, 5, (m) => { const c = smoothC(0x28282c); m.box(0, 0, 0, 7, 1, 5, c); m.box(3, 1, 1, 4, 3, 3, c); })),
    tvStand: (hex) => pm('tvstand' + hex, () => M16(26, 8, 7, (m) => { const c = smoothC(hex); m.box(0, 1, 0, 26, 8, 7, c); m.box(1, 3, 5, 12, 6, 7, smoothC(shade(hex, 0.65))); m.box(14, 3, 5, 25, 6, 7, smoothC(shade(hex, 0.65))); for (const x of [1, 23]) m.box(x, 0, 1, x + 2, 1, 6, c); })),
    bench: (hex) => pm('bench' + hex, () => M16(29, 22, 23, (m) => { const steel = col(0x9ba1a9, { metal: 0.8 }), dark = smoothC(0x202024); m.box(12, 5, 3, 17, 7, 22, smoothC(hex)); for (const z of [5, 19]) m.box(13, 0, z, 16, 5, z + 2, steel); for (const x of [4, 24]) m.box(x, 0, 2, x + 1, 19, 3, steel); m.box(0, 18, 2, 29, 19, 3, steel); for (const x of [2, 25]) m.box(x, 15, 0, x + 2, 22, 5, dark); })),
    weights: () => pm('weights', () => M16(14, 12, 6, (m) => { const steel = col(0x9ba1a9, { metal: 0.8 }), dark = smoothC(0x202024); for (const x of [0, 13]) m.box(x, 0, 0, x + 1, 11, 6, steel); for (const y of [4, 8]) { m.box(0, y, 0, 14, y + 1, 6, steel); for (const x of [2, 6, 10]) { m.box(x, y + 1, 2, x + 3, y + 2, 3, steel); for (const end of [x, x + 2]) m.box(end, y + 1, 1, end + 1, y + 4, 4, dark); } } })),
    console: () => pm('console', () => M16(7, 2, 5, (m) => { m.box(0, 0, 0, 7, 2, 5, smoothC(0xf1f2ee)); m.box(0, 1, 4, 7, 2, 5, smoothC(0x28282c)); m.set(6, 1, 4, glow(0x75d0a4, 0.7)); })),
    treadmill: () => pm('treadmill', () => M16(13, 21, 29, (m) => { const fr = smoothC(0x303038); m.box(0, 0, 0, 13, 3, 29, fr); m.box(2, 3, 2, 11, 4, 28, smoothC(0x151519)); for (const x of [0, 12]) m.box(x, 3, 2, x + 1, 18, 3, fr); m.box(0, 17, 1, 13, 19, 5, fr); m.box(3, 19, 1, 10, 21, 4, smoothC(0x697881)); })),
    tower: (hex) => pm('tower' + hex, () => M16(4, 8, 7, (m) => { m.box(0, 0, 0, 4, 8, 7, smoothC(0x202024)); m.box(1, 2, 6, 3, 6, 7, glow(hex, 1)); })),
    arcade: (hex) => pm('arcade' + hex, () => M16(12, 30, 12, (m) => { const c = smoothC(hex); m.box(0, 0, 0, 12, 30, 8, c); m.box(0, 0, 8, 12, 16, 12, c); m.box(1, 16, 8, 11, 17, 12, smoothC(0x202024)); m.box(1, 27, 8, 11, 29, 9, glow(hex, 0.7)); for (const x of [3, 7]) m.set(x, 17, 10, smoothC(0xf2c21b)); })),
    piano: () => pm('piano', () => M16(23, 20, 10, (m) => { const white = smoothC(0xf8f6f2); m.box(0, 0, 0, 23, 20, 6, white); m.box(0, 11, 6, 23, 12, 10, white); for (let x = 1; x < 22; x += 2) m.box(x, 12, 6, x + 1, 13, 8, smoothC(0x18181a)); })),
    guitar: () => pm('guitar', () => M16(6, 18, 4, (m) => { const wood = smoothC(0xb87943); m.box(0, 2, 1, 6, 9, 3, wood); m.box(1, 9, 1, 5, 11, 3, wood); m.box(2, 11, 1, 4, 18, 2, smoothC(0x603820)); m.box(2, 5, 2, 4, 7, 3, smoothC(0x28282c)); m.box(0, 0, 0, 6, 1, 4, smoothC(0x28282c)); })),
    safe: () => pm('safe', () => M16(10, 13, 11, (m) => { m.box(0, 0, 0, 10, 13, 10, col(0x434349, { metal: 0.7 })); m.box(4, 6, 10, 6, 8, 11, col(0xd4a84a, { metal: 0.9 })); })),
    chest: () => pm('chest', () => M16(14, 9, 9, (m) => { m.box(0, 0, 0, 14, 9, 8, smoothC(0x8a5a34)); for (const x of [2, 11]) m.box(x, 0, 7, x + 1, 9, 8, col(0xd8b04a, { metal: 0.8 })); m.box(6, 4, 8, 8, 6, 9, col(0xd8b04a, { metal: 0.8 })); })),
    hat: () => pm('hat', () => M16(10, 4, 10, (m) => { const straw = smoothC(0xf2c21b); m.box(0, 0, 0, 10, 1, 10, straw); m.box(2, 1, 2, 8, 2, 8, smoothC(0xc8322a)); m.box(2, 2, 2, 8, 4, 8, straw); })),
    chess: () => pm('chess', () => M16(10, 4, 10, (m) => { const white = smoothC(0xf2ecd8), black = smoothC(0x242429); for (let x = 1; x < 9; x++) for (let z = 1; z < 9; z++) m.set(x, 0, z, (x + z) % 2 ? white : black); for (let x = 1; x < 9; x++) for (const z of [1, 2, 7, 8]) { const c = z < 3 ? white : black; m.set(x, 1, z, c); m.set(x, 2, z, c); if (z === 1 || z === 8) m.set(x, 3, z, c); } })),
    cooktop: () => pm('cooktop', () => M16(10, 1, 8, (m) => { m.box(0, 0, 0, 10, 1, 8, smoothC(0x35353a)); for (const x of [1, 6]) for (const z of [1, 5]) m.box(x, 0, z, x + 3, 1, z + 2, smoothC(0x101014)); })),
    kitchenSink: () => pm('kitchenSink', () => M16(10, 6, 8, (m) => { const c = col(0xc8ccd2, { metal: 0.9 }); m.box(0, 0, 0, 10, 1, 8, c); m.box(1, 0, 1, 9, 1, 7, smoothC(0x617580)); m.box(4, 1, 0, 5, 5, 1, c); m.box(4, 4, 0, 5, 5, 4, c); })),
    toilet: () => pm('toilet', () => M16(8, 15, 12, (m) => { const wt = smoothC(0xf6f6f2), ch = col(0xc8ccd2, { metal: 0.9, rough: 0.2 }); m.box(2, 0, 4, 6, 6, 10, wt); m.box(1, 6, 3, 7, 7, 11, wt); m.box(2, 6, 5, 6, 7, 10, smoothC(0xdfe6ea)); m.box(1, 6, 0, 7, 13, 3, wt); m.box(0, 13, 0, 8, 14, 3, wt); m.set(4, 14, 1, ch); })),
    sink: () => pm('sink', () => M16(10, 18, 8, (m) => { const wt = smoothC(0xf6f6f2), ch = col(0xc8ccd2, { metal: 0.9, rough: 0.2 }); m.box(4, 0, 2, 6, 12, 5, wt); m.box(0, 12, 0, 10, 15, 8, wt); m.box(1, 14, 1, 9, 15, 7, 0); m.box(4, 15, 0, 6, 17, 2, ch); m.set(5, 16, 2, ch); m.set(5, 16, 3, ch); })),
    tub: () => pm('tub', () => M16(14, 11, 28, (m) => { const wt = smoothC(0xf6f6f2); m.box(0, 0, 0, 14, 9, 28, wt); m.box(1, 2, 1, 13, 9, 27, 0); m.box(1, 2, 1, 13, 6, 27, col(0x8fd0ea, { glass: true, jitter: 0.02, edge: 0 })); m.box(6, 9, 0, 8, 11, 2, col(0xc8ccd2, { metal: 0.9 })); })),
    mirror: () => pm('mirror', () => M16(12, 14, 1, (m) => { m.box(0, 0, 0, 12, 14, 1, col(0xd8b04a, { metal: 0.9, rough: 0.3 })); m.box(1, 1, 0, 11, 13, 1, col(0xe8f0f6, { metal: 1, rough: 0.05, jitter: 0, edge: 0 })); })),
    fridge: () => pm('fridge', () => M16(14, 32, 13, (m) => { const b = col(0xe6eaee, { metal: 0.35, rough: 0.3, jitter: 0.03 }), ch = col(0xc8ccd2, { metal: 0.9, rough: 0.2 }); m.box(0, 0, 0, 14, 32, 12, b); m.box(0, 21, 11, 14, 22, 12, smoothC(0x5a5e64)); m.box(11, 6, 12, 12, 19, 13, ch); m.box(11, 23, 12, 12, 30, 13, ch); })),
    lounger: (hex) => pm('lounger' + hex, () => M16(11, 9, 30, (m) => { const fr = smoothC(0xf2f2ee), cu = smoothC(hex); for (const x of [0, 10]) for (const z of [2, 27]) m.box(x, 0, z, x + 1, 3, z + 1, fr); m.box(0, 3, 0, 11, 4, 30, fr); m.box(1, 4, 9, 10, 5, 29, cu); for (let z = 0; z < 9; z++) { const t = 4 + Math.round((9 - z) * 0.55); m.box(1, 4, z, 10, t, z + 1, cu); } })),
    umbrella: (a, b) => pm('umb' + a + b, () => M16(33, 40, 33, (m) => { const ca = smoothC(a), cb = smoothC(b); m.box(16, 0, 16, 17, 36, 17, col(0xd8d4c8, { metal: 0.6 })); m.box(13, 0, 13, 20, 1, 20, smoothC(0x3a3a3e)); for (let y = 30; y < 36; y++) { const r = 16 - (y - 30) * 2.6; for (let x = 0; x < 33; x++) for (let z = 0; z < 33; z++) { const dx = x - 16, dz = z - 16, d = Math.hypot(dx, dz); if (d <= r && d > r - 3.2) m.set(x, y, z, (Math.floor((Math.atan2(dz, dx) + PI) / (PI / 4)) & 1) ? ca : cb); } } m.set(16, 36, 16, cb); })),
    bbq: () => pm('bbq', () => M16(11, 17, 11, (m) => { const k = smoothC(0x1d1d20), ch = col(0xc8ccd2, { metal: 0.9 }); for (const [x, z] of [[1, 1], [9, 1], [5, 9]]) m.box(x, 0, z, x + 1, 9, z + 1, ch); m.sphere(5.5, 11, 5.5, 5, k, (x, y) => (y <= 11 ? k : 0)); m.sphere(5.5, 11.5, 5.5, 4.8, k, (x, y) => (y > 11 ? k : 0)); m.box(5, 16, 5, 6, 17, 6, ch); m.box(0, 11, 0, 11, 12, 11, 0); m.box(1, 11, 1, 10, 12, 10, col(0x8a8e94, { metal: 0.9 })); })),
    swing: (hex) => pm('swing' + hex, () => M16(64, 42, 26, (m) => { const fr = col(hex, { metal: 0.5, rough: 0.4 }), ch = col(0xb8bcc2, { metal: 0.9 }), seat = smoothC(0x2a2a2e);
      for (const x of [0, 1, 62, 63]) for (let y = 0; y < 40; y++) { const k = Math.round(y * 11 / 39); m.set(x, y, k, fr); m.set(x, y, 25 - k, fr); }
      m.box(0, 39, 11, 64, 41, 15, fr);
      for (const s of [14, 38]) { for (let y = 10; y < 39; y++) { m.set(s, y, 13, ch); m.set(s + 10, y, 13, ch); } m.box(s - 1, 9, 10, s + 12, 10, 16, seat); } })),
    trampoline: () => pm('tramp', () => M16(48, 12, 48, (m) => { const pad = smoothC(0x2f7a4a), mat = smoothC(0x1a1a1c), leg = col(0x8a8e94, { metal: 0.8 }); for (let x = 0; x < 48; x++) for (let z = 0; z < 48; z++) { const d = Math.hypot(x - 23.5, z - 23.5); if (d < 20) m.set(x, 9, z, mat); else if (d < 24) m.box(x, 9, z, x + 1, 11, z + 1, pad); } for (const a of [0, 1, 2, 3, 4, 5]) { const x = Math.round(23.5 + Math.cos(a * PI / 3) * 21), z = Math.round(23.5 + Math.sin(a * PI / 3) * 21); m.box(x, 0, z, x + 1, 9, z + 1, leg); } })),
    lamp: () => pm('glamp', () => M16(3, 14, 3, (m) => { m.box(1, 0, 1, 2, 11, 2, smoothC(0x2a2a2e)); m.box(0, 11, 0, 3, 13, 3, glow(0xffe6b0, 2.2, 'night')); m.box(0, 13, 0, 3, 14, 3, smoothC(0x2a2a2e)); })),
    table: (hex) => pm('ptable' + hex, () => M16(16, 12, 16, (m) => { const t = smoothC(hex), lg = smoothC(shade(hex, 0.6)); m.sphere(7.5, 11.5, 7.5, 8, t, (x, y) => (y === 11 ? t : 0)); m.box(7, 0, 7, 9, 11, 9, lg); m.box(4, 0, 4, 12, 1, 12, lg); })),
    chair: (hex) => pm('pchair' + hex, () => M16(8, 14, 8, (m) => { const c = smoothC(hex); for (const [x, z] of [[0, 0], [7, 0], [0, 7], [7, 7]]) m.box(x, 0, z, x + 1, 6, z + 1, c); m.box(0, 6, 0, 8, 7, 8, c); m.box(0, 7, 0, 8, 14, 1, c); })),
    float: () => pm('float', () => M16(14, 8, 14, (m) => { const p = smoothC(0xff7fbf); for (let x = 0; x < 14; x++) for (let z = 0; z < 14; z++) { const d = Math.hypot(x - 6.5, z - 6.5); if (d < 7 && d > 3.5) m.box(x, 0, z, x + 1, 2, z + 1, p); } m.box(9, 2, 5, 11, 7, 7, p); m.box(9, 7, 5, 13, 8, 7, p); m.set(12, 6, 6, smoothC(0x1a1a1a)); })),
    hottub: () => pm('hottub', () => M16(36, 12, 36, (m) => { const w = smoothC(0x2a2a2e), g = col(0xd4a84a, { metal: 1, rough: 0.25 }); m.box(0, 0, 0, 36, 12, 36, w); m.box(0, 11, 0, 36, 12, 36, g); m.box(2, 3, 2, 34, 12, 34, 0); m.box(2, 3, 2, 34, 9, 34, col(0x6ad8e8, { glass: true, jitter: 0.02, edge: 0 })); })),
    // square spindles every 0.25 m under a voxel handrail (length along z)
    balusters: (len, hex) => pm('balusters' + [len, hex], () => M16(1, 12, Math.round(len * 16), (m) => { const c = smoothC(hex); for (let z = 2; z < m.d; z += 4) m.box(0, 0, z, 1, 12, z + 1, c); })),
    // the open-side balustrade of the 14-step stair: spindles on each tread under a raking 2-voxel handrail
    stairRail: (hex) => pm('stairRail' + hex, () => M16(1, 74, 112, (m) => {
      const c = smoothC(hex), top = (z) => Math.round(z / 2 + 14);
      for (let z = 0; z < 112; z++) m.box(0, top(z), z, 1, top(z) + 2, z + 1, c);
      for (let s = 0; s < 14; s++) { const z = s * 8 + 4; m.box(0, (s + 1) * 4, z, 1, top(z), z + 1, c); }
      m.box(0, 4, 0, 1, top(0) + 3, 2, c);
    })),
    // painted name board on two posts (1/64 m, ~0.9 m wide, top 1.2 m): letters proud of the board, a darker rim.
    // One name: deco caps at 2 voxels per pixel; two lines: the plainer 5x7 caps (deco blurs at 1 voxel strokes).
    nameBoard: (lines, board, ink) => pm('board' + [lines, board, ink], () => {
      const one = lines.length === 1, S = one ? 2 : 1, gap = 3, bc = smoothC(board), rim = smoothC(shade(board, 0.65)), ic = smoothC(ink), post = smoothC(0x5a4030);
      const glyph = one ? (ch) => { const g = AF.fontDeco[ch] || AF.fontDeco['?']; return { w: g.w, h: 9, on: (c, r) => g.rows[r][c] === '#' }; }
        : (ch) => { const g = AF.font5x7[ch] || AF.font5x7['?']; return { w: 5, h: 7, on: (c, r) => !!(g[r] & (1 << (4 - c))) }; };
      const L = lines.map((str) => { const gl = [...str].map(glyph); return { gl, w: gl.reduce((a, g) => a + g.w * S, 0) + (gl.length - 1) * S }; });
      const W = Math.max(58, Math.max(...L.map((l) => l.w)) + 8), lineH = L[0].gl[0].h * S, total = L.length * lineH + (L.length - 1) * gap;
      return K.model(W, 77, 5, (m) => {
        for (const x of [5, W - 8]) m.box(x, 0, 1, x + 3, 51, 4, post);
        m.box(0, 51, 0, W, 77, 3, bc); m.box(0, 51, 3, W, 53, 4, rim); m.box(0, 75, 3, W, 77, 4, rim); m.box(0, 53, 3, 2, 75, 4, rim); m.box(W - 2, 53, 3, W, 75, 4, rim);
        L.forEach(({ gl, w }, li) => {
          let x = Math.round((W - w) / 2);
          const y0 = 51 + Math.round((26 + total) / 2) - (li + 1) * lineH - li * gap;
          for (const g of gl) { for (let r = 0; r < g.h; r++) for (let cc = 0; cc < g.w; cc++) if (g.on(cc, r)) m.box(x + cc * S, y0 + (g.h - 1 - r) * S, 3, x + (cc + 1) * S, y0 + (g.h - r) * S, 4, ic); x += (g.w + 1) * S; }
        });
      }, 1 / 64);
    }),
    // kerbside mailbox on a post (top ~1.1 m), door to +z, flag raised on the +x side
    mailbox: (body, flag) => pm('mailbox' + [body, flag], () => M16(8, 20, 10, (m) => {
      const b = smoothC(body), d = smoothC(shade(body, 0.75)), post = smoothC(0x5a4030), f = smoothC(flag);
      m.box(2, 0, 4, 4, 13, 6, post);
      m.box(0, 13, 0, 6, 17, 10, b); m.box(1, 17, 0, 5, 18, 10, b); m.box(1, 14, 9, 5, 17, 10, d); m.set(3, 15, 10 - 1, smoothC(0xd8d4c8));
      m.box(6, 14, 3, 7, 20, 4, smoothC(0x3a3a3e)); m.box(6, 17, 4, 7, 20, 7, f);
    })),
  };
  const screenPositions = [], screenUVs = [], screenIndices = [];
  const screens = K.screens = { mesh: null, quads: 0, redraws: 0 };
  let atlasContext = null, atlasTexture = null, screenWait = 0, screenTime = 0;
  const addScreen = (F, u0, y0, v0, u1, y1, v1, tile) => {
    const alongV = Math.abs(u1 - u0) < Math.abs(v1 - v0);
    const width = Math.min(1.375, alongV ? Math.abs(v1 - v0) : Math.abs(u1 - u0));
    const height = Math.min(0.75, y1 - y0), u = (u0 + u1) / 2, v = (v0 + v1) / 2;
    const back = !alongV && v > 21;
    const a = alongV ? F.w(u, v - F.dir * width / 2) : [F.X(u) + (back ? 1 : -1) * width / 2, F.Z(v)];
    const b = alongV ? F.w(u, v + F.dir * width / 2) : [F.X(u) + (back ? -1 : 1) * width / 2, F.Z(v)];
    const first = screenPositions.length / 3;
    screenPositions.push(a[0], y0, a[1], b[0], y0, b[1], b[0], y0 + height, b[1], a[0], y0 + height, a[1]);
    tile = Number.isInteger(tile) && tile >= 0 && tile < 8 ? tile : 0;
    const left = (tile % 4 * 256 + 0.5) / 1024, right = (tile % 4 * 256 + 255.5) / 1024;
    const top = 1 - (Math.floor(tile / 4) * 256 + 0.5) / 512, bottom = top - 255 / 512;
    screenUVs.push(left, bottom, right, bottom, right, top, left, top);
    screenIndices.push(first, first + 1, first + 2, first, first + 2, first + 3);
    F.place(PROPS.bezel(width, height), alongV ? u + 0.055 : u, y0 - 0.0625, alongV ? v : v + (back ? 0.055 : -0.055), alongV ? F.rotLane : back ? 2 : 0);
    screens.quads++;
  };
  const drawAtlas = (frame) => {
    const ctx = atlasContext;
    for (let tile = 0; tile < 8; tile++) {
      ctx.save(); ctx.translate(tile % 4 * 256, Math.floor(tile / 4) * 256);
      ctx.beginPath(); ctx.rect(0, 0, 256, 256); ctx.clip();
      ctx.fillStyle = '#172027'; ctx.fillRect(0, 0, 256, 256);
      ctx.font = 'bold 16px monospace'; ctx.textBaseline = 'top';
      if (tile === 0) {
        ctx.fillStyle = '#83c5dd'; ctx.fillRect(0, 0, 256, 160);
        ctx.fillStyle = '#ecc16a'; ctx.fillRect(0, 160, 256, 96);
        ctx.fillStyle = '#6c9970'; ctx.fillRect(12, 22, 70, 113);
        ctx.fillStyle = '#efe4c3'; ctx.fillRect(18, 28, 58, 100);
        ctx.fillStyle = '#bc586b'; ctx.fillRect(82, 132, 149, 60);
        for (let actor = 0; actor < 2; actor++) { const x = 100 + actor * 84 + Math.sin(frame * 0.3 + actor) * 3; ctx.fillStyle = '#f0c5a1'; ctx.fillRect(x, 101, 27, 32); ctx.fillStyle = actor ? '#e9ca51' : '#357ca5'; ctx.fillRect(x - 2, 133, 32, 45); }
        ctx.fillStyle = '#ffffff'; ctx.fillText('PORT SOLACE STORIES', 12, 226);
      } else if (tile === 1) {
        ctx.fillStyle = '#387c42'; ctx.fillRect(0, 0, 256, 256);
        ctx.strokeStyle = '#e4efdc'; ctx.lineWidth = 2; ctx.strokeRect(12, 38, 232, 190);
        ctx.beginPath(); ctx.moveTo(128, 38); ctx.lineTo(128, 228); ctx.arc(128, 133, 30, 0, PI * 2); ctx.stroke();
        ctx.strokeRect(12, 90, 32, 82); ctx.strokeRect(212, 90, 32, 82);
        for (let player = 0; player < 12; player++) { ctx.fillStyle = player % 2 ? '#f5f5ee' : '#ef5c4c'; ctx.fillRect(27 + player % 6 * 37 + Math.sin(frame * 0.13 + player) * 8, 62 + Math.floor(player / 6) * 113 + Math.cos(frame * 0.11 + player) * 16, 7, 11); }
        ctx.fillStyle = '#ffffff'; ctx.fillRect(115 + Math.sin(frame * 0.17) * 54, 127 + Math.cos(frame * 0.11) * 30, 5, 5);
        ctx.fillStyle = '#142528'; ctx.fillRect(8, 6, 195, 25); ctx.fillStyle = '#ffffff'; ctx.fillText('PS FC 2 : 1 UNITED', 12, 10);
      } else if (tile === 2) {
        ctx.fillStyle = '#28373e'; for (let line = 0; line < 6; line++) ctx.fillRect(12, 40 + line * 34, 232, 1);
        for (let candle = 0; candle < 22; candle++) { const x = 16 + candle * 10, y = 156 - candle * 3 + Math.sin(candle * 1.5 + frame * 0.1) * 24; ctx.fillStyle = candle % 4 ? '#43d18f' : '#ef6672'; ctx.fillRect(x + 2, y - 9, 1, 40); ctx.fillRect(x, y, 6, 16 + candle % 3 * 3); ctx.fillRect(x, 219 - candle % 5 * 4, 6, 16 + candle % 5 * 4); }
        ctx.fillStyle = '#dfb955'; ctx.fillText('BTC / USD', 12, 9); ctx.fillStyle = '#43d18f'; ctx.fillText('+2.40%', 163, 9);
      } else if (tile === 3) {
        ctx.fillStyle = '#263441'; ctx.fillRect(0, 0, 256, 26); ctx.fillStyle = '#dce8ed'; ctx.fillText('port-solace.js', 10, 5);
        ctx.fillStyle = '#c393e8'; ctx.fillText('const city = {', 28, 45);
        ctx.fillStyle = '#93c997'; ctx.fillText('  friends: 8,', 28, 75); ctx.fillText('  homes: 7,', 28, 105);
        ctx.fillStyle = '#e4bf71'; ctx.fillText('  welcome: true', 28, 135);
        ctx.fillStyle = '#c393e8'; ctx.fillText('};', 28, 165); ctx.fillStyle = '#72b6dc'; ctx.fillText('city.render();', 28, 195);
        if (frame % 6 < 3) { ctx.fillStyle = '#f0f0e6'; ctx.fillRect(165, 195, 2, 19); }
        ctx.fillStyle = '#3c8169'; ctx.fillRect(0, 235, 256, 21); ctx.fillStyle = '#ffffff'; ctx.fillText('build passed', 12, 237);
      } else if (tile === 4) {
        ctx.fillStyle = '#70bfd9'; ctx.fillRect(0, 0, 256, 256); ctx.fillStyle = '#eef5eb'; ctx.fillRect(34, 48, 45, 14); ctx.fillRect(180, 67, 53, 14);
        ctx.fillStyle = '#4b9348'; ctx.fillRect(0, 206, 256, 50); ctx.fillRect(69, 145, 75, 12); ctx.fillRect(169, 111, 63, 12);
        ctx.fillStyle = '#dcc05b'; for (let coin = 0; coin < 5; coin++) ctx.fillRect(75 + coin * 13, 124, 7, 11);
        const jump = Math.abs(Math.sin(frame * 0.23)); ctx.fillStyle = '#dc4b57'; ctx.fillRect(22 + frame * 3 % 202, 180 - jump * 66, 15, 18); ctx.fillStyle = '#283441'; ctx.fillRect(22 + frame * 3 % 202, 198 - jump * 66, 15, 8);
        ctx.fillStyle = '#ffffff'; ctx.fillText('PLAYER 1   008400', 12, 12);
      } else if (tile === 5) {
        ctx.fillStyle = '#398eb4'; ctx.fillRect(0, 0, 256, 205); ctx.fillStyle = '#b9dfe2'; ctx.fillRect(134, 35, 110, 100);
        ctx.fillStyle = '#577f91'; ctx.fillRect(150, 52, 28, 60); ctx.fillRect(184, 66, 42, 46);
        ctx.fillStyle = '#f0c9ac'; ctx.fillRect(52, 72, 34, 42); ctx.fillStyle = '#e8eceb'; ctx.fillRect(48, 115, 42, 57);
        ctx.fillStyle = '#b73c48'; ctx.fillRect(0, 165, 256, 40); ctx.fillStyle = '#ffffff'; ctx.fillText('PORT SOLACE NEWS', 10, 177);
        ctx.fillStyle = '#f2e9d3'; ctx.fillRect(0, 216, 256, 40); ctx.fillStyle = '#263441'; ctx.fillText('CITY LIVE  NEW FRIENDS MOVE IN  HARBOUR OPEN', 256 - frame * 4 % 720, 229);
      } else if (tile === 6) {
        ctx.fillStyle = '#e49da8'; ctx.fillText('THE ERAS / LIVE', 13, 13);
        for (let bar = 0; bar < 20; bar++) { const height = 18 + Math.abs(Math.sin(bar * 0.6 + frame * 0.35)) * 150; ctx.fillStyle = bar % 3 ? '#65c6b1' : '#dfad54'; ctx.fillRect(12 + bar * 12, 210 - height, 8, height); }
        ctx.fillStyle = '#eeeeea'; ctx.fillRect(12, 235, 232, 3); ctx.fillStyle = '#e49da8'; ctx.fillRect(12, 235, frame * 3 % 232, 3);
      } else {
        ctx.fillStyle = '#e9add0'; ctx.fillRect(0, 0, 256, 256); ctx.fillStyle = '#78b9ba'; ctx.fillRect(0, 190, 256, 66);
        for (let star = 0; star < 7; star++) { ctx.fillStyle = '#f4d760'; ctx.fillRect(18 + star * 33, 30 + star % 3 * 22, 8, 8); }
        const bounce = Math.sin(frame * 0.27) * 9;
        ctx.fillStyle = '#f7f4df'; ctx.fillRect(95, 79 + bounce, 68, 64); ctx.fillStyle = '#405c78'; ctx.fillRect(105, 96 + bounce, 48, 23); ctx.fillStyle = '#7be6d7'; ctx.fillRect(113, 102 + bounce, 9, 10); ctx.fillRect(135, 102 + bounce, 9, 10);
        ctx.fillStyle = '#d16b93'; ctx.fillRect(106, 143 + bounce, 46, 42); ctx.fillStyle = '#f7f4df'; ctx.fillRect(85, 147 + bounce, 21, 12); ctx.fillRect(152, 147 + bounce, 21, 12);
        ctx.fillStyle = '#ffffff'; ctx.fillText('DREAMHOUSE ADVENTURE', 15, 225);
      }
      ctx.restore();
    }
    atlasTexture.needsUpdate = true; screens.redraws++;
  };
  const buildScreens = () => {
    const canvas = document.createElement('canvas'); canvas.width = 1024; canvas.height = 512;
    atlasContext = canvas.getContext('2d'); atlasTexture = new THREE.CanvasTexture(canvas);
    atlasTexture.colorSpace = THREE.SRGBColorSpace; atlasTexture.generateMipmaps = false;
    atlasTexture.minFilter = atlasTexture.magFilter = THREE.LinearFilter;
    drawAtlas(0);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(screenPositions, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(screenUVs, 2)); geo.setIndex(screenIndices); geo.computeBoundingSphere();
    screens.mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: atlasTexture, toneMapped: false, side: THREE.DoubleSide }));
    screens.mesh.name = 'colony-screen-atlas'; AF.scene.add(screens.mesh);
  };
  AF.onTick('colony-screens', 705, (dt) => {
    if (!screens.mesh) return;
    const cp = AF.camera.position;
    let near = false;
    for (let plot = 0; plot < WS.plots.length; plot++) {
      const pl = WS.plots[plot], dx = Math.max(pl.x0 - cp.x, 0, cp.x - pl.x1), dz = Math.max(pl.z0 - cp.z, 0, cp.z - pl.z1);
      if (dx * dx + dz * dz + Math.max(0, cp.y - TOP) ** 2 < 4900) { near = true; break; }
    }
    screens.mesh.visible = near;
    if (!near) { screenWait = 0; return; }
    screenTime += dt; screenWait += dt;
    if (screenWait < 0.2) return;
    screenWait %= 0.2; drawAtlas(Math.floor(screenTime * 5));
  });
  const upperHome = (owner, F, th, rec, c) => {
    const u0 = owner === 'dhruv' ? 12.25 : owner === 'kaybee' ? 11.25 : 8.25;
    const u1 = owner === 'tanishk' ? 17.75 : owner === 'kaybee' ? 20.75 : 23.75;
    F.clear(u0, UPPER, 3.25, u1, TOP - 0.25, 23.75);
    F.fill(8.25, CEIL, 3.25, 23.75, UPPER, 23.75, col(th.floor, { pat: 'none', patTop: 'parquet', rough: 0.5 }));
    for (const [a, b] of [[10, 14], [17, 22]]) {
      if (a >= u1 || b <= u0) continue;
      F.fill(Math.max(a, u0), UPPER + 1, 3, Math.min(b, u1), UPPER + 2.5, 3.25, c.glass);
      F.fill(Math.max(a, u0), UPPER + 1, 23.75, Math.min(b, u1), UPPER + 2.5, 24, c.glass);
    }
    if (owner === 'dhruv') {
      F.clear(24, UPPER, 3.25, 29.75, TOP - 0.25, 11.75);
      F.fill(24, CEIL, 3.25, 29.75, UPPER, 11.75, col(th.floor));
      F.clear(12, UPPER, 11, 12.5, UPPER + 2.25, 12.25);
      F.place(PROPS.lintel(1.25, th.trim), 12.125, UPPER + 2.125, 11.625, F.rotLane);
    } else if (owner === 'tanishk' || owner === 'kaybee') {
      const edge = owner === 'tanishk' ? 17.75 : 20.75;
      F.clear(edge - 0.25, UPPER, 11, edge + 0.5, UPPER + 2.25, 12.25);
      F.place(PROPS.lintel(1.25, th.trim), edge + 0.125, UPPER + 2.125, 11.625, F.rotBack);
    } else if (owner === 'kush') {
      F.clear(8.25, UPPER, 24.25, 21.75, TOP - 0.25, 32.75);
      F.fill(8.25, CEIL, 24, 21.75, UPPER, 32.75, col(th.floor));
      F.clear(12, UPPER, 23.5, 13.25, UPPER + 2.25, 24.5);
      F.place(PROPS.lintel(1.25, th.trim), 12.625, UPPER + 2.125, 24, 0);
    }
    F.fill(u0, UPPER, 10.5, u1, TOP - 0.25, 10.75, c.inner);
    F.clear(13, UPPER, 10.25, 14.25, UPPER + 2.25, 11);
    F.place(PROPS.lintel(1.25, th.trim), 13.625, UPPER + 2.125, 10.625, 0);
    // light ceilings under the roofs
    const ceil = ceilC();
    F.fill(u0, TOP - 0.5, 3.25, u1, TOP - 0.25, 23.75, ceil);
    if (owner === 'kush') F.fill(8.25, TOP - 0.5, 24.25, 21.75, TOP - 0.25, 32.75, ceil);
    if (owner === 'dhruv') F.fill(24, TOP - 0.5, 3.25, 29.75, TOP - 0.25, 11.75, ceil);
    // stairs: a plastered stringer with wooden treads, balustrades both sides, a slim rail round the well upstairs
    F.clear(14.25, CEIL - 0.25, 11.25, 16, UPPER + 0.25, 19);
    const tread = col(shade(th.floor, 0.9), { pat: 'none', rough: 0.5 }), rail = col(th.trim, { rough: 0.4 });
    for (let step = 0; step < 14; step++) {
      const v = 12 + step * 0.5, top = FLOOR + (step + 1) * 0.25;
      if (step) F.fill(14.5, FLOOR, v, 15.75, top - 0.25, v + 0.5, c.inner);
      F.fill(14.5, top - 0.25, v, 15.75, top, v + 0.5, tread);
    }
    for (const u of [14.5 + 1 / 32, 15.75 - 1 / 32]) F.place(PROPS.stairRail(th.trim), u, FLOOR, 15.5, 0);
    for (const edge of [14, 16]) { F.fill(edge, UPPER + 0.75, 11.25, edge + 0.25, UPPER + 1, 19, rail); F.place(PROPS.balusters(7.75, th.trim), edge + 0.125, UPPER, 15.125, 0); }
    F.fill(14, UPPER + 0.75, 11, 16.25, UPPER + 1, 11.25, rail); F.place(PROPS.balusters(1.75, th.trim), 15.125, UPPER, 11.125, 1);
    F.level = UPPER;
    // bedroom (v 3.25..10.5): bed against the partition, nightstands, wardrobe between the side windows
    const ub = Math.min(17.5, u1 - 1.6);
    FU.rug(F, ub - 1.6, 7, Math.min(ub + 1.6, u1 - 0.3), 10.25, th.rug, th.accent);
    F.place(PROPS.bed(th.accent, th.trim), ub, UPPER, 10.5 - 17 / 16, 2);
    for (const u of [ub - 1.11, ub + 1.11]) {
      F.place(PROPS.worktable(0.5, 0.5, 0.5, th.trim, th.trim), u, UPPER, 10.2, 0);
      F.place(PROPS.desklamp(th.accent), u, UPPER + 0.5, 10.2, 0);
    }
    F.place(PROPS.wardrobe(th.trim), 15.5, UPPER, 3.25 + 11 / 32, 0);
    FU.plant(F, u0 + 0.6, 3.85, true);
    // study (v 10.75..23.75): shelves on the partition, a desk between the side windows, a reading chair by the front window
    const books = [smoothC(th.accent), smoothC(0x588eac), smoothC(0xb84b48), smoothC(0xe7c25e), smoothC(0x579b72), smoothC(0xe9ddd1)];
    const shelves = [];
    for (let u = u0 + 1; u + 0.75 <= 13; u += 1.6) shelves.push(u);
    if (u1 >= 19.75) shelves.push(17.25, 18.85);
    for (const u of shelves) F.place(PROPS.books(1.5, 2.25, th.trim, books), u, UPPER, 10.75 + 0.1875, 0);
    F.place(PROPS.worktable(1.5, 0.75, 0.75, th.floor, th.trim), 15.5, UPPER, 23.35, 0);
    F.place(PROPS.chair(th.sofa), 15.5, UPPER, 22.4, 0);
    F.place(PROPS.monitorStand(), 15.5, UPPER + 0.75, 23.4, 2);
    FU.screen(F, 15.21875, UPPER + 0.9375, 23.33, 15.78125, UPPER + 1.25, 23.33, SCREEN_THEME[owner]);
    F.place(PROPS.desklamp(th.accent), 16.05, UPPER + 0.75, 23.4, 0);
    FU.rug(F, u0 + 0.5, 17.5, Math.min(u0 + 3.5, 13.75), 22.5, th.rug, th.accent);
    F.place(PROPS.sofa(th.sofa, 0.875), u0 + 1.25, UPPER, 20, F.rotBack);
    FU.lamp(F, u0 + 0.45, 21.1);
    FU.plant(F, u1 - 0.6, 23.1, true);
    if (owner === 'kaybee') F.place(PROPS.hat(), ub, UPPER + 0.5625, 8.7, 0);
    if (owner === 'diksha') F.place(PROPS.guitar(), u1 - 0.3, UPPER, 20, F.rotLane);
    if (owner === 'hunar') F.place(PROPS.mirror(), u1 - 0.05, UPPER + 1.1, 5.5, F.rotLane);
    F.level = FLOOR;
    rec.upper = { y: UPPER, slab: F.w(14.75, 9.5), stair: F.w(15.125, 12), steps: 14, rise: 0.25, tread: 0.5 };
    const lampC = glow(0xfff4dc, 1.5, 'always');
    for (const [u, v] of [[ub, 6.5], [(u0 + u1) / 2, 17]]) {
      F.fill(u - 0.5, TOP - 0.75, v - 0.5, u + 0.5, TOP - 0.5, v + 0.5, lampC);
      const [x, z] = F.w(u, v); AF.addLight({ x, y: TOP - 1.1, z, color: 0xffe6c0, intensity: 0.8, range: 9, kind: 'interior' });
    }
  };
  // an inner plaster skin over walls of material `wallM` (dark facades get light rooms); skips glass, trim and openings
  const lineWalls = (F, u0, v0, u1, v1, y0, y1, wallM, liner) => {
    const q = 0.25, h = q / 2;
    const skin = (ou, ov, iu, iv) => {
      const [ox, oz] = F.w(ou + h, ov + h), [ix, iz] = F.w(iu + h, iv + h);
      for (let y = y0; y < y1; y += q) if (W.getM(ox, y + h, oz) === wallM && !W.getM(ix, y + h, iz)) W.setM(ix, y + h, iz, liner);
    };
    for (let v = v0; v < v1; v += q) { skin(u0 - q, v, u0, v); skin(u1, v, u1 - q, v); }
    for (let u = u0; u < u1; u += q) { skin(u, v0 - q, u, v0); skin(u, v1, u, v1 - q); }
  };
  // sunken pool (heightmap basin + stepped entry + a water plane), in plot coordinates
  const yardPool = (F, u0, v0, u1, v1, tileHex, copingHex) => {
    const b = F.box(u0, v0, u1, v1), cx = (b[0] + b[2]) / 2, cz = (b[1] + b[3]) / 2, g = Math.round(W.groundY(cx, cz) * 4), wy = g * 0.25 - 0.3;
    const tile = col(tileHex, { pat: 'none', patTop: 'slab', jitter: 0.12 }), cop = col(copingHex, { pat: 'none', patTop: 'slab', jitter: 0.1 });
    F.paint(u0 - 0.75, v0 - 0.75, u1 + 0.75, v1 + 0.75, cop);
    W.ground(b[0], b[1], b[2], b[3], g - 6, tile, tile);
    for (let k = 1; k <= 4; k++) { const e = F.box(u0, v0, u0 + (5 - k) * 0.5, v1); W.ground(e[0], e[1], e[2], e[3], g - 6 + k, tile, tile); }
    const pos = [], idx = []; let n = 0;
    for (let x = b[0]; x < b[2] - 0.01; x += 0.5) for (let z = b[1]; z < b[3] - 0.01; z += 0.5) { pos.push(x, wy, z, x, wy, z + 0.5, x + 0.5, wy, z + 0.5, x + 0.5, wy, z); idx.push(n, n + 1, n + 2, n, n + 2, n + 3); n += 4; }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(pos.map((v, i) => (i % 3 === 1 ? 1 : 0)), 3));
    geo.setIndex(idx); geo.computeBoundingSphere(); geo.userData.kind = 'basin'; geo.userData.waterY = wy;
    AF.addWater(geo); P.pools.push({ x0: b[0], z0: b[1], x1: b[2], z1: b[3], y: wy });
    W.tDirty = true;
    return { cx, cz, wy };
  };
  const leafC = [col(0x4f8a3a, { jitter: 0.7, solid: false }), col(0x3f7430, { jitter: 0.7, solid: false }), col(0x6aa84a, { jitter: 0.7, solid: false })];
  const bush = (F, u, v, r, seed) => { for (let a = -r; a <= r; a += 0.25) for (let b2 = -r; b2 <= r; b2 += 0.25) { const d = Math.hypot(a, b2) / r, hsh = AF.hash2((u + a) * 4 | 0, (v + b2) * 4 + seed | 0); if (d > 1 - hsh * 0.25) continue; const h = 0.25 + Math.round((1 - d * d) * r * 1.4 * 4) / 4; F.fill(u + a, 0.25, v + b2, u + a + 0.25, 0.25 + h, v + b2 + 0.25, leafC[(hsh * 3) | 0]); } };
  const flowerBed = (F, u0, v0, u1, v1, cols) => {
    F.paint(u0, v0, u1, v1, col(0x5a4030, { jitter: 0.5 }));
    const fc = cols.map((h) => col(h, { jitter: 0.3, solid: false }));
    for (let u = u0; u < u1; u += 0.25) for (let v = v0; v < v1; v += 0.25) { const q = AF.hash2(u * 4 | 0, v * 4 | 0); if (q < 0.45) F.fill(u, 0.25, v, u + 0.25, 0.5, v + 0.25, leafC[q < 0.15 ? 1 : 0]); else if (q < 0.7) F.fill(u, 0.25, v, u + 0.25, 0.5 + (q < 0.55 ? 0.25 : 0), v + 0.25, fc[(q * 97 | 0) % fc.length]); }
  };
  const stones = (F, u0, v, u1) => { const c = col(0xcfc6b4, { pat: 'none', patTop: 'slab', jitter: 0.2 }); for (let u = u0; u < u1; u += 1.25) F.paint(u, v, u + 0.75, v + 0.75, c); };
  const tree = (F, u, v, species, size, seed) => { if (!AF.TREEKIT) return; const [x, z] = F.w(u, v); AF.TREEKIT.place(x, z, species, size ? 0.65 : 0.5, seed); };   // garden-sized trees
  const BATH_V = { kaybee: 18.25 };   // bathroom door (v) off the back wall; everyone else at 5 (tanishk 6.75)
  const upgradeHome = (owner, F, th, rec) => {
    const wall = col(th.wall, { pat: 'stucco', rough: 0.9, jitter: 0.12 }), trim = col(th.trim, { rough: 0.5 }), roof = col(th.roof, { pat: 'none', patTop: 'tar' });
    const glass = col(0xa9c9d6, { glass: true, jitter: 0.05, edge: 0 }), win = AF.MAT.winApartment;
    // ---- kitchen: fridge, a cooktop, a sink with a tap
    F.place(PROPS.fridge(), 14.55, FLOOR, 3.66, 0);
    F.place(PROPS.cooktop(), 9.5, FLOOR + 0.875, 3.75, 0);
    F.place(PROPS.kitchenSink(), 12, FLOOR + 0.875, 3.6, 0);
    // ---- the bathroom annex behind the house
    const dv = BATH_V[owner] ?? (owner === 'tanishk' ? 6.75 : 5), a = dv - 1.25, b = a + 5.5;
    F.fill(24, 0.25, a, 29.5, CEIL, b, wall); F.fill(23.75, CEIL - 0.25, a - 0.25, 29.75, CEIL, b + 0.25, trim);
    F.clear(24, FLOOR, a + 0.25, 29.25, CEIL - 0.25, b - 0.25);
    F.fill(24, 0.25, a + 0.25, 29.25, FLOOR, b - 0.25, col(0xe8eef2, { pat: 'none', patTop: 'slab', rough: 0.3 }));
    F.fill(24, CEIL - 0.5, a + 0.25, 29.25, CEIL - 0.25, b - 0.25, ceilC());
    F.clear(23.5, FLOOR, dv, 24.5, 2.75, dv + 1.25);
    F.place(PROPS.lintel(1.25, th.trim), 24, FLOOR + 2.125, dv + 0.625, F.rotLane);
    F.fill(29.25, 1.75, a + 2, 29.5, 2.75, a + 3.5, glass);
    F.place(PROPS.toilet(), 28.75, FLOOR, a + 1, F.rotLane);
    F.place(PROPS.sink(), 27.75, FLOOR, b - 0.55, 2);
    F.place(PROPS.tub(), 25.4, FLOOR, a + 4.1, (F.rotLane + 1) % 4);
    F.fill(26.5, CEIL - 0.75, a + 2.25, 27.25, CEIL - 0.5, a + 3, glow(0xfff4dc, 1.5, 'always'));
    F.place(PROPS.mirror(), 27.75, 1.5, b - 0.3, 2);
    { const [x, z] = F.w(26.75, a + 2.75); AF.addLight({ x, y: CEIL - 0.9, z, color: 0xfff0dc, intensity: 0.6, range: 6, kind: 'interior' }); }
    // ---- patio door onto the garden + a patio
    F.clear(23.5, FLOOR, 12, 24.5, 2.75, 13.25);
    F.place(PROPS.lintel(1.25, th.trim), 24, FLOOR + 2.125, 12.625, F.rotBack);
    F.paint(24, 11, 30.5, 17, col(0xd8cfbe, { pat: 'none', patTop: 'slab', jitter: 0.25 }));
    stones(F, 31, 13, 38);
    F.place(PROPS.lamp(), 30.75, 0.25, 11.25, 0); F.place(PROPS.lamp(), 30.75, 0.25, 16.5, 0);
    // ---- the silhouette
    const inner = th.inner ? smoothC(th.inner, { rough: 0.9 }) : wall;
    SHAPE[owner](F, th, { wall, trim, roof, glass, win, inner });
    upperHome(owner, F, th, rec, { wall, trim, roof, glass, win, inner });
    if (th.inner) {
      lineWalls(F, 8.25, 3.25, 23.75, 23.75, FLOOR, CEIL - 0.25, wall, inner);
      lineWalls(F, 8.25, 3.25, owner === 'tanishk' ? 17.75 : 23.75, 23.75, UPPER, TOP - 0.5, wall, inner);
    }
    // ---- the garden
    GARDEN[owner](F, th);
    rec.box[4] = TOP + 6;
  };
  const SHAPE = {
    niranjan(F, th, c) {        // studio loft: a glass-fronted rooftop music room and a neon guitar climbing the facade
      F.fill(14, TOP, 6, 23, TOP + 3, 21, c.wall); F.fill(13.75, TOP + 3, 5.75, 23.25, TOP + 3.25, 21.25, c.trim);
      F.fill(14, TOP + 0.5, 7, 14.25, TOP + 2.5, 20, c.glass); F.fill(14, TOP + 0.25, 7, 14.25, TOP + 0.5, 20, glow(th.accent, 1.2, 'night'));
      const neon = glow(th.accent, 2.2, 'night'), neon2 = glow(0xffe0a0, 2.0, 'night');
      const ring = (vc, yc, r) => { for (let v = vc - r - 0.25; v < vc + r + 0.25; v += 0.25) for (let y = yc - r - 0.25; y < yc + r + 0.25; y += 0.25) if (Math.abs(Math.hypot(v + 0.125 - vc, y + 0.125 - yc) - r) < 0.16) F.fill(7.75, y, v, 8, y + 0.25, v + 0.25, neon); };
      ring(11, CEIL + 0.95, 0.9); ring(11, CEIL + 2.1, 0.62);
      F.fill(7.75, CEIL + 1.25, 10.75, 8, CEIL + 1.5, 11.25, neon2);
      F.fill(7.75, CEIL + 2.75, 10.875, 8, TOP + 1.5, 11.125, neon2); F.fill(7.75, TOP + 1.5, 10.75, 8, TOP + 2.0, 11.25, neon);
    },
    dhruv(F, th, c) {           // modern: a set-back upper floor with a glass balcony, cantilevered out over the garden, solar panels
      F.clear(7.75, CEIL + 0.25, 2.75, 12, TOP + 0.5, 24.25);
      F.fill(7.75, CEIL + 0.25, 2.75, 8, CEIL + 1.25, 24.25, c.glass); F.fill(8, CEIL + 0.25, 2.75, 12, CEIL + 1.25, 3, c.glass); F.fill(8, CEIL + 0.25, 24, 12, CEIL + 1.25, 24.25, c.glass);
      F.fill(12, CEIL + 0.25, 3, 12.25, TOP, 24, c.wall);
      for (const [v0, v1] of [[4, 11], [13, 22.5]]) F.fill(12, CEIL + 0.75, v0, 12.25, TOP - 0.75, v1, c.glass);
      F.fill(24, CEIL, 3, 30, TOP, 12, c.wall); F.fill(29.75, CEIL + 0.75, 4, 30, TOP - 0.75, 11, c.glass);
      F.fill(24.25, CEIL, 3, 30, CEIL + 0.25, 12, glow(th.accent, 1.6));
      F.fill(11.75, TOP - 0.25, 2.75, 24.25, TOP + 0.5, 24.25, c.trim); F.fill(23.75, TOP - 0.25, 2.75, 30.25, TOP + 0.5, 12.25, c.trim);
      F.clear(12.25, TOP, 3.25, 23.75, TOP + 0.5, 23.75); F.clear(23.75, TOP, 3.25, 29.75, TOP + 0.5, 11.75);
      F.fill(12.25, TOP - 0.25, 3.25, 23.75, TOP, 23.75, c.roof); F.fill(23.75, TOP - 0.25, 3.25, 29.75, TOP, 11.75, c.roof);
      const pv = col(0x1d2c4a, { metal: 0.6, rough: 0.2 });
      for (let v = 5; v < 22; v += 2.5) F.fill(14, TOP, v, 22, TOP + 0.25, v + 1.75, pv);
    },
    hunar(F, th, c) {           // dreamhouse: a pink gable roof, a round turret with a cone cap, pink shutters
      F.clear(7.75, TOP, 2.75, 24.25, TOP + 0.5, 24.25);
      for (let s = 0; s < 17; s++) F.fill(7.75 + s * 0.5, TOP - 0.25 + s * 0.25, 2.5, 24.25 - s * 0.5, TOP + s * 0.25, 24.5, c.roof);
      for (let s = 0; s < 15; s++) { F.fill(8 + s * 0.5, TOP + s * 0.25, 2.75, 24 - s * 0.5, TOP + 0.25 + s * 0.25, 3, c.wall); F.fill(8 + s * 0.5, TOP + s * 0.25, 24, 24 - s * 0.5, TOP + 0.25 + s * 0.25, 24.25, c.wall); }
      F.fill(15, TOP + 1, 2.5, 17, TOP + 2.5, 2.75, glow(th.accent, 1.8, 'night'));
      const [tx, tz] = F.w(6, 2.5), tw = col(0xffffff, { pat: 'stucco' }), cone = col(th.roof, { pat: 'none' });
      for (let y = 0.25; y < TOP + 1; y += 0.25) W.eachCol(tx - 2.5, tz - 2.5, tx + 2.5, tz + 2.5, (bx, bz, i, x, z) => { const d = Math.hypot(x - tx, z - tz); if (d < 2.3 && d > 1.8) W.setM(x, y + 0.01, z, (y > 4.5 && y < 6 && ((bx + bz) & 3) === 0) ? glow(0xffd0e8, 1.5, 'night') : tw); });
      for (let k = 0; k < 14; k++) { const r = 2.6 - k * 0.2, y = TOP + 1 + k * 0.25; W.eachCol(tx - r, tz - r, tx + r, tz + r, (bx, bz, i, x, z) => { if (Math.hypot(x - tx, z - tz) < r) W.setM(x, y + 0.01, z, cone); }); }
      for (const [v0, v1] of WIN_F) { F.fill(7.75, CEIL + 1, v0 - 0.5, 8, CEIL + 2.75, v0, smoothC(th.accent)); F.fill(7.75, CEIL + 1, v1, 8, CEIL + 2.75, v1 + 0.5, smoothC(th.accent)); }
    },
    tanishk(F, th, c) {         // penthouse: a gold-railed roof terrace over the back half, gold crown line
      F.clear(18, CEIL + 0.25, 2.75, 24.25, TOP + 0.5, 24.25);
      F.fill(17.75, CEIL + 0.25, 3, 18, TOP, 24, c.wall);
      for (const [v0, v1] of [[4.5, 10.5], [16.5, 22.5]]) F.fill(17.75, CEIL + 0.5, v0, 18, TOP - 0.75, v1, c.glass);
      F.fill(17.75, CEIL + 0.5, 11.5, 18, CEIL + 3, 15.5, c.glass);
      const gold = col(0xd4a84a, { metal: 1, rough: 0.25 });
      F.fill(23.75, CEIL + 0.25, 2.75, 24.25, CEIL + 1.25, 24.25, c.glass); F.fill(23.75, CEIL + 1.25, 2.75, 24.25, CEIL + 1.5, 24.25, gold);
      F.fill(18, CEIL + 0.25, 2.75, 24.25, CEIL + 1.25, 3, c.glass); F.fill(18, CEIL + 0.25, 24, 24.25, CEIL + 1.25, 24.25, c.glass);
      F.fill(18, CEIL + 1.25, 2.75, 24.25, CEIL + 1.5, 3, gold); F.fill(18, CEIL + 1.25, 24, 24.25, CEIL + 1.5, 24.25, gold);
      F.fill(7.75, TOP - 0.25, 2.75, 18.25, TOP + 0.5, 24.25, c.trim); F.clear(8.25, TOP, 3.25, 17.75, TOP + 0.5, 23.75); F.fill(8.25, TOP - 0.25, 3.25, 17.75, TOP, 23.75, c.roof);
      F.fill(7.75, TOP + 0.5, 2.75, 18.25, TOP + 0.75, 3, glow(0xf7931a, 1.4, 'night'));
      F.place(PROPS.hottub(), 21, CEIL + 0.25, 7, 0); F.place(PROPS.lounger(0xd4a84a), 21, CEIL + 0.25, 15, F.rotLane); F.place(PROPS.lounger(0xd4a84a), 21, CEIL + 0.25, 18, F.rotLane);      F.place(PROPS.umbrella(0x1d1d20, 0xd4a84a), 21.5, CEIL + 0.25, 21.5, 0);
    },
    diksha(F, th, c) {          // cottage: a steep lavender gable across the house, a brick chimney, window boxes
      F.clear(7.75, TOP, 2.75, 24.25, TOP + 0.5, 24.25);
      for (let s = 0; s < 15; s++) F.fill(7.5, TOP - 0.25 + s * 0.25, 2.5 + s * 0.75, 24.5, TOP + s * 0.25, 24.5 - s * 0.75, c.roof);
      for (let s = 0; s < 14; s++) { F.fill(7.75, TOP + s * 0.25, 3 + s * 0.75, 8, TOP + 0.25 + s * 0.25, 24 - s * 0.75, c.wall); F.fill(24, TOP + s * 0.25, 3 + s * 0.75, 24.25, TOP + 0.25 + s * 0.25, 24 - s * 0.75, c.wall); }
      F.fill(7.5, TOP + 0.75, 12.5, 7.75, TOP + 2, 14.5, glow(0xffe6c0, 1.6, 'night'));
      const brick = col(0x9a4a3a, { pat: 'brick' });
      F.fill(20, TOP, 18, 21.25, TOP + 4.75, 19.25, brick); F.fill(19.75, TOP + 4.75, 17.75, 21.5, TOP + 5, 19.5, col(0x5a5a5a));
      const box = smoothC(0xfaf6ff), fl = [col(0xff8fc8, { solid: false }), col(0xc27ad6, { solid: false }), col(0xfff0a0, { solid: false })];
      for (const [v0, v1] of [[4, 8.75], [13.25, 22.75]]) { F.fill(7.5, 1.0, v0, 8, 1.25, v1, box); for (let v = v0; v < v1; v += 0.25) F.fill(7.5, 1.25, v, 7.75, 1.5, v + 0.25, fl[((v * 4) | 0) % 3]); }
    },
    kush(F, th, c) {            // L-shape: a second storey over the garage and a green roof garden
      F.fill(8, 3.75, 24, 22, TOP, 33, c.wall);
      for (const [v0, v1] of [[25.5, 31.5]]) F.fill(8, CEIL + 1, v0, 8.25, CEIL + 2.75, v1, c.glass);
      F.fill(12, CEIL + 1, 32.75, 18, CEIL + 2.75, 33, c.glass); F.fill(21.75, CEIL + 1, 26, 22, CEIL + 2.75, 31, c.glass);
      F.clear(8.25, TOP, 23.75, 21.75, TOP + 0.5, 24.25);
      F.fill(7.75, TOP - 0.25, 23.75, 22.25, TOP + 0.5, 33.25, c.trim); F.clear(8.25, TOP, 24, 21.75, TOP + 0.5, 32.75);
      const turf = col(0x5f9a3a, { jitter: 0.9 });
      F.fill(8.25, TOP - 0.25, 3.25, 23.75, TOP, 23.75, turf); F.fill(8.25, TOP - 0.25, 24, 21.75, TOP, 32.75, turf);
      for (const [u, v] of [[10, 6], [20, 6], [10, 20], [16, 29], [20, 20]]) { F.fill(u, TOP, v, u + 1.5, TOP + 0.5, v + 1.5, smoothC(0x6a4a2a)); F.fill(u + 0.25, TOP + 0.5, v + 0.25, u + 1.25, TOP + 1.25, v + 1.25, leafC[1]); }
      F.fill(12, TOP, 12, 18, TOP + 0.25, 15, smoothC(0x8a6a4a)); F.fill(12.5, TOP + 0.25, 12.5, 17.5, TOP + 0.5, 14.5, smoothC(th.accent));
    },
    kaybee(F, th, c) {          // ship: a narrow upper 'cabin' with portholes, wooden deck rails, a crow's nest by the flag
      F.clear(7.75, CEIL + 0.25, 2.75, 11, TOP + 0.5, 24.25); F.clear(21, CEIL + 0.25, 2.75, 24.25, TOP + 0.5, 24.25);
      F.fill(11, CEIL + 0.25, 3, 11.25, TOP, 24, c.wall); F.fill(20.75, CEIL + 0.25, 3, 21, TOP, 24, c.wall);
      const port = c.glass, brass = col(0xd8b04a, { metal: 1 });
      for (let v = 5; v < 23; v += 3) { F.fill(11, CEIL + 1.5, v, 11.25, CEIL + 2.25, v + 0.75, port); F.fill(10.75, CEIL + 1.25, v - 0.25, 11, CEIL + 1.5, v + 1, brass); F.fill(20.75, CEIL + 1.5, v, 21, CEIL + 2.25, v + 0.75, port); }
      const wood = col(0x8a5a34, { pat: 'none' });
      for (const u of [7.75, 23.75]) { F.fill(u, CEIL + 1, 2.75, u + 0.25, CEIL + 1.25, 24.25, wood); for (let v = 3; v < 24.25; v += 1.5) F.fill(u, CEIL + 0.25, v, u + 0.25, CEIL + 1, v + 0.25, wood); }
      F.fill(10.75, TOP - 0.25, 2.75, 21.25, TOP + 0.5, 24.25, c.trim); F.clear(11.25, TOP, 3.25, 20.75, TOP + 0.5, 23.75); F.fill(11.25, TOP - 0.25, 3.25, 20.75, TOP, 23.75, wood);
      F.fill(19.75, TOP, 19.75, 20.25, TOP + 5.5, 20.25, wood);
      F.fill(18.75, TOP + 3.5, 18.75, 21.25, TOP + 3.75, 21.25, wood); F.fill(18.75, TOP + 3.75, 18.75, 21.25, TOP + 4.25, 19, wood); F.fill(18.75, TOP + 3.75, 21, 21.25, TOP + 4.25, 21.25, wood); F.fill(18.75, TOP + 3.75, 18.75, 19, TOP + 4.25, 21.25, wood);
      F.fill(7.5, 1.5, 12, 7.75, 2.25, 12.75, col(0xf2f2f2)); F.fill(7.5, 1.75, 12.25, 7.75, 2.0, 12.5, col(0xc8322a));   // lifebuoy
    },
  };
  const GARDEN = {
    niranjan(F) {
      // a back-garden stage under string lights, two benches for the audience
      const deck = col(0x8a5a34, { pat: 'none', patTop: 'plank' }), post = col(0x3a2a20), bulb = glow(0xffd8a0, 2.4, 'night');
      F.fill(37, 0.25, 5, 45, 0.75, 13, deck);
      for (const [u, v] of [[37, 5], [44.75, 5], [37, 12.75], [44.75, 12.75]]) F.fill(u, 0.75, v, u + 0.25, 4, v + 0.25, post);
      F.fill(37, 4, 5, 45, 4.25, 5.25, post); F.fill(37, 4, 12.75, 45, 4.25, 13, post);
      for (let u = 37.5; u < 45; u += 1) { F.fill(u, 3.75, 5, u + 0.25, 4.0, 5.25, bulb); F.fill(u, 3.75, 12.75, u + 0.25, 4.0, 13, bulb); }
      F.place(PROPS.guitar(), 41, 0.75, 9, F.rotBack); F.place(PROPS.floorlamp(0xffb060), 38, 0.75, 6, 0);
      for (const u of [31, 33.5]) F.fill(u, 0.25, 6, u + 0.75, 0.75, 12, col(0x6a4a2a));
      { const [x, z] = F.w(41, 9); AF.addLight({ x, y: 3.5, z, color: 0xffc880, intensity: 0.9, range: 9, kind: 'porch' }); }
      flowerBed(F, 32, 20, 47, 21.5, [0xff9a3c, 0xe0c078, 0x7a2a36]);
      for (const [u, v] of [[33, 29], [46.5, 29], [40, 26]]) bush(F, u, v, 1.0, u + v * 3);
      tree(F, 47.5, 17, 'maple-gold', 0, 71); tree(F, 32, 26, 'oak', 0, 72);
    },
    dhruv(F) {
      yardPool(F, 34, 4, 47, 10, 0x3a8ac8, 0xe8e8e4);
      for (const v of [11.5, 13.25]) F.place(PROPS.lounger(0x2d4a7a), 41 + (v - 11.5) * 2, 0.25, v + 0.5, (F.rotLane + 1) % 4);
      F.place(PROPS.umbrella(0xffffff, 0x3aa0ff), 45.5, 0.25, 13, 0);
      F.place(PROPS.table(0xe8e8e4), 26.5, 0.25, 14.5, 0); for (const [u, v, r] of [[25.25, 14.5, 3], [27.75, 14.5, 1]]) F.place(PROPS.chair(0x2d3e57), u, 0.25, v, (F.rotLane + r) % 4);
      F.place(PROPS.bbq(), 29, 0.25, 12, 0);
      flowerBed(F, 32, 20, 47, 21.5, [0x3aa0ff, 0xffffff, 0x9ad0ff]);
      for (const [u, v] of [[33, 30], [46.5, 30], [40, 25]]) bush(F, u, v, 1.1, u);
      tree(F, 47, 17, 'maple', 0, 11); tree(F, 34, 28, 'birch', 0, 12); tree(F, 46, 32, 'pine', 0, 13);
    },
    hunar(F) {
      const pl = yardPool(F, 35, 13, 45, 21, 0xff9fcf, 0xffffff);
      F.place(PROPS.float(), 40, pl.wy + 0.05, 17, 0);
      for (const v of [9.5, 11.25]) F.place(PROPS.lounger(0xff5fae), 38 + (v - 9.5) * 2.5, 0.25, v, (F.rotLane + 1) % 4);
      F.place(PROPS.umbrella(0xffffff, 0xff4fa3), 45.5, 0.25, 10, 0);
      F.place(PROPS.table(0xffffff), 26.5, 0.25, 14.5, 0); for (const [u, v, r] of [[25.25, 14.5, 3], [27.75, 14.5, 1]]) F.place(PROPS.chair(0xff7fbf), u, 0.25, v, (F.rotLane + r) % 4);
      flowerBed(F, 33, 24, 47, 25.5, [0xff4fa3, 0xffc4e1, 0xffffff, 0xc02a7a]); flowerBed(F, 33, 3, 47, 4.5, [0xff4fa3, 0xffc4e1, 0xff8fc8]);
      for (const [u, v] of [[34, 30], [40, 30], [46, 30]]) bush(F, u, v, 0.9, u + 3);
      tree(F, 47.5, 7, 'maple-red', 0, 21); tree(F, 32.5, 8, 'sweetgum', 0, 22);
    },
    tanishk(F) {
      yardPool(F, 33, 6, 47, 13, 0x1d2c3a, 0xd4a84a);
      for (const u of [35, 38, 41, 44]) F.place(PROPS.lounger(0x202024), u, 0.25, 15.5, (F.rotLane + 1) % 4);
      F.place(PROPS.umbrella(0x1d1d20, 0xd4a84a), 46.5, 0.25, 17.5, 0);
      F.place(PROPS.bbq(), 29, 0.25, 12, 0);
      const gold = col(0xd4a84a, { metal: 1, rough: 0.25 });
      F.fill(38, 0.25, 22, 41, 0.75, 25, smoothC(0x2e2e33)); F.fill(39, 0.75, 23, 40, 2.75, 24, gold); F.fill(38.75, 2.75, 22.75, 40.25, 3.25, 24.25, glow(0xf7931a, 1.6, 'night'));   // a gold BTC plinth
      for (const [u, v] of [[33, 29], [46.5, 29], [33, 20], [46.5, 21]]) bush(F, u, v, 1.0, u * 2);
      tree(F, 48, 3, 'pine', 0, 31); tree(F, 32, 3, 'pine', 0, 32);
    },
    diksha(F) {
      F.place(PROPS.swing(0x8e5ad6), 40, 0.25, 9, F.rotLane);
      flowerBed(F, 32, 16, 47, 18, [0xc27ad6, 0xd6b1e8, 0xff8fc8, 0xfff0a0]); flowerBed(F, 32, 20, 47, 22, [0x8e5ad6, 0xffffff, 0xf2c6e6]);
      F.place(PROPS.table(0xfaf6ff), 26.5, 0.25, 14.5, 0); for (const [u, v, r] of [[25.25, 14.5, 3], [27.75, 14.5, 1]]) F.place(PROPS.chair(0xc27ad6), u, 0.25, v, (F.rotLane + r) % 4);
      const wood = col(0xfaf6ff); for (const [u, v] of [[36, 26], [42, 26], [36, 31], [42, 31]]) F.fill(u, 0.25, v, u + 0.25, 2.75, v + 0.25, wood);   // a little pergola
      F.fill(35.75, 2.75, 25.75, 42.5, 3.0, 31.5, wood); for (let u = 36; u < 42.5; u += 0.75) F.fill(u, 3.0, 25.75, u + 0.25, 3.25, 31.5, wood);
      for (let v = 26; v < 31.5; v += 0.5) F.fill(35.75, 1.5 + ((v * 4) & 3) * 0.25, v, 36, 3.0, v + 0.25, leafC[2]);
      for (const [u, v] of [[46, 5], [33, 5]]) bush(F, u, v, 1.1, v * 7);
      tree(F, 47, 30, 'maple-orange', 0, 41); tree(F, 32, 11, 'birch', 0, 42);
    },
    kush(F, th) {
      F.place(PROPS.swing(0x2f7a4a), 36, 0.25, 7, F.rotLane);
      F.place(PROPS.trampoline(), 44, 0.25, 8, 0);
      // a vegetable patch + a small koi-free splash pool for Div
      const soil = col(0x5a4030, { jitter: 0.5 }), veg = [col(0x3f8a3a, { solid: false }), col(0xd8502a, { solid: false }), col(0x6ab83a, { solid: false })];
      for (let r = 0; r < 4; r++) { F.paint(33, 20 + r * 1.5, 45, 20.75 + r * 1.5, soil); for (let u = 33; u < 45; u += 0.5) F.fill(u, 0.25, 20 + r * 1.5, u + 0.25, 0.5 + (r & 1) * 0.25, 20.25 + r * 1.5, veg[(r + ((u * 2) | 0)) % 3]); }
      F.place(PROPS.bbq(), 29, 0.25, 12, 0);
      F.place(PROPS.table(0x8a6a4a), 26.5, 0.25, 14.5, 0); for (const [u, v, r] of [[25.25, 14.5, 3], [27.75, 14.5, 1]]) F.place(PROPS.chair(0x2f7a4a), u, 0.25, v, (F.rotLane + r) % 4);
      for (const [u, v] of [[33, 30], [47, 30], [47, 16]]) bush(F, u, v, 1.0, u + v);
      tree(F, 34, 15, 'oak', 1, 51); tree(F, 47, 3, 'maple-gold', 0, 52);
    },
    kaybee(F) {
      // a ship-shaped sandbox with a mast, a swing, and a little lagoon
      const sand = col(0xe8d8a8, { jitter: 0.5 }), wood = col(0x8a5a34, { pat: 'none' });
      F.paint(34, 6, 44, 12, sand);
      for (let u = 34; u < 44; u += 0.25) { const w = u > 41 ? (44 - u) * 1.0 : 3; F.fill(u, 0.25, 9 - w, u + 0.25, 0.75, 9 - w + 0.25, wood); F.fill(u, 0.25, 9 + w - 0.25, u + 0.25, 0.75, 9 + w, wood); }
      F.fill(34, 0.25, 6, 34.25, 0.75, 12, wood); F.fill(38.5, 0.25, 8.75, 38.75, 5, 9, wood); F.fill(37, 3, 8.9, 40.5, 4.75, 9, smoothC(0xf2ece0));
      yardPool(F, 36, 20, 44, 26, 0x2a7a8a, 0x8a5a34);
      F.place(PROPS.swing(0xb8322a), 45, 0.25, 30, F.rotLane);
      F.place(PROPS.table(0x6a4a2a), 26.5, 0.25, 14.5, 0); for (const [u, v, r] of [[25.25, 14.5, 3], [27.75, 14.5, 1]]) F.place(PROPS.chair(0xb8322a), u, 0.25, v, (F.rotLane + r) % 4);
      for (const [u, v] of [[33, 30], [47, 17], [33, 16]]) bush(F, u, v, 1.0, u * 3 + v);
      tree(F, 47.5, 4, 'autumn', 1, 61); tree(F, 31.5, 25, 'maple-red', 0, 62);
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
      upgradeHome(owner, F, th, rec);
      // a painted name board beside the front path + a mailbox across it (on gravel beds, the path edged); neon signs on the back wall
      const gravel = col(0xb8ad98, { pat: 'none', patTop: 'slab', jitter: 0.35 }), edge = col(0x9a9284, { pat: 'none' });
      F.paint(0.5, 7.75, 2.5, 9.25, gravel); F.paint(0.5, 12.75, 2, 13.75, gravel);
      F.paint(0, 9.25, 7.25, 9.5, edge); F.paint(0, 12.5, 7.25, 12.75, edge);
      const board = F.place(PROPS.nameBoard(owner === 'kush' ? ['KUSH &', 'DIVYANGANA'] : [owner.toUpperCase()], th.board, th.ink), 1.5, 0.25, 8.4, F.rotLane);
      const mailbox = F.place(PROPS.mailbox(th.board, th.flag), 1.2, 0.25, 13.3, F.rotLane);
      F.place(K.text(S.sign[0], S.sign[1], S.sign[2]), 23.6, S.sign[4], S.sign[3], F.rotLane);
      if (S.sign2) F.place(K.text(S.sign2[0], S.sign2[1], { font: 'deco', vs: 1 / 10 }), 23.6, 2.3, S.sign2[2], F.rotLane);
      if (S.flag && AF.makeFlag) {
        const [x, z] = F.w(20, 20); F.fill(19.75, TOP, 19.75, 20.25, TOP + 5, 20.25, col(0x6a4a2a));
        AF.makeFlag({ x, y: TOP + 5, z, w: 2.4, h: 1.6, design: 'custom', key: 'jolly', draw: flagDraw.jollyRoger });
      }
      const at = (u, v) => xz(F, u, v);
      const face = (f) => f === 'back' ? F.inYaw : f === 'front' ? F.inYaw + PI : f === 'v+' ? 0 : PI;
      const npc = [];
      for (const q of [S.npc, S.npc2]) if (q) npc.push({ ...at(q[0], q[1]), y: FLOOR, yaw: face(q[3]), pose: q[2] });
      const sp = at(10, 11); sp.y = FLOOR; sp.yaw = F.inYaw;
      WS.homes[owner] = { door: rec.door, spawn: sp, npc, garage: rec.garage, box: rec.box, frame: F, theme: th, upper: rec.upper, board, mailbox };
    }
    buildScreens();
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
  AF.test('colony: furnished upper floors, climbable quarter-metre stairs and merged screens', () => {
    const failures = [];
    for (const owner of Object.keys(TH)) {
      const home = WS.homes[owner], upper = home && home.upper;
      if (!upper) { failures.push(owner + ': no upper floor'); continue; }
      if (!W.getM(upper.slab[0], UPPER - 0.125, upper.slab[1])) failures.push(owner + ': slab missing');
      for (let step = 0; step < upper.steps; step++) {
        const y = FLOOR + (step + 1) * upper.rise, z = upper.stair[1] + step * upper.tread + upper.tread / 2;
        if (!W.getM(upper.stair[0], y - 0.125, z) || W.getM(upper.stair[0], y + 0.125, z) || AF.surfaceBelow(upper.stair[0], z, y + 0.125, 0.5) !== y) failures.push(owner + ': tread ' + step);
        if (AF.boxBlocked(upper.stair[0], y + 0.25, z, 0.3, 2.1)) failures.push(owner + ': headroom ' + step);
      }
      const body = { x: upper.stair[0], y: FLOOR, z: upper.stair[1] - 1, vy: 0, r: 0.3, h: 1.7, onGround: true };
      for (let move = 0; move < 90; move++) { AF.moveBody(body, 0, 0.1, 1 / 60, { step: 0.55 }); if (body.hitWall) { failures.push(owner + ': ascent blocked'); break; } }
      if (Math.abs(body.y - UPPER) > 0.01) failures.push(owner + ': ascent height ' + body.y);
    }
    if (!screens.mesh || screens.quads <= 0 || screens.mesh.geometry.getAttribute('position').count !== screens.quads * 4 || screens.mesh.geometry.groups.length) failures.push('screen mesh');
    return { ok: failures.length === 0, info: failures.join(', ') || Object.keys(WS.homes).length + ' homes; ' + screens.quads + ' screen quads' };
  });
  AF.test('colony: each home has a name board + mailbox at the path and no name text on the facade', () => {
    const failures = [], texts = new Set(textGeo.values());
    const top = (pr) => pr.y + (pr.geo.boundingBox || (pr.geo.computeBoundingBox(), pr.geo.boundingBox)).max.y;
    for (const owner of Object.keys(TH)) {
      const h = WS.homes[owner], F = h && h.frame;
      if (!F) { failures.push(owner + ': no home'); continue; }
      for (const [k, pr, lo, hi] of [['board', h.board, 1.35, 1.55], ['mailbox', h.mailbox, 1.25, 1.55]]) {
        if (!pr || !AF.world.props.includes(pr)) { failures.push(owner + ': no ' + k); continue; }
        const u = F.u(pr.x), t = top(pr);
        if (u < 0 || u > 3 || t < lo || t > hi) failures.push(owner + ': ' + k + ' at u ' + u.toFixed(2) + ' top ' + t.toFixed(2));
      }
      const b = h.box;
      for (const pr of AF.world.props) if (texts.has(pr.geo) && pr.x >= b[0] && pr.x <= b[3] && pr.z >= b[2] && pr.z <= b[5] && F.u(pr.x) < 9 && pr.y > 2) failures.push(owner + ': facade text');
    }
    return { ok: failures.length === 0, info: failures.join(', ') || Object.keys(WS.homes).length + ' boards + mailboxes' };
  });
}

} catch (e) { AF.partError('45-west.js', e); }
