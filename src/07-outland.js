// ================================================================ 07-outland.js
try {
const W = AF.W, P = AF.PLAN.world, smooth = AF.smooth, clamp = AF.clamp, noise = AF.noise2;
const O = AF.outland = { bounds: P.bounds, play: P.play, props: [], pads: [], edgeReady: false, rivers: [], wayside: [], TUNNEL_H: 6.5 };
const tiles = new Map(), edges = new Map(), segments = [], roadGrid = new Map(), riverSegs = [], riverGrid = new Map();
// 34-38 = the city street asphalt + gutter (same AF.col keys as 11-streets, so the outland roads share the city's surface), 39 centre line,
// 40 jungle floor, 41 forest floor, 42 river shingle, 43 river bed, 44 dirt trail, 45 meadow, 46 olive scrub
const hex = [AF.PAL.hex[AF.col('grass')], 0x5d8a37, 0x6f797c, 0xf5f8f9, 0xcabe9f, 0xa19b70, 0x85916b, 0x929078, 0x807363, 0x48573d, 0x4a4a4f, 0xe8dfb5, 0xada084, 0x948166, 0x536455,
  0x88a049, 0x7da646, 0x566467, 0x807e73, 0x414d51, 0x5e574c, 0xb9ae91, 0xd4c5a6, 0x557a34, 0x7a745e, 0x8b816b, 0x8e8862, 0x747e5c, 0x867c6b,
  0xc8ac72, 0xd9bf87, 0xb29668, 0xc9a64c, 0xb18e3c, 0x67625b, 0x625d56, 0x6c675f, 0x726c63, 0x46423d, 0xcfa640, 0x3f6a2c, 0x4b6b2e, 0x8a8270, 0x5a5a48, 0x9a8462, 0x7d8f4a, 0x6a7a3a];
const GRASS = new Set([0, 1, 9, 15, 16, 23, 40, 41, 45, 46]), ROCK = new Set([2, 8, 17, 18, 19, 20]);
const pal = O.pal = hex.map((value, index) => index >= 34 && index <= 38 ? AF.col(value, { jitter: 0.2, edge: 0.02, pat: 'asphalt' }) : index === 39 ? AF.col(value, { jitter: 0.35, edge: 0.03 })
  : AF.col(value, { jitter: 0.9, edge: 0, pat: ROCK.has(index) ? 'stone' : 'none', patTop: GRASS.has(index) ? 'grass' : ROCK.has(index) ? 'stone' : 'none' }));
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
function islandE(x, z) {
  const isle = P.island, dx = (x - isle.cx) / isle.rx, dz = (z - isle.cz) / isle.rz;
  return Math.hypot(dx, dz) + (noise(x * 0.018 + 20, z * 0.018) - 0.5) * 0.13
    + Math.exp(-(((x + 115) / 42) ** 2 + ((z - 718) / 25) ** 2)) * 0.14
    - Math.exp(-(((x - 120) / 55) ** 2 + ((z - 660) / 18) ** 2)) * 0.13;
}
function raw(x, z) {
  if (z > 300) {
    const isle = P.island, radius = islandE(x, z);
    if (radius > 1.18) return -4;
    let height = -4 + smooth(1.18, 0.82, radius) * 9;
    const cone = isle.cone, distance = Math.hypot(x - cone.x, z - cone.z);
    height += Math.max(0, 1 - distance / cone.r) ** 1.3 * 50 - (1 - smooth(4, cone.craterR, distance)) * 14;
    if(distance<10)height=Math.min(height,39+distance*0.2);
    height+=Math.exp(-(((x+256)/18)**2+((z-610)/24)**2))*4;
    const strip = isle.airstrip, stripD = Math.hypot(Math.max(strip.x0 - x, 0, x - strip.x1), Math.max(Math.abs(z - strip.z) - strip.w / 2, 0));
    height = AF.lerp(strip.y, height, smooth(0, 16, stripD));
    const resort = isle.resort;
    height = AF.lerp(resort.y, height, smooth(resort.r, resort.r + 18, Math.hypot(x - resort.x, z - resort.z)));
    const landing = isle.landing;
    height = AF.lerp(landing.y, height, smooth(landing.r, landing.r + 10, Math.hypot(x - landing.x, z - landing.z)));
    return height;
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
O.hB = (bx, bz) => {
  const x = W.xOf(bx), z = W.zOf(bz), tx = Math.floor(x / 16), tz = Math.floor(z / 16), key = tx * 100000 + tz;
  let tile = tiles.get(key);
  if (!tile) {
    tile = new Int16Array(1024);
    for (let ix = 0; ix < 32; ix++) for (let iz = 0; iz < 32; iz++) tile[ix * 32 + iz] = Math.round(O.h(tx * 16 + ix * 0.5 + 0.25, tz * 16 + iz * 0.5 + 0.25) * 4);
    if (O.edgeReady) { tiles.set(key, tile); if (tiles.size > 128) tiles.delete(tiles.keys().next().value); }
  } else { tiles.delete(key); tiles.set(key, tile); }
  return tile[clamp(Math.floor((x - tx * 16) * 2), 0, 31) * 32 + clamp(Math.floor((z - tz * 16) * 2), 0, 31)];
};
O.groundY = (x, z) => O.hB(W.bx(x), W.bz(z)) * 0.25;
function colorIndex(x, z, height = O.h(x, z), slope = 0, step = 0.5) {
  if (z <= 300) {
    roadAt(x, z);
    if (tD < tHW + (tKind === 0 ? 0.6 : 0.25)) return tKind === 1 ? 12 : tKind === 2 ? 44 : tD > tHW - 0.5 ? 38 : 34 + (Math.floor(noise(x * 0.05, z * 0.05) * 4) & 3);
    riverAt(x, z); if (rivD < rivHW + 3.5 && height < rivY + 1.5) return rivD < rivHW ? 43 : 42;
  }
  const patch = noise(x * 0.035 + 11, z * 0.035 - 4), tone = patch < 0.38 ? 0 : patch < 0.66 ? 1 : 2;
  if (height < -1.25) return 14;
  for (const pad of O.pads) if (pad.kind === 'hamlet' && Math.abs(x - pad.x) < pad.rx && Math.abs(z - pad.z) < pad.rz) {
    if (Math.abs(x - pad.x) < 2 || Math.abs(z - pad.z) < 2) return 12;
    return O.dryWeight(x, z) > 0.5 ? [29, 30, 31][tone] : patch < 0.55 ? 23 : 15;
  } else if (pad.face && Math.abs(x - pad.x) < pad.rx && Math.abs(z - pad.z) < pad.rz) return (x - pad.x) * pad.face[0] + (z - pad.z) * pad.face[1] > -1 ? 34 + (Math.floor(noise(x * 0.05, z * 0.05) * 4) & 3) : [23, 15, 45][tone];
  if (z > 300) { const strip = P.island.airstrip; if (x >= strip.x0 && x <= strip.x1 && Math.abs(z - strip.z) < strip.w / 2) return 6; return islandE(x, z) > 0.78 ? 4 : height > 28 ? 2 : 0; }
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
O.colTop = (x, z, height, slope, step) => pal[colorIndex(x, z, height, slope, step)];
O.colSide = (x, z, height = O.h(x, z)) => pal[height > 70 ? ((Math.floor(height / 12 + noise(x * 0.04, z * 0.04)) % 3 + 3) % 3 === 0 ? 19 : 20) : 8];
O.colorAt = (x, z) => hex[colorIndex(x, z)];
O.biome = (x, z) => O.h(x, z) < -1.25 ? 'sea' : z > 300 ? 'island' : z < -300 ? Math.abs(x + 40) < 110 && z > -710 ? 'valley' : O.jungle(x, z) > 0.5 ? 'jungle' : 'range' : x < -660 ? 'farmland' : O.dryWeight(x, z) > 0.5 ? 'desert' : 'forest';
O.waterY = (x, z) => {
  for (const lake of waters) if (Math.abs(x - lake.cx) <= lake.rx * 1.08 && Math.abs(z - lake.cz) <= lake.rz * 1.08 && waterE(x, z, lake) <= 1.04) return lake.waterY;
  if (z <= 300) { riverAt(x, z); if (rivD < rivHW + 0.4) return rivY; }
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
  if (z > 300) return -Infinity;
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
  const quantum = step <= 1 ? step * 0.5 : step * 0.75, height = Math.round(O.h(x, z) / quantum) * quantum;
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
  const natural = Math.round(O.h(x, z) * 4) / 4;
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
O.riverInfo = (x, z) => { riverAt(x, z); return { d: rivD, y: rivY, hw: rivHW }; };
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
      riverSegs.push(segment);
      for (let ix = Math.floor((Math.min(a[0], b[0]) - 100) / 64); ix <= Math.floor((Math.max(a[0], b[0]) + 100) / 64); ix++) for (let iz = Math.floor((Math.min(a[1], b[1]) - 100) / 64); iz <= Math.floor((Math.max(a[1], b[1]) + 100) / 64); iz++) {
        const key = ix * 10000 + iz; let bucket = riverGrid.get(key); if (!bucket) { bucket = []; riverGrid.set(key, bucket); } bucket.push(segment);
      }
    }
    const middle = pts[Math.floor(pts.length / 2)]; AF.addLabel(spec.name, middle[0], middle[1], 'place');
  }
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
    segments.push(segment); acc += segment.length;
    const x0 = Math.floor((Math.min(segment.x, segment.x + segment.dx) - 44) / 64), x1 = Math.floor((Math.max(segment.x, segment.x + segment.dx) + 44) / 64);
    const z0 = Math.floor((Math.min(segment.z, segment.z + segment.dz) - 44) / 64), z1 = Math.floor((Math.max(segment.z, segment.z + segment.dz) + 44) / 64);
    for (let ix = x0; ix <= x1; ix++) for (let iz = z0; iz <= z1; iz++) { const key = ix * 10000 + iz; let bucket = roadGrid.get(key); if (!bucket) { bucket = []; roadGrid.set(key, bucket); } bucket.push(segment); }
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
for (const entry of [['Solace Range', 220, -780], ['Park Valley', -40, -440], ['Lake Tamsin', -40, -650], ['Westmoor', -1000, -100], ['Eastwood', 800, -160], ['Serena Isle', -60, 600], ['Tamsin Jungle', 715, -375]]) AF.addLabel(entry[0], entry[1], entry[2]);
AF.addLabel('Mirror Lake', 828, -198);
AF.addLabel('Ochre Flats', 930, 70);
for (const road of P.roads) { const point = road.points[1]; AF.addLabel(road.name, point[0], point[1], 'street'); }
} catch (e) { AF.partError('07-outland.js', e); }