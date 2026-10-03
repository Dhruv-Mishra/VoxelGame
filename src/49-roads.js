// ================================================================ 49-roads.js
try {
// ===== 49-roads: smooth outland road ribbons in the city's own asphalt (markings, kerb skirts), bridges with parapets and piers,
//       tunnel galleries with portals and lamps, sparse rural traffic on the ring and hikers on the trails. Two merged meshes
//       (surface: receive only; structures: cast) built in idle slots; physics reads AF.outland.deckY (02 surfaceBelow).
const O = AF.outland, W = AF.W, P = AF.PLAN.world, TH = O.TUNNEL_H;
const RD = AF.outlandRoads = { stats: { ready: false, quads: 0, structQuads: 0, ms: 0, maxSliceMs: 0, bridges: 0, tunnels: 0 }, meshes: [] };
let K = null, generator = null;
function palette() {
  if (K) return K;
  const col = (hex, o) => AF.col(hex, Object.assign({ jitter: 0.25, edge: 0.3 }, o));
  K = {
    asph: [34, 35, 36, 37].map((index) => O.pal[index]), gutter: O.pal[38], yellow: O.pal[39], white: AF.col(0xdcd6c6, { jitter: 0.3, edge: 0.03 }),
    gravel: O.pal[12], trail: O.pal[44], cover: O.pal[1], conc: col(0xb9b3a6, { pat: 'slab' }), concD: col(0x8f8a80, { pat: 'stone' }),
    rail: col(0x8b9097, { metal: 0.6, rough: 0.45 }), plank: col(0x8a6a44, { pat: 'none', patTop: 'plank' }), tile: col(0xd8d2c2, { pat: 'tile' }),
    lamp: AF.col(0xfff1c9, { emit: 0xffd48a, emitK: 2.4, mode: 'always', jitter: 0, edge: 0 }),
  };
  return K;
}
// one quad, wound to face `hint`; UVs in 0.25 m block units like the city voxels (geometryG(true) scales by 0.25)
function quad(buf, a, b, c, d, color, hx, hy, hz) {
  const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
  if ((uy * vz - uz * vy) * hx + (uz * vx - ux * vz) * hy + (ux * vy - uy * vx) * hz < 0) { const t = b; b = d; d = t; }
  const ay = Math.abs(hy), ax = Math.abs(hx), az = Math.abs(hz), idx = ay >= ax && ay >= az ? (hy > 0 ? 2 : 3) : ax > az ? (hx > 0 ? 0 : 1) : (hz > 0 ? 4 : 5);
  const uv = (p) => idx < 2 ? [p[2] * 16, p[1] * 16] : idx < 4 ? [p[0] * 16, p[2] * 16] : [p[0] * 16, p[1] * 16];
  buf.quad(a, b, c, d, uv(a), uv(b), uv(c), uv(d), color, idx, [3, 3, 3, 3]);
}
const at = (frame, index, offset, lift) => [frame.x[index] + frame.nx[index] * offset, frame.y[index] + lift, frame.z[index] + frame.nz[index] * offset];
// a strip between lateral offsets o1..o2 across segment (i-1, i), optionally only the part [t0, t1] along it
function strip(buf, frame, i, o1, o2, lift, color, t0 = 0, t1 = 1) {
  const a0 = at(frame, i - 1, o1, lift), a1 = at(frame, i, o1, lift), b0 = at(frame, i - 1, o2, lift), b1 = at(frame, i, o2, lift);
  const mix = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t, p[2] + (q[2] - p[2]) * t];
  quad(buf, mix(a0, a1, t0), mix(a0, a1, t1), mix(b0, b1, t1), mix(b0, b1, t0), color, 0, 1, 0);
}
// vertical wall along the segment at lateral offset o, from lift y0 to y1, facing side (+1 = +normal)
function wall(buf, frame, i, o, y0, y1, color, side) {
  const nx = (frame.nx[i - 1] + frame.nx[i]) * side, nz = (frame.nz[i - 1] + frame.nz[i]) * side;
  quad(buf, at(frame, i - 1, o, y0), at(frame, i, o, y0), at(frame, i, o, y1), at(frame, i - 1, o, y1), color, nx, 0, nz);
}
function box(buf, cx, cz, y0, y1, hx, hz, color) {
  const c = [[cx - hx, cz - hz], [cx + hx, cz - hz], [cx + hx, cz + hz], [cx - hx, cz + hz]];
  for (let side = 0; side < 4; side++) {
    const p = c[side], q = c[(side + 1) % 4];
    quad(buf, [p[0], y0, p[1]], [q[0], y0, q[1]], [q[0], y1, q[1]], [p[0], y1, p[1]], color, (p[0] + q[0]) / 2 - cx, 0, (p[1] + q[1]) / 2 - cz);
  }
}
function frameOf(road, lift = 0) {
  const pts = road.points, n = pts.length, frame = { x: new Float64Array(n), z: new Float64Array(n), y: new Float64Array(n), nx: new Float64Array(n), nz: new Float64Array(n), s: new Float64Array(n) };
  for (let index = 0; index < n; index++) {
    const before = pts[Math.max(0, index - 1)], after = pts[Math.min(n - 1, index + 1)], tx = after[0] - before[0], tz = after[1] - before[1], length = Math.hypot(tx, tz) || 1;
    frame.x[index] = pts[index][0]; frame.z[index] = pts[index][1]; frame.y[index] = road.heights[index] + lift; frame.nx[index] = -tz / length; frame.nz[index] = tx / length;
    if (index) frame.s[index] = frame.s[index - 1] + Math.hypot(pts[index][0] - pts[index - 1][0], pts[index][1] - pts[index - 1][1]);
  }
  return frame;
}
function* buildAll() {
  const k = palette(), surf = new AF.GeoBuf(), struct = new AF.GeoBuf();
  for (let ri = 0; ri < P.roads.length; ri++) {
    const road = P.roads[ri];
    // junctions: the joining road stops under the one it forks from, and overlapping pieces sit at distinct heights (no coplanar faces)
    const frame = frameOf(road, road.ring ? 0.05 : road.driveway ? 0 : 0.02 * (1 + ri % 2)), n = road.points.length, hw = road.w / 2, flags = road.flags, asphalt = road.kind === 0, marked = asphalt && !road.driveway;
    for (let i = 1; i < n; i++) {
      if (W.col(frame.x[i - 1], frame.z[i - 1]) >= 0 || W.col(frame.x[i], frame.z[i]) >= 0) continue;
      if (!road.ring) { const info = O.otherRoad((frame.x[i - 1] + frame.x[i]) / 2, (frame.z[i - 1] + frame.z[i]) / 2, road); if (info && info.deck && info.flag === 0 && info.d < info.hw - 0.5 && info.road.kind === 0 && (info.road.ring || info.road.w > road.w || ri > P.roads.indexOf(info.road))) { RD.stats.joins = (RD.stats.joins || 0) + 1; continue; } }
      const flag = flags[i - 1] === flags[i] ? flags[i] : 0, bridge = flag === 1, tunnel = flag === 2;
      if (!asphalt && !bridge) continue;
      if (asphalt) {
        const base = k.asph[Math.floor(AF.hash2(i, road.w * 7 + n) * 4)];
        strip(surf, frame, i, -hw, -hw + 0.5, 0, k.gutter); strip(surf, frame, i, hw - 0.5, hw, 0, k.gutter);
        if (marked) {
          strip(surf, frame, i, -hw + 0.5, -hw + 0.65, 0, k.white); strip(surf, frame, i, hw - 0.65, hw - 0.5, 0, k.white);
          strip(surf, frame, i, -hw + 0.65, -0.12, 0, base); strip(surf, frame, i, 0.12, hw - 0.65, 0, base);
          const dash = Math.floor((frame.s[i - 1] + frame.s[i]) / 6) & 1;
          strip(surf, frame, i, -0.12, 0.12, 0, dash ? k.yellow : base, 0, 0.5); strip(surf, frame, i, -0.12, 0.12, 0, dash ? base : k.yellow, 0.5, 1);
        } else strip(surf, frame, i, -hw + 0.5, hw - 0.5, 0, base);
      } else strip(surf, frame, i, -hw, hw, 0, road.kind === 2 ? k.plank : k.gravel);
      if (bridge) {
        wall(struct, frame, i, -hw - 0.3, -1.3, 0.95, k.conc, -1); wall(struct, frame, i, hw + 0.3, -1.3, 0.95, k.conc, 1);
        wall(struct, frame, i, -hw, 0, 0.95, k.conc, 1); wall(struct, frame, i, hw, 0, 0.95, k.conc, -1);
        strip(struct, frame, i, -hw - 0.3, -hw, 0.95, k.concD); strip(struct, frame, i, hw, hw + 0.3, 0.95, k.concD);
        const a0 = at(frame, i - 1, -hw - 0.3, -1.3), a1 = at(frame, i, -hw - 0.3, -1.3), b0 = at(frame, i - 1, hw + 0.3, -1.3), b1 = at(frame, i, hw + 0.3, -1.3);
        quad(struct, a0, a1, b1, b0, k.concD, 0, -1, 0);
        if (i % 4 === 0) {
          const ground = O.h(frame.x[i], frame.z[i]);
          if (frame.y[i] - 1.3 - ground > 0.5) box(struct, frame.x[i], frame.z[i], Math.min(ground, O.waterY(frame.x[i], frame.z[i]) ?? ground) - 0.5, frame.y[i] - 1.3, road.kind === 2 ? 0.4 : 1.4, road.kind === 2 ? 0.4 : 1.4, k.concD);
        }
        if (flags[i - 2] !== 1) RD.stats.bridges++;
      } else if (tunnel) {
        const wx = hw + 0.4;
        wall(struct, frame, i, -wx, -0.2, TH, k.tile, 1); wall(struct, frame, i, wx, -0.2, TH, k.tile, -1);
        const r0 = at(frame, i - 1, -wx, TH), r1 = at(frame, i, -wx, TH), q0 = at(frame, i - 1, wx, TH), q1 = at(frame, i, wx, TH);
        quad(struct, r0, r1, q1, q0, k.concD, 0, -1, 0);
        strip(struct, frame, i, -wx - 1.2, wx + 1.2, TH + 0.6, k.cover);
        wall(struct, frame, i, -wx - 1.2, TH - 0.2, TH + 0.6, k.concD, -1); wall(struct, frame, i, wx + 1.2, TH - 0.2, TH + 0.6, k.concD, 1);
        if (i % 2 === 0) { const l0 = at(frame, i - 1, -0.4, TH - 0.06), l1 = at(frame, i, -0.4, TH - 0.06), m0 = at(frame, i - 1, 0.4, TH - 0.06), m1 = at(frame, i, 0.4, TH - 0.06), mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2, (p[2] + q[2]) / 2]; quad(struct, mid(l0, l1), l1, m1, mid(m0, m1), k.lamp, 0, -1, 0); }
        for (const [end, dir] of [[i - 1, -1], [i, 1]]) {
          if (flags[end + dir] === 2) continue;
          RD.stats.tunnels += dir < 0 ? 1 : 0;
          const tx = -frame.nz[end] * dir, tz = frame.nx[end] * dir, ox = frame.x[end] + tx * 0.6, oz = frame.z[end] + tz * 0.6, y = frame.y[end];
          const p = (o, h) => [ox + frame.nx[end] * o, y + h, oz + frame.nz[end] * o];
          quad(struct, p(-wx - 3, TH), p(wx + 3, TH), p(wx + 3, TH + 3.2), p(-wx - 3, TH + 3.2), k.conc, tx, 0, tz);
          quad(struct, p(-wx - 3, -0.4), p(-wx, -0.4), p(-wx, TH), p(-wx - 3, TH), k.conc, tx, 0, tz);
          quad(struct, p(wx, -0.4), p(wx + 3, -0.4), p(wx + 3, TH), p(wx, TH), k.conc, tx, 0, tz);
          quad(struct, p(-wx - 3, TH + 3.2), p(wx + 3, TH + 3.2), [p(wx + 3, 0)[0] - tx * 1.2, y + TH + 3.2, p(wx + 3, 0)[2] - tz * 1.2], [p(-wx - 3, 0)[0] - tx * 1.2, y + TH + 3.2, p(-wx - 3, 0)[2] - tz * 1.2], k.concD, 0, 1, 0);
        }
      }
      if (!bridge && !tunnel && asphalt) { wall(surf, frame, i, -hw, -0.7, 0, k.gutter, -1); wall(surf, frame, i, hw, -0.7, 0, k.gutter, 1); }
      else if (tunnel) { wall(surf, frame, i, -hw, -0.3, 0, k.gutter, -1); wall(surf, frame, i, hw, -0.3, 0, k.gutter, 1); }
      if (i % 48 === 0) yield;
    }
    yield;
  }
  RD.stats.quads = surf.n / 4; RD.stats.structQuads = struct.n / 4;
  for (const [buf, name, cast] of [[surf, 'outland-roads', false], [struct, 'outland-structures', true]]) {
    if (!buf.n) continue;
    const geo = yield* buf.geometryG(true), mesh = new THREE.Mesh(geo, AF.mat.voxel);
    mesh.name = name; mesh.userData.owner = name; mesh.castShadow = cast; mesh.receiveShadow = true; mesh.matrixAutoUpdate = false; mesh.updateMatrix();
    AF.scene.add(mesh); RD.meshes.push(mesh); if (AF.releaseStaticGeometry) AF.releaseStaticGeometry(geo);
    yield;
  }
  RD.stats.ready = true;
}
const work = RD.work = (ms) => {
  if (!AF.ready || RD.stats.ready) return false;
  const start = performance.now(), end = start + Math.min(ms, AF.MOBILE ? 2 : 3);
  if (!generator) generator = buildAll();
  while (performance.now() < end && !RD.stats.ready) { const slice = performance.now(); generator.next(); RD.stats.maxSliceMs = Math.max(RD.stats.maxSliceMs, performance.now() - slice); }
  RD.stats.ms += performance.now() - start; return !RD.stats.ready;
};
RD.settle = () => { while (work(8)); };
AF.onIdle('outland-roads', work);

// ---------------------------------------------------------------- rural traffic: two-way loops, sparse away from the city
function lanes(road, from, to, offset) {
  const frame = frameOf(road), points = [];
  for (let index = from; index <= to; index += 2) points.push([frame.x[index] + frame.nx[index] * offset, frame.z[index] + frame.nz[index] * offset]);
  for (let index = to; index >= from; index -= 2) points.push([frame.x[index] - frame.nx[index] * offset, frame.z[index] - frame.nz[index] * offset]);
  return points;
}
AF.onBuild('outland-traffic', 661, () => {
  const VV = AF.vehicles; if (!VV || !VV.addRoute) return;
  const types = ['sedan', 'pickup', 'coupe', 'wagon', 'stream', 'convertible'].filter((id) => VV.TYPES.some((type) => type.id === id));
  const yAt = (x, z) => O.roadY(x, z);
  const outside = (road) => { let first = 0, last = road.points.length - 1; while (first < last && W.col(road.points[first][0], road.points[first][1]) >= 0) first++; while (last > first && W.col(road.points[last][0], road.points[last][1]) >= 0) last--; return [Math.min(first + 2, last), last]; };
  RD.routes = [];
  for (const [name, count, radius] of [['Solace Ring Road', 4, 1e9], ['Eastwood Road', 4, 700], ['Coast Road', 3, 700], ['West Coast Drive', 2, 600], ['Eastwood Loop', 1, 450], ['Westmoor Link', 2, 600], ['Jungle Highway', 1, 500]]) {
    const road = P.roads.find((entry) => entry.name === name); if (!road || road.points.length < 4) continue;
    const [from, to] = outside(road); if (to - from < 4) continue;
    RD.routes.push(VV.addRoute(name + ' traffic', lanes(road, from, to, 2.6), { count, types, activeRadius: radius, yAt }));
  }
});
// ---------------------------------------------------------------- hikers on the trails (shared walker batches)
AF.onBuild('outland-hikers', 666, () => {
  if (!AF.walkers || !AF.walkers.addPath) return;
  RD.hikers = 0;
  for (const road of P.roads) {
    if (road.kind !== 2) continue;
    const path = [];
    for (let index = 0; index < road.points.length; index += 1) {
      const [x, z] = road.points[index], deck = road.flags[index] === 1;
      path.push([x, deck ? road.heights[index] + 0.25 : Math.ceil(Math.max(O.h(x - 0.35, z - 0.35), O.h(x + 0.35, z - 0.35), O.h(x - 0.35, z + 0.35), O.h(x + 0.35, z + 0.35)) * 4) / 4 + 0.25, z]);
    }
    AF.walkers.addPath(road.name + ' hikers', path, { count: 3, mode: 'pingpong', speed: 0.8, activeRadius: 160, luggage: 0 }); RD.hikers += 3;
  }
});
AF.test('roads: outland ribbons match the deck surface, bridges and tunnels are built', () => {
  RD.settle();
  const ring = P.roads.find((road) => road.ring); let worst = 0;
  for (let index = 3; index < ring.points.length; index += 11) { const [x, z] = ring.points[index], y = AF.surfaceBelow(x, z, ring.heights[index] + 0.5, 4); worst = Math.max(worst, Math.abs(y - ring.heights[index])); }
  const s = RD.stats;
  return { ok: s.ready && RD.meshes.length === 2 && s.bridges >= 2 && s.tunnels >= 1 && worst < 0.05 && s.quads + s.structQuads < 60000, info: JSON.stringify(s) + ', deck error ' + worst.toFixed(3) };
});
AF.test('roads: rural traffic stays sparse and on the road surface', () => {
  const routes = RD.routes || []; let cars = 0, worst = 0;
  for (const route of routes) for (const car of route.cars) { cars++; worst = Math.max(worst, Math.abs(car.y - O.roadY(car.x, car.z))); }
  return { ok: routes.length >= 3 && cars >= 8 && cars <= 24 && worst < 0.6, info: routes.length + ' routes, ' + cars + ' cars, worst height error ' + worst.toFixed(2) };
});
} catch (e) { AF.partError('49-roads.js', e); }
