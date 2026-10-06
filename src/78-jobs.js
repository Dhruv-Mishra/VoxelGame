// ================================================================ 78-jobs.js
try {
// ===== 78-jobs: earning + spending  (OWNER: game) =====
// Jobs (J / JOB button): the vehicle decides — cab: taxi fares, bus: a stop-to-stop route, van: deliveries, fire engine: fire calls,
//   on foot or a bike: courier parcels. class Job owns the loop (marker, timer, arrival hold, pay with an early bonus); each job only
//   plans its next stop. One marker (a glowing post + gem, 2 draws) shows the target; the minimap draws it too.
// Counters (one AF.shop sheet each): food heals (city grocers / diners / boardwalk kiosks / wayside markets), gun counters (pawn +
//   hardware), outfitters (tailors / hatters) + the wardrobe at home, Body Works + fuel stations (drive in: repair, respray — a
//   respray out of police sight clears the wanted level), the Motor Exchange (sells cars, one per G.price.sellCooldown s).
// Carnival: high striker, Skee-Ball, claw, love tester, fortunes, shooting gallery (the ducks), carousel ride, photo booth.
// Westgate: a boarding pass from check-in is needed to pass security and to take a plane up.
{
  const PI = Math.PI, G = AF.G, S = AF.save, VV = AF.vehicles, I = AF.input, FX = AF.fx, SFX = AF.sfx, HUD = AF.hud, L = AF.land;
  const cash = AF.cash, toast = (t) => AF.emit('toast', t);
  const J = AF.jobs = { cur: null, ticket: false, shops: [], zones: [] };
  const focus = () => AF.mode === 'drive' && VV.player ? VV.player : AF.player;
  const speedNow = () => AF.mode === 'drive' && VV.player ? Math.abs(VV.player.v) : (AF.PL.walk.speed || 0);

  // ---------------------------------------------------------------- the target marker (glowing post + spinning gem; parked far below when unused)
  const MK = { post: null, gem: null, x: 0, y: -999, z: 0 };
  J.mark = (x, y, z) => { MK.x = x; MK.y = y; MK.z = z; MK.post.position.set(x, y, z); MK.post.visible = y > -900; if (AF.ui.map) AF.ui.map.revision++; };
  J.unmark = () => J.mark(0, -999, 0);
  AF.onBuild('jobs-marker', 880, () => {
    const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(3.2, 2.3, 0.5), fog: false });
    const pg = new THREE.BoxGeometry(0.16, 22, 0.16); pg.translate(0, 11, 0);
    MK.post = new THREE.Mesh(pg, mat); MK.gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.6, 0), mat);
    MK.post.add(MK.gem); MK.gem.position.y = 3; MK.post.name = 'job-marker';
    for (const m of [MK.post, MK.gem]) { m.castShadow = false; m.frustumCulled = false; }
    AF.scene.add(MK.post); J.unmark();
  });
  AF.on('preloaded', () => { MK.post.visible = true; AF.stream.compileAhead(MK.post).then(() => { MK.post.visible = MK.y > -900; }); });

  // ---------------------------------------------------------------- places: city doors near a road, kerb points beside them
  let DOORS = null;
  const doors = () => DOORS || (DOORS = AF.buildings.flatMap((b) => (b.name && b.label !== false && b.doors && b.doors.length && b.doors[0].y < 2 && b.box[0] > -660 && b.box[3] < 300) ? [{ x: b.doors[0].x, z: b.doors[0].z, name: b.name }] : []));
  const kerb = (x, z) => {
    const nr = AF.PLAN.nearestRoad(x, z), r = nr.road; if (!r || nr.edge > 14) return null;
    const cx = r.a[0] + (r.b[0] - r.a[0]) * nr.t, cz = r.a[1] + (r.b[1] - r.a[1]) * nr.t; let nx = x - cx, nz = z - cz; const l = Math.hypot(nx, nz) || 1; nx /= l; nz /= l;
    const o = r.w / 2 - 1.8; return { x: cx + nx * o, z: cz + nz * o, y: AF.W.groundY(cx + nx * o, cz + nz * o) };
  };
  const pickDoor = (x, z, dMin, dMax, road) => {
    const D = doors();
    for (let i = 0; i < 40; i++) {
      const d = D[(Math.random() * D.length) | 0], dist = Math.hypot(d.x - x, d.z - z); if (dist < dMin || dist > dMax) continue;
      const k = road ? kerb(d.x, d.z) : { x: d.x, z: d.z, y: AF.surfaceBelow(d.x, d.z, 3, 6) }; if (!k) continue;
      return Object.assign(k, { name: d.name, door: d, dist });
    }
    return null;
  };
  const WK = () => AF.rail && AF.rail.walkers;
  const walkTo = (x, z, tx, tz, keep) => { const W = WK(); if (!W || !W.spawn) return null; return W.spawn(x, z, Math.atan2(tx - x, tz - z), { path: [tx, tz], onEnd: keep ? null : W.off, v: 1.5 }); };

  // ---------------------------------------------------------------- jobs
  class Job {
    constructor(title, need) { this.title = title; this.need = need; this.earned = 0; this.legs = 0; this.stop = null; }
    valid() { return true; }
    start() { this.stop = this.plan(); if (!this.stop) return false; this.begin(); return true; }
    begin() { const s = this.stop; s.hold = 0; s.t0 = s.t; J.mark(s.x, s.y ?? AF.W.groundY(s.x, s.z), s.z); toast(s.label); }
    update(dt) {
      const s = this.stop, f = focus();
      if (!this.valid()) return this.end(`Job over \u2014 you left the ${this.need}.`);
      if (s.t != null && (s.t -= dt) <= 0) return this.end(s.late || 'Too slow \u2014 they gave up on you.');
      const d = Math.hypot(s.x - f.x, s.z - f.z);
      if (d < (s.r || 5) && speedNow() < 2.5) { if ((s.hold += dt) >= (s.wait || 0)) this.arrive(s); } else s.hold = 0;
      if (this.tick) this.tick(dt, s);
      HUD.job = { title: this.title, line: (s.short || s.label) + ' \u00b7 ' + Math.round(d) + ' m', t: s.t, pay: this.earned || null };
    }
    arrive(s) {
      if (s.pay) { const p = Math.round(s.pay * (s.t0 ? 1 + G.pay.early * AF.clamp(s.t / s.t0, 0, 1) : 1)); AF.money.add(p); this.earned += p; }
      if (s.done) s.done(); SFX.play('ding'); this.legs++;
      this.stop = this.plan(); if (this.stop) this.begin(); else this.end(this.finish || 'Shift complete!');
    }
    end(msg) { if (J.cur !== this) return; J.cur = null; J.unmark(); HUD.job = null; if (this.cleanup) this.cleanup(); toast(msg + (this.earned ? ' You earned ' + cash(this.earned) + '.' : '')); }
  }
  class Taxi extends Job {
    constructor() { super('Taxi', 'cab'); this.leg = 0; }
    valid() { const c = VV.player; return AF.mode === 'drive' && !!c && !!c.type.cab; }
    plan() {
      const c = VV.player, pick = !this.leg;
      const D = pickDoor(c.x, c.z, pick ? 50 : 160, pick ? 260 : 650, true); if (!D) return null;
      this.leg ^= 1;
      if (pick) {
        const W = WK(); this.fare = W && W.spawn ? W.spawn(D.door.x, D.door.z, Math.atan2(D.x - D.door.x, D.z - D.door.z), {}) : null;
        if (this.fare) W.go(this.fare, [D.x + (D.door.x - D.x) * 0.25, D.z + (D.door.z - D.z) * 0.25], 1.3, null);
        return { x: D.x, z: D.z, r: 5.5, wait: 1.2, short: 'Pick up \u00b7 ' + D.name, label: 'A fare is waiting outside ' + D.name + '.', t: 50 + D.dist / 6,
          done: () => { const f = this.fare, W = WK(); if (f && W) W.go(f, [c.x, c.z], 1.6, W.off); this.fare = null; this.from = { x: D.x, z: D.z }; } };
      }
      const dist = Math.hypot(D.x - this.from.x, D.z - this.from.z);
      return { x: D.x, z: D.z, r: 5.5, wait: 1.2, short: 'Drop off \u00b7 ' + D.name, label: '\u201c' + D.name + ', and step on it!\u201d', t: 25 + dist / 6.5, pay: G.pay.taxiBase + dist * G.pay.taxiPerM,
        late: 'The fare stormed out without paying.', done: () => walkTo(c.x, c.z, D.door.x, D.door.z) };
    }
    cleanup() { const W = WK(); if (this.fare && W) W.off(this.fare); }
  }
  class Bus extends Job {
    constructor() { super('Bus route', 'bus'); this.seen = new Set(); }
    valid() { const c = VV.player; return AF.mode === 'drive' && !!c && c.type.id === 'bus'; }
    plan() {
      if (this.legs >= 6) return null;
      const c = VV.player, hx = Math.sin(c.yaw), hz = Math.cos(c.yaw); let best = null, bs = 1e9;
      for (const b of AF.busStops || []) {
        if (this.seen.has(b)) continue; const dx = b.x - c.x, dz = b.z - c.z, d = Math.hypot(dx, dz); if (d < 40) continue;
        const score = d - (dx * hx + dz * hz) * 0.5; if (score < bs) { bs = score; best = b; }
      }
      if (!best) return null; this.seen.add(best); const d = Math.hypot(best.x - c.x, best.z - c.z);
      return { x: best.x, z: best.z, r: 7, wait: 2.5, short: 'Bus stop \u00b7 ' + (best.road || ''), label: 'Next stop: ' + (best.road || 'the next shelter') + '.', t: 25 + d / 6, pay: G.pay.busStop,
        done: () => { for (let i = 0; i < 2; i++) walkTo(best.x + (Math.random() - 0.5) * 3, best.z + (Math.random() - 0.5) * 3, c.x, c.z); } };
    }
  }
  class Delivery extends Job {
    constructor() { super('Deliveries', 'van'); }
    valid() { const c = VV.player; return AF.mode === 'drive' && !!c && c.type.kind === 'van'; }
    plan() {
      if (this.legs >= 3) return null;
      const c = VV.player, D = pickDoor(c.x, c.z, 120, 450, true); if (!D) return null;
      return { x: D.x, z: D.z, r: 5.5, wait: 1.5, short: 'Deliver \u00b7 ' + D.name, label: 'Crates for ' + D.name + ' (' + (3 - this.legs) + ' to go).', t: 25 + D.dist / 6.5, pay: G.pay.deliver + D.dist * G.pay.deliverPerM,
        done: () => walkTo(c.x, c.z, D.door.x, D.door.z) };
    }
  }
  class Fire extends Job {
    constructor() { super('Fire call', 'fire engine'); }
    valid() { const c = VV.player; return AF.mode === 'drive' && !!c && c.type.id === 'firetruck'; }
    plan() {
      if (this.legs >= 2) return null;
      const c = VV.player, D = pickDoor(c.x, c.z, 150, 500, true); if (!D) return null;
      this.blaze = { x: D.door.x, z: D.door.z, y: AF.W.groundY(D.door.x, D.door.z) + 3, t: 0 };
      return { x: D.x, z: D.z, r: 9, wait: 5, short: 'Fire \u00b7 ' + D.name, label: 'Fire reported at ' + D.name + '! Get there and hold position to hose it down.', t: 30 + D.dist / 8, pay: G.pay.fire, late: 'The fire brigade from Eastport got there first.',
        done: () => { this.blaze = null; } };
    }
    tick(dt, s) {
      const B = this.blaze; if (!B || (B.t -= dt) > 0) return; B.t = 0.12;
      FX.burst('fire', B.x, B.y, B.z, s.hold > 0 ? 1 : 2, { spread: 2 }); FX.burst(s.hold > 0 ? 'steam' : 'smoke', B.x, B.y + 1.5, B.z, 1, { size: 1.5 });
    }
    cleanup() { this.blaze = null; }
  }
  class Courier extends Job {
    constructor() { super('Courier', 'bike'); }
    valid() { return AF.mode === 'walk' || (AF.mode === 'drive' && !!VV.player && VV.player.type.kind === 'bike'); }
    plan() {
      if (this.legs >= 3) return null;
      const f = focus(), D = pickDoor(f.x, f.z, 70, 230, false); if (!D) return null;
      return { x: D.x, z: D.z, y: D.y, r: 2.6, wait: 0.4, short: 'Parcel \u00b7 ' + D.name, label: 'Parcel for ' + D.name + ' \u2014 run!', t: 18 + D.dist / 4.5, pay: G.pay.courier + D.dist * G.pay.courierPerM };
    }
  }
  J.toggle = () => {
    if (J.cur) { J.cur.end('You clock off.'); return; }
    const c = AF.mode === 'drive' && VV.player, T = c && c.type;
    const job = !c ? (AF.mode === 'walk' ? new Courier() : null) : T.cab ? new Taxi() : T.id === 'bus' ? new Bus() : T.kind === 'van' ? new Delivery() : T.id === 'firetruck' ? new Fire() : T.kind === 'bike' ? new Courier() : null;
    if (!job) { toast('No work in this one. Try a taxi, a bus, a delivery van, the fire engine \u2014 or J on foot for courier runs.'); return; }
    J.cur = job; if (!job.start()) { J.cur = null; toast('No work around here right now.'); }
  };

  // ---------------------------------------------------------------- counters
  const sheet = (title, sub, items, tabs) => AF.shop.open({ title, sub, tabs, items });
  const counter = (x, y, z, label, open, o = {}) => { const it = AF.addInteract({ x, y: y + 1, z, r: o.r || 2.6, label, prio: o.prio ?? 0.4, can: () => AF.mode === 'walk' && (!o.can || o.can()), act: open }); J.shops.push({ x, z, kind: o.kind || 'shop', it }); return it; };
  // food: heals; the kiosks + wayside markets sell a few things, a grocer or diner the whole menu
  const FOOD = [['Apple', 2, 8], ['Coffee & doughnut', 4, 15], ['Sandwich', 6, 28], ['Blue-plate dinner', 12, 60], ['First-aid tin', 30, 100]];
  const eat = (name, price, heal) => ({ name, desc: '+' + heal + ' health', price, off: AF.health.v >= AF.health.max, act: () => AF.shop.buy(price, name, () => { AF.health.heal(heal); toast('Mm \u2014 ' + name.toLowerCase() + '. +' + heal + ' health.'); }) });
  const foodShop = (title, menu) => () => sheet(title, 'Food & first aid', () => menu.map((f) => eat(...f)));
  // guns
  const gunShop = (title) => () => sheet(title, 'Firearms & ammunition \u2014 keep it legal, friend', (tab) => {
    const GN = AF.GUNS; return Object.keys(GN).map((id) => {
      const g = GN[id];
      if (!tab) return { name: g.name, desc: S.guns[id] ? 'Owned' : g.mag + '-round, ' + (g.auto ? 'automatic' : g.pellets > 1 ? 'buckshot' : 'single shot') + ' \u00b7 includes ' + g.pack + ' rounds', price: g.price, tag: S.guns[id] ? 'Owned' : null, off: !!S.guns[id], act: () => AF.shop.buy(g.price, g.name, () => { AF.combat.give(id); toast('The ' + g.name + ' is yours. Wheel or 1\u20135 to draw it.'); }) };
      return { name: g.name + ' ammo \u00d7' + g.pack, desc: S.guns[id] ? (S.ammo[id] || 0) + ' spare' : 'Buy the gun first', price: g.packPrice, off: !S.guns[id], act: () => AF.shop.buy(g.packPrice, 'ammo', () => { S.ammo[id] = (S.ammo[id] || 0) + g.pack; }) };
    });
  }, ['Firearms', 'Ammunition']);
  // clothes: styles are bought at an outfitter (AF.save.wear) and worn free at the home wardrobe; colours are always free
  const WEAR = {
    top: [['tee', 'Tee', 25], ['hoodie', 'Hoodie', 60], ['shirt', 'Shirt', 45], ['cardigan', 'Cardigan', 55], ['vest', 'Vest', 35], ['dress', 'Dress', 80]],
    bottom: [['jeans', 'Jeans', 40], ['joggers', 'Joggers', 35], ['shorts', 'Shorts', 25], ['skirt', 'Skirt', 40]],
    hat: [['none', 'No hat', 0], ['cap', 'Ball cap', 20], ['straw', 'Straw hat', 30]],
    extra: [['none', 'No extras', 0], ['chain', 'Gold chain', 250], ['headphones', 'Headphones', 120], ['bow', 'Hair bow', 15]],
    glasses: [['none', 'No glasses', 0], ['on', 'Spectacles', 45]],
  };
  const COLS = [0x1d1d20, 0xf2f2f2, 0xc8322a, 0x2f5a9a, 0x2f7a4a, 0xf2c24a, 0xff5fae, 0xb68ae0, 0x8a5a36, 0x4a4e56, 0x3aa0ff, 0xf7931a];
  const hex = (n) => '#' + n.toString(16).padStart(6, '0');
  const base = () => AF.friends.current.look;
  const myLook = () => S.looks[AF.friends.current.id] || base();
  const cur = (slot, L) => slot === 'top' ? L.top.style : slot === 'bottom' ? L.bottom.style : slot === 'glasses' ? (L.glasses != null ? 'on' : 'none') : L[slot] || 'none';
  const owns = (slot, id) => id === 'none' || S.wear.includes(slot + ':' + id) || cur(slot, base()) === id;
  const wear = (fn) => { const L = JSON.parse(JSON.stringify(myLook())); fn(L); S.looks[AF.friends.current.id] = L; AF.player.setLook(L); AF.saveSoon(); };
  const putOn = (slot, id) => wear((L) => {
    if (slot === 'top') L.top.style = id; else if (slot === 'bottom') L.bottom.style = id;
    else if (slot === 'glasses') { if (id === 'on') L.glasses = base().glasses ?? 0x2a2a2e; else delete L.glasses; }
    else if (id === 'none') delete L[slot]; else { L[slot] = id; if (slot === 'hat' && L.hatCol == null) L.hatCol = 0x2d4270; }
  });
  const TABS = [['top', 'Tops'], ['bottom', 'Bottoms'], ['hat', 'Hats'], ['extra', 'Extras'], ['glasses', 'Glasses']];
  const outfitter = (title) => () => sheet(title, 'New styles \u2014 wear them any time at your wardrobe', (tab) => {
    const slot = TABS[tab][0], L = myLook();
    return WEAR[slot].filter(([id]) => id !== 'none').map(([id, name, price]) => {
      const have = owns(slot, id), on = cur(slot, L) === id;
      return { name, desc: on ? 'Wearing' : have ? 'Owned \u2014 tap to wear' : 'Buy and wear', price, tag: on ? 'Wearing' : have ? 'Owned' : null,
        act: () => { if (have) putOn(slot, id); else AF.shop.buy(price, name, () => { S.wear.push(slot + ':' + id); putOn(slot, id); }); } };
    });
  }, TABS.map((t) => t[1]));
  const PAINT = [['top', 'Top'], ['top2', 'Top trim'], ['bottom', 'Bottoms'], ['hatCol', 'Hat'], ['shoe', 'Shoes']];
  const wardrobe = () => sheet('Wardrobe', 'Your clothes \u2014 colours are free', (tab) => {
    const L = myLook();
    if (tab === TABS.length) return PAINT.flatMap(([k, name]) => COLS.map((col, i) => ({ name: i ? '' : name, sw: hex(col), tag: ' ', act: () => wear((Q) => { if (k === 'top') Q.top.col = col; else if (k === 'top2') { Q.top.col2 = col; if (Q.top.print != null) Q.top.print = col; } else if (k === 'bottom') Q.bottom.col = col; else Q[k] = col; }) })));
    const slot = TABS[tab][0];
    return WEAR[slot].map(([id, name]) => { const on = cur(slot, L) === id, have = owns(slot, id); return { name, desc: have ? '' : 'Buy it at an outfitter', tag: on ? 'Wearing' : have ? 'Wear' : 'Locked', off: !have || on, act: () => putOn(slot, id) }; })
      .concat(tab === 0 ? [{ name: 'Original outfit', desc: 'Back to your usual look', tag: 'Reset', act: () => { delete S.looks[AF.friends.current.id]; AF.player.setLook(base()); AF.saveSoon(); } }] : []);
  }, TABS.map((t) => t[1]).concat('Colours'));
  AF.on('friend', (c) => { const L = S.looks[c.id]; if (L) AF.player.setLook(L); });

  // ---------------------------------------------------------------- garages: Body Works (+ fuel stations) and the Motor Exchange
  const VALUE = (T) => T.lux ? 4200 : T.cab ? 1100 : T.kind === 'van' ? 1600 : T.kind === 'bike' ? 800 : T.kind === 'car' && T.id !== 'police' ? 1400 : 0;
  let soldT = -1e9;
  const bodyWorks = (name) => (car) => sheet(name, car.name + ' \u00b7 condition ' + Math.round(Math.max(0, car.hp ?? G.vehHp)) + '%', () => {
    const hp = car.hp ?? G.vehHp, fix = Math.round(G.price.repairBase + (G.vehHp - hp) * G.price.repairK), paints = car.type.paints.length;
    return [
      { name: 'Repair', desc: hp >= G.vehHp ? 'Running like new' : 'Panels, glass and engine', price: fix, off: hp >= G.vehHp, act: () => AF.shop.buy(fix, 'the repair', () => { car.hp = G.vehHp; car.dmg = 0; AF.emit('toast', 'Good as new.'); }) },
      { name: paints > 1 ? 'Respray' : 'Respray (factory colour)', desc: AF.combat.stars ? 'A new look loses the police \u2014 if none of them is watching' : 'Fresh paint', price: G.price.repaint, act: () => AF.shop.buy(G.price.repaint, 'a respray', () => {
        const T = car.type, pi = ((+String(car.key).split(':')[1] || 0) + 1) % T.paints.length; car.key = VV.getGeo(T, pi).key; car.hp = Math.max(car.hp ?? G.vehHp, G.vehHp * 0.6); car.dmg = AF.clamp(1 - car.hp / G.vehHp, 0, 1) * 0.8;
        if (AF.combat.stars && AF.combat.seenT > 0.5) AF.combat.clearWanted('Fresh paint \u2014 the police are looking for a different car now.'); else if (AF.combat.stars) toast('The police watched you drive in. That won\u2019t fool them.');
      }) },
    ];
  });
  const exchange = (car) => sheet('Solace Motor Exchange', 'Cash for cars \u2014 one deal every few minutes', () => {
    const v = VALUE(car.type), hp = Math.max(0, car.hp ?? G.vehHp), offer = Math.round(v * G.price.sellK * (0.35 + 0.65 * hp / G.vehHp) / 10) * 10, wait = soldT + G.price.sellCooldown - AF.clock.t;
    const why = car.owner ? 'That\u2019s ' + (AF.friends.byId[car.owner] || {}).name + '\u2019s car!' : !v ? 'We don\u2019t touch those.' : wait > 0 ? 'Lot\u2019s full \u2014 come back in ' + Math.ceil(wait / 60) + ' min' : 'Cash on the spot';
    return [{ name: 'Sell the ' + car.name, desc: why, tag: car.owner || !v || wait > 0 ? 'No deal' : '+' + cash(offer), off: !!car.owner || !v || wait > 0,
      act: () => { soldT = AF.clock.t; AF.shop.close(); VV.exitCar(); VV.removeCar(car); AF.money.add(offer); toast('Sold! The ' + car.name + ' went for ' + cash(offer) + '.'); } }];
  });
  // a drive-in zone: open the sheet when the player car stops inside, once per visit
  const zone = (x, z, y, name, open, kind) => { const Z = { x, z, y, name, open, kind, inside: false }; J.zones.push(Z); return Z; };
  const sign = (x, y, z, yaw, txt, col) => {
    const tm = AF.textModel(txt, col, { font: 'deco', depth: 1, pad: 1, bg: AF.col(0x1d2b3e, { jitter: 0.1 }) });
    const g = AF.meshModel(tm, { vs: Math.min(1 / 12, 3.2 / Math.max(1, tm.w)), anchor: [0.5, 0, 0.5] });
    AF.placeStatic(g, x, y, z, Math.round(((yaw / (PI / 2)) % 4 + 4) % 4), { collide: false });
  };
  AF.onBuild('jobs-garages', 485, () => {
    const W = AF.W, iron = AF.col(0x2a2c30, { metal: 0.6 }), bulb = AF.col(0xfff2c0, { emit: 0xffd070, emitK: 2.4, mode: 'night' });
    // a kerb space (freed from a parked car) near each anchor: Body Works x2, the Motor Exchange
    for (const [ax, az, name, kind, col] of [[96, -60, 'BODY WORKS', 'paint', 0xf2c24a], [-210, -96, 'BODY WORKS', 'paint', 0xf2c24a], [-60, 60, 'MOTOR EXCHANGE', 'sell', 0x7cd6a8]]) {
      let best = null, bd = 1e9;
      for (const s of VV.parkedStatic) { if (s.outland || s.noDrive) continue; const d = (s.x - ax) ** 2 + (s.z - az) ** 2; if (d < bd) { bd = d; best = s; } }
      if (!best) continue;
      AF.removeStatic(best.pr); VV.parkedStatic.splice(VV.parkedStatic.indexOf(best), 1);
      const s = Math.sin(best.yaw), c = Math.cos(best.yaw), nr = AF.PLAN.nearestRoad(best.x, best.z), R = nr.road;
      const rx = R ? R.a[0] + (R.b[0] - R.a[0]) * nr.t : best.x, rz = R ? R.a[1] + (R.b[1] - R.a[1]) * nr.t : best.z, ox = best.x - rx, oz = best.z - rz, ol = Math.hypot(ox, oz) || 1;
      const px = best.x + ox / ol * 2.6, pz = best.z + oz / ol * 2.6, gy = W.groundY(px, pz);   // a post on the sidewalk side
      W.fill(px - 0.125, gy, pz - 0.125, px + 0.125, gy + 3.2, pz + 0.125, iron); W.setM(px, gy + 3.2, pz, bulb);
      sign(px, gy + 3.35, pz, Math.atan2(-ox, -oz), name, AF.col(col, { emit: col, emitK: 1.6, mode: 'night' }));
      for (const k of [-1, 1]) W.setM(best.x + s * 2.6 * k + ox / ol * 1.2, gy, best.z + c * 2.6 * k + oz / ol * 1.2, bulb);
      zone(best.x, best.z, best.y, name, kind === 'sell' ? exchange : bodyWorks('Solace Body Works'), kind);
    }
  });

  // ---------------------------------------------------------------- carnival games (one class: pay, play, prize)
  class Game {
    constructor(o) { Object.assign(this, o); counter(o.x, o.y ?? 0.25, o.z, o.name + ' \u00b7 ' + cash(o.price), () => this.pay(), { kind: 'game', prio: 1.5 }); }
    pay() { if (AF.hud.meterOn() || !AF.money.spend(this.price, 'a go')) return; SFX.play('click'); this.play(); }
    win(n, msg) { if (n) AF.money.add(n); SFX.play(n ? 'ding' : 'deny'); toast(msg); }
  }
  const FORTUNES = ['A stranger will hand you a nickel. Spend it on taffy.', 'Fortune favours the bold \u2014 and the well-dressed.', 'Beware of seagulls bearing grudges.', 'Your lucky number is 13. Diksha already knew that.', 'A long journey by air is in your future. Buy the ticket.', 'You will find a star where you least expect it.', 'Romance blooms on the Big Wheel. Or nausea. Hard to say.'];
  const LOVE = ['Clammy', 'Harmless', 'Mild', 'Warm', 'Sweet', 'Hot stuff', 'Passionate', 'UNCONTROLLABLE!'];
  AF.onBuild('jobs-carnival', 890, () => {
    if (L.striker) new Game({ name: 'High striker', x: L.striker.x, z: L.striker.z + 1.8, price: G.price.game,
      play() { AF.hud.meter({ label: 'Swing the mallet!', speed: 1.7, zone: [0.88, 1] }, (v, ok) => { SFX.play('punch'); this.win(ok ? 4 : 0, ok ? 'DING! You rang the bell \u2014 a $4 prize.' : v > 0.6 ? 'So close! The puck kisses the top.' : 'Puny! The puck barely moves.'); }); } });
    new Game({ name: 'Skee-Ball', x: -280, y: 0.5, z: 190.6, price: G.price.game, play() {
      let n = 0, score = 0;
      const roll = () => { const a = 0.25 + Math.random() * 0.55; AF.hud.meter({ label: 'Ball ' + (n + 1) + ' of 3 \u00b7 ' + score + ' pts', speed: 1.5, zone: [a, a + 0.12] }, (v, ok) => {
        score += ok ? 50 : Math.abs(v - a - 0.06) < 0.14 ? 20 : 10; n++; SFX.play('click');
        if (n < 3) roll(); else this.win(score >= 120 ? 5 : score >= 90 ? 2 : 0, score + ' points' + (score >= 90 ? ' \u2014 the attendant swaps your tickets for ' + cash(score >= 120 ? 5 : 2) + '.' : '. Better luck next time.'));
      }); };
      roll(); } });
    new Game({ name: 'Claw machine', x: -283.2, y: 0.5, z: 193.3, price: G.price.game, play() { const a = 0.15 + Math.random() * 0.7; AF.hud.meter({ label: 'Drop the claw!', speed: 2.1, zone: [a, a + 0.07] }, (v, ok) => this.win(ok ? 6 : 0, ok ? 'You snagged a plush gull! The attendant swaps it for $6.' : 'The claw slips. Of course it does.')); } });
    new Game({ name: 'Love tester', x: -284.2, y: 0.5, z: 189.5, price: G.price.game, play() { const r = LOVE[(Math.random() * LOVE.length) | 0]; SFX.play('ding'); toast('The bulbs climb\u2026 \u201c' + r + '\u201d'); } });
    new Game({ name: 'Madame Zenobia', x: -268.5, y: 0.5, z: 180.4, price: G.price.game, play() { toast('Madame Zenobia whirrs: \u201c' + FORTUNES[(Math.random() * FORTUNES.length) | 0] + '\u201d'); } });
    new Game({ name: 'Fortune teller', x: -245, z: 202.6, price: G.price.game * 2, play() { AF.emit('dialogue', { name: 'Madame Esmeralda', role: 'Fortune teller', lines: ['Cross my palm with silver\u2026 ah.', FORTUNES[(Math.random() * FORTUNES.length) | 0]] }); } });
    new Game({ name: 'Photo booth', x: -151.2, z: 186, price: G.price.game, play() { const f = document.createElement('div'); f.style.cssText = 'position:absolute;inset:0;background:#fff;opacity:.9;transition:opacity .6s;pointer-events:none'; document.getElementById('ui').appendChild(f); requestAnimationFrame(() => { f.style.opacity = '0'; }); setTimeout(() => f.remove(), 700); if (AF.photo && AF.photo.capture) AF.photo.capture(); } });
    // shooting gallery: 10 shots at the tin ducks, 25 s, aim with the mouse; the counter barker pays out
    if (L.gallery && L.ducks) {
      const T = L.ducks.map((m) => ({ m, x: 0, y: 0, z: 0, down: 0 }));
      new Game({ name: 'Shooting gallery', x: L.gallery.x, z: L.gallery.z, price: G.price.game * 2, play() {
        const g = L.gallery; AF.player.teleport(g.x, 0.25, g.z, -PI / 2); AF.PL.walk.camYaw = PI / 2; AF.PL.walk.camPitch = 0.05; AF.PL.still = true;
        const GAL = AF.combat.gallery = { shots: 10, hits: 0, t: 25,
          targets: () => { for (const d of T) { d.x = d.m.position.x; d.y = d.m.position.y + 0.15; d.z = d.m.position.z; } return T.filter((d) => d.down <= 0); },
          hit: (d) => { d.down = 1.2; d.m.rotation.x = -PI / 2; GAL.hits++; SFX.play('ding'); } };
        toast(AF.touch ? 'Drag to aim, HIT to shoot \u2014 10 shots, 25 seconds!' : 'Aim with the mouse, click to shoot \u2014 10 shots, 25 seconds!');
        J.gallery = T;
      } });
    }
    // boardwalk kiosks: something to eat
    for (const [x, z, name, price, heal] of L.foodKiosks || []) counter(x, 0.25, z - 1.8, name + ' \u00b7 ' + cash(price), () => sheet(name, 'Boardwalk kiosk', () => [eat(name, price, heal), eat('Lemonade', 2, 6)]), { kind: 'food' });
    // the carousel: ride a horse for a minute
    if (L.carousel) counter(-195, 0.5, 190 + 8 + 1.8, 'Ride the carousel \u00b7 ' + cash(G.price.ride), () => { if (AF.money.spend(G.price.ride, 'a ticket')) AF.setMode('carousel'); }, { kind: 'game', prio: 1.5 });
  });
  const galleryTick = (dt) => {
    const GAL = AF.combat.gallery; if (!GAL) return;
    for (const d of J.gallery) if (d.down > 0 && (d.down -= dt) <= 0) d.m.rotation.x = 0;
    GAL.t -= dt; HUD.job = { title: 'Shooting gallery', line: GAL.hits + ' hits \u00b7 ' + GAL.shots + ' shots left', t: GAL.t };
    if ((GAL.shots <= 0 && AF.combat.cd <= 0) || GAL.t <= 0 || AF.mode !== 'walk') {
      AF.combat.gallery = null; AF.PL.still = false; HUD.job = J.cur ? HUD.job : null;
      const p = GAL.hits >= 8 ? 15 : GAL.hits >= 5 ? 6 : GAL.hits >= 3 ? 2 : 0;
      if (p) AF.money.add(p); toast(GAL.hits + ' ducks down. ' + (p ? 'The barker pays out ' + cash(p) + '!' : 'Step right up and try again!'));
    }
  };
  // carousel ride: the avatar rides a horse (PL.seat follows it round), an orbiting camera; 40 s or E to get off
  const CAR = { t: 0, h: null, p: new THREE.Vector3(), q: new THREE.Quaternion(), e: new THREE.Euler(), look: new THREE.Vector3() };
  AF.modes.carousel = {
    enter() { const H = L.carousel.horses; CAR.h = H[(Math.random() * 12) | 0]; CAR.t = 0; AF.player.setVisible(true); toast('Round and round! ' + (AF.touch ? 'EXIT' : 'E') + ' to hop off.'); },
    exit() { AF.PL.seat = null; },
    update(dt) {
      CAR.t += dt; const m = CAR.h.m; m.updateMatrixWorld(); m.getWorldPosition(CAR.p); m.getWorldQuaternion(CAR.q); CAR.e.setFromQuaternion(CAR.q, 'YXZ');
      // horses face their local +x; the saddle sits ~0.94 m above the horse's origin
      AF.Vehicle.seat({ x: CAR.p.x, y: CAR.p.y + 0.22, z: CAR.p.z, yaw: CAR.e.y + PI / 2, bob: 0, roll: 0, pitch: 0 }, [0, 0, 0], { seatH: 0.6, lean: 0.1 });
      const a = CAR.e.y + PI / 2 + 0.6, cam = AF.camera; CAR.look.set(CAR.p.x, CAR.p.y + 1.2, CAR.p.z);
      cam.position.set(CAR.p.x + Math.sin(a) * 4, CAR.p.y + 2.2, CAR.p.z + Math.cos(a) * 4); cam.up.set(0, 1, 0); cam.lookAt(CAR.look); AF.camTarget.copy(CAR.look); AF.shadowFocus.set(CAR.p.x, 0, CAR.p.z);
      if (CAR.t > 40 || I.hit('KeyE') || I.hit('KeyF')) AF.setMode('walk', { x: -195, y: 0.5, z: 190 + 8 + 2.4, yaw: PI });
    },
  };

  // ---------------------------------------------------------------- city counters (found by name once the world is built) + Westgate
  const FOOD_RE = /grocer|market|deli|automat|diner|bakery|lunch|caf[e\u00e9]|food|candy|soda|fountain|butcher/i, GUN_RE = /pawn|hardware|sporting|gun|loan/i, WEAR_RE = /tailor|hat|dry goods|shoe|glove|outfit|haberdash|cloth|boutique|notions|department/i;
  const inside = (b) => { const d = b.doors[0], yaw = d.yaw || 0; return { x: d.x + Math.sin(yaw) * 1.6, y: d.y ?? 0.25, z: d.z + Math.cos(yaw) * 1.6 }; };
  AF.on('ready', () => {
    for (const b of AF.buildings) {
      if (!b.name || !b.doors || !b.doors.length || b.doors[0].y > 2) continue;
      const kind = GUN_RE.test(b.name) ? 'guns' : WEAR_RE.test(b.name) ? 'wear' : FOOD_RE.test(b.name) ? 'food' : null; if (!kind) continue;
      const p = inside(b), title = b.name;
      if (kind === 'food') counter(p.x, p.y, p.z, 'Buy food \u00b7 ' + title, foodShop(title, FOOD), { kind });
      else if (kind === 'guns') counter(p.x, p.y, p.z, 'Gun counter \u00b7 ' + title, gunShop(title), { kind });
      else counter(p.x, p.y, p.z, 'Outfitter \u00b7 ' + title, outfitter(title), { kind });
    }
    for (const poi of (AF.outland && AF.outland.wayside) || []) {
      const name = poi.name || 'Wayside ' + poi.kind, y = poi.y ?? AF.surfaceBelow(poi.x, poi.z, 50, 80);
      if (['supermarket', 'mall', 'diner', 'kiosk'].includes(poi.kind)) counter(poi.x, y, poi.z, 'Buy food \u00b7 ' + name, foodShop(name, poi.kind === 'kiosk' ? FOOD.slice(0, 3) : FOOD), { kind: 'food', r: 5 });
      if (poi.kind === 'fuel') zone(poi.x, poi.z, y, name, bodyWorks(name + ' garage'), 'paint');
    }
    // the wardrobe in every friend's front room
    for (const c of AF.friends.cast) { const h = AF.friends.homeOf(c.id); if (h) counter(h.spawn.x + Math.cos(h.spawn.yaw) * 1.4, h.spawn.y, h.spawn.z - Math.sin(h.spawn.yaw) * 1.4, 'Wardrobe', wardrobe, { kind: 'home', can: () => AF.friends.current === c, prio: 0.6 }); }
    // Westgate: boarding passes at check-in; security turns back anyone without one (or armed); planes need one to take off
    counter(-534, 0.5, 47.6, 'Buy a boarding pass \u00b7 ' + cash(G.price.ticket), () => sheet('Westgate Check-in', 'One pass covers one flight', () => [{ name: 'Boarding pass', desc: J.ticket ? 'You have one \u2014 go through security' : 'Any departure, any plane on the apron', price: G.price.ticket, off: J.ticket, tag: J.ticket ? 'Got it' : null, act: () => AF.shop.buy(G.price.ticket, 'a pass', () => { J.ticket = true; toast('Boarding pass in hand. Security is straight ahead.'); }) }]), { kind: 'ticket' });
    for (const pl of (AF.planes && AF.planes.list) || []) {
      const it = pl.interact; if (!it || pl.x > -300 || pl.x < -700 || pl.z > 150) continue;
      const act = it.act; it.act = () => { if (!J.ticket) { toast('Ground crew: \u201cBoarding pass, please.\u201d Buy one at check-in in the terminal.'); return; } J.ticket = false; act(); };
    }
    if (AF.ui.map) {
      const map = AF.ui.map, ICON = { food: '#e9a35a', guns: '#e05a4a', wear: '#b68ae0', game: '#f3c84b', ticket: '#7ab8e8', paint: '#f2c24a', sell: '#7cd6a8' };
      const draw = (g, to, mini) => {
        g.save();
        for (const s of J.shops) { if (!ICON[s.kind] || (mini && s.kind === 'game')) continue; const p = to(s.x, s.z); g.fillStyle = ICON[s.kind]; g.beginPath(); g.arc(p.x, p.y, mini ? 4 : 3.5, 0, PI * 2); g.fill(); }
        for (const Z of J.zones) { const p = to(Z.x, Z.z); g.fillStyle = ICON[Z.kind]; g.fillRect(p.x - 4, p.y - 4, 8, 8); }
        if (MK.y > -900) { const p = to(MK.x, MK.z); g.strokeStyle = '#1d1d20'; g.lineWidth = 2; g.fillStyle = '#ffd24a'; g.beginPath(); g.arc(p.x, p.y, mini ? 7 : 6, 0, PI * 2); g.fill(); g.stroke(); }
        g.restore();
      };
      (map.overlays || (map.overlays = [])).push((g) => draw(g, map.worldToScreen, false));
      (map.miniOverlays || (map.miniOverlays = [])).push((g, to) => draw(g, to, true));
    }
  });
  let secT = 0, trespass = false;
  const airport = (dt) => {
    const p = AF.player; if (AF.mode !== 'walk' || p.x > -350 || p.x < -620 || p.z < 20 || p.z > 140) { trespass = false; return; }
    if (p.x > -494 && p.x < -479 && p.z > 56.5 && p.z < 61.5 && (!J.ticket || AF.combat.gun())) {
      p.teleport(p.x, p.y, 55.2, PI); if ((secT -= dt) <= 0) { secT = 3; toast(J.ticket ? 'Security: \u201cNo firearms past this point. Holster it.\u201d' : 'Security: \u201cBoarding pass, please.\u201d Check-in is behind you.'); }
    } else secT -= dt;
    if (p.z > 64 && !J.ticket && !trespass) { trespass = true; AF.combat.crime(G.heat.trespass); toast('Security! You\u2019re airside without a pass.'); }
  };

  // ---------------------------------------------------------------- tick
  AF.onTick('jobs', 420, (dt, t) => {
    if (!AF.ready) return;
    if (I.hit('KeyJ') && !(AF.ui.modalOpen() || AF.health.dead)) J.toggle();
    if (J.cur) J.cur.update(dt);
    if (MK.post && MK.y > -900) { MK.gem.position.y = 3 + Math.sin(t * 2.4) * 0.3; MK.gem.rotation.y += dt * 2; }
    galleryTick(dt); airport(dt);
    // drive-in zones
    const car = AF.mode === 'drive' && VV.player;
    for (const Z of J.zones) {
      const inZ = !!car && Math.abs(car.x - Z.x) < 3.4 && Math.abs(car.z - Z.z) < 3.4;
      if (inZ && !Z.inside && Math.abs(car.v) < 1.2) { Z.inside = true; car.v = car.vx = car.vz = 0; Z.open(car); }
      else if (!inZ) Z.inside = false;
    }
  });
  AF.on('died', () => { if (J.cur) J.cur.end('Job lost.'); });

  AF.test('jobs: courier job runs a stop and pays', () => {
    if (AF.mode !== 'walk') AF.setMode('walk', {});
    const m0 = S.money; J.toggle(); const job = J.cur; if (!job) return { ok: false, info: 'no job started' };
    const s = job.stop, p = AF.player; p.x = p.body.x = s.x; p.z = p.body.z = s.z; AF.PL.walk.speed = 0;
    job.update(0.5); job.update(0.5); const paid = S.money > m0 && job.legs === 1;
    J.cur.end('test'); S.money = m0; AF.saveNow();
    return { ok: paid && !J.cur && MK.y < -900, info: `paid ${paid}, legs ${job.legs}` };
  });
  AF.test('jobs: counters + drive-in zones exist (food, guns, outfits, garages, boarding pass)', () => {
    const k = new Set(J.shops.map((s) => s.kind)), z = new Set(J.zones.map((s) => s.kind));
    return { ok: k.has('food') && k.has('ticket') && k.has('game') && k.has('home') && z.has('paint') && z.has('sell'), info: [...k].join(',') + ' | zones ' + [...z].join(',') + ' | ' + J.shops.length + ' counters' };
  });
}
} catch (e) { AF.partError('78-jobs.js', e); }
