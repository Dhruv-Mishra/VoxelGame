// ================================================================ 44-farms.js
try {
// ===== 44-farms: Westmoor crops and farm life. Fields come from 07-outland's field function (re-derived in field space, so
//       rows follow the painted stripes): wheat, corn, sunflowers, vineyards, vegetables (cabbage / pumpkin / lavender /
//       lettuce), fallow and meadows. Crops are four shared near InstancedMeshes (one 4 x 2.5 m row segment per instance,
//       wind sway) plus one shared box "canopy" InstancedMesh to the far range; dithered hand-over, selection in idle slots,
//       no shadows. Farm machines (combines, tractors) are merged props when parked and two instanced batches when working.
//       Scarecrows, bales, troughs, hives, sheds, bins, wind pumps, coops: merged outland props (zero extra draws).
const O = AF.outland, hash = AF.hash2, noise = AF.noise2, smooth = AF.smooth;
const FM = AF.farms = { fields: [], movers: [], meshes: [], models: {}, stats: { ready: false, phase: 'idle', records: 0, kinds: [0, 0, 0, 0, 0], props: 0, draws: 0, triangles: 0, near: 0, mid: 0, workMs: 0, maxSliceMs: 0, selects: 0, fields: 0, walkers: 0 } };
// ---------------------------------------------------------------- field space (mirror of 07-outland farmAt; guarded by a test)
const U_K = 1 + 0.19 * 0.12;
const toU = (x, z) => x + z * 0.19 + (noise(x * 0.012, z * 0.012) - 0.5) * 15;
function toWorld(U, V, out) {
  let x = (U - 0.19 * V) / U_K, z = V + 0.12 * x;
  for (let step = 0; step < 5; step++) { x = (U - 0.19 * V - (noise(x * 0.012, z * 0.012) - 0.5) * 15) / U_K; z = V + 0.12 * x; }
  out[0] = x; out[1] = z; return out;
}
// world displacement of a unit field-space step (dU,dV) at (x,z)
function worldStep(x, z, dU, dV, out) {
  const a = 1 + (noise((x + 0.5) * 0.012, z * 0.012) - noise((x - 0.5) * 0.012, z * 0.012)) * 15, b = 0.19 + (noise(x * 0.012, (z + 0.5) * 0.012) - noise(x * 0.012, (z - 0.5) * 0.012)) * 15, det = a + 0.12 * b;
  out[0] = (dU - b * dV) / det; out[1] = (0.12 * dU + a * dV) / det; return out;
}
const farmW = (x, z) => 1 - smooth(-700, -620, x + (noise(x * 0.004 + 3, z * 0.004 - 8) - 0.5) * 110);
const laneD = (x, z) => Math.min(Math.abs(z + 64 + Math.sin(x * 0.008) * 17), Math.abs(x + 990 + Math.sin(z * 0.013) * 24));
FM.fieldAt = (x, z) => {
  const ux = toU(x, z), uz = z - x * 0.12, row = Math.floor(uz / 83), width = 65 + hash(row, 91) * 58, fx = (ux + hash(row, 7) * 80) / width, phase = fx - Math.floor(fx), strip = uz - row * 83;
  return { id: hash(Math.floor(fx), row), d: Math.min(phase * width, (1 - phase) * width, strip, 83 - strip), lane: laneD(x, z) };
};
// crop kinds: 0 wheat, 1 corn, 2 sunflower, 3 vine, 4 vegetables; -1 fallow, -2 meadow
const cropOf = (id) => id < 0.3 ? 0 : id < 0.4 ? 1 : id < 0.5 ? 3 : id < 0.58 ? -1 : id < 0.68 ? 2 : id < 0.8 ? 4 : -2;
const KIND = ['wheat', 'corn', 'sunflower', 'vine', 'veg'];
// clear ground for crops / props: farmland interior, off roads, lanes, rivers, water and site pads (pads flatten into their bank)
function clear(x, z, margin = 0) {
  if (x > -662 || z < -294 || z > O.coastZ(x) - 30 || x - O.coastX(z) < 40 || farmW(x, z) < 0.6 || laneD(x, z) < 4.5 + margin) return false;
  if (O.roadDistance(x, z) < 9 + margin || O.waterY(x, z) !== null) return false;
  const river = O.riverInfo(x, z); if (river.d < river.hw + 6 + margin) return false;
  for (const pad of O.pads) if (Math.max(Math.abs(x - pad.x) - pad.rx, Math.abs(z - pad.z) - pad.rz) < pad.bank + 2 + margin) return false;
  return true;
}
FM.clear = clear;
function enumerate() {
  const fields = [], at = [0, 0];
  for (let row = -4; row <= 5; row++) {
    const width = 65 + hash(row, 91) * 58, off = hash(row, 7) * 80;
    for (let index = Math.floor((-1380 + off) / width); index <= Math.floor((-600 + off) / width); index++) {
      const id = hash(index, row), U0 = index * width - off, V0 = row * 83, gx = id > 0.5 ? 1 : 0.3, gz = id > 0.5 ? 0.2 : 0.95, gl = Math.hypot(gx, gz);
      toWorld(U0 + width / 2, V0 + 41.5, at);
      if (at[0] > -630 || at[0] < -1330 || at[1] < -340 || at[1] > 260) continue;
      fields.push({ key: index * 16 + row, i: index, r: row, id, crop: cropOf(id), U0, U1: U0 + width, V0, V1: V0 + 83, gx: gx / gl, gz: gz / gl, dx: -gz / gl, dz: gx / gl, P: 2.5 / gl, cx: at[0], cz: at[1], v: hash(index * 7 + 3, row * 13 + 5), cut: -Infinity, records: 0 });
    }
  }
  return fields;
}
const L_SEG = 4, MARGIN = 3.6, STRIDE = 9;
// lattice in field space: stripe k centre (k + 0.5) * P along g, segment a along d (odd stripes staggered by half a segment)
function stripes(f) {
  let t0 = Infinity, t1 = -Infinity, s0 = Infinity, s1 = -Infinity;
  for (const U of [f.U0, f.U1]) for (const V of [f.V0, f.V1]) { const t = f.gx * U + f.gz * V, s = f.dx * U + f.dz * V; t0 = Math.min(t0, t); t1 = Math.max(t1, t); s0 = Math.min(s0, s); s1 = Math.max(s1, s); }
  return { k0: Math.ceil(t0 / f.P - 0.5), k1: Math.floor(t1 / f.P - 0.5), s0, s1 };
}
const inField = (f, U, V, m) => U >= f.U0 + m && U <= f.U1 - m && V >= f.V0 + m && V <= f.V1 - m;
const fieldPoint = (f, t, s, out) => { out[0] = f.gx * t + f.dx * s; out[1] = f.gz * t + f.dz * s; return out; };
// contiguous clear run along stripe k (or between stripes when half=true), longest run; returns field-space s values.
// wide=true (machines) also keeps 9 m clear of any water around the line
const dry = (x, z, r) => { for (let index = 0; index < 8; index++) { const angle = index / 8 * Math.PI * 2; if (O.waterY(x + Math.cos(angle) * r, z + Math.sin(angle) * r) !== null) return false; } return true; };
function run(f, k, half = false, margin = 2, wide = false) {
  const st = stripes(f), t = (k + (half ? 1 : 0.5)) * f.P, uv = [0, 0], w = [0, 0];
  let best = null, cur = null;
  for (let s = Math.ceil(st.s0 / 2) * 2; s <= st.s1; s += 2) {
    fieldPoint(f, t, s, uv); toWorld(uv[0], uv[1], w); const ok = inField(f, uv[0], uv[1], MARGIN) && clear(w[0], w[1], margin) && (!wide || dry(w[0], w[1], 9));
    if (ok) { if (!cur) cur = [s, s]; cur[1] = s; if (!best || cur[1] - cur[0] > best[1] - best[0]) best = cur.slice(); } else cur = null;
  }
  return best && best[1] - best[0] >= 24 ? best : null;
}
// ---------------------------------------------------------------- palettes
const pc = (hex) => AF.col(hex, { jitter: 0.6, edge: 0.12, solid: false, pat: 'none' });
const quad = (a, b, c, d) => [pc(a), pc(b), pc(c), pc(d ?? c)];
// canopy boxes: [row centre, row edge]
const pair = (a, b) => [pc(a), pc(b)];
const PALS = {
  wheat: [quad(0xd6b24e, 0xa9883a, 0xe2c262), quad(0xe0c26a, 0xb89c4c, 0xead07c), quad(0xc4b04a, 0x8f9440, 0xd2bf58)], wheatSlab: [pair(0xb8a05a, 0x9c8648), pair(0xc2aa64, 0xa48e50), pair(0xae9c54, 0x8e8a44)],
  corn: [quad(0x5f8a3a, 0x4a7830, 0x56843a, 0xd9c47a)], cornSlab: [pair(0x5a8a3a, 0x3f6a2c)],
  sunflower: [quad(0x5a8a34, 0x46752c, 0xf2c21e, 0x5a3a1e), quad(0x5f8f38, 0x4a7a30, 0xf5d040, 0x6a4422)], sunflowerSlab: [pair(0xb89a2e, 0x5f7a30), pair(0xbea236, 0x627e34)],
  vine: [quad(0x4f7d34, 0x6a9a40, 0x4c2c5e, 0x34203f), quad(0x557f36, 0x739c44, 0xb6c25a, 0x98a848)], vineSlab: [pair(0x4f7d34, 0x3c6a2a), pair(0x557f36, 0x426e2c)],
  veg: [quad(0x3f6e3a, 0x3f6e3a, 0xa9c98a, 0xc7dca8), quad(0x3d6b2e, 0x3d6b2e, 0xe07a1f, 0x5a7a2a), quad(0x7a8a6a, 0x7a8a6a, 0x8a6ac0, 0xa88ad8), quad(0x5f9a3c, 0x5f9a3c, 0x9acb5a, 0xb8dc78)],
  vegSlab: [pair(0x8ab070, 0x5c7a40), pair(0xb8742a, 0x4f6a2a), pair(0x8a72b8, 0x6a7a5a), pair(0x7ab04a, 0x5a8a3a)],
};
// per kind: near radius by tier [low/phone, laptop, balanced+], canopy box height (m) / width (x 2.5 m) / lift (m)
const KS = [
  { mesh: 'wheat', R: [24, 40, 48], h: 0.8, w: 1, y: 0 },
  { mesh: 'tall', R: [20, 32, 40], h: 2.0, w: 1, y: 0 },
  { mesh: 'tall', R: [20, 32, 40], h: 1.95, w: 1, y: 0 },
  { mesh: 'vine', R: [22, 36, 44], h: 1.5, w: 0.26, y: 0.15 },
  { mesh: 'veg', R: [16, 26, 32], h: 0.35, w: 0.84, y: 0 },
];
const FAR = [100, 180, 230];
// ---------------------------------------------------------------- crop geometry (1/8 m voxels; four palette slots per instance)
const MARK = [0xfe01f1, 0xfe01f2, 0xfe01f3, 0xfe01f4].map((hex) => AF.col(hex, { jitter: 0.6, edge: 0.12, solid: false, pat: 'none' }));
const S0 = MARK[0], S1 = MARK[1], S2 = MARK[2], S3 = MARK[3];
const poppy = pc(0xc8301e), cornflower = pc(0x4a6ad0), postWood = pc(0x6a5038), wire = pc(0x8a8e90), trunk = pc(0x5a4230);
const rnd = (index, salt) => hash(index * 31 + salt, salt * 17 + 5);
const CROP_MODELS = {
  wheat() {
    const m = new AF.Model(32, 8, 20); m.box(0, 0, 0, 32, 5, 20, S1);
    for (let z = 1; z < 20; z += 2) m.box(0, 5, z, 32, 6, z + 1, S0);
    for (let index = 0; index < 22; index++) { const x = Math.floor(rnd(index, 1) * 32), z = 1 + 2 * Math.floor(rnd(index, 2) * 10); m.set(x, 6, z, S0); if (rnd(index, 3) < 0.4) m.set(x, 7, z, S2); }
    for (let index = 0; index < 5; index++) m.set(Math.floor(rnd(index, 4) * 32), 5, 2 * Math.floor(rnd(index, 5) * 10), index % 3 ? poppy : cornflower);
    return m;
  },
  tall() {
    const m = new AF.Model(32, 19, 20);
    [[2, 5], [10, 5], [18, 5], [26, 5], [6, 14], [14, 14], [22, 14], [30, 14]].forEach(([px, pz], index) => {
      const h = 13 + Math.floor(rnd(index, 7) * 3), flip = index % 2 ? 1 : -1;
      m.box(px, 0, pz, px + 1, h, pz + 1, S0);
      m.box(flip > 0 ? px + 1 : px - 3, 5, pz, flip > 0 ? px + 4 : px, 6, pz + 1, S1);
      m.box(px, 9, flip > 0 ? pz - 3 : pz + 1, px + 1, 10, flip > 0 ? pz : pz + 4, S1);
      m.box(px - 1, h - 1, pz + 1, px + 2, h + 2, pz + 2, S2); m.set(px, h, pz + 1, S3);
    });
    return m;
  },
  vine() {
    const m = new AF.Model(32, 14, 20); m.box(0, 0, 9, 1, 14, 11, postWood); m.box(1, 8, 10, 32, 9, 11, wire);
    for (const x of [5, 13, 21, 29]) m.box(x, 0, 10, x + 1, 8, 11, trunk);
    m.box(0, 8, 8, 32, 13, 13, S0);
    for (let index = 0; index < 6; index++) { const x = Math.floor(rnd(index, 8) * 29), side = index % 2 ? 7 : 13, lift = index % 3; m.box(x, 9 + lift, side, x + 3, 11 + lift, side + 1, S1); }
    for (let index = 0; index < 4; index++) { const x = Math.floor(rnd(index, 9) * 28); m.box(x, 13, 9, x + 4, 14, 12, S1); }
    for (let index = 0; index < 6; index++) { const x = 2 + index * 5 + Math.floor(rnd(index, 10) * 2), side = index % 2 ? 7 : 12; m.box(x, 6, side, x + 2, 8, side + 1, S2); m.set(x, 5, side, S3); }
    return m;
  },
  veg() {
    const m = new AF.Model(32, 4, 20);
    for (const [pz, x0] of [[5, 2], [14, 5]]) for (let px = x0; px < 31; px += 5) { m.box(px - 1, 0, pz - 1, px + 2, 1, pz + 2, S0); m.box(px - 1, 1, pz - 1, px + 1, 3, pz + 1, S2); m.set(px, 3, pz, S3); }
    return m;
  },
  slab() { return new AF.Model(8, 1, 5).box(0, 0, 0, 8, 1, 5, S1).box(0, 0, 1, 8, 1, 4, S0); },
};
function remap(geo) {
  const attr = geo.attributes.aPal, values = new Float32Array(attr.count);
  for (let index = 0; index < values.length; index++) { const value = attr.getX(index), slot = MARK.indexOf(value); values[index] = slot < 0 ? value : -slot - 1; }
  geo.setAttribute('aPal', new THREE.BufferAttribute(values, 1)); return geo;
}
const uniforms = { cropFar: { value: 180 } };
// near: keep inside the per-instance radius; mid (canopy box): complementary dither outside it, fading out at cropFar
function material(lod) {
  const mat = AF.mat.patchVoxel(AF.mat.voxelInst.clone(), 'crops-' + lod), compile = mat.onBeforeCompile;
  mat.onBeforeCompile = (shader, renderer) => {
    compile(shader, renderer); shader.uniforms.cropFar = uniforms.cropFar;
    shader.vertexShader = 'attribute vec4 cropPal; attribute float cropR; uniform float uAfTime; varying float cropD; varying float cropN;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('vec2 pUV =', 'float cropP = aPal < -3.5 ? cropPal.w : aPal < -2.5 ? cropPal.z : aPal < -1.5 ? cropPal.y : aPal < -0.5 ? cropPal.x : aPal;\nvec2 pUV =')
      .replace('mod(aPal,', 'mod(cropP,').replace('floor(aPal /', 'floor(cropP /')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n{vec3 cropO = (modelMatrix * instanceMatrix * vec4(0., 0., 0., 1.)).xyz; cropD = distance(cropO, cameraPosition); cropN = cropR;'
        + (lod === 'near' ? 'if (aPal < -0.5) { float k = min(max(position.y - 0.3, 0.), 0.9) * 0.07; transformed.x += sin(uAfTime * 1.7 + cropO.x * 0.31 + cropO.z * 0.23 + position.x * 0.9) * k; transformed.z += cos(uAfTime * 1.3 + cropO.z * 0.27 + position.z * 0.8) * k; }' : '') + '}');
    shader.fragmentShader = 'uniform float cropFar; varying float cropD; varying float cropN;\n' + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace('#include <clipping_planes_fragment>', '#include <clipping_planes_fragment>\n{float cropT = fract(52.9829189 * fract(dot(floor(gl_FragCoord.xy), vec2(0.06711056, 0.00583715)))); float cropA = 1. - smoothstep(cropN - 5., cropN + 5., cropD);'
      + (lod === 'near' ? 'if (cropT >= cropA) discard;' : 'float cropF = 1. - smoothstep(cropFar - 35., cropFar, cropD); if (cropT < cropA || cropT >= cropF) discard;') + '}');
  };
  mat.customProgramCacheKey = () => 'crops-' + lod; return mat;
}
const group = new THREE.Group(); group.name = 'farm-crops'; AF.scene.add(group);
const batches = {};
function* cropModels() {
  const near = material('near'), mid = material('mid');
  for (const [name, cap] of [['wheat', 1100], ['tall', 800], ['vine', 1000], ['veg', 800], ['slab', 7000]]) {
    const geo = remap(yield* AF.meshModelG(CROP_MODELS[name](), { vs: name === 'slab' ? 0.5 : 0.125, flat: true })); yield;
    const pal = new THREE.InstancedBufferAttribute(new Float32Array(cap * 4), 4), radius = new THREE.InstancedBufferAttribute(new Float32Array(cap), 1);
    pal.setUsage(THREE.DynamicDrawUsage); radius.setUsage(THREE.DynamicDrawUsage); geo.setAttribute('cropPal', pal); geo.setAttribute('cropR', radius);
    const mesh = new THREE.InstancedMesh(geo, name === 'slab' ? mid : near, cap); mesh.name = 'farm-crops-' + name; mesh.count = 0; mesh.frustumCulled = false; mesh.castShadow = false; mesh.receiveShadow = true;
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); mesh.layers.set(31); group.add(mesh); FM.meshes.push(mesh);
    batches[name] = { mesh, cap, n: 0, tris: geo.index.count / 3 };
  }
  FM.stats.trianglesPer = Object.fromEntries(Object.entries(batches).map(([key, batch]) => [key, batch.tris]));
}
// ---------------------------------------------------------------- crop records (typed arrays, 64 m buckets)
let N = 0, REC = new Float32Array(STRIDE * 4096), KINDS = new Uint8Array(4096), PALI = new Uint8Array(4096);
const buckets = new Map();
// x, y, z, cos, sin, scale along, scale across, ground slope along / across (sheared so neighbours meet on slopes)
function addRecord(kind, pal, x, y, z, c, s, sx, sz, ka, kc) {
  if (N >= KINDS.length) { const grow = KINDS.length * 2, rec = new Float32Array(STRIDE * grow), kinds = new Uint8Array(grow), pals = new Uint8Array(grow); rec.set(REC); kinds.set(KINDS); pals.set(PALI); REC = rec; KINDS = kinds; PALI = pals; }
  const o = N * STRIDE; REC[o] = x; REC[o + 1] = y; REC[o + 2] = z; REC[o + 3] = c; REC[o + 4] = s; REC[o + 5] = sx; REC[o + 6] = sz; REC[o + 7] = ka; REC[o + 8] = kc; KINDS[N] = kind; PALI[N] = pal;
  const key = Math.floor(x / 64) * 10000 + Math.floor(z / 64); let bucket = buckets.get(key); if (!bucket) { bucket = []; buckets.set(key, bucket); } bucket.push(N);
  FM.stats.kinds[kind]++; return N++;
}
function* crops() {
  const uv = [0, 0], w = [0, 0], dir = [0, 0], across = [0, 0];
  for (const f of FM.fields) {
    if (f.crop < 0) continue;
    const st = stripes(f), kind = f.crop;
    const pal = kind === 0 ? Math.floor(f.v * 3) : kind === 2 || kind === 3 ? Math.floor(f.v * 2) : kind === 4 ? Math.floor(f.v * 4) : 0;
    let count = 0;
    for (let k = st.k0; k <= st.k1; k++) {
      if (k < f.cut) continue;
      const t = (k + 0.5) * f.P, stagger = (k & 1) * L_SEG / 2;
      for (let a = Math.ceil((st.s0 - stagger) / L_SEG); a * L_SEG + stagger <= st.s1; a++) {
        if (++count % 24 === 0) yield;
        fieldPoint(f, t, a * L_SEG + stagger, uv); if (!inField(f, uv[0], uv[1], MARGIN)) continue;
        toWorld(uv[0], uv[1], w); const x = w[0], z = w[1]; if (!clear(x, z)) continue;
        worldStep(x, z, f.dx, f.dz, dir); worldStep(x, z, f.gx, f.gz, across);
        const len = Math.hypot(dir[0], dir[1]), flip = kind === 1 || kind === 2 ? 1 : hash(a * 3 + 1, k * 5 + f.i) < 0.5 ? -1 : 1, yaw = Math.atan2(-dir[1], dir[0]), c = Math.cos(yaw) * flip, s = Math.sin(yaw) * flip;
        // local +x runs along (c, -s), local +z along (s, c)
        const h0 = O.h(x, z), ha = O.h(x + c * 1.9, z - s * 1.9), hb = O.h(x - c * 1.9, z + s * 1.9), hc = O.h(x + s * 1.2, z + c * 1.2), hd = O.h(x - s * 1.2, z - c * 1.2);
        if (Math.max(h0, ha, hb, hc, hd) - Math.min(h0, ha, hb, hc, hd) > 0.9 || h0 < 1) continue;
        addRecord(kind, pal, x, h0 - 0.15, z, c, s, len * 1.03, f.P * Math.abs(dir[0] * across[1] - dir[1] * across[0]) / len / 2.5 * 1.05, (ha - hb) / 3.8, (hc - hd) / 2.4);
        f.records++;
      }
    }
  }
  FM.stats.records = N;
}
// ---------------------------------------------------------------- selection (idle slots; camera moves > 3 m or turns)
const frustum = new THREE.Frustum(), projection = new THREE.Matrix4(), sphere = new THREE.Sphere(), lastQ = new THREE.Quaternion();
let lastX = Infinity, lastY = Infinity, lastZ = Infinity, revision = 0, selected = -1, selection = null, generator = null;
const tierIndex = () => AF.MOBILE || AF.GFX.tier === 'low' ? 0 : AF.GFX.lite ? 1 : 2;
function put(batch, index, sx, sy, sz, lift, p0, p1, p2, p3, radius) {
  if (batch.n >= batch.cap) return;
  const slot = batch.n++, e = batch.mesh.instanceMatrix.array, o = slot * 16, r = index * STRIDE, c = REC[r + 3], s = REC[r + 4];
  e[o] = c * sx; e[o + 1] = REC[r + 7] * sx; e[o + 2] = -s * sx; e[o + 3] = 0; e[o + 4] = 0; e[o + 5] = sy; e[o + 6] = 0; e[o + 7] = 0;
  e[o + 8] = s * sz; e[o + 9] = REC[r + 8] * sz; e[o + 10] = c * sz; e[o + 11] = 0; e[o + 12] = REC[r]; e[o + 13] = REC[r + 1] + lift; e[o + 14] = REC[r + 2]; e[o + 15] = 1;
  const pal = batch.mesh.geometry.attributes.cropPal.array; pal[slot * 4] = p0; pal[slot * 4 + 1] = p1; pal[slot * 4 + 2] = p2; pal[slot * 4 + 3] = p3;
  batch.mesh.geometry.attributes.cropR.array[slot] = radius;
}
function upload(attr, count) { attr.clearUpdateRanges(); attr.addUpdateRange(0, Math.max(1, count) * attr.itemSize); attr.needsUpdate = true; }
const radii = [0, 0, 0, 0, 0];
function* select(eye = AF.camera.position, cull = true) {
  const cx = eye.x, cy = eye.y, cz = eye.z, view = AF.lodScale || 1, tier = tierIndex();
  // from the street inside the city grid the fields are > 110 m away behind buildings: keep the canopy boxes off
  const far = AF.W.col(cx, cz) >= 0 && cy - O.h(cx, cz) < 40 ? 110 : Math.min(400, FAR[tier] * view);
  for (let kind = 0; kind < 5; kind++) radii[kind] = Math.min(90, KS[kind].R[tier] * view);
  uniforms.cropFar.value = far;
  if (cull) { AF.camera.updateMatrixWorld(); projection.multiplyMatrices(AF.camera.projectionMatrix, AF.camera.matrixWorldInverse); frustum.setFromProjectionMatrix(projection); }
  for (const name in batches) batches[name].n = 0;
  const reach = Math.ceil((far + 64) / 64), bx = Math.floor(cx / 64), bz = Math.floor(cz / 64), far2 = far * far;
  for (let ix = bx - reach; ix <= bx + reach; ix++) for (let iz = bz - reach; iz <= bz + reach; iz++) {
    const bucket = buckets.get(ix * 10000 + iz); if (!bucket) continue;
    if (cull) { sphere.center.set(ix * 64 + 32, 6, iz * 64 + 32); sphere.radius = 50; if ((ix * 64 + 32 - cx) ** 2 + (iz * 64 + 32 - cz) ** 2 > 8100 && !frustum.intersectsSphere(sphere)) continue; }
    for (let at = 0; at < bucket.length; at++) {
      if ((at & 63) === 63) yield;
      const index = bucket[at], r = index * STRIDE, dx = REC[r] - cx, dy = REC[r + 1] - cy, dz = REC[r + 2] - cz, d2 = dx * dx + dy * dy + dz * dz;
      if (d2 > far2) continue;
      if (cull && d2 > 400) { sphere.center.set(REC[r], REC[r + 1] + 1, REC[r + 2]); sphere.radius = 3.5; if (!frustum.intersectsSphere(sphere)) continue; }
      const kind = KINDS[index], spec = KS[kind], radius = radii[kind], pal = PALI[index], sx = REC[r + 5], sz = REC[r + 6];
      if (d2 < (radius + 6) ** 2) {
        const q = kind === 0 ? PALS.wheat[pal] : kind === 1 ? PALS.corn[0] : kind === 2 ? PALS.sunflower[pal] : kind === 3 ? PALS.vine[pal] : PALS.veg[pal];
        put(batches[spec.mesh], index, sx, kind === 1 || kind === 2 ? 0.92 + hash(index, 17) * 0.16 : 1, sz, 0, q[0], q[1], q[2], q[3], radius);
      }
      if (d2 > (radius - 6) ** 2) {
        const two = (kind === 0 ? PALS.wheatSlab : kind === 1 ? PALS.cornSlab : kind === 2 ? PALS.sunflowerSlab : kind === 3 ? PALS.vineSlab : PALS.vegSlab)[pal];
        put(batches.slab, index, sx, spec.h * 2, spec.w * (kind === 3 ? 1 : sz), spec.y, two[0], two[1], two[0], two[0], radius);
      }
    }
    yield;
  }
  let draws = 0, triangles = 0;
  for (const name in batches) {
    const batch = batches[name], mesh = batch.mesh; mesh.count = batch.n; mesh.layers.set(batch.n ? 0 : 31);
    mesh.instanceMatrix.needsUpdate = true; upload(mesh.geometry.attributes.cropPal, batch.n); upload(mesh.geometry.attributes.cropR, batch.n);
    if (batch.n) { draws++; triangles += batch.n * batch.tris; }
  }
  Object.assign(FM.stats, { draws, triangles, near: batches.wheat.n + batches.tall.n + batches.vine.n + batches.veg.n, mid: batches.slab.n, selects: FM.stats.selects + 1 });
  if (cull) { lastX = cx; lastY = cy; lastZ = cz; lastQ.copy(AF.camera.quaternion); selected = revision; }
}
FM.select = (eye, cull = true) => { const gen = select(eye, cull); while (!gen.next().done); if (!cull) revision++; return { ...FM.stats }; };
function stale() {
  if (selected !== revision) return true;
  const cp = AF.camera.position;
  // nothing drawn and the camera is well east of the farmland: keep sleeping
  if (!FM.stats.draws && cp.x > -660 + FAR[2] * 2.6) return false;
  return (cp.x - lastX) ** 2 + (cp.y - lastY) ** 2 + (cp.z - lastZ) ** 2 > 9 || Math.abs(lastQ.dot(AF.camera.quaternion)) < 0.996;
}
// ---------------------------------------------------------------- machine and prop models
const col = (hex, opts = {}) => AF.col(hex, { jitter: 0.4, edge: 0.2, ...opts });
const C = {
  red: col(0xb5372c, { metal: 0.25, rough: 0.45 }), green: col(0x3e7a36, { metal: 0.25, rough: 0.45 }), cream: col(0xeee4c8), yellow: col(0xe2b53a, { metal: 0.2, rough: 0.5 }),
  tyre: col(0x232323, { rough: 0.95, jitter: 0.2 }), iron: col(0x3a3d40, { metal: 0.5, rough: 0.55 }), steel: col(0x9aa1a8, { metal: 0.7, rough: 0.35 }), galv: col(0xbac1c3, { metal: 0.6, rough: 0.4 }), galvD: col(0x9ca4a7, { metal: 0.6, rough: 0.45 }),
  glass: col(0x30444c, { rough: 0.12, metal: 0.2 }), glow: col(0xfff1c9, { emit: 0xffd48a, emitK: 2.5, mode: 'night', jitter: 0, edge: 0 }), amber: col(0xf0a030, { emit: 0xff9a20, emitK: 1.5, mode: 'night' }),
  grain: col(0xd9b85a), straw: col(0xd6bb68), strawD: col(0xb89a48), strawL: col(0xe6cf86), wood: col(0x7a573d, { pat: 'plank' }), woodL: col(0x9c7650), woodD: col(0x5a4030),
  burlap: col(0xb89c6c), denim: col(0x3d5a82), shirtA: col(0xa8423a), shirtB: col(0xd8c8a0), hat: col(0xc9a14a), crow: col(0x1c1c22), white: col(0xeeeae0), hiveY: col(0xe8d58a), hiveB: col(0x9cc0d0),
  slate: col(0x52676a), stone: col(0x8a8981, { pat: 'stone' }), water: col(0x4a7d92, { rough: 0.15 }), comb: col(0xd03a2a), roofM: col(0x7d8a8e, { metal: 0.5, rough: 0.5 }), roofR: col(0x8e3b30),
  barrel: col(0x7a5030, { pat: 'plank' }), sheet: col(0xf4f1e8, { jitter: 0.1 }), blue: col(0x5a8ac0), pink: col(0xd88a9a), leaf: col(0x4f7d34), plaster: col(0xe6dcc2), mail: col(0xb03a2e),
};
function disc(m, axis, a, b, r, from, to, c) {
  for (let u = Math.floor(a - r); u < Math.ceil(a + r); u++) for (let v = Math.floor(b - r); v < Math.ceil(b + r); v++) {
    const d = Math.hypot(u + 0.5 - a, v + 0.5 - b); if (d > r) continue;
    const k = typeof c === 'function' ? c(d, u, v) : c; if (!k) continue;
    for (let w = from; w < to; w++) { if (axis === 'x') m.set(w, u, v, k); else if (axis === 'y') m.set(u, w, v, k); else m.set(u, v, w, k); }
  }
  return m;
}
function paste(dst, src, ox, oy, oz) { for (let x = 0; x < src.w; x++) for (let y = 0; y < src.h; y++) for (let z = 0; z < src.d; z++) { const v = src.get(x, y, z); if (v) dst.set(x + ox, y + oy, z + oz, v); } return dst; }
const wheel = (m, x0, x1, cy, cz, r, hub) => disc(m, 'x', cy, cz, r, x0, x1, (d) => d > r - 1.6 ? C.tyre : d > 1.2 ? hub : C.iron);
const M = FM.models = {
  // 1/8 m voxels, front +z
  tractor(paint = C.red, hub = C.cream, roof = C.cream) {
    const m = new AF.Model(20, 23, 34);
    wheel(m, 0, 4, 6, 8, 6, hub); wheel(m, 16, 20, 6, 8, 6, hub); wheel(m, 2, 5, 3.5, 27, 3.5, hub); wheel(m, 15, 18, 3.5, 27, 3.5, hub);
    m.box(5, 3, 4, 15, 6, 31, C.iron); m.box(6, 6, 15, 14, 12, 32, paint); m.box(7, 12, 15, 13, 13, 32, paint);
    m.box(6, 6, 32, 14, 11, 33, C.iron); for (let y = 7; y < 11; y += 2) m.box(7, y, 32, 13, y + 1, 33, C.steel); m.set(6, 10, 33, C.glow); m.set(13, 10, 33, C.glow);
    m.box(12, 13, 26, 13, 20, 27, C.iron); m.box(4, 6, 2, 16, 8, 14, paint); m.box(4, 8, 2, 16, 20, 14, C.glass);
    for (const [x, z] of [[4, 2], [15, 2], [4, 13], [15, 13]]) m.box(x, 8, z, x + 1, 20, z + 1, C.iron);
    m.box(3, 20, 1, 17, 22, 15, roof); m.set(9, 22, 7, C.amber); m.box(0, 12, 2, 4, 13, 14, paint); m.box(16, 12, 2, 20, 13, 14, paint); m.box(9, 3, 0, 11, 5, 4, C.iron); m.box(3, 4, 10, 4, 5, 12, C.iron);
    return m;
  },
  harrowTractor() {
    const m = new AF.Model(28, 23, 56); paste(m, M.tractor(C.green, C.yellow, C.green), 4, 0, 22);
    for (const z of [5, 13]) { m.box(1, 3, z - 1, 27, 4, z + 1, C.yellow); for (let x = 2; x < 27; x += 3) disc(m, 'x', 2.5, z, 2.5, x, x + 1, C.steel); }
    m.box(13, 3, 5, 15, 4, 24, C.iron); return m;
  },
  combine() {
    const m = new AF.Model(42, 34, 76);
    m.box(0, 1, 62, 42, 5, 72, C.steel); m.box(0, 0, 70, 42, 1, 73, C.iron); m.box(0, 1, 61, 1, 8, 74, C.red); m.box(41, 1, 61, 42, 8, 74, C.red);
    m.box(0, 8, 64, 1, 10, 72, C.iron); m.box(41, 8, 64, 42, 10, 72, C.iron); m.box(1, 9, 67, 41, 10, 68, C.iron);
    for (const [y, z] of [[9, 71], [12, 68], [9, 64], [6, 68]]) m.box(1, y, z, 41, y + 1, z + 1, C.yellow);
    m.box(15, 3, 56, 27, 9, 63, C.red);
    m.box(10, 5, 8, 32, 22, 56, C.red); m.box(10, 5, 8, 32, 7, 56, C.iron); m.box(9, 17, 10, 10, 18, 54, C.cream); m.box(32, 17, 10, 33, 18, 54, C.cream);
    wheel(m, 3, 10, 7, 46, 7, C.cream); wheel(m, 32, 39, 7, 46, 7, C.cream); wheel(m, 6, 10, 4.5, 14, 4.5, C.cream); wheel(m, 32, 36, 4.5, 14, 4.5, C.cream);
    m.box(12, 22, 24, 30, 27, 48, C.red); m.box(11, 27, 23, 31, 28, 49, C.cream); m.box(13, 27, 25, 29, 28, 47, C.grain);
    m.box(13, 15, 48, 29, 28, 58, C.glass); for (const [x, z] of [[13, 48], [28, 48], [13, 57], [28, 57]]) m.box(x, 15, z, x + 1, 28, z + 1, C.iron);
    m.box(12, 28, 47, 30, 30, 59, C.cream); m.set(21, 30, 52, C.amber); m.set(14, 28, 59, C.glow); m.set(27, 28, 59, C.glow);
    m.box(11, 13, 56, 31, 15, 60, C.iron); for (let y = 3; y < 13; y += 2) m.box(9, y, 52, 10, y + 1, 55, C.steel);
    m.box(31, 22, 10, 34, 25, 46, C.cream); m.box(31, 19, 44, 34, 22, 47, C.steel);
    m.box(12, 22, 10, 30, 26, 22, C.red); m.box(12, 23, 9, 30, 25, 10, C.iron); m.box(26, 26, 14, 28, 33, 16, C.iron); m.box(13, 6, 4, 29, 13, 8, C.iron);
    return m;
  },
  // 1/10 m voxels
  scarecrow() {
    const m = new AF.Model(16, 24, 6);
    m.box(7, 0, 2, 9, 20, 4, C.wood); m.box(1, 14, 2, 15, 15, 4, C.wood);
    for (let y = 10; y < 16; y++) m.box(5, y, 1, 11, y + 1, 5, y % 2 ? C.shirtA : C.shirtB);
    m.box(1, 13, 2, 5, 16, 4, C.shirtA); m.box(11, 13, 2, 15, 16, 4, C.shirtA); m.box(0, 12, 2, 1, 15, 4, C.straw); m.box(15, 12, 2, 16, 15, 4, C.straw);
    m.box(5, 6, 2, 7, 10, 4, C.denim); m.box(9, 6, 2, 11, 10, 4, C.denim); m.box(5, 5, 2, 7, 6, 4, C.straw); m.box(9, 4, 2, 11, 6, 4, C.straw);
    m.box(6, 16, 1, 10, 20, 5, C.burlap); m.set(7, 18, 5, C.crow); m.set(9, 18, 5, C.crow); m.box(7, 17, 5, 10, 18, 6, C.crow);
    m.box(4, 20, 0, 12, 21, 6, C.hat); m.box(6, 21, 1, 10, 23, 5, C.hat); m.box(6, 21, 1, 10, 22, 5, C.shirtA);
    m.box(13, 15, 2, 15, 16, 4, C.crow); m.set(14, 16, 3, C.crow); m.set(15, 16, 3, C.yellow);
    return m;
  },
  // 1/5 m voxels
  bale() { return disc(new AF.Model(8, 8, 7), 'z', 4, 4, 4, 0, 7, (d) => d > 3.3 ? C.straw : Math.floor(d * 1.3) & 1 ? C.strawL : C.strawD); },
  // 1/8 m voxels
  trough() { const m = new AF.Model(24, 6, 7); m.box(0, 0, 0, 24, 6, 7, C.galv); m.box(1, 4, 1, 23, 5, 6, C.water); m.box(1, 5, 1, 23, 6, 6, 0); m.box(0, 0, 0, 24, 1, 7, C.galvD); return m; },
  hives() {
    const m = new AF.Model(32, 9, 7), tones = [C.white, C.hiveY, C.hiveB, C.white];
    for (let index = 0; index < 4; index++) { const x = index * 8; m.box(x, 0, 0, x + 6, 1, 6, C.woodD); m.box(x, 1, 0, x + 6, 6, 6, tones[index]); m.box(x + 2, 1, 6, x + 4, 2, 7, C.iron); m.box(x, 6, 0, x + 6, 7, 6, C.slate); m.box(x + 1, 7, 1, x + 5, 8, 5, C.slate); }
    return m;
  },
  well() {
    const m = new AF.Model(14, 20, 14); disc(m, 'y', 7, 7, 6, 0, 6, (d) => d > 4.5 ? C.stone : 0); disc(m, 'y', 7, 7, 4.5, 0, 3, C.water);
    m.box(2, 6, 6, 3, 17, 8, C.wood); m.box(11, 6, 6, 12, 17, 8, C.wood); m.box(2, 14, 6, 12, 15, 8, C.woodD); m.box(6, 9, 6, 8, 11, 8, C.woodL); m.box(7, 11, 7, 8, 14, 8, C.iron);
    for (let layer = 0; layer < 4; layer++) m.box(0, 17 + layer, 3 + layer, 14, 18 + layer, 11 - layer, C.roofR);
    return m;
  },
  coop() {
    const m = new AF.Model(26, 14, 16);
    for (const [x, z] of [[0, 0], [11, 0], [0, 11], [11, 11]]) m.box(x, 0, z, x + 1, 3, z + 1, C.woodD);
    m.box(0, 3, 0, 12, 9, 12, C.wood); m.box(5, 3, 12, 7, 6, 13, C.iron); m.line(6, 0, 15, 6, 3, 12, C.woodL);
    for (let layer = 0; layer < 4; layer++) m.box(0, 9 + layer, layer * 1.5, 12, 10 + layer, 12 - layer * 1.5, C.roofR);
    for (const [x, z] of [[12, 0], [25, 0], [12, 15], [25, 15], [18, 0], [18, 15]]) m.box(x, 0, z, x + 1, 7, z + 1, C.woodL);
    m.box(12, 6, 0, 26, 7, 1, C.galvD); m.box(12, 6, 15, 26, 7, 16, C.galvD); m.box(25, 6, 0, 26, 7, 16, C.galvD); m.box(12, 2, 0, 26, 3, 1, C.galvD); m.box(12, 2, 15, 26, 3, 16, C.galvD); m.box(25, 2, 0, 26, 3, 16, C.galvD);
    for (const [x, z] of [[16, 6], [21, 10], [19, 3]]) { m.box(x, 0, z, x + 2, 2, z + 3, C.white); m.set(x, 2, z + 2, C.white); m.set(x, 3, z + 2, C.comb); m.set(x, 2, z + 3, C.yellow); }
    return m;
  },
  washing() {
    const m = new AF.Model(40, 18, 2); m.box(0, 0, 0, 1, 18, 2, C.woodD); m.box(39, 0, 0, 40, 18, 2, C.woodD); m.box(1, 16, 0, 39, 17, 1, C.white);
    for (const [x0, x1, y0, c] of [[4, 10, 9, C.sheet], [12, 16, 12, C.blue], [18, 22, 11, C.shirtA], [24, 32, 9, C.sheet], [34, 37, 13, C.pink]]) m.box(x0, y0, 0, x1, 16, 1, c);
    return m;
  },
  woodpile() {
    const m = new AF.Model(16, 8, 8);
    for (let y = 0; y < 8; y += 2) for (let z = 0; z < 8; z += 2) { const end = (y + z) % 4 ? C.woodL : C.strawD; m.box(0, y, z, 16, y + 2, z + 2, C.woodD); m.box(0, y, z, 1, y + 2, z + 2, end); m.box(15, y, z, 16, y + 2, z + 2, end); }
    return m;
  },
  mailbox() { const m = new AF.Model(6, 13, 7); m.box(2, 0, 3, 3, 9, 4, C.woodD); m.box(0, 9, 0, 5, 12, 7, C.mail); m.box(1, 12, 1, 4, 13, 6, C.mail); m.box(5, 10, 2, 6, 13, 3, C.yellow); return m; },
  barrels() { const m = new AF.Model(22, 7, 7); for (const x of [0, 8, 15]) disc(m, 'y', x + 3.5, 3.5, 3.5, 0, 7, (d) => d > 2.6 ? C.barrel : C.woodL); for (const x of [0, 8, 15]) for (const y of [1, 5]) disc(m, 'y', x + 3.5, 3.5, 3.5, y, y + 1, (d) => d > 2.6 ? C.iron : 0); return m; },
  // 1/4 m voxels
  bin() {
    const m = new AF.Model(18, 30, 18); disc(m, 'y', 9, 9, 8.5, 0, 22, (d, u, v) => d > 7.5 ? (u + v) % 2 ? C.galv : C.galvD : C.galvD);
    for (let layer = 0; layer < 7; layer++) disc(m, 'y', 9, 9, 8.5 - layer * 1.25, 22 + layer, 23 + layer, C.galv);
    m.box(8, 29, 8, 10, 30, 10, C.iron); m.box(8, 1, 17, 9, 24, 18, C.iron); for (let y = 2; y < 24; y += 3) m.box(7, y, 17, 10, y + 1, 18, C.steel);
    return m;
  },
  shed() {
    const m = new AF.Model(52, 22, 30);
    m.box(0, 0, 0, 52, 1, 30, C.stone); m.box(0, 1, 0, 52, 17, 1, C.wood); m.box(0, 1, 0, 1, 17, 30, C.wood); m.box(51, 1, 0, 52, 17, 30, C.wood);
    for (const x of [0, 17, 34, 51]) m.box(x, 1, 29, x + 1, 17, 30, C.woodD);
    for (let z = 0; z < 30; z++) { const y = 17 + Math.floor(Math.min(z, 29 - z) / 4); m.box(0, y, z, 52, y + 1, z + 1, C.roofM); }
    m.box(4, 1, 2, 14, 4, 6, C.straw); m.box(40, 1, 3, 48, 2, 10, C.woodL);
    return m;
  },
  windpump() {
    const m = new AF.Model(14, 52, 14);
    for (const [x, z] of [[0, 0], [13, 0], [0, 13], [13, 13]]) m.line(x, 0, z, x < 7 ? 5 : 8, 40, z < 7 ? 5 : 8, C.galvD);
    for (const y of [10, 20, 30]) { const inset = Math.round(y / 40 * 5); m.box(inset, y, inset, 14 - inset, y + 1, inset + 1, C.galvD); m.box(inset, y, 13 - inset, 14 - inset, y + 1, 14 - inset, C.galvD); m.box(inset, y, inset, inset + 1, y + 1, 14 - inset, C.galvD); m.box(13 - inset, y, inset, 14 - inset, y + 1, 14 - inset, C.galvD); }
    m.box(4, 40, 4, 10, 41, 10, C.wood); m.box(6, 41, 6, 8, 45, 12, C.iron);
    for (let u = 0; u < 14; u++) for (let v = 39; v < 52; v++) { const d = Math.hypot(u + 0.5 - 7, v + 0.5 - 45.5), angle = Math.atan2(v + 0.5 - 45.5, u + 0.5 - 7); if (d < 6.5 && (d > 5.6 || d > 1.4 && (Math.floor((angle + Math.PI) / (Math.PI / 9)) & 1) || d <= 1.4)) m.set(u, v, 2, d <= 1.4 ? C.iron : C.galv); }
    m.box(7, 44, 3, 8, 45, 12, C.galvD); m.box(7, 42, 11, 8, 49, 14, C.red);
    return m;
  },
  hut() { const m = new AF.Model(12, 12, 10); m.box(0, 0, 0, 12, 7, 10, C.stone); m.box(5, 0, 10, 7, 5, 10, C.woodD); m.box(5, 1, 9, 7, 5, 10, C.woodD); for (let layer = 0; layer < 5; layer++) m.box(0, 7 + layer, layer, 12, 8 + layer, 10 - layer, C.roofR); return m; },
  pergola() {
    const m = new AF.Model(56, 12, 26);
    for (const x of [0, 27, 55]) for (const z of [0, 25]) m.box(x, 0, z, x + 1, 11, z + 1, C.woodD);
    for (const z of [0, 25]) m.box(0, 11, z, 56, 12, z + 1, C.wood); for (let x = 2; x < 56; x += 4) m.box(x, 11, 0, x + 1, 12, 26, C.woodL);
    for (let index = 0; index < 14; index++) { const x = Math.floor(rnd(index, 21) * 50), z = Math.floor(rnd(index, 22) * 22); m.box(x, 11, z, x + 6, 12, z + 4, C.leaf); if (index % 3 === 0) m.box(x + 2, 10, z + 1, x + 3, 11, z + 2, C.crow); }
    return m;
  },
};
// ---------------------------------------------------------------- farmsteads (called by 44-sites for every 'farm' site)
const lib = () => AF.outlandSites.lib;
function* place(site, key, build, vs, dx, dz, rot = 0, opts = {}) { const L = lib(); const geo = yield* L.geometry(key, build, vs); L.prop(site, geo, dx, dz, rot, opts); FM.stats.props++; return geo; }
FM.farmstead = function* (site) {
  const v = hash(site.x * 3, site.z * 7), red = v < 0.5;
  yield* place(site, 'farm-bin', M.bin, 0.25, 28, 10); yield* place(site, 'farm-bin', M.bin, 0.25, 28, 16.5); yield;
  yield* place(site, 'farm-shed', M.shed, 0.25, 0, -17, 2); yield;
  yield* place(site, 'farm-combine', M.combine, 0.125, -3, 15.5, 1); yield;
  yield* place(site, red ? 'farm-tractor-red' : 'farm-tractor-green', red ? () => M.tractor() : () => M.tractor(C.green, C.yellow, C.green), 0.125, -14, 15, 0); yield;
  yield* place(site, 'farm-coop', M.coop, 0.125, -24, 15); yield;
  yield* place(site, 'farm-well', M.well, 0.125, 9.5, -9); yield* place(site, 'farm-woodpile', M.woodpile, 0.125, 9.5, -1.5, 1);
  yield* place(site, 'farm-washing', M.washing, 0.1, 0, -9.5, 0, { collide: false }); yield;
  yield* place(site, 'farm-hives', M.hives, 0.1, -17, -19.5); yield* place(site, 'farm-trough', M.trough, 0.125, 18, 6.5);
  yield* place(site, 'farm-mailbox', M.mailbox, 0.1, 11.5, 24.5, 0, { y: O.h(site.x + 11.5, site.z + 24.5) });
  if (v > 0.35) yield* place(site, 'farm-windpump', M.windpump, 0.25, -27, -19.5);
  if (AF.vehicles && AF.vehicles.placeParked) try { AF.vehicles.placeParked('pickup', site.x + 20.5, site.z + 19, Math.PI / 2, { y: site.y }); } catch (e) { AF.warnOnce('farm pickup', e); }
};
FM.winery = function* (site) {
  const L = lib(), P = L.palette;
  L.prop(site, yield* L.house('winery-hall', 30, 18, 12, C.plaster, C.roofR), 0, -9); yield;
  L.prop(site, yield* L.house('winery-cellar', 20, 14, 9, P.stone, P.slate), 17, 4, 1); yield;
  yield* place(site, 'farm-pergola', M.pergola, 0.25, -1, 1, 0, { collide: false }); yield* L.picnic(site); yield;
  yield* place(site, 'farm-barrels', M.barrels, 0.125, -14, 10); yield* place(site, 'farm-barrels', M.barrels, 0.125, -14, 12.5);
  L.prop(site, yield* L.geometry('sign-VINEYARD', () => AF.textModel('VINEYARD', P.trim, { bg: P.red, pad: 1, depth: 1 }), 0.25), 0, 16, 0, { y: site.y + 2.2, collide: false });
  for (const dx of [-5.5, 5.5]) yield* place(site, 'farm-sign-post', () => new AF.Model(1, 12, 1).box(0, 0, 0, 1, 12, 1, P.wood), 0.25, dx, 16);
  yield* L.lamp(site, 8, 6);
  if (AF.vehicles && AF.vehicles.placeParked) try { AF.vehicles.placeParked(null, site.x - 20, site.z - 12, 0, { y: site.y }); } catch (e) { AF.warnOnce('winery car', e); }
};
// ---------------------------------------------------------------- field props (scarecrows, bales, troughs, hives, huts)
function* fieldProps() {
  const L = lib(), uv = [0, 0], w = [0, 0], tag = { tag: 'farm-field' };
  const at = function* (key, build, vs, f, t, s, rot, margin = 1.5) {
    fieldPoint(f, t, s, uv); if (!inField(f, uv[0], uv[1], 2)) return false; toWorld(uv[0], uv[1], w);
    if (!clear(w[0], w[1], margin)) return false;
    const geo = yield* L.geometry(key, build, vs), y = Math.min(O.h(w[0], w[1]), O.h(w[0] + 1, w[1]), O.h(w[0] - 1, w[1]), O.h(w[0], w[1] + 1), O.h(w[0], w[1] - 1)) - 0.08;
    O.addProp(geo, w[0], y, w[1], rot, tag); FM.stats.props++; return true;
  };
  for (const f of FM.fields) {
    yield;
    const st = stripes(f), tc = (st.k0 + st.k1 + 1) / 2 * f.P, sc = (st.s0 + st.s1) / 2, h = (salt) => hash(f.i * 13 + salt, f.r * 7 + salt * 3), rot = Math.floor(h(1) * 4);
    if (f.crop >= 0 && f.crop <= 2 && h(2) < 0.6) yield* at('farm-scarecrow', M.scarecrow, 0.1, f, tc + (h(3) - 0.5) * 12, sc + (h(4) - 0.5) * 16, rot);
    if (f.crop === 2 && h(5) < 0.5) yield* at('farm-hives', M.hives, 0.1, f, (st.k0 + 2) * f.P, st.s0 + 10, rot & 1);
    if (f.crop === 3 && h(6) < 0.35) yield* at('farm-hut', M.hut, 0.25, f, (st.k1 - 1) * f.P, st.s1 - 8, rot);
    if (f.crop === -2 && h(7) < 0.55) yield* at('farm-trough', M.trough, 0.125, f, tc, sc + 6, rot & 1);
    const bales = f.crop === -1 && !f.mover ? 3 + Math.floor(h(8) * 4) : f.cut > -Infinity ? 5 : 0, kMax = f.cut > -Infinity ? f.cut - 6 : st.k1;
    for (let index = 0; index < bales && kMax > st.k0; index++) {
      const k = st.k0 + Math.floor(h(10 + index) * (kMax - st.k0)), s = st.s0 + h(20 + index) * (st.s1 - st.s0);
      yield* at('farm-bale', M.bale, 0.2, f, (k + 0.5) * f.P, s, Math.floor(h(30 + index) * 4)); yield;
    }
  }
}
// ---------------------------------------------------------------- working machines (two shared instanced batches)
const machines = { combine: null, tractor: null };
function loopPath(f, kA, kB, span, margin) {
  // field-space loop: along stripe kA, U-turn to kB, back, U-turn to kA (semicircles bulging past the run ends)
  const pts = [], uv = [0, 0], w = [0, 0], tA = (kA + 0.5) * f.P, tB = (kB + 0.5) * f.P, tc = (tA + tB) / 2, rr = Math.abs(tA - tB) / 2, dir = Math.sign(tB - tA);
  const push = (t, s) => { fieldPoint(f, t, s, uv); toWorld(uv[0], uv[1], w); pts.push(w[0], O.h(w[0], w[1]), w[1]); };
  for (let s = span[0]; s <= span[1]; s += 4) push(tA, s);
  for (let step = 1; step < 8; step++) { const angle = step / 8 * Math.PI; push(tc - dir * Math.cos(angle) * rr, span[1] + Math.sin(angle) * Math.min(rr, margin)); }
  for (let s = span[1]; s >= span[0]; s -= 4) push(tB, s);
  for (let step = 1; step < 8; step++) { const angle = step / 8 * Math.PI; push(tc + dir * Math.cos(angle) * rr, span[0] - Math.sin(angle) * Math.min(rr, margin)); }
  pts.push(pts[0], pts[1], pts[2]);
  const points = new Float32Array(pts), cum = new Float32Array(points.length / 3);
  for (let index = 1; index < cum.length; index++) cum[index] = cum[index - 1] + Math.hypot(points[index * 3] - points[index * 3 - 3], points[index * 3 + 2] - points[index * 3 - 1]);
  return { points, cum, total: cum[cum.length - 1] };
}
function setupMovers() {
  const farms = AF.outlandSites ? AF.outlandSites.sites.filter((site) => site.kind === 'farm') : [], used = new Set();
  const pick = (crop, count, near) => {
    const picks = [];
    for (const site of farms) {
      if (picks.length >= count) break;
      const candidates = FM.fields.filter((f) => f.crop === crop && !used.has(f.key) && Math.hypot(f.cx - site.x, f.cz - site.z) < near).sort((a, b) => Math.hypot(a.cx - site.x, a.cz - site.z) - Math.hypot(b.cx - site.x, b.cz - site.z));
      for (const f of candidates) {
        const st = stripes(f), kc = Math.round((st.k0 + st.k1) / 2), a = run(f, kc - 1, false, 3, true), b = run(f, kc - 3, false, 3, true);
        if (!a || !b) continue;
        const span = [Math.max(a[0], b[0]) + 2, Math.min(a[1], b[1]) - 2]; if (span[1] - span[0] < 24) continue;
        used.add(f.key); picks.push({ f, kc, span }); break;
      }
    }
    return picks;
  };
  for (const { f, kc, span } of pick(0, 2, 320)) { f.cut = kc; FM.movers.push({ kind: 'combine', field: f.key, speed: 1.7, s: hash(f.i, f.r) * 50, seg: 0, yaw: 0, cx: f.cx, cz: f.cz, ...loopPath(f, kc - 1, kc - 3, span, 2.5) }); }
  for (const { f, kc, span } of pick(-1, 2, 480)) { f.mover = true; FM.movers.push({ kind: 'tractor', field: f.key, speed: 2.3, s: hash(f.r, f.i) * 50, seg: 0, yaw: 0, cx: f.cx, cz: f.cz, ...loopPath(f, kc - 1, kc - 3, span, 2.5) }); }
}
function* moverMeshes() {
  const L = lib();
  for (const [kind, key, build, cap] of [['combine', 'farm-combine', M.combine, 2], ['tractor', 'farm-harrow-tractor', M.harrowTractor, 3]]) {
    if (!FM.movers.some((mover) => mover.kind === kind)) continue;
    const geo = yield* L.geometry(key, build, 0.125), mesh = new THREE.InstancedMesh(geo, AF.mat.voxelInst, cap);
    mesh.name = 'farm-' + kind; mesh.count = 0; mesh.frustumCulled = false; mesh.castShadow = true; mesh.receiveShadow = true; mesh.customDepthMaterial = AF.mat.depthInst;
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); mesh.layers.set(31); AF.scene.add(mesh); machines[kind] = { mesh, n: 0 };
  }
}
const MOVER_R2 = 320 * 320, moverFrustum = new THREE.Frustum(), moverProj = new THREE.Matrix4(), moverSphere = new THREE.Sphere();
AF.onTick('farm-machines', 333, (dt) => {
  if (!machines.combine && !machines.tractor) return;
  const cp = AF.camera.position;
  if (machines.combine) machines.combine.n = 0; if (machines.tractor) machines.tractor.n = 0;
  let nearest = Infinity, framed = false;
  for (const mover of FM.movers) {
    const batch = machines[mover.kind], d2 = (mover.cx - cp.x) ** 2 + (mover.cz - cp.z) ** 2; if (!batch || d2 > MOVER_R2) continue;
    if (!framed) { moverProj.multiplyMatrices(AF.camera.projectionMatrix, AF.camera.matrixWorldInverse); moverFrustum.setFromProjectionMatrix(moverProj); framed = true; }
    const p = mover.points, cum = mover.cum;
    mover.s += mover.speed * Math.min(dt, 0.1); if (mover.s >= mover.total) { mover.s -= mover.total; mover.seg = 0; }
    while (mover.seg < cum.length - 2 && cum[mover.seg + 1] <= mover.s) mover.seg++;
    const i = mover.seg, f = (mover.s - cum[i]) / Math.max(1e-4, cum[i + 1] - cum[i]), x0 = p[i * 3], z0 = p[i * 3 + 2], x1 = p[i * 3 + 3], z1 = p[i * 3 + 5];
    mover.yaw += AF.angDiff(mover.yaw, Math.atan2(x1 - x0, z1 - z0)) * Math.min(1, dt * 2.5);
    const px = x0 + (x1 - x0) * f, py = p[i * 3 + 1] + (p[i * 3 + 4] - p[i * 3 + 1]) * f - 0.05, pz = z0 + (z1 - z0) * f;
    moverSphere.center.set(px, py + 2, pz); moverSphere.radius = 6; if (!moverFrustum.intersectsSphere(moverSphere)) continue;
    nearest = Math.min(nearest, (px - cp.x) ** 2 + (pz - cp.z) ** 2);
    const e = batch.mesh.instanceMatrix.array, o = batch.n++ * 16, c = Math.cos(mover.yaw), s = Math.sin(mover.yaw);
    e[o] = c; e[o + 1] = 0; e[o + 2] = -s; e[o + 3] = 0; e[o + 4] = 0; e[o + 5] = 1; e[o + 6] = 0; e[o + 7] = 0; e[o + 8] = s; e[o + 9] = 0; e[o + 10] = c; e[o + 11] = 0;
    e[o + 12] = px; e[o + 13] = py; e[o + 14] = pz; e[o + 15] = 1;
  }
  for (const kind in machines) {
    const batch = machines[kind]; if (!batch) continue;
    if (batch.mesh.count !== batch.n) batch.mesh.layers.set(batch.n ? 0 : 31);
    batch.mesh.count = batch.n; batch.mesh.castShadow = nearest < 160 * 160; if (batch.n) batch.mesh.instanceMatrix.needsUpdate = true;
  }
});
// ---------------------------------------------------------------- build: fields, working fields, vineyard pickers and farmhands
AF.onBuild('farm-life', 664, () => {
  FM.fields = enumerate(); FM.stats.fields = FM.fields.length;
  setupMovers();
  if (!AF.walkers || !AF.walkers.addPath) return;
  const height = (x, z) => Math.ceil(Math.max(O.h(x - 0.35, z - 0.35), O.h(x + 0.35, z - 0.35), O.h(x - 0.35, z + 0.35), O.h(x + 0.35, z + 0.35)) * 4) / 4 + 0.25;
  const walk = (name, ends, count) => {
    const points = [];
    for (let index = 1; index < ends.length; index++) { const [x0, z0] = ends[index - 1], [x1, z1] = ends[index], steps = Math.ceil(Math.hypot(x1 - x0, z1 - z0) / 1.5); for (let part = index > 1 ? 1 : 0; part <= steps; part++) { const x = AF.lerp(x0, x1, part / steps), z = AF.lerp(z0, z1, part / steps); points.push([x, height(x, z), z]); } }
    AF.walkers.addPath(name, points, { count, mode: 'pingpong', speed: 0.7, activeRadius: 120, luggage: 0 }); FM.stats.walkers += count;
  };
  const winery = AF.outlandSites && AF.outlandSites.sites.find((site) => site.kind === 'winery');
  if (winery) {
    const vines = FM.fields.filter((f) => f.crop === 3 && Math.hypot(f.cx - winery.x, f.cz - winery.z) < 260).sort((a, b) => Math.hypot(a.cx - winery.x, a.cz - winery.z) - Math.hypot(b.cx - winery.x, b.cz - winery.z));
    let made = 0;
    for (const f of vines) {
      if (made >= 2) break;
      const st = stripes(f), k = Math.round((st.k0 + st.k1) / 2) + made * 4, span = run(f, k, true, 1); if (!span) continue;
      const t = (k + 1) * f.P, uv = [0, 0], a = toWorld(...fieldPoint(f, t, span[0] + 2, uv), [0, 0]), b = toWorld(...fieldPoint(f, t, span[1] - 2, uv), [0, 0]);
      walk('Westmoor vineyard pickers ' + (made + 1), [a, b], 2); made++;
    }
  }
  if (AF.outlandSites) for (const site of AF.outlandSites.sites) if (site.kind === 'farm') walk(site.name + ' farmhand', [[site.x + 8, site.z + 7], [site.x + 8, site.z + 30]], 1);
});
// ---------------------------------------------------------------- idle work
function* generate() {
  FM.stats.phase = 'models'; yield* cropModels();
  FM.stats.phase = 'crops'; yield* crops();
  FM.stats.phase = 'machines'; yield* moverMeshes();
  FM.stats.phase = 'props'; yield* fieldProps();
  FM.stats.phase = 'select';
}
const work = FM.work = (ms) => {
  if (!AF.ready || !AF.outlandSites || !AF.outlandSites.lib) return false;
  const start = performance.now(), end = start + Math.min(ms, AF.MOBILE ? 1.5 : 2.5);
  while (performance.now() < end) {
    const slice = performance.now();
    if (!FM.stats.ready) { if (!generator) generator = generate(); if (generator.next().done) { generator = null; FM.stats.ready = true; revision++; } }
    else { if (!selection) { if (!stale()) break; selection = select(); } if (selection.next().done) selection = null; }
    FM.stats.maxSliceMs = Math.max(FM.stats.maxSliceMs, performance.now() - slice);
  }
  FM.stats.workMs += performance.now() - start;
  return !FM.stats.ready || !!selection || stale();
};
FM.settle = () => { while (work(8)); };
AF.onIdle('farms', work);
// ---------------------------------------------------------------- tests
AF.test('farms: field mirror matches the outland field function', () => {
  let bad = 0, checked = 0;
  for (let index = 0; index < 300; index++) {
    const x = -1250 + hash(index, 3) * 580, z = -290 + hash(index, 5) * 450, f = FM.fieldAt(x, z); checked++;
    if (Math.abs(f.d - O.fieldEdge(x, z)) > 1e-6 || (f.id >= 0.8) !== O.fieldMeadow(x, z) || (x < -660 && z > -300 && z < O.coastZ(x) - 30 && f.id < 0.3 && f.d > 7 && f.lane > 7) !== O.fieldWheat(x, z)) bad++;
  }
  const uv = [0, 0]; let drift = 0; for (let index = 0; index < 50; index++) { const x = -1200 + hash(index, 9) * 500, z = -250 + hash(index, 11) * 400; toWorld(toU(x, z), z - x * 0.12, uv); drift = Math.max(drift, Math.hypot(uv[0] - x, uv[1] - z)); }
  return { ok: !bad && drift < 0.1, info: bad + '/' + checked + ' mismatches, inverse drift ' + drift.toFixed(3) + ' m, ' + FM.fields.length + ' fields' };
});
AF.test('farms: crops are shared instanced LODs on clear field interiors', () => {
  FM.settle(); let bad = 0;
  for (let index = 0; index < N; index += 7) { const r = index * STRIDE, x = REC[r], z = REC[r + 2]; if (!clear(x, z) || O.h(x, z) < REC[r + 1]) bad++; }
  const eye = { x: -950, y: O.h(-950, -60) + 1.7, z: -60 }, stats = FM.select(eye, false), kinds = FM.stats.kinds;
  return { ok: N > 3000 && kinds.every((count) => count > 100) && !bad && FM.meshes.length === 5 && stats.draws <= 5 && stats.triangles < 900000 && FM.meshes.every((mesh) => !mesh.castShadow && !mesh.frustumCulled),
    info: N + ' segments ' + JSON.stringify(kinds) + ', ' + bad + ' invalid, all-round select at Westmoor: ' + stats.draws + ' draws ' + Math.round(stats.triangles / 1000) + 'k tris (' + stats.near + ' near / ' + stats.mid + ' canopy), per segment ' + JSON.stringify(FM.stats.trianglesPer) };
});
AF.test('farms: machines, farmsteads and field props', () => {
  FM.settle(); if (AF.outlandSites) AF.outlandSites.settle();
  let wet = 0; for (const mover of FM.movers) for (let index = 0; index < mover.points.length; index += 3) if (O.waterY(mover.points[index], mover.points[index + 2]) !== null) wet++;
  const farms = AF.outlandSites.sites.filter((site) => site.kind === 'farm');
  return { ok: FM.movers.some((mover) => mover.kind === 'combine') && FM.movers.some((mover) => mover.kind === 'tractor') && !wet && farms.length >= 6 && FM.stats.props > 60 && FM.stats.walkers >= 6,
    info: FM.movers.map((mover) => mover.kind + ' ' + Math.round(mover.total) + 'm').join(', ') + ', ' + farms.length + ' farms, ' + FM.stats.props + ' props, ' + FM.stats.walkers + ' walkers, wet ' + wet };
});
} catch (e) { AF.partError('44-farms.js', e); }
