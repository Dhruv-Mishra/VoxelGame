// ================================================================ 77-combat.js
try {
// ===== 77-combat: weapons, fighting, the crowd's fight-or-flight, run-overs, police + the wanted level, vehicle damage  (OWNER: game) =====
// Weapons: slot 0 = the friend's signature melee (keyboard, handbag, dumbbell, microphone, bat, pan, cutlass, guitar), slots 1..4 =
//   firearms from a gun counter (AF.save.guns / .ammo). Click or Q attack, right mouse (hold) or Z aim, wheel / 1-5 / X switch,
//   R reload. Touch: HIT / AIM / WPN buttons (72-touch) press the same keys.
// Peds: a crowd walker only becomes 'engaged' (w.agg, stepped by CB.stepPed from 55-people's crowd tick) when the player hits it,
//   shoots near it, runs it over or barges into it at a sprint. Kinds flee | brawl | melee | gun (+ the cop pool). Engaged peds calm
//   down and go back to the bare pool past G.pedForgetD, so the ambient crowd costs what it always did. Kids and wheelchair users
//   are never targets: they only ever flee.
// Wanted: crimes add heat -> 1..5 stars (G.stars): foot cops (the cop pool), squad cars (physics-driven 'police' cars that unload
//   two officers) and from 3 stars an autogyro. Out of every officer's sight for G.evadeS[stars] s clears it; so does dying.
// Vehicles: car.hp -> car.dmg (0..1, the paint shader's soot), smoke below G.vehSmoke, burning at 0, then an explosion and a wreck.
{
  const PI = Math.PI, G = AF.G, S = AF.save, I = AF.input, VV = AF.vehicles, H = AF.health, FX = AF.fx, SFX = AF.sfx, UI = AF.ui;
  const CR = () => AF.peopleKit && AF.peopleKit.crowd;
  const lookOf = (w) => CR().V[w.v];
  const exempt = (w) => { const V = lookOf(w); return V.kid || V.chair; };
  const V3 = () => new THREE.Vector3(), MZ = V3(), DIR = V3(), TMP = V3();

  // ---------------------------------------------------------------- weapons
  // melee per friend: [name, damage, reach m, seconds between swings, model]
  const MELEE = {
    dhruv: ['Mech Keyboard', 15, 1.9, 0.55, 'keyboard'], hunar: ['Designer Handbag', 12, 1.8, 0.45, 'bag'], tanishk: ['Dumbbell', 19, 1.6, 0.7, 'dumbbell'],
    diksha: ['Microphone', 11, 1.7, 0.4, 'mic'], kush: ['Boss Bat', 17, 2.1, 0.6, 'bat'], divyangana: ['Frying Pan', 16, 1.9, 0.55, 'pan'],
    kaybee: ['Pirate Cutlass', 19, 2.2, 0.5, 'cutlass'], niranjan: ['Old Guitar', 17, 2.2, 0.7, 'guitar'],
  };
  const FISTS = ['Fists', 8, 1.4, 0.38, null];
  const GUNS = AF.GUNS = {
    revolver: { name: '.38 Revolver', dmg: 24, rate: 0.42, mag: 6, reload: 1.6, range: 70, spread: 0.018, pellets: 1, price: 350, pack: 12, packPrice: 15, snd: 'shot', model: [6, 0] },
    shotgun: { name: 'Pump Shotgun', dmg: 13, rate: 0.95, mag: 6, reload: 2.4, range: 28, spread: 0.075, pellets: 7, price: 900, pack: 8, packPrice: 28, snd: 'shotgun', two: true, model: [13, 6] },
    tommy: { name: 'Tommy Gun', dmg: 12, rate: 0.085, mag: 50, reload: 2.6, range: 55, spread: 0.04, pellets: 1, auto: true, price: 2600, pack: 50, packPrice: 70, snd: 'shot', two: true, model: [10, 5] },
    rifle: { name: 'Hunting Rifle', dmg: 75, rate: 1.2, mag: 5, reload: 2.2, range: 140, spread: 0.003, pellets: 1, zoom: 22, price: 1700, pack: 10, packPrice: 35, snd: 'rifle', two: true, model: [16, 7] },
  };
  const GUN_IDS = Object.keys(GUNS);
  // held models: built along -y from the hand (blade / barrel forward when the arm is raised), guns' grips along -z (down)
  const MODELS = new Map();
  const heldGeo = (id) => {
    if (MODELS.has(id)) return MODELS.get(id);
    const c = (hex, o) => AF.col(hex, Object.assign({ jitter: 0.12, edge: 0.3 }, o)), dark = c(0x24262a, { metal: 0.6, rough: 0.4 }), steel = c(0xc4c8ce, { metal: 0.9, rough: 0.25 }), wood = c(0x7a4a26), gold = c(0xd8b04a, { metal: 0.9, rough: 0.3 });
    let m, anchor = [0.5, 1, 0.5];
    const g = GUNS[id];
    if (g) {   // [barrel length, stock] in 1/16 m voxels
      const [L, stock] = g.model, hgt = L + 3 + stock; m = new AF.Model(2, hgt, 5);
      m.box(0, 0, 3, 2, L + 3, 5, dark); m.box(0, L, 2, 2, L + 3, 5, dark); m.box(0, L + 1, 0, 2, L + 3, 2, wood);
      if (stock) m.box(0, L + 3, 1, 2, hgt, 4, wood);
      if (id === 'tommy') { m.box(0, 3, 0, 2, 6, 2, wood); m.box(0, L - 2, 0, 2, L, 3, dark); }
      if (id === 'revolver') m.box(0, L - 1, 2, 2, L + 1, 5, steel);
      anchor = [0.5, (L + 2) / hgt, 2 / 5];
    } else if (id === 'keyboard') { m = new AF.Model(5, 16, 2); m.box(0, 0, 0, 5, 13, 2, dark); for (let y = 1; y < 12; y += 2) for (let x = 1; x < 4; x++) m.set(x, y, 1, (x + y) % 5 ? c(0xe8e4dc) : c(0x3aa0ff)); m.box(2, 13, 0, 3, 16, 1, dark); }
    else if (id === 'bag') { m = new AF.Model(7, 10, 3); m.box(0, 0, 0, 7, 6, 3, c(0xff5fae)); m.box(3, 2, 2, 4, 4, 3, gold); m.box(1, 6, 1, 2, 9, 2, gold); m.box(5, 6, 1, 6, 9, 2, gold); m.box(1, 9, 1, 6, 10, 2, gold); }
    else if (id === 'dumbbell') { m = new AF.Model(6, 12, 6); m.box(0, 0, 0, 6, 3, 6, dark); m.box(0, 9, 0, 6, 12, 6, dark); m.box(2, 3, 2, 4, 9, 4, steel); }
    else if (id === 'mic') { m = new AF.Model(3, 10, 3); m.box(0, 0, 0, 3, 3, 3, steel); m.box(1, 3, 1, 2, 10, 2, dark); }
    else if (id === 'bat') { m = new AF.Model(3, 20, 3); m.box(0, 0, 0, 3, 13, 3, c(0xc8945a)); m.box(1, 13, 1, 2, 20, 2, c(0xc8945a)); m.box(1, 17, 1, 2, 19, 2, dark); }
    else if (id === 'pan') { m = new AF.Model(9, 15, 2); for (let x = 0; x < 9; x++) for (let y = 0; y < 9; y++) if (Math.hypot(x - 4, y - 4) < 4.6) m.box(x, y, 0, x + 1, y + 1, 2, dark); m.box(4, 9, 0, 5, 15, 1, wood); }
    else if (id === 'cutlass') { m = new AF.Model(5, 19, 2); for (let y = 0; y < 13; y++) m.box(2 - (y < 4 ? 1 : 0), y, 0, 3, y + 1, 1, steel); m.box(0, 13, 0, 5, 14, 2, gold); m.box(2, 14, 0, 3, 19, 1, wood); m.box(0, 14, 0, 1, 18, 1, gold); }
    else if (id === 'guitar') { m = new AF.Model(9, 24, 3); for (let x = 0; x < 9; x++) for (let y = 0; y < 11; y++) if (Math.hypot((x - 4) * 1.1, y - (y < 5 ? 3 : 7)) < 4.4) m.box(x, y, 0, x + 1, y + 1, 3, c(0x9a4a22)); m.box(3, 4, 2, 6, 7, 3, dark); m.box(4, 11, 1, 5, 24, 2, c(0x4a2a14)); }
    if (!m) return null;
    const geo = AF.meshModel(m, { vs: 1 / 16, anchor }); MODELS.set(id, geo); return geo;
  };

  // ---------------------------------------------------------------- state
  const CB = AF.combat = { slot: 0, aimToggle: false, cd: 0, swing: 0, swingDur: 0.3, side: 0, hitAt: -1, reloadT: 0, mag: S.mag || (S.mag = {}), heat: 0, stars: 0, seenT: 0, engaged: 0, recoil: 0, flinch: 0, held: null, heldId: null, gallery: null };
  const owned = () => { const o = [null]; for (const id of GUN_IDS) if (S.guns[id]) o.push(id); return o; };
  const cur = () => { const o = owned(); if (CB.slot >= o.length) CB.slot = 0; return o[CB.slot]; };
  const melee = () => { const f = AF.friends && AF.friends.current; return (f && MELEE[f.id]) || FISTS; };
  CB.gun = cur; CB.GUNS = GUNS; CB.melee = melee;
  CB.label = () => {
    const g = CB.gallery ? 'gallery' : cur();
    if (g === 'gallery') return `<i>Gallery rifle</i><span>${CB.gallery.shots}</span>`;
    if (!g) return '<i>' + melee()[0] + '</i>';
    return `<i>${GUNS[g].name}</i><span>${CB.reloadT > 0 ? '\u21bb' : CB.mag[g] || 0}/${S.ammo[g] || 0}</span>`;
  };
  CB.give = (id) => { S.guns[id] = true; S.ammo[id] = (S.ammo[id] || 0) + GUNS[id].pack; CB.mag[id] = CB.mag[id] || 0; AF.saveSoon(); };
  const select = (slot) => { const o = owned(); CB.slot = ((slot % o.length) + o.length) % o.length; CB.reloadT = 0; attachHeld(); SFX.play('click'); };
  const attachHeld = () => {
    const P = AF.player && AF.player.parts; if (!P) return;
    const id = CB.gallery ? 'rifle' : cur() || melee()[4];
    if (CB.held && CB.heldId === id && CB.held.parent === P.armR) return;
    if (CB.held) CB.held.removeFromParent();
    CB.held = null; CB.heldId = id;
    const geo = id && heldGeo(id); if (!geo) return;
    const m = AF.modelMesh(geo); m.position.set(0, -0.52, 0.03); m.castShadow = false; m.frustumCulled = false; m.name = 'held'; P.armR.add(m); CB.held = m;
  };
  AF.on('look', () => { CB.held = null; attachHeld(); });
  AF.on('friend', () => { CB.slot = 0; attachHeld(); });

  // ---------------------------------------------------------------- wanted level
  const starsOf = (h) => { let n = 0; for (const t of G.stars) if (h >= t) n++; return n; };
  CB.crime = (n) => {
    if (CB.gallery || H.dead || !(n > 0)) return;
    CB.heat = Math.min(600, CB.heat + n); CB.seenT = 0;
    const s = starsOf(CB.heat);
    if (s > CB.stars) { CB.stars = s; AF.emit('toast', s === 1 ? 'The police are looking for you.' : s >= 4 ? 'Every cop in Port Solace wants a word with you!' : 'Wanted level up!'); }
  };
  const clearWanted = (msg) => { if (!CB.stars && !CB.heat) return; CB.heat = 0; CB.stars = 0; CB.seenT = 0; if (msg) AF.emit('toast', msg); };
  CB.clearWanted = clearWanted;
  AF.on('died', () => clearWanted());

  // ---------------------------------------------------------------- engaging peds
  const say = (w, t) => AF.emit('bubble', { who: w, name: '', text: t, dur: 2.2 });
  const FIGHT_LINES = ['You wanna go, pal?', 'Put \u2019em up!', 'Why, you\u2026!', 'Big mistake, buster!'], FLEE_LINES = ['Help! Police!', 'Somebody call a cop!', 'Leave me alone!', 'Yikes!'];
  const engage = (w, cause, force) => {
    if (w.agg) return w.agg;
    if (!w.act || (CB.engaged >= G.engagedMax && !force)) return null;
    const V = lookOf(w);
    let kind = 'flee';
    if (!V.kid && !V.chair && V.L.plan !== 'elder' && cause === 'hit') { const r = AF.hash2(w.id, (AF.clock.t / 60) | 0); kind = r < 0.48 ? 'flee' : r < 0.7 ? 'brawl' : r < 0.85 ? 'melee' : 'gun'; }
    if (kind !== 'flee' && !V.im.work) kind = 'flee';
    CB.engaged++;
    w.agg = { kind, hp: G.pedHp, st: 'go', t: 0, cd: 0.5 + Math.random(), f: 'p', lie: false, dy: 0, lead: w.lead || null, vx: 0, vz: 0, swing: 0, hitDone: false, aimT: 0, side: w.id & 1 ? 1 : -1, gy: w.y, gyT: 0, reported: false };
    w.lead = null; w.talk = 0;
    if (cause === 'hit') say(w, kind === 'flee' ? FLEE_LINES[w.id % 4] : FIGHT_LINES[w.id % 4]);
    return w.agg;
  };
  CB.release = (w) => {
    const A = w.agg; if (!A) return;
    if (w.cop) w.act = false; else CB.engaged = Math.max(0, CB.engaged - 1);
    w.lead = A.lead && A.lead.act && !A.lead.agg ? A.lead : null; w.agg = null; w.moving = false;
  };
  const down = (w, ko, fx, fz, v) => {
    const A = w.agg; if (!A) return;
    A.st = 'down'; A.t = ko === 'stagger' ? 5 : 0; A.ko = !!ko; A.lie = true; A.f = 'p'; A.vx = fx * v; A.vz = fz * v;
    w.yaw = Math.atan2(-fx, -fz); w.moving = false;
    FX.burst('dust', w.x, w.y + 0.2, w.z, 4);
  };
  // damage from the player (melee, bullets, cars, explosions): kind 'melee' knocks out, 'gun' / 'car' / 'boom' can kill
  const hitPed = (w, dmg, kind, fx, fz, innocent) => {
    if (exempt(w)) { engage(w, 'panic', true); return; }
    const A = engage(w, 'hit', true); if (!A || A.st === 'down') return;
    A.hp -= dmg; A.cd = Math.max(A.cd, 0.35); w.x += fx * 0.15; w.z += fz * 0.15;
    if (A.kind === 'flee' && kind === 'melee' && Math.random() < 0.3 && lookOf(w).im.work) A.kind = 'brawl';
    FX.burst('hit', w.x, w.y + 1.3, w.z, 1);
    const fell = A.hp <= 0;
    if (fell) down(w, kind === 'melee' && A.hp > -15 ? 'ko' : null, fx, fz, kind === 'car' || kind === 'boom' ? 6 : 1.5);
    if (!innocent && (!A.reported || fell)) { A.reported = true; CB.crime(w.cop ? (fell ? G.heat.copKill : G.heat.copHit) : fell ? (A.ko ? G.heat.ko : G.heat.kill) : G.heat.assault); }
  };
  const panic = (x, z, r) => {
    const C = CR();
    if (C) for (const w of C.walkers) if (w.act && !w.agg && !w.cop && (w.x - x) ** 2 + (w.z - z) ** 2 < r * r) { const A = engage(w, 'panic'); if (!A) break; }
    scareWalkers(x, z, r);
  };
  CB.panic = panic;
  // path walkers (54: airport, outland paths, the island) never fight back: shoved, knocked flat (then they get up), sent running.
  // Same crimes as the crowd. hitWalker never calls WK.near (callers may be iterating its shared array).
  const scareWalkers = (x, z, r) => { const WK = AF.walkers; if (WK && WK.near) for (const a of WK.near(x, z, r)) WK.scare(a, 6 + Math.random() * 4); };
  const hitWalker = (a, dmg, kind, fx, fz, innocent) => {
    const WK = AF.walkers; if (WK.isDown(a)) return;
    FX.burst('hit', a.x, a.y + 1.3, a.z, 1);
    a.hp = (a.hp ?? G.pedHp) - dmg;
    const fell = kind !== 'melee' || a.hp <= 0;
    if (fell) { WK.knock(a, fx, fz, kind === 'car' || kind === 'boom' ? 6 : 1.5, kind === 'melee' ? 7 : 25); a.hp = G.pedHp; FX.burst('dust', a.x, a.y + 0.2, a.z, 4); }
    else { WK.stagger(a, fx, fz); say(a, FLEE_LINES[(a.ph * 7 | 0) % 4]); }
    if (!innocent) CB.crime(fell ? (kind === 'melee' ? G.heat.ko : G.heat.kill) : G.heat.assault);
  };

  // ---------------------------------------------------------------- the player's target picture (on foot / in a car / out of reach)
  const TG = { x: 0, y: 0, z: 0, car: null, away: true, speed: 0 };
  const target = () => {
    const p = AF.player, car = AF.mode === 'drive' && VV.player;
    TG.car = car || null; TG.away = !(AF.mode === 'walk' || car);
    TG.x = car ? car.x : p.x; TG.y = car ? car.y : p.y; TG.z = car ? car.z : p.z; TG.speed = car ? Math.abs(car.v) : (AF.PL.walk.speed || 0);
    return TG;
  };
  const los = (x0, y0, z0, x1, y1, z1) => { for (let i = 1; i < 6; i++) { const u = i / 6; if (AF.solidAt(x0 + (x1 - x0) * u, y0 + (y1 - y0) * u, z0 + (z1 - z0) * u)) return false; } return true; };
  const pedShoot = (w, d) => {
    const hx = Math.sin(w.yaw), hz = Math.cos(w.yaw), mx = w.x + hx * 0.5, my = w.y + 1.35, mz = w.z + hz * 0.5;
    const p = AF.clamp((w.cop ? 0.6 : 0.42) - d * 0.012 - TG.speed * 0.03, 0.06, 0.7), hit = Math.random() < p;
    const ex = TG.x + (hit ? 0 : (Math.random() - 0.5) * 3), ey = TG.y + (hit ? 1.2 : 0.3 + Math.random()), ez = TG.z + (hit ? 0 : (Math.random() - 0.5) * 3);
    FX.burst('flash', mx, my, mz, 1, { size: 0.5 }); FX.line(mx, my, mz, ex, ey, ez); SFX.play('shot', w.x, w.z);
    if (!hit) { FX.burst('dust', ex, ey, ez, 2); return; }
    if (TG.car) { dmgCar(TG.car, 5); if (Math.random() < 0.3) H.hurt(4, 'shot'); }
    else { H.hurt(w.cop ? 9 : 7, 'shot'); FX.burst('hit', ex, ey, ez, 1); }
  };
  const gunner = (w) => w.agg.kind === 'gun';
  const WALKF = ['a', 'p', 'b', 'p'];
  // stepped by 55-people's crowd tick for every walker with an .agg; false = calm down, back to the pool
  CB.stepPed = (w, dt) => {
    const A = w.agg; A.t += dt; A.cd -= dt;
    const T = target(), dx = T.x - w.x, dz = T.z - w.z, d = Math.hypot(dx, dz) || 1e-3;
    if (A.st === 'down') {
      if (A.vx || A.vz) { w.x += A.vx * dt; w.z += A.vz * dt; const k = Math.exp(-dt * 4); A.vx *= k; A.vz *= k; if (Math.abs(A.vx) + Math.abs(A.vz) < 0.05) A.vx = A.vz = 0; w.y = AF.surfaceBelow(w.x, w.z, w.y + 0.6, 2); }
      if (A.ko && A.t > 7) { A.st = 'go'; A.lie = false; A.kind = 'flee'; A.hp = 8; A.t = 0; }
      return A.t < 30 && d < G.pedForgetD + 20;
    }
    if (T.away && A.t > 3) return false;
    if (!w.cop && d > G.pedForgetD) return false;
    if (A.kind === 'flee' && A.t > 8 && d > 40) return false;
    if (w.cop && !CB.stars && (d > 30 || A.t > 25)) return false;
    let sp = 0, hx = dx / d, hz = dz / d, face = Math.atan2(hx, hz), f = 'p';
    if (A.kind === 'flee') { sp = 3.3 + (w.id % 3) * 0.3; hx = -hx; hz = -hz; f = 'run'; }
    else if (gunner(w)) {
      const want = w.cop ? 12 : 9;
      if (d > want + 6) { sp = 3.2; f = 'run'; }
      else if (d < want - 4) { sp = 1.8; hx = -hx; hz = -hz; f = 'walk'; }
      else { sp = 1.1; const s = A.side; [hx, hz] = [-hz * s, hx * s]; f = 'walk'; if (A.t % 4 < dt) A.side = -A.side; }
      if (d < 45 && A.cd <= 0 && !T.away && los(w.x, w.y + 1.5, w.z, T.x, T.y + 1.2, T.z)) { pedShoot(w, d); A.cd = (w.cop ? 0.9 : 1.4) + Math.random() * 0.8; A.aimT = 0.45; }
      if (A.aimT > 0) { A.aimT -= dt; f = 'work'; sp *= 0.25; }
    } else {   // brawl / melee / an unarmed cop: close in and swing
      if (d > 1.15 && !(T.car && d < 5)) { sp = d > 4 ? 3.3 : 2.2; f = d > 4 ? 'run' : 'walk'; }
      if (d < 1.6 && A.cd <= 0 && !T.car && A.swing <= 0) { A.swing = 0.45; A.cd = 1 + Math.random() * 0.6; A.hitDone = false; }
      if (A.swing > 0) {
        A.swing -= dt; f = A.swing > 0.22 ? 'hail' : 'work'; sp = 0;
        if (A.swing <= 0.22 && !A.hitDone) { A.hitDone = true; if (d < 1.8 && AF.mode === 'walk') { H.hurt(A.kind === 'melee' ? 10 : w.cop ? 8 : 6, 'melee'); AF.PL.push(hx * 3, hz * 3); SFX.play('punch', w.x, w.z); CB.flinch = 0.3; } }
      }
    }
    if (sp > 0) {
      let mx = hx * sp * dt, mz = hz * sp * dt;
      if (AF.boxBlocked(w.x + mx * 4, w.y + 0.35, w.z + mz * 4, 0.22, 1.2)) { const s = A.side; [mx, mz] = [-mz * s, mx * s]; if (AF.boxBlocked(w.x + mx * 4, w.y + 0.35, w.z + mz * 4, 0.22, 1.2)) { A.side = -s; mx = mz = 0; } }
      w.x += mx; w.z += mz;
      if ((A.gyT -= dt) <= 0) { A.gyT = 0.25; A.gy = AF.surfaceBelow(w.x, w.z, w.y + 0.7, 2.5); }
      w.y += (A.gy - w.y) * Math.min(1, dt * 12); w.ph += dt * sp * 2.3 / w.s;
      if (mx || mz) { const my = Math.atan2(mx, mz); if (A.kind === 'flee' || f === 'run') face = my; }
    }
    if (f === 'run') f = sp > 0 ? (Math.floor(w.ph) & 1 ? 'runA' : 'runB') : 'p'; else if (f === 'walk') f = sp > 0 ? WALKF[Math.floor(w.ph) & 3] : 'p';
    w.yaw += AF.angDiff(w.yaw, face) * Math.min(1, dt * 10);
    w.moving = sp > 0; A.f = f;
    return true;
  };

  // ---------------------------------------------------------------- the player's attacks
  const HIT = { t: 0, kind: null, obj: null, x: 0, y: 0, z: 0 };
  // ray against a vertical capsule (feet y0, height hgt, radius r): distance along the ray, or Infinity
  const rayCapsule = (ox, oy, oz, dx, dy, dz, x, y0, z, hgt, r) => {
    const hl = dx * dx + dz * dz; if (hl < 1e-6) return Infinity;
    const t = ((x - ox) * dx + (z - oz) * dz) / hl; if (t < 0) return Infinity;
    const px = ox + dx * t - x, pz = oz + dz * t - z, py = oy + dy * t;
    return px * px + pz * pz < r * r && py > y0 && py < y0 + hgt ? t : Infinity;
  };
  const raySphere = (ox, oy, oz, dx, dy, dz, x, y, z, r) => {
    const lx = x - ox, ly = y - oy, lz = z - oz, t = lx * dx + ly * dy + lz * dz; if (t < 0) return Infinity;
    const qx = lx - dx * t, qy = ly - dy * t, qz = lz - dz * t; return qx * qx + qy * qy + qz * qz < r * r ? t : Infinity;
  };
  const ray = (ox, oy, oz, dx, dy, dz, range, t0) => {
    HIT.t = range; HIT.kind = null; HIT.obj = null;
    for (let t = t0 + 0.3; t < range; t += 0.45) if (AF.solidAt(ox + dx * t, oy + dy * t, oz + dz * t)) { HIT.t = t; HIT.kind = 'world'; break; }
    const C = CR(), R2 = range * range;
    if (C && !CB.gallery) for (const w of C.walkers) {
      if (!w.act || (w.agg && w.agg.lie) || (w.x - ox) ** 2 + (w.z - oz) ** 2 > R2 || exempt(w)) continue;
      const t = rayCapsule(ox, oy, oz, dx, dy, dz, w.x, w.y, w.z, 1.75 * w.s, 0.32); if (t > t0 && t < HIT.t) { HIT.t = t; HIT.kind = 'ped'; HIT.obj = w; }
    }
    const WK = AF.walkers;
    if (WK && WK.near && !CB.gallery) for (const a of WK.near(ox, oz, range)) {
      if (WK.isDown(a)) continue;
      const t = rayCapsule(ox, oy, oz, dx, dy, dz, a.x, a.y, a.z, 1.75, 0.32); if (t > t0 && t < HIT.t) { HIT.t = t; HIT.kind = 'walker'; HIT.obj = a; }
    }
    if (!CB.gallery) for (const c of VV.cars) {
      if (c.active === false || c.player || (c.x - ox) ** 2 + (c.z - oz) ** 2 > R2) continue;
      const t = raySphere(ox, oy, oz, dx, dy, dz, c.x, c.y + 0.8, c.z, Math.min(c.halfL, 2.2)); if (t > t0 && t < HIT.t) { HIT.t = t; HIT.kind = 'car'; HIT.obj = c; }
    }
    if (HELI.on && !CB.gallery) { const t = raySphere(ox, oy, oz, dx, dy, dz, HELI.x, HELI.y + 1, HELI.z, 3); if (t < HIT.t) { HIT.t = t; HIT.kind = 'heli'; } }
    if (CB.gallery) for (const d of CB.gallery.targets()) { const t = raySphere(ox, oy, oz, dx, dy, dz, d.x, d.y, d.z, 0.24); if (t < HIT.t) { HIT.t = t; HIT.kind = 'duck'; HIT.obj = d; } }
    HIT.x = ox + dx * HIT.t; HIT.y = oy + dy * HIT.t; HIT.z = oz + dz * HIT.t;
    return HIT;
  };
  CB.ray = ray;
  // hip fire picks the nearest ped / car inside a 25 degree cone (aim assist, the only aiming on a phone without AIM)
  const autoTarget = (ox, oz, fx, fz, range) => {
    const C = CR(); let best = null, bd = range;
    if (C) for (const w of C.walkers) {
      if (!w.act || (w.agg && w.agg.lie) || exempt(w)) continue;
      const dx = w.x - ox, dz = w.z - oz, d = Math.hypot(dx, dz); if (d > bd || d < 0.5) continue;
      if ((dx * fx + dz * fz) / d < 0.9 || !los(ox, AF.player.y + 1.4, oz, w.x, w.y + 1.3, w.z)) continue;
      bd = d; best = w;
    }
    const WK = AF.walkers;
    if (WK && WK.near) for (const a of WK.near(ox, oz, bd)) {
      if (WK.isDown(a)) continue;
      const dx = a.x - ox, dz = a.z - oz, d = Math.hypot(dx, dz); if (d > bd || d < 0.5) continue;
      if ((dx * fx + dz * fz) / d < 0.9 || !los(ox, AF.player.y + 1.4, oz, a.x, a.y + 1.3, a.z)) continue;
      bd = d; best = a;
    }
    return best;
  };
  const reload = () => {
    const g = cur(); if (!g || CB.reloadT > 0) return;
    const W = GUNS[g], need = W.mag - (CB.mag[g] || 0), have = S.ammo[g] || 0;
    if (need <= 0 || have <= 0) return;
    CB.reloadT = W.reload; CB.reloadG = g;
  };
  let emptyT = 0;
  const fire = (g) => {
    const W = GUNS[g], gal = CB.gallery;
    if (!gal && !(CB.mag[g] > 0)) { if ((S.ammo[g] || 0) > 0) reload(); else { SFX.play('click'); CB.cd = 0.3; if (AF.clock.t - emptyT > 4) { emptyT = AF.clock.t; AF.emit('toast', 'Out of ammo \u2014 a gun counter sells more.'); } } return; }
    if (gal) { if (gal.shots <= 0) return; gal.shots--; } else { CB.mag[g]--; AF.saveSoon(); }
    CB.cd = W.rate; CB.recoil = 1;
    const p = AF.player, cam = AF.camera;
    p.mesh.updateMatrixWorld(true);
    if (CB.held) CB.held.getWorldPosition(MZ); else MZ.set(p.x, p.y + 1.4, p.z);
    let ox, oy, oz, t0 = 0;
    if (AF.PL.aim) {   // through the crosshair: from the camera, starting level with the player
      cam.getWorldDirection(DIR); ox = cam.position.x; oy = cam.position.y; oz = cam.position.z;
      t0 = Math.max(0, (p.x - ox) * DIR.x + (p.y + 1.4 - oy) * DIR.y + (p.z - oz) * DIR.z);
    } else {
      const fx = Math.sin(p.yaw), fz = Math.cos(p.yaw), w = autoTarget(p.x, p.z, fx, fz, W.range);
      ox = MZ.x; oy = MZ.y; oz = MZ.z;
      if (w) { DIR.set(w.x - ox, w.y + 1.2 * (w.s || 1) - oy, w.z - oz).normalize(); p.yaw = Math.atan2(DIR.x, DIR.z); } else DIR.set(fx, 0, fz);
    }
    let any = false;
    for (let k = 0; k < (W.pellets || 1); k++) {
      const s = gal ? 0.004 : W.spread * (AF.PL.aim ? 0.6 : 1.4);
      TMP.set(DIR.x + (Math.random() - 0.5) * s * 2, DIR.y + (Math.random() - 0.5) * s * 2, DIR.z + (Math.random() - 0.5) * s * 2).normalize();
      const h = ray(ox, oy, oz, TMP.x, TMP.y, TMP.z, W.range, t0);
      FX.line(MZ.x, MZ.y, MZ.z, h.x, h.y, h.z);
      if (h.kind === 'ped') { hitPed(h.obj, W.dmg, 'gun', TMP.x, TMP.z); any = true; }
      else if (h.kind === 'walker') { hitWalker(h.obj, W.dmg, 'gun', TMP.x, TMP.z); any = true; }
      else if (h.kind === 'car') { dmgCar(h.obj, W.dmg * 0.35, true); FX.burst('spark', h.x, h.y, h.z, 3, { spread: 4 }); any = true; }
      else if (h.kind === 'heli') { heliHit(W.dmg); FX.burst('spark', h.x, h.y, h.z, 3, { spread: 4 }); any = true; }
      else if (h.kind === 'duck') { gal.hit(h.obj); any = true; }
      else if (h.kind === 'world') FX.burst('dust', h.x - TMP.x * 0.1, h.y - TMP.y * 0.1, h.z - TMP.z * 0.1, 2);
    }
    if (any) AF.hud.hitMark();
    FX.burst('flash', MZ.x + DIR.x * 0.25, MZ.y + DIR.y * 0.25, MZ.z + DIR.z * 0.25, 1, { size: W.pellets > 1 ? 0.9 : 0.6 });
    SFX.play(gal ? 'shot' : W.snd, p.x, p.z);
    if (!gal) { CB.crime(G.heat.shots * (W.auto ? 0.25 : 1)); panic(p.x, p.z, G.panicR); }
  };
  const swing = () => {
    const W = melee(); CB.cd = W[3]; CB.swing = CB.swingDur = W[4] ? 0.34 : 0.24; CB.side ^= 1; CB.hitAt = CB.swingDur * 0.45;
    SFX.play('swing');
  };
  const resolveMelee = () => {
    const W = melee(), p = AF.player, fx = Math.sin(p.yaw), fz = Math.cos(p.yaw), C = CR();
    let best = null, bd = W[2];
    if (C) for (const w of C.walkers) {
      if (!w.act || (w.agg && w.agg.lie)) continue;
      const dx = w.x - p.x, dz = w.z - p.z, d = Math.hypot(dx, dz); if (d > bd || Math.abs(w.y - p.y) > 1.4) continue;
      if (d > 0.4 && (dx * fx + dz * fz) / d < 0.35) continue;
      bd = d; best = w;
    }
    let walker = null; const WK = AF.walkers;
    if (WK && WK.near) for (const a of WK.near(p.x, p.z, bd)) {
      if (WK.isDown(a) || Math.abs(a.y - p.y) > 1.4) continue;
      const dx = a.x - p.x, dz = a.z - p.z, d = Math.hypot(dx, dz); if (d > bd) continue;
      if (d > 0.4 && (dx * fx + dz * fz) / d < 0.35) continue;
      bd = d; walker = a;
    }
    if (walker) { hitWalker(walker, W[1], 'melee', fx, fz); SFX.play('punch', p.x, p.z); AF.hud.hitMark(); scareWalkers(p.x, p.z, 12); return; }
    if (best) { hitPed(best, W[1], 'melee', fx, fz); SFX.play('punch', p.x, p.z); AF.hud.hitMark(); return; }
    for (const c of VV.cars) if (c.active !== false && !c.player && Math.abs(c.x - p.x) < 4 && Math.abs(c.z - p.z) < 4 && VV.bodyDist(c, p.x + fx * 0.8, p.z + fz * 0.8) < 0.3) { dmgCar(c, 2, true); SFX.play('crash', c.x, c.z); return; }
  };

  // ---------------------------------------------------------------- vehicle damage + wrecks
  const HURT = new Set();
  const dmgCar = (car, n, byPlayer) => {
    if (!car || car.dead || car.static || !(n > 0)) return;
    car.hp = (car.hp ?? G.vehHp) - n; car.dmg = AF.clamp(1 - car.hp / G.vehHp, 0, 1) * 0.8;
    if (byPlayer) car.byPlayer = true;
    if (car.hp < G.vehSmoke) HURT.add(car);
    if (car.hp <= 0 && !(car.burnT > 0)) {
      car.burnT = G.vehBurnS; car.temp = true;
      if (car.ai) { VV.detachTraffic(car); const i = VV.ai.indexOf(car); if (i >= 0) VV.ai.splice(i, 1); car.ai = null; car.parked = true; car.v = car.vx = car.vz = 0; car.driver = -1; }
      if (car.player) AF.emit('toast', 'The engine\u2019s on fire \u2014 get out!');
    }
  };
  CB.dmgCar = dmgCar;
  VV.onImpact = (car, dv, other) => {
    if (dv < G.vehDmgMin || !car || car.static) return;
    dmgCar(car, (dv - G.vehDmgMin) * G.vehDmgK, !!(car.player || (other && other.player)));
    if (!car.player) return;
    SFX.play('crash', car.x, car.z); AF.shake(Math.min(0.8, dv / 16));
    if (dv > 5) FX.burst('spark', car.x + Math.sin(car.yaw) * car.halfL, car.y + 0.6, car.z + Math.cos(car.yaw) * car.halfL, 6);
    if (dv > G.crashMin) H.hurt((dv - G.crashMin) * G.crashK, 'crash');
  };
  const explode = (car) => {
    car.dead = true; car.deadT = AF.clock.t; car.dmg = 1; car.hp = 0; car.burnT = 0; car.smokeT = 18; car.temp = true;
    car.y += 0.15; car.roll = (Math.random() - 0.5) * 0.25; car.pitch = (Math.random() - 0.5) * 0.15; VV.placeMesh(car);
    FX.boom(car.x, car.y, car.z);
    if (VV.player === car) { VV.exitCar(); H.hurt(55, 'boom'); }
    const R = G.boomR, C = CR();
    if (C) for (const w of C.walkers) { if (!w.act || (w.agg && w.agg.lie)) continue; const dx = w.x - car.x, dz = w.z - car.z, d = Math.hypot(dx, dz); if (d < R) hitPed(w, G.boomDmg * (1 - d / R), 'boom', dx / (d || 1), dz / (d || 1), !car.byPlayer); }
    const WK = AF.walkers;
    if (WK && WK.near) for (const a of WK.near(car.x, car.z, R)) { const dx = a.x - car.x, dz = a.z - car.z, d = Math.hypot(dx, dz) || 1; hitWalker(a, G.boomDmg, 'boom', dx / d, dz / d, !car.byPlayer); }
    if (AF.mode === 'walk') { const p = AF.player, dx = p.x - car.x, dz = p.z - car.z, d = Math.hypot(dx, dz); if (d < R) { H.hurt(G.boomDmg * (1 - d / R), 'boom'); AF.PL.push(dx / (d || 1) * 8, dz / (d || 1) * 8, 6); } }
    for (const c of VV.cars) if (c !== car && !c.dead && Math.abs(c.x - car.x) < R && Math.abs(c.z - car.z) < R) { const d = Math.hypot(c.x - car.x, c.z - car.z); if (d < R) dmgCar(c, 70 * (1 - d / R), car.byPlayer); }
    if (car.byPlayer) CB.crime(G.heat.carBoom);
    panic(car.x, car.z, 35);
  };
  let smokeT = 0;
  const carFx = (dt) => {
    if (!HURT.size) return;
    const puff = (smokeT -= dt) <= 0; if (puff) smokeT = 0.12;
    for (const car of HURT) {
      if (car.active === false) { HURT.delete(car); continue; }
      const hx = Math.sin(car.yaw), hz = Math.cos(car.yaw), x = car.x + hx * (car.halfL - 0.7), z = car.z + hz * (car.halfL - 0.7), y = car.y + 1.0;
      if (car.burnT > 0) { car.burnT -= dt; if (puff) { FX.burst('fire', x, y, z, 2); FX.burst('smoke', x, y + 0.6, z, 1, { size: 1.4 }); } if (car.burnT <= 0) explode(car); continue; }
      if (car.dead) { if ((car.smokeT -= dt) <= 0) { HURT.delete(car); continue; } if (puff) { FX.burst('smoke', car.x, y, car.z, 1, { size: 1.6 }); if (car.smokeT > 10) FX.burst('fire', car.x, y - 0.2, car.z, 1); } continue; }
      if (puff && Math.random() < AF.clamp((G.vehSmoke - car.hp) / G.vehSmoke + 0.2, 0, 1)) FX.burst(car.hp < 20 ? 'smoke' : 'steam', x, y, z, 1);
    }
  };

  // ---------------------------------------------------------------- run-overs + player <-> ped collisions
  let hitCd = 0;
  // is (x, z) inside the car's footprint (+0.3 m)? RO holds the car's frame so the 15 Hz loop allocates nothing
  const RO = { car: null, s: 0, c: 1, R: 0, hx: 0, hl: 0 };
  const underCar = (x, z) => { const k = RO.car, rx = x - k.x, rz = z - k.z; if (Math.abs(rx) > RO.R || Math.abs(rz) > RO.R) return false; const lx = rx * RO.c - rz * RO.s, lz = rx * RO.s + rz * RO.c; return Math.abs(lx) < RO.hx && Math.abs(lz) < RO.hl; };
  const runOver = () => {
    const C = CR(); if (!C) return;
    const p = AF.player, walk = AF.mode === 'walk';
    for (const car of VV.cars) {
      const v = Math.abs(car.v || 0); if (v < 3.5 || car.active === false || car.static || car.dead) continue;
      if ((car.x - p.x) ** 2 + (car.z - p.z) ** 2 > 3600) continue;
      RO.car = car; RO.s = Math.sin(car.yaw); RO.c = Math.cos(car.yaw); RO.R = car.halfL + 0.6; RO.hx = car.halfW + 0.3; RO.hl = car.halfL + 0.3;
      const fx = RO.s, fz = RO.c, rogue = car.player || car.squad;
      for (const w of C.walkers) {
        // traffic keeps to its lanes: only a player / squad car, or a ped already running loose, gets hit
        if (!w.act || (w.agg && w.agg.lie) || (!rogue && !w.agg) || Math.abs(w.y - car.y) > 1.5 || !underCar(w.x, w.z)) continue;
        if (exempt(w)) { engage(w, 'panic', true); continue; }
        const A = engage(w, 'car', true); if (!A) continue;
        A.hp = v > 9 ? -99 : 0; down(w, v > 9 ? null : 'ko', fx, fz, Math.min(9, v * 0.6));
        FX.burst('hit', w.x, w.y + 0.9, w.z, 1); SFX.play('punch', w.x, w.z);
        if (car.player) { dmgCar(car, 2, true); if (!A.reported) { A.reported = true; CB.crime(G.heat.runOver); } }
      }
      const WK = AF.walkers;
      if (rogue && WK && WK.near) for (const a of WK.near(car.x, car.z, RO.R)) {
        if (WK.isDown(a) || Math.abs(a.y - car.y) > 1.5 || !underCar(a.x, a.z)) continue;
        WK.knock(a, fx, fz, Math.min(9, v * 0.6), 25); FX.burst('hit', a.x, a.y + 0.9, a.z, 1); SFX.play('punch', a.x, a.z);
        if (car.player) { dmgCar(car, 2, true); CB.crime(G.heat.runOver); }
      }
      if (walk && !car.player && hitCd <= 0 && Math.abs(p.y - car.y) < 1.5 && underCar(p.x, p.z)) {
        hitCd = 1; H.hurt(Math.max(0, v - G.carHitMin) * G.carHitK + 5, 'car'); AF.PL.push(fx * v * 0.7, fz * v * 0.7, 5); SFX.play('crash', p.x, p.z);
      }
    }
  };
  let bumpCd = 0, bumpN = 0;
  const BUMP_LINES = ['Hey! Watch it!', 'Oof!', 'Mind your step, pal!'];
  // keep the player's body out of a ped at (x, y, z): true on contact, BP = the unit push (ped -> player)
  const BP = { nx: 0, nz: 0 };
  const shove = (b, x, y, z) => {
    const dx = b.x - x, dz = b.z - z; if (dx > 0.7 || dx < -0.7 || dz > 0.7 || dz < -0.7 || Math.abs(y - b.y) > 1.2) return false;
    const d = Math.hypot(dx, dz); if (d > 0.62 || d < 1e-3) return false;
    const k = (0.62 - d) / d, nx = b.x + dx * k, nz = b.z + dz * k;
    if (!AF.boxBlocked(nx, b.y, nz, 0.3, 1.7)) { b.x = nx; b.z = nz; AF.player.x = nx; AF.player.z = nz; }
    BP.nx = dx / d; BP.nz = dz / d; return true;
  };
  const bodyPush = (dt) => {
    const C = CR(), b = AF.player.body, sprint = (AF.PL.walk.speed || 0) > 7; if (!C) return;
    bumpCd -= dt;
    for (const w of C.walkers) {
      if (!w.act || (w.agg && w.agg.lie) || !shove(b, w.x, w.y, w.z)) continue;
      // barging through at a sprint: the ped staggers and complains (not a crime)
      if (sprint && !w.agg && !w.cop && bumpCd <= 0 && !exempt(w)) {
        bumpCd = 0.6; const A = engage(w, 'bump'); if (A) { A.kind = 'flee'; down(w, 'stagger', -BP.nx, -BP.nz, 2); say(w, BUMP_LINES[w.id % 3]); SFX.play('punch', w.x, w.z); }
      }
    }
    const WK = AF.walkers; if (!WK || !WK.near) return;
    for (const a of WK.near(b.x, b.z, 0.8)) {
      if (WK.isDown(a) || !shove(b, a.x, a.y, a.z)) continue;
      if (sprint && bumpCd <= 0) { bumpCd = 0.6; WK.stagger(a, -BP.nx, -BP.nz); say(a, BUMP_LINES[bumpN++ % 3]); SFX.play('punch', a.x, a.z); }
    }
  };

  // ---------------------------------------------------------------- police: foot officers, squad cars, the autogyro
  const SQUADS = [];
  let copCd = 0, squadCd = 0;
  const pl = () => AF.player;
  const spawnPoint = (rMin, rMax) => {
    const p = target(), cam = AF.camera; cam.getWorldDirection(DIR);
    for (let i = 0; i < 12; i++) {
      const a = Math.random() * PI * 2, r = rMin + Math.random() * (rMax - rMin), x = p.x + Math.sin(a) * r, z = p.z + Math.cos(a) * r;
      if ((Math.sin(a) * DIR.x + Math.cos(a) * DIR.z) > 0.4 && i < 8) continue;   // prefer behind the camera
      const y = AF.surfaceBelow(x, z, p.y + 8, 20);
      if (Number.isFinite(y) && Math.abs(y - p.y) < 6 && !AF.boxBlocked(x, y + 0.05, z, 0.3, 1.7)) return TMP.set(x, y, z);
    }
    return null;
  };
  const spawnCop = (at) => {
    const C = CR(); if (!C) return false;
    const w = C.walkers.find((q) => q.cop && !q.act); if (!w) return false;
    const P = at || spawnPoint(28, 44); if (!P) return false;
    w.x = P.x; w.y = P.y; w.z = P.z; w.yaw = Math.atan2(pl().x - P.x, pl().z - P.z); w.act = true; w.ph = 0;
    w.agg = { kind: CB.stars >= 2 || cur() ? 'gun' : 'brawl', hp: G.copHp, st: 'go', t: 0, cd: 1.5, f: 'p', lie: false, dy: 0, lead: null, vx: 0, vz: 0, swing: 0, hitDone: false, aimT: 0, side: w.id & 1 ? 1 : -1, gy: P.y, gyT: 0, reported: false };
    return true;
  };
  const spawnSquad = () => {
    const P = target(), VP = AF.PLAN;
    for (let i = 0; i < 8; i++) {
      const a = Math.random() * PI * 2, r = 70 + Math.random() * 30, nr = VP.nearestRoad(P.x + Math.sin(a) * r, P.z + Math.cos(a) * r), R = nr.road;
      if (!R || nr.edge > 25) continue;
      const x = R.a[0] + (R.b[0] - R.a[0]) * nr.t, z = R.a[1] + (R.b[1] - R.a[1]) * nr.t, yaw = Math.atan2(P.x - x, P.z - z);
      if (VV.carBlocked({ halfL: 2.6, halfW: 0.95, height: 1.5, y: AF.W.groundY(x, z) }, x, z, yaw)) continue;
      const car = VV.makeCar('police', 0, x, z, yaw); car.temp = true; car.squad = { stuck: 0, rev: 0 }; car.parked = false; car.vx = car.vz = 0;
      SQUADS.push(car); return car;
    }
    return null;
  };
  const SQ_IN = { up: false, down: false, left: 0, right: 0, brake: false, thr: 1 };
  const driveSquad = (car, dt) => {
    const Q = car.squad, T = target(), dx = T.x - car.x, dz = T.z - car.z, d = Math.hypot(dx, dz);
    let diff = AF.angDiff(car.yaw, Math.atan2(dx, dz));
    if (Q.rev > 0) { Q.rev -= dt; diff = -diff; }
    SQ_IN.left = diff > 0.05 ? Math.min(1, diff * 2) : 0; SQ_IN.right = diff < -0.05 ? Math.min(1, -diff * 2) : 0;
    SQ_IN.up = Q.rev <= 0 && d > 9; SQ_IN.down = Q.rev > 0; SQ_IN.brake = d < 9 && Math.abs(car.v) > 1.5;
    if (SQ_IN.up && Math.abs(car.v) < 0.6) { if ((Q.stuck += dt) > 1.5) { Q.stuck = 0; Q.rev = 1.2; } } else Q.stuck = 0;
    const n = Math.min(4, Math.ceil(dt * 60 - 0.01)) || 1; for (let i = 0; i < n; i++) VV.physics(car, dt / n, SQ_IN);
    VV.placeMesh(car); if (car.interact) car.sync();
    const blink = (AF.clock.t * 4 | 0) & 1; FX.glow.spawn(car.x + Math.cos(car.yaw) * (blink ? 0.35 : -0.35), car.y + 1.75, car.z - Math.sin(car.yaw) * (blink ? 0.35 : -0.35), 0, 0, 0, 0.05, 0.9, 0, 0, blink ? 3 : 0.3, 0.2, blink ? 0.3 : 3);
    // pulled up: two officers step out; the car stays as a temp car (forgotten later)
    if (d < 11 && Math.abs(car.v) < 1.5 && !T.away) {
      for (const s of [1, -1]) spawnCop(TMP.set(car.x + Math.cos(car.yaw) * (car.halfW + 0.8) * s, car.y, car.z - Math.sin(car.yaw) * (car.halfW + 0.8) * s));
      car.squad = null; car.parked = true; car.v = car.vx = car.vz = 0;
    }
  };
  // the autogyro: circles the player from 3 stars, a searchlight pool at night, shoots from 4; can be shot down
  const HELI = CB.heli = { on: false, x: 0, y: 0, z: 0, yaw: 0, vx: 0, vz: 0, hp: 0, a: 0, cd: 2, fall: false, vy: 0, grp: null, rotor: null };
  const heliBuild = () => {
    const c = (hex, o) => AF.col(hex, Object.assign({ jitter: 0.15, edge: 0.3 }, o)), navy = c(0x1f2a44), cream = c(0xefe6cf), glass = AF.col('glass'), dark = c(0x24262a), gold = c(0xd8b04a, { metal: 0.8 });
    const m = new AF.Model(10, 14, 34);
    for (let z = 4; z < 24; z++) for (let y = 2; y < 11; y++) for (let x = 1; x < 9; x++) { const ex = (x + 0.5 - 5) / 4, ey = (y + 0.5 - 6.5) / 4.5, ez = (z + 0.5 - 14) / 10; if (ex * ex + ey * ey + ez * ez * ez * ez < 1) m.set(x, y, z, y > 7 && z > 15 ? glass : y === 6 ? cream : navy); }
    for (let z = 0; z < 6; z++) m.box(4, 6, z, 6, 8, z + 1, navy); m.box(4, 6, 0, 6, 12, 2, navy); m.box(0, 7, 0, 10, 8, 2, navy);
    m.box(4, 11, 12, 6, 14, 14, dark); m.box(0, 0, 10, 1, 2, 18, dark); m.box(9, 0, 10, 10, 2, 18, dark); m.box(4, 6, 24, 6, 8, 26, dark);
    for (const s of [0, 9]) m.box(s, 5, 13, s + 1, 7, 15, gold);
    const grp = new THREE.Group(); grp.name = 'autogyro'; grp.rotation.order = 'YXZ';
    const body = AF.modelMesh(AF.meshModel(m, { vs: 1 / 8, anchor: [0.5, 0, 0.5] })); body.castShadow = true; grp.add(body);
    const rm = new AF.Model(80, 1, 3); rm.box(0, 0, 0, 80, 1, 3, dark); rm.box(39, 0, 0, 41, 1, 3, gold);
    const rotor = AF.modelMesh(AF.meshModel(rm, { vs: 1 / 8, anchor: [0.5, 0, 0.5] })); rotor.position.y = 1.78; grp.add(rotor);
    grp.visible = false; AF.scene.add(grp); HELI.grp = grp; HELI.rotor = rotor;
  };
  const heliHit = (n) => {
    if (!HELI.on || HELI.fall) return;
    HELI.hp -= n; FX.burst('smoke', HELI.x, HELI.y + 1, HELI.z, 1);
    if (HELI.hp <= 0) { HELI.fall = true; HELI.vy = 0; FX.boom(HELI.x, HELI.y, HELI.z, 0.6); CB.crime(G.heat.copKill); }
  };
  const heliStep = (dt) => {
    const want = CB.stars >= 3 && !HELI.fall;
    if (!HELI.on) { if (!want) return; const P = target(), a = Math.random() * PI * 2; Object.assign(HELI, { on: true, x: P.x + Math.sin(a) * 160, z: P.z + Math.cos(a) * 160, y: P.y + 60, hp: 250, fall: false, vx: 0, vz: 0, cd: 3 }); HELI.grp.visible = true; }
    const P = target(), gy = AF.W.groundY(HELI.x, HELI.z);
    if (HELI.fall) {
      HELI.vy -= 9.8 * dt; HELI.y += HELI.vy * dt; HELI.yaw += dt * 4; FX.burst('smoke', HELI.x, HELI.y + 1, HELI.z, 1);
      if (HELI.y <= gy + 0.5) { FX.boom(HELI.x, gy, HELI.z, 1.2); HELI.on = false; HELI.grp.visible = false; HELI.fall = false; }
    } else {
      HELI.a += dt * 0.32;
      const leave = !want, tx = leave ? HELI.x + HELI.vx * 4 : P.x + Math.sin(HELI.a) * 24, tz = leave ? HELI.z + HELI.vz * 4 : P.z + Math.cos(HELI.a) * 24, ty = (leave ? HELI.y + 30 : Math.max(P.y, gy) + 26);
      const dx = tx - HELI.x, dz = tz - HELI.z, d = Math.hypot(dx, dz) || 1, sp = Math.min(20, d * 0.8);
      HELI.vx += (dx / d * sp - HELI.vx) * Math.min(1, dt * 1.5); HELI.vz += (dz / d * sp - HELI.vz) * Math.min(1, dt * 1.5);
      HELI.x += HELI.vx * dt; HELI.z += HELI.vz * dt; HELI.y += (ty - HELI.y) * Math.min(1, dt * 0.8);
      HELI.yaw += AF.angDiff(HELI.yaw, Math.atan2(P.x - HELI.x, P.z - HELI.z)) * Math.min(1, dt * 1.5);
      if (leave && (HELI.x - P.x) ** 2 + (HELI.z - P.z) ** 2 > 250 ** 2) { HELI.on = false; HELI.grp.visible = false; return; }
      if (!leave && AF.time.night > 0.3) FX.glow.spawn(P.x, Math.max(P.y, gy) + 0.3, P.z, 0, 0, 0, 0.05, 6, 0, 0, 0.5, 0.48, 0.38);
      if (!leave && CB.stars >= 4 && (HELI.cd -= dt) <= 0 && !P.away) {
        HELI.cd = 1.6; const d3 = Math.hypot(P.x - HELI.x, P.y - HELI.y, P.z - HELI.z), hit = Math.random() < 0.3;
        FX.burst('flash', HELI.x, HELI.y + 0.4, HELI.z, 1, { size: 0.6 }); FX.line(HELI.x, HELI.y + 0.4, HELI.z, P.x + (hit ? 0 : 2), P.y + 1, P.z + (hit ? 0 : 2)); SFX.play('shot', HELI.x, HELI.z);
        if (hit && d3 < 80) { if (P.car) dmgCar(P.car, 6); else H.hurt(8, 'shot'); }
      }
    }
    HELI.grp.position.set(HELI.x, HELI.y, HELI.z); HELI.grp.rotation.set(0.12, HELI.yaw, -AF.clamp(HELI.vx * Math.cos(HELI.yaw) - HELI.vz * Math.sin(HELI.yaw), -8, 8) * 0.02);
    HELI.rotor.rotation.y += dt * 22;
  };
  const wanted = (dt) => {
    const C = CR(); if (!C) return;
    if (!CB.stars && !SQUADS.length && !CB.copsUp) { SFX.siren(0); return; }   // nobody on duty: skip the crowd scan
    const T = target();
    let seen = false, copsUp = 0, sirenK = 0;
    for (const w of C.walkers) if (w.cop && w.act) { copsUp++; if (!seen && CB.stars && (w.x - T.x) ** 2 + (w.z - T.z) ** 2 < 55 * 55 && los(w.x, w.y + 1.6, w.z, T.x, T.y + 1.2, T.z)) seen = true; }
    CB.copsUp = copsUp;
    for (let i = SQUADS.length - 1; i >= 0; i--) {
      const c = SQUADS[i]; if (!c.squad || c.dead || c.player || c.active === false) { SQUADS.splice(i, 1); continue; }
      const d = Math.hypot(c.x - T.x, c.z - T.z); if (d < 40) seen = true; sirenK = Math.max(sirenK, 1 / (1 + d / 40));
    }
    if (HELI.on && !HELI.fall && CB.stars >= 3 && !(AF.buildingAt && AF.buildingAt(T.x, T.y + 1, T.z))) seen = true;
    SFX.siren(CB.stars ? sirenK : 0);
    if (!CB.stars) return;
    if (seen) CB.seenT = 0; else CB.seenT += dt;
    if (CB.seenT > G.evadeS[CB.stars]) { clearWanted('You gave the police the slip.'); return; }
    if (T.away) return;
    if (copsUp < G.cops[CB.stars] && (copCd -= dt) <= 0) { copCd = 2.5; spawnCop(); }
    if (SQUADS.length < G.squad[CB.stars] && (squadCd -= dt) <= 0) { squadCd = 6; spawnSquad(); }
  };

  // ---------------------------------------------------------------- the player's animation overlay (after the walk mode animates)
  const overlay = (dt, g) => {
    const P = AF.player.parts; if (!P) return;
    CB.recoil = Math.max(0, CB.recoil - dt * 8); CB.flinch = Math.max(0, CB.flinch - dt);
    if (CB.flinch > 0) { P.chest.rotation.x -= CB.flinch * 0.8; P.head.rotation.x -= CB.flinch * 0.6; }
    if (AF.PL.aim && (g || CB.gallery)) {
      const two = CB.gallery || GUNS[g].two, a = -PI / 2 + AF.PL.walk.camPitch * 0.9 - CB.recoil * 0.22;
      P.armR.rotation.set(a, 0, 0.05); P.chest.rotation.y = two ? 0.28 : 0.12;
      if (two) P.armL.rotation.set(a + 0.15, 0, 0.55); else P.armL.rotation.set(-0.2, 0, -0.08);
    } else if (CB.swing > 0) {
      const k = 1 - CB.swing / CB.swingDur, e = 1 - (1 - k) * (1 - k);
      if (melee()[4]) { P.armR.rotation.set(AF.lerp(-2.8, -0.3, e), 0, 0.25 - e * 0.25); P.chest.rotation.y = AF.lerp(-0.4, 0.45, e); }
      else { const arm = CB.side ? P.armR : P.armL, other = CB.side ? P.armL : P.armR; arm.rotation.set(-1.55 * Math.sin(k * PI), 0, 0); other.rotation.set(-1.0, 0, 0); P.chest.rotation.y = (CB.side ? 0.3 : -0.3) * Math.sin(k * PI); }
    } else if (g) P.armR.rotation.x = Math.min(P.armR.rotation.x, -0.25);
  };

  // ---------------------------------------------------------------- ticks
  let prevFire = false, slowT = 0;
  AF.onTick('combat', 151, (dt) => {
    if (!AF.ready || !CR()) return;
    CB.cd -= dt; hitCd -= dt;
    const walk = AF.mode === 'walk' && !H.dead, m = I.mouse, locked = !!document.pointerLockElement;
    const busy = !walk || AF.PL.busy || UI.modalOpen() || (UI.dialogueOpen && UI.dialogueOpen());
    if (CB.reloadT > 0 && (CB.reloadT -= dt) <= 0) { const g = CB.reloadG, W = GUNS[g], take = Math.min(W.mag - (CB.mag[g] || 0), S.ammo[g] || 0); CB.mag[g] = (CB.mag[g] || 0) + take; S.ammo[g] -= take; AF.saveSoon(); SFX.play('click'); }
    let g = cur();
    if (!busy) {
      if (CB.heldId !== (CB.gallery ? 'rifle' : g || melee()[4]) || (CB.held && CB.held.parent !== AF.player.parts.armR)) attachHeld();
      if (!CB.gallery) {
        if (m.wheel && locked) select(CB.slot + Math.sign(m.wheel));
        for (let k = 1; k <= 5; k++) if (I.hit('Digit' + k)) select(k - 1);
        if (I.hit('KeyX')) select(CB.slot + 1);
        if (I.hit('KeyR')) reload();
        g = cur();
      }
      if (I.hit('KeyZ')) CB.aimToggle = !CB.aimToggle;
      const gunUp = !!(g || CB.gallery);
      AF.PL.aim = gunUp && (CB.aimToggle || (locked && !!(m.buttons & 2)) || !!CB.gallery);
      AF.PL.aimFov = CB.gallery ? 34 : g && GUNS[g].zoom ? GUNS[g].zoom : 40;
      const down = (locked && !!(m.buttons & 1)) || I.key('KeyQ'), edge = down && !prevFire; prevFire = down;
      if (down && CB.cd <= 0 && CB.reloadT <= 0 && !AF.hud.meterOn()) {
        if (CB.gallery) { if (edge) fire('revolver'); }
        else if (g) { if (GUNS[g].auto || edge) fire(g); }
        else if (edge) swing();
      }
    } else { AF.PL.aim = false; prevFire = false; }
    if (CB.swing > 0) { CB.swing -= dt; if (CB.hitAt > 0 && CB.swingDur - CB.swing >= CB.hitAt) { CB.hitAt = -1; resolveMelee(); } }
    AF.hud.cross(walk && !!AF.PL.aim);
    if (walk) { overlay(dt, g); bodyPush(dt); }
    // 15 Hz: run-overs, wanted level, police
    if ((slowT += dt) >= 1 / 15) { const t = slowT; slowT = 0; runOver(); wanted(t); }
    for (const car of SQUADS) if (car.squad && !car.dead && !car.player) driveSquad(car, dt);
    if (HELI.grp && (HELI.on || CB.stars >= 3)) heliStep(dt);
    carFx(dt);
  });
  AF.on('hurt', () => { CB.flinch = 0.25; });
  AF.on('mode', (m) => { if (m !== 'walk') { AF.PL.aim = false; CB.swing = 0; } });
  AF.onBuild('combat', 875, () => { heliBuild(); });


  AF.test('combat: a punch engages a ped, fleeing peds calm down, a bullet can down one', () => {
    const C = CR(); if (!C) return { ok: false, info: 'no crowd' };
    const w = C.walkers.find((q) => q.act && !q.agg && !q.cop && !exempt(q) && !q.lead); if (!w) return { ok: false, info: 'no walker' };
    const heat = CB.heat, stars = CB.stars;
    hitPed(w, 5, 'melee', 1, 0); const engaged = !!w.agg && w.agg.hp === G.pedHp - 5;
    hitPed(w, 99, 'gun', 1, 0); const isDown = w.agg && w.agg.st === 'down' && w.agg.lie;
    w.agg.t = 31; const calm = CB.stepPed(w, 0.016) === false; CB.release(w);
    const crime = CB.heat > heat; CB.heat = heat; CB.stars = stars;
    return { ok: engaged && isDown && calm && !w.agg && crime, info: `engaged ${engaged}, down ${isDown}, calm ${calm}, crime ${crime}` };
  });
  AF.test('combat: car damage smokes, burns, explodes into a wreck', () => {
    const car = VV.cars.find((c) => c.parked && !c.static && !c.player && !c.owner); if (!car) return { ok: false, info: 'no car' };
    const save = { hp: car.hp, dmg: car.dmg, temp: car.temp };
    dmgCar(car, 60); const smoky = HURT.has(car) && car.dmg > 0.4;
    dmgCar(car, 60); const burning = car.burnT > 0;
    for (let i = 0; i < 100 && !car.dead; i++) carFx(0.1);
    const wreck = car.dead && car.dmg === 1 && !car.interact.can();
    HURT.delete(car); Object.assign(car, { dead: false, burnT: 0, roll: 0, pitch: 0 }, save); VV.placeMesh(car); CB.heat = 0; CB.stars = 0;
    return { ok: smoky && burning && wreck, info: `smoke ${smoky}, burning ${burning}, wreck ${wreck}` };
  });
  AF.test('combat: wanted level rises with crimes and the pool spawns officers', () => {
    const C = CR(); CB.crime(G.stars[1] + 1); const two = CB.stars === 2;
    const spawned = spawnCop(TMP.set(AF.player.x + 3, AF.player.y, AF.player.z));
    const cop = C.walkers.find((q) => q.cop && q.act), armed = !!cop && cop.agg.kind === 'gun';
    if (cop) CB.release(cop);
    clearWanted(); return { ok: two && spawned && armed && CB.stars === 0, info: `stars2 ${two}, spawned ${spawned}, armed ${armed}` };
  });
  AF.test('combat: airport passengers (path walkers) stagger, go down to a bullet and scatter at gunfire', () => {
    const WK = AF.walkers, path = WK.paths.find((p) => /^airport-/.test(p.name) && p.actors.filter((a) => !a.look.pose).length > 1);
    if (!path) return { ok: false, info: 'no airport path' };
    const cam = AF.camera.position.clone(), heat = CB.heat, stars = CB.stars;
    try {
      AF.camera.position.set(path.minX, 2, path.minZ); WK.update(0.1, 1);
      const [a, b] = path.actors.filter((q) => !q.look.pose);
      hitWalker(a, 5, 'melee', 1, 0); const shoved = !!a.rxOn && a.rx.st > 0 && !WK.isDown(a);
      hitWalker(a, GUNS.revolver.dmg, 'gun', 1, 0); WK.update(0.2, 1.2); const down = WK.isDown(a);
      scareWalkers(b.x, b.z, 2); const scared = b.rxOn && b.rx.fear > 0, crime = CB.heat > heat;
      return { ok: shoved && down && scared && crime, info: `shoved ${shoved}, down ${down}, scared ${scared}, crime ${crime}` };
    } finally {
      for (const q of path.actors) if (q.rx) { Object.assign(q.rx, { down: 0, fall: 0, st: 0, fear: 0, ox: 0, oz: 0, vx: 0, vz: 0 }); q.rxOn = false; q.tilt = q.lift = 0; }
      CB.heat = heat; CB.stars = stars; AF.camera.position.copy(cam); WK.update(0, AF.clock.t);
    }
  });
}
} catch (e) { AF.partError('77-combat.js', e); }
