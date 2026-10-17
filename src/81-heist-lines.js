// ================================================================ 81-heist-lines.js
try {
// ===== 81-heist-lines: every spoken line of the Harbour Trust Job (OWNER: game) =====
// id -> [Kokoro voice, speaker, text]. tools/vo-build.mjs reads this table and renders assets/vo/<id>.mp3 (Kokoro TTS); 81-heist plays
// them through AF.audio.voice(id) and shows the text as subtitles. Guard barks exist once per guard voice (g1..g4, m1/m2, zw).
{
  const V = { vera: 'af_heart', kit: 'am_liam', silas: 'bm_george', prescott: 'bm_lewis', ezra: 'bm_fable', mabel: 'af_sarah', gate: 'am_michael',
    tower: 'am_echo', tony: 'am_onyx', pit: 'bm_daniel', door: 'am_adam', det: 'am_onyx', dealer: 'af_nova', kestrel: 'bf_alice' };
  const L = AF.VO = {};
  const add = (who, name, lines) => { for (const k in lines) L[who + '.' + k] = [V[who], name, lines[k]]; };
  add('vera', 'Vera', {
    b1: 'Walk with me, all of you. You look like people who are tired of small change.',
    b2: 'The Harbour Trust. Eighteen inches of steel and the fattest vault on the coast. By sunrise, it\u2019s ours.',
    b3: 'My inside man, Kit Morrow, is hiding out on Serena Isle. Three kilometres of open water. You\u2019ll have to fly.',
    b4: 'But Westgate won\u2019t let just anyone past the crew gate. You\u2019ll need pilot\u2019s uniforms, and papers to match.',
    b5: 'Kovac the tailor makes the airline\u2019s uniforms. His shop shut an hour ago. Ezra Quill does the papers, at Harbour Stationers. Off you go.',
    offer: 'There\u2019s a job. The biggest this town has ever seen. But it needs a crew. Two of you at least, four at the most.',
    shop: 'Kovac\u2019s tailor shop. Shut for the night, with a watchman inside. The night grille has a padlock for each of you. Pick yours, and slip in behind him.',
    shop1: 'You\u2019re in. The uniforms hang on the rail behind the counter, one each. Stay low, and keep out of his torchlight.',
    shop2: 'Very dashing, all of you. Now find Ezra, at Harbour Stationers. He forges one licence at a time, so every one of you sits for his camera.',
    ezra: 'Papers in hand? Good. Westgate Airfield, the crew gate on the apron side.',
    plane: 'Serena Isle is due south, three kilometres out. Keep her low over the water.',
    island: 'There\u2019s the island. Put her down on the airstrip.',
    kit: 'Kit\u2019s on the terrace of Hotel Serena. Go and say hello.',
    tunnel: 'The smugglers\u2019 tunnel. Stay low and stay quiet. Crouch, and take them from behind.',
    cache: 'That\u2019s the cache. Three padlocks. One of you works the locks, the rest of you watch their back.',
    gear: 'Silenced pistols and a diamond core drill. Christmas came early.',
    cove: 'Company in the cove! Fight your way to the jet skis!',
    ski: 'The Solace Queen is anchored halfway back to the city. Open her up.',
    ski2: 'There\u2019s a pontoon on her port side. Come aboard there.',
    q1: 'Evening, darlings. Prescott is in the high roller salon on the upper deck. Staff only.',
    q2: 'So become staff. There\u2019s a waiter in the pantry and a dealer in the crew lounge. Put them to sleep and borrow their clothes.',
    qsolo: 'On your own? Then be the waiter. Prescott loses his temper every few hands. That\u2019s your moment.',
    q3: 'Uniform on. Take the crew stairs up to the salon.',
    q4: 'Dealer, take over his table. Waiter, grab a tray at the salon bar.',
    q5: 'Deal him a rotten hand just as the drink arrives. He\u2019ll be far too busy shouting to notice a thing.',
    got: 'The key is ours. Now see Silas, in his office behind the purser\u2019s cage.',
    m1: 'Midnight. One of you gets us eyes on the inside. Everyone else goes into the bank.',
    m2: 'Kestrel Systems runs the Harbour Trust\u2019s cameras. Their old fibre line runs through a war bunker under the zoo.',
    m3: 'The way in is through the lion house. Borrow a keeper\u2019s uniform, and for heaven\u2019s sake, don\u2019t wake the lions.',
    msolo: 'On your own? Then do the hack first, and take the bank after. Kestrel\u2019s tablet will give you the cameras.',
    roof: 'Inside crew, get onto the Harbour Trust\u2019s roof. Parachute in, or use the service ladder on Park Row.',
    z1: 'The keepers\u2019 lockers are in the service yard. Grab a uniform.',
    z2: 'The lion house. Slow and quiet. If they wake up, run.',
    z3: 'There\u2019s the hatch. Down you go.',
    h1: 'We\u2019re in. You see what I see? Talk our inside man through it.',
    hatch: 'The roof hatch is on a Kestrel lock. Our hacker can pop it.',
    hatch2: 'Hatch is open. Down the stairs, and stay out of their sight.',
    tip: 'Guards go and check on any noise. Use that.',
    cams: 'Cameras sweep the halls. Have them looped, or stay out of the cones.',
    keys: 'The vault keys. Both boxes, turned within eight seconds, while the time lock is overridden.',
    laser: 'A laser grid. Crouch under the low beams, and time the sweepers.',
    drill: 'The deposit cage. Set up the drill, and keep it cool.',
    cash: 'Four bags. Take them all.',
    alarm: 'Silent alarm! The police are on their way. Fire exit on the north side. My car is on Charter Street!',
    g1: 'The police scanner is lit up. Get to my car!',
    g2: 'Westgate Airfield. A plane is fuelled and waiting. Lose the police on the way.',
    g3: 'Roadblock! Hold on!',
    g4: 'Hacker, get out of there. Westgate is right across the road from the zoo.',
    g5: 'Corsair Key, three kilometres out. The police can\u2019t follow you over the sea.',
    k1: 'Silas is waiting at the hangar. Carry the cash inside.',
    k2: 'I knew that snake would turn! There\u2019s a crate of Silas\u2019s merchandise by the hangar door. Use it!',
    k3: 'Silas is running for the jetty. Don\u2019t let him get away!',
    k4: 'Keep moving! There are more of them coming up from the beach!',
    f1: 'Well. That\u2019s what you get for trusting a card shark.',
    f2: 'Every bag. And Silas\u2019s plane is fuelled. I\u2019d say it\u2019s ours now.',
    f3: 'Lay low a while, darlings. There\u2019s always another job.',
    a1: 'Look who\u2019s back. The papers are still guessing.',
    a2: 'Fancy doing it again? Bring your crew.',
    fail: 'Okay. Regroup, and try that again.',
    fail2: 'Careful. We only get one shot at this.',
    spotted: 'They\u2019ve seen you!',
    reflex: 'Take him down, now, before he raises the alarm!',
    maze: 'They\u2019ve stacked the hall into a maze of crates. Every man in there walks a beat. Watch the corners, and keep your head down.',
    tough: 'And careful. These Moretti boys are built like doors. Face to face, they\u2019ll soak up a whole clip. But sneak up behind one, and a single blow puts him down.',
    siege: 'It was wired! Every Moretti on the island heard that. Grab the guns off the rack and hold them off until the cache is open!',
    siege2: 'More of them coming down the tunnel! Keep them off the locks!',
    chase: 'Moretti skis on your tail! Shoot from the saddle. Take every one of them down before you lead them to the Queen.',
    chase2: 'That\u2019s the last of them. Now, to the Queen.',
    q2b: 'And the rest of you, ship\u2019s security is everywhere tonight. Take an officer from behind, and borrow his uniform.',
    qsec: 'Guns away on that ship. Security shoots on sight. Anyone you put to sleep, you hide, before somebody trips over them.',
    q4b: 'Officers, keep the house detective talking, and give the pit boss something else to look at.',
    bodies: 'Hide that body, before somebody finds it!',    nice: 'Clean. Nobody heard a thing.',
    loud: 'That was loud. Every guard in the building heard it!',
    dark: 'Lights are out. They can barely see a thing in there.',
    hold: 'Hold position. Let the guard walk past.',
    go: 'Go, go, go!',
  });
  add('kit', 'Kit', {
    k1: 'So you\u2019re Vera\u2019s crew. Keep your voices down. Half this island drinks with the Moretti family.',
    k2: 'The vault takes two keys, turned together. Mine is right here. Take it.',
    k3: 'The other never leaves old Prescott. He plays baccarat every night, in the Solace Queen\u2019s high roller salon.',
    k4: 'You\u2019ll want quiet guns and a proper drill. The Morettis keep both in the old smugglers\u2019 tunnel, under the volcano.',
    k5: 'The way in is behind the rocks on the volcano\u2019s flank. Go. And watch yourselves.',
    t1: 'Nobody but me.',
    t2: 'Sorry, friends. The Morettis pay better than Vera ever did.',
    boss: 'You should have stayed on the mainland!',
    down: 'Wait! I can make it right!',
  });
  add('silas', 'Silas', {
    s1: 'Prescott\u2019s key already? Vera said you were good.',
    s2: 'Here\u2019s my offer. You fly the Harbour Trust\u2019s money to Corsair Key. My island, my airstrip. No questions asked.',
    s3: 'Forty percent of the take. The house always gets its cut.',
    s4: 'My launch will run you ashore. Midnight, friends. Don\u2019t be late.',
    k1: 'Right on time. Let\u2019s see it.',
    k2: 'Four bags. The whole city is looking for you, and nobody knows a thing.',
    k3: 'I\u2019m afraid there\u2019s been a change of plan. Mister Moretti made me a better offer.',
    boss: 'You\u2019ll never spend a single cent of it!',
    down: 'The house... always...',
    greet: 'The house always wins, friend.',
  });
  add('prescott', 'Prescott', {
    greet: 'Banco! Ah, a new dealer. Let\u2019s see if your luck is better than the last one\u2019s.',
    angry1: 'Again?! Are you dealing from the bottom of the shoe?',
    angry2: 'Outrageous! Fetch me the pit boss, this instant!',
    angry3: 'Three hands running! This table is cursed!',
    calm: 'Hmph. Deal. And mind your hands.',
    drink: 'Ah, finally, a drink. Put it there.',
    caught: 'Thief! That\u2019s my key! Security!',
    win: 'Banco! Ha ha!',
    vault: 'Eighteen inches of steel, my vault. The safest place on the coast.',
  });
  add('ezra', 'Ezra', {
    e1: 'Vera\u2019s friends. Sit. Look at the lens, and don\u2019t smile. Pilots never smile.',
    e2: 'Hold the stamp steady, the ink is still wet. A crooked seal, and the gate man will know.',
    done: 'There. Captain of the skies. Westgate\u2019s gate guard won\u2019t look twice.',
    fail: 'Smudged. Again, and this time, steady hands.',
  });
  add('mabel', 'Clerk', {
    greet: 'Welcome to Kovac\u2019s! Fitting for a uniform, dear?',
    chat1: 'Oh, the captain\u2019s caps? Hand stitched, every one. Let me show you the braid.',
    chat2: 'My late husband flew the mail run to Serena. Thirty years, never a scratch.',
    idle: 'Now, where did I put the brass buttons?',
    sus: 'Hello? Is somebody back there?',
    spot: 'Thief! Somebody call the police!',
    clear: 'Hm. Must have been the draught.',
  });
  add('gate', 'Gate guard', {
    g1: 'Evening, Captain. Papers, please.',
    g2: 'All in order. Gate\u2019s open for you, Captain. Your plane is fuelled and waiting on the apron.',
    no: 'Crew gate. No uniform, no papers, no entry. Move along.',
  });
  add('tower', 'Westgate Tower', {
    t1: 'Westgate tower. Aircraft on the apron, you are cleared for departure. Wind is light from the south.',
    t2: 'You\u2019re leaving our airspace. Fair winds.',
    t3: 'Unidentified aircraft, you are not cleared for departure! Return to the apron immediately!',
  });
  add('tony', 'Tony Moretti', {
    cove: 'Nobody steals from the Morettis! Light them up!',
    chase: 'After them! Don\u2019t let them reach that ship!',
    k1: 'Nothing personal. The Morettis always collect. Boys!',
    k2: 'Kill them! Nobody walks off this island!',
    down: 'Tell my brother... I tried...',
  });
  add('pit', 'Pit boss', {
    relieve: 'Celeste, you\u2019re relieved. Take five.',
    warn: 'Steady, dealer. Mister Prescott is a valued guest.',
    fire: 'That\u2019s three. You\u2019re off the table. Security!',
    chat: 'Officer? Something the matter? Of course, of course, let\u2019s step over here.',
  });
  add('door', 'Doorman', {
    in: 'Evening. The salon is members and staff only. Ah, you\u2019re the new hire. In you go.',
    no: 'Members and staff only, I\u2019m afraid.',
  });
  add('det', 'House detective', {
    chat: 'Quiet night, officer. Too quiet, if you ask me. Walk with me a minute.',
  });
  add('dealer', 'Dealer', {
    hand: 'Player wins. Banker loses.',
    ko: 'Hey, what are you doing in the crew lounge?',
  });
  add('kestrel', 'Kestrel', {
    auth: 'Kestrel Systems. Unauthorised terminal. Authentication required.',
    in: 'Access granted. Harbour Trust node online. Camera feeds available.',
    lock: 'Time lock override engaged.',
    lights: 'Lighting circuit offline.',
    loop: 'Camera feed looped.',
    dist: 'Signal sent.',
    laser: 'Laser grid section disabled.',
    hatch: 'Roof access unlocked.',
    fail: 'Intrusion countermeasure. Retry.',
  });
  // guard barks, once per voice: bank guards g1..g4, liner crew g1/g3, zoo watchman zw, Moretti men m1/m2
  const BARK = {
    sus1: 'Hm? What was that?', sus2: 'Who\u2019s there?', sus3: 'Did you hear something?',
    check1: 'I\u2019ll go take a look.', check2: 'Better check that out.',
    clear1: 'Nothing. Must be the rats again.', clear2: 'Huh. My eyes are playing tricks on me.',
    spot1: 'Hey! You there!', spot2: 'Intruder! Stop right there!', alarm: 'Sound the alarm! We\u2019ve got company!',
    body: 'Man down! Somebody took him out!', phone: 'Who\u2019s calling at this hour?', dark: 'Lights are out again. Great.',
    radio: 'Control, this is patrol. All quiet.', lost: 'Lost them. Stay sharp.',
  };
  const MOB = {
    sus1: 'Eh? Who\u2019s that?', sus2: 'Somebody down there?', sus3: 'You hear that?',
    check1: 'I\u2019m gonna go look.', check2: 'Hold on, I\u2019ll check it.',
    clear1: 'Nothing. Rats.', clear2: 'Bah. Too much wine.',
    spot1: 'There! Get them!', spot2: 'Hey! Who are you?', alarm: 'We got rats in the tunnel! Everybody up!',
    body: 'They got Sal! Find them!', phone: 'Who keeps calling?', dark: 'Who turned out the lamps?',
    radio: 'Tunnel\u2019s quiet, boss.', lost: 'Lost them. Keep your eyes open.',
    fight1: 'Light them up!', fight2: 'Don\u2019t let them reach the skis!', fight3: 'Flank them! Go!',
  };
  const ZOO = Object.assign({}, BARK, { sus2: 'Who\u2019s out there? The zoo is closed!', clear1: 'Just the peacocks again.', spot1: 'Hey! Stop right there! Zoo\u2019s closed!' });
  const GV = { g1: ['am_adam', 'Guard'], g2: ['am_echo', 'Guard'], g3: ['am_michael', 'Guard'], g4: ['am_onyx', 'Guard'], zw: ['am_puck', 'Night watchman'], m1: ['am_fenrir', 'Moretti'], m2: ['am_eric', 'Moretti'] };
  for (const g in GV) { const set = g[0] === 'm' ? MOB : g === 'zw' ? ZOO : BARK; for (const k in set) L[g + '.' + k] = [GV[g][0], GV[g][1], set[k]]; }
  AF.voLine = (id) => L[AF.voAlias(id)] || null;
  // the clerk only has her own few lines: guard barks map onto them
  const MABEL = { sus1: 'sus', sus2: 'sus', sus3: 'sus', check1: 'sus', check2: 'sus', clear1: 'clear', clear2: 'clear', spot1: 'spot', spot2: 'spot', alarm: 'spot', body: 'spot', phone: 'idle', dark: 'idle', lost: 'clear', radio: 'idle' };
  AF.voAlias = (id) => { if (L[id]) return id; const m = /^mabel\.(\w+)$/.exec(id); return m && MABEL[m[1]] ? 'mabel.' + MABEL[m[1]] : id; };
}
} catch (e) { AF.partError('81-heist-lines.js', e); }
