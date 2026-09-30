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
    cub: { name: 'Sky Cub', vs: 1 / 8, stall: 15, vmax: 50, thrust: 9, roll: 1.8, pitch: 1.1, gear: 0.0,
      build() { const m = new AF.Model(86, 22, 56), Y = C(0xf2c21b), K = C(0x1a1a1a), G = C(0xa9c9d6, { glass: true, jitter: 0, edge: 0 }), cx = 43, cy = 9;
        fuselage(m, cx, cy, 6, 44, 1.5, 4, Y, (x, y, z) => (y === 0 && z > 8) ? K : null); fuselage(m, cx, cy, 44, 52, 4, 3.2, Y);
        for (let z = 36; z < 44; z++) for (let x = -3; x <= 3; x++) m.set(cx + x, cy + 5, z, Y);                          // cabin roof
        for (let z = 37; z < 43; z++) for (let y = 1; y < 5; y++) { m.set(cx - 4, cy + y, z, G); m.set(cx + 4, cy + y, z, G); }
        wing(m, 0, 86, cy + 6, 34, 45, Y, K); for (let x = cx - 18; x <= cx + 18; x += 36) for (let y = 1; y < 6; y++) m.set(x, cy + y - 1, 40 - y, K);   // struts
        wing(m, cx - 14, cx + 15, cy + 1, 3, 9, Y); for (let y = 0; y < 8; y++) for (let z = 2; z < 8 - (y >> 1); z++) m.set(cx, cy + 1 + y, z, Y);   // tail
        for (const s of [-5, 5]) { for (let y = 0; y < 8; y++) m.set(cx + s, y, 44 - (y >> 2), K); for (let z = 43; z < 47; z++) for (let y = 0; y < 3; y++) m.set(cx + s, y, z, K); }   // gear
        m.set(cx, cy - 3, 3, K); m.set(cx, cy - 4, 3, K);
        return { m, prop: [cx, cy, 52.5], blade: 8, pc: K }; } },
    biplane: { name: 'Stearman Biplane', vs: 1 / 8, stall: 17, vmax: 58, thrust: 11, roll: 2.3, pitch: 1.3, gear: 0.0,
      build() { const m = new AF.Model(80, 26, 62), B = C(0x2d5aa8), Yw = C(0xf2c21b), S = C(0xc8ccd2, { metal: 0.8, rough: 0.3 }), K = C(0x1a1a1a), cx = 40, cy = 9;
        fuselage(m, cx, cy, 5, 50, 1.5, 4.5, B, (x, y, z) => (y > 2 && z > 20 && z < 34 && Math.abs(x) < 3) ? 0 : null); fuselage(m, cx, cy, 50, 58, 5, 5, S);
        wing(m, 0, 80, cy - 3, 38, 49, Yw, B); wing(m, 2, 78, cy + 8, 40, 51, Yw, B);
        for (const x of [cx - 26, cx - 12, cx + 12, cx + 26]) for (let y = cy - 2; y < cy + 8; y++) { m.set(x, y, 42, S); m.set(x, y, 47, S); }
        wing(m, cx - 13, cx + 14, cy + 1, 3, 10, Yw, B); for (let y = 0; y < 9; y++) for (let z = 2; z < 9 - (y >> 1); z++) m.set(cx, cy + 1 + y, z, B);
        for (const s of [-6, 6]) { for (let y = 0; y < 7; y++) m.set(cx + s, y, 50, K); for (let z = 48; z < 53; z++) for (let y = 0; y < 3; y++) m.set(cx + s, y, z, K); }
        for (let x = -5; x <= 5; x++) for (let y = -5; y <= 5; y++) if (x * x + y * y < 26 && (x * x + y * y > 9)) m.set(cx + x, cy + y, 57, K);   // radial cowl
        return { m, prop: [cx, cy, 59], blade: 9, pc: C(0x6a4a2a) }; } },
    racer: { name: 'Gee Bee Racer', vs: 1 / 8, stall: 24, vmax: 88, thrust: 18, roll: 3.2, pitch: 1.6, gear: 0.0,
      build() { const m = new AF.Model(62, 26, 46), R = C(0xc8221c), Wt = C(0xf2f0e8), K = C(0x1a1a1a), G = C(0xa9c9d6, { glass: true, jitter: 0, edge: 0 }), cx = 31, cy = 10;
        fuselage(m, cx, cy, 2, 22, 1.5, 7, R, (x, y, z) => (z % 6 < 2 && y > 2) ? Wt : null); fuselage(m, cx, cy, 22, 40, 7, 6, R, (x, y) => (y < -3 ? Wt : null));
        for (let z = 8; z < 16; z++) for (let x = -2; x <= 2; x++) m.set(cx + x, cy + 7, z, G);
        wing(m, 0, 62, cy - 3, 24, 34, Wt, R); wing(m, cx - 11, cx + 12, cy + 1, 1, 7, Wt, R); for (let y = 0; y < 8; y++) for (let z = 1; z < 7 - (y >> 1); z++) m.set(cx, cy + 1 + y, z, R);
        for (const s of [-7, 7]) { for (let y = 0; y < 7; y++) m.set(cx + s, y, 32, K); for (let z = 30; z < 36; z++) for (let y = 0; y < 3; y++) m.set(cx + s, y, z, R); }
        const tm = AF.textModel('7', K, { pad: 0 }); for (let i = 0; i < tm.w; i++) for (let j = 0; j < tm.h; j++) if (tm.get(i, j, 0)) { m.set(cx + 7, cy - 2 + j, 26 + i, K); m.set(cx - 7, cy - 2 + j, 30 - i, K); }
        return { m, prop: [cx, cy, 40.5], blade: 9, pc: K }; } },
    airliner: { name: 'Clipper Airliner', vs: 1 / 4, stall: 26, vmax: 75, thrust: 10, roll: 1.1, pitch: 0.7, gear: 0.0, twin: true,
      build() { const m = new AF.Model(118, 30, 82), S = C(0xe4e8ee, { metal: 0.35, rough: 0.35 }), Bl = C(0x2d4a8a), K = C(0x1a1a1a), G = C(0x2a3440, { rough: 0.1 }), cx = 59, cy = 10;
        fuselage(m, cx, cy, 2, 72, 2, 6, S, (x, y, z) => (y === 2 && z % 3 === 0 && z > 14 && z < 64 && Math.abs(x) > 4) ? G : (y === -1 && Math.abs(x) >= 5) ? Bl : null); fuselage(m, cx, cy, 72, 80, 6, 3, S, (x, y) => (y > 2 ? G : null));
        wing(m, 0, 118, cy - 3, 48, 62, S, Bl); wing(m, cx - 20, cx + 21, cy + 1, 2, 10, S); for (let y = 0; y < 12; y++) for (let z = 1; z < 10 - (y >> 1); z++) m.set(cx, cy + 1 + y, z, Bl);
        for (const s of [-22, 22]) { fuselage(m, cx + s, cy - 2, 50, 66, 2.5, 3, S); for (let y = 0; y < cy - 4; y++) m.set(cx + s, y, 60, K); for (let z = 58; z < 63; z++) for (let y = 0; y < 3; y++) m.set(cx + s, y, z, K); }
        const tm = AF.textModel('SOLACE AIR', Bl, { pad: 0 }); for (let i = 0; i < tm.w; i++) for (let j = 0; j < tm.h; j++) if (tm.get(i, j, 0)) { const z = 20 + Math.round(i * 40 / tm.w); m.set(cx + 6, cy + 1 + (j >> 1), z, Bl); m.set(cx - 6, cy + 1 + (j >> 1), 80 - z, Bl); }
        return { m, prop: [cx - 22, cy - 2, 66.5], prop2: [cx + 22, cy - 2, 66.5], blade: 6, pc: K }; } },
  };
  const geoCache = {};
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
    const pl = { id, T, G, root, props, x, y: AF.W.groundY(x, z), z, yaw, pitch: 0, roll: 0, v: 0, throttle: 0, home: { x, z, yaw }, onGround: true, spin: 0, name: T.name };
    pl.interact = AF.addInteract({ x, y: pl.y + 1, z, r: 2.2, label: 'Fly the ' + T.name, prio: 0.1,
      dist: (px, pz) => { const s = Math.sin(pl.yaw), c = Math.cos(pl.yaw), rx = px - pl.x, rz = pz - pl.z, lx = rx * c - rz * s, lz = rx * s + rz * c; return Math.hypot(Math.max(0, Math.abs(lx) - Math.min(1.5, G.halfW)), Math.max(0, Math.abs(lz) - G.halfL)); },
      can: () => AF.mode === 'walk' && PL.cur !== pl, act: () => AF.setMode('fly', { plane: pl }) });
    PL.list.push(pl); place(pl);
    return pl;
  };
  const place = (pl) => { pl.root.position.set(pl.x, pl.y, pl.z); pl.root.rotation.set(-pl.pitch, pl.yaw, pl.roll, 'YXZ'); if (pl.interact) { pl.interact.x = pl.x; pl.interact.y = pl.y + 1; pl.interact.z = pl.z; } };

  // ---------------------------------------------------------------- the flight model
  const FL = { cam: new THREE.Vector3(), look: new THREE.Vector3(), init: false, orbit: 0, orbitP: 0, mouseP: 0, mouseR: 0, crashT: 0 };
  const fwd = new THREE.Vector3(), upv = new THREE.Vector3(), E = new THREE.Euler(0, 0, 0, 'YXZ'), tmp = new THREE.Vector3();
  const ground = (x, z) => { const g = AF.W.groundY(x, z); return z > 206 && g < -1 ? -1.25 : g; };
  const crash = (pl, why) => {
    AF.emit('toast', why + ' The ground crew tows the ' + pl.name + ' back to the apron.');
    PL.reset(pl);
    AF.setMode('walk', { x: pl.x + Math.cos(pl.yaw) * 4, z: pl.z - Math.sin(pl.yaw) * 4, yaw: pl.yaw + PI / 2 });
  };
  PL.reset = (pl) => { pl.x = pl.home.x; pl.z = pl.home.z; pl.yaw = pl.home.yaw; pl.pitch = pl.roll = pl.v = pl.throttle = 0; pl.onGround = true; pl.y = AF.W.groundY(pl.x, pl.z); place(pl); };
  AF.modes.fly = {
    enter(o = {}) {
      const pl = o.plane; if (!pl) { AF.setMode('walk'); return; }
      PL.cur = pl; FL.init = false; FL.orbit = FL.orbitP = 0; FL.mouseP = FL.mouseR = 0;
      if (AF.player) AF.player.setVisible(false);
      AF.emit('toast', 'Cleared for take-off in the ' + pl.name + '. W to taxi, hold Space to power up and lift off.');
      AF.emit('hint', AF.touch ? '' : 'Space engine up + climb \u00b7 Shift engine down + descend \u00b7 W/S taxi / brake \u00b7 A/D turn \u00b7 F to get out on the ground');
      if (!AF.touch) try { const r = AF.renderer.domElement.requestPointerLock(); if (r && r.catch) r.catch(() => {}); } catch (e) {}
    },
    exit() {
      const pl = PL.cur; PL.cur = null;
      if (pl) { pl.throttle = 0; place(pl); }
      if (AF.player) AF.player.setVisible(true);
      AF.emit('hud', { speed: null }); AF.emit('hint', '');
      if (document.pointerLockElement) try { document.exitPointerLock(); } catch (e) {}
    },
    update(dt) {
      const pl = PL.cur; if (!pl) return;
      const I = AF.input, m = I.mouse, T = pl.T, S = I.stick, modal = AF.ui && AF.ui.modalOpen && AF.ui.modalOpen();
      dt = Math.min(dt, 0.05);
      // ---- input
      let thr = 0, pitchIn = 0, rollIn = 0, yawIn = 0, taxi = 0, brake = false, fine = false, diving = false;
      if (!modal) {
        const up = I.key('Space'), down = I.key('ShiftLeft') || I.key('ShiftRight');
        diving = down;
        if (up) { thr += 1.4; if (!pl.onGround || pl.v > T.stall) pitchIn += 1; }
        if (down) { thr -= 2; if (!pl.onGround) pitchIn -= 1; }
        if (I.key('KeyW')) { if (pl.onGround) taxi = 1; else thr += 0.6; }
        if (I.key('KeyS')) { if (pl.onGround) brake = true; else thr -= 0.6; }
        if (I.key('ArrowDown')) pitchIn += 1; if (I.key('ArrowUp')) pitchIn -= 1;
        if (I.key('KeyA') || I.key('ArrowLeft')) rollIn -= 1; if (I.key('KeyD') || I.key('ArrowRight')) rollIn += 1;
        if (I.key('KeyQ')) yawIn -= 1; if (I.key('KeyE')) yawIn += 1;
        const locked = !!document.pointerLockElement;
        if (locked) { FL.mouseP = AF.clamp(FL.mouseP + m.dy * 0.004, -1, 1); FL.mouseR = AF.clamp(FL.mouseR + m.dx * 0.004, -1, 1); }
        FL.mouseP *= Math.exp(-dt * 2.2); FL.mouseR *= Math.exp(-dt * 2.2);
        fine = I.key('ArrowDown') || I.key('ArrowUp') || Math.abs(FL.mouseP) > 0.15 || !!(S && S.y);
        pitchIn = AF.clamp(pitchIn + FL.mouseP, -1, 1); rollIn = AF.clamp(rollIn + FL.mouseR, -1, 1);
        if (S && (S.x || S.y)) { pitchIn = AF.clamp(pitchIn - S.y, -1, 1); rollIn = AF.clamp(rollIn + S.x, -1, 1); }
        if (I.throttle) thr += I.throttle;
        if (!locked && (m.buttons & 1) && (m.dx || m.dy)) { FL.orbit -= m.dx * 0.006; FL.orbitP = AF.clamp(FL.orbitP + m.dy * 0.004, -0.4, 0.9); FL.dragT = 1.2; }
      }
      if ((FL.dragT = (FL.dragT || 0) - dt) < 0) { FL.orbit *= Math.exp(-dt * 1.5); FL.orbitP *= Math.exp(-dt * 1.5); }
      pl.throttle = AF.clamp(pl.throttle + thr * dt * 0.6, 0, 1);
      // taxi: W holds a gentle idle power and caps ground speed until Space is used
      if (pl.onGround && taxi && pl.throttle < 0.3) pl.throttle += (0.3 - pl.throttle) * Math.min(1, dt * 3);
      // ---- dynamics
      const g = 9.8, vs = T.stall;
      const lift = AF.clamp((pl.v - vs * 0.6) / (vs * 0.5), 0, 1);           // 0 below ~0.6 stall, 1 above ~1.1 stall
      pl.v += (pl.throttle * T.thrust - (T.thrust / (T.vmax * T.vmax)) * pl.v * pl.v - g * Math.sin(pl.pitch) * 0.9 - (pl.onGround ? (brake ? 8 : 0.4) : 0)) * dt;
      pl.v = AF.clamp(pl.v, 0, T.vmax * 1.15);
      if (pl.onGround && pl.throttle <= 0.31 && pl.v > 8) pl.v += (8 - pl.v) * Math.min(1, dt * 2);
      if (pl.onGround) {
        pl.roll += (0 - pl.roll) * Math.min(1, dt * 6);
        pl.yaw -= (rollIn * 0.6 + yawIn * 0.4) * Math.min(1, 0.3 + pl.v / 12) * dt;
        const rest = 0;
        if (pitchIn > 0.2 && pl.v > vs) { pl.onGround = false; pl.pitch = 0.05; AF.emit('toast', 'Wheels up!'); }
        else pl.pitch += (rest - pl.pitch) * Math.min(1, dt * 5);
      } else {
        // Space / Shift alone hold a comfortable climb / descent attitude; arrows or the mouse can go steeper
        if (!fine && ((pitchIn > 0 && pl.pitch > 0.32) || (pitchIn < 0 && pl.pitch < -0.28))) pitchIn = 0;
        pl.pitch += pitchIn * T.pitch * dt * (0.35 + 0.65 * lift);
        if (!pitchIn) pl.pitch *= Math.exp(-dt * 0.7);
        // A/D: bank toward a comfortable turn angle and self-level on release
        if (rollIn) pl.roll += (rollIn * 0.75 - pl.roll) * Math.min(1, dt * T.roll * 1.2);
        else pl.roll *= Math.exp(-dt * 1.8);
        pl.roll = AF.clamp(pl.roll, -1.25, 1.25); pl.pitch = AF.clamp(pl.pitch, -0.9, 0.9);
        if (!fine) { const pc = AF.clamp(pl.pitch, -0.3, 0.34); pl.pitch += (pc - pl.pitch) * Math.min(1, dt * 3); }
        // auto-flare: close to the ground and not diving, the nose eases up so a gentle approach becomes a touchdown
        if (!diving && !fine && pl.y - ground(pl.x, pl.z) < 10) pl.pitch += (Math.max(pl.pitch, -0.06) - pl.pitch) * Math.min(1, dt * 2.5);
        // stall: the nose drops, the plane mushes down
        if (lift < 1) pl.pitch -= (1 - lift) * dt * 0.9;
        pl.yaw -= (Math.tan(pl.roll) * g / Math.max(12, pl.v)) * dt * 0.9 + yawIn * 0.35 * dt;
        pl.pitch -= Math.abs(Math.sin(pl.roll)) * 0.12 * dt * (1 - lift * 0.6);
      }
      E.set(-pl.pitch, pl.yaw, -pl.roll, 'YXZ'); fwd.set(0, 0, 1).applyEuler(E);
      let vy = fwd.y * pl.v; if (!pl.onGround) vy -= (1 - lift) * 7;
      const nx = pl.x + fwd.x * pl.v * dt, ny = pl.y + vy * dt, nz = pl.z + fwd.z * pl.v * dt;
      const gy = ground(nx, nz) + T.gear;
      if (!pl.onGround && ny <= gy) {
        const soft = vy > -6 && Math.abs(pl.roll) < 0.45 && pl.pitch > -0.25 && ground(nx, nz) > -0.5;
        if (!soft) { crash(pl, ground(nx, nz) < -0.5 ? 'Splash!' : 'Crunch!'); return; }
        pl.onGround = true; pl.pitch = 0; pl.roll = 0; AF.emit('toast', 'Touchdown!');
      }
      // hitting a building / hill face
      if (!pl.onGround && AF.solidAt(nx + fwd.x * pl.G.halfL, ny + 1, nz + fwd.z * pl.G.halfL)) { crash(pl, 'Crunch!'); return; }
      if (pl.onGround && pl.v > 1 && AF.boxBlocked(nx + fwd.x * pl.G.halfL, gy + 0.3, nz + fwd.z * pl.G.halfL, 0.4, 1.2)) { pl.v = 0; }
      else { pl.x = nx; pl.z = nz; pl.y = pl.onGround ? gy : Math.min(900, ny); }
      if (Math.abs(pl.x) > 2200 || Math.abs(pl.z) > 2200) { pl.yaw += PI; AF.emit('toast', 'Turning back toward Port Solace.'); }
      place(pl);
      pl.spin += dt * (4 + pl.throttle * 60); for (const p of pl.props) p.rotation.z = pl.spin;
      // ---- camera: behind + above, smoothed; drag to look around
      const back = 9 + pl.G.halfL * 1.3, a = pl.yaw + PI + FL.orbit, pit = 0.16 + FL.orbitP - pl.pitch * 0.5;
      tmp.set(pl.x + Math.sin(a) * Math.cos(pit) * back, pl.y + 1.5 + pl.G.h * 0.5 + Math.sin(pit) * back, pl.z + Math.cos(a) * Math.cos(pit) * back);
      tmp.y = Math.max(tmp.y, ground(tmp.x, tmp.z) + 1);
      const k = FL.init ? 1 - Math.exp(-dt * 5) : 1; FL.init = true;
      FL.cam.lerp(tmp, k); FL.look.lerp(tmp.set(pl.x + fwd.x * 4, pl.y + 1.2 + fwd.y * 4, pl.z + fwd.z * 4), FL.init ? Math.min(1, k * 2) : 1);
      const cam = AF.camera; cam.position.copy(FL.cam); upv.set(0, 1, 0); cam.up.copy(upv); cam.lookAt(FL.look);
      AF.camTarget.copy(FL.look); AF.shadowFocus.set(pl.x, 0, pl.z); AF.shadowRadius = 90;
      AF.emit('hud', { mode: 'fly', speed: pl.v * 2.237, alt: Math.max(0, pl.y - Math.max(0, ground(pl.x, pl.z))), throttle: pl.throttle, car: pl.name });
      // ---- getting out (on the ground, nearly stopped)
      if (I.hit('KeyF') || I.hit('Escape') || I.hit('KeyX')) {
        if (pl.onGround && pl.v < 4) { pl.v = 0; const sx = Math.cos(pl.yaw), sz = -Math.sin(pl.yaw), off = Math.min(pl.G.halfW, 3) + 1.2; AF.setMode('walk', { x: pl.x + sx * off, z: pl.z + sz * off, yaw: pl.yaw + PI / 2 }); }
        else AF.emit('toast', 'Land and slow down first!');
      }
    },
  };

  // ---------------------------------------------------------------- the apron line-up + a sightseeing Cub circling the city
  AF.onBuild('planes', 640, () => {
    const z = A.apron[1] + 22, yaw = PI;   // noses toward the taxiway
    make('cub', -560, z, yaw); make('biplane', -520, z, yaw); make('racer', -480, z, yaw); make('airliner', -410, z - 2, yaw);
    // the sightseer: no physics, a slow lazy loop over the whole map
    const G = planeGeo('biplane'), root = new THREE.Group(), body = AF.modelMesh(G.geo), prop = AF.modelMesh(G.pgeo);
    body.castShadow = false; root.add(body); prop.position.copy(G.props[0]); root.add(prop); root.rotation.order = 'YXZ'; AF.scene.add(root);
    AF.onTick('plane-sightseer', 440, (dt, t) => {
      const a = t * 0.028, R = 330, cx = -180, cz = -20;
      const x = cx + Math.cos(a) * R * 1.3, zz = cz + Math.sin(a) * R, y = 150 + Math.sin(a * 3) * 12;
      root.position.set(x, y, zz); root.rotation.set(0, Math.atan2(-Math.sin(a) * 1.3, Math.cos(a)), -0.35, 'YXZ'); prop.rotation.z = t * 40;
    });
  });
  AF.test('planes: W taxis, Space takes off + climbs, Shift descends', () => {
    const pl = PL.list.find((p) => p.id === 'cub'); if (!pl) return { ok: false, info: 'no cub' };
    // drive the flight model directly (no mode switch, title modal bypassed) and put everything back afterwards
    const I = AF.input, keys = ['KeyW', 'Space', 'ShiftLeft'], saveCur = PL.cur, saveModal = AF.ui && AF.ui.modalOpen, cam = AF.camera, cp = cam.position.clone(), cq = cam.quaternion.clone();
    const run = (s) => { for (let i = 0; i < s * 30; i++) AF.modes.fly.update(1 / 30); };
    let taxi = 0, up = {}, down = {};
    try {
      if (AF.ui) AF.ui.modalOpen = () => false;
      PL.cur = pl; pl.x = A.runway.x0 + 20; pl.z = A.runway.z; pl.yaw = PI / 2; pl.y = AF.W.groundY(pl.x, pl.z); pl.v = pl.throttle = pl.pitch = 0; pl.onGround = true;
      I.down.add('KeyW'); run(3); taxi = pl.v; I.down.delete('KeyW');
      I.down.add('Space'); run(9); up = { air: !pl.onGround, y: pl.y, pitch: pl.pitch }; I.down.delete('Space');
      I.down.add('ShiftLeft'); run(2); down = { pitch: pl.pitch, thr: pl.throttle };
    } finally {
      for (const k of keys) I.down.delete(k);
      PL.cur = saveCur; if (AF.ui) AF.ui.modalOpen = saveModal; PL.reset(pl); AF.emit('hud', { speed: null }); cam.position.copy(cp); cam.quaternion.copy(cq); FL.init = false;
    }
    const ok = taxi > 3 && taxi < 9 && up.air && up.y > 20 && up.pitch < 0.4 && down.pitch < 0 && down.thr < 0.2;
    return { ok, info: `taxi ${taxi.toFixed(1)} m/s, after Space y ${up.y.toFixed(1)} pitch ${up.pitch.toFixed(2)}, Shift pitch ${down.pitch.toFixed(2)} throttle ${down.thr.toFixed(2)}` };
  });
}

} catch (e) { AF.partError('52-planes.js', e); }
