// ================================================================ 52-planes.js
try {
// ===== 52-planes: four flyable aircraft on the Westgate apron (Cub, biplane, Gee Bee racer, twin-engine airliner), an arcade
//       flight model ('fly' mode: throttle, pitch, bank, rudder; take off, land, crash + tow back), a chase camera and a
//       circling sightseeing plane over the city  (OWNER: transport) =====
{
  const PI = Math.PI, A = AF.PLAN.west.air;
  const PL = AF.planes = { list: [], cur: null };
  const C = (h, o) => AF.col(h, Object.assign({ jitter: 0.08, edge: 0.3, rough: 0.35 }, o || {}));
  // ---------------------------------------------------------------- models (x = span, y up, z = nose forward). Returns { m, vs, prop: [x,y,z] model coords, props: n }
  const wing = (m, x0, x1, y, z0, z1, c, c2) => { for (let x = x0; x < x1; x++) for (let z = z0; z < z1; z++) m.set(x, y, z, (x === x0 || x === x1 - 1) ? (c2 || c) : c); };
  const fuselage = (m, cx, cy, z0, z1, r0, r1, c, fnCol) => { for (let z = z0; z < z1; z++) { const t = (z - z0) / Math.max(1, z1 - z0 - 1), r = r0 + (r1 - r0) * t; for (let x = -Math.ceil(r); x <= Math.ceil(r); x++) for (let y = -Math.ceil(r); y <= Math.ceil(r); y++) if (x * x + y * y <= r * r + 0.5) m.set(cx + x, cy + y, z, fnCol ? fnCol(x, y, z) || c : c); } };
  const TYPES = {
    cub: { name: 'Sky Cub', vs: 1 / 8, stall: 15, vmax: 50, thrust: 9, gk: 0.4, roll: 1.9, pitch: 0.36, presp: 2.2, resp: 8, follow: 3.5, gear: 0.0,
      build() { const m = new AF.Model(86, 22, 56), Y = C(0xf2c21b), K = C(0x1a1a1a), G = C(0xa9c9d6, { glass: true, jitter: 0, edge: 0 }), cx = 43, cy = 9;
        fuselage(m, cx, cy, 6, 44, 1.5, 4, Y, (x, y, z) => (y === 0 && z > 8) ? K : null); fuselage(m, cx, cy, 44, 52, 4, 3.2, Y);
        for (let z = 36; z < 44; z++) for (let x = -3; x <= 3; x++) m.set(cx + x, cy + 5, z, Y);                          // cabin roof
        for (let z = 37; z < 43; z++) for (let y = 1; y < 5; y++) { m.set(cx - 4, cy + y, z, G); m.set(cx + 4, cy + y, z, G); }
        wing(m, 0, 86, cy + 6, 34, 45, Y, K); for (let x = cx - 18; x <= cx + 18; x += 36) for (let y = 1; y < 6; y++) m.set(x, cy + y - 1, 40 - y, K);   // struts
        wing(m, cx - 14, cx + 15, cy + 1, 3, 9, Y); for (let y = 0; y < 8; y++) for (let z = 2; z < 8 - (y >> 1); z++) m.set(cx, cy + 1 + y, z, Y);   // tail
        for (const s of [-5, 5]) { for (let y = 0; y < 8; y++) m.set(cx + s, y, 44 - (y >> 2), K); for (let z = 43; z < 47; z++) for (let y = 0; y < 3; y++) m.set(cx + s, y, z, K); }   // gear
        m.set(cx, cy - 3, 3, K); m.set(cx, cy - 4, 3, K);
        return { m, prop: [cx, cy, 52.5], blade: 8, pc: K }; } },
    biplane: { name: 'Stearman Biplane', vs: 1 / 8, stall: 17, vmax: 58, thrust: 11, gk: 0.36, roll: 2.3, pitch: 0.4, presp: 2.4, resp: 9, follow: 3.5, gear: 0.0,
      build() { const m = new AF.Model(80, 26, 62), B = C(0x2d5aa8), Yw = C(0xf2c21b), S = C(0xc8ccd2, { metal: 0.8, rough: 0.3 }), K = C(0x1a1a1a), cx = 40, cy = 9;
        fuselage(m, cx, cy, 5, 50, 1.5, 4.5, B, (x, y, z) => (y > 2 && z > 20 && z < 34 && Math.abs(x) < 3) ? 0 : null); fuselage(m, cx, cy, 50, 58, 5, 5, S);
        wing(m, 0, 80, cy - 3, 38, 49, Yw, B); wing(m, 2, 78, cy + 8, 40, 51, Yw, B);
        for (const x of [cx - 26, cx - 12, cx + 12, cx + 26]) for (let y = cy - 2; y < cy + 8; y++) { m.set(x, y, 42, S); m.set(x, y, 47, S); }
        wing(m, cx - 13, cx + 14, cy + 1, 3, 10, Yw, B); for (let y = 0; y < 9; y++) for (let z = 2; z < 9 - (y >> 1); z++) m.set(cx, cy + 1 + y, z, B);
        for (const s of [-6, 6]) { for (let y = 0; y < 7; y++) m.set(cx + s, y, 50, K); for (let z = 48; z < 53; z++) for (let y = 0; y < 3; y++) m.set(cx + s, y, z, K); }
        for (let x = -5; x <= 5; x++) for (let y = -5; y <= 5; y++) if (x * x + y * y < 26 && (x * x + y * y > 9)) m.set(cx + x, cy + y, 57, K);   // radial cowl
        return { m, prop: [cx, cy, 59], blade: 9, pc: C(0x6a4a2a) }; } },
    racer: { name: 'Gee Bee Racer', vs: 1 / 8, stall: 24, vmax: 88, thrust: 18, gk: 0.27, roll: 3.0, pitch: 0.48, presp: 2.8, resp: 10, follow: 4.5, gear: 0.0,
      build() { const m = new AF.Model(62, 26, 46), R = C(0xc8221c), Wt = C(0xf2f0e8), K = C(0x1a1a1a), G = C(0xa9c9d6, { glass: true, jitter: 0, edge: 0 }), cx = 31, cy = 10;
        fuselage(m, cx, cy, 2, 22, 1.5, 7, R, (x, y, z) => (z % 6 < 2 && y > 2) ? Wt : null); fuselage(m, cx, cy, 22, 40, 7, 6, R, (x, y) => (y < -3 ? Wt : null));
        for (let z = 8; z < 16; z++) for (let x = -2; x <= 2; x++) m.set(cx + x, cy + 7, z, G);
        wing(m, 0, 62, cy - 3, 24, 34, Wt, R); wing(m, cx - 11, cx + 12, cy + 1, 1, 7, Wt, R); for (let y = 0; y < 8; y++) for (let z = 1; z < 7 - (y >> 1); z++) m.set(cx, cy + 1 + y, z, R);
        for (const s of [-7, 7]) { for (let y = 0; y < 7; y++) m.set(cx + s, y, 32, K); for (let z = 30; z < 36; z++) for (let y = 0; y < 3; y++) m.set(cx + s, y, z, R); }
        const tm = AF.textModel('7', K, { pad: 0 }); for (let i = 0; i < tm.w; i++) for (let j = 0; j < tm.h; j++) if (tm.get(i, j, 0)) { m.set(cx + 7, cy - 2 + j, 26 + i, K); m.set(cx - 7, cy - 2 + j, 30 - i, K); }
        return { m, prop: [cx, cy, 40.5], blade: 9, pc: K }; } },
    airliner: { name: 'Clipper Airliner', vs: 1 / 4, stall: 26, vmax: 75, thrust: 10, gk: 0.33, roll: 0.9, pitch: 0.2, presp: 1.2, resp: 3, follow: 2.2, gear: 0.0, twin: true,
      build() { const m = new AF.Model(118, 30, 82), S = C(0xe4e8ee, { metal: 0.35, rough: 0.35 }), Bl = C(0x2d4a8a), K = C(0x1a1a1a), G = C(0x2a3440, { rough: 0.1 }), cx = 59, cy = 10;
        fuselage(m, cx, cy, 2, 72, 2, 6, S, (x, y, z) => (y === 2 && z % 3 === 0 && z > 14 && z < 64 && Math.abs(x) > 4) ? G : (y === -1 && Math.abs(x) >= 5) ? Bl : null); fuselage(m, cx, cy, 72, 80, 6, 3, S, (x, y) => (y > 2 ? G : null));
        wing(m, 0, 118, cy - 3, 48, 62, S, Bl); wing(m, cx - 20, cx + 21, cy + 1, 2, 10, S); for (let y = 0; y < 12; y++) for (let z = 1; z < 10 - (y >> 1); z++) m.set(cx, cy + 1 + y, z, Bl);
        for (const s of [-22, 22]) { fuselage(m, cx + s, cy - 2, 50, 66, 2.5, 3, S); for (let y = 0; y < cy - 4; y++) m.set(cx + s, y, 60, K); for (let z = 58; z < 63; z++) for (let y = 0; y < 3; y++) m.set(cx + s, y, z, K); }
        const tm = AF.textModel('SOLACE AIR', Bl, { pad: 0 }); for (let i = 0; i < tm.w; i++) for (let j = 0; j < tm.h; j++) if (tm.get(i, j, 0)) { const z = 20 + Math.round(i * 40 / tm.w); m.set(cx + 6, cy + 1 + (j >> 1), z, Bl); m.set(cx - 6, cy + 1 + (j >> 1), 80 - z, Bl); }
        return { m, prop: [cx - 22, cy - 2, 66.5], prop2: [cx + 22, cy - 2, 66.5], blade: 6, pc: K }; } },
  };
  const geoCache = {};
  // every plane flies ~15 % slower than its rated top speed (the streamers get more time ahead of it); take-off needs real speed:
  // W lifts the nose from 1.25x stall, a full-throttle roll leaves the ground by itself at 1.45x stall
  for (const T of Object.values(TYPES)) T.vmax = Math.round(T.vmax * 0.85 * 10) / 10;
  const ROTATE_K = 1.25, LIFTOFF_K = 1.45, ROLL_DRAG = 0.7;
  const planeGeo = (id) => {
    if (geoCache[id]) return geoCache[id];
    const T = TYPES[id], B = T.build();
    const geo = AF.meshModel(B.m, { vs: T.vs, anchor: [0.5, 0, 0.5] });
    const pm = new AF.Model(1, B.blade * 2 + 1, 2); pm.box(0, 0, 0, 1, B.blade * 2 + 1, 1, B.pc); pm.box(0, B.blade - 1, 0, 1, B.blade + 2, 2, C(0xc8ccd2, { metal: 0.8 }));
    const pgeo = AF.meshModel(pm, { vs: T.vs, anchor: [0.5, 0.5, 0.5] });
    const toLocal = (p) => new THREE.Vector3((p[0] - B.m.w / 2 + 0.5) * T.vs, p[1] * T.vs, (p[2] - B.m.d / 2) * T.vs);
    return (geoCache[id] = { geo, pgeo, props: [B.prop, B.prop2].filter(Boolean).map(toLocal), halfL: B.m.d * T.vs / 2, halfW: B.m.w * T.vs / 2, h: B.m.h * T.vs });
  };
  const make = (id, x, z, yaw) => {
    const T = TYPES[id], G = planeGeo(id), root = new THREE.Group();
    const body = AF.modelMesh(G.geo); root.add(body);
    const props = G.props.map((p) => { const pm = AF.modelMesh(G.pgeo); pm.position.copy(p); root.add(pm); return pm; });
    root.rotation.order = 'YXZ'; AF.scene.add(root);
    const pl = Object.assign(new AF.Vehicle({ name: T.name, x, z, yaw }), { id, T, G, root, props, x, y: AF.W.groundY(x, z), z, yaw, pitch: 0, roll: 0, gam: 0, pr: 0, rr: 0, v: 0, throttle: 0, engine: false, home: { x, z, yaw }, onGround: true, spin: 0, name: T.name });
    pl.attach({ r: 2.2, lift: 1, label: 'Fly the ' + T.name, prio: 0.1,
      dist: (px, pz) => { const s = Math.sin(pl.yaw), c = Math.cos(pl.yaw), rx = px - pl.x, rz = pz - pl.z, lx = rx * c - rz * s, lz = rx * s + rz * c; return Math.hypot(Math.max(0, Math.abs(lx) - Math.min(1.5, G.halfW)), Math.max(0, Math.abs(lz) - G.halfL)); },
      can: () => AF.mode === 'walk' && PL.cur !== pl, act: () => AF.setMode('fly', { plane: pl }) });
    PL.list.push(pl); place(pl);
    return pl;
  };
  const place = (pl) => { pl.root.position.set(pl.x, pl.y, pl.z); pl.root.rotation.set(-pl.pitch, pl.yaw, pl.roll, 'YXZ'); if (pl.interact) pl.sync(); };
  PL.make = make;
  // the model kit for 53-airtraffic's airframes (palette helper, fuselage / wing rasterisers, the airliner propeller)
  PL.kit = { C, fuselage, wing, propGeo: () => planeGeo('airliner').pgeo };
  // approach guidance picks the nearest of these east-west strips { x0, x1, z } (the island adds its own)
  PL.runways = [A.runway, A.runway2];

  // ---------------------------------------------------------------- the flight model
  // pitch = nose attitude, gam = flight-path angle (chases the nose: angle of attack settles quickly), v = airspeed along the path
  const FL = { init: false, orbit: 0, orbitP: 0, idle: 0, zoom: 1, yaw: 0, pit: 0, roll: 0 };
  const dir = new THREE.Vector3(), fwd = new THREE.Vector3(), E = new THREE.Euler(0, 0, 0, 'YXZ'), tmp = new THREE.Vector3(), look = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0);
  const G0 = 9.8, BANK = 1.22, PMAX = 1.05;
  try { PL.invertPitch = localStorage.getItem('portSolace.invertPitch') === '1'; } catch (e) { PL.invertPitch = false; }
  const ground = (x, z) => { const g = AF.W.groundY(x, z); return z > 206 && g < -1 ? -1.25 : g; };
  const crash = (pl, why) => {
    AF.emit('toast', why + ' The ground crew tows the ' + pl.name + ' back to the apron.');
    PL.reset(pl);
    AF.setMode('walk', { x: pl.x + Math.cos(pl.yaw) * 4, z: pl.z - Math.sin(pl.yaw) * 4, yaw: pl.yaw + PI / 2 });
  };
  PL.reset = (pl) => { pl.x = pl.home.x; pl.z = pl.home.z; pl.yaw = pl.home.yaw; pl.pitch = pl.roll = pl.gam = pl.pr = pl.rr = pl.v = pl.throttle = 0; pl.engine = false; pl.onGround = true; pl.y = AF.W.groundY(pl.x, pl.z); place(pl); };
  AF.modes.fly = {
    enter(o = {}) {
      const pl = o.plane; if (!pl) { AF.setMode('walk'); return; }
      PL.cur = pl; FL.init = false; FL.orbit = FL.orbitP = FL.idle = 0; FL.zoom = 1;
      if (AF.player) AF.player.setVisible(false);
      AF.emit('toast', 'Cleared for take-off in the ' + pl.name + '. ' + (AF.touch ? 'Hold THR + to open the throttle, push the stick up to lift off.' : 'Hold Space to open the throttle, then W to lift off.'));
      AF.emit('hint', AF.touch ? '' : 'Space/Shift throttle \u00b7 W/S nose up/down \u00b7 A/D bank (ground: steer) \u00b7 Q/E rudder \u00b7 X/B brakes \u00b7 S at idle: reverse \u00b7 I invert pitch \u00b7 Mouse look \u00b7 C camera \u00b7 F exit');
    },
    exit() {
      const pl = PL.cur; PL.cur = null;
      if (pl) { if (!pl.ghost) { pl.engine = false; pl.throttle = 0; } place(pl); }
      if (AF.player) AF.player.setVisible(true);
      AF.emit('hud', { speed: null }); AF.emit('hint', '');
    },
    update(dt) {
      const pl = PL.cur; if (!pl) return;
      const I = AF.input, m = I.mouse, T = pl.T, S = I.stick, modal = AF.ui && AF.ui.modalOpen && AF.ui.modalOpen();
      if (modal || (AF.ui && AF.ui.dialogueOpen && AF.ui.dialogueOpen())) return;
      dt = Math.min(dt, 0.05);
      if (I.hit('KeyI')) {
        PL.invertPitch = !PL.invertPitch; try { localStorage.setItem('portSolace.invertPitch', PL.invertPitch ? '1' : '0'); } catch (e) { /* storage blocked */ }
        AF.emit('toast', PL.invertPitch ? 'Inverted pitch: W nose down, S nose up.' : 'Normal pitch: W nose up, S nose down.');
      }
      const rawP = AF.clamp((I.key('KeyW') || I.key('ArrowUp') ? 1 : 0) - (I.key('KeyS') || I.key('ArrowDown') ? 1 : 0) + (S ? S.y : 0), -1, 1);
      const pitchIn = PL.invertPitch ? -rawP : rawP;
      const rollIn = AF.clamp((I.key('KeyD') || I.key('ArrowRight') ? 1 : 0) - (I.key('KeyA') || I.key('ArrowLeft') ? 1 : 0) + (S ? S.x : 0), -1, 1);
      const yawIn = (I.key('KeyE') ? 1 : 0) - (I.key('KeyQ') ? 1 : 0);
      const thrIn = AF.clamp((I.key('Space') ? 1 : 0) - (I.key('ShiftLeft') || I.key('ShiftRight') ? 1 : 0) + (I.throttle || 0), -1, 1);
      const brake = I.key('KeyX') || I.key('KeyB');
      if ((document.pointerLockElement || (AF.touch && (m.buttons & 1))) && (m.dx || m.dy)) {
        FL.orbit = (FL.orbit - m.dx * 0.006) % (PI * 2); FL.orbitP = AF.clamp(FL.orbitP + m.dy * 0.004, -0.4, 0.9); FL.idle = 0;
      } else FL.idle += dt;
      if (FL.idle > 1.5) { FL.orbit = AF.angDiff(0, FL.orbit) * Math.exp(-dt * 2); FL.orbitP *= Math.exp(-dt * 2); }
      FL.zoom = [1, 0.8, 1.6][AF.view.i];
      pl.throttle = AF.clamp(pl.throttle + thrIn * dt * 0.7, 0, 1);
      if ((pl.throttle > 0) !== pl.engine) { pl.engine = pl.throttle > 0; AF.emit('toast', pl.engine ? 'Engine running.' : 'Throttle closed \u2014 engine off.'); }
      // ---- dynamics
      // landing flaps deploy automatically low + slow with the throttle back: stall speed -22 %, a steeper, slower approach
      const hAGL = pl.onGround ? 0 : pl.y - ground(pl.x, pl.z);
      pl.flaps = (pl.flaps || 0) + ((!pl.onGround && hAGL < 70 && pl.throttle < 0.45 ? 1 : 0) - (pl.flaps || 0)) * Math.min(1, dt * 1.5);
      const vs = T.stall * (1 - 0.22 * (pl.flaps || 0)), drag = T.thrust / (T.vmax * T.vmax) * (1 + 0.6 * (pl.flaps || 0));
      if (pl.onGround) {
        const rotate = pitchIn > 0.2 && pl.v > vs * ROTATE_K, back = !rotate && rawP < -0.1;
        pl.v += (pl.throttle * T.thrust * T.gk - drag * ROLL_DRAG * pl.v * Math.abs(pl.v)) * dt;
        const fr = brake || (back && pl.v > 0) ? 8 : pl.throttle < 0.02 && pl.v > 2 ? 2.2 : 0.5;
        pl.v = Math.sign(pl.v) * Math.max(0, Math.abs(pl.v) - fr * dt);
        if (back && !brake && pl.throttle < 0.01 && pl.v <= 0) pl.v = Math.max(-3, pl.v - 2.5 * dt);
        pl.v = AF.clamp(pl.v, -3, T.vmax * 1.25);
        pl.yaw -= (rollIn + yawIn * 0.5) * 0.9 * AF.clamp(pl.v / 5, -1, 1) / (1 + Math.max(0, pl.v) / 20) * dt;
        pl.roll += -pl.roll * Math.min(1, dt * 6); pl.pitch += -pl.pitch * Math.min(1, dt * 5); pl.gam = pl.pr = pl.rr = 0;
        if (rotate || (pl.throttle > 0.8 && pl.v > vs * LIFTOFF_K)) { pl.onGround = false; pl.air = 0; pl.pitch = rotate ? 0.1 : 0.08; pl.pr = rotate ? T.pitch * 0.5 : 0; pl.gam = 0.05; AF.emit('toast', 'Wheels up!'); }
      } else {
        const lift = AF.clamp((pl.v - vs * 0.75) / (vs * 0.25), 0, 1), auth = 0.25 + 0.75 * AF.clamp((pl.v - vs) / vs, 0, 1);
        // pitch: rate scales with airspeed and eases in, softly limited toward +-PMAX; hands off slowly relaxes toward level
        let pr = pitchIn * T.pitch * (pitchIn < 0 ? Math.max(auth, 0.7) * 1.35 : auth);
        pr *= pr > 0 ? AF.clamp((PMAX - pl.pitch) / 0.7, 0, 1) : AF.clamp((PMAX + pl.pitch) / 0.7, 0, 1);
        pl.pr += (pr - pl.pr) * Math.min(1, dt * T.presp);
        pl.pitch += pl.pr * dt;
        // hands off: settle level under power, into a gentle glide attitude with the engine off
        if (!pitchIn) pl.pitch += ((pl.engine ? 0 : -0.12) - pl.pitch) * (1 - Math.exp(-dt * 0.5));
        // bank toward rollIn * BANK; releasing A/D rolls the wings level
        const rr = AF.clamp((rollIn * BANK - pl.roll) * 4, -T.roll, T.roll);
        pl.rr += (rr - pl.rr) * Math.min(1, dt * T.resp);
        pl.roll = AF.clamp(pl.roll + pl.rr * dt, -BANK, BANK);
        pl.gam += (pl.pitch - pl.gam) * Math.min(1, dt * T.follow * lift);
        if (lift < 1) { if (pl.pitch > -0.5) pl.pitch -= (1 - lift) * 0.8 * dt; pl.gam += (-0.7 - pl.gam) * (1 - lift) * Math.min(1, dt * 1.5); }
        // auto-flare: unless pushing, a low approach is rounded out to a gentle sink (earlier and softer with flaps out)
        const h = pl.y - ground(pl.x, pl.z), fH = 10 + 6 * (pl.flaps || 0);
        if (h < fH && pitchIn >= 0) {
          const gMin = -Math.min(0.5, (0.9 + h * 0.45) / Math.max(pl.v, 1)), k = Math.min(1, dt * 3.5);
          if (pl.gam < gMin) pl.gam += (gMin - pl.gam) * k;
          if (pl.pitch < gMin + 0.04) pl.pitch += (gMin + 0.04 - pl.pitch) * k;
        }
        pl.pitch = AF.clamp(pl.pitch, -PMAX - 0.05, PMAX + 0.05);
        // coordinated turn g*tan(bank)/v, floored so a full bank always turns >= ~27 deg/s, capped near stall
        pl.yaw -= (Math.tan(pl.roll) * AF.clamp(G0 / Math.max(pl.v, 1), 0.17, 0.3) + yawIn * 0.3) * dt;
        // engine off: the windmilling prop adds drag, so a dead-stick plane bleeds speed unless the nose goes down
        const deadK = pl.engine ? 1 : 2.2, deadC = pl.engine ? 0 : 0.8;
        pl.v += (pl.throttle * T.thrust - drag * deadK * pl.v * pl.v - deadC - G0 * Math.sin(pl.gam) * 0.9 - 1.2 * Math.sin(pl.roll) ** 2 * pl.v / T.vmax) * dt;
        pl.v = AF.clamp(pl.v, 3, T.vmax * 1.25);
      }
      const cg = Math.cos(pl.gam); dir.set(Math.sin(pl.yaw) * cg, Math.sin(pl.gam), Math.cos(pl.yaw) * cg);
      E.set(-pl.pitch, pl.yaw, 0, 'YXZ'); fwd.set(0, 0, 1).applyEuler(E);
      const vy = dir.y * pl.v, nx = pl.x + dir.x * pl.v * dt, ny = pl.y + vy * dt, nz = pl.z + dir.z * pl.v * dt;
      const gy = ground(nx, nz) + T.gear;
      pl.air = pl.onGround ? 0 : (pl.air || 0) + dt;
      // the first seconds after liftoff forgive a bounce and low clutter (edge lights, kerbs, fences)
      const early = pl.air < 4;
      if (!pl.onGround && ny <= gy) {
        const soft = vy > (early ? -8 : -7.5) && Math.abs(pl.roll) < (early ? 0.6 : 0.55) && pl.pitch > (early ? -0.4 : -0.35) && ground(nx, nz) > -0.5;
        if (!soft) { crash(pl, ground(nx, nz) < -0.5 ? 'Splash!' : 'Crunch!'); return; }
        pl.onGround = true; pl.pitch = pl.roll = pl.gam = pl.pr = pl.rr = 0; pl.flaps = 0; AF.emit('toast', vy > -2.2 ? 'Butter! A perfect landing.' : vy > -4.5 ? 'Touchdown!' : 'Firm landing — but you’re down.');
      }
      // hitting a building / hill face
      if (!pl.onGround && AF.solidAt(nx + fwd.x * pl.G.halfL, ny + (early ? 2.5 : 1), nz + fwd.z * pl.G.halfL)) { crash(pl, 'Crunch!'); return; }
      if (pl.onGround && Math.abs(pl.v) > 1 && AF.boxBlocked(nx + fwd.x * pl.G.halfL * Math.sign(pl.v), gy + 0.3, nz + fwd.z * pl.G.halfL * Math.sign(pl.v), 0.4, 1.2)) { pl.v = 0; }
      else { pl.x = nx; pl.z = nz; pl.y = pl.onGround ? gy : Math.min(900, ny); }
      if (Math.abs(pl.x) > 2200 || Math.abs(pl.z) > 2200) { pl.yaw += PI; AF.emit('toast', 'Turning back toward Port Solace.'); }
      place(pl);
      if (pl.engine) { pl.spin += dt * (8 + pl.throttle * 60); for (const p of pl.props) p.rotation.z = pl.spin; }
      // ---- chase camera: angles (not position) are smoothed, so it trails the flight path without lag or jitter
      if (!FL.init) { FL.yaw = pl.yaw; FL.pit = pl.gam; FL.roll = pl.roll; }
      const k = FL.init ? Math.min(1, dt * 3) : 1; FL.init = true;
      FL.yaw += AF.angDiff(FL.yaw, pl.yaw) * k; FL.pit += (pl.gam - FL.pit) * k; FL.roll += (pl.roll - FL.roll) * k;
      const back = (9 + pl.G.halfL * 1.3) * FL.zoom, a = FL.yaw + PI + FL.orbit, pit = AF.clamp(0.17 + FL.orbitP - FL.pit * 0.5, -0.35, 1.2), cy = pl.y + 1.2 + pl.G.h * 0.5;
      tmp.set(pl.x + Math.sin(a) * Math.cos(pit) * back, cy + Math.sin(pit) * back, pl.z + Math.cos(a) * Math.cos(pit) * back);
      tmp.y = Math.max(tmp.y, ground(tmp.x, tmp.z) + 1);
      const cp = Math.cos(FL.pit); look.set(pl.x + Math.sin(FL.yaw) * cp * 5, cy + Math.sin(FL.pit) * 5, pl.z + Math.cos(FL.yaw) * cp * 5);
      const cam = AF.camera;
      if (AF.view.fp()) {   // cockpit: just behind the pilot's head, banking with the wings
        tmp.set(pl.x, pl.y + pl.G.h * 0.62, pl.z).addScaledVector(fwd, -pl.G.halfL * 0.12);
        const a = pl.yaw + FL.orbit, p = pl.pitch - FL.orbitP; look.set(tmp.x + Math.sin(a) * Math.cos(p) * 10, tmp.y + Math.sin(p) * 10, tmp.z + Math.cos(a) * Math.cos(p) * 10);
        cam.position.copy(tmp); cam.up.copy(UP); cam.lookAt(look); cam.rotateZ(-pl.roll);
      } else { cam.position.copy(tmp); cam.up.copy(UP); cam.lookAt(look); cam.rotateZ(-FL.roll * 0.3); }
      AF.camTarget.copy(look); AF.shadowFocus.set(pl.x, 0, pl.z); AF.shadowRadius = 90;
      // approach guidance to the Westgate runway (3-degree glideslope from the nearer threshold)
      let guide = '';
      if (pl.onGround && pl.throttle > 0.05 && pl.v > 2) guide = pl.v < T.stall * ROTATE_K ? 'Take-off speed ' + Math.round(T.stall * ROTATE_K * 2.237) + ' mph' : 'Rotate! W to lift off';
      if (!pl.onGround && hAGL < 180) {
        let RW = PL.runways[0], rd = Infinity;
        for (const rw of PL.runways) { const d = Math.hypot(Math.max(rw.x0 - pl.x, 0, pl.x - rw.x1), rw.z - pl.z); if (d < rd) { rd = d; RW = rw; } }
        const thx = Math.abs(pl.x - RW.x0) < Math.abs(pl.x - RW.x1) ? RW.x0 + 30 : RW.x1 - 30, dx2 = thx - pl.x, dz2 = RW.z - pl.z, dist = Math.hypot(dx2, dz2);
        const toward = Math.cos(AF.angDiff(pl.yaw, Math.atan2(dx2, dz2))) > 0.85;
        if (toward && dist < 1800 && Math.abs(dz2) < Math.max(40, dist * 0.25)) {
          const want = dist * 0.0524, dh = hAGL - want;
          guide = 'Runway ' + Math.round(dist) + ' m · ' + (dh > 12 ? 'high — throttle back, nose down' : dh < -10 ? 'low — add power' : 'on glideslope') + (Math.abs(dz2) > 10 ? (dz2 > 0 ? ' · steer right' : ' · steer left') : '') + (pl.flaps > 0.5 ? ' · flaps' : '');
        }
      }
      AF.emit('hud', { mode: 'fly', speed: Math.abs(pl.v) * 2.237, alt: Math.max(0, pl.y - Math.max(0, ground(pl.x, pl.z))), throttle: pl.throttle, engine: pl.engine, car: pl.name + ' · Throttle ' + Math.round(pl.throttle * 100) + '%' + (PL.invertPitch ? ' · Inverted' : '') + (guide ? ' · ' + guide : !pl.onGround ? ' · F bail out' : '') });
      // ---- getting out: on the ground (nearly stopped), or bail out with a parachute from high enough
      if (I.hit('KeyF')) {
        if (pl.onGround && Math.abs(pl.v) < 4) { pl.v = 0; const sx = Math.cos(pl.yaw), sz = -Math.sin(pl.yaw), off = Math.min(pl.G.halfW, 3) + 1.2; AF.setMode('walk', { x: pl.x + sx * off, z: pl.z + sz * off, yaw: pl.yaw + PI / 2 }); }
        else if (!pl.onGround && hAGL > 35) { const sx = Math.cos(pl.yaw), sz = -Math.sin(pl.yaw); pl.ghost = true; AF.setMode('skydive', { x: pl.x + sx * (pl.G.halfW + 1.5), y: pl.y - 1, z: pl.z + sz * (pl.G.halfW + 1.5), yaw: pl.yaw, vx: dir.x * pl.v * 0.6, vz: dir.z * pl.v * 0.6, vy: Math.min(0, vy) }); }
        else AF.emit('toast', pl.onGround ? 'Slow down first!' : 'Too low to jump — climb above 35 m or land.');
      }
    },
  };

  // ---------------------------------------------------------------- bail out: freefall, then a striped canopy (Space / tap CHUTE, or
  // automatically at 70 m). W/S dive + flare, A/D turn. The empty plane glides down on its own and the ground crew recovers it.
  const SK = { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, yaw: 0, chute: false, open: 0, st: { phase: 0, speed: 0, air: 1, t: 0, land: 0 }, rig: null, cam: new THREE.Vector3(), camInit: false };
  const buildRig = () => {
    const g = new THREE.Group(), cv = document.createElement('canvas'); cv.width = 128; cv.height = 8;
    const c2 = cv.getContext('2d'); for (let i = 0; i < 8; i++) { c2.fillStyle = ['#d8402a', '#f4ecd8', '#2f6aa8', '#f4ecd8'][i % 4]; c2.fillRect(i * 16, 0, 16, 8); }
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
    const dome = new THREE.Mesh(new THREE.SphereGeometry(3.6, 24, 6, 0, PI * 2, 0, PI / 2.6), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8, side: THREE.DoubleSide }));
    dome.scale.set(1, 0.5, 0.62); dome.position.y = 4.6; dome.castShadow = true; g.add(dome);
    const pts = []; for (let i = 0; i < 10; i++) { const a = i / 10 * PI * 2; pts.push(Math.cos(a) * 3.36, 5.25, Math.sin(a) * 2.08, 0, 1.35, 0); }
    const lines = new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)), new THREE.LineBasicMaterial({ color: 0x2a2a2a }));
    g.add(lines); g.visible = false; g.name = 'parachute'; AF.scene.add(g); return g;
  };
  AF.modes.skydive = {
    enter(o = {}) {
      Object.assign(SK, { x: o.x, y: o.y, z: o.z, vx: o.vx || 0, vy: o.vy || 0, vz: o.vz || 0, yaw: o.yaw || 0, chute: false, open: 0, camInit: false });
      if (!SK.rig) SK.rig = buildRig();
      SK.rig.visible = false; SK.rig.scale.setScalar(0.05);
      if (AF.player) AF.player.setVisible(true);
      AF.emit('toast', AF.touch ? 'Freefall! Tap CHUTE to open the parachute.' : 'Freefall! Space opens the parachute \u2014 W/S dive or flare, A/D turn.');
    },
    exit() { if (SK.rig) SK.rig.visible = false; AF.emit('hud', { speed: null }); },
    update(dt) {
      dt = Math.min(dt, 0.05);
      const I = AF.input, S = I.stick, P = AF.player;
      const fwdIn = AF.clamp((I.key('KeyW') || I.key('ArrowUp') ? 1 : 0) - (I.key('KeyS') || I.key('ArrowDown') ? 1 : 0) + (S ? S.y : 0), -1, 1);
      const turnIn = AF.clamp((I.key('KeyD') || I.key('ArrowRight') ? 1 : 0) - (I.key('KeyA') || I.key('ArrowLeft') ? 1 : 0) + (S ? S.x : 0), -1, 1);
      const gy = Math.max(AF.W.groundY(SK.x, SK.z), SK.z > 206 ? -1.25 : -99), h = SK.y - gy;
      if (!SK.chute && (I.hit('Space') || h < 70)) { SK.chute = true; AF.emit('toast', 'Canopy open! Steer with A/D, hold S to flare before touchdown.'); }
      SK.yaw -= turnIn * (SK.chute ? 0.9 : 1.6) * dt;
      const hx = Math.sin(SK.yaw), hz = Math.cos(SK.yaw);
      if (SK.chute) {
        SK.open = Math.min(1, SK.open + dt * 1.6);
        const sink = -(fwdIn < 0 ? 2.2 : 4.6 + fwdIn * 1.5), fs = 6.5 + fwdIn * 2.5 - (fwdIn < 0 ? 3 : 0);
        SK.vy += (sink - SK.vy) * Math.min(1, dt * (1.2 + SK.open * 2));
        SK.vx += (hx * fs - SK.vx) * Math.min(1, dt * 1.2); SK.vz += (hz * fs - SK.vz) * Math.min(1, dt * 1.2);
      } else {
        SK.vy = Math.max(-52, SK.vy - 9.8 * dt - SK.vy * Math.abs(SK.vy) * 0.0036 * dt);
        const fs = 10 + fwdIn * 14;
        SK.vx += (hx * fs - SK.vx) * Math.min(1, dt * 0.6); SK.vz += (hz * fs - SK.vz) * Math.min(1, dt * 0.6);
      }
      SK.x += SK.vx * dt; SK.y += SK.vy * dt; SK.z += SK.vz * dt;
      const floor = AF.surfaceBelow(SK.x, SK.z, SK.y + 1.5, 40), land = Number.isFinite(floor) && floor > -50 ? Math.max(floor, gy) : gy;
      if (SK.y <= land + 0.02) {
        const hard = SK.vy < -9;
        AF.emit('toast', hard ? 'Oof \u2014 a rough landing, but you walk it off.' : SK.z > 206 && land < -1 ? 'Splashdown! Swim for the shore.' : 'Touchdown under canopy. Nice jump!');
        AF.setMode('walk', { x: SK.x, y: land, z: SK.z, yaw: SK.yaw }); return;
      }
      // the avatar hangs under the canopy (or spreads out in freefall)
      if (P && P.mesh) {
        P.mesh.position.set(SK.x, SK.y, SK.z); P.mesh.rotation.set(SK.chute ? 0 : 1.2, SK.yaw, -turnIn * 0.25, 'YXZ');
        SK.st.air = 1; if (P.parts) AF.avatar.animate(P.parts, SK.st, dt, 0, false);
      }
      const R = SK.rig; R.visible = SK.chute; R.scale.setScalar(0.1 + 0.9 * SK.open); R.position.set(SK.x, SK.y, SK.z); R.rotation.set(-fwdIn * 0.12, SK.yaw, -turnIn * 0.3, 'YXZ');
      // chase camera behind and above
      const back = SK.chute ? 11 : 8, up = SK.chute ? 4.5 : 3.2;
      tmp.set(SK.x - hx * back, SK.y + up, SK.z - hz * back); tmp.y = Math.max(tmp.y, ground(tmp.x, tmp.z) + 1);
      if (!SK.camInit) { SK.cam.copy(tmp); SK.camInit = true; } else SK.cam.lerp(tmp, 1 - Math.exp(-dt * 4));
      const cam = AF.camera; cam.position.copy(SK.cam); cam.up.copy(UP); look.set(SK.x, SK.y + (SK.chute ? 1.5 : 0), SK.z); cam.lookAt(look);
      AF.camTarget.copy(look); AF.shadowFocus.set(SK.x, 0, SK.z); AF.shadowRadius = 60;
      AF.emit('hud', { mode: 'fly', speed: Math.hypot(SK.vx, SK.vy, SK.vz) * 2.237, alt: Math.max(0, h), car: SK.chute ? 'Parachute \u00b7 A/D steer \u00b7 S flare' : 'Freefall \u00b7 ' + (AF.touch ? 'tap CHUTE' : 'Space') + ' to open' });
    },
  };
  // an abandoned plane glides on, sinking, until the ground crew 'recovers' it at the apron
  AF.onTick('plane-ghosts', 441, (dt) => {
    for (const pl of PL.list) {
      if (!pl.ghost || PL.cur === pl) continue;
      pl.gam += (-0.18 - pl.gam) * Math.min(1, dt); pl.pitch = pl.gam; pl.roll *= Math.exp(-dt);
      const cg = Math.cos(pl.gam); pl.x += Math.sin(pl.yaw) * cg * pl.v * dt; pl.z += Math.cos(pl.yaw) * cg * pl.v * dt; pl.y += Math.sin(pl.gam) * pl.v * dt;
      if (pl.engine) { pl.spin += dt * 30; for (const p of pl.props) p.rotation.z = pl.spin; }
      if (pl.y <= ground(pl.x, pl.z) + 0.5 || Math.abs(pl.x) > 2200 || Math.abs(pl.z) > 2200) { pl.ghost = false; PL.reset(pl); }
      else place(pl);
    }
  });

  // ---------------------------------------------------------------- the apron line-up + a sightseeing Cub circling the city
  AF.onBuild('planes', 640, () => {
    const z = A.apron[1] + 22, yaw = PI;   // noses toward the taxiway
    make('cub', -560, z, yaw); make('biplane', -520, z, yaw); make('racer', -480, z, yaw); make('airliner', -410, z - 2, yaw);
    // the sightseer: no physics, a slow lazy loop over the whole map
    const G = planeGeo('biplane'), root = new THREE.Group(), body = AF.modelMesh(G.geo), prop = AF.modelMesh(G.pgeo);
    body.castShadow = false; root.add(body); prop.position.copy(G.props[0]); root.add(prop); root.rotation.order = 'YXZ'; AF.scene.add(root);
    AF.onTick('plane-sightseer', 440, (dt, t) => {
      const a = t * 0.024, R = 330, cx = -180, cz = -20;
      const x = cx + Math.cos(a) * R * 1.3, zz = cz + Math.sin(a) * R, y = 150 + Math.sin(a * 3) * 12;
      root.position.set(x, y, zz); root.rotation.set(0, Math.atan2(-Math.sin(a) * 1.3, Math.cos(a)), -0.35, 'YXZ'); prop.rotation.z = t * 40;
    });
  });
  AF.test('planes: throttle takeoff 5-12s + no crash climbing out; W ~20-25deg in 1.75s, climbs; S descends; A turns >=90deg in 6s + auto-level; S at idle reverses', () => {
    const source = PL.list.find((plane) => plane.id === 'cub'); if (!source) return { ok: false, info: 'no cub' };
    const pl = Object.assign({}, source, { root: new THREE.Group(), props: [], interact: null });
    const I = AF.input, saveDown = new Set(I.down), savePressed = new Set(I.pressed), saveMouse = Object.assign({}, I.mouse), saveStick = I.stick, saveThrottle = I.throttle;
    const saveCur = PL.cur, saveInv = PL.invertPitch, saveSetMode = AF.setMode, saveModal = AF.ui && AF.ui.modalOpen, saveDialogue = AF.ui && AF.ui.dialogueOpen;
    const cam = AF.camera, cp = cam.position.clone(), cq = cam.quaternion.clone(), cu = cam.up.clone(), target = AF.camTarget.clone(), focus = AF.shadowFocus.clone(), radius = AF.shadowRadius;
    const saveFL = Object.assign({}, FL);
    const runway = () => { pl.x = A.runway.x0 + 20; pl.z = A.runway.z; pl.yaw = PI / 2; pl.y = AF.W.groundY(pl.x, pl.z); pl.v = pl.pitch = pl.roll = pl.gam = pl.pr = pl.rr = pl.throttle = 0; pl.engine = false; pl.onGround = true; };
    const air = () => { runway(); pl.y += 200; pl.v = pl.T.stall * 1.8; pl.throttle = 0.75; pl.engine = true; pl.onGround = false; };
    const hold = (keys, s) => { I.down.clear(); for (const key of keys) I.down.add(key); for (let f = 0; f < Math.round(s * 30); f++) AF.modes.fly.update(1 / 30); I.down.clear(); };
    let takeoff = -1, climb = 0, dive = 0, turn = 0, level = 9, back = 0, crashes = 0, p175 = 0, out = false;
    try {
      if (AF.ui) { AF.ui.modalOpen = () => false; AF.ui.dialogueOpen = () => false; }
      AF.setMode = () => { crashes++; };
      I.down.clear(); I.pressed.clear(); I.stick = null; I.throttle = 0; I.mouse.dx = I.mouse.dy = I.mouse.wheel = I.mouse.buttons = 0;
      PL.cur = pl; PL.invertPitch = false; FL.init = false; FL.zoom = 1; FL.orbit = FL.orbitP = FL.idle = 0;
      runway(); I.down.add('Space');
      for (let f = 0; f < 1200; f++) { AF.modes.fly.update(1 / 30); if (!pl.onGround) { takeoff = (f + 1) / 30; break; } }
      I.down.clear();
      if (takeoff > 0) { hold(['Space'], 5); out = !pl.onGround; }
      air(); let y0 = pl.y; hold(['KeyW'], 1.75); p175 = pl.pitch; hold(['KeyW'], 1.25); climb = pl.y - y0;
      air(); y0 = pl.y; hold(['KeyS'], 3); dive = y0 - pl.y;
      air(); const yaw0 = pl.yaw; hold(['KeyA'], 6); turn = Math.abs(pl.yaw - yaw0) * 180 / PI; hold([], 3); level = Math.abs(pl.roll);
      runway(); const x0 = pl.x, z0 = pl.z; hold(['KeyS'], 4); back = (pl.x - x0) * Math.sin(pl.yaw) + (pl.z - z0) * Math.cos(pl.yaw);
    } finally {
      I.down.clear(); for (const key of saveDown) I.down.add(key);
      I.pressed.clear(); for (const key of savePressed) I.pressed.add(key);
      Object.assign(I.mouse, saveMouse); I.stick = saveStick; I.throttle = saveThrottle;
      PL.cur = saveCur; PL.invertPitch = saveInv; AF.setMode = saveSetMode; if (AF.ui) { AF.ui.modalOpen = saveModal; AF.ui.dialogueOpen = saveDialogue; }
      cam.position.copy(cp); cam.quaternion.copy(cq); cam.up.copy(cu); AF.camTarget.copy(target); AF.shadowFocus.copy(focus); AF.shadowRadius = radius;
      Object.assign(FL, saveFL);
      AF.emit('hud', { speed: null });
    }
    return { ok: !crashes && takeoff >= 5 && takeoff <= 12 && out && p175 > 0.3 && p175 < 0.5 && climb >= 10 && dive > 0 && turn >= 90 && level < 0.05 && back < -1,
      info: `takeoff ${takeoff.toFixed(1)}s, airborne 5s later ${out}; W pitch ${(p175 * 180 / PI).toFixed(0)}deg @1.75s, +${climb.toFixed(0)} m in 3s; S -${dive.toFixed(0)} m; A turn ${turn.toFixed(0)}deg, roll after release ${level.toFixed(3)}; reverse ${back.toFixed(1)} m; crashes ${crashes}` };
  });
}

} catch (e) { AF.partError('52-planes.js', e); }
