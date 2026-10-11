// ================================================================ 46-zoo-visit.js
try {
// ===== 46-zoo-visit: a day out at Solace Zoo — colour trails with paw prints + arrows, fingerposts, the trail board, opening hours
// (8 am - 10 pm), Hazel at the ticket window, keeper feeding times, feeding stations and the zoo passport  (OWNER: west) =====
// Loads before 46-zoo.js, so everything runs from build / tick hooks. Trails and arrows are paint on the walks' own stone (no new
// draws); keepers on duty are AF.npc people shown only for their slot; the feeding times move the animals on the shared clock
// (46-zoo planAt) so co-op players see the same thing, while a feeding station is a local treat (AF.zoo.lure). The passport
// (one stamp per habitat board read) is kept in AF.save.zoo.
{
  const PI = Math.PI, W = AF.W, ZOO = () => AF.PLAN.west.zoo;
  const toast = (t) => AF.emit('toast', t);
  const say = (id, o) => { if (AF.audio) AF.audio.play(id, o); };
  const clock = (h) => { const hh = Math.floor(h) % 24, mm = Math.round((h - Math.floor(h)) * 60); return ((hh + 11) % 12 + 1) + (mm ? ':' + String(mm).padStart(2, '0') : '') + (hh < 12 ? ' am' : ' pm'); };
  // five trails from the gate; each print is [lateral, forward, radius] in metres
  const TRAILS = [
    { id: 'cats', name: 'Big Cat Trail', short: 'BIG CATS', hex: 0xe07a2a, print: 'cat', step: 1.4, pts: [[-541.5, -23], [-541.5, -138]], sees: 'Tiger Forest and Pride Rock' },
    { id: 'savanna', name: 'Savanna Trail', short: 'SAVANNA', hex: 0x7a8696, print: 'elephant', step: 1.9, pts: [[-553.5, -25.5], [-599, -25.5], [-599, -138]], sees: 'the primates, the rhinos, the giraffes and the elephants' },
    { id: 'flamingo', name: 'Flamingo Walk', short: 'FLAMINGOS', hex: 0xe8609a, print: 'bird', step: 0.9, pts: [[-538.5, -26.5], [-490, -26.5], [-490, -138]], sees: 'Flamingo Lagoon' },
    { id: 'water', name: 'Waterside Trail', short: 'WATERSIDE', hex: 0x2f7ad0, print: 'bird', step: 0.85, pts: [[-550.5, -23], [-550.5, -161.75], [-598, -161.75], [-598, -276]], sees: 'the penguins and their underwater window, the hippos and the crocodiles' },
    { id: 'forest', name: 'Forest Trail', short: 'FOREST', hex: 0x9a6430, print: 'hoof', step: 1.1, pts: [[-543.75, -23], [-543.75, -161.75], [-490, -161.75], [-490, -276]], sees: 'the deer woodland and the bear forest' },
  ];
  const SHAPES = {
    cat: [[0, 0, 0.22], [-0.2, 0.3, 0.09], [-0.07, 0.38, 0.09], [0.07, 0.38, 0.09], [0.2, 0.3, 0.09]],
    elephant: [[0, 0, 0.42], [-0.22, 0.38, 0.08], [0, 0.44, 0.08], [0.22, 0.38, 0.08]],
    bird: [[0, 0, 0.07], [0, 0.14, 0.06], [-0.17, 0.22, 0.07], [0, 0.27, 0.07], [0.17, 0.22, 0.07]],
    hoof: [[-0.1, 0, 0.12], [0.1, 0, 0.12], [-0.1, 0.14, 0.08], [0.1, 0.14, 0.08]],
  };
  const B = AF.zooVisit = { trails: TRAILS, staff: [], stations: [], closed: null, painted: 0 };

  // ---------------------------------------------------------------- build (after the walks are laid at 312, before meshing)
  AF.onBuild('zoo-visit', 313, () => {
    const Z = AF.zoo, ZO = ZOO(), K = AF.westKit, col = K.col, pave = ZO.isPave;
    if (!Z || !pave) return;
    // paint on visible walk stone only (never on lawn, under a bench or on the bridge deck)
    const paint = (x, z, c) => { const i = W.col(x, z); if (i < 0 || !pave.has(W.C[i]) || AF.solidAt(x, W.groundY(x, z) + 0.13, z)) return; W.C[i] = c; B.painted++; };
    const stamp = (cx, cz, fx, fz, shape, c) => {
      for (const [l, f, r] of shape) {
        const px = cx - fz * l + fx * f, pz = cz + fx * l + fz * f;
        if (r < 0.12) { paint(px, pz, c); continue; }
        W.eachCol(px - r, pz - r, px + r, pz + r, (bx, bz, i, x, z) => { if ((x - px) ** 2 + (z - pz) ** 2 < r * r) paint(x, z, c); });
      }
    };
    // a chevron pointing along (fx, fz): apex 0.5 m ahead, arms 0.9 m to each side, 0.35 m thick
    const arrow = (x, z, fx, fz, c) => W.eachCol(x - 1.2, z - 1.2, x + 1.2, z + 1.2, (bx, bz, i, px, pz) => {
      const u = (px - x) * fx + (pz - z) * fz, v = Math.abs(-(px - x) * fz + (pz - z) * fx), e = 0.5 - v - u;
      if (v <= 0.95 && e >= 0 && e <= 0.38) paint(px, pz, c);
    });
    for (const T of TRAILS) {
      const c = col(T.hex, { jitter: 0.2, edge: 0.3 }), cA = col(T.hex, { jitter: 0.08, edge: 0.15 });
      let k = 0;
      for (let s = 0; s + 1 < T.pts.length; s++) {
        const [x0, z0] = T.pts[s], [x1, z1] = T.pts[s + 1], L = Math.hypot(x1 - x0, z1 - z0), fx = (x1 - x0) / L, fz = (z1 - z0) / L;
        arrow(x0 + fx * 1.1, z0 + fz * 1.1, fx, fz, cA);
        let since = 0;
        for (let d = 2.6; d < L - 1; d += T.step, k++) {
          if ((since += T.step) >= 18 && L - d > 4) { since = 0; arrow(x0 + fx * (d + 0.4), z0 + fz * (d + 0.4), fx, fz, cA); d += 1.4; continue; }
          const side = k & 1 ? 0.3 : -0.3;
          stamp(x0 + fx * d - fz * side, z0 + fz * d + fx * side, fx, fz, SHAPES[T.print], c);
        }
      }
    }
    // ---- fingerposts: a timber post, painted arms with pointed tips, the destination on both faces
    const wood = col(0x5a4632, { pat: 'plank' }), capC = col(0x2f6a4a), cream = 0xf6f0de;
    const fit = (str, hex, maxW, maxH) => { const m = AF.textModel(str, 1, { font: 'deco', depth: 1, pad: 0 }); return K.text(str, hex, { lit: false, font: 'deco', pad: 0, vs: Math.min(1 / 16, maxW / (m.w || 1), maxH / (m.h || 9)) }); };
    const post = (x, z, arms) => {
      W.fill(x, 0.25, z, x + 0.25, 3.5, z + 0.25, wood); W.fill(x - 0.25, 3.5, z - 0.25, x + 0.5, 3.75, z + 0.5, capC);
      arms.forEach(([label, dir, hex], k) => {
        const y = 2.9 - k * 0.42, c = col(hex), L = 1.75, s = dir === 'e' || dir === 's' ? 1 : -1, g = fit(label, cream, L - 0.3, 0.24);   // lowest arm 2.06 m: walk under it
        if (dir === 'e' || dir === 'w') {
          const a = s > 0 ? x + 0.25 : x - L, b = s > 0 ? x + 0.25 + L : x, tip = s > 0 ? b : a - 0.25;
          W.fill(a, y, z, b, y + 0.375, z + 0.25, c); W.fill(tip, y + 0.125, z, tip + 0.25, y + 0.25, z + 0.25, c);
          AF.placeStatic(g, (a + b) / 2, y + 0.07, z + 0.27, 0, { collide: false }); AF.placeStatic(g, (a + b) / 2, y + 0.07, z - 0.02, 2, { collide: false });
        } else {
          const a = s > 0 ? z + 0.25 : z - L, b = s > 0 ? z + 0.25 + L : z, tip = s > 0 ? b : a - 0.25;
          W.fill(x, y, a, x + 0.25, y + 0.375, b, c); W.fill(x, y + 0.125, tip, x + 0.25, y + 0.25, tip + 0.25, c);
          AF.placeStatic(g, x + 0.27, y + 0.07, (a + b) / 2, 1, { collide: false }); AF.placeStatic(g, x - 0.02, y + 0.07, (a + b) / 2, 3, { collide: false });
        }
      });
    };
    const T = Object.fromEntries(TRAILS.map((t) => [t.id, t.hex])), EXIT = 0x2f6a4a;
    post(-546.25, -28, [['BIG CATS', 'n', T.cats], ['SAVANNA', 'w', T.savanna], ['FLAMINGOS', 'e', T.flamingo]]);
    post(-546.25, -168, [['WATERSIDE', 'w', T.water], ['FOREST', 'e', T.forest], ['EXIT', 's', EXIT]]);
    post(-598.25, -30.5, [['SAVANNA', 'n', T.savanna], ['EXIT', 'e', EXIT]]);
    post(-490.25 + 1.75, -30.5, [['FLAMINGOS', 'n', T.flamingo], ['EXIT', 'w', EXIT]]);
    post(-596, -166.5, [['WATERSIDE', 'n', T.water], ['EXIT', 'e', EXIT]]);
    // ---- the trail board in the middle of the promenade: the trails on the front, today's keeper talks on the back
    const board = col(0x2f6a4a), paper = col(0xf2ead0, { jitter: 0.05 });
    W.fill(-548.25, 0.25, -33.25, -548, 3.25, -33, board); W.fill(-545, 0.25, -33.25, -544.75, 3.25, -33, board);
    W.fill(-548, 0.9, -33.25, -545, 1.0, -33, board); W.fill(-548, 3.0, -33.25, -545, 3.25, -33, board); W.fill(-548, 1.0, -33.25, -545, 3.0, -33, paper);
    const line = (str, hex, y, back, maxW = 2.8, maxH = 0.16) => AF.placeStatic(fit(str, hex, maxW, maxH), -546.5, y, back ? -33.27 : -32.98, back ? 2 : 0, { collide: false });
    line('ZOO TRAILS', 0x2f4a3a, 2.62, false, 2.8, 0.3);
    TRAILS.forEach((t, i) => { const y = 2.28 - i * 0.26; W.fill(-547.75, y, -33, -547.5, y + 0.25, -32.75, col(t.hex)); AF.placeStatic(fit(t.name.toUpperCase(), 0x3a3024, 2.2, 0.14), -546.2, y + 0.05, -32.98, 0, { collide: false }); });
    line('TODAY AT THE ZOO', 0x2f4a3a, 2.66, true, 2.8, 0.24);
    line('OPEN ' + clock(ZO.hours[0]).toUpperCase() + ' \u2013 ' + clock(ZO.hours[1]).toUpperCase(), 0xc0392b, 2.42, true, 2.6, 0.16);
    const today = Z.feed.flatMap((F) => F.at.map((h) => [h, F.name])).sort((a, b) => a[0] - b[0]);
    today.forEach(([h, name], i) => line(clock(h).toUpperCase() + '  ' + name.toUpperCase(), 0x3a3024, 2.16 - i * 0.15, true, 2.8, 0.11));
    AF.addInteract({ x: -546.5, y: 1.5, z: -31.6, r: 2.2, label: 'Read: Zoo trails', prio: 0.6, act: () => AF.emit('dialogue', { name: 'Zoo trails', role: 'Solace Zoo', lines: TRAILS.map((t) => t.name + ': follow the ' + ['orange', 'grey', 'pink', 'blue', 'brown'][TRAILS.indexOf(t)] + ' prints to ' + t.sees + '.').concat('Read every habitat board for a stamp in your zoo passport.') }) });
    AF.addInteract({ x: -546.5, y: 1.5, z: -34.7, r: 2.2, label: 'Read: Today at the zoo', prio: 0.6, act: () => AF.emit('dialogue', { name: 'Today at the zoo', role: 'Open ' + clock(ZO.hours[0]) + ' \u2013 ' + clock(ZO.hours[1]),
      lines: today.map(([h, name]) => clock(h) + ' \u2014 ' + name + ' at ' + Z.feed.find((F) => F.name === name).where + '.').concat('Feeding stations at the giraffes, the elephants\u2019 deck and the penguins: a dollar a treat.') }) });
    // ---- feeding stations: a green coin box on a post; the animals come to the fence for the treat
    const box = col(0x2f6a4a, { metal: 0.3 }), brass = col(0xc9a24a, { metal: 0.8, rough: 0.3 });
    const STN = [
      { hab: 'giraffes', name: 'giraffes', at: [-595.75, 0.25, -125.25], lure: [-589.5, -125, 2, 'browse', -PI / 2], line: 'A giraffe ambles over and wraps that long blue tongue round the lettuce.', snd: 'zip_bag' },
      { hab: 'elephants', name: 'elephants', at: [-600.75, 0.75, -110.25], lure: [-608.5, -110.5, 1, 'graze', PI / 2], line: 'An elephant swings over, trunk first, and the bun is gone.', snd: 'an_elephant' },
      { hab: 'penguins', name: 'penguins', at: [-595.75, 0.25, -216.25], lure: [-589.5, -216, 3, 'graze', -PI / 2], line: 'Three penguins waddle up to the glass for the fish. Chaos.', snd: 'an_penguin' },
    ];
    for (const S of STN) {
      const [x, y, z] = S.at;
      W.fill(x, y, z, x + 0.25, y + 1.0, z + 0.25, box); W.fill(x - 0.125, y + 1.0, z - 0.125, x + 0.375, y + 1.5, z + 0.375, box); W.fill(x, y + 1.25, z + 0.375, x + 0.25, y + 1.375, z + 0.5, brass);
      S.t = -99;
      AF.addInteract({ x: x + 0.1, y: y + 1.1, z: z + 0.1, r: 1.6, label: 'Feed the ' + S.name + ' \u00b7 $1', prio: 1.2, can: () => AF.mode === 'walk' && ZO.isOpen(),
        act: () => {
          if (AF.clock.t - S.t < 20) { toast('They\u2019re still chewing. Give them a moment.'); return; }
          if (!AF.money.spend(1, 'a treat')) return;
          S.t = AF.clock.t; const [lx, lz, n, st, yaw] = S.lure;
          if (Z.lure(S.hab, lx, lz, n, 18, st, yaw)) { toast(S.line); say(S.snd, { x: lx, y: 1.5, z: lz }); } else toast('Nobody\u2019s hungry right now.');
        } });
      B.stations.push(S);
    }
    // ---- the passport: one stamp per habitat board read, a gift for the full set
    Z.stamp = (H) => {
      const S = AF.save, got = S.zoo || (S.zoo = []); if (got.includes(H.id)) return;
      got.push(H.id); AF.saveSoon();
      const n = got.length, N = Z.habitats.length;
      if (n < N) { say('ui_check'); toast('Zoo passport: ' + H.name + ' stamped \u2014 ' + n + ' of ' + N + '.'); }
      else { say('cheer'); AF.money.add(25); toast('Zoo passport complete! You\u2019re an honorary Junior Keeper \u2014 Hazel adds a $25 gift voucher.'); }
    };
  });

  // ---------------------------------------------------------------- the staff: Hazel in the ticket booth, keepers on duty for each feeding
  const keeper = (skin, hair, female) => ({ skin, hair, hairStyle: female ? 'pony' : 'short', female, top: { col: 0x5a6a3a, col2: 0xe8dcc0, style: 'shirt' }, bottom: { col: 0x6a5a3a, style: female ? 'skirt' : 'shorts' }, shoe: 0x4a3020, hat: 'cap', hatCol: 0x6a7a3a, height: female ? 0.97 : 1.02 });
  const TALK = {
    elephants: ['Bath time! The elephants spray themselves to cool down and keep the bugs off.', 'Each one drinks up to two hundred litres a day. Our water bill is a scandal.'],
    penguins: ['Fish o\u2019clock! Penguins swallow them head first, so the scales go down smooth.', 'Watch the underwater window \u2014 they fly down there.'],
    lions: ['Feeding the pride. Leo always eats first \u2014 the lionesses do all the actual work.', 'They\u2019ll sleep it off for the rest of the afternoon.'],
    giraffes: ['Breakfast for the giraffes \u2014 acacia leaves and a lot of lettuce.', 'That tongue is nearly half a metre long, and blue so it doesn\u2019t sunburn.'],
  };
  AF.onBuild('zoo-visit-staff', 826, () => {
    const Z = AF.zoo, ZO = ZOO(), NP = AF.npc; if (!Z || !NP) return;
    const z1 = ZO.z1;
    const hazel = NP.spawn({ id: 'zoo-tickets', name: 'Hazel', role: 'Ticket booth \u00b7 Solace Zoo', look: { female: true, skin: 0xe8b894, hair: 0x6a3a1a, hairStyle: 'wavy', top: { col: 0x2f6a4a, col2: 0xf2ead0, style: 'cardigan' }, bottom: { col: 0x3a3a40, style: 'skirt' }, shoe: 0x2a1a10, glasses: 0x2a2a2e, height: 0.98 },
      x: -533.8, y: 0.5, z: z1 + 2.25, yaw: -PI / 2, greet: ['Tickets, tickets!', 'Lovely day for the zoo.', 'Mind the flamingos.'], lines: [['One ticket gets you in all day. The paw prints take you round.', 'We close at ten sharp \u2014 the animals need their beauty sleep.']] });
    B.staff.push(hazel);
    const NAMES = { lions: 'Ruth', penguins: 'June', elephants: 'Abel', giraffes: 'Mina' };
    for (const F of Z.feed) {
      const [x, y, z, yaw] = F.keeper, n = NP.spawn({ id: 'zoo-feed-' + F.hab, name: NAMES[F.hab] || 'Keeper', role: F.name + ' \u00b7 keeper', look: keeper(F.hab === 'lions' ? 0xa87050 : 0xd9a07a, 0x2a1a12, F.hab !== 'elephants'), x, y, z, yaw, greet: [F.name + ' is on!', 'Come and watch!'], lines: [TALK[F.hab]] });
      n.feed = F; NP.setHidden(n, true); B.staff.push(n);
    }
    // keepers already in the zoo go home at closing too
    for (const id of ['keeper-rosa', 'keeper-otis']) { const n = NP.list.find((q) => q.id === id); if (n) B.staff.push(n); }
    // the CLOSED card hangs in the booth window after hours
    const tm = AF.textModel('CLOSED', AF.col(0xc0392b), { font: 'deco', pad: 2, depth: 1, bg: AF.col(0xf2ead0) }), geo = AF.meshModel(tm, { vs: 1 / 20, anchor: [0.5, 0, 0.5] }); delete geo.userData.src;
    const sign = B.closed = AF.modelMesh(geo); sign.position.set(-535.32, 1.4, z1 + 2.25); sign.rotation.y = -PI / 2; sign.castShadow = false; sign.visible = false; sign.name = 'zoo-closed'; AF.scene.add(sign);
  });

  // ---------------------------------------------------------------- hours, keepers on duty, announcements (2 Hz)
  let tT = 0, lastH = -1;
  AF.onTick('zoo-visit', 434, (dt) => {
    if (!AF.ready || (tT -= dt) > 0) return; tT = 0.5;
    const Z = AF.zoo, ZO = ZOO(); if (!Z || !ZO.isOpen) return;
    const h = AF.time.hours, open = ZO.isOpen(h), p = AF.mode === 'walk' ? AF.player : AF.camera.position;
    const inside = p.x > ZO.x0 && p.x < ZO.x1 && p.z > ZO.z0 && p.z < ZO.z1 - 2, near = inside || (p.x > ZO.x0 - 40 && p.x < ZO.x1 + 40 && p.z > ZO.z0 - 40 && p.z < ZO.z1 + 40);
    for (const n of B.staff) { const on = open && (!n.feed || Z.feedAt(n.feed.hab, h) === n.feed); if (!!n.hidden === on) AF.npc.setHidden(n, !on); }
    if (B.closed && B.closed.visible === open) B.closed.visible = !open;
    // a feeding about to start, closing time (only for forward steps of the clock: a time jump in the menu stays quiet)
    if (lastH >= 0 && h > lastH && h - lastH < 0.5 && near) {
      for (const F of Z.feed) for (const s of F.at) if (lastH < s && h >= s) { say('ui_ding'); toast(F.name + ' is starting at ' + F.where + '.'); }
      if (inside && lastH < ZO.hours[1] - 0.25 && h >= ZO.hours[1] - 0.25) { say('ui_ding'); toast('Solace Zoo closes at ' + clock(ZO.hours[1]) + ' \u2014 please make your way to the gate.'); }
      if (inside && lastH < ZO.hours[1] && h >= ZO.hours[1]) toast('The zoo is closed for the night. The turnstiles will still let you out.');
    }
    lastH = h;
  });

  AF.test('zoo: trails painted, staff on duty, closed at night, feeding draws the animals', () => {
    const Z = AF.zoo, ZO = ZOO(); if (!Z || !ZO.isOpen) return { ok: false, info: 'no zoo' };
    const hours = ZO.isOpen(12) && !ZO.isOpen(22.5) && !ZO.isOpen(7);
    const hazel = B.staff.find((n) => n.id === 'zoo-tickets'), keepers = B.staff.filter((n) => n.feed).length;
    // a feeding window moves that habitat's animals to the feeding spot on the shared clock
    const F = Z.feed.find((q) => q.hab === 'penguins'), pen = Z.list.filter((an) => an.hab === 'penguins');
    const B0 = AF.time.base, keep = { h0: B0.h0, w0: B0.w0, sp: B0.sp, p: B0.p };
    AF.time.adopt({ h0: F.at[0] + 0.25, w0: AF.clock.w, sp: 0, p: true });
    const Q = { x: 0, z: 0 }; let gathered = 0;
    for (const an of pen) { Z.posAt(an, AF.clock.w + 3, F.at[0] + 0.25, Q); if (Math.hypot(Q.x - F.x, Q.z - F.z) < 4) gathered++; }
    AF.time.adopt(keep);
    // a feeding station lure eases an animal over and lets it go again
    const gir = Z.list.find((an) => an.hab === 'giraffes'), n = Z.lure('giraffes', -589.5, -125, 1, 18, 'browse', -PI / 2), lured = n === 1 && Z.list.some((an) => an.lure);
    for (const an of Z.list) an.lure = null;
    return { ok: B.painted > 600 && hours && !!hazel && keepers === Z.feed.length && gathered >= Math.ceil(pen.length * 0.75) && lured && B.stations.length === 3 && !!gir && !!Z.stamp,
      info: `${B.painted} trail voxels, hours ${hours}, Hazel ${!!hazel}, ${keepers} feeding keepers, ${gathered}/${pen.length} penguins at the feed, lure ${lured}, ${B.stations.length} stations` };
  });
}
} catch (e) { AF.partError('46-zoo-visit.js', e); }
