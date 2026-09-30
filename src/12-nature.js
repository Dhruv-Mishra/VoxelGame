// ================================================================ 12-nature.js
try {
// ===== 12-nature: autumn voxel trees (13 designs) on Solace Heights, map-edge strips + fill back yards; bushes, rocks,
//       wildflowers, logs, leaf litter; AF.nature.tree(kind,x,z,scale) for streets-park  (OWNER: land-harbour) =====
{
  const P = AF.PLAN, W = AF.W;
  const L = AF.land = AF.land || {};
  const hash = AF.hash2, N2 = AF.noise2, clamp = AF.clamp;

  // ------------------------------------------------------------ tree designs
  // shape: round | spread | column | cone | pine | vase | willow
  const SPECS = [
    { id: 'maple-scarlet', shape: 'round', h: 12, w: 10, r0: 0.4, bark: [0x5a4636, 0x463628], leaves: [0xb8322a, 0xcf4a2c, 0x8a2420, 0xe8703c], cr: 1.5, n: 22, litter: 'red' },
    { id: 'maple-orange', shape: 'round', h: 11, w: 9.5, r0: 0.38, bark: [0x5e4a38, 0x4a3a2c], leaves: [0xd66a28, 0xe4882e, 0xa84c1e, 0xf4a846], cr: 1.45, n: 20, litter: 'orange' },
    { id: 'maple-gold', shape: 'round', h: 13, w: 10.5, r0: 0.42, bark: [0x5a4838, 0x483a2c], leaves: [0xdca22c, 0xe9b93c, 0xb07e22, 0xf6d45c], cr: 1.55, n: 22, litter: 'gold' },
    { id: 'oak', shape: 'spread', h: 11, w: 13, r0: 0.6, bark: [0x4e3e2e, 0x3c2f23], leaves: [0x9a5a2a, 0xb06e32, 0x6e3e20, 0xc8904a], cr: 1.6, n: 26, litter: 'brown' },
    { id: 'birch', shape: 'column', h: 12.5, w: 6, r0: 0.2, stems: 2, bark: [0xebe6d8, 0xd9d3c3], marks: 0x2a2622, leaves: [0xe2be38, 0xedd05a, 0xb6962a, 0xf7e27c], cr: 1.0, n: 20, litter: 'gold' },
    { id: 'aspen', shape: 'column', h: 14, w: 5, r0: 0.22, bark: [0xd3d4c0, 0xc0c1ad], marks: 0x4a4a40, leaves: [0xf0b82e, 0xf6d04c, 0xc48e1e, 0xfff07c], cr: 0.95, n: 20, litter: 'gold' },
    { id: 'pine', shape: 'pine', h: 16, w: 7.5, r0: 0.38, bark: [0x5b3f2c, 0x4a3322], leaves: [0x2f5a3a, 0x3a6844, 0x22452f, 0x4d7c50], cr: 1.25, n: 16, litter: 'needle' },
    { id: 'spruce', shape: 'cone', h: 15, w: 6.5, r0: 0.32, bark: [0x4a3526, 0x3a2a1e], leaves: [0x2a4e3e, 0x335c47, 0x1d3b2f, 0x42705a], cr: 1, n: 0, litter: 'needle' },
    { id: 'elm-green', shape: 'vase', h: 13, w: 11, r0: 0.42, bark: [0x5a4a3a, 0x4a3c2e], leaves: [0x4f8a3a, 0x5f9a42, 0x3c6c2e, 0x7aae52], cr: 1.5, n: 22, litter: 'green' },
    { id: 'maple-turning', shape: 'round', h: 10, w: 8.5, r0: 0.34, bark: [0x5a4636, 0x463628], leaves: [0x7a9a3a, 0xd48a30, 0x5a7a2e, 0xe8ac4a], cr: 1.35, n: 18, mix: true, litter: 'orange' },
    { id: 'willow', shape: 'willow', h: 10, w: 11, r0: 0.5, bark: [0x5e5040, 0x4c4034], leaves: [0xb4b23e, 0xa2a638, 0x84882c, 0xd2ca5c], cr: 1.3, n: 18, litter: 'green' },
    { id: 'red-oak', shape: 'spread', h: 12, w: 12, r0: 0.55, bark: [0x4a3a2c, 0x3a2e22], leaves: [0x8e2a24, 0xa83c2a, 0x681e1a, 0xc2543a], cr: 1.55, n: 24, litter: 'red' },
    { id: 'plane', shape: 'vase', h: 14, w: 11, r0: 0.45, bark: [0xa89c80, 0x8a7e64], leaves: [0xb8a23c, 0x8a9a3a, 0xc88a34, 0xd8b85a], cr: 1.5, n: 22, mix: true, litter: 'gold' },
    { id: 'elm', shape: 'vase', h: 14, w: 12, r0: 0.45, bark: [0x5a4a3a, 0x4a3c2e], leaves: [0xd9a93a, 0xe8c050, 0xa87a26, 0xf2d672], cr: 1.5, n: 22, litter: 'gold' },
    { id: 'ginkgo', shape: 'column', h: 12, w: 7, r0: 0.3, bark: [0x6a5a48, 0x584a3a], leaves: [0xf0c830, 0xf6da50, 0xc89a1e, 0xfff080], cr: 1.2, n: 20, litter: 'gold' },
    { id: 'sweetgum', shape: 'round', h: 12, w: 9, r0: 0.38, bark: [0x4e3e30, 0x3e3024], leaves: [0x6a2a3a, 0x8a3040, 0x4a1c28, 0xb04a3a], cr: 1.4, n: 20, mix: false, litter: 'red' },
    { id: 'pin-oak', shape: 'spread', h: 12, w: 12, r0: 0.5, bark: [0x4a3a2c, 0x3a2e22], leaves: [0x8a4a2a, 0xa65a30, 0x663420, 0xc0763e], cr: 1.55, n: 24, litter: 'brown' },
  ];
  L.treeSpecs = SPECS;

  // build a tree Model. vs = metres per voxel. returns {m, trunkR (m), trunkH (m), crownR (m)}
  function makeTree(spec, seed, vs) {
    const R = AF.rng(seed * 7919 + 13);
    const u = 1 / vs, sc = (a) => a * u;
    const Hm = spec.h * (0.88 + R() * 0.24), Wm = spec.w * (0.88 + R() * 0.24);
    const Wv = Math.ceil(sc(Wm)) + 6, Hv = Math.ceil(sc(Hm)) + 4;
    const m = new AF.Model(Wv, Hv, Wv);
    const cx = Wv / 2, cz = Wv / 2;
    const col = (hex, o) => AF.col(hex, o);
    const bark = [col(spec.bark[0], { jitter: 0.7, edge: 0.4 }), col(spec.bark[1], { jitter: 0.7, edge: 0.4 })];
    const mark = spec.marks != null ? col(spec.marks, { jitter: 0.3 }) : 0;
    const lv = spec.leaves.map((h) => col(h, { jitter: 1, edge: 0.35, solid: false }));
    const hifi = vs <= 0.13;
    const put = (x, y, z, c) => { const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z); if (m.in(xi, yi, zi)) m.set(xi, yi, zi, c); };
    const putIfEmpty = (x, y, z, c) => { const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z); if (m.in(xi, yi, zi) && !m.get(xi, yi, zi)) m.set(xi, yi, zi, c); };
    const barkAt = (x, y, z) => {
      if (mark && hash(Math.floor(y) * 3 + Math.floor(x) * 11 + 1, Math.floor(z) * 7 + seed) < 0.2 && Math.floor(y) > 2) return mark;
      return hash(Math.floor(x) * 5 + 1, Math.floor(z) * 7 + seed) < 0.35 ? bark[1] : bark[0];
    };
    // disc of wood at height y
    const disc = (x, y, z, r) => {
      if (r < 0.75) { put(x, y, z, barkAt(x, y, z)); return; }
      for (let dx = -Math.ceil(r); dx <= Math.ceil(r); dx++) for (let dz = -Math.ceil(r); dz <= Math.ceil(r); dz++) {
        const px = Math.floor(x) + dx + 0.5, pz = Math.floor(z) + dz + 0.5;
        if ((px - x) ** 2 + (pz - z) ** 2 <= r * r) put(px, y, pz, barkAt(px, y, pz));
      }
    };
    // thick wood segment from a to b with radius ra -> rb (voxels)
    const limb = (ax, ay, az, bx, by, bz, ra, rb) => {
      const n = Math.ceil(Math.hypot(bx - ax, by - ay, bz - az) * 1.6) + 1;
      for (let i = 0; i <= n; i++) {
        const t = i / n, x = ax + (bx - ax) * t, y = ay + (by - ay) * t, z = az + (bz - az) * t, r = ra + (rb - ra) * t;
        if (r < 0.75) put(x, y, z, barkAt(x, y, z));
        else for (let dy = -Math.floor(r * 0.7); dy <= Math.floor(r * 0.7); dy++) disc(x, y + dy, z, Math.sqrt(Math.max(0, r * r - dy * dy)));
      }
    };
    // leaf cluster: a chunky bevelled voxel box (merge-friendly), light top layer, dark underside
    const put2 = (px, py, pz, c) => { for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) for (let e = 0; e < 2; e++) putIfEmpty(px + a, py + b, pz + e, c); };
    const blob = (x, y, z, r, ry, tone) => {
      const base = lv[tone];
      if (hifi) {
        // v2 crown: leaf mass at 1/4 m cells (2x2x2 of the 1/8 grid — cheap to mesh) with a lumpy, fringed, drooping edge;
        // branches + twigs stay at 1/8 m and poke through the gaps
        r = Math.min(r, 18); ry = Math.min(ry, 14);
        const rr = Math.ceil(Math.max(r, ry) / 2) + 1, gx = Math.floor(x / 2) * 2, gy = Math.floor(y / 2) * 2, gz = Math.floor(z / 2) * 2;
        for (let dx = -rr; dx <= rr; dx++) for (let dy = -rr; dy <= rr; dy++) for (let dz = -rr; dz <= rr; dz++) {
          const px = gx + dx * 2, py = gy + dy * 2, pz = gz + dz * 2;
          const ex = (px + 1 - x) / r, ey = (py + 1 - y) / ry, ez = (pz + 1 - z) / r;
          const d = ex * ex + ey * ey + ez * ez;
          if (d > 1.25) continue;
          const hq = hash(px * 7 + py * 131 + seed, pz * 13 + py * 3);
          const lump = (N2(px * 0.11 + seed * 0.37, pz * 0.11 + py * 0.09) - 0.5) * 0.9;
          if (d > 0.78 + lump) continue;
          if (d > 0.55 + lump && hq < 0.13) continue;
          if (ey < -0.5 && hq > 0.93) put2(px, py - 2, pz, lv[2]);
          put2(px, py, pz, ey < -0.3 ? lv[2] : ey > 0.35 ? (hq < 0.7 ? lv[3] : base) : (hq < 0.12 ? lv[1] : base));
        }
        return;
      }
      r = Math.min(r, 7); ry = Math.min(ry, 6);
      const rr = Math.ceil(Math.max(r, ry));
      for (let dx = -rr; dx <= rr; dx++) for (let dy = -rr; dy <= rr; dy++) for (let dz = -rr; dz <= rr; dz++) {
        const px = Math.floor(x) + dx, py = Math.floor(y) + dy, pz = Math.floor(z) + dz;
        const ex = (px + 0.5 - x) / r, ey = (py + 0.5 - y) / ry, ez = (pz + 0.5 - z) / r;
        if (ex * ex + ey * ey + ez * ez > 1) continue;
        putIfEmpty(px, py, pz, ey < -0.35 ? lv[2] : ey > 0.45 ? lv[3] : base);
      }
    };
    const cluster = (x, y, z, r, ry, tone) => {
      if (useBlob) return blob(x, y, z, r, ry, tone);
      const base = lv[tone];
      const hx = Math.max(1, Math.round(r)), hy = Math.max(1, Math.round(ry)), hz = Math.max(1, Math.round(r * (0.8 + hash(Math.floor(x), Math.floor(z) + seed) * 0.4)));
      const bev = Math.min(hx, hz, hy) >= 4 ? 2 : 1;
      const x0 = Math.floor(x), y0 = Math.floor(y), z0 = Math.floor(z);
      const fillBox = (ax, ay, az, bx, by, bz) => {
        for (let px = x0 + ax; px < x0 + bx; px++) for (let py = y0 + ay; py < y0 + by; py++) for (let pz = z0 + az; pz < z0 + bz; pz++) {
          if (!m.in(px, py, pz) || m.get(px, py, pz)) continue;
          const c = py >= y0 + hy - 1 ? lv[3] : py <= y0 - hy ? lv[2] : base;
          m.set(px, py, pz, c);
        }
      };
      for (let b = 0; b <= bev; b++) {
        fillBox(-hx + b, -hy + (bev - b), -hz + bev, hx - b, hy - (bev - b), hz - bev);
        fillBox(-hx + bev, -hy + (bev - b), -hz + b, hx - bev, hy - (bev - b), hz - b);
      }
    };
    const toneOf = () => spec.mix ? (R() < 0.45 ? 0 : 1) : (R() < 0.7 ? 0 : 1);
    const simple = vs >= 0.99, useBlob = vs <= 0.26 && spec.shape !== 'cone';
    const r0 = Math.max(0.6, sc(spec.r0)), lean = [(R() - 0.5) * 0.08, (R() - 0.5) * 0.08];
    let trunkH;

    const trunk = (tx, tz, topY, ra, rb, lx, lz) => {
      for (let y = 0; y < topY; y++) {
        const t = y / topY, r = ra + (rb - ra) * t;
        const fl = y < 3 ? (3 - y) * (ra < 1 ? 0.25 : 0.45) * ra : 0;         // root flare
        disc(tx + lx * y, y, tz + lz * y, r + fl);
      }
      // surface roots
      const nr = simple ? 0 : 3 + Math.floor(R() * 3);
      for (let i = 0; i < nr; i++) {
        const a = (i / nr) * Math.PI * 2 + R() * 0.8, len = ra + 1.5 + R() * 2.5;
        limb(tx, 0.5, tz, tx + Math.cos(a) * len, 0, tz + Math.sin(a) * len, Math.max(0.5, ra * 0.5), 0.4);
      }
    };

    if (spec.shape === 'cone' || spec.shape === 'pine') {
      trunkH = Hv - 3;
      trunk(cx, cz, trunkH, r0, 0.5, lean[0] * 0.3, lean[1] * 0.3);
      const baseY = sc(spec.shape === 'pine' ? Hm * 0.3 : 1.4), topY = sc(Hm);
      const maxR = sc(Wm / 2);
      if (spec.shape === 'cone') {
        const tierH = Math.max(2, Math.round(sc(0.9)));
        for (let y = baseY, ti = 0; y < topY; y += tierH, ti++) {
          const t = (y - baseY) / (topY - baseY), R1 = maxR * Math.pow(1 - t, 0.95) * (ti % 2 ? 0.8 : 1) + 0.6;
          cluster(cx + (ti % 3 === 1 ? 0.5 : 0), y + tierH / 2, cz + (ti % 3 === 2 ? 0.5 : 0), Math.max(1, R1), Math.max(1, tierH / 2 + 0.5), ti % 3 === 1 ? 1 : 0);
        }
        for (let y = topY; y < topY + sc(0.8); y++) putIfEmpty(cx, y, cz, lv[3]);
      } else {
        // white pine: irregular horizontal tufts on whorled branches
        const whorls = 6 + Math.floor(R() * 2);
        for (let wI = 0; wI < whorls; wI++) {
          const t = wI / (whorls - 1), y = baseY + (topY - baseY) * t;
          const nb = 3 + Math.floor(R() * 2), len = maxR * (1 - t * 0.75) * (0.7 + R() * 0.3);
          for (let b = 0; b < nb; b++) {
            const a = R() * Math.PI * 2, ex = cx + Math.cos(a) * len, ez = cz + Math.sin(a) * len, ey = y + R() * 2 - 0.5;
            if (!simple) limb(cx, y, cz, ex, ey, ez, Math.max(0.5, r0 * 0.5), 0.45);
            const cr = sc(spec.cr) * (0.9 + R() * 0.5);
            cluster(ex, ey + 0.5, ez, cr * 1.3, cr * 0.55, R() < 0.7 ? 0 : 1);
            if (R() < 0.3) cluster((ex + cx) / 2, y + 0.3, (ez + cz) / 2, cr, cr * 0.5, 0);
          }
        }
        cluster(cx, topY - 1, cz, sc(1.0), sc(1.2), 0);
      }
    } else {
      const shape = spec.shape;
      const trunkFrac = shape === 'spread' ? 0.34 : shape === 'column' ? 0.85 : shape === 'vase' ? 0.3 : shape === 'willow' ? 0.36 : 0.45;
      trunkH = Math.round(sc(Hm) * trunkFrac);
      const stems = spec.stems || 1;
      const crownY = sc(Hm) * (shape === 'spread' ? 0.64 : shape === 'column' ? 0.62 : shape === 'vase' ? 0.7 : shape === 'willow' ? 0.66 : 0.63);
      const rx = sc(Wm / 2) * 0.88, ry = sc(Hm) * (shape === 'spread' ? 0.26 : shape === 'column' ? 0.38 : shape === 'vase' ? 0.28 : shape === 'willow' ? 0.3 : 0.34);
      const tops = [];
      for (let s = 0; s < stems; s++) {
        const off = stems > 1 ? (s - (stems - 1) / 2) * 1.6 : 0, lx = stems > 1 ? (s - (stems - 1) / 2) * 0.05 + lean[0] : lean[0], lz = lean[1];
        const tx = cx + off, tz = cz + (stems > 1 ? (s % 2 ? 0.8 : -0.8) : 0);
        const th = stems > 1 ? Math.round(trunkH * (1 - s * 0.08)) : trunkH;
        trunk(tx, tz, th, stems > 1 ? r0 * 0.85 : r0, Math.max(0.5, r0 * 0.45), lx, lz);
        tops.push([tx + lx * th, th, tz + lz * th]);
      }
      // branches to clusters
      const nB = simple ? 4 : vs >= 0.5 ? 5 : shape === 'column' ? 7 : shape === 'spread' ? 8 : 6;
      const ends = [];
      for (let b = 0; b < nB; b++) {
        const [sx, sy, sz] = tops[b % tops.length];
        const a = (b / nB) * Math.PI * 2 + R() * 0.7;
        const reach = shape === 'column' ? 0.55 : shape === 'spread' ? 0.92 : 0.75;
        const fromY = shape === 'column' ? sy * (0.55 + R() * 0.4) : sy - R() * sc(1.2);
        const ex = cx + Math.cos(a) * rx * reach * (0.75 + R() * 0.25), ez = cz + Math.sin(a) * rx * reach * (0.75 + R() * 0.25);
        const ey = shape === 'spread' ? crownY - ry * 0.1 + R() * ry * 0.4 : shape === 'vase' ? crownY + ry * 0.2 : crownY + (R() - 0.3) * ry * 0.8;
        if (simple) { ends.push([ex, ey, ez]); continue; }
        limb(sx, fromY, sz, ex, ey, ez, shape === 'column' ? 0.5 : Math.max(0.6, r0 * 0.6), 0.45);
        // twig fork
        if (vs >= 0.5) { ends.push([ex, ey, ez]); continue; }
        const a2 = a + (R() - 0.5) * 1.4;
        const fx = ex + Math.cos(a2) * sc(1.2), fz = ez + Math.sin(a2) * sc(1.2);
        limb(ex, ey, ez, fx, ey + sc(0.8), fz, 0.45, 0.45);
        ends.push([fx, ey + sc(0.8), fz]); if (!useBlob && R() < 0.3) ends.push([ex, ey, ez]);
      }
      // central leader for round / vase trees
      if (shape !== 'column' && !simple) limb(tops[0][0], tops[0][1], tops[0][2], cx, crownY + ry * 0.5, cz, Math.max(0.6, r0 * 0.5), 0.45);
      const cr = Math.max(sc(spec.cr), vs >= 0.5 ? 1.6 : 0) * (vs >= 0.99 ? 1.25 : 1);
      const flat = shape === 'spread' ? 0.62 : shape === 'vase' ? 0.75 : 0.85;
      for (const e of ends) cluster(e[0], e[1] + 0.5, e[2], cr * (1.15 + R() * 0.4), cr * flat * (1.15 + R() * 0.4), toneOf());
      // fill the crown shell with more clusters
      let placed = 0, guard = 0;
      while (placed < Math.round(spec.n * (simple ? 0.12 : hifi ? 1.0 : useBlob ? 0.24 : 0.22)) && guard++ < 400) {
        const px = (R() * 2 - 1), py = (R() * 2 - 1), pz = (R() * 2 - 1), d = px * px + py * py + pz * pz;
        if (d > 1 || d < 0.2) continue;
        cluster(cx + px * rx * (useBlob ? 0.72 : 0.85), crownY + py * ry * (shape === 'vase' ? 0.8 : useBlob ? 0.72 : 0.85), cz + pz * rx * (useBlob ? 0.72 : 0.85), cr * (1.1 + R() * 0.45), cr * flat * (1.1 + R() * 0.45), toneOf());
        placed++;
      }
      cluster(cx, crownY + ry * 0.75, cz, cr * 1.1, cr * flat, toneOf());
      cluster(cx, crownY, cz, rx * 0.55, ry * 0.55, 0);           // dense core so there are no see-through holes
      if (useBlob) {   // fill enclosed air inside the crown (hidden faces cost quads)
        const fx = rx * (hifi ? 0.55 : 0.8), fy = ry * (hifi ? 0.52 : 0.78);
        const stp = hifi ? 2 : 1, o0 = (v) => hifi ? Math.floor(v / 2) * 2 : Math.floor(v);
        for (let px = o0(cx - fx); px <= cx + fx; px += stp) for (let py = o0(crownY - fy); py <= crownY + fy; py += stp) for (let pz = o0(cz - fx); pz <= cz + fx; pz += stp) {
          const ex = (px + stp / 2 - cx) / fx, ey = (py + stp / 2 - crownY) / fy, ez = (pz + stp / 2 - cz) / fx;
          if (ex * ex + ey * ey + ez * ez <= 1) { if (hifi) put2(px, py, pz, lv[2]); else putIfEmpty(px, py, pz, lv[2]); }
        }
      }
      if (shape === 'willow') {
        // weeping curtains
        const nS = Math.round(rx * 5);
        for (let i = 0; i < nS; i++) {
          const a = R() * Math.PI * 2, rr = rx * (0.55 + R() * 0.5), sx = cx + Math.cos(a) * rr, sz = cz + Math.sin(a) * rr;
          const sy = crownY - ry * 0.45, len = sc(1.0 + R() * 2.2);
          const c = R() < 0.5 ? lv[0] : R() < 0.5 ? lv[3] : lv[1];
          for (let y = 0; y < len; y++) putIfEmpty(sx, sy - y, sz, c);
        }
      }
    }
    return { m, trunkR: Math.max(0.3, spec.r0 * 1.1), trunkH: trunkH * vs, crownR: Wm / 2, h: Hm };
  }
  L.makeTree = makeTree;

  // ------------------------------------------------------------ small props
  function makeBush(kind, seed) {           // vs 1/8
    const R = AF.rng(seed + 991);
    const pal = {
      burning: [0xc0302a, 0xd8482e, 0x8e2020, 0xec6a44], box: [0x3f6e34, 0x4d7f3c, 0x2e5428, 0x62924a],
      golden: [0xd0a030, 0xe0b840, 0xa47a22, 0xf0d060], sumac: [0xb84a26, 0xd07030, 0x80321e, 0xe89a48], berry: [0x5a7a36, 0x6a8a3e, 0x44602a, 0x7aa050],
    }[kind];
    const lv = pal.map((h) => AF.col(h, { jitter: 1, edge: 0.3, solid: false }));
    const w = 14 + Math.floor(R() * 8), h = 9 + Math.floor(R() * 6), m = new AF.Model(w + 2, h + 2, w + 2);
    const cx = (w + 2) / 2, cz = (w + 2) / 2;
    const nC = 4 + Math.floor(R() * 3);
    for (let i = 0; i < nC; i++) {
      const a = R() * Math.PI * 2, d = R() * w * 0.25, r = 3 + Math.floor(R() * 3), ry = 2 + Math.floor(R() * 3);
      const x = Math.floor(cx + Math.cos(a) * d), z = Math.floor(cz + Math.sin(a) * d), y = ry + Math.floor(R() * Math.max(1, h - ry * 2));
      const tone = i % 3 === 1 ? lv[1] : lv[0];
      for (let b = 0; b <= 1; b++) for (let px = x - r + b; px < x + r - b; px++) for (let py = y - ry + (1 - b); py < y + ry - (1 - b); py++) for (let pz = z - r + (1 - b); pz < z + r - (1 - b); pz++) {
        if (m.get(px, py, pz)) continue;
        m.set(px, py, pz, py >= y + ry - 1 ? lv[3] : py <= y - ry ? lv[2] : tone);
      }
    }
    if (kind === 'berry') { const red = AF.col(0xc4262a, { jitter: 0.2, solid: false }); for (let i = 0; i < 18; i++) { const x = Math.floor(R() * m.w), z = Math.floor(R() * m.d); for (let y = m.h - 1; y >= 0; y--) if (m.get(x, y, z)) { m.set(x, y + 1, z, red); break; } } }
    return m;
  }
  function makeBoulder(seed, size, mossy) {  // vs 1/4 (size in voxels)
    const R = AF.rng(seed + 311);
    const st = [AF.col(0x8e8a82, { jitter: 0.9, edge: 0.6 }), AF.col(0x7a766f, { jitter: 0.9, edge: 0.6 }), AF.col(0xa29d93, { jitter: 0.9, edge: 0.6 })];
    const moss = AF.col(0x5f7d36, { jitter: 1, edge: 0.3 }), lichen = AF.col(0xb8b070, { jitter: 0.8 });
    const s = size, m = new AF.Model(s * 2 + 2, s + 3, s * 2 + 2);
    const blobs = 2 + Math.floor(R() * 3);
    for (let b = 0; b < blobs; b++) {
      const r = s * (0.55 + R() * 0.45), x = s + 1 + (R() - 0.5) * s * 0.8, z = s + 1 + (R() - 0.5) * s * 0.8;
      m.sphere(x, r * 0.55, z, r, st[0], (px, py, pz) => {
        const dy = (py + 0.5 - r * 0.55) / r; if (dy > 0.72) return 0;
        const hh = hash(px * 13 + py * 7, pz * 5 + seed);
        if (mossy && dy > 0.4 && hh < 0.7) return moss;
        if (hh > 0.96) return lichen;
        return st[(hash(Math.floor(px / 2) + py, Math.floor(pz / 2) + seed) * 3) | 0];
      });
    }
    return m;
  }
  function makeFlowers(seed, kind) {         // vs 1/16, a 1.25 m patch
    const R = AF.rng(seed + 77);
    const S = 20, m = new AF.Model(S, 12, S);
    const stem = AF.col(0x557a34, { jitter: 0.6, solid: false }), stem2 = AF.col(0x6f8a3c, { jitter: 0.6, solid: false });
    const bloom = {
      aster: [0x8a6ac8, 0xa488dc], golden: [0xe0b030, 0xf0c840], daisy: [0xf2eee2, 0xe8c040], mixed: [0xc84040, 0xe0b030], chicory: [0x7a9ae0, 0xf2eee2],
    }[kind].map((h) => AF.col(h, { jitter: 0.5, edge: 0.2, solid: false }));
    const n = 6 + Math.floor(R() * 4);
    for (let i = 0; i < n; i++) {
      const x = 2 + Math.floor(R() * (S - 4)), z = 2 + Math.floor(R() * (S - 4)), h = 4 + Math.floor(R() * 7);
      { const sc2 = R() < 0.5 ? stem : stem2; for (let y = 0; y < h; y++) m.set(x, y, z, sc2); }
      const c = bloom[R() < 0.72 ? 0 : 1];
      if (kind === 'golden') { for (let y = h - 3; y < h + 1; y++) { m.set(x, y, z, c); if (R() < 0.6) m.set(x + 1, y, z, c); if (R() < 0.4) m.set(x, y, z + 1, c); } }
      else { m.set(x, h, z, c); m.set(x + 1, h, z, c); m.set(x - 1, h, z, c); m.set(x, h, z + 1, c); m.set(x, h, z - 1, c); if (kind === 'daisy') m.set(x, h + 1, z, bloom[1]); }
    }
    return m;
  }
  function makeGrass(seed, dry) {            // vs 1/16 tuft
    const R = AF.rng(seed + 55);
    const S = 14, m = new AF.Model(S, 16, S);
    const cs = (dry ? [0xb8a45a, 0xa89448, 0xcdb870] : [0x6a9a3e, 0x7ea846, 0x8aa84e]).map((h) => AF.col(h, { jitter: 0.6, edge: 0.1, solid: false }));
    const seedHead = AF.col(0xd8c890, { jitter: 0.4, solid: false });
    const n = 7 + Math.floor(R() * 5);
    for (let i = 0; i < n; i++) {
      let x = 4 + R() * 6, z = 4 + R() * 6; const h = 6 + Math.floor(R() * 10), ax = (R() - 0.5) * 0.5, az = (R() - 0.5) * 0.5, c = cs[(R() * 3) | 0];
      for (let y = 0; y < h; y++) m.set(x + (y > h * 0.7 ? Math.sign(ax) : 0), y, z, c);
      if (R() < 0.3) m.set(x, h, z, seedHead);
    }
    return m;
  }
  function makeCattails(seed) {              // vs 1/16
    const R = AF.rng(seed + 123);
    const S = 18, m = new AF.Model(S, 34, S);
    const blade = [AF.col(0x5f7f38, { jitter: 0.6, solid: false }), AF.col(0x7c8e42, { jitter: 0.6, solid: false }), AF.col(0x9a9a52, { jitter: 0.6, solid: false })];
    const head = AF.col(0x5a3a22, { jitter: 0.4, solid: false }), spike = AF.col(0xa89a6a, { jitter: 0.3, solid: false });
    const n = 3 + Math.floor(R() * 3);
    for (let i = 0; i < n; i++) {
      const x = 3 + Math.floor(R() * 12), z = 3 + Math.floor(R() * 12), h = 18 + Math.floor(R() * 12);
      for (let y = 0; y < h; y++) m.set(x, y, z, blade[0]);
      for (let y = h - 6; y < h - 1; y++) { m.set(x, y, z, head); m.set(x + 1, y, z, head); m.set(x, y, z + 1, head); m.set(x + 1, y, z + 1, head); }
      m.set(x, h, z, spike); m.set(x, h + 1, z, spike);
    }
    for (let i = 0; i < 5; i++) {
      let x = 2 + R() * 14, z = 2 + R() * 14; const h = 10 + Math.floor(R() * 14), ax = (R() - 0.5) * 0.9, az = (R() - 0.5) * 0.9, c = blade[(R() * 3) | 0];
      for (let y = 0; y < h; y++) m.set(x + (y > h * 0.75 ? Math.sign(ax) : 0), y, z, c);
    }
    return m;
  }
  function makeLilies(seed) {                // vs 1/16, flat on the water
    const R = AF.rng(seed + 17);
    const S = 40, m = new AF.Model(S, 3, S);
    const pad = [AF.col(0x4a7a34, { jitter: 0.5, solid: false }), AF.col(0x5e8c3c, { jitter: 0.5, solid: false })];
    const fl = [AF.col(0xf0c8d8, { jitter: 0.3, solid: false }), AF.col(0xf6f0e0, { jitter: 0.3, solid: false })], yel = AF.col(0xf0c040, { jitter: 0.2, solid: false });
    const n = 4 + Math.floor(R() * 4);
    for (let i = 0; i < n; i++) {
      const x = 6 + R() * 28, z = 6 + R() * 28, r = 3 + R() * 3, notch = R() * Math.PI * 2, c = pad[(R() * 2) | 0];
      for (let dx = -6; dx <= 6; dx++) for (let dz = -6; dz <= 6; dz++) {
        const d = Math.hypot(dx, dz); if (d > r) continue;
        const a = Math.atan2(dz, dx); if (d > 0.8 && Math.abs(AF.angDiff(a, notch)) < 0.3) continue;
        m.set(x + dx, 0, z + dz, c);
      }
      if (R() < 0.45) { const fc = fl[(R() * 2) | 0]; m.set(x, 1, z, yel); m.set(x + 1, 1, z, fc); m.set(x - 1, 1, z, fc); m.set(x, 1, z + 1, fc); m.set(x, 1, z - 1, fc); m.set(x + 1, 2, z + 1, fc); m.set(x - 1, 2, z - 1, fc); }
    }
    return m;
  }
  function makeLog(seed) {                   // vs 1/8, lies along x
    const R = AF.rng(seed + 401);
    const len = 32 + Math.floor(R() * 16), r = 3 + R() * 1.5, m = new AF.Model(len + 2, Math.ceil(r * 2) + 4, Math.ceil(r * 2) + 8);
    const bark = [AF.col(0x5a4636, { jitter: 0.8 }), AF.col(0x463628, { jitter: 0.8 })], inner = AF.col(0xb08a5a, { jitter: 0.5 }), ring = AF.col(0x8a6a44, { jitter: 0.4 });
    const moss = AF.col(0x5f7d36, { jitter: 1, edge: 0.3 }), capR = AF.col(0xc03a2a, { jitter: 0.3 }), capB = AF.col(0xb08850, { jitter: 0.4 }), dot = AF.col(0xf2eee2, { jitter: 0.1 }), stalk = AF.col(0xe8e0cc, { jitter: 0.2 });
    const cy = r, cz = m.d / 2;
    for (let x = 1; x < len; x++) for (let y = 0; y < m.h; y++) for (let z = 0; z < m.d; z++) {
      const d = Math.hypot(y + 0.5 - cy, z + 0.5 - cz); if (d > r) continue;
      const end = x === 1 || x === len - 1;
      let c = end ? (Math.floor(d * 1.3) % 2 ? ring : inner) : bark[hash(x * 3 + y, z * 5 + seed) < 0.3 ? 1 : 0];
      if (!end && y + 0.5 > cy + r * 0.45 && hash(Math.floor(x / 3), z + seed) < 0.55) c = moss;
      m.set(x, y, z, c);
    }
    // branch stub
    const bx = Math.floor(len * (0.3 + R() * 0.4)); for (let i = 0; i < 5; i++) m.set(bx + i, Math.floor(cy) + 1 + Math.floor(i * 0.6), Math.floor(cz + r) + Math.min(3, i), bark[0]);
    // mushrooms along the side
    for (let i = 0; i < 4; i++) {
      const mx = 3 + Math.floor(R() * (len - 6)), mz = Math.floor(cz - r - 1), cap = R() < 0.5 ? capR : capB;
      m.set(mx, 0, mz, stalk); m.set(mx, 1, mz, cap); m.set(mx + 1, 1, mz, cap); m.set(mx - 1, 1, mz, cap); m.set(mx, 1, mz - 1, cap); m.set(mx, 2, mz, cap);
      if (cap === capR) m.set(mx, 2, mz, dot);
    }
    return m;
  }
  function makeStump(seed) {                 // vs 1/8
    const R = AF.rng(seed + 808);
    const r = 3.5 + R() * 2, h = 4 + Math.floor(R() * 5), S = Math.ceil(r * 2) + 8, m = new AF.Model(S, h + 3, S);
    const bark = AF.col(0x4e3e2e, { jitter: 0.8 }), inner = AF.col(0xb89060, { jitter: 0.5 }), ring = AF.col(0x94704a, { jitter: 0.4 }), moss = AF.col(0x5f7d36, { jitter: 1 });
    const cap = AF.col(0xc8a060, { jitter: 0.3 }), stalk = AF.col(0xe8e0cc, { jitter: 0.2 });
    const c0 = S / 2;
    for (let y = 0; y < h; y++) for (let x = 0; x < S; x++) for (let z = 0; z < S; z++) {
      const d = Math.hypot(x + 0.5 - c0, z + 0.5 - c0), rr = r + (y === 0 ? 1.5 : y === 1 ? 0.7 : 0);
      if (d > rr) continue;
      let c = d > r - 1 || y < h - 1 ? bark : (Math.floor(d * 1.4) % 2 ? ring : inner);
      if (d > r - 1 && y < 2 && hash(x, z + y + seed) < 0.5) c = moss;
      m.set(x, y, z, c);
    }
    for (let i = 0; i < 3; i++) { const a = R() * 6.28, x = Math.floor(c0 + Math.cos(a) * (r + 2)), z = Math.floor(c0 + Math.sin(a) * (r + 2)); m.set(x, 0, z, stalk); m.set(x, 1, z, cap); m.set(x + 1, 1, z, cap); m.set(x, 1, z + 1, cap); }
    return m;
  }
  function makeMushrooms(seed) {             // vs 1/16
    const R = AF.rng(seed + 4242);
    const S = 16, m = new AF.Model(S, 8, S);
    const red = AF.col(0xc8342a, { jitter: 0.3, solid: false }), dot = AF.col(0xf4f0e4, { jitter: 0.1, solid: false }), brown = AF.col(0x9a6e42, { jitter: 0.4, solid: false }), stalk = AF.col(0xece4d0, { jitter: 0.2, solid: false });
    const n = 3 + Math.floor(R() * 4);
    for (let i = 0; i < n; i++) {
      const x = 3 + Math.floor(R() * 10), z = 3 + Math.floor(R() * 10), h = 2 + Math.floor(R() * 3), cap = R() < 0.55 ? red : brown;
      for (let y = 0; y < h; y++) m.set(x, y, z, stalk);
      for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) { if (Math.abs(dx) + Math.abs(dz) > 3) continue; m.set(x + dx, h, z + dz, cap); if (Math.abs(dx) + Math.abs(dz) <= 1) m.set(x + dx, h + 1, z + dz, cap); }
      if (cap === red) { m.set(x + 1, h + 1, z, dot); m.set(x - 2, h, z + 1, dot); m.set(x, h + 1, z - 1, dot); }
    }
    return m;
  }

  // ------------------------------------------------------------ placement rules (Port Solace: Solace Heights, map-edge strips, fill back yards)
  const park = P.park;
  const VIL = L.VILLAS || [];
  const laneNear = (x, z, m) => { for (const p of (L.lanePts || [])) if (Math.abs(p[0] - x) < m + 5 && Math.abs(p[1] - z) < m + 5 && Math.hypot(p[0] - x, p[1] - z) < m + 5) return true; return false; };
  const allowed = (x, z, r, mode) => {
    if (x < -298 || x > 298 || z < -298 || z > 204) return false;
    const lot = L.inLot(x, z, mode === 'tree' ? r * 0.5 : 0.3);
    if (lot && !lot.fill) return false;
    if (x > park.x0 - 2 && x < park.x1 + 2 && z > park.z0 - 2 && z < park.z1 + 2) return false;
    if (P.nearestRoad(x, z).edge < 3.3 + (mode === 'tree' ? Math.min(r * 0.5, 3) : 0.3)) return false;
    if (laneNear(x, z, mode === 'tree' ? 3.5 : 2.4)) return false;
    for (const v of VIL) if (x > v.x - v.w / 2 - 5 - r * 0.4 && x < v.x + v.w / 2 + 5 + r * 0.4 && z > v.z - v.d / 2 - 5 - r * 0.4 && z < v.z + v.d / 2 + 6 + r * 0.4) return false;
    return true;
  };
  L.natureAllowed = allowed;
  const footprint = (x, z, r) => {
    let lo = 1e9, hi = -1e9;
    for (const [dx, dz] of [[0, 0], [r, 0], [-r, 0], [0, r], [0, -r]]) { const y = W.groundY(x + dx, z + dz); if (y < lo) lo = y; if (y > hi) hi = y; }
    return { lo, hi };
  };
  const occupied = (x, y, z, r, hgt) => {
    for (const [dx, dz] of [[0, 0], [r, 0], [-r, 0], [0, r], [0, -r]]) for (let yy = y + 0.3; yy < y + hgt; yy += 1.2) if (W.getM(x + dx, yy, z + dz)) return true;
    return false;
  };

  // ------------------------------------------------------------ AF.nature.tree(kind, x, z, scale) — shared tree builder (streets-park uses it for park/street trees)
  //   kind: any spec id ('maple-scarlet','maple-orange','maple-gold','maple-turning','oak','red-oak','elm-green','plane','birch','aspen','pine','spruce','willow')
  //   or an alias: 'maple' (random maple), 'elm', 'plane', 'autumn' (random autumn tree). No placement checks — the caller owns the spot.
  const ALIAS = { maple: ['maple-scarlet', 'maple-orange', 'maple-gold', 'maple-turning'], elm: ['elm-green'], autumn: ['maple-scarlet', 'maple-orange', 'maple-gold', 'oak', 'red-oak', 'plane', 'maple-turning'] };
  const treeCache = new Map();
  const treeGeo = (id, scale, variant) => {
    const key = id + '|' + scale.toFixed(2) + '|' + variant;
    let t = treeCache.get(key);
    if (!t) {
      const si = Math.max(0, SPECS.findIndex((s) => s.id === id)), s0 = SPECS[si];
      const spec = scale === 1 ? s0 : Object.assign({}, s0, { h: s0.h * scale, w: s0.w * scale, r0: s0.r0 * Math.sqrt(scale) });
      t = makeTree(spec, si * 10 + 200 + variant, 0.25);
      t.geo = AF.meshModel(t.m, { vs: 0.25, anchor: [0.5, 0, 0.5] }); t.m = null; t.id = s0.id;
      treeCache.set(key, t);
    }
    return t;
  };
  AF.nature = {
    kinds: () => SPECS.map((s) => s.id).concat(Object.keys(ALIAS)),
    tree(kind = 'autumn', x, z, scale = 1, o = {}) {
      const hv = hash(Math.floor(x * 3), Math.floor(z * 3));
      let id = kind; if (ALIAS[kind]) id = ALIAS[kind][(hv * ALIAS[kind].length) | 0];
      if (!SPECS.find((s) => s.id === id)) id = 'maple-gold';
      const sc = Math.round(clamp(scale, 0.4, 1.6) * 4) / 4;
      const t = treeGeo(id, sc, hv < 0.5 ? 0 : 1);
      const y = (o.y ?? W.groundY(x, z)) - 0.25;
      AF.placeStatic(t.geo, x, y, z, (hash(Math.floor(x * 7), Math.floor(z * 5)) * 4) | 0, { collide: false });
      AF.addCollider(x - t.trunkR, y, z - t.trunkR, x + t.trunkR, y + Math.max(2.5, t.trunkH), z + t.trunkR, 'tree');
      (L.trees = L.trees || []).push({ id, x, z, r: t.crownR, big: true });
      (AF.canopies = AF.canopies || []).push({ x, y: y + t.h * 0.66, z, r: t.crownR, col: (SPECS.find((s) => s.id === id) || SPECS[0]).leaves[0], id });
      return { id, crownR: t.crownR, h: t.h };
    },
  };

  // ------------------------------------------------------------ AF.TREEKIT — v2 high-fidelity tree kit (1/8 m voxels, branch structure, noisy clumped crowns)
  //   AF.TREEKIT.make(species, size, seed)  -> BufferGeometry (anchor = trunk base centre), cached per (species,size,seed%3)
  //   AF.TREEKIT.place(x, z, species, size, seed, {y, solid, collide}) -> {id, crownR, h}  (placeStatic + trunk collider + AF.canopies entry)
  //   species: 'maple-red' 'maple-orange' 'maple-yellow' 'maple-turning' 'oak' 'red-oak' 'pin-oak' 'elm' 'plane' 'ginkgo' 'sweetgum'
  //            'birch' 'aspen' 'pine' 'spruce' 'willow' | aliases 'maple' 'autumn' 'street' 'evergreen' 'any' (picked by seed)
  //   size: 0 small (~8 m) · 1 medium (~11 m) · 2 large (~14 m)   (or 's','m','l', or a numeric scale 0.5..1.6)
  //   AF.canopies = [{x,y,z,r,col}] — every crown placed through the kit or by 12-nature (60-atmos spawns falling leaves from it)
  const KIT_ALIAS = { 'maple-red': 'maple-scarlet', 'maple-yellow': 'maple-gold', 'maple-gold': 'maple-gold', evergreen0: 'pine' };
  const KIT_POOL = {
    maple: ['maple-scarlet', 'maple-orange', 'maple-gold', 'maple-turning'],
    autumn: ['maple-scarlet', 'maple-orange', 'maple-gold', 'oak', 'red-oak', 'elm', 'plane', 'pin-oak', 'sweetgum', 'ginkgo'],
    street: ['plane', 'elm', 'maple-gold', 'maple-orange', 'ginkgo', 'pin-oak', 'maple-scarlet', 'sweetgum'],
    evergreen: ['pine', 'spruce'],
    any: ['maple-scarlet', 'maple-orange', 'maple-gold', 'oak', 'red-oak', 'elm', 'plane', 'birch', 'pine', 'ginkgo', 'sweetgum'],
  };
  const kitCache = new Map();
  const kitId = (species, seed) => {
    let id = KIT_ALIAS[species] || species;
    if (KIT_POOL[id]) { const pool = KIT_POOL[id]; id = pool[Math.abs(seed | 0) % pool.length]; }
    if (!SPECS.find((s) => s.id === id)) id = 'maple-gold';
    return id;
  };
  const kitScale = (size) => typeof size === 'number' ? (size <= 2 && Number.isInteger(size) ? [0.7, 1, 1.28][size] : clamp(size, 0.5, 1.6)) : ({ s: 0.7, m: 1, l: 1.28, small: 0.7, medium: 1, large: 1.28 }[size] || 1);
  const kitTree = (species, size, seed = 0) => {
    const id = kitId(species, seed), sc = Math.round(kitScale(size) * 8) / 8, v = Math.abs(seed | 0) % 3;
    const key = id + '|' + sc + '|' + v;
    let t = kitCache.get(key);
    if (!t) {
      const si = Math.max(0, SPECS.findIndex((s) => s.id === id)), s0 = SPECS[si];
      const spec = Object.assign({}, s0, { h: s0.h * sc, w: s0.w * sc, r0: s0.r0 * Math.sqrt(sc) });
      const vs = 0.125;
      t = makeTree(spec, si * 17 + 500 + v * 3, vs);
      t.geo = AF.meshModel(t.m, { vs, anchor: [0.5, 0, 0.5] }); t.m = null; t.id = id; t.col = s0.leaves[0];
      kitCache.set(key, t);
    }
    return t;
  };
  AF.canopies = AF.canopies || [];
  AF.TREEKIT = {
    species: SPECS.map((s) => s.id).concat(['maple-red', 'maple-yellow'], Object.keys(KIT_POOL)),
    make: (species = 'autumn', size = 1, seed = 0) => kitTree(species, size, seed).geo,
    info: (species = 'autumn', size = 1, seed = 0) => { const t = kitTree(species, size, seed); return { id: t.id, crownR: t.crownR, h: t.h, trunkR: t.trunkR, col: t.col }; },
    place(x, z, species = 'autumn', size = 1, seed, o = {}) {
      if (seed == null) seed = (hash(Math.floor(x * 3), Math.floor(z * 3)) * 997) | 0;
      const t = kitTree(species, size, seed);
      const y = (o.y ?? W.groundY(x, z)) - 0.125;
      AF.placeStatic(t.geo, x, y, z, Math.abs(seed | 0) % 4, { collide: false });
      if (o.collide !== false) AF.addCollider(x - t.trunkR, y, z - t.trunkR, x + t.trunkR, y + Math.max(2.5, t.trunkH), z + t.trunkR, 'tree');
      AF.canopies.push({ x, y: y + t.h * 0.66, z, r: t.crownR, col: t.col, id: t.id });
      (L.trees = L.trees || []).push({ id: t.id, x, z, r: t.crownR, big: true });
      return { id: t.id, crownR: t.crownR, h: t.h };
    },
    stats: () => ({ geos: kitCache.size, quads: [...kitCache.values()].reduce((a, t) => a + (t.geo.index ? t.geo.index.count / 6 : 0), 0) }),
  };

  AF.onBuild('land-nature', 400, () => {
    const t0 = performance.now();
    const stats = { hero: 0, forest: 0, far: 0, bushes: 0, boulders: 0, flowers: 0, grass: 0, logs: 0, stumps: 0, mush: 0, geoQuads: 0, placedQuads: 0, pq: {} };
    const quadsOf = (g) => (g.index ? g.index.count / 6 : 0) + (g.userData.glass ? g.userData.glass.index.count / 6 : 0);
    let curTag = 'tree';
    const mesh = (m, vs) => { const g = AF.meshModel(m, { vs, anchor: [0.5, 0, 0.5] }); g.userData.tag = curTag; stats.geoQuads += quadsOf(g); return g; };
    const place = (g, x, y, z, rot, collide = false) => { AF.placeStatic(g, x, y, z, rot, { collide }); const q = quadsOf(g); stats.placedQuads += q; const tg = g.userData.tag || 'tree'; stats.pq[tg] = Math.round((stats.pq[tg] || 0) + q); };

    // ---- tree geometry library
    const hero = {}, forest = {}, far = {};
    for (let si = 0; si < SPECS.length; si++) {
      const s = SPECS[si];
      if (['willow', 'aspen'].includes(s.id)) continue;
      hero[s.id] = [0, 1].map((k) => { const t = makeTree(s, si * 10 + k, 0.25); t.geo = mesh(t.m, 0.25); t.m = null; return t; });
    }
    for (const id of ['pine', 'spruce', 'maple-scarlet', 'maple-orange', 'maple-gold', 'oak', 'birch', 'red-oak', 'maple-turning', 'plane']) {
      const si = SPECS.findIndex((s) => s.id === id); if (si < 0) continue;
      forest[id] = [0, 1].map((k) => { const t = makeTree(SPECS[si], si * 10 + 50 + k, 0.5); t.geo = mesh(t.m, 0.5); t.m = null; return t; });
      far[id] = [0].map((k) => { const t = makeTree(SPECS[si], si * 10 + 80 + k, 1.0); t.geo = mesh(t.m, 1.0); t.m = null; return t; });
    }
    const litterCols = {
      red: [AF.col(0x9e3a2a, { jitter: 1 }), AF.col(0xb4583a, { jitter: 1 })], orange: [AF.col(0xb8662e, { jitter: 1 }), AF.col(0xc88a3e, { jitter: 1 })],
      gold: [AF.col(0xc4a03a, { jitter: 1 }), AF.col(0xb08a34, { jitter: 1 })], brown: [AF.col(0x8a6a3a, { jitter: 1 }), AF.col(0xa07a40, { jitter: 1 })],
      needle: [AF.col(0x7a5e3a, { jitter: 0.9 }), AF.col(0x6a5234, { jitter: 0.9 })], green: [AF.col(0x7a8a3a, { jitter: 1 }), AF.col(0xa08a3e, { jitter: 1 })],
    };
    const litter = (x, z, rad, kind) => {
      const cols = litterCols[kind] || litterCols.brown;
      W.eachCol(x - rad, z - rad, x + rad, z + rad, (bx, bz, i, px, pz) => {
        const d = Math.hypot(px - x, pz - z) / rad; if (d > 1) return;
        const hx = AF.PAL.hex[W.C[i]]; if (hx == null) return; const r = (hx >> 16) & 255, g = (hx >> 8) & 255, b = hx & 255; if (!(g > r && g > b + 20)) return;
        const hh = hash(Math.floor(px * 2), Math.floor(pz * 2));
        if (hh < (1 - d) * 0.7) W.C[i] = cols[hh < 0.25 ? 1 : 0];
      });
    };
    const trees = L.trees = L.trees || [];
    const plantTree = (id, x, z, tier) => {
      const big = tier === 'hero';
      const lib = big ? hero[id] : tier === 'far' ? far[id] : forest[id]; if (!lib) return false;
      const t = lib[(hash(Math.floor(x * 3), Math.floor(z * 3)) * lib.length) | 0];
      if (!allowed(x, z, t.crownR * 0.5, 'tree')) return false;
      const f = footprint(x, z, Math.max(0.6, t.trunkR));
      if (f.hi - f.lo > (big ? 1.3 : 2.3)) return false;
      if (f.lo < 0) return false;
      if (occupied(x, f.lo, z, t.crownR * 0.6, Math.min(t.h, 10))) return false;
      const y = f.lo - (big ? 0.25 : tier === 'far' ? 0.9 : 0.5);
      place(t.geo, x, y, z, (hash(Math.floor(x * 7), Math.floor(z * 5)) * 4) | 0, false);
      AF.addCollider(x - t.trunkR, y, z - t.trunkR, x + t.trunkR, y + Math.max(2.5, t.trunkH), z + t.trunkR, 'tree');
      trees.push({ id, x, z, r: t.crownR, big });
      if (tier !== 'far') AF.canopies.push({ x, y: y + t.h * 0.66, z, r: t.crownR, col: (SPECS.find((s) => s.id === id) || SPECS[0]).leaves[0], id });
      if (big) { litter(x, z, t.crownR * 0.9, (SPECS.find((s) => s.id === id) || {}).litter); stats.hero++; } else if (tier === 'far') stats.far++; else stats.forest++;
      return true;
    };
    const pick = (R, table) => { let s = 0; for (const [, w] of table) s += w; let v = R() * s; for (const [id, w] of table) { v -= w; if (v <= 0) return id; } return table[0][0]; };
    const R = AF.rng(1934);
    const T_HILL = [['maple-scarlet', 3], ['maple-orange', 3], ['maple-gold', 3], ['oak', 2.5], ['red-oak', 2], ['birch', 1.5], ['pine', 1.5], ['spruce', 1], ['maple-turning', 1.5], ['plane', 1.5]];
    const T_YARD = [['maple-scarlet', 2], ['maple-orange', 2], ['maple-gold', 2], ['plane', 3], ['elm-green', 1], ['oak', 1.5], ['maple-turning', 1], ['red-oak', 1]];

    // ---- 1. Solace Heights forest: hero row along the foot + the lanes, forest LOD behind, far LOD on the crest
    for (let x = -298; x < 298; x += 5.5) for (let z = -298; z < -244; z += 5.5) {
      const jx = x + (hash(x * 3 | 0, z | 0) - 0.5) * 5, jz = z + (hash(x | 0, z * 3 | 0) - 0.5) * 5;
      if (jx > park.x0 - 4 && jx < park.x1 + 4) continue;
      if (N2(jx * 0.03 + 40, jz * 0.03) > 0.82 || R() < 0.06) continue;
      const tier = (jz > -254 && R() < 0.6) ? 'hero' : jz > -280 ? 'mid' : 'far';
      plantTree(pick(R, T_HILL), jx, jz, tier);
    }
    // ---- 2. map-edge strips west + east of the city grid (outside every lot)
    for (let z = -244; z < 200; z += 7) for (const x0 of [-299, 293]) {
      for (let x = x0; x < x0 + 6; x += 5) { const jx = x + R() * 2, jz = z + (R() - 0.5) * 4; if (R() < 0.25) continue; plantTree(pick(R, T_HILL), jx, jz, 'mid'); }
    }
    // ---- 3. back yards of the fill blocks (only where nothing is built)
    for (const l of P.lots) {
      if (!l.fill) continue;
      const [a0, b0, a1, b1] = l.rect, n = Math.round((a1 - a0) * (b1 - b0) / 260);
      for (let i = 0; i < n; i++) { const x = a0 + 6 + R() * (a1 - a0 - 12), z = b0 + 6 + R() * (b1 - b0 - 12); plantTree(pick(R, T_YARD), x, z, 'hero'); }
    }
    const tB = performance.now();

    // ---- undergrowth libraries
    const bushes = [];
    for (const k of ['burning', 'box', 'golden', 'sumac', 'berry']) for (let i = 0; i < 2; i++) { curTag = 'bush'; bushes.push({ k, g: mesh(makeBush(k, i * 13 + k.length), 1 / 8) }); }
    const boulders = [];
    for (let i = 0; i < 5; i++) { curTag = 'boulder'; boulders.push(mesh(makeBoulder(i, 3 + (i % 3) * 2, i % 2 === 0), 0.25)); }
    const flowers = []; for (const k of ['aster', 'golden', 'daisy', 'mixed', 'chicory']) { curTag = 'flower'; const g = mesh(makeFlowers(k.length * 3, k), 1 / 16); g.userData.kind = 'f'; flowers.push(g); }
    const grasses = []; for (let i = 0; i < 3; i++) { curTag = 'grass'; grasses.push(mesh(makeGrass(i, i % 2 === 1), 1 / 16)); }
    curTag = 'wood';
    const logs = []; for (let i = 0; i < 2; i++) logs.push(mesh(makeLog(i), 1 / 8));
    const stumps = []; for (let i = 0; i < 2; i++) stumps.push(mesh(makeStump(i), 1 / 8));
    const mushes = []; for (let i = 0; i < 2; i++) mushes.push(mesh(makeMushrooms(i), 1 / 16));
    const rot4 = () => (R() * 4) | 0;
    const smallAt = (g, x, z, collide, maxSlope = 0.6) => {
      if (!allowed(x, z, 0.5, 'small')) return false;
      const f = footprint(x, z, 0.6); if (f.hi - f.lo > maxSlope || f.lo < 0) return false;
      if (occupied(x, f.lo, z, 0.5, 1.5)) return false;
      place(g, x, f.lo - 0.02, z, rot4(), collide); return true;
    };
    for (const t of trees) {
      if (!t.big && R() < 0.75) continue;
      if (R() < 0.5) { const a = R() * 6.28, d = t.r * (0.8 + R() * 0.6); const b = bushes[(R() * bushes.length) | 0]; if (smallAt(b.g, t.x + Math.cos(a) * d, t.z + Math.sin(a) * d, false)) stats.bushes++; }
      if (R() < 0.2) { const a = R() * 6.28, d = t.r * 0.5 + 1; if (smallAt(mushes[(R() * mushes.length) | 0], t.x + Math.cos(a) * d, t.z + Math.sin(a) * d, false)) stats.mush++; }
      if (R() < 0.06) { const a = R() * 6.28, d = t.r + 2; if (smallAt(logs[(R() * logs.length) | 0], t.x + Math.cos(a) * d, t.z + Math.sin(a) * d, true, 0.3)) stats.logs++; }
      if (R() < 0.05) { const a = R() * 6.28, d = t.r + 3; if (smallAt(stumps[(R() * stumps.length) | 0], t.x + Math.cos(a) * d, t.z + Math.sin(a) * d, true)) stats.stumps++; }
    }
    // wildflowers + tall grass along the lanes and the foot of the heights
    for (let i = 0; i < 260; i++) {
      const x = (R() - 0.5) * 596, z = -298 + R() * 54;
      const n = N2(x * 0.04 + 3, z * 0.04); if (n < 0.4) continue;
      const g = n > 0.66 ? flowers[(R() * flowers.length) | 0] : grasses[(R() * grasses.length) | 0];
      for (let k = 0; k < 2; k++) if (smallAt(g, x + (R() - 0.5) * 3, z + (R() - 0.5) * 3, false)) { if (g.userData.kind === 'f') stats.flowers++; else stats.grass++; }
    }
    // rocks on the heights
    for (let i = 0; i < 90; i++) { const x = (R() - 0.5) * 596, z = -298 + R() * 50; if (smallAt(boulders[(R() * boulders.length) | 0], x, z, true, 1.0)) stats.boulders++; }
    W.tDirty = true;
    stats.ms = Math.round(performance.now() - t0); stats.msTrees = Math.round(tB - t0);
    L.natureStats = stats; L.natureMs = stats.ms;
    console.log('[af] land nature', JSON.stringify(stats));
  });

  AF.test('land: trees planted (autumn designs) + AF.nature.tree exposed', () => {
    const s = L.natureStats || {}; const ids = new Set((L.trees || []).map((t) => t.id));
    return { ok: (s.hero + s.forest + (s.far || 0)) > 150 && ids.size >= 8 && typeof AF.nature.tree === 'function', info: `hero ${s.hero} forest ${s.forest} far ${s.far} designs ${ids.size} placedQuads ${Math.round(s.placedQuads)} ms ${s.ms}` };
  });

  // ============================================================ GROUND COVER: instanced grass tufts, low plants, wildflowers, ferns + small shrubs
  // Scattered once over every green ground cell (lawns, park, colony yards, the heights), bucketed in 16 m cells. Only a
  // radius around the camera is drawn (one InstancedMesh per kind, refreshed as the camera moves); instances shrink to
  // nothing toward the edge of that radius so there is no pop-in line. Hidden from high above (you could not see it anyway).
  const GC = AF.groundCover = { kinds: [], cells: new Map(), n: 0, at: { x: 1e9, z: 1e9 }, t: 0, shown: 0 };
  const coverModels = () => {
    const R = AF.rng(8080), K = [];
    const plant = (S, H, fn) => { const m = new AF.Model(S, H, S); fn(m); return m; };
    const blade = (m, x, z, h, c, lean) => { for (let y = 0; y < h; y++) m.set(x + (y > h * 0.6 ? lean : 0), y, z, c); };
    const greens = [0x5f8f36, 0x6f9e3e, 0x80ac48, 0x4f7f30].map((h) => AF.col(h, { jitter: 0.5, edge: 0.1, solid: false }));
    const dry = [0x9aa04a, 0xb0a458, 0x8a9a40].map((h) => AF.col(h, { jitter: 0.5, edge: 0.1, solid: false }));
    for (const pal of [greens, greens, dry]) K.push({ id: 'tuft', vs: 1 / 16, w: 1, m: plant(10, 12, (m) => { for (let i = 0; i < 6; i++) blade(m, 2 + ((R() * 6) | 0), 2 + ((R() * 6) | 0), 4 + ((R() * 7) | 0), pal[(R() * pal.length) | 0], R() < 0.5 ? 1 : -1); }) });
    K.push({ id: 'clover', vs: 1 / 16, w: 0.5, m: plant(10, 4, (m) => { const a = greens[0], b = greens[2]; for (let i = 0; i < 5; i++) { const x = 1 + ((R() * 7) | 0), z = 1 + ((R() * 7) | 0), y = (R() * 2) | 0; m.set(x, y, z, a); m.set(x + 1, y, z, b); m.set(x, y, z + 1, b); m.set(x, y + 1, z, a); } }) });
    const bloom = (hexes) => plant(12, 10, (m) => { const fc = hexes.map((h) => AF.col(h, { jitter: 0.3, edge: 0.1, solid: false })); for (let i = 0; i < 5; i++) { const x = 2 + ((R() * 8) | 0), z = 2 + ((R() * 8) | 0), h = 4 + ((R() * 5) | 0), c = fc[(R() * fc.length) | 0]; blade(m, x, z, h, greens[1], 0); m.set(x, h, z, c); m.set(x + 1, h, z, c); m.set(x - 1, h, z, c); m.set(x, h, z + 1, c); m.set(x, h, z - 1, c); m.set(x, h + 1, z, fc[0]); } });
    K.push({ id: 'daisy', vs: 1 / 16, w: 0.35, m: bloom([0xf6f2e6, 0xf6f2e6, 0xf0c840]) });
    K.push({ id: 'poppy', vs: 1 / 16, w: 0.25, m: bloom([0xd8402a, 0xe8602e, 0x2a1a14]) });
    K.push({ id: 'bell', vs: 1 / 16, w: 0.25, m: bloom([0x7a6ad8, 0x9a7ae0, 0xc8a8f0]) });
    K.push({ id: 'fern', vs: 1 / 16, w: 0.25, m: plant(16, 9, (m) => { const c = greens[3], c2 = greens[1]; for (let a = 0; a < 6; a++) { const dx = Math.cos(a * 1.05), dz = Math.sin(a * 1.05); for (let t = 0; t < 7; t++) m.set(Math.round(7.5 + dx * t), Math.round(Math.sin(t / 7 * 2.4) * 6), Math.round(7.5 + dz * t), t & 1 ? c : c2); } }) });
    K.push({ id: 'shrub', vs: 1 / 8, w: 0.12, m: plant(9, 7, (m) => { for (let x = 0; x < 9; x++) for (let y = 0; y < 7; y++) for (let z = 0; z < 9; z++) { const d = Math.hypot((x - 4) / 4.5, (y - 2) / 4, (z - 4) / 4.5); if (d < 1 - hash(x * 3 + y, z * 7) * 0.2) m.set(x, y, z, greens[(x + y * 2 + z) % 4]); } }) });
    return K;
  };
  const greenAt = (i) => { const hx = AF.PAL.hex[W.C[i]]; if (hx == null) return false; const r = (hx >> 16) & 255, g = (hx >> 8) & 255, b = hx & 255; return g > r + 6 && g > b + 24; };
  AF.onBuild('land-ground-cover', 520, () => {
    const t0 = performance.now();
    const K = GC.kinds = coverModels().map((k) => ({ ...k, geo: AF.meshModel(k.m, { vs: k.vs, anchor: [0.5, 0, 0.5], flat: true }), m: null }));
    const wSum = K.reduce((s, k) => s + k.w, 0), R = AF.rng(4711), cells = GC.cells;
    const B = P.bounds || { x0: -660, z0: -300, x1: 300, z1: 300 };
    for (let x = B.x0 + 1; x < B.x1 - 1; x += 1.1) for (let z = B.z0 + 1; z < B.z1 - 1; z += 1.1) {
      const jx = x + (R() - 0.5) * 0.9, jz = z + (R() - 0.5) * 0.9, i = W.col(jx, jz); if (i < 0 || !greenAt(i)) continue;
      const n = N2(jx * 0.06, jz * 0.06); if (R() > 0.2 + n * 0.75) continue;
      const gy = W.H[i] * 0.25; if (gy < -0.2) continue;
      if (W.getM(jx, gy + 0.1, jz) || W.getM(jx, gy + 0.6, jz)) continue;
      // kind: mostly tufts; wildflowers in drifts; ferns + shrubs along the shady edges
      const fl = N2(jx * 0.035 + 17, jz * 0.035 - 5);
      let v = R() * wSum, k = 0; for (; k < K.length - 1; k++) { v -= K[k].w * (K[k].id === 'daisy' || K[k].id === 'poppy' || K[k].id === 'bell' ? (fl > 0.6 ? 4 : 0.3) : 1); if (v <= 0) break; }
      const key = Math.floor(jx / 16) * 1000 + Math.floor(jz / 16); let a = cells.get(key); if (!a) cells.set(key, a = []);
      if (AF.MOBILE && a.length >= 32 * 6) continue;
      a.push(jx, gy, jz, R() * 6.2832, 0.75 + R() * 0.55, k); GC.n++;
    }
    for (const [key, a] of cells) cells.set(key, new Float32Array(a));
    const tier = (AF.GFX && AF.GFX.tier) || 'high', cap = AF.MOBILE ? 1200 : tier === 'low' ? 3400 : tier === 'high' ? 7500 : 12000;
    for (const k of K) {
      const im = new THREE.InstancedMesh(k.geo, AF.mat.voxel, Math.ceil(cap * (k.id === 'tuft' ? 0.45 : 0.25)));
      im.count = 0; im.castShadow = false; im.receiveShadow = true; im.frustumCulled = false; im.name = 'cover-' + k.id; im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      AF.scene.add(im); k.im = im;
    }
    GC.ms = Math.round(performance.now() - t0);
    console.log('[af] ground cover', GC.n, 'plants in', cells.size, 'cells,', GC.ms, 'ms');
  });
  const coverRadius = () => { const t = (AF.GFX && AF.GFX.tier) || 'high'; return AF.MOBILE ? 24 : t === 'low' ? 40 : t === 'high' ? 62 : 88; };
  // 16 m cell offsets sorted nearest-first, so the instance cap always drops the farthest plants, never the ones at your feet
  let ring = null, ringR = 0;
  const cellRing = (Rr) => {
    if (ringR === Rr) return ring;
    const n = Math.ceil(Rr / 16) + 1, o = [];
    for (let a = -n; a <= n; a++) for (let b = -n; b <= n; b++) o.push([a, b, Math.max(0, Math.hypot(a, b) - 1.5) * 16]);
    o.sort((p, q) => p[2] - q[2]); ringR = Rr; return (ring = o.filter((p) => p[2] <= Rr));
  };
  const refreshCover = (cx, cz, cy) => {
    const K = GC.kinds, Rr = coverRadius(), R2 = Rr * Rr, fade0 = Rr * 0.72;
    for (const k of K) k.n = 0;
    const high = cy - Math.max(0, W.groundY(cx, cz)) > 45;
    if (!high) {
      const gcx = Math.floor(cx / 16), gcz = Math.floor(cz / 16);
      for (const [ox, oz] of cellRing(Rr)) {
        const a = GC.cells.get((gcx + ox) * 1000 + gcz + oz); if (!a) continue;
        for (let i = 0; i < a.length; i += 6) {
          const dx = a[i] - cx, dz = a[i + 2] - cz, d2 = dx * dx + dz * dz; if (d2 > R2) continue;
          const k = K[a[i + 5]], im = k.im; if (k.n >= im.instanceMatrix.count) continue;
          const d = Math.sqrt(d2), f = d < fade0 ? 1 : 1 - (d - fade0) / (Rr - fade0), s = a[i + 4] * f * f * (3 - 2 * f);
          const c = Math.cos(a[i + 3]) * s, sn = Math.sin(a[i + 3]) * s, arr = im.instanceMatrix.array, o = k.n * 16;
          arr[o] = c; arr[o + 1] = 0; arr[o + 2] = -sn; arr[o + 3] = 0; arr[o + 4] = 0; arr[o + 5] = s; arr[o + 6] = 0; arr[o + 7] = 0;
          arr[o + 8] = sn; arr[o + 9] = 0; arr[o + 10] = c; arr[o + 11] = 0; arr[o + 12] = a[i]; arr[o + 13] = a[i + 1]; arr[o + 14] = a[i + 2]; arr[o + 15] = 1;
          k.n++;
        }
      }
    }
    let shown = 0;
    for (const k of K) { k.im.count = k.n; k.im.visible = k.n > 0; if (k.n) k.im.instanceMatrix.needsUpdate = true; shown += k.n; }
    GC.shown = shown; GC.at = { x: cx, z: cz, y: cy };
  };
  AF.onTick('ground-cover', 445, (dt) => {
    if (!GC.kinds.length || !GC.kinds[0].im) return;
    const c = AF.camera.position, f = AF.player && AF.mode === 'walk' ? AF.player : c;
    // centre the drawn disc ahead of the view so plants are already grown where you look
    const e = AF.camera.matrixWorld.elements, fl = Math.hypot(e[8], e[10]) || 1, lead = coverRadius() * 0.3;
    const fx = f.x - e[8] / fl * lead, fz = f.z - e[10] / fl * lead;
    GC.t -= dt;
    const moved = Math.abs(fx - GC.at.x) + Math.abs(fz - GC.at.z) > 5 || Math.abs(c.y - GC.at.y) > 12;
    if (moved || GC.t <= 0) { GC.t = 1.5; refreshCover(fx, fz, c.y); }
  });
  AF.test('land: ground cover scattered + drawn near the camera', () => {
    if (!GC.kinds.length) return { ok: false, info: 'no ground cover' };
    refreshCover(-40, -200, 2); const n = GC.shown; GC.at = { x: 1e9, z: 1e9, y: 0 };
    return { ok: GC.n > 5000 && n > 100 && GC.kinds.every((k) => k.im.count <= k.im.instanceMatrix.count), info: `plants ${GC.n}, drawn at the park ${n}, ${GC.ms} ms` };
  });
}

} catch (e) { AF.partError('12-nature.js', e); }

