// ================================================================ 46-zoo.js
try {
// ===== 46-zoo: SOLACE ZOO — themed habitats, articulated instanced wildlife and bounded species behaviours (OWNER: west) =====
{
  const P = AF.PLAN, W = AF.W, ZOO = P.west.zoo, PI = Math.PI;
  const K = () => AF.westKit;
  const HAB = ZOO.habitats = [
    { id: 'elephants', name: 'Elephant Plains', rect: [-640, -140, -604, -89], side: 'e', ground: [0xc8b060, 0xb8a050, 0xd8c078], animals: [['elephant', 3]],
      sign: ['African elephants: the largest land animals on Earth.', 'An elephant eats around 150 kg of food a day and drinks up to 200 litres of water.', 'Their ears flap to cool them down \u2014 like big grey fans.'] },
    { id: 'giraffes', name: 'Acacia Savanna', rect: [-594, -140, -562, -89], side: 'w', ground: [0xc8b060, 0xbfa858, 0xd8c078], animals: [['giraffe', 3], ['zebra', 3], ['antelope', 3]],
      sign: ['Giraffes: the tallest animals alive, up to 5.5 metres.', 'Their tongues are almost half a metre long and dark blue-black.', 'A giraffe sleeps only about 30 minutes a day, in short naps.'] },
    { id: 'rhinos', name: 'Rhino Bushveld', rect: [-640, -81, -604, -30], side: 'e', ground: [0xb8b060, 0xa8a050, 0xc8c078], animals: [['rhino', 2]],
      sign: ['White rhinos graze with broad, square lips.', 'Their horns are made of keratin, like our fingernails.'] },
    { id: 'primates', name: 'Primate Island', rect: [-594, -81, -562, -30], side: 'w', ground: [0x598643, 0x426f39, 0x8a9a55], animals: [['gorilla', 2], ['monkey', 5]],
      sign: ['Gorillas live in family groups led by a silverback.', 'The monkeys use their tails for balance on the climbing frames.'] },
    { id: 'lions', name: 'Pride Rock', rect: [-536, -140, -496, -90], side: 'w', ground: [0xc0a860, 0xa89a58, 0xd0b878], animals: [['lion', 1], ['lioness', 2]],
      sign: ['The pride lounges on the warm rock for most of the day.', 'Lions sleep up to twenty hours a day. Relatable.', 'A lion\u2019s roar carries eight kilometres.'] },
    { id: 'tigers', name: 'Tiger Forest', rect: [-536, -82, -496, -30], side: 'w', ground: [0x4f7a34, 0x3f6a2e, 0x5a8a3a], animals: [['tiger', 3]],
      sign: ['Tigers love water \u2014 watch for them near the stream.', 'No two tigers have the same stripes.', 'Tigers are the largest of all the big cats.'] },
    { id: 'flamingos', name: 'Flamingo Lagoon', rect: [-486, -140, -456, -30], side: 'w', ground: [0xd8c8a0, 0xc8b890, 0xe0d0a8], animals: [['flamingo', 9]],
      sign: ['Flamingos are pink because of the shrimp and algae they eat.', 'They sleep standing on one leg. Try it.'] },
    { id: 'hippos', name: 'Hippo River', rect: [-640, -280, -602, -166], side: 'e', ground: [0x6a5a3a, 0x5a4a30, 0x7a6a44], animals: [['hippo', 3]],
      sign: ['Hippos spend their days in the water and graze at night.', 'A hippo can hold its breath for five minutes.', 'Despite their size, hippos can outrun a person on land.'] },
    { id: 'crocs', name: 'Crocodile Marsh', rect: [-594, -280, -560, -228], side: 'w', ground: [0x5a6a3a, 0x4a5a30, 0x6a7a44], animals: [['croc', 4]],
      sign: ['Crocodiles can lie perfectly still for hours.', 'Please do not tap on the viewing glass.', 'Crocodiles have been around for more than 200 million years.'] },
    { id: 'penguins', name: 'Penguin Coast', rect: [-594, -222, -560, -166], side: 'w', ground: [0xcadce0, 0xe9f0eb, 0xa8bcc4], animals: [['penguin', 8]],
      sign: ['Penguins fly through the water using their flippers.', 'The underwater window reveals their streamlined swimming.'] },
    { id: 'deer', name: 'Deer Woodland', rect: [-536, -280, -496, -166], side: 'w', ground: [0x6f9a3e, 0x7da646, 0x88a049], animals: [['deer', 5], ['stag', 2]],
      sign: ['White-tailed deer from the hills north of Port Solace.', 'The stags grow a new set of antlers every year.'] },
    { id: 'bears', name: 'Bear Forest', rect: [-486, -280, -456, -166], side: 'w', ground: [0x5a6a34, 0x4a5a2e, 0x6a5a3a], animals: [['bear', 2]],
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
    path(-603.5, -146, -594.5, -26); path(-640, -88.5, -562, -81.5); path(-640, -29, -553, -22);   // between the four plains enclosures + the south walk
    // perimeter wall with the gate on the promenade
    const wall = (a, b, c, d) => { W.fill(a, 0.25, b, c, 2.75, d, stoneW); W.fill(Math.max(x0, a - 0.25), 2.75, Math.max(z0, b - 0.25), Math.min(x1, c + 0.25), 3.0, Math.min(z1, d + 0.25), cap); };
    wall(x0, z0, x1, z0 + 0.5); wall(x0, z0, x0 + 0.5, z1); wall(x1 - 0.5, z0, x1, z1);
    wall(x0, z1 - 0.5, -556, z1); wall(-536, z1 - 0.5, x1, z1);
    // the gate: two deco pylons + an arch with the name, a ticket kiosk
    for (const gx of [-557, -537]) { W.fill(gx, 0.25, z1 - 2, gx + 2, 8, z1 - 0.5, col(0xf2ece0, { pat: 'stone' })); W.fill(gx - 0.25, 8, z1 - 2.25, gx + 2.25, 8.5, z1 - 0.25, col(0x2f6a4a)); W.fill(gx + 0.5, 8.5, z1 - 1.5, gx + 1.5, 9.25, z1 - 0.5, glow(0xffe0a0, 2.2, 'night')); }
    W.fill(-555, 6.5, z1 - 2, -537, 7.5, z1 - 1, col(0x2f6a4a));
    const g = K().text('SOLACE ZOO', 0xffe9b0, { font: 'deco', vs: 1 / 9, k: 2.2 });
    AF.placeStatic(g, -546, 6.55, z1 - 0.95, 0, { collide: false }); AF.placeStatic(g, -546, 6.55, z1 - 2.05, 2, { collide: false });
    W.fill(-535, 0.25, z1 - 6, -531, 3, z1 - 2, col(0xe8dcc0, { pat: 'stucco' })); W.fill(-535.25, 3, z1 - 6.25, -530.75, 3.5, z1 - 1.75, col(0xc0392b)); W.fill(-535.1, 1.25, z1 - 5, -535, 2.25, z1 - 3, col(0xa9c9d6, { glass: true }));
    for (const gx of [-556, -536]) AF.addLight({ x: gx, y: 9, z: z1, color: 0xffe0a0, intensity: 1, range: 12, kind: 'street' });
    AF.addBuilding({ id: 'zoo', name: 'Solace Zoo', kind: 'zoo', box: [x0, 0, z0, x1, 3, z1], doors: [{ x: -546, y: 0.25, z: z1 - 2, yaw: PI }], interior: false, owner: 'west', label: true });
    // lamp posts along the promenade
    for (let z = -40; z > -280; z -= 24) for (const x of [-554, -538]) { W.fill(x, 0.25, z, x + 0.25, 4, z + 0.25, iron); W.fill(x - 0.25, 4, z - 0.25, x + 0.5, 4.5, z + 0.5, glow(0xfff0c8, 2.6, 'night')); AF.addLight({ x: x + 0.1, y: 4.3, z: z + 0.1, color: 0xffe0b0, intensity: 0.8, range: 10, kind: 'street' }); }
    // ---- enclosures: ground, a knee-high stone wall + open railing (you look OVER it), a name board on the path side
    const rail = col(0x2f4a3a, { metal: 0.6, rough: 0.45 }), boardC = col(0x2f6a4a), paper = col(0xf2ead0, { jitter: 0.05 });
    const fitText = (str, hex, maxW, font) => { const o = { font, depth: 1, pad: 0 }; const w = AF.textModel(str, 1, o).w || 1; return K().text(str, hex, { lit: false, font, pad: 0, vs: Math.min(1 / 16, maxW / w) }); };
    const spot = (x, z, yaw, kind) => AF.addSpot && AF.addSpot({ building: 'zoo', x, y: 0.25, z, yaw, kind });
    for (const H of HAB) {
      const [a, b, c, d] = H.rect, gc = H.ground.map((h) => col(h, { jitter: 0.9 }));
      W.eachCol(a, b, c, d, (bx, bz, i, x, z) => { const n = AF.noise2(x * 0.12, z * 0.12); W.C[i] = gc[n < 0.4 ? 0 : n < 0.7 ? 1 : 2]; });
      const fence = (p, q, r, s) => { W.fill(p, 0.25, q, r, 0.75, s, stoneW); W.fill(p, 0.75, q, r, 1.0, s, cap); };
      fence(a - 0.5, b - 0.5, c + 0.5, b); fence(a - 0.5, d, c + 0.5, d + 0.5); fence(a - 0.5, b, a, d); fence(c, b, c + 0.5, d);
      for (const [p, q, r, s] of [[a - 0.5, b - 0.5, c + 0.5, b], [a - 0.5, d, c + 0.5, d + 0.5]]) { for (let x = p; x < r; x += 2) W.fill(x, 1.0, q + 0.125, x + 0.25, 1.75, s - 0.125, rail); W.fill(p, 1.5, q + 0.125, r, 1.75, s - 0.125, rail); }
      for (const [p, r] of [[a - 0.5, a], [c, c + 0.5]]) { for (let z = b; z < d; z += 2) W.fill(p + 0.125, 1.0, z, r - 0.125, 1.75, z + 0.25, rail); W.fill(p + 0.125, 1.5, b, r - 0.125, 1.75, d, rail); }
      // the board: a slanted lectern on the path side, name in raised letters, facts on interact
      const east = H.side === 'e', bx0 = east ? c + 1.4 : a - 1.4, bz0 = (b + d) / 2, face = east ? 1 : 3, fx = east ? 1 : -1;
      W.fill(bx0 - 0.125, 0.25, bz0 - 0.125, bx0 + 0.125, 1.25, bz0 + 0.125, boardC);
      W.fill(Math.min(bx0, bx0 + fx * 0.25), 1.25, bz0 - 1.1, Math.max(bx0, bx0 + fx * 0.25), 2.25, bz0 + 1.1, boardC);
      W.fill(Math.min(bx0 + fx * 0.25, bx0 + fx * 0.5), 1.35, bz0 - 1.0, Math.max(bx0 + fx * 0.25, bx0 + fx * 0.5), 2.15, bz0 + 1.0, paper);
      AF.placeStatic(fitText(H.name.toUpperCase(), 0x2f4a3a, 2.0, 'deco'), bx0 + fx * 0.55, 1.8, bz0, face, { collide: false });
      AF.placeStatic(fitText(H.animals.map((q) => q[0]).join(' \u00b7 '), 0x6a4a2a, 1.6), bx0 + fx * 0.55, 1.5, bz0, face, { collide: false });
      AF.addInteract({ x: bx0 + fx * 1.2, y: 1.2, z: bz0, r: 2.2, label: 'Read: ' + H.name, act: () => AF.emit('dialogue', { name: H.name, role: 'Solace Zoo', lines: H.sign }) });
      AF.addLabel(H.name, (a + c) / 2, (b + d) / 2, 'place');
      // onlookers lean on the rail along the path side (the crowd's instanced extras fill these)
      const rx = east ? c + 1.1 : a - 1.1, ryaw = east ? -PI / 2 : PI / 2;
      for (let z = b + 4; z < d - 3; z += 7) if (Math.abs(z - bz0) > 2.5) spot(rx, z + (AF.hash2(z | 0, a | 0) - 0.5), ryaw, 'stand');
      // planting along the outside of the wall (kept off the paths)
      const hed = [col(0x4f8a3a, { jitter: 0.7, solid: false }), col(0x6aa84a, { jitter: 0.7, solid: false }), col(0xd8502a, { jitter: 0.4, solid: false }), col(0xf0d040, { jitter: 0.4, solid: false })];
      const ox = east ? a - 1.25 : c + 0.75;
      for (let z = b + 1; z < d - 1; z += 0.5) { const q = AF.hash2((z * 4) | 0, (ox * 4) | 0), ci = W.col(ox + 0.25, z + 0.25); if (ci < 0 || W.C[ci] === pave || W.C[ci] === paveD) continue; if (q < 0.55) W.fill(ox, 0.25, z, ox + 0.5, 0.5 + (q < 0.2 ? 0.25 : 0), z + 0.5, hed[q < 0.12 ? 2 : q < 0.2 ? 3 : q < 0.4 ? 0 : 1]); }
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
    pool(-622, -259, 10, 18, 1.4, 0, 'hippos'); pool(-618, -181, 9, 13, 1.1, 0, 'hippos');
    pool(-580, -254, 9, 17, 0.9, 0.0, 'crocs');
    pool(-580, -193, 10, 20, 2.0, 0.0, 'penguins');
    pool(-471, -85, 10, 36, 0.5, 0.05, 'flamingos');                // the shallow lagoon
    pool(-620, -58, 8, 6, 0.8, 0.0, 'rhinos');
    pool(-580, -111, 6, 5, 0.8, 0.0, 'giraffes');
    pool(-622, -116, 7, 6, 1.0, 0.0, 'elephants');                  // the elephants' bathing pool
    pool(-506, -48, 4, 12, 0.6, 0.0, 'tigers');                     // tiger stream
    pool(-462, -190, 5, 6, 0.8, 0.0, 'bears');                      // bear pool
    pool(-474, -217, 2.5, 17, 0.6, 0, 'bears'); pool(-469, -199, 6, 5, 0.6, 0, 'bears');
    pool(-528, -99, 3, 3, 0.5, 0, 'lions'); pool(-506, -220, 4, 6, 0.6, 0, 'deer');
    pool(-581, -75, 9, 2, 1.2, 0, 'primates'); pool(-581, -36, 9, 2, 1.2, 0, 'primates');
    pool(-591, -55, 2, 18, 1.2, 0, 'primates'); pool(-565, -55, 2, 18, 1.2, 0, 'primates');
    for (const H of HAB) {
      H.pool = POOLS.find((p) => p.hab === H.id) || null;
      const [a, b, c, d] = H.rect;
      H.browse = [a + 7, b + 11]; H.rest = H.id === 'lions' ? [-526, -111] : [c - 8, d - 9];
      H.entry = H.id === 'lions' ? [-526, -104] : H.rest;
      H.frames = [[a + 9, b + 15, 3.25], [c - 10, b + 27, 4.5], [a + 11, d - 13, 3.75]];
      const viewingX = H.side === 'e' ? c : a - 0.25;
      if (['lions', 'tigers', 'bears', 'crocs', 'penguins', 'primates'].includes(H.id)) {
        const glass = col(0xaccfd8, { glass: true, rough: 0.15 });
        W.fill(viewingX, 1, b + 1, viewingX + 0.25, 3.5, d - 1, glass);
        for (let z = b + 1; z < d; z += 4) W.fill(viewingX, 0.75, z, viewingX + 0.5, 3.75, z + 0.25, rail);
        for (const edgeZ of [b, d]) {
          for (let x = a; x < c; x += 3) W.fill(x, 1, edgeZ, x + 0.25, 3.75, edgeZ + 0.25, rail);
          for (let y = 2; y < 3.75; y += 0.5) W.fill(a, y, edgeZ, c, y + 0.25, edgeZ + 0.25, rail);
        }
        const backX = H.side === 'e' ? a : c;
        for (let z = b; z < d; z += 3) W.fill(backX, 1, z, backX + 0.25, 3.75, z + 0.25, rail);
        for (let y = 2; y < 3.75; y += 0.5) W.fill(backX, y, b, backX + 0.25, y + 0.25, d, rail);
      }
      if (['elephants', 'rhinos', 'giraffes'].includes(H.id)) {
        for (const edge of [a + 1, c - 2]) {
          W.eachCol(edge, b + 1, edge + 1, d - 1, (bx, bz, i) => { W.H[i] = -4; W.C[i] = cap; });
          W.fill(edge, -1, b + 1, edge + 1, -0.75, d - 1, cap);
        }
      }
    }
    const timber = col(0x886944), rope = col(0xc7b287), ice = col(0xdcebf0), mud = col(0x665043);
    W.eachCol(-636, -111, -628, -100, (bx, bz, i) => { W.C[i] = mud; });
    W.fill(-524, 0.25, -130, -510, 4, -124, stoneW); W.clear(-520, 0.25, -125, -514, 2.5, -122);
    W.fill(-520, 2.5, -126, -514, 3, -121, cap);
    for (const [x, z, height] of HAB.find((h) => h.id === 'primates').frames) {
      for (const dx of [-2, 2]) for (const dz of [-2, 2]) W.fill(x + dx, 0.25, z + dz, x + dx + 0.5, height, z + dz + 0.5, timber);
      W.fill(x - 2.5, height, z - 2.5, x + 3, height + 0.25, z + 3, timber);
      for (let y = 0.75; y < height; y += 0.5) W.fill(x - 1, y, z + 2.25, x + 1, y + 0.25, z + 2.5, rope);
      W.fill(x - 2, height + 1.5, z, x + 2.5, height + 1.75, z + 0.25, rope);
    }
    for (let k = 0; k < 24; k++) {
      const x = -584 + k * 0.5, z = -66 + k * 0.5;
      W.fill(x, 4.75 - Math.sin(k / 23 * PI) * 0.75, z, x + 0.5, 5 - Math.sin(k / 23 * PI) * 0.75, z + 0.5, rope);
    }
    for (const [x, z, h] of [[-585, -217, 2], [-569, -214, 3], [-586, -171, 2.5]]) {
      W.fill(x - 2, 0.25, z - 2, x + 2, h, z + 2, ice); W.fill(x - 1.25, h, z - 1.25, x + 1.25, h + 0.5, z + 1.25, ice);
    }
    W.eachCol(-601, -209, -595, -183, (bx, bz, i) => { W.H[i] = -7; W.C[i] = pave; });
    W.eachCol(-594.25, -208, -585, -184, (bx, bz, i) => { W.H[i] = -8; W.C[i] = cap; });
    W.fill(-594.5, -1.75, -209, -594.25, 1, -183, col(0xa7d3df, { glass: true }));
    const bay = new THREE.BufferGeometry();
    bay.setAttribute('position', new THREE.Float32BufferAttribute([-594.25, 0, -208, -594.25, 0, -184, -585, 0, -184, -585, 0, -208], 3));
    bay.setAttribute('normal', new THREE.Float32BufferAttribute([0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0], 3));
    bay.setIndex([0, 1, 2, 0, 2, 3]); bay.computeBoundingSphere(); bay.userData.kind = 'pond'; bay.userData.waterY = 0; AF.addWater(bay);
    P.pools.push({ x0: -594.25, z0: -208, x1: -585, z1: -184, y: 0 });
    for (let k = 0; k < 8; k++) {
      W.eachCol(-601, -211 - k * 0.5, -595, -210.5 - k * 0.5, (bx, bz, i) => { W.H[i] = -7 + k; W.C[i] = pave; });
      W.fill(-601, -1.75 + k * 0.25, -211 - k * 0.5, -595, -1.5 + k * 0.25, -210.5 - k * 0.5, pave);
    }
    W.fill(-594.5, -1.75, -209, -590, 1, -208.5, stoneW); W.fill(-594.5, -1.75, -183.5, -590, 1, -183, stoneW);
    for (const [x, z] of [[-602, -113], [-495, -112], [-495, -240]]) {
      W.fill(x, 0.25, z - 4, x + 1.75, 0.75, z + 4, timber);
      W.fill(x, 0.75, z - 4, x + 0.25, 1.75, z + 4, rail);
      for (let k = 0; k < 3; k++) W.fill(x + 1.75 + k * 0.5, 0.25, z - 1, x + 2.25 + k * 0.5, 0.75 - k * 0.25, z + 1, timber);
    }
    // ---- features
    const rock = [col(0x8a847c, { jitter: 0.6 }), col(0x9a9288, { jitter: 0.6 }), col(0x7a746c, { jitter: 0.6 })];
    const boulder = (x, z, r, h) => { for (let y = 0; y < h; y += 0.5) { const rr = r * Math.sqrt(1 - (y / h) * 0.8); W.eachCol(x - rr, z - rr, x + rr, z + rr, (bx, bz, i, px, pz) => { if (Math.hypot(px - x, pz - z) < rr - AF.hash2(bx, bz) * 0.4) W.fill(px - 0.125, 0.25 + y, pz - 0.125, px + 0.125, 0.75 + y, pz + 0.125, rock[(bx + bz + y * 2) % 3 | 0]); }); } };
    // Pride Rock: stepped ledges up to a jutting lip
    boulder(-516, -118, 9, 3); boulder(-512, -122, 6, 5.5); boulder(-509, -125, 3.5, 7);
    W.fill(-514, 6.75, -128, -504, 7.25, -121, rock[1]);
    W.clear(-520, 0.25, -126, -514, 2.5, -108);
    W.fill(-529, 0.25, -114, -523, 1, -108, rock[1]);
    for (let step = 0; step < 3; step++) W.fill(-528, 0.25, -108 + step, -524, 1 - step * 0.25, -107 + step, rock[1]);
    // savannah: acacias (a thin trunk + a flat umbrella crown), termite mounds, rocks
    const bark = col(0x5a4632, { jitter: 0.5 }), leafA = col(0x6a8a2e, { jitter: 0.7 }), leafB = col(0x7a9a3a, { jitter: 0.7 });
    const acacia = (x, z, s) => { W.fill(x - 0.25, 0.25, z - 0.25, x + 0.25, 4.5 * s, z + 0.25, bark); W.fill(x - 1.5, 4 * s, z - 0.25, x + 1.5, 4.25 * s, z + 0.25, bark); for (const [r, y] of [[3.8 * s, 4.5 * s], [4.6 * s, 4.75 * s], [3.2 * s, 5 * s]]) W.eachCol(x - r, z - r, x + r, z + r, (bx, bz, i, px, pz) => { if (Math.hypot(px - x, pz - z) < r - AF.hash2(bx, bz) * 0.8) W.fill(px - 0.125, y, pz - 0.125, px + 0.125, y + 0.25, pz + 0.125, AF.hash2(bx * 3, bz) < 0.5 ? leafA : leafB); }); };
    for (const [x, z, s] of [[-630, -132, 1.1], [-587, -129, 1.05], [-630, -40, 1], [-575, -128, 0.9], [-580, -40, 1.2], [-570, -70, 1], [-612, -98, 1]]) acacia(x, z, s);
    const grass = col(0x8d9b49, { solid: false }), seedHead = col(0xc9ba70, { solid: false });
    for (let k = 0; k < 200; k++) {
      const x = -592 + AF.hash2(k, 411) * 28, z = -138 + AF.hash2(k, 712) * 47;
      if (POOLS.some((p) => p.hab === 'giraffes' && Math.hypot((x - p.cx) / (p.rx + 1), (z - p.cz) / (p.rz + 1)) < 1)) continue;
      const h = 0.5 + (k % 4) * 0.25;
      W.fill(x, 0.25, z, x + 0.25, h, z + 0.25, grass); W.fill(x, h, z, x + 0.25, h + 0.25, z + 0.25, seedHead);
    }
    const mound = col(0xa8784a, { jitter: 0.6 });
    for (const [x, z] of [[-585, -130], [-620, -98], [-566, -44]]) for (let y = 0; y < 2.5; y += 0.25) { const r = 0.9 * (1 - y / 2.8); W.fill(x - r, 0.25 + y, z - r, x + r, 0.5 + y, z + r, mound); }
    boulder(-575, -60, 2.5, 1.5); boulder(-632, -135, 2, 1.2);
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
      const byId = (id) => HAB.find((h) => h.id === id).rect;
      plant(byId('tigers'), 14, 'autumn', 100); plant(byId('deer'), 18, 'autumn', 200); plant(byId('bears'), 12, 'evergreen', 300); plant(byId('lions'), 2, 'oak', 400);
      for (let z = -40; z > -280; z -= 30) { TK.place(-547, z, 'street', 1, z); }
      // shade trees in the lawn strips beside the cross walk + the south walk
      for (const [x, z] of [[-630, -163], [-575, -163], [-520, -163], [-470, -163], [-625, -143], [-505, -143], [-620, -19], [-580, -19], [-500, -19], [-460, -19]]) TK.place(x, z, 'any', 0, (x * 7 + z) | 0);
    }
    // ---- kiosks along the cross walk: ice cream, snacks, gifts (counter faces the walk), with café tables + benches
    const kiosk = (x, z, name, stripe, body) => {
      const bd = col(body, { pat: 'none', jitter: 0.1 }), st = col(stripe, { jitter: 0.05 }), wt = col(0xf6f2ea, { jitter: 0.05 });
      W.fill(x - 1.75, 0.25, z, x + 1.75, 2.5, z + 3, bd); W.clear(x - 1.5, 0.25, z + 0.25, x + 1.5, 2.25, z + 2.75);
      W.clear(x - 1.5, 1.25, z, x + 1.5, 2.25, z + 0.25); W.fill(x - 1.5, 1.0, z - 0.25, x + 1.5, 1.25, z + 0.25, wt);
      for (let i = 0; i < 7; i++) W.fill(x - 1.75 + i * 0.5, 2.5, z - 1.0, x - 1.25 + i * 0.5, 2.75, z + 3, i & 1 ? wt : st);
      W.fill(x - 1.75, 2.25, z - 1.0, x + 1.75, 2.5, z - 0.75, st);
      W.fill(x - 1.25, 0.25, z + 2.25, x + 1.25, 1.0, z + 2.75, wt); W.fill(x - 1.0, 1.25, z + 2.5, x + 1.0, 2.0, z + 2.75, col(stripe, { emit: stripe, emitK: 0.5, jitter: 0 }));
      AF.placeStatic(fitText(name, 0xffffff, 3.0, 'deco'), x, 2.85, z - 0.4, 2, { collide: false });
      W.fill(x - 1.75, 2.75, z + 1.25, x + 1.75, 3.25, z + 1.5, st);
      AF.addLight({ x, y: 2.2, z: z + 0.2, color: 0xffe0b0, intensity: 0.6, range: 7, kind: 'shop' });
      if (AF.addSpot) { AF.addSpot({ building: 'zoo-kiosk', x, y: 0.25, z: z + 1.4, yaw: PI, kind: 'counter' }); AF.addSpot({ building: 'zoo', x: x - 0.6, y: 0.25, z: z - 1.6, yaw: 0, kind: 'queue' }); AF.addSpot({ building: 'zoo', x: x + 0.7, y: 0.25, z: z - 2.4, yaw: 0.2, kind: 'queue' }); }
    };
    kiosk(-578, -144.5, 'ICE CREAM', 0xe86a9a, 0xf6e8d8); kiosk(-520, -144.5, 'SNACKS', 0xd8502a, 0xf2e2c0); kiosk(-470, -144.5, 'GIFTS', 0x2f6a8a, 0xe8eef2);
    const table = col(0xf6f2ea), chairC = col(0x2f6a4a), bench = col(0x8a5a34, { pat: 'none' }), ironB = col(0x2a2a2e);
    for (const [x, z] of [[-584, -163], [-526, -163], [-464, -163]]) {
      for (const dx of [-2, 2]) { W.fill(x + dx - 0.5, 0.25, z - 0.5, x + dx + 0.5, 1.0, z + 0.5, table); W.clear(x + dx - 0.25, 0.25, z - 0.5, x + dx + 0.25, 0.75, z + 0.5); for (const s of [-1, 1]) { W.fill(x + dx - 0.25, 0.25, z + s * 0.9 - 0.25, x + dx + 0.25, 0.75, z + s * 0.9 + 0.25, chairC); AF.addSpot && AF.addSpot({ building: 'zoo', x: x + dx, y: 0.75, z: z + s * 0.9, yaw: s > 0 ? PI : 0, kind: 'sit' }); } }
    }
    for (let z = -52; z > -280; z -= 24) for (const [x, yaw] of [[-552.25, PI / 2], [-539.75, -PI / 2]]) {
      W.fill(x - 0.25, 0.25, z - 1, x + 0.25, 0.5, z + 1, ironB); W.fill(x - 0.25, 0.5, z - 1, x + 0.25, 0.75, z + 1, bench);
      const bk = x < -546 ? x - 0.25 : x + 0.25; W.fill(Math.min(bk, bk + (x < -546 ? -0.25 : 0.25)), 0.75, z - 1, Math.max(bk, bk + (x < -546 ? -0.25 : 0.25)), 1.25, z + 1, bench);
      if (AF.addSpot) for (const dz of [-0.5, 0.5]) AF.addSpot({ building: 'zoo', x, y: 0.75, z: z + dz, yaw, kind: 'bench' });
    }
    // flower beds + planters dotted along the promenade edges
    const flw = [0xd8502a, 0xf0d040, 0xe86a9a, 0xf6f2ea, 0x8a6ac8].map((h) => col(h, { jitter: 0.4, solid: false })), lf = col(0x4f8a3a, { jitter: 0.7, solid: false });
    for (let z = -58; z > -280; z -= 24) for (const x of [-554, -538.5]) { W.fill(x - 0.25, 0.25, z - 1.5, x + 0.5, 0.5, z + 1.5, col(0x8a7a6a, { pat: 'stone' })); for (let k = 0; k < 12; k++) { const zz = z - 1.5 + k * 0.25; W.fill(x - 0.25, 0.5, zz, x + 0.5, 0.75 + (k % 3 === 0 ? 0.25 : 0), zz + 0.25, k % 3 ? lf : flw[(k + ((z / 24) | 0)) % flw.length]); } }
    ZOO.buildMs = Math.round(performance.now() - t0);
  });

  // ---------------------------------------------------------------- animals: species builders (1/8 m voxels)
  const VS = 1 / 8;
  const C = (h, o) => AF.col(h, Object.assign({ jitter: 0.25, edge: 0.3 }, o || {}));
  const shadeH = (hex, k) => { const f = (s) => Math.max(0, Math.min(255, Math.round(((hex >> s) & 255) * k))); return (f(16) << 16) | (f(8) << 8) | f(0); };
  // refine a 1/8 m animal model to 1/16 m: sun-lit back, mottled coat, chamfered corners, a catch-light in each eye
  const refine = (m, c, eyes) => {
    const o = new AF.Model(m.w * 2, m.h * 2, m.d * 2);
    for (let x = 0; x < m.w; x++) for (let y = 0; y < m.h; y++) for (let z = 0; z < m.d; z++) { const v = m.get(x, y, z); if (v) o.box(x * 2, y * 2, z * 2, x * 2 + 2, y * 2 + 2, z * 2 + 2, v); }
    const cut = [];
    for (let x = 0; x < o.w; x++) for (let y = 0; y < o.h; y++) for (let z = 0; z < o.d; z++) {
      const v = o.get(x, y, z); if (!v) continue;
      if (v === c.body) { if (!o.get(x, y + 1, z)) o.set(x, y, z, c.bodyL); else if (AF.hash3(x, y, z) < 0.14) o.set(x, y, z, c.bodyD); }
      if (y > 0) { const e = !o.get(x + 1, y, z) + !o.get(x - 1, y, z) + !o.get(x, y + 1, z) + !o.get(x, y - 1, z) + !o.get(x, y, z + 1) + !o.get(x, y, z - 1); if (e >= 3 && v !== c.eye) cut.push(x, y, z); }
    }
    for (let i = 0; i < cut.length; i += 3) o.set(cut[i], cut[i + 1], cut[i + 2], 0);
    if (eyes) for (const [ex, ey, ez, side] of eyes) { o.set(ex * 2 + (side > 0 ? 1 : 0), ey * 2 + 1, ez * 2 + 1, c.white); o.set(ex * 2 + (side > 0 ? 1 : 0), ey * 2 + 1, ez * 2, c.eye); }
    return o;
  };
  // spec: body [w,h,l], legH, legW, leg offsets (x, z from body centre, in voxels), head [w,h,l], neck [w,h,l, forward], cols, pattern, extras(m, dims)
  const SPEC = {
    elephant: { body: [18, 14, 30], legH: 10, legW: 5, head: [12, 6, 10], neck: [10, 1, 3, 0], col: 0x8a8a90, belly: 0x7a7a82, speed: 0.85, legs: 4 },
    giraffe: { body: [8, 8, 17], legH: 16, legW: 2, head: [4, 5, 8], neck: [3, 15, 4, 3], col: 0xd8a860, belly: 0xe8d0a0, pattern: 'spots', patCol: 0x8a5a2a, speed: 1.0, legs: 4 },
    rhino: { body: [13, 11, 25], legH: 5, legW: 4, head: [8, 7, 10], neck: [7, 1, 4, 0], col: 0x92928a, belly: 0x777a73, speed: 0.7, legs: 4 },
    penguin: { body: [4, 6, 4], legH: 1, legW: 1, head: [3, 3, 3], neck: [2, 1, 2, 0], col: 0x222b34, belly: 0xf4f0dd, speed: 0.55, legs: 2, beak: 0xe9af38 },
    gorilla: { body: [9, 9, 8], legH: 5, legW: 3, head: [5, 5, 5], neck: [4, 1, 2, 0], col: 0x343633, belly: 0x8b8e8a, speed: 0.7, legs: 4, snout: 0x64615c },
    monkey: { body: [3, 4, 5], legH: 4, legW: 1, head: [3, 3, 3], neck: [2, 1, 2, 0], col: 0x96734f, belly: 0xd7c6a4, speed: 1.5, legs: 4, tailL: 10, snout: 0xc99e7b },
    zebra: { body: [7, 6, 16], legH: 7, legW: 2, head: [4, 4, 7], neck: [4, 4, 4, 2], col: 0xf2f2ee, belly: 0xf2f2ee, pattern: 'stripes', patCol: 0x1a1a1a, speed: 1.4, legs: 4, mane: 0x1a1a1a },
    antelope: { body: [6, 7, 12], legH: 9, legW: 2, head: [3, 4, 6], neck: [3, 6, 3, 2], col: 0xb87a3a, belly: 0xf2ead8, speed: 1.6, legs: 4, horns: 0x2a2018 },
    deer: { body: [6, 7, 12], legH: 9, legW: 2, head: [3, 4, 6], neck: [3, 6, 3, 2], col: 0x9a6a3a, belly: 0xe8dcc4, pattern: 'dots', patCol: 0xe8dcc4, speed: 1.3, legs: 4 },
    stag: { body: [7, 8, 13], legH: 10, legW: 2, head: [3, 4, 6], neck: [3, 7, 3, 2], col: 0x8a5a30, belly: 0xe8dcc4, speed: 1.2, legs: 4, antlers: 0x6a5238 },
    lion: { body: [8, 6, 17], legH: 5, legW: 3, head: [6, 5, 7], neck: [5, 2, 3, 1], col: 0xd0a050, belly: 0xe0c080, speed: 0.8, legs: 4, maneCol: 0x7a4a1a, tail: 0x7a4a1a },
    lioness: { body: [7, 5, 15], legH: 5, legW: 2, head: [5, 5, 7], neck: [4, 2, 3, 1], col: 0xd6aa5c, belly: 0xe8cc90, speed: 0.9, legs: 4, tail: 0x8a5a2a },
    tiger: { body: [8, 6, 18], legH: 5, legW: 3, head: [6, 5, 7], neck: [5, 2, 3, 1], col: 0xe07a22, belly: 0xf2ead8, pattern: 'stripes', patCol: 0x1a1a1a, speed: 1.0, legs: 4, tail: 0xe07a22 },
    bear: { body: [11, 9, 18], legH: 4, legW: 4, head: [8, 7, 7], neck: [6, 1, 2, 1], col: 0x5a3a22, belly: 0x6a4a2a, speed: 0.8, legs: 4, ears: true, snout: 0x8a6a4a },
    hippo: { body: [14, 11, 22], legH: 4, legW: 4, head: [11, 7, 10], neck: [10, 1, 2, 0], col: 0x7a6a78, belly: 0xc89a9a, speed: 0.6, legs: 4, ears: true, snout: 0x9a7a88 },
    croc: { body: [7, 4, 24], legH: 2, legW: 2, head: [5, 3, 12], neck: [5, 1, 1, 0], col: 0x4a5a2a, belly: 0x9a9a6a, pattern: 'scutes', patCol: 0x35401c, speed: 0.5, legs: 4, tailL: 20 },
    flamingo: { body: [4, 3, 6], legH: 7, legW: 1, head: [2, 2, 4], neck: [1, 5, 1, 1], col: 0xf28aa8, belly: 0xf6a8c0, speed: 0.5, legs: 2, beak: 0x1a1a1a },
  };
  const makeGeo = (id) => {
    const S = SPEC[id], c = { body: C(S.col), bodyL: C(shadeH(S.col, 1.08)), bodyD: C(shadeH(S.col, 0.86)), belly: C(S.belly),
      pat: C(S.patCol ?? S.col), eye: C(0x141414, { jitter: 0 }), white: C(0xfff8e9), dark: C(0x302822), ivory: C(0xf0ead8),
      mane: C(S.maneCol ?? S.mane ?? S.col), snout: C(S.snout ?? S.belly) };
    const parts = [], bw = S.body[0] * VS, bh = S.body[1] * VS, bl = S.body[2] * VS;
    const nh = S.neck[1] * VS, hh = S.head[1] * VS, hw = S.head[0] * VS, hl = S.head[2] * VS, lift = S.legH * VS;
    const shape = (dims, kind, color, anchor) => {
      const width = Math.max(1, Math.round(dims[0] * 8)), height = Math.max(1, Math.round(dims[1] * 8)), depth = Math.max(1, Math.round(dims[2] * 8));
      const m = new AF.Model(width, height, depth);
      for (let x = 0; x < width; x++) for (let y = 0; y < height; y++) for (let z = 0; z < depth; z++) {
        const ex = (x + 0.5 - width / 2) / (width / 2), ey = (y + 0.5 - height / 2) / (height / 2), ez = (z + 0.5 - depth / 2) / (depth / 2);
        if (kind !== 'leg' && kind !== 'horn' && ex * ex + ey * ey + ez * ez > 1.12) continue;
        if (kind === 'horn' && height > width && (Math.abs(ex) > Math.max(0.25, 1 - y / height * 0.7) || Math.abs(ez) > Math.max(0.25, 1 - y / height * 0.7))) continue;
        let material = color;
        if (kind === 'body' && (y < height * 0.22 || id === 'penguin' && z > depth * 0.55 || id === 'gorilla' && z < depth * 0.35)) material = c.belly;
        if (kind === 'head' && z > depth * 0.65 && y < height * 0.55) material = c.snout;
        if (kind === 'body' || kind === 'neck' || kind === 'head' || kind === 'leg') {
          if (S.pattern === 'stripes' && (z + Math.floor(y * 0.6) + Math.floor(x / 3)) % 4 < 1) material = c.pat;
          if (S.pattern === 'spots' && x % 3 !== 0 && y % 4 !== 0 && z % 4 !== 0 && AF.hash3(x >> 2, y >> 2, z >> 2) < 0.78) material = c.pat;
          if (S.pattern === 'dots' && y > height * 0.6 && AF.hash3(x, y, z) < 0.12) material = c.pat;
          if (S.pattern === 'scutes' && y === height - 1 && z % 2 === 0) material = c.pat;
        }
        if (kind === 'leg' && y === 0) material = c.dark;
        m.set(x, y, z, material);
      }
      const eyes = kind === 'head' ? [[0, Math.max(0, height - 2), Math.floor(depth * 0.6), -1], [width - 1, Math.max(0, height - 2), Math.floor(depth * 0.6), 1]] : null;
      if (eyes) for (const eye of eyes) m.set(eye[0], eye[1], eye[2], c.eye);
      const refined = refine(m, c, eyes);
      if (kind === 'head') {
        const noseZ = refined.d - 1, noseY = Math.max(0, Math.floor(refined.h * 0.4));
        refined.box(Math.floor(refined.w * 0.3), noseY, noseZ, Math.ceil(refined.w * 0.7), noseY + 1, noseZ + 1, c.dark);
        if (id === 'hippo' || id === 'rhino' || id === 'elephant') {
          refined.set(Math.floor(refined.w * 0.3), noseY + 2, noseZ, c.dark); refined.set(Math.floor(refined.w * 0.7), noseY + 2, noseZ, c.dark);
        }
        if (id === 'lion' || id === 'lioness' || id === 'tiger') for (const side of [0, refined.w - 1]) for (let stripe = 0; stripe < 3; stripe++) refined.set(side, Math.max(0, noseY - stripe), Math.max(0, noseZ - 2), c.white);
      }
      if (kind === 'body' && (id === 'elephant' || id === 'rhino' || id === 'hippo')) {
        for (let x = 0; x < refined.w; x++) for (let y = 4; y < refined.h - 2; y += 7) for (let z = 0; z < refined.d; z++) {
          if (refined.get(x, y, z) && (!refined.get(x - 1, y, z) || !refined.get(x + 1, y, z))) refined.set(x, y, z, c.bodyD);
        }
      }
      return AF.meshModel(refined, { vs: 1 / 16, anchor });
    };
    const add = (name, dims, position, parent, anchor = [0.5, 0, 0.5], color = c.body, kind = name, rotation = 0, side = 0) => {
      const part = { name, geo: shape(dims, kind, color, anchor), x: position[0], y: position[1], z: position[2], parent, rotation, side, matrix: new THREE.Matrix4(), mesh: null };
      parts.push(part); return parts.length - 1;
    };
    const body = add('body', [bw, bh, bl], [0, 0, 0], -1);
    const neckBase = id === 'giraffe' || id === 'flamingo' ? bh * 0.7 : id === 'elephant' ? bh * 0.48 : id === 'hippo' || id === 'rhino' || id === 'croc' ? bh * 0.2 : id === 'lion' || id === 'lioness' || id === 'tiger' ? bh * 0.3 : bh * 0.55;
    const neck = add('neck', [S.neck[0] * VS, nh, S.neck[2] * VS], [0, neckBase, bl * 0.34], body);
    const head = add('head', [hw, hh, hl], [0, nh - 0.0625, S.neck[3] * VS], neck, [0.5, 0, 0.15]);
    const jaw = add('jaw', [hw * 0.8, 0.125, hl * 0.7], [0, 0.0625, hl * 0.25], head, [0.5, 1, 0], c.snout, 'jaw');
    if (id === 'hippo') for (const side of [-1, 1]) add('canine', [0.125, 0.375, 0.125], [side * hw * 0.27, -0.0625, hl * 0.45], jaw, [0.5, 0, 0.5], c.ivory, 'horn');
    const legPos = S.legs === 2 ? [[-bw * 0.25, 0], [bw * 0.25, 0]] : [[-bw * 0.35, bl * 0.32], [bw * 0.35, bl * 0.32], [-bw * 0.35, -bl * 0.32], [bw * 0.35, -bl * 0.32]];
    for (let index = 0; index < legPos.length; index++) {
      const length = id === 'gorilla' && index < 2 ? lift + 0.375 : lift;
      const leg = add('leg', [S.legW * VS, length * 0.55, S.legW * VS], [legPos[index][0], id === 'gorilla' && index < 2 ? 0.375 : 0, legPos[index][1]], body, [0.5, 1, 0.5], c.body, 'leg', 0, index);
      const shin = add('shin', [S.legW * VS * 0.8, length * 0.45, S.legW * VS * 0.8], [0, -length * 0.55, 0], leg, [0.5, 1, 0.5], c.body, 'leg', 0, index);
      add('foot', [S.legW * VS * 1.1, 0.125, S.legW * VS * 1.35], [0, -length * 0.45, 0.0625], shin, [0.5, 0, 0.5], id === 'flamingo' ? C(0xde8292) : c.dark, 'foot');
    }
    const tailLength = id === 'croc' ? 2.5 : id === 'monkey' ? 1.3 : id === 'giraffe' ? 0.85 : 0.65;
    const tail = add('tail', [id === 'croc' ? 0.5 : 0.125, 0.125, tailLength * 0.55], [0, bh * 0.55, -bl * 0.45], body, [0.5, 0.5, 1], c.body, 'tail');
    add('tailTip', [id === 'croc' ? 0.25 : 0.125, 0.125, tailLength * 0.45], [0, 0, -tailLength * 0.55], tail, [0.5, 0.5, 1], S.tail ? C(S.tail) : c.body, 'tail');
    for (const side of [-1, 1]) {
      if (id !== 'penguin' && id !== 'flamingo' && id !== 'croc') add('ear', [id === 'elephant' ? 0.25 : 0.1875, id === 'elephant' ? 1.25 : 0.25, id === 'elephant' ? 0.9 : 0.25], [side * hw * 0.48, hh * 0.65, 0.0625], head, [side > 0 ? 0 : 1, 0.75, 0.5], c.body, 'ear', 0, side);
      if (id === 'giraffe' || S.horns || S.antlers) {
        const height = id === 'giraffe' ? 0.25 : S.antlers ? 0.75 : 0.625;
        const horn = add('horn', [0.125, height, 0.125], [side * hw * 0.32, hh - 0.0625, 0.125], head, [0.5, 0, 0.5], c.dark, 'horn');
        if (S.antlers) for (let branch = 1; branch <= 3; branch++) add('antler', [0.375, 0.125, 0.25], [side * 0.125, branch * 0.1875, 0], horn, [0.5, 0, 0.5], c.snout, 'horn');
      }
      if (id === 'penguin' || id === 'flamingo') add('wing', [0.125, id === 'penguin' ? 0.625 : 0.375, 0.375], [side * bw * 0.45, bh * 0.7, 0], body, [0.5, 1, 0.5], c.body, 'wing', 0, side);
      if (id === 'elephant') add('tusk', [0.125, 0.125, 0.75], [side * hw * 0.3, 0.0625, hl * 0.75], head, [0.5, 0.5, 0], c.ivory, 'horn', -0.2);
    }
    if (id === 'elephant') {
      const trunk = add('trunk', [0.375, 1.0, 0.375], [0, hh * 0.35, hl * 0.8], head, [0.5, 1, 0.5]);
      const tip = add('trunkTip', [0.25, 0.75, 0.25], [0, -1, 0], trunk, [0.5, 1, 0.5]);
      add('finger', [0.125, 0.1875, 0.125], [0, -0.75, 0.125], tip, [0.5, 0, 0.5], c.dark);
      const spray = add('spray', [0.125, 0.125, 1], [0, -0.75, 0.125], tip, [0.5, 0.5, 0], C(0xa5dce7), 'spray');
      for (let drop = 0; drop < 5; drop++) add('droplet', [0.125, 0.125, 0.125], [(drop - 2) * 0.125, -drop * 0.125, 0.6 + drop * 0.25], spray, [0.5, 0.5, 0.5], C(0xa5dce7), 'droplet', 0, drop);
    }
    if (id === 'rhino') {
      add('horn', [0.25, 0.625, 0.25], [0, hh * 0.5, hl * 0.75], head, [0.5, 0, 0.5], c.ivory, 'horn', 0.25);
      add('horn', [0.1875, 0.3125, 0.1875], [0, hh * 0.6, hl * 0.45], head, [0.5, 0, 0.5], c.ivory, 'horn');
      for (const z of [-bl * 0.25, bl * 0.25]) add('fold', [bw * 1.02, bh * 0.9, 0.125], [0, 0.0625, z], body, [0.5, 0, 0.5], c.bodyD);
    }
    if (S.maneCol) add('mane', [hw * 1.6, hh * 1.5, 0.5], [0, -hh * 0.2, 0], head, [0.5, 0, 0.5], c.mane);
    if (S.mane || id === 'giraffe') add('crest', [0.125, nh, 0.125], [0, 0, -S.neck[2] * VS * 0.4], neck, [0.5, 0, 0.5], c.dark, 'leg');
    if (S.beak) add('beak', [0.125, 0.125, 0.375], [0, hh * 0.4, hl * 0.8], head, [0.5, 0.5, 0], C(S.beak), 'horn');
    if (id === 'croc') for (let index = 0; index < 9; index++) add('scute', [0.25, 0.125, 0.25], [0, bh - 0.0625, -bl * 0.4 + index * 0.3125], body, [0.5, 0, 0.5], c.pat);
    let height = 0;
    for (const part of parts) {
      part.geo.computeBoundingBox(); part.matrix.makeTranslation(part.x, part.y, part.z);
      if (part.parent >= 0) part.matrix.premultiply(parts[part.parent].matrix);
      const box = part.geo.boundingBox.clone().applyMatrix4(part.matrix);
      height = Math.max(height, lift + box.max.y);
    }
    return { parts, lift, legPos, height, S };
  };

  // ---------------------------------------------------------------- herds: wander inside the habitat, idle, drink; hippos + crocs sink into water
  const Z = AF.zoo = { species: {}, list: [], habitats: HAB, near: false };
  const tmpM = new THREE.Matrix4(), tmpQ = new THREE.Quaternion(), tmpE = new THREE.Euler(), tmpV = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1);
  const frustum = new THREE.Frustum(), viewMatrix = new THREE.Matrix4(), sphere = new THREE.Sphere();
  const inPool = (hab, x, z) => { for (const p of POOLS) if (p.hab === hab && Math.hypot((x - p.cx) / p.rx, (z - p.cz) / p.rz) < 0.85) return p; return null; };
  const random = (an) => { an.seed = (Math.imul(an.seed, 1664525) + 1013904223) >>> 0; return an.seed / 4294967296; };
  const boundX = (an, x) => Math.max(an.rect[0] + an.pad, Math.min(an.rect[2] - an.pad, x));
  const boundZ = (an, z) => Math.max(an.rect[1] + an.pad, Math.min(an.rect[3] - an.pad, z));
  const target = (an, x, z, state, next, duration = 12) => {
    an.tx = boundX(an, x); an.tz = boundZ(an, z); an.state = state; an.next = next; an.timer = duration; an.elapsed = 0;
  };
  const dryTarget = (an) => {
    for (let attempt = 0; attempt < 12; attempt++) {
      an.tx = boundX(an, an.rect[0] + random(an) * (an.rect[2] - an.rect[0]));
      an.tz = boundZ(an, an.rect[1] + random(an) * (an.rect[3] - an.rect[1]));
      if (!inPool(an.hab, an.tx, an.tz) && !AF.solidAt(an.tx, W.groundY(an.tx, an.tz) + 0.75, an.tz)) return;
    }
    an.tx = boundX(an, an.rect[2] - an.pad); an.tz = boundZ(an, an.rect[3] - an.pad);
  };
  const decide = (an, hours) => {
    const id = an.sp.id, H = an.H, roll = random(an), night = hours >= 20 || hours < 6;
    an.elapsed = 0; an.timer = 5 + random(an) * 10; an.next = '';
    if (night && id !== 'hippo' && id !== 'croc') { an.state = 'sleep'; an.timer = 20; return; }
    if (id === 'monkey' && roll < 0.68) {
      an.frame = (an.frame + 1) % H.frames.length;
      const frame = H.frames[an.frame];
      target(an, frame[0], frame[1], 'wander', 'climb', 25); return;
    }
    if (id === 'penguin' && roll < 0.6 || id === 'hippo' && !night && roll < 0.78) {
      target(an, H.pool.cx, H.pool.cz, id === 'penguin' ? 'waddle' : 'wander', 'dive', 35); return;
    }
    if ((id === 'lion' || id === 'lioness') && roll < 0.78 || id === 'croc' && roll < 0.65 || id === 'bear' && roll < 0.35 || id === 'gorilla' && roll < 0.4) {
      target(an, H.entry[0], H.entry[1], 'wander', id.startsWith('lion') ? 'ascend' : 'rest', 30); return;
    }
    if (id === 'giraffe' && roll < 0.5) {
      target(an, H.browse[0] + 1.5, H.browse[1], 'wander', 'browse', 30); return;
    }
    if (H.pool && roll < 0.35 && H.id !== 'primates') {
      const pool = H.pool, angle = random(an) * PI * 2;
      target(an, pool.cx + Math.sin(angle) * pool.rx * 0.95, pool.cz + Math.cos(angle) * pool.rz * 0.95, 'wander', id === 'elephant' && random(an) < 0.65 ? 'spray' : 'drink', 30); return;
    }
    if (an.leader && roll < 0.7) {
      target(an, an.leader.x + an.fl, an.leader.z + an.fb, 'follow', 'graze', 15); return;
    }
    dryTarget(an); an.state = id === 'penguin' ? 'waddle' : 'wander';
    an.next = id === 'giraffe' || id === 'zebra' || id === 'antelope' || id === 'deer' || id === 'stag' || id === 'rhino' || id === 'hippo' || id === 'elephant' || id === 'flamingo' ? 'graze' : 'rest'; an.timer = 25;
  };
  AF.onBuild('zoo-animals', 640, () => {
    const R = AF.rng(2026);
    for (const H of HAB) for (const [id, n] of H.animals) {
      let sp = Z.species[id];
      if (!sp) {
        const G = makeGeo(id);
        sp = Z.species[id] = { id, G, meshes: [], list: [] };
        const cache = new Map();
        for (const part of G.parts) {
          const key = part.name + ':' + part.geo.boundingBox.min.toArray().join(',') + ':' + part.geo.boundingBox.max.toArray().join(',');
          let mesh = cache.get(key);
          if (!mesh) {
            mesh = new THREE.InstancedMesh(part.geo, AF.mat.voxel, 128);
            mesh.castShadow = true; mesh.receiveShadow = true; mesh.frustumCulled = false; mesh.count = 0;
            mesh.name = 'zoo:' + id + ':' + part.name; mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
            cache.set(key, mesh); sp.meshes.push(mesh); AF.scene.add(mesh);
          } else part.geo.dispose();
          part.mesh = mesh;
        }
      }
      const [a, b, c, d] = H.rect;
      let leader = null;
      for (let k = 0; k < n; k++) {
        const pad = H.id === 'primates' ? 6 : 4.5;
        const x = a + pad + R() * (c - a - pad * 2), z = b + pad + R() * (d - b - pad * 2);
        const an = { sp, H, hab: H.id, rect: H.rect, pad, x, z, y: W.groundY(x, z), yaw: R() * PI * 2, tx: x, tz: z,
          phase: R() * 6, clock: R() * 20, v: 0, scale: id === 'giraffe' ? 0.94 + R() * 0.06 : 0.92 + R() * 0.08,
          state: 'wander', next: 'graze', timer: 25, elapsed: 0, seed: (R() * 4294967296) >>> 0, leader,
          fl: (k % 2 ? -1 : 1) * (2 + k * 0.6), fb: -2 - k * 1.5, frame: k % H.frames.length,
          elevation: 0, sx: x, sz: z, sy: 0, acc: 0, floorAcc: 0, cooldown: 5 + k, attention: 0, pose: 0, wet: false };
        if (!leader) leader = an;
        dryTarget(an); an.x = an.tx; an.z = an.tz; an.y = W.groundY(an.x, an.z);
        if (id === 'penguin') { an.x = a + pad + k * 2.4; an.z = d - pad - 3; }
        if (id === 'giraffe' && k === 0) { an.x = H.browse[0] + 1.5; an.z = H.browse[1]; an.state = 'browse'; an.timer = 8; }
        if (id === 'lion' || id === 'lioness') { an.x = H.rest[0] + (k - 0.5) * 1.5; an.z = H.rest[1]; an.y = 1; an.state = 'rest'; an.timer = 8 + k * 5; }
        sp.list.push(an); Z.list.push(an);
      }
    }
  });
  const stepAnimal = Z.stepAnimal = (an, dt, hours, player) => {
    const id = an.sp.id, S = an.sp.G.S, H = an.H, night = hours >= 20 || hours < 6;
    an.clock += dt; an.elapsed += dt; an.timer -= dt; an.cooldown -= dt; an.floorAcc += dt;
    if (night && id !== 'hippo' && id !== 'croc' && an.state !== 'sleep') { an.state = 'sleep'; an.timer = 20; }
    if (an.state === 'sleep' && !night) decide(an, hours);
    if (player && player.y < 8 && !night && an.cooldown <= 0 && an.state !== 'swim' && an.state !== 'jump') {
      const bx = H.side === 'e' ? H.rect[2] : H.rect[0];
      if (Math.abs(player.x - bx) < 8 && player.z > H.rect[1] && player.z < H.rect[3] && (player.x < H.rect[0] || player.x > H.rect[2])) {
        an.attention = Math.atan2(player.x - an.x, player.z - an.z);
        target(an, H.side === 'e' ? H.rect[2] - an.pad : H.rect[0] + an.pad, player.z, 'approach', 'watch', 14);
        an.cooldown = 24;
      }
    }
    if (an.timer <= 0) {
      if (an.state === 'climb') {
        const frame = H.frames[(an.frame + 1) % H.frames.length];
        an.sx = an.x; an.sz = an.z; an.sy = an.elevation; an.frame = (an.frame + 1) % H.frames.length;
        target(an, frame[0], frame[1], 'jump', 'rest', 2.4);
      } else if (an.state === 'jump') { an.state = 'rest'; an.timer = 3; an.elapsed = 0; }
      else if (an.state === 'dive') { an.state = 'swim'; an.timer = 12; an.elapsed = 0; }
      else if (an.state === 'swim') { dryTarget(an); an.state = 'waddle'; an.next = 'rest'; an.timer = 35; an.elapsed = 0; }
      else decide(an, hours);
    }
    if (an.state === 'follow') { an.tx = boundX(an, an.leader.x + an.fl); an.tz = boundZ(an, an.leader.z + an.fb); }
    const moving = an.state === 'wander' || an.state === 'follow' || an.state === 'approach' || an.state === 'waddle' || an.state === 'swim';
    if (an.state === 'swim') {
      const pool = H.pool, angle = an.clock * (id === 'penguin' ? 0.5 : 0.12) + an.phase * 0.01;
      an.tx = boundX(an, pool.cx + Math.sin(angle) * pool.rx * 0.65); an.tz = boundZ(an, pool.cz + Math.cos(angle) * pool.rz * 0.65);
    }
    if (moving) {
      const dx = an.tx - an.x, dz = an.tz - an.z, distance = Math.hypot(dx, dz);
      if (distance < 0.45 && an.state !== 'swim' && an.state !== 'follow') {
        an.state = an.next || 'rest'; an.timer = an.state === 'rest' && (id === 'lion' || id === 'lioness') ? 28 : an.state === 'climb' ? 6 : an.state === 'dive' ? 1.5 : 6 + random(an) * 8;
        an.elapsed = 0; an.v = 0;
      } else {
        const speed = an.state === 'swim' && id === 'penguin' ? 2.2 : S.speed;
        an.v = Math.min(speed, an.v + dt * 1.5);
        const heading = Math.atan2(dx, dz);
        an.yaw += AF.angDiff(an.yaw, heading) * Math.min(1, dt * 3);
        const travel = Math.min(distance, an.v * dt) * Math.max(0, Math.cos(AF.angDiff(an.yaw, heading)));
        const nx = boundX(an, an.x + Math.sin(an.yaw) * travel), nz = boundZ(an, an.z + Math.cos(an.yaw) * travel);
        const pool = inPool(an.hab, nx, nz);
        const aquatic = id === 'hippo' || id === 'croc' || id === 'flamingo' || id === 'elephant' || id === 'penguin' || id === 'bear' || id === 'tiger';
        if (pool && !aquatic || !pool && an.elevation < 0.1 && AF.solidAt(nx, an.y + 0.65, nz)) { dryTarget(an); an.state = 'wander'; an.timer = 25; }
        else { an.x = nx; an.z = nz; }
      }
    } else an.v = Math.max(0, an.v - dt * 3);
    if (an.state === 'climb') {
      const frame = H.frames[an.frame]; an.elevation += (frame[2] - an.elevation) * Math.min(1, dt * 1.1);
    } else if (an.state === 'jump') {
      const amount = Math.min(1, an.elapsed / 2.4), frame = H.frames[an.frame];
      an.x = boundX(an, an.sx + (an.tx - an.sx) * amount); an.z = boundZ(an, an.sz + (an.tz - an.sz) * amount);
      an.elevation = an.sy + (frame[2] - an.sy) * amount + Math.sin(amount * PI) * 1.6;
      an.yaw = Math.atan2(an.tx - an.sx, an.tz - an.sz);
    } else if (an.state !== 'rest' || id !== 'monkey') an.elevation = Math.max(0, an.elevation - dt * 1.8);
    an.x = boundX(an, an.x); an.z = boundZ(an, an.z);
    if (an.state === 'ascend') target(an, H.rest[0], H.rest[1], 'wander', 'rest', 15);
    an.phase += dt * an.v * (4.5 / Math.max(0.5, an.sp.G.lift));
    const wet = inPool(an.hab, an.x, an.z); an.wet = !!wet;
    if (an.floorAcc >= 0.3) {
      an.floorAcc = 0;
      an.y = wet ? wet.y : H.id === 'primates' ? W.groundY(an.x, an.z) : AF.surfaceBelow(an.x, an.z, Math.max(W.groundY(an.x, an.z) + 1.2, an.y + 0.75), 3);
      if (!Number.isFinite(an.y)) an.y = W.groundY(an.x, an.z);
    }
    const submerge = an.state === 'dive' || an.state === 'swim';
    const lower = submerge && wet ? -an.sp.G.lift - (id === 'penguin' ? 0.45 : 0.4) : wet && (id === 'hippo' || id === 'croc') ? -an.sp.G.lift * 0.9 : 0;
    an.pose += (lower - an.pose) * Math.min(1, dt * 2);
    if (an.state === 'watch') an.attention = player ? Math.atan2(player.x - an.x, player.z - an.z) : an.yaw;
  };
  const renderAnimal = (an, detail) => {
    const G = an.sp.G, id = an.sp.id, state = an.state, resting = state === 'rest' || state === 'sleep';
    const swimming = state === 'swim' || state === 'dive', gait = Math.sin(an.phase) * 0.55 * Math.min(1, an.v / G.S.speed);
    const rootY = an.y + an.elevation + (G.lift + an.pose - (resting ? G.lift * 0.72 : 0)) * an.scale;
    tmpE.set(swimming && id === 'penguin' ? PI / 2 : 0, an.yaw, id === 'penguin' && !swimming ? Math.sin(an.phase) * 0.08 * an.v : 0);
    tmpQ.setFromEuler(tmpE); tmpM.compose(tmpV.set(an.x, rootY, an.z), tmpQ, one.set(an.scale, an.scale, an.scale));
    for (const part of G.parts) {
      let rx = part.rotation, ry = 0, rz = 0;
      const name = part.name;
      if (name === 'leg') { rx += (part.side === 0 || part.side === 3 ? 1 : -1) * gait; if (resting) rx += 1.3; if (state === 'climb' || state === 'jump') rx += part.side < 2 ? -1.5 : 0.8; }
      if (name === 'shin') rx += Math.max(0, Math.sin(an.phase + (part.side % 2 ? PI : 0))) * 0.3 * Math.min(1, an.v);
      if (name === 'neck') rx += state === 'browse' ? -0.22 : state === 'graze' ? id === 'giraffe' ? 1.8 : 0.9 : state === 'drink' ? id === 'giraffe' ? 2.5 : 1.15 : resting ? 0.3 : Math.sin(an.clock * 0.9) * 0.035;
      if (name === 'head') { rx += Math.sin(an.clock * 1.8) * 0.05; if (state === 'watch' || state === 'approach') ry = Math.max(-0.8, Math.min(0.8, AF.angDiff(an.yaw, an.attention))); }
      if (name === 'jaw') rx = resting && id.startsWith('lion') ? Math.max(0, Math.sin(an.clock * 0.28)) * 0.7 : state === 'graze' || state === 'browse' ? (0.5 + Math.sin(an.clock * 5) * 0.5) * 0.18 : 0;
      if (name === 'tail' || name === 'tailTip') { ry = Math.sin(an.clock * 1.7 + (name === 'tailTip' ? 0.7 : 0)) * 0.3; rx = id === 'monkey' ? -0.9 : id === 'giraffe' ? -0.6 : -0.12; }
      if (name === 'ear') rz = part.side * (id === 'elephant' ? Math.sin(an.clock * 2.5) * 0.4 : Math.sin(an.clock * 1.4) * 0.09);
      if (name === 'trunk') rx = state === 'spray' ? -1.5 : state === 'drink' ? 0.15 : Math.sin(an.clock * 1.2) * 0.18;
      if (name === 'trunkTip') rx = state === 'spray' ? -0.8 : Math.sin(an.clock * 1.2 + 0.6) * 0.3;
      if (name === 'wing') rz = part.side * (swimming ? 0.6 + Math.sin(an.clock * 8) * 0.6 : 0.08);
      tmpE.set(rx, ry, rz); tmpQ.setFromEuler(tmpE);
      const dropY = name === 'droplet' ? ((an.clock * 1.6 + part.side * 0.19) % 1) * 0.35 : 0;
      part.matrix.compose(tmpV.set(part.x, part.y - dropY, part.z), tmpQ, one.set(1, 1, name === 'spray' ? 0.75 + Math.sin(an.clock * 8) * 0.25 : 1));
      part.matrix.premultiply(part.parent < 0 ? tmpM : G.parts[part.parent].matrix);
      if ((name === 'spray' || name === 'droplet') && state !== 'spray') continue;
      if (!detail && (name === 'jaw' || name === 'ear' || name === 'antler' || name === 'droplet' || name === 'finger' || name === 'scute' || name === 'fold')) continue;
      const mesh = part.mesh; mesh.setMatrixAt(mesh.count++, part.matrix);
    }
  };
  AF.onTick('zoo', 430, (dt) => {
    if (!Z.list.length) return;
    const cp = AF.camera.position, low = AF.GFX && AF.GFX.tier === 'low', limit = low ? 120 : 150;
    viewMatrix.multiplyMatrices(AF.camera.projectionMatrix, AF.camera.matrixWorldInverse); frustum.setFromProjectionMatrix(viewMatrix);
    Z.near = false;
    for (const id in Z.species) for (const mesh of Z.species[id].meshes) mesh.count = 0;
    for (const an of Z.list) {
      const dx = cp.x - an.x, dz = cp.z - an.z, distance = dx * dx + dz * dz;
      sphere.center.set(an.x, an.y + an.elevation + an.sp.G.height * 0.5, an.z); sphere.radius = Math.max(2.5, an.sp.G.height);
      if (distance > limit * limit || !frustum.intersectsSphere(sphere)) { an.acc = 0; continue; }
      Z.near = true; an.acc += dt;
      const interval = distance < 2500 ? 0 : distance < 10000 ? 0.2 : 0.5;
      if (an.acc >= interval) { stepAnimal(an, Math.min(an.acc, 0.5), AF.time ? AF.time.hours : 12, cp); an.acc = 0; }
      renderAnimal(an, distance < (low ? 1600 : 5625));
    }
    for (const id in Z.species) for (const mesh of Z.species[id].meshes) { mesh.visible = mesh.count > 0; if (mesh.visible) mesh.instanceMatrix.needsUpdate = true; }
  });
  AF.test('zoo: giraffes stand at least 4.5 metres tall', () => {
    const sp = Z.species.giraffe;
    const height = sp ? Math.min(...sp.list.map((an) => sp.G.height * an.scale)) : 0;
    return { ok: height >= 4.5 && height <= 5.5, info: 'standing height ' + height.toFixed(2) + ' m' };
  });
  AF.test('zoo: every habitat populated and inside its footprint', () => ({
    ok: HAB.every((H) => Z.list.some((an) => an.hab === H.id) && H.rect[0] > ZOO.x0 && H.rect[2] < ZOO.x1 && H.rect[1] > ZOO.z0 && H.rect[3] < ZOO.z1),
    info: HAB.length + ' habitats, ' + Z.list.length + ' animals'
  }));
  AF.test('zoo: simulated herds move and stay inside their habitat bounds', () => {
    let moved = 0, inside = true;
    for (const original of Z.list) {
      const an = Object.assign({}, original, { state: 'wander', next: 'graze', timer: 25, v: 0, floorAcc: 0 });
      an.leader = null; an.tx = boundX(an, original.x + (original.x < (an.rect[0] + an.rect[2]) / 2 ? 5 : -5)); an.tz = boundZ(an, original.z + 3);
      for (let frame = 0; frame < 300; frame++) {
        stepAnimal(an, 0.1, 12, null);
        if (an.x < an.rect[0] + an.pad || an.x > an.rect[2] - an.pad || an.z < an.rect[1] + an.pad || an.z > an.rect[3] - an.pad || !Number.isFinite(an.y)) inside = false;
      }
      if (Math.hypot(an.x - original.x, an.z - original.z) > 0.2) moved++;
    }
    return { ok: inside && moved >= Z.list.length * 0.8, info: moved + '/' + Z.list.length + ' moved; bounded ' + inside };
  });
  AF.test('zoo: species actions and night sleep use articulated parts', () => {
    const elephant = Z.list.find((an) => an.sp.id === 'elephant'), penguin = Z.list.find((an) => an.sp.id === 'penguin'), monkey = Z.list.find((an) => an.sp.id === 'monkey');
    if (!elephant || !penguin || !monkey) return { ok: false, info: 'missing species' };
    const sleeper = Object.assign({}, elephant); stepAnimal(sleeper, 0.1, 23, null);
    const diver = Object.assign({}, penguin, { state: 'dive', timer: 0 }); stepAnimal(diver, 0.1, 12, null);
    const climber = Object.assign({}, monkey, { state: 'climb', timer: 0 }); stepAnimal(climber, 0.1, 12, null);
    return { ok: sleeper.state === 'sleep' && diver.state === 'swim' && climber.state === 'jump' && elephant.sp.G.parts.some((p) => p.name === 'trunkTip'), info: 'sleep, dive, jump, jointed trunk' };
  });
  // keepers
  AF.onBuild('zoo-keepers', 825, () => {
    if (!AF.npc) return;
    const keeper = (skin, hair, female) => ({ skin, hair, hairStyle: female ? 'pony' : 'short', female, top: { col: 0x5a6a3a, col2: 0xe8dcc0, style: 'shirt' }, bottom: { col: female ? 0x6a5a3a : 0x6a5a3a, style: 'shorts' }, shoe: 0x4a3020, hat: 'cap', hatCol: 0x6a7a3a, height: female ? 0.97 : 1.02 });
    AF.npc.spawn({ id: 'keeper-rosa', name: 'Rosa', role: 'Head keeper', look: keeper(0xd9a07a, 0x2a1a12, true), x: -544, y: 0.25, z: -150, yaw: PI,
      greet: ['Welcome to Solace Zoo!', 'Mind the flamingos, they\u2019re dramatic.', 'The hippos are awake!'],
      lines: [['Welcome to Solace Zoo! Twelve habitats, one very tired keeper.', 'The savannah\u2019s straight ahead on your left. The elephants are the big grey ones.'], ['The hippos look lazy, but don\u2019t race one.', 'They\u2019ll win. Every time.'], ['The crocodiles haven\u2019t moved since Tuesday.', 'We check. Every day. Still Tuesday.']] });
    AF.npc.spawn({ id: 'keeper-otis', name: 'Otis', role: 'Big cat keeper', look: keeper(0xa87050, 0x1a120c, false), x: -500, y: 0.25, z: -86, yaw: -PI / 2,
      greet: ['Lions are napping. As usual.', 'Hey there!', 'The tigers love the stream.'],
      lines: [['That\u2019s Pride Rock. The big one with the mane is Leo.', 'He thinks he runs the place. He does.'], ['Tigers are the only big cats that love a swim.', 'Watch the stream at feeding time.']] });
  });
}

} catch (e) { AF.partError('46-zoo.js', e); }
