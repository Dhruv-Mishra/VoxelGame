// ================================================================ 57-friends.js
try {
// ===== 57-friends: the six friends (+ Divyangana) — playable characters, their looks, NPCs in their houses, dialogue,
//       proximity greetings, and a small NPC kit (AF.npc) the zoo + airfield staff use too  (OWNER: west) =====
{
  const PI = Math.PI;
  // ---------------------------------------------------------------- the cast (all 25). Heights: tall 1.08 · between 1.035 · moderate 0.97 · short 0.9
  const CAST = [
    { id: 'dhruv', name: 'Dhruv', home: 'dhruv', tag: 'The Architect', blurb: 'Builds things that hum after midnight. Always three steps into the next idea.',
      look: { skin: 0xc68a5e, hair: 0x1c1410, hairStyle: 'fade', top: { col: 0x1f2a3a, col2: 0x3aa0ff, style: 'tee', print: 0x3aa0ff }, bottom: { col: 0x4a4e56, style: 'joggers' }, shoe: 0xf2f2f2, height: 1.08 } },
    { id: 'hunar', name: 'Hunar', home: 'hunar', tag: 'The Trendsetter', blurb: 'Walks in and the room gets a colour palette. Never misses a detail.', female: true,
      look: { female: true, skin: 0xd9a07a, hair: 0x3a2418, hairStyle: 'wavy', glasses: 0xff4fa3, lips: 0xd0406a, top: { col: 0xff5fae, col2: 0xffffff, style: 'dress' }, bottom: { col: 0xff5fae, style: 'skirt' }, shoe: 0xffffff, extra: 'bow', height: 0.97 } },
    { id: 'tanishk', name: 'Tanishk', home: 'tanishk', tag: 'The Strategist', blurb: 'Plays the long game in everything. Calm under pressure, loud at the finish.',
      look: { skin: 0xc98d62, hair: 0x14100c, hairStyle: 'spiky', top: { col: 0x1d1d20, col2: 0xf7931a, style: 'hoodie', print: 0xf7931a }, bottom: { col: 0x1d1d20, style: 'joggers' }, shoe: 0xd4a84a, extra: 'chain', height: 1.08 } },
    { id: 'diksha', name: 'Diksha', home: 'diksha', tag: 'The Storyteller', blurb: 'Lives by lyrics and late-night playlists. Has a song for every mood.', female: true,
      look: { female: true, skin: 0xd8a07c, hair: 0x2a1a12, hairStyle: 'long', bangs: true, glasses: 0x2a2a2e, lips: 0xc0303a, top: { col: 0xb68ae0, col2: 0xffffff, style: 'tee', print: 0xffd0f0 }, bottom: { col: 0xff8fc8, style: 'skirt' }, shoe: 0xf2f2f2, height: 0.97 } },
    { id: 'kush', name: 'Kush', home: 'kush', tag: 'Player One', blurb: 'Always ready for the next level. Generous host, fearless in a boss fight.',
      look: { skin: 0xc08050, hair: 0x14100c, hairStyle: 'short', glasses: 0x141414, beard: 0x1a120c, top: { col: 0x2f7a4a, col2: 0xf2f2f2, style: 'hoodie', print: 0x8adf9a }, bottom: { col: 0x3f5f8f, style: 'jeans' }, shoe: 0x202024, extra: 'headphones', height: 1.08 } },
    { id: 'divyangana', name: 'Divyangana', home: 'kush', tag: 'The Co-op Captain', blurb: 'Quiet confidence, top of the leaderboard. Keeps the whole house running.', female: true,
      look: { female: true, skin: 0xdca47e, hair: 0x2a1810, hairStyle: 'bun', glasses: 0xc8a050, lips: 0xc85a6a, top: { col: 0xf2c24a, col2: 0xffffff, style: 'tee', print: 0xff6f8a }, bottom: { col: 0x4a6a9a, style: 'jeans' }, shoe: 0xffffff, height: 0.9 } },
    { id: 'kaybee', name: 'Kaybee', home: 'kaybee', tag: 'The Adventurer', blurb: 'Chases horizons and checkmates. The treasure is always one island away.',
      look: { skin: 0xc88a5a, hair: 0x14100c, hairStyle: 'messy', top: { col: 0xc8322a, col2: 0xc8322a, style: 'vest' }, bottom: { col: 0x2f5a9a, style: 'shorts' }, shoe: 0x8a5a2a, hat: 'straw', hatCol: 0xe8c86a, height: 1.035 } },
    { id: 'niranjan', name: 'Niranjan', home: 'niranjan', tag: 'The Musician', blurb: 'Strings, chords and golden-hour sessions. Turns any porch into a stage.',
      look: { skin: 0xc4885c, hair: 0x16110d, hairStyle: 'messy', top: { col: 0x3e2c4e, col2: 0xe0c078, style: 'shirt' }, bottom: { col: 0x2a2e38, style: 'jeans' }, shoe: 0x5a3a24, extra: 'guitar', height: 0.97 } },
  ];
  const BY = Object.fromEntries(CAST.map((c) => [c.id, c]));
  // ---------------------------------------------------------------- what they say. {you} = whoever you are playing
  const LINES = {
    dhruv: {
      greet: ['Hey {you}, welcome in.', 'Careful around the cables, {you}.', 'Good timing, {you}; I just finished a new build.', 'The server rack says hello, {you}.'],
      talk: [
        ['Hey {you}, perfect timing. I just deployed a new build.', 'On a Friday, I know. Please do not tell anyone.', 'If the lights flicker, the server rack is probably working too hard.'],
        ['I built this computer myself. One screen for code, one for notes, and one for music.', 'I set a new gym record and finished a big code change today. Good day.'],
        ['Want a tour? There is my desk, the server rack, and the weight bench.', 'Tanishk keeps asking me to invest in a digital coin. I told him I already spend enough on memory upgrades.'],
        ['Want a protein shake? There is more in the kitchen.', 'Leave the chocolate one for me. It is holding this shelf together.'],
      ],
    },
    hunar: {
      greet: ['{you}! I am so glad you are here!', 'I love your outfit today, {you}.', 'Welcome to the Dreamhouse!', 'Is that a new look, {you}?'],
      talk: [
        ['Welcome to the Dreamhouse, {you}! Everything is pink. Yes, everything.', 'Even the car in the garage. Especially the car.'],
        ['I am planning outfits for the week. It is only Tuesday, and I have already picked fourteen.', 'Choosing the right colours makes every day more fun.'],
        ['Diksha and I are planning a movie night. You should join us.', 'We are picking a pink outfit theme, so start planning.'],
        ['These glasses are designer. They look good and help me see.', 'I know. They suit me perfectly.'],
      ],
    },
    tanishk: {
      greet: ['Hey {you}, good to see you.', 'Morning, {you}.', 'The charts are up today!', 'Are you going to the gym later, {you}?'],
      talk: [
        ['Morning, {you}! Most of the charts are up today. Let us ignore the one that is down.', 'My plan is simple: be patient with investments and keep training.'],
        ['I put up a sign to remind myself to hold on to good investments.', 'It also reminds me to keep a steady grip during deadlifts.'],
        ['Dhruv says my digital coins are not real money.', 'I bought a gold car with them, so I think they count.'],
        ['A weight bench, a trading desk, and a safe. That is everything I need.', 'One tip: drink water and spread your investments around. Mostly, drink water.'],
      ],
    },
    diksha: {
      greet: ['Hi {you}! I made you a new playlist.', '{you}! It has been too long.', 'Welcome, welcome!', 'Come in, {you}; let us find you a good song.'],
      talk: [
        ['{you}, you made it! Sit down; I am putting together a playlist.', 'It is all pop music, sorted by album and mood. Obviously.'],
        ['Thirteen is my lucky number.', 'That is why I put it on the wall in neon. It looks good there.'],
        ['Hunar and I are planning a movie night. I am bringing friendship bracelets.', 'I made one for you too, {you}. It has your name on it.'],
        ['If something is bothering you, {you}, take a breath and give yourself a minute.', 'If that does not help, come play the piano with me.'],
      ],
    },
    kush: {
      greet: ['Hey {you}! Grab a controller.', '{you}, you can be player two.', 'Welcome to the game room.', 'There are snacks on the counter, {you}.'],
      talk: [
        ['{you}, perfect timing. We need one more player for our co-op run.', 'Div usually leads the team. I handle the heavy work, including morale.'],
        ['That safe is full of cash. I like being able to see my savings.', 'Div says I should use a bank. Banks do not have colourful lights, though.'],
        ['The arcade cabinet has all the classics. I used to have the high score.', 'Then Div beat it. I am counting our team score.'],
        ['If Kaybee challenges you to chess, be ready for a serious game.', 'You might want to practise first, {you}.'],
      ],
    },
    divyangana: {
      greet: ['Hi {you}!', '{you}, come on in.', 'Kush, look who is here!', 'Hey {you}! Would you like some chai?'],
      talk: [
        ['Hi {you}! Ignore the mess; Kush reorganised the cash safe again.', 'By reorganised, I mean he counted all the money twice.'],
        ['Just so you know, I am the better gamer here.', 'Kush handles the snacks. That is an important job.'],
        ['We built this place together. I chose the neon sign.', 'Kush wanted it to say “Kush, Div, and Cash.” We settled on something simpler.'],
        ['Would you like to stay for dinner, {you}? Kush is cooking.', 'Well, he is ordering food. That counts.'],
      ],
    },
    kaybee: {
      greet: ['{you}! Good to see you, mate.', 'Hey {you}, want to play a game?', 'Welcome aboard!', 'Ready for a chess match, {you}?'],
      talk: [
        ['{you}, welcome aboard! This is my living room, but I have given it a pirate-ship theme.', 'The chessboard floor is large enough for a crew of giants.'],
        ['Every pirate needs a hidden treasure chest. I think mine is right over there.', 'It is full of gold coins from Tanishk. Do not tell him I found them.'],
        ['Want to play chess? Best of three. I will even give you a head start.', 'Just kidding. I never go easy on a worthy opponent.'],
        ['One day, I will captain the greatest pirate crew around.', 'For now, I am happy ruling this little colony. Kush may disagree.'],
      ],
    },
  };
  // the lovebirds see each other differently
  LINES.niranjan = {
    greet: ['{you}, perfect timing. I just tuned my guitar.', 'Hey {you}, want to hear something new?', 'Sit anywhere, {you}; just mind the cables.', 'Golden hour is coming, {you}. Want to play on the porch?'],
    talk: [
      ['{you}, I wrote a short guitar riff this morning and cannot stop playing it.', 'It is only eight bars. I have played it four hundred times, and I still like it.'],
      ['I have three guitars, a piano, and neighbours who have not complained yet.', 'There is a small stage out back for Friday nights. You are on the guest list.'],
      ['Every house in the colony has its own sound, {you}.', 'Kush has game sounds, Diksha has music, and I have a little too much guitar feedback.'],
      ['A good song needs a little space between the notes.', 'A room does too. That is why I keep the amplifier in the corner.'],
    ],
  };
  const SPECIAL = {
    'kush>divyangana': { greet: ['Hey, you are home!', 'I saved you a controller, Div.'], talk: [['There you are! I kept your seat warm.', 'And I only ate half the snacks. I am improving.']] },
    'divyangana>kush': { greet: ['Hey, I missed you.', 'Kush, where have you been?'], talk: [['You are back! Our co-op run is better with you here.', 'You still owe me a rematch.']] },
  };

  // ---------------------------------------------------------------- AF.npc: static people who stand or sit, look at you, greet you and talk
  const N = AF.npc = { list: [] };
  AF.npcs = N.list;
  const you = () => (AF.friends && AF.friends.current ? AF.friends.current.name : 'friend');
  const fill = (s) => String(s).replace(/\{you\}/g, you()).replace(/\{YOU\}/g, you().toUpperCase());
  N.spawn = (o) => {
    const P = o.visual === false ? { root: new THREE.Group() } : AF.avatar.build(o.look);
    const root = P.root; root.position.set(o.x, o.y, o.z); root.rotation.y = o.yaw || 0;
    if (o.pose === 'sit' && o.visual !== false) AF.avatar.sit(P, true, o.seatH ?? 0.75);
    AF.scene.add(root);
    const n = { id: o.id || ('npc' + N.list.length), first: o.name, name: o.name, role: o.role || '', x: o.x, y: o.y, z: o.z, yaw: o.yaw || 0, yaw0: o.yaw || 0, root, parts: P,
      st: { phase: 0, speed: 0, air: 0, t: Math.random() * 10, land: 0, typing: !!o.typing }, visual: o.visual !== false, pose: o.pose || 'stand', lines: o.lines || null, greet: o.greet || null, ti: 0, greetT: -99, hidden: false };
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
      if (walk && pl && !n.walk) {
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
      // n.walk: a story NPC led along a path by its mission (81-heist moves n.x/z/yaw and sets the speed) walks instead of standing
      if (n.visual) AF.avatar.animate(n.parts, n.st, dt, n.walk || 0, true);
    }
  });

  // ---------------------------------------------------------------- the friends in their houses + their cars in the garages
  const GARAGE = {
    dhruv: [['arrow', 0], ['moto', 0]], hunar: [['speedster', 1], ['moto', 1]], tanishk: [['speedster', 0], ['moto', 2]],
    diksha: [['cord', 1], ['moto', 3]], kush: [['duesy', 0], ['moto', 4]], kaybee: [['arrow', 1], ['moto', 5]], niranjan: [['coupe', 1], ['moto', 1]],
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
