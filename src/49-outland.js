// ================================================================ 49-outland.js
try {
const O = AF.outland, W = AF.W, plan = AF.PLAN.world, fade = AF.world.fade;
const group = new THREE.Group(); group.name = 'outland'; AF.scene.add(group);
const roots = [], nodes = [], queue = [], empty = [];
const R = O.renderer = { bootMs: 0, maxStepMs: 0, workMs: 0, maxNodes: 320, maxBytes: 80 * 1048576, bytes: 0, builds: 0, disposed: 0, active: 0 };
let current = null, generator = null, stamp = 0, scanT = 0;
const ahead = AF.stream.ahead;
const terrainBuf = O.terrainBuf;
R.scratchBytes = terrainBuf.p.byteLength + terrainBuf.uv.byteLength + terrainBuf.pal.byteLength + terrainBuf.an.byteLength + terrainBuf.idx.byteLength;
function node(x, z, level, parent) {
  const size = 32 * 2 ** level;
  const entry = { x, z, level, size, parent, children: null, meshes: [], ins: [], outs: [], rim: new Float32Array(260), ready: false, split: false, busy: false, fadeE: null, used: stamp, bytes: 0, queued: false, dirty: false };
  entry.finish = () => { entry.busy = false; };
  nodes.push(entry); return entry;
}
function distance(entry, x, y, z) {
  return Math.hypot(Math.max(entry.x - x, 0, x - entry.x - entry.size), Math.max(entry.z - z, 0, z - entry.z - entry.size), Math.max(0, y - O.h(AF.clamp(x, entry.x, entry.x + entry.size), AF.clamp(z, entry.z, entry.z + entry.size)) - 25) * 0.65);
}
// a worker result (07-outland O.meshTileArrays, transferred buffers) as geometry: no copies, bounds precomputed
function geometryFrom(pre) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pre.p, 3));
  geo.setAttribute('aBU', new THREE.BufferAttribute(pre.uv, 2));
  geo.setAttribute('aPal', new THREE.BufferAttribute(pre.pal, 1));
  geo.setAttribute('aAN', new THREE.BufferAttribute(pre.an, 1));
  geo.setIndex(new THREE.BufferAttribute(pre.idx, 1));
  const b = pre.box, s = pre.sphere;
  geo.boundingBox = new THREE.Box3(new THREE.Vector3(b[0], b[1], b[2]), new THREE.Vector3(b[3], b[4], b[5]));
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(s[0], s[1], s[2]), s[3]);
  return geo;
}
function* build(entry) {
  const revision = entry.propRevision ?? 0, pre = entry.pre;
  entry.pre = null;
  let geo;
  if (pre) { R.workerBuilt++; entry.rim.set(pre.rim); geo = pre.n ? geometryFrom(pre) : null; }
  else { const n = yield* O.meshTileG(entry, entry.rim); geo = n ? yield* terrainBuf.geometryG(true) : null; }
  yield;
  if (O.props.length) {
    const props = [];
    if (geo) props.push({ geo, x: 0, y: 0, z: 0, rot: 0 });
    for (const prop of O.props) if (prop.x >= entry.x && prop.x < entry.x + entry.size && prop.z >= entry.z && prop.z < entry.z + entry.size && !(entry.level >= 3 && prop.geo.userData.small)) props.push(prop);
    if (props.length > (geo ? 1 : 0)) {
      const pick = (prop) => entry.level >= 3 && prop.geo.userData.lod2 ? prop.geo.userData.lod2 : entry.level > 0 && prop.geo.userData.lod ? prop.geo.userData.lod : prop.geo;
      const merged = yield* AF.world.mergePropsG(props, pick, true);
      if (geo) geo.dispose(); geo = merged;
    }
  }
  const previous = entry.meshes, previousBytes = entry.bytes, visible = previous.some((mesh) => mesh.visible);
  entry.meshes = []; entry.bytes = 0;
  if (geo) {
    let bytes = geo.index.array.byteLength;
    for (const attribute of Object.values(geo.attributes)) bytes += attribute.array.byteLength;
    const mesh = new THREE.Mesh(geo, AF.mat.voxel);
    mesh.name = 'outland-L' + entry.level; mesh.userData.owner = mesh.name; mesh.receiveShadow = true; mesh.castShadow = entry.level <= 1;
    mesh.matrixAutoUpdate = false; mesh.updateMatrix(); mesh.visible = false;
    group.add(mesh); entry.meshes.push(mesh); entry.bytes = bytes; R.bytes += bytes;
    AF.releaseStaticGeometry(geo);
  }
  const finish = () => {
    for (const mesh of previous) { group.remove(mesh); mesh.geometry.userData.memDisposed = true; mesh.geometry.dispose(); }
    R.bytes -= previousBytes; entry.busy = false;
  };
  if (visible) { entry.busy = true; fade.swap(entry, previous, entry.meshes, finish); }
  else finish();
  entry.ready = true; entry.queued = false; entry.dirty = (entry.propRevision ?? 0) !== revision; entry.used = stamp; R.builds++;
}
function enqueue(entry) { if (!entry.ready && !entry.queued) { entry.queued = true; queue.push(entry); } }
function makeChildren(entry) {
  if (entry.children) return;
  const size = entry.size / 2;
  entry.children = [node(entry.x, entry.z, entry.level - 1, entry), node(entry.x + size, entry.z, entry.level - 1, entry), node(entry.x, entry.z + size, entry.level - 1, entry), node(entry.x + size, entry.z + size, entry.level - 1, entry)];
}
function listVisible(entry, output) {
  if (entry.split) for (const child of entry.children) listVisible(child, output);
  else for (const mesh of entry.meshes) output.push(mesh);
}
function frozen(entry) {
  if (entry.fadeE || entry.busy) return true;
  if (entry.children) for (const child of entry.children) if (frozen(child)) return true;
  return false;
}
// split wanted? (hysteresis: a split tile merges back only 25 % farther out; reach > 1 = the prefetch radius)
function wants(entry, cp, split, reach = 1) {
  if (entry.level <= 0) return false;
  const horizon = entry.x + entry.size < plan.play.x0 || entry.x > plan.play.x1 || entry.z + entry.size < plan.play.z0 || entry.z > 800;
  if (horizon) return false;
  const threshold = entry.level === 1 ? 100 * AF.LOD.view : entry.size * AF.LOD.outland;
  return Math.min(distance(entry, cp.x, cp.y, cp.z), distance(entry, ahead.x, cp.y, ahead.z) + 24) < threshold * (split ? 1.25 : 1) * reach;
}
// load ahead of display: every tile the view will split into within AF.LOD.prefetch x its split distance is built (all levels at
// once, nearest first), so an approach only ever cross-fades to tiles that are already resident
function prefetch(entry, cp) {
  if (!wants(entry, cp, false, AF.LOD.prefetch)) return;
  makeChildren(entry);
  for (const child of entry.children) { child.used = stamp; enqueue(child); prefetch(child, cp); }
}
// the view is final: every shown tile is built and current, and none of them wants to split
function settled(entry, cp) {
  if (entry.fadeE || entry.busy) return false;
  if (entry.split) { for (const child of entry.children) if (!settled(child, cp)) return false; return true; }
  return entry.ready && !entry.dirty && !wants(entry, cp, false);
}
R.near = () => { if (!AF.ready || !roots.length) return false; const cp = AF.camera.position; for (const root of roots) if (!settled(root, cp)) return true; return false; };
// what a tile about to split shows: each child, or straight away that child's own ready children when it wants to split too
// (an approach never waits for one fade per quadtree level). Only for subtrees that are not on screen.
function cover(entry, cp, output) {
  entry.used = stamp;
  const deeper = wants(entry, cp, false) && !!entry.children && entry.children.every((child) => child.ready);
  entry.split = deeper;
  if (deeper) for (const child of entry.children) cover(child, cp, output);
  else for (const mesh of entry.meshes) output.push(mesh);
}
function update(entry, cp, inherited) {
  if (!(entry.ready || entry.split) || entry.fadeE || entry.busy || inherited) return;
  entry.used = stamp;
  if (wants(entry, cp, entry.split)) {
    makeChildren(entry);
    let ready = true;
    for (const child of entry.children) { enqueue(child); if (!child.ready) ready = false; }
    if (!entry.split && ready) {
      const ins = entry.ins; ins.length = 0;
      for (const child of entry.children) cover(child, cp, ins);
      entry.split = true; entry.busy = true; fade.swap(entry, entry.meshes, ins, entry.finish);
    }
    if (entry.split && !entry.busy) for (const child of entry.children) update(child, cp, false);
  } else if (entry.split && !frozen(entry)) {
    // merging back needs this tile's own mesh (a split tile being rebuilt stays split until it is ready)
    if (!entry.ready) { enqueue(entry); for (const child of entry.children) update(child, cp, false); return; }
    const outs = entry.outs; outs.length = 0; for (const child of entry.children) listVisible(child, outs);
    entry.split = false; entry.busy = true; fade.swap(entry, outs, entry.meshes, entry.finish);
  }
}
function dispose(entry) {
  if (entry === current || entry.fadeE || entry.busy) return false;
  for (const mesh of entry.meshes) {
    if (mesh.visible) return false;
  }
  if (entry.children) for (const child of entry.children) if (!dispose(child)) return false;
  for (const mesh of entry.meshes) { group.remove(mesh); mesh.geometry.userData.memDisposed = true; mesh.geometry.dispose(); }
  R.bytes -= entry.bytes; entry.bytes = 0; entry.meshes.length = 0; entry.ready = false; entry.split = false; R.disposed++;
  return true;
}
// ---------------------------------------------------------------- scheduling (one prioritised queue, worker meshing, stale jobs dropped)
// The queue is re-ranked every scan (10 Hz): distance to the camera or the look-ahead, tiles behind the camera later. Tiles the view no
// longer needs (their parent stopped wanting a split within the prefetch radius) leave the queue, in-flight worker jobs for them are
// ignored on return and a half-built main-thread tile is abandoned (nothing is attached before its last step), so driving past an area
// never leaves a backlog. Meshing runs on Web Workers (07-outland's scope, same height function) for tiles clear of the city grid; the
// main thread only wraps the transferred arrays (+ merges outland props) — tiles touching the city grid still mesh here in slices.
const inside = (x, z) => x >= W.X0 && x < W.x1 && z >= W.Z0 && z < W.z1;
const gridFree = (e) => e.x + e.size + 24 <= W.X0 || e.x - 24 >= W.x1 || e.z + e.size + 24 <= W.Z0 || e.z - 24 >= W.z1;
const WK = O.worker = { list: [], jobs: new Map(), next: 1, on: false, tried: false, padsN: -1, stats: { workers: 0, sent: 0, done: 0, dropped: 0, failed: 0, ms: 0 } };
R.dropped = 0; R.aborted = 0; R.workerBuilt = 0; R.sync = false;
const fwd = new THREE.Vector3();
function score(entry, cp) {
  const d = Math.min(distance(entry, cp.x, cp.y, cp.z), distance(entry, ahead.x, cp.y, ahead.z) + 24) + (entry.parent && !entry.parent.split ? 0 : -16);
  const cx = entry.x + entry.size / 2 - cp.x, cz = entry.z + entry.size / 2 - cp.z, l = Math.hypot(cx, cz);
  if (l < entry.size) return d;
  const dot = (cx * fwd.x + cz * fwd.z) / l;
  return dot < 0 ? d - dot * Math.min(d, 240) * 0.6 : d;
}
// still wanted: shown or about to be (parent split), a rebuild of a resident tile, or inside its parent's prefetch radius
const needed = (entry, cp) => !entry.parent || entry.parent.split || entry.meshes.length > 0 || wants(entry.parent, cp, false, AF.LOD.prefetch * 1.15);
const mainTakes = (e) => R.sync || !WK.on || !!e.pre || !!e.noWorker || !gridFree(e);
const workerSource = () => `'use strict';
const AF = { WORKER: true, clamp: ${AF.clamp}, lerp: ${AF.lerp}, smooth: ${AF.smooth}, hash2: ${AF.hash2}, noise2: ${AF.noise2}, onBuild() {}, test() {}, addLabel() {}, addLight() {}, PAL: { hex: [] } };
let pal = null, palK = 0;
AF.col = (v) => typeof v === 'string' ? 0 : pal[palK++];
const outlandScope = ${O.scopeFn.toString()};
onmessage = (e) => {
  const m = e.data;
  if (m.type === 'job') {
    const t0 = performance.now();
    try { const r = AF.outland.meshTileArrays(m.x, m.z, m.size); r.type = 'done'; r.id = m.id; r.ms = performance.now() - t0; postMessage(r, [r.p.buffer, r.uv.buffer, r.pal.buffer, r.an.buffer, r.idx.buffer, r.rim.buffer]); }
    catch (err) { postMessage({ type: 'fail', id: m.id, err: String(err && err.message || err) }); }
  } else if (m.type === 'pads') AF.outland.setPads(m.pads);
  else if (m.type === 'init') {
    pal = m.pal; const g = m.W, VS = g.VS, X0 = g.X0, Z0 = g.Z0, NX = g.NX, NZ = g.NZ, inv = 1 / VS;
    AF.W = { VS, X0, Z0, NX, NZ, x1: X0 + NX * VS, z1: Z0 + NZ * VS, H: null, bx: (x) => Math.floor((x - X0) * inv), bz: (z) => Math.floor((z - Z0) * inv), xOf: (bx) => X0 + bx * VS, zOf: (bz) => Z0 + bz * VS,
      col(x, z) { const bx = this.bx(x), bz = this.bz(z); if (bx < 0 || bz < 0 || bx >= NX || bz >= NZ) return -1; throw new Error('city grid sampled'); }, groundY() { throw new Error('city grid sampled'); } };
    AF.PLAN = { world: m.net.plan, river: { headY: m.headY, x: () => 0 } };
    AF.land = { BEACH: { shore: () => m.net.shore } };
    outlandScope(AF); AF.outland.netImport(m.net);
  }
};`;
function onResult(e) {
  const m = e.data, job = WK.jobs.get(m.id); if (!job) return;
  WK.jobs.delete(m.id); job.worker.busy--;
  const entry = job.entry;
  if (m.type === 'fail') { WK.stats.failed++; if (entry.job === m.id) entry.job = 0; entry.noWorker = true; AF.warnOnce('outland worker job', m.err); return; }
  WK.stats.done++; WK.stats.ms += m.ms;
  if (entry.job !== m.id || job.padsN !== WK.padsN || !entry.queued) { WK.stats.dropped++; if (entry.job === m.id) entry.job = 0; return; }
  entry.job = 0; entry.pre = m;
  dispatch();   // keep the worker fed between frames
}
function startWorkers() {
  WK.tried = true;
  if (typeof Worker === 'undefined' || AF.Q.has('noworker')) return;
  try {
    const net = O.netExport(), url = URL.createObjectURL(new Blob([workerSource()], { type: 'text/javascript' }));
    const n = Math.max(1, Math.min(AF.MOBILE ? 2 : 3, (navigator.hardwareConcurrency || 4) - 1));
    const init = { type: 'init', net, pal: Array.from(O.pal), headY: AF.PLAN.river.headY, W: { VS: W.VS, X0: W.X0, Z0: W.Z0, NX: W.NX, NZ: W.NZ } };
    for (let index = 0; index < n; index++) {
      const worker = new Worker(url); worker.busy = 0; worker.onmessage = onResult;
      worker.onerror = (err) => { AF.warnOnce('outland worker failed: meshing on the main thread', err.message || err); WK.on = false; };
      worker.postMessage(init); WK.list.push(worker);
    }
    WK.padsN = O.pads.length; WK.on = true; WK.stats.workers = n;
  } catch (err) { AF.warnOnce('outland workers unavailable', err); WK.on = false; }
}
function dispatch() {
  if (!WK.on || R.sync) return;
  if (O.pads.length !== WK.padsN) { WK.padsN = O.pads.length; const pads = O.padsExport(); for (const worker of WK.list) worker.postMessage({ type: 'pads', pads }); }
  for (const worker of WK.list) while (worker.busy < 3) {
    let best = null, bestS = Infinity;
    for (const e of queue) if (!e.job && !e.pre && !e.noWorker && gridFree(e) && e.score < bestS) { best = e; bestS = e.score; }
    if (!best) return;
    const id = WK.next++; best.job = id; worker.busy++; WK.stats.sent++;
    WK.jobs.set(id, { entry: best, worker, padsN: WK.padsN });
    worker.postMessage({ type: 'job', id, x: best.x, z: best.z, size: best.size });
  }
}
function work(ms) {
  if (!AF.ready) return false;
  if (!WK.tried && !R.sync) startWorkers();
  dispatch();
  const start = performance.now(), end = start + Math.min(ms, AF.MOBILE ? 2.5 : 4);
  while (performance.now() < end) {
    if (!generator) {
      let best = -1, bestS = Infinity;
      for (let index = 0; index < queue.length; index++) {
        const e = queue[index];
        if (e.job && !R.sync || !mainTakes(e)) continue;
        if (e.score < bestS) { bestS = e.score; best = index; }
      }
      if (best < 0) break;
      R.urgent = bestS < 48;   // a tile right around the camera: the rendered frame helps (outland-lod)
      current = queue[best]; queue[best] = queue[queue.length - 1]; queue.pop(); current.job = 0;
      generator = build(current);
    }
    const slice = performance.now(), done = generator.next().done;
    R.maxStepMs = Math.max(R.maxStepMs, performance.now() - slice);
    if (done) { generator = null; current = null; R.urgent = false; }
  }
  R.workMs = performance.now() - start;
  if (generator) return true;
  for (const e of queue) if ((!e.job || R.sync) && mainTakes(e)) return true;
  return false;
}
function scan() {
  const cp = AF.camera.position, reach = Math.max(1, AF.LOD.view ** 2); stamp++;
  R.maxNodes = Math.round((AF.MOBILE ? 720 : 960) * reach); R.maxBytes = Math.min(AF.MOBILE ? 224 : 400, (AF.MOBILE ? 176 : 240) * reach) * 1048576;
  for (const entry of nodes) if (entry.dirty && entry.ready && !entry.fadeE && !entry.busy) {
    let parent = entry.parent, blocked = false;
    while (parent) { if (parent.fadeE || parent.busy) { blocked = true; break; } parent = parent.parent; }
    if (!blocked) { entry.ready = false; enqueue(entry); }
  }
  for (const root of roots) update(root, cp, false);
  for (const root of roots) prefetch(root, cp);
  // drop what the view stopped wanting; rank the rest
  for (let index = queue.length - 1; index >= 0; index--) {
    const e = queue[index]; if (needed(e, cp)) continue;
    queue[index] = queue[queue.length - 1]; queue.pop(); e.queued = false; e.job = 0; e.pre = null; R.dropped++;
  }
  if (current && !current.meshes.length && !needed(current, cp)) { generator = null; current.queued = false; current = null; R.urgent = false; R.aborted++; }
  AF.camera.getWorldDirection(fwd); fwd.y = 0; if (fwd.lengthSq() < 1e-6) fwd.set(0, 0, 1); fwd.normalize();
  for (const e of queue) e.score = score(e, cp);
  let kept = 0;
  for (const entry of nodes) if (entry.ready) kept++;
  while (kept > R.maxNodes || R.bytes > R.maxBytes) {
    let oldest = null;
    for (const entry of nodes) if (entry.parent && !entry.parent.split && !frozen(entry.parent) && entry.ready && entry !== current && (!oldest || entry.used < oldest.used)) oldest = entry;
    if (!oldest || !dispose(oldest)) break;
    kept = 0; for (const entry of nodes) if (entry.ready) kept++;
  }
  R.active = kept;
}
AF.stream.register('outland-build', { order: 20, work: (ms) => work(Math.min(ms, AF.MOBILE ? 4 : 6)), near: R.near });
AF.onTick('outland-lod', 876, (dt) => {
  if (!AF.ready) return;
  scanT += dt; if (scanT >= 0.1 || AF.stream.loading) { scanT = 0; scan(); }
  // a tile right around the camera is missing: the rendered frame helps, more so while the city streamer has nothing urgent
  work(R.urgent ? (AF.world.stream && AF.world.stream.urgent ? 1.5 : AF.MOBILE ? 2.5 : 3) : 1);
});
R.settle = () => {
  R.sync = true;
  try { for (let pass = 0; pass < 7; pass++) { scan(); while (work(20)); AF.step(22, 1 / 30); } }
  finally { R.sync = false; }
};
R.stats = () => {
  let visible = 0, triangles = 0;
  for (const mesh of group.children) if (mesh.visible) { visible++; triangles += mesh.geometry.index.count / 3; }
  return { nodes: nodes.length, resident: R.active, visible, triangles, bytes: R.bytes, bootMs: R.bootMs, maxStepMs: R.maxStepMs, builds: R.builds, workerBuilt: R.workerBuilt, disposed: R.disposed, pending: queue.length, dropped: R.dropped, aborted: R.aborted };
};
// shown tiles coarser than the view wants (the "late detail" metric of tools/outland-drive.js)
R.late = () => {
  const cp = AF.camera.position; let n = 0;
  const walk = (entry) => { if (entry.split) { for (const child of entry.children) walk(child); } else if (wants(entry, cp, false)) n++; };
  for (const root of roots) walk(root);
  return n;
};
R.diagnose = () => {
  const visible = nodes.filter(entry => entry.meshes.some(mesh => mesh.visible && mesh.material === AF.mat.voxel));
  const cover = nodes.filter(entry => entry.meshes.some(mesh => mesh.visible));
  let overlaps = 0, pairs = 0, maxGap = 0, holes = 0, samples = 0;
  const sample = (entry, side, value) => { const along = AF.clamp((value - (side < 2 ? entry.z : entry.x)) / entry.size * 64, 0, 64), index = Math.min(63, Math.floor(along)); return AF.lerp(entry.rim[side * 65 + index], entry.rim[side * 65 + index + 1], along - index); };
  for (let first = 0; first < visible.length; first++) for (let second = first + 1; second < visible.length; second++) {
    const left = visible[first], right = visible[second], x0 = Math.max(left.x, right.x), x1 = Math.min(left.x + left.size, right.x + right.size), z0 = Math.max(left.z, right.z), z1 = Math.min(left.z + left.size, right.z + right.size);
    if (x1 > x0 && z1 > z0) overlaps++;
    const vertical = x0 === x1 && z1 > z0, horizontal = z0 === z1 && x1 > x0;
    if (!vertical && !horizontal) continue;
    const side = vertical ? left.x < right.x ? 1 : 0 : left.z < right.z ? 3 : 2, low = vertical ? z0 : x0, high = vertical ? z1 : x1;
    for (let value = low; value <= high; value += Math.min(left.size, right.size) / 64) {
      const gap = Math.abs(sample(left, side, value) - sample(right, side ^ 1, value));
      if (gap > maxGap) { maxGap = gap; R.worstGap = { a: [left.x, left.z, left.level], b: [right.x, right.z, right.level], side, at: value, ha: sample(left, side, value), hb: sample(right, side ^ 1, value) }; }
    }
    pairs++;
  }
  for (let x = plan.play.x0 + 20; x < plan.play.x1; x += 80) for (let z = plan.play.z0 + 20; z < plan.play.z1; z += 80) {
    if (inside(x, z) || O.h(x, z) < -1.25) continue;
    samples++; if (!cover.some(entry => x >= entry.x && x < entry.x + entry.size && z >= entry.z && z < entry.z + entry.size)) holes++;
  }
  return { overlaps, edgePairs: pairs, maxGap, holes, coverSamples: samples, speculativeSkirts: 0 };
};
O.addProp = (geo, x, y, z, rot = 0, opts = {}) => {
  if (!geo || !geo.attributes.aPal || !geo.index || !geo.attributes.position.array) throw new Error('outland props need retained voxel geometry');
  const prop = { geo, x, y, z, rot: ((rot % 4) + 4) % 4 }; O.props.push(prop);
  if (opts.collide !== false) {
    const box = geo.boundingBox || (geo.computeBoundingBox(), geo.boundingBox), transform = new THREE.Matrix4().makeRotationY(prop.rot * Math.PI / 2);
    const bounds = box.clone().applyMatrix4(transform);
    prop.col = AF.addCollider(x + bounds.min.x, y + bounds.min.y, z + bounds.min.z, x + bounds.max.x, y + bounds.max.y, z + bounds.max.z, opts.tag);
  }
  for (const entry of nodes) if (x >= entry.x && x < entry.x + entry.size && z >= entry.z && z < entry.z + entry.size) { entry.propRevision = (entry.propRevision ?? 0) + 1; if (entry.ready) entry.dirty = true; }
  return prop;
};
AF.onBuild('outland-roots', 497, () => {
  const start = performance.now();
  for (let x = -1484; x < O.bounds.x1; x += 512) for (let z = -1708; z < O.bounds.z1; z += 512) {
    if (x >= W.X0 && x + 512 <= W.x1 && z >= W.Z0 && z + 512 <= W.z1) continue;
    const root = node(x, z, 4, null); roots.push(root);
    const gen = build(root); while (!gen.next().done);
    fade.swap(root, empty, root.meshes);
  }
  const focus = AF.PLAN.bootFocus || { x: 100, z: -60 };
  for (const root of roots) if (distance(root, focus.x, 0, focus.z) < 160) {
    makeChildren(root); const ins = [];
    for (const child of root.children) { const gen = build(child); while (!gen.next().done); ins.push(...child.meshes); }
    root.split = true; fade.swap(root, root.meshes, ins);
  }
  R.bootMs = performance.now() - start; R.active = nodes.length;
});
AF.onBuild('outland-lake', 498, () => {
  const points = [], indices = [];
  for (const lake of O.waters) {
    const start = points.length / 3; points.push(lake.cx, lake.waterY, lake.cz);
    for (let index = 0; index <= 64; index++) { const angle = index / 64 * Math.PI * 2; points.push(lake.cx + Math.cos(angle) * lake.rx * 1.04, lake.waterY, lake.cz + Math.sin(angle) * lake.rz * 1.04); if (index) indices.push(start, start + index + 1, start + index); }
  }
  // rivers: one sloped ribbon each (rapids where the level steps down), merged into the same water draw
  const ribbon = (pts, levels, half) => {
    for (let index = 0; index < pts.length; index++) {
      const before = pts[Math.max(0, index - 1)], after = pts[Math.min(pts.length - 1, index + 1)], tx = after[0] - before[0], tz = after[1] - before[1], length = Math.hypot(tx, tz) || 1;
      const base = points.length / 3; points.push(pts[index][0] - tz / length * half, levels[index], pts[index][1] + tx / length * half, pts[index][0] + tz / length * half, levels[index], pts[index][1] - tx / length * half);
      if (index) indices.push(base - 2, base, base - 1, base - 1, base, base + 1);
    }
  };
  for (const river of O.rivers) ribbon(river.pts, river.levels, river.hw + 1.2);
  const RV = AF.PLAN.river;
  if (RV.headY) { const pts = [], levels = []; for (let z = W.Z0; z <= RV.z0 - 14; z += 2) { pts.push([RV.x(z), z]); levels.push(AF.lerp(RV.headY, 16, (z - W.Z0) / (RV.z0 - 14 - W.Z0))); } ribbon(pts, levels, 5); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(points, 3)); geo.setIndex(indices); geo.computeVertexNormals(); geo.computeBoundingBox(); geo.computeBoundingSphere();
  geo.userData.kind = 'lake'; geo.userData.waterY = plan.lake.waterY; geo.userData.outland = true; AF.addWater(geo);
  // falls: white water over every steep river reach (> 20 % fall), one opaque ribbon with foam bands streaming downhill
  const fp = [], fuv = [], fi = [];
  for (const river of O.rivers) {
    let prev = -1, along = 0;
    const vertex = (end) => {
      const point = river.pts[end], before = river.pts[Math.max(0, end - 1)], after = river.pts[Math.min(river.pts.length - 1, end + 1)], tx = after[0] - before[0], tz = after[1] - before[1], tl = Math.hypot(tx, tz) || 1, half = river.hw + 0.8, base = fp.length / 3;
      fp.push(point[0] - tz / tl * half, river.levels[end] + 0.12, point[1] + tx / tl * half, point[0] + tz / tl * half, river.levels[end] + 0.12, point[1] - tx / tl * half); fuv.push(-half, along, half, along);
      return base;
    };
    for (let index = 1; index < river.pts.length; index++) {
      const a = river.pts[index - 1], b = river.pts[index], length = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      if ((river.levels[index - 1] - river.levels[index]) / length <= 0.2) { prev = -1; continue; }
      if (prev < 0) { along = 0; prev = vertex(index - 1); }
      along += length; const base = vertex(index); fi.push(prev, base, prev + 1, prev + 1, base, base + 1); prev = base;
    }
  }
  if (fi.length) {
    const fg = new THREE.BufferGeometry(); fg.setAttribute('position', new THREE.Float32BufferAttribute(fp, 3)); fg.setAttribute('fallUV', new THREE.Float32BufferAttribute(fuv, 2)); fg.setIndex(fi); fg.computeVertexNormals();
    const mat = new THREE.MeshLambertMaterial({ color: 0xffffff, side: THREE.DoubleSide });
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uAfTime = AF.mat.uniforms.uAfTime;
      shader.vertexShader = 'attribute vec2 fallUV; varying vec2 vFall;\n' + shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvFall = fallUV;');
      shader.fragmentShader = 'uniform float uAfTime; varying vec2 vFall;\n' + shader.fragmentShader.replace('vec4 diffuseColor = vec4( diffuse, opacity );',
        'float fallS = fract(vFall.y * 0.3 - uAfTime * 1.4 + sin(vFall.x * 1.9 + vFall.y * 0.2) * 0.35); float fallK = smoothstep(0.0, 0.2, fallS) * (1.0 - smoothstep(0.5, 0.85, fallS)) * (1.0 - smoothstep(0.6, 1.0, abs(vFall.x) / 3.8));\nvec4 diffuseColor = vec4(mix(vec3(0.3, 0.52, 0.6), vec3(0.93, 0.97, 1.0), 0.12 + 0.78 * fallK), 1.0);');
    };
    mat.customProgramCacheKey = () => 'outland-falls';
    const falls = new THREE.Mesh(fg, mat); falls.name = 'outland-falls'; falls.receiveShadow = true; AF.scene.add(falls);
  }
});
AF.test('outland: seam continuity along 200 non-building border samples', () => {
  let worst = 0, checked = 0;
  for (let index = 0; index < 50; index++) {
    const x = W.X0 + (index + 0.5) / 50 * (W.x1 - W.X0), z = W.Z0 + (index + 0.5) / 50 * (W.z1 - W.Z0);
    for (const pair of [[x, W.Z0 + 0.125, x, W.Z0 - 0.125], [x, W.z1 - 0.125, x, W.z1 + 0.125], [W.X0 + 0.125, z, W.X0 - 0.125, z], [W.x1 - 0.125, z, W.x1 + 0.125, z]]) {
      const height = W.groundY(pair[0], pair[1]);
      if (W.getM(pair[0], height + 0.125, pair[1])) continue;
      worst = Math.max(worst, Math.abs(height - O.groundY(pair[2], pair[3]))); checked++;
    }
  }
  return { ok: checked >= 170 && worst <= 0.5, info: checked + ' samples, worst ' + worst + ' m' };
});
AF.test('outland: terrain physics on range and island; sea gap and reserved pads', () => {
  let ok = true;
  for (const coords of [[220, -760], [-60, 600]]) {
    const x = coords[0], z = coords[1], y = W.groundY(x, z);
    if (y <= 0 || AF.surfaceBelow(x, z, y + 2, 6) !== y || !AF.boxBlocked(x, y - 0.5, z, 0.1, 1.7) || AF.boxBlocked(x, y + 2, z, 0.1, 1.7)) ok = false;
  }
  const island = W.groundY(-60, 600), gap = W.groundY(-60, 380), strip = W.groundY(-100, 540), resort = W.groundY(-170, 640);
  return { ok: ok && island > 0 && gap < -1.25 && strip === 2 && resort === 3, info: 'island ' + island + ', gap ' + gap + ', strip ' + strip + ', resort ' + resort };
});
AF.test('outland: bounded resident geometry and single LOD cover', () => {
  let overlap = 0;
  for (const entry of nodes) if (entry.split && !entry.fadeE && entry.meshes.some((mesh) => mesh.visible)) overlap++;
  const stats = R.stats();
  return { ok: !overlap && stats.resident <= R.maxNodes + 16 && stats.bytes <= R.maxBytes + 4 * 1048576 && stats.visible < 100, info: JSON.stringify(stats) + ', overlaps ' + overlap };
});
AF.test('outland: shared LOD rims have no cracks or settled overlap', () => {
  const result = R.diagnose(); return { ok: result.edgePairs > 0 && result.maxGap < 0.001 && !result.overlaps && !result.holes, info: JSON.stringify(result) };
});
} catch (e) { AF.partError('49-outland.js', e); }