// ================================================================ 58-pets.js
try {
// ===== 58-pets: Paws & Claws, the pet store at the north end of Friends Lane, and the pet who follows you around  (OWNER: people) =====
// Pets are the animal kit's breeds (56-animals: two walk poses + a head + a wagging tail, 3 meshes) plus a toy poodle and three cats.
// Each friend owns their own pets (AF.save.pets = { own: { friend: [ids] }, on: { friend: id } }); Hunar starts with Coco, a pink-
// bowed toy poodle, and can buy and switch like everyone else. The pet trots behind you on foot (AF.moveBody, so it takes stairs and
// never walks through walls), sits when you stop, waits while you drive or fly and pops out beside you again. Co-op: each player
// sends the id of their pet ('pet'); every client walks the others' pets locally behind their avatars (nothing per frame is sent).
{
  const PI = Math.PI, N = AF.net;
  const toast = (t) => AF.emit('toast', t);
  const PETS = AF.PETS = {
    coco: { name: 'Coco', breed: 'Toy poodle', spec: 'poodle', price: 900, desc: 'Fluffy, pink-bowed and fabulous' },
    biscuit: { name: 'Biscuit', breed: 'Golden retriever', spec: 'golden', price: 700, desc: 'Fetches anything, loves everyone' },
    scout: { name: 'Scout', breed: 'Beagle', spec: 'beagle', price: 500, desc: 'Nose first, always on a trail' },
    mac: { name: 'Mac', breed: 'Scottish terrier', spec: 'scottie', price: 550, desc: 'Small, proud and very serious' },
    pip: { name: 'Pip', breed: 'Fox terrier', spec: 'terrier', price: 450, desc: 'Bouncy and fearless' },
    domino: { name: 'Domino', breed: 'Dalmatian', spec: 'dalmatian', price: 750, desc: 'A firehouse classic' },
    ginger: { name: 'Ginger', breed: 'Tabby cat', spec: 'tabby', price: 400, cat: true, desc: 'Sunbeam expert' },
    midnight: { name: 'Midnight', breed: 'Black cat', spec: 'blackcat', price: 400, cat: true, desc: 'Lucky, whatever they say' },
    snowball: { name: 'Snowball', breed: 'White cat', spec: 'whitecat', price: 450, cat: true, desc: 'Blue eyes, opinions' },
  };
  const DEFAULT = { hunar: 'coco' };
  // AF.save (76-game) loads after this part: the pets' record is fetched on use
  const PS = () => { const S = AF.save, v = S.pets && typeof S.pets === 'object' ? S.pets : (S.pets = {}); v.own = v.own || {}; v.on = v.on || {}; return v; };
  const me = () => AF.friends && AF.friends.current ? AF.friends.current.id : null;
  const owned = (f = me()) => { if (!f) return []; const o = PS().own[f] || []; return DEFAULT[f] && !o.includes(DEFAULT[f]) ? [DEFAULT[f], ...o] : o; };
  const activeId = (f = me()) => { if (!f) return ''; const v = PS().on[f]; return v === undefined ? DEFAULT[f] || '' : PETS[v] && owned(f).includes(v) ? v : ''; };

  // ---------------------------------------------------------------- models: the kit's dogs + a poodle and three walking cats
  const KITS = {};
  const kitOf = (spec) => {
    if (KITS[spec]) return KITS[spec];
    const K = AF.animalsKit; if (!K || !K.makeQuad) return null;
    const SP = K.SPEC;
    if (!SP.poodle) {
      SP.poodle = { len: 8, bw: 4, bh: 4, lh: 5, lw: 1, hs: [4, 5, 4], col: 0xf8f3f5, wool: 0xffffff, headCol: 0xf8f3f5, snout: { w: 2, h: 2, d: 2, col: 0xf0e4ea }, nose: true, ears: 'floppy', earCol: 0xffc4de, tail: { len: 4, col: 0xf8f3f5, up: 2.6, tip: 0xff8ac0 }, collar: 0xff3f9e };
      const stripes = (c) => (x, y, z) => (z % 2 === 0 && y > 0 ? c : null);
      SP.tabby = { len: 7, bw: 3, bh: 3, lh: 3, lw: 1, hs: [3, 3, 3], col: 0xe0923a, pattern: stripes(0xb8642a), headCol: 0xe0923a, snout: { w: 2, h: 1, d: 1, col: 0xf3e6d6 }, ears: 'pointy', tail: { len: 6, col: 0xe0923a, up: 1.1, tip: 0xb8642a }, collar: 0x3a70c0 };
      SP.blackcat = { len: 7, bw: 3, bh: 3, lh: 3, lw: 1, hs: [3, 3, 3], col: 0x26221f, headCol: 0x26221f, snout: { w: 2, h: 1, d: 1, col: 0x2e2a27 }, ears: 'pointy', tail: { len: 6, col: 0x26221f, up: 1.1 }, collar: 0xc8322e };
      SP.whitecat = { len: 7, bw: 3, bh: 3, lh: 3, lw: 1, hs: [3, 3, 3], col: 0xf2eee4, headCol: 0xf2eee4, snout: { w: 2, h: 1, d: 1, col: 0xf6e2e2 }, ears: 'pointy', earCol: 0xf2c8c8, tail: { len: 6, col: 0xf2eee4, up: 1.1 }, collar: 0x8a5ad6 };
    }
    return (KITS[spec] = K.makeQuad(SP[spec]));
  };
  // ---------------------------------------------------------------- a follower: leader() -> { x, y, z, yaw, walk } | null
  const followers = [];
  const make = (id, leader) => {
    const def = PETS[id], kit = def && kitOf(def.spec); if (!kit) return null;
    const VS = AF.animalsKit.VS, SP = kit.S, root = new THREE.Group(), mesh = (g) => { const m = new THREE.Mesh(g, AF.mat.voxel); m.castShadow = false; m.receiveShadow = true; return m; };
    const body = mesh(kit.A), head = mesh(kit.H); root.add(body);
    head.position.set(0, (SP.lh + SP.bh - 2 + (SP.neck || 0)) * VS, (SP.len / 2 - 1) * VS); root.add(head);
    let tail = null; if (kit.T) { tail = mesh(kit.T); tail.position.set(0, (SP.lh + SP.bh - 1) * VS, -(SP.len / 2 + 0.5) * VS); tail.rotation.x = -(SP.tail.up ?? 2.2); root.add(tail); }
    root.visible = false; root.name = 'pet-' + id; AF.scene.add(root);
    const p = { id, def, kit, root, body, head, tail, leader, x: 0, y: 0, z: 0, yaw: 0, ph: 0, idle: 0, wag: 0, away: true, stuck: 0, hop: 0,
      b: { x: 0, y: 0, z: 0, vy: 0, r: def.cat ? 0.16 : 0.22, h: def.cat ? 0.32 : 0.5, onGround: true }, parts: { root: { scale: { y: 0.33 } } }, first: def.name, name: def.name, id2: 'pet:' + id };
    followers.push(p);
    return p;
  };
  const drop = (p) => { if (!p) return; const i = followers.indexOf(p); if (i >= 0) followers.splice(i, 1); AF.scene.remove(p.root); };
  const place = (p, L) => {
    const s = Math.sin(L.yaw), c = Math.cos(L.yaw), x = L.x - s * 1.3 + c * 0.8, z = L.z - c * 1.3 - s * 0.8;
    const y = AF.surfaceBelow(x, z, L.y + 1.2, 4), ok = Number.isFinite(y) && Math.abs(y - L.y) < 1.2 && !AF.boxBlocked(x, y + 0.02, z, p.b.r, p.b.h);
    p.x = p.b.x = ok ? x : L.x; p.z = p.b.z = ok ? z : L.z; p.y = p.b.y = ok ? y : L.y; p.b.vy = 0; p.yaw = L.yaw; p.away = false; p.stuck = 0;
  };
  const step = (p, dt, t, cam) => {
    const L = p.leader();
    if (!L || !L.walk) { if (p.root.visible) p.root.visible = false; p.away = true; return; }
    if (p.away) place(p, L);
    const near = (p.x - cam.x) ** 2 + (p.z - cam.z) ** 2 < 150 * 150; if (p.root.visible !== near) p.root.visible = near;
    if (!near) { p.x = L.x; p.z = L.z; p.y = L.y; p.away = true; return; }
    const s = Math.sin(L.yaw), c = Math.cos(L.yaw), tx = L.x - s * 1.3 + c * 0.8, tz = L.z - c * 1.3 - s * 0.8;
    const dx = tx - p.x, dz = tz - p.z, d = Math.hypot(dx, dz);
    if (d > 16 || Math.abs(p.y - L.y) > 3.5) { place(p, L); return; }
    let moving = false;
    if (d > 0.45) {
      const sp = Math.min(10.5, Math.max(1.6, d * 2.6)), k = Math.min(d, sp * dt) / d, x0 = p.b.x, z0 = p.b.z;
      AF.moveBody(p.b, dx * k, dz * k, dt, { step: 0.55 });
      const moved = Math.hypot(p.b.x - x0, p.b.z - z0); moving = moved > 0.002;
      p.stuck = moved < sp * dt * 0.2 ? p.stuck + dt : 0; if (p.stuck > 1.2) { place(p, L); return; }
      p.yaw += AF.angDiff(p.yaw, Math.atan2(dx, dz)) * Math.min(1, dt * 10); p.ph += dt * Math.min(16, sp * 4.2); p.idle = 0;
    } else { AF.moveBody(p.b, 0, 0, dt, { step: 0.55 }); p.idle += dt; p.yaw += AF.angDiff(p.yaw, L.yaw) * Math.min(1, dt * 2); }
    p.x = p.b.x; p.y = p.b.y; p.z = p.b.z;
    const g = moving ? (Math.floor(p.ph) % 2 ? p.kit.B : p.kit.C) : p.kit.A; if (p.body.geometry !== g) p.body.geometry = g;
    if (p.hop > 0) p.hop = Math.max(0, p.hop - dt);
    p.root.position.set(p.x, p.y + Math.sin(Math.min(1, p.hop / 0.5) * PI) * 0.35, p.z); p.root.rotation.y = p.yaw;
    p.head.rotation.y = moving ? 0 : Math.sin(t * 0.7 + p.x) * 0.45; p.head.rotation.x = p.idle > 4 ? 0.25 : 0;
    if (p.wag > 0) p.wag -= dt;
    if (p.tail) p.tail.rotation.z = Math.sin(t * (p.wag > 0 || moving ? 16 : 3)) * (p.wag > 0 ? 0.8 : moving ? 0.45 : 0.18);
  };

  // ---------------------------------------------------------------- mine: the local player's pet
  const PT = AF.pets = { list: followers, mine: null };
  const myLeader = () => { const P = AF.player; if (!P || !P.mesh) return null; return { x: P.x, y: P.y, z: P.z, yaw: P.yaw, walk: AF.mode === 'walk' || AF.mode === 'cutscene' }; };
  PT.active = () => !!PT.mine;
  PT.set = (id, quiet) => {
    const f = me(); if (!f) return;
    if (id && !owned(f).includes(id)) return;
    PS().on[f] = id || ''; AF.saveSoon();
    const want = activeId(f);
    if (PT.mine && PT.mine.id === want) return;
    if (PT.mine) { drop(PT.mine); PT.mine = null; if (petIt) petIt.y = -999; }
    if (want) { PT.mine = make(want, myLeader); if (PT.mine && !quiet) toast({ title: PETS[want].name, text: PETS[want].breed + ' \u2014 at your heels.', kind: 'pet' }); }
    sendPet();
  };
  PT.treat = () => { const p = PT.mine; if (!p) return; p.wag = 4; p.hop = 0.5; if (AF.audio && !p.def.cat) AF.audio.play('an_dog', { x: p.x, y: p.y, z: p.z }); AF.emit('bubble', { who: p, name: p.def.name, text: p.def.cat ? 'Prrrr \u2665' : 'Woof! \u2665', dur: 2.5 }); toast({ text: p.def.name + ' does a happy little spin.', kind: 'pet' }); };
  // pet it (E)
  let petIt = null;
  AF.onBuild('pets-interact', 897, () => {
    petIt = AF.addInteract({ x: 0, y: -999, z: 0, r: 1.0, prio: -0.2, label: 'Pet', can: () => AF.mode === 'walk' && !!PT.mine,
      act: () => { const p = PT.mine; if (!p) return; p.wag = 3; p.hop = p.def.cat ? 0 : 0.45; AF.emit('bubble', { who: p, name: p.def.name, text: '\u2665', dur: 1.8 }); if (AF.audio && !p.def.cat && Math.random() < 0.5) AF.audio.play('an_dog', { x: p.x, y: p.y, z: p.z, vol: 0.6 }); } });
  });
  AF.on('friend', () => { PT.set(activeId(), true); });

  // ---------------------------------------------------------------- co-op: everyone else's pets follow their avatars (local, derived)
  const remote = new Map();   // slot -> follower
  function sendPet() { if (N && N.role !== 'off' && N.live && N.live()) N.send('pet', { id: PT.mine ? PT.mine.id : '' }); }
  if (N && N.on) {
    N.on('pet', (m, from) => {
      const id = m && typeof m.id === 'string' && Object.hasOwn(PETS, m.id) ? m.id : '';
      const cur = remote.get(from); if (cur && cur.id === id) return;
      if (cur) { drop(cur); remote.delete(from); }
      if (!id || !AF.coop) return;
      const leader = () => { const r = AF.coop.players.get(from); if (!r || !r.seen || !r.P) return null; return { x: r.x, y: r.y, z: r.z, yaw: r.P.root.rotation.y, walk: r.mode === 0 && !r.dead }; };
      const f = make(id, leader); if (f) remote.set(from, f);
    });
    N.on('join', () => setTimeout(sendPet, 600));
    N.on('welcome', () => setTimeout(sendPet, 600));
    N.on('left', (p) => { const f = p && remote.get(p.slot); if (f) { drop(f); remote.delete(p.slot); } });
    N.on('end', () => { for (const f of remote.values()) drop(f); remote.clear(); });
  }

  // ---------------------------------------------------------------- Paws & Claws (north end of Friends Lane, door onto the lane)
  const SHOP = PT.shop = { x0: -360, z0: -252, x1: -340, z1: -236, door: { x: -360, y: 0.25, z: -244, yaw: PI / 2 }, counter: { x: -344.4, z: -244 } };
  AF.onBuild('pets-store', 486, () => {
    const W = AF.W, K = AF.westKit, col = K ? K.col : (h, o) => AF.col(h, o), glow = K ? K.glow : (h) => AF.col(h, { emit: h, emitK: 2 });
    const { x0, z0, x1, z1 } = SHOP;
    const wall = col(0xf6e8ef, { pat: 'stucco' }), trim = col(0xff5fae), floor = col(0xe8d6c0, { pat: 'checker' }), glass = col(0xbcd6dc, { glass: true, jitter: 0.03, edge: 0 }), wood = col(0x9a6a3e, { pat: 'plank' });
    const pave = col(0xc9c1b4, { pat: 'none', patTop: 'slab', jitter: 0.3 }), lawn = col(0x6f9a3e, { jitter: 0.9 });
    // a level lot, a paved forecourt to the lane
    W.eachCol(x0 - 2, z0 - 6, x1 + 6, z1 + 6, (bx, bz, i, x, z) => { W.H[i] = 1; W.C[i] = x < x0 + 0.01 || (z > -247 && z < -241 && x < x0 + 1) ? pave : lawn; W.S[i] = 0; });
    W.eachCol(-364, -247, x0, -241, (bx, bz, i) => { W.H[i] = 1; W.C[i] = pave; });
    W.tDirty = true;
    const y0 = 0.25, top = 4.75;
    W.paint(x0, z0, x1, z1, floor);
    W.walls(x0, y0, z0, x1, top, z1, wall);
    W.fill(x0 - 0.25, top, z0 - 0.25, x1 + 0.25, top + 0.25, z1 + 0.25, trim); W.fill(x0, top + 0.25, z0, x1, top + 0.5, z1, wall);
    // the shopfront: two display windows, the door, a striped awning, the sign
    W.fill(x0, y0 + 0.75, z0 + 1.5, x0 + 0.25, y0 + 3, -246, glass); W.fill(x0, y0 + 0.75, -242, x0 + 0.25, y0 + 3, z1 - 1.5, glass);
    W.clear(x0, y0, -245.5, x0 + 0.25, y0 + 2.75, -242.5);
    for (let z = z0 + 1; z < z1 - 1; z += 0.5) W.fill(x0 - 1.5, y0 + 3.25, z, x0, y0 + 3.5, z + 0.5, Math.round(z * 2) & 1 ? trim : col(0xffffff));
    if (K && K.text) AF.placeStatic(K.text('PAWS & CLAWS', 0xff4fa3, { vs: 1 / 10, k: 2.4 }), x0 - 0.1, y0 + 3.6, -244, 3, { collide: false });
    // inside: the counter, shelves of food tins, a pen
    W.fill(-343, y0, -248, -342, y0 + 1.1, -240, wood); W.fill(-343.25, y0 + 1.1, -248.25, -341.75, y0 + 1.25, -239.75, trim);
    const tins = [0xff5fae, 0x3aa0ff, 0xf2c24a, 0x7ddc8a, 0xb68ae0];
    for (const z of [z0 + 0.25, z1 - 0.5]) for (let x = x0 + 2; x < x1 - 3; x += 0.5) { for (const sy of [0.75, 1.5, 2.25]) { W.fill(x, y0 + sy, z, x + 0.5, y0 + sy + 0.25, z + 0.25, wood); if (((x * 2) | 0) % 3) W.fill(x, y0 + sy + 0.25, z, x + 0.25, y0 + sy + 0.75, z + 0.25, col(tins[((((x * 2) | 0) + sy * 4) % 5 + 5) % 5])); } }
    W.fill(-352, y0, -250, -347, y0 + 0.75, -249.75, col(0xffffff)); W.fill(-352, y0, -250, -351.75, y0 + 0.75, -246, col(0xffffff)); W.fill(-347.25, y0, -250, -347, y0 + 0.75, -246, col(0xffffff));
    W.fill(-351.75, y0, -249.75, -347.25, y0 + 0.25, -246.25, col(0xd8c8a0));
    W.fill(-350.5, y0 + 4.25, -244.5, -349.5, y0 + 4.5, -243.5, glow(0xfff0d0, 1.6, 'always'));
    AF.addLight({ x: -350, y: y0 + 4, z: -244, color: 0xffe8c8, intensity: 1.1, range: 12, kind: 'interior' });
    AF.addBuilding({ id: 'pet-store', name: 'Paws & Claws', kind: 'pets', box: [x0, 0, z0, x1, 5, z1], doors: [{ x: x0, y: y0, z: -244, yaw: PI / 2 }], interior: true, owner: 'west' });
  });
  const sheet = () => {
    const TABS = ['Dogs', 'Cats', 'Yours', 'Treats'];
    AF.shop.open({ title: 'Paws & Claws', sub: 'A pet for every personality \u2014 they follow you everywhere', tabs: TABS, items: (tab) => {
      const f = me(), mine = owned(f), on = activeId(f), fN = AF.friends.current ? AF.friends.current.name : 'you';
      if (tab === 0 || tab === 1) return Object.keys(PETS).filter((id) => !!PETS[id].cat === (tab === 1)).map((id) => {
        const d = PETS[id], have = mine.includes(id);
        return { name: d.name + ' \u00b7 ' + d.breed, desc: have ? (on === id ? 'Walking with ' + fN : 'Yours \u2014 tap to walk together') : d.desc, price: d.price, tag: have ? (on === id ? 'With you' : 'Owned') : null,
          act: () => { if (have) { PT.set(id); AF.shop.refresh(); return; } AF.shop.buy(d.price, d.name, () => { const s = PS(), o = s.own[f] || (s.own[f] = []); if (!o.includes(id)) o.push(id); PT.set(id); }); } };
      });
      if (tab === 2) return (mine.length ? mine.map((id) => ({ name: PETS[id].name, desc: PETS[id].breed + (on === id ? ' \u00b7 with you' : ''), tag: on === id ? 'With you' : 'Walk', off: on === id, act: () => { PT.set(id); AF.shop.refresh(); } })) : [{ name: 'No pets yet', desc: 'Pick one in Dogs or Cats', tag: ' ', off: true }])
        .concat(on ? [{ name: 'Leave ' + PETS[on].name + ' at home', desc: 'They\u2019ll wait for you', tag: 'Home', act: () => { PT.set(''); AF.shop.refresh(); } }] : []);
      const n = AF.inv ? AF.inv.count('treat') : 0;
      return [{ name: 'Pet treats \u00d73', desc: 'In your bag (' + n + ') \u2014 your pet does a trick', price: 5, off: n > 6, act: () => AF.shop.buy(5, 'treats', () => { AF.inv.add({ id: 'treat', name: 'Pet treats', kind: 'treat' }, 3); }) }];
    } });
  };
  AF.onBuild('pets', 896, () => {
    AF.addInteract({ x: SHOP.counter.x, y: 1.3, z: SHOP.counter.z, r: 2.4, prio: 1.4, label: 'Paws & Claws \u00b7 pets & treats', can: () => AF.mode === 'walk', act: sheet });
    if (AF.npc) AF.npc.spawn({ id: 'pets-keeper', name: 'Polly', role: 'Paws & Claws', x: -341.4, y: 0.25, z: -244, yaw: -PI / 2, r: 0.1,
      look: { female: true, skin: 0xe8b894, hair: 0x7a3a1a, hairStyle: 'pony', top: { col: 0x2f9a8a, col2: 0xffffff, style: 'tee' }, bottom: { col: 0x3a4a6a, style: 'jeans' }, shoe: 0x2a2a2a, height: 0.97 },
      greet: ['Hello! Looking for a new best friend?', 'Treats are by the till!'], lines: [['Every pet here is house-trained and adventure-ready.', 'They follow you anywhere \u2014 buy one at the counter.']] });
    if (AF.mission) AF.mission.blip('pets', { x: -350, z: -244, kind: 'pet', label: 'Paws & Claws' });
    // display pets in the shop (static: a poodle in the pen, two cats on the shelves' end)
    const show = (spec, x, y, z, yaw) => { const k = kitOf(spec); if (!k) return; const g = new THREE.Group(), VS = AF.animalsKit.VS; const b = new THREE.Mesh(k.A, AF.mat.voxel), hd = new THREE.Mesh(k.H, AF.mat.voxel); hd.position.set(0, (k.S.lh + k.S.bh - 2) * VS, (k.S.len / 2 - 1) * VS); g.add(b, hd); g.position.set(x, y, z); g.rotation.y = yaw; g.traverse((m) => { m.castShadow = false; }); AF.scene.add(g); };
    show('poodle', -349.5, 0.5, -248, 0.8); show('tabby', -357, 0.25, -250.5, 0.4); show('beagle', -356, 0.25, -238.5, 2.6);
    PT.set(activeId(), true);
  });

  // ---------------------------------------------------------------- tick (followers only when someone has a pet)
  AF.onTick('pets', 322, (dt, t) => {
    if (!followers.length) return;
    const cam = AF.camera.position;
    for (const p of followers) step(p, Math.min(dt, 0.05), t, cam);
    const p = PT.mine;
    if (petIt) { if (p && p.root.visible) { petIt.x = p.x; petIt.y = p.y + 0.5; petIt.z = p.z; petIt.label = 'Pet ' + p.def.name; } else petIt.y = -999; }
  });

  AF.test('pets: Hunar starts with Coco, a bought pet follows on foot and waits out a drive', () => {
    const SAVE = PS(), FR = AF.friends, cur = FR.current, keepOwn = JSON.stringify(SAVE.own), keepOn = JSON.stringify(SAVE.on), P = AF.player, mode = AF.mode, keep = { x: P.x, y: P.y, z: P.z, yaw: P.yaw };
    let hunar = false, follows = false, hides = false, back = false;
    try {
      FR.current = FR.byId.hunar; delete SAVE.on.hunar; SAVE.own.hunar = [];
      hunar = owned('hunar').includes('coco') && activeId('hunar') === 'coco';
      SAVE.own.hunar = ['scout']; PT.set('scout', true);
      if (AF.mode !== 'walk') AF.setMode('walk', {});
      const p = PT.mine; if (!p || p.id !== 'scout') return { ok: false, info: 'no pet' };
      const cam = { get x() { return P.x; }, get z() { return P.z; } };
      for (let i = 0; i < 40; i++) step(p, 1 / 30, i / 30, cam);
      P.x = P.body.x += 5; P.z = P.body.z;
      for (let i = 0; i < 90; i++) step(p, 1 / 30, i / 30, cam);
      follows = Math.hypot(p.x - P.x, p.z - P.z) < 3;
      p.leader = () => ({ x: P.x, y: P.y, z: P.z, yaw: P.yaw, walk: false }); step(p, 1 / 30, 0, cam); hides = !p.root.visible && p.away;
      p.leader = myLeader; step(p, 1 / 30, 0, cam); back = !p.away && Math.hypot(p.x - P.x, p.z - P.z) < 3;
    } finally { SAVE.own = JSON.parse(keepOwn); SAVE.on = JSON.parse(keepOn); FR.current = cur; if (PT.mine) { drop(PT.mine); PT.mine = null; } PT.set(activeId(), true); AF.setMode(mode === 'walk' ? 'walk' : 'aerial', keep); AF.saveSoon(); }
    return { ok: hunar && follows && hides && back, info: `hunar coco ${hunar}, follows ${follows}, hides ${hides}, back ${back}` };
  });
}
} catch (e) { AF.partError('58-pets.js', e); }
