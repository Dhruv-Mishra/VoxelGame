// ================================================================ 44-key.js
try {
// ===== 44-key: CORSAIR KEY — Silas Crane's private island 300 m east of Serena Isle: a 190 m airstrip with an apron, a hangar, a white
//       villa on the hill, a jetty in the north-east cove, a lighthouse, palms (44-flora). Everything is merged outland props built
//       with Serena's kit (44-island S.kit: cached models with a coarse LOD); a flyable Cub waits on the apron. The heist ends here.  (OWNER: west) =====
{
  const O = AF.outland, K = AF.PLAN.world.key, PI = Math.PI;
  const KEY = AF.key = { sites: [], spots: {}, plane: null };
  AF.onBuild('key-sites', 496.45, () => {
    const kit = AF.island && AF.island.kit; if (!kit || !K) return;
    const { geometry, block, site, prop, sign, canopy, openCanopy, paint } = kit, C = kit.col;
    const terra = paint(0xc8643a), cream = paint(0xf2e6cc), rust = paint(0x9a4a32), navy = paint(0x23384f), sand = paint(0xd9c49a);
    const ky = (x, z) => Math.round(O.h(x, z) * 4) / 4;
    // ---- the airstrip apron + hangar (open-fronted look: a dark door panel), a windsock and the name board
    const strip = K.airstrip, H = K.hangar;
    const hangar = site('Corsair Key Hangar', H.x, H.z, 22, 12, H.y), apron = site('Corsair Key Apron', H.x - 30, strip.z + strip.w / 2 + 5, 26, 5, strip.y);
    apron.face = [0, -1];
    // fuel drums and a chock board at the apron's west end (clear of the Cub's spot)
    for (const [dx, dz] of [[-23, 2.5], [-22.2, 2.5], [-22.6, 1.7]]) prop(apron, block('key-drum', 1, 2, 1, C.coral), dx, dz);
    prop(apron, block('key-chocks', 3, 1, 1, C.wood), -19.5, 2.6, { collide: false });
    prop(hangar, geometry('key-hangar', 52, 20, 30, (m) => {
      m.box(0, 0, 0, 52, 15, 30, cream); m.box(3, 0, 0, 49, 13, 2, C.dark); m.box(0, 15, 0, 52, 16, 30, rust);
      for (let layer = 0; layer < 4; layer++) m.box(layer * 3, 16 + layer, 0, 52 - layer * 3, 17 + layer, 30, layer % 2 ? rust : terra);
      for (let x = 6; x < 48; x += 8) m.box(x, 13, 0, x + 4, 14, 1, C.glow);
    }));
    sign(hangar, 'CORSAIR KEY', 0, -7.6, H.y + 8.4, 2);
    prop(hangar, geometry('key-windsock', 14, 15, 3, (m) => { m.box(1, 0, 1, 2, 14, 2, C.dark); for (let x = 2; x < 14; x++) m.box(x, 11, 0, x + 1, 14 - Math.floor(x / 5), 3, x % 4 < 2 ? terra : C.white); }), -30, -8, { collide: false });
    AF.addLight({ x: H.x, y: H.y + 7, z: H.z - 9, color: 0xffd08a, intensity: 1.4, range: 18, kind: 'street' });
    // ---- runway paint (6 cm props, never coplanar) + edge lights
    const mark = (key, w, d, colr, h = 1) => { if (kit.cache.has(key)) return kit.cache.get(key); const m = new AF.Model(w, h, d); m.box(0, 0, 0, w, h, d, colr); const geo = AF.meshModel(m, { vs: 1 / 16, flat: true }); geo.userData.lod = geo; geo.userData.small = h > 1; kit.cache.set(key, geo); return geo; };
    const stripe = AF.col(0xf2f0e6, { jitter: 0.08, edge: 0, pat: 'none' }), lamp = AF.col(0xfff0c8, { emit: 0xffe2a0, emitK: 3, mode: 'night', jitter: 0, edge: 0 }), ry = strip.y + 0.03;
    for (let x = strip.x0 + 34; x < strip.x1 - 34; x += 24) O.addProp(mark('rw-dash', 192, 10, stripe), x, ry, strip.z, 0, { collide: false });
    for (const x of [strip.x0 + 8, strip.x1 - 8]) for (const dz of [-7.4, -5.6, -3.8, 3.8, 5.6, 7.4]) O.addProp(mark('rw-key', 160, 14, stripe), x, ry, strip.z + dz, 0, { collide: false });
    for (let x = strip.x0 + 2; x <= strip.x1 - 2; x += 19) for (const dz of [-strip.w / 2 - 0.6, strip.w / 2 + 0.6]) O.addProp(mark('rw-light', 4, 4, lamp, 4), x, strip.y, strip.z + dz, 0, { collide: false });
    // ---- the villa on the hill: white walls, a terracotta roof, a loggia with columns, lit windows
    const V = K.villa, villa = site('Villa Corsair', V.x, V.z, 13, 10);
    prop(villa, geometry('key-villa', 40, 22, 30, (m) => {
      m.box(2, 0, 2, 38, 1, 28, C.rock); m.box(3, 1, 3, 37, 9, 27, C.white); m.box(8, 9, 6, 32, 15, 24, C.white);
      for (let x = 5; x < 36; x += 5) { m.box(x, 3, 3, x + 3, 7, 4, C.win); m.box(x, 3, 26, x + 3, 7, 27, C.win); }
      for (let x = 11; x < 30; x += 5) m.box(x, 11, 6, x + 3, 14, 7, C.win);
      for (let layer = 0; layer < 4; layer++) m.box(1 + layer, 9 + layer, 1 + layer, 39 - layer, 10 + layer, 29 - layer, terra);
      for (let layer = 0; layer < 3; layer++) m.box(7 + layer * 2, 15 + layer, 5 + layer * 2, 33 - layer * 2, 16 + layer, 25 - layer * 2, terra);
      for (let x = 6; x < 36; x += 6) m.box(x, 1, 0, x + 1, 8, 1, C.white); m.box(4, 8, 0, 36, 9, 2, C.white); m.box(17, 1, 2, 23, 7, 3, C.wood);
    }));
    AF.addLight({ x: V.x, y: villa.y + 3, z: V.z - 9, color: 0xffd8a0, intensity: 1.2, range: 16, kind: 'street' });
    // a gravel walk down the hill from the villa to the apron (stepping stones, props)
    for (let i = 1; i < 24; i++) { const u = i / 24, x = AF.lerp(V.x + 4, H.x - 40, u), z = AF.lerp(V.z - 14, strip.z + strip.w / 2 + 3, u); O.addProp(block('key-step', 6, 1, 6, sand), x, ky(x, z) + 0.04, z, 0, { collide: false }); }
    // ---- the cove jetty (north-east): marched out from the shore to deep water
    let jx = K.dock.x, jz = K.dock.z; for (let i = 0; i < 60 && O.h(jx, jz) > -1.9; i++) { jx += 0.6; jz += 0.8; }
    const deck = block('island-jetty-deck', 16, 1, 16, C.wood);
    for (let t = 0; t <= 4; t++) { const x = AF.lerp(K.dock.x, jx, t / 4), z = AF.lerp(K.dock.z, jz, t / 4); O.addProp(deck, x, 1.75, z, 0, { tag: 'key:jetty' }); O.addProp(block('jetty-pile', 1, 9, 1, C.wood), x + 3.5, -2, z, 0, { collide: false }); }
    KEY.spots.jetty = { x: jx, y: 2, z: jz };
    // ---- the lighthouse on the south-east point + a beach bar canopy by the apron
    const lx = K.cx + K.rx * 0.82, lz = K.cz - K.rz * 0.45, light = site('Corsair Point', lx, lz, 5, 5, Math.max(2, ky(lx, lz)));
    prop(light, geometry('key-lighthouse', 14, 40, 14, (m) => {
      for (let y = 0; y < 31; y++) for (let x = 2; x < 12; x++) for (let z = 2; z < 12; z++) if (Math.hypot(x - 7, z - 7) < 4.9 - y * 0.04) m.set(x, y, z, Math.floor(y / 6) % 2 ? navy : C.white);
      m.box(0, 31, 0, 14, 32, 14, C.dark); m.box(4, 32, 4, 10, 37, 10, C.win); m.box(6, 33, 6, 8, 36, 8, C.glow); m.box(3, 37, 3, 11, 38, 11, navy); m.box(5, 38, 5, 9, 40, 9, navy);
    }));
    AF.addLight({ x: lx, y: light.y + 17, z: lz, color: 0xffe2ae, intensity: 2, range: 18, kind: 'street' });
    const bar = site('Corsair Cantina', H.x - 62, strip.z + strip.w / 2 + 9, 6, 5, strip.y);
    openCanopy(bar, canopy('key-cantina', terra), 0, 0); sign(bar, 'CANTINA', 0, -3.4, bar.y + 4.4, 2);
    for (const [x, z] of [[6, -6], [-6, -6]]) prop(bar, block('key-crate', 4, 4, 4, C.wood), x, z);
    // the finale's stage: where Vera and Silas wait, outside the hangar doors
    KEY.spots.stash = { x: H.x - 4, y: H.y, z: H.z - 15 };
    KEY.spots.land = { x: H.x - 40, y: strip.y, z: strip.z + strip.w / 2 + 4, yaw: PI / 2 };
    KEY.sites = [hangar, apron, villa, light, bar];
    AF.addLabel('Corsair Key', K.cx, K.cz - 8, 'place');
  });
  // a Cub on the apron (crashes tow it back here), and the approach guidance knows the strip
  AF.onBuild('key-plane', 667, () => {
    if (!K || !AF.planes || !AF.planes.make) return;
    KEY.plane = AF.planes.make('cub', K.hangar.x - 18, K.airstrip.z + K.airstrip.w / 2 + 6, -PI / 2);
    AF.planes.runways.push(K.airstrip);
  });
  AF.test('key: Corsair Key rises from the sea with a flat, clear strip and its sites', () => {
    const s = K.airstrip; let lo = Infinity, hi = -Infinity, hits = 0;
    for (let x = s.x0 + 3; x <= s.x1 - 3; x += 3) for (const dz of [-6, 0, 6]) { const y = AF.W.groundY(x, s.z + dz); lo = Math.min(lo, y); hi = Math.max(hi, y); if (AF.boxBlocked(x, y + 0.1, s.z + dz, 1, 2)) hits++; }
    const sea = AF.W.groundY(K.cx, K.cz - K.rz * 1.5), hill = AF.W.groundY(K.hill.x, K.hill.z), solid = KEY.sites.every((q) => q.props.length);
    return { ok: hi - lo <= 0.26 && !hits && sea < -1.25 && hill > 8 && solid && !!KEY.plane, info: 'strip ' + lo + '..' + hi + ', blocked ' + hits + ', sea ' + sea + ', hill ' + hill + ', sites ' + KEY.sites.length + ', plane ' + !!KEY.plane };
  });
}
} catch (e) { AF.partError('44-key.js', e); }
