// ================================================================ 48-sea.js
try {
// ===== 48-sea: life on the ocean around the island — ships on slow offshore loops (container ship, island ferry, sailboats,
//       fishing boats) with bobbing + foam wakes, two headland lighthouses with rotating beams at night, and an offshore oil rig
//       (jacket, decks, derrick, crane, helideck, gas flare, blinking obstruction lights)  (OWNER: land-harbour) =====
{
  const P = AF.PLAN, W = AF.W;
  const SEA = AF.sea = { ships: [], lighthouses: [], rigs: [] };
  const SEA_Y = P.harbour.waterY;
  const hash = AF.hash2;
  const col = (hex, o) => AF.col(hex, Object.assign({ jitter: 0.15, edge: 0.35 }, o || {}));
  const glow = (hex, k = 2.6, mode = 'night') => AF.col(hex, { emit: hex, emitK: k, mode });
  const geoOf = (m, vs, anchor = [0.5, 0, 0.5]) => { const g = AF.meshModel(m, { vs, anchor }); delete g.userData.src; return g; };
  const meshOf = (g) => AF.modelMesh(g, { cast: false });

  // ------------------------------------------------------------ routes: closed loops resampled evenly in arc length
  const loop = (fn, N = 512) => {
    const M = 2048, xs = new Float64Array(M + 1), zs = new Float64Array(M + 1), acc = new Float64Array(M + 1);
    for (let i = 0; i <= M; i++) { const p = fn(i / M * Math.PI * 2); xs[i] = p[0]; zs[i] = p[1]; if (i) acc[i] = acc[i - 1] + Math.hypot(xs[i] - xs[i - 1], zs[i] - zs[i - 1]); }
    const len = acc[M], pts = new Float32Array((N + 1) * 2); let j = 0;
    for (let k = 0; k <= N; k++) {
      const s = k / N * len; while (j < M - 1 && acc[j + 1] < s) j++;
      const f = (s - acc[j]) / Math.max(1e-6, acc[j + 1] - acc[j]);
      pts[k * 2] = xs[j] + (xs[j + 1] - xs[j]) * f; pts[k * 2 + 1] = zs[j] + (zs[j + 1] - zs[j]) * f;
    }
    return { pts, N, len };
  };
  const ellipse = (cx, cz, a, b, rot = 0, wob = 0, dir = 1) => (t) => {
    const tt = t * dir, r = 1 + wob * Math.sin(tt * 3), ex = Math.cos(tt) * a * r, ez = Math.sin(tt) * b * r, cr = Math.cos(rot), sr = Math.sin(rot);
    return [cx + ex * cr - ez * sr, cz + ex * sr + ez * cr];
  };

  // ------------------------------------------------------------ hull: length along +z (bow at +z), solid, deck on the top layer
  const hull = (m, L, B, Hh, K, o = {}) => {
    const bow = o.bow ?? 0.26, stern = o.stern ?? 0.08, cx = B / 2, boot = o.boot ?? Math.round(Hh * 0.3);
    for (let z = 0; z < L; z++) {
      const u = (z + 0.5) / L, k = u > 1 - bow ? Math.sqrt(Math.max(0.03, (1 - u) / bow)) : u < stern ? 0.85 + 0.15 * u / stern : 1;
      for (let y = 0; y < Hh; y++) {
        const hw = Math.max(0.6, cx * k * (y < Hh * 0.4 ? 0.72 + 0.28 * y / (Hh * 0.4) : 1));
        const x0 = Math.max(0, Math.floor(cx - hw)), x1 = Math.min(B, Math.ceil(cx + hw));
        for (let x = x0; x < x1; x++) m.set(x, y, z, y === Hh - 1 ? (x === x0 || x === x1 - 1 ? K.rail : K.deck) : y < boot ? K.boot : y === o.band ? K.band : K.hull);
      }
    }
  };

  const WHITE = () => col(0xf2efe6), WIN = () => col(0x2a3440, { jitter: 0.05, metal: 0.3, rough: 0.25 });
  const NAV = () => ({ r: glow(0xff3020, 3), g: glow(0x30e060, 3), w: glow(0xfff4d8, 3) });

  // container ship, 72 x 12 m (vs 1/2); port (+x) red, starboard (-x) green
  const containerShip = () => {
    const L = 144, B = 24, Hh = 14, m = new AF.Model(B, 46, L), wh = WHITE(), win = WIN(), wl = glow(0xffd89a, 2.2), nav = NAV();
    hull(m, L, B, Hh, { boot: col(0x8a2a24), hull: col(0x1f2d3d), band: wh, rail: wh, deck: col(0x5a5048) }, { band: Hh - 3 });
    const CC = [0xb8322a, 0x2f5a8a, 0x3f7a4a, 0xd8a03a, 0x7a7e84, 0xc8642a, 0x2a3e6a, 0x8a3a5a].map((h) => col(h, { jitter: 0.25, edge: 0.7 }));
    for (let bay = 0; bay < 7; bay++) for (let r = 0; r < 4; r++) {
      const z0 = 24 + bay * 13, x0 = 2 + r * 5, tiers = 2 + Math.floor(hash(bay * 7 + r, 11) * 3);
      for (let t = 0; t < tiers; t++) m.box(x0, Hh + t * 5, z0, x0 + 5, Hh + t * 5 + 5, z0 + 12, CC[Math.floor(hash(bay * 31 + r * 7, t) * CC.length)]);
    }
    m.box(3, Hh, 6, 21, Hh + 18, 20, wh);
    for (let y = Hh + 3; y < Hh + 18; y += 4) {
      for (let x = 4; x < 20; x += 3) m.box(x, y, 19, x + 2, y + 2, 20, hash(x, y) < 0.4 ? wl : win);
      for (let z = 8; z < 18; z += 3) { m.box(3, y, z, 4, y + 2, z + 2, hash(z, y + 1) < 0.35 ? wl : win); m.box(20, y, z, 21, y + 2, z + 2, hash(z + 3, y) < 0.35 ? wl : win); }
    }
    m.box(0, Hh + 18, 12, 24, Hh + 22, 20, wh); m.box(1, Hh + 19, 19, 23, Hh + 21, 20, win); m.box(0, Hh + 22, 11, 24, Hh + 23, 20, col(0x2a2e34));
    m.box(9, Hh + 18, 5, 15, Hh + 30, 11, col(0xc8402a)); m.box(9, Hh + 28, 5, 15, Hh + 30, 11, col(0x1a1c20)); m.box(9, Hh + 24, 5, 15, Hh + 25, 11, wh);
    m.box(11, Hh + 23, 14, 13, Hh + 30, 16, col(0x3a3e44)); m.box(8, Hh + 30, 14, 16, Hh + 31, 16, col(0x3a3e44));
    m.box(11, Hh, 132, 13, Hh + 12, 134, col(0xd8a03a));
    m.set(23, Hh + 20, 16, nav.r); m.set(0, Hh + 20, 16, nav.g); m.set(12, Hh + 12, 133, nav.w); m.set(12, Hh + 31, 15, nav.w);
    return m;
  };
  // island car ferry, 40 x 10 m (vs 1/4)
  const ferry = () => {
    const L = 160, B = 40, Hh = 18, m = new AF.Model(B, 64, L), wh = WHITE(), win = WIN(), wl = glow(0xffd89a, 2.2), nav = NAV(), red = col(0xc8402a), orange = col(0xe87a2a);
    hull(m, L, B, Hh, { boot: col(0x2a2e38), hull: wh, band: col(0x1f4a8a), rail: wh, deck: col(0x8a7a64, { jitter: 0.4 }) }, { band: Hh - 5, bow: 0.3, stern: 0.05 });
    m.box(10, 6, 0, 30, Hh - 1, 1, col(0x2a2e34));
    m.box(3, Hh, 16, 37, Hh + 12, 148, wh); m.box(5, Hh + 12, 34, 35, Hh + 22, 124, wh); m.box(4, Hh + 22, 108, 36, Hh + 30, 126, wh);
    for (let z = 20; z < 144; z += 5) { m.box(3, Hh + 4, z, 4, Hh + 8, z + 3, hash(z, 1) < 0.5 ? wl : win); m.box(36, Hh + 4, z, 37, Hh + 8, z + 3, hash(z, 2) < 0.5 ? wl : win); }
    for (let z = 38; z < 120; z += 5) { m.box(5, Hh + 15, z, 6, Hh + 18, z + 3, hash(z, 3) < 0.5 ? wl : win); m.box(34, Hh + 15, z, 35, Hh + 18, z + 3, hash(z, 4) < 0.5 ? wl : win); }
    m.box(5, Hh + 25, 125, 35, Hh + 28, 126, win);
    m.box(15, Hh + 22, 60, 25, Hh + 42, 78, red); m.box(15, Hh + 38, 60, 25, Hh + 42, 78, col(0x1a1c20)); m.box(15, Hh + 32, 60, 25, Hh + 34, 78, wh);
    for (const z of [44, 80]) { m.box(0, Hh + 13, z, 4, Hh + 17, z + 12, orange); m.box(36, Hh + 13, z, 40, Hh + 17, z + 12, orange); }
    m.box(19, Hh + 30, 116, 21, Hh + 40, 118, col(0x3a3e44));
    m.set(35, Hh + 29, 125, nav.r); m.set(4, Hh + 29, 125, nav.g); m.set(20, Hh + 40, 117, nav.w);
    return m;
  };
  // sailboat, 10 m (vs 1/8)
  const sailboat = (hc, sc) => {
    const m = new AF.Model(24, 108, 80), mast = col(0x8a6a4a), sail = col(0xf6f0e2, { jitter: 0.1 }), nav = NAV();
    hull(m, 80, 24, 8, { boot: col(0x2a2e38), hull: hc, band: col(0xd8b04a), rail: hc, deck: col(0xb08a5a, { jitter: 0.4 }) }, { band: 6, bow: 0.4, stern: 0.12, boot: 2 });
    m.box(7, 8, 28, 17, 12, 50, WHITE()); m.box(7, 10, 49, 17, 11, 50, WIN());
    m.box(11, 8, 50, 13, 104, 52, mast); m.box(11, 18, 20, 13, 19, 50, mast);
    for (let y = 19; y < 100; y++) { const w = Math.round((100 - y) / 81 * 28); if (w > 0) m.box(12, y, 50 - w, 13, y + 1, 50, sc); }
    for (let y = 14; y < 92; y++) { const w = Math.round((92 - y) / 78 * 26); if (w > 0) m.box(12, y, 52, 13, y + 1, 52 + w, sail); }
    m.box(11, 104, 50, 13, 106, 52, nav.w);
    return m;
  };
  // fishing trawler, 12 m (vs 1/8): wheelhouse forward, orange A-frame gantry aft, net drum
  const trawler = (hc) => {
    const m = new AF.Model(32, 76, 96), wh = WHITE(), win = WIN(), orange = col(0xe07a2a), mast = col(0x3a3e44), nav = NAV();
    hull(m, 96, 32, 16, { boot: col(0x2a2e38), hull: hc, band: wh, rail: wh, deck: col(0x7a6a54, { jitter: 0.4 }) }, { band: 12, bow: 0.32, stern: 0.1, boot: 5 });
    m.box(6, 16, 56, 26, 38, 76, wh); m.box(6, 30, 56, 26, 35, 76, win); m.box(7, 30, 57, 25, 35, 75, wh); m.box(8, 30, 75, 24, 35, 76, glow(0xffd89a, 1.6));
    m.box(5, 38, 55, 27, 40, 77, col(0x2a2e34));
    m.box(15, 40, 64, 17, 70, 66, mast); m.box(6, 62, 64, 26, 63, 66, mast); m.box(15, 70, 64, 17, 72, 66, nav.w);
    m.box(2, 16, 6, 5, 52, 9, orange); m.box(27, 16, 6, 30, 52, 9, orange); m.box(2, 50, 6, 30, 53, 9, orange);
    m.box(8, 16, 18, 24, 26, 30, col(0x2e4a34)); for (let x = 8; x < 24; x += 4) m.set(x, 26, 24, orange);
    m.box(8, 16, 36, 14, 20, 44, col(0x2f5a8a)); m.box(18, 16, 38, 24, 19, 46, col(0x2f5a8a));
    m.set(26, 34, 70, nav.r); m.set(5, 34, 70, nav.g);
    return m;
  };

  // ------------------------------------------------------------ foam wake: one shared V texture on a flat quad trailing each hull
  let wakeMat = null, wakeGeo = null;
  const wakeKit = () => {
    const cv = document.createElement('canvas'); cv.width = 64; cv.height = 256;
    const g = cv.getContext('2d'), R = AF.rng(77);
    for (let y = 0; y < 256; y++) {
      const t = 1 - y / 255, fade = Math.pow(1 - t, 1.6), arm = 5 + t * 26;
      g.fillStyle = `rgba(255,255,255,${(0.8 * fade).toFixed(3)})`;
      g.fillRect(32 - arm - 2, y, 4, 1); g.fillRect(32 + arm - 2, y, 4, 1);
      for (let k = 0; k < 6; k++) if (R() < 0.65 * fade) g.fillRect(32 + (R() - 0.5) * (12 + t * 20), y, 2 + R() * 3, 1);
    }
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
    wakeMat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0.85, fog: true });
    wakeGeo = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2).translate(0, 0, -0.5);
  };

  AF.onBuild('sea-ships', 615, () => {
    if (typeof AF.Model !== 'function') return;
    wakeKit();
    const cont = geoOf(containerShip(), 0.5), fer = geoOf(ferry(), 0.25);
    const sails = [sailboat(col(0xf2ede2), col(0xf6f0e2, { jitter: 0.1 })), sailboat(col(0x1f3a5b), col(0xc8643a, { jitter: 0.12 }))].map((m) => geoOf(m, 1 / 8));
    const trawls = [trawler(col(0xa83a2a)), trawler(col(0x2f5a8a))].map((m) => geoOf(m, 1 / 8));
    // routes stay 150–700 m offshore, clear of the rig (600, 240), the harbour ferry/tug loops and the yachts' lane (z 324..566)
    const SPEC = [
      { name: 'container ship', geo: cont, route: loop(ellipse(-180, 0, 1100, 820, 0, 0, -1)), speed: 6.5, len: 72, beam: 12, draft: 2.4, bob: 0.12, roll: 0.01, bw: 0.4 },
      { name: 'island ferry', geo: fer, route: loop(ellipse(-260, 640, 305, 70, Math.atan2(520, -320), 0, 1)), speed: 5, len: 40, beam: 10, draft: 1.6, bob: 0.16, roll: 0.018, bw: 0.55 },
      { name: 'sailboat', geo: sails[0], route: loop(ellipse(-980, -120, 120, 80, 0.4, 0.08, 1)), speed: 3.2, len: 10, beam: 3, draft: 0.45, bob: 0.22, roll: 0.09, bw: 0.9 },
      { name: 'sailboat', geo: sails[1], route: loop(ellipse(-80, -560, 110, 70, -0.2, 0.1, -1)), speed: 2.8, len: 10, beam: 3, draft: 0.45, bob: 0.22, roll: 0.09, bw: 0.85 },
      { name: 'fishing boat', geo: trawls[0], route: loop(ellipse(560, -420, 95, 60, 0.7, 0.18, 1)), speed: 2.2, len: 12, beam: 4, draft: 0.7, bob: 0.25, roll: 0.05, bw: 0.8 },
      { name: 'fishing boat', geo: trawls[1], route: loop(ellipse(-900, 380, 80, 90, 0.2, 0.15, -1)), speed: 2, len: 12, beam: 4, draft: 0.7, bob: 0.25, roll: 0.05, bw: 0.75 },
    ];
    SPEC.forEach((s, i) => {
      const grp = new THREE.Group(); grp.name = 'sea-ship';
      const h = meshOf(s.geo); h.rotation.order = 'YXZ'; grp.add(h);
      const wk = new THREE.Mesh(wakeGeo, wakeMat); wk.scale.set(s.beam * 3, 1, s.len * 2.4); wk.renderOrder = 3; grp.add(wk);
      AF.scene.add(grp);
      const sh = { name: s.name, grp, hull: h, wake: wk, route: s.route, s0: hash(i * 13, 5) * s.route.len, speed: s.speed, len: s.len, draft: s.draft, bob: s.bob, roll: s.roll, bw: s.bw, ph: i * 1.7, acc: 9 };
      SEA.ships.push(sh); place(sh, 0);
      if (AF.water2 && AF.water2.addBoat) AF.water2.addBoat(h);
    });
  });
  function place(sh, t) {
    const R = sh.route, p = R.pts, u = (((sh.s0 + sh.speed * t) % R.len) + R.len) % R.len / R.len * R.N, i = Math.min(R.N - 1, Math.floor(u)), f = u - i;
    const x = p[i * 2] + (p[i * 2 + 2] - p[i * 2]) * f, z = p[i * 2 + 1] + (p[i * 2 + 3] - p[i * 2 + 1]) * f;
    const yaw = Math.atan2(p[i * 2 + 2] - p[i * 2], p[i * 2 + 3] - p[i * 2 + 1]);
    sh.grp.position.set(x, 0, z);
    const h = sh.hull; h.rotation.y = yaw;
    h.position.y = SEA_Y - sh.draft + Math.sin(t * sh.bw + sh.ph) * sh.bob;
    h.rotation.z = Math.sin(t * sh.bw * 0.7 + sh.ph * 1.3) * sh.roll; h.rotation.x = Math.sin(t * sh.bw * 0.9 + sh.ph) * sh.roll * 0.4;
    const off = sh.len * 0.5 - 0.5; sh.wake.rotation.y = yaw; sh.wake.position.set(-Math.sin(yaw) * off, SEA_Y + 0.05, -Math.cos(yaw) * off);
  }

  // ------------------------------------------------------------ lighthouses: voxel towers on the SW headland + the Heights' north-east corner
  let beamMat = null, beamGeo = null, lampGeo = null, lampMat = null;
  AF.onBuild('sea-lighthouses', 390, () => {
    const F = (x0, y0, z0, x1, y1, z1, cc) => W.fill(x0, y0, z0, x1, y1, z1, cc);
    const wh = col(0xf4efe4, { jitter: 0.2, edge: 0.4 }), red = col(0xb8322a, { jitter: 0.2, edge: 0.4 }), stone = col(0x9a948a, { jitter: 0.6, edge: 0.9, pat: 'stone' });
    const rail = col(0x2e3438, { metal: 0.5, rough: 0.5 }), glass = AF.col('glass'), lampC = glow(0xfff2c0, 3.2), door = col(0x2f4a3a), wl = glow(0xffd89a, 2);
    const disc = (x, z, r, ya, yb, cc, ring = 0) => {
      const n = Math.ceil(r * 4);
      for (let i = -n; i < n; i++) for (let k = -n; k < n; k++) {
        const a = i * 0.25, b = k * 0.25, d = Math.hypot(a + 0.125, b + 0.125); if (d > r || (ring && d < r - ring)) continue;
        const c = typeof cc === 'function' ? cc(i, k) : cc; if (c) F(x + a, ya, z + b, x + a + 0.25, yb, z + b + 0.25, c);
      }
    };
    const groundSpan = (x, z, rx, rz) => { let lo = 1e9, hi = -1e9; for (let a = -rx; a <= rx; a += 0.5) for (let b = -rz; b <= rz; b += 0.5) { const g = W.groundY(x + a, z + b); lo = Math.min(lo, g); hi = Math.max(hi, g); } return [lo, hi]; };
    const cottage = (x, z) => {
      const [lo, hi] = groundSpan(x, z, 3, 2.5), y = hi + 0.25;
      F(x - 3, lo - 0.5, z - 2.5, x + 3, y, z + 2.5, stone);
      F(x - 2.75, y, z - 2.25, x + 2.75, y + 2.75, z + 2.25, wh);
      for (let i = 0; i < 5; i++) F(x - 3, y + 2.75 + i * 0.25, z - 2.5 + i * 0.5, x + 3, y + 3 + i * 0.25, z + 2.5 - i * 0.5, red);
      F(x - 0.5, y, z + 2.25, x + 0.5, y + 2, z + 2.5, door);
      F(x + 1.25, y + 1, z + 2.25, x + 2.25, y + 2, z + 2.5, wl); F(x - 2.25, y + 1, z + 2.25, x - 1.25, y + 2, z + 2.5, wl);
      F(x + 1.75, y + 2.75, z - 1, x + 2.25, y + 4.5, z - 0.5, stone);
    };
    const HL = (AF.land && AF.land.HEADLAND) || { x: -634, z: 238 };
    const SITES = [
      { name: 'Cape Solace Light', x: HL.x, z: HL.z, cot: [HL.x + 1, HL.z - 7] },
      { name: 'Heights Head Light', x: 288, z: -291, cot: [280, -289] },
    ];
    for (const S of SITES) {
      const [lo, hi] = groundSpan(S.x, S.z, 4, 4), y0 = hi + 0.5, yT = y0 + 16;
      disc(S.x, S.z, 4, lo - 1, y0, stone);
      for (let i = 0; i < 8; i++) disc(S.x, S.z, 2.3 - i * 0.08, y0 + i * 2, y0 + (i + 1) * 2, i % 2 ? red : wh);
      F(S.x - 0.5, y0, S.z + 1.75, S.x + 0.5, y0 + 2.25, S.z + 2.5, door);
      disc(S.x, S.z, 3, yT, yT + 0.25, rail);
      disc(S.x, S.z, 3, yT + 0.25, yT + 1, (i, k) => ((i + k) & 1 ? rail : 0), 0.3);
      disc(S.x, S.z, 3, yT + 1, yT + 1.25, rail, 0.3);
      disc(S.x, S.z, 1.5, yT + 0.25, yT + 2.5, glass, 0.3);
      disc(S.x, S.z, 0.75, yT + 0.75, yT + 2, lampC);
      disc(S.x, S.z, 1.8, yT + 2.5, yT + 2.75, red); disc(S.x, S.z, 1.3, yT + 2.75, yT + 3, red); disc(S.x, S.z, 0.8, yT + 3, yT + 3.25, red);
      F(S.x - 0.25, yT + 3.25, S.z - 0.25, S.x + 0.25, yT + 4, S.z + 0.25, rail);
      cottage(S.cot[0], S.cot[1]);
      const lampY = yT + 1.4;
      AF.addLight({ x: S.x, y: lampY, z: S.z, color: 0xfff0c0, intensity: 2, range: 16, kind: 'street' });
      AF.addLabel(S.name, S.x, S.z, 'place');
      SEA.lighthouses.push({ name: S.name, x: S.x, y: lampY, z: S.z, ph: SEA.lighthouses.length * 2.1 });
    }
    // rotating twin beams + a lamp glow (additive, unlit, no shadows), shown from dusk
    beamGeo = new THREE.ConeGeometry(8, 80, 20, 1, true); beamGeo.rotateZ(Math.PI / 2); beamGeo.translate(40, 0, 0);
    { const p = beamGeo.attributes.position, cA = new Float32Array(p.count * 3);
      for (let i = 0; i < p.count; i++) { const k = Math.pow(Math.max(0, 1 - p.getX(i) / 80), 1.4); cA[i * 3] = k; cA[i * 3 + 1] = k * 0.95; cA[i * 3 + 2] = k * 0.8; }
      beamGeo.setAttribute('color', new THREE.BufferAttribute(cA, 3)); }
    beamMat = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });
    lampGeo = new THREE.SphereGeometry(0.9, 10, 8); lampMat = new THREE.MeshBasicMaterial({ color: 0xfff2c0, transparent: true, opacity: 0.9, fog: false });
    for (const lh of SEA.lighthouses) {
      const b = new THREE.Group(); b.position.set(lh.x, lh.y, lh.z);
      for (const r of [0, Math.PI]) { const m = new THREE.Mesh(beamGeo, beamMat); m.rotation.y = r; m.renderOrder = 4; m.frustumCulled = false; b.add(m); }
      const lamp = new THREE.Mesh(lampGeo, lampMat); b.add(lamp);
      b.visible = false; AF.scene.add(b); lh.beam = b;
    }
  });

  // ------------------------------------------------------------ the oil rig "Solace Alpha": 600 m east-south-east, ~300 m off the east shore
  const RIG = { x: 600, z: 240, yaw: 0.35 };
  const jacket = () => {
    const S = 52, Hj = 50, m = new AF.Model(S, Hj, S), leg = col(0xd8b43a, { jitter: 0.2, metal: 0.4, rough: 0.5 }), br = col(0x8a8e90, { jitter: 0.2, metal: 0.5, rough: 0.5 });
    const C = [4, 44], LV = [8, 22, 36, 48];
    for (const a of C) for (const b of C) m.box(a, 0, b, a + 4, Hj, b + 4, leg);
    for (const y of LV) for (const a of C) { m.box(a, y, 6, a + 4, y + 2, 46, br); m.box(6, y, a, 46, y + 2, a + 4, br); }
    for (let i = 0; i < LV.length - 1; i++) {
      const y0 = LV[i] + 1, y1 = LV[i + 1];
      for (const a of [6, 45]) { m.line(6, y0, a, 45, y1, a, br, 0.9); m.line(45, y0, a, 6, y1, a, br, 0.9); m.line(a, y0, 6, a, y1, 45, br, 0.9); m.line(a, y0, 45, a, y1, 6, br, 0.9); }
    }
    m.box(0, 13, 20, 4, 14, 32, col(0x3a3e44));
    return m;
  };
  const topside = () => {
    const m = new AF.Model(176, 64, 128), R = AF.rng(606);
    const deck = col(0x6a6e70, { jitter: 0.3, edge: 0.5 }), grey = col(0x9a9ea0), blue = col(0x3a5a7a), wh = WHITE(), green = col(0x4a6a54), orange = col(0xe07a2a), yel = col(0xe8c040), red = col(0xb83a2a);
    const dark = col(0x2e3236), pad = col(0x3e4a44), hw = col(0xf4f2ea), wl = glow(0xffd89a, 2.2), win = WIN();
    m.box(4, 0, 4, 124, 2, 124, deck); m.box(4, 20, 4, 124, 22, 124, deck);
    for (const a of [4, 60, 120]) for (const b of [4, 60, 120]) m.box(a, 2, b, a + 4, 20, b + 4, yel);
    for (let x = 10; x < 118; x += 22) for (let z = 10; z < 118; z += 22) { if (x < 50 && z > 80) continue; const w = 12 + ((R() * 8) | 0), d = 12 + ((R() * 8) | 0), h = 8 + ((R() * 10) | 0); m.box(x, 2, z, x + w, 2 + h, z + d, [grey, blue, wh, green][(R() * 4) | 0]); }
    for (let i = 0; i < 6; i++) { const z = 14 + i * 18, y = 12 + (i % 3) * 2; m.box(8, y, z, 120, y + 1, z + 1, i % 2 ? yel : grey); }
    m.box(4, 22, 84, 48, 52, 124, wh);
    for (let y = 25; y < 50; y += 6) {
      for (let z = 86; z < 122; z += 5) m.box(4, y, z, 5, y + 3, z + 3, R() < 0.4 ? wl : win);
      for (let x = 6; x < 46; x += 5) m.box(x, y, 123, x + 3, y + 3, 124, R() < 0.4 ? wl : win);
    }
    const hx = 26, hz = 102, hr = 26;
    for (let x = hx - hr; x <= hx + hr; x++) for (let z = hz - hr; z <= hz + hr; z++) {
      const dx = Math.abs(x + 0.5 - hx), dz = Math.abs(z + 0.5 - hz); if (dx > hr || dz > hr || dx + dz > hr * 1.4) continue;
      const d = Math.hypot(dx, dz); m.box(x, 52, z, x + 1, 54, z + 1, dx + dz > hr * 1.4 - 1.5 || dx > hr - 1 || dz > hr - 1 ? dark : pad);
      if (d > 16 && d < 18) m.set(x, 53, z, yel);
    }
    m.box(hx - 6, 53, hz - 7, hx - 4, 54, hz + 7, hw); m.box(hx + 4, 53, hz - 7, hx + 6, 54, hz + 7, hw); m.box(hx - 4, 53, hz - 1, hx + 4, 54, hz + 1, hw);
    m.box(64, 22, 40, 96, 30, 72, red);
    m.box(100, 22, 90, 108, 46, 98, yel); m.box(96, 46, 86, 112, 54, 100, yel); m.box(110, 49, 88, 112, 52, 98, win);
    m.line(104, 52, 93, 164, 62, 58, yel, 1.2); m.line(164, 61, 58, 164, 40, 58, dark);
    m.line(124, 22, 20, 172, 58, 20, grey, 1.0); m.line(124, 26, 20, 170, 61, 20, grey, 0.8);
    for (let k = 0; k < 8; k++) { const a = k / 8, b = (k + 0.5) / 8; m.line(124 + 48 * a, 22 + 36 * a, 20, 124 + 46 * b, 26 + 35 * b, 20, grey); }
    m.box(166, 57, 17, 176, 59, 23, dark);
    m.box(0, 24, 88, 4, 28, 100, orange); m.box(0, 24, 106, 4, 28, 118, orange);
    m.box(4, 24, 4, 124, 25, 5, yel); m.box(123, 24, 4, 124, 25, 124, yel); m.box(48, 24, 123, 124, 25, 124, yel);
    for (let i = 4; i < 124; i += 4) { m.box(i, 22, 4, i + 1, 24, 5, yel); m.box(123, 22, i, 124, 24, i + 1, yel); }
    return m;
  };
  const derrick = () => {
    const m = new AF.Model(32, 152, 32), rd = col(0xc8402a, { metal: 0.3, rough: 0.5 }), wh = WHITE(), Hd = 146, cp = (y) => [1 + 10 * y / Hd, 30 - 10 * y / Hd];
    for (const [sx, sz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) { const a = cp(0), b = cp(Hd); m.line(a[sx], 0, a[sz], b[sx], Hd, b[sz], rd, 0.8); }
    for (let y = 12; y < Hd; y += 12) {
      const [lo, hi] = cp(y), y2 = Math.min(Hd, y + 12), [lo2, hi2] = cp(y2), c = (y / 12) % 2 ? rd : wh;
      m.line(lo, y, lo, hi, y, lo, c); m.line(lo, y, hi, hi, y, hi, c); m.line(lo, y, lo, lo, y, hi, c); m.line(hi, y, lo, hi, y, hi, c);
      m.line(lo, y, lo, hi2, y2, lo2, rd); m.line(hi, y, hi, lo2, y2, hi2, rd); m.line(lo, y, hi, lo2, y2, lo2, rd); m.line(hi, y, lo, hi2, y2, hi2, rd);
    }
    m.box(9, Hd, 9, 23, Hd + 4, 23, rd);
    return m;
  };
  const flame = () => {
    const m = new AF.Model(12, 28, 12), c1 = glow(0xfff4c0, 4, 'always'), c2 = glow(0xffb040, 3.6, 'always'), c3 = glow(0xff5a1a, 3, 'always');
    for (let y = 0; y < 28; y++) {
      const t = y / 27, r = 5.5 * Math.sin(Math.PI * Math.min(1, t * 1.15 + 0.08)) * (1 - t * 0.35);
      for (let x = 0; x < 12; x++) for (let z = 0; z < 12; z++) { const d = Math.hypot(x + 0.5 - 6, z + 0.5 - 6) + (hash(x * 7 + y, z * 3) - 0.5) * 1.6; if (d <= r) m.set(x, y, z, d < r * 0.45 && t < 0.6 ? c1 : t < 0.7 ? c2 : c3); }
    }
    return m;
  };
  AF.onBuild('sea-rig', 616, () => {
    if (typeof AF.Model !== 'function') return;
    const grp = new THREE.Group(); grp.name = 'sea-rig'; grp.position.set(RIG.x, 0, RIG.z); grp.rotation.y = RIG.yaw;
    const deckY = SEA_Y - 6 + 25, vx = (v) => (v - 64) * 0.25;
    const jm = meshOf(geoOf(jacket(), 0.5)); jm.position.y = SEA_Y - 6; grp.add(jm);
    const tm = meshOf(geoOf(topside(), 0.25, [64 / 176, 0, 0.5])); tm.position.y = deckY; grp.add(tm);
    const dm = meshOf(geoOf(derrick(), 0.25)); dm.position.set(vx(80), deckY + 7.5, vx(56)); grp.add(dm);
    const fm = meshOf(geoOf(flame(), 0.4)); fm.position.set(vx(172), deckY + 14.75, vx(20)); grp.add(fm);
    // additive glow around the flare (core + wide halo) so it reads from the shore at night
    const cv = document.createElement('canvas'); cv.width = cv.height = 64;
    { const g = cv.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,0.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); }
    const gtex = new THREE.CanvasTexture(cv);
    const spr = (hex, s) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: gtex, color: hex, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, fog: false })); sp.scale.setScalar(s); sp.position.set(vx(172), deckY + 19.5, vx(20)); sp.renderOrder = 4; sp.userData.s = s; grp.add(sp); return sp; };
    const glowS = [spr(0xffd890, 13), spr(0xff8a30, 46)];
    const pts = [[vx(4), deckY + 6.6, vx(4)], [vx(124), deckY + 6.6, vx(4)], [vx(124), deckY + 6.6, vx(124)], [vx(4), deckY + 13.8, vx(124)], [vx(80), deckY + 45.2, vx(56)]];
    const nav = new THREE.InstancedMesh(new THREE.SphereGeometry(0.45, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff2a1a, fog: false }), pts.length);
    const M4 = new THREE.Matrix4(); pts.forEach((p, i) => { M4.makeTranslation(p[0], p[1], p[2]); nav.setMatrixAt(i, M4); });
    nav.instanceMatrix.needsUpdate = true; nav.frustumCulled = false; grp.add(nav);
    AF.scene.add(grp);
    SEA.rigs.push({ name: 'Solace Alpha', grp, flame: fm, glow: glowS, nav });
  });

  // the outer ring of the world grid stays sea bed, whatever the districts stamped since the terrain pass
  AF.onBuild('sea-edges', 495, () => { if (AF.land && AF.land.closeEdges) AF.land.closeEdges(); });
  // the Heights light also streaks across the water at night (the south-west one is already a quay-side candidate)
  AF.onBuild('sea-reflections', 710, () => {
    const WQ = AF.water2; if (!WQ || !WQ.cands) return;
    for (const lh of SEA.lighthouses) if (lh.z < 190) WQ.cands.push({ x: lh.x, y: lh.y, z: lh.z, color: 0xfff0c0, intensity: 3.5, kind: 'lighthouse' });
    for (const r of SEA.rigs) { r.grp.updateMatrixWorld(true); const p = r.glow[0].getWorldPosition(new THREE.Vector3()); WQ.cands.push({ x: p.x, y: p.y, z: p.z, color: 0xff9a40, intensity: 3, kind: 'lighthouse' }); }
  });

  AF.onTick('sea', 332, (dt, t) => {
    const cp = AF.camera.position;
    for (const sh of SEA.ships) {
      sh.acc += dt;
      const far = Math.abs(sh.grp.position.x - cp.x) + Math.abs(sh.grp.position.z - cp.z) > 520;
      if (far && sh.acc < 0.25) continue;
      sh.acc = 0; place(sh, t);
    }
    if (wakeMat) { const k = AF.water2 && AF.water2.light ? AF.water2.light.value : 1; wakeMat.color.setScalar(Math.min(1, Math.max(0.12, k))); }
    const nk = AF.smooth(0.15, 0.6, AF.time ? AF.time.night : 0);
    if (beamMat) beamMat.opacity = 0.22 * nk;
    for (const lh of SEA.lighthouses) { if (!lh.beam) continue; lh.beam.visible = nk > 0.02; if (lh.beam.visible) lh.beam.rotation.y = t * 0.55 + lh.ph; }
    for (const r of SEA.rigs) {
      r.flame.scale.set(1 + 0.08 * Math.sin(t * 23.1), 0.85 + 0.15 * Math.sin(t * 17.3) + 0.1 * Math.sin(t * 31.7 + 1.3), 1 + 0.08 * Math.cos(t * 19.7));
      r.flame.rotation.y = t * 0.4;
      const fl = 0.8 + 0.12 * Math.sin(t * 13.7) + 0.08 * Math.sin(t * 29.3 + 0.7), gk = 0.35 + 0.65 * nk;
      for (let i = 0; i < r.glow.length; i++) { const g = r.glow[i]; g.scale.setScalar(g.userData.s * (0.9 + 0.12 * fl)); g.material.opacity = gk * fl * (i ? 0.45 : 1); }
      r.nav.visible = (t % 2) < 0.8;
    }
  });

  AF.test('sea: island in open ocean on all four edges, ships, 2 lighthouses, oil rig, no horizon ring', () => {
    let dry = 0, n = 0;
    for (let t = 0.01; t < 1; t += 0.02) {
      const x = W.X0 + (W.x1 - W.X0) * t, z = W.Z0 + (W.z1 - W.Z0) * t;
      for (const [px, pz] of [[W.X0 + 0.1, z], [W.x1 - 0.1, z], [x, W.Z0 + 0.1], [x, W.z1 - 0.1]]) { n++; if (W.groundY(px, pz) >= SEA_Y) dry++; }
    }
    const sea = AF.world.water.find((e) => e.geo.userData.sea), bb = sea && sea.geo.boundingBox;
    const cover = !!bb && bb.min.x < W.X0 - 1500 && bb.max.x > W.x1 + 1500 && bb.min.z < W.Z0 - 1500 && bb.max.z > W.z1 + 1500;
    const horizon = !!AF.scene.getObjectByName('land-horizon');
    return { ok: dry === 0 && cover && SEA.ships.length >= 3 && SEA.lighthouses.length === 2 && SEA.rigs.length === 1 && !horizon,
      info: `edge samples ${n} dry ${dry}, ocean ${bb ? [bb.min.x, bb.max.x, bb.min.z, bb.max.z].map(Math.round).join(',') : '-'}, ships ${SEA.ships.length}, lighthouses ${SEA.lighthouses.length}, rigs ${SEA.rigs.length}, horizon ${horizon}` };
  });
}

} catch (e) { AF.partError('48-sea.js', e); }
