// ================================================================ 55-people.js
try {
// ===== 55-people: RESIDENTS — ~130 voxel townsfolk, sidewalk graph, schedules, animation, dialogue  (OWNER: people) =====
// Build 'people' (650): part models (1/16 m voxels) per resident, shared geometry cache, sidewalk graph from PLAN.roads + park paths.
// Tick 'people' (300): walkers route door -> graph -> door -> spot.path, keepers at counters, sitters, kids, chatting pairs.
// Exposes AF.people = [resident], AF.peopleGraph = {nodes, edges, route(ax,az,bx,bz)}, AF.peopleKit.
{
  const PL = AF.PLAN;
  const VS = 1 / 16;
  const TAU = Math.PI * 2;
  const K = AF.peopleKit = {};

  // ------------------------------------------------------------ colours
  const cc = new Map();
  const ck = (hex, j = 0.1, e = 0.12) => { const k = hex * 7 + j * 3 + e; let i = cc.get(k); if (!i) { i = AF.col(hex, { jitter: j, edge: e }); cc.set(k, i); } return i; };
  const shade = (hex, f) => { const r = Math.min(255, Math.round(((hex >> 16) & 255) * f)), g = Math.min(255, Math.round(((hex >> 8) & 255) * f)), b = Math.min(255, Math.round((hex & 255) * f)); return (r << 16) | (g << 8) | b; };
  const mix = (a, b, t) => { const r = Math.round(((a >> 16) & 255) * (1 - t) + ((b >> 16) & 255) * t), g = Math.round(((a >> 8) & 255) * (1 - t) + ((b >> 8) & 255) * t), bl = Math.round((a & 255) * (1 - t) + (b & 255) * t); return (r << 16) | (g << 8) | bl; };
  const SKIN = [0xf6d5b8, 0xefc19f, 0xe2a97f, 0xc98d62, 0xa46a45, 0x7a4a2e, 0xf3cbb0];
  const HAIR = { black: 0x221c18, dbrown: 0x3f2a1c, brown: 0x6b4527, auburn: 0x8a3b1f, ginger: 0xc0612b, blonde: 0xdcb86a, sandy: 0xb98f55, grey: 0x9a968f, white: 0xe4e0d8 };
  const CLOTH = {
    navy: 0x2c3a5a, brown: 0x6a4a32, tan: 0xb89a6e, charcoal: 0x45464b, grey: 0x8a8a86, cream: 0xefe6cf, white: 0xf3f0e6,
    red: 0xb3342c, maroon: 0x7a2630, rust: 0xb0592c, mustard: 0xd1a23a, olive: 0x6f7340, forest: 0x3d6446, teal: 0x3f7f7c,
    sky: 0x86b3d6, powder: 0xb9d3e8, pink: 0xe79aa8, rose: 0xd06a7c, mint: 0xa8d8b8, lilac: 0xb7a0cf, lemon: 0xf0dc7a,
    peach: 0xf2b48e, denim: 0x3e5f8a, khaki: 0xa99c6f, plum: 0x6a3b5c, camel: 0xc19a62, sage: 0x9fb08a, coral: 0xe7806a,
  };
  const CL = Object.values(CLOTH);
  const pick = (r, a) => a[Math.floor(r() * a.length) % a.length];

  // ------------------------------------------------------------ model builders
  // Body plans (voxels at 1/16 m). legs + torso + head(8) = total height.
  const PLANS = {
    man: { lh: 11, th: 9, tw: 8, td: 5, aw: 2, ah: 9, lw: 3, ld: 4 },
    woman: { lh: 11, th: 8, tw: 8, td: 4, aw: 2, ah: 8, lw: 3, ld: 4 },
    elder: { lh: 10, th: 8, tw: 8, td: 5, aw: 2, ah: 8, lw: 3, ld: 4 },
    teen: { lh: 9, th: 7, tw: 7, td: 4, aw: 2, ah: 7, lw: 3, ld: 3 },
    kid: { lh: 6, th: 6, tw: 6, td: 4, aw: 2, ah: 5, lw: 3, ld: 3 },
  };
  K.PLANS = PLANS;

  function headModel(L) {
    const m = new AF.Model(14, 16, 14);
    const sk = ck(L.skin), skD = ck(shade(L.skin, 0.86)), hr = ck(L.hair, 0.25), hrD = ck(shade(L.hair, 0.72), 0.2);
    m.box(3, 0, 3, 11, 8, 11, sk);
    m.set(2, 3, 6, sk); m.set(2, 4, 6, skD); m.set(11, 3, 6, sk); m.set(11, 4, 6, skD);     // ears
    const H = L.hairStyle, top = (y = 7) => m.box(3, y, 3, 11, 8, 11, hr);
    const back = (y0 = 3) => { m.box(3, y0, 3, 11, 8, 4, hr); m.box(3, Math.max(y0, 4), 3, 4, 8, 7, hr); m.box(10, Math.max(y0, 4), 3, 11, 8, 7, hr); };
    if (H === 'bald') { m.box(3, 3, 3, 11, 6, 4, hr); m.box(3, 3, 3, 4, 6, 7, hr); m.box(10, 3, 3, 11, 6, 7, hr); }
    else if (H === 'crew') { top(7); back(4); }
    else if (H === 'short' || H === 'part' || H === 'slick') {
      top(7); back(3); m.box(3, 7, 10, 11, 8, 11, hr);
      if (H === 'part') { m.box(3, 8, 3, 8, 9, 11, hr); m.box(3, 6, 10, 6, 7, 11, hr); }
      if (H === 'slick') { m.box(4, 8, 4, 10, 9, 11, hrD); m.box(3, 8, 3, 11, 9, 9, hr); }
    } else if (H === 'curly') {
      top(7); back(2); for (let x = 2; x < 12; x++) for (let z = 2; z < 12; z++) if (((x * 7 + z * 13) % 3) !== 0 && x > 2 && x < 11 && z > 2) m.set(x, 8, z, (x + z) % 2 ? hr : hrD);
      m.box(2, 3, 3, 3, 8, 8, hr); m.box(11, 3, 3, 12, 8, 8, hr); m.box(3, 6, 10, 11, 7, 11, hr); m.set(4, 6, 11, hrD); m.set(7, 6, 11, hrD); m.set(9, 6, 11, hrD);
    } else if (H === 'bob' || H === 'long' || H === 'wavy' || H === 'bun' || H === 'ponytail' || H === 'pigtails' || H === 'updo') {
      top(7); m.box(3, 8, 3, 11, 9, 10, hr); m.box(3, 6, 10, 11, 8, 11, hr);
      const low = H === 'long' ? 0 : H === 'bun' || H === 'updo' || H === 'ponytail' ? 3 : 1;
      m.box(2, low, 3, 3, 8, 10, hr); m.box(11, low, 3, 12, 8, 10, hr); m.box(3, low, 2, 11, 8, 3, hr); m.box(3, low, 3, 11, 8, 4, hr);
      if (H === 'long') { m.box(3, 0, 1, 11, 7, 2, hr); m.box(2, 0, 2, 12, 2, 3, hrD); }
      if (H === 'wavy') { for (let y = 1; y < 8; y += 2) { m.set(1, y, 5, hr); m.set(12, y, 5, hr); m.set(1, y, 7, hrD); m.set(12, y, 7, hrD); } m.box(4, 6, 11, 7, 7, 12, hr); }
      if (H === 'bun') { m.box(5, 8, 2, 9, 11, 5, hr); m.box(6, 9, 1, 8, 10, 2, hrD); }
      if (H === 'updo') { m.box(4, 9, 3, 10, 11, 9, hr); m.box(5, 11, 4, 9, 12, 8, hrD); }
      if (H === 'ponytail') { m.box(6, 4, 0, 8, 8, 2, hr); m.box(6, 7, 1, 8, 8, 3, hrD); m.set(6, 3, 0, hr); }
      if (H === 'pigtails') { const rb = ck(L.ribbon || 0xd0404a); m.box(0, 2, 5, 2, 6, 7, hr); m.box(12, 2, 5, 14, 6, 7, hr); m.box(1, 5, 5, 2, 7, 7, rb); m.box(12, 5, 5, 13, 7, 7, rb); }
    } else { top(7); back(3); }
    // face (front = +z)
    const eye = ck(0x1f1a17, 0, 0), white = ck(0xf6f2ea, 0, 0);
    m.set(5, 3, 10, eye); m.set(8, 3, 10, eye);
    if (L.kid || L.female) { m.set(4, 3, 10, white); m.set(9, 3, 10, white); m.set(4, 3, 10, sk); m.set(9, 3, 10, sk); }
    if (H !== 'bald' || L.brows) { const bc = L.hair === HAIR.white || L.hair === HAIR.grey ? ck(0x8d8984) : hrD; m.set(4, 5, 10, bc); m.set(5, 5, 10, bc); m.set(8, 5, 10, bc); m.set(9, 5, 10, bc); }
    else { const bc = ck(0x8d8984); m.set(5, 5, 10, bc); m.set(8, 5, 10, bc); }
    m.set(6, 2, 11, skD); m.set(7, 2, 11, skD); m.set(6, 3, 10, sk); m.set(7, 3, 10, sk);
    const mouth = ck(L.lipstick ? 0xa83a42 : mix(L.skin, 0x5a2a24, 0.55), 0, 0);
    m.set(6, 1, 10, mouth); m.set(7, 1, 10, mouth);
    if (L.smile) { m.set(5, 1, 10, skD); m.set(8, 1, 10, skD); }
    if (L.cheeks) { const ch = ck(mix(L.skin, 0xe0605a, 0.35), 0, 0); m.set(4, 2, 10, ch); m.set(9, 2, 10, ch); }
    if (L.freckles) { const fr = ck(shade(L.skin, 0.75), 0, 0); m.set(4, 2, 10, fr); m.set(9, 2, 10, fr); m.set(5, 2, 10, fr); }
    if (L.moustache || L.beard) { const mc = ck(L.beardCol || L.hair, 0.2); m.box(5, 2, 11, 9, 3, 12, mc); m.set(6, 2, 11, skD); m.set(7, 2, 11, skD); m.box(5, 1, 11, 9, 2, 12, mc); m.set(6, 1, 11, 0); m.set(7, 1, 11, 0); m.set(4, 1, 11, L.beard ? mc : 0); m.set(9, 1, 11, L.beard ? mc : 0); }
    if (L.beard) { const mc = ck(L.beardCol || L.hair, 0.2); m.box(3, 0, 9, 11, 1, 12, mc); m.box(3, 0, 4, 4, 3, 10, mc); m.box(10, 0, 4, 11, 3, 10, mc); m.set(6, 1, 11, ck(0x8e4a44)); m.set(7, 1, 11, ck(0x8e4a44)); m.box(4, 0, 11, 10, 1, 12, mc); }
    if (L.glasses) {
      const fr = ck(L.glasses === 'gold' ? 0xc9a646 : 0x2a2522, 0, 0), ln = ck(0xcfe3ea, 0, 0);
      m.box(4, 3, 11, 10, 4, 12, fr); m.set(5, 3, 11, ln); m.set(8, 3, 11, ln); m.set(4, 4, 11, fr); m.set(9, 4, 11, fr);
      m.box(3, 3, 7, 3.99, 4, 11, fr); m.box(10, 3, 7, 11, 4, 11, fr); m.set(2, 3, 7, fr); m.set(11, 3, 7, fr);
    }
    // hats
    const hat = L.hat; if (hat) {
      const h1 = ck(L.hatCol ?? 0x5a4a3a, 0.2), h2 = ck(L.hatCol2 ?? shade(L.hatCol ?? 0x5a4a3a, 0.6), 0.15), disc = (y, r, c, cx = 7, cz = 7) => { for (let x = 0; x < 14; x++) for (let z = 0; z < 14; z++) { const dx = x + 0.5 - cx, dz = z + 0.5 - cz; if (dx * dx + dz * dz <= r * r) m.set(x, y, z, c); } };
      if (hat === 'fedora') { disc(8, 5.6, h1); m.box(3, 9, 3, 11, 11, 11, h1); m.box(3, 9, 3, 11, 10, 11, h2); m.box(4, 11, 4, 10, 12, 10, h1); m.box(6, 11, 5, 8, 12, 9, 0); }
      else if (hat === 'flatcap' || hat === 'newsboy') { m.box(3, 8, 3, 11, 9, 11, h1); m.box(3, 9, 3, 11, 10, 10, h1); m.box(3, 8, 11, 11, 9, 13, h2); if (hat === 'newsboy') { m.box(2, 9, 2, 12, 10, 11, h1); m.box(4, 10, 3, 10, 11, 10, h1); m.set(7, 11, 6, h2); } for (let x = 3; x < 11; x += 2) m.set(x, 9, 10, h2); }
      else if (hat === 'baseball') { m.box(3, 8, 3, 11, 9, 11, h1); m.box(4, 9, 4, 10, 10, 10, h1); m.box(4, 8, 11, 10, 9, 14, h2); m.set(7, 10, 7, h2); m.box(6, 8, 10, 8, 10, 11, ck(0xf3f0e6)); }
      else if (hat === 'straw') { disc(8, 6.9, h1); m.box(4, 9, 4, 10, 11, 10, h1); m.box(4, 9, 4, 10, 10, 10, h2); m.box(5, 11, 5, 9, 12, 9, h1); }
      else if (hat === 'beret') { m.box(2, 8, 3, 12, 9, 12, h1); m.box(3, 9, 3, 11, 10, 11, h1); m.box(9, 8, 9, 13, 9, 12, h1); m.set(7, 10, 7, h2); }
      else if (hat === 'bonnet') { m.box(3, 8, 3, 11, 9, 11, h1); m.box(2, 2, 3, 3, 9, 11, h1); m.box(11, 2, 3, 12, 9, 11, h1); m.box(3, 2, 2, 11, 9, 3, h1); m.box(2, 8, 10, 12, 10, 12, h1); m.box(2, 2, 10, 3, 9, 12, h1); m.box(11, 2, 10, 12, 9, 12, h1); m.box(3, 0, 10, 4, 2, 11, h2); m.box(10, 0, 10, 11, 2, 11, h2); m.box(6, 9, 3, 8, 10, 11, h2); }
      else if (hat === 'police' || hat === 'conductor' || hat === 'mailcap' || hat === 'milkcap') {
        const band = hat === 'police' ? ck(0x1c1c22) : hat === 'conductor' ? ck(0xc9a646, 0.1) : h2;
        m.box(3, 8, 3, 11, 10, 11, h1); m.box(3, 8, 3, 11, 9, 11, band); m.box(2, 10, 2, 12, 11, 12, h1); m.box(3, 8, 11, 11, 9, 13, ck(0x1c1c22));
        m.set(7, 9, 11, ck(0xd8b84a, 0, 0)); m.set(6, 9, 11, ck(0xd8b84a, 0, 0));
      }
      else if (hat === 'tophat') { disc(8, 5.4, h1); m.box(4, 9, 4, 10, 15, 10, h1); m.box(4, 9, 4, 10, 10, 10, h2); m.box(4, 15, 4, 10, 16, 10, h1); }
      else if (hat === 'toque') { m.box(3, 8, 3, 11, 11, 11, h1); m.box(2, 11, 2, 12, 13, 12, h1); m.box(3, 13, 3, 11, 14, 11, h1); m.box(3, 8, 3, 11, 9, 11, ck(0xe2ddd2)); }
      else if (hat === 'paper') { m.box(3, 8, 5, 11, 9, 9, h1); m.box(4, 9, 6, 10, 10, 8, h1); m.box(5, 10, 6, 9, 11, 8, h1); m.box(3, 8, 8, 11, 9, 9, h2); }
      else if (hat === 'nurse') { m.box(4, 8, 6, 10, 10, 10, h1); m.box(3, 8, 9, 11, 9, 10, h1); const rc = ck(0xc8322e, 0, 0); m.set(7, 9, 10, rc); m.set(6, 9, 10, rc); }
      else if (hat === 'firehelmet') { disc(8, 5.2, h1, 7, 6.5); m.box(3, 9, 3, 11, 11, 11, h1); m.box(4, 11, 4, 10, 12, 10, h1); m.box(3, 8, 0, 11, 9, 4, h1); m.box(6, 9, 11, 9, 12, 12, ck(0xd8b84a, 0.1)); m.set(7, 12, 7, h2); }
      else if (hat === 'pillbox') { m.box(4, 8, 4, 10, 10, 10, h1); m.box(4, 9, 4, 10, 10, 10, h2); m.set(9, 9, 9, ck(0xf3f0e6)); }
      else if (hat === 'cloche') { m.box(2, 5, 2, 12, 9, 12, h1); m.box(3, 9, 3, 11, 10, 11, h1); m.box(2, 6, 2, 12, 7, 12, h2); m.box(3, 5, 10, 11, 6, 12, 0); m.box(4, 3, 11, 10, 5, 12, 0); }
      else if (hat === 'bow') { const bc = h1; m.box(4, 8, 6, 6, 10, 8, bc); m.box(7, 8, 6, 9, 10, 8, bc); m.set(6, 8, 7, h2); }
      else if (hat === 'scarf') { m.box(2, 3, 2, 12, 9, 11, h1); m.box(3, 3, 3, 11, 8, 11, 0); m.box(3, 8, 3, 11, 9, 11, h1); m.box(3, 3, 10, 11, 8, 11, 0); m.box(2, 3, 10, 3, 8, 11, h1); m.box(11, 3, 10, 12, 8, 11, h1); for (let x = 2; x < 12; x += 2) m.set(x, 6, 2, h2); m.box(6, 0, 11, 8, 2, 12, h1); m.box(3, 3, 3, 11, 8, 10, 0); top(7); m.box(3, 7, 3, 11, 9, 10, h1); }
      else if (hat === 'bucket') { disc(8, 5.4, h1); m.box(3, 9, 3, 11, 11, 11, h1); m.box(4, 11, 4, 10, 12, 10, h2); for (let x = 1; x < 13; x += 3) m.set(x, 8, 7, h2); }
      else if (hat === 'bellhop') { m.box(4, 8, 4, 10, 11, 10, h1); m.box(4, 8, 4, 10, 9, 10, ck(0xd8b84a, 0.1)); m.set(7, 11, 7, ck(0x1c1c22)); }
    }
    return m;
  }

  // torso (+skirt / coat tails below the hip pivot)
  function torsoModel(L, B) {
    const sk = L.skirt ? L.skirt.len : 0, fl = L.skirt ? L.skirt.flare : 0;
    const W = B.tw + 6, D = B.td + 6, H = B.th + sk;
    const m = new AF.Model(W, H, D);
    const x0 = 3, x1 = 3 + B.tw, z0 = 3, z1 = 3 + B.td, y0 = sk, y1 = sk + B.th, F = z1 - 1, cx = x0 + (B.tw >> 1);
    const T = L.top, c1 = ck(T.col, 0.14), c2 = ck(T.col2 ?? shade(T.col, 0.7), 0.12), c3 = ck(T.col3 ?? 0xf3f0e6, 0.08);
    const skin = ck(L.skin), gold = ck(0xd8b84a, 0.05, 0.05), blk = ck(0x1f1d1c, 0.05), wht = ck(0xf3f0e6, 0.05, 0.08);
    m.box(x0, y0, z0, x1, y1, z1, c1);
    // neck
    m.box(cx - 1, y1 - 1, z0 + 1, cx + 1, y1, z1 - 1, skin);
    const front = (xa, ya, xb, yb, c, z = F) => m.box(xa, ya, z, xb, yb, z + 1, c);
    const rowAll = (y, c) => { m.box(x0, y, z0, x1, y + 1, z1, c); };
    const belt = (c = blk) => { rowAll(y0, c); m.set(cx - 1, y0, F, gold); m.set(cx, y0, F, gold); };
    const collar = (c = c3) => { front(cx - 2, y1 - 1, cx + 2, y1, c); m.set(cx - 2, y1 - 2, F, c); m.set(cx + 1, y1 - 2, F, c); m.set(cx - 1, y1 - 1, F, skin); m.set(cx, y1 - 1, F, skin); };
    const buttons = (col, x = cx) => { for (let y = y0 + 1; y < y1 - 1; y += 2) m.set(x, y, F, col); };
    switch (T.style) {
      case 'suit': case 'vest': {
        front(cx - 1, y0 + 3, cx + 1, y1, c3); front(cx - 1, y0 + 1, cx + 1, y1 - 1, ck(T.tie ?? 0x9a2f2f, 0.1)); m.set(cx - 1, y0 + 1, F, c1);
        m.set(cx - 2, y1 - 1, F, c2); m.set(cx + 1, y1 - 1, F, c2); m.set(cx - 2, y1 - 2, F, c2); m.set(cx + 1, y1 - 2, F, c2);
        if (T.style === 'suit') { m.set(x1 - 2, y1 - 3, F, c3); m.set(cx - 2, y0 + 2, F, blk); m.set(cx - 2, y0 + 4, F, blk); rowAll(y0, c2); m.box(x0, y0, F, x0 + 2, y0 + 2, F + 1, c1); }
        else { front(x0, y1 - 3, x0 + 1, y1, c3); front(x1 - 1, y1 - 3, x1, y1, c3); m.box(x0, y1 - 3, z0, x0 + 1, y1, z1, c3); m.box(x1 - 1, y1 - 3, z0, x1, y1, z1, c3); m.set(cx - 2, y0 + 2, F, gold); m.set(cx - 2, y0 + 4, F, gold); if (T.chain) { m.set(x1 - 3, y0 + 3, F, gold); m.set(x1 - 2, y0 + 2, F, gold); } }
        break;
      }
      case 'shirt': collar(); buttons(c2); belt(); break;
      case 'sweater': collar(c3); rowAll(y0, c2); if (T.stripe) { rowAll(y0 + 3, c2); rowAll(y0 + 5, c2); } if (T.argyle) for (let y = y0 + 1; y < y1 - 2; y++) for (let x = x0; x < x1; x++) if ((x + y) % 4 === 0 || (x - y + 40) % 4 === 0) m.set(x, y, F, c2); break;
      case 'letterman': { front(cx - 1, y0, cx + 1, y1, c3); m.box(x0, y0, z0, x1, y0 + 1, z1, c3); buttons(c3, cx - 2); const L2 = ck(T.col2 ?? 0xf3e7c8); front(x1 - 3, y0 + 3, x1 - 1, y0 + 6, L2); m.set(x1 - 3, y0 + 5, F, c1); break; }
      case 'cardigan': front(cx - 1, y0, cx + 1, y1, c3); for (let y = y0 + 1; y < y1 - 1; y += 2) { m.set(cx - 2, y, F, c2); m.set(cx + 1, y, F, c2); } rowAll(y0, c2); break;
      case 'blouse': collar(wht); if (T.brooch) m.set(cx - 2, y1 - 3, F, gold); buttons(c2); break;
      case 'dress': collar(wht); if (T.dots) for (let y = y0; y < y1 - 1; y++) for (let x = x0; x < x1; x++) for (let z = z0; z < z1; z++) if ((x * 3 + y * 5 + z * 7) % 5 === 0) m.set(x, y, z, c3); m.box(x0, y0, z0, x1, y0 + 1, z1, c2); break;
      case 'striped': for (let y = y0; y < y1 - 1; y += 2) rowAll(y, c2); collar(c1); break;
      case 'plaid': for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) for (let z = z0; z < z1; z++) { const a = (x + z) % 3 === 0, b = y % 3 === 0; if (a || b) m.set(x, y, z, a && b ? blk : c2); } collar(c1); break;
      case 'police': buttons(gold); m.set(x1 - 2, y1 - 3, F, gold); m.set(x0 + 1, y1 - 3, F, ck(0x9aa0aa)); belt(blk); collar(c2); m.box(x0, y0 + 1, z0, x0 + 1, y1 - 1, z0 + 1, c2); m.box(x0 + 1, y0 + 1, F, x0 + 2, y1 - 1, F + 1, ck(0x1a1a1f)); break;
      case 'mail': { collar(c1); buttons(c2); belt(blk); const br = ck(0x6a4424, 0.2); for (let i = 0; i < B.th; i++) { const x = x0 + Math.round(i * (B.tw - 1) / (B.th - 1)); m.set(x, y1 - 1 - i, F + 1, br); m.set(x, y1 - 1 - i, z0 - 1, br); } m.box(x1 - 1, y0 - 1, z0 - 1, x1 + 2, y0 + 4, z1 + 1, br); m.box(x1 - 1, y0 + 2, z0 - 1, x1 + 2, y0 + 4, z1 + 1, ck(0x553618)); m.set(x1, y0 + 3, z1, gold); break; }
      case 'bowtie': { collar(c1); const bt = ck(T.tie ?? 0x1f1d1c); m.set(cx - 2, y1 - 2, F + 1, bt); m.set(cx + 1, y1 - 2, F + 1, bt); m.set(cx - 1, y1 - 2, F + 1, bt); m.set(cx, y1 - 2, F + 1, bt); buttons(c2); belt(ck(0x3a3a3a)); break; }
      case 'tunic': collar(c1); for (let y = y0 + 1; y < y1 - 1; y += 2) m.set(x1 - 2, y, F, c2); break;
      case 'fire': { const yl = ck(0xe8c23a, 0.1); rowAll(y0 + 2, yl); rowAll(y0 + 5, yl); for (let y = y0 + 1; y < y1 - 1; y += 2) m.set(cx, y, F, ck(0x9aa0aa)); collar(c2); break; }
      case 'suspenders': { collar(c1); buttons(c2); const s = ck(T.col2 ?? 0xb3342c); for (let y = y0; y < y1 - 1; y++) { m.set(x0 + 1, y, F, s); m.set(x1 - 2, y, F, s); m.set(x0 + 1, y, z0, s); m.set(x1 - 2, y, z0, s); } m.set(x0 + 1, y0 + 1, F, gold); m.set(x1 - 2, y0 + 1, F, gold); break; }
      case 'labcoat': { front(cx - 1, y0 + 2, cx + 1, y1, ck(T.shirt ?? 0x86b3d6)); front(cx - 1, y0 + 2, cx, y1 - 1, ck(T.tie ?? 0x2c3a5a)); m.set(x1 - 2, y1 - 3, F, ck(0x3a6ab0)); const st = ck(0x6a6d72, 0.05); m.box(cx - 2, y1 - 1, z0, cx + 2, y1, z1, st); m.set(cx - 3, y1 - 2, F, st); m.set(cx - 3, y1 - 3, F, st); m.set(cx - 3, y1 - 4, F, ck(0xb8bcc2)); break; }
      case 'nurse': collar(wht); m.set(cx - 2, y1 - 3, F, ck(0x9aa0aa)); rowAll(y0, wht); break;
      case 'conductor': buttons(gold, cx - 2); buttons(gold, cx + 1); front(cx - 1, y1 - 3, cx + 1, y1, c3); m.set(cx - 1, y1 - 2, F, blk); m.set(cx, y1 - 2, F, blk); m.set(x1 - 3, y0 + 3, F, gold); m.set(x1 - 2, y0 + 2, F, gold); m.set(x1 - 1, y0 + 2, F, gold); rowAll(y0, c2); break;
      case 'smock': { collar(c1); const sp = [0xd0402f, 0x3a70c0, 0xe8c23a, 0x4a9a5a]; for (let i = 0; i < 12; i++) { const x = x0 + ((i * 37) % B.tw), y = y0 + ((i * 53) % B.th); m.set(x, y, (i % 3) ? F : z0, ck(sp[i % 4], 0)); } break; }
      case 'clergy': { m.set(cx - 1, y1 - 1, F, wht); m.set(cx, y1 - 1, F, wht); m.set(cx - 1, y1 - 2, F, wht); m.set(cx, y1 - 2, F, wht); buttons(ck(0x2a2a2a)); break; }
      case 'bellhop': { buttons(gold, cx - 2); buttons(gold, cx + 1); front(x0, y1 - 1, x1, y1, gold); rowAll(y0, gold); m.set(cx - 1, y1 - 1, F, skin); m.set(cx, y1 - 1, F, skin); break; }
      case 'coverall': { collar(c1); for (let y = y0; y < y1 - 1; y++) m.set(cx, y, F, c2); front(x0 + 1, y1 - 4, x0 + 4, y1 - 2, wht); m.set(x0 + 2, y1 - 3, F, ck(0xb3342c)); belt(ck(0x3a3a3a)); break; }
      default: collar(); break;
    }
    // overlays
    if (L.overalls) {
      const dn = ck(L.overalls, 0.2), btn = gold;
      m.box(x0 + 1, y0, F, x1 - 1, y0 + Math.round(B.th * 0.62), F + 1, dn); rowAll(y0, dn); m.box(x0, y0, z0, x1, y0 + 2, z1, dn);
      for (let y = y0; y < y1; y++) { m.set(x0 + 1, y, F, dn); m.set(x1 - 2, y, F, dn); m.set(x0 + 1, y, z0, dn); m.set(x1 - 2, y, z0, dn); }
      m.set(x0 + 1, y0 + Math.round(B.th * 0.62) - 1, F, btn); m.set(x1 - 2, y0 + Math.round(B.th * 0.62) - 1, F, btn); m.box(cx - 1, y0 + 2, F + 1, cx + 1, y0 + 4, F + 2, ck(shade(L.overalls, 0.8)));
    }
    if (L.apron) {
      const ap = ck(L.apron, 0.08, 0.08), top = L.apronBib ? y1 - 2 : y0 + 1;
      m.box(x0 + 1, y0 - Math.min(sk, 4), F + 1, x1 - 1, top, F + 2, ap); rowAll(y0, ap);
      if (L.apronBib) { m.set(x0 + 1, y1 - 1, F + 1, ap); m.set(x1 - 2, y1 - 1, F + 1, ap); }
      if (sk) m.box(x0 + 1, 0, F + 1 + fl, x1 - 1, sk, F + 2 + fl, ap);
      m.box(x1 - 3, y0 - 1, F + 2, x1 - 1, y0 + 1, F + 3, ap);
    }
    if (L.newsbag) { const cv = ck(0xcdb98a, 0.2), pp = ck(0xf1ede2, 0.1); for (let i = 0; i < B.th; i++) { const x = x1 - 1 - Math.round(i * (B.tw - 1) / (B.th - 1)); m.set(x, y1 - 1 - i, F + 1, cv); m.set(x, y1 - 1 - i, z0 - 1, cv); } m.box(x0 - 2, y0 - 2, z0, x0 + 1, y0 + 3, z1, cv); m.box(x0 - 2, y0 + 3, z0 + 1, x0, y0 + 4, z1 - 1, pp); }
    if (L.sash) { const s = ck(L.sash, 0.1); for (let i = 0; i < B.th; i++) { const x = x0 + Math.round(i * (B.tw - 1) / (B.th - 1)); m.set(x, y1 - 1 - i, F + 1, s); } }
    if (L.tape) { const t = ck(0xe8d24a, 0.05); m.box(cx - 3, y1 - 1, F, cx - 2, y1, F + 1, t); m.box(cx + 2, y1 - 1, F, cx + 3, y1, F + 1, t); for (let y = y1 - 5; y < y1; y++) { m.set(cx - 3, y, F + 1, t); m.set(cx + 2, y, F + 1, t); } }
    // skirt / coat tails
    if (sk) {
      const S = L.skirt, sc = ck(S.col, 0.14), sc2 = ck(S.col2 ?? shade(S.col, 0.75), 0.12);
      for (let y = 0; y < sk; y++) {
        const f = Math.round((sk - y) / sk * fl);
        m.box(x0 - f, y, z0 - f, x1 + f, y + 1, z1 + f, y === 0 && S.hem ? sc2 : sc);
        if (S.open) m.box(cx - 1, y, z1 + f - 1, cx + 1, y + 1, z1 + f, 0);
        if (S.dots && (y % 2 === 1)) for (let x = x0 - f; x < x1 + f; x += 2) m.set(x, y, z1 + f - 1, sc2);
        if (S.pleats) for (let x = x0 - f + 1; x < x1 + f; x += 2) m.set(x, y, z1 + f - 1, sc2);
      }
      if (S.poodle) { const pw = ck(0xf6f2ea, 0.05); m.box(x0 + 1, 1, z1 + fl - 1, x0 + 4, 3, z1 + fl, pw); m.set(x0 + 3, 3, z1 + fl - 1, pw); m.set(x0 + 1, 3, z1 + fl - 1, blk); }
      if (S.open) m.box(x0, 0, z0, x1, sk, z1, 0);
    }
    return { m, pivotY: sk };
  }

  function armModel(L, B, side) {
    const T = L.top, sl = ck(T.sleeve ?? T.col, 0.14), skin = ck(L.skin), cuffC = ck(T.cuff ?? 0xf3f0e6, 0.05);
    const prop = side < 0 ? L.propR : L.propL;
    const ah = B.ah, extra = prop ? 14 : 0, W = prop ? 6 : B.aw, D = prop ? 11 : 3, ox = prop ? 2 : 0, oz = prop ? 4 : 0;
    const m = new AF.Model(W, ah + extra, D);
    const yb = extra;
    const shortS = T.short;
    m.box(ox, yb, oz, ox + B.aw, yb + ah, oz + 3, sl);
    if (shortS) m.box(ox, yb, oz, ox + B.aw, yb + ah - 3, oz + 3, skin);
    m.box(ox, yb, oz, ox + B.aw, yb + 2, oz + 3, skin);
    if (T.cuffs) m.box(ox, yb + 2, oz, ox + B.aw, yb + 3, oz + 3, cuffC);
    if (prop) {
      const hx = ox, hz = oz + 1;
      if (prop === 'cane') { const c = ck(0x4a2e1c, 0.1); m.box(hx, 0, hz + 2, hx + 1, yb + 1, hz + 3, c); m.box(hx, yb, hz, hx + 1, yb + 1, hz + 3, c); m.set(hx, 0, hz + 2, ck(0x222222)); }
      else if (prop === 'briefcase') { const c = ck(0x6a4424, 0.15); m.box(hx, yb - 6, hz - 3, hx + 2, yb - 1, hz + 5, c); m.box(hx, yb - 1, hz, hx + 2, yb, hz + 2, ck(0x3a2414)); m.set(hx, yb - 2, hz + 1, ck(0xd8b84a)); }
      else if (prop === 'purse') { const c = ck(L.purseCol ?? 0x7a2630, 0.1); m.box(hx - 1, yb - 4, hz - 1, hx + 3, yb - 1, hz + 3, c); m.box(hx, yb - 1, hz, hx + 2, yb, hz + 1, c); m.set(hx + 1, yb - 2, hz + 3, ck(0xd8b84a)); }
      else if (prop === 'brush') { m.box(hx, yb - 1, hz + 1, hx + 1, yb, hz + 7, ck(0xb58a52)); m.box(hx - 1, yb - 2, hz + 7, hx + 2, yb + 1, hz + 9, ck(0x9aa0aa)); m.box(hx - 1, yb - 2, hz + 9, hx + 2, yb + 1, hz + 10, ck(0x3a70c0)); }
      else if (prop === 'paper') { m.box(hx - 1, yb - 1, hz - 2, hx + 3, yb + 1, hz + 5, ck(0xece6d6, 0.2)); m.set(hx - 1, yb, hz + 4, ck(0x333333)); }
      else if (prop === 'crate') { const w = ck(0x9aa0aa, 0.1), bt = ck(0xf6f4ee, 0.05); m.box(hx - 2, yb - 5, hz - 3, hx + 4, yb - 4, hz + 5, w); for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) m.box(hx - 2 + j * 3, yb - 4, hz - 3 + i * 3, hx - 1 + j * 3, yb, hz - 2 + i * 3, bt); m.box(hx, yb - 1, hz - 3, hx + 2, yb, hz + 5, w); }
      else if (prop === 'cone') { m.box(hx, yb, hz + 3, hx + 2, yb + 2, hz + 4, ck(0xc8964e)); m.box(hx, yb + 2, hz + 3, hx + 2, yb + 4, hz + 5, ck(0xf2b8c6)); }
      else if (prop === 'bag') { const c = ck(0x1f1d1c, 0.1); m.box(hx - 1, yb - 5, hz - 2, hx + 3, yb - 1, hz + 4, c); m.box(hx, yb - 1, hz, hx + 2, yb, hz + 2, c); m.set(hx + 1, yb - 2, hz + 4, ck(0xd8b84a)); }
      else if (prop === 'book') { m.box(hx - 1, yb - 1, hz - 1, hx + 3, yb + 3, hz + 1, ck(0x3d6446, 0.1)); m.box(hx - 1, yb - 1, hz + 1, hx + 3, yb + 3, hz + 2, ck(0xf1ede2)); }
      else if (prop === 'rod') { const c = ck(0x6a4424); for (let i = 0; i < 12; i++) m.set(hx, yb + Math.min(13, i), hz + 1 + i >> 0, c); }
      else if (prop === 'bucket') { const c = ck(0x9aa0aa, 0.1); m.box(hx - 2, yb - 5, hz - 2, hx + 4, yb - 1, hz + 4, c); m.box(hx - 1, yb - 2, hz - 1, hx + 3, yb - 1, hz + 3, ck(0x6f5a3a)); m.box(hx, yb - 1, hz, hx + 2, yb, hz + 2, c); }
      else if (prop === 'pitchfork') { const c = ck(0x9a7040); m.box(hx, 0, hz + 1, hx + 1, yb + 8, hz + 2, c); const t = ck(0x8a8a86); m.box(hx - 1, yb + 8, hz + 1, hx + 2, yb + 9, hz + 2, t); m.box(hx - 1, yb + 9, hz + 1, hx, yb + 12, hz + 2, t); m.box(hx + 1, yb + 9, hz + 1, hx + 2, yb + 12, hz + 2, t); m.box(hx, yb + 9, hz + 1, hx + 1, yb + 12, hz + 2, t); }
      else if (prop === 'broom') { const c = ck(0x9a7040); m.box(hx, 3, hz + 1, hx + 1, yb + 6, hz + 2, c); m.box(hx - 2, 0, hz, hx + 3, 4, hz + 3, ck(0xd8b86a, 0.3)); }
    }
    return { m, extra };
  }

  function legModel(L, B, bent) {
    const lw = B.lw, ld = B.ld, lh = B.lh, bot = L.bottom;
    const pc = ck(bot.col, 0.14), sh = ck(L.shoes ?? 0x2a2320, 0.1), skin = ck(L.legSkin ?? L.skin), sock = ck(bot.sock ?? 0xf3f0e6, 0.05);
    const pantRows = bot.style === 'shorts' ? Math.min(lh, 4) : bot.style === 'skirt' ? 0 : lh;
    const colAt = (i) => { // i = 0 foot .. lh-1 hip
      if (i < 2) return sh;
      if (bot.style === 'skirt') return (bot.sock && i < 4) ? sock : skin;
      if (i >= lh - pantRows) return (bot.cuff && i === 2) ? ck(shade(bot.col, 0.8)) : pc;
      return (bot.sock && i < 4) ? sock : skin;
    };
    if (!bent) {
      const m = new AF.Model(lw, lh, ld + 1);
      for (let i = 0; i < lh; i++) m.box(0, i, 0, lw, i + 1, ld, colAt(i));
      m.box(0, 0, ld, lw, 1, ld + 1, sh);
      if (bot.cuff && pantRows === lh) m.box(0, 2, 0, lw, 3, ld, ck(shade(bot.col, 0.78)));
      return { m, anchor: [0.5, 1, ld / 2 / (ld + 1)] };
    }
    const hs = Math.min(lh, 8), thigh = Math.max(ld + 1, Math.round(lh * 0.55)), d = thigh + 2;
    const m = new AF.Model(lw, hs, d);
    const T = Math.min(ld, hs - 2);
    // thigh (horizontal) — colour by the upper leg rows
    for (let z = 0; z < thigh; z++) m.box(0, hs - T, z, lw, hs, z + 1, colAt(z < 2 ? lh - 1 : Math.max(lh - 1 - z, 2)));
    for (let y = 0; y < hs - T; y++) m.box(0, y, thigh - ld, lw, y + 1, thigh, colAt(Math.round(y * (lh - T) / (hs - T))));
    m.box(0, 0, thigh - ld, lw, 2, thigh + 1, sh);
    return { m, anchor: [0.5, 1, (ld / 2) / d] };
  }

  const geoCache = new Map();
  const geo = (key, fn, anchor) => { let g = geoCache.get(key); if (!g) { const m = fn(); g = AF.meshModel(m.m || m, { vs: VS, anchor: m.anchor || anchor }); geoCache.set(key, g); } return g; };
  const mesh = (g, cast = true) => { const me = new THREE.Mesh(g, AF.mat.voxel); me.castShadow = cast; me.receiveShadow = true; me.matrixAutoUpdate = true; return me; };

  // Build the part meshes for a look. Returns {root, body, hips, torso, head, armL, armR, legL, legR, legGeo, legBentGeo, B}
  function buildPerson(L) {
    const B = PLANS[L.plan];
    const lk = JSON.stringify(L);
    const tk = torsoModel(L, B);
    const torsoG = geo('t' + lk, () => tk, [0.5, tk.pivotY / (B.th + (L.skirt ? L.skirt.len : 0)), 0.5]);
    const headG = geo('h' + JSON.stringify([L.skin, L.hair, L.hairStyle, L.hat, L.hatCol, L.hatCol2, L.glasses, L.beard, L.moustache, L.beardCol, L.cheeks, L.freckles, L.lipstick, L.smile, L.female, L.kid, L.ribbon]), () => headModel(L), [0.5, 0, 0.5]);
    const armKey = (s) => JSON.stringify([L.plan, L.top.sleeve ?? L.top.col, L.top.short, L.top.cuffs, L.skin, s < 0 ? L.propR : L.propL, L.purseCol]);
    const armG = (s) => { const a = armModel(L, B, s); return geo('a' + armKey(s), () => a, [0.5, 1, 0.5]); };
    const legKey = JSON.stringify([L.plan, L.bottom, L.shoes, L.skin, L.legSkin]);
    const legG = geo('l' + legKey, () => legModel(L, B, false));
    const legBG = geo('lb' + legKey, () => legModel(L, B, true));
    const root = new THREE.Group(), body = new THREE.Group(), hips = new THREE.Group();
    root.add(body); body.add(hips);
    const hipY = B.lh * VS; hips.position.y = hipY;
    const torso = mesh(torsoG); hips.add(torso);
    const head = mesh(headG); head.position.y = B.th * VS; hips.add(head);
    const shX = (B.tw / 2 + B.aw / 2) * VS;
    const armL = mesh(armG(1), true), armR = mesh(armG(-1), true);
    armL.position.set(shX, B.th * VS, 0); armR.position.set(-shX, B.th * VS, 0);
    hips.add(armL); hips.add(armR);
    const lx = (B.lw / 2 + 0.5) * VS;
    const legL = mesh(legG), legR = mesh(legG);
    legL.position.set(lx, hipY, 0); legR.position.set(-lx, hipY, 0);
    body.add(legL); body.add(legR);
    root.traverse((o) => { o.matrixAutoUpdate = true; });
    return { root, body, hips, torso, head, armL, armR, legL, legR, legG, legBG, B, hipY };
  }
  K.buildPerson = buildPerson;
  K.makeLook = (...a) => makeLook(...a);

  // ------------------------------------------------------------ names, roles, lines
  const MALE = ['Walter', 'Harold', 'Frank', 'George', 'Arthur', 'Eddie', 'Ray', 'Lloyd', 'Herb', 'Clarence', 'Stanley', 'Norman', 'Earl', 'Vernon', 'Leonard', 'Floyd', 'Gus', 'Chester', 'Howard', 'Roy', 'Milton', 'Russell', 'Dale', 'Wendell', 'Irving', 'Carl', 'Bud', 'Jack', 'Hank', 'Lou'];
  const FEMALE = ['Dorothy', 'Betty', 'Margaret', 'Ruth', 'Helen', 'Evelyn', 'Mildred', 'Lois', 'Marjorie', 'Irene', 'Hazel', 'Edna', 'Peggy', 'June', 'Alice', 'Frances', 'Gladys', 'Lorraine', 'Vera', 'Ethel', 'Harriet', 'Rosemary', 'Nora', 'Pearl', 'Loretta', 'Bernice', 'Ida', 'Doris', 'Mabel', 'Joan'];
  const BOY = ['Tommy', 'Billy', 'Bobby', 'Jimmy', 'Danny', 'Richie', 'Joey', 'Skip', 'Wally', 'Timmy', 'Mikey', 'Stevie', 'Chuckie', 'Ronnie'];
  const GIRL = ['Susie', 'Patty', 'Janie', 'Nancy', 'Sally', 'Kathy', 'Linda', 'Judy', 'Carol', 'Sandy', 'Peggy Sue', 'Debbie', 'Annie', 'Mary Lou'];
  const SURN = ['Kowalski', 'Callahan', "O'Brien", 'Morelli', 'Sullivan', 'Delgado', 'Novak', 'Abernathy', 'Whitaker', 'Garland', 'Hollis', 'Bellamy', 'Hartley', 'Russo', 'Brennan', 'Lindqvist', 'Ashby', 'Crane', 'Beaumont', 'Mayhew', 'Pritchard', 'Vance', 'Kaplan', 'Fitzgerald', 'Marchetti', 'Dunmore', 'Pickford', 'Szabo', 'Quinlan', 'Esposito'];

  const LORE = [
    "They're showing 'Moonlight Over Solace' at the Paragon. Two bits for the matinee, and the organ plays before every show.",
    "The streetcar comes round every few minutes. Loop and Harbour, the blind says. Just listen for the bell.",
    "Did you see the blimp this morning? Gliding over Solace Tower like a big silver fish.",
    "Mayor Fenwick cut the ribbon on the new harbour lights himself. Nearly fell in the drink, too.",
    "The fish market opens at four in the morning. By six the gulls have already eaten better than I will all day.",
    "WSOL plays Cab Harlow and his Harbour Serenaders after ten. Turn the dial to 880 and you'll never sleep again.",
    "The Grand Solace ballroom has a sprung floor. You feel like you're dancing on a cloud.",
    "When the fog rolls in off the harbour, the fog horn on Solace Point goes all night. You stop hearing it after a year.",
    "The Harbour Trust has a vault door as big as a garage. They say there's real gold bars down there.",
    "Somebody saw the searchlights sweeping from the Paragon roof. Must be a premiere.",
    "The Blue Heron keeps its doors open till three. Best trumpet this side of Chicago.",
    "Union Terminal's departure board clacks like a room full of typewriters. I could listen to it all day.",
    "The pigeons in Civic Plaza have gotten mighty bold. One took a whole pretzel off my bench.",
    "Solace Tower is the tallest thing between here and New York. They moor the blimp to the top of it!",
    "The Starlite Diner does a blue-plate special for thirty-five cents. Meat loaf Tuesdays, clam chowder Fridays.",
    "Buy a nickel coffee at the Automat and you can sit there all afternoon. Nobody bothers you.",
    "The Harbour Trust says business is picking up. Two new freighters at Pier 9 this week.",
    "They put a whale skeleton up in the City Museum. Hanging right from the ceiling, big as a streetcar.",
    "Swan Lake in Central Park has rowboats for a dime an hour. The swans charge extra, in bread.",
    "The lighthouse keeper on Solace Point has been there thirty years. He knows every ship by its horn.",
    "The Meridian Store has radios in the window. Folks stand three deep on the sidewalk to hear the ballgame.",
    "Don't take a cab when the fleet's at the Paragon. You'll wait all night. Take the streetcar.",
    "Mayor Fenwick promised a new bandstand in Central Park. We'll believe it when we hear the band.",
    "The carousel on the boardwalk still costs a nickel. The brass ring gets you a free ride.",
    "They say the City Hall dome is covered in real copper. That's why it went green like that.",
    "Engine Co. 7 has the shiniest fire engine in the state. The boys polish it every morning.",
    "The ferry leaves Harbour Square on the hour. Fifteen cents and the best view of the skyline you'll ever get.",
    "At night the whole skyline lights up. Port Solace, where the lights never quite go out, like the song says.",
    "The Public Library has stone lions on the steps. Kids rub their noses for luck before exams.",
    "There's a band on the WSOL live broadcast every Saturday. You can sit in the studio audience if you get tickets.",
  ];
  const ROLE_LINES = {
    paperboy: ["EXTRA! EXTRA! Blimp moors atop Solace Tower! Read all about it!", "EXTRA! Harbour Trust reports record deposits! Two cents a paper!", "EXTRA! Mayor Fenwick promises lights on every pier! Getcher Solace Evening Star!", "EXTRA! Blue Heron trumpeter signs with WSOL! Paper, mister?"],
    police: ["Evening. Quiet beat tonight, just how I like it.", "Mind the streetcar tracks when you cross Park Row, friend. The motorman won't stop for daydreamers.", "Twenty years walking this beat. I know every stoop, every cat and every pickpocket by name."],
    cabbie: ["Where to, mac? Paragon, the Grand Solace, the Terminal? Meter starts at a dime.", "I drive a Beacon cab twelve hours a day. I know this town like the back of my glove.", "Tip for you: after the last show at the Paragon, every cab in the city's lined up on Grand Avenue."],
    doorman: ["Good evening, and welcome to the Grand Solace. Mind the revolving door, it has a mind of its own.", "Cab, sir? I can whistle one up from three blocks away.", "The ballroom opens at eight. The band tonight comes all the way from New Orleans."],
    bellhop: ["Welcome to the Grand Solace! May I take your bag?", "Fourth floor, sea view. You can see the lighthouse from the bathtub.", "The ballroom's being set up for the Harbour Ball. Two hundred chairs to polish."],
    shoeshine: ["Shine, mister? Nickel a shoe, dime a pair, and I'll make 'em look like mirrors.", "I shined Mayor Fenwick's shoes this morning. He tipped a whole quarter!", "Rainy days are good for business. Everybody's got mud on their wingtips."],
    fishmonger: ["Fresh cod, halibut, oysters from the Point! Caught this morning, sold by noon!", "Don't let the gulls fool you, they're the best customers I've got. They just never pay.", "Lobster's forty cents a pound today. Tomorrow, who knows? Depends on the fog."],
    stevedore: ["Two freighters in at Pier 9 today. My back will be telling me about it for a week.", "Bananas, coffee, crates of who-knows-what. If it floats in, we carry it off.", "The crane operators get all the glory. We get all the splinters."],
    sailor: ["Shore leave, two whole days! First stop, the Blue Heron. Second stop, also the Blue Heron.", "I've seen Rio and Marseilles, but there's no skyline like Port Solace at night.", "Our ship's the grey one at Pier 9. She rolls like a barrel, but she's home."],
    usher: ["The feature starts at seven. Popcorn's fresh and buttered.", "Please, no whistling during the love scenes. The manager insists.", "Balcony seats are a dime more, but you can see the whole auditorium ceiling. It's painted like the night sky."],
    sodajerk: ["One chocolate malt coming right up! Extra whipped cream if you smile.", "A cherry phosphate is a nickel and worth twice that.", "The theatre crowd comes in right after the late show. I can set my watch by it."],
    waitress: ["Sit anywhere you like, hon. Coffee's fresh.", "The blue-plate special is meat loaf and mashed potatoes. Same as every Tuesday since the Starlite opened.", "Pie? We've got apple, cherry and a lemon meringue tall as your hat."],
    cook: ["Two eggs over easy and a short stack, that's what keeps this town running.", "I've flipped a million flapjacks on this grill. The million-and-first is yours."],
    announcer: ["Good evening, Port Solace! This is WSOL, eight-eighty on your dial!", "We're live from the studio tonight with the Harbour Lights Orchestra. Don't touch that dial.", "Sponsored by Meridian Department Store, where style meets the sea!"],
    banker: ["The Harbour Trust has kept this city's savings safe since 1889.", "A Christmas Club account, perhaps? Fifty cents a week and you'll have a fine holiday.", "Have you seen the vault? Eighteen inches of steel. Mr. Whitaker opens it himself every morning."],
    librarian: ["Shh, the reading room is just through there. Mind the creaky board by the globe.", "We have a whole shelf on the history of the harbour. The whaling logs are my favourite.", "Late fees are a penny a day. The lions on the steps keep count."],
    guard: ["No touching the dinosaur, please. He's older than both of us put together.", "The whale hanging in the great hall is a real blue whale. Took forty men to lift it.", "Museum closes at five. Planetarium show's at three, and it's worth every penny."],
    conductor: ["Fares, please! Nickel a ride, transfers free.", "Loop and Harbour, all the way round. Next stop's coming up, hold the strap.", "Twenty-two years on the streetcars. I've seen this city grow up around the tracks."],
    ticket: ["Round trip to the capital is two dollars. The Coastline Limited leaves at 6:10.", "The departure board's right behind you. Watch it flip — people come just to see it."],
    milkman: ["Fresh milk, cream and butter. Bottles back on the stoop, if you please.", "I start my route at four. Only me, the fishmongers and the cats are up."],
    lamplighter: ["Most of the lamps are electric now, but the ones on Harbour Boulevard are still gas. I light every one.", "Two hundred and twelve lamps. I know every one of 'em by the sound it makes when it catches."],
    florist: ["Carnations for your lapel? A penny apiece, and the ladies will notice.", "Chrysanthemums are the flower of the season. Bronze, gold and burgundy.", "I sell roses outside the Paragon on opening nights. Every sweetheart needs one."],
    jazz: ["Catch us at the Blue Heron tonight. Nine sharp, and we play till the sun comes up.", "That trumpet solo on WSOL last night? That was me, pal.", "Jazz is just the city talking. You gotta listen for the horns and the streetcar bells."],
    fireman: ["Engine Co. 7 is polished and ready. So is Sparky, our dalmatian.", "We had a chimney fire on Wren Street last week. Out in four minutes flat.", "If you hear the siren, get to the kerb. We don't stop for anybody."],
    doctor: ["Plenty of sea air and an apple a day.", "Fog season's coming, so button up your coat when the sun goes down."],
    nurse: ["Doctor's office opens at nine. Lollipops for brave children.", "Don't you go skipping lunch now. You look like you could use a good bowl of chowder."],
    grandpa: ["Back in my day, Solace Tower was a vacant lot and the harbour was all sailing ships.", "I remember when the streetcars were pulled by horses. The horses were faster.", "Pull up a bench, young fella. The pigeons and I were just discussing politics."],
    grandma: ["I've been knitting for the church bazaar. Twelve scarves and counting.", "You look thin, dear. Go get yourself a slice of pie at the Starlite."],
    mayor: ["Welcome to Port Solace, friend! Finest harbour city on the whole coast.", "I'm Mayor Fenwick. Vote early, and — well, just vote early.", "Lights on every pier by Christmas. You have my word, and my word is good as gold. Harbour Trust gold."],
    teacher: ["The school pageant is about the founding of the harbour. Half the children are dressed as fish.", "Spelling bee next Wednesday. Can you spell 'lighthouse'?"],
    clerk: ["Anything I can help you find? We just got a new shipment in off the boat.", "We close at six, but I'll always open the door for somebody in a pinch.", "Hats are on the ground floor, gloves on the second. The elevator man will take you up."],
    baker: ["Bread's out of the oven at six every morning. The whole street smells like it.", "Try a cruller, they're still warm. On the house for a new face."],
    barber: ["Haircut's a quarter, shave's fifteen cents, and the gossip is free.", "I've trimmed every head in Old Town, and a few of their fathers' too."],
    kid: ["Wanna race to the fountain? Last one there is a rotten egg!", "I waved at the blimp and I swear the man in the gondola waved back!", "Mom gave me a nickel for the carousel. I'm going for the brass ring!", "Did you see the streetcar sparks? They go FZZT like fireworks!"],
    teen: ["Everybody's going to the Harbour Ball. I just need somebody to ask me first.", "Saturday matinee at the Paragon, then a malt at the Starlite. That's the plan.", "The Blue Heron won't let us in till we're twenty-one. We listen from the alley."],
    shopper: ["I only came in for thread, and look at all these parcels.", "Such a lovely afternoon. The light on the harbour is pure gold.", "I'm off to Meridian's before the hat sale's picked over."],
    worker: ["Just on my lunch hour. Nothing better than a sandwich on a bench in the plaza.", "Another week, another pay packet. Saturday I'm taking the family on the ferry."],
    fisherman: ["Mackerel are running off the Fish Pier. Bring a bucket.", "The one that got away this morning was THIS big. Honest."],
    traveler: ["Waiting on the Coastline Limited. My sister in the capital makes a pot roast you wouldn't believe.", "First time in Port Solace? Union Terminal's the prettiest station on the whole line."],
    tailor: ["A good suit lasts twenty years if you brush it every night.", "Wide lapels are all the rage this season. Very Hollywood."],
    photographer: ["Say 'cheese!' Or 'Solace,' works just as well.", "I'm taking pictures of the skyline from the ferry at dusk. Nothing like it."],
    repair: ["Radio's on the fritz? Probably a tube. Leave it with me, back by Friday.", "Every radio in this city is tuned to WSOL. I've checked."],
    newsman: ["Morning edition, evening edition, and I read every word of both.", "Comics are on page twelve. The kids fold 'em straight to it."],
    boatman: ["Rowboats are a dime an hour. Life jackets free, and not optional.", "Lake's calm as glass today. The swans are in a good mood, for once."],
    icecream: ["Vanilla, chocolate, strawberry. What'll it be?", "Double scoop's a dime. Sprinkles are free for good manners."],
    painter: ["Hold still, I'm catching the light on the City Hall dome.", "Every evening I paint the skyline from the quay. Never the same twice."],
  };
  K.LORE = LORE; K.ROLE_LINES = ROLE_LINES;
  const ROLE_TITLE = {
    paperboy: 'Newsboy', police: 'Beat Cop', cabbie: 'Cab Driver', doorman: 'Doorman', bellhop: 'Bellhop', shoeshine: 'Shoeshine Boy', fishmonger: 'Fishmonger', stevedore: 'Stevedore',
    sailor: 'Sailor', usher: 'Usher', sodajerk: 'Soda Jerk', waitress: 'Waitress', cook: 'Short-Order Cook', announcer: 'Radio Announcer', banker: 'Bank Teller', librarian: 'Librarian',
    guard: 'Museum Guard', conductor: 'Streetcar Conductor', ticket: 'Ticket Agent', milkman: 'Milkman', lamplighter: 'Lamplighter', florist: 'Flower Seller', jazz: 'Jazz Musician',
    fireman: 'Firefighter', doctor: 'Doctor', nurse: 'Nurse', grandpa: 'Retired', grandma: 'Retired', mayor: 'Mayor', teacher: 'Schoolteacher', clerk: 'Shopkeeper', baker: 'Baker',
    barber: 'Barber', kid: 'Schoolkid', teen: 'Teenager', shopper: 'Resident', worker: 'Office Clerk', fisherman: 'Angler', traveler: 'Traveler', tailor: 'Tailor',
    photographer: 'Photographer', repair: 'Radio Repairman', newsman: 'News Vendor', boatman: 'Boat Keeper', icecream: 'Ice Cream Server', painter: 'Painter',
  };
  // look aliases for the new jobs (the look builder knows the originals)
  const LOOKAS = { cabbie: 'worker', doorman: 'bellhop', shoeshine: 'paperboy', fishmonger: 'cook', stevedore: 'boatman', sailor: 'cook', announcer: 'banker', guard: 'police', lamplighter: 'repair', jazz: 'banker' };

  // ------------------------------------------------------------ looks
  function makeLook(role, gender, age, r) {
    const female = gender === 'f';
    const plan = age === 'kid' ? 'kid' : age === 'teen' ? 'teen' : age === 'elder' ? 'elder' : female ? 'woman' : 'man';
    const skin = pick(r, SKIN);
    const hairC = age === 'elder' ? pick(r, [HAIR.grey, HAIR.white, HAIR.grey]) : pick(r, [HAIR.black, HAIR.dbrown, HAIR.brown, HAIR.brown, HAIR.auburn, HAIR.blonde, HAIR.sandy, HAIR.ginger, HAIR.dbrown]);
    const L = { plan, skin, hair: skinDarkHair(skin, hairC, r), female, kid: age === 'kid', smile: r() < 0.6, cheeks: female || age === 'kid' ? r() < 0.8 : r() < 0.2, freckles: age === 'kid' && r() < 0.3 };
    L.hairStyle = female ? (age === 'kid' ? pick(r, ['pigtails', 'bob', 'ponytail']) : age === 'elder' ? pick(r, ['bun', 'curly', 'updo']) : age === 'teen' ? pick(r, ['ponytail', 'ponytail', 'bob', 'wavy']) : pick(r, ['bob', 'wavy', 'curly', 'updo', 'bun', 'long']))
      : (age === 'elder' ? pick(r, ['bald', 'bald', 'short', 'part']) : age === 'kid' ? pick(r, ['crew', 'short', 'part', 'curly']) : pick(r, ['short', 'part', 'slick', 'crew', 'part', 'curly']));
    if (female && age !== 'kid') L.lipstick = r() < 0.55;
    if (L.hairStyle === 'pigtails') L.ribbon = pick(r, [0xd0404a, 0x4a7ac0, 0xe8c23a, 0xe79aa8]);
    if (age === 'elder' || r() < 0.12) L.glasses = r() < 0.3 ? 'gold' : 'dark';
    if (!female && age !== 'kid' && age !== 'teen') { const q = r(); if (q < 0.18) L.moustache = true; else if (q < 0.24) L.beard = true; }
    const shoesM = pick(r, [0x2a2320, 0x5a3a22, 0x3a2a20]), shoesF = pick(r, [0x2a2320, 0x7a2630, 0xe8e0d0, 0x5a3a22, 0x2c3a5a]);
    L.shoes = female ? shoesF : shoesM;
    const pants = (col, o = {}) => ({ style: 'pants', col, ...o });
    const skirt = (col, len, o = {}) => { L.skirt = { col, len, flare: o.flare ?? 1, hem: o.hem, dots: o.dots, pleats: o.pleats, poodle: o.poodle }; L.bottom = { style: 'skirt', col, sock: o.sock }; L.legSkin = mix(skin, 0xd8c0a8, 0.25); };
    const B = PLANS[plan], sLen = Math.round(B.lh * (age === 'kid' ? 0.45 : 0.62));
    const casualM = () => {
      const q = r();
      if (q < 0.3) { L.top = { style: 'suit', col: pick(r, [CLOTH.navy, CLOTH.charcoal, CLOTH.brown, CLOTH.grey, CLOTH.tan]), tie: pick(r, [0x9a2f2f, 0x2f5a9a, 0x3d6446, 0xd1a23a, 0x7a2630]), cuffs: true }; L.bottom = pants(L.top.col); if (r() < 0.6) { L.hat = 'fedora'; L.hatCol = pick(r, [0x5a4a3a, 0x45464b, 0x6a5a45, 0x3a3a40]); L.hatCol2 = 0x2a2522; } if (r() < 0.3) L.propR = 'briefcase'; else if (r() < 0.2) L.propR = 'paper'; }
      else if (q < 0.5) { L.top = { style: 'sweater', col: pick(r, [CLOTH.maroon, CLOTH.forest, CLOTH.mustard, CLOTH.navy, CLOTH.rust, CLOTH.olive]), col2: pick(r, [CLOTH.cream, CLOTH.tan, CLOTH.charcoal]), argyle: r() < 0.35, stripe: r() < 0.3 }; L.bottom = pants(pick(r, [CLOTH.khaki, CLOTH.charcoal, CLOTH.brown, CLOTH.grey]), { cuff: true }); if (r() < 0.35) { L.hat = 'flatcap'; L.hatCol = pick(r, [0x6a5a45, 0x5a5a55, 0x7a6a50]); } }
      else if (q < 0.68) { L.top = { style: 'vest', col: pick(r, [CLOTH.brown, CLOTH.charcoal, CLOTH.olive]), sleeve: CLOTH.white, tie: pick(r, [0x9a2f2f, 0x2f5a9a, 0x6a3b5c]), chain: r() < 0.5 }; L.bottom = pants(L.top.col); if (r() < 0.4) { L.hat = 'fedora'; L.hatCol = 0x6a5a45; } }
      else if (q < 0.85) { L.top = { style: 'plaid', col: pick(r, [CLOTH.red, CLOTH.forest, CLOTH.navy, CLOTH.rust]), col2: pick(r, [0x2a2a2a, CLOTH.cream, CLOTH.mustard]) }; L.bottom = pants(pick(r, [CLOTH.denim, CLOTH.khaki, CLOTH.brown]), { cuff: true }); if (r() < 0.3) { L.hat = 'flatcap'; L.hatCol = 0x5a5a55; } }
      else { L.top = { style: 'shirt', col: pick(r, [CLOTH.white, CLOTH.powder, CLOTH.cream, CLOTH.sky]), short: r() < 0.4 }; L.bottom = pants(pick(r, [CLOTH.charcoal, CLOTH.khaki, CLOTH.navy]), { cuff: true }); }
    };
    const casualF = () => {
      const q = r();
      if (q < 0.4) { const col = pick(r, [CLOTH.powder, CLOTH.pink, CLOTH.mint, CLOTH.lemon, CLOTH.coral, CLOTH.lilac, CLOTH.sky, CLOTH.rose, CLOTH.sage]); L.top = { style: 'dress', col, col2: shade(col, 0.72), col3: CLOTH.white, dots: r() < 0.5, short: r() < 0.5 }; skirt(col, sLen, { flare: 2, dots: r() < 0.3, hem: true }); }
      else if (q < 0.65) { L.top = { style: 'blouse', col: pick(r, [CLOTH.white, CLOTH.cream, CLOTH.powder, CLOTH.pink]), brooch: r() < 0.5, short: r() < 0.3 }; skirt(pick(r, [CLOTH.navy, CLOTH.plum, CLOTH.forest, CLOTH.maroon, CLOTH.camel, CLOTH.grey]), sLen, { flare: 1, pleats: r() < 0.5 }); }
      else if (q < 0.9) { const col = pick(r, [CLOTH.mustard, CLOTH.rose, CLOTH.teal, CLOTH.cream, CLOTH.sage, CLOTH.rust]); L.top = { style: 'cardigan', col, col2: shade(col, 0.7), col3: pick(r, [CLOTH.white, CLOTH.cream]) }; skirt(pick(r, [CLOTH.grey, CLOTH.navy, CLOTH.brown, CLOTH.plum]), sLen, { flare: 1 }); }
      else { const col = pick(r, [CLOTH.red, CLOTH.navy, CLOTH.forest]); L.top = { style: 'dress', col, col2: shade(col, 0.7) }; skirt(col, sLen, { flare: 2, hem: true }); L.apron = CLOTH.white; }
      if (r() < 0.25) { L.hat = pick(r, ['pillbox', 'cloche', 'pillbox']); L.hatCol = pick(r, [0x7a2630, 0x2c3a5a, 0x3d6446, 0xd1a23a, 0xe79aa8]); }
      if (r() < 0.35) { L.propR = 'purse'; L.purseCol = pick(r, [0x7a2630, 0x2a2320, 0xe8e0d0, 0x6a4424]); }
    };
    const role0 = role; role = LOOKAS[role] || role;
    switch (role) {
      case 'baker': L.top = { style: 'bowtie', col: CLOTH.white, tie: 0xe8e0d0, short: true }; L.bottom = pants(0xe8e4d8); L.hat = 'toque'; L.hatCol = 0xf6f4ee; L.apron = 0xf6f4ee; L.apronBib = true; if (female) { L.bottom = pants(0xe8e4d8); } break;
      case 'barber': L.top = { style: 'tunic', col: 0xf3f0e6, col2: 0xb8b8b8, cuffs: false }; L.bottom = pants(CLOTH.charcoal); L.moustache = !female; L.hairStyle = female ? 'bun' : 'slick'; break;
      case 'clerk': if (female) casualF(); else casualM(); L.hat = null; L.propR = null; L.apron = pick(r, [0xf3f0e6, 0x3d6446, 0x6a4a32, 0x2c3a5a]); L.apronBib = true; break;
      case 'florist': casualF(); L.hat = null; L.propR = null; L.apron = 0x5f8a4a; L.apronBib = true; break;
      case 'sodajerk': case 'icecream': L.top = { style: 'bowtie', col: CLOTH.white, tie: 0xb3342c, short: true }; L.bottom = pants(female ? CLOTH.white : CLOTH.charcoal); if (female) skirt(role === 'icecream' ? CLOTH.pink : CLOTH.white, sLen, { flare: 1 }); L.hat = 'paper'; L.hatCol = 0xf6f4ee; L.hatCol2 = 0xb3342c; break;
      case 'waitress': { const col = pick(r, [CLOTH.pink, CLOTH.mint, CLOTH.sky]); L.top = { style: 'dress', col, col2: shade(col, 0.7), short: true }; skirt(col, sLen, { flare: 2, hem: true }); L.apron = 0xf6f4ee; L.hairStyle = 'updo'; L.hat = 'nurse'; L.hatCol = 0xf6f4ee; L.lipstick = true; break; }
      case 'cook': L.top = { style: 'shirt', col: CLOTH.white, short: true }; L.bottom = pants(0x9a9a96); L.apron = 0xf6f4ee; L.hat = 'paper'; L.hatCol = 0xf6f4ee; break;
      case 'police': L.top = { style: 'police', col: 0x26324e, col2: 0x1c2438, cuffs: false }; L.bottom = pants(0x26324e); L.hat = 'police'; L.hatCol = 0x26324e; L.shoes = 0x151515; break;
      case 'mail': L.top = { style: 'mail', col: 0x7d93ab, col2: 0x5a6e86, short: true }; L.bottom = pants(0x3a4a60); L.hat = 'mailcap'; L.hatCol = 0x7d93ab; L.hatCol2 = 0x3a4a60; break;
      case 'milkman': L.top = { style: 'bowtie', col: CLOTH.white, tie: 0x1f1d1c }; L.bottom = pants(CLOTH.white); L.hat = 'milkcap'; L.hatCol = 0xf6f4ee; L.hatCol2 = 0x2c3a5a; L.propR = 'crate'; break;
      case 'fireman': if (r() < 0.5) { L.top = { style: 'fire', col: 0x2a2a2e, col2: 0x1a1a1e }; L.hat = 'firehelmet'; L.hatCol = 0xb3242a; L.hatCol2 = 0x7a1a1a; L.shoes = 0x151515; } else { L.top = { style: 'suspenders', col: 0x2c3a5a, col2: 0xb3342c }; } L.bottom = pants(0x2a2a30); break;
      case 'doctor': L.top = { style: 'labcoat', col: 0xf6f4ee, shirt: CLOTH.powder, tie: CLOTH.navy }; L.skirt = { col: 0xf6f4ee, len: 5, flare: 0, open: true }; L.bottom = pants(CLOTH.charcoal); L.glasses = 'gold'; L.propR = 'bag'; L.hairStyle = 'part'; break;
      case 'nurse': L.top = { style: 'nurse', col: 0xf6f4ee, short: true }; skirt(0xf6f4ee, sLen, { flare: 1, sock: 0xf6f4ee }); L.legSkin = 0xf0ece4; L.shoes = 0xf6f4ee; L.hat = 'nurse'; L.hatCol = 0xf6f4ee; L.hairStyle = 'updo'; break;
      case 'conductor': case 'ticket': L.top = { style: 'conductor', col: 0x232c46, col2: 0x1a2036 }; L.bottom = pants(0x232c46); L.hat = 'conductor'; L.hatCol = 0x232c46; if (role === 'conductor') { L.moustache = true; L.hair = HAIR.grey; } break;
      case 'farmer': L.top = { style: 'plaid', col: pick(r, [CLOTH.red, CLOTH.navy, CLOTH.forest]), col2: 0x2a2a2a, short: false }; L.overalls = CLOTH.denim; L.bottom = pants(CLOTH.denim); L.hat = 'straw'; L.hatCol = 0xd8b86a; L.hatCol2 = 0xb3342c; L.shoes = 0x5a3a22; if (r() < 0.5) L.propR = 'pitchfork'; break;
      case 'farmwife': { const col = pick(r, [CLOTH.sky, CLOTH.lemon, CLOTH.mint]); L.top = { style: 'dress', col, col2: shade(col, 0.7), col3: CLOTH.white, dots: true }; skirt(col, sLen + 1, { flare: 2, pleats: true }); L.apron = CLOTH.white; L.apronBib = true; L.hat = r() < 0.5 ? 'bonnet' : 'scarf'; L.hatCol = pick(r, [0xe8d8b0, 0xd06a7c, 0x6a8ac0]); L.hatCol2 = 0xb3342c; break; }
      case 'paperboy': L.top = { style: 'striped', col: CLOTH.cream, col2: pick(r, [CLOTH.red, CLOTH.navy]) }; L.bottom = { style: 'shorts', col: CLOTH.khaki, sock: 0xf3f0e6 }; L.newsbag = true; L.hat = 'newsboy'; L.hatCol = 0x7a6a50; L.hatCol2 = 0x5a4a3a; L.propR = 'paper'; break;
      case 'painter': L.top = { style: 'smock', col: 0xf1ece0 }; L.overalls = 0xe8e2d4; L.bottom = pants(0xe8e2d4); L.hat = 'beret'; L.hatCol = 0x2a2522; L.propR = 'brush'; break;
      case 'grandpa': L.top = { style: 'cardigan', col: pick(r, [CLOTH.olive, CLOTH.brown, CLOTH.camel, CLOTH.maroon]), col2: 0x3a2a20, col3: CLOTH.white }; L.bottom = pants(pick(r, [CLOTH.grey, CLOTH.brown, CLOTH.charcoal]), { cuff: true }); L.hat = 'flatcap'; L.hatCol = 0x6a6258; L.propR = 'cane'; L.glasses = 'dark'; if (r() < 0.6) L.moustache = true; L.beardCol = HAIR.white; break;
      case 'grandma': L.top = { style: 'cardigan', col: pick(r, [CLOTH.lilac, CLOTH.rose, CLOTH.powder, CLOTH.sage]), col2: 0xf3f0e6, col3: CLOTH.white }; skirt(pick(r, [CLOTH.grey, CLOTH.plum, CLOTH.navy]), sLen + 1, { flare: 1, pleats: true }); L.hairStyle = 'bun'; L.glasses = 'gold'; L.propR = r() < 0.5 ? 'purse' : 'cane'; L.purseCol = 0x2a2320; break;
      case 'mayor': L.top = { style: 'suit', col: 0x3a3a44, tie: 0xb3342c, cuffs: true }; L.bottom = pants(0x3a3a44); L.sash = 0xb3342c; L.hairStyle = 'bald'; L.moustache = true; L.hair = HAIR.grey; L.beardCol = HAIR.grey; L.glasses = null; break;
      case 'pastor': L.top = { style: 'clergy', col: 0x1f1f24 }; L.bottom = pants(0x1f1f24); L.propR = 'book'; L.glasses = 'gold'; break;
      case 'teacher': case 'librarian': if (female) { L.top = { style: 'cardigan', col: pick(r, [CLOTH.sage, CLOTH.mustard, CLOTH.powder]), col2: 0xf3f0e6, col3: CLOTH.white }; skirt(pick(r, [CLOTH.navy, CLOTH.plum, CLOTH.grey]), sLen, { flare: 1, pleats: true }); L.hairStyle = 'bun'; } else { L.top = { style: 'vest', col: CLOTH.brown, sleeve: CLOTH.white, tie: 0x6a3b5c }; L.bottom = pants(CLOTH.brown); } L.glasses = 'dark'; L.propR = 'book'; break;
      case 'banker': case 'tailor': L.top = { style: 'vest', col: pick(r, [CLOTH.charcoal, CLOTH.navy]), sleeve: CLOTH.white, tie: pick(r, [0x9a2f2f, 0x2f5a9a]), chain: true }; L.bottom = pants(L.top.col); L.glasses = r() < 0.6 ? 'gold' : null; if (role === 'tailor') L.tape = true; break;
      case 'bellhop': case 'usher': L.top = { style: 'bellhop', col: 0xa82a2e, col2: 0x7a1a1e }; if (female && role === 'usher') skirt(0xa82a2e, sLen, { flare: 1 }); else L.bottom = pants(0x1f1f24); L.hat = 'bellhop'; L.hatCol = 0xa82a2e; break;
      case 'mechanic': case 'repair': L.top = { style: 'coverall', col: 0x6a86a0, col2: 0x4a6278 }; L.bottom = pants(0x6a86a0); L.hat = role === 'mechanic' ? 'baseball' : null; L.hatCol = 0xb3342c; L.hatCol2 = 0x7a1a1a; break;
      case 'photographer': L.top = { style: 'vest', col: CLOTH.olive, sleeve: CLOTH.cream, tie: 0xb3342c }; L.bottom = pants(CLOTH.khaki); L.hat = 'beret'; L.hatCol = 0x7a2630; L.moustache = true; break;
      case 'newsman': L.top = { style: 'sweater', col: CLOTH.forest, col2: CLOTH.cream }; L.bottom = pants(CLOTH.brown); L.hat = 'newsboy'; L.hatCol = 0x5a5a55; break;
      case 'boatman': case 'fisherman': L.top = { style: 'plaid', col: CLOTH.forest, col2: CLOTH.mustard }; L.overalls = role === 'boatman' ? 0xd1a23a : null; L.bottom = pants(CLOTH.khaki, { cuff: true }); L.hat = 'bucket'; L.hatCol = 0xb8a878; L.hatCol2 = 0x7a6a50; if (role === 'fisherman') L.propR = r() < 0.5 ? 'bucket' : null; break;
      case 'miller': L.top = { style: 'shirt', col: 0xe8e0c8 }; L.overalls = 0x8a7a5a; L.bottom = pants(0x8a7a5a); L.hat = 'flatcap'; L.hatCol = 0xd8d0b8; break;
      case 'kid': if (female) { const col = pick(r, [CLOTH.pink, CLOTH.lemon, CLOTH.sky, CLOTH.mint, CLOTH.red, CLOTH.lilac]); L.top = { style: 'dress', col, col2: shade(col, 0.72), col3: CLOTH.white, dots: r() < 0.5, short: true }; skirt(col, sLen, { flare: 1, sock: 0xf6f2ea }); L.shoes = pick(r, [0x2a2320, 0x7a2630]); if (L.hairStyle !== 'pigtails' && r() < 0.6) { L.hat = 'bow'; L.hatCol = pick(r, [0xd0404a, 0x4a7ac0, 0xf6f2ea]); } }
        else { const q = r(); if (q < 0.5) L.top = { style: 'striped', col: pick(r, [CLOTH.white, CLOTH.cream, CLOTH.lemon]), col2: pick(r, [CLOTH.red, CLOTH.navy, CLOTH.forest, CLOTH.sky]), short: r() < 0.5 }; else if (q < 0.8) L.top = { style: 'plaid', col: pick(r, [CLOTH.red, CLOTH.sky, CLOTH.forest]), col2: CLOTH.cream }; else L.top = { style: 'sweater', col: pick(r, [CLOTH.maroon, CLOTH.navy]), col2: CLOTH.cream, stripe: true }; L.bottom = r() < 0.5 ? { style: 'shorts', col: pick(r, [CLOTH.khaki, CLOTH.navy, CLOTH.brown]), sock: 0xf3f0e6 } : pants(CLOTH.denim, { cuff: true }); if (r() < 0.5) { L.hat = 'baseball'; L.hatCol = pick(r, [0xb3342c, 0x2c3a5a, 0x3d6446]); L.hatCol2 = 0x1f1d1c; } L.shoes = pick(r, [0xe8e0d0, 0x2a2320, 0x5a3a22]); }
        if (r() < 0.2) L.propL = 'cone'; break;
      case 'teen': if (female) { const col = pick(r, [CLOTH.pink, CLOTH.sky, CLOTH.mint]); L.top = { style: 'cardigan', col: pick(r, [CLOTH.white, CLOTH.pink, CLOTH.lemon]), col2: 0xf3f0e6, col3: CLOTH.white }; skirt(col, sLen, { flare: 3, poodle: r() < 0.6, sock: 0xf6f2ea }); L.shoes = 0x2a2320; }
        else { L.top = r() < 0.6 ? { style: 'letterman', col: pick(r, [CLOTH.maroon, CLOTH.forest, CLOTH.navy]), col2: 0xf3e7c8, col3: 0xf3e7c8, sleeve: 0xf3e7c8 } : { style: 'shirt', col: CLOTH.white, short: true }; L.bottom = pants(CLOTH.denim, { cuff: true }); L.hairStyle = 'slick'; L.shoes = 0xe8e0d0; } break;
      default: if (female) casualF(); else casualM();
    }
    if (!L.top) { if (female) casualF(); else casualM(); }
    if (role0 === 'sailor') { L.top = { style: 'shirt', col: 0xf3f0e6 }; L.bottom = { style: 'pants', col: 0x1f2a44 }; L.hat = 'paper'; L.hatCol = 0xf6f4ee; L.hatCol2 = 0x1f2a44; L.apron = null; L.propR = null; }
    if (role0 === 'fishmonger') { L.hat = 'flatcap'; L.hatCol = 0x5a5a55; L.apron = 0xd8d4c8; L.apronBib = true; }
    if (role0 === 'cabbie') { L.hat = 'flatcap'; L.hatCol = 0x3a3a40; }
    if (role0 === 'jazz') { L.top = { style: 'bowtie', col: 0x1f1f24, tie: 0xf3f0e6 }; L.bottom = { style: 'pants', col: 0x1f1f24 }; L.hat = 'fedora'; L.hatCol = 0x2a2a2e; L.hatCol2 = 0xb3342c; }
    if (role0 === 'announcer') { L.propR = 'paper'; L.hat = null; }
    if (role0 === 'lamplighter') { L.hat = 'flatcap'; L.hatCol = 0x45464b; L.propR = 'cane'; }
    if (!L.bottom) L.bottom = pants(CLOTH.charcoal);
    if (L.hat === 'toque' || L.hat === 'firehelmet' || L.hat === 'police') { if (L.hairStyle === 'bun' || L.hairStyle === 'updo') L.hairStyle = 'bob'; }
    return L;
  }
  function skinDarkHair(skin, h, r) { return (skin === 0x7a4a2e || skin === 0xa46a45) && h !== HAIR.grey && h !== HAIR.white ? pick(r, [HAIR.black, HAIR.dbrown]) : h; }
  K.makeLook = makeLook;

  // ------------------------------------------------------------ sidewalk graph
  const G = { nodes: [], edges: [] };
  AF.peopleGraph = G;
  function buildGraph() {
    const nodes = G.nodes, keyM = new Map();
    const node = (x, z) => { const k = Math.round(x * 2) + ',' + Math.round(z * 2); let n = keyM.get(k); if (n) return n; n = { i: nodes.length, x, z, adj: [] }; nodes.push(n); keyM.set(k, n); return n; };
    const find = (x, z) => keyM.get(Math.round(x * 2) + ',' + Math.round(z * 2));
    const link = (a, b) => { if (!a || !b || a === b || a.adj.some((e) => e.n === b)) return; const d = Math.hypot(a.x - b.x, a.z - b.z); a.adj.push({ n: b, d }); b.adj.push({ n: a, d }); G.edges.push([a, b]); };
    const OFF = 6.5, BOX = [-252, -252, 252, 176];
    const offOf = (w) => (w || 10) / 2 + 1.5;
    const inBox = (x, z) => x >= BOX[0] - 0.01 && x <= BOX[2] + 0.01 && z >= BOX[1] - 0.01 && z <= BOX[3] + 0.01;
    const roads = PL.roads.slice();
    // intersections: every road endpoint + where it lies on another road
    const inter = new Map(); // key -> {x,z, dirs:[[dx,dz]]}
    const addDir = (x, z, dx, dz, w) => { const k = x + ',' + z; let I = inter.get(k); if (!I) inter.set(k, I = { x, z, dirs: [] }); if (!I.dirs.some((d) => Math.abs(d[0] - dx) < 0.01 && Math.abs(d[1] - dz) < 0.01)) I.dirs.push([dx, dz, w || 10]); };
    const crossOff = (I, dx, dz) => { let w = 0; for (const d of I.dirs) if (Math.abs(d[0] * dx + d[1] * dz) < 0.5) w = Math.max(w, d[2]); return offOf(w || 10); };
    for (const r of roads) {
      const L = Math.hypot(r.b[0] - r.a[0], r.b[1] - r.a[1]), dx = (r.b[0] - r.a[0]) / L, dz = (r.b[1] - r.a[1]) / L;
      addDir(r.a[0], r.a[1], dx, dz, r.w); addDir(r.b[0], r.b[1], -dx, -dz, r.w);
    }
    for (const I of inter.values()) for (const r of roads) {
      const L = Math.hypot(r.b[0] - r.a[0], r.b[1] - r.a[1]), dx = (r.b[0] - r.a[0]) / L, dz = (r.b[1] - r.a[1]) / L;
      const t = (I.x - r.a[0]) * dx + (I.z - r.a[1]) * dz; if (t < 1 || t > L - 1) continue;
      const px = r.a[0] + dx * t, pz = r.a[1] + dz * t; if (Math.hypot(px - I.x, pz - I.z) > 0.5) continue;
      addDir(I.x, I.z, dx, dz, r.w); addDir(I.x, I.z, -dx, -dz, r.w);
    }
    for (const r of roads) {
      const L = Math.hypot(r.b[0] - r.a[0], r.b[1] - r.a[1]), dx = (r.b[0] - r.a[0]) / L, dz = (r.b[1] - r.a[1]) / L, px = -dz, pz = dx;
      for (const s of [1, -1]) {
        // cuts along t
        const cuts = [];
        let t0 = 0, t1 = L;
        for (const I of inter.values()) {
          const t = (I.x - r.a[0]) * dx + (I.z - r.a[1]) * dz; if (t < -0.5 || t > L + 0.5) continue;
          if (Math.hypot(r.a[0] + dx * t - I.x, r.a[1] + dz * t - I.z) > 0.5) continue;
          const side = I.dirs.some((d) => d[0] * px * s + d[1] * pz * s > 0.5);
          const other = I.dirs.some((d) => d[0] * px * s + d[1] * pz * s < -0.5);
          const CO = crossOff(I, dx, dz);
          if (t < 0.5) { // start
            const straight = I.dirs.some((d) => d[0] * -dx + d[1] * -dz > 0.5);
            if (side) t0 = CO; else if (other && !straight) t0 = -CO;
          } else if (t > L - 0.5) {
            const straight = I.dirs.some((d) => d[0] * dx + d[1] * dz > 0.5);
            if (side) t1 = L - CO; else if (other && !straight) t1 = L + CO;
          } else if (side) cuts.push([t - CO, t + CO]);
        }
        cuts.sort((a, b) => a[0] - b[0]);
        const ivs = []; let cur = t0;
        for (const c of cuts) { if (c[0] > cur) ivs.push([cur, c[0]]); cur = Math.max(cur, c[1]); }
        if (t1 > cur) ivs.push([cur, t1]);
        for (let [a, b] of ivs) {
          // clip to box
          const RO = offOf(r.w), P = (t) => [r.a[0] + dx * t + px * s * RO, r.a[1] + dz * t + pz * s * RO];
          let n = Math.max(2, Math.ceil((b - a) / 9)); if (n % 2) n++;
          let prev = null;
          for (let i = 0; i <= n; i++) {
            const [x, z] = P(a + (b - a) * i / n);
            if (!inBox(x, z)) { prev = null; continue; }
            const nd = node(x, z); nd.rw = Math.max(nd.rw || 0, r.w || 10); if (!nd.rn) nd.rn = r.name; if (prev) link(prev, nd); prev = nd;
          }
        }
      }
    }
    // crosswalks: at each intersection, across each arm
    for (const I of inter.values()) for (const d of I.dirs) {
      const qx = -d[1], qz = d[0], AO = offOf(d[2]), CO = crossOff(I, d[0], d[1]);
      const a = find(I.x + d[0] * CO + qx * AO, I.z + d[1] * CO + qz * AO), b = find(I.x + d[0] * CO - qx * AO, I.z + d[1] * CO - qz * AO);
      if (a && b) { link(a, b); a.cross = b.cross = true; }
    }
    // nudge nodes out of obstacles (lamp posts, hydrants): try small lateral offsets
    for (const n of nodes) {
      const gy = AF.W.groundY(n.x, n.z);
      if (!AF.boxBlocked(n.x, gy + 0.3, n.z, 0.3, 1.2)) continue;
      let done = false;
      for (const r of [0.6, 1.0, 1.4]) { for (let a = 0; a < 8 && !done; a++) { const x = n.x + Math.cos(a * TAU / 8) * r, z = n.z + Math.sin(a * TAU / 8) * r; if (!AF.boxBlocked(x, AF.W.groundY(x, z) + 0.3, z, 0.3, 1.2)) { n.x = x; n.z = z; done = true; } } if (done) break; }
    }
    for (const n of nodes) for (const e of n.adj) e.d = Math.hypot(n.x - e.n.x, n.z - e.n.z);
    return G;
  }
  // nearest edge projection
  function nearestEdge(x, z) {
    let best = null, bd = 1e9, bt = 0;
    for (const e of G.edges) {
      const [a, b] = e, dx = b.x - a.x, dz = b.z - a.z, L2 = dx * dx + dz * dz || 1;
      const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (z - a.z) * dz) / L2));
      const d = Math.hypot(x - a.x - dx * t, z - a.z - dz * t);
      if (d < bd) { bd = d; best = e; bt = t; }
    }
    return best ? { e: best, t: bt, d: bd, x: best[0].x + (best[1].x - best[0].x) * bt, z: best[0].z + (best[1].z - best[0].z) * bt } : null;
  }
  // route between two points via the graph: returns [[x,z],...] (excluding the start point)
  const dist = new Float64Array(4096), prev = new Int32Array(4096), done = new Uint8Array(4096);
  function route(ax, az, bx, bz) {
    const A = nearestEdge(ax, az), Bq = nearestEdge(bx, bz);
    if (!A || !Bq) return [[bx, bz]];
    if (A.e === Bq.e) return [[A.x, A.z], [Bq.x, Bq.z], [bx, bz]];
    const N = G.nodes.length; dist.fill(1e18, 0, N); prev.fill(-1, 0, N); done.fill(0, 0, N);
    const a0 = A.e[0], a1 = A.e[1];
    dist[a0.i] = Math.hypot(A.x - a0.x, A.z - a0.z); dist[a1.i] = Math.hypot(A.x - a1.x, A.z - a1.z);
    const g0 = Bq.e[0].i, g1 = Bq.e[1].i;
    for (let it = 0; it < N; it++) {
      let u = -1, ud = 1e18; for (let i = 0; i < N; i++) if (!done[i] && dist[i] < ud) { ud = dist[i]; u = i; }
      if (u < 0) break; done[u] = 1; if (done[g0] && done[g1]) break;
      for (const e of G.nodes[u].adj) { const nd = ud + e.d; if (nd < dist[e.n.i]) { dist[e.n.i] = nd; prev[e.n.i] = u; } }
    }
    const c0 = dist[g0] + Math.hypot(Bq.x - Bq.e[0].x, Bq.z - Bq.e[0].z), c1 = dist[g1] + Math.hypot(Bq.x - Bq.e[1].x, Bq.z - Bq.e[1].z);
    let g = c0 < c1 ? g0 : g1;
    if (dist[g] > 1e17) return [[bx, bz]];
    const chain = []; while (g >= 0) { chain.push(G.nodes[g]); g = prev[g]; }
    chain.reverse();
    const out = [[A.x, A.z]]; for (const n of chain) out.push([n.x, n.z]); out.push([Bq.x, Bq.z]); out.push([bx, bz]);
    return out;
  }
  G.route = route; G.nearestEdge = nearestEdge;
  // keep-right lane offset for a polyline (graph portion)
  function laneOffset(pts, off, i0, i1) {
    const out = pts.map((p) => p.slice());
    for (let i = Math.max(1, i0); i <= Math.min(pts.length - 2, i1); i++) {
      const p = pts[i - 1], c = pts[i], n = pts[i + 1];
      let d1x = c[0] - p[0], d1z = c[1] - p[1], d2x = n[0] - c[0], d2z = n[1] - c[1];
      const l1 = Math.hypot(d1x, d1z) || 1, l2 = Math.hypot(d2x, d2z) || 1; d1x /= l1; d1z /= l1; d2x /= l2; d2z /= l2;
      let tx = d1x + d2x, tz = d1z + d2z; const tl = Math.hypot(tx, tz); if (tl < 0.2) continue; tx /= tl; tz /= tl;
      // right of travel direction (x,z) with y up: (-dz, dx) is left when looking down +y... use (dz,-dx)... choose consistently
      out[i][0] = c[0] - tz * off; out[i][1] = c[1] + tx * off;
    }
    return out;
  }

  // ------------------------------------------------------------ residents
  const people = AF.people = [];
  K.people = people;
  const spotsTaken = new Set();
  const hourNow = () => AF.time.hours;
  const isNight = () => { const h = hourNow(); return h >= 20.5 || h < 6.5; };

  function playerPos() {
    const P = AF.player;
    if (AF.mode === 'walk' && P) { const x = P.x ?? (P.body && P.body.x), z = P.z ?? (P.body && P.body.z), y = P.y ?? (P.body && P.body.y); if (x != null) return { x, y, z, walk: true }; }
    const c = AF.camera.position; return { x: c.x, y: c.y - 1.6, z: c.z, walk: false };
  }

  const TMPV = new THREE.Vector3();
  function addResident(o) {
    if (people.length >= 162) return null;
    const r = AF.rng(o.seed ?? (people.length * 7919 + 13));
    const L = o.look || makeLook(o.role, o.gender, o.age, r);
    const parts = buildPerson(L);
    const p = Object.assign({
      id: people.length, first: o.first, last: o.last, name: o.first + ' ' + o.last, role: ROLE_TITLE[o.role] || o.role, roleKey: o.role, gender: o.gender, age: o.age,
      home: o.home || null, look: L, parts, root: parts.root,
      x: o.x, y: o.y ?? 0.25, z: o.z, yaw: o.yaw ?? 0, tyaw: o.yaw ?? 0,
      state: 'idle', pose: 'stand', speed: o.speed ?? (o.age === 'elder' ? 0.75 : o.age === 'kid' ? 1.9 : 1.2 + r() * 0.25),
      route: null, ri: 0, wait: 0, phase: r() * TAU, rnd: r, lines: [], li: 0, talkT: 0, waveT: 0, waveCd: 0, lookYaw: 0, lookT: r() * 5, far: false, acc: 0,
      job: o.job, spot: null, visible: true,
    });
    // lines: 2 role + 2 lore + 1 personal
    const rl = ROLE_LINES[o.role] || ROLE_LINES.shopper;
    const order = rl.map((_, i) => i).sort(() => r() - 0.5);
    for (let i = 0; i < Math.min(rl.length, o.age === 'kid' ? 3 : 2); i++) p.lines.push(rl[order[i]]);
    const lo = [Math.floor(r() * LORE.length)]; let l2 = Math.floor(r() * LORE.length); if (l2 === lo[0]) l2 = (l2 + 7) % LORE.length; lo.push(l2);
    for (const i of lo) p.lines.splice(1 + Math.floor(r() * p.lines.length), 0, LORE[i]);
    if (o.personal) p.lines.push(o.personal);
    else if (p.home && p.home.name) {
      const d = p.home.doors && p.home.doors[0], rd = d && PL.nearestRoad ? PL.nearestRoad(d.x, d.z).road : null, street = rd && rd.name ? rd.name : 'Bay Street';
      const fam = p.last && !/\s/.test(p.last) ? (/(s|x|z|ch|sh)$/.test(p.last) ? p.last + 'es' : p.last + 's') : null;
      p.livesOn = street;
      p.lines.push(o.age === 'kid' ? `That's my house on ${street}! Mom's making pot roast tonight, and I get the drumstick!` : fam ? `I'm ${p.first} ${p.last}. We're the ${fam}, the stoop with the mums on ${street}. Stop by and say hello sometime.` : `I'm ${p.first} ${p.last}. I keep a room on ${street}. Swell little street, if you don't mind the gulls.`);
    }
    const root = parts.root; root.position.set(p.x, p.y, p.z); root.rotation.y = p.yaw;
    AF.scene.add(root);
    p.interact = AF.addInteract({ x: p.x, y: p.y + 1, z: p.z, r: 2.0, label: 'Talk to ' + p.first, person: p, can: () => p.visible && !p.hidden, act: () => talk(p) });
    people.push(p);
    return p;
  }

  function talk(p) {
    const line = p.lines[p.li % p.lines.length]; p.li++;
    p.talkT = 7; p.waveT = 0;
    const pp = playerPos(); p.tyaw = Math.atan2(pp.x - p.x, pp.z - p.z);
    AF.emit('dialogue', { name: p.name, role: p.role + (p.livesOn ? ' \u00b7 lives on ' + p.livesOn : ''), line, person: p, livesOn: p.livesOn || null });
  }

  // ------------------------------------------------------------ jobs
  const spotPath = (s) => (s.path && s.path.length ? s.path : null);
  function goTo(p, pts, then) { p.route = pts; p.ri = 0; p.state = 'walk'; p.onArrive = then; setPose(p, 'stand'); }
  function setPose(p, pose) {
    if (p.pose === pose) return; p.pose = pose;
    const pr = p.parts;
    if (pose === 'sit') { pr.legL.geometry = pr.legBG; pr.legR.geometry = pr.legBG; }
    else { pr.legL.geometry = pr.legG; pr.legR.geometry = pr.legG; }
    pr.legL.rotation.set(0, 0, 0); pr.legR.rotation.set(0, 0, 0);
  }
  // standing height: the floor the spot is on, never an awning / canopy / parasol above it (clamp to <= spot floor + 0.6)
  function standY(x, z, sy) {
    const g = AF.W.groundY(x, z), floorY = Math.max(g, sy);
    let y = AF.surfaceBelow(x, z, floorY + 0.3, 1.5);
    if (!Number.isFinite(y) || y > floorY + 0.6 || y < g - 0.05) y = floorY <= g + 0.6 ? g : floorY;
    if (y > g + 0.6 && sy <= g + 0.6) y = g;
    return y;
  }
  K.standY = standY;
  function placeAtSpot(p, s) {
    p.x = s.x; p.z = s.z; p.yaw = p.tyaw = s.yaw || 0; p.spot = s;
    if (s.kind === 'sit' || s.kind === 'bench') { p.y = s.y - p.parts.hipY + 0.02; setPose(p, 'sit'); p.state = 'sit'; }
    else { p.y = standY(s.x, s.z, s.y ?? 0.25); setPose(p, 'stand'); p.state = s.kind === 'work' || s.kind === 'counter' ? 'work' : 'idle'; }
  }
  const freeSpot = (list) => { const f = list.filter((s) => !spotsTaken.has(s)); return f; };
  const takeSpot = (s) => { if (s) spotsTaken.add(s); return s; };
  const releaseSpot = (s) => { if (s) spotsTaken.delete(s); };

  // walker: choose a destination spot, route there via the graph
  let PUBLIC = [], HOMESPOT = new Map();
  let SHOPDOORS = [];
  const centreBias = (x, z) => Math.min(Math.abs(x) * 0.6 + Math.abs(z) * 0.08, Math.abs(z) * 0.6 + Math.abs(x) * 0.08, Math.hypot(x + 40, z + 40), Math.hypot(x - 20, z - 150) * 1.2);
  function walkerNext(p) {
    releaseSpot(p.spot);
    const from = p.spot && spotPath(p.spot) ? spotPath(p.spot).slice().reverse() : [];
    const sx = from.length ? from[from.length - 1][0] : p.x, sz = from.length ? from[from.length - 1][1] : p.z;
    p.spot = null;
    let s = null;
    const night = isNight();
    if (night && p.home) s = HOMESPOT.get(p.home.id);
    const q = p.rnd();
    if (!s && !night && q < 0.55 && SHOPDOORS.length) { // window shopping on the sidewalk
      let d = null, bd = 1e9;
      for (let i = 0; i < 5; i++) { const c = SHOPDOORS[Math.floor(p.rnd() * SHOPDOORS.length)]; const sc = Math.hypot(c.x - sx, c.z - sz) * 0.5 + p.rnd() * 40; if (sc < bd && Math.hypot(c.x - sx, c.z - sz) > 6) { bd = sc; d = c; } }
      if (d) {
        const pts = route(sx, sz, d.wx, d.wz);
        goTo(p, from.concat(laneOffset(pts, 0.45, 0, pts.length - 2)), () => { p.state = 'idle'; p.tyaw = d.yaw; p.wait = 5 + p.rnd() * 10; });
        return;
      }
    }
    if (!s || spotsTaken.has(s)) {
      s = null; let bd = 1e9;
      for (let i = 0; i < 10; i++) { const c = PUBLIC[Math.floor(p.rnd() * PUBLIC.length)]; if (!c || spotsTaken.has(c) || Math.hypot(c.x - p.x, c.z - p.z) < 8) continue; const sc = centreBias(c.x, c.z) + p.rnd() * 70; if (sc < bd) { bd = sc; s = c; } }
    }
    if (!s || (!night && q > 0.5)) { // stroll to a graph node near the centre
      let n = null, bd = 1e9;
      for (let i = 0; i < 4; i++) { const c = G.nodes[Math.floor(p.rnd() * G.nodes.length)]; const sc = centreBias(c.x, c.z) + p.rnd() * 50; if (sc < bd) { bd = sc; n = c; } }
      const pts = route(sx, sz, n.x, n.z);
      goTo(p, from.concat(laneOffset(pts, 0.45, 0, pts.length - 2)), () => { p.state = 'idle'; p.wait = 2 + p.rnd() * 6; p.spot = null; });
      return;
    }
    takeSpot(s);
    const path = spotPath(s);
    const entry = path ? path[0] : [s.x, s.z];
    const pts = route(sx, sz, entry[0], entry[1]);
    const g = laneOffset(pts, 0.45, 0, pts.length - 2);
    const tail = path ? path.slice(1).map((q) => [q[0], q[1]]) : [];
    tail.push([s.x, s.z]);
    goTo(p, from.concat(g, tail), () => {
      placeAtSpot(p, s);
      const home = isNight() && p.home && HOMESPOT.get(p.home.id) === s;
      p.wait = home ? 1e9 : (s.kind === 'sit' || s.kind === 'bench' ? 18 + p.rnd() * 35 : 8 + p.rnd() * 16);
      p.homeRest = home;
    });
  }

  // ------------------------------------------------------------ build
  AF.onBuild('people', 650, () => {
    const t0 = performance.now();
    buildGraph();
    const B = AF.buildings, S = AF.spots;
    const BN = new Map(B.map((b) => [b.id, (b.id + ' ' + (b.name || '') + ' ' + (b.kind || '')).toLowerCase()]));
    const byB = (id, kinds) => { const re = new RegExp(id, 'i'); return S.filter((s) => s.building && re.test(BN.get(s.building) || s.building) && (!kinds || kinds.includes(s.kind))); };
    const houses = B.filter((b) => /^(home|house|apartments?|rowhouse|brownstone|tenement)$/i.test(b.kind || '') && b.doors && b.doors.length);
    const famOf = (b) => { let n = (b.name || '').replace(/^The /i, '').replace(/\s+(home|house|residence|place)$/i, '').trim(); if (!n || /\b(Court|Apartments?|Building|Flats|Arms|House|Cabin|Hotel|Terrace|Mansions?|Hall|Tower|Row|Block)\b/i.test(n) || /\s/.test(n) || !/^[A-Z][A-Za-z']+$/.test(n)) return null; return n; };
    K.famOf = famOf;
    const townHouses = houses.filter((b) => Math.abs(b.doors[0].x) < 260 && Math.abs(b.doors[0].z) < 260 && famOf(b));
    for (const h of houses) { const s = S.find((q) => q.building === h.id && q.kind === 'sit' && q.path && q.path.length); if (s) HOMESPOT.set(h.id, s); }
    PUBLIC = S.filter((s) => s.path && s.path.length && ['browse', 'sit', 'stand', 'bench'].includes(s.kind) && !/^house|^halt|^lake|^farm|^mill|bijou|hotel/.test(s.building || '') && Math.abs(s.x) < 260 && Math.abs(s.z) < 260 && (s.y ?? 0.25) < 2.2);
    SHOPDOORS = B.filter((b) => /shop|civic|hotel/.test(b.kind) && b.doors && b.doors.length && Math.abs(b.doors[0].x) < 260 && Math.abs(b.doors[0].z) < 260).map((b) => { const d = b.doors[0], yw = d.yaw || 0; return { x: d.x, z: d.z, yaw: yw, wx: d.x - Math.sin(yw) * 1.3 + Math.cos(yw) * 1.8, wz: d.z - Math.cos(yw) * 1.3 - Math.sin(yw) * 1.8 }; });
    const benchesPark = S.filter((s) => s.kind === 'bench' && !s.building && ((s.x > -75 && s.x < -7 && s.z > -75 && s.z < -7) || (s.z < -170 && s.z > -295 && s.x > -150 && s.x < 75)));
    const benchesAll = S.filter((s) => s.kind === 'bench' && !s.building && Math.abs(s.x) < 260 && Math.abs(s.z) < 260);
    for (const b of benchesAll) if (!b.path || !b.path.length) { const q = nearestEdge(b.x, b.z); if (q && q.d < 6) b.path = [[q.x, q.z]]; }
    PUBLIC = PUBLIC.concat(benchesAll.filter((b) => b.path && !PUBLIC.includes(b)));
    const rng = AF.rng(1953);
    let fi = 0, mi = 0, bi = 0, gi = 0;
    const nameF = () => FEMALE[(fi++ * 7) % FEMALE.length], nameM = () => MALE[(mi++ * 11) % MALE.length], nameB = () => BOY[(bi++ * 5) % BOY.length], nameG = () => GIRL[(gi++ * 3) % GIRL.length];
    let hi = 0; const nextHouse = () => townHouses.length ? townHouses[(hi++ * 13) % townHouses.length] : null;
    const surnameFor = (h) => (h && famOf(h)) || pick(rng, SURN);
    const gender = (g) => g || (rng() < 0.5 ? 'f' : 'm');
    const firstFor = (g, age) => age === 'kid' ? (g === 'f' ? nameG() : nameB()) : (g === 'f' ? nameF() : nameM());

    // 1) keepers at shops & civic buildings
    const STAFF = [
      ['bank|trust', 'banker', 'm', 'adult', ['counter', 'work'], 'Percy', 'Whitaker'], ['bank|trust', 'banker', 'f', 'adult', ['counter', 'work'], 'Grace', 'Beaumont'], ['bank|trust', 'guard', 'm', 'adult', ['stand'], 'Otis', 'Quinlan'],
      ['hotel|grand solace', 'doorman', 'm', 'adult', ['stand'], 'Winston', 'Pickford'], ['hotel|grand solace', 'bellhop', 'm', 'teen', ['counter', 'stand'], 'Artie', 'Mayhew'], ['hotel|grand solace', 'clerk', 'f', 'adult', ['counter'], 'Dolores', 'Marchetti'],
      ['hotel|ballroom', 'jazz', 'm', 'adult', ['work', 'stage'], 'Lester', 'Garland'],
      ['radio|wsol', 'announcer', 'm', 'adult', ['work'], 'Clark', 'Dunmore'], ['radio|wsol', 'jazz', 'f', 'adult', ['work', 'stage'], 'Billie', 'Sullivan'], ['radio|wsol', 'repair', 'm', 'adult', ['work'], 'Sparky', 'Novak'],
      ['store|meridian', 'clerk', 'f', 'adult', ['counter', 'work'], 'Opal', 'Hartley'], ['store|meridian', 'clerk', 'm', 'adult', ['counter', 'work'], 'Everett', 'Hartley'], ['store|meridian', 'clerk', 'f', 'adult', ['counter', 'work'], 'June', 'Ashby'],
      ['paramount', 'usher', 'f', 'teen', ['counter', 'work', 'stand'], 'Darlene', 'Pickford'], ['paramount', 'usher', 'm', 'teen', ['stand', 'work'], 'Ricky', 'Esposito'],
      ['heron|jazz', 'jazz', 'm', 'adult', ['work', 'stage'], 'Satch', 'Delgado'], ['heron|jazz', 'jazz', 'm', 'adult', ['work', 'stage'], 'Duke', 'Callahan'], ['heron|jazz', 'waitress', 'f', 'adult', ['counter', 'work'], 'Ruby', 'Morelli'],
      ['diner|starlite', 'waitress', 'f', 'adult', ['work', 'counter'], 'Rosie', 'Callahan'], ['diner|starlite', 'cook', 'm', 'adult', ['work'], 'Buck', 'Callahan'],
      ['automat', 'clerk', 'f', 'adult', ['counter', 'work'], 'Hazel', 'Kowalski'], ['drug|soda', 'sodajerk', 'm', 'teen', ['work', 'counter'], 'Eddie', 'Carter'],
      ['news|tobacco', 'newsman', 'm', 'elder', ['counter', 'work'], 'Moe', 'Kaplan'], ['barber', 'barber', 'm', 'adult', ['work'], 'Sal', 'Russo'], ['bakery', 'baker', 'm', 'adult', ['work', 'counter'], 'Gus', 'Novak'],
      ['record|radio shop', 'clerk', 'f', 'teen', ['counter', 'work'], 'Connie', 'Vance'], ['book', 'librarian', 'f', 'elder', ['counter', 'work'], 'Agnes', 'Pritchard'], ['camera|photo', 'photographer', 'm', 'adult', ['counter', 'work'], 'Julian', 'Bellamy'],
      ['shoeshine', 'shoeshine', 'm', 'kid', ['work', 'stand'], 'Tommy', 'Quinlan'], ['hat', 'clerk', 'f', 'adult', ['counter', 'work'], 'Mabel', 'Crane'], ['flor', 'florist', 'f', 'adult', ['counter', 'work'], 'Violet', 'Crane'],
      ['city ?hall|cityhall', 'mayor', 'm', 'elder', ['work'], 'Mayor Horace', 'Fenwick'], ['city ?hall|cityhall', 'clerk', 'f', 'adult', ['counter', 'work'], 'Louise', 'Brennan'],
      ['library', 'librarian', 'f', 'adult', ['counter', 'work'], 'Miriam', 'Ashby'], ['museum', 'guard', 'm', 'elder', ['stand', 'work'], 'Amos', 'Pruitt'], ['museum', 'guard', 'm', 'adult', ['stand', 'work'], 'Leon', 'Hollis'],
      ['terminal', 'ticket', 'm', 'adult', ['counter', 'work'], 'Clyde', 'Dobbs'], ['terminal', 'shoeshine', 'm', 'teen', ['work', 'stand'], 'Wally', 'Szabo'], ['terminal', 'newsman', 'm', 'adult', ['counter'], 'Irving', 'Kaplan'],
      ['fish|market', 'fishmonger', 'm', 'adult', ['work', 'counter'], 'Gus', 'Marchetti'], ['fish|market', 'fishmonger', 'f', 'adult', ['work', 'counter'], 'Nora', 'Sullivan'], ['fish|market', 'fishmonger', 'm', 'elder', ['work', 'counter'], 'Old Sven', 'Lindqvist'],
      ['harbourmaster|ferry', 'clerk', 'm', 'elder', ['counter', 'work'], 'Captain Silas', 'Nordstrom'], ['dock|warehouse|cannery', 'stevedore', 'm', 'adult', ['work'], 'Big Mike', 'Kowalski'], ['dock|warehouse|cannery', 'stevedore', 'm', 'adult', ['work'], 'Tony', 'Esposito'],
      ['fire|engine', 'fireman', 'm', 'adult', ['work'], 'Captain Joe', 'Brennan'], ['fire|engine', 'fireman', 'm', 'adult', ['sit', 'work'], 'Mickey', "O'Hara"],
      ['chandlery|oyster|neptune', 'waitress', 'f', 'adult', ['work', 'counter'], 'Pearl', 'Delgado'], ['pawn|hardware|pool|laundr', 'clerk', 'm', 'adult', ['counter', 'work'], 'Otto', 'Kessler'],
      ['grocery|deli|candy', 'clerk', 'm', 'adult', ['counter', 'work'], 'Sol', 'Abramowitz'], ['tailor', 'tailor', 'm', 'elder', ['work', 'counter'], 'Hans', 'Fischer'], ['bar|anchor', 'clerk', 'm', 'adult', ['counter', 'work'], 'Paddy', 'Fitzgerald'],
      ['church|school', 'teacher', 'f', 'adult', ['work', 'stand'], 'Eleanor', 'Mayhew'], ['doctor', 'doctor', 'm', 'adult', ['work'], 'Dr. Walter', 'Garland'],
    ];
    const PERSONAL = {
      Rosie: "I'm Rosie. Yes, THE Rosie of the Starlite. The secret to the pie is love and a little extra lard.", Sal: "Sal Russo, at your service. My pop cut hair in Naples, and his pop before him.",
      Horace: "Horace Fenwick, Mayor, three terms. Port Solace is my first love. Mrs. Fenwick knows and has made her peace with it.",
      Percy: "Percy Whitaker. My grandfather founded the Harbour Trust with one ledger and a rowboat.", Clyde: "Clyde Dobbs, ticket agent. I know where everybody in this city is going.",
      Clark: "Clark Dunmore, the Voice of WSOL. You've heard me every night at ten, I'd wager.", Satch: "Satch Delgado. Trumpet. The Blue Heron's been my home since the day it opened.",
      Winston: "Winston Pickford. Twenty years on the door of the Grand Solace. I've tipped my cap to three presidents.", 'Captain Joe': "Captain Joe Brennan, Engine Co. 7. Sparky the dalmatian outranks me, don't tell him.",
      Julian: "Julian Bellamy. I photographed every premiere at the Paragon since it opened.", Everett: "Hartley's the name. Meridian's menswear, third floor. I dress half the city.",
      Silas: "Captain Silas Nordstrom, harbourmaster. I've watched ten thousand ships come round Solace Point.",
    };
    const stationed = new Map();
    for (const [bid, role, g, age, kinds, first, last] of STAFF) {
      let list = [];
      for (const k of kinds) { list = freeSpot(byB(bid, [k])); if (list.length) break; }
      if (!list.length) continue;
      const s = takeSpot(list[0]);
      const p = addResident({ role, gender: g, age, first, last, x: s.x, z: s.z, y: s.y, yaw: s.yaw, home: nextHouse(), job: { type: 'keeper' }, personal: PERSONAL[first] || PERSONAL[(first.split(' ')[1] || '')] });
      if (!p) continue;
      placeAtSpot(p, s); p.job.spot = s; stationed.set(bid, (stationed.get(bid) || 0) + 1);
    }
    // any other shop/civic building with a work/counter spot but no keeper yet
    for (const b of B) {
      if (people.length >= 44) break;
      if (stationed.has(b.id) || /^(home|house|apartments?|park)$/i.test(b.kind || '')) continue;
      const list = freeSpot(byB(b.id, ['counter', 'work'])); if (!list.length) continue;
      const s = takeSpot(list[0]); const g = gender();
      const role = /garage|pop|filling|service/i.test(b.id + b.name) ? 'mechanic' : 'clerk';
      const p = addResident({ role, gender: role === 'mechanic' ? 'm' : g, age: 'adult', first: firstFor(role === 'mechanic' ? 'm' : g, 'adult'), last: pick(rng, SURN), x: s.x, z: s.z, yaw: s.yaw, home: nextHouse(), job: { type: 'keeper' } });
      if (p) { placeAtSpot(p, s); stationed.set(b.id, 1); }
    }
    // 2) seated customers (diner, soda fountain, cafe, ice-cream, barber chairs)
    for (const [bid, n] of [['diner|starlite', 4], ['automat', 3], ['drug|soda', 2], ['heron|jazz', 4], ['paramount', 6], ['barber', 1], ['library', 2], ['terminal', 4], ['hotel|grand solace', 3], ['radio|wsol', 4], ['oyster|neptune', 2]]) {
      const list = freeSpot(byB(bid, ['sit'])).filter((s) => (s.y ?? 0) < 3);
      for (let i = 0; i < Math.min(n, list.length) && people.length < 62; i++) {
        const s = takeSpot(list[Math.floor(i * list.length / n)]);
        const h = nextHouse(), age = rng() < 0.15 ? 'elder' : rng() < 0.15 ? 'teen' : 'adult', g = gender();
        const p = addResident({ role: age === 'teen' ? 'teen' : bid === 'terminal' ? 'traveler' : 'shopper', gender: g, age, first: firstFor(g, age), last: surnameFor(h), x: s.x, z: s.z, home: h, job: { type: 'sitter' } });
        if (p) placeAtSpot(p, s);
      }
    }
    // 3) depot platform waiters + conductor
    { const plat = freeSpot(byB('terminal', ['stand', 'bench']));
      const cond = plat.find((s) => s.kind === 'stand');
      if (cond) { takeSpot(cond); const p = addResident({ role: 'conductor', gender: 'm', age: 'elder', first: 'Mr. Barnaby', last: 'Dobbs', x: cond.x, z: cond.z, job: { type: 'keeper' }, personal: "Barnaby Dobbs, conductor on the Coastline Limited. Forty-one years and never late." }); if (p) placeAtSpot(p, cond); }
      for (let i = 0; i < 3; i++) { const l = freeSpot(plat); if (!l.length) break; const s = takeSpot(l[Math.floor(rng() * l.length)]); const h = nextHouse(), g = gender(), age = rng() < 0.2 ? 'kid' : rng() < 0.2 ? 'elder' : 'adult'; const p = addResident({ role: age === 'kid' ? 'kid' : 'traveler', gender: g, age, first: firstFor(g, age), last: surnameFor(h), x: s.x, z: s.z, home: h, job: { type: 'sitter' } }); if (p) { placeAtSpot(p, s); if (p.look.propR == null && age === 'adult' && s.kind === 'stand') {} } }
    }
    // 4) park: bench sitters + chatting pairs + grandpa feeding pigeons
    { const pb = freeSpot(benchesPark);
      for (let i = 0; i < Math.min(4, pb.length); i++) { const s = takeSpot(pb[Math.floor(i * pb.length / 4)]); const h = nextHouse(), age = i < 2 ? 'elder' : 'adult', g = gender(); const p = addResident({ role: age === 'elder' ? (g === 'f' ? 'grandma' : 'grandpa') : 'worker', gender: g, age, first: firstFor(g, age), last: surnameFor(h), x: s.x, z: s.z, home: h, job: { type: 'sitter' } }); if (p) placeAtSpot(p, s); }
      const pairs = [[8.5, 30], [40, 8.5], [-60, 171.5], [20, -171.5]];
      for (const [x, z] of pairs) {
        const h = nextHouse();
        for (let k = 0; k < 2; k++) {
          const g = k === 0 ? 'f' : gender(), age = rng() < 0.2 ? 'elder' : 'adult';
          const px = x + (k ? 0.55 : -0.55), pz = z;
          const p = addResident({ role: rng() < 0.5 ? 'shopper' : 'worker', gender: g, age, first: firstFor(g, age), last: surnameFor(k ? nextHouse() : h), x: px, z: pz, y: standY(px, pz, 0.25), yaw: k ? -Math.PI / 2 : Math.PI / 2, home: h, job: { type: 'chat' } });
          if (p) { p.state = 'idle'; p.y = standY(px, pz, 0.25); }
        }
      }
    }
    // 5) kids: school playground + park lawn
    const kidZones = [{ rect: [-60, -200, -30, -185], n: 3 }, { rect: [0, -230, 30, -215], n: 3 }, { rect: [-68, -30, -56, -16], n: 2 }];   // fire-station green round the duck pond (clear of the station walls + water)
    for (const Z of kidZones) for (let i = 0; i < Z.n; i++) {
      const h = nextHouse(), g = gender();
      let x = AF.lerp(Z.rect[0], Z.rect[2], rng()), z = AF.lerp(Z.rect[1], Z.rect[3], rng());
      for (let k = 0; k < 12 && Z.avoid && Math.hypot(x - Z.avoid.x, z - Z.avoid.z) < Z.avoid.r; k++) { x = AF.lerp(Z.rect[0], Z.rect[2], rng()); z = AF.lerp(Z.rect[1], Z.rect[3], rng()); }
      if (Z.avoid && Math.hypot(x - Z.avoid.x, z - Z.avoid.z) < Z.avoid.r) { x = Z.rect[0] + 0.5; z = Z.rect[1] + 0.5; }
      const p = addResident({ role: 'kid', gender: g, age: 'kid', first: firstFor(g, 'kid'), last: surnameFor(h), x, z, y: standY(x, z, 0.25), home: h, job: { type: 'wander', rect: Z.rect, avoid: Z.avoid || null }, speed: 1.6 + rng() * 1.2 });
      if (p) { p.state = 'idle'; p.wait = rng() * 2; }
    }
    // 5b) polish spots from the other owners: kids at 'play' spots, folks in queues + at picnic sits, anglers at 'fish'
    { const guard = (s) => s && Number.isFinite(s.x) && Number.isFinite(s.z) && !spotsTaken.has(s);
      const play = S.filter((s) => s.kind === 'play' && guard(s));
      for (let i = 0; i < Math.min(4, play.length) && people.length < 92; i++) { const s = play[Math.floor(i * play.length / Math.min(10, play.length))]; if (!guard(s)) continue; takeSpot(s); const h = nextHouse(), g = gender(); const p = addResident({ role: 'kid', gender: g, age: 'kid', first: firstFor(g, 'kid'), last: surnameFor(h), x: s.x, z: s.z, home: h, job: { type: 'sitter' } }); if (p) placeAtSpot(p, s); }
      const queue = S.filter((s) => s.kind === 'stand' && s.queue != null && guard(s));
      for (let i = 0; i < Math.min(3, queue.length) && people.length < 96; i++) { const s = queue[Math.floor(i * queue.length / Math.min(5, queue.length))]; if (!guard(s)) continue; takeSpot(s); const h = nextHouse(), g = gender(), age = rng() < 0.25 ? 'kid' : 'adult'; const p = addResident({ role: age === 'kid' ? 'kid' : 'shopper', gender: g, age, first: firstFor(g, age), last: surnameFor(h), x: s.x, z: s.z, home: h, job: { type: 'sitter' } }); if (p) placeAtSpot(p, s); }
      const fish = S.filter((s) => s.kind === 'fish' && guard(s));
      for (let i = 0; i < Math.min(2, fish.length); i++) { const s = fish[i]; takeSpot(s); const p = addResident({ role: 'fisherman', gender: 'm', age: i ? 'elder' : 'adult', first: firstFor('m', 'adult'), last: pick(rng, SURN), x: s.x, z: s.z, job: { type: 'keeper' } }); if (p) { placeAtSpot(p, s); p.state = 'idle'; } }
    }
    // 6) farm hands + pier anglers
    { const fw = S.filter((s) => s.building === 'farm' && s.kind === 'work');
      for (let i = 0; i < Math.min(3, fw.length); i++) { const s = fw[Math.floor(i * fw.length / 3)]; const g = i === 2 ? 'f' : 'm'; const p = addResident({ role: g === 'f' ? 'farmwife' : 'farmer', gender: g, age: 'adult', first: firstFor(g, 'adult'), last: 'Whitcomb', x: s.x, z: s.z, y: s.y, job: { type: 'farm', spots: fw }, speed: 1.0 }); if (p) placeAtSpot(p, s); }
      const pier = S.filter((s) => s.building === 'lake-pier' && s.kind === 'stand');
      for (let i = 0; i < Math.min(2, pier.length); i++) { const s = pier[i]; const p = addResident({ role: 'fisherman', gender: 'm', age: i ? 'elder' : 'adult', first: firstFor('m', 'adult'), last: pick(rng, SURN), x: s.x, z: s.z, job: { type: 'keeper' } }); if (p) { placeAtSpot(p, s); p.state = 'idle'; } }
    }
    // 7) eye-level life: Paramount box-office queue, newsboys on 4 corners, folks waiting at the streetcar stops
    { const q = freeSpot(byB('paramount', ['stand'])).filter((s) => (s.y ?? 0.25) < 0.4).slice(0, 6);
      for (const s of q) { takeSpot(s); const h = nextHouse(), g = gender(), age = rng() < 0.2 ? 'teen' : 'adult'; const p = addResident({ role: age === 'teen' ? 'teen' : 'shopper', gender: g, age, first: firstFor(g, age), last: surnameFor(h), x: s.x, z: s.z, home: h, job: { type: 'keeper' } }); if (p) placeAtSpot(p, s); }
      const corners = [[9.2, 9.2, -2.36], [-9.2, -9.2, 0.79], [9.2, 148.2, -0.79], [148.2, 9.2, -2.36]];
      for (const [x, z, yaw] of corners) { if (AF.boxBlocked(x, 0.3, z, 0.3, 1.4)) continue; const p = addResident({ role: 'paperboy', gender: 'm', age: rng() < 0.5 ? 'kid' : 'teen', first: firstFor('m', 'kid'), last: pick(rng, SURN), x, z, y: standY(x, z, 0.25), yaw, job: { type: 'keeper' } }); if (p) { p.state = 'idle'; p.y = standY(x, z, 0.25); p.yaw = p.tyaw = yaw; } }
      for (const st of PL.rail.stations) {
        for (let k = 0; k < 1; k++) {
          const sd = PL.railSide(st.sC - 4 + k * 8 + rng() * 2, 3.1 + (rng() - 0.5) * 0.8), y = AF.surfaceBelow(sd.x, sd.z, 2, 3);
          if (!Number.isFinite(y) || AF.boxBlocked(sd.x, y + 0.1, sd.z, 0.25, 1.4)) continue;
          const g = gender(), age = rng() < 0.15 ? 'elder' : 'adult';
          const p = addResident({ role: rng() < 0.3 ? 'traveler' : 'worker', gender: g, age, first: firstFor(g, age), last: pick(rng, SURN), x: sd.x, z: sd.z, y, yaw: sd.yaw - Math.PI / 2, job: { type: 'keeper' } });
          if (p) { p.state = 'idle'; p.y = y; p.yaw = p.tyaw = sd.yaw + Math.PI / 2; }
        }
      }
    }
    // 7b) STOOPS (residential: AF.spots with stoop:true) — neighbours sitting out, a friend standing to chat, kids on the sidewalk
    { const st = S.filter((q) => q && q.stoop && Number.isFinite(q.x) && Number.isFinite(q.z) && !spotsTaken.has(q));
      const pickN = Math.min(10, st.length);
      let kids = 0;
      for (let i = 0; i < pickN; i++) {
        const q = st[Math.floor(i * st.length / pickN)]; if (!q || spotsTaken.has(q)) continue;
        takeSpot(q);
        const h = nextHouse(), g = gender(), age = rng() < 0.25 ? 'elder' : rng() < 0.15 ? 'teen' : 'adult';
        const p = addResident({ role: age === 'elder' ? (g === 'f' ? 'grandma' : 'grandpa') : age === 'teen' ? 'teen' : rng() < 0.5 ? 'shopper' : 'worker', gender: g, age, first: firstFor(g, age), last: surnameFor(h), x: q.x, z: q.z, y: q.y, home: h, job: { type: 'sitter' } });
        if (!p) break;
        placeAtSpot(p, q);
        const fx = Math.sin(q.yaw || 0), fz = Math.cos(q.yaw || 0), end = q.path && q.path.length ? q.path[q.path.length - 1] : null;
        if (i % 2 === 0) {   // a friend at the foot of the stoop, facing up
          let x = q.x + fx * 1.1 + fz * 0.5, z = q.z + fz * 1.1 - fx * 0.5;
          if (end) { x = end[0] + fz * 0.4; z = end[1] - fx * 0.4; }
          const y = AF.surfaceBelow(x, z, (q.y || 0.25) + 0.6, 3);
          if (Number.isFinite(y) && !AF.boxBlocked(x, y + 0.2, z, 0.25, 1.5)) {
            const g2 = gender(), a2 = rng() < 0.2 ? 'elder' : 'adult';
            const f = addResident({ role: rng() < 0.5 ? 'shopper' : 'worker', gender: g2, age: a2, first: firstFor(g2, a2), last: pick(rng, SURN), x, z, y, yaw: Math.atan2(q.x - x, q.z - z), job: { type: 'chat' } });
            if (f) { f.state = 'idle'; f.y = y; f.yaw = f.tyaw = Math.atan2(q.x - x, q.z - z); }
          }
        }
        if (end && kids < 5 && i % 3 === 1) {   // kids playing on the sidewalk in front
          const x0 = end[0] + fx * 0.8, z0 = end[1] + fz * 0.8, R = [x0 - 1.5, z0 - 1.5, x0 + 1.5, z0 + 1.5];
          const y = AF.surfaceBelow(x0, z0, 2, 3);
          if (Number.isFinite(y) && !AF.boxBlocked(x0, y + 0.2, z0, 0.25, 1.2) && PL.nearestRoad(x0, z0).edge > 0.6) {
            const g3 = gender(); const k = addResident({ role: 'kid', gender: g3, age: 'kid', first: firstFor(g3, 'kid'), last: p.last, x: x0, z: z0, y, home: h, job: { type: 'wander', rect: R, avoid: null }, speed: 1.6 + rng() });
            if (k) { k.state = 'idle'; k.wait = rng() * 2; kids++; }
          }
        }
      }
    }
    // 8) walkers (fill up to ~132)
    const specials = [['paperboy', 'm', 'kid'], ['police', 'm', 'adult'], ['cabbie', 'm', 'adult'], ['sailor', 'm', 'adult'], ['milkman', 'm', 'adult'], ['florist', 'f', 'adult'], ['paperboy', 'm', 'teen'], ['stevedore', 'm', 'adult'], ['lamplighter', 'm', 'elder'], ['police', 'm', 'adult'], ['sailor', 'm', 'adult'], ['jazz', 'm', 'adult'], ['grandpa', 'm', 'elder'], ['nurse', 'f', 'adult'], ['paperboy', 'm', 'kid'], ['police', 'm', 'adult'], ['cabbie', 'm', 'adult'], ['stevedore', 'm', 'adult'], ['florist', 'f', 'adult'], ['grandma', 'f', 'elder'], ['teen', 'f', 'teen'], ['teen', 'm', 'teen'], ['sailor', 'm', 'adult'], ['shoeshine', 'm', 'kid'], ['kid', 'm', 'kid'], ['kid', 'f', 'kid']];
    const walkerStart = people.length;
    const target = 162;   // coordinator: more walkers so Main Street feels alive
    let wi = 0;
    while (people.length < target && G.nodes.length) {
      const sp = specials[wi] || null; wi++;
      const g = sp ? sp[1] : gender(), age = sp ? sp[2] : (rng() < 0.12 ? 'elder' : rng() < 0.1 ? 'teen' : 'adult');
      const role = sp ? sp[0] : (age === 'elder' ? (g === 'f' ? 'grandma' : 'grandpa') : age === 'teen' ? 'teen' : rng() < 0.6 ? 'shopper' : 'worker');
      const h = nextHouse();
      let n = null; { let bd = 1e9; for (let k = 0; k < 4; k++) { const c = G.nodes[Math.floor(rng() * G.nodes.length)]; const sc = centreBias(c.x, c.z) + rng() * 40; if (sc < bd) { bd = sc; n = c; } } }
      const p = addResident({ role, gender: g, age, first: firstFor(g, age), last: surnameFor(h), x: n.x, z: n.z, y: standY(n.x, n.z, 0.25), home: h, job: { type: 'walker', dog: (wi % 9 === 4) }, personal: role === 'doctor' ? "Doc Miller. My shingle's out front of the house on East Square. Come by if that cough doesn't clear." : null });
      if (!p) break;
      // half start inside at a destination already
      p.wait = rng() * 6;
      if (rng() < 0.2) { const s = PUBLIC[Math.floor(rng() * PUBLIC.length)]; if (s && !spotsTaken.has(s)) { takeSpot(s); placeAtSpot(p, s); p.wait = rng() * 30; } }
      if (p.job.dog) p.dogWalker = true;
      if (wi % 4 === 2 && !p.job.dog && people.length < target && role !== 'paperboy') {
        const g2 = g === 'f' ? 'm' : 'f', a2 = age === 'kid' || age === 'teen' ? age : (age === 'elder' ? 'elder' : 'adult');
        const q = addResident({ role: a2 === 'elder' ? (g2 === 'f' ? 'grandma' : 'grandpa') : a2 === 'teen' ? 'teen' : 'shopper', gender: g2, age: a2, first: firstFor(g2, a2), last: p.last, x: p.x + 0.6, z: p.z, y: p.y, home: h, job: { type: 'follow', leader: p } });
        if (q) { q.wait = 0; p.partner = q; }
      }
    }
    K.walkerStart = walkerStart;
    for (const p of people) { p.root.position.set(p.x, p.y, p.z); p.root.rotation.y = p.yaw; }
    K.stats = { people: people.length, nodes: G.nodes.length, edges: G.edges.length, geos: geoCache.size, ms: Math.round(performance.now() - t0) };
    console.log('[af] people', JSON.stringify(K.stats));
  });

  // ------------------------------------------------------------ update
  function stepWalk(p, dt) {
    const R = p.route; if (!R || p.ri >= R.length) { p.route = null; p.state = 'idle'; const f = p.onArrive; p.onArrive = null; if (f) f(); return 0; }
    const tgt = R[p.ri], dx = tgt[0] - p.x, dz = tgt[1] - p.z, d = Math.hypot(dx, dz);
    let sp = p.speed * (p.job.type === 'wander' ? 1 : 1);
    // player avoidance: pause if the player stands right ahead
    const pp = playerPos();
    if (pp.walk) { const ax = pp.x - p.x, az = pp.z - p.z, ad = Math.hypot(ax, az); if (ad < 1.1 && (ax * dx + az * dz) > 0) { sp = 0; p.tyaw = Math.atan2(ax, az); } }
    if (d < 0.2) { p.ri++; return sp; }
    const step = Math.min(d, sp * dt);
    p.x += dx / d * step; p.z += dz / d * step;
    if (sp > 0) p.tyaw = Math.atan2(dx, dz);
    const gy = AF.surfaceBelow(p.x, p.z, p.y + 0.6, 3);
    p.y += (gy - p.y) * Math.min(1, dt * 14);
    return sp;
  }

  // R2 JOB VERBS: one readable action per trade for the named residents at their work spots (called after the default work pose)
  const cyc = (t, per) => ((t % per) + per) % per / per;
  const JOBVERB = {
    newsman: (pr, t) => { const k = cyc(t, 6); if (k < 0.45) { pr.armR.rotation.x = -2.75 + Math.sin(t * 7) * 0.3; pr.armL.rotation.x = -0.4; pr.head.rotation.x = -0.15; } else pr.head.rotation.x = 0; },   // "EXTRA! EXTRA!"
    paperboy: (pr, t) => JOBVERB.newsman(pr, t),
    shoeshine: (pr, t) => { const b = Math.sin(t * 9); pr.hips.rotation.x = 0.42; pr.armR.rotation.x = -1.25 + b * 0.35; pr.armL.rotation.x = -1.25 - b * 0.35; },
    fishmonger: (pr, t) => { const k = cyc(t, 2.4); const a = k < 0.55 ? -0.5 - k / 0.55 * 1.9 : k < 0.66 ? -2.4 + (k - 0.55) / 0.11 * 1.9 : -0.5; pr.armR.rotation.x = a; pr.armL.rotation.x = a * 0.9; pr.hips.rotation.x = k > 0.55 && k < 0.7 ? 0.18 : 0.04; },   // lift ... SLAP
    stevedore: (pr, t) => { const k = cyc(t, 3.2); pr.hips.rotation.x = k < 0.5 ? 0.45 * Math.sin(k * 2 * Math.PI) : 0.02; pr.armR.rotation.x = pr.armL.rotation.x = -1.1 - (k < 0.5 ? 0 : 0.3); },
    barber: (pr, t) => { pr.armR.rotation.x = -1.35 + Math.sin(t * 17) * 0.07; pr.armR.rotation.z = -0.25; pr.armL.rotation.x = -1.05 + Math.sin(t * 0.7) * 0.1; pr.head.rotation.y = Math.sin(t * 0.5) * 0.3; },
    baker: (pr, t) => { const b = Math.sin(t * 5); pr.hips.rotation.x = 0.16; pr.armR.rotation.x = -0.85 + b * 0.3; pr.armL.rotation.x = -0.85 - b * 0.3; },
    cook: (pr, t) => { const k = cyc(t, 2.6); pr.armR.rotation.x = k < 0.2 ? -0.9 - Math.sin(k / 0.2 * Math.PI) * 1.0 : -0.9; pr.armL.rotation.x = -0.8; },   // flip!
    jazz: (pr, t) => { pr.armR.rotation.x = -1.45; pr.armL.rotation.x = -1.35; pr.armR.rotation.z = -0.15; pr.armL.rotation.z = 0.15; pr.head.rotation.x = -0.12 + Math.sin(t * 4.4) * 0.08; pr.body.position.y = Math.abs(Math.sin(t * 4.4)) * 0.025; },
    florist: (pr, t) => { const k = cyc(t, 7); pr.armR.rotation.x = k < 0.35 ? -1.45 : -0.6; pr.armL.rotation.x = -0.6; },   // offers a bouquet
    photographer: (pr, t) => { const k = cyc(t, 5); pr.armR.rotation.x = pr.armL.rotation.x = k < 0.6 ? -1.95 : -0.7; pr.armL.rotation.z = k < 0.6 ? 0.3 : 0; },
    ticket: (pr, t) => { pr.armR.rotation.x = -0.8 - Math.abs(Math.sin(t * 3.2)) * 0.7; pr.armL.rotation.x = -0.6; },   // stamp, stamp
    mayor: (pr, t) => { pr.armR.rotation.x = -1.2 + Math.sin(t * 1.3) * 0.55; pr.armR.rotation.z = -0.35; pr.armL.rotation.x = -0.2; },
    doorman: (pr, t) => { const k = cyc(t, 11); if (k < 0.2) { pr.armR.rotation.x = -2.8; pr.armR.rotation.z = -0.25 + Math.sin(t * 10) * 0.2; } },   // hails a cab
    guard: (pr) => { pr.armR.rotation.x = 0.35; pr.armL.rotation.x = 0.35; pr.armR.rotation.z = -0.25; pr.armL.rotation.z = 0.25; },   // hands clasped behind
    sodajerk: (pr, t) => { const k = cyc(t, 4); pr.armR.rotation.x = k < 0.3 ? -1.1 - Math.sin(t * 14) * 0.25 : -0.9; },   // shaking a malted
    waitress: (pr, t) => { pr.armL.rotation.x = -1.5; pr.armL.rotation.z = 0.35; },   // tray up
    librarian: (pr, t) => { const k = cyc(t, 6); pr.head.rotation.x = k < 0.7 ? 0.35 : 0; pr.armR.rotation.x = k > 0.7 && k < 0.8 ? -1.3 : -0.85; },
  };
  K.JOBVERB = JOBVERB;
  function animate(p, dt, moving, sp) {
    const pr = p.parts, t = AF.clock.t;
    const kid = p.age === 'kid';
    if (moving && sp > 0) {
      p.phase += dt * sp * (kid ? 5.2 : 4.6);
      const s = Math.sin(p.phase), A = kid ? 0.75 : 0.55;
      pr.legL.rotation.x = s * A; pr.legR.rotation.x = -s * A;
      const armA = p.look.propR === 'cane' || p.look.propR === 'crate' ? 0.12 : A * 0.8;
      pr.armL.rotation.x = -s * A * 0.8; pr.armR.rotation.x = s * armA;
      pr.armL.rotation.z = 0; pr.armR.rotation.z = 0;
      pr.body.position.y = Math.abs(Math.cos(p.phase)) * (kid ? 0.07 : 0.035);
      pr.hips.rotation.x = kid ? 0.08 : 0.03; pr.hips.rotation.y = s * 0.05;
      if (p.look.propR === 'cane') pr.hips.rotation.x = 0.12;
    } else {
      pr.legL.rotation.x *= 0.8; pr.legR.rotation.x *= 0.8;
      pr.body.position.y = 0; pr.hips.rotation.y = 0;
      const breathe = Math.sin(t * 1.7 + p.id) * 0.012;
      pr.hips.rotation.x = p.pose === 'sit' ? -0.02 : breathe + (p.age === 'elder' ? 0.06 : 0);
      if (p.state === 'work') { const w = Math.sin(t * 3.1 + p.id); pr.armR.rotation.x = -0.9 + w * 0.25; pr.armL.rotation.x = -0.7 - w * 0.2; pr.armR.rotation.z = 0; const JV = JOBVERB[p.roleKey]; if (JV) JV(pr, t + p.id * 1.7, p); }
      else if (p.pose === 'sit') { pr.armR.rotation.x = -0.55; pr.armL.rotation.x = -0.5; pr.legL.rotation.x = 0; pr.legR.rotation.x = 0; }
      else { pr.armR.rotation.x *= 0.85; pr.armL.rotation.x = pr.armL.rotation.x * 0.85 + Math.sin(t * 1.3 + p.id) * 0.004; if ((p.roleKey === 'doorman' || p.roleKey === 'guard') && p.spot && p.job) JOBVERB[p.roleKey](pr, t + p.id * 1.7, p); }
      if (p.job.type === 'chat') { const g = Math.sin(t * 2.3 + p.id * 1.7); pr.armR.rotation.x = -0.35 + Math.max(0, g) * 0.5; pr.armR.rotation.z = -0.15; pr.body.position.y = Math.max(0, Math.sin(t * 4 + p.id)) * 0.008; }
    }
    // waving
    if (p.waveT > 0) { p.waveT -= dt; const w = Math.sin(t * 12); pr.armR.rotation.x = -2.6; pr.armR.rotation.z = -0.25 + w * 0.35; }
    else if (!(p.job.type === 'chat') && p.state !== 'work') pr.armR.rotation.z *= 0.8;
    // head look
    p.lookT -= dt;
    if (p.lookT < 0) { p.lookT = 2 + p.rnd() * 5; p.lookYaw = moving ? (p.rnd() - 0.5) * 0.5 : (p.rnd() - 0.5) * 1.4; }
    let hy = p.lookYaw;
    if (p.face != null) hy = AF.clamp(AF.angDiff(p.yaw, p.face), -1.1, 1.1);
    pr.head.rotation.y += (hy - pr.head.rotation.y) * Math.min(1, dt * 5);
    pr.head.rotation.x = p.talkT > 0 ? Math.sin(t * 6) * 0.05 : 0;
  }

  let rr = 0;
  const peopleTick = (dt) => {
    if (!people.length) return;
    const pp = playerPos(), cam = AF.camera.position;
    const night = isNight();
    rr++;
    for (let i = 0; i < people.length; i++) {
      const p = people[i];
      const dc = Math.hypot(p.x - cam.x, p.z - cam.z);
      const far = dc > 90, hide = dc > (AF.MOBILE ? 70 : 150);
      if (hide !== !p.root.visible) p.root.visible = !hide;
      if (dc < 140 && p.parts.torso.layers.mask !== 1) p.root.traverse((o) => { if (o.isMesh && o.layers.mask !== 1) o.layers.set(0); });   // workaround: AF.CULL never restores layer 31 (unsigned mask compare)
      p.visible = !hide;
      // low-rate update for far residents
      let pdt = dt;
      if (far) { p.acc += dt; if ((i + rr) % 8) continue; pdt = p.acc; p.acc = 0; }
      else if (p.acc) { pdt += p.acc; p.acc = 0; }
      const dP = Math.hypot(pp.x - p.x, pp.z - p.z);
      p.face = null;
      if (p.talkT > 0) { p.talkT -= pdt; p.face = Math.atan2(pp.x - p.x, pp.z - p.z); if (p.pose !== 'sit' && p.state !== 'work') p.tyaw = p.face; }
      else if (dP < 5 && pp.walk) {
        p.face = Math.atan2(pp.x - p.x, pp.z - p.z);
        if (p.waveCd <= 0 && dP < 4.5) { p.waveT = 1.4; p.waveCd = 25 + p.rnd() * 20; if (p.state === 'idle' && p.pose !== 'sit') p.tyaw = p.face; }
      }
      if (p.waveCd > 0) p.waveCd -= pdt;
      let moving = false, sp = 0;
      const J = p.job;
      if (p.talkT <= 0) {
        if (p.state === 'walk') { sp = stepWalk(p, pdt); moving = true; }
        else if (J.type === 'walker') {
          p.wait -= pdt;
          if (p.homeRest && !night) p.wait = Math.min(p.wait, p.rnd() * 20);
          if (night && !p.homeRest && p.wait > 5) p.wait = 5;
          if (p.wait <= 0) { if (p.pose === 'sit') { setPose(p, 'stand'); p.y = standY(p.x, p.z, p.spot ? (p.spot.y ?? 0.25) : 0.25); } p.homeRest = false; walkerNext(p); }
        } else if (J.type === 'wander') {
          p.wait -= pdt;
          if (p.wait <= 0) {
            const R = J.rect; let x = p.x, z = p.z;
            const A = J.avoid; for (let k = 0; k < 6; k++) { const tx = AF.lerp(R[0], R[2], p.rnd()), tz = AF.lerp(R[1], R[3], p.rnd()); if (A) { const dx = tx - p.x, dz = tz - p.z, L2 = dx * dx + dz * dz || 1, u = Math.max(0, Math.min(1, ((A.x - p.x) * dx + (A.z - p.z) * dz) / L2)); if (Math.hypot(p.x + dx * u - A.x, p.z + dz * u - A.z) < A.r) continue; } const gy = AF.surfaceBelow(tx, tz, p.y + 1.5, 3); if (Math.abs(gy - p.y) < 0.6 && !AF.boxBlocked(tx, gy, tz, 0.25, 1.1)) { x = tx; z = tz; break; } }
            p.speed = (p.rnd() < 0.5 ? 2.6 : 1.4) + p.rnd() * 0.6;
            goTo(p, [[x, z]], () => { p.wait = 0.5 + p.rnd() * 3.5; });
          }
        } else if (J.type === 'follow') {
          const Ld = J.leader, ry = Ld.yaw, rx = Math.cos(ry), rz = -Math.sin(ry);
          let tx = Ld.x - rx * 0.62, tz = Ld.z - rz * 0.62;
          if (Ld.pose === 'sit' || Ld.state !== 'walk') { if (AF.boxBlocked(tx, p.y + 0.3, tz, 0.22, 1.2)) { tx = Ld.x - Math.sin(ry) * 0.8; tz = Ld.z - Math.cos(ry) * 0.8; } }
          const dx = tx - p.x, dz = tz - p.z, d = Math.hypot(dx, dz);
          if (d > 6) { p.x = tx; p.z = tz; }
          else if (d > 0.06 && !AF.boxBlocked(p.x + dx / d * 0.3, p.y + 0.3, p.z + dz / d * 0.3, 0.2, 1.2)) { sp = Math.min(d / Math.max(pdt, 1e-3), Math.max(Ld.speed, p.speed) * 1.25); const st = Math.min(d, sp * pdt); p.x += dx / d * st; p.z += dz / d * st; moving = d > 0.12; p.tyaw = moving ? Math.atan2(dx, dz) : Ld.yaw; }
          else if (Ld.state === 'walk') p.tyaw = Ld.yaw;
          if (Ld.state !== 'walk' && d < 0.12) p.tyaw = Math.atan2(Ld.x - p.x, Ld.z - p.z);
          const gy = AF.surfaceBelow(p.x, p.z, p.y + 0.6, 3); if (Number.isFinite(gy)) p.y += (gy - p.y) * Math.min(1, pdt * 14);
        } else if (J.type === 'farm') {
          p.wait -= pdt;
          if (p.wait <= 0) { const s = J.spots[Math.floor(p.rnd() * J.spots.length)]; goTo(p, [[s.x, s.z]], () => { p.state = 'work'; p.wait = 8 + p.rnd() * 20; p.tyaw = s.yaw || p.tyaw; }); }
        }
      }
      // separation from other walkers (cheap: only walkers near the camera)
      if (moving && !far) {
        for (let j = 0; j < people.length; j++) {
          if (j === i) continue; const q = people[j]; if (q === p.partner || (p.job.leader === q)) continue; const ox = p.x - q.x, oz = p.z - q.z; if (Math.abs(ox) > 0.7 || Math.abs(oz) > 0.7) continue;
          const od = Math.hypot(ox, oz); if (od > 0.01 && od < 0.6) { p.x += ox / od * (0.6 - od) * 0.5; p.z += oz / od * (0.6 - od) * 0.5; }
        }
      }
      // yaw
      const turn = AF.angDiff(p.yaw, p.tyaw); p.yaw += turn * Math.min(1, pdt * (moving ? 10 : 5));
      p.root.position.set(p.x, p.y, p.z); p.root.rotation.y = p.yaw;
      if (!far) animate(p, pdt, moving, sp);
      const it = p.interact; it.x = p.x; it.y = p.y + 1.0; it.z = p.z;
    }
  };
  AF.onTick('people', 300, peopleTick);
  K.tick = peopleTick;

  // ============================================================ v2: CROWD (instanced ambient walkers) + EXTRAS (instanced people at spots)
  // One InstancedMesh per (look variant x frame). Walk = 4-frame cycle (stride A, pass, stride B, pass). Extras reuse the pass frame
  // plus 'sit' and 'work' frames. Meshes with no instances are hidden, so draw calls = populated (variant, frame) pairs only.
  const CR = K.crowd = { walkers: [], extras: [], V: [], stats: {}, on: true };
  const mergeParts = (parts) => {
    let nv = 0, ni = 0; for (const [g] of parts) { nv += g.attributes.position.count; ni += g.index.count; }
    const P = new Float32Array(nv * 3), U = new Int16Array(nv * 2), Lp = new Uint16Array(nv), N = new Uint8Array(nv), I = nv > 65535 ? new Uint32Array(ni) : new Uint16Array(ni);
    let vo = 0, io = 0; const v = new THREE.Vector3();
    for (const [g, M] of parts) {
      const pa = g.attributes.position, c = pa.count;
      for (let i = 0; i < c; i++) { v.fromBufferAttribute(pa, i).applyMatrix4(M); P[(vo + i) * 3] = v.x; P[(vo + i) * 3 + 1] = v.y; P[(vo + i) * 3 + 2] = v.z; }
      U.set(g.attributes.aBU.array, vo * 2); Lp.set(g.attributes.aPal.array, vo); N.set(g.attributes.aAN.array, vo);
      const gi = g.index.array; for (let k = 0; k < gi.length; k++) I[io + k] = gi[k] + vo;
      vo += c; io += gi.length;
    }
    const out = new THREE.BufferGeometry();
    out.setAttribute('position', new THREE.BufferAttribute(P, 3)); out.setAttribute('aBU', new THREE.BufferAttribute(U, 2));
    out.setAttribute('aPal', new THREE.BufferAttribute(Lp, 1)); out.setAttribute('aAN', new THREE.BufferAttribute(N, 1));
    out.setIndex(new THREE.BufferAttribute(I, 1)); out.computeBoundingSphere(); out.computeBoundingBox();
    return out;
  };
  // pose a built person and bake it to one geometry
  function bakePose(L, pose) {
    const pr = buildPerson(L);
    const running = pose === 'runA' || pose === 'runB';
    const k = pose === 'a' || pose === 'runA' ? 1 : pose === 'b' || pose === 'runB' ? -1 : 0, A = running ? 0.85 : L.gait ?? (L.plan === 'kid' ? 0.62 : 0.5);
    pr.legL.rotation.x = k * A; pr.legR.rotation.x = -k * A;
    pr.armL.rotation.x = -k * A * 0.8; pr.armR.rotation.x = L.propR === 'cane' || L.propR === 'briefcase' ? k * 0.15 : k * A * 0.8;
    if (pose === 'p') pr.body.position.y = 0.03;
    if (running) pr.hips.rotation.x = 0.1;
    if (pose === 'sit') { pr.legL.geometry = pr.legBG; pr.legR.geometry = pr.legBG; pr.armR.rotation.x = -0.55; pr.armL.rotation.x = -0.5; pr.hips.rotation.x = -0.02; }
    if (pose === 'work') { pr.armR.rotation.x = -1.0; pr.armL.rotation.x = -0.75; pr.hips.rotation.x = 0.06; }
    if (pose === 'hail') { pr.armR.rotation.x = -2.7; pr.armR.rotation.z = -0.2; }
    if (pose === 'phone') {
      pr.armL.rotation.x = -1.65; pr.head.rotation.x = 0.35;
      const handset = new AF.Model(2, 4, 1); handset.box(0, 0, 0, 2, 4, 1, ck(0x252a2e)); handset.box(0, 1, 0, 2, 3, 1, ck(0xb0c9cf));
      const device = mesh(geo('crowd-phone', () => handset, [0.5, 1, 0.5]), false); device.position.set(0, -pr.B.ah * VS, 0.1); pr.armL.add(device);
    }
    if (pose === 'chat') { pr.armR.rotation.x = -0.6; pr.armR.rotation.z = -0.3; pr.head.rotation.y = 0.35; }
    if (pose === 'look') { pr.head.rotation.y = -0.6; pr.hips.rotation.z = 0.035; }
    // hand-holding: the inner arm reaches sideways toward the partner and does not swing
    if (L.hold === 'L') { pr.armL.rotation.x = -0.08; pr.armL.rotation.z = L.holdZ; }
    if (L.hold === 'R') { pr.armR.rotation.x = -0.08; pr.armR.rotation.z = -L.holdZ; }
    const parts = [];
    if (L.chair) { pr.root.position.y = 8 * VS - pr.hipY; parts.push([chairGeo(), new THREE.Matrix4()]); }
    pr.root.updateMatrixWorld(true);
    pr.root.traverse((o) => { if (o.isMesh) parts.push([o.geometry, o.matrixWorld.clone()]); });
    return mergeParts(parts);
  }
  let chairG = null;
  function chairGeo() {
    if (chairG) return chairG;
    const m = new AF.Model(16, 15, 14), fr = ck(0x9aa0aa, 0.05, 0.1), tyre = ck(0x1c1c1e, 0.05, 0.05), seat = ck(0x2c3a5a, 0.1), cx = 7;
    for (const x of [0, 15]) for (let y = 0; y < 11; y++) for (let z = 0; z < 11; z++) { const d = Math.hypot(y - 5, z - 5); if (d <= 5.2 && d >= 4.1) m.set(x, y, z, tyre); else if (d < 0.8 || ((y === 5 || z === 5) && d < 4.1)) m.set(x, y, z, fr); }
    m.box(1, 7, 2, 15, 8, 11, seat); m.box(2, 8, 1, 14, 15, 2, seat);
    for (const x of [1, 14]) { m.box(x, 0, 12, x + 1, 8, 13, fr); m.box(x, 8, 1, x + 1, 15, 2, fr); m.set(x, 0, 12, tyre); m.box(x, 11, 2, x + 1, 12, 9, fr); }
    m.box(cx - 3, 1, 12, cx + 5, 2, 14, fr); m.box(1, 14, 0, 3, 15, 1, tyre); m.box(13, 14, 0, 15, 15, 1, tyre);
    return (chairG = AF.meshModel(m, { vs: VS, anchor: [0.5, 0, 0.45] }));
  }
  // crowd looks: autumn 1936 street wear, >= 65% hats, a few sailors in whites (HARBOUR DAYS)
  function crowdLooks() {
    const r = AF.rng(1936), out = [];
    const man = (o) => { const L = makeLook('shopper', 'm', o.age || 'adult', r); return Object.assign(L, o.set || {}); };
    const wom = (o) => { const L = makeLook('shopper', 'f', o.age || 'adult', r); return Object.assign(L, o.set || {}); };
    const coat = (col, len = 6) => ({ col, len, flare: 0, open: true });
    out.push(man({ set: { top: { style: 'suit', col: 0x45464b, tie: 0x9a2f2f, cuffs: true }, bottom: { style: 'pants', col: 0x45464b, cuff: true }, hat: 'fedora', hatCol: 0x5a4a3a, hatCol2: 0x2a2522, propR: 'briefcase', skirt: null, apron: null } }));
    out.push(man({ set: { top: { style: 'suit', col: 0xc19a62, col2: 0x8a6a40, tie: 0x2f5a9a, cuffs: true }, skirt: coat(0xc19a62), bottom: { style: 'pants', col: 0x5a4a3a, cuff: true }, hat: 'fedora', hatCol: 0x6a5a45, hatCol2: 0x2a2522, propR: 'paper', apron: null } }));
    out.push(wom({ set: { top: { style: 'dress', col: 0xb3342c, col2: 0x7a2630, col3: 0xf3f0e6 }, hat: 'cloche', hatCol: 0x3a2a30, hatCol2: 0x7a2630, propR: 'purse', purseCol: 0x2a2320, lipstick: true } }));
    out.push(wom({ set: { top: { style: 'cardigan', col: 0x2c3a5a, col2: 0x1c2438, col3: 0xf3e7c8 }, hat: 'pillbox', hatCol: 0xb3342c, hatCol2: 0x7a2630, propR: 'bag', lipstick: true } }));
    out.push(man({ set: { top: { style: 'sweater', col: 0x6a4a32, col2: 0xefe6cf }, bottom: { style: 'pants', col: 0x8a8a86, cuff: true }, hat: 'flatcap', hatCol: 0x6a6258, skirt: null, apron: null, propR: null } }));
    out.push(man({ set: { top: { style: 'shirt', col: 0xf3f0e6 }, bottom: { style: 'pants', col: 0xf3f0e6 }, hat: 'paper', hatCol: 0xf6f4ee, hatCol2: 0xf6f4ee, sash: 0x1f2a44, skirt: null, apron: null, propR: null, moustache: false, beard: false } }));
    out.push(wom({ set: { top: { style: 'blouse', col: 0xefe6cf, brooch: true }, hat: 'beret', hatCol: 0x3d6446, propR: 'purse', purseCol: 0x6a4424 } }));
    out.push(man({ age: 'elder', set: { top: { style: 'suit', col: 0x3a3a44, tie: 0x6a3b5c, cuffs: true }, skirt: coat(0x2a2a30, 7), bottom: { style: 'pants', col: 0x3a3a44 }, hat: 'fedora', hatCol: 0x1f1d1c, hatCol2: 0x1f1d1c, propR: 'cane', moustache: true, apron: null } }));
    out.push(wom({ set: { top: { style: 'dress', col: 0x3f7f7c, col2: 0x2a5a58, col3: 0xf3f0e6, dots: true }, hat: 'straw', hatCol: 0xd8c08a, hatCol2: 0x2c3a5a, propR: null } }));
    out.push(man({ age: 'kid', set: { top: { style: 'striped', col: 0xefe6cf, col2: 0x2c3a5a, short: false }, bottom: { style: 'shorts', col: 0x6a5a45, sock: 0x8a8a86 }, hat: 'newsboy', hatCol: 0x6a6258, hatCol2: 0x4a4238, propR: null, propL: null, apron: null, skirt: null } }));
    // R2 EVENING WEAR (19:00 on): tails + top hats, gowns with fox stoles, a white dinner jacket, sailors and a naval officer on the town
    out.push(man({ set: { top: { style: 'suit', col: 0x2c3a5a, tie: 0xd1a23a, cuffs: true }, bottom: { style: 'pants', col: 0x2c3a5a, cuff: true }, hat: 'fedora', hatCol: 0x8a8a86, hatCol2: 0x2a2a30, propR: 'paper', skirt: null, apron: null, glasses: 'gold' } }));
    out.push(wom({ set: { top: { style: 'cardigan', col: 0xc19a62, col2: 0x8a6a40, col3: 0x6a4a32 }, skirt: { col: 0xc19a62, len: 8, flare: 1, hem: true }, bottom: { style: 'skirt', col: 0xc19a62 }, hat: 'cloche', hatCol: 0x6a4424, hatCol2: 0x3a2a20, propR: 'bag', lipstick: true } }));
    out.push(wom({ set: { top: { style: 'dress', col: 0x3d6446, col2: 0x2a4a32, col3: 0xefe6cf }, skirt: coat(0x3d6446, 7), hat: 'beret', hatCol: 0x7a2630, propR: 'purse', purseCol: 0x2a2320 } }));
    out.push(man({ set: { top: { style: 'vest', col: 0x6f7340, sleeve: 0xf3f0e6, tie: 0x7a2630, chain: true }, bottom: { style: 'pants', col: 0x6f7340, cuff: true }, hat: 'flatcap', hatCol: 0x5a5a55, skirt: null, apron: null, propR: null } }));
    out.push(wom({ age: 'elder', set: { top: { style: 'cardigan', col: 0xb7a0cf, col2: 0xf3f0e6, col3: 0xf3f0e6 }, skirt: { col: 0x6a3b5c, len: 8, flare: 1, pleats: true }, bottom: { style: 'skirt', col: 0x6a3b5c }, hairStyle: 'bun', glasses: 'gold', hat: null, propR: 'bag' } }));
    out.push(wom({ set: { top: { style: 'blouse', col: 0xf3f0e6, brooch: true }, skirt: { col: 0x2c3a5a, len: 7, flare: 1, pleats: true }, bottom: { style: 'skirt', col: 0x2c3a5a }, hat: 'straw', hatCol: 0xd8c08a, hatCol2: 0xb3342c, propR: null } }));
    out.push(man({ set: { top: { style: 'plaid', col: 0xb0592c, col2: 0x2a2a2a }, bottom: { style: 'pants', col: 0x3e5f8a, cuff: true }, hat: 'flatcap', hatCol: 0x6a6258, skirt: null, apron: null, propR: 'paper', beard: true } }));
    out.push(man({ age: 'teen', set: { top: { style: 'letterman', col: 0x3d6446, col2: 0xf3e7c8, col3: 0xf3e7c8, sleeve: 0xf3e7c8 }, bottom: { style: 'pants', col: 0x3e5f8a, cuff: true }, hat: null, skirt: null, apron: null, propR: 'book' } }));
    for (let index = 0; index < out.length; index++) {
      const L = out[index]; L.gait = 0.36 + r() * 0.28;
      if (index % 4 === 0) { L.top.col = pick(r, CL); L.bottom.col = pick(r, CL); }
      if (index % 5 === 0) { L.hat = null; L.hairStyle = L.female ? 'ponytail' : 'curly'; }
      if (index % 6 === 0) L.newsbag = true;
    }
    CR.nDay = out.length;
    const gown = (col, hat, hatCol, stole) => wom({ set: { top: { style: 'dress', col, col2: shade(col, 0.7), col3: stole || 0xc8844a }, skirt: { col, len: 10, flare: 1, hem: true }, bottom: { style: 'skirt', col }, hat, hatCol, hatCol2: 0x1c1c20, propR: 'purse', purseCol: 0xd8b84a, lipstick: true, hairStyle: 'wavy', apron: null } });
    out.push(man({ set: { top: { style: 'suit', col: 0x1c1c22, tie: 0xf6f4ee, cuffs: true }, bottom: { style: 'pants', col: 0x1c1c22 }, hat: 'tophat', hatCol: 0x141418, hatCol2: 0x2a2a30, propR: 'cane', skirt: null, apron: null, moustache: true } }));
    out.push(gown(0x8a1c2a, 'pillbox', 0x1c1c20, 0xd8a868));
    out.push(man({ set: { top: { style: 'suit', col: 0xf1ede2, tie: 0x141418, cuffs: true }, bottom: { style: 'pants', col: 0x1c1c22 }, hat: 'fedora', hatCol: 0x1c1c22, hatCol2: 0x141418, skirt: null, apron: null, propR: null } }));
    out.push(gown(0x1f5a44, 'cloche', 0x141418, 0xe8e0d0));
    out.push(man({ set: { top: { style: 'shirt', col: 0xf3f0e6 }, bottom: { style: 'pants', col: 0xf3f0e6 }, hat: 'paper', hatCol: 0xf6f4ee, hatCol2: 0xf6f4ee, sash: 0x1f2a44, skirt: null, apron: null, propR: null } }));
    out.push(man({ set: { top: { style: 'suit', col: 0x1f2a44, tie: 0x141418, cuffs: true }, bottom: { style: 'pants', col: 0x1f2a44 }, hat: 'conductor', hatCol: 0xf6f4ee, hatCol2: 0x1c1c20, skirt: null, apron: null, propR: null } }));
    out.push(gown(0xc8c4d0, null, null, 0xf6f4ee));
    out.push(man({ set: { top: { style: 'suit', col: 0x2a2a30, tie: 0x8a1c2a, cuffs: true }, skirt: coat(0x6a5a48, 7), bottom: { style: 'pants', col: 0x2a2a30 }, hat: 'fedora', hatCol: 0x2a2522, hatCol2: 0x141418, propR: null, apron: null } }));
    out.push(gown(0x3a1f4a, 'cloche', 0x3a1f4a, 0xe8e0d0));
    out.push(man({ set: { top: { style: 'suit', col: 0x1c1c22, tie: 0xf6f4ee, cuffs: true }, skirt: coat(0x141418, 7), bottom: { style: 'pants', col: 0x1c1c22 }, hat: 'tophat', hatCol: 0x141418, hatCol2: 0x6a1c24, propR: null, apron: null } }));
    CR.nEve = out.length;
    // group + rare looks (never swapped day/night): hand-holding couples, parent + child, wheelchair users, teen friends
    const SP = CR.SP = {};
    const sp = (name, L, o) => { Object.assign(L, o); SP[name] = out.length; out.push(L); };
    const hands = (side, z) => side === 'L' ? { hold: 'L', holdZ: z, propL: null } : { hold: 'R', holdZ: z, propR: null };
    sp('coupleM', man({ set: { top: { style: 'suit', col: 0x6a4a32, tie: 0xd1a23a, cuffs: true }, bottom: { style: 'pants', col: 0x6a4a32, cuff: true }, hat: 'fedora', hatCol: 0x3a3a40, hatCol2: 0x2a2522, skirt: null, apron: null } }), hands('L', 0.2));
    sp('coupleF', wom({ set: { top: { style: 'dress', col: 0xe79aa8, col2: 0xd06a7c, col3: 0xf3f0e6, dots: true }, skirt: { col: 0xe79aa8, len: 7, flare: 2, hem: true }, bottom: { style: 'skirt', col: 0xe79aa8 }, hat: null, lipstick: true, hairStyle: 'wavy' } }), hands('R', 0.2));
    sp('mom', wom({ set: { top: { style: 'cardigan', col: 0x3f7f7c, col2: 0x2a5a58, col3: 0xf3f0e6 }, skirt: { col: 0x45464b, len: 7, flare: 1 }, bottom: { style: 'skirt', col: 0x45464b }, hat: 'pillbox', hatCol: 0x3f7f7c, propR: 'bag' } }), hands('L', 0.32));
    sp('girl', wom({ age: 'kid', set: { top: { style: 'dress', col: 0xf0dc7a, col2: 0xc8b050, col3: 0xf3f0e6, short: true }, skirt: { col: 0xf0dc7a, len: 3, flare: 1 }, bottom: { style: 'skirt', col: 0xf0dc7a, sock: 0xf6f2ea }, hairStyle: 'pigtails', ribbon: 0xd0404a, hat: null, propR: null } }), hands('R', 1.2));
    sp('dad', man({ set: { top: { style: 'sweater', col: 0x2c3a5a, col2: 0xefe6cf, argyle: true }, bottom: { style: 'pants', col: 0xa99c6f, cuff: true }, hat: 'flatcap', hatCol: 0x6a6258, skirt: null, apron: null, propR: null } }), hands('L', 0.32));
    sp('boy', man({ age: 'kid', set: { top: { style: 'striped', col: 0xf3f0e6, col2: 0xb3342c, short: true }, bottom: { style: 'shorts', col: 0x2c3a5a, sock: 0xf3f0e6 }, hat: 'baseball', hatCol: 0x2c3a5a, hatCol2: 0x1f1d1c, propL: null, apron: null, skirt: null } }), hands('R', 1.2));
    sp('chairM', man({ age: 'elder', set: { top: { style: 'cardigan', col: 0x6a4a32, col2: 0x3a2a20, col3: 0xf3f0e6 }, bottom: { style: 'pants', col: 0x45464b }, hat: 'flatcap', hatCol: 0x5a5a55, skirt: null, apron: null, propR: null, propL: null } }), { chair: true });
    sp('chairF', wom({ set: { top: { style: 'blouse', col: 0x86b3d6, brooch: true }, skirt: { col: 0x2c3a5a, len: 6, flare: 1 }, bottom: { style: 'skirt', col: 0x2c3a5a }, hat: null, propR: null, propL: null } }), { chair: true });
    sp('teenF', wom({ age: 'teen', set: { top: { style: 'cardigan', col: 0xe79aa8, col2: 0xf3f0e6, col3: 0xf3f0e6 }, skirt: { col: 0x86b3d6, len: 5, flare: 3, poodle: true }, bottom: { style: 'skirt', col: 0x86b3d6, sock: 0xf6f2ea }, hat: null, propR: null } }));
    sp('teenM', man({ age: 'teen', set: { top: { style: 'letterman', col: 0x7a2630, col2: 0xf3e7c8, col3: 0xf3e7c8, sleeve: 0xf3e7c8 }, bottom: { style: 'pants', col: 0x3e5f8a, cuff: true }, hat: null, skirt: null, apron: null, propR: null } }));
    sp('teenM2', man({ age: 'teen', set: { top: { style: 'shirt', col: 0xf3f0e6, short: true }, bottom: { style: 'pants', col: 0x45464b, cuff: true }, hat: 'newsboy', hatCol: 0x6a6258, hatCol2: 0x4a4238, skirt: null, apron: null, propR: null } }));
    // the beat cop (77-combat's police pool): navy tunic, peaked cap, a revolver in the right hand
    sp('cop', man({ set: { top: { style: 'suit', col: 0x1f2a44, tie: 0x141418, cuffs: true }, bottom: { style: 'pants', col: 0x1f2a44 }, hat: 'conductor', hatCol: 0x1f2a44, hatCol2: 0x141418, skirt: null, apron: null, propR: null, moustache: true } }), { cop: true });
    for (const L of out) { if (L.skirt === null) delete L.skirt; if (!L.bottom) L.bottom = { style: 'pants', col: 0x45464b }; if (L.skirt && L.bottom.style !== 'skirt' && !L.skirt.open) L.bottom = { style: 'skirt', col: L.skirt.col }; }
    return out;
  }
  const FRAMES = ['a', 'p', 'b', 'sit', 'work', 'phone', 'chat', 'look', 'hail', 'runA', 'runB'];
  const WALK_FRAMES = ['a', 'p', 'b', 'p'], COP_FRAMES = new Set(['a', 'p', 'b', 'work', 'hail', 'runA', 'runB']);
  // which baked frames a look gets (draw calls = populated look x frame pairs, so rare frames go to a few looks only)
  const wantFrame = (vi, V, L, f) => {
    if (L.cop) return COP_FRAMES.has(f);
    if ((f === 'runA' || f === 'runB') && (vi % 6 !== 0 || vi >= CR.nEve || V.kid || L.plan === 'elder')) return false;
    if ((f === 'phone' || f === 'hail') && (vi % 6 !== 0 || vi >= CR.nEve || V.kid)) return false;
    if ((f === 'chat' || f === 'look') && (V.chair || (vi < CR.nEve && vi % 4 !== 0))) return false;
    if ((V.kid || vi >= CR.nEve) && (f === 'sit' || f === 'work')) return false;
    if (V.chair && f !== 'p') return false;
    return !(vi >= CR.nEve && f === 'b');   // group looks walk on two frames (a / pass) to keep draw calls down
  };
  function buildCrowdMeshes() {
    const looks = crowdLooks(), tier = AF.GFX && AF.GFX.tier;
    // fewer ambient walkers than v2 (the game layer adds fights, cops and jobs on top): 70 / 140 / 170
    const NW = tier === 'low' ? 70 : tier === 'high' ? 140 : 170, NE = tier === 'low' ? 90 : 220;
    CR.NW = NW; CR.NE = NE;
    for (let vi = 0; vi < looks.length; vi++) {
      const L = looks[vi], kid = L.plan === 'kid', V = { L, im: {}, hipY: PLANS[L.plan].lh * VS, kid, chair: !!L.chair, cop: !!L.cop };
      for (const f of FRAMES) {
        if (!wantFrame(vi, V, L, f)) continue;
        const g = bakePose(L, V.chair ? 'sit' : f), cap = V.cop ? 12 : f === 'sit' || f === 'work' ? NE : vi >= CR.nEve ? 48 : (f === 'p' ? NW + NE : NW);
        const im = new THREE.InstancedMesh(g, AF.mat.voxel, cap);
        im.count = 0; im.frustumCulled = false; im.castShadow = f !== 'sit' && f !== 'work'; im.receiveShadow = true; im.visible = false; im.name = 'crowd-' + vi + f;
        im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        AF.scene.add(im); V.im[f] = im;
      }
      CR.V.push(V);
    }
    // far LOD: beyond 38 m everyone is drawn from 8 shared looks (3 walk frames each) that never cast shadows — at that range the
    // outfits read as colour blobs, and this cuts the crowd from ~110 draws (+ shadow draws) to ~24 + the few people near you
    const dayN = CR.nDay || looks.length, pickN = 8;
    CR.FAR = []; CR.farMap = CR.V.map((V, i) => (i < dayN ? i : i % dayN) % pickN);
    for (let i = 0; i < pickN; i++) {
      const V = CR.V[Math.floor(i * dayN / pickN)], F = {};
      for (const f of ['a', 'p', 'b']) {
        const src = V.im[f] || V.im.p; if (!src) continue;
        const im = new THREE.InstancedMesh(src.geometry, AF.mat.voxel, NW + NE);
        im.count = 0; im.frustumCulled = false; im.castShadow = false; im.receiveShadow = true; im.visible = false; im.name = 'crowd-far-' + i + f;
        im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); AF.scene.add(im); F[f] = im;
      }
      CR.FAR.push(F);
    }
    CR.farCnt = CR.FAR.map(() => ({ a: 0, p: 0, b: 0 }));
    CR.cnt = CR.V.map(() => ({ a: 0, p: 0, b: 0, sit: 0, work: 0, phone: 0, chat: 0, look: 0, hail: 0, runA: 0, runB: 0 }));
    CR.stats = { walkers: 0, moving: 0, extras: 0, cand: 0, draws: 0, stopped: 0 };
  }
  // ---- walkers
  const crossC = new Map();
  const isCross = (a, b) => { const k = a.i * 8192 + b.i; let c = crossC.get(k); if (c === undefined) { c = !!(a.cross && b.cross && PL.onRoad((a.x + b.x) / 2, (a.z + b.z) / 2)); crossC.set(k, c); crossC.set(b.i * 8192 + a.i, c); } return c; };
  let candEdges = [], candAt = { x: 1e9, z: 1e9 };
  // R2 PROMENADES (crowd only, not used by resident routing): the boardwalk, the quay front, Harbour Square and the piers.
  // Nodes carry their own deck height (py) because piers / boardwalk planks are voxels above the heightmap.
  const PROM = [];
  function buildPromenades() {
    const CZ = (PL.harbour && PL.harbour.coastZ) || 210, piers = (PL.harbour && PL.harbour.piers) || [];
    const pier = (id) => piers.find((q) => q.id === id);
    const lines = [[[-288, CZ - 6], [-152, CZ - 6]], [[-286, CZ - 15], [-154, CZ - 15]], [[-148, CZ - 5], [-42, CZ - 5]], [[-38, CZ - 10], [38, CZ - 10]], [[-38, CZ - 24], [38, CZ - 24]], [[44, CZ - 6], [200, CZ - 6]]];
    for (const [id, off] of [['pleasure', 0.3], ['pleasure', 0.7], ['fish', 0.5], ['ferry', 0.3], ['ferry', 0.7]]) { const q = pier(id); if (q) { const x = q.x0 + (q.x1 - q.x0) * off; lines.push([[x, CZ + 3], [x, q.z1 - 4]]); } }
    // zoo visitors: the promenade, the cross walk, the plains divider and the side walks
    if (PL.west && PL.west.zoo) lines.push([[-549, -26], [-549, -278]], [[-543, -26], [-543, -278]], [[-636, -162], [-458, -162]], [[-636, -145.5], [-462, -145.5]], [[-599, -144], [-599, -30]], [[-636, -85], [-566, -85]], [[-490, -144], [-490, -30]], [[-490, -162], [-490, -278]], [[-598, -162], [-598, -278]], [[-556.5, -144], [-556.5, -30]], [[-636, -25.5], [-458, -25.5]]);
    let k = 0;
    for (const [[x0, z0], [x1, z1]] of lines) {
      const L = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(L / 6)), dx = (x1 - x0) / L, dz = (z1 - z0) / L;
      let prev = null;
      for (let i = 0; i <= n; i++) {
        const bx = x0 + (x1 - x0) * i / n, bz = z0 + (z1 - z0) * i / n; let got = null;
        for (const o of [0, 1, -1, 2, -2, 3, -3]) {
          const x = bx - dz * o, z = bz + dx * o, y = AF.surfaceBelow(x, z, 1.6, 4);
          if (!Number.isFinite(y) || y < -0.3 || y > 1.4) continue;
          if (AF.boxBlocked(x, y + 0.3, z, 0.3, 1.3)) continue;
          got = { i: 60000 + k++, x, z, py: y, adj: [], rw: 20, rn: 'Promenade' }; break;
        }
        if (got && prev && Math.abs(got.py - prev.py) < 0.6) { const d = Math.hypot(got.x - prev.x, got.z - prev.z); prev.adj.push({ n: got, d }); got.adj.push({ n: prev, d }); PROM.push([prev, got]); }
        prev = got;
      }
    }
    CR.promEdges = PROM.length;
  }
  const crowdView = { x: 0, z: 0, R: 120 }, crowdPlayer = { x: 0, z: 0, walk: false };
  function crowdCentre() {
    const c = AF.camera.position;
    const focus = c.y > 25 && AF.shadowFocus ? AF.shadowFocus : c;
    crowdView.x = focus.x; crowdView.z = focus.z; crowdView.R = (focus === c ? 100 : 130) * (AF.MOBILE ? 0.6 : 1);
    return crowdView;
  }
  function refreshCand(C) {
    candEdges = []; candAt = { x: C.x, z: C.z };
    for (const [a, b] of (PROM.length ? G.edges.concat(PROM) : G.edges)) {
      const mx = (a.x + b.x) / 2, mz = (a.z + b.z) / 2, d = Math.hypot(mx - C.x, mz - C.z);
      if (d > C.R) continue;
      const main = Math.min(a.rw || 10, b.rw || 10) >= 14 || /Grand|Meridian|Park Row|Harbour Boulevard/.test(a.rn || '');
      const gww = CR.night && /Grand/.test(a.rn || '') && mz > 4 && mz < 165;   // the Great White Way after dark
      const len = Math.hypot(b.x - a.x, b.z - a.z), busy = main || mz > 170;
      const wgt = Math.max(1, Math.round(len / (CR.night ? gww ? 9 : 26 : busy ? 12 : 21)));
      if (isCross(a, b)) continue;
      for (let k = 0; k < wgt; k++) candEdges.push(a.i < b.i ? [a, b] : [b, a]);
    }
  }
  const wr = AF.rng(4242);
  // crowd density per 9 m cell (rebuilt each tick): spawns and turns avoid cells that are already busy
  const dens = new Map(), flows = new Map(), DCAP = 3;
  const flowKey = (a, b) => Math.min(a.i, b.i) * 100000 + Math.max(a.i, b.i);
  const flowSign = (a, b) => a.i < b.i ? 1 : -1;
  const cellK = (x, z) => (Math.floor(x / 9) + 500) * 4000 + Math.floor(z / 9) + 500;
  const densAt = (x, z) => dens.get(cellK(x, z)) || 0;
  function spawnWalker(w, C, farOnly) {
    if (w.bench && CR.benchTaken) CR.benchTaken.delete(w.bench);
    if (!candEdges.length) { w.act = false; return; }
    let edge = null, start = 0;
    for (let attempt = 0; attempt < 24; attempt++) {
      const candidate = candEdges[Math.floor(wr() * candEdges.length)], phase = wr();
      const x = candidate[0].x + (candidate[1].x - candidate[0].x) * phase, z = candidate[0].z + (candidate[1].z - candidate[0].z) * phase;
      if (farOnly && Math.hypot(x - C.x, z - C.z) < C.R * 0.55) continue;
      if (densAt(x, z) + 1 + (w.nf || 0) > DCAP) continue;
      edge = candidate; start = phase; break;
    }
    if (!edge) { w.act = false; return; }
    const key = flowKey(edge[0], edge[1]), balance = flows.get(key) || 0, fw = balance ? balance * flowSign(edge[0], edge[1]) < 0 : wr() < 0.5;
    w.A = fw ? edge[0] : edge[1]; w.B = fw ? edge[1] : edge[0];
    flows.set(key, balance + flowSign(w.A, w.B));
    w.len = Math.hypot(w.B.x - w.A.x, w.B.z - w.A.z) || 0.1; w.d = (fw ? start : 1 - start) * w.len;
    w.x = w.A.x + (w.B.x - w.A.x) * w.d / w.len; w.z = w.A.z + (w.B.z - w.A.z) * w.d / w.len;
    w.yaw = Math.atan2(w.B.x - w.A.x, w.B.z - w.A.z); w.act = true; w.wait = 0; w.pend = null; w.state = 'walk'; w.bench = null; w.decide = 0.5 + wr() * 2;
    const V = CR.V[w.v]; w.speed = V.chair ? 0.75 + wr() * 0.15 : V.L.plan === 'elder' ? 0.9 + wr() * 0.2 : V.kid ? 1.3 + wr() * 0.3 : 0.9 + wr() * 0.7;
    if (!w.grp && V.im.runA && wr() < 0.2) w.speed = 2.5 + wr() * 0.5;
    const cell = cellK(w.x, w.z); dens.set(cell, (dens.get(cell) || 0) + 1 + (w.nf || 0));
  }
  function initWalkers() {
    const C = crowdCentre(); refreshCand(C);
    const nv = CR.nEve || CR.V.length;
    for (let i = 0; i < CR.NW; i++) {
      const nd = CR.nDay || nv, nn = nv - nd;
      const w = { id: i, v: (i * 7 + (i >> 3)) % nd, lat: -0.55 + wr() * 1.1, s: 0.88 + wr() * 0.24, width: 0.88 + wr() * 0.25, ph: wr() * 4, age: wr() * 20, x: 0, y: 0.25, z: 0, yaw: 0, talk: 0, name: null, state: 'walk' };
      if (CR.V[w.v].kid && wr() < 0.5) w.v = (w.v + 1) % nd;
      if (i && w.v === CR.walkers[i - 1].vd) w.v = (w.v + 1) % nd;
      w.vd = w.v; w.vn = nn > 0 ? nd + (i * 3 + (i >> 2)) % nn : w.v;
      CR.walkers.push(w);
    }
    // groups: every block of 12 walkers seeds one group; a rare wheelchair user every ~45
    const SP = CR.SP || {}, W = CR.walkers;
    const lead = (w, look, grp) => { w.v = w.vd = w.vn = SP[look]; w.grp = grp; w.lat = -0.45 + wr() * 0.2; w.s = 1; };
    const follow = (f, L, look, lat, back) => { f.lead = L; f.v = f.vd = f.vn = SP[look]; f.fl = lat; f.fb = back || 0; f.s = CR.V[SP[look]].kid ? 1 : 0.97 + wr() * 0.06; L.nf = (L.nf || 0) + 1; };
    if (SP.coupleM !== undefined) for (let i = 0, g = 0; i + 3 < W.length; i += 12, g++) {
      const a = W[i], b = W[i + 1], c = W[i + 2];
      switch (g % 6) {
        case 0: case 4: lead(a, 'coupleM', 'couple'); follow(b, a, 'coupleF', 0.72); break;
        case 1: lead(a, 'mom', 'kid'); follow(b, a, 'girl', 0.95); break;
        case 2: lead(a, 'teenM', 'friends'); follow(b, a, 'teenF', 0.8, 0.15); follow(c, a, 'teenM2', 0.35, 0.95); break;
        case 3: lead(a, 'dad', 'kid'); follow(b, a, 'boy', 0.95); break;
        case 5: b.lead = a; b.fl = 0.55; a.grp = 'armin'; a.nf = 1; b.v = b.vd = CR.V[a.v].L.female ? 0 : 2; b.vn = CR.nDay ? (CR.V[a.vn].L.female ? CR.nDay : CR.nDay + 1) : b.v; break;
      }
    }
    if (SP.chairM !== undefined) for (let i = 44, k = 0; i < W.length; i += 45, k++) { const w = W[i]; if (w.lead || w.grp) continue; w.v = w.vd = w.vn = SP[k & 1 ? 'chairF' : 'chairM']; w.grp = 'chair'; w.s = 1; }
    for (const w of W) if (!w.lead) spawnWalker(w, C, false);
    // the police pool (77-combat): 8 inactive walkers in the cop look, woken with an .agg when the wanted level calls for them
    if (SP.cop !== undefined) for (let i = 0; i < 8; i++) W.push({ id: CR.NW + i, v: SP.cop, vd: SP.cop, vn: SP.cop, cop: true, act: false, agg: null, lat: 0, s: 1, width: 1, ph: 0, age: 0, x: 0, y: 0, z: 0, yaw: 0, talk: 0, state: 'walk' });
    CR.benches = AF.spots.filter((spot) => spot.kind === 'bench' && !spotsTaken.has(spot));
    CR.benchTaken = new Set();
  }
  const E = new Float32Array(16);
  function putInst(im, i, x, y, z, yaw, s, width = 1) {
    const c = Math.cos(yaw) * s, sn = Math.sin(yaw) * s, a = im.instanceMatrix.array, o = i * 16;
    a[o] = c * width; a[o + 1] = 0; a[o + 2] = -sn * width; a[o + 3] = 0; a[o + 4] = 0; a[o + 5] = s; a[o + 6] = 0; a[o + 7] = 0;
    a[o + 8] = sn; a[o + 9] = 0; a[o + 10] = c; a[o + 11] = 0; a[o + 12] = x; a[o + 13] = y; a[o + 14] = z; a[o + 15] = 1;
  }
  // flat on the back, head away from yaw: Ry(yaw) * Rx(-90deg) (knocked down / KO'd / run over)
  function putLie(im, i, x, y, z, yaw, s) {
    const c = Math.cos(yaw) * s, sn = Math.sin(yaw) * s, a = im.instanceMatrix.array, o = i * 16;
    a[o] = c; a[o + 1] = 0; a[o + 2] = -sn; a[o + 3] = 0; a[o + 4] = -sn; a[o + 5] = 0; a[o + 6] = -c; a[o + 7] = 0;
    a[o + 8] = 0; a[o + 9] = s; a[o + 10] = 0; a[o + 11] = 0; a[o + 12] = x; a[o + 13] = y + 0.14 * s; a[o + 14] = z; a[o + 15] = 1;
  }
  const crossingAxis = [0, 0];
  function crowdGreen(A, B) {
    const lights = AF.trafficLight; if (!lights || !lights.state) return true;
    crossingAxis[0] = B.x - A.x; crossingAxis[1] = B.z - A.z;
    return lights.state((A.x + B.x) / 2, (A.z + B.z) / 2, crossingAxis) === 'green';
  }
  function crowdDecision(w, pp) {
    w.decide = 0.5 + wr() * 1.5;
    if (w.state !== 'walk' || w.wait > 0 || w.pend || isCross(w.A, w.B)) return;
    const chance = wr(), V = CR.V[w.v];
    if (chance < 0.035 && !w.grp) {
      const node = w.A; w.A = w.B; w.B = node; w.d = w.len - w.d; return;
    }
    if (chance > 0.18) return;
    w.wait = 2.5 + wr() * 5; w.state = 'idle';
    if (w.nf) { w.state = 'chat'; w.chatYaw = w.yaw; return; }
    if (!V.chair && V.im.sit && CR.benches) {
      for (const bench of CR.benches) {
        if (CR.benchTaken.has(bench) || occupied(bench, AF.time.hours) || Math.hypot(bench.x - w.x, bench.z - w.z) > 2.2 || Math.abs((bench.y ?? 0.75) - w.y) > 1) continue;
        let clear = true;
        for (let sample = 1; sample <= 4; sample++) if (AF.boxBlocked(w.x + (bench.x - w.x) * sample / 4, w.y + 0.8, w.z + (bench.z - w.z) * sample / 4, 0.2, 0.7)) { clear = false; break; }
        if (!clear) continue;
        w.bench = bench; CR.benchTaken.add(bench); w.state = 'seatApproach'; w.wait = 8 + wr() * 12; return;
      }
    }
    if (V.im.phone && chance < 0.09) w.state = 'phone';
    else if (/Grand|Meridian|Harbour/.test(w.A.rn || '') && chance < 0.13) {
      w.state = 'browse';
      const dx = (w.B.x - w.A.x) / w.len, dz = (w.B.z - w.A.z) / w.len;
      const outward = PL.onRoad(w.x + dz * 3, w.z - dx * 3) ? -1 : 1;
      w.yaw = Math.atan2(dz * outward, -dx * outward);
    } else if (V.im.hail) {
      let passer = null;
      for (const other of CR.walkers) if (other !== w && other.act && other.moving && Math.hypot(other.x - w.x, other.z - w.z) < 3) { passer = other; break; }
      if (passer || (pp.walk && Math.hypot(pp.x - w.x, pp.z - w.z) < 4)) {
        w.state = 'wave'; w.wait = 1.5; w.yaw = Math.atan2((passer || pp).x - w.x, (passer || pp).z - w.z);
      }
    }
  }
  function stepWalker(w, dt, pp, near = true) {
    w.age += dt;
    if (w.lead) {   // group member: keep station beside / behind the leader
      const L = w.lead, heading = L.state === 'chat' ? L.chatYaw : L.yaw, c = Math.cos(heading), sn = Math.sin(heading), lat = w.fl ?? 0.55, bk = w.fb || 0;
      w.x = L.x + c * lat - sn * bk; w.z = L.z - sn * lat - c * bk; w.yaw = L.state === 'chat' ? Math.atan2(L.x - w.x, L.z - w.z) : L.yaw;
      w.state = L.state; w.moving = L.moving; w.ph = L.ph + 2; w.act = L.act; w.y = L.A && L.A.py !== undefined ? L.y : AF.W.groundY(w.x, w.z); return;
    }
    if (w.talk > 0) { w.talk -= dt; w.moving = false; w.yaw = Math.atan2(pp.x - w.x, pp.z - w.z); return; }
    if (near) { w.decide -= dt; if (w.decide <= 0) crowdDecision(w, pp); }
    if (w.state === 'seatApproach' || w.state === 'seatLeave') {
      const leaving = w.state === 'seatLeave', bench = w.bench;
      const dx = (w.B.x - w.A.x) / w.len, dz = (w.B.z - w.A.z) / w.len;
      const targetX = leaving ? w.A.x + dx * w.d + dz * w.lat : bench.x, targetZ = leaving ? w.A.z + dz * w.d - dx * w.lat : bench.z;
      const distance = Math.hypot(targetX - w.x, targetZ - w.z), fraction = Math.min(1, dt * w.speed / Math.max(0.001, distance));
      w.y = AF.W.groundY(w.x, w.z); w.x += (targetX - w.x) * fraction; w.z += (targetZ - w.z) * fraction; w.moving = true; w.ph += dt * w.speed * 2.3 / w.s;
      w.yaw = Math.atan2(targetX - w.x, targetZ - w.z);
      if (distance < 0.08) {
        if (leaving) { CR.benchTaken.delete(bench); w.bench = null; w.state = 'walk'; w.wait = 0; }
        else { w.state = 'sit'; w.moving = false; w.yaw = bench.yaw || 0; w.y = (bench.y ?? 0.75) - CR.V[w.v].hipY * w.s + 0.02; }
      }
      return;
    }
    if (w.wait > 0) {
      w.wait -= dt; w.moving = false;
      if (w.state === 'chat') w.yaw = w.chatYaw + Math.PI / 2;
      if (w.state === 'sit') { if (w.wait <= 0) w.state = 'seatLeave'; return; }
      if (w.wait <= 0 && w.pend) { if (crowdGreen(w.B, w.pend.n)) { const o = w.pend; w.pend = null; w.A = w.B; w.B = o.n; w.d = 0; w.len = o.d || 0.1; } else w.wait = 0.5; }
      if (w.wait <= 0) w.state = 'walk';
    } else {
      let sp = w.speed;
      let dg = 0;
      if (pp.walk) { const ax = pp.x - w.x, az = pp.z - w.z, d2 = ax * ax + az * az, fwd = ax * Math.sin(w.yaw) + az * Math.cos(w.yaw);
        if (d2 < 1.0 && fwd > 0) sp = 0;
        else if (d2 < 7 && fwd > 0) { const side = ax * Math.cos(w.yaw) - az * Math.sin(w.yaw); dg = side > 0 ? -0.9 : 0.9; sp *= 0.8; } }   // step aside for the player
      w.dodge = (w.dodge || 0) + (dg - (w.dodge || 0)) * Math.min(1, dt * 3);
      if (near && CR.V[w.v].kid) sp *= 0.94 + Math.sin(w.age * 2.1 + w.id) * 0.06;
      w.d += sp * dt; w.moving = sp > 0; w.ph += dt * sp * 2.3 / w.s;
      if (w.d >= w.len) {
        const A = w.A, B = w.B;
        if (!B.adj.length) { w.act = false; return; }
        let choice = null, bestScore = Infinity;
        for (const option of B.adj) {
          if (option.n === A && B.adj.length > 1) continue;
          const balance = (flows.get(flowKey(B, option.n)) || 0) * flowSign(B, option.n);
          const score = densAt(option.n.x, option.n.z) + Math.max(0, balance) * 0.65 + wr() * 2;
          if (score < bestScore) { bestScore = score; choice = option; }
        }
        choice = choice || B.adj[0];
        if (isCross(B, choice.n) && !crowdGreen(B, choice.n)) { w.pend = choice; w.wait = 0.4 + wr() * 0.6; w.d = w.len; w.state = 'crossing'; }
        else { w.A = B; w.B = choice.n; w.d = 0; w.len = choice.d || 0.1; }
      }
    }
    const dx = (w.B.x - w.A.x) / w.len, dz = (w.B.z - w.A.z) / w.len, t = Math.min(w.d, w.len);
    const wander = near && !w.nf ? Math.sin(w.age * (CR.V[w.v].kid ? 1.1 : 0.36) + w.id) * 0.12 : 0;
    const cr = (isCross(w.A, w.B) ? (w.nf ? -0.3 : 0.2) : w.lat + wander) + (w.dodge || 0) * 0.35;
    const tx = w.A.x + dx * t + dz * cr, tz = w.A.z + dz * t - dx * cr;
    if (w.moving && (!near || !AF.boxBlocked(tx, w.y + 0.3, tz, 0.2, 1.2))) { w.x = tx; w.z = tz; }
    else if (w.moving) { w.d = Math.max(0, w.d - w.speed * dt); w.dodge = 0; w.lat *= -0.5; w.moving = false; }
    const ty = Math.atan2(dx, dz); if (w.moving) w.yaw += AF.angDiff(w.yaw, ty) * Math.min(1, dt * 8);
    w.y = w.A.py !== undefined ? w.A.py + (w.B.py - w.A.py) * (t / w.len) : AF.W.groundY(w.x, w.z);
  }
  // ---- extras
  const EX_NO = /^(gull|duck|pigeon|cat|dog|bird|swan|horse|bed|goose|sparrow)$/;
  let exGrid = null;
  function indexExtras() {
    exGrid = new Map();
    // R2 (coordinator 16:40): keep a 2.5 m clear zone at every registered building door (no extra blocking a doorway)
    const doors = []; for (const b of (AF.buildings || [])) for (const d of ((b && b.doors) || [])) if (d && Number.isFinite(d.x) && Number.isFinite(d.z)) doors.push(d);
    const dg = new Map(); for (const d of doors) { const k = Math.floor(d.x / 8) * 1000 + Math.floor(d.z / 8); let a = dg.get(k); if (!a) dg.set(k, a = []); a.push(d); }
    const nearDoor = (s) => { const gx = Math.floor(s.x / 8), gz = Math.floor(s.z / 8), sy = s.y ?? 0.25;
      for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) { const a = dg.get((gx + i) * 1000 + gz + j); if (a) for (const d of a) if (Math.hypot(d.x - s.x, d.z - s.z) < 2.5 && Math.abs((d.y ?? 0.25) - sy) < 1.6) return true; }
      return false; };
    let skipped = 0; const tramWaiters = !!(AF.rail && AF.rail.walkers && AF.rail.walkers.list && AF.rail.walkers.list.length);
    for (const s of AF.spots) {
      if (!s || !Number.isFinite(s.x) || !Number.isFinite(s.z) || EX_NO.test(s.kind || '')) continue;
      if (s.building === 'traffic-cop') continue;
      if (tramWaiters && s.kind === 'queue' && /^stop-/.test(s.building || '')) continue;   // 36-train's own boarding passengers stand there
      if (nearDoor(s)) { skipped++; continue; }
      const k = Math.floor(s.x / 16) * 1000 + Math.floor(s.z / 16); let a = exGrid.get(k); if (!a) exGrid.set(k, a = []); a.push(s);
    }
    CR.doorSkipped = skipped;
  }
  const hash = (s) => { const h = Math.sin((s.x * 12.9898 + s.z * 78.233 + (s.y || 0) * 37.719)) * 43758.5453; return h - Math.floor(h); };
  function occupied(s, h) {
    if (s.vendor) return true;   // kiosk + carnival staff never leave their counter
    const id = (s.building || '') + ' ' + (s.kind || ''), q = hash(s);
    if (spotsTaken.has(s) || (CR.benchTaken && CR.benchTaken.has(s))) return false;
    if (/school/.test(id)) return h >= 8 && h < 15.2 && q < 0.85;
    if (/bank|trust/.test(id)) return h >= 9 && h < 15.5 ? q < 0.85 : /work/.test(s.kind) && h < 18 && q < 0.4;
    if (/heron|rosewood|roseland|ballroom|club|bar|anchor|dance/.test(id)) return h >= 20 || h < 2 ? q < 0.95 : q < 0.45;
    if (/paramount|paragon|rialto|theatre|audience/.test(id)) return h >= 12 ? q < 0.85 : q < 0.2;
    if (/res-|home|house|apart|stoop/.test(id)) return h >= 17.5 && h < 20.5 ? q < 0.7 : h >= 7 && h < 22.5 ? q < 0.4 : false;
    if (/terminal|station|stop|platform/.test(id)) return q < 0.8;
    if (/counter|work/.test(s.kind)) return h >= 7 && h < 21 ? q < 0.9 : q < 0.25;
    return h >= 7.5 && h < 20.5 ? q < 0.7 : q < 0.25;
  }
  let exT = 0, exAt = { x: 1e9, y: 0, z: 1e9 }, exH = -1;
  function refreshExtras() {
    const c = AF.camera.position, h = AF.time.hours;
    exAt = { x: c.x, y: c.y, z: c.z }; exH = h;
    const R = 42, cand = [];
    const gx0 = Math.floor((c.x - R) / 16), gx1 = Math.floor((c.x + R) / 16), gz0 = Math.floor((c.z - R) / 16), gz1 = Math.floor((c.z + R) / 16);
    for (let gx = gx0; gx <= gx1; gx++) for (let gz = gz0; gz <= gz1; gz++) {
      const a = exGrid.get(gx * 1000 + gz); if (!a) continue;
      for (const s of a) { const d = Math.hypot(s.x - c.x, s.z - c.z, ((s.y ?? 0.25) - c.y) * 1.5); if (d < R && occupied(s, h)) cand.push([d, s]); }
    }
    cand.sort((p, q) => p[0] - q[0]);
    CR.extras.length = 0;
    const nd = CR.nDay || CR.V.length, ne = CR.nEve || CR.V.length, adults = CR.V.map((V, i) => i).filter((i) => i < nd && !CR.V[i].kid), evening = CR.V.map((V, i) => i).filter((i) => i >= nd && i < ne);
    const nightOut = (h >= 19 || h < 3) && evening.length;
    for (let i = 0; i < Math.min(cand.length, CR.NE); i++) {
      const s = cand[i][1], k = s.kind || 'stand', fancy = nightOut && k !== 'work' && k !== 'counter' && /heron|rosewood|roseland|ballroom|club|paragon|rialto|theatre|audience|dance|hotel|queue/.test((s.building || '') + ' ' + k);
      const v = fancy ? evening[Math.floor(hash(s) * 997) % evening.length] : adults[Math.floor(hash(s) * 997) % adults.length], V = CR.V[v];
      const sit = k === 'sit' || k === 'bench' || k === 'audience' || k === 'stoop' || s.stoop;
      const pose = sit ? 'sit' : k === 'work' || k === 'counter' ? 'work' : k === 'dance' ? 'dance' : 'stand';
      if (s._ey === undefined) s._ey = sit ? (s.y ?? 0.5) : standY(s.x, s.z, s.y ?? 0.25);
      CR.extras.push({ s, v, pose, x: s.x, y: sit ? s._ey - V.hipY + 0.02 : s._ey, z: s.z, yaw: s.yaw || 0, ph: hash(s) * 10 });
    }
  }
  function crowdTick(dt, t) {
    if (!CR.V.length || !CR.on) return;
    const C = crowdCentre(), pp = crowdPlayer, player = AF.player, camera = AF.camera.position;
    pp.walk = AF.mode === 'walk' && !!player && (player.x ?? (player.body && player.body.x)) != null;
    pp.x = pp.walk ? player.x ?? player.body.x : camera.x; pp.z = pp.walk ? player.z ?? player.body.z : camera.z;
    const hN = AF.time ? AF.time.hours : 12, nightW = hN >= 19.2 || hN < 5;
    if (nightW !== CR.night) { CR.night = nightW; for (const w of CR.walkers) w.v = nightW ? w.vn : w.vd; candAt.x = candAt.z = 1e9; }
    const jump = Math.hypot(C.x - candAt.x, C.z - candAt.z);
    if (jump > 25) {
      refreshCand(C);
      if (jump > 45) {
        dens.clear(); flows.clear();
        for (const w of CR.walkers) if (!w.lead && !w.cop && !w.agg) spawnWalker(w, C, false);
      }
    }
    dt = Math.min(dt, 0.1);
    const cnt = CR.cnt;
    for (const c of cnt) for (const frame of FRAMES) c[frame] = 0;
    let act = 0, mov = 0, stopped = 0, draws = 0;
    const eveningDistrict = Math.abs(C.x) < 35 && C.z > 4 && C.z < 165;
    const population = Math.floor(CR.NW * 0.85 * (hN < 5 || hN >= 23 ? 0.45 : nightW ? eveningDistrict ? 0.8 : 0.6 : hN < 8 ? 0.75 : 1));
    dens.clear(); flows.clear();
    for (const w of CR.walkers) if (w.act && !w.lead && w.id < population) {
      const cell = cellK(w.x, w.z); dens.set(cell, (dens.get(cell) || 0) + 1 + (w.nf || 0));
      const key = flowKey(w.A, w.B); flows.set(key, (flows.get(key) || 0) + flowSign(w.A, w.B));
    }
    const fr = AF.clock ? AF.clock.frame | 0 : 0, FAR2 = 65 * 65, LOOK2 = 38 * 38;
    const fc = CR.farCnt; for (const c of fc) c.a = c.p = c.b = 0;
    const CB = AF.combat;
    for (const w of CR.walkers) {
      // engaged (77-combat owns them: fleeing, fighting, down) or a cop: stepped there, always drawn at full detail
      if (w.agg) {
        if (CB && CB.stepPed(w, dt)) {
          const V = CR.V[w.v], A = w.agg; let f = A.f;
          if (!V.im[f]) f = f === 'runA' || f === 'runB' ? WALK_FRAMES[Math.floor(w.ph) & 3] : 'p';
          const im = V.im[f] || V.im.p, c = cnt[w.v];
          if (c[f] < im.instanceMatrix.count) { if (!c[f]) draws++; if (A.lie) putLie(im, c[f]++, w.x, w.y, w.z, w.yaw, w.s); else putInst(im, c[f]++, w.x, w.y + (A.dy || 0), w.z, w.yaw, w.s, w.width); }
          act++; continue;
        }
        if (CB) CB.release(w);
        if (w.cop) continue;
        if (!w.lead) spawnWalker(w, C, true);
      }
      if (w.cop) continue;
      if ((w.lead ? w.lead.id : w.id) >= population) {
        w.act = false;
        if (w.bench) { CR.benchTaken.delete(w.bench); w.bench = null; }
        continue;
      }
      if (!w.act && !w.lead) { spawnWalker(w, C, true); if (!w.act) continue; }
      // far walkers step at half rate (their accumulated dt is applied next frame)
      const ddx = w.x - C.x, ddz = w.z - C.z;
      if (!w.lead && ddx * ddx + ddz * ddz > FAR2 && ((fr + w.id) & 1)) w.acc = (w.acc || 0) + dt;
      else { stepWalker(w, Math.min(0.2, dt + (w.acc || 0)), pp, ddx * ddx + ddz * ddz <= FAR2); w.acc = 0; }
      if (!w.lead && Math.hypot(w.x - C.x, w.z - C.z) > C.R + 12) { spawnWalker(w, C, true); continue; }
      if (!w.act) continue;
      act++; if (w.moving) mov++; else stopped++;
      const V = CR.V[w.v], near = ddx * ddx + ddz * ddz <= FAR2;
      if (!V.chair && CR.FAR.length) {
        const px = w.x - camera.x, pz = w.z - camera.z;
        if (px * px + pz * pz > LOOK2) {
          const fi = CR.farMap[w.v], ff = w.moving ? WALK_FRAMES[Math.floor(w.ph) & 3] : 'p', fim = CR.FAR[fi][ff];
          if (fim && fc[fi][ff] < fim.instanceMatrix.count) putInst(fim, fc[fi][ff]++, w.x, w.y + (ff === 'p' && w.moving ? 0 : -0.03), w.z, w.yaw, w.s, w.width);
          continue;
        }
      }
      let f = V.chair ? 'p' : w.moving ? WALK_FRAMES[Math.floor(w.ph) & 3] : 'p';
      if (near && w.moving && w.speed > 2.3 && V.im.runA) f = Math.floor(w.ph) & 1 ? 'runA' : 'runB';
      if (near && !w.moving && !V.chair) {
        if (w.state === 'sit') f = 'sit';
        else if (w.state === 'phone') f = 'phone';
        else if (w.state === 'wave') f = Math.sin(w.age * 7) > -0.5 ? 'hail' : 'p';
        else if (w.state === 'chat') f = Math.sin(w.age * 2 + w.id) > 0 ? 'chat' : 'look';
        else if (w.state === 'idle' || w.state === 'browse') f = Math.sin(w.age * 0.7 + w.id) > 0 ? 'look' : 'p';
      }
      if (!V.im[f]) f = 'p';
      if (!cnt[w.v][f] && draws >= 100 && f !== 'sit') f = 'p';
      const im = V.im[f];
      const c = cnt[w.v]; if (c[f] >= im.instanceMatrix.count) continue;
      if (!c[f] && draws >= 110) continue;
      if (!c[f]) draws++;
      const sway = near && !w.moving && w.state !== 'sit' ? Math.sin(w.age * 1.3 + w.id) * 0.025 : 0;
      putInst(im, c[f]++, w.x + Math.cos(w.yaw) * sway, w.y + (f === 'p' && w.moving && !V.chair ? 0 : -0.03), w.z - Math.sin(w.yaw) * sway, w.yaw, w.s, w.width);
    }
    // extras
    exT -= dt;
    const cam = AF.camera.position;
    if (exGrid && (exT <= 0 || Math.hypot(cam.x - exAt.x, cam.z - exAt.z, cam.y - exAt.y) > 5)) { exT = 2; refreshExtras(); }
    for (const e of CR.extras) {
      const V = CR.V[e.v]; let f = 'p';
      if (e.pose === 'sit') f = 'sit';
      else if (e.pose === 'work') f = (Math.sin(t * 1.6 + e.ph) > 0.2) ? 'work' : 'p';
      else if (e.pose === 'dance') f = WALK_FRAMES[Math.floor(t * 3 + e.ph) & 3];
      const im = V.im[f]; if (!im) continue; const c = cnt[e.v]; if (c[f] >= im.instanceMatrix.count) continue;
      if (!c[f]) { if (draws >= 110) continue; draws++; }
      const sway = e.pose === 'stand' ? Math.sin(t * 0.4 + e.ph) * 0.25 : e.pose === 'dance' ? t * 0.8 + e.ph : 0;
      putInst(im, c[f]++, e.x, e.y, e.z, e.yaw + sway, 1);
    }
    for (let v = 0; v < CR.V.length; v++) for (const f in CR.V[v].im) { const im = CR.V[v].im[f], n = cnt[v][f]; if (im.count !== n || n) { im.count = n; im.visible = n > 0; if (n) im.instanceMatrix.needsUpdate = true; } }
    for (let i = 0; i < CR.FAR.length; i++) for (const f in CR.FAR[i]) { const im = CR.FAR[i][f], n = fc[i][f]; if (im.count !== n || n) { im.count = n; im.visible = n > 0; if (n) im.instanceMatrix.needsUpdate = true; } }
    const stats = CR.stats; stats.walkers = act; stats.moving = mov; stats.extras = CR.extras.length; stats.cand = candEdges.length; stats.draws = draws; stats.stopped = stopped;
    // talkable passer-by: the nearest walker within 2 m of the player
    if (CR.it && pp.walk) {
      let best = null, bd = 2.2;
      for (const w of CR.walkers) { if (!w.act || w.lead || w.agg) continue; const d = Math.abs(w.x - pp.x) + Math.abs(w.z - pp.z); if (d < bd) { bd = d; best = w; } }
      for (const e of CR.extras) { if (e.pose !== 'sit' && e.pose !== 'stand') continue; const d = Math.abs(e.x - pp.x) + Math.abs(e.z - pp.z) + Math.abs(e.y - (AF.player.y || 0)) * 0.5; if (d < bd) { bd = d; best = e; } }
      CR.near = best;
      if (best) { if (best.id == null) best.id = Math.floor(hash(best.s) * 1e6); if (!best.name) nameWalker(best); CR.it.x = best.x; CR.it.y = best.y + 1; CR.it.z = best.z; CR.it.label = (best.pose === 'sit' ? 'Chat with ' : 'Talk to ') + best.first; }
      else { CR.it.x = 1e6; CR.it.z = 1e6; }
    }
  }
  const PASSER = [
    "Swell evening, isn't it? The whole harbour's gone gold.", "Can't stop, pal, I'm late for the 6:10 at Union Terminal!", "Don't take any wooden nickels, friend.",
    "Harbour Days on Saturday! The fleet's in, and there's a parade down Grand.", "Say, you look lost. Grand Avenue's the one with all the lights.",
    "I'm off to the Paragon. Two bits says the organist plays 'Stardust Avenue' again.", "My feet are killing me. Meridian's had a sale on everything but chairs.",
    "Gee whiz, did you see the blimp nosing up to the Solace mast?", "Evening! Mind the streetcar, they don't stop for daydreamers.",
    "I'm meeting my girl under the Terminal clock. Wish me luck.", "Buddy, can you spare a minute? No? Nobody can on Grand.", "That's the berries! The Blue Heron's got a new trumpet man.",
    "Hats off to whoever fixed the streetlamp on my block. Slept like a baby.", "The automat's got pie for a nickel today. Rhubarb! Don't tell my wife.", "Say, is it true you can see the whole city from the Solace Tower deck?",
    "I heard the zoo got a real giraffe. Neck like a lamppost!", "Gotta catch the ferry before the fog rolls in. Toodle-oo!", "Radio says fair skies all week. I'll believe it when my knees do.",
    "They're laying new asphalt on Bay Street. Smells like progress, I suppose.", "My brother flies the Clipper out of Westgate. Says the clouds look like mashed potatoes.",
  ];
  const GROUP_LINES = {
    couple: ["We're celebrating our anniversary. Five years and she still laughs at my jokes!", "We're headed to the Paragon for the picture show. Care to recommend a candy?", "Don't mind us, we're just walking. Walking's free, and so is the view."],
    kid: ["Hold on to my hand at the crossing, sweetheart. Oh, hello there!", "We're off to see the monkeys at the zoo. This one's been asking since breakfast.", "One scoop, I said ONE scoop. Kids, huh?", "Say hello to the nice stranger. No? Shy today."],
    friends: ["We're cutting class. Don't tell Miss Pruitt!", "The soda fountain's got a new jukebox. Wanna come?", "We're gonna fly a plane someday. The real kind, at Westgate!"],
    chair: ["Lovely day for a roll along the promenade. Kerbs could use some ramps, though!", "I used to sail the Solace harbour. Now I watch the boats, and that's fine too.", "Mind the cobbles on Bay Street, they rattle my teeth!"],
    armin: ["We've been walking this street every evening for forty years.", "Arm in arm keeps us both upright, friend."],
  };
  const BENCH_LINES = ["Pull up a seat, friend. Best view in town is from right here.", "I come here every evening to watch the lights come on. Never gets old.", "You look like you've been walking all day. Rest your feet a minute.",
    "See that couple by the fountain? Married fifty years. Still hold hands.", "Feed the pigeons? Heavens, no. They've got a better pension than I do.", "My late husband proposed on a bench just like this one. Different bench. Same pigeons.",
    "I'm people-watching. It's cheaper than the pictures and the plot's better.", "If you're heading to the zoo, buy the ticket at the booth first. The turnstiles are strict.", "They say there's a river out east now. Boats and everything. Progress!",
    "Sit a while. The city's not going anywhere, and neither am I."];
  function nameWalker(w) {
    const V = CR.V[w.v], r = AF.rng(9001 + w.id * 31), f = V.L.female;
    w.first = V.kid ? pick(r, BOY) : f ? pick(r, FEMALE) : pick(r, MALE); w.last = pick(r, SURN);
    const G = w.pose === 'sit' ? BENCH_LINES : GROUP_LINES[w.grp];
    w.name = w.first;
    w.lines = G ? [pick(r, G), pick(r, PASSER), pick(r, G)] : [pick(r, PASSER), LORE[Math.floor(r() * LORE.length)], pick(r, PASSER)]; w.li = 0;
  }
  AF.onBuild('people-crowd', 660, () => {
    const t0 = performance.now();
    try { buildCrowdMeshes(); try { buildPromenades(); } catch (e) { console.warn('[af] promenades', e); } initWalkers(); indexExtras(); } catch (e) { console.warn('[af] crowd build failed', e); CR.on = false; }
    CR.it = AF.addInteract({ x: 1e6, y: 0, z: 1e6, r: 1.8, label: 'Talk to passer-by', can: () => !!CR.near && AF.mode === 'walk', act: () => {
      const w = CR.near; if (!w) return; if (!w.name) nameWalker(w); w.talk = 7; const line = w.lines[w.li++ % w.lines.length];
      AF.emit('dialogue', { name: w.first + ' ' + w.last, role: 'Passer-by', line, person: null });
    } });
    CR.buildMs = Math.round(performance.now() - t0);
    console.log('[af] crowd', CR.V.length, 'looks', CR.NW, 'walkers', CR.buildMs, 'ms');
  });
  AF.on('ready', () => { try { indexExtras(); exT = 0; } catch (e) {} });
  AF.onTick('people-crowd', 305, crowdTick);
  K.crowdTick = crowdTick;

  // ============================================================ R2: OFFICER CALLAHAN directs traffic on the Grand x Meridian podium
  // White gloves, arm signals synced to AF.trafficLight.state(podium, axis): arms out along the flowing axis with the right hand
  // beckoning, a raised hand + whistle on amber, and a 90-degree turn when the phase flips. Talkable.
  const COP = K.cop = { p: null };
  function buildCop() {
    const s = (AF.spots || []).find((q) => q && q.building === 'traffic-cop');
    // stand beside the umbrella pole (it rises from the podium centre), not through it
    const x = (s ? s.x : 0) + 0.3, z = (s ? s.z : 0) + 0.3, y = s && Number.isFinite(s.y) ? s.y : 1.25;
    if (s) spotsTaken.add(s);
    for (const p of people) if (p.spot === s && s) { p.spot = null; p.x += 3; p.state = 'idle'; }
    const L = makeLook('police', 'm', 'adult', AF.rng(1107)); L.moustache = true; L.beard = false; L.glasses = null; L.smile = true; L.skin = 0xefc19f; L.hair = 0x8a3b1f;
    L.top = Object.assign({}, L.top, { cuffs: true, cuff: 0xf6f4ee });
    const pr = buildPerson(L);
    const gmod = new AF.Model(3, 3, 4); gmod.box(0, 0, 0, 3, 3, 4, ck(0xf6f4ee, 0.04, 0.1));
    const gg = AF.meshModel(gmod, { vs: VS, anchor: [0.5, 1, 0.5] });
    for (const arm of [pr.armL, pr.armR]) { const g = mesh(gg, false); g.position.y = -(pr.B.ah - 2.5) * VS; arm.add(g); }
    // brass whistle on a chain at the collar
    const wm = new AF.Model(2, 1, 3); wm.box(0, 0, 0, 2, 1, 3, ck(0xd8b84a, 0.05, 0.1));
    const wh = mesh(AF.meshModel(wm, { vs: VS, anchor: [0.5, 0, 0.5] }), false); wh.position.set(0.12, pr.B.th * VS - 0.18, pr.B.td / 2 * VS + 0.02); pr.hips.add(wh);
    pr.root.position.set(x, y, z); AF.scene.add(pr.root);
    const c = COP.p = { x, y, z, yaw: 0, parts: pr, look: L, li: 0, wave: 0, lastFlow: null, turnT: 0 };
    const LINES = ["Officer Callahan, Grand and Meridian, eleven years on this box. Nobody runs my corner.", "When my right hand's out, you stop. When my glove waves, you go. Simple as pie.",
      "The whistle's for the cabbies. The wink's for the ladies. The nightstick's for show, mostly.", "Mind the streetcar, friend. She's got the right of way and eighteen tons of it.",
      "Harbour Days Saturday: the fleet's in and I'll have sailors crossing against the light till midnight."];
    AF.addInteract({ x, y: y + 0.4, z, r: 3.2, label: 'Talk to Officer Callahan', can: () => AF.mode === 'walk', act: () => {
      c.wave = 2.5; AF.emit('dialogue', { name: 'Officer Callahan', role: 'Traffic Patrolman \u00b7 the Grand x Meridian box', line: LINES[c.li++ % LINES.length], person: null }); } });
  }
  function copTick(dt, t) {
    const c = COP.p; if (!c) return;
    const cam = AF.camera.position; const far = Math.abs(cam.x - c.x) + Math.abs(cam.z - c.z) > 220; c.parts.root.visible = !far || cam.y > 30; if (far) return;
    const T = AF.trafficLight, sx = T && T.state ? T.state(c.x, c.z, 'x') : 'green', sz = T && T.state ? T.state(c.x, c.z, 'z') : 'red';
    const flow = sx !== 'red' ? 'x' : sz !== 'red' ? 'z' : c.lastFlow || 'x';
    if (flow !== c.lastFlow) { c.lastFlow = flow; c.turnT = 0.9; }
    c.turnT = Math.max(0, c.turnT - dt);
    // face across the flowing traffic: flow along x -> face +/-z, arms along x (and vice versa); pick the half-turn nearest the camera
    const base = flow === 'x' ? 0 : Math.PI / 2, tgt = Math.cos(base) * (cam.z - c.z) + Math.sin(base) * (cam.x - c.x) >= 0 ? base : base + Math.PI;
    c.yaw += AF.angDiff(c.yaw, tgt) * Math.min(1, dt * 3.2);
    const pr = c.parts, amber = (flow === 'x' ? sx : sz) === 'amber';
    pr.root.position.set(c.x, c.y, c.z); pr.root.rotation.y = c.yaw;
    const L = pr.armL.rotation, R = pr.armR.rotation, k = Math.min(1, dt * 7);
    let lx = 0, ly = 0, lz = 1.48, rx = 0, ry = 0, rz = -1.48;
    if (c.turnT > 0) { lz = 0.3; rz = -0.3; rx = -0.2; }                                  // mid-turn: arms drop while he pivots
    else if (amber) { rx = -2.95; rz = -0.1; lz = 0.12; lx = -0.2; }                      // whistle hand up: clear the box
    else { ry = 0.55 + Math.sin(t * 3.4) * 0.6; lx = 0; }                                  // right glove beckons the flowing lane through
    if (c.wave > 0) { c.wave -= dt; rx = -2.7; ry = 0; rz = -0.35 + Math.sin(t * 9) * 0.35; }
    L.x += (lx - L.x) * k; L.y += (ly - L.y) * k; L.z += (lz - L.z) * k; R.x += (rx - R.x) * k; R.y += (ry - R.y) * k; R.z += (rz - R.z) * k;
    pr.hips.rotation.x = Math.sin(t * 1.7) * 0.012; pr.body.position.y = amber ? Math.abs(Math.sin(t * 6)) * 0.02 : 0;
    pr.head.rotation.y = amber ? 0 : Math.sin(t * 0.6) * 0.5;
  }
  // ============================================================ R2 STREET VIGNETTES: the man chasing his hat down Grand, delivery men carrying crates
  const VIG = K.vignettes = [];
  const swing = (pr, ph, A, carry) => { const sn = Math.sin(ph); pr.legL.rotation.x = sn * A; pr.legR.rotation.x = -sn * A; pr.armL.rotation.x = carry ? -1.0 : -sn * A * 0.8; pr.armR.rotation.x = carry ? -1.0 : sn * A * 0.8; pr.body.position.y = Math.abs(Math.cos(ph)) * 0.035; };
  function buildVignettes() {
    const r = AF.rng(777);
    // 1. the gust: a fedora bowls down the Grand Ave sidewalk and its owner scrambles after it (every ~34 s)
    { const L = makeLook('shopper', 'm', 'adult', r); L.top = { style: 'suit', col: 0x6a5a45, tie: 0xb3342c, cuffs: true }; L.bottom = { style: 'pants', col: 0x6a5a45, cuff: true }; L.hat = null; L.propR = 'briefcase'; L.moustache = true; delete L.skirt; L.apron = null;
      const pr = buildPerson(L); AF.scene.add(pr.root);
      const hm = new AF.Model(12, 5, 12), hc = ck(0x3a4a5a, 0.15), hb = ck(0x1c1c22, 0.1);
      for (let x = 0; x < 12; x++) for (let z = 0; z < 12; z++) { const dx = x - 5.5, dz = z - 5.5; if (dx * dx + dz * dz <= 5.6 * 5.6) hm.set(x, 0, z, hc); }
      hm.box(2, 1, 2, 10, 3, 10, hc); hm.box(2, 1, 2, 10, 2, 10, hb); hm.box(3, 3, 3, 9, 4, 9, hc); hm.box(5, 3, 4, 7, 4, 8, 0);
      const hat = mesh(AF.meshModel(hm, { vs: VS, anchor: [0.5, 0, 0.5] })); AF.scene.add(hat);
      const x0 = -10.6, z0 = 22, z1 = 52;
      VIG.push({ kind: 'hat', pr, hat, x0, z0, z1, T: 34, off: 3, headY: pr.hipY + pr.B.th * VS + 8 * VS });
    }
    // 2. delivery men: crate in from the kerb to a shop door on Grand / Bay, then back out empty-handed
    { const doors = [];
      for (const b of (AF.buildings || [])) { if (!b || !b.doors || !/shop|store|grocer|bakery|deli|cafe|diner|drug|market|automat/i.test((b.kind || '') + ' ' + (b.id || '') + ' ' + (b.name || ''))) continue; const d = b.doors[0]; if (d && Number.isFinite(d.x) && Math.abs(d.y ?? 0.25) < 0.8) doors.push(d); }
      doors.sort((a, b) => Math.hypot(a.x, a.z - 40) - Math.hypot(b.x, b.z - 40));
      let n = 0;
      for (const d of doors) {
        if (n >= 4) break;
        const yw = d.yaw || 0, fx = Math.sin(yw), fz = Math.cos(yw);
        const kx = d.x - fx * 1.7, kz = d.z - fz * 1.7, gy = AF.W.groundY(kx, kz);
        if (AF.boxBlocked(kx, gy + 0.3, kz, 0.3, 1.2) || AF.boxBlocked(d.x, AF.W.groundY(d.x, d.z) + 0.3, d.z, 0.3, 1.2)) continue;
        const L = makeLook(n % 2 ? 'milkman' : 'mechanic', 'm', 'adult', r); if (!(n % 2)) { L.top = { style: 'coverall', col: 0x8a6a40, col2: 0x6a4a2a }; L.bottom = { style: 'pants', col: 0x6a4a2a }; L.hat = 'flatcap'; L.hatCol = 0x4a3a2a; }
        L.propR = 'crate'; const prC = buildPerson(L); const L2 = Object.assign({}, L, { propR: null }); const pr2 = buildPerson(L2);
        const pr = prC; pr.armRC = pr.armR.geometry; pr.armRE = pr2.armR.geometry; AF.scene.add(pr.root);
        // the crate stack on the kerb
        const cm = new AF.Model(8, 10, 8), cw = ck(0x9a7a4a, 0.2), cd = ck(0x6a4a2a, 0.1); cm.box(0, 0, 0, 8, 5, 8, cw); cm.box(0, 4, 0, 8, 5, 8, cd); cm.box(1, 5, 1, 7, 10, 7, cw); cm.box(1, 9, 1, 7, 10, 7, cd);
        const crate = mesh(VIG.crateG || (VIG.crateG = AF.meshModel(cm, { vs: 1 / 12, anchor: [0.5, 0, 0.5] }))); crate.position.set(kx + Math.cos(yw) * 0.9, gy, kz - Math.sin(yw) * 0.9); crate.rotation.y = yw; AF.scene.add(crate); pr.crate = crate;
        VIG.push({ kind: 'deliv', pr, ax: kx, az: kz, bx: d.x - fx * 0.2, bz: d.z - fz * 0.2, T: 16 + n * 1.7, off: n * 4.1 });
        n++;
      }
    }
  }
  function vignetteTick(dt, t) {
    const cam = AF.camera.position;
    for (const v of VIG) {
      const pr = v.pr, near = Math.abs(cam.x - (v.x0 ?? v.ax)) + Math.abs(cam.z - (v.z0 ?? v.az)) < (AF.MOBILE ? 90 : 170); pr.root.visible = near; if (v.hat) v.hat.visible = near; if (pr.crate) pr.crate.visible = near; if (!near) continue;
      const k = (((t + v.off) % v.T) + v.T) % v.T / v.T;
      if (v.kind === 'hat') {
        // 0-.08 strolling, .08 gust: hat lifts + bowls along the pavement; .12-.62 he runs after it; .62 catches it; .62-1 strolls back, hat on
        const L = v.z1 - v.z0; let mz, hz, hy, hRoll = 0, hatOn = false, run = false, back = false;
        if (k < 0.08) { mz = v.z0 + k / 0.08 * 1.2; hatOn = true; }
        else if (k < 0.62) { const u = (k - 0.08) / 0.54; hz = v.z0 + 1.2 + Math.min(1, u * 1.25) * (L - 1.2); hy = 0.25 + Math.abs(Math.sin(u * 13)) * 0.35 * (1 - u) + (u < 0.05 ? (0.05 - u) * 30 : 0); hRoll = u * 26; mz = k < 0.12 ? v.z0 + 1.2 : v.z0 + 1.2 + Math.max(0, (k - 0.12) / 0.5) * (L - 1.9); run = k >= 0.12; }
        else { const u = (k - 0.62) / 0.38; mz = v.z1 - 0.7 - u * (L - 1.9); hatOn = true; back = true; }
        const yaw = back ? Math.PI : 0, gy = AF.W.groundY(v.x0, mz);
        pr.root.position.set(v.x0, gy, mz); pr.root.rotation.y = yaw;
        const ph = t * (run ? 11 : 4.6); swing(pr, ph, run ? 0.9 : 0.5, false);
        if (run) { pr.armL.rotation.x = -1.6 + Math.sin(ph) * 0.2; pr.hips.rotation.x = 0.2; } else pr.hips.rotation.x = 0.03;
        if (k >= 0.08 && k < 0.12) { pr.armL.rotation.x = -2.6; pr.legL.rotation.x = pr.legR.rotation.x = 0; }   // clutches at his head
        if (hatOn) { v.hat.position.set(v.x0, gy + pr.body.position.y + v.headY, mz); v.hat.rotation.set(0, yaw, 0); }
        else { v.hat.position.set(v.x0 + Math.sin(hRoll * 0.3) * 0.2, AF.W.groundY(v.x0, hz) + hy, hz); v.hat.rotation.set(hRoll, 0, 1.45); }
      } else {
        // 0-.4 kerb -> door carrying a crate, .4-.5 inside the door, .5-.9 back out empty, .9-1 picks up the next crate
        let u, x, z, carry = false, moving = true, yaw;
        if (k < 0.4) { u = k / 0.4; carry = true; x = v.ax + (v.bx - v.ax) * u; z = v.az + (v.bz - v.az) * u; yaw = Math.atan2(v.bx - v.ax, v.bz - v.az); }
        else if (k < 0.5) { x = v.bx; z = v.bz; moving = false; yaw = Math.atan2(v.bx - v.ax, v.bz - v.az); carry = k < 0.45; }
        else if (k < 0.9) { u = (k - 0.5) / 0.4; x = v.bx + (v.ax - v.bx) * u; z = v.bz + (v.az - v.bz) * u; yaw = Math.atan2(v.ax - v.bx, v.az - v.bz); }
        else { x = v.ax; z = v.az; moving = false; yaw = Math.atan2(v.bx - v.ax, v.bz - v.az) + 1.2; carry = k > 0.95; pr.hips.rotation.x = Math.sin((k - 0.9) / 0.1 * Math.PI) * 0.5; }
        const g = carry ? pr.armRC : pr.armRE; if (pr.armR.geometry !== g) pr.armR.geometry = g;
        pr.root.position.set(x, AF.W.groundY(x, z), z); pr.root.rotation.y = yaw;
        if (moving) { swing(pr, t * 4.4 + v.off, carry ? 0.4 : 0.55, carry); pr.hips.rotation.x = carry ? 0.08 : 0.03; }
        else { pr.legL.rotation.x = pr.legR.rotation.x = 0; pr.armR.rotation.x = carry ? -1.0 : -0.3; pr.armL.rotation.x = carry ? -1.0 : -0.2; if (k < 0.9) pr.hips.rotation.x = 0.03; }
      }
    }
  }
  AF.onBuild('people-vignettes', 663, () => { try { buildVignettes(); } catch (e) { console.warn('[af] vignettes failed', e); } });
  AF.onTick('people-vignettes', 307, vignetteTick);
  K.vignetteTick = vignetteTick;

  AF.onBuild('people-cop', 662, () => { try { buildCop(); } catch (e) { console.warn('[af] cop failed', e); } });
  AF.onTick('people-cop', 306, copTick);
  K.copTick = copTick;

  // ------------------------------------------------------------ tests
  AF.test('people: crowd + extras populated', () => { if (!CR.V.length) return { ok: false, info: 'no crowd' }; for (let i = 0; i < 20; i++) crowdTick(0.05, AF.clock.t + i * 0.05); const s = CR.stats; return { ok: s.walkers >= Math.min(60, CR.NW * 0.35) && s.draws <= 110, info: JSON.stringify(s) }; });
  AF.test('people: busy sidewalk two-way flow + near idle behaviour', () => {
    const edge = G.edges.find(([a, b]) => /Grand|Meridian/.test(a.rn || '') && !isCross(a, b) && Math.hypot(b.x - a.x, b.z - a.z) > 4);
    if (!edge || !CR.V.length) return { ok: false, info: 'no busy sidewalk' };
    const savedEdges = candEdges, savedDensity = new Map(dens), savedFlows = new Map(flows), savedBenches = new Set(CR.benchTaken), probes = [];
    const centre = { x: edge[0].x, z: edge[0].z, R: 120 }, observer = { x: 1e6, z: 1e6, walk: false };
    let forward = 0, stopped = 0;
    try {
      candEdges = [edge]; flows.clear();
      for (let index = 0; index < 24; index++) {
        dens.clear();
        const probe = { id: 1000 + index, v: index % CR.nDay, lat: (index % 3 - 1) * 0.3, s: 1, ph: index * 0.37, age: index, talk: 0, x: 0, z: 0, y: 0.25 };
        spawnWalker(probe, centre, false); probes.push(probe); if (probe.A.i < probe.B.i) forward++;
      }
      for (let tick = 0; tick < 80; tick++) for (const probe of probes) if (probe.act) stepWalker(probe, 0.1, observer, true);
      for (const probe of probes) if (probe.act && probe.state !== 'walk') stopped++;
      return { ok: forward >= 10 && forward <= 14 && stopped > 0, info: forward + '/24 forward, ' + stopped + ' stopped after 8 s' };
    } finally {
      candEdges = savedEdges; dens.clear(); flows.clear(); CR.benchTaken.clear();
      for (const [key, value] of savedDensity) dens.set(key, value);
      for (const [key, value] of savedFlows) flows.set(key, value);
      for (const bench of savedBenches) CR.benchTaken.add(bench);
    }
  });
  AF.test('people: names valid (no " home", no Court surnames)', () => { const bad = people.filter((p) => /\bhome\b|Court|Apartments|Building|undefined|null/i.test(p.name) || /\bhome place\b/.test(p.lines.join(' '))); return { ok: bad.length === 0, info: bad.length + ' bad ' + bad.slice(0, 5).map((p) => p.name).join(', ') }; });
  AF.test('people: nobody standing on awnings (> floor + 0.6 only on solid stoops/steps)', () => { const bad = []; for (const p of people) { if (p.pose === 'sit' || p.state === 'walk') continue; const g = AF.W.groundY(p.x, p.z), fl = p.spot ? Math.max(g, p.spot.y ?? g) : g; let hung = false; if (p.y > fl + 0.65) for (let y = g + 0.12; y < p.y - 0.3; y += 0.25) { const c = AF.W.getM(p.x, y, p.z); if (!(c && AF.PAL.solid[c])) { hung = true; break; } } if (hung) bad.push(p.name + '@' + p.x.toFixed(1) + ',' + p.y.toFixed(2) + ',' + p.z.toFixed(1)); } return { ok: bad.length === 0, info: bad.length + ' floating ' + bad.slice(0, 5).join(' | ') }; });
  AF.test('people: traffic cop signals with the lights (Grand x Meridian)', () => {
    const c = COP.p; if (!c) return { ok: false, info: 'no cop' };
    const T = AF.trafficLight, clk = AF.clock.t, res = [];
    let o0 = 0; if (T && T.state) for (let o = 0; o < 28; o += 0.5) { AF.clock.t = clk + o; if (T.state(c.x, c.z, 'x') === 'green') { o0 = o; break; } }
    for (const dtc of [o0, o0 + 14]) { AF.clock.t = clk + dtc; for (let i = 0; i < 60; i++) copTick(1 / 30, clk + dtc + i / 30); res.push([c.lastFlow, +c.yaw.toFixed(2), +c.parts.armL.rotation.z.toFixed(2)]); }
    AF.clock.t = clk;
    const ext = CR.extras.filter((e) => e.s && e.s.building === 'traffic-cop').length;
    return { ok: res[0][0] !== res[1][0] && Math.abs(res[0][2]) > 1 && ext === 0, info: JSON.stringify(res) + ' extrasOnPodium ' + ext + ' doorSkipped ' + CR.doorSkipped };
  });
  AF.test('people: >= 100 residents', () => ({ ok: people.length >= 100, info: people.length + ' residents ' + JSON.stringify(K.stats) }));
  AF.test('people: dialogue interact exists', () => { const it = AF.interacts.find((i) => i.person); let got = null; const f = (d) => { got = d; }; AF.on('dialogue', f); if (it) it.act(); AF._ev.dialogue.splice(AF._ev.dialogue.indexOf(f), 1); return { ok: !!it && !!got && !!got.line, info: it ? it.label + ' -> ' + (got && got.line) : 'none' }; });
  AF.test('people: 60 s simulated, none NaN / underground / inside voxels', () => {
    for (let i = 0; i < 600; i++) peopleTick(0.1);
    let bad = [], walking = 0;
    for (const p of people) {
      const ok = isFinite(p.x) && isFinite(p.y) && isFinite(p.z);
      const g = AF.W.groundY(p.x, p.z);
      const chest = p.pose === 'sit' ? p.y + p.parts.hipY + 0.45 : p.y + 1.2;
      const c = AF.W.getM(p.x, chest, p.z);
      const inside = c && AF.PAL.solid[c];
      if (p.state === 'walk') walking++;
      const low = p.pose === 'sit' ? p.y + p.parts.hipY < g - 0.05 : p.y < g - 0.3;
      if (!ok || low || inside) bad.push(p.name + '@' + (p.x | 0) + ',' + p.y.toFixed(2) + ',' + (p.z | 0) + (inside ? ' in-voxel' : '') + (low ? ' under' : ''));
    }
    return { ok: bad.length === 0, info: 'walking ' + walking + ' bad ' + bad.length + ' ' + bad.slice(0, 6).join(' | ') };
  });
}

} catch (e) { AF.partError('55-people.js', e); }

