// ================================================================ 81-heist.js
try {
// ===== 81-heist: THE HARBOUR TRUST JOB — a co-op story mission for a crew of two to four, across the whole map  (OWNER: game) =====
// Vera Lark (the Blue Heron) plans it; Kit Morrow, a Harbour Trust clerk hiding on Serena Isle, holds one vault key; Mr Prescott (the
// bank's manager, a gambler on the Solace Queen) carries the second; Silas Crane runs the Queen's casino and Corsair Key; the Moretti
// family wants it all. The whole crew plays every step together (no role split); the Kestrel tablet (T) is everyone's after the hack.
//   0   The pitch: Vera drives the crew out to her desert depot (cutscene) -> the map room -> the briefing (cutscene): who's who, the plan
//   I   Papers (night): pick the night grille at Kovac's tailor, sneak past the watchmen, pilot uniforms off the rail -> pilot licences
//       from Ezra Quill (stamp minigame) -> the Westgate crew gate -> a plane -> 3 km south to Serena Isle
//   II  Serena Isle: Kit (cutscene) -> follow Kit to the hotel's back room, a bookcase door, the secret passage under the island -> the
//       Moretti smugglers' tunnel (stealth) -> the arms cache (lockpick): silenced pistols + a drill -> the sea cave -> Moretti's men in the
//       cove -> jet skis 1.5 km to the Solace Queen
//   III The Queen (evening): knock out a waiter + a dealer for their uniforms -> the salon -> the sting: the dealer deals Prescott a
//       rotten hand while the waiter serves his drink and lifts the key -> Silas (cutscene) -> his launch runs the crew ashore
//   IV  Midnight. Seekers first: a car east to the army stash on the Ochre Flats (cutscene), sneak in, drive a car up to the crate ->
//       west to the drop outside Southfield Farm (cutscene) -> on foot into Moretti's yard, into the armoured car: the yard opens fire and
//       a dozen limousines, roadblocks and then helicopters come after it (back doors open, mounted LMGs; no police) -> the last helicopter
//       down -> Dusty's Respray on the desert road (cutscene) -> park it on Charter Street (cutscene). Then the roof watch: up City Hall's
//       service ladder with a silenced sniper rifle, four guards on the bank's podium roof (a patrol finding a body ends it) -> a plane
//       from Westgate, a skydive onto the zoo's Great Banyan, snipe the paths from the treehouse, Kestrel's guards to the lion house, the
//       den, the bunker, the Kestrel terminal -> the drain stair to Westgate -> a plane, a skydive onto the bank's steel sky deck -> the
//       guards the rifle couldn't see, the stair down to the roof door (tablet) -> the back offices + hall past guards and cameras, keys
//       under a time-lock override, the laser grid, the drill, four bags. Seen at the zoo or on the roof: five stars.
//   V   Getaway: the fire exit -> the armoured car -> strike jets on the crew's tail: the seeker launcher + bazooka from the boot bring
//       them down (the car soaks the cannon and missiles) -> the police + a roadblock -> Westgate -> 3 km to Corsair Key
// Checkpoints: a retry restores the guns everyone held when the checkpoint was reached (H.cpGuns; bought guns are saved anyway).
//   VI  Corsair Key: the hangar -> the betrayal (cutscene) -> an all-out gunfight with Silas's own LMG -> the finale (cutscene)
// No teleports: every move is the player's own, a cutscene, or a retry from a checkpoint. A crew of two is needed to start (or the
// solo flag); every two-person moment has a solo way through. The host owns the step index and the checkpoint ('heist' {op:'st'});
// each client checks its own player and reports 'done'.
{
  const PI = Math.PI, VV = AF.vehicles, N = AF.net, UI = AF.ui, MI = AF.mission, S = AF.stealth, HB = AF.heistBank, HS = AF.heistSets;
  const CB = () => AF.combat, LN = () => AF.liner;
  const A = HS ? HS.at : {};
  const sfx = (id, o) => { if (AF.audio) AF.audio.play(id, o); };
  const note = (text, kind = 'mission') => AF.emit('toast', { text, kind });
  // where this player really is: the plane / car / seat they're in (the avatar mesh isn't moved while piloting a plane)
  const me = () => {
    const m = AF.mode;
    if (m === 'fly' && AF.planes && AF.planes.cur) return AF.planes.cur;
    if (m === 'drive' && VV && VV.player) return VV.player;
    if (m === 'passenger') { const v = rideVeh(); if (v) return v; }
    return m === 'walk' || m === 'cutscene' || m === 'cctv' || !AF.player.mesh ? AF.player : AF.player.mesh.position;
  };
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
  // the lion house's old hatch only works on the night's den steps (it stays shut otherwise)
  if (AF.den) AF.den.hatchInteract = () => is('den') || is('bunker');
  // Westgate's crew gate (47): while the job is on, it opens for the crew once the gate guard has cleared their papers
  if (AF.airside) { const prev = AF.airside.ok; AF.airside.ok = () => (H.on ? !!H.got.cleared : prev()); }
  const LOOKS = (HS && HS.looks) || {};
  { const prev = UI.lookOf; UI.lookOf = (name) => LOOKS[String(name).split(' ')[0].toLowerCase()] || (prev ? prev(name) : null); }

  // ---------------------------------------------------------------- voices: ONE story line at a time
  // NPC lines spoken in place and Vera's radio calls share a single queue, so nobody ever talks over anybody: a speaker's next line
  // waits for the last, and a radio call waits for whoever is talking in the room plus a beat (Vera phones in after the scene, never
  // over it). In-person lines go ahead of queued radio calls (an urgent call goes first); a cutscene holds the queue (it plays its own
  // lines); an in-person line that waited too long (the moment has passed) is dropped. Guard barks (80-stealth) are not story lines.
  // lines that waited too long or whose step has passed are dropped (they would describe something already done).
  const VO = (id) => (AF.voLine ? AF.voLine(id) : null);
  const RQ = []; let talkEnd = -1e9, personEnd = -1e9, cutT = -1e9;
  const SAY_GAP = 0.3, RADIO_GAP = 1.2, STALE = 12, RADIO_STALE = 40, URGENT_STALE = 10, CUT_GAP = 1.0;
  const queue = (q) => {
    if (RQ.some((o) => o.id === q.id)) return;
    q.step = H.i;
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
    if (MI.cut.on) { cutT = now; return; }
    if (!RQ.length || now < talkEnd || now < cutT + CUT_GAP) return;
    if (!RQ[0].who && now < personEnd + RADIO_GAP) return;
    const q = RQ.shift(), L = VO(q.id); if (!L) return;
    // a conditional line is checked when it would play, not when it was queued (Vera never says "clean" after the alarm went up)
    if (q.when && !q.when()) return;
    // the moment has passed: two steps on, or waiting far too long
    if (H.on && q.step >= 0 && H.i - q.step > 1) return;
    if (!q.who && now - q.t > (q.urgent ? URGENT_STALE : RADIO_STALE)) return;
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
  const hushVoices = () => { RQ.length = 0; talkEnd = personEnd = -1e9; if (AF.audio && AF.audio.stopVoice) AF.audio.stopVoice(); };
  const talking = () => RQ.length > 0 || AF.clock.t < talkEnd;
  H.radio = radio; H.speak = speak;

  // ---------------------------------------------------------------- places + checks
  const SC = { x: 0, y: 0, z: 0 }, V3 = new THREE.Vector3();
  const isPlane = (v) => !!v && !!AF.planes && AF.planes.list.includes(v);
  const rideVeh = () => (AF.mode === 'passenger' && AF.coop && AF.coop.ride ? AF.coop.ride.veh : null);
  const flying = () => AF.mode === 'fly' || isPlane(rideVeh());
  const inCar = () => AF.mode === 'drive' || (AF.mode === 'passenger' && !!rideVeh() && !isPlane(rideVeh()));
  // the vehicle I sit in (driving or riding along), planes excluded; the heist's armoured car is H.car (every client spawns its own copy
  // at the same spot, so co-op matches them by netKey) — sitting in some other car never counts as being in it
  const curCar = () => { const v = AF.mode === 'drive' ? VV.player : rideVeh(); return v && !isPlane(v) ? v : null; };
  const anyCar = () => !!curCar();
  const inHeistCar = () => { const v = curCar(); return !!v && (v === H.car || !!v.armor || !!(v.type && v.type.id === 'armored')); };
  const landed = () => { const pl = AF.mode === 'fly' && AF.planes.cur; return !!pl && pl.onGround && Math.abs(pl.v) < 8; };
  const near = (p, r, dy = 2.6) => { const q = AF.player; return AF.mode === 'walk' && !!p && Math.hypot(q.x - p.x, q.z - p.z) < r && Math.abs(q.y - (p.y ?? q.y)) < dy; };
  const inEll = (E) => { const p = me(); return !!E && ((p.x - E.cx) / E.rx) ** 2 + ((p.z - E.cz) / E.rz) ** 2 < 1.1; };
  const onIsland = () => inEll(AF.PLAN.world.island);
  const onKey = () => inEll(AF.PLAN.world.key);
  const onQueen = () => AF.mode === 'walk' && !!LN() && LN().where(AF.player.x, AF.player.y, AF.player.z) !== '';
  const inStair = () => { const p = AF.player; return AF.mode === 'walk' && p.x > 44.7 && p.x < 49.3 && p.z > -112.8 && p.z < -105.2 && p.y < 13.9; };
  const inBank = () => { const p = AF.player; return AF.mode === 'walk' && p.x > 10.5 && p.x < 49.6 && p.z > -137.5 && p.z < -105 && p.y < 13.9; };
  const inVaultFar = () => { const p = AF.player; return AF.mode === 'walk' && p.x > 47.35 && p.x < 49.4 && p.z > -132 && p.z < -118 && p.y < 4; };
  // City Hall's roof (the sniper's vantage across Grand Avenue), the bank's outdoor levels (podium roof, sky deck, ring, terrace, stair)
  const onCityRoof = () => { const p = AF.player; return AF.mode === 'walk' && p.y > 18.5 && p.x > -40 && p.x < -15 && p.z > -136 && p.z < -96; };
  const onBankTop = () => { const p = AF.player; return AF.mode === 'walk' && p.y > 13.5 && p.x > 9 && p.x < 51 && p.z > -148 && p.z < -103; };
  // a jump counts once the player came down by parachute (skydive -> walk) inside r of the target
  const jumpedTo = (at, r) => !!H.flag.chuted && AF.mode === 'walk' && !!at && dist(AF.player, at) < r;
  const vantageLeft = () => (HB && HB.roofGuards ? HB.roofGuards(true).filter((g) => !g.down).length : 0);
  const roofLeft = () => (HB && HB.roofGuards ? HB.roofGuards(false).filter((g) => !g.down).length : 0);
  const zooSnipeLeft = () => (HS.zooG || []).filter((g) => g.vantage && !g.down).length;
  // ---- sniper shifts (the roof watch, the zoo paths): a shift's guards walk out once the last shift is down and someone in the crew
  // stands on the next perch; the host moves the shift on ('lv'), the guards' deaths reach everyone through 80-stealth's 'gs'
  const SN = { zoo: 1, roof: 1, said: {} };
  const LV = {
    zoo: { step: 'zoosnipe', pre: 'zoojump', spots: () => [A.lookout, A.figSpot, A.deckSpot], guards: () => (HS.zooG || []).filter((g) => g.level > 0), shows: () => H.scene === 'zoo', near: 3.5,
      where: ['the {treehouse lookout} up the spiral stair', 'the {Fig\u2019s deck} across the rope bridge', 'the {big deck\u2019s south side}'], who: 'Kestrel guards' },
    roof: { step: 'snipe', pre: 'vantage', spots: () => [HB.spots.vantage, HB.spots.vantage2, HB.spots.vantage3], guards: () => (HB && HB.roofGuards ? HB.roofGuards(true) : []), shows: () => !!(HB && HB.roofOn), near: 5,
      where: ['the {middle of City Hall\u2019s roof edge}', 'the {south corner} of City Hall\u2019s roof', 'the {north end} of City Hall\u2019s roof'], who: 'roof watch' },
  };
  const lvMax = (k) => { let m = 1; for (const g of LV[k].guards()) if (g.level > m) m = g.level; return m; };
  const lvLeft = (k) => { let c = 0; for (const g of LV[k].guards()) if (g.level === SN[k] && !g.down) c++; return c; };
  const lvWait = (k) => lvLeft(k) === 0 && SN[k] < lvMax(k);
  const lvSpot = (k) => LV[k].spots()[lvWait(k) ? SN[k] : SN[k] - 1];
  const onPerch = (p, s, r) => !!p && !!s && Math.hypot(p.x - s.x, p.z - s.z) < r && Math.abs(p.y - s.y) < 2.5;
  const atPerch = (k) => AF.mode === 'walk' && onPerch(AF.player, LV[k].spots()[SN[k] - 1], LV[k].near + 4);
  const crewOn = (s, r) => {
    if (AF.mode === 'walk' && onPerch(AF.player, s, r)) return true;
    if (online() && AF.coop && AF.coop.players) for (const q of AF.coop.players.values()) if (q && q.seen && !q.dead && onPerch(q, s, r)) return true;
    return false;
  };
  const snipeTag = (k) => (lvWait(k) ? 'Move' : 'Shift ' + SN[k] + '/' + lvMax(k) + ' \u00b7 ' + lvLeft(k));
  const snipeLine = (k) => {
    const L = LV[k], n = SN[k], m = lvMax(k);
    if (lvWait(k)) return 'Shift ' + n + ' is down \u2014 move to ' + L.where[n] + ' for the next one';
    if (!atPerch(k)) return 'Get to ' + L.where[n - 1] + ' \u2014 shift ' + n + ' of ' + m + ' is only in sight from there';
    return 'Take out every one of the {' + L.who + '} \u2014 shift ' + n + ' of ' + m + ', ' + lvLeft(k) + ' left' + (k === 'roof' ? ' (if a patrol finds a body, it\u2019s over)' : '');
  };
  const snipeMark = (k) => (lvWait(k) || !atPerch(k) ? lvSpot(k) : nextGuard(LV[k].guards().filter((g) => g.level === SN[k])));
  const lvSet = (k, n, remote) => {
    if (!LV[k] || n === SN[k]) return; SN[k] = n; if (!remote) send({ op: 'lv', k, n });
    sfx('ui_alert'); note('Shift ' + n + ' is walking out \u2014 they\u2019re only in sight from where you are now.', 'warn');
  };
  const lvTick = () => {
    for (const k in LV) {
      const L = LV[k], gate = H.on && (is(L.step) || is(L.pre)), show = L.shows();
      for (const g of L.guards()) {
        const off = gate && g.level > SN[k], p = g.path; g.off = off; if (!p) continue;
        if (off) { if (p.enabled) p.enabled = false; } else if (show && !p.enabled) p.enabled = true;
      }
      if (!is(L.step) || H.failing || lvLeft(k) > 0 || SN[k] >= lvMax(k)) continue;
      const key = k + SN[k]; if (!SN.said[key]) { SN.said[key] = true; radio(SN[k] + 1 >= lvMax(k) ? 'vera.lv3' : 'vera.lv2', true); }
      if (host() && crewOn(L.spots()[SN[k]], L.near)) lvSet(k, SN[k] + 1);
    }
  };
  const nextGuard = (list) => { let best = null, bd = 1e9; const p = me(); for (const g of list) if (g && !g.down && g.a) { const d = dist(p, g.a); if (d < bd) { bd = d; best = g.a; } } if (!best) return null; SC.x = best.x; SC.y = best.y; SC.z = best.z; return SC; };
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
    if (AF.mode === 'drive' && VV && VV.exitCar) VV.exitCar();
    if (AF.audio && AF.audio.voicePreload) AF.audio.voicePreload(c.shots.map((sh) => sh.vo).filter(Boolean));
    hushVoices();
    if (!MI.cut.play(c)) fin(); else H.cutOn = true;
  };
  const cutDone = () => H.flag.cut || (H.cutOn && !MI.cut.on && (crewN() < 2 || H.t > 40));
  const shot = (cam, look, vo, d = 3.2, x) => Object.assign({ cam, look, vo, d }, x);
  // ---- the pitch: Vera drives the crew out to her desert depot (AF.hideout, 44-hideout): her car glides along the road in the cutscene
  // (DRV, stepped by the heist tick), then the crew is set down at the depot door and walks into the map room for the briefing
  const HO = () => (AF.hideout && AF.hideout.door && AF.hideout.table ? AF.hideout : null);
  const DRV = { pts: null, t: 0, d: 1, on: false };
  const driveTick = (dt) => {
    const c = H.vcar; if (!DRV.on || !c || !DRV.pts) return;
    DRV.t = Math.min(DRV.d, DRV.t + dt);
    const P = DRV.pts, n = P.length - 1, u = DRV.t / DRV.d * n, i = Math.min(n - 1, Math.floor(u)), k = u - i, a = P[i], b = P[i + 1];
    c.x = a[0] + (b[0] - a[0]) * k; c.y = a[1] + (b[1] - a[1]) * k; c.z = a[2] + (b[2] - a[2]) * k; c.yaw = Math.atan2(b[0] - a[0], b[2] - a[2]);
    if (c.placeMesh) c.placeMesh();
  };
  const veraCar = (x, y, z, yaw) => {
    if (!VV || !VV.makeCar) return null;
    if (!H.vcar || H.vcar.dead) { try { const car = VV.makeCar('duesy', 2, x, z, yaw, { y }); car.temp = false; car.parked = true; car.mission = true; H.vcar = car; } catch (e) { AF.warnOnce('heist vera car', e); return null; } }
    const c = H.vcar; c.x = x; c.y = y; c.z = z; c.yaw = yaw; c.v = 0; if (c.placeMesh) c.placeMesh(); return c;
  };
  // Vera stands at the depot's map table while the job is on (at the Blue Heron otherwise)
  const veraTo = (p) => { const n = H.vera; if (!n || !p) return; n.x = p.x; n.y = p.y; n.z = p.z; n.yaw = n.yaw0 = p.yaw || 0; n.root.position.set(p.x, p.y, p.z); n.root.rotation.y = n.yaw; if (n.interact) { n.interact.x = p.x; n.interact.y = p.y + 1; n.interact.z = p.z; } };
  const arriveDepot = () => {
    const ho = HO(); DRV.on = false; if (AF.stream) AF.stream.focus = null; if (!ho) return;
    veraTo(ho.vera); veraCar(ho.park.x, ho.park.y, ho.park.z, ho.park.yaw || 0);
    if (!H.on || AF.mode === 'dead') return;
    const s = spotFor(ho.door); if (AF.stream && AF.stream.travel && dist(me(), s) > 120) AF.stream.travel({ label: ho.name || 'the depot', go: () => place(s) }); else place(s);
  };
  const depotSet = () => { const ho = HO(); if (!ho) return; veraTo(ho.vera); const c = H.vcar; if (!c || c.dead || (!c.player && c.net == null && dist(c, ho.park) > 40)) veraCar(ho.park.x, ho.park.y, ho.park.z, ho.park.yaw || 0); };
  const cutDrive = () => cutscene(A.vera, (at) => {
    const v = at, f = A.veraYaw, ho = HO(), K = A.veraKerb, shots = [
      shot(rel(v, f, 1.1, 4.2, 1.65), rel(v, f, 1.1, 0, 1.4), 'vera.b1', 4, { cam2: rel(v, f, 1.1, 3.6, 1.6), act: () => { if (ho && AF.stream) AF.stream.focus = { x: ho.at.x, z: ho.at.z }; if (K) veraCar(K.x, K.y, K.z, K.yaw); } }),
    ];
    if (K) {
      const sx = Math.sin(K.yaw), cz = Math.cos(K.yaw), end = [K.x + sx * 34, K.y, K.z + cz * 34];
      shots.push(shot([K.x - sx * 8 + cz * 3.5, K.y + 1.8, K.z - cz * 8 - sx * 3.5], [K.x, K.y + 0.9, K.z], 'vera.d1', 5.5, { look2: [end[0], K.y + 0.9, end[2]], cam2: [K.x - sx * 2 + cz * 3.5, K.y + 2.4, K.z - cz * 2 - sx * 3.5], act: () => { veraCar(K.x, K.y, K.z, K.yaw); DRV.pts = [[K.x, K.y, K.z], end]; DRV.t = 0; DRV.d = 5.5; DRV.on = true; } }));
    }
    if (ho && ho.drive && ho.drive.length > 1) {
      const pts = ho.drive.concat([[ho.park.x, ho.park.y, ho.park.z]]), p0 = pts[0], road = (ho.shots || []).find((s) => s.name === 'road');
      const cam = road ? road.cam : [p0[0] + 14, p0[1] + 6, p0[2] + 14], look = road ? road.look : [ho.road.x, ho.road.y + 1, ho.road.z];
      shots.push(shot(cam, [p0[0], p0[1] + 1, p0[2]], 'vera.d2', 7, { look2: [ho.park.x, ho.park.y + 1, ho.park.z], act: () => { veraCar(p0[0], p0[1], p0[2], ho.roadYaw || 0); DRV.pts = pts; DRV.t = 0; DRV.d = 7; DRV.on = true; } }));
    }
    if (ho) {
      const ext = (ho.shots || []).find((s) => /ext|establish|outside/i.test(s.name)) || { cam: [ho.door.x + 14, ho.door.y + 6, ho.door.z + 14], look: [ho.at.x, ho.at.y + 2, ho.at.z] };
      shots.push(shot(ext.cam, ext.look, 'vera.d3', 5, { act: () => { DRV.on = false; veraCar(ho.park.x, ho.park.y, ho.park.z, ho.park.yaw || 0); veraTo(ho.vera); } }));
    }
    return { title: 'The Harbour Trust Job', sub: 'A long drive', shots };
  }, { always: true, after: arriveDepot });
  // the briefing in the map room: the bank, who's who (the board), the islands, the gate and the shop on the table map
  const cutBrief = () => {
    const ho = HO(); if (!ho) return cutHeron();
    return cutscene(ho.table, () => {
      const t = ho.table, vv = ho.vera, b = ho.board || t, pin = (k) => (ho.pins && ho.pins[k]) || t, by = b.yaw || 0, bx = Math.sin(by), bz = Math.cos(by);
      const veraShot = (vo, d = 4) => shot(rel(vv, vv.yaw || 0, 1.7, 0.6, 1.62), head(vv), vo, d);
      const pinShot = (k, vo, d = 4) => { const p = pin(k); return shot([p.x + 0.9, p.y + 1.4, p.z + 1.3], [p.x, p.y, p.z], vo, d, { cam2: [p.x + 0.6, p.y + 0.9, p.z + 0.85] }); };
      // the photo board: a slow slide along it (photos left to right: Kit, Prescott, Silas, Moretti)
      const photo = (k) => ho.photos && ho.photos[k];
      const photoShot = (k, u, vo, d = 4.5) => { const q = photo(k); if (!q) return boardShot(u, vo, d); return shot([q.x + bx * 1.25 - bz * 0.15, q.y + 0.1, q.z + bz * 1.25 + bx * 0.15], [q.x, q.y, q.z], vo, d, { cam2: [q.x + bx * 0.95, q.y + 0.05, q.z + bz * 0.95] }); };
      const boardShot = (u, vo, d = 4.5) => shot([b.x + bx * 1.9 - bz * u, b.y + 0.2, b.z + bz * 1.9 + bx * u], [b.x - bz * u, b.y, b.z + bx * u], vo, d, { cam2: [b.x + bx * 1.5 - bz * (u + 0.25), b.y + 0.15, b.z + bz * 1.5 + bx * (u + 0.25)] });
      return { title: ho.name || 'The depot', sub: 'The briefing', shots: [
        veraShot('vera.b2', 4.5), photoShot('kit', -0.9, 'vera.w1'), pinShot('island', 'vera.b3'), photoShot('prescott', -0.3, 'vera.w2'), photoShot('silas', 0.3, 'vera.w3'),
        photoShot('tony', 0.9, 'vera.w4'), pinShot('zoo', 'vera.w5'), pinShot('westgate', 'vera.b4'), pinShot('kovac', 'vera.b5'), veraShot('vera.w6', 4.5),
      ] };
    }, { always: true });
  };
  // fallback (no depot built): the old briefing outside the Blue Heron
  const cutHeron = () => cutscene(A.vera, (at) => {
    const v = at, f = A.veraYaw;
    return { title: 'The Harbour Trust Job', sub: 'Act I \u00b7 Papers', shots: [
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
  // ---- Act IV: the army stash, the farm, the respray, midnight on Charter Street
  const cutArmy = () => cutscene(A.army || me(), (at) => {
    const a = at, c = A.armyCrate || a, g = A.armyGate || a;
    return { title: 'The Ochre Flats', sub: 'Act IV \u00b7 The army stash', shots: [
      shot([a.x - 42, a.y + 18, a.z + 58], [a.x, a.y + 2, a.z], 'vera.army2', 5.5, { cam2: [a.x - 26, a.y + 12, a.z + 42] }),
      shot([c.x + 4.5, c.y + 2.2, c.z + 5], [c.x, c.y + 0.7, c.z], 'vera.army3', 5, { cam2: [c.x + 3, c.y + 1.6, c.z + 3.6] }),
      shot([g.x + 7, g.y + 1.8, g.z + 2], [a.x, a.y + 1.4, a.z + 8], null, 3, { cam2: [g.x + 4, g.y + 1.7, g.z - 2] }),
    ] };
  }, { always: true });
  const cutFarm = () => cutscene(A.farmDrop || A.farm, (at) => {
    const d = at, f = A.farm || at, car = A.armor || f;
    return { title: 'Southfield Farm', sub: 'Act IV \u00b7 Moretti\u2019s armoured car', shots: [
      shot([d.x - 3, d.y + 2.2, d.z + 4], [f.x, f.y + 2, f.z + 10], 'vera.army5', 4.5, { act: () => { if (HS.props.dropCrate) HS.props.dropCrate.visible = true; } }),
      shot(rel(car, car.yaw || 0, 6.5, 4.5, 2.2), [car.x, car.y + 1.2, car.z], 'vera.farm2', 5, { cam2: rel(car, car.yaw || 0, 5, 3.4, 1.8) }),
      shot([f.x + 9, f.y + 1.7, f.z + 34], [f.x + 6, f.y + 1.3, f.z + 14], 'vera.farm5', 5),
    ] };
  }, { always: true });
  const cutGarage = () => cutscene(A.garage || me(), (at) => {
    const g = at, out = A.garageDoor || g;
    const turn = () => { const c = H.car; if (!c || c.dead || c.net != null || !inGarage(c)) return; c.yaw += PI; c.x = g.x; c.z = g.z; c.v = c.vx = c.vz = 0; VV.placeMesh(c); };
    return { title: 'Dusty\u2019s Respray', sub: 'Act IV \u00b7 New paint', shots: [
      shot([g.x - 9, g.y + 5, g.z - 24], [g.x, g.y + 2, g.z - 5], null, 3, { cam2: [g.x - 6, g.y + 4, g.z - 18], act: () => sfx('latch') }),
      shot([g.x + 2.8, g.y + 2.9, g.z + 6], [g.x, g.y + 1, g.z], 'vera.garage2', 6, { cam2: [g.x - 2.6, g.y + 2.4, g.z + 5.4], act: () => { if (AF.fx) for (let k = 0; k < 3; k++) AF.fx.burst('steam', g.x + (k - 1) * 1.2, g.y + 1.4, g.z, 8, { spread: 2.5 }); } }),
      shot([out.x + 6, out.y + 2.2, out.z - 3], [g.x, g.y + 1.2, g.z], 'vera.paint2', 5.5, { act: turn }),
    ] };
  }, { always: true });
  const cutNight = () => cutscene(HB && HB.spots && HB.spots.ladder ? HB.spots.ladder : me(), () => {
    const L = HB && HB.spots && HB.spots.ladder ? HB.spots.ladder : { x: -20, y: 0.5, z: -110 };
    return { title: 'Midnight', sub: 'Act IV \u00b7 The roof watch', shots: [
      shot([-62, 30, -58], [30, 40, -125], 'vera.n1', 7.5, { cam2: [-44, 36, -80] }),
      shot([L.x + 4, (L.y || 0.5) + 2.5, L.z + 4], [L.x, (L.y || 0.5) + 6, L.z], null, 3),
    ] };
  }, { always: true });

  // ---------------------------------------------------------------- the story, step by step
  // cp: reaching this step saves checkpoint cp · cut: a cutscene step · tag: the marker's label · mark(): the objective position ·
  // mu: the music · hostOnly: only the host decides it's done · time: hours to hold (host sets)
  const ST = [
    { id: 'drive', line: 'Vera\u2019s car', cut: () => cutDrive(), vo: ['vera.b1', 'vera.d1', 'vera.d2', 'vera.d3'], mu: 'mu_brief', time: 22.6 },
    { id: 'maproom', cp: 0, act: 'Prologue \u00b7 The pitch', tag: 'Map room', line: () => 'Follow Vera into the {map room}' + (HO() && HO().name ? ' at ' + HO().name : ''), mark: () => (HO() ? HO().table : null),
      enter: () => { scene('none'); depotSet(); }, done: () => !HO() || near(HO().table, 3.8, 2.6), mu: 'mu_brief', time: 22.7 },
    { id: 'brief', cp: 1, line: 'Vera\u2019s briefing', cut: () => cutBrief(), enter: () => depotSet(), vo: ['vera.b2', 'vera.w1', 'vera.b3', 'vera.w2', 'vera.w3', 'vera.w4', 'vera.w5', 'vera.b4', 'vera.b5', 'vera.w6'], mu: 'mu_brief', time: 22.75 },
    { id: 'uniform', act: 'Act I \u00b7 Papers', tag: () => (H.got.uniform ? 'Out' : H.got.grille ? 'Rail' : 'Grille'), line: () => uniformLine(),
      mark: () => (H.got.uniform ? A.shopDoor : H.got.grille ? A.rail : A.grille || A.shopDoor), enter: (r) => { scene('shop'); if (!r) radio('vera.shop'); }, done: () => !!H.got.uniform && !inShop(), mu: 'mu_stealth', time: 23.25 },

    { id: 'forger', cp: 2, tag: 'Ezra', line: () => (mgDone('papers') ? 'Ezra is forging the rest of the crew\u2019s licences' + mgTag('papers') : 'Get your pilot papers from {Ezra Quill} in the back of Harbour Stationers' + mgTag('papers')), mark: () => A.ezra, enter: (r) => { scene('ezra'); if (!r) radio('vera.shop2'); }, done: () => !!H.got.papers, mu: 'mu_plan' },

    { id: 'gate', tag: 'Crew gate', line: 'Show your papers at the {Westgate crew gate}', mark: () => A.gate, enter: (r) => { scene('gate'); if (!r) radio('vera.ezra'); }, done: () => !!H.got.cleared, mu: 'mu_plan' },

    { id: 'plane', tag: 'Plane', line: 'Take a {plane} from the apron \u2014 one flies, the others ride along', mark: () => planeAt(), enter: () => { resetPlanes(); }, done: () => flying(), mu: 'mu_plan' },

    { id: 'fly', tag: 'Serena Isle', line: () => (RADAR.on ? 'Fly under the coast radar \u2014 hold the {green band} \u2014 to {Serena Isle}' : 'Fly 3 km south to {Serena Isle} and land on the airstrip'), mark: () => A.strip, enter: (r) => { if (!r) { radio('tower.t1'); radio('vera.plane'); } }, done: () => onIsland() && (AF.mode === 'walk' || landed()), mu: 'mu_island' },

    { id: 'kit', cp: 3, act: 'Act II \u00b7 Serena Isle', tag: 'Kit', line: 'Meet {Kit Morrow} on the terrace of Hotel Serena', mark: () => A.kit, enter: (r) => { scene('kit'); if (!r) radio('vera.kit'); }, done: () => near(A.kit, 5, 4), mu: 'mu_island', time: 23.4 },

    { id: 'kitcut', line: 'Kit Morrow', cut: () => cutKit(), enter: () => scene('kit'), mu: 'mu_island' },

    { id: 'follow', tag: 'Kit', line: () => (kitThere() ? 'Catch up with {Kit} in the back room' : 'Follow {Kit} \u2014 he\u2019s taking you somewhere quiet'), mark: () => kitMark(), enter: (r) => { scene('kit'); H.got.kitkey = true; kitLead(r); }, done: () => !SEC() || (kitThere() && nearKit(4.5)), mu: 'mu_island' },
    { id: 'secret', tag: 'Bookcase', line: 'Through the {bookcase door} and down the stairs', mark: () => (SEC() ? SEC().stairTop : A.tunnelEntry), enter: (r) => secretOpen(r), done: () => !SEC() || inPassage(), mu: 'mu_tension' },
    { id: 'passage', tag: 'Tunnel', line: 'Follow the secret passage under the island \u2014 it breaks into {the Morettis\u2019 tunnel}', mark: () => passMark(), enter: () => { const s = SEC(); if (s && s.open) s.open(true); scene('tunnel'); }, done: () => !SEC() || near(SEC().exit, 7, 6) || inTube() || near(A.tunnelEntry, 9, 6), mu: 'mu_tension' },
    { id: 'tunnel', tag: 'Tunnel', line: 'You\u2019re in the {smugglers\u2019 tunnel} \u2014 stay low, the Morettis patrol it', mark: () => A.tunnelEntry, enter: () => { scene('tunnel'); H.got.kitkey = true; }, done: () => inTube() || near(A.tunnelEntry, 6, 6), mu: 'mu_tension' },
    { id: 'cache', cp: 4, tag: 'Cache', line: () => (H.got.cache ? 'The cache is open' : H.siege ? (H.crackOn && H.cracker !== mySlot() ? 'Hold them off while your crew cracks the {arms cache} \u2014 grab a loud gun off the {rack}' : 'Crack the {arms cache} \u2014 lock ' + Math.min(CRACK_N, H.crack + 1) + ' of ' + CRACK_N + (crewN() > 1 ? ', your crew covers you' : '')) : 'Sneak through the {stash maze} to the arms cache \u2014 stay low and out of sight'),
      mark: () => A.cache, enter: (r) => { scene('tunnel'); if (!r) { radio('vera.tunnel'); radio('vera.maze'); radio('vera.tough'); } }, done: () => !!H.got.cache, mu: 'mu_tension' },

    { id: 'cave', tag: 'Sea cave', line: 'Slip out through the {sea cave}', mark: () => A.caveExit, enter: (r) => { scene('tunnel'); if (!r) radio('vera.gear'); }, done: () => near(A.caveExit, 7, 6) || near(A.cove, 10, 6), mu: 'mu_tension' },

    { id: 'ambush', tag: 'Jet skis', line: 'Moretti\u2019s men! Fight your way to {the jet skis}', mark: () => nearestSki(), enter: (r) => ambush(r), done: () => ambushOver(), mu: 'mu_action' },

    { id: 'chase', tag: 'Chasers', line: () => 'Moretti\u2019s men are after you on jet skis \u2014 ride and shoot (aim + fire from the saddle), take them all down' + (CH.list.length ? ' (' + chaseLeft() + ' left)' : ''), mark: () => chaseMark(),
      enter: (r) => { const C = CB(); if (C) C.clearGoons(); scene('sea'); if (host()) chaseStart(); if (!r) { radio('tony.chase', true); radio('vera.chase'); } }, done: () => chaseOver(), mu: 'mu_chase', hostOnly: true },

    { id: 'ski', tag: 'Solace Queen', line: 'Ride 1.5 km to the {Solace Queen} \u2014 her pontoon is on the port side', mark: () => A.pontoon,
      enter: (r) => { const C = CB(); if (C) C.clearGoons(); if (!r) { radio('vera.ski'); radio('vera.ski2'); } }, done: () => onQueen() || near(A.pontoon, 8), mu: 'mu_island' },

    { id: 'uniforms', cp: 5, act: 'Act III \u00b7 The Queen', tag: 'Staff', line: () => uniformsLine(),
      mark: () => (myStingRole() ? null : !H.took.waiter ? A.pantry : crewN() > 1 && !H.took.dealer ? A.crewLounge : secMark()), enter: (r) => { scene('queen'); holster(); if (!r) { radio('vera.q1'); radio(crewN() > 1 ? 'vera.q2' : 'vera.qsolo'); if (crewN() > 2) radio('vera.q2b'); radio('vera.qsec'); } },
      done: () => allUniformed(), mu: 'mu_casino', time: 23.6 },

    { id: 'lace', tag: () => (myStingRole() === 'waiter' ? (H.laced ? 'Detective' : 'Bar') : 'Wait'), line: () => laceLine(), mark: () => laceMark(),
      enter: (r) => { scene('queen'); H.laced = false; H.detT = 0; H.detGone = false; if (!r) { radio('vera.det1'); if (crewN() > 1) radio('vera.det2'); } }, done: () => !!H.got.detOut && H.detGone, mu: 'mu_casino', hostOnly: true },

    { id: 'salon', tag: 'Salon', line: 'Take the {crew stairs} up to the high-roller salon', mark: () => A.salonDoor, enter: (r) => { scene('queen'); if (!r) radio('vera.det3'); }, done: () => near(A.salon, 7, 3), mu: 'mu_casino' },

    { id: 'sting', tag: 'Prescott', line: () => stingLine(), mark: () => stingMark(), enter: (r) => { scene('queen'); if (!r) { radio('vera.q4'); radio('vera.q5'); if (crewN() > 2) radio('vera.q4b'); } H.anger = 0; H.strikes = 0; H.tray = false; }, done: () => !!H.got.key, mu: 'mu_casino' },

    { id: 'silas', tag: 'Silas', line: 'See {Silas Crane} in his office behind the purser\u2019s cage', mark: () => A.silas, enter: (r) => { scene('queen'); if (!r) radio('vera.got'); if (LN() && LN().openStaff) LN().openStaff(true); }, done: () => near(A.silas, 3.6, 3), mu: 'mu_casino' },

    { id: 'silascut', line: 'Silas Crane', cut: () => cutSilas(), enter: () => scene('queen'), mu: 'mu_casino' },

    { id: 'wheels', cp: 6, act: 'Act IV \u00b7 Midnight', tag: () => (anyCar() ? 'Army stash' : 'Car'), line: () => (anyCar() ? 'Drive east into the desert to the {army stash} on the Ochre Flats \u2014 leave the car outside and go in on foot' : 'Pick up the car Vera left at {the Motor Exchange} (or take any car) and head east for the desert'),
      mark: () => (anyCar() ? A.armyGate : H.ride && !H.ride.dead ? H.ride : A.wheelsSpot), enter: (r) => wheels(r), done: () => !A.army || dist(me(), A.army) < (AF.mode === 'walk' ? 75 : 40), mu: 'mu_plan', time: 0.2 },
    { id: 'armycut', line: 'The army stash', cut: () => cutArmy(), enter: () => scene('army'), vo: ['vera.army2', 'vera.army3'], mu: 'mu_stealth' },
    { id: 'army', cp: 14, tag: () => (H.got.crate ? 'Car' : 'Launchers'), line: () => armyLine(), mark: () => (A.armyCrate || null), enter: (r) => { scene('army'); if (r) armyRide(); }, done: () => !!H.got.crate, mu: 'mu_stealth' },
    { id: 'haul', tag: () => (anyCar() ? 'Drop' : 'Car'), line: () => (anyCar() ? 'Get the crate west to the {drop} beside ' + (A.farmName || 'Southfield Farm') + ' and park there' : 'Back in the {car} with the crate'),
      mark: () => (anyCar() || !H.ride || H.ride.dead ? A.farmDrop : H.ride), enter: (r) => { scene('none'); if (!r) radio('vera.army4', true); }, done: () => !!H.got.drop, mu: 'mu_plan' },
    { id: 'farmcut', line: 'Southfield Farm', cut: () => cutFarm(), enter: () => { scene('farm'); armoredSpawn(); }, vo: ['vera.army5', 'vera.farm2', 'vera.farm5'], mu: 'mu_stealth' },
    { id: 'farm', cp: 15, tag: () => (inHeistCar() ? 'Drive' : 'Armoured car'), line: () => farmLine(),
      mark: () => (H.car && !H.car.dead ? H.car : A.armor), enter: (r) => { scene('farm'); armoredSpawn(!!r); }, done: () => inHeistCar(), mu: 'mu_stealth' },
    { id: 'carchase', tag: () => (CC.helis ? 'Helicopters \u00b7 ' + helisLeft() : 'Chasers'), line: () => ccLine(), mark: () => ccMark(), enter: (r) => ccEnter(r), done: () => ccOver(), mu: 'mu_chase', hostOnly: true },
    { id: 'paint', tag: () => (inHeistCar() ? 'Garage' : 'Armoured car'), line: () => (inHeistCar() ? 'Every Moretti knows that car \u2014 drive it into {' + (A.garageName || 'the respray garage') + '} on the desert road and stop inside' : 'Get back in the {armoured car}'),
      mark: () => (inHeistCar() || !H.car || H.car.dead ? A.garageDoor : H.car), enter: (r) => { scene('none'); if (!r) radio('vera.garage1', true); }, done: () => !!H.got.paint, mu: 'mu_plan' },
    { id: 'paintcut', line: 'Dusty\u2019s Respray', cut: () => cutGarage(), enter: () => scene('none'), vo: ['vera.garage2', 'vera.paint2'], mu: 'mu_brief' },
    { id: 'park', tag: 'Charter St', line: () => (inHeistCar() ? 'Park the armoured car on {Charter Street}, beside the bank' : 'Get back in the {armoured car}'),
      mark: () => (H.got.wheels ? null : inHeistCar() ? A.carSpot : H.car && !H.car.dead ? H.car : A.carSpot), done: () => !!H.got.wheels, mu: 'mu_plan' },
    { id: 'nightcut', line: 'Midnight', cut: () => cutNight(), enter: () => scene('none'), vo: ['vera.n1'], mu: 'mu_stealth' },
    { id: 'vantage', cp: 7, tag: () => (onCityRoof() ? 'Roof edge' : 'Ladder'), line: () => (onCityRoof() ? 'Find a spot at the {roof edge} facing the bank' : 'Climb the {service ladder} on City Hall\u2019s wall \u2014 Vera left a rifle case at its foot'),
      mark: () => (onCityRoof() ? HB.spots.vantage : HB.spots.ladder), enter: () => { scene('roof'); parkCar(); lendSniper(); }, done: () => onCityRoof() && dist(AF.player, HB.spots.vantage) < 10, mu: 'mu_stealth' },
    { id: 'snipe', tag: () => 'Roof watch \u00b7 ' + snipeTag('roof'), line: () => snipeLine('roof'), mark: () => snipeMark('roof'),
      enter: (r) => { scene('roof'); lendSniper(); if (!r) { radio('vera.n2'); radio('vera.snipeall'); } }, done: () => vantageLeft() === 0, mu: 'mu_stealth', hostOnly: true },
    { id: 'zooplane', cp: 8, tag: 'Plane', line: 'Get to {Westgate Airfield} and take a plane \u2014 the zoo\u2019s locked down, you go in from the sky', mark: () => planeAt(),
      enter: (r) => { H.got.sniped = true; scene('none'); resetPlanes(); if (!r) { radio('vera.n3'); radio('vera.m2'); radio('vera.n4'); } }, done: () => flying(), mu: 'mu_plan' },
    { id: 'zoojump', tag: 'Great Banyan', line: () => (flying() ? 'Fly over the zoo and bail out over the {Great Banyan} \u2014 land on the treehouse deck' : AF.mode === 'skydive' ? 'Steer for the {Great Banyan}\u2019s treehouse deck' : 'Back into a plane \u2014 the zoo can only be entered from the sky'),
      mark: () => A.treeDeck, enter: () => scene('zoo'), done: () => jumpedTo(A.banyan, 45), mu: 'mu_tension' },
    { id: 'zoosnipe', cp: 9, tag: () => 'Paths \u00b7 ' + snipeTag('zoo'), line: () => snipeLine('zoo'),
      mark: () => snipeMark('zoo'), enter: (r) => { scene('zoo'); lendSniper(); if (!r) { radio('vera.n5'); radio('vera.zooall'); } }, done: () => zooSnipeLeft() === 0, mu: 'mu_stealth', hostOnly: true },
    { id: 'lions', tag: 'Lion house', line: 'Make for the {lion house} \u2014 more Kestrel guards on the paths and a camera over the keepers\u2019 gate', mark: () => A.denGate, enter: (r) => { scene('zoo'); if (!r) radio('vera.n6'); }, done: () => near(A.denGate, 3.2, 2.5) || belowZoo(), mu: 'mu_stealth' },
    { id: 'den', tag: 'Hatch', line: 'Sneak through the {lion house} to the old hatch \u2014 don\u2019t wake the lions', mark: () => A.hatch, enter: (r) => { scene('zoo'); if (!r) radio('vera.z2'); }, done: () => near(A.hatch, 2.2, 2.5) || belowZoo(), mu: 'mu_stealth' },
    { id: 'bunker', tag: 'Kestrel', line: 'Follow the bunker and the sewer to the {Kestrel junction}', mark: () => A.server, enter: (r) => { scene('zoo'); if (!r) radio('vera.z3'); }, done: () => near(A.server, 3, 2.5), mu: 'mu_stealth' },
    { id: 'hack', tag: 'Terminal', line: 'Jack into the {Kestrel terminal}', mark: () => A.server, enter: () => scene('zoo'), done: () => !!H.got.hacked, mu: 'mu_stealth' },
    { id: 'drain', cp: 10, tag: 'Westgate Rd', line: 'Up the {drain stair} to Westgate Road \u2014 the airfield is across the road', mark: () => (AF.player.y < -1 ? A.manhole : A.street),
      enter: (r) => { scene('none'); if (!r) radio('vera.n7'); }, done: () => (dist(me(), A.street) < 9 && AF.player.y > -1) || flying(), mu: 'mu_plan' },
    { id: 'bankplane', tag: 'Plane', line: 'Take a {plane} from Westgate \u2014 next stop, the Harbour Trust roof', mark: () => planeAt(), enter: (r) => { scene('none'); resetPlanes(); if (!r) radio('vera.n8'); }, done: () => flying(), mu: 'mu_plan' },
    { id: 'bankjump', tag: 'Sky deck', line: () => (flying() ? 'Fly to the Harbour Trust and bail out over the steel {sky deck} on its Charter Street side' : AF.mode === 'skydive' ? 'Steer for the steel {sky deck} on the bank tower' : 'Back into a plane \u2014 the roof is the only way in'),
      mark: () => HB.spots.skyDeck, enter: () => scene('roof'), done: () => !!H.flag.chuted && onBankTop(), mu: 'mu_tension' },
    { id: 'roofclear', cp: 11, tag: () => (roofLeft() ? 'Guards \u00b7 ' + roofLeft() : 'Roof door'), line: () => (roofLeft() ? 'Clear the roof \u2014 ' + roofLeft() + (roofLeft() > 1 ? ' guards' : ' guard') + ' the rifle couldn\u2019t see' : 'Down the {steel stairs} and round to the {roof door}'),
      mark: () => (roofLeft() ? nextGuard(HB.roofGuards(false)) : AF.player.y > 15.5 ? HB.spots.stairTop : HB.spots.bulkhead), enter: (r) => { scene('roof'); if (!r) radio('vera.n9'); }, done: () => roofLeft() === 0 && near(HB.spots.bulkhead, 5, 2.5), mu: 'mu_stealth' },
    { id: 'door', tag: 'Roof door', line: () => (H.got.hatch ? 'Through the {roof door} and down the stairs' : 'The {roof door} has a Kestrel keypad \u2014 open it with the Kestrel tablet or the keypad'), mark: () => HB.spots.bulkhead, enter: (r) => { scene('bank'); if (!r) radio(H.got.hatch ? 'vera.hatch2' : 'vera.n12'); }, done: () => inStair() || inBank(), mu: 'mu_stealth' },
    { id: 'vault', tag: 'Vault', line: 'Reach the {vault door} \u2014 guards and cameras everywhere (the tablet loops cameras and kills lights)', mark: () => HB.spots.gate, enter: (r) => { scene('bank'); if (!r) { radio('vera.tip'); radio('vera.cams'); } }, done: () => near(HB.spots.gate, 2.8, 2), mu: 'mu_stealth' },
    { id: 'keys', tag: 'Vault keys', line: () => (H.lockT > 0 ? 'Turn {both keys} \u2014 ' + Math.ceil(H.lockT) + ' s left on the override' : 'Time lock engaged \u2014 override it with the Kestrel tablet'), mark: () => HB.spots.keys[H.grip[0] > 0 ? 1 : 0], enter: (r) => { scene('bank'); if (!r) radio('vera.keys'); }, done: () => !!H.got.gate, mu: 'mu_stealth' },
    { id: 'lasers', tag: 'Cage', line: () => (H.got.lasersOff ? 'The grid is dead \u2014 walk to the {deposit cage}' : 'Through the {laser grid} to the deposit cage \u2014 crouch under, time the sweepers, or kill it from the tablet'), mark: () => HB.spots.cage, enter: (r) => { scene('bank'); if (!r) radio('vera.laser'); }, done: () => inVaultFar() || !!H.got.cage, mu: 'mu_stealth' },
    { id: 'drill', tag: 'Drill', line: 'Drill the {deposit cage} \u2014 keep the bit cool', mark: () => HB.spots.cage, enter: (r) => { scene('bank'); if (!r) radio('vera.drill'); }, done: () => !!H.got.cage, mu: 'mu_stealth' },
    { id: 'cash', tag: 'Cash', line: 'Grab the {cash bags}', mark: () => nextBag(), enter: (r) => { scene('bank'); if (!r) radio('vera.cash'); }, done: () => H.bags.every(Boolean), mu: 'mu_stealth' },
    { id: 'escape', cp: 12, act: 'Act V \u00b7 The Getaway', tag: () => (H.got.exit ? 'Car' : 'Exit'), line: () => (H.got.exit ? 'Out through the {fire exit} to the armoured car on Charter Street' : 'Open the {fire exit} \u2014 the Kestrel tablet or the keypad beside it'),
      mark: () => (!H.got.exit ? HB.spots.exitPad : H.car && !H.car.dead ? H.car : A.car), enter: (r) => getaway(r), done: () => inCar() || flying(), mu: 'mu_chase' },
    { id: 'jets', tag: () => 'Jets \u00b7 ' + jetsLeft() + ' left', line: () => jetsLine(), mark: () => jetMark(), enter: (r) => jetsStart(r), done: () => jetsOver(), mu: 'mu_chase', hostOnly: true },

    { id: 'run', tag: 'Plane', line: 'Lose the police on the way to {Westgate Airfield} \u2014 a plane is waiting', mark: () => planeAt(), enter: () => run(), done: () => flying(), mu: 'mu_chase' },

    { id: 'away', tag: 'Corsair Key', line: 'Fly the cash 3 km out to {Corsair Key} \u2014 the police can\u2019t follow you over the sea', mark: () => A.keyStrip,
      enter: (r) => { resetPlanes(); returnLoadout(); const C = CB(); if (C) { if (C.unlend) { C.unlend('seeker'); C.unlend('bazooka'); } if (C.jetMission) C.jetMission(null); } if (!r) radio('vera.g5'); }, done: () => onKey() && (AF.mode === 'walk' || landed()), mu: 'mu_tension' },

    { id: 'stash', cp: 13, act: 'Act VI \u00b7 Corsair Key', tag: 'Hangar', line: 'Carry the cash into {the hangar}', mark: () => A.stash, enter: (r) => { scene('key'); if (!r) radio('vera.k1'); }, done: () => near(A.stash, 4, 3), mu: 'mu_tension', time: 1.5 },

    { id: 'betray', line: 'Corsair Key', cut: () => cutBetray(), enter: () => scene('key'), mu: 'mu_tension' },

    { id: 'fight', tag: 'Crate', line: () => (CB() && CB().has && CB().has('lmg') ? 'Take down {Silas}, {Kit}, {Tony Moretti} and their men' : 'Grab the {LMG} from Silas\u2019s crate and fight!'), mark: () => (CB() && CB().has && CB().has('lmg') ? bossMark() : A.crate),
      enter: (r) => fight(r), done: () => fightOver(), mu: 'mu_finale', hostOnly: true },

    { id: 'finale', line: 'Corsair Key', cut: () => cutFinale(), enter: () => { scene('key'); HS.showNpc('vera2', true); }, mu: 'mu_brief' },

  ];
  const IDX = {}; ST.forEach((s, i) => { IDX[s.id] = i; });
  // general guidance for the steps that need a new skill (no key names: the same words on a keyboard, a pad or a phone)
  const SKY = 'Skydive: bail out high over the target, open the chute in good time, steer for the landing spot and flare just before touchdown.';
  const TIPS = {
    maproom: 'Follow the gold marker into the depot \u2014 Vera is waiting at the map table.',
    uniform: 'Sneak: stay low and out of the watchmen\u2019s torchlight. At the grille, pick the lock by matching the pins.',
    plane: 'Flying: open the throttle down the runway, ease the nose up, bank to turn. Follow the gold marker.',
    follow: 'Kit leads the way \u2014 the gold marker follows him. Keep up.',
    cache: 'Stealth: stay crouched, take guards down from behind for a silent kill, and hide the bodies.',
    chase: 'Jet ski: keep riding and shoot from the saddle \u2014 aim for the riders, reload between bursts.',
    uniforms: 'Put your gun away. Knock out a waiter or a dealer from behind, take the uniform, hide the body.',
    lace: 'The house detective trusts only the waiter. Waiter: lace a drink at the salon bar and serve it to him. Everyone else waits outside the salon.',
    wheels: 'Any car will do. The blue line under the objective gives turn-by-turn directions.',
    army: 'Soldiers have torches and sharp eyes. Take them from behind \u2014 or bring a car right up to the crate and grab it fast.',
    farm: 'Sneak up to the armoured car. The moment anyone climbs in, the whole yard opens fire \u2014 so be ready to drive.',
    carchase: 'Driver: keep moving, weave round the mines and swing round roadblocks. In the open back: aim anywhere and hold the trigger \u2014 the miniguns never run dry, just reload. Bring the helicopters down.',
    paint: 'Drive straight into the respray garage and stop inside.',
    vantage: 'The ladder climbs on its own once you start up it.',
    snipe: 'Switch to the silenced sniper rifle and look through the scope. Shoot when no other guard can see the one you drop. Each shift of the watch is only in sight from its own spot on the roof.',
    zooplane: 'Flying: climb above 35 m before you reach the zoo.',
    zoojump: SKY,
    zoosnipe: 'Nobody on the ground can see you up in the tree. Scope in and pick them off, then move to the next perch for the next shift. Seen in the zoo = five stars.',
    bankjump: SKY,
    roofclear: 'Behind a guard: a melee hit or a quiet shot drops him. Seen up here = five stars.',
    door: 'Open the Kestrel tablet \u2014 cameras, lights and locks. Use it on the roof door.',
    jets: 'Switch to the seeker launcher and keep a jet in the box until the tone holds and it turns GREEN, then fire. The bazooka flies straight: lead the jet.',
    fight: 'The LMG is in Silas\u2019s crate (gold marker). Reload behind cover.',
  };
  for (const s of ST) if (TIPS[s.id]) s.tip = TIPS[s.id];
  // the bank's own steps (inside, with the tablet) and the night's zoo steps
  const BANK = new Set(['door', 'vault', 'keys', 'lasers', 'drill', 'cash']), ZOO = new Set(['zoojump', 'zoosnipe', 'lions', 'den', 'bunker', 'hack']);
  const ROOF = new Set(['vantage', 'snipe', 'bankjump', 'roofclear']);
  // checkpoints: the step, where, the facts already earned (index = the cp a step saves)
  const G0 = ['uniform', 'papers', 'cleared'], G1 = G0.concat(['kitkey']), G2 = G1.concat(['cache']), G3 = G2.concat(['key']), G4 = G3.concat(['crate', 'drop', 'launchers', 'wheels', 'paint']);
  const CPS = [
    { step: 'maproom', label: 'the depot', at: () => (HO() ? HO().door : A.vera), got: [] },
    { step: 'uniform', label: 'Kovac\u2019s tailor shop', at: () => A.shopDoor, got: [] },
    { step: 'forger', label: 'Harbour Stationers', at: () => A.ezraDoor, got: ['uniform'] },
    { step: 'kit', label: 'Serena Isle', at: () => A.c2, got: G0 },
    { step: 'cache', label: 'the smugglers\u2019 tunnel', at: () => A.tunnelEntry, got: G1 },
    { step: 'uniforms', label: 'the Solace Queen', at: () => A.c4, got: G2 },
    { step: 'wheels', label: 'the Motor Exchange', at: () => A.wheelsSpot || A.c5, got: G3 },
    { step: 'vantage', label: 'City Hall', at: () => HB.spots.ladder, got: G4 },
    { step: 'zooplane', label: 'Westgate Airfield', at: () => A.plane, got: G4.concat(['sniped']) },
    { step: 'zoosnipe', label: 'the Treetop Trail', at: () => A.treeDeck, got: G4.concat(['sniped']) },
    { step: 'drain', label: 'the Kestrel junction', at: () => A.server, got: G4.concat(['sniped', 'hacked']) },
    { step: 'roofclear', label: 'the Harbour Trust roof', at: () => HB.spots.podium || HB.spots.skyDeck, got: G4.concat(['sniped', 'hacked']) },
    { step: 'escape', label: 'the Harbour Trust', at: () => HB.spots.fire, got: G4.concat(['sniped', 'hacked', 'hatch', 'gate', 'cage']), cash: true },
    { step: 'stash', label: 'Corsair Key', at: () => A.c8, got: G4.concat(['sniped', 'hacked', 'hatch', 'gate', 'cage', 'exit']), cash: true },
    { step: 'army', label: 'the army stash', at: () => A.armyGate || A.army || A.wheelsSpot, got: G3 },
    { step: 'farm', label: 'Southfield Farm', at: () => A.farmDrop || A.farmGate, got: G3.concat(['crate', 'drop', 'launchers']) },
  ];
  const is = (id) => H.on && H.i === IDX[id];
  const lineOf = (s) => (typeof s.line === 'function' ? s.line() : s.line);
  const tagOf = (s) => (typeof s.tag === 'function' ? s.tag() : s.tag);
  const actOf = (i) => { for (let k = i; k >= 0; k--) if (ST[k].act) return ST[k].act; return ''; };
  // ---------------------------------------------------------------- the night: helpers shared by the roof, the zoo and the bank
  const isAny = (set) => H.on && !!ST[H.i] && set.has(ST[H.i].id);
  const belowZoo = () => { const p = AF.player, d = A.server; return AF.mode === 'walk' && !!d && p.y < (A.hatch ? A.hatch.y - 2.5 : -2) && dist(p, A.hatch) < 60; };
  const inShop = () => { const b = A.shopBox, p = AF.player; return AF.mode === 'walk' && !!b && p.x > b[0] && p.x < b[3] && p.z > b[2] && p.z < b[5] && p.y < b[4]; };
  const atLookout = () => AF.mode === 'walk' && AF.player.y > 10 && dist(AF.player, A.banyan) < 9;
  const uniformLine = () => (H.got.uniform ? 'Slip back out of {Kovac\u2019s} \u2014 unseen'
    : !H.got.grille ? (mgDone('grille') ? 'Your padlock is off \u2014 wait for your crew to pick theirs' + mgTag('grille') : near(A.shopDoor, 30) ? 'Pick ' + (crewN() > 1 ? 'your padlock' : 'the padlock') + ' on the {night grille}' + mgTag('grille')
      : dist(me(), A.shopDoor) > 450 ? 'Take Vera\u2019s car back to the city and break into {Kovac\u2019s tailor shop}' : 'Break into {Kovac\u2019s tailor shop} \u2014 it\u2019s shut for the night')
      : mgDone('rail') ? 'Uniform on \u2014 wait for the rest of the crew' + mgTag('rail') : 'Sneak past the {night watchman} \u2014 the {pilot uniforms} hang on the rail behind the counter' + mgTag('rail'));
  // the bank's state follows the facts (every client)
  const applyNight = () => {
    if (!HB || !HB.ready) return;
    const inside = isAny(BANK), loot = is('lasers') || is('drill') || is('cash');
    HB.door('bulkhead', !!H.got.hatch); HB.door('gate', !!H.got.gate); HB.cage(!!H.got.cage); if (HB.exit) HB.exit(!!H.got.exit);
    HB.lasers(loot && !H.bags.every(Boolean) && !H.got.lasersOff);
    let mask = 0; for (let k = 0; k < 4; k++) if (!H.bags[k] && (inside || is('escape'))) mask |= 1 << k; HB.bagsShow(H.got.cage || loot ? mask : 0);
    if (AF.den && AF.den.setActive) AF.den.setActive(isAny(ZOO));
    // the drain's street hatch opens only once Kestrel is hacked: the crew's way out to Westgate
    if (AF.den && AF.den.setDrain) AF.den.setDrain(H.on && !!H.got.hacked && (is('hack') || is('drain') || is('bankplane')));
  };
  const gotList = () => Object.keys(H.got).filter((k) => H.got[k]);
  // Vera's silenced sniper rifle: lent for the roof watch and the zoo, kept (a loan) until the job ends
  const lendSniper = () => { const C = CB(); if (C && C.lend && !(C.has && C.has('sniper'))) { C.lend('sniper', 25); note('A silenced sniper rifle \u2014 aim to look through the scope.', 'ok'); } };
  // the roof watch the rifle took down stays down whatever later checkpoint the crew comes back to
  const killVantage = () => { if (!S || !HB || !HB.roofGuards) return; for (const g of HB.roofGuards(true)) if (!g.down) S.knockOut(g, 0, 1, 'dead'); };
  // seen at the zoo or on the bank roof: every cop in the city (five stars); the job waits until they lose you, or a retry
  const blown = (where) => {
    const C = CB(); if (!C || !H.on || H.failing) return;
    const G = AF.G || {}, top = G.stars && G.stars.length ? G.stars[G.stars.length - 1] : 400;
    C.crime(Math.max(1, top - C.heat + 5), 'heist');
    radio('vera.n10', true); sfx('jg_spot');
    MI.shard('Spotted at the ' + where, 'Five stars \u2014 lose the police, or retry from the last checkpoint (pause menu)', 'fail', 4200);
  };
  // ---- Serena: Kit leads the crew to the hotel's back room and opens the bookcase door (AF.island.heist.secret, 44-island)
  const SEC = () => { const I = AF.island && AF.island.heist, s = I && I.secret; return s && s.kitPath && s.kitPath.length && s.exit ? s : null; };
  const KL = { i: 0, on: false, done: false, wait: 0 };
  const kitNpc = () => HS.npc && HS.npc.kit;
  const kitPose = (n, x, y, z, yaw) => { n.x = x; n.y = y; n.z = z; if (yaw != null) n.yaw = n.yaw0 = yaw; n.root.position.set(x, y, z); n.root.rotation.y = n.yaw; if (n.interact) { n.interact.x = x; n.interact.y = y + 1; n.interact.z = z; } };
  const kitReset = () => { const n = kitNpc(), s = SEC(); KL.on = false; KL.done = false; KL.i = 0; if (n) { n.walk = 0; kitPose(n, A.kit.x, A.kit.y, A.kit.z, A.kitYaw); } if (s && s.open) s.open(false); };
  const kitLead = (restored) => {
    const s = SEC(), n = kitNpc(); if (!s || !n) return;
    if (restored) { const w = s.kitWait || s.room; kitPose(n, w.x, w.y, w.z, w.yaw); KL.on = false; KL.done = true; return; }
    KL.i = 0; KL.on = true; KL.done = false; KL.wait = 1.6; speak('kit.f1', n);
  };
  const crewNear = (x, z, r) => {
    const p = AF.player; if (AF.mode === 'walk' && Math.hypot(p.x - x, p.z - z) < r) return true;
    if (online() && AF.coop && AF.coop.players) for (const q of AF.coop.players.values()) if (q && q.seen && !q.dead && Math.hypot(q.x - x, q.z - z) < r) return true;
    return false;
  };
  const kitTick = (dt) => {
    const n = kitNpc(), s = SEC(); if (!n || !s || !KL.on) return;
    if (KL.wait > 0) { KL.wait -= dt; return; }
    const P = s.kitPath, q = P[KL.i];
    if (!q) { KL.on = false; KL.done = true; n.walk = 0; const w = s.kitWait; if (w) kitPose(n, w.x, w.y, w.z, w.yaw); return; }
    // Kit waits whenever nobody in the crew is within 9 m of him
    if (!crewNear(n.x, n.z, 9)) { n.walk = 0; return; }
    const dx = q[0] - n.x, dz = q[2] - n.z, d = Math.hypot(dx, dz);
    if (d < 0.12) { KL.i++; return; }
    const sp = 1.5, st = Math.min(d, sp * dt);
    n.yaw += AF.angDiff(n.yaw, Math.atan2(dx, dz)) * Math.min(1, dt * 8); n.yaw0 = n.yaw;
    kitPose(n, n.x + dx / d * st, n.y + (q[1] - n.y) * Math.min(1, dt * 8), n.z + dz / d * st); n.walk = sp;
  };
  const kitThere = () => KL.done;
  const nearKit = (r) => { const n = kitNpc(); return !!n && near(n, r, 3); };
  const kitMark = () => { const n = kitNpc(); if (!n) return A.kit; SC.x = n.x; SC.y = n.y; SC.z = n.z; return SC; };
  const secretOpen = (restored) => {
    const s = SEC(), n = kitNpc(); if (!s) return;
    if (restored) { if (s.open) s.open(true); return; }
    if (n) speak('kit.f2', n);
    setTimeout(() => { if (!(is('secret') || is('passage')) || !SEC()) return; if (s.open) s.open(true); sfx('latch'); if (n) speak('kit.f3', n); }, AF.TEST ? 0 : 2400);
  };
  const inPassage = () => { const s = SEC(), p = AF.player; if (!s || AF.mode !== 'walk') return false; return (s.tunnelIn && near(s.tunnelIn, 3, 3)) || (dist(p, s.stairTop || s.room) < 14 && p.y < (s.room ? s.room.y : p.y) - 1.6); };
  // inside the Morettis' tube itself (not Kit's passage)
  const inTube = () => { const O = AF.outland, p = AF.player; return AF.mode === 'walk' && !!O && !!O.tunnelMain && O.tunnelMain(p.x, p.z) === 2 && O.tunnelInfo.s > 2; };
  // the next waypoint along the passage ahead of the player (the gold marker leads the way underground)
  const passMark = () => {
    const s = SEC(); if (!s) return A.tunnelEntry; const P = s.path || [], p = AF.player;
    if (P.length < 2) return s.exit;
    let bi = 0, bd = 1e9; for (let i = 0; i < P.length; i++) { const d = Math.hypot(P[i][0] - p.x, P[i][2] - p.z); if (d < bd) { bd = d; bi = i; } }
    const q = P[Math.min(P.length - 1, bi + 3)]; if (bi + 3 >= P.length - 1) return s.exit;
    SC.x = q[0]; SC.y = q[1]; SC.z = q[2]; return SC;
  };

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
    HS.show('watch', on('shop')); HS.show('shop2', on('shop')); HS.show('shop3', on('shop')); if (HS.props.rail) HS.props.rail.visible = on('shop');
    if (HS.grille) HS.grille(on('shop') && !H.got.grille); HS.shopShut = on('shop'); if (HS.racks) HS.racks(on('shop'));
    HS.showNpc('ezra', on('ezra')); HS.showNpc('gate', on('gate') || on('ezra'));
    HS.showNpc('kit', on('kit'));
    for (const k in HS.walkers) if (/^(tunnel|post|wave)/.test(k)) HS.show(k, on('tunnel'));
    for (const k of ['steward', 'waiter', 'dealer', 'sec0', 'sec1', 'sec2', 'sec3', 'sec4', 'sec5']) HS.show(k, on('queen'));
    HS.show('detective', on('queen') && !(H.got.detOut && (H.detGone || H.i > IDX.lace)));
    for (const k of ['door', 'prescott', 'celeste', 'pit']) HS.showNpc(k, on('queen'));
    for (let k = 0; k < 6; k++) HS.show('farm' + k, on('farm'));
    for (let k = 0; k < 6; k++) HS.show('army' + k, on('army'));
    if (HS.props.armyCrate) HS.props.armyCrate.visible = on('army') && !H.got.crate;
    if (HS.props.dropCrate) HS.props.dropCrate.visible = H.on && !!H.got.drop && H.i <= IDX.farm;
    for (const k of ['vera2', 'silas2', 'kit2', 'tony']) HS.showNpc(k, on('key') && H.i <= IDX.betray);
    if (HS.props.crate) HS.props.crate.visible = on('key');
    // the night: the zoo's Kestrel guards, the bank's roof watch (the sniper and the jump), the bank itself once the crew is on its roof
    HS.show('watchman', on('zoo')); for (let k = 0; k < (HS.zooN || 7); k++) HS.show('zoo' + k, on('zoo'));
    const armed = on('bank') || (on('roof') && (is('bankjump') || is('roofclear')));
    if (HB && HB.ready) { if (HB.on !== armed) HB.night(armed); if (HB.roof && HB.roofOn !== (on('roof') || on('bank'))) HB.roof(on('roof') || on('bank')); }
    if (!on('zoo') && AF.den && AF.den.setActive) AF.den.setActive(false);
    // zones are reset by resetWorld (a checkpoint); moving between scenes never revives anyone
    const zone = on('shop') ? 'shop' : on('tunnel') ? 'tunnel' : on('queen') ? 'queen' : on('farm') ? 'farm' : on('army') ? 'army' : on('zoo') ? 'zoo' : on('roof') ? 'roof' : on('bank') ? 'bank' : null;
    if (S && (!S.zone || S.zone.id !== zone)) S.activate(zone);
    H.scene = name;
  };
  // music: the step's bed, the action track while a fight or an alarm is on
  let muCur = null;
  const music = () => {
    let id = null;
    if (H.on) { const s = ST[H.i]; id = s ? s.mu || null : null; if ((S && S.zone && S.zone.alarm && S.zone.mode === 'fight') || (is('ambush') && H.goonsN)) id = 'mu_action'; if (is('carchase')) id = HE.on && helisLeft() ? 'mu_finale' : 'mu_chase'; }
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
  const HEAT_OK = new Set(['army', 'haul', 'farm', 'carchase', 'escape', 'jets', 'run', 'away', 'fight']);
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
    // a checkpoint keeps the guns everyone had when they reached it: a retry from it lends exactly those back (77 CB.snapLent / relend)
    if (s.cp != null && !restored) { const C = CB(); H.cpGuns = C && C.snapLent ? C.snapLent() : null; H.cpGunsAt = s.cp; H.cpLoadout = !!H.loadout; }
    if (s.time != null && host() && !restored) AF.time.set({ hours: s.time, paused: true });
    if (s.act && !s.cut) MI.shard('The Harbour Trust Job', s.act, 'start', 3600);
    if (!restored && i > 0) { sfx(s.cp != null ? 'jg_pass' : 'ui_check'); if (s.cp != null) note('Checkpoint \u2014 ' + CPS[s.cp].label + '.', 'ok'); }
    hudT = 0;
    // a how-to tip for the step's controls (top-left on desktop, a toast on touch)
    if (s.tip && !restored) { const t = typeof s.tip === 'function' ? s.tip() : s.tip; if (t) { if (AF.touch) note(t.replace(/\[([^\]]+)\]/g, '$1'), 'mission'); else if (UI.help) UI.help(t, 11000); } }
    if (s.enter) s.enter(!!restored);
    if (s.cut) { if (restored) H.flag.cut = true; else s.cut(); }
    // the next cutscene's lines start decoding now, so its first line never lands late
    const nx = ST[i + 1]; if (nx && nx.vo && AF.audio && AF.audio.voicePreload) AF.audio.voicePreload(nx.vo);
    markers(); applyNight(); music();
    AF.emit('heist', H);
  };
  const advance = (from) => {   // host
    if (!H.on || from !== H.i || H.failing) return;
    if (H.i + 1 >= ST.length) { finish(true); return; }
    enter(H.i + 1, false); send({ op: 'st', i: H.i, cp: H.cp, g: gotList() });
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
      if (host()) { restore(H.cp, true); send({ op: 'rs', cp: H.cp }); }
      setTimeout(() => radio(Math.random() < 0.5 ? 'vera.fail' : 'vera.fail2'), 1600);
    }, AF.TEST ? 0 : 2600);
  };
  const resetWorld = (i) => {
    const C = CB(); if (C) { C.clearWanted(); C.clearGoons(); if (C.unlend) C.unlend(); }
    H.grip[0] = H.grip[1] = 0; H.lockT = 0; H.anger = 0; H.strikes = 0; H.tray = false; H.goonsN = 0; H.waves = 0; H.bosses = [];
    if (HB && HB.ready) { HB.reset(); }
    if (S) for (const z of ['shop', 'tunnel', 'queen', 'farm', 'army', 'zoo', 'roof', 'bank']) if (S.zones.get(z)) S.reset(z);
    if (AF.den && AF.den.reset) AF.den.reset();
    if (AF.den && AF.den.setHatch) AF.den.setHatch(false);
    kitReset();
    H.took = {}; H.tray = false; H.busy = false; H.drilling = false; H.dealing = false; H.drillR = false; AF.PL.still = false;
    H.mg = {}; H.crack = 0; H.cracker = -1; H.crackOn = false; H.siege = null; H.detHold = 0; H.pitHold = 0; H.laced = false; H.detT = 0; H.detGone = false; SN.zoo = SN.roof = 1; SN.said = {}; chaseClear();
    H.bankWave = null; H.tookBy = {}; H.loadout = false; H.exitT = 0; H.ccLeft = null;
    ccClear(); heliClear(); { const C0 = CB(); if (C0 && C0.jetMission) C0.jetMission(null); }
    if (S && S.carrying) S.carrying = null;
    if (LN() && LN().openStaff) LN().openStaff(i === IDX.silas || i === IDX.silascut);
    if (H.roadblock) { for (const c of H.roadblock.cars) c.temp = true; H.roadblock = null; }
    for (const k of ['celeste']) HS.showNpc(k, false);
  };
  // the wardrobe + loadout a checkpoint implies (back at the Queen's checkpoint nobody wears a borrowed uniform yet: they're taken again)
  const outfit = () => {
    const i = H.i;
    if (i >= IDX.wheels && i <= IDX.cash) dress('night');
    else if (i > IDX.uniform && i <= IDX.kitcut) dress('pilot');
    else if (i >= IDX.escape) dress('night');
    else if (i <= IDX.uniforms || i > IDX.silascut) dress(null);
    const C = CB(); if (C && C.lend) { if (H.got.cache && i < IDX.fight) { C.lend('spistol', 60); if (i >= IDX.uniforms && i <= IDX.silascut && C.selectId) C.selectId('fists'); } }
    if (C && C.lend && H.got.sniped && i < IDX.escape) lendSniper();
    // the loadout this checkpoint was reached with comes back (bought guns are saved anyway); the vault's loan stays a loan
    if (C && C.relend && H.cpGuns && H.cpGunsAt === H.cp) { C.relend(H.cpGuns); if (H.cpLoadout) H.loadout = true; if (i >= IDX.uniforms && i <= IDX.silascut && C.selectId) C.selectId('fists'); }
  };
  const restore = (cp, failed) => {
    const C = CPS[cp]; let i = IDX[C.step]; H.cp = cp;
    hushVoices();
    resetWorld(i);
    H.got = {}; for (const k of C.got) H.got[k] = true;
    if (H.minigamesDone) for (const k of H.minigamesDone) H.got[k] = true;
    H.bags = [0, 1, 2, 3].map(() => !!C.cash);
    const at = C.at(), label = C.label;
    if (host() && (C.cash || i >= IDX.wheels)) AF.time.set({ hours: i >= IDX.stash ? 1.5 : 0.2, paused: true });
    resetPlanes();
    AF.health.heal(AF.health.max);
    // the roof watch the rifle took down stays down; the armoured car waits on Charter Street again
    if (H.got.sniped) killVantage();
    if (i >= IDX.vantage && i < IDX.escape) parkCar();
    goTo(at, label);
    enter(i, true);
    H.wear = undefined; H.wears = [];   // re-dress for real, whatever the avatar wore when it went wrong
    outfit();
    void failed;
  };
  const begin = () => {
    const J = AF.jobs; if (J && J.cur) J.cur.end('You clock off \u2014 there\u2019s a bigger job tonight.');
    H.on = true; H.cp = 0; H.failing = false; H.got = {}; H.bags = [false, false, false, false]; H.wears = []; H.mg = {}; H.minigamesDone = new Set(); H.cpGuns = null; H.cpGunsAt = -1;
    resetWorld(0); veraBlip(); sfx('jg_start'); enter(0, false);
  };
  const start = () => {
    if (H.on) return;
    if (wanted()) { sfx('ui_alert'); MI.shard('Wanted', 'Lose the police first \u2014 Vera won\u2019t talk business with heat on you', 'info', 2800); return; }
    if (crewN() < NEED && !H.solo) { note('The Harbour Trust Job needs a crew of two. Host a co-op game and bring a friend \u2014 or pick "Go alone".', 'warn'); return; }
    if (!host()) { send({ op: 'go' }, 0); return; }
    begin(); send({ op: 'st', i: H.i, cp: H.cp, g: [] });
  };
  const end = (ok, quiet) => {
    if (!H.on) return;
    H.on = false; H.i = -1; H.failing = false; H.after = null; H.later = null; H.cutting = false; hushVoices();
    if (MI.cut.on) MI.cut.finish(true);
    if (AF.mode === 'cctv' && AF.cctv) AF.cctv.close();
    if (AF.minigame && AF.minigame.open) AF.minigame.cancel();
    const C = CB(); if (C) { C.clearGoons(); if (C.unlend) C.unlend(); if (C.armor) C.armor(0, 'heist'); if (ok) C.clearWanted('Corsair Key keeps its secrets. The police lose the trail.'); }
    scene('none'); if (S) S.activate(null); if (HB && HB.ready) { HB.reset(); HB.night(false); }
    if (AF.den) { if (AF.den.setHatch) AF.den.setHatch(false); if (AF.den.setDrain) AF.den.setDrain(false); }
    dress(null); H.grip[0] = H.grip[1] = 0; H.bags = [false, false, false, false];
    if (HB && HB.roof) HB.roof(false);
    kitReset(); DRV.on = false; veraTo({ x: A.vera.x, y: A.vera.y, z: A.vera.z, yaw: A.veraYaw });
    if (H.vcar) { H.vcar.temp = true; H.vcar.mission = false; H.vcar = null; }
    if (AF.hud.meterCancel) AF.hud.meterCancel(); H.lifting = false;
    if (LN() && LN().openStaff) LN().openStaff(false);
    if (H.car) { H.car.temp = true; H.car.mission = false; H.car = null; }
    if (H.ride) { H.ride.temp = true; H.ride.mission = false; H.ride = null; }
    ccClear(); heliClear(); act4Tick(0); { const C1 = CB(); if (C1 && C1.jetMission) C1.jetMission(null); }
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
  const retry = () => { if (!H.on || H.failing) return; if (host()) { restore(H.cp); send({ op: 'rs', cp: H.cp }); } else send({ op: 'retry' }, 0); };
  H.start = start; H.retry = retry; H.quit = () => (host() ? finish(false) : send({ op: 'quit' }, 0));
  H.dbg = { IDX, ST, CPS, begin, enter, restore, skip: () => advance(H.i), solo: (on = true) => { H.solo = on; } };
  H.dbg.jump = (cp) => { if (!host()) return; if (!H.on) begin(); restore(cp); send({ op: 'rs', cp }); };
  // ---------------------------------------------------------------- skip (pause menu): the host closes the current step as if it were done
  // (granting the facts it earns); every client enters the next one and is moved near its objective behind the travel veil
  const SKIPGOT = { uniform: ['grille', 'uniform'], forger: ['papers'], gate: ['cleared'], follow: ['kitkey'], cache: ['cache'], lace: ['detOut'], sting: ['key'],
    army: ['crate'], haul: ['drop', 'launchers'], paint: ['paint'], park: ['wheels'], hack: ['hacked'], door: ['hatch'], keys: ['gate'], lasers: ['lasersOff'], drill: ['cage'], escape: ['exit'] };
  const NOMOVE = new Set(['fly', 'zoojump', 'bankjump', 'away', 'run', 'jets', 'carchase', 'chase']);
  const skipMove = () => {
    const s = ST[H.i]; if (!s || s.cut || NOMOVE.has(s.id) || AF.mode === 'dead') return;
    const m = s.mark ? s.mark() : null, at = m && Number.isFinite(m.x) ? { x: m.x, y: m.y, z: m.z, yaw: m.yaw || 0 } : s.cp != null ? CPS[s.cp].at() : null;
    if (!at || dist(me(), at) < 60) return;
    if (!Number.isFinite(at.y)) at.y = AF.W.groundY(at.x, at.z);
    goTo(at, tagOf(s) || 'the next step');
  };
  const skipStep = () => {
    if (!H.on || H.failing) return;
    if (!host()) { send({ op: 'skip', i: H.i }, 0); return; }
    const s = ST[H.i]; if (!s) return;
    if (MI.cut.on) MI.cut.finish(true);
    if (AF.minigame && AF.minigame.open) AF.minigame.cancel();
    if (AF.hud.meterCancel) AF.hud.meterCancel(); H.lifting = false; H.busy = false;
    const C = CB(); if (C) { C.clearWanted(); if (s.id === 'fight' || s.id === 'ambush') C.clearGoons(); if (s.id === 'jets' && C.jetMission) C.jetMission(null); }
    for (const k of SKIPGOT[s.id] || []) setGot(k);
    if (s.id === 'cash') for (let k = 0; k < 4; k++) if (!H.bags[k]) bag(k);
    if (s.id === 'lace') H.detGone = true;
    const kill = (list) => { if (S) for (const g of list) if (g && !g.down) S.knockOut(g, 0, 1, 'dead'); };
    if (s.id === 'snipe') kill(HB.roofGuards(true));
    if (s.id === 'zoosnipe') kill((HS.zooG || []).filter((g) => g.vantage));
    if (s.id === 'roofclear') kill(HB.roofGuards(false));
    if (s.id === 'carchase') { heliClear(); ccClear(); }
    if (s.id === 'chase') chaseClear();
    note('Skipped \u2014 ' + (tagOf(s) || s.line && lineOf(s).replace(/[{}]/g, '') || s.id) + '.', 'info');
    if (H.i + 1 >= ST.length) { finish(true); return; }
    enter(H.i + 1, false); send({ op: 'st', i: H.i, cp: H.cp, g: gotList(), sk: 1 });
    skipMove();
  };
  H.skip = skipStep;
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
    if (!H.minigamesDone) H.minigamesDone = new Set();
    H.minigamesDone.add(k);
    if (!remote) send({ op: 'got', k });
    if (['grille', 'papers', 'cache', 'key', 'hacked', 'hatch', 'cage', 'exit'].includes(k)) {
      sfx('jg_pass');
      note('Checkpoint saved \u2014 objective completed.', 'ok');
    }
    if (k === 'grille') { sfx('latch'); if (HS.grille) HS.grille(false); radio('vera.shop1'); }
    if (k === 'uniform') dress('pilot');
    if (k === 'cache') { const C = CB(); if (C && C.lend) C.lend('spistol', 60); note('Silenced pistols and a diamond-core drill. Headshots are quiet and final.', 'ok'); }
    if (k === 'key') { H.lifting = false; note('Prescott\u2019s key is yours.', 'ok'); }
    if (k === 'hacked') { radio('kestrel.in'); note('Kestrel tablet unlocked for the whole crew \u2014 open it for the bank\u2019s cameras, lights and locks.', 'ok'); }
    if (k === 'hatch') { radio('kestrel.hatch'); if (HB) HB.door('bulkhead', true); }
    if (k === 'exit') { radio('kestrel.exit'); if (HB && HB.exit) HB.exit(true); }
    if (k === 'lasersOff' && HB && HB.killLasers) HB.killLasers();
    if (k === 'wheels') radio('vera.drop');
    if (k === 'crate') { sfx('zip_bag'); if (HS.props.armyCrate) HS.props.armyCrate.visible = false; note('The crate of seeker launchers is in the car.', 'ok'); }
    if (k === 'drop') { sfx('zip_bag'); H.got.launchers = true; if (HS.props.dropCrate) HS.props.dropCrate.visible = true; note('Crate stashed by the fence. Now for Moretti\u2019s armoured car.', 'ok'); }
    if (k === 'paint' && H.car) respray(H.car);
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
    a.chase = e; if (AF.walkers && AF.walkers.revive) AF.walkers.revive(a);   // a fresh rider (54's lifecycle helper; chase riders aren't stealth guards)
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
    const c = ch ? { x: ch[0], z: ch[1] } : A.cove, base = ch ? Math.atan2(ch[0] - CV.x, ch[1] - CV.z) : 0, n = Math.min(8, 1 + 2 * crewN()), p = me();
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
    if (e.a) AF.walkers.kill(e.a, Math.sin(e.yaw), Math.cos(e.yaw), 2);
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
            // they fire forward-ish, need a clear line, and miss a lot more at a fast or unseen (off-screen) target
            const slot = TG[bi], ty = TG[bi + 2] + 0.9, fwd = (dx * Math.sin(e.yaw) + dz * Math.cos(e.yaw)) / d;
            if (fwd > -0.2 && AF.segClear(e.x, e.y + 1.35, e.z, tx, ty, tz)) {
              const sp = Math.hypot(tx - (e.lx ?? tx), tz - (e.lz ?? tz)) / Math.max(1e-3, CH.t - (e.lt ?? CH.t - 1));
              let pHit = AF.clamp(0.32 - d / 130 - sp / 70, 0.04, 0.3);
              if (slot === mySlot()) { V3.set(e.x, e.y + 1, e.z).project(AF.camera); if (V3.z > 1 || Math.abs(V3.x) > 1 || Math.abs(V3.y) > 1) pHit *= 0.3; }
              const hit = Math.random() < pHit;
              chaseTracer(e, tx, ty, tz, hit); e.fired = slot + 1;
              if (hit) { if (slot === mySlot()) { if (AF.health && !AF.health.dead) AF.health.hurt(5 + Math.round(Math.random() * 4), 'gun'); } else send({ op: 'chshot', d: 6 }, slot); }
            }
            e.lx = tx; e.lz = tz; e.lt = CH.t;
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
  const allUniformed = () => !!H.took.waiter && (crewN() < 2 || !!H.took.dealer) && (crewN() < 3 || secTaken() >= crewN() - 2) && crewSlots().every((s) => STAFFW.has(wears(s)));
  const uniformsLine = () => {
    if (myStingRole()) return crewN() > 1 ? 'Uniform on \u2014 wait for the rest of the crew to get theirs (' + crewSlots().filter((s) => STAFFW.has(wears(s))).length + '/' + crewN() + ')' : 'Uniform on';
    if (!H.took.waiter) return 'Knock out the {waiter} in the pantry' + (crewN() > 1 ? ', the {dealer} in the crew lounge' : '') + (crewN() > 2 ? ' or a {ship\u2019s officer}' : '') + ' and take the uniform \u2014 then hide the body';
    if (crewN() > 1 && !H.took.dealer) return 'Knock out the {dealer} in the crew lounge and take his vest \u2014 hide the body';
    return 'Take a {ship\u2019s officer} down from behind \u2014 quietly, out of sight \u2014 and borrow his uniform';
  };
  const secMark = () => { const p = me(); let b = null, bd = 1e9; for (const g of HS.secG || []) { if (H.took['sec' + HS.secG.indexOf(g)]) continue; const d = dist(p, g.a); if (d < bd) { bd = d; b = g.a; } } if (b) { SC.x = b.x; SC.y = b.y; SC.z = b.z; return SC; } return null; };
  // aboard the Queen: guns away (security shoots on sight)
  const holster = () => { const C = CB(); if (C && C.selectId && C.heldId && C.heldId !== 'fists' && C.heldId !== 'baton') { C.selectId('fists'); note('Put your gun away. Ship\u2019s security shoots on sight. Fists, baton and stealth only.', 'warn'); } };
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
    if (r === 'security') return H.pitHold > 0 ? 'Stand by the door and look official' : 'Have a word with the {pit boss} \u2014 keep his eyes off the table';
    return 'Help your crew lift {Prescott\u2019s key}';
  };
  const stingMark = () => { const r = myStingRole(); if (r === 'security') return H.pitHold > 0 ? null : HS.npc.pit; return r === 'dealer' && !H.dealing ? A.dealer : r === 'waiter' && !H.tray ? A.salonBar : A.prescott; };
  // the house detective trusts nobody but the waiter: the waiter brings him a laced drink, he feels unwell and goes to lie down,
  // and only then can the rest of the crew come up to the salon
  const laceLine = () => {
    const gone = !!H.got.detOut;
    if (myStingRole() === 'waiter') return gone ? 'The detective is feeling unwell \u2014 let him go to his cabin' : !H.laced ? 'Lace a drink for the {house detective} at the salon bar' : 'Serve the {house detective} his drink \u2014 he only trusts the waiter';
    return gone ? 'The detective is leaving the salon \u2014 hold on' : 'Wait outside the {salon door} \u2014 the house detective suspects everyone but the waiter';
  };
  const laceMark = () => {
    if (myStingRole() !== 'waiter') return A.salonDoor;
    if (H.got.detOut) return null;
    if (!H.laced) return A.salonBar;
    const g = HS.detG, a = g && g.a; if (!a) return null; const c = a.ctl || a; SC.x = c.x; SC.y = c.y; SC.z = c.z; return SC;
  };
  const detDrink = () => {
    const g = HS.detG; if (!is('lace') || !H.laced || H.got.detOut || !g || g.down) return;
    H.laced = false; sfx('glass'); speak('det.thanks', g.a); setGot('detOut');
  };
  // after a few sips he says he's unwell and walks out of the salon (the zone's authority steers him; the others see it over 'gs')
  const detTick = (dt) => {
    if (!is('lace') || !H.got.detOut || H.detGone) return;
    H.detT = (H.detT || 0) + dt;
    const g = HS.detG, a = g && g.a; if (!a || g.down) { H.detGone = true; scene('queen'); return; }
    if (H.detT < 4.5) return;
    if (!H.flag.detSaid) { H.flag.detSaid = true; speak('det.unwell', a); }
    if (H.detT < 8.5 || (S && online() && !S.isAuth())) return;
    if (!a.ctl) a.ctl = { x: a.x, y: a.y, z: a.z, yaw: a.yaw, moving: false, ph: a.ph || 0 };
    const c = a.ctl, T = A.salonDoor, dx = T.x - c.x, dz = T.z - c.z, d = Math.hypot(dx, dz);
    if (d < 0.7 || H.detT > 30) { c.moving = false; H.detGone = true; scene('queen'); return; }
    const st = Math.min(d, 0.85 * dt); c.x += dx / d * st; c.z += dz / d * st; c.yaw = Math.atan2(dx, dz); c.moving = true; c.ph += st * 4.2;
  };
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
    if (crewN() > 3 && !(H.pitHold > 0)) { note('Wait. The pit boss is watching. Your second officer has to distract him.', 'warn'); return; }
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
  const LASERS_OFF = { label: 'Lasers', value: 'off', ok: true };
  // the hacker's shutdown is permanent for the night: no beams drawn, no damage, no alarm (HB.killLasers + H.got.lasersOff)
  const cutLasers = (remote) => { if (H.got.lasersOff) return; if (HB) { if (HB.killLasers) HB.killLasers(); else HB.cutLasers(8); } H.got.lasersOff = true; if (!remote) send({ op: 'laser' }); radio('kestrel.laser'); applyNight(); };
  const camActions = () => {
    const out = [];
    if (!isAny(BANK) && !is('roofclear') && !is('escape')) return out;
    if (!H.got.hatch) out.push({ kind: 'mission', mission: true, label: 'Unlock the roof door', game: 'keypad', diff: 0.45, run: () => setGot('hatch') });
    if (is('keys') && !H.got.gate) out.push({ kind: 'mission', mission: true, label: H.lockT > 0 ? 'Time lock open \u2014 ' + Math.ceil(H.lockT) + ' s' : 'Override the time lock', game: 'circuit', diff: 0.6, disabled: H.lockT > 0, run: () => lockOn() });
    if ((is('lasers') || is('drill')) && !H.got.cage) out.push({ kind: 'mission', mission: true, label: H.got.lasersOff ? 'Lasers off' : 'Shut down the laser grid', game: 'flow', diff: 0.45, disabled: !!H.got.lasersOff, run: () => cutLasers() });
    if (S && S.zone && S.zone.alarm && S.zone.id === 'bank') out.push({ kind: 'mission', mission: true, label: 'Reset the alarm', game: 'signal', diff: 0.6, run: () => { S.act('reset', 0, 1); } });
    if (H.bags.every(Boolean) && !H.got.exit) out.push({ kind: 'mission', mission: true, label: 'Open the exit door', game: 'keypad', diff: 0.4, run: () => setGot('exit') });
    return out;
  };
  const openCams = (tablet) => {
    if (!AF.cctv || !H.got.hacked || AF.mode === 'cctv') return;
    if (S && (!S.zone || S.zone.id !== 'bank')) S.activate('bank');
    AF.cctv.open({ zone: 'bank', sit: !tablet, tablet: !!tablet, actions: camActions, feed: tablet ? 2 : 0 });
  };
  // the Kestrel tablet: everyone's once Kestrel is hacked, from the roof door to the getaway
  const tabletOk = () => H.on && H.got.hacked && ((is('roofclear') && !roofLeft()) || isAny(BANK) || is('escape')) && AF.mode === 'walk' && !(S && S.zone && S.zone.alarm && S.zone.seen);
  // the service ladder: climbed, rung by rung (a small 'climb' mode, no teleport)
  const CL = { o: null, y: 0, t: 0 };
  AF.modes.climb = {
    enter(o) { CL.o = o; CL.y = o.y0; CL.t = 0; const P = AF.player; P.teleport(o.x, o.y0, o.z, o.yaw); AF.interactTarget = null; },
    exit() { const P = AF.player; if (P.parts) { P.parts.armL.rotation.x = P.parts.armR.rotation.x = 0; } },
    update(dt) {
      const o = CL.o, I = AF.input, P = AF.player; if (!o) { AF.setMode('walk'); return; }
      const up = (I.key('KeyS') || I.key('ArrowDown') ? -1 : 1) * 1.7;
      CL.y = Math.max(o.y0, CL.y + up * dt); CL.t += dt * Math.abs(up);
      if (up < 0 && CL.y <= o.y0 + 0.01) { AF.setMode('walk', { x: o.x - Math.sin(o.yaw) * 0.8, y: o.y0, z: o.z - Math.cos(o.yaw) * 0.8, yaw: o.yaw + PI }); return; }
      if (CL.y >= o.y1) { AF.setMode('walk', { x: o.top.x, y: o.top.y, z: o.top.z, yaw: o.top.yaw, snap: true }); return; }
      P.x = o.x; P.y = CL.y; P.z = o.z;
      if (P.mesh) { P.mesh.position.set(o.x, CL.y, o.z); P.mesh.rotation.set(0, o.yaw, 0); }
      if (P.parts) { const s = Math.sin(CL.t * 3.4); P.parts.armL.rotation.x = -2.7 + s * 0.35; P.parts.armR.rotation.x = -2.7 - s * 0.35; if (P.parts.legL) { P.parts.legL.rotation.x = -0.5 - s * 0.4; P.parts.legR.rotation.x = -0.5 + s * 0.4; } }
      const c = AF.camera, bx = -Math.sin(o.yaw) * 3.6, bz = -Math.cos(o.yaw) * 3.6;
      c.position.set(o.x + bx, CL.y + 1.2, o.z + bz); AF.camTarget.set(o.x, CL.y + 1.3, o.z); c.lookAt(AF.camTarget); AF.shadowFocus.set(o.x, 0, o.z);
      if ((CL.t % 0.6) < dt * 1.8) sfx('step_concrete_0', { vol: 0.5 });
    },
  };
  const climbLadder = () => { const L = HB.spots.ladder; AF.setMode('climb', { x: L.x, z: L.z, y0: L.y, y1: HB.spots.ladderTop.y - 0.2, yaw: L.yaw ?? PI, top: HB.spots.ladderTop }); };
  const keypad = () => {
    if (H.got.hatch) return;
    if (!H.got.hacked) { note('A Kestrel keypad. Without the hack it won\u2019t take a code.', 'warn'); return; }

    if (H.busy) return; H.busy = true;
    play('keypad', { title: 'Roof door keypad', sub: 'Kestrel shows you the worn keys', diff: 0.35 }).then((r) => { H.busy = false; if (r && r.ok) setGot('hatch'); });
  };
  const KEYN = ['north', 'south'];
  const grip = (k, remote) => {
    if (!is('keys') || H.grip[k] > 0) return;
    if (!(H.lockT > 0)) { if (!remote) note('The time lock is engaged. Override it with the Kestrel tablet.', 'warn'); return; }
    H.grip[k] = GRIP; sfx('click_metal');
    if (!remote) { send({ op: 'grip', k }); if (!(H.grip[1 - k] > 0)) note('You turn the ' + KEYN[k] + ' key. ' + GRIP + ' seconds to turn the ' + KEYN[1 - k] + ' one!', 'ok'); }
    if (H.grip[0] > 0 && H.grip[1] > 0 && host()) setGot('gate');
  };
  const drill = () => {
    if (H.drilling || H.got.cage || !is('drill')) return;
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
    if (n === 4) { H.exitT = H.t; if (!H.got.exit) radio('vera.exit'); }
  };

  // ---------------------------------------------------------------- act V: the getaway
  const getaway = (restored) => {
    const C = CB(); if (C) C.crime(Math.max(0, 270 - C.heat));
    // the street exit beside the car stays shut (and solid) until the hacker opens it: setGot('exit')
    if (HB && HB.ready) { for (const d of ['hallEast', 'c4', 'gate']) HB.door(d, true); if (HB.exit) HB.exit(!!H.got.exit); }
    if (!restored) radio('vera.g1');
    const K = A.carSpot; if (!K || !VV || !VV.makeCar) return;
    if (H.car && !H.car.dead && !(restored && dist(H.car, K) > 10)) { H.car.armor = AF.G.armorCarK || 0.12; return; }
    if (H.car) { H.car.temp = true; H.car.mission = false; H.car = null; }
    // the armoured car from the farm (repainted), launchers in the boot; every client spawns its copy here (netKey-matched in co-op)
    H.car = armoredMake(K.x, K.z, K.yaw, 1); if (H.car) A.car = { x: H.car.x, y: H.car.y, z: H.car.z };
  };
      // Act IV prologue (midnight). wheels: Vera's car at the Motor Exchange (or any car) east into the desert; armycut + army: the army
      // stash on the Ochre Flats (stealth zone 'army'): a car brought right up to the crate loads the seeker launchers; haul: west across
      // the city to the drop outside Southfield Farm; farmcut + farm: on foot into Moretti's yard, and the moment anyone sits in the
      // armoured car the yard opens fire; carchase: Moretti throws everything at it — a dozen limousines with gunmen at the windows,
      // roadblocks with men on the road, then helicopters. The armoured car's back doors stand open on two mounted machine guns (endless
      // belts, they still reload); no police tonight (CB.noCops); the chase ends when the last helicopter is down. paint: Dusty's Respray on
      // the desert road (paintcut), park: Charter Street (nightcut). The armoured car (VV 'armored') is spawned by every client at the same
      // spot so co-op matches the copies by netKey; its hit points live with its driver's client ('chp' tells the crew, 'cdm' sends damage).
      const ARMOR_HP = 300, CC_TYPE = 'wagon', HELI_HP = 520;
      const NOCOP = new Set(['wheels', 'armycut', 'army', 'haul', 'farmcut', 'farm', 'carchase', 'paint', 'paintcut', 'park']);
      const wheelsType = () => { const T = VV.TYPES; const f = (id) => T.find((t) => t.id === id && t.kind === 'car'); return (f('duesy') || f('sport') || f('coupe') || T.find((t) => t.kind === 'car')).id; };
      const armoredMake = (x, z, yaw, paint) => {
        try { const car = VV.makeCar('armored', paint | 0, x, z, yaw, { y: AF.W.groundY(x, z) }); car.temp = false; car.parked = true; car.mission = true; car.armor = AF.G.armorCarK || 0.12; car.hp = ARMOR_HP; return car; }
        catch (e) { AF.warnOnce('heist armoured car', e); return null; }
      };
      // the armoured car waits on Charter Street through the night (a checkpoint after the respray puts it back there)
      const parkCar = () => {
        const K = A.carSpot; H.got.wheels = true; if (!K || !VV || !VV.makeCar || (H.car && !H.car.dead)) return;
        H.car = armoredMake(K.x, K.z, K.yaw, 1); if (H.car) A.car = { x: H.car.x, y: H.car.y, z: H.car.z };
      };
      const armoredSpawn = (force) => {
        if (!A.armor || !VV || !VV.makeCar) return;
        if (H.car && !H.car.dead && H.car.active !== false && !force) return;
        if (H.car) { H.car.temp = true; H.car.mission = false; H.car = null; }
        H.car = armoredMake(A.armor.x, A.armor.z, A.armor.yaw, 0);
      };
      const rideSpawn = (K, dx = 0, dz = 0) => {
        if (!K || !VV || !VV.makeCar) return;
        if (H.ride) { H.ride.temp = true; H.ride.mission = false; }
        try { const car = VV.makeCar(wheelsType(), 0, K.x + dx, K.z + dz, K.yaw || 0, K.y != null ? { y: K.y } : undefined); car.temp = false; car.parked = true; car.mission = true; H.ride = car; } catch (e) { AF.warnOnce('heist wheels', e); }
      };
      const wheels = (restored) => {
        scene('none');
        const C = CB(); if (C) C.clearWanted();
        if (!restored) radio('vera.army1');
        const K = A.wheelsSpot;
        if (K && (!H.ride || H.ride.dead || H.ride.active === false || (restored && dist(H.ride, K) > 10))) rideSpawn(K);
      };
      // a retry at the stash: Vera's car waits by the camp's gate
      const armyRide = () => { const K = A.armyGate; if (K && !(H.ride && !H.ride.dead && dist(H.ride, K) < 40)) rideSpawn(K, 7, 6); };
      const carNear = (p, r) => { if (!p) return null; for (const c of VV.cars) if (!c.dead && c.active !== false && !c.static && c.type && (c.type.kind === 'car' || c.type.kind === 'van') && dist(c, p) < r) return c; return null; };
      const loadCrate = () => {
        if (H.got.crate) return;
        if (!carNear(A.armyCrate, 9)) { note('It\u2019s far too heavy to carry \u2014 bring a car right up to the crate.', 'warn'); return; }
        setGot('crate');
      };
      const armyLine = () => {
        const z = S && S.zone && S.zone.id === 'army' ? S.zone : null;
        return z && z.alarm ? 'The soldiers are onto you! Get a car up to the {launcher crate} and load it' : 'Slip into the {army stash}, then bring a car right up to the {launcher crate} and load it';
      };
      const farmLine = () => (S && S.zone && S.zone.id === 'farm' && S.zone.alarm ? 'They know you\u2019re here! Get to the {armoured car} and get in' : 'Sneak into the yard and get into the {armoured car} \u2014 stay out of the guards\u2019 sight');

      // ---- the chase (host): limousines, roadblocks; helicopters run on every client (kills shared by index, 'hk')
      const CC = { list: [], on: false, t: 0, left: 0, helis: 0, spawnT: 0, blockT: 0, fleeT: 0, k: 0 };
      const ccMax = () => Math.min(20, 12 + 3 * crewN());
      const heliN = () => Math.min(5, 2 + crewN());
      const isChaser = (c) => !!c && !c.dead && c.type && c.type.id === CC_TYPE && (host() ? !!c.chaser : c.net === 0 && isAny(CHASE));
      const ccClear = () => {
        for (const c of CC.list) { c.chaser = null; c.netOwned = false; c.mission = false; c.hostile = false; c.temp = true; if (!c.dead) { c.parked = true; c.v = c.vx = c.vz = 0; } }
        CC.list.length = 0; CC.on = false; CC.left = 0; CC.fleeT = 0; rbClear(); mineClear();
      };
      const ccPlace = (c, T, k, n, tries) => {
        const hy = T.yaw || 0;
        for (let t = 0; t < tries; t++) {
          const a = hy + PI + (k % 5 - 2) * 0.3 + (t % 2 ? 1 : -1) * Math.ceil(t / 2) * 0.22, r = 70 + (t % 3) * 15 + (k % 4) * 6;
          const x = T.x + Math.sin(a) * r, z = T.z + Math.cos(a) * r, y = AF.W.groundY(x, z);
          if (!Number.isFinite(y) || (AF.PL.waterAt && AF.PL.waterAt(x, z) > y + 0.3)) continue;
          if (VV.carBlocked({ halfL: 2.9, halfW: 1, height: 1.6, y }, x, z, a + PI)) continue;
          if (c) { c.x = x; c.z = z; c.y = y; c.yaw = Math.atan2(T.x - x, T.z - z); c.v = Math.abs(T.v || 0) * 0.8; c.vx = c.vz = 0; VV.placeMesh(c); return c; }
          return { x, z, y, yaw: Math.atan2(T.x - x, T.z - z) };
        }
        return null;
      };
      const ccSpawn = (T) => {
        const k = CC.k++, p = ccPlace(null, T, k, 1, 14); if (!p) return null;
        try {
          const c = VV.makeCar(CC_TYPE, 0, p.x, p.z, p.yaw, { y: p.y });
          c.temp = false; c.mission = true; c.netOwned = true; c.hostile = true; c.parked = false; c.vx = c.vz = 0; c.hp = 150;
          c.chaser = { k, stuck: 0, rev: 0, fireT: 1.5 + (k % 5) * 0.6, burst: 0, side: k % 2 ? 1 : -1, farT: 0, back: 2.5 + (k % 4) * 5, cut: false };
          CC.list.push(c); return c;
        } catch (e) { AF.warnOnce('heist chaser', e); return null; }
      };
      const ccStart = () => {
        ccClear(); CC.on = true; CC.t = 0; CC.spawnT = 0; CC.blockT = 14; CC.k = 0; MN.t = 8;
        const T = H.car && !H.car.dead ? H.car : me();
        for (let k = 0; k < 8; k++) ccSpawn(T);
        CC.left = CC.list.length; send({ op: 'cc', n: CC.left });
      };
      // damage the armoured car by n real hit points: on the client that drives it (that one simulates the car), else a 'cdm' to the crew
      const armorHurt = (n) => { const C = CB(), c = H.car; if (!C || !c || c.dead) return; if (c.net == null) C.dmgCar(c, n / (c.armor || 1), false); else send({ op: 'cdm', d: n }); };
      const riding = () => { const v = rideVeh(); return AF.mode === 'passenger' && !!v && (v === H.car || !!v.armor); };
      // the crew at the open back doors catch some of it (the cab is armoured: drivers don't); never too much
      const crewHit = (p, n, remote) => {
        if (!remote) send({ op: 'cph', p, n });
        if (riding() && Math.random() < p && AF.health) { AF.health.hurt(n, 'shot'); if (AF.camfx) AF.camfx.shake(0.02, 0.2); }
      };
      const gunPos = (c, T, out) => {
        const s = Math.sin(c.yaw), co = Math.cos(c.yaw), lx = (T.x - c.x) * co - (T.z - c.z) * s, side = lx >= 0 ? 1 : -1, sz = side > 0 ? -0.95 : 0.15;
        out.x = c.x + co * 1.25 * side + s * sz; out.y = c.y + 1.35; out.z = c.z - s * 1.25 * side + co * sz; return out;
      };
      const GP = { x: 0, y: 0, z: 0 };
      const ccShot = (c, T, d, real) => {
        const C = CB(), hit = Math.random() < (d < 20 ? 0.18 : d < 40 ? 0.12 : 0.07), sc = hit ? 0.8 : 4;
        const ex = T.x + (Math.random() - 0.5) * sc, ey = T.y + 1 + (Math.random() - 0.5) * (hit ? 0.5 : 2), ez = T.z + (Math.random() - 0.5) * sc;
        gunPos(c, T, GP);
        if (C && C.tracer) C.tracer(GP.x, GP.y, GP.z, ex, ey, ez, 1);
        if (AF.fx && Math.random() < 0.6) AF.fx.burst('flash', GP.x, GP.y, GP.z, 1, { size: 0.3 });
        if (AF.audio && Math.random() < 0.5) AF.audio.play('smg', { x: c.x, y: c.y + 1.3, z: c.z, vol: 0.8 });
        if (hit) { if (AF.fx) AF.fx.burst('spark', ex, ey, ez, 2, { spread: 4 }); if (real) { armorHurt(1.2); crewHit(0.12, 3); } }
      };
      const CC_IN = { up: false, down: false, left: 0, right: 0, brake: false, thr: 1 };
      const ccTick = (dt) => {
        if (!CC.list.length && !CC.on) return;
        const flee = !is('carchase');
        if (flee) { if ((CC.fleeT += dt) > 12 || !(is('paint') || is('paintcut'))) { ccClear(); return; } }
        CC.t += dt;
        const T = H.car; let left = 0;
        // keep the pressure on: fresh limousines roll in (out of the crew's sight) until the helicopters are down
        if (!flee && T && !T.dead && (CC.spawnT -= dt) <= 0) {
          CC.spawnT = 1.2; let alive = 0; for (const c of CC.list) if (c.chaser && !c.dead && !(c.burnT > 0)) alive++;
          if (alive < ccMax()) ccSpawn(T);
          for (let i = CC.list.length - 1; i >= 0; i--) { const c = CC.list[i]; if (c.dead && AF.clock.t - (c.deadT || 0) > 25) { c.chaser = null; c.netOwned = false; c.mission = false; c.temp = true; CC.list.splice(i, 1); } }
        }
        for (const c of CC.list) {
          const Q = c.chaser; if (!Q || c.dead || c.active === false) continue;
          if (c.burnT > 0) { if (!Q.cut) { Q.cut = true; c.burnT = Math.min(c.burnT, 0.35); } continue; }
          if (!(c.hp > 0)) continue;
          left++;
          if (!T || T.dead) continue;
          const tv = T.v || 0, hx = Math.sin(T.yaw), hz = Math.cos(T.yaw), d = Math.hypot(T.x - c.x, T.z - c.z), close = d < 26, lead = Math.min(16, Math.abs(tv) * 0.5);
          let px, pz;
          if (flee) { const k = 60 / (d || 1); px = c.x + (c.x - T.x) * k; pz = c.z + (c.z - T.z) * k; }
          else { px = close ? T.x + hz * 3.6 * Q.side - hx * Q.back : T.x + hx * lead; pz = close ? T.z - hx * 3.6 * Q.side - hz * Q.back : T.z + hz * lead; }
          let diff = AF.angDiff(c.yaw, Math.atan2(px - c.x, pz - c.z));
          if (Q.rev > 0) { Q.rev -= dt; diff = -diff; }
          CC_IN.left = diff > 0.04 ? Math.min(1, diff * 2.2) : 0; CC_IN.right = diff < -0.04 ? Math.min(1, -diff * 2.2) : 0;
          const want = flee ? 30 : close ? Math.abs(tv) + (Math.hypot(px - c.x, pz - c.z) > 3 ? 4 : 0) : 99;
          CC_IN.up = Q.rev <= 0 && c.v < want; CC_IN.down = Q.rev > 0; CC_IN.brake = Q.rev <= 0 && c.v > want + 2.5;
          if (CC_IN.up && Math.abs(c.v) < 0.6) { if ((Q.stuck += dt) > 1.4) { Q.stuck = 0; Q.rev = 1.1; } } else Q.stuck = 0;
          const n = d < 90 ? Math.min(3, Math.ceil(dt * 60 - 0.01)) || 1 : 1; for (let i = 0; i < n; i++) VV.physics(c, dt / n, CC_IN);
          VV.placeMesh(c); if (c.interact) c.sync();
          // fell far behind and out of sight: they always find the car again (out of view of the crew)
          if (!flee && d > 230) { if ((Q.farT += dt) > 5 && AF.camera.position.distanceTo(c) > 120) { Q.farT = 0; ccPlace(c, T, Q.k, CC.list.length, 10); } } else Q.farT = 0;
          // the gunmen lean out of the windows: bursts at the armoured car with a clear line
          if (!flee && (Q.fireT -= dt) <= 0) {
            if (d < 60 && AF.segClear(c.x, c.y + 1.4, c.z, T.x, T.y + 1.1, T.z)) {
              if (Q.burst <= 0) Q.burst = 4 + ((Math.random() * 4) | 0);
              Q.burst--; Q.fireT = Q.burst > 0 ? 0.12 : 1.6 + Math.random() * 1.4;
              ccShot(c, T, d, true);
            } else Q.fireT = 0.4;
          }
        }
        if (!flee && left !== CC.left) { CC.left = left; send({ op: 'cc', n: left }); }
        if (!flee) { rbTick(dt); mineSpawnTick(dt); }
      };
      // a crewmate's view: the host's limousines arrive as remote cars; their gunfire is drawn here too (damage comes from the host)
      let ccFxT = 0;
      const ccGuestFx = (dt) => {
        if (host() || !is('carchase') || (ccFxT -= dt) > 0) return; ccFxT = 0.16;
        const me0 = curCar() || H.car; if (!me0) return;
        for (const c of VV.cars) if (isChaser(c) && !(c.burnT > 0) && Math.random() < 0.3) { const d = Math.hypot(c.x - me0.x, c.z - me0.z); if (d < 60) ccShot(c, me0, d, false); }
      };
      const ccLeftN = () => (host() ? CC.left : H.ccLeft == null ? 6 : H.ccLeft);
      // ---- roadblocks: two limousines across the road ahead of the armoured car and three men on the tarmac (host)
      const RB = { cars: [], at: null, t: 0 };
      const rbClear = () => { for (const c of RB.cars) { c.netOwned = false; c.mission = false; c.temp = true; c.rb = false; } RB.cars.length = 0; RB.at = null; const C = CB(); if (C) C.clearGoons(); };
      const rbStart = (T) => {
        if (!T || Math.abs(T.v || 0) < 8 || !VV || !VV.makeCar) return false;
        const hx = Math.sin(T.yaw), hz = Math.cos(T.yaw), d = 150 + Math.min(80, Math.abs(T.v) * 2);
        let px = T.x + hx * d, pz = T.z + hz * d, yaw = T.yaw;
        const k = kerbAt(px, pz); if (k && Math.hypot(k.cx - px, k.cz - pz) < 25) { px = k.cx; pz = k.cz; yaw = Math.abs(AF.angDiff(k.yaw, T.yaw)) < PI / 2 ? k.yaw : k.yaw + PI; }
        const y = AF.W.groundY(px, pz); if (!Number.isFinite(y) || (AF.PL.waterAt && AF.PL.waterAt(px, pz) > y + 0.3)) return false;
        const nx = Math.cos(yaw), nz = -Math.sin(yaw), fx = Math.sin(yaw), fz = Math.cos(yaw);
        rbClear();
        for (const [o, a] of [[-2.4, 0], [2.8, 7], [0.2, -6]]) {
          try { const c = VV.makeCar(CC_TYPE, 1, px + nx * o + fx * a, pz + nz * o + fz * a, yaw + PI / 2, { y }); c.temp = false; c.mission = true; c.parked = true; c.netOwned = true; c.rb = true; c.hp = 120; RB.cars.push(c); } catch (e) { AF.warnOnce('heist roadblock', e); }
        }
        const C = CB(); if (C && C.spawnGoon) for (let i = 0; i < 4; i++) { const gx = px + nx * (i - 1.5) * 4 - fx * 3, gz = pz + nz * (i - 1.5) * 4 - fz * 3, gy = AF.W.groundY(gx, gz); if (Number.isFinite(gy)) C.spawnGoon(gx, gy, gz, { weapon: i === 1 ? 'tommy' : 'smg', hp: 90, name: 'Moretti', role: 'hold' }); }
        RB.at = { x: px, z: pz }; RB.t = 0; radio('vera.block', true);
        return true;
      };
      const rbTick = (dt) => {
        const T = H.car; if (!T || T.dead) return;
        if (RB.at) { RB.t += dt; const fx = Math.sin(T.yaw), fz = Math.cos(T.yaw), ahead = (RB.at.x - T.x) * fx + (RB.at.z - T.z) * fz; if (RB.t > 45 || (ahead < -90 && Math.hypot(RB.at.x - T.x, RB.at.z - T.z) > 90)) rbClear(); }
        else if ((CC.blockT -= dt) <= 0) CC.blockT = rbStart(T) ? 20 : 4;
      };
      // ---- mines: the host lays them across the road ahead of the armoured car ('mn'); the client that owns the car sets them off
      // (heavy damage) and tells the crew ('mx'). One instanced draw (81-heist-act4's kit), only while any are down.
      const MN = { list: [], k: 0, t: 8, said: false, hitT: -99, M: new THREE.Matrix4() };
      const MINE_DMG = 45, MINE_R = 2.3;
      const mineClear = () => { MN.list.length = 0; MN.said = false; const X4 = AF.act4; if (X4 && X4.mineReady) { const im = X4.mines(); im.count = 0; im.visible = false; } MN.drawn = false; };
      const mineAdd = (k, x, z, remote) => {
        const y = AF.W.groundY(x, z); if (!Number.isFinite(y) || MN.list.length >= 16) return;
        MN.list.push({ k, x, y, z, t: 0 }); if (!remote) send({ op: 'mn', k, x: +x.toFixed(1), z: +z.toFixed(1) });
      };
      const mineGone = (k, boom, remote) => {
        const i = MN.list.findIndex((m) => m.k === k); if (i < 0) return; const m = MN.list[i]; MN.list.splice(i, 1);
        if (boom && AF.fx) { AF.fx.boom(m.x, m.y + 0.3, m.z, 1.3); AF.fx.burst('spark', m.x, m.y + 0.5, m.z, 20, { spread: 10 }); }
        if (!remote) send({ op: 'mx', k, b: boom ? 1 : 0 });
      };
      // host: a row of two or three mines across the road 90-140 m ahead, a gap left to weave through
      const mineSpawnTick = (dt) => {
        const T = H.car; if (!T || T.dead || (MN.t -= dt) > 0) return;
        MN.t = 6 + Math.random() * 4; if (Math.abs(T.v || 0) < 6) { MN.t = 2; return; }
        const hx = Math.sin(T.yaw), hz = Math.cos(T.yaw), d = 90 + Math.random() * 50; let px = T.x + hx * d, pz = T.z + hz * d, nx = Math.cos(T.yaw), nz = -Math.sin(T.yaw), w = 7;
        const k = kerbAt(px, pz); if (k && Math.hypot(k.cx - px, k.cz - pz) < 25) { px = k.cx; pz = k.cz; nx = k.nx; nz = k.nz; w = Math.max(5, k.road.w * 0.5 - 1); }
        const gap = (Math.random() * 3) | 0, offs = [-w * 0.6, 0, w * 0.6];
        for (let i = 0; i < 3; i++) if (i !== gap || Math.random() < 0.25) mineAdd(++MN.k, px + nx * offs[i], pz + nz * offs[i]);
        for (let i = MN.list.length - 1; i >= 0; i--) { const m = MN.list[i]; if (AF.clock.t - (m.born || (m.born = AF.clock.t)) > 70) mineGone(m.k, false); }
      };
      // every client: draw them, warn once, and the car's owner (or the host for a chaser) sets them off
      const mineTick = (dt) => {
        const X4 = AF.act4; if (!MN.list.length && !MN.drawn) return;
        const c = H.car, own = !!c && !c.dead && c.net == null;
        let n = 0;
        for (let i = MN.list.length - 1; i >= 0; i--) {
          const m = MN.list[i]; m.t += dt;
          if (own && Math.hypot(c.x - m.x, c.z - m.z) < MINE_R && Math.abs(c.y - m.y) < 2) {
            mineGone(m.k, true); armorHurt(MINE_DMG); if (AF.camfx) AF.camfx.shake(0.06, 0.7); c.v *= 0.55;
            if (AF.clock.t - MN.hitT > 14) { MN.hitT = AF.clock.t; radio('vera.mine2', true); } continue;
          }
          if (host()) { let blown = false; for (const q of CC.list) if (q.chaser && !q.dead && Math.hypot(q.x - m.x, q.z - m.z) < MINE_R) { const C = CB(); if (C) C.dmgCar(q, 999); blown = true; break; } if (blown) { mineGone(m.k, true); continue; } }
          if (!MN.said && c && Math.hypot(c.x - m.x, c.z - m.z) < 160) { MN.said = true; radio('vera.mine1', true); }
        }
        if (!X4 || !X4.mineReady) return;
        const im = X4.mines();
        for (const m of MN.list) { if (n >= 16) break; MN.M.makeRotationY(m.k).setPosition(m.x, m.y + 0.02, m.z); im.setMatrixAt(n++, MN.M); }
        if (im.count !== n || n) { im.count = n; im.instanceMatrix.needsUpdate = true; }
        im.visible = n > 0; MN.drawn = n > 0;
      };
      // ---- the gunners: everyone riding along in the armoured car during the chase stands on the gun step in its back, head and
      // shoulders up through the open roof hatch, with a minigun; the camera sits over their shoulder, looking back by default, and the
      // mouse aims all round (the aim holds while the car turns): nothing of the car is in the way of a shot
      const GUN = { yaw: 0, pitch: 0.1, veh: null, seat: { x: 0, y: 0, z: 0, yaw: 0, pitch: 0, roll: 0, stand: true, seatH: 0, lean: 0 }, look: new THREE.Vector3() };
      const STAND = [null, [0.5, 1.7, -1.55], [-0.5, 1.7, -1.55], [0, 1.7, -0.9]];
      const isHeistCar = (v) => !!v && (v === H.car || !!v.armor || !!(v.type && v.type.id === 'armored'));
      const standSeat = (v, seat) => (H.on && is('carchase') && seat >= 1 && isHeistCar(v) ? STAND[Math.min(3, seat)] : null);
      const standHook = (v, seat, dt, P) => {
        const l = standSeat(v, seat); if (!l) { GUN.veh = null; return false; }
        if (GUN.veh !== v) { GUN.veh = v; GUN.yaw = v.yaw + PI; GUN.pitch = -0.06; }
        const s = Math.sin(v.yaw), co = Math.cos(v.yaw), S = GUN.seat;
        S.x = v.x + co * l[0] + s * l[2]; S.y = v.y + (v.bob || 0) + l[1]; S.z = v.z - s * l[0] + co * l[2]; S.yaw = GUN.yaw; AF.PL.seat = S;
        P.x = P.body.x = S.x; P.y = P.body.y = S.y; P.z = P.body.z = S.z; P.body.vy = 0;
        const m = AF.input.mouse, aim = AF.Vehicle.aim;
        if (!(AF.ui.modalOpen && AF.ui.modalOpen()) && (document.pointerLockElement || (m.buttons & 1)) && (m.dx || m.dy)) { const k = aim ? 0.7 : 1; GUN.yaw -= m.dx * 0.006 * k; GUN.pitch = AF.clamp(GUN.pitch - m.dy * 0.004 * k, -0.5, 1.2); }
        const cp = Math.cos(GUN.pitch), dx = Math.sin(GUN.yaw) * cp, dy = Math.sin(GUN.pitch), dz = Math.cos(GUN.yaw) * cp, rx = -Math.cos(GUN.yaw), rz = Math.sin(GUN.yaw);
        const dist0 = aim ? 2.0 : 3.0, side = aim ? 0.6 : 0.65, hx = S.x, hy = S.y + 1.65, hz = S.z, cam = AF.camera;
        cam.position.set(hx - dx * dist0 + rx * side, Math.max(hy - dy * dist0 + (aim ? 0.7 : 1.15), v.y + 3.3), hz - dz * dist0 + rz * side);
        GUN.look.set(cam.position.x + dx * 20, cam.position.y + dy * 20, cam.position.z + dz * 20);
        cam.up.set(0, 1, 0); cam.lookAt(GUN.look); if (AF.camTarget) AF.camTarget.copy(GUN.look);
        AF.shadowFocus.set(v.x, v.y, v.z); AF.shadowRadius = 60;
        if (AF.player.mesh) AF.player.mesh.visible = AF.player.visible !== false;
        return true;
      };
      if (AF.coop) { AF.coop.standSeat = standSeat; AF.coop.standHook = standHook; }
      // ---- the adrenaline: Vera and Tony on the radio while the chase is on (a line every 20-30 s; one when a limousine goes up)
      const HYPE = ['vera.cc3', 'tony.cc2', 'vera.cc4', 'tony.cc3'], HY = { i: 0, t: 18, boomT: -99 };
      const hypeTick = (dt) => {
        if (!is('carchase') || talking()) return;
        if ((HY.t -= dt) > 0) return;
        HY.t = 20 + Math.random() * 10; radio(HYPE[HY.i++ % HYPE.length]);
      };
      // ---- Moretti's helicopters (every client runs its own copies; kills are shared by index)
      const HE = { list: [], on: false };
      const helisLeft = () => { let n = 0; for (const h of HE.list) if (h.on && !h.fall) n++; return n; };
      const heliTarget = () => (H.car && !H.car.dead ? H.car : me());
      const heliClear = () => { for (const h of HE.list) { h.on = false; h.xt.on = false; if (h.v) h.v.grp.visible = false; } HE.list.length = 0; HE.on = false; CC.helis = 0; const C = CB(); if (C && C.xt) C.xt.length = 0; };
      const heliDown = (h, remote) => {
        if (!h.on || h.fall) return;
        h.fall = true; h.vy = 0; h.xt.on = false; if (AF.fx) AF.fx.boom(h.x, h.y + 1, h.z, 1.4);
        if (!remote) send({ op: 'hk', k: h.k });
        const n = helisLeft(); radio(n ? 'vera.heli2' : 'vera.cc2', true); note(n ? 'Helicopter down \u2014 ' + n + ' to go.' : 'The sky is clear!', 'ok');
      };
      const heliStart = () => {
        heliClear(); const X4 = AF.act4; if (!X4 || !X4.heli) return;
        const n = heliN(), T = heliTarget(), C = CB();
        for (let k = 0; k < n; k++) {
          const v = X4.heli(k), a = k / n * PI * 2 + 0.6;
          const h = { k, v, on: true, fall: false, hp: HELI_HP, x: T.x + Math.sin(a) * 240, y: T.y + 70, z: T.z + Math.cos(a) * 240, yaw: 0, vx: 0, vz: 0, vy: 0, a, dir: k % 2 ? 1 : -1, cd: 4 + k * 1.3, burst: 0, xt: null };
          h.xt = { on: true, x: h.x, y: h.y + 1.6, z: h.z, r: 3.4, hit: (dmg) => { if (!h.on || h.fall) return; h.hp -= dmg; if (AF.fx) AF.fx.burst('smoke', h.x, h.y + 1.5, h.z, 1); if (h.hp <= 0) heliDown(h, false); } };
          if (C && C.xt) C.xt.push(h.xt);
          v.grp.visible = true; HE.list.push(h);
        }
        HE.on = true; CC.helis = n; radio('vera.heli1', true); sfx('jg_spot');
      };
      const HT = { x: 0, y: 0, z: 0 };
      const heliTick = (dt) => {
        if (!HE.list.length) return;
        const T = heliTarget(), own = !!H.car && H.car.net == null && (VV.player === H.car || host()), C = CB();
        for (const h of HE.list) {
          if (!h.on) continue;
          const gy = AF.W.groundY(h.x, h.z);
          if (h.fall) {
            h.vy -= 9.8 * dt; h.y += h.vy * dt; h.x += h.vx * dt; h.z += h.vz * dt; h.yaw += dt * 5; if (AF.fx && Math.random() < 0.5) AF.fx.burst('smoke', h.x, h.y + 1, h.z, 1, { size: 1.6 });
            if (h.y <= (Number.isFinite(gy) ? gy : 0) + 0.5) { if (AF.fx) AF.fx.boom(h.x, h.y, h.z, 2.2); h.on = false; h.v.grp.visible = false; }
          } else {
            h.a += dt * 0.3 * h.dir;
            const R = 38 + (h.k % 3) * 8, tx = T.x + Math.sin(h.a) * R, tz = T.z + Math.cos(h.a) * R, ty = Math.max(T.y, Number.isFinite(gy) ? gy : 0) + 20 + (h.k % 2) * 6;
            const dx = tx - h.x, dz = tz - h.z, d = Math.hypot(dx, dz) || 1, sp = Math.min(46, d * 0.9);
            h.vx += (dx / d * sp - h.vx) * Math.min(1, dt * 1.4); h.vz += (dz / d * sp - h.vz) * Math.min(1, dt * 1.4);
            h.x += h.vx * dt; h.z += h.vz * dt; h.y += (ty - h.y) * Math.min(1, dt * 0.9);
            h.yaw += AF.angDiff(h.yaw, Math.atan2(T.x - h.x, T.z - h.z)) * Math.min(1, dt * 1.5);
            // the door gunner: bursts at the armoured car with a clear line
            if ((h.cd -= dt) <= 0) {
              const d3 = Math.hypot(T.x - h.x, T.y - h.y, T.z - h.z);
              if (d3 < 120 && AF.segClear(h.x, h.y + 0.6, h.z, T.x, T.y + 1.4, T.z)) {
                if (h.burst <= 0) h.burst = 6;
                h.burst--; h.cd = h.burst > 0 ? 0.11 : 2.6 + Math.random() * 1.6;
                const hit = Math.random() < 0.15, sc = hit ? 0.6 : 5, ex = T.x + (Math.random() - 0.5) * sc, ey = T.y + 1.2 + (hit ? 0 : (Math.random() - 0.5) * 2), ez = T.z + (Math.random() - 0.5) * sc;
                const gx = h.x + Math.cos(h.yaw) * 1.4, gz = h.z - Math.sin(h.yaw) * 1.4;
                if (C && C.tracer) C.tracer(gx, h.y + 1.2, gz, ex, ey, ez, 2);
                if (AF.fx) { AF.fx.burst('flash', gx, h.y + 1.2, gz, 1, { size: 0.4 }); if (hit) AF.fx.burst('spark', ex, ey, ez, 2, { spread: 4 }); }
                if (AF.audio && h.burst % 2 === 0) AF.audio.play('lmg', { x: h.x, y: h.y, z: h.z, vol: 0.7 });
                if (hit) { if (own) armorHurt(1.5); if (riding() && Math.random() < 0.25 && AF.health) { AF.health.hurt(3, 'shot'); if (AF.camfx) AF.camfx.shake(0.02, 0.2); } }
              } else h.cd = 0.5;
            }
          }
          h.xt.x = h.x; h.xt.y = h.y + 1.6; h.xt.z = h.z;
          const g = h.v.grp; g.position.set(h.x, h.y, h.z);
          const fwd = h.vx * Math.sin(h.yaw) + h.vz * Math.cos(h.yaw), side = h.vx * Math.cos(h.yaw) - h.vz * Math.sin(h.yaw);
          g.rotation.set(h.fall ? 0.4 : AF.clamp(fwd * 0.012, -0.3, 0.3), h.yaw, h.fall ? 0.5 : AF.clamp(-side * 0.015, -0.4, 0.4));
          h.v.rotor.rotation.y += dt * 26; h.v.tail.rotation.x += dt * 30;
        }
        if (AF.audio) { let best = null, bd = 1e9; for (const h of HE.list) if (h.on) { const d = dist(me(), h); if (d < bd) { bd = d; best = h; } } AF.audio.hold('heist-heli', 'heli_loop', best ? 1 : 0, 1, best && best.x, best && best.y, best && best.z); }
      };
      const ccEnter = (restored) => {
        if (S && S.zone && S.zone.id === 'farm' && !S.zone.alarm && S.requestAlarm) S.requestAlarm('Somebody is stealing the boss\u2019s car!');
        heliClear(); CC.t = 0; H.carHp = null;
        if (host()) ccStart();
        if (!restored) { radio('tony.farm', true); radio('tony.cc', true); radio('vera.cc1'); }
      };
      const ccLine = () => {
        const hl = helisLeft();
        if (HE.on && hl) return 'Moretti\u2019s helicopters! Shoot them down with the miniguns \u2014 ' + hl + ' left' + (crewN() > 1 ? ', driver keeps moving' : '');
        return 'Moretti\u2019s whole crew is after the armoured car \u2014 ' + (crewN() > 1 ? 'driver, dodge the mines and keep moving; everyone else on the miniguns in the back' : 'dodge the mines, keep moving and shoot back') + ' (' + ccLeftN() + ' cars)';
      };
      const ccMark = () => {
        let b = null, bd = 1e9; const p = me();
        for (const h of HE.list) if (h.on && !h.fall) { const d = dist(p, h); if (d < bd) { bd = d; b = h; } }
        if (b) { SC.x = b.x; SC.y = b.y + 2; SC.z = b.z; return SC; }
        for (const c of host() ? CC.list : VV.cars) if (isChaser(c) && !(c.burnT > 0)) { const d = dist(p, c); if (d < bd) { bd = d; b = c; } }
        if (b) { SC.x = b.x; SC.y = b.y + 1.6; SC.z = b.z; return SC; }
        return null;
      };
      const ccOver = () => CC.on && CC.t > 25 && HE.on && helisLeft() === 0;
      // hip fire from a seat finds the limousines and the helicopters (77 CB.seatTargets)
      const seatTargets = () => {
        if (!H.on || !isAny(CHASE)) return null;
        const out = [];
        for (const h of HE.list) if (h.on && !h.fall) out.push(h.xt);
        for (const c of host() ? CC.list : VV.cars) if (isChaser(c) && !(c.burnT > 0)) out.push({ x: c.x, y: c.y + 1.0, z: c.z });
        return out;
      };
      // a limousine (or a roadblock car) going up: a violent blast that throws the wreck over
      const onBoom = (car) => {
        if (!H.on || !(car.chaser || car.rb || (car.type && car.type.id === CC_TYPE && isAny(CHASE)))) return;
        car.roll = (Math.random() < 0.5 ? -1 : 1) * (1.3 + Math.random() * 1.5); car.pitch = (Math.random() - 0.5) * 0.9; car.y += 0.5; VV.placeMesh(car);
        if (AF.fx) { AF.fx.boom(car.x, car.y + 0.6, car.z, 1.3); AF.fx.burst('spark', car.x, car.y + 1.2, car.z, 30, { spread: 18 }); }
        if (is('carchase') && AF.clock.t - HY.boomT > 25 && !talking()) { HY.boomT = AF.clock.t; radio('vera.cc5'); }
      };
      // the respray (on every client: the crew's copies all change colour) — new paint, patched plating
      const respray = (car) => {
        const T = car.type, n = T.paints.length, pi = ((+String(car.key).split(':')[1] || 0) + 1) % n;
        car.key = VV.getGeo(T, pi).key; car.hp = Math.max(car.hp || 0, ARMOR_HP); car.dmg = 0; H.carHp = null;
        if (AF.fx) AF.fx.burst('steam', car.x, car.y + 1.2, car.z, 10, { spread: 2.5 });
        sfx('ui_check'); note('Fresh paint and patched plating \u2014 nobody will know it.', 'ok');
        const C = CB(); if (C && C.stars) C.clearWanted();
      };
      const inGarage = (c) => { const b = A.garageBox; return !!b && c.x > b[0] && c.x < b[2] && c.z > b[1] && c.z < b[3]; };
      // the gunmen in the limousines (one instanced draw per pose), the armoured car's open back with its guns, the HP bar, the crew's guns
      const GM = new THREE.Matrix4(), GV3 = new THREE.Vector3();
      const menTick = () => {
        const X4 = AF.act4, K = X4 && X4.gunmen ? X4.gunmen() : null; if (!K) return;
        let nd = 0, ng = 0;
        if (isAny(CHASE)) {
          const T = heliTarget();
          for (const c of host() ? CC.list : VV.cars) {
            if (!isChaser(c) || c.burnT > 0 || c.rb) continue;
            const s = Math.sin(c.yaw), co = Math.cos(c.yaw), y = c.y + (c.bob || 0);
            if (nd < 24) { const L = K.wheel; GM.makeRotationY(c.yaw).setPosition(c.x + co * L[0] + s * L[2], y + L[1], c.z - s * L[0] + co * L[2]); K.driver.setMatrixAt(nd++, GM); }
            for (const L of K.seats) {
              if (ng >= 48) break;
              const wx = c.x + co * L[0] + s * L[2], wz = c.z - s * L[0] + co * L[2];
              GM.makeRotationY(Math.atan2(T.x - wx, T.z - wz)).setPosition(wx, y + L[1], wz); K.gun.setMatrixAt(ng++, GM);
            }
          }
        }
        if (K.driver.count !== nd || nd) { K.driver.count = nd; K.driver.instanceMatrix.needsUpdate = true; }
        if (K.gun.count !== ng || ng) { K.gun.count = ng; K.gun.instanceMatrix.needsUpdate = true; }
        void GV3;
      };
      const rearTick = () => {
        const X4 = AF.act4; if (!X4 || !X4.rear) return;
        const on = is('carchase') && !!H.car && !H.car.dead && H.car.active !== false;
        if (!on && !X4.rearMade) return;
        const g = X4.rear(); X4.rearMade = true; g.visible = on; if (!on) return;
        const c = H.car, m = c.mesh;
        if (m) { g.position.copy(m.position); g.rotation.copy(m.rotation); } else { g.position.set(c.x, c.y, c.z); g.rotation.set(c.pitch || 0, c.yaw, c.roll || 0); }
      };
      const HPB = document.createElement('div'); HPB.id = 'heist-armor';
      HPB.style.cssText = 'position:fixed;left:50%;top:max(10px,env(safe-area-inset-top));transform:translateX(-50%);width:min(320px,56vw);pointer-events:none;z-index:4;display:none;font:700 11px var(--font,system-ui);letter-spacing:2px;color:#fff;text-shadow:0 1px 2px #000;text-align:center';
      HPB.innerHTML = '<div>ARMOURED CAR</div><div style="height:8px;margin-top:4px;background:rgba(0,0,0,.55);border:1px solid rgba(255,255,255,.35);border-radius:3px;overflow:hidden"><i style="display:block;height:100%;width:100%;background:#5fd36a;transition:width .2s"></i></div>';
      (document.getElementById('ui') || document.body).appendChild(HPB);
      const HPBI = HPB.querySelector('i'); let hpShown = -1;
      const carHp = () => { const c = H.car; if (!c) return 0; return c.net == null || H.carHp == null ? Math.max(0, c.hp ?? ARMOR_HP) : H.carHp; };
      const hpBar = () => {
        const on = H.on && isAny(HPSTEPS) && !!H.car && !(MI.cut && MI.cut.on);
        const v = on ? Math.round(AF.clamp(carHp() / ARMOR_HP, 0, 1) * 100) : -1;
        if (v === hpShown) return; hpShown = v;
        HPB.style.display = on ? '' : 'none'; if (!on) return;
        HPBI.style.width = v + '%'; HPBI.style.background = v > 55 ? '#5fd36a' : v > 28 ? '#e8b440' : '#e4483a';
      };
      let hpSendT = 0, hpSent = -1, lent = false, warned = false;
      const act4Tick = (dt) => {
        const C = CB(), s = ST[H.i], id = s ? s.id : '';
        if (C) { C.noCops = H.on && NOCOP.has(id); C.freeArc = H.on && is('carchase') && inHeistCar(); C.seatTargets = seatTargets; C.onBoom = onBoom; }
        // no traffic in the city while Moretti's crew hunts the armoured car: only the chasers are on the road
        VV.hideTraffic = H.on && is('carchase');
        if (C && C.noCops && C.stars) C.clearWanted();
        heliTick(dt); menTick(); rearTick(); hpBar(); mineTick(dt);
        if (!H.on) { lent = false; warned = false; return; }
        hypeTick(dt);
        const v = curCar();
        // the stash: drive a car up to the crate and stop = loaded; the drop: park beside it; the garage: drive in and stop
        if (is('army') && !H.got.crate && v && A.armyCrate && dist(v, A.armyCrate) < 7 && Math.abs(v.v || 0) < 2.5) setGot('crate');
        if (is('haul') && !H.got.drop && v && A.farmDrop && dist(v, A.farmDrop) < 10 && Math.abs(v.v || 0) < 2.5) setGot('drop');
        if (is('paint') && !H.got.paint && v && (v === H.car || v.armor) && inGarage(v) && Math.abs(v.v || 0) < 2) setGot('paint');
        // the chase: the guns at the back doors, the camera, the helicopters' cue, the farm's guards left behind, the car's hit points
        if (is('carchase')) {
          if (H.t > 20 && !HE.on) heliStart();
          if (inHeistCar()) {
            if (!lent && C && C.lend) { lent = true; C.lend('minigun', 99999); if (C.selectId) C.selectId('minigun'); note(riding() ? 'Minigun \u2014 you\u2019re up through the roof hatch at the back. Aim anywhere; the belt never runs out, but it still needs reloading.' : 'Minigun \u2014 the belt never runs out, but it still needs reloading.', 'ok'); }
            if (C && C.resOf && C.has('minigun') && C.resOf('minigun') < 5000) C.lend('minigun', 99999);
            const sp = Math.abs(v ? v.v || 0 : 0);
            if (AF.camfx) { AF.camfx.rumble('heist-cc', 0.003 + Math.min(0.006, sp * 0.00018), 9); if (sp > 22) AF.camfx.wind(Math.min(1, (sp - 22) / 20)); }
            if (riding() && AF.health && AF.clock.t - AF.health.last > 3) AF.health.heal(dt * 2.5);
          }
          if (H.scene === 'farm' && H.car && dist(H.car, A.farm) > 160) scene('none');
          const c = H.car;
          if (c && c.net == null) {
            if ((hpSendT -= dt) <= 0) { hpSendT = 0.5; const r = Math.round(Math.max(0, c.hp ?? 0)); if (r !== hpSent) { hpSent = r; send({ op: 'chp', h: r }); } }
            if (!warned && c.hp < ARMOR_HP * 0.3) { warned = true; radio('vera.armor', true); }
          }
        } else if (lent) { lent = false; warned = false; if (C && C.unlend) C.unlend('minigun'); }
        if (!is('carchase') && MN.list.length) mineClear();
        // the armoured car wrecked = the job's over (its driver's client decides; Moretti's men or a crash)
        const c = H.car;
        if (isAny(HPSTEPS) && c && c.net == null && (c.dead || c.burnT > 0 || c.hp <= 0) && !H.failing) fail('Moretti\u2019s men wrecked the armoured car.');
      };
      const CHASE = new Set(['carchase', 'paint', 'paintcut']), HPSTEPS = new Set(['carchase', 'paint']);
      const wheelsTick = () => {
        if (!is('park') || H.got.wheels) return;
        const c = H.car; if (!c || c.dead || !A.carSpot) return;
        if (dist(c, A.carSpot) < 9 && Math.abs(c.v || 0) < 1.5) setGot('wheels');
      };
      // the getaway's air cover: strike jets hunt the crew until the launchers from the armoured car's boot bring them down. Every client runs
      // its own copies of the n jets (77 CB.jetMission); kills are shared by index ('jk'); the car's damage lands only on its driver's client
      const jetsN = () => Math.min(4, 1 + crewN());
      const jetsLeft = () => { const C = CB(); return C && C.jetsLeft ? C.jetsLeft() : 0; };
      const jetKilled = (k) => { void k; const n = jetsLeft(); if (n) { if (n === jetsN() - 1) radio('vera.jets2', true); } else radio('vera.jets3', true); };
      const jetsStart = (restored) => {
        const C = CB(); if (!C || !C.jetMission) return;
        if (H.car && !H.car.dead) { H.car.hp = Math.max(H.car.hp || 0, ARMOR_HP); H.car.armor = AF.G.armorCarK || 0.12; }
        C.jetMission({ n: jetsN(), onKill: (k) => { send({ op: 'jk', k }); jetKilled(k); }, owner: () => { const c = curCar(); return !c || c.net == null; } });
        H.flag.jetsOn = true;
        if (C.lend) { C.lend('bazooka', 6); C.lend('seeker', 10); }
        note('Launchers out of the boot: the SEEKER locks on (keep a jet near the crosshair until LOCKED), the BAZOOKA fires straight. Switch weapons to pick one.', 'ok');
        if (!restored) radio('vera.jets1', true);
      };
      const jetsOver = () => !!H.flag.jetsOn && H.t > 3 && jetsLeft() === 0;
      const jetsLine = () => 'Jets on your tail \u2014 shoot them down before you can fly: SEEKER locks on, BAZOOKA fires straight. ' + (crewN() > 1 ? 'Passengers fire from the windows, the driver keeps moving' : 'Fire from your seat or bail out and take cover') + ' (' + jetsLeft() + ' left; the armoured car can take a beating)';
      const jetMark = () => {
        const C = CB(), J = C && C.jets, p = me(); let b = null, bd = 1e9;
        if (J) for (const j of J.jets) if (j.on && !j.dead) { const d = dist(p, j); if (d < bd) { bd = d; b = j; } }
        if (b) { SC.x = b.x; SC.y = b.y; SC.z = b.z; return SC; }
        return null;
      };
      // bank alarm: the host keeps topping the bank up through the street doors every 25 s until the crew is out (escape step) or
      // the job ends; there is no wave cap. Bounded: never more than min(8, 3 + crew) guards standing at once, drawn from the bank's
      // 8 reserves (HB.reserve) via S.freeReserve: unused ones first, then corpses stealth has retired (TTL + hidden gap, host-only);
      // S.spawn at a street entry is the only revival. Pool empty for now -> retry in 4 s, the wave count only moves on a real spawn.
      const bankWaveTick = (dt) => {
        if (!HB || !HB.spots.waves || !S || !S.zone || S.zone.id !== 'bank' || !S.zone.alarm || !isAny(BANK)) { if (H.bankWave && !(S && S.zone && S.zone.alarm)) H.bankWave.t = 6; return; }
        bankWaveRun(H.bankWave || (H.bankWave = { n: 0, t: 6, idx: 0, sent: 0 }), dt, true);
      };
      const bankWaveRun = (W, dt, talk) => {
        if ((W.t -= dt) > 0) return;
        let up = 0; for (const g of S.zone.guards) if (!g.down && (!g.reserve || g.live)) up++;
        const P = HB.spots.waves, room = Math.min(8, 3 + crewN()) - up;
        if (room <= 0) { W.t = 6; return; }
        let n = 0;
        for (let j = 0; j < room; j++) {
          const i = S.freeReserve ? S.freeReserve('bank', 1) : -1; if (i < 0) break;
          const p = P[W.idx++ % P.length]; if (S.spawn('bank', i, p.x + (j % 3) * 0.8, p.y, p.z + ((j / 3) | 0) * 0.8)) n++;
        }
        if (!n) { W.t = 4; return; }
        W.t = 25; W.n++; W.sent += n;
        if (talk && (W.n <= 2 || W.n % 4 === 0)) radio('vera.wave');
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
  // the vault armoury is a loan for the bank only: handed back once the plane is up, so the crate still matters on Corsair Key
  const returnLoadout = () => { if (!H.loadout) return; H.loadout = false; const C = CB(); if (C) { if (C.unlend) { C.unlend('tommy'); C.unlend('lmg'); } if (C.armor) C.armor(0, 'heist'); } };
  const WAVES = [4, 4, 5];
  const fight = (restored) => {
    returnLoadout(); const C0 = CB(); if (C0 && C0.unlend) C0.unlend('lmg');   // the finale's LMG comes only from Silas's crate
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
    A.veraKerb = kerbAt(A.vera.x, A.vera.z);
    A.wheelsSpot = kerbAt(-60, 60, 12) || A.carSpot;   // the Motor Exchange forecourt (78), a kerb space along from its zone
    const LS = (LN() && LN().spots) || {};
    A.c5 = LS.tender ? { x: LS.tender.x, y: LS.tender.y, z: LS.tender.z, yaw: PI } : Object.assign(free(-230, 262, 4, 8), { yaw: PI });
    // every story interaction waits while the police are after you (the job only goes on once you've lost them)
    const add = (o) => { const f = o.act; if (f) o.act = (...a) => { if (wantedHold()) { wantedNag(true); return; } f(...a); }; return AF.addInteract(Object.assign({ prio: 2 }, o)); };
    // act I
    add({ x: A.grille.x, y: A.grille.y + 1, z: A.grille.z, r: 1.8, label: 'Pick the padlock on the night grille', prio: 2.4, can: () => walkOk() && is('uniform') && !H.got.grille && !H.busy && !mgDone('grille'), act: pickGrille });
    add({ x: A.rail.x, y: A.rail.y + 1, z: A.rail.z, r: 1.7, label: 'Take a pilot uniform off the rail', can: () => walkOk() && is('uniform') && H.got.grille && !H.got.uniform && !mgDone('rail'), act: () => { sfx('cloth'); dress('pilot'); note('Pilot uniform on. Very dashing.', 'ok'); mgMark('rail', mySlot()); } });
    add({ x: A.ezra.x, y: A.ezra.y + 1, z: A.ezra.z, r: 2.4, label: 'Get your pilot papers from Ezra', prio: 2.4, can: () => walkOk() && is('forger') && !H.got.papers && !H.busy && !mgDone('papers'), act: ezraPapers });
    add({ x: A.gate.x, y: A.gate.y + 1, z: A.gate.z, r: 2.6, label: 'Show your papers at the crew gate', prio: 2.4, can: () => walkOk() && is('gate') && !H.got.cleared, act: showPapers });
    // act II (the cache and the racks only answer from their own side of the maze wall)
    const sees = (x, y, z) => { const p = AF.player; return AF.segClear(p.x, p.y + 1.1, p.z, x, y, z); };
    add({ x: A.cache.x, y: A.cache.y + 1, z: A.cache.z, r: 2.2, label: 'Crack the arms cache', can: () => walkOk() && is('cache') && !H.got.cache && !H.busy && sees(A.cacheStand.x, A.cacheStand.y + 1.1, A.cacheStand.z), act: crackCache });
    (A.racks || []).forEach((rk, i) => add({ x: rk.x, y: rk.y + 1, z: rk.z, r: 1.7, label: i % 2 ? 'Take a pump shotgun off the rack' : 'Take a Tommy gun off the rack', prio: 2.5, can: () => walkOk() && (is('cache') || is('cave')) && sees(rk.x + Math.sin(rk.yaw) * 0.5, rk.y + 1.1, rk.z + Math.cos(rk.yaw) * 0.5),
      act: () => { const C = CB(); if (C && C.lend) { C.lend(i % 2 ? 'shotgun' : 'tommy', i % 2 ? 48 : 250); sfx('gun_reload'); note(i % 2 ? 'Pump shotgun \u2014 loud and close.' : 'Tommy gun \u2014 250 rounds. Loud.', 'ok'); } } }));
    // act III
    FOLLOW.push(follow(add({ x: 0, y: -999, z: 0, r: 1.8, label: 'Take the waiter\u2019s uniform', prio: 2.9, can: () => walkOk() && is('uniforms') && HS.waiterG && HS.waiterG.down && !H.took.waiter && !myStingRole(), act: () => { H.took.waiter = true; (H.tookBy || (H.tookBy = {})).waiter = mySlot(); send({ op: 'took', k: 'waiter' }); dress('waiter'); sfx('cloth'); } }), () => HS.waiterG && HS.waiterG.a));
    FOLLOW.push(follow(add({ x: 0, y: -999, z: 0, r: 1.8, label: 'Take the dealer\u2019s uniform', prio: 2.9, can: () => walkOk() && is('uniforms') && HS.dealerG && HS.dealerG.down && !H.took.dealer && !myStingRole(), act: () => { H.took.dealer = true; (H.tookBy || (H.tookBy = {})).dealer = mySlot(); send({ op: 'took', k: 'dealer' }); dress('dealer'); sfx('cloth'); } }), () => HS.dealerG && HS.dealerG.a));
    add({ x: A.dealer.x, y: A.dealer.y + 1, z: A.dealer.z, r: 2.0, label: 'Take over Prescott\u2019s table', prio: 2.5, can: () => walkOk() && is('sting') && myStingRole() === 'dealer' && !H.dealing, act: takeTable });
    // a crew of three or four: the others borrow ship's-security uniforms off officers they put down
    (HS.secG || []).forEach((g, i) => FOLLOW.push(follow(add({ x: 0, y: -999, z: 0, r: 1.8, prio: 2.9, label: 'Take the officer\u2019s uniform', can: () => walkOk() && is('uniforms') && g.down && !H.took['sec' + i] && !myStingRole() && crewN() > 2 && secTaken() < crewN() - 2,
      act: () => { H.took['sec' + i] = true; (H.tookBy || (H.tookBy = {}))['sec' + i] = mySlot(); send({ op: 'took', k: 'sec' + i }); dress('security'); sfx('cloth'); note('Ship\u2019s security. Now hide him somewhere.', 'ok'); } }), () => g.a)));
    if (HS.detG) FOLLOW.push(follow(add({ x: 0, y: -999, z: 0, r: 2.2, prio: 2.9, label: 'Serve the house detective his drink', can: () => walkOk() && is('lace') && myStingRole() === 'waiter' && H.laced && !H.got.detOut && !HS.detG.down, act: detDrink }), () => HS.detG.a && (HS.detG.a.ctl || HS.detG.a)));
    add({ x: A.salonBar.x, y: A.salonBar.y + 1, z: A.salonBar.z, r: 2.0, prio: 2.6, label: 'Lace a drink for the house detective', can: () => walkOk() && is('lace') && myStingRole() === 'waiter' && !H.laced && !H.got.detOut, act: () => { H.laced = true; sfx('glass'); note('A tall glass with a little something extra. Take it to the house detective.', 'ok'); } });
    if (HS.npc.pit) add({ x: HS.npc.pit.x, y: (HS.npc.pit.y || A.dealer.y) + 1, z: HS.npc.pit.z, r: 2.2, prio: 2.7, label: 'Have a word with the pit boss', can: () => walkOk() && is('sting') && myStingRole() === 'security' && !(H.pitHold > 0), act: () => holdNpc('pit') });
    add({ x: A.salonBar.x, y: A.salonBar.y + 1, z: A.salonBar.z, r: 2.0, label: 'Pick up a drink tray', can: () => walkOk() && is('sting') && myStingRole() === 'waiter' && !H.tray, act: () => { H.tray = true; sfx('glass'); } });
    if (HS.npc.prescott) { const pi = HS.npc.prescott.interact; pi.r = 2.2; pi.prio = 2.6; const t0 = pi.act; pi.act = () => { if (is('sting') && myStingRole() === 'waiter' && H.tray) serve(); else t0(); }; }
    if (HS.npc.silas) { const si = HS.npc.silas.interact; const t0 = si.act; si.act = () => { if (!is('silas')) t0(); }; }
    // act IV
    if (A.armyCrate) add({ x: A.armyCrate.x, y: A.armyCrate.y + 1, z: A.armyCrate.z, r: 2.2, label: 'Load the launcher crate into the car', prio: 2.6, can: () => walkOk() && is('army') && !H.got.crate, act: loadCrate });
    add({ x: A.server.x, y: A.server.y + 1, z: A.server.z, r: 2.0, label: 'Jack into the Kestrel terminal', prio: 2.6, can: () => walkOk() && (is('hack') || is('bunker')) && !H.busy && !H.got.hacked, act: hackTerminal });
    add({ x: HB.spots.ladder.x, y: 1.3, z: HB.spots.ladder.z, r: 1.6, label: 'Climb the service ladder to City Hall\u2019s roof', can: () => walkOk() && (is('vantage') || is('snipe')), act: climbLadder });
    add({ x: HB.spots.bulkhead.x, y: HB.spots.bulkhead.y + 1.2, z: HB.spots.bulkhead.z, r: 1.6, label: 'Roof door keypad', can: () => walkOk() && (is('door') || is('roofclear')) && !H.got.hatch, act: keypad });
    HB.spots.keys.forEach((k, i) => add({ x: k.x, y: 1.5, z: k.z, r: 1.5, label: 'Turn the ' + KEYN[i] + ' vault key', can: () => walkOk() && is('keys') && !(H.grip[i] > 0), act: () => grip(i) }));
    add({ x: HB.spots.cage.x, y: 1.3, z: HB.spots.cage.z, r: 1.3, label: 'Set up the drill on the cage lock', can: () => walkOk() && is('drill') && !H.drilling && !H.got.cage, act: drill });
    HB.spots.bags.forEach((b, k) => add({ x: b.x, y: 1.0, z: b.z, r: 1.2, label: 'Grab the cash bag', can: () => walkOk() && is('cash') && !H.bags[k], act: () => bag(k) }));
    // the exit door's local panel: the hacker's job; anyone may use it solo, or 20 s after the last bag if the hacker is gone
    if (HB.spots.exitPad) { const E = HB.spots.exitPad; add({ x: E.x, y: E.y + 0.8, z: E.z, r: 1.4, label: 'Override the exit door',
      can: () => walkOk() && (is('cash') || is('escape')) && H.bags.every(Boolean) && !H.got.exit,
      act: () => { if (H.busy) return; H.busy = true; play('keypad', { title: 'Exit door', sub: 'Kestrel override', diff: 0.4 }).then((r) => { H.busy = false; if (r && r.ok) setGot('exit'); }); } }); }
    // vault armoury: loaned guns + vest for holding the vault while the drill runs; returned (unlend / armor 0) when the job ends
    if (HB.spots.loadout) { const L = HB.spots.loadout; add({ x: L.x, y: L.y + 0.8, z: L.z, r: 1.4, label: 'Take the vault guns and vest',
      can: () => walkOk() && (is('lasers') || is('drill') || is('cash')) && !!H.got.gate && !H.loadout,
      act: () => { const C = CB(); if (C) { if (C.lend) { C.lend('tommy', 250); C.lend('lmg', 200); } if (C.armor) C.armor(100, 'heist'); } H.loadout = true; radio('vera.loadout'); note('Tommy gun, LMG and a vest. Hold the vault while the drill runs. They are on loan until the job ends.', 'ok'); } }); }
    // act VI
    add({ x: A.crate.x, y: A.crate.y + 1, z: A.crate.z, r: 2.0, label: 'Take the LMG from Silas\u2019s crate', prio: 2.6, can: () => walkOk() && is('fight') && !(CB() && CB().has && CB().has('lmg')), act: () => { const C = CB(); if (C && C.lend) C.lend('lmg', 300); sfx('gun_reload'); note('Light machine gun \u2014 300 rounds. Give them hell.', 'ok'); } });
    // zone rules: disguises, alarms
    const z = (id) => S && S.zones.get(id);
    if (z('shop')) { z('shop').disguise = () => false; }
    if (z('queen')) { const q = z('queen'); const STAFF = new Set(['crew', 'pantry', 'crewLounge', 'stairs', 'salon', 'vestibule', 'office', 'vault', 'cage']);
      // the house detective: on duty he trusts only the waiter; once the laced drink lands he's watching nobody
      q.disguise = (slot, g) => { if (g && g === HS.detG) { if (H.got.detOut) return 2; if (wears(slot) === 'waiter' && !(slot === mySlot() && H.lifting)) return 2; return false; }
        if (slot === mySlot() && H.lifting) return false; if (STAFFW.has(wears(slot))) return true; const p = slot === mySlot() ? AF.player : AF.coop && AF.coop.players.get(slot); return !!p && !!LN() && !!LN().room && !STAFF.has(LN().room(p.x, p.y, p.z)); }; q.onAlarm = () => fail('Ship\u2019s security caught you.'); }
    // seen at the zoo or on the bank roof: five stars (the zones fight; the job waits until the police lose the crew). During the
    // rifle work on the roof a patrol that finds a body ends the night (the crew comes back to City Hall).
    if (z('zoo')) z('zoo').onAlarm = () => blown('zoo');
    if (z('roof')) { const q = z('roof'); q.onAlarm = () => blown('bank roof'); q.onBody = (g, body) => { if (!is('snipe')) return false; if ((g.level || 0) !== (body.level || 0)) return true; fail('A patrol found a body on the bank roof \u2014 the roof watch is blown.'); return true; }; }
    if (z('tunnel')) z('tunnel').onAlarm = () => { radio('vera.spotted', true); };
    if (z('bank')) z('bank').onAlarm = (why) => { if (!H.bags.every(Boolean)) radio(/Gunfire|loud/i.test(why || '') ? 'vera.loud' : 'vera.spotted', true); };
    veraBlip();
  });
  // the shop zone after closing (the watchman is a path walker from 81-heist-sets): nobody belongs inside, so any sighting counts
  AF.onBuild('heist-shop-zone', 945, () => {
    if (!S || !HS || !HS.ready || !HS.walkers.watch) return;
    const zz = S.define('shop', { box: A.shopBox, mode: 'fail', voice: 'g2', reflexS: 2.2, radius: 60 });
    // the tailor's: three watchmen on torch-only sight (80-stealth draws the torch); no room floodlight
    for (const k of ['watch', 'shop2', 'shop3']) if (HS.walkers[k]) S.guard('shop', { path: HS.walkers[k], voice: 'g2', name: 'Night watchman', range: 9, armed: false, torch: { range: 9, cone: 0.8, eye: 1.35 } });
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
  const menu = () => AF.shop.open({ title: 'The Harbour Trust Job', sub: ST[H.i] ? lineOf(ST[H.i]).replace(/[{}]/g, '') : '', items: () => [
    { name: 'Keep going', desc: 'Vera taps her watch', tag: ' ', act: () => AF.shop.close() },
    { name: 'Retry from the last checkpoint', desc: CPS[H.cp].label, tag: ' ', act: () => { AF.shop.close(); retry(); } },
    { name: 'Skip this step', desc: 'Move the crew on to the next objective', tag: ' ', act: () => { AF.shop.close(); skipStep(); } },
    { name: 'Call off the job', desc: 'Everyone goes home empty-handed', tag: ' ', act: () => { AF.shop.close(); H.quit(); } },
  ] });
  const MENU = document.createElement('div'); MENU.className = 'coop-m heist-m'; MENU.style.display = 'none';
  MENU.innerHTML = '<div class="row"><label>Heist</label><div class="acts"><button class="btn" data-h="retry">Retry checkpoint</button><button class="btn" data-h="skip">Skip step</button><button class="btn" data-h="quit">Call it off</button></div></div>';
  { const menuEl = document.querySelector('#m-menu .panel'), stack = menuEl && menuEl.querySelector('.stack'); if (stack) menuEl.insertBefore(MENU, stack); }
  MENU.addEventListener('click', (e) => { e.stopPropagation(); const b = e.target.closest('[data-h]'); if (!b) return; if (UI.resume) UI.resume(); if (b.dataset.h === 'retry') retry(); else if (b.dataset.h === 'skip') skipStep(); else H.quit(); });
  // the Kestrel tablet button (solo inside man; also T)
  const TB = document.createElement('button'); TB.id = 'heist-tablet'; TB.textContent = '\u25a3 TABLET (T)';
  TB.style.cssText = 'position:fixed;left:50%;top:64px;transform:translateX(-50%);z-index:6;display:none;font:700 12px/1 system-ui,sans-serif;letter-spacing:.1em;color:#cfe9d4;background:rgba(8,30,18,.78);border:1px solid rgba(160,230,180,.5);border-radius:4px;padding:8px 14px;cursor:pointer';
  TB.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); if (tabletOk()) openCams(true); });
  document.body.appendChild(TB);

  // ---------------------------------------------------------------- the flight south under the coast radar
  // Between Westgate and Serena Isle the pilot keeps the plane inside a height band that keeps drifting (the gauge on the right).
  // Outside it the lock builds: 5 s outside in all (it bleeds off slowly inside the band) and Westgate has them — the job fails.
  // The band opens round the plane's height and drifts onto its course over the first 12 s.
  const RD = document.createElement('div'); RD.id = 'heist-radar';
  RD.innerHTML = '<i></i><b></b><span></span><small>RADAR</small>';
  RD.style.cssText = 'position:fixed;right:max(24px,env(safe-area-inset-right));top:50%;width:26px;height:min(220px,38vh);transform:translateY(-50%);z-index:5;display:none;pointer-events:none;background:rgba(8,12,18,.6);border:1px solid rgba(255,255,255,.3);border-radius:3px;font:700 12px/1 system-ui,sans-serif;color:#fff;text-shadow:0 1px 2px #000';
  const [rdBand, rdMark, rdAlt, rdTag] = RD.children;
  rdBand.style.cssText = 'position:absolute;left:0;right:0;border-radius:2px;transition:background .2s';
  rdMark.style.cssText = 'position:absolute;left:-7px;right:-7px;height:3px;margin-top:-1px;background:#fff;box-shadow:0 0 4px #000';
  rdAlt.style.cssText = 'position:absolute;right:34px;margin-top:-7px;white-space:nowrap';
  rdTag.style.cssText = 'position:absolute;left:50%;top:calc(100% + 6px);transform:translateX(-50%);font-size:9px;letter-spacing:.12em;opacity:.8';
  document.body.appendChild(RD);
  const RADAR = { on: false, k: 0, t: 0, b: 0, lo: 0, hi: 0, off: 0, ping: 0, grace: 18 }, RTOP = 100, RLOCK = 12;
  // everyone aboard sees the gauge of the plane they're in: the band is a function of the distance flown from Westgate, so the pilot
  // and the passengers of one plane read the same band; only the pilot's client can fail the job on a lock
  const radarTick = (dt) => {
    const rv = rideVeh(), pilot = AF.mode === 'fly' && AF.planes ? AF.planes.cur : null, pl = pilot || (isPlane(rv) ? rv : null);
    const on = is('fly') && !!pl && !pl.onGround && !H.failing && !MI.cut.on && !wanted() && dist(pl, A.plane) > 850 && dist(pl, A.strip) > 450;
    const alt = pl ? Math.max(0, pl.y - Math.max(0, AF.W.groundY(pl.x, pl.z))) : 0, band = (t) => 48 + 20 * Math.sin(t * 0.1) + 8 * Math.sin(t * 0.25 + 2);
    if (on !== RADAR.on) {
      RADAR.on = on; RD.style.display = on ? 'block' : 'none';
      if (on && !H.flag.radarSaid) { H.flag.radarSaid = true; RADAR.k = 0; RADAR.b = AF.clamp(alt, 24, 80) - band(0); note('Coast radar ahead \u2014 ' + (pilot ? 'match altitude to the green band on the right' : 'call out the green band on the right to your pilot') + '. Radar lock starts in 18s.', 'warn'); }
    }
    if (!on) return;
    const t = RADAR.t = Math.max(0, dist(pl, A.plane) - 850) / 42, c = AF.clamp(band(t) + RADAR.b * Math.max(0, 1 - t / 14), 26, 78);
    RADAR.lo = c - 12; RADAR.hi = c + 12;
    RADAR.off = alt < RADAR.lo ? RADAR.lo - alt : alt > RADAR.hi ? alt - RADAR.hi : 0;
    const inGrace = t < (RADAR.grace || 18);
    RADAR.k = AF.clamp(RADAR.k + ((RADAR.off && !inGrace) ? 1 / RLOCK : -0.04) * dt, 0, 1);
    if (RADAR.off && !inGrace && (RADAR.ping -= dt) <= 0) { RADAR.ping = 1.1 - RADAR.k * 0.8; sfx('ui_click'); }
    if (RADAR.k >= 1) { if (pilot) { sfx('jg_spot'); fail('Radar lock \u2014 Westgate tracked the plane.'); return; } RADAR.k = 0.99; }
    const Y = (v) => (100 - AF.clamp(v, 0, RTOP) / RTOP * 100).toFixed(1) + '%';
    rdBand.style.top = Y(RADAR.hi); rdBand.style.bottom = (AF.clamp(RADAR.lo, 0, RTOP) / RTOP * 100).toFixed(1) + '%';
    rdBand.style.background = inGrace ? 'rgba(74,180,255,.55)' : RADAR.off ? 'rgba(255,90,74,.55)' : 'rgba(125,220,138,.6)';
    rdMark.style.top = rdAlt.style.top = Y(alt); rdAlt.textContent = Math.round(alt) + ' m' + (inGrace ? ' [WARMUP ' + Math.ceil(RADAR.grace - t) + 's]' : '');
  };

  // ---------------------------------------------------------------- the bag lends the crew's gear while the job is on
  if (AF.inv) AF.inv.extra.push(() => {
    if (!H.on) return null;
    const g = H.got, out = [];
    if (g.papers && H.i < IDX.kit) out.push({ name: 'Pilot\u2019s licence', desc: 'Ezra\u2019s finest forgery', icon: 'card', tag: 'Papers' });
    if (g.kitkey && !g.gate) out.push({ name: 'Kit\u2019s vault key', desc: 'Turns the north lock', icon: 'key', tag: 'Key' });
    if (g.key && !g.gate) out.push({ name: 'Prescott\u2019s vault key', desc: 'Turns the south lock', icon: 'key', tag: 'Key' });
    if (g.cache && !g.cage) out.push({ name: 'Diamond-core drill', desc: 'For the deposit cage', icon: 'drill', tag: 'Gear' });
    if (g.hacked && !g.cage) out.push({ name: 'Kestrel tablet', desc: 'T \u2014 the bank\u2019s cameras, lights and locks', icon: 'card', tag: 'Gear' });
    if (H.wear) out.push({ name: { pilot: 'Pilot\u2019s uniform', waiter: 'Waiter\u2019s jacket', dealer: 'Dealer\u2019s vest', keeper: 'Keeper\u2019s overalls', night: 'Night clothes' }[H.wear] || 'Uniform', desc: 'Borrowed', icon: 'wear', tag: 'Worn' });
    const n = H.bags.filter(Boolean).length; if (n && H.i >= IDX.cash) out.push({ name: 'Cash bags', desc: 'The Harbour Trust\u2019s money', icon: 'cash', tag: 'Loot', n });
    return out;
  });
  // ---------------------------------------------------------------- co-op
  const OPS = new Set(['go', 'st', 'done', 'fail', 'end', 'quit', 'retry', 'skip', 'lv', 'mn', 'mx', 'rs', 'got', 'roles', 'role', 'tr', 'tdone', 'wear', 'took', 'anger', 'strike', 'table', 'lock', 'laser', 'grip', 'bag', 'drill', 'mg', 'crack', 'crackp', 'ch', 'chit', 'chshot', 'hold', 'cc', 'cdm', 'jk', 'hk', 'chp', 'cph']);
  const int = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;
  const GOT = new Set(['grille', 'uniform', 'papers', 'cleared', 'kitkey', 'cache', 'key', 'keeper', 'hacked', 'hatch', 'gate', 'cage', 'exit', 'lasersOff', 'crate', 'drop', 'wheels', 'launchers', 'paint', 'detOut']);
  const adoptGot = (g) => { if (!Array.isArray(g)) return; for (const k of g) if (GOT.has(k) && !H.got[k]) setGot(k, true); };
  if (N && N.on) {
    N.on('heist', (m, from) => {
      if (!m || typeof m.op !== 'string' || !OPS.has(m.op)) return;
      const why = typeof m.why === 'string' ? m.why.slice(0, 120) : '', fromHost = from === 0;
      switch (m.op) {
        case 'go': if (host() && !H.on) start(); break;
        case 'st':
          if (!fromHost || host() || !int(m.i, 0, ST.length - 1) || !int(m.cp, 0, CPS.length - 1)) break;
          if (!H.on) { H.on = true; H.failing = false; H.got = {}; H.bags = [false, false, false, false]; resetWorld(m.i); veraBlip(); sfx('jg_start'); }
          H.cp = m.cp;
          adoptGot(m.g); if (m.i !== H.i) { enter(m.i, m.r === 1); if (m.sk === 1) skipMove(); } break;
        case 'done': if (host() && int(m.i, 0, ST.length - 1) && !ST[m.i].hostOnly) advance(m.i); break;
        case 'fail':
          if (host()) { if (H.on && !H.failing) { doFail(why || 'The crew was made.'); send({ op: 'fail', cp: H.cp, why }); } }
          else if (fromHost && H.on && int(m.cp, 0, CPS.length - 1)) { H.cp = m.cp; doFail(why); }
          break;
        case 'end': if (fromHost && !host()) end(m.ok === 1); break;
        case 'quit': if (host() && H.on) finish(false); break;
        case 'retry': if (host() && H.on && !H.failing) { restore(H.cp); send({ op: 'rs', cp: H.cp }); } break;
        case 'skip': if (host() && H.on && int(m.i, 0, ST.length - 1) && m.i === H.i) skipStep(); break;
        case 'lv': if (fromHost && H.on && (m.k === 'zoo' || m.k === 'roof') && int(m.n, 1, 3)) lvSet(m.k, m.n, true); break;
        case 'rs': if (fromHost && !host() && H.on && int(m.cp, 0, CPS.length - 1)) restore(m.cp); break;
        case 'got': if (H.on && GOT.has(m.k)) setGot(m.k, true); break;
        case 'wear': if (typeof m.k === 'string' && m.k.length < 10) H.wears[from] = m.k || null; break;
        case 'took':
          if (typeof m.k !== 'string' || !(m.k === 'waiter' || m.k === 'dealer' || /^sec[0-9]$/.test(m.k)) || !int(from, 0, 3)) break;
          if (!H.tookBy) H.tookBy = {};
          if (H.took[m.k] && H.tookBy[m.k] != null && H.tookBy[m.k] !== from) break;   // first taker keeps it
          H.took[m.k] = true; H.tookBy[m.k] = from; break;
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
        case 'lock': if (is('keys')) lockOn(true); break;
        case 'laser': if (isAny(BANK)) cutLasers(true); break;
        case 'grip': if (int(m.k, 0, 1)) grip(m.k, true); break;
        case 'bag': if (int(m.k, 0, 3) && (is('cash') || is('escape'))) bag(m.k, true); break;
        case 'drill': H.drillR = m.on === 1; break;
        case 'cc': if (fromHost && !host() && int(m.n, 0, 30)) H.ccLeft = m.n; break;
        case 'mn': if (fromHost && !host() && is('carchase') && int(m.k, 0, 1e6) && Number.isFinite(m.x) && Number.isFinite(m.z) && Math.abs(m.x) < 6000 && Math.abs(m.z) < 6000) mineAdd(m.k, m.x, m.z, true); break;
        case 'mx': if (H.on && int(m.k, 0, 1e6)) mineGone(m.k, m.b === 1, true); break;
        case 'hk': if (H.on && is('carchase') && int(m.k, 0, 7)) { const h = HE.list[m.k]; if (h) heliDown(h, true); } break;
        case 'chp': if (H.on && int(m.h, 0, 400)) H.carHp = m.h; break;
        case 'cph': if (fromHost && H.on && typeof m.p === 'number' && m.p > 0 && m.p <= 0.5 && typeof m.n === 'number' && m.n > 0 && m.n <= 6) crewHit(m.p, m.n, true); break;
        case 'cdm': { const v = AF.mode === 'drive' ? VV.player : null; if (H.on && v && (v === H.car || v.armor) && typeof m.d === 'number' && m.d > 0 && m.d <= 20) { const C = CB(); if (C) C.dmgCar(v, m.d / (v.armor || 1), false); } break; }
        case 'jk': if (H.on && int(m.k, 0, 3)) { const C = CB(); if (C && C.jetKill) { const n0 = jetsLeft(); C.jetKill(m.k); if (jetsLeft() < n0) jetKilled(m.k); } } break;
      }
    });
    N.on('join', (p) => { if (host() && H.on && p && Number.isInteger(p.slot)) send({ op: 'st', i: H.i, cp: H.cp, g: gotList() }, p.slot); if (sheetOpen) AF.shop.refresh(); });
    N.on('left', () => { if (sheetOpen) AF.shop.refresh(); if (H.on && crewN() < NEED) note('Your partner left the crew. You can still finish \u2014 every step has a way through alone.', 'warn'); });
    N.on('end', () => { if (sheetOpen) AF.shop.refresh(); if (H.on) note('The crew split up. You\u2019re on your own now \u2014 finish the job, or call it off from the pause menu.', 'warn'); });
  }
  AF.on('died', (src) => { if (H.on && !H.failing) fail(src === 'crash' ? 'The plane went down.' : (AF.friends.current ? AF.friends.current.name : 'Someone') + ' was knocked out.'); });
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
  Object.assign(H.dbg, { grip, bag, setGot, lockOn, cutLasers, serve, takeTable, anger, openCams, scene, fail, CH, crackCache, chaseHit,
    openExit: () => setGot('exit'), wheels: () => setGot('wheels'), bankWave: () => H.bankWave, kit: KL, secret: SEC,
    detDrink, SN, lvSet, lvLeft, lvMax, standSeat, MINES: MN, mineAdd, skipStep });

  // ---------------------------------------------------------------- quiet city while the job is on (fewer ambient draws + ticks)
  const quiet = (on) => { AF.quiet = !!on; AF.emit('quiet', !!on); };

  // ---------------------------------------------------------------- tick
  const bars = () => {
    MI.bar('heist-anger', is('sting') && H.anger > 0 ? { label: 'Prescott is ranting', value: H.anger.toFixed(1) + ' s', hot: true } : null);
    MI.bar('heist-strikes', is('sting') && H.strikes > 0 ? { label: 'Pit boss', value: H.strikes + ' / 3', hot: H.strikes > 1 } : null);
    MI.bar('heist-lock', is('keys') && H.lockT > 0 ? { label: 'Time lock open', value: MI.time(H.lockT), ok: true } : null);
    for (let k = 0; k < 2; k++) MI.bar('heist-k' + k, is('keys') ? { label: KEYN[k] + ' key', value: H.grip[k] > 0 ? 'Turned ' + Math.ceil(H.grip[k]) : 'Free', pct: H.grip[k] / GRIP, ok: H.grip[k] > 0 } : null);
    MI.bar('heist-laser', (is('lasers') || is('drill')) && H.got.lasersOff ? LASERS_OFF : null);
    const n = H.bags.filter(Boolean).length;
    MI.bar('heist-bags', H.on && H.i >= IDX.cash && H.i <= IDX.stash ? { label: 'Cash bags', value: n + ' / 4', ok: n === 4 } : null);
    MI.bar('heist-roof', is('snipe') ? { label: 'Roof watch \u00b7 shift ' + SN.roof + '/' + lvMax('roof'), value: lvWait('roof') ? 'move' : lvLeft('roof') + ' left', hot: lvLeft('roof') > 0 } : is('roofclear') && roofLeft() ? { label: 'Roof guards', value: roofLeft() + ' left', hot: true } : is('zoosnipe') ? { label: 'Kestrel guards \u00b7 shift ' + SN.zoo + '/' + lvMax('zoo'), value: lvWait('zoo') ? 'move' : lvLeft('zoo') + ' left', hot: lvLeft('zoo') > 0 } : null);
    MI.bar('heist-wave', is('fight') && H.waves ? { label: 'Moretti\u2019s men', value: 'wave ' + Math.min(H.waves, WAVES.length) + ' / ' + WAVES.length, hot: true } : null);
    MI.bar('heist-radar', RADAR.on ? { label: 'Radar lock', value: 'Fly ' + Math.round(RADAR.lo) + '\u2013' + Math.round(RADAR.hi) + ' m', pct: RADAR.k, hot: RADAR.off > 0, ok: !RADAR.off } : null);
    MI.bar('heist-crack', is('cache') && (H.siege || H.crack > 0) && !H.got.cache ? { label: 'Cache locks', value: H.crack + ' / ' + CRACK_N, pct: H.crack / CRACK_N, ok: false, hot: !!H.siege } : null);
    MI.bar('heist-chase', is('chase') && CH.list.length ? { label: 'Moretti skis', value: chaseLeft() + ' left', hot: chaseLeft() > 0 } : null);
    MI.bar('heist-cc', is('carchase') ? { label: 'Moretti cars', value: String(ccLeftN()), hot: true } : null);
    MI.bar('heist-heli', is('carchase') && HE.on ? { label: 'Helicopters', value: helisLeft() + ' left', hot: helisLeft() > 0, ok: !helisLeft() } : null);
    MI.bar('heist-hold', is('sting') && (H.detHold > 0 || H.pitHold > 0) ? { label: H.detHold > 0 ? 'Detective distracted' : 'Pit boss distracted', value: Math.ceil(Math.max(H.detHold, H.pitHold)) + ' s', ok: true } : null);
  };
  // first person inside the smugglers' tunnel and its maze (a chase camera fights the tight walls); the player's own setting is
  // given back on the way out (never saved)
  let caveV = -1;
  const caveView = () => {
    const p = AF.player, b = A.tunnelBox, O = AF.outland, V = AF.view;
    const inside = H.on && AF.mode === 'walk' && !!b && !!p && p.x > b[0] && p.x < b[3] && p.z > b[2] && p.z < b[5] && O.tunnelAt(p.x, p.z) === 2 && p.y < O.tunnelInfo.ceil;
    if (inside && caveV < 0) { caveV = V.i; if (V.i !== 0) { V.i = 0; note('First person in the tunnel \u2014 change the camera view any time.'); } }
    else if (!inside && caveV >= 0) { if (V.i === 0) V.i = caveV; caveV = -1; }
  };
  let natT = 0, laserT = 0, drillNT = 0, warnT = 0, mgT = 0;
  AF.onTick('heist', 425, (dt, tw) => {
    voiceNow();
    if (H.after) { H.afterT -= dt; if (H.afterT <= 0 && !(UI.dialogueOpen && UI.dialogueOpen())) { const f = H.after; H.after = null; f(); } }
    const mn = H.on ? '' : 'none'; if (MENU.style.display !== mn) MENU.style.display = mn;
    const tb = tabletOk() ? '' : 'none'; if (TB.style.display !== tb) TB.style.display = tb;
    if (AF.quiet !== H.on) quiet(H.on);
    radarTick(dt); caveView(); driveTick(dt); kitTick(dt);
    if (!H.on) { if (muCur) music(); return; }
    // a parachute landing (skydive -> walk) is what the jump steps wait for
    if (AF.mode === 'skydive') H.flag.chuted = true;
    H.t += dt;
    const s = ST[H.i]; if (!s) return;
    if ((hudT -= dt) <= 0) { hudT = 0.16; H.hud.title = 'The Harbour Trust Job \u00b7 ' + actOf(H.i).replace(/^Act \w+ \u00b7 /, ''); H.hud.line = s.cut ? '' : wantedHold() ? '\u2605 Lose the police first \u2014 the job is on hold' : lineOf(s); bars(); music(); }
    if (!(AF.combat && AF.combat.gallery)) AF.hud.job = s.cut || AF.mode === 'cctv' ? null : H.hud;
    for (const it of FOLLOW) { const a = it._follow(); if (a && (it.can ? it.can() : true)) { it.x = a.x; it.y = a.y + 1; it.z = a.z; } else it.y = -999; }
    if (A.salonRope) A.salonRope.y1 = A.salonRope.y0 + (((is('salon') || is('sting')) && !myStingRole()) || (is('lace') && myStingRole() !== 'waiter' && !H.detGone) ? 2.6 : 1e-6);
    detTick(dt);
    // the doorman greets staff at the salon door once
    if ((is('salon') || is('sting')) && myStingRole() && !H.flag.doorSaid && near(A.salonDoor, 3.5, 3)) { H.flag.doorSaid = true; speak('door.in', HS.npc.door); }
    if (H.failing) return;
    lvTick();
    if (H.detHold > 0) H.detHold -= dt;
    if (H.pitHold > 0) H.pitHold -= dt;
    if (host() && (mgT -= dt) <= 0) { mgT = 0.5; mgCheck(); }
    if (host()) { siegeTick(dt); bankWaveTick(dt); wheelsTick(); ccTick(dt); }
    act4Tick(dt);
    ccGuestFx(dt);
    chaseTick(dt, tw);
    if (H.anger > 0 && (H.anger -= dt) <= 0) { H.anger = 0; const n = HS.npc.prescott; if (n) n.yaw = A.prescott.yaw || 0; }
    if (is('sting') && !H.dealing && !H.drillR && (crewN() < 2 || !H.took.dealer)) { if ((natT += dt) > 24) { natT = 0; speak('dealer.hand', HS.npc.celeste); setTimeout(() => { if (is('sting')) anger(4.8, true); }, 1200); } } else natT = 0;
    if (H.lockT > 0) H.lockT -= dt;
    for (let k = 0; k < 2; k++) if (H.grip[k] > 0 && (H.grip[k] -= dt) <= 0) { H.grip[k] = 0; if (is('keys') && !H.got.gate) note('The ' + KEYN[k] + ' key springs back \u2014 they have to turn together.', 'warn'); }
    // no papers, no plane: Westgate calls the police on a crew that skips the gate
    if (H.i > IDX.brief && H.i < IDX.plane && flying() && !H.flag.towerSaid) { H.flag.towerSaid = true; radio('tower.t3', true); const C = CB(); if (C) C.crime(120); note('No papers \u2014 Westgate called the police. Land and get cleared at the crew gate.', 'bad'); }
    if (is('fly') && !H.flag.leftSaid && dist(me(), A.plane) > 900) { H.flag.leftSaid = true; radio('tower.t2'); }
    if (is('fly') && !H.flag.isleSaid && dist(me(), A.strip) < 700) { H.flag.isleSaid = true; radio('vera.island'); }
    // the night: the tablet (T) from the roof door on; the lasers, the drill, the lions
    if (AF.input.hit('KeyT') && tabletOk()) openCams(true);
    if (isAny(BANK)) {
      if ((is('lasers') || is('drill') || is('cash')) && !H.got.lasersOff && HB && HB.touch() && (laserT -= dt) <= 0) { laserT = 3; sfx('ui_alert'); if (S) S.raiseAlarm('The laser grid tripped'); note('You broke a beam! The alarm\u2019s up.', 'bad'); }
      if (laserT > 0) laserT -= dt;
      const drilling = H.drilling || H.drillR;
      if (AF.audio) AF.audio.hold('heist-drill', 'drill_loop', drilling ? 0.9 : 0, 1, HB.spots.cage.x + 0.6, 1.4, HB.spots.cage.z);
      if (drilling && (drillNT -= dt) <= 0) { drillNT = 4; if (S) S.noiseAt(HB.spots.cage.x, 0.5, HB.spots.cage.z, 9, 'noise'); }
    }
    if ((is('den') || is('bunker')) && AF.den && AF.den.awake && AF.den.awake() && (warnT -= dt) <= 0) { warnT = 8; radio('vera.go'); }
    if (AF.audio) AF.audio.hold('heist-alarm', 'alarm_loop', (isAny(BANK) && S && S.zone && S.zone.id === 'bank' && S.zone.alarm) || is('escape') ? 1 : 0, 1, 30, 6, -125);
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
  AF.test('heist: bank alarm waves keep coming after every guard and reserve is down (retired reserves, empty pool retries)', () => {
    if (!S || !HB || !HB.ready || !HB.zone) return { ok: false, info: 'bank zone missing' };
    const z = HB.zone, res = z.guards.filter((g) => g.reserve);
    if (res.length < 6) return { ok: false, info: 'bank reserves ' + res.length };
    const zone0 = S.zone, fr0 = S.freeReserve, sp0 = S.spawn, keep = z.guards.map((g) => ({ g, down: g.down, live: g.live, dead: g.dead }));
    const spawned = []; let pool = [];
    try {
      for (const g of z.guards) { g.down = true; g.dead = true; if (g.reserve) g.live = true; }
      S.zone = z;
      S.freeReserve = () => pool.length ? pool.shift() : -1;
      S.spawn = (zid, i, x, y, zz) => { const g = z.guards[i]; if (!g) return false; g.down = false; spawned.push({ i, x, z: zz }); return true; };
      const W = { n: 0, t: 0, idx: 0, sent: 0 };
      bankWaveRun(W, 1, false);
      if (W.n !== 0 || W.t !== 4) return { ok: false, info: 'empty pool consumed a wave n=' + W.n + ' t=' + W.t };
      let n = 0;
      for (let k = 0; k < 6; k++) {
        for (const g of z.guards) g.down = true;
        pool = res.slice(0, 3).map((g) => g.i);
        W.t = 0; bankWaveRun(W, 1, false); n++;
        if (W.n !== n || W.t !== 25) return { ok: false, info: 'wave ' + k + ' n=' + W.n };
      }
      const P = HB.spots.waves, far = spawned.find((s) => !P.some((p) => Math.hypot(p.x - s.x, p.z - s.z) < 3));
      if (far) return { ok: false, info: 'spawned off the street entries at ' + far.x.toFixed(1) + ',' + far.z.toFixed(1) };
      return { ok: true, info: W.n + ' waves, ' + spawned.length + ' guards past any cap' };
    } finally {
      S.zone = zone0; S.freeReserve = fr0; S.spawn = sp0;
      for (const k of keep) { k.g.down = k.down; k.g.live = k.live; k.g.dead = k.dead; }
    }
  });
  AF.test('heist: solo starts, every step completes for the whole crew, checkpoints restore (the roof watch stays down), keys need the time lock, guards + zones exist', () => {
    if (!H.vera || !HS || !HS.ready || !HB || !HB.ready) return { ok: false, info: 'cast/sets missing' };
    const bad = CPS.map((c, i) => { const a = c.at(); return a && [a.x, a.y, a.z].every(Number.isFinite) && IDX[c.step] != null ? null : i; }).filter((i) => i != null);
    const role = N ? N.role : 'off', m0 = AF.money.v, mode = AF.mode, p = AF.player, keep = { x: p.x, y: p.y, z: p.z, yaw: p.yaw }, solo0 = H.solo;
    let refused = false, walked = 0, cuts = 0, keysLocked = false, keysOk = false, restored = false, wheelsCar = false, exitShut = false, exitOpen = false, sniped = false, zooOk = false, tablet = false;
    const nCuts = ST.filter((s) => s.cut).length;
    try {
      H.solo = false; start(); refused = !H.on && crewN() < NEED;
      H.solo = true; begin();
      for (let n = 0; n < 140 && H.on; n++) {
        if (ST[H.i].cut && cutDone()) cuts++;
        if (H.i === IDX.farm) wheelsCar = !!(H.car && !H.car.dead);
        if (H.i === IDX.park) setGot('wheels');
        if (H.i === IDX.snipe) { for (const g of HB.roofGuards(true)) S.knockOut(g, 0, 1, 'dead'); sniped = vantageLeft() === 0 && ST[H.i].done(); }
        if (H.i === IDX.zoosnipe) { for (const g of HS.zooG || []) if (g.vantage) S.knockOut(g, 0, 1, 'dead'); zooOk = (HS.zooG || []).length >= 6 && ST[H.i].done(); }
        if (H.i === IDX.hack) setGot('hacked');
        if (H.i === IDX.roofclear) { for (const g of HB.roofGuards(false)) S.knockOut(g, 0, 1, 'dead'); }
        if (H.i === IDX.door) tablet = camActions().some((a) => /roof door/i.test(a.label));
        if (H.i === IDX.keys) {
          grip(0, true); keysLocked = keysLocked || !(H.grip[0] > 0); lockOn(true); grip(0, true); grip(1, true); keysOk = !!H.got.gate;
          if (!restored) { restored = true; restore(H.cp); restored = H.i === IDX.roofclear && !!H.got.hacked && HB.roofGuards(true).every((g) => g.down); H.grip[0] = H.grip[1] = 0; continue; }
        }
        if (H.i === IDX.cash) for (let k = 0; k < 4; k++) bag(k, true);
        if (H.i === IDX.escape && !H.got.exit) { exitShut = !(HB.exitOpen && HB.exitOpen()); setGot('exit'); exitOpen = !!(HB.exitOpen && HB.exitOpen()); }
        walked++; advance(H.i);
      }
    } finally {
      if (H.on) end(false, true);
      H.solo = solo0; AF.money.add(m0 - AF.money.v); AF.setMode(mode === 'walk' ? 'walk' : 'aerial', keep);
    }
    const zones = ['shop', 'tunnel', 'queen', 'zoo', 'bank', 'roof'].filter((z) => S && S.zones.get(z) && S.zones.get(z).guards.length);
    return { ok: refused && !bad.length && walked >= ST.length && cuts === nCuts && keysLocked && keysOk && restored && wheelsCar && exitShut && exitOpen && sniped && zooOk && tablet && zones.length === 6 && !H.on && role === (N ? N.role : 'off'),
      info: `refused solo ${refused}, ${ST.length} steps walked ${walked}, cutscenes ${cuts}/${nCuts}, bad checkpoints ${bad.join(',') || 'none'}, keys locked ${keysLocked} ok ${keysOk}, roof restore ${restored}, wheels car ${wheelsCar}, exit shut ${exitShut} opens ${exitOpen}, sniped ${sniped}, zoo ${zooOk}, tablet ${tablet}, zones ${zones.join('/')}` };
  });
  AF.test('heist: Act IV \u2014 army stash + garage exist, the farm checkpoint spawns the armoured car, the chase fields a dozen cars + helicopters, no police, the respray heals', () => {
    const C = CB(); if (!C || !A.army || !A.garage || !A.farmDrop || !S || !S.zones.get('army')) return { ok: false, info: 'army / garage / drop missing' };
    const solo0 = H.solo, mode = AF.mode, p = AF.player, keep = { x: p.x, y: p.y, z: p.z, yaw: p.yaw };
    let car = false, cars = 0, helis = 0, over = false, painted = false, cops = false, soldiers = S.zones.get('army').guards.length;
    try {
      H.solo = true; begin(); restore(15); car = !!H.car && !H.car.dead && H.i === IDX.farm;
      enter(IDX.carchase, false); for (let k = 0; k < 6; k++) ccTick(2);
      cars = CC.list.filter((c) => c.chaser && !c.dead).length; act4Tick(0); cops = !!C.noCops; C.crime(500); cops = cops && !C.stars;
      heliStart(); helis = helisLeft(); for (const h of HE.list.slice()) heliDown(h, true); CC.t = 30; over = ccOver();
      enter(IDX.paint, true); H.car.hp = 40; setGot('paint'); painted = H.car.hp >= ARMOR_HP;
    } finally {
      if (H.on) end(false, true);
      H.solo = solo0; AF.setMode(mode === 'walk' ? 'walk' : 'aerial', keep);
    }
    return { ok: car && cars >= 9 && helis === heliN() && over && painted && cops && soldiers >= 6 && !C.noCops, info: `car ${car}, chasers ${cars}, helis ${helis}, over ${over}, painted ${painted}, no cops ${cops}, soldiers ${soldiers}` };
  });
}
} catch (e) { AF.partError('81-heist.js', e); }
