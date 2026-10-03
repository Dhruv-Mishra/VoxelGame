// ================================================================ 56-animals.js
try {
// ===== 56-animals: dogs (leashed + dalmatian), cats on porches, ducks + ducklings, pigeons, geese V-formations, farm animals, squirrels  (OWNER: people) =====
// Build 'animals' (650, after 'people'): voxel models (1/16 m), body geometries with two leg poses swapped while walking (1 draw call),
// separate head / tail meshes for grazing, pecking, wagging. Tick 'animals' (320). Exposes AF.animals = [...], AF.animalsKit.
{
  const PL = AF.PLAN;
  const VS = 1 / 16, TAU = Math.PI * 2;
  const K = AF.animalsKit = {};
  const animals = AF.animals = [];
  const cc = new Map();
  const ck = (hex, j = 0.12, e = 0.12) => { const k = hex * 7 + j * 3 + e; let i = cc.get(k); if (!i) { i = AF.col(hex, { jitter: j, edge: e }); cc.set(k, i); } return i; };
  const mesh = (g, cast = true) => { const m = new THREE.Mesh(g, AF.mat.voxel); m.castShadow = cast; m.receiveShadow = true; return m; };
  const gm = (m, anchor) => AF.meshModel(m, { vs: VS, anchor });

  // ------------------------------------------------------------ quadruped kit
  // spec: {len, bw, bh, lh, lw, hs:[w,h,d], col, belly, pattern(x,y,z)->hex|null, legCol, hoof, tail:{len,col,up}, ears, horns, snout:{w,h,d,col}, mane, neck}
  function quadBody(S, pose) {
    const W = S.bw + 2, H = S.lh + S.bh + (S.hump || 0) + 1, D = S.len + 4;
    const m = new AF.Model(W, H, D);
    const x0 = 1, x1 = 1 + S.bw, z0 = 2, z1 = 2 + S.len, y0 = S.lh, y1 = S.lh + S.bh;
    const base = ck(S.col, 0.18);
    for (let x = x0; x < x1; x++) for (let y = y0; y < y1; y++) for (let z = z0; z < z1; z++) {
      // rounded corners
      const ex = x === x0 || x === x1 - 1, ey = y === y0 || y === y1 - 1, ez = z === z0 || z === z1 - 1;
      if ((ex && ey && ez)) continue;
      let c = base;
      if (S.belly && y === y0) c = ck(S.belly, 0.1);
      if (S.pattern) { const h = S.pattern(x - x0, y - y0, z - z0); if (h != null) c = ck(h, 0.1); }
      m.set(x, y, z, c);
    }
    if (S.wool) for (let x = x0 - 1; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z < z1; z++) if (((x * 3 + y * 5 + z * 7) % 4 === 0) && !m.get(x, y, z)) m.set(x, y, z, ck(S.wool, 0.15));
    // legs at the 4 corners
    const lc = ck(S.legCol ?? S.col, 0.15), hf = ck(S.hoof ?? S.legCol ?? S.col, 0.05);
    const lw = S.lw;
    const legs = [[x0, z0 + 1, 0], [x1 - lw, z0 + 1, 1], [x0, z1 - 1 - lw, 1], [x1 - lw, z1 - 1 - lw, 0]];
    for (const [lx, lz, ph] of legs) {
      const sh = pose === 0 ? 0 : (ph === pose - 1 ? 1 : -1);
      for (let y = 0; y < S.lh; y++) {
        const off = y < S.lh / 2 ? sh : 0;
        m.box(lx, y, lz + off, lx + lw, y + 1, lz + lw + off, y < 1 ? hf : lc);
      }
    }
    if (S.udder) m.box(x0 + 1, y0 - 1, z0 + 2, x1 - 1, y0, z0 + 4, ck(S.udder, 0.05));
    // tail stub (dogs have a separate tail mesh)
    if (S.tailFixed) { const tc = ck(S.tailFixed.col ?? S.col); for (let i = 0; i < S.tailFixed.len; i++) m.set((x0 + x1) >> 1, y1 - 1 - i, z0 - 1, tc); if (S.tailFixed.tuft) m.box(((x0 + x1) >> 1) - 1, y1 - 1 - S.tailFixed.len, z0 - 1, ((x0 + x1) >> 1) + 1, y1 - S.tailFixed.len, z0, ck(S.tailFixed.tuft)); }
    return gm(m, [0.5, 0, 0.5]);
  }
  function quadHead(S) {
    const [hw, hh, hd] = S.hs, W = hw + 6, H = hh + 6, D = hd + 6;
    const m = new AF.Model(W, H, D);
    const x0 = 3, x1 = 3 + hw, y0 = 1, y1 = 1 + hh, z0 = 1, z1 = 1 + hd;
    const hc = ck(S.headCol ?? S.col, 0.15);
    m.box(x0, y0, z0, x1, y1, z1, hc);
    if (S.headPattern) for (let x = x0; x < x1; x++) for (let y = y0; y < y1; y++) for (let z = z0; z < z1; z++) { const h = S.headPattern(x - x0, y - y0, z - z0); if (h != null) m.set(x, y, z, ck(h, 0.1)); }
    if (S.snout) { const sn = S.snout; const sx = x0 + ((hw - sn.w) >> 1); m.box(sx, y0, z1, sx + sn.w, y0 + sn.h, z1 + sn.d, ck(sn.col ?? S.col, 0.1)); m.set(sx, y0 + sn.h - 1, z1 + sn.d - 1, ck(0x1d1b1a, 0)); m.set(sx + sn.w - 1, y0 + sn.h - 1, z1 + sn.d - 1, ck(0x1d1b1a, 0)); if (S.nose) m.box(sx + ((sn.w - 2) >> 1), y0 + sn.h - 1, z1 + sn.d, sx + ((sn.w - 2) >> 1) + 2, y0 + sn.h, z1 + sn.d + 1, ck(0x1d1b1a, 0)); }
    const eye = ck(0x151312, 0);
    m.set(x0, y1 - 2, z1 - 2, eye); m.set(x1 - 1, y1 - 2, z1 - 2, eye);
    const ec = ck(S.earCol ?? S.headCol ?? S.col, 0.12);
    if (S.ears === 'floppy') { m.box(x0 - 1, y1 - 4, z0 + 1, x0, y1, z0 + 3, ec); m.box(x1, y1 - 4, z0 + 1, x1 + 1, y1, z0 + 3, ec); }
    else if (S.ears === 'pointy') { m.box(x0, y1, z0 + 1, x0 + 1, y1 + 2, z0 + 2, ec); m.box(x1 - 1, y1, z0 + 1, x1, y1 + 2, z0 + 2, ec); }
    else if (S.ears === 'side') { m.box(x0 - 2, y1 - 2, z0 + 1, x0, y1 - 1, z0 + 3, ec); m.box(x1, y1 - 2, z0 + 1, x1 + 2, y1 - 1, z0 + 3, ec); }
    if (S.horns) { const hn = ck(S.horns, 0.05); m.box(x0 - 1, y1, z0 + 1, x0 + 1, y1 + 1, z0 + 2, hn); m.set(x0 - 1, y1 + 1, z0 + 1, hn); m.box(x1 - 1, y1, z0 + 1, x1 + 1, y1 + 1, z0 + 2, hn); m.set(x1, y1 + 1, z0 + 1, hn); }
    if (S.mane) { const mc = ck(S.mane, 0.2); m.box(x0 + 1, y1, z0 - 1, x1 - 1, y1 + 1, z0 + 3, mc); m.box(x0 + 1, y1 - 2, z0 + 3, x1 - 1, y1 + 1, z0 + 4, mc); }
    if (S.collar) m.box(x0, y0, z0, x1, y0 + 1, z0 + 1, ck(S.collar, 0.05));
    if (S.blaze) m.box(x0 + (hw >> 1) - 1, y0 + 2, z1 - 1, x0 + (hw >> 1) + 1, y1, z1, ck(S.blaze, 0.05));
    // pivot at back-bottom centre of head
    return gm(m, [0.5, y0 / H, z0 / D]);
  }
  function tailGeo(len, col, tip) {
    const m = new AF.Model(1, len, 1); for (let i = 0; i < len; i++) m.set(0, i, 0, ck(i === len - 1 && tip ? tip : col, 0.1));
    return gm(m, [0.5, 0, 0.5]);
  }
  function makeQuad(S) {
    const A = quadBody(S, 0), B = quadBody(S, 1), C = quadBody(S, 2), H = quadHead(S);
    return { S, A, B, C, H, T: S.tail ? tailGeo(S.tail.len, S.tail.col ?? S.col, S.tail.tip) : null };
  }
  function spawnQuad(kit, x, y, z, yaw) {
    const S = kit.S, root = new THREE.Group(), body = mesh(kit.A), head = mesh(kit.H);
    root.add(body);
    const hy = (S.lh + S.bh - 2 + (S.neck || 0)) * VS, hz = (S.len / 2 - 1) * VS;
    head.position.set(0, hy, hz); root.add(head);
    let tail = null;
    if (kit.T) { tail = mesh(kit.T, false); tail.position.set(0, (S.lh + S.bh - 1) * VS, -(S.len / 2 + 0.5) * VS); tail.rotation.x = -(S.tail.up ?? 2.2); root.add(tail); }
    root.position.set(x, y, z); root.rotation.y = yaw; AF.scene.add(root);
    return { root, body, head, tail, kit, x, y, z, yaw, tyaw: yaw, phase: Math.random() * 10, t: Math.random() * 5, state: 'idle' };
  }

  // ------------------------------------------------------------ small models (single mesh, geometry swap for flapping)
  function duckGeo(o) {
    const m = new AF.Model(8, 8, 11);
    const body = ck(o.body, 0.15), head = ck(o.head, 0.1), bill = ck(0xe8a23a, 0.05), eye = ck(0x151312, 0), wing = ck(o.wing ?? o.body, 0.15), tail = ck(o.tail ?? o.body, 0.1);
    m.box(2, 0, 2, 6, 3, 8, body); m.box(1, 1, 3, 7, 3, 7, wing); m.box(3, 3, 3, 5, 3.5, 7, body);
    m.box(3, 1, 0, 5, 3, 2, tail); m.set(3, 3, 1, tail); m.set(4, 3, 1, tail);
    m.box(3, 3, 6, 5, 4, 8, o.neck ? ck(o.neck, 0.05) : head); m.box(2, 4, 6, 6, 7, 9, head); m.box(3, 4, 9, 5, 5, 11, bill);
    m.set(2, 5, 8, eye); m.set(5, 5, 8, eye);
    if (o.feet) { const f = ck(0xe8a23a); m.box(2, 0, 4, 3, 0.5, 6, f); }
    if (o.flap === 1) { m.box(0, 3, 3, 1, 5, 7, wing); m.box(7, 3, 3, 8, 5, 7, wing); m.box(1, 1, 3, 2, 3, 7, 0); m.box(6, 1, 3, 7, 3, 7, 0); }
    return gm(m, [0.5, 0, 0.45]);
  }
  function birdGeo(o, flap) { // pigeon / goose: flap 0 folded, 1 wings up, 2 wings down
    const s = o.big ? 2 : 1;
    const W = 4 + 10 * s, m = new AF.Model(W, 8, 9 + 4 * s), cx = W >> 1;
    const body = ck(o.body, 0.15), dark = ck(o.dark, 0.1), neck = ck(o.neck, 0.1), beak = ck(o.beak, 0.05), eye = ck(0x151312, 0), light = ck(o.light ?? o.body, 0.1);
    const bl = 5 + 3 * s;
    m.box(cx - 2, 1, 2, cx + 2, 4, 2 + bl, body); m.box(cx - 1, 0, 3, cx + 1, 1, 1 + bl, light);
    m.box(cx - 1, 2, 0, cx + 1, 3, 2, dark);
    m.box(cx - 1, 3, bl, cx + 1, 5 + (o.big ? 1 : 0), bl + 2, neck); m.box(cx - 1, 5 + (o.big ? 1 : 0), bl + 1, cx + 1, 7 + (o.big ? 1 : 0), bl + 3, o.headC ? ck(o.headC) : neck);
    m.box(cx - 0.5, 5 + (o.big ? 1 : 0), bl + 3, cx + 0.5, 6 + (o.big ? 1 : 0), bl + 4, beak);
    m.set(cx - 1, 6 + (o.big ? 1 : 0), bl + 2, eye); m.set(cx, 6 + (o.big ? 1 : 0), bl + 2, eye);
    if (o.cheek) { m.set(cx - 1, 5 + s - 1, bl + 1, ck(o.cheek)); m.set(cx, 5 + s - 1, bl + 1, ck(o.cheek)); }
    const span = 3 + 4 * s;
    if (flap === 0) { m.box(cx - 3, 2, 3, cx - 2, 4, 2 + bl - 1, dark); m.box(cx + 2, 2, 3, cx + 3, 4, 2 + bl - 1, dark); }
    else { const wy = flap === 1 ? 5 : 1; for (let i = 0; i < span; i++) { const y = flap === 1 ? 3 + Math.min(4, Math.floor(i / 2)) : Math.max(0, 3 - Math.floor(i / 2)); m.box(cx - 3 - i, y, 3, cx - 2 - i, y + 1, 2 + bl - 1 - (i >> 1), i > span - 3 ? dark : body); m.box(cx + 2 + i, y, 3, cx + 3 + i, y + 1, 2 + bl - 1 - (i >> 1), i > span - 3 ? dark : body); } void wy; }
    if (!o.noFeet && flap === 0) { const f = ck(o.feet ?? 0xd06a5a); m.box(cx - 1, 0, 4, cx, 1, 5, f); m.box(cx, 0, 6, cx + 1, 1, 7, f); }
    return gm(m, [0.5, 0, 0.5]);
  }
  function chickenGeo(o, peck) {
    const m = new AF.Model(6, 9, 9);
    const b = ck(o.body, 0.18), comb = ck(0xc8322e, 0.05), beak = ck(0xe8a23a, 0.05), eye = ck(0x151312, 0), leg = ck(0xe8a23a, 0.05), tail = ck(o.tail ?? o.body, 0.15);
    m.box(1, 2, 1, 5, 5, 6, b); m.box(2, 5, 0, 4, 8, 2, tail); m.box(1, 3, 0, 5, 5, 1, tail);
    if (!peck) { m.box(2, 5, 5, 4, 8, 7, b); m.box(2, 8, 5, 4, 9, 7, comb); m.set(2, 5, 7, comb); m.box(2.5, 6, 7, 3.5, 7, 8, beak); m.set(2, 7, 6, eye); m.set(3, 7, 6, eye); }
    else { m.box(2, 2, 6, 4, 5, 8, b); m.box(2, 5, 6, 4, 6, 8, comb); m.box(2.5, 1, 8, 3.5, 2, 9, beak); m.set(2, 4, 7, eye); m.set(3, 4, 7, eye); }
    m.box(2, 0, 3, 3, 2, 4, leg); m.box(3, 0, 3, 4, 2, 4, leg);
    return gm(m, [0.5, 0, 0.5]);
  }
  function catGeo(o) { // sitting cat
    const m = new AF.Model(7, 12, 9);
    const c = ck(o.col, 0.15), c2 = ck(o.col2 ?? o.col, 0.15), eye = ck(o.eye ?? 0x8ac04a, 0), nose = ck(0xd88a8a, 0), wh = ck(0xf3f0e6, 0.05);
    m.box(1, 0, 1, 6, 5, 6, c); m.box(1, 5, 2, 6, 7, 6, c); m.box(2, 0, 6, 3, 2, 7, o.socks ? wh : c); m.box(4, 0, 6, 5, 2, 7, o.socks ? wh : c);
    if (o.stripes) for (let y = 1; y < 7; y += 2) m.box(1, y, 1, 6, y + 1, 2, c2);
    m.box(1, 7, 3, 6, 11, 7, c); m.set(1, 11, 3, c); m.set(1, 11, 4, c); m.set(5, 11, 3, c); m.set(5, 11, 4, c);
    if (o.bib) m.box(2, 3, 6, 5, 7, 7, wh); if (o.stripes) m.box(2, 10, 3, 5, 11, 7, c2);
    m.set(2, 9, 7, eye); m.set(4, 9, 7, eye); m.set(3, 8, 7, nose); m.box(2, 7, 7, 5, 8, 8, o.bib ? wh : c);
    return gm(m, [0.5, 0, 0.5]);
  }
  function squirrelGeo(flip) {
    const m = new AF.Model(5, 9, 9);
    const c = ck(0x9a5a2e, 0.15), b = ck(0xe8d0a8, 0.1), eye = ck(0x151312, 0);
    m.box(1, 0, 2, 4, 3, 6, c); m.box(2, 1, 5, 3, 3, 6, b); m.box(1, 2, 5, 4, 5, 8, c); m.set(1, 4, 7, eye); m.set(3, 4, 7, eye); m.set(1, 5, 6, c); m.set(3, 5, 6, c);
    const t = flip ? [[0, 2, 1], [1, 2, 0], [2, 3, 0], [3, 3, 0], [4, 4, 1], [5, 5, 1], [6, 5, 2]] : [[0, 2, 1], [1, 2, 0], [2, 3, 0], [3, 4, 0], [4, 5, 0], [5, 6, 1], [6, 7, 1], [7, 7, 2]];
    for (const [i, y, z] of t) m.box(1, y + 1, z, 4, y + 2, z + 1, c);
    return gm(m, [0.5, 0, 0.5]);
  }

  // ------------------------------------------------------------ species
  const SPEC = {
    dalmatian: { len: 10, bw: 4, bh: 4, lh: 5, lw: 1, hs: [4, 4, 4], col: 0xf4f1ea, pattern: (x, y, z) => ((x * 7 + y * 13 + z * 5) % 6 === 0 ? 0x1d1b1a : null), headPattern: (x, y, z) => ((x * 5 + y * 3 + z * 7) % 7 === 0 ? 0x1d1b1a : null), snout: { w: 2, h: 2, d: 2 }, nose: true, ears: 'floppy', earCol: 0x2a2624, tail: { len: 5, col: 0xf4f1ea, up: 2.3 }, collar: 0xc8322e },
    golden: { len: 10, bw: 4, bh: 4, lh: 5, lw: 1, hs: [4, 4, 4], col: 0xd8a45a, belly: 0xe8c48a, snout: { w: 2, h: 2, d: 2, col: 0xe0b06a }, nose: true, ears: 'floppy', earCol: 0xb8843a, tail: { len: 5, col: 0xd8a45a, up: 2.0 }, collar: 0x3a70c0 },
    beagle: { len: 9, bw: 4, bh: 4, lh: 4, lw: 1, hs: [4, 4, 4], col: 0xf1ede2, pattern: (x, y, z) => (y >= 2 && z > 2 && z < 7 ? 0x2a2420 : y >= 1 && (z <= 2 || z >= 7) ? 0xa86a3a : null), headCol: 0xa86a3a, blaze: 0xf1ede2, snout: { w: 2, h: 2, d: 2, col: 0xf1ede2 }, nose: true, ears: 'floppy', earCol: 0x6a4424, tail: { len: 4, col: 0xf1ede2, up: 2.5, tip: 0xffffff }, collar: 0xc8322e },
    terrier: { len: 7, bw: 3, bh: 4, lh: 3, lw: 1, hs: [3, 4, 3], col: 0xf1ede2, pattern: (x, y, z) => (z > 4 && y > 1 ? 0x2a2420 : null), snout: { w: 3, h: 2, d: 2, col: 0xe8e2d4 }, nose: true, ears: 'pointy', earCol: 0x2a2420, tail: { len: 3, col: 0xf1ede2, up: 2.8 }, collar: 0x3d6446 },
    scottie: { len: 7, bw: 3, bh: 4, lh: 3, lw: 1, hs: [3, 4, 3], col: 0x1f1d1c, belly: 0x2a2826, snout: { w: 3, h: 2, d: 2, col: 0x2a2826 }, nose: true, ears: 'pointy', earCol: 0x1f1d1c, tail: { len: 3, col: 0x1f1d1c, up: 2.8 }, collar: 0xc8322e },
    cow: { len: 20, bw: 9, bh: 8, lh: 8, lw: 2, hs: [6, 6, 6], neck: 1, col: 0xf3efe6, pattern: (x, y, z) => { const n = Math.sin(x * 0.9 + z * 0.55) + Math.cos(z * 0.7 - y * 0.8); return n > 0.9 ? 0x2a2420 : null; }, headCol: 0xf3efe6, headPattern: (x, y, z) => (x < 2 && y > 2 ? 0x2a2420 : null), snout: { w: 4, h: 3, d: 2, col: 0xe8b0a8 }, ears: 'side', earCol: 0x2a2420, horns: 0xe8dcc0, hoof: 0x3a3230, legCol: 0xf3efe6, udder: 0xe8a8a8, tailFixed: { len: 7, col: 0xf3efe6, tuft: 0x2a2420 } },
    jersey: { len: 19, bw: 8, bh: 8, lh: 8, lw: 2, hs: [6, 6, 6], neck: 1, col: 0xa8723e, belly: 0xc89a68, headCol: 0x9a6a3a, snout: { w: 4, h: 3, d: 2, col: 0x3a2a24 }, ears: 'side', earCol: 0x7a5030, horns: 0xe8dcc0, hoof: 0x2a2420, udder: 0xd8a098, tailFixed: { len: 7, col: 0xa8723e, tuft: 0x3a2a24 } },
    horse: { len: 18, bw: 7, bh: 8, lh: 12, lw: 2, hs: [5, 5, 8], neck: 7, col: 0x7a4a2a, headCol: 0x7a4a2a, snout: { w: 5, h: 3, d: 2, col: 0x6a3e22 }, ears: 'pointy', mane: 0x2a1c14, hoof: 0x2a2420, legCol: 0x6a3e22, blaze: 0xf1ede2, tailFixed: { len: 9, col: 0x2a1c14, tuft: 0x2a1c14 } },
    grey: { len: 18, bw: 7, bh: 8, lh: 12, lw: 2, hs: [5, 5, 8], neck: 7, col: 0xc8c4bc, pattern: (x, y, z) => ((x * 3 + z * 5 + y) % 5 === 0 ? 0x9a968e : null), headCol: 0xb8b4ac, snout: { w: 5, h: 3, d: 2, col: 0x8a867e }, ears: 'pointy', mane: 0xe8e4dc, hoof: 0x2a2420, tailFixed: { len: 9, col: 0xe8e4dc, tuft: 0xe8e4dc } },
    sheep: { len: 12, bw: 7, bh: 6, lh: 5, lw: 1, hs: [4, 4, 5], col: 0xf2eee2, wool: 0xfaf6ec, headCol: 0x2a2624, legCol: 0x2a2624, ears: 'side', earCol: 0x2a2624, snout: { w: 2, h: 2, d: 1, col: 0x3a3430 }, tailFixed: { len: 2, col: 0xf2eee2 } },
    pig: { len: 12, bw: 7, bh: 6, lh: 3, lw: 2, hs: [5, 5, 4], col: 0xeeaaa8, belly: 0xf2b8b4, headCol: 0xeeaaa8, snout: { w: 3, h: 2, d: 2, col: 0xe08a8c }, ears: 'pointy', earCol: 0xe89a9a, hoof: 0xc08080, tail: { len: 2, col: 0xe89a9a, up: 1.9 } },
  };

  // ------------------------------------------------------------ build
  AF.onBuild('animals', 651, () => {
    const t0 = performance.now();
    const kits = {}; const kit = (n) => kits[n] || (kits[n] = makeQuad(SPEC[n]));
    const S = AF.spots, R = AF.rng(4242);
    const add = (a) => { animals.push(a); return a; };
    // ---- dogs with walkers
    const dogBreeds = ['golden', 'beagle', 'terrier', 'golden', 'beagle', 'terrier'];
    let di = 0;
    const leashMat = new THREE.LineBasicMaterial({ color: 0x3a2a1c });
    for (const p of (AF.people || [])) {
      if (!p.dogWalker || di >= 6) continue;
      const k = kit(dogBreeds[di++]);
      const a = add(spawnQuad(k, p.x + 1, p.y, p.z, 0)); a.type = 'dog'; a.owner = p; a.speed = 1.6;
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
      a.leash = new THREE.Line(geo, leashMat); a.leash.frustumCulled = false; AF.scene.add(a.leash);
      if (p.look && !p.look.propR) {} // hand is free
    }
    // ---- dalmatian at Engine Co. 7 (spot kind 'dog', else beside the fire station door)
    { const s = S.find((q) => q.kind === 'dog');
      const fb = AF.buildings.find((b) => /fire|engine/i.test(b.id + ' ' + (b.name || '')) && b.doors && b.doors.length);
      const d0 = s || (fb && fb.doors[0]);
      if (d0) {
        const yw = d0.yaw || 0, x = s ? s.x : d0.x - Math.sin(yw) * 1.5 + Math.cos(yw) * 2.4, z = s ? s.z : d0.z - Math.cos(yw) * 1.5 - Math.sin(yw) * 2.4;
        const y = AF.surfaceBelow(x, z, (d0.y || 0.5) + 1, 3);
        const a = add(spawnQuad(kit('dalmatian'), x, y, z, yw + Math.PI)); a.type = 'yarddog'; a.home = { x, z, r: 2.0 }; a.name = 'Sparky';
        AF.addInteract({ x, y: y + 0.6, z, r: 2.2, label: 'Pet Sparky the firehouse dalmatian', act: () => { a.wag = 4; AF.emit('toast', "Sparky wags so hard his whole back end wiggles."); }, update: a });
      }
    }
    // ---- yard dogs + porch cats at houses
    const houses = AF.buildings.filter((b) => /house|home|brownstone|rowhouse|apartment|tenement/i.test(b.kind + ' ' + b.id) && b.doors && b.doors.length);
    const CATS = [{ col: 0xe0923a, col2: 0xb8642a, stripes: true, bib: true }, { col: 0x2a2624, socks: true, bib: true, eye: 0xe8c23a }, { col: 0x8a8680, col2: 0x5a5650, stripes: true }, { col: 0xf1ede2, eye: 0x6aa0d8 }, { col: 0x5a4a3e, col2: 0x3a2e26, stripes: true, socks: true }];
    const catGeos = CATS.map(catGeo), tailCat = CATS.map((c) => tailGeo(7, c.col, c.stripes ? c.col2 : null));
    let ci = 0;
    houses.forEach((h, i) => {
      const d = h.doors[0], yw = d.yaw || 0, fx = Math.sin(yw), fz = Math.cos(yw), rx = Math.cos(yw), rz = -Math.sin(yw);
      if (i % 4 === 1 && ci < 12) { // cat on the porch beside the door, facing the street
        const x = d.x + fx * 1.4 + rx * 1.1, z = d.z + fz * 1.4 + rz * 1.1, y = AF.surfaceBelow(x, z, 3, 3);
        if (!AF.boxBlocked(x, y, z, 0.15, 0.6)) {
          const k = ci % CATS.length, root = new THREE.Group(), body = mesh(catGeos[k]), tail = mesh(tailCat[k], false);
          root.add(body); tail.position.set(0, 0.06, -0.3); tail.rotation.x = -1.35; root.add(tail);
          root.position.set(x, y, z); root.rotation.y = yw + Math.PI; AF.scene.add(root);
          add({ type: 'cat', root, body, tail, x, y, z, yaw: yw + Math.PI, t: R() * 9, phase: R() * 6 }); ci++;
        }
      }
      if (i % 7 === 3) { // yard dog lying on the lawn near the walk
        const x = d.x - fx * 1.2 + rx * 2.6, z = d.z - fz * 1.2 + rz * 2.6, y = AF.surfaceBelow(x, z, 3, 3);
        if (!AF.boxBlocked(x, y, z, 0.3, 0.6)) { const a = add(spawnQuad(kit(['golden', 'beagle', 'terrier'][i % 3]), x, y, z, yw + Math.PI)); a.type = 'yarddog'; a.home = { x, z, r: 2.2 }; }
      }
    });
    // ---- alley cats at the 'cat' spots other owners registered (Main Street alleys), guarded
    { let ai = 0;
      for (const s of (AF.spots || []).filter((q) => q && q.kind === 'cat' && Number.isFinite(q.x) && Number.isFinite(q.z))) {
        if (ai >= 10) break;
        const y = Number.isFinite(s.y) ? AF.surfaceBelow(s.x, s.z, s.y + 0.6, 2) : AF.surfaceBelow(s.x, s.z, 3, 3);
        if (!Number.isFinite(y) || AF.boxBlocked(s.x, y, s.z, 0.15, 0.5)) continue;
        const k = (ci + ai + 2) % CATS.length, root = new THREE.Group(), body = mesh(catGeos[k]), tail = mesh(tailCat[k], false);
        root.add(body); tail.position.set(0, 0.06, -0.3); tail.rotation.x = -1.35; root.add(tail);
        const yw = Number.isFinite(s.yaw) ? s.yaw : R() * 6.28;
        root.position.set(s.x, y, s.z); root.rotation.y = yw; AF.scene.add(root);
        add({ type: 'cat', root, body, tail, x: s.x, y, z: s.z, yaw: yw, t: R() * 9, phase: R() * 6 }); ai++;
      }
    }
    // ---- cats on the square: one on the Town Hall steps, one in the bakery window
    // ---- ducks: pond + lake
    const ducks = [];
    const mallardM = duckGeo({ body: 0x9a8a78, head: 0x2f6a3a, neck: 0xf1ede2, wing: 0x7a6a5a, tail: 0x2a2624 }), mallardF = duckGeo({ body: 0x9a7a58, head: 0x8a6a48, wing: 0x7a5a3e, tail: 0x6a4a30 }), white = duckGeo({ body: 0xf4f1e8, head: 0xf4f1e8, wing: 0xe8e4da }), ducklingG = duckGeo({ body: 0xe8d070, head: 0xe0c060, wing: 0xd8b858 });
    const addDuck = (x, z, y, cx, cz, rr, g, scale, leader, lag) => {
      const me = mesh(g); me.scale.setScalar(scale); me.position.set(x, y, z); AF.scene.add(me);
      const a = add({ type: 'duck', root: me, x, z, y, cx, cz, rr, ang: Math.atan2(z - cz, x - cx), dir: R() < 0.5 ? 1 : -1, speed: 0.25 + R() * 0.2, t: R() * 9, leader, lag, trail: [] });
      ducks.push(a); return a;
    };
    const PD = PL.pond, pondY = (AF.land && AF.land.POND_Y != null ? AF.land.POND_Y : 0) - 0.06;
    for (let i = 0; i < 5; i++) { const a = R() * TAU, rr = 2.5 + R() * (PD.r - 4.5); addDuck(PD.cx + Math.cos(a) * rr, PD.cz + Math.sin(a) * rr, pondY, PD.cx, PD.cz, rr, [mallardM, mallardF, white][i % 3], 1, null, 0); }
    { const mom = ducks[1]; let lead = mom; for (let i = 0; i < 4; i++) lead = addDuck(mom.x, mom.z, pondY, PD.cx, PD.cz, mom.rr, ducklingG, 0.55, lead, 0.55); }
    const LK = PL.lake, lakeY = (LK.waterY ?? -1.25) - 0.06;
    for (let i = 0; i < 9; i++) { const a = R() * TAU, f = 0.35 + R() * 0.45, x = LK.cx + Math.cos(a) * LK.rx * f, z = LK.cz + Math.sin(a) * LK.rz * f; const d = addDuck(x, z, lakeY, LK.cx, LK.cz, 0, [mallardM, mallardF, white][i % 3], 1, null, 0); d.ell = [LK.rx * f, LK.rz * f]; }
    { const mom = ducks[ducks.length - 2]; let lead = mom; for (let i = 0; i < 5; i++) { lead = addDuck(mom.x, mom.z, lakeY, LK.cx, LK.cz, 0, ducklingG, 0.55, lead, 0.5); } }
    K.ducks = ducks;
    // ---- PIGEONS in flocks (Civic Plaza, Central Park, Harbour Square, a few sidewalks + any 'pigeon' spots) and GULLS perched on the quay
    const PIG = { body: 0x8a8e96, dark: 0x5a5e66, neck: 0x5f7a78, beak: 0x3a3a3a, light: 0xa8acb2, feet: 0xd06a5a };
    const pg = [birdGeo(PIG, 0), birdGeo(PIG, 1), birdGeo(PIG, 2)];
    const GULL = { body: 0xf4f2ec, dark: 0x9aa0a8, neck: 0xf4f2ec, beak: 0xe8b830, light: 0xffffff, feet: 0xe0a040 };
    const gl = [birdGeo(GULL, 0), birdGeo(GULL, 1), birdGeo(GULL, 2)];
    const flocks = K.flocks = [];
    const flockAt = (cx, cz, n, spread, gull, fy) => {
      const F = { cx, cz, scatter: -99, members: [], gull: !!gull }; flocks.push(F);
      for (let i = 0; i < n; i++) {
        const x = cx + (R() - 0.5) * spread, z = cz + (R() - 0.5) * spread * 0.8;
        const y = fy != null ? fy : AF.surfaceBelow(x, z, 12, 16); if (!Number.isFinite(y) || (fy == null && AF.boxBlocked(x, y + 0.02, z, 0.08, 0.2))) continue;
        const me = mesh(gull ? gl[0] : pg[0], false); if (gull) me.scale.setScalar(1.45); me.position.set(x, y, z); me.rotation.y = R() * TAU; AF.scene.add(me);
        F.members.push(add({ type: 'pigeon', gull: !!gull, flock: F, root: me, geos: gull ? gl : pg, x, y, z, hx: x, hz: z, gy: y, yaw: me.rotation.y, t: R() * 9, state: 'ground', fly: 0 }));
      }
    };
    const pspots = S.filter((q) => q && q.kind === 'pigeon' && Number.isFinite(q.x));
    for (const q of pspots.slice(0, 12)) flockAt(q.x, q.z, 3, 1.6, false);
    const PZ = PL.plaza, PK = PL.park;
    for (const [x, z, n, sp] of [[-41, -30, pspots.length >= 6 ? 4 : 10, 7], [-50, -58, pspots.length >= 6 ? 3 : 6, 5], [PK.x0 + 111, PK.z1 - 25, 7, 6], [-36, -205, 6, 5], [0, 192, 8, 7], [-20, 186, 5, 4], [8.5, 42, 5, 1.6], [-120, 8.5, 5, 1.6], [60, -171.5, 5, 1.6], [-171.5, 110, 5, 1.6]])
      flockAt(x, z, n, sp, false);
    // R2: THE PIGEON LADY on Civic Plaza (in the "Explore on foot" spawn frame): an old dear in a lilac coat tossing crumbs to 30 pigeons
    { const PK2 = AF.peopleKit;
      let lx = -33, lz = -36; for (const [x, z] of [[-33, -36], [-30, -40], [-36, -33], [-26, -36]]) { const y = AF.W.groundY(x, z); if (!AF.boxBlocked(x, y + 0.3, z, 0.4, 1.4)) { lx = x; lz = z; break; } }
      if (PK2 && PK2.buildPerson && PK2.makeLook) {
        const L = PK2.makeLook('grandma', 'f', 'elder', AF.rng(51)); L.propR = 'bag'; L.hat = 'cloche'; L.hatCol = 0x6a3b5c; L.hatCol2 = 0x3a1f30; L.glasses = 'gold';
        const pr = PK2.buildPerson(L), gy = AF.W.groundY(lx, lz); pr.root.position.set(lx, gy, lz); pr.root.rotation.y = Math.PI * 0.8; AF.scene.add(pr.root);
        add({ type: 'pigeonlady', root: pr.root, pr, x: lx, z: lz, y: gy, t: 0 });
      }
      const n0 = flocks.length; flockAt(lx + 0.4, lz + 2.6, 30, 6.5, false);
      const F = flocks[n0]; if (F) F.lady = true;
    }
    // perched gulls: quay edge + pier ends + 'gull' spots
    const gspots = S.filter((q) => q && q.kind === 'gull' && Number.isFinite(q.x));
    for (const q of gspots.slice(0, 24)) flockAt(q.x, q.z, 1, 0.01, true, Number.isFinite(q.y) ? q.y : undefined);
    for (const x of [-120, -60, 70, 100, 180, 230]) flockAt(x, (PL.harbour.coastZ || 210) - 0.8, 2, 3, true);
    // Harbour Square bollards (15-harbour-2: x = -296 + 3k + 0.5 for k % 4 == 2, z = coast - 1.3, top y ~0.88) + the Pleasure Pier rail (top y 1.25)
    { const CZ = PL.harbour.coastZ || 210; for (const k of [86, 94, 98, 106, 110]) flockAt(-296 + 3 * k + 0.5, CZ - 1.3, 1, 0.01, true, 0.9);
      const PPr = (PL.harbour.piers || []).find((q) => q.id === 'pleasure'); if (PPr) for (let z = CZ + 8; z < PPr.z1 - 4; z += 11) flockAt(PPr.x0 + 0.12, z, 1, 0.01, true, 1.27); }
    // ---- gulls circling over the harbour + ships
    const gullFly = [birdGeo(GULL, 1), birdGeo(GULL, 2)];
    for (let i = 0; i < 16; i++) {
      const me = mesh(gullFly[i % 2], false); me.scale.setScalar(1.5); AF.scene.add(me);
      const cx = -200 + R() * 440, cz = 225 + R() * 55;
      add({ type: 'gullfly', root: me, geos: gullFly, cx, cz, r: 8 + R() * 18, y: 9 + R() * 18, w: (R() < 0.5 ? -1 : 1) * (0.25 + R() * 0.2), ang: R() * TAU, t: R() * 9 });
    }
    // ---- ducks / swans at the 'duck' spots (streets-park: Swan Lake + the skating pond), paddling small circles
    { const sw = duckGeo({ body: 0xfbfaf6, head: 0xfbfaf6, neck: 0xfbfaf6, wing: 0xf0eee8, tail: 0xf4f2ec }), md = duckGeo({ body: 0x9a8a78, head: 0x2f6a3a, neck: 0xf1ede2, wing: 0x7a6a5a, tail: 0x2a2624 });
      for (const q of S.filter((q) => q && q.kind === 'duck' && Number.isFinite(q.x) && Number.isFinite(q.y) && Number.isFinite(q.z)).slice(0, 16)) {
        const me = mesh(q.swan ? sw : md); me.scale.setScalar(q.swan ? 1.9 : 1); me.position.set(q.x, q.y - 0.06, q.z); AF.scene.add(me);
        add({ type: 'duck', swan: !!q.swan, spotDuck: true, root: me, x: q.x, z: q.z, y: q.y - 0.06, cx: q.x, cz: q.z, rr: 1.2 + R() * 1.2, ang: R() * TAU, dir: R() < 0.5 ? 1 : -1, speed: 0.1 + R() * 0.1, t: R() * 9, leader: null, lag: 0, trail: [] });
      } }
    // ---- rooftop coop pigeons (residential AF.res.coops = [x, z, topY]): perch, then now and then circle the block
    { const coops = ((AF.res && AF.res.coops) || []).filter((c) => Array.isArray(c) && c.length >= 3 && c.every(Number.isFinite));
      const inB5 = (c) => c[0] > -232 && c[0] < -173 && c[1] > 88 && c[1] < 147;
      coops.sort((a, b) => (inB5(a) ? 0 : 1) - (inB5(b) ? 0 : 1));
      coops.slice(0, 3).forEach((c) => {
        const F = { cx: c[0], cz: c[1], y: c[2] - 1.5 + 0.02, start: -99, members: [] };
        for (let i = 0; i < 6; i++) {
          const me = mesh(pg[0], false); AF.scene.add(me);
          const px = c[0] - 1.2 + (i % 3) * 1.2 + (R() - 0.5) * 0.3, pz = c[1] + (i < 3 ? -1.25 : 1.25);
          me.position.set(px, F.y, pz);
          F.members.push(add({ type: 'coopbird', flock: F, root: me, geos: pg, x: px, z: pz, px, pz, ph: i / 6 * TAU + R() * 0.4, t: R() * 9, r: 14 + R() * 8 }));
        }
        K.coopFlocks = (K.coopFlocks || []).concat([F]);
      }); }
    // ---- geese V formations
    const GOOSE = { body: 0x8a7e70, dark: 0x3a3430, neck: 0x1f1d1c, headC: 0x1f1d1c, beak: 0x1f1d1c, light: 0xd8d0c4, cheek: 0xf1ede2, big: true, noFeet: true };
    const gg = [birdGeo(GOOSE, 1), birdGeo(GOOSE, 2)];
    for (let f = 0; f < 2; f++) {
      const grp = new THREE.Group(); AF.scene.add(grp);
      const members = [];
      for (let i = 0; i < 9; i++) { const side = i === 0 ? 0 : (i % 2 ? 1 : -1), rank = Math.ceil(i / 2); const me = mesh(gg[i % 2], false); me.position.set(side * rank * 1.6, (R() - 0.5) * 0.4, -rank * 1.9); me.scale.setScalar(1.3); grp.add(me); members.push({ me, off: R() * 6 }); }
      add({ type: 'geese', root: grp, members, geos: gg, t: f * 70, period: 95 + f * 30, y: 58 + f * 9, f });
    }
    // ---- a police horse standing at Civic Plaza (mounted patrol's rest spot)
    { const x = -14, z = -60, y = AF.surfaceBelow(x, z, 3, 4);
      if (Number.isFinite(y) && !AF.boxBlocked(x, y + 0.1, z, 0.5, 1.2)) { const a = add(spawnQuad(kit('horse'), x, y, z, Math.PI / 2)); a.type = 'grazer'; a.species = 'horse'; a.rect = null; a.home = { x, z, r: 1.2 }; a.speed = 0.3; a.wait = R() * 8;
        // R2: the mounted patrolman rides him (child of the horse root, legs astride)
        const PK2 = AF.peopleKit;
        if (PK2 && PK2.buildPerson && PK2.makeLook) { try {
          const L = PK2.makeLook('police', 'm', 'adult', AF.rng(1936)); L.moustache = true; L.glasses = null; L.top = Object.assign({}, L.top, { cuffs: true, cuff: 0xf6f4ee });
          const pr = PK2.buildPerson(L), S = SPEC.horse;
          pr.root.position.set(0, (S.lh + S.bh) * VS - pr.hipY + 0.04, -0.05); pr.legL.rotation.set(-0.35, 0, 0.42); pr.legR.rotation.set(-0.35, 0, -0.42);
          pr.armL.rotation.x = -0.75; pr.armR.rotation.x = -0.75; a.root.add(pr.root); a.rider = pr;
          a.root.scale.setScalar(1.35); pr.root.scale.setScalar(1 / 1.35); pr.root.position.y = (S.lh + S.bh) * VS + 0.03 - pr.hipY / 1.35;   // a proper police mount, withers ~1.7 m
        } catch (e) { console.warn('[af] rider', e); } } } }
    // ---- swans on Swan Lake
    { const LK = PL.lake, lakeY = (LK.waterY ?? -1.25) - 0.06, sw = duckGeo({ body: 0xfbfaf6, head: 0xfbfaf6, neck: 0xfbfaf6, wing: 0xf0eee8, tail: 0xf4f2ec });
      for (let i = 0; i < 6; i++) { const a = R() * TAU, f = 0.3 + R() * 0.5, x = LK.cx + Math.cos(a) * LK.rx * f, z = LK.cz + Math.sin(a) * LK.rz * f; const me = mesh(sw); me.scale.setScalar(1.9); me.position.set(x, lakeY, z); AF.scene.add(me);
        const d = add({ type: 'duck', swan: true, root: me, x, z, y: lakeY, cx: LK.cx, cz: LK.cz, rr: 0, ang: a, dir: i % 2 ? 1 : -1, speed: 0.12 + R() * 0.08, t: R() * 9, leader: null, lag: 0, trail: [] }); d.ell = [LK.rx * f, LK.rz * f]; } }
    // ---- R2: a gull MOB wheeling over the Fish Pier (-91, 230) + gulls trailing along the quay, bigger so they read from the air
    { const FP = (PL.harbour && (PL.harbour.piers || []).find((q) => /fish/i.test(q.id || ''))) || null;
      const fx = FP ? (FP.x0 + FP.x1) / 2 : -91, fz = FP ? Math.min(FP.z1, 250) - 8 : 230;
      for (let i = 0; i < 14; i++) {
        const me = mesh(gullFly[i % 2], false); me.scale.setScalar(1.9); AF.scene.add(me);
        add({ type: 'gullfly', root: me, geos: gullFly, cx: fx + (R() - 0.5) * 10, cz: fz + (R() - 0.5) * 10, r: 5 + R() * 12, y: 7 + R() * 16, w: (R() < 0.5 ? -1 : 1) * (0.35 + R() * 0.3), ang: R() * TAU, t: R() * 9 });
      }
      for (let i = 0; i < 10; i++) {
        const me = mesh(gullFly[i % 2], false); me.scale.setScalar(2.1); AF.scene.add(me);
        add({ type: 'gullfly', root: me, geos: gullFly, cx: -160 + R() * 340, cz: 150 + R() * 70, r: 20 + R() * 30, y: 26 + R() * 22, w: (R() < 0.5 ? -1 : 1) * (0.12 + R() * 0.1), ang: R() * TAU, t: R() * 9 });
      } }
    // ---- R2: pigeons wheeling round the City Hall dome and the tallest tower's crown (always something in the sky over downtown)
    { const bs = AF.buildings || [], ch = bs.find((b) => b.id === 'cityhall');
      let tall = null; for (const b of bs) if (b && b.box && b.id !== 'cityhall' && (!tall || b.box[4] > tall.box[4])) tall = b;
      for (const b of [ch, tall]) {
        if (!b || !b.box) continue;
        const cx = (b.box[0] + b.box[3]) / 2, cz = (b.box[2] + b.box[5]) / 2, top = b.box[4], rr = Math.max(9, Math.min(22, Math.max(b.box[3] - b.box[0], b.box[5] - b.box[2]) * 0.55));
        const w = (R() < 0.5 ? -1 : 1) * 0.42;
        for (let i = 0; i < 12; i++) {
          const me = mesh(pg[1], false); me.scale.setScalar(1.25); AF.scene.add(me);
          add({ type: 'gullfly', pigeonWheel: true, root: me, geos: [pg[1], pg[2]], cx, cz, r: rr + (R() - 0.5) * 4, y: top - 4 + R() * 7, w: w * (0.9 + R() * 0.2), ang: i / 12 * 2.4 + R() * 0.25, t: R() * 9 });
        }
      } }
    // ---- R2: a STARLING MURMURATION over the harbour front at dusk (17.2-19.9 h): 520 birds in one instanced draw, a morphing cloud
    { const N = AF.GFX && AF.GFX.tier === 'low' ? 320 : 760;
      const g = new THREE.BufferGeometry();
      // a tiny gull-wing V (span 0.34 m) in the xz plane, tips raised; scaling y per instance makes the flock shimmer
      g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, 0, 0.09, -0.17, 0.05, -0.02, 0, 0, -0.06, 0, 0, 0.09, 0, 0, -0.06, 0.17, 0.05, -0.02]), 3));
      g.computeVertexNormals();
      const mat = new THREE.MeshBasicMaterial({ color: 0x17161a, side: THREE.DoubleSide, fog: false });
      const im = new THREE.InstancedMesh(g, mat, N); im.frustumCulled = false; im.count = 0; im.name = 'murmuration'; im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); AF.scene.add(im);
      const off = new Float32Array(N * 4);
      for (let i = 0; i < N; i++) { let x, y, z; do { x = R() * 2 - 1; y = R() * 2 - 1; z = R() * 2 - 1; } while (x * x + y * y + z * z > 1); off[i * 4] = x; off[i * 4 + 1] = y; off[i * 4 + 2] = z; off[i * 4 + 3] = R() * TAU; }
      add({ type: 'murmur', root: im, off, N, t: 0 });
    }
    K._kit = kit;
    K.stats = { animals: animals.length, ms: Math.round(performance.now() - t0), ducks: ducks.length };
    console.log('[af] animals', JSON.stringify(K.stats));
  });

  AF.onBuild('animals-dogwalk', 665, () => { try {
    // ---- R2: CROWD DOG WALKERS: every 31st ambient walker has a Scottie or a terrier on a leash (instanced: 6 draws + 1 leash line draw)
    { const CRW = AF.peopleKit && AF.peopleKit.crowd;
      if (CRW && CRW.walkers && CRW.walkers.length) {
        const mergeG = (list) => {   // [geo, x, y, z] with the voxel attributes
          let nv = 0, ni = 0; for (const [g] of list) { nv += g.attributes.position.count; ni += g.index.count; }
          const P = new Float32Array(nv * 3), U = new Int16Array(nv * 2), Lp = new Uint16Array(nv), N = new Uint8Array(nv), I = nv > 65535 ? new Uint32Array(ni) : new Uint16Array(ni);
          let vo = 0, io = 0;
          for (const [g, ox, oy, oz] of list) { const pa = g.attributes.position.array, c = g.attributes.position.count;
            for (let i = 0; i < c; i++) { P[(vo + i) * 3] = pa[i * 3] + ox; P[(vo + i) * 3 + 1] = pa[i * 3 + 1] + oy; P[(vo + i) * 3 + 2] = pa[i * 3 + 2] + oz; }
            U.set(g.attributes.aBU.array, vo * 2); Lp.set(g.attributes.aPal.array, vo); N.set(g.attributes.aAN.array, vo);
            const gi = g.index.array; for (let k = 0; k < gi.length; k++) I[io + k] = gi[k] + vo; vo += c; io += gi.length; }
          const out = new THREE.BufferGeometry(); out.setAttribute('position', new THREE.BufferAttribute(P, 3)); out.setAttribute('aBU', new THREE.BufferAttribute(U, 2));
          out.setAttribute('aPal', new THREE.BufferAttribute(Lp, 1)); out.setAttribute('aAN', new THREE.BufferAttribute(N, 1)); out.setIndex(new THREE.BufferAttribute(I, 1)); out.computeBoundingSphere(); return out;
        };
        const DW = K.dogWalk = { dogs: [], ims: [], line: null };
        const breeds = ['scottie', 'terrier'];
        for (const b of breeds) { const k = K._kit(b), S = k.S, hy = (S.lh + S.bh - 2 + (S.neck || 0)) * VS, hz = (S.len / 2 - 1) * VS;
          DW.ims.push([k.A, k.B, k.C].map((g) => { const mg = mergeG([[g, 0, 0, 0], [k.H, 0, hy, hz]]); const im = new THREE.InstancedMesh(mg, AF.mat.voxel, 24); im.count = 0; im.frustumCulled = false; im.castShadow = true; im.receiveShadow = true; im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); AF.scene.add(im); return im; })); }
        let n = 0;
        for (let i = 5; i < CRW.walkers.length && n < 18; i += 31) { const w = CRW.walkers[i]; if (w.lead) continue; DW.dogs.push({ w, b: n % 2, x: 0, z: 0, yaw: 0, ph: Math.random() * 4 }); n++; }
        const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(DW.dogs.length * 6), 3));
        DW.line = new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: 0x3a2a1c })); DW.line.frustumCulled = false; AF.scene.add(DW.line);
        animals.push({ type: 'dogwalk', root: DW.line, t: 0 });
      } }
  } catch (e) { console.warn('[af] dog walkers', e); } });
  // ------------------------------------------------------------ tick
  const playerPos = () => { const P = AF.player; if (AF.mode === 'walk' && P && P.x != null) return { x: P.x, y: P.y, z: P.z, walk: true }; const c = AF.camera.position; return { x: c.x, y: c.y, z: c.z, walk: false }; };
  const V = new THREE.Vector3();
  function moveQuad(a, tx, tz, sp, dt) {
    const dx = tx - a.x, dz = tz - a.z, d = Math.hypot(dx, dz);
    if (d < 0.15) return false;
    const st = Math.min(d, sp * dt); a.x += dx / d * st; a.z += dz / d * st; a.tyaw = Math.atan2(dx, dz);
    a.phase += dt * sp * 9;
    const k = a.kit; const g = Math.floor(a.phase) % 2 ? k.B : k.C; if (a.body.geometry !== g) a.body.geometry = g;
    a.y += (AF.surfaceBelow(a.x, a.z, a.y + 0.6, 3) - a.y) * Math.min(1, dt * 10);
    return true;
  }
  // R2 starling murmuration: a centroid drifting over the harbour front, a morphing ellipsoid (stretch / fold / travelling wave)

  function murmurTick(a, t) {
    const h = AF.time ? AF.time.hours : 12, im = a.root;
    const k = Math.max(0, Math.min(1, (h - 17.2) / 0.3, (19.9 - h) / 0.4));
    const n = Math.floor(a.N * k); if (im.count !== n) im.count = n;
    if (!n) { if (im.visible) im.visible = false; return; }
    if (!im.visible) im.visible = true;
    // the centroid loops between the harbour front and the Great White Way at 42-62 m: in the 80 m aerial AND over the quay views
    const T = t * 0.6, cx = 5 + Math.sin(T * 0.05) * 32, cy = 52 + Math.sin(T * 0.11) * 8, cz = 125 + Math.cos(T * 0.037) * 32; a.c = a.c || {}; a.c.x = cx; a.c.y = cy; a.c.z = cz;
    const sx = 15 + 8 * Math.sin(T * 0.13), sy = 4.5 + 3 * Math.sin(T * 0.21 + 1), sz = 9 + 6 * Math.cos(T * 0.17), rot = T * 0.07 + Math.sin(T * 0.05) * 2;
    const cr = Math.cos(rot), sr = Math.sin(rot), o = a.off, arr = im.instanceMatrix.array;
    for (let i = 0; i < n; i++) {
      const ox = o[i * 4], oy = o[i * 4 + 1], oz = o[i * 4 + 2], ph = o[i * 4 + 3];
      let x = ox * sx + Math.sin(oz * 2.2 + T * 0.7) * 7, y = oy * sy + Math.sin(ox * 3 + T * 1.3) * 3.5 + Math.sin(oz * 4 + T * 0.9) * 1.5, z = oz * sz + Math.sin(ox * 1.7 - T * 0.5) * 4;
      x += Math.sin(t * 1.3 + ph) * 0.6; y += Math.cos(t * 1.1 + ph * 2) * 0.4;
      const wx = cx + x * cr - z * sr, wz = cz + x * sr + z * cr;
      const fl = 0.35 + 0.65 * Math.abs(Math.sin(t * 17 + ph * 3)), yaw = rot + ph * 0.15 + Math.PI / 2;
      const c = Math.cos(yaw) * 2.9, s2 = Math.sin(yaw) * 2.9, j = i * 16;
      arr[j] = c; arr[j + 1] = 0; arr[j + 2] = -s2; arr[j + 3] = 0; arr[j + 4] = 0; arr[j + 5] = fl * 2.9; arr[j + 6] = 0; arr[j + 7] = 0;
      arr[j + 8] = s2; arr[j + 9] = 0; arr[j + 10] = c; arr[j + 11] = 0; arr[j + 12] = wx; arr[j + 13] = cy + y; arr[j + 14] = wz; arr[j + 15] = 1;
    }
    im.instanceMatrix.needsUpdate = true;
  }
  K.murmurTick = murmurTick;
  function dogWalkTick(dt) {
    const DW = K.dogWalk; if (!DW) return;
    const cnt = [[0, 0, 0], [0, 0, 0]], la = DW.line.geometry.attributes.position.array; let li = 0;
    for (const d of DW.dogs) {
      const w = d.w; if (!w.act || w.x === 0) continue;
      const s = Math.sin(w.yaw), c = Math.cos(w.yaw), tx = w.x + s * 0.75 + c * 0.55, tz = w.z + c * 0.75 - s * 0.55;   // trots a little ahead, on the walker's right
      const dd = Math.hypot(tx - d.x, tz - d.z); if (dd > 4) { d.x = tx; d.z = tz; } else { d.x += (tx - d.x) * Math.min(1, dt * 6); d.z += (tz - d.z) * Math.min(1, dt * 6); }
      d.yaw += AF.angDiff(d.yaw, w.moving ? w.yaw : d.yaw + Math.sin(d.ph + w.id) * 0.02) * Math.min(1, dt * 6); d.ph += dt * (w.moving ? 9 : 0);
      const f = w.moving ? 1 + (Math.floor(d.ph) & 1) : 0, im = DW.ims[d.b][f], j = cnt[d.b][f]++;
      if (j >= 24) continue;
      const y = w.y, cy = Math.cos(d.yaw), sy = Math.sin(d.yaw), a = im.instanceMatrix.array, o = j * 16;
      a[o] = cy; a[o + 1] = 0; a[o + 2] = -sy; a[o + 3] = 0; a[o + 4] = 0; a[o + 5] = 1; a[o + 6] = 0; a[o + 7] = 0; a[o + 8] = sy; a[o + 9] = 0; a[o + 10] = cy; a[o + 11] = 0; a[o + 12] = d.x; a[o + 13] = y; a[o + 14] = d.z; a[o + 15] = 1;
      // leash: walker's right hand -> collar
      la[li++] = w.x + c * 0.3; la[li++] = y + 0.72; la[li++] = w.z - s * 0.3; la[li++] = d.x + sy * 0.3; la[li++] = y + 0.36; la[li++] = d.z + cy * 0.3;
    }
    for (let b = 0; b < 2; b++) for (let f = 0; f < 3; f++) { const im = DW.ims[b][f], n = Math.min(24, cnt[b][f]); im.count = n; im.visible = n > 0; if (n) im.instanceMatrix.needsUpdate = true; }
    DW.line.geometry.setDrawRange(0, li / 3); DW.line.geometry.attributes.position.needsUpdate = true;
  }
  const animalsTick = (dt, t) => {
    if (!animals.length) return;
    const cam = AF.camera.position, pp = playerPos();
    for (const a of animals) {
      a.t = (a.t || 0) + dt;
      if (a.type === 'geese') { // always visible in the sky
        const u = ((t + a.t * 0) % a.period) / a.period, L = 900, x = -450 + u * L;
        const ang = a.f ? 0.6 : -0.35;
        a.root.position.set(Math.cos(ang) * x, a.y + Math.sin(t * 0.3 + a.f) * 1.5, Math.sin(ang) * x + (a.f ? -60 : 40));
        a.root.rotation.y = Math.atan2(Math.cos(ang), Math.sin(ang));
        for (const m of a.members) { const ph = Math.floor((t * 3.2 + m.off)) % 2; m.me.geometry = a.geos[ph]; }
        continue;
      }
      if (a.type === 'murmur') { murmurTick(a, t); continue; }
      if (a.type === 'dogwalk') { dogWalkTick(dt); continue; }
      const ref = a.root.position;
      const dc = Math.hypot((a.x ?? ref.x) - cam.x, (a.z ?? ref.z) - cam.z);
      const vis = dc < (a.type === 'gullfly' ? 340 : 200); if (a.root.visible !== vis) a.root.visible = vis; if (a.leash) a.leash.visible = vis;
      if (dc < 140) { const m0 = a.body || a.root; if (m0.layers.mask !== 1 || (a.head && a.head.layers.mask !== 1)) a.root.traverse((o) => { if (o.isMesh && o.layers.mask !== 1) o.layers.set(0); }); }   // workaround for AF.CULL layer-31 restore bug
      if (!vis && a.type !== 'dog') continue;
      switch (a.type) {
        case 'dog': {
          const o = a.owner; if (!o) break;
          const oy = o.yaw, bx = o.x - Math.sin(oy) * 0.4 + Math.cos(oy) * 1.0, bz = o.z - Math.cos(oy) * 0.4 - Math.sin(oy) * 1.0;
          const d = Math.hypot(bx - a.x, bz - a.z);
          if (d > 12) { a.x = bx; a.z = bz; a.y = o.y; }
          const moving = d > 0.5 && moveQuad(a, bx, bz, Math.min(3.5, 0.8 + d * 1.6), dt);
          if (!moving) { if (a.body.geometry !== a.kit.A) a.body.geometry = a.kit.A; a.tyaw = oy; }
          a.yaw += AF.angDiff(a.yaw, a.tyaw) * Math.min(1, dt * 8);
          a.root.position.set(a.x, a.y, a.z); a.root.rotation.y = a.yaw;
          a.head.rotation.y = Math.sin(a.t * 0.8) * 0.4; if (a.tail) a.tail.rotation.z = Math.sin(a.t * 14) * 0.5;
          if (vis && o.parts) { // leash from the owner's right hand to the collar
            o.parts.armR.updateWorldMatrix(true, false); V.set(0, -o.parts.B.ah * VS + 0.05, 0.05).applyMatrix4(o.parts.armR.matrixWorld);
            const arr = a.leash.geometry.attributes.position.array; arr[0] = V.x; arr[1] = V.y; arr[2] = V.z;
            a.head.updateWorldMatrix(true, false); V.set(0, 0.08, 0.05).applyMatrix4(a.head.matrixWorld); arr[3] = V.x; arr[4] = V.y; arr[5] = V.z;
            a.leash.geometry.attributes.position.needsUpdate = true;
          }
          break;
        }
        case 'yarddog': {
          const dp = Math.hypot(pp.x - a.x, pp.z - a.z);
          if (dp < 6 && pp.walk) { a.tyaw = Math.atan2(pp.x - a.x, pp.z - a.z); a.wag = Math.max(a.wag || 0, 1); }
          a.wait = (a.wait ?? 0) - dt;
          if (a.wait <= 0) { a.wait = 4 + Math.random() * 10; const ang = Math.random() * TAU, r = Math.random() * a.home.r; a.tx = a.home.x + Math.cos(ang) * r; a.tz = a.home.z + Math.sin(ang) * r; }
          const moving = a.tx != null && moveQuad(a, a.tx, a.tz, 1.1, dt);
          if (!moving && a.body.geometry !== a.kit.A) a.body.geometry = a.kit.A;
          a.yaw += AF.angDiff(a.yaw, a.tyaw) * Math.min(1, dt * 5);
          a.root.position.set(a.x, a.y, a.z); a.root.rotation.y = a.yaw;
          if (a.wag > 0) a.wag -= dt;
          if (a.tail) a.tail.rotation.z = Math.sin(a.t * (a.wag > 0 ? 18 : 4)) * (a.wag > 0 ? 0.7 : 0.25);
          a.head.rotation.y = dp < 6 ? AF.clamp(AF.angDiff(a.yaw, Math.atan2(pp.x - a.x, pp.z - a.z)), -0.8, 0.8) : Math.sin(a.t * 0.5) * 0.5;
          break;
        }
        case 'grazer': {
          a.wait -= dt;
          if (a.wait <= 0) {
            a.wait = 6 + Math.random() * 16;
            if (a.rect) { const R = a.rect; a.tx = AF.lerp(R[0] + 2, R[2] - 2, Math.random()); a.tz = AF.lerp(R[1] + 2, R[3] - 2, Math.random()); if (Math.random() < 0.5) { a.tx = a.x + (a.tx - a.x) * 0.25; a.tz = a.z + (a.tz - a.z) * 0.25; } }
            else if (a.home) { const ang = Math.random() * TAU, r = Math.random() * a.home.r; a.tx = a.home.x + Math.cos(ang) * r; a.tz = a.home.z + Math.sin(ang) * r; }
          }
          const moving = a.tx != null && moveQuad(a, a.tx, a.tz, a.speed, dt);
          if (!moving && a.body.geometry !== a.kit.A) a.body.geometry = a.kit.A;
          a.yaw += AF.angDiff(a.yaw, a.tyaw) * Math.min(1, dt * 2);
          a.root.position.set(a.x, a.y, a.z); a.root.rotation.y = a.yaw;
          const graze = !moving && Math.sin(a.t * 0.35 + a.x) > -0.3;
          const tgt = graze ? (a.species === 'horse' || a.species === 'grey' ? 1.15 : 0.75) + Math.sin(a.t * 3) * 0.06 : Math.sin(a.t * 0.7) * 0.1;
          a.head.rotation.x += (tgt - a.head.rotation.x) * Math.min(1, dt * 2);
          a.head.rotation.y = graze ? 0 : Math.sin(a.t * 0.4) * 0.35;
          if (a.tail) a.tail.rotation.z = Math.sin(a.t * 5) * 0.4;
          break;
        }
        case 'cat': {
          const dp = Math.hypot(pp.x - a.x, pp.z - a.z);
          a.tail.rotation.z = Math.sin(a.t * 1.6 + a.phase) * 0.45;
          const look = dp < 7 && pp.walk ? AF.clamp(AF.angDiff(a.yaw, Math.atan2(pp.x - a.x, pp.z - a.z)), -0.9, 0.9) : Math.sin(a.t * 0.3 + a.phase) * 0.3;
          a.body.rotation.y += (look * 0.6 - a.body.rotation.y) * Math.min(1, dt * 3);
          a.body.scale.y = 1 + Math.sin(a.t * 2) * 0.012;
          break;
        }
        case 'duck': {
          if (a.leader) {
            const L = a.leader; L.trail = L.trail || [];
            const tr = L.trail; const n = Math.max(1, Math.round(a.lag / 0.05));
            const p = tr.length > n ? tr[tr.length - 1 - n] : null;
            if (p) { a.x = p[0]; a.z = p[1]; a.yaw = p[2]; }
          } else if (a.ell) {
            a.ang += a.dir * dt * a.speed / Math.max(a.ell[0], a.ell[1]);
            const nx = a.cx + Math.cos(a.ang) * a.ell[0], nz = a.cz + Math.sin(a.ang) * a.ell[1];
            a.yaw = Math.atan2(nx - a.x, nz - a.z); a.x = nx; a.z = nz;
          } else {
            a.ang += a.dir * dt * a.speed / Math.max(1.5, a.rr);
            const wob = Math.sin(a.t * 0.2) * 0.8;
            const nx = a.cx + Math.cos(a.ang) * (a.rr + wob), nz = a.cz + Math.sin(a.ang) * (a.rr + wob);
            a.yaw = Math.atan2(nx - a.x, nz - a.z); a.x = nx; a.z = nz;
          }
          a.sampleT = (a.sampleT || 0) + dt; if (a.sampleT > 0.05) { a.sampleT = 0; a.trail = a.trail || []; a.trail.push([a.x, a.z, a.yaw]); if (a.trail.length > 60) a.trail.shift(); }
          a.root.position.set(a.x, a.y + Math.sin(a.t * 2.2 + a.cx) * 0.02, a.z); a.root.rotation.y = a.yaw;
          a.root.rotation.z = Math.sin(a.t * 1.7) * 0.05;
          a.root.rotation.x = Math.sin(a.t * 0.9 + a.z) > 0.93 ? 0.7 : 0; // dabbling
          break;
        }
        case 'coopbird': {
          const F = a.flock, T0 = t || 0, k = T0 - F.start, air = k >= 0 && k < 16;
          if (!air && a === F.members[0] && Math.random() < dt / 40) F.start = T0 + 0.3;
          if (air) {
            const e = Math.min(1, k / 2, (16 - k) / 2), ang = a.ph + k * 0.55;
            a.root.position.set(F.cx + Math.cos(ang) * a.r * e + (a.px - F.cx) * (1 - e), F.y + e * (9 + Math.sin(k + a.ph) * 1.5), F.cz + Math.sin(ang) * a.r * e + (a.pz - F.cz) * (1 - e));
            a.root.rotation.set(-0.15, ang + Math.PI, 0.35, 'YXZ'); a.root.geometry = a.geos[1 + (Math.floor(a.t * 12) % 2)];
          } else {
            a.root.position.set(a.px, F.y, a.pz); a.root.rotation.set(Math.sin(a.t * 3 + a.ph) > 0.6 ? 0.5 : 0, a.ph * 3, 0, 'YXZ'); a.root.geometry = a.geos[0];
          }
          break;
        }
        case 'pigeonlady': {   // a slow underarm toss every ~2.6 s, head following the birds
          const k = ((a.t % 2.6) + 2.6) % 2.6 / 2.6, pr = a.pr;
          pr.armR.rotation.x = k < 0.25 ? -0.2 - k / 0.25 * 1.3 : k < 0.35 ? -1.5 + (k - 0.25) / 0.1 * 1.2 : -0.3;
          pr.armL.rotation.x = -0.35; pr.hips.rotation.x = 0.1 + (k < 0.3 ? k * 0.3 : 0.09); pr.head.rotation.y = Math.sin(a.t * 0.4) * 0.5;
          break;
        }
        case 'gullfly': {
          a.ang += a.w * dt; const x = a.cx + Math.cos(a.ang) * a.r, z = a.cz + Math.sin(a.ang) * a.r;
          a.root.position.set(x, a.y + Math.sin(a.t * 0.7) * 1.2, z); a.root.rotation.set(0, a.ang + (a.w > 0 ? Math.PI : 0), a.w > 0 ? -0.35 : 0.35, 'YXZ');
          a.root.geometry = a.geos[Math.sin(a.t * (a.pigeonWheel ? 13 : 5)) > 0.3 ? 0 : 1];
          break;
        }
        case 'pigeon': {
          const dp = Math.hypot(pp.x - a.hx, pp.z - a.hz), F = a.flock;
          if (a.ox === undefined) { a.ox = a.hx; a.oz = a.hz; a.oy = a.gy; }
          if (a.state === 'ground') {
            const now = AF.clock.t;
            if (F && dp < 4.5 && (pp.walk || pp.y < 4)) { F.scatter = now; F.src = null; F.auto = Math.max(F.auto ?? 0, 30); }
            // R2: now and then a flock bursts up on its own (a cab backfires, a dog runs through) so a still camera sees the take-off + landing
            if (F && a === F.members[0] && !F.lady) { F.auto = (F.auto ?? 25 + Math.random() * 60) - dt; if (F.auto <= 0) { F.auto = 45 + Math.random() * 70; if (dc < 140) { F.scatter = now; const an = Math.random() * TAU; F.src = { x: a.hx + Math.cos(an) * 3, z: a.hz + Math.sin(an) * 3 }; } } }
            const burst = (dp < 3.2 && (pp.walk || pp.y < 4)) || (F && F.scatter > 0 && Math.abs(now - F.scatter) < 0.6);
            // R2: birds that landed away from their flock drift home in short hops now and then (never while someone is close)
            const away = Math.hypot(a.x - a.ox, a.z - a.oz) > 3.5 && dp > 7 && a.t - (a.landT || 0) > 15 && Math.random() < dt / 14;
            if (burst || away) {
              // choose a NEW landing 8-18 m away (away from the player on a burst), on whatever surface is there: pavement, a ledge, an awning, a lamp
              const src = (F && F.src && !(dp < 3.2 && (pp.walk || pp.y < 4))) ? F.src : pp;
              let ax = a.hx - src.x, az = a.hz - src.z; const al = Math.hypot(ax, az) || 1; ax /= al; az /= al;
              let lx = a.x, lz = a.z, ly = a.gy, ok = false;
              for (let k = 0; k < 6 && !ok; k++) {
                let tx, tz;
                if (away) { tx = a.ox + (Math.random() - 0.5) * 3; tz = a.oz + (Math.random() - 0.5) * 3; }
                else { const ang = Math.atan2(az, ax) + (Math.random() - 0.5) * 1.6, r = 8 + Math.random() * 10; tx = a.x + Math.cos(ang) * r; tz = a.z + Math.sin(ang) * r; }
                const y = AF.surfaceBelow(tx, tz, a.gy + 10, 14);
                if (Number.isFinite(y) && y > a.gy - 2.5 && y < a.gy + 9 && !AF.boxBlocked(tx, y + 0.02, tz, 0.08, 0.2)) { lx = tx; lz = tz; ly = y; ok = true; }
              }
              if (!ok && away) { lx = a.ox; lz = a.oz; ly = a.oy; ok = true; }
              a.state = 'fly'; a.fly = 0; a.sx = a.x; a.sz = a.z; a.sy = a.gy; a.lx = lx; a.lz = lz; a.ly = ly; a.landed = ok;
              a.fdur = away ? 2.6 + Math.random() : 4.2 + Math.random() * 1.6; a.peak = away ? 1.8 + Math.random() : 4 + Math.random() * 4;
              if (!ok) { const r = 12; a.lx = a.x + ax * r; a.lz = a.z + az * r; a.ly = a.gy; }
              a.fx = a.lx - a.x; a.fz = a.lz - a.z; a.root.geometry = a.geos[1];
            }
            else {
              a.wait = (a.wait ?? Math.random() * 2) - dt;
              if (a.wait <= 0) { a.wait = 0.6 + Math.random() * 2.5; a.tx = a.hx + (Math.random() - 0.5) * 3; a.tz = a.hz + (Math.random() - 0.5) * 3; if (Math.abs(a.gy - (a.oy ?? a.gy)) > 0.6) { a.tx = a.hx + (Math.random() - 0.5) * 0.4; a.tz = a.hz + (Math.random() - 0.5) * 0.4; } }
              if (a.tx != null) { const dx = a.tx - a.x, dz = a.tz - a.z, d = Math.hypot(dx, dz); if (d > 0.05) { const st = Math.min(d, 0.5 * dt); a.x += dx / d * st; a.z += dz / d * st; a.yaw = Math.atan2(dx, dz); } }
              a.root.position.set(a.x, a.gy + (Math.sin(a.t * 12) > 0.6 ? 0.01 : 0), a.z); a.root.rotation.y = a.yaw;
              a.root.rotation.x = Math.sin(a.t * 3 + a.hx) > 0.5 ? 0.55 : 0;
            }
          } else {
            a.fly += dt;
            const u = Math.min(1, a.fly / a.fdur), e = u * u * (3 - 2 * u);
            // a burst: fast climb, glide, flare and drop onto the landing (wings folded for the last 8%)
            const arc = Math.sin(Math.min(1, u * 1.15) * Math.PI) * a.peak + (u < 0.25 ? u * 4 * 1.2 : 1.2 * Math.max(0, 1 - (u - 0.25) / 0.75));
            const px = a.sx + (a.lx - a.sx) * e, pz = a.sz + (a.lz - a.sz) * e, py = a.sy + (a.ly - a.sy) * e + Math.max(0, arc);
            a.root.geometry = u > 0.92 ? a.geos[1] : u > 0.55 && u < 0.8 ? a.geos[2] : a.geos[1 + (Math.floor(a.t * 14) % 2)];
            a.root.rotation.x = u < 0.3 ? -0.35 : u > 0.85 ? 0.25 : 0; a.root.rotation.y = Math.atan2(a.fx, a.fz);
            a.root.position.set(px, py, pz);
            if (u >= 1) {
              if (F) F.scatter = -99;
              a.x = a.hx = a.lx; a.z = a.hz = a.lz; a.gy = a.ly; a.tx = null; a.landT = a.t; a.wait = 0.5 + Math.random() * 2;
              a.state = 'ground'; a.root.geometry = a.geos[0]; a.root.rotation.x = 0; a.root.position.set(a.x, a.gy, a.z);
            }
          }
          break;
        }
        case 'chicken': {
          a.wait -= dt;
          if (a.wait <= 0) { a.wait = 1 + Math.random() * 3; a.tx = a.hx + (Math.random() - 0.5) * 4; a.tz = a.hz + (Math.random() - 0.5) * 4; a.pecking = Math.random() < 0.5; }
          const dx = a.tx - a.x, dz = a.tz - a.z, d = Math.hypot(dx, dz);
          if (d > 0.08 && !a.pecking) { const st = Math.min(d, 0.9 * dt); a.x += dx / d * st; a.z += dz / d * st; a.yaw = Math.atan2(dx, dz); }
          const peck = a.pecking && Math.sin(a.t * 9) > 0.2;
          a.root.geometry = a.geos[peck ? 1 : 0];
          a.root.position.set(a.x, a.y + (d > 0.08 && !a.pecking ? Math.abs(Math.sin(a.t * 14)) * 0.03 : 0), a.z); a.root.rotation.y = a.yaw;
          break;
        }
        case 'squirrel': {
          const cyc = (a.t % 14) / 14; // 0-0.35 hop around base, 0.35-0.55 climb, 0.55-0.8 sit high, 0.8-1 down
          let h = 0, r = 0.75, pitch = 0;
          if (cyc < 0.35) { a.ang += dt * 0.9 * (Math.sin(a.t * 7) > 0 ? 1 : 0); r = 1.1 + Math.sin(a.t * 0.5) * 0.3; }
          else if (cyc < 0.55) { h = (cyc - 0.35) / 0.2 * 3; r = 0.62; pitch = -1.45; }
          else if (cyc < 0.8) { h = 3; r = 0.62; pitch = -1.45; }
          else { h = (1 - (cyc - 0.8) / 0.2) * 3; r = 0.62; pitch = 1.45; }
          const x = a.tx + Math.cos(a.ang) * r, z = a.tz + Math.sin(a.ang) * r;
          a.root.position.set(x, a.gy + h + (cyc < 0.35 ? Math.abs(Math.sin(a.t * 7)) * 0.08 : 0), z);
          a.root.rotation.set(pitch, cyc < 0.35 ? a.ang + Math.PI : Math.atan2(a.tx - x, a.tz - z) + Math.PI, 0, 'YXZ');
          a.root.geometry = a.geos[Math.floor(a.t * 3) % 2];
          break;
        }
      }
    }
  };
  AF.onTick('animals', 320, animalsTick);
  K.tick = animalsTick;

  // ------------------------------------------------------------ tests
  AF.test('animals: ducks on the pond', () => {
    const PD = PL.pond, d = animals.filter((a) => a.type === 'duck' && Math.hypot(a.x - PD.cx, a.z - PD.cz) < PD.r);
    return { ok: d.length >= 5, info: d.length + ' ducks on the pond; animals ' + JSON.stringify(K.stats) };
  });
  AF.test('animals: dogs, pigeons, gulls, swans exist', () => {
    const c = {}; for (const a of animals) c[a.type + (a.gull ? '-gull' : '') + (a.swan ? '-swan' : '')] = (c[a.type + (a.gull ? '-gull' : '') + (a.swan ? '-swan' : '')] || 0) + 1;
    return { ok: (c.dog || 0) + (c.yarddog || 0) >= 3 && (c.pigeon || 0) >= 30 && (c.gullfly || 0) >= 8 && (c['duck-swan'] || 0) >= 4, info: JSON.stringify(c) };
  });
  AF.test('animals: pigeons scatter when the player approaches', () => {
    const F = (K.flocks || []).find((f) => !f.gull && f.members.length >= 4); if (!F) return { ok: false, info: 'no flock' };
    const P = AF.player, save = P ? { x: P.x, y: P.y, z: P.z } : null, mode = AF.mode;
    AF.mode = 'walk'; if (P) { P.x = F.members[0].hx + 1; P.z = F.members[0].hz; P.y = F.members[0].gy; }
    for (let i = 0; i < 20; i++) animalsTick(1 / 30, AF.clock.t);
    const flying = F.members.filter((a) => a.state === 'fly').length, up = F.members.filter((a) => a.root.position.y > a.gy + 0.8).length;
    if (P) { P.x = save.x; P.y = save.y; P.z = save.z; P.x = 9999; }
    for (let i = 0; i < 400; i++) animalsTick(1 / 30, AF.clock.t);
    if (P) { P.x = save.x; P.y = save.y; P.z = save.z; }
    AF.mode = mode;
    const back = F.members.filter((a) => a.state === 'ground').length;
    return { ok: flying >= Math.ceil(F.members.length * 0.75) && up >= 2 && back === F.members.length, info: `flock ${F.members.length}: flying ${flying}, airborne ${up}, resettled ${back}` };
  });
}

} catch (e) { AF.partError('56-animals.js', e); }

