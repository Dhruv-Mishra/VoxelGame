// ================================================================ 31-civic-2.js
try {
// ===== 31-civic-2: PUBLIC LIBRARY + CITY MUSEUM (+ planetarium) + UNION TERMINAL (hall, board, train shed, trains)  (OWNER: civic) =====
{
  const CIV = AF.CIV;
  if (!CIV) throw new Error('31-civic-2 needs AF.CIV from 30-civic.js');
  const W = AF.W, col = AF.col, K = CIV.K, F = CIV.F, face = CIV.face, put = CIV.put, def = CIV.def, M = CIV.M, spot = CIV.spot;
  const hash = AF.hash2;
  // arched window through a wall t thick (face frame f, u centre), glass in the middle layer, stone arch trim
  CIV.archWin = (f, uc, y0, w, h, t = 0.5, o = {}) => {
    const R = w / 2, a = uc - R, b = uc + R;
    f.fill(a, b, y0, y0 + h, -t, 0, 0); f.fill(a, b, y0, y0 + h, -t + 0.25 * (o.gl ?? 0), -t + 0.25 * (o.gl ?? 0) + 0.25, o.glassC ?? K.glass);
    for (let yy = 0; yy < R; yy += 0.25) { const hw = Math.round(Math.sqrt(Math.max(0, R * R - (yy + 0.125) ** 2)) * 4) / 4; if (hw <= 0) break; f.fill(uc - hw, uc + hw, y0 + h + yy, y0 + h + yy + 0.25, -t, 0, 0); f.fill(uc - hw, uc + hw, y0 + h + yy, y0 + h + yy + 0.25, -t + 0.25 * (o.gl ?? 0), -t + 0.25 * (o.gl ?? 0) + 0.25, o.glassC ?? K.glass); }
    for (let yy = 0; yy < R + 0.25; yy += 0.25) { const R2 = R + 0.25, hw = Math.round(Math.sqrt(Math.max(0, R2 * R2 - (yy + 0.125) ** 2)) * 4) / 4; if (hw <= 0) break; f.fill(uc - hw, uc - hw + 0.25, y0 + h + yy, y0 + h + yy + 0.25, 0, 0.25, o.trim ?? K.limeW); f.fill(uc + hw - 0.25, uc + hw, y0 + h + yy, y0 + h + yy + 0.25, 0, 0.25, o.trim ?? K.limeW); }
    f.fill(uc - 0.125, uc + 0.125, y0, y0 + h + R, -t + 0.25 * (o.gl ?? 0), -t + 0.25 * (o.gl ?? 0) + 0.25, o.mull ?? K.bronzeD);
    for (let yy = y0 + 1.5; yy < y0 + h; yy += 1.5) f.fill(a, b, yy, yy + 0.25, -t + 0.25 * (o.gl ?? 0), -t + 0.25 * (o.gl ?? 0) + 0.25, o.mull ?? K.bronzeD);
    f.fill(a - 0.25, b + 0.25, y0 - 0.25, y0, 0, 0.25, o.trim ?? K.limeW);
  };
  // shelves of books painted on the inside face of a wall: room-rect face f, d -0.25..0 (books), back board in the wall
  CIV.bookWall = (f, u0, u1, y0, y1, seed = 1) => {
    for (let y = y0; y < y1 - 0.2; y += 1.25) {
      f.fill(u0, u1, y, y + 0.25, -0.5, 0, K.woodD);
      for (let u = u0; u < u1 - 1e-6; u += 0.25) { const hh = 0.25 * (2 + ((hash(Math.round(u * 4) + seed * 131, Math.round(y * 4)) * 3) | 0)); const c = CIV.BOOKS[(hash(Math.round(u * 4) * 7 + seed, Math.round(y * 4) * 3) * CIV.BOOKS.length) | 0]; if (hash(Math.round(u * 4) + 91, Math.round(y * 4) + seed) < 0.08) continue; f.fill(u, u + 0.25, y + 0.25, Math.min(y1, y + 0.25 + hh), -0.25, 0, c); }
    }
    f.fill(u0 - 0.25, u0, y0, y1, -0.5, 0, K.woodD); f.fill(u1, u1 + 0.25, y0, y1, -0.5, 0, K.woodD);
    for (let u = u0 + 3; u < u1 - 1; u += 3) f.fill(u, u + 0.25, y0, y1, -0.5, 0, K.woodD);
  };
  const S = { lib: null, mus: null, term: null };
  // extra props
  def('lion', () => { const m = M(10, 12, 20), c = K.limeW, d = K.limeD; m.box(0, 0, 0, 10, 2, 20, d); m.box(2, 2, 2, 8, 7, 15, c); m.box(2, 2, 14, 4, 4, 20, c); m.box(6, 2, 14, 8, 4, 20, c); m.box(1, 5, 11, 9, 11, 17, c); m.box(2, 6, 16, 8, 10, 19, c); m.box(3, 9, 18, 7, 10, 19, d); m.set(3, 9, 19, K.black); m.set(6, 9, 19, K.black); m.box(4, 6, 19, 6, 7, 20, d); m.box(4, 5, 0, 6, 8, 2, c); m.box(4, 8, 0, 6, 9, 1, d); for (let y = 5; y < 11; y += 2) { m.box(0, y, 12, 1, y + 1, 16, d); m.box(9, y, 12, 10, y + 1, 16, d); } return m; });
  def('catalogue', () => { const m = M(20, 11, 6); m.box(0, 0, 0, 20, 11, 6, K.oak); m.box(0, 0, 0, 20, 2, 6, K.woodD); for (let x = 1; x < 19; x += 2) for (let y = 3; y < 10; y += 2) { m.set(x, y, 5, K.woodL); m.set(x, y, 5, AF.hash2(x, y) > 0.5 ? K.brass : K.woodL); } m.box(0, 10, 0, 20, 11, 6, K.woodD); return m; });
  def('smalltable', () => { const m = M(8, 4, 8); m.box(0, 3, 0, 8, 4, 8, K.red); for (const [x, z] of [[0, 0], [7, 0], [0, 7], [7, 7]]) m.box(x, 0, z, x + 1, 3, z + 1, K.woodL); m.box(2, 4, 3, 5, 5, 5, K.blue); return m; });
  def('stool', () => { const m = M(3, 3, 3); m.box(0, 2, 0, 3, 3, 3, [K.red, K.blue, K.flowerY][0]); m.box(1, 0, 1, 2, 2, 2, K.woodL); return m; });
  def('rockinghorse', () => { const m = M(4, 9, 12); for (let z = 0; z < 12; z++) m.set(1, Math.round(Math.abs(z - 5.5) * 0.35), z, K.woodD), m.set(2, Math.round(Math.abs(z - 5.5) * 0.35), z, K.woodD); m.box(1, 2, 3, 3, 4, 9, K.woodD); m.box(0, 4, 2, 4, 6, 9, K.white); m.box(1, 6, 8, 3, 9, 11, K.white); m.box(1, 8, 7, 3, 9, 9, K.red); m.set(1, 5, 1, K.red); m.box(1, 5, 4, 3, 7, 6, K.red); return m; });
  def('plantpot', () => { const m = M(6, 10, 6); m.box(1, 0, 1, 5, 3, 5, K.buffD); m.sphere(3, 6, 3, 3, K.leaf, (x, y, z) => (y > 2 && AF.hash3(x, y, z) > 0.3 ? (AF.hash3(z, x, y) > 0.5 ? K.leaf : K.leafD) : 0)); return m; });
  def('showcase', () => { const m = M(16, 10, 8); m.box(0, 0, 0, 16, 5, 8, K.woodD); m.box(0, 5, 0, 16, 10, 8, K.glass); m.box(0, 9, 0, 16, 10, 8, K.brass); for (const x of [0, 15]) for (const z of [0, 7]) m.box(x, 5, z, x + 1, 10, z + 1, K.brass); const cr = [col(0x9b59d0, { jitter: 0.2 }), col(0x3fb0c0, { jitter: 0.2 }), col(0xe0b040, { jitter: 0.2 }), col(0xd05050, { jitter: 0.2 }), col(0xe8e8f0, { jitter: 0.2 })]; for (let i = 0; i < 6; i++) { const x = 2 + i * 2, c = cr[i % 5]; m.box(x, 5, 3, x + 1, 6 + (i % 3), 5, c); m.set(x + 1, 5, 4, cr[(i + 2) % 5]); } return m; });
  def('shipcase', () => { const m = M(20, 14, 8); m.box(0, 0, 0, 20, 5, 8, K.woodD); m.box(0, 5, 0, 20, 14, 8, K.glass); m.box(0, 13, 0, 20, 14, 8, K.brass); for (const x of [0, 19]) for (const z of [0, 7]) m.box(x, 5, z, x + 1, 14, z + 1, K.brass); m.box(3, 5, 3, 17, 7, 5, K.woodD); m.box(4, 7, 3, 16, 8, 5, K.white); for (const x of [6, 10, 14]) { m.box(x, 8, 4, x + 1, 13, 5, K.woodD); m.box(x - 1, 9, 4, x + 2, 12, 5, K.paper); } return m; });
  def('butterflies', () => { const m = M(16, 12, 1); m.box(0, 0, 0, 16, 12, 1, K.woodD); m.box(1, 1, 0, 15, 11, 1, K.paper); const bc = [col(0xe07a2a), col(0x3a7ad8), col(0xe0c030), col(0xc03a6a), col(0x4ab06a)]; for (let i = 0; i < 12; i++) { const x = 2 + (i % 4) * 3.5, y = 2 + ((i / 4) | 0) * 3, c = bc[i % 5]; m.set(x, y, 0, c); m.set(x + 2, y, 0, c); m.set(x, y + 1, 0, c); m.set(x + 2, y + 1, 0, c); m.set(x + 1, y, 0, K.black); m.set(x + 1, y + 1, 0, K.black); } return m; });
  def('newsstand', () => { const m = M(24, 22, 12); m.box(0, 0, 0, 24, 8, 10, K.jade); m.box(0, 8, 0, 24, 9, 10, K.woodD); for (let x = 1; x < 23; x += 3) { m.box(x, 9, 1, x + 2, 11, 3, [K.paper, K.red, K.navy, K.fabricGo][x % 4]); m.box(x, 5, 10, x + 2, 8, 11, [K.paper, K.fabricGo, K.red][x % 3]); } m.box(0, 0, 10, 24, 1, 12, K.woodD); for (const x of [0, 23]) m.box(x, 8, 0, x + 1, 20, 1, K.brass); m.box(0, 19, 0, 24, 22, 12, K.red); for (let x = 0; x < 24; x += 2) m.box(x, 18, 11, x + 1, 19, 12, K.gold); m.box(2, 12, 0, 22, 18, 1, K.woodL); return m; });
  def('shoeshine', () => { const m = M(20, 16, 10); m.box(0, 0, 0, 20, 4, 10, K.woodD); for (const x of [2, 12]) { m.box(x, 4, 2, x + 6, 7, 9, K.fabricR); m.box(x, 7, 8, x + 6, 14, 10, K.fabricR); m.box(x, 4, 2, x + 1, 10, 9, K.brass); m.box(x + 5, 4, 2, x + 6, 10, 9, K.brass); m.box(x + 1, 2, 0, x + 5, 3, 2, K.brass); } m.box(0, 14, 9, 20, 16, 10, K.woodL); return m; });
  def('luggagecart', () => { const m = M(10, 16, 6); m.box(0, 1, 0, 10, 2, 6, K.brass); for (const x of [0, 9]) { m.box(x, 2, 0, x + 1, 16, 1, K.brass); m.box(x, 2, 5, x + 1, 16, 6, K.brass); } m.box(0, 15, 0, 10, 16, 1, K.brass); m.box(0, 15, 5, 10, 16, 6, K.brass); m.box(1, 2, 1, 6, 6, 5, col(0x7a4a2a, { jitter: 0.4 })); m.box(6, 2, 1, 9, 5, 5, K.navy); m.box(1, 6, 1, 5, 9, 5, col(0xb88a5a, { jitter: 0.4 })); m.box(5, 5, 2, 9, 8, 4, K.fabricG); for (const [x, z] of [[1, 0], [8, 0], [1, 5], [8, 5]]) m.set(x, 0, z, K.black); return m; });
  def('trunk', () => { const m = M(8, 6, 5); m.box(0, 0, 0, 8, 6, 5, col(0x6a3f22, { jitter: 0.4 })); m.box(0, 2, 0, 8, 3, 5, K.brass); m.box(3, 3, 4, 5, 4, 5, K.brass); return m; });
  def('pendantT', () => { const m = M(4, 8, 4); m.box(1, 4, 1, 3, 8, 3, K.brass); m.box(0, 0, 0, 4, 4, 4, K.lampG); m.box(1, 0, 1, 3, 1, 3, K.lampA); return m; });
  def('lampstd', () => { const m = M(6, 28, 6); m.box(1, 0, 1, 5, 1, 5, K.iron); m.box(2, 1, 2, 4, 22, 4, K.iron); m.box(1, 22, 1, 5, 27, 5, K.lampA); m.box(2, 27, 2, 4, 28, 4, K.brass); return m; });

  // =====================================================================================================
  // PUBLIC LIBRARY  (lot x -147..-88, z -147..-88; entrance on Library Street, east)
  // =====================================================================================================
  AF.onBuild('civic-library', 300, () => {
    const x0 = -144, z0 = -142, x1 = -96, z1 = -94, G = 1.25, TOP = 13, RRx = -106;   // reading room x0..RRx, z0..-120
    CIV.lotGround('cv-library', K.pave);
    W.ground(-147, -147, -88, -88, 1, K.pave);
    W.ground(-146, -92.5, -134, -89, 1, AF.col('grass')); W.ground(-146, -146, -92, -143, 1, AF.col('grass'));
    F(x0, 0.25, z0, x1, G, z1, K.granite);
    F(x0, G, z0, x1, TOP, z1, K.lime);
    F(x0 + 0.5, G, z0 + 0.5, RRx, TOP - 0.25, -120, 0);                                   // reading room (37.5 x 21.5 x 11.5)
    F(x0 + 0.5, G, -119.5, RRx, 6.25, z1 - 0.5, 0);                                        // children's room + stacks
    F(RRx + 0.5, G, z0 + 0.5, x1 - 0.5, 7.0, z1 - 0.5, 0);                                 // entrance hall
    F(x0 + 0.5, G - 0.25, z0 + 0.5, x1 - 0.5, G, z1 - 0.5, K.floorW);
    CIV.checker(RRx + 0.5, z0 + 0.5, x1 - 0.5, z1 - 0.5, G, K.marbleW, K.marbleB, 1);
    F(x0 + 0.5, TOP - 0.5, z0 + 0.5, RRx, TOP - 0.25, -120, K.plaster);
    for (let x = x0 + 3; x < RRx; x += 3.5) F(x, TOP - 1.0, z0 + 0.5, x + 0.5, TOP - 0.25, -120, K.oak);         // ceiling beams
    F(x0 + 4, TOP - 0.5, -135, RRx - 3, TOP, -127, K.glass);                               // skylight
    F(x0 + 0.5, 5.99, -119.5, RRx, 6.25, z1 - 0.5, K.plaster); F(RRx + 0.5, 6.75, z0 + 0.5, x1 - 0.5, 7.0, z1 - 0.5, K.plaster);
    // openings: reading room <-> entrance hall (wide), <-> south rooms, entrance hall <-> stacks
    F(RRx - 0.01, G, -137, RRx + 0.51, G + 4.5, -123, 0); F(-140, G, -120.01, -128, G + 3.5, -119.49, 0); F(-124, G, -120.01, -110, G + 3.5, -119.49, 0);
    F(RRx - 0.01, G, -112, RRx + 0.51, G + 3.5, -104, 0);
    F(-125.5, G, -119.5, -125, 6.0, z1 - 0.5, K.plaster); F(-125.51, G, -110, -124.99, G + 3, -106, 0);
    // exterior: piers, tall arched windows (north = reading room), rows elsewhere, frieze, cornice, parapet
    const R = [x0, z0, x1, z1];
    const fN = face(R, 'n'), fW = face(R, 'w'), fS = face(R, 's'), fE = face(R, 'e');
    for (let u = 3.25; u < 38; u += 4.5) CIV.archWin(fN, u, 6.0, 2.5, 4.0, 0.5, { gl: 1, glassC: K.glassLit });
    for (let u = 3.25; u < 21; u += 4.5) CIV.archWin(fW, u, 6.0, 2.5, 4.0, 0.5, { gl: 1 });
    CIV.winGrid(fW, 23, 47, 3.5, 1.75, [2.5], 2.5, { glass: true, t: 0.5 }); CIV.winGrid(fW, 23, 47, 3.5, 1.75, [8.0], 2.5, {});
    CIV.winGrid(fS, 1, 47, 3.5, 1.75, [2.5], 2.5, { glass: true, t: 0.5 }); CIV.winGrid(fS, 1, 47, 3.5, 1.75, [8.0], 2.5, {});
    CIV.winGrid(fE, 1, 47, 3.5, 1.75, [8.0], 2.5, { skip: (u) => Math.abs(z0 + u + 118) < 9 });
    CIV.winGrid(fE, 1, 47, 3.5, 1.75, [2.5], 2.5, { glass: true, t: 0.5, skip: (u) => Math.abs(z0 + u + 118) < 9 });
    for (const f of [fN, fW, fS, fE]) {
      for (let u = 1; u < f.len; u += 4.5) f.fill(u - 0.25, u + 0.25, G, TOP - 1.5, 0, 0.25, K.limeW);
      f.fill(-0.25, f.len + 0.25, TOP - 1.5, TOP - 1.0, 0, 0.5, K.limeD); CIV.chevrons(f, 0, f.len, TOP - 1.0, K.goldN, K.limeW);
      f.fill(-0.5, f.len + 0.5, TOP - 0.25, TOP + 0.75, 0, 0.5, K.limeW); f.fill(0, f.len, G, G + 0.5, 0, 0.25, K.granite);
    }
    F(x0 + 0.5, TOP, z0 + 0.5, x1 - 0.5, TOP + 0.5, z1 - 0.5, 0);
    F(x0 + 3.5, TOP, -136, RRx - 2.5, TOP + 1.5, -126, K.limeD); F(x0 + 4, TOP + 1.5, -135.5, RRx - 3, TOP + 2.0, -126.5, K.glass); F(x0 + 4, TOP - 0.25, -135.5, RRx - 3, TOP + 1.5, -126.5, 0);
    for (let x = x0 + 5; x < RRx - 3; x += 3) F(x, TOP + 1.5, -135.5, x + 0.25, TOP + 2.25, -126.5, K.bronzeD);
    F(-102, TOP, -140, -98, TOP + 3, -136, K.limeD); F(-101.5, TOP, -136.01, -100, TOP + 2.25, -135.75, K.bronzeD);
    for (const [vx, vz] of [[-110, -100], [-130, -100], [-140, -110]]) { F(vx, TOP, vz, vx + 1.5, TOP + 1.5, vz + 1.5, K.steelD); F(vx - 0.25, TOP + 1.5, vz - 0.25, vx + 1.75, TOP + 1.75, vz + 1.75, K.steel); }
    CIV.hipRoof(x0 + 1, z0 + 1, x1 - 1, z1 - 1, TOP + 0.5, 0.5, 3);
    CIV.flagpole(-100, TOP + 3.0, -97, 2);
    // PORTICO on Library St: 6 columns, entablature with the name, steps, two stone lions
    const PC = -118;
    F(x1, 0.25, PC - 9, x1 + 5, G, PC + 9, K.granite); F(x1, G - 0.25, PC - 9, x1 + 5, G, PC + 9, K.marbleW);
    CIV.steps('x', -88, -1, PC - 10, PC + 10, 0.25, 4, 0.75, K.limeW, K.limeD);
    for (const oz of [-8, -5, -2.4, 2.4, 5, 8]) CIV.column(x1 + 3.5, PC + oz, G, TOP - 1.5, K.limeN, K.limeD, 0.6);
    F(x1, TOP - 1.5, PC - 9, x1 + 5, TOP, PC + 9, K.limeWN);
    { const f = face([x1, PC - 9, x1 + 5, PC + 9], 'e'); for (let k = 0; k < 4; k++) f.fill(2 + k * 1.5, 16 - k * 1.5, TOP + k * 0.75, TOP + (k + 1) * 0.75, -3.5 + k * 0.5, 0, k % 2 ? K.limeW : K.lime); f.fill(8.25, 9.75, TOP + 3, TOP + 4.5, -1.5, 0, K.goldN); }
    CIV.textProp('PUBLIC LIBRARY', K.bronze, x1 + 5.01, TOP - 1.2, PC, 1, 1 / 9, { bold: true });
    CIV.textProp('KNOWLEDGE IS THE HARBOUR OF THE MIND', K.bronze, x1 + 0.01, G + 5.2, PC, 1, 1 / 20);
    const fEd = face(R, 'e');
    for (const oz of [-4, 0, 4]) CIV.door(fEd, PC + oz - z0, G, 2.5, 4.0, { t: 0.5, transom: 1.25, leaf: K.bronze });
    for (const sz of [-1, 1]) { F(-91.5, 0.25, PC + sz * 11.5 - 1.25, -88.5, 1.75, PC + sz * 11.5 + 1.25, K.limeD); F(-91.75, 1.75, PC + sz * 11.5 - 1.5, -88.25, 2.0, PC + sz * 11.5 + 1.5, K.limeW); }
    for (const sz of [-1, 1]) put('decolamp', x1 + 4.6, G, PC + sz * 8.6, 0, false);
    for (const oz of [-8, -2.4, 2.4, 8]) put('floodlamp', x1 + 4.6, G, PC + oz + 0.8, 1, false);
    AF.addLight({ x: -90, y: 5, z: PC, color: 0xffe0b0, intensity: 1.2, range: 18, kind: 'sign' });
    // --- READING ROOM
    const RF = face([x0 + 0.5, z0 + 0.5, RRx, -120], 'n'), RW = face([x0 + 0.5, z0 + 0.5, RRx, -120], 'w'), RS = face([x0 + 0.5, z0 + 0.5, RRx, -120], 's');
    // mezzanine along north + west walls (y 5.75), railing, book walls on both levels
    const MZ = 5.75;
    F(x0 + 0.5, MZ - 0.5, z0 + 0.5, RRx, MZ, z0 + 3.5, K.oak); F(x0 + 0.5, MZ - 0.5, z0 + 0.5, x0 + 3.5, MZ, -120, K.oak);
    F(x0 + 0.5, MZ - 0.75, z0 + 3.5, RRx, MZ - 0.5, z0 + 3.75, K.woodD); F(x0 + 3.5, MZ - 0.75, z0 + 3.5, x0 + 3.75, MZ - 0.5, -120, K.woodD);
    CIV.rail(x0 + 3.5, z0 + 3.5, RRx, z0 + 3.5, MZ, K.brass, K.woodD, 1.0);
    CIV.rail(x0 + 3.5, z0 + 3.5, x0 + 3.5, -120, MZ, K.brass, K.woodD, 1.0);
    for (let x = x0 + 7; x < RRx; x += 6) F(x, G, z0 + 3.25, x + 0.5, MZ - 0.5, z0 + 3.75, K.woodD);     // mezzanine posts
    for (let z = z0 + 7; z < -120; z += 6) F(x0 + 3.25, G, z, x0 + 3.75, MZ - 0.5, z + 0.5, K.woodD);
    // stair to the mezzanine: along x, just south of the north mezzanine, rising west
    const stTop = CIV.steps('x', -110.5, -1, z0 + 3.75, z0 + 5.5, G, 18, 0.25, K.oak, K.woodD);
    F(stTop - 0.5, G, z0 + 3.5, -110.5, MZ, z0 + 3.75, 0);                                   // gap in the mezzanine edge beam/rail at the stair
    F(stTop, MZ, z0 + 3.5, stTop + 1.75, MZ + 1.0, z0 + 3.75, 0);
    CIV.rail(stTop, z0 + 5.5, -110.5, z0 + 5.5, MZ, K.brass, K.woodD, 1.0);
    // book walls: under + over the mezzanine (north), and the west wall, between the arched windows (north upper level)
    CIV.bookWall(RF, 0.5, RRx - x0 - 0.5, G, MZ - 0.75, 3);
    for (let u = 4.125; u < 37; u += 4.5) CIV.bookWall(RF, u, u + 1.75, MZ, TOP - 1.75, 5 + u);
    CIV.bookWall(RW, 0.5, 21, G, MZ - 0.75, 7); for (let u = 4.125; u < 20; u += 4.5) CIV.bookWall(RW, u, u + 1.75, MZ, TOP - 1.75, 9 + u);
    for (let u = 3; u < 36; u += 5) CIV.bookWall(RS, u, u + 3, G, G + 2.5, 11 + u);
    // 8 long oak tables, 16 green banker's lamps, 32 chairs (sit spots)
    let n = 0;
    for (const tz of [-130.5, -125]) for (const tx of [-135, -128, -121, -114]) {
      put('longtable', tx, G, tz, 0); put('bankers', tx - 1.0, G + 0.75, tz, 0, false); put('bankers', tx + 1.0, G + 0.75, tz, 2, false);
      for (const ox of [-1.4, 0, 1.4]) { if (ox === 0) continue; put('chairG', tx + ox, G, tz - 0.95, 0); put('chairG', tx + ox, G, tz + 0.95, 2); spot('library', tx + ox, G + 0.5, tz - 0.95, 0, 'sit'); spot('library', tx + ox, G + 0.5, tz + 0.95, Math.PI, 'sit'); n += 4; }
      AF.addLight({ x: tx, y: G + 1.5, z: tz, color: 0xaef0b0, intensity: 0.5, range: 6, kind: 'interior' });
    }
    for (const x of [-135, -121]) put('chandelier', x, TOP - 3.2, -130.5, 0, false);
    for (const x of [-128, -114]) put('chandelier', x, TOP - 3.2, -125, 0, false);
    CIV.light(-124, 8, -130, 1.6, 22);
    put('globe', -108, G, -122.5, 0); put('grandfather', -107, G, -121.5, 2);
    CIV.clock(-124, 9.5, -120.24, 2, 1.0);
    CIV.textProp('SILENCE', K.gold, -124, 7.6, -120.24, 2, 1 / 16);
    for (let i = 0; i < 4; i++) spot('library', -140.5 + i * 0.8, MZ, z0 + 2, 0, 'browse');
    for (let i = 0; i < 4; i++) spot('library', -132 + i * 4, G, z0 + 2.8, 0, 'browse', [[-94, PC], [-104, -128], [-132 + i * 4, -134], [-132 + i * 4, z0 + 2.8]]);
    // --- ENTRANCE HALL: circulation desk (curved), card catalogue, reading lamps, notices
    F(-104, G, -124, -101, G + 1.25, -112, K.oak); F(-104.25, G + 1.25, -124.25, -100.75, G + 1.5, -111.75, K.marbleG);
    F(-104, G, -124, -103.75, G + 1.25, -112, K.woodD);
    put('bankers', -102.5, G + 1.5, -121, 1, false); put('typewriter', -102.5, G + 1.5, -115, 1, false);
    spot('library', -104.8, G, -118, Math.PI / 2, 'work'); spot('library', -104.8, G, -114, Math.PI / 2, 'work');
    spot('library', -100.2, G, -118, -Math.PI / 2, 'counter', [[-94, PC], [-100.2, -118]]); spot('library', -100.2, G, -120, -Math.PI / 2, 'counter', [[-94, PC], [-100.2, -120]]);
    put('chair', -105, G, -116, 1); put('chair', -105, G, -120, 1);
    put('catalogue', -101, G, -140.9, 0); put('catalogue', -101, G, -137.5, 2); put('catalogue', -98.7, G, -140.9, 0);
    for (let i = 0; i < 3; i++) spot('library', -101 + i * 1.2, G, -139.6, Math.PI, 'browse', [[-94, PC], [-99, -130], [-101 + i * 1.2, -139.6]]);
    put('chandelier', -101, 4.6, -118, 0, false); put('chandelier', -101, 4.6, -104, 0, false); put('chandelier', -101, 4.6, -132, 0, false);
    CIV.light(-101, 4.5, -118, 1.3, 14);
    put('palm', -97.5, G, -125.5, 0); put('palm', -97.5, G, -110.5, 0);
    put('painting', -105.49, G + 2.5, -106, 1, false); put('portrait', -105.49, G + 2.5, -129, 1, false);
    CIV.textProp('LENDING', K.gold, -102.5, G + 2.4, -111.74, 0, 1 / 20);
    // --- CHILDREN'S ROOM (south-west): rug, low tables + stools, picture-book shelves, rocking horse, mural
    put('rugB', -134, G, -108, 0, false); put('rugR', -134, G, -100, 1, false);
    for (const [tx, tz] of [[-138, -110], [-130, -110], [-138, -101], [-130, -101]]) { put('smalltable', tx, G, tz, 0); for (const [ox, oz] of [[-0.8, 0], [0.8, 0], [0, -0.8], [0, 0.8]]) { put('stool', tx + ox, G, tz + oz, 0); spot('library', tx + ox, G + 0.375, tz + oz, Math.atan2(-ox, -oz), 'sit'); } }
    put('rockinghorse', -127.5, G, -97, 1); put('plantpot', -142.5, G, -96, 0);
    { const fc = face([x0 + 0.5, -119.5, -125.5, z1 - 0.5], 'n'); CIV.bookWall(fc, 1, 17, G, G + 2.25, 21); }
    // mural of the harbour on the children's south wall
    { const m = M(96, 28, 1); for (let x = 0; x < 96; x++) for (let y = 0; y < 28; y++) { let c = y < 10 ? K.navy : col(0xa8d0e8); if (y < 10 && (x + y * 3) % 11 === 0) c = K.blue; if (y >= 10 && y < 12) c = K.buff; if (Math.hypot(x - 78, y - 22) < 3.5) c = K.flowerY; if (x > 20 && x < 44 && y >= 9 && y < 13) c = K.red; if (x > 26 && x < 38 && y >= 13 && y < 17) c = K.white; if (x > 30 && x < 32 && y >= 17 && y < 21) c = K.black; if (x > 60 && x < 63 && y >= 10 && y < 24) c = K.white; if (x > 59 && x < 64 && y >= 24 && y < 26) c = K.red; if (y === 0 || y === 27 || x === 0 || x === 95) c = K.gold; m.set(x, y, 0, c); } AF.placeStatic(AF.meshModel(m, { vs: 1 / 8, anchor: [0.5, 0, 0] }), -134, G + 1.5, z1 - 0.49, 2, { collide: false }); }
    for (const x of [-137, -131]) put('chandelier', x, 4.2, -104, 0, false);
    CIV.light(-134, 4, -104, 1.2, 12);
    CIV.textProp("CHILDREN'S ROOM", K.red, -134, 4.4, -119.49, 0, 1 / 16);
    // --- STACKS (south-east): rows of free-standing shelves
    for (let z = -117; z < -97; z += 3) for (const x of [-121.5, -117.5, -113.5, -109.5]) { put('bookshelf', x, G, z, 0); put('bookshelf', x, G, z + 0.5, 2); }
    for (const x of [-119.5, -111.5]) { put('chandelier', x, 4.2, -107, 0, false); }
    for (let i = 0; i < 4; i++) spot('library', -119.5 + (i % 2) * 8, G, -115.5 + ((i / 2) | 0) * 6, Math.PI, 'browse');
    CIV.light(-115, 4, -107, 1.0, 12);
    S.lib = { x0, z0, x1, z1, PC };
    AF.addBuilding({ id: 'library', name: 'Public Library', kind: 'civic', box: [x0, 0, z0, -88, TOP + 3, z1], doors: [{ x: -87.5, y: 0.25, z: PC, yaw: -Math.PI / 2 }, { x: -87.5, y: 0.25, z: PC - 4, yaw: -Math.PI / 2 }], floors: [G, MZ], interior: true });
  });
  CIV.walkTest('civic: library door -> reading room', -86.5, 0.25, -118, [[-100, -118], [-100, -127], [-110, -128]], 1.25);
  CIV.walkTest('civic: library mezzanine stair', -108, 1.25, -137.4, [[-114.9, -137.4], [-114.5, -139.8], [-120, -139.8]], 5.75);

  // =====================================================================================================
  // CITY MUSEUM  (lot x -147..-88, z -72..-10; entrance on Library Street, east) — great hall, T-rex, whale, planetarium
  // =====================================================================================================
  // pictorial museum banners (a T-rex skull, a ringed planet) + lettering, 1/16 m, on the banner's +x face
  CIV.bannerArt = (word, x, y, z) => {
    const m = M(22, 64, 1), ivory = col(0xf0e6c8, { jitter: 0.1 }), bone = col(0xc8b88e), dark = col(0x2a1a14), sky = col(0x16204a), ring = col(0xe0b050), planet = col(0xd8703a), star = col(0xfff6d0, { emit: 0xfff0c0, emitK: 1.4, mode: 'night' });
    const dino = word === 'DINOSAURS';
    m.box(0, 0, 0, 22, 64, 1, dino ? K.red : K.navy); m.box(0, 0, 0, 22, 1, 1, K.gold); m.box(0, 63, 0, 22, 64, 1, K.gold); m.box(0, 0, 0, 1, 64, 1, K.gold); m.box(21, 0, 0, 22, 64, 1, K.gold);
    for (let i = 1; i < 21; i += 2) m.set(i, 1, 0, K.gold);
    if (dino) {   // T-rex skull in profile facing right: cranium, eye, nostril, jaw with teeth
      m.box(3, 38, 0, 16, 49, 1, ivory); m.box(14, 40, 0, 19, 47, 1, ivory); m.box(2, 45, 0, 8, 52, 1, ivory); m.box(6, 43, 0, 9, 46, 1, dark); m.box(16, 45, 0, 17, 46, 1, dark); m.box(9, 41, 0, 13, 45, 1, bone);
      m.box(4, 31, 0, 18, 35, 1, ivory); m.box(3, 33, 0, 6, 38, 1, ivory); for (let i = 7; i < 19; i += 2) { m.set(i, 37, 0, ivory); m.set(i, 35, 0, ivory); }
      m.box(6, 35, 0, 19, 37, 1, dark); for (let i = 7; i < 19; i += 2) { m.set(i, 36, 0, ivory); }
    } else {      // ringed planet + stars on a night-blue field
      m.box(1, 26, 0, 21, 58, 1, sky);
      for (let i = 0; i < 22; i++) for (let j = 26; j < 58; j++) { const dx = i + 0.5 - 11, dy = j + 0.5 - 42; if (dx * dx + dy * dy < 36) m.set(i, j, 0, (j % 3 === 0) ? col(0xc05a2e) : planet); const e = (dx * dx) / 100 + ((dy + dx * 0.25) * (dy + dx * 0.25)) / 5; if (e > 0.75 && e < 1.2 && !(dx * dx + dy * dy < 36 && dy + dx * 0.25 > 0)) m.set(i, j, 0, ring); }
      for (const [i, j] of [[3, 55], [17, 53], [5, 30], [18, 31], [15, 56], [2, 44], [19, 40], [9, 55]]) m.set(i, j, 0, star);
    }
    const g = AF.meshModel(m, { vs: 1 / 16, anchor: [0.5, 0, 0] }); AF.placeStatic(g, x + 0.01, y, z, 1, { collide: false });
    const [l1, l2] = dino ? ['T.REX', 'HALL'] : ['SKY', 'SHOW'];
    CIV.textProp(l1, K.gold, x + 0.02, y + 0.95, z, 1, 1 / 26); CIV.textProp(l2, K.gold, x + 0.02, y + 0.45, z, 1, 1 / 26);
  };
  // verdigris hip roof (a stepped shell 0.5 m thick) with a glazed lantern along the ridge
  CIV.hipRoof = (x0, z0, x1, z1, yb, slope = 0.5, lanternD = 0) => {
    const cu = col(0x5f9e8a, { jitter: 0.25, edge: 0.3, rough: 0.75 }), cuD = col(0x4b8472, { jitter: 0.25, edge: 0.3, rough: 0.8 }), cuR = col(0x7fbfa6, { jitter: 0.2, edge: 0.3, rough: 0.6 });
    const glz = col(0x9ec8d8, { jitter: 0.1, edge: 0.2, rough: 0.1, emit: 0xffd9a0, emitK: 0.9, mode: 'night' });
    const maxD = Math.min(x1 - x0, z1 - z0) / 2;
    CIV.cols(x0, z0, x1, z1, (x, z) => {
      const d = Math.min(x - x0, x1 - x, z - z0, z1 - z), y1 = yb + (Math.floor(d / 0.5) + 1) * 0.25 * (slope / 0.5);
      if (lanternD && d > maxD - lanternD) { const top = yb + (Math.floor((maxD - lanternD) / 0.5) + 1) * 0.25 * (slope / 0.5); return [top - 0.5, top + 1.25, (Math.floor(x) + Math.floor(z)) % 3 === 0 ? K.bronzeD : glz]; }
      const seam = (Math.abs(x - x0) < Math.abs(z - z0) ? Math.floor(z) : Math.floor(x)) % 2 === 0;
      return [y1 - 0.5, y1, d > maxD - 0.6 ? cuR : seam ? cuD : cu];
    });
  };
  AF.onBuild('civic-museum', 300, () => {
    const x0 = -145, z0 = -68, x1 = -96, z1 = -14, G = 1.25, TOP = 16.5, WX = -108, G2 = 7.25, PC = -41;
    CIV.lotGround('cv-museum', K.pave);
    W.ground(-147, -72, -88, -10, 1, K.pave); W.ground(-146, -13, -97, -11, 1, AF.col('grass'));
    F(x0, 0.25, z0, x1, G, z1, K.granite);
    F(x0, G, z0, WX, TOP, z1, K.buff);                           // great hall block (buff terracotta)
    F(WX, G, z0 + 4, x1, 12.25, z1 - 4, K.lime);                 // entrance wing (lower, limestone)
    F(x0 + 0.5, G, z0 + 0.5, WX - 0.5, TOP - 0.5, z1 - 0.5, 0);   // great hall 36 x 53 x 15
    F(WX, G, z0 + 4.5, x1 - 0.5, G2 - 0.25, z1 - 4.5, 0);   // lobby
    F(WX, G2, z0 + 4.5, x1 - 0.5, 12.0, z1 - 4.5, 0);       // upper floor (planetarium level)
    F(WX, G2 - 0.25, z0 + 4.5, x1 - 0.5, G2, z1 - 12, K.floorW);   // upper floor slab (stair hole at the south end)
    F(x0 + 0.5, G - 0.25, z0 + 0.5, x1 - 0.5, G, z1 - 0.5, K.marbleW);
    CIV.checker(x0 + 0.5, z0 + 0.5, WX - 0.5, z1 - 0.5, G, K.marbleW, K.paveD, 2);
    CIV.checker(WX - 0.5, z0 + 4.5, x1 - 0.5, z1 - 4.5, G, K.marbleW, K.marbleG, 1);
    // hall walls: jade wainscot, cream above, a painted frieze band, skylight roof on steel trusses
    W.walls(x0 + 0.5, G, z0 + 0.5, WX - 0.5, G + 1.5, z1 - 0.5, K.jade);
    W.walls(x0 + 0.5, G + 1.5, z0 + 0.5, WX - 0.5, TOP - 0.5, z1 - 0.5, K.plaster);
    W.walls(x0 + 0.5, TOP - 2.0, z0 + 0.5, WX - 0.5, TOP - 1.5, z1 - 0.5, K.gold);
    F(WX - 0.75, G, PC - 7, WX + 0.25, G2 - 0.75, PC + 7, 0);                                   // big opening lobby -> hall
    F(x0 + 0.5, TOP - 0.5, z0 + 0.5, WX - 0.5, TOP, z1 - 0.5, K.plaster);
    for (let z = z0 + 4; z < z1 - 3; z += 6) { F(x0 + 0.5, TOP - 1.25, z, WX - 0.5, TOP - 0.5, z + 0.5, K.steelD); for (let x = x0 + 1; x < WX - 1; x += 2) F(x, TOP - 1.25 + ((x | 0) % 4 === 0 ? 0 : 0.25), z, x + 0.25, TOP - 0.5, z + 0.5, K.steel); }
    F(x0 + 6, TOP - 0.5, z0 + 3, WX - 6, TOP, z1 - 3, K.glass); for (let z = z0 + 6; z < z1 - 3; z += 3) F(x0 + 6, TOP - 0.5, z, WX - 6, TOP, z + 0.25, K.steelD);
    F(x0 + 5.5, TOP, z0 + 2.5, WX - 5.5, TOP + 1.25, z1 - 2.5, K.buffD); F(x0 + 6, TOP, z0 + 3, WX - 6, TOP + 1.25, z1 - 3, 0);
    F(x0 + 6, TOP + 1.25, z0 + 3, WX - 6, TOP + 1.5, z1 - 3, K.glass); for (let z = z0 + 5; z < z1 - 3; z += 2) F(x0 + 6, TOP + 1.5, z, WX - 6, TOP + 1.75, z + 0.25, K.steelD);
    CIV.hipRoof(x0 + 1, z0 + 1, WX - 1, z1 - 1, TOP + 0.5, 0.5, 2.5);
    // exterior: clerestory windows, piers, sgraffito frieze, parapet
    const R = [x0, z0, WX, z1];
    for (const s of ['n', 's', 'w']) {
      const f = face(R, s);
      for (let u = 3; u < f.len - 2; u += 4.5) { CIV.archWin(f, u, 9.0, 2.5, 4.0, 0.75, { gl: 1, trim: K.limeW, glassC: K.glassLit }); f.fill(u + 2 - 0.25, u + 2 + 0.25, G, TOP - 1.5, 0, 0.25, K.buffD); }
      CIV.winGrid(f, 1, f.len - 1, 4.5, 1.75, [3.0], 2.5, {});
      f.fill(-0.25, f.len + 0.25, TOP - 1.5, TOP - 1.0, 0, 0.5, K.limeD); CIV.chevrons(f, 0, f.len, TOP - 1.0, K.goldN, K.jade);
      f.fill(-0.5, f.len + 0.5, TOP - 0.25, TOP + 0.75, 0, 0.5, K.limeW); f.fill(0, f.len, G, G + 0.5, 0, 0.25, K.granite);
      for (let u = 2; u < f.len - 1; u += 9) CIV.textProp(['GEOLOGY', 'NATURAL HISTORY', 'THE SEA', 'ASTRONOMY', 'ANTIQUITIES', 'SCIENCE'][(u / 9 | 0) % 6], K.bronze, f.map(u + 2.25, 0.01)[0], 7.75, f.map(u + 2.25, 0.01)[1], f.rotOut, 1 / 20);
    }
    const RW = [WX, z0 + 4, x1, z1 - 4];
    for (const s of ['n', 's', 'e']) { const f = face(RW, s); CIV.winGrid(f, 1, f.len - 1, 3.5, 1.75, [2.5], 3.0, { glass: true, t: 0.5, skip: (u) => s === 'e' && Math.abs(RW[1] + u - PC) < 8 }); CIV.winGrid(f, 1, f.len - 1, 3.5, 1.75, [8.25], 2.5, { glass: true, t: 0.5, skip: (u) => s === 'e' && Math.abs(RW[1] + u - PC) < 8 }); f.fill(-0.25, f.len + 0.25, 11.75, 12.5, 0, 0.5, K.limeW); f.fill(0, f.len, G, G + 0.5, 0, 0.25, K.granite); }
    // portico (Library St): 4 square deco piers, name, steps, doors, banners
    F(x1, 0.25, PC - 8, x1 + 5, G, PC + 8, K.granite); F(x1, G - 0.25, PC - 8, x1 + 5, G, PC + 8, K.marbleW);
    CIV.steps('x', -88, -1, PC - 9, PC + 9, 0.25, 4, 0.75, K.limeW, K.limeD);
    for (const oz of [-7, -3.4, 3.4, 7]) { F(x1 + 3, G, PC + oz - 0.75, x1 + 4.5, 11.0, PC + oz + 0.75, K.limeN); F(x1 + 2.75, 10.5, PC + oz - 1, x1 + 4.75, 11.0, PC + oz + 1, K.goldN); F(x1 + 4.5, G + 1, PC + oz - 0.25, x1 + 4.75, 10.0, PC + oz + 0.25, K.limeW); }
    F(x1, 11.0, PC - 8.5, x1 + 5, 12.5, PC + 8.5, K.limeWN);
    CIV.textProp('CITY MUSEUM', K.bronze, x1 + 5.01, 11.3, PC, 1, 1 / 9, { bold: true });
    const fE = face(RW, 'e');
    for (const oz of [-4, 0, 4]) CIV.door(fE, PC + oz - RW[1], G, 2.5, 4.0, { t: 0.5, transom: 1.25, leaf: K.bronze });
    // banners hanging between the piers (dinosaur + planetarium)
    for (const [oz, c1, c2, word] of [[-5.2, K.red, K.gold, 'DINOSAURS'], [5.2, K.navy, K.gold, 'PLANETARIUM']]) { F(x1 + 4.75, 5.0, PC + oz - 0.75, x1 + 5.0, 10.0, PC + oz + 0.75, c1); F(x1 + 4.75, 9.5, PC + oz - 0.75, x1 + 5.0, 10.0, PC + oz + 0.75, c2); CIV.bannerArt(word, x1 + 5.0, 5.5, PC + oz); }
    for (const oz of [-6.5, 6.5]) put('floodlamp', x1 + 5.5, G, PC + oz, 1, false);
    AF.addLight({ x: -91, y: 6, z: PC, color: 0xffe0b0, intensity: 1.2, range: 18, kind: 'sign' });
    CIV.flagpole(-100, 12.5, z0 + 6, 3);
    // --- PLANETARIUM: drum + copper dome on the entrance wing, starry inner sky
    const PX = -102, PZ = PC, PR = 5.0;
    CIV.ring(PX, PZ, G2, 12.25, PR + 0.25, PR - 0.5, K.navy);
    CIV.ring(PX, PZ, G2, 13.0, PR - 0.5, 0, 0);
    CIV.ring(PX, PZ, 12.25, 12.75, PR + 0.75, PR - 0.5, K.limeWN);
    F(PX - 1, G2, PZ + PR - 0.75, PX + 1, G2 + 2.75, PZ + PR + 0.5, 0);           // entry from the south
    const starC = col(0xfff6d0, { emit: 0xfff0c0, emitK: 2.5, mode: 'always', jitter: 0, edge: 0 }), nightC = col(0x141c3a, { jitter: 0.15, edge: 0.05 }), starB = col(0xa8c8ff, { emit: 0x9ac0ff, emitK: 2.0, mode: 'always', jitter: 0, edge: 0 });
    const silv = col(0xc9ced6, { jitter: 0.08, edge: 0.15, metal: 0.85, rough: 0.28 }), silvR = col(0x9ea4ae, { jitter: 0.08, edge: 0.15, metal: 0.85, rough: 0.35 });
    CIV.dome(PX, PZ, 12.75, PR + 0.75, PR, (a, el) => (Math.abs(((a + Math.PI) / (Math.PI * 2) * 12) % 1 - 0.5) > 0.42 ? silvR : silv), (a, el, x, y, z) => { const h = AF.hash3(Math.floor(x * 4), Math.floor(y * 4), Math.floor(z * 4)); return h > 0.965 ? starC : h > 0.955 ? starB : nightC; });
    CIV.each(PX - PR, G2 + 1, PZ - PR, PX + PR, 12.75, PZ + PR, (x, y, z) => { const r = Math.hypot(x - PX, z - PZ); if (r >= PR - 0.5 || r < PR - 0.75) return undefined; if (z > PZ + PR - 1.5 && Math.abs(x - PX) < 1.25 && y < G2 + 2.75) return undefined; return AF.hash3(Math.floor(x * 4), Math.floor(y * 4), Math.floor(z * 4)) > 0.97 ? starC : nightC; });
    F(PX - 1, G2, PZ + PR - 1.0, PX + 1, G2 + 2.75, PZ + PR + 0.5, 0);
    F(PX - 0.25, 12.75 + PR + 0.5, PZ - 0.25, PX + 0.25, 12.75 + PR + 1.5, PZ + 0.25, K.goldN);
    // projector (star ball dumbbell) + ring of reclining seats
    { const m = M(8, 20, 8); m.box(3, 0, 3, 5, 12, 5, K.iron); m.sphere(4, 14, 4, 3.5, K.iron, (x, y, z) => (AF.hash3(x, y, z) > 0.8 ? starC : K.iron)); m.box(2, 0, 2, 6, 2, 6, K.steelD); AF.placeStatic(AF.meshModel(m, { vs: 1 / 8 }), PX, G2, PZ, 0); }
    for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2 + 0.3; if (Math.sin(a) > 0.8) continue; const x = PX + Math.cos(a) * 3.1, z = PZ + Math.sin(a) * 3.1, yaw = Math.atan2(PX - x, PZ - z); const rot = ((Math.round(yaw / (Math.PI / 2)) % 4) + 4) % 4; put('armchair', x, G2, z, rot); spot('museum', x, G2 + 0.4, z, yaw, 'sit'); }
    CIV.light(PX, 10, PZ, 0.6, 8, 0x8ab4ff);
    // stair from the lobby (south end) up to the planetarium floor: along z, rising north
    F(WX, G2 - 0.25, z1 - 12, x1 - 0.5, G2, z1 - 4.5, 0);
    CIV.steps('z', z1 - 6.0, -1, x1 - 3.0, x1 - 0.75, G, 24, 0.25, K.marbleW, K.limeD);
    CIV.rail(WX + 0.25, z1 - 12.25, x1 - 3.25, z1 - 12.25, G2, K.brass, K.woodD, 1.0);
    F(x1 - 3.25, G, z1 - 12, x1 - 3.0, G2 + 1.0, z1 - 6, K.limeW);
    CIV.textProp('PLANETARIUM', K.gold, PX, G2 + 3.0, PZ + PR + 0.51, 0, 1 / 20);
    put('chandelier', -102, G2 - 2.2, PC - 12, 0, false); put('chandelier', -102, G2 - 2.2, PC + 12, 0, false); put('chandelier', -102, G2 - 2.2, PC, 0, false);
    CIV.light(-102, 5, PC, 1.3, 14); CIV.light(-102, 10, -60, 0.8, 10);
    // --- LOBBY: ticket desk, guard, totem pole, benches
    F(-106, G, PC - 10.5, -103, G + 1.25, PC - 9.75, K.woodD); F(-106.25, G + 1.25, PC - 10.75, -102.75, G + 1.5, PC - 9.5, K.marbleG);
    spot('museum', -104.5, G, PC - 11.3, 0, 'work'); spot('museum', -104.5, G, PC - 8.8, Math.PI, 'counter', [[-94, PC], [-100, PC - 6], [-104.5, PC - 8.8]]);
    CIV.textProp('ADMISSION FREE', K.gold, -104.5, G + 1.55, PC - 9.49, 0, 1 / 24);
    spot('museum', -106.5, G, PC + 7.5, -Math.PI / 2, 'stand', [[-94, PC], [-106.5, PC + 7.5]]);
    for (const z of [PC - 18, PC + 18]) { put('bench', -103, G, z, 1); spot('museum', -103.1, G + 0.5, z, Math.PI / 2, 'sit'); }
    put('palm', -97.5, G, PC - 7, 0); put('palm', -97.5, G, PC + 7, 0);
    // TOTEM POLE (at the hall entrance, carved faces stacked, 9 m)
    { const TX = -112, TZ = PC - 9; const tc = [K.red, K.navy, K.jade, K.fabricGo, K.black, K.white];
      for (let k = 0; k < 6; k++) { const y = G + k * 1.5; F(TX - 0.75, y, TZ - 0.75, TX + 0.75, y + 1.5, TZ + 0.75, col(0x8a5a32, { jitter: 0.4 })); F(TX - 0.5, y + 0.75, TZ + 0.75, TX - 0.25, y + 1.0, TZ + 1.0, K.white); F(TX + 0.25, y + 0.75, TZ + 0.75, TX + 0.5, y + 1.0, TZ + 1.0, K.white); F(TX - 0.25, y + 0.25, TZ + 0.75, TX + 0.25, y + 0.5, TZ + 1.0, tc[k]); F(TX - 0.75, y + 1.25, TZ + 0.75, TX + 0.75, y + 1.5, TZ + 1.0, tc[(k + 2) % 6]); }
      F(TX - 2.25, G + 8.0, TZ - 0.25, TX + 2.25, G + 8.5, TZ + 0.25, K.red); F(TX - 1.75, G + 8.5, TZ - 0.25, TX + 1.75, G + 8.75, TZ + 0.25, K.black); F(TX - 0.5, G + 9.0, TZ - 0.5, TX + 0.5, G + 10.0, TZ + 0.5, col(0x8a5a32)); F(TX - 0.25, G + 9.25, TZ + 0.5, TX + 0.25, G + 9.5, TZ + 1.25, K.fabricGo);
      F(TX - 1.25, G - 0.01, TZ - 1.25, TX + 1.25, G + 0.25, TZ + 1.25, K.granite); }
    // --- GREAT HALL: T-REX skeleton on a plinth, WHALE overhead, cases, ship models, minerals, butterflies
    const DX = -127, DZ = PC;
    F(DX - 4, G, DZ - 9, DX + 4, G + 0.75, DZ + 9, K.granite); F(DX - 4.25, G + 0.75, DZ - 9.25, DX + 4.25, G + 1.0, DZ + 9.25, K.limeW);
    { // T. rex, 1/5 m voxels, facing +z (head at +z end), ~15 m long, ~5.5 m high at the hips
      const m = M(26, 34, 76), B = K.ivory, D = K.ivoryD, I = K.iron;
      const sp = (z) => { if (z < 30) return 20 + (z - 30) * 0.18 + Math.max(0, 8 - z) * 0.1; if (z < 50) return 20 + (z - 30) * 0.12; return 22.4 + (z - 50) * 0.28; };   // spine height
      for (let z = 2; z < 60; z++) { const y = sp(z), r = z < 30 ? 0.4 + (z - 2) / 28 * 1.3 : 1.7; m.sphere(13, y, z, r, B); if (z % 2 === 0 && z > 6) m.box(13, y, z, 14, y + (z < 30 ? 1 + (z - 6) * 0.08 : 3 - (z - 30) * 0.05), z + 1, D); }
      // skull + jaws
      m.box(10, 26, 60, 16, 31, 72, B); m.box(11, 24, 60, 15, 26, 72, D); m.box(11, 21, 61, 15, 23, 71, B); for (let z = 62; z < 71; z += 2) { m.set(11, 23, z, K.white); m.set(14, 23, z, K.white); m.set(11, 25, z + 1, K.white); m.set(14, 25, z + 1, K.white); }
      m.box(10, 28, 62, 16, 30, 65, 0); m.box(11, 28, 67, 15, 30, 71, 0); m.box(10, 27, 69, 16, 28, 70, B); m.box(12, 27, 60, 14, 30, 61, D);
      // ribcage (curved hoops)
      for (let z = 32; z < 50; z += 2) { const y0 = sp(z); for (let t = 0; t <= 1; t += 0.08) { const a = t * Math.PI; const rr = 5 - Math.abs(z - 41) * 0.12; m.set(13 + Math.cos(a) * rr, y0 - Math.sin(a) * rr * 1.4, z, D); m.set(13 - Math.cos(a) * rr, y0 - Math.sin(a) * rr * 1.4, z, D); } }
      // pelvis + legs
      m.box(10, 17, 26, 16, 22, 34, B); m.box(9, 15, 28, 17, 17, 32, D);
      for (const lx of [8, 18]) { m.line(lx, 18, 29, lx, 10, 34, B, 1.4); m.line(lx, 10, 34, lx, 3, 29, B, 1.1); m.line(lx, 3, 29, lx, 1, 34, B, 0.9); m.box(lx - 2, 0, 31, lx + 2, 1, 37, D); }
      // tiny arms
      for (const ax of [9, 17]) { m.line(ax, 20, 48, ax, 17, 52, B, 0.6); m.line(ax, 17, 52, ax, 18, 54, B, 0.5); }
      // support rods to the plinth
      for (const z of [12, 40, 60]) m.box(12, 0, z, 14, sp(Math.min(z, 59)) - 1, z + 1, I);
      AF.placeStatic(AF.meshModel(m, { vs: 1 / 5, anchor: [0.5, 0, 0.5] }), DX, G + 1.0, DZ, 0);
    }
    CIV.textProp('TYRANNOSAURUS REX', K.bronze, DX, G + 0.25, DZ + 9.26, 0, 1 / 20);
    for (let i = 0; i < 8; i++) { const side = i < 4 ? -1 : 1, z = DZ - 7 + (i % 4) * 4.5; spot('museum', DX + side * 5.2, G, z, side < 0 ? Math.PI / 2 : -Math.PI / 2, 'browse', [[-94, PC], [-110, PC], [DX + side * 5.2, PC + (side < 0 ? 10.5 : 10.5)], [DX + side * 5.2, z]]); }
    // brass stanchion rope around the plinth
    for (let z = DZ - 10; z <= DZ + 10; z += 2.5) for (const sx of [-5, 5]) F(DX + sx - 0.125, G, z - 0.125, DX + sx + 0.125, G + 1.0, z + 0.125, K.brass);
    for (const sx of [-5, 5]) F(DX + sx - 0.05, G + 0.75, DZ - 10, DX + sx + 0.2, G + 0.875, DZ + 10, K.red);
    // WHALE: a blue whale hanging from the trusses (1/4 m voxels, 19 m long, along z)
    { const m = M(20, 18, 78), bl = col(0x4f6a86, { jitter: 0.3, edge: 0.3 }), bp = col(0xb8c4cc, { jitter: 0.3, edge: 0.3 }), bd = col(0x3a4f66, { jitter: 0.3 });
      for (let z = 0; z < 66; z++) { const t = z / 66, rw = 1 + 7.5 * Math.sin(Math.min(1, t * 1.25) * Math.PI * 0.62) * (t < 0.8 ? 1 : 1 - (t - 0.8) * 4), rh = rw * 0.72; for (let x = 0; x < 20; x++) for (let y = 0; y < 18; y++) { const dx = (x + 0.5 - 10) / rw, dy = (y + 0.5 - 9) / rh; if (dx * dx + dy * dy < 1) m.set(x, y, 77 - z, y < 7 && (x % 2 === 0 || y < 5) ? bp : bl); } }
      for (let z = 60; z < 70; z++) m.box(9, 8, z, 11, 10, z + 1, bd);
      for (let x = 0; x < 20; x++) for (let z = 0; z < 9; z++) { const w = Math.abs(x - 9.5); if (w < 1 + z * 1.05 && z < 8 - w * 0.1) m.set(x, 9, z, bd); }
      for (const sx of [2, 17]) { m.line(sx, 7, 60, sx < 10 ? -2 : 21, 4, 52, bd, 0.7); }
      for (const ex of [3, 16]) m.set(ex, 9, 67, K.black);
      m.box(4, 7, 66, 16, 8, 78, bd);
      AF.placeStatic(AF.meshModel(m, { vs: 1 / 4, anchor: [0.5, 0, 0.5] }), -127, 10.25, PC + 1, 0, { collide: false });
      for (const z of [-12, 4, 18]) F(-127.05, 12.5, PC + z, -126.95, TOP - 1.25, PC + z + 0.25, K.steelD);
      AF.addLabel('The Great Hall', -126, PC, 'place'); }
    // display cases around the walls: minerals, ship models, butterflies, cabinets
    for (let i = 0; i < 6; i++) { if (i === 3) continue; const z = z0 + 5 + i * 8; put(i % 2 ? 'shipcase' : 'showcase', x0 + 2.0, G, z, 1); spot('museum', x0 + 3.6, G, z, -Math.PI / 2, 'browse'); }
    for (let x = x0 + 5; x < WX - 4; x += 7) { put('showcase', x, G, z0 + 1.75, 0); put('shipcase', x + 3.5, G, z1 - 1.75, 2); spot('museum', x, G, z0 + 3.3, Math.PI, 'browse'); spot('museum', x + 3.5, G, z1 - 3.3, 0, 'browse'); }
    for (let x = x0 + 4; x < WX - 3; x += 5) { put('butterflies', x, 4.5, z0 + 0.51, 0, false); put('painting', x + 2.5, 5.0, z1 - 0.51, 2, false); }
    for (let z = z0 + 6; z < z1 - 4; z += 10) put('butterflies', x0 + 0.51, 4.5, z, 1, false);
    // a mammoth tusk arch and a mineral pyramid near the whale's tail
    { const tx = -116, tz = PC + 15; for (let a = 0; a <= Math.PI; a += 0.08) { for (const sx of [-1, 1]) F(tx + sx * (2.2 - Math.sin(a) * 0.4), G + Math.sin(a) * 3.2, tz + Math.cos(a) * 1.4 - 0.125, tx + sx * (2.2 - Math.sin(a) * 0.4) + 0.25, G + Math.sin(a) * 3.2 + 0.25, tz + Math.cos(a) * 1.4 + 0.125, K.ivory); } F(tx - 2.75, G, tz - 1.75, tx + 2.75, G + 0.5, tz + 1.75, K.granite); }
    { const gx = -116, gz = PC - 16; const cr = [col(0x9b59d0, { emit: 0x9b59d0, emitK: 0.4, mode: 'always' }), col(0x3fb0c0, { emit: 0x3fb0c0, emitK: 0.4, mode: 'always' }), col(0xe0c040, { emit: 0xe0c040, emitK: 0.3, mode: 'always' })]; F(gx - 1.5, G, gz - 1.5, gx + 1.5, G + 1.0, gz + 1.5, K.woodD); for (let k = 0; k < 8; k++) { const a = k * 0.8, r = 0.5 + (k % 3) * 0.3; F(gx + Math.cos(a) * r - 0.125, G + 1.0, gz + Math.sin(a) * r - 0.125, gx + Math.cos(a) * r + 0.125, G + 1.5 + (k % 4) * 0.25, gz + Math.sin(a) * r + 0.125, cr[k % 3]); } F(gx - 1.5, G + 1.0, gz - 1.5, gx + 1.5, G + 2.75, gz - 1.25, K.glass); }
    for (const [x, z] of [[-138, -60], [-138, -22], [-116, -60], [-116, -22], [-127, -41]]) put('chandelier', x, TOP - 3.5, z, 0, false);
    CIV.light(-127, 9, PC, 1.8, 26); CIV.light(-127, 8, -58, 1.0, 14); CIV.light(-127, 8, -24, 1.0, 14);
    // guard + visitor spots
    spot('museum', -110, G, PC + 7.5, -Math.PI / 2, 'stand', [[-94, PC], [-110, PC + 7.5]]);
    for (let i = 0; i < 6; i++) spot('museum', -134 + (i % 3) * 7, G, PC + (i < 3 ? -14 : 14), i < 3 ? 0 : Math.PI, 'browse', [[-94, PC], [-110, PC], [-134 + (i % 3) * 7, PC + (i < 3 ? -14 : 14)]]);
    for (const [bx, bz] of [[-138, PC], [-116, PC - 4]]) { put('bench', bx, G, bz, 1); spot('museum', bx - 0.1, G + 0.5, bz + 0.6, Math.PI / 2, 'sit'); spot('museum', bx - 0.1, G + 0.5, bz - 0.6, Math.PI / 2, 'sit'); }
    S.mus = { PC };
    AF.addBuilding({ id: 'museum', name: 'City Museum', kind: 'civic', box: [x0, 0, z0, -88, 19, z1], doors: [{ x: -87.5, y: 0.25, z: PC, yaw: -Math.PI / 2 }, { x: -87.5, y: 0.25, z: PC + 4, yaw: -Math.PI / 2 }], floors: [G, G2], interior: true });
    AF.addLabel('Planetarium', PX, PZ, 'place');
  });
  CIV.walkTest('civic: museum door -> great hall', -86.5, 0.25, -41, [[-100, -41], [-108, -41], [-112, -47]], 1.25);
  CIV.walkTest('civic: museum stair -> planetarium', -102, 1.25, -19.25, [[-97.9, -19.25], [-97.9, -27], [-102, -34.5]], 7.25);

  // =====================================================================================================
  // UNION TERMINAL  (lot x 173..300, z 10..72; faces west on Terminal Ave)
  // =====================================================================================================
  const T = CIV.TERM = { hx0: 178, hx1: 207, z0: 15, z1: 67, cz: 41, G: 1.25, a: 26, b: 13, spring: 4 };
  AF.onBuild('civic-terminal', 300, () => {
    const { hx0, hx1, z0, z1, cz, G } = T;
    CIV.lotGround('cv-terminal', K.pave);
    W.ground(173, 10, 300, 72, 1, K.pave);
    // --- the HALL: floor, side walls, elliptical coffered vault over z (axis along x)
    F(175, 0.25, 12, 232, G, 70, K.granite);
    F(hx0, G - 0.25, z0, hx1, G, z1, K.marbleW);
    CIV.checker(hx0, z0, hx1, z1, G, K.marbleW, K.marbleY, 2);
    for (let x = hx0; x < hx1; x += 0.25) { F(x, G - 0.25, cz - 3, x + 0.25, G, cz + 3, (Math.round(x * 4) % 8 < 4) ? K.marbleR : K.marbleB); }
    F(hx0, G, z0 - 0.75, hx1 + 0.75, T.spring, z0, K.lime); F(hx0, G, z1, hx1 + 0.75, T.spring, z1 + 0.75, K.lime);
    const a = T.a, b = T.b, sp = T.spring, th = 0.75;
    CIV.cols(hx0 - 3, z0 - 1, hx1 + 0.75, z1 + 1, (x, z) => { const dz = (z - cz) / a; if (Math.abs(dz) >= 1.03) return null; const yIn = Math.abs(dz) < 1 ? sp + b * Math.sqrt(1 - dz * dz) : sp; const dz2 = (z - cz) / (a + th); const yOut = Math.abs(dz2) < 1 ? sp + (b + th) * Math.sqrt(1 - dz2 * dz2) : sp + 0.5; return [sp, Math.max(yOut, yIn + 0.5), x < hx0 ? K.lime : K.limeD]; });
    CIV.cols(hx0, z0, hx1, z1, (x, z) => { const dz = (z - cz) / a; if (Math.abs(dz) >= 1) return null; const yIn = sp + b * Math.sqrt(1 - dz * dz); return [sp, yIn, 0]; });
    // coffers on the inner skin: ribs every 3 m along x, bands along the vault
    CIV.cols(hx0, z0, hx1, z1, (x, z) => { const dz = (z - cz) / a; if (Math.abs(dz) >= 0.995) return null; const yIn = sp + b * Math.sqrt(1 - dz * dz); const ax = ((x - hx0) % 3) < 0.5, band = Math.floor(Math.asin(Math.min(1, Math.abs(dz))) / 0.16) !== Math.floor(Math.asin(Math.min(1, Math.abs(dz) + 0.012)) / 0.16); const inner = ((x - hx0) % 3) > 1.25 && ((x - hx0) % 3) < 1.75 && Math.abs(Math.asin(Math.min(1, Math.abs(dz))) % 0.16 - 0.08) < 0.02; return [yIn, yIn + 0.25, ax || band ? K.limeW : inner ? K.gold : (Math.floor(x / 3) % 2 ? K.plasterR : K.plaster)]; });
    // copper ribs on the outer vault
    for (let x = hx0 + 1.5; x < hx1; x += 4.5) CIV.cols(x, z0 - 1, x + 0.5, z1 + 1, (xx, z) => { const dz = (z - cz) / (a + th); if (Math.abs(dz) >= 1) return null; const yOut = sp + (b + th) * Math.sqrt(1 - dz * dz); return [yOut - 0.25, yOut + 0.25, K.copper]; });
    // --- FRONT: the great arch (stepped deco surround), glazed half-ellipse window with mullions, doors below
    // (round 2) the fan window glows like a lantern at night: glass is 38% opaque, so its emission is pushed hard
    K.glassArch = col(0xfff2d8, { glass: true, emit: 0xffc870, emitK: 3.4, mode: 'night', jitter: 0, edge: 0 }); K.glassArchB = col(0xfff4e0, { glass: true, emit: 0xffd890, emitK: 4.2, mode: 'night', jitter: 0, edge: 0 });
    const FX0 = 174.5, FX1 = hx0, AW = 20, AH = 14.75;
    F(FX0, G, z0 - 3, FX1, 24.5, z1 + 3, K.limeN);
    for (let k = 0; k < 4; k++) { const w = AW + 3 - k, h = AH + 3 - k; CIV.cols(FX0, cz - w, FX0 + 0.5 + k * 0.5, cz + w, (x, z) => { const dz = (z - cz) / w; if (Math.abs(dz) >= 1) return null; return [G, G + h * Math.sqrt(1 - dz * dz), 0]; }); }
    CIV.cols(FX0 + 2, cz - AW, FX1, cz + AW, (x, z) => { const dz = (z - cz) / AW; if (Math.abs(dz) >= 1) return null; return [G, G + AH * Math.sqrt(1 - dz * dz), 0]; });
    // arch rings coloured (gold inner ring) + glass wall with a sunburst mullion pattern
    CIV.cols(FX0 + 1.5, cz - AW - 1, FX0 + 2.0, cz + AW + 1, (x, z) => { const dz = (z - cz) / (AW + 0.5); if (Math.abs(dz) >= 1) return null; const y = G + (AH + 0.5) * Math.sqrt(1 - dz * dz); return [y - 0.25, y + 0.25, K.goldN]; });
    CIV.each(FX0 + 2.25, G, cz - AW, FX0 + 2.5, G + AH, cz + AW, (x, y, z) => { const dz = (z - cz) / AW, dy = (y - G) / AH; if (dz * dz + dy * dy >= 1) return undefined; const ang = Math.atan2(y - G, z - cz), rad = Math.hypot(dz, dy); const ray = Math.abs(((ang / Math.PI) * 14) % 1 - 0.5) > 0.44, ringL = Math.abs(rad - 0.45) < 0.02 || Math.abs(rad - 0.75) < 0.015; return ray || ringL || rad < 0.12 ? K.bronzeD : (rad > 0.75 ? K.glassArchB : K.glassArch); });
    // doors (5 openings) through the glass wall at ground level
    for (let k = -2; k <= 2; k++) { const zc = cz + k * 4; F(FX0 - 0.1, G, zc - 1.25, FX1 + 0.1, G + 3.5, zc + 1.25, 0); F(FX0 + 2.25, G + 3.5, zc - 1.5, FX0 + 2.5, G + 3.75, zc + 1.5, K.bronze); F(FX0 + 2.25, G, zc - 1.5, FX0 + 2.5, G + 3.5, zc - 1.25, K.bronze); F(FX0 + 2.25, G, zc + 1.25, FX0 + 2.5, G + 3.5, zc + 1.5, K.bronze); }
    F(FX0 + 2.25, G + 3.75, cz - 10, FX0 + 2.5, G + 4.0, cz + 10, K.bronze);
    for (let z = z0 - 1.5; z < z1 + 2; z += 2.25) { const dz = (z - cz) / (AW + 3); const yA = Math.abs(dz) < 1 ? G + (AH + 3) * Math.sqrt(1 - dz * dz) : G; if (Math.abs(z - cz) > 21.5 && Math.abs(z - cz) < 26.5) continue; F(FX0 - 0.25, yA + 0.5, z - 0.25, FX0, Math.abs(z - cz) < 11.5 ? 19.25 : 24.25, z + 0.25, K.limeW); }
    // name above the arch, flanking pylons with lit tops, clock at the crown
    CIV.text('UNION TERMINAL', K.goldN, FX0 - 0.5, 19.75, cz - 10.5, 3, { depth: 2, bold: true });
    for (const sz of [-1, 1]) { const pz = cz + sz * 25; F(FX0 - 1, G, pz - 1.5, FX1, 27, pz + 1.5, K.limeWN); F(FX0 - 1.25, 27, pz - 1.75, FX1, 27.5, pz + 1.75, K.limeD); F(FX0 - 0.5, 27.5, pz - 1, FX0 + 2, 29, pz + 1, K.goldN); for (let y = 5; y < 26; y += 1.5) F(FX0 - 1.25, y, pz - 0.75, FX0 - 1.0, y + 0.75, pz + 0.75, K.limeW); }
    CIV.clock(FX0 - 0.26, 22.9, cz, 3, 1.25);
    CIV.chevrons(face([FX0, z0 - 3, FX1, z1 + 3], 'w'), 0, 58, 24.5, K.goldN, K.limeW); F(FX0 - 0.25, 25.25, z0 - 3.25, FX1, 25.5, z1 + 3.25, K.limeW);
    // low wings north + south with windows
    for (const [za, zb] of [[10, 12], [70, 72]]) { F(175, G, za, 232, 9, zb, K.lime); F(174.75, 9, za - 0.25, 232, 9.5, zb + 0.25, K.limeW); }
    for (const s of ['n', 's']) { const f = face([175, 10, 232, 72], s); CIV.winGrid(f, 4, 56, 3.5, 1.75, [2.75, 6.0], 2.25, {}); }
    // steps + forecourt (from the sidewalk up to the hall floor)
    CIV.steps('x', 173.0, 1, z0 - 3, z1 + 3, 0.25, 4, 0.375, K.limeW, K.limeD);
    for (const sz of [-1, 1]) { put('lampstd', 173.6, 0.25, cz + sz * 13, 0); AF.addLight({ x: 173.6, y: 3.3, z: cz + sz * 13, color: 0xffd9a0, intensity: 0.8, range: 10, kind: 'street' }); }
    for (let k = -3; k <= 3; k++) put('floodlamp', 174.0, 0.25, cz + k * 6, 3, false);
    AF.addLight({ x: 170, y: 8, z: cz, color: 0xffe0b0, intensity: 1.6, range: 30, kind: 'sign' });
    // --- HALL FURNISHINGS
    // ticket windows x6 along the north wall
    F(hx0 + 4, G, z0, hx0 + 22, G + 4.5, z0 + 1.5, K.woodD); F(hx0 + 3.75, G + 4.5, z0, hx0 + 22.25, G + 5.0, z0 + 1.75, K.gold);
    F(hx0 + 4.25, G, z0, hx0 + 21.75, G + 3.75, z0 + 1.25, 0); F(hx0 + 4, G + 1.0, z0 + 1.5, hx0 + 22, G + 1.25, z0 + 1.9, K.marbleG); for (let x = hx0 + 5; x < hx0 + 21; x += 3) put('pendantT', x + 0.5, G + 2.6, z0 + 0.6, 0, false);
    for (let i = 0; i < 6; i++) { const x = hx0 + 5.5 + i * 3; F(x - 0.75, G + 1.25, z0 + 1.25, x + 0.75, G + 2.75, z0 + 1.5, 0); put('tellercage', x, G + 1.25, z0 + 1.35, 0, false); spot('terminal', x, G, z0 + 0.7, 0, 'work'); for (let q = 0; q < 2; q++) spot('terminal', x, G, z0 + 2.6 + q * 0.9, Math.PI, 'counter', [[172, cz], [hx0 + 3, cz - 4], [x, z0 + 5], [x, z0 + 2.6 + q * 0.9]]); }
    CIV.textProp('TICKETS', K.gold, hx0 + 13, G + 3.3, z0 + 1.51, 0, 1 / 12, { bold: true });
    // four-faced clock hanging on a rod from the crown
    { const cx = 192.5, cy = 11.0; F(cx - 1.25, cy - 1.25, cz - 1.25, cx + 1.25, cy + 1.25, cz + 1.25, K.bronze); F(cx - 1.4, cy + 1.25, cz - 1.4, cx + 1.4, cy + 1.5, cz + 1.4, K.gold); F(cx - 0.75, cy - 1.75, cz - 0.75, cx + 0.75, cy - 1.25, cz + 0.75, K.gold); F(cx - 0.25, cy - 2.25, cz - 0.25, cx + 0.25, cy - 1.75, cz + 0.25, K.goldN); F(cx - 0.125, cy + 1.5, cz - 0.125, cx + 0.125, sp + b, cz + 0.125, K.brass);
      CIV.clock(cx, cy, cz + 1.26, 0, 1.0); CIV.clock(cx, cy, cz - 1.26, 2, 1.0); CIV.clock(cx + 1.26, cy, cz, 1, 1.0); CIV.clock(cx - 1.26, cy, cz, 3, 1.0); }
    // benches: long double-backed rows either side of the central aisle
    for (const zr of [[22, 34], [48, 60]]) for (let x = 184; x <= 200; x += 4) for (let z = zr[0]; z < zr[1]; z += 4.5) {
      F(x - 0.25, G, z, x + 0.25, G + 1.5, z + 4, K.woodD); F(x - 1.25, G + 0.5, z, x + 1.25, G + 0.75, z + 4, K.oak); F(x - 0.125, G + 1.5, z - 0.125, x + 0.125, G + 1.75, z + 4.125, K.brass);
      for (const [dx, yaw] of [[-0.85, -Math.PI / 2], [0.85, Math.PI / 2]]) for (const oz of [0.8, 2.0, 3.2]) spot('terminal', x + dx, G + 0.75, z + oz, yaw, 'sit');
      AF.addCollider(x - 1.25, G, z, x + 1.25, G + 0.75, z + 4);
    }
    // newsstand, shoeshine, luggage carts, lamps, planters
    put('newsstand', 184, G, z1 - 2.2, 2); spot('terminal', 184, G, z1 - 0.9, Math.PI, 'work');
    for (let i = 0; i < 3; i++) spot('terminal', 182.5 + i * 1.5, G, z1 - 4.2, 0, 'browse', [[172, cz], [hx0 + 3, cz + 4], [182.5 + i * 1.5, z1 - 6], [182.5 + i * 1.5, z1 - 4.2]]);
    put('shoeshine', 202, G, z1 - 1.8, 2); spot('terminal', 200.7, G + 0.9, z1 - 1.5, 0, 'sit'); spot('terminal', 201.9, G, z1 - 3.4, Math.PI, 'work');
    put('luggagecart', 204.5, G, cz - 6, 1); put('luggagecart', 196, G, z0 + 4.5, 0); put('trunk', 186, G, cz + 5.5, 1); put('trunk', 186.2, G + 0.75, cz + 5.5, 0, false);
    for (const [x, z] of [[181, 20], [181, 62], [205, 20], [205, 62]]) put('lampstd', x, G, z, 0);
    for (const [x, z] of [[183, cz - 4], [183, cz + 4], [201, cz - 4], [201, cz + 4]]) put('plantpot', x, G, z, 0);
    for (let i = 0; i < 8; i++) spot('terminal', 186 + (i % 4) * 5, G, cz + (i < 4 ? -2 : 2), i < 4 ? 0 : Math.PI, 'stand', [[172, cz], [186 + (i % 4) * 5, cz + (i < 4 ? -2 : 2)]]);
    // mosaic mural bands on the side walls (harbour + rails)
    for (const [zw, rot] of [[z0 - 0.01, 0], [z1 + 0.01, 2]]) { const m = M(200, 20, 1); for (let x = 0; x < 200; x++) for (let y = 0; y < 20; y++) { let c = y < 6 ? K.navy : y < 8 ? K.jade : col(0xe8d3a8); if (y >= 8 && ((x / 25) | 0) % 2 && y < 16 && ((x % 25) - 12) ** 2 / 90 + (y - 8) ** 2 / 50 < 1) c = K.limeD; if (y === 7 && x % 4 === 0) c = K.gold; if (y > 15 && x % 16 < 2) c = K.jade; if (y === 0 || y === 19) c = K.gold; m.set(x, y, 0, c); } AF.placeStatic(AF.meshModel(m, { vs: 1 / 8, anchor: [0.5, 0, 0] }), 192.5, G + 0.25, zw, rot, { collide: false }); }
    for (const [x, z] of [[184, cz], [192.5, 26], [192.5, 56], [201, cz]]) put('chandelier', x, sp + b - 4, z, 0, false);
    CIV.light(192.5, 8, cz, 2.0, 30); CIV.light(185, 5, 24, 1.0, 14); CIV.light(185, 5, 58, 1.0, 14);
    // --- light shafts from the great window (day only, additive, cheap)
    if (AF.scene) {
      const mat = new THREE.MeshBasicMaterial({ color: 0xfff0c8, transparent: true, opacity: 0.03, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false });
      const shafts = [];
      for (const [dz, w] of [[-10, 2.2], [-4, 2.6], [3, 2.4], [9, 2.0], [0, 3.2]]) { const g = new THREE.BoxGeometry(22, 1.2, w * 0.7); const ms = new THREE.Mesh(g, mat); ms.position.set(189, 7.5, cz + dz); ms.rotation.order = 'YZX'; ms.rotation.set(0, dz * 0.012, -0.52); ms.renderOrder = 3; ms.castShadow = false; ms.frustumCulled = false; AF.scene.add(ms); shafts.push(ms); }
      AF.onTick('civic-shafts', 710, () => { const n = AF.time.night || 0, cam = AF.camera; const near = cam && Math.hypot(cam.position.x - 192, cam.position.z - cz) < 140; mat.opacity = 0.028 * (1 - n); for (const s of shafts) s.visible = near && n < 0.9; });
    }
    // --- DEPARTURES BOARD (split flap) over the concourse opening, facing the hall (west)
    const BX = hx1 - 0.05, BY = 8.0;
    CIV.cols(hx1, z0 - 0.75, hx1 + 0.75, z1 + 0.75, (x, z) => { const dz = (z - cz) / a; return [G, Math.abs(dz) < 1 ? sp + b * Math.sqrt(1 - dz * dz) + 0.5 : sp + 0.5, K.lime]; });   // back wall of the hall
    F(hx1 - 0.01, G, cz - 9, hx1 + 0.76, G + 5.5, cz + 9, 0);                                    // wide opening to the concourse
    F(hx1 - 0.25, BY - 0.5, cz - 7.5, hx1, BY + 5.5, cz + 7.5, K.black); F(hx1 - 0.5, BY - 0.75, cz - 7.75, hx1, BY - 0.5, cz + 7.75, K.gold); F(hx1 - 0.5, BY + 5.5, cz - 7.75, hx1, BY + 5.75, cz + 7.75, K.gold);
    CIV.textProp('DEPARTURES', K.gold, hx1 - 0.26, BY + 4.8, cz, 3, 1 / 14);
    { const amber = col(0xffc050, { emit: 0xffb030, emitK: 1.6, mode: 'always', jitter: 0, edge: 0 }), tile = col(0x222226, { jitter: 0.05, edge: 0.4 });
      const lines = ['4:15  SILVER HERON      BAYPORT     1', '4:30  CAPE LIMITED      KINGSHAVEN  2', '4:45  KEYSTONE CLIPPER  NEW ALBION  3', '5:00  NIGHT OWL         THE CAPITAL 4', '5:20  SEA BREEZE        CORAL BAY   1', '5:40  GOLDEN ARROW      WESTFIELD   2', '6:10  COASTLINE LTD     THE CAPITAL 3', '6:30  SUNDOWN FLYER     PACIFICA    4', '7:00  HALF MOON         SOUTHPORT   1', '7:45  HARBOUR EXPRESS   NEW ALBION  2', '8:10  LAKESHORE         LAKE CITY   3', '9:00  MOONLIGHT MAIL    NORTHGATE   4', 'ON TIME  ALL TRAINS  PLATFORMS 1-4', '10:15 OWL SLEEPER      THE CAPITAL 3'];
      const geos = lines.map((s) => { const m = AF.textModel(s, amber, { pad: 1, bg: tile, spacing: 1 }); return AF.meshModel(m, { vs: 1 / 18, anchor: [0.5, 0.5, 0] }); });
      const rows = []; CIV.boardFlips = 0;
      if (AF.scene) for (let r = 0; r < 6; r++) { const ms = AF.modelMesh(geos[r]); ms.position.set(hx1 - 0.3, BY + 3.9 - r * 0.72, cz); ms.rotation.y = -Math.PI / 2; ms.castShadow = false; ms.frustumCulled = false; AF.scene.add(ms); rows.push({ ms, idx: r, anim: 0, next: -1 }); }
      let acc = 0, ptr = 6;
      CIV.boardUpdate = (dt) => {
        acc += dt;
        if (acc > 2.6 && rows.length) { acc = 0; const row = rows[CIV.boardFlips % rows.length]; row.anim = 0.36; row.next = ptr % geos.length; ptr++; CIV.boardFlips++; }
        for (const r of rows) { if (r.anim <= 0) continue; r.anim -= dt; const t = Math.max(0, r.anim) / 0.36; if (t < 0.5 && r.next >= 0) { r.ms.geometry = geos[r.next]; r.next = -1; } r.ms.scale.y = Math.max(0.05, Math.abs(t * 2 - 1)); }
      };
      AF.onTick('civic-board', 336, (dt) => { const cam = AF.camera; if (cam && Math.hypot(cam.position.x - 200, cam.position.z - cz) > 170) return; CIV.boardUpdate(dt); });
    }
    // --- CONCOURSE (x 207.75..232): lower hall with gates to the platforms
    const CX0 = hx1 + 0.75, CX1 = 232, CH = 8.5;
    F(CX0, G, z0 - 3, CX1, CH, z1 + 3, K.lime); F(CX0, G, z0 - 2.5, CX1 - 0.5, CH - 0.5, z1 + 2.5, 0);
    F(CX0, G - 0.25, z0 - 2.5, CX1, G, z1 + 2.5, K.marbleW); CIV.checker(CX0, z0 - 2.5, CX1 - 0.5, z1 + 2.5, G, K.marbleW, K.marbleG, 1.5);
    F(CX0, CH - 0.75, z0 - 2.5, CX1 - 0.5, CH - 0.5, z1 + 2.5, K.plaster);
    for (let x = CX0 + 3; x < CX1 - 1; x += 4) F(x, CH - 0.75, z0 - 2.5, x + 0.25, CH - 0.5, z1 + 2.5, K.gold);
    F(hx1 - 0.01, G, cz - 9, hx1 + 0.76, G + 5.5, cz + 9, 0);
    for (let x = CX0 + 3; x < CX1 - 2; x += 6) put('decolamp', x, CH - 3.2, cz, 0, false);
    for (const z of [22, 60]) for (let x = CX0 + 3; x < CX1 - 2; x += 6) put('decolamp', x, CH - 3.2, z, 0, false);
    CIV.light(220, 6, cz, 1.4, 20); CIV.light(220, 6, 22, 1.0, 14); CIV.light(220, 6, 60, 1.0, 14);
    const PLAT = [[14, 19.5, 1], [25.5, 31.5, 2], [37.5, 44.5, 3], [50.5, 56.5, 4]], TRK = [22.5, 34.5, 47.5, 60];
    for (const [pz0, pz1, n] of PLAT) {
      F(CX1 - 0.51, G, pz0 + 0.5, CX1 + 0.01, G + 3.5, pz1 - 0.5, 0);
      F(CX1 - 0.75, G + 3.5, pz0 + 0.25, CX1 - 0.5, G + 4.25, pz1 - 0.25, K.bronze);
      CIV.textProp('TRACK ' + n, K.gold, CX1 - 0.76, G + 3.6, (pz0 + pz1) / 2, 3, 1 / 18);
      for (let q = 0; q < 3; q++) spot('terminal', CX1 - 3 - q * 0.9, G, (pz0 + pz1) / 2, Math.PI / 2, 'stand', [[172, cz], [215, cz], [CX1 - 3 - q * 0.9, (pz0 + pz1) / 2]]);
    }
    for (const z of [26, 56]) { for (let x = CX0 + 3; x < CX1 - 4; x += 5) { F(x - 1.5, G, z - 0.25, x + 1.5, G + 1.5, z + 0.25, K.woodD); F(x - 1.5, G + 0.5, z - 0.9, x + 1.5, G + 0.75, z + 0.9, K.oak); spot('terminal', x - 0.6, G + 0.75, z - 0.6, Math.PI, 'sit'); spot('terminal', x + 0.6, G + 0.75, z + 0.6, 0, 'sit'); AF.addCollider(x - 1.5, G, z - 0.9, x + 1.5, G + 0.75, z + 0.9); } }
    put('luggagecart', 226, G, 32.5, 1); put('luggagecart', 226, G, 49.5, 3);
    { const f = face([CX0, z0 - 3, CX1, z1 + 3], 'n'); CIV.winGrid(f, 1, f.len - 1, 3.5, 2.0, [2.5], 4.0, { glass: true, t: 0.5 }); const f2 = face([CX0, z0 - 3, CX1, z1 + 3], 's'); CIV.winGrid(f2, 1, f2.len - 1, 3.5, 2.0, [2.5], 4.0, { glass: true, t: 0.5 }); }
    F(CX0 - 0.25, CH, z0 - 3.25, CX1 + 0.25, CH + 0.75, z1 + 3.25, K.limeW); F(CX0, CH, z0 - 2.5, CX1, CH + 0.75, z1 + 2.5, 0); F(CX0, CH - 0.25, z0 - 2.5, CX1, CH, z1 + 2.5, K.limeD);
    for (const [vx, vz] of [[212, 20], [226, 64], [220, 12]]) { F(vx, CH, vz, vx + 2, CH + 2, vz + 2, K.steelD); F(vx - 0.25, CH + 2, vz - 0.25, vx + 2.25, CH + 2.25, vz + 2.25, K.steel); }
    // --- TRAIN SHED: platforms, tracks, arched steel roof on trusses
    const SX0 = 232, SX1 = 299.75, SZ0 = 11, SZ1 = 70;
    for (const [pz0, pz1] of PLAT) { F(SX0, 0.25, pz0, 292, G, pz1, K.paveD); F(SX0, G - 0.25, pz0, 292, G, pz1, K.pave); F(SX0, G - 0.25, pz0, 292, G, pz0 + 0.5, col(0xe8c040, { jitter: 0.2 })); F(SX0, G - 0.25, pz1 - 0.5, 292, G, pz1, col(0xe8c040, { jitter: 0.2 })); }
    const ballast = col(0x6b6358, { jitter: 0.8, edge: 0.3 }), sleeper = col(0x4a3524, { jitter: 0.4 }), railC = K.steelL;
    W.ground(SX0, SZ0, 300, SZ1, 1, K.paveD);
    for (const tz of TRK) {
      W.ground(SX0, tz - 1.75, 300, tz + 1.75, 1, ballast);
      for (let x = SX0; x < SX1; x += 0.75) F(x, 0.25, tz - 1.25, x + 0.25, 0.5, tz + 1.25, sleeper);
      for (const rz of [-0.75, 0.75]) F(SX0, 0.5, tz + rz - 0.125, SX1, 0.75, tz + rz + 0.125, railC);
      F(SX0 - 0.5, 0.25, tz - 1.25, SX0, 1.5, tz + 1.25, K.redD); F(SX0 - 0.5, 1.0, tz - 1.0, SX0 - 0.25, 1.25, tz + 1.0, K.gold);   // buffer stops
    }
    const sa = (SZ1 - SZ0) / 2, scz = (SZ0 + SZ1) / 2, ssp = 7, sb = 11;
    for (let x = SX0 + 1; x < 296; x += 6) {
      for (const z of [SZ0 + 0.5, SZ1 - 1]) F(x - 0.25, 0.25, z - 0.25, x + 0.25, ssp, z + 0.25, K.steelD);
      CIV.cols(x - 0.25, SZ0, x + 0.25, SZ1, (xx, z) => { const dz = (z - scz) / sa; if (Math.abs(dz) >= 1) return null; const y = ssp + sb * Math.sqrt(1 - dz * dz); return [y - 0.75, y, K.steelD]; });
      CIV.cols(x - 0.125, SZ0, x + 0.125, SZ1, (xx, z) => { const dz = (z - scz) / sa; if (Math.abs(dz) >= 1) return null; const y = ssp + sb * Math.sqrt(1 - dz * dz) - 2.25; const lat = Math.abs(((z - SZ0) % 3) - 1.5) < 0.2; return lat ? [Math.max(ssp - 1, y), y + 1.5, K.steel] : [y - 0.25 + 0.0, y, K.steel]; });
    }
    CIV.cols(SX0, SZ0, 296, SZ1, (x, z) => { const dz = (z - scz) / sa; if (Math.abs(dz) >= 1) return null; const y = ssp + sb * Math.sqrt(1 - dz * dz); const sky = Math.abs(dz) < 0.35 && ((x - SX0) % 6) > 0.5; return [y, y + 0.25, sky ? K.glass : ((Math.floor(x) % 2) ? col(0x7d858e, { jitter: 0.2 }) : col(0x707881, { jitter: 0.2 }))]; });
    CIV.cols(SX0, SZ0, SX0 + 0.25, SZ1, (x, z) => { const dz = (z - scz) / sa; if (Math.abs(dz) >= 1) return null; const y = ssp + sb * Math.sqrt(1 - dz * dz); return [CH + 0.75, y, K.lime]; });
    for (const z of [SZ0, SZ1 - 0.5]) F(SX0, ssp - 0.5, z, 296, ssp, z + 0.5, K.steelD);
    // platform furniture: lamps, benches, clocks, trunks, signs
    for (const [pz0, pz1, n] of PLAT) { const pc = (pz0 + pz1) / 2; for (let x = 240; x < 290; x += 12) { put('lampstd', x, G, pc + 1.6, 0); if (x % 24 === 0) { F(x + 3, G, pc - 1.75, x + 6, G + 0.5, pc - 1.25, K.oak); spot('terminal', x + 4.5, G + 0.5, pc - 1.5, Math.PI / 2, 'sit', [[172, cz], [215, cz], [228, pc], [x + 4.5, pc], [x + 4.5, pc - 1.5]]); } } F(238, 3.75, pc - 0.75, 238.25, 5.5, pc + 0.75, K.navy); F(238.25, 2.0, pc - 0.1, 238.5, 5.5, pc + 0.1, K.iron); CIV.textProp(String(n), K.gold, 237.99, 4.0, pc, 3, 1 / 5, { bold: true }); put('trunk', 250, G, pc + 1, 0); }
    for (let x = 240; x < 290; x += 24) AF.addLight({ x, y: 5, z: scz, color: 0xffe0b0, intensity: 1.0, range: 16, kind: 'interior' });
    // --- TRAINS: streamlined silver + maroon, ~40 m (loco + 2 coaches) at 1/4 m. One stamped static, one dynamic.
    const silver = col(0xc6ccd4, { jitter: 0.12, edge: 0.3 }), silverD = col(0x9aa2ac, { jitter: 0.12, edge: 0.3 }), maroon = col(0x7a1f2a, { jitter: 0.15, edge: 0.25 }), chrome = col(0xe6eaf0, { jitter: 0.05, edge: 0.3 });
    const winT = col(0x2a3040, { emit: 0xffd490, emitK: 1.4, mode: 'night', jitter: 0, edge: 0.2 }), head = col(0xfff6d8, { emit: 0xfff0c0, emitK: 3, mode: 'night', jitter: 0, edge: 0 }), tail = col(0xff4030, { emit: 0xff3020, emitK: 2.5, mode: 'always', jitter: 0, edge: 0 });
    const trainModel = () => {
      const L = 160, m = M(L, 18, 13);
      const car = (x0, x1, nose, tailEnd) => {
        for (let x = x0; x < x1; x++) {
          const tn = nose ? Math.max(0, (x0 + 18 - x) / 18) : 0, tt = tailEnd ? Math.max(0, (x - (x1 - 10)) / 10) : 0;
          const inset = Math.round(tn * tn * 5 + tt * tt * 3), top = 17 - Math.round(tn * tn * 10 + tt * tt * 6);
          for (let y = 2; y < top; y++) for (let z = inset; z < 13 - inset; z++) {
            let c = silver; if (y >= 7 && y < 9) c = maroon; if (y >= 10 && y < 13 && !nose) c = ((x - x0) % 6 < 4) ? winT : silver; if (y >= top - 2) c = silverD; if (z === inset || z === 12 - inset) { if (y === 4 || y === 14) c = chrome; } else if (y < top - 1 && z > inset && z < 12 - inset && y > 2) continue;
            m.set(x, y, z, c);
          }
          for (let z = inset; z < 13 - inset; z++) m.set(x, top - 1, z, (z % 3 === 0) ? silver : silverD);
          m.set(x, 1, 3, K.iron); m.set(x, 1, 9, K.iron);
        }
        for (let x = x0 + 2; x < x1 - 2; x += 10) for (const z of [2, 10]) { m.box(x, 0, z, x + 3, 2, z + 1, K.iron); }
      };
      car(0, 56, true, false); car(57, 108, false, false); car(109, 160, false, true);
      m.box(0, 3, 5, 2, 5, 8, chrome); m.box(0, 5, 5, 1, 6, 8, head); for (let y = 4; y < 8; y++) m.set(2, y, 6, K.black);
      for (let x = 12; x < 26; x += 2) { m.set(x, 12, 1, winT); m.set(x, 12, 11, winT); }
      m.box(20, 11, 0, 24, 13, 1, winT); m.box(20, 11, 12, 24, 13, 13, winT);
      m.box(158, 6, 3, 160, 8, 5, tail); m.box(158, 6, 8, 160, 8, 10, tail);
      for (const x of [56, 108]) m.box(x, 4, 3, x + 1, 14, 10, K.iron);
      return m;
    };
    const tm = trainModel();
    const TRAINX = 244;
    W.stamp(tm, TRAINX, 0.5, TRK[2] - 1.625, 0);
    AF.addCollider(TRAINX, 0.5, TRK[2] - 1.6, TRAINX + 40, 4.75, TRK[2] + 1.6);
    const tg = AF.meshModel(tm, { vs: 0.25, anchor: [0, 0, 0.5] });
    if (AF.scene) {
      const mesh = AF.modelMesh(tg); mesh.position.set(TRAINX + 40, 0.5, TRK[1]); mesh.rotation.y = Math.PI; mesh.frustumCulled = false; AF.scene.add(mesh);
      const coll = AF.addCollider(TRAINX, 0.5, TRK[1] - 1.6, TRAINX + 40, 4.75, TRK[1] + 1.6);
      const CYC = 240; CIV.trainX = TRAINX;
      AF.onTick('civic-train', 255, (dt, t) => {
        const c = (AF.clock.t || t) % CYC; let off = 0;
        if (c < 90) off = 0; else if (c < 140) off = 110 * AF.smooth(90, 140, c); else if (c < 170) off = 110; else if (c < 230) off = 110 * (1 - AF.smooth(170, 230, c)); else off = 0;
        mesh.position.x = TRAINX + 40 + off; mesh.visible = TRAINX + off < 305; CIV.trainX = TRAINX + off;
        coll.x0 = TRAINX + off; coll.x1 = TRAINX + off + 40; if (off > 60) { coll.y0 = -50; coll.y1 = -49; } else { coll.y0 = 0.5; coll.y1 = 4.75; }
      });
    }
    CIV.textProp('COASTLINE LIMITED', maroon, TRAINX + 20, 3.4, TRK[2] + 1.63, 0, 1 / 16);
    AF.addLabel('Train Shed', 265, scz, 'place');
    AF.addBuilding({ id: 'terminal', name: 'Union Terminal', kind: 'station', box: [173, 0, 10, 300, 25, 72], doors: [{ x: 172.5, y: 0.25, z: cz, yaw: Math.PI / 2 }, { x: 172.5, y: 0.25, z: cz - 4, yaw: Math.PI / 2 }, { x: 172.5, y: 0.25, z: cz + 4, yaw: Math.PI / 2 }], floors: [G], interior: true });
    AF.addViewpoint('Union Terminal', [120, 28, 40], [215, 10, 40]);
  });
  CIV.walkTest('civic: Terminal Ave -> hall -> platform 3', 171.5, 0.25, 41, [[190, 41], [215, 41], [250, 41]], 1.25);
  // =====================================================================================================
  // POLISH (round 1): library + museum entrances, museum great hall exhibits, Terminal Ave frontage
  // =====================================================================================================
  def('sarcophagus', () => { const m = M(10, 6, 26), gd = K.gold, bl = col(0x1f4f9a, { jitter: 0.2 }), fc = col(0xd9a86a, { jitter: 0.2 }); for (let z = 0; z < 26; z++) { const w = z < 4 ? 3 : z > 20 ? 4 : 5; for (let x = 5 - w; x < 5 + w; x++) for (let y = 0; y < (z > 20 ? 6 : 5); y++) m.set(x, y, z, (z % 3 === 0 && z < 19) ? bl : gd); } m.box(3, 5, 21, 7, 6, 25, fc); m.set(4, 6, 23, K.black); m.set(6, 6, 23, K.black); m.box(2, 5, 17, 8, 6, 19, bl); m.box(4, 5, 10, 6, 6, 14, K.red); return m; });
  def('canopic', () => { const m = M(16, 6, 4); for (let i = 0; i < 4; i++) { const x = i * 4; m.box(x + 1, 0, 1, x + 3, 4, 3, col(0xd8c8a0, { jitter: 0.3 })); m.box(x + 1, 4, 1, x + 3, 6, 3, [K.gold, K.jade, K.red, K.navy][i]); } return m; }, 1 / 12);
  def('knight', () => { const m = M(10, 18, 8), st = K.steelL, sd = K.steel; m.box(2, 0, 2, 4, 7, 5, st); m.box(6, 0, 2, 8, 7, 5, st); m.box(2, 7, 2, 8, 12, 6, st); m.box(1, 11, 2, 9, 12, 6, sd); m.box(0, 7, 3, 2, 12, 5, st); m.box(8, 7, 3, 10, 12, 5, st); m.box(3, 12, 2, 7, 15, 6, st); m.box(3, 13, 6, 7, 14, 7, K.black); m.box(4, 15, 3, 6, 18, 5, K.red); m.box(0, 5, 5, 2, 11, 8, K.navy); m.box(0, 7, 7, 2, 9, 8, K.gold); m.line(9, 1, 5, 9, 17, 5, K.woodD); m.box(8, 16, 4, 10, 18, 6, sd); m.box(2, 3, 5, 8, 4, 6, sd); return m; });
  def('poster', () => { const m = M(10, 14, 1); m.box(0, 0, 0, 10, 14, 1, K.bronze); m.box(1, 1, 0, 9, 13, 1, col(0xf0d890)); m.box(1, 1, 0, 9, 5, 1, K.navy); m.box(2, 5, 0, 8, 9, 1, col(0xe07a3a)); m.box(3, 6, 0, 7, 8, 1, col(0xf8e0a0)); m.box(4, 2, 0, 9, 4, 1, K.steelL); m.box(1, 11, 0, 9, 12, 1, K.red); return m; });
  def('brassurn', () => { const m = M(8, 14, 8); m.box(2, 0, 2, 6, 1, 6, K.bronzeD); m.box(3, 1, 3, 5, 3, 5, K.brass); m.sphere(4, 7, 4, 3.6, K.brass, (x, y) => (y < 10 ? K.brass : 0)); m.box(1, 9, 1, 7, 10, 7, K.gold); m.box(2, 10, 2, 6, 11, 6, K.bronzeD); m.sphere(4, 12, 4, 2.4, K.leafD, (x, y, z) => (y >= 11 ? (AF.hash3(x, y, z) > 0.6 ? K.leafY : K.leafD) : 0)); return m; }, 1 / 12);
  def('bustped', () => { const m = M(8, 30, 8), mb = col(0xeeeae0, { jitter: 0.08 }); m.box(0, 0, 0, 8, 2, 8, K.marbleB); m.box(1, 2, 1, 7, 16, 7, K.marbleB); m.box(0, 16, 0, 8, 18, 8, K.marbleB); m.box(1, 18, 2, 7, 21, 6, mb); m.box(2, 21, 2, 6, 23, 6, mb); m.box(2, 23, 2, 6, 29, 7, mb); m.box(2, 28, 2, 6, 30, 6, mb); m.set(3, 26, 6, K.marbleB); m.set(4, 26, 6, K.marbleB); m.box(3, 18, 7, 5, 19, 8, K.gold); return m; }, 1 / 16);
  def('cardcat', () => { const m = M(20, 11, 7); m.box(0, 0, 0, 20, 11, 7, K.oak); for (let x = 1; x < 19; x += 3) for (let y = 3; y < 11; y += 2) { m.box(x, y, 6, x + 2, y + 1.5, 7, K.woodL); m.set(x + 1, y, 6, K.brass); } m.box(0, 0, 6, 20, 2, 7, K.woodD); m.box(8, 11, 2, 12, 12, 5, K.paper); return m; }, 1 / 12);
  def('ticketbooth', () => { const m = M(20, 22, 12); m.box(0, 0, 0, 20, 9, 12, K.woodD); m.box(1, 9, 1, 19, 20, 11, K.glass); for (const x of [0, 19]) m.box(x, 9, 0, x + 1, 20, 12, K.brass); m.box(0, 20, 0, 20, 22, 12, K.gold); m.box(8, 5, 11, 12, 8, 12, K.brass); m.box(3, 9, 5, 17, 10, 8, K.oak); m.box(2, 1, 11, 18, 4, 12, K.red); return m; }, 1 / 8);
  def('stanchion', () => { const m = M(2, 8, 2); m.box(0, 0, 0, 2, 1, 2, K.brass); m.box(0.5, 1, 0.5, 1.5, 7, 1.5, K.brass); m.box(0, 7, 0, 2, 8, 2, K.gold); return m; }, 1 / 8);
  AF.onBuild('civic-2-polish', 305, () => {
    const G = 1.25;
    // ---------------- LIBRARY entrance (portico x -96..-91, hall x -105.5..-96.5)
    { const PC = -118;
      CIV.checker(-96, PC - 9, -91, PC + 9, G, K.marbleW, K.marbleB, 1);
      CIV.border(-96, PC - 9, -91, PC + 9, G);
      for (const sz of [-1, 1]) put('brassurn', -95.4, G, PC + sz * 2.0, 0);
      for (const oz of [-6.5, 6.5]) CIV.medallion(-93.4, PC + oz, 0.8, G);
      for (const oz of [-4, 0, 4]) put('lantern', -93.5, 6.5, PC + oz, 0, false);
      for (const oz of [-4, 0, 4]) CIV.runner('x', -96, -91, PC + oz, 0.75, G);
      for (const oz of [-8, -5, -2.4, 2.4, 5, 8]) put('sconce', -91.85, 3.4, PC + oz, 1, false);
      for (const sz of [-1, 1]) { put('brassurn', -95.2, G, PC + sz * 8.3, 0); }
      put('bustped', -101.8, G, PC - 4.6, 1); CIV.textProp('WISDOM', K.gold, -101.3, G + 1.3, PC - 4.6, 1, 1 / 40);
      put('cardcat', -101.6, G, PC + 4.8, 1); put('cardcat', -103.4, G, PC + 4.8, 1); CIV.textProp('CARD CATALOGUE', K.gold, -100.7, G + 1.55, PC + 4.8, 1, 1 / 40);
      spot('library', -100.4, G, PC + 5.3, -Math.PI / 2, 'browse'); spot('library', -100.4, G, PC + 3.9, -Math.PI / 2, 'browse');
      CIV.border(-105.5, -141.5, -96.5, -94.5, G);
      CIV.medallion(-98.6, PC, 1.8, G, K.marbleG, K.marbleW);
      CIV.runner('x', -100.4, -96.5, PC, 1.0, G);
      for (const oz of [-2.1, 2.1]) put('turnstile', -99.4, G, PC + oz, 0);
      put('directory', -97.3, G, -128, 1); CIV.textProp('DIRECTORY', K.gold, -97.15, G + 2.85, -128, 1, 1 / 24);
      for (const z of [-107.5, -131]) { put('bench', -97.2, G, z, 1); for (const o of [-0.6, 0.6]) spot('library', -97.3, G + 0.5, z + o, -Math.PI / 2, 'sit'); }
      for (const oz of [-6, 6]) put('sconce', -96.51, G + 3.0, PC + oz, 3, false);
      CIV.light(-98.5, 4, PC, 0.9, 9);
    }
    // ---------------- MUSEUM entrance (portico x -96..-91, lobby x -108..-96.5)
    const PC = -41;
    CIV.checker(-96, PC - 8, -91, PC + 8, G, K.marbleW, K.marbleG, 1);
    CIV.border(-96, PC - 8, -91, PC + 8, G);
    for (const sz of [-1, 1]) put('stanchion', -95.4, G, PC + sz * 2.0, 0);
    for (const oz of [-5.2, 5.2]) CIV.medallion(-94.2, PC + oz, 0.7, G);
    put('ticketbooth', -100.5, G, PC - 6.2, 1); CIV.textProp('SKY SHOW 10c', K.gold, -99.72, G + 2.6, PC - 6.2, 1, 1 / 30); spot('museum', -101.4, G, PC - 6.2, Math.PI / 2, 'counter');
    for (let k = 0; k < 4; k++) put('stanchion', -98.6 + k * 1.2, G, PC - 4.9, 0, false);
    for (const [x, z] of [[-98.8, -47.3], [-97.7, -47.5], [-96.7, -47.1]]) spot('museum', x, G, z, -Math.PI / 2, 'queue');
    for (const oz of [-4, 0, 4]) put('lantern', -93.5, 6.0, PC + oz, 0, false);
    for (const oz of [-4, 0, 4]) CIV.runner('x', -96, -91, PC + oz, 0.75, G);
    for (const oz of [-7, -3.4, 3.4, 7]) put('sconce', -91.2, 3.6, PC + oz, 1, false);
    CIV.border(-108, -63.5, -96.5, -18.5, G);
    CIV.runner('x', -108.75, -96.5, PC, 1.0, G); CIV.medallion(-102, PC, 2.3, G, K.marbleR, K.marbleW);
    for (const oz of [-2.2, 2.2]) put('turnstile', -99.5, G, PC + oz, 0);
    put('directory', -97.4, G, PC + 10.5, 1); CIV.textProp('GALLERIES', K.gold, -97.25, G + 2.85, PC + 10.5, 1, 1 / 24);
    for (const oz of [-9, 9]) put('sconce', -96.51, G + 3.0, PC + oz, 3, false);
    // ---------------- MUSEUM GREAT HALL: patterned floor
    CIV.cols(-144.5, -67.5, -108.5, -14.5, (x, z) => {
      const u = Math.floor((x + z) / 2), v = Math.floor((x - z) / 2);
      let c = (u + v) & 1 ? K.marbleW : K.marbleY;
      if (x < -143.5 || x > -109.5 || z < -66.5 || z > -15.5) c = K.jade; else if (x < -143 || x > -110 || z < -66 || z > -16) c = K.gold;
      const dr = Math.max(Math.abs(x + 127) - 5.5, Math.abs(z - PC) - 11.5); if (dr > 0 && dr < 0.75) c = K.marbleB;
      return [G - 0.25, G, c];
    });
    // rope barrier ends + brass ball finials, placards
    const DX = -127, DZ = PC;
    for (const sz of [-10, 10]) F(DX - 5, G + 0.75, DZ + sz - 0.05, DX + 5, G + 0.875, DZ + sz + 0.2, K.red);
    for (let x = DX - 5; x <= DX + 5; x += 2.5) for (const sz of [-10, 10]) F(x - 0.125, G, DZ + sz - 0.125, x + 0.125, G + 1.0, DZ + sz + 0.125, K.brass);
    for (let z = DZ - 10; z <= DZ + 10; z += 2.5) for (const sx of [-5, 5]) F(DX + sx - 0.25, G + 1.0, z - 0.25, DX + sx + 0.25, G + 1.25, z + 0.25, K.gold);
    for (const [x, z, rot] of [[DX, DZ + 10.9, 0], [DX + 5.9, DZ - 4, 1], [-120, -20, 0], [-127, -55.5, 0], [-112, PC + 10.6, 0], [-141.3, -34.5, 1], [-112, PC - 7.2, 0]]) put('placard', x, G, z, rot, false);
    // ---------------- EGYPTIAN CORNER (north centre): sarcophagus in a glass case, hieroglyph screen, obelisk, canopic jars
    { const ex = -127, ez = -60;
      F(ex - 2, G, ez - 2.5, ex + 2, G + 0.75, ez + 2.5, K.granite);
      F(ex - 1.5, G + 0.75, ez - 2, ex + 1.5, G + 2.5, ez + 2, K.glass); F(ex - 1.25, G + 0.75, ez - 1.75, ex + 1.25, G + 2.25, ez + 1.75, 0); F(ex - 1.5, G + 2.5, ez - 2, ex + 1.5, G + 2.75, ez + 2, K.bronze);
      put('sarcophagus', ex, G + 0.75, ez, 0, false); AF.addCollider(ex - 2, G, ez - 2.5, ex + 2, G + 2.75, ez + 2.5);
      const sand = col(0xd9c08a, { jitter: 0.3, edge: 0.3 }), gl = [K.black, K.navy, K.red, K.jade];
      CIV.each(ex - 7, G, -64.75, ex + 7, G + 3.75, -64.5, (x, y, z) => { if (y > G + 3.4) return K.gold; if (y < G + 0.3) return K.granite; const h = AF.hash3(Math.floor(x * 4), Math.floor(y * 4), 7); const col2 = Math.floor((x - ex + 7) / 1.25); return (h > 0.72 && Math.floor(x * 4) % 5 !== 0) ? gl[(col2 + Math.floor(y)) % 4] : sand; });
      F(ex - 7.25, G, -64.5, ex - 6.75, G + 3.75, -64, K.gold); F(ex + 6.75, G, -64.5, ex + 7.25, G + 3.75, -64, K.gold);
      const pk = col(0xb8766a, { jitter: 0.4, edge: 0.3 });
      for (let k = 0; k < 9; k++) { const h = 0.6 - k * 0.04; F(ex + 6 - h, G + k * 0.5, ez - h, ex + 6 + h, G + (k + 1) * 0.5, ez + h, pk); } F(ex + 5.75, G + 4.5, ez - 0.25, ex + 6.25, G + 5.0, ez + 0.25, K.gold);
      F(ex - 7, G, ez - 1, ex - 5, G + 1.0, ez + 1, K.woodD); put('canopic', ex - 6, G + 1.0, ez, 0, false);
      for (const [x, z, y] of [[ex, ez + 3.2, Math.PI], [ex - 2.8, ez, Math.PI / 2], [ex + 2.8, ez + 1.5, -Math.PI / 2], [ex - 6, ez + 1.8, Math.PI], [ex + 6, ez + 1.8, Math.PI], [ex - 3, -63.4, Math.PI]]) spot('museum', x, G, z, y, 'browse', [[-94, PC], [-110, PC], [-118, -52], [x, z]]);
      CIV.textProp('ANCIENT EGYPT', K.gold, ex, G + 3.95, -64.49, 0, 1 / 16);
    }
    // ---------------- KNIGHT in armour (mirrors the totem)
    F(-113, G, PC + 8, -111, G + 0.75, PC + 10, K.granite); F(-113.25, G + 0.75, PC + 7.75, -110.75, G + 1.0, PC + 10.25, K.limeW);
    put('knight', -112, G + 1.0, PC + 9, 0); spot('museum', -112, G, PC + 11.4, Math.PI, 'browse', [[-94, PC], [-110, PC], [-112, PC + 11.4]]); spot('museum', -109.6, G, PC + 9, -Math.PI / 2, 'browse', [[-94, PC], [-109.6, PC + 5], [-109.6, PC + 9]]);
    // ---------------- DIORAMA window (west wall): bear by a mountain lake
    { const m = M(48, 28, 16), sky = [col(0x8cc0e8), col(0xa8d0ee), col(0xc8e0f0)], mt = col(0x7a8a9a, { jitter: 0.3 }), snow = K.white, grs = col(0x6a9a4a, { jitter: 0.5 }), lake = col(0x3f7fa8, { jitter: 0.2 }), bear = col(0x5a3a22, { jitter: 0.4 }), pine = col(0x2e5e3a, { jitter: 0.5 });
      m.box(0, 0, 0, 48, 28, 16, K.bronzeD); m.box(2, 3, 1, 46, 26, 16, 0);
      for (let x = 2; x < 46; x++) for (let y = 3; y < 26; y++) { const hM = 12 + 8 * Math.max(0, 1 - Math.abs(x - 28) / 14) + 3 * Math.sin(x * 0.7); m.set(x, y, 1, y < hM ? (y > hM - 2 && hM > 17 ? snow : mt) : sky[Math.min(2, ((y - 3) / 8) | 0)]); }
      for (let x = 2; x < 46; x++) for (let z = 1; z < 15; z++) { m.set(x, 3, z, (z < 7 && x > 8 && x < 34) ? lake : grs); m.set(x, 2, z, K.woodD); }
      for (const [tx, tz] of [[5, 4], [40, 5], [43, 9], [7, 10]]) { m.box(tx, 4, tz, tx + 1, 7, tz + 1, K.woodD); for (let y = 6; y < 16; y++) { const r = (16 - y) * 0.3; m.box(tx - r, y, tz - r, tx + r + 1, y + 1, tz + r + 1, pine); } }
      m.box(18, 4, 9, 26, 9, 12, bear); m.box(24, 7, 9, 28, 11, 12, bear); m.box(27, 8, 10, 29, 9, 11, K.black); for (const bx of [18, 24]) { m.box(bx, 4, 9, bx + 2, 4, 10, bear); } m.box(19, 4, 11, 21, 5, 12, bear);
      for (let x = 2; x < 46; x++) for (let y = 3; y < 26; y++) m.set(x, y, 15, K.glass);
      F(-144.5, G, -42.5, -142.25, G + 0.75, -35.5, K.woodD);
      AF.placeStatic(AF.meshModel(m, { vs: 1 / 8, anchor: [0.5, 0, 0] }), -144.49, G + 0.75, -39, 1);
      for (let i = 0; i < 3; i++) spot('museum', -140.8, G, -41 + i * 2, -Math.PI / 2, 'browse');
      CIV.textProp('NORTHERN WILDERNESS', K.gold, -142.49, G + 4.4, -39, 1, 1 / 24); }
    for (let i = 0; i < 4; i++) spot('museum', -121 + (i % 2) * 2, G, PC + 4 + i * 1.5, -Math.PI / 2, 'browse');
    // ---------------- UNION TERMINAL frontage on Terminal Ave
    const T = CIV.TERM, cz = T.cz, FX0 = 174.5;
    F(170.5, 4.75, cz - 12, 174.5, 5.0, cz + 12, K.bronzeD); F(170.5, 5.0, cz - 12, 174.5, 5.25, cz + 12, K.copper);
    F(170.25, 4.75, cz - 12.25, 170.75, 5.75, cz + 12.25, K.limeWN); F(170.24, 4.95, cz - 12.25, 170.5, 5.05, cz + 12.25, K.goldN); F(170.24, 5.55, cz - 12.25, 170.5, 5.65, cz + 12.25, K.goldN);
    for (let x = 171.25; x < 174.4; x += 1.5) for (let z = cz - 11.5; z < cz + 11.6; z += 1.5) F(x, 4.75, z, x + 0.25, 5.0, z + 0.25, K.bulbN);
    for (const oz of [-11, -4, 4, 11]) for (let t = 0; t <= 1.001; t += 0.05) W.setM(174.25 - t * 3.5, 9 - t * 3.75, cz + oz, K.bronze);
    CIV.textProp('UNION TERMINAL', K.goldN, 170.24, 5.05, cz, 3, 1 / 12, { bold: true });
    for (const sz of [-1, 1]) CIV.textProp('TAXIS', K.gold, 170.24, 5.1, cz + sz * 10, 3, 1 / 16);
    F(170.5, 5.25, cz - 1.25, 171.75, 7.25, cz + 1.25, K.limeWN); F(170.25, 7.25, cz - 1.5, 171.75, 7.5, cz + 1.5, K.goldN); CIV.clock(170.49, 6.25, cz, 3, 0.8);
    AF.addLight({ x: 172.5, y: 4.3, z: cz, color: 0xffe0b0, intensity: 1.2, range: 12, kind: 'sign' });
    for (const sz of [-1, 1]) for (const oz of [11.2, 19]) { put('lampstd', 173.6, 0.25, cz + sz * oz, 0); }
    for (const sz of [-1, 1]) { CIV.flagpole(FX0 + 0.75, 29, cz + sz * 25, sz > 0 ? 1 : 0); put('poster', 173.49, 2.0, cz + sz * 25, 3, false); put('poster', 173.99, 2.0, cz + sz * 21.5, 3, false); }
    put('luggagecart', 172.0, 0.25, cz + 15.5, 0); put('trunk', 171.2, 0.25, cz + 14.2, 1);
    spot('terminal', 172.0, 0.25, cz + 16.9, -Math.PI / 2, 'work');
    for (const sz of [-1, 1]) put('urn', 174.0, G, cz + sz * 22.8, 0);
  });
  CIV.walkTest('civic: museum lobby past turnstiles', -90, 1.25, -41, [[-104, -41], [-110, -41]], 1.25);
  // =====================================================================================================
  // POLISH (round 2): luggage piles, light shafts, platform clocks + station master, City Hall steps, plaza vendors
  // =====================================================================================================
  def('tripod', () => { const m = M(6, 14, 6); m.line(3, 10, 3, 0, 0, 0, K.woodD); m.line(3, 10, 3, 6, 0, 1, K.woodD); m.line(3, 10, 3, 3, 0, 6, K.woodD); m.box(1, 10, 1, 5, 13, 5, K.black); m.box(2, 11, 5, 4, 12, 6, K.steelL); m.box(0, 12, 2, 1, 14, 3, K.steelL); return m; });
  def('chestnut', () => { const m = M(12, 20, 8); for (const x of [0, 10]) m.box(x, 0, 1, x + 2, 3, 7, K.black); m.box(0, 3, 0, 12, 10, 8, K.red); m.box(1, 10, 1, 11, 11, 7, K.steelD); m.box(3, 11, 2, 9, 13, 6, K.iron); m.box(4, 13, 3, 8, 14, 5, col(0x6a3a1a)); m.box(5, 13, 3, 6, 18, 4, K.steel); for (const x of [0, 11]) m.box(x, 10, 0, x + 1, 19, 1, K.brass); m.box(0, 18, 0, 12, 20, 8, K.flowerY); for (let x = 0; x < 12; x += 2) m.box(x, 18, 0, x + 1, 20, 8, K.red); m.box(2, 5, 7, 10, 8, 8, K.flowerY); return m; });
  def('suitcases', () => { const m = M(10, 9, 7); m.box(0, 0, 0, 7, 3, 6, col(0x7a4a2a, { jitter: 0.4 })); m.box(1, 3, 1, 6, 5, 5, K.navy); m.box(6, 0, 1, 10, 6, 5, col(0xb88a5a, { jitter: 0.4 })); m.box(2, 5, 2, 5, 7, 4, K.fabricG); m.box(3, 7, 2, 4, 8, 4, K.brass); m.box(7, 6, 2, 9, 7, 4, K.brass); m.box(0, 1, 6, 7, 2, 7, K.brass); return m; });
  def('lampB', () => { const m = M(8, 44, 8); m.box(1, 0, 1, 7, 3, 7, K.bronzeD); m.box(3, 3, 3, 5, 32, 5, K.bronze); m.box(2, 14, 2, 6, 15, 6, K.gold); m.box(2, 32, 2, 6, 40, 6, K.lampA); m.box(1, 40, 1, 7, 41, 7, K.bronze); m.box(3, 41, 3, 5, 44, 5, K.gold); return m; });
  CIV.shafts = (list, cx, cz, R = 150) => {
    if (!AF.scene) return;
    const mat = new THREE.MeshBasicMaterial({ color: 0xfff0c8, transparent: true, opacity: 0.025, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false });
    const ms = list.map(([x, y, z, len, w, rx, rz]) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, len, w), mat); m.position.set(x, y, z); m.rotation.set(rx, 0, rz); m.renderOrder = 3; m.castShadow = false; m.frustumCulled = false; AF.scene.add(m); return m; });
    AF.onTick('civic-shafts-' + cx, 711, () => { const n = AF.time.night || 0, cam = AF.camera, near = cam && Math.hypot(cam.position.x - cx, cam.position.z - cz) < R; mat.opacity = 0.025 * (1 - n); for (const m of ms) m.visible = near && n < 0.9; });
  };
  AF.onBuild('civic-polish2', 306, () => {
    const G = 1.25;
    { const sh = []; for (let x = -138; x < -108; x += 7) sh.push([x, 7.5, -132, 9, 2.2, 0.35, 0.18]); for (let x = -140.75; x < -106; x += 9) sh.push([x, 6.5, -137.5, 8, 1.4, -0.5, 0]); CIV.shafts(sh, -124, -130); }
    { const sh = []; for (let z = -60; z < -18; z += 9) sh.push([-127 + ((z / 9) % 2 ? 3 : -3), 8, z, 13, 2.5, 0, 0.25]); CIV.shafts(sh, -127, -41); }
    const T = CIV.TERM, cz = T.cz;
    for (const [x, z, r] of [[188.5, 36.5, 0], [196.5, 45.5, 2], [202, 37, 1], [182, 46, 3], [205, 58, 0]]) { put('suitcases', x, G, z, r); const sx = x + (r % 2 ? 0 : 1.1), sz = z + (r % 2 ? 1.1 : 0); spot('terminal', sx, G, sz, r * Math.PI / 2, 'stand', [[172, cz], [sx, cz], [sx, sz]]); }
    for (let i = 0; i < 6; i++) { const x = T.hx0 + 5.5 + i * 3; spot('terminal', x, G, 19.5, Math.PI, 'counter', [[172, cz], [x, cz - 4], [x, 19.5]]); }
    for (const [x, z] of [[252, 41], [264, 28.5], [264, 53.5]]) { F(x - 0.125, 5.5, z - 0.125, x + 0.125, 17, z + 0.125, K.steelD); F(x - 0.75, 3.75, z - 0.35, x + 0.75, 5.5, z + 0.35, K.bronze); CIV.clock(x, 4.62, z + 0.36, 0, 0.6); CIV.clock(x, 4.62, z - 0.36, 2, 0.6); }
    put('flagsmall', 246.6, G, 40.2, 1, false); spot('terminal', 246, G, 40.2, Math.PI / 2, 'work', [[172, cz], [215, cz], [246, 41], [246, 40.2]]);
    for (const [x, z, r] of [[258, 43.3, 0], [270, 29.8, 1], [276, 54.2, 3], [284, 16.5, 0]]) { put('luggagecart', x, G, z, r); put('suitcases', x + 2, G, z, r); }
    spot('terminal', 259.5, G, 43.5, -Math.PI / 2, 'work', [[172, cz], [215, cz], [240, 41], [259.5, 41], [259.5, 43.5]]);
    const cx = CIV.CH.cx;
    for (const sx of [-1, 1]) { put('lampB', cx + sx * 12.5, 0.5, -88.5, 0); AF.addLight({ x: cx + sx * 12.5, y: 5, z: -88.5, color: 0xffd9a0, intensity: 0.8, range: 10, kind: 'street' }); }
    // (round 2: the wedding group + photographer moved to the west steps, off the door axis — see 30-civic.js civic-r2-hall)
    put('chestnut', -54, 0.25, -26, 1); AF.addSpot({ building: null, x: -52.9, y: 0.25, z: -26, yaw: -Math.PI / 2, kind: 'work' });
    for (let i = 0; i < 3; i++) AF.addSpot({ building: null, x: -55.6, y: 0.25, z: -27 + i, yaw: Math.PI / 2, kind: 'stand', path: [[-40, -12], [-55.6, -20], [-55.6, -27 + i]] });
    CIV.textProp('HOT CHESTNUTS 5C', K.red, -54.75, 2.6, -26, 3, 1 / 24);
    put('shoeshine', -18, 0.25, -52, 3); AF.addSpot({ building: null, x: -18.3, y: 0.9, z: -52.6, yaw: -Math.PI / 2, kind: 'sit' }); AF.addSpot({ building: null, x: -19.9, y: 0.25, z: -52.6, yaw: Math.PI / 2, kind: 'work' });
    for (const [a, b] of [[[-70, -40], [-12, -60]], [[-64, -12], [-18, -70]], [[-12, -24], [-70, -52]]]) AF.addSpot({ building: null, x: b[0], y: 0.25, z: b[1], yaw: Math.atan2(b[0] - a[0], b[1] - a[1]), kind: 'stand', path: [a, [(a[0] + b[0]) / 2 - 18, (a[1] + b[1]) / 2], b] });
  });
  AF.test('civic: round-2 polish present', () => ({ ok: typeof CIV.shafts === 'function' && AF.spots.filter((s) => s.building === 'terminal').length >= 90, info: AF.spots.filter((s) => s.building === 'terminal').length + ' terminal spots' }));
  AF.test('civic: departures board flips', () => { if (!CIV.boardUpdate) return { ok: false, info: 'no board' }; const a = CIV.boardFlips; CIV.boardUpdate(3); CIV.boardUpdate(0.2); CIV.boardUpdate(3); return { ok: CIV.boardFlips >= a + 2, info: 'flips ' + a + ' -> ' + CIV.boardFlips }; });
  AF.test('civic: registries (buildings, spots >= 70)', () => { const ids = ['cityhall', 'library', 'museum', 'terminal']; const b = AF.buildings.filter((x) => ids.includes(x.id)).length, s = AF.spots.filter((x) => ids.includes(x.building) || (x.building == null && x.x > -72 && x.x < -10 && x.z > -72 && x.z < -10)).length; return { ok: b === 4 && s >= 70, info: b + ' buildings, ' + s + ' spots' }; });
  // =====================================================================================================
  // ROUND 2 (showcase): library lions WISDOM & WONDER, Union Terminal forecourt life (porters, taxi line, flowers, easel)
  // =====================================================================================================
  // recumbent carved lion (1/8 m, head toward +z), optional autumn wreath round the neck
  const lionModel = (wreath) => { const m = M(14, 18, 24), c = K.limeW, d = K.limeD, e = K.lime;
    m.box(2, 0, 2, 12, 6, 16, c); m.sphere(7, 4, 5, 5, c, (x, y) => (y >= 0 ? c : 0)); m.box(3, 6, 4, 11, 8, 12, c);            // body + haunch
    for (let z = 3; z < 15; z += 3) m.box(2, 1 + (z % 2), z, 3, 5, z + 1, d);                                                     // ribs / flank shading
    for (const px of [2, 9]) { m.box(px, 0, 15, px + 3, 2, 23, c); for (let t = 0; t < 3; t++) m.set(px + t, 0, 23, d); m.box(px, 2, 15, px + 3, 4, 18, e); }  // forepaws
    m.sphere(7, 9.5, 16, 5.6, e, (x, y, z) => ((x * 3 + y * 5 + z * 7) % 4 === 0 ? d : e));                                     // mane
    m.box(4, 8, 18, 10, 14, 23, c); m.box(5, 8, 22, 9, 11, 24, c); m.box(6, 10, 23, 8, 11, 24, K.graniteR); m.set(5, 12, 23, K.black); m.set(8, 12, 23, K.black);   // head, muzzle, nose, eyes
    m.box(4, 14, 19, 5, 15, 20, d); m.box(9, 14, 19, 10, 15, 20, d); m.box(6, 8, 23, 8, 9, 24, d);                              // ears, mouth line
    for (let z = 1; z < 10; z++) m.set(12, 0, z, c); m.box(12, 0, 0, 14, 2, 2, e);                                                  // tail + tuft
    if (wreath) { const lv = [K.leafA, K.leafY, K.flowerR, K.leafD]; for (let k = 0; k < 44; k++) { const a = k / 44 * Math.PI * 2, r = 6.2; m.set(7 + Math.cos(a) * r, 8.2 + Math.sin(a) * 1.2 + (k % 3 === 0 ? 1 : 0), 15.5 + Math.sin(a) * r * 0.55, lv[k % 4]); m.set(7 + Math.cos(a) * (r - 0.8), 7.4 + Math.sin(a) * 1.2, 15.5 + Math.sin(a) * (r - 0.8) * 0.55, lv[(k + 1) % 4]); } m.box(6, 5, 20, 8, 7, 21, K.red); m.box(5, 4, 20, 6, 5, 21, K.red); m.box(8, 4, 20, 9, 5, 21, K.red); }
    return m; };
  def('lion2', () => lionModel(false)); def('lion2w', () => lionModel(true));
  def('easel', () => { const m = M(10, 15, 6), b = col(0x24302a, { jitter: 0.15 }); m.line(1, 0, 1, 2, 14, 3, K.woodD); m.line(9, 0, 1, 8, 14, 3, K.woodD); m.line(5, 0, 6, 5, 13, 3, K.woodD);
    m.box(1, 5, 2, 10, 14, 3, K.woodD); m.box(2, 6, 3, 9, 13, 3, 0); m.box(2, 6, 2, 9, 13, 3, b); m.box(2, 13, 3, 9, 14, 4, 0);
    for (let y = 7; y < 12; y++) for (let x = 3; x < 8; x++) if (AF.hash2(x * 3 + 1, y * 5) > 0.42) m.set(x, y, 3, K.white); m.box(3, 12, 3, 8, 13, 4, K.paper); return m; }, 1 / 8);
  def('porterCart', () => { const m = M(12, 10, 7), tr = [col(0x6a3f22, { jitter: 0.4 }), K.navy, col(0x8a2a2a), col(0xb88a5a, { jitter: 0.3 })];
    m.box(0, 1, 0, 12, 2, 7, K.woodD); for (const x of [1, 9]) { m.box(x, 0, 0, x + 2, 2, 1, K.iron); m.box(x, 0, 6, x + 2, 2, 7, K.iron); } m.box(11, 2, 1, 12, 9, 6, K.brass); m.box(11, 8, 0, 12, 9, 7, K.brass);
    m.box(1, 2, 1, 7, 5, 6, tr[0]); m.box(1, 3.5, 1, 7, 4, 6, K.brass); m.box(7, 2, 1, 11, 6, 5, tr[1]); m.box(2, 5, 2, 6, 7, 5, tr[2]); m.box(7, 6, 2, 10, 8, 4, tr[3]); m.box(3, 7, 3, 5, 8, 4, K.brass); return m; });
  AF.onBuild('civic-r2-front', 308, () => {
    const G = 1.25, PC = -118, sp = (b, x, y, z, yaw, kind, extra) => AF.addSpot(Object.assign({ building: b, x, y, z, yaw, kind }, extra || {}));
    // --- library lions (bigger, carved) with name plaques; WONDER wears an autumn wreath
    for (const [sz, name, key] of [[-1, 'WISDOM', 'lion2'], [1, 'WONDER', 'lion2w']]) {
      put(key, -90, 2.0, PC + sz * 11.5, 1, false); AF.addCollider(-91.5, 0.25, PC + sz * 11.5 - 1.25, -88.5, 4.3, PC + sz * 11.5 + 1.25);
      F(-88.5, 0.75, PC + sz * 11.5 - 1.0, -88.25, 1.5, PC + sz * 11.5 + 1.0, K.bronze); CIV.textProp(name, K.gold, -88.24, 0.93, PC + sz * 11.5, 1, 1 / 20);
    }
    // --- UNION TERMINAL forecourt (x 170..174.5 along Terminal Ave): porters, taxi line, flowers, chalk board, newsboy, shoeshine
    const T = CIV.TERM, cz = T.cz;
    put('easel', 171.4, 0.25, cz - 9.5, 3); CIV.textProp('TODAY', K.white, 171.02, 1.72, cz - 9.5, 3, 1 / 40);
    sp('terminal', 170.1, 0.25, cz - 10.1, Math.PI / 2, 'stand'); sp('terminal', 170.2, 0.25, cz - 8.8, Math.PI / 2 + 0.3, 'stand');
    put('flowerstall', 172.6, 0.25, cz - 16.5, 3); sp('terminal', 173.9, 0.25, cz - 16.5, -Math.PI / 2, 'work', { role: 'florist' });
    sp('terminal', 170.3, 0.25, cz - 17.1, Math.PI / 2, 'stand'); sp('terminal', 170.4, 0.25, cz - 15.7, Math.PI / 2, 'stand', { age: 'kid' });
    for (const [x, z, r] of [[171.6, cz + 9.6, 0], [171.3, cz - 13.2, 2]]) { put('porterCart', x, 0.25, z, r); sp('terminal', x + 1.3, 0.25, z + (r ? -0.3 : 0.3), -Math.PI / 2, 'work', { role: 'porter' }); }
    sp('terminal', 170.2, 0.25, cz + 8.9, Math.PI / 2, 'stand');
    for (let i = 0; i < 5; i++) { const z = cz + 12.6 + i * 0.95; sp('terminal', 170.35, 0.25, z, -Math.PI / 2 + (i % 2 ? 0.25 : -0.2), 'stand', { queue: i, role: 'taxi' }); if (i % 2 === 0) put('suitcases', 171.2, 0.25, z + 0.3, 1, false); }
    put('placard', 170.4, 0.25, cz + 11.8, 3, false); CIV.textProp('TAXI', K.gold, 170.42, 0.72, cz + 11.8, 3, 1 / 48);
    sp('terminal', 170.4, 0.25, cz + 7.0, -Math.PI / 2, 'work', { role: 'newsboy' });
    put('shoeshine', 172.9, 0.25, cz + 22.2, 3); sp('terminal', 172.6, 0.9, cz + 21.6, -Math.PI / 2, 'sit'); sp('terminal', 171.1, 0.25, cz + 21.6, Math.PI / 2, 'work', { role: 'shoeshine' });
    for (const [x, z, r] of [[173.3, cz + 25.5, 1], [173.4, cz - 22.0, 0], [171.5, cz - 20.2, 2]]) put('trunk', x, 0.25, z, r);
    sp('terminal', 172.2, 0.25, cz - 21.2, 0.4, 'stand'); sp('terminal', 172.8, 0.25, cz + 24.3, Math.PI, 'stand');
  });
  AF.test('civic: terminal forecourt >= 10 spots', () => { const n = AF.spots.filter((s) => s.building === 'terminal' && s.x < 175 && s.x > 169 && Math.abs(s.z - CIV.TERM.cz) < 28).length; return { ok: n >= 10, info: n + ' spots' }; });
  // --- (round 2) FOUCAULT PENDULUM in the museum lobby: a brass bob on a 5.6 m wire, its swing plane creeping round a
  //     compass rose; a ring of red pins (a few already knocked down), brass rail, placard. Dynamic, one tick, culled.
  AF.onBuild('civic-r2-pendulum', 309, () => {
    const G = 1.25, X = -102, Z = -27.5, TOPY = 6.95, L = TOPY - (G + 0.55);
    CIV.medallion(X, Z, 1.6, G, K.marbleB, K.marbleW, K.gold);
    for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2; if (k % 4 === 0) W.setM(X + Math.cos(a) * 1.45, G - 0.125, Z + Math.sin(a) * 1.45, K.red); }
    { const m = M(66, 14, 66), c = 33; for (let k = 0; k < 20; k++) { const a = k / 20 * Math.PI * 2, x = c + Math.cos(a) * 31, z = c + Math.sin(a) * 31; m.box(x - 0.5, 0, z - 0.5, x + 1, 12, z + 1, K.brass); m.set(x, 12, z, K.gold); }
      for (let k = 0; k < 400; k++) { const a = k / 400 * Math.PI * 2; m.set(c + Math.cos(a) * 31, 11, c + Math.sin(a) * 31, K.brass); m.set(c + Math.cos(a) * 31, 5, c + Math.sin(a) * 31, K.bronzeD); }
      AF.placeStatic(AF.meshModel(m, { vs: 1 / 16, anchor: [0.5, 0, 0.5] }), X, G, Z, 0, { collide: false }); AF.addCollider(X - 2.0, G, Z - 2.0, X + 2.0, G + 0.9, Z + 2.0); }
    { const m = M(40, 3, 40); for (let k = 0; k < 28; k++) { const a = k / 28 * Math.PI * 2, x = 20 + Math.cos(a) * 11, z = 20 + Math.sin(a) * 11; if (k === 3 || k === 4 || k === 17) m.box(x, 0, z, x + 2, 1, z + 1, K.red); else { m.box(x, 0, z, x + 1, 3, z + 1, K.red); m.set(x, 2, z, K.white); } } AF.placeStatic(AF.meshModel(m, { vs: 1 / 16, anchor: [0.5, 0, 0.5] }), X, G, Z, 0, { collide: false }); }
    F(X - 0.5, TOPY, Z - 0.5, X + 0.5, TOPY + 0.05, Z + 0.5, K.brass);
    put('placard', X + 2.6, G, Z, 1, false); CIV.textProp('THE EARTH TURNS', K.bronzeD, X + 2.62, G + 1.02, Z, 1, 1 / 64);
    for (const [dx, dz] of [[0, 2.6], [-2.6, 0.3], [0.4, -2.6]]) spot('museum', X + dx, G, Z + dz, Math.atan2(-dx, -dz), 'browse');
    if (!AF.scene) return;
    const wm = M(1, 16, 1); wm.box(0, 0, 0, 1, 16, 1, K.steelL);
    const wire = AF.modelMesh(AF.meshModel(wm, { vs: 1 / 32, anchor: [0.5, 0, 0.5] })); wire.scale.set(1, L / 0.5, 1); wire.position.y = -L;
    const bm = M(10, 12, 10); bm.sphere(5, 6, 5, 4.8, K.brass, (x, y) => (y < 2 ? K.gold : K.brass)); bm.box(4, 11, 4, 6, 12, 6, K.bronzeD); bm.box(4.5, 0, 4.5, 5.5, 1, 5.5, K.bronzeD);
    const bob = AF.modelMesh(AF.meshModel(bm, { vs: 1 / 16, anchor: [0.5, 0, 0.5] })); bob.position.y = -L - 0.2;
    const arm = new THREE.Group(); arm.add(wire, bob); const plane = new THREE.Group(); plane.position.set(X, TOPY, Z); plane.add(arm); AF.scene.add(plane);
    for (const o of [wire, bob]) { o.castShadow = false; o.frustumCulled = false; }
    const w = Math.sqrt(9.81 / L);
    CIV.pendulum = { plane, arm, frames: 0 };
    AF.onTick('civic-pendulum', 337, (dt, t) => { const cam = AF.camera; if (cam && Math.hypot(cam.position.x - X, cam.position.z - Z) > 90) return; arm.rotation.x = 0.2 * Math.sin(t * w); plane.rotation.y = 0.35 + t * 0.012; CIV.pendulum.frames++; });
  });
  AF.test('civic: Foucault pendulum swings', () => { const p = CIV.pendulum; if (!p) return { ok: false, info: 'none' }; const a = p.arm.rotation.x; AF.step(20); return { ok: p.frames > 0 || p.arm.rotation.x !== a, info: 'frames ' + p.frames }; });
}

} catch (e) { AF.partError('31-civic-2.js', e); }

