// ================================================================ 81-heist-bank.js
try {
// ===== 81-heist-bank: the Harbour Trust at midnight — guards, cameras, lights, locked doors, the vault gate, the laser grid, the
// deposit cage and the cash (OWNER: game). The rooms are voxels built by 21-downtown-2 (the back offices, the roof stair); this part
// owns everything that changes: AF.heistBank.night(on) arms the building for the heist's midnight act (zone 'bank' in 80-stealth).
// Route: roof bulkhead (keypad, the hacker opens it) -> stairs -> security corridor C1 -> C3 jog / records -> staff corridor C2 ->
// staff door -> the banking hall (round the back of the teller cages) -> the vault door -> keys + time lock -> lasers -> drill -> cash.
{
  const PI = Math.PI, S = AF.stealth;
  const HB = AF.heistBank = { ready: false, on: false, doors: {}, beams: [], laserOn: false, laserCut: 0, cageOpen: false, bags: [], spots: {}, zone: null, guards: [] };
  const c = (h, o) => AF.col(h, Object.assign({ jitter: 0.15, edge: 0.3 }, o));
  const mesh = (m, vs, anchor, x, y, z, yaw = 0) => { const g = AF.meshModel(m, { vs, anchor }); delete g.userData.src; const o = AF.modelMesh(g); o.position.set(x, y, z); o.rotation.y = yaw; o.castShadow = false; o.visible = false; AF.scene.add(o); return o; };
  const NOCOL = 1e-6;
  // a locked door: a mesh + a collider; open() drops the collider to zero height (no array churn) and hides the leaf
  const door = (name, box, m, at, yaw = 0) => {
    const col = AF.addCollider(box[0], box[1], box[2], box[3], box[4], box[5], 'heist-door-' + name);
    const d = HB.doors[name] = { name, col, y1: box[4], mesh: mesh(m, 1 / 8, [0.5, 0, 0.5], at[0], at[1], at[2], yaw), open: false, armed: false };
    return d;
  };
  HB.door = (name, open) => {
    const d = HB.doors[name]; if (!d) return;
    d.open = !!open; d.col.y1 = d.open || !d.armed ? d.col.y0 + NOCOL : d.y1; d.mesh.visible = !d.open && d.armed;
  };
  const armDoors = (on) => { for (const k in HB.doors) { const d = HB.doors[k]; d.armed = on && !d.always; HB.door(k, d.open); } };

  // ---------------------------------------------------------------- props: doors, gate, key boxes, cage + bags, lasers, cameras, the ladder
  const props = () => {
    const steel = c(0x6a7078, { metal: 0.85, rough: 0.35 }), dark = c(0x2a2c30, { metal: 0.6 }), brass = c(0xc9a24a, { metal: 0.9, rough: 0.3 }), wood = c(0x5a3a22, { pat: 'plank' }),
      red = c(0xa02828), keypad = c(0x30e080, { emit: 0x40ff90, emitK: 1.8, mode: 'always', jitter: 0 }), led = c(0xff2020, { emit: 0xff3030, emitK: 3, mode: 'always', jitter: 0 });
    // doors (1/8 m models, x = width)
    const leaf = (w, col, pad) => { const m = new AF.Model(w, 18, 2); m.box(0, 0, 0, w, 18, 2, col); m.box(1, 1, 0, w - 1, 17, 1, col); m.box(w - 3, 8, 0, w - 2, 9, 2, brass); if (pad) m.box(1, 9, 1, 3, 13, 2, keypad); return m; };
    door('bulkhead', [44.45, 14, -106.75, 44.8, 16.25, -105.5], leaf(10, steel, true), [44.62, 14, -106.125], PI / 2);
    door('hallEast', [38.5, 0.5, -113.2, 39.75, 2.75, -112.8], leaf(10, wood), [39.125, 0.5, -113.0], 0);
    door('c4', [43, 0.5, -107.5, 44.5, 2.75, -107.25], leaf(12, wood), [43.75, 0.5, -107.375], 0);
    door('fire', [39, 0.5, -105.2, 40.25, 2.75, -104.8], leaf(10, red), [39.625, 0.5, -105.0], 0);
    { const g = new AF.Model(2, 36, 32); for (let z = 0; z < 32; z += 3) g.box(0, 0, z, 2, 36, z + 1, dark); for (const y of [0, 12, 24, 35]) g.box(0, y, 0, 2, y + 1, 32, dark);
      door('front', [9.55, 0.5, -127, 9.85, 5, -123], g, [9.7, 0.5, -125], 0); }
    // the vault gate across the round doorway (x 42.35)
    { const g = new AF.Model(2, 28, 28); for (let z = 0; z < 28; z += 3) g.box(0, 0, z, 2, 28, z + 1, steel); for (const y of [0, 9, 18, 27]) g.box(0, y, 0, 2, y + 1, 28, steel); g.box(0, 12, 12, 2, 16, 16, brass);
      door('gate', [42.3, 0.5, -126.75, 42.65, 4, -123.25], g, [42.47, 0.5, -125], 0); }
    // key boxes either side of the doorway on the hall's east wall
    const kb = new AF.Model(2, 5, 4); kb.box(0, 0, 0, 2, 5, 4, brass); kb.box(0, 1, 1, 1, 4, 3, dark); kb.set(0, 2, 2, steel);
    HB.spots.keys = [{ x: 41.0, y: 0.5, z: -128.6 }, { x: 41.0, y: 0.5, z: -121.4 }];
    HB.keyMesh = HB.spots.keys.map((k) => mesh(kb, 1 / 8, [1, 0, 0.5], 41.75, 1.1, k.z));
    HB.spots.gate = { x: 41.3, y: 0.5, z: -125 };
    // the deposit cage against the vault's east wall + its door, four cash bags inside
    const cg = new AF.Model(2, 26, 34); for (let z = 0; z < 34; z += 3) cg.box(0, 0, z, 2, 26, z + 1, steel); for (const y of [0, 12, 25]) cg.box(0, y, 0, 2, y + 1, 34, steel);
    HB.cageMesh = mesh(cg, 1 / 8, [0.5, 0, 0.5], 47.9, 0.5, -125); HB.cageCol = AF.addCollider(47.8, 0.5, -127.1, 48.05, 3.75, -122.9, 'heist-cage');
    const sd = new AF.Model(16, 26, 2); sd.box(0, 0, 0, 2, 26, 2, steel); sd.box(14, 0, 0, 16, 26, 2, steel);
    for (const z of [-127.1, -122.9]) mesh(sd, 1 / 8, [0.5, 0, 0.5], 48.85, 0.5, z, 0).userData.cageSide = true;
    HB.cageSides = AF.scene.children.filter((o) => o.userData && o.userData.cageSide);
    for (const z of [-127.2, -122.9]) AF.addCollider(47.9, 0.5, z, 49.5, 3.75, z + 0.1, 'heist-cage-side');
    HB.cageCol.y1 = HB.cageCol.y0 + NOCOL;
    const bm = new AF.Model(7, 4, 4), canvas = c(0x3a4a2e), strap = c(0xb89a60); bm.box(0, 0, 0, 7, 3, 4, canvas); bm.box(0, 3, 1, 7, 4, 3, canvas); bm.box(1, 0, 0, 2, 4, 4, strap); bm.box(5, 0, 0, 6, 4, 4, strap); bm.set(3, 2, 3, brass);
    HB.spots.bags = [{ x: 48.7, y: 0.5, z: -126.4 }, { x: 48.7, y: 0.5, z: -125.4 }, { x: 48.7, y: 0.5, z: -124.5 }, { x: 48.7, y: 0.5, z: -123.6 }];
    HB.bags = HB.spots.bags.map((b, k) => mesh(bm, 1 / 8, [0.5, 0, 0.5], b.x, b.y, b.z, PI / 2 + k * 0.4));
    HB.spots.cage = { x: 47.55, y: 0.5, z: -125 };
    // the laser grid: emitters are part of the beam meshes (1 m red unit cubes scaled into thin beams)
    const lm = new AF.Model(1, 1, 1); lm.set(0, 0, 0, c(0xff2a2a, { emit: 0xff2020, emitK: 5, mode: 'always', jitter: 0, edge: 0 }));
    const lgeo = AF.meshModel(lm, { vs: 1, anchor: [0.5, 0.5, 0.5] }); delete lgeo.userData.src;
    const beam = (ax, x, y, z, len, mv) => { const o = AF.modelMesh(lgeo); o.castShadow = false; o.visible = false; AF.scene.add(o); const b = { ax, x0: x, y0: y, z0: z, x, y, z, len, mv: mv || null, mesh: o }; HB.beams.push(b); return b; };
    const F = 0.5, Z0 = -131.75, Z1 = -118.25, ZM = (Z0 + Z1) / 2;
    beam('z', 43.95, F + 1.35, ZM, Z1 - Z0);                                       // high: crouch under
    beam('z', 44.8, F + 0.3, (Z0 - 124.6) / 2, -124.6 - Z0);                       // low on the north half: hop over, or use the gap
    beam('z', 44.8, F + 1.1, (-123.4 + Z1) / 2, Z1 + 123.4);                       // waist-high on the south half: no way over
    beam('z', 45.65, F + 1.4, ZM, Z1 - Z0, { k: 'y', a: -0.75, b: 0.75, per: 4.2, ph: 0 });   // rises and falls: duck through when high
    beam('y', 46.45, F + 1.6, -125, 3.2, { k: 'z', a: -6, b: 6, per: 6.5, ph: 0.25 });         // a vertical blade sweeping the width
    beam('z', 47.15, F + 1.0, (Z0 - 126.1) / 2, -126.1 - Z0);
    beam('z', 47.15, F + 1.0, (-123.9 + Z1) / 2, Z1 + 123.9);                       // the cage door gap between these two
    HB.spots.laserIn = { x: 43.3, y: 0.5, z: -125 };
    // security cameras: a housing on a bracket, a red tally light (1/16 m model, origin at the lens; yaw by 80-stealth)
    const cm = new AF.Model(6, 5, 10); cm.box(1, 1, 0, 5, 4, 8, c(0xd8d8d0)); cm.box(2, 2, 8, 4, 3, 9, c(0x101012)); cm.set(4, 3, 1, led); cm.box(2, 4, 0, 4, 5, 2, dark);
    HB.camGeo = AF.meshModel(cm, { vs: 1 / 16, anchor: [0.5, 0.5, 0.85] }); delete HB.camGeo.userData.src;
    // the service ladder on the podium's Park Row face (climbed, not teleported: 81-heist plays the climb)
    const lx = 49.25, lz = -147.2, lad = new AF.Model(6, 112, 1);
    lad.box(0, 0, 0, 1, 112, 1, steel); lad.box(5, 0, 0, 6, 112, 1, steel); for (let y = 4; y < 112; y += 6) lad.box(1, y, 0, 5, y + 1, 1, steel);
    HB.ladder = mesh(lad, 1 / 8, [0.5, 0, 0], lx, 0.25, lz - 0.125); HB.ladder.visible = true;
    HB.spots.ladder = { x: lx, y: 0.25, z: lz - 0.6, yaw: 0, top: 14 };
    HB.spots.ladderTop = { x: lx - 1.2, y: 14, z: lz + 1.6, yaw: 0 };
    HB.spots.bulkhead = { x: 43.6, y: 14, z: -106.1, yaw: PI / 2 };
    HB.spots.roof = { x: 40, y: 14, z: -107, yaw: PI / 2 };
    HB.spots.stairTop = { x: 45.7, y: 14, z: -106, yaw: PI };
    HB.spots.stairBottom = { x: 48.2, y: 0.5, z: -106 };
    HB.spots.c1 = { x: 43.6, y: 0.5, z: -106.1 };
    HB.spots.hall = { x: 14.4, y: 0.5, z: -114.5 };
    HB.spots.fire = { x: 39.6, y: 0.5, z: -103.4 };
    HB.spots.front = { x: 8.5, y: 0.25, z: -125 };
  };

  // ---------------------------------------------------------------- the stealth zone: guards, cameras, light circuits, noise makers, nav
  const zone = () => {
    if (!S) return;
    const nav = {
      pts: [[47, 0.5, -106], [43.6, 0.5, -106], [38, 0.5, -105.9], [32.1, 0.5, -105.9], [23.75, 0.5, -105.9], [32.1, 0.5, -109], [32.1, 0.5, -111.4], [23.75, 0.5, -109],
        [28.75, 0.5, -109.9], [28.75, 0.5, -111.4], [36, 0.5, -111.4], [24, 0.5, -111.4], [19.75, 0.5, -111.4], [14.4, 0.5, -111.4], [14.4, 0.5, -114.5], [19.75, 0.5, -109],
        [34.6, 0.5, -105.9], [36, 0.5, -109], [14, 0.5, -115.5], [25, 0.5, -115.5], [37.5, 0.5, -115.5], [14, 0.5, -123.5], [25, 0.5, -123.5], [37.5, 0.5, -123.5],
        [40.3, 0.5, -125], [40.6, 0.5, -117], [40.6, 0.5, -130], [40, 0.5, -135.5], [16.5, 0.5, -135.5], [13.3, 0.5, -131], [41.2, 0.5, -111.4]],
      links: [[0, 1], [1, 2], [2, 16], [16, 3], [3, 4], [3, 5], [5, 6], [4, 7], [7, 8], [8, 9], [6, 9], [6, 10], [10, 30], [9, 11], [11, 12], [12, 13], [13, 14], [12, 15], [16, 17],
        [14, 18], [18, 19], [19, 20], [20, 25], [25, 24], [24, 26], [26, 27], [27, 28], [28, 29], [29, 21], [18, 21], [21, 22], [22, 23], [23, 24], [19, 22], [20, 23]],
    };
    const z = HB.zone = S.define('bank', { box: [10, 0, -147, 50, 18, -103], mode: 'fight', nav, voice: 'g1', reflexS: 2.0, radius: 120, feedTitle: 'KESTREL \u00b7 HARBOUR TRUST' });
    HB.guards.forEach((p, i) => S.guard('bank', { path: p.path, voice: ['g1', 'g2', 'g3', 'g4'][i % 4], name: p.name, range: p.range || 15 }));
    const cam = (o) => { const k = S.camera('bank', o); if (HB.camGeo) { const m = AF.modelMesh(HB.camGeo); m.position.set(o.x, o.y, o.z); m.castShadow = false; m.visible = false; AF.scene.add(m); k.mesh = m; } return k; };
    cam({ name: 'ROOF ACCESS', x: 41.2, y: 16.4, z: -108.6, yaw0: 0.95, sweep: 0, pitch: 0.42, range: 0 });
    cam({ name: 'STAIRWELL', x: 49.0, y: 3.9, z: -112.5, yaw0: -0.25, sweep: 0, pitch: 0.3, range: 0 });
    cam({ name: 'SECURITY CORRIDOR', x: 22.6, y: 3.85, z: -106.3, yaw0: PI / 2, sweep: 0.85, period: 9, pitch: 0.18, range: 17, fov: 0.9 });
    cam({ name: 'RECORDS', x: 30.6, y: 3.85, z: -110.2, yaw0: -1.9, sweep: 0, pitch: 0.4, range: 0 });
    cam({ name: 'STAFF CORRIDOR', x: 43.9, y: 3.85, z: -111.75, yaw0: -PI / 2, sweep: 0.75, period: 11, ph: 0.4, pitch: 0.16, range: 18, fov: 0.9 });
    cam({ name: 'HALL EAST', x: 41.5, y: 8.4, z: -114.0, yaw0: -2.36, sweep: 0.55, period: 13, pitch: 0.42, range: 21, fov: 0.88 });
    cam({ name: 'HALL WEST', x: 11.6, y: 8.4, z: -136.4, yaw0: 0.79, sweep: 0.55, period: 12, ph: 0.5, pitch: 0.42, range: 21, fov: 0.88 });
    cam({ name: 'VAULT DOOR', x: 41.55, y: 4.4, z: -116.6, yaw0: PI, sweep: 0.28, period: 7, pitch: 0.38, range: 12, fov: 0.88 });
    cam({ name: 'VAULT', x: 43.4, y: 4.1, z: -131.5, yaw0: 0.6, sweep: 0, pitch: 0.42, range: 0 });
    const lamp = (x, y, zz) => { const L = { x, y, z: zz, color: 0xffe0b0, intensity: 1.1, range: 9, kind: 'lamp', night: true }; AF.addLight(L); return L; };
    const circuit = (name, box, pts) => S.lights('bank', { name, box, y: pts[0][1] - 3.4, lamps: pts.map((p) => lamp(p[0], p[1], p[2])) });
    circuit('Security corridor', [22.25, -107.5, 44.5, -105.25], [[26, 3.9, -106.25], [33, 3.9, -106.25], [40, 3.9, -106.25]]);
    circuit('Staff corridor', [11.25, -112.75, 44.5, -110.5], [[15, 3.9, -111.75], [24, 3.9, -111.75], [33, 3.9, -111.75], [41, 3.9, -111.75]]);
    circuit('Records', [22.25, -110.75, 31, -107.5], [[26.5, 3.9, -109]]);
    circuit('Hall west', [11, -137, 26.5, -113], [[17, 8.2, -128.5], [17, 8.2, -119.5], [22, 8.2, -134]]);
    circuit('Hall east', [26.5, -137, 42, -113], [[31, 8.2, -128.5], [36, 8.2, -119.5], [36, 8.2, -128.5], [31, 8.2, -119.5], [39, 8.2, -134]]);
    const pt = (name, kind, x, y, zz, sfx) => S.point('bank', { name, kind, x, y, z: zz, sfx, r: 13 });
    pt('Security phone', 'phone', 39.5, 1.2, -109.6, 'phone'); pt('Records printer', 'printer', 30.3, 1.0, -109.9, 'click_metal'); pt('Staff radio', 'radio', 21, 1.2, -112.4, 'phone');
    pt('Manager\u2019s clock', 'alarm', 15, 1.4, -108.6, 'ui_alert'); pt('Teller phone', 'phone', 30, 1.3, -132.8, 'phone'); pt('Stock ticker', 'printer', 36.8, 1.4, -122, 'click_metal');
    pt('Desk phone', 'phone', 18, 1.3, -118, 'phone');
  };

  // ---------------------------------------------------------------- guards (path walkers; disabled until the night)
  AF.onBuild('heist-bank-guards', 600, () => {
    const WK = AF.walkers; if (!WK || !WK.addPath || !AF.peopleKit) return;
    const rng = AF.rng(8128), look = (yaw) => { const L = AF.peopleKit.makeLook('police', 'm', 'adult', rng); L.top = Object.assign({}, L.top, { col: 0x1f2a44 }); L.bottom = Object.assign({}, L.bottom, { col: 0x1f2a44 }); if (yaw != null) L.yaw = yaw; return L; };
    const add = (name, pts, o, extra) => { try { const p = WK.addPath('heist bank ' + name, pts, Object.assign({ count: 1, activeRadius: 110, looks: [look(o.yaw)] }, o)); p.enabled = false; HB.guards.push(Object.assign({ path: p, name: 'Guard' }, extra)); } catch (e) { AF.warnOnce('heist bank guards', e); } };
    add('c1', [[43.4, 0.5, -105.85], [24, 0.5, -105.85]], { speed: 1.1, mode: 'pingpong', dwell: [{ i: 0, t: 5 }, { i: 1, t: 4 }] });
    add('c2', [[14.6, 0.5, -111.3], [36, 0.5, -111.3]], { speed: 1.0, mode: 'pingpong', dwell: [{ i: 0, t: 4 }, { i: 1, t: 5 }] });
    add('office', [[36.5, 0.5, -109], [41.3, 0.5, -109]], { speed: 0.6, mode: 'pingpong', dwell: [{ i: 0, t: 9 }, { i: 1, t: 9 }] }, { name: 'Desk guard' });
    add('hall-w', [[14, 0.5, -115.5], [25, 0.5, -115.5], [25, 0.5, -123.5], [14, 0.5, -123.5]], { speed: 1.0, mode: 'loop' });
    add('hall-e', [[27.6, 0.5, -115.5], [37.5, 0.5, -115.5], [37.5, 0.5, -123.5], [27.6, 0.5, -123.5]], { speed: 0.95, mode: 'loop' });
    add('vault', [[40.2, 0.5, -125], [40.2, 0.5, -122.6]], { speed: 0.5, mode: 'pingpong', dwell: [{ i: 0, t: 8 }, { i: 1, t: 5 }] }, { name: 'Vault guard' });
    add('cages', [[16.5, 0.5, -135.6], [39.6, 0.5, -135.6]], { speed: 1.05, mode: 'pingpong', dwell: [{ i: 0, t: 3 }, { i: 1, t: 3 }] });
  });
  AF.onBuild('heist-bank', 890, () => { try { props(); zone(); HB.ready = true; } catch (e) { AF.warnOnce('heist bank', e); } });

  // ---------------------------------------------------------------- arming the building for the night
  // the bank is shut at night: no clerks or customers at its spots (55's extras ask)
  AF.closedAt = (building) => HB.on && building === 'harbour-trust';
  HB.night = (on) => {
    if (!HB.ready) return;
    HB.on = !!on;
    for (const g of HB.guards) g.path.enabled = !!on;
    armDoors(!!on);
    for (const k of HB.keyMesh || []) k.visible = !!on;
    if (HB.cageMesh) HB.cageMesh.visible = !!on && !HB.cageOpen; for (const s of HB.cageSides || []) s.visible = !!on;
    if (!on) { HB.lasers(false); HB.bagsShow(0); }
    if (S) { if (on) { S.reset('bank'); S.activate('bank'); } else if (S.zone === HB.zone) S.activate(null); }
  };
  HB.reset = () => {
    for (const k of ['bulkhead', 'hallEast', 'c4', 'fire', 'front', 'gate']) if (HB.doors[k]) HB.doors[k].open = false;
    armDoors(HB.on); HB.cage(false); HB.laserCut = 0; if (S) S.reset('bank');
  };
  HB.cage = (open) => { HB.cageOpen = !!open; if (HB.cageCol) HB.cageCol.y1 = open ? HB.cageCol.y0 + NOCOL : HB.cageCol.y0 + 3.25; if (HB.cageMesh) HB.cageMesh.visible = HB.on && !open; };
  HB.bagsShow = (mask) => { HB.bags.forEach((b, k) => { b.visible = !!(mask & (1 << k)); }); };
  HB.lasers = (on) => { HB.laserOn = !!on; for (const b of HB.beams) b.mesh.visible = !!on; };
  HB.cutLasers = (s) => { HB.laserCut = s; };
  // per frame while armed: move the sweepers, blink when cut, and report contact with the player
  const PB = { x: 0, y: 0, z: 0 };
  HB.touch = () => {
    if (!HB.laserOn || HB.laserCut > 0 || AF.mode !== 'walk') return false;
    const p = AF.player; PB.x = p.x; PB.y = p.y; PB.z = p.z;
    if (p.x < 43.3 || p.x > 48.2 || p.z < -132 || p.z > -118) return false;
    const h = p.crouch ? 1.12 : 1.75, r = 0.26;
    for (const b of HB.beams) {
      if (b.ax === 'z') { if (Math.abs(p.x - b.x) < r && Math.abs(p.z - b.z) < b.len / 2 + r && b.y > p.y + 0.04 && b.y < p.y + h) return true; }
      else if (b.ax === 'x') { if (Math.abs(p.z - b.z) < r && Math.abs(p.x - b.x) < b.len / 2 + r && b.y > p.y + 0.04 && b.y < p.y + h) return true; }
      else if (Math.hypot(p.x - b.x, p.z - b.z) < r + 0.03 && b.y - b.len / 2 < p.y + h && b.y + b.len / 2 > p.y) return true;
    }
    return false;
  };
  AF.onTick('heist-bank', 428, (dt) => {
    if (!HB.on || !HB.laserOn) return;
    if (HB.laserCut > 0) HB.laserCut -= dt;
    const W = AF.clock.w, cut = HB.laserCut > 0, blink = cut && HB.laserCut < 1.5 && (W * 6) % 1 < 0.5;
    for (const b of HB.beams) {
      if (b.mv) { const u = 0.5 + 0.5 * Math.sin((W / b.mv.per + b.mv.ph) * PI * 2), o = b.mv.a + (b.mv.b - b.mv.a) * u; b.x = b.x0 + (b.mv.k === 'x' ? o : 0); b.y = b.y0 + (b.mv.k === 'y' ? o : 0); b.z = b.z0 + (b.mv.k === 'z' ? o : 0); }
      const m = b.mesh, vis = !cut || blink; if (m.visible !== vis) m.visible = vis;
      m.position.set(b.x, b.y, b.z);
      if (b.ax === 'z') m.scale.set(0.035, 0.035, b.len); else if (b.ax === 'x') m.scale.set(b.len, 0.035, 0.035); else m.scale.set(0.035, b.len, 0.035);
    }
  });

  AF.test('heist bank: night arms doors + guards, the roof stair reaches the corridor, lasers catch a standing body and not a crouched one', () => {
    if (!HB.ready) return { ok: false, info: 'not built' };
    const was = HB.on;
    try {
      HB.night(true);
      const locked = AF.boxBlocked(44.62, 14.1, -106.1, 0.2, 1.5) && AF.boxBlocked(9.7, 0.6, -125, 0.2, 1.5);
      HB.door('bulkhead', true); const open = !AF.boxBlocked(44.62, 14.1, -106.1, 0.2, 1.5);
      // walk the stair by probing each tread for headroom
      let stair = true; for (let f = 0; f < 6 && stair; f++) for (let s = 0; s < 9; s++) { const yA = [14, 11.75, 9.5, 7.25, 5, 2.75][f], top = yA - 0.25 * (s + 1), x = f % 2 ? 48.2 : 45.7, z = f % 2 === 0 ? -106.75 - 0.5 * s - 0.25 : -111.25 + 0.5 * s + 0.25; if (!AF.solidAt(x, top - 0.1, z) || AF.solidAt(x, top + 0.3, z) || AF.solidAt(x, top + 1.7, z)) { stair = false; break; } }
      const corridor = !AF.solidAt(40, 1.3, -106.2) && !AF.solidAt(44.6, 1.3, -106.2) && !AF.solidAt(32, 1.3, -109) && !AF.solidAt(14.4, 1.3, -113);
      HB.lasers(true); HB.laserCut = 0;
      const P = AF.player, k = { x: P.x, y: P.y, z: P.z, crouch: P.crouch }, mode = AF.mode;
      let stand = false, duck = true;
      try { AF.mode = 'walk'; Object.assign(P, { x: 43.95, y: 0.5, z: -128, crouch: false }); stand = HB.touch(); P.crouch = true; duck = HB.touch(); }
      finally { AF.mode = mode; Object.assign(P, k); }
      return { ok: locked && open && stair && corridor && stand && !duck && HB.zone && HB.zone.guards.length >= 6 && HB.zone.cams.length >= 8, info: `locked ${locked}, opens ${open}, stair ${stair}, corridors ${corridor}, laser stand ${stand} duck ${duck}, guards ${HB.zone && HB.zone.guards.length}` };
    } finally { HB.reset(); HB.night(was); }
  });
}
} catch (e) { AF.partError('81-heist-bank.js', e); }
