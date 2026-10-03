// ================================================================ 70-player.js
try {
// ===== 70-player: AF.avatar (parametric voxel people — the player + the friends), 'aerial' orbit camera + 'walk' modes  (OWNER: player) =====
// AF.player = {x,y,z,yaw, body, mesh, visible, setVisible(b), teleport(x,y,z,yaw), setLook(look)}
// AF.flyTo(pos, target, dur)  AF.interactTarget  AF.emit('interact', target)
{
  const PI = Math.PI;
  const V3 = () => new THREE.Vector3();
  const PL = AF.PL = AF.PL || {};

  // ------------------------------------------------------------------ AF.avatar: 1/16 m voxel people from a look
  // look = { skin, hair, hairStyle: 'short'|'fade'|'spiky'|'messy'|'long'|'wavy'|'bun'|'pony', glasses: hex|null, beard: hex|null, lips,
  //          top: { col, col2, style: 'tee'|'hoodie'|'cardigan'|'shirt'|'dress'|'vest', print: hex }, bottom: { col, style: 'jeans'|'joggers'|'shorts'|'skirt' },
  //          shoe, hat: null|'cap'|'straw', hatCol, female, height (1 = 1.75 m), extra: 'headphones'|'chain'|'bow'|null }
  const AV = AF.avatar = {};
  const geoCache = new Map();
  // every avatar part is authored at 1/16 m, then doubled to 1/32 m and given a fine detail pass (see FINE below)
  const cget = (key, fn, anchor, det) => { let g = geoCache.get(key); if (!g) { const m = up2(fn()); if (det) det(m); g = AF.meshModel(m, { vs: 1 / 32, anchor }); geoCache.set(key, g); } return g; };
  const up2 = (m) => { const o = new AF.Model(m.w * 2, m.h * 2, m.d * 2); for (let x = 0; x < m.w; x++) for (let y = 0; y < m.h; y++) for (let z = 0; z < m.d; z++) { const c = m.get(x, y, z); if (c) o.box(x * 2, y * 2, z * 2, x * 2 + 2, y * 2 + 2, z * 2 + 2, c); } return o; };
  const hsh = (x, y, z) => ((Math.imul(x, 73856093) ^ Math.imul(y, 19349663) ^ Math.imul(z, 83492791)) >>> 0);
  const shade = (hex, k) => { const f = (s) => Math.max(0, Math.min(255, Math.round(((hex >> s) & 255) * k))); return (f(16) << 16) | (f(8) << 8) | f(0); };
  const pal = (L) => {
    const c = (h, j = 0.15, e = 0.25) => AF.col(h, { jitter: j, edge: e });
    const top = L.top || {}, bot = L.bottom || {};
    return {
      skin: c(L.skin, 0.08, 0.15), skinS: c(shade(L.skin, 0.88), 0.08, 0.15), eye: c(0x2a211c, 0, 0), white: c(0xf6f1e6, 0.05, 0.1), blush: c(shade(L.skin, 0.92) | 0x200000, 0.05, 0.1),
      mouth: c(L.lips || shade(L.skin, 0.7), 0, 0.1), hair: c(L.hair, 0.3, 0.3), hairD: c(shade(L.hair, 0.8), 0.25, 0.3), hairL: c(shade(L.hair, 1.35) + 0x0a0806, 0.2, 0.3), brow: c(shade(L.hair, 0.7), 0.05, 0.1),
      nose: c(shade(L.skin, 0.93), 0.05, 0.15), lace: c(0xf4f1ea, 0.05, 0.1),
      top: c(top.col, 0.2, 0.3), topD: c(shade(top.col, 0.78), 0.15, 0.3), topL: c(shade(top.col, 1.12), 0.2, 0.3), top2: c(top.col2 ?? 0xf2eee2, 0.08, 0.2), print: c(top.print ?? top.col2 ?? 0xffffff, 0.05, 0.1),
      bot: c(bot.col, 0.25, 0.3), botD: c(shade(bot.col, 0.82), 0.2, 0.3), shoe: c(L.shoe ?? 0x6a4028, 0.2, 0.35), sole: c(shade(L.shoe ?? 0x6a4028, 0.5), 0.1, 0.2),
      glass: L.glasses != null ? c(L.glasses, 0.05, 0.1) : 0, lens: AF.col(0xcfe6f0, { glass: true, jitter: 0, edge: 0 }), beard: L.beard != null ? c(L.beard, 0.3, 0.3) : 0,
      hat: c(L.hatCol ?? 0x2d4270, 0.15, 0.3), hatD: c(shade(L.hatCol ?? 0x2d4270, 0.75), 0.1, 0.3), band: c(0xc0392b, 0.1, 0.2), gold: c(0xe8c050, 0.05, 0.2), phones: c(0x202024, 0.1, 0.2),
    };
  };
  const legModel = (L, C, side, bent) => {
    const skirt = L.bottom && L.bottom.style === 'skirt', shorts = L.bottom && L.bottom.style === 'shorts';
    const pant = (y) => skirt ? C.skin : shorts ? (y < 7 ? C.skin : C.bot) : C.bot;
    if (!bent) {
      const m = new AF.Model(4, 12, 6);
      for (let y = 3; y < 12; y++) m.box(0, y, 1, 4, y + 1, 5, pant(y));
      if (!skirt && !shorts) { m.box(0, 3, 1, 4, 4, 5, L.bottom.style === 'joggers' ? C.botD : C.botD); m.box(side > 0 ? 3 : 0, 5, 3, side > 0 ? 4 : 1, 12, 4, C.botD); }
      m.box(0, 0, 0, 4, 1, 6, C.sole); m.box(0, 1, 0, 4, 3, 6, C.shoe);
      return m;
    }
    // sitting: thigh forward (along +z), shin down from the knee
    const m = new AF.Model(4, 12, 11);
    for (let z = 0; z < 10; z++) m.box(0, 8, z, 4, 12, z + 1, z > 6 && skirt ? C.skin : pant(10));
    for (let y = 3; y < 8; y++) m.box(0, y, 6, 4, y + 1, 10, pant(y));
    m.box(0, 0, 5, 4, 1, 11, C.sole); m.box(0, 1, 5, 4, 3, 11, C.shoe);
    return m;
  };
  const torsoModel = (L, C) => {
    const w = L.female ? 8 : 9, m = new AF.Model(w, 9, 5), T = L.top || {}, st = T.style || 'tee', cx = w >> 1;
    m.box(0, 0, 0, w, 1, 5, L.bottom && L.bottom.style === 'skirt' ? C.bot : C.botD);
    m.box(0, 1, 0, w, 8, 5, C.top); m.box(0, 7, 0, w, 8, 5, C.topL);
    if (st === 'cardigan' || st === 'vest' || st === 'shirt') { m.box(cx - 1, 4, 4, cx + 1, 8, 5, st === 'vest' ? C.skin : C.top2); m.box(cx, 1, 4, cx + 1, 5, 5, C.topD); }
    if (st === 'hoodie') { m.box(0, 7, 0, w, 9, 1, C.topD); m.box(cx - 2, 3, 4, cx + 2, 5, 5, C.topD); m.set(cx - 1, 6, 4, C.top2); m.set(cx + 1, 6, 4, C.top2); }
    if (st === 'tee' || st === 'dress') m.box(cx - 1, 7, 4, cx + 1, 8, 5, C.skinS);
    if (st === 'dress') { m.box(0, 3, 0, w, 4, 5, C.top2); }
    if (T.print != null) { m.box(cx - 1, 4, 4, cx + 1, 6, 5, C.print); if (st === 'tee' || st === 'hoodie') m.set(cx, 5, 4, C.top); }
    if (L.female) { m.box(1, 5, 4, 3, 7, 5, C.topL); m.box(w - 3, 5, 4, w - 1, 7, 5, C.topL); }
    if (L.extra === 'chain') { m.set(cx - 1, 7, 4, C.gold); m.set(cx, 6, 4, C.gold); m.set(cx + 1, 7, 4, C.gold); }
    if (L.extra === 'guitar') { for (let k = 0; k < 7; k++) { m.set(1 + k, 8 - k, 4, C.sole); m.set(1 + k, 8 - k, 0, C.sole); } m.box(w - 4, 1, 0, w, 5, 1, C.gold); m.box(w - 3, 5, 0, w - 2, 9, 1, C.sole); }
    m.box(cx - 1, 8, 1, cx + 2, 9, 4, C.skinS);
    return m;
  };
  const armModel = (L, C) => {
    const st = (L.top && L.top.style) || 'tee', m = new AF.Model(3, 9, 3), bare = st === 'vest' || (st === 'dress' && !L.top.sleeves);
    const sleeveTo = st === 'tee' || st === 'dress' ? 6 : 2;
    m.box(0, 0, 0, 3, 9, 3, C.skin);
    if (!bare) { m.box(0, sleeveTo, 0, 3, 9, 3, C.top); m.box(0, 8, 0, 3, 9, 3, C.topL); if (sleeveTo === 2) m.box(0, 2, 0, 3, 3, 3, C.topD); }
    m.set(1, 0, 2, C.skinS);
    return m;
  };
  const headModel = (L, C) => {
    // skin cube x1..7, y4..10, z1..7 (y0..4 = long hair hanging below the jaw)
    const m = new AF.Model(10, 15, 10), Y = 4, hs = L.hairStyle || 'short', H = C.hair;
    const X = (x) => x + 1;
    m.box(X(1), Y, 2, X(7), Y + 6, 8, C.skin); m.box(X(1), Y, 2, X(7), Y + 1, 3, C.skinS);
    m.set(X(0), Y + 2, 5, C.skinS); m.set(X(0), Y + 3, 5, C.skinS); m.set(X(7), Y + 2, 5, C.skinS); m.set(X(7), Y + 3, 5, C.skinS);
    m.set(X(2), Y + 3, 7, C.eye); m.set(X(5), Y + 3, 7, C.eye); m.set(X(2), Y + 4, 7, H); m.set(X(5), Y + 4, 7, H);
    m.set(X(3), Y + 2, 8, C.skinS); m.set(X(4), Y + 2, 8, C.skinS);
    m.set(X(3), Y + 1, 7, C.mouth); m.set(X(4), Y + 1, 7, C.mouth);
    if (L.female) { m.set(X(1), Y + 2, 7, C.blush); m.set(X(6), Y + 2, 7, C.blush); m.set(X(1), Y + 4, 7, C.eye); m.set(X(6), Y + 4, 7, C.eye); }
    // hair
    const cap = (y0) => { m.box(X(1), y0, 2, X(7), Y + 7, 8, H); m.box(X(1), Y + 7, 3, X(7), Y + 8, 7, H); };
    if (hs === 'fade') { m.box(X(1), Y + 5, 2, X(7), Y + 7, 8, H); m.box(X(1), Y + 2, 2, X(7), Y + 5, 3, C.hairD); m.box(X(1), Y + 4, 2, X(2), Y + 5, 5, C.hairD); m.box(X(6), Y + 4, 2, X(7), Y + 5, 5, C.hairD); }
    else if (hs === 'spiky') { cap(Y + 5); m.box(X(1), Y + 2, 2, X(7), Y + 5, 3, H); for (let x = 1; x < 7; x += 2) m.box(X(x), Y + 8, 3 + (x % 3), X(x + 1), Y + 9, 5 + (x % 3), H); }
    else if (hs === 'messy') { cap(Y + 5); m.box(X(1), Y + 2, 2, X(7), Y + 5, 3, H); m.box(X(0), Y + 4, 3, X(1), Y + 7, 7, H); m.box(X(7), Y + 4, 3, X(8), Y + 7, 7, H); m.box(X(2), Y + 5, 8, X(6), Y + 6, 9, H); m.set(X(3), Y + 8, 5, H); m.set(X(5), Y + 8, 3, H); }
    else if (hs === 'long' || hs === 'wavy') {
      cap(Y + 5); m.box(X(1), Y + 5, 7, X(7), Y + 6, 8, H);                                   // fringe line
      m.box(X(0), Y - 3, 2, X(1), Y + 7, 7, H); m.box(X(7), Y - 3, 2, X(8), Y + 7, 7, H);   // sides down past the jaw
      m.box(X(1), Y - 4, 1, X(7), Y + 7, 3, H);                                              // back, to the shoulders
      if (hs === 'wavy') for (let y = Y - 3; y < Y + 5; y += 2) { m.set(X(0) - 1, y, 4, H); m.set(X(8), y, 4, H); }
      if (L.bangs) m.box(X(1), Y + 4, 8, X(7), Y + 6, 9, H);
    } else if (hs === 'bun') { cap(Y + 5); m.box(X(1), Y + 2, 2, X(7), Y + 5, 3, H); m.box(X(2), Y + 8, 3, X(6), Y + 11, 6, H); m.box(X(0), Y + 3, 3, X(1), Y + 6, 6, H); m.box(X(7), Y + 3, 3, X(8), Y + 6, 6, H); }
    else if (hs === 'pony') { cap(Y + 5); m.box(X(1), Y + 2, 2, X(7), Y + 5, 3, H); m.box(X(3), Y - 2, 0, X(5), Y + 6, 2, H); }
    else { cap(Y + 5); m.box(X(1), Y + 2, 2, X(7), Y + 5, 3, H); m.box(X(1), Y + 2, 2, X(2), Y + 5, 5, H); m.box(X(6), Y + 2, 2, X(7), Y + 5, 5, H); }
    // beard
    if (C.beard) { m.box(X(1), Y, 7, X(7), Y + 2, 8, C.beard); m.box(X(1), Y, 2, X(2), Y + 3, 7, C.beard); m.box(X(6), Y, 2, X(7), Y + 3, 7, C.beard); m.set(X(3), Y + 1, 8, C.mouth); m.set(X(4), Y + 1, 8, C.mouth); m.box(X(2), Y + 2, 8, X(6), Y + 2, 8, C.beard); m.set(X(2), Y + 2, 8, C.beard); m.set(X(5), Y + 2, 8, C.beard); }
    // glasses: frames round each eye + a bridge + arms to the ears
    if (C.glass) {
      for (const ex of [2, 5]) { m.set(X(ex - 1), Y + 3, 8, C.glass); m.set(X(ex + 1) - (ex === 5 ? 0 : 0), Y + 3, 8, C.glass); m.set(X(ex), Y + 4, 8, C.glass); m.set(X(ex), Y + 2, 8, C.glass); m.set(X(ex), Y + 3, 8, C.lens); }
      m.set(X(0), Y + 4, 7, C.glass); m.set(X(7), Y + 4, 7, C.glass); m.box(X(0), Y + 4, 3, X(1), Y + 5, 7, C.glass); m.box(X(7), Y + 4, 3, X(8), Y + 5, 7, C.glass);
    }
    // hats
    if (L.hat === 'cap') { m.box(X(1), Y + 5, 2, X(7), Y + 7, 8, C.hat); m.box(X(2), Y + 7, 3, X(6), Y + 8, 7, C.hat); m.box(X(1), Y + 5, 8, X(7), Y + 6, 10, C.hatD); m.set(X(3), Y + 7, 4, C.band); }
    if (L.hat === 'straw') { m.box(X(-1), Y + 6, 0, X(9), Y + 7, 10, C.hat); m.box(X(1), Y + 7, 2, X(7), Y + 9, 8, C.hat); m.box(X(1), Y + 7, 2, X(7), Y + 8, 8, C.band); }
    if (L.extra === 'headphones') { m.box(X(0), Y + 2, 4, X(1), Y + 4, 6, C.phones); m.box(X(7), Y + 2, 4, X(8), Y + 4, 6, C.phones); m.box(X(0), Y + 7, 4, X(8), Y + 8, 5, C.phones); }
    if (L.extra === 'bow') { m.box(X(2), Y + 7, 5, X(6), Y + 9, 6, C.band); }
    return m;
  };
  const skirtModel = (L, C) => {
    const m = new AF.Model(12, 7, 8);
    for (let y = 0; y < 7; y++) { const f = Math.floor((6 - y) / 3); m.box(2 - f, y, 1 - f, 10 + f, y + 1, 7 + f, y === 0 ? C.botD : C.bot); }
    for (let y = 2; y < 7; y++) m.box(3, y, 2, 9, y + 1, 6, 0);
    return m;
  };
  // ---- fine detail passes (coordinates in 1/32 m cells of the doubled models)
  const FINE = {
    head(m, L, C) {
      // hair: strand texture (light + dark flecks) on every hair cell
      for (let x = 0; x < m.w; x++) for (let y = 0; y < m.h; y++) for (let z = 0; z < m.d; z++) if (m.get(x, y, z) === C.hair) { const q = hsh(x, y >> 1, z) % 9; if (q === 0) m.set(x, y, z, C.hairL); else if (q < 3) m.set(x, y, z, C.hairD); }
      const F = 15;   // front face layer
      // eyes: white on the outer column, iris inside, a catch-light on top
      for (const [wx, ix] of [[6, 7], [13, 12]]) { m.set(wx, 14, F, C.white); m.set(wx, 15, F, C.white); m.set(ix, 14, F, C.eye); m.set(ix, 15, F, C.eye); m.set(ix, 16, F, C.skin); m.set(wx, 16, F, C.skin); }
      // brows: a thin arched line
      for (const [a, b] of [[5, 8], [12, 15]]) for (let x = a; x < b; x++) m.set(x, 17, F, C.brow);
      if (L.female) { m.set(5, 15, F, C.eye); m.set(14, 15, F, C.eye); m.set(4, 16, F, C.skin); m.set(4, 17, F, C.skin); m.set(15, 16, F, C.skin); m.set(15, 17, F, C.skin); }
      // nose: a narrow bridge with a shaded tip
      for (let x = 8; x < 12; x++) for (let y = 12; y < 14; y++) { m.set(x, y, F + 1, 0); m.set(x, y, F + 2, 0); }
      m.set(9, 13, F + 1, C.skin); m.set(10, 13, F + 1, C.skin); m.set(9, 12, F + 1, C.nose); m.set(10, 12, F + 1, C.nose);
      // mouth: a small smile (not under a beard)
      if (!C.beard) { for (let x = 8; x < 12; x++) { m.set(x, 11, F, C.skin); m.set(x, 10, F, C.skin); } m.set(9, 10, F, C.mouth); m.set(10, 10, F, C.mouth); m.set(8, 11, F, C.mouth); m.set(11, 11, F, C.mouth); }
      // ears: an inner fold
      for (const x of [2, 17]) { if (m.get(x, 13, 10)) m.set(x, 13, 10, C.nose); }
    },
    torso(m, L, C) {
      const T = L.top || {}, st = T.style || 'tee', w = m.w, cx = w >> 1, F = m.d - 1;
      // hem + side seams
      for (let x = 0; x < w; x++) { if (m.get(x, 2, F) === C.top) m.set(x, 2, F, C.topD); }
      for (let y = 3; y < 14; y++) { if (m.get(0, y, F) === C.top) m.set(0, y, F, C.topD); if (m.get(w - 1, y, F) === C.top) m.set(w - 1, y, F, C.topD); }
      // belt buckle (trousers only)
      if (!(L.bottom && L.bottom.style === 'skirt')) { m.set(cx - 1, 0, F, C.gold); m.set(cx, 0, F, C.gold); m.set(cx - 1, 1, F, C.gold); m.set(cx, 1, F, C.gold); }
      if (st === 'shirt' || st === 'cardigan') for (let y = 4; y < 14; y += 3) m.set(cx, y, F, st === 'cardigan' ? C.gold : C.topD);
      if (st === 'shirt') { m.set(cx - 3, 15, F, C.top2); m.set(cx + 2, 15, F, C.top2); m.set(cx - 2, 14, F, C.top2); m.set(cx + 1, 14, F, C.top2); }
      if (st === 'hoodie') { for (let y = 9; y < 14; y++) { m.set(cx - 2, y, F, C.top2); m.set(cx + 1, y, F, C.top2); } m.set(cx - 2, 8, F, C.gold); m.set(cx + 1, 8, F, C.gold); for (let x = cx - 4; x < cx + 4; x++) m.set(x, 10, F, C.topD); }
      if (st === 'tee' && T.print == null) for (let x = cx - 2; x < cx + 2; x++) m.set(x, 14, F, C.topD);
    },
    arm(m, L, C) {
      // fingers: shaded tips + a thumb; cuff line at the sleeve end
      for (let x = 0; x < m.w; x++) for (let z = 0; z < m.d; z++) if (m.get(x, 0, z) === C.skin) m.set(x, 0, z, C.skinS);
      for (let z = 1; z < m.d; z += 2) if (m.get(0, 1, z) === C.skin) m.set(0, 1, z, C.skinS);
      for (let y = 1; y < m.h; y++) { let cuff = false; for (let x = 0; x < m.w; x++) if (m.get(x, y, 0) === C.top && m.get(x, y - 1, 0) === C.skin) cuff = true; if (cuff) { for (let x = 0; x < m.w; x++) for (let z = 0; z < m.d; z++) if (m.get(x, y, z) === C.top) m.set(x, y, z, C.topD); break; } }
    },
    leg(m, L, C) {
      const F = m.d - 1;
      // laces over the instep + a toe cap
      for (let x = 2; x < m.w - 2; x += 2) if (m.get(x, 5, F - 1) === C.shoe) { m.set(x, 5, F - 1, C.lace); m.set(x + 1, 5, F - 2, C.lace); }
      for (let x = 0; x < m.w; x++) for (let y = 2; y < 4; y++) if (m.get(x, y, F) === C.shoe) m.set(x, y, F, C.sole);
      // denim / jogger detail: knee crease + hem
      const bs = L.bottom && L.bottom.style;
      if (bs === 'jeans' || bs === 'joggers') for (let x = 0; x < m.w; x++) { for (let z = 0; z < m.d; z++) if (m.get(x, 13, z) === C.bot) m.set(x, 13, z, C.botD); }
      if (bs === 'shorts') for (let x = 0; x < m.w; x++) for (let z = 0; z < m.d; z++) if (m.get(x, 14, z) === C.bot) m.set(x, 14, z, C.botD);
    },
    skirt(m, L, C) { for (let x = 0; x < m.w; x += 3) for (let y = 0; y < m.h; y++) for (let z = 0; z < m.d; z++) if (m.get(x, y, z) === C.bot) m.set(x, y, z, C.botD); },
  };
  AV.build = (L) => {
    const C = pal(L), key = JSON.stringify(L);
    const gLegL = cget('lL' + key, () => legModel(L, C, -1, false), [0.5, 1, 0.5], (m) => FINE.leg(m, L, C)), gLegR = cget('lR' + key, () => legModel(L, C, 1, false), [0.5, 1, 0.5], (m) => FINE.leg(m, L, C));
    const gBent = cget('lB' + key, () => legModel(L, C, 1, true), [0.5, 1, 2 / 11]);
    const gTorso = cget('t' + key, () => torsoModel(L, C), [0.5, 0, 0.5], (m) => FINE.torso(m, L, C));
    const gArm = cget('a' + key, () => armModel(L, C), [0.5, 1, 0.5], (m) => FINE.arm(m, L, C));
    const gHead = cget('h' + key, () => headModel(L, C), [0.5, 4 / 15, 0.5], (m) => FINE.head(m, L, C));
    const root = new THREE.Group(); root.name = 'avatar';
    const hips = new THREE.Group(); hips.position.y = 0.75; root.add(hips);
    const hw = L.female ? 0.11 : 0.125;
    const legL = AF.modelMesh(gLegL); legL.position.set(-hw, 0, 0); hips.add(legL);
    const legR = AF.modelMesh(gLegR); legR.position.set(hw, 0, 0); hips.add(legR);
    const chest = new THREE.Group(); chest.position.y = 0.02; hips.add(chest);
    const torso = AF.modelMesh(gTorso); torso.position.set(0, -0.02, 0); chest.add(torso);
    const sx = L.female ? 0.33 : 0.36;
    const armL = AF.modelMesh(gArm); armL.position.set(-sx, 0.46, 0); chest.add(armL);
    const armR = AF.modelMesh(gArm); armR.position.set(sx, 0.46, 0); chest.add(armR);
    const head = new THREE.Group(); head.position.set(0, 0.52, 0); chest.add(head);
    const headM = AF.modelMesh(gHead); headM.position.z = -0.03; head.add(headM);
    let skirt = null;
    if (L.bottom && L.bottom.style === 'skirt') { skirt = AF.modelMesh(cget('s' + key, () => skirtModel(L, C), [0.5, 1, 0.5], (m) => FINE.skirt(m, L, C))); skirt.position.y = 0.02; hips.add(skirt); }
    root.scale.setScalar(L.height || 1);
    const parts = { root, hips, legL, legR, chest, torso, armL, armR, head, skirt, gLeg: [gLegL, gLegR], gBent, sitting: false };
    for (const m of [legL, legR, torso, armL, armR, headM, skirt]) if (m) { m.castShadow = true; m.receiveShadow = true; }
    return parts;
  };
  // sit / stand: swap the legs for the bent pair and lower the hips onto a seat (seatH = seat height above the feet)
  AV.sit = (P, on, seatH = 0.75) => {
    if (P.sitting === on) return; P.sitting = on;
    P.legL.geometry = on ? P.gBent : P.gLeg[0]; P.legR.geometry = on ? P.gBent : P.gLeg[1];
    for (const l of [P.legL, P.legR]) l.rotation.set(0, 0, 0);
    P.hips.position.y = on ? (seatH + 0.12) / (P.root.scale.y || 1) : 0.75;
  };
  // idle / walk / sit animation shared by the player and the friends. st = { phase, speed, air, t, land }
  AV.animate = (P, st, dt, hs, onGround) => {
    st.t += dt; st.speed = AF.lerp(st.speed, hs, 1 - Math.exp(-dt * 10));
    const s = st.speed, amp = AF.clamp(s / 5, 0, 1.25);
    st.phase += dt * (s > 0.2 ? 2.1 + s * 1.05 : 0);
    const sw = Math.sin(st.phase);
    st.air = AF.lerp(st.air, onGround ? 0 : 1, 1 - Math.exp(-dt * 12));
    const a = st.air, idle = Math.max(0, 1 - s / 1.5);
    const breathe = Math.sin(st.t * 2.2) * 0.012 * idle;
    if (P.sitting) {
      P.armL.rotation.x = -0.5 + Math.sin(st.t * 1.3) * 0.05; P.armR.rotation.x = -0.5 + Math.sin(st.t * 1.1 + 1) * 0.05 + (st.typing ? Math.sin(st.t * 14) * 0.08 : 0);
      P.chest.rotation.x = 0.05 + breathe * 2; P.head.rotation.y = Math.sin(st.t * 0.37) * 0.3; P.head.rotation.x = 0.05;
      return;
    }
    P.legL.rotation.x = AF.lerp(-sw * 0.75 * Math.min(amp, 1), -0.55, a);
    P.legR.rotation.x = AF.lerp(sw * 0.75 * Math.min(amp, 1), 0.35, a);
    P.armL.rotation.x = AF.lerp(sw * 0.7 * Math.min(amp, 1.1), -2.3, a * 0.8);
    P.armR.rotation.x = AF.lerp(-sw * 0.7 * Math.min(amp, 1.1), -0.4, a * 0.8);
    P.armL.rotation.z = -0.06 - idle * 0.02 - a * 0.15; P.armR.rotation.z = 0.06 + idle * 0.02 + a * 0.15;
    P.hips.position.y = 0.75 + Math.abs(Math.cos(st.phase)) * 0.045 * Math.min(amp, 1) + breathe - (st.land || 0) * 0.08;
    P.chest.rotation.x = Math.min(amp, 1.2) * 0.12 + breathe * 2;
    P.chest.rotation.y = sw * 0.08 * Math.min(amp, 1);
    P.head.rotation.x = -Math.min(amp, 1.2) * 0.08 + Math.sin(st.t * 0.7) * 0.03 * idle;
    P.head.rotation.y = (st.lookYaw != null ? st.lookYaw : Math.sin(st.t * 0.37) * 0.25 * idle * idle);
    st.land = Math.max(0, (st.land || 0) - dt * 5);
  };
  AV.DEFAULT = { skin: 0xe9b48c, hair: 0x6b4226, hairStyle: 'short', top: { col: 0xb8322c, col2: 0xf2eee2, style: 'cardigan' }, bottom: { col: 0x3f5f8f, style: 'jeans' }, shoe: 0x6a4028, hat: 'cap', hatCol: 0x2d4270 };

  // ------------------------------------------------------------------ the player
  const body = { x: 0, y: 0.25, z: 28, vy: 0, r: 0.3, h: 1.7, onGround: true };
  const AN = { phase: 0, speed: 0, air: 0, t: 0, land: 0 };
  const player = AF.player = {
    x: 0, y: 0.25, z: 28, yaw: PI, body, mesh: null, visible: true, parts: null, look: AV.DEFAULT,
    setVisible(b) { player.visible = !!b; if (player.mesh) player.mesh.visible = !!b && !PL.hideMesh; },
    teleport(x, y, z, yaw) {
      if (!isFinite(x) || !isFinite(z)) return;
      const yy = isFinite(y) ? y : 60;
      const s = AF.surfaceBelow ? AF.surfaceBelow(x, z, yy + 0.6, isFinite(y) ? 3 : 80) : yy;
      body.x = x; body.z = z; body.y = isFinite(s) ? (isFinite(y) ? Math.max(s, y - 0.6) : s) : yy; body.vy = 0; body.onGround = true;
      if (isFinite(yaw)) { player.yaw = yaw; WK.camYaw = yaw + PI; }
      player.x = body.x; player.y = body.y; player.z = body.z;
      WK.boom = 0.5; WK.blend = 1;
      if (player.mesh) { player.mesh.position.set(body.x, body.y, body.z); player.mesh.rotation.y = player.yaw; }
    },
    setLook(look) {
      player.look = look || AV.DEFAULT;
      const vis = player.mesh ? player.mesh.visible : true;
      if (player.mesh) AF.scene.remove(player.mesh);
      const P = AV.build(player.look);
      // the player is always near the camera: keep it out of the distance cull
      P.root.traverse((o) => { if (o.isMesh) o.frustumCulled = false; });
      player.parts = P; player.mesh = P.root; P.root.name = 'player';
      P.root.position.set(body.x, body.y, body.z); P.root.rotation.y = player.yaw; P.root.visible = vis;
      AF.scene.add(P.root);
    },
  };

  // ------------------------------------------------------------------ helpers
  const groundAt = (x, z) => (AF.W && AF.W.groundY ? AF.W.groundY(x, z) : 0);
  const solid = (x, y, z) => AF.solidAt ? AF.solidAt(x, y, z) : y < groundAt(x, z);
  const cam = () => AF.camera;
  const inModal = () => !!(AF.ui && AF.ui.modalOpen && AF.ui.modalOpen());
  const onPanel = () => !!(AF.ui && AF.ui.pointerOnPanel);
  const markInput = () => { AE.lastInput = AF.clock.t; };

  // ------------------------------------------------------------------ AERIAL
  const AE = PL.aerial = {
    focus: new THREE.Vector3(10, 0, -10), dist: 300, yaw: 0, pitch: 0.4,
    f: new THREE.Vector3(10, 0, -10), d: 300, y: 0, p: 0.4,
    lastInput: 0, fly: null, spin: 0, started: false,
  };
  const MIN_P = 12 * PI / 180, MAX_P = 85 * PI / 180, MIN_D = 15, MAX_D = 1900;
  const orbitFrom = (pos, target) => {
    const dx = pos[0] - target[0], dy = pos[1] - target[1], dz = pos[2] - target[2];
    const d = Math.max(MIN_D, Math.min(MAX_D, Math.hypot(dx, dy, dz)));
    return { f: new THREE.Vector3(target[0], target[1], target[2]), d, yaw: Math.atan2(dx, dz), pitch: AF.clamp(Math.asin(AF.clamp(dy / Math.hypot(dx, dy, dz), -1, 1)), MIN_P, MAX_P) };
  };
  const setOrbit = (o, snap) => {
    AE.focus.copy(o.f); AE.dist = o.d; AE.yaw = o.yaw; AE.pitch = o.pitch;
    if (snap) { AE.f.copy(o.f); AE.d = o.d; AE.y = o.yaw; AE.p = o.pitch; }
  };
  const applyAerialCamera = () => {
    const c = cam(), cp = Math.cos(AE.p);
    const px = AE.f.x + Math.sin(AE.y) * cp * AE.d, pz = AE.f.z + Math.cos(AE.y) * cp * AE.d;
    let py = Math.max(AE.f.y + Math.sin(AE.p) * AE.d, groundAt(px, pz) + 2.0);
    let k = 0; while (k++ < 40 && solid(px, py, pz)) py += 0.5;
    c.position.set(px, py, pz);
    AF.camTarget.copy(AE.f);
    c.lookAt(AE.f);
    AF.shadowFocus.set(AE.f.x, 0, AE.f.z);
    AF.shadowRadius = Math.round(AF.clamp(AE.d * 0.5, 70, 220) / 10) * 10;
  };
  AF.flyTo = (pos, target, dur) => {
    if (!pos || !target) return;
    const o = orbitFrom(pos, target);
    if (AF.mode !== 'aerial') AF.setMode('aerial', { keep: true, noSnap: true });
    const travel = Math.hypot(o.f.x - AE.f.x, o.f.z - AE.f.z);
    AE.fly = { t: 0, dur: dur || AF.clamp(1.4 + travel / 180, 1.6, 3.6), f0: AE.f.clone(), d0: AE.d, y0: AE.y, p0: AE.p, o, bump: Math.max(0, travel * 0.55 - Math.max(AE.d, o.d) * 0.3) };
    markInput();
  };
  PL.lookView = { pos: [150, 128, -300], target: [10, 8, -10] };
  PL.stopCine = () => {};

  AF.modes.aerial = {
    enter(opts = {}, from) {
      const c = cam();
      if (opts.pos && opts.target) setOrbit(orbitFrom(opts.pos, opts.target), !opts.glide);
      else if (from === 'walk' || opts.focusPlayer) {
        const o = { f: new THREE.Vector3(body.x, body.y, body.z), d: 46, yaw: WK.camYaw, pitch: 0.62 };
        AE.f.set(body.x, body.y + 1.5, body.z); AE.d = Math.max(4, c.position.distanceTo(AE.f)); AE.y = WK.camYaw; AE.p = AF.clamp(WK.camPitch, MIN_P, MAX_P);
        setOrbit(o, false);
      } else if (opts.keep || opts.noSnap) {
        const t = AF.camTarget && AF.camTarget.lengthSq() > 0 ? AF.camTarget : new THREE.Vector3(0, 0, 0);
        setOrbit(orbitFrom([c.position.x, c.position.y, c.position.z], [t.x, t.y, t.z]), true);
      } else if (!AE.started || from == null) {
        const v = AF.PLAN.views[0];
        setOrbit(orbitFrom(v.pos, v.target), true);
      }
      AE.started = true; AE.lastInput = AF.clock.t; AE.lockY = !!(opts.pos && opts.target);
      if (player.mesh) player.mesh.visible = player.visible;
      AF.interactTarget = null;
      applyAerialCamera();
    },
    exit() { AE.fly = null; },
    update(dt) {
      const I = AF.input, m = I.mouse, modal = inModal();
      const shift = I.key('ShiftLeft') || I.key('ShiftRight');
      const titleUp = !!(AF.ui && AF.ui.titleOpen && AF.ui.titleOpen());
      if (!modal && !titleUp) {
        if (onPanel()) { /* dragging a UI control */ }
        else if ((m.buttons & 2) || ((m.buttons & 1) && shift) || (m.buttons & 4)) {
          if (m.dx || m.dy) {
            const k = AE.dist * 0.0016, cy = Math.cos(AE.yaw), sy = Math.sin(AE.yaw), sp = Math.max(0.35, Math.sin(AE.pitch));
            AE.focus.x += (-m.dx * cy - m.dy * sy / sp) * k;
            AE.focus.z += (m.dx * sy - m.dy * cy / sp) * k; AE.lockY = false;
            markInput(); AE.fly = null;
          }
        } else if (m.buttons & 1) {
          if (m.dx || m.dy) { AE.yaw -= m.dx * 0.0055; AE.pitch = AF.clamp(AE.pitch + m.dy * 0.004, MIN_P, MAX_P); markInput(); AE.fly = null; }
        }
        if (m.wheel) {
          if (m.wheel < 0 && AE.dist <= MIN_D * 1.35 && AF.modes.walk) { AE.zin = (AE.zin || 0) - m.wheel; if (AE.zin > 120) { AE.zin = 0; AF.setMode('walk', { x: body.x, y: body.y, z: body.z, yaw: player.yaw }); return; } }
          else AE.zin = 0;
          AE.dist = AF.clamp(AE.dist * Math.exp(m.wheel * 0.0011), MIN_D, MAX_D); markInput(); AE.fly = null;
        }
        let fx = 0, fz = 0;
        if (I.key('KeyW') || I.key('ArrowUp')) fz -= 1;
        if (I.key('KeyS') || I.key('ArrowDown')) fz += 1;
        if (I.key('KeyA') || I.key('ArrowLeft')) fx -= 1;
        if (I.key('KeyD') || I.key('ArrowRight')) fx += 1;
        if (fx || fz) {
          const sp = AE.dist * (shift ? 1.8 : 0.9) * dt, cy = Math.cos(AE.yaw), sy = Math.sin(AE.yaw);
          AE.focus.x += (fx * cy + fz * sy) * sp; AE.focus.z += (-fx * sy + fz * cy) * sp; AE.lockY = false;
          markInput(); AE.fly = null;
        }
        if (I.key('KeyQ')) { AE.yaw += dt * 1.3; markInput(); AE.fly = null; }
        if (I.key('KeyE')) { AE.yaw -= dt * 1.3; markInput(); AE.fly = null; }
        if (I.key('Equal') || I.key('NumpadAdd')) { AE.dist = AF.clamp(AE.dist * Math.exp(-dt * 1.5), MIN_D, MAX_D); markInput(); }
        if (I.key('Minus') || I.key('NumpadSubtract')) { AE.dist = AF.clamp(AE.dist * Math.exp(dt * 1.5), MIN_D, MAX_D); markInput(); }
        if (I.hit('Tab')) { AF.setMode('walk', { x: body.x, y: body.y, z: body.z, yaw: player.yaw }); return; }
      }
      const bounds = AF.PLAN.world.play;
      AE.focus.x = AF.clamp(AE.focus.x, bounds.x0, bounds.x1); AE.focus.z = AF.clamp(AE.focus.z, bounds.z0, AF.PLAN.world.bounds.z1);
      const idleFor = AF.clock.t - AE.lastInput;
      const spinT = (idleFor > 25 || titleUp) && !AE.fly ? 1 : 0;
      AE.spin = AF.lerp(AE.spin, spinT, 1 - Math.exp(-dt * 0.6));
      AE.yaw += dt * 0.035 * AE.spin;
      if (AE.fly) {
        const F = AE.fly; F.t += dt;
        const u = AF.clamp(F.t / F.dur, 0, 1), e = u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
        AE.f.lerpVectors(F.f0, F.o.f, e);
        AE.d = Math.exp(AF.lerp(Math.log(F.d0), Math.log(F.o.d), e)) + Math.sin(u * PI) * F.bump;
        AE.y = F.y0 + AF.angDiff(F.y0, F.o.yaw) * e;
        AE.p = AF.lerp(F.p0, F.o.pitch, e);
        AE.focus.copy(AE.f); AE.dist = F.o.d; AE.yaw = AE.y; AE.pitch = F.o.pitch;
        if (u >= 1) { AE.fly = null; AE.yaw = F.o.yaw; AE.y = F.o.yaw; AE.lockY = true; if (F.then) F.then(); }
      } else {
        const k = 1 - Math.exp(-dt * 6);
        const gy = groundAt(AE.focus.x, AE.focus.z);
        if (!AE.lockY) AE.focus.y = AF.lerp(AE.focus.y, Math.max(0, gy), 1 - Math.exp(-dt * 3));
        AE.f.lerp(AE.focus, k);
        AE.d = Math.exp(AF.lerp(Math.log(AE.d), Math.log(AE.dist), k));
        AE.y += AF.angDiff(AE.y, AE.yaw) * k;
        AE.p = AF.lerp(AE.p, AE.pitch, k);
      }
      applyAerialCamera();
      player.x = body.x; player.y = body.y; player.z = body.z;
      if (player.parts) AV.animate(player.parts, AN, dt, 0, true);
    },
  };

  // ray pick: march the voxel world (heightmap + solid voxels + colliders) from the camera through the pointer
  const RC = new THREE.Raycaster(), NDC = new THREE.Vector2();
  AF.pickWorld = (clientX, clientY, maxD = 1400) => {
    const cv = AF.renderer.domElement, r = cv.getBoundingClientRect();
    NDC.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    RC.setFromCamera(NDC, cam());
    const o = RC.ray.origin, d = RC.ray.direction;
    let t = 0.5, step = 0.5;
    for (; t < maxD; t += step) {
      const x = o.x + d.x * t, y = o.y + d.y * t, z = o.z + d.z * t;
      const bounds = AF.PLAN.world.bounds;
      if (x < bounds.x0 || x > bounds.x1 || z < bounds.z0 || z > bounds.z1) { if (t > 50 && y < -20) break; continue; }
      if (solid(x, y, z)) {
        let a = t - step, b = t;
        for (let i = 0; i < 8; i++) { const mm = (a + b) / 2; if (solid(o.x + d.x * mm, o.y + d.y * mm, o.z + d.z * mm)) b = mm; else a = mm; }
        return { x: o.x + d.x * a, y: o.y + d.y * a, z: o.z + d.z * a, t: a };
      }
      step = t > 200 ? 1.0 : 0.5;
      if (y < -16) break;
    }
    return null;
  };
  const landingFor = (p) => {
    const gy = groundAt(p.x, p.z);
    const b = AF.buildingAt && AF.buildingAt(p.x, Math.min(p.y, gy + 1.2), p.z) || (p.y > gy + 2.5 && AF.buildings.find((B) => p.x >= B.box[0] && p.x <= B.box[3] && p.z >= B.box[2] && p.z <= B.box[5]));
    if (b && p.y > gy + 2.5 && b.doors && b.doors.length) {
      const d = b.doors[0];
      return { x: d.x - Math.sin(d.yaw || 0) * 1.5, y: (d.y ?? 0.25) + 0.3, z: d.z - Math.cos(d.yaw || 0) * 1.5, yaw: d.yaw || 0 };
    }
    return { x: p.x, y: AF.surfaceBelow ? AF.surfaceBelow(p.x, p.z, p.y + 0.6, 6) : gy, z: p.z, yaw: AE.y + PI };
  };
  PL.flyDownTo = (p) => {
    const L = landingFor(p), back = AE.y;
    AF.flyTo([L.x + Math.sin(back) * 9, L.y + 6, L.z + Math.cos(back) * 9], [L.x, L.y + 1, L.z], 1.5);
    if (AE.fly) AE.fly.then = () => AF.setMode('walk', { x: L.x, y: L.y, z: L.z, yaw: back + PI });
  };
  document.getElementById('cv').addEventListener('dblclick', (e) => {
    if (!AF.ready || AF.mode !== 'aerial' || inModal()) return;
    const p = AF.pickWorld(e.clientX, e.clientY); if (p) PL.flyDownTo(p);
  });

  // ------------------------------------------------------------------ WALK (third person + first person)
  const WK = PL.walk = { camYaw: 0, camPitch: 0.22, boom: 3, fp: false, blend: 1, from: V3(), fromQ: new THREE.Quaternion(), lastMouse: 0, indoor: 0 };
  const TMP = V3(), LOOK = V3();
  const WALK = 5.8, RUN = 9.5;
  const vel = { x: 0, z: 0 };
  // nearest usable interaction; entries may supply dist(px,pz) (e.g. distance to a car's body, not its centre)
  const findInteract = () => {
    let best = null, bd = 1e9;
    const px = body.x, pz = body.z, py = body.y + 1.0;
    for (const it of AF.interacts) {
      const dy = (it.y ?? py) - py;
      if (Math.abs(dy) > 2.4) continue;
      const dx = it.x - px, dz = it.z - pz, r = it.r ?? 2.2;
      if (dx * dx + dz * dz > (r + 4) * (r + 4)) continue;
      let d = it.dist ? it.dist(px, pz) : Math.hypot(dx, dz);
      if (d > r) continue;
      d -= it.prio || 0;
      if (d >= bd) continue;
      let ok = true; if (it.can) { try { ok = !!it.can(); } catch (e) { ok = false; } }
      if (!ok) continue;
      bd = d; best = it;
    }
    return best;
  };
  const walkCamera = (dt) => {
    const c = cam();
    const hx = body.x, hy = body.y + 1.58 * (player.look.height || 1), hz = body.z;
    if (WK.fp) {
      c.position.set(hx, hy + 0.04, hz);
      const p = -WK.camPitch, yaw = WK.camYaw + PI;
      LOOK.set(hx + Math.sin(yaw) * Math.cos(p) * 10, hy + 0.04 + Math.sin(p) * 10, hz + Math.cos(yaw) * Math.cos(p) * 10);
      c.lookAt(LOOK);
      PL.hideMesh = true; if (player.mesh) player.mesh.visible = false;
    } else {
      const cp = Math.cos(WK.camPitch), dx = Math.sin(WK.camYaw) * cp, dy = Math.sin(WK.camPitch), dz = Math.cos(WK.camYaw) * cp;
      const rx = Math.cos(WK.camYaw), rz = -Math.sin(WK.camYaw);
      let ceil = false;
      for (let y = hy + 0.4; y < hy + 2.5; y += 0.25) if (solid(hx, y, hz)) { ceil = true; break; }
      const inB = !!(AF.buildingAt && AF.buildingAt(hx, body.y + 1, hz));
      WK.indoor = AF.lerp(WK.indoor, (ceil || inB) ? 1 : 0, 1 - Math.exp(-dt * 4));
      const maxBoom = AF.lerp(5.4 * (WK.zoom || 1), 2.8 * Math.min(1.2, WK.zoom || 1), WK.indoor);
      let shoulder = AF.lerp(0.62, 0.34, WK.indoor);
      for (let s = 0.05; s <= shoulder; s += 0.05) if (solid(hx + rx * (s + 0.12), hy, hz + rz * (s + 0.12))) { shoulder = Math.max(0, s - 0.15); break; }
      const px = hx + rx * shoulder, py = hy, pz = hz + rz * shoulder;
      const MARGIN = 0.28;
      const march = (lift) => {
        for (let t = 0.1; t <= maxBoom + MARGIN; t += 0.07) {
          const x = px + dx * t, y = py + lift + dy * t, z = pz + dz * t;
          if (solid(x, y, z) || solid(x, y + 0.14, z) || solid(x, y - 0.14, z) || solid(x + rx * 0.14, y, z + rz * 0.14) || solid(x - rx * 0.14, y, z - rz * 0.14)) return Math.max(0.12, t - MARGIN);
        }
        return maxBoom;
      };
      let want = march(0), wantLift = 0;
      if (want < maxBoom * 0.8) {
        const need = Math.min(maxBoom * 0.8, want + 1.2);
        for (const L of [0.35, 0.7, 1.05]) {
          if (solid(hx, hy + L + 0.3, hz)) break;
          const w = march(L);
          if (w >= need) { want = w; wantLift = L; break; }
        }
      }
      WK.lift = AF.lerp(WK.lift || 0, wantLift, 1 - Math.exp(-dt * (wantLift > (WK.lift || 0) ? 9 : 3)));
      const hard = WK.lift > 0.02 ? march(WK.lift) : (wantLift ? march(0) : want);
      const tgt = Math.min(want, hard);
      WK.boom = AF.lerp(WK.boom, tgt, 1 - Math.exp(-dt * (tgt < WK.boom ? 10 : 2.5)));
      WK.boom = Math.min(WK.boom, hard + 0.15);
      let cx = px + dx * WK.boom, cy = py + WK.lift + dy * WK.boom, cz = pz + dz * WK.boom;
      if (solid(cx, cy, cz)) { cx = hx; cy = hy; cz = hz; }
      TMP.set(cx, cy, cz);
      LOOK.set(px - dx * 8, py - dy * 8 + 0.55, pz - dz * 8);
      if (WK.blend < 1) {
        WK.blend = Math.min(1, WK.blend + dt / 1.5);
        const e = 1 - Math.pow(1 - WK.blend, 4);
        c.position.lerpVectors(WK.from, TMP, e);
        c.lookAt(LOOK); const q = c.quaternion.clone(); c.quaternion.slerpQuaternions(WK.fromQ, q, e);
      } else { c.position.copy(TMP); c.lookAt(LOOK); }
      PL.hideMesh = WK.boom < 0.7;
      if (player.mesh) player.mesh.visible = player.visible && !PL.hideMesh;
    }
    AF.camTarget.set(hx, hy, hz);
    AF.shadowFocus.set(body.x, 0, body.z); AF.shadowRadius = 70;
  };
  AF.modes.walk = {
    enter(opts = {}, from) {
      const s = AF.PLAN.spawn;
      let x = opts.x, y = opts.y, z = opts.z, yaw = opts.yaw;
      if (!isFinite(x) || !isFinite(z)) { x = s.x; z = s.z; y = s.y; if (!isFinite(yaw)) yaw = s.yaw; }
      if (!isFinite(yaw)) yaw = player.yaw;
      player.teleport(x, isFinite(y) ? y : undefined, z, yaw);
      let k = 0; while (k++ < 16 && AF.boxBlocked && AF.boxBlocked(body.x, body.y, body.z, body.r, body.h)) body.y += 0.25;
      WK.camYaw = yaw + PI; WK.camPitch = 0.2; WK.boom = 0.6;
      const c = cam(); WK.from.copy(c.position); WK.fromQ.copy(c.quaternion); WK.blend = (opts.snap || from == null) ? 1 : 0;
      vel.x = vel.z = 0;
      if (player.parts) AV.sit(player.parts, false);
      player.setVisible(true);
      AF.emit('hint', '');
    },
    exit() { AF.interactTarget = null; PL.hideMesh = false; if (player.mesh) player.mesh.visible = player.visible; },
    update(dt) {
      const I = AF.input, m = I.mouse, modal = inModal();
      const locked = !!document.pointerLockElement;
      const talking = !!(AF.ui && AF.ui.dialogueOpen && AF.ui.dialogueOpen());
      if (!modal) {
        // mouse / touch look: pointer lock (click the view) or drag
        if ((locked || ((m.buttons & 3) && !onPanel())) && (m.dx || m.dy)) {
          const ks = AF.lookSens(); WK.camYaw -= m.dx * 0.0045 * ks; WK.camPitch = AF.clamp(WK.camPitch + m.dy * 0.0035 * ks, -0.75, 1.25); WK.lastMouse = AF.clock.t;
        }
        if (!locked && m.clicked && !onPanel()) I.requestLock();
        if (m.wheel) {
          if (WK.fp) { if (m.wheel > 0) { WK.fp = false; PL.hideMesh = false; WK.boom = 0.5; } }
          else if (m.wheel > 0 && (WK.zoom || 1) >= 2.19) { WK.zout = (WK.zout || 0) + m.wheel; if (WK.zout > 120) { WK.zout = 0; AF.setMode('aerial', { focusPlayer: true }); return; } }
          else { WK.zout = 0; WK.zoom = AF.clamp((WK.zoom || 1) * Math.exp(m.wheel * 0.0012), 0.45, 2.2); }
        }
        if (I.hit('KeyV')) { WK.fp = !WK.fp; if (!WK.fp) { PL.hideMesh = false; WK.boom = 0.5; } AF.emit('toast', WK.fp ? 'First-person view' : 'Over-the-shoulder view'); }
        if (I.hit('Tab')) { AF.setMode('aerial', { focusPlayer: true }); return; }
      }
      // movement (keys, or the analog stick on touch screens: AF.input.stick = {x, y} in -1..1)
      let ix = 0, iz = 0;
      if (!modal) {
        if (I.key('KeyW') || I.key('ArrowUp')) iz += 1;
        if (I.key('KeyS') || I.key('ArrowDown')) iz -= 1;
        if (I.key('KeyA') || I.key('ArrowLeft')) ix -= 1;
        if (I.key('KeyD') || I.key('ArrowRight')) ix += 1;
        if (I.stick && (I.stick.x || I.stick.y)) { ix += I.stick.x; iz += I.stick.y; }
      }
      const mag = Math.min(1, Math.hypot(ix, iz)), analog = !!(I.stick && (I.stick.x || I.stick.y));
      const run = I.key('ShiftLeft') || I.key('ShiftRight') || !!(I.stick && I.stick.run);
      const fx = -Math.sin(WK.camYaw), fz = -Math.cos(WK.camYaw), rx = -fz, rz = fx;
      let wx = fx * iz + rx * ix, wz = fz * iz + rz * ix;
      const wl = Math.hypot(wx, wz);
      const sp = (run ? RUN : WALK) * (analog ? mag : 1);
      if (wl > 0) { wx = wx / wl * sp; wz = wz / wl * sp; }
      const acc = 1 - Math.exp(-dt * (body.onGround ? 18 : 3));
      vel.x = AF.lerp(vel.x, wx, acc); vel.z = AF.lerp(vel.z, wz, acc);
      if (!modal && I.hit('Space') && body.onGround) { body.vy = 7.2; body.onGround = false; }
      const wasAir = !body.onGround;
      const ox = body.x, oz = body.z;
      AF.moveBody(body, vel.x * dt, vel.z * dt, dt, { step: 0.55 });
      const bounds = AF.PLAN.world.play, margin = AF.PLAN.world.margin;
      body.x = AF.clamp(body.x, bounds.x0 - margin, bounds.x1 + margin);
      body.z = AF.clamp(body.z, bounds.z0 - margin, AF.PLAN.world.bounds.z1 - margin);
      if (wasAir && body.onGround) AN.land = 0.6;
      const hs = Math.hypot(body.x - ox, body.z - oz) / Math.max(dt, 1e-4);
      if (body.hitWall) { vel.x *= 0.6; vel.z *= 0.6; }
      if (WK.fp) player.yaw = WK.camYaw + PI;
      else if (wl > 0) player.yaw += AF.angDiff(player.yaw, Math.atan2(wx, wz)) * (1 - Math.exp(-dt * 12));
      if (!WK.fp && !locked && wl > 0 && iz > 0 && AF.clock.t - WK.lastMouse > 4) WK.camYaw += AF.angDiff(WK.camYaw, player.yaw + PI) * (1 - Math.exp(-dt * 0.9));
      if (body.y < -14 || !isFinite(body.y)) { const s = AF.PLAN.spawn; player.teleport(s.x, s.y, s.z, s.yaw); AF.emit('toast', 'Whoops \u2014 back to safe ground.'); }
      player.x = body.x; player.y = body.y; player.z = body.z;
      if (player.mesh) { player.mesh.position.set(body.x, body.y, body.z); player.mesh.rotation.y = player.yaw; }
      if (player.parts) AV.animate(player.parts, AN, dt, hs, body.onGround);
      // interactions
      const it = modal ? null : findInteract();
      AF.interactTarget = it;
      if (it && (I.hit('KeyE') || I.hit('KeyF')) && !talking) {
        try { it.act && it.act(); } catch (e) { console.error('[af] interact', e); }
        AF.emit('interact', it);
      }
      walkCamera(dt);
    },
  };

  // ------------------------------------------------------------------ build + idle tick
  AF.onBuild('player', 800, () => {
    player.setLook(player.look);
    const s = AF.PLAN.spawn;
    player.teleport(s.x, s.y, s.z, s.yaw);
    const v = AF.PLAN.views[0]; setOrbit(orbitFrom(v.pos, v.target), true);
  });
  // walk camera: a resident who steps between the camera and the player never fills the frame with a head
  AF.onTick('player-nearfade', 905, () => {
    const mode = AF.mode, c = cam().position;
    if (mode !== 'walk') return;
    const R2 = 1.44;
    if (AF.people) for (const p of AF.people) {
      if (!p || !p.root || !p.root.visible) continue;
      const dx = p.x - c.x, dz = p.z - c.z;
      if (dx * dx + dz * dz < R2 && c.y > p.y - 0.4 && c.y < p.y + 2.3) p.root.visible = false;
    }
    const CR = AF.peopleKit && AF.peopleKit.crowd;
    if (!CR || !CR.V || c.y > 12) return;
    for (const V of CR.V) {
      if (!V || !V.im) continue;
      for (const f in V.im) {
        const im = V.im[f], n = im.count; if (!n || !im.visible) continue;
        const a = im.instanceMatrix.array; let hit = false;
        for (let i = 0; i < n; i++) {
          const o = i * 16, dx = a[o + 12] - c.x, dz = a[o + 14] - c.z, y = a[o + 13];
          if (dx * dx + dz * dz < R2 && c.y > y - 0.4 && c.y < y + 2.3) { for (let j = 0; j < 11; j++) a[o + j] = 0; hit = true; }
        }
        if (hit) im.instanceMatrix.needsUpdate = true;
      }
    }
  });
  // outside walk/aerial (driving, flying, riding): the vehicle owner may seat the avatar via PL.seat = {x,y,z,yaw,roll,pitch,bike}
  AF.onTick('player-idle', 160, (dt) => {
    if (!player.mesh || AF.mode === 'walk' || AF.mode === 'aerial' || AF.mode === 'skydive' || AF.mode === 'row') return;
    const S = PL.seat;
    if (S && player.parts) {
      AV.sit(player.parts, true, S.seatH ?? 0.62);
      player.mesh.position.set(S.x, S.y, S.z); player.mesh.rotation.set(S.pitch || 0, S.yaw, S.roll || 0, 'YXZ');
      const P = player.parts; P.armL.rotation.x = P.armR.rotation.x = -1.2; P.armL.rotation.z = -0.25; P.armR.rotation.z = 0.25; P.chest.rotation.x = S.lean ?? 0.25; P.head.rotation.x = -0.15; P.head.rotation.y = 0;
      return;
    }
    player.mesh.rotation.set(0, player.yaw, 0);
    player.mesh.position.set(body.x, body.y, body.z);
    if (player.parts) AV.animate(player.parts, AN, dt, 0, true);
  });
  AF.on('mode', (m) => { if (m === 'walk' || m === 'aerial') { PL.seat = null; if (player.parts) AV.sit(player.parts, false); if (player.mesh) player.mesh.rotation.set(0, player.yaw, 0); } });
  AF.toast = AF.toast || ((msg) => AF.emit('toast', msg));
}

// mouse-look sensitivity (saved per browser)
AF.lookSens = () => { if (AF._lookSens == null) { let v = NaN; try { v = parseFloat(localStorage.getItem('portSolace.lookSens')); } catch (e) {} AF._lookSens = isFinite(v) ? v : 0.45; } return AF._lookSens; };
AF.setLookSens = (v) => { AF._lookSens = AF.clamp(+v || 0.45, 0.05, 2); try { localStorage.setItem('portSolace.lookSens', String(AF._lookSens)); } catch (e) {} };

} catch (e) { AF.partError('70-player.js', e); }
