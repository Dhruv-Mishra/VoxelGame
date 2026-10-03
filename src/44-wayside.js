// ================================================================ 44-wayside.js
try {
// ===== 44-wayside: roadside stops along the Solace Ring Road (pads + driveways chosen in 07-outland 'outland-wayside'):
//       kiosks, cottages, fuel, supermarkets, a diner, a motel and a shopping centre. Merged outland props with 3 LODs
//       (44-sites geometry), parked cars as merged proxies, a few shoppers on the shared walker batches.
const O = AF.outland, WS = AF.wayside = { stats: { ready: false, props: 0, cars: 0, walkers: 0, workMs: 0 } };
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
    const y = poi.y + 0.25, points = [face(poi, -2, -8), face(poi, poi.rx * 0.7, -8), face(poi, poi.rx * 0.7, 8), face(poi, -2, 8)].map(([x, z]) => [x, y, z]);
    const count = poi.kind === 'mall' ? 4 : poi.kind === 'supermarket' ? 3 : 2;
    AF.walkers.addPath(poi.name + ' shoppers', points, { count, mode: 'loop', speed: 0.9, activeRadius: 120, luggage: 0 }); WS.stats.walkers += count;
  }
});
function* build() {
  const L = AF.outlandSites.lib, { geometry, house, prop, lamp, picnic, color } = L, C = L.palette;
  const steel = color(0xd8dcdf, { metal: 0.6, rough: 0.3 }), glass = color(0x9fc3cf, { rough: 0.1 }), cream = color(0xefe6cf, { pat: 'stucco' }), brick = color(0x9a5440, { pat: 'brick' });
  const blue = color(0x2d5f8a), green = color(0x3f7a52), teal = color(0x2e8a7a), orange = color(0xd9772b), signW = color(0xf2efe4), roofG = color(0x5a5f63);
  const walls = [C.trim, cream, color(0xd9c7a0), color(0xc9d3cf), color(0xe2c4b0)], roofs = [C.slate, C.red, color(0x6a4a3a), roofG];
  const sign = function* (word, fg, bg) { return yield* geometry('sign-' + word, () => AF.textModel(word, fg, { bg, pad: 1, depth: 1 }), 0.25); };
  const shop = function* (key, w, h, d, wall, band, roof) {
    return yield* geometry(key, () => {
      const m = new AF.Model(w, h + 2, d);
      m.box(0, 0, 0, w, 1, d, C.stone); m.box(0, 1, 0, w, h, d, wall); m.box(0, h, 0, w, h + 1, d, roof); m.box(0, h + 1, 0, w, h + 2, 1, wall);
      m.box(1, 1, d - 1, w - 1, Math.min(h - 3, 6), d, glass); m.box(0, h - 3, d - 1, w, h - 1, d, band);
      const door = (w / 2) | 0; m.box(door - 2, 1, d - 1, door + 2, 5, d, C.dark);
      for (let x = 4; x < w - 4; x += 9) m.box(x, h + 1, 4, x + 3, h + 3, 7, roofG);
      return m;
    });
  };
  for (const poi of O.wayside) {
    const rot = poi.rot, back = -poi.rx * 0.35, [bx, bz] = face(poi, back, 0), y = poi.y, v = Math.floor(AF.hash2(poi.x, poi.z) * 4);
    const at = (along, across, geo, opts = {}) => { const [x, z] = face(poi, along, across); const placed = O.addProp(geo, x, opts.y ?? y, z, rot, { tag: 'wayside:' + poi.name, ...opts }); poi.props.push(placed); WS.stats.props++; return placed; };
    if (poi.kind === 'kiosk') {
      at(back, 0, yield* geometry('wayside-kiosk', () => { const m = new AF.Model(12, 10, 10); m.box(0, 0, 0, 12, 1, 10, C.stone); m.box(1, 1, 1, 11, 6, 8, C.wood); m.box(1, 3, 8, 11, 4, 9, C.trim); m.box(2, 4, 8, 10, 6, 9, C.pane); for (let x = 0; x < 12; x += 2) m.box(x, 7, 7, x + 1, 8, 10, C.red), m.box(x + 1, 7, 7, x + 2, 8, 10, C.trim); m.box(0, 8, 0, 12, 9, 8, C.slate); return m; }));
      const [px, pz] = face(poi, poi.rx * 0.2, 7); yield* picnic({ x: px, y, z: pz, props: poi.props, name: poi.name });
    } else if (poi.kind === 'houses') {
      for (let index = 0; index < 3; index++) { at(back, (index - 1) * 11, yield* house('wayside-house-' + ((v + index) % 4), 14, 12, 8 + (index % 2) * 2, walls[(v + index) % walls.length], roofs[(v + index * 3) % roofs.length])); yield; }
    } else if (poi.kind === 'fuel') {
      at(back - 2, -5, yield* house('fuel-office', 12, 8, 7, C.trim, C.red));
      at(poi.rx * 0.15, 3, yield* geometry('wayside-canopy', () => { const m = new AF.Model(24, 12, 16); m.box(0, 10, 0, 24, 12, 16, C.red); for (const x of [1, 22]) for (const z of [1, 14]) m.box(x, 0, z, x + 1, 10, z + 1, C.trim); for (const x of [8, 15]) { m.box(x, 0, 7, x + 2, 5, 9, C.trim); m.box(x, 3, 9, x + 2, 4, 10, C.dark); } return m; }), { collide: false });
      yield* lamp({ x: bx, y, z: bz, props: poi.props, name: poi.name }, 8, 6);
    } else if (poi.kind === 'supermarket') {
      at(back, 0, yield* shop('wayside-market', 40, 12, 26, cream, [green, blue, orange][v % 3], roofG));
      at(back + 6.6, 0, yield* sign('MARKET', signW, [green, blue, orange][v % 3]), { y: y + 6.6, collide: false });
    } else if (poi.kind === 'mall') {
      at(back, -6, yield* shop('wayside-mall-a', 56, 16, 30, brick, teal, roofG)); yield;
      at(back - 2, 16, yield* shop('wayside-mall-b', 26, 12, 40, cream, orange, roofG)); yield;
      at(back + 4, -22, yield* geometry('wayside-mall-tower', () => { const m = new AF.Model(10, 30, 10); m.box(0, 0, 0, 10, 28, 10, cream); m.box(1, 20, 9, 9, 26, 10, glass); m.box(0, 28, 0, 10, 30, 10, teal); return m; }));
      at(back + 7.6, -6, yield* sign('SHOPPING CENTRE', signW, teal), { y: y + 8.6, collide: false });
    } else if (poi.kind === 'diner') {
      at(back, 0, yield* shop('wayside-diner', 26, 9, 14, steel, C.red, steel));
      at(back + 3.6, 0, yield* sign('DINER', C.red, signW), { y: y + 5.1, collide: false });
    } else if (poi.kind === 'motel') {
      at(back, 0, yield* geometry('wayside-motel', () => { const m = new AF.Model(56, 9, 14); m.box(0, 0, 0, 56, 1, 14, C.stone); m.box(0, 1, 0, 56, 7, 10, cream); m.box(0, 7, 0, 56, 8, 14, C.red); for (let x = 2; x < 54; x += 6) { m.box(x, 1, 10 - 1, x + 2, 5, 10, [blue, green, orange][(x / 6 | 0) % 3]); m.box(x + 3, 3, 9, x + 5, 5, 10, C.pane); } for (const x of [0, 55]) m.box(x, 1, 10, x + 1, 7, 14, C.trim); return m; }));
      at(poi.rx * 0.6, poi.rx * 0.6, yield* geometry('wayside-motel-sign', () => { const m = new AF.Model(4, 22, 2); m.box(1, 0, 0, 3, 16, 2, C.dark); m.box(0, 16, 0, 4, 22, 2, C.red); m.box(0, 17, 0, 4, 18, 2, C.glow); return m; }));
      at(poi.rx * 0.6, poi.rx * 0.6, yield* sign('MOTEL', signW, C.red), { y: y + 7.4, collide: false });
    }
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
AF.onIdle('outland-wayside', work);
AF.test('wayside: ring road stops are furnished and parked', () => {
  WS.settle();
  const kinds = new Set(O.wayside.map((poi) => poi.kind));
  return { ok: O.wayside.length >= 6 && O.wayside.every((poi) => poi.props.length) && kinds.has('supermarket') && kinds.has('mall') && WS.stats.cars >= 8, info: O.wayside.length + ' stops (' + [...kinds].join(',') + '), ' + WS.stats.props + ' props, ' + WS.stats.cars + ' parked, ' + WS.stats.walkers + ' shoppers' };
});
} catch (e) { AF.partError('44-wayside.js', e); }
