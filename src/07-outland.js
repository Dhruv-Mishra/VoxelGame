// ================================================================ 07-outland.js
try {
// The whole part is one function: it runs here, and its source is shipped to the outland mesh workers (49-outland), which run it on
// a stub AF (AF.WORKER) and import the generated network with O.netImport, so both threads sample the very same height function.
function outlandScope(AF) {
const W = AF.W, P = AF.PLAN.world, smooth = AF.smooth, clamp = AF.clamp, noise = AF.noise2;
const O = AF.outland = { bounds: P.bounds, play: P.play, props: [], pads: [], edgeReady: false, rivers: [], wayside: [], TUNNEL_H: 6.5 };
const tiles = new Map(), edges = new Map(), segments = [], roadGrid = new Map(), riverSegs = [], riverGrid = new Map();
// 34-38 = the city street asphalt + gutter (same AF.col keys as 11-streets, so the outland roads share the city's surface), 39 centre line,
// 40 jungle floor, 41 forest floor, 42 river shingle, 43 river bed, 44 dirt trail, 45 meadow, 46 olive scrub, 47-49 island sand, 50 wet sand,
// 51 basalt, 52 crater scoria, 53 plaza paving
const hex = [AF.PAL.hex[AF.col('grass')], 0x5d8a37, 0x6f797c, 0xf5f8f9, 0xcabe9f, 0xa19b70, 0x85916b, 0x929078, 0x807363, 0x48573d, 0x4a4a4f, 0xe8dfb5, 0xada084, 0x948166, 0x536455,
  0x88a049, 0x7da646, 0x566467, 0x807e73, 0x414d51, 0x5e574c, 0xb9ae91, 0xd4c5a6, 0x557a34, 0x7a745e, 0x8b816b, 0x8e8862, 0x747e5c, 0x867c6b,
  0xc8ac72, 0xd9bf87, 0xb29668, 0xc9a64c, 0xb18e3c, 0x67625b, 0x625d56, 0x6c675f, 0x726c63, 0x46423d, 0xcfa640, 0x3f6a2c, 0x4b6b2e, 0x8a8270, 0x5a5a48, 0x9a8462, 0x7d8f4a, 0x6a7a3a,
  0xe3c98f, 0xd6b97c, 0xecd9a8, 0xb59767, 0x38322f, 0x7a4632, 0xd9cfb6,
  // 54 damp sand, 55 dark lava, 56 lush jungle floor, 57 mossy basalt, 58 red scoria
  0xc2a878, 0x2c2826, 0x3c6a2c, 0x56613f, 0x8e4a33,
  // Serena Isle ramps (all without a surface pattern, so the sloped isle mesher can blend them per vertex - 49-outland): 59 sandy tufts,
  // 60 dune grass, 61 scoria, 62 basalt, 63 volcanic soil, 64 light ash, 65 dark ash, 66 scrub soil, 67 light tropical grass, 68 mid
  // grass, 69 dark scoria, 70 light scoria, 71 dark basalt, 72 grey rock, 73 olive moss, 74-81 the lowland-to-jungle greens
  0xd0c088, 0xa9ad66, 0x8a4a34, 0x5a5049, 0x6d5a4b, 0x7d6a58, 0x5f514a, 0x6c6845, 0x9bb352, 0x6f9a3e,
  0x76442f, 0x9a5a3c, 0x4a4440, 0x6e675e, 0x5d6542, 0x88a049, 0x7da646, 0x5d8a37, 0x557a34, 0x3f6a2c, 0x37612a, 0x4b6b2e, 0x6a7a3a];
const GRASS = new Set([0, 1, 9, 15, 16, 23, 40, 41, 45, 46, 56]), ROCK = new Set([2, 8, 17, 18, 19, 20, 51, 52, 55, 57, 58]);
const ISLE_SAND = [49, 47, 48], ISLE_SCORIA = [70, 61, 69], ISLE_LAVA = [62, 71, 72], ISLE_LOWROCK = [72, 62, 73], ISLE_ASH = [64, 63, 65];
const ISLE_GREEN = [67, 74, 75, 68, 76, 77, 78, 79];
// palette indices the sloped isle mesher may blend across a cell (same material, no pattern: only the albedo interpolates)
const BLEND = new Uint8Array(hex.length); for (const index of [14, 47, 48, 49, 50, 54]) BLEND[index] = 1; for (let index = 59; index < hex.length; index++) BLEND[index] = 1;
const pal = O.pal = hex.map((value, index) => index >= 34 && index <= 38 ? AF.col(value, { jitter: 0.2, edge: 0.02, pat: 'asphalt' }) : index === 39 ? AF.col(value, { jitter: 0.35, edge: 0.03 })
  : index === 53 ? AF.col(value, { jitter: 0.3, edge: 0.1, pat: 'none', patTop: 'slab' })
  : AF.col(value, { jitter: index >= 59 ? 0.55 : 0.9, edge: 0, pat: ROCK.has(index) ? 'stone' : 'none', patTop: GRASS.has(index) ? 'grass' : ROCK.has(index) ? 'stone' : 'none' }));
const farmW = (x, z) => 1 - smooth(-700, -620, x + (noise(x * 0.004 + 3, z * 0.004 - 8) - 0.5) * 110);
O.jungle = (x, z) => smooth(175, 95, Math.hypot(x - 715, (z + 375) * 1.3) + (noise(x * 0.02 + 61, z * 0.02) - 0.5) * 60);
const waters = O.waters = [P.lake, { name: 'Mirror Lake', cx: 828, cz: -198, rx: 64, rz: 35, waterY: 13 }, { name: 'Westmoor Pond', cx: -1040, cz: -178, rx: 17, rz: 12, waterY: 8 }, { name: 'Mill Pond', cx: -912, cz: 92, rx: 23, rz: 14, waterY: 6 }];
function waterE(x, z, lake) { return Math.hypot((x - lake.cx) / lake.rx, (z - lake.cz) / lake.rz) + (noise(x * 0.045 + 2, z * 0.045) - 0.5) * 0.08; }
let fieldD = 0, fieldId = 0, fieldRow = 0, laneD = 0;
function farmAt(x, z) {
  const ux = x + z * 0.19 + (noise(x * 0.012, z * 0.012) - 0.5) * 15, uz = z - x * 0.12;
  const row = Math.floor(uz / 83), width = 65 + AF.hash2(row, 91) * 58, fx = (ux + AF.hash2(row, 7) * 80) / width;
  const phase = fx - Math.floor(fx), strip = uz - row * 83;
  fieldD = Math.min(phase * width, (1 - phase) * width, strip, 83 - strip);
  fieldId = AF.hash2(Math.floor(fx), row); fieldRow = Math.floor((ux * (fieldId > 0.5 ? 1 : 0.3) + uz * (fieldId > 0.5 ? 0.2 : 0.95)) / 2.5) & 1;
  laneD = Math.min(Math.abs(z + 64 + Math.sin(x * 0.008) * 17), Math.abs(x + 990 + Math.sin(z * 0.013) * 24));
}
function ridges(x, z) {
  let sum = 0, amplitude = 1, weight = 1;
  for (let octave = 0; octave < 3; octave++) {
    const ridge = 1 - Math.abs(noise(x, z) * 2 - 1), signal = ridge * ridge * weight;
    sum += signal * amplitude; weight = clamp(signal * 2.2, 0, 1); amplitude *= 0.48; x = x * 2.07 + 7.3; z = z * 2.07 - 9.1;
  }
  return sum / 1.71;
}
O.coastX = (z, east = false) => east ? 1090 + Math.sin(z * 0.012) * 16 + (noise(z * 0.022 + 19, 6) - 0.5) * 38 : -1285 + Math.sin(z * 0.009) * 18 + (noise(z * 0.016, 3) - 0.5) * 28;
O.dryWeight = (x, z) => smooth(610, 740, x + (noise(x * 0.015, z * 0.015 + 51) - 0.5) * 70) * smooth(-100, 5, z + (noise(x * 0.012 + 29, z * 0.012) - 0.5) * 60) * (1 - smooth(1060, 1140, x)) * (1 - smooth(240, 300, z));
// ---------------------------------------------------------------- SERENA ISLE (05-plan world.island), authored in its own frame
// (u = x - cx, v = z - cz): beaches south and west with low dunes behind them, rolling lowland, basalt cliffs on the east, a smooth
// volcano cone (soft gullies, a rounded rim lip, a bowl crater) with a crater-rim terrace, a lava terrace the spring stream falls over,
// rounded lava knolls, a reef offshore, Moretti's cove and the smugglers' lava tube. Everything here is smooth (no creases, no
// thresholded noise): 49-outland draws the isle as a sloped heightfield (meshSlopedG below), so the shape shows as it is.
const ISLE = P.island;
function islandE(x, z) {
  const u = x - ISLE.cx, v = z - ISLE.cz;
  return Math.hypot(u / ISLE.rx, v / ISLE.rz) + (noise(x * 0.018 + 20, z * 0.018) - 0.5) * 0.13 + (noise(x * 0.07 - 7, z * 0.07 + 3) - 0.5) * 0.012
    + Math.exp(-(((u + 55) / 42) ** 2 + ((v - 118) / 25) ** 2)) * 0.14      // the party beach bay
    - Math.exp(-(((u - 180) / 55) ** 2 + ((v - 60) / 22) ** 2)) * 0.15      // the east peninsula (Moretti's cove)
    - Math.exp(-(((u + 196) / 24) ** 2 + ((v - 10) / 28) ** 2)) * 0.05;     // Serena Point
}
const ISLE_BOX = { x0: ISLE.cx - ISLE.rx * 1.45, x1: ISLE.cx + ISLE.rx * 1.45, z0: ISLE.cz - ISLE.rz * 1.45, z1: ISLE.cz + ISLE.rz * 1.45 };
// open sea: past the city-edge blend and clear of both islands (O.h answers -4 before the pad loop)
const seaFar = (x, z) => {
  if (z <= W.z1 + 90) return false;
  if (x > ISLE_BOX.x0 && x < ISLE_BOX.x1 && z > ISLE_BOX.z0 && z < ISLE_BOX.z1) return false;
  const k = P.key; return !k || Math.abs(x - k.cx) > k.rx * 1.45 || Math.abs(z - k.cz) > k.rz * 1.45;
};
O.seaFar = seaFar;
function reefH(x, z) {
  const r = ISLE.reef; if (!r) return -4;
  const q = ((x - r.x) / r.rx) ** 2 + ((z - r.z) / r.rz) ** 2;
  return q < 1.8 ? Math.min(-1.8, Math.max(-4, -1.85 - q * 1.3 + (noise(x * 0.18, z * 0.18) - 0.5) * 0.5)) : -4;
}
// the cone's soft radial relief, -1 (a gully) .. +1 (a spur): a warped cosine, shared by the shape and the colours
const isleRib = (x, z, ang) => Math.cos(ang * 7 + (noise(x * 0.02 + 5, z * 0.02) - 0.5) * 3.2);
let ribLast = 2;   // the last isleRib colorIndex computed (2 = none): the sloped mesher's relief term reuses it
// the island before its cove, stream and tunnel (the stream levels and the tunnel floor are measured on this)
function isleShape(x, z) {
  const u = x - ISLE.cx, v = z - ISLE.cz, e = islandE(x, z);
  if (e > 1.18) return reefH(x, z);
  const th = Math.atan2(v / ISLE.rz, u / ISLE.rx);
  // east coast: a raised rim with sheer basalt cliffs (the runway's approach line, th -0.48, stays a beach)
  const cliff = smooth(-0.3, -0.12, th) * (1 - smooth(0.85, 1.05, th));
  let height = -4 + smooth(1.18, 0.82, e) * 9;
  const cone = ISLE.cone, cu = x - cone.x, cv = z - cone.z, distance = Math.hypot(cu, cv), t = Math.max(0, 1 - distance / cone.r), ang = Math.atan2(cv, cu);
  // low dunes behind the beaches, gently rolling lowland inland (both fade out on the cone, and on the hotel's beach front, where the
  // promenade boardwalk, cabanas and beach paths keep the old even slope)
  const R0 = ISLE.resort, calm = smooth(R0.r + 40, R0.r + 75, Math.hypot(x - R0.x, z - R0.z));
  const dune = smooth(0.85, 0.9, e) * (1 - smooth(0.93, 0.975, e)) * calm;
  if (dune > 0) height += dune * (0.35 + 0.75 * noise(x * 0.045 - 11, z * 0.06 + 4));
  const roll = smooth(0.86, 0.64, e) * smooth(cone.r * 0.5, cone.r * 1.05, distance) * calm;
  if (roll > 0) height += roll * (noise(x * 0.011 + 13, z * 0.011 - 41) - 0.5) * 3.2;
  if (cliff > 0) height = AF.lerp(height, -4 + smooth(1.05, 0.99, e) * (13 + (noise(x * 0.03, z * 0.03 + 9) - 0.5) * 5) - smooth(0.96, 0.78, e) * 4, cliff);
  if (t > 0) {
    // the flanks: soft radial gullies and spurs (a warped cosine, no creases), strongest half way up
    const flank = smooth(0.06, 0.32, t) * (1 - smooth(0.7, 0.86, t));
    height += t ** 1.3 * 50 * (1 + isleRib(x, z, ang) * 0.055 * flank);
  }
  // the rim: a rounded lip, then a smooth bowl down to the crater floor (its lake: 44-island)
  height += Math.exp(-(((distance - cone.craterR - 1.5) / 2.6) ** 2)) * 2.2;
  if (distance < cone.craterR + 1.5) { const s = smooth(5, cone.craterR + 1.5, distance); height = 39 + (height - 39) * s * s; }
  // the crater-rim trail: a level bench round the summit (steep toward the lip, a soft shoulder outward)
  const bench = distance - cone.craterR - 4;
  if (bench > -2.6 && bench < 6) height = AF.lerp(RIM_Y, height, bench < 0 ? smooth(1.5, 2.6, -bench) : smooth(1.4, 6, bench));
  // a basalt shelf on the south-west flank: the stream crosses it and falls over its lip
  const tm = Math.exp(-(((ang - 2.1) / 0.42) ** 2));
  if (tm > 0.01) { const w = tm * smooth(37, 46, distance) * smooth(68.5, 65.5, distance + (noise(x * 0.05, z * 0.05) - 0.5) * 2.4); if (w > 0) height = AF.lerp(height, 18.5 + (66 - distance) * 0.06, w); }
  // rounded lava knolls on the eastern hills, Serena Point and the upper flanks
  const tor = smooth(0.64, 0.88, noise(x * 0.04 + 31, z * 0.04 - 17));
  if (tor > 0) height += tor * tor * 6.5 * smooth(0.95, 0.85, e) * smooth(cone.craterR + 8, cone.craterR + 20, distance) * Math.max(smooth(60, 80, u), smooth(-160, -180, u), smooth(0.25, 0.4, t));
  height += Math.exp(-(((u + 196) / 18) ** 2 + ((v - 10) / 24) ** 2)) * 4;
  // the strip's cut and fill: the embankment widens with its depth (no raw cut faces into the cone's foot)
  const strip = ISLE.airstrip, stripD = Math.hypot(Math.max(strip.x0 - x, 0, x - strip.x1), Math.max(Math.abs(z - strip.z) - strip.w / 2, 0));
  height = AF.lerp(strip.y, height, smooth(0, 14 + Math.min(16, Math.abs(height - strip.y) * 2), stripD));
  const resort = ISLE.resort;
  height = AF.lerp(resort.y, height, smooth(resort.r, resort.r + 18, Math.hypot(x - resort.x, z - resort.z)));
  const landing = ISLE.landing;
  height = AF.lerp(landing.y, height, smooth(landing.r, landing.r + 10, Math.hypot(x - landing.x, z - landing.z)));
  return e > 1 ? Math.max(height, reefH(x, z)) : height;
}
const RIM_Y = (() => { const c = ISLE.cone, d = c.craterR + 4; return Math.round((5 + (1 - d / c.r) ** 1.3 * 50 + Math.exp(-((2.5 / 2.6) ** 2)) * 2.2) * 4) / 4; })();
// the cove: a ring of cliffs round a deep basin, a dog-leg channel to the sea, the cave ledge
const COVE = ISLE.cove;
function coveH(x, z, height) {
  const c = COVE; if (!c || Math.abs(x - c.x) > 75 || Math.abs(z - c.z) > 55) return height;
  const r = Math.hypot(x - c.x, z - c.z) + (noise(x * 0.09 + 2, z * 0.09) - 0.5) * 3;
  let cd = Infinity, ax = c.x, az = c.z;
  for (const [bx, bz] of c.channel) {
    const dx = bx - ax, dz = bz - az, t = clamp(((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz), 0, 1);
    cd = Math.min(cd, Math.hypot(x - ax - dx * t, z - az - dz * t)); ax = bx; az = bz;
  }
  const ring = smooth(c.r + 30, c.r + 6, r), rim = c.rim + (noise(x * 0.07 - 3, z * 0.07 + 8) - 0.5) * 4;
  if (ring > 0 && rim > height) height += (rim - height) * ring;
  const water = Math.min(r - c.r, cd + (noise(x * 0.1, z * 0.1 - 4) - 0.5) * 2 - c.channelHW);
  if (water < 1.6) height = AF.lerp(-3.6, height, smooth(-0.4, 1.6, water));
  const L = c.ledge; if (x >= L.x0 && x < L.x1 && z >= L.z0 && z < L.z1) height = L.y;
  return height;
}
// the stream: levels fall from the spring to the sea (a terrace lip makes the falls); its bed is carved like the mainland rivers
const ST = ISLE.stream ? (() => {
  const pts = catmull(ISLE.stream.pts, 3), levels = [];
  let level = Infinity;
  for (const [x, z] of pts) { level = Math.min(level, isleShape(x, z) - 0.9); levels.push(Math.max(level, -1.25)); }
  levels[levels.length - 1] = -1.25;
  // the falls: the steepest reach; a plunge pool at its foot
  let fi = 1, fd = 0; for (let i = 1; i < pts.length; i++) { const drop = (levels[i - 1] - levels[i]) / (Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]) || 1); if (drop > fd) { fd = drop; fi = i; } }
  const foot = Math.min(pts.length - 1, fi + 1), pool = { x: pts[foot][0], z: pts[foot][1], y: levels[foot], r: 3.2 };
  const segs = []; for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i], dx = b[0] - a[0], dz = b[1] - a[1]; segs.push({ x: a[0], z: a[1], dx, dz, len2: dx * dx + dz * dz || 1, y0: levels[i - 1], y1: levels[i] }); }
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity; for (const [x, z] of pts) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
  return { name: 'Serena Falls', pts, levels, hw: ISLE.stream.w / 2, segs, pool, lip: pts[fi - 1], box: [x0 - 12, z0 - 12, x1 + 12, z1 + 12] };
})() : null;
O.isleStream = ST;
let stD = Infinity, stY = 0;
function streamAt(x, z) {
  stD = Infinity; const s = ST; if (!s || x < s.box[0] || x > s.box[2] || z < s.box[1] || z > s.box[3]) return;
  let best = Infinity;
  for (const g of s.segs) {
    const t = clamp(((x - g.x) * g.dx + (z - g.z) * g.dz) / g.len2, 0, 1), dx = x - g.x - g.dx * t, dz = z - g.z - g.dz * t, d = dx * dx + dz * dz;
    if (d < best) { best = d; stY = g.y0 + (g.y1 - g.y0) * t; }
  }
  stD = Math.sqrt(best);
}
function streamCarve(x, z, height) {
  const P0 = ST.pool, pd = Math.hypot(x - P0.x, z - P0.z);
  if (pd < P0.r + 2) height = pd < P0.r ? Math.min(height, P0.y - 0.5 - 1.2 * (1 - (pd / P0.r) ** 2)) : Math.min(height, Math.max(P0.y + 0.3, AF.lerp(P0.y + 0.3, height, (pd - P0.r) / 2)));
  streamAt(x, z); if (stD > ST.hw + 9) return height;
  const hw = ST.hw;
  if (stD < hw) return Math.min(height, stY - 0.5 - 0.9 * (1 - (stD / hw) ** 2));
  let out = Math.min(height, stY + 0.3 + (stD - hw) * Math.min(1.4, 0.45 + Math.max(0, height - stY) * 0.05));
  if (stD < hw + 2) out = Math.max(out, stY + 0.3);
  return out;
}
// ---- the smugglers' tunnel: centre-line, half-width / height swelling into chambers, a floor falling 0.5 m steps to the cove.
// tunnelAt(x,z) fills TN_ (s along, d across, hw, floor, ceil) and returns 0 outside the band, 1 inside it, 2 inside the hollow.
const TUN = ISLE.tunnel;
const TN = TUN ? (() => {
  const pts = TUN.pts, cs = [0];
  for (let i = 1; i < pts.length; i++) cs.push(cs[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity; for (const [x, z] of pts) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
  const L = cs[cs.length - 1], dir = [pts[0][0] - pts[1][0], pts[0][1] - pts[1][1]], dl = Math.hypot(dir[0], dir[1]);
  const out = [dir[0] / dl, dir[1] / dl], front = [pts[0][0] + out[0] * 3, pts[0][1] + out[1] * 3];
  const yE = Math.round(isleShape(front[0], front[1]) * 2) / 2, yX = TUN.exitY;
  // the cleft ramps from the mouth down to the hillside 8 m out
  const cleftSlope = clamp((yE - isleShape(pts[0][0] + out[0] * 8.5, pts[0][1] + out[1] * 8.5)) / 8, 0, 0.45);
  const chambers = TUN.chambers.map(([i, hw, h, len, flat]) => ({ s: cs[i], hw, h, len: len || 6, flat: !!flat }));
  return { pts, cs, L, yE, yX, out, cleftSlope, chambers, box: [x0 - 34, z0 - 34, x1 + 34, z1 + 34], MZ: 1.5, band: 1.25 };
})() : null;
const TN_ = { s: 0, d: 0, hw: 0, floor: 0, ceil: 0, end: false };
O.tunnelInfo = TN_;
function tunnelAt(x, z) {
  const T = TN; if (!T || x < T.box[0] || x > T.box[2] || z < T.box[1] || z > T.box[3]) return 0;
  let best = Infinity, bs = 0, before = false;
  for (let i = 1; i < T.pts.length; i++) {
    const a = T.pts[i - 1], b = T.pts[i], dx = b[0] - a[0], dz = b[1] - a[1], len2 = dx * dx + dz * dz, raw = ((x - a[0]) * dx + (z - a[1]) * dz) / len2, t = clamp(raw, 0, 1);
    const d = (x - a[0] - dx * t) ** 2 + (z - a[1] - dz * t) ** 2;
    if (d < best) { best = d; bs = T.cs[i - 1] + Math.sqrt(len2) * t; before = i === 1 && raw < 0 || i === T.pts.length - 1 && raw > 1; }
  }
  const d = Math.sqrt(best); if (d > 30) return 0;
  let hw = TUN.hw, h = TUN.h, fs = bs;
  // a chamber swells the tube over `len` metres either side; a flat one (the Moretti stash hall) levels its floor at its centre
  for (const c of T.chambers) { const k = Math.exp(-(((bs - c.s) / c.len) ** 2)); hw += (c.hw - TUN.hw) * k; h += (c.h - TUN.h) * k; if (c.flat) fs = AF.lerp(fs, c.s, clamp(k * 1.7, 0, 1)); }
  hw += (noise(x * 0.45 + 3, z * 0.45 - 5) - 0.5) * 0.9 * smooth(0, 3, bs) * smooth(T.L, T.L - 3, bs);
  const floor = Math.round(AF.lerp(T.yE, T.yX, fs / T.L) * 2) / 2;
  TN_.s = before ? (bs < 1 ? -d : T.L + d) : bs; TN_.d = before ? 0 : d; TN_.hw = hw; TN_.floor = floor;
  TN_.ceil = floor + Math.round((h + (noise(x * 0.5 + 9, z * 0.5) - 0.5) * 0.8) * 2) / 2; TN_.end = before;
  return !before && d < hw ? 2 : 1;
}
O.tunnelAt = tunnelAt; O.tunnel = TN;
// the island's surface over the tunnel (a lava ridge keeps the tube buried; a walled cleft leads to its mouth), then the hollow
let cutOn = true;
function isleH(x, z) {
  let height = isleShape(x, z);
  height = coveH(x, z, height);
  if (ST) height = streamCarve(x, z, height);
  const k = tunnelAt(x, z); if (!k) return height;
  const T = TN, s = TN_.s;
  if (!TN_.end) {
    // a smooth lava ridge keeps the tube buried (the floor's 0.5 m steps and the roof's noise stay inside the rock): the roof line
    // without its rounding or noise, never less than 2 m of rock over the real roof
    let hw = TUN.hw, h = TUN.h, fs = s;
    for (const c of T.chambers) { const k = Math.exp(-(((s - c.s) / (c.len || 6)) ** 2)); hw += (c.hw - TUN.hw) * k; h += (c.h - TUN.h) * k; if (c.flat) fs = AF.lerp(fs, c.s, clamp(k * 1.7, 0, 1)); }
    const top = Math.max(TN_.ceil + 2, AF.lerp(T.yE, T.yX, fs / T.L) + h + 3 + noise(x * 0.06, z * 0.06 + 2) * 1.2);
    const ridge = top - Math.max(0, TN_.d - hw - 2.5) * 0.75, m = clamp(0.5 + 0.5 * (ridge - height) / 2, 0, 1);
    height = AF.lerp(height, ridge, m) + 2 * m * (1 - m);   // a soft max: the ridge's foot rounds into the hillside
  } else if (s < 0 && s > -7.5) {
    // the cleft: a level floor between rock arms, open to the hillside below
    const across = Math.abs((x - T.pts[0][0]) * T.out[1] - (z - T.pts[0][1]) * T.out[0]), core = T.yE + s * T.cleftSlope;
    if (across < 2.2) height = core;
    else if (across < 6.5) height = Math.max(height, core + 3.8 + s * 0.2 - (across - 2.2) * 0.25);
  }
  if (k === 2 && cutOn) return TN_.floor;
  return height;
}
// the surface the island is drawn with: the tube stays covered (44-island's model draws its mouths, floor and roof)
O.hNat = (x, z) => { cutOn = false; const h = O.h(x, z); cutOn = true; return h; };
// Corsair Key (05-plan world.key): a low island with one rounded hill, levelled at its airstrip
function keyE(x, z) {
  const k = P.key, dx = (x - k.cx) / k.rx, dz = (z - k.cz) / k.rz;
  return Math.hypot(dx, dz) + (noise(x * 0.02 + 40, z * 0.02 - 9) - 0.5) * 0.14 + Math.exp(-(((x - k.cx - 85) / 34) ** 2 + ((z - k.cz - 50) / 20) ** 2)) * 0.1;
}
function keyH(x, z) {
  const k = P.key; if (!k || Math.abs(x - k.cx) > k.rx * 1.4 || Math.abs(z - k.cz) > k.rz * 1.4) return -4;
  const radius = keyE(x, z); if (radius > 1.18) return -4;
  let height = -4 + smooth(1.18, 0.84, radius) * 7.5;
  const hill = k.hill, d = Math.hypot(x - hill.x, z - hill.z);
  height += Math.max(0, 1 - d / hill.r) ** 1.4 * hill.y + (noise(x * 0.05 + 3, z * 0.05) - 0.5) * 1.2 * smooth(0.95, 0.7, radius);
  const strip = k.airstrip, stripD = Math.hypot(Math.max(strip.x0 - x, 0, x - strip.x1), Math.max(Math.abs(z - strip.z) - strip.w / 2, 0));
  return AF.lerp(strip.y, height, smooth(0, 14, stripD));
}
function raw(x, z) {
  if (z > 300) {
    const key = keyH(x, z);
    if (x < ISLE_BOX.x0 || x > ISLE_BOX.x1 || z < ISLE_BOX.z0 || z > ISLE_BOX.z1) return key;
    return Math.max(isleH(x, z), key);
  }
  const coast = O.coastZ(x), westInland = x - O.coastX(z), eastInland = O.coastX(z, true) - x, inland = Math.min(coast - z, westInland, eastInland);
  if (inland < -32) return -4;
  // one continuous field: rolling hills east of Westmoor, gentle swells under the fields, blended along a noisy seam (no straight biome edges)
  const fw = farmW(x, z);
  const hills = 2 + noise(x * 0.009 + 7, z * 0.009) * 26 + noise(x * 0.021, z * 0.021) * 7 + (noise(x * 0.0045 + 40, z * 0.0045 - 3) - 0.45) * 14;
  const farm = 0.25 + smooth(-660, -1050, x) * (5 + noise(x * 0.006, z * 0.006) * 7 + noise(x * 0.02, z * 0.02) * 2) + smooth(-680, -860, x) * (noise(x * 0.0035 + 12, z * 0.0035 + 4) - 0.5) * 8;
  let height = fw <= 0 ? hills : fw >= 1 ? farm : AF.lerp(hills, farm, fw);
  if (z < -300) {
    const north = smooth(-300, -880, z), wx = x + (noise(x * 0.003 + 8, z * 0.003) - 0.5) * 95, wz = z + (noise(x * 0.003 - 17, z * 0.003 + 23) - 0.5) * 85;
    const ridge = ridges(wx * 0.006 + 14, wz * 0.006 - 12), spurs = ridges(wx * 0.017 - 2, wz * 0.011 + 5);
    height = AF.lerp(height, 26 + north * (62 + 140 * ridge) + spurs * 26 * smooth(-340, -650, z), smooth(-300, -420, z));
    const valley = Math.exp(-(((x + 40) / (105 + Math.max(0, -z - 300) * 0.09)) ** 4)) * (1 - smooth(-700, -850, z));
    height = AF.lerp(height, 0.25 + smooth(-300, -610, z) * 25, valley);
  } else if (fw > 0.5) {
    farmAt(x, z); height += (1 - smooth(0.6, 1.6, fieldD)) * 0.25;
    if (laneD < 3.5) height -= (1 - smooth(2, 3.5, laneD)) * 0.35;
  }
  if (x > 610 && z > -100) {
    const dry = O.dryWeight(x, z), mesa = smooth(0.57, 0.73, noise(x * 0.014 + 64, z * 0.014 - 12));
    height = AF.lerp(height, 9 + noise(x * 0.007 + 7, z * 0.007) * 7 + mesa * 7, dry);
  }
  for (const lake of waters) {
    if (Math.abs(x - lake.cx) > lake.rx * 1.4 || Math.abs(z - lake.cz) > lake.rz * 1.4) continue;
    const radius = waterE(x, z, lake);
    height = AF.lerp(lake.waterY - 3 + radius * 1.4, height, smooth(0.87, 1.3, radius));
    if (radius >= 1 && radius < 1.35) height = Math.max(height, lake.waterY + 0.3);
  }
  if (inland < 60) {
    // the shore curve steepens inland until it clears the land, so the coast never ends in a cliff
    const beach = x < -660, shore = -1.25 + inland * (beach ? 0.16 : 0.8) + Math.max(0, inland - 18) ** 2 * 0.03;
    height = Math.min(height, Math.max(-4, shore));
    if (beach && inland > 9) height += Math.sin(inland * 0.17) ** 2 * smooth(9, 20, inland) * (1 - smooth(28, 40, inland)) * 1.5;
  }
  if (z < -1350) height = AF.lerp(height, -4, smooth(-1350, -1708, z));
  return height;
}
O.coastZ = (x) => {
  if (x < W.X0 || x > W.x1) {
    const west = x < W.X0, distance = west ? W.X0 - x : x - W.x1;
    const anchor = west && AF.land?.BEACH ? AF.land.BEACH.shore(W.X0) : 210;
    return anchor + smooth(0, 105, distance) * (Math.sin(distance * 0.012) * 24 + Math.sin(distance * 0.031 + 0.7) * 12 + (noise(distance * 0.022, west ? 81 : 93) - 0.5) * 28);
  }
  return AF.land?.BEACH && x < -239 ? AF.land.BEACH.shore(x) : 210;
};
function edge(x, z) {
  const bx = clamp(W.bx(x), 0, W.NX - 1), bz = clamp(W.bz(z), 0, W.NZ - 1), key = bx * W.NZ + bz;
  if (O.edgeReady && edges.has(key)) return edges.get(key);
  const base = W.H[key] * 0.25;
  let sum = 0, count = 0;
  for (let offset = -1; offset <= 1; offset++) {
    const ax = clamp(bx + (bz === 0 || bz === W.NZ - 1 ? offset : 0), 0, W.NX - 1);
    const az = clamp(bz + (bx === 0 || bx === W.NX - 1 ? offset : 0), 0, W.NZ - 1);
    sum += W.H[ax * W.NZ + az] * 0.25; count++;
  }
  const height = clamp(sum / count, base - 0.25, base + 0.25);
  if (O.edgeReady) edges.set(key, height);
  return height;
}
// nearest road segment (any: decks, traffic) and the ground-bearing segment (t*: bridges excluded; where the cores of several roads
// overlap the lowest surface wins, so a junction never lifts the ground through a ribbon) through a 64 m bucket grid; c* = nearest
// bridge deck. Each road contributes only its own nearest segment (R* scratch), never a neighbouring vertex of itself.
let roadD = Infinity, roadY = 0, roadS = 0, roadKind = 0, roadHW = 5, roadFlag = 0, roadDeck = false, roadRef = null, roadLift = 0;
let tD = Infinity, tY = 0, tS = 0, tKind = 0, tHW = 5, tFlag = 0, cD = Infinity, cY = 0, cHW = 0;
const RN = 48, rRoad = new Array(RN), rD = new Float64Array(RN), rY = new Float64Array(RN), rS = new Float64Array(RN), rSeg = new Array(RN), rEnd = new Uint8Array(RN);
const key64 = (x, z) => Math.floor(x / 64) * 10000 + Math.floor(z / 64);
// ribbon height on a segment at (x,z): centreline profile plus the junction cross-fall (bank, per metre to the left of travel)
const segY = (s, along, x, z) => AF.lerp(s.y0, s.y1, along) + (s.b0 || s.b1 ? AF.lerp(s.b0, s.b1, along) * ((z - s.z) * s.dx - (x - s.x) * s.dz) / s.length : 0);
function roadAt(x, z, brute = false) {
  roadD = tD = cD = Infinity; let nearest = Infinity, bridge = Infinity, count = 0;
  const candidates = brute ? segments : roadGrid.get(key64(x, z));
  if (!candidates) return;
  for (const segment of candidates) {
    const along = clamp(((x - segment.x) * segment.dx + (z - segment.z) * segment.dz) / segment.len2, 0, 1);
    const dx = x - segment.x - segment.dx * along, dz = z - segment.z - segment.dz * along, distance = dx * dx + dz * dz;
    if (distance < nearest) { nearest = distance; roadY = segY(segment, along, x, z); roadS = segment.acc + segment.length * along; roadKind = segment.kind; roadHW = segment.hw; roadFlag = segment.flag; roadDeck = segment.deck; roadRef = segment.road; roadLift = segment.lift; }
    if (segment.flag === 1) { if (distance < bridge) { bridge = distance; cY = AF.lerp(segment.y0, segment.y1, along); cHW = segment.hw; } continue; }
    let slot = 0; while (slot < count && rRoad[slot] !== segment.road) slot++;
    if (slot === count) { if (count === RN) continue; rRoad[count] = segment.road; rD[count++] = Infinity; }
    if (distance < rD[slot]) { rD[slot] = distance; rY[slot] = segY(segment, along, x, z); rS[slot] = segment.acc + segment.length * along; rSeg[slot] = segment; }
  }
  let pick = -1, cover = Infinity, ground = Infinity;
  for (let slot = 0; slot < count; slot++) {
    const segment = rSeg[slot], core = segment.hw + (segment.kind === 0 ? 0.6 : 0.3), surface = rY[slot] - (segment.kind === 0 ? 0.2 : 0);
    if (rD[slot] < core * core) { if (surface < cover - 1e-9 || surface < cover + 1e-9 && rD[slot] < ground) { cover = surface; ground = rD[slot]; pick = slot; } }
    else if (cover === Infinity && rD[slot] < ground) { ground = rD[slot]; pick = slot; }
  }
  if (pick >= 0) { const segment = rSeg[pick]; tD = Math.sqrt(ground); tY = rY[pick]; tS = rS[pick]; tKind = segment.kind; tHW = segment.hw; tFlag = segment.flag; }
  for (let slot = 0; slot < count; slot++) rRoad[slot] = rSeg[slot] = null;
  roadD = Math.sqrt(nearest); cD = Math.sqrt(bridge);
}
// rivers: channel + banks carved into the terrain (after the city-edge blend), levels fall monotonically to the sea / the city falls
let rivD = Infinity, rivY = 0, rivHW = 0, riverReady = false;
function riverAt(x, z) {
  rivD = Infinity; if (!riverReady) return;
  const list = riverGrid.get(key64(x, z)); if (!list) return;
  let best = Infinity;
  for (const segment of list) {
    const along = clamp(((x - segment.x) * segment.dx + (z - segment.z) * segment.dz) / segment.len2, 0, 1);
    const dx = x - segment.x - segment.dx * along, dz = z - segment.z - segment.dz * along, distance = dx * dx + dz * dz;
    if (distance < best) { best = distance; rivY = AF.lerp(segment.y0, segment.y1, along); rivHW = segment.hw; }
  }
  rivD = Math.sqrt(best);
}
function carve(x, z, height) {
  riverAt(x, z); if (rivD === Infinity) return height;
  if (rivD < rivHW) return Math.min(height, rivY - 0.6 - 1.4 * (1 - (rivD / rivHW) ** 2));
  const slope = Math.min(1.6, 0.45 + Math.max(0, height - rivY) * 0.02);
  let out = Math.min(height, rivY + 0.35 + (rivD - rivHW) * slope);
  if (rivD < rivHW + 2.5) out = Math.max(out, rivY + 0.35);
  return out;
}
O.h = (x, z) => {
  if (W.col(x, z) >= 0) return W.H[W.col(x, z)] * 0.25;
  if (seaFar(x, z)) return -4;
  const distance = Math.hypot(Math.max(W.X0 - x, 0, x - W.x1), Math.max(W.Z0 - z, 0, z - W.z1));
  let height = raw(x, z);
  if (distance < 90) height = AF.lerp(edge(x, z), height, smooth(0, 90, distance));
  for (const pad of O.pads) {
    const margin = Math.max(Math.abs(x - pad.x) - pad.rx, Math.abs(z - pad.z) - pad.rz);
    if (margin < pad.bank) height = AF.lerp(pad.y, height, smooth(0, pad.bank, margin));
  }
  if (z <= 300) {
    if (riverReady) height = carve(x, z, height);
    roadAt(x, z);
    if (tD < tHW + 40) {
      // asphalt sits 0.2 m under its smooth ribbon (49-roads); cuts and fills widen with their depth, tunnels keep sheer walls
      const core = tHW + (tKind === 0 ? 0.6 : 0.3), outer = core + (tFlag === 2 ? 1 : Math.min(36, 2.5 + Math.abs(height - tY) * 0.9));
      if (tD < outer) height = AF.lerp(tY - (tKind === 0 ? 0.2 : 0), height, smooth(core, outer, tD));
    }
    // bridges only ever cut: banks and abutments never rise through a deck
    if (cD < cHW + 40) {
      const core = cHW + 0.6, outer = core + Math.min(36, 2.5 + Math.max(0, height - cY) * 0.9);
      if (cD < outer) height = Math.min(height, AF.lerp(cY - 0.2, height, smooth(core, outer, cD)));
    }
  }
  return height;
};
// LRU of 16 m tiles (2 KB each): 128 tiles (~180 m square) thrashed as soon as the wild herds within 260 m, the vehicles and the
// ambience all sampled the ground. A tile is only filled (1 024 heights, ~1 ms) once it has been asked for a few times; until then
// a miss samples just its own cell (the same point the tile would hold, so the answer is identical). On Serena Isle the columns keep
// that meaning (every caller's "ground + k" search windows stay valid); O.deckY lifts bodies onto the smooth surface drawn over them.
const TILE_CAP = AF.MOBILE ? 1024 : 2048, TILE_MISSES = 6, misses = new Map();
const cellB = (x, z) => Math.round(O.h(x, z) * 4);
O.hB = (bx, bz) => {
  const x = W.xOf(bx), z = W.zOf(bz), tx = Math.floor(x / 16), tz = Math.floor(z / 16), key = tx * 100000 + tz;
  const ix = clamp(Math.floor((x - tx * 16) * 2), 0, 31), iz = clamp(Math.floor((z - tz * 16) * 2), 0, 31);
  let tile = tiles.get(key);
  if (!tile) {
    const n = (misses.get(key) || 0) + 1;
    if (n < TILE_MISSES || !O.edgeReady) {
      if (O.edgeReady) { misses.set(key, n); if (misses.size > 8192) misses.clear(); }
      return cellB(tx * 16 + ix * 0.5 + 0.25, tz * 16 + iz * 0.5 + 0.25);
    }
    misses.delete(key);
    tile = new Int16Array(1024);
    for (let jx = 0; jx < 32; jx++) for (let jz = 0; jz < 32; jz++) tile[jx * 32 + jz] = cellB(tx * 16 + jx * 0.5 + 0.25, tz * 16 + jz * 0.5 + 0.25);
    tiles.set(key, tile); if (tiles.size > TILE_CAP) tiles.delete(tiles.keys().next().value);
  } else { tiles.delete(key); tiles.set(key, tile); }
  return tile[ix * 32 + iz];
};
O.groundY = (x, z) => O.hB(W.bx(x), W.bz(z)) * 0.25;
function colorIndex(x, z, height = O.h(x, z), slope = 0, step = 0.5) {
  if (z <= 300) {
    roadAt(x, z);
    if (tD < tHW + (tKind === 0 ? 0.6 : 0.25)) return tKind === 1 ? 12 : tKind === 2 ? 44 : tD > tHW - 0.5 ? 38 : 34 + (Math.floor(noise(x * 0.05, z * 0.05) * 4) & 3);
    riverAt(x, z); if (rivD < rivHW + 3.5 && height < rivY + 1.5) return rivD < rivHW ? 43 : 42;
  }
  const patch = noise(x * 0.035 + 11, z * 0.035 - 4), tone = patch < 0.38 ? 0 : patch < 0.66 ? 1 : 2;
  if (height < -1.25) return z > 300 && height > -2.6 ? 54 : 14;
  for (const pad of O.pads) if (pad.kind === 'hamlet' && Math.abs(x - pad.x) < pad.rx && Math.abs(z - pad.z) < pad.rz) {
    if (Math.abs(x - pad.x) < 2 || Math.abs(z - pad.z) < 2) return 12;
    return O.dryWeight(x, z) > 0.5 ? [29, 30, 31][tone] : patch < 0.55 ? 23 : 15;
  } else if (pad.face && Math.abs(x - pad.x) < pad.rx && Math.abs(z - pad.z) < pad.rz) return (x - pad.x) * pad.face[0] + (z - pad.z) * pad.face[1] > -1 ? 34 + (Math.floor(noise(x * 0.05, z * 0.05) * 4) & 3) : [23, 15, 45][tone];
  else if (pad.pave && Math.abs(x - pad.x) < pad.rx && Math.abs(z - pad.z) < pad.rz) return 53;
  if (z > 300) {
    // Corsair Key: asphalt strip, sand, a grassy hill with jungle patches
    const k = P.key;
    if (k && Math.abs(x - k.cx) < k.rx * 1.3 && Math.abs(z - k.cz) < k.rz * 1.3) {
      const ks = k.airstrip;
      if (x >= ks.x0 && x <= ks.x1 && Math.abs(z - ks.z) < ks.w / 2) return 34 + (Math.floor(noise(x * 0.05, z * 0.05) * 4) & 3);
      if (height < 0.4) return 50;
      if (keyE(x, z) > 0.86 || height < 2.1) return [47, 48, 49][tone];
      if (slope > 0.9) return [20, 51, 8][tone];
      return height > 8 ? [40, 1, 23][tone] : [16, 1, 15][tone];
    }
    // Serena Isle: asphalt strip, wet + damp sand at the waterline, warm beaches, lush lowland, jungle flanks, basalt cliffs and
    // tors, a scoria crater rim with its trail bench, the stream bed; the tube's open cells are drawn by its model (44-island)
    const isle = P.island, strip = isle.airstrip;
    ribLast = 2;
    if (x >= strip.x0 && x <= strip.x1 && Math.abs(z - strip.z) < strip.w / 2) return 34 + (Math.floor(noise(x * 0.05, z * 0.05) * 4) & 3);
    const tk = tunnelAt(x, z);
    if (tk && !TN_.end && step <= 0.5) { const m = TN_.s < TN.MZ || TN_.s > TN.L - TN.MZ; if (tk === 2 ? m || height <= TN_.ceil + 1 : m && TN_.d < TN_.hw + TN.band) return -1; }
    if (tk && TN_.end && TN_.s < 0 && TN_.s > -8) return [55, 51, 57][tone];
    const C = COVE;
    if (C && x >= C.ledge.x0 && x < C.ledge.x1 && z >= C.ledge.z0 && z < C.ledge.z1) return 51;
    if (C && height > 1.5 && slope > 0.9 && Math.hypot(x - C.x, z - C.z) < C.r + 7) return ISLE_LAVA[tone];
    if (ST) { streamAt(x, z); if (stD < ST.hw + 2.5 && height < stY + 1.2) return stD < ST.hw ? 43 : 42; }
    if (height < 0.25) return 50;
    // every band below steps into the next through a ramp of close tones (the sloped mesher blends them per vertex; a faint
    // per-cell dither keeps the seams organic where the terraced mesher draws them)
    const dz = step > 0.5 ? 0 : (AF.hash2(Math.floor(x * 2 + 1e-3) + 7919, Math.floor(z * 2 + 1e-3) - 104729) - 0.5) * 0.4, fine = noise(x * 0.06 + 3, z * 0.06 - 7), lowN = noise(x * 0.012 + 70, z * 0.012 - 30);
    if (height < 1.2 && fine * 0.6 + dz < 0.2 + (1.2 - height) * 0.7) return 54;
    // sand: the beach band and anything near the waterline; dune grass and sandy tufts between it and the lawns
    const sandK = height < 5.4 ? Math.max(smooth(3.1, 2.0, height), smooth(0.86, 0.935, islandE(x, z) + (fine - 0.5) * 0.05) * smooth(5.4, 3.8, height)) + dz * 0.3 : 0;
    if (sandK > 0.62) return ISLE_SAND[clamp(Math.floor((lowN * 0.7 + fine * 0.3) * 3.2 - 0.6), 0, 2)];
    if (sandK > 0.44) return 59;
    if (sandK > 0.28) return 60;
    const cone = isle.cone, cu = x - cone.x, cv = z - cone.z, d = Math.hypot(cu, cv);
    if (Math.abs(d - cone.craterR - 4) < 1.4 && Math.abs(height - RIM_Y) < 0.6) return 44;
    // the summit: red scoria round the rim and down into the bowl
    if (d < cone.craterR + 6.5 + fine * 3 + dz * 2) return ISLE_SCORIA[clamp(Math.floor(fine * 3.4 + dz - 0.2), 0, 2)];
    // steep ground is bare rock (mossy grey low down, basalt higher); the strip's grassed embankments stay green
    const stripD = Math.max(strip.x0 - x, 0, x - strip.x1, Math.abs(z - strip.z) - strip.w / 2);
    const rockK = smooth(0.85, 1.3, slope) - smooth(36, 18, stripD) * 0.6 + dz * 0.3;
    if (rockK > 0.55) return (height > 12 ? ISLE_LAVA : ISLE_LOWROCK)[clamp(Math.floor(lowN * 3), 0, 2)];
    // up the cone: jungle -> scrub -> volcanic soil and ash; spurs dry out first, gullies stay green longer
    const rib = d < cone.r ? (ribLast = isleRib(x, z, Math.atan2(cv, cu))) * smooth(cone.r, cone.r * 0.6, d) : 0;
    const up = smooth(20, 36, height + rib * 3 + (fine - 0.5) * 6) + dz * 0.4;
    if (up > 0.8) return ISLE_ASH[clamp(Math.floor((lowN * 0.6 + fine * 0.4) * 3.4 - 0.2), 0, 2)];
    if (up > 0.6) return up > 0.7 ? 66 : 73;
    if (up > 0.4) return up > 0.5 ? 81 : 80;
    // the greens: light grass on the open lowland, deeper toward the hills, jungle-dark in the gullies and lush hollows
    const lush = lowN * 0.6 + smooth(4, 20, height) * 0.32 - rib * 0.08 + (fine - 0.5) * 0.18 + dz * 0.25;
    return ISLE_GREEN[clamp(Math.floor((lush - 0.12) * 9), 0, ISLE_GREEN.length - 1)];
  }
  const inland = Math.min(O.coastZ(x) - z, x - O.coastX(z), O.coastX(z, true) - x);
  if (inland < 19) return x < -660 ? [21, 4, 22][tone] : [17, 2, 18][tone];
  if (x > 610 && z > -100 && patch < O.dryWeight(x, z)) return [29, 30, 31][tone];
  const zr = z + (noise(x * 0.011 + 5, z * 0.011) - 0.5) * 70;
  if (zr < -300) {
    const snowline = 185 + (noise(x * 0.017 - 9, z * 0.017) - 0.5) * 24;
    if (height > snowline && slope < 0.28 && patch > 0.45) return 3;
    if (slope > 0.62 && height > 70 || height > 150) return [17, 2, 18][(Math.floor(height / 12 + patch * 2) % 3 + 3) % 3];
    if (height > 72 && slope > 0.34) return tone === 0 ? 20 : tone === 1 ? 46 : 8;
    if (height > 78) return [15, 46, 23][tone];
    const jungle = O.jungle(x, z);
    if (jungle > patch * 0.6 + 0.2) return [40, 41, 1][tone];
    return patch < 0.4 + smooth(55, 110, height) * 0.35 ? [1, 23, 41][tone] : [15, 45, 16][tone];
  }
  if (slope > 0.85 && height > 4) return [20, 18, 8][tone];
  if (farmW(x, z) > 0.5) {
    farmAt(x, z);
    if (laneD < 2.3) return 12;
    if (fieldD < 1.6) return 9;
    return fieldId < 0.3 ? step > 1 ? 32 : fieldRow ? 32 : 33 : fieldId < 0.58 ? step > 1 ? 5 : fieldRow ? 5 : 26 : fieldId < 0.8 ? step > 1 ? 6 : fieldRow ? 6 : 27 : [15, 45, 16][tone];
  }
  const meadow = noise(x * 0.012 + 31, z * 0.012);
  return meadow > 0.6 ? [15, 45, 16][tone] : meadow > 0.42 ? [41, 46, 23][tone] : [24, 41, 25][tone];
}
O.colTop = (x, z, height, slope, step) => { const index = colorIndex(x, z, height, slope, step); return index < 0 ? 0 : pal[index]; };
O.colSide = (x, z, height = O.h(x, z)) => pal[height > 70 ? ((Math.floor(height / 12 + noise(x * 0.04, z * 0.04)) % 3 + 3) % 3 === 0 ? 19 : 20) : 8];
O.colorAt = (x, z) => hex[Math.max(0, colorIndex(x, z, O.hNat(x, z), 0, 1))];
O.biome = (x, z) => O.h(x, z) < -1.25 ? 'sea' : z > 300 ? 'island' : z < -300 ? Math.abs(x + 40) < 110 && z > -710 ? 'valley' : O.jungle(x, z) > 0.5 ? 'jungle' : 'range' : x < -660 ? 'farmland' : O.dryWeight(x, z) > 0.5 ? 'desert' : 'forest';
O.waterY = (x, z) => {
  for (const lake of waters) if (Math.abs(x - lake.cx) <= lake.rx * 1.08 && Math.abs(z - lake.cz) <= lake.rz * 1.08 && waterE(x, z, lake) <= 1.04) return lake.waterY;
  if (z <= 300) { riverAt(x, z); if (rivD < rivHW + 0.4) return rivY; }
  else if (ST) { streamAt(x, z); if (stD < ST.hw + 0.4) return stY; if (Math.hypot(x - ST.pool.x, z - ST.pool.z) < ST.pool.r) return ST.pool.y; }
  return O.h(x, z) < -1.25 ? -1.25 : null;
};
O.forestDensity = (x, z) => {
  if (z > 300 || O.h(x, z) < 3 || O.h(x, z) > 120 || x < -660 && z > -300) return 0;
  if (O.roadDistance(x, z) < 14 || O.waterY(x, z) !== null) return 0;
  return Math.min(0.95, smooth(0.25, 0.8, noise(x * 0.015 + 30, z * 0.015)) * (1 - smooth(78, 118, O.h(x, z))) * 0.85 * (1 - O.dryWeight(x, z)) + O.jungle(x, z) * 0.55);
};
// distance past a road's edge + 5 (so a 10 m lane keeps its old meaning; trails let the trees come close)
O.roadDistance = (x, z) => { roadAt(x, z); return roadD === Infinity ? Infinity : Math.min(roadD - roadHW, tD - tHW) + 5; };
// drivable top of the ribbons / bridge decks at (x,z) (-Infinity off them). With y: the highest top at or below y + 0.35 (a
// viaduct over a lane, or the lane under it); y above a tunnel roof stands on the roof. Without y: the nearest ribbon.
O.deckY = (x, z, y) => {
  if (z > 300) return isleTop(x, z, y);
  const list = roadGrid.get(key64(x, z)); if (!list) return -Infinity;
  let count = 0;
  for (const segment of list) {
    if (!segment.deck) continue;
    const along = clamp(((x - segment.x) * segment.dx + (z - segment.z) * segment.dz) / segment.len2, 0, 1), reach = segment.hw + 0.15;
    const distance = (x - segment.x - segment.dx * along) ** 2 + (z - segment.z - segment.dz * along) ** 2;
    if (distance > reach * reach) continue;
    let slot = 0; while (slot < count && rRoad[slot] !== segment.road) slot++;
    if (slot === count) { if (count === RN) continue; rRoad[count] = segment.road; rD[count++] = Infinity; }
    if (distance < rD[slot]) { rD[slot] = distance; rY[slot] = segY(segment, along, x, z) + segment.lift; rSeg[slot] = segment; rEnd[slot] = pastEnd(segment.road, x, z) ? 1 : 0; }
  }
  // ribbons end square: past a road's last vertex it only carries a car where nothing else does (junction pads)
  let best = -Infinity, near = Infinity;
  for (let pass = 0; pass < 2 && best === -Infinity; pass++) for (let slot = 0; slot < count; slot++) {
    if (rEnd[slot] !== pass) continue;
    let top = rY[slot], under = false;
    // a ribbon trimmed under an outranking one at the same level (49-roads junctions) is not a surface there
    for (let other = 0; other < count && !under; other++) under = other !== slot && !rEnd[other] && rRoad[slot].kind === 0 && rRoad[other].kind === 0 && rD[other] < (rSeg[other].hw - 0.02) ** 2 && outranks(rRoad[other], rRoad[slot]) && Math.abs(rY[other] - top) < 1.5;
    if (under) continue;
    if (y === undefined) { if (rD[slot] < near) { near = rD[slot]; best = top; } }
    else {
      if (rSeg[slot].flag === 2 && y > top + O.TUNNEL_H) top += O.TUNNEL_H + 0.6;
      if (top <= y + 0.35 && top > best) best = top;
    }
  }
  for (let slot = 0; slot < count; slot++) rRoad[slot] = rSeg[slot] = null;
  return best;
};
O.roadY = (x, z) => { roadAt(x, z); return roadD === Infinity ? O.h(x, z) : roadY + (roadDeck ? roadLift : 0); };
// ribbon top of one road (route cars keep to their own road where another passes under or over it)
O.roadYOn = (road, x, z) => {
  let best = Infinity, y = O.h(x, z);
  for (const segment of roadGrid.get(key64(x, z)) || []) {
    if (segment.road !== road) continue;
    const along = clamp(((x - segment.x) * segment.dx + (z - segment.z) * segment.dz) / segment.len2, 0, 1), distance = (x - segment.x - segment.dx * along) ** 2 + (z - segment.z - segment.dz * along) ** 2;
    if (distance < best) { best = distance; y = segY(segment, along, x, z) + (segment.deck ? segment.lift : 0); }
  }
  return y;
};
O.roadInfo = (x, z) => { roadAt(x, z); return { d: roadD, y: roadY, s: roadS, kind: roadKind, hw: roadHW, flag: roadFlag, deck: roadDeck, road: roadRef }; };
// nearest segment of any road other than `exclude`
O.otherRoad = (x, z, exclude) => {
  let best = Infinity, hit = null;
  for (const segment of roadGrid.get(key64(x, z)) || []) {
    if (segment.road === exclude) continue;
    const along = clamp(((x - segment.x) * segment.dx + (z - segment.z) * segment.dz) / segment.len2, 0, 1), distance = (x - segment.x - segment.dx * along) ** 2 + (z - segment.z - segment.dz * along) ** 2;
    if (distance < best) { best = distance; hit = segment; }
  }
  return hit ? { d: Math.sqrt(best), hw: hit.hw, road: hit.road, deck: hit.deck, flag: hit.flag } : null;
};
// junction trimming (49-roads): the asphalt road whose ribbon covers (x,z) and outranks `road` (ring > wider > listed first;
// driveways yield to everything; any = every other road), at the same level (+-1.5 m of y), or null. Ribbon ends are square.
const outranks = (other, road) => !other.driveway && (road.driveway || other.ring || !road.ring && (other.w > road.w || other.w === road.w && other.order < road.order));
O.coverAt = (x, z, road, y, any = false) => {
  for (const segment of roadGrid.get(key64(x, z)) || []) {
    const other = segment.road;
    if (other === road || other.kind !== 0 || !any && !outranks(other, road)) continue;
    const along = clamp(((x - segment.x) * segment.dx + (z - segment.z) * segment.dz) / segment.len2, 0, 1);
    const distance = (x - segment.x - segment.dx * along) ** 2 + (z - segment.z - segment.dz * along) ** 2;
    if (distance < (segment.hw - 0.02) ** 2 && Math.abs(AF.lerp(segment.y0, segment.y1, along) - y) < 1.5 && !pastEnd(other, x, z)) return other;
  }
  return null;
};
// beyond the square end of a road's first or last vertex (the drawn ribbon stops there; only tested near those ends)
function setEnds(road) {
  const p = road.points, n = p.length, a = Math.hypot(p[1][0] - p[0][0], p[1][1] - p[0][1]) || 1, b = Math.hypot(p[n - 1][0] - p[n - 2][0], p[n - 1][1] - p[n - 2][1]) || 1;
  road.ends = [p[0][0], p[0][1], (p[1][0] - p[0][0]) / a, (p[1][1] - p[0][1]) / a, p[n - 1][0], p[n - 1][1], (p[n - 1][0] - p[n - 2][0]) / b, (p[n - 1][1] - p[n - 2][1]) / b];
}
const pastEnd = (road, x, z) => {
  const e = road.ends, r = road.w + 2;
  return (x - e[0]) ** 2 + (z - e[1]) ** 2 < r * r && (x - e[0]) * e[2] + (z - e[1]) * e[3] < 0 || (x - e[4]) ** 2 + (z - e[5]) ** 2 < r * r && (x - e[4]) * e[6] + (z - e[5]) * e[7] > 0;
};
// outland mesher heights (49-outland): a quantised cell never rises through an asphalt ribbon or deck it overlaps at any LOD
O.meshH = (x, z, step) => {
  const quantum = step <= 1 ? step * 0.5 : step * 0.75, height = Math.round((z > 300 ? O.hNat(x, z) : O.h(x, z)) / quantum) * quantum;
  if (z > 300) return height;
  const reach = step * 0.71 + 0.35;
  let cap = Infinity;
  for (const segment of roadGrid.get(key64(x, z)) || []) {
    if (segment.kind !== 0 && segment.flag !== 1) continue;
    const along = clamp(((x - segment.x) * segment.dx + (z - segment.z) * segment.dz) / segment.len2, 0, 1), limit = segment.hw + reach;
    const distance = (x - segment.x - segment.dx * along) ** 2 + (z - segment.z - segment.dz * along) ** 2;
    if (distance < limit * limit) cap = Math.min(cap, segY(segment, along, x, z) - 0.1 - reach * (segment.grade + Math.max(Math.abs(segment.b0), Math.abs(segment.b1))));
  }
  return height > cap ? Math.floor(cap / quantum) * quantum : height;
};
// outland tile boundary profile (49-outland rimSample): tile edges interpolate an 8 m lattice of rim heights, so a lattice edge
// crossing a ribbon / deck (tunnels: their trench) must pass under it. Each crossing is carried by the node hidden under the road
// (lowering it is invisible); a node beside the road only takes the constraint when neither or both are under it. Per-node and
// local (neighbours enter with their natural height, an upper bound), so every tile still shares the same crack-free profile.
let capTunnel = false;
const ribbonCap = (x, z) => {
  let cap = Infinity; capTunnel = false;
  for (const segment of roadGrid.get(key64(x, z)) || []) {
    if (segment.kind !== 0 && segment.flag !== 1) continue;
    const along = clamp(((x - segment.x) * segment.dx + (z - segment.z) * segment.dz) / segment.len2, 0, 1), reach = segment.hw + (segment.flag === 2 ? 1.7 : 0.15);
    const distance = (x - segment.x - segment.dx * along) ** 2 + (z - segment.z - segment.dz * along) ** 2;
    if (distance < reach * reach) { const y = segY(segment, along, x, z) - 0.15; if (y < cap) { cap = y; capTunnel = segment.flag === 2; } }
  }
  return cap;
};
const RIM_DIRS = [[8, 0], [-8, 0], [0, 8], [0, -8]];
O.rimH = (x, z) => {
  const natural = Math.round((z > 300 ? O.hNat(x, z) : O.h(x, z)) * 4) / 4;
  if (z > 300 || !O.edgeReady) return natural;
  roadAt(x, z); if (roadD > 17) return natural;
  const own = ribbonCap(x, z), hidden = own < Infinity, depth = capTunnel ? 40 : 8;
  let value = Math.min(natural, own);
  for (const [dx, dz] of RIM_DIRS) {
    const mx = x + dx, mz = z + dz, other = Math.round(O.h(mx, mz) * 4) / 4, otherHidden = ribbonCap(mx, mz) < Infinity;
    for (let k = 1; k < 16; k++) {
      const t = k / 16; if (hidden === otherHidden ? t > 0.5 : !hidden) continue;
      const cap = ribbonCap(x + dx * t, z + dz * t);
      if (cap < Infinity) value = Math.min(value, Math.max(cap - depth, (cap - t * other) / (1 - t)));
    }
  }
  return value < natural ? Math.floor(value * 4) / 4 : natural;
};
O.riverInfo = (x, z) => { if (z > 300) { if (ST) streamAt(x, z); else stD = Infinity; return { d: stD, y: stY, hw: ST ? ST.hw : 0 }; } riverAt(x, z); return { d: rivD, y: rivY, hw: rivHW }; };
O.fieldEdge = (x, z) => { farmAt(x, z); return fieldD; };
O.fieldMeadow = (x, z) => { farmAt(x, z); return fieldId >= 0.8; };
O.fieldWheat = (x, z) => { farmAt(x, z); return x < -660 && z > -300 && z < O.coastZ(x) - 30 && fieldId < 0.3 && fieldD > 7 && laneD > 7; };
AF.test('outland: road grid matches brute force within sixteen metres', () => {
  let checked = 0, worst = 0;
  for (const segment of segments) for (let index = 0; index < 32; index++) {
    const along = AF.hash2(index, segment.x), side = (AF.hash2(index + 73, segment.z) * 2 - 1) * 20;
    const x = segment.x + segment.dx * along - segment.dz / segment.length * side, z = segment.z + segment.dz * along + segment.dx / segment.length * side;
    roadAt(x, z, true); const exact = roadD, height = roadY, kind = roadKind, stripe = roadS;
    roadAt(x, z);
    if (exact <= 16) { checked++; worst = Math.max(worst, Math.abs(exact - roadD), Math.abs(height - roadY), Math.abs(stripe - roadS), kind === roadKind ? 0 : 1); }
    else if (roadD < 16) worst = Infinity;
  }
  return { ok: checked > 500 && worst < 0.000001, info: checked + ' samples, worst error ' + worst };
});
AF.test('outland: dry scrub blends continuously into Eastwood', () => {
  let jump = 0;
  for (let x = 600; x < 1080; x += 2) for (let z = -100; z < 250; z += 10) jump = Math.max(jump, Math.abs(O.dryWeight(x, z) - O.dryWeight(x + 0.25, z)));
  return { ok: O.biome(940, 80) === 'desert' && O.biome(700, -150) === 'forest' && jump < 0.02, info: 'maximum blend step ' + jump };
});
AF.test('outland: roads stay dry off their bridges and keep bounded grades', () => {
  let water = 0, grade = 0, checked = 0, worst = '';
  for (const road of P.roads) for (let index = 1; index < road.points.length; index++) {
    const start = road.points[index - 1], end = road.points[index], length = Math.hypot(end[0] - start[0], end[1] - start[1]);
    if (W.col(start[0], start[1]) >= 0 || W.col(end[0], end[1]) >= 0) continue;
    const g = Math.abs(road.heights[index] - road.heights[index - 1]) / length / road.grade; if (g > grade) { grade = g; worst = road.name; }
    if (road.flags[index] || road.flags[index - 1]) continue;
    checked++; if (O.waterY((start[0] + end[0]) / 2, (start[1] + end[1]) / 2) !== null) water++;
  }
  return { ok: checked > 500 && !water && grade <= 1.02, info: checked + ' samples, wet ' + water + ', worst grade/limit ' + grade.toFixed(3) + ' (' + worst + ')' };
});
AF.test('outland: ring road loops the range with bridges, tunnels and wayside stops', () => {
  const ring = P.roads.find((road) => road.ring);
  let length = 0, bridges = 0, tunnels = 0, deckOk = true;
  for (let index = 1; index < ring.points.length; index++) length += Math.hypot(ring.points[index][0] - ring.points[index - 1][0], ring.points[index][1] - ring.points[index - 1][1]);
  for (let index = 1; index < ring.flags.length; index++) if (ring.flags[index] !== ring.flags[index - 1]) { if (ring.flags[index] === 1) bridges++; if (ring.flags[index] === 2) tunnels++; }
  for (let index = 0; index < ring.points.length; index += 7) { const [x, z] = ring.points[index], deck = O.deckY(x, z, ring.heights[index] + 0.5); if (Math.abs(deck - ring.heights[index] - ring.lift) > 0.02) deckOk = false; }
  return { ok: length > 2000 && bridges >= 2 && tunnels >= 1 && deckOk && O.wayside.length >= 6, info: Math.round(length) + ' m, ' + bridges + ' bridges, ' + tunnels + ' tunnels, ' + O.wayside.length + ' stops, deck ' + deckOk };
});
AF.test('outland: rivers run downhill to the sea or the Solace falls, bridged where roads cross', () => {
  let uphill = 0, dry = 0, unbridged = 0, ends = [];
  for (const river of O.rivers) {
    for (let index = 1; index < river.levels.length; index++) if (river.levels[index] > river.levels[index - 1] + 1e-6) uphill++;
    for (let index = 4; index < river.pts.length - 4; index += 9) { const [x, z] = river.pts[index]; if (W.col(x, z) < 0 && O.waterY(x, z) === null) dry++; }
    ends.push(river.levels[river.levels.length - 1].toFixed(1));
  }
  for (const segment of segments) if (segment.flag !== 1) { const x = segment.x + segment.dx / 2, z = segment.z + segment.dz / 2; riverAt(x, z); if (rivD < rivHW) unbridged++; }
  return { ok: O.rivers.length >= 3 && !uphill && !dry && !unbridged, info: O.rivers.length + ' rivers, ends ' + ends.join('/') + ', uphill ' + uphill + ', dry ' + dry + ', unbridged ' + unbridged };
});
AF.test('outland: south coast has coves and anchored city joins', () => {
  let lo = Infinity, hi = -Infinity;
  for (let distance = 80; distance < 550; distance += 10) { const value = O.coastZ(W.X0 - distance); lo = Math.min(lo, value); hi = Math.max(hi, value); }
  const west = Math.abs(O.coastZ(W.X0 - 0.01) - AF.land.BEACH.shore(W.X0)), east = Math.abs(O.coastZ(W.x1 + 0.01) - 210);
  return { ok: hi - lo > 35 && west < 0.01 && east < 0.01, info: 'coast range ' + (hi - lo).toFixed(1) + ', joins ' + west + '/' + east };
});
O.cacheStats = () => ({ tiles: tiles.size, bytes: tiles.size * 2048, edges: edges.size });
// ---------------------------------------------------------------- network generation (build 496): rivers, then road profiles, wayside stops
function catmull(ctrl, spacing) {
  const out = [];
  for (let index = 0; index < ctrl.length - 1; index++) {
    const p0 = ctrl[Math.max(0, index - 1)], p1 = ctrl[index], p2 = ctrl[index + 1], p3 = ctrl[Math.min(ctrl.length - 1, index + 2)];
    const steps = Math.max(1, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / spacing));
    for (let step = 0; step < steps; step++) {
      const t = step / steps, t2 = t * t, t3 = t2 * t, at = (axis) => 0.5 * (2 * p1[axis] + (p2[axis] - p0[axis]) * t + (2 * p0[axis] - 5 * p1[axis] + 4 * p2[axis] - p3[axis]) * t2 + (3 * p1[axis] - p0[axis] - 3 * p2[axis] + p3[axis]) * t3);
      out.push([at(0), at(1)]);
    }
  }
  out.push([ctrl[ctrl.length - 1][0], ctrl[ctrl.length - 1][1]]);
  return out;
}
const RIVERS = [
  { name: 'Upper Solace', w: 9, endY: AF.PLAN.river.headY, pts: [[318, -905], [340, -820], [372, -735], [392, -640], [402, -560], [396, -470], [390, -440], [388, -390], [386, -330], [AF.PLAN.river.x(-300), -300]] },
  { name: 'Tamsin River', w: 10, startY: P.lake.waterY, pts: [[-112, -648], [-150, -640], [-220, -625], [-330, -600], [-450, -575], [-570, -535], [-660, -490], [-705, -455], [-735, -380], [-745, -290], [-752, -200], [-748, -110], [-742, -30], [-748, 40], [-758, 110], [-752, 190], [-750, 300]] },
  { name: 'Ochre River', w: 8, startY: waters[1].waterY, pts: [[840, -170], [846, -150], [862, -110], [892, -50], [928, 10], [938, 70], [944, 130], [948, 200], [950, 310]] },
  // a mountain stream that cascades down the range into Lake Tamsin's north shore (49-outland draws its steep reach as falls)
  { name: 'Tamsin Falls', w: 6, endY: P.lake.waterY, pts: [[-28, -822], [-40, -804], [-31, -786], [-44, -766], [-36, -746], [-46, -726], [-42, -703]] },
];
function buildRivers() {
  riverReady = false; riverSegs.length = 0; riverGrid.clear(); O.rivers.length = 0;
  for (const spec of RIVERS) {
    const pts = catmull(spec.pts, 8), raw = [];
    let level = spec.startY ?? Infinity;
    for (const [x, z] of pts) {
      let lake = false; for (const entry of waters) if (waterE(x, z, entry) < 1.25) lake = true;
      if (!lake) level = Math.min(level, (W.col(x, z) >= 0 ? W.groundY(x, z) : O.h(x, z)) - 1.6);
      raw.push(Math.max(level, spec.endY ?? -1.25, -1.25));
    }
    if (spec.endY !== undefined) raw[raw.length - 1] = spec.endY;
    const levels = raw.map((value, index) => { let sum = 0, count = 0; for (let k = Math.max(0, index - 2); k <= Math.min(raw.length - 1, index + 2); k++) { sum += raw[k]; count++; } return sum / count; });
    for (let index = 1; index < levels.length; index++) levels[index] = Math.min(levels[index], levels[index - 1]);
    if (spec.endY !== undefined) levels[levels.length - 1] = Math.min(levels[levels.length - 2], spec.endY);
    const river = { name: spec.name, pts, levels, hw: spec.w / 2 }; O.rivers.push(river);
    for (let index = 1; index < pts.length; index++) {
      const a = pts[index - 1], b = pts[index], dx = b[0] - a[0], dz = b[1] - a[1], segment = { x: a[0], z: a[1], dx, dz, len2: dx * dx + dz * dz || 1, y0: levels[index - 1], y1: levels[index], hw: river.hw };
      riverSegs.push(segment); bucketRiver(segment);
    }
    const middle = pts[Math.floor(pts.length / 2)]; AF.addLabel(spec.name, middle[0], middle[1], 'place');
  }
  // Serena Isle's stream (carved by the island's own height function; 49-outland draws its water and falls with the rivers)
  if (ST) { O.rivers.push({ name: ST.name, pts: ST.pts, levels: ST.levels, hw: ST.hw }); const lip = ST.pts[Math.floor(ST.pts.length * 0.4)]; AF.addLabel(ST.name, lip[0], lip[1], 'place'); }
  riverReady = true;
}
function nearestOn(road, x, z) {
  let best = Infinity, y = 0, flag = 0, gx = 0, gz = 0;
  for (let index = 1; index < road.points.length; index++) {
    const a = road.points[index - 1], b = road.points[index], dx = b[0] - a[0], dz = b[1] - a[1], len2 = dx * dx + dz * dz || 1, t = clamp(((x - a[0]) * dx + (z - a[1]) * dz) / len2, 0, 1);
    const distance = (x - a[0] - dx * t) ** 2 + (z - a[1] - dz * t) ** 2;
    if (distance < best) { best = distance; y = AF.lerp(road.heights[index - 1], road.heights[index], t); flag = road.flags[index - 1] === road.flags[index] ? road.flags[index] : 0; const rise = (road.heights[index] - road.heights[index - 1]) / len2, terminal = t === 0 && index === 1 || t === 1 && index === road.points.length - 1; gx = terminal ? NaN : dx * rise; gz = dz * rise; }
  }
  // gx, gz: the host's surface gradient there (its cross-section is level); NaN past the host's own end (end-to-end joins)
  return { d: Math.sqrt(best), y, flag, gx, gz };
}
// dense centreline + height profile: smoothed terrain, grade-limited, anchored to the city and to roads already profiled;
// flags 1 = bridge (over water or > 7 m above ground), 2 = tunnel (ring only, > 12 m under ground)
function profile(road, done) {
  const kind = road.kind, pts = catmull(road.ctrl, kind === 2 ? 5 : 6), n = pts.length;
  const base = new Float64Array(n), lo = new Float64Array(n).fill(-Infinity), anchor = new Float64Array(n).fill(NaN), water = new Uint8Array(n), step = new Float64Array(n), slopeX = new Float64Array(n).fill(NaN), slopeZ = new Float64Array(n);
  for (let index = 0; index < n; index++) {
    const x = pts[index][0], z = pts[index][1];
    if (index) step[index] = Math.hypot(x - pts[index - 1][0], z - pts[index - 1][1]);
    if (W.col(x, z) >= 0) { base[index] = anchor[index] = W.groundY(x, z); continue; }
    base[index] = O.h(x, z);
    const gx = clamp(x, W.X0 + 0.01, W.x1 - 0.01), gz = clamp(z, W.Z0 + 0.01, W.z1 - 0.01);
    if (Math.hypot(x - gx, z - gz) < 1.5) anchor[index] = W.groundY(gx, gz);
    riverAt(x, z); if (rivD < rivHW + 5) { lo[index] = rivY + (kind === 2 ? 1.8 : 3.4); water[index] = 1; }
    for (const lake of waters) if (waterE(x, z, lake) < 1.1) { lo[index] = Math.max(lo[index], lake.waterY + 3); water[index] = 1; }
    if (base[index] < 0) { lo[index] = Math.max(lo[index], 2.5); water[index] = 1; }
    const end = index === 0 || index === n - 1, near = index <= 2 || index >= n - 3;
    // junctions: everything on an older road's carriageway, and near this road's ends the first vertex past its edge, takes the
    // older road's level, so the trimmed ribbon meets it flush
    for (const other of done) { const hit = nearestOn(other, x, z); if (hit.d < (near ? Math.max(end ? 8 : 0, other.w / 2 + 6.5) : other.w / 2 + 2) && hit.flag === 0) { anchor[index] = hit.y; const beside = pastEnd(other, x, z); slopeX[index] = beside ? NaN : hit.gx; slopeZ[index] = beside ? 0 : hit.gz; } }
  }
  const radius = road.ring ? 6 : kind === 1 ? 4 : kind === 2 ? 1 : 5;
  let current = base.map((value, index) => Math.max(value, lo[index]));
  for (let pass = 0; pass < 2; pass++) current = current.map((_, index) => { let sum = 0, count = 0; for (let k = Math.max(0, index - radius); k <= Math.min(n - 1, index + radius); k++) { sum += current[k]; count++; } return sum / count; });
  const y = current, grade = road.grade;
  for (let iteration = 0; iteration < 4; iteration++) {
    for (let index = 0; index < n; index++) y[index] = Number.isNaN(anchor[index]) ? Math.max(y[index], lo[index]) : anchor[index];
    for (let index = 1; index < n; index++) if (Number.isNaN(anchor[index])) y[index] = clamp(y[index], y[index - 1] - grade * step[index], y[index - 1] + grade * step[index]);
    for (let index = n - 2; index >= 0; index--) if (Number.isNaN(anchor[index])) y[index] = clamp(y[index], y[index + 1] - grade * step[index + 1], y[index + 1] + grade * step[index + 1]);
  }
  // round off the grade breaks the clamp leaves (a car felt each one as a bump), then re-check the limit
  for (let pass = 0; pass < 3; pass++) {
    const prev = y.slice();
    for (let index = 1; index < n - 1; index++) if (Number.isNaN(anchor[index])) y[index] = Math.max(lo[index], (prev[index - 1] + 2 * prev[index] + prev[index + 1]) / 4);
  }
  for (let index = 1; index < n; index++) if (Number.isNaN(anchor[index])) y[index] = clamp(y[index], y[index - 1] - grade * step[index], y[index - 1] + grade * step[index]);
  for (let index = n - 2; index >= 0; index--) if (Number.isNaN(anchor[index])) y[index] = clamp(y[index], y[index + 1] - grade * step[index + 1], y[index + 1] + grade * step[index + 1]);
  const raw = new Uint8Array(n), flags = new Uint8Array(n);
  for (let index = 0; index < n; index++) if (Number.isNaN(anchor[index]) || W.col(pts[index][0], pts[index][1]) < 0) {
    if (water[index] || kind !== 2 && y[index] - base[index] > 7) raw[index] = 1; else if (road.ring && base[index] - y[index] > 12) raw[index] = 2;
  }
  for (let index = 0; index < n; index++) flags[index] = raw[index] || (raw[index - 1] === 1 || raw[index + 1] === 1 ? 1 : 0);
  for (let index = 0; index < n;) { if (flags[index] !== 2) { index++; continue; } let end = index; while (end < n && flags[end] === 2) end++; if (end - index < 4) flags.fill(0, index, end); index = end; }
  for (let index = 0; index < n; index++) if (W.col(pts[index][0], pts[index][1]) >= 0) flags[index] = 0;
  // junction cross-fall: where an asphalt road takes an older road's level, its cross-section also takes that road's slope
  // (a level cross-section meeting a climbing road left a step at the seam); fades out one vertex past the junction
  const bank = new Float64Array(n);
  if (kind === 0) for (let index = 0; index < n; index++) {
    let source = index, weight = 1;
    if (Number.isNaN(slopeX[index])) { weight = 0.5; source = index > 0 && !Number.isNaN(slopeX[index - 1]) ? index - 1 : index < n - 1 && !Number.isNaN(slopeX[index + 1]) ? index + 1 : -1; }
    if (source < 0) continue;
    const before = pts[Math.max(0, index - 1)], after = pts[Math.min(n - 1, index + 1)], tx = after[0] - before[0], tz = after[1] - before[1], length = Math.hypot(tx, tz) || 1;
    bank[index] = weight * (slopeX[source] * -tz + slopeZ[source] * tx) / length;
  }
  road.points = pts; road.heights = Array.from(y); road.flags = flags; road.base = base; road.bank = Array.from(bank); setEnds(road);
}
const STOPS = [['kiosk', 'Wayside Kiosk', 7], ['houses', 'Roadside Cottages', 17], ['fuel', 'Ring Road Fuel', 14], ['supermarket', 'Ridgeway Market', 19], ['diner', 'Summit Diner', 12], ['houses', 'Pine Row', 17],
  ['mall', 'Range Shopping Centre', 26], ['motel', 'Lookout Motel', 16], ['kiosk', 'Farm Stall', 7], ['houses', 'Hilltop Homes', 17], ['diner', 'Valley View Cafe', 12], ['supermarket', 'Westmoor Co-op', 19]];
function wayside(ring, done) {
  const pts = ring.points, n = pts.length, cum = [0];
  for (let index = 1; index < n; index++) cum.push(cum[index - 1] + Math.hypot(pts[index][0] - pts[index - 1][0], pts[index][1] - pts[index - 1][1]));
  const drives = [];
  let s = 160, count = 0;
  while (s < cum[n - 1] - 120 && count < STOPS.length) {
    const [kind, name, R] = STOPS[count];
    let placed = null;
    for (let attempt = 0; attempt < 6 && !placed; attempt++) {
      const at = s + attempt * 45; let index = 1; while (index < n - 2 && cum[index] < at) index++;
      let clear = true; for (let k = Math.max(0, index - 7); k <= Math.min(n - 1, index + 7); k++) if (ring.flags[k]) clear = false;
      if (!clear) continue;
      const tx = pts[index + 1][0] - pts[index - 1][0], tz = pts[index + 1][1] - pts[index - 1][1], tl = Math.hypot(tx, tz);
      for (const side of count % 2 ? [1, -1] : [-1, 1]) {
        const nx = -tz / tl * side, nz = tx / tl * side, offset = ring.w / 2 + 5 + R * 1.42, cx = pts[index][0] + nx * offset, cz = pts[index][1] + nz * offset, y = ring.heights[index];
        if (W.col(cx, cz) >= 0 || cx < P.play.x0 + R || cx > P.play.x1 - R || cz < P.play.z0 + R) continue;
        let bad = false;
        for (const [dx, dz] of [[0, 0], [-R, -R], [R, -R], [-R, R], [R, R]]) { const h = O.h(cx + dx, cz + dz); if (O.waterY(cx + dx, cz + dz) !== null || Math.abs(h - y) > 10) bad = true; riverAt(cx + dx, cz + dz); if (rivD < rivHW + 14) bad = true; }
        for (const pad of O.pads) if (Math.abs(pad.x - cx) < pad.rx + R + 24 && Math.abs(pad.z - cz) < pad.rz + R + 24) bad = true;
        for (const other of done) if (other !== ring && nearestOn(other, cx, cz).d < R * 1.42 + other.w / 2 + 8) bad = true;
        if (bad) continue;
        const face = Math.abs(nx) > Math.abs(nz) ? [-Math.sign(nx), 0] : [0, -Math.sign(nz)];
        placed = { name, kind, x: Math.round(cx), z: Math.round(cz), rx: R, rz: R, y: Math.round(y * 4) / 4, bank: 12, props: [], face, rot: face[1] > 0 ? 0 : face[0] > 0 ? 1 : face[1] < 0 ? 2 : 3, ringS: cum[index], roadX: pts[index][0], roadZ: pts[index][1] };
        // the drive stops at the forecourt edge of the pad (bays, buildings and picnic tables stand behind it)
        const start = [pts[index][0] + nx * (ring.w / 2 - 0.5), pts[index][1] + nz * (ring.w / 2 - 0.5)], stop = [placed.x + face[0] * R, placed.z + face[1] * R];
        const rise = (ring.heights[index + 1] - ring.heights[index - 1]) / (tl * tl), dl = Math.hypot(stop[0] - start[0], stop[1] - start[1]) || 1;
        const bank = (tx * rise * -(stop[1] - start[1]) + tz * rise * (stop[0] - start[0])) / dl;
        drives.push({ name: name + ' drive', w: 6, surface: 'asphalt', kind: 0, grade: 0.1, driveway: true, ctrl: [start, stop],
          points: [0, 1, 2, 3, 4].map((k) => [AF.lerp(start[0], stop[0], k / 4), AF.lerp(start[1], stop[1], k / 4)]), heights: [0, 1, 2, 3, 4].map((k) => AF.lerp(y, placed.y, k / 4)), flags: new Uint8Array(5), bank: [0, 1, 2, 3, 4].map((k) => bank * (1 - k / 4)) });
        break;
      }
    }
    if (placed) { O.wayside.push(placed); O.pads.push(placed); AF.addLabel(name, placed.x, placed.z, 'place'); AF.addLight({ x: placed.x, y: placed.y + 5, z: placed.z, color: 0xffd08a, intensity: 1, range: 14, kind: 'street' }); count++; }
    s += placed ? 230 + AF.hash2(count, 17) * 120 : 90;
  }
  return drives;
}
function register(road) {
  let acc = 0;
  road.order = P.roads.indexOf(road); road.lift = 0.05; setEnds(road);
  for (let index = 1; index < road.points.length; index++) {
    const start = road.points[index - 1], end = road.points[index], dx = end[0] - start[0], dz = end[1] - start[1], len2 = dx * dx + dz * dz || 1e-6;
    const flag = road.flags[index - 1] === road.flags[index] ? road.flags[index] : 0, length = Math.sqrt(len2);
    const segment = { x: start[0], z: start[1], dx, dz, len2, length, y0: road.heights[index - 1], y1: road.heights[index], acc, kind: road.kind, hw: road.w / 2, flag, deck: road.kind === 0 || flag === 1, road,
      lift: road.lift, grade: Math.abs(road.heights[index] - road.heights[index - 1]) / length, first: index === 1, last: index === road.points.length - 1,
      b0: road.bank ? road.bank[index - 1] : 0, b1: road.bank ? road.bank[index] : 0 };
    segments.push(segment); acc += segment.length; bucketRoad(segment);
  }
}
function bucketRoad(segment) {
  const x0 = Math.floor((Math.min(segment.x, segment.x + segment.dx) - 44) / 64), x1 = Math.floor((Math.max(segment.x, segment.x + segment.dx) + 44) / 64);
  const z0 = Math.floor((Math.min(segment.z, segment.z + segment.dz) - 44) / 64), z1 = Math.floor((Math.max(segment.z, segment.z + segment.dz) + 44) / 64);
  for (let ix = x0; ix <= x1; ix++) for (let iz = z0; iz <= z1; iz++) { const key = ix * 10000 + iz; let bucket = roadGrid.get(key); if (!bucket) { bucket = []; roadGrid.set(key, bucket); } bucket.push(segment); }
}
function bucketRiver(segment) {
  const ax = segment.x, az = segment.z, bx = ax + segment.dx, bz = az + segment.dz;
  for (let ix = Math.floor((Math.min(ax, bx) - 100) / 64); ix <= Math.floor((Math.max(ax, bx) + 100) / 64); ix++) for (let iz = Math.floor((Math.min(az, bz) - 100) / 64); iz <= Math.floor((Math.max(az, bz) + 100) / 64); iz++) {
    const key = ix * 10000 + iz; let bucket = riverGrid.get(key); if (!bucket) { bucket = []; riverGrid.set(key, bucket); } bucket.push(segment);
  }
}
AF.onBuild('outland-boundary', 496, () => {
  O.edgeReady = false; tiles.clear(); edges.clear(); segments.length = 0; roadGrid.clear(); O.wayside.length = 0;
  buildRivers();
  const done = [], order = [...P.roads.filter((road) => road.ring), ...P.roads.filter((road) => !road.ring)];
  for (const road of order) {
    // forks leave the ring at the nearest at-grade point (never from a bridge or a tunnel); `joinsRing` roads end on its side (a T)
    for (const end of [0, road.ctrl.length - 1]) {
      if (!(end === 0 ? road.fork || road.kind === 2 : road.joinsRing) || !done.length) continue;
      const ring = done[0], [fx, fz] = road.ctrl[end]; let best = Infinity, at = -1;
      for (let index = 3; index < ring.points.length - 3; index++) {
        let level = true; for (let k = index - 3; k <= index + 3; k++) if (ring.flags[k]) level = false;
        const d = Math.hypot(ring.points[index][0] - fx, ring.points[index][1] - fz); if (level && d < best) { best = d; at = index; }
      }
      if (at >= 0 && best < 150) road.ctrl[end] = [ring.points[at][0], ring.points[at][1]];
    }
    profile(road, done); done.push(road);
  }
  for (const road of P.roads) register(road);
  O.edgeReady = true; tiles.clear();
});
// after the rural site pads (44-sites, 496.2): stops along the ring keep clear of them
AF.onBuild('outland-wayside', 496.25, () => {
  const drives = wayside(P.roads.find((road) => road.ring), P.roads.slice());
  for (const road of drives) { P.roads.push(road); register(road); }
  tiles.clear();
});
for (const road of P.roads) { road.ctrl = road.points.map((point) => [point[0], point[1]]); road.kind = road.surface === 'gravel' ? 1 : road.surface === 'trail' ? 2 : 0; road.grade = road.ring ? 0.07 : road.kind === 2 ? 0.3 : 0.1; road.flags = new Uint8Array(road.points.length); }
for (const entry of [['Solace Range', 220, -780], ['Park Valley', -40, -440], ['Lake Tamsin', -40, -650], ['Westmoor', -1000, -100], ['Eastwood', 800, -160], ['Serena Isle', ISLE.cx, ISLE.cz], ['Tamsin Jungle', 715, -375]]) AF.addLabel(entry[0], entry[1], entry[2]);
AF.addLabel('Mirror Lake', 828, -198);
AF.addLabel('Ochre Flats', 930, 70);
for (const road of P.roads) { const point = road.points[1]; AF.addLabel(road.name, point[0], point[1], 'street'); }

// ---------------------------------------------------------------- tile mesher (49-outland quadtree tiles): runs here and on the workers
const quadP = new Float64Array(12), quadUV = new Float64Array(8);
const setP = (a, b, c, d, e, f, g, h, i, j, k, l) => { const q = quadP; q[0] = a; q[1] = b; q[2] = c; q[3] = d; q[4] = e; q[5] = f; q[6] = g; q[7] = h; q[8] = i; q[9] = j; q[10] = k; q[11] = l; };
const setUV = (a, b, c, d, e, f, g, h) => { const q = quadUV; q[0] = a; q[1] = b; q[2] = c; q[3] = d; q[4] = e; q[5] = f; q[6] = g; q[7] = h; };
const heights = new Int16Array(66 * 66), colors = new Uint16Array(64 * 64), used = new Uint8Array(64 * 64);
const terrainBuf = O.terrainBuf = { n: 0, p: new Float32Array(262144 * 3), uv: new Float32Array(262144 * 2), pal: new Uint16Array(262144), an: new Uint8Array(262144), idx: new Uint32Array(393216),
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
const directions = [[1, 0, 0], [-1, 0, 1], [0, 1, 4], [0, -1, 5]];
const inside = (x, z) => x >= W.X0 && x < W.x1 && z >= W.Z0 && z < W.z1;
const rimCache = new Map();
let padsSeen = -1;
function rimSample(x, z) {
  const key = x * 10000 + z;
  let height = rimCache.get(key);
  if (height === undefined) { height = O.rimH ? O.rimH(x, z) : Math.round(O.h(x, z) * 4) / 4; rimCache.set(key, height); }
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
// ---- Serena Isle as a sloped heightfield: terraced columns stair-stepped its cone and beaches (0.75-6 m risers on the far tiles),
// so tiles over the isle mesh one quad per cell from exact corner heights instead (flat runs - pads, the strip, the sea floor - still
// merge), coloured per corner so the ramps blend across each cell (aPal per vertex: only patternless colours of one material, BLEND).
// Same samples per tile (65 x 65 corners vs 66 x 66 centres), one quad per cell where the terraces needed a top and 1-2 risers, so
// fewer triangles. Edge corners take the shared rim profile and the correction fades in over a few cells (a Coons blend), so tiles of
// any level or style still meet crack-free. Round the smugglers' tube's openings (and its cleft) level-0 cells stay terraced, as
// its shell (44-island) is fitted to them; walls close the seams between those cells and the slope.
const cornerE = new Float32Array(65 * 65), cornerC = new Float32Array(65 * 65), cornerK = new Int16Array(65 * 65), cornerA = new Uint8Array(65 * 65), MIXED = 0xffff;
// one sloped cell: corners 00 (xa,za), 01 (xa,zb), 11 (xb,zb), 10 (xb,za) with their heights, palette ids and AO; `turn` splits it
// along 01-10 instead of 00-11 (same winding as quadS, which would pick the diagonal from the AO instead)
function slopeQuad(buf, xa, za, xb, zb, a, turn, p00, p01, p11, p10) {
  const base = buf.n; if (base + 4 > buf.pal.length) throw new Error('outland mesh scratch capacity');
  const C = cornerC, A = cornerA, P = buf.p, U = buf.uv, L = buf.pal, N = buf.an, v = base * 3, t = base * 2;
  P[v] = xa; P[v + 1] = C[a]; P[v + 2] = za; P[v + 3] = xa; P[v + 4] = C[a + 65]; P[v + 5] = zb;
  P[v + 6] = xb; P[v + 7] = C[a + 66]; P[v + 8] = zb; P[v + 9] = xb; P[v + 10] = C[a + 1]; P[v + 11] = za;
  U[t] = xa * 4; U[t + 1] = za * 4; U[t + 2] = xa * 4; U[t + 3] = zb * 4; U[t + 4] = xb * 4; U[t + 5] = zb * 4; U[t + 6] = xb * 4; U[t + 7] = za * 4;
  L[base] = p00; L[base + 1] = p01; L[base + 2] = p11; L[base + 3] = p10;
  N[base] = A[a] * 8 + 2; N[base + 1] = A[a + 65] * 8 + 2; N[base + 2] = A[a + 66] * 8 + 2; N[base + 3] = A[a + 1] * 8 + 2;
  const I = buf.idx, o = base / 4 * 6, f = turn ? 1 : 0;
  I[o] = base + f; I[o + 1] = base + f + 1; I[o + 2] = base + f + 2; I[o + 3] = base + f; I[o + 4] = base + f + 2; I[o + 5] = base + (f + 3) % 4;
  buf.n += 4;
}
const tubeMask = new Uint8Array(64 * 64), tubeH = new Float32Array(64 * 64);
// the rim correction fades over 3 cells on level-0 tiles (1.5 m: a cliff or the crater wall stays true right up to the seam), 4 on
// level 1, 6 beyond (their rims are the same 8 m lattice, coarser cells need the room)
const fadeCells = (step) => step <= 0.5 ? 3 : step <= 1 ? 4 : 6;
const slopeFade = (k, n) => k >= n ? 0 : smooth(n, 0, k);
function slopedTile(entry) {
  return entry.x < ISLE_BOX.x1 && entry.x + entry.size > ISLE_BOX.x0 && entry.z < ISLE_BOX.z1 && entry.z + entry.size > ISLE_BOX.z0;
}
O.slopedTile = slopedTile;
// level-0 cells drawn terraced: the tube's open cells (colorIndex -1) and its cleft, grown by two cells (interior cells only)
function tubeCells(entry, step) {
  const T = TN, M = tubeMask; M.fill(0);
  if (!T || entry.size > 32 || entry.x >= T.box[2] || entry.x + entry.size <= T.box[0] || entry.z >= T.box[3] || entry.z + entry.size <= T.box[1]) return 0;
  let n = 0;
  // 4 x 4 cell blocks first: openings and the cleft lie within a chamber's half-width of the centre-line, so blocks whose centre is
  // farther than that (+ a margin) skip
  for (let br = 0; br < 64; br += 4) for (let bc = 0; bc < 64; bc += 4) {
    if (!tunnelAt(entry.x + (bc + 2) * step, entry.z + (br + 2) * step) || TN_.d > TN_.hw + 9 || TN_.end && TN_.s < -16) continue;
    for (let row = Math.max(1, br); row < Math.min(63, br + 4); row++) for (let col = Math.max(1, bc); col < Math.min(63, bc + 4); col++) {
      const x = entry.x + (col + 0.5) * step, z = entry.z + (row + 0.5) * step;
      if (!tunnelAt(x, z)) continue;
      const cleft = TN_.end && TN_.s < 0 && TN_.s > -9;
      // only the hollow itself and the band round its mouths can open (colorIndex -1); the rest of the band stays buried
      if (!cleft && !TN_.end && TN_.d >= TN_.hw && TN_.s >= T.MZ && TN_.s <= T.L - T.MZ) continue;
      if (cleft || colorIndex(x, z, O.meshH(x, z, step), 0, step) < 0) { M[row * 64 + col] = 2; n++; }
    }
  }
  if (!n) return 0;
  for (let pass = 0; pass < 2; pass++) {
    const mark = pass + 3;
    for (let row = 1; row < 63; row++) for (let col = 1; col < 63; col++) {
      const cell = row * 64 + col, w = M[cell - 1], e = M[cell + 1], s = M[cell - 64], q = M[cell + 64];
      if (!M[cell] && (w && w < mark || e && e < mark || s && s < mark || q && q < mark)) M[cell] = mark;
    }
  }
  for (let cell = 0; cell < 4096; cell++) if (M[cell]) { const x = entry.x + ((cell & 63) + 0.5) * step, z = entry.z + ((cell >> 6) + 0.5) * step; tubeH[cell] = O.meshH(x, z, step); }
  return n;
}
function* meshSlopedG(entry, rim, step) {
  const buf = terrainBuf, C = cornerC, E = cornerE, tube = tubeCells(entry, step), M = tubeMask, fade = fadeCells(step);
  // coarse tiles over the cone prefilter their interior corners (a 3 x 3 tent over +-step/2): the crater lip (~2.6 m), the bench
  // edge and the lava knolls are narrower than a 1-8 m cell, and point samples turned them into spikes and slabs on the far
  // silhouette. Render-only: edge corners keep the shared rim profile, level-0 tiles and physics (isleTop) sample exactly.
  const cn = ISLE.cone, filt = step >= 1 && entry.x < cn.x + cn.r && entry.x + entry.size > cn.x - cn.r && entry.z < cn.z + cn.r && entry.z + entry.size > cn.z - cn.r, hs = step * 0.5;
  for (let iz = 0; iz <= 64; iz++) {
    for (let ix = 0; ix <= 64; ix++) {
      const x = entry.x + ix * step, z = entry.z + iz * step;
      let h = O.hNat(x, z);
      if (filt && ix > 0 && ix < 64 && iz > 0 && iz < 64 && Math.hypot(x - cn.x, z - cn.z) < cn.r) {
        const w = O.hNat(x - hs, z), e = O.hNat(x + hs, z), n = O.hNat(x, z - hs), s = O.hNat(x, z + hs);
        h = (h * 4 + (w + e + n + s) * 2 + O.hNat(x - hs, z - hs) + O.hNat(x + hs, z - hs) + O.hNat(x - hs, z + hs) + O.hNat(x + hs, z + hs)) / 16;
      }
      E[iz * 65 + ix] = h;
    }
    if ((iz & 3) === 3) yield;
  }
  const dTL = rim[0] - E[0], dBL = rim[64] - E[64 * 65], dTR = rim[65] - E[64], dBR = rim[129] - E[64 * 65 + 64];
  for (let iz = 0; iz <= 64; iz++) {
    const wt = slopeFade(iz, fade), wb = slopeFade(64 - iz, fade), dl = rim[iz] - E[iz * 65], dr = rim[65 + iz] - E[iz * 65 + 64];
    for (let ix = 0; ix <= 64; ix++) {
      const wl = slopeFade(ix, fade), wr = slopeFade(64 - ix, fade), at = iz * 65 + ix;
      if (!(wl || wr || wt || wb)) { C[at] = E[at]; continue; }
      const dt = rim[130 + ix] - E[ix], db = rim[195 + ix] - E[64 * 65 + ix];
      C[at] = E[at] + wl * dl + wr * dr + wt * dt + wb * db - wl * wt * dTL - wl * wb * dBL - wr * wt * dTR - wr * wb * dBR;
    }
  }
  yield;
  // colours at the corners: a cell whose four corners are all blendable draws a gradient (aPal per vertex); any other cell (the strip,
  // the stream bed, the trail bench, mixed with one of those) takes its centre's colour whole. The corners also carry a baked relief
  // term in the AO bits (steep ground, hollows and the cone's gullies darker), stochastically rounded so it reads as a soft gradient.
  const K = cornerK, AO = cornerA, cone = ISLE.cone;
  let steep = 0;
  for (let iz = 0; iz <= 64; iz++) {
    for (let ix = 0; ix <= 64; ix++) {
      const at = iz * 65 + ix, x = entry.x + ix * step, z = entry.z + iz * step;
      const c = C[at], l = ix > 0 ? C[at - 1] : c, r = ix < 64 ? C[at + 1] : c, u = iz > 0 ? C[at - 65] : c, d = iz < 64 ? C[at + 65] : c;
      const slope = Math.abs(r - l) / ((ix > 0 && ix < 64 ? 2 : 1) * step) + Math.abs(d - u) / ((iz > 0 && iz < 64 ? 2 : 1) * step);
      const hollow = ((ix > 0 && ix < 64 ? (l + r) * 0.5 - c : 0) + (iz > 0 && iz < 64 ? (u + d) * 0.5 - c : 0)) / step;
      ribLast = 2;
      K[at] = inside(x, z) ? -1 : colorIndex(x, z, c, slope, step);
      if (slope > 0.45) steep++;
      let occl = smooth(0.55, 1.6, slope) * 0.9 + smooth(0.03, 0.3, hollow) * 0.9;
      const cd = Math.hypot(x - cone.x, z - cone.z);
      if (cd < cone.r && cd > cone.craterR + 6) occl += Math.max(0, -(ribLast < 2 ? ribLast : isleRib(x, z, Math.atan2(z - cone.z, x - cone.x)))) * 0.35 * smooth(cone.r, cone.r * 0.7, cd);
      // fine tiles dither per corner; coarse tiles (corners metres apart) round on a smooth field so the far cone reads as soft
      // bands, not a speckle of single dark corners
      const aoT = step <= 0.5 ? AF.hash2(Math.round(x * 2) + 311, Math.round(z * 2) - 977) : 0.3 + noise(x * 0.045 + 11, z * 0.045 - 5) * 0.4;
      AO[at] = clamp(Math.floor(3 - occl * 1.2 + aoT), 1, 3);
    }
    if ((iz & 3) === 3) yield;
  }
  buf.steep = steep / (65 * 65);
  for (let row = 0; row < 64; row++) {
    for (let col = 0; col < 64; col++) {
      const a = row * 65 + col, c00 = C[a], c10 = C[a + 1], c01 = C[a + 65], c11 = C[a + 66], cell = row * 64 + col;
      if (M[cell]) {
        used[cell] = 1;
        const slope = (Math.abs(c10 - c00 + c11 - c01) + Math.abs(c01 - c00 + c11 - c10)) / (2 * step);
        colors[cell] = O.colTop(entry.x + (col + 0.5) * step, entry.z + (row + 0.5) * step, tubeH[cell], slope, step);
        continue;
      }
      if (Math.max(c00, c10, c01, c11) <= -1.6) continue;
      const k00 = K[a], k10 = K[a + 1], k01 = K[a + 65], k11 = K[a + 66];
      if (k00 === k10 && k00 === k01 && k00 === k11 && k00 >= 0) { colors[cell] = pal[k00]; continue; }
      if (k00 >= 0 && k10 >= 0 && k01 >= 0 && k11 >= 0 && BLEND[k00] && BLEND[k10] && BLEND[k01] && BLEND[k11]) { colors[cell] = MIXED; continue; }
      const x = entry.x + (col + 0.5) * step, z = entry.z + (row + 0.5) * step;
      if (inside(x, z)) continue;
      const slope = (Math.abs(c10 - c00 + c11 - c01) + Math.abs(c01 - c00 + c11 - c10)) / (2 * step);
      colors[cell] = O.colTop(x, z, (c00 + c10 + c01 + c11) * 0.25, slope, step);
    }
    if ((row & 7) === 7) yield;
  }
  const flat = (cell, h) => { const a = (cell >> 6) * 65 + (cell & 63); return C[a] === h && C[a + 1] === h && C[a + 65] === h && C[a + 66] === h; };
  for (let row = 0; row < 64; row++) {
    const za = entry.z + row * step, zb = za + step;
    for (let col = 0; col < 64; col++) {
      const cell = row * 64 + col, color = colors[cell];
      if (!color || used[cell]) continue;
      const a = row * 65 + col, c00 = C[a], c10 = C[a + 1], c01 = C[a + 65], c11 = C[a + 66], xa = entry.x + col * step, xb = xa + step;
      if (color !== MIXED && flat(cell, c00)) {
        let run = 1;
        while (col + run < 64 && !used[cell + run] && colors[cell + run] === color && flat(cell + run, c00)) run++;
        let depth = 1, match = true;
        while (row + depth < 64 && match) {
          for (let along = 0; along < run; along++) { const next = cell + depth * 64 + along; if (used[next] || colors[next] !== color || !flat(next, c00)) { match = false; break; } }
          if (match) depth++;
        }
        for (let across = 0; across < depth; across++) used.fill(1, cell + across * 64, cell + across * 64 + run);
        emit(buf, xa, za, xa + run * step, za + depth * step, c00, c00, color, 2);
        continue;
      }
      // split along the diagonal with the smaller rise (ridges and gullies across a cell keep their line)
      const turn = Math.abs(c00 - c11) > Math.abs(c01 - c10);
      if (color === MIXED) slopeQuad(buf, xa, za, xb, zb, a, turn, pal[K[a]], pal[K[a + 65]], pal[K[a + 66]], pal[K[a + 1]]);
      else slopeQuad(buf, xa, za, xb, zb, a, turn, color, color, color, color);
    }
    if ((row & 7) === 7) yield;
  }
  if (tube) {
    // the terraced cells round the tube: flat tops at their quantised height, risers to lower neighbours, and walls closing the gap
    // to the slope on both sides (each side covers the part of the gap above the other, so nothing overlaps)
    for (let row = 1; row < 63; row++) {
      for (let col = 1; col < 63; col++) {
        const cell = row * 64 + col; if (!M[cell]) continue;
        const h = tubeH[cell], color = colors[cell], xa = entry.x + col * step, za = entry.z + row * step, xb = xa + step, zb = za + step;
        if (color) emit(buf, xa, za, xb, zb, h, h, color, 2);
        for (const direction of directions) {
          const dx = direction[0], dz = direction[1], normal = direction[2], next = cell + dx + dz * 64;
          const ax = col + (dx > 0 ? 1 : 0), az = row + (dz > 0 ? 1 : 0), bx = col + (dx ? (dx > 0 ? 1 : 0) : 1), bz = row + (dz ? (dz > 0 ? 1 : 0) : 1);
          const fxA = entry.x + ax * step, fzA = entry.z + az * step, fxB = entry.x + bx * step, fzB = entry.z + bz * step;
          if (M[next]) {
            const low = tubeH[next];
            if (color && low < h) wall(buf, fxA, fzA, fxB, fzB, low, low, h, h, h - low <= step * 2 ? color : O.colSide(xa + step / 2, za + step / 2, h), normal, h - low <= step * 2);
            continue;
          }
          const ea = C[az * 65 + ax], eb = C[bz * 65 + bx], other = colors[next];
          if (color && h > Math.min(ea, eb)) wall(buf, fxA, fzA, fxB, fzB, ea, eb, h, h, color, normal, h - Math.min(ea, eb) <= step * 2);
          if (other && Math.max(ea, eb) > h) {
            const tone = other === MIXED ? pal[K[az * 65 + ax]] : other;
            wall(buf, fxA, fzA, fxB, fzB, h, h, ea, eb, tone, normal ^ 1, Math.max(ea, eb) - h <= step * 2);
          }
        }
      }
    }
  }
  return buf.n;
}
// ---- physics on the sloped isle: what level-0 tiles draw at a 0.5 m corner (hNat + its tile's rim correction, as meshSlopedG),
// cached; O.deckY (02 surfaceBelow) carries bodies on the drawn triangles where they rise above the cell's column. Round the tube
// (its terraced cells, the cleft) only the columns count.
const RX0 = -1484, RZ0 = -1708, isleCorners = new Map();
let cornerPads = -1;
const tubeNear = (x, z) => tunnelAt(x, z) && (TN_.end ? TN_.s > -11 : TN_.d < TN_.hw + 3 || TN_.s < TN.MZ + 2 || TN_.s > TN.L - TN.MZ - 2);
function isleCorner(ix, iz) {
  if (O.pads.length !== cornerPads) { cornerPads = padsSeen = O.pads.length; rimCache.clear(); isleCorners.clear(); }
  const key = ix * 16384 + iz;
  let c = isleCorners.get(key); if (c !== undefined) return c;
  const x = RX0 + ix * 0.5, z = RZ0 + iz * 0.5, cx = ix & 63, cz = iz & 63, X0 = x - cx * 0.5, Z0 = z - cz * 0.5;
  const wl = slopeFade(cx, 3), wr = slopeFade(64 - cx, 3), wt = slopeFade(cz, 3), wb = slopeFade(64 - cz, 3), d = (px, pz) => boundaryH(px, pz) - O.hNat(px, pz);
  c = O.hNat(x, z);
  if (wl) c += wl * d(X0, z); if (wr) c += wr * d(X0 + 32, z); if (wt) c += wt * d(x, Z0); if (wb) c += wb * d(x, Z0 + 32);
  if (wl && wt) c -= wl * wt * d(X0, Z0); if (wl && wb) c -= wl * wb * d(X0, Z0 + 32); if (wr && wt) c -= wr * wt * d(X0 + 32, Z0); if (wr && wb) c -= wr * wb * d(X0 + 32, Z0 + 32);
  if (isleCorners.size > 40000) isleCorners.clear();
  isleCorners.set(key, c); return c;
}
// the drawn surface at (x,z) (the cell's two triangles, split as meshSlopedG splits them); -Infinity off the isle, round the tube,
// under the sea, or above y + 0.35
function isleTop(x, z, y) {
  if (x <= ISLE_BOX.x0 || x >= ISLE_BOX.x1 || z <= ISLE_BOX.z0 || z >= ISLE_BOX.z1 || W.col(x, z) >= 0 || tubeNear(x, z)) return -Infinity;
  const fx = (x - RX0) * 2, fz = (z - RZ0) * 2, ix = Math.floor(fx), iz = Math.floor(fz), u = fx - ix, v = fz - iz;
  const c00 = isleCorner(ix, iz), c10 = isleCorner(ix + 1, iz), c01 = isleCorner(ix, iz + 1), c11 = isleCorner(ix + 1, iz + 1);
  if (Math.max(c00, c10, c01, c11) <= -1.6) return -Infinity;
  let h;
  if (Math.abs(c00 - c11) <= Math.abs(c01 - c10)) h = u >= v ? c00 + u * (c10 - c00) + v * (c11 - c10) : c00 + v * (c01 - c00) + u * (c11 - c01);
  else h = u + v <= 1 ? c00 + u * (c10 - c00) + v * (c01 - c00) : c11 + (1 - u) * (c01 - c11) + (1 - v) * (c10 - c11);
  return y !== undefined && h > y + 0.35 ? -Infinity : h;
}
O.isleTop = isleTop;
// one tile { x, z, size } (64 x 64 cells) into O.terrainBuf; rim = Float32Array(260) edge profile. Returns the vertex count.
O.meshTileG = function* (entry, rim) {
  if (O.pads.length !== padsSeen) { padsSeen = O.pads.length; rimCache.clear(); isleCorners.clear(); }
  const step = entry.size / 64, quantum = step <= 1 ? step * 0.5 : step * 0.75, buf = terrainBuf;
  buf.n = 0; buf.steep = 0; colors.fill(0); used.fill(0);
  for (let index = 0; index <= 64; index++) {
    rim[index] = boundaryH(entry.x, entry.z + index * step); rim[65 + index] = boundaryH(entry.x + entry.size, entry.z + index * step);
    rim[130 + index] = boundaryH(entry.x + index * step, entry.z); rim[195 + index] = boundaryH(entry.x + index * step, entry.z + entry.size);
    if ((index & 7) === 7) yield;
  }
  if (slopedTile(entry)) return yield* meshSlopedG(entry, rim, step);
  for (let row = -1; row <= 64; row++) {
    for (let col = -1; col <= 64; col++) {
      const x = entry.x + (col + 0.5) * step, z = entry.z + (row + 0.5) * step, offset = (row + 1) * 66 + col + 1;
      heights[offset] = (O.meshH ? O.meshH(x, z, step) : Math.round(O.h(x, z) / quantum) * quantum) * 4;
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
  return buf.n;
};
// worker side: a whole tile as exact-length transferable arrays (the attributes of GeoBuf.geometryG(true)) + bounds as AF.geometryBoundsG
O.meshTileArrays = (x, z, size) => {
  const rim = new Float32Array(260), gen = O.meshTileG({ x, z, size }, rim); while (!gen.next().done);
  const buf = terrainBuf, n = buf.n, p = buf.p.slice(0, n * 3), uv = buf.uv.slice(0, n * 2), ix = buf.idx.subarray(0, n / 4 * 6);
  for (let i = 0; i < uv.length; i++) uv[i] *= 0.25;
  let x0 = Infinity, y0 = Infinity, z0 = Infinity, x1 = -Infinity, y1 = -Infinity, z1 = -Infinity, r2 = 0;
  for (let i = 0; i < p.length; i += 3) { x0 = Math.min(x0, p[i]); x1 = Math.max(x1, p[i]); y0 = Math.min(y0, p[i + 1]); y1 = Math.max(y1, p[i + 1]); z0 = Math.min(z0, p[i + 2]); z1 = Math.max(z1, p[i + 2]); }
  const cx = (x0 + x1) * 0.5, cy = (y0 + y1) * 0.5, cz = (z0 + z1) * 0.5;
  for (let i = 0; i < p.length; i += 3) r2 = Math.max(r2, (p[i] - cx) ** 2 + (p[i + 1] - cy) ** 2 + (p[i + 2] - cz) ** 2);
  return { n, p, uv, pal: buf.pal.slice(0, n), an: buf.an.slice(0, n), idx: n > 65535 ? new Uint32Array(ix) : new Uint16Array(ix), box: [x0, y0, z0, x1, y1, z1], sphere: [cx, cy, cz, Math.sqrt(r2)], rim, steep: buf.steep };
};
// the generated network + every city-edge height for the workers (structured-clone safe: roads reduced to what the samplers read)
O.padsExport = () => O.pads.map((pad) => ({ x: pad.x, z: pad.z, rx: pad.rx, rz: pad.rz, y: pad.y, bank: pad.bank, kind: pad.kind, face: pad.face, pave: pad.pave }));
O.netExport = () => {
  for (let bx = 0; bx < W.NX; bx++) { const x = W.xOf(bx) + 0.125; edge(x, W.Z0 - 1); edge(x, W.z1 + 1); }
  for (let bz = 0; bz < W.NZ; bz++) { const z = W.zOf(bz) + 0.125; edge(W.X0 - 1, z); edge(W.x1 + 1, z); }
  const lite = new Map(), roadOf = (road) => { let v = lite.get(road); if (!v) { v = { kind: road.kind, w: road.w, ring: !!road.ring, driveway: !!road.driveway, order: road.order, ends: road.ends.slice() }; lite.set(road, v); } return v; };
  const plan = { roads: [] };
  for (const key in P) if (key !== 'roads') { try { plan[key] = structuredClone(P[key]); } catch (e) { /* functions stay main-thread only */ } }
  return { plan, segments: segments.map((s) => Object.assign({}, s, { road: roadOf(s.road) })), rivers: riverSegs.slice(), edges: new Map(edges), pads: O.padsExport(), shore: AF.land && AF.land.BEACH ? AF.land.BEACH.shore(W.X0) : 210 };
};
O.netImport = (net) => {
  segments.length = 0; roadGrid.clear(); for (const s of net.segments) { segments.push(s); bucketRoad(s); }
  riverSegs.length = 0; riverGrid.clear(); for (const s of net.rivers) { riverSegs.push(s); bucketRiver(s); }
  riverReady = true; edges.clear(); for (const [key, value] of net.edges) edges.set(key, value); O.edgeReady = true;
  O.setPads(net.pads);
};
O.setPads = (pads) => { O.pads.length = 0; for (const pad of pads) O.pads.push(pad); };
}
outlandScope(AF);
AF.outland.scopeFn = outlandScope;
} catch (e) { AF.partError('07-outland.js', e); }