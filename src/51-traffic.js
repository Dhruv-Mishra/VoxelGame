// ================================================================ 51-traffic.js
try {
const VV = AF.vehicles, VP = AF.PLAN, rnd = AF.rng(1952), PP = { x: 0, z: 0, dx: 0, dz: 1 };
const G = VV.graph = { nodes: [], lanes: [], conns: [], pieces: [] }, routes = VV.routes = [];
function piece(pts, opts) {
  const cum = [0]; for (let index = 2; index < pts.length; index += 2) cum.push(cum[cum.length - 1] + Math.hypot(pts[index] - pts[index - 2], pts[index + 1] - pts[index - 1]));
  const pc = Object.assign({ id: G.pieces.length, pts, cum, len: cum[cum.length - 1], next: [], head: null, tail: null, stops: [] }, opts); G.pieces.push(pc); return pc;
}
const pieceAt = VV.pieceAt = (pc, s, out) => {
  let index = 1; while (index < pc.cum.length - 1 && pc.cum[index] < s) index++;
  const start = (index - 1) * 2, dx = pc.pts[start + 2] - pc.pts[start], dz = pc.pts[start + 3] - pc.pts[start + 1], length = pc.cum[index] - pc.cum[index - 1] || 1, fraction = AF.clamp((s - pc.cum[index - 1]) / length, 0, 1);
  out.x = pc.pts[start] + dx * fraction; out.z = pc.pts[start + 1] + dz * fraction; out.dx = dx / length; out.dz = dz / length; return out;
};
function buildGraph() {
  const roads = VP.roads, points = [];
  const node = (x, z) => { let found = points.find(point => Math.hypot(point.x - x, point.z - z) < 0.05); if (!found) { found = { id: points.length, x, z, inL: [], outL: [], w: 10, owner: null, candidate: null, light: null }; points.push(found); } return found; };
  for (const road of roads) { node(...road.a); node(...road.b); }
  for (let index = 0; index < roads.length; index++) for (let other = index + 1; other < roads.length; other++) {
    const first = roads[index], second = roads[other], dx = first.b[0] - first.a[0], dz = first.b[1] - first.a[1], ex = second.b[0] - second.a[0], ez = second.b[1] - second.a[1], cross = dx * ez - dz * ex;
    if (Math.abs(cross) < 0.001) continue;
    const rx = second.a[0] - first.a[0], rz = second.a[1] - first.a[1], along = (rx * ez - rz * ex) / cross, across = (rx * dz - rz * dx) / cross;
    if (along >= 0 && along <= 1 && across >= 0 && across <= 1) node(first.a[0] + dx * along, first.a[1] + dz * along);
  }
  G.nodes = points;
  for (const point of points) {
    point.light = AF.trafficLight?.lights.find(light => Math.hypot(point.x - light.x, point.z - light.z) < 0.1) || null;
    for (const road of roads) {
      const dx = road.b[0] - road.a[0], dz = road.b[1] - road.a[1], length = Math.hypot(dx, dz), s = ((point.x - road.a[0]) * dx + (point.z - road.a[1]) * dz) / length;
      if (s >= -0.05 && s <= length + 0.05 && Math.abs((point.x - road.a[0]) * dz - (point.z - road.a[1]) * dx) / length < 0.05) point.w = Math.max(point.w, road.w);
    }
  }
  for (const road of roads) {
    const dx = road.b[0] - road.a[0], dz = road.b[1] - road.a[1], length = Math.hypot(dx, dz), cuts = [];
    for (const point of points) { const s = ((point.x - road.a[0]) * dx + (point.z - road.a[1]) * dz) / length; if (s >= -0.05 && s <= length + 0.05 && Math.abs((point.x - road.a[0]) * dz - (point.z - road.a[1]) * dx) / length < 0.05) cuts.push({ point, s }); }
    cuts.sort((first, second) => first.s - second.s);
    for (let index = 1; index < cuts.length; index++) for (let direction = 0; direction < 2; direction++) {
      const A = cuts[index - 1 + direction].point, B = cuts[index - direction].point, length = Math.hypot(B.x - A.x, B.z - A.z); if (length < 0.1 || A.outL.some(lane => lane.B === B)) continue;
      const ux = (B.x - A.x) / length, uz = (B.z - A.z) / length, off = road.w >= 20 ? 6.5 : road.w >= 14 ? 3.2 : 2.2, sa = Math.min(length * 0.25, A.w / 2 + 4.5), sb = Math.min(length * 0.25, B.w / 2 + 4.5);
      const pc = piece([A.x + ux * sa - uz * off, A.z + uz * sa + ux * off, B.x - ux * sb - uz * off, B.z - uz * sb + ux * off], { kind: 'lane', A, B, dx: ux, dz: uz, axis: Math.abs(ux) > Math.abs(uz) ? 'x' : 'z', name: road.name }); A.outL.push(pc); B.inL.push(pc); G.lanes.push(pc);
    }
  }
  for (const point of points) for (const from of point.inL) for (const to of point.outL) {
    const uturn = to.B === from.A; if (uturn && point.outL.length > 1) continue;
    const dot = from.dx * to.dx + from.dz * to.dz, turn = uturn ? 'u' : dot > 0.9 ? 'straight' : from.dx * to.dz - from.dz * to.dx > 0 ? 'right' : 'left';
    const sx = from.pts[2], sz = from.pts[3], ex = to.pts[0], ez = to.pts[1], bend = uturn ? 4 : Math.hypot(ex - sx, ez - sz) * 0.5, pts = [], samples = turn === 'straight' ? 1 : 12;
    for (let index = 0; index <= samples; index++) { const fraction = index / samples, rest = 1 - fraction; pts.push(rest ** 3 * sx + 3 * rest * rest * fraction * (sx + from.dx * bend) + 3 * rest * fraction * fraction * (ex - to.dx * bend) + fraction ** 3 * ex, rest ** 3 * sz + 3 * rest * rest * fraction * (sz + from.dz * bend) + 3 * rest * fraction * fraction * (ez - to.dz * bend) + fraction ** 3 * ez); }
    const pc = piece(pts, { kind: 'conn', node: point, from, to, turn, turnV: turn === 'straight' ? 12 : uturn ? 3 : 5, next: [to] }); from.next.push(pc); G.conns.push(pc);
  }
  for (const lane of G.lanes) { for (const stop of AF.busStops || []) bindStop(lane, stop, 'bus', 7, 4.5); for (const stop of VV.cabDrops || []) bindStop(lane, stop, 'cab', 6, 9); lane.stops.sort((first, second) => first.s - second.s); }
}
function bindStop(lane, stop, kind, dwell, radius) { const dx = stop.x - lane.pts[0], dz = stop.z - lane.pts[1], s = dx * lane.dx + dz * lane.dz, lateral = dz * lane.dx - dx * lane.dz; if (s > 1 && s < lane.len - 6 && lateral > 0.5 && lateral < radius) lane.stops.push({ s, dwell, kind, target: stop }); }
function pickNext(pc) { if (!pc.next.length) return null; if (rnd() < 0.55) for (const option of pc.next) if (option.turn === 'straight') return option; return pc.next[Math.floor(rnd() * pc.next.length)]; }
function attach(car, pc, s, speed = 9) {
  car.parked = false; car.active = true; car.ai = { piece: pc, s, v: 0, v0: speed, next: pickNext(pc), ahead: null, behind: null, wait: 0, dwell: 0, served: -1, cd: 0, acc: 0, node: null };
  VV.ai.push(car); pieceAt(pc, s, PP); car.x = PP.x; car.z = PP.z; car.yaw = Math.atan2(PP.dx, PP.dz);
}
function unlink(car) {
  const A = car.ai, pc = A.piece;
  if (A.behind) A.behind.ai.ahead = A.ahead; else if (pc.tail === car) pc.tail = A.ahead;
  if (A.ahead) A.ahead.ai.behind = A.behind; else if (pc.head === car) pc.head = A.behind;
  A.ahead = A.behind = null;
}
function enqueue(car) {
  const A = car.ai, pc = A.piece; let behind = pc.head; while (behind && behind.ai.s > A.s) behind = behind.ai.behind;
  A.behind = behind; A.ahead = behind ? behind.ai.ahead : pc.tail;
  if (A.ahead) A.ahead.ai.behind = car; else pc.head = car;
  if (behind) behind.ai.ahead = car; else pc.tail = car;
}
VV.detachTraffic = car => { if (!car.ai) return; unlink(car); if (car.ai.node?.owner === car) car.ai.node.owner = null; };
const heads = new Int32Array(256), links = new Int32Array(1024), ox = new Float64Array(1024), oz = new Float64Array(1024), oy = new Float64Array(1024), radius = new Float32Array(1024);
let obstacleCount = 0, frame = 0, cabSwapT = 0, accumulated = 0;
const PERIOD = 1 / 15;
const hash = (x, z) => (Math.imul(x, 73856093) ^ Math.imul(z, 19349663)) & 255;
function obstacle(x, y, z, size) {
  const cam = AF.camera.position; if (obstacleCount === links.length || !Number.isFinite(x) || (x - cam.x) ** 2 + (z - cam.z) ** 2 > 4900) return;
  const slot = obstacleCount++, bucket = hash(Math.floor(x / 8), Math.floor(z / 8)); ox[slot] = x; oz[slot] = z; oy[slot] = y || 0; radius[slot] = size; links[slot] = heads[bucket]; heads[bucket] = slot;
}
function rebuild() {
  heads.fill(-1); obstacleCount = 0; const player = AF.player; if (player && AF.mode === 'walk') obstacle(player.x, player.y, player.z, 0.4);
  for (const car of VV.cars) if (!car.ai && car.active !== false) obstacle(car.x, car.y, car.z, car.halfL);
  if (AF.people) for (const person of AF.people) if (!person.hidden && person.visible !== false) obstacle(person.x, person.y, person.z, 0.6);
  const walkers = AF.rail?.walkers?.list; if (walkers) for (const person of walkers) if (person.st === 'walk') obstacle(person.x, person.y, person.z, 0.8);
  for (const pc of G.pieces) pc.head = pc.tail = null;
  for (const car of VV.ai) if (car.ai && car.active !== false) { car.ai.ahead = car.ai.behind = null; enqueue(car); }
  for (const point of G.nodes) { point.candidate = null; if (point.owner && (!point.owner.ai || point.owner.active === false)) point.owner = null; }
}
function localGap(car, gap) {
  const hx = Math.sin(car.yaw), hz = Math.cos(car.yaw), cx = Math.floor(car.x / 8), cz = Math.floor(car.z / 8);
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) for (let slot = heads[hash(cx + dx, cz + dz)]; slot >= 0; slot = links[slot]) { const rx = ox[slot] - car.x, rz = oz[slot] - car.z, along = rx * hx + rz * hz; if (along > 0 && along < 16 && Math.abs(oy[slot] - car.y) < 2 && Math.abs(rx * hz - rz * hx) < car.halfW + Math.min(1, radius[slot])) gap = Math.min(gap, along - car.halfL - radius[slot]); }
  return gap;
}
function exitGap(car, pc) { const tail = pc?.tail; return tail && tail !== car ? tail.ai.s - tail.halfL - car.halfL - 1.2 : Infinity; }
function green(pc) { return !pc.B.light || AF.trafficLight.stateAt(pc.B.light, pc.axis) === 'green'; }
function selectBoxes(dt) {
  for (const point of G.nodes) if (point.owner) {
    const owner = point.owner, A = owner.ai, pc = A.piece; point.age = (point.age || 0) + dt;
    if (pc.kind === 'lane' && pc.B === point && A.s <= pc.len - owner.halfL - 0.2 && (!green(pc) || (point.age > 3 && A.v < 0.05))) { point.owner = null; A.node = null; }
  }
  for (const lane of G.lanes) {
    const car = lane.head; if (!car || !car.ai.next || lane.len - car.ai.s > car.halfL + 12) continue;
    const A = car.ai, point = lane.B; A.wait += dt;
    if (!point.owner && A.wait > 12 && exitGap(car, A.next.to) < car.halfL * 2 + 2) for (const option of lane.next) if (exitGap(car, option.to) >= car.halfL * 2 + 2) { A.next = option; break; }
    if (point.owner || lane.len - A.s > car.halfL + 3 || !green(lane) || exitGap(car, A.next.to) < car.halfL * 2 + 2) continue;
    const first = point.candidate; if (!first || A.wait > first.ai.wait || (A.wait === first.ai.wait && car.id < first.id)) point.candidate = car;
  }
  for (const point of G.nodes) if (!point.owner && point.candidate) { point.owner = point.candidate; point.age = 0; point.owner.ai.node = point; }
}
function aiStep(car, dt, near = false) {
  const A = car.ai; let pc = A.piece, gap = Infinity, target = A.v0, remaining = pc.len - A.s, changed = false;
  if (A.pushT > 0) { A.pushT = Math.max(0, A.pushT - dt); VV.stepPush(car, dt); return; }
  const leader = A.ahead;
  if (leader) gap = leader.ai.s - A.s - car.halfL - leader.halfL - 1.2;
  else if (A.next) { gap = remaining + exitGap(car, A.next); if (pc.kind === 'lane') { gap = Math.min(gap, remaining + A.next.len + exitGap(car, A.next.to)); target = Math.min(target, Math.sqrt(A.next.turnV ** 2 + 4.4 * Math.max(0, remaining - 1))); if (pc.B.owner !== car) gap = Math.min(gap, remaining - car.halfL - 0.3); } }
  else gap = Math.min(gap, remaining);
  if (pc.kind === 'conn') target = Math.min(target, pc.turnV); if (near) gap = localGap(car, gap);
  A.cd = Math.max(0, (A.cd || 0) - dt);
  if (A.dwell > 0) { A.dwell = Math.max(0, A.dwell - dt); target = 0; }
  else for (let index = 0; index < (pc.stops?.length || 0); index++) {
    const stop = pc.stops[index]; if (index === A.served || stop.s < A.s - 0.1 || (stop.kind === 'bus' && car.type.id !== 'bus') || (stop.kind === 'cab' && (!car.type.cab || A.cd > 0 || stop.target.cd > VV.clockT))) continue;
    gap = Math.min(gap, stop.s - A.s);
    if (stop.s - A.s < 0.1 && A.v < 0.2) { A.dwell = stop.dwell; A.served = index; A.cd = stop.kind === 'cab' ? 80 : 0; if (stop.kind === 'cab') { stop.target.cd = VV.clockT + 30; riders(car, stop.target); } else if (stop.kind === 'bus') riders(car); } break;
  }
  target = Math.min(target, Math.sqrt(8 * Math.max(0, gap))); A.v = Math.max(0, Math.min(target, A.v + 2.6 * dt));
  const travel = Math.min(A.v * dt, Math.max(0, gap)); A.s += travel; car.v = dt > 0 ? travel / dt : A.v;
  while (A.next && A.s >= pc.len) { unlink(car); A.s -= pc.len; pc = A.piece = A.next; A.next = pickNext(pc); A.served = -1; A.wait = 0; enqueue(car); changed = true; }
  if (A.node && pc.kind === 'lane' && A.s > car.halfL + 2) { if (A.node.owner === car) A.node.owner = null; A.node = null; }
  pieceAt(pc, A.s, PP); const yaw = Math.atan2(PP.dx, PP.dz), turn = AF.angDiff(car.yaw, yaw); car.steer = AF.clamp(Math.atan(car.wheelbase * turn / Math.max(0.1, travel)), -0.6, 0.6); car.yaw = yaw;
  if (Math.abs(A.offsetX || 0) + Math.abs(A.offsetZ || 0) > 0.01) { const decay = Math.exp(-dt * 0.75), x = PP.x + A.offsetX * decay, z = PP.z + A.offsetZ * decay; if (!VV.worldHits(car, x, z, yaw)) { car.x = x; car.z = z; } A.offsetX = car.x - PP.x; A.offsetZ = car.z - PP.z; }
  else { car.x = PP.x; car.z = PP.z; }
  VV.stepPush(car, dt); if (changed) car.y = AF.surfaceBelow(car.x, car.z, car.y + 2.5, 6); else if (car.renderNear && (frame + car.id) % 4 === 0) car.y += (AF.surfaceBelow(car.x, car.z, car.y + 1.2, 2.5) - car.y) * 0.5;
}
function riders(car, stop) {
  const walkers = AF.rail?.walkers, cam = AF.camera.position; if (!walkers?.spawn || (car.x - cam.x) ** 2 + (car.z - cam.z) ** 2 > 62500) return;
  const hx = Math.sin(car.yaw), hz = Math.cos(car.yaw), lateral = car.halfW + 1.8;
  const along = stop ? -0.4 : -car.halfL + 0.5, count = 1 + (rnd() < (stop ? 0.4 : 0.5) ? 1 : 0);
  for (let index = 0; index < count; index++) walkers.spawn(car.x + hx * along - hz * (car.halfW - 0.3), car.z + hz * along + hx * (car.halfW - 0.3), car.yaw, { y: car.y + (stop ? 0.3 : 0.45), path: [car.x + hx * (along - index * 0.6) - hz * lateral, car.z + hz * (along - index * 0.6) + hx * lateral, stop ? stop.x : car.x + hx * (12 + rnd() * 14) - hz * lateral, stop ? stop.z : car.z + hz * (12 + rnd() * 14) + hx * lateral, stop ? stop.ix : car.x + hx * 26 - hz * lateral, stop ? stop.iz : car.z + hz * 26 + hx * lateral], wait: 0.8 + index * 1.3, onEnd: walkers.off });
  if (!stop && rnd() < 0.55) walkers.spawn(car.x - hx * (car.halfL + 9) - hz * lateral, car.z - hz * (car.halfL + 9) + hx * lateral, car.yaw, { path: [car.x + hx * along - hz * (car.halfW + 1), car.z + hz * along + hx * (car.halfW + 1), car.x + hx * along - hz * (car.halfW - 0.6), car.z + hz * along + hx * (car.halfW - 0.6)], v: 2.6, wait: 1.5, onEnd: walkers.off });
}
VV.clockT = 0; VV.aiStep = aiStep;
VV.simTraffic = dt => {
  VV.clockT += dt; const cam = AF.camera.position;
  if ((cabSwapT -= dt) <= 0) { cabSwapT = 3; VV.nightCabs(); }
  accumulated += dt; VV.renderAlpha = accumulated / PERIOD; if (accumulated + 1e-9 < PERIOD) return;
  accumulated = Math.max(0, accumulated - PERIOD); VV.renderAlpha = Math.min(1, accumulated / PERIOD); dt = PERIOD; frame++;
  for (const route of routes) { const distance = Math.max(route.minX - cam.x, 0, cam.x - route.maxX) ** 2 + Math.max(route.minZ - cam.z, 0, cam.z - route.maxZ) ** 2, active = distance <= route.activeRadius ** 2; for (const car of route.cars) if (car.ai) { car.active = active; if (!active) car.ai.acc = 0; } }
  rebuild(); selectBoxes(dt);
  for (const car of VV.ai) { if (!car.ai || car.active === false) continue; const A = car.ai, distance = (car.x - cam.x) ** 2 + (car.z - cam.z) ** 2; A.acc += dt; if (distance > 57600 && ((frame + car.id) & (car.inView ? 3 : 7))) continue; car.prevX = car.x; car.prevZ = car.z; car.prevYaw = car.yaw; car.renderNear = distance <= 57600; aiStep(car, Math.min(A.acc, 0.6), distance <= 3600); A.acc = 0; }
  for (const car of VV.cars) if (!car.ai && !car.player && car.pushLife > 0) VV.stepPush(car, dt);
};
VV.buildTraffic = () => {
  const initial = VV.ai.length;
  buildGraph(); const spawnRnd = AF.rng(777), lanes = G.lanes.filter(lane => lane.len > 20), types = ['taxi', 'sedan', 'bus', 'coupe', 'gullcab', 'stream', 'milk', 'sedan', 'wagon', 'police', 'taxi', 'sedan', 'beaconcab', 'icecream', 'sedan', 'mail', 'coupe', 'taxi', 'laundry', 'stream', 'pickup', 'convertible', 'sedan', 'bus', 'gullcab', 'wagon', 'sedan', 'taxi', 'coupe', 'sedan', 'cord', 'duesy', 'speedster'], cumulative = []; let total = 0, tries = 0, horses = 0, bikes = 0;
  for (const lane of lanes) cumulative.push(total += lane.len * (/Grand|Meridian/.test(lane.name) ? 6 : /Park Row|Harbour Boulevard/.test(lane.name) ? 4 : /Terminal|Lantern|Broad|Charter|Bay/.test(lane.name) ? 1.4 : 1));
  while (VV.ai.length < initial + (VV.AI_N || 150) && tries++ < 6000) {
    const roll = spawnRnd() * total; let index = 0; while (cumulative[index] < roll) index++;
    const lane = lanes[index], s = 6 + spawnRnd() * Math.max(0, lane.len - 12); pieceAt(lane, s, PP); if (VV.cars.some(car => Math.hypot(car.x - PP.x, car.z - PP.z) < car.halfL + 6)) continue;
    const cityIndex = VV.ai.length - initial, tid = cityIndex % 29 === 11 && bikes < 2 ? 'sidecar' : cityIndex % 23 === 5 && horses < 3 && !/Grand|Meridian/.test(lane.name) ? (horses === 1 ? 'icecart' : 'dairycart') : types[cityIndex % types.length];
    const type = VV.TYPES.find(type => type.id === tid), car = VV.makeCar(type.id, VV.pickPaint(type, spawnRnd), PP.x, PP.z, Math.atan2(PP.dx, PP.dz)); attach(car, lane, s, type.horse ? 2.8 : type.big ? 8 : 8.5 + spawnRnd() * 3.5); car.driver = type.kind === 'bike' ? -1 : Math.floor(spawnRnd() * 3); if (type.horse) horses++; if (type.kind === 'bike') bikes++;
  }
};
VV.addRoute = (name, points, { count = 3, loop = true, types = ['sedan', 'taxi'], stops = [], activeRadius = 240 } = {}) => {
  if (points.length < 2 || !types.length || types.some(tid => !VV.TYPES.some(type => type.id === tid)) || !Number.isFinite(activeRadius) || activeRadius < 0 || !Number.isFinite(count)) throw new Error('Invalid traffic route');
  const pts = []; let minX = Infinity, minZ = Infinity, maxX = -Infinity, maxZ = -Infinity;
  for (const point of points) { const x = point[0] ?? point.x, z = point[1] ?? point.z; if (!Number.isFinite(x) || !Number.isFinite(z)) throw new Error('Invalid traffic route point'); if (pts.length && pts[pts.length - 2] === x && pts[pts.length - 1] === z) continue; pts.push(x, z); minX = Math.min(minX, x); maxX = Math.max(maxX, x); minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z); }
  if (pts.length < 4 || stops.some(stop => !Number.isFinite(stop.s) || !Number.isFinite(stop.dwell) || stop.s < 0 || stop.dwell < 0)) throw new Error('Invalid traffic route stops or length');
  if (loop && (pts[0] !== pts[pts.length - 2] || pts[1] !== pts[pts.length - 1])) pts.push(pts[0], pts[1]);
  const route = { name, cars: [], x: 0, z: 0, minX, maxX, minZ, maxZ, activeRadius, loop }, pc = piece(pts, { kind: 'route', route, name, stops: stops.map(stop => ({ s: stop.s, dwell: stop.dwell, kind: 'route' })).sort((first, second) => first.s - second.s) }); if (loop) pc.next.push(pc);
  for (const point of points) { route.x += (point[0] ?? point.x) / points.length; route.z += (point[1] ?? point.z) / points.length; } count = Math.min(Math.max(0, count | 0), Math.floor(pc.len / 14));
  for (let index = 0; index < count; index++) { const s = (index + 0.5) * pc.len / count; pieceAt(pc, s, PP); const type = VV.TYPES.find(type => type.id === types[index % types.length]); if (!type) throw new Error('Unknown traffic route vehicle'); const car = VV.makeCar(type.id, 0, PP.x, PP.z, Math.atan2(PP.dx, PP.dz)); attach(car, pc, s, type.horse ? 2.8 : 8); car.driver = type.kind === 'bike' ? -1 : index % 3; route.cars.push(car); }
  route.piece = pc; routes.push(route); return route;
};
function crossingCase(check) {
  const node = G.nodes.find(node => Math.abs(node.x) < 0.01 && Math.abs(node.z + 80) < 0.01), lane = node?.inL.find(lane => lane.axis === 'z'), conn = lane?.next.find(conn => conn.to.axis === 'x');
  if (!conn || !node.light) return { ok: false, info: 'missing Grand/Charter turn or signal' };
  const cars = VV.cars, ai = VV.ai, clock = AF.clock.t, owners = G.nodes.map(node => node.owner), source = cars.find(car => car.type.id === 'sedan');
  const car = Object.assign({}, source, { id: -1, interact: null, player: false, pushLife: 0, y: 0, v: 0 });
  try {
    VV.cars = [car]; VV.ai = []; for (const point of G.nodes) point.owner = null;
    attach(car, lane, lane.len - car.halfL - 0.35, 8); car.ai.next = conn;
    return check(car, lane, conn, node);
  } finally { VV.cars = cars; VV.ai = ai; AF.clock.t = clock; G.nodes.forEach((node, index) => { node.owner = owners[index]; }); rebuild(); }
}
AF.test('traffic: Grand/Charter interior crossing permits a turn', () => crossingCase((car, lane, conn, node) => {
  AF.clock.t = (lane.axis === 'x' ? 2 : 16) - node.light.off;
  for (let index = 0; index < 300 && car.ai.piece !== conn.to; index++) VV.simTraffic(1 / 30);
  return { ok: car.ai.piece === conn.to, info: `crossing ${node.inL.length}/${node.outL.length}, ${conn.turn}, reached ${car.ai.piece.name || car.ai.piece.kind}` };
}));
AF.test('traffic: red stops the car and green releases it', () => crossingCase((car, lane, conn, node) => {
  AF.clock.t = (lane.axis === 'x' ? 16 : 2) - node.light.off; const start = car.ai.s;
  for (let index = 0; index < 90; index++) VV.simTraffic(1 / 30);
  const stopped = car.ai.piece === lane && car.ai.s - start < 0.1 && car.v < 0.1;
  AF.clock.t = (lane.axis === 'x' ? 2 : 16) - node.light.off;
  for (let index = 0; index < 300 && car.ai.piece === lane; index++) VV.simTraffic(1 / 30);
  return { ok: stopped && car.ai.piece !== lane, info: `red stopped ${stopped}, green entered ${car.ai.piece !== lane}` };
}));
AF.test('traffic: AI footprints do not overlap after 60 s AF.step', () => {
  const hooks = AF.hooks.tick, render = AF.renderer.render;
  try { AF.hooks.tick = hooks.filter(hook => hook.name === 'traffic' || hook.name === 'streets-traffic-lights'); AF.renderer.render = () => {}; AF.step(1800, 1 / 30); }
  finally { AF.hooks.tick = hooks; AF.renderer.render = render; }
  let overlaps = 0, worst = 0, pair = '';
  for (let index = 0; index < VV.ai.length; index++) for (let other = index + 1; other < VV.ai.length; other++) {
    const first = VV.ai[index], second = VV.ai[other]; if (first.active === false || second.active === false || Math.abs(first.y - second.y) > 2) continue;
    const depth = VV.overlap(first, first.x, first.z, first.yaw, second);
    if (depth > 0.02) { overlaps++; if (depth > worst) { worst = depth; pair = `${first.id}/${second.id}`; } }
  }
  return { ok: overlaps === 0, info: `${overlaps} overlaps, max ${worst.toFixed(3)} m (${pair})` };
});
} catch (e) { AF.partError('51-traffic.js', e); }