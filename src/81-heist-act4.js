// ================================================================ 81-heist-act4.js
try {
// ===== 81-heist-act4: the places + props of the Harbour Trust Job's Act IV prologue (OWNER: game) =====
//   army    a desert army stash on the Ochre Flats east of the city (pad, sandbag walls, tents, floodlights, crates); 81-heist-sets puts
//           six soldiers + the stealth zone 'army' on it and the crate of seeker launchers in its middle
//   garage  Dusty's Respray, a two-bay paint shop on the desert road just past the city's east edge: the armoured car drives in for
//           its new paint (81-heist 'paint'); walls + roof are colliders, the meshes merged outland props (no draws of their own)
//   kit     the chase's moving parts (81-heist owns their logic): Moretti helicopters (body + rotor, pooled), the gunmen in the chaser
//           limousines (one instanced draw), the armoured car's open rear doors + the mounted machine gun (only during the chase)
// AF.act4 = { army, garage, ready, heli(i), gunmen, rear }
{
  const O = AF.outland, PI = Math.PI;
  const X4 = AF.act4 = { army: null, garage: null, ready: false, stats: { props: 0 } };
  const col = (hex, o = {}) => AF.col(hex, Object.assign({ jitter: 0.3, edge: 0.15, pat: 'none' }, o));
  const C = {
    sand: col(0xb89a6a, { jitter: 0.4 }), sandD: col(0x8e7650, { jitter: 0.35 }), olive: col(0x4e5a34, { jitter: 0.3 }), oliveD: col(0x39432a, { jitter: 0.25 }),
    canvas: col(0x6a7044, { jitter: 0.35 }), steel: col(0x5a6066, { metal: 0.6, rough: 0.5 }), dark: col(0x26282a), wood: col(0x7a5a3c, { pat: 'plank', jitter: 0.35 }),
    stencil: col(0xe8d070), lamp: col(0xfff2c8, { emit: 0xfff0c0, emitK: 2.4, mode: 'night' }), brick: col(0x8a4a38, { pat: 'brick', jitter: 0.35 }), tin: col(0x8f9496, { metal: 0.6, rough: 0.5 }),
    cream: col(0xe8dcc0), red: col(0xb8322a), concrete: col(0x8e8c86, { jitter: 0.25 }), booth: col(0xff9a3a, { emit: 0xff8a2a, emitK: 1.6 }), paint: col(0x3a7ac8), paintR: col(0xc83a3a),
  };
  // flat ground for a pad: the median of nine samples (the same rule as 44-sites)
  const padY = (x, z, rx, rz) => { const v = []; for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) v.push(O.h(x + a * rx * 0.6, z + b * rz * 0.6)); v.sort((p, q) => p - q); return Math.round(v[4] * 4) / 4; };
  const TAG = 'heist-act4';
  AF.onBuild('heist-act4-pads', 496.8, () => {
    if (!O || !O.pads) return;
    // local frames: x / z offsets turned by f (1 = as drawn, -1 = turned 180 degrees so the gate / door faces the road)
    // the army stash: on the Ochre Flats west of Dry Creek Depot, its gate facing the desert road to the north
    const ax = 752, az = 82, af = -1, ay = padY(ax, az, 20, 16);
    const army = X4.army = { name: 'Ochre Flats army stash', x: ax, z: az, y: ay, f: af, rx: 20, rz: 16, bank: 10, kind: 'army', props: [] };
    O.pads.push(army); AF.addLabel('Army stash', ax, az, 'place');
    const A = (lx0, y0, lz0, lx1, y1, lz1) => AF.addCollider(ax + af * lx0, ay + y0, az + af * lz0, ax + af * lx1, ay + y1, az + af * lz1, TAG);
    for (const x of [-12, -4, 4, 12]) A(x - 4, 0, -15.5, x + 4, 1, -14.5);                       // back wall
    for (const x of [-12, 12]) A(x - 4, 0, 14.5, x + 4, 1, 15.5);                                 // front wall, the gate between
    for (const s of [-1, 1]) for (const z of [-7, 1, 9]) A(s * 17 - 0.5, 0, z - 4, s * 17 + 0.5, 1, z + 4);
    for (const x of [-10, 0, 10]) A(x - 3, 0, (x ? -8 : -9) - 4, x + 3, 3, (x ? -8 : -9) + 4);   // tents
    for (const [x, z] of [[-6, 4], [7, 3], [-13, -1]]) A(x - 1.25, 0, z - 0.75, x + 1.25, 1.6, z + 0.75);
    for (const [x, z] of [[-15, 12], [15, -12]]) { A(x - 0.3, 0, z - 0.3, x + 0.3, 7, z + 0.3); AF.addLight({ x: ax + af * x, y: ay + 6.6, z: az + af * z, color: 0xfff0c8, intensity: 1.4, range: 22, kind: 'street' }); }
    army.gate = { x: ax, y: ay, z: az + af * 22, yaw: af > 0 ? PI : 0 }; army.crate = { x: ax, y: ay, z: az + af * 4, yaw: PI / 2 };
    // Dusty's Respray: just past the city's east edge, the door on the desert road
    const gx = 466, gz = -16, gf = -1, gy = padY(gx, gz, 10, 12);
    const gar = X4.garage = { name: 'Dusty\u2019s Respray', x: gx, z: gz, y: gy, f: gf, rx: 10, rz: 12, bank: 8, kind: 'garage', props: [] };
    O.pads.push(gar); AF.addLabel('Dusty\u2019s Respray', gx, gz, 'place');
    const G = (lx0, y0, lz0, lx1, y1, lz1) => AF.addCollider(gx + gf * lx0, gy + y0, gz + gf * lz0, gx + gf * lx1, gy + y1, gz + gf * lz1, TAG);
    G(-4.5, 0, -7, -4, 5, 7); G(4, 0, -7, 4.5, 5, 7); G(-4.5, 0, 6.5, 4.5, 5, 7);
    G(-4.5, 0, -7, -3.25, 5, -6.5); G(3.25, 0, -7, 4.5, 5, -6.5); G(-3.25, 3.75, -7, 3.25, 5, -6.5); G(-4.5, 4.75, -7, 4.5, 5.25, 7);
    G(3.1, 0, 2, 3.95, 0.95, 5.5);   // the workbench
    const P = (lx, lz, yaw) => ({ x: gx + gf * lx, y: gy, z: gz + gf * lz, yaw: yaw == null ? undefined : gf > 0 ? yaw : yaw + PI });
    gar.in = P(0, 0.5); gar.door = P(0, -11, 0); gar.out = P(-3, -9.5, PI); gar.side = P(-2.6, 3.5, 0);
    const b0 = P(-3.2, -5.2), b1 = P(3.2, 5.6); gar.box = [Math.min(b0.x, b1.x), Math.min(b0.z, b1.z), Math.max(b0.x, b1.x), Math.max(b0.z, b1.z)];
  });
  // ---------------------------------------------------------------- models
  function sandbags() { const m = new AF.Model(32, 4, 4); for (let y = 0; y < 4; y++) for (let x = 0; x < 32; x++) { const off = (y & 1) * 2, k = ((x + off) >> 2) & 1; m.box(x, y, 0, x + 1, y + 1, 4, k ? C.sand : C.sandD); } return m; }
  function tent() {
    const m = new AF.Model(24, 13, 32);
    for (let y = 0; y < 12; y++) { const w = Math.round(12 - y); m.box(12 - w, y, 0, 12 + w, y + 1, 32, y === 11 ? C.oliveD : C.canvas); }
    m.box(8, 0, 31, 16, 8, 32, C.dark); m.box(11, 12, 0, 13, 13, 32, C.oliveD); for (const z of [0, 31]) m.box(11, 0, z, 13, 12, z + 1, C.wood);
    return m;
  }
  function flood() { const m = new AF.Model(6, 30, 6); m.box(2, 0, 2, 4, 26, 4, C.steel); m.box(0, 26, 0, 6, 29, 6, C.dark); m.box(1, 27, 5, 5, 29, 6, C.lamp); m.box(0, 29, 0, 6, 30, 6, C.steel); return m; }
  function crates() {
    const m = new AF.Model(20, 13, 12);
    const box = (x, y, z, w, h, d, c) => { m.box(x, y, z, x + w, y + h, z + d, c); m.box(x, y + h - 1, z, x + w, y + h, z + d, C.oliveD); m.box(x + 2, y + 2, z + d - 1, x + w - 2, y + 3, z + d, C.stencil); };
    box(0, 0, 0, 10, 6, 12, C.olive); box(10, 0, 0, 10, 6, 12, C.olive); box(4, 6, 1, 10, 6, 10, C.olive); box(14, 6, 2, 6, 7, 8, C.wood);
    return m;
  }
  function garage(outer) {
    const m = new AF.Model(36, 21, 56), W = C.brick;
    m.box(0, 0, 0, 36, 1, 56, C.concrete);
    if (!outer) m.box(2, 1, 2, 34, 1, 54, C.concrete);
    m.box(0, 1, 0, 2, 20, 56, W); m.box(34, 1, 0, 36, 20, 56, W); m.box(0, 1, 54, 36, 20, 56, W);
    m.box(0, 1, 0, 7, 20, 2, W); m.box(29, 1, 0, 36, 20, 2, W); m.box(7, 15, 0, 29, 20, 2, W);
    m.box(0, 19, 0, 36, 21, 56, C.tin); for (let z = 0; z < 56; z += 4) m.box(0, 20, z, 36, 21, z + 1, C.steel);
    // the roll-up door, rolled up under the lintel; hazard stripes on the jambs
    m.box(7, 14, 0, 29, 15, 3, C.steel); for (let y = 1; y < 15; y++) for (const x of [6, 29]) m.set(x, y, 0, (y >> 1) & 1 ? C.stencil : C.dark);
    if (!outer) {
      for (let z = 8; z < 48; z += 10) m.box(4, 18, z, 32, 19, z + 1, C.booth);       // the booth's lamp strips
      m.box(32, 1, 8, 34, 4, 22, C.wood); for (const [z, c] of [[10, C.paint], [13, C.paintR], [16, C.stencil], [19, C.cream]]) m.box(32, 4, z, 33, 5, z + 2, c);   // bench + cans
      m.box(3, 1, 40, 5, 9, 42, C.steel); m.box(3, 9, 39, 5, 10, 43, C.dark);            // a spray rig
      for (let z = 4; z < 52; z += 6) m.box(17, 1, z, 19, 1, z + 3, C.stencil);          // the centre line
    }
    return m;
  }
  function sign() { return AF.textModel("DUSTY'S RESPRAY", C.cream, { bg: C.red, pad: 2, depth: 1 }); }

  // ---------------------------------------------------------------- placement (streamed, like 44-hideout)
  let gen = null;
  const put = (site, geo, lx, y, lz, rot = 0) => { const f = site.f || 1, p = O.addProp(geo, site.x + f * lx, y, site.z + f * lz, rot + (f < 0 ? 2 : 0), { tag: TAG, collide: false }); site.props.push(p); X4.stats.props++; return p; };
  function* build() {
    const G = AF.outlandSites.lib.geometry, g = function* (key, make, vs, o) { return yield* G('act4-' + key, make, vs, o); };
    const a = X4.army, r = X4.garage;
    if (a) {
      const sb = yield* g('sandbags', sandbags, 0.25);
      for (const x of [-12, -4, 4, 12]) put(a, sb, x, a.y, -15); for (const x of [-12, 12]) put(a, sb, x, a.y, 15); yield;
      for (const s of [-1, 1]) for (const z of [-7, 1, 9]) put(a, sb, s * 17, a.y, z, 1); yield;
      const tg = yield* g('tent', tent, 0.25); for (const x of [-10, 0, 10]) put(a, tg, x, a.y, x ? -8 : -9); yield;
      const fl = yield* g('flood', flood, 0.25); put(a, fl, -15, a.y, 12, 2); put(a, fl, 15, a.y, -12); yield;
      const cr = yield* g('crates', crates, 1 / 8); put(a, cr, -6, a.y, 4); put(a, cr, 7, a.y, 3, 1); put(a, cr, -13, a.y, -1, 2); yield;
    }
    if (r) {
      put(r, yield* g('garage', () => garage(false), 0.25, { outer: () => garage(true) }), 0, r.y - 0.25, 0); yield;
      const s = sign(); put(r, yield* g('sign', () => s, 1 / 16), 0, r.y + 4.1, -7.1, 2); yield;
    }
    X4.ready = true;
  }
  const work = (ms) => {
    if (!AF.ready || X4.ready || !AF.outlandSites || !AF.outlandSites.lib || !(X4.army || X4.garage)) return false;
    const end = performance.now() + Math.min(ms, AF.MOBILE ? 2 : 3);
    if (!gen) gen = build();
    while (performance.now() < end && !X4.ready) gen.next();
    return !X4.ready;
  };
  X4.settle = () => { while (work(6)); };
  if (AF.stream && AF.stream.register) AF.stream.register('heist-act4', { order: 27, gen: true, work, near: () => AF.ready && !X4.ready });

  // ---------------------------------------------------------------- the chase kit (built at the first use, hidden otherwise)
  const KIT = { helis: [], men: null, rear: null };
  const heliModel = () => {
    const m = new AF.Model(14, 14, 44), black = col(0x1c1c20, { metal: 0.3, rough: 0.5 }), maroon = col(0x6a1420, { metal: 0.2 }), glass = AF.col('glass'), skid = col(0x3a3a3e, { metal: 0.5 });
    for (let z = 10; z < 32; z++) for (let y = 3; y < 12; y++) for (let x = 2; x < 12; x++) { const ex = (x + 0.5 - 7) / 5, ey = (y + 0.5 - 7.5) / 4.5, ez = (z + 0.5 - 21) / 11; if (ex * ex + ey * ey + ez * ez < 1) m.set(x, y, z, y > 7 && z > 24 ? glass : y === 6 ? maroon : black); }
    m.box(6, 7, 0, 8, 10, 12, black); m.box(6, 8, 0, 8, 13, 3, maroon); m.box(5, 9, 0, 9, 10, 2, black);
    m.box(6, 12, 18, 8, 14, 22, C.dark); for (const x of [2, 11]) { m.box(x, 0, 12, x + 1, 1, 30, skid); for (const z of [15, 26]) m.box(x, 1, z, x + 1, 3, z + 1, skid); }
    m.box(2, 4, 16, 3, 9, 22, C.dark); m.box(11, 4, 16, 12, 9, 22, C.dark);   // open side doors (the gunners' dark doorways)
    return m;
  };
  X4.heli = (i) => {
    if (KIT.helis[i]) return KIT.helis[i];
    if (!KIT.hg) { KIT.hg = AF.meshModel(heliModel(), { vs: 0.25, anchor: [0.5, 0, 0.5] }); delete KIT.hg.userData.src; const rm = new AF.Model(96, 1, 3); rm.box(0, 0, 0, 96, 1, 3, C.dark); rm.box(46, 0, 0, 50, 1, 3, C.steel); KIT.rg = AF.meshModel(rm, { vs: 1 / 8, anchor: [0.5, 0, 0.5] }); const tm = new AF.Model(1, 14, 3); tm.box(0, 0, 0, 1, 14, 3, C.dark); KIT.tg = AF.meshModel(tm, { vs: 1 / 8, anchor: [0.5, 0.5, 0.5] }); }
    const grp = new THREE.Group(); grp.name = 'moretti-heli'; grp.rotation.order = 'YXZ';
    const body = AF.modelMesh(KIT.hg); grp.add(body);
    const rotor = AF.modelMesh(KIT.rg, { cast: false }); rotor.position.y = 3.55; rotor.position.z = 0.0; grp.add(rotor);
    const tail = AF.modelMesh(KIT.tg, { cast: false }); tail.position.set(0.3, 2.3, -5.3); grp.add(tail);
    grp.visible = false; AF.scene.add(grp);
    return (KIT.helis[i] = { grp, rotor, tail });
  };
  // the Moretti men in a limousine (car-local): the driver, a gunman leaning out of each side window; gunmen turn to their target
  const MEN = [[-0.95, 0.55, 0.15], [0.95, 0.55, -0.95]], DRV = [0.28, 0.4, 0.35];
  const manModel = (armed) => {
    const m = new AF.Model(6, 14, 11), suit = col(0x24242a), skin = col(0xe0b090), hat = col(0x1a1a1e), gun = col(0x161618, { metal: 0.6 });
    m.box(1, 0, 1, 5, 7, 4, suit); m.box(2, 7, 1, 4, 10, 4, skin); m.box(1, 10, 0, 5, 11, 5, hat); m.box(2, 11, 1, 4, 13, 4, hat);
    if (armed) { m.box(1, 5, 4, 5, 6, 7, suit); m.box(2, 4, 6, 4, 6, 11, gun); } else m.box(1, 4, 4, 5, 5, 6, suit);
    return m;
  };
  X4.gunmen = () => {
    if (KIT.men) return KIT.men;
    const mk = (armed, n) => { const g = AF.meshModel(manModel(armed), { vs: 1 / 10, anchor: [0.5, 0, 0.25] }); delete g.userData.src; const im = new THREE.InstancedMesh(g, AF.mat.voxelInst, n); im.customDepthMaterial = AF.mat.depthInst; im.frustumCulled = false; im.count = 0; im.castShadow = false; AF.scene.add(im); return im; };
    KIT.men = { driver: mk(false, 24), gun: mk(true, 48), seats: MEN, wheel: DRV };
    return KIT.men;
  };
  // the armoured car's rear: both doors swung open, a dark load bay, a pintle-mounted machine gun on the sill
  X4.rear = () => {
    if (KIT.rear) return KIT.rear;
    const grp = new THREE.Group(); grp.name = 'armoured-rear'; grp.rotation.order = 'YXZ';
    const door = new AF.Model(2, 19, 10); door.box(0, 0, 0, 2, 19, 10, C.oliveD); for (const y of [3, 9, 15]) door.box(0, y, 1, 1, y + 1, 9, C.steel); door.box(0, 11, 3, 1, 14, 7, C.dark);
    const dg = AF.meshModel(door, { vs: 0.1, anchor: [0.5, 0, 0] }); delete dg.userData.src;
    for (const s of [1, -1]) { const d = AF.modelMesh(dg, { cast: false }); d.position.set(s * 1.0, 0.35, -2.42); d.rotation.y = s > 0 ? 2 * PI / 3 : 4 * PI / 3; grp.add(d); }
    const bay = new AF.Model(18, 19, 1); bay.box(0, 0, 0, 18, 19, 1, C.dark);
    const bg = AF.meshModel(bay, { vs: 0.1, anchor: [0.5, 0, 0.5] }); delete bg.userData.src; const b = AF.modelMesh(bg, { cast: false }); b.position.set(0, 0.35, -2.43); grp.add(b);
    const lmg = new AF.Model(4, 14, 22); lmg.box(1, 0, 2, 3, 9, 4, C.steel); lmg.box(0, 9, 0, 4, 12, 12, C.dark); lmg.box(1, 10, 12, 3, 11, 22, C.dark); lmg.box(1, 6, 4, 3, 9, 8, C.olive);
    const lg = AF.meshModel(lmg, { vs: 1 / 16, anchor: [0.5, 0, 0.5] }); delete lg.userData.src;
    for (const s of [0.45, -0.45]) { const l = AF.modelMesh(lg, { cast: false }); l.position.set(s, 1.05, -2.3); l.rotation.y = PI; grp.add(l); }
    // the gunners' hatch: the back half of the roof thrown open (a dark well with a steel rim the crew stands up through)
    const hatch = new AF.Model(20, 2, 16); hatch.box(0, 0, 0, 20, 2, 16, C.steel); hatch.box(1, 1, 1, 19, 2, 15, C.dark);
    const hg = AF.meshModel(hatch, { vs: 0.1, anchor: [0.5, 0, 0.5] }); delete hg.userData.src; const hm = AF.modelMesh(hg, { cast: false }); hm.position.set(0, 2.52, -1.3); grp.add(hm);
    grp.visible = false; AF.scene.add(grp);
    return (KIT.rear = grp);
  };
  // the chase's mines: a squat olive disc with a red tally light (one instanced draw, up to 16, only while any are down)
  X4.mines = () => {
    if (KIT.mines) return KIT.mines;
    const m = new AF.Model(8, 3, 8), olive = col(0x3c4528, { metal: 0.3 }), led = col(0xff2a20, { emit: 0xff2010, emitK: 3, mode: 'always', jitter: 0 });
    for (let x = 0; x < 8; x++) for (let z = 0; z < 8; z++) if (Math.hypot(x - 3.5, z - 3.5) < 4) m.box(x, 0, z, x + 1, 2, z + 1, Math.hypot(x - 3.5, z - 3.5) < 2 ? C.steel : olive);
    m.box(3, 2, 3, 5, 3, 5, led);
    const g = AF.meshModel(m, { vs: 1 / 12, anchor: [0.5, 0, 0.5] }); delete g.userData.src;
    const im = new THREE.InstancedMesh(g, AF.mat.voxelInst, 16); im.customDepthMaterial = AF.mat.depthInst; im.frustumCulled = false; im.count = 0; im.castShadow = false; im.visible = false; AF.scene.add(im);
    return (KIT.mines = im);
  };
  // the kit links its programs behind the boot veil (PERF.md 3b): no shader may link mid-chase
  AF.on('preloaded', () => {
    if (!AF.stream || !AF.stream.compileAhead) return;
    try { const h = X4.heli(0), r = X4.rear(), men = X4.gunmen(), mines = X4.mines(); for (const o of [h.grp, r]) { o.visible = true; AF.stream.compileAhead(o).then(() => { o.visible = false; }); } for (const im of [men.driver, men.gun, mines]) { im.count = 1; im.visible = true; AF.stream.compileAhead(im).then(() => { im.count = 0; if (im === mines) { im.visible = false; X4.mineReady = true; } }); } }
    catch (e) { AF.warnOnce('act4 kit warm-up', e); }
  });
}
} catch (e) { AF.partError('81-heist-act4.js', e); }
