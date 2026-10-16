// ================================================================ 81-heist-sets.js
try {
// ===== 81-heist-sets: the people, props and stealth zones of the Harbour Trust Job outside the bank (OWNER: game) =====
// Built late (940) so the island, liner, zoo den and Corsair Key have published their spots (AF.island.heist, AF.liner.spots,
// AF.den.spots, AF.key.spots); every lookup has a fallback so the job still runs if one of them is missing. 81-heist drives it all.
//   shop   Kovac's tailor shop after closing: a padlocked night grille, a night watchman on a loop (window -> counter -> rail), coat
//          racks to hide behind, the uniform rail behind the counter (Kovac himself goes home: AF.closedAt)
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
    walker('watch', 'Night watchman', [[tx + 3.2, ty, tz + 4.2], [tx + 10.4, ty, tz + 7.1], [tx + 10.6, ty, tz + 2.2]], { speed: 0.8, mode: 'loop', dwell: [{ i: 0, t: 8 }, { i: 1, t: 5 }, { i: 2, t: 4 }] }, crowdLook('worker', 'm', rng, 0x2a3550, 0x22222a));
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
    // coat racks packed with stock across the shop floor: 1.9 m screens the watchman can't see through, set clear of his loop, so
    // there's a way from the door to the rail from cover to cover. Out only for the burglary (HS.racks); solid only then.
    {
      const steel = col(0x5a5e66, { metal: 0.8, rough: 0.4 }), cloth = [0x2a3550, 0x6a2a2a, 0x3a4a32, 0x8a7a60, 0x4a3a2a, 0x22222a, 0x7a6a8a, 0xd8d0c0].map((h) => col(h));
      const m = new AF.Model(16, 15, 4);
      m.box(0, 0, 0, 1, 15, 4, steel); m.box(15, 0, 0, 16, 15, 4, steel); m.box(0, 14, 1, 16, 15, 3, steel);
      for (let x = 1, k = 0; x < 15; x += 2, k++) { const low = 2 + ((k * 5) % 4); m.box(x, low, 0, x + 2, 14, 4, cloth[k % cloth.length]); m.box(x, 13, 1, x + 2, 14, 3, cloth[(k + 3) % cloth.length]); }
      // [x, z offset from the shop's corner, along x (else along z)]
      const RACKS = [[3.0, 7.6, 1], [6.4, 9.0, 1], [9.0, 9.4, 0], [7.2, 4.5, 1], [1.8, 3.2, 0], [4.6, 2.4, 1]];
      const racks = RACKS.map(([ox, oz, alongX]) => {
        const x = tx + ox, z = tz + oz, hx = alongX ? 1 : 0.25, hz = alongX ? 0.25 : 1;
        const o = mesh(m, 1 / 8, [0.5, 0, 0.5], x, ty, z, alongX ? 0 : PI / 2); o.visible = false;
        return { o, c: AF.addCollider(x - hx, ty, z - hz, x + hx, ty + 1e-6, z + hz, 'heist-shop-rack') };
      });
      HS.racks = (on) => { for (const r of racks) { r.o.visible = !!on; r.c.y1 = ty + (on ? 1.9 : 1e-6); } };
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
    const km = free(A.kit.x + Math.sin(A.kitYaw) * 2.2, A.kit.z + Math.cos(A.kitYaw) * 2.2, A.kit.y + 2, 4); A.kitMeet = { x: km.x, y: km.y, z: km.z, yaw: A.kitYaw + PI };
    npc('kit', 'Kit Morrow', 'Harbour Trust clerk \u00b7 on holiday', LOOKS.kit, A.kit, A.kitYaw, { greet: ['Over here. Quietly.'], lines: [['Keep your voices down.']] });
    A.tunnelEntry = IH.tunnelEntry || free(I.cone.x - 60, I.cone.z - 40 + (I.cz - 600), 60, 60);
    A.cache = IH.cache || A.tunnelEntry;
    A.caveExit = IH.caveExit || A.tunnelEntry; A.cove = IH.cove || A.caveExit;
    A.skis = IH.skis || [];
    const tl = IH.tunnel && IH.tunnel.length ? IH.tunnel : [P3(A.tunnelEntry), P3(A.cache), P3(A.caveExit)];
    { let x0 = 1e9, y0 = 1e9, z0 = 1e9, x1 = -1e9, y1 = -1e9, z1 = -1e9; for (const p of tl.concat([P3(A.tunnelEntry), P3(A.cache), P3(A.caveExit)])) { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); z0 = Math.min(z0, p[2]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); z1 = Math.max(z1, p[2]); }
      A.tunnelBox = [x0 - 8, y0 - 6, z0 - 8, x1 + 8, y1 + 8, z1 + 8]; }
    const mob = () => crowdLook('worker', 'm', rng, 0x2c2c34, 0x26262c);
    const tzn = HS.zones.tunnel = S.define('tunnel', { box: A.tunnelBox, mode: 'fight', voice: 'm1', reflexS: 1.8, radius: 80, nav: tl.length > 1 ? { pts: tl.map((p) => p.slice()), links: tl.slice(1).map((_, i) => [i, i + 1]) } : null });
    const routes = IH.guardRoutes && IH.guardRoutes.length ? IH.guardRoutes : [[P3(A.cache, 0), [A.cache.x + 4, A.cache.y, A.cache.z]]];
    routes.slice(0, 3).forEach((r, i) => { const p = walker('tunnel' + i, 'Moretti', r, r.length > 1 ? { speed: 0.9, mode: 'pingpong', dwell: [{ i: 0, t: 4 + i }, { i: r.length - 1, t: 5 }] } : { speed: 0, yaw: (IH.guardPosts && IH.guardPosts[i] && IH.guardPosts[i].yaw) || 0 }, mob(i)); if (p) S.guard('tunnel', { path: p, voice: i % 2 ? 'm2' : 'm1', name: 'Moretti', range: 14 }); });
    for (const gp of (IH.guardPosts || []).slice(0, 2)) { const p = walker('post' + gp.x.toFixed(0), 'Moretti', [[gp.x, gp.y, gp.z]], { speed: 0, yaw: gp.yaw || 0 }, mob(9)); if (p) S.guard('tunnel', { path: p, voice: 'm2', name: 'Moretti', range: 13 }); }
    void tzn;
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
    A.queenBox = [qb[0] - 6, qb[1] - 2, qb[2] - 6, qb[3] + 6, qb[4] + 5, qb[5] + 6];
    S.define('queen', { box: A.queenBox, mode: 'fail', voice: 'g3', reflexS: 2.2, radius: 70, sight: 0.9 });
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
