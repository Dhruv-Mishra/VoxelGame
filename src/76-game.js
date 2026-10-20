// ================================================================ 76-game.js
try {
// ===== 76-game: the gameplay core shared by 77-combat + 78-jobs  (OWNER: game) =====
// AF.G       every tuning number of the gameplay layer (economy, health, damage, wanted, forget policy) — balance here only
// AF.save    the ONLY hard-persisted gameplay state: money, guns + ammo, outfits owned, a look per friend (localStorage)
// AF.money   add(n) / spend(n, what) -> bool          AF.health  hurt(n, src) / heal(n) / kill(src); 0 hp -> 'dead' mode -> wake at home
// AF.shop    open({ title, sub, tabs?, items(tab) -> [{ name, desc, price, tag, sw, off, act() }] }) — every counter + wardrobe
// AF.fx      pooled particles, 2 draws (additive glow + dithered opaque smoke), nothing per frame while empty:
//            burst(kind, x, y, z, n, o) kinds flash|fire|spark|smoke|steam|dust|hit|glow, line(x0..z1) for tracers
// AF.sfx     synthesised one-shots + a siren (WebAudio, no files)     AF.hud  panel under the minimap, job line, crosshair, meter
// Forget policy: runtime cars (taken from the kerb, police, wrecks) are dropped G.forgetS s after the player is G.forgetD away;
// engaged peds calm down past G.pedForgetD (77). AF.forget sweeps whatever a player touched and left for G.staleS (cars, wrecks,
// planes, jet skis, rowing boats) back home or away. Only AF.save survives a reload.
{
  const PI = Math.PI, UI = AF.ui, root = document.getElementById('ui');
  const G = AF.G = {
    money0: 150,
    hp: 100, regenTo: 40, regenRate: 2, regenDelay: 8,
    fallSafe: 13, fallK: 6,                       // landing faster than 13 m/s (a ~4 m drop) costs 6 hp per extra m/s
    carHitMin: 4, carHitK: 5,                     // a car hitting you on foot: (v - 4) * 5 hp
    crashMin: 9, crashK: 3,                       // a hard crash hurts the driver too
    deathFee: 0.1, deathFeeMax: 400, respawnS: 5,
    vehHp: 100, vehDmgMin: 3, vehDmgK: 3.2, vehSmoke: 45, vehBurnS: 7, boomR: 8, boomDmg: 95,
    forgetD: 220, forgetS: 40, wreckS: 60,
    // stale sweep (AF.forget): anything a player touched and left returns home / is dropped staleS s after the last touch, checked
    // every staleEvery s, never within staleNearD m of the camera (its spot or its home) so nothing pops in view
    staleS: 300, staleEvery: 5, staleNearD: 60,
    pedHp: 30, copHp: 60, engagedMax: 12, pedForgetD: 85, panicR: 26,
    // gunplay (77): headshot multiplier, stance spread multipliers, recoil recovery; silenced shots only panic / report within these
    headK: 2.5, aimSpreadK: 0.28, crouchSpreadK: 0.5, moveSpreadK: 0.7, sprintSpreadK: 1.8, airSpreadK: 2.2, adsKickK: 0.5,
    silencedPanicR: 7, witnessR: 22, copWitnessR: 45,
    // the mob / police guns: [dmg per hit, base hit chance, burst min, burst max, s between shots in a burst, s between bursts]
    npcGun: { pistol: [7, 0.42, 1, 3, 0.28, 1.3], smg: [5, 0.32, 3, 6, 0.1, 1.5], lmg: [8, 0.3, 6, 11, 0.08, 2.2] },
    heat: { assault: 22, ko: 30, kill: 60, shots: 8, copHit: 50, copKill: 120, runOver: 45, carBoom: 40, trespass: 25 },
    stars: [20, 70, 150, 260, 400], evadeS: [0, 10, 14, 18, 24, 30], cops: [0, 2, 3, 4, 6, 8], squad: [0, 0, 1, 2, 3, 3],
    // the default melee everyone carries (77): bare fists [dmg, reach m, s between punches]; armour (missions lend it, never saved) soaks a share
    fistDmg: 11, fistReach: 1.6, fistCd: 0.42, armorMax: 100, armorAbsorb: 0.7,
    // launchers (77): rocket blast radius / damage scale vs cars, strike jets' hit points; armoured cars (car.armor) take this share
    rocketCarK: 2.2, jetHp: 240, armorCarK: 0.12,
    // the wanted level only exists on the main island: z below mainZ (the islands, the liner and the open sea lie past it)
    mainZ: 1000,
    // 4+ stars: up to jetN pooled strike jets (m/s, rad/s, cruise height) loose seeker missiles after a jetWarnS lock-on warning,
    // then wait jetCdS; a missile flies missileSpeed, turns missileTurn rad/s, burns out after missileLife s, blasts missileR m
    jetStars: 4, jetN: 2, jetSpeed: 70, jetTurn: 0.6, jetAlt: 70, jetWarnS: 2.5, jetCdS: 9, jetRange: 260,
    missileN: 6, missileSpeed: 38, missileTurn: 1.6, missileLife: 6, missileDmg: 45, missileR: 5,
    // the GODMODE code: typed within cheatWindow s; one-hit damage while it is on
    cheatWindow: 5, cheatDmg: 9999,
    price: { ride: 2, game: 1, ticket: 40, repairBase: 25, repairK: 4, repaint: 120, sellK: 0.3, sellCooldown: 300 },
    pay: { taxiBase: 12, taxiPerM: 0.05, busStop: 9, deliver: 16, deliverPerM: 0.04, courier: 10, courierPerM: 0.06, fire: 90, early: 0.4 },
  };

  // ---------------------------------------------------------------- AF.save
  const KEY = 'portSolace.save';
  const S = AF.save = Object.assign({ money: G.money0, guns: {}, ammo: {}, wear: [], looks: {} }, (() => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } })());
  let saveT = 0;
  AF.saveNow = () => { saveT = 0; try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* storage blocked */ } };
  AF.saveSoon = () => { saveT = 1.5; };

  // ---------------------------------------------------------------- DOM helpers + styles
  const h = (tag, cls, html, parent) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; (parent || root).appendChild(e); return e; };
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const text = (el, v) => { v = String(v); if (el.textContent !== v) el.textContent = v; };
  const show = (el, on, d = 'block') => { const v = on ? d : 'none'; if (el.style.display !== v) el.style.display = v; };
  const cash = (n) => '$' + Math.round(n).toLocaleString('en-US');
  AF.cash = cash;
  const st = document.createElement('style');
  st.textContent = `
  #ui #h-stat{display:flex;flex-direction:column;align-items:flex-end;gap:0;position:relative}
  #ui #h-stat .m{font:700 26px/1.05 var(--font);color:#fff;font-variant-numeric:tabular-nums;letter-spacing:.4px}
  #ui #h-stat .st{font-size:19px;letter-spacing:3px;line-height:1.1;color:rgba(255,255,255,.3);white-space:nowrap}
  #ui #h-stat .st b{color:var(--gold);font-weight:400} #ui #h-stat .st.ev b{animation:gPulse .7s infinite} #ui #h-stat .st.none{display:none}
  #ui #h-stat .gain{font:700 17px var(--font);white-space:nowrap;opacity:0;transform:translateY(-4px);transition:opacity .3s,transform .5s;pointer-events:none;height:0;overflow:visible}
  #ui #h-stat .gain.on{opacity:1;transform:none;height:auto} #ui #h-stat .gain.neg{color:#ff8a7a} #ui #h-stat .gain.pos{color:#7ddc8a}
  #ui #h-hp{height:7px;border-radius:2px;background:rgba(6,8,12,.72);box-shadow:0 0 0 1px rgba(0,0,0,.5);overflow:hidden}
  #ui #h-hp i{display:block;height:100%;width:100%;background:linear-gradient(#86e293,#4cae5a);transition:width .25s}
  #ui #h-hp.low i{background:#e2524a;animation:gPulse 1s infinite}
  #ui #h-job{display:none!important}
  #ui #h-cross{position:absolute;left:50%;top:50%;width:20px;height:20px;margin:-10px 0 0 -10px;border-radius:50%;border:1.5px solid rgba(255,255,255,.75);display:none;pointer-events:none;box-shadow:0 0 3px rgba(0,0,0,.6);transition:border-color .1s,transform .1s}
  #ui #h-cross:after{content:'';position:absolute;left:50%;top:50%;width:3px;height:3px;margin:-1.5px;border-radius:50%;background:#fff}
  #ui #h-cross.hit{border-color:#ff6a5a;transform:scale(1.25)}
  #ui #h-hurt{position:absolute;inset:0;pointer-events:none;opacity:0;background:radial-gradient(ellipse at center,rgba(0,0,0,0) 52%,rgba(170,16,16,.6) 100%);transition:opacity .35s}
  #ui #h-dead{position:absolute;inset:0;display:none;flex-direction:column;align-items:center;justify-content:center;gap:0;pointer-events:none;background:radial-gradient(ellipse at center,rgba(30,8,8,.15),rgba(30,0,0,.6));animation:uiIn .6s ease}
  #ui #h-dead h1{margin:0;padding:14px 0 6px;width:100%;text-align:center;font:400 54px Limelight,Georgia,serif;color:#ff6a5a;letter-spacing:4px;text-shadow:0 2px 14px #000;background:linear-gradient(90deg,rgba(0,0,0,0),rgba(0,0,0,.6) 22%,rgba(0,0,0,.6) 78%,rgba(0,0,0,0))}
  #ui #h-dead div{color:#e6e9eb;font-size:13px;letter-spacing:2px;text-transform:uppercase;padding:0 0 14px;width:100%;text-align:center;background:linear-gradient(90deg,rgba(0,0,0,0),rgba(0,0,0,.6) 22%,rgba(0,0,0,.6) 78%,rgba(0,0,0,0))}
  #ui #h-meter{position:absolute;left:50%;bottom:24%;transform:translateX(-50%);width:min(340px,72vw);padding:10px 14px 12px;border-radius:4px;display:none;text-align:center;font-size:13px;background:var(--hud);box-shadow:0 4px 18px rgba(0,0,0,.35)}
  #ui #h-meter small{display:block;color:var(--dim);font-size:11px;margin-top:2px}
  #ui #h-meter .bar{position:relative;height:12px;border-radius:3px;background:rgba(255,255,255,.1);margin-top:9px;overflow:hidden}
  #ui #h-meter .z{position:absolute;top:0;bottom:0;background:rgba(120,230,170,.5);border-radius:3px}
  #ui #h-meter .n{position:absolute;top:0;bottom:0;width:4px;margin-left:-2px;border-radius:3px;background:#fff;box-shadow:0 0 6px #fff}
  #ui #m-shop>.panel{width:min(480px,100%);display:flex;flex-direction:column}
  #ui #m-shop h2{margin-bottom:6px} #ui #m-shop .sub{display:flex;justify-content:space-between;color:var(--dim);font-size:12px;margin-bottom:12px}
  #ui #m-shop .sub b{color:#7ddc8a;font-weight:700;font-size:15px} #ui #m-shop .tabs{margin-bottom:10px;flex-wrap:wrap} #ui #m-shop .tabs:empty{display:none}
  #ui #m-shop .items{display:grid;gap:4px;flex:0 1 auto;min-height:0;max-height:min(54vh,430px);overflow:auto;padding-right:2px}
  @media (max-height:520px){#ui #m-shop>.panel{padding:12px 14px} #ui #m-shop h2{font-size:16px;margin-bottom:0} #ui #m-shop .sub{margin-bottom:8px} #ui #m-shop .tabs{margin-bottom:6px} #ui #m-shop .items{max-height:none} #ui #m-shop .it{padding:7px 10px} #ui #m-shop .stack{margin-top:8px}}
  #ui #m-shop .it{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:10px;text-align:left;padding:9px 12px;border-radius:3px;background:rgba(255,255,255,.04);border-left:3px solid transparent;transition:background .15s,border-color .15s}
  #ui #m-shop .it:hover:not([disabled]){background:rgba(255,255,255,.1);border-left-color:var(--gold)} #ui #m-shop .it[disabled]{opacity:.42;cursor:default}
  #ui #m-shop .it i{width:14px;height:14px;border-radius:50%;border:1px solid rgba(255,255,255,.35)} #ui #m-shop .it i.no{visibility:hidden;width:0;margin-right:-10px}
  #ui #m-shop .it small{display:block;color:var(--dim);font-size:11px;margin-top:1px}
  #ui #m-shop .it em{font-style:normal;font-weight:700;color:#7ddc8a;white-space:nowrap} #ui #m-shop .it em.t{color:var(--dim);font-weight:500}
  #ui.touch #h-stat .m{font-size:19px} #ui.touch #h-stat .st{font-size:14px}
  #ui.touch #h-hp{height:5px}
  #ui.photo #h-cross,#ui.photo #h-meter,#ui.mapping #h-cross,#ui.mapping #h-meter,#ui.cine #h-cross{display:none!important}
  @keyframes gPulse{50%{opacity:.35}}`;
  document.head.appendChild(st);

  // ---------------------------------------------------------------- HUD (GTA-style: cash + wanted stars top right, health under the minimap)
  const right = document.getElementById('h-right'), mm = document.getElementById('h-mm');
  const stat = h('div', 'hud', `<div class="m"></div><div class="st"></div><div class="gain"></div>`); stat.id = 'h-stat';
  right.insertBefore(stat, right.firstChild);
  const hpBar = h('div', '', '<i></i>', mm); hpBar.id = 'h-hp';
  const hpFill = hpBar.firstChild, mEl = stat.querySelector('.m'), starEl = stat.querySelector('.st'), gainEl = stat.querySelector('.gain');
  const job = h('div', 'panel hud', ''); job.id = 'h-job';
  const cross = h('div', '', ''); cross.id = 'h-cross';
  const hurtEl = h('div', '', ''); hurtEl.id = 'h-hurt';
  const deadEl = h('div', '', '<h1>KNOCKED OUT</h1><div>The ambulance is on its way\u2026</div>'); deadEl.id = 'h-dead';
  const meterEl = h('div', 'panel pe', '<div class="l"></div><small></small><div class="bar"><div class="z"></div><div class="n"></div></div>'); meterEl.id = 'h-meter';
  let gainT = 0, hurtT = 0, crossHitT = 0;
  const HUD = AF.hud = {
    job: null,                  // { title, line, t } from 78-jobs
    gain(n) { gainEl.textContent = (n > 0 ? '+' : '\u2212') + cash(Math.abs(n)); gainEl.className = 'gain on ' + (n > 0 ? 'pos' : 'neg'); gainT = 1.6; },
    hurt(n) { hurtEl.style.opacity = String(Math.min(1, 0.35 + n / 30)); hurtT = 0.35; },
    hitMark() { cross.classList.add('hit'); crossHitT = 0.12; },
    cross(on) { show(cross, on); },
  };
  // a timing meter for the carnival games: the needle sweeps, attack / E / tap stops it; done(v 0..1, inZone)
  const MT = { on: false, v: 0, dir: 1, speed: 1, zone: [0.8, 0.95], done: null, t: 0 };
  HUD.meter = (o, done) => {
    Object.assign(MT, { on: true, v: 0, dir: 1, speed: o.speed || 1.2, zone: o.zone || [0.82, 0.96], done, t: 0 });
    meterEl.querySelector('.l').textContent = o.label || ''; meterEl.querySelector('small').textContent = o.sub || (AF.touch ? 'Tap to stop the needle' : 'Click, E or Q to stop the needle');
    const z = meterEl.querySelector('.z'); z.style.left = MT.zone[0] * 100 + '%'; z.style.width = (MT.zone[1] - MT.zone[0]) * 100 + '%';
    show(meterEl, true); AF.PL.busy = true;
  };
  HUD.meterOn = () => MT.on;
  HUD.meterCancel = () => { if (!MT.on) return; MT.on = false; show(meterEl, false); AF.PL.busy = false; };
  const meterStop = () => { if (!MT.on || MT.t < 0.15) return; MT.on = false; show(meterEl, false); AF.PL.busy = false; const v = MT.v; if (MT.done) MT.done(v, v >= MT.zone[0] && v <= MT.zone[1]); };
  meterEl.addEventListener('pointerdown', (e) => { e.preventDefault(); meterStop(); });

  // ---------------------------------------------------------------- money
  AF.money = {
    get v() { return S.money; },
    add(n) { n = Math.round(n); if (!n) return; S.money = Math.max(0, S.money + n); AF.saveSoon(); HUD.gain(n); if (n > 0) SFX.play('cash'); },
    spend(n, what) {
      if (S.money < n) { AF.emit('toast', `Not enough cash \u2014 ${what || 'that'} costs ${cash(n)}.`); SFX.play('deny'); return false; }
      AF.money.add(-n); return true;
    },
  };

  // ---------------------------------------------------------------- health, death, respawn
  const H = AF.health = { v: G.hp, max: G.hp, last: -99, dead: false };
  const HURT_MODES = new Set(['walk', 'drive', 'jetski', 'passenger']);
  H.hurt = (n, src) => {
    if (H.dead || !(n > 0) || !AF.ready || !HURT_MODES.has(AF.mode) || (UI.state && UI.state.title)) return;
    const CB = AF.combat;
    if (CB && CB.cheat && CB.cheat.god) return;
    if (CB && CB.absorb) { n = CB.absorb(n, src); if (!(n > 0)) { H.last = AF.clock.t; return; } }
    H.v = Math.max(0, H.v - n); H.last = AF.clock.t; HUD.hurt(n); SFX.play('hurt');
    AF.emit('hurt', n, src);
    if (H.v <= 0) die(src);
  };
  H.heal = (n) => { H.v = Math.min(H.max, H.v + n); };
  // certain death (a plane flown into the ground or the sea), whatever the mode
  H.kill = (src) => { if (H.dead || !AF.ready || (AF.combat && AF.combat.cheat && AF.combat.cheat.god)) return; H.v = 0; H.last = AF.clock.t; HUD.hurt(H.max); AF.emit('hurt', H.max, src); die(src); };
  AF.on('land', (v) => { if (v > G.fallSafe) H.hurt((v - G.fallSafe) * G.fallK, 'fall'); });
  const DEAD = { t: 0, cam: new THREE.Vector3(), look: new THREE.Vector3() };
  const die = (src) => {
    H.dead = true;
    const car = AF.mode === 'drive' && AF.vehicles.player;
    if (car) { const s = Math.sin(car.yaw), c = Math.cos(car.yaw); AF.player.teleport(car.x + c * (car.halfW + 0.8), car.y + 0.5, car.z - s * (car.halfW + 0.8), car.yaw); }
    AF.setMode('dead');
    AF.emit('died', src);
  };
  const respawn = () => {
    const fee = Math.min(G.deathFeeMax, Math.round(S.money * G.deathFee));
    H.v = H.max; H.dead = false; H.last = -99;
    AF.emit('respawn');
    // a mission can bring you round at its last checkpoint instead of at home (81-heist)
    const alt = AF.respawnAt && AF.respawnAt(), s = alt || AF.PLAN.spawn, go = () => { AF.setMode('walk', { x: s.x, y: s.y, z: s.z, yaw: s.yaw, snap: true }); if (alt && alt.go) alt.go(); };
    if (AF.stream && AF.stream.travel) AF.stream.travel({ label: alt ? alt.label : 'home', go }); else go();
    if (fee) AF.money.add(-fee);
    if (alt) return;
    AF.emit('toast', fee ? `You wake up at home, sore. The doctor's bill: ${cash(fee)}.` : 'You wake up at home, sore but in one piece.');
  };
  AF.modes.dead = {
    enter() { DEAD.t = 0; DEAD.done = false; DEAD.yaw = AF.player.yaw; show(deadEl, true, 'flex'); AF.emit('hint', ''); AF.player.setVisible(true); },
    exit() { show(deadEl, false); const p = AF.player; if (p.mesh) p.mesh.rotation.set(0, p.yaw, 0); },
    update(dt) {
      DEAD.t += dt;
      const p = AF.player, b = p.body, P = p.parts, e = Math.min(1, DEAD.t / 0.7) ** 2;
      if (p.mesh) { p.mesh.visible = true; p.mesh.position.set(b.x, b.y + e * 0.1, b.z); p.mesh.rotation.set(-e * PI * 0.49, DEAD.yaw, 0, 'YXZ'); }
      if (P) { P.armL.rotation.set(-0.3 * e, 0, -1.3 * e); P.armR.rotation.set(-0.3 * e, 0, 1.3 * e); P.legL.rotation.x = 0.15 * e; P.legR.rotation.x = -0.1 * e; P.head.rotation.set(0.2 * e, 0.4 * e, 0); }
      const a = DEAD.yaw + PI + DEAD.t * 0.16, r = 2.5 + DEAD.t * 0.9;
      DEAD.look.set(b.x, b.y + 0.3, b.z);
      DEAD.cam.set(b.x + Math.sin(a) * r, b.y + 1.8 + DEAD.t * 1.3, b.z + Math.cos(a) * r);
      const cam = AF.camera; cam.position.copy(DEAD.cam); cam.up.set(0, 1, 0); cam.lookAt(DEAD.look); AF.camTarget.copy(DEAD.look);
      AF.shadowFocus.set(b.x, 0, b.z); AF.shadowRadius = 50;
      if (DEAD.t > G.respawnS && !DEAD.done) { DEAD.done = true; respawn(); }
    },
  };

  // ---------------------------------------------------------------- shop sheet (also the wardrobe, the garage, the ticket desk)
  const shop = h('div', 'sheet pe', '<div class="panel"><h2></h2><div class="sub"><span class="s"></span><b></b></div><div class="tabs seg"></div><div class="items"></div><div class="stack"><button class="btn" data-k="close">Done</button></div></div>'); shop.id = 'm-shop';
  const shT = shop.querySelector('h2'), shS = shop.querySelector('.sub .s'), shM = shop.querySelector('.sub b'), shTabs = shop.querySelector('.tabs'), shItems = shop.querySelector('.items');
  const SH = { cur: null, tab: 0, list: [] };
  const renderShop = () => {
    const o = SH.cur; if (!o) return;
    text(shT, o.title); text(shS, o.sub || ''); text(shM, cash(S.money));
    shTabs.innerHTML = (o.tabs || []).map((t, i) => `<button data-t="${i}" class="${i === SH.tab ? 'on' : ''}">${esc(t)}</button>`).join('');
    SH.list = o.items(SH.tab) || [];
    shItems.innerHTML = SH.list.map((it, i) => `<button class="it" data-i="${i}"${it.off ? ' disabled' : ''}><i class="${it.sw ? '' : 'no'}" style="${it.sw ? 'background:' + it.sw : ''}"></i><span>${esc(it.name)}${it.desc ? '<small>' + esc(it.desc) + '</small>' : ''}</span><em class="${it.tag ? 't' : ''}">${esc(it.tag || (it.price ? cash(it.price) : 'Free'))}</em></button>`).join('');
  };
  AF.shop = {
    open(o) { SH.cur = o; SH.tab = 0; UI.state.shop = true; renderShop(); shop.classList.add('open'); AF.input.releaseLock(); AF.PL.aim = false; },
    close() { if (!SH.cur) return; const o = SH.cur; SH.cur = null; UI.state.shop = false; shop.classList.remove('open'); if (o.onClose) o.onClose(); AF.input.requestLock(); },
    refresh: renderShop,
    // pay, then run fn; true re-renders the sheet
    buy(price, what, fn) { if (!AF.money.spend(price, what)) return; fn(); AF.saveSoon(); renderShop(); },
  };
  shop.addEventListener('click', (e) => {
    if (e.target === shop || e.target.closest('[data-k=close]')) { AF.shop.close(); return; }
    const t = e.target.closest('[data-t]'); if (t) { SH.tab = +t.dataset.t; renderShop(); return; }
    const b = e.target.closest('.it'); if (!b || b.disabled) return;
    const it = SH.list[+b.dataset.i]; if (it && it.act) { it.act(); if (SH.cur) renderShop(); }
  });

  // ---------------------------------------------------------------- AF.fx: pooled particles (2 Points draws, idle when empty)
  const SCALE = { value: 600 };
  const VS = 'attribute vec3 color; attribute float aSize; attribute float aA; uniform float uScale; varying vec3 vC; varying float vA;\nvoid main(){ vC = color; vA = aA; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = clamp(aSize * uScale / max(0.1, -mv.z), 1.0, 256.0); }';
  const FS_ADD = 'varying vec3 vC; varying float vA;\nvoid main(){ vec2 p = gl_PointCoord * 2.0 - 1.0; float d = dot(p, p); if (d > 1.0) discard; float a = 1.0 - d; gl_FragColor = vec4(vC * a * a * vA, 1.0); }';
  // smoke stays opaque (PERF.md 8.5): coverage is dithered with interleaved gradient noise instead of alpha-blended
  const FS_DIT = 'varying vec3 vC; varying float vA;\nvoid main(){ vec2 p = gl_PointCoord * 2.0 - 1.0; float d = dot(p, p); float a = vA * (1.0 - d); float th = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715)))); if (a < th) discard; gl_FragColor = vec4(vC * (0.8 + 0.2 * (1.0 - d)), 1.0); }';
  class Pool {
    constructor(max, add) {
      this.max = max; this.n = 0; this.add = add;
      this.pos = new Float32Array(max * 3); this.col = new Float32Array(max * 3); this.size = new Float32Array(max); this.alpha = new Float32Array(max);
      this.vel = new Float32Array(max * 3); this.life = new Float32Array(max); this.age = new Float32Array(max); this.s0 = new Float32Array(max); this.grow = new Float32Array(max); this.g = new Float32Array(max);
      const geo = new THREE.BufferGeometry();
      this.attrs = [['position', this.pos, 3], ['color', this.col, 3], ['aSize', this.size, 1], ['aA', this.alpha, 1]].map(([k, a, d]) => { const at = new THREE.BufferAttribute(a, d).setUsage(THREE.DynamicDrawUsage); geo.setAttribute(k, at); return at; });
      geo.setDrawRange(0, 0);
      const mat = new THREE.ShaderMaterial({ uniforms: { uScale: SCALE }, vertexShader: VS, fragmentShader: add ? FS_ADD : FS_DIT, transparent: add, depthWrite: !add, blending: add ? THREE.AdditiveBlending : THREE.NormalBlending, fog: false });
      this.pts = new THREE.Points(geo, mat); this.pts.frustumCulled = false; this.pts.visible = false; this.pts.renderOrder = add ? 7 : 0; this.pts.name = add ? 'fx-glow' : 'fx-smoke';
      AF.scene.add(this.pts);
    }
    spawn(x, y, z, vx, vy, vz, life, size, grow, g, r, gc, b) {
      const i = this.n < this.max ? this.n++ : (Math.random() * this.max) | 0, i3 = i * 3;
      this.pos[i3] = x; this.pos[i3 + 1] = y; this.pos[i3 + 2] = z; this.vel[i3] = vx; this.vel[i3 + 1] = vy; this.vel[i3 + 2] = vz;
      this.col[i3] = r; this.col[i3 + 1] = gc; this.col[i3 + 2] = b; this.life[i] = life; this.age[i] = 0; this.s0[i] = size; this.size[i] = size; this.grow[i] = grow; this.g[i] = g; this.alpha[i] = 1;
    }
    move(from, to) {
      const f3 = from * 3, t3 = to * 3;
      for (let k = 0; k < 3; k++) { this.pos[t3 + k] = this.pos[f3 + k]; this.vel[t3 + k] = this.vel[f3 + k]; this.col[t3 + k] = this.col[f3 + k]; }
      this.life[to] = this.life[from]; this.age[to] = this.age[from]; this.s0[to] = this.s0[from]; this.grow[to] = this.grow[from]; this.g[to] = this.g[from];
    }
    update(dt) {
      let n = this.n; if (!n && !this.was) return;
      const drag = Math.exp(-dt * (this.add ? 1.2 : 0.9));
      for (let i = 0; i < n;) {
        const a = (this.age[i] += dt), L = this.life[i];
        if (a >= L) { this.move(--n, i); continue; }
        const i3 = i * 3, u = a / L;
        this.vel[i3 + 1] += this.g[i] * dt; this.vel[i3] *= drag; this.vel[i3 + 1] *= drag; this.vel[i3 + 2] *= drag;
        this.pos[i3] += this.vel[i3] * dt; this.pos[i3 + 1] += this.vel[i3 + 1] * dt; this.pos[i3 + 2] += this.vel[i3 + 2] * dt;
        this.size[i] = this.s0[i] + this.grow[i] * a; this.alpha[i] = this.add ? 1 - u : Math.min(1, u * 8) * (1 - u) * 0.95;
        i++;
      }
      this.n = n; this.was = n > 0; this.pts.visible = n > 0;
      this.pts.geometry.setDrawRange(0, n);
      for (const at of this.attrs) { at.clearUpdateRanges(); at.addUpdateRange(0, n * at.itemSize); at.needsUpdate = true; }
    }
  }
  const FX = AF.fx = {};
  // kind: [pool (1 glow, 0 smoke), life, size, grow/s, gravity, r, g, b, spread speed]
  const KIND = {
    flash: [1, 0.07, 2.4, 0, 0, 6, 4.4, 2.2, 0], hit: [1, 0.12, 0.45, 0, 0, 3, 2.2, 1.3, 0], glow: [1, 0.06, 0.9, 0, 0, 3, 3, 3, 0],
    fire: [1, 0.75, 1.0, 1.4, 2.6, 3.2, 1.25, 0.3, 1.4], spark: [1, 0.45, 0.13, 0, -9, 4, 2.5, 0.9, 7],
    smoke: [0, 2.6, 0.9, 1.3, 1.1, 0.15, 0.14, 0.13, 0.7], steam: [0, 1.5, 0.5, 0.8, 1.4, 0.6, 0.6, 0.58, 0.4], dust: [0, 0.8, 0.3, 0.9, -0.4, 0.5, 0.45, 0.36, 1.3],
  };
  FX.burst = (kind, x, y, z, n = 1, o) => {
    const K = KIND[kind], P = K[0] ? FX.glow : FX.smoke; if (!P) return;
    const sp = o && o.spread != null ? o.spread : K[8], vx = (o && o.vx) || 0, vy = (o && o.vy) || 0, vz = (o && o.vz) || 0, c = o && o.col, k = (o && o.size) || 1;
    for (let i = 0; i < n; i++) {
      const life = K[1] * (0.7 + Math.random() * 0.6);
      P.spawn(x, y, z, vx + (Math.random() - 0.5) * sp, vy + Math.random() * sp * 0.6, vz + (Math.random() - 0.5) * sp, life, K[2] * k, K[3] * k, K[4], c ? c[0] : K[5], c ? c[1] : K[6], c ? c[2] : K[7]);
    }
  };
  FX.line = (x0, y0, z0, x1, y1, z1) => { const n = Math.min(14, 2 + Math.hypot(x1 - x0, y1 - y0, z1 - z0) / 2 | 0); for (let i = 1; i <= n; i++) { const u = i / n; FX.glow.spawn(x0 + (x1 - x0) * u, y0 + (y1 - y0) * u, z0 + (z1 - z0) * u, 0, 0, 0, 0.05, 0.09, 0, 0, 2.6, 2.1, 1.4); } };
  FX.boom = (x, y, z, k = 1) => {
    FX.burst('flash', x, y + 1, z, 3, { size: 7.5 * k }); FX.burst('fire', x, y + 0.8, z, 40 * k, { spread: 8.5 * k, size: 2.3 * k }); FX.burst('spark', x, y + 1, z, 36 * k, { spread: 16 });
    FX.burst('fire', x, y + 2.2, z, 14 * k, { spread: 4 * k, size: 3.2 * k });
    FX.burst('smoke', x, y + 1.5, z, 28 * k, { spread: 4, size: 2.9 * k }); SFX.play('boom', x, z); AF.shake(1.2 * k, x, z);
    if (AF.camfx && AF.camfx.shake) { const p = AF.camera.position, d = Math.hypot(x - p.x, z - p.z); if (d < 120) AF.camfx.shake(0.05 * k / (1 + d * 0.04), 0.7); }
  };
  // camera shake (explosions, crashes): applied after every camera owner, fades with distance
  const SHK = { a: 0 };
  AF.shake = (a, x, z) => { const p = AF.camera.position, d = x == null ? 0 : Math.hypot(x - p.x, z - p.z); SHK.a = Math.max(SHK.a, a / (1 + d * 0.06)); };

  // ---------------------------------------------------------------- AF.sfx: game sounds — recorded samples (75-audio), synthesised fallbacks
  // until a sample has loaded (or if assets/sfx is missing). Same context, same Sound setting.
  const AU = AF.audio;
  const SFX = AF.sfx = { get on() { return AU ? AU.on : true; } };
  let ac = null, noise = null, out = null, siren = null;
  const audio = () => {
    if (ac || !SFX.on) return ac;
    try {
      const b = AU && AU.bus('sfx'); if (!b) return null;
      ac = AU.ctx; out = ac.createGain(); out.gain.value = 0.36; out.connect(b);
      const n = ac.sampleRate; noise = ac.createBuffer(1, n, n); const d = noise.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    } catch (e) { ac = null; }
    return ac;
  };
  const env = (g, t, d, peak) => { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + d); };
  const hiss = (t, d, f0, f1, peak) => { const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(); s.buffer = noise; f.type = 'lowpass'; f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + d); env(g, t, d, peak); s.connect(f).connect(g).connect(out); s.start(t, Math.random() * 0.5); s.stop(t + d + 0.05); };
  const tone = (t, d, f0, f1, peak, type = 'sine') => { const o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + d); env(g, t, d, peak); o.connect(g).connect(out); o.start(t); o.stop(t + d + 0.05); };
  const PLAY = {
    shot: (t, k) => { hiss(t, 0.22, 4200, 300, 0.9 * k); tone(t, 0.09, 150, 55, 0.6 * k); },
    shotgun: (t, k) => { hiss(t, 0.42, 3200, 200, k); tone(t, 0.15, 120, 40, 0.8 * k); },
    rifle: (t, k) => { hiss(t, 0.3, 5200, 260, k); tone(t, 0.12, 180, 50, 0.7 * k); },
    punch: (t, k) => { hiss(t, 0.07, 900, 200, 0.7 * k); tone(t, 0.08, 110, 60, 0.6 * k); },
    swing: (t, k) => hiss(t, 0.12, 1800, 700, 0.16 * k),
    boom: (t, k) => { hiss(t, 1.6, 1400, 50, k); tone(t, 0.5, 70, 28, 0.9 * k); },
    crash: (t, k) => { hiss(t, 0.35, 2600, 300, 0.7 * k); tone(t, 0.15, 90, 40, 0.5 * k); },
    cash: (t) => { tone(t, 0.09, 1320, 1320, 0.16, 'square'); tone(t + 0.09, 0.16, 1760, 1760, 0.14, 'square'); },
    deny: (t) => tone(t, 0.16, 180, 140, 0.2, 'square'), hurt: (t) => tone(t, 0.18, 260, 120, 0.3, 'triangle'),
    ding: (t) => { tone(t, 0.9, 1568, 1560, 0.3); tone(t, 0.9, 2093, 2090, 0.14); }, click: (t) => tone(t, 0.04, 900, 880, 0.2, 'square'),
  };
  PLAY.smg = PLAY.shot;
  PLAY.sil = (t, k) => { hiss(t, 0.09, 2600, 500, 0.32 * k); tone(t, 0.05, 260, 110, 0.22 * k); };
  PLAY.lmg = (t, k) => { hiss(t, 0.26, 3800, 240, k); tone(t, 0.12, 130, 45, 0.8 * k); };
  // launcher: a hard thump and a long whoosh as the motor lights (no recording; synthesised every time)
  PLAY.rocket = (t, k) => { tone(t, 0.18, 95, 38, 0.9 * k); hiss(t, 0.12, 5200, 900, 0.8 * k); hiss(t + 0.05, 1.1, 900, 2600, 0.45 * k); };
  // synth kind -> recorded sample (75-audio); explosions far off use the muffled take
  const SAMPLE = { shot: 'rev', smg: 'smg', shotgun: 'shotgun', rifle: 'rifle', sil: 'sil', lmg: 'lmg', punch: 'punch', swing: 'swing', boom: 'boom', crash: 'crash', cash: 'cash', deny: 'ui_deny', ding: 'ui_ding', click: 'ui_click', hurt: 'grunt_m' };
  SFX.play = (kind, x, z) => {
    let id = SAMPLE[kind];
    if (id && AU && AU.ctxOk()) {
      if (id === 'boom' && x != null && Math.hypot(x - AF.camera.position.x, z - AF.camera.position.z) > 70) id = 'boom_far';
      if (id === 'grunt_m') { const L = AF.friends && AF.friends.current && AF.friends.current.look; if (L && L.female) id = 'grunt_f'; }
      if (AU.ready(id)) { AU.play(id, x != null ? { x, z } : undefined); return; }
      AU.need(id);
    }
    const c = audio(); if (!c || c.state !== 'running' || !PLAY[kind]) return;
    let k = 1; if (x != null) { const p = AF.camera.position; k = 1 / (1 + Math.hypot(x - p.x, z - p.z) * 0.045); if (k < 0.04) return; }
    PLAY[kind](c.currentTime, k);
  };
  // two-tone police siren while a squad car is near (77 calls it every tick); the recorded wail (75-audio) takes over once loaded
  SFX.siren = (k) => {
    const c = audio(); if (!c || c.state !== 'running') return;
    if (AU && AU.ready('siren_loop')) k = 0;
    if (k > 0.02 && !siren) { const o = c.createOscillator(), f = c.createBiquadFilter(), g = c.createGain(); o.type = 'sawtooth'; f.type = 'lowpass'; f.frequency.value = 1400; g.gain.value = 0; o.connect(f).connect(g).connect(out); o.start(); siren = { o, g, next: 0, hi: false }; }
    if (!siren) return;
    siren.g.gain.setTargetAtTime(k * 0.07, c.currentTime, 0.2);
    if (c.currentTime > siren.next) { siren.hi = !siren.hi; siren.o.frequency.setTargetAtTime(siren.hi ? 960 : 720, c.currentTime, 0.04); siren.next = c.currentTime + 0.55; }
    if (k <= 0.02 && siren.g.gain.value < 0.002) { siren.o.stop(); siren = null; }
  };
  SFX.set = (on) => { if (AU) AU.setOn(on); if (!on) siren = null; };

  // ---------------------------------------------------------------- build + ticks
  AF.onBuild('game-fx', 870, () => { FX.glow = new Pool(AF.MOBILE ? 256 : 512, true); FX.smoke = new Pool(AF.MOBILE ? 160 : 320, false); });
  // the pools draw nothing while empty: compile their programs behind the boot veil so the first shot never hitches
  AF.on('preloaded', () => { if (!FX.glow || !AF.stream.compileAhead) return; for (const P of [FX.glow, FX.smoke]) { P.pts.visible = true; AF.stream.compileAhead(P.pts).then(() => { P.pts.visible = P.n > 0; }); } });
  let hudT = 0, reapT = 0;
  const focus = () => (AF.mode !== 'aerial' && UI.map && UI.map.focus ? UI.map.focus() : AF.mode === 'drive' && AF.vehicles.player ? AF.vehicles.player : AF.player);
  AF.onTick('game', 960, (dt) => {
    if (saveT > 0 && (saveT -= dt) <= 0) AF.saveNow();
    // fx + camera shake (after every camera owner)
    if (FX.glow) {
      const R = AF.post && AF.post.enabled && AF.post.sceneRT ? AF.post.sceneRT.height : AF.renderer.domElement.height;
      SCALE.value = R / (2 * Math.tan(AF.camera.fov * PI / 360));
      FX.glow.update(dt); FX.smoke.update(dt);
    }
    if (SHK.a > 0.002) { const c = AF.camera.position, a = SHK.a * 0.35; c.x += (Math.random() - 0.5) * a; c.y += (Math.random() - 0.5) * a; c.z += (Math.random() - 0.5) * a; SHK.a *= Math.exp(-dt * 6); }
    // health regen (a little, after a while out of trouble)
    if (!H.dead && H.v < G.regenTo && AF.clock.t - H.last > G.regenDelay) H.v = Math.min(G.regenTo, H.v + G.regenRate * dt);
    if (hurtT > 0 && (hurtT -= dt) <= 0) hurtEl.style.opacity = '0';
    if (crossHitT > 0 && (crossHitT -= dt) <= 0) cross.classList.remove('hit');
    if (gainT > 0 && (gainT -= dt) <= 0) gainEl.className = 'gain';
    // the carnival meter
    if (MT.on) {
      MT.t += dt; MT.v += MT.dir * MT.speed * dt; if (MT.v > 1) { MT.v = 1; MT.dir = -1; } else if (MT.v < 0) { MT.v = 0; MT.dir = 1; }
      meterEl.querySelector('.n').style.left = (MT.v * 100).toFixed(1) + '%';
      const I = AF.input; if (I.hit('KeyE') || I.hit('KeyQ') || I.hit('Space') || (document.pointerLockElement && I.mouse.clicked)) meterStop();
    }
    // HUD panel at 6 Hz
    if ((hudT += dt) > 0.16) {
      hudT = 0;
      const hw = (H.v / H.max * 100).toFixed(0) + '%'; if (hpFill._w !== hw) { hpFill.style.width = hw; hpFill._w = hw; } hpBar.classList.toggle('low', H.v < 25);
      text(mEl, cash(S.money));
      const CB = AF.combat, n = CB ? CB.stars : 0, sh = '<b>' + '\u2605'.repeat(n) + '</b>' + '\u2605'.repeat(5 - n);
      if (starEl._h !== sh) { starEl.innerHTML = sh; starEl._h = sh; starEl.classList.toggle('none', !n); } starEl.classList.toggle('ev', !!(CB && n && CB.seenT > 1));
      // the job line (78-jobs, the gallery, the heist) is the objective line + timer bars (73-mission)
      const J = HUD.job, MI = AF.mission;
      if (MI) {
        MI.objective(J ? J.line : null, J ? J.title : null);
        MI.bar('job-t', J && J.t != null ? { label: 'Time', value: MI.time(J.t), hot: J.t < 10 } : null);
        MI.bar('job-pay', J && J.pay ? { label: 'Earned', value: cash(J.pay), ok: true } : null);
      }
    }
    // forget policy: runtime cars far from the player return to the pool
    if ((reapT += dt) >= 1) {
      reapT = 0;
      const VV = AF.vehicles, f = focus(), cars = VV.cars;
      for (let i = cars.length - 1; i >= 0; i--) {
        const c = cars[i]; if (!c.temp || c.player || c.ai || c.keep || c.net != null) continue;
        const far = (c.x - f.x) ** 2 + (c.z - f.z) ** 2 > G.forgetD * G.forgetD;
        c.away = far ? (c.away || 0) + 1 : 0;
        if (c.away >= G.forgetS || (c.dead && AF.clock.t - c.deadT > G.wreckS && far)) VV.forget(c);
      }
    }
    if ((staleT += dt) >= G.staleEvery) { staleT = 0; FG.sweep(); }
  });

  // ---------------------------------------------------------------- AF.forget: the stale sweep (PERF.md §8.9)
  // Everything a player touches carries touchT = AF.clock.t of the last interaction (driven, ridden, hit, pushed, moved off its
  // spot). G.staleS after it, if nobody uses it and the camera is more than G.staleNearD from both where it is and where it belongs,
  // it goes home or is dropped: a kerb car back to its kerb (VV.forget), a boot car to its spot, a plane to its stand
  // (AF.planes.reset), a jet ski to its dock, a rowing boat to its jetty; wrecks, cars taken out of traffic and cars made for a
  // remote driver are dropped. Only what this client owns: never anything with .net (a remote player has it), .keep or .mission;
  // while a heist runs (AF.noTravel) only wrecks. Every G.staleEvery s, index loops over a few hundred entries, nothing allocated
  // (a boot car's home pose is recorded once). AF.forget.touch(obj) stamps an interaction; register(name, kind) adds a system.
  let staleT = 0, rideWas = null;
  const FG = AF.forget = { kinds: [], swept: 0 };
  FG.touch = (o) => { if (o) o.touchT = AF.clock.t; return o; };
  // kind: { list() -> array | null, busy(o) -> in use right now, away(o) -> off its home spot / runtime, home(o) -> {x, z} | null,
  //         reset(o) -> true once it is home or gone }
  FG.register = (name, kind) => { kind.name = name; FG.kinds.push(kind); return kind; };
  const ride = () => { const VV = AF.vehicles, C = AF.coop; return (VV && VV.player) || (AF.planes && AF.planes.cur) || (AF.island && AF.island.jetski && AF.island.jetski.cur) || (AF.east && AF.east.cur) || (C && C.ride && C.ride.veh) || null; };
  // getting in or out of anything stamps it, to the second
  AF.on('mode', () => { const now = AF.clock.t; if (rideWas) rideWas.touchT = now; rideWas = ride(); if (rideWas) rideWas.touchT = now; });
  const near = (x, z, cx, cz) => (x - cx) * (x - cx) + (z - cz) * (z - cz) < G.staleNearD * G.staleNearD;
  FG.sweep = (force, only) => {
    const now = AF.clock.t, cam = AF.camera.position, cx = cam.x, cz = cam.z, cur = ride(), heist = !!(AF.noTravel && AF.noTravel());
    let n = 0;
    for (let k = 0; k < FG.kinds.length; k++) {
      const K = FG.kinds[k], L = K.list(); if (!L) continue;
      for (let i = L.length - 1; i >= 0; i--) {
        const o = L[i]; if (!o || o.active === false || (only && o !== only)) continue;
        if (o === cur || o.keep || o.mission || o.net != null || K.busy(o)) { o.touchT = now; continue; }
        if (!K.away(o)) { o.touchT = 0; continue; }
        if (!o.touchT) { o.touchT = now; continue; }
        if (!force && now - o.touchT < G.staleS) continue;
        if (heist && !o.dead) continue;
        if (near(o.x, o.z, cx, cz)) continue;
        const h = K.home(o); if (h && near(h.x, h.z, cx, cz)) continue;
        if (K.reset(o)) { o.touchT = 0; n++; }
      }
    }
    FG.swept += n; return n;
  };
  const CARS = FG.register('cars', {
    list: () => AF.vehicles && AF.vehicles.cars,
    busy: (c) => {
      if (c.player || c.ai) return !!c.player;
      const CB = AF.combat;
      if (c.squad && CB && CB.stars > 0) return true;
      if (c.pushLife > 0 || c.burnT > 0) return true;
      if (c.hp !== c.hpSeen) { c.hpSeen = c.hp; return c.touchT > 0 || c.moved || c.temp; }   // shot / rammed: a touch
      return false;
    },
    away: (c) => {
      if (c.ai) return false;
      if (!c.base && !c.temp && !c.moved && !c.dead) c.base = { x: c.x, y: c.y, z: c.z, yaw: c.yaw };   // a boot car's spot, once
      return !!(c.temp || c.dead || c.moved);
    },
    home: (c) => (!c.dead && (c.temp ? c.home : c.base)) || null,
    reset: (c) => {
      const VV = AF.vehicles, b = c.base, spot = c.dead ? null : c.temp ? c.home : b;
      // its spot taken (a car parked or passing there): try again next sweep rather than lose the kerb space
      if (spot) for (let i = 0; i < VV.cars.length; i++) { const o = VV.cars[i]; if (o !== c && o.active !== false && Math.abs(o.x - spot.x) < 4 && Math.abs(o.z - spot.z) < 4) return false; }
      // kerb cars go back to their kerb; wrecks, cars out of traffic, cars made for a remote driver are dropped
      if (c.temp || c.dead || !b) { VV.forget(c); return true; }
      c.x = b.x; c.y = b.y; c.z = b.z; c.yaw = b.yaw; c.v = c.vx = c.vz = 0; c.steer = c.pitch = c.roll = 0;
      c.pushLife = c.pushX = c.pushZ = c.pushSpin = 0; c.moved = false; c.parked = true;
      if (c.hp != null) { c.hp = c.hpSeen = G.vehHp; c.dmg = 0; c.smokeT = 0; }
      VV.placeMesh(c); if (c.interact) c.sync();
      return true;
    },
  });
  FG.register('planes', {
    list: () => AF.planes && AF.planes.list,
    busy: (p) => p === AF.planes.cur || !!p.ghost,
    away: (p) => !!p.home && (Math.abs(p.x - p.home.x) > 3 || Math.abs(p.z - p.home.z) > 3 || Math.abs(AF.angDiff(p.yaw, p.home.yaw)) > 0.2),
    home: (p) => p.home,
    reset: (p) => { AF.planes.reset(p); return true; },
  });
  FG.register('jetskis', {
    list: () => AF.island && AF.island.jetski && AF.island.jetski.skis,
    busy: (k) => Math.abs(k.v) > 0.05,
    away: (k) => !!k.home && Math.hypot(k.x - k.home.x, k.z - k.home.z) > 4,
    home: (k) => k.home,
    reset: (k) => {
      const d = k.home; k.x = d.x; k.z = d.z; k.yaw = d.yaw; k.v = k.w = 0; k.pitch = k.roll = 0; k.vy = k.air = k.land = 0;
      if (k.wake) { k.wake.position.x = d.x; k.wake.position.z = d.z; k.wake.rotation.y = d.yaw; k.wake.updateMatrixWorld(); }
      k.sync(); return true;
    },
  });
  FG.register('rowboats', {
    list: () => AF.east && AF.east.boats,
    busy: (b) => Math.abs(b.v) > 0.05,
    away: (b) => !!b.home && (Math.hypot(b.x - b.home.x, b.z - b.home.z) > 2 || Math.abs(AF.angDiff(b.yaw, b.home.yaw)) > 0.3),
    home: (b) => b.home,
    reset: (b) => { const h = b.home; b.x = h.x; b.z = h.z; b.yaw = h.yaw; b.v = b.w = 0; if (b.it) { b.it.x = h.x; b.it.z = h.z; } return true; },
  });
  // boot cars: their spots, recorded before anyone can move them
  AF.on('ready', () => { const L = CARS.list(); if (L) for (let i = 0; i < L.length; i++) CARS.away(L[i]); });
  AF.test('game: the stale sweep sends a touched, idle plane home (never in view of the camera)', () => {
    const pl = AF.planes && AF.planes.list[0]; if (!pl) return { ok: true, info: 'no planes' };
    const cam = AF.camera.position, cx = cam.x, cy = cam.y, cz = cam.z;
    pl.x = pl.home.x + 60; pl.z = pl.home.z + 20; pl.touchT = 1e-3;
    cam.set(pl.x + 5, cy, pl.z); FG.sweep(true, pl); const stayed = Math.abs(pl.x - pl.home.x) > 3;
    cam.set(pl.home.x + 400, cy, pl.home.z + 400); FG.sweep(true, pl); const home = Math.abs(pl.x - pl.home.x) < 0.01 && Math.abs(pl.z - pl.home.z) < 0.01;
    cam.set(cx, cy, cz); if (!home) AF.planes.reset(pl);
    return { ok: stayed && home, info: `kept in view ${stayed}, home when out of view ${home}` };
  });

  AF.test('game: money, shop spend and the save round-trip', () => {
    const m0 = S.money; AF.money.add(50); const up = S.money === m0 + 50;
    const ok = AF.money.spend(20, 'test') && S.money === m0 + 30; const no = !AF.money.spend(1e9, 'test');
    AF.saveNow(); const back = JSON.parse(localStorage.getItem(KEY) || '{}').money === S.money;
    S.money = m0; AF.saveNow();
    return { ok: up && ok && no && back, info: `add ${up}, spend ${ok}, refuse ${no}, saved ${back}` };
  });
  AF.test('game: health hurts, regenerates a little, and fx pools empty out', () => {
    const was = AF.mode, title = UI.state.title; UI.state.title = false; if (AF.mode !== 'walk') AF.setMode('walk', {});
    H.v = H.max; H.hurt(30, 'test'); const hurt = H.v === H.max - 30; H.last = -99;
    H.v = 10; const hook = AF.hooks.tick.find((x) => x.name === 'game'); hook.fn(1); const regen = H.v > 10 && H.v <= G.regenTo;
    H.v = H.max; FX.burst('smoke', 0, 1, 0, 10); FX.burst('fire', 0, 1, 0, 10); for (let i = 0; i < 40; i++) { FX.glow.update(0.1); FX.smoke.update(0.1); }
    const empty = FX.glow.n === 0 && FX.smoke.n === 0;
    if (was && was !== 'walk') AF.setMode(was);
    UI.state.title = title;
    return { ok: hurt && regen && empty, info: `hurt ${hurt}, regen ${regen}, fx empty ${empty}` };
  });
}
} catch (e) { AF.partError('76-game.js', e); }
