// ================================================================ 23-shops.js
try {
// ===== 23-shops: the Starlite Diner block (Automat, drugstore soda fountain, barber, tobacconist + newsstand), the Grand Ave shop row
// (bakery, records, ROSELAND dance hall upstairs, bookshop, camera shop, five & dime, shoeshine) and the Harbour Blvd waterfront row
// (chandlery, Neptune Oyster Bar, pawn, hardware, laundromat, pool hall).  (OWNER: theatre-shops)  Uses the kit AF.TS from 22-theatre.js.
// ================================================================= AF.shopKit(box, trade, opts) — per-trade shop interiors for EVERY owner
// box = [x0,y0,z0,x1,y1,z1] = the clear room (y0 = floor you stand on, y1 = ceiling underside). opts.front = 'x0'|'x1'|'z0'|'z1' = the
// street/shopfront side (default 'z0'). See notes/shops.md for the full option list. Returns ctx {f, W, D, H, vEnd, spots}.
{
  const M = (w, h, d) => new AF.Model(w, h, d);
  const SK = AF.SK = { geos: new Map(), dyn: [], n: 0, rooms: [] };
  const G = (key, fn, vs = 1 / 8, an = [0.5, 0, 0.5]) => { let g = SK.geos.get(key); if (!g) { g = AF.meshModel(fn(), { vs, anchor: an }); SK.geos.set(key, g); } return g; };
  let K = null;
  const cols = () => {
    if (K) return K;
    const c = AF.col, MT = AF.MAT || {}, L = (hex, e, k) => c(hex, { emit: e, emitK: k, mode: 'always', jitter: 0, edge: 0 });
    K = SK.K = {
      brass: MT.brass ?? c(0xd4a84a), gold: MT.gold ?? c(0xf2c65a), chrome: MT.chrome ?? c(0xe8ecf0), steel: MT.steel ?? c(0x9aa0a8), iron: MT.iron ?? c(0x2e3034),
      marble: MT.marble ?? c(0xeee8dc), marbleG: MT.marbleGreen ?? c(0x3f7a68), marbleK: MT.marbleBlack ?? c(0x2a2a30),
      wood: c(0x8a5a34, { jitter: 0.4 }), woodD: c(0x4e321e, { jitter: 0.35 }), woodL: c(0xb98a58, { jitter: 0.35 }), mahog: c(0x6a2e22, { jitter: 0.25, rough: 0.35 }), oak: c(0xa87a48, { jitter: 0.3, rough: 0.5 }),
      white: c(0xf1ede2, { jitter: 0.15 }), cream: c(0xefe3c4, { jitter: 0.2 }), black: c(0x1d1b1a, { jitter: 0.15 }), paper: c(0xf4efe0, { jitter: 0.08 }), red: c(0xb3202e, { jitter: 0.2 }), redD: c(0x7e1624, { jitter: 0.2 }),
      navy: c(0x1f3050, { jitter: 0.2 }), jade: c(0x2e7d6a, { jitter: 0.2 }), enamel: c(0x2f5a44, { rough: 0.3, jitter: 0.05 }), ochre: c(0xc8862a, { rough: 0.35 }),
      glass: AF.col('glass'), milk: L(0xfff4e0, 0xffd9a0, 1.35), lamp: L(0xfff1c9, 0xffc878, 1.6), amber: L(0xffc890, 0xff9a40, 1.5), cove: L(0xffe2b0, 0xffb860, 1.1), bulb: L(0xfff6dc, 0xffd9a0, 2.2),
      dial: L(0xffd890, 0xffa040, 1.2), tin: c(0xe2dccb, { pat: 'panel', rough: 0.45, metal: 0.35, jitter: 0.05 }), tinG: c(0xc6d4c8, { pat: 'panel', rough: 0.5, metal: 0.3, jitter: 0.05 }),
      beam: c(0x5a3a22, { pat: 'plank', jitter: 0.3 }), boards: c(0xc8a878, { pat: 'plank', jitter: 0.2 }), sky: c(0x2a3a5a, { jitter: 0.05 }), deco: c(0xe8d8b0, { jitter: 0.05 }),
      parquet: c(0x9a6a3e, { pat: 'parquet', rough: 0.4 }), plank: c(0x8a5a34, { pat: 'plank', rough: 0.6 }), terrazzo: c(0xd9cfbb, { pat: 'marble', rough: 0.3 }), terrazzoR: c(0xc9a08a, { pat: 'marble', rough: 0.3 }),
      hex: c(0xeeeae0, { pat: 'tile', rough: 0.35 }), carpet: c(0x7a2430, { pat: 'carpet' }), carpetG: c(0x2f5a44, { pat: 'carpet' }), carpetB: c(0x2a3a6a, { pat: 'carpet' }),
      linoA: c(0xe8e0cc, { rough: 0.4, pat: 'none' }), linoB: c(0x2a4a6a, { rough: 0.4, pat: 'none' }), linoC: c(0x9a2a2a, { rough: 0.4, pat: 'none' }), linoD: c(0x3a6a4a, { rough: 0.4, pat: 'none' }), coir: c(0x8a6a3a, { jitter: 0.6 }),
      curtain: c(0x7a1a26, { jitter: 0.3, solid: false }), curtainG: c(0x2e5a3a, { jitter: 0.3, solid: false }),
      br: [0xd23a3a, 0x3a6ed2, 0xe8c040, 0x3aa05a, 0xe07a30, 0x8a4ab0, 0xf0f0e8, 0x2a2a30, 0xe070a0, 0x40b0b0, 0x9a6a3a, 0xc8d860].map((h) => c(h, { jitter: 0.2 })),
      fl: [0xe83a5a, 0xf0c030, 0xf07ad0, 0xffffff, 0xe86a2a, 0x9a5ae0].map((h) => c(h, { jitter: 0.3, solid: false })), leaf: c(0x4f8a3a, { jitter: 0.5, solid: false }),
      crust: [0xc8883a, 0xa8662a, 0xe0b070].map((h) => c(h, { jitter: 0.3 })), icing: [0xfaf0f0, 0xf0b0c8, 0x6a3a22, 0xf8e0a0].map((h) => c(h, { jitter: 0.1 })),
      tan: c(0xc8a870, { jitter: 0.3 }), leather: c(0x7a4a2a, { jitter: 0.3 }), shoeK: c(0x221c18, { rough: 0.3 }), felt: c(0x5a5a62, { jitter: 0.2 }), cat: c(0xe08a3a, { jitter: 0.3 }), catW: c(0xf0e8d8),
      skin: c(0xd8a888), wallA: [0xe8dcc0, 0xd8e4d0, 0xf0d8c8, 0xd0d8e4, 0xf2e6c0, 0xe0d0b0].map((h) => c(h, { jitter: 0.12 })),
    };
    return K;
  };
  // ---- trades: item drawer, floor, ceiling, 2 fixture designs, island type
  const T = {
    bakery: { item: 'bread', floor: 'lino', ceil: 'tin', fix: [0, 4], island: 'cakes', post: 0 },
    hats: { item: 'hats', floor: 'carpet', ceil: 'cove', fix: [2, 3], island: 'hatstands', post: 1 },
    radio: { item: 'radio', floor: 'parquet', ceil: 'cove', fix: [2, 5], island: 'console', post: 2 },
    shoes: { item: 'shoes', floor: 'carpetB', ceil: 'tin', fix: [1, 3], island: 'fitting', post: 3 },
    books: { item: 'books', floor: 'plank', ceil: 'beams', fix: [1, 0], island: 'table', post: 4 },
    flowers: { item: 'flowers', floor: 'hex', ceil: 'beams', fix: [0, 4], island: 'stand', post: 5 },
    hardware: { item: 'hardware', floor: 'plank', ceil: 'beams', fix: [5, 1], island: 'barrels', post: 6 },
    candy: { item: 'candy', floor: 'lino', ceil: 'tin', fix: [0, 2], island: 'case', post: 7 },
    fabric: { item: 'fabric', floor: 'parquet', ceil: 'tin', fix: [1, 4], island: 'bolts', post: 1 },
    clocks: { item: 'clocks', floor: 'parquet', ceil: 'coffer', fix: [3, 2], island: 'case', post: 2 },
    tobacco: { item: 'tobacco', floor: 'plank', ceil: 'coffer', fix: [3, 5], island: 'case', post: 3 },
    toys: { item: 'toys', floor: 'lino', ceil: 'tin', fix: [0, 5], island: 'toytable', post: 7 },
    grocery: { item: 'grocery', floor: 'plank', ceil: 'tin', fix: [5, 0], island: 'bins', post: 0 },
    drug: { item: 'bottles', floor: 'hex', ceil: 'tin', fix: [0, 2], island: 'case', post: 5 },
    jewel: { item: 'jewel', floor: 'carpet', ceil: 'cove', fix: [2, 3], island: 'case', post: 4 },
    records: { item: 'records', floor: 'parquet', ceil: 'cove', fix: [5, 2], island: 'recbins', post: 6 },
    camera: { item: 'camera', floor: 'terrazzo', ceil: 'cove', fix: [2, 1], island: 'case', post: 2 },
    stationery: { item: 'paper', floor: 'plank', ceil: 'tin', fix: [1, 0], island: 'table', post: 4 },
    chandlery: { item: 'chandlery', floor: 'plank', ceil: 'beams', fix: [5, 4], island: 'barrels', post: 5 },
    pawn: { item: 'pawn', floor: 'plank', ceil: 'tin', fix: [5, 1], island: 'case', post: 6 },
    tailor: { item: 'shirts', floor: 'carpetG', ceil: 'coffer', fix: [3, 4], island: 'bolts', post: 1 },
    deli: { item: 'deli', floor: 'hex', ceil: 'tin', fix: [0, 5], island: 'case', post: 0 },
    luggage: { item: 'luggage', floor: 'terrazzoR', ceil: 'coffer', fix: [3, 1], island: 'table', post: 3 },
    general: { item: 'grocery', floor: 'plank', ceil: 'beams', fix: [5, 0], island: 'bins', post: 7 },
    cafe: { item: 'deli', floor: 'hex', ceil: 'tin', fix: [4, 0], island: 'none', post: 0 },
  };
  const ALIAS = { bread: 'bakery', bottles: 'drug', drugstore: 'drug', florist: 'flowers', paper: 'stationery', hat: 'hats', book: 'books', shoe: 'shoes', sweets: 'candy', tobacconist: 'tobacco', cigar: 'tobacco', toy: 'toys', clock: 'clocks', watch: 'clocks', jeweller: 'jewel', music: 'records', mixed: 'general', cans: 'grocery', tools: 'hardware', dime: 'toys', fivedime: 'toys', haberdasher: 'tailor', grocer: 'grocery' };
  SK.trades = Object.keys(T);
  const tradeOf = (t) => T[t] ? t : T[ALIAS[t]] ? ALIAS[t] : 'general';

  // ---- one item on a shelf, drawn at (x, y) with depth z 0..3 (1/8 m voxels); returns the width used
  const item = (m, it, x, y, r, top) => {
    const k = K, pick = k.br[Math.floor(r() * 12)], p2 = k.br[Math.floor(r() * 12)];
    switch (it) {
      case 'bread': if (top) { m.box(x, y, 1, x + 3, y + 2, 4, k.crust[2]); m.box(x, y + 2, 1, x + 3, y + 3, 4, k.icing[Math.floor(r() * 4)]); m.set(x + 1, y + 3, 2, k.red); return 4; } m.box(x, y, 1, x + 3, y + 2, 4, k.crust[Math.floor(r() * 3)]); if (r() < 0.5) m.box(x, y + 2, 2, x + 3, y + 3, 3, k.crust[2]); return 4;
      case 'hats': { const h = r() < 0.5 ? k.felt : pick; m.box(x, y, 0, x + 3, y + 1, 3, h); m.box(x + 1, y + 1, 1, x + 2, y + 3, 2, h); m.set(x + 1, y + 1, 2, k.black); return 4; }
      case 'radio': { const w = r() < 0.5 ? k.wood : k.woodD; m.box(x, y, 0, x + 3, y + 3, 3, w); m.box(x + 1, y + 3, 0, x + 2, y + 4, 3, w); m.set(x + 1, y + 1, 3, k.dial); m.set(x, y + 2, 3, k.woodL); m.set(x + 2, y + 2, 3, k.woodL); return 4; }
      case 'shoes': if (r() < 0.35) { m.box(x, y, 0, x + 3, y + 1, 3, pick); m.box(x, y + 1, 0, x + 3, y + 2, 3, p2); return 4; } { const s = r() < 0.5 ? k.shoeK : k.leather; m.box(x, y, 0, x + 1, y + 1, 3, s); m.box(x + 2, y, 0, x + 3, y + 1, 3, s); m.set(x, y + 1, 0, s); m.set(x + 2, y + 1, 0, s); return 4; }
      case 'books': { const h = 2 + Math.floor(r() * 3); m.box(x, y, 1, x + 1, y + h, 4, pick); if (r() < 0.2) m.set(x, y + h - 1, 3, k.gold); return 1; }
      case 'flowers': m.box(x, y, 1, x + 2, y + 2, 3, k.steel); m.box(x, y + 2, 1, x + 2, y + 3, 3, k.leaf); for (let q = 0; q < 3; q++) m.set(x + (q & 1), y + 3 + (q >> 1), 1 + q % 2, k.fl[Math.floor(r() * 6)]); return 3;
      case 'candy': m.box(x, y, 1, x + 2, y + 3, 3, k.glass); m.box(x, y, 1, x + 2, y + 2, 3, pick); m.box(x, y + 3, 1, x + 2, y + 4, 3, k.brass); return 3;
      case 'fabric': m.box(x, y, 0, x + 2, y + 4, 2, pick); m.box(x, y + 1, 2, x + 2, y + 2, 3, p2); return 2;
      case 'clocks': if (r() < 0.5) { m.box(x, y, 1, x + 3, y + 3, 3, k.woodD); m.set(x + 1, y + 1, 3, k.paper); m.set(x + 1, y + 2, 3, k.paper); } else { m.box(x, y, 2, x + 3, y + 3, 3, k.brass); m.set(x + 1, y + 1, 3, k.paper); m.set(x + 1, y + 3, 2, k.brass); } return 4;
      case 'tobacco': if (r() < 0.5) { m.box(x, y, 1, x + 4, y + 1, 4, k.tan); m.box(x, y + 1, 1, x + 4, y + 2, 4, r() < 0.5 ? k.red : k.gold); return 5; } m.box(x, y, 1, x + 2, y + 2, 3, pick); m.box(x, y + 2, 1, x + 2, y + 3, 3, k.steel); return 3;
      case 'toys': { const t = Math.floor(r() * 4); if (t === 0) { m.box(x, y, 1, x + 2, y + 2, 3, pick); m.set(x, y + 2, 2, p2); } else if (t === 1) { m.box(x, y, 1, x + 3, y + 1, 3, k.red); m.set(x, y, 3, k.black); m.set(x + 2, y, 3, k.black); m.box(x + 1, y + 1, 1, x + 2, y + 2, 3, k.navy); } else if (t === 2) { m.box(x, y, 1, x + 2, y + 3, 3, pick); m.box(x, y + 3, 1, x + 2, y + 4, 3, k.skin); } else { m.sphere(x + 1, y + 1, 2, 1.2, pick); } return 3; }
      case 'grocery': { const t = Math.floor(r() * 3); if (t === 0) { m.box(x, y, 1, x + 2, y + 2, 3, pick); m.box(x, y + 1, 1, x + 2, y + 2, 3, k.white); return 2; } if (t === 1) { m.box(x, y, 1, x + 2, y + 3, 4, pick); m.set(x, y + 2, 4 - 1, k.white); return 3; } m.box(x, y, 1, x + 3, y + 2, 4, k.tan); m.set(x + 1, y + 2, 2, k.tan); return 4; }
      case 'bottles': m.box(x, y, 2, x + 1, y + 3, 3, [k.glass, k.jade, k.leather, k.red, k.navy][Math.floor(r() * 5)]); m.set(x, y + 3, 2, k.gold); return 2;
      case 'jewel': m.box(x, y, 0, x + 4, y + 1, 3, k.navy); m.set(x + 1, y + 1, 1, k.gold); m.set(x + 2, y + 1, 2, k.chrome); m.set(x + 3, y + 1, 1, k.br[Math.floor(r() * 12)]); return 5;
      case 'records': if (top) { m.box(x, y, 3, x + 3, y + 3, 4, pick); m.set(x + 1, y + 1, 3, k.black); return 4; } m.box(x, y, 1, x + 1, y + 3, 4, r() < 0.5 ? k.black : pick); return 1;
      case 'camera': m.box(x, y, 1, x + 3, y + 2, 3, k.black); m.set(x + 1, y + 1, 3, k.chrome); m.set(x, y + 2, 2, k.chrome); return 4;
      case 'paper': m.box(x, y, 1, x + 3, y + 1 + Math.floor(r() * 3), 4, r() < 0.5 ? k.white : k.cream); m.set(x + 1, y, 3, pick); return 4;
      case 'chandlery': { const t = Math.floor(r() * 3); if (t === 0) { m.box(x, y, 1, x + 3, y + 2, 4, k.tan); m.set(x + 1, y + 1, 3, k.woodD); return 4; } if (t === 1) { m.box(x, y, 1, x + 2, y + 1, 3, k.brass); m.box(x, y + 1, 1, x + 2, y + 3, 3, k.glass); m.box(x, y + 3, 1, x + 2, y + 4, 3, k.brass); return 3; } m.box(x, y, 1, x + 2, y + 2, 3, k.brass); return 3; }
      case 'pawn': { const t = Math.floor(r() * 4); if (t === 0) { m.box(x, y, 1, x + 3, y + 3, 3, k.woodD); m.set(x + 1, y + 1, 3, k.paper); } else if (t === 1) { m.box(x, y, 2, x + 3, y + 1, 3, k.gold); m.box(x + 2, y + 1, 2, x + 3, y + 3, 3, k.gold); } else if (t === 2) { m.box(x, y, 1, x + 3, y + 2, 4, k.woodL); } else { m.box(x, y, 1, x + 2, y + 1, 3, k.steel); m.set(x, y + 1, 2, k.br[2]); } return 4; }
      case 'shirts': m.box(x, y, 0, x + 3, y + 1, 3, pick); m.box(x, y + 1, 0, x + 3, y + 2, 3, r() < 0.5 ? k.white : p2); m.set(x + 1, y + 2, 2, k.white); return 4;
      case 'deli': { const t = Math.floor(r() * 3); if (t === 0) { m.sphere(x + 1.5, y + 0.5, 2, 1.6, k.crust[2], (a, b) => (b === y ? k.crust[2] : 0)); return 4; } if (t === 1) { m.box(x, y, 1, x + 2, y + 3, 3, k.glass); m.box(x, y, 1, x + 2, y + 2, 3, [k.red, k.leaf, k.ochre][Math.floor(r() * 3)]); m.box(x, y + 3, 1, x + 2, y + 4, 3, k.red); return 3; } m.box(x, y, 1, x + 1, y + 4, 2, k.redD); m.box(x + 2, y + 1, 1, x + 3, y + 4, 2, k.leather); return 4; }
      case 'luggage': m.box(x, y, 0, x + 5, y + 3, 3, r() < 0.5 ? k.leather : k.tan); m.box(x + 2, y + 3, 1, x + 3, y + 4, 2, k.brass); m.box(x, y + 1, 3, x + 5, y + 2, 3, k.brass); return 6;
      default: m.box(x, y, 1, x + 2, y + 1 + Math.floor(r() * 2), 3, pick); return 3;
    }
  };
  // ---- wall shelf (w = 24 or 12 voxels at 1/8 m, 2.5 m tall, 0.5 m deep), trade-specific and seeded so no two are alike
  const shelf = (tr, w, seed) => G('sk-shelf-' + tr + w + '-' + (seed % 5), () => {
    const k = K, t = T[tr], r = AF.rng(seed * 131 + tr.length * 7 + w), m = M(w, 20, 4);
    const fr = ['records', 'tobacco', 'pawn', 'books', 'chandlery', 'clocks'].includes(t.item) ? k.woodD : ['bottles', 'camera', 'jewel', 'candy'].includes(t.item) ? k.mahog : k.wood;
    if (t.item === 'hardware') {   // pegboard with hanging tools over paint cans
      m.box(0, 0, 0, w, 20, 1, k.tan); for (let x = 1; x < w; x += 2) for (let y = 9; y < 19; y += 2) m.set(x, y, 1, k.woodD);
      for (let x = 2; x < w - 2; x += 3) { const q = Math.floor(r() * 4); if (q === 0) { m.box(x, 13, 1, x + 1, 18, 2, k.woodL); m.box(x - 1, 17, 1, x + 2, 18, 2, k.iron); } else if (q === 1) { m.box(x, 11, 1, x + 2, 17, 2, k.steel); m.box(x, 17, 1, x + 2, 18, 2, k.woodL); } else if (q === 2) { m.box(x, 12, 1, x + 1, 18, 2, k.red); m.box(x - 1, 12, 1, x + 2, 13, 2, k.steel); } else { for (let a = 0; a < 5; a++) m.set(x + (a & 1), 12 + a, 1, k.tan); } }
      m.box(0, 0, 0, w, 1, 4, k.woodD); m.box(0, 5, 0, w, 6, 4, k.woodD);
      for (let x = 1; x < w - 1; x += 3) for (const y of [1, 6]) { m.box(x, y, 1, x + 2, y + 3, 3, k.steel); m.box(x, y + 1, 1, x + 2, y + 2, 3, k.br[Math.floor(r() * 12)]); }
      return m;
    }
    m.box(0, 0, 0, w, 20, 1, fr); m.box(0, 0, 0, 1, 20, 4, fr); m.box(w - 1, 0, 0, w, 20, 4, fr);
    const glassy = ['camera', 'jewel', 'candy'].includes(t.item);
    for (const y of [0, 5, 10, 15]) m.box(0, y, 0, w, y + 1, 4, glassy && y ? k.glass : fr);
    m.box(0, 19, 0, w, 20, 4, fr); m.box(0, 0, 3, w, 1, 4, k.woodD);
    for (const y of [1, 6, 11, 16]) for (let x = 1; x < w - 2;) { if (r() < 0.06) { x += 2; continue; } x += item(m, t.item, x, y, r, y === 16); }
    if (w >= 24 && r() < 0.6) { m.box(w / 2 - 3, 18, 3, w / 2 + 3, 20, 4, k.cream); m.box(w / 2 - 2, 18, 4 - 1, w / 2 + 2, 19, 4, k.red); }   // shelf card
    return m;
  }, 1 / 8, [0.5, 0, 0]);
  // ---- light fixtures: 6 designs (school globe, enamel dish, deco tiers, brass tulips, alabaster bowl, industrial cone). anchor = top.
  const FIX = [
    () => { const k = K, m = M(8, 14, 8); m.box(3, 7, 3, 5, 14, 5, k.brass); m.box(2, 6, 2, 6, 7, 6, k.brass); m.sphere(4, 3.4, 4, 3.3, k.milk); return m; },
    () => { const k = K, m = M(12, 14, 12); m.box(5, 5, 5, 7, 14, 7, k.black); for (let y = 2; y < 5; y++) m.sphere(6, 1, 6, 3 + (y - 2) * 1.4, k.enamel, (x, yy, z) => (yy === y ? k.enamel : 0)); m.box(3, 1, 3, 9, 2, 9, k.lamp); m.box(4, 0, 4, 8, 1, 8, k.lamp); return m; },
    () => { const k = K, m = M(12, 16, 12); m.box(5, 9, 5, 7, 16, 7, k.chrome); m.box(1, 6, 1, 11, 8, 11, k.milk); m.box(0, 7, 0, 12, 8, 12, k.chrome); m.box(2, 4, 2, 10, 6, 10, k.milk); m.box(3, 2, 3, 9, 4, 9, k.milk); m.box(4, 1, 4, 8, 2, 8, k.chrome); m.box(5, 0, 5, 7, 1, 7, k.gold); return m; },
    () => { const k = K, m = M(14, 12, 14); m.box(6, 5, 6, 8, 12, 8, k.brass); m.box(1, 5, 6, 13, 6, 8, k.brass); m.box(6, 5, 1, 8, 6, 13, k.brass); for (const [x, z] of [[1, 6], [11, 6], [6, 1], [6, 11]]) { m.box(x, 3, z, x + 2, 5, z + 2, k.brass); m.box(x, 0, z, x + 2, 3, z + 2, k.amber); } m.box(5, 2, 5, 9, 5, 9, k.gold); return m; },
    () => { const k = K, m = M(14, 14, 14); for (const [x, z] of [[1, 7], [12, 7], [7, 1]]) m.line(x, 4, z, 7, 14, 7, k.brass); m.sphere(7, 4, 7, 6.2, k.milk, (x, y) => (y < 4 ? (y === 3 ? k.brass : k.milk) : 0)); return m; },
    () => { const k = K, m = M(10, 12, 10); m.box(4, 6, 4, 6, 12, 6, k.black); for (let y = 1; y < 6; y++) m.sphere(5, 0, 5, 1.5 + y * 0.75, k.ochre, (x, yy, z) => (yy === 6 - y ? k.ochre : 0)); m.box(4, 0, 4, 6, 1, 6, k.bulb); return m; },
  ];
  const fixture = (i) => G('sk-fix' + i, FIX[i], 1 / 16, [0.5, 1, 0.5]);
  const fanRod = () => G('sk-fanrod', () => { const k = K, m = M(4, 10, 4); m.box(1, 0, 1, 3, 10, 3, k.brass); m.box(0, 9, 0, 4, 10, 4, k.brass); return m; }, 1 / 16, [0.5, 1, 0.5]);
  const fanBlades = () => G('sk-fanbl', () => { const k = K, m = M(22, 4, 22); m.sphere(11, 2, 11, 2.6, k.brass); for (let a = 2; a < 10; a++) { m.box(11 + a, 1, 10, 12 + a, 2, 13, k.woodD); m.box(10 - a, 1, 9, 11 - a, 2, 12, k.woodD); m.box(9, 1, 11 + a, 12, 2, 12 + a, k.woodD); m.box(10, 1, 10 - a, 13, 2, 11 - a, k.woodD); } return m; }, 1 / 16, [0.5, 0.5, 0.5]);
  const clockFace = () => G('sk-clock', () => { const k = K, m = M(12, 12, 2); m.sphere(6, 6, 0, 6, k.brass, (x, y, z) => (z === 0 ? k.brass : 0)); m.sphere(6, 6, 1, 5, k.paper, (x, y, z) => (z === 1 ? k.paper : 0)); for (let h = 0; h < 12; h++) { const a = h / 12 * Math.PI * 2; m.set(Math.floor(6 + Math.sin(a) * 4.2), Math.floor(6 + Math.cos(a) * 4.2), 1, k.black); } return m; }, 1 / 20, [0.5, 0.5, 0]);
  const hand = (len) => G('sk-hand' + len, () => { const m = M(1, len + 1, 1); m.box(0, 0, 0, 1, len + 1, 1, K.black); return m; }, 1 / 40, [0.5, 1 / (len + 1) / 2, 0.5]);
  const calendar = () => G('sk-cal', () => { const k = K, m = M(14, 20, 1); m.box(0, 0, 0, 14, 20, 1, k.paper); m.box(0, 13, 0, 14, 20, 1, k.red); m.box(1, 14, 0, 13, 19, 1, k.cream); for (let d = 0; d < 30; d++) { const x = 1 + (d % 6) * 2, y = 11 - Math.floor(d / 6) * 2; m.set(x, y, 0, d === 22 ? k.red : k.black); } m.box(6, 20 - 1, 0, 8, 20, 1, k.brass); return m; }, 1 / 24, [0.5, 0, 0]);
  const calText = () => G('sk-caltxt', () => AF.textModel('SEPT 1936', AF.col(0x7e1624), { pad: 0, depth: 1 }), 1 / 96, [0.5, 0.5, 0]);
  const POST = [   // 8 original posters, 12x16 at 1/24 m
    (m, k) => { m.box(1, 1, 0, 11, 15, 1, k.cream); m.sphere(6, 8, 0, 3.5, k.crust[0]); m.box(2, 11, 0, 10, 12, 1, k.red); m.box(3, 2, 0, 9, 3, 1, k.redD); },
    (m, k) => { m.box(1, 1, 0, 11, 15, 1, k.br[8]); m.box(5, 3, 0, 7, 9, 1, k.black); m.box(4, 9, 0, 8, 10, 1, k.black); m.box(5, 10, 0, 7, 12, 1, k.skin); m.box(3, 12, 0, 9, 13, 1, k.navy); m.box(4, 13, 0, 8, 14, 1, k.navy); },
    (m, k) => { m.box(1, 1, 0, 11, 15, 1, k.navy); for (let a = 0; a < 12; a++) { const t = a / 12 * Math.PI; m.line(6, 4, 0, Math.round(6 + Math.cos(t) * 5), Math.round(4 + Math.sin(t) * 9), 0, k.gold); } m.box(2, 2, 0, 10, 3, 1, k.cream); },
    (m, k) => { m.box(1, 1, 0, 11, 15, 1, k.jade); m.box(3, 5, 0, 9, 7, 1, k.shoeK); m.box(3, 7, 0, 5, 10, 1, k.shoeK); m.box(2, 12, 0, 10, 14, 1, k.cream); },
    (m, k) => { m.box(1, 1, 0, 11, 15, 1, k.cream); m.box(3, 4, 0, 9, 11, 1, k.redD); m.box(4, 5, 0, 8, 10, 1, k.gold); m.box(2, 13, 0, 10, 14, 1, k.black); },
    (m, k) => { m.box(1, 1, 0, 11, 15, 1, k.br[3]); m.sphere(6, 9, 0, 3, k.fl[0]); m.sphere(4, 7, 0, 2, k.fl[1]); m.box(6, 2, 0, 7, 7, 1, k.leaf); },
    (m, k) => { m.box(1, 1, 0, 11, 15, 1, k.br[4]); m.box(2, 3, 0, 10, 5, 1, k.navy); m.box(4, 5, 0, 8, 10, 1, k.white); m.box(5, 10, 0, 7, 13, 1, k.navy); },
    (m, k) => { m.box(1, 1, 0, 11, 15, 1, k.br[2]); m.sphere(6, 7, 0, 4, k.red); m.set(5, 8, 0, k.white); m.box(2, 13, 0, 10, 14, 1, k.red); },
  ];
  const poster = (i) => G('sk-post' + (i % 8), () => { const k = K, m = M(12, 16, 1); m.box(0, 0, 0, 12, 16, 1, k.woodD); POST[i % 8](m, k); return m; }, 1 / 24, [0.5, 0, 0]);
  const register = () => G('sk-reg', () => { const k = K, m = M(10, 12, 9); m.box(0, 0, 0, 10, 3, 9, k.brass); m.box(1, 3, 1, 9, 8, 7, k.brass); for (let x = 2; x < 8; x += 2) for (let z = 3; z < 7; z += 2) m.set(x, 5 + (z >> 2), z + 1, k.white); m.box(2, 8, 2, 8, 11, 4, k.brass); m.box(3, 9, 1, 7, 10, 2, k.black); m.box(9, 4, 4, 10, 5, 5, k.black); m.box(1, 0, 9 - 1, 9, 2, 9, k.woodD); return m; }, 1 / 16, [0.5, 0, 0.5]);
  const cat = () => G('sk-cat', () => { const k = K, m = M(8, 4, 5); m.box(1, 0, 1, 6, 2, 4, k.cat); m.box(5, 0, 1, 8, 3, 4, k.cat); m.set(5, 3, 1, k.cat); m.set(5, 3, 3, k.cat); m.box(0, 0, 3, 2, 1, 5, k.cat); m.set(7, 1, 2, k.catW); m.box(2, 2, 2, 5, 3, 3, k.cat); return m; }, 1 / 16, [0.5, 0, 0.5]);
  const crate = (i) => G('sk-crate' + (i % 3), () => { const k = K, m = M(6, 5, 6); m.box(0, 0, 0, 6, 5, 6, k.oak); m.box(0, 4, 0, 6, 5, 6, k.wood); for (let x = 0; x < 6; x++) { m.set(x, 2, 0, k.wood); m.set(x, 2, 5, k.wood); } m.box(1, 5, 1, 5, 6, 5, k.br[(i * 5) % 12]); return m; }, 1 / 8, [0.5, 0, 0.5]);
  const stool = () => G('sk-stool', () => { const k = K, m = M(4, 7, 4); for (const [x, z] of [[0, 0], [3, 0], [0, 3], [3, 3]]) m.box(x, 0, z, x + 1, 6, z + 1, k.woodD); m.box(0, 6, 0, 4, 7, 4, k.oak); m.box(0, 2, 0, 4, 3, 1, k.woodD); return m; }, 1 / 8, [0.5, 0, 0.5]);
  const plant = () => G('sk-plant', () => { const k = K, m = M(6, 12, 6); m.box(1, 0, 1, 5, 3, 5, k.ochre); m.box(2, 3, 2, 4, 6, 4, k.wood); m.sphere(3, 8, 3, 3.2, k.leaf); return m; }, 1 / 8, [0.5, 0, 0.5]);
  const sign = (t) => G('sk-sign-' + t, () => AF.textModel(t, K.gold, { bg: K.black, pad: 1, depth: 1 }), 1 / 48, [0.5, 0.5, 0]);
  // ---- islands (centre fixtures): model 16 x ~10 x 8 at 1/8 m, front on +z
  const island = (tr, kind, seed) => G('sk-isl-' + tr + '-' + kind + (seed % 3), () => {
    const k = K, t = T[tr], r = AF.rng(seed * 17 + 5);
    if (kind === 'case') { const m = M(16, 9, 8); m.box(0, 0, 0, 16, 5, 8, k.mahog); m.box(0, 4, 0, 16, 5, 8, k.brass); m.box(0, 5, 0, 16, 8, 8, k.glass); m.box(0, 8, 0, 16, 9, 8, k.chrome); for (let x = 1; x < 15;) x += item(m, t.item, x, 5, r, false) + 0; m.box(0, 5, 0, 16, 8, 1, k.glass); m.box(0, 5, 7, 16, 8, 8, k.glass); return m; }
    if (kind === 'cakes') { const m = M(16, 12, 8); m.box(1, 0, 1, 15, 6, 7, k.white); m.box(0, 6, 0, 16, 7, 8, k.marble); for (const [x, h, c] of [[3, 4, 0], [8, 5, 1], [13, 3, 3]]) { m.box(x - 2, 7, 2, x + 2, 7 + h - 1, 6, k.icing[c]); m.box(x - 1, 7 + h - 1, 3, x + 1, 7 + h, 5, k.icing[(c + 1) % 4]); m.set(x, 7 + h, 4, k.red); } return m; }
    if (kind === 'hatstands') { const m = M(16, 14, 8); m.box(0, 0, 2, 16, 1, 6, k.woodD); for (let x = 1; x < 16; x += 5) { m.box(x + 1, 1, 3, x + 2, 11, 5, k.brass); const h = k.br[Math.floor(r() * 12)]; m.box(x - 1, 11, 2, x + 4, 12, 6, h); m.box(x, 12, 3, x + 3, 14, 5, h); m.box(x, 12, 3, x + 3, 13, 5, k.black); } return m; }
    if (kind === 'console') { const m = M(16, 10, 8); m.box(0, 0, 1, 9, 8, 7, k.mahog); m.box(1, 2, 7, 8, 7, 8, k.woodL); m.box(3, 5, 7, 6, 6, 8, k.dial); m.box(0, 8, 1, 9, 9, 7, k.woodD); m.box(11, 0, 2, 16, 4, 6, k.redD); m.box(11, 4, 5, 16, 9, 6, k.redD); return m; }
    if (kind === 'fitting') { const m = M(16, 8, 8); m.box(0, 0, 3, 12, 3, 8, k.woodD); m.box(0, 3, 4, 12, 4, 8, k.redD); m.box(0, 4, 7, 12, 8, 8, k.redD); m.box(13, 0, 2, 16, 3, 6, k.woodD); m.box(13, 3, 1, 16, 4, 7, k.steel); for (let x = 1; x < 12; x += 4) { m.box(x, 0, 0, x + 1, 1, 2, k.shoeK); m.box(x + 2, 0, 0, x + 3, 1, 2, k.leather); } return m; }
    if (kind === 'stand') { const m = M(16, 12, 8); for (let s = 0; s < 3; s++) { m.box(0, s * 3, s * 2, 16, s * 3 + 1, 8, k.woodL); for (let x = 1; x < 15; x += 3) item(m, 'flowers', x, s * 3 + 1, r, false) && 0; } return m; }
    if (kind === 'barrels') { const m = M(16, 8, 8); for (const [x, z] of [[3, 4], [8, 3], [13, 5]]) { m.sphere(x, 3, z, 2.8, k.oak, (a, y) => (y < 6 ? (y === 1 || y === 4 ? k.iron : k.oak) : 0)); m.box(x - 2, 6, z - 2, x + 2, 7, z + 2, [k.steel, k.tan, k.ochre][Math.floor(r() * 3)]); } m.box(5, 0, 6, 11, 2, 8, k.tan); return m; }
    if (kind === 'bins' || kind === 'recbins') { const m = M(16, 9, 8); m.box(0, 0, 0, 16, 5, 8, k.woodD); for (let x = 0; x < 16; x += 4) for (let z = 0; z < 8; z += 4) { const c = kind === 'recbins' ? null : k.br[Math.floor(r() * 12)]; for (let q = 0; q < 4; q++) m.box(x, 5, z + q, x + 4, 5 + (q >> 1) + 1, z + q + 1, c ?? (q % 2 ? k.black : k.br[(x + q) % 12])); m.box(x, 5, z, x + 1, 7, z + 4, k.woodL); } return m; }
    if (kind === 'bolts') { const m = M(16, 12, 8); m.box(0, 5, 0, 12, 6, 8, k.oak); m.box(1, 0, 1, 11, 5, 7, k.woodD); for (let x = 1; x < 11; x += 2) m.box(x, 6, 2, x + 2, 6 + 2 + (x % 3), 6, k.br[Math.floor(r() * 12)]); m.box(13, 0, 3, 14, 7, 4, k.woodD); m.box(12, 7, 2, 16, 11, 6, k.cream); m.box(13, 11, 3, 15, 12, 5, k.woodD); return m; }
    if (kind === 'toytable') { const m = M(16, 9, 8); m.box(0, 4, 0, 16, 5, 8, k.woodL); m.box(1, 0, 1, 15, 4, 7, k.woodD); for (let x = 1; x < 15;) x += item(m, 'toys', x, 5, r, false); for (let x = 2; x < 14; x++) m.set(x, 5, 1, k.iron); m.box(3, 5, 0, 6, 7, 2, k.red); m.set(3, 7, 1, k.black); return m; }
    const m = M(16, 8, 8); m.box(0, 5, 0, 16, 6, 8, k.oak); for (const [a, b] of [[0, 0], [15, 0], [0, 7], [15, 7]]) m.box(a, 0, b, a + 1, 5, b + 1, k.woodD); for (let x = 1; x < 15;) x += item(m, t.item, x, 6, r, false); return m;
  }, 1 / 8, [0.5, 0, 0.5]);

  AF.shopKit = (box, trade, o = {}) => {
    cols();
    const tr = tradeOf(trade), t = T[tr], seed = (o.seed ?? SK.n * 7 + 3) | 0, idx = SK.n++, r = AF.rng(seed * 977 + 11);
    const [x0, y0, z0, x1, y1, z1] = box, front = o.front ?? 'z0';
    let U, V, ox, oz, W, D;
    if (front === 'z0') { V = [0, 1]; U = [1, 0]; ox = x0; oz = z0; W = x1 - x0; D = z1 - z0; }
    else if (front === 'z1') { V = [0, -1]; U = [-1, 0]; ox = x1; oz = z1; W = x1 - x0; D = z1 - z0; }
    else if (front === 'x0') { V = [1, 0]; U = [0, -1]; ox = x0; oz = z1; W = z1 - z0; D = x1 - x0; }
    else { V = [-1, 0]; U = [0, 1]; ox = x1; oz = z0; W = z1 - z0; D = x1 - x0; }
    const H = y1 - y0, rotOf = (dx, dz) => (Math.abs(dz) >= Math.abs(dx) ? (dz > 0 ? 0 : 2) : (dx > 0 ? 1 : 3));
    const f = {
      w: (u, v) => [ox + U[0] * u + V[0] * v, oz + U[1] * u + V[1] * v],
      dir: (du, dv) => [U[0] * du + V[0] * dv, U[1] * du + V[1] * dv],
      yaw: (du, dv) => { const d = f.dir(du, dv); return Math.atan2(d[0], d[1]); },
      fill: (ua, ya, va, ub, yb, vb, c) => { const a = f.w(ua, va), b = f.w(ub, vb); AF.W.fill(Math.min(a[0], b[0]), y0 + ya, Math.min(a[1], b[1]), Math.max(a[0], b[0]), y0 + yb, Math.max(a[1], b[1]), c); },
      set: (u, y, v, c) => { const p = f.w(u + 0.125, v + 0.125); AF.W.setM(p[0], y0 + y + 0.125, p[1], c); },
      place: (geo, u, y, v, du = 0, dv = -1, collide = false) => { const p = f.w(u, v), d = f.dir(du, dv); AF.placeStatic(geo, p[0], y0 + y, p[1], rotOf(d[0], d[1]), { collide }); },
      light: (u, y, v, color = 0xffd2a0, intensity = 1.1, range = 9) => { const p = f.w(u, v); AF.addLight({ x: p[0], y: y0 + y, z: p[1], color, intensity, range, kind: 'interior' }); },
    };
    const doorU = o.doorU ?? (o.door ? (o.door[0] - ox) * U[0] + (o.door[1] - oz) * U[1] : W / 2), door = o.door ?? f.w(doorU, -1.2), inside = f.w(doorU, 1.6);
    const cSide = o.counter ?? (doorU > W * 0.55 ? 'L' : 'R'), L = cSide === 'L';
    const U_ = (u) => (L ? u : W - u), DU = L ? 1 : -1;     // u measured from the counter-side wall
    const ctx = { f, W, D, H, trade: tr, spots: 0, id: o.id };
    const spot = (kind, u, v, lu, lv, y = 0) => { if (!o.id) return; const p = f.w(u, v); AF.addSpot({ building: o.id, x: p[0], y: y0 + y, z: p[1], yaw: f.yaw(lu, lv), kind, path: [door, inside, f.w(u, Math.max(1.6, Math.min(v, 2.0))), p] }); ctx.spots++; };
    const winV = o.windowDepth ?? 1.25;
    if (o.dress) { o.counterless = true; o.shelves = false; if (o.island === undefined) o.island = 'none'; if (o.backRoom === undefined) o.backRoom = false; }             // keep the window beds clear
    // floor
    if (o.floor !== false) {
      const fk = o.floorType ?? t.floor;
      if (fk === 'lino') { const a = K.linoA, b = [K.linoB, K.linoC, K.linoD][idx % 3]; for (let u = 0; u < W - 1e-6; u += 0.25) for (let v = 0; v < D - 1e-6; v += 0.25) f.set(u, -0.25, v, ((Math.floor(u * 2) + Math.floor(v * 2)) & 1) ? b : a); }
      else if (fk === 'terrazzo' || fk === 'terrazzoR') { f.fill(0, -0.25, 0, W, 0, D, K[fk]); for (let u = 1.5; u < W; u += 1.5) f.fill(u, -0.25, 0, u + 0.25, 0, D, K.brass); }
      else f.fill(0, -0.25, 0, W, 0, D, K[fk] ?? K.plank);
      f.fill(doorU - 0.75, -0.25, 0, doorU + 0.75, 0, 1.0, K.coir);
    }
    // back room (curtained stock room) when the shop is deep enough
    const back = o.backRoom ?? (D >= 8.5 && W >= 4), vEnd = back ? D - 2.25 : D;
    const wallC = o.wall ?? K.wallA[idx % 6];
    if (back) {
      f.fill(0, 0, vEnd, W, H, vEnd + 0.25, wallC); f.fill(0, 0, vEnd - 0.01, W, 1.0, vEnd + 0.25, K.woodD);
      const da = U_(0.25), db = U_(1.25); f.fill(Math.min(da, db), 0, vEnd, Math.max(da, db), 2.25, vEnd + 0.25, 0);
      f.fill(Math.min(da, db) - 0.25, 2.25, vEnd - 0.01, Math.max(da, db) + 0.25, 2.5, vEnd + 0.25, K.woodD);
      const ca = U_(0.25), cb = U_(0.75); f.fill(Math.min(ca, cb), 0.25, vEnd + 0.25, Math.max(ca, cb), 2.25, vEnd + 0.5, idx % 2 ? K.curtain : K.curtainG);
      for (let i = 0; i < 4; i++) f.place(crate(i + idx), U_(1.8 + (i % 2) * 0.9), (i >> 1) * 0.625, vEnd + 1.2, 0, -1, true);
      f.place(sign('STOCK ROOM'), U_(0.75), 2.7, vEnd - 0.02, 0, -1);
      f.light(W / 2, H - 0.6, vEnd + 1.1, 0xffc070, 0.5, 4);
    } else if (!o.dress) { const dd = G('sk-bdoor', () => { const k = K, m = M(8, 18, 1); m.box(0, 0, 0, 8, 18, 1, k.woodD); m.box(1, 10, 0, 7, 16, 1, k.glass); m.box(1, 2, 0, 7, 8, 1, k.wood); m.set(6, 8, 0, k.brass); return m; }, 1 / 8, [0.5, 0, 0]); f.place(dd, U_(0.9), 0, D, 0, -1); }
    // ceiling treatment
    const ceil = o.ceiling ?? t.ceil;
    if (ceil === 'tin') { f.fill(0, H - 0.25, 0, W, H, D, idx % 2 ? K.tin : K.tinG); f.fill(0, H - 0.5, 0, 0.25, H - 0.25, D, K.cream); f.fill(W - 0.25, H - 0.5, 0, W, H - 0.25, D, K.cream); }
    else if (ceil === 'beams' || ceil === 'coffer') { f.fill(0, H - 0.25, 0, W, H, D, ceil === 'beams' ? K.boards : K.deco); for (let v = 1.0; v < D - 0.25; v += 1.5) f.fill(0, H - 0.5, v, W, H - 0.25, v + 0.25, ceil === 'beams' ? K.beam : K.woodD); if (ceil === 'coffer') for (let u = 1.0; u < W - 0.25; u += 1.5) f.fill(u, H - 0.5, 0, u + 0.25, H - 0.25, D, K.woodD); }
    else if (ceil === 'cove') { f.fill(0, H - 0.25, 0, W, H, D, K.deco); f.fill(0, H - 0.75, 0, W, H - 0.5, 0.75, K.cream); f.fill(0, H - 0.75, D - 0.75, W, H - 0.5, D, K.cream); f.fill(0, H - 0.75, 0, 0.75, H - 0.5, D, K.cream); f.fill(W - 0.75, H - 0.75, 0, W, H - 0.5, D, K.cream);
      f.fill(0.75, H - 0.5, 0.75, 1.0, H - 0.25, D - 0.75, K.cove); f.fill(W - 1.0, H - 0.5, 0.75, W - 0.75, H - 0.25, D - 0.75, K.cove);
      const cu = W / 2, cv = D / 2; for (let a = 0; a < 16; a++) { const th = a / 16 * Math.PI * 2; for (let q = 0.25; q < Math.min(W, D) * 0.35; q += 0.25) { const u = cu + Math.cos(th) * q, v = cv + Math.sin(th) * q; if (u > 1 && u < W - 1 && v > 1 && v < D - 1) f.set(Math.floor(u * 4) / 4, H - 0.25, Math.floor(v * 4) / 4, K.gold); } } }
    const cTop = ceil === 'cove' ? H - 0.25 : ceil === 'tin' ? H - 0.25 : H - 0.25;
    // counter along the counter-side wall with a brass register, keeper spot behind
    const cStart = Math.max(winV + 1.0, 2.25), cEnd = Math.max(cStart + 2, Math.min(vEnd - 1.25, cStart + Math.max(3, vEnd * 0.5)));
    if (o.counterless !== true && W >= 3.5) {
      const ca = U_(1.25), cb = U_(2.0);
      f.fill(Math.min(ca, cb), 0, cStart, Math.max(ca, cb), 0.75, cEnd, K.mahog); f.fill(Math.min(ca, cb) - 0.125 * 0, 0.75, cStart, Math.max(ca, cb), 1.0, cEnd, t.item === 'bread' || t.item === 'deli' ? K.marble : K.oak);
      f.fill(Math.min(ca, cb), 0.0, cStart, Math.max(ca, cb), 0.25, cEnd, K.woodD);
      f.place(register(), U_(1.62), 1.0, cStart + 0.55, -DU, 0);
      if ((idx % 4) === 1) f.place(cat(), U_(1.62), 1.0, cEnd - 0.6, 0, -1);
      else f.place(G('sk-bell', () => { const m = M(4, 3, 4); m.box(0, 0, 0, 4, 1, 4, K.woodD); m.sphere(2, 1, 2, 1.5, K.brass, (x, y) => (y >= 1 ? K.brass : 0)); m.set(2, 2, 2, K.brass); return m; }, 1 / 16), U_(1.62), 1.0, cStart + 1.4, 0, -1);
      f.place(stool(), U_(0.7), 0, cEnd - 0.4, 0, -1);
      spot('work', U_(0.75), (cStart + cEnd) / 2, DU, 0); spot('counter', U_(2.55), cStart + 0.6, -DU, 0);
      // keeper-side wall: 1.5 m shelves between the window and the back
      if (o.shelves !== false) for (let v = cStart; v + 1.5 <= vEnd - (back ? 1.3 : 0.2); v += 1.5) f.place(shelf(tr, 12, seed + v * 3), U_(0), 0, v + 0.75, DU, 0, true);
    }
    { const cv = Math.max(winV + 0.3, cStart - 0.55); f.place(calendar(), U_(0.02), 1.55, cv, DU, 0); f.place(calText(), U_(0.04), 2.2, cv, DU, 0); }
    // back wall (or partition) shelves
    if (o.shelves !== false) { const ua = back ? 1.6 : 1.9, ub = W - 0.3; for (let u = ua; u + 1.5 <= ub + 1e-6;) { const w = u + 3 <= ub + 1e-6 ? 3 : 1.5; f.place(shelf(tr, w * 8, seed + u * 5), U_(u + w / 2), 0, vEnd, 0, -1, true); u += w; } }
    // free-side wall shelves, a poster near the window and one high
    const fsA = Math.max(winV + 1.4, 2.75);
    if (o.shelves !== false) for (let v = fsA; v + 1.5 <= vEnd - 0.55; ) { const w = v + 3 <= vEnd - 0.55 ? 3 : 1.5; f.place(shelf(tr, w * 8, seed + 77 + v * 3), U_(W), 0, v + w / 2, -DU, 0, true); v += w; }
    f.place(poster(t.post + idx), U_(W - 0.02), 1.3, fsA - 0.75, -DU, 0);
    if (H >= 3.6) f.place(poster(t.post + idx + 3), U_(W - 0.02), 2.75, (fsA + vEnd) / 2, -DU, 0);
    if (!o.dress) spot('browse', U_(W - 0.9), fsA + 1.2, DU, 0); if (!o.dress) spot('browse', U_(W / 2 + 0.6), vEnd - 1.0, 0, 1);
    // clock (moving hands) high on the back wall/partition
    { const cu = U_(W * 0.62), cy = Math.min(H - 0.7, 3.15), p = f.w(cu, vEnd - 0.03), dn = f.dir(0, -1); f.place(clockFace(), cu, cy, vEnd - 0.01, 0, -1); SK.dyn.push({ type: 'clock', x: p[0], y: y0 + cy, z: p[1], yaw: Math.atan2(dn[0], dn[1]) }); }
    // centre island
    const isl = o.island ?? t.island, iu = L ? (2.0 + W - 0.5) / 2 : (W - 2.0 + 0.5) / 2, iv = (cStart + vEnd) / 2;
    if (isl !== 'none' && W >= 5.2 && vEnd - cStart >= 3) { f.place(island(tr, isl, seed), iu, 0, iv, 0, -1, true); spot('browse', iu, iv - 1.1, 0, 1);
      // wide shops: a stocked gondola run between the island and the free wall (long axis along the depth)
      const fw = W - 0.5, ie = L ? iu + 1.0 : iu - 1.0, gap = L ? fw - ie : ie - 0.5;
      if (!o.dress && o.gondola !== false && W >= 9 && gap >= 3.0 && vEnd - cStart >= 3.6) { const gu = L ? (ie + fw) / 2 : (ie + 0.5) / 2; f.place(gondola(tr, seed + 1), gu, 0, iv, 1, 0, true); spot('browse', gu + (L ? -0.95 : 0.95), iv + 0.6, L ? 1 : -1, 0); }
    }
    else if (W >= 4.5 && !o.dress) f.place(plant(), U_(W - 0.6), 0, winV + 0.6, 0, -1, true);
    // light fixtures: a row of 2–4 from two designs + the light pool; ceiling fans between them
    const nF = Math.max(2, Math.min(4, Math.round(D / 3.2))), fu = W >= 5.2 ? iu : W / 2, fa = t.fix[0], fb = (t.fix[1] + (idx % 3 === 2 ? 1 : 0)) % 6, drop = Math.max(0.2, Math.min(1.1, H - 2.9));
    for (let i = 0; i < nF; i++) { const v = 1.2 + (i + 0.5) * (vEnd - 1.4) / nF; f.place(fixture(i % 2 ? fb : fa), fu, cTop - drop * (i % 2 ? 0.7 : 1), v, 0, -1); if (i % 2 === 0) f.light(fu, cTop - drop - 0.4, v + (vEnd - 1.4) / nF / 2, o.lightC ?? 0xffcf96, 1.15, Math.max(7, Math.min(11, W + 2))); }
    if (H >= 3.1 && o.fans !== false) { const S = (vEnd - 1.4) / nF, ks = nF >= 3 ? [1, nF - 1] : [1]; for (const k of ks) { const fv = 1.2 + k * S, p = f.w(fu, fv); f.place(fanRod(), fu, cTop, fv, 0, -1); SK.dyn.push({ type: 'fan', x: p[0], y: y0 + cTop - 0.62, z: p[1], a: r() * 6, s: 2.2 + r() * 1.2 }); } }
    SK.rooms.push({ id: o.id, tr, box });
    return ctx;
  };
  AF.shopKit.trades = SK.trades;
  // a window-display piece for any trade (0.8 m wide, 0.5 m deep; front on +z): AF.shopKit.display(trade, seed)
  // a double-sided island gondola (3 m long, 1 m deep, 1.4 m tall) stocked on both faces: AF.shopKit.gondola(trade, seed); long axis = model x
  const gondola = (tr, seed) => G('sk-gon-' + tr + (seed % 3), () => {
    const k = K, t = T[tr], r = AF.rng(seed * 53 + tr.length * 11), m = M(24, 11, 8), h = M(24, 11, 4), fr = k.mahog;
    for (const y of [0, 5]) h.box(0, y, 0, 24, y + 1, 4, fr);
    for (const y of [1, 6]) for (let x = 1; x < 22;) x += item(h, t.item, x, y, r, false);
    for (let x = 0; x < 24; x++) for (let y = 0; y < 11; y++) for (let z = 0; z < 4; z++) { const c = h.get(x, y, z); if (c) { m.set(x, y, 4 + z, c); m.set(23 - x, y, 3 - z, c); } }
    m.box(0, 0, 3, 24, 10, 5, fr); m.box(0, 10, 3, 24, 11, 5, k.brass); m.box(0, 0, 0, 1, 11, 8, fr); m.box(23, 0, 0, 24, 11, 8, fr);
    m.box(9, 10, 4, 15, 11, 4, k.cream); return m;
  }, 1 / 8, [0.5, 0, 0.5]);
  AF.shopKit.gondola = (trade, seed = 0) => { cols(); return gondola(tradeOf(trade), seed); };
  AF.shopKit.display = (trade, seed = 0) => { cols(); const tr = tradeOf(trade); return G('sk-disp-' + tr + (seed % 3), () => { const r = AF.rng(seed * 19 + tr.length), m = M(7, 6, 4); m.box(0, 0, 0, 7, 1, 4, K.woodD); for (let x = 0; x < 7;) x += item(m, T[tr].item, x, 1, r, r() < 0.3); return m; }, 1 / 8, [0.5, 0, 0.5]); };

  // ---- dynamic: fans turn, clock hands follow AF.time (meshes made once, hidden beyond 30 m)
  AF.onBuild('shopkit-dyn', 612, () => {
    if (!SK.dyn.length) return;
    const bl = fanBlades(), hm = hand(8), hh = hand(5);
    for (const d of SK.dyn) {
      const g = new THREE.Group(); g.position.set(d.x, d.y, d.z);
      if (d.type === 'fan') { const m = AF.modelMesh(bl, { cast: false }); g.add(m); d.m = m; }
      else { g.rotation.y = d.yaw; const a = AF.modelMesh(hm, { cast: false }), b = AF.modelMesh(hh, { cast: false }); a.position.z = 0.1; b.position.z = 0.12; g.add(a, b); d.hm = a; d.hh = b; }
      g.visible = false; AF.scene.add(g); d.g = g;
    }
  });
  let skT = 0;
  AF.onTick('shopkit-dyn', 312, (dt) => {
    const cam = AF.camera; if (!cam || !SK.dyn.length) return;
    skT += dt; const hrs = (AF.time && AF.time.hours) || 12, am = (hrs % 1) * Math.PI * 2, ah = ((hrs % 12) / 12) * Math.PI * 2;
    const cx = cam.position.x, cy = cam.position.y, cz = cam.position.z;
    for (const d of SK.dyn) {
      if (!d.g) continue; const near = Math.abs(cx - d.x) < 28 && Math.abs(cz - d.z) < 28 && Math.abs(cy - d.y) < 14; d.g.visible = near; if (!near) continue;
      if (d.m) d.m.rotation.y = d.a + skT * d.s; else { d.hm.rotation.z = -am; d.hh.rotation.z = -ah; }
    }
  });
  AF.test('shops: shopKit covers ≥16 trades and dressed ≥12 rooms', () => ({ ok: SK.trades.length >= 16 && SK.rooms.length >= 12, info: SK.trades.length + ' trades, ' + SK.rooms.length + ' rooms, ' + SK.dyn.length + ' fans/clocks' }));
}

{
  const M = (w, h, d) => new AF.Model(w, h, d);
  const S = { dynamic: [], swing: [] };

  // shopKit bridge for TS.shop rooms: drop the template's central lamp row, then dress the room per trade
  const dropLamps = (x) => {
    const TS = AF.TS, b = x.f.box(x.u0, 0, 0, x.u1, 99, x.d), gs = new Set([TS.props.pendant(), TS.props.globe(), TS.props.brassLamp()]);
    const hit = (pr) => gs.has(pr.geo) && pr.x > b[0] && pr.x < b[3] && pr.z > b[2] && pr.z < b[5] && pr.y > 2;
    const P = AF.world.props; for (let i = P.length - 1; i >= 0; i--) if (hit(P[i])) P.splice(i, 1);
    for (const a of AF.world.propsByRegion.values()) for (let i = a.length - 1; i >= 0; i--) if (hit(a[i])) a.splice(i, 1);
  };
  const kit = (x, trade, o = {}) => {
    if (!AF.shopKit) return null;
    const f = x.f, front = { W: 'x0', E: 'x1', N: 'z0', S: 'z1' }[f.face];
    try { dropLamps(x); } catch (e) { /* keep going */ }
    return AF.shopKit(f.box(x.u0 + 0.5, 0.5, 0.5, x.u1 - 0.5, x.SH, x.d - 0.5), trade, Object.assign({ front, id: x.s.id, door: f.w(x.du, -1.2) }, o));
  };

  // ================================================================= DINER BLOCK (th-diner: x 10..72, z 10..72)
  const buildDinerBlock = (TS) => {
    const C = TS.C;
    const fg = TS.frame(10, 10, 'W');    // Grand Ave: u = z - 10, v = x - 10
    const fm = TS.frame(72, 10, 'N');    // Meridian: u = 72 - x, v = z - 10
    const fs = TS.frame(10, 72, 'S');    // Bay St:   u = x - 10, v = 72 - z
    const fe = TS.frame(72, 72, 'E');    // Broad St: u = 72 - z, v = 72 - x
    TS.fillRow(fm, 18, 44, 14, 8101, 12, 20);
    TS.fillRow(fs, 18, 62, 14, 8102, 12, 22);
    TS.fillRow(fe, 16, 46, 12, 8103, 12, 18);
    // yard behind the diner: gravel lot with crates + a laundry line
    AF.W.paint(20, 26, 58, 56, C.gravel);
    for (let i = 0; i < 6; i++) fg.place(TS.props.crate(i), 30 + (i % 3) * 0.8, 0.25, 26 + Math.floor(i / 3) * 0.8, 0, -1, true);

    // ---- THE AUTOMAT (Grand × Meridian corner)
    TS.shop(fg, { id: 'automat', name: 'The Automat', blade: { text: 'EAT', fg: C.neonYellow, light: 0xffe070 }, u0: 0, w: 18, d: 18, h: 18, wall: C.cream, trim: C.gold, base: C.black, sign: { text: 'AUTOMAT', fg: C.neonYellow, bg: C.black, vs: 1 / 8 }, awning: null, floor: 'tile', left: true, noDefault: true, paper: C.marble, dado: C.marbleG,
      display: (a, b) => { for (let u = a + 0.4; u < b - 0.3; u += 0.8) fg.place(TS.pie(), u, 1.0, 0.9, 0, -1); },
      fit: (x) => {
        kit(x, 'cafe', { dress: true, floorType: 'terrazzo', ceiling: 'cove' });
        const f = x.f, d = x.d;
        // the wall of little glass doors (3 modules × 48 doors), lit from inside
        const wallM = TS.geo('automat-wall', () => {
          const m = M(80, 44, 5);
          m.box(0, 0, 0, 80, 44, 2, C.chrome); m.box(0, 0, 0, 80, 8, 5, C.marbleG); m.box(0, 40, 0, 80, 44, 5, C.gold);
          for (let c = 0; c < 10; c++) for (let r = 0; r < 5; r++) {
            const x0 = 1 + c * 8, y0 = 9 + r * 6;
            m.box(x0, y0, 1, x0 + 7, y0 + 5, 3, C.brass); m.box(x0 + 1, y0 + 1, 2, x0 + 6, y0 + 4, 3, C.glass);
            m.box(x0 + 1, y0 + 1, 1, x0 + 6, y0 + 2, 2, C.lamp); m.box(x0 + 2, y0 + 2, 1, x0 + 5, y0 + 3, 2, C.bright[(c * 5 + r * 3) % 12]);
            m.set(x0 + 6, y0 + 2, 3, C.chrome);
          }
          return m;
        }, 1 / 16, [0.5, 0, 0]);
        for (const u of [3.5, 9, 14.5]) f.place(wallM, u, 0.5, d - 0.5, 0, -1, true);
        f.light(9, 3, d - 2, 0xfff0d0, 1.4, 12);
        // coffee spigots (dolphin-head taps) on the side wall
        const spig = TS.geo('spigot', () => { const m = M(12, 16, 6); m.box(0, 0, 0, 12, 16, 2, C.marbleG); for (let x = 1; x < 12; x += 4) { m.box(x, 8, 2, x + 2, 11, 5, C.gold); m.set(x, 7, 4, C.gold); } m.box(0, 3, 2, 12, 4, 6, C.chrome); return m; }, 1 / 8, [0.5, 0, 0]);
        f.place(spig, 17.5, 1.0, 8, -1, 0); f.place(spig, 17.5, 1.0, 11, -1, 0);
        // nickel-thrower booth (a round marble-and-brass change booth near the door)
        f.fill(5.5, 0.5, 5, 8.0, 1.5, 7, C.marble); f.fill(5.5, 1.5, 5, 8.0, 1.75, 7, C.brass); f.fill(5.5, 1.75, 5, 5.75, 3.0, 7, C.glass); f.fill(5.5, 3.0, 5, 8.0, 3.25, 7, C.gold);
        f.place(TS.props.register(), 6.75, 1.75, 5.5, 0, -1);
        x.spot('work', 6.75, 6.4, 0, -1); x.spot('counter', 6.75, 4.2, 0, 1);
        // marble tables with chairs
        for (const [u, v] of [[3, 9], [3, 12.5], [9, 9.5], [9, 12.5], [13.5, 5.5], [13.5, 9], [13.5, 12.5]]) {
          f.place(TS.props.table(C.marble), u, 0.5, v, 0, -1, true);
          for (const s of [-1, 1]) { f.place(TS.props.chair(C.woodL), u + s * 0.85, 0.5, v, -s, 0); if ((u + v) % 2 < 1) x.spot('sit', u + s * 0.85, v, -s, 0, 1.0); }
        }
        x.spot('browse', 5, d - 1.6, 0, 1); x.spot('browse', 12, d - 1.6, 0, 1); x.spot('work', 16, d - 1.0, -1, 0);
      } });

    // ---- THE STARLITE DINER: a stainless streamliner standing free on Grand Ave (u 20..42, v 1.5..10)
    {
      const f = fg, a = 20, b = 42, v0 = 1.5, v1 = 10, top = 4.25;
      TS.gBlock = AF.col(0xd6e8ec, { pat: 'tile', rough: 0.15, emit: 0xfff0d0, emitK: 0.9, mode: 'night', jitter: 0.06, edge: 0.1 });
      TS.dGlass = AF.col(0x2e4556, { emit: 0xffe6c0, emitK: 1.3, mode: 'night', jitter: 0.05, edge: 0.05 });
      const inside = (u, v) => { const cu = Math.min(u - a, b - u), cv = Math.min(v - v0, v1 - v); return cu >= 0 && cv >= 0 && !(cu < 1.25 && cv < 1.25 && (1.25 - cu) + (1.25 - cv) > 1.5); };
      // body: fluted steel skirt, red stripes, window band, curved roof
      f.each(a, 0.25, v0, b, top, v1, (u, y, v) => {
        const uc = u + 0.125, vc = v + 0.125; if (!inside(uc, vc)) return null;
        const edge = !inside(uc - 0.25, vc) || !inside(uc + 0.25, vc) || !inside(uc, vc - 0.25) || !inside(uc, vc + 0.25);
        if (!edge) return y < 0.5 ? (((Math.floor(u * 2) + Math.floor(v * 2)) & 1) ? C.tileK : C.tileW) : 0;
        if (y < 0.5) return C.steel;
        if ((y >= 1.25 && y < 1.5) || (y >= 3.5 && y < 3.75)) return C.red;
        if (Math.min(uc - a, b - uc) < 1.6 && y >= 0.5 && y < 3.5) return (y >= 1.25 && y < 1.5) ? C.red : TS.gBlock;   // glass-block rounded ends
        if (y >= 1.75 && y < 3.25) return (Math.floor((u + v) * 4) % 6 === 0) ? C.chrome : TS.dGlass;
        return (Math.floor(y * 4) & 1) ? C.chrome : C.steel;
      });
      f.each(a, top, v0, b, top + 0.75, v1, (u, y, v) => { const uc = u + 0.125, vc = v + 0.125, k = (y - top) / 0.25 + 1; if (!inside(uc, vc)) return null; const cv = Math.min(vc - v0, v1 - vc), cu = Math.min(uc - a, b - uc); if (Math.min(cu, cv) < k * 0.5 - 0.25) return null; return k === 3 ? C.chrome : C.steel; });
      // door + vestibule (front, middle)
      const dm = 31;
      f.fill(dm - 1.5, 0.25, -0.5, dm + 1.5, 3.75, v0 + 0.25, C.steel); f.clear(dm - 1.0, 0.5, -0.5, dm + 1.0, 3.0, v0 + 0.25);
      f.fill(dm - 1.0, 0.25, -0.5, dm + 1.0, 0.5, v0 + 0.25, C.tileW); f.fill(dm - 1.5, 3.75, -0.75, dm + 1.5, 4.0, v0 + 0.25, C.red);
      f.fill(dm - 1.25, 3.0, -0.5, dm + 1.25, 3.5, -0.25, C.flickBlue);
      // roof sign: STARLITE (pink neon) with a star, DINER (blue) on a steel frame
      f.fill(24, top + 0.75, 5.5, 38, top + 1.0, 6.0, C.iron); for (const u of [24.5, 30.75, 37.25]) f.fill(u, top + 1.0, 6.0, u + 0.25, top + 3.5, 6.25, C.iron);
      f.fill(23.5, top + 1.0, 5.75, 38.5, top + 3.5, 6.0, C.navyD);
      f.place(TS.signFlick('STARLITE', C.neonPink, 4, C.flickPink, 1 / 7), 30.5, top + 2.55, 5.75, 0, -1);
      f.place(TS.sign('DINER', C.neonBlue, null, 1 / 12), 30.5, top + 1.5, 5.75, 0, -1);
      f.place(TS.geos.get('star') || TS.props.pendant(), 38.8, top + 2.6, 5.9, 0, -1);
      f.place(TS.sign('OPEN 24 HOURS', C.neonRed, null, 1 / 20), 24.5, 3.9, v0 - 0.05, 0, -1);
      // interior: counter along the back, 13 stools, back bar with pie case / coffee urn / grill, booths along the front windows
      f.fill(22, 0.5, 6.75, 40.5, 1.25, 7.5, C.steel); f.fill(21.75, 1.25, 6.5, 40.75, 1.5, 7.5, C.red);
      f.fill(22, 0.5, 9.0, 40.5, 1.25, v1 - 0.25, C.steel); f.fill(22, 1.25, 9.0, 40.5, 1.5, v1 - 0.25, C.marble);
      f.place(TS.pieCase(), 24.5, 1.5, 9.1, 0, 1); f.place(TS.pieCase(), 37.5, 1.5, 9.1, 0, 1);
      const urn = TS.geo('urn', () => { const m = M(8, 14, 8); m.box(1, 0, 1, 7, 2, 7, C.black); m.sphere(4, 7, 4, 3.4, C.chrome, (x, y) => (y >= 2 && y < 12 ? C.chrome : 0)); m.box(3, 12, 3, 5, 14, 5, C.brass); m.box(3, 4, 7, 5, 5, 8, C.brass); return m; }, 1 / 8, [0.5, 0, 0.5]);
      f.place(urn, 29, 1.5, 9.4, 0, -1); f.place(urn, 33, 1.5, 9.4, 0, -1);
      f.fill(26.5, 1.5, 9.25, 28.5, 1.75, v1 - 0.25, C.iron); f.fill(34.5, 1.5, 9.25, 36.5, 2.75, v1 - 0.25, C.steel);
      f.fill(22, 2.5, v1 - 0.5, 40.5, 3.25, v1 - 0.25, C.chrome);   // menu board strip
      f.place(TS.sign('PIE 10C  COFFEE 5C', C.black, C.cream, 1 / 24), 31, 2.9, v1 - 0.5, 0, -1);
      let stools = 0;
      for (let u = 22.5; u <= 40.0; u += 1.4) { f.place(TS.props.stool(), u, 0.5, 6.0, 0, 1); const p = f.w(u, 6.0); AF.addSpot({ building: 'starlite', x: p[0], y: 1.25, z: p[1], yaw: f.yaw(0, 1), kind: 'sit', path: [f.w(dm, -1.5), f.w(dm, 4.8), f.w(u, 4.8), p] }); stools++; }
      TS.dinerStools = stools;
      for (const [u, v, dv] of [[31.5, 8.3, -1], [26, 8.3, -1]]) { const p = f.w(u, v); AF.addSpot({ building: 'starlite', x: p[0], y: 0.5, z: p[1], yaw: f.yaw(0, dv), kind: 'work' }); }
      { const p = f.w(35.5, 8.4); AF.addSpot({ building: 'starlite', x: p[0], y: 0.5, z: p[1], yaw: f.yaw(0, 1), kind: 'work' }); }
      const booth = TS.geo('booth', () => { const m = M(20, 10, 8); m.box(0, 0, 0, 3, 3, 8, C.red); m.box(0, 3, 0, 1, 9, 8, C.red); m.box(17, 0, 0, 20, 3, 8, C.red); m.box(19, 3, 0, 20, 9, 8, C.red); m.box(9, 0, 3, 11, 5, 5, C.chrome); m.box(5, 5, 0, 15, 6, 8, C.marble); m.box(5, 6, 0, 15, 6, 8, 0); m.box(9, 6, 3, 10, 7, 4, C.chrome); m.box(10, 6, 5, 11, 7, 6, C.red); return m; }, 1 / 8, [0.5, 0, 0]);
      for (const u of [23.5, 27.0, 35.0, 38.5]) { f.place(booth, u, 0.5, v0 + 0.25, 0, 1, false); for (const s of [-1, 1]) { const p = f.w(u + s * 0.95, v0 + 0.75); AF.addSpot({ building: 'starlite', x: p[0], y: 0.9, z: p[1], yaw: f.yaw(-s, 0), kind: 'sit' }); } }
      for (const u of [24, 28, 32, 36, 40]) f.place(TS.props.globe(), u, top - 0.25, 5.25, 0, -1);
      // a glowing jukebox by the end booth + a cook at the flat-top (the steam stack above it is in dinerSteam)
      const juke = TS.geo('jukebox', () => { const m = M(9, 15, 6), wd = AF.col(0x6a3a1e, { rough: 0.35 }), bands = [0xff5030, 0xffb030, 0xfff070, 0x60e0ff].map((h) => AF.col(h, { emit: h, emitK: 2.0, mode: 'always', jitter: 0, edge: 0 }));
        m.box(0, 0, 0, 9, 10, 6, wd); m.sphere(4.5, 10, 3, 4.5, wd, (x, y, z) => (y >= 10 ? wd : 0));
        for (let y = 1; y < 14; y++) for (const x of [0, 8]) m.set(x, y, 5, bands[(y >> 1) % 4]); for (let x = 1; x < 8; x++) m.set(x, Math.round(10 + Math.sqrt(Math.max(0, 16 - (x - 4.5) ** 2))), 5, bands[x % 4]);
        m.box(2, 6, 5, 7, 10, 6, C.glass); m.box(3, 7, 4, 6, 8, 5, C.black); m.box(2, 1, 5, 7, 5, 6, C.chrome); for (let x = 2; x < 7; x += 2) m.box(x, 2, 5, x + 1, 4, 6, C.black); m.box(1, 10, 5, 8, 11, 6, C.gold); return m; }, 1 / 8, [0.5, 0, 0.5]);
      f.place(juke, 40.9, 0.5, 4.0, -1, 0, true); f.light(40.5, 1.2, 4.0, 0xffa050, 0.6, 4, 'interior');
      f.light(31, 3.2, 5.5, 0xfff0d8, 1.5, 14);
      f.light(31, 3.5, -2, 0xff70c8, 1.2, 12, 'sign');
      AF.addBuilding({ id: 'starlite', name: 'Starlite Diner', kind: 'diner', box: f.box(a, 0.25, -0.75, b, top + 4, v1), doors: [{ x: f.w(dm, -1.5)[0], y: 0.25, z: f.w(dm, -1.5)[1], yaw: f.yaw(0, 1) }], floors: [0.5], interior: true, owner: 'theatre-shops' });
      TS.diner = { f, dm, v0, v1 };
    }

    // ---- DRUGSTORE with a soda fountain (Grand × Bay corner)
    TS.shop(fg, { id: 'drugstore', name: "Kessler's Drugs", blade: { text: 'DRUGS', fg: C.neonGreen, light: 0x80ff90 }, u0: 44, w: 18, d: 18, h: 16, wall: C.brickY, trim: C.cream, sign: { text: "KESSLER'S DRUGS", fg: C.flickGreen, bg: C.navyD }, awning: [C.jade, C.white], floor: 'tile', right: true, fe: 'R', goods: 'bottles', goods2: 'bottles', counter: 'R', paper: C.paper[1], noDefault: true,
      display: (a, b) => { const jar = TS.geo('apjar', () => { const m = M(4, 8, 4); m.box(0, 0, 0, 4, 1, 4, C.brass); m.box(0, 1, 0, 4, 6, 4, C.glass); m.box(1, 1, 1, 3, 5, 3, C.bright[4]); m.box(1, 6, 1, 3, 8, 3, C.brass); return m; }, 1 / 8, [0.5, 0, 0.5]); for (let u = a + 0.4; u < b - 0.3; u += 0.8) fg.place(jar, u, 1.0, 0.9, 0, -1); },
      fit: (x) => {
        kit(x, 'drug', { counter: 'R', island: 'none' });
        const f = x.f; const u = 46.0;
        f.fill(u, 0.5, 4, u + 0.75, 1.25, 14, C.marble); f.fill(u - 0.25, 1.25, 4, u + 0.75, 1.5, 14, C.marbleG);
        f.fill(44.5, 0.5, 4, 44.75, 3.0, 14, C.chrome); f.fill(44.75, 1.5, 4.25, 45.0, 2.75, 13.75, C.glass);
        for (let v = 4.5; v < 14; v += 1.5) { f.fill(u + 0.25, 1.5, v, u + 0.5, 2.0, v + 0.25, C.chrome); f.set; }
        for (let v = 4.5; v < 14; v += 1.3) { f.place(TS.props.stool(), u + 1.35, 0.5, v, -1, 0); x.spot('sit', u + 1.35, v, -1, 0, 1.25); }
        x.spot('work', 45.4, 9, 1, 0);
        f.place(TS.sign('SODA FOUNTAIN', C.flickPink, null, 1 / 20), 44.6, 3.4, 9, 1, 0);
        try { drugFloor(TS, x); } catch (e) { console.error('[shops] drugFloor', e); }
      } });

    // ---- Meridian: tobacconist + barber (+ a newsstand kiosk on the corner)
    TS.shop(fm, { id: 'tobacconist', name: 'Meridian Tobacco & News', u0: 0, w: 10, d: 16, h: 16, wall: C.brickB, trim: C.cream, sign: { text: 'TOBACCO & NEWS', fg: C.neonOrange, bg: C.black }, awning: [C.redD, C.cream], goods: 'cans', goods2: 'books', floor: 'wood', left: true, fe: 'L', noDefault: true, fit: (x) => kit(x, 'tobacco') });
    {
      const kiosk = TS.geo('kiosk', () => { const m = M(20, 22, 12); m.box(0, 0, 0, 20, 8, 12, C.jade); m.box(0, 18, 0, 20, 22, 12, C.jade); m.box(0, 8, 0, 20, 18, 1, 0); for (let x = 1; x < 19; x += 3) for (let y = 9; y < 17; y += 4) m.box(x, y, 1, x + 2, y + 3, 2, C.bright[(x + y) % 12]); m.box(0, 8, 11, 20, 18, 12, C.jade); m.box(0, 8, 1, 1, 18, 12, C.jade); m.box(19, 8, 1, 20, 18, 12, C.jade); m.box(-1 < 0 ? 0 : 0, 21, -2 < 0 ? 0 : 0, 20, 22, 12, C.cream); for (let x = 2; x < 18; x += 2) m.box(x, 3, 0, x + 1, 7, 1, C.bright[x % 12]); return m; }, 1 / 8, [0.5, 0, 0]);
      fm.place(kiosk, 1.9, 0.25, -1.1, 0, -1, true);
      fm.place(TS.sign('NEWS', C.red, C.cream, 1 / 16), 1.9, 2.4, -2.65, 0, -1);
      const p = fm.w(1.9, -0.6); AF.addSpot({ building: 'tobacconist', x: p[0], y: 0.25, z: p[1], yaw: fm.yaw(0, -1), kind: 'work' });
    }
    TS.shop(fm, { id: 'barber', name: "Tony's Barber Shop", u0: 10, w: 8, d: 16, h: 14, wall: C.brickS, trim: C.white, sign: { text: "TONY'S BARBER", fg: C.red, bg: C.white }, awning: [C.red, C.white], floor: 'check', noDefault: true, paper: C.paper[3],
      fit: (x) => {
        kit(x, 'tailor', { dress: true, floor: false, ceiling: 'tin' });
        const f = x.f;
        const chair = TS.geo('barberchair', () => { const m = M(6, 10, 8); m.box(2, 0, 2, 4, 3, 5, C.chrome); m.box(0, 3, 1, 6, 5, 7, C.red); m.box(0, 5, 6, 6, 10, 7, C.red); m.box(0, 5, 1, 1, 6, 7, C.chrome); m.box(5, 5, 1, 6, 6, 7, C.chrome); m.box(1, 1, 0, 5, 2, 1, C.chrome); return m; }, 1 / 8, [0.5, 0, 0.5]);
        for (const v of [4, 7.5, 11]) {
          f.place(chair, 13.2, 0.5, v, 1, 0, true); x.spot('sit', 13.2, v, -1, 0, 1.15); x.spot('work', 14.4, v + 1.0, -1, 0);
          f.fill(10.5, 1.5, v - 1, 10.75, 3.25, v + 1, C.glass); f.fill(10.5, 1.25, v - 1.25, 11.0, 1.5, v + 1.25, C.marble);
        }
        for (const v of [4.5, 6, 7.5, 9]) { f.place(TS.props.chair(C.woodL), 17.3, 0.5, v, -1, 0); } x.spot('sit', 17.3, 6, -1, 0, 1.0);
        // tonic bottles + blue sterilizer jars on the marble shelf under each mirror, a hot-towel steamer, a hat tree by the door
        const tonics = TS.geo('barbertonics', () => { const m = M(14, 8, 3), cs = [0x2a8a5a, 0xc8a040, 0x8a2a3a, 0xe8e0d0, 0x3a6ab0].map((h) => AF.col(h, { rough: 0.2 })), blue = AF.col(0x3aa0e0, { glass: true });
          for (let i = 0; i < 5; i++) { const x = 1 + i * 2; m.box(x, 0, 1, x + 1, 4 + (i % 2), 2, cs[i]); m.set(x, 5 + (i % 2), 1, C.gold); } m.box(11, 0, 0, 14, 6, 3, blue); m.box(11, 6, 0, 14, 7, 3, C.chrome); m.box(12, 3, 1, 13, 7, 2, C.black); return m; }, 1 / 16, [0.5, 0, 0.5]);
        for (const v of [4, 7.5, 11]) f.place(tonics, 10.75, 1.5, v - 0.4, 1, 0);
        const steamer = TS.geo('towelsteamer', () => { const m = M(6, 14, 6); m.box(2, 0, 2, 4, 8, 4, C.chrome); m.box(1, 0, 1, 5, 1, 5, C.chrome); m.sphere(3, 11, 3, 2.8, C.chrome, (a, b) => (b >= 8 ? C.chrome : 0)); m.box(2, 13, 2, 4, 14, 4, C.red); return m; }, 1 / 8, [0.5, 0, 0.5]);
        f.place(steamer, 16.9, 0.5, 13.6, -1, 0, true);
        const hattree = TS.geo('hattree', () => { const m = M(8, 16, 8), fe = AF.col(0x5a5a62), br = AF.col(0x7a5a3a); m.box(3, 0, 3, 5, 15, 5, C.woodD); m.box(1, 0, 3, 7, 1, 5, C.woodD); m.box(3, 0, 1, 5, 1, 7, C.woodD);
          m.box(0, 13, 2, 4, 14, 6, fe); m.box(1, 14, 3, 3, 15, 5, fe); m.box(4, 11, 3, 8, 12, 7, br); m.box(5, 12, 4, 7, 13, 6, br); return m; }, 1 / 8, [0.5, 0, 0.5]);
        f.place(hattree, 17.2, 0.5, 2.0, -1, 0, true);
        f.place(TS.props.picture(9), 17.5, 2.4, 12.5, -1, 0);
        // spinning barber pole beside the door (dynamic)
        const pole = TS.geo('barberpole', () => { const m = M(6, 26, 6); m.box(1, 0, 1, 5, 2, 5, C.chrome); m.box(1, 24, 1, 5, 26, 5, C.chrome); m.sphere(3, 25, 3, 2.2, C.chrome); for (let y = 2; y < 24; y++) for (let a = 0; a < 16; a++) { const t = a / 16 * Math.PI * 2, xx = Math.round(3 + Math.cos(t) * 1.6 - 0.5), zz = Math.round(3 + Math.sin(t) * 1.6 - 0.5); const k = ((a + y) % 8); m.set(xx, y, zz, k < 3 ? C.red : k < 4 ? C.white : k < 7 ? C.navy : C.white); } m.box(2, 2, 2, 4, 24, 4, C.white); return m; }, 1 / 8, [0.5, 0, 0.5]);
        const p = f.w(15.5, -0.35); S.dynamic.push({ geo: pole, x: p[0], y: 1.0, z: p[1], spin: 3.0 });
        f.fill(15.25, 0.9, -0.5, 15.75, 1.0, 0, C.chrome); f.fill(15.25, 4.2, -0.5, 15.75, 4.3, 0, C.chrome);
      } });
  };
  // Kessler's sales floor (fg frame: u = z - 10, v = x - 10; room u 44.5..61.5, v 0.5..17.5): 3 gondola aisles, a penny scale,
  // a phone booth, a magazine rack, glowing red + green show globes in the window, a PRESCRIPTIONS sign, customers.
  const magRack = (TS) => { const C = TS.C; return TS.geo('magrack', () => { const m = M(10, 10, 4); m.box(0, 0, 0, 10, 1, 4, C.jade); m.box(0, 0, 0, 1, 10, 1, C.jade); m.box(9, 0, 0, 10, 10, 1, C.jade); for (let y = 1; y < 10; y += 3) for (let x = 1; x < 9; x += 2) m.box(x, y, 1 + (y % 2), x + 2, y + 3, 2 + (y % 2), C.bright[(x + y) % 12]); return m; }, 1 / 8, [0.5, 0, 0]); };
  const drugFloor = (TS, x) => {
    const C = TS.C, f = x.f, SK = AF.shopKit;
    if (SK && SK.gondola) for (const [u, i] of [[50.5, 0], [54.25, 1], [58, 2]]) for (const v of [6.0, 9.25]) { f.place(SK.gondola(['drug', 'candy', 'grocery'][i], i + v), u, 0.5, v, 1, 0, true); }
    for (const [u, v, lu] of [[52.3, 7.5, -1], [56.1, 10, 1], [49.0, 8.5, 1], [59.6, 6.5, -1]]) x.spot('browse', u, v, lu, 0);
    const scale = TS.geo('pennyscale', () => { const m = M(8, 18, 7), en = AF.col(0xc8302e, { rough: 0.3 }), dl = AF.col(0xfff4d8, { emit: 0xffe0a0, emitK: 1.3, mode: 'always', jitter: 0, edge: 0 });
      m.box(0, 0, 0, 8, 1, 7, C.black); m.box(1, 1, 1, 7, 2, 6, C.chrome); m.box(2, 2, 2, 6, 11, 5, en); m.box(3, 4, 5, 5, 9, 6, C.cream);
      m.sphere(4, 14, 3.5, 3.6, en, (a, b, c) => (c >= 1 && c <= 5 ? en : 0)); m.sphere(4, 14, 5.2, 2.6, dl, (a, b, c) => (c === 5 ? dl : 0)); m.line(4, 14, 6, 5, 16, 6, C.black); m.box(3, 17, 3, 5, 18, 4, C.gold); m.set(4, 11, 5, C.gold); return m; }, 1 / 8, [0.5, 0, 0.5]);
    f.place(scale, 48.5, 0.5, 2.0, 0, -1, true); f.place(TS.sign('WEIGHT 1C', C.red, C.cream, 1 / 40), 48.5, 1.3, 1.52, 0, -1); x.spot('stand', 48.5, 2.9, 0, -1);
    const booth = TS.geo('phonebooth', () => { const m = M(9, 21, 9), oak = AF.col(0x7a4a26, { rough: 0.45 }), lt = AF.col(0xfff0c8, { emit: 0xffd9a0, emitK: 1.4, mode: 'always', jitter: 0, edge: 0 });
      m.box(0, 0, 0, 9, 1, 9, oak); m.box(0, 0, 0, 1, 20, 9, oak); m.box(8, 0, 0, 9, 20, 9, oak); m.box(0, 0, 0, 9, 20, 1, oak); m.box(0, 19, 0, 9, 21, 9, oak);
      m.box(1, 1, 8, 8, 19, 9, oak); m.box(2, 6, 8, 7, 17, 9, C.glass); m.box(2, 12, 1, 7, 15, 2, C.black); m.box(4, 13, 2, 5, 14, 3, C.chrome); m.box(3, 17, 3, 6, 18, 6, lt); m.box(1, 5, 2, 8, 6, 7, oak); m.box(6, 9, 8, 7, 10, 9, C.brass); return m; }, 1 / 8, [0.5, 0, 0.5]);
    f.place(booth, 60.3, 0.5, 13.3, -1, 0, true); f.place(TS.sign('TELEPHONE', C.gold, C.navyD, 1 / 48), 59.72, 2.85, 13.3, -1, 0);
    f.place(magRack(TS), 56.6, 0.5, 1.45, 0, 1, true); f.place(magRack(TS), 58.0, 0.5, 1.45, 0, 1, true); x.spot('browse', 57.3, 2.5, 0, -1);
    const globe = (hex, emit, key) => TS.geo('showglobe-' + key, () => { const m = M(7, 12, 7), g = AF.col(hex, { emit, emitK: 2.2, mode: 'always', jitter: 0, edge: 0 });
      m.box(3, 10, 3, 4, 12, 4, C.brass); m.box(2, 9, 2, 5, 10, 5, C.brass); m.box(3, 8, 3, 4, 9, 4, g); m.sphere(3.5, 4.5, 3.5, 3.4, g); m.box(2, 0, 2, 5, 1, 5, C.brass); return m; }, 1 / 8, [0.5, 1, 0.5]);
    f.place(globe(0xe0303a, 0xff2838, 'r'), 46.2, 3.25, 0.95, 0, -1); f.place(globe(0x30c060, 0x30ff70, 'g'), 60.0, 3.25, 0.95, 0, -1);
    f.light(46.2, 2.2, 1.0, 0xff4050, 0.7, 5, 'shop'); f.light(60.0, 2.2, 1.0, 0x50ff80, 0.7, 5, 'shop');
    f.place(TS.sign('PRESCRIPTIONS', C.gold, C.navyD, 1 / 20), 53.0, 3.7, 15.2, 0, -1);
    f.light(54.25, 3.8, 8, 0xfff0d8, 1.0, 11);
  };
  const pieDefs = (TS) => {
    const C = TS.C;
    TS.pie = () => TS.geo('pie', () => { const m = M(6, 4, 6); m.box(0, 0, 0, 6, 1, 6, C.chrome); m.sphere(3, 1, 3, 2.8, AF.col(0xd09a4a), (x, y) => (y === 1 || y === 2 ? (y === 2 ? AF.col(0xe0b060) : AF.col(0xc0842a)) : 0)); m.set(3, 2, 3, C.red); return m; }, 1 / 8, [0.5, 0, 0.5]);
    TS.pieCase = () => TS.geo('piecase', () => { const m = M(14, 14, 8); m.box(0, 0, 0, 14, 1, 8, C.chrome); m.box(0, 13, 0, 14, 14, 8, C.chrome); m.box(0, 1, 0, 1, 13, 8, C.chrome); m.box(13, 1, 0, 14, 13, 8, C.chrome); m.box(1, 1, 7, 13, 13, 8, C.glass); m.box(1, 1, 0, 13, 13, 1, C.glass); for (const y of [1, 5, 9]) { m.box(1, y, 1, 13, y + 1, 7, C.glass); for (let x = 2; x < 12; x += 4) { m.box(x, y + 1, 2, x + 3, y + 2, 6, AF.col(0xe0b060)); m.set(x + 1, y + 2, 3, [C.red, AF.col(0x5a2a6a), C.bright[2]][(x + y) % 3]); } } m.box(1, 12, 1, 13, 13, 7, C.lamp); return m; }, 1 / 8, [0.5, 0, 0.5]);
  };

  // ================================================================= GRAND AVE SHOP ROW (th-shops: x -72..-10, z 10..72) + ROSELAND
  const buildShopRow = (TS) => {
    const C = TS.C;
    const fk = TS.frame(-10, 72, 'E');   // Grand Ave: u = 72 - z (0 at Bay St), v = -10 - x
    TS.fillRow(TS.frame(-10, 10, 'N'), 16, 62, 14, 8201, 12, 22);   // Meridian (u = -10 - x)
    TS.fillRow(TS.frame(-72, 72, 'S'), 0, 46, 14, 8202, 12, 18);    // Bay (u = x + 72)
    TS.fillRow(TS.frame(-72, 10, 'W'), 14, 48, 12, 8203, 10, 16);   // Library St (u = z - 10)
    TS.shop(fk, { id: 'bakery', name: 'Golden Crust Bakery', blade: { text: 'BREAD', fg: C.neonOrange, light: 0xffb060 }, u0: 0, w: 9, d: 16, h: 13, wall: C.brickR, trim: C.cream, sign: { text: 'GOLDEN CRUST', fg: C.gold, bg: C.redD }, awning: [C.red, C.cream], goods: 'bread', goods2: 'bread', floor: 'check', left: true, fe: 'L', chimney: true, counter: 'R', paper: C.paper[4],
      display: (a, b) => { const loaf = TS.geo('loafs', () => { const m = M(6, 4, 6), r = AF.rng(5); for (let i = 0; i < 5; i++) { const x = Math.floor(r() * 4), z = Math.floor(r() * 4); m.box(x, 0, z, x + 2, 1 + (i % 2), z + 2, [AF.col(0xc8883a), AF.col(0xa8662a), AF.col(0xe0b070)][i % 3]); } return m; }, 1 / 8, [0.5, 0, 0.5]); for (let u = a + 0.4; u < b - 0.3; u += 0.7) fk.place(loaf, u, 1.0, 0.9, 0, -1); },
      noDefault: true, fit: (x) => { kit(x, 'bakery'); x.f.fill(0.75, 0.5, 13.75, 2.75, 2.25, 15.25, C.brickB); x.f.fill(1.25, 0.75, 13.65, 2.25, 1.5, 13.75, C.lampR); } });
    TS.shop(fk, { id: 'records', name: 'Hi-Fi Records & Radio', blade: { text: 'RADIO', fg: C.neonBlue, light: 0x70b0ff }, u0: 9, w: 8, d: 16, h: 15, wall: C.brickB, trim: C.lime, sign: { text: 'RECORDS RADIO', fg: C.neonBlue, bg: C.black }, awning: [C.navy, C.gold], goods: 'records', goods2: 'records', floor: 'wood',
      display: (a, b) => { const radio = TS.geo('radio', () => { const m = M(6, 8, 4); m.box(0, 0, 0, 6, 8, 4, C.woodD); m.sphere(3, 5, 4, 2.5, C.wood, (xx, y, z) => (z >= 3 ? C.woodL : 0)); m.box(1, 1, 3, 5, 3, 4, C.gold); m.set(2, 2, 4, C.black); m.set(4, 2, 4, C.black); return m; }, 1 / 8, [0.5, 0, 0.5]); for (let u = a + 0.5; u < b - 0.3; u += 0.9) fk.place(radio, u, 1.0, 0.9, 0, -1); },
      noDefault: true, fit: (x) => kit(x, 'records') });
    // ROSELAND: entrance hall + stair on the ground floor, the dance hall upstairs (y 5.0 .. 11.75) with a turning mirror ball
    TS.shop(fk, { id: 'roseland', name: 'Rosewood Ballroom', u0: 17, w: 16, d: 24, h: 20, wall: C.cream, trim: C.gold, base: C.black, sign: { text: 'ROSEWOOD', fg: C.neonPink, bg: C.black, vs: 1 / 9 }, awning: null, floor: 'check', noDefault: true, paper: C.paper[2], dado: C.redD,
      fit: (x) => {
        const f = x.f, u0 = 17, u1 = 33, d = 24, SH = x.SH, HF = SH + 0.25, HT = SH + 7;
        // upstairs hall volume, floor, walls
        f.clear(u0 + 0.5, HF, 0.5, u1 - 0.5, HT, d - 0.5);
        f.each(u0 + 0.5, SH, 0.5, u1 - 0.5, HF, d - 0.5, (u, y, v) => ((Math.floor(u * 2) + Math.floor(v * 2)) & 1 ? C.woodL : C.wood));
        f.fill(u0 + 0.25, HF, 0.5, u0 + 0.5, HT, d - 0.25, C.paper[2]); f.fill(u1 - 0.5, HF, 0.5, u1 - 0.25, HT, d - 0.25, C.paper[2]); f.fill(u0 + 0.25, HF, d - 0.5, u1 - 0.25, HT, d - 0.25, C.paper[2]);
        f.fill(u0 + 0.25, HF, 0.5, u1 - 0.25, HT, 0.75, C.paper[2]);
        f.each(u0 + 0.5, HT - 0.25, 0.5, u1 - 0.5, HT, d - 0.5, (u, y, v) => (TS.hash(u * 4, v * 4, 5) < 0.045 ? (TS.hash(u * 4, v * 4, 11) < 0.5 ? C.starA : C.starB) : C.navyD));   // starry ceiling
        { const moon = AF.col(0xfff4c8, { emit: 0xffe8a0, emitK: 1.8, mode: 'always', jitter: 0, edge: 0 }), mu = u0 + 5, mv = d - 7;
          for (let a = -1.5; a <= 1.5; a += 0.25) for (let b = -1.5; b <= 1.5; b += 0.25) if (a * a + b * b <= 2.1 && (a - 0.6) ** 2 + (b - 0.35) ** 2 > 1.3) f.fill(mu + a, HT - 0.5, mv + b, mu + a + 0.25, HT - 0.25, mv + b + 0.25, moon); }
        for (let v = 2; v < d - 1; v += 3) for (const u of [u0 + 0.5, u1 - 0.75]) f.fill(u, HF, v, u + 0.25, HT, v + 0.5, C.gold);
        // stair along the left wall: 18 steps of 0.25 along +v from v 4 (y 0.75) to v 8.5 (y 5.0), hole in the slab above
        f.clear(u0 + 0.5, SH, 3.5, u0 + 2.5, HF, 8.75);
        for (let k = 1; k <= 18; k++) f.fill(u0 + 0.5, 0.5, 3.75 + k * 0.25, u0 + 2.5, 0.5 + k * 0.25, 4.0 + k * 0.25, k % 2 ? C.carpet : C.redD);
        f.fill(u0 + 2.5, SH, 3.5, u0 + 2.75, SH + 1.25, 8.5, C.gold);   // railing around the hole
        // ground floor: box office, posters, palms
        f.fill(u1 - 5, 0.5, 5, u1 - 1, 1.25, 6, C.redD); f.fill(u1 - 5, 1.25, 5, u1 - 1, 1.5, 6, C.gold); x.spot('work', u1 - 3, 6.8, 0, -1); x.spot('counter', u1 - 3, 4.2, 0, 1);
        for (let i = 0; i < 4; i++) f.place(TS.props.poster(i + 40), u0 + 4 + i * 2.5, 2.2, d - 0.5, 0, -1);
        f.place(TS.props.plant(), u1 - 1.2, 0.5, 1.5, 0, -1, true); f.place(TS.props.plant(), u0 + 3.2, 0.5, 1.5, 0, -1, true);
        f.light((u0 + u1) / 2, 3.5, 6, 0xffd8a0, 1.0, 10);
        // bandstand at the back, tables along the right wall, dance floor in the middle
        f.fill(u0 + 3, HF, d - 4.5, u1 - 1, HF + 0.75, d - 0.5, C.woodD); f.fill(u0 + 3, HF + 0.5, d - 4.5, u1 - 1, HF + 0.75, d - 4.25, C.gold);
        f.each(u0 + 3, HF + 0.75, d - 0.75, u1 - 1, HT - 0.5, d - 0.5, (u, y) => (Math.hypot(u - (u0 + u1) / 2 - 1, y - HF) < 5.5 && Math.hypot(u - (u0 + u1) / 2 - 1, y - HF) > 5.0 ? C.neonPink : null));
        for (let i = 0; i < 5; i++) { const p = f.w(u0 + 5 + i * 2.2, d - 2.5); AF.addSpot({ building: 'roseland', x: p[0], y: HF + 0.75, z: p[1], yaw: f.yaw(0, -1), kind: 'work' }); }
        for (const v of [4, 7.5, 11, 14.5]) { f.place(TS.props.table(C.white), u1 - 2, HF, v, 0, -1, true); f.place(TS.props.tlamp(C.lampR), u1 - 2, HF + 0.75, v, 0, -1); for (const s of [-1, 1]) { f.place(TS.props.chair(C.red), u1 - 2 + s * 0.8, HF, v, -s, 0); const p = f.w(u1 - 2 + s * 0.8, v); AF.addSpot({ building: 'roseland', x: p[0], y: HF + 0.5, z: p[1], yaw: f.yaw(-s, 0), kind: 'sit' }); } }
        for (let i = 0; i < 3; i++) f.place(TS.props.globe(), u0 + 4 + i * 4, HT - 0.25, 4, 0, -1);
        // the band on the bandstand: music stands with ROSELAND fronts, drums, bass, piano, a crooner's mike
        const mstand = TS.geo('musicstand', () => { const m = M(6, 8, 2); m.box(0, 0, 0, 6, 6, 2, C.redD); m.box(0, 5, 0, 6, 6, 2, C.gold); m.box(1, 2, 1, 5, 4, 2, C.gold); m.box(2, 6, 0, 4, 8, 1, C.white); return m; }, 1 / 8, [0.5, 0, 0.5]);
        for (let i = 0; i < 5; i++) f.place(mstand, u0 + 5 + i * 2.2, HF + 0.75, d - 3.3, 0, -1);
        f.place(TS.geos.get('drums') || mstand, u1 - 3, HF + 0.75, d - 1.6, 0, -1, true);
        const bass = TS.geo('bass', () => { const m = M(6, 16, 3); m.sphere(3, 4, 1, 2.9, C.wood); m.box(2, 7, 0, 4, 9, 2, C.wood); m.box(2, 9, 0, 3, 16, 1, C.woodD); return m; }, 1 / 8, [0.5, 0, 0.5]);
        f.place(bass, u0 + 4, HF + 0.75, d - 1.4, 0, -1);
        f.place(TS.geos.get('grand') || mstand, u0 + 7, HF + 0.75, d - 1.6, 1, 0, true);
        f.fill(26.4, HF + 0.75, d - 4.75, 26.6, HF + 2.4, d - 4.55, C.chrome); f.fill(26.3, HF + 2.3, d - 4.8, 26.7, HF + 2.6, d - 4.5, C.chrome);
        // bar along the front wall + stools, potted palms in the corners, tables round the left edge too
        f.fill(u0 + 4, HF, 1.0, u1 - 3, HF + 1.0, 1.75, C.woodD); f.fill(u0 + 4, HF + 1.0, 1.0, u1 - 3, HF + 1.25, 1.75, C.brass);
        for (let u = u0 + 4.6; u < u1 - 3; u += 1.2) { f.place(TS.props.stool(), u, HF, 2.35, 0, -1); const p = f.w(u, 2.35); AF.addSpot({ building: 'roseland', x: p[0], y: HF + 0.75, z: p[1], yaw: f.yaw(0, -1), kind: 'sit' }); }
        { const p = f.w(u0 + 8, 0.95 + 0.0); f.fill(u0 + 4, HF + 1.25, 0.75, u1 - 3, HF + 1.5, 1.0, C.woodD); for (let u = u0 + 4.5; u < u1 - 3.5; u += 0.5) f.fill(u, HF + 1.5, 0.75, u + 0.25, HF + 2.25, 1.0, [C.jade, C.glass, C.red, C.gold][Math.floor(u * 2) % 4]); }
        const palm = TS.geo('palm', () => { const m = M(14, 28, 14); m.box(5, 0, 5, 9, 4, 9, C.brass); m.box(6, 4, 6, 8, 18, 8, C.wood); for (let k = 0; k < 6; k++) { const t = k / 6 * Math.PI * 2; for (let r = 0; r < 7; r++) m.set(Math.round(7 + Math.cos(t) * r), 18 + Math.round(r * 0.8 - r * r * 0.12), Math.round(7 + Math.sin(t) * r), C.leaf); } return m; }, 1 / 8, [0.5, 0, 0.5]);
        for (const [pu, pv] of [[u0 + 1.3, d - 1.3], [u1 - 1.3, d - 5.5], [u0 + 1.3, 20.5], [u1 - 1.3, 1.5]]) f.place(palm, pu, HF, pv, 0, -1, true);
        for (const v of [11.5, 14.5, 17.5]) { f.place(TS.props.table(C.white), u0 + 3.8, HF, v, 0, -1, true); f.place(TS.props.tlamp(C.lampR), u0 + 3.8, HF + 0.75, v, 0, -1); for (const sgn of [-1, 1]) { f.place(TS.props.chair(C.red), u0 + 3.8, HF, v + sgn * 0.8, 0, -sgn); const p = f.w(u0 + 3.8, v + sgn * 0.8); AF.addSpot({ building: 'roseland', x: p[0], y: HF + 0.5, z: p[1], yaw: f.yaw(0, -sgn), kind: 'sit' }); } }
        // dancing couples (pairs of stand spots facing each other)
        for (const [cu, cv] of [[22.5, 8], [25.5, 10.5], [28, 8.5], [23.5, 13], [27, 14], [25, 17]]) for (const sgn of [-1, 1]) { const p = f.w(cu + sgn * 0.3, cv); AF.addSpot({ building: 'roseland', x: p[0], y: HF, z: p[1], yaw: f.yaw(-sgn, 0), kind: 'stand' }); }
        f.light(u0 + 6, HF + 3, d - 3, 0xffa0d0, 1.2, 10);
        f.light((u0 + u1) / 2, HF + 4, d / 2, 0xff90c0, 1.4, 16);
        // mirror ball (dynamic) + its light flecks
        const ball = TS.geo('mirrorball', () => { const m = M(12, 16, 12); m.box(5, 11, 5, 7, 16, 7, C.iron); m.sphere(6, 6, 6, 5.5, C.chrome, (xx, y, z) => (((xx + y + z) & 1) ? C.chrome : C.neonWhite)); return m; }, 1 / 12, [0.5, 1, 0.5]);
        const bc = f.w((u0 + u1) / 2, 11); const box = f.box(u0 + 0.5, HF, 0.75, u1 - 0.5, HT - 0.25, d - 0.5);
        S.dynamic.push({ geo: ball, x: bc[0], y: HT - 0.25, z: bc[1], spin: 0.8, flecks: { c: [bc[0], HT - 1.2, bc[1]], box } });
        // outside: vertical ROSELAND blade + DANCING sign over the door
        f.fill(u1 - 1.25, 5.5, -2.5, u1 - 0.5, 5.75, 0, C.iron);
        f.place(TS.blade('ROSEWOOD', C.neonPink, C.black, 'rosewood'), u1 - 0.875, 5.75, -0.25, -1, 0);
        f.place(TS.signFlick('DANCING NIGHTLY', C.neonYellow, 2, C.flickRed, 1 / 16), 25, 3.45, -0.06, 0, -1);
        TS.roseland = { f, u0, HF, d };
      } });
    TS.shop(fk, { id: 'bookshop', name: 'Lantern Books', blade: { text: 'BOOKS', fg: C.neonTeal, light: 0x70ffe0 }, u0: 33, w: 9, d: 16, h: 16, wall: C.brickS, trim: C.cream, sign: { text: 'LANTERN BOOKS', fg: C.cream, bg: C.jade }, awning: [C.jade, C.cream], goods: 'books', goods2: 'books', floor: 'wood', paper: C.paper[0],
      display: (a, b) => { for (let u = a + 0.3; u < b - 0.3; u += 0.8) fk.place(TS.goods('books', 1), u, 1.0, 1.1, 0, -1); },
      noDefault: true, fit: (x) => kit(x, 'books') });
    TS.shop(fk, { id: 'camera', name: 'Bright Lens Camera', blade: { text: 'FOTO', fg: C.neonRed, light: 0xff6050 }, u0: 42, w: 8, d: 16, h: 14, wall: C.buff, trim: C.white, sign: { text: 'CAMERAS', fg: C.neonTeal, bg: C.black }, awning: [C.black, C.gold], goods: 'mixed', floor: 'tile', counter: 'R', noDefault: true, fit: (x) => kit(x, 'camera'),
      display: (a, b) => { const cam = TS.geo('camera', () => { const m = M(5, 4, 3); m.box(0, 0, 0, 5, 3, 3, C.black); m.box(2, 1, 3, 4, 2, 3, C.steel); m.sphere(2.5, 1.5, 3, 1.2, C.steel, (x, y, z) => (z >= 3 ? C.glass : 0)); m.box(0, 3, 1, 2, 4, 2, C.chrome); return m; }, 1 / 12, [0.5, 0, 0.5]); for (let u = a + 0.3; u < b - 0.2; u += 0.5) fk.place(cam, u, 1.0, 0.9, 0, -1); } });
    TS.shop(fk, { id: 'fivedime', name: 'Birch & Bell 5-10-15¢', blade: { text: '5-10-15', fg: C.neonYellow, light: 0xffe070 }, u0: 50, w: 12, d: 16, h: 18, wall: C.brickR, trim: C.gold, sign: { text: 'BIRCH & BELL 5-10-15', fg: C.gold, bg: AF.col(0x2e7d6a, { jitter: 0.15 }) }, signBg: AF.col(0x2e7d6a, { jitter: 0.15 }), awning: [AF.col(0x2e7d6a, { jitter: 0.2 }), C.cream], goods: 'mixed', goods2: 'cans', floor: 'check', right: true, fe: 'R', noDefault: true, fit: (x) => kit(x, 'toys', { island: 'toytable' }) });
    // shoeshine stand on the sidewalk in front of the bookshop
    const shine = TS.geo('shoeshine', () => { const m = M(10, 16, 8); m.box(0, 0, 0, 10, 4, 8, C.woodD); m.box(1, 4, 1, 9, 7, 7, C.red); m.box(1, 7, 6, 9, 14, 7, C.red); m.box(0, 7, 1, 1, 10, 7, C.brass); m.box(9, 7, 1, 10, 10, 7, C.brass); m.box(2, 2, 0, 3, 5, -1 < 0 ? 1 : 1, C.brass); m.box(7, 2, 0, 8, 5, 1, C.brass); m.box(0, 14, 0, 10, 16, 8, C.jade); return m; }, 1 / 8, [0.5, 0, 0.5]);
    fk.place(shine, 36, 0.25, -1.4, 0, -1, true);
    { const p = fk.w(36, -1.3); AF.addSpot({ building: 'bookshop', x: p[0], y: 1.1, z: p[1], yaw: fk.yaw(0, -1), kind: 'sit' }); const q = fk.w(36, -2.4); AF.addSpot({ building: 'bookshop', x: q[0], y: 0.25, z: q[1], yaw: fk.yaw(0, 1), kind: 'work' }); }
    fk.place(TS.sign('SHINE 5C', C.red, C.cream, 1 / 24), 36, 2.15, -1.35, 0, -1);
  };

  // ================================================================= WATERFRONT ROW (sh-bay: x 88..147, z 88..147)
  const buildBayRow = (TS) => {
    const C = TS.C;
    const fh = TS.frame(88, 147, 'S');   // Harbour Blvd: u = x - 88, v = 147 - z
    TS.fillRow(TS.frame(88, 88, 'W'), 0, 43, 14, 8301, 12, 20);     // Broad St (u = z - 88)
    TS.fillRow(TS.frame(147, 88, 'N'), 0, 45, 14, 8302, 12, 22);    // Bay St   (u = 147 - x)
    TS.fillRow(TS.frame(147, 147, 'E'), 16, 45, 12, 8303, 12, 18);  // Terminal Ave (u = 147 - z)
    TS.shop(fh, { id: 'chandlery', name: 'Hale & Sons Ship Chandlery', u0: 0, w: 10, d: 16, h: 14, wall: C.brickD, trim: C.cream, sign: { text: 'SHIP CHANDLERY', fg: C.cream, bg: C.navy }, awning: [C.navy, C.white], goods: 'tools', goods2: 'cans', floor: 'wood', left: true, fe: 'L',
      display: (a, b) => { const lan = TS.geo('lantern', () => { const m = M(4, 7, 4); m.box(0, 0, 0, 4, 1, 4, C.brass); m.box(0, 1, 0, 4, 5, 4, C.glass); m.box(1, 1, 1, 3, 4, 3, C.lampN); m.box(0, 5, 0, 4, 6, 4, C.brass); m.set(2, 6, 2, C.brass); return m; }, 1 / 8, [0.5, 0, 0.5]); const rope = TS.geo('rope', () => { const m = M(8, 3, 8); m.sphere(4, 1, 4, 3.8, AF.col(0xc8a870), (x, y, z) => (Math.hypot(x - 3.5, z - 3.5) > 1.5 ? AF.col(0xc8a870) : 0)); return m; }, 1 / 8, [0.5, 0, 0.5]); for (let u = a + 0.5; u < b - 0.3; u += 1.0) { fh.place(u % 2 < 1 ? lan : rope, u, 1.0, 0.9, 0, -1); } },
      noDefault: true, fit: (x) => { kit(x, 'chandlery'); const anchor = TS.geo('anchor', () => { const m = M(10, 14, 2); m.box(4, 2, 0, 6, 13, 2, C.iron); m.box(2, 11, 0, 8, 12, 2, C.iron); m.line(0, 4, 0, 5, 0, 0, C.iron); m.line(9, 4, 0, 5, 0, 0, C.iron); m.box(4, 12, 0, 6, 14, 2, C.brass); return m; }, 1 / 8, [0.5, 0, 0]); fh.place(anchor, 5, 5.0, -0.05, 0, -1);
        // a ship's figurehead (a gilded-haired lady in blue) leaning out over the door from the corner pier
        const fig = TS.geo('figurehead', () => { const m = M(8, 20, 10), bl = AF.col(0x2a5aa8, { rough: 0.4 }), sk = AF.col(0xf0d8c0, { rough: 0.4 }), gh = AF.col(0xf2c65a, { metal: 0.8, rough: 0.3 });
          m.box(2, 0, 0, 6, 4, 3, C.woodD); for (let y = 2; y < 13; y++) { const z = 1 + Math.floor(y * 0.45), w = y < 8 ? 3 : 2; m.box(4 - w, y, z, 4 + w, y + 1, z + 3, bl); }
          m.box(2, 13, 6, 6, 17, 9, sk); m.box(2, 16, 5, 6, 19, 8, gh); m.box(3, 12, 5, 5, 16, 6, gh); m.set(3, 15, 9, C.black); m.set(4, 15, 9, C.black); m.box(1, 9, 5, 2, 12, 8, sk); m.box(6, 9, 5, 7, 12, 8, sk); return m; }, 1 / 8, [0.5, 0, 0]);
        fh.place(fig, 0.6, 3.6, -0.2, 0, -1); } });
    TS.shop(fh, { id: 'neptune', name: "Neptune's Table", u0: 10, w: 14, d: 18, h: 16, wall: C.teal, trim: C.cream, base: C.navyD, sign: { text: "NEPTUNE'S TABLE", fg: C.neonTeal, bg: C.navyD }, awning: [C.teal, C.white], floor: 'tile', noDefault: true, paper: C.paper[1], dado: C.navy,
      display: (a, b) => { const ice = TS.geo('icebed', () => { const m = M(8, 3, 6); m.box(0, 0, 0, 8, 1, 6, C.white); for (let x = 0; x < 8; x += 2) for (let z = 0; z < 6; z += 2) m.box(x, 1, z, x + 2, 2, z + 1, (x + z) % 4 ? AF.col(0x9aa8b0) : AF.col(0xd07a5a)); return m; }, 1 / 8, [0.5, 0, 0.5]); for (let u = a + 0.5; u < b - 0.4; u += 1.0) fh.place(ice, u, 1.0, 0.9, 0, -1); },
      fit: (x) => {
        kit(x, 'deli', { dress: true, floorType: 'hex', ceiling: 'beams' });
        const f = x.f;
        f.fill(11.5, 0.5, 4, 12.25, 1.25, 15, C.marble); f.fill(11.25, 1.25, 4, 12.25, 1.5, 15, C.marbleG);
        for (let v = 4.5; v < 15; v += 1.3) { f.place(TS.props.stool(), 12.9, 0.5, v, -1, 0); x.spot('sit', 12.9, v, -1, 0, 1.25); }
        x.spot('work', 11.0, 9, 1, 0); x.spot('work', 20, 16.4, 0, -1);
        for (const [u, v] of [[16, 5], [20, 5], [16, 9], [20, 9], [16, 13], [20, 13]]) { f.place(TS.props.table(C.white), u, 0.5, v, 0, -1, true); for (const s of [-1, 1]) { f.place(TS.props.chair(C.navy), u + s * 0.8, 0.5, v, -s, 0); x.spot('sit', u + s * 0.8, v, -s, 0, 1.0); } }
        const tank = TS.geo('fishtank', () => { const m = M(20, 12, 6); m.box(0, 0, 0, 20, 2, 6, C.woodD); m.box(0, 2, 0, 20, 11, 6, AF.col(0x5ab0d0, { glass: true, emit: 0x4ab0ff, emitK: 0.6, mode: 'always', jitter: 0, edge: 0 })); m.box(0, 11, 0, 20, 12, 6, C.woodD); for (let i = 0; i < 6; i++) m.box(2 + i * 3, 4 + (i % 3) * 2, 2, 4 + i * 3, 5 + (i % 3) * 2, 3, i % 2 ? C.bright[4] : C.bright[2]); return m; }, 1 / 8, [0.5, 0, 0]);
        f.place(tank, 18, 0.5, 17.5, 0, -1, true);
        f.place(TS.props.picture(12), 23.5, 2.5, 8, -1, 0); f.place(TS.props.picture(13), 23.5, 2.5, 13, -1, 0);
        f.light(18, 3.5, 12, 0x9fe0ff, 0.8, 10);
      } });
    TS.shop(fh, { id: 'pawn', name: 'Goldberg Loans', u0: 24, w: 8, d: 16, h: 13, wall: C.brickB, trim: C.buff, sign: { text: 'LOANS', fg: C.neonYellow, bg: C.black }, awning: [C.black, C.gold], goods: 'mixed', goods2: 'tools', floor: 'wood', counter: 'R',
      display: (a, b) => { for (let u = a + 0.45; u < b - 0.3; u += 0.8) fh.place(AF.shopKit.display('pawn', Math.floor(u * 3)), u, 1.0, 0.9, 0, -1);
        const parrot = TS.geo('parrot', () => { const m = M(6, 14, 4), gr = AF.col(0x2aa048), rd = AF.col(0xd83a2a), yl = AF.col(0xf0c030); m.box(2, 0, 1, 4, 1, 3, C.woodD); m.box(2, 1, 1, 3, 8, 2, C.brass); m.box(0, 8, 1, 6, 9, 2, C.brass); m.box(2, 9, 1, 4, 12, 3, gr); m.box(2, 12, 1, 4, 14, 3, rd); m.set(4, 13, 2, yl); m.box(1, 10, 1, 2, 12, 3, gr); m.box(2, 7, 2, 4, 9, 3, AF.col(0x3a6ad0)); return m; }, 1 / 12, [0.5, 0, 0.5]);
        fh.place(parrot, b - 0.3, 1.0, 0.8, 0, -1); },
      noDefault: true, fit: (x) => { kit(x, 'pawn'); const balls = TS.geo('pawnballs', () => { const m = M(12, 12, 4); m.line(6, 11, 2, 6, 7, 2, C.gold); m.line(1, 7, 2, 11, 7, 2, C.gold); for (const [cx, cy] of [[2, 3], [10, 3], [6, 1]]) m.sphere(cx, cy + 1, 2, 1.8, C.gold); return m; }, 1 / 8, [0.5, 0, 0.5]); x.f.fill(27.8, 5.0, -1.5, 28.2, 5.25, 0, C.iron); x.f.place(balls, 28, 3.75, -1.25, 1, 0); x.f.place(TS.sign('3', C.gold, null, 1 / 16), 29.5, 3.6, -0.05, 0, -1); } });
    TS.shop(fh, { id: 'hardware', name: 'Anchor Hardware', u0: 32, w: 9, d: 16, h: 15, wall: C.brickR, trim: C.cream, sign: { text: 'HARDWARE', fg: C.red, bg: C.cream }, awning: [C.red, C.white], goods: 'tools', goods2: 'cans', floor: 'wood',
      display: (a, b) => { for (let u = a + 0.45; u < b - 0.3; u += 0.8) fh.place(AF.shopKit.display('hardware', Math.floor(u * 5)), u, 1.0, 0.9, 0, -1); },
      noDefault: true, fit: (x) => { kit(x, 'hardware'); for (const [i, u] of [[0, 32.9], [1, 33.7], [2, 39.3], [3, 40.1]]) x.f.place(TS.props.crate(i + 3), u, 0.25, -0.7, 0, -1, true); } });
    TS.shop(fh, { id: 'laundromat', name: 'Bubbles Steam Laundry', u0: 41, w: 9, d: 16, h: 14, wall: C.lime, trim: C.teal, sign: { text: 'HAND LAUNDRY', fg: C.neonBlue, bg: C.white }, awning: [C.teal, C.white], floor: 'tile', noDefault: true, paper: C.paper[3],
      fit: (x) => {
        kit(x, 'general', { dress: true, floorType: 'hex', ceiling: 'tin' });
        const f = x.f;
        const washer = TS.geo('washer', () => { const m = M(6, 8, 6); m.box(0, 0, 0, 6, 8, 6, C.white); m.sphere(3, 4, 6, 2.2, C.chrome, (xx, y, z) => (z >= 5 ? C.chrome : 0)); m.box(2, 3, 5, 4, 5, 6, AF.col(0x7ab0d8, { glass: true })); m.box(0, 7, 0, 6, 8, 6, C.steel); m.box(1, 7, 5, 2, 8, 6, C.red); return m; }, 1 / 8, [0.5, 0, 0]);
        for (let v = 2.5; v < 14.5; v += 0.85) f.place(washer, 49.0, 0.5, v, -1, 0, true);
        for (let u = 42.5; u < 48; u += 0.85) f.place(washer, u, 0.5, 15.5, 0, -1, true);
        f.place(TS.props.bench(), 42.3, 0.5, 8, 1, 0, true); x.spot('sit', 42.3, 7.2, 1, 0, 0.95); x.spot('sit', 42.3, 8.8, 1, 0, 0.95);
        x.spot('work', 47.5, 5, 1, 0); x.spot('browse', 47.6, 11, 1, 0);
        // a steam mangle with a white roller, brown-paper parcels tied with string on the pickup shelf, a steaming pavement grate
        const mangle = TS.geo('mangle', () => { const m = M(16, 10, 6), pad = AF.col(0xf4f0e6, { jitter: 0.08 }); m.box(0, 0, 0, 2, 7, 6, C.iron); m.box(14, 0, 0, 16, 7, 6, C.iron); m.box(2, 3, 1, 14, 6, 5, pad); m.box(2, 6, 0, 14, 8, 6, C.chrome); m.box(2, 2, 5, 14, 3, 6, C.woodL); m.box(15, 7, 2, 16, 10, 3, C.iron); m.box(2, 0, 2, 14, 1, 4, C.iron); return m; }, 1 / 8, [0.5, 0, 0.5]);
        f.place(mangle, 45.5, 0.5, 12.6, 0, -1, true); x.spot('work', 45.5, 11.7, 0, 1);
        const parcels = TS.geo('parcels', () => { const m = M(12, 18, 4), kr = AF.col(0xb8946a, { jitter: 0.3 }), st = AF.col(0xf0e8d0); m.box(0, 0, 0, 12, 18, 1, C.woodD); for (const y of [0, 6, 12]) { m.box(0, y, 0, 12, y + 1, 4, C.woodD); for (let x = 1; x < 11; x += 3) { const h = 2 + ((x + y) % 3); m.box(x, y + 1, 1, x + 3, y + 1 + h, 4, kr); m.box(x + 1, y + 1, 1, x + 2, y + 1 + h, 4, st); m.box(x, y + h, 2, x + 3, y + h + 1, 3, st); } } return m; }, 1 / 8, [0.5, 0, 0]);
        f.place(parcels, 41.55, 0.5, 12.5, 1, 0, true);
        { const a = f.w(44.5, -1.0), b = f.w(45.5, -0.5); AF.W.paint(Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[0], b[0]), Math.max(a[1], b[1]), C.iron); } { const p = f.w(45, -0.75); AF.addChimney(p[0], 0.35, p[1]); }
      } });
    TS.shop(fh, { id: 'poolhall', name: 'Eight Ball Billiards', u0: 50, w: 9, d: 18, h: 16, wall: C.brickY, trim: C.cream, sign: { text: 'BILLIARDS', fg: C.neonGreen, bg: C.black }, awning: [C.felt, C.cream], floor: 'wood', noDefault: true, right: true, fe: 'R', paper: AF.col(0x2f5a3e, { jitter: 0.25 }), dado: C.woodD, lamp: 'pendant',
      fit: (x) => {
        kit(x, 'tobacco', { dress: true, floorType: 'plank', ceiling: 'beams', fans: true });
        const f = x.f;
        const ptable = TS.geo('pooltable', () => { const m = M(12, 7, 22); for (const [a, b] of [[1, 1], [10, 1], [1, 20], [10, 20]]) m.box(a, 0, b, a + 1, 5, b + 1, C.woodD); m.box(0, 5, 0, 12, 7, 22, C.woodD); m.box(1, 6, 1, 11, 7, 21, C.felt); for (const [a, b] of [[3, 5], [5, 8], [7, 13], [4, 16]]) m.set(a, 7, b, C.bright[(a + b) % 12]); m.set(6, 7, 17, C.white); return m; }, 1 / 8, [0.5, 0, 0.5]);
        const hang = TS.geo('poollamp', () => { const m = M(10, 10, 4); m.box(4, 3, 1, 6, 10, 3, C.iron); m.box(0, 0, 0, 10, 3, 4, C.felt); m.box(1, 0, 1, 9, 1, 3, C.lamp); return m; }, 1 / 8, [0.5, 1, 0.5]);
        for (const v of [4.5, 9.5, 14.5]) { f.place(ptable, 54.5, 0.5, v, 1, 0, true); f.place(hang, 54.5, x.SH, v, 1, 0); x.spot('work', 52.6, v, 1, 0); x.spot('stand', 56.4, v + 0.8, -1, 0); }
        const rack = TS.geo('cuerack', () => { const m = M(16, 16, 2); m.box(0, 0, 0, 16, 1, 2, C.woodD); m.box(0, 14, 0, 16, 16, 2, C.woodD); for (let x2 = 1; x2 < 16; x2 += 2) m.box(x2, 1, 1, x2 + 1, 14, 2, C.woodL); return m; }, 1 / 8, [0.5, 0, 0]);
        f.place(rack, 58.5, 0.8, 5, -1, 0); f.place(rack, 58.5, 0.8, 13, -1, 0);
        const score = TS.geo('scoreboard', () => { const m = M(24, 12, 2); m.box(0, 0, 0, 24, 12, 1, C.woodD); for (const y of [3, 6, 9]) { m.box(1, y, 1, 23, y + 1, 2, C.steel); for (let k = 0; k < 7; k++) m.set(2 + ((k * 3 + y) % 20), y, 1, k % 2 ? C.red : C.cream); } m.box(0, 11, 0, 24, 12, 2, C.gold); return m; }, 1 / 8, [0.5, 0, 0]);
        f.place(score, 54.5, 2.2, 17.5, 0, -1);
        f.place(TS.sign('EIGHT BALL', C.neonGreen, C.black, 1 / 16), 54.5, 3.9, 17.45, 0, -1);
        for (const v of [4.5, 9.5, 14.5]) { x.spot('stand', 56.6, v - 1.2, -1, 0); }
        for (const v of [3, 7, 12]) { f.place(TS.props.chair(C.woodD), 50.9, 0.5, v, 1, 0); x.spot('sit', 50.9, v, 1, 0, 1.0); }
        f.light(54.5, 3.0, 9.5, 0xf0ffd0, 1.0, 12);
      } });
    AF.addLabel('Harbour Shops', 118, 150, 'place');
  };

  // ================================================================= sidewalk life: queue rope, poster lamps, popcorn cart, newsstand, shoeshine boy, bicycles
  const buildStreetLife = (TS) => {
    const C = TS.C, P = TS.paramount; if (!P) return;
    const f = P.f, tb = P.tb;
    const post = TS.geo('stanchion', () => { const m = M(3, 8, 3); m.box(0, 0, 0, 3, 1, 3, C.brass); m.box(1, 1, 1, 2, 7, 2, C.brass); m.box(0, 7, 0, 3, 8, 3, C.gold); return m; }, 1 / 8, [0.5, 0, 0.5]);
    const rope = [];
    for (let v = -0.4; v >= -2.9; v -= 1.25) rope.push([tb + 1.0, v]);
    for (let u = tb + 1.0; u >= tb - 7.0; u -= 1.3) rope.push([u, -2.9]);
    for (const [u, v] of rope) f.place(post, u, 0.25, v, 0, -1, true);
    for (let i = 0; i + 1 < rope.length; i++) { const [a1, b1] = rope[i], [a2, b2] = rope[i + 1]; const n = Math.ceil(Math.hypot(a2 - a1, b2 - b1) / 0.25); for (let k = 0; k <= n; k++) { const t = k / n, p = f.w(a1 + (a2 - a1) * t, b1 + (b2 - b1) * t); AF.W.setM(p[0], 0.9 - Math.sin(t * Math.PI) * 0.15, p[1], C.curtain); } }
    for (let i = 0; i < 4; i++) { const u = i < 2 ? 3.5 + i * 3.5 : 31 + (i - 2) * 3.5; f.fill(u - 0.75, 3.75, -0.5, u + 0.75, 4.0, -0.25, C.lamp); f.fill(u - 0.75, 4.0, -0.5, u + 0.75, 4.25, 0, C.brass); }
    const cart = TS.geo('popcart', () => { const m = M(10, 16, 7); m.box(0, 2, 0, 10, 7, 7, C.red); m.box(0, 7, 0, 10, 13, 7, C.glass); m.box(1, 7, 1, 9, 10, 6, C.cream); m.box(0, 13, 0, 10, 15, 7, C.red); m.box(2, 15, 2, 8, 16, 5, C.gold); m.box(1, 0, 0, 3, 2, 1, C.black); m.box(7, 0, 0, 9, 2, 1, C.black); m.box(1, 0, 6, 3, 2, 7, C.black); m.box(7, 0, 6, 9, 2, 7, C.black); m.box(3, 11, 3, 7, 12, 4, C.lamp); return m; }, 1 / 8, [0.5, 0, 0.5]);
    f.place(cart, 35.5, 0.25, -1.7, 0, -1, true);
    { const p = f.w(35.5, -0.6); AF.addSpot({ building: 'paramount', x: p[0], y: 0.25, z: p[1], yaw: f.yaw(0, -1), kind: 'work' }); }
    const g = TS.frame(10, 88, 'W');
    const k = TS.geos.get('kiosk'); if (k) { g.place(k, 5.0, 0.25, -1.0, 0, -1, true); g.place(TS.sign('NEWS', C.red, C.cream, 1 / 16), 5.0, 2.4, -2.55, 0, -1); const p = g.w(5, -0.5); AF.addSpot({ building: 'bs-cigar', x: p[0], y: 0.25, z: p[1], yaw: g.yaw(0, -1), kind: 'work' }); }
    const rack = TS.geo('magrack', () => { const m = M(10, 10, 4); m.box(0, 0, 0, 10, 1, 4, C.jade); m.box(0, 0, 0, 1, 10, 1, C.jade); m.box(9, 0, 0, 10, 10, 1, C.jade); for (let y = 1; y < 10; y += 3) for (let x = 1; x < 9; x += 2) m.box(x, y, 1 + (y % 2), x + 2, y + 3, 2 + (y % 2), C.bright[(x + y) % 12]); return m; }, 1 / 8, [0.5, 0, 0]);
    g.place(rack, 7.2, 0.25, -0.1, 0, -1, true); g.place(rack, 2.8, 0.25, -0.1, 0, -1, true);
    const boy = TS.geo('shineboy', () => { const m = M(4, 9, 4); m.box(0, 0, 0, 4, 3, 4, AF.col(0x5a4a3a)); m.box(0, 3, 0, 4, 6, 3, AF.col(0xd8c8a0)); m.box(1, 6, 1, 3, 8, 3, AF.col(0xc89070)); m.box(0, 8, 0, 4, 9, 4, AF.col(0x4a4a50)); m.box(1, 2, 3, 3, 3, 4, C.woodD); return m; }, 1 / 8, [0.5, 0, 0.5]);
    const fk = TS.frame(-10, 72, 'E'); fk.place(boy, 36, 0.25, -2.3, 0, 1);
    const bike = TS.geo('bike', () => { const m = M(14, 8, 1); const ring = (cx) => { for (let a = 0; a < 24; a++) { const t = a / 24 * Math.PI * 2; m.set(Math.round(cx + Math.cos(t) * 2.5), Math.round(3 + Math.sin(t) * 2.5), 0, C.black); } }; ring(3); ring(10); m.line(3, 3, 0, 7, 3, 0, C.red); m.line(7, 3, 0, 10, 3, 0, C.red); m.line(5, 6, 0, 7, 3, 0, C.red); m.line(5, 6, 0, 9, 6, 0, C.red); m.line(9, 6, 0, 10, 3, 0, C.red); m.box(4, 6, 0, 7, 7, 1, C.black); m.box(9, 7, 0, 12, 8, 1, C.chrome); return m; }, 1 / 8, [0.5, 0, 0.5]);
    fk.place(bike, 13.3, 0.25, -0.2, 1, 0); fk.place(bike, 46.2, 0.25, -0.2, 1, 0);
    TS.frame(88, 147, 'S').place(bike, 29.5, 0.25, -0.2, 1, 0);
    TS.frame(10, 10, 'W').place(bike, 56.6, 0.25, -0.2, 1, 0);
  };

  // ================================================================= ROUND 2: rooftops for the aerial (neon billboards on steel frames with
  // chasing bulbs, pigeon coops, laundry, roof gardens with parasols, radio masts, skylights, smoking chimneys), ghost murals, diner steam
  const roofTop = (x, z) => AF.surfaceBelow(x, z, 70, 70);
  const billboard = (TS, f, u, v, text, fg, bg, vs, light) => {
    const C = TS.C, tw = (text.length * 6 + 1) * vs, th = 9 * vs, half = tw / 2 + 0.5;
    for (const du of [0, -4, 4, -8, 8]) {
      const uc = u + du, hs = [uc - half + 0.4, uc, uc + half - 0.4].map((q) => { const p = f.w(q, v + 0.6); return roofTop(p[0], p[1]); });
      if (Math.min(...hs) < 8 || Math.max(...hs) - Math.min(...hs) > 4.5) continue;
      const y = Math.max(...hs), y1 = y + 2.5;
      for (const pu of [uc - half + 0.5, uc - tw / 6, uc + tw / 6, uc + half - 0.75]) { const pp = f.w(pu + 0.125, v + 1.1), yb = Math.min(y, roofTop(pp[0], pp[1])); f.fill(pu, yb, v + 0.25, pu + 0.25, y1 + th, v + 0.5, C.iron); f.fill(pu, yb, v + 1.75, pu + 0.25, y1 - 0.25, v + 2.0, C.iron); f.fill(pu, y1 - 0.5, v + 0.5, pu + 0.25, y1 - 0.25, v + 1.75, C.iron); }
      f.fill(uc - half + 0.5, y1 - 0.25, v - 0.75, uc + half - 0.5, y1, v + 0.25, C.iron);                 // catwalk
      for (let q = uc - half + 0.5; q < uc + half - 0.5; q += 1.0) f.fill(q, y1, v - 0.75, q + 0.25, y1 + 0.75, v - 0.5, C.iron);   // rail posts
      f.fill(uc - half + 0.5, y1 + 0.75, v - 0.75, uc + half - 0.5, y1 + 1.0, v - 0.5, C.iron);
      f.fill(uc - tw / 2 - 0.25, y1, v, uc + tw / 2 + 0.25, y1 + th + 0.25, v + 0.25, bg);                       // board backing (painted back for the aerial)
      f.place(TS.sign(text, fg, bg, vs), uc, y1 + th / 2 + 0.125, v - 0.01, 0, -1);
      let k = 0; for (let q = uc - tw / 2 - 0.25; q < uc + tw / 2 + 0.25; q += 0.5) { f.fill(q, y1 + th + 0.25, v - 0.25, q + 0.25, y1 + th + 0.5, v, TS.b3(k)); f.fill(q, y1 - 0.25 + 0.001, v - 0.25, q + 0.25, y1, v, TS.b3(k + 1)); k++; }
      f.light(uc, y1 + th / 2, v - 3, light, 1.3, 16, 'sign');
      return true;
    }
    return false;
  };
  const roofGeos = (TS) => {
    const C = TS.C, K = AF.SK && AF.SK.K;
    const fl = [0xe83a5a, 0xf0c030, 0xf07ad0, 0xffffff, 0xe86a2a].map((h) => AF.col(h, { jitter: 0.3, solid: false })), leaf = AF.col(0x4f8a3a, { jitter: 0.5, solid: false });
    const cloth = [0xf4f0e6, 0xd8e4f0, 0xe8a0a8, 0x9ab8e0, 0xf0d890, 0xc0e0c0].map((h) => AF.col(h, { jitter: 0.1, solid: false }));
    return {
      coop: TS.geo('roof-coop', () => { const m = M(18, 14, 11), wd = AF.col(0x8a6a48, { pat: 'plank', jitter: 0.4 }), wr = AF.col(0x9aa0a0);
        for (const [a, b] of [[0, 0], [17, 0], [0, 10], [17, 10]]) m.box(a, 0, b, a + 1, 4, b + 1, C.woodD);
        m.box(0, 4, 0, 18, 11, 11, wd); m.box(1, 5, 10, 17, 10, 11, 0); for (let x = 1; x < 17; x += 2) for (let y = 5; y < 10; y += 2) m.set(x, y, 10, wr);
        for (let y = 11; y < 14; y++) m.box(0, y, (y - 11) * 2, 18, y + 1, 11 - (y - 11) * 2, C.white);
        for (const [x, z] of [[3, 3], [8, 5], [13, 2]]) { m.box(x, 14 - 1, z, x + 2, 14, z + 1, AF.col(0x8a8a96)); } m.box(2, 4, 10, 16, 5, 13 > 11 ? 11 : 11, C.woodD); return m; }, 1 / 8, [0.5, 0, 0.5]),
      laundry: TS.geo('roof-laundry', () => { const m = M(34, 17, 2), r = AF.rng(77);
        m.box(0, 0, 0, 1, 17, 1, C.iron); m.box(33, 0, 0, 34, 17, 1, C.iron); m.box(0, 15, 0, 34, 16, 1, AF.col(0xd8d0c0));
        for (let x = 3; x < 31;) { const w = 3 + Math.floor(r() * 4), h = 4 + Math.floor(r() * 5), c = cloth[Math.floor(r() * cloth.length)]; m.box(x, 15 - h, 0, x + w, 15, 1, c); if (r() < 0.4) m.box(x, 15 - h - 2, 0, x + 1, 15 - h, 1, c); x += w + 1; } return m; }, 1 / 8, [0.5, 0, 0.5]),
      garden: TS.geo('roof-garden', () => { const m = M(26, 19, 18), pl = AF.col(0x9a5a34, { jitter: 0.3 }), can = [AF.col(0xd8303a), AF.col(0xf4efe0)], dk = AF.col(0xb98a58, { pat: 'plank' });
        m.box(0, 0, 0, 26, 1, 18, dk);
        for (const [x0, z0, x1, z1] of [[0, 0, 26, 3], [0, 3, 3, 18]]) { m.box(x0, 1, z0, x1, 4, z1, pl); for (let x = x0; x < x1; x++) for (let z = z0; z < z1; z++) m.set(x, 4, z, ((x * 7 + z * 3) % 5) ? leaf : fl[(x + z) % 5]); for (let x = x0; x < x1; x += 2) for (let z = z0; z < z1; z += 2) if ((x + z) % 3 === 0) m.set(x, 5, z, fl[(x * 3 + z) % 5]); }
        m.box(15, 1, 10, 16, 16, 11, C.chrome); for (let y = 14; y < 17; y++) { const rr = 8 - (y - 14) * 3; for (let a = 0; a < 16; a++) { const t = a / 16 * Math.PI * 2; for (let q = (y === 14 ? rr - 1 : 0); q <= rr; q += 0.5) m.set(Math.round(15.5 + Math.cos(t) * q - 0.5), y, Math.round(10.5 + Math.sin(t) * q - 0.5), can[a & 1]); } }
        m.box(12, 1, 8, 19, 5, 13, 0); m.box(14, 4, 9, 18, 5, 13, C.white); m.box(15, 1, 10, 16, 5, 11, C.chrome);
        for (const x of [7, 21]) { m.box(x, 1, 7, x + 3, 3, 13, can[0]); m.box(x, 3, 12, x + 3, 6, 13, can[0]); m.box(x, 2, 7, x + 3, 3, 13, can[1]); }
        const nb = AF.col(0xfff0c0, { emit: 0xffc870, emitK: 2.4, mode: 'night', jitter: 0, edge: 0 }); m.box(0, 1, 0, 1, 18, 1, C.iron); m.box(25, 1, 17, 26, 18, 18, C.iron); m.box(25, 1, 0, 26, 18, 1, C.iron);
        for (const [a, b] of [[[0, 17, 0], [15, 16, 10]], [[15, 16, 10], [25, 17, 17]], [[15, 16, 10], [25, 17, 0]]]) for (let i = 1; i < 12; i++) { const t = i / 12, y = Math.round(a[1] + (b[1] - a[1]) * t - Math.sin(t * Math.PI) * 2); m.set(Math.round(a[0] + (b[0] - a[0]) * t), y, Math.round(a[2] + (b[2] - a[2]) * t), (i & 1) ? nb : C.iron); }
        return m; }, 1 / 8, [0.5, 0, 0.5]),
      mast: TS.geo('roof-mast', () => { const m = M(9, 44, 9), rl = AF.col(0xff3020, { emit: 0xff2010, emitK: 2.5, mode: 'always', jitter: 0, edge: 0 });
        m.box(3, 0, 3, 6, 1, 6, C.iron); m.box(4, 0, 4, 5, 42, 5, C.iron); for (const y of [14, 24, 32]) { m.box(0, y, 4, 9, y + 1, 5, C.iron); m.box(4, y + 3, 0, 5, y + 4, 9, C.iron); } m.box(3, 42, 3, 6, 44, 6, rl); return m; }, 1 / 8, [0.5, 0, 0.5]),
      skylight: TS.geo('roof-sky', () => { const m = M(18, 7, 12); m.box(0, 0, 0, 18, 2, 12, C.iron); for (let y = 2; y < 7; y++) m.box(0, y, y - 2, 18, y + 1, 12 - (y - 2), C.glass); for (let x = 0; x < 18; x += 4) for (let y = 2; y < 7; y++) { m.set(x, y, y - 2, C.iron); m.set(x, y, 11 - (y - 2), C.iron); } m.box(0, 6, 5, 18, 7, 7, C.iron); return m; }, 1 / 8, [0.5, 0, 0.5]),
      vent: TS.geo('roof-vent', () => { const m = M(6, 9, 6); m.box(1, 0, 1, 5, 6, 5, C.steel); m.box(0, 6, 0, 6, 7, 6, C.steel); m.box(1, 7, 1, 5, 8, 5, C.steel); m.box(2, 8, 2, 4, 9, 4, C.iron); return m; }, 1 / 8, [0.5, 0, 0.5]),
      hvac: TS.geo('roof-hvac', () => { const m = M(16, 10, 10); m.box(0, 0, 0, 16, 8, 10, C.steel); for (let x = 1; x < 15; x += 2) m.box(x, 2, 10 - 1, x + 1, 7, 10, C.iron); m.sphere(8, 8, 5, 3.5, C.iron, (a, b) => (b >= 8 ? C.iron : 0)); m.box(7, 8, 4, 9, 10, 6, C.chrome); return m; }, 1 / 8, [0.5, 0, 0.5]),
    };
  };
  const dressRoofs = (TS) => {
    const C = TS.C, G = roofGeos(TS), stats = { roof: 0, bb: 0, smoke: 0, fin: 0 };
    // roof finishes: each building's tar deck becomes silver-painted tar paper, pale gravel ballast, a red-tile terrace or stays black tar,
    // with darker tar patches and seams — so the aerial reads as many distinct roofs instead of one dark slab
    {
      const W = AF.W, FIN = [
        [AF.col(0xa9adb2, { pat: 'tar', rough: 0.5, metal: 0.25, jitter: 0.12 }), AF.col(0x8a8e94, { pat: 'tar', rough: 0.6, jitter: 0.15 })],
        [AF.col(0xb0a894, { pat: 'tar', jitter: 0.7 }), AF.col(0x958c7a, { pat: 'tar', jitter: 0.7 })],
        [AF.col(0xb4623e, { pat: 'tile', rough: 0.6, jitter: 0.25 }), AF.col(0xc8b89a, { pat: 'tile', rough: 0.6, jitter: 0.2 })],
        [AF.col(0x6a6660, { pat: 'tar', jitter: 0.35 }), AF.col(0x4a4744, { pat: 'tar', jitter: 0.3 })],
      ], patch = AF.col(0x3a3836, { pat: 'tar', jitter: 0.3 });
      for (const id of ['th-diner', 'th-shops', 'sh-bay']) {
        const L = AF.PLAN.lot(id); if (!L) continue; const [X0, Z0, X1, Z1] = L.rect, bTop = W.by(23), bMin = W.by(8);
        for (let bx = W.bx(X0); bx < W.bx(X1); bx++) for (let bz = W.bz(Z0); bz < W.bz(Z1); bz++) for (let by = bTop; by >= bMin; by--) {
          const c = W.get(bx, by, bz); if (!c) continue; if (c !== C.tar) break;
          const h = ((by * 2654435761) ^ (X0 * 97 + Z0 * 13)) >>> 0, fin = FIN[[0, 1, 0, 2, 3, 1, 0, 1][h % 8]], mx = bx >> 2, mz = bz >> 2, hh = ((mx * 73856093) ^ (mz * 19349663) ^ by) >>> 0;
          W.set(bx, by, bz, (hh % 23) === 0 ? patch : fin === FIN[2] ? ((((bx >> 3) + (bz >> 3)) & 1) ? fin[0] : fin[1]) : ((bx & 7) === 0 || (bz & 15) === 0 ? fin[1] : fin[0])); stats.fin++;
          break;
        }
      }
    }
    for (const id of ['th-diner', 'th-shops', 'sh-bay']) {
      const L = AF.PLAN.lot(id); if (!L) continue; const [X0, Z0, X1, Z1] = L.rect, r = AF.rng(id.length * 911 + X0 * 7);
      for (let x = X0 + 3.5; x < X1 - 3; x += 6.5) for (let z = Z0 + 3.5; z < Z1 - 3; z += 6.5) {
        const cx = Math.round((x + (r() - 0.5) * 2) * 4) / 4, cz = Math.round((z + (r() - 0.5) * 2) * 4) / 4, y = roofTop(cx, cz);
        if (y < 8) continue;
        if ([[-2, -2], [2, -2], [-2, 2], [2, 2], [0, 2.5], [2.5, 0], [-2.5, 0], [0, -2.5]].some(([a, b]) => Math.abs(roofTop(cx + a, cz + b) - y) > 0.01)) continue;
        const q = r(), rot = Math.floor(r() * 4);
        if (q < 0.13) AF.placeStatic(G.coop, cx, y, cz, rot, { collide: true });
        else if (q < 0.27) AF.placeStatic(G.laundry, cx, y, cz, rot, { collide: false });
        else if (q < 0.39) AF.placeStatic(G.garden, cx, y, cz, rot, { collide: true });
        else if (q < 0.47) AF.placeStatic(G.mast, cx, y, cz, rot, { collide: true });
        else if (q < 0.58) AF.placeStatic(G.skylight, cx, y, cz, rot, { collide: true });
        else if (q < 0.72) { AF.placeStatic(G.hvac, cx, y, cz, rot, { collide: true }); AF.placeStatic(G.vent, cx + 1.8, y, cz + 1.2, 0, { collide: true }); }
        else if (q < 0.84) { AF.W.fill(cx - 0.375, y, cz - 0.375, cx + 0.375, y + 2.5, cz + 0.375, C.brickB); AF.W.fill(cx - 0.5, y + 2.5, cz - 0.5, cx + 0.5, y + 2.75, cz + 0.5, C.granite); if (stats.smoke++ < 6) AF.addChimney(cx, y + 2.85, cz); }
        else if (q < 0.92) AF.placeStatic(G.vent, cx, y, cz, rot, { collide: true });
        else continue;
        stats.roof++;
      }
    }
    // neon billboards facing the streets (one per block face)
    const B = [
      [TS.frame(10, 10, 'W'), 9, 'MOONBEAM', C.neonPink, C.navyD, 1 / 5, 0xff70d0], [TS.frame(10, 10, 'W'), 53, 'MALTS SODAS', C.neonGreen, C.black, 1 / 6, 0x80ff90],
      [TS.frame(72, 10, 'N'), 31, 'ZEPHYR RADIO', C.neonTeal, C.black, 1 / 5, 0x70ffe0], [TS.frame(10, 72, 'S'), 40, 'DRINK FIZZ', C.neonRed, C.cream, 1 / 4, 0xff5040],
      [TS.frame(72, 72, 'E'), 31, 'HARBOUR CHEWS', C.neonYellow, C.redD, 1 / 5, 0xffe070],
      [TS.frame(-10, 72, 'E'), 25, 'DANCE TONIGHT', C.neonPink, C.black, 1 / 6, 0xff70c8], [TS.frame(-10, 72, 'E'), 56, 'BIRCH & BELL', C.gold, AF.col(0x2e7d6a, { jitter: 0.15 }), 1 / 6, 0xffe0a0],
      [TS.frame(-10, 10, 'N'), 39, 'NORTH STAR COFFEE', C.neonOrange, C.navyD, 1 / 5, 0xffa050], [TS.frame(-72, 72, 'S'), 23, 'SEAFOAM SODA', C.neonTeal, C.redD, 1 / 5, 0x70ffe0],
      [TS.frame(-72, 10, 'W'), 31, 'READ THE STAR', C.neonYellow, C.navy, 1 / 5, 0xffe070],
      [TS.frame(88, 147, 'S'), 17, 'OYSTERS', C.neonTeal, C.navyD, 1 / 5, 0x70ffe0], [TS.frame(88, 88, 'W'), 21, 'ANCHOR ALE', C.neonRed, C.cream, 1 / 5, 0xff5040],
      [TS.frame(147, 88, 'N'), 22, 'GULL SARDINES', C.neonBlue, C.white, 1 / 5, 0x70b0ff], [TS.frame(147, 147, 'E'), 30, 'TRAVEL BY RAIL', C.neonOrange, C.black, 1 / 5, 0xffa050],
    ];
    for (const [f, u, text, fg, bg, vs, lc] of B) { try { if (billboard(TS, f, u, 2.25, text, fg, bg, vs, lc)) stats.bb++; } catch (e) { console.error('[shops] billboard', text, e); } }
    S.roofStats = stats;
  };
  // ghost murals painted on the exposed party walls either side of the Starlite (faded, sun-bleached)
  const mural = (f, uWall, dir, vc, y0, lines, fg, bg) => {
    let y = y0; const rows = lines.map((t) => AF.textModel(t, fg, { pad: 0, depth: 1 }));
    const wMax = Math.max(...rows.map((m) => m.w)), hTot = rows.reduce((a, m) => a + m.h + 2, 0) + 2;
    for (let px = -2; px < wMax + 2; px++) for (let py = -2; py < hTot - 2; py++) { const p = f.w(uWall, vc + dir * (px - wMax / 2) * 0.25); AF.W.setM(p[0], y0 + py * 0.25 + 0.125, p[1], bg); }
    for (let i = rows.length - 1; i >= 0; i--) { const m = rows[i]; for (let px = 0; px < m.w; px++) for (let py = 0; py < m.h; py++) if (m.get(px, py, 0)) { const p = f.w(uWall, vc + dir * (px - m.w / 2) * 0.25); AF.W.setM(p[0], y + py * 0.25 + 0.125, p[1], fg); } y += (m.h + 2) * 0.25; }
    return y;
  };
  const ghostMurals = (TS) => {
    const f = TS.frame(10, 10, 'W'), fade = AF.col(0x9a5646, { jitter: 0.25, rough: 0.95, pat: 'none' }), cream = AF.col(0xe2d6b8, { jitter: 0.2, rough: 0.95, pat: 'none' }), jade = AF.col(0x5a8a78, { jitter: 0.25, rough: 0.95, pat: 'none' }), cup = AF.col(0xeee6d4, { jitter: 0.15, pat: 'none' }), cof = AF.col(0x5a3422, { pat: 'none' });
    const yT = mural(f, 17.875, 1, 9, 6.0, ['HOT PIE', 'COFFEE 5C'], cream, fade);
    // a giant painted cup with steam above the lettering
    for (let a = -8; a <= 8; a++) for (let b = 0; b <= 10; b++) { const w = 8 - b * 0.15; if (Math.abs(a) > w) continue; const p = f.w(17.875, 9 + a * 0.25); AF.W.setM(p[0], yT + 0.75 + b * 0.25 + 0.125, p[1], b === 10 ? cof : cup); }
    for (let b = 2; b <= 7; b++) for (const a of [9, 10]) { if (a === 10 && (b === 2 || b === 7)) continue; const p = f.w(17.875, 9 + (a + (b > 2 && b < 7 ? 1 : 0)) * 0.25); AF.W.setM(p[0], yT + 0.75 + b * 0.25 + 0.125, p[1], cup); }
    for (let s = 0; s < 3; s++) for (let b = 0; b < 8; b++) { const p = f.w(17.875, 9 + (s - 1) * 1.25 + Math.round(Math.sin(b * 0.9 + s) * 1.2) * 0.25); AF.W.setM(p[0], yT + 3.75 + b * 0.25 + 0.125, p[1], cream); }
    mural(f, 44.125, -1, 9, 6.5, ["KESSLER'S", 'MALTS SODAS'], cream, jade);
  };
  // chalk sandwich boards outside the shops + the bakery delivery boy's bicycle (basket of loaves)
  const sidewalkLife = (TS) => {
    const C = TS.C, chalk = AF.col(0x26302a, { rough: 0.95, pat: 'none' }), wd = AF.col(0x9a6a3e, { jitter: 0.3 });
    const board = TS.geo('sandwich', () => { const m = M(7, 9, 6); for (let y = 0; y < 9; y++) { const z = Math.min(5, Math.floor(y / 3)); m.box(0, y, 5 - z, 7, y + 1, 6 - z, (y === 0 || y === 8) ? wd : chalk); m.box(0, y, z, 7, y + 1, z + 1, (y === 0 || y === 8) ? wd : chalk); m.set(0, y, 5 - z, wd); m.set(6, y, 5 - z, wd); } return m; }, 1 / 8, [0.5, 0, 0.5]);
    const fk = TS.frame(-10, 72, 'E'), fg = TS.frame(10, 10, 'W'), fm = TS.frame(72, 10, 'N'), fh = TS.frame(88, 147, 'S');
    for (const [f, u, t] of [[fk, 7.2, 'BREAD'], [fk, 15.5, 'RECORDS'], [fk, 39.5, 'BOOKS 5C'], [fk, 60, 'SALE'], [fg, 16, 'PIE 5C'], [fg, 60, 'MALTS'], [fm, 16.8, 'SHAVE'], [fh, 22.5, 'OYSTERS'], [fh, 39.5, 'PAINT'], [fh, 8.5, 'ROPE']]) {
      f.place(board, u, 0.25, -1.1, 0, -1, true); f.place(TS.sign(t, C.white, null, 1 / 72), u, 0.95, -1.47, 0, -1);
    }
    const bike = TS.geo('delivbike', () => { const m = M(15, 10, 6), bl = AF.col(0x2a4a8a); const ring = (cx) => { for (let a = 0; a < 24; a++) { const t = a / 24 * Math.PI * 2; m.set(Math.round(cx + Math.cos(t) * 2.5), Math.round(3 + Math.sin(t) * 2.5), 2, C.black); } }; ring(3); ring(11);
      m.line(3, 3, 2, 7, 3, 2, bl); m.line(7, 3, 2, 11, 3, 2, bl); m.line(5, 6, 2, 7, 3, 2, bl); m.line(5, 6, 2, 10, 6, 2, bl); m.line(10, 6, 2, 11, 3, 2, bl); m.box(4, 6, 2, 7, 7, 3, C.black); m.box(10, 7, 1, 11, 8, 5, C.chrome);
      m.box(11, 5, 0, 15, 9, 5, AF.col(0xb08850, { jitter: 0.5 })); m.box(12, 6, 1, 14, 9, 4, 0); for (const [x, z] of [[12, 1], [13, 2], [12, 3]]) m.box(x, 8, z, x + 2, 10, z + 1, AF.col(0xc8883a)); return m; }, 1 / 8, [0.5, 0, 0.5]);
    fk.place(bike, 2.2, 0.25, -0.35, 1, 0);
  };
  // swinging trade signs on iron brackets (pretzel, record, book, lens, star, cup, mortar, scissors, pipe, anchor, fish, key, 8-ball, shirt)
  const tradeSign = (TS, kind) => {
    const C = TS.C;
    return TS.geo('tsign-' + kind, () => {
      const m = M(14, 15, 1), ring = (cx, cy, r0, r1, c) => { for (let x = 0; x < 14; x++) for (let y = 0; y < 13; y++) { const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy); if (d >= r0 && d <= r1) m.set(x, y, 0, c); } };
      m.box(3, 14, 0, 4, 15, 1, C.iron); m.box(10, 14, 0, 11, 15, 1, C.iron); m.box(3, 13, 0, 4, 14, 1, C.iron); m.box(10, 13, 0, 11, 14, 1, C.iron);
      const pz = AF.col(0xa8662a), br = AF.col(0x6a3e1e);
      switch (kind) {
        case 'pretzel': ring(4.5, 7, 2.2, 3.6, pz); ring(9.5, 7, 2.2, 3.6, pz); ring(7, 3.5, 2, 3.4, pz); m.box(3, 12, 0, 11, 13, 1, pz); break;
        case 'record': ring(7, 6.5, 0, 6.2, C.black); ring(7, 6.5, 0, 2.2, C.red); m.set(6, 6, 0, C.black); break;
        case 'book': m.box(2, 1, 0, 12, 13, 1, C.redD); m.box(2, 1, 0, 3, 13, 1, C.gold); m.box(5, 9, 0, 10, 10, 1, C.gold); m.box(5, 5, 0, 10, 6, 1, C.gold); break;
        case 'lens': m.box(1, 3, 0, 13, 11, 1, C.black); ring(7, 7, 0, 3.4, C.chrome); ring(7, 7, 0, 1.8, C.navy); m.box(2, 11, 0, 5, 12, 1, C.chrome); break;
        case 'star': for (let a = 0; a < 5; a++) { const t = a / 5 * Math.PI * 2 + Math.PI / 2; m.line(7, 6.5, 0, 7 + Math.cos(t) * 6, 6.5 + Math.sin(t) * 6, 0, C.gold); m.line(7.5, 6.5, 0, 7.5 + Math.cos(t) * 5, 6.5 + Math.sin(t) * 5, 0, C.gold); } ring(7, 6.5, 0, 2.6, C.gold); break;
        case 'cup': m.box(3, 2, 0, 10, 10, 1, C.white); m.box(2, 1, 0, 12, 2, 1, C.white); ring(10.5, 6.5, 1.2, 2.6, C.white); m.box(4, 9, 0, 9, 10, 1, br); break;
        case 'mortar': ring(7, 8, 0, 5.2, C.white); m.box(1, 8, 0, 13, 13, 1, 0); m.box(4, 1, 0, 10, 3, 1, C.white); m.line(8, 7, 0, 12, 12, 0, C.woodL); m.box(2, 8, 0, 12, 9, 1, C.navy); break;
        case 'scissors': ring(4, 3.5, 1.4, 2.8, C.red); ring(10, 3.5, 1.4, 2.8, C.red); m.line(5, 5, 0, 11, 12, 0, C.chrome); m.line(9, 5, 0, 3, 12, 0, C.chrome); m.line(5, 6, 0, 10, 12, 0, C.chrome); m.line(9, 6, 0, 4, 12, 0, C.chrome); break;
        case 'pipe': m.box(1, 3, 0, 5, 9, 1, br); m.box(2, 8, 0, 4, 9, 1, C.black); m.box(5, 4, 0, 13, 5, 1, br); m.box(11, 5, 0, 13, 6, 1, C.black); break;
        case 'anchor': m.box(6, 1, 0, 8, 12, 1, C.iron); m.box(3, 10, 0, 11, 11, 1, C.iron); ring(7, 2.5, 3, 4.2, C.iron); m.box(0, 3, 0, 14, 13, 1, 0); m.box(6, 3, 0, 8, 12, 1, C.iron); m.box(3, 10, 0, 11, 11, 1, C.iron); ring(7, 12, 0, 1.3, C.brass); break;
        case 'fish': for (let x = 1; x < 11; x++) { const h = Math.round(Math.sin((x - 0.5) / 10 * Math.PI) * 4); m.box(x, 7 - h, 0, x + 1, 7 + h, 1, C.steel); } m.box(11, 3, 0, 13, 11, 1, C.steel); m.box(11, 6, 0, 12, 8, 1, 0); m.set(3, 8, 0, C.black); m.box(4, 6, 0, 10, 7, 1, C.teal); break;
        case 'key': ring(3.5, 7, 1.2, 3, C.gold); m.box(6, 6, 0, 14, 8, 1, C.gold); m.box(10, 3, 0, 11, 6, 1, C.gold); m.box(12, 4, 0, 13, 6, 1, C.gold); break;
        case 'ball8': ring(7, 6.5, 0, 6, C.black); ring(7, 7.5, 0, 2.4, C.white); m.box(6, 6, 0, 8, 10, 1, C.black); m.set(6, 7, 0, C.white); m.set(7, 7, 0, C.white); m.set(6, 9, 0, C.white); m.set(7, 9, 0, C.white); m.box(6, 8, 0, 8, 9, 1, C.white); break;
        default: m.box(4, 1, 0, 10, 11, 1, C.white); m.box(1, 8, 0, 13, 12, 1, C.white); m.box(6, 11, 0, 8, 12, 1, C.navy); break;
      }
      return m;
    }, 1 / 12, [0.5, 1, 0.5]);
  };
  const swingSigns = (TS) => {
    const C = TS.C, fk = TS.frame(-10, 72, 'E'), fg = TS.frame(10, 10, 'W'), fm = TS.frame(72, 10, 'N'), fh = TS.frame(88, 147, 'S');
    for (const [f, u, kind] of [[fk, 0.8, 'pretzel'], [fk, 9.8, 'record'], [fk, 33.8, 'book'], [fk, 42.8, 'lens'], [fk, 50.8, 'star'], [fg, 1.0, 'cup'], [fg, 44.8, 'mortar'], [fm, 17.2, 'scissors'], [fm, 9.2, 'pipe'],
      [fh, 0.8, 'anchor'], [fh, 23.2, 'fish'], [fh, 32.8, 'key'], [fh, 58.2, 'ball8'], [fh, 41.8, 'shirt']]) {
      f.fill(u - 0.125, 5.0, -1.5, u + 0.125, 5.125, 0, C.iron); f.fill(u - 0.125, 5.125, -0.25, u + 0.125, 5.5, 0, C.iron); f.fill(u - 0.125, 5.0, -1.75, u + 0.125, 5.25, -1.5, C.gold);
      const p = f.w(u, -0.95), V = f.dir(0, -1);
      S.swing.push({ geo: tradeSign(TS, kind), x: p[0], y: 5.0, z: p[1], yaw: Math.atan2(-V[1], V[0]), ph: u * 1.7 });
    }
  };
  const dinerSteam = (TS) => {
    const f = TS.frame(10, 10, 'W'), C = TS.C;
    f.fill(27.25, 5.0, 7.25, 28.0, 6.75, 8.0, C.steel); f.fill(27.0, 6.75, 7.0, 28.25, 7.0, 8.25, C.chrome);
    const p = f.w(27.625, 7.625); AF.addChimney(p[0], 7.1, p[1]);
    f.fill(35.25, 5.0, 7.25, 35.75, 6.0, 7.75, C.steel); const q = f.w(35.5, 7.5); AF.addChimney(q[0], 6.1, q[1]);
  };

  // ================================================================= dynamic bits: barber pole, mirror ball + flecks
  AF.onBuild('shops-dyn', 610, () => {
    for (const d of S.swing) { const g = new THREE.Group(); g.position.set(d.x, d.y, d.z); g.rotation.y = d.yaw; const m = AF.modelMesh(d.geo); g.add(m); AF.scene.add(g); d.m = m; }
    for (const d of S.dynamic) {
      const mesh = AF.modelMesh(d.geo); mesh.position.set(d.x, d.y, d.z); AF.scene.add(mesh); d.mesh = mesh;
      if (d.flecks) {
        const N = 64, g = new THREE.PlaneGeometry(0.22, 0.22), mat = new THREE.MeshBasicMaterial({ color: 0xfff0ff, transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false });
        const im = new THREE.InstancedMesh(g, mat, N); im.frustumCulled = false; AF.scene.add(im);
        const r = AF.rng(99), dirs = []; for (let i = 0; i < N; i++) { const y = r() * 1.4 - 0.9, a = r() * Math.PI * 2, s = Math.sqrt(1 - Math.min(0.99, y * y)); dirs.push([Math.cos(a) * s, y, Math.sin(a) * s]); }
        d.fl = { im, dirs, obj: new THREE.Object3D() };
      }
    }
  });
  let fa = 0;
  AF.onTick('shops-dyn', 310, (dt) => {
    const cam = AF.camera; if (!cam) return;
    fa += dt;
    for (const d of S.swing) if (d.m && Math.abs(cam.position.x - d.x) < 90 && Math.abs(cam.position.z - d.z) < 90) d.m.rotation.x = Math.sin(fa * 1.35 + d.ph) * 0.13 + Math.sin(fa * 0.47 + d.ph * 0.3) * 0.06;
    for (const d of S.dynamic) {
      if (!d.mesh) continue;
      const dist = Math.hypot(cam.position.x - d.x, cam.position.z - d.z);
      if (dist < 90) d.mesh.rotation.y += dt * d.spin;
      if (d.fl) {
        const near = dist < 45; d.fl.im.visible = near; if (!near) continue;
        const [cx, cy, cz] = d.flecks.c, B = d.flecks.box, ang = d.mesh.rotation.y, o = d.fl.obj;
        for (let i = 0; i < d.fl.dirs.length; i++) {
          const q = d.fl.dirs[i], ca = Math.cos(ang), sa = Math.sin(ang), dx = q[0] * ca - q[2] * sa, dz = q[0] * sa + q[2] * ca, dy = q[1];
          // ray to the room box
          let t = 1e9, n = 0;
          if (dx > 1e-4) { const tt = (B[3] - 0.05 - cx) / dx; if (tt < t) { t = tt; n = 0; } } else if (dx < -1e-4) { const tt = (B[0] + 0.05 - cx) / dx; if (tt < t) { t = tt; n = 0; } }
          if (dz > 1e-4) { const tt = (B[5] - 0.05 - cz) / dz; if (tt < t) { t = tt; n = 2; } } else if (dz < -1e-4) { const tt = (B[2] + 0.05 - cz) / dz; if (tt < t) { t = tt; n = 2; } }
          if (dy < -1e-4) { const tt = (B[1] + 0.02 - cy) / dy; if (tt < t) { t = tt; n = 1; } } else if (dy > 1e-4) { const tt = (B[4] - 0.05 - cy) / dy; if (tt < t) { t = tt; n = 1; } }
          o.position.set(cx + dx * t, cy + dy * t, cz + dz * t); o.rotation.set(n === 1 ? -Math.PI / 2 : 0, n === 0 ? Math.PI / 2 : 0, 0); o.updateMatrix(); d.fl.im.setMatrixAt(i, o.matrix);
        }
        d.fl.im.instanceMatrix.needsUpdate = true;
      }
    }
  });

  AF.onBuild('shops', 301, () => {
    const TS = AF.TS; if (!TS || !TS.shop) { AF.warnOnce('theatre kit AF.TS missing'); return; }
    const t0 = performance.now();
    TS.cols(); pieDefs(TS);
    for (const id of ['th-diner', 'th-shops', 'sh-bay']) { const L = AF.PLAN.lot(id); if (L) AF.W.ground(L.rect[0], L.rect[1], L.rect[2], L.rect[3], 1, TS.C.pave); }
    for (const [n, fn] of [['diner-block', buildDinerBlock], ['shop-row', buildShopRow], ['bay-row', buildBayRow], ['street-life', buildStreetLife]]) {
      try { fn(TS); } catch (e) { console.error('[shops] ' + n + ' failed', e); AF.errors && AF.errors.push({ part: 'shops:' + n, msg: String(e && e.stack || e) }); }
    }
    for (const [n, fn] of [['roofs', dressRoofs], ['murals', ghostMurals], ['diner-steam', dinerSteam], ['sidewalk', sidewalkLife], ['swing-signs', swingSigns]]) {
      try { fn(TS); } catch (e) { console.error('[shops] ' + n + ' failed', e); AF.errors && AF.errors.push({ part: 'shops:' + n, msg: String(e && e.stack || e) }); }
    }
    const I = (id, x, z, label, text, y = 1.5) => { const b = AF.buildings.find((q) => q.id === id); if (!b) return; AF.addInteract({ x, y, z, r: 2.2, label, act: () => AF.emit('toast', text) }); };
    I('starlite', 15.5, 41, 'Order pie and coffee', 'Cherry pie and a cup of joe — fifteen cents. "Coming right up, hon!"');
    I('automat', 25, 17, 'Drop a nickel in a little glass door', 'Click — the door swings open on a warm slice of apple pie.');
    I('barber', 58.5, 21, 'Get a shave and a haircut', 'Hot towel, straight razor, a splash of bay rum. Two bits.');
    I('roseland', -24, 45, 'Take a spin on the Rosewood dance floor', 'The band strikes up a foxtrot under the turning mirror ball.', 6.0);
    I('poolhall', 142.5, 137, 'Rack the balls', 'Eight ball, corner pocket. The regulars nod.');
    I('drugstore', 19.4, 57, 'Order a malted at the soda fountain', 'A chocolate malted with two straws and a cherry on top.');
    AF.addViewpoint('Starlite Diner', [2, 2.2, 36], [24, 3, 41]);
    AF.addViewpoint('Rosewood Ballroom', [-38, 7.2, 28], [-30, 7, 43]);
    AF.stats = Object.assign(AF.stats || {}, { shopsMs: Math.round(performance.now() - t0) });
  });

  AF.test('shops: Starlite Diner walkable (door to the counter stools)', () => {
    const TS = AF.TS, D = TS && TS.diner; if (!D) return { ok: false, info: 'no diner' };
    const a = D.f.w(D.dm, -2), dv = D.f.dir(0, 1), body = { x: a[0], y: 0.25, z: a[1], vy: 0, r: 0.3, h: 1.75, onGround: true };
    for (let i = 0; i < 6.5 / 0.05; i++) AF.moveBody(body, dv[0] * 0.05, dv[1] * 0.05, 1 / 30, { step: 0.55 });
    const du = D.f.dir(1, 0); for (let i = 0; i < 6 / 0.05; i++) AF.moveBody(body, du[0] * 0.05, du[1] * 0.05, 1 / 30, { step: 0.55 });
    const tgt = D.f.w(D.dm + 6, 4.5), d = Math.hypot(body.x - tgt[0], body.z - tgt[1]);
    return { ok: d < 1.0 && TS.dinerStools >= 10, info: `d=${d.toFixed(2)} y=${body.y.toFixed(2)} stools=${TS.dinerStools}` };
  });
  AF.test('shops: every theatre-shops building registered with doors + ≥70 spots', () => {
    const mine = AF.buildings.filter((b) => b.owner === 'theatre-shops'), ids = new Set(mine.map((b) => b.id));
    const spots = AF.spots.filter((s) => ids.has(s.building)).length;
    const need = ['paramount', 'blue-heron', 'rialto', 'starlite', 'automat', 'drugstore', 'barber', 'bakery', 'roseland', 'neptune', 'poolhall'];
    const miss = need.filter((i) => !ids.has(i));
    return { ok: miss.length === 0 && spots >= 70, info: `${mine.length} buildings, ${spots} spots${miss.length ? ' missing ' + miss.join(',') : ''}` };
  });
  AF.test('shops: shop doorways open (walk 3 m in)', () => {
    const TS = AF.TS; let bad = [];
    for (const b of AF.buildings.filter((x) => x.owner === 'theatre-shops')) {
      const d = b.doors[0]; if (!d) continue; const body = { x: d.x, y: 0.25, z: d.z, vy: 0, r: 0.3, h: 1.75, onGround: true }, dx = Math.sin(d.yaw), dz = Math.cos(d.yaw);
      for (let i = 0; i < 60; i++) AF.moveBody(body, dx * 0.05, dz * 0.05, 1 / 30, { step: 0.55 });
      if (Math.hypot(body.x - d.x, body.z - d.z) < 2.6) bad.push(b.id);
    }
    return { ok: bad.length === 0, info: bad.length ? 'blocked: ' + bad.join(',') : 'all open' };
  });
  AF.test('shops: rooftops dressed (≥20 roof props, ≥10 neon billboards)', () => { const r = S.roofStats || { roof: 0, bb: 0 }; return { ok: r.roof >= 20 && r.bb >= 10, info: r.roof + ' roof props, ' + r.bb + ' billboards, ' + r.smoke + ' chimneys' }; });
  AF.test('shops: Roseland stair reaches the dance hall', () => {
    const R = AF.TS && AF.TS.roseland; if (!R) return { ok: false, info: 'no roseland' };
    const a = R.f.w(R.u0 + 1.5, 2.5), dv = R.f.dir(0, 1), body = { x: a[0], y: 0.5, z: a[1], vy: 0, r: 0.3, h: 1.75, onGround: true };
    for (let i = 0; i < 9 / 0.05; i++) AF.moveBody(body, dv[0] * 0.05, dv[1] * 0.05, 1 / 30, { step: 0.55 });
    return { ok: body.y >= R.HF - 0.3, info: 'y ' + body.y.toFixed(2) + ' (hall floor ' + R.HF + ')' };
  });
}

} catch (e) { AF.partError('23-shops.js', e); }

