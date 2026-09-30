// ================================================================ 41-homes-2.js
try {
// ===== 41-homes-2: OLD TOWN + EASTSIDE — the rowhouse generator, 8 residential blocks, shops, Engine Co. 7, church, Mariner Court  (OWNER: residential) =====
// Uses AF.resKit from 40-homes.js. Every block is a ring of parcels 16 m deep, shoulder to shoulder, flush to the sidewalk
// (brownstones step back 3 m behind an areaway + stoop), with back yards / laundry / sheds / gardens in the middle.
{
const SH = 3.75;          // storey height
const RD = 16;            // ring depth (parcel depth) of every block
AF.res = { homes: [], shops: [], stoops: [], lines: [], bay: null, doors: [], coops: [], poles: [], alleys: [], ghosts: [], fans: [] };

// mirror frame (layout is authored for "door on the right"; mirrored for door-on-left)
const mirror = (H, on) => on ? {
  W: H.W, face: H.face,
  fill(u0, y0, v0, u1, y1, v1, c) { H.fill(H.W - u1, y0, v0, H.W - u0, y1, v1, c); },
  place(geo, u, y, v, k = 0, o) { H.place(geo, H.W - u, y, v, (k === 1 ? 3 : k === 3 ? 1 : k), o); },
  w(u, v) { return H.w(H.W - u, v); },
  yaw(k) { return H.yaw(k === 1 ? 3 : k === 3 ? 1 : k); },
} : H;

// ============================================================ THE HOUSE
// S: {type:'brown'|'row'|'ten', n, brick, trim, cornice, door, enter, stair, shop:{name,kind,awn}, seed, side:'L'|'R'|null, doorLeft, name}
const house = (H, S) => {
  const RK = AF.resKit, C = RK.colours(), G = RK.geos(), h = RK.hash;
  const W = H.W, sd = S.seed;
  const brown = S.type === 'brown';
  const sb = brown ? 3 : 0, D = brown ? RD : 13, fy = brown ? 1.5 : 0.5;
  const n = S.n, top = fy + n * SH;
  const brick = S.brick, trim = S.trim, corn = S.cornice;
  const hollow0 = !!S.enter, hollow1 = !!(S.enter && S.stair);
  const info = { top, sb, D, fy };
  // ---- body
  H.fill(0, 0.25, sb, W, top, D, brick.a);
  if (brown) H.fill(0, 0.25, sb, W, fy + 0.25, sb + 0.25, C.stone[2]);                  // rusticated basement
  else H.fill(0, 0.25, sb, W, 0.75, sb + 0.25, C.stone[3]);                              // water table
  for (let s = 1; s < n; s++) H.fill(0, fy + s * SH - 0.25, sb - 0.25, W, fy + s * SH, sb + 0.25, s === 1 && !brown ? trim : brick.b);   // belt courses
  // side walls of corner houses get a quoin strip
  // ---- roof: tar, parapet, coping, cornice + brackets + frieze
  const rfi = Math.floor(h(sd, 61) * C.roofs.length), rfC = C.roofs[rfi], cop = C.copings[Math.floor(h(sd, 62) * C.copings.length)];
  H.fill(0.25, top - 0.25, sb + 0.25, W - 0.25, top, D - 0.25, rfC);
  H.fill(0, top, sb, W, top + 0.75, sb + 0.25, brick.a); H.fill(0, top + 0.75, sb - 0.25, W, top + 1.0, sb + 0.5, cop);
  H.fill(0, top, D - 0.25, W, top + 0.5, D, brick.b); H.fill(0, top + 0.5, D - 0.25, W, top + 0.75, D, cop);
  H.fill(0, top, sb, 0.25, top + 0.5, D, brick.b); H.fill(W - 0.25, top, sb, W, top + 0.5, D, brick.b);
  H.fill(0, top + 0.5, sb, 0.25, top + 0.75, D, cop); H.fill(W - 0.25, top + 0.5, sb, W, top + 0.75, D, cop);
  // tar-paper patchwork (strips of different ages) on the tar roofs only; gravel/silver/oxide/felt roofs get a few patches
  if (rfi === 0 || rfi === 5) { for (let v = sb + 0.25, i = 0; v < D - 0.25; v += 1.5 + ((sd + i) % 3) * 0.75, i++) if ((sd + i) % 3 !== 0) H.fill(0.25, top - 0.25, v, W - 0.25, top, Math.min(D - 0.25, v + 0.75 + ((sd * i) % 2) * 0.5), [C.tar3, C.tar4, C.tar2, C.tar][(sd + i) % 4]); }
  else if (sd % 3 === 0) H.fill(q(W * 0.3), top - 0.25, sb + 3, q(W * 0.3) + 1.5, top, sb + 4.25, C.tar4);
  const cs = S.corniceStyle ?? (sd % 3);
  if (cs === 0) {      // bracketed tin cornice
    H.fill(0, top - 0.5, sb - 0.5, W, top, sb, corn); H.fill(0, top - 0.75, sb - 0.25, W, top - 0.5, sb, corn);
    for (let u = 0.25; u < W - 0.2; u += 1.0) H.fill(u, top - 1.25, sb - 0.5, u + 0.25, top - 0.5, sb, corn);
    H.fill(0, top - 1.5, sb - 0.25, W, top - 1.25, sb, trim);
  } else if (cs === 1) {   // stepped stone cornice with dentils
    H.fill(0, top - 0.25, sb - 0.75, W, top, sb, corn); H.fill(0, top - 0.5, sb - 0.5, W, top - 0.25, sb, corn);
    for (let u = 0; u < W; u += 0.5) H.fill(u, top - 0.75, sb - 0.25, u + 0.25, top - 0.5, sb, corn);
  } else {                 // deco: flat band + chevrons in the parapet
    H.fill(0, top - 0.5, sb - 0.25, W, top, sb, corn);
    for (let u = 0.5; u < W - 0.5; u += 1.5) { H.fill(u, top + 0.25, sb - 0.25, u + 0.5, top + 0.5, sb, corn); H.fill(u + 0.25, top + 0.5, sb - 0.25, u + 0.5, top + 0.75, sb, corn); }
  }
  // downspout
  H.fill(W - 0.25, 0.25, sb - 0.25, W, top, sb, C.iron);
  // ---- interior shells (before windows so the windows cut through them)
  const spp = S.shop && C.shopPaper[S.shop.kind];
  const pal = spp ? { paper: AF.col(spp[0], { jitter: 0.12, edge: 0.1 }), wains: AF.col(spp[1], { jitter: 0.2, edge: 0.3 }) } : C.paper[sd % C.paper.length], pal2 = C.paper[(sd + 3) % C.paper.length];
  const shell = (f0, P) => {
    H.fill(0.25, f0, sb + 0.25, W - 0.25, f0 + 3.25, D - 0.25, P.paper);
    H.fill(0.25, f0, sb + 0.25, W - 0.25, f0 + 0.75, D - 0.25, P.wains);
    H.fill(0.5, f0, sb + 0.5, W - 0.5, f0 + 3.25, D - 0.5, 0);
    H.fill(0.5, f0 + 3.25, sb + 0.5, W - 0.5, f0 + 3.5, D - 0.5, spp ? AF.col(0xe6dcc0, { pat: 'panel', patTop: 'panel', rough: 0.45 }) : C.ceil);
    for (const [a, b, c2, d2] of [[0.5, sb + 0.5, W - 0.5, sb + 0.75], [0.5, D - 0.75, W - 0.5, D - 0.5], [0.5, sb + 0.5, 0.75, D - 0.5], [W - 0.75, sb + 0.5, W - 0.5, D - 0.5]]) H.fill(a, f0 + 3.0, b, c2, f0 + 3.25, d2, spp ? C.woodD : C.moulding);   // crown moulding / cove
    const fl = C.floors[sd % 3];
    for (let u = 0.5, i = 0; u < W - 0.5; u += 0.5, i++) H.fill(u, f0 - 0.25, sb + 0.5, Math.min(W - 0.5, u + 0.5), f0, D - 0.5, fl[i & 1]);
  };
  if (hollow0) shell(fy, pal);
  if (hollow1) shell(fy + SH, pal2);
  // ---- windows (front)
  const nb = W >= 7.5 ? 3 : 2, bw = W / nb;
  const doorBay = S.doorLeft ? 0 : nb - 1;
  const dc = (doorBay + 0.5) * bw;
  const isShop = !!S.shop;
  const sashF = Math.floor(h(sd, 63) * 4), leanAt = h(sd, 64) < 0.34 ? 8 * (1 + Math.floor(h(sd, 65) * 2)) + Math.floor(h(sd, 66) * nb) : -1;
  for (let s = 0; s < n; s++) {
    const f0 = fy + s * SH;
    const hol = (s === 0 && hollow0) || (s === 1 && hollow1);
    for (let b = 0; b < nb; b++) {
      if (s === 0 && (b === doorBay || isShop)) continue;
      const ww = bw >= 2.75 ? 1.5 : 1.25, u0 = q((b + 0.5) * bw - ww / 2);
      const y0 = f0 + (s === 0 && brown ? 0.5 : 0.75), wh = s === 0 && brown ? 2.5 : (s === n - 1 ? 1.75 : 2.0);
      const wi = Math.floor(h(sd, s, b) * 5), lean = !hol && s >= 1 && s <= 2 && leanAt === s * 8 + b;
      const pane = hol ? (S.dark ? C.darkGlass : C.litGlass) : lean ? C.win[2] : C.win[wi];
      RK.windowAt(H, u0, y0, ww, wh, sb, pane, C.stone[brown ? 2 : 0], trim, { mullion: pane });
      if (lean) H.place(RK.leaners()[(sd + s) % 6], u0 + ww / 2, y0, sb + 0.2, 0);
      else { const r = h(sd, b, s + 9), shd = hol ? (r < 0.3 ? 4 : 0) : r < 0.42 ? [1, 2, 3, 5][Math.floor(r * 9.5) % 4] : r < 0.6 ? 4 : 0;
        H.place(RK.sash(ww, wh, sashF, shd, !hol && (wi === 0 || wi === 1) || (hol && !S.dark)), u0 + ww / 2, y0, sb + 0.22, 0); }
      if (brown) H.fill(u0 + ww / 2 - 0.125, y0 + wh + 0.25, sb - 0.25, u0 + ww / 2 + 0.125, y0 + wh + 0.5, sb, trim);   // keystone
      if (s >= 1 && h(sd, b, s) < 0.28) H.place(G.windowBox[(sd + b + s) % 3], u0 + ww / 2, y0, sb - 0.25, 0);
    }
  }
  // little awnings over some ground-floor windows
  if (!brown && !isShop && h(sd, 51) < 0.4) for (let b = 0; b < nb; b++) { if (b === doorBay) continue; H.place(RK.awning(1.75, sd + b), (b + 0.5) * bw, fy + 2.35, sb - 0.25, 0); }
  // brownstone basement windows (under the parlour)
  if (brown) for (let b = 0; b < nb; b++) if (b !== doorBay) { const u0 = q((b + 0.5) * bw - 0.5); H.fill(u0, 0.5, sb, u0 + 1, 1.25, sb + 0.25, 0); H.fill(u0, 0.5, sb + 0.25, u0 + 1, 1.25, sb + 0.5, C.win[2]); }
  // painted ghost-sign advert on the blank side wall of some corner houses (upper storeys)
  const ghost = S.side && n >= 3 && h(sd, 52) < 0.55;
  if (ghost) {
    const ads = [['SOLACE', 'COLA'], ['BRIGHT', 'WATER', 'SOAP'], ['MERIDIAN', 'STORES'], ['HARBOUR', 'COFFEE'], ['LANTERN', 'TOBACCO'], ['DRINK', 'SOLACE', 'COLA']];
    let ad = ads[Math.floor(h(sd, 53) * ads.length) % ads.length];
    const bgs = [0x7a4a3a, 0x3a4a5a, 0x5a3a2a, 0x3a5a4a], fgs = [0xe8dcc0, 0xe0c890, 0xf0e4c8];
    const bgC = AF.col(bgs[sd % 4], { jitter: 0.35, edge: 0.3 }), fgC = AF.col(fgs[sd % 3], { jitter: 0.4, edge: 0.2 }), acc = AF.col(0xc86a4a, { jitter: 0.35 });
    const us = S.side === 'L' ? 0 : W - 0.25, L0 = sb + 0.75, L1 = D - 0.75, y0 = fy + SH + 0.5, y1 = top - 0.75;
    H.fill(us, y0, L0, us + 0.25, y1, L1, bgC);
    const wpx = Math.round((L1 - L0) * 4), hpx = Math.round((y1 - y0) * 4);
    if (ad.length * 9 + 4 > hpx || ad.some((l) => l.length * 5 + (l.length > 7 ? 0 : l.length - 1) > wpx)) ad = ads[0];
    const put = (px, py, c) => { if (px < 0 || py < 0 || px >= wpx || py >= hpx) return; const v = S.side === 'L' ? L1 - (px + 1) * 0.25 : L0 + px * 0.25; H.fill(us, y0 + py * 0.25, v, us + 0.25, y0 + py * 0.25 + 0.25, v + 0.25, c); };
    ad.forEach((line, li) => {
      const m = AF.textModel(line, 1, { pad: 0, spacing: line.length > 7 ? 0 : 1 }), lw = m.w, off = Math.floor((wpx - lw) / 2), baseY = hpx - 3 - (li + 1) * 9;
      for (let x = 0; x < m.w; x++) for (let y = 0; y < m.h; y++) if (m.get(x, y, 0)) put(off + x, baseY + y, li ? acc : fgC);
    });
    for (let px = 1; px < wpx - 1; px++) { put(px, 1, fgC); put(px, hpx - 2, fgC); }
    AF.res.ghosts.push({ p: H.w(us, (L0 + L1) / 2), out: H.w(S.side === 'L' ? -14 : W + 14, (L0 + L1) / 2 - 6), y: (y0 + y1) / 2, ad: ad.join(' ') });
  }
  // corner house: windows on the exposed side
  if (S.side) {
    const us = S.side === 'L' ? 0 : W - 0.25;
    for (let s = 0; s < n; s++) {
      const f0 = fy + s * SH;
      if (ghost && s >= 1) continue;
      for (let v = sb + 1.5; v < D - 1.5; v += 3) {
        const pane = C.win[Math.floor(h(sd, s, v * 4) * 5)];
        if (S.side === 'L') { H.fill(0, f0 + 0.75, v, 0.25, f0 + 2.75, v + 1.25, 0); H.fill(0.25, f0 + 0.75, v, 0.5, f0 + 2.75, v + 1.25, (s === 0 && hollow0) || (s === 1 && hollow1) ? C.litGlass : pane); H.fill(-0.25, f0 + 0.5, v - 0.25, 0.25, f0 + 0.75, v + 1.5, C.stone[0]); }
        else { H.fill(W - 0.25, f0 + 0.75, v, W, f0 + 2.75, v + 1.25, 0); H.fill(W - 0.5, f0 + 0.75, v, W - 0.25, f0 + 2.75, v + 1.25, (s === 0 && hollow0) || (s === 1 && hollow1) ? C.litGlass : pane); H.fill(W - 0.25, f0 + 0.5, v - 0.25, W + 0.25, f0 + 0.75, v + 1.5, C.stone[0]); }
      }
      H.fill(us, 0.25, sb, us + 0.25, top, sb + 0.25, trim);   // quoin
    }
  }
  // back windows
  for (let s = 0; s < n; s++) {
    const f0 = fy + s * SH, hol = (s === 0 && hollow0) || (s === 1 && hollow1);
    for (let b = 0; b < 2; b++) {
      if (hol && s === 0) continue;   // kitchen back wall carries the sink + shelves
      const u0 = q((b + 0.5) * W / 2 - 0.5);
      if (hol && S.stair && b === (S.doorLeft ? 0 : 1)) continue;   // stair side
      H.fill(u0, f0 + 0.75, D - 0.25, u0 + 1, f0 + 2.5, D, 0); H.fill(u0, f0 + 0.75, D - 0.5, u0 + 1, f0 + 2.5, D - 0.25, hol ? (S.dark ? C.darkGlass : C.litGlass) : C.win[Math.floor(h(sd, s, b + 5) * 5)]);
      H.fill(u0 - 0.25, f0 + 0.5, D - 0.25, u0 + 1.25, f0 + 0.75, D + 0.25, C.stone[3]);
    }
  }
  // ---- door + surround
  const doorC = S.door;
  H.fill(dc - 0.75, fy, sb, dc + 0.75, fy + 2.5, sb + 0.25, 0);
  if (hollow0) H.fill(dc - 0.75, fy, sb + 0.25, dc + 0.75, fy + 2.5, sb + 0.5, 0);
  else H.fill(dc - 0.75, fy, sb + 0.25, dc + 0.75, fy + 2.5, sb + 0.5, doorC);
  H.fill(dc - 0.75, fy + 2.5, sb, dc + 0.75, fy + 3.0, sb + 0.25, 0); H.fill(dc - 0.75, fy + 2.5, sb + 0.25, dc + 0.75, fy + 3.0, sb + 0.5, C.litGlass);  // transom
  H.fill(dc - 1.0, fy, sb - 0.25, dc - 0.75, fy + 3.0, sb, trim); H.fill(dc + 0.75, fy, sb - 0.25, dc + 1.0, fy + 3.0, sb, trim);
  H.fill(dc - 1.25, fy + 3.0, sb - 0.5, dc + 1.25, fy + 3.25, sb, trim); if (brown || sd % 2) H.fill(dc - 1.0, fy + 3.25, sb - 0.25, dc + 1.0, fy + 3.5, sb, trim);
  if (hollow0) H.fill(dc + 0.75, fy, sb + 0.5, dc + 1.0, fy + 2.5, sb + 1.75, doorC);   // leaf standing open
  else if (RK.door) H.place(RK.door(doorC), dc, fy, sb + 0.25, 0);                       // v3 four-panel door with brass
  if (RK.fanlight) H.place(RK.fanlight(S.num || (10 + (sd * 7) % 180), trim), dc, fy + 2.5, sb + 0.24, 0);
  // ---- stoop (brownstones) or step
  if (brown) {
    const st = C.stone[2], stL = C.stone[1];
    for (let i = 1; i <= 5; i++) H.fill(dc - 0.875, 0.25, (i - 1) * 0.5, dc + 0.875, 0.25 + 0.25 * i, sb, i % 2 ? st : C.brownstone2.a);
    for (const cu of [dc - 1.125, dc + 0.875]) {
      for (let i = 1; i <= 5; i++) H.fill(cu, 0.25, (i - 1) * 0.5, cu + 0.25, 0.25 + 0.25 * i + 0.25, i === 5 ? sb : i * 0.5, st);   // v3 low cheek
      if (RK.stoopRail) H.place(RK.stoopRail(), cu + 0.125, 0.75, 0.0, 2);                                                      // + iron railing with a scroll newel
    }
    // areaway: paving + iron railings
    H.ground(0, 0, W, sb, 1, C.paving);
    for (let u = 0.25; u < W; u += 0.75) { if (u > dc - 1.4 && u < dc + 1.2) continue; H.fill(u, 0.25, 0, u + 0.25, 0.75, 0.25, C.iron); H.fill(u, 0.75, 0, u + 0.25, 1.0, 0.25, C.coping); }
    H.fill(0, 0.5, 0, dc - 1.125, 0.75, 0.25, C.iron); H.fill(dc + 1.125, 0.5, 0, W, 0.75, 0.25, C.iron);
    // trash can + milk bottles
    if (sd % 3 === 0) H.place(G.trash, dc - 1.8 > 0.5 ? dc - 1.8 : dc + 1.6, 0.25, 1.2, 0, { collide: true });
    if (sd % 3 !== 2) H.place(G.milk, dc + 0.5, fy, sb - 0.3, 0);
    if (sd % 2 === 1) { H.place(G.flowerPots, dc - 1.0, 2.25, 2.6, 0); }
    if (sd % 5 === 3) H.place(G.scooter, S.doorLeft ? dc + 1.6 : dc - 1.7, 0.25, 1.4, 1);
    if (sd % 4 === 2) AF.addSpot({ building: null, kind: 'cat', x: H.w(dc + 1.0, 2.6)[0], y: 2.25, z: H.w(dc + 1.0, 2.6)[1], yaw: H.yaw(0) });
    { const A = RK.autumn(); if (h(sd, 67) < 0.75) H.place(A[Math.floor(h(sd, 68) * 6)], dc + 0.5, 0.25 + 0.25 * 3, 1.25, 0); if (h(sd, 69) < 0.55) H.place(A[Math.floor(h(sd, 70) * 6)], dc - 0.5, 0.25 + 0.25 * 5, 2.2, 0); }
    const sw = H.w(dc, -0.9);
    AF.res.stoops.push({ p: H.w(dc - 0.35, 1.25), y: 1.0, yaw: H.yaw(0), path: [sw] });
    if (sd % 2 === 0) AF.res.stoops.push({ p: H.w(dc + 0.4, 0.75), y: 0.75, yaw: H.yaw(0), path: [sw] });
  } else {
    // small stone step + boot scraper inside the reveal
    H.fill(dc - 1.0, 0.25, -0.0, dc + 1.0, 0.5, 0.25, C.stone[3]);
    if (!isShop && sd % 3 === 1) AF.res.stoops.push({ p: H.w(dc - 0.5, 0.15), y: 0.5, yaw: H.yaw(0), path: [H.w(dc - 0.5, -0.9)] });
    if (!isShop && sd % 4 === 0) H.place(G.flowerPots, dc + 1.6, 0.25, -0.3, 0);
    else if (!isShop && h(sd, 67) < 0.55) H.place(RK.autumn()[Math.floor(h(sd, 68) * 6)], dc + (S.doorLeft ? 1.5 : -1.5), 0.25, -0.35, 0);
    if (sd % 5 === 2) H.place(G.milk, dc - 0.6, 0.5, 0.05, 0);
  }
  // bay window (brownstones without a furnished upper floor)
  if (brown && !hollow1 && n >= 3 && sd % 2 === 1) {
    const bu0 = q(S.doorLeft ? bw + 0.25 : 0.25), bu1 = q(S.doorLeft ? W - 0.25 : W - bw - 0.25);
    H.fill(bu0, fy + SH - 0.25, sb - 1.0, bu1, fy + 3 * SH - 0.5, sb, C.brownstone2.a);
    for (let s = 1; s < 3; s++) {
      const f0 = fy + s * SH;
      for (let u = bu0 + 0.5; u + 1.0 <= bu1 - 0.25; u += 1.5) { H.fill(u, f0 + 0.75, sb - 1.0, u + 1.0, f0 + 2.75, sb - 0.75, 0); H.fill(u, f0 + 0.75, sb - 0.75, u + 1.0, f0 + 2.75, sb - 0.5, C.win[Math.floor(h(sd, s, u * 4) * 5)]); }
      H.fill(bu0, f0 - 0.25, sb - 1.25, bu1, f0, sb, C.stone[1]);
    }
    H.fill(bu0 - 0.25, fy + 3 * SH - 0.5, sb - 1.25, bu1 + 0.25, fy + 3 * SH - 0.25, sb, C.coping);
  }
  // ---- shop front (ground floor)
  if (isShop) {
    const aw = C.awning[S.shop.awn % C.awning.length];
    const sy = fy;
    for (let u = 0.5; u < W - 0.5; u += 0.25) {
      if (u >= dc - 1.0 && u < dc + 1.0) continue;
      H.fill(u, sy + 0.75, sb, u + 0.25, sy + 3.0, sb + 0.25, 0);
      H.fill(u, sy + 0.75, sb + 0.25, u + 0.25, sy + 3.0, sb + 0.5, (Math.round(u * 4) % 8 === 0) ? C.woodD : C.litGlass);
    }
    H.fill(0.25, sy - 0.25, sb - 0.25, dc - 1.0, sy + 0.5, sb, C.woodD); H.fill(dc + 1.0, sy - 0.25, sb - 0.25, W - 0.25, sy + 0.5, sb, C.woodD);   // stall riser
    H.fill(0, sy + 3.0, sb - 0.25, W, sy + 3.75, sb, S.shop.bg ?? C.signBg[S.shop.awn % 4]);   // fascia board
    H.place(RK.sign(S.shop.name, C.gold, S.shop.bg ?? C.signBg[S.shop.awn % 4]), W / 2, sy + 3.0, -0.25, 0);
    H.place(RK.awning(Math.min(W - 0.5, 6), S.shop.awn), W / 2, sy + 1.9, -0.25, 0);
    if (S.shop.kind === 'tailor') { const pu = dc + (S.doorLeft ? 1.4 : -1.4); H.fill(pu - 0.125, sy + 2.5, sb - 0.5, pu + 0.125, sy + 2.75, sb, C.brass); H.fill(pu - 0.125, sy + 0.75, sb - 0.5, pu + 0.125, sy + 1.0, sb, C.brass); AF.res.poles.push({ p: H.w(pu, sb - 0.6), y: sy + 1.0 }); }
  }
  // ---- roof props
  const chimU = S.doorLeft ? W - 0.75 : 0.25;
  const fpv = sb + 0.5 + (D - sb - 1) * 0.25;
  // roof hatch, radio aerial, rooftop washing line, dovecote
  { const hu = q(S.doorLeft ? 0.75 : W - 2.0), hv = q(sb + 2.0 + (sd % 3)); H.fill(hu, top, hv, hu + 1.25, top + 0.5, hv + 1.25, brick.b); H.fill(hu, top + 0.5, hv, hu + 1.25, top + 0.75, hv + 1.25, sd % 2 ? C.woodD : C.iron); }
  if (h(sd, 21) < 0.35 && D - sb >= 7.5) H.place(G.aerial, W * 0.55, top, (sb + D) / 2, 0);
  else if (h(sd, 22) < 0.3 && D - sb >= 7.5 && !S.tank && S.type !== 'ten' && AF.res.lines.length < 60) { const c = H.w(W * 0.55, (sb + D) / 2); laundryLine(c[0], top + 1.9, c[1], H.face === 'n' || H.face === 's' ? 1 : 0, sd, top); }
  else if (h(sd, 23) < 0.12 && S.type !== 'ten' && W >= 6.5) { H.place(G.coop, W / 2, top, D - 3.2, 0, { collide: true }); AF.res.coops.push(H.w(W / 2, D - 3.2).concat([top + 2])); }
  if (S.enter || sd % 3 !== 2) {   // chimney stack on the party wall
    const cv = S.enter ? fpv - 0.25 : sb + 4 + (sd % 5);
    H.fill(chimU, top, cv, chimU + 0.75, top + 1.75, cv + 0.75, brick.b); H.fill(chimU - 0.125 < 0 ? 0 : chimU, top + 1.75, cv, chimU + 0.75, top + 2.0, cv + 0.75, C.coping);
    H.place(G.potsN[sd % 3], chimU + 0.375, top + 2.0, cv + 0.375, 0);
    info.chimney = H.w(chimU + 0.375, cv + 0.375).concat([top + 2.4]);
  }
  if (S.tank || S.type === 'ten' && sd % 2 === 0) H.place(G.waterTank, W / 2, top, D - 2.5, 0, { collide: true });
  else if (sd % 4 === 1) { H.fill(W / 2 - 1, top, sb + 5, W / 2 + 1, top + 0.5, sb + 6.5, C.coping); H.fill(W / 2 - 0.75, top + 0.5, sb + 5.25, W / 2 + 0.75, top + 0.75, sb + 6.25, C.glass); }   // skylight
  if (S.type === 'ten') {   // stair bulkhead
    H.fill(0.5, top, D - 5, 2.75, top + 2.75, D - 2.5, brick.b); H.fill(0.25, top + 2.75, D - 5.25, 3.0, top + 3.0, D - 2.25, C.tar);
    H.fill(1.0, top, D - 2.5, 2.25, top + 2.25, D - 2.25, doorC);
  }
  // Boston ivy on about 1 in 6 facades (spreads from one side of the door)
  if (h(sd, 72) < 0.17) { const iu = S.doorLeft ? W - 3.5 : 0.25; RK.ivy(H, iu, iu + 3.25, Math.min(top, fy + SH * 2.4), sb, brick.a, sd); }
  // roof garden (1 in 6) or a tar-beach sunbather
  if (!S.tank && S.type !== 'ten' && h(sd, 73) < 0.17 && D - sb >= 9) {
    const planter = AF.col(0x8a5a3a, { jitter: 0.3 }), green = AF.col(0x5f8a3e, { jitter: 0.9, edge: 0.2, solid: false }), mum = AF.col([0xe8b020, 0xc8482a, 0xe86a8a][sd % 3], { jitter: 0.4, solid: false });
    for (let u = 0.75; u < W - 1.5; u += 2.0) { H.fill(u, top, D - 2.0, u + 1.25, top + 0.5, D - 1.0, planter); H.fill(u, top + 0.5, D - 2.0, u + 1.25, top + 0.75 + ((u * 4) % 2) * 0.25, D - 1.0, (u | 0) % 3 ? green : mum); }
    H.fill(1.0, top, sb + 5.5, 1.25, top + 2.25, sb + 5.75, C.woodL); H.fill(W - 1.25, top, sb + 5.5, W - 1.0, top + 2.25, sb + 5.75, C.woodL); H.fill(1.0, top + 2.25, sb + 5.5, W - 1.0, top + 2.5, sb + 5.75, C.woodL);
    H.place(RK.sunbather(), W / 2, top, sb + 7.2, 1);
  } else if (!S.tank && h(sd, 74) < 0.12 && D - sb >= 8) H.place(RK.sunbather(), W * 0.4, top, sb + 3.5, (sd % 2) * 2);
  // fire escape
  if (S.fe) H.place(RK.fireEscape(n, SH), S.doorLeft ? W * 0.62 : W * 0.38, fy + SH - 0.5, sb - 1.25, 0);
  // ---- interiors
  if (hollow0) interior(H, S, { W, sb, D, fy, dc, fpv, pal, shop: S.shop, info });
  info.dc = dc; info.fpv = fpv;
  info.door = H.w(dc, -0.9);
  info.box = H.box(0, 0, 0, W, top + 1, D);
  return info;
};
const q = (v) => Math.round(v * 4) / 4;

// ------------------------------------------------------------ furnished interior (door-right layout, mirrored for doorLeft)
const interior = (H0, S, o) => {
  const RK = AF.resKit, C = RK.colours(), G = RK.geos();
  const H = mirror(H0, !!S.doorLeft), sd = S.seed;
  const { W, sb, D, fy } = o;
  const dc = S.doorLeft ? W - o.dc : o.dc;   // door centre in mirrored coordinates
  const v0 = sb + 0.5, v1 = D - 0.5;
  const id = S.id, spots = [];
  const doorP = H.w(dc, -0.9), inP = H.w(dc, v0 + 0.9);
  const spot = (kind, u, y, v, k, extra) => { const p = H.w(u, v); spots.push(AF.addSpot({ building: id, x: p[0], y, z: p[1], yaw: H.yaw(k), kind, path: extra === 'up' ? undefined : [doorP, inP, H.w(Math.min(dc, W / 2), (v0 + v) / 2), p] })); };
  if (o.shop) { shopInterior(H, S, o, dc, spot); return; }
  const mid = q(v0 + (v1 - v0) * 0.46);
  // partition parlour | kitchen, with a doorway in the middle
  H.fill(0.5, fy, mid, W - 0.5, fy + 3.25, mid + 0.25, o.pal.paper);
  H.fill(0.5, fy, mid, W - 0.5, fy + 0.75, mid + 0.25, o.pal.wains);
  const du = q(W / 2 - 0.75);
  H.fill(du, fy, mid, du + 1.5, fy + 2.5, mid + 0.25, 0);
  // kitchen lino checker
  const L = C.lino[sd % 4];
  for (let u = 0.5; u < W - 0.5; u += 0.5) for (let v = mid + 0.25; v < v1; v += 0.5) H.fill(u, fy - 0.25, v, Math.min(u + 0.5, W - 0.5), fy, Math.min(v + 0.5, v1), L[((u * 2 + v * 2) | 0) & 1]);
  // ---- parlour
  const pv = q((v0 + mid) / 2);
  H.place(G.rug[sd % 4], W / 2 - 0.2, fy, pv, 0);
  H.place(G.fireplace, 0.75, fy, pv, 1, { collide: true });
  H.place(G.pic[sd % 5], 0.5, fy + 1.75, pv, 1);
  H.place(G.sofa[sd % 5], W - 0.95, fy, pv + 0.2, 3, { collide: true });
  H.place(G.pic[(sd + 2) % 5], W - 0.5, fy + 1.4, pv + 0.2, 3);
  H.place(G.armchair[sd % 4], 1.6, fy, pv + 1.7, 1, { collide: true });
  H.place(G.floorLamp, W - 0.8, fy, mid - 0.5, 0, { collide: true });
  H.place(G.radio, 0.85, fy, v0 + 0.5, 1, { collide: true });
  if (W >= 7) H.place(G.armchair[(sd + 1) % 4], W / 2 - 0.4, fy, v0 + 1.1, 2, { collide: true });
  const lampG = S.dark ? G.hangLampOff : G.hangLamp;
  H.place(lampG, W / 2, fy + 3.25, pv, 0);
  { const V = G.vary, k = RK.hash(sd, 41), su = q((0.5 + W / 2 - 0.75) / 2);
    if (k < 0.25) { H.place(V.piano, su, fy, mid, 0, { collide: true }); spot('work', su, fy, mid - 0.9, 2); }
    else if (k < 0.5) { H.place(V.books, su, fy, mid, 0, { collide: true }); if (W >= 7) H.place(V.books, su + 1.3 < W / 2 - 0.9 ? su + 1.3 : su - 1.3, fy, mid, 0, { collide: true }); }
    else if (k < 0.72) H.place(V.birdcage, su, fy, mid - 0.5, 0, { collide: true });
    else H.place(G.pic[(sd + 3) % 5], su, fy + 1.5, mid, 0);
    H.place(V.photos, 0.5, fy + 1.9, v0 + 1.7, 1);
    // v2 household archetype: one signature corner per home
    const A = G.arch, at = Math.floor(RK.hash(sd, 45) * 6); o.info.arch = ['dock worker', 'widow', 'musician', 'artist', 'sea captain', 'young couple'][at];
    if (A) {
      if (at === 0) { H.place(A.coatRack, 1.9, fy, v0 + 0.6, 2, { collide: true }); }
      else if (at === 1) { H.place(A.basket, 1.9, fy, v0 + 0.6, 2); const p = H.w(W / 2 - 0.2, pv); AF.addSpot({ building: id, kind: 'cat', x: p[0], y: fy + 0.07, z: p[1], yaw: 0.8 }); if (k >= 0.5) H.place(V.birdcage, 1.9, fy, v0 + 1.4, 0, { collide: true }); }
      else if (at === 2) { H.place(A.gramophone, 1.9, fy, v0 + 0.7, 2, { collide: true }); }
      else if (at === 3) { H.place(A.easel, 1.9, fy, v0 + 0.8, 2, { collide: true }); H.place(G.pic[(sd + 1) % 5], 0.5, fy + 2.2, pv - 1.2, 1); }
      else if (at === 4) { H.place(A.wheel, W - 0.5, fy + 1.55, pv - 1.3, 3); H.place(A.barometer, 0.5, fy + 1.3, mid - 0.5, 1); H.place(A.bottle, 0.75, fy + 1.125, pv - 0.45, 1); }
      else { H.place(A.pram, 1.9, fy, v0 + 0.8, 2, { collide: true }); }
    }
    if (RK.hash(sd, 42) < 0.7) H.place(V.calendar, 0.5, fy + 1.8, mid + 3.1, 1); }
  // ---- kitchen
  const kv = q((mid + v1) / 2);
  H.place(G.stove, 0.85, fy, mid + 1.1, 1, { collide: true });
  H.place(G.icebox, 0.85, fy, mid + 2.1, 1, { collide: true });
  H.place(G.sink, 1.3, fy, v1 - 0.35, 0, { collide: true });
  if (W >= 6.5 || !S.stair) H.place(G.counter, 2.35, fy, v1 - 0.35, 0, { collide: true });
  H.place(G.jarShelf, 1.8, fy + 1.6, v1, 0);
  const tu = q((0.5 + (S.stair ? W - 2.0 : W - 0.5)) / 2 + 0.4), tv = q(mid + 2.4);
  H.place(RK.hash(sd, 43) < 0.4 ? G.vary.dinner : G.table, tu, fy, tv, 0, { collide: true });
  H.place(G.chair, tu, fy, tv - 0.85, 2); H.place(G.chair, tu, fy, tv + 0.85, 0);
  H.place(lampG, tu, fy + 3.25, tv, 0);
  // spots + lights
  spot('sit', W - 1.0, fy + 0.375, pv + 0.2, 3);
  spot('sit', tu, fy + 0.5, tv - 0.85, 2);
  spot('work', 1.55, fy, mid + 1.1, 3);
  if (!S.dark) { const p = H.w(W / 2, pv); AF.addLight({ x: p[0], y: fy + 2.6, z: p[1], color: 0xffc070, intensity: 1.1, range: 9, kind: 'interior' }); }
  // ---- stair to the bedroom floor
  if (S.stair) {
    const f1 = fy + SH, s0 = q(v1 - 3.75), su0 = W - 2.0, su1 = W - 0.5;
    for (let i = 1; i <= 15; i++) H.fill(su0, fy, s0 + (i - 1) * 0.25, su1, fy + 0.25 * i, v1, C.stair[i & 1]);
    H.fill(su0, fy + 3.25, s0, su1, f1, v1, 0);                                      // hole in ceiling + floor
    H.fill(su0 - 0.25, f1, s0 - 0.25, su0, f1 + 1.0, v1 - 1.25, C.woodD);            // banister on the landing side
    H.fill(su0 - 0.25, f1, s0 - 0.25, su1, f1 + 1.0, s0, C.woodD);                   // rail at the head of the hole
    // bedroom
    const bv = q(v0 + 2.2);
    H.place(G.rug[(sd + 1) % 4], W / 2 - 0.3, f1, q((v0 + v1) / 2) - 0.5, 0);
    H.place(G.bed[sd % 3], 0.5, f1, bv, 1, { collide: true });
    H.place(G.nightstand, 0.75, f1, bv + 1.2, 1, { collide: true });
    H.place(G.wardrobe, 0.85, f1, q(v0 + 5.3), 1, { collide: true });
    H.place(G.dresser, W - 0.75, f1, v0 + 1.4, 3, { collide: true });
    H.place(G.pic[(sd + 4) % 5], 0.5, f1 + 1.6, bv + 2.2, 1);
    H.place(G.armchair[(sd + 2) % 4], W / 2, f1, v1 - 1.2, 0, { collide: true });
    { const V = G.vary, k = RK.hash(sd, 44), bv2 = q(v0 + 3.4);
      if (k < 0.25) H.place(V.crib, W - 1.0, f1, bv2, 3, { collide: true });
      else if (k < 0.5) { H.place(V.toys, W - 1.3, f1, bv2, 3, { collide: true }); H.place(G.bed[(sd + 1) % 3], W - 0.5, f1, bv2 + 1.6, 3, { collide: true }); }
      else if (k < 0.72) { H.place(G.trade.sewing, W - 1.0, f1, bv2, 3, { collide: true }); H.place(G.chair, W - 1.9, f1, bv2, 1); }
      else H.place(V.books, W - 0.5, f1, bv2, 3, { collide: true });
      H.place(V.photos, 0.5, f1 + 1.8, v1 - 1.0, 1); }
    H.place(lampG, W / 2, f1 + 3.25, q((v0 + v1) / 2), 0);
    const bp = H.w(1.6, bv + 0.7);
    spots.push(AF.addSpot({ building: id, x: bp[0], y: f1 + 0.5, z: bp[1], yaw: H.yaw(1), kind: 'bed' }));
    if (!S.dark) { const p = H.w(W / 2, q((v0 + v1) / 2)); AF.addLight({ x: p[0], y: f1 + 2.6, z: p[1], color: 0xffc890, intensity: 0.9, range: 8, kind: 'interior' }); }
    o.info.upstairs = { top: H.w((su0 + su1) / 2, v1 - 0.4), y: f1, bottom: H.w((su0 + su1) / 2, s0 - 0.6), fy, land: H.w(su0 - 0.8, v1 - 0.6) };
  }
  o.info.spots = spots;
};

const SHOPFIT = {
  grocery: 'grocery', candy: 'candy', tailor: 'tailor', deli: 'deli', laundry: 'laundry', bar: 'bar', doctor: 'doctor', bakery: 'bakery', hardware: 'grocery',
};
const shopInterior = (H, S, o, dc, spot) => {
  const RK = AF.resKit, C = RK.colours(), G = RK.geos();
  const { W, sb, D, fy } = o; const v0 = sb + 0.5, v1 = D - 0.5, kind = S.shop.kind;
  // v3 floors by trade: checker only in the sweet shop + laundry; boards in the grocer/deli/bakery/hardware/tailor, dark boards in the bar, lino at the doctor's
  const FLK = { candy: [AF.col(0xf2d6de, { jitter: 0.05, edge: 0.15 }), AF.col(0xf6f2ea, { jitter: 0.05, edge: 0.15 })], laundry: C.lino[3], doctor: [C.lino[2][1], C.lino[2][1]],
    bar: [AF.col(0x5a3a22, { jitter: 0.3, edge: 0.3, patTop: 'plank' }), AF.col(0x4e321e, { jitter: 0.3, edge: 0.3, patTop: 'plank' })] }[kind] || C.floors[(S.seed + 1) % 3];
  for (let u = 0.5; u < W - 0.5; u += 0.5) for (let v = v0; v < v1; v += 0.5) H.fill(u, fy - 0.25, v, Math.min(u + 0.5, W - 0.5), fy, Math.min(v + 0.5, v1), FLK[((u * 2 + (FLK === C.floors[(S.seed + 1) % 3] || kind === 'bar' ? 0 : v * 2)) | 0) & 1]);
  const T = G.trade, shelf = T[kind] || G.stockShelf[SHOPFIT[kind] || 'grocery'];
  const lamp = { grocery: T.globeLamp, deli: T.greenLamp, candy: T.globeLamp, tailor: G.hangLamp, laundry: T.greenLamp, bar: T.greenLamp, doctor: T.globeLamp, bakery: G.hangLamp, hardware: T.greenLamp }[kind] || G.hangLamp;
  const mid = (v0 + v1) / 2 - 1.0;
  // shelves along the left wall and the back wall (the bar keeps its back wall for the back-bar)
  for (let v = v0 + 1.2; v < v1 - 1.5; v += 1.6) H.place(shelf, 0.5, fy, v, 1, { collide: true });
  if (kind !== 'bar') for (let u = 1.2; u < W - 1.0; u += 1.6) H.place(shelf, u, fy, v1, 0, { collide: true });
  if (kind === 'bar') {
    H.fill(W - 1.5, fy, v0 + 2.0, W - 1.25, fy + 1.0, v1 - 1.0, C.woodD); H.fill(W - 1.75, fy + 1.0, v0 + 2.0, W - 1.0, fy + 1.25, v1 - 1.0, C.wood);
    H.fill(W - 1.75, fy, v0 + 2.0, W - 1.5, fy + 0.25, v1 - 1.0, C.brass);
    for (let v = v0 + 2.5; v < v1 - 1.2; v += 1.1) { H.place(G.stool, W - 2.2, fy, v, 0, { collide: true }); spot('sit', W - 2.2, fy + 0.75, v, 1); }
    for (let v = v0 + 2.8; v < v1 - 1.2; v += 2.1) H.place(T.backbar, W - 0.5, fy, v, 3, { collide: true });
    for (const v of [v0 + 3.5, v1 - 2.5]) H.place(T.taps, W - 1.4, fy + 1.25, v, 1);
    for (let u = 1.2; u < W - 2.5; u += 2.0) { H.place(G.table, u + 0.3, fy, v1 - 1.2, 0, { collide: true }); H.place(G.chair, u + 0.3, fy, v1 - 2.0, 2); spot('sit', u + 0.3, fy + 0.5, v1 - 2.0, 2); }
    H.place(G.table, 2.0, fy, v0 + 1.6, 0, { collide: true }); H.place(G.chair, 2.0, fy, v0 + 0.8, 2);
    H.place(G.pic[4], 0.5, fy + 2.2, mid + 1, 1);
    spot('counter', W - 0.8, fy, v0 + 4, 3);
  } else {
    H.place(G.shopCounter, W / 2 + 0.3, fy, v1 - 2.6, 2, { collide: true });
    spot('counter', W / 2 + 0.3, fy, v1 - 1.9, 0);
    spot('browse', 1.4, fy, v0 + 2.2, 3);
    spot('browse', W / 2, fy, v1 - 3.6, 2);
  }
  const ctop = fy + 1.0, cu = W / 2 + 0.3, cv = v1 - 2.6;   // counter top
  if (kind === 'grocery') { H.place(G.crates, W / 2 - 0.3, fy, v0 + 1.2, 2, { collide: true }); H.place(T.canPyramid, W / 2 - 0.5, fy, mid, 0, { collide: true }); H.place(T.sacks, W - 1.3, fy, mid + 0.5, 3, { collide: true }); H.place(T.barrel, W - 1.0, fy, v0 + 2.6, 0, { collide: true }); H.place(T.scale, cu - 0.8, ctop, cv, 2); }
  if (kind === 'candy') { H.place(G.candyTable, W / 2 - 0.2, fy, mid, 0, { collide: true }); for (let v = v0 + 1.5; v < v1 - 3.5; v += 1.2) H.place(G.stool, W - 1.0, fy, v, 0, { collide: true }); H.place(T.scale, cu + 0.6, ctop, cv, 2); }
  if (kind === 'deli') { H.fill(cu - 1.5, fy, cv - 0.5, cu + 1.5, fy + 0.25, cv + 0.5, 0); H.place(G.deliCase, cu, fy, cv - 1.0, 2, { collide: true }); for (const vv of [v1 - 2.5, mid, v0 + 2]) H.place(G.salami, W / 2 + 0.3, fy + 3.25, vv, 0); H.place(T.slicer, cu + 0.8, ctop, cv, 2); for (const vv of [v0 + 1.2, v0 + 2.1]) H.place(T.pickles, W - 1.0, fy, vv, 0, { collide: true }); H.place(G.table, 1.8, fy, mid, 0, { collide: true }); H.place(G.chair, 1.8, fy, mid - 0.85, 2); }
  if (kind === 'laundry') { for (let v = v0 + 1.0; v < v1 - 3.5; v += 1.1) H.place(G.washer, W - 0.95, fy, v, 3, { collide: true }); for (const vv of [v0 + 2, mid + 1]) H.place(laundryGeos()[1], W / 2 - 0.5, fy + 2.9, vv, 1); H.place(T.presser, W / 2 - 0.4, fy, mid + 0.5, 1, { collide: true }); }
  if (kind === 'bakery') { H.place(G.oven, W - 1.0, fy, v1 - 1.6, 3, { collide: true }); H.place(G.crates, W / 2 - 0.4, fy, v0 + 1.3, 2, { collide: true }); H.place(T.sacks, W - 1.3, fy, mid, 3, { collide: true }); }
  if (kind === 'tailor') { for (const [u, vv] of [[W / 2, v0 + 1.2], [W / 2 - 0.4, mid]]) H.place(G.mannequin, u, fy, vv, 0, { collide: true }); H.place(T.sewing, W - 1.0, fy, mid + 1.0, 3, { collide: true }); H.place(G.chair, W - 1.9, fy, mid + 1.0, 1); spot('work', W - 1.9, fy + 0.5, mid + 1.0, 1); H.place(G.armchair[2], W - 1.0, fy, v0 + 1.2, 3, { collide: true }); }
  if (kind === 'hardware') { H.place(T.paintCans, W / 2 - 0.3, fy, mid, 0, { collide: true }); H.place(T.barrel, W - 1.0, fy, v0 + 1.4, 0, { collide: true }); H.place(T.sacks, W - 1.3, fy, mid + 1.5, 3, { collide: true }); }
  if (kind === 'doctor') { H.place(G.sofa[3], W - 0.95, fy, (v0 + v1) / 2 + 0.6, 3, { collide: true }); H.place(T.exam, W - 1.5, fy, v1 - 1.2, 1, { collide: true }); H.place(T.eyeChart, W - 0.5, fy + 1.3, mid - 1.2, 3); spot('bed', W - 1.5, fy + 0.9, v1 - 1.2, 1, 'up'); }
  if (kind === 'laundry') H.place(G.armchair[2], W - 1.0, fy, v0 + 1.2, 3, { collide: true });
  H.place(lamp, W / 2, fy + 3.25, (v0 + v1) / 2 - 1.5, 0); H.place(lamp, W / 2, fy + 3.25, (v0 + v1) / 2 + 2, 0);
  // v3: a centre island per trade, goods on the counter, a turning ceiling fan
  const SK = RK.shopKit && RK.shopKit();
  if (SK) {
    const iu = W / 2 - 1.0, cl = { collide: true };
    if (kind === 'grocery') { H.place(SK.produce, iu, fy, v0 + 3.2, 1, cl); H.place(SK.mill, cu - 0.1, ctop, cv, 2); for (const vv of [v0 + 1.0, v0 + 3.2]) H.place(G.salami, W / 2 + 0.9, fy + 3.25, vv, 1); }
    if (kind === 'candy') H.place(SK.jars, iu, fy, v0 + 2.6, 1, cl);
    if (kind === 'tailor') H.place(SK.cloth, iu + 0.1, fy, v0 + 3.2, 1, cl);
    if (kind === 'laundry') H.place(SK.parcels, iu, fy, v0 + 3.2, 1, cl);
    if (kind === 'bakery') H.place(SK.cakes, iu + 0.2, fy, v0 + 3.0, 1, cl);
    if (kind === 'hardware') H.place(G.crates, iu, fy, v0 + 3.0, 1, cl);
    if (kind === 'bar') { H.place(SK.darts, 0.5, fy + 1.6, v0 + 3.2, 1); spot('stand', 2.3, fy, v0 + 3.2, 3); }
    if (kind === 'doctor') { for (const vv of [v0 + 1.4, v0 + 2.3]) { H.place(G.chair, iu, fy, vv, 1); } spot('sit', iu, fy + 0.5, v0 + 1.4, 1); }
    if (kind !== 'bar' && kind !== 'deli') H.place(SK.register, cu + (kind === 'candy' ? -0.6 : 0.6), ctop, cv, 2);
    const fp = H.w(W / 2, (v0 + v1) / 2 + 0.25); AF.res.fans.push({ x: fp[0], y: fy + 3.25, z: fp[1], ph: S.seed });
  }
  const p = H.w(W / 2, (v0 + v1) / 2); AF.addLight({ x: p[0], y: fy + 2.6, z: p[1], color: kind === 'bar' ? 0xffb060 : 0xffd090, intensity: 1.2, range: 10, kind: 'interior' });
};

// ============================================================ BLOCKS
const SHOPS = {
  'rs-c4': { name: "MANCINI'S GROCERY", kind: 'grocery', awn: 0 },
  'rs-c5': { name: 'SWEET SHOPPE', kind: 'candy', awn: 4 },
  'rs-b2': { name: 'KOVAC TAILOR', kind: 'tailor', awn: 2 },
  'rs-b3': { name: 'SOLACE DELI', kind: 'deli', awn: 1 },
  'rs-b4': { name: 'STEAM LAUNDRY', kind: 'laundry', awn: 2 },
  'rs-b5': { name: 'ANCHOR & ROPE', kind: 'bar', awn: 1 },
  'rs-g2': { name: 'DR. HALE M.D.', kind: 'doctor', awn: 2 },
  'rs-g3': { name: 'BRIGHT BAKERY', kind: 'bakery', awn: 3 },
};
const EXTRA_SHOP = { 'rs-g2': { name: 'EASTSIDE HARDWARE', kind: 'hardware', awn: 0 } };
const BLOCK_STYLE = {   // which house types dominate each block
  'rs-c4': ['brown', 'brown', 'row', 'ten'], 'rs-c5': ['row', 'row', 'brown', 'ten'], 'rs-b2': ['row', 'row', 'brown', 'ten'], 'rs-b3': ['brown', 'brown', 'row', 'ten'],
  'rs-b4': ['ten', 'ten', 'row', 'ten'], 'rs-b5': ['row', 'ten', 'brown', 'row'], 'rs-g2': ['brown', 'brown', 'row', 'ten'], 'rs-g3': ['ten', 'row', 'brown', 'ten'],
};

const block = (lot, bi, R) => {
  const RK = AF.resKit, C = RK.colours(), G = RK.geos(), h = RK.hash;
  const [x0, z0, x1, z1] = lot.rect;
  const styles = BLOCK_STYLE[lot.id];
  const out = { homes: [], lot: lot.id };
  // ground: whole lot to yard, then paving strips behind the houses
  AF.W.ground(x0, z0, x1, z1, 1, C.yard[bi % 2]);
  // faces: e/w take the full length (corners); n/s the middle
  const faces = [
    { face: 'w', P: { x0, z0, x1: x0 + RD, z1, face: 'w' } },
    { face: 'e', P: { x0: x1 - RD, z0, x1, z1, face: 'e' } },
    { face: 'n', P: { x0: x0 + RD, z0, x1: x1 - RD, z1: z0 + RD, face: 'n' } },
    { face: 's', P: { x0: x0 + RD, z0: z1 - RD, x1: x1 - RD, z1, face: 's' } },
  ];
  let enterBudget = 7 + (bi % 2), placedEnter = 0, hi = 0;
  const specials = SPECIAL[lot.id] || {};
  for (const fc of faces) {
    const F = RK.frame(fc.P);
    const L = F.W;
    // partition frontage into widths 6..8.5 m
    const widths = []; let acc = 0;
    while (L - acc > 0.1) {
      let w = q(6 + R() * 2.5); if (L - acc - w < 6) w = L - acc; if (L - acc - w < 6 && L - acc - w > 0.1) w = L - acc;
      widths.push(w); acc += w;
    }
    // special claims on this face
    const sp = specials[fc.face];
    let u = 0;
    for (let i = 0; i < widths.length; i++) {
      let w = widths[i];
      if (sp && !sp.done && i === sp.at) {
        const sw = sp.w; // take enough slots
        let take = 0, ww = 0; while (ww < sw - 0.1 && i + take < widths.length) { ww += widths[i + take]; take++; }
        const Hs = RK.sub(F, u, ww, RD);
        sp.done = true; sp.fn(Hs, ww, out);
        u += ww; i += take - 1; continue;
      }
      const Hh = RK.sub(F, u, w, RD);
      const first = i === 0, last = i === widths.length - 1;
      const corner = (fc.face === 'w' || fc.face === 'e') && (first || last);
      const sd = (bi * 97 + hi * 13 + 7) | 0; hi++;
      let type = styles[Math.floor(h(sd, 1) * styles.length)];
      if (corner) type = h(sd, 2) < 0.5 ? 'ten' : 'row';
      const isShop = corner && ((fc.face === 'w' && last && !out.shopDone) || (EXTRA_SHOP[lot.id] && fc.face === 'e' && first && !out.shop2Done));
      let shop = null;
      if (isShop) { if (fc.face === 'w' && !out.shopDone) { shop = SHOPS[lot.id]; out.shopDone = true; } else { shop = EXTRA_SHOP[lot.id]; out.shop2Done = true; } type = 'ten'; }
      const n = type === 'ten' ? 4 + (sd % 2) : type === 'brown' ? 4 : 3 + (sd % 2);
      // enterable: shops + an even spread of homes on this block
      const enter = !!shop || (!corner && placedEnter < enterBudget && (hi % 3 !== 0));
      if (enter && !shop) placedEnter++;
      const stair = enter && !shop && (placedEnter % 3 !== 0);
      const brick = type === 'brown' ? (sd % 2 ? C.brownstone : C.brownstone2) : C.bricks[Math.floor(h(sd, 3) * C.bricks.length)];
      const S = {
        id: 'res-' + lot.id + '-' + fc.face + i, type, n, brick, trim: C.stone[type === 'brown' ? 1 : (sd % 2 ? 0 : 3)], cornice: C.cornice[Math.floor(h(sd, 4) * 5)],
        door: C.doors[sd % C.doors.length], enter, stair, shop, seed: sd, dark: enter && !shop && h(sd, 77) < 0.3, doorLeft: h(sd, 5) < 0.4,
        side: corner ? ((first) === (fc.face === 'w') ? null : null) : null, fe: type === 'ten' && !shop ? true : (type === 'ten' && h(sd, 6) < 0.5),
      };
      // corner houses expose one side wall to the cross street
      if (corner) S.side = (fc.face === 'w') ? (first ? 'L' : 'R') : (first ? 'L' : 'R');
      const info = house(Hh, S);
      if (info.chimney && ((enter && hi % 4 !== 0) || (shop && shop.kind === 'bakery') || h(sd, 8) < 0.06)) AF.addChimney(info.chimney[0], info.chimney[2], info.chimney[1]);
      // a flag on a bracket over the door of a few houses
      if (!shop && h(sd, 11) < 0.12 && n >= 3) {
        const fyy = info.fy + SH + 0.5, fu = info.dc + (S.doorLeft ? 1.2 : -1.2);
        Hh.fill(fu - 0.125, fyy, info.sb - 0.5, fu + 0.125, fyy + 0.25, info.sb, C.iron); Hh.fill(fu - 0.125, fyy + 0.25, info.sb - 1.25, fu + 0.125, fyy + 0.5, info.sb - 0.5, C.iron);
        const fp = Hh.w(fu, info.sb - 0.5); AF.res.flags.push({ p: fp, y: fyy + 0.45, yaw: Hh.yaw(0), small: true });
      }
      if (enter) {
        const name = shop ? titleCase(shop.name).replace('M.d.', 'M.D.') : HOME_NAMES[(bi * 7 + out.homes.length) % HOME_NAMES.length];
        const b = { id: S.id, name, kind: shop ? (shop.kind === 'bar' ? 'bar' : 'shop') : 'home', box: info.box, doors: [{ x: info.door[0], y: 0.25, z: info.door[1], yaw: Hh.yaw(2) }], floors: stair ? [info.fy, info.fy + SH] : [info.fy], interior: true, label: !!shop };
        AF.addBuilding(b);
        const rec = { id: S.id, b, info, lot: lot.id, stair, shop: !!shop };
        out.homes.push(rec); AF.res.homes.push(rec); if (shop) AF.res.shops.push(rec);
        AF.res.doors.push({ id: S.id, door: info.door, yaw: Hh.yaw(2), fy: info.fy, inside: Hh.w(info.dc, info.sb + 2.2) });
      }
      // back yard strip behind flush houses (paving + trash cans + back step)
      if (type !== 'brown') {
        Hh.ground(0, 13, w, RD, 1, C.paving);
        if (sd % 2 === 0) Hh.place(G.trash, 0.8, 0.25, 14.0, 0, { collide: true });
        if (sd % 3 === 0) Hh.place(G.bike[sd % 3], w - 1.2, 0.25, 14.2, 1);
      }
      u += w;
    }
  }
  yard(lot, bi, R, out);
  return out;
};
const titleCase = (s) => s.toLowerCase().replace(/(^|\s)\S/g, (m) => m.toUpperCase());
const HOME_NAMES0 = ['The Russo home', 'The O\'Malley home', 'The Kowalski home', 'The Bell home', 'The Greenberg home', 'The Lindqvist home', 'The Fontaine home', 'The Okafor home', 'The Walsh home', 'The Novak home',
  'The Castellano home', 'The Brennan home', 'The Moreau home', 'The Szabo home', 'The Hartley home', 'The Delgado home', 'The Petrakis home', 'The Quinn home', 'The Abernathy home', 'The Lucchese home',
  'The Sorensen home', 'The Wexler home', 'The MacLeod home', 'The Janssen home', 'The Byrne home', 'The Adler home', 'The Rossi home', 'The Dunleavy home', 'The Halloran home', 'The Mendel home',
  'The Varga home', 'The Pike home', 'The Carmody home', 'The Esposito home', 'The Lindgren home', 'The Harlow home', 'The Kaminski home', 'The Duval home', 'The Fitzgerald home', 'The Ahearn home',
  'The Beaumont home', 'The Tanaka home', 'The Marchetti home', 'The Doyle home', 'The Weiss home', 'The Calloway home', 'The Ferreira home', 'The Nolan home', 'The Kerrigan home', 'The Sandoval home',
  'The Yoon home', 'The Pulaski home', 'The Rourke home', 'The Albright home', 'The Costa home', 'The Whitaker home'];
const HOME_NAMES = HOME_NAMES0.map((n) => n.replace(/^The /, '').replace(/ home$/, ' Residence'));

// ------------------------------------------------------------ block interiors: yards, fences, sheds, gardens, laundry, cats
const yard = (lot, bi, R, out) => {
  const RK = AF.resKit, C = RK.colours(), G = RK.geos();
  const [x0, z0, x1, z1] = lot.rect;
  const ix0 = x0 + RD, ix1 = x1 - RD, iz0 = z0 + RD, iz1 = z1 - RD, izm = q((iz0 + iz1) / 2);
  if (lot.id === 'rs-b4') { pocketPark(ix0, iz0, ix1, iz1, R); return; }
  // yard ground patchwork: grass + dirt + paving
  for (let x = ix0; x < ix1; x += 4.5) for (let z = iz0; z < iz1; z += 4.5) { const k = RK.hash(x * 3, z * 7, bi); AF.W.paint(x, z, Math.min(x + 4.5, ix1), Math.min(z + 4.5, iz1), k < 0.55 ? C.yard[(k * 10 | 0) & 1] : k < 0.8 ? C.yard[2] : C.paving); }
  // central E-W fence (the two halves) + N-S dividers every ~6-8 m
  const fh = 1.5;
  const fenceZ = (xa, xb, z) => { for (let x = xa; x < xb; x += 0.25) AF.W.fill(x, 0.25, z, x + 0.25, 0.25 + fh + ((x * 4 | 0) % 2 ? 0 : 0.25), z + 0.25, C.fence[((x * 4) | 0) % 3 === 0 ? 1 : 0]); AF.W.fill(xa, 0.25 + fh - 0.5, z - 0.125 > z ? z : z, xb, 0.25 + fh - 0.25, z + 0.25, C.fence[1]); };
  const fenceX = (za, zb, x) => { for (let z = za; z < zb; z += 0.25) AF.W.fill(x, 0.25, z, x + 0.25, 0.25 + fh + ((z * 4 | 0) % 2 ? 0 : 0.25), z + 0.25, C.fence[((z * 4) | 0) % 3 === 0 ? 1 : 0]); };
  fenceZ(ix0, ix1, izm);
  const divs = [];
  for (let x = ix0 + 6 + R() * 2; x < ix1 - 4; x += 6 + R() * 2.5) { const xx = q(x); divs.push(xx); fenceX(iz0, iz1, xx); }
  // cats on the fences
  for (let i = 0; i < 2; i++) { const xx = divs[i % Math.max(1, divs.length)] ?? ix0 + 5; AF.addSpot({ building: null, kind: 'cat', x: xx + 0.125, y: 0.25 + fh + 0.25, z: q(iz0 + 3 + R() * (iz1 - iz0 - 6)), yaw: R() * 6.28 }); }
  AF.addSpot({ building: null, kind: 'cat', x: ix0 + 3, y: 0.25 + fh + 0.25, z: izm + 0.125, yaw: 1.57 });
  // yard cells between dividers
  const xs = [ix0, ...divs, ix1];
  let lines = 0;
  for (let c = 0; c < xs.length - 1; c++) for (const half of [0, 1]) {
    const cx0 = xs[c] + 0.25, cx1 = xs[c + 1], cz0 = half ? izm + 0.25 : iz0, cz1 = half ? iz1 : izm;
    const k = RK.hash(bi, c, half), cw = cx1 - cx0, cd = cz1 - cz0;
    if (cw < 3 || cd < 3) continue;
    // shed in the far corner
    if (k < 0.35) AF.placeStatic(G.shed[(c + half) % 3], cx0 + 1.4, 0.25, half ? cz1 - 1.3 : cz0 + 1.3, half ? 2 : 0, { collide: true });
    // garden plot
    else if (k < 0.65) { AF.W.paint(cx0 + 0.5, (cz0 + cz1) / 2 - 1.5, cx1 - 0.5, (cz0 + cz1) / 2 + 1.5, C.dirt); AF.placeStatic(G.tomatoes, (cx0 + cx1) / 2, 0.25, (cz0 + cz1) / 2 - 0.7, 0, { collide: false }); AF.placeStatic(G.cabbages, (cx0 + cx1) / 2, 0.25, (cz0 + cz1) / 2 + 0.7, 0, { collide: false }); }
    else if (k < 0.8) { AF.placeStatic(G.wagon, cx0 + 1.2, 0.25, (cz0 + cz1) / 2, 1, { collide: false }); AF.placeStatic(G.bench, (cx0 + cx1) / 2, 0.25, half ? cz1 - 0.6 : cz0 + 0.6, half ? 2 : 0, { collide: true }); }
    AF.placeStatic(G.trash, cx1 - 0.6, 0.25, half ? cz0 + 0.7 : cz1 - 0.7, 0, { collide: true });
    // laundry line (dynamic) along x, 6 m, if the cell fits
    if (cw >= 6.6 && lines < 3) { laundryLine((cx0 + cx1) / 2, 2.9, (cz0 + cz1) / 2 + (half ? 0.8 : -0.8), 0, bi * 7 + c * 2 + half); lines++; }
  }
  // extra high lines between the north and south backs (tenement style), from a pole in the middle
  if (lines < 3) { laundryLine((ix0 + ix1) / 2, 2.9, izm - 2.5, 0, bi * 5 + 1); lines++; }
  laundryLine(ix1 - 1.5, 3.1, izm - 6, 1, bi * 3 + 9);   // along z beside the east row
};

// laundry: posts (static voxels) + the washing (one shared geometry per variant, a dynamic swaying mesh)
let LG = null;
const laundryGeos = () => {
  if (LG) return LG;
  const col = AF.col, line = col(0xe8e4dc, {});
  const cl = [0xf4f2ec, 0xc83a32, 0x8ab0d8, 0xf0d070, 0xe8a0b0, 0x6a9a5a, 0xf4f2ec, 0x3a5a8a, 0xd8c8a8, 0xffffff].map((h) => col(h, { jitter: 0.15, edge: 0.1, solid: false }));
  LG = [0, 1, 2].map((s) => {
    const m = new AF.Model(96, 16, 2);
    m.box(0, 15, 0, 96, 16, 1, line);
    let x = 3 + s, i = s;
    while (x < 90) {
      const w = 7 + ((i * 5) % 7), hh = 7 + ((i * 3 + s) % 8), c = cl[(i * 3 + s) % cl.length];
      if (i % 4 === 1) { m.box(x, 15 - hh, 0, x + w, 15, 1, c); m.box(x + 2, 15 - hh, 0, x + w - 2, 15 - hh + 3, 1, 0); }      // trousers
      else if (i % 4 === 2) { m.box(x, 15 - hh, 0, x + w, 15, 1, c); m.box(x - 2, 11, 0, x, 15, 1, c); m.box(x + w, 11, 0, x + w + 2, 15, 1, c); } // shirt
      else m.box(x, 15 - hh, 0, x + w, 15, 1, c);
      m.set(x + 1, 15, 0, col(0x8a6a4a, {})); m.set(x + w - 2, 15, 0, col(0x8a6a4a, {}));
      x += w + 3 + (i % 3); i++;
    }
    return AF.meshModel(m, { vs: 1 / 16, anchor: [0.5, 1, 0.5] });
  });
  return LG;
};
const laundryLine = (cx, y, cz, alongZ, seed, base = 0.25, noPosts = false) => {
  const C = AF.resKit.colours();
  const g = laundryGeos()[seed % 3];
  // posts
  for (const s of (noPosts ? [] : [-1, 1])) {
    const px = alongZ ? cx : cx + s * 3.05, pz = alongZ ? cz + s * 3.05 : cz;
    AF.W.fill(px - 0.125, base, pz - 0.125, px + 0.125, y + 0.25, pz + 0.125, C.woodL);
    if (alongZ) AF.W.fill(px - 0.5, y, pz - 0.125, px + 0.5, y + 0.25, pz + 0.125, C.woodL); else AF.W.fill(px - 0.125, y, pz - 0.5, px + 0.125, y + 0.25, pz + 0.5, C.woodL);
  }
  AF.res.lines.push({ x: cx, y: y + 0.06, z: cz, rot: alongZ ? Math.PI / 2 : 0, g, ph: seed * 1.7 });
};
AF.res.laundryLine = laundryLine;
// long washing lines strung ACROSS a street between facing facades (Bay St), with iron pulley brackets at both walls
const LGL = new Map();
const laundryGeoLong = (len, s) => {
  const k = len + '|' + s; if (LGL.has(k)) return LGL.get(k);
  const col = AF.col, line = col(0xe8e4dc, {}), peg = col(0x8a6a4a, {});
  const cl = [0xf4f2ec, 0xc83a32, 0x8ab0d8, 0xf0d070, 0xe8a0b0, 0x6a9a5a, 0xf4f2ec, 0x3a5a8a, 0xd8c8a8, 0xffffff].map((h) => col(h, { jitter: 0.15, edge: 0.1, solid: false }));
  const Lp = Math.round(len * 16), m = new AF.Model(Lp, 18, 2);
  const sagY = (x) => 17 - Math.round(Math.sin((x / Lp) * Math.PI) * 2);
  for (let x = 0; x < Lp; x++) m.set(x, sagY(x), 0, line);
  let x = 10 + s * 3, i = s;
  while (x < Lp - 14) {
    const w = 7 + ((i * 5) % 7), hh = 6 + ((i * 3 + s) % 8), c = cl[(i * 3 + s) % cl.length], yt = sagY(x + (w >> 1));
    if (i % 5 === 1) { m.box(x, yt - hh, 0, x + w, yt, 1, c); m.box(x + 2, yt - hh, 0, x + w - 2, yt - hh + 3, 1, 0); }
    else if (i % 5 === 2) { m.box(x, yt - hh, 0, x + w, yt, 1, c); m.box(x - 2, yt - 4, 0, x, yt, 1, c); m.box(x + w, yt - 4, 0, x + w + 2, yt, 1, c); }
    else if (i % 5 === 4) { m.box(x, yt - 3, 0, x + 3, yt, 1, c); m.box(x + 5, yt - 3, 0, x + 8, yt, 1, c); }
    else m.box(x, yt - hh, 0, x + w, yt, 1, c);
    m.set(x + 1, yt, 0, peg); m.set(x + w - 2, yt, 0, peg);
    x += w + 3 + (i % 4); i++;
  }
  const g = AF.meshModel(m, { vs: 1 / 16, anchor: [0.5, 1, 0.5] });
  LGL.set(k, g); return g;
};
const streetLine = (x, y, z0, z1, seed) => {
  const C = AF.resKit.colours(), len = z1 - z0;
  for (const [a, b] of [[z0 - 0.25, z0 + 0.25], [z1 - 0.25, z1 + 0.25]]) { AF.W.fill(x - 0.125, y - 0.25, a, x + 0.125, y + 0.25, b, C.iron); AF.W.fill(x - 0.25, y, a, x + 0.25, y + 0.125, b, C.iron); }
  AF.res.lines.push({ x, y: y + 0.12, z: (z0 + z1) / 2, rot: Math.PI / 2, g: laundryGeoLong(len, seed % 3), ph: seed * 2.3, street: true });
};

// pocket park with hopscotch (rs-b4 courtyard), entered from Bay St through a gap in the south row
const pocketPark = (ix0, iz0, ix1, iz1, R) => {
  const RK = AF.resKit, C = RK.colours(), G = RK.geos();
  const col = AF.col, chalk = col(0xf4f0e6, { jitter: 0.05, edge: 0 }), chalkP = col(0xe89ab0, { jitter: 0.05, edge: 0 }), chalkB = col(0x8ab8e8, { jitter: 0.05, edge: 0 });
  AF.W.ground(ix0, iz0, ix1, iz1, 1, C.yard[1]);
  AF.W.paint(ix0 + 2, iz0 + 2, ix1 - 2, iz1 - 2, C.paving);
  // hopscotch squares
  const hx = q((ix0 + ix1) / 2), hz = iz0 + 8;
  AF.res.play = { hx, hz, jx: hx - 5.5, jz: hz + 3.5 };   // v3: jump-rope + hopscotch kids (animated in residential-dyn)
  const cells = [[0, 0], [0, 1], [-0.5, 2], [0.5, 2], [0, 3], [-0.5, 4], [0.5, 4], [0, 5], [0, 6]];
  for (const [a, b] of cells) {
    const x = hx + a * 1.25 - 0.5, z = hz + b * 1.0;
    AF.W.paint(x, z, x + 1.0, z + 0.25, chalk); AF.W.paint(x, z + 0.75, x + 1.0, z + 1.0, chalk); AF.W.paint(x, z, x + 0.25, z + 1.0, chalk); AF.W.paint(x + 0.75, z, x + 1.0, z + 1.0, chalk);
    AF.W.paint(x + 0.25, z + 0.25, x + 0.75, z + 0.75, (a + b) % 2 ? chalkP : chalkB);
  }
  AF.addSpot({ building: null, kind: 'play', x: hx, y: 0.25, z: hz + 2, yaw: 0 });
  AF.addSpot({ building: null, kind: 'play', x: hx + 1.2, y: 0.25, z: hz - 1, yaw: 0 });
  // benches, planter beds with little trees, a drinking fountain
  for (const [x, z, r] of [[ix0 + 2.8, iz0 + 6, 1], [ix0 + 2.8, iz0 + 12, 1], [ix1 - 2.8, iz0 + 6, 3], [ix1 - 2.8, iz0 + 12, 3], [hx - 4, iz1 - 3, 2], [hx + 4, iz1 - 3, 2]]) {
    AF.placeStatic(G.bench, x, 0.25, z, r, { collide: true });
    AF.addSpot({ building: null, kind: 'bench', x, y: 0.75, z, yaw: [0, Math.PI / 2, Math.PI, -Math.PI / 2][r] });
  }
  const leaf = [col(0xd9822b, { jitter: 0.8, edge: 0.3 }), col(0xc4452a, { jitter: 0.8, edge: 0.3 }), col(0xe6b33a, { jitter: 0.8, edge: 0.3 })], bark = col(0x5d4430, { jitter: 0.6 });
  for (const [tx, tz] of [[ix0 + 4, iz1 - 4], [ix1 - 4, iz1 - 4], [ix0 + 4, iz0 + 18], [ix1 - 4, iz0 + 18]]) {
    AF.W.fill(tx - 1, 0.25, tz - 1, tx + 1, 0.75, tz + 1, C.stone[3]); AF.W.fill(tx - 0.75, 0.75, tz - 0.75, tx + 0.75, 0.75, tz + 0.75, 0);
    AF.W.fill(tx - 0.25, 0.75, tz - 0.25, tx + 0.25, 3.5, tz + 0.25, bark);
    for (let x = -2; x <= 2; x += 0.25) for (let y = 0; y <= 3; y += 0.25) for (let z = -2; z <= 2; z += 0.25) { const d = (x * x + (y - 1.5) * (y - 1.5) * 1.6 + z * z); if (d < 3.8 && RK.hash(x * 8 + tx, y * 8, z * 8 + tz) < 0.8) AF.W.fill(tx + x, 3.25 + y, tz + z, tx + x + 0.25, 3.5 + y, tz + z + 0.25, leaf[(RK.hash(x * 4, y * 4, z * 4) * 3) | 0]); }
  }
  // swings (voxel frame)
  const fr = col(0x3a7ab0, { jitter: 0.15 });
  const sx = hx + 6, sz = iz0 + 6;
  AF.W.fill(sx - 2, 0.25, sz, sx - 1.75, 3.25, sz + 0.25, fr); AF.W.fill(sx + 1.75, 0.25, sz, sx + 2, 3.25, sz + 0.25, fr); AF.W.fill(sx - 2, 3.25, sz, sx + 2, 3.5, sz + 0.25, fr);
  AF.addLabel('Lantern Pocket Park', hx, (iz0 + iz1) / 2, 'park');
  laundryLine(ix0 + 5, 5.2, iz0 + 1.5, 0, 31); laundryLine(ix1 - 5, 5.2, iz0 + 1.5, 0, 32);
};

// ============================================================ SPECIAL BUILDINGS (claim frontage on a face)
const SPECIAL = {};
// ENGINE CO. 7 — rs-b3, west face (Wren St)
SPECIAL['rs-b3'] = { w: { at: 3, w: 12, fn: (H, W, out) => fireStation(H, W, out) } };
// church — rs-g3 south face (Meridian Ave)
SPECIAL['rs-g3'] = { s: { at: 0, w: 13, fn: (H, W, out) => church(H, W, out) } };
// Mariner Court — rs-c5 south face (Harbour Blvd)
SPECIAL['rs-c5'] = { s: { at: 0, w: 27, fn: (H, W, out) => marinerCourt(H, W, out) } };
// rs-b4 pocket-park gate on the south face
SPECIAL['rs-b4'] = { s: { at: 1, w: 6, fn: (H, W, out) => parkGate(H, W, out) } };
SPECIAL['rs-b2'] = { s: { at: 0, w: 20, fn: (H, W, out) => school(H, W, out) } };
SPECIAL['rs-c4'] = { n: { at: 1, w: 6, fn: (H, W, out) => alley(H, W, out, 1) } };
SPECIAL['rs-g2'] = { n: { at: 1, w: 6, fn: (H, W, out) => alley(H, W, out, 2) } };
SPECIAL['rs-c5'].n = { at: 1, w: 6, fn: (H, W, out) => alley(H, W, out, 3) };
// rs-b5 roof-garden apartment block with pigeon coop — north face
SPECIAL['rs-b5'] = { n: { at: 0, w: 14, fn: (H, W, out) => rooftopBlock(H, W, out) } };

const fireStation = (H, W, out) => {
  const RK = AF.resKit, C = RK.colours(), G = RK.geos(), col = AF.col;
  const brick = C.bricks[0], red = C.redPaint, stone = C.stone[0], conc = col(0xb8b2a6, { jitter: 0.3, edge: 0.3 });
  const top = 0.25 + 4.75 + 4.0, D = RD;
  H.fill(0, 0.25, 0, W, top, D, brick.a);
  H.fill(0, 0.25, 0, W, 0.75, 0.25, C.stone[3]);
  // hollow apparatus floor (whole ground floor)
  // v3: glazed cream tile dado, a bottle-green tile band, painted upper walls, pressed-tin ceiling
  H.fill(0.25, 0.25, 0.25, W - 0.25, 4.75, D - 0.25, col(0xd6cfb4, { smooth: true }));
  H.fill(0.25, 0.25, 0.25, W - 0.25, 1.75, D - 0.25, col(0xe8e0c8, { pat: 'tile', rough: 0.3, jitter: 0.06 }));
  H.fill(0.25, 1.75, 0.25, W - 0.25, 2.0, D - 0.25, col(0x2c5a3c, { pat: 'tile', rough: 0.3, jitter: 0.06 }));
  H.fill(0.5, 0.25, 0.5, W - 0.5, 4.75, D - 0.5, 0);
  H.fill(0.5, 0.0, 0.25, W - 0.5, 0.25, D - 0.5, conc);            // floor slab flush with the sidewalk
  AF.W.ground(...(() => { const a = H.w(0.5, 0), b = H.w(W - 0.5, D - 0.5); return [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[0], b[0]), Math.max(a[1], b[1])]; })(), 1, conc);
  H.fill(0.5, 4.75, 0.5, W - 0.5, 5.0, D - 0.5, col(0xcfc6a8, { pat: 'panel', patTop: 'panel', rough: 0.5 }));
  for (let v = 1.5; v < D - 1; v += 3) H.fill(0.5, 4.5, v, W - 0.5, 4.75, v + 0.25, C.woodD);        // ceiling beams
  // two big doors: bay A (engine) u 1..5, bay B u 6.5..10.5 ; open with red leaves folded back
  const ba = q(W / 2 - 4.75), bb = q(W / 2 + 0.75);
  for (const [a, b] of [[ba, ba + 4.0], [bb, bb + 4.0]]) {
    H.fill(a, 0.25, 0, b, 4.25, 0.5, 0);
    H.fill(a - 0.25, 0.25, -0.25, a, 4.5, 0.25, stone); H.fill(b, 0.25, -0.25, b + 0.25, 4.5, 0.25, stone);
    H.fill(a - 0.25, 4.25, -0.25, b + 0.25, 4.75, 0.25, stone);
    H.fill(a, 0.25, 0.5, a + 0.25, 4.0, 2.25, red); H.fill(b - 0.25, 0.25, 0.5, b, 4.0, 2.25, red);   // leaves folded inside
    for (let y = 1.25; y < 4; y += 1.0) { H.fill(a, y, 0.75, a + 0.25, y + 0.5, 2.0, C.litGlass); H.fill(b - 0.25, y, 0.75, b, y + 0.5, 2.0, C.litGlass); }
  }
  // upper storey windows + the sign
  for (let u = 1.0; u < W - 1; u += 2.0) RK.windowAt(H, u, 5.75, 1.25, 2.25, 0, C.win[u % 4 < 2 ? 0 : 1], stone, stone);
  H.fill(0, 4.75, -0.25, W, 5.5, 0, red);
  H.place(RK.sign('ENGINE CO. 7', C.gold, red), W / 2, 4.75, -0.25, 0);
  { const neonG = AF.col(0xffe080, { emit: 0xffd060, emitK: 2.4, mode: 'always', jitter: 0, edge: 0 }), bulb = AF.col(0xfff4d0, { emit: 0xffe0a0, emitK: 3.0, mode: 'always', jitter: 0, edge: 0 });
    H.place(RK.sign('ENGINE CO. 7', neonG, red), W / 2, 4.75, -0.3, 0);
    for (const u of [1.5, W / 2, W - 1.5]) { H.fill(u - 0.125, 5.5, -0.75, u + 0.125, 5.75, 0, C.iron); H.fill(u - 0.125, 5.25, -0.75, u + 0.125, 5.5, -0.5, bulb); }
    const sp = H.w(W / 2, -1.0); AF.addLight({ x: sp[0], y: 5.2, z: sp[1], color: 0xffd8a0, intensity: 1.2, range: 9, kind: 'sign' });
    // red lamp over each bay
    const redL = AF.col(0xff3020, { emit: 0xff2010, emitK: 2.5, mode: 'always', jitter: 0 });
    for (const u of [ba + 2.0, bb + 2.0]) H.fill(u - 0.25, 4.25, -0.5, u + 0.25, 4.5, -0.25, redL); }
  H.fill(0, top - 0.5, -0.5, W, top, 0, stone); H.fill(0, top, 0, W, top + 0.75, 0.25, brick.a); H.fill(0, top + 0.75, -0.25, W, top + 1.0, 0.5, C.coping);
  H.fill(0.25, top - 0.25, 0.25, W - 0.25, top, D - 0.25, C.tar);
  // HOSE TOWER at the back-right corner: 3 x 3 m to 22 m, louvred top, flagpole
  const tu0 = W - 3.25, tv0 = D - 3.5, tt = 22;
  H.fill(tu0, top, tv0, tu0 + 3, tt, tv0 + 3, brick.b);
  for (let y = top + 1.5; y < tt - 3; y += 3) H.fill(tu0 + 1, y, tv0 - 0.0, tu0 + 2, y + 1.5, tv0 + 0.25, C.win[1]);
  for (let u = tu0; u < tu0 + 3; u += 0.5) H.fill(u, tt - 2.5, tv0 - 0.25, u + 0.25, tt - 0.5, tv0 + 3.25, C.woodD);
  H.fill(tu0 - 0.25, tt, tv0 - 0.25, tu0 + 3.25, tt + 0.5, tv0 + 3.25, red); H.fill(tu0 + 0.5, tt + 0.5, tv0 + 0.5, tu0 + 2.5, tt + 1.25, tv0 + 2.5, red);
  H.fill(tu0 + 1.375, tt + 1.25, tv0 + 1.375, tu0 + 1.625, tt + 4.5, tv0 + 1.625, C.iron);
  AF.res.flags.push({ p: H.w(tu0 + 1.5, tv0 + 1.5), y: tt + 4.4, yaw: H.yaw(1) });
  // brass pole from the ceiling hole at the back-left
  const pu = 1.25, pv = D - 1.5;
  H.fill(pu - 0.625, 4.75, pv - 0.625, pu + 0.625, 5.0, pv + 0.625, 0);
  H.fill(pu - 0.125, 0.25, pv - 0.125, pu + 0.125, 5.0, pv + 0.125, C.brass);
  H.fill(pu - 0.625, 0.25, pv - 0.625, pu + 0.625, 0.375 + 0.0, pv + 0.625, col(0x3a3a3a, {}));
  // gear: coats + helmets on hooks along the left wall, hose rack, boots, a desk
  const coat = col(0x2a2a26, { jitter: 0.2 }), helm = col(0xb02a22, { jitter: 0.1 }), stripe = col(0xe8d050, { jitter: 0.05 }), hose = col(0x8a8a78, { jitter: 0.3 });
  for (let v = 5; v < D - 3; v += 1.25) {
    H.fill(0.5, 1.0, v, 0.75, 2.25, v + 0.75, coat); H.fill(0.5, 1.25, v, 0.75, 1.5, v + 0.75, stripe);
    H.fill(0.5, 2.5, v + 0.125, 0.875, 2.75, v + 0.625, helm);
    H.fill(0.5, 0.25, v + 0.125, 0.875, 0.75, v + 0.625, coat);
  }
  H.fill(W - 0.75, 0.75, 5, W - 0.5, 3.0, 9, hose); H.fill(W - 0.875, 1.5, 5, W - 0.5, 2.25, 9, C.redPaint);
  H.place(G.shopCounter, W - 2.0, 0.25, D - 1.2, 2, { collide: true });
  H.place(G.hangLamp, 3.0, 4.75, 5, 0); H.place(G.hangLamp, 3.0, 4.75, 11, 0); H.place(G.hangLamp, W - 3.2, 4.75, 8, 0);
  // bay A centre (engine parks nose-out toward Wren St)
  const bc = H.w(ba + 2.0, 5.5);
  AF.res.bay = { x: bc[0], z: bc[1], y: 0.25, yaw: H.yaw(0), w: 4, l: 9 };
  AF.fireStationBays = [AF.res.bay];
  const doorP = H.w(ba + 2.0, -0.9);
  AF.addBuilding({ id: 'res-engine7', name: 'Engine Co. 7', kind: 'fire', box: H.box(0, 0, 0, W, tt, D), doors: [{ x: doorP[0], y: 0.25, z: doorP[1], yaw: H.yaw(2) }, (() => { const p = H.w(bb + 2.0, -0.9); return { x: p[0], y: 0.25, z: p[1], yaw: H.yaw(2) }; })()], floors: [0.25], interior: true });
  for (const [u, v, k] of [[W - 2.0, D - 2.0, 0], [W - 3.5, 7, 3], [2.0, 12, 1]]) { const p = H.w(u, v); AF.addSpot({ building: 'res-engine7', kind: k === 0 ? 'counter' : 'stand', x: p[0], y: 0.25, z: p[1], yaw: H.yaw(k), path: [doorP, H.w(W - 3.25, 3), p] }); }
  const lp = H.w(W / 2, 8); AF.addLight({ x: lp[0], y: 4, z: lp[1], color: 0xffd8a0, intensity: 1.3, range: 12, kind: 'interior' });
  // v3: bay B holds the old ladder truck; a dalmatian, a checkers game, the brass alarm bell, the duty board
  const FX = RK.fireKit && RK.fireKit();
  if (FX) {
    H.place(FX.ladder, bb + 2.0, 0.25, 5.2, 0, { collide: true });
    H.place(FX.bell, W / 2 - 0.6, 2.6, D - 0.55, 0);
    H.place(FX.board, W / 2 + 1.9, 1.2, D - 0.55, 0);
    H.place(FX.checkers, 3.2, 0.25, D - 3.2, 0, { collide: true });
    H.place(G.chair, 3.2, 0.25, D - 3.95, 2); H.place(G.chair, 3.2, 0.25, D - 2.45, 0);
    H.place(FX.helmetRack, W - 0.5, 1.9, 11.2, 3);
    H.place(FX.boots, bb + 0.5, 0.25, 11.2, 0); H.place(FX.boots, ba + 3.5, 0.25, 11.2, 0);
    for (const [u, v, k] of [[3.2, D - 3.95, 2], [3.2, D - 2.45, 0]]) { const p = H.w(u, v); AF.addSpot({ building: 'res-engine7', kind: 'sit', x: p[0], y: 0.75, z: p[1], yaw: H.yaw(k), path: [doorP, H.w(W / 2, 8), p] }); }
    { const p = H.w(bb + 0.9, 2.2); AF.addSpot({ building: 'res-engine7', kind: 'dog', x: p[0], y: 0.25, z: p[1], yaw: H.yaw(0) }); }
    { const p = H.w(bb + 2.0, 1.2); AF.addLight({ x: p[0], y: 4.2, z: p[1], color: 0xffd8a0, intensity: 1.2, range: 10, kind: 'interior' }); }
    H.place(G.hangLamp, bb + 2.0, 4.75, 2.25, 0); H.place(G.hangLamp, ba + 2.0, 4.75, 2.25, 0);
  }
  out.special = (out.special || []).concat('fire');
};

const church = (H, W, out) => {
  const RK = AF.resKit, C = RK.colours(), G = RK.geos(), col = AF.col;
  const brick = C.bricks[1], stone = C.stone[0], D = RD;
  const wallTop = 9, ridge = wallTop + W / 2 - 0.5;
  const slate = col(0x4a5058, { jitter: 0.4, edge: 0.4 }), slate2 = col(0x40464e, { jitter: 0.4, edge: 0.4 });
  // nave body (hollow), setback 2 m for a forecourt
  const sb = 2.5;
  H.ground(0, 0, W, sb, 1, C.paving);
  H.fill(0, 0.25, sb, W, wallTop, D, brick.a);
  H.fill(0.25, 0.5, sb + 0.25, W - 0.25, wallTop, D - 0.25, col(0xf0e8d4, { jitter: 0.1 }));
  H.fill(0.5, 0.5, sb + 0.5, W - 0.5, wallTop + 0.25, D - 0.5, 0);
  // gabled roof (stepped)
  for (let i = 0; i * 0.25 < W / 2 + 0.25; i++) {
    const y = wallTop + i * 0.25; const a = -0.25 + i * 0.25, b = W + 0.25 - i * 0.25; if (b <= a) break;
    H.fill(a, y, sb - 0.25, a + 0.25, y + 0.25, D + 0.25, i % 2 ? slate : slate2); H.fill(b - 0.25, y, sb - 0.25, b, y + 0.25, D + 0.25, i % 2 ? slate : slate2);
    H.fill(a + 0.25, y, sb, b - 0.25, y + 0.25, sb + 0.25, brick.a);   // front gable wall
    H.fill(a + 0.25, y, D - 0.25, b - 0.25, y + 0.25, D, brick.a);
  }
  H.fill(0.5, wallTop + 0.25, sb + 0.5, W - 0.5, wallTop + 0.5, D - 0.5, col(0x6a4a30, { jitter: 0.3 }));   // wooden ceiling
  // pointed-arch windows down the sides with stained glass
  const sg = [0xc83a3a, 0x3a6ac8, 0xe8c040, 0x4a9a5a, 0x8a4ac8].map((h) => col(h, { glass: true, jitter: 0.1, edge: 0, emit: h, emitK: 1.3, mode: 'night' }));
  for (let v = sb + 2.5; v < D - 1.5; v += 3) for (const [a, b2] of [[0, 0.5], [W - 0.5, W]]) {
    for (let y = 3; y < 7.5; y += 0.25) { const hw = y > 6.75 ? 0.25 : 0.5; H.fill(a, y, v + 0.5 - hw, b2, y + 0.25, v + 0.5 + hw, sg[((y * 4) | 0) % 5]); }
  }
  // front: door (open), rose window, steeple tower rising from the front centre
  const dc = W / 2;
  H.fill(dc - 1.0, 0.5, sb, dc + 1.0, 3.5, sb + 0.5, 0); H.fill(dc - 0.75, 3.5, sb, dc + 0.75, 3.75, sb + 0.5, 0);
  H.fill(dc - 1.25, 0.25, sb - 0.5, dc + 1.25, 0.5, sb, stone);
  H.fill(dc - 1.5, 0.5, sb - 0.25, dc - 1.0, 4.0, sb, stone); H.fill(dc + 1.0, 0.5, sb - 0.25, dc + 1.5, 4.0, sb, stone); H.fill(dc - 1.5, 4.0, sb - 0.25, dc + 1.5, 4.5, sb, stone);
  H.fill(dc + 1.0, 0.5, sb + 0.5, dc + 1.25, 3.5, sb + 1.75, C.doors[0]);
  for (let a = 0; a < 6.28; a += 0.2) for (let r = 0; r <= 1.25; r += 0.25) { const u = q(dc + Math.cos(a) * r), y = q(6.25 + Math.sin(a) * r); H.fill(u - 0.125, y, sb, u + 0.125, y + 0.25, sb + 0.25, r > 1.1 ? stone : sg[((a * 3 + r * 4) | 0) % 5]); }
  // tower (sits on the front, 3.5 x 3.5 m) + spire
  const tu0 = dc - 1.75, tv0 = sb - 1.0 < 0 ? 0 : sb - 1.0;
  const TT = 26.5;   // v2: tower to 26.5 m, belfry, copper spire to ~38 m, gold cross to ~40.5 m (Old Town's vertical accent)
  H.fill(tu0, wallTop - 1, tv0, tu0 + 3.5, TT, tv0 + 3.5, brick.b);
  for (const y of [12, 20.25]) H.fill(tu0 - 0.25, y, tv0 - 0.25, tu0 + 3.75, y + 0.25, tv0 + 3.75, stone);
  for (const y of [13.5]) { H.fill(tu0 + 1.25, y, tv0 - 0.0, tu0 + 2.25, y + 2.0, tv0 + 0.25, 0); H.fill(tu0 + 1.25, y, tv0 + 0.25, tu0 + 2.25, y + 2.0, tv0 + 0.5, sg[1]); }
  { const bell = col(0xc89a3a, { jitter: 0.1, edge: 0.3, metal: 0.8, rough: 0.35 });
    for (const [a0, a1, b0, b1] of [[tu0 + 1.0, tu0 + 2.5, tv0, tv0 + 0.25], [tu0 + 1.0, tu0 + 2.5, tv0 + 3.25, tv0 + 3.5], [tu0, tu0 + 0.25, tv0 + 1.0, tv0 + 2.5], [tu0 + 3.25, tu0 + 3.5, tv0 + 1.0, tv0 + 2.5]]) { H.fill(a0, 21.5, b0, a1, 25.0, b1, 0); for (let u = a0; u < a1; u += 0.5) H.fill(u, 21.5, b0, u + 0.25, 25.0, b1, C.woodD); }
    H.fill(tu0 + 0.25, 21.5, tv0 + 0.25, tu0 + 3.25, 25.0, tv0 + 3.25, 0); H.fill(dc - 0.625, 22.5, tv0 + 1.125, dc + 0.625, 24.0, tv0 + 2.375, bell); H.fill(dc - 0.125, 24.0, tv0 + 1.625, dc + 0.125, 25.0, tv0 + 1.875, C.iron); }
  H.fill(tu0 - 0.25, TT, tv0 - 0.25, tu0 + 3.75, TT + 0.5, tv0 + 3.75, stone);
  for (const [pu, pv] of [[tu0, tv0], [tu0 + 3.0, tv0], [tu0, tv0 + 3.0], [tu0 + 3.0, tv0 + 3.0]]) { H.fill(pu, TT + 0.5, pv, pu + 0.5, TT + 2.0, pv + 0.5, stone); H.fill(pu + 0.125, TT + 2.0, pv + 0.125, pu + 0.375, TT + 2.5, pv + 0.375, C.gold); }
  { const cu1 = C.copperR, cu2 = C.copperR2; for (let i = 0; i < 15; i++) { const r = 1.625 - i * 0.11; if (r <= 0.1) break; const rr = Math.max(0.125, Math.round(r * 8) / 8); H.fill(dc - rr, TT + 0.5 + i * 0.75, tv0 + 1.75 - rr, dc + rr, TT + 1.25 + i * 0.75, tv0 + 1.75 + rr, i % 3 ? cu1 : cu2); } }
  const CT = TT + 0.5 + 15 * 0.75;
  H.fill(dc - 0.125, CT, tv0 + 1.625, dc + 0.125, CT + 2.5, tv0 + 1.875, C.gold); H.fill(dc - 0.625, CT + 1.5, tv0 + 1.625, dc + 0.625, CT + 1.75, tv0 + 1.875, C.gold);
  // clock face on the tower
  const cf = col(0xf4efe0, { jitter: 0, emit: 0xfff0c0, emitK: 0.6, mode: 'night' });
  H.fill(dc - 0.75, 17.0, tv0 - 0.25, dc + 0.75, 18.5, tv0, cf); H.fill(dc - 0.125, 17.75, tv0 - 0.375, dc + 0.125, 18.25, tv0 - 0.25, C.iron);
  // interior: aisle runner, pews, altar, candles, lamps
  const runner = col(0x8a2a2a, { jitter: 0.15, edge: 0 });
  H.fill(dc - 0.75, 0.25, sb + 0.5, dc + 0.75, 0.5, D - 0.5, runner);
  H.fill(0.5, 0.25, sb + 0.5, dc - 0.75, 0.5, D - 0.5, C.floors[1][0]); H.fill(dc + 0.75, 0.25, sb + 0.5, W - 0.5, 0.5, D - 0.5, C.floors[1][0]);
  const pew = G.bench;
  const bid = 'res-church';
  const doorP = H.w(dc, -0.9);
  for (let v = sb + 2.5; v < D - 4.5; v += 1.25) for (const u of [dc - 2.9, dc + 2.9]) {
    H.fill(u - 1.5, 0.5, v, u + 1.5, 1.0, v + 0.5, C.wood); H.fill(u - 1.5, 1.0, v + 0.5, u + 1.5, 1.75, v + 0.75, C.wood);
    if (RK.hash(v * 4, u * 4) < 0.35) { const p = H.w(u, v + 0.25); AF.addSpot({ building: bid, kind: 'sit', x: p[0], y: 1.0, z: p[1], yaw: H.yaw(2), path: [doorP, H.w(dc, v + 0.25 - 0.5), p] }); }
  }
  H.fill(1.0, 0.5, D - 3.5, W - 1.0, 1.0, D - 0.5, C.stone[1]);        // chancel step
  H.fill(dc - 1.5, 1.0, D - 2.0, dc + 1.5, 2.0, D - 1.25, col(0xf4f0e6, { jitter: 0.05 })); H.fill(dc - 1.5, 1.75, D - 2.0, dc + 1.5, 2.0, D - 1.25, C.gold);
  const flame = col(0xffd070, { emit: 0xffb040, emitK: 2.5, mode: 'always', jitter: 0 });
  for (const u of [dc - 1.25, dc + 1.25]) { H.fill(u - 0.125, 2.0, D - 1.75, u + 0.125, 2.5, D - 1.5, C.cream); H.fill(u - 0.125, 2.5, D - 1.75, u + 0.125, 2.75, D - 1.5, flame); }
  H.fill(dc - 0.125, 2.0, D - 1.0, dc + 0.125, 4.5, D - 0.75, C.gold); H.fill(dc - 0.75, 3.75, D - 1.0, dc + 0.75, 4.0, D - 0.75, C.gold);
  for (const v of [sb + 4, sb + 8.5]) H.place(G.hangLamp, dc, wallTop + 0.25, v, 0);
  // v3: stained-glass colour patches on the floor + pew ends, votive racks, organ pipes on the chancel wall, a hymn board
  { const sgT = [0xe07a6a, 0x7a9ae0, 0xf0d070, 0x8ac890, 0xb08ae0].map((h) => col(h, { jitter: 0.08, edge: 0, emit: h, emitK: 0.4, mode: 'always' }));
    let i = 0; for (let v = sb + 2.5; v < D - 4.5; v += 3) for (const [a, b2] of [[0.5, 1.5], [W - 1.5, W - 0.5]]) { H.fill(a, 0.25, v + 1.0, b2, 0.5, v + 1.75, sgT[i % 5]); H.fill(a, 0.25, v + 1.75, b2, 0.5, v + 2.25, sgT[(i + 2) % 5]); i++; }
    const cup = col(0xa81e1e, { glass: true, jitter: 0.05, emit: 0xff6030, emitK: 1.4, mode: 'always' });
    for (const [a, b2] of [[0.75, 2.25], [W - 2.25, W - 0.75]]) { H.fill(a, 0.5, D - 4.75, b2, 1.25, D - 4.25, C.woodD); for (let u = a; u < b2; u += 0.25) H.fill(u, 1.25, D - 4.75, u + 0.25, 1.5, D - 4.5, ((u * 4) | 0) % 2 ? flame : cup); for (let u = a + 0.125; u < b2 - 0.25; u += 0.5) H.fill(u, 1.25, D - 4.5, u + 0.25, 1.5, D - 4.25, cup); }
    const pipe = col(0xd8c890, { metal: 0.8, rough: 0.3, jitter: 0.05 }), pipeD = col(0xa89860, { metal: 0.7, rough: 0.35, jitter: 0.05 });
    H.fill(0.5, 1.0, D - 3.25, 1.25, 2.5, D - 0.75, C.woodD);
    for (let v = D - 3.25, k = 0; v < D - 0.75; v += 0.25, k++) { const hgt = 5.0 + 1.75 * Math.sin(Math.PI * (v - (D - 3.25)) / 2.5); H.fill(0.5, 2.5, v, 0.75, q(hgt), v + 0.25, k % 2 ? pipeD : pipe); }
    H.fill(W - 0.75, 2.0, D - 5.25, W - 0.5, 3.25, D - 4.5, C.woodD); for (const y of [2.25, 2.75]) H.fill(W - 1.0, y, D - 5.0, W - 0.75, y + 0.25, D - 4.75, C.cream); }
  { const p = H.w(dc, D - 2.5); AF.addSpot({ building: bid, kind: 'stand', x: p[0], y: 1.0, z: p[1], yaw: H.yaw(0), path: [doorP, H.w(dc, 6), p] }); }
  const lp = H.w(dc, (sb + D) / 2); AF.addLight({ x: lp[0], y: 6, z: lp[1], color: 0xffd8a0, intensity: 1.2, range: 14, kind: 'interior' });
  AF.addBuilding({ id: bid, name: "St. Brendan's Church", kind: 'church', box: H.box(0, 0, 0, W, 41, D), doors: [{ x: doorP[0], y: 0.25, z: doorP[1], yaw: H.yaw(2) }], floors: [0.5], interior: true });
  out.special = (out.special || []).concat('church');
};

const marinerCourt = (H, W, out) => {
  const RK = AF.resKit, C = RK.colours(), G = RK.geos(), col = AF.col;
  const brick = C.bricks[7], trim = C.stone[3], corn = C.cornice[2], D = RD;
  const n = 5, top = 0.5 + n * SH, wing = 8;
  const court0 = wing, court1 = W - wing;
  // two wings flush to the street + the back range; the courtyard opens to the street behind a gate
  const wingS = { type: 'ten', n, brick, trim, cornice: corn, door: C.doors[1], seed: 501, corniceStyle: 2 };
  house(RK.sub(H, 0, wing, D), Object.assign({}, wingS, { fe: true, side: 'R' }));
  house(RK.sub(H, court1, wing, D), Object.assign({}, wingS, { seed: 503, fe: true, side: 'L', doorLeft: true }));
  // back range (behind the courtyard): v 9..16
  const B = { fill: (u0, y0, v0, u1, y1, v1, c) => H.fill(court0 + u0, y0, v0, court0 + u1, y1, v1, c) };
  const bw = court1 - court0;
  B.fill(0, 0.25, 9, bw, top, D, brick.a);
  B.fill(0, top - 0.5, 8.75, bw, top, 9, corn); B.fill(0, top, 9, bw, top + 0.75, 9.25, brick.a); B.fill(0, top + 0.75, 8.75, bw, top + 1.0, 9.5, C.coping);
  B.fill(0.25, top - 0.25, 9.25, bw - 0.25, top, D - 0.25, C.tar);
  for (let s = 0; s < n; s++) for (let u = 1.0; u < bw - 1; u += 2.25) { const f0 = 0.5 + s * SH; if (s === 0 && u > bw / 2 - 2 && u < bw / 2 + 1) continue; RK.windowAt(B, u, f0 + 0.75, 1.25, 2.0, 9, C.win[Math.floor(RK.hash(u * 4, s) * 5)], trim, trim); }
  // lobby (enterable) in the back range: open door, mailboxes, a bench, a lamp
  const lc = bw / 2;
  B.fill(lc - 3, 0.5, 9.5, lc + 3, 4.0, D - 0.5, 0); B.fill(lc - 3, 0.25, 9.5, lc + 3, 0.5, D - 0.5, C.tile[0]);
  for (let u = lc - 3; u < lc + 3; u += 0.5) for (let v = 9.5; v < D - 0.5; v += 0.5) if (((u + v) * 2 | 0) % 2) B.fill(u, 0.25, v, u + 0.5, 0.5, v + 0.5, C.tile[1]);
  B.fill(lc - 0.75, 0.5, 9, lc + 0.75, 3.0, 9.5, 0); B.fill(lc - 1.0, 3.0, 8.75, lc + 1.0, 3.5, 9.0, trim);
  const mbox = col(0xc8a050, { jitter: 0.15 });
  B.fill(lc - 2.75, 1.0, D - 0.75, lc - 0.75, 2.25, D - 0.5, mbox);
  const sub = RK.sub(H, court0, bw, D);
  sub.place(G.bench, lc + 1.8, 0.5, D - 1.0, 0, { collide: true });
  sub.place(G.hangLamp, lc, 4.0, 12.5, 0);
  // stair up the back (visual)
  for (let i = 1; i <= 12; i++) B.fill(lc + 1.25, 0.5, D - 0.5 - i * 0.25 - 0.5, lc + 2.75, 0.5 + i * 0.25, D - 0.5 - (i - 1) * 0.25 - 0.5, C.stair[i & 1]);
  // courtyard: paving, fountain basin, planters, benches, gate arch with name
  H.ground(court0, 0, court1, 9, 1, C.paving);
  const fc = court0 + bw / 2;
  H.fill(fc - 1.5, 0.25, 3.5, fc + 1.5, 0.75, 6.5, trim); H.fill(fc - 1.25, 0.5, 3.75, fc + 1.25, 0.75, 6.25, col(0x5a8aa8, { glass: true, jitter: 0.1 }));
  H.fill(fc - 0.25, 0.75, 4.75, fc + 0.25, 1.75, 5.25, trim); H.fill(fc - 0.5, 1.75, 4.5, fc + 0.5, 2.0, 5.5, trim);
  for (const u of [court0 + 1, court1 - 2.5]) { H.fill(u, 0.25, 1.5, u + 1.5, 0.75, 7.5, C.stone[1]); H.fill(u + 0.25, 0.75, 1.75, u + 1.25, 1.25, 7.25, C.hedge || col(0x4f7a3a, { jitter: 0.9 })); }
  for (const [u, k] of [[court0 + 3.2, 1], [court1 - 3.2, 3]]) { sub.place(G.bench, u - court0, 0.25, 6, k, { collide: true }); const p = H.w(u, 6); AF.addSpot({ building: null, kind: 'bench', x: p[0], y: 0.75, z: p[1], yaw: H.yaw(k) }); }
  // gate arch at the street line
  H.fill(court0, 0.25, 0, court0 + 0.75, 5.5, 0.75, trim); H.fill(court1 - 0.75, 0.25, 0, court1, 5.5, 0.75, trim);
  H.fill(court0, 5.5, 0, court1, 6.5, 0.75, trim);
  for (let u = court0 + 0.75; u < court1 - 0.75; u += 0.5) { if (u > fc - 1.5 && u < fc + 1.5) continue; H.fill(u, 0.25, 0.25, u + 0.25, 2.0, 0.5, C.iron); }
  H.fill(court0 + 0.75, 1.75, 0.25, court1 - 0.75, 2.0, 0.5, C.iron);
  H.place(RK.sign('MARINER COURT', C.gold, C.signBg[0]), fc, 5.6, -0.1, 0);
  const doorP = H.w(fc, -0.9);
  AF.addBuilding({ id: 'res-mariner', name: 'Mariner Court', kind: 'apartments', box: H.box(0, 0, 0, W, top + 1, D), doors: [{ x: doorP[0], y: 0.25, z: doorP[1], yaw: H.yaw(2) }], floors: [0.5], interior: true });
  { const p = H.w(court0 + lc, 13); AF.addSpot({ building: 'res-mariner', kind: 'stand', x: p[0], y: 0.5, z: p[1], yaw: H.yaw(0), path: [doorP, H.w(fc, 7.5), H.w(court0 + lc, 8.5), p] });
    AF.addLight({ x: p[0], y: 3.2, z: p[1], color: 0xffd090, intensity: 1.0, range: 8, kind: 'interior' }); }
  // roof: water tanks on both wings
  for (const u of [wing / 2, W - wing / 2]) H.place(G.waterTank, u, top, D - 3, 0, { collide: true });
  out.special = (out.special || []).concat('mariner');
};

const school = (H, W, out) => {
  const RK = AF.resKit, C = RK.colours(), G = RK.geos(), col = AF.col;
  const brick = C.bricks[5], stone = C.stone[0], D = 11, fy = 0.5, top = fy + 2 * 4.25;
  H.fill(0, 0.25, 0, W, top, D, brick.a);
  H.fill(0, 0.25, 0, W, 0.75, 0.25, C.stone[3]); H.fill(0, fy + 4.25 - 0.25, -0.25, W, fy + 4.25, 0.25, stone);
  // parapet with a pediment + bell cupola
  H.fill(0.25, top - 0.25, 0.25, W - 0.25, top, D - 0.25, C.tar); H.fill(0, top, 0, W, top + 0.75, 0.25, brick.a); H.fill(0, top + 0.75, -0.25, W, top + 1.0, 0.5, C.copingL);
  H.fill(0, top - 0.5, -0.5, W, top, 0, stone); H.fill(0, top, D - 0.25, W, top + 0.5, D, brick.b);
  for (let i = 0; i < 6; i++) H.fill(W / 2 - 3 + i * 0.5, top + 1.0 + i * 0.25, 0, W / 2 + 3 - i * 0.5, top + 1.25 + i * 0.25, 0.25, i === 5 ? stone : brick.a);
  const cu = W / 2, cv = 4;
  for (const [a, b2] of [[-1, -0.75], [0.75, 1]]) for (const [c, d] of [[-1, -0.75], [0.75, 1]]) H.fill(cu + a, top, cv + c, cu + b2, top + 2.5, cv + d, C.cornice[0]);
  H.fill(cu - 1.25, top + 2.5, cv - 1.25, cu + 1.25, top + 2.75, cv + 1.25, C.cornice[0]);
  for (let i = 0; i < 5; i++) { const r = 1.25 - i * 0.25; H.fill(cu - r, top + 2.75 + i * 0.25, cv - r, cu + r, top + 3.0 + i * 0.25, cv + r, C.cornice[2]); }
  const bell = col(0xc89a3a, { jitter: 0.1, edge: 0.3 });
  H.fill(cu - 0.375, top + 1.0, cv - 0.375, cu + 0.375, top + 1.75, cv + 0.375, bell); H.fill(cu - 0.125, top + 1.75, cv - 0.125, cu + 0.125, top + 2.5, cv + 0.125, C.iron);
  // interior: one big classroom on the ground floor
  const wall = col(0xf0e8d0, { jitter: 0.1 }), wains = col(0x8a6a4a, { jitter: 0.25 });
  H.fill(0.25, fy, 0.25, W - 0.25, fy + 3.75, D - 0.25, wall); H.fill(0.25, fy, 0.25, W - 0.25, fy + 1.0, D - 0.25, wains);
  H.fill(0.5, fy, 0.5, W - 0.5, fy + 3.75, D - 0.5, 0);
  H.fill(0.5, fy + 3.75, 0.5, W - 0.5, fy + 4.0, D - 0.5, C.ceil);
  for (let u = 0.5, i = 0; u < W - 0.5; u += 0.5, i++) H.fill(u, fy - 0.25, 0.5, u + 0.5, fy, D - 0.5, C.floors[2][i & 1]);
  // tall windows front + upper storey windows, door with steps and a name
  const dc = W / 2;
  for (let u = 1.0; u < W - 1; u += 2.25) { if (Math.abs(u + 0.75 - dc) < 1.6) continue; RK.windowAt(H, u, fy + 0.75, 1.5, 2.75, 0, C.litGlass, stone, stone); RK.windowAt(H, u, fy + 4.25 + 0.75, 1.5, 2.5, 0, C.win[(u | 0) % 2], stone, stone); }
  H.fill(dc - 0.75, fy, 0, dc + 0.75, fy + 2.75, 0.5, 0); H.fill(dc - 1.25, fy + 2.75, -0.5, dc + 1.25, fy + 3.25, 0, stone); H.fill(dc - 1.0, 0.25, -0.25, dc + 1.0, 0.5, 0, stone);
  H.fill(dc + 0.75, fy, 0.5, dc + 1.0, fy + 2.5, 1.75, C.doors[1]);
  H.place(RK.sign('OLD TOWN SCHOOL', C.gold, C.signBg[2]), dc, fy + 4.25 + 3.1, -0.3, 0);
  // blackboard on the back wall, teacher's desk, rows of desks, flag, globe, clock
  const board = col(0x2a4a3a, { jitter: 0.1 }), chalk = col(0xf0f0e8, {});
  H.fill(2, fy + 1.0, D - 0.75, W - 2, fy + 2.75, D - 0.5, board); H.fill(2, fy + 0.875, D - 1.0, W - 2, fy + 1.0, D - 0.5, C.woodL);
  for (let u = 3; u < W - 3; u += 1.5) H.fill(u, fy + 2.0, D - 0.875, u + 0.75, fy + 2.25, D - 0.75, chalk);
  H.place(G.shopCounter, dc, fy, D - 2.2, 2, { collide: true });
  const desk = (() => { const m = new AF.Model(6, 7, 7), w = C.woodL, ir = C.iron; m.box(0, 5, 0, 6, 6, 4, w); m.box(0, 0, 0, 1, 5, 1, ir); m.box(5, 0, 0, 6, 5, 1, ir); m.box(0, 0, 3, 6, 1, 4, ir); m.box(1, 3, 5, 5, 4, 7, w); m.box(1, 4, 6, 5, 7, 7, w); m.box(1, 0, 5, 2, 3, 6, ir); m.box(4, 0, 5, 5, 3, 6, ir); return AF.meshModel(m, { vs: 1 / 8 }); })();
  const bid = 'res-school', doorP = H.w(dc, -0.9);
  for (let v = 2.0; v < D - 4; v += 1.6) for (let u = 2.2; u < W - 1.5; u += 1.7) { if (Math.abs(u - dc) < 1.0) continue; H.place(desk, u, fy, v, 2, { collide: true }); if (RK.hash(u * 4, v * 4) < 0.35) { const p = H.w(u, v + 0.6); AF.addSpot({ building: bid, kind: 'sit', x: p[0], y: fy + 0.5, z: p[1], yaw: H.yaw(2), path: [doorP, H.w(dc, 1.5), H.w(u, 1.2), p] }); } }
  { const p = H.w(dc, D - 1.4); AF.addSpot({ building: bid, kind: 'work', x: p[0], y: fy, z: p[1], yaw: H.yaw(0), path: [doorP, H.w(dc, 1.5), H.w(dc + 2, D - 1.4), p] }); }
  H.fill(1.0, fy, D - 1.25, 1.125, fy + 2.5, D - 1.125, C.brass); H.fill(1.125, fy + 1.75, D - 1.25, 1.75, fy + 2.5, D - 1.125, C.redPaint);
  H.fill(W - 1.5, fy + 3.0, D - 0.75, W - 1.0, fy + 3.5, D - 0.5, col(0xf4efe0, {}));
  for (const u of [W * 0.3, W * 0.7]) H.place(RK.geos().trade.globeLamp, u, fy + 3.75, D / 2, 0);
  { const p = H.w(dc, D / 2); AF.addLight({ x: p[0], y: fy + 3, z: p[1], color: 0xffe0b0, intensity: 1.2, range: 12, kind: 'interior' }); }
  AF.addBuilding({ id: bid, name: 'Old Town School', kind: 'school', box: H.box(0, 0, 0, W, top + 5, D), doors: [{ x: doorP[0], y: 0.25, z: doorP[1], yaw: H.yaw(2) }], floors: [fy], interior: true });
  AF.addInteract({ x: H.w(dc, -0.5)[0], y: 1, z: H.w(dc, -0.5)[1], r: 2.5, label: 'Ring the school bell', act: () => { AF.emit('toast', 'Clang! Clang! The Old Town School bell rings out.'); } });
  // playground behind: v 11..16 (asphalt, hopscotch, a see-saw, a swing, a fence)
  const asph = col(0x6a6a6a, { jitter: 0.4, edge: 0.3 }), chalkP = col(0xe89ab0, { edge: 0 }), chalkB = col(0x8ab8e8, { edge: 0 });
  H.ground(0, D, W, RD, 1, asph);
  for (let i = 0; i < 6; i++) { const u = 2 + (i % 2) * 1.0 + (i > 3 ? 0.5 : 0), v = D + 0.5 + i * 0.75; H.ground(u, v, u + 0.75, v + 0.5, 1, i % 2 ? chalkP : chalkB); }
  const fr = col(0x3a7ab0, { jitter: 0.15 }), seat = col(0xc8322a, {});
  const su = W - 5; H.fill(su, 0.25, D + 1.5, su + 0.25, 3.0, D + 1.75, fr); H.fill(su + 3, 0.25, D + 1.5, su + 3.25, 3.0, D + 1.75, fr); H.fill(su, 3.0, D + 1.5, su + 3.25, 3.25, D + 1.75, fr);
  H.fill(su + 1.0, 0.75, D + 1.25, su + 2.25, 1.0, D + 2.0, seat);
  H.fill(W / 2 - 2, 0.25, D + 3.0, W / 2 + 2, 0.5, D + 3.25, seat); H.fill(W / 2 - 0.125, 0.25, D + 2.75, W / 2 + 0.125, 0.75, D + 3.5, C.iron);
  for (let u = 0; u < W; u += 0.5) H.fill(u, 0.25, RD - 0.25, u + 0.25, 2.0, RD, C.iron); H.fill(0, 2.0, RD - 0.25, W, 2.25, RD, C.iron);
  for (const u of [4, 7]) { const p = H.w(u, D + 2.5); AF.addSpot({ building: null, kind: 'play', x: p[0], y: 0.25, z: p[1], yaw: 0 }); }
  out.special = (out.special || []).concat('school');
};

const alley = (H, W, out, k) => {
  const RK = AF.resKit, C = RK.colours(), G = RK.geos();
  H.ground(0, 0, W, RD, 1, C.cobble);
  H.place(G.trash, 0.6, 0.25, 4, 0, { collide: true }); H.place(G.trash, 0.6, 0.25, 4.8, 0, { collide: true }); H.place(G.trash, W - 0.6, 0.25, 9, 0, { collide: true });
  H.place(G.bike[k % 3], W - 0.5, 0.25, 6, 1);
  for (let u = 0; u < W; u += 0.5) H.fill(u, 0.25, RD - 0.25, u + 0.25, 1.75, RD, C.iron); H.fill(0, 1.75, RD - 0.25, W, 2.0, RD, C.iron);
  const along = H.face === 'n' || H.face === 's' ? 0 : 1;
  for (const [v, y, sd] of [[2.5, 8.2, k * 3], [5.0, 10.6, k * 3 + 1], [8.5, 6.4, k * 3 + 2]]) {
    const c = H.w(W / 2, v); laundryLine(c[0], y, c[1], along, sd, 0, true);
    for (const u of [0, W - 0.25]) H.fill(u, y - 0.25, v - 0.125, u + 0.25, y + 0.25, v + 0.125, C.iron);
  }
  AF.res.alleys.push({ p: H.w(W / 2, 0), out: H.w(W / 2, -12), yaw: H.yaw(2) });
  const cp = H.w(W / 2, 11); AF.addSpot({ building: null, kind: 'cat', x: cp[0], y: 1.0, z: cp[1], yaw: H.yaw(0) });
  H.place(G.crates, 1.2, 0.25, 10.5, 1, { collide: true });
};

const parkGate = (H, W, out) => {
  const RK = AF.resKit, C = RK.colours();
  H.ground(0, 0, W, RD, 1, C.paving);
  H.fill(0, 0.25, 0, 0.5, 2.5, 0.5, C.stone[3]); H.fill(W - 0.5, 0.25, 0, W, 2.5, 0.5, C.stone[3]);
  H.fill(0, 2.5, 0, W, 3.0, 0.5, C.iron);
  H.place(RK.sign('POCKET PARK', C.cream, C.signBg[0]), W / 2, 3.0, 0.0, 0);
  { const chalk = AF.col(0xf4f0e6, { jitter: 0.05, edge: 0 }), cp = AF.col(0xe89ab0, { jitter: 0.05, edge: 0 }), cb = AF.col(0x8ab8e8, { jitter: 0.05, edge: 0 });
    const cells = [[0, 0], [0, 1], [-0.5, 2], [0.5, 2], [0, 3], [-0.5, 4], [0.5, 4], [0, 5]];
    for (const [a2, b2] of cells) { const u = W / 2 - 1.5 + b2 * 0.75, v = -1.75 + a2 * 0.75; const p0 = H.w(u, v), p1 = H.w(u + 0.75, v + 0.75); AF.W.paint(Math.min(p0[0], p1[0]), Math.min(p0[1], p1[1]), Math.max(p0[0], p1[0]), Math.max(p0[1], p1[1]), (a2 + b2) % 2 ? cp : cb); }
    const q0 = H.w(W / 2 - 1.75, -2.25), q1 = H.w(W / 2 + 2.5, -2.0); AF.W.paint(Math.min(q0[0], q1[0]), Math.min(q0[1], q1[1]), Math.max(q0[0], q1[0]), Math.max(q0[1], q1[1]), chalk);
    const kp = H.w(W / 2 + 1, -1.5); AF.addSpot({ building: null, kind: 'play', x: kp[0], y: 0.25, z: kp[1], yaw: 0 }); }
  // side walls of the neighbours are exposed: paint a ghost sign strip
  H.fill(0, 0.25, 0.5, 0.25, 6, RD, C.bricks[4].a); H.fill(W - 0.25, 0.25, 0.5, W, 6, RD, C.bricks[4].a);
};

const rooftopBlock = (H, W, out) => {
  const RK = AF.resKit, C = RK.colours(), G = RK.geos(), col = AF.col;
  const S = { type: 'ten', n: 6, brick: C.bricks[2], trim: C.stone[0], cornice: C.cornice[0], door: C.doors[3], seed: 777, fe: true, corniceStyle: 0, id: 'res-gull-apts' };
  const info = house(H, S);
  const top = info.top;
  // roof garden: planters, a pergola, deck chairs; pigeon coop
  const planter = col(0x8a5a3a, { jitter: 0.3 }), green = col(0x5f8a3e, { jitter: 0.9, edge: 0.2, solid: false }), flower = col(0xe86a8a, { jitter: 0.4, solid: false });
  for (let u = 1; u < W - 1; u += 2.5) { H.fill(u, top, 1.0, u + 1.5, top + 0.5, 1.75, planter); H.fill(u, top + 0.5, 1.0, u + 1.5, top + 1.0, 1.75, (u | 0) % 2 ? green : flower); }
  for (const [a, b] of [[2, 4], [W - 4, W - 2]]) for (const v of [3, 6]) H.fill(a, top, v, a + 0.25, top + 2.5, v + 0.25, C.woodL);
  H.fill(2, top + 2.5, 3, W - 2, top + 2.75, 6.25, C.woodL);
  for (let u = 2.5; u < W - 2; u += 0.75) H.fill(u, top + 2.75, 3, u + 0.25, top + 3.0, 6.25, green);
  H.place(G.bench, W / 2, top, 4.5, 0, { collide: true });
  { const p = H.w(W / 2, 4.5); AF.addSpot({ building: null, kind: 'sit', x: p[0], y: top + 0.5, z: p[1], yaw: H.yaw(0) }); }
  H.place(G.coop, W - 3, top, 10, 1, { collide: true });
  AF.res.coop = (() => { const p = H.w(W - 3, 10); return { x: p[0], y: top + 2.2, z: p[1] }; })();
  out.special = (out.special || []).concat('coop');
};

// ============================================================ BUILD
AF.res.flags = [];
AF.onBuild('residential', 301, () => {
  if (!AF.resKit || !AF.PLAN) return;
  const t0 = performance.now();
  const R = AF.rng(4242);
  const ids = ['rs-c4', 'rs-c5', 'rs-b2', 'rs-b3', 'rs-b4', 'rs-b5', 'rs-g2', 'rs-g3'];
  AF.res.blocks = [];
  ids.forEach((id, bi) => { const lot = AF.PLAN.lot(id); if (lot) AF.res.blocks.push(block(lot, bi, R)); });
  // washing strung across Bay St between the facing rows (8-12 m up)
  for (const [x, y, sd] of [[-224.5, 9.0, 1], [-213.5, 10.75, 2], [-201.5, 8.5, 3], [-189.5, 11.25, 4], [-181, 9.5, 8], [-139.5, 9.75, 5], [-126.5, 8.25, 6], [-113.5, 10.5, 7], [-100.5, 9.0, 9]]) streetLine(x, y, 72, 88, sd);
  // people on the stoops
  AF.res.stoops.forEach((s, i) => { if (i % 3 === 2) return; AF.addSpot({ building: null, kind: 'sit', x: s.p[0], y: s.y, z: s.p[1], yaw: s.yaw, stoop: true, path: s.path }); });
  AF.addLabel('Old Town', -202, -40, 'district');
  AF.addLabel('Eastside', 202, -80, 'district');
  AF.addViewpoint('Old Town', [-150, 32, 30], [-205, 4, 70]);
  AF.addViewpoint('Eastside', [150, 40, -20], [202, 4, -80]);
  AF.res.buildMs = Math.round(performance.now() - t0);
});

// dynamic: washing on the lines + flags (share geometry; animate only near the camera)
AF.onBuild('residential-dyn', 610, () => {
  if (!AF.res || !AF.scene) return;
  const grp = new THREE.Group(); grp.name = 'res-dyn'; AF.scene.add(grp);
  for (const L of AF.res.lines) {
    const m = AF.modelMesh(L.g); m.position.set(L.x, L.y, L.z); m.rotation.order = 'YXZ'; m.rotation.y = L.rot; m.castShadow = false;
    grp.add(m); L.mesh = m;
  }
  const col = AF.col, flagC = [col(0xc83a32, { jitter: 0.05 }), col(0xf4f0e6, { jitter: 0.05 }), col(0x2d4a8a, { jitter: 0.05 })];
  const fm = new AF.Model(16, 10, 1);
  for (let x = 0; x < 16; x++) for (let y = 0; y < 10; y++) fm.set(x, y, 0, (x < 6 && y >= 5) ? flagC[2] : (y % 2 ? flagC[0] : flagC[1]));
  const fg = AF.meshModel(fm, { vs: 1 / 12, anchor: [0, 1, 0.5] });
  { const pm = new AF.Model(6, 24, 6), Rd = AF.col(0xd8322a, { jitter: 0 }), Wt = AF.col(0xf4f2ec, { jitter: 0 }), B = AF.col(0x2d4a8a, { jitter: 0 });
    for (let y = 0; y < 24; y++) for (let x = 0; x < 6; x++) for (let z = 0; z < 6; z++) { if (Math.hypot(x - 2.5, z - 2.5) > 2.9) continue; const a = Math.atan2(z - 2.5, x - 2.5); const t = ((y / 4 + a / (Math.PI * 2) * 3) % 3 + 3) % 3; pm.set(x, y, z, t < 1 ? Rd : t < 2 ? Wt : B); }
    const pg = AF.meshModel(pm, { vs: 1 / 16, anchor: [0.5, 0, 0.5] });
    AF.res.poleMeshes = AF.res.poles.map((P) => { const m = AF.modelMesh(pg); m.position.set(P.p[0], P.y, P.p[1]); grp.add(m); return m; }); }
  for (const F of AF.res.flags) { const m = AF.modelMesh(fg); m.position.set(F.p[0], F.y, F.p[1]); m.rotation.y = F.yaw - Math.PI / 2; grp.add(m); F.mesh = m; F.base = m.rotation.y; }
  // v3 open hydrant on Bay St: a jet of water arcing into the gutter, a wet puddle, kids jumping in the spray
  try {
    const hy = ((AF.streets && AF.streets.noPark) || []).filter((n) => n.kind === 'hydrant' && n.z > 66 && n.z < 94 && n.x > -236 && n.x < -96).sort((a, b) => Math.abs(a.x + 196) - Math.abs(b.x + 196))[0];
    if (hy && AF.resKit.kids) {
      const dir = hy.z < 80 ? 1 : -1, gy = AF.surfaceBelow(hy.x, hy.z + dir * 3, 3, 6) || 0.25;
      const N = 240, dg = new THREE.BoxGeometry(0.07, 0.07, 0.07), dm = new THREE.MeshStandardMaterial({ color: 0xcfe8ff, emissive: 0x4a6a88, emissiveIntensity: 0.3, roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.62, depthWrite: false });
      const im = new THREE.InstancedMesh(dg, dm, N); im.castShadow = false; im.frustumCulled = false; grp.add(im);
      const R = AF.rng(777), drops = [];
      for (let i = 0; i < N; i++) { const vy = 2.6 + R() * 1.1; drops.push({ ph: R(), vz: 5.0 + R() * 2.0, vx: (R() - 0.5) * 0.9, vy, s: 0.6 + R() * 0.9, tl: (vy + Math.sqrt(vy * vy + 2 * 9.8 * 0.5)) / 9.8 }); }
      const pm = new THREE.Mesh(new THREE.PlaneGeometry(5.5, 4.2), new THREE.MeshStandardMaterial({ color: 0x1c2630, roughness: 0.06, metalness: 0.2, transparent: true, opacity: 0.55 }));
      pm.rotation.x = -Math.PI / 2; pm.position.set(hy.x, gy + 0.02, hy.z + dir * 3.4); pm.receiveShadow = true; grp.add(pm);
      const K = AF.resKit.kids(), kids = [];
      for (const [dx, dz, ki, yaw] of [[-1.3, 3.0, 0, 0.4], [1.2, 3.8, 1, -0.6], [-0.4, 4.8, 2, 2.8], [2.3, 2.6, 3, -1.3], [-2.4, 4.2, 1, 1.4]]) {
        const m = AF.modelMesh(K[ki]); m.position.set(hy.x + dx, gy, hy.z + dir * dz); m.rotation.y = yaw + (dir < 0 ? Math.PI : 0); grp.add(m); kids.push({ m, y: gy, ph: dx * 1.7 + dz });
      }
      AF.res.spray = { x: hy.x, y: 0.25 + 0.55, z: hy.z, dir, im, drops, kids, M: new THREE.Matrix4(), gy };
    }
  } catch (e) { console.warn('[residential] spray', e); }
  // v3 pocket-park play: two kids turning a skipping rope, one jumping; a hopscotch hopper
  try {
    const PL = AF.res.play, K = AF.resKit.kids && AF.resKit.kids();
    if (PL && K) {
      const gy = AF.surfaceBelow(PL.jx, PL.jz, 3, 6) || 0.25, mk = (ki, x, z, yaw) => { const m = AF.modelMesh(K[ki]); m.position.set(x, gy, z); m.rotation.y = yaw; grp.add(m); return m; };
      mk(1, PL.jx - 1.7, PL.jz, Math.PI / 2); mk(1, PL.jx + 1.7, PL.jz, -Math.PI / 2);
      const jumper = mk(3, PL.jx, PL.jz, 0), hop = mk(2, PL.hx, PL.hz, Math.PI);
      const rope = new THREE.InstancedMesh(new THREE.BoxGeometry(0.16, 0.035, 0.035), new THREE.MeshStandardMaterial({ color: 0xe8d8b0, roughness: 0.8 }), 20); rope.castShadow = false; rope.frustumCulled = false; grp.add(rope);
      AF.res.playDyn = { gy, jumper, hop, rope, M: new THREE.Matrix4(), PL };
    }
  } catch (e) { console.warn('[residential] play', e); }
  const SK = AF.resKit.shopKit && AF.resKit.shopKit();
  if (SK) for (const f of AF.res.fans) { const m = AF.modelMesh(SK.fan, { cast: false }); m.castShadow = false; m.position.set(f.x, f.y, f.z); grp.add(m); f.mesh = m; }
});
AF.onTick('residential-dyn', 330, (dt, t) => {
  if (!AF.res || !AF.camera) return;
  const cp = AF.camera.position;
  for (const L of AF.res.lines) {
    if (!L.mesh) continue;
    const d2 = (L.x - cp.x) ** 2 + (L.z - cp.z) ** 2;
    if (d2 > 160 * 160) continue;
    L.mesh.rotation.x = Math.sin(t * 1.6 + L.ph) * 0.16 + Math.sin(t * 3.7 + L.ph * 2) * 0.05 + 0.08;
  }
  for (const m of AF.res.poleMeshes || []) m.rotation.y = t * 2.5;
  const SP = AF.res.spray;
  if (SP && (SP.x - cp.x) ** 2 + (SP.z - cp.z) ** 2 < 120 * 120) {
    const M = SP.M, e = M.elements;
    for (let i = 0; i < SP.drops.length; i++) {
      const d = SP.drops[i], T = d.tl + 0.3, a = ((t / T + d.ph) % 1) * T;
      let sc = d.s, x, y, z;
      if (a < d.tl) { y = SP.y + d.vy * a - 4.9 * a * a; z = SP.z + SP.dir * d.vz * a; x = SP.x + d.vx * a; M.makeScale(sc * 0.8, sc * 1.4, sc * 2.2); }
      else { const b = a - d.tl; x = SP.x + d.vx * d.tl + d.vx * b * 3; z = SP.z + SP.dir * d.vz * d.tl + Math.sin(d.ph * 40) * b * 2; y = SP.gy + 0.04 + 1.6 * b - 9 * b * b; sc *= Math.max(0, 1 - b / 0.3); M.makeScale(sc, sc, sc); }
      e[12] = x; e[13] = Math.max(SP.gy + 0.03, y); e[14] = z; SP.im.setMatrixAt(i, M);
    }
    SP.im.instanceMatrix.needsUpdate = true;
    for (const k of SP.kids) { const j = Math.max(0, Math.sin(t * 5.2 + k.ph)); k.m.position.y = k.y + j * j * 0.32; }
  }
  const PD = AF.res.playDyn;
  if (PD && (PD.PL.jx - cp.x) ** 2 + (PD.PL.jz - cp.z) ** 2 < 110 * 110) {
    const th = t * 7.0, M = PD.M, e = M.elements, c = Math.cos(th), sn = Math.sin(th);
    for (let i = 0; i < 20; i++) { const u = (i + 0.5) / 20, r = Math.sin(Math.PI * u) * 1.05; M.identity(); e[12] = PD.PL.jx - 1.45 + 2.9 * u; e[13] = PD.gy + 0.95 + c * r; e[14] = PD.PL.jz + sn * r; PD.rope.setMatrixAt(i, M); }
    PD.rope.instanceMatrix.needsUpdate = true;
    const j = Math.max(0, -Math.cos(th + 0.9)); PD.jumper.position.y = PD.gy + j * j * 0.38;
    const hc = (t * 0.9) % 7, hi = Math.floor(hc), hf = hc - hi; PD.hop.position.z = PD.PL.hz + 0.5 + Math.min(6, hi + hf) ; PD.hop.position.y = PD.gy + Math.sin(Math.PI * hf) * 0.3;
  }
  for (const f of AF.res.fans) if (f.mesh && (f.x - cp.x) ** 2 + (f.z - cp.z) ** 2 < 60 * 60) f.mesh.rotation.y = t * 3.2 + f.ph;
  for (const F of AF.res.flags) if (F.mesh) F.mesh.rotation.y = F.base + Math.sin(t * 2.2 + F.p[0]) * 0.35;
});

// ============================================================ TESTS
AF.test('residential: >= 44 enterable homes/shops registered', () => {
  const n = AF.buildings.filter((b) => b.interior && /^res-/.test(b.id)).length;
  return { ok: n >= 44, info: n + ' residential interiors (' + AF.res.homes.filter((h) => !h.shop).length + ' homes, ' + AF.res.shops.length + ' shops) · build ' + AF.res.buildMs + ' ms' };
});
AF.test('residential: 5 random home doors walkable', () => {
  const R = AF.rng(99), bad = [], ds = AF.res.doors;
  if (ds.length < 5) return { ok: false, info: 'only ' + ds.length + ' doors' };
  for (let k = 0; k < 5; k++) {
    const d = ds[Math.floor(R() * ds.length)];
    const body = { x: d.door[0], y: 0.3, z: d.door[1], vy: 0, r: 0.3, h: 1.7, onGround: true };
    body.y = AF.surfaceBelow(body.x, body.z, 3) ?? 0.25;
    const dx = Math.sin(d.yaw), dz = Math.cos(d.yaw);
    for (let i = 0; i < 180; i++) AF.moveBody(body, dx * 0.05, dz * 0.05, 1 / 60, { step: 0.55 });
    const p = d.inside, got = Math.hypot(body.x - d.door[0], body.z - d.door[1]), need = Math.hypot(p[0] - d.door[0], p[1] - d.door[1]);
    if (got < need - 0.4) bad.push(d.id + ' stopped at ' + got.toFixed(1) + '/' + need.toFixed(1));
  }
  return { ok: bad.length === 0, info: bad.join(' | ') || '5/5 doors walk in' };
});
AF.test('residential: all doors walkable (>= 90%)', () => {
  const bad = [];
  for (const d of AF.res.doors) {
    const body = { x: d.door[0], y: 0.3, z: d.door[1], vy: 0, r: 0.3, h: 1.7, onGround: true };
    body.y = AF.surfaceBelow(body.x, body.z, 3) ?? 0.25;
    const dx = Math.sin(d.yaw), dz = Math.cos(d.yaw);
    for (let i = 0; i < 180; i++) AF.moveBody(body, dx * 0.05, dz * 0.05, 1 / 60, { step: 0.55 });
    const p = d.inside, got = Math.hypot(body.x - d.door[0], body.z - d.door[1]), need = Math.hypot(p[0] - d.door[0], p[1] - d.door[1]);
    if (got < need - 0.4) bad.push(d.id + '@' + d.door.map((v) => v.toFixed(1)).join(',') + ' ' + got.toFixed(1) + '/' + need.toFixed(1));
  }
  return { ok: bad.length <= AF.res.doors.length * 0.1, info: (AF.res.doors.length - bad.length) + '/' + AF.res.doors.length + ' ' + bad.join(' | ') };
});
AF.test('residential: an upstairs bedroom is reachable', () => {
  const h = AF.res.homes.find((x) => x.info.upstairs);
  if (!h) return { ok: false, info: 'no stair homes' };
  const U = h.info.upstairs;
  const body = { x: U.bottom[0], y: U.fy, z: U.bottom[1], vy: 0, r: 0.3, h: 1.7, onGround: true };
  const dx = U.top[0] - U.bottom[0], dz = U.top[1] - U.bottom[1], L = Math.hypot(dx, dz);
  for (let i = 0; i < 160; i++) AF.moveBody(body, dx / L * 0.04, dz / L * 0.04, 1 / 60, { step: 0.55 });
  const lx = U.land[0] - body.x, lz = U.land[1] - body.z, LL = Math.hypot(lx, lz) || 1;
  for (let i = 0; i < 40; i++) AF.moveBody(body, lx / LL * 0.04, lz / LL * 0.04, 1 / 60, { step: 0.55 });
  return { ok: body.y > U.y - 0.3, info: h.id + ' reached y ' + body.y.toFixed(2) + ' (bedroom floor ' + U.y + ')' };
});
AF.test('residential: stoop sitters + laundry + chimneys', () => {
  const st = AF.spots.filter((s) => s.stoop).length, ln = AF.res.lines.length;
  return { ok: st >= 20 && ln >= 16, info: st + ' stoop spots, ' + ln + ' laundry lines, fire bay ' + (AF.res.bay ? AF.res.bay.x.toFixed(1) + ',' + AF.res.bay.z.toFixed(1) : 'missing') };
});
}

} catch (e) { AF.partError('41-homes-2.js', e); }

