try {
{
  // ===== Westgate's AI airliners: two parallel runways, one-way ground flow (OWNER: transport)
  // Arrivals land eastbound on R1 (z 152) and taxi west along the taxiway to one of three stands; departures push back onto the taxiway,
  // taxi west, cross R1 at its west end (held while an arrival is on short final) and take off eastbound from R2 (z 188), climbing away
  // in a right turn over the sea. A ground mover holds while anything sits in front of it and a pushback waits for a clear taxiway,
  // so aircraft never taxi through each other. Within 900 m: ten flights on a 360 s timetable (an arrival and a departure every 36 s),
  // eight airlines, two airframes (turboprop, regional jet) at 0.82-1.05 scale with per-instance liveries; else two flights on 480 s.
  // All aircraft = 7 InstancedMeshes; full rate within 350 m, 4 Hz beyond, nothing drawn beyond 2 km.
  const A = AF.PLAN.west.air, R1 = A.runway, R2 = A.runway2, TZ = A.taxiZ, WX = A.westX, STANDS = A.stands, PI = Math.PI;
  const PERIOD = 480, BUSY_PERIOD = 360, BUSY = 10, GAP = BUSY_PERIOD / BUSY;
  const traffic = AF.airTraffic = { period: PERIOD, flights: [], runway: -1, bridges: [false, false], busy: false, holds: 0, changes: Array.from({ length: 32 }, () => ({ index: -1, time: -1, enabled: false, oldSafe: true, newSafe: true })), changeCount: 0, visible: false };
  const AIRLINES = traffic.airlines = [
    { name: 'Solace Air', code: 'SA', a: 0x2d4a8a, b: 0x2d4a8a, c: 0xc8ccd2 }, { name: 'Isles Express', code: 'IX', a: 0x1f9e8a, b: 0xf2c21b, c: 0x1f9e8a },
    { name: 'Westmoor Wings', code: 'WW', a: 0x7a2d3a, b: 0xd9a441, c: 0x7a2d3a }, { name: 'Bay Atlantic', code: 'BA', a: 0xc8221c, b: 0x1a2a5a, c: 0xd0d4da },
    { name: 'Meridian Jet', code: 'MJ', a: 0x6a3fa0, b: 0xff8a32, c: 0x6a3fa0 }, { name: 'Coastal Connect', code: 'CC', a: 0x3a8ad8, b: 0x3a8ad8, c: 0xf4f4f4 },
    { name: 'Harbour Cargo', code: 'HC', a: 0x4f6a2a, b: 0xe8c23a, c: 0x4f6a2a }, { name: 'Serena Skyways', code: 'SS', a: 0xff6f91, b: 0x2fb5c8, c: 0xf4f4f4 },
  ];
  const pose = { x: 0, y: 0, z: 0, yaw: 0, pitch: 0, roll: 0, gear: true, phase: '' }, candidate = { x: 0, y: 0, z: 0, yaw: 0, pitch: 0, roll: 0, gear: true, phase: '' };
  const matrix = new THREE.Matrix4(), position = new THREE.Vector3(), scale = new THREE.Vector3(1, 1, 1), rotation = new THREE.Quaternion(), euler = new THREE.Euler(0, 0, 0, 'YXZ'), spin = new THREE.Matrix4();
  let models = null, strobes, docks, batches, lastFar = -1;
  const view = new THREE.Frustum(), viewMatrix = new THREE.Matrix4(), sphere = new THREE.Sphere(new THREE.Vector3(), 22);
  const nearAirport = (point, radius) => Math.max(A.x0 - point.x, 0, point.x - A.x1) ** 2 + Math.max(32 - point.z, 0, point.z - 210) ** 2 + Math.max(0, point.y - 100) ** 2 < radius * radius;
  const safe = (result, camera) => { sphere.center.set(result.x, result.y, result.z); return (result.x - camera.x) ** 2 + (result.y - camera.y) ** 2 + (result.z - camera.z) ** 2 > 2250000 && !view.intersectsSphere(sphere); };
  const rounded = (points) => {
    const samples = [], append = (x, z) => samples.push(x, z);
    append(points[0][0], points[0][1]);
    for (let index = 1; index < points.length - 1; index++) {
      const before = points[index - 1], at = points[index], after = points[index + 1], inLength = Math.hypot(at[0] - before[0], at[1] - before[1]), outLength = Math.hypot(after[0] - at[0], after[1] - at[1]);
      const radius = Math.min(7, inLength * 0.3, outLength * 0.3), ax = at[0] + (before[0] - at[0]) * radius / inLength, az = at[1] + (before[1] - at[1]) * radius / inLength, bx = at[0] + (after[0] - at[0]) * radius / outLength, bz = at[1] + (after[1] - at[1]) * radius / outLength;
      append(ax, az);
      for (let step = 1; step <= 16; step++) { const amount = step / 16, rest = 1 - amount; append(rest * rest * ax + 2 * rest * amount * at[0] + amount * amount * bx, rest * rest * az + 2 * rest * amount * at[1] + amount * amount * bz); }
    }
    append(points[points.length - 1][0], points[points.length - 1][1]);
    const distances = new Float64Array(samples.length / 2);
    for (let index = 1; index < distances.length; index++) distances[index] = distances[index - 1] + Math.hypot(samples[index * 2] - samples[index * 2 - 2], samples[index * 2 + 1] - samples[index * 2 - 1]);
    return { points: new Float64Array(samples), distances, length: distances[distances.length - 1] };
  };
  const along = (path, amount, result) => {
    const distance = Math.max(0, Math.min(1, amount)) * path.length, lengths = path.distances, points = path.points;
    let low = 1, high = lengths.length - 1;
    while (low < high) { const middle = (low + high) >> 1; if (lengths[middle] < distance) low = middle + 1; else high = middle; }
    const index = low, fraction = (distance - lengths[index - 1]) / (lengths[index] - lengths[index - 1]), dx = points[index * 2] - points[index * 2 - 2], dz = points[index * 2 + 1] - points[index * 2 - 1];
    result.x = points[index * 2 - 2] + dx * fraction; result.z = points[index * 2 - 1] + dz * fraction; result.yaw = Math.atan2(dx, dz);
  };
  const smooth = (amount) => amount * amount * (3 - 2 * amount);
  // one cycle (s): 0-55 final into R1, 55-70 rollout, 70.. taxi in, ..135 parked, 135-145 pushback (turning to face west), 145.. taxi
  // out, ..195 lined up on R2, 195-209 take-off roll, then a climbing right turn out to sea
  const T_TD = 55, T_IN = 70, T_PUSH = 135, T_OUT = 145, T_TO = 195, T_CLIMB = 209, LINE_X = WX + 12, ROLL = 234, CLIMB_V = 40, TURN_W = 0.07, TURN = 2.1;
  const sample = traffic.sample = (flight, time, result) => {
    result.y = 0.25; result.pitch = result.roll = 0; result.gear = true;
    if (time < T_TD) {
      const amount = time / T_TD; result.x = -2600 + 1994 * amount; result.z = R1.z; result.yaw = PI / 2;
      const distance = -606 - result.x; result.y = 0.25 + (distance > 80 ? distance * 0.0524 : 0.0524 * (2 * distance * distance / 80 - distance * distance * distance / 6400));
      result.pitch = distance < 80 ? 0.06 * (1 - distance / 80) : -0.0524; result.gear = distance < 1000; result.phase = 'arrival';
    } else if (time < T_IN) { const amount = (time - T_TD) / (T_IN - T_TD); result.x = -606 + 258 * (1.88 * amount - 0.88 * amount * amount); result.z = R1.z; result.yaw = PI / 2; result.phase = 'rollout'; }
    else if (time < T_IN + flight.tIn) { along(flight.arrival, smooth((time - T_IN) / flight.tIn), result); result.phase = 'taxi-in'; }
    else if (time < T_PUSH) { result.x = flight.stand; result.z = flight.standZ; result.yaw = PI; result.phase = 'parked'; }
    else if (time < T_OUT) { const amount = (time - T_PUSH) / (T_OUT - T_PUSH); result.x = flight.stand; result.z = flight.standZ + (TZ - flight.standZ) * smooth(amount); result.yaw = PI + PI / 2 * smooth(Math.max(0, (amount - 0.35) / 0.65)); result.phase = 'pushback'; }
    else if (time < T_OUT + flight.tOut) { along(flight.departure, smooth((time - T_OUT) / flight.tOut), result); result.phase = 'taxi-out'; }
    else if (time < T_TO) { result.x = LINE_X; result.z = R2.z; result.yaw = PI / 2; result.phase = 'lineup'; }
    else if (time < T_CLIMB) { const amount = (time - T_TO) / (T_CLIMB - T_TO); result.x = LINE_X + ROLL * (0.08 * amount + 0.92 * amount * amount); result.z = R2.z; result.yaw = PI / 2; result.pitch = Math.max(0, (amount - 0.75) * 0.48); result.y = 0.25 + Math.max(0, amount - 0.86) * 20; result.phase = 'takeoff'; }
    else {
      // right turn from east to south-south-west at TURN_W rad/s (radius CLIMB_V / TURN_W), then straight out over the sea
      const elapsed = time - T_CLIMB, turnT = TURN / TURN_W, turning = Math.min(elapsed, turnT), radius = CLIMB_V / TURN_W, heading = PI / 2 - TURN_W * turning, straight = Math.max(0, elapsed - turnT);
      result.x = LINE_X + ROLL + radius * Math.sin(TURN_W * turning) + Math.sin(heading) * CLIMB_V * straight;
      result.z = R2.z + radius * (1 - Math.cos(TURN_W * turning)) + Math.cos(heading) * CLIMB_V * straight;
      result.y = 3.05 + Math.min(900, elapsed * 7); result.yaw = heading; result.pitch = 0.12; result.roll = elapsed < turnT ? 0.22 : 0; result.gear = elapsed < 5; result.phase = 'climb';
    }
    return result;
  };
  const phaseAt = (time, offset, period = PERIOD) => ((time - offset) % period + period) % period;
  const onRunway = (runway, plane) => plane.x > runway.x0 - 30 && plane.x < runway.x1 + 30 && Math.abs(plane.z - runway.z) < runway.w / 2 + 14 && plane.y < 30;
  const hazard = (runway) => { const plane = AF.mode === 'fly' && AF.planes.cur; return !!(plane && onRunway(runway, plane)); };
  // ---------------------------------------------------------------- airframes (voxel models with three livery slots: a stripe / wing tips, b tail, c engines)
  const SLOTS = [0x020101, 0x020202, 0x020303].map((hex) => AF.col(hex, { jitter: 0, edge: 0.3 }));
  let LIVERY = null;
  const liveryMaterial = () => {
    if (LIVERY) return LIVERY;
    LIVERY = AF.mat.patchVoxel(AF.mat.voxelInst.clone(), 'air-livery'); const compile = LIVERY.onBeforeCompile;
    LIVERY.onBeforeCompile = (shader, renderer) => {
      compile(shader, renderer);
      shader.vertexShader = shader.vertexShader.replace('attribute float aPal;', 'attribute float aPal; attribute vec3 livery;').replace('vec2 pUV =', 'float liveryPal = aPal < -2.5 ? livery.z : aPal < -1.5 ? livery.y : aPal < -0.5 ? livery.x : aPal;\nvec2 pUV =').replace('mod(aPal,', 'mod(liveryPal,').replace('floor(aPal /', 'floor(liveryPal /');
    };
    return LIVERY;
  };
  const turboprop = (kit, slot, light) => {
    const { C, fuselage, wing } = kit, m = new AF.Model(118, 30, 82), g = new AF.Model(118, 30, 82), S = C(0xe4e8ee, { metal: 0.35, rough: 0.35 }), K = C(0x1a1a1a), G = C(0x2a3440, { rough: 0.1 }), cx = 59, cy = 10;
    fuselage(m, cx, cy, 2, 72, 2, 6, S, (x, y, z) => (y === 2 && z % 3 === 0 && z > 14 && z < 64 && Math.abs(x) > 4) ? G : (y === -1 && Math.abs(x) >= 5) ? slot[0] : null);
    fuselage(m, cx, cy, 72, 80, 6, 3, S, (x, y) => (y > 2 ? G : null));
    wing(m, 0, 118, cy - 3, 48, 62, S, slot[0]); wing(m, cx - 20, cx + 21, cy + 1, 2, 10, S);
    for (let y = 0; y < 12; y++) for (let z = 1; z < 10 - (y >> 1); z++) m.set(cx, cy + 1 + y, z, slot[1]);
    for (const s of [-22, 22]) { fuselage(m, cx + s, cy - 2, 50, 66, 2.5, 3, slot[2]); for (let y = 0; y < cy - 4; y++) g.set(cx + s, y, 60, K); for (let z = 58; z < 63; z++) for (let y = 0; y < 3; y++) g.set(cx + s, y, z, K); }
    for (let y = 0; y < cy - 5; y++) g.set(cx, y, 70, K); for (let z = 69; z < 72; z++) for (let y = 0; y < 2; y++) g.set(cx, y, z, K);
    m.box(0, 7, 55, 2, 9, 57, light.red); m.box(116, 7, 55, 118, 9, 57, light.green);
    return { m, g, props: [[cx - 22, cy - 2, 66.5], [cx + 22, cy - 2, 66.5]], tail: [cx, cy + 13, 3] };
  };
  const jet = (kit, slot, light) => {
    const { C, fuselage } = kit, WD = 104, LD = 88, m = new AF.Model(WD, 36, LD), g = new AF.Model(WD, 36, LD), S = C(0xf0f2f5, { metal: 0.3, rough: 0.3 }), K = C(0x1a1a1a), G = C(0x22303c, { rough: 0.1 }), N = C(0xc0c4ca, { metal: 0.7, rough: 0.3 }), cx = 52, cy = 12;
    fuselage(m, cx, cy + 1, 0, 14, 2, 6, S);
    fuselage(m, cx, cy, 14, 74, 6, 6, S, (x, y, z) => (y === 2 && z % 3 === 0 && z > 18 && z < 70 && Math.abs(x) > 4) ? G : (y >= -2 && y <= -1 && Math.abs(x) >= 5) ? slot[0] : (y <= -5 ? N : null));
    fuselage(m, cx, cy, 74, 87, 6, 2, S, (x, y, z) => (y > 1 && z > 75 && z < 80 ? G : null));
    for (let x = 0; x < WD; x++) { const d = Math.abs(x + 0.5 - cx) / (WD / 2), z1 = Math.round(54 - d * 16), z0 = Math.round(38 - d * 10), tip = d > 0.92; for (let z = z0; z < z1; z++) m.set(x, cy - 4 + (d > 0.6 ? 1 : 0), z, tip ? slot[0] : S); }
    for (const s of [-17, 17]) { fuselage(m, cx + s, cy - 7, 44, 60, 2.5, 3, slot[2]); for (let y = -1; y <= 1; y++) for (let x = -1; x <= 1; x++) m.set(cx + s + x, cy - 7 + y, 59, K); }
    for (let x = cx - 17; x <= cx + 17; x++) { const d = Math.abs(x - cx) / 17, z1 = Math.round(14 - d * 6), z0 = Math.round(5 - d * 3); for (let z = z0; z < z1; z++) m.set(x, cy + 3, z, S); }
    for (let y = 0; y < 17; y++) { const z0 = 1 + Math.round(y * 0.75), z1 = 17 - Math.round(y * 0.2); for (let z = z0; z < z1; z++) m.set(cx, cy + 5 + y, z, slot[1]); }
    for (const s of [-7, 7]) { for (let y = 0; y < cy - 5; y++) g.set(cx + s, y, 46, K); for (let z = 44; z < 49; z++) for (let y = 0; y < 3; y++) g.set(cx + s, y, z, K); }
    for (let y = 0; y < cy - 6; y++) g.set(cx, y, 80, K); for (let z = 79; z < 82; z++) for (let y = 0; y < 2; y++) g.set(cx, y, z, K);
    m.box(0, cy - 3, 30, 2, cy - 1, 32, light.red); m.box(WD - 2, cy - 3, 30, WD, cy - 1, 32, light.green);
    return { m, g, props: [], tail: [cx, cy + 22, 3] };
  };
  const batch = (geometry, count, name, material = AF.mat.voxelInst) => { const mesh = new THREE.InstancedMesh(geometry, material, count); mesh.name = name; mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); mesh.frustumCulled = true; mesh.receiveShadow = true; mesh.customDepthMaterial = AF.mat.depthInst; mesh.matrixAutoUpdate = false; mesh.count = count; AF.scene.add(mesh); return mesh; };
  const liveryGeo = (geo) => {
    const source = geo.getAttribute('aPal'), values = new Float32Array(source.count);
    for (let index = 0; index < source.count; index++) { const value = source.getX(index), slot = SLOTS.indexOf(value); values[index] = slot < 0 ? value : -slot - 1; }
    geo.setAttribute('aPal', new THREE.BufferAttribute(values, 1));
    geo.setAttribute('livery', new THREE.InstancedBufferAttribute(new Float32Array(BUSY * 3), 3));
    return geo;
  };
  AF.onBuild('air-traffic', 641, () => {
    const kit = AF.planes.kit, C = kit.C, options = { vs: 0.25, anchor: [0.5, 0, 0.5] };
    const light = { red: C(0xff3040, { emit: 0xff2030, emitK: 2, mode: 'always' }), green: C(0x30ff80, { emit: 0x20ff60, emitK: 2, mode: 'always' }) };
    models = [turboprop, jet].map((build, index) => {
      const B = build(kit, SLOTS, light), w = B.m.w, d = B.m.d, local = (p) => new THREE.Vector3((p[0] - w / 2 + 0.5) * 0.25, p[1] * 0.25, (p[2] - d / 2) * 0.25);
      const body = batch(liveryGeo(AF.meshModel(B.m, options)), BUSY, 'air-traffic ' + (index ? 'jets' : 'turboprops'), liveryMaterial());
      const gear = batch(AF.meshModel(B.g, options), BUSY, 'air-traffic gear ' + index);
      return { body, gear, props: B.props.map(local), tail: local(B.tail), len: d * 0.25, span: w * 0.25, tris: body.geometry.index.count / 3 };
    });
    traffic.models = models;
    const props = batch(kit.propGeo(), BUSY * 2, 'air-traffic propellers');
    models[0].propMesh = props;
    const flash = new AF.Model(2, 2, 2); flash.box(0, 0, 0, 2, 2, 2, AF.westKit.glow(0xffffff, 3));
    strobes = batch(AF.meshModel(flash, { vs: 0.125, anchor: [0.5, 0.5, 0.5] }), BUSY, 'air-traffic strobes');
    const dock = new AF.Model(12, 14, 10), color = AF.col(0x394b52, { jitter: 0, rough: 0.8 });
    dock.box(0, 0, 0, 12, 14, 10, color); dock.box(1, 1, 0, 11, 13, 10, 0);
    docks = batch(AF.meshModel(dock, { vs: 0.25, anchor: [0.5, 0, 0.5] }), 2, 'air-traffic bridge bellows');
    batches = [models[0].body, models[0].gear, props, models[1].body, models[1].gear, strobes, docks];
    const names = ['Coast', 'Isles', 'Westmoor', 'Bay', 'Harbour', 'Ridge', 'Lagoon', 'Summit', 'Meridian', 'Sands'];
    for (let index = 0; index < BUSY; index++) {
      const home = index % STANDS.length, airline = AIRLINES[(index * 5 + 3) % AIRLINES.length], model = AF.hash2(index, 53) < 0.55 ? 1 : 0;
      const size = Math.min(STANDS[home].max, (model ? 0.82 : 0.86) + AF.hash2(index, 91) * 0.23), M = models[model];
      // a route to every stand this airframe fits (the stand is picked on rollout: the first free one, its own if free)
      const routes = STANDS.map((stand) => {
        if (size > stand.max) return null;
        const standZ = 84.5 + M.len * size / 2, arrival = rounded([[-348, R1.z], [-344, R1.z], [-344, TZ], [stand.x, TZ], [stand.x, standZ]]), departure = rounded([[stand.x, TZ], [WX, TZ], [WX, R2.z], [LINE_X, R2.z]]);
        return { stand: stand.x, standInfo: stand, standZ, arrival, departure, tIn: arrival.length / 7, tOut: departure.length / 8 };
      });
      M.body.geometry.attributes.livery.setXYZ(index, AF.col(airline.a, { jitter: 0.05, edge: 0.3, rough: 0.3 }), AF.col(airline.b, { jitter: 0.05, edge: 0.3, rough: 0.3 }), AF.col(airline.c, { jitter: 0.05, edge: 0.3, metal: 0.4, rough: 0.3 }));
      traffic.flights.push(Object.assign({ name: airline.code + (100 + ((index * 37 + 9) % 900)) + ' ' + names[index], airline: airline.name, index, model, size, home, si: home, routes, assigned: -1, enabled: index < 2, period: index < 2 ? PERIOD : BUSY_PERIOD, offset: index < 2 ? index * 240 : index * GAP,
        cycle: -999, delay: 0, diverted: false, pushOk: -1, rollOk: -1, goAt: 0, goX: 0, goY: 0, goZ: 0, x: 0, y: -1e4, z: 0, phase: '', p: 0, pose: { x: 0, y: -1e4, z: 0, yaw: 0, pitch: 0, roll: 0, gear: true, phase: '' } }, routes[home]));
    }
    for (const M of models) M.body.geometry.attributes.livery.needsUpdate = true;
    for (const mesh of batches) { mesh.visible = false; mesh.instanceMatrix.array.fill(0); }
  });
  // ---------------------------------------------------------------- ground separation
  // a ground mover holds while another aircraft sits within 48 m ahead of it (20 m either side); of two that face each other the
  // lower index goes. Departures hold short of R1 while an arrival is on short final or the line-up is taken; a pushback starts only
  // onto a clear taxiway; a take-off roll starts only with R2 clear.
  const GROUND = { 'taxi-in': 1, 'taxi-out': 1, pushback: 1, lineup: 1, rollout: 1, takeoff: 1 }, movers = [];
  const ahead = (f, g) => { const dx = g.pose.x - f.pose.x, dz = g.pose.z - f.pose.z, s = Math.sin(f.pose.yaw), c = Math.cos(f.pose.yaw), front = dx * s + dz * c; return front > 0 && front < 48 && Math.abs(dx * c - dz * s) < 20; };
  const blockedBy = (f) => { for (const g of movers) if (g !== f && g.phase !== 'parked' && ahead(f, g) && !(ahead(g, f) && f.index < g.index)) return g; return null; };
  const crossingBusy = () => {
    for (const g of traffic.flights) if (g.enabled && !g.diverted && g.p >= 36 && g.p < 57) return true;
    for (const g of movers) if (g.phase === 'lineup' || g.phase === 'taxi-out' && g.pose.z > R1.z) return true;
    return hazard(R1);
  };
  const taxiwayBusyAt = (f) => { for (const g of movers) if (g !== f && (g.phase === 'taxi-in' || g.phase === 'taxi-out' || g.phase === 'pushback') && Math.abs(g.pose.x - f.stand) < 60 && Math.abs(g.pose.z - TZ) < 10) return true; return false; };
  // the R1 exit (x -344) has priority: anything east of it waits while an arrival with a stand to go to is about to leave the runway
  // or is on the exit (one still waiting for a stand does not count: it would wait for the very aircraft it holds up)
  const JUNCTION_X = -344;
  const exitBusy = () => { for (const g of traffic.flights) if (g.enabled && !g.diverted && (g.p > 45 && g.p < T_IN && !standTaken(g.si, g) || g.phase === 'taxi-in' && g.pose.z > TZ + 2)) return true; return false; };
  const holdAt = (f, phase) => { f.delay += f.p - phase; traffic.holds += Math.max(0, f.p - phase); f.p = phase; sample(f, f.p, f.pose); f.phase = f.pose.phase; };
  // stands: taken while an aircraft taxis to it, sits on it or pushes back from it (or has claimed it on rollout)
  const STAND_BUSY = { 'taxi-in': 1, parked: 1, pushback: 1 };
  const standTaken = (si, f) => { for (const g of traffic.flights) if (g !== f && g.enabled && g.si === si && (STAND_BUSY[g.phase] || g.phase === 'taxi-out' && Math.abs(g.pose.x - g.stand) < 45 || g.phase === 'rollout' && g.assigned === g.cycle)) return true; return false; };
  const assignStand = (f) => {
    let pick = f.routes[f.home] && !standTaken(f.home, f) ? f.home : -1;
    for (let si = 0; si < STANDS.length && pick < 0; si++) if (f.routes[si] && !standTaken(si, f)) pick = si;
    if (pick < 0) pick = f.home;
    if (pick !== f.si) { f.si = pick; Object.assign(f, f.routes[pick]); }
  };
  const update = traffic.update = (dt, time) => {
    if (!models) return;
    const camera = AF.camera.position, farSlot = Math.floor(time * 4);
    const flying = AF.mode === 'fly' && AF.planes.cur, local = nearAirport(camera, 900) || (flying && nearAirport(flying, 900));
    traffic.busy = !!local; traffic.period = local ? BUSY_PERIOD : PERIOD;
    if (!nearAirport(camera, 2000) && !(flying && nearAirport(flying, 2000))) {
      let close = false; for (const flight of traffic.flights) if (flight.enabled && (flight.x - camera.x) ** 2 + (flight.y - camera.y) ** 2 + (flight.z - camera.z) ** 2 < 4000000) { close = true; break; }
      if (!close) { if (traffic.visible) for (const mesh of batches) mesh.visible = false; traffic.visible = false; traffic.bridges[0] = traffic.bridges[1] = false; return; }
    }
    if (!nearAirport(camera, 350) && farSlot === lastFar) return;
    const blocked1 = hazard(R1), blocked2 = hazard(R2);
    AF.camera.updateMatrixWorld(); viewMatrix.multiplyMatrices(AF.camera.projectionMatrix, AF.camera.matrixWorldInverse); view.setFromProjectionMatrix(viewMatrix);
    let dirty = false, near = false, inRange = false;
    traffic.bridges[0] = traffic.bridges[1] = false; movers.length = 0;
    // 1: timetable changes (only while the old and the new pose are both off screen), cycles, the R1 reservation and go-arounds
    for (let index = 0; index < traffic.flights.length; index++) {
      const flight = traffic.flights[index], wantedPeriod = traffic.busy ? BUSY_PERIOD : PERIOD, wantedOffset = traffic.busy ? index * GAP : index * 240, wanted = index < 2 || traffic.busy;
      const oldPhase = flight.cycle === -999 ? phaseAt(time, flight.offset, flight.period) : time - flight.offset - flight.cycle * flight.period - flight.delay;
      sample(flight, oldPhase, pose); sample(flight, phaseAt(time, wantedOffset, wantedPeriod), candidate);
      const oldSafe = !flight.enabled || safe(pose, camera), newSafe = !wanted || safe(candidate, camera);
      if ((flight.enabled !== wanted || flight.period !== wantedPeriod || flight.offset !== wantedOffset) && oldSafe && newSafe && (pose.phase === 'climb' || !flight.enabled) && (candidate.phase === 'climb' || candidate.phase === 'arrival' || !wanted)) {
        if (traffic.runway === index) traffic.runway = -1;
        const change = traffic.changes[traffic.changeCount++ % 32]; change.index = index; change.time = time; change.enabled = wanted; change.oldSafe = oldSafe; change.newSafe = newSafe;
        flight.enabled = wanted; flight.period = wantedPeriod; flight.offset = wantedOffset; flight.cycle = -999; flight.delay = 0; flight.diverted = false;
      }
      if (!flight.enabled) { flight.p = -1; flight.phase = ''; continue; }
      const cycle = Math.floor((time - flight.offset) / flight.period);
      // a new cycle starts at phase 0 (far out on final), never mid-timeline; hold time is made up on the far side of the climb-out
      if (flight.cycle === -999 || cycle < flight.cycle) { if (traffic.runway === index) traffic.runway = -1; flight.cycle = cycle; flight.delay = 0; flight.diverted = false; }
      else if (time - flight.offset - flight.cycle * flight.period - flight.delay >= flight.period) { if (traffic.runway === index) traffic.runway = -1; flight.cycle = cycle; flight.delay = Math.max(0, time - flight.offset - cycle * flight.period); flight.diverted = false; }
      else if (flight.delay > 0 && time - flight.offset - flight.cycle * flight.period - flight.delay > T_CLIMB + 60) flight.delay = Math.max(0, flight.delay - dt * 1.5);
      const phase = time - flight.offset - flight.cycle * flight.period - flight.delay;
      if (phase >= 48 && phase < T_TD && !flight.diverted) {
        if (blocked1 || traffic.runway >= 0 && traffic.runway !== index) { sample(flight, phase, pose); flight.diverted = true; flight.goAt = time; flight.goX = pose.x; flight.goY = pose.y; flight.goZ = pose.z; if (traffic.runway === index) traffic.runway = -1; }
        else traffic.runway = index;
      }
      if (traffic.runway === index && phase >= T_IN + 6) traffic.runway = -1;
      if (phase >= T_TD && phase < T_IN && flight.assigned !== flight.cycle && !flight.diverted) { assignStand(flight); flight.assigned = flight.cycle; }
      flight.p = phase; sample(flight, phase, flight.pose); flight.phase = flight.pose.phase;
      if (!flight.diverted && GROUND[flight.phase]) movers.push(flight);
    }
    // 2: ground holds. Starts first (pushback, take-off roll, leaving the runway for a stand) so a start that waits is back on its
    // stand / line-up / rollout end before anyone checks what is in front of them; then everything that moves checks its way
    for (const f of movers) {
      if (f.phase === 'taxi-in' && f.p < T_IN + 1.5 && standTaken(f.si, f)) { assignStand(f); if (standTaken(f.si, f)) holdAt(f, T_IN - 0.01); else sample(f, f.p, f.pose); }   // another free stand, or wait on the rollout end
      else if (f.phase === 'pushback' && f.pushOk !== f.cycle) { if (taxiwayBusyAt(f) || f.stand > JUNCTION_X && exitBusy()) holdAt(f, T_PUSH - 0.01); else f.pushOk = f.cycle; }
      else if (f.phase === 'takeoff' && f.rollOk !== f.cycle) {
        let busy = blocked2; for (const g of movers) if (g !== f && g.phase === 'takeoff' && g.rollOk === g.cycle) busy = true;
        if (busy) holdAt(f, T_TO - 0.01); else f.rollOk = f.cycle;
      }
    }
    for (const f of movers) {
      let wait = (f.phase === 'taxi-in' || f.phase === 'taxi-out' || f.phase === 'lineup') && !!blockedBy(f);
      if (!wait && f.phase === 'taxi-out' && f.pose.x > JUNCTION_X + 6 && f.pose.x < JUNCTION_X + 40 && Math.abs(f.pose.z - TZ) < 3 && exitBusy()) wait = true;
      if (!wait && f.phase === 'taxi-out' && f.pose.x < WX + 20 && f.pose.z > TZ + 3 && f.pose.z < R1.z - R1.w / 2 - 2 && crossingBusy()) wait = true;
      if (wait) holdAt(f, f.p - dt);
    }
    // 3: instances (each flight owns slot `index` in its airframe's batches; the other airframe's slot stays empty)
    const propMesh = models[0].propMesh;
    for (let index = 0; index < traffic.flights.length; index++) {
      const flight = traffic.flights[index], M = models[flight.model], other = models[1 - flight.model], s = flight.size, P = flight.pose;
      if (!flight.enabled) { matrix.makeScale(0, 0, 0); for (const m of models) { m.body.setMatrixAt(index, matrix); m.gear.setMatrixAt(index, matrix); } strobes.setMatrixAt(index, matrix); propMesh.setMatrixAt(index * 2, matrix); propMesh.setMatrixAt(index * 2 + 1, matrix); flight.y = -1e4; dirty = true; continue; }
      if (flight.diverted) { const elapsed = time - flight.goAt, turn = Math.min(PI / 2, elapsed * 0.05); P.x = flight.goX + 700 * Math.sin(turn); P.z = flight.goZ - 700 * (1 - Math.cos(turn)) - Math.max(0, elapsed - PI * 10) * 35; P.y = flight.goY + elapsed * 4; P.yaw = PI / 2 + turn; P.pitch = 0.11; P.roll = turn < PI / 2 ? -0.18 : 0; P.gear = elapsed < 4; P.phase = flight.phase = 'go-around'; }
      flight.x = P.x; flight.y = P.y; flight.z = P.z;
      if (P.phase === 'parked' && flight.standInfo.bridge !== undefined) traffic.bridges[flight.standInfo.bridge] = true;
      const distance2 = (P.x - camera.x) ** 2 + (P.y - camera.y) ** 2 + (P.z - camera.z) ** 2;
      if (distance2 < 6400) near = true;
      if (distance2 < 4000000 || P.phase === 'parked') inRange = true;
      if (distance2 > 22500 && farSlot === lastFar) continue;
      dirty = true;
      const show = distance2 > 4000000 ? 0 : s;
      euler.set(-P.pitch, P.yaw, P.roll, 'YXZ'); rotation.setFromEuler(euler); position.set(P.x, P.y, P.z);
      matrix.compose(position, rotation, scale.setScalar(show)); M.body.setMatrixAt(index, matrix);
      matrix.compose(position, rotation, scale.setScalar(P.gear ? show : 0)); M.gear.setMatrixAt(index, matrix);
      matrix.makeScale(0, 0, 0); other.body.setMatrixAt(index, matrix); other.gear.setMatrixAt(index, matrix);
      for (let k = 0; k < 2; k++) {
        const prop = M.props[k];
        if (!prop) { matrix.makeScale(0, 0, 0); propMesh.setMatrixAt(index * 2 + k, matrix); continue; }
        position.copy(prop).multiplyScalar(s).applyQuaternion(rotation); position.x += P.x; position.y += P.y; position.z += P.z;
        spin.makeRotationZ(P.phase === 'parked' ? 0 : time * 45); matrix.makeRotationFromQuaternion(rotation).multiply(spin); matrix.scale(scale.setScalar(show)); matrix.setPosition(position);
        propMesh.setMatrixAt(index * 2 + k, matrix);
      }
      position.copy(M.tail).multiplyScalar(s).applyQuaternion(rotation); position.x += P.x; position.y += P.y; position.z += P.z;
      matrix.compose(position, rotation, scale.setScalar(distance2 < 4000000 && time % 1.4 < 0.09 && P.phase !== 'parked' ? 1 : 0)); strobes.setMatrixAt(index, matrix);
    }
    for (let index = 0; index < 2; index++) { position.set(STANDS[index].x + 2, 1.75, 84); rotation.identity(); scale.setScalar(traffic.bridges[index] ? 1 : 0); matrix.compose(position, rotation, scale); docks.setMatrixAt(index, matrix); }
    lastFar = farSlot;
    for (const M of models) M.body.castShadow = near;
    // all aircraft beyond 2 km (and none parked): the batches cost nothing instead of seven empty draws + shadow draws
    if (models[0].body.visible !== inRange) for (const mesh of batches) mesh.visible = inRange;
    traffic.visible = inRange;
    if (dirty) for (const mesh of batches) { mesh.instanceMatrix.needsUpdate = true; mesh.computeBoundingSphere(); }   // a handful of instances: cheap
  };
  AF.onTick('air-traffic', 442, update);
  // ---------------------------------------------------------------- ground crew
  // Per stand a fuel truck (right) and a catering truck (left) wait on the service row (z 80.5, north of every nose and clear of the
  // jet bridges), drive out beside a parked aircraft's nose and back before pushback; a tug comes to the nose and pushes the aircraft
  // back; two ramp hands walk the stand while it is served. The trucks are 50-vehicles car models moved kinematically (no physics);
  // the crew are path walkers (shared instanced batches). Everything is idle beyond 350 m.
  const ROW = 80.5, SPOT = 86.3, CREW_V = 5;
  const crew = traffic.crew = [];
  const vest = (seed, pose = 'stand') => { const look = AF.peopleKit.makeLook('ticket', seed % 2 ? 'm' : 'f', 'adult', AF.rng(seed)); look.top.col = 0xff8a32; look.bottom.col = 0x26324e; look.pose = pose; return look; };
  const route = (unit, points, yaw) => { unit.path = points; unit.step = 0; unit.endYaw = yaw; };
  AF.onBuild('air-ground-crew', 662, () => {
    const VV = AF.vehicles;
    STANDS.forEach((stand, si) => {
      const x = stand.x, right = Math.min(x + 14, -314), left = x - 14, units = [];
      const add = (type, hx, side) => { const car = VV.makeCar(type, 0, hx, ROW, side > 0 ? -PI / 2 : PI / 2, { noDrive: true }); const unit = { car, side, home: [hx, ROW], x: hx, z: ROW, yaw: car.yaw, path: null, step: 0, endYaw: car.yaw, state: 'home' }; units.push(unit); return unit; };
      const fuel = add('fuel', right, 1), catering = add('catering', left, -1), tug = add('baggage', x - 8.5, 0);
      tug.home = [tug.x, ROW]; tug.yaw = tug.car.yaw = PI / 2; tug.endYaw = PI / 2;
      const hands = AF.walkers.addPath('airport-ramp-' + si, [[x - 4, 0.25, 85.5], [x - 4, 0.25, 82.5], [x + 4, 0.25, 82.5], [x + 4, 0.25, 85.5]], { count: 2, speed: 1.1, mode: 'pingpong', activeRadius: 300, looks: [vest(si * 7 + 1), vest(si * 7 + 2)] });
      hands.enabled = false;
      crew.push({ stand, fuel, catering, tug, units, hands, served: false });
    });
    AF.walkers.addPath('airport-ramp-ga', [[-604, 0.25, 101], [-562, 0.25, 101], [-524, 0.25, 101], [-490, 0.25, 101]], { count: 3, speed: 1.2, mode: 'pingpong', activeRadius: 300, looks: [vest(31), vest(32), vest(33)] });
    traffic.marshal3 = AF.walkers.addPath('airport-marshal-3', [[STANDS[2].x, 0.25, 79]], { count: 1, speed: 0, activeRadius: 230, looks: [vest(41)] });
  });
  const moveUnit = (unit, dt) => {
    const car = unit.car;
    if (unit.path && unit.step < unit.path.length) {
      const [tx, tz] = unit.path[unit.step], dx = tx - unit.x, dz = tz - unit.z, d = Math.hypot(dx, dz), stepD = CREW_V * dt;
      if (d <= stepD) { unit.x = tx; unit.z = tz; unit.step++; }
      else { unit.x += dx / d * stepD; unit.z += dz / d * stepD; unit.yaw += AF.angDiff(unit.yaw, Math.atan2(dx, dz)) * Math.min(1, dt * 6); }
      car.v = CREW_V;
    } else { unit.yaw += AF.angDiff(unit.yaw, unit.endYaw) * Math.min(1, dt * 3); car.v = 0; }
    car.x = unit.x; car.z = unit.z; car.yaw = unit.yaw; AF.vehicles.placeMesh(car);
  };
  AF.onTick('air-ground-crew', 443, (dt) => {
    if (!crew.length || !models) return;
    const camera = AF.camera.position;
    if (!nearAirport(camera, 350)) return;
    for (const C of crew) {
      const x = C.stand.x; let parked = null, pushing = null, arriving = false;
      for (const flight of traffic.flights) if (flight.enabled && flight.stand === x) { if (flight.phase === 'parked') parked = flight; else if (flight.phase === 'pushback') pushing = flight; else if (flight.phase === 'taxi-in') arriving = true; }
      const serve = !!parked && parked.p < T_PUSH - 18 && parked.p > T_IN + parked.tIn + 3;
      if (serve !== C.served) {
        C.served = serve; C.hands.enabled = serve;
        for (const unit of [C.fuel, C.catering]) {
          const sx = x + unit.side * 6.5;
          if (serve) route(unit, [[sx, ROW], [sx, SPOT]], unit.side > 0 ? -PI / 2 : PI / 2);
          else route(unit, [[sx, ROW], unit.home], unit.side > 0 ? -PI / 2 : PI / 2);
        }
      }
      // the tug: to the nose a few seconds before pushback, pinned to the nose while pushing, then home
      const tug = C.tug;
      if (pushing) {
        const P = pushing.pose, M = models[pushing.model], reach = M.len * pushing.size / 2 + 2.2;
        tug.x = P.x + Math.sin(P.yaw) * reach; tug.z = P.z + Math.cos(P.yaw) * reach; tug.yaw = P.yaw + PI; tug.state = 'push'; tug.path = null;
        tug.car.v = 1; tug.car.x = tug.x; tug.car.z = tug.z; tug.car.yaw = tug.yaw; AF.vehicles.placeMesh(tug.car);
        continue;
      }
      if (parked && parked.p > T_PUSH - 12 && tug.state !== 'nose') { tug.state = 'nose'; route(tug, [[tug.x, ROW], [x, ROW], [x, parked.standZ - models[parked.model].len * parked.size / 2 - 2.2]], 0); }
      else if (!parked && tug.state !== 'home') { tug.state = 'home'; route(tug, [[tug.x, Math.max(tug.z, 100)], [tug.home[0], 100], tug.home], PI / 2); }
      if (C.stand === STANDS[2] && traffic.marshal3) traffic.marshal3.actors[0].look.pose = arriving ? 'marshal' : 'stand';
      for (const unit of C.units) moveUnit(unit, dt);
    }
  });
  // a whole busy session simulated near the terminal, then far away; flight state (incl. poses) restored afterwards
  const simulate = (fn) => {
    const camera = AF.camera.position.clone(), quaternion = AF.camera.quaternion.clone(), runway = traffic.runway, holds = traffic.holds;
    const saved = traffic.flights.map((flight) => Object.assign({}, flight, { pose: Object.assign({}, flight.pose) }));
    try { return fn(); }
    finally { saved.forEach((flight, index) => Object.assign(traffic.flights[index], flight)); traffic.runway = runway; traffic.holds = holds; AF.camera.position.copy(camera); AF.camera.quaternion.copy(quaternion); lastFar = -1; update(0, AF.clock.t); }
  };
  AF.test('air traffic: two runways and one-way taxiing keep every aircraft apart', () => simulate(() => {
    let enabled = 0, closest = Infinity, pair = '', wrong = 0, below = 0, parkedHit = 0, departed = 0;
    AF.camera.position.set(-480, 20, 110); AF.camera.lookAt(-480, 20, 200);
    for (let time = 0; time < 2000; time += 0.1) {
      update(0.1, time);
      const on = traffic.flights.filter((flight) => flight.enabled && !flight.diverted); enabled = Math.max(enabled, on.length);
      for (const flight of on) {
        const P = flight.pose, M = models[flight.model], halfL = M.len * flight.size / 2, halfW = M.span * flight.size / 2;
        if (flight.phase === 'climb' && P.y < 4) departed++;
        if (P.y < Math.max(-1.25, AF.W.groundY(P.x, P.z)) - 0.01) below++;
        if (P.y < 2 && P.x > R1.x0 && P.x < R1.x1 && Math.abs(P.z - R1.z) < R1.w / 2 && !['rollout', 'arrival'].includes(flight.phase) && Math.abs(P.x - WX) > 8 && P.x < -352) wrong++;
        if (P.y < 2 && P.x > R2.x0 && P.x < R2.x1 && Math.abs(P.z - R2.z) < R2.w / 2 && !['takeoff', 'lineup'].includes(flight.phase) && P.x > WX + 14) wrong++;
        if (P.y < 3) for (const parked of AF.planes.list) {
          if (parked === AF.planes.cur) continue;
          const rx = Math.abs(Math.sin(P.yaw)) * halfL + Math.abs(Math.cos(P.yaw)) * halfW, rz = Math.abs(Math.cos(P.yaw)) * halfL + Math.abs(Math.sin(P.yaw)) * halfW;
          if (Math.abs(P.x - parked.home.x) < rx + parked.G.halfW && Math.abs(P.z - parked.home.z) < rz + parked.G.halfL) parkedHit++;
        }
      }
      for (let i = 0; i < on.length; i++) for (let j = i + 1; j < on.length; j++) {
        const a = on[i].pose, b = on[j].pose; if (a.y > 8 || b.y > 8) continue;
        const d = Math.hypot(a.x - b.x, a.z - b.z); if (d < closest) { closest = d; pair = on[i].phase + '/' + on[j].phase; }
      }
    }
    const tris = models.map((model) => model.tris);
    return { ok: enabled === BUSY && closest > 22 && !wrong && !below && !parkedHit && departed > 0 && tris.every((t) => t < 6000), info: 'flights ' + enabled + ', closest ' + closest.toFixed(1) + ' m (' + pair + '), off-runway ' + wrong + ', below ground ' + below + ', parked hits ' + parkedHit + ', holds ' + traffic.holds.toFixed(0) + ' s, tris ' + tris.join('/') };
  }));
  AF.test('air traffic: busy near, light far, transitions stay off-screen', () => simulate(() => {
    let nearCount = 0;
    AF.camera.position.set(-480, 20, 110); AF.camera.lookAt(-480, 20, 200);
    for (let time = 0; time < 1200; time += 0.1) { update(0.1, time); nearCount = Math.max(nearCount, traffic.flights.filter((flight) => flight.enabled).length); }
    AF.camera.position.set(700, 20, -200); AF.camera.lookAt(900, 20, -200);
    for (let time = 1200; time < 2400; time += 0.1) update(0.1, time);
    const farCount = traffic.flights.filter((flight) => flight.enabled).length;
    return { ok: nearCount === BUSY && farCount === 2 && traffic.changes.every((change) => change.oldSafe && change.newSafe), info: 'near ' + nearCount + ', far ' + farCount + ', safe changes ' + traffic.changeCount };
  }));
}
} catch (error) { AF.partError('53-airtraffic.js', error); }