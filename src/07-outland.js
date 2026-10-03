// ================================================================ 07-outland.js
try {
const W = AF.W, P = AF.PLAN.world, smooth = AF.smooth, clamp = AF.clamp, noise = AF.noise2;
const O = AF.outland = { bounds: P.bounds, play: P.play, props: [], pads: [], edgeReady: false };
const tiles = new Map(), edges = new Map(), segments = [], roadGrid = new Map();
const hex = [AF.PAL.hex[AF.col('grass')], 0x5d8a37, 0x6f797c, 0xf5f8f9, 0xcabe9f, 0xa19b70, 0x85916b, 0x929078, 0x807363, 0x48573d, 0x4a4a4f, 0xe8dfb5, 0xada084, 0x948166, 0x536455,
  0x88a049, 0x7da646, 0x566467, 0x807e73, 0x414d51, 0x5e574c, 0xb9ae91, 0xd4c5a6, 0x557a34, 0x7a745e, 0x8b816b, 0x8e8862, 0x747e5c, 0x867c6b,
  0xc8ac72, 0xd9bf87, 0xb29668, 0xc9a64c, 0xb18e3c];
const pal = hex.map((value) => AF.col(value, { jitter: 0.9, edge: 0, pat: 'none' }));
const waters = O.waters = [P.lake, { name: 'Mirror Lake', cx: 828, cz: -198, rx: 64, rz: 35, waterY: 13 }, { name: 'Westmoor Pond', cx: -1040, cz: -178, rx: 17, rz: 12, waterY: 8 }, { name: 'Mill Pond', cx: -912, cz: 92, rx: 23, rz: 14, waterY: 6 }];
function waterE(x, z, lake) { return Math.hypot((x - lake.cx) / lake.rx, (z - lake.cz) / lake.rz) + (noise(x * 0.045 + 2, z * 0.045) - 0.5) * 0.08; }
let fieldD = 0, fieldId = 0, fieldRow = 0, laneD = 0;
function farmAt(x, z) {
  const ux = x + z * 0.19 + (noise(x * 0.012, z * 0.012) - 0.5) * 15, uz = z - x * 0.12;
  const row = Math.floor(uz / 83), width = 65 + AF.hash2(row, 91) * 58, fx = (ux + AF.hash2(row, 7) * 80) / width;
  const phase = fx - Math.floor(fx), strip = uz - row * 83;
  fieldD = Math.min(phase * width, (1 - phase) * width, strip, 83 - strip);
  fieldId = AF.hash2(Math.floor(fx), row); fieldRow = Math.floor(ux * (fieldId > 0.5 ? 1 : 0.3) + uz * (fieldId > 0.5 ? 0.2 : 0.95)) & 1;
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
  let height = x < -660 ? 0.25 + smooth(-660, -1050, x) * (5 + noise(x * 0.006, z * 0.006) * 7 + noise(x * 0.02, z * 0.02) * 2)
    : 2 + noise(x * 0.009 + 7, z * 0.009) * 26 + noise(x * 0.021, z * 0.021) * 7;
  if (z < -300) {
    const north = smooth(-300, -880, z), wx = x + (noise(x * 0.003 + 8, z * 0.003) - 0.5) * 95, wz = z + (noise(x * 0.003 - 17, z * 0.003 + 23) - 0.5) * 85;
    const ridge = ridges(wx * 0.006 + 14, wz * 0.006 - 12), spurs = ridges(wx * 0.017 - 2, wz * 0.011 + 5);
    height = AF.lerp(height, 26 + north * (62 + 170 * ridge) + spurs * 26 * smooth(-340, -650, z), smooth(-300, -420, z));
    const valley = Math.exp(-(((x + 40) / (105 + Math.max(0, -z - 300) * 0.09)) ** 4)) * (1 - smooth(-700, -850, z));
    height = AF.lerp(height, 0.25 + smooth(-300, -610, z) * 25, valley);
  } else if (x < -690) {
    farmAt(x, z); height += (1 - smooth(0.7, 2.4, fieldD)) * 0.75;
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
  }
  if (inland < 35) {
    const beach = x < -660, shore = -1.25 + inland * (beach ? 0.16 : 0.8);
    height = Math.min(height, Math.max(-4, shore));
    if (beach && inland > 9) height += Math.sin(inland * 0.17) ** 2 * smooth(9, 30, inland) * 1.5;
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
let roadD = Infinity, roadY = 0, roadS = 0, roadKind = 0;
function roadAt(x, z, brute = false) {
  roadD = Infinity; let nearest = Infinity;
  const candidates = brute ? segments : roadGrid.get(Math.floor(x / 64) * 10000 + Math.floor(z / 64));
  if (!candidates) return;
  for (const segment of candidates) {
    const along = clamp(((x - segment.x) * segment.dx + (z - segment.z) * segment.dz) / segment.len2, 0, 1);
    const dx = x - segment.x - segment.dx * along, dz = z - segment.z - segment.dz * along, distance = dx * dx + dz * dz;
    if (distance < nearest) { nearest = distance; roadY = AF.lerp(segment.y0, segment.y1, along); roadS = segment.acc + segment.length * along; roadKind = segment.kind; }
  }
  roadD = Math.sqrt(nearest);
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
  if (z <= 300) { roadAt(x, z); if (roadD < 10) height = AF.lerp(roadY, height, smooth(5, 10, roadD)); }
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
  if (z <= 300) { roadAt(x, z); if (roadD < 5) return roadKind ? 12 : roadD < 0.35 && roadS % 10 < 4 ? 11 : 10; }
  const patch = noise(x * 0.035 + 11, z * 0.035 - 4), tone = patch < 0.38 ? 0 : patch < 0.66 ? 1 : 2;
  if (height < -1.25) return 14;
  for (const pad of O.pads) if (pad.kind === 'hamlet' && Math.abs(x - pad.x) < pad.rx && Math.abs(z - pad.z) < pad.rz) {
    if (Math.abs(x - pad.x) < 2 || Math.abs(z - pad.z) < 2) return 12;
    return O.dryWeight(x, z) > 0.5 ? [29, 30, 31][tone] : patch < 0.55 ? 23 : 15;
  }
  if (z > 300) { const strip = P.island.airstrip; if (x >= strip.x0 && x <= strip.x1 && Math.abs(z - strip.z) < strip.w / 2) return 6; return islandE(x, z) > 0.78 ? 4 : height > 28 ? 2 : 0; }
  const inland = Math.min(O.coastZ(x) - z, x - O.coastX(z), O.coastX(z, true) - x);
  if (inland < 19) return x < -660 ? [21, 4, 22][tone] : [17, 2, 18][tone];
  if (x > 610 && z > -100 && patch < O.dryWeight(x, z)) return [29, 30, 31][tone];
  if (z < -300) {
    const snowline = 185 + (noise(x * 0.017 - 9, z * 0.017) - 0.5) * 24;
    if (height > snowline && slope < 0.28 && patch > 0.45) return 3;
    if (slope > 0.48 && height > 55 || height > 124) return [17, 2, 18][(Math.floor(height / 12 + patch * 2) % 3 + 3) % 3];
    if (height > 72 && slope > 0.3) return tone === 0 ? 20 : tone === 1 ? 18 : 8;
    if (height > 78) return [15, 0, 23][tone];
    return patch < 0.4 + smooth(55, 110, height) * 0.35 ? [1, 23, 15][tone] : [15, 0, 16][tone];
  }
  if (x < -660) {
    farmAt(x, z);
    if (laneD < 2.3) return 12;
    if (fieldD < 1.6) return 9;
    return fieldId < 0.3 ? step > 1 ? 32 : fieldRow ? 32 : 33 : fieldId < 0.58 ? step > 1 ? 5 : fieldRow ? 5 : 26 : fieldId < 0.8 ? step > 1 ? 6 : fieldRow ? 6 : 27 : [15, 0, 16][tone];
  }
  return noise(x * 0.012 + 31, z * 0.012) > 0.6 ? [15, 0, 16][tone] : [24, 13, 25][tone];
}
O.colTop = (x, z, height, slope, step) => pal[colorIndex(x, z, height, slope, step)];
O.colSide = (x, z, height = O.h(x, z)) => pal[height > 70 ? ((Math.floor(height / 12 + noise(x * 0.04, z * 0.04)) % 3 + 3) % 3 === 0 ? 19 : 20) : 8];
O.colorAt = (x, z) => hex[colorIndex(x, z)];
O.biome = (x, z) => O.h(x, z) < -1.25 ? 'sea' : z > 300 ? 'island' : z < -300 ? Math.abs(x + 40) < 110 && z > -710 ? 'valley' : 'range' : x < -660 ? 'farmland' : O.dryWeight(x, z) > 0.5 ? 'desert' : 'forest';
O.waterY = (x, z) => { for (const lake of waters) if (Math.abs(x - lake.cx) <= lake.rx * 1.08 && Math.abs(z - lake.cz) <= lake.rz * 1.08 && waterE(x, z, lake) <= 1.04) return lake.waterY; return O.h(x, z) < -1.25 ? -1.25 : null; };
O.forestDensity = (x, z) => {
  if (z > 300 || O.h(x, z) < 3 || O.h(x, z) > 120 || x < -660 && z > -300) return 0;
  roadAt(x, z); if (roadD < 14 || O.waterY(x, z) !== null) return 0;
  return smooth(0.25, 0.8, noise(x * 0.015 + 30, z * 0.015)) * (1 - smooth(78, 118, O.h(x, z))) * 0.85 * (1 - O.dryWeight(x, z));
};
O.roadDistance = (x, z) => { roadAt(x, z); return roadD; };
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
AF.test('outland: new lanes avoid water and retain bounded grades', () => {
  let water = 0, city = 0, grade = 0, checked = 0;
  for (const road of P.roads.slice(3)) for (let index = 1; index < road.points.length; index++) {
    const start = road.points[index - 1], end = road.points[index], length = Math.hypot(end[0] - start[0], end[1] - start[1]), steps = Math.ceil(length / 8);
    grade = Math.max(grade, Math.abs(road.heights[index] - road.heights[index - 1]) / length);
    for (let sample = 0; sample <= steps; sample++) { const x = AF.lerp(start[0], end[0], sample / steps), z = AF.lerp(start[1], end[1], sample / steps); checked++; if (O.waterY(x, z) !== null) water++; if (W.col(x, z) >= 0) city++; }
  }
  return { ok: !water && !city && grade <= 0.120001, info: checked + ' samples, water/city ' + water + '/' + city + ', grade ' + grade };
});
AF.test('outland: south coast has coves and anchored city joins', () => {
  let lo = Infinity, hi = -Infinity;
  for (let distance = 80; distance < 550; distance += 10) { const value = O.coastZ(W.X0 - distance); lo = Math.min(lo, value); hi = Math.max(hi, value); }
  const west = Math.abs(O.coastZ(W.X0 - 0.01) - AF.land.BEACH.shore(W.X0)), east = Math.abs(O.coastZ(W.x1 + 0.01) - 210);
  return { ok: hi - lo > 35 && west < 0.01 && east < 0.01, info: 'coast range ' + (hi - lo).toFixed(1) + ', joins ' + west + '/' + east };
});
O.cacheStats = () => ({ tiles: tiles.size, bytes: tiles.size * 2048, edges: edges.size });
AF.onBuild('outland-boundary', 496, () => {
  O.edgeReady = true; tiles.clear(); edges.clear(); segments.length = 0; roadGrid.clear();
  for (const road of P.roads) {
    let acc = 0;
    if (W.col(road.points[0][0], road.points[0][1]) >= 0) road.heights[0] = W.groundY(road.points[0][0], road.points[0][1]);
    for (let index = 1; index < road.points.length; index++) {
      const start = road.points[index - 1], end = road.points[index], dx = end[0] - start[0], dz = end[1] - start[1], len2 = dx * dx + dz * dz;
      road.heights[index] = clamp(road.heights[index], road.heights[index - 1] - Math.sqrt(len2) * 0.12, road.heights[index - 1] + Math.sqrt(len2) * 0.12);
      segments.push({ x: start[0], z: start[1], dx, dz, len2, length: Math.sqrt(len2), y0: road.heights[index - 1], y1: road.heights[index], acc, kind: road.surface === 'gravel' ? 1 : 0 }); acc += Math.sqrt(len2);
    }
  }
  for (const segment of segments) {
    const x0 = Math.floor((Math.min(segment.x, segment.x + segment.dx) - 16) / 64), x1 = Math.floor((Math.max(segment.x, segment.x + segment.dx) + 16) / 64);
    const z0 = Math.floor((Math.min(segment.z, segment.z + segment.dz) - 16) / 64), z1 = Math.floor((Math.max(segment.z, segment.z + segment.dz) + 16) / 64);
    for (let ix = x0; ix <= x1; ix++) for (let iz = z0; iz <= z1; iz++) { const key = ix * 10000 + iz; let bucket = roadGrid.get(key); if (!bucket) { bucket = []; roadGrid.set(key, bucket); } bucket.push(segment); }
  }
  tiles.clear();
});
for (const entry of [['Solace Range', 220, -780], ['Park Valley', -40, -440], ['Lake Tamsin', -40, -650], ['Westmoor', -1000, -100], ['Eastwood', 800, -160], ['Serena Isle', -60, 600]]) AF.addLabel(entry[0], entry[1], entry[2]);
AF.addLabel('Mirror Lake', 828, -198);
AF.addLabel('Ochre Flats', 930, 70);
for (const road of P.roads) { const point = road.points[1]; AF.addLabel(road.name, point[0], point[1], 'street'); }
} catch (e) { AF.partError('07-outland.js', e); }