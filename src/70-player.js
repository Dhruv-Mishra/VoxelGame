// ================================================================ 70-player.js
try {
// ===== 70-player: the player character, 'aerial' orbit camera + 'walk' third/first-person modes  (OWNER: player) =====
// AF.player = {x,y,z,yaw, body, mesh, visible, setVisible(b), teleport(x,y,z,yaw)}
// AF.flyTo(pos, target, dur)  AF.interactTarget  AF.emit('interact', target)
{
  const PI = Math.PI, TAU = PI * 2;
  const V3 = () => new THREE.Vector3();
  const G = () => (AF.W && AF.W.groundY) ? AF.W.groundY : () => 0;
  const PL = AF.PL = AF.PL || {};

  // ------------------------------------------------------------------ the character (1/16 voxels)
  const body = { x: 0, y: 0.25, z: 28, vy: 0, r: 0.3, h: 1.7, onGround: true };
  const player = AF.player = {
    x: 0, y: 0.25, z: 28, yaw: PI, body, mesh: null, visible: true, parts: null,
    setVisible(b) { player.visible = !!b; if (player.mesh) player.mesh.visible = !!b && !PL.hideMesh; },
    teleport(x, y, z, yaw) {
      if (!isFinite(x) || !isFinite(z)) return;
      let yy = isFinite(y) ? y : 60;
      const s = AF.surfaceBelow ? AF.surfaceBelow(x, z, yy + 0.6, isFinite(y) ? 3 : 80) : yy;
      body.x = x; body.z = z; body.y = isFinite(s) ? (isFinite(y) ? Math.max(s, y - 0.6) : s) : yy; body.vy = 0; body.onGround = true;
      if (isFinite(yaw)) { player.yaw = yaw; WK.camYaw = yaw + PI; }
      player.x = body.x; player.y = body.y; player.z = body.z;
      WK.boom = 0.5; WK.blend = 1;
      if (player.mesh) { player.mesh.position.set(body.x, body.y, body.z); player.mesh.rotation.y = player.yaw; }
    },
  };

  const buildCharacter = () => {
    const M = (w, h, d) => new AF.Model(w, h, d);
    const C = {
      skin: AF.col(0xe9b48c, { jitter: 0.08, edge: 0.15 }), skinS: AF.col(0xd39770, { jitter: 0.08, edge: 0.15 }),
      blush: AF.col(0xe7968a, { jitter: 0.05, edge: 0.1 }), eye: AF.col(0x2a211c, { jitter: 0, edge: 0 }), white: AF.col(0xf6f1e6, { jitter: 0.05, edge: 0.1 }),
      mouth: AF.col(0xa4544a, { jitter: 0, edge: 0.1 }), hair: AF.col(0x6b4226, { jitter: 0.3, edge: 0.3 }),
      cap: AF.col(0x2d4270, { jitter: 0.15, edge: 0.3 }), capD: AF.col(0x1f2d4d, { jitter: 0.1, edge: 0.3 }), capB: AF.col(0xc0392b, { jitter: 0.1, edge: 0.2 }),
      capBadge: AF.col(0xf0e2bd, { jitter: 0.05, edge: 0.2 }),
      red: AF.col(0xb8322c, { jitter: 0.22, edge: 0.3 }), redD: AF.col(0x87231f, { jitter: 0.15, edge: 0.3 }), redL: AF.col(0xc9433a, { jitter: 0.2, edge: 0.3 }),
      button: AF.col(0xeedcb0, { jitter: 0.05, edge: 0.2 }), shirt: AF.col(0xf2eee2, { jitter: 0.08, edge: 0.2 }),
      jean: AF.col(0x3f5f8f, { jitter: 0.25, edge: 0.3 }), jeanD: AF.col(0x324d78, { jitter: 0.2, edge: 0.3 }), cuff: AF.col(0x7596bf, { jitter: 0.15, edge: 0.3 }),
      stitch: AF.col(0xc79a55, { jitter: 0.1, edge: 0.1 }), shoe: AF.col(0x6a4028, { jitter: 0.2, edge: 0.35 }), sole: AF.col(0x2b1e15, { jitter: 0.1, edge: 0.2 }),
      lace: AF.col(0xe8dcc0, { jitter: 0, edge: 0.1 }), belt: AF.col(0x4a3020, { jitter: 0.1, edge: 0.2 }), buckle: AF.col(0xd9b45a, { jitter: 0.05, edge: 0.2 }),
    };
    // leg: w4 h12 d6 ; z+ = front. pivot at top.
    const leg = (side) => {
      const m = M(4, 12, 6);
      m.box(0, 3, 1, 4, 12, 5, C.jean);
      m.box(0, 3, 1, 4, 4, 5, C.cuff);                 // rolled cuff
      m.box(side > 0 ? 3 : 0, 5, 3, side > 0 ? 4 : 1, 12, 4, C.stitch); // outer seam
      m.box(0, 7, 4, 4, 8, 5, C.jeanD);                 // knee crease
      m.box(0, 0, 0, 4, 1, 6, C.sole);                  // shoe
      m.box(0, 1, 0, 4, 3, 6, C.shoe);
      m.box(1, 2, 4, 3, 3, 5, C.lace); m.set(1, 2, 5, C.shoe);
      return m;
    };
    // torso: w9 h9 d5 ; bottom row = belt/jeans, cardigan above, neck row on top
    const torso = () => {
      const m = M(9, 9, 5);
      m.box(0, 0, 0, 9, 1, 5, C.jeanD); m.box(0, 0, 4, 9, 1, 5, C.belt); m.box(0, 0, 0, 9, 1, 1, C.belt); m.set(4, 0, 4, C.buckle);
      m.box(0, 1, 0, 9, 8, 5, C.red);
      m.box(0, 1, 0, 9, 2, 5, C.redD);                  // ribbed hem
      m.box(0, 7, 0, 9, 8, 5, C.redL);                  // shoulders catch the light
      // V neck with white shirt + collar
      m.box(3, 5, 4, 6, 8, 5, C.shirt); m.box(2, 7, 4, 7, 8, 5, C.shirt); m.set(3, 5, 4, C.red); m.set(5, 5, 4, C.red);
      m.set(2, 7, 4, C.white); m.set(6, 7, 4, C.white);
      m.box(4, 1, 4, 5, 5, 5, C.redD);                  // button band
      m.set(4, 2, 4, C.button); m.set(4, 4, 4, C.button);
      m.box(1, 2, 4, 3, 4, 5, C.redD); m.box(6, 2, 4, 8, 4, 5, C.redD); // pockets
      m.box(3, 8, 1, 6, 9, 4, C.skinS);                 // neck
      return m;
    };
    const arm = () => {
      const m = M(3, 9, 3);
      m.box(0, 2, 0, 3, 9, 3, C.red); m.box(0, 2, 0, 3, 3, 3, C.shirt); m.box(0, 3, 0, 3, 4, 3, C.redD); m.box(0, 8, 0, 3, 9, 3, C.redL); m.set(1, 6, 0, C.redD);
      m.box(0, 0, 0, 3, 2, 3, C.skin); m.set(1, 0, 2, C.skinS);
      return m;
    };
    // head: w8 h8 d9 (skin cube x1..7, y0..6, z1..7) + cap with brim forward
    const head = () => {
      const m = M(8, 8, 9);
      m.box(1, 0, 1, 7, 6, 7, C.skin);
      m.box(1, 0, 1, 7, 1, 2, C.skinS);
      m.box(1, 1, 1, 7, 5, 2, C.hair); m.box(1, 2, 1, 2, 5, 4, C.hair); m.box(6, 2, 1, 7, 5, 4, C.hair); // back + sideburns
      m.set(0, 2, 4, C.skinS); m.set(0, 3, 4, C.skinS); m.set(7, 2, 4, C.skinS); m.set(7, 3, 4, C.skinS); // ears
      m.set(2, 3, 6, C.eye); m.set(5, 3, 6, C.eye); m.set(2, 4, 6, C.hair); m.set(5, 4, 6, C.hair); // eyes + brows
      m.set(3, 2, 7, C.skinS); m.set(4, 2, 7, C.skinS);  // nose
      m.set(3, 1, 6, C.mouth); m.set(4, 1, 6, C.mouth);
      m.set(1, 2, 6, C.blush); m.set(6, 2, 6, C.blush);
      m.box(1, 5, 1, 7, 7, 7, C.cap); m.box(2, 7, 2, 6, 8, 6, C.cap); m.set(3, 7, 3, C.capB); m.set(4, 7, 4, C.capB);
      m.box(1, 5, 7, 7, 6, 9, C.capD);                  // brim
      m.box(3, 5, 6, 5, 7, 7, C.capBadge);              // front badge
      m.box(1, 5, 1, 7, 6, 2, C.capD);                  // back strap
      return m;
    };
    const vs = 1 / 16;
    const gLegL = AF.meshModel(leg(-1), { vs, anchor: [0.5, 1, 0.5] }), gLegR = AF.meshModel(leg(1), { vs, anchor: [0.5, 1, 0.5] });
    const gTorso = AF.meshModel(torso(), { vs, anchor: [0.5, 0, 0.5] });
    const gArm = AF.meshModel(arm(), { vs, anchor: [0.5, 1, 0.5] });
    const gHead = AF.meshModel(head(), { vs, anchor: [0.5, 0, 0.5] });
    const root = new THREE.Group(); root.name = 'player';
    const hips = new THREE.Group(); hips.position.y = 0.75; root.add(hips);
    const legL = AF.modelMesh(gLegL); legL.position.set(-0.125, 0, 0); hips.add(legL);
    const legR = AF.modelMesh(gLegR); legR.position.set(0.125, 0, 0); hips.add(legR);
    const chest = new THREE.Group(); chest.position.y = 0.02; hips.add(chest);  // waist pivot
    const torsoM = AF.modelMesh(gTorso); torsoM.position.set(0, -0.02, 0); chest.add(torsoM);
    const armL = AF.modelMesh(gArm); armL.position.set(-0.36, 0.46, 0); chest.add(armL);
    const armR = AF.modelMesh(gArm); armR.position.set(0.36, 0.46, 0); chest.add(armR);
    const headG = new THREE.Group(); headG.position.set(0, 0.52, 0.0); chest.add(headG);
    const headM = AF.modelMesh(gHead); headM.position.z = -0.03; headG.add(headM);
    // frustumCulled=false keeps the player out of the core distance cull (03-render dyn-cull) — the player is always near the camera it matters for
    for (const m of [legL, legR, torsoM, armL, armR, headM]) { m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false; }
    player.parts = { root, hips, legL, legR, chest, torso: torsoM, armL, armR, head: headG };
    player.mesh = root;
    AF.scene.add(root);
  };

  // ------------------------------------------------------------------ animation
  const AN = { phase: 0, speed: 0, air: 0, t: 0, land: 0 };
  const animate = (dt, hs, onGround) => {
    const P = player.parts; if (!P) return;
    AN.t += dt; AN.speed = AF.lerp(AN.speed, hs, 1 - Math.exp(-dt * 10));
    const s = AN.speed, amp = AF.clamp(s / 5, 0, 1.25);
    AN.phase += dt * (s > 0.2 ? 2.1 + s * 1.05 : 0);
    const sw = Math.sin(AN.phase);
    AN.air = AF.lerp(AN.air, onGround ? 0 : 1, 1 - Math.exp(-dt * 12));
    const a = AN.air, idle = Math.max(0, 1 - s / 1.5);
    const breathe = Math.sin(AN.t * 2.2) * 0.012 * idle;
    P.legL.rotation.x = AF.lerp(-sw * 0.75 * Math.min(amp, 1), -0.55, a);
    P.legR.rotation.x = AF.lerp(sw * 0.75 * Math.min(amp, 1), 0.35, a);
    P.armL.rotation.x = AF.lerp(sw * 0.7 * Math.min(amp, 1.1), -2.3, a * 0.8);
    P.armR.rotation.x = AF.lerp(-sw * 0.7 * Math.min(amp, 1.1), -0.4, a * 0.8);
    P.armL.rotation.z = -0.06 - idle * 0.02 - a * 0.15; P.armR.rotation.z = 0.06 + idle * 0.02 + a * 0.15;
    P.hips.position.y = 0.75 + Math.abs(Math.cos(AN.phase)) * 0.045 * Math.min(amp, 1) + breathe - AN.land * 0.08;
    P.chest.rotation.x = Math.min(amp, 1.2) * 0.12 + breathe * 2;
    P.chest.rotation.y = sw * 0.08 * Math.min(amp, 1);
    P.head.rotation.x = -Math.min(amp, 1.2) * 0.08 + Math.sin(AN.t * 0.7) * 0.03 * idle;
    P.head.rotation.y = Math.sin(AN.t * 0.37) * 0.25 * idle * idle;
    AN.land = Math.max(0, AN.land - dt * 5);
  };

  // ------------------------------------------------------------------ helpers
  const groundAt = (x, z) => { try { return G()(x, z); } catch (e) { return 0; } };
  const solid = (x, y, z) => AF.solidAt ? AF.solidAt(x, y, z) : y < groundAt(x, z);
  const cam = () => AF.camera;
  const inModal = () => !!(AF.ui && AF.ui.modalOpen && AF.ui.modalOpen());
  const onPanel = () => !!(AF.ui && AF.ui.pointerOnPanel);
  const markInput = () => { AE.lastInput = AF.clock.t; };

  // ------------------------------------------------------------------ AERIAL
  const AE = PL.aerial = {
    focus: new THREE.Vector3(10, 0, -10), dist: 300, yaw: 0, pitch: 0.4,       // targets
    f: new THREE.Vector3(10, 0, -10), d: 300, y: 0, p: 0.4,                        // smoothed
    lastInput: 0, fly: null, spin: 0, started: false,
  };
  const MIN_P = 12 * PI / 180, MAX_P = 85 * PI / 180, MIN_D = 15, MAX_D = 560;
  const orbitFrom = (pos, target) => {
    const dx = pos[0] - target[0], dy = pos[1] - target[1], dz = pos[2] - target[2];
    const d = Math.max(MIN_D, Math.min(MAX_D, Math.hypot(dx, dy, dz)));
    return { f: new THREE.Vector3(target[0], target[1], target[2]), d, yaw: Math.atan2(dx, dz), pitch: AF.clamp(Math.asin(AF.clamp(dy / Math.hypot(dx, dy, dz), -1, 1)), MIN_P, MAX_P) };
  };
  const setOrbit = (o, snap) => {
    AE.focus.copy(o.f); AE.dist = o.d; AE.yaw = o.yaw; AE.pitch = o.pitch;
    if (snap) { AE.f.copy(o.f); AE.d = o.d; AE.y = o.yaw; AE.p = o.pitch; }
  };
  const applyAerialCamera = () => {
    const c = cam(), cp = Math.cos(AE.p);
    let px = AE.f.x + Math.sin(AE.y) * cp * AE.d, py = AE.f.y + Math.sin(AE.p) * AE.d, pz = AE.f.z + Math.cos(AE.y) * cp * AE.d;
    // never below the ground (heightmap + anything solid)
    const gy = groundAt(px, pz) + 2.0;
    if (py < gy) py = gy;
    let k = 0; while (k++ < 40 && solid(px, py, pz)) py += 0.5;
    c.position.set(px, py, pz);
    AF.camTarget.copy(AE.f);
    c.lookAt(AE.f);
    AF.shadowFocus.set(AE.f.x, 0, AE.f.z);
    AF.shadowRadius = Math.round(AF.clamp(AE.d * 0.5, 70, 220) / 10) * 10;
  };
  AF.flyTo = (pos, target, dur) => {
    if (!pos || !target) return;
    PL.stopCine && PL.stopCine();
    const o = orbitFrom(pos, target);
    if (AF.mode !== 'aerial') AF.setMode('aerial', { keep: true, noSnap: true });
    const travel = Math.hypot(o.f.x - AE.f.x, o.f.z - AE.f.z);
    AE.fly = { t: 0, dur: dur || AF.clamp(1.4 + travel / 180, 1.6, 3.6), f0: AE.f.clone(), d0: AE.d, y0: AE.y, p0: AE.p, o, bump: Math.max(0, travel * 0.55 - Math.max(AE.d, o.d) * 0.3) };
    markInput();
  };
  // ------------------------------------------------------------------ CINEMATIC OPENER (title flyover, loops until a mode is chosen)
  // Round 2: the opener cuts between the golden-hour exterior shots of the FILM MODE tour (tested paths, dip to black at each cut):
  // the harbour + Solace Point Light, the skyline crown, the blimp, Grand Avenue, Civic Plaza + the dome, Swan Lake, the boardwalk.
  const CINE_SEQ = [0, 1, 2, 3, 5, 6, 7];
  const CN = PL.cine = { on: false, t: 0, total: 0, curP: null, times: [], idleResume: 30, stopT: -1e9, gulls: null, black: 0, seq: CINE_SEQ, shot: -1 };
  const cinePrep = () => {
    if (CN.curP) return;
    let acc = 0; CN.times = CINE_SEQ.map((i) => { const t = acc; acc += FILM_SHOTS[i].dur; return t; });
    CN.total = acc; CN.curP = true;
  };
  const CPOS = V3(), CTGT = V3();
  const cineEval = (t) => {
    const tt = ((t % CN.total) + CN.total) % CN.total;
    let k = 0; while (k < CINE_SEQ.length - 1 && tt >= CN.times[k + 1]) k++;
    const i = CINE_SEQ[k], S = FILM_SHOTS[i], lt = tt - CN.times[k];
    if (CN.shot !== k) {                                   // a cut: set up the dynamic subject (blimp side) like the film does
      CN.shot = k; FM.dyn = {};
      if (S.dyn === 'blimp') { const B = AF.portSolaceFX && AF.portSolaceFX.blimp; if (B && B.mesh) { const yaw = B.mesh.rotation.y, p = B.mesh.position; FM.dyn.side = ((p.x - 10) * Math.cos(yaw) - (p.z + 30) * Math.sin(yaw)) >= 0 ? 1 : -1; } }
      const c = cam(); c.fov = S.fov || 45; c.updateProjectionMatrix();
    }
    filmEval(i, lt); CPOS.copy(FP); CTGT.copy(FT);
    CN.black = AF.clamp(Math.max(1 - lt / 0.5, 1 - (S.dur - lt) / 0.5), 0, 1);
  };
  PL.startCine = (t0) => { cinePrep(); CN.on = true; CN.t = t0 || 0; if (AF.mode !== 'aerial' && AF.modes.aerial) AF.setMode('aerial', { keep: true }); };
  PL.stopCine = () => { if (!CN.on) return; CN.on = false; CN.black = 0; CN.shot = -1; { const c = cam(); if (c.fov !== 50 && !FM.on) { c.fov = 50; c.updateProjectionMatrix(); } } CN.stopT = AF.clock.t; if (CN.gulls) CN.gulls.root.visible = false; if (AF.post) AF.post.tiltEnabled = true; };
  // three gulls that cross the lens during the low harbour leg
  const makeGulls = () => {
    const m = new AF.Model(12, 3, 7), w = new AF.Model(12, 1, 4);
    const Wt = AF.col(0xf4f1ea, { jitter: 0.05, edge: 0.15 }), Gy = AF.col(0x9aa3ab, { jitter: 0.05, edge: 0.2 }), Bk = AF.col(0x25292d, { jitter: 0, edge: 0 }), Yl = AF.col(0xe8b33a, { jitter: 0, edge: 0.1 });
    m.box(2, 0, 2, 10, 3, 5, Wt); m.box(10, 1, 2, 12, 3, 5, Wt); m.set(11, 2, 2, Bk); m.set(11, 2, 4, Bk); m.box(0, 1, 3, 2, 2, 4, Gy);
    m.set(12 - 1, 1, 3, Yl);
    w.box(0, 0, 0, 12, 1, 3, Wt); w.box(0, 0, 3, 7, 1, 4, Wt); w.box(9, 0, 0, 12, 1, 2, Bk); w.box(2, 0, 1, 8, 1, 2, Gy);
    const gB = AF.meshModel(m, { vs: 1 / 16, anchor: [0.5, 0.5, 0.5] }), gW = AF.meshModel(w, { vs: 1 / 16, anchor: [0, 0.5, 0.5] });
    const root = new THREE.Group(); root.visible = false; AF.scene.add(root);
    const list = [];
    for (let i = 0; i < 3; i++) {
      const g = new THREE.Group(), b = AF.modelMesh(gB); b.rotation.y = -PI / 2; g.add(b);
      const wl = new THREE.Group(), wr = new THREE.Group(), ml = AF.modelMesh(gW), mr = AF.modelMesh(gW);
      mr.rotation.y = PI; wl.add(ml); wr.add(mr); wl.position.y = 0.05; wr.position.y = 0.05;
      g.add(wl); g.add(wr);
      for (const q of [b, ml, mr]) { q.frustumCulled = false; q.castShadow = false; }
      g.scale.setScalar(1.6); root.add(g); list.push({ g, wl, wr, ph: i * 1.7 });
    }
    CN.gulls = { root, list };
  };
  const GF = V3(), GR = V3(), GU = new THREE.Vector3(0, 1, 0);
  const updateGulls = (dt) => {
    if (!CN.gulls) return;
    const tt = CN.t % CN.total, on = tt > 0.6 && tt < 9.5;
    CN.gulls.root.visible = on; if (!on) return;
    const c = cam(); c.getWorldDirection(GF); GR.crossVectors(GF, GU).normalize();
    CN.gulls.list.forEach((q, i) => {
      const u = (tt - 0.6 - i * 1.1) / 4.2;               // each gull sweeps right→left across the frame
      const d = 7 + i * 3.5, sx = (1.4 - u * 2.8) * d * 0.9, sy = 0.9 + i * 0.7 + Math.sin(tt * 1.3 + i) * 0.4;
      q.g.visible = u > -0.2 && u < 1.2;
      q.g.position.copy(c.position).addScaledVector(GF, d).addScaledVector(GR, sx).addScaledVector(GU, sy);
      q.g.rotation.set(0, Math.atan2(-GR.x, -GR.z), 0);
      const f = Math.sin(tt * 7 + q.ph) * 0.6;
      q.wl.rotation.z = f; q.wr.rotation.z = -f;
    });
  };
  const cineUpdate = (dt) => {
    CN.t += dt;
    cineEval(CN.t);
    const c = cam();
    let px = CPOS.x, py = CPOS.y, pz = CPOS.z;
    const gy = Math.max(groundAt(px, pz), -1.25) + 3.5; if (py < gy) py = gy;
    let k = 0; while (k++ < 40 && solid(px, py, pz)) py += 0.5;
    c.position.set(px, py, pz); c.lookAt(CTGT);
    AF.camTarget.copy(CTGT);
    // keep the orbit state in step so any hand-off (look around / flyTo) starts from here
    const o = orbitFrom([px, py, pz], [CTGT.x, CTGT.y, CTGT.z]); setOrbit(o, true);
    const fx = px + (CTGT.x - px) * 0.45, fz = pz + (CTGT.z - pz) * 0.45;
    AF.shadowFocus.set(fx, 0, fz); AF.shadowRadius = Math.round(AF.clamp(py * 1.6 + 60, 80, 220) / 10) * 10;
    if (AF.post) AF.post.tiltEnabled = false;          // the opener is a film shot, not a miniature: no blurred bottom third
    updateGulls(dt);
  };
  const LOOK_VIEW = { pos: [150, 128, -300], target: [10, 8, -10] };   // from the NNE toward the SW sun (off-axis, no washout), ~21° pitch
  PL.lookView = LOOK_VIEW;

  AF.modes.aerial = {
    enter(opts = {}, from) {
      const c = cam();
      if (opts.pos && opts.target) { PL.stopCine(); setOrbit(orbitFrom(opts.pos, opts.target), !opts.glide); }
      else if (from === 'walk' || opts.focusPlayer) {
        // pull up from the player
        const o = { f: new THREE.Vector3(body.x, body.y, body.z), d: 46, yaw: WK.camYaw, pitch: 0.62 };
        AE.f.set(body.x, body.y + 1.5, body.z); AE.d = Math.max(4, c.position.distanceTo(AE.f)); AE.y = WK.camYaw; AE.p = AF.clamp(WK.camPitch, MIN_P, MAX_P);
        setOrbit(o, false);
      } else if (opts.keep || opts.noSnap) {
        // start from wherever the camera is
        const t = AF.camTarget && AF.camTarget.lengthSq() > 0 ? AF.camTarget : new THREE.Vector3(0, 0, 0);
        const o = orbitFrom([c.position.x, c.position.y, c.position.z], [t.x, t.y, t.z]);
        setOrbit(o, true);
      } else if (!AE.started || from == null) {
        const v = AF.PLAN.views[0];
        setOrbit(orbitFrom(v.pos, v.target), true);
      }
      AE.started = true; AE.lastInput = AF.clock.t; AE.lockY = !!(opts.pos && opts.target);
      if (player.mesh) player.mesh.visible = player.visible;
      AF.interactTarget = null;
      applyAerialCamera();
    },
    exit() { AE.fly = null; PL.stopCine(); },
    update(dt) {
      const I = AF.input, m = I.mouse, modal = inModal();
      const shift = I.key('ShiftLeft') || I.key('ShiftRight');
      const titleUp = !!(AF.ui && AF.ui.titleOpen && AF.ui.titleOpen());
      if (CN.on) {
        // any camera input takes over from the film; it resumes after a while if the title is still up
        const took = !modal && !onPanel() && (((m.buttons & 7) && (m.dx || m.dy)) || m.wheel || ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyQ', 'KeyE', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].some((k) => I.key(k)));
        if (!titleUp || took) { PL.stopCine(); markInput(); }
        else { cineUpdate(dt); player.x = body.x; player.y = body.y; player.z = body.z; animate(dt, 0, true); return; }
      } else if (titleUp && CN.curP && AF.clock.t - AE.lastInput > CN.idleResume && !AE.fly) { PL.startCine(CN.t); }
      if (!modal) {
        // mouse
        if (onPanel()) { /* dragging a UI control */ }
        else if ((m.buttons & 2) || ((m.buttons & 1) && shift) || (m.buttons & 4)) {
          if (m.dx || m.dy) {
            const k = AE.dist * 0.0016, cy = Math.cos(AE.yaw), sy = Math.sin(AE.yaw), sp = Math.max(0.35, Math.sin(AE.pitch));
            // grab-the-map: right = (cy,-sy), forward = (-sy,-cy)
            AE.focus.x += (-m.dx * cy - m.dy * sy / sp) * k;
            AE.focus.z += (m.dx * sy - m.dy * cy / sp) * k; AE.lockY = false;
            markInput(); AE.fly = null;
          }
        } else if (m.buttons & 1) {
          if (m.dx || m.dy) { AE.yaw -= m.dx * 0.0055; AE.pitch = AF.clamp(AE.pitch + m.dy * 0.004, MIN_P, MAX_P); markInput(); AE.fly = null; }
        }
        if (m.wheel) {
          // owner 09-28: scrolling all the way back in returns you to your character
          if (m.wheel < 0 && AE.dist <= MIN_D * 1.35 && AF.modes.walk) { AE.zin = (AE.zin || 0) - m.wheel; if (AE.zin > 120) { AE.zin = 0; AF.setMode('walk', { x: body.x, y: body.y, z: body.z, yaw: player.yaw }); return; } }
          else AE.zin = 0;
          AE.dist = AF.clamp(AE.dist * Math.exp(m.wheel * 0.0011), MIN_D, MAX_D); markInput(); AE.fly = null;
        }
        // keys: pan relative to the view
        let fx = 0, fz = 0;
        if (I.key('KeyW') || I.key('ArrowUp')) fz -= 1;
        if (I.key('KeyS') || I.key('ArrowDown')) fz += 1;
        if (I.key('KeyA') || I.key('ArrowLeft')) fx -= 1;
        if (I.key('KeyD') || I.key('ArrowRight')) fx += 1;
        if (fx || fz) {
          const sp = AE.dist * (shift ? 1.8 : 0.9) * dt, cy = Math.cos(AE.yaw), sy = Math.sin(AE.yaw);
          // forward on screen = -(sin yaw, cos yaw)
          AE.focus.x += (fx * cy + fz * sy) * sp; AE.focus.z += (-fx * sy + fz * cy) * sp; AE.lockY = false;
          markInput(); AE.fly = null;
        }
        if (I.key('KeyQ')) { AE.yaw += dt * 1.3; markInput(); AE.fly = null; }
        if (I.key('KeyE')) { AE.yaw -= dt * 1.3; markInput(); AE.fly = null; }
        if (I.key('Equal') || I.key('NumpadAdd')) { AE.dist = AF.clamp(AE.dist * Math.exp(-dt * 1.5), MIN_D, MAX_D); markInput(); }
        if (I.key('Minus') || I.key('NumpadSubtract')) { AE.dist = AF.clamp(AE.dist * Math.exp(dt * 1.5), MIN_D, MAX_D); markInput(); }
        if (I.hit('Tab')) { AF.setMode('walk', { x: body.x, y: body.y, z: body.z, yaw: player.yaw }); return; }
      }
      AE.focus.x = AF.clamp(AE.focus.x, AF.W.X0 + 10, 290); AE.focus.z = AF.clamp(AE.focus.z, -290, 290);
      // idle auto-rotate
      const idleFor = AF.clock.t - AE.lastInput;
      const title = AF.ui && AF.ui.titleOpen && AF.ui.titleOpen();
      const spinT = (idleFor > 25 || title) && !AE.fly ? 1 : 0;
      AE.spin = AF.lerp(AE.spin, spinT, 1 - Math.exp(-dt * 0.6));
      AE.yaw += dt * 0.035 * AE.spin;
      // fly-to
      if (AE.fly) {
        const F = AE.fly; F.t += dt;
        const u = AF.clamp(F.t / F.dur, 0, 1), e = u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
        AE.f.lerpVectors(F.f0, F.o.f, e);
        AE.d = Math.exp(AF.lerp(Math.log(F.d0), Math.log(F.o.d), e)) + Math.sin(u * PI) * F.bump;
        AE.y = F.y0 + AF.angDiff(F.y0, F.o.yaw) * e;
        AE.p = AF.lerp(F.p0, F.o.pitch, e);
        AE.focus.copy(AE.f); AE.dist = F.o.d; AE.yaw = AE.y; AE.pitch = F.o.pitch;
        if (u >= 1) { AE.fly = null; AE.yaw = F.o.yaw; AE.y = F.o.yaw; AE.lockY = true; if (F.then) F.then(); }
      } else {
        const k = 1 - Math.exp(-dt * 6);
        // keep the focus resting on the ground
        const gy = groundAt(AE.focus.x, AE.focus.z);
        if (!AE.lockY) AE.focus.y = AF.lerp(AE.focus.y, Math.max(0, gy), 1 - Math.exp(-dt * 3));
        AE.f.lerp(AE.focus, k);
        AE.d = Math.exp(AF.lerp(Math.log(AE.d), Math.log(AE.dist), k));
        AE.y += AF.angDiff(AE.y, AE.yaw) * k;
        AE.p = AF.lerp(AE.p, AE.pitch, k);
      }
      applyAerialCamera();
      player.x = body.x; player.y = body.y; player.z = body.z;
      animate(dt, 0, true);
    },
  };

  // ray pick: march the voxel world (heightmap + solid voxels + colliders) from the camera through the mouse
  const RC = new THREE.Raycaster(), NDC = new THREE.Vector2();
  AF.pickWorld = (clientX, clientY, maxD = 1400) => {
    const cv = AF.renderer.domElement, r = cv.getBoundingClientRect();
    NDC.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    RC.setFromCamera(NDC, cam());
    const o = RC.ray.origin, d = RC.ray.direction;
    let t = 0.5, step = 0.5;
    for (; t < maxD; t += step) {
      const x = o.x + d.x * t, y = o.y + d.y * t, z = o.z + d.z * t;
      if (x < AF.W.X0 || x > 300 || z < -300 || z > 300) { if (t > 50 && y < -20) break; continue; }
      if (solid(x, y, z)) {
        // refine
        let a = t - step, b = t;
        for (let i = 0; i < 8; i++) { const mm = (a + b) / 2; if (solid(o.x + d.x * mm, o.y + d.y * mm, o.z + d.z * mm)) b = mm; else a = mm; }
        return { x: o.x + d.x * a, y: o.y + d.y * a, z: o.z + d.z * a, t: a };
      }
      step = t > 200 ? 1.0 : 0.5;
      if (y < -16) break;
    }
    return null;
  };
  // a walkable place near a picked point (roofs -> the building's front door)
  const landingFor = (p) => {
    const gy = groundAt(p.x, p.z);
    const b = AF.buildingAt && AF.buildingAt(p.x, Math.min(p.y, gy + 1.2), p.z) || (p.y > gy + 2.5 && AF.buildings.find((B) => p.x >= B.box[0] && p.x <= B.box[3] && p.z >= B.box[2] && p.z <= B.box[5]));
    if (b && p.y > gy + 2.5 && b.doors && b.doors.length) {
      const d = b.doors[0];
      return { x: d.x - Math.sin(d.yaw || 0) * 1.5, y: (d.y ?? 0.25) + 0.3, z: d.z - Math.cos(d.yaw || 0) * 1.5, yaw: d.yaw || 0 };
    }
    const y = AF.surfaceBelow ? AF.surfaceBelow(p.x, p.z, p.y + 0.6, 6) : gy;
    return { x: p.x, y, z: p.z, yaw: AE.y + PI };
  };
  PL.flyDownTo = (p) => {
    const L = landingFor(p);
    const back = AE.y;
    const pos = [L.x + Math.sin(back) * 9, L.y + 6, L.z + Math.cos(back) * 9];
    AF.flyTo(pos, [L.x, L.y + 1, L.z], 1.5);
    if (AE.fly) AE.fly.then = () => AF.setMode('walk', { x: L.x, y: L.y, z: L.z, yaw: back + PI });
  };
  {
    const cv = document.getElementById('cv');
    cv && cv.addEventListener('dblclick', (e) => {
      if (!AF.ready || AF.mode !== 'aerial' || inModal()) return;
      const p = AF.pickWorld(e.clientX, e.clientY); if (!p) return;
      PL.flyDownTo(p);
    });
  }

  // ------------------------------------------------------------------ WALK (third person + first person)
  const WK = PL.walk = { camYaw: 0, camPitch: 0.22, boom: 3, fp: false, blend: 1, from: V3(), fromQ: new THREE.Quaternion(), lastMouse: 0, indoor: 0, fallT: 0 };
  const TMP = V3(), TMP2 = V3(), LOOK = V3();
  const WALK = 5.8, RUN = 9.5;
  const vel = { x: 0, z: 0 };
  const findInteract = () => {
    let best = null, bd = 1e9;
    const px = body.x, pz = body.z, py = body.y + 1.0;
    for (const it of AF.interacts) {
      const dx = it.x - px, dz = it.z - pz, dy = (it.y ?? py) - py;
      const r = it.r ?? 2.2;
      if (Math.abs(dy) > 2.4) continue;
      const d = Math.hypot(dx, dz); if (d > r || d >= bd) continue;
      let ok = true; if (it.can) { try { ok = !!it.can(); } catch (e) { ok = false; } }
      if (!ok) continue;
      bd = d; best = it;
    }
    return best;
  };
  const walkCamera = (dt) => {
    const c = cam();
    const hx = body.x, hy = body.y + 1.58, hz = body.z;
    if (WK.fp) {
      c.position.set(hx, body.y + 1.62, hz);
      const p = -WK.camPitch, yaw = WK.camYaw + PI;
      LOOK.set(hx + Math.sin(yaw) * Math.cos(p) * 10, body.y + 1.62 + Math.sin(p) * 10, hz + Math.cos(yaw) * Math.cos(p) * 10);
      c.lookAt(LOOK);
      PL.hideMesh = true; if (player.mesh) player.mesh.visible = false;
    } else {
      const cp = Math.cos(WK.camPitch), dx = Math.sin(WK.camYaw) * cp, dy = Math.sin(WK.camPitch), dz = Math.cos(WK.camYaw) * cp;
      const rx = Math.cos(WK.camYaw), rz = -Math.sin(WK.camYaw);
      // indoor? ceiling above the head or inside a registered building
      let ceil = false;
      for (let y = hy + 0.4; y < hy + 2.5; y += 0.25) if (solid(hx, y, hz)) { ceil = true; break; }
      const inB = !!(AF.buildingAt && AF.buildingAt(hx, body.y + 1, hz));
      WK.indoor = AF.lerp(WK.indoor, (ceil || inB) ? 1 : 0, 1 - Math.exp(-dt * 4));
      const maxBoom = AF.lerp(5.4 * (WK.zoom || 1), 2.8 * Math.min(1.2, WK.zoom || 1), WK.indoor);
      let shoulder = AF.lerp(0.62, 0.34, WK.indoor);
      for (let s = 0.05; s <= shoulder; s += 0.05) if (solid(hx + rx * (s + 0.12), hy, hz + rz * (s + 0.12))) { shoulder = Math.max(0, s - 0.15); break; }
      const px = hx + rx * shoulder, py = hy, pz = hz + rz * shoulder;
      const MARGIN = 0.28;
      const march = (lift) => {
        for (let t = 0.1; t <= maxBoom + MARGIN; t += 0.07) {
          const x = px + dx * t, y = py + lift + dy * t, z = pz + dz * t;
          if (solid(x, y, z) || solid(x, y + 0.14, z) || solid(x, y - 0.14, z) || solid(x + rx * 0.14, y, z + rz * 0.14) || solid(x - rx * 0.14, y, z - rz * 0.14)) return Math.max(0.12, t - MARGIN);
        }
        return maxBoom;
      };
      // a low blocker behind (fountain rim, bench, fence): prefer lifting the camera over pulling it in
      let want = march(0), wantLift = 0;
      if (want < maxBoom * 0.8) {
        const need = Math.min(maxBoom * 0.8, want + 1.2);
        for (const L of [0.35, 0.7, 1.05]) {
          if (solid(hx, hy + L + 0.3, hz)) break;
          const w = march(L);
          if (w >= need) { want = w; wantLift = L; break; }
        }
      }
      WK.lift = AF.lerp(WK.lift || 0, wantLift, 1 - Math.exp(-dt * (wantLift > (WK.lift || 0) ? 9 : 3)));
      const hard = WK.lift > 0.02 ? march(WK.lift) : (wantLift ? march(0) : want);
      const tgt = Math.min(want, hard);
      WK.boom = AF.lerp(WK.boom, tgt, 1 - Math.exp(-dt * (tgt < WK.boom ? 10 : 2.5)));
      WK.boom = Math.min(WK.boom, hard + 0.15);
      let cx = px + dx * WK.boom, cy = py + WK.lift + dy * WK.boom, cz = pz + dz * WK.boom;
      if (solid(cx, cy, cz)) { cx = hx; cy = hy; cz = hz; }
      TMP.set(cx, cy, cz);
      LOOK.set(px - dx * 8, py - dy * 8 + 0.55, pz - dz * 8);
      if (WK.blend < 1) {
        WK.blend = Math.min(1, WK.blend + dt / 1.5);
        const u = WK.blend, e = 1 - Math.pow(1 - u, 4);
        c.position.lerpVectors(WK.from, TMP, e);
        c.lookAt(LOOK); const q = c.quaternion.clone(); c.quaternion.slerpQuaternions(WK.fromQ, q, e);
      } else { c.position.copy(TMP); c.lookAt(LOOK); }
      PL.hideMesh = WK.boom < 0.7;
      if (player.mesh) player.mesh.visible = player.visible && !PL.hideMesh;
    }
    AF.camTarget.set(hx, hy, hz);
    AF.shadowFocus.set(body.x, 0, body.z); AF.shadowRadius = 70;
  };
  AF.modes.walk = {
    enter(opts = {}, from) {
      const s = AF.PLAN.spawn;
      let x = opts.x, y = opts.y, z = opts.z, yaw = opts.yaw;
      if (!isFinite(x) || !isFinite(z)) { if (from === 'aerial' && opts.here) { x = AE.f.x; z = AE.f.z; } else { x = s.x; z = s.z; y = s.y; if (!isFinite(yaw)) yaw = s.yaw; } }
      if (!isFinite(yaw)) yaw = player.yaw;
      player.teleport(x, isFinite(y) ? y : undefined, z, yaw);
      // unstick if the spot is inside something
      let k = 0; while (k++ < 16 && AF.boxBlocked && AF.boxBlocked(body.x, body.y, body.z, body.r, body.h)) body.y += 0.25;
      WK.camYaw = yaw + PI; WK.camPitch = 0.2; WK.boom = 0.6;
      const c = cam(); WK.from.copy(c.position); WK.fromQ.copy(c.quaternion); WK.blend = (opts.snap || from == null) ? 1 : 0;
      vel.x = vel.z = 0;
      player.setVisible(true);
      AF.emit('hint', WK.fp ? '' : '');
    },
    exit() { AF.interactTarget = null; PL.hideMesh = false; if (player.mesh) player.mesh.visible = player.visible; },
    update(dt) {
      const I = AF.input, m = I.mouse, modal = inModal();
      const locked = !!document.pointerLockElement;
      if (!modal) {
        // free mouse look (owner 09-28): just move the mouse to look, no click, no pointer lock; resting the cursor
        // near the left/right edge keeps turning so you can spin all the way round.
        // mouse look (owner 09-28, v3): click the view once to capture the mouse (standard game controls: smooth, unlimited turning,
        // no cursor); Esc releases it. Without capture you can still drag to look.
        if ((locked || ((m.buttons & 3) && !onPanel())) && (m.dx || m.dy)) {
          const ks = AF.lookSens(); WK.camYaw -= m.dx * 0.0045 * ks; WK.camPitch = AF.clamp(WK.camPitch + m.dy * 0.0035 * ks, -0.75, 1.25); WK.lastMouse = AF.clock.t;
        }
        if (!locked && m.clicked && !onPanel() && AF.renderer) { try { const r = AF.renderer.domElement.requestPointerLock({ unadjustedMovement: true }); if (r && r.catch) r.catch(() => { try { AF.renderer.domElement.requestPointerLock(); } catch (e) {} }); } catch (e) { try { AF.renderer.domElement.requestPointerLock(); } catch (e2) {} } }
        if (m.wheel) {
          // owner 09-28: scrolling out past the widest over-the-shoulder view pulls up into the map/aerial view
          if (WK.fp) { if (m.wheel > 0) { WK.fp = false; PL.hideMesh = false; WK.boom = 0.5; } }
          else if (m.wheel > 0 && (WK.zoom || 1) >= 2.19) { WK.zout = (WK.zout || 0) + m.wheel; if (WK.zout > 120) { WK.zout = 0; AF.setMode('aerial', { focusPlayer: true }); return; } }
          else { WK.zout = 0; WK.zoom = AF.clamp((WK.zoom || 1) * Math.exp(m.wheel * 0.0012), 0.45, 2.2); }
        }
        if (I.hit('KeyV')) { WK.fp = !WK.fp; if (!WK.fp) { PL.hideMesh = false; WK.boom = 0.5; } AF.emit('toast', WK.fp ? 'First-person view' : 'Over-the-shoulder view'); }
        const talking = !!(AF.ui && AF.ui.dialogueOpen && AF.ui.dialogueOpen());
        if (I.hit('Tab') || (I.hit('Escape') && !locked && !talking)) { AF.setMode('aerial', { focusPlayer: true }); return; }
      }
      // movement
      let ix = 0, iz = 0;
      if (!modal) {
        if (I.key('KeyW') || I.key('ArrowUp')) iz += 1;
        if (I.key('KeyS') || I.key('ArrowDown')) iz -= 1;
        if (I.key('KeyA') || I.key('ArrowLeft')) ix -= 1;
        if (I.key('KeyD') || I.key('ArrowRight')) ix += 1;
      }
      const run = I.key('ShiftLeft') || I.key('ShiftRight');
      const fx = -Math.sin(WK.camYaw), fz = -Math.cos(WK.camYaw), rx = -fz, rz = fx;
      let wx = fx * iz + rx * ix, wz = fz * iz + rz * ix;
      const wl = Math.hypot(wx, wz);
      const sp = run ? RUN : WALK;
      if (wl > 0) { wx = wx / wl * sp; wz = wz / wl * sp; }
      const acc = 1 - Math.exp(-dt * (body.onGround ? 18 : 3));
      vel.x = AF.lerp(vel.x, wx, acc); vel.z = AF.lerp(vel.z, wz, acc);
      if (!modal && I.hit('Space') && body.onGround) { body.vy = 6.4; body.onGround = false; }
      const wasAir = !body.onGround;
      const ox = body.x, oz = body.z;
      AF.moveBody(body, vel.x * dt, vel.z * dt, dt, { step: 0.55 });
      if (wasAir && body.onGround) AN.land = 0.6;
      const hs = Math.hypot(body.x - ox, body.z - oz) / Math.max(dt, 1e-4);
      if (body.hitWall) { vel.x *= 0.6; vel.z *= 0.6; }
      // face the direction of travel (or the camera in first person)
      if (WK.fp) player.yaw = WK.camYaw + PI;
      else if (wl > 0) player.yaw += AF.angDiff(player.yaw, Math.atan2(wx, wz)) * (1 - Math.exp(-dt * 12));
      // gentle camera follow when walking forward with the keyboard only
      if (!WK.fp && !locked && wl > 0 && iz > 0 && AF.clock.t - WK.lastMouse > 4) WK.camYaw += AF.angDiff(WK.camYaw, player.yaw + PI) * (1 - Math.exp(-dt * 0.9));
      // safety net
      if (body.y < -14 || !isFinite(body.y)) { const s = AF.PLAN.spawn; player.teleport(s.x, s.y, s.z, s.yaw); AF.emit('toast', 'Whoops — back to the square.'); }
      player.x = body.x; player.y = body.y; player.z = body.z;
      if (player.mesh) { player.mesh.position.set(body.x, body.y, body.z); player.mesh.rotation.y = player.yaw; }
      animate(dt, hs, body.onGround);
      // interactions
      const it = findInteract();
      AF.interactTarget = it;
      if (it && !modal && I.hit('KeyE') && !(AF.ui && AF.ui.dialogueOpen && AF.ui.dialogueOpen())) {
        try { it.act && it.act(); } catch (e) { console.error('[af] interact', e); }
        AF.emit('interact', it);
      }
      walkCamera(dt);
    },
  };

  // ------------------------------------------------------------------ FILM MODE (round 2): a looping cinematographer's tour for the owner's long-form video
  // AF.setMode('film') / PL.film.start(i) / PL.film.stop(). Keys: ←/→ shot, Space pause, 1–3 speed, T titles, L letterbox, Esc exits.
  // Each shot = its own eased Catmull-Rom dolly (pos + look target), a fixed hour (or a time-lapse), a lens, and a dip to black between shots.
  // dyn 'blimp' / 'tram' shots track the moving blimp / streetcar live. No roll (lookAt with world up), no collision nudges (no jitter):
  // every path is checked against the voxel world by the 'film: no shot camera inside solid' test.
  const FILM_SHOTS = [
    { name: 'Solace Harbour', sub: 'the sun going down behind Solace Point Light', hour: 17.7, dur: 11, fov: 42,
      P: [[334, 6, 314], [296, 7, 308], [258, 8.5, 300]], T: [[250, 13, 276], [205, 12, 266], [160, 13, 254]] },
    { name: 'The Skyline', sub: 'Solace Tower and the downtown crown at golden hour', hour: 17.7, dur: 12, fov: 38,
      P: [[-60, 70, 70], [-30, 76, 40], [0, 82, 12]], T: [[100, 70, -110], [106, 76, -116], [110, 84, -122]] },
    { name: 'The Blimp', sub: 'SOLACE, cruising over the city', hour: 17.7, dur: 12, fov: 40, dyn: 'blimp' },
    { name: 'Grand Avenue', sub: 'the Great White Way, just before the lights', hour: 17.75, dur: 12, fov: 50,
      P: [[-0.6, 2.5, 152], [-0.5, 2.55, 138], [-0.4, 2.6, 124]], T: [[1, 6.5, 60], [1.2, 6.5, 46], [1.4, 6.5, 32]] },
    { name: 'The Streetcar', sub: 'a nickel a ride on the harbour loop', hour: 17.7, dur: 11, fov: 48, dyn: 'tram' },
    { name: 'Civic Plaza', sub: 'up from the fountain to the City Hall dome', hour: 17.7, dur: 12, fov: 46,
      P: [[-41, 5, -6], [-41, 14, -30], [-41, 26, -50]], T: [[-41, 12, -100], [-41, 26, -108], [-41, 38, -112]] },
    { name: 'Central Park', sub: 'Swan Lake in the last of the sun', hour: 17.7, dur: 12, fov: 44,
      P: [[-50, 12, -206], [-63, 10.5, -213], [-77, 9, -220]], T: [[-100, 2, -240], [-112, 2, -248], [-122, 2, -254]] },
    { name: 'The Boardwalk', sub: 'the Sea Serpent coaster and the Pleasure Pier', hour: 17.8, dur: 12, fov: 44,
      P: [[-160, 12, 264], [-172, 14, 260], [-184, 16, 256]], T: [[-262, 14, 236], [-266, 14, 234], [-270, 14, 232]] },
    { name: 'The Starlite Diner', sub: 'pie, coffee and a booth by the window', hour: 17.8, dur: 10, fov: 58,
      P: [[16.8, 1.85, 31.4], [16.85, 1.85, 35.5], [16.9, 1.85, 39.5]], T: [[16.4, 1.45, 50], [16.3, 1.4, 52], [16.2, 1.35, 54]] },
    { name: 'Harbour Trust Bank', sub: 'the banking hall', hour: 17.8, dur: 11, fov: 58,
      P: [[14, 2.4, -125], [22, 3.6, -125], [30, 4.8, -125]], T: [[45, 5, -125], [50, 6, -125], [55, 7, -125]] },
    { name: 'Union Terminal', sub: 'the grand hall under the arched windows', hour: 17.8, dur: 11, fov: 60,
      P: [[175, 3, 41], [181, 3.8, 41], [187, 4.8, 41]], T: [[240, 9, 41], [245, 10.5, 41], [250, 12, 41]] },
    { name: 'Dusk over Downtown', sub: 'the lights come on', hour: 18.2, lapse: [18.2, 21.2], dur: 16, fov: 40,
      P: [[-70, 110, 130], [-30, 106, 150], [20, 102, 160]], T: [[90, 40, -70], [95, 40, -70], [100, 40, -70]] },
    { name: 'The Paragon', sub: 'the marquee at nine o’clock', hour: 21.0, dur: 11, fov: 50,
      P: [[-8, 2.4, 160], [-6, 3.0, 151], [-3, 3.8, 142]], T: [[18, 9, 130], [20, 9.5, 126], [22, 10, 122]] },
    { name: 'Grand Avenue at Night', sub: 'neon from the harbour to the Tower', hour: 21.0, dur: 12, fov: 44,
      P: [[0, 22, 236], [0, 32, 214], [0, 42, 192]], T: [[0, 6, 80], [0, 8, 60], [0, 10, 40]] },
    { name: 'The Boardwalk at Night', sub: 'the wheel and the Sea Serpent lit up', hour: 21.0, dur: 11, fov: 44,
      P: [[-160, 12, 264], [-172, 13, 260], [-184, 14, 256]], T: [[-262, 14, 236], [-266, 14, 234], [-270, 14, 232]] },
    { name: 'The Blimp by Night', sub: 'lit up over the lights of downtown', hour: 21.0, dur: 11, fov: 40, dyn: 'blimp' },
    { name: 'Port Solace', sub: 'goodnight from the harbour city', hour: 21.2, dur: 13, fov: 40,
      P: [[-120, 90, 220], [-180, 125, 280], [-230, 150, 330]], T: [[20, 20, -30], [20, 16, -30], [20, 12, -30]] },
  ];
  const FM = PL.film = { on: false, i: 0, t: 0, speed: 1, paused: false, black: 1, titles: false, bars: false, shots: FILM_SHOTS, saved: null, curves: [], dyn: {}, lift: 0, hintT: 0, pauseT: 0 };
  const FP = V3(), FT = V3(), FTMP = V3(), FTMP2 = V3();
  const filmCurve = (i) => {
    if (FM.curves[i]) return FM.curves[i];
    const S = FILM_SHOTS[i]; if (!S.P) return (FM.curves[i] = {});
    const mk = (a) => new THREE.CatmullRomCurve3(a.map((p) => new THREE.Vector3(p[0], p[1], p[2])), false, 'centripetal');
    return (FM.curves[i] = { P: mk(S.P), T: mk(S.T) });
  };
  const filmEase = (u) => u * 0.6 + u * u * (3 - 2 * u) * 0.4;          // mostly constant speed (cuts land mid-move), soft ends
  const railAt = (s, out) => { const p = AF.PLAN.railPoint(s); return out.set(p.x, p.y ?? 0, p.z); };
  // evaluates shot i at time t into FP / FT (pure, also used by the path test)
  const filmEval = (i, t) => {
    const S = FILM_SHOTS[i], u = AF.clamp(t / S.dur, 0, 1), e = filmEase(u);
    if (S.dyn === 'blimp') {
      const B = AF.portSolaceFX && AF.portSolaceFX.blimp;
      if (!B || !B.mesh) { FP.set(-60, 90, 60); FT.set(100, 70, -110); return; }
      const bp = B.mesh.position, yaw = B.mesh.rotation.y, fx = Math.sin(yaw), fz = Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw);
      const side = FM.dyn.side || 1, along = AF.lerp(50, -8, e);
      FP.set(bp.x + rx * 80 * side + fx * along, bp.y + AF.lerp(13, 8, e), bp.z + rz * 80 * side + fz * along);
      FT.set(bp.x + fx * AF.lerp(10, -4, e), bp.y - 4, bp.z + fz * AF.lerp(10, -4, e));
      return;
    }
    if (S.dyn === 'tram') {
      const T = AF.train, P = AF.PLAN;
      if (!T || !P.railPoint || !isFinite(T.s)) { FP.set(-4, 2, 150); FT.set(4, 6, 40); return; }
      const L = P.rail && P.rail.length ? P.rail.length : 1e9, s = T.s, dir = FM.dyn.dir || 1;
      const sc = s + dir * AF.lerp(14, -6, e);
      railAt(((sc % L) + L) % L, FTMP); railAt((((sc + dir * 2) % L) + L) % L, FTMP2);
      const tx = FTMP2.x - FTMP.x, tz = FTMP2.z - FTMP.z, tl = Math.hypot(tx, tz) || 1, nx = tz / tl, nz = -tx / tl, side = FM.dyn.side || 1;
      FP.set(FTMP.x + nx * 5.2 * side, groundAt(FTMP.x, FTMP.z) + 1.9, FTMP.z + nz * 5.2 * side);
      railAt((((s + dir * 3) % L) + L) % L, FTMP);
      FT.set(FTMP.x, groundAt(FTMP.x, FTMP.z) + 2.1, FTMP.z);
      return;
    }
    const C = filmCurve(i); C.P.getPoint(e, FP); C.T.getPoint(e, FT);
  };
  const filmShotStart = (i) => {
    const n = FILM_SHOTS.length, dirn = FM.dirn || 1; FM.i = ((i % n) + n) % n; FM.t = 0; FM.lift = 0; FM.dyn = {};
    const ok = (S) => S.dyn === 'tram' ? !!(AF.train && AF.train.cars && AF.train.cars.length && AF.PLAN.railPoint) : S.dyn === 'blimp' ? !!(AF.portSolaceFX && AF.portSolaceFX.blimp && AF.portSolaceFX.blimp.mesh) : true;
    for (let k = 0; k < n && !ok(FILM_SHOTS[FM.i]); k++) FM.i = (((FM.i + dirn) % n) + n) % n;
    const S = FILM_SHOTS[FM.i];
    if (S.dyn === 'blimp') {
      const B = AF.portSolaceFX && AF.portSolaceFX.blimp, sd = AF.time.sunDir;
      if (B && B.mesh) { const yaw = B.mesh.rotation.y, rx = Math.cos(yaw), rz = -Math.sin(yaw), p = B.mesh.position; FM.dyn.side = ((p.x - 10) * rx + (p.z + 30) * rz) >= 0 ? 1 : -1; }   // stand outside the loop: the city fills the background
    }
    if (S.dyn === 'tram') {
      const T = AF.train; FM.dyn.dir = T && T.speed < 0 ? -1 : 1;
      // stand on the side of the track facing the sun (lit flank), unless that side is inside something
      FM.dyn.side = 1; filmEval(FM.i, S.dur * 0.5); if (solid(FP.x, FP.y, FP.z)) FM.dyn.side = -1;
    }
    AF.time.hours = S.lapse ? S.lapse[0] : S.hour;
    const c = cam(); c.fov = S.fov || 45; c.updateProjectionMatrix();
    AF.emit('film-shot', FM.i, S);
  };
  const filmApply = (dt) => {
    const S = FILM_SHOTS[FM.i];
    filmEval(FM.i, FM.t);
    // safety only: never below the ground/water; a soft lift out of solids (paths are tested, so this should never engage)
    const floor = Math.max(groundAt(FP.x, FP.z), -1.25) + 0.9;
    let need = Math.max(0, floor - FP.y), k = 0; while (k++ < 30 && solid(FP.x, FP.y + need, FP.z)) need += 0.5;
    FM.lift = dt > 0 ? AF.lerp(FM.lift, need, 1 - Math.exp(-dt * 6)) : need; if (FM.lift < need - 1.5) FM.lift = need - 1.5;
    const c = cam(); c.position.set(FP.x, FP.y + FM.lift, FP.z); c.up.set(0, 1, 0); c.lookAt(FT);
    AF.camTarget.copy(FT);
    const h = c.position.y;
    AF.shadowFocus.set(c.position.x + (FT.x - c.position.x) * 0.4, 0, c.position.z + (FT.z - c.position.z) * 0.4);
    AF.shadowRadius = Math.round(AF.clamp(h * 1.4 + 50, 60, 220) / 10) * 10;
    if (S.lapse) AF.time.hours = AF.lerp(S.lapse[0], S.lapse[1], AF.clamp(FM.t / S.dur, 0, 1));
    // dip to black 0.5 s at each cut
    const D = 0.5, tin = FM.t, tout = S.dur - FM.t;
    FM.black = AF.clamp(Math.max(1 - tin / D, 1 - tout / D), 0, 1);
  };
  FM.start = (i) => {
    if (FM.on) { filmShotStart(i ?? FM.i); return; }
    PL.stopCine && PL.stopCine();
    const G = AF.GFX, c = cam();
    FM.saved = { hours: AF.time.hours, paused: AF.time.paused, speed: AF.time.speed, gfx: G ? (G.name || G.tier) : null, auto: G ? G.auto : true, fov: c.fov, tilt: AF.post ? AF.post.tiltEnabled : true, pv: player.visible };
    FM.on = true; FM.speed = 1; FM.paused = false; FM.hintT = 4.5;
    AF.time.paused = true;
    try { if (G && G.set) { G.auto = false; G.set('cinema', 'film mode'); } } catch (e) { AF.warnOnce && AF.warnOnce('film gfx', e); }
    if (AF.post) AF.post.tiltEnabled = false;
    if (player.mesh) player.mesh.visible = false;
    filmShotStart(i ?? 0);
  };
  FM.stop = () => {
    if (!FM.on) return;
    FM.on = false; FM.black = 0; FM.exitFrame = AF.clock.frame;
    const s = FM.saved || {}, c = cam(), G = AF.GFX;
    AF.time.hours = s.hours ?? AF.time.hours; AF.time.paused = !!s.paused; if (s.speed) AF.time.speed = s.speed;
    try { if (G && G.set && s.gfx) { G.set(s.gfx, 'film mode off'); G.auto = s.auto; } } catch (e) {}
    if (s.fov) { c.fov = s.fov; c.updateProjectionMatrix(); }
    if (AF.post) AF.post.tiltEnabled = s.tilt !== false;
    player.setVisible(s.pv !== false);
    AF.emit('film-shot', -1, null);
  };
  AF.modes.film = {
    enter(opts = {}) { FM.start(opts.shot); },
    exit() { FM.stop(); },
    update(dt) {
      const I = AF.input;
      if (I.hit('Escape') || I.hit('KeyF')) { AF.setMode('aerial', { keep: true }); return; }
      if (I.hit('ArrowRight')) { FM.dirn = 1; filmShotStart(FM.i + 1); }
      if (I.hit('ArrowLeft')) { FM.dirn = -1; filmShotStart(FM.t > 2 ? FM.i : FM.i - 1); FM.dirn = 1; }
      if (I.hit('Space')) { FM.paused = !FM.paused; FM.pauseT = 1.2; }
      if (I.hit('Digit1')) FM.speed = 0.5; if (I.hit('Digit2')) FM.speed = 1; if (I.hit('Digit3')) FM.speed = 2;
      if (I.hit('KeyT')) FM.titles = !FM.titles;
      if (I.hit('KeyL')) FM.bars = !FM.bars;
      FM.hintT = Math.max(0, FM.hintT - dt); FM.pauseT = Math.max(0, FM.pauseT - dt);
      const step = FM.paused ? 0 : dt * FM.speed;
      FM.t += step;
      if (FM.t >= FILM_SHOTS[FM.i].dur) filmShotStart(FM.i + 1);
      filmApply(step);
      if (player.mesh) player.mesh.visible = false;
    },
  };
  PL.filmEval = (i, t) => { filmEval(i, t); return { pos: FP.clone(), target: FT.clone() }; };

  // ------------------------------------------------------------------ FREE CAMERA (C): a smooth fly-cam for recording your own shots
  // WASD move · Q/E down/up · drag (or pointer lock) to look · Shift fast · Alt slow · wheel = lens · C or Esc back to the orbit.
  const FC = PL.free = { yaw: 0, pitch: 0, v: V3(), fov: 50, fov0: 50, look: V3() };
  AF.modes.free = {
    enter() {
      PL.stopCine && PL.stopCine();
      const c = cam(), d = V3(); c.getWorldDirection(d);
      FC.yaw = Math.atan2(d.x, d.z); FC.pitch = Math.asin(AF.clamp(d.y, -1, 1)); FC.v.set(0, 0, 0);
      FC.fov0 = c.fov; FC.fov = c.fov;
      if (AF.post) { FC.tilt = AF.post.tiltEnabled; AF.post.tiltEnabled = false; }
      if (player.mesh) player.mesh.visible = player.visible;
    },
    exit() { FC.exitFrame = AF.clock.frame; const c = cam(); c.fov = FC.fov0; c.updateProjectionMatrix(); if (AF.post) AF.post.tiltEnabled = FC.tilt !== false; },
    update(dt) {
      const I = AF.input, m = I.mouse, c = cam();
      if (inModal()) return;
      if (I.hit('Escape') || I.hit('KeyC')) { AF.setMode('aerial', { keep: true }); return; }
      if ((document.pointerLockElement || ((m.buttons & 7) && !onPanel())) && (m.dx || m.dy)) { const ks = AF.lookSens(); FC.yaw -= m.dx * 0.0032 * ks; FC.pitch = AF.clamp(FC.pitch - m.dy * 0.0028 * ks, -1.45, 1.45); }
      if (m.wheel) FC.fov = AF.clamp(FC.fov * Math.exp(m.wheel * 0.0008), 18, 90);
      const fast = I.key('ShiftLeft') || I.key('ShiftRight'), slow = I.key('AltLeft') || I.key('AltRight');
      const sp = (fast ? 42 : slow ? 2.5 : 11) * (c.position.y > 40 ? 1.8 : 1);
      const cp = Math.cos(FC.pitch), fx = Math.sin(FC.yaw) * cp, fy = Math.sin(FC.pitch), fz = Math.cos(FC.yaw) * cp, rx = -Math.cos(FC.yaw), rz = Math.sin(FC.yaw);
      let ax = 0, ay = 0, az = 0;
      if (I.key('KeyW') || I.key('ArrowUp')) { ax += fx; ay += fy; az += fz; }
      if (I.key('KeyS') || I.key('ArrowDown')) { ax -= fx; ay -= fy; az -= fz; }
      if (I.key('KeyD') || I.key('ArrowRight')) { ax += rx; az += rz; }
      if (I.key('KeyA') || I.key('ArrowLeft')) { ax -= rx; az -= rz; }
      if (I.key('KeyE') || I.key('Space')) ay += 1;
      if (I.key('KeyQ')) ay -= 1;
      const k = 1 - Math.exp(-dt * 4.5);                         // eased velocity: glides to a stop, no jerk
      FC.v.x = AF.lerp(FC.v.x, ax * sp, k); FC.v.y = AF.lerp(FC.v.y, ay * sp, k); FC.v.z = AF.lerp(FC.v.z, az * sp, k);
      let nx = c.position.x + FC.v.x * dt, ny = c.position.y + FC.v.y * dt, nz = c.position.z + FC.v.z * dt;
      if (solid(nx, ny, nz)) { if (!solid(nx, c.position.y, c.position.z)) { ny = c.position.y; nz = c.position.z; } else if (!solid(c.position.x, c.position.y, nz)) { nx = c.position.x; ny = c.position.y; } else { nx = c.position.x; ny = c.position.y; nz = c.position.z; } FC.v.multiplyScalar(0.5); }
      ny = Math.max(ny, Math.max(groundAt(nx, nz), -1.25) + 0.4);
      nx = AF.clamp(nx, -420, 420); nz = AF.clamp(nz, -420, 420); ny = Math.min(ny, 400);
      c.position.set(nx, ny, nz);
      FC.look.set(nx + fx * 10, ny + fy * 10, nz + fz * 10); c.up.set(0, 1, 0); c.lookAt(FC.look);
      if (Math.abs(c.fov - FC.fov) > 0.01) { c.fov = AF.lerp(c.fov, FC.fov, 1 - Math.exp(-dt * 8)); c.updateProjectionMatrix(); }
      AF.camTarget.copy(FC.look);
      AF.shadowFocus.set(nx + fx * 30, 0, nz + fz * 30); AF.shadowRadius = Math.round(AF.clamp(ny * 1.4 + 60, 70, 220) / 10) * 10;
      player.x = body.x; player.y = body.y; player.z = body.z;
    },
  };

  // ------------------------------------------------------------------ build + idle tick
  AF.onBuild('player', 800, () => {
    buildCharacter();
    const s = AF.PLAN.spawn;
    player.teleport(s.x, s.y, s.z, s.yaw);
    const v = AF.PLAN.views[0]; setOrbit(orbitFrom(v.pos, v.target), true);
    try { makeGulls(); } catch (e) { console.warn('[af] cine gulls', e); }
    cinePrep();
    // the opener plays behind the title (not in ?test runs or scripted shots, which drive the camera themselves)
    if (!(AF.Q && (AF.Q.has('test') || AF.Q.has('nocine')))) CN.on = true;
  });
  // walk camera: a resident who steps between the camera and the player never fills the frame with a head
  // (round 2) also in film / free-cam / scripted-camera frames, with a wider radius, and for the instanced crowd walkers + extras
  AF.onTick('player-nearfade', 905, () => {
    const mode = AF.mode, c = cam().position;
    // the player's own avatar: never render it around a fixed/scripted camera that sits in its head (judges' H.cam at the spawn)
    if (player.mesh && mode !== 'walk' && player.mesh.visible) {
      const dx = body.x - c.x, dz = body.z - c.z;
      if (dx * dx + dz * dz < 1.44 && c.y > body.y - 0.3 && c.y < body.y + 2.2) player.mesh.visible = false;
    }
    if (mode !== 'walk' && mode !== 'film' && mode !== 'free' && mode != null) return;
    const R = mode === 'walk' ? 1.2 : 2.0, R2 = R * R;
    if (AF.people) for (const p of AF.people) {
      if (!p || !p.root || !p.root.visible) continue;
      const dx = p.x - c.x, dz = p.z - c.z;
      if (dx * dx + dz * dz < R2 && c.y > p.y - 0.4 && c.y < p.y + 2.3) p.root.visible = false;
    }
    const CR = AF.peopleKit && AF.peopleKit.crowd;
    if (!CR || !CR.V || c.y > 12) return;
    for (const V of CR.V) {
      if (!V || !V.im) continue;
      for (const f in V.im) {
        const im = V.im[f], n = im.count; if (!n || !im.visible) continue;
        const a = im.instanceMatrix.array; let hit = false;
        for (let i = 0; i < n; i++) {
          const o = i * 16, dx = a[o + 12] - c.x, dz = a[o + 14] - c.z, y = a[o + 13];
          if (dx * dx + dz * dz < R2 && c.y > y - 0.4 && c.y < y + 2.3) { for (let j = 0; j < 11; j++) a[o + j] = 0; hit = true; }
        }
        if (hit) im.instanceMatrix.needsUpdate = true;
      }
    }
  });
  // when no mode of ours is active (drive/ride/tests) keep the character posed where it stands
  AF.onTick('player-idle', 160, (dt) => {
    if (!player.mesh || AF.mode === 'walk' || AF.mode === 'aerial') return;
    player.mesh.position.set(body.x, body.y, body.z); player.mesh.rotation.y = player.yaw;
    animate(dt, 0, true);
  });
  AF.toast = AF.toast || ((msg) => AF.emit('toast', msg));
}

// cursor left the window: stop the edge-turn in walk mode
document.addEventListener("mouseleave", () => { AF.input.mouse.x = -1; });
window.addEventListener("blur", () => { AF.input.mouse.x = -1; });

// owner 09-28: mouse-look sensitivity (slider in the clock card, saved per browser) + no cursor while looking around
AF.lookSens = () => { if (AF._lookSens == null) { let v = NaN; try { v = parseFloat(localStorage.getItem('portSolace.lookSens')); } catch (e) {} AF._lookSens = isFinite(v) ? v : 0.45; } return AF._lookSens; };
AF.setLookSens = (v) => { AF._lookSens = AF.clamp(+v || 0.45, 0.05, 2); try { localStorage.setItem('portSolace.lookSens', String(AF._lookSens)); } catch (e) {} };
AF.on('mode', () => { const cv = AF.renderer && AF.renderer.domElement; if (cv) cv.style.cursor = ''; if (AF.mode !== 'walk' && AF.mode !== 'free' && document.pointerLockElement) { try { document.exitPointerLock(); } catch (e) {} } if (AF.mode === 'walk' && !document.pointerLockElement) AF.emit('toast', 'Click the view to look around with the mouse \u00b7 Esc to release'); });

} catch (e) { AF.partError('70-player.js', e); }

