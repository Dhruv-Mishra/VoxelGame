// ================================================================ 56-wild.js
try {
// ===== 56-wild: outland filler fauna — deer and rabbits in the woods and meadows, sheep and cows in the Westmoor fields,
//       hawks circling the range. One shared InstancedMesh per species; herds wake within ~260 m (hawks 700 m), step at 15 Hz,
//       flee from the player on foot, never walk onto water or roads. Zero per-frame allocation.
const O = AF.outland, WD = AF.wild = { herds: [], stats: { herds: 0, animals: 0, active: 0, draws: 0, ms: 0 } };
const matrix = new THREE.Matrix4(), quat = new THREE.Quaternion(), pos = new THREE.Vector3(), scl = new THREE.Vector3(1, 1, 1), euler = new THREE.Euler(0, 0, 0, 'YXZ');
const SPECIES = {};
function model(build, w, h, d) { const m = new AF.Model(w, h, d); build(m); return m; }
function species(id, m, vs, cap, opts = {}) {
  const geo = AF.meshModel(m, { vs, anchor: [0.5, 0, 0.5] });
  const mesh = new THREE.InstancedMesh(geo, AF.mat.voxelInst, cap); mesh.name = 'wild-' + id; mesh.count = 0; mesh.frustumCulled = false;
  mesh.castShadow = !!opts.shadow; mesh.receiveShadow = true; mesh.customDepthMaterial = AF.mat.depthInst; mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); mesh.layers.set(31);
  AF.scene.add(mesh); SPECIES[id] = { id, mesh, cap, write: 0, speed: opts.speed ?? 1, run: opts.run ?? 0, hop: opts.hop ?? 0, fly: !!opts.fly };
}
function* spots(step, test) { for (let x = O.play.x0 + 40; x < O.play.x1 - 40; x += step) for (let z = O.play.z0 + 40; z < 260; z += step) { const px = x + (AF.hash2(x, z) - 0.5) * step * 0.6, pz = z + (AF.hash2(z, x) - 0.5) * step * 0.6; if (AF.W.col(px, pz) < 0 && test(px, pz)) yield [px, pz]; } }
const dry = (x, z) => O.waterY(x, z) === null && O.roadDistance(x, z) > 12 && !O.pads.some((pad) => Math.abs(x - pad.x) < pad.rx + 6 && Math.abs(z - pad.z) < pad.rz + 6);
function herd(kind, x, z, n, r) {
  const h = { kind, x, z, r, members: [], active: false, acc: 0 };
  for (let index = 0; index < n; index++) {
    const a = AF.hash2(x + index, z) * Math.PI * 2, d = r * Math.sqrt(AF.hash2(z + index, x));
    let mx = x + Math.cos(a) * d, mz = z + Math.sin(a) * d;
    if (O.waterY(mx, mz) !== null) { mx = x; mz = z; }
    h.members.push({ uid: 9000 + WD.stats.animals + index, x: mx, z: mz, y: O.groundY(mx, mz), yaw: a, tx: mx, tz: mz, wait: AF.hash2(index, x) * 6, v: 0, phase: index * 1.7, ph0: index * 1.7, flee: 0, ox: 0, oz: 0, ka: null, kb: null, A: { x: mx, z: mz }, B: { x: mx, z: mz } });
  }
  WD.herds.push(h); WD.stats.animals += n; return h;
}
AF.onBuild('wild', 668, () => {
  const c = (hex, o) => AF.col(hex, Object.assign({ jitter: 0.5, edge: 0.2 }, o));
  const brown = c(0x8a5a34), tan = c(0xb98a5a), white = c(0xefe8da), dark = c(0x2a2420), antler = c(0xcbb08a), wool = c(0xe9e4d6), face = c(0x3a3330), hide = c(0x5a3a28), patch = c(0xf0ece2), grey = c(0x9a8a78), wing = c(0x6a4a30), beak = c(0xd8a83a);
  // deer: 1/10 m voxels, faces +z
  species('deer', model((m) => {
    m.box(2, 6, 2, 6, 10, 13, brown); m.box(2, 6, 2, 6, 7, 13, tan); m.box(3, 9, 1, 5, 11, 2, white);
    for (const [x, z] of [[2, 3], [5, 3], [2, 11], [5, 11]]) m.box(x, 0, z, x + 1, 6, z + 1, brown);
    m.box(3, 9, 12, 5, 14, 14, brown); m.box(3, 13, 14, 5, 15, 17, brown); m.box(3, 13, 16, 5, 14, 17, dark);
    m.box(2, 15, 14, 3, 17, 15, brown); m.box(5, 15, 14, 6, 17, 15, brown);
    m.box(2, 15, 13, 3, 19, 14, antler); m.box(5, 15, 13, 6, 19, 14, antler); m.box(1, 18, 13, 3, 19, 14, antler); m.box(5, 18, 13, 7, 19, 14, antler);
  }, 8, 20, 18), 0.1, 64, { speed: 1.1, run: 7, shadow: true });
  species('rabbit', model((m) => {
    m.box(1, 1, 1, 5, 4, 7, grey); m.box(2, 1, 0, 4, 3, 1, white); m.box(1, 3, 6, 5, 6, 9, grey); m.box(2, 6, 7, 3, 9, 8, grey); m.box(3, 6, 7, 4, 9, 8, grey);
    m.box(1, 0, 1, 2, 1, 3, grey); m.box(4, 0, 1, 5, 1, 3, grey); m.box(2, 0, 6, 3, 1, 7, grey); m.box(3, 0, 6, 4, 1, 7, grey); m.box(2, 4, 9, 4, 5, 10, dark);
  }, 6, 10, 10), 0.06, 96, { speed: 0.8, run: 5, hop: 1 });
  species('sheep', model((m) => {
    m.box(1, 4, 1, 8, 10, 12, wool); m.box(2, 10, 2, 7, 11, 11, wool);
    for (const [x, z] of [[2, 2], [6, 2], [2, 10], [6, 10]]) m.box(x, 0, z, x + 1, 4, z + 1, face);
    m.box(3, 7, 12, 6, 11, 15, face); m.box(2, 9, 12, 3, 10, 13, face); m.box(6, 9, 12, 7, 10, 13, face);
  }, 9, 12, 16), 0.1, 96, { speed: 0.5, run: 2.5 });
  species('cow', model((m) => {
    m.box(1, 6, 1, 9, 13, 17, hide); m.box(2, 8, 4, 9, 12, 8, patch); m.box(1, 9, 11, 5, 13, 15, patch);
    for (const [x, z] of [[1, 2], [7, 2], [1, 15], [7, 15]]) m.box(x, 0, z, x + 2, 6, z + 2, hide);
    m.box(3, 9, 17, 7, 14, 21, hide); m.box(3, 9, 20, 7, 11, 22, patch); m.box(2, 14, 18, 3, 15, 19, antler); m.box(7, 14, 18, 8, 15, 19, antler); m.box(5, 4, 4, 6, 6, 6, patch);
  }, 10, 16, 23), 0.11, 64, { speed: 0.45, run: 2, shadow: true });
  species('hawk', model((m) => {
    m.box(6, 1, 2, 9, 3, 10, wing); m.box(0, 2, 4, 15, 3, 8, wing); m.box(1, 2, 5, 14, 3, 7, brown); m.box(7, 1, 10, 9, 3, 12, white); m.box(7, 1, 12, 9, 2, 13, beak); m.box(5, 2, 0, 10, 3, 2, wing);
  }, 15, 4, 13), 0.12, 16, { fly: true });
  // herds by habitat (deterministic): deer in woods, rabbits in meadows, sheep/cows in the fields, hawks over the range
  let n = 0;
  for (const [x, z] of spots(150, (x, z) => ['forest', 'range', 'valley', 'jungle'].includes(O.biome(x, z)) && O.h(x, z) < 110 && dry(x, z))) if (AF.hash2(x * 3, z) < 0.45) { herd('deer', x, z, 3 + (n++ % 3), 18); }
  for (const [x, z] of spots(130, (x, z) => O.h(x, z) > 2 && dry(x, z) && O.biome(x, z) !== 'desert')) if (AF.hash2(x, z * 3) < 0.35) herd('rabbit', x, z, 2 + (n++ % 3), 10);
  for (const [x, z] of spots(70, (x, z) => O.biome(x, z) === 'farmland' && !O.fieldWheat(x, z) && O.fieldEdge(x, z) > 8 && dry(x, z))) if (AF.hash2(x + 7, z) < 0.4) herd(AF.hash2(x, z) < 0.55 ? 'sheep' : 'cow', x, z, AF.hash2(z, x) < 0.5 ? 6 : 4, 12);
  for (const [x, z] of [[220, -700], [-300, -650], [600, -600], [-700, -560], [900, -400], [-1050, -120]]) { const h = herd('hawk', x, z, 1, 0); h.alt = Math.max(O.h(x, z), 0) + 55 + AF.hash2(x, z) * 30; h.r = 35 + AF.hash2(z, x) * 30; }
  WD.stats.herds = WD.herds.length;
});
// where each animal grazes is a function of the shared world clock (01-core): every 7-15 s it walks to a spot in its herd's
// circle picked by a seeded hash, so co-op players see the same herds. Fleeing from a player on foot is a local offset that eases back.
function spot(h, a, k, out) {
  for (let j = 0; j < 4; j++) {
    const ang = AF.whash(a.uid, k, j) * Math.PI * 2, d = h.r * Math.sqrt(AF.whash(a.uid, k, j + 10)), x = h.x + Math.cos(ang) * d, z = h.z + Math.sin(ang) * d;
    if (O.waterY(x, z) === null && O.roadDistance(x, z) > 10) { out.x = x; out.z = z; return out; }
  }
  out.x = h.x; out.z = h.z; return out;
}
const PERIOD = 1 / 15;
function step(h, dt, cam, player, W) {
  const S = SPECIES[h.kind];
  for (const a of h.members) {
    if (S.fly) { a.phase = a.ph0 + W * 6 / h.r; a.x = h.x + Math.cos(a.phase) * h.r; a.z = h.z + Math.sin(a.phase) * h.r; a.y = h.alt + Math.sin(a.phase * 3) * 2; a.yaw = a.phase + Math.PI; continue; }
    const SL = 7 + AF.hash2(a.uid, 5) * 8, u = (W + AF.hash2(a.uid, 6) * SL) / SL, k = Math.floor(u), f = (u - k) * SL;
    if (a.kb !== k) { if (a.kb === k - 1) { const t = a.A; a.A = a.B; a.B = t; } else spot(h, a, k - 1, a.A); spot(h, a, k, a.B); a.ka = k - 1; a.kb = k; }
    const A = a.A, B = a.B, d = Math.hypot(B.x - A.x, B.z - A.z), v = Math.max(S.speed, d / (SL * 0.85)), tw = d / v;
    let x = B.x, z = B.z; a.v = 0;
    if (f < tw) { const e = f / tw; x = A.x + (B.x - A.x) * e; z = A.z + (B.z - A.z) * e; a.v = v; a.yaw += AF.angDiff(a.yaw, Math.atan2(B.x - A.x, B.z - A.z)) * Math.min(1, dt * 6); }
    // a player on foot nearby sends it running (this player's screen only); the offset then eases back to the shared spot
    if (player && S.run) { const dx = a.x - player.x, dz = a.z - player.z, d2 = dx * dx + dz * dz; if (d2 < (S.run > 3 ? 196 : 36)) { a.flee = 2.5; const dd = Math.sqrt(d2) || 1; a.fx = dx / dd; a.fz = dz / dd; } }
    if (a.flee > 0) { a.flee -= dt; const nx = x + a.ox + a.fx * S.run * dt, nz = z + a.oz + a.fz * S.run * dt; if (O.waterY(nx, nz) === null) { a.ox += a.fx * S.run * dt; a.oz += a.fz * S.run * dt; } a.v = S.run; a.yaw += AF.angDiff(a.yaw, Math.atan2(a.fx, a.fz)) * Math.min(1, dt * 6); }
    else if (a.ox || a.oz) { const k2 = Math.exp(-dt * 0.25); a.ox *= k2; a.oz *= k2; if (Math.abs(a.ox) + Math.abs(a.oz) < 0.05) a.ox = a.oz = 0; }
    a.x = x + a.ox; a.z = z + a.oz; a.y = O.groundY(a.x, a.z);
  }
}
AF.onTick('wild', 334, (dt, t) => {
  if (!AF.ready || !WD.herds.length) return;
  const start = performance.now(), cam = AF.camera.position, player = AF.mode === 'walk' && AF.player ? AF.player : null;
  for (const id in SPECIES) SPECIES[id].write = 0;
  let active = 0;
  for (const h of WD.herds) {
    const S = SPECIES[h.kind], reach = S.fly ? 700 : 260, dx = h.x - cam.x, dz = h.z - cam.z;
    h.active = dx * dx + dz * dz < reach * reach; if (!h.active) continue;
    h.acc += dt; if (h.acc >= PERIOD) { step(h, Math.min(h.acc, 0.3), cam, player, t); h.acc = 0; }
    for (const a of h.members) {
      if (S.write >= S.cap) break;
      const hop = S.hop && a.v > 0 ? Math.abs(Math.sin(t * 9 + a.phase)) * 0.35 : 0, graze = !S.fly && a.v === 0 ? Math.sin(t * 0.8 + a.phase) * 0.08 : 0;
      euler.set(graze, a.yaw, S.fly ? Math.sin(a.phase * 2) * 0.35 : 0); quat.setFromEuler(euler); pos.set(a.x, a.y + hop, a.z);
      matrix.compose(pos, quat, scl); S.mesh.setMatrixAt(S.write++, matrix); active++;
    }
  }
  let draws = 0;
  for (const id in SPECIES) { const S = SPECIES[id]; if (S.mesh.count !== S.write) S.mesh.layers.set(S.write ? 0 : 31); S.mesh.count = S.write; if (S.write) { S.mesh.instanceMatrix.clearUpdateRanges(); S.mesh.instanceMatrix.addUpdateRange(0, S.write * 16); S.mesh.instanceMatrix.needsUpdate = true; draws++; } }
  WD.stats.active = active; WD.stats.draws = draws; WD.stats.ms = performance.now() - start;
});
AF.test('wild: outland fauna herds by habitat, shared instanced draws', () => {
  const kinds = {}; for (const h of WD.herds) kinds[h.kind] = (kinds[h.kind] || 0) + h.members.length;
  let wet = 0; for (const h of WD.herds) for (const a of h.members) if (!SPECIES[h.kind].fly && O.waterY(a.x, a.z) !== null) wet++;
  return { ok: Object.keys(kinds).length === 5 && WD.stats.animals > 60 && !wet && Object.keys(SPECIES).length === 5, info: JSON.stringify(kinds) + ', wet ' + wet + ', ' + JSON.stringify(WD.stats) };
});
} catch (e) { AF.partError('56-wild.js', e); }
