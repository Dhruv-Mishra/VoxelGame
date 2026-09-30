// ================================================================ 46-zoo.js
try {
// ===== 46-zoo: SOLACE ZOO in the north-west corner — eight habitats (savannah, pride rock, tiger forest, flamingo lagoon,
//       hippo swamp, crocodile marsh, deer woodland, bear forest), paths, gate, keepers, signs, and the animals: instanced
//       per species (one body + one leg InstancedMesh each), wandering their own habitat, only animated near the camera  (OWNER: west) =====
{
  const P = AF.PLAN, W = AF.W, ZOO = P.west.zoo, PI = Math.PI;
  const K = () => AF.westKit;
  const HAB = ZOO.habitats = [
    { id: 'savannah', name: 'The Savannah', rect: [-640, -140, -562, -30], ground: [0xc8b060, 0xb8a050, 0xd8c078], animals: [['elephant', 3], ['giraffe', 3], ['zebra', 5], ['antelope', 4]],
      sign: ['Elephants, giraffes, zebras and impala share the open plain.', 'An elephant eats around 150 kg of food a day. The giraffes mostly eat the acacia leaves you can see.'] },
    { id: 'lions', name: 'Pride Rock', rect: [-536, -140, -496, -90], ground: [0xc0a860, 0xa89a58, 0xd0b878], animals: [['lion', 1], ['lioness', 2]],
      sign: ['The pride lounges on the warm rock for most of the day.', 'Lions sleep up to twenty hours a day. Relatable.'] },
    { id: 'tigers', name: 'Tiger Forest', rect: [-536, -82, -496, -30], ground: [0x4f7a34, 0x3f6a2e, 0x5a8a3a], animals: [['tiger', 3]],
      sign: ['Tigers love water \u2014 watch for them near the stream.', 'No two tigers have the same stripes.'] },
    { id: 'flamingos', name: 'Flamingo Lagoon', rect: [-486, -140, -456, -30], ground: [0xd8c8a0, 0xc8b890, 0xe0d0a8], animals: [['flamingo', 9]],
      sign: ['Flamingos are pink because of the shrimp and algae they eat.', 'They sleep standing on one leg. Try it.'] },
    { id: 'hippos', name: 'Hippo Swamp', rect: [-640, -280, -602, -166], ground: [0x6a5a3a, 0x5a4a30, 0x7a6a44], animals: [['hippo', 3]],
      sign: ['Hippos spend their days in the water and graze at night.', 'A hippo can hold its breath for five minutes.'] },
    { id: 'crocs', name: 'Crocodile Marsh', rect: [-594, -280, -560, -166], ground: [0x5a6a3a, 0x4a5a30, 0x6a7a44], animals: [['croc', 4]],
      sign: ['Crocodiles can lie perfectly still for hours.', 'Please do not tap on the glass. There is no glass.'] },
    { id: 'deer', name: 'Deer Woodland', rect: [-536, -280, -496, -166], ground: [0x6f9a3e, 0x7da646, 0x88a049], animals: [['deer', 5], ['stag', 2]],
      sign: ['White-tailed deer from the hills north of Port Solace.', 'The stags grow a new set of antlers every year.'] },
    { id: 'bears', name: 'Bear Forest', rect: [-486, -280, -456, -166], ground: [0x5a6a34, 0x4a5a2e, 0x6a5a3a], animals: [['bear', 2]],
      sign: ['Brown bears: excellent swimmers, excellent climbers, excellent nappers.', 'A bear\u2019s sense of smell is seven times better than a bloodhound\u2019s.'] },
  ];
  const POOLS = ZOO.pools = [];   // [{cx, cz, rx, rz, y, hab}]

  // ---------------------------------------------------------------- world: walls, paths, habitats, water
  AF.onBuild('west-zoo', 312, () => {
    const t0 = performance.now(), col = K().col, glow = K().glow;
    const stoneW = col(0xb8ad98, { pat: 'stone', jitter: 0.4 }), cap = col(0x8a8272, { jitter: 0.3 }), iron = AF.MAT.iron;
    const pave = col(0xd8cdb4, { pat: 'none', patTop: 'slab', jitter: 0.3 }), paveD = col(0xc2b69c, { pat: 'none', patTop: 'slab', jitter: 0.3 });
    const [x0, z0, x1, z1] = [ZOO.x0, ZOO.z0, ZOO.x1, ZOO.z1];
    // lawn everywhere, then paths
    W.eachCol(x0, z0, x1, z1, (bx, bz, i, x, z) => { W.C[i] = col(AF.noise2(x * 0.08, z * 0.08) < 0.5 ? 0x6f9a3e : 0x7da646, { jitter: 0.9 }); });
    const path = (a, b, c, d) => W.eachCol(a, b, c, d, (bx, bz, i, x, z) => { W.C[i] = ((Math.floor(x) + Math.floor(z)) & 1) ? pave : paveD; });
    path(-553, -282, -539, -8);   // the promenade, from the gate to the north wall
    path(-640, -160, -454, -146); // the cross walk
    path(-560, -148, -553, -26); path(-494, -150, -486, -26); path(-494, -282, -486, -160); path(-602, -282, -594, -160); path(-560, -282, -553, -160);
    path(-553, -30, -454, -22);   // along the south habitats
    // perimeter wall with the gate on the promenade
    const wall = (a, b, c, d) => { W.fill(a, 0.25, b, c, 2.75, d, stoneW); W.fill(a - 0.25, 2.75, b - 0.25, c + 0.25, 3.0, d + 0.25, cap); };
    wall(x0, z0, x1, z0 + 0.5); wall(x0, z0, x0 + 0.5, z1); wall(x1 - 0.5, z0, x1, z1);
    wall(x0, z1 - 0.5, -556, z1); wall(-536, z1 - 0.5, x1, z1);
    // the gate: two deco pylons + an arch with the name, a ticket kiosk
    for (const gx of [-557, -537]) { W.fill(gx, 0.25, z1 - 1, gx + 2, 8, z1 + 1, col(0xf2ece0, { pat: 'stone' })); W.fill(gx - 0.25, 8, z1 - 1.25, gx + 2.25, 8.5, z1 + 1.25, col(0x2f6a4a)); W.fill(gx + 0.5, 8.5, z1 - 0.5, gx + 1.5, 9.25, z1 + 0.5, glow(0xffe0a0, 2.2, 'night')); }
    W.fill(-555, 6.5, z1 - 0.5, -537, 7.5, z1 + 0.5, col(0x2f6a4a));
    const g = K().text('SOLACE ZOO', 0xffe9b0, { font: 'deco', vs: 1 / 9, k: 2.2 });
    AF.placeStatic(g, -546, 6.55, z1 + 0.55, 0, { collide: false }); AF.placeStatic(g, -546, 6.55, z1 - 0.55, 2, { collide: false });
    W.fill(-535, 0.25, z1 - 6, -531, 3, z1 - 2, col(0xe8dcc0, { pat: 'stucco' })); W.fill(-535.25, 3, z1 - 6.25, -530.75, 3.5, z1 - 1.75, col(0xc0392b)); W.fill(-535.1, 1.25, z1 - 5, -535, 2.25, z1 - 3, col(0xa9c9d6, { glass: true }));
    for (const gx of [-556, -536]) AF.addLight({ x: gx, y: 9, z: z1, color: 0xffe0a0, intensity: 1, range: 12, kind: 'street' });
    AF.addBuilding({ id: 'zoo', name: 'Solace Zoo', kind: 'zoo', box: [x0, 0, z0, x1, 3, z1], doors: [{ x: -546, y: 0.25, z: z1 - 2, yaw: PI }], interior: false, owner: 'west', label: true });
    // lamp posts along the promenade
    for (let z = -40; z > -280; z -= 24) for (const x of [-554, -538]) { W.fill(x, 0.25, z, x + 0.25, 4, z + 0.25, iron); W.fill(x - 0.25, 4, z - 0.25, x + 0.5, 4.5, z + 0.5, glow(0xfff0c8, 2.6, 'night')); AF.addLight({ x: x + 0.1, y: 4.3, z: z + 0.1, color: 0xffe0b0, intensity: 0.8, range: 10, kind: 'street' }); }
    // ---- habitats: ground, fences, features
    for (const H of HAB) {
      const [a, b, c, d] = H.rect, gc = H.ground.map((h) => col(h, { jitter: 0.9 }));
      W.eachCol(a, b, c, d, (bx, bz, i, x, z) => { const n = AF.noise2(x * 0.12, z * 0.12); W.C[i] = gc[n < 0.4 ? 0 : n < 0.7 ? 1 : 2]; });
      // visitor wall 1.25 m + railing, all round
      const fence = (p, q, r, s) => { W.fill(p, 0.25, q, r, 1.5, s, stoneW); W.fill(p, 1.5, q, r, 1.75, s, cap); };
      fence(a - 0.5, b - 0.5, c + 0.5, b); fence(a - 0.5, d, c + 0.5, d + 0.5); fence(a - 0.5, b, a, d); fence(c, b, c + 0.5, d);
      for (const [p, q, r, s] of [[a - 0.5, b - 0.5, c + 0.5, b], [a - 0.5, d, c + 0.5, d + 0.5]]) for (let x = p; x < r; x += 0.75) W.fill(x, 1.75, q + 0.125, x + 0.125, 2.75, s - 0.125, iron);
      for (const [p, r] of [[a - 0.5, a], [c, c + 0.5]]) for (let z = b; z < d; z += 0.75) W.fill(p + 0.125, 1.75, z, r - 0.125, 2.75, z + 0.125, iron);
      W.fill(a - 0.5, 2.75, b - 0.5, c + 0.5, 2.85, b, iron); W.fill(a - 0.5, 2.75, d, c + 0.5, 2.85, d + 0.5, iron);
      // the info board on the path side facing the promenade / walk
      const sx = (a + c) / 2, sz = d + 1.6;
      W.fill(sx - 1.2, 0.25, sz, sx + 1.2, 2.0, sz + 0.25, col(0x2f6a4a)); W.fill(sx - 1.0, 1.0, sz + 0.25, sx + 1.0, 1.9, sz + 0.3, col(0xf2ead0));
      AF.addInteract({ x: sx, y: 1.2, z: sz + 0.8, r: 2.2, label: 'Read: ' + H.name, act: () => AF.emit('dialogue', { name: H.name, role: 'Solace Zoo', lines: H.sign }) });
      AF.addLabel(H.name, sx, (b + d) / 2, 'place');
    }
    // ---- water: ponds per habitat
    const pool = (cx, cz, rx, rz, deep, wy, hab) => {
      const bed = col(0x4a4034, { jitter: 0.7 }), shore = col(0x7a6a4a, { jitter: 0.8 });
      W.eachCol(cx - rx - 2, cz - rz - 2, cx + rx + 2, cz + rz + 2, (bx, bz, i, x, z) => {
        const e = Math.hypot((x - cx) / rx, (z - cz) / rz) + (AF.noise2(x * 0.3, z * 0.3) - 0.5) * 0.15;
        if (e > 1.12) return;
        if (e > 1.0) { W.C[i] = shore; return; }
        W.H[i] = Math.min(W.H[i], Math.round(-deep * 4 * (1 - e * e)) - 1); W.C[i] = e < 0.7 ? bed : shore; W.S[i] = shore;
      });
      W.tDirty = true;
      const pos = [], idx = []; let n = 0;
      for (let x = Math.floor(cx - rx - 1); x < cx + rx + 1; x++) for (let z = Math.floor(cz - rz - 1); z < cz + rz + 1; z++) {
        let low = false; for (let i = 0; i < 4 && !low; i++) for (let k = 0; k < 4; k++) if (W.groundY(x + i * 0.25 + 0.1, z + k * 0.25 + 0.1) < wy - 0.01) { low = true; break; }
        if (!low) continue;
        pos.push(x, wy, z, x, wy, z + 1, x + 1, wy, z + 1, x + 1, wy, z); idx.push(n, n + 1, n + 2, n, n + 2, n + 3); n += 4;
      }
      if (!n) return;
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(pos.map((v, i) => (i % 3 === 1 ? 1 : 0)), 3));
      geo.setIndex(idx); geo.computeBoundingSphere(); geo.userData.kind = 'pond'; geo.userData.waterY = wy;
      AF.addWater(geo);
      POOLS.push({ cx, cz, rx, rz, y: wy, hab });
      P.pools.push({ x0: cx - rx, z0: cz - rz, x1: cx + rx, z1: cz + rz, y: wy });
    };
    pool(-620, -222, 13, 30, 1.8, 0.0, 'hippos');                   // hippo wallow (big, deep)
    pool(-584, -250, 7, 16, 0.9, 0.0, 'crocs'); pool(-570, -196, 6, 12, 0.9, 0.0, 'crocs');   // marsh channels
    pool(-471, -85, 10, 36, 0.5, 0.05, 'flamingos');                // the shallow lagoon
    pool(-610, -60, 9, 7, 0.8, 0.0, 'savannah');                    // the waterhole
    pool(-506, -48, 4, 12, 0.6, 0.0, 'tigers');                     // tiger stream
    pool(-462, -190, 5, 6, 0.8, 0.0, 'bears');                      // bear pool
    // ---- features
    const rock = [col(0x8a847c, { jitter: 0.6 }), col(0x9a9288, { jitter: 0.6 }), col(0x7a746c, { jitter: 0.6 })];
    const boulder = (x, z, r, h) => { for (let y = 0; y < h; y += 0.5) { const rr = r * Math.sqrt(1 - (y / h) * 0.8); W.eachCol(x - rr, z - rr, x + rr, z + rr, (bx, bz, i, px, pz) => { if (Math.hypot(px - x, pz - z) < rr - AF.hash2(bx, bz) * 0.4) W.fill(px - 0.125, 0.25 + y, pz - 0.125, px + 0.125, 0.75 + y, pz + 0.125, rock[(bx + bz + y * 2) % 3 | 0]); }); } };
    // Pride Rock: stepped ledges up to a jutting lip
    boulder(-516, -118, 9, 3); boulder(-512, -122, 6, 5.5); boulder(-509, -125, 3.5, 7);
    W.fill(-514, 6.75, -128, -504, 7.25, -121, rock[1]);
    // savannah: acacias (a thin trunk + a flat umbrella crown), termite mounds, rocks
    const bark = col(0x5a4632, { jitter: 0.5 }), leafA = col(0x6a8a2e, { jitter: 0.7 }), leafB = col(0x7a9a3a, { jitter: 0.7 });
    const acacia = (x, z, s) => { W.fill(x - 0.25, 0.25, z - 0.25, x + 0.25, 4.5 * s, z + 0.25, bark); W.fill(x - 1.5, 4 * s, z - 0.25, x + 1.5, 4.25 * s, z + 0.25, bark); for (const [r, y] of [[3.8 * s, 4.5 * s], [4.6 * s, 4.75 * s], [3.2 * s, 5 * s]]) W.eachCol(x - r, z - r, x + r, z + r, (bx, bz, i, px, pz) => { if (Math.hypot(px - x, pz - z) < r - AF.hash2(bx, bz) * 0.8) W.fill(px - 0.125, y, pz - 0.125, px + 0.125, y + 0.25, pz + 0.125, AF.hash2(bx * 3, bz) < 0.5 ? leafA : leafB); }); };
    for (const [x, z, s] of [[-628, -120, 1.1], [-590, -100, 1.3], [-630, -48, 1], [-575, -128, 0.9], [-600, -36, 1.2], [-570, -70, 1]]) acacia(x, z, s);
    const mound = col(0xa8784a, { jitter: 0.6 });
    for (const [x, z] of [[-585, -130], [-620, -90], [-566, -44]]) for (let y = 0; y < 2.5; y += 0.25) { const r = 0.9 * (1 - y / 2.8); W.fill(x - r, 0.25 + y, z - r, x + r, 0.5 + y, z + r, mound); }
    boulder(-596, -78, 2.5, 1.5); boulder(-632, -135, 2, 1.2);
    // reeds in the swamp + marsh + lagoon edges
    const reed = [col(0x6a8a3a, { jitter: 0.6, solid: false }), col(0x8a9a4a, { jitter: 0.6, solid: false }), col(0x7a6a3a, { jitter: 0.6, solid: false })];
    const R = AF.rng(77);
    for (const pl of POOLS) if (pl.hab === 'hippos' || pl.hab === 'crocs' || pl.hab === 'flamingos') for (let k = 0; k < (pl.hab === 'crocs' ? 140 : 90); k++) {
      const a = R() * PI * 2, e = 0.85 + R() * 0.35, x = pl.cx + Math.cos(a) * pl.rx * e, z = pl.cz + Math.sin(a) * pl.rz * e, h = 1 + R() * 1.5, y0 = Math.max(W.groundY(x, z), pl.y - 0.3);
      W.fill(x, y0, z, x + 0.25, y0 + h, z + 0.25, reed[(R() * 3) | 0]); if (R() < 0.4) W.fill(x, y0 + h, z, x + 0.25, y0 + h + 0.5, z + 0.25, reed[2]);
    }
    // bear den: a rock cave; logs
    boulder(-476, -260, 7, 4); W.clear(-479, 0.25, -258, -473, 2.5, -252);
    const logC = col(0x6a4a2a, { jitter: 0.5 });
    for (const [x, z, L, al] of [[-520, -60, 7, 0], [-470, -230, 6, 1], [-512, -230, 5, 1]]) W.fill(x, 0.25, z, x + (al ? 0.75 : L), 1.0, z + (al ? L : 0.75), logC);
    // trees: forests for the tigers, deer and bears, a few at the lions + along the walks
    const TK = AF.TREEKIT;
    if (TK) {
      const plant = (rect, n, sp, seed) => { const [a, b, c, d] = rect; for (let k = 0; k < n; k++) { const x = a + 3 + R() * (c - a - 6), z = b + 3 + R() * (d - b - 6); if (POOLS.some((q) => Math.hypot((x - q.cx) / (q.rx + 3), (z - q.cz) / (q.rz + 3)) < 1)) continue; TK.place(x, z, sp, (k % 3), seed + k); } };
      plant(HAB[2].rect, 14, 'autumn', 100); plant(HAB[6].rect, 18, 'autumn', 200); plant(HAB[7].rect, 12, 'evergreen', 300); plant(HAB[1].rect, 2, 'oak', 400);
      for (let z = -40; z > -280; z -= 30) { TK.place(-547, z, 'street', 1, z); }
    }
    ZOO.buildMs = Math.round(performance.now() - t0);
  });

  // ---------------------------------------------------------------- animals: species builders (1/8 m voxels)
  const VS = 1 / 8;
  const C = (h, o) => AF.col(h, Object.assign({ jitter: 0.25, edge: 0.3 }, o || {}));
  // spec: body [w,h,l], legH, legW, leg offsets (x, z from body centre, in voxels), head [w,h,l], neck [w,h,l, forward], cols, pattern, extras(m, dims)
  const SPEC = {
    elephant: { body: [14, 15, 26], legH: 14, legW: 5, head: [12, 12, 9], neck: [8, 6, 4, 0], col: 0x8a8a90, belly: 0x7a7a82, speed: 0.9, legs: 4,
      extra(m, d, c) { const hx = d.hx, hy = d.hy, hz = d.hz; m.box(hx + 4, hy - 13, hz + 7, hx + 8, hy + 2, hz + 10, c.body); m.box(hx + 4, hy - 14, hz + 8, hx + 8, hy - 12, hz + 11, c.body);
        m.box(hx - 2, hy - 2, hz + 1, hx, hy + 10, hz + 8, c.belly); m.box(hx + 12, hy - 2, hz + 1, hx + 14, hy + 10, hz + 8, c.belly); m.box(hx + 2, hy - 4, hz + 8, hx + 4, hy - 2, hz + 12, c.ivory); m.box(hx + 8, hy - 4, hz + 8, hx + 10, hy - 2, hz + 12, c.ivory); } },
    giraffe: { body: [8, 9, 16], legH: 22, legW: 3, head: [4, 5, 8], neck: [4, 24, 4, 4], col: 0xd8a860, belly: 0xe8d0a0, pattern: 'spots', patCol: 0x8a5a2a, speed: 1.0, legs: 4,
      extra(m, d, c) { m.box(d.hx, d.hy + 5, d.hz + 1, d.hx + 1, d.hy + 7, d.hz + 2, c.dark); m.box(d.hx + 3, d.hy + 5, d.hz + 1, d.hx + 4, d.hy + 7, d.hz + 2, c.dark); } },
    zebra: { body: [8, 9, 16], legH: 10, legW: 3, head: [4, 5, 8], neck: [4, 8, 5, 3], col: 0xf2f2ee, belly: 0xf2f2ee, pattern: 'stripes', patCol: 0x1a1a1a, speed: 1.4, legs: 4, mane: 0x1a1a1a },
    antelope: { body: [6, 7, 12], legH: 9, legW: 2, head: [3, 4, 6], neck: [3, 6, 3, 2], col: 0xb87a3a, belly: 0xf2ead8, speed: 1.6, legs: 4, horns: 0x2a2018 },
    deer: { body: [6, 7, 12], legH: 9, legW: 2, head: [3, 4, 6], neck: [3, 6, 3, 2], col: 0x9a6a3a, belly: 0xe8dcc4, pattern: 'dots', patCol: 0xe8dcc4, speed: 1.3, legs: 4 },
    stag: { body: [7, 8, 13], legH: 10, legW: 2, head: [3, 4, 6], neck: [3, 7, 3, 2], col: 0x8a5a30, belly: 0xe8dcc4, speed: 1.2, legs: 4, antlers: 0x6a5238 },
    lion: { body: [8, 8, 16], legH: 7, legW: 3, head: [7, 7, 7], neck: [5, 4, 3, 1], col: 0xd0a050, belly: 0xe0c080, speed: 0.8, legs: 4, maneCol: 0x7a4a1a, tail: 0x7a4a1a },
    lioness: { body: [7, 7, 15], legH: 7, legW: 3, head: [6, 6, 7], neck: [4, 3, 3, 1], col: 0xd6aa5c, belly: 0xe8cc90, speed: 0.9, legs: 4, tail: 0x8a5a2a },
    tiger: { body: [8, 8, 17], legH: 7, legW: 3, head: [7, 6, 7], neck: [5, 3, 3, 1], col: 0xe07a22, belly: 0xf2ead8, pattern: 'stripes', patCol: 0x1a1a1a, speed: 1.0, legs: 4, tail: 0xe07a22 },
    bear: { body: [11, 11, 16], legH: 6, legW: 4, head: [8, 7, 7], neck: [6, 4, 2, 1], col: 0x5a3a22, belly: 0x6a4a2a, speed: 0.8, legs: 4, ears: true, snout: 0x8a6a4a },
    hippo: { body: [14, 11, 22], legH: 4, legW: 4, head: [11, 8, 10], neck: [10, 6, 2, 0], col: 0x7a6a78, belly: 0xc89a9a, speed: 0.6, legs: 4, ears: true, snout: 0x9a7a88 },
    croc: { body: [7, 4, 24], legH: 2, legW: 2, head: [5, 3, 12], neck: [5, 3, 1, 0], col: 0x4a5a2a, belly: 0x9a9a6a, pattern: 'scutes', patCol: 0x35401c, speed: 0.5, legs: 4, tailL: 20 },
    flamingo: { body: [4, 4, 6], legH: 14, legW: 1, head: [2, 2, 4], neck: [1, 11, 1, 1], col: 0xf28aa8, belly: 0xf6a8c0, speed: 0.5, legs: 2, beak: 0x1a1a1a },
  };
  const makeGeo = (id) => {
    const S = SPEC[id], [bw, bh, bl] = S.body, [nw, nh, nl, nf] = S.neck, [hw, hh, hl] = S.head, tailL = S.tailL || 0;
    const c = { body: C(S.col), belly: C(S.belly), pat: C(S.patCol ?? S.col), dark: C(0x2a2018), ivory: C(0xf2ecdc), eye: C(0x141414, { jitter: 0 }), mane: C(S.maneCol ?? S.mane ?? S.col), snout: C(S.snout ?? S.belly) };
    const Wd = Math.max(bw, hw + 6, S.maneCol ? 13 : 0) + 2, Hh = bh + nh + hh + 10, L = bl + tailL + nf + hl + 4;
    const m = new AF.Model(Wd, Hh, L), cx = Math.floor((Wd - bw) / 2), bz = tailL + 1;
    // body (rounded edges) with the belly underneath and a pattern
    for (let x = 0; x < bw; x++) for (let y = 0; y < bh; y++) for (let z = 0; z < bl; z++) {
      const ex = x === 0 || x === bw - 1, ey = y === 0 || y === bh - 1, ez = z === 0 || z === bl - 1;
      if ((ex && ey) || (ex && ez) || (ey && ez)) continue;
      let col = y < 2 ? c.belly : c.body;
      if (S.pattern === 'stripes' && y >= 2 && ((z + (y >> 1)) % 4 === 0)) col = c.pat;
      if (S.pattern === 'spots' && y >= 1 && AF.hash3(x, y >> 1, z >> 1) < 0.35 && (z + y) % 3) col = c.pat;
      if (S.pattern === 'dots' && y > bh - 4 && AF.hash3(x, y, z) < 0.12) col = c.pat;
      if (S.pattern === 'scutes' && y === bh - 1 && (x + z) % 2 === 0) col = c.pat;
      m.set(cx + x, y, bz + z, col);
    }
    // tail
    if (tailL) for (let z = 0; z < tailL + 1; z++) { const w = Math.max(1, Math.round(bw * 0.6 * (z / tailL))), hy = Math.max(1, Math.round(bh * 0.7 * (z / tailL))); for (let x = 0; x < w; x++) for (let y = 0; y < hy; y++) m.set(cx + Math.floor((bw - w) / 2) + x, y, 1 + z, (y === hy - 1 && z % 2 === 0) ? c.pat : c.body); }
    else { const tc = S.tail ? C(S.tail) : c.body; for (let y = 0; y < 5; y++) m.set(cx + (bw >> 1), bh - 2 - y, bz - 1, tc); if (S.tail) m.set(cx + (bw >> 1), bh - 7, bz - 1, c.mane); }
    // neck + head at the front
    const nx = cx + ((bw - nw) >> 1), ny = bh - (id === 'croc' || id === 'hippo' ? 4 : 2);
    for (let i = 0; i < nh; i++) { const zz = bz + bl - 1 + Math.round(nf * i / Math.max(1, nh)); for (let x = 0; x < nw; x++) for (let z = 0; z < nl; z++) m.set(nx + x, ny + i, zz + z, S.mane && z === 0 ? c.mane : c.body); }
    const hx = cx + ((bw - hw) >> 1), hy = ny + nh - (id === 'giraffe' || id === 'flamingo' ? 1 : 2), hz = bz + bl - 1 + nf + nl - 2;
    for (let x = 0; x < hw; x++) for (let y = 0; y < hh; y++) for (let z = 0; z < hl; z++) {
      const sn = z > hl * 0.55 && y < hh * 0.5;
      if (z > hl * 0.55 && y >= hh * 0.7 && id !== 'croc') continue;
      m.set(hx + x, hy + y, hz + z, sn ? c.snout : c.body);
    }
    m.set(hx, hy + hh - 2, hz + Math.floor(hl * 0.45), c.eye); m.set(hx + hw - 1, hy + hh - 2, hz + Math.floor(hl * 0.45), c.eye);
    if (S.maneCol) for (let x = -2; x < hw + 2; x++) for (let y = -3; y < hh + 1; y++) for (let z = -2; z < 2; z++) if (Math.hypot(x - hw / 2 + 0.5, y - hh / 2) < hw / 2 + 2.3) m.set(hx + x, hy + y, hz + z, c.mane);
    if (S.ears) { m.set(hx, hy + hh, hz + 1, c.body); m.set(hx + hw - 1, hy + hh, hz + 1, c.body); }
    if (S.horns) for (let y = 0; y < 5; y++) { m.set(hx, hy + hh + y, hz + 1 - (y > 2 ? 1 : 0), C(S.horns)); m.set(hx + hw - 1, hy + hh + y, hz + 1 - (y > 2 ? 1 : 0), C(S.horns)); }
    if (S.antlers) { const a = C(S.antlers); for (const s of [0, hw - 1]) { for (let y = 0; y < 6; y++) m.set(hx + s, hy + hh + y, hz + 1, a); m.set(hx + s + (s ? 1 : -1), hy + hh + 3, hz + 1, a); m.set(hx + s + (s ? 1 : -1), hy + hh + 5, hz + 2, a); m.set(hx + s, hy + hh + 4, hz + 2, a); } }
    if (S.beak) { for (let z = 0; z < 3; z++) m.set(hx + (hw >> 1), hy, hz + hl + z - 1, z > 1 ? C(S.beak) : c.snout); m.set(hx + (hw >> 1), hy - 1, hz + hl + 1, C(S.beak)); }
    if (S.extra) S.extra(m, { hx, hy, hz }, c);
    const legY = S.legH;   // the body sits on top of the legs: shift it up by building legs separately
    const geo = AF.meshModel(m, { vs: VS, anchor: [0.5, 0, (bz + bl / 2) / L] });
    // one leg (pivot at the hip)
    const lm = new AF.Model(S.legW, S.legH, S.legW);
    lm.box(0, 0, 0, S.legW, S.legH, S.legW, c.body); lm.box(0, 0, 0, S.legW, Math.max(1, S.legH >> 3), S.legW, id === 'flamingo' ? C(0xe07a8a) : c.dark);
    if (S.pattern === 'stripes') for (let y = 2; y < S.legH; y += 3) lm.box(0, y, 0, S.legW, y + 1, S.legW, c.pat);
    const lgeo = AF.meshModel(lm, { vs: VS, anchor: [0.5, 1, 0.5] });
    const lx = (bw / 2 - S.legW / 2 - 0.5) * VS, lz = (bl / 2 - S.legW / 2 - 1) * VS;
    const legPos = S.legs === 2 ? [[-S.legW * VS, 0], [S.legW * VS, 0]] : [[-lx, lz], [lx, lz], [-lx, -lz], [lx, -lz]];
    return { geo, lgeo, lift: legY * VS, legPos, S };
  };

  // ---------------------------------------------------------------- herds: wander inside the habitat, idle, drink; hippos + crocs sink into water
  const Z = AF.zoo = { species: {}, list: [], near: false };
  const tmpM = new THREE.Matrix4(), tmpM2 = new THREE.Matrix4(), tmpQ = new THREE.Quaternion(), tmpE = new THREE.Euler(), tmpV = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1), up = new THREE.Vector3(0, 1, 0);
  const inPool = (hab, x, z) => { for (const p of POOLS) if (p.hab === hab && Math.hypot((x - p.cx) / p.rx, (z - p.cz) / p.rz) < 0.85) return p; return null; };
  AF.onBuild('zoo-animals', 640, () => {
    const R = AF.rng(2026);
    for (const H of HAB) for (const [id, n] of H.animals) {
      let sp = Z.species[id];
      if (!sp) {
        const G = makeGeo(id);
        const body = new THREE.InstancedMesh(G.geo, AF.mat.voxel, 12), legs = new THREE.InstancedMesh(G.lgeo, AF.mat.voxel, 12 * G.legPos.length);
        for (const im of [body, legs]) { im.castShadow = true; im.receiveShadow = true; im.frustumCulled = false; im.count = 0; im.name = 'zoo:' + id; AF.scene.add(im); }
        sp = Z.species[id] = { id, G, body, legs, list: [] };
      }
      const [a, b, c, d] = H.rect;
      for (let k = 0; k < n; k++) {
        let x = a + 4 + R() * (c - a - 8), z = b + 4 + R() * (d - b - 8);
        for (let t = 0; t < 10 && id !== 'hippo' && id !== 'flamingo' && inPool(H.id, x, z); t++) { x = a + 4 + R() * (c - a - 8); z = b + 4 + R() * (d - b - 8); }
        const an = { sp, hab: H.id, rect: H.rect, x, z, y: W.groundY(x, z), yaw: R() * PI * 2, tx: x, tz: z, idle: R() * 6, phase: R() * 6, v: 0, scale: id === 'lion' || id === 'stag' ? 1.05 : 0.9 + R() * 0.2, sink: 0 };
        sp.list.push(an); Z.list.push(an);
      }
    }
  });
  const pickTarget = (an) => {
    const [a, b, c, d] = an.rect, S = an.sp.G.S;
    for (let k = 0; k < 8; k++) {
      let x = a + 3 + Math.random() * (c - a - 6), z = b + 3 + Math.random() * (d - b - 6);
      const wet = inPool(an.hab, x, z);
      if (wet && !(an.sp.id === 'hippo' || an.sp.id === 'croc' || an.sp.id === 'flamingo' || an.sp.id === 'tiger' || an.sp.id === 'bear') ) continue;
      if (an.sp.id === 'lion' && Math.random() < 0.5) { x = -512 + Math.random() * 6; z = -124 + Math.random() * 5; }
      an.tx = x; an.tz = z; return;
    }
  };
  let acc = 0;
  AF.onTick('zoo', 430, (dt) => {
    if (!Z.list.length) return;
    const cp = AF.camera.position, zx = (ZOO.x0 + ZOO.x1) / 2, zz = (ZOO.z0 + ZOO.z1) / 2;
    const dz = Math.hypot(cp.x - zx, cp.z - zz), vis = dz < 520;
    for (const id in Z.species) { const sp = Z.species[id]; sp.body.visible = sp.legs.visible = vis; }
    if (!vis) return;
    // far away: step the herds at a few Hz (nobody sees the difference), near: every frame
    acc += dt; const far = dz > 260; if (far && acc < 0.25) return;
    const step = far ? acc : dt; acc = 0;
    for (const an of Z.list) {
      const S = an.sp.G.S;
      if (an.idle > 0) { an.idle -= step; an.v = Math.max(0, an.v - step * 2); if (an.idle <= 0) pickTarget(an); }
      else {
        const dx = an.tx - an.x, dzz = an.tz - an.z, dd = Math.hypot(dx, dzz);
        if (dd < 0.6) { an.idle = (an.sp.id === 'croc' ? 12 : an.sp.id === 'lion' || an.sp.id === 'lioness' ? 9 : 3) + Math.random() * 10; }
        else {
          an.yaw += AF.angDiff(an.yaw, Math.atan2(dx, dzz)) * Math.min(1, step * 2.5);
          an.v = Math.min(S.speed, an.v + step * 1.5);
          const f = Math.max(0, Math.cos(AF.angDiff(an.yaw, Math.atan2(dx, dzz))));
          an.x += Math.sin(an.yaw) * an.v * f * step; an.z += Math.cos(an.yaw) * an.v * f * step;
        }
      }
      an.phase += step * an.v * (4.5 / Math.max(0.6, S.legH * VS));
      const wet = (an.sp.id === 'hippo' || an.sp.id === 'croc') && inPool(an.hab, an.x, an.z);
      an.sink += ((wet ? an.sp.G.lift + (an.sp.id === 'hippo' ? 0.9 : 0.35) : 0) - an.sink) * Math.min(1, step * 1.5);
      an.y = W.groundY(an.x, an.z);
    }
    // instance matrices
    for (const id in Z.species) {
      const sp = Z.species[id], G = sp.G; let bi = 0, li = 0;
      for (const an of sp.list) {
        const bob = Math.abs(Math.sin(an.phase)) * 0.04 * Math.min(1, an.v), s = an.scale;
        tmpE.set(0, an.yaw, 0); tmpQ.setFromEuler(tmpE);
        tmpM.compose(tmpV.set(an.x, Math.max(an.y, -0.2) + (G.lift - an.sink + bob) * s, an.z), tmpQ, one.set(s, s, s));
        sp.body.setMatrixAt(bi++, tmpM);
        const sw = Math.sin(an.phase) * 0.55 * Math.min(1, an.v / Math.max(0.3, G.S.speed));
        G.legPos.forEach(([lx, lz], k) => {
          const sgn = (k === 0 || k === 3) ? 1 : -1;
          tmpE.set((G.S.legs === 2 ? (k ? -1 : 1) : sgn) * sw + (G.S.legs === 2 && an.v < 0.05 && k === 1 ? -1.2 : 0), 0, 0); tmpQ.setFromEuler(tmpE);
          tmpM2.compose(tmpV.set(lx, 0, lz), tmpQ, one.set(1, 1, 1));
          sp.legs.setMatrixAt(li++, tmpM2.premultiply(tmpM));
        });
      }
      sp.body.count = bi; sp.legs.count = li;
      sp.body.instanceMatrix.needsUpdate = true; sp.legs.instanceMatrix.needsUpdate = true;
    }
  });
  // keepers
  AF.onBuild('zoo-keepers', 825, () => {
    if (!AF.npc) return;
    const keeper = (skin, hair, female) => ({ skin, hair, hairStyle: female ? 'pony' : 'short', female, top: { col: 0x5a6a3a, col2: 0xe8dcc0, style: 'shirt' }, bottom: { col: female ? 0x6a5a3a : 0x6a5a3a, style: 'shorts' }, shoe: 0x4a3020, hat: 'cap', hatCol: 0x6a7a3a, height: female ? 0.97 : 1.02 });
    AF.npc.spawn({ id: 'keeper-rosa', name: 'Rosa', role: 'Head keeper', look: keeper(0xd9a07a, 0x2a1a12, true), x: -544, y: 0.25, z: -150, yaw: PI,
      greet: ['Welcome to Solace Zoo!', 'Mind the flamingos, they\u2019re dramatic.', 'The hippos are awake!'],
      lines: [['Welcome to Solace Zoo! Eight habitats, one very tired keeper.', 'The savannah\u2019s straight ahead on your left. The elephants are the big grey ones.'], ['The hippos look lazy, but don\u2019t race one.', 'They\u2019ll win. Every time.'], ['The crocodiles haven\u2019t moved since Tuesday.', 'We check. Every day. Still Tuesday.']] });
    AF.npc.spawn({ id: 'keeper-otis', name: 'Otis', role: 'Big cat keeper', look: keeper(0xa87050, 0x1a120c, false), x: -500, y: 0.25, z: -86, yaw: -PI / 2,
      greet: ['Lions are napping. As usual.', 'Hey there!', 'The tigers love the stream.'],
      lines: [['That\u2019s Pride Rock. The big one with the mane is Leo.', 'He thinks he runs the place. He does.'], ['Tigers are the only big cats that love a swim.', 'Watch the stream at feeding time.']] });
  });
}

} catch (e) { AF.partError('46-zoo.js', e); }
