// ================================================================ 57-friends.js
try {
// ===== 57-friends: the six friends (+ Divyangana) — playable characters, their looks, NPCs in their houses, dialogue,
//       proximity greetings, and a small NPC kit (AF.npc) the zoo + airfield staff use too  (OWNER: west) =====
{
  const PI = Math.PI;
  // ---------------------------------------------------------------- the cast (all 25). Heights: tall 1.08 · between 1.035 · moderate 0.97 · short 0.9
  const CAST = [
    { id: 'dhruv', name: 'Dhruv', home: 'dhruv', tag: 'Computers & the gym', blurb: 'Tall, clean-shaven, three monitors and a bench press.',
      look: { skin: 0xc68a5e, hair: 0x1c1410, hairStyle: 'fade', top: { col: 0x1f2a3a, col2: 0x3aa0ff, style: 'tee', print: 0x3aa0ff }, bottom: { col: 0x4a4e56, style: 'joggers' }, shoe: 0xf2f2f2, height: 1.08 } },
    { id: 'hunar', name: 'Hunar', home: 'hunar', tag: 'Pink, Barbie & fashion', blurb: 'Specs, style, and a wardrobe with its own postcode.', female: true,
      look: { female: true, skin: 0xd9a07a, hair: 0x3a2418, hairStyle: 'wavy', glasses: 0xff4fa3, lips: 0xd0406a, top: { col: 0xff5fae, col2: 0xffffff, style: 'dress' }, bottom: { col: 0xff5fae, style: 'skirt' }, shoe: 0xffffff, extra: 'bow', height: 0.97 } },
    { id: 'tanishk', name: 'Tanishk', home: 'tanishk', tag: 'Crypto & the gym', blurb: 'Tall, clean-shaven, charts always green (mostly).',
      look: { skin: 0xc98d62, hair: 0x14100c, hairStyle: 'spiky', top: { col: 0x1d1d20, col2: 0xf7931a, style: 'hoodie', print: 0xf7931a }, bottom: { col: 0x1d1d20, style: 'joggers' }, shoe: 0xd4a84a, extra: 'chain', height: 1.08 } },
    { id: 'diksha', name: 'Diksha', home: 'diksha', tag: 'Taylor Swift & Barbie', blurb: 'Specs, every era, and thirteen friendship bracelets.', female: true,
      look: { female: true, skin: 0xd8a07c, hair: 0x2a1a12, hairStyle: 'long', bangs: true, glasses: 0x2a2a2e, lips: 0xc0303a, top: { col: 0xb68ae0, col2: 0xffffff, style: 'tee', print: 0xffd0f0 }, bottom: { col: 0xff8fc8, style: 'skirt' }, shoe: 0xf2f2f2, height: 0.97 } },
    { id: 'kush', name: 'Kush', home: 'kush', tag: 'Video games & cash', blurb: 'Tall, beard, specs, and a safe full of cash.',
      look: { skin: 0xc08050, hair: 0x14100c, hairStyle: 'short', glasses: 0x141414, beard: 0x1a120c, top: { col: 0x2f7a4a, col2: 0xf2f2f2, style: 'hoodie', print: 0x8adf9a }, bottom: { col: 0x3f5f8f, style: 'jeans' }, shoe: 0x202024, extra: 'headphones', height: 1.08 } },
    { id: 'divyangana', name: 'Divyangana', home: 'kush', tag: 'Lives with Kush', blurb: 'Short, specs, the actual gamer of the house.', female: true,
      look: { female: true, skin: 0xdca47e, hair: 0x2a1810, hairStyle: 'bun', glasses: 0xc8a050, lips: 0xc85a6a, top: { col: 0xf2c24a, col2: 0xffffff, style: 'tee', print: 0xff6f8a }, bottom: { col: 0x4a6a9a, style: 'jeans' }, shoe: 0xffffff, height: 0.9 } },
    { id: 'kaybee', name: 'Kaybee', home: 'kaybee', tag: 'Games, One Piece & chess', blurb: 'Straw hat, a chessboard floor, and a treasure chest.',
      look: { skin: 0xc88a5a, hair: 0x14100c, hairStyle: 'messy', top: { col: 0xc8322a, col2: 0xc8322a, style: 'vest' }, bottom: { col: 0x2f5a9a, style: 'shorts' }, shoe: 0x8a5a2a, hat: 'straw', hatCol: 0xe8c86a, height: 1.035 } },
  ];
  const BY = Object.fromEntries(CAST.map((c) => [c.id, c]));
  // ---------------------------------------------------------------- what they say. {you} = whoever you are playing
  const LINES = {
    dhruv: {
      greet: ['Yo {you}! Welcome in.', 'Hey {you}, mind the cables.', 'Leg day was brutal, not gonna lie.', 'Server rack says hi, {you}.'],
      talk: [
        ['Oh hey {you}! Perfect timing \u2014 I just pushed to prod.', '\u2026on a Friday. Don\u2019t tell anyone.', 'If the lights flicker, that\u2019s the server rack. Totally normal.'],
        ['Built this rig myself. Three monitors: one for code, one for docs, one for gym playlists.', 'Hit a new PR today. A code PR AND a bench PR. Double merge.'],
        ['Want the tour? Desk, rack, bench. That\u2019s basically my whole personality.', 'Tanishk keeps telling me to put my savings into some coin. I told him I\u2019m invested in RAM.'],
        ['Protein shake? There\u2019s a whole shelf in the kitchen.', 'Don\u2019t touch the chocolate one. That one\u2019s load-bearing.'],
      ],
    },
    hunar: {
      greet: ['{you}! Oh my god, hi!!', 'Love the fit today, {you}.', 'Welcome to the Dreamhouse!', 'Is that a new look, {you}?'],
      talk: [
        ['Welcome to the Dreamhouse, {you}! Everything is pink. Yes, everything.', 'Even the car in the garage. ESPECIALLY the car in the garage.'],
        ['I\u2019m planning outfits for the week. It\u2019s Tuesday and I\u2019m on outfit fourteen.', 'Life in plastic \u2014 it\u2019s fantastic!'],
        ['Diksha and I are doing a Barbie movie night. You\u2019re invited.', 'Dress code is pink. Non-negotiable, by the way.'],
        ['These specs? Designer. Fashion AND vision.', 'Iconic, I know.'],
      ],
    },
    tanishk: {
      greet: ['{you}! WAGMI, bro.', 'gm gm, {you}.', 'Charts are green today!', 'You lifting later, {you}?'],
      talk: [
        ['gm {you}! Check the screens \u2014 all green. Mostly. Don\u2019t look at that red one.', 'Buy the dip, lift the weights. That\u2019s the whole strategy.'],
        ['HODL isn\u2019t just a sign, it\u2019s a lifestyle.', 'It\u2019s also how I hold the bar on deadlifts.'],
        ['Dhruv says my coins aren\u2019t real money.', 'I bought a gold car with them. So.'],
        ['Squat rack, trading desk, vault. Everything a man needs.', 'Want a tip? Hydrate. Also diversify. Mostly hydrate.'],
      ],
    },
    diksha: {
      greet: ['Hi {you}! Are you ready for it?', '{you}! It\u2019s been a long time coming.', 'Welcome, welcome!', 'Shake it off, {you}!'],
      talk: [
        ['{you}! You made it! Sit, sit \u2014 I\u2019m making a playlist.', 'It\u2019s all Taylor. Every era. In order. Obviously.'],
        ['Thirteen is my lucky number \u2014 same as Taylor\u2019s.', 'That\u2019s why it\u2019s on the wall. In neon. Tastefully.'],
        ['Hunar and I are doing Barbie night. I\u2019m bringing the friendship bracelets.', 'I made you one too, {you}. It has your name on it. Wear it.'],
        ['Whatever\u2019s bothering you, {you}\u2026 just shake it off.', 'And if that doesn\u2019t work, piano. Piano always works.'],
      ],
    },
    kush: {
      greet: ['Ayy {you}! Grab a controller.', '{you}, you\u2019re player two.', 'Welcome to the base.', 'Snacks are on the counter, {you}.'],
      talk: [
        ['{you}! Perfect, we need a third for the co-op run.', 'Div\u2019s carrying, as usual. I\u2019m the tank. Emotionally too.'],
        ['That safe? Cash. Real cash. I like to SEE my money.', 'Div says I should use a bank like a normal person. Banks don\u2019t have RGB though.'],
        ['The arcade cabinet\u2019s got every classic. High score is mine.', 'Well, Div\u2019s. Well\u2026 ours. We\u2019re a team.'],
        ['If Kaybee challenges you to chess, just say no.', 'Save yourself, {you}.'],
      ],
    },
    divyangana: {
      greet: ['Hi {you}!', '{you}! Come in, come in.', 'Kush, look who\u2019s here!', 'Hey {you}! Want some chai?'],
      talk: [
        ['Hi {you}! Ignore the mess \u2014 Kush \u201creorganised\u201d the cash safe again.', 'By reorganised I mean he counted it. Twice.'],
        ['Just so you know, I\u2019m the actual gamer here.', 'He\u2019s the snacks guy. Very important role.'],
        ['We built this place together. The neon was my idea.', 'He wanted it to say KUSH & DIV & CASH. Compromise is key.'],
        ['Stay for dinner, {you}? He\u2019s cooking.', 'Well. Ordering. Same thing.'],
      ],
    },
    kaybee: {
      greet: ['{you}! Nakama!', 'Yo {you}, fancy a game?', 'Welcome aboard!', 'Check or mate, {you}?'],
      talk: [
        ['{you}! Welcome aboard the Thousand Sunny. Well \u2014 my living room.', 'The chessboard floor is regulation size. For giants.'],
        ['The One Piece is real! And I\u2019m pretty sure it\u2019s in that chest.', '\u2026it\u2019s gold coins. From Tanishk. Don\u2019t tell him.'],
        ['Chess? Best of three? I\u2019ll give you a head start \u2014 I\u2019ll only use my king.', 'Kidding. I never go easy.'],
        ['I\u2019m gonna be King of the Pirates.', 'Or at least king of this colony. Kush disagrees. Kush is wrong.'],
      ],
    },
  };
  // the lovebirds see each other differently
  const SPECIAL = {
    'kush>divyangana': { greet: ['Babe! You\u2019re home!', 'Saved you a controller, Div.'], talk: [['There she is! I kept your seat warm.', 'And I only ate HALF the snacks. Growth.']] },
    'divyangana>kush': { greet: ['Hey you. Missed you.', 'Kush! Where have you been?'], talk: [['Finally! The co-op run isn\u2019t the same without you.', 'Also you owe me a rematch.']] },
  };

  // ---------------------------------------------------------------- AF.npc: static people who stand or sit, look at you, greet you and talk
  const N = AF.npc = { list: [] };
  AF.npcs = N.list;
  const you = () => (AF.friends && AF.friends.current ? AF.friends.current.name : 'friend');
  const fill = (s) => String(s).replace(/\{you\}/g, you()).replace(/\{YOU\}/g, you().toUpperCase());
  N.spawn = (o) => {
    const P = AF.avatar.build(o.look);
    const root = P.root; root.position.set(o.x, o.y, o.z); root.rotation.y = o.yaw || 0;
    if (o.pose === 'sit') AF.avatar.sit(P, true, o.seatH ?? 0.75);
    AF.scene.add(root);
    const n = { id: o.id || ('npc' + N.list.length), first: o.name, name: o.name, role: o.role || '', x: o.x, y: o.y, z: o.z, yaw: o.yaw || 0, yaw0: o.yaw || 0, root, parts: P,
      st: { phase: 0, speed: 0, air: 0, t: Math.random() * 10, land: 0, typing: !!o.typing }, pose: o.pose || 'stand', lines: o.lines || null, greet: o.greet || null, ti: 0, greetT: -99, hidden: false };
    n.interact = AF.addInteract({ x: o.x, y: o.y + 1.0, z: o.z, r: o.r || 2.6, label: 'Talk to ' + o.name, prio: 0.3, can: () => AF.mode === 'walk' && !n.hidden, act: () => N.talk(n) });
    N.list.push(n);
    return n;
  };
  N.linesFor = (n) => {
    const me = AF.friends && AF.friends.current, sp = me && SPECIAL[n.id + '>' + me.id];
    return { greet: (sp && sp.greet) || n.greet || ['Hello!'], talk: (sp && sp.talk) || n.lines || [['Nice to meet you.']] };
  };
  N.talk = (n) => {
    const L = N.linesFor(n), set = L.talk[n.ti++ % L.talk.length];
    n.greetT = AF.clock.t;
    AF.emit('dialogue', { name: n.name, role: n.role, lines: set.map(fill), place: n.place || '' });
  };
  N.setHidden = (n, h) => { n.hidden = h; n.root.visible = !h; };
  // per frame: only the NPCs near the camera animate; they turn their head (and, standing, their body) toward you
  AF.onTick('npcs', 420, (dt) => {
    const cp = AF.camera.position, pl = AF.player, walk = AF.mode === 'walk';
    for (const n of N.list) {
      if (n.hidden) continue;
      const dc = (n.x - cp.x) ** 2 + (n.z - cp.z) ** 2;
      const vis = dc < 140 * 140; if (n.root.visible !== vis) n.root.visible = vis;
      if (!vis || dc > 60 * 60) continue;
      let look = null;
      if (walk && pl) {
        const dx = pl.x - n.x, dz = pl.z - n.z, d2 = dx * dx + dz * dz;
        if (d2 < 36 && Math.abs(pl.y - n.y) < 2.5) {
          const want = Math.atan2(dx, dz);
          if (n.pose === 'stand' && d2 < 12) n.yaw += AF.angDiff(n.yaw, want) * (1 - Math.exp(-dt * 3));
          look = AF.clamp(AF.angDiff(n.yaw, want), -1.1, 1.1);
          // a greeting bubble when you come close (once in a while)
          if (d2 < 20 && AF.clock.t - n.greetT > 30 && !(AF.ui && AF.ui.dialogueOpen && AF.ui.dialogueOpen())) {
            n.greetT = AF.clock.t; const g = N.linesFor(n).greet;
            AF.emit('bubble', { who: n, name: n.name, text: fill(g[Math.floor(Math.random() * g.length)]), dur: 3.6 });
          }
        } else if (n.pose === 'stand') n.yaw += AF.angDiff(n.yaw, n.yaw0) * (1 - Math.exp(-dt * 1));
      }
      n.st.lookYaw = look == null ? null : AF.lerp(n.st.lookYaw ?? 0, look, 1 - Math.exp(-dt * 5));
      n.root.rotation.y = n.yaw;
      AF.avatar.animate(n.parts, n.st, dt, 0, true);
    }
  });

  // ---------------------------------------------------------------- the friends in their houses + their cars in the garages
  const GARAGE = {
    dhruv: [['arrow', 0], ['moto', 0]], hunar: [['speedster', 1], ['moto', 1]], tanishk: [['speedster', 0], ['moto', 2]],
    diksha: [['cord', 1], ['moto', 3]], kush: [['duesy', 0], ['moto', 4]], kaybee: [['arrow', 1], ['moto', 5]],
  };
  const F = AF.friends = { cast: CAST, byId: BY, current: null, npcs: {} };
  AF.onBuild('friends', 820, () => {
    const WS = AF.PLAN.west;
    for (const c of CAST) {
      const h = WS.homes[c.home]; if (!h) continue;
      const slot = c.id === 'divyangana' ? h.npc[1] : h.npc[0]; if (!slot) continue;
      const n = N.spawn({ id: c.id, name: c.name, role: c.tag, look: c.look, x: slot.x, y: slot.y, z: slot.z, yaw: slot.yaw, pose: slot.pose, typing: slot.pose === 'sit' && c.id !== 'kush' && c.id !== 'divyangana', lines: LINES[c.id].talk, greet: LINES[c.id].greet });
      n.place = h.theme ? h.theme.name : ''; n.friend = true;
      F.npcs[c.id] = n;
    }
    const VV = AF.vehicles;
    if (VV && VV.makeCar) for (const id in GARAGE) {
      const h = WS.homes[id]; if (!h) continue;
      GARAGE[id].forEach(([type, paint], i) => { const g = h.garage[i]; if (g && VV.TYPES.find((t) => t.id === type)) { const car = VV.makeCar(type, paint, g.x, g.z, g.yaw); car.owner = id; } });
    }
  });
  F.homeOf = (id) => { const c = BY[id]; return c && AF.PLAN.west.homes[c.home]; };
  // play as a friend: their look, their front room, and they are no longer standing in it
  F.play = (id) => {
    const c = BY[id]; if (!c) return;
    F.current = c;
    try { localStorage.setItem('portSolace.friend', id); } catch (e) {}
    for (const k in F.npcs) N.setHidden(F.npcs[k], k === id);
    AF.player.setLook(c.look);
    const h = F.homeOf(id);
    if (h) {
      const s = h.spawn;
      AF.PLAN.spawn = { x: s.x, y: s.y, z: s.z, yaw: s.yaw };
      AF.setMode('walk', { x: s.x, y: s.y, z: s.z, yaw: s.yaw });
    } else AF.setMode('walk', {});
    AF.emit('friend', c);
  };
}

} catch (e) { AF.partError('57-friends.js', e); }
