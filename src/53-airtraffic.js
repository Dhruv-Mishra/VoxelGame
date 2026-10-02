try {
{
  const A = AF.PLAN.west.air, PI = Math.PI, PERIOD = 480;
  const traffic = AF.airTraffic = { period: PERIOD, flights: [], runway: -1, bridges: [false, false] };
  const pose = { x: 0, y: 0, z: 0, yaw: 0, pitch: 0, roll: 0, gear: true, phase: '' };
  const matrix = new THREE.Matrix4(), position = new THREE.Vector3(), scale = new THREE.Vector3(1, 1, 1), rotation = new THREE.Quaternion(), euler = new THREE.Euler(0, 0, 0, 'YXZ');
  let bodies, gears, props, strobes, docks, batches, model, lastFar = -1;
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
  const sample = traffic.sample = (flight, time, result) => {
    result.y = 0.25; result.pitch = result.roll = 0; result.gear = true;
    if (time < 55) {
      const amount = time / 55; result.x = -2600 + 1994 * amount; result.z = 152; result.yaw = PI / 2;
      const distance = -606 - result.x; result.y = 0.25 + (distance > 80 ? distance * 0.0524 : 0.0524 * (2 * distance * distance / 80 - distance * distance * distance / 6400));
      result.pitch = distance < 80 ? 0.06 * (1 - distance / 80) : -0.0524; result.gear = distance < 1000; result.phase = 'arrival';
    } else if (time < 70) { const amount = (time - 55) / 15; result.x = -606 + 258 * (1.88 * amount - 0.88 * amount * amount); result.z = 152; result.yaw = PI / 2; result.phase = 'rollout'; }
    else if (time < 105) { along(flight.arrival, smooth((time - 70) / 35), result); result.phase = 'taxi-in'; }
    else if (time < 180) { result.x = flight.stand; result.z = 94; result.yaw = PI; result.phase = 'parked'; }
    else if (time < 190) { result.x = flight.stand; result.z = 94 + 22 * smooth((time - 180) / 10); result.yaw = PI; result.phase = 'pushback'; }
    else if (time < 240) { along(flight.departure, smooth((time - 190) / 50), result); result.phase = 'taxi-out'; }
    else if (time < 254) { const amount = (time - 240) / 14; result.x = -352 - 266 * (0.08 * amount + 0.92 * amount * amount); result.z = 152; result.yaw = -PI / 2; result.pitch = Math.max(0, (amount - 0.75) * 0.48); result.phase = 'takeoff'; }
    else { const elapsed = time - 254, angle = Math.min(PI / 3, elapsed * 0.018), radius = 2200; result.x = -618 - radius * Math.sin(angle) - Math.max(0, elapsed - PI / 0.054) * 40 * Math.cos(PI / 3); result.z = 152 + radius * (1 - Math.cos(angle)) + Math.max(0, elapsed - PI / 0.054) * 40 * Math.sin(PI / 3); result.y = 0.25 + elapsed * 3.5; result.yaw = -PI / 2 + angle; result.pitch = 0.09; result.roll = elapsed < PI / 0.054 ? -0.12 : 0; result.gear = elapsed < 5; result.phase = 'climb'; }
    return result;
  };
  const phaseAt = (time, offset) => ((time - offset) % PERIOD + PERIOD) % PERIOD;
  const runwayUse = (time) => time >= 48 && time < 80 || time >= 240 && time < 266;
  const hazard = () => { const plane = AF.mode === 'fly' && AF.planes.cur; return !!(plane && plane.x > A.runway.x0 - 30 && plane.x < A.runway.x1 + 30 && Math.abs(plane.z - 152) < 26 && plane.y < 30); };
  const batch = (geometry, count, name) => { const mesh = new THREE.InstancedMesh(geometry, AF.mat.voxel, count); mesh.name = name; mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); mesh.frustumCulled = true; mesh.receiveShadow = true; mesh.matrixAutoUpdate = false; AF.scene.add(mesh); return mesh; };
  AF.onBuild('air-traffic', 641, () => {
    model = AF.planes.trafficGeometry();
    bodies = batch(model.body, 2, 'air-traffic bodies'); gears = batch(model.gear, 2, 'air-traffic gear'); props = batch(model.prop, 4, 'air-traffic propellers');
    const flash = new AF.Model(2, 2, 2); flash.box(0, 0, 0, 2, 2, 2, AF.westKit.glow(0xffffff, 3));
    strobes = batch(AF.meshModel(flash, { vs: 0.125, anchor: [0.5, 0.5, 0.5] }), 2, 'air-traffic strobes');
    const dock = new AF.Model(12, 14, 10), color = AF.col(0x394b52, { jitter: 0, rough: 0.8 });
    dock.box(0, 0, 0, 12, 14, 10, color); dock.box(1, 1, 0, 11, 13, 10, 0);
    docks = batch(AF.meshModel(dock, { vs: 0.25, anchor: [0.5, 0, 0.5] }), 2, 'air-traffic bridge bellows');
    batches = [bodies, gears, props, strobes, docks];
    for (let index = 0; index < 2; index++) {
      const stand = index === 0 ? -450 : -360;
      traffic.flights.push({ name: index === 0 ? 'SA109 Coast' : 'SA227 Isles', offset: index * 240, stand, cycle: -999, delay: 0, diverted: false, goAt: 0, goX: 0, goY: 0, goZ: 0, x: 0, y: 0, z: 0, phase: '', arrival: rounded([[-348, 152], [-344, 152], [-344, 124], [stand, 124], [stand, 94]]), departure: rounded([[stand, 116], [stand, 124], [-344, 124], [-344, 152], [-352, 152]]) });
    }
  });
  const update = traffic.update = (dt, time) => {
    if (!bodies) return;
    const camera = AF.camera.position, blocked = hazard(), farSlot = Math.floor(time * 4);
    let dirty = false, near = false, inRange = false;
    for (let index = 0; index < traffic.flights.length; index++) {
      const flight = traffic.flights[index], cycle = Math.floor((time - flight.offset) / PERIOD);
      if (flight.cycle === -999 || time - flight.offset - flight.cycle * PERIOD - flight.delay >= PERIOD || cycle < flight.cycle) { if (traffic.runway === index) traffic.runway = -1; flight.cycle = cycle; flight.delay = 0; flight.diverted = false; }
      let phase = time - flight.offset - flight.cycle * PERIOD - flight.delay;
      if (blocked && traffic.runway === index && phase >= 240 && phase < 254) { flight.delay += dt; phase -= dt; }
      if (phase >= 48 && phase < 55 && !flight.diverted) {
        if (blocked || traffic.runway >= 0 && traffic.runway !== index) { sample(flight, phase, pose); flight.diverted = true; flight.goAt = time; flight.goX = pose.x; flight.goY = pose.y; flight.goZ = pose.z; if (traffic.runway === index) traffic.runway = -1; }
        else traffic.runway = index;
      }
      if (!flight.diverted && phase >= 240 && phase < 266 && traffic.runway !== index) {
        const other = phaseAt(time, traffic.flights[1 - index].offset);
        if (blocked || traffic.runway >= 0 || other >= 20 && other < 80) { flight.delay += dt; phase = 240; }
        else traffic.runway = index;
      }
      if (traffic.runway === index && (phase >= 80 && phase < 240 || phase >= 266)) traffic.runway = -1;
      sample(flight, phase, pose);
      if (flight.diverted) { const elapsed = time - flight.goAt, turn = Math.min(PI / 2, elapsed * 0.05); pose.x = flight.goX + 700 * Math.sin(turn); pose.z = flight.goZ + 700 * (1 - Math.cos(turn)) + Math.max(0, elapsed - PI * 10) * 35; pose.y = flight.goY + elapsed * 4; pose.yaw = PI / 2 - turn; pose.pitch = 0.11; pose.roll = turn < PI / 2 ? 0.18 : 0; pose.gear = elapsed < 4; pose.phase = 'go-around'; }
      flight.x = pose.x; flight.y = pose.y; flight.z = pose.z; flight.phase = pose.phase;
      traffic.bridges[index] = pose.phase === 'parked';
      const distance2 = (pose.x - camera.x) ** 2 + (pose.y - camera.y) ** 2 + (pose.z - camera.z) ** 2;
      if (distance2 < 22500) near = true;
      if (distance2 < 4000000 || traffic.bridges[index]) inRange = true;
      if (distance2 > 22500 && farSlot === lastFar) continue;
      dirty = true;
      euler.set(-pose.pitch, pose.yaw, pose.roll, 'YXZ'); rotation.setFromEuler(euler); position.set(pose.x, pose.y, pose.z); scale.setScalar(distance2 > 4000000 ? 0 : 1); matrix.compose(position, rotation, scale); bodies.setMatrixAt(index, matrix);
      scale.setScalar(pose.gear && distance2 < 4000000 ? 1 : 0); matrix.compose(position, rotation, scale); gears.setMatrixAt(index, matrix);
      for (let propIndex = 0; propIndex < 2; propIndex++) { position.copy(model.props[propIndex]).applyQuaternion(rotation); position.x += pose.x; position.y += pose.y; position.z += pose.z; euler.set(-pose.pitch, pose.yaw, pose.roll, 'YXZ'); rotation.setFromEuler(euler); const spinning = pose.phase === 'parked' ? 0 : time * 45; euler.set(0, 0, spinning); matrix.makeRotationFromEuler(euler); matrix.premultiply(newRotation(rotation)); matrix.setPosition(position); if (distance2 > 4000000) matrix.scale(scale.setScalar(0)); props.setMatrixAt(index * 2 + propIndex, matrix); }
      euler.set(-pose.pitch, pose.yaw, pose.roll, 'YXZ'); rotation.setFromEuler(euler); position.set(0, 5.5, -8).applyQuaternion(rotation); position.x += pose.x; position.y += pose.y; position.z += pose.z; scale.setScalar(distance2 < 4000000 && time % 1.4 < 0.09 && pose.phase !== 'parked' ? 1 : 0); matrix.compose(position, rotation, scale); strobes.setMatrixAt(index, matrix);
      position.set(flight.stand + 2, 1.75, 84); rotation.identity(); scale.setScalar(traffic.bridges[index] ? 1 : 0); matrix.compose(position, rotation, scale); docks.setMatrixAt(index, matrix);
    }
    lastFar = farSlot;
    bodies.castShadow = gears.castShadow = props.castShadow = near;
    // all aircraft beyond 2 km (and no bridge docked): the five batches cost nothing instead of five empty draws + shadow draws
    if (bodies.visible !== inRange) bodies.visible = gears.visible = props.visible = strobes.visible = docks.visible = inRange;
    if (dirty) {
      bodies.instanceMatrix.needsUpdate = gears.instanceMatrix.needsUpdate = props.instanceMatrix.needsUpdate = strobes.instanceMatrix.needsUpdate = docks.instanceMatrix.needsUpdate = true;
      // r160 culls an InstancedMesh by its instances' bounding sphere: a handful of instances, so recomputing is cheap
      for (const mesh of batches) mesh.computeBoundingSphere();
    }
  };
  const rotationMatrix = new THREE.Matrix4();
  const newRotation = (quaternion) => rotationMatrix.makeRotationFromQuaternion(quaternion);
  AF.onTick('air-traffic', 442, update);
  AF.test('air traffic: timetable separates runway reservations and stays above ground', () => {
    let ok = traffic.flights.length === 2, minimum = Infinity, maximum = 0;
    const result = { x: 0, y: 0, z: 0, yaw: 0, pitch: 0, roll: 0, gear: true, phase: '' };
    for (let time = 0; time < PERIOD * 2; time += 0.25) {
      let occupied = 0;
      for (const flight of traffic.flights) { const phase = phaseAt(time, flight.offset); if (runwayUse(phase)) occupied++; sample(flight, phase, result); const clearance = result.y - Math.max(-1.25, AF.W.groundY(result.x, result.z)); minimum = Math.min(minimum, clearance); if (clearance < -0.01) ok = false; }
      maximum = Math.max(maximum, occupied); if (occupied > 1) ok = false;
    }
    const triangles = model ? model.body.index.count / 3 : Infinity;
    let parkedClear = true;
    for (const flight of traffic.flights) for (let time = 70; time < 240; time += 0.25) {
      sample(flight, time, result);
      for (const parked of AF.planes.list) {
        const radiusX = Math.abs(Math.sin(result.yaw)) * 10.25 + Math.abs(Math.cos(result.yaw)) * 14.75, radiusZ = Math.abs(Math.cos(result.yaw)) * 10.25 + Math.abs(Math.sin(result.yaw)) * 14.75;
        if (Math.abs(result.x - parked.home.x) < radiusX + parked.G.halfW && Math.abs(result.z - parked.home.z) < radiusZ + parked.G.halfL) parkedClear = false;
      }
    }
    return { ok: ok && triangles < 6000 && parkedClear, info: 'runway max=' + maximum + ', clearance=' + minimum.toFixed(2) + 'm, parked clear=' + parkedClear + ', body=' + triangles + ' tris' };
  });
}
} catch (error) { AF.partError('53-airtraffic.js', error); }