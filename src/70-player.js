// ================================================================ 70-player.js
try {
// ===== 70-player: AF.avatar (parametric voxel people — the player + the friends), 'aerial' orbit camera + 'walk' modes  (OWNER: player) =====
// AF.player = {x,y,z,yaw, body, mesh, visible, setVisible(b), teleport(x,y,z,yaw), setLook(look), crouch, setCrouch(on), noise, eyeH,
//              swimming, climbing}
//   swim: walk mode in water deeper than 1.25 m floats (feet 1.3 m under the surface) and swims (breaststroke, front crawl when
//   sprinting, treading water when still); weapons are holstered. AF.PL.waterAt(x, z) = water surface y there (-Infinity = none).
//   climb: Space (or swimming into an edge <= 0.8 m out of the water) next to a ledge up to 1.9 m above the water / 1.6 m above the feet plays
//   a climb and stands you on top (the ledge must be >= ~0.5 m deep with room to stand). Poses ride the replicated joints + root.
//   walk: C toggles a crouch (45 % speed, 1.1 m collider so you fit under 1.1 m+ gaps, bent-leg pose); sprinting / jumping stands you
//   up when there is headroom. noise (per frame) 0 still · 0.12 crouch-walk · ~0.35 walk · 1 sprint / hard landing; eyeH 1.55 / 0.95 m.
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
  const geoCache = new Map();   // key -> { g, n } (n live avatars use it; AV.release disposes at 0 so outfit changes don't leak)
  // every avatar part is authored at 1/16 m, then doubled to 1/32 m and given a fine detail pass (see FINE below)
  const cget = (key, fn, anchor, det, keys) => { let e = geoCache.get(key); if (!e) { const m = up2(fn()); if (det) det(m); e = { g: AF.meshModel(m, { vs: 1 / 32, anchor }), n: 0 }; geoCache.set(key, e); } e.n++; keys.push(key); return e.g; };
  AV.release = (P) => { if (!P || !P.keys) return; for (const k of P.keys) { const e = geoCache.get(k); if (e && --e.n <= 0) { e.g.dispose(); geoCache.delete(k); } } P.keys = null; };
  AV.cached = () => geoCache.size;
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
    if (bent === 'crouch') {
      // crouching: the thigh rises forward to the knee, the shin slants back down to a foot under the hip (hip pivot at y 8, z 2)
      const m = new AF.Model(4, 12, 11);
      for (let z = 0; z < 11; z++) { const yc = Math.round(8 + (z - 2) * 2 / 7); m.box(0, yc - 2, z, 4, yc + 2, z + 1, skirt && z > 6 ? C.skin : pant(10)); }
      for (let y = 3; y < 10; y++) { const zc = Math.round(4 + (y - 2) * 5 / 8); m.box(0, y, zc - 2, 4, y + 1, zc + 2, pant(y < 6 ? 4 : 10)); }
      m.box(0, 0, 1, 4, 1, 8, C.sole); m.box(0, 1, 1, 4, 3, 8, C.shoe);
      return m;
    }
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
    const C = pal(L), key = JSON.stringify(L), keys = [];
    const gLegL = cget('lL' + key, () => legModel(L, C, -1, false), [0.5, 1, 0.5], (m) => FINE.leg(m, L, C), keys), gLegR = cget('lR' + key, () => legModel(L, C, 1, false), [0.5, 1, 0.5], (m) => FINE.leg(m, L, C), keys);
    const gBent = cget('lB' + key, () => legModel(L, C, 1, true), [0.5, 1, 2 / 11], null, keys);
    const gCrouch = cget('lC' + key, () => legModel(L, C, 1, 'crouch'), [0.5, 8 / 12, 2 / 11], null, keys);
    const gTorso = cget('t' + key, () => torsoModel(L, C), [0.5, 0, 0.5], (m) => FINE.torso(m, L, C), keys);
    const gArm = cget('a' + key, () => armModel(L, C), [0.5, 1, 0.5], (m) => FINE.arm(m, L, C), keys);
    const gHead = cget('h' + key, () => headModel(L, C), [0.5, 4 / 15, 0.5], (m) => FINE.head(m, L, C), keys);
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
    if (L.bottom && L.bottom.style === 'skirt') { skirt = AF.modelMesh(cget('s' + key, () => skirtModel(L, C), [0.5, 1, 0.5], (m) => FINE.skirt(m, L, C), keys)); skirt.position.y = 0.02; hips.add(skirt); }
    root.scale.setScalar(L.height || 1);
    const parts = { root, hips, legL, legR, chest, torso, armL, armR, head, skirt, gLeg: [gLegL, gLegR], gBent, gCrouch, sitting: false, bent: false, keys };
    for (const m of [legL, legR, torso, armL, armR, headM, skirt]) if (m) { m.castShadow = true; m.receiveShadow = true; }
    return parts;
  };
  // sit / stand: swap the legs for the bent pair and lower the hips onto a seat (seatH = seat height above the feet)
  AV.sit = (P, on, seatH = 0.75) => {
    if (P.sitting === on) return; P.sitting = on; P.bent = false;
    P.legL.geometry = on ? P.gBent : P.gLeg[0]; P.legR.geometry = on ? P.gBent : P.gLeg[1];
    for (const l of [P.legL, P.legR]) l.rotation.set(0, 0, 0);
    P.hips.position.y = on ? (seatH + 0.12) / (P.root.scale.y || 1) : 0.75;
  };
  // crouch: the folded crouch legs (knee up front, foot under the hip, sole 0.5 m below the hip pivot)
  const bentLegs = (P, on) => { if (P.bent === on || P.sitting || !P.gCrouch) return; P.bent = on; P.legL.geometry = on ? P.gCrouch : P.gLeg[0]; P.legR.geometry = on ? P.gCrouch : P.gLeg[1]; };
  AV.crouchLegs = bentLegs;
  // blend the arms (already posed unarmed) toward the held-weapon carry: guns = both hands on it with a small planted bob,
  // melee = the right hand low on the baton with a short swing; k = swing amount (0..1)
  const holdArms = (P, hk, hw, sw, k) => {
    if (!(hw > 0.001) || !hk) return;
    const R = P.armR.rotation, L = P.armL.rotation;
    if (hk === 3) { R.x = AF.lerp(R.x, HOLD_R[3] - sw * 0.25 * k, hw); R.z = AF.lerp(R.z, HOLD_RZ[3], hw); return; }
    const b = Math.abs(sw) * 0.06 * k;
    R.x = AF.lerp(R.x, HOLD_R[hk] - b, hw); R.z = AF.lerp(R.z, HOLD_RZ[hk], hw);
    L.x = AF.lerp(L.x, HOLD_L[hk] - b, hw); L.z = AF.lerp(L.z, HOLD_LZ[hk], hw);
  };
  // armed carry targets [right x, right z, left x, left z] — mirror 77's CARRY (pistol / long gun) so the hand-off to combat's overlay
  // (which owns gun arms after this) doesn't pop; melee = the baton low in the right hand, left arm free
  const HOLD_R = [0, -0.72, -0.45, -0.35], HOLD_RZ = [0, -0.1, -0.38, 0.12], HOLD_L = [0, -0.68, -1.05, 0], HOLD_LZ = [0, 0.42, 0.72, 0];
  // idle / walk / sit / crouch animation shared by the player and the friends. st = { phase, speed, air, t, land, crouch (0..1) }
  // optional: hold (0 none, 1 pistol, 2 long gun, 3 melee), aimK (0..1), fwd (-1..1 = heading · travel; < 0 walks backwards)
  AV.animate = (P, st, dt, hs, onGround) => {
    st.t += dt; st.speed = AF.lerp(st.speed, hs, 1 - Math.exp(-dt * 10));
    const s = st.speed, amp = AF.clamp(s / 5, 0, 1.25);
    const cr = P.sitting ? 0 : st.crouch || 0;
    const hold = st.hold | 0, fwd = st.fwd == null || !isFinite(st.fwd) ? 1 : AF.clamp(st.fwd, -1, 1);
    const ek = 1 - Math.exp(-dt * 10);
    st.holdW = (st.holdW || 0) + ((hold > 0 ? 1 : 0) - (st.holdW || 0)) * ek;
    st.aimW = (st.aimW || 0) + ((hold > 0 && hold < 3 ? AF.clamp(st.aimK || 0, 0, 1) : 0) - (st.aimW || 0)) * ek;
    if (hold > 0) st.holdK = hold;
    const hk = hold || st.holdK || 0, hw = hk ? st.holdW : 0, gw = hk === 1 || hk === 2 ? hw : 0, aw = st.aimW;
    // backwards: the cycle runs in reverse (no moonwalk); sideways: a shorter, quicker step; aiming / armed: a planted, shorter stride
    st.dirS = AF.lerp(st.dirS == null ? 1 : st.dirS, fwd < -0.25 ? -1 : 1, ek);
    const strafe = 0.55 + 0.45 * Math.abs(fwd), stride = strafe * (1 - 0.35 * aw) * (1 - 0.1 * gw);
    st.phase += dt * (s > 0.2 ? (cr > 0.5 ? 4.2 + s * 1.6 : 2.1 + s * 1.05) * (st.dirS < 0 ? -1 : 1) * (1.15 - 0.15 * strafe) : 0);
    const sw = Math.sin(st.phase);
    st.air = AF.lerp(st.air, onGround ? 0 : 1, 1 - Math.exp(-dt * 12));
    const a = st.air, idle = Math.max(0, 1 - s / 1.5);
    const breathe = Math.sin(st.t * 2.2) * 0.012 * idle;
    if (P.sitting) {
      P.armL.rotation.x = -0.5 + Math.sin(st.t * 1.3) * 0.05; P.armR.rotation.x = -0.5 + Math.sin(st.t * 1.1 + 1) * 0.05 + (st.typing ? Math.sin(st.t * 14) * 0.08 : 0);
      P.chest.rotation.x = 0.05 + breathe * 2; P.head.rotation.y = Math.sin(st.t * 0.37) * 0.3; P.head.rotation.x = 0.05;
      return;
    }
    bentLegs(P, cr > 0.5);
    if (P.bent) {
      // crouch / crouch-walk: hips low, feet planted, the stepping leg swings its knee forward and up, chest over the knees
      const ca = AF.clamp(s / 2.6, 0, 1) * stride, H = AF.lerp(0.75, 0.5, cr) + Math.abs(Math.cos(st.phase)) * 0.025 * ca;
      P.legL.rotation.x = -Math.max(0, sw) * 0.35 * ca + Math.max(0, -sw) * 0.1 * ca; P.legR.rotation.x = -Math.max(0, -sw) * 0.35 * ca + Math.max(0, sw) * 0.1 * ca; P.legL.rotation.z = -0.05; P.legR.rotation.z = 0.05;
      P.hips.position.y = H + breathe * 0.5;
      P.armL.rotation.x = AF.lerp(sw * 0.35 * ca, -0.55, 0.6 * cr); P.armR.rotation.x = AF.lerp(-sw * 0.35 * ca, -0.55, 0.6 * cr);
      P.armL.rotation.z = -0.12; P.armR.rotation.z = 0.12;
      holdArms(P, hk, hw, sw, ca * 0.6);
      P.chest.rotation.x = (0.45 - 0.1 * aw) * cr + breathe * 2; P.chest.rotation.y = sw * 0.05 * ca * (1 - 0.7 * gw);
      P.head.rotation.x = -0.32 * cr; P.head.rotation.y = st.lookYaw != null ? st.lookYaw : Math.sin(st.t * 0.37) * 0.3 * idle * idle;
      st.land = Math.max(0, (st.land || 0) - dt * 5);
      return;
    }
    const ls = Math.min(amp, 1) * stride, ab = Math.min(amp, 1.1) * (1 - 0.3 * aw);
    P.legL.rotation.x = AF.lerp(-sw * 0.75 * ls, -0.55, a);
    P.legR.rotation.x = AF.lerp(sw * 0.75 * ls, 0.35, a);
    P.armL.rotation.x = AF.lerp(sw * 0.7 * ab, -2.3, a * 0.8);
    P.armR.rotation.x = AF.lerp(-sw * 0.7 * ab, -0.4, a * 0.8);
    P.armL.rotation.z = -0.06 - idle * 0.02 - a * 0.15; P.armR.rotation.z = 0.06 + idle * 0.02 + a * 0.15;
    // armed: the carry holds through jumps too (only a little of the arms-up air pose)
    holdArms(P, hk, hw * (1 - 0.35 * a), sw, Math.min(amp, 1.1));
    P.legL.rotation.z = P.legR.rotation.z = 0;
    P.hips.position.y = 0.75 + Math.abs(Math.cos(st.phase)) * 0.045 * ls * (1 - 0.35 * aw) + breathe - (st.land || 0) * 0.08 - 0.25 * cr;
    P.chest.rotation.x = Math.min(amp, 1.2) * (0.12 - 0.05 * aw) + 0.05 * gw + breathe * 2 + 0.45 * cr;
    P.chest.rotation.y = sw * 0.08 * Math.min(amp, 1) * (1 - 0.7 * gw);
    P.head.rotation.x = -Math.min(amp, 1.2) * 0.08 + Math.sin(st.t * 0.7) * 0.03 * idle;
    P.head.rotation.y = (st.lookYaw != null ? st.lookYaw : Math.sin(st.t * 0.37) * 0.25 * idle * idle);
    st.land = Math.max(0, (st.land || 0) - dt * 5);
  };
  AV.DEFAULT = { skin: 0xe9b48c, hair: 0x6b4226, hairStyle: 'short', top: { col: 0xb8322c, col2: 0xf2eee2, style: 'cardigan' }, bottom: { col: 0x3f5f8f, style: 'jeans' }, shoe: 0x6a4028, hat: 'cap', hatCol: 0x2d4270 };

  // ------------------------------------------------------------------ the player
  const body = { x: 0, y: 0.25, z: 28, vy: 0, r: 0.3, h: 1.7, onGround: true };
  const AN = { phase: 0, speed: 0, air: 0, t: 0, land: 0, crouch: 0 };
  const STAND_H = 1.7, CROUCH_H = 1.1, EYE_STAND = 1.55, EYE_CROUCH = 0.95;
  const player = AF.player = {
    x: 0, y: 0.25, z: 28, yaw: PI, body, mesh: null, visible: true, parts: null, look: AV.DEFAULT,
    // stance (KeyC on foot): crouch = toggled state; noise = how loud the player is this frame (0 still, ~0.12 crouch-walk, ~0.35 walk,
    // 1 sprint or a hard landing); eyeH = head height above the feet (the stealth line-of-sight target)
    crouch: false, noise: 0, eyeH: EYE_STAND,
    // walk mode in deep water floats + swims (PL.swim); climbing = a ledge climb / mantle is playing (PL.climb, ~0.6-0.85 s)
    swimming: false, climbing: false,
    // false (and stays crouched) when there is no headroom to stand up
    setCrouch(on) {
      on = !!on; if (on === player.crouch) return true;
      if (!on && AF.boxBlocked && AF.boxBlocked(body.x, body.y, body.z, body.r, STAND_H)) return false;
      player.crouch = on; body.h = on ? CROUCH_H : STAND_H; AF.emit('crouch', on); return true;
    },
    setVisible(b) { player.visible = !!b; if (player.mesh) player.mesh.visible = !!b && !PL.hideMesh; },
    teleport(x, y, z, yaw) {
      if (!isFinite(x) || !isFinite(z)) return;
      const yy = isFinite(y) ? y : 60;
      const s = AF.surfaceBelow ? AF.surfaceBelow(x, z, yy + 0.6, isFinite(y) ? 3 : 80) : yy;
      body.x = x; body.z = z; body.y = isFinite(s) ? (isFinite(y) ? Math.max(s, y - 0.6) : s) : yy; body.vy = 0; body.onGround = true;
      if (isFinite(yaw)) { player.yaw = yaw; WK.camYaw = yaw + PI; }
      player.x = body.x; player.y = body.y; player.z = body.z;
      WK.boom = 0.5; WK.blend = 1; LS.ok = false;
      if (player.mesh) { player.mesh.position.set(body.x, body.y, body.z); player.mesh.rotation.y = player.yaw; }
    },
    setLook(look) {
      player.look = look || AV.DEFAULT;
      const vis = player.mesh ? player.mesh.visible : true;
      if (player.mesh) AF.scene.remove(player.mesh);
      AV.release(player.parts);
      const P = AV.build(player.look);
      // the player is always near the camera: keep it out of the distance cull
      P.root.traverse((o) => { if (o.isMesh) o.frustumCulled = false; });
      player.parts = P; player.mesh = P.root; P.root.name = 'player';
      P.root.position.set(body.x, body.y, body.z); P.root.rotation.y = player.yaw; P.root.visible = vis;
      AF.scene.add(P.root);
      AF.emit('look', P);
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
    // long hops take a little longer: the streamers load the destination (AF.stream.focus) while the camera is on its way
    AE.fly = { t: 0, dur: dur || AF.clamp(1.4 + travel / 150, 1.6, 5), f0: AE.f.clone(), d0: AE.d, y0: AE.y, p0: AE.p, o, bump: Math.max(0, travel * 0.55 - Math.max(AE.d, o.d) * 0.3) };
    AF.stream.focus = { x: o.f.x, z: o.f.z };
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
    exit() { AE.fly = null; AF.stream.focus = null; },
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
      if (!AE.fly && AF.stream.focus) AF.stream.focus = null;
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
  const TMP = V3(), LOOK = V3(), QT = new THREE.Quaternion();
  const WALK = 5.8, RUN = 9.5, CROUCH_K = 0.45;
  const NZ = { land: 0, landK: 0 };
  const vel = { x: 0, z: 0 };
  // knockback (hits, explosions, cars): adds to the walk velocity; vy > 0 throws the body up
  PL.push = (vx, vz, vy) => { vel.x += vx; vel.z += vz; if (vy) { body.vy = vy; body.onGround = false; } };
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
  // boom ray (third person): 0.21 m strides with a five-probe cross, then a bisection back to ~3 cm (a third of the probes of the
  // old 7 cm march); BR holds the frame's ray so nothing is allocated per frame
  const BR = { px: 0, py: 0, pz: 0, dx: 0, dy: 0, dz: 0, rx: 0, rz: 0, max: 0 }, BOOM_LIFTS = [0.35, 0.7, 1.05], BOOM_MARGIN = 0.28;
  const boomHit = (t, lift) => {
    const x = BR.px + BR.dx * t, y = BR.py + lift + BR.dy * t, z = BR.pz + BR.dz * t, ox = BR.rx * 0.14, oz = BR.rz * 0.14;
    return solid(x, y, z) || solid(x, y + 0.14, z) || solid(x, y - 0.14, z) || solid(x + ox, y, z + oz) || solid(x - ox, y, z - oz);
  };
  const boomMarch = (lift) => {
    let prev = 0.1;
    for (let t = 0.1; t <= BR.max + BOOM_MARGIN; t += 0.21) {
      if (boomHit(t, lift)) {
        let a = prev, b = t;
        for (let i = 0; i < 3; i++) { const m = (a + b) / 2; if (boomHit(m, lift)) b = m; else a = m; }
        return Math.max(0.12, a - BOOM_MARGIN);
      }
      prev = t;
    }
    return BR.max;
  };
  const walkCamera = (dt) => {
    const c = cam();
    // pivot height eases over steps and kerbs (a 0.55 m step-up no longer jolts the view); teleports and jumps > 1.5 m snap
    const eyeY = body.y + (1.58 - (EYE_STAND - EYE_CROUCH) * AN.crouch) * (player.look.height || 1);
    if (!(Math.abs(eyeY - (WK.py ?? eyeY)) < 1.5) || WK.blend < 1) WK.py = eyeY;
    else WK.py += (eyeY - WK.py) * (1 - Math.exp(-dt * (body.onGround ? 16 : 30)));
    const hx = body.x, hy = WK.fp || PL.scope ? eyeY : WK.py, hz = body.z;
    // first person, or looking through a sniper scope (PL.scope, 77-combat): the lens at the eye
    if (WK.fp || PL.scope) {
      c.position.set(hx, hy + 0.04, hz);
      const p = -WK.camPitch, yaw = WK.camYaw + PI;
      LOOK.set(hx + Math.sin(yaw) * Math.cos(p) * 10, hy + 0.04 + Math.sin(p) * 10, hz + Math.cos(yaw) * Math.cos(p) * 10);
      c.lookAt(LOOK);
      PL.hideMesh = true; if (player.mesh) player.mesh.visible = false;
    } else {
      const cp = Math.cos(WK.camPitch), dx = Math.sin(WK.camYaw) * cp, dy = Math.sin(WK.camPitch), dz = Math.cos(WK.camYaw) * cp;
      const rx = Math.cos(WK.camYaw), rz = -Math.sin(WK.camYaw);
      // indoors (a ceiling overhead or inside a building box): re-tested only after moving 0.4 m (the building scan is linear)
      if (!(Math.abs(hx - WK.inX) + Math.abs(hz - WK.inZ) + Math.abs(body.y - WK.inY) < 0.4)) {
        WK.inX = hx; WK.inZ = hz; WK.inY = body.y; WK.inside = false;
        for (let y = hy + 0.4; y < hy + 2.5; y += 0.3) if (solid(hx, y, hz)) { WK.inside = true; break; }
        if (!WK.inside) WK.inside = !!(AF.buildingAt && AF.buildingAt(hx, body.y + 1, hz));
      }
      WK.indoor = AF.lerp(WK.indoor, WK.inside ? 1 : 0, 1 - Math.exp(-dt * 4));
      // AF.view near / far; aiming (PL.aim, 77-combat) pulls in over the shoulder
      const zoom = PL.aim ? 0.42 : AF.view.dist[AF.view.i];
      const maxBoom = AF.lerp(5.4 * zoom, 2.8 * Math.min(1.2, zoom), WK.indoor);
      let shoulder = AF.lerp(PL.aim ? 0.75 : 0.62, 0.34, WK.indoor);
      for (let s = 0.1; s <= shoulder; s += 0.1) if (solid(hx + rx * (s + 0.12), hy, hz + rz * (s + 0.12))) { shoulder = Math.max(0, s - 0.2); break; }
      const px = hx + rx * shoulder, py = hy, pz = hz + rz * shoulder;
      BR.px = px; BR.py = py; BR.pz = pz; BR.dx = dx; BR.dy = dy; BR.dz = dz; BR.rx = rx; BR.rz = rz; BR.max = maxBoom;
      let want = boomMarch(0), wantLift = 0;
      if (want < maxBoom * 0.8) {
        const need = Math.min(maxBoom * 0.8, want + 1.2);
        for (const L of BOOM_LIFTS) {
          if (solid(hx, hy + L + 0.3, hz)) break;
          const w = boomMarch(L);
          if (w >= need) { want = w; wantLift = L; break; }
        }
      }
      WK.lift = AF.lerp(WK.lift || 0, wantLift, 1 - Math.exp(-dt * (wantLift > (WK.lift || 0) ? 9 : 3)));
      const hard = WK.lift > 0.02 ? (Math.abs(WK.lift - wantLift) < 0.01 ? want : boomMarch(WK.lift)) : (wantLift ? boomMarch(0) : want);
      const tgt = Math.min(want, hard);
      WK.boom = AF.lerp(WK.boom, tgt, 1 - Math.exp(-dt * (tgt < WK.boom ? 10 : 2.5)));
      WK.boom = Math.min(WK.boom, hard + 0.15);
      let cx = px + dx * WK.boom, cy = py + WK.lift + dy * WK.boom, cz = pz + dz * WK.boom;
      // swimming: the camera stays above the surface (looking up from low no longer dives the lens under the water)
      if (SW.on && cy < SW.wy + 0.3) cy = SW.wy + 0.3;
      if (solid(cx, cy, cz)) { cx = hx; cy = hy; cz = hz; }
      TMP.set(cx, cy, cz);
      LOOK.set(px - dx * 8, py - dy * 8 + 0.55, pz - dz * 8);
      if (WK.blend < 1) {
        WK.blend = Math.min(1, WK.blend + dt / 0.45);
        const e = 1 - Math.pow(1 - WK.blend, 4);
        c.position.lerpVectors(WK.from, TMP, e);
        c.lookAt(LOOK); QT.copy(c.quaternion); c.quaternion.slerpQuaternions(WK.fromQ, QT, e);
      } else { c.position.copy(TMP); c.lookAt(LOOK); }
      PL.hideMesh = WK.boom < 0.7;
      if (player.mesh) player.mesh.visible = player.visible && !PL.hideMesh;
    }
    // a running stride widens the view a touch (eased, outdoors only); aiming narrows it (a rifle scope further, and quicker)
    const fov = PL.aim ? PL.aimFov || 40 : 50 + (WK.running && !WK.fp ? 4 * (1 - WK.indoor) : 0);
    WK.fov = AF.lerp(WK.fov || 50, fov, 1 - Math.exp(-dt * (PL.scope || (WK.fov || 50) < 24 ? 14 : 4)));
    if (Math.abs(c.fov - WK.fov) > 0.02) { c.fov = WK.fov; c.updateProjectionMatrix(); }
    AF.camTarget.set(hx, hy, hz);
    AF.shadowFocus.set(body.x, 0, body.z); AF.shadowRadius = 70;
  };

  // ------------------------------------------------------------------ WATER: surfaces, swimming, ledge climbs
  // Surfaces: every water mesh but the sea, rasterised into 1 m cells as it is added (02 releases the arrays after upload; 16 m tiles of
  // Float32 heights, NaN = dry, ~0.5 MB), the harbour south of the quay, and the outland's lakes / rivers / sea (07 O.waterY).
  const HBR = AF.PLAN.harbour, WTILE = new Map();
  let wCells = 0;
  const tKey = (ix, iz) => ((ix >> 4) + 1024) * 2048 + ((iz >> 4) + 1024);
  const wGet = (ix, iz) => { const T = WTILE.get(tKey(ix, iz)); return T ? T[((ix & 15) << 4) | (iz & 15)] : NaN; };
  const wSet = (ix, iz, y) => {
    const k = tKey(ix, iz); let T = WTILE.get(k); if (!T) { T = new Float32Array(256).fill(NaN); WTILE.set(k, T); }
    const i = ((ix & 15) << 4) | (iz & 15), o = T[i]; if (o !== o) { wCells++; T[i] = y; } else if (y > o) T[i] = y;
  };
  const waterCells = (geo) => {
    const ud = geo && geo.userData, pa = geo && geo.attributes && geo.attributes.position;
    if (!ud || ud.sea || !pa || !pa.array || pa.isInterleavedBufferAttribute || pa.itemSize !== 3) return;
    const A = pa.array, ix = geo.index ? geo.index.array : null, n = ix ? ix.length : pa.count;
    for (let t = 0; t + 2 < n; t += 3) {
      const a = (ix ? ix[t] : t) * 3, b = (ix ? ix[t + 1] : t + 1) * 3, c = (ix ? ix[t + 2] : t + 2) * 3;
      const ax = A[a], az = A[a + 2], bx = A[b], bz = A[b + 2], cx = A[c], cz = A[c + 2], y = (A[a + 1] + A[b + 1] + A[c + 1]) / 3;
      const d = (bx - ax) * (cz - az) - (bz - az) * (cx - ax); if (Math.abs(d) < 1e-9) continue;
      const x0 = Math.floor(Math.min(ax, bx, cx)), x1 = Math.floor(Math.max(ax, bx, cx)), z0 = Math.floor(Math.min(az, bz, cz)), z1 = Math.floor(Math.max(az, bz, cz));
      if ((x1 - x0 + 1) * (z1 - z0 + 1) > 250000) continue;
      for (let i = x0; i <= x1; i++) for (let k = z0; k <= z1; k++) {
        const px = i + 0.5, pz = k + 0.5;
        const w0 = ((bx - px) * (cz - pz) - (bz - pz) * (cx - px)) / d, w1 = ((cx - px) * (az - pz) - (cz - pz) * (ax - px)) / d;
        if (w0 < -1e-6 || w1 < -1e-6 || 1 - w0 - w1 < -1e-6) continue;
        wSet(i, k, y);
      }
    }
  };
  { const add0 = AF.addWater; AF.addWater = (geo, mat) => { try { waterCells(geo); } catch (e) { AF.warnOnce('player: water cells', e); } return add0(geo, mat); }; }
  try { for (const w of (AF.world && AF.world.water) || []) waterCells(w.geo); } catch (e) { /* arrays already released */ }
  // water surface y at (x, z), -Infinity where there is none
  const waterAt = PL.waterAt = (x, z) => {
    let y = -Infinity;
    const v = wGet(Math.floor(x), Math.floor(z)); if (v === v) y = v;
    if (AF.W.col(x, z) < 0) { const O = AF.outland, o = O && O.waterY ? O.waterY(x, z) : null; if (o != null && o > y) y = o; }
    else if (z >= HBR.coastZ && HBR.waterY > y) y = HBR.waterY;
    return y;
  };
  PL.waterCells = () => wCells;

  // swim: feet SINK under the surface; starts where the bottom is SWIM_IN below the surface, ends (stand up) above SWIM_OUT
  const SINK = 1.3, SWIM_IN = 1.25, SWIM_OUT = 1.05, SWIM = 2.3, SWIM_RUN = 3.7, CLIMB_WATER = 1.9;   // quays: 1.5 m + a 0.25 m coping
  const SW = PL.swim = { on: false, wy: -Infinity, floor: 0, vy: 0, w: 0, crawl: 0, pb: 0, pc: 0, t: 0, bob: 0, push: 0, wall: false, busy: false, hid: null, posed: false, sT: 0 };
  const CL = PL.climb = { on: false, t: 0, dur: 0.7, x0: 0, y0: 0, z0: 0, x1: 0, y1: 0, z1: 0, water: false };
  const MB_WALK = { step: 0.55 }, MB_SWIM = { step: 0.55, fly: true }, SND = { vol: 1, rate: 1 };
  // Depenetration. moveBody's landing samples the footprint at 9 points (0.29 m apart, voxels are 0.25 m) and falls without a box
  // test, so a jump can come down around a post / thin collider and end up inside it. Resolve the overlap: lift onto it first
  // (the missed surface), else slide out sideways along a clear line (never through a wall), else back to the last safe spot.
  const LS = { x: 0, y: 0, z: 0, ok: false };
  const RING_X = [1, 0.7071, 0, -0.7071, -1, -0.7071, 0, 0.7071], RING_Z = [0, 0.7071, 1, 0.7071, 0, -0.7071, -1, -0.7071];
  // order: a small lift (the missed landing surface), a short sideways slide along a clear line, a taller lift (spawns only),
  // then the last safe spot along a clear line
  // segClear from a point that may sit INSIDE the solid being escaped: rayHit counts a start inside a box / voxel as a hit at 0,
  // so walk out of that solid first (≤ maxIn metres, 0.05 m steps), then the rest of the line must be clear (a second wall blocks)
  const exitClear = (x0, y0, z0, x1, y1, z1, maxIn) => {
    const dx = x1 - x0, dy = y1 - y0, dz = z1 - z0, L = Math.hypot(dx, dy, dz);
    if (L < 1e-6) return !AF.solidAt(x0, y0, z0);
    const ux = dx / L, uy = dy / L, uz = dz / L, lim = Math.min(maxIn, L);
    let s = 0;
    while (s <= lim && AF.solidAt(x0 + ux * s, y0 + uy * s, z0 + uz * s)) s += 0.05;
    if (s > lim) return false;
    // the walk stops ON the exit face (solidAt is half-open, rayHit's slab test counts a start on a face as a hit): step past it
    if (s > 0) { s = Math.min(s + 0.02, L); if (s >= L) return true; }
    return AF.segClear(x0 + ux * s, y0 + uy * s, z0 + uz * s, x1, y1, z1);
  };
  const freeSpot = (maxLift) => {
    const B = AF.boxBlocked, x = body.x, y = body.y, z = body.z, r = body.r, h = body.h, lo = Math.min(maxLift, 0.6);
    for (let up = 0.05; up <= lo + 1e-6; up += 0.05) if (!B(x, y + up, z, r, h)) { body.y = y + up; return true; }
    // sideways: the nearest ring first = the shallowest way out (minimum translation), out to 1.2 m for a centre inside a wide object
    const my = y + Math.min(1, h * 0.6);
    for (let rad = 0.15; rad <= 1.21; rad += 0.15) for (let i = 0; i < 8; i++) {
      const cx = x + RING_X[i] * rad, cz = z + RING_Z[i] * rad;
      if (!B(cx, y, cz, r, h) && exitClear(x, my, z, cx, my, cz, rad)) { body.x = cx; body.z = cz; return true; }
    }
    for (let up = lo + 0.05; up <= maxLift + 1e-6; up += 0.05) if (!B(x, y + up, z, r, h)) { body.y = y + up; return true; }
    // last safe spot: only when near AND the line back is open at knee and chest height past the solid we are in (never through
    // a second wall / floor)
    if (LS.ok && Math.abs(LS.x - x) + Math.abs(LS.z - z) + Math.abs(LS.y - y) < 3 && !B(LS.x, LS.y, LS.z, r, h)) {
      const k = Math.min(0.5, h * 0.3), c = Math.min(1.2, h * 0.7);
      if (exitClear(x, y + k, z, LS.x, LS.y + k, LS.z, 1.2) && exitClear(x, y + c, z, LS.x, LS.y + c, LS.z, 1.2)) { body.x = LS.x; body.y = LS.y; body.z = LS.z; return true; }
    }
    return false;
  };
  const depenetrate = () => {
    if (!AF.boxBlocked) return;
    if (AF.boxBlocked(body.x, body.y, body.z, body.r, body.h)) {
      const y0 = body.y;
      if (freeSpot(0.6) && body.y > y0) { body.vy = Math.min(body.vy, 0); body.onGround = true; }
    } else if (body.onGround) { LS.x = body.x; LS.y = body.y; LS.z = body.z; LS.ok = true; }
  };
  const sfx = (id, vol, rate) => { if (!AF.audio || !AF.audio.play) return; SND.vol = vol; SND.rate = rate; AF.audio.play(id, SND); };
  // deep enough to swim at (x, z) with the feet at y? Leaves the surface in SW.wy, the bottom under it in SW.floor
  const deepAt = (x, z, y, need) => {
    const wy = SW.wy = waterAt(x, z);
    if (wy === -Infinity) return false;
    SW.floor = AF.surfaceBelow(x, z, wy + 0.05, 40);
    if (y > wy - 0.3 || SW.floor > wy - need) return false;
    return !(AF.liner && AF.liner.where && AF.liner.where(x, y + 1, z));
  };
  const splash = (x, z, k) => {
    const P = AF.fx && AF.fx.smoke; if (!P) return;
    const n = Math.round((6 + k * 6) * (AF.MOBILE ? 0.5 : 1)), L = 0.94 - 0.66 * ((AF.time && AF.time.night) || 0);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * PI * 2, r = Math.random(), out = 0.8 + k * 0.5 + r;
      P.spawn(x + Math.sin(a) * 0.4, SW.wy + 0.05, z + Math.cos(a) * 0.4, Math.sin(a) * out, 1.4 + k * 0.6 + r * 1.6, Math.cos(a) * out, 0.5 + r * 0.4, 0.25, 0.9, -9.8, 0.86 * L, 0.91 * L, 0.95 * L);
    }
  };
  const startSwim = (vy0, quiet) => {
    SW.on = true; player.swimming = true; SW.vy = AF.clamp(vy0 || 0, -7, 0) * 0.45; SW.w = 0; SW.crawl = 0; SW.push = 0; SW.sT = 0.8;
    if (player.crouch) { player.crouch = false; body.h = STAND_H; AF.emit('crouch', false); }
    AN.crouch = 0; if (player.parts) bentLegs(player.parts, false);
    body.vy = 0; body.onGround = true; vel.x *= 0.5; vel.z *= 0.5;
    if (!quiet) { const imp = -(vy0 || 0); splash(body.x, body.z, Math.min(4, imp * 0.35)); sfx(imp > 4 ? 'splash' : 'step_water', Math.min(1, 0.4 + imp * 0.08), 0.9 + Math.random() * 0.2); }
    AF.emit('swim', true);
  };
  const stopSwim = () => { if (!SW.on) return; SW.on = false; player.swimming = false; body.vy = 0; body.onGround = true; AF.emit('swim', false); };

  // ledge in direction (dx, dz): the first column within 0.4-0.8 m whose top is in [minTop, maxTop], with a stand spot >= 0.25 m past
  // it at the same height (so not a fence or a railing), room to stand there, and headroom straight up + halfway across
  const LG = { x: 0, y: 0, z: 0 };
  const ledgeDir = (dx, dz, minTop, maxTop) => {
    const r = body.r;
    for (let d = 0.4; d < 0.9; d += 0.2) {
      const cx = body.x + dx * d, cz = body.z + dz * d;
      const top = AF.surfaceBelow(cx, cz, maxTop + 0.01, maxTop - minTop + 0.5);
      if (!(top >= minTop && top <= maxTop + 0.01) || AF.solidAt(cx, top + 0.12, cz)) continue;
      for (let e = d + 0.45; e > d + 0.2; e -= 0.2) {
        const sx = body.x + dx * e, sz = body.z + dz * e, s2 = AF.surfaceBelow(sx, sz, top + 0.3, 0.6);
        if (!(Math.abs(s2 - top) <= 0.3) || AF.boxBlocked(sx, s2 + 0.02, sz, r, STAND_H)) continue;
        if (AF.boxBlocked(body.x, s2 + 0.02, body.z, r, STAND_H) || AF.boxBlocked((body.x + sx) * 0.5, s2 + 0.02, (body.z + sz) * 0.5, r, STAND_H)) continue;
        LG.x = sx; LG.y = s2; LG.z = sz; return true;
      }
      return false;
    }
    return false;
  };
  const startClimb = (yaw, water) => {
    CL.on = true; player.climbing = true; CL.t = 0; CL.water = water;
    CL.x0 = body.x; CL.y0 = body.y; CL.z0 = body.z; CL.x1 = LG.x; CL.y1 = LG.y; CL.z1 = LG.z;
    CL.dur = AF.clamp(0.42 + (CL.y1 - CL.y0) * 0.16, 0.55, 0.85);
    player.yaw = yaw; vel.x = vel.z = 0; body.vy = 0; body.onGround = true;
    if (player.crouch) { player.crouch = false; body.h = STAND_H; AF.emit('crouch', false); }
    if (SW.on) { stopSwim(); sfx('step_water', 0.7, 0.8); }
    AF.emit('climb', water ? 'water' : 'ledge');
  };
  // the ledge straight ahead, else 25 degrees either side
  const tryClimb = (dx, dz, minTop, maxTop, water) => {
    if (!(maxTop > minTop)) return false;
    const a0 = Math.atan2(dx, dz);
    for (let k = 0; k < 3; k++) {
      const a = a0 + (k === 1 ? 0.45 : k === 2 ? -0.45 : 0);
      if (ledgeDir(Math.sin(a), Math.cos(a), minTop, maxTop)) { startClimb(a, water); return true; }
    }
    return false;
  };
  // pull up first (hands on the edge), then over it: kinematic, the path was checked clear when the climb started
  const climbStep = (dt) => {
    CL.t += dt; const u = Math.min(1, CL.t / CL.dur), uy = AF.smooth(0, 0.55, u), uh = AF.smooth(0.45, 1, u);
    body.x = AF.lerp(CL.x0, CL.x1, uh); body.z = AF.lerp(CL.z0, CL.z1, uh); body.y = AF.lerp(CL.y0, CL.y1, uy);
    body.vy = 0; body.onGround = true; vel.x = vel.z = 0;
    if (u >= 1) { CL.on = false; player.climbing = false; AN.land = 0.35; sfx(CL.water ? 'step_water' : 'step_concrete', 0.6, 0.9); }
  };
  const swimMove = (dt, moving, dx, dz) => {
    AF.moveBody(body, vel.x * dt, vel.z * dt, dt, MB_SWIM);
    if (!deepAt(body.x, body.z, body.y, SWIM_OUT)) {
      // found your feet (a beach, a ramp, a shelf): stand on the bottom; off the water entirely: walking takes over
      stopSwim();
      if (SW.wy > -Infinity && SW.floor > body.y && SW.floor < body.y + 0.6 && !AF.boxBlocked(body.x, SW.floor, body.z, body.r, body.h)) body.y = SW.floor;
      return;
    }
    // float: a spring to SINK under the surface (a dip after jumping in), never through the bottom or into a ceiling
    const target = SW.wy - SINK;
    SW.vy += ((target - body.y) * 28 - SW.vy * 7) * dt;
    let y = body.y + SW.vy * dt;
    if (y > body.y && AF.boxBlocked(body.x, y, body.z, body.r, body.h)) { y = body.y; SW.vy = 0; }
    if (y < SW.floor) { y = SW.floor; SW.vy = Math.max(0, SW.vy); }
    body.y = y; body.vy = 0; body.onGround = true;
    // a wall ahead turns you upright; swimming on into an edge <= 0.8 m out of the water (pontoons, ramps, low decks) climbs out
    SW.wall = AF.solidAt(body.x + dx * 0.75, SW.wy - 0.15, body.z + dz * 0.75) || AF.solidAt(body.x + dx * 1.1, SW.wy - 0.15, body.z + dz * 1.1);
    if (moving && (body.hitWall || SW.wall)) { if ((SW.push += dt) > 0.18) { SW.push = 0; tryClimb(dx, dz, SW.wy - 0.4, SW.wy + 0.8, true); } }
    else SW.push = 0;
  };

  // ---- poses (after combat's arm overlay; everything rides the replicated root pose + joints, so co-op peers see it as is)
  const angLerp = (a, b, t) => a + AF.angDiff(a, b) * t;
  const bump = (u, a, b) => (u <= a || u >= b ? 0 : Math.sin((u - a) / (b - a) * PI));
  // breaststroke keys: u, arm x, arm abduction, legs x (reach / out-sweep / in-sweep + knees drawn / shoot forward + kick / glide)
  const BK = [0, -2.95, 0.1, 0.1, 0.4, -1.5, 1.15, 0.1, 0.55, -1.85, 0.3, -0.75, 0.72, -2.95, 0.08, 0.3, 1, -2.95, 0.1, 0.1];
  const BS = { ax: 0, az: 0, lx: 0 };
  const breast = (u) => {
    let i = 0; while (i < 12 && BK[i + 4] < u) i += 4;
    const e0 = AF.clamp((u - BK[i]) / (BK[i + 4] - BK[i]), 0, 1), e = e0 * e0 * (3 - 2 * e0);
    BS.ax = AF.lerp(BK[i + 1], BK[i + 5], e); BS.az = AF.lerp(BK[i + 2], BK[i + 6], e); BS.lx = AF.lerp(BK[i + 3], BK[i + 7], e);
  };
  const poseSwim = (P, dt) => {
    const S = SW, hs = WK.speed || 0, moving = hs > 0.35 && !S.wall;
    S.t += dt;
    S.w += ((moving ? 1 : 0) - S.w) * (1 - Math.exp(-dt * 3.5));
    S.crawl += ((moving && WK.running ? 1 : 0) - S.crawl) * (1 - Math.exp(-dt * 3));
    const pb0 = S.pb, pc0 = S.pc;
    S.pb = (S.pb + dt * (0.45 + hs * 0.17)) % 1;
    S.pc = (S.pc + dt * (0.35 + hs * 0.13)) % 1;
    const w = S.w, cw = S.crawl, t = S.t;
    // treading water: upright, hands sculling out to the sides, a slow eggbeater kick, looking around
    let aLx = -0.45 + Math.sin(t * 3.4) * 0.28, aRx = -0.45 + Math.sin(t * 3.4 + 0.4) * 0.28, azL = 1.0 + Math.sin(t * 3.4 + 1.2) * 0.18, azR = 1.0 + Math.sin(t * 3.4 + 1.6) * 0.18;
    let lL = Math.sin(t * 2.6) * 0.38, lR = -lL, pitch = 0.1, roll = 0, hx = -0.05, hy = Math.sin(t * 0.45) * 0.5, cx = 0.05 + Math.sin(t * 1.7) * 0.03;
    if (w > 0.01) {
      breast(S.pb);
      let sLx = BS.ax, sRx = BS.ax, sLz = BS.az, sRz = BS.az, sLl = BS.lx, sRl = BS.lx, sp = 1.18 - 0.28 * bump(S.pb, 0.3, 0.68), sroll = 0, shy = 0;
      if (cw > 0.01) {
        // front crawl: each arm a full circle (pull under the body, recover over the back, elbow out), flutter kick, the body rolls,
        // a breath to the side every cycle
        const L = S.pc, R = (S.pc + 0.5) % 1;
        const cLx = AF.angDiff(0, -PI + L * 2 * PI), cRx = AF.angDiff(0, -PI + R * 2 * PI);
        const cLz = 0.14 + (L > 0.5 ? Math.sin((L - 0.5) * 2 * PI) * 0.5 : 0), cRz = 0.14 + (R > 0.5 ? Math.sin((R - 0.5) * 2 * PI) * 0.5 : 0);
        const fl = Math.sin(S.pc * 2 * PI * 3) * 0.32;
        sLx = angLerp(sLx, cLx, cw); sRx = angLerp(sRx, cRx, cw); sLz = AF.lerp(sLz, cLz, cw); sRz = AF.lerp(sRz, cRz, cw);
        sLl = AF.lerp(sLl, 0.06 + fl, cw); sRl = AF.lerp(sRl, 0.06 - fl, cw);
        sp = AF.lerp(sp, 1.3, cw); sroll = Math.sin(S.pc * 2 * PI) * 0.38 * cw; shy = bump(R, 0.55, 0.95) * 0.9 * cw;
      }
      aLx = angLerp(aLx, sLx, w); aRx = angLerp(aRx, sRx, w); azL = AF.lerp(azL, sLz, w); azR = AF.lerp(azR, sRz, w);
      lL = AF.lerp(lL, sLl, w); lR = AF.lerp(lR, sRl, w); pitch = AF.lerp(pitch, sp, w); roll = sroll * w;
      hx = AF.lerp(hx, -sp * 0.85, w); hy = AF.lerp(hy, shy, w); cx = AF.lerp(cx, 0, w);
    }
    P.armL.rotation.set(aLx, 0, -azL); P.armR.rotation.set(aRx, 0, azR);
    P.legL.rotation.set(lL, 0, 0); P.legR.rotation.set(lR, 0, 0);
    P.chest.rotation.set(cx, 0, 0); P.head.rotation.set(hx, hy, 0); P.hips.position.y = 0.75;
    // the root pivots at the feet: shift it back so the body lies over the collider, shoulders just under the (bobbing) surface
    const s = player.look.height || 1, yaw = player.yaw, back = 0.8 * s * Math.sin(pitch);
    S.bob = Math.sin(t * 1.7) * 0.035 + Math.sin(t * 0.63 + 1) * 0.02;
    P.root.position.set(body.x - Math.sin(yaw) * back, body.y + SINK + S.bob - 1.23 * s * Math.cos(pitch) + 0.03, body.z - Math.cos(yaw) * back);
    P.root.rotation.set(pitch, yaw, roll, 'YXZ');
    // strokes: a hand entering (crawl), the kick (breaststroke), the odd slosh treading water
    if (w > 0.5) {
      if (cw > 0.5) { if ((pc0 < 0.5 && S.pc >= 0.5) || S.pc < pc0) sfx('step_water', 0.35, 1.05 + Math.random() * 0.15); }
      else if (pb0 < 0.6 && S.pb >= 0.6) sfx('step_water', 0.45, 0.8 + Math.random() * 0.1);
    } else if ((S.sT -= dt) <= 0) { S.sT = 1.8 + Math.random(); sfx('step_water', 0.18, 0.7); }
  };
  // climb: reach up onto the edge, press down as the body comes up, a knee onto the edge, stand
  const poseClimb = (P) => {
    const u = Math.min(1, CL.t / CL.dur), e1 = AF.smooth(0, 0.28, u), e2 = AF.smooth(0.28, 0.62, u), e3 = AF.smooth(0.62, 1, u);
    const ax = AF.lerp(AF.lerp(AF.lerp(-0.4, -2.75, e1), -0.25, e2), 0, e3), az = AF.lerp(AF.lerp(0.12, 0.28, e1), 0.08, e3);
    const pitch = AF.lerp(AF.lerp(AF.lerp(0.05, 0.38, e1), 0.62, e2), 0, e3);
    P.armL.rotation.set(ax, 0, -az); P.armR.rotation.set(ax, 0, az);
    P.legL.rotation.set(AF.lerp(AF.lerp(0, -1.45, e2), 0, e3), 0, 0); P.legR.rotation.set(AF.lerp(AF.lerp(0.1, 0.35, e2), 0, e3), 0, 0);
    P.chest.rotation.set(AF.lerp(0.2 * e1, 0.35, e2) * (1 - e3), 0, 0); P.head.rotation.set(AF.lerp(-0.45 * e1, -0.1, e2) * (1 - e3), 0, 0);
    P.hips.position.y = 0.75 - 0.08 * bump(u, 0.3, 0.9);
    // leaning in pivots on the feet: until the body is over the edge, hold the shoulders back at the wall
    const back = 0.95 * Math.sin(pitch) * (1 - AF.smooth(0.25, 0.5, u));
    P.root.position.set(body.x - Math.sin(player.yaw) * back, body.y, body.z - Math.cos(player.yaw) * back); P.root.rotation.set(pitch, player.yaw, 0, 'YXZ');
  };
  // weapons are holstered in the water and while climbing: combat (151) sees PL.busy, the held item hides
  AF.onTick('player-water-busy', 150.5, () => { if (AF.mode === 'walk' && (SW.on || CL.on) && !PL.busy) { PL.busy = true; SW.busy = true; } });
  AF.onTick('player-water-pose', 151.5, (dt) => {
    if (SW.busy) { SW.busy = false; PL.busy = false; }
    const P = player.parts;
    if (!P || AF.mode !== 'walk' || !(SW.on || CL.on)) {
      if (SW.hid) { SW.hid.visible = true; SW.hid = null; }
      if (SW.posed && P) { SW.posed = false; P.root.rotation.set(0, player.yaw, 0); if (!P.sitting) P.hips.position.y = 0.75; }
      return;
    }
    const CB = AF.combat; if (CB && CB.held && CB.held.visible) { CB.held.visible = false; SW.hid = CB.held; }
    SW.posed = true;
    if (CL.on) poseClimb(P); else poseSwim(P, dt);
  });

  AF.modes.walk = {
    enter(opts = {}, from) {
      const s = AF.PLAN.spawn;
      let x = opts.x, y = opts.y, z = opts.z, yaw = opts.yaw;
      if (!isFinite(x) || !isFinite(z)) { x = s.x; z = s.z; y = s.y; if (!isFinite(yaw)) yaw = s.yaw; }
      if (!isFinite(yaw)) yaw = player.yaw;
      player.teleport(x, isFinite(y) ? y : undefined, z, yaw);
      if (AF.boxBlocked && AF.boxBlocked(body.x, body.y, body.z, body.r, body.h)) freeSpot(4);   // on failure stay put: moveBody walks out
      // camera: snap behind the player on spawn / title / map travel / far cameras (a long sweep from the title point streams
      // the whole path in and out); a nearby vehicle / seat exit keeps the current view direction and settles in quickly
      const c = cam(), far = c.position.distanceToSquared(TMP.set(body.x, body.y, body.z)) > 625;
      const snap = !!opts.snap || from == null || from === 'cine' || from === 'aerial' || from === 'dead' || far;
      WK.boom = 0.6;
      if (snap) { WK.camYaw = yaw + PI; WK.camPitch = 0.2; }
      else {
        c.getWorldDirection(TMP);
        WK.camYaw = Math.atan2(-TMP.x, -TMP.z); WK.camPitch = AF.clamp(Math.asin(AF.clamp(-TMP.y, -1, 1)), -0.75, 1.25);
      }
      WK.from.copy(c.position); WK.fromQ.copy(c.quaternion); WK.blend = snap ? 1 : 0;
      vel.x = vel.z = 0;
      player.crouch = false; body.h = STAND_H; AN.crouch = 0; player.eyeH = EYE_STAND; player.noise = 0; NZ.land = 0;
      // started in deep water (off a jet ski, a boat, a checkpoint at sea): float straight away, never sink to the bottom
      CL.on = false; player.climbing = false; SW.on = false; player.swimming = false; SW.vy = 0;
      if (deepAt(body.x, body.z, body.y, SWIM_IN)) { startSwim(0, true); body.y = Math.max(SW.floor, SW.wy - SINK); }
      if (player.parts) AV.sit(player.parts, false);
      player.setVisible(true);
      AF.emit('hint', '');
    },
    exit() { stopSwim(); CL.on = false; player.climbing = false; AF.interactTarget = null; PL.hideMesh = false; player.noise = 0; if (player.crouch) { player.crouch = false; body.h = STAND_H; AF.emit('crouch', false); } AN.crouch = 0; if (player.parts) bentLegs(player.parts, false); player.eyeH = EYE_STAND; if (player.mesh) player.mesh.visible = player.visible; const c = cam(); WK.fov = 50; if (c.fov !== 50) { c.fov = 50; c.updateProjectionMatrix(); } },
    update(dt) {
      const I = AF.input, m = I.mouse, modal = inModal() || !!PL.busy;
      const locked = !!document.pointerLockElement;
      const talking = !!(AF.ui && AF.ui.dialogueOpen && AF.ui.dialogueOpen());
      WK.fp = AF.view.fp();
      if (!modal) {
        // mouse / touch look: pointer lock (click the view) or drag
        if ((locked || ((m.buttons & 3) && !onPanel())) && (m.dx || m.dy) && !PL.wheel) {
          // aiming slows the look; through a scope it scales with the zoom so the reticle moves the same across the view
          const ks = AF.lookSens() * (PL.aim ? (PL.scope ? 0.6 * Math.min(1, (WK.fov || 50) / 40) : 0.6) : 1); WK.camYaw -= m.dx * 0.0045 * ks; WK.camPitch = AF.clamp(WK.camPitch + m.dy * 0.0035 * ks, -0.75, 1.25); WK.lastMouse = AF.clock.t;
        }
        if (!locked && m.clicked && !onPanel()) I.requestLock();
        if (I.hit('Tab')) { AF.setMode('aerial', { focusPlayer: true }); return; }
      }
      // movement (keys, or the analog stick on touch screens: AF.input.stick = {x, y} in -1..1)
      let ix = 0, iz = 0;
      if (!modal && !PL.still) {
        if (I.key('KeyW') || I.key('ArrowUp')) iz += 1;
        if (I.key('KeyS') || I.key('ArrowDown')) iz -= 1;
        if (I.key('KeyA') || I.key('ArrowLeft')) ix -= 1;
        if (I.key('KeyD') || I.key('ArrowRight')) ix += 1;
        if (I.stick && (I.stick.x || I.stick.y)) { ix += I.stick.x; iz += I.stick.y; }
      }
      const mag = Math.min(1, Math.hypot(ix, iz)), analog = !!(I.stick && (I.stick.x || I.stick.y));
      const shiftSprint = I.key('ShiftLeft') || I.key('ShiftRight');
      let run = shiftSprint || (!!(I.stick && I.stick.run) && !player.crouch);
      // KeyC toggles the crouch; keyboard sprint or jumping stands you up (when there is headroom: else you stay low and can't sprint)
      if (!modal && I.hit('KeyC') && !SW.on && !CL.on) { if (!player.setCrouch(!player.crouch)) AF.emit('toast', 'No room to stand up here.'); }
      if (player.crouch && shiftSprint && (ix || iz) && !player.setCrouch(false)) run = false;
      if (player.crouch && !modal && I.hit('Space') && !player.setCrouch(false)) I.pressed.delete('Space');
      const fx = -Math.sin(WK.camYaw), fz = -Math.cos(WK.camYaw), rx = -fz, rz = fx;
      let wx = fx * iz + rx * ix, wz = fz * iz + rz * ix;
      const wl = Math.hypot(wx, wz), swim = SW.on && !CL.on;
      const sp = (CL.on ? 0 : swim ? (run ? SWIM_RUN : SWIM) : player.crouch ? WALK * CROUCH_K : run ? RUN : WALK) * (analog ? mag : 1);
      WK.running = run && wl > 0 && !CL.on;
      const dirX = wl > 0 ? wx / wl : Math.sin(player.yaw), dirZ = wl > 0 ? wz / wl : Math.cos(player.yaw);
      if (wl > 0) { wx = wx / wl * sp; wz = wz / wl * sp; }
      const acc = 1 - Math.exp(-dt * (swim ? 4 : body.onGround ? 18 : 3));
      vel.x = AF.lerp(vel.x, wx, acc); vel.z = AF.lerp(vel.z, wz, acc);
      // Space: climb onto a ledge in front (<= 1.9 m above the water, 1.6 m above the feet), else jump (on land)
      const space = !modal && !CL.on && I.hit('Space');
      if (space && swim) tryClimb(dirX, dirZ, Math.max(body.y + 0.6, SW.wy - 0.4), SW.wy + CLIMB_WATER, true);
      else if (space && body.onGround && !tryClimb(dirX, dirZ, body.y + 0.6, Math.max(body.y, waterAt(body.x, body.z)) + 1.6, false)) { body.vy = 7.2; body.onGround = false; }
      const wasAir = !body.onGround, vy0 = body.vy;
      const ox = body.x, oz = body.z;
      let landed = false;
      if (CL.on) climbStep(dt);
      else if (swim) swimMove(dt, wl > 0, dirX, dirZ);
      else {
        AF.moveBody(body, vel.x * dt, vel.z * dt, dt, MB_WALK);
        depenetrate();
        landed = wasAir && body.onGround;
        // out of your depth (walked off a pier, fell or jumped in, waded too far): swim; the water breaks the fall
        if (deepAt(body.x, body.z, body.y, SWIM_IN)) { startSwim(wasAir ? vy0 : 0, false); landed = false; }
      }
      const bounds = AF.PLAN.world.play, margin = AF.PLAN.world.margin;
      body.x = AF.clamp(body.x, bounds.x0 - margin, bounds.x1 + margin);
      body.z = AF.clamp(body.z, bounds.z0 - margin, AF.PLAN.world.bounds.z1 - margin);
      if (landed) { AN.land = 0.6; AF.emit('land', -vy0); if (-vy0 > 8.5) { NZ.land = 0.3; NZ.landK = 1; } else if (-vy0 > 5) { NZ.land = 0.2; NZ.landK = 0.5; } }
      const hs = Math.hypot(body.x - ox, body.z - oz) / Math.max(dt, 1e-4);
      WK.speed = hs;
      AN.crouch += ((player.crouch ? 1 : 0) - AN.crouch) * (1 - Math.exp(-dt * 12));
      player.eyeH = EYE_STAND - (EYE_STAND - EYE_CROUCH) * AN.crouch;
      NZ.land = Math.max(0, NZ.land - dt);
      player.noise = Math.max(NZ.land > 0 ? NZ.landK : 0, !body.onGround || hs < 0.4 ? 0 : player.crouch ? 0.12 : hs > 7 ? 1 : 0.35 * Math.min(1, hs / 4));
      if (SW.on) player.noise = hs > 0.4 ? (WK.running ? 0.35 : 0.22) : 0.05; else if (CL.on) player.noise = 0.3;
      if (body.hitWall) { vel.x *= 0.6; vel.z *= 0.6; }
      if (CL.on) { /* facing the ledge */ }
      else if (WK.fp || PL.aim) player.yaw = WK.camYaw + PI;
      else if (wl > 0) player.yaw += AF.angDiff(player.yaw, Math.atan2(wx, wz)) * (1 - Math.exp(-dt * (SW.on ? 5 : 12)));
      if (!WK.fp && !locked && wl > 0 && iz > 0 && AF.clock.t - WK.lastMouse > 4) WK.camYaw += AF.angDiff(WK.camYaw, player.yaw + PI) * (1 - Math.exp(-dt * 0.9));
      if (body.y < -14 || !isFinite(body.y)) { const s = AF.PLAN.spawn; player.teleport(s.x, s.y, s.z, s.yaw); AF.emit('toast', 'Whoops \u2014 back to safe ground.'); }
      player.x = body.x; player.y = body.y; player.z = body.z;
      if (player.mesh) { player.mesh.position.set(body.x, body.y, body.z); player.mesh.rotation.y = player.yaw; }
      // swimming / climbing poses are set after combat's overlay (player-water-pose)
      // what's in hand (77) + how the travel lines up with the facing, for the carry / strafe / backpedal poses
      const cb = AF.combat;
      let hold = 0;
      if (cb) { const g = cb.gallery ? 'g' : cb.gun ? cb.gun() : null; if (g) { const d = g !== 'g' && cb.GUNS && cb.GUNS[g]; hold = d && d.cls === 'pistol' ? 1 : 2; } else if (cb.held) hold = 3; }
      AN.hold = hold; AN.aimK = PL.aim ? 1 : 0;
      AN.fwd = hs > 0.2 ? AF.clamp(((body.x - ox) * Math.sin(player.yaw) + (body.z - oz) * Math.cos(player.yaw)) / (hs * Math.max(dt, 1e-4)), -1, 1) : 1;
      if (player.parts && !SW.on && !CL.on) AV.animate(player.parts, AN, dt, hs, body.onGround);
      // interactions
      // interactions: the scan over every interact (hundreds of cars, doors, counters) runs at ~15 Hz, and at once on E / F
      const press = I.hit('KeyE') || I.hit('KeyF');
      if ((WK.itT = (WK.itT || 0) - dt) <= 0 || press || modal || CL.on) { WK.itT = 1 / 15; WK.it = modal || CL.on ? null : findInteract(); }
      const it = WK.it;
      AF.interactTarget = it;
      if (it && press && !talking) {
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
    if (AF.mode !== 'walk') player.noise = 0;
    if (!player.mesh || AF.mode === 'walk' || AF.mode === 'aerial' || AF.mode === 'skydive' || AF.mode === 'row' || AF.mode === 'dead') return;
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

  AF.test('player: C crouches (lower eye, small collider, quiet steps), standing up needs headroom', () => {
    const was = AF.mode, I = AF.input, S = AF.ui && AF.ui.state, title = S && S.title; if (S) S.title = false; if (AF.mode !== 'walk') AF.setMode('walk', {});
    const step = (n) => { for (let i = 0; i < n; i++) AF.modes.walk.update(1 / 30); };
    try {
      I.pressed.add('KeyC'); step(1); I.pressed.clear(); step(20);
      const low = player.crouch && body.h === CROUCH_H && player.eyeH < 1.05 && player.noise === 0 && !!player.parts.bent;
      I.down.add('KeyW'); step(20); const sneak = Math.abs(player.noise - 0.12) < 0.01 && WK.speed < WALK * 0.6;
      I.down.delete('KeyW'); I.pressed.add('KeyC'); step(1); I.pressed.clear(); I.down.add('KeyW'); step(20);
      const walk = !player.crouch && body.h === STAND_H && player.noise > 0.25 && player.noise < 0.45 && player.eyeH > 1.45;
      I.down.add('ShiftLeft'); step(20); const sprint = player.noise === 1;
      return { ok: low && sneak && walk && sprint, info: `crouch ${low}, sneak ${sneak} (${player.noise}), walk ${walk}, sprint ${sprint}` };
    } finally { I.down.delete('KeyW'); I.down.delete('ShiftLeft'); I.pressed.clear(); player.setCrouch(false); if (S) S.title = title; if (was && was !== AF.mode) AF.setMode(was); }
  });
  AF.test('player: deep water swims, Space at the quay climbs out, running off the quay swims again unhurt', () => {
    const was = AF.mode, I = AF.input, S = AF.ui && AF.ui.state, title = S && S.title; if (S) S.title = false;
    const step = (n) => { for (let i = 0; i < n; i++) AF.modes.walk.update(1 / 30); };
    const sea = HBR.waterY, H = AF.health, hp = H ? H.v : 0, x0 = body.x, y0 = body.y, z0 = body.z, yaw0 = player.yaw;
    try {
      // the harbour 3 m off the quay wall (z 210: top 0.25 + a 0.25 m coping; water -1.25, bed -4)
      AF.setMode('walk', { x: -100, y: sea, z: 213, yaw: PI, snap: true });
      const float = SW.on && Math.abs(body.y - (sea - SINK)) < 0.05;
      I.down.add('KeyW'); step(45); I.down.delete('KeyW');
      const swam = SW.on && body.z < 211 && Math.abs(body.y - (sea - SINK)) < 0.2;
      I.pressed.add('Space'); step(1); I.pressed.clear(); const climb = CL.on;
      step(40); const out = !CL.on && !SW.on && body.y > 0.2 && body.z < 210;
      AF.setMode('walk', { x: -40, y: 0.25, z: 205.5, yaw: 0, snap: true });
      I.down.add('KeyW'); I.down.add('ShiftLeft'); step(60);
      const back = SW.on && (!H || H.v >= hp);
      return { ok: float && swam && climb && out && back, info: `float ${float}, swam ${swam}, climb ${climb}, out ${out} (${body.y.toFixed(2)}), back in ${back}, ${wCells} water cells in ${WTILE.size} tiles` };
    } finally { I.down.delete('KeyW'); I.down.delete('ShiftLeft'); I.pressed.clear(); stopSwim(); CL.on = false; player.climbing = false; player.teleport(x0, y0, z0, yaw0); if (S) S.title = title; if (was && was !== AF.mode) AF.setMode(was); }
  });
}

// mouse-look sensitivity (saved per browser)
AF.lookSens = () => { if (AF._lookSens == null) { let v = NaN; try { v = parseFloat(localStorage.getItem('portSolace.lookSens')); } catch (e) {} AF._lookSens = isFinite(v) ? v : 0.45; } return AF._lookSens; };
AF.setLookSens = (v) => { AF._lookSens = AF.clamp(+v || 0.45, 0.05, 2); try { localStorage.setItem('portSolace.lookSens', String(AF._lookSens)); } catch (e) {} };

} catch (e) { AF.partError('70-player.js', e); }
