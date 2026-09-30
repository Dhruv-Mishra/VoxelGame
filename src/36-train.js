// ================================================================ 36-train.js
try {
// ===== 36-train: THE PORT SOLACE STREETCAR — 1930s double-ended car, trolley pole + sparks, timetable, 'ride' mode  (OWNER: transport) =====
const P = AF.PLAN, RL = P.rail, L = RL.length;
const RAIL = AF.rail = AF.rail || {};
const wrapS = (s) => ((s % L) + L) % L;
const TOP = (RL.ballastTop || 0.05);
const WIREY = RL.wireY || 6.2;
const CARLEN = 14, HALF = CARLEN / 2, BOGIE = 4.4;
const VMAX = 10, VCURVE = 4.5, ACC = 1.1, DEC = 1.3, DWELL = 15;
const VS = 1 / 8;

// ---------------------------------------------------------------- palette
let C = null;
const colours = () => {
  if (C) return C;
  C = {
    green: AF.col(0x2f5a3a, { jitter: 0.12, edge: 0.3, rough: 0.35 }), greenD: AF.col(0x21432a, { jitter: 0.12, edge: 0.3, rough: 0.4 }),
    cream: AF.col(0xefe3c2, { jitter: 0.08, edge: 0.3, rough: 0.4 }), gold: AF.col(0xd8ae4a, { jitter: 0.08, sat: 1.1, metal: 1, rough: 0.28 }),
    roof: AF.col(0x5b5d5c, { jitter: 0.25, edge: 0.4 }), black: AF.col(0x1c1c1e, { jitter: 0.2, edge: 0.4 }), steel: AF.col(0x8f8f8c, { jitter: 0.2 }),
    wood: AF.col(0x9a6636, { jitter: 0.35 }), woodD: AF.col(0x6a4226, { jitter: 0.3 }), floor: AF.col(0x7d5a3c, { jitter: 0.4 }),
    glass: AF.col('glass'), clere: AF.col(0xe8c070, { glass: true, jitter: 0, emit: 0xffc060, emitK: 1.2, mode: 'night' }),
    ceil: AF.col(0xf2e8cc, { jitter: 0.08, emit: 0xffd48a, emitK: 0.5, mode: 'night' }),
    bulb: AF.col(0xfff4d0, { emit: 0xffdca0, emitK: 3, mode: 'night', jitter: 0, edge: 0 }),
    head: AF.col(0xfff6dc, { emit: 0xffe6b0, emitK: 6, mode: 'night', jitter: 0, edge: 0 }),
    blind: AF.col(0x16140f, { jitter: 0.1 }), blindTxt: AF.col(0xfff2c8, { emit: 0xffeab0, emitK: 2.2, mode: 'always', jitter: 0, edge: 0 }),
    red: AF.col(0xb3261e, { jitter: 0.1 }), brass: AF.col(0xd4a93e, { jitter: 0.12, sat: 1.1, metal: 1, rough: 0.22 }),
    navy: AF.col(0x1f2a44, { jitter: 0.2, edge: 0.3 }), skin: AF.col(0xe0ab86, { jitter: 0.1 }), skin2: AF.col(0xa87250, { jitter: 0.1 }), white: AF.col(0xefe9dc, { jitter: 0.1 }),
    hair: AF.col(0x3a2818, { jitter: 0.3 }), coatA: AF.col(0x6b4a33, { jitter: 0.3 }), coatB: AF.col(0x5a5d62, { jitter: 0.3 }), coatC: AF.col(0x7a2a36, { jitter: 0.3 }), coatD: AF.col(0x2f5a6a, { jitter: 0.3 }),
    hatA: AF.col(0x3b3530, { jitter: 0.2 }), hatB: AF.col(0x8a6a48, { jitter: 0.2 }), hatC: AF.col(0xb0485a, { jitter: 0.2 }),
    mustard: AF.col(0xc8962c, { jitter: 0.25 }), tan: AF.col(0xb89a6a, { jitter: 0.25 }), plum: AF.col(0x5a3050, { jitter: 0.25 }), stock: AF.col(0x9a7462, { jitter: 0.1 }),
    straw: AF.col(0xe6d49a, { jitter: 0.2 }), paper: AF.col(0xeeeadc, { jitter: 0.1 }),
  };
  return C;
};

// ---------------------------------------------------------------- the car body (vs 1/8, local +z = forward, y 0 = rail top)
const NX = Math.round(2.6 / VS), NY = Math.round(4.0 / VS), NZ = Math.round(CARLEN / VS);
const hwAt = (Z) => { const e = HALF - Math.abs(Z); if (e >= 1.3) return 1.3; const u = (1.3 - Math.max(0, e)) / 1.3; return 0.42 + 0.88 * Math.sqrt(Math.max(0, 1 - u * u)); };
function buildCar(K) {
  const m = new AF.Model(NX, NY, NZ);
  for (let z = 0; z < NZ; z++) {
    const Z = (z + 0.5) * VS - HALF, aZ = Math.abs(Z), hw = hwAt(Z), end = aZ > HALF - 1.35;
    for (let x = 0; x < NX; x++) {
      const X = (x + 0.5) * VS - 1.3, aX = Math.abs(X);
      if (aX > hw) continue;
      const shell = aX > hw - VS * 1.01;
      for (let y = 0; y < NY; y++) {
        const Y = (y + 0.5) * VS;
        let c = 0;
        // trucks (bogies) + wheels
        if (Y < 0.85 && Math.abs(aZ - BOGIE) < 1.15 && aX > 0.55 && aX < 1.05) {
          const wz = aZ - BOGIE, wc = [-0.7, 0.7].some((o) => Math.hypot(wz - o, Y - 0.34) < 0.34);
          if (wc) c = (Math.hypot(wz - (wz < 0 ? -0.7 : 0.7), Y - 0.34) < 0.12) ? K.steel : K.black;
          else if (Y > 0.45 && Y < 0.72) c = K.greenD;
        }
        else if (Y >= 0.72 && Y < 0.9 && aX < hw - 0.05 && aZ < HALF - 0.3) c = K.black;              // underframe
        else if (Y >= 0.9 && Y < 1.0) c = aX > hw - 0.12 ? K.black : K.floor;                     // floor + rub rail
        else if (Y >= 1.0 && Y < 3.3 && shell) {
          if (Y < 1.9) c = (Y > 1.8 ? K.gold : (Y > 1.66 && Y < 1.72) ? K.red : (end && aZ > HALF - 0.5 && Y < 1.3 ? K.greenD : K.green));
          else if (Y < 2.0) c = K.cream;
          else if (Y < 2.85) {
            if (!end) {
              const door = X < 0 && Math.abs(aZ - 4.75) < 0.55;                                    // doors on the RIGHT (local -x = outside of the loop)
              const ph = ((Z + 5.4) % 0.9 + 0.9) % 0.9;
              c = door ? (Y < 2.1 || Math.abs(aZ - 4.75) > 0.45 ? K.greenD : K.glass) : (ph > 0.12 && ph < 0.82 ? K.glass : K.cream);
            } else c = (Y < 2.02 || Y > 2.86) ? K.cream : (Math.abs(X) < 0.06 ? K.cream : K.glass);   // wrap-around end windscreen
          }
          else c = (Y > 3.05 && Y < 3.12) ? K.green : K.cream;                                    // letterboard
          if (X < 0 && !end && Math.abs(aZ - 4.75) < 0.55 && Y < 1.9) c = K.greenD;              // lower door panels
          if (X < 0 && !end && Math.abs(aZ - 4.75) < 0.44 && Y < 2.85) c = 0;                    // doorway (leaf mesh slides over the side panel)
        }
        else if (Y >= 3.3 && Y < 3.5) { if (aX < hw - (Y - 3.3) * 2.2) c = (Y < 3.42 && aX > hw - 0.35) ? K.roof : (Y < 3.42 ? K.ceil : K.roof); }
        else if (Y >= 3.5 && Y < 3.85 && aX < 0.72 && aZ < HALF - 1.6) {                          // clerestory
          c = (aX > 0.6) ? ((Y > 3.55 && Y < 3.75 && (((Z % 0.8) + 0.8) % 0.8) > 0.2) ? K.clere : K.cream) : (Y > 3.72 ? K.roof : 0);
          if (Y >= 3.72 && Y < 3.85) c = K.roof;
        }
        if (c) m.set(x, y, z, c);
      }
    }
  }
  // interior: wooden transverse seats, stanchions, ceiling lamps
  const q = (v) => Math.round(v / VS);
  const B = (x0, y0, z0, x1, y1, z1, c) => m.box(q(x0 + 1.3), q(y0), q(z0 + HALF), q(x1 + 1.3), q(y1), q(z1 + HALF), c);
  for (let Z = -3.6; Z <= 3.7; Z += 0.9) {
    for (const s of [-1, 1]) {
      const x0 = s < 0 ? -1.15 : 0.3, x1 = s < 0 ? -0.3 : 1.15;
      B(x0, 1.3, Z - 0.2, x1, 1.42, Z + 0.22, K.wood); B(x0, 1.42, Z - 0.2, x1, 2.0, Z - 0.1, K.woodD); B(x0, 1.0, Z - 0.05, x1, 1.3, Z + 0.1, K.woodD);
    }
  }
  for (let Z = -4; Z <= 4.1; Z += 2) B(-0.08, 3.25, Z - 0.1, 0.08, 3.3, Z + 0.1, K.bulb);
  for (const s of [-1, 1]) {
    B(-0.25, 1.0, s * 5.9 - 0.25, 0.25, 1.95, s * 5.9 + 0.25, K.woodD);                             // controller stand
    B(-0.2, 1.95, s * 5.9 - 0.2, 0.2, 2.02, s * 5.9 + 0.2, K.brass);
    B(-0.2, 1.4, s * (HALF - 0.12) - 0.2, 0.2, 1.62, s * (HALF - 0.12) + 0.2, K.head);           // headlamps on each dash
    B(-0.3, 1.36, s * (HALF - 0.17) - 0.1, 0.3, 1.66, s * (HALF - 0.17) + 0.1, K.steel);
    B(-1.0, 0.72, s * (HALF - 0.15) - 0.25, 1.0, 0.85, s * (HALF - 0.15) + 0.25, K.black);        // fender
    // roof destination box
    B(-1.0, 3.42, s * (HALF - 1.1) - 0.1, 1.0, 3.82, s * (HALF - 1.1) + 0.1, K.blind);
  }
  B(-0.12, 3.5, 5.0, 0.12, 3.7, 5.3, K.brass); B(-0.05, 3.7, 5.1, 0.05, 3.85, 5.2, K.brass);   // bell
  // trolley pole base
  B(-0.25, 3.82, -2.4, 0.25, 3.95, -1.6, K.black); B(-0.1, 3.95, -2.2, 0.1, 4.1, -1.8, K.steel);
  return AF.meshModel(m, { vs: VS, anchor: [0.5, 0, 0.5] });
}
function personModel(K, coat, hat, skin, kind) {   // vs 1/16; kind 'stand' | 'sit' ; +z facing
  const m = new AF.Model(12, 30, 10); const vs = 1 / 16, q = (v) => Math.round(v / vs);
  const B = (x0, y0, z0, x1, y1, z1, c) => m.box(q(x0 + 0.375), q(y0), q(z0 + 0.3), q(x1 + 0.375), q(y1), q(z1 + 0.3), c);
  if (kind === 'sit') {
    B(-0.18, 0.4, -0.05, 0.18, 0.5, 0.3, coat); B(-0.17, 0, 0.2, -0.03, 0.45, 0.3, K.black); B(0.03, 0, 0.2, 0.17, 0.45, 0.3, K.black);
    B(-0.22, 0.45, -0.12, 0.22, 1.05, 0.12, coat);
  } else {
    B(-0.18, 0, -0.08, -0.03, 0.1, 0.14, K.black); B(0.03, 0, -0.08, 0.18, 0.1, 0.14, K.black);
    B(-0.17, 0.1, -0.08, 0.17, 0.85, 0.08, coat); B(-0.22, 0.75, -0.12, 0.22, 1.4, 0.12, coat);
    B(-0.3, 0.8, -0.06, -0.22, 1.36, 0.06, coat); B(0.22, 0.8, -0.06, 0.3, 1.36, 0.06, coat);
  }
  const hy = kind === 'sit' ? 1.05 : 1.4;
  B(-0.06, hy, -0.05, 0.06, hy + 0.06, 0.05, skin); B(-0.11, hy + 0.06, -0.11, 0.11, hy + 0.3, 0.11, skin);
  B(-0.07, hy + 0.2, 0.11, -0.03, hy + 0.23, 0.12, K.black); B(0.03, hy + 0.2, 0.11, 0.07, hy + 0.23, 0.12, K.black);
  B(-0.12, hy + 0.08, -0.12, 0.12, hy + 0.28, -0.08, K.hair);
  B(-0.13, hy + 0.28, -0.13, 0.13, hy + 0.4, 0.13, hat); B(-0.17, hy + 0.27, -0.17, 0.17, hy + 0.3, 0.17, hat);
  if (hat === K.navy) B(-0.12, hy + 0.26, 0.12, 0.12, hy + 0.29, 0.22, K.black);
  return AF.meshModel(m, { vs, anchor: [0.5, 0, 0.5] });
}
const textMesh = (str, fg, bg, vs) => {
  const tm = AF.textModel(str, fg, { pad: 1, depth: 1, bg });
  return AF.modelMesh(AF.meshModel(tm, { vs, anchor: [0.5, 0.5, 0.5] }), { cast: false });
};

// ============================================================ 600: assemble
AF.onBuild('train', 600, () => {
  const t0 = performance.now();
  const K = colours();
  const T = AF.train = { s: 0, speed: 0, state: 'stopped', station: null, nextStation: null, timer: 8, cars: [], defs: [], length: CARLEN, odo: 0, bell: 0, spark: 0, kind: 'streetcar', nextArrival: (id) => RAIL.nextArrival(id) };
  const car = new THREE.Group(); car.name = 'streetcar';
  car.add(AF.modelMesh(buildCar(K)));
  // destination blinds (front + back, both faces of each roof box) + side boards
  for (const s of [-1, 1]) {
    const bl = textMesh('HARBOUR LOOP', K.blindTxt, K.blind, 1 / 40); bl.position.set(0, 3.62, s * (HALF - 1.1) + s * 0.11); if (s < 0) bl.rotation.y = Math.PI; car.add(bl);
    const sb = textMesh('PORT SOLACE RAILWAYS', K.gold, K.cream, 1 / 40); sb.position.set(s * 1.31, 3.17, 0); sb.rotation.y = s * Math.PI / 2; car.add(sb);
    const nb = textMesh('307', K.gold, K.green, 1 / 30); nb.position.set(s * 1.31, 1.4, -2); nb.rotation.y = s * Math.PI / 2; car.add(nb);
    // v2 r2: exterior ad boards on the waist panel, in gilt frames
    const adS = s > 0 ? 'DRINK SOLACE COLA' : 'GULL BRAND SARDINES', adT = AF.textModel(adS, K.red, { pad: 1, depth: 1, bg: K.cream });
    const ad = textMesh(adS, s > 0 ? K.red : K.navy, K.cream, 1 / 44); ad.position.set(s * 1.315, 1.36, 1.8); ad.rotation.y = s * Math.PI / 2; car.add(ad);
    const FW = adT.w + 2, FH = adT.h + 2, fr = new AF.Model(1, FH, FW);
    for (let z = 0; z < FW; z++) { fr.set(0, 0, z, K.gold); fr.set(0, FH - 1, z, K.gold); } for (let y = 0; y < FH; y++) { fr.set(0, y, 0, K.gold); fr.set(0, y, FW - 1, K.gold); }
    const fm2 = AF.modelMesh(AF.meshModel(fr, { vs: 1 / 44, anchor: [0.5, 0.5, 0.5] }), { cast: false }); fm2.position.set(s * 1.312, 1.36, 1.8); car.add(fm2);
  }
  // route disc "7" on each dash + a slatted lifeguard fender
  for (const s of [-1, 1]) {
    const rd = textMesh('7', K.black, K.cream, 1 / 28); rd.position.set(0.62, 1.52, s * (HALF + 0.02)); if (s < 0) rd.rotation.y = Math.PI; car.add(rd);
    const fm = new AF.Model(28, 4, 3); for (let x = 0; x < 28; x++) { fm.set(x, 0, 2, K.black); fm.set(x, 3, 0, K.black); if (x % 3 === 0) { fm.set(x, 1, 1, K.woodD); fm.set(x, 2, 1, K.woodD); } }
    const fe = AF.modelMesh(AF.meshModel(fm, { vs: 1 / 16, anchor: [0.5, 0, 0.5] }), { cast: false }); fe.position.set(0, 0.3, s * (HALF + 0.05)); if (s < 0) fe.rotation.y = Math.PI; car.add(fe);
  }
  // crew + passengers
  const mot = AF.modelMesh(personModel(K, K.navy, K.navy, K.skin, 'stand'), { cast: false }); mot.position.set(0, 1.0, 5.45); car.add(mot); T.motorman = mot;
  const con = AF.modelMesh(personModel(K, K.navy, K.navy, K.skin2, 'stand'), { cast: false }); con.position.set(-0.1, 1.0, -4.9); con.rotation.y = -Math.PI / 2; car.add(con); T.conductor = con;
  const pax = [[K.coatA, K.hatA, K.skin], [K.coatC, K.hatC, K.skin], [K.coatB, K.hatB, K.skin2], [K.coatD, K.hatA, K.skin]].map((a) => personModel(K, a[0], a[1], a[2], 'sit'));
  const seats = [[-0.72, -2.7], [0.72, -0.9], [-0.72, 0.9], [0.72, 2.7], [-0.72, -1.8], [0.72, -3.6]];
  // v2 r2: 12 seats; how many are filled follows the people who get on and off (T.paxN)
  const seats2 = seats.concat([[0.72, 1.8], [-0.72, -0.9], [-0.72, 2.7], [0.72, -2.7], [-0.72, 3.6], [0.72, 0.0]]);
  T.paxMeshes = seats2.map((p, i) => { const pm = AF.modelMesh(pax[(i * 3 + 1) % pax.length], { cast: false }); pm.position.set(p[0], 1.0, p[1] + 0.05); pm.visible = i < 6; car.add(pm); return pm; });
  T.paxN = 6;
  // v2 r2: sliding door leaves (green panel + window), one per doorway on the island side
  { const lm = new AF.Model(15, 30, 1);
    for (let x = 0; x < 15; x++) for (let y = 0; y < 30; y++) { const fr = x < 2 || x > 12 || y < 2 || y > 27 || (y > 14 && y < 17); lm.set(x, y, 0, y < 2 ? K.gold : (y > 16 && y < 28 && !fr) ? K.glass : (fr ? K.greenD : K.green)); }
    lm.set(12, 13, 0, K.brass); lm.set(12, 14, 0, K.brass);
    const lg = AF.meshModel(lm, { vs: 1 / 16, anchor: [0.5, 0, 0.5] });
    T.doors = [1, -1].map((s) => { const d = AF.modelMesh(lg, { cast: false }); d.rotation.y = -Math.PI / 2; d.position.set(-1.335, 1.0, s * 4.75); car.add(d); return { mesh: d, s }; });
    T.doorOpen = 0; T.doorTarget = 0; }
  // trolley pole: pivot at the roof (z -2), trailing back + up to the wire
  const poleLen = 6.2;
  const pm = new AF.Model(2, 2, Math.round(poleLen * 16)); pm.box(0, 0, 0, 2, 2, Math.round(poleLen * 16), K.black);
  const pole = AF.modelMesh(AF.meshModel(pm, { vs: 1 / 16, anchor: [0.5, 0.5, 0] }), { cast: false });
  const pivot = new THREE.Group(); pivot.position.set(0, 4.05, -2.0); pivot.add(pole);
  const harp = AF.modelMesh(AF.meshModel(new AF.Model(3, 3, 3).box(0, 0, 0, 3, 3, 3, K.brass), { vs: 1 / 16, anchor: [0.5, 0.5, 0.5] }), { cast: false });
  harp.position.set(0, 0, poleLen); pole.add(harp);
  car.add(pivot);
  const dy = WIREY - 4.05, ang = Math.asin(AF.clamp(dy / poleLen, -1, 1));
  pivot.rotation.set(ang, Math.PI, 0);          // points back (-z) and up
  T.pole = pivot; T.poleLen = poleLen;
  // sparks: additive soft points (fly + fall) + a flash sprite + a faint blue night glow at the pole head
  const cv = document.createElement('canvas'); cv.width = cv.height = 64; { const g = cv.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(200,230,255,0.85)'); gr.addColorStop(1, 'rgba(120,170,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); }
  const stex = new THREE.CanvasTexture(cv);
  const NSP = 64, spos = new Float32Array(NSP * 3), scol = new Float32Array(NSP * 3);
  const sgeo = new THREE.BufferGeometry(); sgeo.setAttribute('position', new THREE.BufferAttribute(spos, 3)); sgeo.setAttribute('color', new THREE.BufferAttribute(scol, 3));
  const SP = new THREE.Points(sgeo, new THREE.PointsMaterial({ size: 1.35, map: stex, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true, fog: false }));
  SP.frustumCulled = false; SP.renderOrder = 7; AF.scene.add(SP);
  const flash = new THREE.Sprite(new THREE.SpriteMaterial({ map: stex, color: 0xd8ecff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
  flash.visible = false; flash.renderOrder = 8; AF.scene.add(flash);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: stex, color: 0x5a8cff, transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
  glow.scale.setScalar(2.4); glow.visible = false; glow.renderOrder = 8; AF.scene.add(glow);
  T.sparks = { pts: SP, pos: spos, col: scol, flash, glow, parts: Array.from({ length: NSP }, () => ({ life: 0, max: 1, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0 })) };
  // headlamp beam
  { const bm = new THREE.MeshBasicMaterial({ color: 0xffe3a8, transparent: true, opacity: 0.09, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: true });
    const cg = new THREE.ConeGeometry(2.6, 16, 16, 1, true); cg.translate(0, -8, 0); cg.rotateX(-Math.PI / 2);
    const beam = new THREE.Mesh(cg, bm); beam.position.set(0, 1.5, HALF); beam.rotation.x = -0.05; beam.renderOrder = 4; beam.visible = false; beam.castShadow = false; car.add(beam); T.beams = [beam];
    if (AF.addLight) { T.headLight = AF.addLight({ x: 0, y: 2, z: 0, color: 0xffe0a8, intensity: 1.1, range: 14, kind: 'street' }) || (AF.lights && AF.lights[AF.lights.length - 1]); T.coachLight = AF.addLight({ x: 0, y: 3, z: 0, color: 0xffd69a, intensity: 0.4, range: 8, kind: 'interior' }) || (AF.lights && AF.lights[AF.lights.length - 1]); }
  }
  AF.scene.add(car); T.cars.push(car); T.loco = car;
  T.defs.push({ obj: car, len: CARLEN, off: 0, bogie: BOGIE, kind: 'streetcar' });
  // stops: the car centred on each stop's sC
  T.stops = RL.stations.map((st) => ({ id: st.id, name: st.name, stopS: wrapS(st.sC) })).sort((a, b) => a.stopS - b.stopS);
  const first = Math.max(0, T.stops.findIndex((s) => s.id === 'cityhall'));
  T.s = T.stops[first].stopS; T.station = T.stops[first].id; T.nextIdx = (first + 1) % T.stops.length; T.nextStation = T.stops[T.nextIdx].id;
  buildSpeedProfile(T);
  placeCars(0);
  makeWalkers(K); stopsInit();
  RAIL.trainMs = Math.round(performance.now() - t0);
  // boarding: along every stop island
  for (const st of RL.stations) {
    const [x0, z0, x1, z1] = st.platform, alongX = (x1 - x0) > (z1 - z0);
    for (let i = 0; i < 3; i++) {
      const f = (i + 0.5) / 3, x = alongX ? AF.lerp(x0, x1, f) : (x0 + x1) / 2, z = alongX ? (z0 + z1) / 2 : AF.lerp(z0, z1, f);
      AF.addInteract({ x, y: 1.0, z, r: 4.5, label: 'Board the streetcar', can: () => T.state === 'stopped' && T.station === st.id && AF.mode !== 'ride', act: () => AF.setMode('ride', { station: st.id }) });
    }
  }
});

// ---------------------------------------------------------------- placement
const V1 = new THREE.Vector3(), V2 = new THREE.Vector3();
function placeCars() {
  const T = AF.train; if (!T || !T.defs) return;
  for (const d of T.defs) {
    const a = P.railPoint(wrapS(T.s - d.off + d.bogie)), b = P.railPoint(wrapS(T.s - d.off - d.bogie));
    d.obj.position.set((a.x + b.x) / 2, TOP, (a.z + b.z) / 2);
    d.obj.rotation.set(0, Math.atan2(a.x - b.x, a.z - b.z), 0);
  }
}
RAIL.placeCars = placeCars;
function buildSpeedProfile(T) {
  const n = Math.ceil(L), lim = new Float32Array(n);
  let s0 = 0;
  const arcs = [];
  for (const g of RL.segs) { if (g.t === 'arc') arcs.push([s0 - 8, s0 + g.len + 4]); s0 += g.len; }
  for (let i = 0; i < n; i++) { lim[i] = VMAX; for (const a of arcs) if (i >= a[0] && i <= a[1]) lim[i] = VCURVE; }
  const eff = Float32Array.from(lim);
  for (let pass = 0; pass < 2; pass++) for (let i = n - 1; i >= 0; i--) { const j = (i + 1) % n; eff[i] = Math.min(lim[i], Math.sqrt(eff[j] * eff[j] + 2 * DEC * 0.9)); }
  T.limit = eff; T.arcs = arcs; RAIL.speedLimit = (s) => eff[Math.floor(wrapS(s)) % n];
}
RAIL.simTrain = (T, dt) => {
  if (T.state === 'stopped') { T.speed = 0; T.timer -= dt; if (T.timer <= 0) { T.state = 'accelerating'; T.departed = T.station; T.station = null; } return; }
  const next = T.stops[T.nextIdx], d = wrapS(next.stopS - T.s);
  const vlim = T.limit ? T.limit[Math.floor(T.s) % T.limit.length] : 8;
  let vt = Math.min(vlim, Math.sqrt(2 * DEC * Math.max(0, d - 0.3)));
  if (T.obst != null && T.obst < 40) vt = Math.min(vt, T.obst < 1.5 ? 0 : Math.sqrt(2 * DEC * 1.6 * Math.max(0, T.obst - 1.5)));   // something on the track ahead: stop short of it
  if (T.speed < vt) T.speed = Math.min(vt, T.speed + ACC * dt); else T.speed = Math.max(vt, T.speed - DEC * 2 * dt);
  const ds = T.speed * dt;
  if ((d < 0.5 && T.speed < 0.7) || (ds >= d && d < 3)) {
    T.odo += d; T.s = next.stopS; T.speed = 0; T.state = 'stopped'; T.timer = DWELL; T.station = next.id;
    T.nextIdx = (T.nextIdx + 1) % T.stops.length; T.nextStation = T.stops[T.nextIdx].id; return;
  }
  T.s = wrapS(T.s + ds); T.odo += ds;
  T.state = T.speed >= vlim - 0.05 ? 'running' : (T.speed > vt + 0.02 || (vt <= T.speed + 0.02 && d < 60) ? 'braking' : 'accelerating');
};
// seconds until the car next stands at a stop (0 if it is there now)
const simCopy = () => { const T = AF.train; return { s: T.s, speed: T.speed, state: T.state, station: T.station, nextIdx: T.nextIdx, nextStation: T.nextStation, timer: T.timer, stops: T.stops, limit: T.limit, odo: 0 }; };
RAIL.nextArrival = (id) => {
  const T = AF.train; if (!T || !T.stops) return Infinity;
  if (T.state === 'stopped' && T.station === id) return 0;
  const S = simCopy(); let t = 0;
  for (let i = 0; i < 4000; i++) { const was = S.state; RAIL.simTrain(S, 0.5); t += 0.5; if (S.state === 'stopped' && was !== 'stopped' && S.station === id) return t; }
  return Infinity;
};

AF.onTick('train', 250, (dt) => {
  const T = AF.train; if (!T || !T.defs) return;
  const was = T.state, wasSt = T.station;
  if ((T.obFrame = (T.obFrame || 0) + 1) % 3 === 0) obstacleAhead(T, dt * 3);
  RAIL.simTrain(T, dt);
  if (was === 'stopped' && T.state !== 'stopped') { T.bell = 1.6; if (AF.mode === 'ride') { const n = T.stops[T.nextIdx]; AF.emit('toast', 'Clang-clang! Next stop: ' + n.name); } }
  if (was !== 'stopped' && T.state === 'stopped' && AF.mode === 'ride') { const st = T.stops.find((s) => s.id === T.station); AF.emit('toast', (st ? st.name : '') + ' — E to step off'); }
  if (wasSt == null && T.station) T.bell = Math.max(T.bell, 0.8);
  placeCars();
  passengers(T, dt, was);
  updatePoleAndSparks(dt);
  trainLights();
  if (AF.mode === 'ride') rideCamera(dt);
});

// ---------------------------------------------------------------- obstacles on the track ahead (cars, the player, residents): the car brakes and waits, bell ringing
const OBP = [];
function obstacleAhead(T, dt) {
  T.obst = null;
  if (T.state === 'stopped') return;
  if (T.obIgnore > 0) { T.obIgnore -= dt; return; }
  OBP.length = 0;
  for (let d = HALF + 0.5; d <= HALF + 22; d += 1.5) OBP.push(P.railPoint(wrapS(T.s + d)), d - HALF);
  const c0 = T.cars[0].position; let best = null, who = null;
  const test = (x, z, r, kind) => {
    if (!isFinite(x) || Math.abs(x - c0.x) > 32 || Math.abs(z - c0.z) > 32) return;
    for (let i = 0; i < OBP.length; i += 2) { const p = OBP[i]; if (Math.abs(p.x - x) < r && Math.abs(p.z - z) < r && Math.hypot(p.x - x, p.z - z) < r) { const dd = OBP[i + 1]; if (best == null || dd < best) { best = dd; who = kind; } break; } }
  };
  const V = AF.vehicles; if (V && V.cars) for (const c of V.cars) test(c.x, c.z, 1.35 + (c.halfW || 0.9), 'car');
  const pl = AF.player; if (pl && AF.mode === 'walk') test(pl.body ? pl.body.x : pl.x, pl.body ? pl.body.z : pl.z, 1.6, 'player');
  const ppl = AF.people; if (ppl) for (const q of ppl) if (q && !q.hidden && q.visible !== false) test(q.x, q.z, 1.5, 'person');
  T.obst = best; T.obWho = who;
  if (best != null && T.speed < 0.2) { T.obWait = (T.obWait || 0) + dt; if (T.obWait > 1.5 && T.bell <= 0) T.bell = 0.8; if (T.obWait > (who === 'player' ? 30 : 9)) { T.obIgnore = 4; T.obWait = 0; } }
  else if (best == null) T.obWait = 0;
}
RAIL.obstacleAhead = obstacleAhead;

// ---------------------------------------------------------------- pole, sparks, lights
const HEAD = new THREE.Vector3(), DUMMY = new THREE.Object3D();
function updatePoleAndSparks(dt) {
  const T = AF.train, car = T.cars[0]; if (!car || !T.pole) return;
  // aim the pole's head at the wire (track centreline, y = wireY) 5.7 m behind the pivot
  car.updateMatrixWorld();
  const back = P.railPoint(wrapS(T.s - 2.0 - Math.sqrt(Math.max(1, T.poleLen * T.poleLen - (WIREY - 4.05 - TOP) ** 2))));
  V1.set(0, 4.05, -2.0); car.localToWorld(V1);
  V2.set(back.x, WIREY, back.z); car.worldToLocal(V2);
  const lx = V2.x - 0, ly = V2.y - 4.05, lz = V2.z + 2.0;
  T.pole.rotation.set(0, 0, 0, 'YXZ'); T.pole.rotation.order = 'YXZ';
  T.pole.rotation.y = Math.atan2(lx, lz); T.pole.rotation.x = -Math.atan2(ly, Math.hypot(lx, lz));
  const pole = T.pole.children[0]; if (pole) pole.scale.z = Math.hypot(lx, ly, lz) / T.poleLen;
  HEAD.set(back.x, WIREY, back.z);
  // spark rate: lots on the corner curves and when pulling away from a stop
  const S = T.sparks; if (!S) return;
  const onArc = T.arcs && T.arcs.some((a) => T.s >= a[0] + 8 && T.s <= a[1] - 4);
  const near = AF.camera ? AF.camera.position.distanceTo(HEAD) < 320 : true;
  const pull = T.state === 'accelerating' && T.speed < 4;
  const rate = T.speed < 0.2 ? 0 : (onArc ? 5 : 0.7) + (pull ? 4 : 0);
  if (near && Math.random() < rate * dt) {
    const n = 8 + (Math.random() * 10 | 0);
    for (let k = 0; k < n; k++) { const p = S.parts.find((u) => u.life <= 0); if (!p) break; p.max = p.life = 0.35 + Math.random() * 0.6; p.x = HEAD.x; p.y = HEAD.y; p.z = HEAD.z; p.vx = (Math.random() - 0.5) * 7; p.vy = Math.random() * 3 - 0.5; p.vz = (Math.random() - 0.5) * 7; }
    S.flashT = 0.08 + Math.random() * 0.1;
  }
  let c = 0;
  for (const p of S.parts) {
    if (p.life > 0) { p.life -= dt; p.vy -= 9.8 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; }
    const k = Math.max(0, p.life / p.max), i3 = c * 3;
    if (p.life > 0) { S.pos[i3] = p.x; S.pos[i3 + 1] = p.y; S.pos[i3 + 2] = p.z; S.col[i3] = 0.9 * k + 0.1; S.col[i3 + 1] = 0.95 * k + 0.05; S.col[i3 + 2] = 1.0 * k; c++; }
  }
  S.pts.geometry.setDrawRange(0, c); S.pts.geometry.attributes.position.needsUpdate = true; S.pts.geometry.attributes.color.needsUpdate = true;
  S.flashT = (S.flashT || 0) - dt;
  S.flash.visible = S.flashT > 0; if (S.flash.visible) { S.flash.position.copy(HEAD); S.flash.scale.setScalar(2.2 + Math.random() * 2.2); }
  const night = (AF.time && AF.time.night) || 0;
  S.glow.visible = night > 0.3; if (S.glow.visible) { S.glow.position.copy(HEAD); S.glow.material.opacity = 0.35 + 0.15 * Math.sin(performance.now() * 0.02) ; }
  T.spark = c;
}
function trainLights() {
  const T = AF.train, tm = AF.time || {};
  const night = tm.night != null ? tm.night > 0.35 : (tm.hours < 6.5 || tm.hours > 18.8);
  if (T.beams) for (const b of T.beams) b.visible = night;
  const setL = (l, obj, lx, ly, lz) => {
    if (!l || !obj) return;
    V1.set(lx, ly, lz); obj.localToWorld(V1); l.x = V1.x; l.y = V1.y; l.z = V1.z;
    const pool = AF.atmos && AF.atmos.pool; if (pool) for (const pl of pool) if (pl.userData && pl.userData.src === l) pl.position.set(l.x, l.y, l.z);
  };
  const car = T.cars[0]; if (!car) return;
  setL(T.headLight, car, 0, 1.6, HALF + 5); setL(T.coachLight, car, 0, 3.0, 0);
  // bell swing + conductor sway
  if (T.bell > 0) T.bell -= 1 / 60;
}

// ============================================================ v2 r2: PASSENGERS — people step off, waiters board, late runners, sliding doors
// A pool of 44 little walkers (8 looks x 3 poses, vs 1/16). Stop islands keep 2-4 people waiting; when the car stands at a stop the doors slide
// open, 1-3 riders step down and cross to the sidewalk, the waiting people board (the seated load follows), sometimes a late runner jogs up and
// the car holds for him, then the doors close and the island refills from the sidewalk. Also used by the buses (AF.rail.walkers.spawn).
const WK = RAIL.walkers = { list: [], st: {}, t: 0 };
const wr = AF.rng(3071), wrand = () => wr();
function walkerModel(K, lk, pose) {    // +z facing; pose 0 stand, 1 left leg forward, 2 right leg forward
  const m = new AF.Model(12, 31, 12), vs = 1 / 16, q = (v) => Math.round(v / vs);
  const B = (x0, y0, z0, x1, y1, z1, c) => m.box(q(x0 + 0.375), q(y0), q(z0 + 0.375), q(x1 + 0.375), q(y1), q(z1 + 0.375), c);
  const f = pose === 0 ? 0 : pose === 1 ? 1 : -1;
  B(-0.17, 0, -0.07 + f * 0.13, -0.03, 0.07, 0.15 + f * 0.13, K.black); B(0.03, 0, -0.07 - f * 0.13, 0.17, 0.07, 0.15 - f * 0.13, K.black);   // shoes
  B(-0.16, 0.07, -0.07 + f * 0.1, -0.03, 0.45, 0.07 + f * 0.1, lk.legs); B(0.03, 0.07, -0.07 - f * 0.1, 0.16, 0.45, 0.07 - f * 0.1, lk.legs);
  B(-0.16, 0.45, -0.07 + f * 0.05, -0.02, 0.82, 0.07 + f * 0.05, lk.legs); B(0.02, 0.45, -0.07 - f * 0.05, 0.16, 0.82, 0.07 - f * 0.05, lk.legs);
  if (lk.woman) B(-0.2, 0.42, -0.13, 0.2, 0.86, 0.13, lk.coat);                        // skirt / coat hem
  else if (lk.long) B(-0.19, 0.56, -0.11, 0.19, 0.86, 0.11, lk.coat);                  // overcoat skirts
  B(-0.2, 0.82, -0.11, 0.2, 1.38, 0.11, lk.coat);                                          // torso
  B(-0.2, 1.26, 0.1, 0.2, 1.36, 0.12, lk.woman ? lk.coat : K.white);                      // collar / shirt front
  B(-0.28, 0.84, -0.05 - f * 0.1, -0.2, 1.36, 0.06 - f * 0.1, lk.coat); B(0.2, 0.84, -0.05 + f * 0.1, 0.28, 1.36, 0.06 + f * 0.1, lk.coat);
  B(-0.28, 0.76, -0.05 - f * 0.12, -0.2, 0.84, 0.06 - f * 0.12, lk.skin); B(0.2, 0.76, -0.05 + f * 0.12, 0.28, 0.84, 0.06 + f * 0.12, lk.skin);
  if (lk.bag) B(0.22, 0.48, -0.12 + f * 0.12, 0.3, 0.78, 0.16 + f * 0.12, lk.bag);          // bag / briefcase in the right hand
  if (lk.paper) B(-0.3, 0.9, -0.02 - f * 0.1, -0.22, 1.16, 0.12 - f * 0.1, K.paper);      // newspaper under the left arm
  const hy = 1.38;
  B(-0.05, hy, -0.05, 0.05, hy + 0.05, 0.05, lk.skin); B(-0.11, hy + 0.05, -0.1, 0.11, hy + 0.29, 0.11, lk.skin);
  B(-0.07, hy + 0.18, 0.11, -0.03, hy + 0.21, 0.12, K.black); B(0.03, hy + 0.18, 0.11, 0.07, hy + 0.21, 0.12, K.black);
  B(-0.12, hy + 0.08, -0.12, 0.12, hy + 0.27, -0.08, K.hair);
  if (lk.woman) { B(-0.12, hy + 0.08, -0.12, 0.12, hy + 0.2, -0.04, K.hair); B(-0.13, hy + 0.22, -0.13, 0.13, hy + 0.36, 0.13, lk.hat); B(-0.15, hy + 0.21, -0.1, 0.15, hy + 0.24, 0.15, lk.hat); }
  else { B(-0.13, hy + 0.26, -0.13, 0.13, hy + 0.4, 0.13, lk.hat); B(-0.19, hy + 0.25, -0.19, 0.19, hy + 0.28, 0.19, lk.hat); B(-0.135, hy + 0.28, -0.135, 0.135, hy + 0.31, 0.135, lk.band || K.black); }
  return AF.meshModel(m, { vs, anchor: [0.5, 0, 0.5] });
}
const NWALK = 44;
function makeWalkers(K) {
  const LK = [
    { coat: K.coatA, hat: K.hatA, skin: K.skin, legs: K.hatA, long: true, bag: K.black },
    { coat: K.coatC, hat: K.hatC, skin: K.skin, legs: K.stock, woman: true, bag: K.woodD },
    { coat: K.coatB, hat: K.hatB, skin: K.skin2, legs: K.black, long: true, paper: true },
    { coat: K.coatD, hat: K.hatC, skin: K.skin, legs: K.stock, woman: true },
    { coat: K.navy, hat: K.straw, skin: K.skin, legs: K.navy, band: K.red, paper: true },
    { coat: K.mustard, hat: K.hatA, skin: K.skin2, legs: K.stock, woman: true, bag: K.black },
    { coat: K.tan, hat: K.hatA, skin: K.skin, legs: K.coatB, long: true, bag: K.woodD },
    { coat: K.plum, hat: K.black, skin: K.skin, legs: K.stock, woman: true },
  ];
  const geos = LK.map((lk) => [0, 1, 2].map((p) => walkerModel(K, lk, p)));
  for (let i = 0; i < NWALK; i++) {
    const g = geos[i % geos.length], mesh = new THREE.Mesh(g[0], AF.mat.voxel);
    mesh.castShadow = true; mesh.receiveShadow = true; mesh.visible = false; mesh.name = 'tram-walker'; mesh.matrixAutoUpdate = true; AF.scene.add(mesh);
    WK.list.push({ mesh, geos: g, pose: 0, st: 'off', x: 0, y: 0, z: 0, yaw: 0, yawT: 0, path: [], pi: 0, v: 1.3, ph: wrand() * 4, wait: 0, onEnd: null, tag: null, gy: 0, gyT: 0 });
  }
}
const wGround = (x, z) => (AF.surfaceBelow ? AF.surfaceBelow(x, z, 1.4, 3) : 0.25);
WK.spawn = (x, z, yaw, o = {}) => {
  const n = WK.list.length; if (!n) return null;
  let w = null; const s0 = (wrand() * n) | 0;
  for (let i = 0; i < n; i++) { const q = WK.list[(s0 + i) % n]; if (q.st === 'off') { w = q; break; } }
  if (!w) return null;
  w.x = x; w.z = z; w.yaw = w.yawT = yaw; w.gy = wGround(x, z); w.y = o.y != null ? o.y : w.gy; w.gyT = 0;
  w.path = o.path || []; w.pi = 0; w.v = o.v || 1.2 + wrand() * 0.35; w.onEnd = o.onEnd || null; w.tag = o.tag || null; w.wait = o.wait || 0; w.role = o.role || '';
  w.st = w.path.length ? 'walk' : 'idle'; w.mesh.visible = true; w.pose = -1;
  return w;
};
WK.go = (w, path, v, onEnd) => { w.path = path; w.pi = 0; if (v) w.v = v; w.onEnd = onEnd || null; w.st = 'walk'; };
WK.off = (w) => { w.st = 'off'; w.mesh.visible = false; w.tag = null; w.onEnd = null; };
WK.moving = () => WK.list.filter((w) => w.st === 'walk');
function stepWalkers(dt) {
  for (const w of WK.list) {
    if (w.st === 'off') continue;
    let pose = 0;
    if (w.wait > 0) w.wait -= dt;
    else if (w.st === 'walk') {
      const tx = w.path[w.pi * 2], tz = w.path[w.pi * 2 + 1];
      const dx = tx - w.x, dz = tz - w.z, d = Math.hypot(dx, dz), st = w.v * dt;
      if (d <= st) { w.x = tx; w.z = tz; w.pi++; if (w.pi * 2 >= w.path.length) { w.st = 'idle'; const f = w.onEnd; w.onEnd = null; if (f) f(w); if (w.st === 'off') continue; } }
      else { w.x += dx / d * st; w.z += dz / d * st; w.yawT = Math.atan2(dx, dz); }
      w.ph += dt * w.v * 1.75;
      const ph = Math.floor(w.ph * 2) % 4; pose = ph === 0 ? 1 : ph === 2 ? 2 : 0;
      if ((w.gyT -= dt) <= 0) { w.gy = wGround(w.x, w.z); w.gyT = 0.2; }
    }
    w.yaw += AF.angDiff(w.yaw, w.yawT) * Math.min(1, dt * 7);
    if (w.y > w.gy) w.y = Math.max(w.gy, w.y - dt * 2.2); else w.y = w.gy;          // steps down off the car floor
    if (pose !== w.pose) { w.pose = pose; w.mesh.geometry = w.geos[pose]; }
    const bob = pose ? 0.025 : 0;
    w.mesh.position.set(w.x, w.y + bob, w.z); w.mesh.rotation.y = w.yaw;
  }
}
// ---- the stop choreography
const side = (s, off) => P.railSide(wrapS(s), off);
const toTrackYaw = (s) => { const p = P.railPoint(wrapS(s)); return Math.atan2(p.dz, -p.dx); };   // from the island, facing the track
const upTrackYaw = (s) => { const p = P.railPoint(wrapS(s)); return Math.atan2(-p.dx, -p.dz); };  // looking up the line for the car
const IDLE = [-8.5, -4, 0.5, 5, 9.5];
function waiterAt(id, sC, slot, fromKerb) {
  const ds = IDLE[slot] + (wrandr() - 0.5) * 1.2, off = 2.9 + wrandr() * 0.9, p = side(sC + ds, off);
  const yaw = wrandr() < 0.55 ? toTrackYaw(sC + ds) : upTrackYaw(sC + ds);
  const S = WK.st[id];
  let w;
  if (fromKerb) {   // walk in from the sidewalk, across the car lane, onto the island end
    const e = ds < 0 ? -1 : 1, a = side(sC + e * 16, 11.8), b = side(sC + e * 12.5, 10.6), c = side(sC + e * 11.3, 3.2);
    w = WK.spawn(a.x, a.z, 0, { path: [b.x, b.z, c.x, c.z, p.x, p.z], tag: id, role: 'waiter' });
    if (w) w.onEnd = (q) => { q.yawT = yaw; q.st = 'idle'; };
  } else w = WK.spawn(p.x, p.z, yaw, { tag: id, role: 'waiter' });
  if (w) { w.slot = slot; S.waiters.push(w); }
  return w;
}
const wrandr = () => wrand();
function stopsInit() {
  const T = AF.train; if (!T || !T.stops) return;
  for (const s of T.stops) {
    WK.st[s.id] = { id: s.id, sC: s.stopS, waiters: [], refill: 0 };
    const n = 2 + ((wrand() * 3) | 0);
    const slots = [0, 1, 2, 3, 4].sort(() => wrand() - 0.5).slice(0, n);
    for (const k of slots) waiterAt(s.id, s.stopS, k, false);
  }
}
function doorWorld(T, sgn, inset, out) {   // a point in the doorway (car local -x), inset: + inside
  const car = T.cars[0], r = car.rotation.y, lx = -1.3 + inset, lz = sgn * 4.75;
  out.x = car.position.x + lx * Math.cos(r) + lz * Math.sin(r); out.z = car.position.z - lx * Math.sin(r) + lz * Math.cos(r);
  return out;
}
const DW = { x: 0, z: 0 };
function passengers(T, dt, was) {
  if (!WK.list.length) return;
  WK.t += dt;
  // arrival: doors open, riders step off, the island boards
  if (was !== 'stopped' && T.state === 'stopped' && T.station && WK.st[T.station]) {
    const S = WK.st[T.station];
    T.doorTarget = 1;
    const nOff = Math.min(Math.max(0, T.paxN - 2), 1 + ((wrand() * 3) | 0));
    T.ev = { id: T.station, t: 0, off: nOff, offDone: 0, board: 0, runner: null, runT: wrand() < 0.4 ? 5 + wrand() * 3 : -1, hold: 0 };
    S.refill = 0;
  }
  const E = T.ev;
  if (E && T.state === 'stopped' && T.station === E.id) {
    const S = WK.st[E.id], sC = T.s;
    E.t += dt;
    // 1) riders step off (front and rear doors alternately), cross the lane and walk off along the sidewalk
    while (E.offDone < E.off && E.t > 0.9 + E.offDone * 1.1) {
      const sg = E.offDone % 2 ? -1 : 1; doorWorld(T, sg, 0.6, DW);
      const sd = sC + sg * 4.75, e = wrand() < 0.5 ? -1 : 1, a = side(sd, 2.7), b = side(sd + e * (2 + wrand() * 3), 3.4), c = side(sC + e * 11.2, 3.3), d = side(sC + e * 12.8, 10.8), f = side(sC + e * (22 + wrand() * 14), 12 + wrand() * 1.2);
      WK.spawn(DW.x, DW.z, 0, { y: TOP + 1.0, path: [a.x, a.z, b.x, b.z, c.x, c.z, d.x, d.z, f.x, f.z], role: 'alight', onEnd: (q) => WK.off(q) });
      E.offDone++; T.paxN = Math.max(0, T.paxN - 1);
    }
    // 2) "let them off first": then the island boards, nearest door each, a step apart
    if (E.t > 1.2 + E.off * 1.1 && !E.boarding) {
      E.boarding = true; let k = 0;
      for (const w of S.waiters) {
        if (w.st === 'off' || w.tag !== E.id) continue;
        const sw = P.railS ? P.railS(w.x, w.z) : sC; const rel = wrapS(sw - sC + L / 2) - L / 2, sg = rel >= 0 ? 1 : -1;
        const a = side(sC + sg * 4.75, 2.55); doorWorld(T, sg, 0.7, DW);
        w.wait = 0.3 + k * 0.7; k++; E.board++;
        WK.go(w, [a.x, a.z, DW.x, DW.z], 1.35, (q) => { WK.off(q); T.paxN = Math.min(12, T.paxN + 1); E.board--; });
      }
      S.waiters.length = 0;
    }
    // 3) the late runner: jogs up the sidewalk, crosses, and the conductor holds the car for him
    if (E.runT > 0 && E.t > E.runT && !E.runner) {
      const a = side(sC - 34, 12.2), b = side(sC - 14, 11.5), c = side(sC - 11.3, 3.3), d = side(sC - 4.75, 2.55); doorWorld(T, -1, 0.7, DW);
      E.runner = WK.spawn(a.x, a.z, 0, { path: [b.x, b.z, c.x, c.z, d.x, d.z, DW.x, DW.z], v: 3.3, role: 'runner', onEnd: (q) => { WK.off(q); T.paxN = Math.min(12, T.paxN + 1); E.runner = 'in'; } });
      if (!E.runner) E.runT = -1;
    }
    const busy = E.board > 0 || (E.runner && E.runner !== 'in') || E.offDone < E.off;
    if (busy && T.timer < 1.8 && E.hold < 14) { T.timer = 1.8; E.hold += dt; }
    T.doorTarget = (T.timer < 1.4 && !busy) ? 0 : 1;
  } else if (T.state !== 'stopped') { T.doorTarget = 0; if (E && !E.left) { E.left = true; const S = WK.st[E.id]; if (S) S.refill = 6 + wrand() * 10; } }
  // islands refill from the sidewalk between cars
  for (const id in WK.st) {
    const S = WK.st[id];
    if (S.refill > 0 && (S.refill -= dt) <= 0) {
      if (S.waiters.length < 3 && !(T.state === 'stopped' && T.station === id)) { const used = new Set(S.waiters.map((w) => w.slot)); const free = [0, 1, 2, 3, 4].filter((k) => !used.has(k)); if (free.length) waiterAt(id, S.sC, free[(wrand() * free.length) | 0], true); }
      if (S.waiters.length < 2 + ((S.sC | 0) % 2)) S.refill = 5 + wrand() * 12;
    }
  }
  // waiting people turn to watch the car come in
  if (T.state !== 'stopped' && T.nextStation && WK.st[T.nextStation] && (WK.t % 1) < dt) {
    const S = WK.st[T.nextStation], d = wrapS(S.sC - T.s);
    if (d < 70) for (const w of S.waiters) if (w.st === 'idle') w.yawT = upTrackYaw(S.sC);
  }
  // doors slide, the conductor leans out while they are open, the seated load follows the riders
  T.doorOpen += AF.clamp(T.doorTarget - T.doorOpen, -dt * 1.6, dt * 1.6);
  if (T.doors) for (const d of T.doors) d.mesh.position.z = d.s * (4.75 - 0.92 * T.doorOpen);
  if (T.conductor) { T.conductor.position.x = -0.1 - 0.8 * T.doorOpen; }
  if (T.paxMeshes) for (let i = 0; i < T.paxMeshes.length; i++) T.paxMeshes[i].visible = i < T.paxN;
  stepWalkers(dt);
}
RAIL.passengers = passengers;

// ============================================================ RIDE mode
const RIDE = RAIL.ride = { view: 0, t: 0, yaw: 0, pitch: 0, ts: null, cp: new THREE.Vector3(), ct: new THREE.Vector3(), smooth: false };
const VIEWS = ['window seat', 'motorman', 'chase', 'kerbside'];
AF.modes.ride = {
  enter(opts = {}, from) {
    RIDE.t = 0; RIDE.view = opts.view ?? 0; RIDE.yaw = 0; RIDE.pitch = 0; RIDE.ts = null; RIDE.smooth = false;
    if (AF.camera && RIDE.fov0 == null) RIDE.fov0 = AF.camera.fov;
    setFov();
    if (AF.player && AF.player.setVisible) AF.player.setVisible(false);
    const T = AF.train, n = T && T.stops ? T.stops[T.nextIdx] : null;
    AF.emit('hint', 'C — change view · drag to look · E — step off at a stop');
    AF.emit('toast', 'Fares please! Loop · Harbour line' + (n ? ' — next stop: ' + n.name : ''));
  },
  exit(to) { if (AF.player && AF.player.setVisible) AF.player.setVisible(true); AF.emit('hint', ''); if (AF.camera && RIDE.fov0 != null) { AF.camera.fov = RIDE.fov0; AF.camera.updateProjectionMatrix(); RIDE.fov0 = null; } },
  update(dt) {
    RIDE.t += dt;
    const I = AF.input;
    if (I.hit('KeyC')) { RIDE.view = (RIDE.view + 1) % VIEWS.length; RIDE.yaw = 0; RIDE.pitch = 0; RIDE.ts = null; RIDE.smooth = false; setFov(); AF.emit('toast', VIEWS[RIDE.view]); }
    if (I.mouse.buttons & 1 || document.pointerLockElement) { RIDE.yaw -= I.mouse.dx * 0.004; RIDE.pitch = AF.clamp(RIDE.pitch - I.mouse.dy * 0.004, -1.1, 1.1); }
    if ((I.hit('KeyE') || I.hit('Escape')) && RIDE.t > 0.6) {
      const T = AF.train;
      if (T && T.state === 'stopped') RIDE.getOff();
      else AF.emit('toast', 'Hold the strap — the car is moving. E again at the next stop.');
    }
  },
};
function setFov() { const c = AF.camera; if (!c || RIDE.fov0 == null) return; const f = RIDE.view === 0 ? 70 : RIDE.view === 1 ? 64 : RIDE.fov0; if (c.fov !== f) { c.fov = f; c.updateProjectionMatrix(); } }
RIDE.getOff = () => {
  const T = AF.train;
  const st = RL.stations.find((s) => s.id === T.station) || RL.stations.reduce((b, s) => (Math.abs(wrapS(s.sC - T.s + L / 2) - L / 2) < Math.abs(wrapS(b.sC - T.s + L / 2) - L / 2) ? s : b), RL.stations[0]);
  const side = P.railSide(st.sC + 3, 3.1);
  const px = side.x, pz = side.z;
  const tr = P.railPoint(st.sC + 3);
  const yaw = Math.atan2(tr.x - px, tr.z - pz) + Math.PI;    // facing away from the car, out to the kerb
  const y = AF.surfaceBelow ? AF.surfaceBelow(px, pz, 2.6, 4) : 0.25;
  RIDE.lastOff = { x: px, y, z: pz, yaw, station: st.id };
  AF.setMode('walk', { x: px, y, z: pz, yaw });
};
const LV = new THREE.Vector3(), LT = new THREE.Vector3();
function rideCamera(dt) {
  const T = AF.train, cam = AF.camera; if (!T || !T.cars.length) return;
  const car = T.cars[0];
  const k = RIDE.smooth ? 1 - Math.exp(-dt * 6) : 1;
  if (RIDE.view === 0 || RIDE.view === 1) {
    let lx, ly, lz, yaw0, pitch0;
    if (RIDE.view === 0) { lx = -0.35; ly = 2.3; lz = -1.4; yaw0 = -0.62; pitch0 = -0.06; }
    else { lx = -0.6; ly = 2.45; lz = 5.35; yaw0 = 0.05; pitch0 = -0.06; }
    car.updateMatrixWorld();
    LV.set(lx, ly, lz); car.localToWorld(LV);
    const yaw = car.rotation.y + yaw0 + RIDE.yaw, pitch = pitch0 + RIDE.pitch;
    cam.position.copy(LV);
    LT.set(LV.x + Math.sin(yaw) * Math.cos(pitch) * 10, LV.y + Math.sin(pitch) * 10, LV.z + Math.cos(yaw) * Math.cos(pitch) * 10);
    cam.lookAt(LT);
  } else if (RIDE.view === 2) {
    const yaw = car.rotation.y + RIDE.yaw;
    LT.set(car.position.x, car.position.y + 2.5, car.position.z);
    LV.set(car.position.x - Math.sin(yaw) * 22 - Math.cos(yaw) * 9, car.position.y + 12 + RIDE.pitch * 10, car.position.z - Math.cos(yaw) * 22 + Math.sin(yaw) * 9);
    if (!RIDE.smooth) { RIDE.cp.copy(LV); RIDE.ct.copy(LT); } else { RIDE.cp.lerp(LV, k); RIDE.ct.lerp(LT, k); }
    cam.position.copy(RIDE.cp); cam.lookAt(RIDE.ct);
  } else {
    if (!RIDE.ts || (wrapS(T.s - RIDE.ts.s) < L / 2 && wrapS(T.s - RIDE.ts.s) > 20)) {
      const s = T.s + 60 + T.speed * 3, sd = P.railSide(wrapS(s), 8.5);
      RIDE.ts = { s: wrapS(s), x: sd.x, z: sd.z, y: 1.9 };
    }
    LT.set(car.position.x, car.position.y + 2.2, car.position.z);
    if (!RIDE.smooth) RIDE.ct.copy(LT); else RIDE.ct.lerp(LT, 1 - Math.exp(-dt * 3));
    cam.position.set(RIDE.ts.x, RIDE.ts.y, RIDE.ts.z); cam.lookAt(RIDE.ct);
  }
  RIDE.smooth = true;
  if (AF.camTarget) AF.camTarget.copy(car.position);
  if (AF.shadowFocus) AF.shadowFocus.set(car.position.x, 0, car.position.z);
}
RAIL.rideCamera = rideCamera;

// ============================================================ tests
AF.test('train: streetcar laps the loop visiting all 6 stops', () => {
  const T = AF.train; if (!T || !T.stops) return { ok: false, info: 'no streetcar' };
  const sim = simCopy();
  let nan = false, stops = [], t = 0;
  for (let i = 0; i < 8000 && sim.odo < L + 30; i++) {
    const was = sim.state; RAIL.simTrain(sim, 0.1); t += 0.1;
    if (!isFinite(sim.s) || !isFinite(sim.speed)) { nan = true; break; }
    if (sim.state === 'stopped' && was !== 'stopped') stops.push(sim.station);
  }
  const all = RL.stations.every((s) => stops.includes(s.id));
  placeCars();
  const pos = T.cars.every((c) => isFinite(c.position.x) && isFinite(c.position.z));
  const na = RAIL.nextArrival(T.stops[(T.nextIdx + 2) % T.stops.length].id);
  return { ok: !nan && all && pos && isFinite(na) && na > 0, info: `lap ${Math.round(t)} s, odo ${Math.round(sim.odo)}/${Math.round(L)}, stops ${stops.join('>')}, nextArrival(+2) ${Math.round(na)} s, build ${RAIL.trainMs} ms` };
});
AF.test('train: streetcar stops for a car on the track', () => {
  const T = AF.train, V = AF.vehicles; if (!T || !V || !V.cars || !V.cars.length) return { ok: false, info: 'no streetcar / cars' };
  const S = { s: T.s, speed: T.speed, state: T.state, station: T.station, timer: T.timer, nextIdx: T.nextIdx, nextStation: T.nextStation, obIgnore: 0, obWait: 0, obst: null };
  const c = V.cars.find((q) => q.parked && !q.static && !q.player) || V.cars[0], cs = { x: c.x, z: c.z };
  const st = T.stops[T.nextIdx], s0 = wrapS(st.stopS - 90);
  T.s = s0; T.state = 'running'; T.speed = 6; T.station = null; T.obIgnore = 0; T.obWait = 0; T.obst = null; placeCars();
  const p = P.railPoint(wrapS(s0 + HALF + 25)); c.x = p.x; c.z = p.z;
  let minGap = 1e9;
  for (let i = 0; i < 300; i++) { obstacleAhead(T, 1 / 30); RAIL.simTrain(T, 1 / 30); placeCars(); const g = Math.hypot(T.cars[0].position.x - c.x, T.cars[0].position.z - c.z) - HALF; minGap = Math.min(minGap, g); }
  const stopped = T.speed < 0.05;
  c.x = cs.x; c.z = cs.z; T.obst = null; T.obIgnore = 0; T.obWait = 0;
  Object.assign(T, S); placeCars();
  return { ok: stopped && minGap > 0.3, info: `stopped ${stopped}, closest ${minGap.toFixed(2)} m, car ${c.name} at ${p.x.toFixed(1)},${p.z.toFixed(1)}` };
});
AF.test('ride: enter + exit at a stop island', () => {
  const T = AF.train; if (!T) return { ok: false, info: 'no streetcar' };
  const prevMode = AF.mode, S = { s: T.s, speed: T.speed, state: T.state, station: T.station, timer: T.timer };
  const st = RL.stations.find((s) => s.id === 'harbour') || RL.stations[0];
  T.s = st.sC; T.state = 'stopped'; T.station = st.id; T.timer = 20; placeCars();
  AF.setMode('ride', {});
  const inRide = AF.mode === 'ride';
  rideCamera(1 / 60);
  const camOk = isFinite(AF.camera.position.x) && isFinite(AF.camera.position.y);
  RIDE.t = 5; RIDE.getOff();
  let exited = AF.mode === 'walk';
  const off = RIDE.lastOff || {};
  const [x0, z0, x1, z1] = st.platform;
  const onIsland = off.x > x0 - 1.5 && off.x < x1 + 1.5 && off.z > z0 - 1.5 && off.z < z1 + 1.5;
  if (prevMode && AF.modes[prevMode] && AF.mode !== prevMode) AF.setMode(prevMode); else if (!prevMode) AF.mode = null;
  Object.assign(T, S); placeCars();
  return { ok: inRide && camOk && exited && onIsland && off.y >= 0 && off.y < 1.5, info: `ride ${inRide} cam ${camOk} exit ${exited} island ${onIsland} at ${JSON.stringify(off)}` };
});

} catch (e) { AF.partError('36-train.js', e); }

