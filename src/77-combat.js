// ================================================================ 77-combat.js
try {
// ===== 77-combat: weapons, gunplay, fighting, the crowd's fight-or-flight, run-overs, police + the wanted level, vehicle damage  (OWNER: game) =====
// Weapons: slot 0 = bare fists, then the friend's signature melee (keyboard, handbag, dumbbell, microphone, bat, pan, cutlass, guitar),
//   then firearms from a gun counter (AF.save.guns / .ammo) and mission weapons lent by AF.combat.lend(id, ammo) (spistol, ssmg, lmg;
//   never saved). Click or Q attack, right mouse (hold) or Z aim (tighter FOV, steadier), R reload. Switching: mouse wheel, 1-5, X taps
//   to the next one, holding X opens the weapon wheel; the weapon HUD (top right) has a ▸ that takes the next weapon (tap / click) and
//   opens the wheel when held. Touch: HIT / FIRE / AIM / CROUCH (72-touch); weapons from the HUD chip.
// Gunplay: per-weapon spread that blooms with each shot and with moving / sprinting / jumping and tightens crouched or aiming
//   (the crosshair shows it), camera recoil that recovers, pooled tracers (one additive ribbon draw, also NPC shots: CB.tracer),
//   muzzle flashes + impact sparks / dust from AF.fx, hit markers (hit / kill / headshot). Hits above the neck deal G.headK.
//   Every local shot emits AF.emit('gunshot', { x, y, z, loud, silenced, weapon }) (one reused object; loud = hearing radius m).
//   Silenced shots only report a crime when a bystander or officer sees the shooter.
// Peds: a crowd walker only becomes 'engaged' (w.agg, stepped by CB.stepPed from 55-people's crowd tick) when the player hits it,
//   shoots near it, runs it over or barges into it at a sprint. Kinds flee | brawl | melee | gun (+ the cop pool + the mob pool).
//   Gunners pick cover behind solid blocks, peek, strafe, flank and fire bursts with tracers; hits make them flinch; they fall the way
//   the hit pushed them (55 putFall). Engaged peds calm down past G.pedForgetD. Kids and wheelchair users only ever flee.
// Wanted: crimes add heat -> 1..5 stars (G.stars): foot cops (the cop pool), squad cars (physics-driven 'police' cars that unload
//   two officers) and from 3 stars an autogyro. Out of every officer's sight for G.evadeS[stars] s clears it; so does dying.
// Vehicles: car.hp -> car.dmg (0..1, the paint shader's soot), smoke below G.vehSmoke, burning at 0, then an explosion and a wreck.
{
  const PI = Math.PI, G = AF.G, S = AF.save, I = AF.input, VV = AF.vehicles, H = AF.health, FX = AF.fx, SFX = AF.sfx, UI = AF.ui;
  const CR = () => AF.peopleKit && AF.peopleKit.crowd;
  const AU = (id, o) => AF.audio && AF.audio.play(id, o);
  let screamT = 0;
  const scream = (w, female) => { if (AF.clock.t < screamT) return; screamT = AF.clock.t + 1.2 + Math.random() * 1.5; AU(female ? 'scream_f' : 'scream_m', { x: w.x, y: w.y + 1.5, z: w.z }); };
  const lookOf = (w) => CR().V[w.v];
  const exempt = (w) => { const V = lookOf(w); return V.kid || V.chair; };
  const V3 = () => new THREE.Vector3(), MZ = V3(), DIR = V3(), TMP = V3(), PU = V3(), PV = V3();

  // ---------------------------------------------------------------- weapons
  // melee per friend: [name, damage, reach m, seconds between swings, model]
  const MELEE = {
    dhruv: ['Mech Keyboard', 15, 1.9, 0.55, 'keyboard'], hunar: ['Designer Handbag', 12, 1.8, 0.45, 'bag'], tanishk: ['Dumbbell', 19, 1.6, 0.7, 'dumbbell'],
    diksha: ['Microphone', 11, 1.7, 0.4, 'mic'], kush: ['Boss Bat', 17, 2.1, 0.6, 'bat'], divyangana: ['Frying Pan', 16, 1.9, 0.55, 'pan'],
    kaybee: ['Pirate Cutlass', 19, 2.2, 0.5, 'cutlass'], niranjan: ['Old Guitar', 17, 2.2, 0.7, 'guitar'],
  };
  const FISTS = ['Fists', 8, 1.4, 0.38, null];
  // cls: pose + feel family. spread (rad, hip) grows by bloom per shot up to bloomMax; kick = camera pitch per shot (recovers at rec /s);
  // loud = hearing radius (m) for 'gunshot'; zoom = aiming FOV; tr = tracer [width m, length m, r, g, b]; flash = muzzle flash size
  const GUNS = {
    revolver: { name: '.38 Revolver', cls: 'pistol', dmg: 24, rate: 0.42, mag: 6, reload: 1.6, range: 70, spread: 0.014, bloom: 0.014, bloomMax: 0.05, kick: 0.045, rec: 7, pellets: 1, loud: 60, zoom: 42, flash: 0.7, tr: [0.02, 5, 2.2, 1.8, 1.1], price: 350, pack: 12, packPrice: 15, snd: 'shot', model: [6, 0] },
    shotgun: { name: 'Pump Shotgun', cls: 'shotgun', dmg: 13, rate: 0.95, mag: 6, reload: 2.4, range: 28, spread: 0.075, bloom: 0.02, bloomMax: 0.04, kick: 0.08, rec: 5, pellets: 7, loud: 80, zoom: 44, flash: 1.0, tr: [0.013, 2.5, 2, 1.6, 1], price: 900, pack: 8, packPrice: 28, snd: 'shotgun', two: true, model: [13, 6] },
    tommy: { name: 'Tommy Gun', cls: 'smg', dmg: 12, rate: 0.085, mag: 50, reload: 2.6, range: 55, spread: 0.03, bloom: 0.006, bloomMax: 0.06, kick: 0.016, rec: 9, pellets: 1, auto: true, loud: 70, zoom: 40, flash: 0.75, tr: [0.018, 5, 2.3, 1.7, 1], price: 2600, pack: 50, packPrice: 70, snd: 'smg', two: true, model: [10, 5] },
    rifle: { name: 'Hunting Rifle', cls: 'rifle', dmg: 75, rate: 1.2, mag: 5, reload: 2.2, range: 140, spread: 0.003, bloom: 0.03, bloomMax: 0.03, kick: 0.09, rec: 4, pellets: 1, loud: 110, zoom: 22, flash: 0.9, tr: [0.024, 7, 2.4, 2, 1.3], price: 1700, pack: 10, packPrice: 35, snd: 'rifle', two: true, model: [16, 7] },
    // mission weapons (AF.combat.lend): not sold, not saved
    spistol: { name: 'Silenced Pistol', cls: 'pistol', dmg: 28, rate: 0.28, mag: 12, reload: 1.5, range: 65, spread: 0.008, bloom: 0.009, bloomMax: 0.04, kick: 0.026, rec: 9, pellets: 1, silenced: true, loud: 7, zoom: 40, flash: 0.2, tr: [0.011, 3, 0.8, 0.78, 0.7], pack: 24, snd: 'sil', lend: true },
    ssmg: { name: 'Silenced SMG', cls: 'smg', dmg: 13, rate: 0.075, mag: 30, reload: 2.0, range: 55, spread: 0.024, bloom: 0.005, bloomMax: 0.05, kick: 0.013, rec: 10, pellets: 1, auto: true, silenced: true, loud: 8, zoom: 40, flash: 0.2, tr: [0.011, 3, 0.8, 0.78, 0.7], pack: 60, snd: 'sil', two: true, lend: true },
    lmg: { name: 'Light Machine Gun', cls: 'lmg', dmg: 21, rate: 0.068, mag: 100, reload: 4.4, range: 95, spread: 0.028, bloom: 0.0045, bloomMax: 0.07, kick: 0.018, rec: 6, pellets: 1, auto: true, loud: 95, zoom: 44, flash: 1.1, tr: [0.04, 8, 3.2, 1.5, 0.45], pack: 100, snd: 'lmg', two: true, heavy: true, lend: true },
  };
  const GUN_IDS = Object.keys(GUNS);
  // AF.GUNS = what a gun counter sells (78-jobs lists it); the full weapon table is AF.combat.GUNS
  AF.GUNS = {}; for (const id of GUN_IDS) if (!GUNS[id].lend) AF.GUNS[id] = GUNS[id];
  // held models: built along -y from the hand (blade / barrel forward when the arm is raised), guns' grips along -z (down).
  // geo.userData.tip = the muzzle in the held mesh's frame
  const MODELS = new Map();
  const heldGeo = (id) => {
    if (MODELS.has(id)) return MODELS.get(id);
    const c = (hex, o) => AF.col(hex, Object.assign({ jitter: 0.12, edge: 0.3 }, o)), dark = c(0x24262a, { metal: 0.6, rough: 0.4 }), steel = c(0xc4c8ce, { metal: 0.9, rough: 0.25 }), wood = c(0x7a4a26), gold = c(0xd8b04a, { metal: 0.9, rough: 0.3 });
    const black = c(0x141518, { metal: 0.5, rough: 0.5 }), olive = c(0x4b5338, { rough: 0.7 });
    let m, anchor = [0.5, 1, 0.5], tipZ = -1;
    const g = GUNS[id];
    if (id === 'spistol') {   // slide + a long suppressor
      const Sp = 5, L = 5, hgt = Sp + L + 2; m = new AF.Model(2, hgt, 6);
      m.box(0, 0, 3, 2, Sp, 6, black); m.box(0, Sp, 3, 2, hgt, 5, dark); m.box(0, Sp, 4, 2, hgt, 5, steel); m.box(0, Sp + L - 2, 0, 2, Sp + L + 1, 3, dark); m.set(0, Sp + L - 3, 2, dark);
      anchor = [0.5, (Sp + L) / hgt, 2.5 / 6]; tipZ = 4.5;
    } else if (id === 'ssmg') {
      const Sp = 5, L = 8, St = 4, hgt = Sp + L + 3 + St; m = new AF.Model(2, hgt, 7);
      m.box(0, 0, 3, 2, Sp, 6, black); m.box(0, Sp, 3, 2, Sp + L + 3, 6, dark); m.box(0, Sp + L, 0, 2, Sp + L + 2, 3, dark); m.box(0, Sp + 2, 0, 2, Sp + 4, 3, steel);
      m.box(0, Sp + L + 3, 4, 2, hgt, 5, dark); m.box(0, hgt - 1, 2, 2, hgt, 6, dark);
      anchor = [0.5, (Sp + L + 1) / hgt, 3 / 7]; tipZ = 4.5;
    } else if (id === 'lmg') {  // barrel + shroud, boxy receiver with a carry handle, box magazine, folded bipod, stock
      const B = 7, R = 8, K = 5, hgt = B + R + K; m = new AF.Model(3, hgt, 9);
      m.box(1, 0, 5, 2, B, 6, black); m.box(0, 0, 4, 3, 1, 7, black); m.box(0, B - 4, 4, 3, B, 7, dark); m.box(1, 1, 3, 2, B - 1, 4, steel);
      m.box(0, B, 3, 3, B + R, 8, dark); m.box(1, B + 2, 8, 2, B + 6, 9, steel); m.box(0, B + 1, 0, 3, B + 5, 3, olive); m.box(1, B + R - 2, 0, 2, B + R, 3, dark);
      m.box(0, B + R, 3, 3, hgt, 7, olive);
      anchor = [0.5, (B + R - 1) / hgt, 3 / 9]; tipZ = 5.5;
    } else if (g) {   // [barrel length, stock] in 1/16 m voxels
      const [L, stock] = g.model, hgt = L + 3 + stock; m = new AF.Model(2, hgt, 5);
      m.box(0, 0, 3, 2, L + 3, 5, dark); m.box(0, L, 2, 2, L + 3, 5, dark); m.box(0, L + 1, 0, 2, L + 3, 2, wood);
      if (stock) m.box(0, L + 3, 1, 2, hgt, 4, wood);
      if (id === 'tommy') { m.box(0, 3, 0, 2, 6, 2, wood); m.box(0, L - 2, 0, 2, L, 3, dark); }
      if (id === 'revolver') m.box(0, L - 1, 2, 2, L + 1, 5, steel);
      anchor = [0.5, (L + 2) / hgt, 2 / 5]; tipZ = 4;
    } else if (id === 'keyboard') { m = new AF.Model(5, 16, 2); m.box(0, 0, 0, 5, 13, 2, dark); for (let y = 1; y < 12; y += 2) for (let x = 1; x < 4; x++) m.set(x, y, 1, (x + y) % 5 ? c(0xe8e4dc) : c(0x3aa0ff)); m.box(2, 13, 0, 3, 16, 1, dark); }
    else if (id === 'bag') { m = new AF.Model(7, 10, 3); m.box(0, 0, 0, 7, 6, 3, c(0xff5fae)); m.box(3, 2, 2, 4, 4, 3, gold); m.box(1, 6, 1, 2, 9, 2, gold); m.box(5, 6, 1, 6, 9, 2, gold); m.box(1, 9, 1, 6, 10, 2, gold); }
    else if (id === 'dumbbell') { m = new AF.Model(6, 12, 6); m.box(0, 0, 0, 6, 3, 6, dark); m.box(0, 9, 0, 6, 12, 6, dark); m.box(2, 3, 2, 4, 9, 4, steel); }
    else if (id === 'mic') { m = new AF.Model(3, 10, 3); m.box(0, 0, 0, 3, 3, 3, steel); m.box(1, 3, 1, 2, 10, 2, dark); }
    else if (id === 'bat') { m = new AF.Model(3, 20, 3); m.box(0, 0, 0, 3, 13, 3, c(0xc8945a)); m.box(1, 13, 1, 2, 20, 2, c(0xc8945a)); m.box(1, 17, 1, 2, 19, 2, dark); }
    else if (id === 'pan') { m = new AF.Model(9, 15, 2); for (let x = 0; x < 9; x++) for (let y = 0; y < 9; y++) if (Math.hypot(x - 4, y - 4) < 4.6) m.box(x, y, 0, x + 1, y + 1, 2, dark); m.box(4, 9, 0, 5, 15, 1, wood); }
    else if (id === 'cutlass') { m = new AF.Model(5, 19, 2); for (let y = 0; y < 13; y++) m.box(2 - (y < 4 ? 1 : 0), y, 0, 3, y + 1, 1, steel); m.box(0, 13, 0, 5, 14, 2, gold); m.box(2, 14, 0, 3, 19, 1, wood); m.box(0, 14, 0, 1, 18, 1, gold); }
    else if (id === 'guitar') { m = new AF.Model(9, 24, 3); for (let x = 0; x < 9; x++) for (let y = 0; y < 11; y++) if (Math.hypot((x - 4) * 1.1, y - (y < 5 ? 3 : 7)) < 4.4) m.box(x, y, 0, x + 1, y + 1, 3, c(0x9a4a22)); m.box(3, 4, 2, 6, 7, 3, dark); m.box(4, 11, 1, 5, 24, 2, c(0x4a2a14)); }
    if (!m) return null;
    const geo = AF.meshModel(m, { vs: 1 / 16, anchor });
    if (tipZ >= 0) geo.userData.tip = [0, -m.h * anchor[1] / 16, (tipZ - m.d * anchor[2]) / 16];
    MODELS.set(id, geo); return geo;
  };

  // ---------------------------------------------------------------- state
  const CB = AF.combat = { slot: 0, aimToggle: false, cd: 0, swing: 0, swingDur: 0.3, side: 0, hitAt: -1, reloadT: 0, mag: S.mag || (S.mag = {}), heat: 0, stars: 0, seenT: 0, engaged: 0, recoil: 0, flinch: 0, held: null, heldId: null, gallery: null,
    bloom: 0, kick: 0, raise: 0, lastShot: -9 };
  const OWNED = [null], MELEE_ID = '@melee', LEND = {};
  const sig = () => { const f = AF.friends && AF.friends.current; return f && MELEE[f.id]; };
  // slot 0 = bare fists (every spawn starts there), then the friend's signature melee, then the guns bought or lent
  const owned = () => { OWNED.length = 1; if (sig()) OWNED.push(MELEE_ID); for (const id of GUN_IDS) if (S.guns[id] || LEND[id]) OWNED.push(id); return OWNED; };
  const slotId = () => { const o = owned(); if (CB.slot >= o.length) CB.slot = 0; return o[CB.slot]; };
  const cur = () => { const id = slotId(); return id && id !== MELEE_ID ? id : null; };
  const melee = () => (slotId() === MELEE_ID && sig()) || FISTS;
  // ammo: a lent weapon has its own mag + reserve (never saved); bought ones use AF.save
  const magOf = (id) => LEND[id] ? LEND[id].mag : CB.mag[id] || 0;
  const resOf = (id) => LEND[id] ? LEND[id].ammo : S.ammo[id] || 0;
  const setMag = (id, n) => { if (LEND[id]) LEND[id].mag = n; else { CB.mag[id] = n; AF.saveSoon(); } };
  const setRes = (id, n) => { if (LEND[id]) LEND[id].ammo = n; else { S.ammo[id] = n; AF.saveSoon(); } };
  CB.gun = cur; CB.GUNS = GUNS; CB.melee = melee; CB.heldGeo = heldGeo; CB.pvp = false; CB.owned = owned; CB.magOf = magOf; CB.resOf = resOf;
  CB.give = (id) => { S.guns[id] = true; S.ammo[id] = (S.ammo[id] || 0) + GUNS[id].pack; CB.mag[id] = CB.mag[id] || 0; AF.saveSoon(); };
  const select = (slot) => { const o = owned(); CB.slot = ((slot % o.length) + o.length) % o.length; CB.reloadT = 0; attachHeld(); SFX.play('click'); hudPop = 0.35; };
  CB.select = select;
  CB.selectId = (id) => { const i = owned().indexOf(id); if (i >= 0) select(i); return i >= 0; };
  // mission lending: (re)gives weapon id with `ammo` rounds (one mag loaded, the rest in reserve) and draws it
  CB.lend = (id, ammo) => {
    const W = GUNS[id]; if (!W) return false;
    const n = ammo == null ? W.mag * 4 : Math.max(0, ammo | 0), m = Math.min(W.mag, n);
    LEND[id] = { mag: m, ammo: n - m }; CB.selectId(id); return true;
  };
  CB.unlend = (id) => {
    const was = slotId();
    if (id) delete LEND[id]; else for (const k in LEND) delete LEND[k];
    if (CB.reloadT > 0 && !CB.has(CB.reloadG)) CB.reloadT = 0;
    const i = owned().indexOf(was); CB.slot = i >= 0 ? i : 0; attachHeld();
  };
  CB.has = (id) => !!(GUNS[id] ? S.guns[id] || LEND[id] : id === 'fists' || (id === 'melee' && sig()));
  CB.lent = () => Object.keys(LEND);
  // ---------------------------------------------------------------- weapon HUD (top right), weapon wheel, crosshair, hit markers
  const WI = {
    fists: '<path d="M7 11V7a2 2 0 0 1 4 0v3M11 10V6a2 2 0 0 1 4 0v4M15 10V8a2 2 0 0 1 4 0v5a7 7 0 0 1-7 7h-1a6 6 0 0 1-6-6v-2a2 2 0 0 1 2-2z"/>',
    melee: '<path d="M5 19 17 7M14.5 4.5l5 5M4 20l2-2M8 13l3 3"/>',
    revolver: '<path d="M3 9h13l2-2h2v5h-4l-1 1h-3l-1 4H7l1-4H3zM12 12v1"/>',
    shotgun: '<path d="M1 10h17l2-1h3v3h-7l-2 2h-3l-1 3H6l1-3-6-1z"/>',
    tommy: '<path d="M2 9h15v3h-3l-1 5h-2l1-5H8v3H6v-3H2zM17 10h5M10 12v3"/>',
    rifle: '<path d="M1 11h16l4-1h2v2h-3l-6 1-2 3H8l1-3H1zM12 10V8h2"/>',
    spistol: '<path d="M1 8.5h8v3H1zM9 8h11v3.5h-6l-1.2 5H9.6l1.2-5H9zM3 8.5v3M6 8.5v3"/>',
    ssmg: '<path d="M1 9h5v3H1zM6 8.5h11l1.5-1H23v4h-6l-.8 4h-2.4l.8-4H12v4h-2v-4H6zM3.5 9v3"/>',
    lmg: '<path d="M1 10h7M8 8.5h11l1 1.5h3v2.5h-5.5l-1 3h-2l1-3h-3v3.5H9.5V12H8zM11 8.5V7h4v1.5M4 10l-1.5 5M6 10l1.5 5"/>',
  };
  const wIcon = (k) => '<svg viewBox="0 0 24 24" aria-hidden="true">' + (WI[k] || WI.melee) + '</svg>';
  const wcss = document.createElement('style');
  wcss.textContent = `
  #ui #h-wheel{position:absolute;left:50%;top:50%;width:var(--wd);height:var(--wd);margin:calc(var(--wd) / -2) 0 0 calc(var(--wd) / -2);--wd:min(300px,74vh);--wr:calc(var(--wd) * .36);border-radius:50%;display:none;pointer-events:none;
    background:radial-gradient(circle,rgba(10,13,17,.78) 0 60%,rgba(10,13,17,.35) 61% 70%,rgba(10,13,17,0) 71%);animation:wIn .12s ease}
  #ui #h-wheel.open{display:block}
  #ui #h-wheel .it{position:absolute;left:50%;top:50%;width:70px;margin:-26px 0 0 -35px;display:flex;flex-direction:column;align-items:center;gap:2px;color:var(--dim);transition:color .1s,transform .1s;transform:translate(var(--x),var(--y))}
  #ui #h-wheel .it svg{width:28px;height:28px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
  #ui #h-wheel .it small{font-size:10px;font-variant-numeric:tabular-nums;opacity:.8;white-space:nowrap}
  #ui #h-wheel .it.on{color:var(--accent);transform:translate(var(--x),var(--y)) scale(1.18)}
  #ui #h-wheel .ctr{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);text-align:center;width:46%}
  #ui #h-wheel .ctr b{display:block;font-size:13px;font-weight:600;color:var(--ink)} #ui #h-wheel .ctr span{font-size:11px;color:var(--dim);font-variant-numeric:tabular-nums}
  #ui #h-wpn{display:none;flex-direction:column;align-items:flex-end;gap:0;margin-top:3px;color:var(--ink);text-shadow:0 1px 2px rgba(0,0,0,.95),0 0 10px rgba(0,0,0,.5);touch-action:none;transition:transform .15s}
  #ui #h-wpn.on{display:flex} #ui #h-wpn.pop{transform:scale(1.08)}
  #ui #h-wpn .r1{display:flex;align-items:center;gap:6px;max-width:230px}
  #ui #h-wpn svg{width:26px;height:26px;flex:none;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;filter:drop-shadow(0 1px 2px rgba(0,0,0,.7))}
  #ui #h-wpn i{font-style:normal;font-size:12px;letter-spacing:.3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;opacity:.9}
  #ui #h-wpn .nx{width:22px;height:22px;border-radius:50%;display:grid;place-items:center;font-size:13px;line-height:1;color:var(--ink);background:rgba(6,8,12,.45);box-shadow:0 0 0 1px rgba(255,255,255,.14);text-shadow:none;cursor:pointer}
  #ui #h-wpn .nx:hover,#ui #h-wpn .nx:active{background:var(--accent);color:#112723}
  #ui #h-wpn .r2{font-variant-numeric:tabular-nums;line-height:1.1;min-height:4px} #ui #h-wpn .r2 b{font-weight:700;font-size:17px} #ui #h-wpn .r2 span{font-size:12px;opacity:.75;margin-left:3px}
  #ui #h-wpn .r2 b.out{color:#ff8a7a} #ui #h-wpn .r2 b.ld{color:var(--gold)}
  #ui.touch #h-wpn .nx{width:30px;height:30px;font-size:16px}
  #ui #h-xh{position:absolute;left:50%;top:50%;width:0;height:0;display:none;pointer-events:none;--g:8px}
  #ui #h-xh.on{display:block}
  #ui #h-xh i{position:absolute;background:rgba(255,255,255,.92);box-shadow:0 0 2px rgba(0,0,0,.85)}
  #ui #h-xh .t,#ui #h-xh .b{left:-1px;width:2px;height:7px} #ui #h-xh .t{top:calc(-1 * var(--g) - 7px)} #ui #h-xh .b{top:var(--g)}
  #ui #h-xh .l,#ui #h-xh .r{top:-1px;width:7px;height:2px} #ui #h-xh .l{left:calc(-1 * var(--g) - 7px)} #ui #h-xh .r{left:var(--g)}
  #ui #h-xh .d{left:-1.5px;top:-1.5px;width:3px;height:3px;border-radius:50%}
  #ui #h-hm{position:absolute;left:50%;top:50%;width:0;height:0;opacity:0;pointer-events:none;transition:opacity .16s}
  #ui #h-hm.on{opacity:1;transition:none}
  #ui #h-hm i{position:absolute;left:-1px;top:-5px;width:2px;height:9px;background:#fff;box-shadow:0 0 2px rgba(0,0,0,.8)}
  #ui #h-hm i:nth-child(1){transform:rotate(45deg) translateY(-11px)} #ui #h-hm i:nth-child(2){transform:rotate(135deg) translateY(-11px)}
  #ui #h-hm i:nth-child(3){transform:rotate(225deg) translateY(-11px)} #ui #h-hm i:nth-child(4){transform:rotate(315deg) translateY(-11px)}
  #ui #h-hm.kill i{background:#ff5a4a;height:11px} #ui #h-hm.head i{background:#ffcf4a;height:12px;width:3px}
  #ui.photo #h-wheel,#ui.mapping #h-wheel,#ui.titling #h-wheel,#ui.photo #h-xh,#ui.mapping #h-xh,#ui.cine #h-xh,#ui.photo #h-hm{display:none!important}
  @keyframes wIn{from{opacity:0;transform:scale(.94)}to{opacity:1;transform:none}}`;
  document.head.appendChild(wcss);
  const uiRoot = document.getElementById('ui'), hRight = document.getElementById('h-right');
  const wheelEl = document.createElement('div'); wheelEl.id = 'h-wheel'; wheelEl.innerHTML = '<div class="ctr"><b></b><span></span></div>'; uiRoot.appendChild(wheelEl);
  // the weapon HUD: icon, name, a ▸ (next weapon; hold the chip for the wheel), magazine / reserve
  const chip = document.createElement('div'); chip.id = 'h-wpn'; chip.className = 'hud pe';
  chip.innerHTML = '<div class="r1"><span class="ic"></span><i></i><button class="nx" aria-label="Next weapon">\u25b8</button></div><div class="r2"></div>';
  if (hRight) hRight.appendChild(chip); else uiRoot.appendChild(chip);
  const chipIc = chip.querySelector('.ic'), chipName = chip.querySelector('i'), chipAmmo = chip.querySelector('.r2'), chipNext = chip.querySelector('.nx');
  const xh = document.createElement('div'); xh.id = 'h-xh'; xh.innerHTML = '<i class="t"></i><i class="b"></i><i class="l"></i><i class="r"></i><i class="d"></i>'; uiRoot.appendChild(xh);
  const hm = document.createElement('div'); hm.id = 'h-hm'; hm.innerHTML = '<i></i><i></i><i></i><i></i>'; uiRoot.appendChild(hm);
  const slotInfo = (id) => GUNS[id] ? { k: id, name: GUNS[id].name, mag: CB.reloadT > 0 && CB.reloadG === id ? -1 : magOf(id), res: resOf(id), out: !(magOf(id) > 0) && !(resOf(id) > 0) }
    : id === MELEE_ID && sig() ? { k: 'melee', name: sig()[0], mag: null, res: 0, out: false } : { k: 'fists', name: FISTS[0], mag: null, res: 0, out: false };
  const ammoTxt = (f) => f.mag == null ? '' : (f.mag < 0 ? '\u21bb' : f.mag) + ' / ' + f.res;
  let hudId = null, hudMag = NaN, hudRes = NaN, hudN = -1, hudSig = null, hudPop = 0, firedT = 9, hmT = 0;
  const WH = CB.wheel = { open: false, pick: 0, vx: 0, vy: 0, key: '', items: [] };
  const wheelBuild = () => {
    const o = owned(), n = o.length, key = o.join() + '|' + (sig() || FISTS)[0];
    if (key === WH.key) return;
    WH.key = key; for (const e of WH.items) e.remove(); WH.items.length = 0;
    o.forEach((id, i) => {
      const a = -PI / 2 + i * PI * 2 / n, e = document.createElement('div'); e.className = 'it';
      e.style.setProperty('--x', `calc(var(--wr) * ${Math.cos(a).toFixed(4)})`); e.style.setProperty('--y', `calc(var(--wr) * ${Math.sin(a).toFixed(4)})`);
      wheelEl.appendChild(e); WH.items.push(e);
    });
  };
  const wheelPaint = () => {
    const o = owned(), ctr = wheelEl.firstChild;
    o.forEach((id, i) => { const f = slotInfo(id), e = WH.items[i]; if (!e) return; const html = wIcon(f.k) + '<small>' + (ammoTxt(f) || '\u00a0') + '</small>'; if (e._h !== html) { e.innerHTML = html; e._h = html; } e.classList.toggle('on', i === WH.pick); });
    const f = slotInfo(o[WH.pick]); ctr.firstChild.textContent = f.name; ctr.lastChild.textContent = ammoTxt(f);
  };
  CB.wheelOpen = () => {
    if (WH.open || CB.gallery || AF.mode !== 'walk' || owned().length < 2) return false;
    wheelBuild(); WH.open = true; WH.pick = CB.slot; WH.vx = WH.vy = 0; AF.PL.wheel = true; wheelEl.classList.add('open'); wheelPaint(); return true;
  };
  // a pointer (mouse look deltas, or a finger's slide) steers the pick: the direction of the last few dozen pixels, not the total
  CB.wheelAim = (dx, dy) => {
    if (!WH.open || !(dx || dy)) return;
    WH.vx += dx; WH.vy += dy; const d = Math.hypot(WH.vx, WH.vy); if (d > 70) { WH.vx *= 70 / d; WH.vy *= 70 / d; }
    if (d < 16) return;
    const n = owned().length, a = Math.atan2(WH.vy, WH.vx) + PI / 2, pick = ((Math.round(a / (PI * 2) * n) % n) + n) % n;
    if (pick !== WH.pick) { WH.pick = pick; wheelPaint(); }
  };
  CB.wheelClose = (take) => {
    if (!WH.open) return;
    WH.open = false; AF.PL.wheel = false; wheelEl.classList.remove('open');
    if (take && WH.pick !== CB.slot) select(WH.pick); else if (take) hudPop = 0.35;
  };
  // the chip: tap / click ▸ = next weapon; press and hold anywhere on it = the wheel (slide toward one, lift to take it)
  {
    let pid = null, holdT = 0, px = 0, py = 0;
    const clear = () => { if (holdT) { clearTimeout(holdT); holdT = 0; } };
    chip.addEventListener('pointerdown', (e) => {
      e.preventDefault(); e.stopPropagation(); if (pid != null || AF.mode !== 'walk') return;
      pid = e.pointerId; px = e.clientX; py = e.clientY; try { chip.setPointerCapture(pid); } catch (err) { /* old browsers */ }
      holdT = setTimeout(() => { holdT = 0; CB.wheelOpen(); }, 300);
    });
    chip.addEventListener('pointermove', (e) => { if (e.pointerId !== pid) return; if (WH.open) CB.wheelAim((e.clientX - px) * 1.6, (e.clientY - py) * 1.6); px = e.clientX; py = e.clientY; });
    const end = (e) => {
      if (e.pointerId !== pid) return; e.preventDefault(); pid = null;
      const tap = !!holdT; clear();
      if (WH.open) CB.wheelClose(e.type === 'pointerup');
      else if (tap && e.type === 'pointerup' && !CB.gallery) CB.next();
    };
    chip.addEventListener('pointerup', end); chip.addEventListener('pointercancel', end);
  }
  CB.next = () => { if (AF.mode === 'walk' && !CB.gallery && owned().length > 1) select(CB.slot + 1); };
  const hudPaint = (dt) => {
    firedT += dt; hudPop = Math.max(0, hudPop - dt);
    const on = AF.mode === 'walk' && !H.dead && (owned().length > 1 || !!CB.gallery || !!cur());
    chip.classList.toggle('on', on); chip.classList.toggle('pop', hudPop > 0);
    if (!on) return;
    // repaint only on a change (nothing is built per frame)
    const gal = CB.gallery, id = gal ? '@gal' : slotId(), n = owned().length, gun = !gal && !!GUNS[id], sg = sig();
    const mag = gal ? gal.shots : gun ? (CB.reloadT > 0 && CB.reloadG === id ? -1 : magOf(id)) : -2, res = gun ? resOf(id) : 0;
    if (id === hudId && mag === hudMag && res === hudRes && n === hudN && sg === hudSig) return;
    hudId = id; hudMag = mag; hudRes = res; hudN = n; hudSig = sg;
    const f = gal ? { k: 'rifle', name: 'Gallery rifle', mag: gal.shots, res: 0, out: false } : slotInfo(id);
    chipIc.innerHTML = wIcon(f.k); chipName.textContent = f.name;
    chipNext.style.display = !CB.gallery && owned().length > 1 ? '' : 'none';
    chipAmmo.innerHTML = f.mag == null ? '' : CB.gallery ? `<b>${f.mag}</b>` : `<b class="${f.out ? 'out' : f.mag < 0 ? 'ld' : ''}">${f.mag < 0 ? '\u21bb' : f.mag}</b><span>/ ${f.res}</span>`;
  };
  // crosshair: four ticks whose gap is the current spread (projected), a dot; hit marker: an X (white hit, red kill, gold headshot)
  let xhGap = -1, xhOn = false;
  const crossPaint = (on, spread) => {
    if (on !== xhOn) { xhOn = on; xh.classList.toggle('on', on); }
    if (!on) return;
    const fov = AF.camera.fov * PI / 360, g = Math.round(Math.tan(spread) / Math.tan(fov) * innerHeight * 0.5 * 2 + 3) / 2;
    if (g !== xhGap) { xhGap = g; xh.style.setProperty('--g', g + 'px'); }
  };
  const hitMark = (kind) => {
    hm.className = 'on' + (kind === 2 ? ' head' : kind === 1 ? ' kill' : ''); hmT = kind ? 0.32 : 0.16;
    AU(kind === 2 ? 'hit_head' : 'hit_tick', { rate: kind === 1 ? 0.8 : 1 });
  };
  AF.hud.cross(false);
  AF.hud.cross = (on) => crossPaint(!!on, 0.01);
  AF.hud.hitMark = (kind) => hitMark(kind | 0);
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
  AF.on('respawn', () => { CB.slot = 0; CB.aimToggle = false; CB.bloom = 0; CB.kick = 0; attachHeld(); });
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
  // the fight state of an engaged ped (one object per engagement; the AI fields are reset here so pooled cops / goons start clean)
  const aggOf = (kind, hp, y, w, o) => ({ kind, hp, max: hp, st: 'go', t: 0, cd: 0.5 + Math.random(), f: 'p', lie: false, dy: 0, lead: null, vx: 0, vz: 0, swing: 0, hitDone: false, aimT: 0,
    side: w.id & 1 ? 1 : -1, gy: y, gyT: 0, reported: false, wpn: 'pistol', tac: 'strafe', thinkT: 0.3 + Math.random() * 0.8, losT: 0, see: false, burst: 0, bt: 0, cx: 0, cz: 0, px: 0, pz: 0,
    peekT: 0, tacT: 0, flanked: false, role: w.id % 4 === 1 ? 'flank' : 'hold', flinch: 0, fdir: -1, tilt: 0, hurtT: 0, fallA: null, fallTo: -PI / 2, fallT: 1, twist: 0, twist0: 0, ...(o || {}) });
  const engage = (w, cause, force) => {
    if (w.net) return null;
    if (w.agg) return w.agg;
    if (!w.act || (CB.engaged >= G.engagedMax && !force)) return null;
    const V = lookOf(w);
    let kind = 'flee';
    if (!V.kid && !V.chair && V.L.plan !== 'elder' && cause === 'hit') { const r = AF.hash2(w.id, (AF.clock.t / 60) | 0); kind = r < 0.48 ? 'flee' : r < 0.7 ? 'brawl' : r < 0.85 ? 'melee' : 'gun'; }
    if (kind !== 'flee' && !V.im.work) kind = 'flee';
    CB.engaged++;
    w.agg = aggOf(kind, G.pedHp, w.y, w, { lead: w.lead || null });
    w.lead = null; w.talk = 0;
    if (cause === 'hit') say(w, kind === 'flee' ? FLEE_LINES[w.id % 4] : FIGHT_LINES[w.id % 4]);
    if (kind === 'flee' && (cause === 'hit' || cause === 'panic' || cause === 'car') && Math.random() < 0.5) scream(w, !!V.L.female);
    return w.agg;
  };
  CB.release = (w) => {
    const A = w.agg; if (!A) return;
    if (w.cop || w.goon) w.act = false; else CB.engaged = Math.max(0, CB.engaged - 1);
    w.lead = A.lead && A.lead.act && !A.lead.agg ? A.lead : null; w.agg = null; w.moving = false;
  };
  // knocked down / killed: the body falls the way the hit pushed it (back when hit from the front, face down from behind), over 0.45 s
  const down = (w, ko, fx, fz, v) => {
    const A = w.agg; if (!A) return;
    A.st = 'down'; A.t = ko === 'stagger' ? 5 : 0; A.ko = !!ko; A.lie = true; A.f = 'p'; A.vx = fx * v; A.vz = fz * v; A.burst = 0; A.tilt = 0;
    const fwd = Math.sin(w.yaw) * fx + Math.cos(w.yaw) * fz, prone = fwd > 0.25;
    A.fallTo = prone ? PI / 2 : -PI / 2; A.fallT = 0; A.fallA = 0;
    A.twist0 = AF.clamp(AF.angDiff(w.yaw, prone ? Math.atan2(fx, fz) : Math.atan2(-fx, -fz)), -1.1, 1.1) + (Math.random() - 0.5) * 0.4; A.twist = 0;
    w.moving = false;
    FX.burst('dust', w.x, w.y + 0.2, w.z, 4);
  };
  // anyone who'd report a crime sees the shooter at (x, y, z)? (only asked for silenced shots)
  const witnessed = (x, y, z, skip) => {
    const C = CR(); if (!C) return false;
    const r2 = G.witnessR * G.witnessR, c2 = G.copWitnessR * G.copWitnessR;
    for (const w of C.walkers) {
      if (!w.act || w === skip || w.goon || w.net || flat(w)) continue;
      const d2 = (w.x - x) ** 2 + (w.z - z) ** 2; if (d2 > (w.cop ? c2 : r2)) continue;
      if (los(w.x, w.y + 1.6, w.z, x, y + 1.3, z)) return true;
    }
    return false;
  };
  CB.witnessed = witnessed;
  // damage from the player (melee, bullets, cars, explosions): kind 'melee' knocks out, 'gun' / 'car' / 'boom' can kill.
  // head = a headshot (already multiplied into dmg). Returns 0 nothing, 1 hurt, 2 down
  const hitPed = (w, dmg, kind, fx, fz, innocent, head) => {
    // another player's ped (80-coop proxy): its owner applies the hit
    if (w.net) { FX.burst('hit', w.x, w.y + 1.3, w.z, 1); if (CB.onNetPed) CB.onNetPed(w, dmg, kind, fx, fz, innocent); return 1; }
    if (exempt(w)) { engage(w, 'panic', true); return 0; }
    const A = engage(w, 'hit', true); if (!A || A.st === 'down') return 0;
    A.hp -= dmg; A.cd = Math.max(A.cd, 0.35); w.x += fx * 0.15; w.z += fz * 0.15;
    if (A.kind === 'flee' && kind === 'melee' && Math.random() < 0.3 && lookOf(w).im.work) A.kind = 'brawl';
    FX.burst('hit', w.x, w.y + (head ? 1.62 : 1.3) * (w.s || 1), w.z, head ? 2 : 1);
    if (Math.random() < 0.6) AU(lookOf(w).L.female ? 'grunt_f' : 'grunt_m', { x: w.x, y: w.y + 1.5, z: w.z });
    const fell = A.hp <= 0;
    if (fell) down(w, kind === 'melee' && A.hp > -15 && !head ? 'ko' : null, fx, fz, kind === 'car' || kind === 'boom' ? 6 : head ? 1 : 1.5);
    else {   // flinch toward the push, a burst interrupted, think again (cover)
      A.flinch = 0.35; A.fdir = Math.sin(w.yaw) * fx + Math.cos(w.yaw) * fz > 0 ? 1 : -1; A.burst = 0; A.hurtT = 3; A.thinkT = Math.min(A.thinkT, 0.15);
      if (dmg >= 20) { w.x += fx * 0.25; w.z += fz * 0.25; }
    }
    if (!innocent && !w.goon && (!A.reported || fell)) { A.reported = true; CB.crime(w.cop ? (fell ? G.heat.copKill : G.heat.copHit) : fell ? (A.ko ? G.heat.ko : G.heat.kill) : G.heat.assault); }
    return fell ? 2 : 1;
  };
  // a hit sent by the player who shot one of this client's peds: no crime here, and the ped turns on that player
  CB.netHitPed = (w, dmg, kind, fx, fz, from) => { if (!w || !w.act || w.net) return; hitPed(w, dmg, kind, fx, fz, true); if (w.agg) w.agg.tgt = from; };
  CB.hitPed = hitPed;
  const flat = (w) => w.lie || (w.agg && w.agg.lie);
  const panic = (x, z, r) => {
    const C = CR();
    if (C) for (const w of C.walkers) if (w.act && !w.agg && !w.cop && !w.goon && !w.net && (w.x - x) ** 2 + (w.z - z) ** 2 < r * r) { const A = engage(w, 'panic'); if (!A) break; }
    scareWalkers(x, z, r);
  };
  CB.panic = panic;
  // path walkers (54: airport, outland paths, the island, heist guards) never fight back: shoved, knocked flat (then they get up), sent
  // running. Same crimes as the crowd. A mission's CB.onWalkerHit(a, kind 'melee' | 'shot' | 'car' | 'boom', fx, fz, info) returning
  // true swallows the hit; info = { head, dmg, silenced, weapon }. hitWalker never calls WK.near (callers may iterate its shared array).
  const scareWalkers = (x, z, r) => { const WK = AF.walkers; if (WK && WK.near) for (const a of WK.near(x, z, r)) WK.scare(a, 6 + Math.random() * 4); };
  const hitWalker = (a, dmg, kind, fx, fz, innocent, info) => {
    const WK = AF.walkers; if (WK.isDown(a)) return 0;
    if (CB.onWalkerHit && CB.onWalkerHit(a, kind === 'gun' ? 'shot' : kind, fx, fz, info || { head: false, dmg, silenced: false, weapon: kind === 'melee' ? 'melee' : null })) return 2;
    FX.burst('hit', a.x, a.y + (info && info.head ? 1.62 : 1.3), a.z, 1);
    a.hp = (a.hp ?? G.pedHp) - dmg;
    const fell = kind !== 'melee' || a.hp <= 0;
    if (fell) { WK.knock(a, fx, fz, kind === 'car' || kind === 'boom' ? 6 : 1.5, kind === 'melee' ? 7 : 25); a.hp = G.pedHp; FX.burst('dust', a.x, a.y + 0.2, a.z, 4); }
    else { WK.stagger(a, fx, fz); say(a, FLEE_LINES[(a.ph * 7 | 0) % 4]); }
    if (!innocent) CB.crime(fell ? (kind === 'melee' ? G.heat.ko : G.heat.kill) : G.heat.assault);
    return fell ? 2 : 1;
  };
  CB.hitWalker = hitWalker;

  // ---------------------------------------------------------------- the player's target picture (on foot / in a car / out of reach)
  const TG = { x: 0, y: 0, z: 0, car: null, away: true, speed: 0, peer: null };
  // A.tgt: a remote player who provoked this ped (CB.peerTarget gives their picture), else the local player
  const target = (A) => {
    const r = A && A.tgt != null && CB.peerTarget ? CB.peerTarget(A.tgt) : null;
    if (r) return r;
    const p = AF.player, car = AF.mode === 'drive' && VV.player;
    TG.car = car || null; TG.away = !(AF.mode === 'walk' || car || AF.mode === 'passenger');
    TG.x = car ? car.x : p.x; TG.y = car ? car.y : p.y; TG.z = car ? car.z : p.z; TG.speed = car ? Math.abs(car.v) : (AF.PL.walk.speed || 0);
    return TG;
  };
  const los = (x0, y0, z0, x1, y1, z1) => { for (let i = 1; i < 6; i++) { const u = i / 6; if (AF.solidAt(x0 + (x1 - x0) * u, y0 + (y1 - y0) * u, z0 + (z1 - z0) * u)) return false; } return true; };
  CB.los = los;
  const NPC_SND = { pistol: 'shot', smg: 'smg', lmg: 'lmg' };
  // one NPC round at the target: hit chance from range, the target's speed and stance; a hot tracer either way
  const pedShoot = (w, d, T) => {
    const A = w.agg, N = G.npcGun[A.wpn] || G.npcGun.pistol;
    const hx = Math.sin(w.yaw), hz = Math.cos(w.yaw), mx = w.x + hx * 0.55 - hz * 0.12, my = w.y + 1.35, mz = w.z + hz * 0.55 + hx * 0.12;
    const crouch = T === TG && !T.car && AF.player.crouch;
    const p = AF.clamp(N[1] + (w.cop ? 0.12 : 0) - d * 0.01 - T.speed * 0.03 - (crouch ? 0.08 : 0) - (A.flinch > 0 ? 0.2 : 0), 0.05, 0.75), hit = Math.random() < p;
    const th = crouch ? 0.8 : 1.2, ex = T.x + (hit ? 0 : (Math.random() - 0.5) * 3), ey = T.y + (hit ? th : 0.3 + Math.random() * 1.4), ez = T.z + (hit ? 0 : (Math.random() - 0.5) * 3);
    // misses fly on past the target to whatever they hit
    let fx2 = ex, fy2 = ey, fz2 = ez;
    if (!hit) { const dx = ex - mx, dy = ey - my, dz = ez - mz, L = Math.hypot(dx, dy, dz) || 1, R = Math.min(60, L + 25); fx2 = mx + dx / L * R; fy2 = my + dy / L * R; fz2 = mz + dz / L * R; for (let t = L; t < R; t += 0.5) { const qx = mx + dx / L * t, qy = my + dy / L * t, qz = mz + dz / L * t; if (AF.solidAt(qx, qy, qz)) { fx2 = qx; fy2 = qy; fz2 = qz; break; } } }
    FX.burst('flash', mx, my, mz, 1, { size: A.wpn === 'lmg' ? 0.35 : 0.25 }); tracer(mx, my, mz, fx2, fy2, fz2, A.wpn === 'lmg' ? 2 : 1); SFX.play(NPC_SND[A.wpn] || 'shot', w.x, w.z);
    if (CB.onShot) CB.onShot(A.wpn === 'lmg' ? 7 : A.wpn === 'smg' ? 3 : 1, mx, my, mz, fx2, fy2, fz2, hit ? 2 : 1);
    if (!hit) { impact(fx2, fy2, fz2, 0, 1); if (T === TG && !T.car && Math.hypot(ex - T.x, ez - T.z) < 2 && Math.random() < 0.35) AU(Math.random() < 0.5 ? 'ricochet' : 'bullet_hit', { x: ex, y: ey, z: ez }); return; }
    if (T.peer != null) { if (CB.hurtPeer) CB.hurtPeer(T.peer, N[0] * (w.cop ? 1.25 : 1), 'shot', 0, 0); FX.burst('hit', ex, ey, ez, 1); return; }
    if (T.car) { dmgCar(T.car, 5); if (Math.random() < 0.3) H.hurt(4, 'shot'); }
    else { H.hurt(N[0] * (w.cop ? 1.25 : 1), 'shot'); FX.burst('hit', ex, ey, ez, 1); }
  };
  // cover: a free, standable spot 3-8 m away with a solid block between it and the target at chest and head height
  const blocked = (x, y, z, T) => {
    const dx = T.x - x, dz = T.z - z, d = Math.hypot(dx, dz) || 1, ux = dx / d, uz = dz / d;
    for (let s = 0.5; s <= 1.4; s += 0.3) if (AF.solidAt(x + ux * s, y + 1.15, z + uz * s) && AF.solidAt(x + ux * s, y + 1.5, z + uz * s)) return true;
    return false;
  };
  const findCover = (w, A, T) => {
    let best = Infinity; const a0 = Math.random() * PI * 2;
    for (let i = 0; i < 10; i++) {
      const a = a0 + i * PI * 2 / 10, r = 3 + ((i * 7) % 5), x = w.x + Math.sin(a) * r, z = w.z + Math.cos(a) * r;
      const y = AF.surfaceBelow(x, z, w.y + 1.2, 3); if (!(Math.abs(y - w.y) < 1.1) || AF.boxBlocked(x, y + 0.05, z, 0.25, 1.6)) continue;
      const dT = Math.hypot(T.x - x, T.z - z); if (dT < 6 || !blocked(x, y, z, T)) continue;
      const score = r + Math.abs(dT - 14) * 0.3;
      if (score < best) { best = score; A.cx = x; A.cz = z; }
    }
    return best < Infinity;
  };
  // the next tactic for a gunner (every 1.2-2.8 s, or at once when hit): advance, flank (one in four), cover + peek, or strafe
  const think = (w, A, T, d, range, want) => {
    A.thinkT = 1.2 + Math.random() * 1.6; A.tacT = 0;
    if (d > range + 5) { A.tac = 'adv'; return; }
    if (A.role === 'flank' && !A.flanked && d > 6) {
      const a = Math.atan2(w.x - T.x, w.z - T.z) + A.side * 1.3, r = Math.min(d, 11);
      A.px = T.x + Math.sin(a) * r; A.pz = T.z + Math.cos(a) * r; A.tac = 'flank'; A.flanked = true; return;
    }
    if ((A.tac === 'cover' || A.tac === 'peek') && blocked(A.cx, w.y, A.cz, T) && Math.random() < 0.75) return;
    if ((A.hurtT > 0 || Math.random() < 0.6) && findCover(w, A, T)) { A.tac = 'cover'; A.peekT = 0.8 + Math.random() * 1.5; return; }
    A.tac = d > want + 8 ? 'adv' : 'strafe';
  };
  const gunner = (w) => w.agg.kind === 'gun';
  const MV = { hx: 0, hz: 0, sp: 0, f: 'p' };
  const goTo = (w, x, z, run) => { const ex = x - w.x, ez = z - w.z, e = Math.hypot(ex, ez); if (e < 0.35) { MV.sp = 0; return true; } MV.hx = ex / e; MV.hz = ez / e; MV.sp = run ? 3.4 : 1.6; MV.f = run ? 'run' : 'walk'; return false; };
  const WALKF = ['a', 'p', 'b', 'p'];
  // stepped by 55-people's crowd tick for every walker with an .agg; false = calm down, back to the pool
  CB.stepPed = (w, dt) => {
    const A = w.agg; A.t += dt; A.cd -= dt;
    const T = target(A), dx = T.x - w.x, dz = T.z - w.z, d = Math.hypot(dx, dz) || 1e-3;
    if (A.st === 'down') {
      if (A.fallT < 1) { A.fallT = Math.min(1, A.fallT + dt / 0.45); const e = A.fallT * A.fallT; A.fallA = A.fallTo * e; A.twist = A.twist0 * e; }
      if (A.vx || A.vz) { w.x += A.vx * dt; w.z += A.vz * dt; const k = Math.exp(-dt * 4); A.vx *= k; A.vz *= k; if (Math.abs(A.vx) + Math.abs(A.vz) < 0.05) A.vx = A.vz = 0; w.y = AF.surfaceBelow(w.x, w.z, w.y + 0.6, 2); }
      if (A.ko && A.t > 7) { A.st = 'go'; A.lie = false; A.fallA = null; A.twist = 0; A.kind = 'flee'; A.hp = 8; A.t = 0; }
      return A.t < 30 && d < G.pedForgetD + 20;
    }
    if (T.away && A.t > 3) return false;
    if (!w.cop && !w.goon && d > G.pedForgetD) return false;
    if (A.kind === 'flee' && A.t > 8 && d > 40) return false;
    if (w.cop && !CB.stars && (d > 30 || A.t > 25)) return false;
    A.hurtT -= dt;
    if (A.flinch > 0) { A.flinch -= dt; A.tilt = A.fdir * 0.3 * Math.sin(Math.max(0, A.flinch) / 0.35 * PI); } else A.tilt = 0;
    let sp = 0, hx = dx / d, hz = dz / d, face = Math.atan2(hx, hz), f = 'p', faceT = false;
    // the wanted level is gone: officers stand down at once (no shots, no swings) and stroll off until they are released
    if (w.cop && !CB.stars) { sp = 1.3; hx = -hx; hz = -hz; f = 'walk'; A.aimT = 0; A.swing = 0; A.burst = 0; }
    else if (A.kind === 'flee') { sp = 3.3 + (w.id % 3) * 0.3; hx = -hx; hz = -hz; f = 'run'; }
    else if (gunner(w)) {
      const N = G.npcGun[A.wpn] || G.npcGun.pistol, range = A.wpn === 'lmg' ? 60 : 45, want = w.cop ? 12 : A.wpn === 'lmg' ? 14 : 9;
      if ((A.losT -= dt) <= 0) { A.losT = 0.2 + Math.random() * 0.1; A.see = !T.away && d < range && los(w.x, w.y + 1.5, w.z, T.x, T.y + 1.2, T.z); }
      if ((A.thinkT -= dt) <= 0) think(w, A, T, d, range, want);
      A.tacT += dt;
      MV.sp = 0;
      if (A.tac === 'adv') { if (d > want + 2) { sp = 3.3; f = 'run'; } else A.tac = 'strafe'; }
      else if (A.tac === 'flank') { if (goTo(w, A.px, A.pz, true) || A.tacT > 6) A.tac = 'strafe'; }
      else if (A.tac === 'cover') {
        if (goTo(w, A.cx, A.cz, true)) {
          faceT = true;
          // in cover with no line of fire: lean out to the side, shoot, come back
          if (!A.see && A.burst <= 0 && (A.peekT -= dt) <= 0) { const s = A.side; A.px = A.cx - hz * s * 1.1; A.pz = A.cz + hx * s * 1.1; A.tac = 'peek'; A.tacT = 0; }
        }
      } else if (A.tac === 'peek') {
        faceT = true;
        if (!A.see) goTo(w, A.px, A.pz, false);
        if ((A.tacT > 3 || (A.tacT > 0.8 && A.burst <= 0 && A.cd > 0.3)) && A.burst <= 0) { A.tac = 'cover'; A.peekT = 1 + Math.random() * 2; A.side = -A.side; }
      } else {   // strafe: hold the range, sidestep, change direction now and then
        faceT = true;
        if (d > want + 6) { sp = 3.2; f = 'run'; faceT = false; }
        else if (d < want - 4) { sp = 1.8; hx = -hx; hz = -hz; f = 'walk'; }
        else { sp = 1.2; const s = A.side, q = hx; hx = -hz * s; hz = q * s; f = 'walk'; if (A.tacT > 1.5 && Math.random() < dt * 0.6) A.side = -A.side; }
      }
      if (MV.sp) { hx = MV.hx; hz = MV.hz; sp = MV.sp; f = MV.f; }
      // bursts: a short aim, then N rounds; a pause between bursts
      if (A.burst <= 0 && A.see && A.cd <= 0 && A.aimT <= 0 && d < range && A.flinch <= 0) { A.burst = N[2] + Math.floor(Math.random() * (N[3] - N[2] + 1)); A.bt = 0.22 + Math.random() * 0.2; }
      if (A.burst > 0) {
        faceT = true; sp *= 0.3; f = 'work';
        if ((A.bt -= dt) <= 0) {
          if (A.see && !T.away) pedShoot(w, d, T);
          A.burst--; A.bt = N[4] * (0.85 + Math.random() * 0.3);
          if (A.burst <= 0) A.cd = N[5] * (0.7 + Math.random() * 0.6);
        }
      } else if (A.aimT > 0) { A.aimT -= dt; f = 'work'; sp *= 0.25; }
      if (A.flinch > 0) sp *= 0.2;
    } else {   // brawl / melee / an unarmed cop: close in and swing
      if (A.flinch > 0) { sp = 0; }
      else if (d > 1.15 && !(T.car && d < 5)) { sp = d > 4 ? 3.3 : 2.2; f = d > 4 ? 'run' : 'walk'; }
      if (d < 1.6 && A.cd <= 0 && !T.car && A.swing <= 0 && A.flinch <= 0) { A.swing = 0.45; A.cd = 1 + Math.random() * 0.6; A.hitDone = false; }
      if (A.swing > 0) {
        A.swing -= dt; f = A.swing > 0.22 ? 'hail' : 'work'; sp = 0;
        if (A.swing <= 0.22 && !A.hitDone) {
          A.hitDone = true; const dmg = A.kind === 'melee' ? 10 : w.cop ? 8 : 6;
          if (d < 1.8 && T.peer != null) { if (CB.hurtPeer) CB.hurtPeer(T.peer, dmg, 'melee', hx * 3, hz * 3); SFX.play('punch', w.x, w.z); }
          else if (d < 1.8 && AF.mode === 'walk') { H.hurt(dmg, 'melee'); AF.PL.push(hx * 3, hz * 3); SFX.play('punch', w.x, w.z); CB.flinch = 0.3; }
        }
      }
    }
    if (sp > 0) {
      let mx = hx * sp * dt, mz = hz * sp * dt;
      if (AF.boxBlocked(w.x + mx * 4, w.y + 0.35, w.z + mz * 4, 0.22, 1.2)) { const s = A.side, q = mx; mx = -mz * s; mz = q * s; if (AF.boxBlocked(w.x + mx * 4, w.y + 0.35, w.z + mz * 4, 0.22, 1.2)) { A.side = -s; mx = mz = 0; if (A.tac === 'cover' || A.tac === 'flank' || A.tac === 'peek') A.tac = 'strafe'; } }
      w.x += mx; w.z += mz;
      if ((A.gyT -= dt) <= 0) { A.gyT = 0.25; A.gy = AF.surfaceBelow(w.x, w.z, w.y + 0.7, 2.5); }
      w.y += (A.gy - w.y) * Math.min(1, dt * 12); w.ph += dt * sp * 2.3 / w.s;
      if ((mx || mz) && !faceT) { const my = Math.atan2(mx, mz); if (A.kind === 'flee' || f === 'run' || (w.cop && !CB.stars)) face = my; }
    }
    if (f === 'run') f = sp > 0 ? (Math.floor(w.ph) & 1 ? 'runA' : 'runB') : 'p'; else if (f === 'walk') f = sp > 0 ? WALKF[Math.floor(w.ph) & 3] : 'p';
    w.yaw += AF.angDiff(w.yaw, face) * Math.min(1, dt * 10);
    w.moving = sp > 0; A.f = f;
    return true;
  };
  // ---------------------------------------------------------------- the player's attacks
  const HIT = { t: 0, kind: null, obj: null, x: 0, y: 0, z: 0, head: false };
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
  // a person = body capsule up to the neck + a head sphere; RPH = whether the nearest hit was the head
  let RPH = false;
  const rayPerson = (ox, oy, oz, dx, dy, dz, x, y0, z, hgt) => {
    const k = hgt / 1.75, tb = rayCapsule(ox, oy, oz, dx, dy, dz, x, y0, z, hgt * 0.81, 0.3 * k), th = raySphere(ox, oy, oz, dx, dy, dz, x, y0 + hgt * 0.905, z, 0.17 * k);
    RPH = th < tb; return RPH ? th : tb;
  };
  CB.rayPerson = (ox, oy, oz, dx, dy, dz, x, y0, z, hgt) => { const t = rayPerson(ox, oy, oz, dx, dy, dz, x, y0, z, hgt); return t < Infinity ? (RPH ? -t : t) : Infinity; };
  const ray = (ox, oy, oz, dx, dy, dz, range, t0) => {
    HIT.t = range; HIT.kind = null; HIT.obj = null; HIT.head = false;
    for (let t = t0 + 0.3; t < range; t += 0.45) if (AF.solidAt(ox + dx * t, oy + dy * t, oz + dz * t)) {
      let a = t - 0.45, b = t; for (let i = 0; i < 4; i++) { const m = (a + b) / 2; if (AF.solidAt(ox + dx * m, oy + dy * m, oz + dz * m)) b = m; else a = m; }
      HIT.t = a; HIT.kind = 'world'; break;
    }
    const C = CR(), R2 = range * range;
    if (C && !CB.gallery) for (const w of C.walkers) {
      if (!w.act || flat(w) || (w.x - ox) ** 2 + (w.z - oz) ** 2 > R2 || exempt(w)) continue;
      const t = rayPerson(ox, oy, oz, dx, dy, dz, w.x, w.y, w.z, 1.75 * w.s); if (t > t0 && t < HIT.t) { HIT.t = t; HIT.kind = 'ped'; HIT.obj = w; HIT.head = RPH; }
    }
    const WK = AF.walkers;
    if (WK && WK.near && !CB.gallery) for (const a of WK.near(ox, oz, range)) {
      if (WK.isDown(a)) continue;
      const t = rayPerson(ox, oy, oz, dx, dy, dz, a.x, a.y, a.z, 1.75); if (t > t0 && t < HIT.t) { HIT.t = t; HIT.kind = 'walker'; HIT.obj = a; HIT.head = RPH; }
    }
    if (!CB.gallery) for (const c of VV.cars) {
      if (c.active === false || c.player || (c.x - ox) ** 2 + (c.z - oz) ** 2 > R2) continue;
      const t = raySphere(ox, oy, oz, dx, dy, dz, c.x, c.y + 0.8, c.z, Math.min(c.halfL, 2.2)); if (t > t0 && t < HIT.t) { HIT.t = t; HIT.kind = 'car'; HIT.obj = c; HIT.head = false; }
    }
    if (HELI.on && !CB.gallery) { const t = raySphere(ox, oy, oz, dx, dy, dz, HELI.x, HELI.y + 1, HELI.z, 3); if (t < HIT.t) { HIT.t = t; HIT.kind = 'heli'; HIT.head = false; } }
    if (CB.gallery) for (const d of CB.gallery.targets()) { const t = raySphere(ox, oy, oz, dx, dy, dz, d.x, d.y, d.z, 0.24); if (t < HIT.t) { HIT.t = t; HIT.kind = 'duck'; HIT.obj = d; } }
    if (CB.rayPeers && !CB.gallery) { const k = HIT.kind; CB.rayPeers(ox, oy, oz, dx, dy, dz, t0, HIT, rayCapsule, raySphere); if (HIT.kind !== k) HIT.head = false; }
    HIT.x = ox + dx * HIT.t; HIT.y = oy + dy * HIT.t; HIT.z = oz + dz * HIT.t;
    return HIT;
  };
  CB.ray = ray;
  // hip fire picks the nearest ped / walker inside a 25 degree cone (aim assist, the only aiming on a phone without AIM)
  const autoTarget = (ox, oz, fx, fz, range) => {
    const C = CR(); let best = null, bd = range;
    if (C) for (const w of C.walkers) {
      if (!w.act || flat(w) || exempt(w)) continue;
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
    const W = GUNS[g], need = W.mag - magOf(g), have = resOf(g);
    if (need <= 0 || have <= 0) return;
    CB.reloadT = W.reload; CB.reloadG = g; CB.magDropped = false; AU('reload');
  };
  CB.reload = reload;
  // the current cone half-angle (rad): base x stance (aiming, crouched, moving, sprinting, airborne) + bloom from recent shots
  const spreadNow = (W) => {
    const p = AF.player, sp = AF.PL.walk.speed || 0;
    let k = AF.PL.aim ? G.aimSpreadK : 1.3;
    if (p.crouch) k *= G.crouchSpreadK;
    if (p.body && !p.body.onGround) k *= G.airSpreadK; else if (sp > 7) k *= G.sprintSpreadK; else k *= 1 + G.moveSpreadK * Math.min(1, sp / 5.8);
    return W.spread * k + CB.bloom;
  };
  CB.spread = () => { const g = cur(); return g ? spreadNow(GUNS[g]) : 0; };
  // surface hits: sparks + dust + dark chips; bodies: a red-brown puff
  const impact = (x, y, z, kind, n) => {
    if (kind === 0) { FX.burst('spark', x, y, z, 1 + n, { spread: 3.5 }); FX.burst('dust', x, y, z, n, { size: 0.55 }); FX.burst('dust', x, y, z, 1, { col: [0.16, 0.14, 0.12], spread: 4.5, size: 0.35 }); }
    else if (kind === 1) { FX.burst('dust', x, y, z, 2, { col: [0.34, 0.07, 0.06], spread: 1.4, size: 0.45 }); }
    else FX.burst('spark', x, y, z, 3 + n, { spread: 4 });
  };
  let emptyT = 0;
  const GS = { x: 0, y: 0, z: 0, loud: 0, silenced: false, weapon: '', remote: false };
  const emitShot = (x, y, z, loud, silenced, weapon, remote) => { GS.x = x; GS.y = y; GS.z = z; GS.loud = loud; GS.silenced = silenced; GS.weapon = weapon; GS.remote = remote; AF.emit('gunshot', GS); };
  // the muzzle of the held gun in world space (the hand when the model has no tip)
  const muzzle = (out) => {
    const p = AF.player, h = CB.held, tip = h && h.geometry.userData.tip;
    if (h && h.parent) { if (tip) out.set(tip[0], tip[1], tip[2]); else out.set(0, 0, 0); h.localToWorld(out); } else out.set(p.x, p.y + 1.4, p.z);
    return out;
  };
  const fire = (g) => {
    const W = GUNS[g], gal = CB.gallery;
    if (!gal && !(magOf(g) > 0)) { if (resOf(g) > 0) reload(); else { if (!AU('dry')) SFX.play('click'); CB.cd = 0.3; if (AF.clock.t - emptyT > 4) { emptyT = AF.clock.t; AF.emit('toast', LEND[g] ? 'Out of ammo.' : 'Out of ammo \u2014 a gun counter sells more.'); } } return; }
    if (gal) { if (gal.shots <= 0) return; gal.shots--; } else setMag(g, magOf(g) - 1);
    CB.cd = W.rate; CB.recoil = 1; CB.lastShot = AF.clock.t;
    const p = AF.player, cam = AF.camera;
    p.mesh.updateMatrixWorld(true);
    muzzle(MZ);
    let ox, oy, oz, t0 = 0;
    if (AF.PL.aim) {   // through the crosshair: from the camera, starting level with the player
      cam.getWorldDirection(DIR); ox = cam.position.x; oy = cam.position.y; oz = cam.position.z;
      t0 = Math.max(0, (p.x - ox) * DIR.x + (p.y + 1.4 - oy) * DIR.y + (p.z - oz) * DIR.z);
    } else {
      const fx = Math.sin(p.yaw), fz = Math.cos(p.yaw), w = autoTarget(p.x, p.z, fx, fz, W.range);
      ox = MZ.x; oy = MZ.y; oz = MZ.z;
      if (w) { DIR.set(w.x - ox, w.y + 1.25 * (w.s || 1) - oy, w.z - oz).normalize(); p.yaw = Math.atan2(DIR.x, DIR.z); } else DIR.set(fx, 0, fz);
    }
    volley(g, W, ox, oy, oz, t0, gal ? 0.003 : spreadNow(W));
    // feel: bloom, camera kick (recovers in the tick), a muzzle flash, the report
    if (!gal) { CB.bloom = Math.min(W.bloomMax, CB.bloom + W.bloom); const k = W.kick * (AF.PL.aim ? G.adsKickK : 1) * (p.crouch ? 0.8 : 1); CB.kick += k; const WK = AF.PL.walk; WK.camPitch = AF.clamp(WK.camPitch - k, -0.75, 1.25); WK.camYaw += (Math.random() - 0.5) * k * 0.7; }
    if (AF.camfx && AF.camfx.shake) AF.camfx.shake(W.heavy ? 0.012 : W.cls === 'shotgun' || W.cls === 'rifle' ? 0.014 : 0.004, 0.12);
    const camD = AF.camera.position.distanceTo(MZ), fl = (W.flash || 0.6) * 0.3 * Math.min(1, camD / 3);   // smaller right by the lens (over the shoulder)
    FX.burst('flash', MZ.x + DIR.x * 0.08, MZ.y + DIR.y * 0.08, MZ.z + DIR.z * 0.08, 1, { size: fl });
    if (!W.silenced) for (let i = 1; i <= 2; i++) FX.glow.spawn(MZ.x + DIR.x * 0.14 * i, MZ.y + DIR.y * 0.14 * i, MZ.z + DIR.z * 0.14 * i, DIR.x * 4, DIR.y * 4, DIR.z * 4, 0.05, 0.6 * fl / i, 0, 0, 4, 2.6, 1.1);
    if (W.heavy && camD > 2.5 && Math.random() < 0.3) FX.burst('smoke', MZ.x, MZ.y, MZ.z, 1, { size: 0.35, spread: 0.3 });
    SFX.play(gal ? 'shot' : W.snd, p.x, p.z);
    if (gal) return;
    emitShot(MZ.x, MZ.y, MZ.z, W.loud, !!W.silenced, g, false);
    if (!W.silenced) { CB.crime(G.heat.shots * (W.auto ? 0.25 : 1)); panic(p.x, p.z, G.panicR); } else panic(p.x, p.z, G.silencedPanicR);
  };
  // the rounds of one trigger pull from (ox, oy, oz) along DIR (t0 = start of hits along the ray); tracers start at the muzzle MZ
  const volley = (g, W, ox, oy, oz, t0, spread) => {
    const gal = CB.gallery, sil = !!W.silenced, p = AF.player;
    // a basis around DIR for the cone
    PU.set(-DIR.z, 0, DIR.x); if (PU.lengthSq() < 1e-6) PU.set(1, 0, 0); PU.normalize(); PV.crossVectors(PU, DIR);
    let res = -1, head = false, unseen = null;
    for (let k = 0; k < (W.pellets || 1); k++) {
      const r = spread * Math.sqrt(Math.random()), a = Math.random() * PI * 2, cu = Math.cos(a) * r, cv = Math.sin(a) * r;
      TMP.set(DIR.x + PU.x * cu + PV.x * cv, DIR.y + PU.y * cu + PV.y * cv, DIR.z + PU.z * cu + PV.z * cv).normalize();
      const h = ray(ox, oy, oz, TMP.x, TMP.y, TMP.z, W.range, t0);
      if (!gal) tracerShot(MZ.x, MZ.y, MZ.z, h.x, h.y, h.z, W);
      if (!gal && CB.onShot) CB.onShot(GUN_IDS.indexOf(g) + 1, MZ.x, MZ.y, MZ.z, h.x, h.y, h.z, h.kind === 'world' ? 1 : h.kind === 'car' || h.kind === 'heli' || (h.kind === 'peer' && h.obj.heli) ? 3 : h.kind ? 2 : 0);
      const dmg = W.dmg * (h.head ? G.headK : 1);
      if ((h.kind === 'ped' || h.kind === 'walker') && sil && unseen === null) unseen = !witnessed(p.x, p.y, p.z, h.obj);
      if (h.kind === 'ped') { const r2 = hitPed(h.obj, dmg, 'gun', TMP.x, TMP.z, !!unseen, h.head); if (r2) { res = Math.max(res, r2 - 1); head = head || h.head; impact(h.x, h.y, h.z, 1, 1); } }
      else if (h.kind === 'walker') { const r2 = hitWalker(h.obj, dmg, 'gun', TMP.x, TMP.z, !!unseen, { head: h.head, dmg, silenced: sil, weapon: g }); if (r2) { res = Math.max(res, r2 - 1); head = head || h.head; impact(h.x, h.y, h.z, 1, 1); } }
      else if (h.kind === 'car') { dmgCar(h.obj, W.dmg * 0.35, true); impact(h.x, h.y, h.z, 2, 0); res = Math.max(res, 0); }
      else if (h.kind === 'heli') { heliHit(W.dmg); impact(h.x, h.y, h.z, 2, 0); res = Math.max(res, 0); }
      else if (h.kind === 'peer') { if (CB.hitPeer) CB.hitPeer(h.obj, W.dmg, 'gun', TMP.x, TMP.z); if (h.obj.heli) impact(h.x, h.y, h.z, 2, 0); else FX.burst('hit', h.x, h.y, h.z, 1); res = Math.max(res, 0); }
      else if (h.kind === 'duck') { gal.hit(h.obj); res = Math.max(res, 0); }
      else if (h.kind === 'world') { impact(h.x - TMP.x * 0.08, h.y - TMP.y * 0.08, h.z - TMP.z * 0.08, 0, W.heavy ? 3 : 2); if (k === 0) AU(Math.random() < 0.3 ? 'ricochet' : 'bullet_hit', { x: h.x, y: h.y, z: h.z }); }
    }
    if (res >= 0) hitMark(head ? 2 : res);
    return res;
  };
  CB.volley = (g, ox, oy, oz, dx, dy, dz) => { DIR.set(dx, dy, dz).normalize(); MZ.set(ox, oy, oz); return volley(g, GUNS[g], ox, oy, oz, 0, 0); };
  // melee: a wind-up, the strike (the hit lands ~55 % in), a follow-through
  const swing = () => {
    const W = melee(); CB.cd = W[3]; CB.swing = CB.swingDur = W[4] ? 0.46 : 0.3; CB.side ^= 1; CB.hitAt = CB.swingDur * (W[4] ? 0.55 : 0.45);
    SFX.play('swing');
  };
  const resolveMelee = () => {
    const W = melee(), p = AF.player, fx = Math.sin(p.yaw), fz = Math.cos(p.yaw), C = CR();
    let best = null, bd = W[2];
    if (C) for (const w of C.walkers) {
      if (!w.act || flat(w)) continue;
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
    if (walker) { const r = hitWalker(walker, W[1], 'melee', fx, fz, false, { head: false, dmg: W[1], silenced: true, weapon: W[4] || 'fists' }); SFX.play('punch', p.x, p.z); hitMark(r === 2 ? 1 : 0); scareWalkers(p.x, p.z, 12); return; }
    if (CB.meleePeer && CB.meleePeer(p.x, p.y, p.z, fx, fz, best ? bd : W[2], W[1])) { SFX.play('punch', p.x, p.z); hitMark(0); return; }
    if (best) { const r = hitPed(best, W[1], 'melee', fx, fz); SFX.play('punch', p.x, p.z); hitMark(r === 2 ? 1 : 0); if (AF.camfx && AF.camfx.shake) AF.camfx.shake(0.01, 0.1); return; }
    for (const c of VV.cars) if (c.active !== false && !c.player && Math.abs(c.x - p.x) < 4 && Math.abs(c.z - p.z) < 4 && VV.bodyDist(c, p.x + fx * 0.8, p.z + fz * 0.8) < 0.3) { dmgCar(c, 2, true); SFX.play('crash', c.x, c.z); return; }
  };
  // ---------------------------------------------------------------- vehicle damage + wrecks
  const HURT = new Set();
  const dmgCar = (car, n, byPlayer) => {
    if (!car || car.dead || car.static || !(n > 0)) return;
    if (car.net != null) { if (CB.onNetCar) CB.onNetCar(car, n, byPlayer); return; }
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
  // blast damage around (x, y, z): remote = another player's explosion (no crimes here; it only hurts this player and their car with
  // friendly fire on)
  const blast = (x, y, z, R, byPlayer, remote) => {
    const C = CR(), innocent = !byPlayer || remote, meToo = !remote || CB.pvp;
    if (C) for (const w of C.walkers) { if (!w.act || flat(w) || w.net) continue; const dx = w.x - x, dz = w.z - z, d = Math.hypot(dx, dz); if (d < R) hitPed(w, G.boomDmg * (1 - d / R), 'boom', dx / (d || 1), dz / (d || 1), innocent); }
    const WK = AF.walkers;
    if (WK && WK.near) for (const a of WK.near(x, z, R)) { const dx = a.x - x, dz = a.z - z, d = Math.hypot(dx, dz) || 1; hitWalker(a, G.boomDmg, 'boom', dx / d, dz / d, innocent); }
    if (AF.mode === 'walk' && meToo) { const p = AF.player, dx = p.x - x, dz = p.z - z, d = Math.hypot(dx, dz); if (d < R) { H.hurt(G.boomDmg * (1 - d / R), 'boom'); AF.PL.push(dx / (d || 1) * 8, dz / (d || 1) * 8, 6); } }
    for (const c of VV.cars) if (!c.dead && c.net == null && (!remote || (c.player && meToo)) && Math.abs(c.x - x) < R && Math.abs(c.z - z) < R) { const d = Math.hypot(c.x - x, c.z - z); if (d < R) dmgCar(c, 70 * (1 - d / R), byPlayer && !remote); }
    if (byPlayer && !remote) CB.crime(G.heat.carBoom);
    panic(x, z, 35);
  };
  CB.blast = blast;
  const explode = (car) => {
    car.dead = true; car.deadT = AF.clock.t; car.dmg = 1; car.hp = 0; car.burnT = 0; car.smokeT = 18; car.temp = true;
    car.y += 0.15; car.roll = (Math.random() - 0.5) * 0.25; car.pitch = (Math.random() - 0.5) * 0.15; VV.placeMesh(car);
    FX.boom(car.x, car.y, car.z);
    if (VV.player === car) { VV.exitCar(); H.hurt(55, 'boom'); }
    if (CB.onBoom) CB.onBoom(car);
    blast(car.x, car.y, car.z, G.boomR, !!car.byPlayer, false);
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
      const fx = RO.s, fz = RO.c, rogue = car.player || car.squad || car.net != null;
      for (const w of C.walkers) {
        // traffic keeps to its lanes: only a player / squad car, or a ped already running loose, gets hit
        if (!w.act || flat(w) || (!rogue && !w.agg) || Math.abs(w.y - car.y) > 1.5 || !underCar(w.x, w.z)) continue;
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
        hitCd = 1; if (car.net == null || CB.pvp) H.hurt(Math.max(0, v - G.carHitMin) * G.carHitK + 5, 'car'); AF.PL.push(fx * v * 0.7, fz * v * 0.7, 5); SFX.play('crash', p.x, p.z);
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
      if (!w.act || flat(w) || !shove(b, w.x, w.y, w.z)) continue;
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
    w.agg = aggOf(CB.stars >= 2 || cur() ? 'gun' : 'brawl', G.copHp, P.y, w, { cd: 1.5, wpn: CB.stars >= 4 ? 'smg' : 'pistol' });
    if (AF.clock.t > (CB.whistleT || 0)) { CB.whistleT = AF.clock.t + 8; AU('whistle', { x: w.x, y: w.y + 1.6, z: w.z }); }
    return true;
  };
  // the mob (81-heist): up to 8 pooled goons in pinstripes; they fight the local player (or o.tgt, a co-op slot) and cost no heat.
  // o = { kind: 'gun' | 'brawl', hp, look, weapon: 'pistol' | 'smg' | 'lmg', name, yaw, tgt, role: 'hold' | 'flank' } (all optional)
  CB.spawnGoon = (x, y, z, o = {}) => {
    const C = CR(); if (!C) return null;
    const w = C.walkers.find((q) => q.goon && !q.act); if (!w) return null;
    w.x = x; w.y = y; w.z = z; w.yaw = o.yaw ?? Math.atan2(pl().x - x, pl().z - z); w.act = true; w.ph = 0;
    // o.look: a crowd look name (CR.SP key, e.g. 'cop') or index; else the pinstripe goon
    if (w.v0 == null) w.v0 = w.v;
    const SP = C.SP || {}, lv = typeof o.look === 'number' ? o.look : o.look != null ? SP[o.look] : undefined;
    w.v = w.vd = w.vn = lv != null && C.V[lv] ? lv : w.v0;
    const wpn = o.weapon || (w.id % 3 === 0 ? 'smg' : 'pistol');
    w.agg = aggOf(o.kind || 'gun', o.hp || G.copHp, y, w, { cd: 1.2 + Math.random() * 1.5, reported: true, tgt: o.tgt, wpn: G.npcGun[wpn] ? wpn : 'pistol', name: o.name || null, role: o.role || (wpn === 'lmg' ? 'hold' : w.id % 4 === 1 ? 'flank' : 'hold') });
    return w;
  };
  CB.goons = () => { const C = CR(); return C ? C.walkers.filter((q) => q.goon && q.act) : []; };
  CB.clearGoons = () => { const C = CR(); if (C) for (const w of C.walkers) if (w.goon && w.act) { w.agg = null; w.act = false; } };
  const spawnSquad = () => {
    const P = target(), VP = AF.PLAN;
    for (let i = 0; i < 8; i++) {
      const a = Math.random() * PI * 2, r = 70 + Math.random() * 30, nr = VP.nearestRoad(P.x + Math.sin(a) * r, P.z + Math.cos(a) * r), R = nr.road;
      if (!R || nr.edge > 25) continue;
      const x = R.a[0] + (R.b[0] - R.a[0]) * nr.t, z = R.a[1] + (R.b[1] - R.a[1]) * nr.t, yaw = Math.atan2(P.x - x, P.z - z);
      if (VV.carBlocked({ halfL: 2.6, halfW: 0.95, height: 1.5, y: AF.W.groundY(x, z) }, x, z, yaw)) continue;
      const car = VV.makeCar('police', 0, x, z, yaw); car.temp = true; car.netOwned = true; car.squad = { stuck: 0, rev: 0 }; car.parked = false; car.vx = car.vz = 0;
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
  // the wanted level cleared mid-chase: a squad car brakes to a stop and parks (it used to keep coming and drop off officers)
  const SQ_STOP = { up: false, down: false, left: 0, right: 0, brake: true, thr: 0 };
  const standDown = (car, dt) => {
    const n = Math.min(4, Math.ceil(dt * 60 - 0.01)) || 1; for (let i = 0; i < n; i++) VV.physics(car, dt / n, SQ_STOP);
    VV.placeMesh(car); if (car.interact) car.sync();
    if (Math.abs(car.v) < 0.5) { car.squad = null; car.parked = true; car.v = car.vx = car.vz = 0; }
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
  const heliHit = (n, remote) => {
    if (!HELI.on || HELI.fall) return;
    HELI.hp -= n; FX.burst('smoke', HELI.x, HELI.y + 1, HELI.z, 1);
    if (HELI.hp <= 0) { HELI.fall = true; HELI.vy = 0; FX.boom(HELI.x, HELI.y, HELI.z, 0.6); if (!remote) CB.crime(G.heat.copKill); }
  };
  CB.heliHit = heliHit;
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
        if (CB.onShot) CB.onShot(1, HELI.x, HELI.y + 0.4, HELI.z, P.x + (hit ? 0 : 2), P.y + 1, P.z + (hit ? 0 : 2), hit ? 2 : 1);
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
      if (d < 45 && AF.clock.t > (CB.megaT || 0)) { CB.megaT = AF.clock.t + 14 + Math.random() * 8; AU(T.car ? 'mega_stop' : 'mega_police', { x: c.x, y: c.y + 1.5, z: c.z }); }
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

  // ---------------------------------------------------------------- tracers: one pooled ribbon mesh (additive, camera-facing quads), one draw
  // each tracer = a streak of length L flying from (x0..) to (x1..) at speed v, then shrinking into the end point
  const TR = { max: AF.MOBILE ? 48 : 96, n: 0, mesh: null, scale: { value: 600 } };
  const TD = new Float32Array(TR.max * 14);   // x0 y0 z0 dx dy dz len age speed L w r g b
  const trBuild = () => {
    const M = TR.max, geo = new THREE.BufferGeometry();
    TR.pos = new Float32Array(M * 12); TR.oth = new Float32Array(M * 16); TR.col = new Float32Array(M * 16);
    const side = new Float32Array(M * 4), idx = new Uint16Array(M * 6);
    for (let i = 0; i < M; i++) { side.set([-1, 1, 1, -1], i * 4); const v = i * 4; idx.set([v, v + 1, v + 2, v + 2, v + 1, v + 3], i * 6); }
    TR.attrs = [['position', TR.pos, 3], ['aOther', TR.oth, 4], ['aCol', TR.col, 4]].map(([k, a, d]) => { const at = new THREE.BufferAttribute(a, d).setUsage(THREE.DynamicDrawUsage); geo.setAttribute(k, at); return at; });
    geo.setAttribute('aSide', new THREE.BufferAttribute(side, 1)); geo.setIndex(new THREE.BufferAttribute(idx, 1)); geo.setDrawRange(0, 0);
    const mat = new THREE.ShaderMaterial({
      uniforms: { uScale: TR.scale },
      vertexShader: 'attribute vec4 aOther; attribute float aSide; attribute vec4 aCol; uniform float uScale; varying vec4 vC; varying float vS;\n' +
        'void main(){ vec4 p = modelViewMatrix * vec4(position, 1.0); vec4 q = modelViewMatrix * vec4(aOther.xyz, 1.0); vec3 c = cross(q.xyz - p.xyz, p.xyz); float l = length(c);\n' +
        ' vec3 s = l > 1e-7 ? c / l : vec3(1.0, 0.0, 0.0); float w = max(aOther.w, 1.7 * max(0.05, -p.z) / uScale); p.xyz += s * (aSide * w * 0.5);\n' +
        ' vC = aCol; vC.a *= smoothstep(0.6, 3.5, -p.z); vS = aSide; gl_Position = projectionMatrix * p; }',   // no glare right at the lens
      fragmentShader: 'varying vec4 vC; varying float vS;\nvoid main(){ float e = 1.0 - vS * vS; gl_FragColor = vec4(vC.rgb * (vC.a * e * e), 1.0); }',
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, side: THREE.DoubleSide, forceSinglePass: true,   // quads face either way
    });
    TR.mesh = new THREE.Mesh(geo, mat); TR.mesh.frustumCulled = false; TR.mesh.visible = false; TR.mesh.renderOrder = 7; TR.mesh.name = 'fx-tracers';
    AF.scene.add(TR.mesh);
  };
  const trSpawn = (x0, y0, z0, x1, y1, z1, speed, L, w, r, g, b) => {
    if (!TR.mesh) return;
    const dx = x1 - x0, dy = y1 - y0, dz = z1 - z0, len = Math.hypot(dx, dy, dz); if (len < 0.3) return;
    const i = TR.n < TR.max ? TR.n++ : (Math.random() * TR.max) | 0, o = i * 14;
    TD[o] = x0; TD[o + 1] = y0; TD[o + 2] = z0; TD[o + 3] = dx / len; TD[o + 4] = dy / len; TD[o + 5] = dz / len; TD[o + 6] = len; TD[o + 7] = 0.012 + Math.random() * 0.01;
    TD[o + 8] = speed; TD[o + 9] = L; TD[o + 10] = w; TD[o + 11] = r; TD[o + 12] = g; TD[o + 13] = b;
    TR.made = (TR.made || 0) + 1; TR.mesh.visible = true;
  };
  // public: an NPC / mission tracer (hot = 1 orange enemy fire, 2 heavy, 0 / false a pale player-style round)
  const tracer = CB.tracer = (x0, y0, z0, x1, y1, z1, hot) => {
    if (hot === 2) trSpawn(x0, y0, z0, x1, y1, z1, 300, 7, 0.04, 3.2, 1.3, 0.35);
    else if (hot) trSpawn(x0, y0, z0, x1, y1, z1, 260, 5, 0.028, 2.8, 1.2, 0.35);
    else trSpawn(x0, y0, z0, x1, y1, z1, 320, 5, 0.02, 2.2, 1.8, 1.1);
  };
  const tracerShot = (x0, y0, z0, x1, y1, z1, W) => { const t = W.tr; trSpawn(x0, y0, z0, x1, y1, z1, W.heavy ? 300 : 340, t[1], t[0], t[2], t[3], t[4]); };
  const trUpdate = (dt) => {
    let n = TR.n; if (!n && !TR.was) return;
    const P = TR.pos, O = TR.oth, C = TR.col;
    for (let i = 0; i < n;) {
      const o = i * 14, age = (TD[o + 7] += dt), sp = TD[o + 8], len = TD[o + 6], head = Math.min(len, age * sp), tail = Math.max(0, age * sp - TD[o + 9]);
      if (tail >= len - 0.02 || age > 0.9) { n--; if (i !== n) TD.copyWithin(o, n * 14, n * 14 + 14); continue; }
      const dx = TD[o + 3], dy = TD[o + 4], dz = TD[o + 5], hx = TD[o] + dx * head, hy = TD[o + 1] + dy * head, hz = TD[o + 2] + dz * head, tx = TD[o] + dx * tail, ty = TD[o + 1] + dy * tail, tz = TD[o + 2] + dz * tail;
      const fade = head >= len ? Math.max(0.15, 1 - (tail / len) * 0.7) : 1, w = TD[o + 10], r = TD[o + 11] * fade, g = TD[o + 12] * fade, b = TD[o + 13] * fade;
      const p = i * 12, q = i * 16;
      P[p] = tx; P[p + 1] = ty; P[p + 2] = tz; P[p + 3] = tx; P[p + 4] = ty; P[p + 5] = tz; P[p + 6] = hx; P[p + 7] = hy; P[p + 8] = hz; P[p + 9] = hx; P[p + 10] = hy; P[p + 11] = hz;
      O[q] = hx; O[q + 1] = hy; O[q + 2] = hz; O[q + 3] = w; O[q + 4] = hx; O[q + 5] = hy; O[q + 6] = hz; O[q + 7] = w;
      O[q + 8] = tx; O[q + 9] = ty; O[q + 10] = tz; O[q + 11] = w; O[q + 12] = tx; O[q + 13] = ty; O[q + 14] = tz; O[q + 15] = w;
      C[q] = r; C[q + 1] = g; C[q + 2] = b; C[q + 3] = 0; C[q + 4] = r; C[q + 5] = g; C[q + 6] = b; C[q + 7] = 0;
      C[q + 8] = r; C[q + 9] = g; C[q + 10] = b; C[q + 11] = 1; C[q + 12] = r; C[q + 13] = g; C[q + 14] = b; C[q + 15] = 1;
      i++;
    }
    TR.n = n; TR.was = n > 0; TR.mesh.visible = n > 0; TR.mesh.geometry.setDrawRange(0, n * 6);
    for (const at of TR.attrs) { at.clearUpdateRanges(); at.addUpdateRange(0, n * 4 * at.itemSize); at.needsUpdate = true; }
  };
  CB.tracers = () => TR.n;
  // another player's round (80-coop): tracer + flash + impact, and the shot is heard ('gunshot' with remote: true)
  CB.remoteShot = (wid, hit, mx, my, mz, ex, ey, ez) => {
    const id = GUN_IDS[wid - 1], W = GUNS[id] || GUNS.revolver;
    if (W.tr) trSpawn(mx, my, mz, ex, ey, ez, W.heavy ? 300 : 340, W.tr[1], W.tr[0], W.tr[2], W.tr[3], W.tr[4]);
    FX.burst('flash', mx, my, mz, 1, { size: (W.flash || 0.6) * 0.35 });
    impact(ex, ey, ez, hit === 1 ? 0 : hit === 2 ? 1 : 2, 1);
    emitShot(mx, my, mz, W.loud, !!W.silenced, id || 'revolver', true);
  };

  // ---------------------------------------------------------------- spent magazines: 3 pooled voxel meshes that drop from the gun on a reload
  const MAGS = [];
  const magBuild = () => {
    const m = new AF.Model(2, 5, 2), d = AF.col(0x1c1d20, { metal: 0.6, rough: 0.4 }), s = AF.col(0x9a9ea4, { metal: 0.9 }); m.box(0, 0, 0, 2, 5, 2, d); m.box(0, 4, 0, 2, 5, 2, s);
    const geo = AF.meshModel(m, { vs: 1 / 16, anchor: [0.5, 0.5, 0.5] });
    for (let i = 0; i < 3; i++) { const mesh = AF.modelMesh(geo); mesh.castShadow = false; mesh.visible = false; mesh.name = 'mag-drop'; AF.scene.add(mesh); MAGS.push({ mesh, t: 0, vy: 0, gy: 0, rx: 0 }); }
  };
  const magDrop = () => {
    const M = MAGS.reduce((a, b) => (a.t < b.t ? a : b), MAGS[0]); if (!M) return;
    muzzle(TMP); const h = CB.held, P = AF.player; if (!h) return;
    // from under the receiver: halfway between the hand and the muzzle, a little below
    TMP.lerp(PU.set(P.x, P.y + 1.15, P.z), 0.5);
    M.mesh.position.copy(TMP); M.mesh.rotation.set(Math.random(), P.yaw, 0); M.t = 4; M.vy = 0.5; M.rx = (Math.random() - 0.5) * 9; M.vx = Math.sin(P.yaw + 1.2) * 0.6; M.vz = Math.cos(P.yaw + 1.2) * 0.6;
    M.gy = AF.surfaceBelow(TMP.x, TMP.z, TMP.y, 4) + 0.04; M.mesh.visible = true;
  };
  const magUpdate = (dt) => {
    for (const M of MAGS) {
      if (M.t <= 0) continue;
      M.t -= dt; const m = M.mesh;
      if (m.position.y > M.gy) { M.vy -= 14 * dt; m.position.y = Math.max(M.gy, m.position.y + M.vy * dt); m.position.x += M.vx * dt; m.position.z += M.vz * dt; m.rotation.x += M.rx * dt; if (m.position.y <= M.gy) { m.rotation.x = PI / 2; m.rotation.z = 0; } }
      if (M.t <= 0) m.visible = false;
    }
  };
  // the tracer program is ready before the first shot (drawn with an empty range while compiling); mags reuse the voxel program
  const warm = () => {
    const o = TR.mesh; if (!o || !AF.stream || !AF.stream.compileAhead) return;
    o.visible = true; AF.stream.compileAhead(o).then(() => { o.visible = TR.n > 0; });
  };
  // ---------------------------------------------------------------- the player's animation overlay (after the walk mode animates)
  // poses per weapon class: carry (low ready / across the body), aim (raised, both hands), sprint (lowered), reload; recoil on the arms.
  // [right x, right z, left x, left z, chest yaw, held-gun pitch]
  const CARRY = { pistol: [-0.72, -0.1, -0.68, 0.42, 0.06, 0.15], smg: [-0.5, -0.38, -1.1, 0.72, 0.18, -0.65], shotgun: [-0.5, -0.38, -1.1, 0.72, 0.18, -0.6], rifle: [-0.45, -0.38, -1.05, 0.72, 0.18, -0.6], lmg: [-0.36, -0.42, -0.95, 0.76, 0.22, -0.9] };
  const SPRINT = { pistol: [-0.28, 0.12, 0, 0, 0, 0.1], two: [-0.78, -0.58, -1.3, 0.88, 0.1, -1.05] };
  const KICK_ARM = { pistol: 0.38, smg: 0.12, shotgun: 0.45, rifle: 0.32, lmg: 0.1 };
  const PO = { rx: 0, rz: 0, lx: 0, lz: 0, cy: 0, gx: 0 }, PA = { rx: 0, rz: 0, lx: 0, lz: 0, cy: 0, gx: 0 }, PB = { rx: 0, rz: 0, lx: 0, lz: 0, cy: 0, gx: 0 };
  const poseSet = (o, a) => { o.rx = a[0]; o.rz = a[1]; o.lx = a[2]; o.lz = a[3]; o.cy = a[4]; o.gx = a[5]; return o; };
  const poseLerp = (a, b, k, o) => { o.rx = a.rx + (b.rx - a.rx) * k; o.rz = a.rz + (b.rz - a.rz) * k; o.lx = a.lx + (b.lx - a.lx) * k; o.lz = a.lz + (b.lz - a.lz) * k; o.cy = a.cy + (b.cy - a.cy) * k; o.gx = a.gx + (b.gx - a.gx) * k; return o; };
  const poseAim = (cls, pitch, cx, o) => {
    const lmg = cls === 'lmg', cy = cls === 'pistol' ? 0.12 : lmg ? 0.3 : 0.32;
    o.cy = cy; o.rx = -PI / 2 + (lmg ? 0.35 : 0) + pitch * (lmg ? 0.85 : 0.9) - cx; o.rz = -cy * 0.9 - 0.04; o.gx = lmg ? -0.35 : 0;
    o.lx = o.rx + (cls === 'pistol' ? 0.08 : lmg ? -0.1 : 0.12); o.lz = -cy + (cls === 'pistol' ? 0.48 : lmg ? 0.72 : 0.62);
    return o;
  };
  // reload: left hand to the magazine, down to the belt (the old mag drops), back up, a slap; the gun tilts up to the chest
  const RL = [[0, 0, 0], [0.18, -0.95, 0.55], [0.42, -0.12, 0.25], [0.68, -0.98, 0.56], [0.78, -1.15, 0.5], [0.9, -0.95, 0.55], [1, 0, 0]];
  const poseReload = (cls, u, base, o) => {
    o.rx = base.rx - (cls === 'pistol' ? 0.35 : 0.3); o.rz = base.rz; o.cy = base.cy * 0.6; o.gx = base.gx + 0.35;
    let i = 1; while (i < RL.length - 1 && RL[i][0] < u) i++;
    const a = RL[i - 1], b = RL[i], e0 = AF.clamp((u - a[0]) / (b[0] - a[0] || 1), 0, 1), e = e0 * e0 * (3 - 2 * e0);
    const ax = i - 1 === 0 ? base.lx : a[1], az = i - 1 === 0 ? base.lz : a[2], bx = i === RL.length - 1 ? base.lx : b[1], bz = i === RL.length - 1 ? base.lz : b[2];
    o.lx = ax + (bx - ax) * e; o.lz = az + (bz - az) * e;
    return o;
  };
  const meleePose = (P) => {
    const k = 1 - CB.swing / CB.swingDur;
    if (melee()[4]) {   // overhead diagonal swing: wind-up, strike across the body, follow-through
      let rx, rz, cy, cx = 0;
      if (k < 0.35) { const e = k / 0.35, s = e * e * (3 - 2 * e); rx = AF.lerp(-0.45, -2.75, s); rz = AF.lerp(0.1, 0.55, s); cy = -0.55 * s; }
      else if (k < 0.62) { const e = (k - 0.35) / 0.27, s = e * e; rx = AF.lerp(-2.75, -0.35, s); rz = AF.lerp(0.55, -0.6, s); cy = AF.lerp(-0.55, 0.6, s); cx = 0.2 * s; }
      else { const e = (k - 0.62) / 0.38, s = e * e * (3 - 2 * e); rx = AF.lerp(-0.35, -0.45, s); rz = AF.lerp(-0.6, 0.06, s); cy = AF.lerp(0.6, 0, s); cx = 0.2 * (1 - s); }
      P.armR.rotation.set(rx, 0, rz); P.armL.rotation.set(-0.7 + cy * 0.4, 0, -0.25); P.chest.rotation.y = cy; P.chest.rotation.x += cx; P.head.rotation.y = -cy * 0.7;
    } else {             // fists: a jab / cross from a guard, shoulders turning into it
      const s = CB.side ? 1 : -1, arm = CB.side ? P.armR : P.armL, other = CB.side ? P.armL : P.armR, ext = Math.sin(Math.min(1, k / 0.4) * PI * 0.5) * (k < 0.4 ? 1 : 1 - (k - 0.4) / 0.6);
      arm.rotation.set(AF.lerp(-1.15, -1.62, ext), 0, -s * AF.lerp(0.12, 0.3, ext)); other.rotation.set(-1.3, 0, s * 0.38);
      P.chest.rotation.y = s * 0.4 * ext; P.head.rotation.y = -s * 0.3 * ext; P.chest.rotation.x += 0.08 * ext;
    }
  };
  const ease = (v, to, r, dt) => v + (to - v) * (1 - Math.exp(-dt * r));
  const overlay = (dt, g) => {
    const P = AF.player.parts; if (!P) return;
    CB.recoil = Math.max(0, CB.recoil - dt * 8); CB.flinch = Math.max(0, CB.flinch - dt);
    if (CB.flinch > 0) { P.chest.rotation.x -= CB.flinch * 0.8; P.head.rotation.x -= CB.flinch * 0.6; }
    const W = g && GUNS[g], gal = CB.gallery, cls = gal ? 'rifle' : W ? W.cls : null, aim = !!AF.PL.aim && !!cls;
    const firing = AF.clock.t - CB.lastShot < 0.55, reloading = CB.reloadT > 0 && !gal && !!W;
    CB.raise = ease(CB.raise, (aim || firing) && !reloading ? 1 : 0, 16, dt);
    CB.spr = ease(CB.spr || 0, AF.PL.walk.running && !aim && !firing && !reloading ? 1 : 0, 8, dt);
    CB.rk = ease(CB.rk || 0, reloading ? 1 : 0, 12, dt);
    if (CB.swing > 0) { meleePose(P); return; }
    if (!cls) { if (CB.held) CB.held.rotation.x = 0; return; }
    if (CB.raise > 0.3) P.chest.rotation.x = Math.min(P.chest.rotation.x, 0.2);
    const cx = P.chest.rotation.x, pitch = AF.PL.walk.camPitch;
    poseLerp(poseSet(PA, CARRY[cls]), poseAim(cls, pitch, cx, PB), CB.raise, PO);
    if (CB.spr > 0.01) {
      poseSet(PA, cls === 'pistol' ? SPRINT.pistol : SPRINT.two);
      if (cls === 'pistol') { PA.rx += Math.sin(AF.clock.t * 9) * 0.25; PA.lx = P.armL.rotation.x; PA.lz = P.armL.rotation.z; }
      poseLerp(PO, PA, CB.spr, PO);
    }
    if (CB.rk > 0.01) { poseReload(cls, W ? 1 - CB.reloadT / W.reload : 0, PO, PA); poseLerp(PO, PA, CB.rk, PO); P.chest.rotation.x += 0.1 * CB.rk; P.head.rotation.x += 0.3 * CB.rk; }
    const kk = CB.recoil * (KICK_ARM[cls] || 0.2) * (AF.PL.aim ? 0.7 : 1), jit = W && W.heavy ? (Math.random() - 0.5) * 0.05 * CB.recoil : 0;
    P.armR.rotation.set(PO.rx - kk, 0, PO.rz + jit);
    P.armL.rotation.set(PO.lx - kk * 0.8, 0, PO.lz + jit);
    P.chest.rotation.y = PO.cy; P.chest.rotation.x -= CB.recoil * 0.04;
    if (CB.raise > 0.5) { P.head.rotation.x = pitch * 0.6 - P.chest.rotation.x; P.head.rotation.y = -PO.cy * 0.8; }
    if (CB.held) CB.held.rotation.x = PO.gx;
  };

  // ---------------------------------------------------------------- ticks
  let prevFire = false, slowT = 0, xT = -1;
  AF.onTick('combat', 151, (dt) => {
    if (!AF.ready || !CR()) return;
    CB.cd -= dt; hitCd -= dt;
    const walk = AF.mode === 'walk' && !H.dead, m = I.mouse, locked = !!document.pointerLockElement;
    const busy = !walk || AF.PL.busy || UI.modalOpen() || (UI.dialogueOpen && UI.dialogueOpen());
    if (CB.reloadT > 0) {
      const RW = GUNS[CB.reloadG];
      if (!CB.magDropped && RW && CB.reloadT < RW.reload * 0.78 && walk) { CB.magDropped = true; if (RW.cls !== 'shotgun' && CB.reloadG !== 'revolver') magDrop(); }
      if ((CB.reloadT -= dt) <= 0) { const g = CB.reloadG, W = GUNS[g], take = Math.min(W.mag - magOf(g), resOf(g)); setMag(g, magOf(g) + take); setRes(g, resOf(g) - take); SFX.play('click'); }
    }
    let g = cur();
    if (!busy) {
      if (CB.heldId !== (CB.gallery ? 'rifle' : g || melee()[4]) || (CB.held && CB.held.parent !== AF.player.parts.armR)) attachHeld();
      if (!CB.gallery) {
        // X: a tap is the next weapon, held it opens the wheel; the mouse (or 1-5) picks, letting go takes it
        if (I.hit('KeyX')) xT = 0;
        if (xT >= 0 && I.key('KeyX') && (xT += dt) > 0.2 && !WH.open) CB.wheelOpen();
        if (I.released.has('KeyX')) { if (WH.open) CB.wheelClose(true); else if (xT >= 0 && xT <= 0.2) select(CB.slot + 1); xT = -1; }
        if (WH.open) { CB.wheelAim(m.dx, m.dy); for (let k = 1; k <= Math.min(5, owned().length); k++) if (I.hit('Digit' + k)) { WH.pick = k - 1; CB.wheelClose(true); } }
        else {
          if (m.wheel && locked) select(CB.slot + Math.sign(m.wheel));
          for (let k = 1; k <= 5; k++) if (I.hit('Digit' + k)) select(k - 1);
        }
        if (I.hit('KeyR')) reload();
        g = cur();
      }
      if (I.hit('KeyZ')) CB.aimToggle = !CB.aimToggle;
      const gunUp = !!(g || CB.gallery);
      AF.PL.aim = gunUp && (CB.aimToggle || (locked && !!(m.buttons & 2)) || !!CB.gallery);
      AF.PL.aimFov = CB.gallery ? 34 : g ? GUNS[g].zoom || 40 : 40;
      const down = !WH.open && ((locked && !!(m.buttons & 1)) || I.key('KeyQ')), edge = down && !prevFire; prevFire = down;
      if (down && CB.cd <= 0 && CB.reloadT <= 0 && !AF.hud.meterOn()) {
        if (CB.gallery) { if (edge) fire('revolver'); }
        else if (g) { if (GUNS[g].auto || edge) { fire(g); firedT = 0; } }
        else if (edge) swing();
      }
    } else { AF.PL.aim = false; prevFire = false; xT = -1; CB.wheelClose(false); }
    // recoil recovers once the trigger rests a moment; bloom shrinks back
    const W = g ? GUNS[g] : null, since = AF.clock.t - CB.lastShot;
    if (CB.kick > 0 && since > 0.06) { const r = CB.kick * (1 - Math.exp(-dt * (W ? W.rec : 6))); CB.kick -= r; if (CB.kick < 1e-4) CB.kick = 0; if (walk) { const WK = AF.PL.walk; WK.camPitch = AF.clamp(WK.camPitch + r, -0.75, 1.25); } }
    if (CB.bloom > 0 && since > 0.08) CB.bloom = Math.max(0, CB.bloom - dt * (W ? W.bloomMax * 2.5 : 0.2));
    hudPaint(dt);
    crossPaint(walk && !!AF.PL.aim && !WH.open && !CB.gallery, W ? spreadNow(W) : 0.006);
    if (hmT > 0 && (hmT -= dt) <= 0) hm.className = '';
    if (CB.swing > 0) { CB.swing -= dt; if (CB.hitAt > 0 && CB.swingDur - CB.swing >= CB.hitAt) { CB.hitAt = -1; resolveMelee(); } }
    if (walk) { overlay(dt, g); bodyPush(dt); }
    // 15 Hz: run-overs, wanted level, police
    if ((slowT += dt) >= 1 / 15) { const t = slowT; slowT = 0; runOver(); wanted(t); }
    for (const car of SQUADS) if (car.squad && !car.dead && !car.player) { if (CB.stars) driveSquad(car, dt); else standDown(car, dt); }
    if (HELI.grp && (HELI.on || CB.stars >= 3)) heliStep(dt);
    carFx(dt);
    if (TR.mesh && (TR.n || TR.was)) {
      const R = AF.post && AF.post.enabled && AF.post.sceneRT ? AF.post.sceneRT.height : AF.renderer.domElement.height;
      TR.scale.value = R / (2 * Math.tan(AF.camera.fov * PI / 360)); trUpdate(dt);
    }
    magUpdate(dt);
  });
  AF.on('hurt', () => { CB.flinch = 0.25; });
  AF.on('mode', (m) => { if (m !== 'walk') { AF.PL.aim = false; CB.swing = 0; crossPaint(false, 0); } });
  AF.onBuild('combat', 875, () => { heliBuild(); trBuild(); magBuild(); });
  if (AF.preloaded) setTimeout(warm, 0); else AF.on('preloaded', warm);

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
  AF.test('combat: officers stand down once the wanted level clears (no shots, they walk off)', () => {
    const C = CR(), mode = AF.mode, hp = H.v, P = AF.player;
    if (AF.modes.walk && mode !== 'walk') AF.setMode('walk');
    CB.crime(G.stars[1] + 1);
    const spawned = spawnCop(TMP.set(P.x + 6, P.y, P.z)), cop = C.walkers.find((q) => q.cop && q.act);
    if (!spawned || !cop) { clearWanted(); return { ok: false, info: 'no cop' }; }
    clearWanted(); cop.agg.cd = 0; cop.agg.aimT = 0;
    const d0 = Math.hypot(cop.x - P.x, cop.z - P.z), onShot = CB.onShot; let alive = true, shots = 0;
    CB.onShot = function () { shots++; };
    try { for (let i = 0; i < 90 && alive; i++) alive = CB.stepPed(cop, 1 / 30) !== false; } finally { CB.onShot = onShot; }
    const d1 = Math.hypot(cop.x - P.x, cop.z - P.z), unhurt = H.v === hp;
    if (cop.agg) CB.release(cop); H.v = hp;
    if (mode && mode !== AF.mode && AF.modes[mode]) AF.setMode(mode);
    return { ok: !shots && unhurt && (d1 > d0 || !alive), info: `shots ${shots}, unhurt ${unhurt}, ${d0.toFixed(1)} -> ${d1.toFixed(1)} m, active ${alive}` };
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
  // a clear spot d m from the player (standable, in sight) for the tests below
  const openSpot = (d) => { const P = AF.player; for (let i = 0; i < 16; i++) { const a = i * PI / 8, x = P.x + Math.sin(a) * d, z = P.z + Math.cos(a) * d, y = AF.surfaceBelow(x, z, P.y + 2, 4); if (Math.abs(y - P.y) < 0.6 && !AF.boxBlocked(x, y + 0.05, z, 0.3, 1.8) && los(P.x, P.y + 1.6, P.z, x, y + 1.6, z) && los(P.x, P.y + 1.2, P.z, x, y + 1.2, z)) return { x, y, z }; } return null; };
  AF.test('combat: a lent silenced pistol headshot downs a goon in one hit; the shot is quiet and costs no heat', () => {
    const C = CR(), P = AF.player; if (!C) return { ok: false, info: 'no crowd' };
    const slot = CB.slot, heat = CB.heat, stars = CB.stars, WK = AF.PL.walk, pitch = WK.camPitch, yaw = WK.camYaw, pyaw = P.yaw, aim = AF.PL.aim;
    const ev = AF._ev.gunshot || (AF._ev.gunshot = []); let heard = null; const on = (e) => { heard = { loud: e.loud, silenced: e.silenced, weapon: e.weapon }; }; ev.push(on);
    let w = null;
    try {
      const lent = CB.lend('spistol', 24), drawn = cur() === 'spistol' && magOf('spistol') === 12 && resOf('spistol') === 12 && CB.has('spistol') && !S.guns.spistol;
      const at = openSpot(6); if (!at) return { ok: false, info: 'no open spot' };
      w = CB.spawnGoon(at.x, at.y, at.z, { weapon: 'smg', hp: G.copHp }); if (!w) return { ok: false, info: 'no goon' };
      const hy = w.y + 1.75 * w.s * 0.905, r = CB.volley('spistol', P.x, hy, P.z, w.x - P.x, 0, w.z - P.z);
      const downed = !!w.agg && w.agg.st === 'down' && r === 1 && w.agg.wpn === 'smg';
      AF.PL.aim = false; P.yaw = Math.atan2(-(w.x - P.x), -(w.z - P.z)); CB.cd = 0; fire('spistol');
      const quiet = !!heard && heard.loud <= 8 && heard.silenced && heard.weapon === 'spistol' && CB.heat === heat && magOf('spistol') === 11;
      CB.unlend('spistol'); const gone = !CB.has('spistol') && cur() !== 'spistol';
      return { ok: lent && drawn && downed && quiet && gone, info: `lent ${lent && drawn}, head down ${downed} (r ${r}), quiet ${quiet} ${JSON.stringify(heard)}, unlent ${gone}` };
    } finally {
      ev.splice(ev.indexOf(on), 1); if (w && w.agg) CB.release(w); CB.unlend(); CB.slot = slot; CB.heat = heat; CB.stars = stars; CB.kick = 0; CB.bloom = 0;
      WK.camPitch = pitch; WK.camYaw = yaw; P.yaw = pyaw; AF.PL.aim = aim; attachHeld();
    }
  });
  AF.test('combat: goons take cover or strafe and fire bursts with tracers; a hit makes them flinch', () => {
    const C = CR(), P = AF.player, hp = H.v, onShot = CB.onShot, was = AF.mode; if (!C) return { ok: false, info: 'no crowd' };
    if (AF.mode !== 'walk') AF.setMode('walk', {});
    let shots = 0, w = null;
    CB.onShot = function () { shots++; };
    try {
      const at = openSpot(10); if (!at) return { ok: false, info: 'no open spot' };
      w = CB.spawnGoon(at.x, at.y, at.z, { weapon: 'lmg', hp: 500, name: 'Test' }); if (!w) return { ok: false, info: 'no goon' };
      const A = w.agg, tr0 = TR.made || 0; A.cd = 0; let tacs = new Set();
      for (let i = 0; i < 150 && shots < 3; i++) { CB.stepPed(w, 1 / 30); trUpdate(1 / 30); tacs.add(A.tac); }
      const maxTr = (TR.made || 0) - tr0;
      hitPed(w, 10, 'gun', -1, 0, true); const flinch = A.flinch > 0 && A.burst === 0;
      return { ok: shots >= 3 && maxTr >= 3 && flinch && A.name === 'Test', info: `shots ${shots}, tracers ${maxTr}, flinch ${flinch}, tactics ${[...tacs].join('/')}` };
    } finally { CB.onShot = onShot; if (w && w.agg) CB.release(w); H.v = hp; for (let i = 0; i < 40; i++) trUpdate(0.05); if (was && was !== AF.mode && AF.modes[was]) AF.setMode(was); }
  });
  AF.test('combat: weapon HUD shows on foot and its arrow switches weapon; tracers pool and empty', () => {
    const was = AF.mode, slot = CB.slot; if (AF.mode !== 'walk') AF.setMode('walk', {});
    try {
      CB.lend('lmg', 150); hudPaint(0.016);
      const shown = chip.classList.contains('on') && /Machine/.test(chipName.textContent) && /100/.test(chipAmmo.textContent);
      const s0 = CB.slot, ev = (t) => new PointerEvent(t, { pointerId: 7, bubbles: true });
      chipNext.dispatchEvent(ev('pointerdown')); chipNext.dispatchEvent(ev('pointerup'));
      const switched = CB.slot !== s0 || CB.owned().length < 2;
      for (let i = 0; i < 5; i++) tracer(0, 2, 0, 30, 2, 0, i & 1);
      const pooled = TR.n >= 5; for (let i = 0; i < 40; i++) trUpdate(0.05);
      return { ok: shown && switched && pooled && TR.n === 0, info: `shown ${shown}, arrow ${switched}, pooled ${pooled}, empty ${TR.n === 0}` };
    } finally { CB.unlend(); CB.slot = slot; attachHeld(); if (was && was !== AF.mode) AF.setMode(was); }
  });
}
} catch (e) { AF.partError('77-combat.js', e); }
