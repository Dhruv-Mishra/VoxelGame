// ================================================================ 43-east.js
try {
// ===== 43-east: EASTPORT (x 300..460) — the Solace River from a waterfall in the Heights to the harbour, granite embankments with
//       promenades, road + rail bridges, the Coastline Limited's line out to a tunnel in the east bluff, a freight siding, and the
//       Eastport boat hire (rowable boats, 'row' mode)  (OWNER: coordinator) =====
{
  const P = AF.PLAN, W = AF.W, RV = P.river, PI = Math.PI, VSB = W.VS;
  const RX = RV.x, HW = 6.5, WALL = 0.75, PROM = 5, WY = RV.waterY;
  const E = AF.east = { boats: [], bridges: 0 };
  const TRK = [22.5, 34.5, 47.5, 60], PORTAL_X = 432;
  const col = (h, o) => AF.col(h, Object.assign({ jitter: 0.4, edge: 0.4 }, o || {}));

  AF.onBuild('east-river', 160, () => {
    const t0 = performance.now(), H = W.H, C = W.C, S = W.S, NZ = W.NZ, mask = AF.streets && AF.streets.mask;
    const gran = [col(0x8f8b84, { edge: 1 }), col(0x9f9a90, { edge: 1 }), col(0x7d7a74, { edge: 1 })], cope = col(0xb4ab9c, { pat: 'stone', edge: 0.9 });
    const setts = [col(0x8e8a84, { jitter: 0.5 }), col(0x9c968c, { jitter: 0.5 }), col(0x847e76, { jitter: 0.5 })];
    const bed = col(0x4a4a3e, { jitter: 0.7 }), bedD = col(0x3a3e36, { jitter: 0.7 }), rock = [col(0x8a8276, { jitter: 0.7, edge: 1 }), col(0x6f685e, { jitter: 0.7, edge: 1 })];
    const lawn = [col(0x5f8a37, { jitter: 0.9 }), col(0x6f9a3e, { jitter: 0.9 })], iron = col(0x2a2e30, { metal: 0.7, rough: 0.4, jitter: 0.1 });
    const Z0 = RV.z0, Z1 = RV.z1, urban = (z) => z > -236;
    const deck = [];   // road columns over the water: rebuilt as voxel bridge decks after the carve
    W.eachCol(300, Z0 - 12, 460, Z1, (bx, bz, i, x, z) => {
      const xc = RX(z), dx = Math.abs(x - xc);
      if (dx > HW + WALL + PROM + 6) return;
      const road = mask && mask[i];
      if (dx < HW) {
        if (road) { deck.push([i, x, z, H[i], C[i], road]); }
        const k = dx / HW;
        H[i] = Math.min(H[i], Math.round(-14 + 6 * k * k)); C[i] = k < 0.55 ? bedD : bed; S[i] = urban(z) ? gran[(bz >> 3) % 3] : rock[(bx + bz) & 1];
        return;
      }
      if (road) return;
      if (!urban(z)) {   // the ravine out of the Heights: rocky shelves, then the hillside
        if (dx < HW + 2.5) { H[i] = Math.min(H[i], Math.round((WY + 0.4 + (dx - HW) * 0.6) * 4)); C[i] = rock[(bx >> 1 ^ bz >> 1) & 1]; S[i] = rock[1]; }
        return;
      }
      if (dx < HW + WALL) { H[i] = 1; C[i] = cope; S[i] = gran[(bz >> 3) % 3]; return; }
      if (P.lotAt && P.lotAt(x, z)) return;
      if (dx < HW + WALL + PROM) { H[i] = 1; C[i] = setts[Math.floor(AF.hash2(bx >> 1, bz >> 1) * 3) % 3]; S[i] = gran[0]; return; }
      if (H[i] >= 1 && H[i] <= 2) { H[i] = 1; C[i] = lawn[AF.noise2(x * 0.1, z * 0.1) < 0.5 ? 0 : 1]; }
    });
    W.tDirty = true;
    // bridge decks: the road surface (its own colours) as a 2-block slab, stone parapets where the deck meets open water
    const onDeck = new Set(deck.map((d) => d[0]));
    const para = col(0xa8a092, { pat: 'stone', edge: 0.9 }), paraCap = col(0xc8bfae, { edge: 0.8 });
    for (const [i, x, z, h0, c0, road] of deck) {
      const y = h0 * VSB;
      W.fill(x - 0.125, y - 0.5, z - 0.125, x + 0.125, y, z + 0.125, c0);
      if (road !== 2) continue;
      let open = false;
      for (const [ox, oz] of [[0.25, 0], [-0.25, 0], [0, 0.25], [0, -0.25]]) { const j = W.col(x + ox, z + oz); if (j >= 0 && !onDeck.has(j) && Math.abs(x + ox - RX(z + oz)) < HW) open = true; }
      if (open) { W.fill(x - 0.125, y, z - 0.125, x + 0.125, y + 0.75, z + 0.125, para); W.fill(x - 0.125, y + 0.75, z - 0.125, x + 0.125, y + 1.0, z + 0.125, paraCap); }
    }
    E.bridges = deck.length;
    // embankment railings (iron posts every 2 m + a top rail) along the urban walls, gaps at the bridges
    for (let z = -234; z < 205; z += 0.25) {
      const xc = RX(z);
      for (const side of [-1, 1]) {
        const x = xc + side * (HW + WALL * 0.5), j = W.col(x, z); if (j < 0 || (mask && mask[j]) || H[j] !== 1) continue;
        if (Math.round(z * 4) % 8 === 0) W.fill(x - 0.125, 0.25, z, x + 0.125, 1.25, z + 0.25, iron);
        W.fill(x - 0.125, 1.0, z, x + 0.125, 1.25, z + 0.25, iron);
      }
    }
    // the falls: a curtain of water down the ravine head into the spring pool
    const fall = col(0xbfe2ea, { glass: true, jitter: 0.1, edge: 0, solid: false }), foam = col(0xf2f6f4, { solid: false, jitter: 0.1 });
    const fx = RX(Z0), fz = Z0 - 12, top = W.groundY(fx, Z0 - 13.5);
    W.fill(fx - 2.5, WY, fz, fx + 2.5, Math.max(top, 2), fz + 0.25, fall);
    W.fill(fx - 3, WY - 0.25, fz + 0.25, fx + 3, WY + 0.25, fz + 1.75, foam);
    // river water (a flowing sheet at sea level, joined to the harbour)
    const pos = [], idx = []; let n = 0;
    for (let z = Math.floor(Z0 - 12); z < Z1; z++) {
      const xc = Math.floor(RX(z + 0.5));
      for (let x = xc - 10; x < xc + 10; x++) {
        let low = false; for (let a = 0; a < 4 && !low; a++) for (let b = 0; b < 4; b++) if (W.groundY(x + a * 0.25 + 0.1, z + b * 0.25 + 0.1) < WY - 0.01) { low = true; break; }
        if (!low) continue;
        pos.push(x, WY, z, x, WY, z + 1, x + 1, WY, z + 1, x + 1, WY, z); idx.push(n, n + 1, n + 2, n, n + 2, n + 3); n += 4;
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(pos.map((v, i) => (i % 3 === 1 ? 1 : 0)), 3));
    geo.setIndex(n > 65535 ? new THREE.Uint32BufferAttribute(idx, 1) : new THREE.Uint16BufferAttribute(idx, 1)); geo.computeBoundingSphere();
    geo.userData.kind = 'creek'; geo.userData.flow = [0, 0.45]; geo.userData.waterY = WY;
    AF.addWater(geo);
    P.pools.push({ x0: RX(0) - HW, z0: Z0 - 12, x1: RX(0) + HW, z1: Z1, y: WY, river: true });
    E.riverMs = Math.round(performance.now() - t0);
  });

  // ---------------------------------------------------------------- the Coastline Limited's line: two running tracks over a through-truss
  // bridge into a tunnel in the east bluff; the outer two tracks become a freight siding with boxcars
  AF.onBuild('east-rail', 165, () => {
    const H = W.H, C = W.C, S = W.S;
    const ballast = col(0x6b6358, { jitter: 0.8, edge: 0.3 }), sleeper = col(0x4a3524, { jitter: 0.4 }), railC = col(0xb8bcc0, { metal: 0.9, rough: 0.3, jitter: 0.05 });
    const gravel = col(0x8a8274, { jitter: 0.9 }), steel = col(0x3a4046, { metal: 0.7, rough: 0.45, jitter: 0.1 }), steelL = col(0x5a646e, { metal: 0.7, rough: 0.4, jitter: 0.1 });
    const rock = [col(0x8a8276, { jitter: 0.7, edge: 1 }), col(0x9c9184, { jitter: 0.7, edge: 1 }), col(0x6f685e, { jitter: 0.7, edge: 1 })];
    const grassR = col(0x6a8a3a, { jitter: 0.9 }), soot = col(0x1c1a18, { jitter: 0.3 }), stone = col(0xa89c88, { pat: 'stone', edge: 0.9 }), key = col(0xc8bca4, { edge: 0.8 });
    const yard = (x, z) => x >= 300 && x < PORTAL_X && z > 11 && z < 71;
    W.eachCol(300, 11, PORTAL_X, 71, (bx, bz, i, x, z) => { if (H[i] >= 1 && Math.abs(x - RX(z)) > HW + WALL) { H[i] = 1; C[i] = AF.hash2(bx >> 2, bz >> 2) < 0.5 ? gravel : ballast; } });
    const rails = (tz, x0, x1, deckOnly) => {
      for (let x = x0; x < x1; x += 0.75) {
        const over = Math.abs(x - RX(tz)) < HW + 0.5;
        if (over) W.fill(x, 0, tz - 1.75, x + 0.75, 0.25, tz + 1.75, steel);
        else if (!deckOnly) W.ground(x, tz - 1.75, x + 0.75, tz + 1.75, 1, ballast);
        W.fill(x, 0.25, tz - 1.25, x + 0.25, 0.5, tz + 1.25, sleeper);
      }
      for (const rz of [-0.75, 0.75]) W.fill(x0, 0.5, tz + rz - 0.125, x1, 0.75, tz + rz + 0.125, railC);
    };
    rails(TRK[1], 299.75, PORTAL_X + 14); rails(TRK[2], 299.75, PORTAL_X + 14);
    for (const tz of [TRK[0], TRK[3]]) { rails(tz, 299.75, 352); W.fill(352, 0.25, tz - 1.25, 352.5, 1.5, tz + 1.25, col(0x8a2a22)); W.fill(351.75, 1.0, tz - 1.0, 352, 1.25, tz + 1.0, col(0xd8b84a)); }
    // through-truss bridge over the river (both running tracks)
    const bx0 = RX(41) - HW - 1.5, bx1 = RX(41) + HW + 1.5, zA = TRK[1] - 2.25, zB = TRK[2] + 2.0, TOP = 6.5;
    for (const zt of [zA, zB]) {
      W.fill(bx0, 0.25, zt, bx1, 0.75, zt + 0.25, steel); W.fill(bx0, TOP, zt, bx1, TOP + 0.5, zt + 0.25, steel);
      for (let x = bx0; x <= bx1; x += 3) {
        W.fill(x, 0.25, zt, x + 0.25, TOP, zt + 0.25, steelL);
        for (let s = 0; s < 3; s += 0.25) { const y = 0.75 + s / 3 * (TOP - 0.75); if (x + s < bx1) W.fill(x + s, y, zt, x + s + 0.25, y + 0.25, zt + 0.25, steel); }
      }
    }
    for (let x = bx0; x <= bx1; x += 6) W.fill(x, TOP, zA, x + 0.25, TOP + 0.25, zB + 0.25, steelL);
    // the east bluff: a rocky headland over the line, the tunnel cut through it with a stone portal
    W.eachCol(PORTAL_X - 6, 12, 460, 68, (bx, bz, i, x, z) => {
      const e = Math.min(x - (PORTAL_X - 6), z - 12, 68 - z) , k = AF.smooth(0, 10, e), n = AF.fbm2(x * 0.06, z * 0.06, 3);
      const h = Math.round((1 + k * (8 + n * 6)) * 4);
      if (z > TRK[1] - 3.5 && z < TRK[2] + 3.5) { if (x >= PORTAL_X) { H[i] = 1; C[i] = soot; S[i] = rock[2]; } return; }
      if (h > H[i]) { H[i] = h; C[i] = k > 0.7 && n > 0.45 ? grassR : rock[(bx >> 1 ^ bz >> 1) % 3]; S[i] = rock[(bx >> 3 ^ bz >> 3) % 3]; }
    });
    const tz0 = TRK[1] - 3.5, tz1 = TRK[2] + 3.5, roofY = 7.5;
    W.eachCol(PORTAL_X, tz0, 460, tz1, (bx, bz, i, x, z) => { const g = Math.max(roofY + 1, W.hB(W.bx(x), W.bz(tz0 - 1)) * VSB); W.fill(x - 0.125, roofY, z - 0.125, x + 0.125, g, z + 0.125, rock[(bx + bz) % 3]); W.fill(x - 0.125, roofY - 0.25, z - 0.125, x + 0.125, roofY, z + 0.125, soot); });
    W.fill(PORTAL_X + 14, 0.25, tz0, PORTAL_X + 14.5, roofY, tz1, soot);
    // the portal: a stone face with a rounded arch and a keystone
    for (let z = tz0 - 2; z < tz1 + 2; z += 0.25) for (let y = 0.25; y < roofY + 3; y += 0.25) {
      const zc = (tz0 + tz1) / 2, rw = (tz1 - tz0) / 2, inside = Math.abs(z + 0.125 - zc) < rw && (y < roofY - 1.5 || Math.hypot((z + 0.125 - zc) / rw, (y - roofY + 1.5) / 1.5) < 1);
      if (!inside) W.fill(PORTAL_X - 0.5, y, z, PORTAL_X, y + 0.25, z + 0.25, stone);
    }
    W.fill(PORTAL_X - 0.75, roofY - 0.25, (tz0 + tz1) / 2 - 0.5, PORTAL_X - 0.5, roofY + 0.75, (tz0 + tz1) / 2 + 0.5, key);
    AF.placeStatic(AF.textModel ? AF.meshModel(AF.textModel('EASTPORT TUNNEL', col(0x2a2a2e), { font: 'deco', pad: 0 }), { vs: 1 / 10, anchor: [0.5, 0, 0.5] }) : null, PORTAL_X - 0.8, roofY + 1.0, (tz0 + tz1) / 2, 3, { collide: false });
    // boxcars on the siding (stamped: static, cheap)
    const bm = (body) => { const m = new AF.Model(48, 14, 11), dk = col(0x2a2624), rf = col(0x4a4440); m.box(1, 2, 0, 47, 13, 11, body); m.box(0, 13, 0, 48, 14, 11, rf); m.box(20, 3, 0, 28, 12, 1, dk); m.box(20, 3, 10, 28, 12, 11, dk); for (const x of [4, 40]) { m.box(x, 0, 2, x + 4, 2, 4, dk); m.box(x, 0, 7, x + 4, 2, 9, dk); } return m; };
    const bodies = [col(0x7a2a22), col(0x5a4a3a), col(0x3a4a5a), col(0x7a5a2a)];
    let k = 0; for (const tz of [TRK[0], TRK[3]]) for (let x = 304; x < 340; x += 12.5) W.stamp(bm(bodies[k++ % 4]), x, 0.5, tz - 1.375, 0);
    AF.addLabel('Eastport Freight Yard', 330, 41, 'place');
  });

  // ---------------------------------------------------------------- riverside dressing: lamps + trees along the promenades (after nature)
  AF.onBuild('east-dress', 412, () => {
    const lampC = col(0x2a2e30, { metal: 0.7 }), glowC = AF.col(0xfff0c8, { emit: 0xffe0b0, emitK: 2.6, mode: 'night', jitter: 0, edge: 0 });
    const mask = AF.streets && AF.streets.mask;
    for (let z = -228; z < 200; z += 18) for (const side of [-1, 1]) {
      const x = RX(z) + side * (HW + WALL + PROM - 0.75), j = W.col(x, z); if (j < 0 || (mask && mask[j]) || W.H[j] !== 1) continue;
      W.fill(x - 0.125, 0.25, z - 0.125, x + 0.125, 4.0, z + 0.125, lampC); W.fill(x - 0.375, 4.0, z - 0.375, x + 0.375, 4.5, z + 0.375, glowC);
      AF.addLight({ x, y: 4.2, z, color: 0xffe0b0, intensity: 0.8, range: 11, kind: 'street' });
      if (AF.TREEKIT && ((z / 18) | 0) % 2 === 0) { const tx = RX(z + 9) + side * (HW + WALL + PROM + 2.5), tj = W.col(tx, z + 9); if (tj >= 0 && !(mask && mask[tj]) && !(P.lotAt && P.lotAt(tx, z + 9))) AF.TREEKIT.place(tx, z + 9, 'any', 1, (z * 3 + side) | 0); }
      if (AF.addSpot && ((z / 18) | 0) % 3 === 1) AF.addSpot({ building: 'river', x: RX(z) + side * (HW + WALL + 1.2), y: 0.25, z, yaw: side < 0 ? PI / 2 : -PI / 2, kind: 'stand' });
    }
    AF.addLabel('Solace River', RX(-60), -60, 'place'); AF.addLabel('Eastport', 400, -120, 'place'); AF.addLabel('Solace Falls', RX(RV.z0), RV.z0, 'place');
  });

  // ---------------------------------------------------------------- EASTPORT BOAT HIRE: a jetty at the river mouth, three rowing boats
  const JX = RX(200) + HW + 1, JZ = 204;
  AF.onBuild('east-boathouse', 430, () => {
    const plank = [col(0x8a6a44, { jitter: 0.5 }), col(0x7a5a38, { jitter: 0.5 })], pile = col(0x4a3a2a), roof = col(0x2f5a6a), wall = col(0xe8dcc0, { pat: 'stucco' });
    for (let x = JX; x < JX + 3; x += 0.5) W.fill(x, -0.25, JZ, x + 0.5, 0.25, JZ + 18, plank[Math.round(x * 2) & 1]);
    for (let z = JZ; z < JZ + 18; z += 3) for (const x of [JX, JX + 2.75]) W.fill(x, -3.5, z, x + 0.25, 0.25, z + 0.25, pile);
    W.fill(JX + 4, 0.25, JZ - 9, JX + 12, 3.5, JZ - 3, wall); W.clear(JX + 4.25, 0.25, JZ - 8.75, JX + 11.75, 3.25, JZ - 3.25); W.clear(JX + 6, 0.25, JZ - 3.25, JX + 8, 2.5, JZ - 3);
    W.fill(JX + 3.5, 3.5, JZ - 9.5, JX + 12.5, 3.75, JZ - 2.5, roof);
    AF.placeStatic(AF.meshModel(AF.textModel('BOAT HIRE', col(0x2f5a6a), { font: 'deco', pad: 0 }), { vs: 1 / 12, anchor: [0.5, 0, 0.5] }), JX + 8, 2.6, JZ - 2.95, 0, { collide: false });
    AF.addLight({ x: JX + 8, y: 3, z: JZ - 2.5, color: 0xffe0b0, intensity: 0.7, range: 8, kind: 'shop' });
    AF.addLabel('Boat Hire', JX + 6, JZ, 'place');
  });
  const boatModel = (hull, trim) => {
    const m = new AF.Model(11, 6, 30), H = col(hull, { jitter: 0.3 }), T = col(trim, { jitter: 0.2 }), in0 = col(0x9a7a50, { jitter: 0.4 }), seat = col(0x7a5a38);
    for (let z = 0; z < 30; z++) {
      const t = z / 29, w = Math.round(5.5 * Math.sin(Math.PI * Math.min(1, 0.12 + t * 0.95)) ** 0.7), depth = z < 3 || z > 26 ? 5 : 5;
      for (let x = 5 - w; x <= 5 + w; x++) for (let y = 0; y < depth; y++) {
        const edge = x === 5 - w || x === 5 + w || y === 0 || z === 0 || z === 29;
        if (edge) m.set(x, y, z, y >= 4 ? T : H); else if (y === 1) m.set(x, y, z, in0);
      }
    }
    for (const z of [8, 15, 23]) m.box(1, 3, z, 10, 4, z + 2, seat);
    return AF.meshModel(m, { vs: 1 / 8, anchor: [0.5, 0, 0.5] });
  };
  const oarGeo = () => { const m = new AF.Model(1, 1, 20), w = col(0xc8a870); m.box(0, 0, 0, 1, 1, 20, w); m.box(0, 0, 16, 1, 1, 20, col(0x2f5a6a)); return AF.meshModel(m, { vs: 1 / 8, anchor: [0.5, 0.5, 0] }); };
  AF.onBuild('east-boats', 625, () => {
    const oar = oarGeo();
    [[0xe8e2d4, 0x2f5a6a], [0x2f5a6a, 0xe8e2d4], [0xb8322a, 0xf2ead0]].forEach(([h, t], i) => {
      const g = new THREE.Group(), body = AF.modelMesh(boatModel(h, t)); body.castShadow = true; g.add(body);
      const oars = [-1, 1].map((s) => { const p = new THREE.Group(); p.position.set(s * 0.62, 0.55, 0.3); const o = AF.modelMesh(oar); o.position.z = -0.4; p.add(o); g.add(p); return p; });
      const b = { g, oars, x: JX - 1.3, z: JZ + 3 + i * 5, yaw: PI, v: 0, w: 0, home: null, stroke: 0, bob: i };
      b.home = { x: b.x, z: b.z, yaw: b.yaw }; AF.scene.add(g); E.boats.push(b); placeBoat(b, 0);
      b.it = AF.addInteract({ x: b.x, y: 0.5, z: b.z, r: 2.4, label: 'Row a boat', prio: 0.2, can: () => AF.mode === 'walk' && E.cur !== b, act: () => AF.setMode('row', { boat: b }) });
    });
  });
  const placeBoat = (b, t) => {
    const bob = Math.sin(t * 1.3 + b.bob) * 0.04;
    b.g.position.set(b.x, WY - 0.35 + bob, b.z); b.g.rotation.set(Math.sin(t * 0.9 + b.bob) * 0.02, b.yaw, Math.sin(t * 1.1 + b.bob) * 0.03 - b.w * 0.05, 'YXZ');
    if (b.it) { b.it.x = b.x; b.it.z = b.z; }
  };
  AF.onTick('east-boats', 442, (dt, t) => { for (const b of E.boats) if (E.cur !== b) { b.v *= Math.exp(-dt * 0.6); if (Math.abs(b.v) > 0.01) { b.x += Math.sin(b.yaw) * b.v * dt; b.z += Math.cos(b.yaw) * b.v * dt; } placeBoat(b, t); } });
  const wet = (x, z) => W.groundY(x, z) < WY - 0.3 && !AF.solidAt(x, WY + 0.3, z);
  const cam = new THREE.Vector3(), look = new THREE.Vector3();
  AF.modes.row = {
    enter(o = {}) {
      const b = o.boat; if (!b) { AF.setMode('walk'); return; }
      E.cur = b; E.camInit = false;
      const P2 = AF.player; if (P2 && P2.parts) { P2.setVisible(true); AF.avatar.sit(P2.parts, true, 0.45); }
      AF.emit('toast', AF.touch ? 'Push the stick to row, steer left and right. EXIT near land to step ashore.' : 'W/S row, A/D turn. E to step ashore when you are beside a jetty or the bank.');
    },
    exit() { const P2 = AF.player; if (P2 && P2.parts) AF.avatar.sit(P2.parts, false); E.cur = null; AF.emit('hud', { speed: null }); },
    update(dt) {
      const b = E.cur; if (!b) return;
      dt = Math.min(dt, 0.05);
      const I = AF.input, S = I.stick, modal = AF.ui && AF.ui.modalOpen && AF.ui.modalOpen();
      const fwd = modal ? 0 : AF.clamp((I.key('KeyW') || I.key('ArrowUp') ? 1 : 0) - (I.key('KeyS') || I.key('ArrowDown') ? 1 : 0) + (S ? S.y : 0), -1, 1);
      const turn = modal ? 0 : AF.clamp((I.key('KeyD') || I.key('ArrowRight') ? 1 : 0) - (I.key('KeyA') || I.key('ArrowLeft') ? 1 : 0) + (S ? S.x : 0), -1, 1);
      b.v += (fwd * 2.6 - b.v) * Math.min(1, dt * 0.9);
      b.w += (turn - b.w) * Math.min(1, dt * 3);
      b.yaw -= b.w * (0.5 + Math.min(1, Math.abs(b.v) / 2) * 0.5) * dt;
      const nx = b.x + Math.sin(b.yaw) * b.v * dt, nz = b.z + Math.cos(b.yaw) * b.v * dt, px = nx + Math.sin(b.yaw) * 1.9 * Math.sign(b.v || 1), pz = nz + Math.cos(b.yaw) * 1.9 * Math.sign(b.v || 1);
      if (wet(px, pz) && wet(nx, nz) && nx > W.X0 + 20 && nx < W.x1 + 400 && nz < 700) { b.x = nx; b.z = nz; } else b.v *= -0.25;
      const t = AF.clock.t; placeBoat(b, t);
      b.stroke += dt * (1.2 + Math.abs(fwd) * 1.6) * (Math.abs(fwd) + Math.abs(turn) > 0.05 ? 1 : 0);
      for (let s = 0; s < 2; s++) { const sw = Math.sin(b.stroke * 2 + (turn * (s ? 1 : -1)) * 0.6); b.oars[s].rotation.set(0.25 + Math.cos(b.stroke * 2) * 0.25, (s ? -1 : 1) * (1.2 + sw * 0.45), 0, 'YXZ'); }
      const P2 = AF.player; if (P2 && P2.mesh) { P2.mesh.position.set(b.x - Math.sin(b.yaw) * 0.2, WY - 0.2 + b.g.position.y - (WY - 0.35), b.z - Math.cos(b.yaw) * 0.2); P2.mesh.rotation.set(0, b.yaw + PI, 0); }
      cam.set(b.x - Math.sin(b.yaw) * 7, WY + 3.2, b.z - Math.cos(b.yaw) * 7);
      if (!E.camInit) { E.cam = cam.clone(); E.camInit = true; } else E.cam.lerp(cam, 1 - Math.exp(-dt * 3));
      const c = AF.camera; c.position.copy(E.cam); look.set(b.x, WY + 0.8, b.z); c.up.set(0, 1, 0); c.lookAt(look); AF.camTarget.copy(look); AF.shadowFocus.set(b.x, 0, b.z); AF.shadowRadius = 50;
      AF.emit('hud', { mode: 'drive', speed: Math.abs(b.v) * 2.237, car: 'Rowing boat \u00b7 E to step ashore' });
      if (I.hit('KeyE') || I.hit('KeyF')) {
        let best = null;
        for (let a = 0; a < 16; a++) for (const r of [1.5, 2.5, 3.5]) {
          const x = b.x + Math.sin(a / 16 * PI * 2) * r, z = b.z + Math.cos(a / 16 * PI * 2) * r, y = AF.surfaceBelow(x, z, 2, 4);
          if (Number.isFinite(y) && y > WY + 0.6 && !AF.boxBlocked(x, y + 0.3, z, 0.3, 1.5) && (!best || r < best.r)) best = { x, y, z, r };
        }
        if (best) { b.v = 0; AF.setMode('walk', { x: best.x, y: best.y, z: best.z, yaw: b.yaw }); }
        else AF.emit('toast', 'Row up beside a jetty, steps or the bank to get out.');
      }
    },
  };
  AF.test('east: the Solace River runs to the harbour under road bridges', () => {
    const wetMid = W.groundY(RX(0) , -40) < WY - 1, bridges = E.bridges > 200;
    let decks = 0; for (const z of [-160, -80, 0, 80, 160]) if (AF.surfaceBelow(RX(z), z, 1, 3) > -0.6) decks++;
    return { ok: wetMid && bridges && decks === 5, info: `bed ${W.groundY(RX(0), -40).toFixed(2)}, deck columns ${E.bridges}, road decks ${decks}/5, boats ${E.boats.length}` };
  });
}
} catch (e) { AF.partError('43-east.js', e); }
