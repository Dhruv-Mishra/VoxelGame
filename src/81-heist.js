// ================================================================ 81-heist.js
try {
// ===== 81-heist: THE HARBOUR TRUST JOB — a story mission for 1–4 players across the whole map  (OWNER: game) =====
// Vera Lark (the Blue Heron) plans it; Kit Morrow (Hotel Serena) is the inside man; Silas Crane (the purser's cage on the SS Solace
// Queen) fences the take; Mr Prescott (the Gilded Room) carries the second vault key; the Moretti mob wants a cut.
//   I   steal a plane at Westgate -> land on Serena Isle -> meet Kit -> Moretti ambush -> jet ski to the Queen
//   II  evening wear at the cloakroom -> lift Prescott's key unseen (timing meter, the house detective) -> Silas in the cage
//   III midnight: plane + parachute onto the Harbour Trust roof, service hatch (or the front door) -> three night guards with
//       vision cones and a suspicion meter, takedowns from behind -> turn both vault keys together (co-op: two players within
//       1.5 s, solo 4 s) -> blow the vault gate
//   IV  four cash bags, the alarm, 3-4 stars -> Vera's car on Charter St -> a police roadblock goes up -> the Pleasure Pier
//       gangway -> stash the cash in Silas's vault (wanted cleared, $25,000 each)
// Six checkpoints; being spotted, felt, shot at or knocked out sends the crew back to the last one (76 AF.respawnAt for the
// knocked-out player). Co-op: the host owns the step index + checkpoint and broadcasts 'heist' {op:'st'}; every client checks its
// own player and reports 'done' / 'fail' / key turns; bags and takedowns are shared. The guards are path walkers (54) on the
// shared world clock, so every player sees the same patrol. Local randomness (the lift, the casino) is the player's own gameplay.
{
  const PI = Math.PI, LN = AF.liner, VV = AF.vehicles, N = AF.net, UI = AF.ui, root = document.getElementById('ui');
  const CB = () => AF.combat;
  const toast = (t) => AF.emit('toast', t);
  const say = (id, vol) => { if (AF.audio) AF.audio.play(id, vol != null ? { vol } : undefined); };
  const radio = (who, text, id) => { if (id) say(id); toast(who + ': \u201c' + text + '\u201d'); };
  const me = () => AF.mode === 'walk' || !AF.player.mesh ? AF.player : AF.player.mesh.position;
  const dist = (a, b) => (a && b ? Math.hypot(a.x - b.x, a.z - b.z) : 1e9);
  const host = () => !N || N.role !== 'guest';
  const online = () => !!N && N.role !== 'off';
  const send = (m, to) => { if (online()) N.send('heist', m, to); };
  const H = AF.heist = { on: false, i: -1, cp: 0, t: 0, flag: {}, sus: 0, seen: false, bags: [false, false, false, false], keyT: [-99, -99], fuse: 0, alarm: false, after: null, afterT: 0,
    lifting: false, failing: false, sentFor: -1, roadblock: null, car: null, dressed: false, jumpSaid: false, goonsN: 0, pay: 25000, runs: 0, hud: { title: 'The Harbour Trust Job', line: '', t: null, pay: null } };
  const P = H.at = {};      // places (filled at build)
  const B = H.obj = { bags: [], keys: [] };   // meshes, NPCs, colliders
  const GD = H.guards = [];  // { path, bank, casino }

  // ---------------------------------------------------------------- the story, step by step (cp = a checkpoint starts here)
  const ST = [
    { id: 'plane', cp: 0, act: 'Act I \u00b7 The Island', line: 'Steal a plane at Westgate Airfield', mark: () => P.plane, enter: () => radio('Vera', 'The planes on the Westgate apron are fuelled. Take one and get airborne.', 'r_plane'), done: () => AF.mode === 'fly' },
    { id: 'fly', line: 'Fly to Serena Isle and land on the airstrip', mark: () => P.strip, done: () => onIsland() && (AF.mode === 'walk' || (AF.mode === 'fly' && AF.planes.cur && AF.planes.cur.onGround && Math.abs(AF.planes.cur.v) < 8)) },
    { id: 'kit', cp: 1, line: 'Meet Kit Morrow at Hotel Serena', mark: () => P.kit, enter: () => showKit(true), done: () => H.flag.kit },
    { id: 'ambush', line: 'Moretti\u2019s men! Fight them off \u2014 or run for the jet skis', mark: () => nearestSki(), enter: (r) => ambush(r), done: () => ambushOver() },
    { id: 'ski', line: 'Jet ski to the Solace Queen \u2014 her pontoon is on the south side', mark: () => P.pontoon, enter: () => { showKit(false); const C = CB(); if (C) C.clearGoons(); radio('Vera', 'There\u2019s a pontoon on the Queen\u2019s south side. Come aboard there.', 'r_boat'); }, done: () => AF.mode === 'walk' && !!LN && LN.where(AF.player.x, AF.player.y, AF.player.z) !== '' },
    { id: 'dress', cp: 2, act: 'Act II \u00b7 The Queen', line: 'Pick up evening wear at the cloakroom (casino deck, by the north doors)', mark: () => P.cloak, done: () => H.flag.dress },
    { id: 'lift', line: 'Lift Prescott\u2019s key in the Gilded Room \u2014 from behind, while the house detective looks away', mark: () => P.prescott, enter: () => radio('Vera', 'Prescott\u2019s the one at the head of the baccarat table. Mind the house detective.', 'r_guard'), done: () => H.flag.lift },
    { id: 'silas', line: 'See Silas Crane in the purser\u2019s cage (the door behind the Gilded Room)', mark: () => P.silas, enter: () => { if (LN) LN.openStaff(true); }, done: () => H.flag.silas },
    { id: 'night', cp: 3, act: 'Act III \u00b7 The Vault', line: 'Midnight: jump from a plane onto the Harbour Trust roof and use the east service hatch \u2014 or risk the front door', mark: () => P.hatch, enter: () => night(), done: () => inHall() },
    { id: 'keys', cp: 4, line: 'Sneak to the vault and turn both keys together \u2014 punch a guard from behind to put him to sleep', mark: () => P.keys[H.keyT[0] > 0 ? 1 : 0], enter: () => radio('Vera', 'Two keys, one each side of the vault door. They have to turn together.', 'r_guard'), done: () => H.flag.keys },
    { id: 'charge', line: 'Plant the charge on the vault gate \u2014 then get clear', mark: () => P.gate, done: () => H.flag.charge },
    { id: 'cash', line: 'Grab the four cash bags', mark: () => nextBag(), enter: (r) => blowGate(r), done: () => H.bags.every(Boolean) },
    { id: 'car', cp: 5, act: 'Act IV \u00b7 The Getaway', line: 'Get to Vera\u2019s car on Charter Street', mark: () => P.car, enter: (r) => getaway(r), done: () => AF.mode === 'drive' || AF.mode === 'passenger' },
    { id: 'run', line: 'Shake the police and get to the Solace Queen \u2014 her gangway is at the Pleasure Pier', mark: () => P.gang, enter: () => run(), done: () => dist(me(), P.gang) < 18 || (!!LN && LN.where(me().x, me().y, me().z) !== '') },
    { id: 'stash', line: 'Stash the cash in Silas\u2019s vault (casino deck, aft)', mark: () => P.vault, enter: () => stash(), done: () => inVault() },
  ];
  const IDX = {}, CP_STEP = []; ST.forEach((s, i) => { IDX[s.id] = i; if (s.cp != null) CP_STEP[s.cp] = i; });
  const CPS = [
    { label: 'the Blue Heron', at: () => P.c0 }, { label: 'Serena Isle', at: () => P.c1 }, { label: 'the Solace Queen', at: () => P.c2 },
    { label: 'Westgate Airfield', at: () => P.c3, night: true }, { label: 'the Harbour Trust roof', at: () => P.c4, night: true }, { label: 'Charter Street', at: () => P.c5, night: true },
  ];
  const is = (id) => H.on && H.i === IDX[id];
  const stealth = () => H.on && H.i >= IDX.night && H.i <= IDX.charge;

  // ---------------------------------------------------------------- places
  const onIsland = () => { const I = AF.PLAN.world.island, p = me(); return !!I && ((p.x - I.cx) / I.rx) ** 2 + ((p.z - I.cz) / I.rz) ** 2 < 1.1; };
  const inHall = () => { const p = AF.player; return AF.mode === 'walk' && p.x > 11 && p.x < 49.5 && p.z > -137 && p.z < -113 && p.y < 5; };
  const inVault = () => { const p = AF.player; return AF.mode === 'walk' && p.x > -261.2 && p.x < -256.6 && p.z > 302 && p.z < 310 && p.y < 4 && p.y > 0.5; };
  const nearestSki = () => { const S = AF.island && AF.island.jetski && AF.island.jetski.skis, p = me(); let b = null, bd = 1e18; for (const k of S || []) { const d = (k.x - p.x) ** 2 + (k.z - p.z) ** 2; if (d < bd) { bd = d; b = k; } } return b ? { x: b.x, y: -1, z: b.z } : P.pontoon; };
  const nextBag = () => { for (let k = 0; k < 4; k++) if (!H.bags[k]) return P.bags[k]; return P.gate; };
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

  // ---------------------------------------------------------------- the cast
  const LOOKS = {
    vera: { female: true, skin: 0xe8b894, hair: 0x9a2a16, hairStyle: 'wavy', lips: 0xc8202a, top: { col: 0x1d6a5a, col2: 0xd8b04a, style: 'dress' }, bottom: { col: 0x1d6a5a, style: 'skirt' }, shoe: 0x141414, height: 1.0 },
    kit: { skin: 0xc68a5e, hair: 0x2a1a10, hairStyle: 'short', glasses: 0x2a2a2e, top: { col: 0xf2efe4, col2: 0x2a4a9a, style: 'shirt' }, bottom: { col: 0x3a3a40, style: 'jeans' }, shoe: 0x4a3020, hat: 'straw', hatCol: 0xe8d8a8, height: 1.02 },
    silas: { skin: 0xefc19f, hair: 0x9a9a9a, hairStyle: 'short', top: { col: 0x6a1a24, col2: 0xf2efe4, style: 'vest' }, bottom: { col: 0x1a1a1e, style: 'jeans' }, shoe: 0x141414, extra: 'chain', height: 1.06 },
    prescott: { skin: 0xf0c8a8, hair: 0xe0dcd0, hairStyle: 'short', glasses: 0xd8b04a, top: { col: 0x22253a, col2: 0xf2efe4, style: 'shirt' }, bottom: { col: 0x22253a, style: 'jeans' }, shoe: 0x141414, height: 1.0 },
  };
  const LINES = {
    pitch: ['Sit down, sugar. You look like someone who\u2019s tired of small change.', 'The Harbour Trust. Eighteen inches of steel and the fattest vault on the coast. By sunrise it\u2019s ours.',
      'My inside man, Kit Morrow, is lying low at Hotel Serena. Borrow a plane from Westgate and fly out to meet him.', 'Then we work the Solace Queen, open the vault at midnight and leave the take with Silas Crane. Nobody searches the Queen.'],
    kit: ['So you\u2019re Vera\u2019s crew. Keep your voice down \u2014 half this island drinks with the Moretti family.', 'The vault takes two keys turned at once. Mine\u2019s in my pocket. The other never leaves old Prescott.',
      'He plays baccarat every night aboard the Solace Queen. Lift his key and I\u2019ll leave the roof hatch on the latch at midnight.', 'Silas Crane runs that casino. He\u2019ll keep the money where no cop can look. Now go, before\u2014'],
    silas: ['Prescott\u2019s key already? Vera said you were good.', 'Here\u2019s the deal. You bring the Harbour Trust\u2019s money to my vault, right back there. The Queen sails under a foreign flag \u2014 no warrant reaches her.', 'Go at midnight. And don\u2019t get greedy.'],
    done: ['Look at you. The whole city\u2019s talking and nobody knows a thing.', 'Lay low a while, sugar. Then come and see me \u2014 there\u2019s always another job.'],
  };
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
  const talk = (n, lines, then) => { AF.emit('dialogue', { name: n.name, role: n.role, lines }); n.greetT = AF.clock.t; H.after = then || null; H.afterT = 0.3; };

  // ---------------------------------------------------------------- HUD: a title card + the suspicion meter
  const st = document.createElement('style');
  st.textContent = `
  #ui #h-card{position:absolute;left:0;right:0;top:26%;text-align:center;pointer-events:none;opacity:0;transition:opacity .7s}
  #ui #h-card.on{opacity:1} #ui #h-card h1{margin:0;font:400 44px Limelight,Georgia,serif;color:#f6e6c4;letter-spacing:2px;text-shadow:0 2px 16px #000}
  #ui #h-card div{margin-top:6px;color:#ffd24a;font-size:13px;letter-spacing:3px;text-transform:uppercase;text-shadow:0 1px 6px #000}
  #ui #h-sus{position:absolute;left:50%;top:calc(max(14px,env(safe-area-inset-top)) + 52px);transform:translateX(-50%);width:min(240px,60vw);padding:6px 12px 8px;border-radius:12px;text-align:center;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;display:none;pointer-events:none}
  #ui #h-sus .b{height:6px;border-radius:6px;background:rgba(255,255,255,.12);margin-top:5px;overflow:hidden} #ui #h-sus .b i{display:block;height:100%;width:0;background:#ffd24a;transition:width .1s}
  #ui #h-sus.hot{color:#ff8a7a} #ui #h-sus.hot .b i{background:#ff4a3a}
  @media (max-width:520px){#ui #h-card h1{font-size:28px}}
  #ui.photo #h-card,#ui.photo #h-sus{display:none!important}`;
  document.head.appendChild(st);
  const cardEl = document.createElement('div'); cardEl.id = 'h-card'; cardEl.innerHTML = '<h1></h1><div></div>'; root.appendChild(cardEl);
  const susEl = document.createElement('div'); susEl.id = 'h-sus'; susEl.className = 'panel hud'; susEl.innerHTML = '<span></span><div class="b"><i></i></div>'; root.appendChild(susEl);
  let cardT = 0;
  const card = (title, sub, s = 4) => { cardEl.firstChild.textContent = title; cardEl.lastChild.textContent = sub || ''; cardEl.classList.add('on'); cardT = s; };

  // ---------------------------------------------------------------- step engine
  const enter = (i, restored) => {
    H.i = i; H.t = 0; H.flag = {}; H.sus = 0; H.fuse = 0; H.lifting = false; H.after = null; H.sentFor = -1;
    const s = ST[i]; if (s.cp != null) H.cp = s.cp;
    guardsOn(stealth()); syncProps();
    if (s.act) card('THE HARBOUR TRUST JOB', s.act);
    if (s.enter) s.enter(!!restored);
    if (!restored && i > 0) { say(s.cp != null ? 'jg_pass' : 'ui_check'); if (s.cp != null) toast('Checkpoint \u2014 ' + CPS[s.cp].label + '.'); }
    AF.emit('heist', H);
  };
  const advance = (from) => {   // host
    if (!H.on || from !== H.i || H.failing) return;
    if (H.i + 1 >= ST.length) { finish(true); return; }
    enter(H.i + 1, false); send({ op: 'st', on: 1, i: H.i, cp: H.cp });
  };
  const complete = () => { if (H.sentFor === H.i) return; H.sentFor = H.i; if (host()) advance(H.i); else send({ op: 'done', i: H.i }, 0); };
  const fail = (why) => {
    if (!H.on || H.failing) return;
    if (host()) { doFail(why); send({ op: 'fail', cp: H.cp, why }); }
    else { H.failing = true; send({ op: 'fail', why }, 0); setTimeout(() => { if (H.failing === true) H.failing = false; }, 4000); }
  };
  const doFail = (why) => {
    H.failing = 'restore'; if (AF.hud.meterCancel) AF.hud.meterCancel(); H.lifting = false;
    say('jg_fail'); setTimeout(() => say('v_failed'), 900); card('BUSTED', why || 'The job went sideways.', 2.6);
    setTimeout(() => {
      H.failing = false; if (!H.on) return;
      restore(H.cp); if (host()) send({ op: 'st', on: 1, i: H.i, cp: H.cp });
      setTimeout(() => radio('Vera', 'Okay. Regroup and try that again.', 'r_checkpoint'), 1600);
    }, AF.TEST ? 0 : 2600);
  };
  const resetWorld = (i) => {
    const C = CB(); if (C) { C.clearWanted(); C.clearGoons(); }
    resetGuards(); H.alarm = false; H.keyT = [-99, -99]; H.fuse = 0; H.jumpSaid = false;
    for (let k = 0; k < 4; k++) H.bags[k] = i > IDX.cash;
    if (LN && LN.openVault) { LN.openVault(i >= IDX.stash); LN.openStaff(i === IDX.silas); }
    dress(i > IDX.dress); showKit(i === IDX.kit);
    if (H.roadblock) { for (const c of H.roadblock.cars) c.temp = true; H.roadblock = null; }
  };
  const restore = (cp) => {
    const C = CPS[cp], at = C.at(), i = CP_STEP[cp]; H.cp = cp;
    resetWorld(i);
    if (host() && C.night) AF.time.set({ hours: 0.25 });
    AF.health.heal(AF.health.max);
    const go = () => AF.setMode('walk', { x: at.x, y: at.y, z: at.z, yaw: at.yaw || 0, snap: true });
    if (AF.mode !== 'dead') { if (AF.stream && AF.stream.travel) AF.stream.travel({ label: C.label, go }); else go(); }
    enter(i, true);
  };
  const begin = () => {
    const J = AF.jobs; if (J && J.cur) J.cur.end('You clock off \u2014 there\u2019s a bigger job tonight.');
    H.on = true; H.cp = 0; H.failing = false; resetWorld(0); enter(0, true);
    say('jg_start'); card('THE HARBOUR TRUST JOB', 'Act I \u00b7 The Island');
  };
  const start = () => { if (H.on) return; if (!host()) { send({ op: 'go' }, 0); return; } begin(); send({ op: 'st', on: 1, i: H.i, cp: H.cp }); };
  const end = (ok, quiet) => {
    if (!H.on) return;
    H.on = false; H.i = -1; H.failing = false; H.after = null;
    const C = CB(); if (C) { C.clearGoons(); if (ok) C.clearWanted('Nobody searches the Queen. The police lose the trail.'); }
    guardsOn(false); resetGuards(); H.alarm = false; dress(false); showKit(false); H.keyT = [-99, -99]; H.fuse = 0; for (let k = 0; k < 4; k++) H.bags[k] = false;
    if (AF.hud.meterCancel) AF.hud.meterCancel(); H.lifting = false;
    if (LN && LN.openStaff) { LN.openStaff(false); setTimeout(() => { if (!H.on) LN.openVault(false); }, 9000); }
    if (H.car) { H.car.temp = true; H.car = null; }
    if (H.roadblock) { for (const c of H.roadblock.cars) c.temp = true; H.roadblock = null; }
    if (AF.jobs) AF.jobs.unmark(); if (AF.hud.job === H.hud) AF.hud.job = null;
    if (ok) {
      H.runs++; AF.money.add(H.pay); AF.saveSoon();
      say('jg_win'); setTimeout(() => say('v_complete'), 1300); card('THE HARBOUR TRUST JOB', 'Complete \u00b7 your cut ' + AF.cash(H.pay), 6);
      setTimeout(() => radio('Silas', 'Pleasure doing business. The Queen keeps her secrets.', 'r_good'), 2500);
    } else { cardT = Math.min(cardT, 0.01); if (!quiet) toast('The job is off. Vera will be at the Blue Heron if you change your mind.'); }
    AF.emit('heist', H);
  };
  const finish = (ok) => { if (!H.on) return; if (host()) send({ op: 'end', ok: ok ? 1 : 0 }); end(ok); };
  H.start = start; H.quit = () => (host() ? finish(false) : send({ op: 'quit' }, 0));
  H.dbg = { IDX, ST, CPS, begin, enter, restore, skip: () => advance(H.i) };   // harnesses (host / solo)

  // ---------------------------------------------------------------- act I: the island
  const ambush = (restored) => {
    radio('Kit', 'Those are Moretti\u2019s boys \u2014 they followed you from the airstrip! Run!', 'v_lookout');
    setTimeout(() => { if (H.on && H.i >= IDX.ambush) showKit(false); }, 2500);
    const C = CB(), p = AF.player; H.goonsN = 0;
    if (!C || !C.spawnGoon || !P.kit || dist(p, P.kit) > 150) return;
    for (let k = 0; k < 6; k++) {
      const a = k / 6 * PI * 2 + 0.4, r = 14 + (k % 2) * 7, x = P.kit.x + Math.sin(a) * r, z = P.kit.z + Math.cos(a) * r, y = AF.surfaceBelow(x, z, P.kit.y + 12, 24);
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

  // ---------------------------------------------------------------- act III: the bank
  const night = () => {
    if (LN && LN.openStaff) LN.openStaff(false);
    if (host()) AF.time.set({ hours: 0.25 });
    H.jumpSaid = false;
    radio('Vera', 'Midnight. Take a plane from Westgate, bail out over the Harbour Trust and land on the roof \u2014 the hatch is on the east side.', 'r_plane');
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
  const watch = (dt, list) => {
    const p = AF.player; let best = 0, who = null;
    for (const g of list) { if (!g.path.active) continue; for (const a of g.path.actors) { const r = sees(a, p); if (r > best) { best = r; who = a; } } }
    H.seen = best > 0; qT -= dt;
    if (best > 0) { H.sus = Math.min(1, H.sus + best * dt); if (who && H.sus > 0.3 && qT <= 0) { qT = 3; AF.emit('bubble', { who, name: 'Guard', text: 'Hm? Who\u2019s there?', dur: 1.6 }); } }
    else H.sus = Math.max(0, H.sus - dt * 0.45);
    if (H.sus >= 1) { if (who) AF.emit('bubble', { who, name: 'Guard', text: 'Hey! You there!', dur: 2 }); say('jg_spot'); say('r_spotted'); fail('A guard spotted you.'); }
  };
  const guardOf = (a) => GD.findIndex((g) => g.path.actors.includes(a));
  const ko = (g, fx = 0, fz = 1) => { const a = GD[g] && GD[g].path.actors[0]; if (a && !AF.walkers.isDown(a)) AF.walkers.knock(a, fx, fz, 1.5, 1e6); };
  const onWalkerHit = (a, kind, fx, fz) => {
    const g = guardOf(a); if (g < 0 || !GD[g].bank || !stealth()) return false;
    if (kind === 'melee' && H.sus < 0.6 && !H.seen) { ko(g, fx || 0, fz || 1); send({ op: 'ko', g }); toast('Lights out. He\u2019ll sleep till morning.'); return true; }
    ko(g, fx || 0, fz || 1); fail(kind === 'melee' ? 'The guard saw it coming and hit the alarm.' : 'Gunfire in the banking hall \u2014 the alarm is up.'); return true;
  };
  const turnKey = (k) => {
    if (!is('keys') || H.keyT[k] > 0) return;
    say('click_metal'); toast(k ? 'The south key turns\u2026' : 'The north key turns\u2026');
    if (host()) keyTurn(k); else { H.keyT[k] = 1; send({ op: 'key', k }, 0); setTimeout(() => { H.keyT[k] = -99; }, 1600); }
  };
  const keyWin = () => (online() && N.peers && N.peers.size > 0 ? 1.5 : 4);
  const keyTurn = (k) => {   // host: both keys inside the window open the time-lock
    const now = performance.now() / 1000; H.keyT[k] = now;
    if (H.keyT[0] > 0 && H.keyT[1] > 0 && Math.abs(H.keyT[0] - H.keyT[1]) <= keyWin()) { say('vault'); H.flag.keys = true; }
  };
  const plant = () => { if (!is('charge') || H.fuse > 0) return; H.fuse = 5; say('zip_bag'); toast('Charge set \u2014 five seconds. Get clear!'); };
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
  const bag = (k) => { if (H.bags[k]) return; H.bags[k] = true; say('zip_bag'); say('money'); const n = H.bags.filter(Boolean).length; toast(n < 4 ? 'Cash bag ' + n + ' of 4.' : 'That\u2019s the lot. Move!'); };
  const takeBag = (k) => { if (!is('cash') || H.bags[k]) return; bag(k); send({ op: 'bag', k }); };

  // ---------------------------------------------------------------- act IV: the getaway
  const getaway = (restored) => {
    const C = CB(); if (C) C.crime(Math.max(0, 270 - C.heat));
    radio('Vera', 'The police scanner is lit up. My car\u2019s on Charter Street \u2014 run!', 'r_cops');
    if (H.car && !H.car.dead) return;
    const K = P.carSpot; if (!K || !VV || !VV.makeCar) return;
    const slot = online() ? Math.max(0, N.me) : 0, type = VV.TYPES.find((t) => t.id === 'duesy') ? 'duesy' : VV.TYPES.find((t) => t.kind === 'car').id;
    const k = slot ? kerbAt(K.x, K.z, slot * 7) || K : K;
    try { const car = VV.makeCar(type, 0, k.x, k.z, k.yaw); car.temp = false; car.parked = true; H.car = car; P.car = { x: car.x, y: car.y, z: car.z }; } catch (e) { AF.warnOnce('heist car', e); }
  };
  const run = () => {
    radio('Vera', 'Go, go, go! Head for the Pleasure Pier \u2014 the Queen\u2019s gangway.', 'v_go');
    if (H.roadblock || !P.carSpot || !P.gang || !VV || !VV.makeCar) return;
    const S = P.carSpot, G = P.gang, k = kerbAt(S.x + (G.x - S.x) * 0.72, S.z + (G.z - S.z) * 0.72); if (!k) return;
    const cars = [];
    for (const s of [-1.5, 1.5]) { try { const c = VV.makeCar('police', 0, k.cx + k.nx * s, k.cz + k.nz * s, Math.atan2(k.nx, k.nz) + (s > 0 ? 0 : PI)); c.temp = true; c.parked = true; c.v = c.vx = c.vz = 0; cars.push(c); } catch (e) { AF.warnOnce('heist roadblock', e); } }
    H.roadblock = { x: k.cx, z: k.cz, cars, blown: false };
  };
  const stash = () => { if (LN && LN.openVault) LN.openVault(true); radio('Silas', 'Down to my vault, quick \u2014 aft, behind the cage. Before the police come aboard.', 'r_good'); };

  // ---------------------------------------------------------------- props: the vault gate, key boxes, cash bags, the roof hatch
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
      AF.addInteract({ x: k.x, y: 1.5, z: k.z, r: 1.4, label: 'Turn the vault key', prio: 2, can: () => AF.mode === 'walk' && is('keys') && !(H.keyT[i] > 0), act: () => turnKey(i) });
    });
    P.gate = { x: 41.3, y: 0.5, z: -125 };
    AF.addInteract({ x: 41.3, y: 1.5, z: -125, r: 1.6, label: 'Plant the charge on the gate', prio: 2, can: () => AF.mode === 'walk' && is('charge') && H.fuse <= 0, act: plant });
    // four cash bags in the vault
    const bm = new AF.Model(7, 4, 4), canvas = c(0x3a4a2e), strap = c(0xb89a60); bm.box(0, 0, 0, 7, 3, 4, canvas); bm.box(0, 3, 1, 7, 4, 3, canvas); bm.box(1, 0, 0, 2, 4, 4, strap); bm.box(5, 0, 0, 6, 4, 4, strap); bm.set(3, 2, 3, brass);
    P.bags = [{ x: 44.6, y: 0.5, z: -126.6 }, { x: 44.6, y: 0.5, z: -123.4 }, { x: 47.9, y: 0.5, z: -126.6 }, { x: 47.9, y: 0.5, z: -123.4 }];
    P.bags.forEach((b, k) => {
      const o = mesh(bm, 1 / 8, [0.5, 0, 0.5], b.x, b.y, b.z, k * 0.7); o.visible = false; B.bags.push(o);
      AF.addInteract({ x: b.x, y: 1.2, z: b.z, r: 1.3, label: 'Grab the cash bag', prio: 2, can: () => AF.mode === 'walk' && is('cash') && !H.bags[k], act: () => takeBag(k) });
    });
    // the roof hatch: on the banking-hall podium's east roof, drops you into the hall's quiet south-east corner
    const hp = free(47, -116, 30, 22); P.hatch = hp; P.c4 = { x: hp.x - 1.6, y: hp.y, z: hp.z, yaw: -PI / 2 }; P.drop = { x: 38.6, y: 0.5, z: -114.3, yaw: PI };
    const hm = new AF.Model(10, 8, 10); hm.box(0, 0, 0, 10, 6, 10, dark); hm.box(1, 6, 1, 9, 7, 9, steel); hm.box(2, 7, 4, 8, 8, 6, brass); B.hatch = mesh(hm, 1 / 8, [0.5, 0, 0.5], hp.x, hp.y, hp.z);
    AF.addCollider(hp.x - 0.625, hp.y, hp.z - 0.625, hp.x + 0.625, hp.y + 0.75, hp.z + 0.625, 'heist-hatch');
    AF.addInteract({ x: hp.x, y: hp.y + 1, z: hp.z, r: 1.9, label: 'Climb down the service hatch', prio: 2, can: () => AF.mode === 'walk' && (is('night') || is('keys')) && Math.abs(AF.player.y - hp.y) < 2.5,
      act: () => { say('latch'); AF.player.teleport(P.drop.x, P.drop.y, P.drop.z, P.drop.yaw); toast('You drop into the banking hall. Stay out of the guards\u2019 sight \u2014 a punch from behind puts one to sleep.'); } });
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
  const DET = () => { const g = GD.find((q) => q.casino); return g && g.path.actors[0]; };
  AF.onBuild('heist', 895, () => {
    const NP = AF.npc; if (!NP || !LN || !LN.ready) return;
    // Vera at the Blue Heron, a few steps inside the door
    const bh = AF.buildings.find((b) => b.id === 'blue-heron'), d = bh && bh.doors[0];
    const vx = d ? d.x + Math.sin(d.yaw) * 3 : -20, vz = d ? d.z + Math.cos(d.yaw) * 3 : 100, vp = free(vx, vz, (d ? d.y : 0.5) + 2, 4);
    B.vera = NP.spawn({ id: 'heist-vera', name: 'Vera Lark', role: 'Planner \u00b7 The Harbour Trust Job', look: LOOKS.vera, x: vp.x, y: vp.y, z: vp.z, yaw: d ? d.yaw + PI : 0, greet: ['Psst. Got a minute, sugar?', 'Looking for work?'], lines: [LINES.pitch] });
    P.vera = vp; P.c0 = free(vp.x + (d ? Math.sin(d.yaw + PI) * 1.6 : 0), vp.z + (d ? Math.cos(d.yaw + PI) * 1.6 : 1.6), vp.y + 2, 4); P.c0.yaw = d ? d.yaw : 0;
    const vi = B.vera.interact; vi.label = 'Talk to Vera Lark \u00b7 The Harbour Trust Job'; vi.prio = 1.2; vi.act = vera;
    // Kit at Hotel Serena (hidden until he is needed)
    P.kit = free(-149, 646, 12, 24);
    B.kit = NP.spawn({ id: 'heist-kit', name: 'Kit Morrow', role: 'Harbour Trust clerk \u00b7 on holiday', look: LOOKS.kit, x: P.kit.x, y: P.kit.y, z: P.kit.z, yaw: PI, greet: ['Over here. Quietly.'], lines: [LINES.kit] });
    B.kit.interact.act = () => { if (is('kit')) talk(B.kit, LINES.kit, () => { if (is('kit')) H.flag.kit = true; }); };
    showKit(false);
    // Silas in the purser's cage, Prescott at the head of the Gilded Room's second baccarat table
    P.silas = { x: -253.5, y: 1.5, z: 306 };
    B.silas = NP.spawn({ id: 'heist-silas', name: 'Silas Crane', role: 'Owner \u00b7 the Grand Casino', look: LOOKS.silas, x: P.silas.x, y: P.silas.y, z: P.silas.z, yaw: PI / 2, greet: ['The house always wins, friend.'], lines: [['The Queen\u2019s tables are honest. Mostly.', 'If you ever need something kept safe, come and see me.']] });
    B.silas.interact.act = () => { if (is('silas')) talk(B.silas, LINES.silas, () => { if (is('silas')) H.flag.silas = true; }); else AF.npc.talk(B.silas); };
    P.prescott = { x: -246.3, y: 1.5, z: 308.8 };
    B.prescott = NP.spawn({ id: 'heist-prescott', name: 'Mr Prescott', role: 'Manager \u00b7 the Harbour Trust', look: LOOKS.prescott, x: P.prescott.x, y: P.prescott.y, z: P.prescott.z, yaw: PI / 2, greet: ['Banco!'], lines: [['Eighteen inches of steel, my vault. Safest place on the coast.', 'Now if you\u2019ll excuse me \u2014 the shoe is hot tonight.']] });
    B.prescott.pose = 'still';
    const pi = B.prescott.interact;
    pi.act = () => { if (is('lift')) lift(); else AF.npc.talk(B.prescott); };
    pi.r = 2.2;
    // the cloakroom, the places, the checkpoints
    AF.addInteract({ x: -235.5, y: 2.5, z: 300.4, r: 1.7, label: 'Cloakroom \u00b7 evening wear', prio: 2, can: () => AF.mode === 'walk' && is('dress'), act: () => { dress(true); say('cloth'); toast('A dinner jacket for the gentleman, a gown for the lady \u2014 compliments of Vera.'); H.flag.dress = true; } });
    P.cloak = { x: -235.5, y: 1.5, z: 300.4 };
    const wp = (AF.planes.list || []).filter((p) => p.home && p.home.x < -400);
    const pl0 = wp[0]; P.plane = pl0 ? { x: pl0.home.x, y: AF.W.groundY(pl0.home.x, pl0.home.z), z: pl0.home.z } : { x: -520, y: 0.5, z: 80 };
    P.c3 = free(P.plane.x + 7, P.plane.z, 12, 20); P.c3.yaw = Math.atan2(P.plane.x - P.c3.x, P.plane.z - P.c3.z);
    const I = AF.PLAN.world.island, strip = I && I.airstrip;
    P.strip = strip ? { x: (strip.x0 + strip.x1) / 2, y: AF.W.groundY((strip.x0 + strip.x1) / 2, strip.z), z: strip.z } : { x: -70, y: 2, z: 560 };
    P.c1 = free(-150, strip ? strip.z + 14 : 575, 14, 24); P.c1.yaw = 0;
    P.pontoon = LN.spots.pontoon; P.c2 = { x: LN.spots.pontoon.x, y: LN.spots.pontoon.y, z: LN.spots.pontoon.z, yaw: PI };
    P.gang = LN.spots.gangway; P.vault = LN.spots.vault;
    P.carSpot = kerbAt(30, -98); if (P.carSpot) { P.car = { x: P.carSpot.x, y: P.carSpot.y, z: P.carSpot.z }; P.c5 = free(P.carSpot.x + P.carSpot.nx * 2.6, P.carSpot.z + P.carSpot.nz * 2.6, P.carSpot.y + 1.2, 3); P.c5.yaw = P.carSpot.yaw; }
    else P.c5 = free(30, -100, 4, 8);
    props();
  });

  // ---------------------------------------------------------------- Vera: the offer, the menu mid-job, the debrief
  const vera = () => {
    const n = B.vera;
    if (!H.on) { talk(n, H.runs ? LINES.done : LINES.pitch, offer); return; }
    AF.shop.open({ title: 'The Harbour Trust Job', sub: ST[H.i] ? ST[H.i].line : '', items: () => [
      { name: 'Keep going', desc: 'Vera taps her watch', tag: ' ', act: () => AF.shop.close() },
      { name: 'Retry from the last checkpoint', desc: CPS[H.cp].label, tag: ' ', act: () => { AF.shop.close(); if (host()) { restore(H.cp); send({ op: 'st', on: 1, i: H.i, cp: H.cp }); } else send({ op: 'fail', why: 'The crew regroups.' }, 0); } },
      { name: 'Call off the job', desc: 'Everyone goes home empty-handed', tag: ' ', act: () => { AF.shop.close(); if (host()) finish(false); else send({ op: 'quit' }, 0); } },
    ] });
  };
  const offer = () => AF.shop.open({ title: 'The Harbour Trust Job', sub: 'A story job for 1\u20134 players \u00b7 your cut ' + AF.cash(H.pay), items: () => [
    { name: H.runs ? 'Pull it again' : 'Take the job', desc: online() ? 'Starts for the whole crew' : 'Plane, island, casino, vault, getaway', tag: 'Go', act: () => { AF.shop.close(); start(); } },
    { name: 'Not tonight', desc: 'She\u2019ll be here', tag: ' ', act: () => AF.shop.close() },
  ] });

  // ---------------------------------------------------------------- the casino lift (Act II)
  const lift = () => {
    const p = AF.player, n = B.prescott, dx = p.x - n.x, dz = p.z - n.z, d = Math.hypot(dx, dz) || 1;
    if ((dx * Math.sin(n.yaw) + dz * Math.cos(n.yaw)) / d > -0.3) { toast('He\u2019d see you coming. Get behind him.'); return; }
    if (sees(DET(), p) > 0) { toast('Not now \u2014 the house detective is looking this way.'); return; }
    H.lifting = true; H.sus = 0;
    AF.hud.meter({ label: 'Lift the key from his jacket', sub: AF.touch ? 'Tap when the needle is in the green' : 'Click, E or Q when the needle is in the green', speed: 1.25, zone: [0.6, 0.74] }, (v, ok) => {
      H.lifting = false; if (!is('lift')) return;
      if (ok) { say('zip_bag'); toast('Got it. Prescott never felt a thing.'); H.flag.lift = true; return; }
      if (Math.abs(v - 0.67) < 0.2) { AF.emit('bubble', { who: n, name: 'Prescott', text: 'Hm? \u2014 Banco!', dur: 2 }); toast('Prescott shifts in his seat\u2026 easy. Try again.'); return; }
      AF.emit('bubble', { who: n, name: 'Prescott', text: 'Thief! Security!', dur: 2.5 }); fail('Prescott felt your hand in his pocket.');
    });
  };

  // ---------------------------------------------------------------- co-op
  const OPS = new Set(['go', 'st', 'done', 'fail', 'end', 'key', 'snap', 'bag', 'ko', 'quit']);
  const int = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;
  if (N && N.on) {
    N.on('heist', (m, from) => {
      if (!m || typeof m.op !== 'string' || !OPS.has(m.op)) return;
      const why = typeof m.why === 'string' ? m.why.slice(0, 120) : '', fromHost = from === 0;
      switch (m.op) {
        case 'go': if (host() && !H.on) start(); break;
        case 'st':
          if (!fromHost || host() || !int(m.i, 0, ST.length - 1) || !int(m.cp, 0, CPS.length - 1)) break;
          if (!H.on) { H.on = true; H.failing = false; resetWorld(m.i); say('jg_start'); }
          H.cp = m.cp; if (m.i !== H.i) enter(m.i, false); break;
        case 'done': if (host() && int(m.i, 0, ST.length - 1)) advance(m.i); break;
        case 'fail':
          if (host()) { if (H.on && !H.failing) { doFail(why || 'The crew was made.'); send({ op: 'fail', cp: H.cp, why }); } }
          else if (fromHost && H.on && int(m.cp, 0, CPS.length - 1)) { H.cp = m.cp; doFail(why); }
          break;
        case 'end': if (fromHost && !host()) end(m.ok === 1); break;
        case 'key': if (host() && int(m.k, 0, 1) && is('keys')) keyTurn(m.k); break;
        case 'snap': if (fromHost && is('keys')) toast('The keys spring back \u2014 they have to turn together.'); break;
        case 'bag': if (int(m.k, 0, 3) && is('cash')) bag(m.k); break;
        case 'ko': if (int(m.g, 0, GD.length - 1)) ko(m.g); break;
        case 'quit': if (host() && H.on) finish(false); break;
      }
    });
    N.on('join', (p) => { if (host() && H.on && p && Number.isInteger(p.slot)) send({ op: 'st', on: 1, i: H.i, cp: H.cp }, p.slot); });
  }
  AF.on('died', () => { if (H.on && !H.failing) fail((AF.friends.current ? AF.friends.current.name : 'Someone') + ' was knocked out.'); });
  AF.respawnAt = () => { if (!H.on) return null; const at = CPS[H.cp].at(); return at ? { label: CPS[H.cp].label, x: at.x, y: at.y, z: at.z, yaw: at.yaw || 0 } : null; };
  if (AF.combat) AF.combat.onWalkerHit = onWalkerHit;
  // the casino closes its tables to anyone mid-lift
  if (AF.casino) AF.casino.can = () => !H.lifting;

  // ---------------------------------------------------------------- tick
  AF.onTick('heist', 425, (dt) => {
    if (cardT > 0 && (cardT -= dt) <= 0) cardEl.classList.remove('on');
    // props follow the story
    syncProps();
    if (AF.audio) AF.audio.hold('heist-alarm', 'alarm_loop', H.on && H.alarm && H.i <= IDX.car ? 1 : 0, 1, 30, 6, -125);
    if (!H.on) { susEl.style.display = 'none'; return; }
    H.t += dt;
    if (H.after) { H.afterT -= dt; if (H.afterT <= 0 && !(UI.dialogueOpen && UI.dialogueOpen())) { const f = H.after; H.after = null; f(); } }
    const s = ST[H.i]; if (!s) return;
    // objective line + marker
    const mk = s.mark && s.mark();
    if (mk) { const p = me(); H.hud.line = s.line + ' \u00b7 ' + Math.round(Math.hypot(mk.x - p.x, mk.z - p.z)) + ' m'; if (AF.jobs && (H.mx !== mk.x || H.mz !== mk.z)) { H.mx = mk.x; H.mz = mk.z; AF.jobs.mark(mk.x, mk.y ?? AF.W.groundY(mk.x, mk.z), mk.z); } }
    else H.hud.line = s.line;
    H.hud.t = H.fuse > 0 ? H.fuse : null;
    if (!(AF.combat && AF.combat.gallery)) AF.hud.job = H.hud;
    if (H.failing) return;
    // stealth: the bank's night guards, the casino's detective while your hand is in Prescott's pocket
    const bankWatch = stealth() && inHall(), liftWatch = H.lifting && is('lift');
    if (bankWatch) watch(dt, GD.filter((g) => g.bank)); else if (liftWatch) watch(dt, GD.filter((g) => g.casino)); else { H.sus = Math.max(0, H.sus - dt); H.seen = false; }
    const showSus = (bankWatch || liftWatch) && H.on, label = H.fuse > 0 ? 'Charge \u00b7 ' + H.fuse.toFixed(1) + ' s' : H.sus > 0.66 ? 'Suspicion \u00b7 they\u2019re onto you!' : H.seen ? 'Suspicion \u00b7 you\u2019re seen' : 'Suspicion';
    susEl.style.display = showSus || H.fuse > 0 ? 'block' : 'none';
    if (showSus || H.fuse > 0) { susEl.firstChild.textContent = label; susEl.lastChild.firstChild.style.width = Math.round((H.fuse > 0 ? 1 - H.fuse / 5 : H.sus) * 100) + '%'; susEl.classList.toggle('hot', H.sus > 0.66 || H.fuse > 0); }
    // keys spring back (host), the fuse, the jump call, the roadblock
    if (is('keys') && host()) { const now = performance.now() / 1000; for (let k = 0; k < 2; k++) if (H.keyT[k] > 0 && H.keyT[1 - k] < 0 && now - H.keyT[k] > keyWin()) { H.keyT[k] = -99; toast('The key springs back \u2014 they have to turn together.'); send({ op: 'snap' }); } }
    if (H.fuse > 0) { const was = H.fuse; H.fuse -= dt; if (Math.floor(was * 2) !== Math.floor(H.fuse * 2)) say('click_metal', 0.7); if (was > 1.6 && H.fuse <= 1.6) say('v_fire'); if (H.fuse <= 0) { H.fuse = 0; H.flag.charge = true; } }
    if (is('night') && !H.jumpSaid && AF.mode === 'fly' && dist(me(), { x: 30, z: -125 }) < 230) { H.jumpSaid = true; radio('Vera', 'Green light! Jump, jump, jump!', 'r_jump'); }
    const R = H.roadblock;
    if (R && !R.blown && (AF.mode === 'drive' || AF.mode === 'passenger') && dist(me(), R) < 55) {
      R.blown = true; radio('Vera', 'Roadblock! Fire in the hole!', 'v_fire');
      setTimeout(() => { const C = CB(); for (const c of R.cars) if (!c.dead) { AF.fx.boom(c.x, c.y + 0.5, c.z, 1); if (C) C.dmgCar(c, 999); } }, 900);
    }
    if (s.done()) complete();
  });

  // ---------------------------------------------------------------- tests
  AF.test('heist: the Harbour Trust Job runs start to finish, checkpoints restore, guards see in a cone', () => {
    if (!B.vera || !B.prescott || !B.silas || !B.kit) return { ok: false, info: 'cast missing' };
    const bad = CPS.map((c, i) => { const a = c.at(); return a && [a.x, a.y, a.z].every(Number.isFinite) ? null : i; }).filter((i) => i != null);
    const G3 = GD.find((g) => g.bank && g.path.speed === 0), a = G3 && G3.path.actors[0];
    let cone = false;
    if (a) { const f = { x: a.x + Math.sin(a.yaw) * 5, y: a.y, z: a.z + Math.cos(a.yaw) * 5 }, b = { x: a.x - Math.sin(a.yaw) * 5, y: a.y, z: a.z - Math.cos(a.yaw) * 5 }; cone = sees(a, f) > 0 && sees(a, b) === 0; }
    const role = N ? N.role : 'off', m0 = AF.money.v, mode = AF.mode, p = AF.player, keep = { x: p.x, y: p.y, z: p.z, yaw: p.yaw }, hours = AF.time.hours;
    let walked = 0, checkpoint = false, keys = false, gate = false;
    try {
      begin(); const first = H.i === 0;
      for (let n = 0; n < 40 && H.on; n++) {
        if (H.i === IDX.keys) { keyTurn(0); keyTurn(1); keys = H.flag.keys === true; if (!checkpoint) { restore(H.cp); checkpoint = H.i === IDX.keys && H.cp === 4 && (!AF.TEST || dist(AF.player, P.c4) < 3); } }
        if (H.i === IDX.charge) gate = gateShut() && B.gateCol.y1 > B.gateCol.y0 + 1;
        walked++; advance(H.i);
      }
      walked = first && !H.on ? walked : -walked;
    } finally {
      if (H.on) end(false, true);
      AF.money.add(m0 - AF.money.v); AF.setMode(mode === 'walk' ? 'walk' : 'aerial', keep); AF.time.set({ hours });
    }
    return { ok: !bad.length && cone && walked === ST.length && checkpoint && keys && gate && GD.length >= 4 && !H.on && role === (N ? N.role : 'off'),
      info: `${ST.length} steps walked ${walked}, checkpoints ${CPS.length} (bad ${bad.join(',') || 'none'}), cone ${cone}, restore ${checkpoint}, keys ${keys}, gate ${gate}, guards ${GD.length}` };
  });
}
} catch (e) { AF.partError('81-heist.js', e); }
