// ================================================================ 44-wayside.js
try {
// ===== 44-wayside: roadside stops along the Solace Ring Road (pads + driveways chosen in 07-outland 'outland-wayside'):
//       kiosks, cottages, fuel, supermarkets, a diner, a motel and a shopping centre. Merged outland props with 3 LODs
//       (44-sites geometry), parked cars as merged proxies, a few shoppers on the shared walker batches. Shops, the motel rooms
//       and the public toilets are enterable: furnished full-LOD shells with one collider per wall, closed boxes in the coarse LODs.
const O = AF.outland, WS = AF.wayside = { stats: { ready: false, props: 0, cars: 0, walkers: 0, workMs: 0, enterable: 0, toilets: 0 } };
let generator = null;
const face = (poi, along, across) => [poi.x + poi.face[0] * along + poi.face[1] * across, poi.z + poi.face[1] * along + poi.face[0] * across];
AF.onBuild('wayside-parking', 496.3, () => {
  const VV = AF.vehicles; if (!VV || !VV.placeParked) return;
  const bays = { fuel: 2, supermarket: 4, mall: 6, diner: 3, motel: 3, kiosk: 1, houses: 2 };
  for (const poi of O.wayside) {
    const n = bays[poi.kind] || 0, yaw = Math.atan2(poi.face[0], poi.face[1]);
    for (let index = 0; index < n; index++) {
      const across = (index % 2 ? 1 : -1) * (5 + Math.floor(index / 2) * 3.2), [x, z] = face(poi, poi.kind === 'houses' ? poi.rx * 0.55 : poi.rx * 0.5, across);
      try { VV.placeParked(null, x, z, yaw, { y: poi.y, seed: index * 31 + poi.x }); WS.stats.cars++; } catch (e) { AF.warnOnce('wayside parking', e); }
    }
  }
});
AF.onBuild('wayside-shoppers', 667, () => {
  if (!AF.walkers || !AF.walkers.addPath) return;
  for (const poi of O.wayside) {
    if (!['supermarket', 'mall', 'diner', 'kiosk'].includes(poi.kind)) continue;
    const y = poi.y + 0.25, points = [face(poi, 1.5, -8), face(poi, poi.rx * 0.7, -8), face(poi, poi.rx * 0.7, 8), face(poi, 1.5, 8)].map(([x, z]) => [x, y, z]);
    const count = poi.kind === 'mall' ? 4 : poi.kind === 'supermarket' ? 3 : 2;
    AF.walkers.addPath(poi.name + ' shoppers', points, { count, mode: 'loop', speed: 0.9, activeRadius: 120, luggage: 0 }); WS.stats.walkers += count;
  }
});
function* build() {
  const L = AF.outlandSites.lib, { geometry, house, lamp, picnic, color } = L, C = L.palette;
  const steel = color(0xd8dcdf, { metal: 0.6, rough: 0.3 }), glass = color(0x9fc3cf, { rough: 0.1 }), cream = color(0xefe6cf, { pat: 'stucco' }), brick = color(0x9a5440, { pat: 'brick' });
  const blue = color(0x2d5f8a), green = color(0x3f7a52), teal = color(0x2e8a7a), orange = color(0xd9772b), signW = color(0xf2efe4), roofG = color(0x5a5f63);
  const light = color(0xfff3d8, { emit: 0xfff3d8, emitK: 1.4, mode: 'always', jitter: 0 }), chill = color(0xd8eef2, { emit: 0xcfe8f0, emitK: 0.7, mode: 'always', jitter: 0 });
  const floorC = color(0xc9c4b8, { jitter: 0.25 }), white = color(0xf4f4f0, { jitter: 0.1 }), leaf = color(0x4f8a3a);
  const goods = [color(0xc8453a), color(0xe0b040), color(0x3f7fb8), color(0x5aa05a), color(0xe07a2a), color(0x8a5ab0)];
  const walls = [C.trim, cream, color(0xd9c7a0), color(0xc9d3cf), color(0xe2c4b0)], roofs = [C.slate, C.red, color(0x6a4a3a), roofG];
  const sign = function* (word, fg, bg, vs = 0.25) { return yield* geometry('sign-' + word + vs, () => AF.textModel(word, fg, { bg, pad: 1, depth: 1 }), vs, { keep: true }); };
  // enterable buildings (0.5 m voxels): make(true) = walls, a 2 m doorway in the glazed front (+z), furnished interior and the solid
  // boxes the colliders follow; make(false) = the closed box the coarse LODs are built from
  const solids = new Map();
  const enterable = function* (key, w, d, make) {
    const geo = yield* geometry(key, () => { const built = make(true); solids.set(key, built.boxes); return built.m; }, 0.5, { outer: () => make(false).m });
    return { geo, w, d, boxes: solids.get(key) };
  };
  const shell = (key, w, h, d, wall, band, roof, fill) => enterable(key, w, d, (open) => {
    const m = new AF.Model(w, h + 2, d), boxes = [[0, 0, 0, w, 1, d]], door = (w / 2 | 0) - 2, add = (x0, y0, z0, x1, y1, z1, c) => { m.box(x0, y0, z0, x1, y1, z1, c); boxes.push([x0, y0, z0, x1, y1, z1]); };
    m.box(0, 0, 0, w, 1, d, C.stone);
    if (!open) { m.box(0, 1, 0, w, h, d, wall); m.box(1, 1, d - 1, w - 1, Math.min(h - 3, 6), d, glass); m.box(door, 1, d - 1, door + 4, 5, d, C.dark); }
    else {
      m.box(1, 0, 1, w - 1, 1, d - 1, floorC);
      add(0, 1, 0, w, h, 1, wall); add(0, 1, 0, 1, h, d, wall); add(w - 1, 1, 0, w, h, d, wall);
      add(0, 1, d - 1, door, h, d, wall); add(door + 4, 1, d - 1, w, h, d, wall); add(door, 6, d - 1, door + 4, h, d, wall);
      m.box(1, 2, d - 1, door - 1, Math.min(h - 3, 6), d, glass); m.box(door + 5, 2, d - 1, w - 1, Math.min(h - 3, 6), d, glass);
      for (let x = 3; x < w - 4; x += 7) m.box(x, h - 1, 3, x + 2, h, d - 3, light);
      fill(m, add, door);
    }
    m.box(0, h - 3, d - 1, w, h - 1, d, band); m.box(0, h, 0, w, h + 1, d, roof); m.box(0, h + 1, 0, w, h + 2, 1, wall); boxes.push([0, h, 0, w, h + 1, d]);
    for (let x = 4; x < w - 4; x += 9) m.box(x, h + 1, 4, x + 3, h + 2, 7, roofG);
    return { m, boxes };
  });
  const shelves = (m, add, x0, x1, z) => { add(x0, 1, z, x1, 5, z + 2, C.trim); for (let y = 2; y < 5; y++) for (let x = x0; x < x1; x += 3) m.box(x, y, z, Math.min(x1, x + 3), y + 1, z + 2, goods[(x * 7 + y * 3 + z) % goods.length]); };
  const market = () => shell('wayside-market', 40, 12, 26, cream, green, roofG, (m, add) => {
    for (let z = 6; z <= 16; z += 5) { shelves(m, add, 4, 17, z); shelves(m, add, 23, 36, z); }
    add(2, 1, 1, 38, 6, 3, chill); m.box(2, 6, 1, 38, 7, 3, C.trim);
    for (const x of [5, 11, 27, 33]) { add(x, 1, 20, x + 3, 3, 22, C.red); m.set(x + 1, 3, 20, C.dark); }
  });
  const mallA = () => shell('wayside-mall-a', 56, 16, 30, brick, teal, roofG, (m, add) => {
    for (let index = 0; index < 5; index++) { const x = 2 + index * 11; add(x + 1, 1, 6, x + 9, 3, 8, C.wood); m.box(x + 1, 3, 1, x + 9, 6, 2, light); m.box(x, 7, 1, x + 10, 8, 9, goods[index]); }
    for (const x of [10, 25, 40]) { add(x, 1, 16, x + 6, 2, 18, C.wood); add(x + 1, 1, 21, x + 4, 3, 24, C.stone); m.box(x + 1, 3, 21, x + 4, 5, 24, leaf); }
  });
  const mallB = () => shell('wayside-mall-b', 26, 12, 40, cream, orange, roofG, (m, add) => {
    add(2, 1, 1, 24, 3, 3, orange); m.box(2, 5, 1, 24, 7, 2, light);
    for (const x of [4, 10, 16]) for (const z of [8, 16, 24, 31]) add(x, 1, z, x + 3, 2, z + 3, C.wood);
  });
  const diner = () => shell('wayside-diner', 26, 9, 14, steel, C.red, steel, (m, add) => {
    add(3, 1, 2, 23, 3, 4, C.red); m.box(3, 3, 2, 23, 4, 4, steel); m.box(3, 4, 1, 23, 6, 2, light);
    for (let x = 4; x < 23; x += 3) m.box(x, 1, 5, x + 1, 2, 6, C.dark);
    for (const x of [2, 18]) { add(x, 1, 8, x + 6, 2, 12, C.red); add(x + 1, 2, 9, x + 5, 3, 11, C.trim); }
  });
  const fuelShop = () => shell('wayside-fuel-shop', 16, 8, 12, cream, C.red, roofG, (m, add) => { shelves(m, add, 2, 9, 3); add(10, 1, 5, 14, 3, 7, C.red); });
  const motel = () => enterable('wayside-motel', 56, 14, (open) => {
    const m = new AF.Model(56, 9, 14), boxes = [[0, 0, 0, 56, 1, 14], [0, 7, 0, 56, 8, 14]], add = (x0, y0, z0, x1, y1, z1, c) => { m.box(x0, y0, z0, x1, y1, z1, c); boxes.push([x0, y0, z0, x1, y1, z1]); };
    m.box(0, 0, 0, 56, 1, 14, C.stone);
    if (!open) m.box(0, 1, 0, 56, 7, 10, cream);
    else {
      // nine rooms, each with its door ajar: a bed, a night stand and a lamp
      add(0, 1, 0, 56, 7, 1, cream);
      for (let room = 0; room <= 9; room++) add(Math.min(room * 6, 54), 1, 1, room === 9 ? 56 : room * 6 + 1, 7, 10, cream);
      for (let room = 0; room < 9; room++) {
        const a = room * 6 + 1, accent = [blue, green, orange][room % 3];
        m.box(a, 0, 1, a + 5, 1, 9, floorC);
        add(a + 2, 1, 9, a + 5, 7, 10, cream); add(a, 5, 9, a + 2, 7, 10, accent); m.box(a + 3, 3, 9, a + 5, 5, 10, C.pane);
        add(a + 1, 1, 1, a + 4, 2, 5, white); m.box(a + 1, 2, 1, a + 4, 3, 2, cream); m.box(a + 1, 1, 3, a + 4, 2, 5, accent);
        m.box(a + 4, 1, 1, a + 5, 2, 2, C.wood); m.set(a + 4, 2, 1, light); m.set(a + 2, 6, 5, light);
      }
    }
    m.box(0, 7, 0, 56, 8, 14, C.red);
    for (const x of [0, 55]) add(x, 1, 10, x + 1, 7, 14, C.trim);
    return { m, boxes };
  });
  const toilets = () => enterable('wayside-wc', 10, 8, (open) => {
    const m = new AF.Model(10, 7, 8), boxes = [[0, 0, 0, 10, 1, 8], [0, 6, 0, 10, 7, 8]], add = (x0, y0, z0, x1, y1, z1, c) => { m.box(x0, y0, z0, x1, y1, z1, c); boxes.push([x0, y0, z0, x1, y1, z1]); };
    m.box(0, 0, 0, 10, 1, 8, C.stone);
    if (!open) m.box(0, 1, 0, 10, 6, 8, cream);
    else {
      // two rooms (doors at x 1-3 and 7-9) behind a middle wall, each a WC and a basin under a ceiling light
      m.box(1, 0, 1, 9, 1, 7, white);
      add(0, 1, 0, 10, 6, 1, cream); add(0, 1, 0, 1, 6, 8, cream); add(9, 1, 0, 10, 6, 8, cream); add(4, 1, 1, 6, 6, 8, cream);
      add(3, 1, 7, 4, 6, 8, cream); add(6, 1, 7, 7, 6, 8, cream); add(1, 5, 7, 3, 6, 8, blue); add(7, 5, 7, 9, 6, 8, blue);
      for (const x of [1, 7]) { add(x, 1, 1, x + 2, 2, 3, white); m.box(x + (x === 1 ? 2 : -1), 2, 1, x + (x === 1 ? 3 : 0), 3, 2, white); m.set(x + 1, 5, 4, light); }
    }
    m.box(0, 6, 0, 10, 7, 8, roofG);
    return { m, boxes };
  });
  const wc = { supermarket: [-4, 14.5], fuel: [-6.9, 9], mall: [3, -22], diner: [-5, -9.3], motel: [5.5, -12] };
  for (const poi of O.wayside) {
    const rot = poi.rot, back = -poi.rx * 0.35, [bx, bz] = face(poi, back, 0), y = poi.y, v = Math.floor(AF.hash2(poi.x, poi.z) * 4);
    const at = (along, across, geo, opts = {}) => { const [x, z] = face(poi, along, across); const placed = O.addProp(geo, x, opts.y ?? y, z, rot, { tag: 'wayside:' + poi.name, ...opts }); poi.props.push(placed); WS.stats.props++; return placed; };
    // an enterable building: merged mesh without a bounding collider, then one collider per wall / counter (model -> world as the merge rotates)
    const enter = (along, across, built) => {
      const placed = at(along, across, built.geo, { collide: false }), tag = 'wayside:' + poi.name, turn = (x, z) => rot === 1 ? [z, -x] : rot === 2 ? [-x, -z] : rot === 3 ? [-z, x] : [x, z];
      for (const [x0, y0, z0, x1, y1, z1] of built.boxes) { const a = turn((x0 - built.w / 2) * 0.5, (z0 - built.d / 2) * 0.5), b = turn((x1 - built.w / 2) * 0.5, (z1 - built.d / 2) * 0.5); AF.addCollider(placed.x + a[0], y + y0 * 0.5, placed.z + a[1], placed.x + b[0], y + y1 * 0.5, placed.z + b[1], tag); }
      WS.stats.enterable++; return placed;
    };
    if (poi.kind === 'kiosk') {
      at(back, 0, yield* geometry('wayside-kiosk', () => { const m = new AF.Model(12, 10, 10); m.box(0, 0, 0, 12, 1, 10, C.stone); m.box(1, 1, 1, 11, 6, 8, C.wood); m.box(1, 3, 8, 11, 4, 9, C.trim); m.box(2, 4, 8, 10, 6, 9, C.pane); for (let x = 0; x < 12; x += 2) m.box(x, 7, 7, x + 1, 8, 10, C.red), m.box(x + 1, 7, 7, x + 2, 8, 10, C.trim); m.box(0, 8, 0, 12, 9, 8, C.slate); return m; }));
      const [px, pz] = face(poi, poi.rx * 0.2, 7); yield* picnic({ x: px, y, z: pz, props: poi.props, name: poi.name });
    } else if (poi.kind === 'houses') {
      for (let index = 0; index < 3; index++) { at(back, (index - 1) * 11, yield* house('wayside-house-' + ((v + index) % 4), 14, 12, 8 + (index % 2) * 2, walls[(v + index) % walls.length], roofs[(v + index * 3) % roofs.length])); yield; }
    } else if (poi.kind === 'fuel') {
      enter(back - 2, -5, yield* fuelShop());
      at(poi.rx * 0.15, 3, yield* geometry('wayside-canopy', () => { const m = new AF.Model(24, 12, 16); m.box(0, 10, 0, 24, 12, 16, C.red); for (const x of [1, 22]) for (const z of [1, 14]) m.box(x, 0, z, x + 1, 10, z + 1, C.trim); for (const x of [8, 15]) { m.box(x, 0, 7, x + 2, 5, 9, C.trim); m.box(x, 3, 9, x + 2, 4, 10, C.dark); } return m; }), { collide: false });
      yield* lamp({ x: bx, y, z: bz, props: poi.props, name: poi.name }, 8, 6);
    } else if (poi.kind === 'supermarket') {
      enter(back, 0, yield* market());
      at(back + 6.6, 0, yield* sign('MARKET', signW, [green, blue, orange][v % 3]), { y: y + 6.6, collide: false });
    } else if (poi.kind === 'mall') {
      enter(back, -6, yield* mallA()); yield;
      enter(back - 2, 16, yield* mallB()); yield;
      at(back + 4, -22, yield* geometry('wayside-mall-tower', () => { const m = new AF.Model(10, 30, 10); m.box(0, 0, 0, 10, 28, 10, cream); m.box(1, 20, 9, 9, 26, 10, glass); m.box(0, 28, 0, 10, 30, 10, teal); return m; }));
      at(back + 7.6, -6, yield* sign('SHOPPING CENTRE', signW, teal), { y: y + 8.6, collide: false });
    } else if (poi.kind === 'diner') {
      enter(back, 0, yield* diner());
      at(back + 3.6, 0, yield* sign('DINER', C.red, signW), { y: y + 5.1, collide: false });
    } else if (poi.kind === 'motel') {
      enter(back, 0, yield* motel());
      at(poi.rx * 0.6, poi.rx * 0.6, yield* geometry('wayside-motel-sign', () => { const m = new AF.Model(4, 22, 2); m.box(1, 0, 0, 3, 16, 2, C.dark); m.box(0, 16, 0, 4, 22, 2, C.red); m.box(0, 17, 0, 4, 18, 2, C.glow); return m; }));
      at(poi.rx * 0.6, poi.rx * 0.6, yield* sign('MOTEL', signW, C.red), { y: y + 7.4, collide: false });
    }
    const spot = wc[poi.kind];
    if (spot) { enter(spot[0], spot[1], yield* toilets()); at(spot[0] + 2.09, spot[1], yield* sign('WC', signW, blue, 1 / 12), { y: y + 2.2, collide: false }); WS.stats.toilets++; }
    yield;
  }
  WS.stats.ready = true;
}
const work = WS.work = (ms) => {
  if (!AF.ready || WS.stats.ready || !AF.outlandSites || !AF.outlandSites.lib) return false;
  const start = performance.now(), end = start + Math.min(ms, AF.MOBILE ? 2 : 3);
  if (!generator) generator = build();
  while (performance.now() < end && !WS.stats.ready) generator.next();
  WS.stats.workMs += performance.now() - start; return !WS.stats.ready;
};
WS.settle = () => { while (work(6)); };
AF.stream.register('outland-wayside', { order: 30, gen: true, work, near: () => AF.ready && !WS.stats.ready });
AF.test('wayside: ring road stops are furnished and parked', () => {
  WS.settle();
  const kinds = new Set(O.wayside.map((poi) => poi.kind));
  return { ok: O.wayside.length >= 6 && O.wayside.every((poi) => poi.props.length) && kinds.has('supermarket') && kinds.has('mall') && WS.stats.cars >= 8 && WS.stats.enterable >= 6 && WS.stats.toilets >= 4, info: O.wayside.length + ' stops (' + [...kinds].join(',') + '), ' + WS.stats.props + ' props, ' + WS.stats.enterable + ' enterable, ' + WS.stats.toilets + ' WCs, ' + WS.stats.cars + ' parked, ' + WS.stats.walkers + ' shoppers' };
});
} catch (e) { AF.partError('44-wayside.js', e); }
