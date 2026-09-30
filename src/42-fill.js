// ================================================================ 42-fill.js
try {
// ===== 42-fill: CITY FABRIC at the map edges — exterior-only solid buildings with carved windows  (OWNER: residential) =====
// Lots with fill:true. Solid fills (only the surface costs), 1-block window recesses on street faces, painted windows elsewhere,
// cornices, parapets, water tanks, fire escapes, shopfronts with awnings (closed doors). Not registered as buildings.
{
const q = (v) => Math.round(v * 4) / 4;
const SH = 3.5;

const SHOPNAMES = ['DRUGS', 'HARDWARE', 'LUNCHEONETTE', 'SHOES', 'FLORIST', 'CIGARS', 'BAKERY', 'GROCERIES', 'RADIO REPAIR', 'PHARMACY', 'HATS', 'DELICATESSEN', 'PAWN', 'BOOKS', 'NOTIONS', 'FURNITURE', 'CAFE', 'TAVERN', 'BUTCHER', 'SHOE REPAIR', 'STATIONERY', 'LAUNDRY', 'FISH', 'TOYS', 'JEWELER', 'DRY GOODS', 'PAINTS', 'BARBER', 'CANDY', 'LOANS'];
const ext = (H, S) => {
  const RK = AF.resKit, C = RK.colours(), G = RK.geos(), h = RK.hash;
  const W = H.W, D = S.D, n = S.n, top = 0.5 + n * SH, sd = S.seed;
  const brick = S.brick, trim = S.trim, corn = S.cornice;
  const fd0 = S.fd || D;
  H.fill(0, 0.25, 0, W, top, fd0, brick.a);
  H.fill(0, 0.25, 0, W, 0.75, 0.25, S.base || C.stone[3]);
  if (S.lux) H.fill(0, 0.25, 0, W, 0.5 + SH, 0.25, C.stone[0]);                   // limestone base storey
  H.fill(0, 0.5 + SH - 0.25, -0.25, W, 0.5 + SH, 0.25, trim);
  if (n > 5) H.fill(0, 0.5 + (n - 1) * SH - 0.25, -0.25, W, 0.5 + (n - 1) * SH, 0.25, trim);
  // roof: flat tar with parapet + cornice, or a slate/copper mansard with dormers, or a terracotta hip (v2 mixed skyline)
  const rk = S.roof || 'tar', fd = S.fd || D;
  if (rk === 'tar' || rk === 'monitor' || rk === 'garden') {
    H.fill(0.25, top - 0.25, 0.25, W - 0.25, top, fd - 0.25, C.roofs[sd % C.roofs.length]);
    const cop = C.copings[sd % 4];
    H.fill(0, top, 0, W, top + 0.75, 0.25, brick.b); H.fill(0, top + 0.75, -0.25, W, top + 1.0, 0.5, cop);
    H.fill(0, top, fd - 0.25, W, top + 0.5, fd, brick.b); H.fill(0, top, 0, 0.25, top + 0.5, fd, brick.b); H.fill(W - 0.25, top, 0, W, top + 0.5, fd, brick.b);
  } else RK.roofCap(H, 0, W, 0, fd, top, rk, sd);
  if (sd % 3 === 0) { H.fill(0, top - 0.5, -0.5, W, top, 0, corn); for (let u = 0.25; u < W; u += 1) H.fill(u, top - 1.0, -0.25, u + 0.25, top - 0.5, 0, corn); }
  else if (sd % 3 === 1) { H.fill(0, top - 0.25, -0.5, W, top, 0, corn); H.fill(0, top - 0.5, -0.25, W, top - 0.25, 0, corn); }
  else { H.fill(0, top - 0.5, -0.25, W, top, 0, corn); if (rk === 'tar') for (let u = 0.75; u < W - 0.5; u += 2) H.fill(u, top + 0.25, -0.25, u + 0.5, top + 1.25, 0, corn); }
  // the back range steps down toward the map edge (or leaves a courtyard with washing)
  if (S.back2) {
    const B2 = S.back2, t2 = 0.5 + B2.n * SH;
    if (B2.court) {
      H.ground(0.25, fd, W - 0.25, B2.v1, 1, C.paving);
      if (B2.v1 - fd >= 6 && W >= 8) { const c = H.w(W / 2, (fd + B2.v1) / 2), along = (H.face === 'n' || H.face === 's') ? 1 : 0; AF.res && AF.res.laundryLine && AF.res.laundryLine(c[0], 0.5 + SH * 1.2, c[1], along ? 0 : 1, sd); }
    } else {
      H.fill(0, 0.25, fd, W, t2, B2.v1, brick.b);
      H.fill(0.25, t2 - 0.25, fd + 0.25, W - 0.25, t2, B2.v1 - 0.25, C.roofs[(sd + 2) % C.roofs.length]);
      H.fill(0, t2, B2.v1 - 0.25, W, t2 + 0.5, B2.v1, brick.a); H.fill(0, t2, fd, 0.25, t2 + 0.5, B2.v1, brick.a); H.fill(W - 0.25, t2, fd, W, t2 + 0.5, B2.v1, brick.a);
      for (let s2 = 1; s2 < B2.n; s2++) for (let u = 1; u < W - 1; u += 2.5) H.fill(u, 0.5 + s2 * SH + 0.75, fd - 0.25 < 0 ? 0 : fd - 0.0, u + 1, 0.5 + s2 * SH + 2.5, fd + 0.25, C.win[Math.floor(h(sd, s2, u + 40) * 5)]);
      for (let s2 = 1; s2 < B2.n; s2++) for (let u = 1; u < W - 1; u += 2.5) H.fill(u, 0.5 + s2 * SH + 0.75, B2.v1 - 0.25, u + 1, 0.5 + s2 * SH + 2.5, B2.v1, C.win[Math.floor(h(sd, s2, u + 60) * 5)]);
      if (sd % 2) H.place(RK.geos().waterTank, q(W * 0.4), t2, B2.v1 - 3, 0, { collide: false });
      else { const pl = AF.col(0x8a5a3a, { jitter: 0.3 }), gr = AF.col(0x5f8a3e, { jitter: 0.9, edge: 0.2, solid: false }); for (let u = 1; u < W - 2; u += 2.5) { H.fill(u, t2, B2.v1 - 1.75, u + 1.5, t2 + 0.5, B2.v1 - 0.75, pl); H.fill(u, t2 + 0.5, B2.v1 - 1.75, u + 1.5, t2 + 1.0, B2.v1 - 0.75, gr); } }
    }
    if (B2.edge) { const t3 = 0.5 + B2.edge * SH; H.fill(0, 0.25, B2.v1, W, t3, D, brick.a); H.fill(0.25, t3 - 0.25, B2.v1 + 0.25, W - 0.25, t3, D - 0.25, C.roofs[(sd + 4) % C.roofs.length]); H.fill(0, t3, D - 0.25, W, t3 + 0.5, D, brick.b);
      for (let u = 1; u < W - 1; u += 2.5) H.fill(u, 0.5 + SH + 0.75, D - 0.25, u + 1, 0.5 + SH + 2.5, D, C.win[Math.floor(h(sd, u, 90) * 5)]); }
  }
  // front windows: recessed. Piers every other column for the lux buildings
  const bw = S.lux ? 2.0 : 1.75, nb = Math.max(1, Math.floor((W - 0.5) / bw)), off = (W - nb * bw) / 2;
  for (let s = 1; s < n; s++) {
    const f0 = 0.5 + s * SH;
    for (let b = 0; b < nb; b++) {
      const u0 = q(off + b * bw + (bw - 1.0) / 2);
      H.fill(u0, f0 + 0.75, 0, u0 + 1.0, f0 + 2.75, 0.25, 0);
      H.fill(u0, f0 + 0.75, 0.25, u0 + 1.0, f0 + 2.75, 0.5, C.win[Math.floor(h(sd, s, b) * 5)]);
      if (b % 2 === 0 || !S.lux) H.fill(u0 - 0.25, f0 + 0.5, -0.25, u0 + 1.25, f0 + 0.75, 0, trim);
    }
    if (S.lux) for (let b = 0; b <= nb; b += 2) H.fill(q(off + b * bw) - 0.25, 0.5 + SH, -0.25, q(off + b * bw), top - 0.5, 0, trim);
  }
  // ground floor: shopfront (lit display glass + awning + closed door) or a residential entrance with a canopy
  if (S.shop) {
    const nS = W >= 14 ? 2 : 1, sw = W / nS;
    for (let k = 0; k < nS; k++) {
      const ss = sd * 3 + k, a0 = k * sw, name = SHOPNAMES[ss % SHOPNAMES.length], style = ss % 3;
      const dcu = a0 + (style === 0 ? sw / 2 : style === 1 ? 1.25 : sw - 1.25);
      const glass = C.shopWin, frame = [C.woodD, C.iron, C.cornice[ss % 5]][ss % 3];
      for (let u = a0 + 0.5; u < a0 + sw - 0.5; u += 0.25) { const door = Math.abs(u + 0.125 - dcu) < 0.75; H.fill(u, 0.75, 0, u + 0.25, 3.0, 0.25, 0); H.fill(u, door ? 0.5 : 0.75, 0.25, u + 0.25, 3.0, 0.5, door ? C.doors[ss % 6] : (Math.round(u * 4) % 8 === 0 ? frame : glass)); }
      H.fill(a0 + 0.25, 0.25, -0.25, a0 + sw - 0.25, 0.75, 0, frame);
      const bg = C.signBg[ss % 4];
      H.fill(a0 + 0.25, 3.0, -0.25, a0 + sw - 0.25, 3.75, 0, bg);
      if (name.length * 6 / 16 < sw - 0.5) H.place(RK.sign(name, ss % 2 ? C.gold : C.cream, bg), a0 + sw / 2, 3.0, -0.3, 0);
      if (style !== 2 || ss % 2) H.place(RK.awning(Math.min(sw - 0.75, 6), ss), a0 + sw / 2, 1.95, -0.25, 0);
      else { H.fill(dcu - 0.125, 4.0, -1.0, dcu + 0.125, 4.25, 0, C.iron); H.place(RK.sign(name.split(' ')[0], C.cream, C.signBg[(ss + 1) % 4]), dcu, 4.4, -0.6, 1); }
      H.fill(a0, 0.25, -0.25, a0 + 0.25, 3.75, 0, C.stone[ss % 2 ? 0 : 3]);
    }
  } else {
    const dc = W / 2;
    H.fill(dc - 0.75, 0.5, 0, dc + 0.75, 3.0, 0.25, 0); H.fill(dc - 0.75, 0.5, 0.25, dc + 0.75, 3.0, 0.5, C.doors[sd % 6]);
    H.fill(dc - 1.0, 0.25, -0.25, dc + 1.0, 0.5, 0, C.stone[3]);
    H.fill(dc - 1.25, 3.0, -1.5, dc + 1.25, 3.25, 0, S.lux ? C.cornice[1] : trim);                   // canopy
    if (S.lux) { H.fill(dc - 1.25, 0.25, -1.5, dc - 1.0, 3.0, -1.25, C.brass); H.fill(dc + 1.0, 0.25, -1.5, dc + 1.25, 3.0, -1.25, C.brass); }
    for (let u = 0.75; u < W - 0.75; u += 1.75) { if (Math.abs(u + 0.5 - dc) < 1.6) continue; H.fill(u, 1.0, 0, u + 1.0, 2.75, 0.25, 0); H.fill(u, 1.0, 0.25, u + 1.0, 2.75, 0.5, C.win[(sd + (u | 0)) % 5]); }
    if (S.lux) { const p = H.w(dc + 1.6, -0.6); AF.addSpot({ building: null, kind: 'stand', x: p[0], y: 0.25, z: p[1], yaw: H.yaw(0), doorman: true }); }
  }
  // painted windows on the back + exposed sides (cheap: colour only)
  if (S.back || fd < D) for (let s = 1; s < n; s++) for (let u = 1; u < W - 1; u += 2.5) H.fill(u, 0.5 + s * SH + 0.75, fd - 0.25, u + 1, 0.5 + s * SH + 2.5, fd, C.win[Math.floor(h(sd, s, u) * 5)]);
  for (const side of S.sides || []) {
    const us = side === 'L' ? 0 : W - 0.25;
    for (let s = 1; s < n; s++) for (let v = 1.5; v < fd - 1.5; v += 2.5) H.fill(us, 0.5 + s * SH + 0.75, v, us + 0.25, 0.5 + s * SH + 2.5, v + 1, C.win[Math.floor(h(sd, s, v) * 5)]);
  }
  // roof props
  if (S.tank && (rk === 'tar' || rk === 'monitor')) H.place(G.waterTank, q(W * (0.3 + h(sd, 7) * 0.4)), top, fd - 4, 0, { collide: false });
  if (sd % 4 === 1 && (rk === 'tar' || rk === 'garden')) { H.fill(1, top, fd - 6, 3.5, top + 2.75, fd - 3, brick.b); H.fill(0.75, top + 2.75, fd - 6.25, 3.75, top + 3.0, fd - 2.75, C.tar); }
  if (sd % 3 !== 0) for (const cu of [0.25, W - 1.0]) if (h(sd, cu) < 0.6) { const ct = rk === 'tar' || rk === 'monitor' || rk === 'garden' ? top : top + 2.0; H.fill(cu, top, 4, cu + 0.75, ct + 1.75, 4.75, brick.b); H.fill(cu, ct + 1.75, 4, cu + 0.75, ct + 2.0, 4.75, C.coping); if (sd % 5 === 1 && AF.addChimney) { const cp = H.w(cu + 0.375, 4.375); AF.addChimney(cp[0], ct + 2.2, cp[1]); } }
  if (rk === 'monitor') {   // north-light sawtooth monitors (only ~1 in 6 of the edge buildings)
    for (let v = 3; v < fd - 4; v += 4) { const u0 = q(W * 0.2), u1 = q(W * 0.8); H.fill(u0, top, v, u1, top + 0.5, v + 2.5, C.coping); H.fill(u0 + 0.25, top + 0.5, v + 0.25, u1 - 0.25, top + 1.0, v + 1.25, C.glass); H.fill(u0 + 0.25, top + 0.5, v + 1.25, u1 - 0.25, top + 1.5, v + 2.25, C.tar2); }
  }
  if (rk === 'garden') {
    const pl = AF.col(0x8a5a3a, { jitter: 0.3 }), gr = AF.col(0x5f8a3e, { jitter: 0.9, edge: 0.2, solid: false }), fl = AF.col(0xe86a8a, { jitter: 0.4, solid: false });
    for (let u = 1; u < W - 2; u += 2.5) { H.fill(u, top, 1.0, u + 1.5, top + 0.5, 1.75, pl); H.fill(u, top + 0.5, 1.0, u + 1.5, top + 1.0, 1.75, (u | 0) % 2 ? gr : fl); }
    for (const u of [2, W - 2.25]) H.fill(u, top, 3, u + 0.25, top + 2.5, 3.25, C.woodL); H.fill(2, top + 2.5, 3, W - 2, top + 2.75, 6, C.woodL);
    H.place(RK.sunbather(), W / 2, top, 7.5, 1);
  }
  if (S.billboard && (rk === 'tar' || rk === 'monitor') && W >= 10) {
    const ads = [['SOLACE COLA', 0xf4ecd4, 0xb8322a], ['HARBOUR COFFEE', 0xf0d890, 0x3a2418], ['BRIGHT WATER SOAP', 0x1a3a6a, 0xe8f0f4], ["DR. PELL'S TONIC", 0xf4e8c8, 0x2f5a3a], ['KEYSTONE PAINTS', 0xf0d040, 0x2a3a6a], ['COZY COAL', 0xf4ecd4, 0x3a3a3a], ['GULL SARDINES', 0x1a2a4a, 0xf0e0a0], ['LUCKY ANCHOR CIGARS', 0xe8c050, 0x6a1a1a]];
    const ad = ads[sd % ads.length], bw2 = Math.min(W - 2, ad[0].length * 0.75 + 1.5), bu = (W - bw2) / 2, by = top + 1.5;
    const bgC = AF.col(ad[2], { jitter: 0.12, edge: 0.1 }), fgC = AF.col(ad[1], { jitter: 0.05, edge: 0, emit: ad[1], emitK: 0.7, mode: 'night' });
    for (const u of [bu + 0.5, bu + bw2 - 0.75]) { H.fill(u, top, 3.0, u + 0.25, by + 3.0, 3.25, C.iron); H.fill(u, top, 4.5, u + 0.25, by, 4.75, C.iron); }
    H.fill(bu, by, 3.25, bu + bw2, by + 2.75, 3.5, bgC); H.fill(bu, by - 0.25, 3.0, bu + bw2, by, 3.75, C.iron);
    H.place(RK.signBig(ad[0], fgC, bgC), W / 2, by + 0.75, 3.25, 0);
    for (let u = bu + 1; u < bu + bw2; u += 2.5) { H.fill(u, by + 2.75, 2.75, u + 0.25, by + 3.0, 3.25, C.iron); }
    const lp = H.w(W / 2, 2.5); AF.addLight({ x: lp[0], y: by + 2.8, z: lp[1], color: 0xffe0a0, intensity: 0.8, range: 7, kind: 'sign' });
  }
  if (S.fe) H.place(RK.fireEscape(Math.min(n, 7), SH), W / 2, 0.5 + SH - 0.5, -1.25, 0);
  return top;
};

const lotFaces = (lot) => {
  const [x0, z0, x1, z1] = lot.rect, dp = 17;
  if (lot.id === 'fill-a') return [{ P: { x0, z0, x1, z1, face: 'e' }, D: x1 - x0, back: false }];
  if (lot.id === 'fill-h') return [{ P: { x0, z0, x1, z1, face: 'w' }, D: x1 - x0, back: false }];
  return [
    { P: { x0, z0, x1: x0 + dp, z1, face: 'w' }, D: dp },
    { P: { x0: x1 - dp, z0, x1, z1, face: 'e' }, D: dp },
    { P: { x0: x0 + dp, z0, x1: x1 - dp, z1: z0 + dp, face: 'n' }, D: dp },
    { P: { x0: x0 + dp, z0: z1 - dp, x1: x1 - dp, z1, face: 's' }, D: dp },
  ];
};

AF.onBuild('residential-fill', 302, () => {
  if (!AF.resKit || !AF.PLAN) return;
  const t0 = performance.now();
  const RK = AF.resKit, C = RK.colours(), h = RK.hash;
  const R = AF.rng(777);
  let seed = 1000, count = 0;
  for (const lot of AF.PLAN.lots.filter((l) => l.fill && l.owner === 'residential')) {
    const [x0, z0, x1, z1] = lot.rect;
    AF.W.ground(x0, z0, x1, z1, 1, C.paving);
    const lux = lot.id === 'fill-f1';
    for (const fc of lotFaces(lot)) {
      const F = RK.frame(fc.P);
      let u = 0;
      const edgeLot = lot.id === 'fill-a' || lot.id === 'fill-h';
      let prevN = -1;
      while (u < F.W - 0.1) {
        let w = q((lux ? 14 : edgeLot ? 8 : 9) + R() * (lux ? 8 : 10)); if (F.W - u - w < 8) w = F.W - u;
        const sd = seed++;
        const H = RK.sub(F, u, w, fc.D);
        // heights: 3..10 storeys on the edge strips (never two neighbours the same), 4..8 inside, lux 6..8
        let n = lux ? 6 + (sd % 3) : 4 + Math.floor(R() * 5);
        if (edgeLot) { const r = R(); n = r < 0.2 ? 3 : r < 0.45 ? 4 + Math.floor(R() * 2) : r < 0.8 ? 6 + Math.floor(R() * 2) : 8 + Math.floor(R() * 3); if (n === prevN) n = n > 5 ? n - 2 : n + 2; }
        prevN = n;
        const warehouse = edgeLot && n <= 4 && R() < 0.5;
        const brick = lux ? { a: C.stone[1], b: C.stone[0] } : warehouse ? C.bricks[1] : C.bricks[Math.floor(h(sd, 3) * C.bricks.length)];
        const first = u === 0, last = u + w >= F.W - 0.1;
        const rr = R();
        const roof = warehouse ? (rr < 0.5 ? 'monitor' : 'tar') : lux ? (rr < 0.35 ? 'copper' : rr < 0.6 ? 'mansard' : rr < 0.8 ? 'garden' : 'tar')
          : rr < 0.4 ? 'tar' : rr < 0.6 ? 'mansard' : rr < 0.75 ? 'hip' : rr < 0.83 ? 'copper' : rr < 0.93 ? 'garden' : 'monitor';
        const S = {
          D: fc.D, n: Math.min(n, 10), seed: sd, brick, trim: lux ? C.stone[3] : C.stone[sd % 2 ? 0 : 3], cornice: C.cornice[sd % 5], lux, roof,
          shop: !lux && (R() < 0.55), tank: R() < (lux ? 0.5 : 0.45), fe: !lux && n <= 7 && R() < 0.35, back: fc.back !== false && R() < 0.5, billboard: !lux && R() < 0.22,
          sides: [first ? 'L' : null, last ? 'R' : null].filter(Boolean),
        };
        if (edgeLot) {   // deep strips: front range 12-16 m, a lower back range or a courtyard, and a 2-3 storey edge range
          S.fd = q(12 + R() * 4);
          const court = R() < 0.4, v1 = q(S.fd + 9 + R() * 8);
          S.back2 = { court, n: Math.max(2, Math.min(n - 2, 3 + Math.floor(R() * 3))), v1: Math.min(v1, fc.D - 5), edge: 2 + Math.floor(R() * 2) };
          if (!court && R() < 0.3) S.back2.v1 = fc.D, S.back2.edge = 0;
        }
        ext(H, S);
        u += w; count++;
        // now and then a gap: an alley with an iron gate (the street wall breathes)
        if (edgeLot && !last && F.W - u > 14 && R() < 0.22) {
          const gw = q(3 + R() * 2), G2 = RK.sub(F, u, gw, fc.D);
          G2.ground(0, 0, gw, fc.D, 1, C.cobble);
          for (let gu = 0; gu < gw; gu += 0.5) G2.fill(gu, 0.25, 0.5, gu + 0.25, 2.25, 0.75, C.iron); G2.fill(0, 2.25, 0.5, gw, 2.5, 0.75, C.iron);
          if (AF.res && AF.res.laundryLine) { const c = G2.w(gw / 2, 6); AF.res.laundryLine(c[0], 7.5, c[1], (G2.face === 'n' || G2.face === 's') ? 0 : 1, sd + 7, 0, true); }
          u += gw;
        }
      }
    }
    // inner courtyard of the square fill blocks: a low parking garage / yard
    if (lot.id !== 'fill-a' && lot.id !== 'fill-h') {
      const ix0 = x0 + 17, iz0 = z0 + 17, ix1 = x1 - 17, iz1 = z1 - 17;
      if (lot.id === 'fill-b1') {
        AF.W.fill(ix0, 0.25, iz0, ix1, 4.0, iz1, C.bricks[4].a); AF.W.fill(ix0 + 0.25, 3.75, iz0 + 0.25, ix1 - 0.25, 4.0, iz1 - 0.25, C.tar);
        AF.W.fill(ix0, 4.0, iz0, ix1, 4.75, iz0 + 0.25, C.coping);
      } else AF.W.paint(ix0, iz0, ix1, iz1, C.yard[0]);
    }
  }
  AF.res && (AF.res.fillCount = count, AF.res.fillMs = Math.round(performance.now() - t0));
});
AF.test('residential: fill blocks built', () => ({ ok: (AF.res && AF.res.fillCount > 30), info: (AF.res && AF.res.fillCount) + ' fill buildings, ' + (AF.res && AF.res.fillMs) + ' ms' }));
}

} catch (e) { AF.partError('42-fill.js', e); }

