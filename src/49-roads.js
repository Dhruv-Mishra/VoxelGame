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
    gravel: O.pal[12], trail: O.pal[44], conc: col(0xb9b3a6, { pat: 'slab' }), concD: col(0x8f8a80, { pat: 'stone' }),
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
const at = (frame, index, offset, lift) => [frame.x[index] + frame.nx[index] * offset, frame.y[index] + lift + frame.b[index] * offset, frame.z[index] + frame.nz[index] * offset];
// point at fraction t along segment (i-1, i), lateral offset o
const pt = (frame, i, t, o, lift) => { const a = at(frame, i - 1, o, lift), b = at(frame, i, o, lift); return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; };
// junction / city-edge trimming: a ribbon cell is clipped where it runs onto the city grid or onto an outranking road's ribbon
let clipRoad = null, clipFrame = null, clipI = 0;
const hidden = (t, o) => { const p = pt(clipFrame, clipI, t, o, 0); return W.col(p[0], p[2]) >= 0 || !!O.coverAt(p[0], p[2], clipRoad, p[1]); };
// a seam vertex takes the covering road's surface height, so the trimmed ribbon meets it without a step
const seam = (p, t, o) => { const q = pt(clipFrame, clipI, t, o, 0), other = W.col(q[0], q[2]) < 0 && O.coverAt(q[0], q[2], clipRoad, q[1]); if (other) p[1] = O.roadYOn(other, p[0], p[2]); return p; };
// where another ribbon attaches to this one's edge, its kerb skirt would show as a dark seam
const joined = (t, o) => { const p = pt(clipFrame, clipI, t, o, 0); return !!O.coverAt(p[0], p[2], clipRoad, p[1], true); };
const CORNERS = [[0, 0], [0, 0], [0, 0], [0, 0]], HID = [false, false, false, false];
// flat cell t0..t1 x o1..o2 of segment i; clipped: marching-squares on the corners, edge crossings found by bisection
function cell(buf, frame, i, t0, t1, o1, o2, lift, color, clip) {
  const c = CORNERS; c[0][0] = t0; c[0][1] = o1; c[1][0] = t1; c[1][1] = o1; c[2][0] = t1; c[2][1] = o2; c[3][0] = t0; c[3][1] = o2;
  let shown = 0;
  for (let k = 0; k < 4; k++) { HID[k] = clip && hidden(c[k][0], c[k][1]); if (!HID[k]) shown++; }
  if (!shown) { RD.stats.clipped++; return; }
  if (shown === 4) { quad(buf, pt(frame, i, t0, o1, lift), pt(frame, i, t1, o1, lift), pt(frame, i, t1, o2, lift), pt(frame, i, t0, o2, lift), color, 0, 1, 0); return; }
  const v = [];
  for (let k = 0; k < 4; k++) {
    const a = c[k], b = c[(k + 1) % 4];
    if (!HID[k]) v.push(pt(frame, i, a[0], a[1], lift));
    if (HID[k] !== HID[(k + 1) % 4]) {
      let lo = 0, hi = 1;
      for (let step = 0; step < 8; step++) { const m = (lo + hi) / 2; if (hidden(a[0] + (b[0] - a[0]) * m, a[1] + (b[1] - a[1]) * m) === HID[k]) lo = m; else hi = m; }
      const m = HID[k] ? hi : lo, inside = HID[k] ? lo : hi;
      v.push(seam(pt(frame, i, a[0] + (b[0] - a[0]) * m, a[1] + (b[1] - a[1]) * m, lift), a[0] + (b[0] - a[0]) * inside, a[1] + (b[1] - a[1]) * inside));
    }
  }
  quad(buf, v[0], v[1], v[2], v[3] || v[2], color, 0, 1, 0);
  for (let k = 4; k < v.length; k++) quad(buf, v[0], v[k - 1], v[k], v[k], color, 0, 1, 0);
}
// a strip between lateral offsets o1..o2 across segment (i-1, i), optionally only the part [t0, t1] along it
function strip(buf, frame, i, o1, o2, lift, color, t0 = 0, t1 = 1, clip = false) { cell(buf, frame, i, t0, t1, o1, o2, lift, color, clip); }
// vertical wall along the segment at lateral offset o, from lift y0 to y1, facing side (+1 = +normal); clipped kerb skirts also
// stop where another ribbon attaches outside them (longest shown run of 9 samples, ends refined by bisection)
const SHOWN = new Uint8Array(9);
function wall(buf, frame, i, o, y0, y1, color, side, clip = false) {
  let t0 = 0, t1 = 1;
  if (clip) {
    const show = (t) => !hidden(t, o) && !joined(t, o + side * 0.3);
    let best = -1, length = 0;
    for (let k = 0; k < 9; k++) SHOWN[k] = show(k / 8) ? 1 : 0;
    for (let k = 0; k < 9;) { if (!SHOWN[k]) { k++; continue; } let end = k; while (end < 9 && SHOWN[end]) end++; if (end - k > length) { length = end - k; best = k; } k = end; }
    if (best < 0) return;
    const refine = (inside, outside) => { let a = inside, b = outside; for (let step = 0; step < 7; step++) { const m = (a + b) / 2; if (show(m)) a = m; else b = m; } return a; };
    t0 = best > 0 ? refine(best / 8, (best - 1) / 8) : 0; t1 = best + length < 9 ? refine((best + length - 1) / 8, (best + length) / 8) : 1;
    if (t1 - t0 < 1e-3) return;
  }
  const nx = (frame.nx[i - 1] + frame.nx[i]) * side, nz = (frame.nz[i - 1] + frame.nz[i]) * side;
  quad(buf, pt(frame, i, t0, o, y0), pt(frame, i, t1, o, y0), pt(frame, i, t1, o, y1), pt(frame, i, t0, o, y1), color, nx, 0, nz);
}
function box(buf, cx, cz, y0, y1, hx, hz, color) {
  const c = [[cx - hx, cz - hz], [cx + hx, cz - hz], [cx + hx, cz + hz], [cx - hx, cz + hz]];
  for (let side = 0; side < 4; side++) {
    const p = c[side], q = c[(side + 1) % 4];
    quad(buf, [p[0], y0, p[1]], [q[0], y0, q[1]], [q[0], y1, q[1]], [p[0], y1, p[1]], color, (p[0] + q[0]) / 2 - cx, 0, (p[1] + q[1]) / 2 - cz);
  }
}
function frameOf(road, lift = 0) {
  const pts = road.points, n = pts.length, frame = { x: new Float64Array(n), z: new Float64Array(n), y: new Float64Array(n), nx: new Float64Array(n), nz: new Float64Array(n), s: new Float64Array(n), b: new Float64Array(n) };
  for (let index = 0; index < n; index++) {
    const before = pts[Math.max(0, index - 1)], after = pts[Math.min(n - 1, index + 1)], tx = after[0] - before[0], tz = after[1] - before[1], length = Math.hypot(tx, tz) || 1;
    frame.x[index] = pts[index][0]; frame.z[index] = pts[index][1]; frame.y[index] = road.heights[index] + lift; frame.nx[index] = -tz / length; frame.nz[index] = tx / length; frame.b[index] = road.bank ? road.bank[index] : 0;
    if (index) frame.s[index] = frame.s[index - 1] + Math.hypot(pts[index][0] - pts[index - 1][0], pts[index][1] - pts[index - 1][1]);
  }
  return frame;
}
function* buildAll() {
  const k = palette(), surf = new AF.GeoBuf(), struct = new AF.GeoBuf();
  RD.stats.clipped = RD.stats.pads = 0;
  for (let ri = 0; ri < P.roads.length; ri++) {
    const road = P.roads[ri];
    // junctions: a ribbon is trimmed where it runs onto an outranking road (O.coverAt) or the city grid; all ribbons share one
    // lift (road.lift) so trimmed pieces meet flush instead of overlapping at slightly different heights
    const frame = frameOf(road, road.lift ?? 0.05), n = road.points.length, hw = road.w / 2, flags = road.flags, asphalt = road.kind === 0, marked = asphalt && !road.driveway;
    clipRoad = road; clipFrame = frame;
    for (let i = 1; i < n; i++) {
      const flag = flags[i - 1] === flags[i] ? flags[i] : 0, bridge = flag === 1, tunnel = flag === 2;
      if (!asphalt && !bridge) continue;
      clipI = i;
      let clip = false;
      if (!bridge && !tunnel) for (let corner = 0; corner < 6 && !clip; corner++) clip = hidden(corner & 1, ((corner >> 1) - 1) * hw);
      else if (W.col(frame.x[i - 1], frame.z[i - 1]) >= 0 || W.col(frame.x[i], frame.z[i]) >= 0) continue;
      if (asphalt) {
        const base = k.asph[Math.floor(AF.hash2(i, road.w * 7 + n) * 4)];
        strip(surf, frame, i, -hw, -hw + 0.5, 0, k.gutter, 0, 1, clip); strip(surf, frame, i, hw - 0.5, hw, 0, k.gutter, 0, 1, clip);
        if (marked) {
          strip(surf, frame, i, -hw + 0.5, -hw + 0.65, 0, k.white, 0, 1, clip); strip(surf, frame, i, hw - 0.65, hw - 0.5, 0, k.white, 0, 1, clip);
          strip(surf, frame, i, -hw + 0.65, -0.12, 0, base, 0, 1, clip); strip(surf, frame, i, 0.12, hw - 0.65, 0, base, 0, 1, clip);
          const dash = Math.floor((frame.s[i - 1] + frame.s[i]) / 6) & 1;
          strip(surf, frame, i, -0.12, 0.12, 0, dash ? k.yellow : base, 0, 0.5, clip); strip(surf, frame, i, -0.12, 0.12, 0, dash ? base : k.yellow, 0.5, 1, clip);
        } else strip(surf, frame, i, -hw + 0.5, hw - 0.5, 0, base, 0, 1, clip);
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
        // abutments: the deck box is closed where it meets the embankment (wall down to the ground, parapet end caps)
        for (const [end, dir] of [[i - 1, -1], [i, 1]]) {
          if (flags[end + dir] === 1) continue;
          const tx = -frame.nz[end] * dir, tz = frame.nx[end] * dir, low = Math.min(O.h(frame.x[end], frame.z[end]), frame.y[end] - 1.3) - 0.6 - frame.y[end];
          const p = (o, h) => at(frame, end, o, h);
          quad(struct, p(-hw - 0.3, low), p(hw + 0.3, low), p(hw + 0.3, -0.03), p(-hw - 0.3, -0.03), k.concD, tx, 0, tz);
          for (const side of [-1, 1]) quad(struct, p(side * hw, 0), p(side * (hw + 0.3), 0), p(side * (hw + 0.3), 0.95), p(side * hw, 0.95), k.conc, -tx, 0, -tz);
        }
        if (flags[i - 2] !== 1) RD.stats.bridges++;
      } else if (tunnel) {
        const wx = hw + 0.4, CUT = hw + 2.2;
        wall(struct, frame, i, -wx, -0.2, TH, k.tile, 1); wall(struct, frame, i, wx, -0.2, TH, k.tile, -1);
        const r0 = at(frame, i - 1, -wx, TH), r1 = at(frame, i, -wx, TH), q0 = at(frame, i - 1, wx, TH), q1 = at(frame, i, wx, TH);
        quad(struct, r0, r1, q1, q0, k.concD, 0, -1, 0);
        // the trench over the gallery is refilled to the mountain's own surface (07 cuts a slot hw + 1.6 wide): terrain-coloured
        // top, rock sides, so the road runs inside the hill instead of under a thin lid
        const lm = (frame.x[i - 1] + frame.x[i]) / 2, zm = (frame.z[i - 1] + frame.z[i]) / 2, nx = frame.nx[i], nz = frame.nz[i];
        // portal vertices sit in the approach cut: their cover takes the inner neighbour's ground
        const ground = (index, side) => { const k = flags[index - 1] !== 2 ? index + 1 : flags[index + 1] !== 2 ? index - 1 : index; return Math.max(TH + 0.6, O.h(frame.x[k] + frame.nx[k] * side * (CUT + 0.6), frame.z[k] + frame.nz[k] * side * (CUT + 0.6)) + 0.05 - frame.y[index] - frame.b[index] * side * CUT); };
        const L0 = ground(i - 1, -1), L1 = ground(i, -1), R0 = ground(i - 1, 1), R1 = ground(i, 1);
        const topL = O.colTop(lm - nx * (CUT + 0.6), zm - nz * (CUT + 0.6), frame.y[i] + L1, 0.3, 1), topR = O.colTop(lm + nx * (CUT + 0.6), zm + nz * (CUT + 0.6), frame.y[i] + R1, 0.3, 1);
        const c0 = at(frame, i - 1, 0, (L0 + R0) / 2), c1 = at(frame, i, 0, (L1 + R1) / 2);
        quad(struct, at(frame, i - 1, -CUT, L0), at(frame, i, -CUT, L1), c1, c0, topL, 0, 1, 0); quad(struct, c0, c1, at(frame, i, CUT, R1), at(frame, i - 1, CUT, R0), topR, 0, 1, 0);
        const rock = O.colSide(lm, zm, frame.y[i] + TH + 8);
        quad(struct, at(frame, i - 1, -CUT, TH - 0.2), at(frame, i, -CUT, TH - 0.2), at(frame, i, -CUT, L1), at(frame, i - 1, -CUT, L0), rock, -nx, 0, -nz);
        quad(struct, at(frame, i - 1, CUT, TH - 0.2), at(frame, i, CUT, TH - 0.2), at(frame, i, CUT, R1), at(frame, i - 1, CUT, R0), rock, nx, 0, nz);
        if (i % 2 === 0) { const l0 = at(frame, i - 1, -0.4, TH - 0.06), l1 = at(frame, i, -0.4, TH - 0.06), m0 = at(frame, i - 1, 0.4, TH - 0.06), m1 = at(frame, i, 0.4, TH - 0.06), mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2, (p[2] + q[2]) / 2]; quad(struct, mid(l0, l1), l1, m1, mid(m0, m1), k.lamp, 0, -1, 0); }
        for (const [end, dir] of [[i - 1, -1], [i, 1]]) {
          if (flags[end + dir] === 2) continue;
          RD.stats.tunnels += dir < 0 ? 1 : 0;
          const tx = frame.nz[end] * dir, tz = -frame.nx[end] * dir, ox = frame.x[end] + tx * 0.6, oz = frame.z[end] + tz * 0.6, y = frame.y[end];
          const p = (o, h) => [ox + frame.nx[end] * o, y + h + frame.b[end] * o, oz + frame.nz[end] * o];
          quad(struct, p(-wx - 3, TH), p(wx + 3, TH), p(wx + 3, TH + 3.2), p(-wx - 3, TH + 3.2), k.conc, tx, 0, tz);
          quad(struct, p(-wx - 3, -0.4), p(-wx, -0.4), p(-wx, TH), p(-wx - 3, TH), k.conc, tx, 0, tz);
          quad(struct, p(wx, -0.4), p(wx + 3, -0.4), p(wx + 3, TH), p(wx, TH), k.conc, tx, 0, tz);
          quad(struct, p(-wx - 3, TH + 3.2), p(wx + 3, TH + 3.2), [p(wx + 3, 0)[0] - tx * 1.2, y + TH + 3.2, p(wx + 3, 0)[2] - tz * 1.2], [p(-wx - 3, 0)[0] - tx * 1.2, y + TH + 3.2, p(-wx - 3, 0)[2] - tz * 1.2], k.concD, 0, 1, 0);
          // rock face above the portal up to the refilled hill
          const left = end === i ? L1 : L0, right = end === i ? R1 : R0, q = (o, h) => [frame.x[end] + tx * 0.5 + frame.nx[end] * o, y + h + frame.b[end] * o, frame.z[end] + tz * 0.5 + frame.nz[end] * o];
          quad(struct, q(-CUT, TH + 3.2), q(CUT, TH + 3.2), q(CUT, Math.max(TH + 3.2, right)), q(-CUT, Math.max(TH + 3.2, left)), rock, tx, 0, tz);
        }
      }
      if (!bridge && !tunnel && asphalt) {
        let skirt = clip; for (let probe = 0; probe < 6 && !skirt; probe++) skirt = joined((probe % 3) / 2, (probe < 3 ? -1 : 1) * (hw + 0.3));
        wall(surf, frame, i, -hw, -0.7, 0, k.gutter, -1, skirt); wall(surf, frame, i, hw, -0.7, 0, k.gutter, 1, skirt);
      }
      else if (tunnel) { wall(surf, frame, i, -hw, -0.3, 0, k.gutter, -1); wall(surf, frame, i, hw, -0.3, 0, k.gutter, 1); }
      if (i % 24 === 0) yield;
    }
    yield;
  }
  // dead-end junctions (two or more asphalt roads ending at one point): a flat fan just under the ribbons fills the wedges
  // between their square ends; its rim follows the ribbons so it never shows through a sloping one
  const nodes = [];
  for (const road of P.roads) if (road.kind === 0 && !road.driveway) for (const index of [0, road.points.length - 1]) {
    const [x, z] = road.points[index]; if (W.col(x, z) >= 0) continue;
    let node = nodes.find((entry) => Math.hypot(entry.x - x, entry.z - z) < 1.5);
    if (!node) nodes.push(node = { x, z, y: road.heights[index] + (road.lift ?? 0.05), hw: 0, roads: 0 });
    node.hw = Math.max(node.hw, road.w / 2); node.roads++;
  }
  for (const node of nodes) {
    if (node.roads < 2) continue;
    const rim = [], count = 24, radius = node.hw + 0.1;
    for (let index = 0; index < count; index++) {
      const angle = index / count * Math.PI * 2, x = node.x + Math.cos(angle) * radius, z = node.z + Math.sin(angle) * radius, deck = O.deckY(x, z);
      rim.push([x, (deck > -Infinity ? deck : O.roadY(x, z)) - 0.11, z]);
    }
    const low = rim.map((point, index) => Math.min(point[1], rim[(index + 1) % count][1], rim[(index + count - 1) % count][1]));
    const centre = [node.x, node.y - 0.11, node.z];
    for (let index = 0; index < count; index++) {
      const a = rim[index], b = rim[(index + 1) % count];
      quad(surf, centre, [a[0], low[index], a[2]], [b[0], low[(index + 1) % count], b[2]], [b[0], low[(index + 1) % count], b[2]], k.asph[0], 0, 1, 0);
    }
    RD.stats.pads++;
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
  const outside = (road) => { let first = 0, last = road.points.length - 1; while (first < last && W.col(road.points[first][0], road.points[first][1]) >= 0) first++; while (last > first && W.col(road.points[last][0], road.points[last][1]) >= 0) last--; return [Math.min(first + 2, last), last]; };
  RD.routes = []; RD.routeRoads = [];
  for (const [name, count, radius] of [['Solace Ring Road', 4, 1e9], ['Eastwood Road', 4, 700], ['Coast Road', 3, 700], ['West Coast Drive', 2, 600], ['Eastwood Loop', 1, 450], ['Westmoor Link', 2, 600], ['Jungle Highway', 1, 500]]) {
    const road = P.roads.find((entry) => entry.name === name); if (!road || road.points.length < 4) continue;
    const [from, to] = outside(road); if (to - from < 4) continue;
    RD.routes.push(VV.addRoute(name + ' traffic', lanes(road, from, to, 2.6), { count, types, activeRadius: radius, yAt: (x, z) => O.roadYOn(road, x, z) })); RD.routeRoads.push(road);
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
  for (let index = 3; index < ring.points.length; index += 11) { const [x, z] = ring.points[index], y = AF.surfaceBelow(x, z, ring.heights[index] + 0.5, 4); worst = Math.max(worst, Math.abs(y - ring.heights[index] - ring.lift)); }
  const s = RD.stats;
  return { ok: s.ready && RD.meshes.length === 2 && s.bridges >= 2 && s.tunnels >= 1 && worst < 0.05 && s.quads + s.structQuads < 60000, info: JSON.stringify(s) + ', deck error ' + worst.toFixed(3) };
});
AF.test('roads: rural traffic stays sparse and on the road surface', () => {
  const routes = RD.routes || []; let cars = 0, worst = 0;
  routes.forEach((route, index) => { for (const car of route.cars) { cars++; worst = Math.max(worst, Math.abs(car.y - O.roadYOn(RD.routeRoads[index], car.x, car.z))); } });
  return { ok: routes.length >= 3 && cars >= 8 && cars <= 24 && worst < 0.6, info: routes.length + ' routes, ' + cars + ' cars, worst height error ' + worst.toFixed(2) };
});
} catch (e) { AF.partError('49-roads.js', e); }
