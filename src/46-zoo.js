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
    const [x0, z0, x1, z1] = [ZOO.x0, ZOO.z0, ZOO.x1, ZOO.z1];
    // lawn everywhere, then paths
    W.eachCol(x0, z0, x1, z1, (bx, bz, i, x, z) => { W.C[i] = col(AF.noise2(x * 0.08, z * 0.08) < 0.5 ? 0x6f9a3e : 0x7da646, { jitter: 0.9 }); });
    // ADVENTURE WALKS: irregular flagstones (jittered Voronoi cells, dark grout, the odd pebble) whose stone set, size and moss change by
    // zone \u2014 sun-baked sandstone by the savanna, ember clay at the big cats, river-grey by the wetlands, mossy slate in the woods
    const SETS = {
      sand: [0xd2bc94, 0xc4aa80, 0xdac8a2, 0xbca07a, 0xcab28a, 0xe0d0ac], ember: [0xc8a07c, 0xd0aa86, 0xb89070, 0xd8b690, 0xbe9676, 0xdcc09c],
      river: [0xa8aca6, 0x9ca2a0, 0xb4b8b0, 0x94999a, 0xaeb0a6, 0xc0c2b8], moss: [0x9c9a84, 0xa8a48e, 0x90947c, 0xb0ac94, 0x8a927a, 0xb8b29a],
    };
    const SP = {}; for (const k in SETS) SP[k] = SETS[k].map((h) => col(h, { pat: 'none', jitter: 0.35, edge: 0.2 }));
    const groutC = { sand: col(0x9a8664, { jitter: 0.5 }), ember: col(0x8e6e52, { jitter: 0.5 }), river: col(0x747a76, { jitter: 0.5 }), moss: col(0x6a7a52, { jitter: 0.6 }) };
    const pebW = col(0xe6dfcc, { jitter: 0.2 }), pebD = col(0x6a6254, { jitter: 0.2 }), mossC = col(0x6f8a48, { jitter: 0.7 });
    const zoneAt = (x, z) => z < -150 ? (x < -560 ? 'river' : 'moss') : x < -560 ? 'sand' : x < -515 ? 'ember' : x < -490 ? 'moss' : 'river';
    const h2 = AF.hash2;
    const pave = SP.sand[0], paveD = SP.sand[1];
    const isPave = new Set(Object.values(SP).flat().concat(Object.values(groutC), [pebW, pebD, mossC]));
    const path = (a, b, c, d) => W.eachCol(a, b, c, d, (bx, bz, i, x, z) => {
      const zone = zoneAt(x, z), P2 = SP[zone], cs = zone === 'ember' ? 1.35 : zone === 'river' ? 0.95 : zone === 'moss' ? 1.2 : 1.1;
      const gx = x / cs, gz = z / cs, ix = Math.floor(gx), iz = Math.floor(gz);
      let d1 = 9, d2 = 9, id = 0;
      for (let u = -1; u <= 1; u++) for (let v = -1; v <= 1; v++) {
        const cx = ix + u, cz = iz + v, px = cx + 0.15 + h2(cx, cz) * 0.7, pz = cz + 0.15 + h2(cz + 91, cx - 37) * 0.7;
        const dd = (gx - px) * (gx - px) + (gz - pz) * (gz - pz);
        if (dd < d1) { d2 = d1; d1 = dd; id = cx * 7919 + cz; } else if (dd < d2) d2 = dd;
      }
      const edge = Math.sqrt(d2) - Math.sqrt(d1), q = h2(bx, bz);
      if (edge < 0.11 * (1.1 / cs)) { W.C[i] = zone === 'moss' && q < 0.45 ? mossC : groutC[zone]; return; }
      W.C[i] = q < 0.006 ? pebW : q < 0.012 ? pebD : P2[Math.floor(h2(id, 5) * P2.length) % P2.length];
    });
    // paw-print trails in darker stone: [x, z0, z1, kind] along the walks beside the animals that made them
    const prints = (x, zA, zB, kind, step) => {
      const dark = pebD;
      for (let z = zA, k = 0; z > zB; z -= step, k++) {
        const px = x + (k & 1 ? 0.35 : -0.35);
        const dot = (ox, oz, r) => W.eachCol(px + ox - r, z + oz - r, px + ox + r, z + oz + r, (bx, bz, i, xx, zz) => { if (Math.hypot(xx - px - ox, zz - z - oz) < r) W.C[i] = dark; });
        if (kind === 'cat') { dot(0, 0, 0.22); for (const [ox, oz] of [[-0.2, -0.3], [-0.07, -0.38], [0.07, -0.38], [0.2, -0.3]]) dot(ox, oz, 0.09); }
        else if (kind === 'elephant') dot(0, 0, 0.45);
        else if (kind === 'bird') { for (const [ox, oz] of [[0, -0.25], [-0.18, -0.2], [0.18, -0.2], [0, 0]]) dot(ox, oz, 0.07); }
        else { dot(-0.1, 0, 0.12); dot(0.1, 0, 0.12); }
      }
    };
    path(-553, -282, -539, -8);   // the promenade, from the gate to the north wall
    path(-640, -165, -454, -158.5); path(-640, -148, -454, -141.5);   // the two riverside walks (the Solace Brook runs between them)
    path(-560, -148, -553, -26); path(-494, -150, -486, -26); path(-494, -282, -486, -160); path(-602, -282, -594, -160); path(-560, -282, -553, -160);
    path(-553, -30, -454, -22);   // along the south habitats
    path(-603.5, -146, -594.5, -26); path(-640, -88.5, -562, -81.5); path(-640, -29, -553, -22);   // between the four plains enclosures + the south walk
    prints(-541.5, -96, -136, 'cat', 1.4); prints(-599, -40, -136, 'elephant', 1.9); prints(-490, -36, -86, 'bird', 0.9);
    prints(-556.5, -172, -216, 'bird', 0.8); prints(-490, -172, -272, 'hoof', 1.1); prints(-546, -250, -276, 'cat', 1.4);
    // perimeter wall with the gate on the promenade
    const wall = (a, b, c, d) => { W.fill(a, 0.25, b, c, 2.75, d, stoneW); W.fill(Math.max(x0, a - 0.25), 2.75, Math.max(z0, b - 0.25), Math.min(x1, c + 0.25), 3.0, Math.min(z1, d + 0.25), cap); };
    wall(x0, z0, x1, z0 + 0.5); wall(x0, z0, x0 + 0.5, z1); wall(x1 - 0.5, z0, x1, z1);
    wall(x0, z1 - 0.5, -556, z1); wall(-536, z1 - 0.5, x1, z1);
    // the gate: two deco pylons + an arch with the name, a ticket kiosk
    for (const gx of [-557, -537]) { W.fill(gx, 0.25, z1 - 2, gx + 2, 8, z1 - 0.5, col(0xf2ece0, { pat: 'stone' })); W.fill(gx - 0.25, 8, z1 - 2.25, gx + 2.25, 8.5, z1 - 0.25, col(0x2f6a4a)); W.fill(gx + 0.5, 8.5, z1 - 1.5, gx + 1.5, 9.25, z1 - 0.5, glow(0xffe0a0, 2.2, 'night')); }
    W.fill(-555, 6.5, z1 - 2, -537, 7.5, z1 - 1, col(0x2f6a4a));
    const g = K().text('SOLACE ZOO', 0xffe9b0, { font: 'deco', vs: 1 / 9, k: 2.2 });
    AF.placeStatic(g, -546, 6.55, z1 - 0.95, 0, { collide: false }); AF.placeStatic(g, -546, 6.55, z1 - 2.05, 2, { collide: false });
    // ticket booth on the forecourt OUTSIDE the wall, window facing the gate
    W.fill(-535, 0.25, z1 + 0.5, -531, 3, z1 + 4, col(0xe8dcc0, { pat: 'stucco' })); W.fill(-535.25, 3, z1 + 0.25, -530.75, 3.5, z1 + 4.25, col(0xc0392b)); W.fill(-535.1, 1.25, z1 + 1.25, -535, 2.25, z1 + 3.25, col(0xa9c9d6, { glass: true }));
    W.fill(-535.35, 1.0, z1 + 1.0, -535, 1.25, z1 + 3.5, col(0x8a5a36));
    for (const gx of [-556, -536]) AF.addLight({ x: gx, y: 9, z: z1, color: 0xffe0a0, intensity: 1, range: 12, kind: 'street' });
    // turnstile posts across the gate (the arms are a live mesh that swings open with a ticket, see zoo-gate below)
    for (const tx of [-555, -551, -547, -543, -539]) { W.fill(tx, 0.25, z1 - 2.25, tx + 0.5, 1.25, z1 - 1.75, col(0x2f6a4a)); W.fill(tx - 0.125, 1.25, z1 - 2.375, tx + 0.625, 1.5, z1 - 1.625, col(0xd8b84a, { metal: 0.8, rough: 0.3 })); }
    W.fill(-535.25, 2.3, z1 + 0.75, -535, 2.95, z1 + 3.75, col(0xf2ead0));
    const fitTextG = (str, hex, maxW) => { const w = AF.textModel(str, 1, { font: 'deco', depth: 1, pad: 0 }).w || 1; return K().text(str, hex, { lit: false, font: 'deco', pad: 0, vs: Math.min(1 / 16, maxW / w) }); };
    AF.placeStatic(fitTextG('TICKETS 25\u00a2', 0xc0392b, 2.8), -535.3, 2.38, z1 + 2.25, 3, { collide: false });
    AF.addBuilding({ id: 'zoo', name: 'Solace Zoo', kind: 'zoo', box: [x0, 0, z0, x1, 3, z1], doors: [{ x: -546, y: 0.25, z: z1 - 2, yaw: PI }], interior: false, owner: 'west', label: true });
    // lamp posts along the promenade
    for (let z = -40; z > -280; z -= 24) for (const x of [-554, -538]) { W.fill(x, 0.25, z, x + 0.25, 4, z + 0.25, iron); W.fill(x - 0.25, 4, z - 0.25, x + 0.5, 4.5, z + 0.5, glow(0xfff0c8, 2.6, 'night')); AF.addLight({ x: x + 0.1, y: 4.3, z: z + 0.1, color: 0xffe0b0, intensity: 0.8, range: 10, kind: 'street' }); }
    // ---- enclosures: ground, a knee-high stone wall + open railing (you look OVER it), a name board on the path side
    const rail = col(0x2f4a3a, { metal: 0.6, rough: 0.45 }), boardC = col(0x2f6a4a), paper = col(0xf2ead0, { jitter: 0.05 });
    const glassV = col(0xbcd6dc, { glass: true, jitter: 0.03, edge: 0, rough: 0.08 }), post = col(0x33403a, { metal: 0.7, rough: 0.35, jitter: 0.1 });
    const kerb = [col(0x8a8272, { jitter: 0.6 }), col(0x9c9282, { jitter: 0.6 }), col(0x7a7264, { jitter: 0.6 })];
    const fitText = (str, hex, maxW, font) => { const o = { font, depth: 1, pad: 0 }; const w = AF.textModel(str, 1, o).w || 1; return K().text(str, hex, { lit: false, font, pad: 0, vs: Math.min(1 / 16, maxW / w) }); };
    const spot = (x, z, yaw, kind) => AF.addSpot && AF.addSpot({ building: 'zoo', x, y: 0.25, z, yaw, kind });
    for (const H of HAB) {
      const [a, b, c, d] = H.rect, gc = H.ground.map((h) => col(h, { jitter: 0.9 }));
      W.eachCol(a, b, c, d, (bx, bz, i, x, z) => { const n = AF.noise2(x * 0.12, z * 0.12); W.C[i] = gc[n < 0.4 ? 0 : n < 0.7 ? 1 : 2]; });
      // viewing glass all round: a low natural rock kerb, clear panels to 2.75 m, slim posts every 4 m \u2014 nothing at eye level
      const pane = (p, q, r, s, alongX) => {
        W.fill(p, 0.5, q, r, 2.75, s, glassV);
        if (alongX) for (let x = p; x <= r - 0.25; x += 4) W.fill(x, 0.25, q, x + 0.25, 3.0, s, post);
        else for (let z = q; z <= s - 0.25; z += 4) W.fill(p, 0.25, z, r, 3.0, z + 0.25, post);
      };
      for (const [p, q, r, s] of [[a - 0.5, b - 0.5, c + 0.5, b], [a - 0.5, d, c + 0.5, d + 0.5], [a - 0.5, b, a, d], [c, b, c + 0.5, d]])
        W.eachCol(p, q, r, s, (bx, bz, i, x, z) => { const hq = AF.hash2(bx >> 1, bz >> 1); W.fill(x - 0.125, 0.25, z - 0.125, x + 0.125, hq < 0.35 ? 0.75 : 0.5, z + 0.125, kerb[(hq * 7 | 0) % 3]); });
      pane(a - 0.5, b - 0.25, c + 0.5, b, true); pane(a - 0.5, d, c + 0.5, d + 0.25, true); pane(a - 0.25, b, a, d, false); pane(c, b, c + 0.25, d, false);
      for (const [px, pz] of [[a - 0.25, b - 0.25], [c, b - 0.25], [a - 0.25, d], [c, d]]) W.fill(px, 0.25, pz, px + 0.25, 3.0, pz + 0.25, post);
      // gentle mounds inside (never within 2.5 m of the glass): animals walk the contours
      W.eachCol(a + 2.5, b + 2.5, c - 2.5, d - 2.5, (bx, bz, i, x, z) => { const m = AF.fbm2(x * 0.055 + 3, z * 0.055 - 7, 3), e = Math.min(x - a - 2.5, c - 2.5 - x, z - b - 2.5, d - 2.5 - z); W.H[i] = 1 + Math.max(0, Math.min(3, Math.round((m - 0.47) * 10 * Math.min(1, e / 4)))); });
      // the board: a slanted lectern on the path side, name in raised letters, facts on interact
      const east = H.side === 'e', bx0 = east ? c + 1.4 : a - 1.4, bz0 = (b + d) / 2, face = east ? 1 : 3, fx = east ? 1 : -1;
      W.fill(bx0 - 0.125, 0.25, bz0 - 0.125, bx0 + 0.125, 1.25, bz0 + 0.125, boardC);
      W.fill(Math.min(bx0, bx0 + fx * 0.25), 1.25, bz0 - 1.1, Math.max(bx0, bx0 + fx * 0.25), 2.25, bz0 + 1.1, boardC);
      W.fill(Math.min(bx0 + fx * 0.25, bx0 + fx * 0.5), 1.35, bz0 - 1.0, Math.max(bx0 + fx * 0.25, bx0 + fx * 0.5), 2.15, bz0 + 1.0, paper);
      // letters stand 4 cm proud of the paper's grid-snapped face
      const paperX = Math.round((bx0 + fx * 0.5) * 4) / 4 + fx * 0.045;
      AF.placeStatic(fitText(H.name.toUpperCase(), 0x2f4a3a, 2.0, 'deco'), paperX, 1.8, bz0, face, { collide: false });
      AF.placeStatic(fitText(H.animals.map((q) => q[0]).join(' \u00b7 '), 0x6a4a2a, 1.6), paperX, 1.5, bz0, face, { collide: false });
      AF.addInteract({ x: bx0 + fx * 1.2, y: 1.2, z: bz0, r: 2.2, label: 'Read: ' + H.name, act: () => AF.emit('dialogue', { name: H.name, role: 'Solace Zoo', lines: H.sign }) });
      AF.addLabel(H.name, (a + c) / 2, (b + d) / 2, 'place');
      // onlookers lean on the rail along the path side (the crowd's instanced extras fill these)
      const rx = east ? c + 1.1 : a - 1.1, ryaw = east ? -PI / 2 : PI / 2;
      for (let z = b + 4; z < d - 3; z += 7) if (Math.abs(z - bz0) > 2.5) spot(rx, z + (AF.hash2(z | 0, a | 0) - 0.5), ryaw, 'stand');
      // planting along the outside of the wall (kept off the paths)
      const hed = [col(0x4f8a3a, { jitter: 0.7, solid: false }), col(0x6aa84a, { jitter: 0.7, solid: false }), col(0xd8502a, { jitter: 0.4, solid: false }), col(0xf0d040, { jitter: 0.4, solid: false })];
      const ox = east ? a - 1.25 : c + 0.75;
      for (let z = b + 1; z < d - 1; z += 0.5) { const q = AF.hash2((z * 4) | 0, (ox * 4) | 0), ci = W.col(ox + 0.25, z + 0.25); if (ci < 0 || isPave.has(W.C[ci])) continue; if (q < 0.55) W.fill(ox, 0.25, z, ox + 0.5, 0.5 + (q < 0.2 ? 0.25 : 0), z + 0.5, hed[q < 0.12 ? 2 : q < 0.2 ? 3 : q < 0.4 ? 0 : 1]); }
    }
    // ---- water: ponds per habitat
    const pondGeos = new Map();
    const collectPond = (geo) => {
      const y = geo.userData.waterY;
      if (!pondGeos.has(y)) pondGeos.set(y, []);
      pondGeos.get(y).push(geo);
    };
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
      collectPond(geo);
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
      H.browse = [a + 7, b + 11]; H.rest = H.id === 'lions' ? [-524, -111] : [c - 8, d - 9];
      H.entry = H.id === 'lions' ? [-524, -105] : H.rest;
      H.frames = [[a + 9, b + 15, 3.25], [c - 10, b + 27, 4.5], [a + 11, d - 13, 3.75]];
    }
    const timber = col(0x886944), rope = col(0xc7b287), ice = col(0xdcebf0), mud = col(0x665043);
    W.eachCol(-636, -111, -628, -100, (bx, bz, i) => { W.C[i] = mud; });
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
    bay.setIndex([0, 1, 2, 0, 2, 3]); bay.computeBoundingSphere(); bay.userData.kind = 'pond'; bay.userData.waterY = 0; collectPond(bay);
    for (const [y, geos] of pondGeos) {
      let vertices = 0, indices = 0;
      for (const geo of geos) { vertices += geo.attributes.position.count; indices += geo.index.count; }
      const positions = new Float32Array(vertices * 3), normals = new Float32Array(vertices * 3), index = new Uint32Array(indices);
      let vertexOffset = 0, indexOffset = 0;
      for (const geo of geos) {
        positions.set(geo.attributes.position.array, vertexOffset * 3); normals.set(geo.attributes.normal.array, vertexOffset * 3);
        for (const value of geo.index.array) index[indexOffset++] = value + vertexOffset;
        vertexOffset += geo.attributes.position.count; geo.dispose();
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3)); geo.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
      geo.setIndex(new THREE.BufferAttribute(index, 1)); geo.computeBoundingSphere(); geo.userData.kind = 'pond'; geo.userData.waterY = y;
      AF.addWater(geo);
    }
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
    boulder(-516, -118, 9, 3); boulder(-512, -122, 6, 5.5); boulder(-509, -125, 3.5, 7);
    boulder(-507.5, -125, 3, 6.5);
    W.clear(-520, 0.25, -126, -514, 2.5, -120);
    boulder(-524, -111, 5, 1.5); boulder(-524, -106.5, 3, 0.75);
    // savannah: acacias (a thin trunk + a flat umbrella crown), termite mounds, rocks
    const bark = col(0x5a4632, { jitter: 0.5 }), leafA = col(0x6a8a2e, { jitter: 0.7 }), leafB = col(0x7a9a3a, { jitter: 0.7 });
    const acacia = (x, z, s) => { W.fill(x - 0.25, 0.25, z - 0.25, x + 0.25, 4.5 * s, z + 0.25, bark); W.fill(x - 1.5, 4 * s, z - 0.25, x + 1.5, 4.25 * s, z + 0.25, bark); for (const [r, y] of [[3.8 * s, 4.5 * s], [4.6 * s, 4.75 * s], [3.2 * s, 5 * s]]) W.eachCol(x - r, z - r, x + r, z + r, (bx, bz, i, px, pz) => { if (Math.hypot(px - x, pz - z) < r - AF.hash2(bx, bz) * 0.8) W.fill(px - 0.125, y, pz - 0.125, px + 0.125, y + 0.25, pz + 0.125, AF.hash2(bx * 3, bz) < 0.5 ? leafA : leafB); }); };
    for (const [x, z, s] of [[-630, -132, 1.1], [-587, -129, 1.05], [-630, -40, 1], [-575, -128, 0.9], [-580, -40, 1.2], [-570, -70, 1], [-612, -98, 1]]) acacia(x, z, s);
    const grass = col(0x8d9b49, { solid: false }), seedHead = col(0xc9ba70, { solid: false });
    for (let k = 0; k < 200; k++) {
      const x = -592 + AF.hash2(k, 411) * 28, z = -138 + AF.hash2(k, 712) * 47;
      if (POOLS.some((p) => p.hab === 'giraffes' && Math.hypot((x - p.cx) / (p.rx + 1), (z - p.cz) / (p.rz + 1)) < 1)) continue;
      const h = 0.25 + (k % 3) * 0.25;
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
      for (let z = -40; z > -280; z -= 30) { if (Math.abs(z + 153) > 9) TK.place(-547, z, 'street', 1, z); }
      // shade trees on the brook banks + along the south walk
      for (const [x, z] of [[-630, -159.8], [-575, -147.2], [-520, -159.8], [-470, -147.2], [-620, -19], [-580, -19], [-500, -19], [-460, -19]]) TK.place(x, z, 'any', 0, (x * 7 + z) | 0);
    }
    // ---- wilder habitats: grass clumps, bushes, rocks and fallen logs themed per habitat (kept off pools, climbing frames, dens)
    {
      const dR = AF.rng(4242);
      const dryG = [col(0xb8a860, { solid: false, jitter: 0.6 }), col(0xc8b870, { solid: false, jitter: 0.6 }), col(0x9a9a50, { solid: false, jitter: 0.6 })];
      const lushG = [col(0x4f8a3a, { solid: false, jitter: 0.7 }), col(0x3f7a30, { solid: false, jitter: 0.7 }), col(0x6a9a44, { solid: false, jitter: 0.7 })];
      const bushC = [col(0x3f6a2e, { jitter: 0.8 }), col(0x4f7a34, { jitter: 0.8 }), col(0x5a8a3a, { jitter: 0.8 }), col(0x6a7a30, { jitter: 0.8 })];
      const THEME = { elephants: 'dry', giraffes: 'dry', rhinos: 'dry', lions: 'dry', primates: 'lush', tigers: 'lush', flamingos: 'wet', hippos: 'wet', crocs: 'wet', penguins: 'ice', deer: 'lush', bears: 'lush' };
      const clearOf = (H, x, z, r) => !POOLS.some((p) => p.hab === H.id && Math.hypot((x - p.cx) / (p.rx + r), (z - p.cz) / (p.rz + r)) < 1)
        && !(H.id === 'primates' && H.frames.some((f) => Math.hypot(x - f[0], z - f[1]) < 4.5)) && !AF.solidAt(x, W.groundY(x, z) + 0.6, z);
      for (const H of HAB) {
        const [a, b, c, d] = H.rect, t = THEME[H.id], area = (c - a) * (d - b), G = t === 'dry' ? dryG : lushG;
        const rx = () => a + 3 + dR() * (c - a - 6), rz = () => b + 3 + dR() * (d - b - 6);
        if (t !== 'ice') for (let k = 0; k < area * 0.1; k++) {
          const x = rx(), z = rz(); if (!clearOf(H, x, z, 0.5)) continue;
          const y = W.groundY(x, z), hh = 0.25 + (dR() < 0.35 ? 0.25 : 0);
          for (let n = 0; n < 5; n++) { const ox = (dR() - 0.5) * 1.1, oz = (dR() - 0.5) * 1.1; W.fill(x + ox, y, z + oz, x + ox + 0.25, y + hh + (dR() < 0.2 ? 0.25 : 0), z + oz + 0.25, G[(dR() * 3) | 0]); }
        }
        const nb = t === 'lush' ? area / 70 : t === 'dry' ? area / 260 : t === 'wet' ? area / 160 : 0;
        for (let k = 0; k < nb; k++) {
          const x = rx(), z = rz(); if (!clearOf(H, x, z, 2)) continue;
          const y = W.groundY(x, z), r = 0.8 + dR() * 0.9, ry = r * (0.6 + dR() * 0.3);
          W.eachCol(x - r, z - r, x + r, z + r, (bx, bz, i, px, pz) => {
            const e = 1 - ((px - x) ** 2 + (pz - z) ** 2) / (r * r); if (e <= 0) return;
            const top = Math.round((ry * Math.sqrt(e) + (AF.hash2(bx, bz) - 0.5) * 0.3) * 4) / 4; if (top < 0.25) return;
            W.fill(px - 0.125, y, pz - 0.125, px + 0.125, y + top, pz + 0.125, bushC[(bx + bz) & 3]);
          });
        }
        if (t !== 'ice') for (let k = 0; k < 2 + area / 350; k++) { const x = rx(), z = rz(); if (clearOf(H, x, z, 2)) boulder(x, z, 0.9 + dR() * 1.3, 0.75 + dR() * 1.0); }
        if (t === 'lush') for (let k = 0; k < 2; k++) { const x = rx(), z = rz(); if (!clearOf(H, x, z, 3)) continue; const y = W.groundY(x, z), L2 = 3 + dR() * 3; if (dR() < 0.5) W.fill(x, y, z, x + L2, y + 0.75, z + 0.75, logC); else W.fill(x, y, z, x + 0.75, y + 0.75, z + L2, logC); }
      }
    }
    // ---- THE SOLACE BROOK: a spring grotto by the east wall, a rocky brook west between the walks, under the wall to the sea
    const brookZ = ZOO.brookZ = (x) => -153 + Math.sin((x + 640) * 0.045) * 1.0 + Math.sin((x + 600) * 0.13) * 0.35;
    {
      const RW = 2.9, bedC = col(0x5a5040, { jitter: 0.7 }), bedD = col(0x3e463a, { jitter: 0.7 }), gravel = col(0x9a927e, { jitter: 0.9 });
      W.eachCol(-660, -160, -455, -146, (bx, bz, i, x, z) => {
        const dz = Math.abs(z - brookZ(x)), rw = RW + (AF.noise2(x * 0.2, 4.1) - 0.5) * 0.8;
        if (dz < rw) { const k = dz / rw; W.H[i] = Math.min(W.H[i], Math.round(-1 - 4 * (1 - k * k))); W.C[i] = k < 0.5 ? bedD : AF.hash2(bx, bz) < 0.3 ? gravel : bedC; W.S[i] = bedC; }
        else if (dz < rw + 0.75 && x > -650) { W.H[i] = 1; W.C[i] = kerb[(AF.hash2(bx >> 1, bz >> 1) * 7 | 0) % 3]; W.S[i] = kerb[1]; if (AF.hash2(bx, bz + 3) < 0.25) W.fill(x - 0.125, 0.25, z - 0.125, x + 0.125, 0.5, z + 0.125, kerb[2]); }
      });
      W.tDirty = true;
      // under the west wall: an arched culvert with iron bars
      const zc = brookZ(-650);
      W.clear(-650, 0.25, zc - 3.25, -649.5, 2.5, zc + 3.25);
      for (let z = zc - 3; z < zc + 3; z += 0.75) W.fill(-649.75, -1.25, z, -649.5, 2.5, z + 0.25, iron);
      W.fill(-650, 2.5, zc - 3.5, -649.5, 3.0, zc + 3.5, cap);
      // the spring grotto: a rock pile with a little fall into the head pool
      boulder(-458, -153, 4.2, 3.5); boulder(-461, -156.5, 2.2, 2); boulder(-461, -149.5, 2.2, 2.2);
      W.clear(-462, 0.25, -154, -455, 3.0, -152);
      const fallC = col(0xbfe2ea, { glass: true, jitter: 0.1, edge: 0, solid: false }), foam = col(0xf2f6f4, { solid: false, jitter: 0.1 });
      W.fill(-459.5, 0.0, -154, -459.25, 3.25, -152, fallC); W.fill(-460.5, -0.25, -154.25, -459.25, 0.25, -151.75, foam);
      const pos = [], idx = []; let n = 0, y = 0.0;
      for (let x = -660; x < -456; x++) for (let z = -160; z < -146; z++) {
        let low = false; for (let i = 0; i < 4 && !low; i++) for (let k = 0; k < 4; k++) if (W.groundY(x + i * 0.25 + 0.1, z + k * 0.25 + 0.1) < y - 0.01) { low = true; break; }
        if (!low) continue;
        pos.push(x, y, z, x, y, z + 1, x + 1, y, z + 1, x + 1, y, z); idx.push(n, n + 1, n + 2, n, n + 2, n + 3); n += 4;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(pos.map((v, i) => (i % 3 === 1 ? 1 : 0)), 3));
      geo.setIndex(idx); geo.computeBoundingSphere(); geo.userData.kind = 'creek'; geo.userData.flow = [-0.5, 0]; geo.userData.waterY = y;
      AF.addWater(geo);
      P.pools.push({ x0: -660, z0: -157.5, x1: -456, z1: -148.5, y });
      // THE KEEPER'S BRIDGE on the promenade: a humped stone arch in the walk's own stone, parapets, four lamps
      const bz0 = brookZ(-546) - 4.75, bz1 = brookZ(-546) + 4.75, bzc = (bz0 + bz1) / 2, bstone = col(0xa89a80, { pat: 'stone', jitter: 0.5 }), bcap = col(0xc8bca0, { jitter: 0.3 });
      for (let x = -553; x < -539; x += 0.25) for (let z = bz0; z < bz1; z += 0.25) {
        const t = (z + 0.125 - bzc) / ((bz1 - bz0) / 2), top = 0.25 + Math.round(Math.cos(t * PI / 2) * 0.5 * 4) / 4, gy = W.groundY(x + 0.125, z + 0.125);
        const edge = x < -552.5 || x >= -539.5, P2 = SP.moss;
        W.fill(x, Math.max(gy, top - 0.5), z, x + 0.25, top, z + 0.25, edge ? bstone : P2[Math.floor(AF.hash2(Math.floor(x * 0.9), Math.floor(z * 0.9)) * P2.length)]);
        if (edge) { W.fill(x, top, z, x + 0.25, top + 0.75, z + 0.25, bstone); W.fill(x, top + 0.75, z, x + 0.25, top + 1.0, z + 0.25, bcap); }
      }
      for (const [lx, lz] of [[-553, bz0], [-539.25, bz0], [-553, bz1 - 0.25], [-539.25, bz1 - 0.25]]) { W.fill(lx, 0.25, lz, lx + 0.25, 3.25, lz + 0.25, iron); W.fill(lx - 0.25, 3.25, lz - 0.25, lx + 0.5, 3.75, lz + 0.5, glow(0xfff0c8, 2.6, 'night')); AF.addLight({ x: lx + 0.1, y: 3.5, z: lz + 0.1, color: 0xffe0b0, intensity: 0.8, range: 10, kind: 'street' }); }
      AF.placeStatic(fitText('KEEPER\u2019S BRIDGE', 0x3a3024, 3.0, 'deco'), -553.1, 1.25, bzc, 3, { collide: false });
      // plank footbridges on the side walks (rope rails)
      const plank = [col(0x8a6a44, { jitter: 0.5 }), col(0x7a5a38, { jitter: 0.5 })];
      for (const fx of [-600, -490]) {
        const fz0 = brookZ(fx) - 4.25, fz1 = brookZ(fx) + 4.25;
        for (let z = fz0; z < fz1; z += 0.5) W.fill(fx - 1.5, 0.25, z, fx + 1.5, 0.5, z + 0.5, plank[Math.round(z * 2) & 1]);
        for (const sx of [fx - 1.75, fx + 1.5]) { for (let z = fz0; z < fz1; z += 2) W.fill(sx, 0.25, z, sx + 0.25, 1.5, z + 0.25, timber); W.fill(sx, 1.25, fz0, sx + 0.25, 1.5, fz1, rope); }
      }
      AF.addLabel('Solace Brook', -620, brookZ(-620), 'place');
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
      if (AF.addSpot) { AF.addSpot({ building: 'zoo-kiosk', x, y: 0.25, z: z + 1.4, yaw: PI, kind: 'counter' }); AF.addSpot({ building: 'zoo', x: x - 0.6, y: 0.25, z: z - 1.6, yaw: 0, kind: 'queue' }); AF.addSpot({ building: 'zoo', x: x + 0.7, y: 0.25, z: z - 2.4, yaw: 0.2, kind: 'queue' }); }
    };
    kiosk(-578, -144.5, 'ICE CREAM', 0xe86a9a, 0xf6e8d8); kiosk(-520, -144.5, 'SNACKS', 0xd8502a, 0xf2e2c0); kiosk(-470, -144.5, 'GIFTS', 0x2f6a8a, 0xe8eef2);
    const table = col(0xf6f2ea), chairC = col(0x2f6a4a), bench = col(0x8a5a34, { pat: 'none' }), ironB = col(0x2a2a2e);
    for (const [x, z] of [[-584, -163], [-526, -163], [-464, -163]]) {
      for (const dx of [-2, 2]) { W.fill(x + dx - 0.5, 0.25, z - 0.5, x + dx + 0.5, 1.0, z + 0.5, table); W.clear(x + dx - 0.25, 0.25, z - 0.5, x + dx + 0.25, 0.75, z + 0.5); for (const s of [-1, 1]) { W.fill(x + dx - 0.25, 0.25, z + s * 0.9 - 0.25, x + dx + 0.25, 0.75, z + s * 0.9 + 0.25, chairC); AF.addSpot && AF.addSpot({ building: 'zoo', x: x + dx, y: 0.75, z: z + s * 0.9, yaw: s > 0 ? PI : 0, kind: 'sit' }); } }
    }
    for (let z = -52; z > -280; z -= 24) for (const [x, yaw] of [[-552.25, PI / 2], [-539.75, -PI / 2]]) {
      if (Math.abs(z - brookZ(-546)) < 7.5) continue;
      W.fill(x - 0.25, 0.25, z - 1, x + 0.25, 0.5, z + 1, ironB); W.fill(x - 0.25, 0.5, z - 1, x + 0.25, 0.75, z + 1, bench);
      const bk = x < -546 ? x - 0.25 : x + 0.25; W.fill(Math.min(bk, bk + (x < -546 ? -0.25 : 0.25)), 0.75, z - 1, Math.max(bk, bk + (x < -546 ? -0.25 : 0.25)), 1.25, z + 1, bench);
      if (AF.addSpot) for (const dz of [-0.5, 0.5]) AF.addSpot({ building: 'zoo', x, y: 0.75, z: z + dz, yaw, kind: 'bench' });
    }
    // flower beds + planters dotted along the promenade edges
    const flw = [0xd8502a, 0xf0d040, 0xe86a9a, 0xf6f2ea, 0x8a6ac8].map((h) => col(h, { jitter: 0.4, solid: false })), lf = col(0x4f8a3a, { jitter: 0.7, solid: false });
    for (let z = -58; z > -280; z -= 24) for (const x of [-554, -538.5]) { if (Math.abs(z - brookZ(-546)) < 7.5) continue; W.fill(x - 0.25, 0.25, z - 1.5, x + 0.5, 0.5, z + 1.5, col(0x8a7a6a, { pat: 'stone' })); for (let k = 0; k < 12; k++) { const zz = z - 1.5 + k * 0.25; W.fill(x - 0.25, 0.5, zz, x + 0.5, 0.75 + (k % 3 === 0 ? 0.25 : 0), zz + 0.25, k % 3 ? lf : flw[(k + ((z / 24) | 0)) % flw.length]); } }
    ZOO.buildMs = Math.round(performance.now() - t0);
  });

  // ---------------------------------------------------------------- the gate: turnstile arms + a ticket booth. No ticket, no zoo
  // (you can always walk OUT: the arms swing for anyone leaving). Colliders go in after 'ready' so the crowd graph is unaffected.
  {
    const G = AF.zooGate = { ticket: false, open: 0, arms: [], coll: null };
    AF.on('ready', () => {
      const z1 = ZOO.z1, zg = z1 - 2;
      const mat = new THREE.MeshStandardMaterial({ color: 0xd8b84a, metalness: 0.85, roughness: 0.3 });
      const geo = new THREE.BoxGeometry(3.25, 0.12, 0.12); geo.translate(1.625, 0, 0);
      for (const px of [-554.5, -550.5, -546.5, -542.5]) {
        const arm = new THREE.Mesh(geo, mat); arm.position.set(px, 1.0, zg); arm.castShadow = true; arm.name = 'zoo-turnstile'; AF.scene.add(arm); G.arms.push(arm);
      }
      G.coll = AF.addCollider(-555, 0, zg - 0.3, -537, 2.5, zg + 0.3, 'zoo-gate');
      AF.addInteract({ x: -536, y: 1.3, z: z1 + 2.25, r: 3, label: 'Buy a zoo ticket \u00b7 25\u00a2', prio: 2, can: () => AF.mode === 'walk' && !G.ticket,
        act: () => { G.ticket = true; AF.emit('toast', 'Admit one \u2014 Solace Zoo. Enjoy your visit!'); AF.emit('dialogue', { name: 'Ticket booth', role: 'Solace Zoo', line: 'Here you go, one adult. The turnstile\u2019s all yours \u2014 and the brook bridge is lovely at sunset.' }); } });
      AF.addInteract({ x: -546, y: 1.2, z: z1 - 0.5, r: 3.2, label: 'Tickets at the booth \u2192', prio: 0.5, can: () => AF.mode === 'walk' && !G.ticket && AF.player && AF.player.z > zg,
        act: () => AF.emit('toast', 'You need a ticket \u2014 the booth is just to the right of the gate.') });
      AF.onTick('zoo-gate', 432, (dt) => {
        const p = AF.player, leaving = p && p.z < zg - 0.2 && p.z > zg - 9 && Math.abs(p.x + 546) < 11;
        const want = G.ticket || leaving ? 1 : 0;
        G.open += (want - G.open) * Math.min(1, dt * 4);
        for (const arm of G.arms) arm.rotation.y = -G.open * PI / 2;
        const shut = G.open < 0.5; G.coll.y0 = shut ? 0 : -50; G.coll.y1 = shut ? 2.5 : -49;
      });
    });
  }

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
  // torso: hip / waist / chest girth (1 = full box), hump (withers or shoulder hump), sag (belly), head: skull type
  const SPEC = {
    elephant: { body: [18, 15, 30], legH: 11, legW: 5, head: [12, 11, 11], neck: [10, 2, 4, 1], col: 0x8a8a90, belly: 0x7a7a82, speed: 0.85, legs: 4, torso: { hip: 0.92, waist: 0.95, chest: 1, hump: 0.4, sag: 0.1 }, headT: 'elephant' },
    giraffe: { body: [8, 9, 17], legH: 17, legW: 1, head: [4, 5, 9], neck: [4, 15, 4, 3], col: 0xd8a860, belly: 0xf0dcb0, pattern: 'patches', patCol: 0xb0703a, speed: 1.0, legs: 4, torso: { hip: 0.8, waist: 0.85, chest: 1, hump: 0.6 }, headT: 'long', mane: 0x6a3e1a },
    rhino: { body: [13, 12, 26], legH: 6, legW: 4, head: [8, 7, 12], neck: [8, 2, 4, 0], col: 0x92928a, belly: 0x80827b, speed: 0.7, legs: 4, torso: { hip: 0.92, waist: 0.9, chest: 1, hump: 0.5, sag: 0.08 }, headT: 'box' },
    penguin: { body: [5, 7, 5], legH: 1, legW: 1, head: [4, 4, 4], neck: [3, 1, 3, 0], col: 0x222b34, belly: 0xf4f0dd, speed: 0.55, legs: 2, beak: 0xe9af38, torso: { hip: 1, waist: 1, chest: 0.9 }, headT: 'bird', upright: true },
    gorilla: { body: [10, 10, 9], legH: 5, legW: 3, head: [5, 6, 5], neck: [4, 1, 2, 0], col: 0x2e302d, belly: 0x5b5e5a, speed: 0.7, legs: 4, snout: 0x3e3b38, torso: { hip: 0.85, waist: 0.9, chest: 1, hump: 0.7 }, headT: 'ape' },
    monkey: { body: [3, 4, 5], legH: 4, legW: 1, head: [3, 3, 3], neck: [2, 1, 2, 0], col: 0x96734f, belly: 0xd7c6a4, speed: 1.5, legs: 4, tailL: 10, snout: 0xc99e7b, headT: 'ape' },
    zebra: { body: [7, 7, 16], legH: 8, legW: 1, head: [4, 5, 8], neck: [4, 6, 4, 2], col: 0xf4f2ea, belly: 0xf4f2ea, pattern: 'stripes', patCol: 0x16161a, speed: 1.4, legs: 4, mane: 0x16161a, torso: { hip: 0.95, waist: 0.88, chest: 1 }, headT: 'long' },
    antelope: { body: [6, 7, 12], legH: 10, legW: 1, head: [3, 4, 6], neck: [3, 6, 3, 2], col: 0xb87a3a, belly: 0xf2ead8, speed: 1.6, legs: 4, horns: 0x2a2018, torso: { hip: 0.95, waist: 0.8, chest: 1 }, headT: 'long', flank: 0x3a2618 },
    deer: { body: [6, 7, 12], legH: 10, legW: 1, head: [3, 4, 6], neck: [3, 6, 3, 2], col: 0x9a6a3a, belly: 0xe8dcc4, pattern: 'dots', patCol: 0xe8dcc4, speed: 1.3, legs: 4, torso: { hip: 0.95, waist: 0.82, chest: 1 }, headT: 'long' },
    stag: { body: [7, 8, 13], legH: 10, legW: 1, head: [3, 4, 6], neck: [4, 7, 4, 2], col: 0x8a5a30, belly: 0xe8dcc4, speed: 1.2, legs: 4, antlers: 0x6a5238, torso: { hip: 0.92, waist: 0.84, chest: 1, hump: 0.2 }, headT: 'long', mane: 0x5a3a20 },
    lion: { body: [8, 7, 17], legH: 6, legW: 3, head: [6, 6, 7], neck: [5, 2, 3, 1], col: 0xd0a050, belly: 0xe6c888, speed: 0.8, legs: 4, maneCol: 0x6a3a14, tail: 0x3a2412, torso: { hip: 0.85, waist: 0.78, chest: 1 }, headT: 'cat' },
    lioness: { body: [7, 6, 15], legH: 6, legW: 2, head: [5, 5, 7], neck: [4, 2, 3, 1], col: 0xd6aa5c, belly: 0xecd09a, speed: 0.9, legs: 4, tail: 0x4a2c16, torso: { hip: 0.85, waist: 0.75, chest: 1 }, headT: 'cat' },
    tiger: { body: [8, 7, 18], legH: 6, legW: 3, head: [6, 6, 7], neck: [5, 2, 3, 1], col: 0xe07a22, belly: 0xf4eee0, pattern: 'tiger', patCol: 0x161210, speed: 1.0, legs: 4, tail: 0xe07a22, torso: { hip: 0.88, waist: 0.8, chest: 1 }, headT: 'cat' },
    bear: { body: [11, 10, 18], legH: 5, legW: 4, head: [8, 7, 8], neck: [7, 2, 3, 1], col: 0x5a3a22, belly: 0x4e321e, speed: 0.8, legs: 4, ears: true, snout: 0x8a6a4a, torso: { hip: 0.95, waist: 0.95, chest: 1, hump: 0.8 }, headT: 'bear' },
    hippo: { body: [14, 11, 22], legH: 4, legW: 4, head: [11, 8, 11], neck: [11, 2, 2, 0], col: 0x7a6a78, belly: 0xc89a9a, speed: 0.6, legs: 4, ears: true, snout: 0xa88494, torso: { hip: 0.98, waist: 1, chest: 1, sag: 0.12 }, headT: 'hippo' },
    croc: { body: [7, 4, 24], legH: 2, legW: 2, head: [5, 3, 13], neck: [5, 1, 1, 0], col: 0x4a5a2a, belly: 0xb8b88a, pattern: 'scutes', patCol: 0x35401c, speed: 0.5, legs: 4, tailL: 20, torso: { hip: 0.9, waist: 1, chest: 0.95 }, headT: 'croc' },
    flamingo: { body: [4, 4, 7], legH: 8, legW: 1, head: [2, 2, 4], neck: [1, 6, 1, 1], col: 0xf28aa8, belly: 0xf6a8c0, speed: 0.5, legs: 2, beak: 0x1a1a1a, torso: { hip: 0.8, waist: 1, chest: 0.95 }, headT: 'bird', wingCol: 0xd05070 },
  };
  const clamp01 = (v) => v < 0 ? 0 : v > 1 ? 1 : v;
  // silhouette tests in the part's unit box (u, v, t in 0..1; t = 1 at the front / top). Rounded, tapered, species-aware.
  const insideBody = (S, u, v, t) => {
    const T = S.torso || {}, hip = T.hip ?? 0.92, waist = T.waist ?? 0.86, chest = T.chest ?? 1, hump = T.hump ?? 0, sag = T.sag ?? 0.04;
    if (S.upright) { const r = 0.5 * (0.8 + 0.2 * Math.sin(v * Math.PI)); return ((u - 0.5) / r) ** 2 + ((t - 0.5) / r) ** 2 <= 1; }
    const endT = Math.min(t, 1 - t), cap = Math.sqrt(Math.max(0, 1 - (1 - Math.min(1, endT / 0.22)) ** 2));
    const prof = t < 0.45 ? hip + (waist - hip) * clamp01((t - 0.12) / 0.33) : waist + (chest - waist) * clamp01((t - 0.45) / 0.3);
    const rw = 0.5 * prof * Math.max(0.35, cap), rh = 0.5 * (0.35 + 0.65 * prof) * Math.max(0.4, cap);
    const cy = 0.5 + hump * 0.1 * Math.exp(-((t - 0.74) ** 2) / 0.015) - sag * 0.12 * Math.exp(-((t - 0.45) ** 2) / 0.05);
    const dy = v - cy, lowK = dy < 0 ? 1 + sag * 0.6 : 1;
    return ((u - 0.5) / rw) ** 2 + (dy / (rh * lowK)) ** 2 <= 1;
  };
  const insideHead = (S, u, v, t) => {
    const k = S.headT || 'long', du = u - 0.5;
    const ell = (cu, cv, ct, ru, rv, rt) => ((u - cu) / ru) ** 2 + ((v - cv) / rv) ** 2 + ((t - ct) / rt) ** 2 <= 1;
    const box = (u0, u1, v0, v1, t0, t1, r) => { const qu = Math.max(u0 - u, 0, u - u1), qv = Math.max(v0 - v, 0, v - v1), qt = Math.max(t0 - t, 0, t - t1); return qu * qu + qv * qv + qt * qt <= r * r; };
    if (k === 'long') { const tw = 0.5 - 0.18 * clamp01((t - 0.35) / 0.65); return ell(0.5, 0.62, 0.25, 0.5, 0.4, 0.3) || (t > 0.2 && Math.abs(du) < tw * 0.8 && v < 0.8 - 0.35 * clamp01((t - 0.3) / 0.7) && v > 0.08 && box(0.5 - tw * 0.8, 0.5 + tw * 0.8, 0.08, 0.8, 0.2, 0.96, 0.05)); }
    if (k === 'cat') return ell(0.5, 0.58, 0.4, 0.5, 0.42, 0.42) || box(0.24, 0.76, 0.12, 0.5, 0.55, 0.95, 0.06);
    if (k === 'bear') return ell(0.5, 0.58, 0.35, 0.5, 0.44, 0.38) || box(0.3, 0.7, 0.14, 0.52, 0.5, 0.97, 0.06);
    if (k === 'box') return box(0.12, 0.88, 0.06, 0.82 - 0.3 * t, 0.06, 0.94, 0.1);
    if (k === 'hippo') return box(0.1, 0.9, 0.1, 0.9, 0.05, 0.5, 0.1) || box(0.02, 0.98, 0.05, 0.62, 0.45, 0.95, 0.06) || ell(0.3, 0.85, 0.3, 0.14, 0.14, 0.14) || ell(0.7, 0.85, 0.3, 0.14, 0.14, 0.14);
    if (k === 'croc') { const h = 0.95 - 0.55 * t, w = 0.5 - 0.22 * t; return Math.abs(du) < w && v < h && v > 0.02 && (t > 0.06 || Math.abs(du) < w * 0.8); }
    if (k === 'ape') return ell(0.5, 0.52, 0.45, 0.5, 0.48, 0.44) || box(0.26, 0.74, 0.15, 0.48, 0.6, 0.92, 0.07) || box(0.12, 0.88, 0.62, 0.72, 0.55, 0.9, 0.04);
    if (k === 'elephant') return ell(0.5, 0.58, 0.42, 0.5, 0.44, 0.44) || ell(0.5, 0.78, 0.62, 0.36, 0.2, 0.3);
    return ell(0.5, 0.5, 0.5, 0.5, 0.5, 0.5);
  };
  const makeGeo = (id) => {
    const S = SPEC[id], c = { body: C(S.col), bodyL: C(shadeH(S.col, 1.08)), bodyD: C(shadeH(S.col, 0.86)), belly: C(S.belly),
      pat: C(S.patCol ?? S.col), eye: C(0x141414, { jitter: 0 }), white: C(0xfff8e9), dark: C(0x302822), ivory: C(0xf0ead8),
      mane: C(S.maneCol ?? S.mane ?? S.col), snout: C(S.snout ?? S.belly), hoof: C(shadeH(S.col, 0.45)), lower: C(shadeH(S.col, 0.72)), flank: C(S.flank ?? shadeH(S.col, 0.7)), pink: C(0xd8a0a8), line: C(0xf2e2c0) };
    const parts = [], bw = S.body[0] * VS, bh = S.body[1] * VS, bl = S.body[2] * VS;
    const nh = S.neck[1] * VS, hh = S.head[1] * VS, hw = S.head[0] * VS, hl = S.head[2] * VS, lift = S.legH * VS;
    const hoofed = ['giraffe', 'zebra', 'antelope', 'deer', 'stag', 'rhino'].includes(id);
    const shape = (dims, kind, color, anchor) => {
      const width = Math.max(1, Math.round(dims[0] * 8)), height = Math.max(1, Math.round(dims[1] * 8)), depth = Math.max(1, Math.round(dims[2] * 8));
      const m = new AF.Model(width, height, depth);
      for (let x = 0; x < width; x++) for (let y = 0; y < height; y++) for (let z = 0; z < depth; z++) {
        const u = (x + 0.5) / width, v = (y + 0.5) / height, t = (z + 0.5) / depth;
        const ex = (x + 0.5 - width / 2) / (width / 2), ey = (y + 0.5 - height / 2) / (height / 2), ez = (z + 0.5 - depth / 2) / (depth / 2);
        if (kind === 'body' && !insideBody(S, u, v, t)) continue;
        if (kind === 'head' && !insideHead(S, u, v, t)) continue;
        if (kind === 'leg') { const r = 0.5 * (1 - 0.28 * (1 - v)); if (width > 1 && ((u - 0.5) / r) ** 2 + ((t - 0.5) / r) ** 2 > 1.05) continue; }
        if (kind === 'neck') { const r = 0.5 * (1 - 0.3 * v); if (width > 1 && ((u - 0.5) / r) ** 2 + ((t - 0.5) / r) ** 2 > 1.05) continue; }
        if (kind !== 'leg' && kind !== 'horn' && kind !== 'body' && kind !== 'head' && kind !== 'neck' && ex * ex + ey * ey + ez * ez > 1.12) continue;
        if (kind === 'mane' && ex * ex + ey * ey + ez * ez > 0.6 && AF.hash3(x, y * 3, z) < 0.4) continue;
        if (kind === 'horn' && height > width && (Math.abs(ex) > Math.max(0.25, 1 - y / height * 0.7) || Math.abs(ez) > Math.max(0.25, 1 - y / height * 0.7))) continue;
        let material = color;
        if (kind === 'body' && (v < 0.24 && !S.upright || id === 'penguin' && t > 0.55 || id === 'gorilla' && t > 0.7 && v < 0.6)) material = c.belly;
        if (kind === 'body' && S.flank && v > 0.3 && v < 0.4) material = c.flank;
        if (kind === 'head' && t > 0.62 && v < 0.55 && S.headT !== 'croc') material = c.snout;
        if (kind === 'head' && S.headT === 'long' && t > 0.88) material = c.dark;
        if (kind === 'head' && id === 'penguin' && (t > 0.6 && v < 0.55)) material = c.belly;
        if (kind === 'body' || kind === 'neck' || kind === 'head' || kind === 'leg') {
          if (S.pattern === 'stripes') {
            const s = kind === 'body' ? z + Math.floor(y * 0.34) : kind === 'leg' ? y * 1.5 : kind === 'neck' ? y * 1.5 : y * 1.5;
            if (((s % 3) + 3) % 3 < 1 && !(kind === 'body' && v < 0.12)) material = c.pat;
          }
          if (S.pattern === 'tiger' && material !== c.belly) {
            const s = kind === 'body' ? z * 0.9 + Math.sin(y * 0.8 + x * 0.4) * 1.3 : kind === 'leg' ? y * 1.2 + 0.5 : kind === 'head' ? y * 1.5 + Math.abs(x - width / 2) * 0.6 : y;
            if (((s % 5) + 5) % 5 < 1.1 && AF.hash3(x >> 1, y, z >> 1) > 0.18) material = c.pat;
          }
          if (S.pattern === 'patches' && material !== c.belly) {
            // giraffe: polygon patches with cream lines (Voronoi over the coat)
            const gx = (kind === 'body' ? z : y) / 2.5, gy = (kind === 'body' ? y : x + z) / 2.5; let d1 = 9, d2 = 9;
            for (let a2 = -1; a2 <= 1; a2++) for (let b2 = -1; b2 <= 1; b2++) { const cx = Math.floor(gx) + a2, cy = Math.floor(gy) + b2, px = cx + AF.hash2(cx, cy + 7) * 0.8 + 0.1, py = cy + AF.hash2(cy, cx + 3) * 0.8 + 0.1, dd = Math.hypot(gx - px, gy - py); if (dd < d1) { d2 = d1; d1 = dd; } else if (dd < d2) d2 = dd; }
            material = d2 - d1 < 0.18 ? c.line : c.pat;
            if (kind === 'leg' && v < 0.45) material = c.line;
          }
          if (S.pattern === 'dots' && v > 0.6 && AF.hash3(x, y, z) < 0.12) material = c.pat;
          if (S.pattern === 'scutes' && y === height - 1 && z % 2 === 0) material = c.pat;
        }
        if (kind === 'leg' && v < 0.35 && (hoofed || id === 'tiger' || id === 'zebra') && material === color) material = id === 'giraffe' ? c.line : c.lower;
        m.set(x, y, z, material);
      }
      const eyes = kind === 'head' ? [[0, Math.max(0, Math.floor(height * 0.62)), Math.floor(depth * (S.headT === 'long' ? 0.35 : 0.58)), -1], [width - 1, Math.max(0, Math.floor(height * 0.62)), Math.floor(depth * (S.headT === 'long' ? 0.35 : 0.58)), 1]] : null;
      if (eyes) for (const eye of eyes) { let ex2 = eye[0]; while (ex2 >= 0 && ex2 < width && !m.get(ex2, eye[1], eye[2])) ex2 += eye[3] < 0 ? 1 : -1; eye[0] = Math.max(0, Math.min(width - 1, ex2)); m.set(eye[0], eye[1], eye[2], c.eye); }
      const refined = refine(m, c, eyes);
      if (kind === 'head') {
        const noseZ = refined.d - 1, noseY = Math.max(0, Math.floor(refined.h * 0.4));
        refined.box(Math.floor(refined.w * 0.3), noseY, noseZ, Math.ceil(refined.w * 0.7), noseY + 1, noseZ + 1, c.dark);
        if (id === 'hippo' || id === 'rhino' || id === 'elephant') {
          refined.set(Math.floor(refined.w * 0.3), noseY + 2, noseZ, c.dark); refined.set(Math.floor(refined.w * 0.7), noseY + 2, noseZ, c.dark);
        }
        if (id === 'lion' || id === 'lioness' || id === 'tiger') refined.box(Math.floor(refined.w * 0.38), noseY + 1, noseZ, Math.ceil(refined.w * 0.62), noseY + 3, noseZ + 1, c.dark);
      }
      const geo = AF.meshModel(refined, { vs: 1 / 16, anchor });
      geo.userData.farGeo = AF.meshModel(m, { vs: VS, anchor });
      return geo;
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
      add('foot', [S.legW * VS * 1.1, 0.125, S.legW * VS * 1.35], [0, -length * 0.45, 0.0625], shin, [0.5, 0, 0.5], id === 'flamingo' ? C(0xde8292) : hoofed ? c.hoof : id === 'lion' || id === 'lioness' || id === 'tiger' ? c.bodyL : c.dark, 'foot');
    }
    const tailLength = id === 'croc' ? 2.5 : id === 'monkey' ? 1.3 : id === 'giraffe' ? 0.95 : id === 'lion' || id === 'lioness' || id === 'tiger' ? 0.9 : id === 'zebra' ? 0.75 : 0.5;
    const tailTipC = S.tail ? C(S.tail) : id === 'zebra' ? c.pat : id === 'giraffe' ? c.mane : id === 'deer' ? c.white : id === 'antelope' ? c.dark : c.body;
    const tail = add('tail', [id === 'croc' ? 0.5 : 0.125, 0.125, tailLength * 0.55], [0, bh * 0.62, -bl * 0.46], body, [0.5, 0.5, 1], c.body, 'tail');
    add('tailTip', [id === 'croc' ? 0.25 : id === 'lion' || id === 'zebra' || id === 'giraffe' ? 0.1875 : 0.125, id === 'lion' || id === 'zebra' || id === 'giraffe' ? 0.1875 : 0.125, tailLength * 0.45], [0, 0, -tailLength * 0.55], tail, [0.5, 0.5, 1], tailTipC, 'tail');
    const catLike = id === 'lion' || id === 'lioness' || id === 'tiger' || id === 'bear' || id === 'gorilla' || id === 'monkey';
    for (const side of [-1, 1]) {
      if (id !== 'penguin' && id !== 'flamingo' && id !== 'croc') add('ear', [id === 'elephant' ? 0.25 : 0.1875, id === 'elephant' ? 1.25 : catLike ? 0.1875 : 0.3125, id === 'elephant' ? 0.9 : catLike ? 0.1875 : 0.125], id === 'elephant' ? [side * hw * 0.48, hh * 0.65, 0.0625] : catLike ? [side * hw * 0.34, hh * 0.86, 0] : [side * hw * 0.42, hh * 0.82, -hl * 0.05], head, id === 'elephant' ? [side > 0 ? 0 : 1, 0.75, 0.5] : [0.5, 0, 0.5], id === 'zebra' ? c.pat : c.body, 'ear', id === 'elephant' || catLike ? 0 : -0.35, side);
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
    if (S.maneCol) { add('mane', [hw * 1.7, hh * 1.55, 0.625], [0, -hh * 0.25, -0.0625], head, [0.5, 0, 0.5], c.mane, 'mane'); add('mane', [bw * 0.95, bh * 0.85, bl * 0.28], [0, bh * 0.3, bl * 0.34], body, [0.5, 0, 0.5], c.mane, 'mane'); }
    if (S.mane || id === 'giraffe') add('crest', [0.125, nh, 0.1875], [0, 0, -S.neck[2] * VS * 0.42], neck, [0.5, 0, 0.5], c.mane, 'leg');
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
  const mergeAnimal = (G) => {
    const parts = G.parts.filter((part) => part.name !== 'spray' && part.name !== 'droplet');
    let vertices = 0, indices = 0;
    for (const part of parts) { const geo = part.geo.userData.farGeo; vertices += geo.attributes.position.count; indices += geo.index.count; }
    const positions = new Float32Array(vertices * 3), uv = new Int16Array(vertices * 2), palette = new Uint16Array(vertices), normals = new Uint8Array(vertices), index = new Uint32Array(indices);
    let vertexOffset = 0, indexOffset = 0;
    const point = new THREE.Vector3(), normal = new THREE.Vector3();
    for (const part of G.parts) {
      tmpE.set(part.name === 'tail' ? -0.95 : part.name === 'tailTip' ? -0.15 : part.rotation, 0, 0); tmpQ.setFromEuler(tmpE);
      part.matrix.compose(tmpV.set(part.x, part.y, part.z), tmpQ, one.set(1, 1, 1));
      if (part.parent >= 0) part.matrix.premultiply(G.parts[part.parent].matrix);
      const geo = part.geo.userData.farGeo;
      if (parts.includes(part)) {
        for (let vertex = 0; vertex < geo.attributes.position.count; vertex++) {
          point.fromBufferAttribute(geo.attributes.position, vertex).applyMatrix4(part.matrix); point.toArray(positions, (vertexOffset + vertex) * 3);
          const packed = geo.attributes.aAN.array[vertex], axis = packed % 8;
          normal.set(axis === 0 ? 1 : axis === 1 ? -1 : 0, axis === 2 ? 1 : axis === 3 ? -1 : 0, axis === 4 ? 1 : axis === 5 ? -1 : 0).transformDirection(part.matrix);
          const ax = Math.abs(normal.x), ay = Math.abs(normal.y), az = Math.abs(normal.z);
          const remapped = ax > ay && ax > az ? (normal.x > 0 ? 0 : 1) : ay > az ? (normal.y > 0 ? 2 : 3) : (normal.z > 0 ? 4 : 5);
          normals[vertexOffset + vertex] = packed - axis + remapped;
        }
        uv.set(geo.attributes.aBU.array, vertexOffset * 2); palette.set(geo.attributes.aPal.array, vertexOffset);
        for (const value of geo.index.array) index[indexOffset++] = value + vertexOffset;
        vertexOffset += geo.attributes.position.count;
      }
      geo.dispose(); delete part.geo.userData.farGeo;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3)); geo.setAttribute('aBU', new THREE.BufferAttribute(uv, 2));
    geo.setAttribute('aPal', new THREE.BufferAttribute(palette, 1)); geo.setAttribute('aAN', new THREE.BufferAttribute(normals, 1));
    geo.setIndex(new THREE.BufferAttribute(index, 1)); geo.computeBoundingSphere(); return geo;
  };
  let fadeMaterial;
  const zooFadeMaterial = () => {
    if (fadeMaterial) return fadeMaterial;
    fadeMaterial = AF.mat.voxel.clone();
    const patch = AF.mat.voxel.onBeforeCompile;
    fadeMaterial.onBeforeCompile = (shader, renderer) => {
      patch.call(fadeMaterial, shader, renderer);
      shader.vertexShader = 'attribute float aZooFade; varying float vZooFade;\n' + shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvZooFade = aZooFade;');
      shader.fragmentShader = 'varying float vZooFade;\n' + shader.fragmentShader.replace('#include <clipping_planes_fragment>', '#include <clipping_planes_fragment>\nfloat zooDither = fract(52.9829189 * fract(dot(floor(gl_FragCoord.xy), vec2(0.06711056, 0.00583715))));\nif (vZooFade < 0.0 ? zooDither < -vZooFade - 1.0 : zooDither >= vZooFade) discard;');
    };
    fadeMaterial.customProgramCacheKey = () => AF.mat.voxel.customProgramCacheKey() + '-zoo-fade';
    return fadeMaterial;
  };
  const appendInstance = (mesh, matrix, fade) => {
    const instance = mesh.count++;
    mesh.setMatrixAt(instance, matrix);
    mesh.geometry.attributes.aZooFade.array[instance] = fade;
    if (fade > -2 && fade < -1 || fade > 0 && fade < 1) mesh.material = zooFadeMaterial();
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
    if ((id === 'zebra' || id === 'antelope' || id === 'deer' || id === 'giraffe') && roll > 0.9) { dryTarget(an); an.state = 'run'; an.next = 'graze'; an.timer = 12; return; }
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
        const farGeo = mergeAnimal(G);
        farGeo.setAttribute('aZooFade', new THREE.InstancedBufferAttribute(new Float32Array(128), 1).setUsage(THREE.DynamicDrawUsage));
        sp.far = new THREE.InstancedMesh(farGeo, AF.mat.voxel, 128);
        sp.far.name = 'zoo:' + id + ':far'; sp.far.count = 0; sp.far.frustumCulled = false; sp.far.receiveShadow = true;
        sp.far.instanceMatrix.setUsage(THREE.DynamicDrawUsage); sp.meshes.push(sp.far); AF.scene.add(sp.far);
        const cache = new Map();
        for (const part of G.parts) {
          const key = part.name + ':' + part.geo.boundingBox.min.toArray().join(',') + ':' + part.geo.boundingBox.max.toArray().join(',');
          let mesh = cache.get(key);
          if (!mesh) {
            part.geo.setAttribute('aZooFade', new THREE.InstancedBufferAttribute(new Float32Array(128), 1).setUsage(THREE.DynamicDrawUsage));
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
          elevation: 0, sx: x, sz: z, sy: 0, acc: 0, floorAcc: 0, cooldown: 5 + k, attention: 0, pose: 0, wet: false, far: false, fade: 0 };
        if (!leader) leader = an;
        dryTarget(an); an.x = an.tx; an.z = an.tz; an.y = W.groundY(an.x, an.z);
        if (id === 'penguin') { an.x = a + pad + k * 2.4; an.z = d - pad - 3; }
        if (id === 'giraffe' && k === 0) { an.x = H.browse[0] + 1.5; an.z = H.browse[1]; an.state = 'browse'; an.timer = 8; }
        if (id === 'lion' || id === 'lioness') { an.x = H.rest[0] + (id === 'lion' ? -1.5 : k * 1.5); an.z = H.rest[1]; an.y = AF.surfaceBelow(an.x, an.z, 4, 4); an.state = 'rest'; an.timer = 8 + k * 5; }
        sp.list.push(an); Z.list.push(an);
      }
    }
    AF.on('ready', () => {
      for (const id in Z.species) for (const mesh of Z.species[id].meshes) mesh.material = zooFadeMaterial();
      AF.renderer.compile(AF.scene, AF.camera);
      for (const id in Z.species) for (const mesh of Z.species[id].meshes) mesh.material = AF.mat.voxelInst;
    });
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
    const moving = an.state === 'wander' || an.state === 'follow' || an.state === 'approach' || an.state === 'waddle' || an.state === 'swim' || an.state === 'run';
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
        const speed = an.state === 'swim' && id === 'penguin' ? 2.2 : an.state === 'run' ? S.speed * 2.6 : S.speed;
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
    if (an.floorAcc >= (an.far ? 0.9 : 0.3)) {
      an.floorAcc = 0;
      an.y = wet ? wet.y : H.id === 'primates' ? W.groundY(an.x, an.z) : AF.surfaceBelow(an.x, an.z, Math.max(W.groundY(an.x, an.z) + 1.2, an.y + 0.75), 3);
      if (!Number.isFinite(an.y)) an.y = W.groundY(an.x, an.z);
    }
    const submerge = an.state === 'dive' || an.state === 'swim';
    const lower = submerge && wet ? -an.sp.G.lift - (id === 'penguin' ? 0.45 : 0.4) : wet && (id === 'hippo' || id === 'croc') ? -an.sp.G.lift * 0.9 : 0;
    an.pose += (lower - an.pose) * Math.min(1, dt * 2);
    if (an.state === 'watch') an.attention = player ? Math.atan2(player.x - an.x, player.z - an.z) : an.yaw;
  };
  const CATS = new Set(['lion', 'lioness', 'tiger']), LIERS = new Set(['lion', 'lioness', 'tiger', 'zebra', 'antelope', 'deer', 'stag', 'giraffe', 'rhino', 'hippo', 'bear', 'croc']);
  const renderAnimal = (an, detail) => {
    const G = an.sp.G, id = an.sp.id, state = an.state, resting = state === 'rest' || state === 'sleep';
    const swimming = state === 'swim' || state === 'dive', spK = Math.min(1.6, an.v / G.S.speed), run = state === 'run' && an.v > G.S.speed * 1.3;
    // walk: diagonal pairs with a lifted knee on the swing; run: a bounding gallop (front pair, then hind pair)
    const gAmp = run ? 0.75 : 0.5, gait = Math.sin(an.phase) * gAmp * Math.min(1, spK);
    const lie = resting && LIERS.has(id) && !an.wet, cat = CATS.has(id), onOne = resting && id === 'flamingo';
    const bob = Math.abs(Math.sin(an.phase)) * (run ? 0.09 : 0.035) * Math.min(1, spK) * G.lift;
    const breathe = Math.sin(an.clock * (resting ? 1.1 : 1.7) + an.phase * 0.1) * (resting ? 0.018 : 0.01);
    const rootY = an.y + an.elevation + (G.lift + an.pose - (lie ? G.lift * (cat ? 0.82 : 0.86) : resting && id !== 'elephant' && id !== 'penguin' ? G.lift * 0.2 : 0)) * an.scale + bob * an.scale;
    const pitch = run ? Math.sin(an.phase * 2) * 0.04 : 0;
    tmpE.set(swimming && id === 'penguin' ? PI / 2 : pitch, an.yaw, id === 'penguin' && !swimming ? Math.sin(an.phase) * 0.1 * an.v : Math.sin(an.phase) * 0.02 * spK);
    tmpQ.setFromEuler(tmpE); tmpM.compose(tmpV.set(an.x, rootY, an.z), tmpQ, one.set(an.scale, an.scale, an.scale));
    const idleLook = !resting && an.v < 0.1 && state !== 'graze' && state !== 'drink' && state !== 'browse' ? Math.sin(an.clock * 0.37 + an.seed % 7) * 0.45 * Math.max(0, Math.sin(an.clock * 0.11 + an.phase)) : 0;
    const twitch = Math.max(0, Math.sin(an.clock * 0.9 + an.phase * 3) - 0.94) * 8;
    for (const part of G.parts) {
      let rx = part.rotation, ry = 0, rz = 0, sy = 1;
      const name = part.name, front = part.side < 2;
      if (name === 'leg') {
        const ph = run ? an.phase + (front ? 0 : 1.9) : an.phase + (part.side === 0 || part.side === 3 ? 0 : PI);
        rx += Math.sin(ph) * gAmp * Math.min(1, spK);
        if (lie) rx += cat ? (front ? -1.45 : 1.25) : (front ? -0.55 : 1.15);
        else if (resting && id !== 'elephant' && id !== 'penguin' && id !== 'flamingo') rx += front ? 0.12 : -0.1;
        if (onOne && part.side === 1) rx += 0.35;
        if (state === 'climb' || state === 'jump') rx += front ? -1.5 : 0.8;
      }
      if (name === 'shin') {
        const ph = run ? an.phase + (front ? 0 : 1.9) : an.phase + (part.side === 0 || part.side === 3 ? 0 : PI);
        rx += Math.max(0, -Math.cos(ph)) * (run ? 1.1 : 0.55) * Math.min(1, spK);
        if (lie) rx += cat ? (front ? 0 : -2.4) : (front ? 2.4 : -2.3);
        if (onOne && part.side === 1) rx -= 2.4;
      }
      if (name === 'neck') rx += state === 'browse' ? -0.22 : state === 'graze' ? id === 'giraffe' ? 1.8 : 0.9 : state === 'drink' ? id === 'giraffe' ? 2.5 : 1.15 : lie ? (cat ? 0.1 : 0.55) : onOne ? 1.9 : resting ? 0.3 : Math.sin(an.clock * 0.9) * 0.035 + Math.sin(an.phase * 2) * 0.05 * Math.min(1, spK) - (run ? 0.25 : 0);
      if (name === 'head') {
        rx += Math.sin(an.clock * 1.8) * 0.05 - Math.sin(an.phase * 2) * 0.04 * Math.min(1, spK);
        ry = idleLook;
        if (state === 'watch' || state === 'approach') ry = Math.max(-0.8, Math.min(0.8, AF.angDiff(an.yaw, an.attention)));
        if (lie && cat) ry = Math.sin(an.clock * 0.2 + an.phase) * 0.5;
        if (state === 'sleep') rx += cat ? 0.35 : 0.5;
      }
      if (name === 'jaw') rx = resting && id.startsWith('lion') ? Math.max(0, Math.sin(an.clock * 0.28) - 0.6) * 1.6 : state === 'graze' || state === 'browse' ? (0.5 + Math.sin(an.clock * 5) * 0.5) * 0.18 : id === 'hippo' && an.wet ? Math.max(0, Math.sin(an.clock * 0.21) - 0.8) * 5 : 0;
      if (name === 'tail' || name === 'tailTip') {
        const tip = name === 'tailTip';
        if (cat) { ry = Math.sin(an.clock * 0.9 + (tip ? 1.1 : 0)) * (tip ? 0.55 : 0.25); rx = tip ? 0.7 : lie ? -0.25 : -0.95; }
        else { ry = Math.sin(an.clock * (2.6 + twitch) + (tip ? 0.7 : 0)) * (0.25 + twitch * 0.2); rx = id === 'monkey' ? -0.9 : id === 'croc' ? 0.02 : run ? (tip ? -0.2 : -0.45) : tip ? -0.15 : -1.25; }
        if (id === 'croc') ry = Math.sin(an.phase * 0.8 + (tip ? 1 : 0)) * 0.25 * Math.min(1, spK) + Math.sin(an.clock * 0.3) * 0.05;
      }
      if (name === 'ear') rz = part.side * (id === 'elephant' ? Math.sin(an.clock * 2.5) * 0.4 : Math.sin(an.clock * 1.4) * 0.09 + twitch * 0.35);
      if (name === 'trunk') rx = state === 'spray' ? -1.5 : state === 'drink' ? 0.15 : Math.sin(an.clock * 1.2) * 0.18 + Math.sin(an.phase) * 0.12 * spK;
      if (name === 'trunkTip') rx = state === 'spray' ? -0.8 : Math.sin(an.clock * 1.2 + 0.6) * 0.3;
      if (name === 'wing') rz = part.side * (swimming ? 0.6 + Math.sin(an.clock * 8) * 0.6 : id === 'penguin' ? 0.12 + Math.abs(Math.sin(an.phase)) * 0.25 * an.v : 0.08);
      if (name === 'body') sy = 1 + breathe;
      tmpE.set(rx, ry, rz); tmpQ.setFromEuler(tmpE);
      const dropY = name === 'droplet' ? ((an.clock * 1.6 + part.side * 0.19) % 1) * 0.35 : 0;
      part.matrix.compose(tmpV.set(part.x, part.y - dropY, part.z), tmpQ, one.set(1, sy, name === 'spray' ? 0.75 + Math.sin(an.clock * 8) * 0.25 : 1));
      part.matrix.premultiply(part.parent < 0 ? tmpM : G.parts[part.parent].matrix);
      if ((name === 'spray' || name === 'droplet') && state !== 'spray') continue;
      if (!detail && (name === 'jaw' || name === 'ear' || name === 'antler' || name === 'droplet' || name === 'finger' || name === 'scute' || name === 'fold')) continue;
      appendInstance(part.mesh, part.matrix, -1 - an.fade);
    }
  };
  AF.onTick('zoo', 430, (dt) => {
    if (!Z.list.length) return;
    const cp = AF.camera.position, low = AF.GFX && AF.GFX.tier === 'low', limit = low ? 120 : 150;
    viewMatrix.multiplyMatrices(AF.camera.projectionMatrix, AF.camera.matrixWorldInverse); frustum.setFromProjectionMatrix(viewMatrix);
    Z.near = false;
    for (const id in Z.species) for (const mesh of Z.species[id].meshes) { mesh.count = 0; mesh.material = AF.mat.voxelInst; }
    for (const an of Z.list) {
      const dx = cp.x - an.x, dy = cp.y - an.y, dz = cp.z - an.z, distance = dx * dx + dy * dy + dz * dz;
      sphere.center.set(an.x, an.y + an.elevation + an.sp.G.height * 0.5, an.z); sphere.radius = Math.max(2.5, an.sp.G.height);
      if (distance > limit * limit || !frustum.intersectsSphere(sphere)) { an.acc = 0; continue; }
      Z.near = true; an.acc += dt;
      if (distance > 62 * 62) an.far = true;
      else if (distance < 52 * 52) an.far = false;
      an.fade = Math.max(0, Math.min(1, an.fade + (an.far ? dt : -dt) / 0.3));
      const interval = distance < 80 * 80 ? 0 : 0.1;
      if (an.acc >= interval) { stepAnimal(an, Math.min(an.acc, 0.5), AF.time ? AF.time.hours : 12, cp); an.acc = 0; }
      if (an.fade < 1) renderAnimal(an, true);
      if (an.fade > 0) {
        const G = an.sp.G;
        tmpE.set(an.state === 'swim' && an.sp.id === 'penguin' ? PI / 2 : 0, an.yaw, 0); tmpQ.setFromEuler(tmpE);
        tmpM.compose(tmpV.set(an.x, an.y + an.elevation + (G.lift + an.pose) * an.scale, an.z), tmpQ, one.set(an.scale, an.scale, an.scale));
        appendInstance(an.sp.far, tmpM, an.fade);
      }
    }
    for (const id in Z.species) for (const mesh of Z.species[id].meshes) {
      if (mesh.count) { mesh.layers.set(0); mesh.instanceMatrix.needsUpdate = true; mesh.geometry.attributes.aZooFade.needsUpdate = true; }
    }
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
  AF.test('zoo: merged far species preserve voxel attributes and reduce triangles', () => {
    let ok = true, near = 0, far = 0;
    for (const id in Z.species) {
      const sp = Z.species[id], geo = sp.far.geometry, attributes = geo.attributes;
      const full = sp.G.parts.reduce((total, part) => total + part.geo.index.count, 0);
      near += full; far += geo.index.count;
      ok = ok && geo.index.count < full * 0.5 && attributes.position.count === attributes.aPal.count
        && attributes.position.count === attributes.aAN.count && attributes.position.count === attributes.aBU.count
        && attributes.aZooFade.count >= sp.list.length && !sp.far.castShadow && [AF.mat.voxel, AF.mat.voxelInst].includes(sp.far.material);
      for (const value of attributes.position.array) if (!Number.isFinite(value)) ok = false;
      for (const value of geo.index.array) if (value >= attributes.position.count) ok = false;
    }
    return { ok, info: 'standing triangles ' + near / 3 + ' near, ' + far / 3 + ' far' };
  });
  AF.test('zoo: lion resting ledge has grounded natural rock', () => {
    const H = HAB.find((habitat) => habitat.id === 'lions');
    let ok = true;
    for (const offset of [-1.5, 0, 1.5]) {
      const x = H.rest[0] + offset, z = H.rest[1], y = AF.surfaceBelow(x, z, 4, 4);
      ok = ok && y >= 1 && y <= 2 && AF.solidAt(x, y - 0.125, z);
    }
    return { ok, info: 'three supported rest positions; no rectangular upper lip' };
  });
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
