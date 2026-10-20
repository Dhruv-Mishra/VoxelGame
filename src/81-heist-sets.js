// ================================================================ 81-heist-sets.js
try {
// ===== 81-heist-sets: the people, props and stealth zones of the Harbour Trust Job outside the bank (OWNER: game) =====
// Built late (940) so the island, liner, zoo den and Corsair Key have published their spots (AF.island.heist, AF.liner.spots,
// AF.den.spots, AF.key.spots); every lookup has a fallback so the job still runs if one of them is missing. 81-heist drives it all.
//   shop   Kovac's tailor shop after closing: a padlocked night grille, a maze of coat racks splitting the floor into three rooms,
//          a torch-carrying watchman on a loop in each, the uniform rail in the back room (Kovac himself goes home: AF.closedAt)
//   ezra   Ezra Quill, forger, in the back of Harbour Stationers
//   gate   the Westgate crew gate: a booth, a barrier and its guard
//   tunnel the Moretti smugglers' tunnel on Serena Isle: armed men on patrol, the arms cache
//   queen  the Solace Queen's crew deck + high-roller salon: a steward, a waiter, a dealer, the doorman, the house detective,
//          Prescott at baccarat with Celeste dealing and the pit boss watching
//   zoo    the zoo's service yard at night: the watchman, the keepers' lockers (the lions belong to 46-zoo-den)
//   key    Corsair Key: Vera, Silas, Kit and Tony Moretti for the finale, the weapons crate
{
  const PI = Math.PI, S = AF.stealth;
  const HS = AF.heistSets = { ready: false, at: {}, npc: {}, walkers: {}, zones: {}, props: {} };
  const A = HS.at, NPC = HS.npc, WKR = HS.walkers;
  const free = (x, z, yTop = 20, depth = 40) => {
    for (let r = 0; r < 14; r += 1.5) for (let a = 0; a < (r ? 8 : 1); a++) {
      const px = x + Math.sin(a * PI / 4) * r, pz = z + Math.cos(a * PI / 4) * r, y = AF.surfaceBelow(px, pz, yTop, depth);
      if (Number.isFinite(y) && y > -1.1 && !AF.boxBlocked(px, y + 0.05, pz, 0.3, 1.7)) return { x: px, y, z: pz };
    }
    const y = AF.surfaceBelow(x, z, yTop, depth); return { x, y: Number.isFinite(y) ? y : 0.5, z };
  };
  HS.free = free;
  // ---------------------------------------------------------------- the cast's looks + uniforms
  const LOOKS = HS.looks = {
    vera: { female: true, skin: 0xe8b894, hair: 0x9a2a16, hairStyle: 'wavy', lips: 0xc8202a, top: { col: 0x1d6a5a, col2: 0xd8b04a, style: 'dress' }, bottom: { col: 0x1d6a5a, style: 'skirt' }, shoe: 0x141414, height: 1.0 },
    kit: { skin: 0xc68a5e, hair: 0x2a1a10, hairStyle: 'short', glasses: 0x2a2a2e, top: { col: 0xf2efe4, col2: 0x2a4a9a, style: 'shirt' }, bottom: { col: 0x3a3a40, style: 'jeans' }, shoe: 0x4a3020, hat: 'straw', hatCol: 0xe8d8a8, height: 1.02 },
    silas: { skin: 0xefc19f, hair: 0x9a9a9a, hairStyle: 'short', top: { col: 0x6a1a24, col2: 0xf2efe4, style: 'vest' }, bottom: { col: 0x1a1a1e, style: 'jeans' }, shoe: 0x141414, extra: 'chain', height: 1.06 },
    prescott: { skin: 0xf0c8a8, hair: 0xe0dcd0, hairStyle: 'short', glasses: 0xd8b04a, top: { col: 0x22253a, col2: 0xf2efe4, style: 'shirt' }, bottom: { col: 0x22253a, style: 'jeans' }, shoe: 0x141414, height: 1.0 },
    ezra: { skin: 0xd8a888, hair: 0xb8b0a0, hairStyle: 'short', glasses: 0x2a2a2e, top: { col: 0x4a3a2a, col2: 0xe8e0d0, style: 'vest' }, bottom: { col: 0x3a3028, style: 'jeans' }, shoe: 0x2a1a10, height: 0.96 },
    gate: { skin: 0xb07a52, hair: 0x1a1410, hairStyle: 'short', top: { col: 0x2a3550, col2: 0xd8b04a, style: 'shirt' }, bottom: { col: 0x2a3550, style: 'jeans' }, shoe: 0x141414, hat: 'cap', hatCol: 0x2a3550, height: 1.04 },
    tony: { skin: 0xe0b090, hair: 0x14100c, hairStyle: 'short', top: { col: 0x2c2c34, col2: 0xd8d0c0, style: 'suit' }, bottom: { col: 0x2c2c34, style: 'jeans' }, shoe: 0x101010, height: 1.05 },
    celeste: { female: true, skin: 0xf2cfb0, hair: 0x1a1210, hairStyle: 'bun', lips: 0xb02030, top: { col: 0xf4f0e6, col2: 0x8a1424, style: 'vest' }, bottom: { col: 0x141418, style: 'skirt' }, shoe: 0x141414, height: 0.98 },
    pit: { skin: 0xe8c0a0, hair: 0x5a4a3a, hairStyle: 'part', moustache: true, top: { col: 0x141418, col2: 0xf2efe4, style: 'suit' }, bottom: { col: 0x141418, style: 'jeans' }, shoe: 0x101010, height: 1.03 },
    door: { skin: 0x8a5a3a, hair: 0x101010, hairStyle: 'short', top: { col: 0x6a1420, col2: 0xd8b04a, style: 'suit' }, bottom: { col: 0x141418, style: 'jeans' }, shoe: 0x101010, hat: 'cap', hatCol: 0x6a1420, height: 1.08 },
  };
  // uniforms worn over the player's own look (81-heist: dress(kind))
  HS.uniform = (L0, kind) => {
    const L = JSON.parse(JSON.stringify(L0)); delete L.hat; delete L.glasses;
    if (kind === 'pilot') { L.top = { style: 'suit', col: 0x1c2848, col2: 0xd8b04a }; L.bottom = { style: L.female ? 'skirt' : 'jeans', col: 0x1c2848 }; L.hat = 'cap'; L.hatCol = 0x1c2848; L.shoe = 0x111114; }
    else if (kind === 'waiter') { L.top = { style: 'shirt', col: 0xf6f2ea, col2: 0x141418 }; L.bottom = { style: 'jeans', col: 0x141418 }; L.shoe = 0x111114; }
    else if (kind === 'dealer') { L.top = { style: 'vest', col: 0xf4f0e6, col2: 0x8a1424 }; L.bottom = { style: 'jeans', col: 0x141418 }; L.shoe = 0x111114; }
    else if (kind === 'keeper') { L.top = { style: 'shirt', col: 0x8a7a4a, col2: 0x5a4a2a }; L.bottom = { style: 'jeans', col: 0x5a5030 }; L.hat = 'cap'; L.hatCol = 0x5a4a2a; L.shoe = 0x3a2a1a; }
    else if (kind === 'night') { L.top = { style: 'shirt', col: 0x1a1a1e, col2: 0x1a1a1e }; L.bottom = { style: 'jeans', col: 0x16161a }; L.shoe = 0x0c0c0e; }
    else if (kind === 'security') { L.top = { style: 'suit', col: 0x1f2a44, col2: 0xd8b04a }; L.bottom = { style: 'jeans', col: 0x1f2a44 }; L.hat = 'cap'; L.hatCol = 0x1f2a44; L.shoe = 0x111114; }
    if (kind) L.uniform = kind; else delete L.uniform;   // 47-airfield's crew gate reads look.uniform
    return L;
  };
  const npc = (id, name, role, look, at, yaw, o = {}) => {
    if (!at || !AF.npc) return null;
    const n = AF.npc.spawn(Object.assign({ id: 'heist-' + id, name, role, look, x: at.x, y: at.y, z: at.z, yaw }, o));
    NPC[id] = n; AF.npc.setHidden(n, true); return n;
  };
  const crowdLook = (role, sex, rng, top, bottom) => { const L = AF.peopleKit.makeLook(role, sex, 'adult', rng); if (top != null) L.top = Object.assign({}, L.top, { col: top }); if (bottom != null) L.bottom = Object.assign({}, L.bottom, { col: bottom }); return L; };
  const walker = (key, name, pts, o, look) => {
    try { const p = AF.walkers.addPath('heist ' + key, pts, Object.assign({ count: 1, activeRadius: 90, looks: [look] }, o)); p.enabled = false; WKR[key] = p; return p; }
    catch (e) { AF.warnOnce('heist walker ' + key, e); return null; }
  };
  const P3 = (p, dy = 0) => [p.x, p.y + dy, p.z];
  const mesh = (m, vs, anchor, x, y, z, yaw = 0) => { const g = AF.meshModel(m, { vs, anchor }); delete g.userData.src; const o = AF.modelMesh(g); o.position.set(x, y, z); o.rotation.y = yaw; o.castShadow = false; AF.scene.add(o); return o; };
  const col = (h, o) => AF.col(h, Object.assign({ jitter: 0.15, edge: 0.3 }, o));

  AF.onBuild('heist-sets', 940, () => {
    if (!AF.walkers || !AF.walkers.addPath || !AF.peopleKit || !S) return;
    const rng = AF.rng(4471), WP = AF.PLAN.world;
    // ---------------------------------------------------------------- Vera at the Blue Heron (her offer + the pause menu live in 81-heist)
    const bh = AF.buildings.find((b) => b.id === 'blue-heron'), d = bh && bh.doors[0];
    const vx = d ? d.x - Math.sin(d.yaw) * 1.6 : -20, vz = d ? d.z - Math.cos(d.yaw) * 1.6 : 100, vp = free(vx, vz, (d ? d.y : 0.5) + 2, 4), vyaw = d ? d.yaw + PI : 0;
    A.vera = vp; A.veraYaw = vyaw;
    const c0 = free(vp.x + Math.sin(vyaw) * 2.2, vp.z + Math.cos(vyaw) * 2.2, vp.y + 2, 4); A.c0 = { x: c0.x, y: c0.y, z: c0.z, yaw: vyaw + PI };
    // ---------------------------------------------------------------- the tailor's (Kovac, west Old Town) after closing: a padlocked night
    // grille across the doorway, a night watchman on a loop (window -> counter -> rail), the uniform rail behind the counter
    const tb = AF.buildings.find((b) => b.id === 'res-rs-b2-w6');
    const tx = tb ? tb.box[0] : -232, tz = tb ? tb.box[2] : -101, ty = AF.W.groundY(-226, -95) + 0.25;
    const td = tb && tb.doors[0];
    A.shopDoor = free(td ? td.x - 1.6 : -234.6, td ? td.z : -90, ty + 2, 4); A.shopDoor.yaw = PI / 2;
    A.rail = { x: tx + 11.4, y: ty, z: tz + 1.3 };
    A.shopBox = [tx - 1, ty - 1, tz - 1, tx + 14, ty + 5, tz + 14];
    HS.shopId = tb ? tb.id : null;
    // three watchmen, one per room of the rack maze below (offsets from the shop corner; every leg runs clear of the racks and crosses
    // a partition only through a doorway): front room <-> the east doorway <-> the rail room, the stockroom ring, the rail room ring
    const TP = (pts) => pts.map(([x, z]) => [tx + x, ty, tz + z]);
    walker('watch', 'Night watchman', TP([[1.8, 9.7], [11.6, 9.7], [9.0, 9.7], [9.0, 6.6], [11.8, 6.6], [9.0, 6.6], [9.0, 9.7]]), { speed: 0.8, mode: 'loop', dwell: [{ i: 0, t: 7 }, { i: 1, t: 4 }, { i: 4, t: 5 }] }, crowdLook('worker', 'm', rng, 0x2a3550, 0x22222a));
    walker('shop2', 'Night watchman', TP([[1.6, 1.8], [5.6, 1.8], [5.6, 7.4], [1.6, 7.4]]), { speed: 0.7, mode: 'loop', dwell: [{ i: 0, t: 6 }, { i: 2, t: 5 }] }, crowdLook('worker', 'm', rng, 0x33402a, 0x22222a));
    walker('shop3', 'Night watchman', TP([[7.8, 3.6], [11.8, 3.6], [11.8, 7.2], [7.8, 7.2]]), { speed: 0.75, mode: 'loop', dwell: [{ i: 1, t: 5 }, { i: 3, t: 6 }] }, crowdLook('worker', 'f', rng, 0x402a2a, 0x22222a));
    // the night grille: a steel lattice + padlock filling the doorway (a mesh + a collider; open = collider flattened, leaf hidden)
    {
      const gz = td ? td.z + 0.125 : -90, gx = tx + 0.125, steel = col(0x3a3e44, { metal: 0.8, rough: 0.4 }), brass = col(0xc9a24a, { metal: 0.9, rough: 0.3 });
      const m = new AF.Model(14, 24, 2);
      for (let x = 0; x < 14; x += 2) m.box(x, 0, 0, x + 1, 24, 1, steel);
      for (const y of [0, 7, 15, 23]) m.box(0, y, 0, 14, y + 1, 1, steel);
      for (let k = 0; k < 14; k++) { m.box(k, 1 + k, 1, k + 1, 2 + k, 2, steel); m.box(13 - k, 1 + k, 1, 14 - k, 2 + k, 2, steel); }
      m.box(5, 9, 1, 9, 12, 2, brass); m.box(6, 12, 1, 8, 14, 2, steel);
      const mesh0 = mesh(m, 1 / 8, [0.5, 0, 0.5], gx, ty, gz, PI / 2); mesh0.visible = false;
      const c = AF.addCollider(gx - 0.2, ty, gz - 0.875, gx + 0.2, ty + 3, gz + 0.875, 'heist-shop-grille');
      HS.props.grille = mesh0;
      HS.grille = (shut) => { c.y1 = shut ? ty + 3 : ty + 1e-6; mesh0.visible = !!shut; };
      HS.grille(false);
      A.grille = { x: gx - 0.9, y: ty, z: gz };
    }
    // the rail of finished uniforms
    { const m = new AF.Model(16, 16, 4), steel = col(0x8a8f96, { metal: 0.8 }), navy = col(0x1c2848), gold = col(0xd8b04a, { metal: 0.7 }); m.box(0, 0, 1, 1, 16, 3, steel); m.box(15, 0, 1, 16, 16, 3, steel); m.box(0, 15, 1, 16, 16, 3, steel);
      for (let k = 0; k < 5; k++) { m.box(2 + k * 2.6, 5, 0, 4 + k * 2.6, 15, 4, navy); m.box(2 + k * 2.6, 13, 0, 4 + k * 2.6, 14, 4, gold); } HS.props.rail = mesh(m, 1 / 8, [0.5, 0, 0.5], A.rail.x, A.rail.y, A.rail.z, PI / 2); HS.props.rail.visible = false; }
    // the stock maze: 1.9 m coat racks packed with clothes (the watchmen's torches can't see through them — they're colliders) partition
    // the shop floor into three rooms joined by doorways >= 1.4 m: the front room by the door, the stockroom (west, behind it) and the
    // rail room (east, the uniform rail at its back). Sneak route: door -> front room (cover rack) -> the west doorway -> stockroom (round
    // its island) -> the middle doorway -> rail room (round its island) -> the rail. The watchmen's loops above cross partitions only
    // at doorways. All racks are one merged mesh (one draw, burglary only); colliders are solid only then (HS.racks).
    {
      const steel = col(0x5a5e66, { metal: 0.8, rough: 0.4 }), cloth = [0x2a3550, 0x6a2a2a, 0x3a4a32, 0x8a7a60, 0x4a3a2a, 0x22222a, 0x7a6a8a, 0xd8d0c0].map((h) => col(h));
      const m = new AF.Model(16, 15, 4);
      m.box(0, 0, 0, 1, 15, 4, steel); m.box(15, 0, 0, 16, 15, 4, steel); m.box(0, 14, 1, 16, 15, 3, steel);
      for (let x = 1, k = 0; x < 15; x += 2, k++) { const low = 2 + ((k * 5) % 4); m.box(x, low, 0, x + 2, 14, 4, cloth[k % cloth.length]); m.box(x, 13, 1, x + 2, 14, 3, cloth[(k + 3) % cloth.length]); }
      // [x, z offset of the rack's centre from the shop's corner, along x (else along z)]
      const RACKS = [
        [3.4, 8.4, 1], [5.4, 8.4, 1], [7.4, 8.4, 1], [11.2, 8.4, 1],   // front | back partition: west doorway x 1.0..2.4, east doorway x 8.4..10.2
        [6.8, 6.6, 0], [6.8, 2.0, 0],                                    // stockroom | rail room partition: doorway z 3.0..5.6
        [4.2, 11.4, 0],                                                  // front room cover by the door
        [3.6, 4.6, 0],                                                   // stockroom island
        [9.8, 5.4, 1], [9.8, 1.8, 0],                                    // rail room island + the screen beside the rail
      ];
      // keep clear of the shop's own furniture (41-homes-2 places it with untagged colliders, mirrored per house): a rack that would
      // overlap one slides along its length by up to 1 m, else it is left out (the partitions keep their doorways either way)
      const blocked = (x0, z0, x1, z1) => {
        for (let i = Math.floor(x0 / 8); i <= Math.floor(x1 / 8); i++) for (let k = Math.floor(z0 / 8); k <= Math.floor(z1 / 8); k++) {
          const a = AF.colliders.get(i * 100000 + k); if (a) for (const b of a) {
            if (b.tag || b.y1 <= ty + 0.1 || b.y0 >= ty + 1.9) continue;
            if (b.x1 - b.x0 > 6 || b.z1 - b.z0 > 6) continue;   // walls / whole-house boxes, not furniture
            if (b.x0 < x1 - 0.1 && b.x1 > x0 + 0.1 && b.z0 < z1 - 0.1 && b.z1 > z0 + 0.1) return true;
          }
        }
        return false;
      };
      const placed = [];
      for (const [ox, oz, alongX] of RACKS) {
        const hx = alongX ? 1 : 0.25, hz = alongX ? 0.25 : 1;
        for (const s of [0, 0.5, -0.5, 1, -1]) {
          const px = ox + (alongX ? s : 0), pz = oz + (alongX ? 0 : s);
          if (px - hx < 0.1 || pz - hz < 0.1 || px + hx > 12.9 || pz + hz > 12.9) continue;
          if (!blocked(tx + px - hx, tz + pz - hz, tx + px + hx, tz + pz + hz)) { placed.push([px, pz, alongX]); break; }
        }
      }
      HS.rackLayout = placed; HS.rackSkipped = RACKS.length - placed.length;
      // the rail must stand in the open: step it toward the room's middle until no furniture collider holds it
      for (let k = 0; k < 8 && blocked(A.rail.x - 0.3, A.rail.z - 0.3, A.rail.x + 0.3, A.rail.z + 0.3); k++) { A.rail.x -= 0.5; A.rail.z += 0.4; }
      if (HS.props.rail) HS.props.rail.position.set(A.rail.x, A.rail.y, A.rail.z);
      const MW = 104, MD = 104, maze = new AF.Model(MW, 15, MD);   // 13 m x 13 m at 1/8 m
      const racks = placed.map(([ox, oz, alongX]) => {
        const hx = alongX ? 1 : 0.25, hz = alongX ? 0.25 : 1, x0 = Math.round((ox - hx) * 8), z0 = Math.round((oz - hz) * 8);
        for (let i = 0; i < 16; i++) for (let y = 0; y < 15; y++) for (let k = 0; k < 4; k++) { const c = m.get(i, y, k); if (c) maze.set(alongX ? x0 + i : x0 + k, y, alongX ? z0 + k : z0 + i, c); }
        const x = tx + ox, z = tz + oz;
        return AF.addCollider(x - hx, ty, z - hz, x + hx, ty + 1e-6, z + hz, 'heist-shop-rack');
      });
      const o = mesh(maze, 1 / 8, [0, 0, 0], tx, ty, tz, 0); o.visible = false; HS.props.racks = o;
      HS.racks = (on) => { o.visible = !!on; for (const c of racks) c.y1 = ty + (on ? 1.9 : 1e-6); };
    }
    // ---------------------------------------------------------------- Ezra in the back of Harbour Stationers
    const st = AF.buildings.find((b) => b.id === 'bs-stationer');
    A.ezra = st ? { x: st.box[0] + 7.8, y: 0.5, z: st.box[2] + 10.5 } : { x: 45.8, y: 0.5, z: 98.5 };
    A.ezraDoor = free(st && st.doors[0] ? st.doors[0].x : 43, st && st.doors[0] ? st.doors[0].z - 1.6 : 85.4, 3, 4); A.ezraDoor.yaw = 0;
    npc('ezra', 'Ezra Quill', 'Printer \u00b7 papers of every kind', LOOKS.ezra, A.ezra, -PI / 2, { greet: ['Shop\u2019s shut. Unless Vera sent you.'], lines: [['Paper, ink, a steady hand. That\u2019s all a man needs.']] });
    // ---------------------------------------------------------------- the Westgate crew gate: 47-airfield builds it in the perimeter fence
    // (booth, sliding gate); the heist's gate guard stands at its barrier on the landside verge
    const AIR = AF.PLAN.west.air, CG = AIR.crewGate;
    if (CG) { A.gate = { x: CG.guard.x, y: CG.guard.y, z: CG.guard.z }; A.gateYaw = CG.guard.yaw; }
    else { A.gate = free(AIR.terminal[0] - 4, AIR.terminal[1] - 14, 12, 20); A.gateYaw = PI; }
    npc('gate', 'Gate guard', 'Westgate crew gate', LOOKS.gate, A.gate, A.gateYaw, { greet: ['Crew gate. Papers ready, please.'], lines: [['Crew and pilots only past this point.']] });
    // ---------------------------------------------------------------- Serena Isle: Kit on the terrace, the smugglers' tunnel
    const I = WP.island, IH = (AF.island && AF.island.heist) || {};
    const strip = I.airstrip;
    A.strip = AF.island && AF.island.spots && AF.island.spots.strip ? AF.island.spots.strip : { x: (strip.x0 + strip.x1) / 2, y: AF.W.groundY((strip.x0 + strip.x1) / 2, strip.z), z: strip.z };
    A.c2 = free(A.strip.x - 40, strip.z + 14, A.strip.y + 12, 24); A.c2.yaw = 0;
    const kit = IH.kit || free(I.cx - 89, I.cz + 46, 14, 24);
    A.kit = { x: kit.x, y: kit.y, z: kit.z }; A.kitYaw = kit.yaw ?? PI;
    // the meeting point stays on Kit's own floor (the Sky Terrace is a storey up; never drop to the ground below it)
    const mx = A.kit.x + Math.sin(A.kitYaw) * 2.2, mz = A.kit.z + Math.cos(A.kitYaw) * 2.2, km = free(mx, mz, A.kit.y + 2, 4);
    A.kitMeet = Math.abs(km.y - A.kit.y) < 1 ? { x: km.x, y: km.y, z: km.z, yaw: A.kitYaw + PI } : { x: mx, y: A.kit.y, z: mz, yaw: A.kitYaw + PI };
    npc('kit', 'Kit Morrow', 'Harbour Trust clerk \u00b7 on holiday', LOOKS.kit, A.kit, A.kitYaw, { greet: ['Over here. Quietly.'], lines: [['Keep your voices down.']] });
    A.tunnelEntry = IH.tunnelEntry || free(I.cone.x - 60, I.cone.z - 40 + (I.cz - 600), 60, 60);
    A.cache = IH.cache || A.tunnelEntry;
    A.caveExit = IH.caveExit || A.tunnelEntry; A.cove = IH.cove || A.caveExit;
    A.skis = IH.skis || [];
    const tl = IH.tunnel && IH.tunnel.length ? IH.tunnel : [P3(A.tunnelEntry), P3(A.cache), P3(A.caveExit)];
    A.racks = IH.racks || []; A.waveSpawns = IH.waveSpawns && IH.waveSpawns.length ? IH.waveSpawns.map((p) => ({ x: p[0], y: p[1], z: p[2] })) : [A.tunnelEntry, A.caveExit];
    A.cacheStand = IH.cacheStand || A.cache;
    { let x0 = 1e9, y0 = 1e9, z0 = 1e9, x1 = -1e9, y1 = -1e9, z1 = -1e9; for (const p of tl.concat([P3(A.tunnelEntry), P3(A.cache), P3(A.caveExit)], IH.nav ? IH.nav.pts : [])) { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); z0 = Math.min(z0, p[2]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); z1 = Math.max(z1, p[2]); }
      A.tunnelBox = [x0 - 8, y0 - 6, z0 - 8, x1 + 8, y1 + 8, z1 + 8]; }
    const mob = () => crowdLook('worker', 'm', rng, 0x2c2c34, 0x26262c);
    const nav = IH.nav && IH.nav.pts.length > 1 ? { pts: IH.nav.pts.map((p) => p.slice()), links: IH.nav.links.map((l) => l.slice()) } : tl.length > 1 ? { pts: tl.map((p) => p.slice()), links: tl.slice(1).map((_, i) => [i, i + 1]) } : null;
    // alarm up: two hunt the crew through the maze, the rest hold the tube past its way out (then its way in) and wait
    const tzn = HS.zones.tunnel = S.define('tunnel', { box: A.tunnelBox, mode: 'fight', voice: 'm1', reflexS: 1.8, radius: 80, nav, holds: IH.holds, hunters: 2 });
    // every Moretti man walks a beat (the tube legs, three through the stash maze, the depot, the dock): none stands still
    const routes = IH.guardRoutes && IH.guardRoutes.length ? IH.guardRoutes : [[P3(A.cache, 0), [A.cache.x + 4, A.cache.y, A.cache.z]]];
    routes.slice(0, 9).forEach((r, i) => { if (r.length < 2) r = [r[0], [r[0][0] + 3, r[0][1], r[0][2]]]; const p = walker('tunnel' + i, 'Moretti', r, { speed: 0.82 + (i % 3) * 0.09, mode: 'pingpong', dwell: [{ i: 0, t: 3 + (i % 3) * 1.5 }, { i: r.length - 1, t: 4 + (i % 2) }] }, mob(i)); if (p) S.guard('tunnel', { path: p, voice: i % 2 ? 'm2' : 'm1', name: 'Moretti', range: 14 }); });
    // reinforcements for the siege at the cache (81-heist sends them in waves): off stage until S.spawn
    HS.reserve = [];
    for (let k = 0; k < 12; k++) { const p = walker('wave' + k, 'Moretti', [[A.cache.x, A.cache.y - 40, A.cache.z]], { speed: 0 }, mob()); if (p) { const g = S.guard('tunnel', { path: p, voice: k % 2 ? 'm2' : 'm1', name: 'Moretti', range: 20, reserve: true }); if (g) { g.down = true; g.hid = true; HS.reserve.push(g); } } }
    tzn.hides = [];
    if (IH.maze) tzn.hides.push({ x: IH.maze.far[0], y: IH.maze.far[1], z: IH.maze.far[2], r: 1.4, label: 'in the dead end' });
    for (const gp of (IH.guardPosts || []).slice(0, 2)) tzn.hides.push({ x: gp.x, y: gp.y, z: gp.z, r: 1.4, label: 'behind the crates' });
    // ---------------------------------------------------------------- the Solace Queen: crew deck + salon (one zone: staff go anywhere, guests nowhere)
    const LS = (AF.liner && AF.liner.spots) || {};
    const L0 = AF.liner ? { x: AF.liner.x, y: 1.5, z: AF.liner.z } : { x: -225, y: 1.5, z: 1450 };
    const sp = (k, dx = 0, dz = 0) => LS[k] || { x: L0.x + dx, y: L0.y, z: L0.z + dz, yaw: 0 };
    A.pontoon = sp('pontoon', -10, 16); A.pontoon.y = A.pontoon.y ?? -0.5;
    A.c4 = { x: A.pontoon.x, y: A.pontoon.y, z: A.pontoon.z, yaw: PI };
    A.staffDoor = sp('staffDoor', -20, 5); A.pantry = sp('pantry', -30, -6); A.crewLounge = sp('crewLounge', -36, 6); A.crewStairs = sp('crewStairs', -40, 0);
    A.salonDoor = sp('salonDoor', -30, 0); A.salon = sp('salon', -40, 0); A.prescott = sp('prescottSeat', -42, 0); A.dealer = sp('salonDealer', -42, 2);
    A.serve = sp('serve', -43, -1); A.salonBar = sp('salonBar', -36, 4); A.silas = sp('silas', -60, 0); A.silasMeet = sp('silasMeet', -58, 0); A.launch = sp('launch', -10, 20);
    A.cloak = sp('cloak', -10, -8); A.salonGuard = sp('salonGuard', -31, 1);
    const pts = (k, fb) => (Array.isArray(LS[k]) && LS[k].length > 1 ? LS[k] : fb);
    const qb = [1e9, 1e9, 1e9, -1e9, -1e9, -1e9];
    for (const p of [A.staffDoor, A.pantry, A.crewLounge, A.crewStairs, A.salonDoor, A.salon, A.prescott, A.serve, A.salonBar]) { qb[0] = Math.min(qb[0], p.x); qb[1] = Math.min(qb[1], p.y); qb[2] = Math.min(qb[2], p.z); qb[3] = Math.max(qb[3], p.x); qb[4] = Math.max(qb[4], p.y); qb[5] = Math.max(qb[5], p.z); }
    A.queenBox = [L0.x - 97, -2, L0.z - 30, L0.x + 97, 26, L0.z + 28];
    // the whole ship is a high-security zone: staff areas need a uniform, a weapon in hand or a body over the shoulder is an instant
    // alarm, and so is any violence a guard sees (81-heist fails the job on the alarm). Bodies must be hidden.
    const qz = S.define('queen', { box: A.queenBox, mode: 'fight', strict: true, voice: 'g3', reflexS: 2.2, radius: 70, sight: 0.9 });
    {
      const U = (u, y, v) => ({ x: L0.x + u, y, z: L0.z + v }), F1 = 1.5, F3 = 11.5;
      qz.hides = [
        Object.assign(U(55.6, F1, 4.6), { r: 1.5, label: 'in the laundry hamper' }), Object.assign(U(52, F1, -12), { r: 1.5, label: 'in a crew locker' }),
        ...[-44, -12, 20, 48].flatMap((u) => [Object.assign(U(u, F3, -13.6), { r: 2.4, label: 'over the side' }), Object.assign(U(u, F3, 13.6), { r: 2.4, label: 'over the side' })]),
      ];
      // ship's security: six armed officers on their beats (crew corridor, casino floor, atrium + purser's cage, both promenades, sun deck)
      const sec = (k, pts, mode, speed) => {
        const L = crowdLook('worker', 'm', rng, 0x1f2a44, 0x1f2a44); L.hat = 'cap'; L.hatCol = 0x1f2a44;
        const p = walker('sec' + k, 'Ship security', pts.map(([u, y, v]) => [L0.x + u, y, L0.z + v]), { speed, mode, dwell: [{ i: 0, t: 3 + k }] }, L);
        if (p) { const g = S.guard('queen', { path: p, voice: k % 2 ? 'g1' : 'g3', name: 'Ship security', range: 16, role: 'security' }); if (g) HS.secG.push(g); }
      };
      HS.secG = [];
      sec(0, [[-80, F1, 12.2], [56, F1, 12.2]], 'pingpong', 0.9);
      sec(1, [[-20, F1, -6.2], [40, F1, -6.2], [40, F1, 6.2], [-20, F1, 6.2]], 'loop', 0.8);
      sec(2, [[-52, F1, -6.5], [-30, F1, -6.5], [-30, F1, 6.5], [-52, F1, 6.5]], 'loop', 0.75);
      sec(3, [[-56, F3, -12.8], [62, F3, -12.8]], 'pingpong', 0.95);
      sec(4, [[62, F3, 12.8], [-56, F3, 12.8]], 'pingpong', 0.9);
      sec(5, [[-40, 16.5, -7], [20, 16.5, -7]], 'pingpong', 0.85);
    }
    const stew = walker('steward', 'Steward', pts('stewardPath', [P3(A.staffDoor), P3(A.pantry), P3(A.crewLounge)]), { speed: 0.9, mode: 'loop', dwell: [{ i: 0, t: 4 }] }, crowdLook('worker', 'm', rng, 0xf2efe4, 0x141418));
    if (stew) S.guard('queen', { path: stew, voice: 'g3', name: 'Steward', range: 13, armed: false });
    const waiter = walker('waiter', 'Waiter', [P3(A.pantry)], { speed: 0, yaw: A.pantry.yaw || 0 }, crowdLook('worker', 'm', rng, 0xf6f2ea, 0x141418));
    if (waiter) HS.waiterG = S.guard('queen', { path: waiter, voice: 'g1', name: 'Waiter', range: 8, armed: false, role: 'waiter' });
    const dealer = walker('dealer', 'Dealer', [P3(A.crewLounge)], { speed: 0, yaw: A.crewLounge.yaw || 0 }, crowdLook('worker', 'm', rng, 0xf4f0e6, 0x141418));
    if (dealer) HS.dealerG = S.guard('queen', { path: dealer, voice: 'g2', name: 'Dealer', range: 8, armed: false, role: 'dealer' });
    const det = walker('detective', 'House detective', pts('detectivePath', [P3(A.salon), [A.salon.x + 4, A.salon.y, A.salon.z], [A.salon.x + 4, A.salon.y, A.salon.z + 4]]), { speed: 0.7, mode: 'loop', dwell: [{ i: 0, t: 5 }] }, crowdLook('worker', 'm', rng, 0x3a3a42, 0x2a2a30));
    if (det) HS.detG = S.guard('queen', { path: det, voice: 'g4', name: 'House detective', range: 15 });
    npc('door', 'Doorman', 'High Rollers\u2019 Salon', LOOKS.door, A.salonGuard, A.salonGuard.yaw || 0, { greet: ['Members and staff only.'], lines: [['Members and staff only, I\u2019m afraid.']] });
    npc('prescott', 'Mr Prescott', 'Manager \u00b7 the Harbour Trust', LOOKS.prescott, A.prescott, A.prescott.yaw || 0, { pose: 'sit', seatH: 0.72, greet: ['Banco!'], lines: [['Eighteen inches of steel, my vault. Safest place on the coast.']] });
    npc('celeste', 'Celeste', 'Dealer \u00b7 the salon', LOOKS.celeste, A.dealer, A.dealer.yaw || 0, { greet: ['Place your bets.'], lines: [['Player or banker, sir?']] });
    npc('pit', 'Mr Vance', 'Pit boss \u00b7 the salon', LOOKS.pit, { x: A.dealer.x + Math.cos(A.dealer.yaw || 0) * 1.8, y: A.dealer.y, z: A.dealer.z - Math.sin(A.dealer.yaw || 0) * 1.8 }, (A.dealer.yaw || 0), { greet: ['Good evening.'], lines: [['The salon thanks you for your discretion.']] });
    npc('silas', 'Silas Crane', 'Owner \u00b7 the Grand Casino', LOOKS.silas, A.silas, A.silas.yaw || 0, { greet: ['The house always wins, friend.'], lines: [['If you ever need something kept safe, come and see me.']] });
    if (NPC.silas) AF.npc.setHidden(NPC.silas, false);
    // the salon door: the doorman lets staff through, stops guests (a collider the heist opens per player)
    // (the liner's own doors stay as they are; this is an invisible velvet rope)
    A.salonRope = AF.addCollider(A.salonDoor.x - 0.8, A.salonDoor.y, A.salonDoor.z - 0.8, A.salonDoor.x + 0.8, A.salonDoor.y + 2.6, A.salonDoor.z + 0.8, 'heist-salon-rope');
    A.salonRope.y1 = A.salonRope.y0 + 1e-6;
    // ---------------------------------------------------------------- the zoo at night: watchman + lockers (+ 46-zoo-den's lions)
    const DS = (AF.den && AF.den.spots) || {}, ZOO = AF.PLAN.west.zoo;
    A.zooYard = DS.yard || free((ZOO.x0 + ZOO.x1) / 2, ZOO.z0 + 30, 6, 10);
    A.locker = DS.locker || A.zooYard; A.hatch = DS.hatch || A.zooYard; A.server = DS.server || A.zooYard; A.manhole = DS.manhole || A.zooYard; A.street = DS.street || A.zooYard; A.denGate = DS.denGate || A.zooYard;
    const zb = [1e9, -20, 1e9, -1e9, 30, -1e9]; for (const p of [A.zooYard, A.locker, A.hatch, A.denGate]) { zb[0] = Math.min(zb[0], p.x); zb[2] = Math.min(zb[2], p.z); zb[3] = Math.max(zb[3], p.x); zb[5] = Math.max(zb[5], p.z); }
    A.zooBox = [zb[0] - 25, -20, zb[2] - 25, zb[3] + 25, 30, zb[5] + 25];
    S.define('zoo', { box: A.zooBox, mode: 'fail', voice: 'zw', reflexS: 2.0, radius: 80 });
    const wpath = DS.watchPath && DS.watchPath.length > 1 ? DS.watchPath : [P3(A.zooYard), [A.zooYard.x + 10, A.zooYard.y, A.zooYard.z], [A.zooYard.x + 10, A.zooYard.y, A.zooYard.z + 8]];
    const watch = walker('watchman', 'Night watchman', wpath, { speed: 0.9, mode: 'loop', dwell: [{ i: 0, t: 6 }] }, crowdLook('worker', 'm', rng, 0x2a3550, 0x2a3550));
    if (watch) S.guard('zoo', { path: watch, voice: 'zw', name: 'Watchman', range: 15, armed: false });
    // ---------------------------------------------------------------- Corsair Key: the finale's cast + Silas's crate
    const KS = (AF.key && AF.key.spots) || {}, K = WP.key, F = KS.fight || {};
    A.keyStrip = K ? { x: (K.airstrip.x0 + K.airstrip.x1) / 2, y: K.airstrip.y, z: K.airstrip.z } : { x: 560, y: 2, z: 3176 };
    A.stash = KS.stash || free(K ? K.hangar.x - 4 : 606, K ? K.hangar.z - 15 : 3183, 10, 20);
    A.c8 = KS.land || { x: A.keyStrip.x, y: A.keyStrip.y, z: A.keyStrip.z + 14, yaw: PI / 2 };
    A.fight = F.centre || A.stash; A.crate = F.crate || free(A.stash.x + 4, A.stash.z + 2, A.stash.y + 4, 8);
    A.goonSpawns = F.goonSpawns && F.goonSpawns.length ? F.goonSpawns : Array.from({ length: 8 }, (_, i) => { const a = i / 8 * PI * 2; return free(A.fight.x + Math.sin(a) * 26, A.fight.z + Math.cos(a) * 26, A.fight.y + 10, 20); });
    A.silasRun = F.silasRun && F.silasRun.length ? F.silasRun : [P3(A.stash), K ? [K.dock.x, K.dock.y, K.dock.z] : P3(A.stash)];
    const sv = free(A.stash.x - 1.3, A.stash.z + 0.8, A.stash.y + 3, 6), ss = free(A.stash.x + 1.3, A.stash.z + 0.8, A.stash.y + 3, 6), sk = free(A.stash.x + 3.0, A.stash.z + 1.4, A.stash.y + 3, 6), st2 = free(A.stash.x - 3.2, A.stash.z + 1.6, A.stash.y + 3, 6);
    npc('vera2', 'Vera Lark', 'Planner', LOOKS.vera, sv, PI, { greet: ['There they are.'], lines: [['Not now, darling.']] });
    npc('silas2', 'Silas Crane', 'Corsair Key', LOOKS.silas, ss, PI, { greet: ['Welcome to my island.'], lines: [['Nobody asks questions on Corsair Key.']] });
    npc('kit2', 'Kit Morrow', 'Corsair Key', LOOKS.kit, sk, PI, { greet: ['Hey. Made it.'], lines: [['Long night, huh?']] });
    npc('tony', 'Tony Moretti', 'The Moretti family', LOOKS.tony, st2, PI, { greet: ['...'], lines: [['...']] });
    const fm = free(A.stash.x, A.stash.z - 2.6, A.stash.y + 3, 6); A.finaleMeet = { x: fm.x, y: fm.y, z: fm.z, yaw: 0 };
    { const m = new AF.Model(12, 7, 7), wood = col(0x6a5a3a, { pat: 'plank' }), olive = col(0x4a5a2e), stencil = col(0xe8e0c0); m.box(0, 0, 0, 12, 6, 7, wood); m.box(0, 6, 0, 12, 7, 7, olive); m.box(4, 2, 7, 8, 4, 7, stencil);
      HS.props.crate = mesh(m, 1 / 8, [0.5, 0, 0.5], A.crate.x, A.crate.y, A.crate.z, A.crate.yaw || 0); HS.props.crate.visible = false; }
    // the jet-ski chase after the cove (81-heist): eight Moretti riders, steered by the heist (actor.ctl), off stage until then
    try {
      const looks = []; for (let k = 0; k < 8; k++) { const L = mob(); L.pose = 'ride'; L.yaw = 0; looks.push(L); }
      // two far-apart points: the path's bounds span the whole chase area (it stays active wherever the riders are steered)
      const p = AF.walkers.addPath('heist chase riders', [[A.cove.x - 500, -60, A.cove.z - 500], [A.cove.x + 500, -60, A.cove.z + 500]], { count: 8, speed: 0, activeRadius: 600, looks });
      p.enabled = false; WKR.chase = p;
      for (const a of p.actors) { a.ctl = { x: A.cove.x, y: -60, z: A.cove.z, yaw: 0, moving: false, ph: 0 }; a.weapon = 'tommy'; }
    } catch (e) { AF.warnOnce('heist chase riders', e); }
    // ---------------------------------------------------------------- Southfield Farm at midnight (Act IV prologue): Moretti's armoured car in the
    // yard east of the farmhouse, a crate of launchers beside it, six armed men on rounds (stealth zone 'farm', alarm = a gunfight)
    try {
      const site = AF.outlandSites && AF.outlandSites.sites.find((s) => s.name === 'Southfield Farm');
      const sx = site ? site.x : -820, sz = site ? site.z : 48, sy = site ? site.y : AF.W.groundY(-820, 48);
      const at = (dx, dz, yaw = 0) => ({ x: sx + dx, y: sy, z: sz + dz, yaw });
      A.farm = at(6, 0); A.farmGate = at(6, 36); A.farmYard = at(6, 10);
      A.armor = at(6, 13, 0); A.farmCrate = at(2.2, 9.5, PI / 2); A.farmName = site ? site.name : 'Southfield Farm';
      A.farmBox = [sx - 48, sy - 4, sz - 40, sx + 48, sy + 24, sz + 48];
      const FP = (pts) => pts.map(([dx, dz]) => [sx + dx, sy, sz + dz]);
      const ROUTES = [
        { pts: [[1, 7], [12, 7], [12, 19], [1, 19]], mode: 'loop', speed: 0.8, dwell: [{ i: 0, t: 5 }, { i: 2, t: 5 }] },   // round the car
        { pts: [[2, 27], [11, 27]], mode: 'pingpong', speed: 0.7, dwell: [{ i: 0, t: 6 }, { i: 1, t: 6 }] },                // the driveway gap
        { pts: [[-9, -12], [9, -12]], mode: 'pingpong', speed: 0.75, dwell: [{ i: 0, t: 4 }, { i: 1, t: 4 }] },             // behind the farmhouse
        { pts: [[33, -8], [33, 13]], mode: 'pingpong', speed: 0.8, dwell: [{ i: 0, t: 5 }, { i: 1, t: 3 }] },                // past the barn + silo
        { pts: [[-21, -10], [-21, 9]], mode: 'pingpong', speed: 0.7, dwell: [{ i: 0, t: 6 }, { i: 1, t: 4 }] },              // the orchard
        { pts: [[4.2, 5.2], [5.2, 5.2]], mode: 'pingpong', speed: 0.4, dwell: [{ i: 0, t: 14 }, { i: 1, t: 9 }] },          // the crate's minder
      ];
      const fz = HS.zones.farm = S.define('farm', { box: A.farmBox, mode: 'fight', voice: 'm1', reflexS: 2.0, radius: 110, hunters: 3 });
      HS.farmG = [];
      ROUTES.forEach((r, i) => {
        const p = walker('farm' + i, 'Moretti', FP(r.pts), { speed: r.speed, mode: r.mode, dwell: r.dwell, activeRadius: 140 }, mob(i));
        if (p) { const g = S.guard('farm', { path: p, voice: i % 2 ? 'm2' : 'm1', name: 'Moretti guard', range: 15, torch: i < 3 ? { range: 11, cone: 0.75, eye: 1.4 } : null }); if (g) HS.farmG.push(g); }
      });
      void fz;
      // the crate of launchers (olive, stencilled), hidden outside the farm scene
      const m = new AF.Model(14, 7, 7), wood = col(0x5a4a2e, { pat: 'plank' }), olive = col(0x46522c), stencil = col(0xe8d070);
      m.box(0, 0, 0, 14, 6, 7, wood); m.box(0, 6, 0, 14, 7, 7, olive); m.box(3, 2, 7, 11, 4, 7, stencil); m.box(0, 0, 3, 14, 6, 4, olive);
      HS.props.farmCrate = mesh(m, 1 / 8, [0.5, 0, 0.5], A.farmCrate.x, A.farmCrate.y, A.farmCrate.z, A.farmCrate.yaw); HS.props.farmCrate.visible = false;
    } catch (e) { AF.warnOnce('heist farm', e); }
    HS.ready = true;
  });
  // the watchman + the guards only walk while their scene is on (81-heist toggles them)
  HS.show = (key, on) => { const p = WKR[key]; if (p) p.enabled = !!on; };
  HS.showNpc = (key, on) => { const n = NPC[key]; if (n) { AF.npc.setHidden(n, !on); if (!on && n.root) n.root.rotation.x = 0; } };
  // Kovac's is shut while the burglary is on: no shopkeepers at its counters (55's extras ask)
  HS.shopShut = false;
  { const prev = AF.closedAt; AF.closedAt = (b) => (HS.shopShut && b === HS.shopId) || (prev ? prev(b) : false); }
}
} catch (e) { AF.partError('81-heist-sets.js', e); }
