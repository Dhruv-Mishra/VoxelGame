// ================================================================ 20-downtown.js
try {
// ===== 20-downtown: PORT SOLACE DOWNTOWN — ten art deco towers (exteriors, crowns, roofs, flags, mast lights)  (OWNER: downtown) =====
// Lots: dt-bank [10,-147,72,-88] · dt-tower [88,-147,147,-88] · dt-hotel [10,-72,72,-10] · dt-store [88,-72,147,-10] · dt-radio [88,10,147,72]
// Helpers are shared with 21-downtown-2.js (interiors) through AF._dt.
{
  const W = AF.W;
  const D = AF._dt = AF._dt || {};
  D.towers = [];
  let P = null;
  D.pal = () => {
    if (P) return P;
    const c = AF.col;
    P = {
      granite: c(0x4a3a44, { jitter: 0.3, edge: 0.3, rough: 0.16 }), graniteL: c(0x5e4c58, { jitter: 0.3, rough: 0.22 }),
      bronze: c(0x8a5a2b, { jitter: 0.2, edge: 0.4, metal: 0.85, rough: 0.32 }), brass: c(0xc79a3e, { jitter: 0.15, edge: 0.3, metal: 1, rough: 0.25 }),
      gold: c(0xe0b040, { jitter: 0.12, edge: 0.3, metal: 1, rough: 0.22 }), goldLit: c(0xe8b84a, { emit: 0xffd27a, emitK: 1.6, mode: 'night', jitter: 0.1, metal: 1, rough: 0.25 }),
      creamLit: c(0xeee2c2, { emit: 0xffe7b8, emitK: 0.9, mode: 'night', jitter: 0.1 }),
      roof: c(0x5f5c57, { jitter: 0.45, pat: 'tar' }), roofD: c(0x55524e, { jitter: 0.4 }), coping: c(0xd8d0c0, { jitter: 0.2, pat: 'stone' }),
      shop: c(0x44505a, { emit: 0xffcf8a, emitK: 1.5, mode: 'night', jitter: 0.1, edge: 0.1 }),
      win: [AF.col('window'), c(0x3b4a58, { emit: 0xffb35c, emitK: 1.7, mode: 'night', jitter: 0.15, edge: 0.1, win: 'office' }),
        c(0x3e4c58, { emit: 0xfff0d0, emitK: 1.3, mode: 'night', jitter: 0.15, edge: 0.1, win: 'office' }), c(0x364452, { emit: 0x9fc8ff, emitK: 1.1, mode: 'night', jitter: 0.1, edge: 0.1, win: 'office' }),
        c(0x2a323b, { jitter: 0.12, edge: 0.1, win: 'office' })],
      wood: c(0x7a5230, { jitter: 0.5 }), woodD: c(0x57391f, { jitter: 0.4 }), steel: c(0x5d6166, { jitter: 0.2, metal: 0.6, rough: 0.45 }), steelD: c(0x3c3f44, { jitter: 0.2 }),
      red: c(0xb3312c, { jitter: 0.2 }), redLit: c(0xff3b2a, { emit: 0xff2a1a, emitK: 3, mode: 'always', jitter: 0 }),
      copper: c(0x5fa58c, { jitter: 0.5, edge: 0.3 }), copperD: c(0x4b8a74, { jitter: 0.5 }),
      lantern: c(0xfff3c0, { emit: 0xffe7a0, emitK: 2.2, mode: 'night', jitter: 0.05, glass: false }),
      awnRed: c(0x9e2a2b, { jitter: 0.2 }), awnTeal: c(0x2f7f7a, { jitter: 0.2 }), awnGreen: c(0x2f6a3e, { jitter: 0.2 }),
      bulb: c(0xfff1c9, { emit: 0xffd48a, emitK: 3, mode: 'night', jitter: 0 }),
      neonRed: c(0xff5a4a, { emit: 0xff2f2a, emitK: 3.2, mode: 'night', jitter: 0 }), neonBlue: c(0x8fd0ff, { emit: 0x4fb4ff, emitK: 2.6, mode: 'night', jitter: 0 }),
      black: AF.col('black'), white: AF.col('white'), glass: AF.col('glass'), lamp: AF.col('lamp'),
      // v2 materials
      stain: c(0xdfe4ea, { jitter: 0.05, edge: 0.5, metal: 1, rough: 0.14 }), stainLit: c(0xe8eef4, { emit: 0xeaf4ff, emitK: 1.5, mode: 'night', metal: 1, rough: 0.18, jitter: 0.05 }),
      triLit: c(0x2c3440, { emit: 0xfff4d8, emitK: 2.4, mode: 'night', jitter: 0.05 }),
      jadeLit: c(0x5fb89a, { emit: 0x7fffd0, emitK: 1.1, mode: 'night', jitter: 0.3, pat: 'terracotta' }),
      redGlow: c(0xc8322a, { emit: 0xff4030, emitK: 1.4, mode: 'night', jitter: 0.15 }),
      hwin: [c(0x3a4652, { emit: 0xffc07a, emitK: 1.5, mode: 'night', jitter: 0.12, edge: 0.1, win: 'hotel' }), c(0x2e3844, { jitter: 0.1, edge: 0.1, win: 'hotel' }), c(0x3a4a5a, { emit: 0xffd9a0, emitK: 1.3, mode: 'night', jitter: 0.12, edge: 0.1, win: 'hotel' })],
    };
    return P;
  };
  // ---- face helpers. face: 'N' (z=z0, outward -z) 'S' (z=z1) 'W' (x=x0) 'E' (x=x1). d = depth inward from the surface (neg = proud)
  const FF = (b, f, u0, u1, y0, y1, d0, d1, c) => {
    if (f === 'N') W.fill(u0, y0, b.z0 + d0, u1, y1, b.z0 + d1, c);
    else if (f === 'S') W.fill(u0, y0, b.z1 - d1, u1, y1, b.z1 - d0, c);
    else if (f === 'W') W.fill(b.x0 + d0, y0, u0, b.x0 + d1, y1, u1, c);
    else W.fill(b.x1 - d1, y0, u0, b.x1 - d0, y1, u1, c);
  };
  D.FF = FF;
  const span = (b, f) => (f === 'N' || f === 'S') ? [b.x0, b.x1] : [b.z0, b.z1];
  D.span = span;
  const winCol = (a, b, c, set) => { const p = D.pal(), h = AF.hash3(a * 4 | 0, b * 4 | 0, c * 4 | 0); if (set) return set[(h * set.length) | 0]; return h < 0.24 ? p.win[0] : h < 0.38 ? p.win[1] : h < 0.5 ? p.win[2] : h < 0.66 ? p.win[3] : p.win[4]; };
  // a solid (or hollow: o.hollow) mass with windows. o: {c body, spand, style 'pier'|'punch', bay, ww, st (storey), wh, sill, faces, cornice, parapet,
  //   pierC (projecting pier colour), frieze (zigzag frieze colour under the cornice), band, corner (finials), chev (chevron relief in spandrels),
  //   fins (projecting piers rise this many metres above the roof), wins (window colour set)}
  D.mass = (x0, z0, x1, z1, y0, y1, o = {}) => {
    const p = D.pal(), b = { x0, z0, x1, z1 };
    if (o.hollow && x1 - x0 > 4 && z1 - z0 > 4) {
      W.fill(x0, y0, z0, x1, y1, z0 + 1, o.c); W.fill(x0, y0, z1 - 1, x1, y1, z1, o.c);
      W.fill(x0, y0, z0 + 1, x0 + 1, y1, z1 - 1, o.c); W.fill(x1 - 1, y0, z0 + 1, x1, y1, z1 - 1, o.c);
      W.fill(x0 + 1, y1 - 1, z0 + 1, x1 - 1, y1, z1 - 1, o.c);
    } else W.fill(x0, y0, z0, x1, y1, z1, o.c);
    const bay = o.bay || 2, ww = o.ww || 1.25, st = o.st || 3.75, wh = o.wh || Math.max(2.25, st - 1.25), faces = o.faces || 'NSWE';
    const wy0 = o.wy0 ?? y0, wy1 = y1 - (o.topBand ?? 1.25), ph = (o.parapetH || 1) + 0.25;
    for (const f of faces) {
      const [a, e] = span(b, f), L = e - a, n = Math.floor((L - 1) / bay); if (n < 1) continue;
      const s0 = a + (L - n * bay) / 2;
      for (let i = 0; i < n; i++) {
        const u = Math.round((s0 + i * bay + (bay - ww) / 2) * 4) / 4;
        if (o.style === 'pier') {
          FF(b, f, u, u + ww, wy0 + 0.75, wy1, 0, 0.25, 0);
          FF(b, f, u, u + ww, wy0 + 0.75, wy1, 0.25, 0.5, o.spand);
          for (let y = wy0 + 1; y + wh <= wy1; y += st) {
            FF(b, f, u, u + ww, y, y + wh, 0.25, 0.5, winCol(u, y, f.charCodeAt(0) + x0, o.wins));
            if (o.chev) { const nb = Math.round(ww * 4); for (let k = 0; k < nb; k++) { const yy = y + wh + 0.25 + Math.min(k, nb - 1 - k) * 0.25; if (yy + 0.25 <= Math.min(y + st, wy1) - 0.25 + 0.001) FF(b, f, u + k * 0.25, u + k * 0.25 + 0.25, yy, yy + 0.25, 0, 0.25, o.chev); } }
          }
          if (o.proud !== false && i < n - 1) FF(b, f, u + ww, u + bay, wy0 + 0.5, y1 + (o.fins || 0), -0.25, 0, o.pierC || o.c);   // projecting pier (+ fin above the roof)
        } else {
          for (let y = wy0 + 1; y + wh <= wy1; y += st) {
            FF(b, f, u, u + ww, y, y + wh, 0, 0.25, 0);
            FF(b, f, u, u + ww, y, y + wh, 0.25, 0.5, winCol(u, y, f.charCodeAt(0) + z0, o.wins));
            if (o.sill !== false) FF(b, f, u - 0.25, u + ww + 0.25, y - 0.25, y, -0.25, 0, o.sill || p.coping);
          }
        }
      }
      // band courses every 3 storeys (in the spandrel), zigzag frieze under the cornice
      if (o.band !== false && o.style === 'pier') for (let y = wy0 + 1 + wh + 0.25, k = 0; y + 0.25 < wy1 - 0.5; y += st, k++) if (k % 3 === 2) FF(b, f, a, e, y, y + 0.25, -0.5, 0, o.band || p.coping);
      if (o.frieze !== false && wy1 + 0.75 <= y1 - 0.5) {
        const fc = o.frieze || p.goldLit;
        for (let uu = a; uu < e; uu += 0.25) { const k = ((uu - a) * 4 | 0) % 6, hh = k < 3 ? k : 6 - k; FF(b, f, uu, uu + 0.25, wy1 + hh * 0.25, wy1 + hh * 0.25 + 0.25, -0.25, 0, fc); }
      }
    }
    if (o.cornice !== false) { const cc = o.cornice || p.coping; W.fill(x0 - 0.25, y1 - 0.5, z0 - 0.25, x1 + 0.25, y1 - 0.25, z1 + 0.25, cc); }
    W.fill(x0, y1 - 0.25, z0, x1, y1, z1, o.roof || p.roof);   // roof skin (tar)
    if (o.parapet !== false) { const pc = o.parapetC || o.c; W.walls(x0, y1, z0, x1, y1 + (o.parapetH || 1), z1, pc); W.walls(x0, y1 + (o.parapetH || 1), z0, x1, y1 + ph, z1, p.coping); }
    // corner piers rising past the parapet as gilded finials (urns)
    if (o.corner !== false && (x1 - x0) > 6 && (z1 - z0) > 6) {
      const top = y1 + (o.parapet !== false ? ph : 0) + 1 + (o.fins || 0), pc = o.pierC || o.c;
      for (const [fx, fz] of [[x0 - 0.25, z0 - 0.25], [x1 - 0.75, z0 - 0.25], [x0 - 0.25, z1 - 0.75], [x1 - 0.75, z1 - 0.75]]) {
        W.fill(fx, Math.max(y0, wy0 + 0.5), fz, fx + 1, top, fz + 1, pc);
        W.fill(fx - 0.25, top, fz - 0.25, fx + 1.25, top + 0.25, fz + 1.25, o.finialC || p.gold);
        W.fill(fx + 0.25, top + 0.25, fz + 0.25, fx + 0.75, top + 0.75, fz + 0.75, o.finialC || p.goldLit);
        W.fill(fx + 0.375, top + 0.75, fz + 0.375, fx + 0.625, top + 1.25, fz + 0.625, o.finialC || p.goldLit);
      }
    }
    return b;
  };
  // radial fan (sunburst / Chrysler arch) on face f of box b: centre u=cu, y=cy, radius R (ry = vertical radius), alternating rays colA/colB,
  // rim colour rim (null = none). d0..d1 = depth (negative = proud). only the upper half (y >= cy).
  D.fan = (b, f, cu, cy, R, ry, rays, colA, colB, rim, d0 = -0.25, d1 = 0) => {
    for (let u = cu - R; u < cu + R; u += 0.25) for (let y = cy; y < cy + ry; y += 0.25) {
      const du = (u + 0.125 - cu) / R, dy = (y + 0.125 - cy) / ry, r = Math.hypot(du, dy); if (r >= 1) continue;
      let col;
      if (rim && r > 0.84) col = rim;
      else if (r < 0.2) col = colA;
      else { const ang = Math.atan2(du, dy); col = (((ang / Math.PI + 1) * rays) | 0) % 2 ? colA : colB; }
      if (col) FF(b, f, u, u + 0.25, y, y + 0.25, d0, d1, col);
    }
  };
  // stepped ziggurat: n steps of height sh, inset di per step, alternating colours cols
  D.zig = (x0, z0, x1, z1, y, n, sh, di, cols, edge) => {
    for (let i = 0; i < n; i++) {
      const a0 = x0 + i * di, a1 = x1 - i * di, b0 = z0 + i * di, b1 = z1 - i * di; if (a1 - a0 < 0.5 || b1 - b0 < 0.5) break;
      W.fill(a0, y + i * sh, b0, a1, y + (i + 1) * sh, b1, cols[i % cols.length]);
      if (edge) W.walls(a0 - 0.25, y + (i + 1) * sh - 0.25, b0 - 0.25, a1 + 0.25, y + (i + 1) * sh, b1 + 0.25, edge);
    }
  };
  // street base: dark granite, pilasters, bronze shopfronts with lit display windows full of goods, doors with transoms,
  // gilded name fascias, striped awnings. o: {bay, skip:[{f,u,w}], awn (default true)}
  const SHOPS = [['DRUGS', 0], ['HATS', 1], ['CIGARS', 2], ['BOOKS', 3], ['FLORIST', 4], ['JEWELER', 5], ['TAILOR', 6], ['CAFE', 7], ['SHOES', 8], ['CANDY', 9], ['RADIOS', 10], ['GIFTS', 11], ['LUNCH', 7], ['GLOVES', 1], ['CAMERAS', 10], ['TOYS', 9]];
  const signGeo = {}, faceRot = { N: 2, S: 0, W: 3, E: 1 };
  D.shopCount = 0;
  D.base = (x0, z0, x1, z1, h, faces, o = {}) => {
    const p = D.pal(), b = { x0, z0, x1, z1 }; h = Math.max(h, 5);
    const goods = D._goods || (D._goods = [0xe8a0b4, 0x4a78c0, 0xe8c040, 0x4a9a50, 0xb3312c, 0xf1ede2, 0x8a5a2b, 0x3f9a9a, 0x2a2a2a, 0xd86a8a, 0xc8a878, 0x9fc8ff].map((hx) => AF.col(hx, { jitter: 0.2 })));
    const plinth = AF.col(0x6e1a24, { jitter: 0.2 }), board = AF.col(0x15161a, { jitter: 0.1 });
    for (const f of faces) {
      const [a, e] = span(b, f);
      FF(b, f, a, e, 0.25, h, -0.25, 0.25, p.granite);
      FF(b, f, a - 0.25, e + 0.25, h - 0.5, h, -0.5, 0.25, p.bronze);                 // bronze belt course
      FF(b, f, a - 0.25, e + 0.25, h, h + 0.25, -0.25, 0, p.gold);
      const bay = o.bay || 5.5, n = Math.floor((e - a) / bay), off = (e - a - n * bay) / 2;
      for (let i = 0; i <= n; i++) { const pu = a + off + i * bay - 0.375; if (pu < a || pu + 0.75 > e) continue; FF(b, f, pu, pu + 0.75, 0.25, h - 0.5, -0.5, -0.25, p.graniteL); FF(b, f, pu, pu + 0.75, h - 1.75, h - 1.5, -0.75, -0.5, p.brass); FF(b, f, pu + 0.25, pu + 0.5, h - 2.75, h - 2.5, -0.75, -0.5, p.bronze); FF(b, f, pu + 0.25, pu + 0.5, h - 2.5, h - 2, -1, -0.75, p.bulb); FF(b, f, pu, pu + 0.75, 0.25, 0.75, -0.75, -0.5, p.brass); }
      for (let i = 0; i < n; i++) {
        const u = a + off + i * bay + 0.5, w = bay - 1, uc = u + w / 2;
        if ((o.skip || []).some((sk) => sk.f === f && u < sk.u + sk.w / 2 + 0.25 && u + w > sk.u - sk.w / 2 - 0.25)) continue;
        const hs = AF.hash2((uc * 4) | 0, (f.charCodeAt(0) * 131 + x0 * 7 + z0) | 0), shop = SHOPS[(hs * SHOPS.length) | 0], door = hs > 0.62;
        const wy = h - 1.5;                                   // top of the display opening
        FF(b, f, u, u + w, 0.5, wy + 0.25, -0.25, 0, p.bronze);                               // bronze frame
        let du0 = -1, du1 = -1;
        if (door) { du0 = (hs > 0.81 ? u + 0.25 : u + w - 1.75); du1 = du0 + 1.5; FF(b, f, du0, du1, 0.5, 3.5, -0.25, 0.75, 0); FF(b, f, du0, du1, 0.5, 3.25, 0.75, 1, p.bronze); FF(b, f, du0 + 0.25, du1 - 0.25, 1.5, 3, 0.75, 1, p.win[1]); FF(b, f, du0, du1, 3.5, wy, -0.25, 0.25, p.win[1]); FF(b, f, du0, du1, 3.25, 3.5, -0.25, 0.5, p.brass); }
        const segs = door ? (du0 > u + 1 ? [[u + 0.25, du0 - 0.25]] : [[du1 + 0.25, u + w - 0.25]]) : [[u + 0.25, u + w - 0.25]];
        for (const [s0, s1] of segs) {
          if (s1 - s0 < 0.75) continue;
          FF(b, f, s0, s1, 1, wy, -0.25, 1, 0);                                               // display recess
          FF(b, f, s0, s1, 1, wy, 1, 1.25, p.shop);                                           // lit back
          FF(b, f, s0, s1, 0.75, 1, -0.25, 1, p.graniteL);                                    // stall riser
          FF(b, f, s0, s1, 1, 1.25, 0.25, 1, plinth);                                         // display plinth
          FF(b, f, s0, s1, 2.25, 2.5, 0.5, 1, p.bronze);                                      // glass shelf
          for (let g = s0 + 0.25; g + 0.25 < s1; g += 0.75) { const gc = goods[(shop[1] * 3 + ((g * 4) | 0)) % goods.length]; FF(b, f, g, g + 0.25 + ((g * 4 | 0) % 2) * 0.25, 1.25, 1.5 + ((g * 4 | 0) % 3) * 0.25, 0.5, 0.75, gc); FF(b, f, g, g + 0.25, 2.5, 2.75 + ((g * 8 | 0) % 2) * 0.25, 0.5, 0.75, goods[(shop[1] + (g * 4 | 0)) % goods.length]); }
          FF(b, f, s0, s1, 1, wy, -0.25, 0, p.glass);                                         // plate glass
          const mid = Math.round((s0 + s1) / 2 * 4) / 4; if (s1 - s0 > 2.5) FF(b, f, mid - 0.125, mid + 0.125, 1, wy, -0.5, 0, p.bronze);
          FF(b, f, s0, s1, wy - 0.5, wy - 0.25, -0.25, 1, p.win[1]);                          // transom light strip
        }
        // name fascia + gilded letters
        FF(b, f, u, u + w, wy + 0.25, h - 0.5, -0.5, 0, board);
        if (o.signs !== false) {
          const g = signGeo[shop[0]] || (signGeo[shop[0]] = AF.meshModel(AF.textModel(shop[0], p.goldLit, { pad: 0 }), { vs: 1 / 16, anchor: [0.5, 0, 0] }));
          const out = 0.5, sx = f === 'W' ? x0 - out : f === 'E' ? x1 + out : uc, sz = f === 'N' ? z0 - out : f === 'S' ? z1 + out : uc;
          AF.placeStatic(g, sx, wy + 0.4, sz, faceRot[f], { collide: false }); D.shopCount++;
        }
        if (o.awn !== false && (AF.hash2(i, x0 | 0) > 0.3)) {
          const ac = [p.awnRed, p.awnTeal, p.awnGreen][(hs * 7 | 0) % 3];
          for (let k = 0; k < 4; k++) for (let uu = u; uu < u + w; uu += 0.5) FF(b, f, uu, Math.min(uu + 0.5, u + w), wy - 0.25 - k * 0.25, wy - k * 0.25, -0.75 - k * 0.5, -0.25 - k * 0.5, ((uu - u) * 2 | 0) % 2 ? p.white : ac);
          for (let uu = u; uu < u + w; uu += 0.5) FF(b, f, uu, uu + 0.25, wy - 1.5, wy - 1, -2.25, -2, ((uu - u) * 2 | 0) % 2 ? p.white : ac);  // scalloped valance
        }
      }
    }
    return b;
  };
  // an entrance: opening w wide, h tall through a wall of thickness t on face f at centre u. bronze frame, transom grille, canopy
  D.door = (b, f, u, w, h, t, o = {}) => {
    const p = D.pal();
    FF(b, f, u - w / 2 - 0.5, u + w / 2 + 0.5, 0.25, h + 1.75, -0.5, 0, p.bronze);
    FF(b, f, u - w / 2, u + w / 2, 0.5, h, -0.5, t, 0);
    FF(b, f, u - w / 2, u + w / 2, h, h + 1.5, -0.5, 0.25, p.brass);                      // transom grille
    for (let k = u - w / 2 + 0.25; k < u + w / 2; k += 0.5) FF(b, f, k, k + 0.25, h + 0.25, h + 1.25, -0.25, 0, p.win[1]);
    FF(b, f, u - w / 2 - 0.5, u + w / 2 + 0.5, 0.25, 0.5, -1.5, 0, p.graniteL);            // step
    if (o.canopy !== false) {
      const cd = o.canopy || 3, cw = w / 2 + 1.5;
      FF(b, f, u - cw, u + cw, h + 1.75, h + 2.25, -cd, 0, p.bronze);
      FF(b, f, u - cw, u + cw, h + 2.25, h + 2.5, -cd, 0, p.gold);
      for (let k = u - cw + 0.5; k < u + cw; k += 1) FF(b, f, k, k + 0.25, h + 1.5, h + 1.75, -cd + 0.25, -cd + 0.5, p.bulb);
    }
  };
  // rooftop water tank on legs (world voxels)
  D.tank = (cx, y, cz, r = 1.5, h = 3.25) => {
    const p = D.pal(), legH = 2;
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) W.fill(cx + sx * (r - 0.5) - 0.125, y, cz + sz * (r - 0.5) - 0.125, cx + sx * (r - 0.5) + 0.125, y + legH, cz + sz * (r - 0.5) + 0.125, p.steelD);
    W.fill(cx - r, y + legH - 0.25, cz - r, cx + r, y + legH, cz + r, p.steel);
    for (let dx = -r; dx < r; dx += 0.25) for (let dz = -r; dz < r; dz += 0.25) {
      const d = Math.hypot(dx + 0.125, dz + 0.125);
      if (d < r - 0.1) W.fill(cx + dx, y + legH, cz + dz, cx + dx + 0.25, y + legH + h, cz + dz + 0.25, p.wood);
      for (let k = 0; k < 4; k++) if (d < (r - 0.1) * (1 - k * 0.28)) W.fill(cx + dx, y + legH + h + k * 0.25, cz + dz, cx + dx + 0.25, y + legH + h + (k + 1) * 0.25, cz + dz + 0.25, p.roofD);
    }
    for (const hy of [0.75, 2.25]) for (let dx = -r; dx < r; dx += 0.25) for (let dz = -r; dz < r; dz += 0.25) { const d = Math.hypot(dx + 0.125, dz + 0.125); if (d >= r - 0.1 && d < r + 0.2) W.fill(cx + dx, y + legH + hy, cz + dz, cx + dx + 0.25, y + legH + hy + 0.25, cz + dz + 0.25, p.steelD); }
  };
  D.bulkhead = (x, y, z, w = 3, d = 3, h = 3, c) => { const p = D.pal(); W.fill(x, y, z, x + w, y + h, z + d, c || p.coping); W.fill(x - 0.25, y + h, z - 0.25, x + w + 0.25, y + h + 0.25, z + d + 0.25, p.roofD); W.fill(x + w / 2 - 0.5, y, z - 0.25, x + w / 2 + 0.5, y + 2.25, z, p.woodD); };
  D.aerial = (x, y, z, h = 5) => { const p = D.pal(); W.fill(x, y, z, x + 0.25, y + h, z + 0.25, p.steelD); W.fill(x - 1, y + h - 1, z, x + 1.25, y + h - 0.75, z + 0.25, p.steelD); W.fill(x - 0.5, y + h - 2, z, x + 0.75, y + h - 1.75, z + 0.25, p.steelD); };
  // fire escape on face f of box b between u0..u1 (landings every storey)
  D.fireEscape = (b, f, u0, u1, y0, y1, st = 3.5) => {
    const p = D.pal();
    for (let y = y0; y < y1; y += st) {
      FF(b, f, u0, u1, y, y + 0.25, -1.5, 0, p.steelD);
      for (let u = u0; u < u1; u += 0.5) FF(b, f, u, u + 0.25, y + 0.25, y + 1, -1.5, -1.25, p.steelD);
      FF(b, f, u0, u1, y + 1, y + 1.25, -1.5, -1.25, p.steelD);
      for (let k = 0; k < 12 && y + k * 0.25 < y + st; k++) { const uu = u0 + 0.5 + k * 0.25; if (uu + 0.25 > u1) break; FF(b, f, uu, uu + 0.25, y - st + (k + 1) * (st / 12), y - st + (k + 1) * (st / 12) + 0.25, -1.25, -0.5, p.steel); }
    }
  };
  D.billboard = (x, y, z, text, fg, bg, rot = 0) => {
    const p = D.pal(), m = AF.textModel(text, fg, { bg, pad: 2, bold: true }), w = m.w * 0.25;
    const alongX = rot % 2 === 0;
    for (let k = 0; k <= w; k += 3) { if (alongX) { W.fill(x + k, y, z + 0.5, x + k + 0.25, y + 3.5, z + 0.75, p.steelD); W.fill(x + k, y, z + 1.5, x + k + 0.25, y + 3, z + 1.75, p.steelD); } else { W.fill(x + 0.5, y, z + k, x + 0.75, y + 3.5, z + k + 0.25, p.steelD); W.fill(x + 1.5, y, z + k, x + 1.75, y + 3, z + k + 0.25, p.steelD); } }
    if (alongX) { W.stamp(m, x, y + 2, z, rot); for (let k = 0.5; k < w; k += 2) W.fill(x + k, y + 1.75, z - 0.5, x + k + 0.25, y + 2, z, p.bulb); }
    else { W.stamp(m, x, y + 2, z, rot); for (let k = 0.5; k < w; k += 2) W.fill(x - 0.5, y + 1.75, z + k, x, y + 2, z + k + 0.25, p.bulb); }
  };
  D.coop = (x, y, z) => { const p = D.pal(); W.fill(x, y, z, x + 3, y + 0.5, z + 2, p.wood); W.fill(x, y + 0.5, z, x + 3, y + 2, z + 2, p.white); for (let k = 0.25; k < 3; k += 0.5) W.fill(x + k, y + 0.75, z - 0.25, x + k + 0.25, y + 1.75, z, p.woodD); W.fill(x - 0.25, y + 2, z - 0.25, x + 3.25, y + 2.25, z + 2.25, p.red); };
  D.garden = (x0, y, z0, x1, z1) => { const p = D.pal(), g = AF.col(0x4f8a3a, { jitter: 0.8 }), fl = AF.col(0xd86a8a, { jitter: 0.5 }), fl2 = AF.col(0xf0c040, { jitter: 0.5 }); W.fill(x0, y, z0, x1, y + 0.5, z1, p.woodD); W.fill(x0 + 0.25, y + 0.5, z0 + 0.25, x1 - 0.25, y + 0.75, z1 - 0.25, g); for (let x = x0 + 0.5; x < x1 - 0.5; x += 0.75) for (let z = z0 + 0.5; z < z1 - 0.5; z += 0.75) { const h = AF.hash2(x * 4, z * 4); if (h < 0.35) W.fill(x, y + 0.75, z, x + 0.25, y + 1, z + 0.25, h < 0.18 ? fl : fl2); else if (h > 0.85) W.fill(x, y + 0.75, z, x + 0.5, y + 1.75, z + 0.5, g); } };
  D.pergola = (x0, y, z0, x1, z1) => { const p = D.pal(); for (const [a, b2] of [[x0, z0], [x1 - 0.25, z0], [x0, z1 - 0.25], [x1 - 0.25, z1 - 0.25]]) W.fill(a, y, b2, a + 0.25, y + 2.5, b2 + 0.25, p.white); for (let x = x0; x < x1; x += 0.75) W.fill(x, y + 2.5, z0, x + 0.25, y + 2.75, z1, p.white); };
  D.skylight = (x, y, z, w, d) => { const p = D.pal(); W.fill(x, y, z, x + w, y + 0.5, z + d, p.steel); W.fill(x + 0.25, y + 0.5, z + 0.25, x + w - 0.25, y + 0.75, z + d - 0.25, p.win[2]); };
  // flags that sway: registered, built as dynamic meshes at 600
  D.flags = [];
  D.flag = (x, y, z, col, h = 5, fo = {}) => { const p = D.pal(); W.fill(x, y, z, x + 0.25, y + h, z + 0.25, p.steel); W.fill(x - 0.125 + 0.0, y + h, z, x + 0.25, y + h + 0.25, z + 0.25, p.gold); D.flags.push({ x: x + 0.125, y: y + h - 0.2, z: z + 0.125, col, city: !!fo.city, big: !!fo.big }); };
  D.fakeDoor = (b, f, u, w = 2.5, h = 3.5, name) => { const p = D.pal(); D.door(b, f, u, w, h, 0.25, { canopy: 2 });
    if (name) { const g = AF.meshModel(AF.textModel(name, p.goldLit, { font: 'deco', shadow: p.bronze, pad: 0 }), { vs: 1 / 12, anchor: [0.5, 0, 0] }), out = 0.3; AF.placeStatic(g, f === 'W' ? b.x0 - out : f === 'E' ? b.x1 + out : u, h + 2.7, f === 'N' ? b.z0 - out : f === 'S' ? b.z1 + out : u, { N: 2, S: 0, W: 3, E: 1 }[f], { collide: false }); } FF(b, f, u - w / 2, u + w / 2, 0.5, h, 0.25, 0.5, p.bronze); FF(b, f, u - 0.125, u + 0.125, 0.5, h, 0.25, 0.5, p.black); FF(b, f, u - w / 2 + 0.25, u - 0.5, 1.5, h - 0.5, 0.25, 0.5, p.win[1]); FF(b, f, u + 0.5, u + w / 2 - 0.25, 1.5, h - 0.5, 0.25, 0.5, p.win[1]); };
  D.label = (name, x, z) => { if (typeof AF.addLabel === 'function') AF.addLabel(name, x, z, 'building'); };
  // ---- ROUND 2 roof kit: autumn roof-garden trees in planters, a clay tennis court, string lights, spots
  D.tree = (x, y, z, r = 1.5, h = 2.25) => {
    const p = D.pal(), TC = D._treeCols || (D._treeCols = [0xc8541e, 0xe0a030, 0xb8321e, 0x8a9a30, 0xd87a24, 0xa8402a].map((hx) => AF.col(hx, { jitter: 0.35 })));
    W.fill(x - 0.75, y, z - 0.75, x + 1, y + 0.75, z + 1, p.woodD); W.fill(x - 0.5, y + 0.5, z - 0.5, x + 0.75, y + 0.75, z + 0.75, AF.col(0x4a3222, { jitter: 0.3 }));
    W.fill(x, y + 0.75, z, x + 0.25, y + h, z + 0.25, p.woodD);
    const cy = y + h + r * 0.6, base = (AF.hash2(x * 4 | 0, z * 4 | 0) * TC.length) | 0;
    for (let dx = -r; dx < r; dx += 0.25) for (let dy = -r * 0.8; dy < r * 0.8; dy += 0.25) for (let dz = -r; dz < r; dz += 0.25) {
      const q = Math.hypot((dx + 0.125) / r, (dy + 0.125) / (r * 0.8), (dz + 0.125) / r), hh = AF.hash3((x + dx) * 4 | 0, (cy + dy) * 4 | 0, (z + dz) * 4 | 0);
      if (q < 1 && !(q > 0.8 && hh < 0.45)) W.fill(x + dx, cy + dy, z + dz, x + dx + 0.25, cy + dy + 0.25, z + dz + 0.25, TC[(base + (hh < 0.25 ? 1 : hh > 0.85 ? 2 : 0)) % TC.length]);
    }
  };
  // clay court along z (x0..x1 ~ 9 m, z0..z1 ~ 17 m), white lines, net, green surround, fence posts + windscreen
  D.court = (x0, y, z0, x1, z1) => {
    const p = D.pal(), clay = AF.col(0xb8583a, { jitter: 0.12, pat: 'none' }), grn = AF.col(0x3e6e4a, { jitter: 0.12, pat: 'none' }), ln = AF.col(0xf6f2e8, { jitter: 0, pat: 'none' }), net = AF.col(0x2a2a2e, { solid: false, jitter: 0 });
    W.fill(x0 - 1.5, y, z0 - 1.5, x1 + 1.5, y + 0.25, z1 + 1.5, grn); W.fill(x0, y, z0, x1, y + 0.25, z1, clay);
    W.walls(x0, y, z0, x1, y + 0.25, z1, ln); W.walls(x0 + 1.25, y, z0, x1 - 1.25, y + 0.25, z1, ln);
    const zm = Math.round((z0 + z1) / 2 * 4) / 4, xm = Math.round((x0 + x1) / 2 * 4) / 4;
    for (const s of [-1, 1]) W.fill(x0 + 1.25, y, zm + s * 5 - 0.125, x1 - 1.25, y + 0.25, zm + s * 5 + 0.125, ln);
    W.fill(xm - 0.125, y, zm - 5, xm + 0.125, y + 0.25, zm + 5, ln);
    W.fill(x0 - 0.5, y + 0.25, zm, x0 - 0.25, y + 1.25, zm + 0.25, p.steelD); W.fill(x1 + 0.25, y + 0.25, zm, x1 + 0.5, y + 1.25, zm + 0.25, p.steelD);
    W.fill(x0 - 0.25, y + 0.25, zm, x1 + 0.25, y + 1, zm + 0.25, net); W.fill(x0 - 0.25, y + 1, zm, x1 + 0.25, y + 1.25, zm + 0.25, ln);
    const fx0 = x0 - 1.5, fx1 = x1 + 1.25, fz0 = z0 - 1.5, fz1 = z1 + 1.25;
    for (let x = fx0; x <= fx1; x += 2.5) for (const z of [fz0, fz1]) W.fill(x, y + 0.25, z, x + 0.25, y + 3, z + 0.25, p.steelD);
    for (let z = fz0; z <= fz1; z += 2.5) for (const x of [fx0, fx1]) W.fill(x, y + 0.25, z, x + 0.25, y + 3, z + 0.25, p.steelD);
    W.walls(fx0, y + 2.75, fz0, fx1 + 0.25, y + 3, fz1 + 0.25, p.steelD); W.walls(fx0, y + 0.25, fz0, fx1 + 0.25, y + 1.25, fz1 + 0.25, AF.col(0x2f5a3c, { jitter: 0.1, pat: 'none' }));
    W.clear(xm - 0.75, y + 0.25, fz1, xm + 0.75, y + 1.25, fz1 + 0.25);
  };
  // a run of festoon bulbs between (x0,z0) and (x1,z1) sagging from height y
  D.festoon = (x0, z0, x1, z1, y, sag = 0.75) => {
    const p = D.pal(), L = Math.hypot(x1 - x0, z1 - z0), n = Math.max(2, Math.round(L / 0.5));
    for (let i = 0; i <= n; i++) { const t = i / n, x = x0 + (x1 - x0) * t, z = z0 + (z1 - z0) * t, yy = y - Math.sin(t * Math.PI) * sag; W.fill(x, yy, z, x + 0.25, yy + 0.25, z + 0.25, i % 2 ? p.bulb : p.steelD); }
  };
  D.spot = (building, x, y, z, yaw, kind) => { if (typeof AF.addSpot === 'function') AF.addSpot({ building, x, y, z, yaw, kind }); };

  // ================================================================ BUILD (v2: a real deco skyline — Solace Tower 148 m peak)
  AF.onBuild('downtown-exteriors', 300, () => {
    const p = D.pal(), c = AF.col;
    const T = (name, o) => { D.towers.push(Object.assign({ name }, o)); D.label(name, o.x, o.z); };
    const mk = (key, w, h, d, fn, vs = 1 / 8) => D['_g' + key] || (D['_g' + key] = (() => { const m = new AF.Model(w, h, d); fn(m); return AF.meshModel(m, { vs, anchor: [0.5, 0, 0.5] }); })());
    const umb = (col) => mk('umb' + col, 21, 19, 21, (m) => { m.box(10, 0, 10, 11, 17, 11, p.white); for (let x = 0; x < 21; x++) for (let z = 0; z < 21; z++) { const dx = x + 0.5 - 10.5, dz = z + 0.5 - 10.5, r = Math.hypot(dx, dz); if (r < 10.5) { const y = 17 - Math.floor(r / 4); m.set(x, y, z, ((Math.atan2(dx, dz) * 8 / Math.PI + 16) | 0) % 2 ? col : p.white); } } m.set(10, 18, 10, p.gold); m.box(6, 5, 6, 15, 6, 15, p.white); m.box(10, 0, 10, 11, 5, 11, p.steelD); });
    const bistro = () => mk('bistro', 4, 7, 4, (m) => { m.box(0, 3, 0, 4, 4, 4, p.awnRed); m.box(0, 4, 0, 4, 7, 1, p.awnRed); m.box(0, 0, 0, 1, 3, 1, p.steelD); m.box(3, 0, 3, 4, 3, 4, p.steelD); m.box(3, 0, 0, 4, 3, 1, p.steelD); m.box(0, 0, 3, 1, 3, 4, p.steelD); });
    const navy = c(0x22346e, { jitter: 0.1 });
    D.flagCols = { cream: c(0xf1ede2), pole: c(0xd8d0c0), gold: c(0xe8b84a), navy, white: c(0xf6f4ee) };
    // eagle-head gargoyle projecting from face f of box b at u, y (stainless, gold beak)
    const eagleHead = (b, f, u, y) => { FF(b, f, u - 0.5, u + 0.5, y, y + 1, -1.75, 0, p.stain); FF(b, f, u - 0.75, u + 0.75, y + 0.25, y + 0.75, -1, 0, p.stain); FF(b, f, u - 0.25, u + 0.25, y + 0.25, y + 0.75, -2.5, -1.75, p.gold); FF(b, f, u - 0.5, u + 0.5, y + 1, y + 1.25, -1.5, -0.5, p.stain); FF(b, f, u - 1.5, u + 1.5, y - 0.25, y, -0.75, 0, p.gold); };
    const S = AF.searchlightSpots = AF.searchlightSpots || [];

    // ---------------------------------------------------------- dt-tower lot: SOLACE TOWER + AURORA + Solace Arcade wing
    {
      const cream = c(0xe9dcbc, { jitter: 0.25, pat: 'stone' }), spand = c(0x2a2a30, { jitter: 0.2, metal: 0.55, rough: 0.35 }), pier = c(0xf3ead2, { jitter: 0.2, pat: 'stone' });
      const o = { c: cream, spand, style: 'pier', bay: 2, ww: 1, st: 3.75, cornice: p.gold, chev: p.gold, pierC: pier };
      const TB = { x0: 88, z0: -147, x1: 130, z1: -104 };
      D.mass(88, -147, 130, -104, 0.25, 16, Object.assign({}, o, { wy0: 5, chev: null }));          // podium (the lobby inside belongs to 21)
      D.mass(92, -143, 126, -108, 16, 40, Object.assign({}, o, { hollow: true }));
      D.mass(96, -139, 122, -112, 40, 80, Object.assign({}, o, { hollow: true, fins: 1.5 }));
      D.mass(100, -134.5, 118, -116.5, 80, 105, Object.assign({}, o, { hollow: true, fins: 1 }));
      D.mass(102.5, -132, 115.5, -119, 105, 118, Object.assign({}, o, { hollow: true, parapet: false, topBand: 7, frieze: false, chev: null, corner: false }));
      D.base(88, -147, 130, -104, 5, 'NW', { skip: [{ f: 'N', u: 109, w: 13 }] });
      // R2: twin gilded ribs up the centre of every face (glow amber at night) — the Solace reads as a gold-pinstriped shaft from 200 m
      const ribG = c(0xe8b84a, { emit: 0xffc060, emitK: 0.6, mode: 'night', jitter: 0.1, metal: 1, rough: 0.25 });
      for (const [tx0, tz0, tx1, tz1, ty0, ty1] of [[92, -143, 126, -108, 16, 40], [96, -139, 122, -112, 40, 80], [100, -134.5, 118, -116.5, 80, 105]]) {
        const tb = { x0: tx0, z0: tz0, x1: tx1, z1: tz1 };
        for (const f of 'NSWE') { const cu = f === 'N' || f === 'S' ? 109 : -125.5; for (const du of [-1.5, 1]) FF(tb, f, cu + du, cu + du + 0.5, ty0 + 0.5, ty1 + 1.75, -0.75, 0, ribG); FF(tb, f, cu - 1, cu + 1, ty1 - 1.5, ty1 + 2.25, -0.5, 0, ribG); }
      }
      // gilded sunburst crown: a fan of gold rays on every face of the top tier, floodlit amber at night
      const t4 = { x0: 102.5, z0: -132, x1: 115.5, z1: -119 };
      for (const f of 'NSWE') D.fan(t4, f, f === 'N' || f === 'S' ? 109 : -125.5, 111, 6.5, 7, 9, p.goldLit, null, p.gold);
      // Empire-style stepped top, finned mooring drum, mooring cone and needle
      D.zig(103.5, -131, 114.5, -120, 118, 3, 2, 1.5, [p.creamLit, p.goldLit, p.creamLit], p.gold);
      const mx = 109, mz = -125.5, drumLit = c(0xeee2c2, { emit: 0xffe0a8, emitK: 0.55, mode: 'night', jitter: 0.1 });
      for (let dx = -3; dx < 3; dx += 0.25) for (let dz = -3; dz < 3; dz += 0.25) {
        const ax = dx + 0.125, az = dz + 0.125, r = Math.hypot(ax, az), x = mx + dx, z = mz + dz;
        if (r < 2) { W.fill(x, 124, z, x + 0.25, 136, z + 0.25, drumLit); W.fill(x, 127.75, z, x + 0.25, 128, z + 0.25, p.gold); W.fill(x, 131.75, z, x + 0.25, 132, z + 0.25, p.gold); }
        else if (r < 3 && (Math.abs(ax) < 0.2 || Math.abs(az) < 0.2 || Math.abs(Math.abs(ax) - Math.abs(az)) < 0.2)) W.fill(x, 124, z, x + 0.25, 124 + Math.round((3 - r) * 16) / 4 + 8, z + 0.25, p.stainLit);
        if (r < 2 - Math.max(0, 0) && r < 1.75) W.fill(x, 136, z, x + 0.25, 136.5 + (1.75 - r) * 1.6, z + 0.25, p.stain);
      }
      W.fill(108.5, 138, -126, 109.5, 143, -125, p.stain); W.fill(108.75, 143, -125.75, 109.25, 148, -125.25, p.stain);
      W.fill(108.25, 144, -126.25, 109.75, 144.5, -124.75, p.brass);
      AF.solaceMast = { x: 109, y: 146, z: -125.5 };
      D.lights = D.lights || []; D.lights.push({ x: 109, y: 148.4, z: -125.5 });
      // eagle heads at the 105 m setback (one per face) + uplights on the setback roofs
      const t3 = { x0: 100, z0: -134.5, x1: 118, z1: -116.5 };
      for (const f of 'NSWE') eagleHead(t3, f, f === 'N' || f === 'S' ? 109 : -125.5, 102.5);
      for (let x = 103; x < 116; x += 3) { W.fill(x, 105, -133.75, x + 0.5, 105.75, -133.25, p.lamp); W.fill(x, 105, -117.75, x + 0.5, 105.75, -117.25, p.lamp); }
      // 3-storey stepped sunburst portal on Harbour St (N face) — the lobby doorway stays where 21 cut it (107..111)
      FF(TB, 'N', 102.5, 115.5, 0.25, 13, -1, 0, p.granite);
      FF(TB, 'N', 103.5, 114.5, 0.5, 12.25, -1, -0.5, 0);
      FF(TB, 'N', 104.5, 113.5, 0.5, 11.5, -0.5, 0, 0);
      FF(TB, 'N', 104.5, 113.5, 0.5, 11.5, 0, 0.25, p.bronze);
      FF(TB, 'N', 102.5, 115.5, 12.75, 13, -1.25, 0, p.gold);
      D.fan(TB, 'N', 109, 6.25, 4.5, 5, 11, p.goldLit, p.bronze, p.gold, 0, 0.25);
      for (let u = 104.5; u < 113.5; u += 0.5) FF(TB, 'N', u, u + 0.5, 11.75, 12.25, -0.5, -0.25, ((u * 2) | 0) % 2 ? p.goldLit : c(0x2e7d6a, { jitter: 0.2 }));   // mural band
      D.door(TB, 'N', 109, 4, 4.25, 2, { canopy: false });
      const name = AF.textModel('SOLACE TOWER', p.goldLit, { depth: 1 }); FF(TB, 'N', 109 - name.w * 0.125 - 0.75, 109 + name.w * 0.125 + 0.75, 13.25, 15.25, -0.5, 0, p.granite); W.stamp(name, 109 - (name.w * 0.25) / 2, 13.5, -147.75, 2);
      D.flag(101.5, 16, -146, navy, 7, { city: true }); D.flag(116.25, 16, -146, navy, 7, { city: true });
      // setback roofs: tanks, bulkheads, a garden terrace with parasols on the 40 m roof, a pigeon coop on the 80 m roof
      D.tank(123.5, 40, -110, 1.25); D.bulkhead(92.5, 40, -141, 3, 3, 3.5); D.tank(120, 80, -116, 1); D.bulkhead(97, 80, -114.5, 2.5, 2, 3);
      D.garden(96, 40, -111.75, 122, -108.25);
      for (let i = 0; i < 4; i++) { const x = 99 + i * 6.5; AF.placeStatic(umb([p.awnRed, p.awnTeal, p.awnGreen][i % 3]), x, 40, -141, 0, { collide: false }); AF.placeStatic(bistro(), x - 1.2, 40, -141, 1, { collide: false }); AF.placeStatic(bistro(), x + 1.2, 40, -141, 3, { collide: false }); }
      D.coop(97, 80, -138.25); D.aerial(116.5, 105, -133.25, 4); D.flag(97.25, 80, -138.75, navy, 8, { city: true, big: true }); D.flag(120.75, 80, -137.5, c(0xb3312c), 8, { big: true });
      D.tank(128, 16, -140, 1.25); D.bulkhead(122, 16, -145.5, 3, 2, 3);
      // R2: SKY DECK on the 80 m setback — brass coin telescopes along the parapets, benches, visitors
      {
        const scope = mk('scope', 5, 12, 7, (m) => { m.box(1, 0, 1, 4, 1, 5, p.steelD); m.box(2, 1, 2, 3, 7, 3, p.steelD); m.box(1, 7, 0, 4, 10, 6, p.brass); m.box(1, 8, 6, 4, 9, 7, p.black); m.box(2, 10, 1, 3, 11, 5, p.brass); m.box(0, 8, 2, 1, 9, 4, p.bronze); m.box(4, 8, 2, 5, 9, 4, p.bronze); }, 1 / 10);
        const bench = mk('bench', 12, 7, 5, (m) => { m.box(0, 3, 0, 12, 4, 4, p.wood); m.box(0, 4, 3, 12, 7, 4, p.wood); m.box(1, 0, 0, 2, 3, 4, p.steelD); m.box(10, 0, 0, 11, 3, 4, p.steelD); });
        for (const x of [101, 104.5, 108, 111.5, 115]) { AF.placeStatic(scope, x, 80, -138.4, 2, { collide: false }); D.spot('sky-deck', x, 80.25, -137.6, Math.PI, 'stand'); }
        for (const z of [-131, -127, -123, -119]) { AF.placeStatic(scope, 96.6, 80, z, 3, { collide: false }); if (z !== -127) D.spot('sky-deck', 97.4, 80.25, z, -Math.PI / 2, 'stand'); }
        for (const x of [103, 110]) { AF.placeStatic(bench, x, 80, -135.4, 0, { collide: false }); D.spot('sky-deck', x, 80.6, -135.2, 0, 'sit'); }
        D.festoon(96.5, -138.75, 121.5, -138.75, 83, 0.5);
        const sd = AF.meshModel(AF.textModel('SKY DECK · 80 M', p.goldLit, { bg: p.black, pad: 1 }), { vs: 1 / 12, anchor: [0.5, 0, 0] }); AF.placeStatic(sd, 109, 80.25, -134.3, 2, { collide: false });
      }
      S.push({ x: 120.5, y: 80.25, z: -113 });
      D.washer = { x: 101.5, z: -112, y0: 42, y1: 78.5 };
      T('Solace Tower', { x: 109, z: -125.5, h: 148 });

      // AURORA BUILDING — jade terracotta shaft, jade ziggurat, gold finial (teal glow at night)
      const jade = c(0x4fa38a, { jitter: 0.35, pat: 'terracotta' }), jadeD = c(0x24403a, { jitter: 0.2 }), trim = c(0xe8dcc0, { jitter: 0.2, pat: 'stone' });
      const ao = { c: jade, spand: jadeD, style: 'pier', bay: 2.5, ww: 1.25, st: 3.5, cornice: trim, pierC: c(0x6cc2a6, { jitter: 0.3, pat: 'terracotta' }), frieze: p.goldLit, chev: p.gold };
      D.mass(130, -147, 147, -88, 0.25, 16, Object.assign({}, ao, { wy0: 5, chev: null }));
      D.mass(132, -132, 145, -104, 16, 58, Object.assign({}, ao, { hollow: true }));
      D.mass(133.5, -123, 143.5, -113, 58, 62, Object.assign({}, ao, { parapet: false, corner: false, frieze: false, chev: null, style: 'punch', topBand: 0.5 }));
      D.zig(134, -122.5, 143, -113.5, 62, 4, 2.5, 1.25, [p.jadeLit, jade, p.jadeLit, jade], p.goldLit);
      W.fill(138, 72, -118.5, 139, 74, -117.5, p.gold); W.fill(137.75, 74, -118.75, 139.25, 75.5, -117.25, p.goldLit); W.fill(138.25, 75.5, -118.25, 138.75, 79, -117.75, p.gold);
      D.base(130, -147, 147, -88, 5, 'NSE', { skip: [{ f: 'N', u: 138.5, w: 4 }] });
      D.tank(144.5, 16, -91, 1.25); D.aerial(143.5, 58, -106, 4);
      // R2: THE AURORA ROOF — a string-lit supper club: parquet dance floor, glowing bandstand shell, parasol tables, autumn trees
      {
        const y = 16, pq = c(0xa8784a, { jitter: 0.3, patTop: 'parquet' }), shellC = c(0xf4ecd8, { emit: 0xffc890, emitK: 0.4, mode: 'night', jitter: 0.05 });
        W.fill(131, y, -103.25, 146.5, y + 0.25, -95.5, pq);
        const scx = 142.5, scz = -99.5;
        // Hollywood-Bowl bandshell: five concentric arches stepping back and down, gold and cream, glowing softly at night
        for (let k = 0; k < 5; k++) {
          const R = 3.5 - k * 0.45, xk = scx + k * 0.5;
          for (let dz = -R; dz < R; dz += 0.25) for (let dy = 0; dy < R; dy += 0.25) {
            const r = Math.hypot(dz + 0.125, dy + 0.125); if (r >= R || (r < R - 0.5 && k < 4)) continue;
            W.fill(xk, y + 0.75 + dy, scz + dz, xk + 0.5, y + 1 + dy, scz + dz + 0.25, k === 4 && r < R - 0.5 ? shellC : k % 2 ? p.gold : p.creamLit);
          }
        }
        W.fill(scx - 0.75, y + 0.25, scz - 3.5, scx + 2.75, y + 0.75, scz + 3.5, p.woodD);
        D.spot('aurora-roof-club', scx - 0.25, y + 0.75, scz - 1.5, -1.57, 'work'); D.spot('aurora-roof-club', scx - 0.25, y + 0.75, scz + 1.5, -1.57, 'work'); D.spot('aurora-roof-club', scx + 0.75, y + 0.75, scz, -1.57, 'work');
        for (const [x, z] of [[134, -101.5], [135.5, -98], [137.5, -100.5], [139, -97.5], [133, -97], [140, -101.5]]) D.spot('aurora-roof-club', x, y + 0.25, z, AF.hash2(x, z) * 6.28, 'dance');
        for (const [x0, z0, x1, z1] of [[131.25, -103, 142.75, -96], [131.25, -96, 142.75, -103], [131.25, -99.5, 142.75, -99.5]]) D.festoon(x0, z0, x1, z1, y + 3.75, 0.6);
        for (const [x, z] of [[131.25, -103], [142.75, -103], [131.25, -96], [142.75, -96], [131.25, -99.5], [142.75, -99.5]]) W.fill(x, y + 0.25, z, x + 0.25, y + 4, z + 0.25, p.steelD);
        for (let i = 0; i < 3; i++) { const x = 133 + i * 4.5, z = -91.5; AF.placeStatic(umb([p.awnTeal, p.awnRed, p.awnGreen][i]), x, y, z, 0, { collide: false }); AF.placeStatic(bistro(), x - 1.2, y, z, 1, { collide: false }); AF.placeStatic(bistro(), x + 1.2, y, z, 3, { collide: false }); D.spot('aurora-roof-club', x - 1.2, y + 0.4, z, 1.57, 'sit'); }
        D.tree(131.75, y, -94, 1.4, 2); D.tree(141.5, y, -94, 1.4, 2);
      } D.garden(132.25, 16, -145.75, 144.75, -142.5); D.flag(144, 58, -130.5, c(0x2e7d6a), 5);
      T('The Aurora Building', { x: 138.5, z: -118, h: 79 });

      // Solace Arcade — lower wing to the south (street wall along Charter St)
      const buff = c(0xd9b98a, { jitter: 0.35, pat: 'stone' });
      D.mass(88, -104, 130, -88, 0.25, 14, { c: buff, spand: c(0x6a4a34), style: 'pier', bay: 2.5, ww: 1.25, st: 3.5, wy0: 5, parapetC: buff, frieze: c(0xa8603f) });
      D.base(88, -104, 130, -88, 5, 'SW', { skip: [{ f: 'S', u: 109, w: 4 }] });
      D.tank(95, 14, -96, 1.5); D.bulkhead(120, 14, -100, 3, 3, 3); D.skylight(104, 14, -99, 8, 3);
      D.coop(112, 14, -93);
      { // laundry lines on the Arcade roof
        const cl = [0xf1ede2, 0x9fc8ff, 0xe8a0b4, 0xf0e0a0, 0xb3312c, 0xffffff].map((h) => AF.col(h, { solid: false, jitter: 0.2 }));
        for (const z of [-91, -95]) { W.fill(97, 14, z, 97.25, 16.5, z + 0.25, p.woodD); W.fill(108, 14, z, 108.25, 16.5, z + 0.25, p.woodD); W.fill(97.25, 16.25, z, 108, 16.5, z + 0.25, p.white);
          for (let x = 97.75, k = 0; x < 107.5; x += 0.75, k++) if (k % 4 !== 3) W.fill(x, 15.25 - (k % 2) * 0.25, z, x + 0.5, 16.25, z + 0.25, cl[(k + (z | 0)) % cl.length]); }
      }
      D.tank(70.5, 22, -145, 1); D.tank(118, 26, -54, 1.5); D.tank(130, 16, 66, 1.25); D.tank(66, 12.5, -100, 1.25); D.fireEscape({ x0: 88, z0: -104, x1: 130, z1: -88 }, 'S', 116, 121, 8, 14);
    }

    // ---------------------------------------------------------- dt-bank lot: HARBOUR TRUST (black & gold, bronze lantern) + CHRYSALIS (stainless arches) + annex
    {
      const lime = c(0xd8c9a6, { jitter: 0.3, pat: 'stone' }), sp = c(0x46464e, { jitter: 0.2 });
      D.mass(10, -147, 50, -104, 0.25, 14, { c: lime, spand: sp, style: 'pier', bay: 3, ww: 1.5, st: 4.5, wy0: 5 });   // banking-hall podium (21 carves the hall)
      const blk = c(0x2a2830, { jitter: 0.2, pat: 'terracotta', rough: 0.35 }), blkS = c(0x6b5320, { metal: 0.8, rough: 0.35, jitter: 0.15 });
      const ht = { c: blk, spand: blkS, style: 'pier', bay: 2, ww: 1, st: 3.75, cornice: p.gold, chev: p.gold, pierC: c(0x34313a, { jitter: 0.2, rough: 0.3 }), frieze: p.goldLit, hollow: true, band: p.gold };
      D.mass(16, -141, 44, -110, 14, 40, ht);
      D.mass(19, -137.5, 41, -113.5, 40, 76, Object.assign({}, ht, { fins: 1.5 }));
      D.mass(22.5, -133, 37.5, -118, 76, 90, Object.assign({}, ht, { parapet: false, topBand: 3, corner: false, fins: 0 }));
      // bronze lantern with a beacon globe
      W.fill(22, 89.5, -133.5, 38, 90.5, -117.5, p.gold);
      W.fill(24, 90.5, -131.5, 36, 96.5, -119.5, p.lantern);
      for (let x = 24; x < 36; x += 1.5) { W.fill(x, 90.5, -131.75, x + 0.25, 96.5, -131.5, p.bronze); W.fill(x, 90.5, -119.5, x + 0.25, 96.5, -119.25, p.bronze); }
      for (let z = -131.5; z < -119.5; z += 1.5) { W.fill(23.75, 90.5, z, 24, 96.5, z + 0.25, p.bronze); W.fill(36, 90.5, z, 36.25, 96.5, z + 0.25, p.bronze); }
      W.fill(23.5, 96.5, -132, 36.5, 97, -119, p.bronze);
      D.zig(24, -131.5, 36, -119.5, 97, 10, 0.75, 0.5, [p.gold, p.goldLit], null);
      for (let dx = -1.25; dx < 1.25; dx += 0.25) for (let dy = -1.25; dy < 1.25; dy += 0.25) for (let dz = -1.25; dz < 1.25; dz += 0.25) if (Math.hypot(dx + 0.125, dy + 0.125, dz + 0.125) < 1.25) W.fill(30 + dx, 105.5 + dy, -125.5 + dz, 30 + dx + 0.25, 105.5 + dy + 0.25, -125.5 + dz + 0.25, p.lantern);
      W.fill(29.75, 104, -125.75, 30.25, 104.5, -125.25, p.gold);
      D.lights = D.lights || []; D.lights.push({ x: 30, y: 107.2, z: -125.5 });
      // monumental west entrance (Grand Ave): sunrise portal, fluted black columns, bronze doors, eagle above
      const bb = { x0: 10, z0: -147, x1: 50, z1: -104 };
      D.base(10, -147, 50, -104, 5, 'NW', { bay: 6, skip: [{ f: 'W', u: -125, w: 13 }] });
      FF(bb, 'W', -131.5, -118.5, 0.25, 12.5, -1, 0, p.granite);
      FF(bb, 'W', -129, -121, 0.5, 11, -1, 0, 0);
      FF(bb, 'W', -129, -121, 0.5, 11, 0, 0.25, p.bronze);
      D.fan(bb, 'W', -125, 5.75, 4, 5, 13, p.goldLit, p.bronze, p.gold, 0, 0.25);
      D.door(bb, 'W', -125, 4, 5, 1, { canopy: false });
      for (const z of [-131, -128.5, -121.25, -118.75]) for (let k = 0; k < 3; k++) FF(bb, 'W', z + k * 0.25, z + k * 0.25 + 0.25, 0.25, 11, -1.5 + (k === 1 ? -0.25 : 0), -1, k === 1 ? c(0x1d1b21, { rough: 0.15 }) : p.granite);
      const eagle = new AF.Model(40, 16, 3);
      for (let x = 0; x < 20; x++) { const wy = Math.round(8 + (x / 20) * 6 - Math.abs(x - 12) * 0.2); eagle.box(x, wy - 3 - (x % 3 === 0 ? 1 : 0), 0, x + 1, wy, 3, p.gold); }
      eagle.mirrorX(); eagle.box(17, 2, 0, 23, 12, 3, p.gold); eagle.box(18, 12, 0, 22, 15, 3, p.gold); eagle.set(20, 13, 2, p.black); eagle.box(19, 0, 0, 21, 2, 3, p.gold);
      W.stamp(eagle, 8.25, 12.5, -130, 3);
      const nm = AF.textModel('HARBOUR TRUST', p.gold, {}); W.stamp(nm, 8.75, 10.75, -125 - nm.w * 0.25 / 2, 3);
      D.tank(41.5, 40, -112, 1.25); D.bulkhead(20, 40, -140.5, 3, 2.5, 3); D.aerial(38, 76, -115.5, 6); D.flag(19.5, 76, -115, navy, 7, { city: true, big: true });
      S.push({ x: 42, y: 40.25, z: -139 });
      T('Harbour Trust Bank', { x: 30, z: -125.5, h: 107 });

      // CHRYSALIS BUILDING — salmon terracotta, Chrysler-style stacked stainless arches with triangular windows, needle
      const sal = c(0xd89a86, { jitter: 0.3, pat: 'terracotta' }), salD = c(0x5a3a38, { jitter: 0.2 });
      const co = { c: sal, spand: salD, style: 'pier', bay: 2, ww: 1, st: 3.5, chev: p.stain, pierC: c(0xe8b4a0, { jitter: 0.25, pat: 'terracotta' }), frieze: p.stain, cornice: p.stain };
      D.mass(50, -147, 72, -104, 0.25, 22, Object.assign({}, co, { wy0: 5, chev: null }));
      D.mass(53, -140, 69, -111, 22, 52, Object.assign({}, co, { hollow: true }));
      D.mass(55, -131.5, 67, -119.5, 52, 72, Object.assign({}, co, { hollow: true, parapet: false, corner: false, topBand: 0.5, frieze: false }));
      for (let i = 0; i < 5; i++) {
        const hs = 6 - i * 1.25, y = 72 + i * 3, cx = 61, cz = -125.5, tb = { x0: cx - hs, z0: cz - hs, x1: cx + hs, z1: cz + hs };
        W.fill(tb.x0 + 0.25, y, tb.z0 + 0.25, tb.x1 - 0.25, y + 3, tb.z1 - 0.25, p.stain);
        for (const f of 'NSWE') D.fan(tb, f, f === 'N' || f === 'S' ? cx : cz, y, hs, hs * 0.95 + 0.5, 5, p.stain, p.triLit, p.stainLit, 0, 0.25);
      }
      W.fill(60.5, 87, -126, 61.5, 93, -125, p.stain); W.fill(60.75, 93, -125.75, 61.25, 98, -125.25, p.stain); W.fill(60.75, 98, -125.75, 61, 101, -125.5, p.stain);
      D.lights.push({ x: 61, y: 101.3, z: -125.5 });
      const cb = { x0: 55, z0: -131.5, x1: 67, z1: -119.5 };
      for (const f of 'NSWE') for (const u of f === 'N' || f === 'S' ? [55.5, 66] : [-131, -120.5]) FF(cb, f, u, u + 0.5, 70, 71, -1.5, 0, p.stain);   // radiator-cap wings at the corners
      D.base(50, -147, 72, -104, 5, 'NE', { skip: [{ f: 'N', u: 61, w: 4 }] });
      D.tank(56.5, 22, -108, 1.25); D.bulkhead(64, 52, -113, 3, 1.5, 3);
      T('The Chrysalis Building', { x: 61, z: -125.5, h: 101 });

      // Trust Annex wing along Charter St
      const brick = c(0xa8603f, { jitter: 0.5, pat: 'brick' });
      D.mass(10, -104, 72, -88, 0.25, 12.5, { c: brick, spand: c(0x5a3428), style: 'pier', bay: 2.5, ww: 1.25, st: 3.75, wy0: 5, pierC: c(0xb86a48, { jitter: 0.5, pat: 'brick' }), frieze: p.coping });
      D.base(10, -104, 72, -88, 5, 'SWE', { skip: [{ f: 'S', u: 41, w: 4 }] });
      D.tank(20, 12.5, -96, 1.5); D.tank(62, 12.5, -96, 1.25); D.bulkhead(40, 12.5, -99, 3, 3, 3);
      D.billboard(26, 12.5, -93, 'SOLACE COLA', c(0xfff8ec, { emit: 0xfff0d8, emitK: 2.2, mode: 'night', jitter: 0 }), c(0xb3312c, { emit: 0x801010, emitK: 0.5, mode: 'night', jitter: 0.1 }), 0); D.fireEscape({ x0: 10, z0: -104, x1: 72, z1: -88 }, 'S', 48, 53, 8, 12.5); D.fireEscape({ x0: 10, z0: -104, x1: 72, z1: -88 }, 'E', -101, -96, 8, 12.5);
    }

    // ---------------------------------------------------------- dt-hotel lot: THE GRAND SOLACE HOTEL — red brick & white trim wedding cake, rooftop neon
    {
      const brk = c(0xa3412f, { jitter: 0.35, pat: 'brick' }), trim = c(0xf2ead8, { jitter: 0.15, pat: 'stone' }), hd = c(0x5b3b2e, { jitter: 0.2 });
      const ho = { c: brk, spand: hd, style: 'pier', bay: 2, ww: 1, st: 3.5, pierC: trim, frieze: p.goldLit, wins: p.hwin, band: trim, cornice: trim };
      D.mass(10, -72, 72, -10, 0.25, 12.5, Object.assign({}, ho, { bay: 2.5, ww: 1.25, st: 3.75, wy0: 5 }));
      D.mass(16, -64, 64, -22, 12.5, 30, Object.assign({}, ho, { hollow: true }));
      D.mass(22, -58, 56, -28, 30, 46, Object.assign({}, ho, { hollow: true }));
      D.mass(28, -52, 50, -34, 46, 58, Object.assign({}, ho, { hollow: true, cornice: p.gold, parapetH: 1.25, fins: 1 }));
      D.base(10, -72, 72, -10, 5, 'WNE', { skip: [{ f: 'W', u: -41, w: 4 }, { f: 'E', u: -31, w: 42 }] });
      // striped awnings over the south-facing windows of the first tower tier
      const t1 = { x0: 16, z0: -64, x1: 64, z1: -22 };
      for (let u = 17.25; u < 63; u += 2) if (AF.hash2(u * 4, 91) < 0.55) for (const y of [17, 24]) for (let k = 0; k < 2; k++) for (let uu = u; uu < u + 1.5; uu += 0.25) FF(t1, 'S', uu, uu + 0.25, y + 2.25 - k * 0.25, y + 2.5 - k * 0.25, -0.75 - k * 0.5, -0.25 - k * 0.5, (((uu - u) * 4) | 0) % 2 ? p.white : [p.awnRed, p.awnTeal, p.awnGreen][(u | 0) % 3]);
      // neon GRAND SOLACE on a steel lattice on the top roof (facing south over Meridian Ave)
      const nm = AF.textModel('GRAND SOLACE', p.neonRed, { bold: true });
      const sx = 39 - nm.w * 0.25 / 2, ry = 58, rz = -35.5;
      for (let x = sx; x < sx + nm.w * 0.25; x += 3) { W.fill(x, ry, rz - 0.5, x + 0.25, ry + 4.5, rz - 0.25, p.steelD); W.fill(x, ry, rz - 2.5, x + 0.25, ry + 3, rz - 2.25, p.steelD); W.fill(x, ry + 2.75, rz - 2.25, x + 0.25, ry + 3, rz - 0.5, p.steelD); }
      W.fill(sx, ry + 2.75, rz - 0.25, sx + nm.w * 0.25, ry + 3, rz, p.steelD);
      W.stamp(nm, sx, ry + 2.5, rz, 0);
      W.fill(sx - 0.5, ry + 2.25, rz + 0.25, sx + nm.w * 0.25 + 0.5, ry + 2.5, rz + 0.5, p.neonBlue); W.fill(sx - 0.5, ry + 5, rz + 0.25, sx + nm.w * 0.25 + 0.5, ry + 5.25, rz + 0.5, p.neonBlue);
      D.tank(32, 58, -48, 1.5); D.tank(46, 58, -48, 1.25); D.bulkhead(37, 58, -50, 3, 2.5, 3); D.aerial(29.5, 58, -50.5, 5);
      D.tank(25, 46, -55, 1.25); D.tank(53, 46, -55, 1.25); D.tank(19, 30, -61, 1.25); D.tank(61, 30, -61, 1.25); D.skylight(18, 12.5, -70, 10, 3); D.skylight(46, 12.5, -70, 10, 3);
      D.garden(23, 46, -32.5, 27.5, -28.75); D.pergola(50.5, 46, -33, 55.5, -28.5); D.coop(23, 30, -26);
      // ROOF TERRACE on the podium (south strip): deck, striped umbrellas, tables, deck chairs, planters, string lights
      {
        const deck = c(0xb08658, { jitter: 0.4, patTop: 'plank' }), deck2 = c(0x9a7248, { jitter: 0.4, patTop: 'plank' });
        for (let x = 17; x < 63; x += 0.5) W.fill(x, 12.5, -21.5, x + 0.5, 12.75, -10.5, ((x * 2) | 0) % 2 ? deck : deck2);
        const lounger = mk('lounger', 5, 5, 15, (m) => { m.box(0, 2, 0, 5, 3, 11, p.white); for (let k = 0; k < 4; k++) m.box(0, 3 + k, 10 + k, 5, 4 + k, 11 + k, p.white); m.box(0, 0, 0, 1, 2, 1, p.steelD); m.box(4, 0, 0, 5, 2, 1, p.steelD); m.box(0, 0, 10, 1, 2, 11, p.steelD); m.box(4, 0, 10, 5, 2, 11, p.steelD); m.box(1, 3, 1, 4, 3.5, 9, p.awnTeal); });
        const cols = [p.awnRed, p.awnTeal, p.awnGreen];
        for (let i = 0; i < 7; i++) { const x = 20 + i * 6.3, z = -16; AF.placeStatic(umb(cols[i % 3]), x, 12.75, z, 0, { collide: false }); AF.placeStatic(bistro(), x - 1.2, 12.75, z, 1, { collide: false }); AF.placeStatic(bistro(), x + 1.2, 12.75, z, 3, { collide: false }); }
        for (let i = 0; i < 8; i++) AF.placeStatic(lounger, 19.5 + i * 5.7, 12.75, -12.4, 2, { collide: false });
        for (let x = 18; x < 62; x += 4) { W.fill(x, 12.75, -21.25, x + 1, 13.5, -20.75, p.woodD); W.fill(x + 0.25, 13.5, -21.25, x + 0.75, 14, -20.75, c(0x4f8a3a, { jitter: 0.8 })); }
        for (let x = 17.5; x < 62.5; x += 1.5) W.fill(x, 15.25, -21, x + 0.25, 15.5, -20.75, p.bulb);
        for (let x = 17.5; x < 62.5; x += 1.5) W.fill(x, 14.75, -11, x + 0.25, 15, -10.75, p.bulb);
        W.fill(17.5, 15.5, -21, 62.5, 15.75, -20.75, p.steelD); W.fill(17.5, 15, -11, 62.5, 15.25, -10.75, p.steelD); for (const x of [17.25, 62.5]) { W.fill(x, 12.75, -21, x + 0.25, 15.75, -20.75, p.steelD); W.fill(x, 12.75, -11, x + 0.25, 15.25, -10.75, p.steelD); }
      }
      D.tank(66, 12.5, -66, 1.5); D.tank(14, 12.5, -66, 1.25);
      D.garden(64.5, 12.5, -20, 70, -12);
      { // HARBOUR COFFEE — the steaming-cup spectacular over the Grand × Meridian corner (lit at night, real steam)
        const cx = 13.5, cz = -15.5, y0 = 14.5, H = 6.25, cupW = p.creamLit, band = p.neonRed, coffee = c(0x4a2a18, { jitter: 0.1 });
        for (const [lx, lz] of [[11.5, -18], [15.25, -18], [11.5, -13.25], [15.25, -13.25]]) W.fill(lx, 12.5, lz, lx + 0.25, y0, lz + 0.25, p.steelD);
        W.fill(11.25, y0 - 0.25, -18.25, 15.75, y0, -12.75, p.steelD);
        for (let dx = -3.5; dx < 3.5; dx += 0.25) for (let dz = -3.5; dz < 3.5; dz += 0.25) {
          const r = Math.hypot(dx + 0.125, dz + 0.125), x = cx + dx, z = cz + dz;
          if (r < 3.4) W.fill(x, y0, z, x + 0.25, y0 + 0.25, z + 0.25, r > 3 ? p.gold : p.white);
          for (let y = y0 + 0.25; y < y0 + H; y += 0.25) {
            const R = 1.9 + (y - y0) * 0.16;
            if (r < R && r >= R - 0.45) W.fill(x, y, z, x + 0.25, y + 0.25, z + 0.25, y > y0 + H - 0.5 ? p.gold : (y > y0 + 3 && y < y0 + 4) ? band : (y > y0 + 2.5 && y < y0 + 2.75) || (y > y0 + 4.25 && y < y0 + 4.5) ? p.gold : cupW);
            else if (r < R - 0.45 && y < y0 + 0.5) W.fill(x, y, z, x + 0.25, y + 0.25, z + 0.25, cupW);
            else if (r < R - 0.45 && Math.abs(y - (y0 + H - 0.6)) < 0.13) W.fill(x, y, z, x + 0.25, y + 0.25, z + 0.25, coffee);
          }
        }
        for (let y = y0 + 1.25; y < y0 + 5.25; y += 0.25) for (let dz = 0; dz < 2.5; dz += 0.25) { const d = Math.hypot(dz + 0.125 - 0.6, y + 0.125 - (y0 + 3.25)); if (d > 0.9 && d < 1.5 && dz > 0.6) W.fill(cx - 0.25, y, cz + 2.4 + dz, cx + 0.25, y + 0.25, cz + 2.65 + dz, cupW); }
        const sg = AF.meshModel(AF.textModel('HARBOUR COFFEE', p.goldLit, { bg: p.black, pad: 1 }), { vs: 1 / 8, anchor: [0.5, 0, 0] });
        AF.placeStatic(sg, 10.125, 13.75, -15.5, 3, { collide: false });
        if (typeof AF.addChimney === 'function') { AF.addChimney(cx, y0 + H - 0.3, cz); AF.addChimney(cx + 0.75, y0 + H - 0.3, cz - 0.5); AF.addChimney(cx - 0.5, y0 + H - 0.3, cz + 0.5); }
        if (typeof AF.addLight === 'function') AF.addLight({ x: cx, y: y0 + 2, z: cz, color: 0xffd9a0, intensity: 1, range: 10, kind: 'sign' });
      }
      for (const x of [24, 31.75]) D.flag(x, 7, -7, x < 28 ? c(0xb3312c) : navy, 3.5);
      for (const x of [14, 66]) D.flag(x, 12.5, -12, x < 40 ? c(0xb3312c) : navy, 5, { city: x > 40 });
      D.flag(48.75, 58, -50.75, c(0xb3312c), 6, { big: true });
      S.push({ x: 53, y: 46.25, z: -45 });
      T('The Grand Solace Hotel', { x: 39, z: -43, h: 64 });
    }

    // ---------------------------------------------------------- dt-store lot: MERIDIAN DEPT STORE + THE PINNACLE (white & stainless needle)
    {
      const wl = c(0xeee6d4, { jitter: 0.25, pat: 'stone' }), teal = c(0x3f9a9a, { jitter: 0.2 });
      D.mass(88, -72, 130, -10, 0.25, 20.5, { c: wl, spand: teal, style: 'pier', bay: 3, ww: 2, st: 5, wh: 3, wy0: 5 });
      D.mass(96, -60, 122, -20, 20.5, 26, { c: wl, spand: teal, style: 'pier', bay: 2.5, ww: 1.25, st: 5, wh: 2.5, cornice: teal, frieze: p.goldLit });
      D.base(88, -72, 130, -10, 5, 'WN', {});
      const nm = AF.textModel('MERIDIAN', teal, { bold: true }); W.stamp(nm, 109 - nm.w * 0.25 / 2, 16.75, -10, 0);
      W.fill(100, 16.25, -10, 118, 16.5, -9.75, p.goldLit); W.fill(100, 19, -10, 118, 19.25, -9.75, p.goldLit);
      W.fill(88.5, 12, -10.5, 90.5, 14, -9.25, p.bronze); W.fill(88.75, 12.25, -9.5, 90.25, 13.75, -9.25, p.creamLit);
      D.tank(100, 26, -40, 1.5); D.bulkhead(114, 26, -30, 3, 3, 3); D.skylight(90, 20.5, -68, 10, 4); D.flag(97.5, 26, -21.5, c(0x3f9a9a), 4);
      // R2: rooftop neon script "Meridian" on a steel raceway over Meridian Ave (rose neon, lit at dusk)
      {
        const neon = c(0xffa0bc, { emit: 0xff4f8a, emitK: 3.2, mode: 'night', jitter: 0, edge: 0 }), sm = AF.textModel('Meridian', neon, { font: 'script', pad: 0 });
        const sw = sm.w * 0.25, sx0 = Math.round((109 - sw / 2) * 4) / 4, sy = 27.75, sz = -21.75;
        for (let x = sx0 - 0.5; x < sx0 + sw + 0.5; x += 2.5) { W.fill(x, 26, sz - 0.5, x + 0.25, sy + sm.h * 0.25 - 1, sz - 0.25, p.steelD); W.fill(x, 26, sz - 2, x + 0.25, sy + 1, sz - 1.75, p.steelD); W.fill(x, sy + 0.75, sz - 1.75, x + 0.25, sy + 1, sz - 0.5, p.steelD); }
        W.fill(sx0 - 0.5, sy + 1, sz - 0.5, sx0 + sw + 0.5, sy + 1.25, sz - 0.25, p.steelD); W.fill(sx0 - 0.5, sy + sm.h * 0.25 - 1.5, sz - 0.5, sx0 + sw + 0.5, sy + sm.h * 0.25 - 1.25, sz - 0.25, p.steelD);
        W.stamp(sm, sx0, sy, sz, 0);
        const ul = c(0x9fe8ff, { emit: 0x4fd0ff, emitK: 2.6, mode: 'night', jitter: 0, edge: 0 }); W.fill(sx0 + 1, sy - 0.25, sz, sx0 + sw - 1, sy, sz + 0.25, ul);
        if (typeof AF.addLight === 'function') AF.addLight({ x: 109, y: sy + 2, z: sz + 1, color: 0xff5f9a, intensity: 1.2, range: 14, kind: 'sign' });
      }
      // R2: SKY LINKS — a 1936 rooftop miniature-golf course on the store's south deck (windmill with turning sails, lighthouse, bridge, clubhouse)
      {
        const y = 20.5, felt = c(0x4aa84a, { jitter: 0.1, pat: 'none' }), rail = c(0xf4efe4, { jitter: 0.05, pat: 'none' }), sand = c(0xe8d8a0, { jitter: 0.2, pat: 'none' }), cupC = c(0x141414, { pat: 'none' });
        const holes = [[90, -18.75, 98.5, -15.25], [100.5, -14.5, 108.5, -11], [110, -18.75, 118.5, -15.25], [120, -14.5, 128.5, -11]];
        holes.forEach(([x0, z0, x1, z1], i) => {
          W.fill(x0, y, z0, x1, y + 0.25, z1, felt); W.walls(x0 - 0.25, y, z0 - 0.25, x1 + 0.25, y + 0.5, z1 + 0.25, rail);
          const cx = i % 2 ? x0 + 1 : x1 - 1.25, cz = (z0 + z1) / 2 - 0.125; W.fill(cx, y + 0.25 - 0.25, cz, cx + 0.25, y + 0.25, cz + 0.25, cupC);
          W.fill(cx, y + 0.25, cz, cx + 0.25, y + 1.75, cz + 0.25, rail); W.fill(cx + 0.25, y + 1.25, cz, cx + 0.75, y + 1.75, cz + 0.25, p.red);
          W.fill(i % 2 ? x1 - 1 : x0 + 0.5, y + 0.25, cz, (i % 2 ? x1 - 1 : x0 + 0.5) + 0.25, y + 0.5, cz + 0.25, p.white);   // tee
        });
        W.fill(104, y, -14, 106, y + 0.25, -12.5, sand);
        // lighthouse obstacle (hole 1)
        for (let dx = -0.75; dx < 0.75; dx += 0.25) for (let dz = -0.75; dz < 0.75; dz += 0.25) { const r = Math.hypot(dx + 0.125, dz + 0.125); if (r < 0.7) for (let yy = y + 0.25; yy < y + 3; yy += 0.25) if (!(r < 0.5 && yy < y + 0.75 && Math.abs(dz + 0.125) < 0.4)) W.fill(94 + dx, yy, -17 + dz, 94 + dx + 0.25, yy + 0.25, -17 + dz + 0.25, yy > y + 2.5 ? p.lantern : (((yy - y) * 2) | 0) % 2 ? p.white : p.red); }
        W.fill(93.25, y + 3, -17.75, 94.75, y + 3.25, -16.25, p.red); W.fill(93.75, y + 3.25, -17.25, 94.25, y + 3.75, -16.75, p.red);
        // windmill obstacle (hole 3): red board mill with a tunnel; the sails are a dynamic mesh (turn in the tick)
        W.fill(113.5, y + 0.25, -18.5, 115.5, y + 3.5, -15.5, p.awnRed); W.clear(113.5, y + 0.25, -17.5, 115.5, y + 0.75, -16.5);
        W.fill(113.25, y + 3.5, -18.75, 115.75, y + 3.75, -15.25, p.woodD); W.fill(113.75, y + 3.75, -18.25, 115.25, y + 4.25, -15.75, p.woodD); W.fill(114.25, y + 4.25, -17.75, 114.75, y + 4.5, -16.25, p.woodD);
        for (let yy = y + 1.25; yy < y + 3.25; yy += 1) W.fill(113.25, yy, -17.25, 113.5, yy + 0.5, -16.75, p.win[2]);
        D.spin = D.spin || []; D.spin.push({ x: 114.5, y: y + 2.5, z: -15.2 });
        // humpback bridge (hole 4)
        for (let k = 0; k < 8; k++) { const h = Math.sin((k + 0.5) / 8 * Math.PI) * 0.75; W.fill(123 + k * 0.25, y + 0.25, -14, 123 + k * 0.25 + 0.25, y + 0.25 + h, -11.5, k % 2 ? p.wood : p.woodD); }
        // clubhouse kiosk with a striped awning and sign
        W.fill(100.5, y, -19.5, 105, y + 2.75, -16.5, p.white); W.clear(101.25, y + 1, -16.75, 104.25, y + 2.25, -16.5); W.fill(101.25, y + 1, -17, 104.25, y + 1.25, -16.5, p.wood);
        for (let x = 100.5; x < 105; x += 0.5) W.fill(x, y + 2.5, -16.5, x + 0.5, y + 2.75, -15.5, ((x * 2) | 0) % 2 ? p.white : p.awnGreen);
        W.fill(100.25, y + 2.75, -19.75, 105.25, y + 3, -16.25, p.awnGreen);
        const sl = AF.meshModel(AF.textModel('SKY LINKS', c(0xf6e08a, { emit: 0xffd27a, emitK: 1.4, mode: 'night', jitter: 0 }), { bg: c(0x1c3a28), pad: 1 }), { vs: 1 / 12, anchor: [0.5, 0, 0] });
        AF.placeStatic(sl, 102.75, y + 3, -16.3, 0, { collide: false });
        W.fill(106, y, -19.25, 109, y + 0.5, -18.5, p.wood); W.fill(106, y + 0.5, -19.25, 109, y + 1, -19, p.wood);   // bench
        for (const x of [106.5, 108]) for (let k = 0; k < 3; k++) W.fill(x + k * 0.25, y + 0.5, -18.75, x + k * 0.25 + 0.125, y + 1.25, -18.5, [p.red, p.awnTeal, p.white][k]);   // putters
        for (const [x, z, yaw] of [[97, -17, 1.57], [101.5, -12.5, -1.57], [118, -17.2, 1.57], [126.5, -12, -1.57], [110.75, -17.8, 1.57], [107.5, -17.5, 3.14]]) D.spot('sky-links', x, y + 0.25, z, yaw, 'stand');
        D.festoon(89, -10.75, 129, -10.75, y + 3, 0.6);
        for (const x of [89, 99, 109, 119, 129]) W.fill(x - 0.25, y, -11, x, y + 3.25, -10.75, p.steelD);
      }
      T('Meridian Department Store', { x: 109, z: -41, h: 30 });
      const wht = c(0xeeece4, { jitter: 0.2, pat: 'terracotta' }), silD = c(0x22304a, { jitter: 0.2, metal: 0.55, rough: 0.3 });
      const po = { c: wht, spand: silD, style: 'pier', bay: 2, ww: 1, st: 3.5, cornice: p.stain, pierC: c(0xf8f6f0, { jitter: 0.15 }), chev: p.stain, frieze: p.stain };
      D.mass(130, -72, 147, -10, 0.25, 14, Object.assign({}, po, { bay: 2, ww: 1, wy0: 5, chev: null }));
      D.mass(132, -52, 145, -30, 14, 60, Object.assign({}, po, { hollow: true }));
      D.mass(133.5, -48.5, 143.5, -33.5, 60, 86, Object.assign({}, po, { hollow: true, fins: 2 }));
      D.mass(135, -45.5, 142, -36.5, 86, 96, Object.assign({}, po, { hollow: true, parapet: false, corner: false }));
      for (let i = 0; i < 5; i++) W.fill(135.75 + i * 0.5, 96 + i * 1.5, -44.75 + i * 0.75, 141.25 - i * 0.5, 97.5 + i * 1.5, -37.25 - i * 0.75, i % 2 ? p.stain : p.stainLit);
      W.fill(138.25, 103.5, -41.25, 138.75, 110, -40.75, p.stain); W.fill(138.5, 110, -41, 138.75, 113, -40.75, p.stain);
      D.lights.push({ x: 138.6, y: 113.3, z: -40.9 });
      D.base(130, -72, 147, -10, 5, 'NSE', { skip: [{ f: 'S', u: 138.5, w: 4 }] });
      const ribS = c(0xdfe4ea, { emit: 0xcfe4ff, emitK: 0.35, mode: 'night', jitter: 0.05, metal: 1, rough: 0.16 });
      for (const [tx0, tz0, tx1, tz1, ty0, ty1] of [[132, -52, 145, -30, 14, 60], [133.5, -48.5, 143.5, -33.5, 60, 86]]) {
        const tb = { x0: tx0, z0: tz0, x1: tx1, z1: tz1 };
        for (const f of 'NSWE') { const cu = f === 'N' || f === 'S' ? 138.5 : -41; FF(tb, f, cu - 0.5, cu + 0.5, ty0 + 0.5, ty1 + 2.5, -0.75, 0, ribS); }
      }
      // R2 roof: clay tennis court (north deck) + a roof garden with autumn trees and a pergola (south deck)
      D.court(134.5, 14, -69.5, 142.5, -54.5);
      for (const [tx, tz] of [[132.5, -27.5], [144, -27.5], [132.5, -13], [144, -13]]) D.tree(tx, 14, tz, 1.5, 2);
      D.garden(135, 14, -28.5, 142, -26.5); D.pergola(135, 14, -21, 142, -14);
      for (const x of [136, 140]) AF.placeStatic(mk('bench', 12, 7, 5, (m) => { m.box(0, 3, 0, 12, 4, 4, p.wood); m.box(0, 4, 3, 12, 7, 4, p.wood); m.box(1, 0, 0, 2, 3, 4, p.steelD); m.box(10, 0, 0, 11, 3, 4, p.steelD); }), x, 14, -17.5, 0, { collide: false });
      D.festoon(135, -21, 142, -14, 16.75, 0.5); D.festoon(135, -14, 142, -21, 16.75, 0.5);
      D.tank(131.5, 14, -60, 1); D.tank(143, 60, -50.5, 1); D.bulkhead(134, 60, -51.5, 2.5, 2, 3);
      T('The Pinnacle', { x: 138.5, z: -41, h: 113 });
    }

    // ---------------------------------------------------------- dt-radio lot: WSOL (white with red piers + lattice mast) + BEACON (clock) + NEPTUNE (copper pyramid)
    {
      const cr = c(0xf0ead8, { jitter: 0.2, pat: 'terracotta' }), rd = c(0xa8322d, { jitter: 0.2 });
      D.mass(88, 10, 126, 52, 0.25, 14, { c: cr, spand: rd, style: 'pier', bay: 2.5, ww: 1.25, st: 4.5, wy0: 5, frieze: p.redLit, pierC: rd });
      D.mass(94, 16, 120, 46, 14, 30, { c: cr, spand: rd, style: 'pier', bay: 2, ww: 1, st: 3.5, cornice: rd, pierC: p.redGlow, hollow: true, chev: cr });
      D.mass(98, 20, 116, 42, 30, 58, { c: cr, spand: rd, style: 'pier', bay: 2, ww: 1, st: 3.5, cornice: rd, pierC: p.redGlow, hollow: true, chev: cr, fins: 1 });
      D.base(88, 10, 126, 52, 5, 'NW', { skip: [{ f: 'N', u: 107, w: 11 }] });
      // chrome radio fins either side of the door + neon WSOL + ON AIR
      const rb = { x0: 88, z0: 10, x1: 126, z1: 52 };
      for (const u of [102, 102.75, 111, 111.75]) FF(rb, 'N', u, u + 0.25, 0.25, 11.5 - Math.abs(u - 107) * 0.2, -1.5, 0, p.stain);
      D.door(rb, 'N', 107, 4, 4, 2, { canopy: 3 });
      const nm = AF.textModel('WSOL', p.neonRed, { bold: true, bg: p.black }); W.stamp(nm, 107 - nm.w * 0.25 / 2, 10, 9.5, 2);
      const oa = AF.textModel('ON AIR', c(0xff5a4a, { emit: 0xff2f2a, emitK: 3, mode: 'always', jitter: 0 }), { bg: p.black, pad: 1 }); W.stamp(oa, 107 - oa.w * 0.25 / 2, 7.5, 9.5, 2);
      // lattice mast 58 -> 122 on the roof centre (107, 31), red and white bands, X-braces
      const mx = 107, mz = 31, base = 58, top = 122;
      let prevY = base;
      for (let y = base; y < top; y += 0.25) {
        const hw = 3.25 * (1 - (y - base) / (top - base)) + 0.25;
        const band = ((((y - base) / 8) | 0) % 2) ? p.white : p.red;
        for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) W.fill(mx + sx * hw - 0.125, y, mz + sz * hw - 0.125, mx + sx * hw + 0.125, y + 0.25, mz + sz * hw + 0.125, band);
        if (((y - base) * 4 | 0) % 16 === 0) { W.walls(mx - hw, y, mz - hw, mx + hw, y + 0.25, mz + hw, band); prevY = y; }
        const k = ((y - prevY) / 4);   // X-braces between rings
        if (k > 0 && k < 1) for (const s of [-1, 1]) { const t = -hw + 2 * hw * k; W.fill(mx + s * t - 0.125, y, mz - hw - 0.125, mx + s * t + 0.125, y + 0.25, mz - hw + 0.125, band); W.fill(mx + s * t - 0.125, y, mz + hw - 0.125, mx + s * t + 0.125, y + 0.25, mz + hw + 0.125, band); W.fill(mx - hw - 0.125, y, mz + s * t - 0.125, mx - hw + 0.125, y + 0.25, mz + s * t + 0.125, band); W.fill(mx + hw - 0.125, y, mz + s * t - 0.125, mx + hw + 0.125, y + 0.25, mz + s * t + 0.125, band); }
      }
      W.fill(mx - 0.125, top, mz - 0.125, mx + 0.125, top + 1, mz + 0.125, p.red);
      D.lights.push({ x: mx, y: top + 1.3, z: mz }, { x: mx, y: 90, z: mz - 1.9 });
      AF.wsolMast = { x: mx, y: top + 1, z: mz };
      // R2: vertical neon blade "WSOL 880" with a lightning zigzag, standing on the 30 m setback against the N face (both sides lettered)
      {
        const bx0 = 106.5, bx1 = 107.5, bz0 = 16.25, bz1 = 20, by0 = 30, by1 = 55.5, navyB = c(0x1c2440, { jitter: 0.1 }), nr = c(0xff5a4a, { emit: 0xff2f2a, emitK: 3.2, mode: 'night', jitter: 0, edge: 0 }), nb = c(0x9fe0ff, { emit: 0x4fc0ff, emitK: 2.6, mode: 'night', jitter: 0, edge: 0 });
        W.fill(bx0, by0, bz0, bx1, by1, bz1, navyB);
        for (let y = by0 + 0.5; y < by1; y += 0.75) for (const z of [bz0, bz1 - 0.25]) { W.fill(bx0 - 0.25, y, z, bx0, y + 0.25, z + 0.25, p.bulb); W.fill(bx1, y, z, bx1 + 0.25, y + 0.25, z + 0.25, p.bulb); }
        for (let z = bz0; z < bz1; z += 0.75) for (const y of [by0 + 0.25, by1 - 0.25]) { W.fill(bx0 - 0.25, y, z, bx0, y + 0.25, z + 0.25, p.bulb); W.fill(bx1, y, z, bx1 + 0.25, y + 0.25, z + 0.25, p.bulb); }
        const glyph = (ch, yb, s, col) => { const m = AF.textModel(ch, col, { pad: 0 }), zc = (bz0 + bz1) / 2, zl = zc - (m.w * s) / 2;
          for (let i = 0; i < m.w; i++) for (let j = 0; j < m.h; j++) { if (!m.get(i, j, 0) && !m.get(i, j, m.d - 1)) continue; const y = yb + j * s;
            W.fill(bx0 - 0.25, y, zl + i * s, bx0, y + s, zl + (i + 1) * s, col);                          // W face reads +z
            W.fill(bx1, y, zl + (m.w - 1 - i) * s, bx1 + 0.25, y + s, zl + (m.w - i) * s, col); } };      // E face reads -z
        'WSOL'.split('').forEach((ch, k) => glyph(ch, by1 - 1.25 - (k + 1) * 4.25, 0.5, nr));
        ['8', '8', '0'].forEach((ch, k) => glyph(ch, 35.25 - k * 2, 0.25, nb));
        for (let k = 0; k < 6; k++) { const y = 53.75 + k * 0.25, dz = [0, 0.5, 1, 0.75, 1.25, 1.75][k]; W.fill(bx0 - 0.25, y, bz0 + 0.75 + dz, bx0, y + 0.5, bz0 + 1.25 + dz, nb); W.fill(bx1, y, bz0 + 0.75 + dz, bx1 + 0.25, y + 0.5, bz0 + 1.25 + dz, nb); }
        if (typeof AF.addLight === 'function') AF.addLight({ x: 107, y: 44, z: 17, color: 0xff4030, intensity: 1.2, range: 16, kind: 'sign' });
      }
      D.bulkhead(99, 58, 21, 3, 2.5, 3); D.tank(113.5, 58, 39.5, 1.25); D.tank(96.5, 30, 44, 1.25); D.flag(119, 14, 12, c(0xb3312c), 4);
      T('WSOL Radio', { x: 107, z: 31, h: 123 });
      // BEACON BUILDING — sandstone with a four-face clock stage and a lit glass lantern
      const ss = c(0xcaa27a, { jitter: 0.3, pat: 'stone' }), ssD = c(0x4a3a2c, { jitter: 0.2 });
      D.mass(126, 10, 147, 72, 0.25, 16, { c: ss, spand: ssD, style: 'pier', bay: 2.5, ww: 1.25, st: 3.75, wy0: 5 });
      D.mass(128.5, 24, 144.5, 56, 16, 44, { c: ss, spand: ssD, style: 'pier', bay: 2, ww: 1, st: 3.5, cornice: p.gold, hollow: true, chev: p.bronze, pierC: c(0xd8b48c, { jitter: 0.3, pat: 'stone' }) });
      W.fill(131.5, 44, 35, 141.5, 54, 45, ss); W.fill(131.25, 53.5, 34.75, 141.75, 54, 45.25, p.gold);
      const ck = { x0: 131.5, z0: 35, x1: 141.5, z1: 45 };
      for (const f of 'NSWE') {
        const cu = f === 'N' || f === 'S' ? 136.5 : 40;
        for (let u = cu - 4; u < cu + 4; u += 0.25) for (let y = 45; y < 53; y += 0.25) {
          const r = Math.hypot(u + 0.125 - cu, y + 0.125 - 49), a = Math.atan2(u + 0.125 - cu, y + 0.125 - 49);
          if (r < 3.25) FF(ck, f, u, u + 0.25, y, y + 0.25, -0.25, 0, (r > 2.6 && Math.abs(((a / (Math.PI / 6)) % 1 + 1) % 1 - 0.5) > 0.38) ? p.bronze : p.creamLit);
          else if (r < 3.75) FF(ck, f, u, u + 0.25, y, y + 0.25, -0.5, 0, p.bronze);
        }
      }
      D.clock = { cx: 136.5, cz: 40, y: 49, hx: 5, hz: 5 };
      W.fill(131.5, 54, 35, 141.5, 54.5, 45, p.bronze);
      W.fill(132.5, 54.5, 36, 140.5, 59, 44, p.lantern);
      for (let x = 132.5; x < 140.5; x += 1.5) { W.fill(x, 54.5, 35.75, x + 0.25, 59, 44.25, p.bronze); }
      for (let z = 36; z < 44; z += 1.5) { W.fill(132.25, 54.5, z, 140.75, 59, z + 0.25, p.bronze); }
      W.fill(132, 59, 35.5, 141, 59.5, 44.5, p.bronze); D.zig(133, 36.5, 140, 43.5, 59.5, 4, 0.75, 0.75, [p.gold, p.goldLit], null); W.fill(136.25, 62.5, 39.75, 136.75, 66, 40.25, p.gold);
      D.base(126, 10, 147, 72, 5, 'NES', { skip: [{ f: 'N', u: 136.5, w: 4 }] });
      D.tank(145, 16, 70, 1.1); D.aerial(143, 44, 26, 4); D.coop(130, 44, 50);
      // R2: THE BEACON PLUNGE — a rooftop swimming pool on the south deck (turquoise tiled pool, diving board, striped cabanas, loungers)
      {
        const y = 16, tileW = c(0xeef0ea, { jitter: 0.08, pat: 'tile' }), poolC = c(0x3fc0d0, { jitter: 0.12, rough: 0.08, pat: 'none' }), poolD = c(0x2a98b8, { jitter: 0.1, rough: 0.08, pat: 'none' }), lane = c(0x1c5a8a, { pat: 'none' });
        W.fill(127, y, 57, 146.5, y + 0.25, 71.5, tileW);
        W.fill(129.5, y, 59.5, 143.5, y + 0.25, 68.5, poolC); W.fill(131, y, 61, 142, y + 0.25, 67, poolD);
        for (const z of [61.75, 63.875, 66]) W.fill(130.5, y, z, 142.5, y + 0.25, z + 0.25, lane);
        W.walls(129.25, y + 0.25, 59.25, 143.75, y + 0.5, 68.75, tileW);
        W.fill(143.75, y + 0.25, 63.5, 146, y + 0.5, 64.5, p.white); W.fill(142, y + 0.5, 63.5, 143.75, y + 0.75, 64.5, p.white); W.fill(145.5, y + 0.5, 63.5, 146, y + 1, 64.5, p.steelD);   // diving board
        for (const x of [130.5, 142.5]) { W.fill(x, y + 0.25, 59, x + 0.25, y + 1.25, 59.25, p.stain); W.fill(x + 0.75, y + 0.25, 59, x + 1, y + 1.25, 59.25, p.stain); }   // ladders
        const lounger = mk('lounger', 5, 5, 15, (m) => { m.box(0, 2, 0, 5, 3, 11, p.white); for (let k = 0; k < 4; k++) m.box(0, 3 + k, 10 + k, 5, 4 + k, 11 + k, p.white); m.box(0, 0, 0, 1, 2, 1, p.steelD); m.box(4, 0, 0, 5, 2, 1, p.steelD); m.box(0, 0, 10, 1, 2, 11, p.steelD); m.box(4, 0, 10, 5, 2, 11, p.steelD); m.box(1, 3, 1, 4, 3.5, 9, p.awnTeal); });
        for (let i = 0; i < 6; i++) { AF.placeStatic(lounger, 130 + i * 2.3, y + 0.25, 70.2, 0, { collide: false }); D.spot('beacon-plunge', 130.3 + i * 2.3, y + 0.6, 70, Math.PI, 'sit'); }
        for (let i = 0; i < 3; i++) { const x0 = 127.5 + i * 4; W.fill(x0, y + 0.25, 57.25, x0 + 3, y + 2.5, 57.5, p.white); for (let x = x0; x < x0 + 3; x += 0.5) for (let k = 0; k < 3; k++) W.fill(x, y + 2.5 - k * 0.25, 57.25 + k * 0.5, x + 0.5, y + 2.75 - k * 0.25, 57.75 + k * 0.5, ((x * 2) | 0) % 2 ? p.white : [p.awnRed, p.awnTeal, p.awnGreen][i]); }
        for (const [x, z] of [[131, 62], [136, 64.5], [140, 60.5]]) D.spot('beacon-plunge', x, y + 0.1, z, AF.hash2(x, z) * 6, 'stand');
        AF.placeStatic(umb(p.awnRed), 139.5, y + 0.25, 58.5, 0, { collide: false }); AF.placeStatic(umb(p.awnTeal), 144.5, y + 0.25, 58.5, 0, { collide: false });
        D.festoon(127, 71.25, 146.5, 71.25, y + 3, 0.5); for (const x of [127, 146.25]) W.fill(x, y + 0.25, 71.25, x + 0.25, y + 3.25, 71.5, p.steelD);
      }
      // R2: roof garden + glasshouse on the Beacon's north deck
      {
        const y = 16, soil = c(0x5a3a24, { jitter: 0.3 }), veg = [0x4f8a3a, 0x6aa040, 0xd86a2a, 0xc8a030].map((h) => c(h, { jitter: 0.4 }));
        for (let i = 0; i < 5; i++) { const z0 = 11.5 + i * 2.25; W.fill(128, y, z0, 138, y + 0.5, z0 + 1.25, p.woodD); W.fill(128.25, y + 0.25, z0 + 0.25, 137.75, y + 0.5, z0 + 1, soil); for (let x = 128.5; x < 137.5; x += 0.75) W.fill(x, y + 0.5, z0 + 0.5, x + 0.25, y + 0.75 + ((x * 4 | 0) % 3) * 0.25, z0 + 0.75, veg[(i + (x * 4 | 0)) % 4]); }
        const gl = c(0xcfe8e0, { emit: 0xffe8b0, emitK: 0.8, mode: 'night', jitter: 0.05, rough: 0.1 });
        W.fill(139.5, y, 12, 146, y + 3, 20, gl); for (let x = 139.5; x <= 146; x += 1.25) W.fill(Math.min(x, 145.75), y, 12, Math.min(x, 145.75) + 0.25, y + 3, 20, p.white);
        for (let k = 0; k < 4; k++) W.fill(139.5 + k * 0.25, y + 3 + k * 0.25, 12, 146 - k * 0.25, y + 3.25 + k * 0.25, 20, k === 3 ? p.white : gl);
        W.clear(142.25, y + 0.25, 19.75, 143.5, y + 2.5, 20);
        D.tree(140.5, y, 22.25, 1.25, 1.8); D.tree(145, y, 22.25, 1.25, 1.8);
        D.spot('beacon-garden', 133, y + 0.25, 21.8, Math.PI, 'work');
      }
      T('The Beacon Building', { x: 136.5, z: 40, h: 66 });
      // NEPTUNE BUILDING — navy terracotta, copper pyramid roof
      const copperLit = c(0x6fbfa0, { emit: 0x60ffd0, emitK: 0.6, mode: 'night', jitter: 0.3 }), nv = c(0x44597a, { jitter: 0.3, pat: 'terracotta' }), nvD = c(0x223044, { jitter: 0.2 }), trimN = c(0xe8dcc0, { pat: 'stone' });
      D.mass(88, 52, 126, 72, 0.25, 16, { c: nv, spand: nvD, style: 'pier', bay: 2, ww: 1, st: 3.75, wy0: 5, frieze: p.copper });
      D.mass(96, 54, 118, 70, 16, 44, { c: nv, spand: nvD, style: 'pier', bay: 2, ww: 1, st: 3.5, cornice: trimN, parapet: false, hollow: true, chev: p.copper, pierC: trimN, corner: false });
      for (let i = 0; i < 40; i++) { const x0 = 96 + i * 0.25, x1 = 118 - i * 0.25, z0 = 54 + i * 0.25, z1 = 70 - i * 0.25; if (z1 - z0 < 0.5) break; W.fill(x0, 44 + i * 0.25, z0, x1, 44.25 + i * 0.25, z1, i % 4 === 3 ? copperLit : i % 6 === 5 ? p.copperD : p.copper); }
      W.fill(106.75, 51, 61.75, 107.25, 58, 62.25, p.gold); W.fill(106.5, 55, 61.5, 107.5, 56, 62.5, p.goldLit);
      D.base(88, 52, 126, 72, 5, 'SW', { skip: [{ f: 'S', u: 107, w: 4 }] });
      D.tank(92, 16, 66, 1.25); D.tank(122, 16, 58, 1.25);
      D.coop(119, 16, 68); D.billboard(88.5, 16, 55, 'WSOL 880', p.white, c(0x2a3e8c), 3);
      T('The Neptune Building', { x: 107, z: 62, h: 58 });
    }
    // entrances for the exterior-only towers + wings (closed bronze doors with lit glass, transoms, canopies)
    D.fakeDoor({ x0: 130, z0: -147, x1: 147, z1: -88 }, 'N', 138.5, 2.5, 3.5, 'THE AURORA'); D.fakeDoor({ x0: 50, z0: -147, x1: 72, z1: -104 }, 'N', 61, 2.5, 3.5, 'THE CHRYSALIS');
    D.fakeDoor({ x0: 130, z0: -72, x1: 147, z1: -10 }, 'S', 138.5, 2.5, 3.5, 'THE PINNACLE'); D.fakeDoor({ x0: 126, z0: 10, x1: 147, z1: 72 }, 'N', 136.5, 2.5, 3.5, 'BEACON BUILDING');
    D.fakeDoor({ x0: 88, z0: 52, x1: 126, z1: 72 }, 'S', 107, 2.5, 3.5, 'NEPTUNE'); D.fakeDoor({ x0: 88, z0: -104, x1: 130, z1: -88 }, 'S', 109, 2.5, 3.5, 'SOLACE ARCADE'); D.fakeDoor({ x0: 10, z0: -104, x1: 72, z1: -88 }, 'S', 41);
    D.fakeDoor({ x0: 10, z0: -72, x1: 72, z1: -10 }, 'W', -41, 3, 3.5);
    if (typeof AF.addViewpoint === 'function') AF.addViewpoint('Downtown', [200, 70, 30], [70, 28, -80]);
  });

  // ---------------------------------------------------------------- dynamic: rippling flags, blinking aircraft lights, window-washer scaffold, Beacon clock
  AF.onBuild('downtown-dyn', 600, () => {
    const FC = D.flagCols || { cream: AF.col(0xf1ede2), pole: AF.col(0xd8d0c0), gold: AF.col(0xe8b84a), white: AF.col(0xf6f4ee) };
    const flagMeshes = [], flagBase = [];
    for (const f of D.flags) {
      const m = new AF.Model(16, 10, 1);
      if (f.city) {   // Port Solace city flag: navy field, gold lighthouse, white wave
        m.box(0, 0, 0, 16, 10, 1, f.col); m.box(1, 1, 0, 16, 2, 1, FC.white); for (let x = 1; x < 16; x += 3) m.set(x + 1, 2, 0, FC.white);
        m.box(7, 3, 0, 9, 8, 1, FC.gold); m.box(6, 3, 0, 10, 4, 1, FC.gold); m.box(6.5 | 0, 8, 0, 10, 9, 1, FC.gold);
      } else { m.box(0, 0, 0, 16, 10, 1, f.col); m.box(0, 3, 0, 16, 7, 1, FC.cream); }
      m.box(0, 0, 0, 1, 10, 1, FC.pole);
      const g = AF.meshModel(m, { vs: f.big ? 1 / 4 : 1 / 8, anchor: [0, 1, 0.5] }).clone();
      const mesh = AF.modelMesh(g); mesh.position.set(f.x, f.y, f.z); mesh.rotation.y = -0.6 + AF.hash2(flagMeshes.length, 7) * 0.5; AF.scene.add(mesh); flagMeshes.push(mesh);
      flagBase.push(Float32Array.from(g.attributes.position.array)); f.yaw0 = mesh.rotation.y; f.len = f.big ? 4 : 2;
    }
    // aircraft warning lights (bloom at night, blink)
    const lm = []; const geo = new THREE.SphereGeometry(0.55, 10, 8); const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xff2a1a).multiplyScalar(3), toneMapped: true });
    for (const l of D.lights || []) { const s = new THREE.Mesh(geo, mat); s.position.set(l.x, l.y, l.z); s.frustumCulled = false; AF.scene.add(s); lm.push(s); if (typeof AF.addLight === 'function') AF.addLight({ x: l.x, y: l.y, z: l.z, color: 0xff3020, intensity: 1.2, range: 8, kind: 'sign' }); }
    // window-washer's bosun scaffold on Solace Tower's south face: rides down the 40 m shaft and winches back up (~90 s round trip)
    let wash = null;
    if (D.washer) {
      const w = D.washer, cw = AF.col(0x8a6a44, { jitter: 0.2 }), cr = AF.col(0x5d6166), co = AF.col(0x3f5f8a), cs = AF.col(0xe0b090), cc = AF.col(0xf0ead8), cb = AF.col(0x9fc8ff), cy = AF.col(0xd8b030);
      const m = new AF.Model(28, 16, 7);
      m.box(0, 0, 0, 28, 1, 7, cw); m.box(0, 1, 6, 28, 2, 7, cr); m.box(0, 6, 6, 28, 7, 7, cr); for (const x of [0, 13, 27]) m.box(x, 1, 6, x + 1, 7, 7, cr);
      m.box(0, 1, 0, 1, 15, 1, cr); m.box(27, 1, 0, 28, 15, 1, cr); m.box(0, 14, 0, 28, 15, 1, cr);
      for (const x0 of [5, 18]) { m.box(x0, 1, 2, x0 + 3, 5, 5, co); m.box(x0, 5, 2, x0 + 3, 9, 5, co); m.box(x0 + 0.5 | 0, 9, 2, x0 + 3, 11, 4, cs); m.box(x0, 11, 2, x0 + 3, 12, 5, x0 < 10 ? cc : cy); }
      m.box(9, 1, 3, 12, 3, 5, cr); m.box(9, 3, 3, 12, 4, 5, cb); m.box(22, 7, 1, 23, 10, 2, cy);   // bucket + squeegee
      const g = AF.meshModel(m, { vs: 1 / 8, anchor: [0.5, 0, 0] });
      const plat = AF.modelMesh(g); plat.position.set(w.x, w.y1, w.z + 0.3); AF.scene.add(plat);
      const rg = new THREE.BoxGeometry(0.05, 1, 0.05); rg.translate(0, 0.5, 0); const rmat = new THREE.MeshBasicMaterial({ color: 0x2a2a2a });
      const ropes = [-1.6, 1.6].map((dx) => { const r = new THREE.Mesh(rg, rmat); r.position.set(w.x + dx, w.y1, w.z + 0.35); AF.scene.add(r); return r; });
      wash = { w, plat, ropes };
    }
    // Beacon clock: four faces, hands show game time
    const hands = [];
    if (D.clock) {
      const k = D.clock, hm = new THREE.MeshStandardMaterial({ color: 0x2a1c10, metalness: 0.6, roughness: 0.4 });
      const hg = new THREE.BoxGeometry(0.32, 1.9, 0.12); hg.translate(0, 0.8, 0); const mg = new THREE.BoxGeometry(0.22, 2.8, 0.12); mg.translate(0, 1.25, 0);
      for (const [yaw, px, pz] of [[0, k.cx, k.cz + k.hz + 0.35], [Math.PI, k.cx, k.cz - k.hz - 0.35], [Math.PI / 2, k.cx + k.hx + 0.35, k.cz], [-Math.PI / 2, k.cx - k.hx - 0.35, k.cz]]) {
        const gr = new THREE.Group(); gr.position.set(px, k.y, pz); gr.rotation.y = yaw;
        const h = new THREE.Mesh(hg, hm), mn = new THREE.Mesh(mg, hm); mn.position.z = 0.1; gr.add(h, mn); AF.scene.add(gr); hands.push([h, mn]);
      }
    }
    // R2: windmill sails (Sky Links) + a flock of pigeons wheeling round the Solace crown
    const spins = [];
    if (D.spin && D.spin.length) {
      const sm = new AF.Model(25, 25, 1), fr = AF.col(0xf4efe4), cv = AF.col(0xe8dcc0, { jitter: 0.1 }), hub = AF.col(0x57391f);
      for (let k = 0; k < 11; k++) { sm.box(13 + k, 12, 0, 14 + k, 13, 1, fr); sm.box(11 - k, 12, 0, 12 - k, 13, 1, fr); sm.box(12, 13 + k, 0, 13, 14 + k, 1, fr); sm.box(12, 11 - k, 0, 13, 12 - k, 1, fr); }
      sm.box(16, 13, 0, 25, 16, 1, cv); sm.box(0, 9, 0, 9, 12, 1, cv); sm.box(9, 16, 0, 12, 25, 1, cv); sm.box(13, 0, 0, 16, 9, 1, cv); sm.box(11, 11, 0, 14, 14, 1, hub);
      const sg = AF.meshModel(sm, { vs: 1 / 10, anchor: [0.5, 0.5, 0.5] });
      for (const q of D.spin) { const m = AF.modelMesh(sg); m.position.set(q.x, q.y, q.z); AF.scene.add(m); spins.push(m); }
    }
    const birds = [];
    {
      const gy = AF.col(0x8a8f99, { jitter: 0.2 }), dk = AF.col(0x55596a, { jitter: 0.1 }), wt = AF.col(0xdcdce0);
      const frame = (wy) => { const m = new AF.Model(9, 3, 6); m.box(3, 0, 1, 6, 2, 5, gy); m.box(3, 1, 5, 6, 2, 6, dk); m.box(4, 0, 0, 5, 1, 1, dk); m.box(0, wy, 2, 3, wy + 1, 4, gy); m.box(6, wy, 2, 9, wy + 1, 4, gy); m.set(0, wy, 2, wt); m.set(8, wy, 2, wt); return AF.meshModel(m, { vs: 1 / 6, anchor: [0.5, 0.5, 0.5] }); };
      const fg = [frame(2), frame(1), frame(0)];
      for (let i = 0; i < 18; i++) {
        const m = AF.modelMesh(fg[1]); AF.scene.add(m);
        birds.push({ m, a0: i * 0.35 + AF.hash2(i, 3) * 0.3, w: 0.3 + AF.hash2(i, 5) * 0.06, r: 14 + AF.hash2(i, 9) * 6, y: 108 + AF.hash2(i, 11) * 12, ph: AF.hash2(i, 13) * 10 });
      }
      D._birdGeo = fg;
    }
    D.flagMeshes = flagMeshes; D.lightMeshes = lm; D.wash = wash; D.hands = hands; D.spins = spins; D.birds = birds;
    AF.onTick('downtown-dyn', 330, (dt, t) => {
      const cam = AF.camera && AF.camera.position;
      for (let i = 0; i < flagMeshes.length; i++) {
        const m = flagMeshes[i], f = D.flags[i]; if (cam && Math.abs(cam.x - m.position.x) + Math.abs(cam.z - m.position.z) + Math.abs(cam.y - m.position.y) > 320) continue;
        m.rotation.y = f.yaw0 + Math.sin(t * 0.4 + i) * 0.12;
        const pos = m.geometry.attributes.position, a = pos.array, b0 = flagBase[i], L = f.len;
        for (let v = 0; v < a.length; v += 3) { const x = b0[v], k = x / L; a[v + 2] = b0[v + 2] + Math.sin(x * 2.4 - t * 5.5 + i) * 0.16 * L * 0.5 * k; a[v + 1] = b0[v + 1] - k * k * 0.08 * L; }
        pos.needsUpdate = true;
      }
      const on = (t % 1.6) < 0.8; for (const s of lm) s.visible = on;
      for (const m of spins) m.rotation.z = -t * 0.9;
      if (birds.length) {
        const fg = D._birdGeo, cx = 109, cz = -125.5;
        for (let i = 0; i < birds.length; i++) {
          const b = birds[i], a = b.a0 + t * b.w, r = b.r + Math.sin(t * 0.31 + i) * 2.5, m = b.m;
          m.position.set(cx + Math.sin(a) * r, b.y + Math.sin(t * 0.45 + i * 1.3) * 3, cz + Math.cos(a) * r);
          m.rotation.set(0, Math.atan2(Math.cos(a), -Math.sin(a)), -0.35);
          const fl = ((t + b.ph) % 5) < 2.2; m.geometry = fl ? fg[((t * 9 + i) | 0) % 3] : fg[1];
        }
      }
      if (wash) {
        const w = wash.w, T = 90, ph = (t % T) / T, u = ph < 0.8 ? ph / 0.8 : 1 - (ph - 0.8) / 0.2;   // slow descent, quicker winch up
        const y = w.y1 - (w.y1 - w.y0) * u; wash.plat.position.y = y;
        for (const r of wash.ropes) { r.position.y = y + 1.8; r.scale.y = Math.max(0.1, w.y1 + 1.5 - y - 1.8); }
      }
      if (hands.length) {
        const hr = (AF.time && AF.time.hours) || 0, ha = -((hr % 12) / 12) * Math.PI * 2, ma = -((hr % 1)) * Math.PI * 2;
        for (const [h, mn] of hands) { h.rotation.z = ha; mn.rotation.z = ma; }
      }
    });
  });

  AF.test('downtown: 10 towers, Solace Tower >= 120 m, mast set', () => {
    const s = D.towers.find((q) => q.name === 'Solace Tower');
    const ok = D.towers.length >= 10 && !!s && s.h >= 120 && !!AF.solaceMast && AF.solaceMast.y >= 120 && AF.solaceMast.y < 160 && !!AF.solidAt(109, 130, -125.5) && !AF.solidAt(109, 150, -125.5);
    return { ok, info: D.towers.length + ' towers, Solace ' + (s && s.h) + ' m, mast y ' + (AF.solaceMast && AF.solaceMast.y) + ', heights ' + D.towers.map((q) => q.h).join('/') };
  });
}

} catch (e) { AF.partError('20-downtown.js', e); }

