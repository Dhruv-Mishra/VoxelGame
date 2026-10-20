// ================================================================ 81-heist-lines.js
try {
// ===== 81-heist-lines: every spoken line of the Harbour Trust Job (OWNER: game) =====
// id -> [legacy voice key, speaker, subtitle text, expression metadata]. Fish Audio voice slots stay stable per speaker; the
// text and expression are exported by tools/vo-build.mjs for generation in the Fish Audio web UI.
{
  const V = { vera: 'af_heart', kit: 'am_liam', silas: 'bm_george', prescott: 'bm_lewis', ezra: 'bm_fable', mabel: 'af_sarah', gate: 'am_michael',
    tower: 'am_echo', tony: 'am_onyx', pit: 'bm_daniel', door: 'am_adam', det: 'am_onyx', dealer: 'af_nova', kestrel: 'bf_alice' };
  const SPEAKERS = AF.VO_SPEAKERS = {
    vera: { name: 'Vera', voiceSlot: 'vera', fishVoiceName: 'Laura' }, kit: { name: 'Kit', voiceSlot: 'kit', fishVoiceName: 'Ethan' },
    silas: { name: 'Silas', voiceSlot: 'silas', fishVoiceName: 'Jordan' }, prescott: { name: 'Prescott', voiceSlot: 'prescott', fishVoiceName: 'Adrian' },
    ezra: { name: 'Ezra', voiceSlot: 'ezra', fishVoiceName: 'Adrian' }, mabel: { name: 'Clerk', voiceSlot: 'mabel', fishVoiceName: 'Hannah' },
    gate: { name: 'Gate guard', voiceSlot: 'gate', fishVoiceName: 'Jordan' }, tower: { name: 'Westgate Tower', voiceSlot: 'tower', fishVoiceName: 'Adrian' },
    tony: { name: 'Tony Moretti', voiceSlot: 'tony', fishVoiceName: 'Jordan' }, pit: { name: 'Pit boss', voiceSlot: 'pit', fishVoiceName: 'Adrian' },
    door: { name: 'Doorman', voiceSlot: 'door', fishVoiceName: 'Adrian' }, det: { name: 'House detective', voiceSlot: 'detective', fishVoiceName: 'Adrian' },
    dealer: { name: 'Dealer', voiceSlot: 'dealer', fishVoiceName: 'Sarah' }, kestrel: { name: 'Kestrel', voiceSlot: 'kestrel', fishVoiceName: 'Selene' },
    g1: { name: 'Guard', voiceSlot: 'bank-guard-1', fishVoiceName: 'Adrian' }, g2: { name: 'Guard', voiceSlot: 'bank-guard-2', fishVoiceName: 'Adrian' },
    g3: { name: 'Guard', voiceSlot: 'bank-guard-3', fishVoiceName: 'Adrian' }, g4: { name: 'Guard', voiceSlot: 'bank-guard-4', fishVoiceName: 'Adrian' },
    zw: { name: 'Night watchman', voiceSlot: 'zoo-watchman', fishVoiceName: 'Adrian' },
    m1: { name: 'Moretti', voiceSlot: 'moretti-1', fishVoiceName: 'Jordan' }, m2: { name: 'Moretti', voiceSlot: 'moretti-2', fishVoiceName: 'Jordan' },
  };
  const STYLE = {
    natural: 'Clear, natural conversation; keep the pace grounded and every word easy to understand.',
    persuasion: 'Sound confident and inviting, with a little dry wit; do not oversell the line.',
    whisper: 'Speak in a controlled, close whisper; keep the consonants crisp and the words fully intelligible.',
    cautious: 'Speak softly and carefully, listening between phrases; let the tension show without rushing.',
    surprise: 'Give the first beat a brief, genuine startle, then make the rest of the line clear.',
    betrayal: 'Let the warmth fall away into a calm, personal betrayal; stay controlled rather than theatrical.',
    urgency: 'Sound urgent and decisive; project over the noise, but keep the words clear.',
    anger: 'Let frustration sharpen the delivery; keep it human, not a cartoon villain.',
    relief: 'Ease into a dry, relieved delivery; let the tension drop without becoming sentimental.',
    radio: 'Use a measured radio cadence with clipped, clear phrasing; the game adds the radio filter.',
    announcement: 'Use a concise, professional public-address or control-room delivery.',
    machine: 'Use a neutral, precise system voice with clean pauses and no human emotion.',
    rough: 'Use a low, rough-edged voice with deliberate words; keep the threat believable.',
    grief: 'Speak quietly and with fading strength; leave a little space at the end.',
  };
  // Fish Audio Drama 3's verified bracket tags. These are intentionally separate from the broader direction text.
  const FISH_TAG = { natural: 'calm', persuasion: 'confident', whisper: 'whispering', cautious: 'whispering', surprise: 'surprised',
    betrayal: 'calm', urgency: 'urgent', anger: 'urgent', relief: 'calm', radio: 'calm', announcement: 'calm', machine: 'calm', rough: 'calm', grief: 'calm' };
  const CHARACTER = {
    vera: 'Vera is warm, poised, and quietly in charge.',
    kit: 'Kit is practical and guarded, with nerves just under the surface.',
    silas: 'Silas is polished, charming, and always calculating.',
    prescott: 'Prescott is an entitled high roller who expects the room to obey him.',
    ezra: 'Ezra is a careful forger who notices every small mistake.',
    mabel: 'Mabel is a friendly, matter-of-fact shop clerk.',
    gate: 'The gate guard is courteous and procedural.',
    tower: 'Westgate Tower is calm and professional.',
    tony: 'Tony Moretti is a hard, impatient mob boss.',
    pit: 'The pit boss is controlled and used to managing difficult guests.',
    door: 'The doorman is polite but firm.',
    det: 'The house detective is observant and politely suspicious.',
    dealer: 'The dealer is steady and professional.',
    kestrel: 'Kestrel is a concise automated security system.',
    g1: 'This bank guard is alert and matter-of-fact.',
    g2: 'This bank guard is alert and matter-of-fact.',
    g3: 'This bank guard is alert and matter-of-fact.',
    g4: 'This bank guard is alert and matter-of-fact.',
    zw: 'The zoo watchman is tired but takes the night shift seriously.',
    m1: 'This Moretti man is rough, wary, and quick to anger.',
    m2: 'This Moretti man is rough, wary, and quick to anger.',
  };
  const TONE = Object.create(null);
  const setTone = (tone, ids) => { for (const id of ids.split(/\s+/)) if (id) TONE[id] = tone; };
  setTone('persuasion', 'vera.b1 vera.offer vera.b2 silas.s2 silas.s3 prescott.greet');
  setTone('whisper', 'vera.shop vera.shop1 vera.shop2 vera.tunnel vera.cache vera.gear vera.m3 vera.z1 vera.z2 vera.z3 vera.h1 vera.hatch vera.hatch2 vera.tip vera.cams vera.keys vera.laser vera.drill vera.cash vera.nice vera.hold vera.q1 vera.q2 vera.qsolo vera.q3 vera.q4 vera.q5 vera.qsec vera.q2b vera.q4b vera.lasersoff vera.roles3 vera.roles4 vera.msolo vera.got vera.dark vera.bodies kit.k1 kit.k4 kit.k5');
  setTone('surprise', 'prescott.angry1 prescott.angry2 prescott.angry3 prescott.caught ezra.fail mabel.sus mabel.spot');
  setTone('betrayal', 'kit.t2 silas.k3 vera.k2');
  setTone('urgency', 'vera.cove vera.alarm vera.g1 vera.g2 vera.g3 vera.g4 vera.g5 vera.reflex vera.siege vera.siege2 vera.chase vera.chase2 vera.go vera.loud vera.exit vera.wave vera.k3 vera.k4 vera.loadout vera.bodies vera.spotted kit.boss tony.cove tony.chase tony.k1 tony.k2 vera.farm4 vera.cc1 vera.jets1 vera.jets2 tony.farm');
  setTone('whisper', 'vera.farm2 vera.farm3');
  setTone('persuasion', 'vera.d1 vera.d2 vera.d3 vera.w1 vera.w2 vera.w3 vera.w4 vera.w5 vera.w6');
  setTone('whisper', 'vera.n1 vera.n2 vera.n3 vera.n4 vera.n5 vera.n6 vera.n7 vera.n8 vera.n9 vera.n12 kit.f1 kit.f2 kit.f3');
  setTone('urgency', 'vera.n10');
  setTone('relief', 'vera.cc2 vera.jets3');
  setTone('anger', 'prescott.angry1 prescott.angry2 prescott.angry3 prescott.caught pit.fire');
  setTone('relief', 'vera.f1 vera.f2 vera.f3 vera.a1 vera.a2 vera.fail kit.down silas.down silas.greet');
  setTone('grief', 'tony.down');
  const LINE = {
    'vera.k2': {
      fishTags: ['surprised', 'urgent'],
      generationText: '[surprised] I knew Silas would betray us! [urgent] There is a crate of his merchandise by the hangar door. Use it for cover!',
      direction: 'Vera is personally shocked by Silas’s betrayal. Let disbelief turn to anger on “betray us,” then snap into the urgent cover instruction. Do not read this calmly.',
    },
    'vera.k3': {
      direction: 'Vera is pursuing the traitor. Drive the line forward as an urgent command over the radio, especially “Stop him before he escapes!” Never sound neutral.',
    },
    'vera.k4': {
      direction: 'Moretti gunmen are closing in from the beach. Warn the crew with urgent, breathless force, projecting over the fight while keeping every word clear.',
    },
    'vera.loadout': {
      direction: 'This is an active defense call during a siege. Give the crew a clipped, decisive order; sound urgent, not whispered.',
    },
    'vera.bodies': {
      fishTags: ['whispering', 'urgent'],
      generationText: '[whispering] [urgent] Hide the body before someone finds it!',
      direction: 'Keep Vera’s voice low to protect the crew’s cover, but let the urgency cut through. Whisper this quickly; do not shout.',
    },
  };
  const RADIO = new Set(('vera.plane vera.island vera.kit vera.ski vera.ski2 vera.got vera.m1 vera.m2 vera.msolo vera.roof vera.alarm vera.g1 vera.g2 vera.g3 vera.g4 vera.g5 vera.k1 vera.k2 vera.k3 vera.k4 vera.f1 vera.f2 vera.f3 vera.a1 vera.a2 vera.fail vera.fail2 vera.spotted vera.reflex vera.maze vera.tough vera.siege vera.siege2 vera.chase vera.chase2 vera.q2b vera.qsec vera.q4b vera.bodies vera.nice vera.loud vera.dark vera.hold vera.go vera.wheels vera.drop vera.exit vera.wave vera.loadout vera.lasersoff vera.roles3 vera.roles4 kestrel.exit vera.farm1 vera.farm2 vera.farm3 vera.farm4 vera.cc1 vera.cc2 vera.paint vera.paint2 vera.jets1 vera.jets2 vera.jets3 tony.farm vera.n1 vera.n2 vera.n3 vera.n4 vera.n5 vera.n6 vera.n7 vera.n8 vera.n9 vera.n10 vera.n12').split(/\s+/));
  const toneOf = (id, who, key) => TONE[id] || (who === 'kestrel' ? 'machine' : who === 'tower' ? 'announcement' :
    /^sus/.test(key) ? (who === 'zw' ? 'cautious' : 'surprise') : /^check/.test(key) ? 'cautious' :
    /^clear/.test(key) ? 'relief' : /^spot/.test(key) || key === 'alarm' || key === 'body' || /^fight/.test(key) ? 'urgency' :
    key === 'radio' ? 'natural' : key === 'phone' || key === 'dark' ? 'anger' : key === 'lost' ? 'cautious' :
    who === 'tony' || who === 'm1' || who === 'm2' ? 'rough' : 'natural');
  const metaFor = (id, who, key, text) => {
    const tone = toneOf(id, who, key), speaker = SPEAKERS[who], line = LINE[id], fishTags = line && line.fishTags || [FISH_TAG[tone]];
    return { speakerId: who, voiceSlot: speaker.voiceSlot, fishVoiceName: speaker.fishVoiceName, channel: RADIO.has(id) || key === 'radio' ? 'radio' : 'plain',
      tone, intentTags: [tone, 'clear'], fishTags, generationText: line && line.generationText || fishTags.map((tag) => '[' + tag + ']').join(' ') + ' ' + text,
      expressionText: CHARACTER[who] + ' ' + (line && line.direction || STYLE[tone]) };
  };
  const L = AF.VO = {};
  const add = (who, name, lines) => { for (const k in lines) { const id = who + '.' + k; L[id] = [V[who], name, lines[k], metaFor(id, who, k, lines[k])]; } };
  add('vera', 'Vera', {
    b1: 'Come with me, all of you. You look ready for a better payday.',
    b2: 'The Harbour Trust. Eighteen inches of steel around the biggest vault on the coast. By sunrise, we could be inside.',
    b3: 'Kit Morrow is hiding on Serena Isle, three kilometres offshore. We will need a plane to reach him.',
    b4: 'Westgate will not let us through the crew gate without pilot uniforms and matching papers.',
    b5: 'Kovac makes the uniforms at his tailor shop. Ezra Quill forges licences at Harbour Stationers. Both places are closed. Start with Kovac.',
    offer: 'I have the biggest job in town. I need a crew of two to four. Are you in?',
    shop: 'Kovac\u2019s is closed, but the watchmen are still inside. There is a lock for each of you on the grille. Pick yours, then slip past the patrols.',
    shop1: 'You are inside. Take one uniform each from the rail behind the counter, and stay out of the watchman\u2019s torchlight.',
    shop2: 'Those uniforms look good. Now see Ezra at Harbour Stationers. He can make one licence at a time, so each of you needs a photo.',
    ezra: 'Got your licences? Head to Westgate Airfield and use the crew gate on the apron side.',
    plane: 'Serena Isle is three kilometres south. Stay low over the water.',
    island: 'That is Serena Isle. Land on the airstrip.',
    kit: 'Kit is waiting on the terrace at Hotel Serena. Go meet him.',
    tunnel: 'That is the smugglers\u2019 tunnel. Crouch, stay quiet, and take the guards from behind.',
    cache: 'There is the weapons cache. Three padlocks, one for each of you. The rest, watch the entrance.',
    gear: 'Silenced pistols and a diamond drill. Take what you need and keep moving.',
    cove: 'Moretti men in the cove! Fight your way to the jet skis!',
    ski: 'The Solace Queen is anchored between here and the city. Get aboard.',
    ski2: 'Use the pontoon on the ship\u2019s port side.',
    q1: 'Evening, darling. Prescott is upstairs in the High Rollers\u2019 Salon. It is staff only.',
    q2: 'Then make yourselves staff. There is a waiter in the pantry and a dealer in the crew lounge. Take their uniforms quietly.',
    qsolo: 'Alone? Start as the waiter. When Prescott loses a hand, he will make a scene. That is your opening.',
    q3: 'You have the uniform. Take the crew stairs to the salon.',
    q4: 'Dealer, take Prescott\u2019s table. Waiter, get a tray from the salon bar.',
    q5: 'Deal Prescott a bad hand just as the drink arrives. He will be too busy complaining to notice you.',
    got: 'We have the key. Find Silas in the office behind the purser\u2019s cage.',
    m1: 'It is midnight. One of you will guide us from inside the bank. The rest, get to the roof.',
    m2: 'Kestrel Systems runs the Harbour Trust cameras. Their old fibre line passes through a war bunker under the zoo.',
    m3: 'Enter through the lion house. Borrow a keeper\u2019s uniform, and do not wake the lions.',
    msolo: 'Going alone? Hack Kestrel\u2019s terminal first. The tablet will give you the bank camera feeds.',
    roof: 'Bank crew, get to the Harbour Trust roof. Use a parachute or the service ladder on Park Row.',
    z1: 'The keepers\u2019 lockers are in the service yard. Take a uniform.',
    z2: 'That is the lion house. Move slowly and keep quiet. If the lions wake, get out.',
    z3: 'There is the bunker hatch. Climb down.',
    h1: 'You are inside the bank. Can you see the vault? Talk our inside man through it.',
    hatch: 'The roof hatch is controlled by Kestrel\u2019s lock. The hacker needs to open it.',
    hatch2: 'The hatch is open. Go down the stairs and stay out of the guards\u2019 sight.',
    tip: 'The guards investigate noises. Use that to draw them away.',
    cams: 'The cameras sweep the halls. Loop them, or stay out of view.',
    keys: 'Those are the vault keys. Turn both boxes within eight seconds while the time lock is overridden.',
    laser: 'The laser grid is ahead. Crouch under the low beams and move between the sweepers.',
    drill: 'That is the deposit cage. Set up the drill, then keep it cool.',
    cash: 'Four bags. Take every one.',
    alarm: 'Silent alarm! Police are coming. Take the north fire exit; my car is on Charter Street!',
    g1: 'Police scanners are lighting up. Get to my car!',
    g2: 'A plane is waiting at Westgate Airfield. Lose the police on the way there.',
    g3: 'Roadblock ahead! Hold on!',
    g4: 'Hacker, get out now! Westgate is just across the road from the zoo.',
    g5: 'Corsair Key is three kilometres offshore. The police will not follow us across the water.',
    k1: 'Silas is at the hangar. Bring the cash inside.',
    k2: 'I knew Silas would betray us! There is a crate of his merchandise by the hangar door. Use it for cover!',
    k3: 'Silas is heading for the jetty. Stop him before he escapes!',
    k4: 'Keep moving! More men are coming up from the beach!',
    f1: 'That is what happens when you trust a card shark.',
    f2: 'We have every bag, and Silas\u2019s plane is ready. I think it is ours now.',
    f3: 'Lay low for a while, darlings. This town always has another job.',
    a1: 'You are back. The papers still do not know the whole story.',
    a2: 'Ready to do it again? Bring the crew.',
    fail: 'All right. Take a breath, regroup, and try again.',
    fail2: 'Careful. We may not get another chance.',
    spotted: 'They have spotted you!',
    reflex: 'Take him down before he can raise the alarm!',
    maze: 'They have turned the hall into a maze of crates. The guards patrol every aisle. Watch the corners and stay low.',
    tough: 'These Moretti men can take a lot of punishment from the front. Get behind one and a single quiet hit will drop him.',
    siege: 'The cache was wired! Every Moretti on the island knows we are here. Take the guns and hold them off while we open it!',
    siege2: 'More men are coming through the tunnel! Keep them away from the locks!',
    chase: 'Moretti jet skis are on our tail! Shoot from your seat and take them out before we reach the Queen!',
    chase2: 'That is the last jet ski. Head for the Queen.',
    q2b: 'Everyone else, security is all over this ship. Take an officer from behind and borrow his uniform.',
    qsec: 'Keep your weapons holstered. The ship\u2019s guards will shoot on sight. Hide anyone you put to sleep before they are found.',
    q4b: 'Officers, keep the house detective busy. Give the pit boss something else to focus on.',
    bodies: 'Hide the body before someone finds it!',
    nice: 'Good work. Nobody heard a thing.',
    loud: 'That was too loud. Every guard heard it!',
    dark: 'The lights are out. They will not see much in there now.',
    hold: 'Hold here. Let the guard pass.',
    go: 'Move! Now!',
    wheels: 'We need a fast car with four seats. Take one, then park it on Charter Street, by the bank\u2019s fire door.',
    drop: 'That\u2019ll do. Leave it there. We go in at midnight.',
    exit: 'The fire door is still locked. Hacker, open it from the cameras. Nobody leaves without it.',
    wave: 'More guards are coming in. Hold the vault.',
    loadout: 'There\u2019s a security locker in the vault. Take the guns and the vests, cover whoever is cracking.',
    lasersoff: 'The grid\u2019s dead for good. Walk through.',
    roles3: 'Three of you on the boat: one of you keeps the detective busy before anyone serves the high rollers.',
    roles4: 'Four of you: one on the detective, one on the pit boss. Only then do we serve.',
    farm1: 'Change of plan. Moretti keeps an armoured car at Southfield Farm, west of the city. Grab any car and drive out there.',
    farm2: 'Six of his men are guarding the yard. Stay low, take them from behind, and do not let anyone raise the alarm.',
    farm3: 'There is a crate of launchers beside the car. Load it into the boot. We will need them tonight.',
    farm4: 'You have the launchers. Now take the car and get off that farm!',
    cc1: 'Moretti\u2019s men are coming after you! Passengers, lean out and shoot. Driver, keep moving!',
    cc2: 'That was the last of them. Nice driving.',
    paint: 'Every Moretti on the coast knows that paint job. Take it to Body Works for a respray.',
    paint2: 'Fresh paint. Now park it on Charter Street, by the bank\u2019s fire door. We go in at midnight.',
    jets1: 'Jets on your tail! Get the launchers out of the boot. The seeker locks on by itself!',
    jets2: 'One down! Keep firing!',
    jets3: 'The sky is clear. Get to Westgate and get that plane up!',
    // the pitch: the drive out to the depot and the map-room briefing
    d1: 'Get in, all of you. We don\u2019t talk business anywhere the Morettis drink. It\u2019s a long drive.',
    d2: 'Port Solace thinks the Harbour Trust is just a bank. It\u2019s where every crook on the coast keeps his money. Including the Morettis.',
    d3: 'My father ran rum through this old depot. Nobody comes out this far. Come inside.',
    w1: 'Kit Morrow. Eleven years a clerk at the Harbour Trust. He knows the vault, the guards and their habits, and he holds one of its two keys.',
    w2: 'The second key hangs from Mr Prescott\u2019s watch chain. The bank\u2019s manager. He plays baccarat every night aboard the Solace Queen.',
    w3: 'Silas Crane runs the Queen\u2019s casino and owns an island you won\u2019t find on any chart. He\u2019ll take the money off our hands, for a cut.',
    w4: 'And Tony Moretti. His family guards half this coast, and their money sleeps in that vault. Cross them and they come for you. So don\u2019t get seen.',
    w5: 'Kestrel Systems watches the bank\u2019s cameras from a junction under the zoo. That\u2019s a job for midnight.',
    w6: 'Uniforms, papers, a plane, Kit, the second key, the bank, then the getaway. One step at a time, together. Let\u2019s go to work.',
    // midnight: the roof watch, the zoo, the jump onto the bank
    n1: 'Midnight. The roof watch changes at one. Thin it out from City Hall\u2019s roof. I left a rifle at the foot of the service ladder.',
    n2: 'Four guards on the bank roof. If one of them finds a body, they\u2019ll call it in. Pick your moments.',
    n3: 'The roof is quiet. Now the cameras. Kestrel\u2019s junction is under the zoo, and tonight the zoo is crawling with their guards.',
    n4: 'Take a plane from Westgate and bail out over the Great Banyan on the Treetop Trail. Land on the treehouse deck.',
    n5: 'Up to the lookout. Clear the paths from up there before you go walking.',
    n6: 'The keepers\u2019 gate leads to the lion house. Watch that camera.',
    n7: 'Kestrel is ours. You all have the tablet now. Up the drain stair; Westgate is just across the road.',
    n8: 'One more jump. There\u2019s a steel deck on the bank tower, over Charter Street. Land on it, and stay low.',
    n9: 'The rifle couldn\u2019t see that deck. There are still guards up there. Clear them, then take the stairs down to the roof door.',
    n10: 'They\u2019ve seen you! Every cop in the city is on the way. Lose them, or pull out and try again.',
    n12: 'That\u2019s the roof door. Open it with the tablet, or punch the code into the keypad.',
  });
  add('kit', 'Kit', {
    k1: 'You are Vera\u2019s crew. Keep your voices down; half the island drinks with the Morettis.',
    k2: 'The vault needs two keys turned at once. I have one right here. Take it.',
    k3: 'Prescott keeps the other key with him. He plays baccarat every night in the Solace Queen\u2019s High Rollers\u2019 Salon.',
    k4: 'You will need quiet guns and a drill. The Morettis keep them in the old smugglers\u2019 tunnel under the volcano.',
    k5: 'The entrance is behind the rocks on the volcano\u2019s slope. Go carefully.',
    t1: 'No one else is here. You are safe for now.',
    t2: 'I am sorry, friends. The Morettis offered me more than Vera did.',
    boss: 'You should have stayed on the mainland!',
    down: 'Wait! I can still make this right!',
    f1: 'Not out here. Follow me, and don\u2019t run.',
    f2: 'The old owner built this place for rum-runners. Watch the bookcase.',
    f3: 'The passage comes out right beside the Morettis\u2019 tunnel. Go. I\u2019ll keep the bar talking.',
  });
  add('silas', 'Silas', {
    s1: 'You have Prescott\u2019s key already? Vera said you were good.',
    s2: 'Here is my offer. Fly the Harbour Trust money to Corsair Key. It is my island, and nobody asks questions there.',
    s3: 'You get forty percent of the take. The house always gets its cut.',
    s4: 'My launch will take you ashore. Meet me at the jetty at midnight.',
    k1: 'Right on time. Let me see the bags.',
    k2: 'Four bags. The whole city is looking for you, and nobody has found you yet.',
    k3: 'The plan has changed. Mr Moretti made me a better offer.',
    boss: 'You will never spend a cent of that money!',
    down: 'The house... always...',
    greet: 'The house always wins, my friend.',
  });
  add('prescott', 'Prescott', {
    greet: 'Banco! A new dealer. Let us see if you handle the cards better than the last one.',
    angry1: 'Again? Are you dealing from the bottom of the shoe?',
    angry2: 'This is outrageous! Get me the pit boss, now!',
    angry3: 'Three bad hands in a row. This table is cursed!',
    calm: 'Humph. Deal the next hand, and keep your hands where I can see them.',
    drink: 'Finally, my drink. Set it there.',
    caught: 'Thief! Give me back my key! Security!',
    win: 'Banco! That is a win!',
    vault: 'Eighteen inches of steel. My vault is the safest on the coast.',
  });
  add('ezra', 'Ezra', {
    e1: 'Vera sent you, didn\u2019t she? Sit down and look at the camera. Pilots do not smile.',
    e2: 'Hold still while I stamp it. The ink is wet; one crooked seal will give you away.',
    done: 'There. Your pilot licence is ready. Westgate\u2019s gate guard will not look twice.',
    fail: 'The stamp smudged. Let me try again. Keep your hands steady.',
  });
  add('mabel', 'Clerk', {
    greet: 'Welcome to Kovac\u2019s. Looking for a uniform, dear?',
    chat1: 'Those captain\u2019s caps are hand-stitched. Look at the gold braid.',
    chat2: 'My late husband flew the mail plane to Serena for thirty years. Never had an accident.',
    idle: 'Where did I put those brass buttons?',
    sus: 'Hello? Is someone in the back?',
    spot: 'Thief! Someone call the police!',
    clear: 'Must have been a draft.',
  });
  add('gate', 'Gate guard', {
    g1: 'Good evening, Captain. May I see your papers?',
    g2: 'Everything checks out. You are cleared through the crew gate. Your plane is waiting on the apron.',
    no: 'This is the crew gate. No uniform or papers, no entry. Please move along.',
  });
  add('tower', 'Westgate Tower', {
    t1: 'Westgate Tower to the aircraft on the apron: you are cleared for takeoff. Light southerly wind.',
    t2: 'You are leaving Westgate airspace. Fair winds.',
    t3: 'Unidentified aircraft, you are not cleared for takeoff. Return to the apron now!',
  });
  add('tony', 'Tony Moretti', {
    cove: 'Nobody steals from the Morettis! Open fire!',
    chase: 'After them! Do not let them reach the ship!',
    farm: 'Somebody is stealing my car! Get after them, all of you!',
    k1: 'Nothing personal. The Morettis always collect. Men, move!',
    k2: 'Take them down! Nobody leaves this island!',
    down: 'Tell my brother... I tried...',
  });
  add('pit', 'Pit boss', {
    relieve: 'Celeste, you are off the table. Take five.',
    warn: 'Easy, dealer. Mr Prescott is one of our best guests.',
    fire: 'That is three bad hands. You are off the table. Security!',
    chat: 'Officer, is something wrong? Come with me. We can talk over here.',
  });
  add('door', 'Doorman', {
    in: 'Good evening. This salon is for members and staff. Ah, you are the new hire. Go on in.',
    no: 'I am sorry. This salon is for members and staff only.',
  });
  add('det', 'House detective', {
    chat: 'Quiet night, officer. Almost too quiet. Walk with me for a moment.',
  });
  add('dealer', 'Dealer', {
    hand: 'Player wins. Banker loses.',
    ko: 'Hey! You cannot be in the crew lounge.',
  });
  add('kestrel', 'Kestrel', {
    auth: 'Kestrel Systems. This terminal is restricted. Authentication required.',
    in: 'Access granted. Harbour Trust network online. Camera feeds are ready.',
    lock: 'Time-lock override is active.',
    lights: 'Lighting circuit offline.',
    loop: 'Camera feed loop is active.',
    dist: 'Signal sent.',
    laser: 'Laser grid section disabled.',
    exit: 'Fire exit released.',
    hatch: 'Roof access unlocked.',
    fail: 'Intrusion detected. Access denied. Try again.',
  });
  // guard barks, once per voice: bank guards g1..g4, liner crew g1/g3, zoo watchman zw, Moretti men m1/m2
  const BARK = {
    sus1: 'Was that a noise?', sus2: 'Hello? Who is there?', sus3: 'Did you hear that?',
    check1: 'I will check the corridor.', check2: 'I will see what that was.',
    clear1: 'Nothing here. Probably a rat.', clear2: 'False alarm. I thought I saw someone.',
    spot1: 'Hey! Stop right there!', spot2: 'Intruder! Drop your weapon!', alarm: 'Sound the alarm! We have an intruder!',
    body: 'Someone is down! Call it in!', phone: 'Who is calling me this late?', dark: 'The lights are out again. Stay alert.',
    radio: 'Control, patrol here. The corridor is clear.', lost: 'I lost sight of them. Keep searching.',
  };
  const MOB = {
    sus1: 'What was that?', sus2: 'Is someone down there?', sus3: 'You heard that too, right?',
    check1: 'I will take a look.', check2: 'Stay here. I will check the tunnel.',
    clear1: 'Nothing. It was probably a rat.', clear2: 'False alarm. Let us get back to work.',
    spot1: 'There they are! Stop them!', spot2: 'Hey! Identify yourself!', alarm: 'Intruders in the tunnel! Everyone, get up!',
    body: 'They got Sal! Find whoever did this!', phone: 'Who keeps calling me this late?', dark: 'Who turned off the lights? Stay close.',
    radio: 'Tunnel is clear, boss. No sign of them.', lost: 'I lost sight of them. Search every exit.',
    fight1: 'Open fire!', fight2: 'Do not let them reach the jet skis!', fight3: 'Move around behind them!',
  };
  const ZOO = Object.assign({}, BARK, {
    sus2: 'Who is out there? The zoo is closed!',
    clear1: 'It was only the peacocks. They are always making noise.',
    spot1: 'Hey! Stop right there! The zoo is closed!',
  });
  const GV = { g1: ['am_adam', 'Guard'], g2: ['am_echo', 'Guard'], g3: ['am_michael', 'Guard'], g4: ['am_onyx', 'Guard'], zw: ['am_puck', 'Night watchman'], m1: ['am_fenrir', 'Moretti'], m2: ['am_eric', 'Moretti'] };
  for (const g in GV) { const set = g[0] === 'm' ? MOB : g === 'zw' ? ZOO : BARK; for (const k in set) {
    const id = g + '.' + k;
    L[id] = [GV[g][0], GV[g][1], set[k], metaFor(id, g, k, set[k])];
  } }
  AF.voLine = (id) => L[AF.voAlias(id)] || null;
  // the clerk only has her own few lines: guard barks map onto them
  const MABEL = { sus1: 'sus', sus2: 'sus', sus3: 'sus', check1: 'sus', check2: 'sus', clear1: 'clear', clear2: 'clear', spot1: 'spot', spot2: 'spot', alarm: 'spot', body: 'spot', phone: 'idle', dark: 'idle', lost: 'clear', radio: 'idle' };
  AF.voAlias = (id) => { if (L[id]) return id; const m = /^mabel\.(\w+)$/.exec(id); return m && MABEL[m[1]] ? 'mabel.' + MABEL[m[1]] : id; };
}
} catch (e) { AF.partError('81-heist-lines.js', e); }
