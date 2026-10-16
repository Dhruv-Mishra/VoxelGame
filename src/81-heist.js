// ================================================================ 81-heist.js
try {
// ===== 81-heist: THE HARBOUR TRUST JOB — a co-op story mission for a crew of two to four, across the whole map  (OWNER: game) =====
// Vera Lark (the Blue Heron) plans it; Kit Morrow (Hotel Serena) is the inside man; Mr Prescott (the Gilded Room) carries the second
// vault key; Silas Crane (the Solace Queen's casino) fences the take on Corsair Key, his private island; the Moretti mob wants a cut.
//   I   the briefing (cutscene) -> a plane at Westgate -> Serena Isle -> Kit (cutscene) -> the Moretti ambush -> jet skis to the Queen
//   II  evening wear -> one talks the house detective round while the other lifts Prescott's key -> Silas in the purser's cage (cutscene)
//   III midnight: parachute onto the Harbour Trust roof (or climb the service ladder on Park Row) -> the hatch (cutscene) -> three
//       guards with vision cones -> hold both vault keys at once -> the thermal charge -> four cash bags
//   IV  Vera's car on Charter Street, the police, a roadblock -> a plane at Westgate -> fly the cash to Corsair Key (the police can't
//       follow over the sea) -> the hangar -> Vera and Silas (cutscene) -> HEIST PASSED, $25,000 each
// A crew of two is needed to start (Vera offers to host one). Nothing ever waits on a partner: any crew member completes a step, the
// two-person moments have a solo path (hold one key and run to the other; talk to the detective, then hurry), and a partner who
// drops out just leaves the rest to finish. The host owns the step index + checkpoint ('heist' {op:'st'}); each client checks its
// own player and reports 'done'. Checkpoint steps pull far-away crew to the spot behind the travel veil, cutscenes gather the crew
// and play on every client, and failing (spotted, felt, knocked out) sends everyone back to the last checkpoint.
{
  const PI = Math.PI, LN = AF.liner, VV = AF.vehicles, N = AF.net, UI = AF.ui, MI = AF.mission;
  const CB = () => AF.combat;
  const say = (id, vol) => { if (AF.audio) AF.audio.play(id, vol != null ? { vol } : undefined); };
  const note = (text, kind = 'mission') => AF.emit('toast', { text, kind });
  const me = () => (AF.mode === 'walk' || AF.mode === 'cutscene' || !AF.player.mesh ? AF.player : AF.player.mesh.position);
  const dist = (a, b) => (a && b ? Math.hypot(a.x - b.x, a.z - b.z) : 1e9);
  const online = () => !!N && N.role !== 'off';
  const host = () => !online() || N.role === 'host';
  const crewN = () => (online() ? 1 + N.peers.size : 1);
  const mySlot = () => (online() ? Math.max(0, N.me) : 0);
  const send = (m, to) => { if (online()) N.send('heist', m, to); };
  const NEED = 2, GRIP = 8, CHAT = 14;
  const H = AF.heist = { on: false, i: -1, cp: 0, t: 0, flag: {}, sus: 0, seen: false, bags: [false, false, false, false], grip: [0, 0], fuse: 0, chat: 0, alarm: false,
    lifting: false, failing: false, sentFor: -1, cutting: false, cutOn: false, later: null, after: null, afterT: 0, roadblock: null, car: null, dressed: false, goonsN: 0,
    pay: 25000, runs: 0, need: NEED, solo: false, hud: { title: 'The Harbour Trust Job', line: '', t: null, pay: null } };
  const P = H.at = {};      // places (filled at build)
  const B = H.obj = { bags: [], keys: [] };   // meshes, NPCs, colliders
  const GD = H.guards = [];  // { path, bank, casino }

  // ---------------------------------------------------------------- the cast
  const LOOKS = {
    vera: { female: true, skin: 0xe8b894, hair: 0x9a2a16, hairStyle: 'wavy', lips: 0xc8202a, top: { col: 0x1d6a5a, col2: 0xd8b04a, style: 'dress' }, bottom: { col: 0x1d6a5a, style: 'skirt' }, shoe: 0x141414, height: 1.0 },
    kit: { skin: 0xc68a5e, hair: 0x2a1a10, hairStyle: 'short', glasses: 0x2a2a2e, top: { col: 0xf2efe4, col2: 0x2a4a9a, style: 'shirt' }, bottom: { col: 0x3a3a40, style: 'jeans' }, shoe: 0x4a3020, hat: 'straw', hatCol: 0xe8d8a8, height: 1.02 },
    silas: { skin: 0xefc19f, hair: 0x9a9a9a, hairStyle: 'short', top: { col: 0x6a1a24, col2: 0xf2efe4, style: 'vest' }, bottom: { col: 0x1a1a1e, style: 'jeans' }, shoe: 0x141414, extra: 'chain', height: 1.06 },
    prescott: { skin: 0xf0c8a8, hair: 0xe0dcd0, hairStyle: 'short', glasses: 0xd8b04a, top: { col: 0x22253a, col2: 0xf2efe4, style: 'shirt' }, bottom: { col: 0x22253a, style: 'jeans' }, shoe: 0x141414, height: 1.0 },
  };
  const radio = (who, text, id) => { if (id) say(id); AF.emit('toast', { title: who, text, kind: 'radio', look: LOOKS[who.split(' ')[0].toLowerCase()] || null }); };
  { const prev = UI.lookOf; UI.lookOf = (name) => LOOKS[String(name).split(' ')[0].toLowerCase()] || (prev ? prev(name) : null); }
  const LINES = {
    pitch: ['Walk with me a minute, both of you. You look like people who are tired of small change.',
      'The Harbour Trust. Eighteen inches of steel and the fattest vault on the coast. By sunrise it\u2019s ours.',
      'My inside man, Kit Morrow, is lying low at Hotel Serena. Take a plane from Westgate and fly out to meet him.',
      'Then the Solace Queen, the vault at midnight, and a quiet flight to Corsair Key. Silas Crane will be waiting.',
      'My driver will drop you at the airfield. Go.'],
    kit: ['So you\u2019re Vera\u2019s crew. Keep your voices down \u2014 half this island drinks with the Moretti family.',
      'The vault takes two keys, turned at the same moment. Mine\u2019s right here \u2014 take it.',
      'The other never leaves old Prescott. He plays baccarat every night aboard the Solace Queen.',
      'One of you keeps his house detective busy, the other lifts the key. I\u2019ll leave the roof hatch on the latch at midnight.',
      'Now go, before\u2014 oh no. Moretti\u2019s boys!'],
    silas: ['Prescott\u2019s key already? Vera said you were good.',
      'Here\u2019s the deal. You fly the Harbour Trust\u2019s money to Corsair Key \u2014 my island, my airstrip, no questions asked.',
      'Midnight. Jump onto the bank\u2019s roof; Kit\u2019s hatch is on the east side. And don\u2019t get greedy.'],
    hatch: ['Kit kept his word \u2014 the hatch is open.', 'Three guards on the night shift. Stay out of their sight \u2014 a punch from behind puts one to sleep.',
      'Two keys, either side of the vault door. Hold both at once and the time-lock lets go.'],
    finale: ['Right on time. Let\u2019s see it.', 'Four bags. The whole city\u2019s looking for us and nobody knows a thing.',
      'Corsair Key keeps its secrets. Your cuts have been wired \u2014 every last cent.', 'Lay low a while. There\u2019s always another job.'],
    again: ['Look who\u2019s back. The papers are still guessing.', 'Fancy doing it again? Bring your crew.'],
  };

  // ---------------------------------------------------------------- places + checks
  const SC = { x: 0, y: 0, z: 0 };   // scratch for moving targets (no per-frame garbage)
  const isPlane = (v) => !!v && !!AF.planes && AF.planes.list.includes(v);
  const rideVeh = () => (AF.mode === 'passenger' && AF.coop && AF.coop.ride ? AF.coop.ride.veh : null);
  const flying = () => AF.mode === 'fly' || isPlane(rideVeh());
  const inCar = () => AF.mode === 'drive' || (AF.mode === 'passenger' && !!rideVeh() && !isPlane(rideVeh()));
  const landed = () => { const pl = AF.mode === 'fly' && AF.planes.cur; return !!pl && pl.onGround && Math.abs(pl.v) < 8; };
  const near = (p, r) => { const q = AF.player; return AF.mode === 'walk' && !!p && Math.hypot(q.x - p.x, q.z - p.z) < r && Math.abs(q.y - (p.y ?? q.y)) < 2.6; };
  const inEll = (E) => { const p = me(); return !!E && ((p.x - E.cx) / E.rx) ** 2 + ((p.z - E.cz) / E.rz) ** 2 < 1.1; };
  const onIsland = () => inEll(AF.PLAN.world.island);
  const onKey = () => inEll(AF.PLAN.world.key);
  const onQueen = () => AF.mode === 'walk' && !!LN && LN.where(AF.player.x, AF.player.y, AF.player.z) !== '';
  const inHall = () => { const p = AF.player; return AF.mode === 'walk' && p.x > 11 && p.x < 49.5 && p.z > -137 && p.z < -113 && p.y < 5; };
  const onRoof = () => { const p = AF.player; return AF.mode === 'walk' && p.y > 12 && p.x > 9 && p.x < 51 && p.z > -148 && p.z < -103; };
  const nearestSki = () => { const S = AF.island && AF.island.jetski && AF.island.jetski.skis, p = me(); let b = null, bd = 1e18; for (const k of S || []) { const d = (k.x - p.x) ** 2 + (k.z - p.z) ** 2; if (d < bd) { bd = d; b = k; } } if (!b) return P.pontoon; SC.x = b.x; SC.y = null; SC.z = b.z; return SC; };
  const nextBag = () => { for (let k = 0; k < 4; k++) if (!H.bags[k]) return P.bags[k]; return P.gate; };
  const planeAt = () => { for (const pl of P.planes || []) if (pl !== AF.planes.cur && pl.net == null && !pl.ghost && pl.onGround) { SC.x = pl.x; SC.y = pl.y; SC.z = pl.z; return SC; } return P.plane; };
  const free = (x, z, yTop = 20, depth = 40) => {
    for (let r = 0; r < 14; r += 1.5) for (let a = 0; a < (r ? 8 : 1); a++) {
      const px = x + Math.sin(a * PI / 4) * r, pz = z + Math.cos(a * PI / 4) * r, y = AF.surfaceBelow(px, pz, yTop, depth);
      if (Number.isFinite(y) && y > -1.1 && !AF.boxBlocked(px, y + 0.05, pz, 0.3, 1.7)) return { x: px, y, z: pz };
    }
    const y = AF.surfaceBelow(x, z, yTop, depth); return { x, y: Number.isFinite(y) ? y : 0.5, z };
  };
  const kerbAt = (x, z, along = 0) => {
    const nr = AF.PLAN.nearestRoad(x, z), R = nr && nr.road; if (!R) return null;
    const dx = R.b[0] - R.a[0], dz = R.b[1] - R.a[1], L = Math.hypot(dx, dz) || 1, t = AF.clamp(nr.t + along / L, 0, 1);
    const cx = R.a[0] + dx * t, cz = R.a[1] + dz * t; let nx = -dz / L, nz = dx / L; if ((x - cx) * nx + (z - cz) * nz < 0) { nx = -nx; nz = -nz; }
    const o = R.w / 2 - 1.8, kx = cx + nx * o, kz = cz + nz * o;
    return { x: kx, z: kz, y: AF.W.groundY(kx, kz), yaw: Math.atan2(dx, dz), nx, nz, cx, cz, road: R };
  };
  // a point fwd metres ahead of / right metres beside / up metres above someone at o facing yaw (cutscene cameras)
  const rel = (o, yaw, fwd, right, up) => [o.x + Math.sin(yaw) * fwd - Math.cos(yaw) * right, o.y + up, o.z + Math.cos(yaw) * fwd + Math.sin(yaw) * right];
  const head = (n, up = 1.55) => [n.x, n.y + up, n.z];
  // each crew member gets their own spot beside a checkpoint (slot 0 on it, the others 1.3 m apart)
  const spotFor = (at, k = mySlot()) => {
    if (!at || !k) return at;
    const yaw = at.yaw || 0, side = (k % 2 ? 1 : -1) * Math.ceil(k / 2) * 1.3, p = free(at.x - Math.cos(yaw) * side, at.z + Math.sin(yaw) * side, at.y + 2, 4);
    return { x: p.x, y: p.y, z: p.z, yaw };
  };

  // ---------------------------------------------------------------- moving the crew: the travel veil for long hops, cutscenes
  const leaveFlight = () => { const pl = AF.planes && AF.planes.cur; if (AF.mode === 'fly' && pl && !pl.onGround) pl.ghost = true; };
  const place = (s) => AF.setMode('walk', { x: s.x, y: s.y, z: s.z, yaw: s.yaw || 0, snap: true });
  const goTo = (at, label) => {
    if (!at || AF.mode === 'dead') return;
    if (MI.cut.on) MI.cut.finish(true);
    const s = spotFor(at); leaveFlight();
    if (dist(me(), s) > 120 && AF.stream && AF.stream.travel) AF.stream.travel({ label, go: () => place(s) }); else place(s);
  };
  // a checkpoint pulls crew who are far away (after their cutscene, if one is playing)
  const gather = (at, label) => {
    if (!at || AF.mode === 'dead' || dist(me(), at) < 150) return;
    if (MI.cut.on || H.cutting) { H.later = () => gather(at, label); return; }
    goTo(at, label);
  };
  const cutscene = (at, label, build) => {
    const step = H.i, s = spotFor(at);
    if (!s) { H.flag.cut = true; return; }
    H.cutting = true; H.cutOn = false;
    const run = () => {
      if (!H.on || H.i !== step) { H.cutting = false; return; }
      const fin = () => { H.cutting = false; if (H.on && H.i === step) H.flag.cut = true; const f = H.later; H.later = null; if (f) f(); };
      const o = build(s); o.pose = s; o.onEnd = fin;
      leaveFlight();
      if (AF.mode === 'dead' || !MI.cut.play(o)) fin(); else H.cutOn = true;
    };
    if (!AF.TEST && AF.mode !== 'dead' && dist(me(), s) > 120 && AF.stream && AF.stream.travel) { leaveFlight(); AF.stream.travel({ label, go: () => place(s) }).then(run); }
    else run();
  };
  // a cutscene step is done when one plays to its end (or is skipped); one cut short by something else (a co-op join's travel) waits
  // for a crewmate's, alone or after 40 s it counts too
  const cutDone = () => H.flag.cut || (H.cutOn && !MI.cut.on && (crewN() < 2 || H.t > 40));

  const cutBrief = () => cutscene(P.c0, 'the Blue Heron', (at) => {
    const v = P.vera, f = P.veraYaw;
    return { title: 'The Harbour Trust Job', sub: 'Act I \u00b7 The Island', end: at, shots: [
      { cam: rel(v, f, 1.1, 4.2, 1.65), cam2: rel(v, f, 1.1, 3.6, 1.6), look: rel(v, f, 1.1, 0, 1.4), d: 5.5, say: ['Vera', LINES.pitch[0]] },
      { cam: [-24, 44, -38], cam2: [-14, 50, -50], look: [30, 58, -125], d: 6, say: ['Vera', LINES.pitch[1]] },
      { cam: rel(v, f, 1.9, -0.7, 1.62), look: head(v), d: 6, say: ['Vera', LINES.pitch[2]] },
      { cam: [-196, 22, 252], cam2: [-210, 25, 262], look: [-250, 9, 305], d: 6, say: ['Vera', LINES.pitch[3]] },
      { cam: rel(v, f, -1.0, 0.55, 1.75), look: rel(v, f, 2.2, 0, 1.5), d: 3.5, say: ['Vera', LINES.pitch[4]] },
    ] };
  });
  const cutKit = () => cutscene(P.kitMeet, 'Hotel Serena', (at) => {
    const k = P.kit, f = P.kitYaw;
    return { end: at, shots: [
      { cam: rel(k, f, 1.1, 4.0, 1.6), cam2: rel(k, f, 1.1, 3.5, 1.6), look: rel(k, f, 1.1, 0, 1.4), d: 5, say: ['Kit', LINES.kit[0]] },
      { cam: rel(k, f, 2.1, -0.6, 1.6), look: head(k), d: 5, say: ['Kit', LINES.kit[1]], act: () => say('click_metal') },
      { cam: rel(k, f, -1.1, 0.6, 1.8), look: rel(k, f, 2.2, 0, 1.5), d: 5, say: ['Kit', LINES.kit[2]] },
      { cam: rel(k, f, 2.1, 0.6, 1.6), look: head(k), d: 5.5, say: ['Kit', LINES.kit[3]] },
      { cam: rel(k, f, 1.4, -1.6, 1.5), look: rel(k, f, -8, 0, 1.2), d: 2.6, say: ['Kit', LINES.kit[4]] },
    ] };
  });
  const cutSilas = () => cutscene(P.silasMeet, 'the Solace Queen', (at) => {
    const s = P.silas, f = P.silasYaw;
    return { end: at, shots: [
      { cam: rel(s, f, 2.0, 0.7, 1.6), look: head(s), d: 4.5, say: ['Silas', LINES.silas[0]] },
      { cam: rel(s, f, 1.1, 2.3, 1.7), cam2: rel(s, f, 1.1, 1.9, 1.7), look: rel(s, f, 1.1, 0, 1.45), d: 6.5, say: ['Silas', LINES.silas[1]] },
      { cam: rel(s, f, 2.0, -0.7, 1.6), look: head(s), d: 5, say: ['Silas', LINES.silas[2]] },
      { cam: [-170, 30, 200], cam2: [-150, 62, 160], look: [30, 50, -125], d: 4.5, say: ['', 'Midnight.'], act: () => { if (host()) AF.time.set({ hours: 0.25 }); } },
    ] };
  });
  const cutHatch = () => cutscene(P.c4, 'the Harbour Trust', () => {
    const h = P.hatch;
    return { end: spotFor(P.drop), shots: [
      { cam: [h.x + 2.5, h.y + 3.2, h.z - 6.5], cam2: [h.x + 2, h.y + 2.4, h.z - 4.8], look: [h.x, h.y + 0.4, h.z], d: 3.6, say: ['Vera', LINES.hatch[0]], act: () => say('latch') },
      { cam: [13.5, 9.5, -114], cam2: [15.5, 9, -116.5], look: [28, 0.5, -124], d: 6, say: ['Vera', LINES.hatch[1]] },
      { cam: [35, 2.8, -119.5], cam2: [36.2, 2.4, -121.5], look: [42, 1.5, -125], d: 5.5, say: ['Vera', LINES.hatch[2]] },
    ] };
  });
  const cutFinale = () => cutscene(P.finaleMeet, 'Corsair Key', (at) => {
    const s = P.stash, v = B.vera2, c = B.silas2;
    return { end: at, shots: [
      { cam: [s.x + 16, s.y + 9, s.z - 18], cam2: [s.x + 10, s.y + 5, s.z - 12], look: [s.x, s.y + 2, s.z + 3], d: 4.5, say: ['Silas', LINES.finale[0]] },
      { cam: rel(v, v.yaw, 2.1, 0.7, 1.6), look: head(v), d: 5, say: ['Vera', LINES.finale[1]] },
      { cam: rel(c, c.yaw, 2.1, -0.7, 1.6), look: head(c), d: 5.5, say: ['Silas', LINES.finale[2]], act: () => say('money') },
      { cam: rel(v, v.yaw, 1.5, 1.6, 1.5), look: [s.x, s.y + 1.5, s.z], d: 4.5, say: ['Vera', LINES.finale[3]] },
      { cam: [s.x - 6, s.y + 3, s.z - 10], cam2: [s.x - 26, s.y + 34, s.z - 44], look: [s.x + 4, s.y + 3, s.z + 10], d: 5 },
    ] };
  });

  // ---------------------------------------------------------------- the story, step by step
  // cp: reaching this step saves checkpoint cp · gather: crew further than 150 m are brought here · cut: a cutscene step ·
  // tag: the marker's label · mark(): the objective's position (allocation-free)
  const ST = [
    { id: 'brief', cp: 0, act: 'Act I \u00b7 The Island', line: 'Vera\u2019s briefing', cut: () => cutBrief() },
    { id: 'plane', tag: 'Plane', line: 'Steal a {plane} at Westgate Airfield \u2014 one of you flies, the crew rides along', gather: () => P.c3, where: 'Westgate Airfield', mark: () => planeAt(),
      enter: () => { resetPlanes(); radio('Vera', 'The planes on the Westgate apron are fuelled. One of you flies \u2014 the other rides along.', 'r_plane'); }, done: () => flying() },
    { id: 'fly', tag: 'Serena Isle', line: 'Fly to {Serena Isle} and land on the airstrip', mark: () => P.strip, done: () => onIsland() && (AF.mode === 'walk' || landed()) },
    { id: 'kit', cp: 1, tag: 'Kit', line: 'Meet {Kit Morrow} on the terrace of Hotel Serena', gather: () => P.c1, where: 'Serena Isle', mark: () => P.kit, enter: () => showKit(true), done: () => H.flag.kit || (AF.mode === 'walk' && dist(AF.player, P.kit) < 5 && Math.abs(AF.player.y - P.kit.y) < 4) },
    { id: 'kitcut', line: 'Kit Morrow', cut: () => cutKit(), enter: () => showKit(true) },
    { id: 'ambush', tag: 'Jet skis', line: 'Moretti\u2019s men! Fight them off \u2014 or run for {the jet skis}', mark: () => nearestSki(), enter: (r) => ambush(r), done: () => ambushOver() },
    { id: 'ski', tag: 'Pontoon', line: 'Ride a jet ski to the {Solace Queen} \u2014 her pontoon is on the south side', mark: () => P.pontoon,
      enter: () => { showKit(false); const C = CB(); if (C) C.clearGoons(); radio('Vera', 'There\u2019s a pontoon on the Queen\u2019s south side. Come aboard there.', 'r_boat'); }, done: () => onQueen() || near(P.pontoon, 7) },
    { id: 'dress', cp: 2, act: 'Act II \u00b7 The Queen', tag: 'Cloakroom', line: 'Pick up {evening wear} at the cloakroom', gather: () => P.c2, where: 'the Solace Queen', mark: () => P.cloak, done: () => H.flag.dress },
    { id: 'lift', tag: 'Prescott', line: () => (crewN() > 1 ? '{Talk to} the house detective while your partner lifts {Prescott\u2019s key} from behind' : 'Lift {Prescott\u2019s key} from behind \u2014 talk the house detective round first, then be quick'),
      mark: () => P.prescott, enter: () => radio('Vera', crewN() > 1 ? 'Prescott\u2019s at the head of the baccarat table. One of you chats up the house detective, the other lifts the key.' : 'Prescott\u2019s at the head of the baccarat table. Keep the house detective talking, then be quick.', 'r_guard'), done: () => H.flag.lift },
    { id: 'silas', tag: 'Silas', line: 'See {Silas Crane} in the purser\u2019s cage, behind the Gilded Room', mark: () => P.silas, enter: () => { if (LN) LN.openStaff(true); }, done: () => near(P.silas, 3.4) || H.flag.silas },
    { id: 'silascut', line: 'Silas Crane', cut: () => cutSilas() },
    { id: 'jump', cp: 3, act: 'Act III \u00b7 The Vault', tag: 'Roof', line: 'Midnight. Fly over the {Harbour Trust} and parachute onto its roof \u2014 or climb the service ladder on Park Row',
      gather: () => P.c3, where: 'Westgate Airfield', mark: () => P.hatch, enter: () => night(), done: () => onRoof() || inHall() },
    { id: 'hatch', cp: 4, line: 'The service hatch', cut: () => cutHatch() },
    { id: 'keys', tag: 'Vault key', line: () => (crewN() > 1 ? 'Hold {both vault keys} at the same time \u2014 one each' : 'Hold {both vault keys} \u2014 grab one, then reach the other within ' + GRIP + ' seconds'),
      mark: () => P.keys[H.grip[0] > 0 ? 1 : 0], done: () => H.grip[0] > 0 && H.grip[1] > 0 },
    { id: 'charge', tag: 'Vault gate', line: 'Plant the {thermal charge} on the vault gate \u2014 then get clear', mark: () => P.gate, enter: (r) => { if (!r) { say('vault'); note('Both keys turn \u2014 the time-lock lets go.', 'ok'); } }, done: () => H.flag.charge },
    { id: 'cash', tag: 'Cash', line: 'Grab the {cash bags}', mark: () => nextBag(), enter: (r) => blowGate(r), done: () => H.bags.every(Boolean) },
    { id: 'car', cp: 5, act: 'Act IV \u00b7 The Getaway', tag: 'Car', line: 'Get to {Vera\u2019s car} on Charter Street', gather: () => P.c5, where: 'Charter Street', mark: () => P.car, enter: (r) => getaway(r), done: () => inCar() },
    { id: 'run', tag: 'Plane', line: 'Lose the police on the way to {Westgate Airfield} \u2014 a plane is waiting', mark: () => planeAt(), enter: () => run(), done: () => flying() || dist(me(), planeAt()) < 30 },
    { id: 'escape', tag: 'Corsair Key', line: 'Fly the cash to {Corsair Key} \u2014 the police can\u2019t follow you over the sea', mark: () => P.keyStrip,
      enter: () => { resetPlanes(); radio('Vera', 'Head south-east, out over the water. Corsair Key has an airstrip \u2014 Silas is waiting.', 'r_plane'); }, done: () => onKey() && (AF.mode === 'walk' || landed()) },
    { id: 'stash', cp: 6, tag: 'Hangar', line: 'Carry the cash into {the hangar}', gather: () => P.c6, where: 'Corsair Key', mark: () => P.stash, enter: () => showFinale(true), done: () => near(P.stash, 4) },
    { id: 'finale', line: 'Corsair Key', cut: () => cutFinale(), enter: () => showFinale(true) },
  ];
  const IDX = {}; ST.forEach((s, i) => { IDX[s.id] = i; });
  // where a checkpoint restarts: step + spot
  const CPS = [
    { step: 'plane', label: 'Westgate Airfield', at: () => P.c3 }, { step: 'kit', label: 'Serena Isle', at: () => P.c1 }, { step: 'dress', label: 'the Solace Queen', at: () => P.c2 },
    { step: 'jump', label: 'Westgate Airfield', at: () => P.c3, night: true }, { step: 'keys', label: 'the Harbour Trust', at: () => P.drop, night: true },
    { step: 'car', label: 'Charter Street', at: () => P.c5, night: true }, { step: 'stash', label: 'Corsair Key', at: () => P.c6, night: true },
  ];
  const is = (id) => H.on && H.i === IDX[id];
  const stealth = () => H.on && H.i >= IDX.hatch && H.i <= IDX.charge;
  const lineOf = (s) => (typeof s.line === 'function' ? s.line() : s.line);
  const actOf = (i) => { for (let k = i; k >= 0; k--) if (ST[k].act) return ST[k].act; return ''; };

  // ---------------------------------------------------------------- props that follow the story
  const myLook = () => (AF.save.looks && AF.friends.current && AF.save.looks[AF.friends.current.id]) || (AF.friends.current && AF.friends.current.look);
  const dress = (on) => {
    if (on === H.dressed || !AF.player || !AF.player.setLook || !myLook()) return;
    H.dressed = on;
    if (!on) { AF.player.setLook(myLook()); return; }
    const L = JSON.parse(JSON.stringify(myLook()));
    if (L.female) { L.top = { style: 'dress', col: 0x8a1424, col2: 0xd8b04a }; L.bottom = { style: 'skirt', col: 0x8a1424 }; }
    else { L.top = { style: 'shirt', col: 0x17171b, col2: 0xf2efe4 }; L.bottom = { style: 'jeans', col: 0x17171b }; }
    delete L.hat; L.shoe = 0x111114; AF.player.setLook(L);
  };
  AF.on('friend', () => { H.dressed = false; if (H.on && H.i > IDX.dress) dress(true); });
  const showKit = (on) => { if (B.kit) AF.npc.setHidden(B.kit, !on); };
  const showFinale = (on) => { if (B.vera2) { AF.npc.setHidden(B.vera2, !on); AF.npc.setHidden(B.silas2, !on); } };
  const resetPlanes = () => { for (const pl of P.planes || []) if (pl !== AF.planes.cur && pl.net == null && !pl.ghost && Math.hypot(pl.x - pl.home.x, pl.z - pl.home.z) > 3) AF.planes.reset(pl); };
  const talk = (n, lines, then) => { AF.emit('dialogue', { name: n.name, role: n.role, lines, look: LOOKS[n.id.replace('heist-', '').replace(/2$/, '')] }); n.greetT = AF.clock.t; H.after = then || null; H.afterT = 0.3; };
  const veraBlip = () => { if (!P.vera) return; if (H.on) MI.unblip('heist'); else MI.blip('heist', { x: P.vera.x, y: P.vera.y, z: P.vera.z, kind: 'heist', label: 'Heist \u00b7 Vera' }); };
  // the objective's markers: the primary one + a second (the other key, the detective, the ladder)
  const MK2 = { keys: () => P.keys[H.grip[0] > 0 ? 0 : 1], lift: () => DET(), jump: () => P.ladder };
  const MK2L = { keys: 'Vault key', lift: 'Detective', jump: 'Service ladder' };
  const markers = (s) => {
    if (!s || !s.mark) MI.unblip('heist-obj');
    else MI.blip('heist-obj', { at: s.mark, on: () => H.on && !H.failing, kind: 'objective', label: s.tag || '', primary: true, marker: true, r: 1.8, y: null });
    const m2 = s && MK2[s.id];
    if (!m2) MI.unblip('heist-2');
    else MI.blip('heist-2', { at: m2, on: () => H.on && !H.failing && !(s.id === 'keys' && H.grip[0] > 0 && H.grip[1] > 0) && !(s.id === 'lift' && H.chat > 0), kind: s.id === 'lift' ? 'crew' : 'objective', label: MK2L[s.id], marker: true, r: 1.4, y: null });
  };

  // ---------------------------------------------------------------- step engine
  const enter = (i, restored) => {
    H.i = i; H.t = 0; H.flag = {}; H.sus = 0; H.lifting = false; H.sentFor = -1; H.cutting = false; H.cutOn = false; H.later = null;
    const s = ST[i]; if (s.cp != null) H.cp = s.cp;
    guardsOn(stealth()); syncProps(); dress(i > IDX.dress);
    if (s.act && !s.cut) MI.shard('The Harbour Trust Job', s.act, 'start', 3600);
    if (!restored && i > 0) { say(s.cp != null ? 'jg_pass' : 'ui_check'); if (s.cp != null) note('Checkpoint \u2014 ' + CPS[s.cp].label + '.', 'ok'); }
    markers(s); hudT = 0;
    if (s.cut) { if (restored) H.flag.cut = true; else s.cut(); }
    else if (!restored && s.gather) gather(s.gather(), s.where || '');
    if (s.enter) s.enter(!!restored);
    if (B.prescott) B.prescott.interact.label = is('lift') ? 'Lift the key from Prescott\u2019s jacket' : 'Talk to Mr Prescott';
    AF.emit('heist', H);
  };
  const advance = (from) => {   // host
    if (!H.on || from !== H.i || H.failing) return;
    if (H.i + 1 >= ST.length) { finish(true); return; }
    enter(H.i + 1, false); send({ op: 'st', i: H.i, cp: H.cp });
  };
  const complete = () => { if (H.sentFor === H.i) return; H.sentFor = H.i; if (host()) advance(H.i); else send({ op: 'done', i: H.i }, 0); };
  const fail = (why) => {
    if (!H.on || H.failing) return;
    if (host()) { doFail(why); send({ op: 'fail', cp: H.cp, why }); }
    else { H.failing = true; send({ op: 'fail', why }, 0); setTimeout(() => { if (H.failing === true) H.failing = false; }, 4000); }
  };
  const doFail = (why) => {
    H.failing = 'restore'; if (AF.hud.meterCancel) AF.hud.meterCancel(); H.lifting = false;
    say('jg_fail'); setTimeout(() => say('v_failed'), 900); MI.shard('Mission failed', why || 'The job went sideways.', 'fail', 2800);
    setTimeout(() => {
      H.failing = false; if (!H.on) return;
      restore(H.cp); if (host()) send({ op: 'st', i: H.i, cp: H.cp, r: 1 });
      setTimeout(() => radio('Vera', 'Okay. Regroup and try that again.', 'r_checkpoint'), 1600);
    }, AF.TEST ? 0 : 2600);
  };
  const resetWorld = (i) => {
    const C = CB(); if (C) { C.clearWanted(); C.clearGoons(); }
    resetGuards(); H.alarm = false; H.grip[0] = H.grip[1] = 0; H.fuse = 0; H.chat = 0;
    for (let k = 0; k < 4; k++) H.bags[k] = i > IDX.cash;
    if (LN && LN.openStaff) LN.openStaff(i === IDX.silas || i === IDX.silascut);
    dress(i > IDX.dress); showKit(i === IDX.kit || i === IDX.kitcut); showFinale(i >= IDX.stash);
    if (H.roadblock) { for (const c of H.roadblock.cars) c.temp = true; H.roadblock = null; }
  };
  const restore = (cp) => {
    const C = CPS[cp], i = IDX[C.step]; H.cp = cp;
    resetWorld(i);
    if (host() && C.night) AF.time.set({ hours: 0.25 });
    if (i <= IDX.jump || i >= IDX.car) resetPlanes();
    AF.health.heal(AF.health.max);
    goTo(C.at(), C.label);
    enter(i, true);
  };
  const begin = () => {
    const J = AF.jobs; if (J && J.cur) J.cur.end('You clock off \u2014 there\u2019s a bigger job tonight.');
    H.on = true; H.cp = 0; H.failing = false; resetWorld(0); veraBlip(); say('jg_start'); enter(0, false);
  };
  const start = () => {
    if (H.on) return;
    if (crewN() < NEED && !H.solo) { note('The Harbour Trust Job needs a crew of two. Host a co-op game and bring a friend.', 'warn'); return; }
    if (!host()) { send({ op: 'go' }, 0); return; }
    begin(); send({ op: 'st', i: H.i, cp: H.cp });
  };
  const end = (ok, quiet) => {
    if (!H.on) return;
    H.on = false; H.i = -1; H.failing = false; H.after = null; H.later = null; H.cutting = false;
    if (MI.cut.on) MI.cut.finish(true);
    const C = CB(); if (C) { C.clearGoons(); if (ok) C.clearWanted('Corsair Key keeps its secrets. The police lose the trail.'); }
    guardsOn(false); resetGuards(); H.alarm = false; dress(false); showKit(false); showFinale(false); H.grip[0] = H.grip[1] = 0; H.fuse = 0; H.chat = 0; for (let k = 0; k < 4; k++) H.bags[k] = false;
    if (AF.hud.meterCancel) AF.hud.meterCancel(); H.lifting = false;
    if (LN && LN.openStaff) LN.openStaff(false);
    if (H.car) { H.car.temp = true; H.car = null; }
    if (H.roadblock) { for (const c of H.roadblock.cars) c.temp = true; H.roadblock = null; }
    MI.unblip('heist-obj'); MI.unblip('heist-2'); MI.clearBars('heist'); if (AF.hud.job === H.hud) AF.hud.job = null;
    if (ok) {
      H.runs++; AF.money.add(H.pay); AF.saveSoon();
      say('jg_win'); setTimeout(() => say('v_complete'), 1300); MI.shard('Heist passed', 'The Harbour Trust Job \u00b7 your cut ' + AF.cash(H.pay), 'pass', 7000);
      setTimeout(() => radio('Silas', 'Pleasure doing business. Fly home whenever you like \u2014 the Cub by the hangar is yours to borrow.', 'r_good'), 3500);
    } else if (!quiet) note('The job is off. Vera will be at the Blue Heron if you change your mind.', 'warn');
    syncProps(); veraBlip();
    AF.emit('heist', H);
  };
  const finish = (ok) => { if (!H.on) return; if (host()) send({ op: 'end', ok: ok ? 1 : 0 }); end(ok); };
  const retry = () => { if (!H.on || H.failing) return; if (host()) { restore(H.cp); send({ op: 'rs', cp: H.cp }); } else send({ op: 'retry' }, 0); };
  H.start = start; H.retry = retry; H.quit = () => (host() ? finish(false) : send({ op: 'quit' }, 0));
  H.dbg = { IDX, ST, CPS, begin, enter, restore, skip: () => advance(H.i), solo: (on = true) => { H.solo = on; } };   // harnesses (host / solo)
  H.dbg.jump = (cp) => { if (!host()) return; if (!H.on) begin(); restore(cp); send({ op: 'st', i: H.i, cp: H.cp, r: 1 }); send({ op: 'rs', cp }); };

  // ---------------------------------------------------------------- act I: the island
  const ambush = (restored) => {
    radio('Kit', 'Those are Moretti\u2019s boys \u2014 they followed you from the airstrip! Run!', 'v_lookout');
    setTimeout(() => { if (H.on && H.i >= IDX.ambush) showKit(false); }, 2500);
    const C = CB(), p = AF.player; H.goonsN = 0;
    if (restored || !C || !C.spawnGoon || !P.kit || dist(p, P.kit) > 150) return;
    const n = Math.max(3, Math.ceil(6 / crewN()));
    for (let k = 0; k < n; k++) {
      const a = (k + mySlot() * 0.5) / n * PI * 2 + 0.4, r = 14 + (k % 2) * 7, x = P.kit.x + Math.sin(a) * r, z = P.kit.z + Math.cos(a) * r, y = AF.surfaceBelow(x, z, P.kit.y + 12, 24);
      if (!Number.isFinite(y) || y < -0.9 || AF.boxBlocked(x, y + 0.05, z, 0.3, 1.7)) continue;
      if (C.spawnGoon(x, y, z, { kind: k % 3 === 2 ? 'brawl' : 'gun' })) H.goonsN++;
    }
    if (H.goonsN) say('v_cover');
  };
  const ambushOver = () => {
    if (AF.mode === 'jetski' || (P.kit && dist(me(), P.kit) > 170)) return true;
    if (!H.goonsN) return H.t > 5;
    const C = CB(); return !C || C.goons().every((w) => w.agg && w.agg.st === 'down');
  };

  // ---------------------------------------------------------------- act II: the lift (one talks to the detective, one lifts)
  const DET = () => { const g = GD.find((q) => q.casino); return g && g.path.actors[0]; };
  const chat = (from) => {
    const a = DET(); if (!a) return;
    const r = from != null && AF.coop ? AF.coop.players.get(from) : null, p = r && r.seen ? r : AF.player;
    H.chat = CHAT; if (AF.walkers.hold) AF.walkers.hold(a, Math.atan2(p.x - a.x, p.z - a.z), CHAT);
  };
  const distract = () => {
    if (!is('lift') || H.chat > 0) return;
    chat(null); send({ op: 'chat' }); say('ui_check', 0.5);
    const a = DET(); if (a) AF.emit('bubble', { who: a, name: 'Detective', text: 'Evening. Lovely night for it, isn\u2019t it?', dur: 3 });
    note(crewN() > 1 ? 'You have the detective\u2019s ear for ' + CHAT + ' seconds \u2014 your partner can lift the key now.' : 'You have the detective\u2019s ear for ' + CHAT + ' seconds \u2014 quick, get behind Prescott.', 'ok');
  };
  const lift = () => {
    const p = AF.player, n = B.prescott, dx = p.x - n.x, dz = p.z - n.z, d = Math.hypot(dx, dz) || 1;
    if ((dx * Math.sin(n.yaw) + dz * Math.cos(n.yaw)) / d > -0.3) { note('He\u2019d see you coming. Get behind him.', 'warn'); return; }
    if (H.chat <= 0 && sees(DET(), p) > 0) { note('Not now \u2014 the house detective is looking this way.', 'warn'); return; }
    H.lifting = true; H.sus = 0;
    AF.hud.meter({ label: 'Lift the key from his jacket', sub: AF.touch ? 'Tap when the needle is in the green' : 'Click, E or Q when the needle is in the green', speed: 1.25, zone: [0.6, 0.74] }, (v, ok) => {
      H.lifting = false; if (!is('lift')) return;
      if (ok) { say('zip_bag'); note('Got it. Prescott never felt a thing.', 'ok'); H.flag.lift = true; return; }
      if (Math.abs(v - 0.67) < 0.2) { AF.emit('bubble', { who: n, name: 'Prescott', text: 'Hm? \u2014 Banco!', dur: 2 }); note('Prescott shifts in his seat\u2026 easy. Try again.', 'warn'); return; }
      AF.emit('bubble', { who: n, name: 'Prescott', text: 'Thief! Security!', dur: 2.5 }); fail('Prescott felt your hand in his pocket.');
    });
  };

  // ---------------------------------------------------------------- act III: the bank
  const night = () => {
    if (LN && LN.openStaff) LN.openStaff(false);
    if (host()) AF.time.set({ hours: 0.25 });
    resetPlanes();
    radio('Vera', 'Midnight. Take a plane, bail out over the Harbour Trust (F) and open your chute (Space) \u2014 the hatch is on the east roof.', 'r_plane');
  };
  const guardsOn = (on) => { for (const g of GD) if (g.bank) g.path.enabled = on; };
  const resetGuards = () => { for (const g of GD) for (const a of g.path.actors) { a.rx = null; a.rxOn = false; a.lag = 0; a.tilt = a.lift = 0; a.hp = undefined; a.hm = 0; } };
  const los = (x0, y0, z0, x1, y1, z1) => { for (let i = 1; i < 8; i++) { const u = i / 8; if (AF.solidAt(x0 + (x1 - x0) * u, y0 + (y1 - y0) * u, z0 + (z1 - z0) * u)) return false; } return true; };
  // how fast a guard's suspicion of p rises (0 = can't see p): a 50-degree cone out to 13 m, line of sight, anyone brushing past
  const sees = (a, p) => {
    if (!a || a.gap > 0 || AF.walkers.isDown(a)) return 0;
    const dx = p.x - a.x, dz = p.z - a.z, d = Math.hypot(dx, dz);
    if (d > 13 || Math.abs(p.y - a.y) > 3) return 0;
    const c = (dx * Math.sin(a.yaw) + dz * Math.cos(a.yaw)) / (d || 1);
    if (d > 1.7 && c < 0.64) return 0;
    if (!los(a.x, a.y + 1.6, a.z, p.x, p.y + 1.3, p.z)) return 0;
    return d < 1.7 ? 1.3 : 0.4 + 1.6 * (1 - d / 13);
  };
  H.sees = sees;
  let qT = 0;
  const watch = (dt, casino) => {
    const p = AF.player; let best = 0, who = null;
    for (const g of GD) { if (!!g.casino !== casino || !g.path.active) continue; for (const a of g.path.actors) { const r = sees(a, p); if (r > best) { best = r; who = a; } } }
    H.seen = best > 0; qT -= dt;
    if (best > 0) { H.sus = Math.min(1, H.sus + best * dt); if (who && H.sus > 0.3 && qT <= 0) { qT = 3; AF.emit('bubble', { who, name: casino ? 'Detective' : 'Guard', text: 'Hm? Who\u2019s there?', dur: 1.6 }); } }
    else H.sus = Math.max(0, H.sus - dt * 0.45);
    if (H.sus >= 1) { if (who) AF.emit('bubble', { who, name: 'Guard', text: 'Hey! You there!', dur: 2 }); say('jg_spot'); say('r_spotted'); fail(casino ? 'The house detective caught you at it.' : 'A guard spotted you.'); }
  };
  const guardOf = (a) => GD.findIndex((g) => g.path.actors.includes(a));
  const ko = (g, fx = 0, fz = 1) => { const a = GD[g] && GD[g].path.actors[0]; if (a && !AF.walkers.isDown(a)) AF.walkers.knock(a, fx, fz, 1.5, 1e6); };
  const onWalkerHit = (a, kind, fx, fz) => {
    const g = guardOf(a); if (g < 0 || !GD[g].bank || !stealth()) return false;
    if (kind === 'melee' && H.sus < 0.6 && !H.seen) { ko(g, fx || 0, fz || 1); send({ op: 'ko', g }); note('Lights out. He\u2019ll sleep till morning.', 'ok'); return true; }
    ko(g, fx || 0, fz || 1); fail(kind === 'melee' ? 'The guard saw it coming and hit the alarm.' : 'Gunfire in the banking hall \u2014 the alarm is up.'); return true;
  };
  const KEYN = ['north', 'south'];
  const grip = (k, remote) => {
    if (!is('keys') || H.grip[k] > 0) return;
    H.grip[k] = GRIP; say('click_metal');
    if (remote) return;
    send({ op: 'grip', k });
    if (!(H.grip[1 - k] > 0)) note(crewN() > 1 ? 'You hold the ' + KEYN[k] + ' key. Your partner takes the ' + KEYN[1 - k] + ' one \u2014 together!' : 'You hold the ' + KEYN[k] + ' key. ' + GRIP + ' seconds to reach the ' + KEYN[1 - k] + ' one!', 'ok');
  };
  const plant = (remote) => { if (!is('charge') || H.fuse > 0) return; H.fuse = 5; say('zip_bag'); if (!remote) { send({ op: 'plant' }); note('Charge set \u2014 five seconds. Get clear!', 'warn'); } };
  const gateShut = () => H.on && H.i <= IDX.charge;
  const syncProps = () => {
    if (B.gate) { const shut = gateShut(); if (B.gate.visible !== shut) { B.gate.visible = shut; B.gateCol.y1 = shut ? B.gateCol.y0 + 3.5 : B.gateCol.y0; } }
    for (let k = 0; k < B.bags.length; k++) { const v = H.on && H.i <= IDX.cash && !H.bags[k]; if (B.bags[k].visible !== v) B.bags[k].visible = v; }
  };
  const blowGate = (restored) => {
    if (!restored && P.gate) { AF.fx.boom(P.gate.x, P.gate.y + 1, P.gate.z, 0.8); const C = CB(); if (C) C.blast(P.gate.x, P.gate.y + 1, P.gate.z, 4.5, false); }
    H.alarm = true; const C = CB(); if (C) C.crime(160);
    radio('Vera', 'The vault is open. Grab the cash and go.', 'r_vault');
  };
  const bag = (k) => { if (H.bags[k]) return; H.bags[k] = true; say('zip_bag'); say('money'); const n = H.bags.filter(Boolean).length; note(n < 4 ? 'Cash bag ' + n + ' of 4.' : 'That\u2019s the lot. Move!', 'money'); };
  const takeBag = (k) => { if (!is('cash') || H.bags[k]) return; bag(k); send({ op: 'bag', k }); };

  // ---------------------------------------------------------------- act IV: the getaway
  const getaway = (restored) => {
    const C = CB(); if (C) C.crime(Math.max(0, 270 - C.heat));
    radio('Vera', 'The police scanner is lit up. My car\u2019s on Charter Street \u2014 run!', 'r_cops');
    const K = P.carSpot; if (!K || !VV || !VV.makeCar) return;
    if (H.car && !H.car.dead && !(restored && dist(H.car, K) > 10)) return;
    if (H.car) { H.car.temp = true; H.car = null; }
    // every client parks the same car on the same kerb, so co-op matches it (one drives, the others ride along)
    const type = VV.TYPES.find((t) => t.id === 'duesy') ? 'duesy' : VV.TYPES.find((t) => t.kind === 'car').id;
    try { const car = VV.makeCar(type, 0, K.x, K.z, K.yaw); car.temp = false; car.parked = true; H.car = car; P.car = { x: car.x, y: car.y, z: car.z }; } catch (e) { AF.warnOnce('heist car', e); }
  };
  const run = () => {
    radio('Vera', 'Go, go, go! Westgate Airfield \u2014 there\u2019s a plane fuelled and waiting.', 'v_go');
    resetPlanes();
    if (H.roadblock || !P.carSpot || !P.plane || !VV || !VV.makeCar) return;
    const S = P.carSpot, G = P.plane, k = kerbAt(S.x + (G.x - S.x) * 0.4, S.z + (G.z - S.z) * 0.4); if (!k) return;
    const cars = [];
    for (const s of [-1.5, 1.5]) { try { const c = VV.makeCar('police', 0, k.cx + k.nx * s, k.cz + k.nz * s, Math.atan2(k.nx, k.nz) + (s > 0 ? 0 : PI)); c.temp = true; c.parked = true; c.v = c.vx = c.vz = 0; cars.push(c); } catch (e) { AF.warnOnce('heist roadblock', e); } }
    H.roadblock = { x: k.cx, z: k.cz, cars, blown: false };
  };

  // ---------------------------------------------------------------- props: the vault gate, key boxes, cash bags, the roof hatch, the ladder
  const props = () => {
    const c = (h, o) => AF.col(h, Object.assign({ jitter: 0.15, edge: 0.3 }, o)), steel = c(0x6a7078, { metal: 0.85, rough: 0.35 }), dark = c(0x2a2c30, { metal: 0.6 }), brass = c(0xc9a24a, { metal: 0.9, rough: 0.3 });
    const mesh = (m, vs, anchor, x, y, z, yaw = 0) => { const g = AF.meshModel(m, { vs, anchor }); delete g.userData.src; const o = AF.modelMesh(g); o.position.set(x, y, z); o.rotation.y = yaw; o.castShadow = false; AF.scene.add(o); return o; };
    // vault gate (bars across the round doorway, x 42.4)
    const g = new AF.Model(2, 28, 28); for (let z = 0; z < 28; z += 3) g.box(0, 0, z, 2, 28, z + 1, steel); for (const y of [0, 9, 18, 27]) g.box(0, y, 0, 2, y + 1, 28, steel); g.box(0, 12, 12, 2, 16, 16, brass);
    B.gate = mesh(g, 1 / 8, [0, 0, 0.5], 42.35, 0.5, -125); B.gate.visible = false;
    B.gateCol = AF.addCollider(42.3, 0.5, -126.75, 42.65, 0.5, -123.25, 'heist-gate');
    // key boxes on the hall's east wall either side of the doorway
    const kb = new AF.Model(2, 5, 4); kb.box(0, 0, 0, 2, 5, 4, brass); kb.box(0, 1, 1, 1, 4, 3, dark); kb.set(0, 2, 2, steel);
    P.keys = [{ x: 41.0, y: 0.5, z: -128.6 }, { x: 41.0, y: 0.5, z: -121.4 }];
    P.keys.forEach((k, i) => {
      B.keys.push(mesh(kb, 1 / 8, [1, 0, 0.5], 41.75, 1.1, k.z));
      AF.addInteract({ x: k.x, y: 1.5, z: k.z, r: 1.5, label: 'Hold the ' + KEYN[i] + ' vault key', prio: 2, can: () => AF.mode === 'walk' && is('keys') && !(H.grip[i] > 0), act: () => grip(i) });
    });
    P.gate = { x: 41.3, y: 0.5, z: -125 };
    AF.addInteract({ x: 41.3, y: 1.5, z: -125, r: 1.6, label: 'Plant the thermal charge', prio: 2, can: () => AF.mode === 'walk' && is('charge') && H.fuse <= 0, act: () => plant(false) });
    // four cash bags in the vault
    const bm = new AF.Model(7, 4, 4), canvas = c(0x3a4a2e), strap = c(0xb89a60); bm.box(0, 0, 0, 7, 3, 4, canvas); bm.box(0, 3, 1, 7, 4, 3, canvas); bm.box(1, 0, 0, 2, 4, 4, strap); bm.box(5, 0, 0, 6, 4, 4, strap); bm.set(3, 2, 3, brass);
    P.bags = [{ x: 44.6, y: 0.5, z: -126.6 }, { x: 44.6, y: 0.5, z: -123.4 }, { x: 47.9, y: 0.5, z: -126.6 }, { x: 47.9, y: 0.5, z: -123.4 }];
    P.bags.forEach((b, k) => {
      const o = mesh(bm, 1 / 8, [0.5, 0, 0.5], b.x, b.y, b.z, k * 0.7); o.visible = false; B.bags.push(o);
      AF.addInteract({ x: b.x, y: 1.2, z: b.z, r: 1.4, label: 'Grab the cash bag', prio: 2, can: () => AF.mode === 'walk' && is('cash') && !H.bags[k], act: () => takeBag(k) });
    });
    // the roof hatch: on the banking-hall podium's east roof, drops you into the hall's quiet south-east corner
    const hp = free(47, -116, 30, 22); P.hatch = hp; P.c4 = { x: hp.x, y: hp.y, z: hp.z - 2.2, yaw: 0 }; P.drop = { x: 38.6, y: 0.5, z: -114.3, yaw: PI };
    const hm = new AF.Model(10, 8, 10); hm.box(0, 0, 0, 10, 6, 10, dark); hm.box(1, 6, 1, 9, 7, 9, steel); hm.box(2, 7, 4, 8, 8, 6, brass); B.hatch = mesh(hm, 1 / 8, [0.5, 0, 0.5], hp.x, hp.y, hp.z);
    AF.addCollider(hp.x - 0.625, hp.y, hp.z - 0.625, hp.x + 0.625, hp.y + 0.75, hp.z + 0.625, 'heist-hatch');
    AF.addInteract({ x: hp.x, y: hp.y + 1, z: hp.z, r: 1.9, label: 'Climb down the service hatch', prio: 2, can: () => AF.mode === 'walk' && H.on && H.i >= IDX.keys && H.i <= IDX.cash && Math.abs(AF.player.y - hp.y) < 2.5,
      act: () => { say('latch'); const s = spotFor(P.drop); AF.player.teleport(s.x, s.y, s.z, s.yaw); } });
    // the service ladder on the podium's Park Row face: nobody is stranded in the street after a bad jump
    const lx = 49.25, lz = -147.2, top = free(lx - 1.5, -145.4, 20, 10), lm = new AF.Model(6, 112, 1);
    lm.box(0, 0, 0, 1, 112, 1, steel); lm.box(5, 0, 0, 6, 112, 1, steel); for (let y = 4; y < 112; y += 6) lm.box(1, y, 0, 5, y + 1, 1, steel);
    B.ladder = mesh(lm, 1 / 8, [0.5, 0, 0], lx, 0.25, lz - 0.125);
    P.ladder = { x: lx, y: 0.25, z: lz - 1.2 }; P.ladderTop = { x: top.x, y: top.y, z: top.z, yaw: 0 };
    AF.addInteract({ x: lx, y: 1.3, z: lz - 0.9, r: 1.8, label: 'Climb the service ladder to the roof', prio: 2, can: () => AF.mode === 'walk' && H.on && H.i >= IDX.jump && H.i <= IDX.cash,
      act: () => { say('click_metal'); const s = P.ladderTop; AF.player.teleport(s.x, s.y, s.z, s.yaw); } });
  };

  // ---------------------------------------------------------------- build: guards (before the walkers build at 670), then the cast
  AF.onBuild('heist-guards', 600, () => {
    const WK = AF.walkers; if (!WK || !WK.addPath || !AF.peopleKit) return;
    const rng = AF.rng(8128), look = (col, yaw) => { const L = AF.peopleKit.makeLook('police', 'm', 'adult', rng); L.top = Object.assign({}, L.top, { col }); L.bottom = Object.assign({}, L.bottom, { col }); if (yaw != null) L.yaw = yaw; return L; };
    const add = (name, pts, o, tag) => { try { const p = WK.addPath(name, pts, Object.assign({ count: 1, activeRadius: 95, looks: [look(tag.casino ? 0x2a2a30 : 0x1f2a44, o.yaw)] }, o)); p.enabled = !tag.bank; GD.push(Object.assign({ path: p }, tag)); } catch (e) { AF.warnOnce('heist guards', e); } };
    add('heist guard hall', [[13.5, 0.5, -128.5], [24, 0.5, -128.5], [24, 0.5, -115.6], [13.5, 0.5, -115.6]], { speed: 1.0, mode: 'loop' }, { bank: true });
    add('heist guard aisle', [[14, 0.5, -122], [37, 0.5, -122]], { speed: 0.9, mode: 'pingpong', dwell: [{ i: 0, t: 4 }, { i: 1, t: 5 }] }, { bank: true });
    add('heist guard vault', [[40.2, 0.5, -125]], { speed: 0, yaw: -PI / 2 }, { bank: true });
    // the Solace Queen's house detective walks the Gilded Room (always)
    add('liner detective', [[-249, 1.5, 299.6], [-239.4, 1.5, 299.6], [-239.4, 1.5, 312.6], [-249, 1.5, 312.6]], { speed: 0.7, mode: 'loop', activeRadius: 110 }, { casino: true });
  });
  let chatIt = null;
  AF.onBuild('heist', 895, () => {
    const NP = AF.npc; if (!NP || !LN || !LN.ready) return;
    // Vera outside the Blue Heron, by the club door, facing the street (the club itself is packed)
    const bh = AF.buildings.find((b) => b.id === 'blue-heron'), d = bh && bh.doors[0];
    const vx = d ? d.x - Math.sin(d.yaw) * 1.6 : -20, vz = d ? d.z - Math.cos(d.yaw) * 1.6 : 100, vp = free(vx, vz, (d ? d.y : 0.5) + 2, 4), vyaw = d ? d.yaw + PI : 0;
    B.vera = NP.spawn({ id: 'heist-vera', name: 'Vera Lark', role: 'Planner \u00b7 The Harbour Trust Job', look: LOOKS.vera, x: vp.x, y: vp.y, z: vp.z, yaw: vyaw, greet: ['Psst. Got a minute?', 'Looking for work? Bring a friend.'], lines: [LINES.pitch] });
    P.vera = vp; P.veraYaw = vyaw;
    const c0 = free(vp.x + Math.sin(vyaw) * 2.2, vp.z + Math.cos(vyaw) * 2.2, vp.y + 2, 4); P.c0 = { x: c0.x, y: c0.y, z: c0.z, yaw: vyaw + PI };
    const vi = B.vera.interact; vi.label = 'Talk to Vera Lark \u00b7 The Harbour Trust Job (co-op)'; vi.prio = 1.2; vi.act = vera;
    // Kit at Hotel Serena (hidden until he is needed)
    P.kit = free(-149, 646, 12, 24); P.kitYaw = PI;
    B.kit = NP.spawn({ id: 'heist-kit', name: 'Kit Morrow', role: 'Harbour Trust clerk \u00b7 on holiday', look: LOOKS.kit, x: P.kit.x, y: P.kit.y, z: P.kit.z, yaw: PI, greet: ['Over here. Quietly.'], lines: [LINES.kit] });
    B.kit.interact.act = () => { if (is('kit')) H.flag.kit = true; };
    const km = free(P.kit.x + Math.sin(PI) * 2.2, P.kit.z + Math.cos(PI) * 2.2, P.kit.y + 2, 4); P.kitMeet = { x: km.x, y: km.y, z: km.z, yaw: 0 };
    showKit(false);
    // Silas in the purser's cage (facing its staff door), Prescott at the head of the Gilded Room's second baccarat table
    P.silas = { x: -253.5, y: 1.5, z: 306 }; P.silasYaw = 0;
    B.silas = NP.spawn({ id: 'heist-silas', name: 'Silas Crane', role: 'Owner \u00b7 the Grand Casino', look: LOOKS.silas, x: P.silas.x, y: P.silas.y, z: P.silas.z, yaw: 0, greet: ['The house always wins, friend.'], lines: [['The Queen\u2019s tables are honest. Mostly.', 'If you ever need something kept safe, come and see me.']] });
    B.silas.interact.act = () => { if (is('silas')) H.flag.silas = true; else AF.npc.talk(B.silas); };
    P.silasMeet = { x: P.silas.x, y: P.silas.y, z: P.silas.z + 2.2, yaw: PI };
    P.prescott = { x: -246.3, y: 1.5, z: 308.8 };
    B.prescott = NP.spawn({ id: 'heist-prescott', name: 'Mr Prescott', role: 'Manager \u00b7 the Harbour Trust', look: LOOKS.prescott, x: P.prescott.x, y: P.prescott.y, z: P.prescott.z, yaw: PI / 2, greet: ['Banco!'], lines: [['Eighteen inches of steel, my vault. Safest place on the coast.', 'Now if you\u2019ll excuse me \u2014 the shoe is hot tonight.']] });
    B.prescott.pose = 'still';
    const pi = B.prescott.interact; pi.act = () => { if (is('lift')) lift(); else AF.npc.talk(B.prescott); }; pi.r = 2.2;
    // the house detective: talk to him to hold his attention (the interact follows him round the room)
    chatIt = AF.addInteract({ x: 0, y: -999, z: 0, r: 2.2, label: 'Talk to the house detective (distract him)', prio: 2.2, can: () => AF.mode === 'walk' && is('lift') && H.chat <= 0, act: distract });
    // the cloakroom, the places, the checkpoints
    AF.addInteract({ x: -235.5, y: 2.5, z: 300.4, r: 2.2, label: 'Cloakroom \u00b7 evening wear', prio: 2, can: () => AF.mode === 'walk' && is('dress'), act: () => { say('cloth'); note('A dinner jacket for the gentlemen, gowns for the ladies \u2014 compliments of Vera. The whole crew is dressed.', 'ok'); H.flag.dress = true; } });
    P.cloak = { x: -235.5, y: 1.5, z: 300.4 };
    P.planes = (AF.planes.list || []).filter((p) => p.home && p.home.x < -400);
    const pl0 = P.planes[0]; P.plane = pl0 ? { x: pl0.home.x, y: AF.W.groundY(pl0.home.x, pl0.home.z), z: pl0.home.z } : { x: -520, y: 0.5, z: 80 };
    // the Westgate checkpoint: on the apron in front of the first plane's nose, facing it
    const py = pl0 ? pl0.home.yaw : PI; P.c3 = free(P.plane.x + Math.sin(py) * 9, P.plane.z + Math.cos(py) * 9, 12, 20); P.c3.yaw = py + PI;
    const I = AF.PLAN.world.island, strip = I && I.airstrip;
    P.strip = strip ? { x: (strip.x0 + strip.x1) / 2, y: AF.W.groundY((strip.x0 + strip.x1) / 2, strip.z), z: strip.z } : { x: -70, y: 2, z: 560 };
    P.c1 = free(-150, strip ? strip.z + 14 : 575, 14, 24); P.c1.yaw = 0;
    P.pontoon = LN.spots.pontoon; P.c2 = { x: LN.spots.pontoon.x, y: LN.spots.pontoon.y, z: LN.spots.pontoon.z, yaw: PI };
    P.carSpot = kerbAt(30, -98); if (P.carSpot) { P.car = { x: P.carSpot.x, y: P.carSpot.y, z: P.carSpot.z }; P.c5 = free(P.carSpot.x + P.carSpot.nx * 2.6, P.carSpot.z + P.carSpot.nz * 2.6, P.carSpot.y + 1.2, 3); P.c5.yaw = P.carSpot.yaw; }
    else P.c5 = free(30, -100, 4, 8);
    // Corsair Key: the strip, the stash outside the hangar, Vera and Silas waiting (hidden until the cash arrives)
    const K = AF.PLAN.world.key, KS = AF.key && AF.key.spots;
    P.keyStrip = K ? { x: (K.airstrip.x0 + K.airstrip.x1) / 2, y: K.airstrip.y, z: K.airstrip.z } : { x: 560, y: 2, z: 676 };
    P.stash = KS && KS.stash ? KS.stash : { x: 606, y: 2, z: 683 };
    P.c6 = KS && KS.land ? KS.land : { x: P.keyStrip.x, y: P.keyStrip.y, z: P.keyStrip.z + 14, yaw: PI / 2 };
    const sv = free(P.stash.x - 1.3, P.stash.z + 0.8, P.stash.y + 3, 6), ss = free(P.stash.x + 1.3, P.stash.z + 0.8, P.stash.y + 3, 6);
    B.vera2 = NP.spawn({ id: 'heist-vera2', name: 'Vera Lark', role: 'Planner', look: LOOKS.vera, x: sv.x, y: sv.y, z: sv.z, yaw: PI, greet: ['There they are.'], lines: [LINES.again] });
    B.silas2 = NP.spawn({ id: 'heist-silas2', name: 'Silas Crane', role: 'Corsair Key', look: LOOKS.silas, x: ss.x, y: ss.y, z: ss.z, yaw: PI, greet: ['Welcome to my island.'], lines: [['Nobody asks questions on Corsair Key.', 'Borrow the Cub by the hangar whenever you like.']] });
    const fm = free(P.stash.x, P.stash.z - 2.6, P.stash.y + 3, 6); P.finaleMeet = { x: fm.x, y: fm.y, z: fm.z, yaw: 0 };
    showFinale(false);
    props(); veraBlip();
  });

  // ---------------------------------------------------------------- Vera: the offer (a crew of two), the menu mid-job
  let sheetOpen = false;
  const vera = () => {
    const n = B.vera;
    if (H.on) { menu(); return; }
    talk(n, H.runs ? LINES.again : [LINES.pitch[0], 'There\u2019s a job. The biggest this town has ever seen. But it needs a crew \u2014 two of you, at least.'], offer);
  };
  const copyInvite = () => { const url = N.inviteUrl(); try { navigator.clipboard.writeText(url).then(() => note('Invite link copied \u2014 send it to your crew.', 'ok'), () => note('Invite link: ' + url, 'info')); } catch (e) { note('Invite link: ' + url, 'info'); } };
  const hostCrew = () => {
    if (!N || !N.host) return;
    N.host().then(() => { note('Lobby open \u2014 code ' + N.code + '. Friends pick Join co-op on the title screen, or open your invite link.', 'mission'); if (sheetOpen) AF.shop.refresh(); })
      .catch((e) => note('Couldn\u2019t open a lobby (' + ((e && e.message) || 'error') + ').', 'bad'));
  };
  const offer = () => {
    sheetOpen = true;
    AF.shop.open({ title: 'The Harbour Trust Job', sub: 'Co-op heist \u00b7 a crew of 2\u20134 \u00b7 ' + AF.cash(H.pay) + ' each', onClose: () => { sheetOpen = false; }, items: () => {
      const n = crewN();
      if (n >= NEED || H.solo) return [
        { name: H.runs ? 'Pull it again' : 'Take the job', desc: 'Starts for the whole crew (' + n + (n === 1 ? ' player' : ' players') + ') \u2014 plane, island, casino, vault, getaway', tag: 'Go', act: () => { AF.shop.close(); start(); } },
        { name: 'Not tonight', desc: 'She\u2019ll be here', tag: ' ', act: () => AF.shop.close() },
      ];
      return [
        online() ? { name: 'Waiting for your crew', desc: 'Share code ' + (N.code || '') + ' \u2014 friends pick Join co-op on the title screen', tag: 'Copy link', act: copyInvite }
          : { name: 'Host a crew', desc: 'Opens a co-op lobby; share the code with a friend', tag: 'Host', act: hostCrew },
        { name: 'Not tonight', desc: 'The job needs two', tag: ' ', act: () => AF.shop.close() },
      ];
    } });
  };
  const menu = () => AF.shop.open({ title: 'The Harbour Trust Job', sub: ST[H.i] ? lineOf(ST[H.i]).replace(/[{}]/g, '') : '', items: () => [
    { name: 'Keep going', desc: 'Vera taps her watch', tag: ' ', act: () => AF.shop.close() },
    { name: 'Retry from the last checkpoint', desc: CPS[H.cp].label, tag: ' ', act: () => { AF.shop.close(); retry(); } },
    { name: 'Call off the job', desc: 'Everyone goes home empty-handed', tag: ' ', act: () => { AF.shop.close(); H.quit(); } },
  ] });
  // the pause menu gets the same two buttons while a job is on (nobody has to walk back to Vera)
  const MN = document.createElement('div'); MN.className = 'coop-m heist-m'; MN.style.display = 'none';
  MN.innerHTML = '<div class="row"><label>Heist</label><div class="acts"><button class="btn" data-h="retry">Retry checkpoint</button><button class="btn" data-h="quit">Call it off</button></div></div>';
  { const menuEl = document.querySelector('#m-menu .panel'), stack = menuEl && menuEl.querySelector('.stack'); if (stack) menuEl.insertBefore(MN, stack); }
  MN.addEventListener('click', (e) => { e.stopPropagation(); const b = e.target.closest('[data-h]'); if (!b) return; if (UI.resume) UI.resume(); if (b.dataset.h === 'retry') retry(); else H.quit(); });

  // ---------------------------------------------------------------- the bag lends the crew's gear while the job is on
  if (AF.inv) AF.inv.extra.push(() => {
    if (!H.on) return null;
    const i = H.i, out = [];
    if (i > IDX.kitcut && i <= IDX.keys) out.push({ name: 'Kit\u2019s vault key', desc: 'Turns the north lock', icon: 'key', tag: 'Key' });
    if (i > IDX.lift && i <= IDX.keys) out.push({ name: 'Prescott\u2019s vault key', desc: 'Turns the south lock \u2014 lifted at baccarat', icon: 'key', tag: 'Key' });
    if (i > IDX.dress) out.push({ name: 'Evening wear', desc: 'Compliments of Vera', icon: 'wear', tag: 'Worn' });
    if (i >= IDX.jump && i <= IDX.hatch) out.push({ name: 'Parachute', desc: 'F bails out of a plane, Space opens it', icon: 'chute', tag: 'Gear' });
    if (i > IDX.silascut && i <= IDX.charge) out.push({ name: 'Thermal charge', desc: 'Five-second fuse', icon: 'charge', tag: 'Gear' });
    const n = H.bags.filter(Boolean).length; if (n) out.push({ name: 'Cash bags', desc: 'The Harbour Trust\u2019s money', icon: 'cash', tag: 'Loot', n });
    return out;
  });

  // ---------------------------------------------------------------- co-op
  const OPS = new Set(['go', 'st', 'done', 'fail', 'end', 'quit', 'retry', 'rs', 'grip', 'chat', 'plant', 'bag', 'ko']);
  const int = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;
  if (N && N.on) {
    N.on('heist', (m, from) => {
      if (!m || typeof m.op !== 'string' || !OPS.has(m.op)) return;
      const why = typeof m.why === 'string' ? m.why.slice(0, 120) : '', fromHost = from === 0;
      switch (m.op) {
        case 'go': if (host() && !H.on) start(); break;
        case 'st':
          if (!fromHost || host() || !int(m.i, 0, ST.length - 1) || !int(m.cp, 0, CPS.length - 1)) break;
          if (!H.on) { H.on = true; H.failing = false; resetWorld(m.i); veraBlip(); say('jg_start'); }
          H.cp = m.cp; if (m.i !== H.i) enter(m.i, m.r === 1); break;
        case 'done': if (host() && int(m.i, 0, ST.length - 1)) advance(m.i); break;
        case 'fail':
          if (host()) { if (H.on && !H.failing) { doFail(why || 'The crew was made.'); send({ op: 'fail', cp: H.cp, why }); } }
          else if (fromHost && H.on && int(m.cp, 0, CPS.length - 1)) { H.cp = m.cp; doFail(why); }
          break;
        case 'end': if (fromHost && !host()) end(m.ok === 1); break;
        case 'quit': if (host() && H.on) finish(false); break;
        case 'retry': if (host() && H.on && !H.failing) { restore(H.cp); send({ op: 'rs', cp: H.cp }); } break;
        case 'rs': if (fromHost && !host() && H.on && int(m.cp, 0, CPS.length - 1)) restore(m.cp); break;
        case 'grip': if (int(m.k, 0, 1)) grip(m.k, true); break;
        case 'chat': if (is('lift')) chat(from); break;
        case 'plant': plant(true); break;
        case 'bag': if (int(m.k, 0, 3) && is('cash')) bag(m.k); break;
        case 'ko': if (int(m.g, 0, GD.length - 1)) ko(m.g); break;
      }
    });
    N.on('join', (p) => { if (host() && H.on && p && Number.isInteger(p.slot)) send({ op: 'st', i: H.i, cp: H.cp }, p.slot); if (sheetOpen) AF.shop.refresh(); });
    N.on('left', () => { if (sheetOpen) AF.shop.refresh(); if (H.on && crewN() < NEED) note('Your partner left the crew. You can still finish \u2014 every step has a way through alone.', 'warn'); });
    N.on('end', () => { if (sheetOpen) AF.shop.refresh(); if (H.on) note('The crew split up. You\u2019re on your own now \u2014 finish the job, or call it off from the pause menu.', 'warn'); });
  }
  AF.on('died', () => { if (H.on && !H.failing) fail((AF.friends.current ? AF.friends.current.name : 'Someone') + ' was knocked out.'); });
  AF.respawnAt = () => { if (!H.on) return null; const at = spotFor(CPS[H.cp].at()); return at ? { label: CPS[H.cp].label, x: at.x, y: at.y, z: at.z, yaw: at.yaw || 0 } : null; };
  if (AF.combat) AF.combat.onWalkerHit = onWalkerHit;
  // the casino closes its tables to anyone mid-lift
  if (AF.casino) AF.casino.can = () => !H.lifting;
  Object.assign(H.dbg, { grip, plant, takeBag, distract, lift });

  // ---------------------------------------------------------------- tick
  let hudT = 0;
  const bars = () => {
    const bankWatch = stealth() && inHall(), liftWatch = H.lifting && is('lift') && H.chat <= 0;
    MI.bar('heist-sus', bankWatch || liftWatch ? { label: H.sus > 0.66 ? 'They\u2019re onto you' : H.seen ? 'Seen' : 'Suspicion', pct: H.sus, hot: H.sus > 0.66 } : null);
    MI.bar('heist-chat', is('lift') && H.chat > 0 ? { label: 'Detective busy', value: MI.time(H.chat), ok: true } : null);
    for (let k = 0; k < 2; k++) MI.bar('heist-k' + k, is('keys') ? { label: KEYN[k] + ' key', value: H.grip[k] > 0 ? 'Held ' + Math.ceil(H.grip[k]) : 'Free', pct: H.grip[k] / GRIP, ok: H.grip[k] > 0 } : null);
    MI.bar('heist-fuse', H.fuse > 0 ? { label: 'Charge', value: H.fuse.toFixed(1) + ' s', hot: true } : null);
    const n = H.bags.filter(Boolean).length;
    MI.bar('heist-bags', H.on && H.i >= IDX.cash && H.i <= IDX.stash ? { label: 'Cash bags', value: n + ' / 4', ok: n === 4 } : null);
  };
  AF.onTick('heist', 425, (dt) => {
    syncProps();
    if (AF.audio) AF.audio.hold('heist-alarm', 'alarm_loop', H.on && H.alarm && H.i <= IDX.car ? 1 : 0, 1, 30, 6, -125);
    // a follow-up once a dialogue closes (Vera's offer after her pitch)
    if (H.after) { H.afterT -= dt; if (H.afterT <= 0 && !(UI.dialogueOpen && UI.dialogueOpen())) { const f = H.after; H.after = null; f(); } }
    const mn = H.on ? '' : 'none'; if (MN.style.display !== mn) MN.style.display = mn;
    if (!H.on) return;
    H.t += dt;
    const s = ST[H.i]; if (!s) return;
    // the objective line + bars at 6 Hz (the markers follow by themselves)
    if ((hudT -= dt) <= 0) { hudT = 0.16; H.hud.title = 'The Harbour Trust Job \u00b7 ' + actOf(H.i).replace(/^Act \w+ \u00b7 /, ''); H.hud.line = s.cut ? '' : lineOf(s); bars(); }
    if (!(AF.combat && AF.combat.gallery)) AF.hud.job = s.cut ? null : H.hud;
    if (chatIt) { const a = is('lift') && DET(); if (a) { chatIt.x = a.x; chatIt.y = a.y + 1; chatIt.z = a.z; } else chatIt.y = -999; }
    if (H.failing) return;
    // stealth: the bank's night guards, the casino's detective while your hand is in Prescott's pocket
    if (stealth() && inHall()) watch(dt, false); else if (H.lifting && is('lift') && H.chat <= 0) watch(dt, true); else { H.sus = Math.max(0, H.sus - dt); H.seen = false; }
    // timers: the detective's chat, the key grips, the fuse
    if (H.chat > 0 && (H.chat -= dt) <= 0) { H.chat = 0; if (is('lift')) note('The detective is done chatting.', 'warn'); }
    for (let k = 0; k < 2; k++) if (H.grip[k] > 0 && (H.grip[k] -= dt) <= 0) { H.grip[k] = 0; if (is('keys')) note('The ' + KEYN[k] + ' key springs back \u2014 they have to be held together.', 'warn'); }
    if (H.fuse > 0) { const was = H.fuse; H.fuse -= dt; if (Math.floor(was * 2) !== Math.floor(H.fuse * 2)) say('click_metal', 0.7); if (was > 1.6 && H.fuse <= 1.6) say('v_fire'); if (H.fuse <= 0) { H.fuse = 0; H.flag.charge = true; } }
    // calls on the way: the jump, the roadblock, open water
    if (is('jump') && !H.flag.jumpSaid && flying() && dist(me(), P.hatch) < 170) { H.flag.jumpSaid = true; radio('Vera', 'Green light! Jump, jump, jump!', 'r_jump'); if (UI.help) UI.help(AF.touch ? 'Tap OUT to bail out, then CHUTE' : '[F] bail out \u00b7 [Space] open the parachute', 7000); }
    const R = H.roadblock;
    if (R && !R.blown && inCar() && dist(me(), R) < 55) {
      R.blown = true; radio('Vera', 'Roadblock! Fire in the hole!', 'v_fire');
      setTimeout(() => { const C = CB(); for (const c of R.cars) if (!c.dead) { AF.fx.boom(c.x, c.y + 0.5, c.z, 1); if (C) C.dmgCar(c, 999); } }, 900);
    }
    if (is('escape') && !H.flag.water && dist(me(), P.keyStrip) < 520) { H.flag.water = true; const C = CB(); if (C && C.stars) C.clearWanted('Out over open water \u2014 the police lose your trail.'); }
    if (s.cut ? cutDone() : s.done()) complete();
  });

  // ---------------------------------------------------------------- tests
  AF.test('heist: a crew of two starts it, every step completes, checkpoints restore, keys hold together, guards see in a cone', () => {
    if (!B.vera || !B.prescott || !B.silas || !B.kit || !B.vera2 || !B.silas2) return { ok: false, info: 'cast missing' };
    const bad = CPS.map((c, i) => { const a = c.at(); return a && [a.x, a.y, a.z].every(Number.isFinite) ? null : i; }).filter((i) => i != null);
    const G3 = GD.find((g) => g.bank && g.path.speed === 0), a = G3 && G3.path.actors[0];
    let cone = false;
    if (a) { const f = { x: a.x + Math.sin(a.yaw) * 5, y: a.y, z: a.z + Math.cos(a.yaw) * 5 }, b = { x: a.x - Math.sin(a.yaw) * 5, y: a.y, z: a.z - Math.cos(a.yaw) * 5 }; cone = sees(a, f) > 0 && sees(a, b) === 0; }
    const role = N ? N.role : 'off', m0 = AF.money.v, mode = AF.mode, p = AF.player, keep = { x: p.x, y: p.y, z: p.z, yaw: p.yaw }, hours = AF.time.hours, solo0 = H.solo;
    let refused = false, walked = 0, checkpoint = false, keys = false, gate = false, cuts = 0, gear = 0, oneKey = true;
    try {
      H.solo = false; start(); refused = !H.on && crewN() < NEED;   // alone, Vera wants a crew
      H.solo = true; begin(); const first = H.i === 0;
      for (let n = 0; n < 60 && H.on; n++) {
        if (ST[H.i].cut && cutDone()) cuts++;   // cutscenes never play in ?test: their step completes at once
        if (H.i === IDX.keys) {
          if (AF.inv) gear = AF.inv.extra.reduce((s, f) => s + ((f() || []).length), 0);
          grip(0); oneKey = !ST[H.i].done(); grip(1); keys = ST[H.i].done();
          if (!checkpoint) { restore(H.cp); checkpoint = H.i === IDX.keys && H.cp === 4 && dist(AF.player, P.drop) < 3 && H.grip[0] === 0; grip(0); grip(1); }
        }
        if (H.i === IDX.charge) gate = gateShut() && B.gateCol.y1 > B.gateCol.y0 + 1;
        walked++; advance(H.i);
      }
      walked = first && !H.on ? walked : -walked;
    } finally {
      if (H.on) end(false, true);
      H.solo = solo0; AF.money.add(m0 - AF.money.v); AF.setMode(mode === 'walk' ? 'walk' : 'aerial', keep); AF.time.set({ hours });
    }
    const nCuts = ST.filter((s) => s.cut).length;
    return { ok: refused && !bad.length && cone && walked === ST.length && checkpoint && keys && oneKey && gate && cuts === nCuts && gear >= 4 && GD.length >= 4 && !H.on && role === (N ? N.role : 'off'),
      info: `refused solo ${refused}, ${ST.length} steps walked ${walked}, cutscenes ${cuts}/${nCuts}, checkpoints ${CPS.length} (bad ${bad.join(',') || 'none'}), cone ${cone}, restore ${checkpoint}, keys ${keys} (one alone ${oneKey}), gate ${gate}, gear ${gear}, guards ${GD.length}` };
  });
}
} catch (e) { AF.partError('81-heist.js', e); }
