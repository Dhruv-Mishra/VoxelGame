// ================================================================ 49-outland.js
try {
const O = AF.outland, W = AF.W, plan = AF.PLAN.world, fade = AF.world.fade;
const group = new THREE.Group(); group.name = 'outland'; AF.scene.add(group);
const roots = [], nodes = [], queue = [], empty = [];
const R = O.renderer = { bootMs: 0, maxStepMs: 0, workMs: 0, maxNodes: 220, maxBytes: 48 * 1048576, bytes: 0, builds: 0, disposed: 0, active: 0 };
let current = null, generator = null, stamp = 0, scanT = 0, lastX = 0, lastZ = 0, aheadX = 0, aheadZ = 0;
const quadP = new Float64Array(12), quadUV = new Float64Array(8);
const setP = (a, b, c, d, e, f, g, h, i, j, k, l) => { const q = quadP; q[0] = a; q[1] = b; q[2] = c; q[3] = d; q[4] = e; q[5] = f; q[6] = g; q[7] = h; q[8] = i; q[9] = j; q[10] = k; q[11] = l; };
const setUV = (a, b, c, d, e, f, g, h) => { const q = quadUV; q[0] = a; q[1] = b; q[2] = c; q[3] = d; q[4] = e; q[5] = f; q[6] = g; q[7] = h; };
const heights = new Int16Array(66 * 66), colors = new Uint16Array(64 * 64), used = new Uint8Array(64 * 64);
const terrainBuf = { n: 0, p: new Float32Array(262144 * 3), uv: new Float32Array(262144 * 2), pal: new Uint16Array(262144), an: new Uint8Array(262144), idx: new Uint32Array(393216),
  quadS(points, tex, first, second, third, fourth, color, normal, ao0, ao1, ao2, ao3) {
    const base = this.n; if (base + 4 > this.pal.length) throw new Error('outland mesh scratch capacity');
    for (let corner = 0; corner < 4; corner++) {
      const source = corner === 0 ? first : corner === 1 ? second : corner === 2 ? third : fourth, vertex = base + corner;
      for (let axis = 0; axis < 3; axis++) this.p[vertex * 3 + axis] = points[source * 3 + axis];
      this.uv[vertex * 2] = tex[source * 2]; this.uv[vertex * 2 + 1] = tex[source * 2 + 1]; this.pal[vertex] = color;
      this.an[vertex] = (corner === 0 ? ao0 : corner === 1 ? ao1 : corner === 2 ? ao2 : ao3) * 8 + normal;
    }
    const offset = base / 4 * 6, reverse = ao0 + ao2 < ao1 + ao3;
    this.idx[offset] = base + (reverse ? 1 : 0); this.idx[offset + 1] = base + (reverse ? 2 : 1); this.idx[offset + 2] = base + (reverse ? 3 : 2);
    this.idx[offset + 3] = base + (reverse ? 1 : 0); this.idx[offset + 4] = base + (reverse ? 3 : 2); this.idx[offset + 5] = base + (reverse ? 0 : 3); this.n += 4;
  },
  *geometryG() { return yield* AF.GeoBuf.prototype.geometryG.call({ n: this.n, p: this.p.subarray(0, this.n * 3), uv: this.uv.subarray(0, this.n * 2), pal: this.pal.subarray(0, this.n), an: this.an.subarray(0, this.n), idx: this.idx.subarray(0, this.n / 4 * 6) }, true); }
};
R.scratchBytes = terrainBuf.p.byteLength + terrainBuf.uv.byteLength + terrainBuf.pal.byteLength + terrainBuf.an.byteLength + terrainBuf.idx.byteLength;
const directions = [[1, 0, 0], [-1, 0, 1], [0, 1, 4], [0, -1, 5]];
const inside = (x, z) => x >= W.X0 && x < W.x1 && z >= W.Z0 && z < W.z1;
const rimCache = new Map();
function rimSample(x, z) {
  const key = x * 10000 + z;
  let height = rimCache.get(key);
  if (height === undefined) { height = Math.round(O.h(x, z) * 4) / 4; rimCache.set(key, height); }
  return height;
}
function boundaryH(x, z) {
  const ax = -1484 + Math.floor((x + 1484) / 8) * 8, az = -1196 + Math.floor((z + 1196) / 8) * 8;
  const ux = (x - ax) / 8, uz = (z - az) / 8;
  return AF.lerp(AF.lerp(rimSample(ax, az), rimSample(ax + 8, az), ux), AF.lerp(rimSample(ax, az + 8), rimSample(ax + 8, az + 8), ux), uz);
}
function cornerH(entry, col, row, across, along, height) {
  const step = entry.size / 64, ix = col + across, iz = row + along;
  return ix === 0 || ix === 64 || iz === 0 || iz === 64 ? boundaryH(entry.x + ix * step, entry.z + iz * step) : height;
}
function apron(buf, entry, col, row, height, color) {
  const step = entry.size / 64, xa = entry.x + col * step, za = entry.z + row * step;
  setP(xa, cornerH(entry, col, row, 0, 0, height), za, xa, cornerH(entry, col, row, 0, 1, height), za + step, xa + step, cornerH(entry, col, row, 1, 1, height), za + step, xa + step, cornerH(entry, col, row, 1, 0, height), za);
  setUV(xa * 4, za * 4, xa * 4, (za + step) * 4, (xa + step) * 4, (za + step) * 4, (xa + step) * 4, za * 4);
  buf.quadS(quadP, quadUV, 0, 1, 2, 3, color, 2, 3, 3, 3, 3);
}
function wall(buf, xa, za, xb, zb, lowA, lowB, highA, highB, color, normal, soft) {
  if (highA <= lowA && highB <= lowB) return;
  setP(xa, Math.min(lowA, highA), za, xb, Math.min(lowB, highB), zb, xb, highB, zb, xa, highA, za);
  const ua = (normal < 2 ? za : xa) * 4, ub = (normal < 2 ? zb : xb) * 4;
  setUV(ua, lowA * 4, ub, lowB * 4, ub, highB * 4, ua, highA * 4);
  const reverse = normal === 0 || normal === 5;
  buf.quadS(quadP, quadUV, 0, reverse ? 3 : 1, 2, reverse ? 1 : 3, color, normal + (soft ? 32 : 0), 3, 3, 3, 3);
}
function node(x, z, level, parent) {
  const size = 32 * 2 ** level;
  const entry = { x, z, level, size, parent, children: null, meshes: [], ins: [], outs: [], rim: new Float32Array(260), ready: false, split: false, busy: false, fadeE: null, used: stamp, bytes: 0, queued: false, dirty: false };
  entry.finish = () => { entry.busy = false; };
  nodes.push(entry); return entry;
}
function distance(entry, x, y, z) {
  return Math.hypot(Math.max(entry.x - x, 0, x - entry.x - entry.size), Math.max(entry.z - z, 0, z - entry.z - entry.size), Math.max(0, y - O.h(AF.clamp(x, entry.x, entry.x + entry.size), AF.clamp(z, entry.z, entry.z + entry.size)) - 25) * 0.65);
}
function emit(buf, xa, za, xb, zb, lo, hi, color, normal, soft = false) {
  if (normal === 2) {
    setP(xa, hi, za, xa, hi, zb, xb, hi, zb, xb, hi, za);
    setUV(xa * 4, za * 4, xa * 4, zb * 4, xb * 4, zb * 4, xb * 4, za * 4);
    buf.quadS(quadP, quadUV, 0, 1, 2, 3, color, 2, 3, 3, 3, 3); return;
  }
  if (hi <= lo) return;
  if (normal < 2) {
    setP(xa, lo, za, xa, lo, zb, xa, hi, zb, xa, hi, za);
    setUV(za * 4, lo * 4, zb * 4, lo * 4, zb * 4, hi * 4, za * 4, hi * 4);
  } else {
    setP(xa, lo, za, xb, lo, za, xb, hi, za, xa, hi, za);
    setUV(xa * 4, lo * 4, xb * 4, lo * 4, xb * 4, hi * 4, xa * 4, hi * 4);
  }
  const reverse = normal === 0 || normal === 5;
  buf.quadS(quadP, quadUV, 0, reverse ? 3 : 1, 2, reverse ? 1 : 3, color, normal + (soft ? 32 : 0), 3, 3, 3, 3);
}
function* build(entry) {
  const step = entry.size / 64, quantum = step <= 1 ? step * 0.5 : step * 0.75, buf = terrainBuf, revision = entry.propRevision ?? 0;
  buf.n = 0; colors.fill(0); used.fill(0);
  for (let index = 0; index <= 64; index++) {
    entry.rim[index] = boundaryH(entry.x, entry.z + index * step); entry.rim[65 + index] = boundaryH(entry.x + entry.size, entry.z + index * step);
    entry.rim[130 + index] = boundaryH(entry.x + index * step, entry.z); entry.rim[195 + index] = boundaryH(entry.x + index * step, entry.z + entry.size);
    if ((index & 7) === 7) yield;
  }
  for (let row = -1; row <= 64; row++) {
    for (let col = -1; col <= 64; col++) {
      const x = entry.x + (col + 0.5) * step, z = entry.z + (row + 0.5) * step, offset = (row + 1) * 66 + col + 1;
      heights[offset] = Math.round(O.h(x, z) / quantum) * quantum * 4;
    }
    yield;
  }
  for (let row = 0; row < 64; row++) { for (let col = 0; col < 64; col++) {
    const x = entry.x + (col + 0.5) * step, z = entry.z + (row + 0.5) * step, offset = (row + 1) * 66 + col + 1;
    if (!inside(x, z) && heights[offset] > -6) colors[row * 64 + col] = O.colTop(x, z, heights[offset] * 0.25, (Math.abs(heights[offset + 1] - heights[offset - 1]) + Math.abs(heights[offset + 66] - heights[offset - 66])) / (8 * step), step);
  } yield; }
  for (let row = 0; row < 64; row++) {
    const za = entry.z + row * step, zb = za + step;
    for (let col = 0; col < 64;) {
      const color = colors[row * 64 + col], offset = (row + 1) * 66 + col + 1, height = heights[offset] * 0.25;
      if (!color || used[row * 64 + col]) { col++; continue; }
      if (!row || row === 63 || !col || col === 63) { apron(buf, entry, col, row, height, color); col++; continue; }
      let run = 1;
      while (col + run < 63 && !used[row * 64 + col + run] && colors[row * 64 + col + run] === color && heights[offset + run] === heights[offset]) run++;
      let depth = 1, match = true;
      while (row + depth < 63 && match) {
        for (let along = 0; along < run; along++) if (used[(row + depth) * 64 + col + along] || colors[(row + depth) * 64 + col + along] !== color || heights[offset + depth * 66 + along] !== heights[offset]) { match = false; break; }
        if (match) depth++;
      }
      for (let across = 0; across < depth; across++) used.fill(1, (row + across) * 64 + col, (row + across) * 64 + col + run);
      const xa = entry.x + col * step;
      emit(buf, xa, za, xa + run * step, za + depth * step, height, height, color, 2);
      col += run;
    }
    for (let col = 0; col < 64; col++) {
      const color = colors[row * 64 + col]; if (!color) continue;
      const xa = entry.x + col * step, xb = xa + step, offset = (row + 1) * 66 + col + 1, height = heights[offset] * 0.25;
      for (const direction of directions) {
        const dx = direction[0], dz = direction[1], normal = direction[2], nextX = xa + step * (0.5 + dx), nextZ = za + step * (0.5 + dz);
        const grid = inside(nextX, nextZ), boundary = col + dx < 0 || col + dx >= 64 || row + dz < 0 || row + dz >= 64;
        const fx = dx > 0 ? xb : xa, fz = dz > 0 ? zb : za;
        if (grid) {
          // The city emits no outer faces; both height directions belong to this wall.
          for (let along = 0; along < step; along += 0.25) {
            const gx = dx ? fx + dx * 0.125 : xa + along + 0.125, gz = dz ? fz + dz * 0.125 : za + along + 0.125;
            const gridHeight = W.groundY(gx, gz), n = gridHeight > height ? normal ^ 1 : normal;
            emit(buf, dx ? fx : xa + along, dz ? fz : za + along, dx ? fx : xa + along + 0.25, dz ? fz : za + along + 0.25, Math.min(height, gridHeight), Math.max(height, gridHeight), color, n);
          }
          continue;
        }
        if (boundary) continue;
        const neighbor = heights[offset + dx + dz * 66] * 0.25;
        if (neighbor < height) {
          const across = dx > 0 ? 1 : 0, along = dz > 0 ? 1 : 0;
          const highA = cornerH(entry, col, row, across, along, height), highB = cornerH(entry, col, row, dx ? across : 1, dz ? along : 1, height);
          const lowA = cornerH(entry, col + dx, row + dz, dx ? 1 - across : 0, dz ? 1 - along : 0, neighbor), lowB = cornerH(entry, col + dx, row + dz, dx ? 1 - across : 1, dz ? 1 - along : 1, neighbor);
          const gentle = height - neighbor <= step * 2;
          wall(buf, dx ? fx : xa, dz ? fz : za, dx ? fx : xb, dz ? fz : zb, lowA, lowB, highA, highB, gentle ? color : O.colSide(xa + step / 2, za + step / 2, height), normal, gentle);
        }
      }
    }
    yield;
  }
  let geo = buf.n ? yield* buf.geometryG(true) : null;
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
function update(entry, cp, inherited) {
  if (!entry.ready || entry.fadeE || entry.busy || inherited) return;
  const dist = distance(entry, cp.x, cp.y, cp.z), ahead = distance(entry, aheadX, cp.y, aheadZ);
  entry.used = stamp;
  const k = (AF.MOBILE || AF.GFX.tier === 'low' ? 0.38 : AF.GFX.lite ? 0.48 : 0.7) * (AF.lodScale || 1);
  const threshold = entry.level === 1 ? 40 : entry.size * k;
  const horizon = entry.x + entry.size < plan.play.x0 || entry.x > plan.play.x1 || entry.z + entry.size < plan.play.z0 || entry.z > 800;
  const refine = entry.level > 0 && !horizon && Math.min(dist, ahead + 24) < threshold * (entry.split ? 1.25 : 1);
  if (refine) {
    makeChildren(entry);
    let ready = true;
    for (const child of entry.children) { enqueue(child); if (!child.ready) ready = false; }
    if (!entry.split && ready) {
      const ins = entry.ins; ins.length = 0;
      for (const child of entry.children) listVisible(child, ins);
      entry.split = true; entry.busy = true; fade.swap(entry, entry.meshes, ins, entry.finish);
    }
    if (entry.split && !entry.busy) for (const child of entry.children) update(child, cp, false);
  } else if (entry.split && !frozen(entry)) {
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
function work(ms) {
  if (!AF.ready) return false;
  const start = performance.now(), end = start + Math.min(ms, AF.MOBILE ? 2.5 : 4);
  while (performance.now() < end) {
    if (!generator) {
      let best = -1, bestD = Infinity;
      const cp = AF.camera.position;
      for (let index = 0; index < queue.length; index++) {
        const entry = queue[index], dist = Math.min(distance(entry, cp.x, cp.y, cp.z), distance(entry, aheadX, cp.y, aheadZ) + 24);
        if (dist < bestD) { bestD = dist; best = index; }
      }
      if (best < 0) break;
      current = queue[best]; queue[best] = queue[queue.length - 1]; queue.pop();
      generator = build(current);
    }
    const slice = performance.now(), done = generator.next().done;
    R.maxStepMs = Math.max(R.maxStepMs, performance.now() - slice);
    if (done) { generator = null; current = null; }
  }
  R.workMs = performance.now() - start;
  return !!generator || queue.length > 0;
}
function scan() {
  const cp = AF.camera.position, reach = Math.max(1, (AF.lodScale || 1) ** 2); stamp++;
  R.maxNodes = Math.round(220 * reach); R.maxBytes = Math.min(AF.MOBILE ? 64 : 128, 48 * reach) * 1048576;
  for (const entry of nodes) if (entry.dirty && entry.ready && !entry.fadeE && !entry.busy) {
    let parent = entry.parent, blocked = false;
    while (parent) { if (parent.fadeE || parent.busy) { blocked = true; break; } parent = parent.parent; }
    if (!blocked) { entry.ready = false; enqueue(entry); }
  }
  for (const root of roots) update(root, cp, false);
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
AF.onIdle('outland-build', (ms) => work(Math.min(ms, AF.MOBILE ? 4 : 6)));
AF.onTick('outland-lod', 876, (dt) => {
  if (!AF.ready) return;
  const cp = AF.camera.position, dx = cp.x - lastX, dz = cp.z - lastZ, length = Math.hypot(dx, dz);
  const prediction = length < 40 && dt > 0 ? Math.min(1.5 / dt, 160 / Math.max(0.001, length)) : 0;
  aheadX = cp.x + dx * prediction; aheadZ = cp.z + dz * prediction; lastX = cp.x; lastZ = cp.z;
  scanT += dt; if (scanT >= 0.2) { scanT = 0; scan(); }
  work(1);
});
R.settle = () => {
  aheadX = AF.camera.position.x; aheadZ = AF.camera.position.z;
  for (let pass = 0; pass < 7; pass++) {
    scan(); while (work(20)); AF.step(22, 1 / 30);
  }
};
R.stats = () => {
  let visible = 0, triangles = 0;
  for (const mesh of group.children) if (mesh.visible) { visible++; triangles += mesh.geometry.index.count / 3; }
  return { nodes: nodes.length, resident: R.active, visible, triangles, bytes: R.bytes, bootMs: R.bootMs, maxStepMs: R.maxStepMs, builds: R.builds, disposed: R.disposed, pending: queue.length };
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
    for (let value = low; value <= high; value += Math.min(left.size, right.size) / 64) maxGap = Math.max(maxGap, Math.abs(sample(left, side, value) - sample(right, side ^ 1, value)));
    pairs++;
  }
  for (let x = plan.play.x0 + 20; x < plan.play.x1; x += 80) for (let z = plan.play.z0 + 20; z < plan.play.z1; z += 80) {
    if (inside(x, z) || O.h(x, z) < -1.25) continue;
    samples++; if (!cover.some(entry => x >= entry.x && x < entry.x + entry.size && z >= entry.z && z < entry.z + entry.size)) holes++;
  }
  return { overlaps, edgePairs: pairs, maxGap, holes, coverSamples: samples, speculativeSkirts: 0, rimSamples: rimCache.size };
};
O.addProp = (geo, x, y, z, rot = 0, opts = {}) => {
  if (!geo || !geo.attributes.aPal || !geo.index || !geo.attributes.position.array) throw new Error('outland props need retained voxel geometry');
  const prop = { geo, x, y, z, rot: ((rot % 4) + 4) % 4 }; O.props.push(prop);
  if (opts.collide !== false) {
    const box = geo.boundingBox || (geo.computeBoundingBox(), geo.boundingBox), transform = new THREE.Matrix4().makeRotationY(-prop.rot * Math.PI / 2);
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