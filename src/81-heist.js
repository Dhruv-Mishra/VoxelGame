// ================================================================ 81-heist.js
try {
// ===== 81-heist: THE HARBOUR TRUST JOB — a co-op story mission for a crew of two to four, across the whole map  (OWNER: game) =====
// Vera Lark (the Blue Heron) plans it; Kit Morrow is the inside man on Serena Isle; Mr Prescott (the Solace Queen's high-roller salon)
// carries the second vault key; Silas Crane runs the Queen's casino and Corsair Key; the Moretti family wants it all.
//   I   Papers (night): Vera's briefing -> pick the night grille at Kovac's tailor, sneak past the watchman, two pilot uniforms off the
//       rail -> pilot IDs from Ezra Quill (stamp
//       minigame) -> the Westgate crew gate -> a plane -> 3 km south to Serena Isle
//   II  Serena Isle: Kit (cutscene) -> the Moretti smugglers' tunnel (stealth) -> the arms cache (lockpick): silenced pistols + a drill
//       -> the sea cave -> Moretti's men in the cove -> jet skis 1.5 km to the Solace Queen
//   III The Queen (evening): knock out a waiter + a dealer for their uniforms -> the salon -> the sting: the dealer deals Prescott a
//       rotten hand while the waiter serves his drink and lifts the key -> Silas (cutscene) -> his launch runs the crew ashore
//   IV  Midnight, two roles: the HACKER (zoo keeper's uniform, the lion den, the bunker + sewer, the Kestrel terminal, then CCTV) and
//       the INFILTRATOR (the bank roof, the keypad door, the back offices + hall past guards and cameras, keys under a time-lock
//       override, the laser grid, the drill, four bags). Solo: the hack first, then the bank with the Kestrel tablet (T).
//   V   Getaway: the fire exit -> Vera's car -> the police + a roadblock -> Westgate -> 3 km to Corsair Key
//   VI  Corsair Key: the hangar -> the betrayal (cutscene) -> an all-out gunfight with Silas's own LMG -> the finale (cutscene)
// No teleports: every move is the player's own, a cutscene, or a retry from a checkpoint. A crew of two is needed to start (or the
// solo flag); every two-person moment has a solo way through. The host owns the step index, the Act IV tracks and the checkpoint
// ('heist' {op:'st'}); each client checks its own player and reports 'done' / 'tdone'.
{
  const PI = Math.PI, VV = AF.vehicles, N = AF.net, UI = AF.ui, MI = AF.mission, S = AF.stealth, HB = AF.heistBank, HS = AF.heistSets;
  const CB = () => AF.combat, LN = () => AF.liner;
  const A = HS ? HS.at : {};
  const sfx = (id, o) => { if (AF.audio) AF.audio.play(id, o); };
  const note = (text, kind = 'mission') => AF.emit('toast', { text, kind });
  const me = () => (AF.mode === 'walk' || AF.mode === 'cutscene' || AF.mode === 'cctv' || !AF.player.mesh ? AF.player : AF.player.mesh.position);
  const dist = (a, b) => (a && b ? Math.hypot(a.x - b.x, a.z - b.z) : 1e9);
  const online = () => !!N && N.role !== 'off';
  const host = () => !online() || N.role === 'host';
  const crewN = () => (online() ? 1 + N.peers.size : 1);
  const mySlot = () => (online() ? Math.max(0, N.me) : 0);
  const send = (m, to) => { if (online()) N.send('heist', m, to); };
  const play = (kind, o) => (AF.minigame && AF.minigame.play ? AF.minigame.play(kind, o) : new Promise((r) => setTimeout(() => r({ ok: true }), 900)));
  const NEED = 2, GRIP = 8, LOCK = 25;
  const H = AF.heist = { on: false, i: -1, cp: 0, t: 0, flag: {}, got: {}, tr: { h: 0, n: 0 }, roles: [], role: null, wear: null, wears: [], took: {}, anger: 0, angerN: 0, strikes: 0, tray: false,
    lifting: false, dealing: false, drilling: false, lockT: 0, grip: [0, 0], bags: [false, false, false, false], failing: false, sentFor: -1, sentTr: '', cutting: false, cutOn: false, later: null,
    after: null, afterT: 0, roadblock: null, car: null, goonsN: 0, waves: 0, bosses: [], pay: 40000, runs: 0, need: NEED, solo: false, hud: { title: 'The Harbour Trust Job', line: '', t: null, pay: null } };
  AF.noTravel = () => H.on;
  // the lion house's old hatch only works for the hacker on the night (it stays shut otherwise)
  if (AF.den) AF.den.hatchInteract = () => is('night') && myRole() === 'hack';
  // Westgate's crew gate (47): while the job is on, it opens for the crew once the gate guard has cleared their papers
  if (AF.airside) { const prev = AF.airside.ok; AF.airside.ok = () => (H.on ? !!H.got.cleared : prev()); }
  const LOOKS = (HS && HS.looks) || {};
  { const prev = UI.lookOf; UI.lookOf = (name) => LOOKS[String(name).split(' ')[0].toLowerCase()] || (prev ? prev(name) : null); }

  // ---------------------------------------------------------------- voices: ONE story line at a time
  // NPC lines spoken in place and Vera's radio calls share a single queue, so nobody ever talks over anybody: a speaker's next line
  // waits for the last, and a radio call waits for whoever is talking in the room plus a beat (Vera phones in after the scene, never
  // over it). In-person lines go ahead of queued radio calls (an urgent call goes first); a cutscene holds the queue (it plays its own
  // lines); an in-person line that waited too long (the moment has passed) is dropped. Guard barks (80-stealth) are not story lines.
  const VO = (id) => (AF.voLine ? AF.voLine(id) : null);
  const RQ = []; let talkEnd = -1e9, personEnd = -1e9;
  const SAY_GAP = 0.3, RADIO_GAP = 1.2, STALE = 12;
  const queue = (q) => {
    if (RQ.some((o) => o.id === q.id)) return;
    let i = 0;
    if (q.urgent) { while (i < RQ.length && RQ[i].urgent) i++; }
    else if (q.who) { while (i < RQ.length && (RQ[i].urgent || RQ[i].who)) i++; }
    else i = RQ.length;
    RQ.splice(i, 0, q);
  };
  const radio = (id, first, when) => { if (VO(id)) queue({ id, who: null, urgent: !!first, t: AF.clock.t, when: when || null }); };
  const speak = (id, who, dur) => { if (VO(id) && who) queue({ id, who, dur, urgent: false, t: AF.clock.t }); };
  const voiceNow = () => {
    const now = AF.clock.t;
    if (!RQ.length || now < talkEnd || MI.cut.on) return;
    if (!RQ[0].who && now < personEnd + RADIO_GAP) return;
    const q = RQ.shift(), L = VO(q.id); if (!L) return;
    // a conditional line is checked when it would play, not when it was queued (Vera never says "clean" after the alarm went up)
    if (q.when && !q.when()) return;
    if (q.who) {
      if (now - q.t > STALE) return;
      const w = q.who, len = (AF.audio && AF.audio.voice ? AF.audio.voice(q.id, { x: w.x, y: w.y + 1.6, z: w.z }) : 0) || Math.max(2.2, L[2].length * 0.065);
      AF.emit('bubble', { who: w, name: L[1], text: L[2], dur: q.dur || Math.max(2.4, len + 0.4) });
      talkEnd = personEnd = now + len; talkEnd += SAY_GAP;
    } else {
      const len = (AF.audio && AF.audio.voice ? AF.audio.voice(q.id, { radio: true }) : 0) || Math.max(2.2, L[2].length * 0.065);
      talkEnd = now + len + 0.4;
      AF.emit('toast', { title: L[1], text: L[2], kind: 'radio', look: UI.lookOf(L[1]) });
    }
  };
  const hushVoices = () => { RQ.length = 0; talkEnd = personEnd = -1e9; };
  H.radio = radio; H.speak = speak;

  // ---------------------------------------------------------------- places + checks
  const SC = { x: 0, y: 0, z: 0 };
  const isPlane = (v) => !!v && !!AF.planes && AF.planes.list.includes(v);
  const rideVeh = () => (AF.mode === 'passenger' && AF.coop && AF.coop.ride ? AF.coop.ride.veh : null);
  const flying = () => AF.mode === 'fly' || isPlane(rideVeh());
  const inCar = () => AF.mode === 'drive' || (AF.mode === 'passenger' && !!rideVeh() && !isPlane(rideVeh()));
  const landed = () => { const pl = AF.mode === 'fly' && AF.planes.cur; return !!pl && pl.onGround && Math.abs(pl.v) < 8; };
  const near = (p, r, dy = 2.6) => { const q = AF.player; return AF.mode === 'walk' && !!p && Math.hypot(q.x - p.x, q.z - p.z) < r && Math.abs(q.y - (p.y ?? q.y)) < dy; };
  const inEll = (E) => { const p = me(); return !!E && ((p.x - E.cx) / E.rx) ** 2 + ((p.z - E.cz) / E.rz) ** 2 < 1.1; };
  const onIsland = () => inEll(AF.PLAN.world.island);
  const onKey = () => inEll(AF.PLAN.world.key);
  const onQueen = () => AF.mode === 'walk' && !!LN() && LN().where(AF.player.x, AF.player.y, AF.player.z) !== '';
  const onRoof = () => { const p = AF.player; return AF.mode === 'walk' && p.y > 13.5 && p.x > 9 && p.x < 51 && p.z > -148 && p.z < -103; };
  const inStair = () => { const p = AF.player; return AF.mode === 'walk' && p.x > 44.7 && p.x < 49.3 && p.z > -112.8 && p.z < -105.2 && p.y < 13.9; };
  const inBank = () => { const p = AF.player; return AF.mode === 'walk' && p.x > 10.5 && p.x < 49.6 && p.z > -137.5 && p.z < -105 && p.y < 13.9; };
  const inVaultFar = () => { const p = AF.player; return AF.mode === 'walk' && p.x > 47.35 && p.x < 49.4 && p.z > -132 && p.z < -118 && p.y < 4; };
  const free = (x, z, yTop, depth) => HS.free(x, z, yTop, depth);
  const kerbAt = (x, z, along = 0) => {
    const nr = AF.PLAN.nearestRoad(x, z), R = nr && nr.road; if (!R) return null;
    const dx = R.b[0] - R.a[0], dz = R.b[1] - R.a[1], L = Math.hypot(dx, dz) || 1, t = AF.clamp(nr.t + along / L, 0, 1);
    const cx = R.a[0] + dx * t, cz = R.a[1] + dz * t; let nx = -dz / L, nz = dx / L; if ((x - cx) * nx + (z - cz) * nz < 0) { nx = -nx; nz = -nz; }
    const o = R.w / 2 - 1.8, kx = cx + nx * o, kz = cz + nz * o;
    return { x: kx, z: kz, y: AF.W.groundY(kx, kz), yaw: Math.atan2(dx, dz), nx, nz, cx, cz, road: R };
  };
  const rel = (o, yaw, fwd, right, up) => [o.x + Math.sin(yaw) * fwd - Math.cos(yaw) * right, o.y + up, o.z + Math.cos(yaw) * fwd + Math.sin(yaw) * right];
  const head = (n, up = 1.55) => [n.x, n.y + up, n.z];
  const spotFor = (at, k = mySlot()) => {
    if (!at || !k) return at;
    const yaw = at.yaw || 0, side = (k % 2 ? 1 : -1) * Math.ceil(k / 2) * 1.3, p = free(at.x - Math.cos(yaw) * side, at.z + Math.sin(yaw) * side, at.y + 2, 4);
    return { x: p.x, y: p.y, z: p.z, yaw };
  };
  const planeAt = () => { for (const pl of A.planes || []) if (pl !== AF.planes.cur && pl.net == null && !pl.ghost && pl.onGround) { SC.x = pl.x; SC.y = pl.y; SC.z = pl.z; return SC; } return A.plane; };
  const resetPlanes = () => { for (const pl of A.planes || []) if (pl !== AF.planes.cur && pl.net == null && !pl.ghost && Math.hypot(pl.x - pl.home.x, pl.z - pl.home.z) > 3) AF.planes.reset(pl); };
  const leaveFlight = () => { const pl = AF.planes && AF.planes.cur; if (AF.mode === 'fly' && pl && !pl.onGround) pl.ghost = true; };
  const place = (s) => AF.setMode('walk', { x: s.x, y: s.y, z: s.z, yaw: s.yaw || 0, snap: true });
  // a checkpoint retry (only after a failure or from the menu) moves the crew behind the travel veil — never a step transition
  const goTo = (at, label) => {
    if (!at || AF.mode === 'dead') return;
    if (MI.cut.on) MI.cut.finish(true);
    if (AF.mode === 'cctv' && AF.cctv) AF.cctv.close();
    const s = spotFor(at); leaveFlight();
    if (dist(me(), s) > 120 && AF.stream && AF.stream.travel) AF.stream.travel({ label, go: () => place(s) }); else place(s);
  };

  // ---------------------------------------------------------------- cutscenes: played where they happen; a crewmate far away hears them on the radio
  const cutscene = (at, build, o = {}) => {
    const step = H.i;
    H.cutting = true; H.cutOn = false;
    const fin = () => { H.cutting = false; if (H.on && H.i === step) H.flag.cut = true; if (o.after) o.after(); const f = H.later; H.later = null; if (f) f(); };
    const c = build(at);
    if (AF.TEST || AF.mode === 'dead' || (!o.always && dist(me(), at) > 150)) {
      for (const sh of c.shots) if (sh.vo) radio(sh.vo);
      fin(); return;
    }
    c.onEnd = fin; if (!c.end) c.end = null;
    leaveFlight(); if (AF.mode === 'cctv' && AF.cctv) AF.cctv.close();
    if (!MI.cut.play(c)) fin(); else H.cutOn = true;
  };
  const cutDone = () => H.flag.cut || (H.cutOn && !MI.cut.on && (crewN() < 2 || H.t > 40));
  const shot = (cam, look, vo, d = 3.2, x) => Object.assign({ cam, look, vo, d }, x);
  const cutBrief = () => cutscene(A.vera, (at) => {
    const v = at, f = A.veraYaw;
    return { title: 'The Harbour Trust Job', sub: 'Act I \u00b7 Papers', shots: [
      shot(rel(v, f, 1.1, 4.2, 1.65), rel(v, f, 1.1, 0, 1.4), 'vera.b1', 4, { cam2: rel(v, f, 1.1, 3.6, 1.6) }),
      shot([-24, 44, -38], [30, 58, -125], 'vera.b2', 4, { cam2: [-14, 50, -50] }),
      shot([-60, 70, 250], [-60, 10, 1600], 'vera.b3', 4, { cam2: [-60, 90, 300] }),
      shot([-400, 36, 30], [-500, 4, 100], 'vera.b4', 4, { cam2: [-420, 30, 40] }),
      shot(rel(v, f, 1.9, -0.7, 1.62), head(v), 'vera.b5', 3.5),
    ] };
  });
  const cutKit = () => cutscene(A.kit, (at) => {
    const k = at, f = A.kitYaw;
    return { title: 'Serena Isle', sub: 'Act II', shots: [
      shot(rel(k, f, 1.1, 4.0, 1.6), rel(k, f, 1.1, 0, 1.4), 'kit.k1', 4, { cam2: rel(k, f, 1.1, 3.5, 1.6) }),
      shot(rel(k, f, 2.1, -0.6, 1.6), head(k), 'kit.k2', 4, { act: () => sfx('click_metal') }),
      shot(rel(k, f, -1.1, 0.6, 1.8), rel(k, f, 2.2, 0, 1.5), 'kit.k3', 4),
      shot(rel(k, f, 2.1, 0.6, 1.6), head(k), 'kit.k4', 4),
      shot([A.tunnelEntry.x + 18, A.tunnelEntry.y + 14, A.tunnelEntry.z - 18], [A.tunnelEntry.x, A.tunnelEntry.y + 1, A.tunnelEntry.z], 'kit.k5', 4),
    ] };
  });
  const cutSilas = () => cutscene(A.silas, (at) => {
    const s = at, f = at.yaw || 0, L0 = LN(), lx = L0 ? L0.x : -225, lz = L0 ? L0.z : 1450;
    return { title: 'The Solace Queen', sub: 'Act III', shots: [
      shot(rel(s, f, 2.0, 0.7, 1.6), head(s), 'silas.s1', 3.5),
      shot(rel(s, f, 1.1, 2.3, 1.7), rel(s, f, 1.1, 0, 1.45), 'silas.s2', 5, { cam2: rel(s, f, 1.1, 1.9, 1.7) }),
      shot(rel(s, f, 2.0, -0.7, 1.6), head(s), 'silas.s3', 4),
      shot(rel(s, f, 1.4, 1.4, 1.5), head(s), 'silas.s4', 4),
      { cam: [lx + 40, 18, lz - 60], cam2: [lx + 10, 30, lz - 200], look: [lx, 4, lz - 300], d: 5, say: ['', 'Midnight. Silas\u2019s launch runs the crew ashore.'], act: () => { if (host()) AF.time.set({ hours: 0.2, paused: true }); } },
      { cam: [A.c5.x + 30, 14, A.c5.z + 60], cam2: [A.c5.x + 12, 8, A.c5.z + 24], look: [A.c5.x, 2, A.c5.z], d: 4, say: ['', 'The Pleasure Pier.'] },
    ] };
  }, { always: true, after: () => { if (dist(me(), A.c5) > 30 && AF.stream && AF.stream.travel) { const s = spotFor(A.c5); AF.stream.travel({ label: 'the Pleasure Pier', go: () => place(s) }); } } });
  const cutBetray = () => cutscene(A.stash, (at) => {
    const s = at, v = HS.npc.vera2, c = HS.npc.silas2, k = HS.npc.kit2, t = HS.npc.tony;
    return { title: 'Corsair Key', sub: 'Act VI', shots: [
      shot([s.x + 16, s.y + 9, s.z - 18], [s.x, s.y + 2, s.z + 3], 'silas.k1', 3.5, { cam2: [s.x + 10, s.y + 5, s.z - 12] }),
      shot(rel(c, c.yaw, 2.1, -0.7, 1.6), head(c), 'silas.k2', 4),
      shot(rel(k, k.yaw, 2.0, 0.6, 1.6), head(k), 'kit.t1', 2.2),
      shot(rel(c, c.yaw, 1.6, 1.0, 1.6), head(c), 'silas.k3', 4),
      shot(rel(t, t.yaw, 2.0, 0.5, 1.6), head(t), 'tony.k1', 3.5, { act: () => sfx('gun_reload') }),
      shot(rel(v, v.yaw, 1.8, 0.8, 1.6), head(v), 'vera.k2', 3.5),
    ] };
  }, { after: () => { HS.showNpc('silas2', false); HS.showNpc('kit2', false); HS.showNpc('tony', false); HS.showNpc('vera2', false); } });
  const cutFinale = () => cutscene(A.finaleMeet, (at) => {
    const s = A.stash, v = HS.npc.vera2;
    return { shots: [
      shot(rel(v, v.yaw, 2.1, 0.7, 1.6), head(v), 'vera.f1', 3.5),
      shot([s.x + 6, s.y + 3, s.z - 8], [s.x, s.y + 1.2, s.z], 'vera.f2', 4, { act: () => sfx('money') }),
      shot(rel(v, v.yaw, 1.5, 1.6, 1.5), head(v), 'vera.f3', 4),
      { cam: [s.x - 6, s.y + 3, s.z - 10], cam2: [s.x - 26, s.y + 34, s.z - 44], look: [s.x + 4, s.y + 3, s.z + 10], d: 5 },
    ] };
  }, { always: true });

  // ---------------------------------------------------------------- the story, step by step
  // cp: reaching this step saves checkpoint cp · cut: a cutscene step · tag: the marker's label · mark(): the objective position ·
  // mu: the music · hostOnly: only the host decides it's done · time: hours to hold (host sets)
  const ST = [
    { id: 'brief', cp: 0, act: 'Act I \u00b7 Papers', line: 'Vera\u2019s briefing', cut: () => cutBrief(), mu: 'mu_brief', time: 22.75 },
    { id: 'uniform', tag: () => (H.got.uniform ? 'Out' : H.got.grille ? 'Rail' : 'Grille'), line: () => uniformLine(),
      mark: () => (H.got.uniform ? A.shopDoor : H.got.grille ? A.rail : A.grille || A.shopDoor), enter: (r) => { scene('shop'); if (!r) radio('vera.shop'); }, done: () => !!H.got.uniform && !inShop(), mu: 'mu_stealth', time: 23.25 },
    { id: 'forger', cp: 1, tag: 'Ezra', line: () => (mgDone('papers') ? 'Ezra is forging the rest of the crew\u2019s licences' + mgTag('papers') : 'Get your pilot papers from {Ezra Quill} in the back of Harbour Stationers' + mgTag('papers')), mark: () => A.ezra, enter: (r) => { scene('ezra'); if (!r) radio('vera.shop2'); }, done: () => !!H.got.papers, mu: 'mu_plan' },
    { id: 'gate', tag: 'Crew gate', line: 'Show your papers at the {Westgate crew gate}', mark: () => A.gate, enter: (r) => { scene('gate'); if (!r) radio('vera.ezra'); }, done: () => !!H.got.cleared, mu: 'mu_plan' },
    { id: 'plane', tag: 'Plane', line: 'Take a {plane} from the apron \u2014 one flies, the others ride along', mark: () => planeAt(), enter: () => { resetPlanes(); }, done: () => flying(), mu: 'mu_plan' },
    { id: 'fly', tag: 'Serena Isle', line: () => (RADAR.on ? 'Fly under the coast radar \u2014 hold the {green band} \u2014 to {Serena Isle}' : 'Fly 3 km south to {Serena Isle} and land on the airstrip'), mark: () => A.strip, enter: (r) => { if (!r) { radio('tower.t1'); radio('vera.plane'); } }, done: () => onIsland() && (AF.mode === 'walk' || landed()), mu: 'mu_island' },
    { id: 'kit', cp: 2, act: 'Act II \u00b7 Serena Isle', tag: 'Kit', line: 'Meet {Kit Morrow} on the terrace of Hotel Serena', mark: () => A.kit, enter: (r) => { scene('kit'); if (!r) radio('vera.kit'); }, done: () => near(A.kit, 5, 4), mu: 'mu_island', time: 11 },
    { id: 'kitcut', line: 'Kit Morrow', cut: () => cutKit(), enter: () => scene('kit'), mu: 'mu_island' },
    { id: 'tunnel', tag: 'Tunnel', line: 'Find the {smugglers\u2019 tunnel} on the volcano\u2019s flank', mark: () => A.tunnelEntry, enter: () => { scene('tunnel'); H.got.kitkey = true; }, done: () => near(A.tunnelEntry, 6, 6), mu: 'mu_tension' },
    { id: 'cache', cp: 3, tag: 'Cache', line: () => (H.got.cache ? 'The cache is open' : H.siege ? (H.crackOn && H.cracker !== mySlot() ? 'Hold them off while your crew cracks the {arms cache} \u2014 grab a loud gun off the {rack}' : 'Crack the {arms cache} \u2014 lock ' + Math.min(CRACK_N, H.crack + 1) + ' of ' + CRACK_N + (crewN() > 1 ? ', your crew covers you' : '')) : 'Sneak through the {stash maze} to the arms cache \u2014 crouch (C), stay out of sight'),
      mark: () => A.cache, enter: (r) => { scene('tunnel'); if (!r) { radio('vera.tunnel'); radio('vera.maze'); } }, done: () => !!H.got.cache, mu: 'mu_tension' },
    { id: 'cave', tag: 'Sea cave', line: 'Slip out through the {sea cave}', mark: () => A.caveExit, enter: (r) => { scene('tunnel'); if (!r) radio('vera.gear'); }, done: () => near(A.caveExit, 7, 6) || near(A.cove, 10, 6), mu: 'mu_tension' },
    { id: 'ambush', tag: 'Jet skis', line: 'Moretti\u2019s men! Fight your way to {the jet skis}', mark: () => nearestSki(), enter: (r) => ambush(r), done: () => ambushOver(), mu: 'mu_action' },
    { id: 'chase', tag: 'Chasers', line: () => 'Moretti\u2019s men are after you on jet skis \u2014 ride and shoot (aim + fire from the saddle), take them all down' + (CH.list.length ? ' (' + chaseLeft() + ' left)' : ''), mark: () => chaseMark(),
      enter: (r) => { const C = CB(); if (C) C.clearGoons(); scene('sea'); if (host()) chaseStart(); if (!r) { radio('tony.chase', true); radio('vera.chase'); } }, done: () => chaseOver(), mu: 'mu_chase', hostOnly: true },
    { id: 'ski', tag: 'Solace Queen', line: 'Ride 1.5 km to the {Solace Queen} \u2014 her pontoon is on the port side', mark: () => A.pontoon,
      enter: (r) => { const C = CB(); if (C) C.clearGoons(); if (!r) { radio('vera.ski'); radio('vera.ski2'); } }, done: () => onQueen() || near(A.pontoon, 8), mu: 'mu_island' },
    { id: 'uniforms', cp: 4, act: 'Act III \u00b7 The Queen', tag: 'Staff', line: () => uniformsLine(),
      mark: () => (myStingRole() ? null : !H.took.waiter ? A.pantry : crewN() > 1 && !H.took.dealer ? A.crewLounge : secMark()), enter: (r) => { scene('queen'); holster(); if (!r) { radio('vera.q1'); radio(crewN() > 1 ? 'vera.q2' : 'vera.qsolo'); if (crewN() > 2) radio('vera.q2b'); radio('vera.qsec'); } },
      done: () => allUniformed(), mu: 'mu_casino', time: 19.6 },
    { id: 'salon', tag: 'Salon', line: 'Take the {crew stairs} up to the high-roller salon', mark: () => A.salonDoor, enter: (r) => { scene('queen'); if (!r) radio('vera.q3'); }, done: () => near(A.salon, 7, 3), mu: 'mu_casino' },
    { id: 'sting', tag: 'Prescott', line: () => stingLine(), mark: () => stingMark(), enter: (r) => { scene('queen'); if (!r) { radio('vera.q4'); radio('vera.q5'); if (crewN() > 2) radio('vera.q4b'); } H.anger = 0; H.strikes = 0; H.tray = false; }, done: () => !!H.got.key, mu: 'mu_casino' },
    { id: 'silas', tag: 'Silas', line: 'See {Silas Crane} in his office behind the purser\u2019s cage', mark: () => A.silas, enter: (r) => { scene('queen'); if (!r) radio('vera.got'); if (LN() && LN().openStaff) LN().openStaff(true); }, done: () => near(A.silas, 3.6, 3), mu: 'mu_casino' },
    { id: 'silascut', line: 'Silas Crane', cut: () => cutSilas(), enter: () => scene('queen'), mu: 'mu_casino' },
    { id: 'split', cp: 5, act: 'Act IV \u00b7 Midnight', tag: 'Roles', line: () => (crewN() > 1 ? 'Choose your roles \u2014 {hacker} or {inside man}' : 'Midnight. The hack first, then the bank'), mark: () => null,
      enter: (r) => { scene('night'); if (!r) { radio('vera.m1'); radio(crewN() > 1 ? 'vera.m2' : 'vera.msolo'); } chooseRoles(); }, done: () => !!H.roles.length, mu: 'mu_stealth', time: 0.2 },
    { id: 'night', tag: '', line: () => trackLine(), mark: () => trackMark(), enter: (r) => { scene('night'); trackEnter(r); }, done: () => H.tr.n >= INF.length, mu: 'mu_stealth', hostOnly: true },
    { id: 'escape', cp: 6, act: 'Act V \u00b7 The Getaway', tag: () => (myRole() === 'hack' ? 'Westgate' : 'Car'), line: () => (myRole() === 'hack' ? 'Get out of the sewer and make for {Westgate Airfield}' : 'Out through the {fire exit} \u2014 Vera\u2019s car is on Charter Street'),
      mark: () => (myRole() === 'hack' ? planeAt() : H.car && !H.car.dead ? H.car : A.car), enter: (r) => getaway(r), done: () => inCar() || flying(), mu: 'mu_chase' },
    { id: 'run', tag: 'Plane', line: 'Lose the police on the way to {Westgate Airfield} \u2014 a plane is waiting', mark: () => planeAt(), enter: () => run(), done: () => flying(), mu: 'mu_chase' },
    { id: 'away', tag: 'Corsair Key', line: 'Fly the cash 3 km out to {Corsair Key} \u2014 the police can\u2019t follow you over the sea', mark: () => A.keyStrip,
      enter: (r) => { resetPlanes(); if (!r) radio('vera.g5'); }, done: () => onKey() && (AF.mode === 'walk' || landed()), mu: 'mu_tension' },
    { id: 'stash', cp: 7, act: 'Act VI \u00b7 Corsair Key', tag: 'Hangar', line: 'Carry the cash into {the hangar}', mark: () => A.stash, enter: (r) => { scene('key'); if (!r) radio('vera.k1'); }, done: () => near(A.stash, 4, 3), mu: 'mu_tension', time: 1.5 },
    { id: 'betray', line: 'Corsair Key', cut: () => cutBetray(), enter: () => scene('key'), mu: 'mu_tension' },
    { id: 'fight', tag: 'Crate', line: () => (CB() && CB().has && CB().has('lmg') ? 'Take down {Silas}, {Kit}, {Tony Moretti} and their men' : 'Grab the {LMG} from Silas\u2019s crate and fight!'), mark: () => (CB() && CB().has && CB().has('lmg') ? bossMark() : A.crate),
      enter: (r) => fight(r), done: () => fightOver(), mu: 'mu_finale', hostOnly: true },
    { id: 'finale', line: 'Corsair Key', cut: () => cutFinale(), enter: () => { scene('key'); HS.showNpc('vera2', true); }, mu: 'mu_brief' },
  ];
  const IDX = {}; ST.forEach((s, i) => { IDX[s.id] = i; });
  // Act IV runs as two tracks (the host keeps both indices): the hacker's and the inside man's. Solo walks the hacker's first.
  const HACK = [
    { id: 'keeper', tag: 'Lockers', line: 'Borrow a {keeper\u2019s uniform} from the zoo\u2019s service yard', mark: () => A.locker, done: () => !!H.got.keeper || H.wear === 'keeper' },
    { id: 'den', tag: 'Hatch', line: 'Sneak through the {lion house} to the old hatch \u2014 don\u2019t wake the lions', mark: () => A.hatch, done: () => near(A.hatch, 2.2, 2.5) || belowZoo() },
    { id: 'bunker', tag: 'Kestrel', line: 'Follow the bunker and the sewer to the {Kestrel junction}', mark: () => A.server, done: () => near(A.server, 3, 2.5) },
    { id: 'hack', tag: 'Terminal', line: 'Jack into the {Kestrel terminal}', mark: () => A.server, done: () => !!H.got.hacked },
    { id: 'cctv', tag: '', line: () => (AF.mode === 'cctv' ? 'Guide your partner: loop cameras, kill lights, make noise' : 'Sit at the {terminal} and watch the cameras'), mark: () => (AF.mode === 'cctv' ? null : A.server), done: () => false },
  ];
  const INF = [
    { id: 'roof', tag: 'Roof', line: 'Get onto the {Harbour Trust roof} \u2014 parachute in, or climb the service ladder on Park Row', mark: () => (dist(me(), HB.spots.ladder) < 160 ? HB.spots.ladder : HB.spots.roof), done: () => onRoof() || inStair() || inBank() },
    { id: 'door', tag: 'Roof door', line: () => (H.got.hatch ? 'Through the {roof door} and down the stairs' : 'The {roof door} has a Kestrel keypad \u2014 ' + (crewN() > 1 ? 'your hacker can open it' : 'open it with the tablet (T)')), mark: () => HB.spots.bulkhead, done: () => inStair() || inBank() },
    { id: 'vault', tag: 'Vault', line: 'Reach the {vault door} \u2014 guards and cameras everywhere', mark: () => HB.spots.gate, done: () => near(HB.spots.gate, 2.8, 2) },
    { id: 'keys', tag: 'Vault key', line: () => (H.lockT > 0 ? 'Turn {both keys} \u2014 ' + Math.ceil(H.lockT) + ' s left on the override' : 'Time lock engaged \u2014 ' + (crewN() > 1 ? 'your hacker must override it' : 'override it with the tablet (T)')), mark: () => HB.spots.keys[H.grip[0] > 0 ? 1 : 0], done: () => !!H.got.gate },
    { id: 'lasers', tag: 'Cage', line: 'Through the {laser grid} to the deposit cage \u2014 crouch under, time the sweepers', mark: () => HB.spots.cage, done: () => inVaultFar() || !!H.got.cage },
    { id: 'drill', tag: 'Drill', line: 'Drill the {deposit cage} \u2014 keep the bit cool', mark: () => HB.spots.cage, done: () => !!H.got.cage },
    { id: 'cash', tag: 'Cash', line: 'Grab the {cash bags}', mark: () => nextBag(), done: () => H.bags.every(Boolean) },
  ];
  // checkpoints: the step, where, the facts already earned, the Act IV track state
  const CPS = [
    { step: 'uniform', label: 'Kovac\u2019s tailor shop', at: () => A.shopDoor, got: [] },
    { step: 'forger', label: 'Harbour Stationers', at: () => A.ezraDoor, got: ['uniform'] },
    { step: 'kit', label: 'Serena Isle', at: () => A.c2, got: ['uniform', 'papers', 'cleared'] },
    { step: 'cache', label: 'the smugglers\u2019 tunnel', at: () => A.tunnelEntry, got: ['uniform', 'papers', 'cleared', 'kitkey'] },
    { step: 'uniforms', label: 'the Solace Queen', at: () => A.c4, got: ['uniform', 'papers', 'cleared', 'kitkey', 'cache'] },
    { step: 'split', label: 'the Pleasure Pier', at: () => A.c5, got: ['uniform', 'papers', 'cleared', 'kitkey', 'cache', 'key'] },
    { step: 'escape', label: 'the Harbour Trust', at: () => (myRole() === 'hack' ? A.street : HB.spots.fire), got: ['uniform', 'papers', 'cleared', 'kitkey', 'cache', 'key', 'hacked', 'hatch', 'gate', 'cage'], cash: true },
    { step: 'stash', label: 'Corsair Key', at: () => A.c8, got: ['uniform', 'papers', 'cleared', 'kitkey', 'cache', 'key', 'hacked', 'hatch', 'gate', 'cage'], cash: true },
  ];
  // inside Act IV: once the hack is done the checkpoint keeps it (the inside man restarts at the ladder, the hacker at the terminal)
  const NIGHT_CP = { label: 'the Harbour Trust', inf: () => HB.spots.ladder, hack: () => A.server };
  const is = (id) => H.on && H.i === IDX[id];
  const lineOf = (s) => (typeof s.line === 'function' ? s.line() : s.line);
  const tagOf = (s) => (typeof s.tag === 'function' ? s.tag() : s.tag);
  const actOf = (i) => { for (let k = i; k >= 0; k--) if (ST[k].act) return ST[k].act; return ''; };
  // ---------------------------------------------------------------- roles + Act IV tracks
  const myRole = () => { if (crewN() < 2 && (!H.roles.length || H.roles[0] === 'solo')) return H.tr.h < HACK.length ? 'hack' : 'infil'; return H.roles[mySlot()] || 'infil'; };
  H.myRole = myRole;
  const curT = () => (myRole() === 'hack' ? HACK[H.tr.h] : INF[H.tr.n]);
  const trackLine = () => { const s = curT(); return s ? lineOf(s) : myRole() === 'hack' ? 'Keep watching the cameras' : 'Hold tight'; };
  const trackMark = () => { const s = curT(); return s && s.mark ? s.mark() : null; };
  const belowZoo = () => { const p = AF.player, d = A.server; return AF.mode === 'walk' && !!d && p.y < (A.hatch ? A.hatch.y - 2.5 : -2) && dist(p, A.hatch) < 60; };
  const inShop = () => { const b = A.shopBox, p = AF.player; return AF.mode === 'walk' && !!b && p.x > b[0] && p.x < b[3] && p.z > b[2] && p.z < b[5] && p.y < b[4]; };
  const uniformLine = () => (H.got.uniform ? 'Slip back out of {Kovac\u2019s} \u2014 unseen'
    : !H.got.grille ? (mgDone('grille') ? 'Your padlock is off \u2014 wait for your crew to pick theirs' + mgTag('grille') : near(A.shopDoor, 30) ? 'Pick ' + (crewN() > 1 ? 'your padlock' : 'the padlock') + ' on the {night grille}' + mgTag('grille') : 'Break into {Kovac\u2019s tailor shop} \u2014 it\u2019s shut for the night')
      : mgDone('rail') ? 'Uniform on \u2014 wait for the rest of the crew' + mgTag('rail') : 'Sneak past the {night watchman} \u2014 the {pilot uniforms} hang on the rail behind the counter' + mgTag('rail'));
  let rolePick = null;
  const chooseRoles = () => {
    if (crewN() < 2) { if (host()) { H.roles = ['solo']; send({ op: 'roles', r: H.roles }); } return; }
    if (H.roles.length) return;
    rolePick = null;
    AF.shop.open({ title: 'Midnight \u00b7 who does what?', sub: 'One of you hacks Kestrel\u2019s cameras from under the zoo' + (crewN() > 2 ? ', the rest go into the bank' : ', the other goes into the bank'), items: () => [
      { name: 'The hacker', desc: 'Keeper\u2019s uniform, the lion den, the bunker \u2014 then the cameras, lights and locks', tag: rolePick === 'hack' ? 'Picked' : 'Pick', act: () => pickRole('hack') },
      { name: 'The inside man', desc: 'The roof, the guards, the vault, the lasers, the drill, the cash', tag: rolePick === 'infil' ? 'Picked' : 'Pick', act: () => pickRole('infil') },
    ] });
  };
  const pickRole = (r) => { rolePick = r; AF.shop.close(); if (host()) assignRole(mySlot(), r); else send({ op: 'role', r }, 0); note('You asked to be the ' + (r === 'hack' ? 'hacker' : 'inside man') + '.', 'ok'); };
  const want = new Map();
  const assignRole = (slot, r) => {   // host
    want.set(slot, r);
    const slots = [0, ...(online() ? [...N.peers.keys()] : [])];
    if (slots.some((s) => !want.has(s)) && H.t < 25) return;
    const roles = []; let hacker = -1;
    for (const s of slots) if (want.get(s) === 'hack' && hacker < 0) hacker = s;
    if (hacker < 0) hacker = slots.find((s) => s !== 0) ?? 0;
    for (const s of slots) roles[s] = s === hacker ? 'hack' : 'infil';
    H.roles = roles; send({ op: 'roles', r: roles }); rolesSet();
  };
  const rolesSet = () => { if (AF.shop && AF.shop.isOpen && AF.shop.isOpen()) AF.shop.close(); const r = myRole(); note(r === 'hack' ? 'You\u2019re the hacker. Get to the zoo.' : 'You\u2019re the inside man. Get to the Harbour Trust.', 'mission'); radio(r === 'hack' ? 'vera.m3' : 'vera.roof'); };
  // track changes (every client): the bank's state follows the facts
  const applyNight = () => {
    if (!HB || !HB.ready) return;
    const night = is('night');
    HB.door('bulkhead', !!H.got.hatch); HB.door('gate', !!H.got.gate); HB.cage(!!H.got.cage);
    HB.lasers(night && H.tr.n >= 4 && !H.bags.every(Boolean));
    let mask = 0; for (let k = 0; k < 4; k++) if (!H.bags[k] && (night || is('escape'))) mask |= 1 << k; HB.bagsShow(H.got.cage || (night && H.tr.n >= 4) ? mask : 0);
    if (AF.den && AF.den.setActive) AF.den.setActive(night && (myRole() === 'hack' || crewN() < 2));
    // the drain's street hatch opens only once Kestrel is hacked: the hacker's way out to Westgate
    if (AF.den && AF.den.setDrain) AF.den.setDrain(H.on && !!H.got.hacked && (night || is('escape') || is('run')));
  };
  let trSeen = '';
  const trackEnter = (r) => { trSeen = ''; if (!r && crewN() < 2) radio('vera.z1'); applyNight(); };
  const trackTick = () => {
    const key = H.tr.h + ':' + H.tr.n;
    if (key !== trSeen) {
      const was = trSeen; trSeen = key; applyNight();
      const r = myRole(), s = curT();
      if (was && s) { sfx('ui_check'); hudT = 0; markers(); }
      if (r === 'hack' && s) ({ den: () => radio('vera.z2'), bunker: () => radio('vera.z3'), cctv: () => { radio('vera.h1'); openCams(); } })[s.id]?.();
      if (r === 'infil' && s) ({ door: () => radio(H.got.hatch ? 'vera.hatch2' : 'vera.hatch'), vault: () => { radio('vera.tip'); radio('vera.cams'); }, keys: () => radio('vera.keys'), lasers: () => radio('vera.laser'), drill: () => radio('vera.drill'), cash: () => radio('vera.cash') })[s.id]?.();
    }
    if (H.failing) return;
    const r = myRole(), s = curT(); if (!s) return;
    const t = r === 'hack' ? 'h' : 'n', k = r === 'hack' ? H.tr.h : H.tr.n, sig = t + k;
    if (s.done() && H.sentTr !== sig) { if (wantedHold()) { wantedNag(); return; } H.sentTr = sig; if (host()) trDone(t, k); else send({ op: 'tdone', t, k }, 0); }
  };
  const trDone = (t, k) => {   // host
    if (!is('night')) return;
    if (t === 'h' && k === H.tr.h) { H.tr.h = k + 1; if (HACK[k].id === 'hack' && (crewN() < 2 || H.roles[0] === 'solo')) H.tr.h = HACK.length; }
    else if (t === 'n' && k === H.tr.n) H.tr.n = k + 1;
    else return;
    if (H.got.hacked) H.nightCp = true;
    send({ op: 'tr', h: H.tr.h, n: H.tr.n, g: gotList() });
  };
  const gotList = () => Object.keys(H.got).filter((k) => H.got[k]);

  // ---------------------------------------------------------------- uniforms + who wears what
  const myLook = () => (AF.save.looks && AF.friends.current && AF.save.looks[AF.friends.current.id]) || (AF.friends.current && AF.friends.current.look) || AF.player.look;
  const dress = (kind) => {
    if (kind === H.wear || !AF.player || !AF.player.setLook) return;
    H.wear = kind || null; H.wears[mySlot()] = H.wear;
    AF.player.setLook(kind && HS ? HS.uniform(myLook(), kind) : myLook());
    send({ op: 'wear', k: H.wear || '' });
  };
  const wears = (slot) => (slot === mySlot() ? H.wear : H.wears[slot]);
  AF.on('friend', () => { const k = H.wear; H.wear = null; if (H.on && k) dress(k); });

  // ---------------------------------------------------------------- scenes: which set is live (people, zones, music beds)
  const scene = (name) => {
    if (!HS || !HS.ready) return;
    const on = (k) => name === k;
    HS.show('watch', on('shop')); if (HS.props.rail) HS.props.rail.visible = on('shop');
    if (HS.grille) HS.grille(on('shop') && !H.got.grille); HS.shopShut = on('shop'); if (HS.racks) HS.racks(on('shop'));
    HS.showNpc('ezra', on('ezra')); HS.showNpc('gate', on('gate') || on('ezra'));
    HS.showNpc('kit', on('kit'));
    for (const k in HS.walkers) if (/^(tunnel|post|wave)/.test(k)) HS.show(k, on('tunnel'));
    for (const k of ['steward', 'waiter', 'dealer', 'detective', 'sec0', 'sec1', 'sec2', 'sec3', 'sec4', 'sec5']) HS.show(k, on('queen'));
    for (const k of ['door', 'prescott', 'celeste', 'pit']) HS.showNpc(k, on('queen'));
    HS.show('watchman', on('night'));
    for (const k of ['vera2', 'silas2', 'kit2', 'tony']) HS.showNpc(k, on('key') && H.i <= IDX.betray);
    if (HS.props.crate) HS.props.crate.visible = on('key');
    if (HB && HB.ready && HB.on !== on('night')) HB.night(on('night'));
    if (!on('night') && AF.den && AF.den.setActive) AF.den.setActive(false);
    const zone = on('shop') ? 'shop' : on('tunnel') ? 'tunnel' : on('queen') ? 'queen' : on('night') ? (myRole() === 'hack' && H.tr.h < 3 ? 'zoo' : 'bank') : null;
    if (S && (!S.zone || S.zone.id !== zone)) { if (zone) S.reset(zone); S.activate(zone); }
    H.scene = name;
  };
  // music: the step's bed, the action track while a fight or an alarm is on
  let muCur = null;
  const music = () => {
    let id = null;
    if (H.on) { const s = ST[H.i]; id = s ? s.mu || null : null; if ((S && S.zone && S.zone.alarm && S.zone.mode === 'fight') || (is('ambush') && H.goonsN)) id = 'mu_action'; }
    if (id !== muCur) { muCur = id; if (AF.audio && AF.audio.music) AF.audio.music(id, { fade: 2.5 }); }
  };
  // ---------------------------------------------------------------- markers + HUD
  const MK2 = { sting: () => (myStingRole() === 'dealer' ? A.dealer : null), uniforms: () => (crewN() > 1 && !H.took.dealer ? A.crewLounge : null) };
  const markers = () => {
    const s = ST[H.i];
    if (!s || (!s.mark && !s.cut)) { MI.unblip('heist-obj'); MI.unblip('heist-2'); return; }
    if (!s.mark) MI.unblip('heist-obj');
    else MI.blip('heist-obj', { at: () => (H.on && ST[H.i] && ST[H.i].mark ? ST[H.i].mark() : null), on: () => H.on && !H.failing && !!(ST[H.i] && ST[H.i].mark && ST[H.i].mark()), kind: 'objective', label: tagOf(s) || '', primary: true, marker: true, r: 1.8, y: null });
    const m2 = MK2[s.id];
    if (!m2) MI.unblip('heist-2');
    else MI.blip('heist-2', { at: m2, on: () => H.on && !H.failing && !!m2(), kind: 'objective', label: 'Partner', marker: true, r: 1.4, y: null });
  };
  let hudT = 0;

  // ---------------------------------------------------------------- no progress while wanted: the job waits until the police lose you
  // (the getaway and the Key's gunfight are the exceptions — the heat is the story there)
  const HEAT_OK = new Set(['escape', 'run', 'away', 'fight']);
  const wanted = () => { const C = CB(); return !!C && C.stars > 0; };
  const wantedHold = () => { if (!H.on || !wanted()) return false; const s = ST[H.i]; return !!s && !s.cut && !HEAT_OK.has(s.id); };
  let nagT = -1e9;
  const wantedNag = (now) => {
    const t = AF.clock.t; if (t - nagT < (now ? 2.5 : 12)) return; nagT = t;
    sfx('ui_alert'); MI.shard('Wanted', 'Lose the police first \u2014 the job waits until they\u2019ve lost your trail', 'info', 2800);
  };
  H.wantedHold = wantedHold;

  // ---------------------------------------------------------------- step engine
  const enter = (i, restored) => {
    H.i = i; H.t = 0; H.flag = {}; H.sentFor = -1; H.sentTr = ''; H.cutting = false; H.cutOn = false; H.later = null; H.lifting = false;
    const s = ST[i]; if (s.cp != null) H.cp = s.cp;
    if (s.time != null && host() && !restored) AF.time.set({ hours: s.time, paused: true });
    if (s.act && !s.cut) MI.shard('The Harbour Trust Job', s.act, 'start', 3600);
    if (!restored && i > 0) { sfx(s.cp != null ? 'jg_pass' : 'ui_check'); if (s.cp != null) note('Checkpoint \u2014 ' + CPS[s.cp].label + '.', 'ok'); }
    hudT = 0;
    if (s.enter) s.enter(!!restored);
    if (s.cut) { if (restored) H.flag.cut = true; else s.cut(); }
    markers(); applyNight(); music();
    AF.emit('heist', H);
  };
  const advance = (from) => {   // host
    if (!H.on || from !== H.i || H.failing) return;
    if (H.i + 1 >= ST.length) { finish(true); return; }
    enter(H.i + 1, false); send({ op: 'st', i: H.i, cp: H.cp, g: gotList(), h: H.tr.h, n: H.tr.n });
  };
  const complete = () => { if (H.sentFor === H.i) return; H.sentFor = H.i; if (host()) advance(H.i); else if (!ST[H.i].hostOnly) send({ op: 'done', i: H.i }, 0); };
  const fail = (why) => {
    if (!H.on || H.failing) return;
    if (host()) { doFail(why); send({ op: 'fail', cp: H.cp, why }); }
    else { H.failing = true; send({ op: 'fail', why }, 0); setTimeout(() => { if (H.failing === true) H.failing = false; }, 4000); }
  };
  H.fail = fail;
  const doFail = (why) => {
    H.failing = 'restore'; if (AF.hud.meterCancel) AF.hud.meterCancel(); H.lifting = false;
    if (AF.minigame && AF.minigame.open) AF.minigame.cancel();
    sfx('jg_fail'); setTimeout(() => sfx('v_failed'), 900); MI.shard('Mission failed', why || 'The job went sideways.', 'fail', 2800);
    setTimeout(() => {
      H.failing = false; if (!H.on) return;
      // the host restores and tells the crew ('rs', ordered before any later 'st'); a guest waits for that message
      if (host()) { restore(H.cp, true); send({ op: 'rs', cp: H.cp, night: H.nightCp ? 1 : 0 }); }
      setTimeout(() => radio(Math.random() < 0.5 ? 'vera.fail' : 'vera.fail2'), 1600);
    }, AF.TEST ? 0 : 2600);
  };
  const resetWorld = (i) => {
    const C = CB(); if (C) { C.clearWanted(); C.clearGoons(); if (C.unlend) C.unlend(); }
    H.grip[0] = H.grip[1] = 0; H.lockT = 0; H.anger = 0; H.strikes = 0; H.tray = false; H.goonsN = 0; H.waves = 0; H.bosses = [];
    if (HB && HB.ready) { HB.reset(); }
    if (S) for (const z of ['shop', 'tunnel', 'queen', 'zoo', 'bank']) S.reset(z);
    if (AF.den && AF.den.reset) AF.den.reset();
    if (AF.den && AF.den.setHatch) AF.den.setHatch(false);
    H.took = {}; H.tray = false; H.busy = false; H.drilling = false; H.dealing = false; H.drillR = false; AF.PL.still = false;
    H.mg = {}; H.crack = 0; H.cracker = -1; H.crackOn = false; H.siege = null; H.detHold = 0; H.pitHold = 0; chaseClear();
    if (S && S.carrying) S.carrying = null;
    if (LN() && LN().openStaff) LN().openStaff(i === IDX.silas || i === IDX.silascut);
    if (H.roadblock) { for (const c of H.roadblock.cars) c.temp = true; H.roadblock = null; }
    for (const k of ['celeste']) HS.showNpc(k, false);
  };
  // the wardrobe + loadout a checkpoint implies (back at the Queen's checkpoint nobody wears a borrowed uniform yet: they're taken again)
  const outfit = () => {
    const i = H.i;
    if (i >= IDX.split && i <= IDX.night) dress(myRole() === 'hack' && H.got.keeper ? 'keeper' : 'night');
    else if (i > IDX.uniform && i <= IDX.kitcut) dress('pilot');
    else if (i >= IDX.escape) dress('night');
    else if (i <= IDX.uniforms || i > IDX.silascut) dress(null);
    const C = CB(); if (C && C.lend) { if (H.got.cache && i < IDX.fight) { C.lend('spistol', 60); if (i >= IDX.uniforms && i <= IDX.silascut && C.selectId) C.selectId('fists'); } }
  };
  const restore = (cp, failed) => {
    const C = CPS[cp]; let i = IDX[C.step]; H.cp = cp;
    hushVoices();
    resetWorld(i);
    H.got = {}; for (const k of C.got) H.got[k] = true;
    H.bags = [0, 1, 2, 3].map(() => !!C.cash);
    H.tr = { h: 0, n: 0 };
    let at = C.at(), label = C.label;
    // inside Act IV with the hack done: keep it; the inside man goes back to the ladder, the hacker to the terminal
    if (H.nightCp && i === IDX.split) {
      i = IDX.night; H.got.hacked = true; H.tr = { h: crewN() > 1 ? 4 : HACK.length, n: 0 }; label = NIGHT_CP.label;
      at = myRole() === 'hack' && crewN() > 1 ? NIGHT_CP.hack() : NIGHT_CP.inf();
    }
    if (host() && (C.cash || i >= IDX.split)) AF.time.set({ hours: i >= IDX.stash ? 1.5 : 0.2, paused: true });
    resetPlanes();
    AF.health.heal(AF.health.max);
    goTo(at, label);
    enter(i, true);
    H.wear = undefined; H.wears = [];   // re-dress for real, whatever the avatar wore when it went wrong
    outfit();
    if (i === IDX.night) trackEnter(true);
    void failed;
  };
  const begin = () => {
    const J = AF.jobs; if (J && J.cur) J.cur.end('You clock off \u2014 there\u2019s a bigger job tonight.');
    H.on = true; H.cp = 0; H.failing = false; H.got = {}; H.roles = []; H.tr = { h: 0, n: 0 }; H.nightCp = false; H.bags = [false, false, false, false]; H.wears = []; H.mg = {};
    resetWorld(0); veraBlip(); sfx('jg_start'); enter(0, false);
  };
  const start = () => {
    if (H.on) return;
    if (wanted()) { sfx('ui_alert'); MI.shard('Wanted', 'Lose the police first \u2014 Vera won\u2019t talk business with heat on you', 'info', 2800); return; }
    if (crewN() < NEED && !H.solo) { note('The Harbour Trust Job needs a crew of two. Host a co-op game and bring a friend \u2014 or pick "Go alone".', 'warn'); return; }
    if (!host()) { send({ op: 'go' }, 0); return; }
    begin(); send({ op: 'st', i: H.i, cp: H.cp, g: [], h: 0, n: 0 });
  };
  const end = (ok, quiet) => {
    if (!H.on) return;
    H.on = false; H.i = -1; H.failing = false; H.after = null; H.later = null; H.cutting = false; hushVoices();
    if (MI.cut.on) MI.cut.finish(true);
    if (AF.mode === 'cctv' && AF.cctv) AF.cctv.close();
    if (AF.minigame && AF.minigame.open) AF.minigame.cancel();
    const C = CB(); if (C) { C.clearGoons(); if (C.unlend) C.unlend(); if (ok) C.clearWanted('Corsair Key keeps its secrets. The police lose the trail.'); }
    scene('none'); if (S) S.activate(null); if (HB && HB.ready) { HB.reset(); HB.night(false); }
    if (AF.den) { if (AF.den.setHatch) AF.den.setHatch(false); if (AF.den.setDrain) AF.den.setDrain(false); }
    dress(null); H.grip[0] = H.grip[1] = 0; H.bags = [false, false, false, false]; H.roles = [];
    if (AF.hud.meterCancel) AF.hud.meterCancel(); H.lifting = false;
    if (LN() && LN().openStaff) LN().openStaff(false);
    if (H.car) { H.car.temp = true; H.car = null; }
    if (H.roadblock) { for (const c of H.roadblock.cars) c.temp = true; H.roadblock = null; }
    chaseClear(); H.siege = null; if (S && S.carrying) S.carrying = null;
    MI.unblip('heist-obj'); MI.unblip('heist-2'); MI.clearBars('heist'); if (AF.hud.job === H.hud) AF.hud.job = null;
    if (host()) AF.time.set({ paused: false });
    if (ok) {
      H.runs++; AF.money.add(H.pay); AF.saveSoon();
      sfx('jg_win'); setTimeout(() => sfx('v_complete'), 1300); MI.shard('Heist passed', 'The Harbour Trust Job \u00b7 your cut ' + AF.cash(H.pay), 'pass', 7000);
      setTimeout(() => note('Silas\u2019s Cub by the hangar is yours to borrow. Fly home whenever you like.', 'ok'), 3500);
      if (AF.save.wear && !AF.TEST && !AF.save.wear.includes('uniform:pilot')) { AF.save.wear.push('uniform:pilot'); AF.saveSoon(); setTimeout(() => note('You kept a pilot\u2019s uniform \u2014 wear it from your wardrobe and Westgate\u2019s crew gate opens for you.', 'ok'), 8000); }
    } else if (!quiet) note('The job is off. Vera will be at the Blue Heron if you change your mind.', 'warn');
    veraBlip(); music();
    AF.emit('heist', H);
  };
  const finish = (ok) => { if (!H.on) return; if (host()) send({ op: 'end', ok: ok ? 1 : 0 }); end(ok); };
  const retry = () => { if (!H.on || H.failing) return; if (host()) { restore(H.cp); send({ op: 'rs', cp: H.cp, night: H.nightCp ? 1 : 0 }); } else send({ op: 'retry' }, 0); };
  H.start = start; H.retry = retry; H.quit = () => (host() ? finish(false) : send({ op: 'quit' }, 0));
  H.dbg = { IDX, ST, CPS, HACK, INF, begin, enter, restore, skip: () => advance(H.i), trDone, solo: (on = true) => { H.solo = on; } };
  H.dbg.jump = (cp) => { if (!host()) return; if (!H.on) begin(); restore(cp); send({ op: 'rs', cp }); };
  // ---------------------------------------------------------------- everyone does their own part: a padlock each on the grille, a uniform each
  // off the rail, a licence each from Ezra (the arms cache and the night's role jobs are the exceptions). The shared fact (got) lands once
  // every member of the crew has done theirs; the host decides.
  const crewSlots = () => (online() ? [0, ...N.peers.keys()] : [0]);
  const MGF = { grille: 'grille', rail: 'uniform', papers: 'papers' };
  const mgDone = (k, slot = mySlot()) => !!(H.mg && H.mg[k] && H.mg[k].has(slot));
  const mgCount = (k) => crewSlots().filter((s) => mgDone(k, s)).length;
  const mgTag = (k) => (crewN() > 1 ? ' (' + mgCount(k) + '/' + crewN() + ')' : '');
  const mgCheck = () => { if (!host() || !H.on || !H.mg) return; for (const k in MGF) if (!H.got[MGF[k]] && H.mg[k] && crewSlots().every((s) => mgDone(k, s))) setGot(MGF[k]); };
  const mgMark = (k, slot, remote) => { if (!H.mg) H.mg = {}; (H.mg[k] || (H.mg[k] = new Set())).add(slot); if (!remote) send({ op: 'mg', k }); hudT = 0; mgCheck(); };
  // ---------------------------------------------------------------- shared facts (got) + their side effects on every client
  const setGot = (k, remote) => {
    if (H.got[k]) return; H.got[k] = true;
    if (!remote) send({ op: 'got', k });
    if (k === 'grille') { sfx('latch'); if (HS.grille) HS.grille(false); radio('vera.shop1'); }
    if (k === 'uniform') dress('pilot');
    if (k === 'cache') { const C = CB(); if (C && C.lend) C.lend('spistol', 60); note('Silenced pistols and a diamond-core drill. Headshots are quiet and final.', 'ok'); }
    if (k === 'key') { H.lifting = false; note('Prescott\u2019s key is yours.', 'ok'); }
    if (k === 'hacked') { radio('kestrel.in'); if (crewN() < 2) note('Kestrel tablet unlocked \u2014 press T (or the TABLET button) for the bank\u2019s cameras.', 'ok'); }
    if (k === 'hatch') { radio('kestrel.hatch'); if (HB) HB.door('bulkhead', true); }
    if (k === 'gate') { sfx('vault'); note('Both keys turn \u2014 the time lock lets go.', 'ok'); if (HB) HB.door('gate', true); }
    if (k === 'cage') { sfx('latch'); if (HB) HB.cage(true); }
    applyNight();
  };
  H.setGot = setGot;

  // ---------------------------------------------------------------- act I: the tailor's after dark, Ezra, the crew gate
  const pickGrille = () => {
    if (H.got.grille || H.busy || mgDone('grille')) return;
    H.busy = true; sfx('click_metal');
    play('lockpick', { title: crewN() > 1 ? 'Kovac\u2019s night grille \u00b7 your padlock' : 'Kovac\u2019s night grille', sub: crewN() > 1 ? 'A padlock for each of you \u2014 pick yours before the beat cop comes round' : 'A padlock on the shop door \u2014 pick it before the beat cop comes round', diff: 0.35, time: 45 })
      .then((r) => { H.busy = false; if (r && r.ok && is('uniform')) { mgMark('grille', mySlot()); if (!H.got.grille) note('Your padlock is off \u2014 the crew picks the rest' + mgTag('grille') + '.', 'ok'); } });
  };
  const ezraPapers = () => {
    const n = HS.npc.ezra; if (H.got.papers || H.busy || mgDone('papers')) return;
    H.busy = true; speak('ezra.e1', n);
    setTimeout(() => {
      speak('ezra.e2', n);
      play('stamp', { title: 'Forging your pilot\u2019s licence', sub: 'Ezra Quill \u00b7 Harbour Stationers', diff: 0.4 }).then((r) => {
        H.busy = false;
        if (r && r.ok) { speak('ezra.done', n); mgMark('papers', mySlot()); if (!H.got.papers) note('Your licence is done \u2014 Ezra still has the others to forge' + mgTag('papers') + '.', 'ok'); } else if (!(r && r.cancelled)) speak('ezra.fail', n);
      });
    }, AF.TEST ? 0 : 2600);
  };
  const showPapers = () => {
    const n = HS.npc.gate; if (H.got.cleared) return;
    if (H.wear !== 'pilot' || !H.got.papers) { speak('gate.no', n); return; }
    speak('gate.g1', n);
    setTimeout(() => { speak('gate.g2', n); setGot('cleared'); }, AF.TEST ? 0 : 2400);
  };

  // ---------------------------------------------------------------- act II: the stash maze, the siege at the cache, the cove, the chase
  // The cache has three padlocks and a tripwire: the moment someone starts on it, Moretti's men pour in from both ends of the tube in
  // waves (bigger for a bigger crew) while one cracker works the locks and the rest hold them off with the loud guns off the rack.
  // Solo: put the picks down (Esc) to fight, then carry on from the lock you were on.
  const CRACK_N = 3, WAVE_N = [0, 3, 4, 5, 6];
  const crackCache = () => {
    if (H.got.cache || H.busy) return;
    if (H.crackOn && H.cracker >= 0 && H.cracker !== mySlot()) { note('Someone is already on the locks \u2014 cover them!', 'warn'); return; }
    H.busy = true; H.cracker = mySlot(); H.crackOn = true; send({ op: 'crack', on: 1 }); if (host()) siegeStart();
    const k = Math.min(CRACK_N - 1, H.crack); sfx('click_metal');
    play('lockpick', { title: 'The Moretti arms cache \u00b7 lock ' + (k + 1) + ' of ' + CRACK_N, sub: crewN() > 1 ? 'The crate was wired \u2014 your crew holds them off while you work' : 'They\u2019re coming \u2014 Esc puts the picks down so you can fight', diff: 0.45 + k * 0.08, time: 75 }).then((r) => {
      H.busy = false; H.crackOn = false; send({ op: 'crack', on: 0 });
      if (!is('cache') || H.got.cache || !(r && r.ok)) return;
      const n = Math.max(H.crack, k + 1); H.crack = n; sfx('latch'); send({ op: 'crackp', n });
      if (n >= CRACK_N) { if (host()) setGot('cache'); } else note('Lock ' + n + ' of ' + CRACK_N + ' open.', 'ok');
    });
  };
  const siegeStart = () => {   // host
    if (H.siege || H.got.cache || !is('cache')) return;
    H.siege = { t: 0, wave: 0, next: 2 };
    const z = S && S.zones.get('tunnel');
    if (z) { z.lastSeen.x = A.cache.x; z.lastSeen.y = A.cache.y; z.lastSeen.z = A.cache.z; z.lastSeen.t = AF.clock.t; if (S.zone === z) S.requestAlarm('The cache was wired'); }
    radio('vera.siege', true);
  };
  const siegeTick = (dt) => {   // host: the waves keep coming until the cache is open
    const sg = H.siege; if (!sg || !is('cache') || !S || H.got.cache) return;
    const z = S.zones.get('tunnel'); if (!z || S.zone !== z) return;
    sg.t += dt;
    let alive = 0; for (const g of z.guards) if (g.reserve && g.live && !g.down) alive++;
    sg.next -= dt; if (alive === 0 && sg.wave > 0 && sg.next > 5) sg.next = 5;
    if (sg.next > 0) return;
    sg.next = 26; if (alive >= 8) return;
    const n = Math.min(WAVE_N[Math.min(4, crewN())], 8 - alive);
    for (let k = 0; k < n; k++) {
      const i = S.freeReserve('tunnel', 22); if (i < 0) break;
      const sp = A.waveSpawns[(sg.wave + k) % A.waveSpawns.length], o = ((k >> 1) % 3 - 1) * 0.8;
      S.spawn('tunnel', i, sp.x + o, sp.y, sp.z - o);
    }
    sg.wave++; if (!z.alarm) S.requestAlarm('Reinforcements');
    if (sg.wave > 1) radio('vera.siege2', false, () => is('cache') && !H.got.cache);
  };
  const nearestSki = () => {
    const J = AF.island && AF.island.jetski; let best = null, bd = 1e9; const p = me();
    if (J) for (const s of J.skis) { if (s.net != null) continue; const d = dist(p, s); if (d < bd) { bd = d; best = s; } }
    if (best) { SC.x = best.x; SC.y = best.y + 0.5; SC.z = best.z; return SC; }
    return A.cove;
  };
  const ambush = (restored) => {
    radio('vera.cove'); radio('tony.cove');
    const C = CB(), p = AF.player; H.goonsN = 0;
    if (restored || !C || !C.spawnGoon || dist(p, A.cove) > 160) return;
    // each client spawns its share; the whole crew faces 4 + 2 per player
    const n = Math.max(2, Math.ceil((4 + 2 * crewN()) / crewN()));
    for (let k = 0; k < n; k++) {
      const a = (k + mySlot() * 0.5) / n * PI * 2 + 0.4, r = 16 + (k % 2) * 8, x = A.cove.x + Math.sin(a) * r, z = A.cove.z + Math.cos(a) * r, y = AF.surfaceBelow(x, z, A.cove.y + 14, 30);
      if (!Number.isFinite(y) || y < -0.9 || AF.boxBlocked(x, y + 0.05, z, 0.3, 1.7)) continue;
      if (C.spawnGoon(x, y, z, { kind: k % 3 === 2 ? 'brawl' : 'gun', weapon: k === 1 ? 'smg' : 'pistol', hp: 140 })) H.goonsN++;
    }
  };
  const ambushOver = () => {
    if (AF.mode === 'jetski' || dist(me(), A.cove) > 220) return true;
    if (!H.goonsN) return H.t > 6;
    const C = CB(); return !C || C.goons().every((w) => w.agg && w.agg.st === 'down');
  };
  // ---- the chase: Moretti men on jet skis come after the crew; nobody heads for the Queen with them on their tail. The host steers them
  // (8 Hz 'ch' to the crew), guests forward their hits ('chit'); riders are path walkers in the 'ride' pose (shared draws, hittable via
  // actor.chase), hulls ride along in the island's jet-ski InstancedMesh (AF.island.jetski.extra).
  const SEA = AF.PLAN.harbour.waterY, CH = { list: [], on: false, sendT: 0, t: 0 };
  const deepAt = (x, z) => AF.W.groundY(x, z) < SEA - 1.5, rideAt = (x, z) => AF.W.groundY(x, z) < SEA - 0.6;
  // the cove is a basin behind a dog-leg channel: a chaser on the other side of it threads the channel's points
  const CVP = AF.PLAN.world.island.cove, inCove = (x, z) => !!CVP && Math.hypot(x - CVP.x, z - CVP.z) < CVP.r + 3;
  const viaChannel = (e, tx, tz, out) => {
    if (!CVP || !CVP.channel || inCove(e.x, e.z) === inCove(tx, tz)) return false;
    const pts = CVP.channel, inward = !inCove(e.x, e.z); let k = 0, bd = 1e9;
    for (let i = 0; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - e.x, pts[i][1] - e.z); if (d < bd) { bd = d; k = i; } }
    if (bd < 9) k += inward ? -1 : 1;
    if (k < 0) { out[0] = CVP.x; out[1] = CVP.z; } else if (k >= pts.length) { out[0] = tx; out[1] = tz; } else { out[0] = pts[k][0]; out[1] = pts[k][1]; }
    return true;
  };
  const WP = [0, 0];
  const chaseMake = (k) => {
    const P = HS.walkers.chase, a = P && P.actors[k]; if (!a) return null;
    const e = { k, x: 0, y: SEA - 0.1, z: 0, yaw: 0, v: 0, hp: 110, alive: true, side: k % 2 ? 1 : -1, fireT: 1.5 + k * 0.4, sink: 0, a, nx: 0, nz: 0, nyaw: 0, pitch: 0.08, roll: 0, on: true, fired: 0, w: 0 };
    a.chase = e; if (a.rx) { a.rx.down = a.rx.fall = 0; } a.rxOn = false; a.tilt = a.lift = 0;
    const J = AF.island && AF.island.jetski; if (J && J.extra) J.extra.push(e);
    if (P) P.enabled = true;
    return e;
  };
  const chaseClear = () => {
    for (const e of CH.list) { e.on = false; if (e.a) { e.a.chase = null; e.a.ctl = { x: e.x, y: SEA - 60, z: e.z, yaw: 0, moving: false, ph: 0 }; } if (AF.audio) AF.audio.hold('heist-ch' + e.k, 'jetski_loop', 0, 1, e.x, e.y, e.z); }
    CH.list.length = 0; CH.on = false;
    const J = AF.island && AF.island.jetski; if (J && J.extra) J.extra.length = 0;
    if (HS && HS.walkers && HS.walkers.chase) HS.walkers.chase.enabled = false;
  };
  const chaseStart = () => {   // host: they come round the headland, out beyond the cove's channel
    chaseClear(); CH.on = true; CH.t = 0;
    const CV = AF.PLAN.world.island.cove, ch = CV && CV.channel && CV.channel.length ? CV.channel[CV.channel.length - 1] : null;
    const c = ch ? { x: ch[0], z: ch[1] } : A.cove, base = ch ? Math.atan2(ch[0] - CV.x, ch[1] - CV.z) : 0, n = Math.min(8, 2 + crewN()), p = me();
    for (let k = 0; k < n; k++) {
      const e = chaseMake(k); if (!e) break;
      let x = c.x, z = c.z;
      for (let tries = 0; tries < 30; tries++) {
        const ang = base + ((n > 1 ? k / (n - 1) : 0.5) - 0.5) * 1.6 + (tries % 2 ? 1 : -1) * Math.ceil(tries / 2) * 0.22, r = 60 + (tries % 3) * 20;
        x = c.x + Math.sin(ang) * r; z = c.z + Math.cos(ang) * r; if (deepAt(x, z) && dist({ x, z }, p) > 45) break;
      }
      e.x = e.nx = x; e.z = e.nz = z; e.yaw = e.nyaw = Math.atan2(p.x - x, p.z - z); e.v = 14;
      CH.list.push(e);
    }
  };
  const chaseIngest = (rows) => {   // guest
    if (!is('chase')) return;
    if (CH.list.length !== rows.length) { chaseClear(); CH.on = true; for (let k = 0; k < rows.length; k++) { const e = chaseMake(k); if (e) { e.x = +rows[k][0]; e.z = +rows[k][1]; CH.list.push(e); } } }
    rows.forEach((r, k) => {
      const e = CH.list[k]; if (!e || !Array.isArray(r) || ![r[0], r[1], r[2]].every(Number.isFinite)) return;
      e.nx = r[0]; e.nz = r[1]; e.nyaw = r[2]; e.hp = +r[4] || 0;
      if (e.alive && r[3] !== 1) chaseKill(e);
      if (r[5] > 0) { const slot = (r[5] | 0) - 1, P = slot === mySlot() ? me() : AF.coop && AF.coop.players.get(slot); if (P) chaseTracer(e, P.x, (P.y || SEA) + 0.9, P.z, false); }
    });
  };
  const chaseTracer = (e, tx, ty, tz, hit) => {
    const C = CB(), mx = hit ? 0 : (Math.random() - 0.5) * 3, mz = hit ? 0 : (Math.random() - 0.5) * 3;
    if (C && C.tracer) C.tracer(e.x, e.y + 1.35, e.z, tx + mx, ty, tz + mz, false);
    if (AF.audio) AF.audio.play('gun_smg', { x: e.x, y: e.y + 1.3, z: e.z, vol: 0.85 });
  };
  const chaseKill = (e) => {
    e.alive = false; e.sink = 0; e.v *= 0.5;
    if (e.a) AF.walkers.knock(e.a, Math.sin(e.yaw), Math.cos(e.yaw), 2, 1e6);
    sfx('splash', { x: e.x, y: SEA, z: e.z });
    if (AF.fx && AF.fx.burst) AF.fx.burst('smoke', e.x, e.y + 0.6, e.z, 3, { size: 0.8, spread: 1.2 });
    const left = CH.list.filter((q) => q.alive).length;
    if (left) note('Chaser down \u2014 ' + left + ' to go.', 'ok'); else if (is('chase')) radio('vera.chase2', true);
  };
  const chaseHit = (e, dmg, head, remote) => {
    if (!e || !e.alive) return;
    if (!host()) { send({ op: 'chit', k: e.k, d: Math.round(dmg), h: head ? 1 : 0 }, 0); return; }
    e.hp -= head ? dmg * 2.5 : dmg; void remote;
    if (e.hp <= 0) chaseKill(e);
  };
  const chaseTargets = (out) => {
    out.length = 0; const p = me();
    if (AF.mode !== 'dead') out.push(mySlot(), p.x, p.y, p.z);
    if (online() && AF.coop && AF.coop.players) for (const [slot, r] of AF.coop.players) if (r && r.seen && !r.dead) out.push(slot, r.x, r.y, r.z);
    return out;
  };
  const TG = [], CHROW = [];
  const chaseTick = (dt, t) => {
    if (!CH.list.length) return;
    if (!is('chase')) { if (!is('ambush')) chaseClear(); return; }
    CH.t += dt;
    const hostSide = host();
    if (hostSide) chaseTargets(TG);
    for (const e of CH.list) {
      if (!e.alive) {
        e.sink += dt; e.v *= Math.exp(-dt * 1.5); e.x += Math.sin(e.yaw) * e.v * dt; e.z += Math.cos(e.yaw) * e.v * dt;
        e.y = SEA - 0.1 - Math.min(1.2, e.sink * 0.35); e.pitch = 0.08 + Math.min(0.5, e.sink * 0.2);
        if (e.a) { const c = e.a.ctl || (e.a.ctl = { x: 0, y: 0, z: 0, yaw: 0, moving: false, ph: 0 }); c.x = e.x; c.y = e.sink > 2.5 ? SEA - 60 : e.y - 0.02; c.z = e.z; c.yaw = e.yaw; }
        if (e.sink > 5) e.on = false;
        if (AF.audio) AF.audio.hold('heist-ch' + e.k, 'jetski_loop', 0, 1, e.x, e.y, e.z);
        continue;
      }
      if (hostSide) {
        let bi = -1, bd = 1e9;
        for (let i = 0; i < TG.length; i += 4) { const d = Math.hypot(TG[i + 1] - e.x, TG[i + 3] - e.z); if (d < bd) { bd = d; bi = i; } }
        let want = e.yaw, vt = 12;
        if (bi >= 0) {
          const tx = TG[bi + 1], tz = TG[bi + 3], dx = tx - e.x, dz = tz - e.z, d = Math.max(0.1, bd);
          // ride 14 m short of the target and 8 m off to one side: they flank and keep shooting rather than ram
          const px = tx - dx / d * 14 - dz / d * e.side * 8, pz = tz - dz / d * 14 + dx / d * e.side * 8, dd = Math.hypot(px - e.x, pz - e.z);
          want = Math.atan2(px - e.x, pz - e.z); vt = dd > 45 ? 25 : dd > 14 ? 19 : 11;
          if (viaChannel(e, tx, tz, WP)) { want = Math.atan2(WP[0] - e.x, WP[1] - e.z); vt = 15; }
          if ((e.fireT -= dt) <= 0 && d < 46) {
            e.fireT = 0.9 + Math.random() * 0.9;
            const hit = Math.random() < AF.clamp(0.36 - d / 130, 0.1, 0.32), slot = TG[bi];
            chaseTracer(e, tx, TG[bi + 2] + 0.9, tz, hit); e.fired = slot + 1;
            if (hit) { if (slot === mySlot()) { if (AF.health && !AF.health.dead) AF.health.hurt(5 + Math.round(Math.random() * 4), 'gun'); } else send({ op: 'chshot', d: 6 }, slot); }
          }
        }
        // keep off the rocks: look ahead and swing to the side with water
        const look = Math.max(6, Math.min(14, e.v * 0.7)), ax = e.x + Math.sin(e.yaw) * look, az = e.z + Math.cos(e.yaw) * look;
        if (!rideAt(ax, az)) { const l = e.yaw + 0.9, r = e.yaw - 0.9; want = rideAt(e.x + Math.sin(l) * look, e.z + Math.cos(l) * look) ? l : r; vt = Math.min(vt, 9); }
        const turn = AF.clamp(AF.angDiff(e.yaw, want), -1.9 * dt, 1.9 * dt); e.yaw += turn; e.w = turn / Math.max(dt, 1e-3);
        e.v += (vt - e.v) * (1 - Math.exp(-dt * 1.3));
        const nx = e.x + Math.sin(e.yaw) * e.v * dt, nz = e.z + Math.cos(e.yaw) * e.v * dt;
        if (rideAt(nx, nz) || !rideAt(e.x, e.z)) { e.x = nx; e.z = nz; } else { e.v *= 0.5; e.yaw += 2.2 * dt * (e.side || 1); }
        for (const o of CH.list) { if (o === e || !o.alive) continue; const sx = e.x - o.x, sz = e.z - o.z, s = Math.hypot(sx, sz); if (s > 0.01 && s < 4) { const k = (4 - s) / s * 0.5 * Math.min(1, dt * 4); if (rideAt(e.x + sx * k, e.z + sz * k)) { e.x += sx * k; e.z += sz * k; } } }
      } else {
        const k = 1 - Math.exp(-dt * 6), dx = e.nx - e.x, dz = e.nz - e.z;
        if (dx * dx + dz * dz > 900) { e.x = e.nx; e.z = e.nz; } else { e.x += dx * k; e.z += dz * k; }
        const turn = AF.angDiff(e.yaw, e.nyaw) * k; e.yaw += turn; e.w = turn / Math.max(dt, 1e-3);
      }
      e.y = SEA - 0.1 + Math.sin(t * 2.4 + e.k) * 0.06; e.roll = AF.clamp(-e.w * 0.35, -0.45, 0.45); e.pitch = 0.08;
      if (e.a) { const c = e.a.ctl || (e.a.ctl = { x: 0, y: 0, z: 0, yaw: 0, moving: false, ph: 0 }); c.x = e.x; c.y = e.y - 0.02; c.z = e.z; c.yaw = e.yaw; }
      if (AF.audio) AF.audio.hold('heist-ch' + e.k, 'jetski_loop', 0.75, 0.9 + Math.min(0.5, e.v / 50), e.x, e.y, e.z);
    }
    if (hostSide && online() && (CH.sendT -= dt) <= 0) {
      CH.sendT = 1 / 8; CHROW.length = 0;
      for (const e of CH.list) { CHROW.push([+e.x.toFixed(1), +e.z.toFixed(1), +e.yaw.toFixed(2), e.alive ? 1 : 0, Math.max(0, Math.round(e.hp)), e.fired]); e.fired = 0; }
      send({ op: 'ch', s: CHROW });
    }
  };
  const chaseLeft = () => CH.list.filter((e) => e.alive).length;
  const chaseMark = () => { let b = null, bd = 1e9; const p = me(); for (const e of CH.list) if (e.alive) { const d = dist(p, e); if (d < bd) { bd = d; b = e; } } if (b) { SC.x = b.x; SC.y = b.y + 1; SC.z = b.z; return SC; } return null; };
  const chaseOver = () => CH.on && CH.t > 3 && CH.list.length > 0 && !chaseLeft();

  // ---------------------------------------------------------------- act III: the Queen — uniforms, the salon, the sting
  const myStingRole = () => (H.wear === 'dealer' ? 'dealer' : H.wear === 'waiter' ? 'waiter' : H.wear === 'security' ? 'security' : null);
  const STAFFW = new Set(['waiter', 'dealer', 'security']);
  const secTaken = () => { let n = 0; for (const k in H.took) if (/^sec/.test(k)) n++; return n; };
  // a crew of two: a waiter and a dealer; three or four: the rest borrow ship's-security uniforms. Every one of them needs a uniform.
  const allUniformed = () => !!H.took.waiter && (crewN() < 2 || !!H.took.dealer) && crewSlots().every((s) => STAFFW.has(wears(s)));
  const uniformsLine = () => {
    if (myStingRole()) return crewN() > 1 ? 'Uniform on \u2014 wait for the rest of the crew to get theirs (' + crewSlots().filter((s) => STAFFW.has(wears(s))).length + '/' + crewN() + ')' : 'Uniform on';
    if (!H.took.waiter) return 'Knock out the {waiter} in the pantry' + (crewN() > 1 ? ', the {dealer} in the crew lounge' : '') + (crewN() > 2 ? ' or a {ship\u2019s officer}' : '') + ' and take the uniform \u2014 then hide the body';
    if (crewN() > 1 && !H.took.dealer) return 'Knock out the {dealer} in the crew lounge and take his vest \u2014 hide the body';
    return 'Take a {ship\u2019s officer} down from behind \u2014 quietly, out of sight \u2014 and borrow his uniform';
  };
  const secMark = () => { const p = me(); let b = null, bd = 1e9; for (const g of HS.secG || []) { if (H.took['sec' + HS.secG.indexOf(g)]) continue; const d = dist(p, g.a); if (d < bd) { bd = d; b = g.a; } } if (b) { SC.x = b.x; SC.y = b.y; SC.z = b.z; return SC; } return null; };
  // aboard the Queen: guns away (security shoots on sight)
  const holster = () => { const C = CB(); if (C && C.selectId && C.heldId && C.heldId !== 'fists') { C.selectId('fists'); note('Weapons away \u2014 ship\u2019s security opens fire at the sight of a gun. Fists and stealth only.', 'warn'); } };
  // the officers' jobs in the sting: keep the house detective talking, keep the pit boss looking elsewhere
  const holdNpc = (k, remote) => {
    if (k === 'det') { H.detHold = 30; const g = HS.detG; if (g && g.a && !g.down) AF.walkers.hold(g.a, (A.prescott.yaw || 0) + PI, 30); if (!remote) speak('det.chat', g && g.a); }
    else { H.pitHold = 30; if (!remote) speak('pit.chat', HS.npc.pit); }
    if (!remote) send({ op: 'hold', k });
  };
  const stingLine = () => {
    const r = myStingRole();
    if (r === 'dealer') return H.dealing ? 'Deal Prescott a {rotten hand} the moment the drink arrives (3 sloppy deals and you\u2019re out)' : 'Take over {Prescott\u2019s table} from Celeste';
    if (r === 'waiter') return !H.tray ? 'Pick up a {drink tray} at the salon bar' : H.anger > 0 ? 'He\u2019s ranting \u2014 {serve his drink} and lift the key NOW' : 'Serve {Mr Prescott} his drink while he\u2019s ranting at the dealer';
    if (r === 'security') return H.detHold > 0 ? (H.pitHold > 0 ? 'Stand by the door and look official' : 'Have a word with the {pit boss} \u2014 keep his eyes off the table') : 'Keep the {house detective} talking while the key is lifted';
    return 'Help your crew lift {Prescott\u2019s key}';
  };
  const stingMark = () => { const r = myStingRole(); if (r === 'security') { const g = HS.detG; return H.detHold > 0 ? (H.pitHold > 0 ? null : HS.npc.pit) : g && g.a; } return r === 'dealer' && !H.dealing ? A.dealer : r === 'waiter' && !H.tray ? A.salonBar : A.prescott; };
  const ANGRY = ['prescott.angry1', 'prescott.angry2', 'prescott.angry3'];
  const anger = (secs, remote) => {
    H.anger = secs; if (!remote) send({ op: 'anger', s: secs });
    const n = HS.npc.prescott; if (n) { speak(ANGRY[H.angerN++ % 3], n); n.yaw = (A.prescott.yaw || 0) + 0.6; }
  };
  const strike = (remote) => {
    if (H.pitHold > 0) return;   // an officer is keeping the pit boss busy
    H.strikes++; if (!remote) send({ op: 'strike' });
    const n = HS.npc.pit;
    if (H.strikes >= 3) { speak('pit.fire', n); if (!remote) fail('The pit boss pulled you off the table.'); }
    else speak('pit.warn', n);
  };
  const takeTable = () => {
    if (H.dealing || myStingRole() !== 'dealer') return;
    H.dealing = true; send({ op: 'table' }); HS.showNpc('celeste', false);
    speak('pit.relieve', HS.npc.pit); setTimeout(() => speak('prescott.greet', HS.npc.prescott), 1800);
    AF.PL.still = true;
    play('deal', { title: 'Baccarat \u00b7 Mr Prescott', sub: 'Deal clean \u2014 or slip him a rotten hand when the drink arrives', diff: 0.5, noCatch: true, hands: 999, need: 999,
      onBad: () => { if (is('sting')) anger(7); }, onSloppy: () => { if (is('sting')) strike(); } }).then(() => { H.dealing = false; AF.PL.still = false; });
  };
  const serve = () => {
    const n = HS.npc.prescott; if (!n || myStingRole() !== 'waiter' || !H.tray || H.lifting || H.got.key) return;
    if (!(H.anger > 0)) { speak('prescott.drink', n); H.tray = false; note('He\u2019s watching his drink. Wait until he\u2019s ranting at the dealer, then serve.', 'warn'); return; }
    H.lifting = true;
    AF.hud.meter({ label: 'Lift the key from his jacket', sub: AF.touch ? 'Tap when the needle is in the green' : 'Click, E or Q when the needle is in the green', speed: 1.35, zone: [0.56, 0.73] }, (v, ok) => {
      H.lifting = false; H.tray = false; if (!is('sting')) return;
      if (ok) { sfx('zip_bag'); setGot('key'); return; }
      if (Math.abs(v - 0.645) < 0.2) { speak('prescott.calm', n); note('He shifts in his seat\u2026 easy. Fetch another tray.', 'warn'); return; }
      speak('prescott.caught', n); fail('Prescott felt a hand in his pocket.');
    });
  };
  // ---------------------------------------------------------------- act IV: the hack, the cameras, the bank
  const hackTerminal = () => {
    if (H.busy) return;
    if (H.got.hacked) { openCams(); return; }
    H.busy = true; radio('kestrel.auth');
    play('signal', { title: 'Kestrel Systems \u00b7 authentication', sub: 'Match the carrier to slip past the handshake', diff: 0.55, time: 50 }).then((r) => {
      H.busy = false;
      if (r && r.ok) setGot('hacked'); else if (!(r && r.cancelled)) radio('kestrel.fail');
    });
  };
  const lockOn = (remote) => { H.lockT = LOCK; if (!remote) send({ op: 'lock' }); radio('kestrel.lock'); };
  const cutLasers = (remote) => { if (HB) HB.cutLasers(8); if (!remote) send({ op: 'laser' }); radio('kestrel.laser'); };
  const camActions = () => {
    const out = [];
    if (!is('night')) return out;
    if (!H.got.hatch) out.push({ kind: 'mission', mission: true, label: 'Unlock the roof door', game: 'keypad', diff: 0.45, run: () => setGot('hatch') });
    if (H.tr.n === 3 && !H.got.gate) out.push({ kind: 'mission', mission: true, label: H.lockT > 0 ? 'Time lock open \u2014 ' + Math.ceil(H.lockT) + ' s' : 'Override the time lock', game: 'circuit', diff: 0.6, disabled: H.lockT > 0, run: () => lockOn() });
    if (H.tr.n === 4 && !H.got.cage) out.push({ kind: 'mission', mission: true, label: HB && HB.laserCut > 0 ? 'Lasers down' : 'Cut the laser grid (8 s)', game: 'flow', diff: 0.45, disabled: HB && HB.laserCut > 0, run: () => cutLasers() });
    if (S && S.zone && S.zone.alarm && S.zone.id === 'bank') out.push({ kind: 'mission', mission: true, label: 'Reset the alarm', game: 'signal', diff: 0.6, run: () => { S.act('reset', 0, 1); } });
    return out;
  };
  const openCams = (tablet) => {
    if (!AF.cctv || !H.got.hacked || AF.mode === 'cctv') return;
    if (S && (!S.zone || S.zone.id !== 'bank')) { S.reset('bank'); S.activate('bank'); }
    AF.cctv.open({ zone: 'bank', sit: !tablet, tablet: !!tablet, actions: camActions, feed: tablet ? 2 : 0 });
  };
  const tabletOk = () => H.on && is('night') && H.got.hacked && myRole() === 'infil' && AF.mode === 'walk' && !(S && S.zone && S.zone.alarm && S.zone.seen);
  // the service ladder: climbed, rung by rung (a small 'climb' mode, no teleport)
  const CL = { o: null, y: 0, t: 0 };
  AF.modes.climb = {
    enter(o) { CL.o = o; CL.y = o.y0; CL.t = 0; const P = AF.player; P.teleport(o.x, o.y0, o.z, o.yaw); AF.interactTarget = null; },
    exit() { const P = AF.player; if (P.parts) { P.parts.armL.rotation.x = P.parts.armR.rotation.x = 0; } },
    update(dt) {
      const o = CL.o, I = AF.input, P = AF.player; if (!o) { AF.setMode('walk'); return; }
      const up = (I.key('KeyS') || I.key('ArrowDown') ? -1 : 1) * 1.7;
      CL.y = Math.max(o.y0, CL.y + up * dt); CL.t += dt * Math.abs(up);
      if (up < 0 && CL.y <= o.y0 + 0.01) { AF.setMode('walk', { x: o.x, y: o.y0, z: o.z - Math.cos(o.yaw) * 0.8, yaw: o.yaw + PI }); return; }
      if (CL.y >= o.y1) { AF.setMode('walk', { x: o.top.x, y: o.top.y, z: o.top.z, yaw: o.top.yaw, snap: true }); return; }
      P.x = o.x; P.y = CL.y; P.z = o.z;
      if (P.mesh) { P.mesh.position.set(o.x, CL.y, o.z); P.mesh.rotation.set(0, o.yaw, 0); }
      if (P.parts) { const s = Math.sin(CL.t * 3.4); P.parts.armL.rotation.x = -2.7 + s * 0.35; P.parts.armR.rotation.x = -2.7 - s * 0.35; if (P.parts.legL) { P.parts.legL.rotation.x = -0.5 - s * 0.4; P.parts.legR.rotation.x = -0.5 + s * 0.4; } }
      const c = AF.camera, bx = -Math.sin(o.yaw) * 3.6, bz = -Math.cos(o.yaw) * 3.6;
      c.position.set(o.x + bx, CL.y + 1.2, o.z + bz); AF.camTarget.set(o.x, CL.y + 1.3, o.z); c.lookAt(AF.camTarget); AF.shadowFocus.set(o.x, 0, o.z);
      if ((CL.t % 0.6) < dt * 1.8) sfx('step_concrete_0', { vol: 0.5 });
    },
  };
  const climbLadder = () => { const L = HB.spots.ladder; AF.setMode('climb', { x: L.x, z: L.z, y0: L.y, y1: HB.spots.ladderTop.y - 0.2, yaw: PI, top: HB.spots.ladderTop }); };
  const keypad = () => {
    if (H.got.hatch) return;
    if (!H.got.hacked) { note('A Kestrel keypad. Without the hack it won\u2019t take a code.', 'warn'); return; }
    if (crewN() > 1 && myRole() === 'infil') { note('Locked. Your hacker can pop it from the cameras.', 'warn'); return; }
    if (H.busy) return; H.busy = true;
    play('keypad', { title: 'Roof door keypad', sub: 'Kestrel shows you the worn keys', diff: 0.35 }).then((r) => { H.busy = false; if (r && r.ok) setGot('hatch'); });
  };
  const KEYN = ['north', 'south'];
  const grip = (k, remote) => {
    if (!is('night') || H.tr.n !== 3 || H.grip[k] > 0) return;
    if (!(H.lockT > 0)) { if (!remote) note('The time lock is engaged. ' + (crewN() > 1 ? 'Your hacker has to override it first.' : 'Override it with the Kestrel tablet (T).'), 'warn'); return; }
    H.grip[k] = GRIP; sfx('click_metal');
    if (!remote) { send({ op: 'grip', k }); if (!(H.grip[1 - k] > 0)) note('You turn the ' + KEYN[k] + ' key. ' + GRIP + ' seconds to turn the ' + KEYN[1 - k] + ' one!', 'ok'); }
    if (H.grip[0] > 0 && H.grip[1] > 0 && host()) setGot('gate');
  };
  const drill = () => {
    if (H.drilling || H.got.cage || H.tr.n !== 5) return;
    H.drilling = true; send({ op: 'drill', on: 1 });
    play('drill', { title: 'Diamond-core drill', sub: 'Keep the pressure in the green \u2014 an overheating bit screams', diff: 0.5, time: 30 }).then((r) => {
      H.drilling = false; send({ op: 'drill', on: 0 });
      if (r && r.ok) setGot('cage'); else if (!(r && r.cancelled)) note('The bit jammed. Set it up again.', 'warn');
    });
  };
  const nextBag = () => { for (let k = 0; k < 4; k++) if (!H.bags[k]) return HB.spots.bags[k]; return HB.spots.fire; };
  const bag = (k, remote) => {
    if (H.bags[k]) return; H.bags[k] = true; sfx('zip_bag'); sfx('money');
    if (!remote) send({ op: 'bag', k });
    const n = H.bags.filter(Boolean).length; note(n < 4 ? 'Cash bag ' + n + ' of 4.' : 'That\u2019s the lot!', 'money'); applyNight();
    if (n === 4 && S && S.zone && S.zone.id === 'bank') { S.raiseAlarm('Silent alarm'); radio('vera.alarm', true); }
  };

  // ---------------------------------------------------------------- act V: the getaway
  const getaway = (restored) => {
    const C = CB(); if (C) C.crime(Math.max(0, 270 - C.heat));
    if (HB && HB.ready) { for (const d of ['fire', 'hallEast', 'c4', 'gate']) HB.door(d, true); }
    if (myRole() === 'hack') radio('vera.g4'); else radio('vera.g1');
    const K = A.carSpot; if (!K || !VV || !VV.makeCar) return;
    if (H.car && !H.car.dead && !(restored && dist(H.car, K) > 10)) return;
    if (H.car) { H.car.temp = true; H.car = null; }
    const type = VV.TYPES.find((t) => t.id === 'duesy') ? 'duesy' : VV.TYPES.find((t) => t.kind === 'car').id;
    try { const car = VV.makeCar(type, 0, K.x, K.z, K.yaw); car.temp = false; car.parked = true; H.car = car; A.car = { x: car.x, y: car.y, z: car.z }; } catch (e) { AF.warnOnce('heist car', e); }
  };
  const run = () => {
    radio('vera.g2'); resetPlanes();
    if (H.roadblock || !A.carSpot || !A.plane || !VV || !VV.makeCar) return;
    const Sp = A.carSpot, G = A.plane, k = kerbAt(Sp.x + (G.x - Sp.x) * 0.4, Sp.z + (G.z - Sp.z) * 0.4); if (!k) return;
    const cars = [];
    for (const s of [-1.5, 1.5]) { try { const c = VV.makeCar('police', 0, k.cx + k.nx * s, k.cz + k.nz * s, Math.atan2(k.nx, k.nz) + (s > 0 ? 0 : PI)); c.temp = true; c.parked = true; c.v = c.vx = c.vz = 0; cars.push(c); } catch (e) { AF.warnOnce('heist roadblock', e); } }
    H.roadblock = { x: k.cx, z: k.cz, cars, blown: false };
  };

  // ---------------------------------------------------------------- act VI: the betrayal fight
  const WAVES = [4, 4, 5];
  const fight = (restored) => {
    H.waves = 0; H.bosses = []; H.fightT = 0;
    const C = CB(); if (C) C.clearGoons();
    if (!restored) radio('tony.k2');
  };
  const spawnWave = () => {
    const C = CB(); if (!C || !C.spawnGoon) return;
    const n = Math.max(2, Math.ceil(WAVES[H.waves] * (1 + 0.45 * (crewN() - 1)) / crewN())), P = AF.player, spots = A.goonSpawns.filter((s) => dist(s, P) > 14);
    for (let k = 0; k < n; k++) { const s = spots[(k * 3 + H.waves + mySlot()) % spots.length] || A.goonSpawns[k % A.goonSpawns.length]; C.spawnGoon(s.x + (k % 2) * 1.2, s.y, s.z, { kind: 'gun', weapon: H.waves === 2 && k === 0 ? 'lmg' : k % 2 ? 'smg' : 'pistol', hp: 120 }); }
    if (host() && H.waves === 1) {
      const sp = (s, name, wpn, hp) => { const w = C.spawnGoon(s.x, s.y, s.z, { kind: 'gun', weapon: wpn, hp, name }); if (w) H.bosses.push(w); };
      sp(A.goonSpawns[0], 'Kit Morrow', 'smg', 320); sp(A.goonSpawns[Math.min(3, A.goonSpawns.length - 1)], 'Tony Moretti', 'smg', 340);
      radio('kit.boss');
    }
    if (host() && H.waves === 2) { const s = A.silasRun[0]; const w = C.spawnGoon(s[0], s[1], s[2], { kind: 'gun', weapon: 'lmg', hp: 480, name: 'Silas Crane' }); if (w) H.bosses.push(w); radio('silas.boss'); radio('vera.k4'); }
    H.waves++;
  };
  const downed = (w) => !w.act || (w.agg && w.agg.st === 'down');
  const bossMark = () => { const b = H.bosses.find((w) => !downed(w)); if (b) { SC.x = b.x; SC.y = b.y; SC.z = b.z; return SC; } return A.fight; };
  const fightOver = () => H.waves >= WAVES.length && H.t > 8 && (!CB() || CB().goons().every(downed)) && H.bosses.every(downed);
  const fightTick = (dt) => {
    if (!is('fight')) return;
    const C = CB(); if (!C) return;
    const armed = C.has && C.has('lmg');
    if (!armed && H.t < 25) return;            // the fight starts when someone opens the crate (or 25 s on)
    H.fightT = (H.fightT || 0) + dt;
    const alive = C.goons().filter((w) => !downed(w)).length;
    if (H.waves < WAVES.length && (H.waves === 0 || (alive <= 1 && H.fightT > 4))) { H.fightT = 0; spawnWave(); }
    for (const b of H.bosses) if (!b.said && downed(b)) { b.said = true; const id = /Kit/.test(b.agg && b.agg.name || '') ? 'kit.down' : /Tony/.test(b.agg && b.agg.name || '') ? 'tony.down' : 'silas.down'; radio(id, true); }
  };
  // ---------------------------------------------------------------- build: Vera, interacts, the places only the story needs
  const veraBlip = () => { if (!A.vera) return; if (H.on) MI.unblip('heist'); else MI.blip('heist', { x: A.vera.x, y: A.vera.y, z: A.vera.z, kind: 'heist', label: 'Heist \u00b7 Vera' }); };
  const walkOk = () => AF.mode === 'walk';
  const follow = (it, getA) => { it._follow = getA; return it; };
  const FOLLOW = [];
  AF.onBuild('heist', 950, () => {
    const NP = AF.npc; if (!NP || !HS || !HS.ready) return;
    H.vera = NP.spawn({ id: 'heist-vera', name: 'Vera Lark', role: 'Planner \u00b7 The Harbour Trust Job', look: LOOKS.vera, x: A.vera.x, y: A.vera.y, z: A.vera.z, yaw: A.veraYaw, greet: ['Psst. Got a minute?', 'Looking for work? Bring a friend.'], lines: [['Walk with me a minute.']] });
    const vi = H.vera.interact; vi.label = 'Talk to Vera Lark \u00b7 The Harbour Trust Job (co-op)'; vi.prio = 1.2; vi.act = vera;
    A.planes = (AF.planes.list || []).filter((p) => p.home && p.home.x < -400);
    const pl0 = A.planes[0]; A.plane = pl0 ? { x: pl0.home.x, y: AF.W.groundY(pl0.home.x, pl0.home.z), z: pl0.home.z } : { x: -520, y: 0.5, z: 80 };
    A.carSpot = kerbAt(30, -98); if (A.carSpot) A.car = { x: A.carSpot.x, y: A.carSpot.y, z: A.carSpot.z };
    const LS = (LN() && LN().spots) || {};
    A.c5 = LS.tender ? { x: LS.tender.x, y: LS.tender.y, z: LS.tender.z, yaw: PI } : Object.assign(free(-230, 262, 4, 8), { yaw: PI });
    // every story interaction waits while the police are after you (the job only goes on once you've lost them)
    const add = (o) => { const f = o.act; if (f) o.act = (...a) => { if (wantedHold()) { wantedNag(true); return; } f(...a); }; return AF.addInteract(Object.assign({ prio: 2 }, o)); };
    // act I
    add({ x: A.grille.x, y: A.grille.y + 1, z: A.grille.z, r: 1.8, label: 'Pick the padlock on the night grille', prio: 2.4, can: () => walkOk() && is('uniform') && !H.got.grille && !H.busy && !mgDone('grille'), act: pickGrille });
    add({ x: A.rail.x, y: A.rail.y + 1, z: A.rail.z, r: 1.7, label: 'Take a pilot uniform off the rail', can: () => walkOk() && is('uniform') && H.got.grille && !H.got.uniform && !mgDone('rail'), act: () => { sfx('cloth'); dress('pilot'); note('Pilot uniform on. Very dashing.', 'ok'); mgMark('rail', mySlot()); } });
    add({ x: A.ezra.x, y: A.ezra.y + 1, z: A.ezra.z, r: 2.4, label: 'Get your pilot papers from Ezra', prio: 2.4, can: () => walkOk() && is('forger') && !H.got.papers && !H.busy && !mgDone('papers'), act: ezraPapers });
    add({ x: A.gate.x, y: A.gate.y + 1, z: A.gate.z, r: 2.6, label: 'Show your papers at the crew gate', prio: 2.4, can: () => walkOk() && is('gate') && !H.got.cleared, act: showPapers });
    // act II
    add({ x: A.cache.x, y: A.cache.y + 1, z: A.cache.z, r: 2.2, label: 'Crack the arms cache', can: () => walkOk() && is('cache') && !H.got.cache && !H.busy, act: crackCache });
    (A.racks || []).forEach((rk, i) => add({ x: rk.x, y: rk.y + 1, z: rk.z, r: 1.7, label: i % 2 ? 'Take a pump shotgun off the rack' : 'Take a Tommy gun off the rack', prio: 2.5, can: () => walkOk() && (is('cache') || is('cave')),
      act: () => { const C = CB(); if (C && C.lend) { C.lend(i % 2 ? 'shotgun' : 'tommy', i % 2 ? 48 : 250); sfx('gun_reload'); note(i % 2 ? 'Pump shotgun \u2014 loud and close.' : 'Tommy gun \u2014 250 rounds. Loud.', 'ok'); } } }));
    // act III
    FOLLOW.push(follow(add({ x: 0, y: -999, z: 0, r: 1.8, label: 'Take the waiter\u2019s uniform', prio: 2.9, can: () => walkOk() && is('uniforms') && HS.waiterG && HS.waiterG.down && !H.took.waiter && !myStingRole(), act: () => { H.took.waiter = true; send({ op: 'took', k: 'waiter' }); dress('waiter'); sfx('cloth'); } }), () => HS.waiterG && HS.waiterG.a));
    FOLLOW.push(follow(add({ x: 0, y: -999, z: 0, r: 1.8, label: 'Take the dealer\u2019s uniform', prio: 2.9, can: () => walkOk() && is('uniforms') && HS.dealerG && HS.dealerG.down && !H.took.dealer && !myStingRole(), act: () => { H.took.dealer = true; send({ op: 'took', k: 'dealer' }); dress('dealer'); sfx('cloth'); } }), () => HS.dealerG && HS.dealerG.a));
    add({ x: A.dealer.x, y: A.dealer.y + 1, z: A.dealer.z, r: 2.0, label: 'Take over Prescott\u2019s table', prio: 2.5, can: () => walkOk() && is('sting') && myStingRole() === 'dealer' && !H.dealing, act: takeTable });
    // a crew of three or four: the others borrow ship's-security uniforms off officers they put down
    (HS.secG || []).forEach((g, i) => FOLLOW.push(follow(add({ x: 0, y: -999, z: 0, r: 1.8, prio: 2.9, label: 'Take the officer\u2019s uniform', can: () => walkOk() && is('uniforms') && g.down && !H.took['sec' + i] && !myStingRole() && crewN() > 2 && secTaken() < crewN() - 2,
      act: () => { H.took['sec' + i] = true; send({ op: 'took', k: 'sec' + i }); dress('security'); sfx('cloth'); note('Ship\u2019s security. Now hide him somewhere.', 'ok'); } }), () => g.a)));
    if (HS.detG) FOLLOW.push(follow(add({ x: 0, y: -999, z: 0, r: 2.2, prio: 2.6, label: 'Talk shop with the house detective', can: () => walkOk() && is('sting') && myStingRole() === 'security' && !(H.detHold > 0) && !HS.detG.down, act: () => holdNpc('det') }), () => HS.detG.a));
    if (HS.npc.pit) add({ x: HS.npc.pit.x, y: (HS.npc.pit.y || A.dealer.y) + 1, z: HS.npc.pit.z, r: 2.2, prio: 2.7, label: 'Have a word with the pit boss', can: () => walkOk() && is('sting') && myStingRole() === 'security' && !(H.pitHold > 0), act: () => holdNpc('pit') });
    add({ x: A.salonBar.x, y: A.salonBar.y + 1, z: A.salonBar.z, r: 2.0, label: 'Pick up a drink tray', can: () => walkOk() && is('sting') && myStingRole() === 'waiter' && !H.tray, act: () => { H.tray = true; sfx('glass'); } });
    if (HS.npc.prescott) { const pi = HS.npc.prescott.interact; pi.r = 2.2; pi.prio = 2.6; const t0 = pi.act; pi.act = () => { if (is('sting') && myStingRole() === 'waiter' && H.tray) serve(); else t0(); }; }
    if (HS.npc.silas) { const si = HS.npc.silas.interact; const t0 = si.act; si.act = () => { if (!is('silas')) t0(); }; }
    // act IV
    add({ x: A.locker.x, y: A.locker.y + 1, z: A.locker.z, r: 1.8, label: 'Borrow a keeper\u2019s uniform', can: () => walkOk() && is('night') && myRole() === 'hack' && !H.got.keeper, act: () => { sfx('cloth'); dress('keeper'); setGot('keeper'); } });
    add({ x: A.server.x, y: A.server.y + 1, z: A.server.z, r: 2.0, label: 'Jack into the Kestrel terminal', prio: 2.6, can: () => walkOk() && is('night') && myRole() === 'hack' && !H.busy && (!H.got.hacked || crewN() > 1), act: hackTerminal });
    add({ x: HB.spots.ladder.x, y: 1.3, z: HB.spots.ladder.z, r: 1.6, label: 'Climb the service ladder to the roof', can: () => walkOk() && H.on && (is('night') || is('split')), act: climbLadder });
    add({ x: HB.spots.bulkhead.x, y: HB.spots.bulkhead.y + 1.2, z: HB.spots.bulkhead.z, r: 1.6, label: 'Roof door keypad', can: () => walkOk() && is('night') && !H.got.hatch, act: keypad });
    HB.spots.keys.forEach((k, i) => add({ x: k.x, y: 1.5, z: k.z, r: 1.5, label: 'Turn the ' + KEYN[i] + ' vault key', can: () => walkOk() && is('night') && H.tr.n === 3 && !(H.grip[i] > 0), act: () => grip(i) }));
    add({ x: HB.spots.cage.x, y: 1.3, z: HB.spots.cage.z, r: 1.3, label: 'Set up the drill on the cage lock', can: () => walkOk() && is('night') && H.tr.n === 5 && !H.drilling && !H.got.cage, act: drill });
    HB.spots.bags.forEach((b, k) => add({ x: b.x, y: 1.0, z: b.z, r: 1.2, label: 'Grab the cash bag', can: () => walkOk() && is('night') && H.tr.n === 6 && !H.bags[k], act: () => bag(k) }));
    // act VI
    add({ x: A.crate.x, y: A.crate.y + 1, z: A.crate.z, r: 2.0, label: 'Take the LMG from Silas\u2019s crate', prio: 2.6, can: () => walkOk() && is('fight') && !(CB() && CB().has && CB().has('lmg')), act: () => { const C = CB(); if (C && C.lend) C.lend('lmg', 300); sfx('gun_reload'); note('Light machine gun \u2014 300 rounds. Give them hell.', 'ok'); } });
    // zone rules: disguises, alarms
    const z = (id) => S && S.zones.get(id);
    if (z('shop')) { z('shop').disguise = () => false; }
    if (z('queen')) { const q = z('queen'); const STAFF = new Set(['crew', 'pantry', 'crewLounge', 'stairs', 'salon', 'vestibule', 'office', 'vault', 'cage']);
      q.disguise = (slot) => { if (slot === mySlot() && H.lifting) return false; if (STAFFW.has(wears(slot))) return true; const p = slot === mySlot() ? AF.player : AF.coop && AF.coop.players.get(slot); return !!p && !!LN() && !!LN().room && !STAFF.has(LN().room(p.x, p.y, p.z)); }; q.onAlarm = () => fail('Ship\u2019s security caught you.'); }
    if (z('zoo')) { const q = z('zoo'); q.disguise = (slot) => wears(slot) === 'keeper'; q.onAlarm = () => fail('The night watchman raised the alarm.'); }
    if (z('tunnel')) z('tunnel').onAlarm = () => { radio('vera.spotted', true); };
    if (z('bank')) z('bank').onAlarm = (why) => { if (!H.bags.every(Boolean)) radio(/Gunfire|loud/i.test(why || '') ? 'vera.loud' : 'vera.spotted', true); };
    veraBlip();
  });
  // the shop zone after closing (the watchman is a path walker from 81-heist-sets): nobody belongs inside, so any sighting counts
  AF.onBuild('heist-shop-zone', 945, () => {
    if (!S || !HS || !HS.ready || !HS.walkers.watch) return;
    const zz = S.define('shop', { box: A.shopBox, mode: 'fail', voice: 'g2', reflexS: 2.2, radius: 60 });
    S.guard('shop', { path: HS.walkers.watch, voice: 'g2', name: 'Night watchman', range: 10, armed: false });
    zz.disguise = () => false;
    zz.onAlarm = () => fail('The night watchman caught you in Kovac\u2019s.');
  });

  // ---------------------------------------------------------------- Vera: the offer, the menu mid-job, the pause-menu buttons
  let sheetOpen = false;
  function vera() {
    if (H.on) { menu(); return; }
    const L = VO(H.runs ? 'vera.a1' : 'vera.offer');
    if (AF.audio && AF.audio.voice) AF.audio.voice(H.runs ? 'vera.a1' : 'vera.offer', { x: A.vera.x, y: A.vera.y + 1.6, z: A.vera.z });
    AF.emit('dialogue', { name: 'Vera Lark', role: 'Planner', lines: [L ? L[2] : 'There\u2019s a job.'], look: LOOKS.vera });
    H.after = offer; H.afterT = 0.3;
  }
  const copyInvite = () => { const url = N.inviteUrl(); try { navigator.clipboard.writeText(url).then(() => note('Invite link copied \u2014 send it to your crew.', 'ok'), () => note('Invite link: ' + url, 'info')); } catch (e) { note('Invite link: ' + url, 'info'); } };
  const hostCrew = () => {
    if (!N || !N.host) return;
    N.host().then(() => { note('Lobby open \u2014 code ' + N.code + '. Friends pick Join co-op on the title screen, or open your invite link.', 'mission'); if (sheetOpen) AF.shop.refresh(); })
      .catch((e) => note('Couldn\u2019t open a lobby (' + ((e && e.message) || 'error') + ').', 'bad'));
  };
  const offer = () => {
    sheetOpen = true;
    AF.shop.open({ title: 'The Harbour Trust Job', sub: 'Co-op heist \u00b7 a crew of 2\u20134 \u00b7 ' + AF.cash(H.pay) + ' each \u00b7 about an hour', onClose: () => { sheetOpen = false; }, items: () => {
      const n = crewN();
      if (n >= NEED || H.solo) return [
        { name: H.runs ? 'Pull it again' : 'Take the job', desc: 'Starts for the whole crew (' + n + (n === 1 ? ' player' : ' players') + ') \u2014 papers, the island, the Queen, the bank, the getaway', tag: 'Go', act: () => { AF.shop.close(); start(); } },
        { name: 'Not tonight', desc: 'She\u2019ll be here', tag: ' ', act: () => AF.shop.close() },
      ];
      return [
        online() ? { name: 'Waiting for your crew', desc: 'Share code ' + (N.code || '') + ' \u2014 friends pick Join co-op on the title screen', tag: 'Copy link', act: copyInvite }
          : { name: 'Host a crew', desc: 'Opens a co-op lobby; share the code with a friend', tag: 'Host', act: hostCrew },
        { name: 'Go alone', desc: 'Every two-person moment has a solo way through \u2014 harder', tag: 'Solo', act: () => { H.solo = true; AF.shop.close(); start(); } },
        { name: 'Not tonight', desc: 'The job wants two', tag: ' ', act: () => AF.shop.close() },
      ];
    } });
  };
  const menu = () => AF.shop.open({ title: 'The Harbour Trust Job', sub: ST[H.i] ? (ST[H.i].id === 'night' ? trackLine() : lineOf(ST[H.i])).replace(/[{}]/g, '') : '', items: () => [
    { name: 'Keep going', desc: 'Vera taps her watch', tag: ' ', act: () => AF.shop.close() },
    { name: 'Retry from the last checkpoint', desc: CPS[H.cp].label, tag: ' ', act: () => { AF.shop.close(); retry(); } },
    { name: 'Call off the job', desc: 'Everyone goes home empty-handed', tag: ' ', act: () => { AF.shop.close(); H.quit(); } },
  ] });
  const MN = document.createElement('div'); MN.className = 'coop-m heist-m'; MN.style.display = 'none';
  MN.innerHTML = '<div class="row"><label>Heist</label><div class="acts"><button class="btn" data-h="retry">Retry checkpoint</button><button class="btn" data-h="quit">Call it off</button></div></div>';
  { const menuEl = document.querySelector('#m-menu .panel'), stack = menuEl && menuEl.querySelector('.stack'); if (stack) menuEl.insertBefore(MN, stack); }
  MN.addEventListener('click', (e) => { e.stopPropagation(); const b = e.target.closest('[data-h]'); if (!b) return; if (UI.resume) UI.resume(); if (b.dataset.h === 'retry') retry(); else H.quit(); });
  // the Kestrel tablet button (solo inside man; also T)
  const TB = document.createElement('button'); TB.id = 'heist-tablet'; TB.textContent = '\u25a3 TABLET (T)';
  TB.style.cssText = 'position:fixed;left:50%;top:64px;transform:translateX(-50%);z-index:6;display:none;font:700 12px/1 system-ui,sans-serif;letter-spacing:.1em;color:#cfe9d4;background:rgba(8,30,18,.78);border:1px solid rgba(160,230,180,.5);border-radius:4px;padding:8px 14px;cursor:pointer';
  TB.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); if (tabletOk()) openCams(true); });
  document.body.appendChild(TB);

  // ---------------------------------------------------------------- the flight south under the coast radar
  // Between Westgate and Serena Isle the pilot keeps the plane inside a height band that keeps drifting (the gauge on the right).
  // Outside it the radar builds a lock; a full lock gets Westgate to call the police, and the landing waits until they're lost.
  const RD = document.createElement('div'); RD.id = 'heist-radar';
  RD.innerHTML = '<i></i><b></b><span></span><small>RADAR</small>';
  RD.style.cssText = 'position:fixed;right:max(24px,env(safe-area-inset-right));top:50%;width:26px;height:min(220px,38vh);transform:translateY(-50%);z-index:5;display:none;pointer-events:none;background:rgba(8,12,18,.6);border:1px solid rgba(255,255,255,.3);border-radius:3px;font:700 12px/1 system-ui,sans-serif;color:#fff;text-shadow:0 1px 2px #000';
  const [rdBand, rdMark, rdAlt, rdTag] = RD.children;
  rdBand.style.cssText = 'position:absolute;left:0;right:0;border-radius:2px;transition:background .2s';
  rdMark.style.cssText = 'position:absolute;left:-7px;right:-7px;height:3px;margin-top:-1px;background:#fff;box-shadow:0 0 4px #000';
  rdAlt.style.cssText = 'position:absolute;right:34px;margin-top:-7px;white-space:nowrap';
  rdTag.style.cssText = 'position:absolute;left:50%;top:calc(100% + 6px);transform:translateX(-50%);font-size:9px;letter-spacing:.12em;opacity:.8';
  document.body.appendChild(RD);
  const RADAR = { on: false, k: 0, t: 0, lo: 0, hi: 0, off: 0, ping: 0 }, RTOP = 100;
  const radarTick = (dt) => {
    const pl = AF.mode === 'fly' && AF.planes ? AF.planes.cur : null;
    const on = is('fly') && !!pl && !pl.onGround && !H.flag.radar && !H.failing && !MI.cut.on && !wanted() && dist(pl, A.plane) > 300 && dist(pl, A.strip) > 450;
    if (on !== RADAR.on) {
      RADAR.on = on; RD.style.display = on ? 'block' : 'none';
      if (on && !H.flag.radarSaid) { H.flag.radarSaid = true; RADAR.k = RADAR.t = 0; note('Coast radar ahead \u2014 keep the plane inside the green band on the right. It keeps moving.', 'warn'); }
    }
    if (!on) return;
    const t = RADAR.t += dt, c = AF.clamp(48 + 22 * Math.sin(t * 0.13) + 10 * Math.sin(t * 0.31 + 2), 24, 80);
    RADAR.lo = c - 8; RADAR.hi = c + 8;
    const alt = Math.max(0, pl.y - Math.max(0, AF.W.groundY(pl.x, pl.z)));
    RADAR.off = alt < RADAR.lo ? RADAR.lo - alt : alt > RADAR.hi ? alt - RADAR.hi : 0;
    RADAR.k = AF.clamp(RADAR.k + (RADAR.off ? 0.08 + RADAR.off * 0.01 : -0.1) * dt, 0, 1);
    if (RADAR.off && (RADAR.ping -= dt) <= 0) { RADAR.ping = 1.1 - RADAR.k * 0.8; sfx('ui_click'); }
    if (RADAR.k >= 1) { H.flag.radar = true; sfx('jg_spot'); const C = CB(); if (C) C.crime(80); note('Radar lock! Westgate called it in \u2014 lose the police before you land.', 'bad'); }
    const Y = (v) => (100 - AF.clamp(v, 0, RTOP) / RTOP * 100).toFixed(1) + '%';
    rdBand.style.top = Y(RADAR.hi); rdBand.style.bottom = (AF.clamp(RADAR.lo, 0, RTOP) / RTOP * 100).toFixed(1) + '%';
    rdBand.style.background = RADAR.off ? 'rgba(255,90,74,.55)' : 'rgba(125,220,138,.6)';
    rdMark.style.top = rdAlt.style.top = Y(alt); rdAlt.textContent = Math.round(alt) + ' m';
  };

  // ---------------------------------------------------------------- the bag lends the crew's gear while the job is on
  if (AF.inv) AF.inv.extra.push(() => {
    if (!H.on) return null;
    const g = H.got, out = [];
    if (g.papers && H.i < IDX.kit) out.push({ name: 'Pilot\u2019s licence', desc: 'Ezra\u2019s finest forgery', icon: 'card', tag: 'Papers' });
    if (g.kitkey && !g.gate) out.push({ name: 'Kit\u2019s vault key', desc: 'Turns the north lock', icon: 'key', tag: 'Key' });
    if (g.key && !g.gate) out.push({ name: 'Prescott\u2019s vault key', desc: 'Turns the south lock', icon: 'key', tag: 'Key' });
    if (g.cache && !g.cage) out.push({ name: 'Diamond-core drill', desc: 'For the deposit cage', icon: 'drill', tag: 'Gear' });
    if (g.hacked && crewN() < 2 && !g.cage) out.push({ name: 'Kestrel tablet', desc: 'T \u2014 the bank\u2019s cameras, lights and locks', icon: 'card', tag: 'Gear' });
    if (H.wear) out.push({ name: { pilot: 'Pilot\u2019s uniform', waiter: 'Waiter\u2019s jacket', dealer: 'Dealer\u2019s vest', keeper: 'Keeper\u2019s overalls', night: 'Night clothes' }[H.wear] || 'Uniform', desc: 'Borrowed', icon: 'wear', tag: 'Worn' });
    const n = H.bags.filter(Boolean).length; if (n && H.i >= IDX.night) out.push({ name: 'Cash bags', desc: 'The Harbour Trust\u2019s money', icon: 'cash', tag: 'Loot', n });
    return out;
  });
  // ---------------------------------------------------------------- co-op
  const OPS = new Set(['go', 'st', 'done', 'fail', 'end', 'quit', 'retry', 'rs', 'got', 'roles', 'role', 'tr', 'tdone', 'wear', 'took', 'anger', 'strike', 'table', 'lock', 'laser', 'grip', 'bag', 'drill', 'mg', 'crack', 'crackp', 'ch', 'chit', 'chshot', 'hold']);
  const int = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;
  const GOT = new Set(['grille', 'uniform', 'papers', 'cleared', 'kitkey', 'cache', 'key', 'keeper', 'hacked', 'hatch', 'gate', 'cage']);
  const adoptGot = (g) => { if (!Array.isArray(g)) return; for (const k of g) if (GOT.has(k) && !H.got[k]) setGot(k, true); };
  if (N && N.on) {
    N.on('heist', (m, from) => {
      if (!m || typeof m.op !== 'string' || !OPS.has(m.op)) return;
      const why = typeof m.why === 'string' ? m.why.slice(0, 120) : '', fromHost = from === 0;
      switch (m.op) {
        case 'go': if (host() && !H.on) start(); break;
        case 'st':
          if (!fromHost || host() || !int(m.i, 0, ST.length - 1) || !int(m.cp, 0, CPS.length - 1)) break;
          if (!H.on) { H.on = true; H.failing = false; H.got = {}; H.roles = []; H.bags = [false, false, false, false]; resetWorld(m.i); veraBlip(); sfx('jg_start'); }
          H.cp = m.cp; if (int(m.h, 0, 9)) H.tr.h = m.h; if (int(m.n, 0, 9)) H.tr.n = m.n;
          adoptGot(m.g); if (m.i !== H.i) enter(m.i, m.r === 1); break;
        case 'done': if (host() && int(m.i, 0, ST.length - 1) && !ST[m.i].hostOnly) advance(m.i); break;
        case 'fail':
          if (host()) { if (H.on && !H.failing) { doFail(why || 'The crew was made.'); send({ op: 'fail', cp: H.cp, why }); } }
          else if (fromHost && H.on && int(m.cp, 0, CPS.length - 1)) { H.cp = m.cp; doFail(why); }
          break;
        case 'end': if (fromHost && !host()) end(m.ok === 1); break;
        case 'quit': if (host() && H.on) finish(false); break;
        case 'retry': if (host() && H.on && !H.failing) { restore(H.cp); send({ op: 'rs', cp: H.cp, night: H.nightCp ? 1 : 0 }); } break;
        case 'rs': if (fromHost && !host() && H.on && int(m.cp, 0, CPS.length - 1)) { H.nightCp = m.night === 1; restore(m.cp); } break;
        case 'got': if (H.on && GOT.has(m.k)) setGot(m.k, true); break;
        case 'roles': if (fromHost && Array.isArray(m.r) && m.r.length <= 4 && m.r.every((x) => x == null || ['hack', 'infil', 'solo'].includes(x))) { H.roles = m.r.slice(); if (!host()) rolesSet(); if (is('night') || is('split')) { outfit(); scene('night'); } } break;
        case 'role': if (host() && ['hack', 'infil'].includes(m.r)) assignRole(from, m.r); break;
        case 'tr': if (fromHost && int(m.h, 0, 9) && int(m.n, 0, 9)) { H.tr.h = m.h; H.tr.n = m.n; adoptGot(m.g); if (H.got.hacked) H.nightCp = true; } break;
        case 'tdone': if (host() && (m.t === 'h' || m.t === 'n') && int(m.k, 0, 9)) trDone(m.t, m.k); break;
        case 'wear': if (typeof m.k === 'string' && m.k.length < 10) H.wears[from] = m.k || null; break;
        case 'took': if (m.k === 'waiter' || m.k === 'dealer' || /^sec[0-9]$/.test(m.k)) H.took[m.k] = true; break;
        case 'mg': if (H.on && typeof m.k === 'string' && MGF[m.k] && int(from, 0, 3)) mgMark(m.k, from, true); break;
        case 'crack': if (H.on && is('cache') && int(from, 0, 3)) { if (m.on === 1) { H.cracker = from; H.crackOn = true; if (host()) siegeStart(); } else if (H.cracker === from) H.crackOn = false; } break;
        case 'crackp': if (H.on && is('cache') && int(m.n, 0, 3) && m.n > H.crack) { H.crack = m.n; if (m.n >= CRACK_N && host()) setGot('cache'); } break;
        case 'ch': if (fromHost && !host() && Array.isArray(m.s) && m.s.length <= 8) chaseIngest(m.s); break;
        case 'chit': if (host() && int(m.k, 0, 7)) { const e = CH.list[m.k]; if (e) chaseHit(e, AF.clamp(+m.d || 20, 1, 400), m.h === 1, true); } break;
        case 'chshot': if (fromHost && AF.health && !AF.health.dead) AF.health.hurt(AF.clamp(+m.d || 6, 1, 15), 'gun'); break;
        case 'hold': if (H.on && is('sting') && (m.k === 'det' || m.k === 'pit')) holdNpc(m.k, true); break;
        case 'anger': if (is('sting')) anger(AF.clamp(+m.s || 5, 1, 9), true); break;
        case 'strike': if (is('sting')) strike(true); break;
        case 'table': HS.showNpc('celeste', false); break;
        case 'lock': if (is('night')) lockOn(true); break;
        case 'laser': if (is('night')) cutLasers(true); break;
        case 'grip': if (int(m.k, 0, 1)) grip(m.k, true); break;
        case 'bag': if (int(m.k, 0, 3) && (is('night') || is('escape'))) bag(m.k, true); break;
        case 'drill': H.drillR = m.on === 1; break;
      }
    });
    N.on('join', (p) => { if (host() && H.on && p && Number.isInteger(p.slot)) { send({ op: 'st', i: H.i, cp: H.cp, g: gotList(), h: H.tr.h, n: H.tr.n }, p.slot); if (H.roles.length) send({ op: 'roles', r: H.roles }, p.slot); } if (sheetOpen) AF.shop.refresh(); });
    N.on('left', () => { if (sheetOpen) AF.shop.refresh(); if (H.on && crewN() < NEED) { note('Your partner left the crew. You can still finish \u2014 every step has a way through alone.', 'warn'); if (H.roles.length && host()) { H.roles = ['solo']; send({ op: 'roles', r: H.roles }); } } });
    N.on('end', () => { if (sheetOpen) AF.shop.refresh(); if (H.on) { note('The crew split up. You\u2019re on your own now \u2014 finish the job, or call it off from the pause menu.', 'warn'); if (H.roles.length) H.roles = ['solo']; } });
  }
  AF.on('died', () => { if (H.on && !H.failing) fail((AF.friends.current ? AF.friends.current.name : 'Someone') + ' was knocked out.'); });
  AF.respawnAt = () => { if (!H.on) return null; const at = spotFor(CPS[H.cp].at()); return at ? { label: CPS[H.cp].label, x: at.x, y: at.y, z: at.z, yaw: at.yaw || 0 } : null; };
  if (AF.casino) AF.casino.can = () => !H.lifting && !H.dealing;
  // stealth events -> Vera on the radio. "Clean" only if it still is when she'd say it: no alarm, no reflex, nobody hunting the crew
  const quietNow = () => { if (!H.on || !S || !S.zone) return false; const z = S.zone; return !z.alarm && !S.reflex && !z.guards.some((g) => !g.down && (g.st === 'alert' || g.st === 'combat')); };
  let niceT = -99, bodyT = -99;
  AF.on('stealth', (e) => {
    if (!H.on || !e) return;
    if (e.type === 'reflex') { radio('vera.reflex', true); sfx('jg_spot'); }
    else if (e.type === 'alarm') { for (let i = RQ.length - 1; i >= 0; i--) if (RQ[i].id === 'vera.nice') RQ.splice(i, 1); }
    else if ((e.type === 'reflexOk' || (e.type === 'ko' && Math.random() < 0.35)) && AF.clock.t - niceT > 20) {
      niceT = AF.clock.t; const z = S && S.zone;
      setTimeout(() => { if (S && S.zone === z && quietNow()) radio('vera.nice', false, quietNow); }, 1400);
    }
    if (e.type === 'ko' && e.zone === 'queen' && AF.clock.t - bodyT > 40) { bodyT = AF.clock.t; setTimeout(() => radio('vera.bodies', false, () => H.on && S.zone && S.zone.id === 'queen' && S.zone.guards.some((g) => g.down && !g.hid && g.carrier < 0)), 2600); }
  });
  // the liner: a passenger hit where security can see it is violence on board (the alarm, the job fails)
  const onWalker = (a, kind, fx, fz, info) => {
    if (a && a.chase) { chaseHit(a.chase, (info && info.dmg) || 20, !!(info && info.head)); return true; }
    if (!S || !H.on) return false;
    if (S.hit(a, kind, fx, fz, info)) return true;
    const z = S.zone; if (z && z.strict && !z.alarm && H.scene === 'queen') { const w = S.witness(z, a.x, a.y, a.z); if (w) S.raiseAlarm('Security saw you attack a passenger', w); }
    return false;
  };
  if (AF.combat) AF.combat.onWalkerHit = onWalker;
  Object.assign(H.dbg, { grip, bag, setGot, lockOn, cutLasers, serve, takeTable, anger, openCams, myRole, scene, fail, CH, crackCache, chaseHit,
    setRoles: (r) => { if (!host()) return; H.roles = r.slice(); send({ op: 'roles', r: H.roles }); rolesSet(); } });

  // ---------------------------------------------------------------- quiet city while the job is on (fewer ambient draws + ticks)
  const quiet = (on) => { AF.quiet = !!on; AF.emit('quiet', !!on); };

  // ---------------------------------------------------------------- tick
  const bars = () => {
    MI.bar('heist-anger', is('sting') && H.anger > 0 ? { label: 'Prescott is ranting', value: H.anger.toFixed(1) + ' s', hot: true } : null);
    MI.bar('heist-strikes', is('sting') && H.strikes > 0 ? { label: 'Pit boss', value: H.strikes + ' / 3', hot: H.strikes > 1 } : null);
    MI.bar('heist-lock', is('night') && H.tr.n === 3 && H.lockT > 0 ? { label: 'Time lock open', value: MI.time(H.lockT), ok: true } : null);
    for (let k = 0; k < 2; k++) MI.bar('heist-k' + k, is('night') && H.tr.n === 3 ? { label: KEYN[k] + ' key', value: H.grip[k] > 0 ? 'Turned ' + Math.ceil(H.grip[k]) : 'Free', pct: H.grip[k] / GRIP, ok: H.grip[k] > 0 } : null);
    MI.bar('heist-laser', is('night') && H.tr.n === 4 && HB && HB.laserCut > 0 ? { label: 'Lasers down', value: HB.laserCut.toFixed(1) + ' s', ok: true } : null);
    const n = H.bags.filter(Boolean).length;
    MI.bar('heist-bags', H.on && H.i >= IDX.night && H.i <= IDX.stash && (n || H.tr.n >= 6) ? { label: 'Cash bags', value: n + ' / 4', ok: n === 4 } : null);
    MI.bar('heist-wave', is('fight') && H.waves ? { label: 'Moretti\u2019s men', value: 'wave ' + Math.min(H.waves, WAVES.length) + ' / ' + WAVES.length, hot: true } : null);
    MI.bar('heist-radar', RADAR.on ? { label: 'Radar lock', value: 'Fly ' + Math.round(RADAR.lo) + '\u2013' + Math.round(RADAR.hi) + ' m', pct: RADAR.k, hot: RADAR.off > 0, ok: !RADAR.off } : null);
    MI.bar('heist-crack', is('cache') && (H.siege || H.crack > 0) && !H.got.cache ? { label: 'Cache locks', value: H.crack + ' / ' + CRACK_N, pct: H.crack / CRACK_N, ok: false, hot: !!H.siege } : null);
    MI.bar('heist-chase', is('chase') && CH.list.length ? { label: 'Moretti skis', value: chaseLeft() + ' left', hot: chaseLeft() > 0 } : null);
    MI.bar('heist-hold', is('sting') && (H.detHold > 0 || H.pitHold > 0) ? { label: H.detHold > 0 ? 'Detective distracted' : 'Pit boss distracted', value: Math.ceil(Math.max(H.detHold, H.pitHold)) + ' s', ok: true } : null);
  };
  let natT = 0, laserT = 0, drillNT = 0, warnT = 0, mgT = 0;
  AF.onTick('heist', 425, (dt, tw) => {
    voiceNow();
    if (H.after) { H.afterT -= dt; if (H.afterT <= 0 && !(UI.dialogueOpen && UI.dialogueOpen())) { const f = H.after; H.after = null; f(); } }
    const mn = H.on ? '' : 'none'; if (MN.style.display !== mn) MN.style.display = mn;
    const tb = tabletOk() && crewN() < 2 ? '' : 'none'; if (TB.style.display !== tb) TB.style.display = tb;
    if (AF.quiet !== H.on) quiet(H.on);
    radarTick(dt);
    if (!H.on) { if (muCur) music(); return; }
    H.t += dt;
    const s = ST[H.i]; if (!s) return;
    if ((hudT -= dt) <= 0) { hudT = 0.16; H.hud.title = 'The Harbour Trust Job \u00b7 ' + actOf(H.i).replace(/^Act \w+ \u00b7 /, ''); H.hud.line = s.cut ? '' : wantedHold() ? '\u2605 Lose the police first \u2014 the job is on hold' : lineOf(s); bars(); music(); }
    if (!(AF.combat && AF.combat.gallery)) AF.hud.job = s.cut || AF.mode === 'cctv' ? null : H.hud;
    for (const it of FOLLOW) { const a = it._follow(); if (a && (it.can ? it.can() : true)) { it.x = a.x; it.y = a.y + 1; it.z = a.z; } else it.y = -999; }
    if (A.salonRope) A.salonRope.y1 = A.salonRope.y0 + ((is('salon') || is('sting')) && !myStingRole() ? 2.6 : 1e-6);
    // the doorman greets staff at the salon door once
    if ((is('salon') || is('sting')) && myStingRole() && !H.flag.doorSaid && near(A.salonDoor, 3.5, 3)) { H.flag.doorSaid = true; speak('door.in', HS.npc.door); }
    if (H.failing) return;
    // timers
    if (H.detHold > 0) H.detHold -= dt;
    if (H.pitHold > 0) H.pitHold -= dt;
    if (host() && (mgT -= dt) <= 0) { mgT = 0.5; mgCheck(); }
    if (host()) siegeTick(dt);
    chaseTick(dt, tw);
    if (H.anger > 0 && (H.anger -= dt) <= 0) { H.anger = 0; const n = HS.npc.prescott; if (n) n.yaw = A.prescott.yaw || 0; }
    if (is('sting') && !H.dealing && !H.drillR && (crewN() < 2 || !H.took.dealer)) { if ((natT += dt) > 24) { natT = 0; speak('dealer.hand', HS.npc.celeste); setTimeout(() => { if (is('sting')) anger(4.8, true); }, 1200); } } else natT = 0;
    if (H.lockT > 0) H.lockT -= dt;
    for (let k = 0; k < 2; k++) if (H.grip[k] > 0 && (H.grip[k] -= dt) <= 0) { H.grip[k] = 0; if (is('night') && !H.got.gate) note('The ' + KEYN[k] + ' key springs back \u2014 they have to turn together.', 'warn'); }
    // no papers, no plane: Westgate calls the police on a crew that skips the gate
    if (H.i > IDX.brief && H.i < IDX.plane && flying() && !H.flag.towerSaid) { H.flag.towerSaid = true; radio('tower.t3', true); const C = CB(); if (C) C.crime(120); note('No papers \u2014 Westgate called the police. Land and get cleared at the crew gate.', 'bad'); }
    if (is('fly') && !H.flag.leftSaid && dist(me(), A.plane) > 900) { H.flag.leftSaid = true; radio('tower.t2'); }
    if (is('fly') && !H.flag.isleSaid && dist(me(), A.strip) < 700) { H.flag.isleSaid = true; radio('vera.island'); }
    // Act IV
    if (is('night')) {
      trackTick();
      if (H.trKey !== H.tr.h + ':' + H.tr.n) { H.trKey = H.tr.h + ':' + H.tr.n; scene('night'); }
      if (AF.input.hit('KeyT') && tabletOk() && crewN() < 2) openCams(true);
      if (H.tr.n === 4 && HB && HB.touch() && (laserT -= dt) <= 0) { laserT = 3; sfx('ui_alert'); if (S) S.raiseAlarm('The laser grid tripped'); note('You broke a beam! The alarm\u2019s up.', 'bad'); }
      if (laserT > 0) laserT -= dt;
      const drilling = H.drilling || H.drillR;
      if (AF.audio) AF.audio.hold('heist-drill', 'drill_loop', drilling ? 0.9 : 0, 1, HB.spots.cage.x + 0.6, 1.4, HB.spots.cage.z);
      if (drilling && (drillNT -= dt) <= 0) { drillNT = 4; if (S) S.noiseAt(HB.spots.cage.x, 0.5, HB.spots.cage.z, 9, 'noise'); }
      if (myRole() === 'hack' && H.tr.h >= 1 && H.tr.h < 3 && AF.den && AF.den.awake && AF.den.awake() && (warnT -= dt) <= 0) { warnT = 8; radio('vera.go'); }
    }
    if (AF.audio) AF.audio.hold('heist-alarm', 'alarm_loop', (is('night') && S && S.zone && S.zone.id === 'bank' && S.zone.alarm) || (is('escape') && myRole() !== 'hack') ? 1 : 0, 1, 30, 6, -125);
    fightTick(dt);
    const R = H.roadblock;
    if (R && !R.blown && inCar() && dist(me(), R) < 55) {
      R.blown = true; radio('vera.g3', true);
      setTimeout(() => { const C = CB(); for (const c of R.cars) if (!c.dead) { AF.fx.boom(c.x, c.y + 0.5, c.z, 1); if (C) C.dmgCar(c, 999); } if (AF.camfx) AF.camfx.shake(0.04, 0.8); }, 900);
    }
    if (is('away') && !H.flag.water && dist(me(), A.keyStrip) < 2400) { H.flag.water = true; const C = CB(); if (C && C.stars) C.clearWanted('Out over open water \u2014 the police lose your trail.'); }
    if (s.cut ? cutDone() : s.done()) { if (wantedHold()) wantedNag(); else complete(); }
  });

  // ---------------------------------------------------------------- tests
  AF.test('heist: solo starts, every step + both Act IV tracks complete, checkpoints restore, keys need the time lock, guards + zones exist', () => {
    if (!H.vera || !HS || !HS.ready || !HB || !HB.ready) return { ok: false, info: 'cast/sets missing' };
    const bad = CPS.map((c, i) => { const a = c.at(); return a && [a.x, a.y, a.z].every(Number.isFinite) ? null : i; }).filter((i) => i != null);
    const role = N ? N.role : 'off', m0 = AF.money.v, mode = AF.mode, p = AF.player, keep = { x: p.x, y: p.y, z: p.z, yaw: p.yaw }, solo0 = H.solo;
    let refused = false, walked = 0, cuts = 0, keysLocked = false, keysOk = false, restored = false, hackT = 0, infT = 0;
    const nCuts = ST.filter((s) => s.cut).length;
    try {
      H.solo = false; start(); refused = !H.on && crewN() < NEED;
      H.solo = true; begin();
      for (let n = 0; n < 80 && H.on; n++) {
        if (ST[H.i].cut && cutDone()) cuts++;
        if (H.i === IDX.split && !H.roles.length) { H.roles = ['solo']; }
        if (H.i === IDX.night) {
          for (let k = 0; k < 30 && H.tr.n < INF.length; k++) {
            if (H.tr.h < HACK.length) { if (HACK[H.tr.h].id === 'hack') setGot('hacked'); trDone('h', H.tr.h); hackT++; continue; }
            if (INF[H.tr.n].id === 'keys') { grip(0, true); keysLocked = !(H.grip[0] > 0); lockOn(true); grip(0, true); grip(1, true); keysOk = !!H.got.gate;
              if (!restored) { H.nightCp = true; restore(H.cp); restored = H.i === IDX.night && H.tr.n === 0 && !!H.got.hacked; H.tr.n = 3; H.grip[0] = H.grip[1] = 0; lockOn(true); grip(0, true); grip(1, true); } }
            if (INF[H.tr.n].id === 'cash') for (let b = 0; b < 4; b++) bag(b, true);
            trDone('n', H.tr.n); infT++;
          }
        }
        walked++; advance(H.i);
      }
    } finally {
      if (H.on) end(false, true);
      H.solo = solo0; AF.money.add(m0 - AF.money.v); AF.setMode(mode === 'walk' ? 'walk' : 'aerial', keep);
    }
    const zones = ['shop', 'tunnel', 'queen', 'zoo', 'bank'].filter((z) => S && S.zones.get(z) && S.zones.get(z).guards.length);
    return { ok: refused && !bad.length && walked === ST.length && cuts === nCuts && keysLocked && keysOk && restored && hackT >= 4 && infT >= INF.length && zones.length === 5 && !H.on && role === (N ? N.role : 'off'),
      info: `refused solo ${refused}, ${ST.length} steps walked ${walked}, cutscenes ${cuts}/${nCuts}, bad checkpoints ${bad.join(',') || 'none'}, keys locked ${keysLocked} ok ${keysOk}, night restore ${restored}, tracks h${hackT} n${infT}, zones ${zones.join('/')}` };
  });
}
} catch (e) { AF.partError('81-heist.js', e); }
