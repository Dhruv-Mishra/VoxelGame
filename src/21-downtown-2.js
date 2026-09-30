// ================================================================ 21-downtown-2.js
try {
// ===== 21-downtown-2: DOWNTOWN INTERIORS — Harbour Trust banking hall + vault, Grand Solace lobby/ballroom/rooms,
// Meridian store (4 floors), WSOL lobby + live studio, Solace Tower lobby  (OWNER: downtown). Uses AF._dt from 20-downtown.js.
{
  const W = AF.W;
  AF.onAir = true;
  const DT_FAIL = AF._dtFail = [];
  AF.test('downtown interiors all registered (5)', () => { const ids = ['harbour-trust', 'grand-solace', 'meridian', 'wsol', 'solace-tower']; const got = ids.filter((id) => (AF.buildings || []).some((b) => b.id === id)); return { ok: got.length === 5 && !DT_FAIL.length, info: got.length + '/5 registered' + (DT_FAIL.length ? ' FAIL: ' + DT_FAIL.join(' | ') : '') }; });
  AF.onBuild('downtown-interiors', 310, () => {
    const D = AF._dt; if (!D || !D.pal) { DT_FAIL.push('AF._dt missing (20-downtown.js did not load)'); return; }
    const p = D.pal(), c = AF.col, FF = D.FF;
    const I = {
      lampA: c(0xfff1c9, { emit: 0xffd48a, emitK: 2.6, mode: 'always', jitter: 0, edge: 0 }),
      cream: c(0xeee4d0, { jitter: 0.15 }), rose: c(0xd9a7a0, { smooth: true }), blackM: c(0x1c1a1e, { jitter: 0.15, edge: 0.2 }), greenM: c(0x2d5a4a, { jitter: 0.3 }),
      parq1: c(0xa8743f, { jitter: 0.3 }), parq2: c(0x8a5a30, { jitter: 0.3 }), carpet: c(0x9a2a2a, { jitter: 0.25, pat: 'none', patTop: 'carpet', rough: 1 }), cloth: c(0xf4efe4, { jitter: 0.1 }),
      velvet: c(0x8e2330, { jitter: 0.2, pat: 'none', rough: 0.9 }), velvetG: c(0x2f5a3a, { jitter: 0.2 }), walnut: c(0x5a3920, { jitter: 0.3 }), leaf: c(0x3f7a34, { jitter: 0.5 }), leafD: c(0x2c5a26, { jitter: 0.4 }),
      urn: c(0x3c6a8a, { jitter: 0.2 }), skin: c(0xe8d2bc, { jitter: 0.1 }), steel: c(0x9aa0a8, { jitter: 0.15, edge: 0.5 }), steelD: c(0x50555c, { jitter: 0.15 }),
      goldBar: c(0xf2c14e, { jitter: 0.1, edge: 0.6 }), cream2: c(0xf2e6c8, { jitter: 0.1 }), teal: c(0x3f9a9a, { jitter: 0.2 }), pink: c(0xe8a0b4), blue: c(0x4a78c0), yellow: c(0xe8c040), green: c(0x4a9a50),
      terr: c(0xcfc6b4, { jitter: 0.6 }), acoust: c(0x6a4a3a, { jitter: 0.3 }), acoust2: c(0x7c5a44, { jitter: 0.3 }), dial: c(0xf0e0a0, { emit: 0xffe0a0, emitK: 1.2, mode: 'always', jitter: 0 }),
      onAir: c(0xff3b2a, { emit: 0xff2a1a, emitK: 3, mode: 'always', jitter: 0, edge: 0 }), grnLamp: c(0x7fe07a, { emit: 0x60ff60, emitK: 2, mode: 'always' }),
      sky1: c(0xf2b880, { jitter: 0.1 }), sky2: c(0x7fb2d0, { jitter: 0.1 }), sea: c(0x2e5f8a, { jitter: 0.2 }), sil: c(0x3a3050, { jitter: 0.1 }), sun: c(0xffd070, { emit: 0xffc060, emitK: 1, mode: 'always' }),
    };
    // ---------------------------------------------------------- props (vs 1/8, front = +z; rot quarter turns: +z -> +x -> -z -> -x)
    const cache = {};
    const G = (key, w, h, d, fn, vs = 1 / 8) => cache[key] || (cache[key] = (() => { const m = new AF.Model(w, h, d); fn(m); return AF.meshModel(m, { vs, anchor: [0.5, 0, 0.5] }); })());
    const put = (geo, x, y, z, rot = 0, col = true) => AF.placeStatic(geo, x, y, z, rot, { collide: col });
    const chand = () => G('chand', 17, 14, 17, (m) => {
      m.box(8, 8, 8, 9, 14, 9, p.brass);
      for (let a = 0; a < 24; a++) { const t = a / 24 * Math.PI * 2, x = 8.5 + Math.cos(t) * 7, z = 8.5 + Math.sin(t) * 7; m.set(x, 4, z, p.gold); if (a % 3 === 0) { m.set(x, 5, z, I.lampA); m.set(x, 3, z, I.cream2); m.set(x, 2, z, I.cream2); } }
      for (let a = 0; a < 16; a++) { const t = a / 16 * Math.PI * 2, x = 8.5 + Math.cos(t) * 4, z = 8.5 + Math.sin(t) * 4; m.set(x, 7, z, p.gold); if (a % 2 === 0) m.set(x, 8, z, I.lampA); }
      m.sphere(8.5, 5, 8.5, 2.2, I.lampA); m.box(8, 0, 8, 9, 3, 9, I.cream2);
    });
    const chair = (col) => G('chair' + col, 4, 8, 4, (m) => { m.box(0, 3, 0, 4, 4, 4, col); m.box(0, 4, 0, 4, 8, 1, col); for (const [x, z] of [[0, 0], [3, 0], [0, 3], [3, 3]]) m.box(x, 0, z, x + 1, 3, z + 1, I.walnut); });
    const armchair = (col) => G('arm' + col, 7, 7, 6, (m) => { m.box(0, 1, 0, 7, 3, 6, col); m.box(0, 3, 0, 7, 7, 2, col); m.box(0, 3, 0, 1, 5, 6, col); m.box(6, 3, 0, 7, 5, 6, col); m.box(0, 0, 0, 7, 1, 6, I.walnut); });
    const sofa = (col) => G('sofa' + col, 16, 7, 6, (m) => { m.box(0, 1, 0, 16, 3, 6, col); m.box(0, 3, 0, 16, 7, 2, col); m.box(0, 3, 0, 1, 5, 6, col); m.box(15, 3, 0, 16, 5, 6, col); m.box(0, 0, 0, 16, 1, 6, I.walnut); for (let x = 1; x < 15; x += 5) m.box(x, 3, 2, x + 4, 4, 6, col); });
    const rtable = () => G('rtable', 10, 12, 10, (m) => { m.sphere(5, 6, 5, 5.2, I.cloth, (x, y, z) => (y === 6 || (y < 6 && y > 3 && (Math.hypot(x + .5 - 5, z + .5 - 5) > 4.2))) ? I.cloth : 0); m.box(4, 0, 4, 6, 6, 6, I.walnut); m.box(4, 7, 4, 6, 8, 6, p.brass); m.box(4, 8, 4, 6, 9, 6, p.brass); m.box(3, 9, 3, 7, 11, 7, I.rose); m.box(4, 10, 4, 6, 11, 6, I.lampA); m.box(1, 7, 6, 3, 8, 8, p.white); m.box(7, 7, 2, 9, 8, 4, p.white); m.set(3, 7, 8, p.brass); m.set(6, 7, 1, p.brass); m.box(4, 7, 7, 5, 9, 8, p.glass); m.box(5, 7, 2, 6, 9, 3, p.glass); m.set(4, 9, 7, p.glass); m.set(5, 9, 2, p.glass); });
    const palm = () => G('palm', 12, 22, 12, (m) => { m.box(3, 0, 3, 9, 5, 9, I.urn); m.box(2, 4, 2, 10, 5, 10, p.gold); m.box(5, 5, 5, 7, 14, 7, I.walnut); for (let a = 0; a < 7; a++) { const t = a / 7 * Math.PI * 2; m.line(6, 14, 6, 6 + Math.cos(t) * 6, 11 + (a % 2) * 2, 6 + Math.sin(t) * 6, a % 2 ? I.leaf : I.leafD); m.line(6, 15, 6, 6 + Math.cos(t + .4) * 5, 13, 6 + Math.sin(t + .4) * 5, I.leaf); } });
    const desk = () => G('wdesk', 14, 9, 6, (m) => { m.box(0, 6, 0, 14, 7, 6, I.greenM); m.box(0, 0, 0, 2, 6, 6, I.walnut); m.box(12, 0, 0, 14, 6, 6, I.walnut); m.box(6, 7, 2, 7, 9, 3, p.brass); m.set(6, 8, 3, I.lampA); m.box(3, 7, 2, 5, 7, 4, I.cloth); m.box(9, 7, 1, 11, 8, 2, p.brass); });
    const mannequin = (col) => G('mnq' + col, 4, 15, 3, (m) => { m.box(1, 0, 1, 3, 1, 2, p.black); m.box(2, 1, 1, 2, 5, 2, p.black); m.box(1, 1, 1, 3, 7, 2, col); m.box(0, 7, 0, 4, 12, 3, col); m.box(1, 12, 1, 3, 14, 2, I.skin); m.box(1, 14, 0, 3, 15, 3, col); });
    const rack = (seed) => G('rack' + seed, 14, 13, 5, (m) => { m.box(0, 0, 1, 1, 13, 4, I.steelD); m.box(13, 0, 1, 14, 13, 4, I.steelD); m.box(0, 12, 2, 14, 13, 3, I.steelD); m.box(0, 0, 0, 1, 1, 5, I.steelD); m.box(13, 0, 0, 14, 1, 5, I.steelD); const cs = [I.pink, I.blue, I.velvet, I.cream2, I.teal, I.yellow, I.velvetG]; for (let x = 1; x < 13; x++) { const k = (x * 7 + seed * 3) % cs.length, len = 4 + ((x * 5 + seed) % 4); m.box(x, 12 - len, 1, x + 1, 12, 4, cs[k]); m.set(x, 12, 2, p.brass); if ((x + seed) % 3 === 0) m.box(x, 11 - len, 1, x + 1, 12 - len, 4, cs[k]); } });
    const counterG = (kind) => G('ctr' + kind, 16, 8, 6, (m) => { m.box(0, 0, 0, 16, 5, 6, I.walnut); m.box(0, 5, 0, 16, 8, 6, p.glass); m.box(0, 7, 0, 16, 8, 6, p.brass); m.box(0, 5, 0, 16, 6, 6, I.cream2); const cs = kind === 'p' ? [I.pink, I.teal, p.gold, I.rose] : kind === 'h' ? [I.velvet, I.blue, p.black, I.cream2] : [I.walnut, p.black, I.cream2, I.rose]; for (let x = 1; x < 15; x += 2) m.box(x, 6, 2, x + 1, 7, 4, cs[x % 4]); m.box(0, 0, 0, 16, 1, 6, p.black); });
    const hatstand = () => G('hats', 6, 13, 6, (m) => { m.box(2, 0, 2, 4, 1, 4, p.brass); m.box(2.5, 1, 2.5, 3.5, 12, 3.5, p.brass); [[0, 11, 2, I.velvet], [4, 9, 3, I.blue], [2, 7, 0, p.black], [2, 10, 4, I.cream2]].forEach(([x, y, z, cc]) => m.box(x, y, z, x + 2, y + 2, z + 2, cc)); });
    const mirror = () => G('mirror', 8, 18, 2, (m) => { m.box(0, 0, 0, 8, 18, 2, p.gold); m.box(1, 1, 1, 7, 17, 2, c(0xcfe0e8, { jitter: 0.05, edge: 0.6 })); });
    const shoes = () => G('shoes', 16, 16, 4, (m) => { m.box(0, 0, 0, 16, 16, 1, I.walnut); for (let y = 2; y < 16; y += 4) { m.box(0, y - 1, 0, 16, y, 4, I.walnut); for (let x = 1; x < 15; x += 3) m.box(x, y, 1, x + 2, y + 1, 4, [p.black, I.walnut, I.velvet, I.cream2][(x + y) % 4]); } });
    const radio = () => G('radio', 6, 9, 4, (m) => { m.box(0, 0, 0, 6, 9, 4, I.walnut); m.box(1, 5, 3, 5, 8, 4, c(0xc8a878)); m.box(1, 2, 3, 5, 4, 4, I.dial); m.set(2, 1, 3, p.brass); m.set(4, 1, 3, p.brass); });
    const toyshelf = () => G('toys', 16, 16, 5, (m) => { m.box(0, 0, 0, 16, 16, 1, I.walnut); const cs = [I.velvet, I.blue, I.yellow, I.green, I.pink, I.teal]; for (let y = 3; y < 16; y += 4) { m.box(0, y - 1, 0, 16, y, 5, I.walnut); for (let x = 1; x < 15; x += 2) m.box(x, y, 1 + (x % 3), x + 1 + (x % 2), y + 1 + (x % 3 === 0 ? 1 : 0), 3 + (x % 3), cs[(x + y) % 6]); } });
    const horse = () => G('horse', 4, 10, 12, (m) => { m.box(1, 0, 0, 3, 1, 12, I.velvet); m.box(1, 1, 3, 3, 4, 4, I.cream2); m.box(1, 1, 8, 3, 4, 9, I.cream2); m.box(0, 4, 2, 4, 7, 10, I.cream2); m.box(1, 7, 8, 3, 10, 11, I.cream2); m.box(1, 8, 10, 3, 9, 12, p.black); m.box(1, 5, 1, 3, 7, 2, p.black); m.box(0, 7, 4, 4, 8, 7, I.velvet); });
    const teaTable = () => G('tea', 8, 7, 8, (m) => { m.box(0, 5, 0, 8, 6, 8, I.cloth); m.box(3, 0, 3, 5, 5, 5, p.brass); m.box(2, 6, 2, 3, 7, 3, I.cloth); m.box(5, 6, 5, 6, 7, 6, I.cloth); m.box(3, 6, 4, 5, 7, 5, I.teal); m.set(4, 7, 4, I.cream2); });
    const bed = () => G('bed', 12, 8, 17, (m) => { m.box(0, 0, 0, 12, 8, 1, I.walnut); m.box(0, 2, 1, 12, 4, 17, I.walnut); m.box(0, 4, 1, 12, 5, 17, I.cloth); m.box(1, 5, 1, 11, 6, 4, I.cloth); m.box(0, 4, 6, 12, 6, 17, I.velvet); m.box(0, 0, 16, 12, 5, 17, I.walnut); });
    const wardrobe = () => G('ward', 10, 18, 5, (m) => { m.box(0, 0, 0, 10, 18, 5, I.walnut); m.box(4, 8, 5, 5, 11, 5, p.brass); m.box(5, 0, 4, 5, 17, 5, p.black); m.set(4, 9, 4, p.brass); m.set(5, 9, 4, p.brass); });
    const floorLamp = () => G('flamp', 4, 15, 4, (m) => { m.box(1, 0, 1, 3, 1, 3, p.brass); m.box(1.5, 1, 1.5, 2.5, 12, 2.5, p.brass); m.box(0, 12, 0, 4, 15, 4, I.cream2); m.box(1, 12, 1, 3, 14, 3, I.lampA); });
    const cage = () => G('cage', 24, 26, 3, (m) => { // teller cage front: marble counter + brass grille with a window
      m.box(0, 0, 0, 24, 9, 3, I.cream); m.box(0, 0, 2, 24, 1, 3, I.greenM); m.box(0, 9, 0, 24, 10, 3, I.greenM);
      for (let x = 0; x < 24; x += 2) if (x < 8 || x > 15) m.box(x, 10, 1, x + 1, 24, 2, p.brass); else m.box(x, 17, 1, x + 1, 24, 2, p.brass);
      m.box(0, 24, 0, 24, 26, 3, p.brass); m.box(8, 16, 1, 16, 17, 2, p.brass); m.box(10, 25, 2, 14, 26, 3, I.lampA); m.box(0, 10, 0, 1, 26, 3, I.walnut); m.box(23, 10, 0, 24, 26, 3, I.walnut);
    });
    const ropeLine = () => G('rope', 32, 8, 2, (m) => { for (const x of [0, 15, 30]) { m.box(x, 0, 0, x + 2, 1, 2, p.brass); m.box(x + 0.5, 1, 0.5, x + 1.5, 7, 1.5, p.brass); m.box(x, 7, 0, x + 2, 8, 2, p.gold); } for (let x = 2; x < 30; x++) if (x !== 15 && x !== 16) m.set(x, 5 + (Math.abs((x % 15) - 8) < 4 ? 0 : 1), 1, I.velvet); });
    const vaultDoor = () => G('vdoor', 25, 25, 4, (m) => { for (let z = 0; z < 4; z++) for (let x = 0; x < 25; x++) for (let y = 0; y < 25; y++) { const r = Math.hypot(x + .5 - 12.5, y + .5 - 12.5); if (r < 12.5) m.set(x, y, z, r > 10.5 ? I.steelD : r > 9.5 ? p.brass : r < 2 ? p.gold : I.steel); } for (let a = 0; a < 3; a++) { const t = a / 3 * Math.PI * 2; m.line(12.5, 12.5, 4, 12.5 + Math.cos(t) * 6, 12.5 + Math.sin(t) * 6, 4, p.gold); } });
    const goldShelf = () => G('gshelf', 16, 14, 5, (m) => { m.box(0, 0, 0, 1, 14, 5, I.steelD); m.box(15, 0, 0, 16, 14, 5, I.steelD); for (let y = 0; y < 14; y += 4) { m.box(0, y, 0, 16, y + 1, 5, I.steelD); if (y < 12) for (let x = 1; x < 15; x += 2) for (let z = 1; z < 5; z += 2) m.box(x, y + 1, z, x + 2, y + 2 + (x % 4 === 1 ? 1 : 0), z + 1, I.goldBar); } });
    const clock = () => G('clock', 14, 14, 2, (m) => { for (let x = 0; x < 14; x++) for (let y = 0; y < 14; y++) { const r = Math.hypot(x + .5 - 7, y + .5 - 7); if (r < 7) m.box(x, y, 0, x + 1, y + 1, 1, r > 6 ? p.gold : I.cream2); } for (let a = 0; a < 12; a++) { const t = a / 12 * Math.PI * 2; m.set(7 + Math.cos(t) * 5, 7 + Math.sin(t) * 5, 1, p.black); } m.line(7, 7, 1, 7, 11, 1, p.black); m.line(7, 7, 1, 10, 7, 1, p.black); });
    const mic = () => G('mic', 4, 15, 4, (m) => { m.box(1, 0, 1, 3, 1, 3, p.black); m.box(1.5, 1, 1.5, 2.5, 12, 2.5, I.steel); m.box(1, 12, 1, 3, 15, 3, I.steel); m.box(1, 13, 1, 3, 14, 3, p.black); });
    const piano = () => G('piano', 12, 10, 6, (m) => { m.box(0, 0, 0, 12, 10, 4, p.black); m.box(0, 5, 4, 12, 6, 6, p.black); m.box(1, 6, 4, 11, 6, 5, I.cloth); m.box(0, 0, 4, 1, 5, 6, p.black); m.box(11, 0, 4, 12, 5, 6, p.black); m.box(1, 6, 4, 11, 7, 5, I.cloth); });
    const drums = () => G('drums', 10, 8, 8, (m) => { m.sphere(5, 3, 4, 3, I.velvet); m.box(2, 0, 3, 8, 3, 5, I.cloth); m.box(1, 5, 6, 3, 6, 8, I.cloth); m.box(7, 5, 6, 9, 6, 8, I.cloth); m.box(0, 7, 1, 3, 8, 3, p.gold); m.box(8, 6, 1, 1e0 + 9, 7, 3, p.gold); m.box(1, 0, 1, 2, 7, 2, I.steel); });
    const bass = () => G('bass', 5, 16, 3, (m) => { m.box(1, 1, 0, 4, 5, 3, I.walnut); m.box(1.5, 5, 0, 3.5, 8, 3, I.walnut); m.box(1, 8, 0, 4, 11, 3, I.walnut); m.box(2, 11, 1, 3, 16, 2, p.black); });
    const seat = () => G('seat', 5, 7, 5, (m) => { m.box(0, 2, 0, 5, 3, 4, I.velvet); m.box(0, 3, 0, 5, 7, 1, I.velvet); m.box(0, 0, 0, 1, 5, 4, p.black); m.box(4, 0, 0, 5, 5, 4, p.black); });
    const consoleM = () => G('console', 24, 9, 7, (m) => { m.box(0, 0, 0, 24, 6, 5, I.steelD); m.box(0, 6, 0, 24, 9, 2, I.steelD); for (let x = 1; x < 23; x += 2) { m.set(x, 6, 3, x % 4 === 1 ? I.dial : p.black); m.set(x, 7, 1, I.dial); m.set(x, 8, 1, x % 6 === 1 ? I.onAir : I.grnLamp); } m.box(0, 5, 0, 24, 6, 7, I.steelD); });
    const bell = () => G('bell', 3, 3, 3, (m) => { m.box(0, 0, 0, 3, 1, 3, p.brass); m.box(1, 1, 1, 2, 3, 2, p.gold); });
    const bench = () => G('bench', 16, 7, 5, (m) => { m.box(0, 3, 0, 16, 4, 5, I.walnut); m.box(0, 4, 0, 16, 7, 1, I.walnut); m.box(0, 0, 1, 1, 3, 4, p.black); m.box(15, 0, 1, 16, 3, 4, p.black); });
    const ceilLamp = (x0, z0, x1, z1, y, step) => { for (let x = x0 + step / 2; x < x1; x += step) for (let z = z0 + step / 2; z < z1; z += step) W.fill(x - 0.25, y - 0.25, z - 0.25, x + 0.25, y, z + 0.25, I.lampA); };
    const light = (x, y, z, r = 12, col = 0xffd49a, i = 1.2) => AF.addLight({ x, y, z, color: col, intensity: i, range: r, kind: 'interior' });
    const spot = (building, x, y, z, yaw, kind, path) => AF.addSpot(path ? { building, x, y, z, yaw, kind, path } : { building, x, y, z, yaw, kind });
    const Y0 = 0, Y1 = Math.PI / 2, Y2 = Math.PI, Y3 = -Math.PI / 2;
    const check = (x0, z0, x1, z1, y, a, b, sq = 1) => { for (let x = x0; x < x1; x += sq) for (let z = z0; z < z1; z += sq) W.fill(x, y, z, Math.min(x + sq, x1), y + 0.25, Math.min(z + sq, z1), ((Math.floor((x - x0) / sq) + Math.floor((z - z0) / sq)) & 1) ? a : b); };
    // stairs: rising along dir ('+x','-x','+z','-z') from the start edge; w = the other extent. clears headroom above (cuts the floor above)
    const stair = (x0, z0, x1, z1, dir, yA, yB, col, rail) => {
      const n = Math.round((yB - yA) / 0.25), along = dir[1] === 'x' ? x1 - x0 : z1 - z0, run = along / n;
      for (let i = 0; i < n; i++) {
        const top = yA + (i + 1) * 0.25; let a, b;
        if (dir === '+x') { a = [x0 + i * run, z0]; b = [x0 + (i + 1) * run, z1]; } else if (dir === '-x') { a = [x1 - (i + 1) * run, z0]; b = [x1 - i * run, z1]; }
        else if (dir === '+z') { a = [x0, z0 + i * run]; b = [x1, z0 + (i + 1) * run]; } else { a = [x0, z1 - (i + 1) * run]; b = [x1, z1 - i * run]; }
        W.fill(a[0], yA, a[1], b[0], top, b[1], col);
        W.clear(a[0], top, a[1], b[0], top + 2.75, b[1]);
      }
    };
    const onFloor = (x, y, z) => !AF.solidAt(x, y + 0.3, z) && !AF.solidAt(x, y + 1.5, z);
    // ---------------------------------------------------------- v2 materials (pat/rough/metal) + dressing helpers
    const MAT = AF.MAT || {};
    const carp = (hex) => c(hex, { pat: 'none', patTop: 'carpet', rough: 1, jitter: 0.12 });
    Object.assign(I, {
      mCream: c(0xece4d4, { rough: 0.22, pat: 'marble', jitter: 0.08 }), mRose: c(0xd9b2a4, { rough: 0.22, pat: 'marble', jitter: 0.08 }),
      mVerde: c(0x3f7a68, { rough: 0.2, pat: 'marble', jitter: 0.1 }), mBlack: c(0x28272d, { rough: 0.16, pat: 'marble', jitter: 0.06 }),
      mGold: c(0xe8c070, { rough: 0.25, pat: 'marble', jitter: 0.08 }),
      brassM: MAT.brass || p.brass, goldM: MAT.gold || p.gold, chromeM: MAT.chrome || I.steel, bronzeM: MAT.bronze || p.bronze,
      parqM: c(0xa8773f, { pat: 'none', patTop: 'parquet', rough: 0.4, jitter: 0.15 }), panel: c(0x6e4526, { pat: 'panel', patTop: 'plank', rough: 0.5, jitter: 0.12 }),
      carpRose: carp(0xa8505a), carpTeal: carp(0x2f6f6a), carpRed: carp(0x8e2330), carpBlue: carp(0x2e4a7a), carpGold: carp(0xb08a3a), carpGreen: carp(0x35603f),
      paperA: c(0xe8d8b0, { smooth: true }), paperB: c(0xd2b98a, { smooth: true }),
      paperG: c(0xa9bfa0, { smooth: true }), paperG2: c(0x8fa888, { smooth: true }),
      paperR: c(0xd8a898, { smooth: true }), paperR2: c(0xc48a7c, { smooth: true }),
      paperT: c(0x8fbcb4, { smooth: true }), paperT2: c(0x76a49c, { smooth: true }),
      coffer: c(0xf2e8cc, { smooth: true }), cofferB: c(0xcdb68a, { pat: 'none', jitter: 0.08, edge: 0.3 }),
      alab: c(0xfff0d2, { emit: 0xffcf88, emitK: 2.4, mode: 'always', jitter: 0, edge: 0 }), shade: c(0xf2e0b8, { emit: 0xffc878, emitK: 0.9, mode: 'always', jitter: 0, solid: false }),
      shadeG: c(0x3f8a5a, { emit: 0x80ffa0, emitK: 0.35, mode: 'always', jitter: 0 }), frost: c(0xf8f4ea, { emit: 0xfff0d0, emitK: 1.8, mode: 'always', jitter: 0 }),
    });
    const GL = AF.col('glass');
    const ring = (x0, z0, x1, z1, fn) => {   // inner perimeter blocks of a room: fn(x, z, outsideX, outsideZ, u)
      for (let x = x0; x < x1 - 0.01; x += 0.25) { fn(x, z0, x + 0.125, z0 - 0.125, x - x0); fn(x, z1 - 0.25, x + 0.125, z1 + 0.125, x - x0); }
      for (let z = z0 + 0.25; z < z1 - 0.26; z += 0.25) { fn(x0, z, x0 - 0.125, z + 0.125, z - z0); fn(x1 - 0.25, z, x1 + 0.125, z + 0.125, z - z0); }
    };
    // wall dressing: only fills EMPTY inner-ring cells whose outside neighbour is a solid non-glass wall (keeps doors + windows open)
    const dress = (x0, z0, x1, z1, y0, y1, colFn) => ring(x0, z0, x1, z1, (x, z, ox, oz, u) => { for (let y = y0; y < y1 - 0.01; y += 0.25) { const o = W.getM(ox, y + 0.125, oz); if (!o || o === GL || o === p.glass) continue; if (W.getM(x + 0.125, y + 0.125, z + 0.125)) continue; const cc = colFn(u, y); if (cc) W.fill(x, y, z, x + 0.25, y + 0.25, z + 0.25, cc); } });
    const stripes = (a, b, per = 0.5) => (u) => (Math.floor(u / per + 1e-6) & 1) ? a : b;
    // fixtures: real models (rod + shade), 5 designs so no two rooms share a pendant
    const pendFn = (kind) => (m) => {
      m.box(3.5, 6, 3.5, 4.5, 12, 4.5, I.brassM); m.box(2.5, 11, 2.5, 5.5, 12, 5.5, I.brassM);
      if (kind === 'bowl') { m.box(1, 3, 1, 7, 5, 7, I.alab); m.box(2, 2, 2, 6, 3, 6, I.alab); m.box(0, 5, 0, 8, 6, 8, I.brassM); m.box(3, 1, 3, 5, 2, 5, I.brassM); for (const [x, z] of [[0, 0], [7, 0], [0, 7], [7, 7]]) m.box(x, 5, z, x + 1, 7, z + 1, I.brassM); }
      else if (kind === 'globe') { m.sphere(4, 3.5, 4, 3.2, I.frost); m.box(2, 6, 2, 6, 7, 6, I.brassM); m.box(3.5, 0, 3.5, 4.5, 1, 4.5, I.brassM); }
      else if (kind === 'tier') { m.box(0, 2, 0, 8, 3, 8, I.alab); m.box(1, 3, 1, 7, 4, 7, I.goldM); m.box(1.5, 4, 1.5, 6.5, 5, 6.5, I.alab); m.box(2.5, 5, 2.5, 5.5, 6, 5.5, I.goldM); m.box(3, 0, 3, 5, 2, 5, I.alab); m.box(0, 1, 0, 8, 2, 8, I.goldM); }
      else if (kind === 'drum') { for (let y = 2; y < 6; y++) for (let x = 0; x < 8; x++) for (let z = 0; z < 8; z++) if (x === 0 || z === 0 || x === 7 || z === 7) m.set(x, y, z, I.shade); m.box(2, 3, 2, 6, 4, 6, I.alab); m.box(0, 6, 0, 8, 6.5, 8, I.brassM); m.box(0, 1.5, 0, 8, 2, 8, I.brassM); }
      else if (kind === 'green') { m.box(1, 3, 1, 7, 5, 7, I.shadeG); m.box(0, 2, 0, 8, 3, 8, I.shadeG); m.box(2, 1, 2, 6, 2, 6, I.alab); m.box(3, 5, 3, 5, 6, 5, I.brassM); }
      else { m.box(0, 4, 0, 8, 5, 8, I.brassM); m.box(1, 3, 1, 7, 4, 7, I.frost); for (let a = 0; a < 8; a++) { const t = a / 8 * Math.PI * 2; m.set(4 + Math.cos(t) * 3.5, 5, 4 + Math.sin(t) * 3.5, I.goldM); } }   // 'deco' flush-ish
    };
    const pendant = (kind) => G('pend' + kind, 8, 12, 8, pendFn(kind));
    const pendantS = (kind) => G('pendS' + kind, 8, 12, 8, pendFn(kind), 1 / 12);   // 0.67 x 1.0 m, for low-ceilinged rooms
    // coffered ceiling: slab at [y-0.25,y), beams hang to y-0.5 every `step` m (gold every 3rd), gold rosette in each coffer; skip(x,z) keeps holes
    const cofferCeil = (x0, z0, x1, z1, y, step, skip) => { for (let x = x0; x < x1 - 0.01; x += 0.25) for (let z = z0; z < z1 - 0.01; z += 0.25) { if (skip && skip(x, z)) continue; const gx = Math.round((x - x0) / 0.25) % Math.round(step / 0.25), gz = Math.round((z - z0) / 0.25) % Math.round(step / 0.25), hc = Math.round(step / 0.5); W.fill(x, y - 0.25, z, x + 0.25, y, z + 0.25, (gx === hc && gz === hc) ? I.goldM : I.coffer); if (gx === 0 || gz === 0) W.fill(x, y - 0.5, z, x + 0.25, y - 0.25, z + 0.25, ((Math.round((x - x0) / step) % 3 === 0 && gx === 0) || (Math.round((z - z0) / step) % 3 === 0 && gz === 0)) ? I.goldM : I.cofferB); } };
    const lamps = (kind, x0, z0, x1, z1, yc, step) => { for (let x = x0 + step / 2; x < x1; x += step) for (let z = z0 + step / 2; z < z1; z += step) put(pendant(kind), x, yc - 1.5, z, 0, false); };
    const sconce = () => G('sconce', 4, 6, 2, (m) => { m.box(1, 0, 0, 3, 6, 1, I.brassM); m.box(0, 2, 0, 4, 5, 2, I.alab); m.box(0, 5, 0, 4, 6, 2, I.goldM); m.box(1, 1, 1, 3, 2, 2, I.goldM); });
    const hsign = (txt, fg, bg) => { const t = AF.textModel(txt, fg, { bg, pad: 1 }); return AF.meshModel(t, { vs: 1 / 16, anchor: [0.5, 0, 0.5] }); };
    const rodG = () => G('rod', 1, 8, 1, (m) => m.box(0, 0, 0, 1, 8, 1, I.brassM));
    const hangSign = (txt, x, yc, z, rot = 0, fg = I.goldM, bg = I.blackM) => { const g = hsign(txt, fg, bg), e = 0.07; put(g, x - (rot % 2 ? e : 0), yc - 1.6, z - (rot % 2 ? 0 : e), rot, false); put(g, x + (rot % 2 ? e : 0), yc - 1.6, z + (rot % 2 ? 0 : e), rot + 2, false); const off = (6 * txt.length + 2) / 16 * 0.35; for (const dx of [-1, 1]) { const rx = rot % 2 ? x : x + dx * off, rz = rot % 2 ? z + dx * off : z; put(rodG(), rx, yc - 1.05, rz, 0, false); } };

    // ================================================================ HARBOUR TRUST BANK — banking hall + vault
    try {
      const B = 'harbour-trust';
      AF.addBuilding({ id: B, name: 'Harbour Trust Bank', kind: 'bank', box: [10, 0.25, -147, 50, 38, -104], doors: [{ x: 8.5, y: 0.25, z: -125, yaw: Y1 }], floors: [0.5], interior: true });
      W.clear(11, 0.5, -137, 42, 11, -113);
      W.fill(11, 0.25, -137, 42, 0.5, -113, I.mCream);
      for (let x = 12.5; x < 42; x += 3) W.fill(x, 0.25, -137, x + 0.25, 0.5, -113, I.mVerde);
      for (let z = -135.5; z < -113; z += 3) W.fill(11, 0.25, z, 42, 0.5, z + 0.25, I.mVerde);
      W.fill(11, 0.25, -137, 42, 0.5, -136.25, I.mBlack); W.fill(11, 0.25, -113.75, 42, 0.5, -113, I.mBlack); W.fill(11, 0.25, -137, 11.75, 0.5, -113, I.mBlack);
      W.fill(11, 0.25, -137, 42, 0.5, -136.5, p.gold); W.fill(11, 0.25, -113.5, 42, 0.5, -113, p.gold);
      for (let x = 22; x < 32; x += 0.25) for (let z = -129; z < -121; z += 0.25) { const r = Math.hypot(x + 0.125 - 26.5, z + 0.125 - -125); if (r < 3.5) W.fill(x, 0.25, z, x + 0.25, 0.5, z + 0.25, r < 1 ? p.gold : ((Math.atan2(x - 26.5, z + 125) * 8 / Math.PI + 16 | 0) % 2 ? I.rose : I.cream)); }
      W.walls(11, 0.5, -137, 42, 3, -113, I.mVerde); W.walls(11, 3, -137, 42, 3.25, -113, I.goldM);
      for (let x = 13; x < 41; x += 4) for (const z of [-137, -113.25]) W.fill(x, 0.5, z, x + 0.75, 11, z + 0.25, I.cream);   // pilasters
      W.walls(11, 10.5, -137, 42, 11, -113, I.goldM);
      W.walls(11, 9.75, -137, 42, 10, -113, I.goldM);
      dress(11, -137, 42, -113, 3.25, 10.5, (u, y) => (y >= 9.75 && y < 10) ? 0 : ((Math.floor(u / 1.5) & 1) && y > 3.5 && y < 9.5 ? I.mRose : I.mCream));
      for (let x = 14.75; x < 41; x += 4) for (const z of [-136.75, -113.5]) put(sconce(), x, 5.5, z + (z < -120 ? 0.1 : 0.15), z < -120 ? 0 : 2, false);
      for (let x = 11.5; x + 2.5 <= 42; x += 3) for (let z = -136.5; z + 2.5 <= -113; z += 3) { W.clear(x, 11, z, x + 2.5, 11.5, z + 2.5); W.fill(x, 11.5, z, x + 2.5, 11.75, z + 2.5, I.cream2); W.fill(x + 1, 11.25, z + 1, x + 1.5, 11.5, z + 1.5, p.gold); }
      // tall windows through the west wall (daylight)
      for (const z of [-135.5, -133, -117.5, -115]) { W.clear(10, 5, z, 11, 10, z + 1.5); W.fill(10.25, 5, z, 10.5, 10, z + 1.5, p.glass); W.fill(10.5, 5, z, 11, 5.25, z + 1.5, p.gold); }
      W.clear(9.5, 0.5, -127, 11.25, 5, -123);
      // teller cages x8 along the north (z -131..-130.5); staff zone behind
      for (let i = 0; i < 8; i++) {
        const x = 15.5 + i * 3 + 1.5; put(cage(), x, 0.5, -130.6, 0);
        put(G('nameplate', 8, 2, 1, (m) => { m.box(0, 0, 0, 8, 2, 1, I.goldM); m.box(1, 0.5, 0, 7, 1.5, 1, I.blackM); }), x, 1.63, -130.3, 0, false);
        W.fill(x + 1.5 - 0.125, 0.5, -134, x + 1.5 + 0.125, 2.75, -131, I.walnut);
        spot(B, x, 0.5, -132, Y0, 'work'); spot(B, x, 0.5, -129.2, Y2, 'counter', [[8.5, -125], [13, -125], [x, -127], [x, -129.2]]);
        put(chair(I.velvetG), x, 0.5, -132.8, 0, false);
      }
      W.fill(15.5, 0.5, -131, 15.75, 3.25, -130.25, I.walnut); W.fill(39.25, 0.5, -131, 39.5, 3.25, -130.25, I.walnut);
      // writing desks, rope queue, lamps, palms
      for (const x of [18, 26.5, 35]) { put(desk(), x, 0.5, -118, 2); spot(B, x, 0.5, -117, Y2, 'stand', [[8.5, -125], [13, -125], [x, -120], [x, -117]]); }
      put(ropeLine(), 26.5, 0.5, -127.5, 0, false); put(ropeLine(), 26.5, 0.5, -125.5, 0, false);
      for (let k = 0; k < 4; k++) spot(B, 20 + k * 1.6, 0.5, -126.5, Y1, 'stand', [[8.5, -125], [13, -125], [18, -126.5], [20 + k * 1.6, -126.5]]);
      for (const [x, z] of [[12.5, -135.5], [12.5, -114.5], [40.5, -135.5], [40.5, -114.5]]) put(palm(), x, 0.5, z, 0);
      for (const x of [17, 26.5, 36]) for (const z of [-128.5, -119.5]) { put(chand(), x, 9, z, 0, false); light(x, 9.5, z, 14); }
      put(clock(), 41.8, 6.5, -125, 3, false);
      // HARBOUR MURAL over the cages (north wall): golden sky, the Beacon lighthouse, steamers, the city — framed in gold
      for (let x = 16; x < 38; x += 0.25) for (let y = 6.25; y < 9.5; y += 0.25) {
        const u = (x - 16) / 22, v = (y - 6.25) / 3.25, edge = x < 16.25 || x >= 37.75 || y < 6.5 || y >= 9.25;
        const lh = Math.abs(u - 0.14) < 0.012 && v < 0.78 && v > 0.22, lamp = Math.abs(u - 0.14) < 0.02 && v >= 0.78 && v < 0.86, ship = (Math.abs(u - 0.42) < 0.07 && v > 0.22 && v < 0.3) || (Math.abs(u - 0.44) < 0.012 && v >= 0.3 && v < 0.42) || (Math.abs(u - 0.68) < 0.05 && v > 0.24 && v < 0.3);
        const tw = [[0.8, 0.62], [0.85, 0.8], [0.9, 0.55], [0.95, 0.7]].some(([cx, h]) => Math.abs(u - cx) < 0.018 && v < h && v > 0.2);
        const sun = Math.hypot((u - 0.58) * 6.8, v - 0.36) < 0.16;
        const col = edge ? I.goldM : lamp ? I.sun : lh ? I.cream2 : ship ? I.sil : tw ? I.sil : v < 0.22 ? ((((x * 4) | 0) + ((y * 4) | 0)) % 4 === 0 ? I.sky1 : I.sea) : sun ? I.sun : v < 0.5 ? I.sky1 : v < 0.75 ? I.rose : I.sky2;
        W.fill(x, y, -137, x + 0.25, y + 0.25, -136.75, col);
      }
      const fclock = G('fclock', 8, 28, 8, (m) => { m.box(1, 0, 1, 7, 1, 7, I.mBlack); m.box(2, 1, 2, 6, 2, 6, I.brassM); m.box(3, 2, 3, 5, 20, 5, I.brassM); m.box(2, 12, 2, 6, 13, 6, I.goldM); m.box(0, 20, 0, 8, 27, 8, I.brassM); for (const [a, b2, c2, d2] of [[1, 0, 7, 1], [1, 7, 7, 8]]) m.box(a, 21, b2, c2, 26, d2, I.cream2); m.box(0, 21, 1, 1, 26, 7, I.cream2); m.box(7, 21, 1, 8, 26, 7, I.cream2); for (const [x, z] of [[4, 0], [4, 7]]) { m.set(x, 23, z, p.black); m.set(x, 24, z, p.black); m.set(x - 1, 23, z, p.black); } m.box(3, 27, 3, 5, 28, 5, I.goldM); });
      put(fclock, 26.5, 0.5, -120.2, 0);
      const ticker = G('ticker', 6, 12, 6, (m) => { m.box(1, 0, 1, 5, 7, 5, I.walnut); m.box(0, 7, 0, 6, 8, 6, I.brassM); m.box(2, 8, 2, 4, 10, 4, I.brassM); m.sphere(3, 9, 3, 2.9, p.glass, (x, y) => y >= 8 ? p.glass : 0); m.box(3, 1, 5, 4, 8, 6, I.cloth); m.box(3, 0, 6, 5, 1, 6, I.cloth); });
      put(ticker, 36.8, 0.5, -122, 0); spot(B, 37.8, 0.5, -122, Y3, 'stand', [[8.5, -125], [13, -125], [36, -123.5], [37.8, -122]]);
      const slips = G('slips', 12, 3, 5, (m) => { m.box(1, 0, 1, 4, 1, 4, I.cloth); m.box(2, 0, 2, 5, 1, 5, I.cream2); m.box(7, 0, 2, 9, 2, 4, p.black); m.set(8, 2, 3, I.brassM); m.line(9, 1, 1, 11, 3, 1, p.black); m.box(10, 0, 3, 12, 1, 5, I.goldM); });
      for (const x of [18, 26.5, 35]) put(slips, x, 1.375, -118.2, 2, false);
      // VAULT — round door standing open, room of safe-deposit boxes and gold bars
      W.clear(43, 0.5, -132, 49.5, 4.5, -118);
      W.fill(43, 0.25, -132, 49.5, 0.5, -118, I.steelD);
      W.walls(43, 0.5, -132, 49.5, 4.5, -118, p.bronze);
      for (let y = 0.75; y < 4.25; y += 0.5) { for (let x = 43.25; x < 49.25; x += 0.5) { W.setM(x, y, -131.75, p.brass); W.setM(x, y, -118.25, p.brass); } for (let z = -131.75; z < -118.25; z += 0.5) W.setM(49.25, y, z, p.brass); }
      for (let z = -126.75; z <= -123.25; z += 0.25) for (let y = 0.5; y < 4.25; y += 0.25) { const r = Math.hypot(z + 0.125 + 125, y + 0.125 - 2.25); if (r < 1.75) W.clear(41.75, y, z, 43.25, y + 0.25, z + 0.25); else if (r < 2.25) W.fill(41.5, y, z, 41.75, y + 0.25, z + 0.25, I.steelD); }
      put(vaultDoor(), 40.3, 0.6, -127.3, 0);
      for (const z of [-129.5, -121]) { put(goldShelf(), 46.5, 0.5, z, 0); }
      lamps('deco', 43, -132, 49.5, -118, 4.5, 3.5); light(46, 3.5, -125, 8, 0xfff0c0);
      spot(B, 40, 0.5, -122, Y3, 'stand', [[8.5, -125], [13, -125], [38, -122], [40, -122]]);  // guard
      spot(B, 46, 0.5, -125, Y1, 'work'); spot(B, 26.5, 0.5, -123, Y0, 'stand', [[8.5, -125], [26.5, -123]]);
      W.clear(9.5, 0.5, -127, 11.5, 5, -123);
      AF.test('downtown: bank doorway + vault reachable', () => { let ok = true, bad = ''; for (let x = 8.5; x < 48; x += 0.5) if (AF.solidAt(x, 1.3, -125) || AF.solidAt(x, 2.2, -125)) { ok = false; bad = x; break; } return { ok, info: ok ? 'door -> hall -> vault clear' : 'blocked at x ' + bad }; });
    } catch (e) { DT_FAIL.push('harbour-trust: ' + (e && e.message)); console.warn('[downtown] interior harbour-trust failed', e); }

    // ================================================================ GRAND SOLACE HOTEL — lobby, mezzanine, ballroom, guest rooms
    try {
      const B = 'grand-solace', hb = { x0: 10, z0: -72, x1: 72, z1: -10 };
      AF.addBuilding({ id: B, name: 'The Grand Solace Hotel', kind: 'hotel', box: [10, 0.25, -72, 72, 46, -10], doors: [{ x: 28, y: 0.25, z: -8.5, yaw: Y2 }], floors: [0.5, 4.5, 8.75], interior: true });
      D.base(10, -72, 72, -10, 4.5, 'S', { skip: [{ f: 'S', u: 28, w: 7 }, { f: 'S', u: 58, w: 26 }] });
      D.door(hb, 'S', 28, 6, 4.5, 1, { canopy: 4 });
      W.clear(12, 0.5, -40, 44, 8.5, -11);
      for (let x = 12; x < 44; x += 0.25) for (let z = -40; z < -11; z += 0.25) { const a = ((x + z) % 3 + 3) % 3, b = ((x - z) % 3 + 3) % 3; const e = a < 0.25 || b < 0.25; W.fill(x, 0.25, z, x + 0.25, 0.5, z + 0.25, e ? I.brassM : ((Math.floor((x + z) / 3) + Math.floor((x - z) / 3)) & 1) ? I.mRose : I.mCream); }
      W.fill(12, 0.25, -40, 44, 0.5, -39.25, I.mVerde); W.fill(12, 0.25, -11.75, 44, 0.5, -11, I.mVerde);
      W.fill(26, 0.25, -26, 30, 0.5, -11, I.carpet);
      W.walls(12, 0.5, -40, 44, 1.25, -11, I.mVerde); W.walls(12, 8, -40, 44, 8.5, -11, I.goldM);
      dress(12, -40, 44, -11, 1.25, 8, (u, y) => y < 1.5 ? I.goldM : y >= 7.5 ? I.cofferB : stripes(I.paperA, I.paperB, 0.5)(u));
      for (let x = 14; x < 44; x += 4) W.fill(x, 0.5, -11.25, x + 0.5, 8.5, -11, I.cream2);
      cofferCeil(12, -40, 44, -11, 8.5, 2, (x, z) => x >= 33.5 && x < 43 && z < -37.5);
      // mezzanine + columns + balustrade
      W.fill(12, 4.25, -40, 44, 4.5, -34, I.cream); W.fill(12, 4, -34.25, 44, 4.25, -34, p.gold);
      for (let x = 12; x < 44; x += 0.5) if (x < 25.5 || x >= 30.5) { W.fill(x, 4.5, -34.25, x + 0.25, 5.25, -34, p.brass); }
      W.fill(12, 5.25, -34.25, 25.5, 5.5, -34, p.gold); W.fill(30.5, 5.25, -34.25, 44, 5.5, -34, p.gold);
      for (const x of [15, 21, 34, 40]) { W.fill(x, 0.5, -34.5, x + 0.75, 8.5, -33.75, I.cream2); W.fill(x - 0.25, 7.75, -34.75, x + 1, 8.5, -33.5, p.gold); }
      // grand stair lobby -> mezzanine, then mezzanine -> guest corridor
      stair(26, -34, 30, -26, '-z', 0.5, 4.5, I.carpet);
      for (let i = 0; i < 16; i++) { const z = -26 - (i + 1) * 0.5; W.fill(25.75, 0.75 + i * 0.25, z, 26, 1.75 + i * 0.25, z + 0.5, p.brass); W.fill(30, 0.75 + i * 0.25, z, 30.25, 1.75 + i * 0.25, z + 0.5, p.brass); }
      W.clear(34, 4.5, -40, 43, 8.5, -38);
      stair(34, -40, 42.5, -38, '+x', 4.5, 8.75, I.carpet);
      // guest corridors (y 8.75) -> 4 rooms along the NORTH facade with real glass windows onto Charter St
      W.clear(12, 8.75, -44, 44.5, 11.5, -38); W.fill(12, 8.5, -44, 34, 8.75, -38, I.carpet); W.fill(42.5, 8.5, -44, 44.5, 8.75, -38, I.carpet);
      W.clear(42.5, 8.75, -64.25, 44.5, 11.5, -44); W.fill(42.5, 8.5, -64.25, 44.5, 8.75, -44, I.carpet);
      W.clear(12, 8.75, -64.25, 44.5, 11.5, -62.25); W.fill(12, 8.5, -64.25, 44.5, 8.75, -62.25, I.carpet);
      lamps('drum', 12, -44, 44, -38, 11.5, 4); lamps('drum', 42.5, -64, 44.5, -44, 11.5, 4); lamps('drum', 12, -64.25, 44, -62.25, 11.5, 4);
      dress(12, -44, 44.5, -38, 8.75, 11.5, (u, y) => y < 9.5 ? I.panel : stripes(I.paperG, I.paperG2, 0.375)(u)); dress(12, -64.25, 44.5, -62.25, 8.75, 11.5, (u, y) => y < 9.5 ? I.panel : stripes(I.paperG, I.paperG2, 0.375)(u));
      light(28, 10.5, -41, 12); light(43.5, 10.5, -54, 12); light(28, 10.5, -63, 12);
      for (let i = 0; i < 4; i++) {
        const x0 = 12 + i * 8 + 0.25, x1 = 20 + i * 8;
        W.clear(x0, 8.75, -71, x1, 11.5, -64.5); W.fill(x0, 8.5, -71, x1, 8.75, -64.5, [I.carpet, I.teal, I.velvetG, I.rose][i]);
        W.clear(x0 + 3, 8.75, -64.5, x0 + 4.75, 11.25, -64.25);
        for (const wx of [x0 + 1.25, x0 + 5]) { W.clear(wx, 9.5, -72.25, wx + 1.5, 11, -71); W.fill(wx, 9.5, -71.75, wx + 1.5, 11, -71.5, p.glass); W.fill(wx - 0.25, 9.25, -71.25, wx + 1.75, 9.5, -70.75, I.cream2); W.fill(wx - 0.25, 10.75, -71, wx + 1.75, 11.25, -70.75, I.velvet); }
        put(G('bedS' + i, 12, 8, 17, (m) => { const cover = [I.velvet, I.teal, I.velvetG, I.rose][i]; for (let x = 0; x < 12; x++) for (let y = 0; y < 8; y++) { const r = Math.hypot(x + 0.5 - 6, y + 0.5 - 1); if (y < 3 || r < 7) m.set(x, y, 0, r < 1.8 ? I.goldM : ((Math.atan2(y + 0.5 - 1, x + 0.5 - 6) * 5 / Math.PI) | 0) % 2 ? I.goldM : I.cream2); } m.box(0, 2, 1, 12, 4, 17, I.walnut); m.box(0, 4, 1, 12, 5, 17, I.cloth); m.box(1, 5, 1, 5, 6, 4, I.cloth); m.box(7, 5, 1, 11, 6, 4, I.cloth); m.box(0, 4, 7, 12, 6, 17, cover); m.box(0, 5, 5, 12, 6, 7, I.cloth); m.box(0, 0, 16, 12, 5, 17, I.walnut); m.box(0, 5, 16, 12, 6, 17, I.goldM); }), x0 + 2, 8.75, -70.9, 0); put(wardrobe(), x1 - 1, 8.75, -65.2, 2); put(floorLamp(), x0 + 4.4, 8.75, -70.6, 0, false); put(armchair(I.velvet), x1 - 1.4, 8.75, -69.5, 3);
        W.fill(x0 + 5.5, 9.5, -64.75, x0 + 7, 10.5, -64.5, p.gold);
        light(x0 + 4, 10.8, -67.5, 7); spot(B, x0 + 2, 9.25, -69.5, Y0, 'bed'); spot(B, x1 - 1.4, 9.1, -69.5, Y3, 'sit');
      }
      // luggage carts + bellhops
      const cart = G('cart', 10, 16, 14, (m) => { m.box(0, 1, 0, 10, 2, 14, p.brass); for (const [x, z] of [[0, 0], [9, 0], [0, 13], [9, 13]]) m.box(x, 0, z, x + 1, 1, z + 1, p.black); m.box(4, 2, 0, 6, 16, 1, p.brass); m.box(0, 15, 0, 10, 16, 1, p.brass); m.box(1, 2, 2, 9, 7, 7, I.walnut); m.box(2, 7, 3, 8, 10, 7, I.velvetG); m.box(1, 2, 8, 9, 5, 13, I.cream2); m.box(3, 5, 9, 7, 8, 12, I.velvet); m.box(4, 10, 4, 6, 11, 5, p.brass); });
      put(cart, 33, 0.5, -14.5, 0); put(cart, 14.5, 0.5, -37, 1); put(cart, 41.5, 0.5, -36, 3);
      spot(B, 32, 0.5, -16.5, Y2, 'stand', [[28, -8.5], [28, -13], [32, -16.5]]); spot(B, 24.5, 0.5, -13, Y0, 'stand', [[28, -8.5], [28, -13], [24.5, -13]]);
      spot(B, 25.2, 0.25, -8.6, Y0, 'stand');
      // reception desk + key rack + bell; elevator bank; lounge; palms; chandeliers
      W.fill(16, 0.5, -37, 24, 1.5, -36, I.cream); W.fill(16, 1.5, -37.25, 24, 1.75, -35.75, I.greenM); W.fill(16, 0.5, -36, 24, 1.5, -35.75, p.bronze);
      W.fill(16, 1.5, -40, 24, 3.5, -39.75, I.walnut); for (let x = 16.25; x < 24; x += 0.5) for (let y = 1.75; y < 3.5; y += 0.5) W.setM(x, y, -39.5, p.brass);
      const kr = AF.textModel('RECEPTION', p.gold, {}); AF.placeStatic(AF.meshModel(kr, { vs: 1 / 16, anchor: [0.5, 0, 0] }), 20, 3.55, -39.75, 0, { collide: false });
      put(bell(), 21, 1.75, -36.5, 0, false);
      spot(B, 18, 0.5, -38.5, Y0, 'work'); spot(B, 22, 0.5, -38.5, Y0, 'work');
      spot(B, 18, 0.5, -34.8, Y2, 'counter', [[28, -8.5], [28, -14], [18, -30], [18, -34.8]]); spot(B, 22, 0.5, -34.8, Y2, 'counter', [[28, -8.5], [28, -14], [22, -30], [22, -34.8]]);
      for (const z of [-31, -27, -23]) { W.fill(12, 0.5, z - 1, 12.25, 3.5, z + 1, p.bronze); W.fill(12.25, 0.5, z - 0.05, 12.5, 3.25, z + 0.05, p.black); W.fill(12, 3.75, z - 0.75, 12.25, 4.25, z + 0.75, p.goldLit); W.setM(12.25, 4, z, p.black); }
      for (const [x, z, r] of [[16, -16, 0], [16, -22, 2]]) { put(sofa(I.velvet), x + 2, 0.5, z, r); }
      for (const [x, z, r] of [[21.5, -18, 3], [21.5, -20, 3], [13.5, -19, 1]]) put(armchair(I.velvetG), x, 0.5, z, r);
      put(rtable(), 17.5, 0.5, -19, 0);
      for (const [x, z, yaw] of [[16.5, -15.4, Y0], [19.5, -15.4, Y0], [16.5, -22.6, Y2], [19.5, -22.6, Y2], [21.5, -18, Y3], [21.5, -20, Y3], [13.5, -19, Y1]]) spot(B, x, 0.9, z, yaw, 'sit', [[28, -8.5], [28, -13], [x, -13], [x, z]]);
      for (const [x, z] of [[13, -12], [43, -12], [24.5, -12], [31.5, -12], [13, -33], [43, -24]]) put(palm(), x, 0.5, z, 0);
      for (const [x, z] of [[20, -26], [36, -26], [28, -18]]) { put(chand(), x, 6.25, z, 0, false); light(x, 6.5, z, 14); }
      const booth = G('booth', 9, 22, 9, (m) => { m.box(0, 0, 0, 9, 22, 9, I.walnut); m.box(1, 1, 1, 8, 19, 9, 0); m.box(1, 1, 8, 8, 18, 9, p.glass); m.box(4, 1, 8, 5, 18, 9, I.walnut); m.box(1, 19, 8, 8, 21, 9, I.alab); m.box(2, 9, 1, 5, 13, 2, p.black); m.set(3, 12, 2, I.brassM); m.box(5, 5, 2, 8, 6, 5, I.walnut); m.box(3, 13, 2, 4, 14, 3, p.black); });
      for (const z of [-20.8, -18.4]) put(booth, 43.2, 0.5, z, 3);
      spot(B, 43.1, 0.5, -20.8, Y1, 'stand', [[28, -8.5], [28, -13], [41.5, -17], [43.1, -20.8]]);
      for (const [x, z] of [[36, -14], [36, -20]]) { put(armchair(I.velvet), x, 0.5, z, 1); put(armchair(I.velvet), x + 3, 0.5, z, 3); put(rtable(), x + 1.5, 0.5, z, 0); spot(B, x, 0.9, z, Y1, 'sit', [[28, -8.5], [28, -13], [x, -13], [x, z]]); }
      // street life at the canopy: a doorman in livery (static figure), luggage on the sidewalk, flower tubs
      const person = (coat, trim, cap) => G('man' + coat + cap, 6, 15, 4, (m) => { m.box(1, 0, 1, 3, 1, 3, p.black); m.box(3, 0, 1, 5, 1, 3, p.black); m.box(1, 1, 1, 5, 6, 3, I.blackM); m.box(1, 6, 0, 5, 11, 4, coat); m.box(2, 6, 0, 4, 11, 1, trim); m.box(0, 6, 1, 1, 10, 3, coat); m.box(5, 6, 1, 6, 10, 3, coat); m.set(0, 6, 2, I.skin); m.set(5, 6, 2, I.skin); m.box(2, 11, 1, 4, 13, 3, I.skin); m.set(2, 12, 3, p.black); m.set(3, 12, 3, p.black); m.box(1, 13, 0, 5, 15, 4, cap); m.box(1, 13, 3, 5, 14, 4, p.black); m.set(3, 14, 3, p.gold); for (let y = 7; y < 11; y += 2) m.set(3, y, 0, p.gold); });
      put(person(I.velvet, p.gold, I.velvet), 32.3, 0.25, -8.9, 0);
      AF._dtBell = { cart, man: person(I.velvet, p.gold, I.velvet) };
      const luggage = G('lug', 12, 10, 8, (m) => { m.box(0, 0, 0, 7, 5, 8, I.walnut); m.box(0, 2, 0, 7, 3, 8, p.brass); m.box(1, 5, 1, 6, 8, 7, I.velvetG); m.box(3, 8, 3, 4, 9, 5, p.black); m.box(8, 0, 1, 12, 7, 5, c(0xc8a878)); m.box(9, 7, 2, 11, 8, 4, p.black); m.box(8, 0, 5, 12, 3, 8, I.velvet); });
      put(luggage, 34.5, 0.25, -8.4, 0); put(luggage, 21.6, 0.25, -8.6, 1);
      // v2 guest rooms: 4 archetypes (honeymoon / travelling salesman / band-leader / family) — papered walls, coffered ceiling, own pendant, a story each
      try {
        const nstand = G('nstand', 5, 8, 5, (m) => { m.box(0, 0, 0, 5, 5, 5, I.walnut); m.box(0, 2, 4, 5, 3, 5, p.black); m.set(2, 3, 4, I.brassM); m.set(2, 1, 4, I.brassM); m.box(0, 5, 1, 3, 6, 4, p.black); m.box(0, 6, 1, 3, 7, 2, p.black); m.set(1, 6, 3, I.cream2); m.box(3, 5, 3, 4, 7, 4, I.brassM); m.box(3, 7, 2, 5, 8, 5, I.shade); });
        const radi = G('radi', 12, 5, 2, (m) => { for (let x = 0; x < 12; x += 2) m.box(x, 0, 0, x + 1, 5, 2, I.steel); m.box(0, 1, 0, 12, 2, 1, I.steel); });
        const suitcase = (tone) => G('osuit' + tone, 8, 7, 6, (m) => { m.box(0, 0, 0, 8, 2, 6, tone); m.box(1, 1, 1, 7, 2, 5, I.cream2); m.box(0, 2, 0, 8, 7, 1, tone); m.box(1, 3, 1, 7, 6, 1, I.cream2); m.box(1, 2, 1, 4, 3, 4, I.blue); m.box(4, 2, 2, 7, 3, 5, I.cloth); m.set(3, 1, 5, I.brassM); m.set(5, 1, 5, I.brassM); });
        const vanity = G('vanity', 10, 16, 5, (m) => { m.box(0, 0, 0, 10, 6, 4, I.walnut); m.box(1, 1, 4, 4, 5, 5, I.walnut); m.box(6, 1, 4, 9, 5, 5, I.walnut); m.set(2, 3, 4, I.brassM); m.set(7, 3, 4, I.brassM); m.sphere(5, 11, 0.5, 4.2, I.goldM, (x, y, z) => z === 0 ? I.goldM : 0); m.sphere(5, 11, 1.5, 3.3, 0, () => 0); m.box(2, 8, 0, 8, 14, 1, c(0xcfe0e8, { jitter: 0.05, edge: 0.6 })); m.set(2, 6, 2, I.pink); m.set(3, 6, 1, I.teal); m.set(8, 6, 2, I.goldM); m.box(6, 6, 1, 8, 7, 3, I.cloth); });
        const champ = G('champ', 4, 8, 4, (m) => { m.box(1, 0, 1, 3, 1, 3, I.steel); m.box(1.5, 1, 1.5, 2.5, 3, 2.5, I.steel); m.box(0, 3, 0, 4, 6, 4, I.steel); m.box(1, 5, 1, 3, 6, 3, I.cloth); m.box(2, 6, 2, 3, 8, 3, I.greenM); m.set(2, 7, 2, I.goldM); });
        const roses = G('roses', 3, 7, 3, (m) => { m.box(1, 0, 1, 2, 3, 2, I.teal); m.box(0, 3, 0, 3, 5, 3, I.leafD); m.set(1, 5, 1, I.velvet); m.set(0, 4, 1, I.velvet); m.set(2, 4, 2, I.velvet); m.set(1, 6, 1, I.carpet); m.set(2, 5, 0, I.pink); });
        const typew = G('typew', 5, 4, 4, (m) => { m.box(0, 0, 0, 5, 2, 4, p.black); m.box(0, 2, 0, 5, 3, 1, p.black); m.box(1, 2, 0, 4, 4, 1, I.cloth); for (let x = 0; x < 5; x++) m.set(x, 1, 3, I.cream2); });
        const mstand = G('mstand', 4, 11, 3, (m) => { m.box(1, 0, 1, 3, 1, 2, p.black); m.box(1.5, 1, 1.5, 2.5, 8, 2, p.black); m.box(0, 8, 0, 4, 11, 1, p.black); m.box(0.5, 8.5, 1, 3.5, 11, 2, I.cloth); });
        const teddy = G('teddy', 4, 5, 3, (m) => { const f = c(0xa8743f, { jitter: 0.25 }); m.box(0, 0, 0, 4, 3, 3, f); m.box(1, 3, 0, 3, 5, 3, f); m.set(0, 4, 1, f); m.set(3, 4, 1, f); m.set(1, 4, 2, p.black); m.set(2, 4, 2, p.black); m.box(1, 1, 2, 3, 2, 3, I.velvet); });
        const kidbed = G('kbed', 9, 6, 13, (m) => { m.box(0, 0, 0, 9, 6, 1, I.cream2); m.box(0, 1, 1, 9, 3, 13, I.cream2); m.box(0, 3, 1, 9, 4, 13, I.cloth); m.box(1, 4, 1, 8, 5, 3, I.cloth); m.box(0, 3, 4, 9, 5, 13, I.blue); for (let z = 5; z < 13; z += 2) m.box(0, 5, z, 9, 5.5, z + 1, I.yellow); m.box(0, 0, 12, 9, 4, 13, I.cream2); });
        const hatG = G('fedora', 4, 2, 4, (m) => { m.box(0, 0, 0, 4, 0.5, 4, c(0x5a5048)); m.box(1, 0.5, 1, 3, 2, 3, c(0x5a5048)); m.box(1, 0.5, 1, 3, 1, 3, I.velvet); });
        const rugP = [I.carpGold, I.carpBlue, I.carpRose, I.carpGreen], papers = [[I.paperR, I.paperR2], [I.paperT, I.paperT2], [I.paperG, I.paperG2], [I.paperA, I.paperB]], pk = ['globe', 'green', 'drum', 'tier'];
        for (let i = 0; i < 4; i++) {
          const x0 = 12 + i * 8 + 0.25, x1 = 20 + i * 8, [pa, pb] = papers[i];
          dress(x0, -71, x1, -64.5, 8.75, 11.25, (u, y) => y < 9.5 ? I.panel : y >= 11 ? I.cofferB : stripes(pa, pb, i === 1 ? 0.25 : 0.5)(u));
          W.fill(x0, 11.25, -71, x1, 11.5, -64.5, I.coffer); for (let x = x0 + 1; x < x1 - 0.5; x += 2) W.fill(x, 11.25, -71, x + 0.25, 11.5, -64.5, I.cofferB);
          put(pendantS(pk[i]), x0 + 4, 10.25, -67.8, 0, false);
          W.fill(x0 + 3.5, 8.75, -69.5, x0 + 6.5, 8.8, -66.25, rugP[i]);
          put(nstand, x0 + 3.1, 8.75, -70.55, 0); put(radi, x0 + 5.75, 8.75, -71.1, 0, false);
          if (i === 0) {   // honeymoon: vanity, champagne on ice, roses, a trail of rose petals, JUST MARRIED
            put(vanity, x0 + 0.45, 8.75, -67.2, 1); put(chair(I.pink), x0 + 1.3, 8.75, -67.2, 3, false); put(champ, x1 - 2.4, 8.75, -70.4, 0, false); put(roses, x0 + 3.1, 9.4, -70.4, 0, false);
            for (let k = 0; k < 9; k++) W.fill(x0 + 3.9 + ((k * 37) % 5) * 0.12, 8.75, -65 - k * 0.55, x0 + 4.0 + ((k * 37) % 5) * 0.12, 8.8, -64.9 - k * 0.55, I.velvet);
            const jm = AF.meshModel(AF.textModel('JUST MARRIED', I.velvet, { bg: I.cloth, pad: 1 }), { vs: 1 / 40, anchor: [0.5, 0, 0.5] }); put(jm, x0 + 0.33, 10.1, -69.5, 1, false);
            spot(B, x0 + 1.3, 9.25, -67.2, Y3, 'sit');
          } else if (i === 1) {   // travelling salesman: desk + typewriter, open sample case of brushes, fedora on the bed, order book
            put(desk(), x0 + 0.5, 8.75, -67, 1); put(typew, x0 + 0.55, 9.625, -67.4, 1, false); put(chair(I.velvetG), x0 + 1.45, 8.75, -67, 3, false);
            put(suitcase(c(0x6a4a2a, { jitter: 0.2 })), x0 + 4.8, 8.8, -66.9, 2, false); put(hatG, x0 + 2.2, 9.5, -69.2, 0, false);
            for (let k = 0; k < 4; k++) W.fill(x0 + 4.2 + k * 0.3, 8.8, -67.6, x0 + 4.4 + k * 0.3, 8.9, -67.4, [I.velvet, I.yellow, I.blue, I.green][k]);
            spot(B, x0 + 1.45, 9.25, -67, Y3, 'work');
          } else if (i === 2) {   // band leader: double bass in the corner, music stand, radio, sheet music everywhere
            put(bass(), x0 + 0.6, 8.75, -65.2, 1, false); put(mstand, x0 + 2.3, 8.75, -66.6, 3, false); put(radio(), x0 + 0.5, 8.75, -68.8, 1);
            put(suitcase(I.blackM), x0 + 4.8, 8.8, -66.9, 2, false);
            for (let k = 0; k < 7; k++) W.fill(x0 + 1.2 + ((k * 53) % 7) * 0.3, 8.75, -69.4 + ((k * 31) % 5) * 0.45, x0 + 1.45 + ((k * 53) % 7) * 0.3, 8.8, -69.1 + ((k * 31) % 5) * 0.45, I.cloth);
            spot(B, x0 + 2.3, 9.25, -67.4, Y0, 'stand');
          } else {   // family: a cot for the kid, rocking horse, teddy, toy blocks, a toy shelf
            put(kidbed, x0 + 0.85, 8.75, -66.4, 1); put(teddy, x0 + 0.9, 9.35, -67.2, 1, false); put(horse(), x0 + 4.9, 8.8, -66.8, 1, false);
            for (let k = 0; k < 6; k++) W.fill(x0 + 2.2 + (k % 3) * 0.3, 8.75 + (k > 2 ? 0.125 : 0), -66.5 + (k % 2) * 0.1, x0 + 2.45 + (k % 3) * 0.3, 8.875 + (k > 2 ? 0.125 : 0), -66.25 + (k % 2) * 0.1, [I.velvet, I.blue, I.yellow, I.green, I.pink, I.teal][k]);
            spot(B, x0 + 2.4, 8.75, -67.4, Y1, 'stand');
          }
        }
      } catch (e) { DT_FAIL.push('hotel-rooms-v2: ' + (e && e.message)); console.warn('[downtown] hotel rooms v2', e); }
      spot(B, 28, 4.5, -36, Y2, 'stand'); spot(B, 20, 4.5, -38, Y2, 'stand');
      // mezzanine: writing room (green-shaded desks) on the west, a lounge overlooking the lobby on the east, palms at the ends
      try {
        for (const x of [14.5, 19, 23]) { put(desk(), x, 4.5, -39.4, 0); put(chair(I.velvetG), x, 4.5, -38.4, 2, false); spot(B, x, 4.9, -38.4, Y2 * 0 + Y2, 'sit'); }
        for (const x of [35, 38.5, 42]) { put(armchair(I.velvet), x, 4.5, -35.2, 0); spot(B, x, 4.9, -35.2, Y0, 'sit'); }
        put(rtable(), 36.75, 4.5, -35.4, 0); put(rtable(), 40.25, 4.5, -35.4, 0);
        for (const [x, z] of [[12.9, -35], [43.1, -36.2]]) put(palm(), x, 4.5, z, 0);
        light(20, 7, -37, 10); light(39, 7, -36, 10);
      } catch (e) { DT_FAIL.push('mezz: ' + (e && e.message)); }
      // BALLROOM
      W.clear(46, 0.5, -52, 70, 9.5, -12);
      W.fill(46, 0.25, -52, 70, 0.5, -12, I.carpRed); for (let x = 46.75; x < 70; x += 2) for (let z = -51.25; z < -12; z += 2) W.fill(x, 0.25, z, x + 0.5, 0.5, z + 0.5, I.carpGold);
      W.fill(51.5, 0.25, -40.5, 64.5, 0.5, -21.5, I.goldM); W.fill(52, 0.25, -40, 64, 0.5, -22, I.parqM); for (let x = 52; x < 64; x += 1) for (let z = -40; z < -22; z += 1) if (((x + z) & 1) === 0) W.fill(x, 0.25, z, x + 1, 0.5, z + 1, I.mBlack);
      W.walls(46, 0.5, -52, 70, 1.5, -12, I.panel); W.walls(46, 9, -52, 70, 9.5, -12, I.goldM); dress(46, -52, 70, -12, 1.5, 9, (u, y) => y < 1.75 || (y >= 8.5) ? I.goldM : stripes(I.paperR, I.paperR2, 0.75)(u));
      W.clear(44, 0.5, -30, 46, 4, -26); W.fill(44, 4, -30.25, 46.25, 4.5, -25.75, p.gold);
      cofferCeil(46, -52, 70, -12, 9.5, 2);
      for (let a = 0; a < 96; a++) { const t = a / 96 * Math.PI * 2; W.fill(58 + Math.cos(t) * 3.2 - 0.125, 9, -31 + Math.sin(t) * 3.2 - 0.125, 58 + Math.cos(t) * 3.2 + 0.125, 9.25, -31 + Math.sin(t) * 3.2 + 0.125, I.goldM); }
      ring(46, -52, 70, -12, (x, z) => { if (!W.getM(x + 0.125, 8.625, z + 0.125)) W.fill(x, 8.5, z, x + 0.25, 8.75, z + 0.25, I.alab); });
      for (let z = -50; z < -13; z += 4) { for (let y = 2; y < 8.5; y += 0.25) { const hw = y > 7 ? Math.sqrt(Math.max(0, 1 - ((y - 7) / 1.5) ** 2)) : 1; if (hw <= 0.2) continue; W.clear(70, y, z + 1 - hw, 72, y + 0.25, z + 1 + hw); W.fill(70.75, y, z + 1 - hw, 71, y + 0.25, z + 1 + hw, p.glass); } }
      for (const x of [50, 56, 62]) { for (let y = 2; y < 8.5; y += 0.25) { const hw = y > 7 ? Math.sqrt(Math.max(0, 1 - ((y - 7) / 1.5) ** 2)) : 1; if (hw <= 0.2) continue; W.clear(x + 1 - hw, y, -12, x + 1 + hw, y + 0.25, -10); W.fill(x + 1 - hw, y, -11, x + 1 + hw, y + 0.25, -10.75, p.glass); } }
      W.fill(50, 0.5, -52, 66, 1.5, -46, I.walnut); W.fill(50, 1.25, -46.25, 66, 1.5, -46, p.gold);
      for (let i = 0; i < 4; i++) W.fill(56, 0.5, -46 + i * 0.5, 60, 0.75 + i * 0.25, -45.5 + i * 0.5, I.walnut);
      W.fill(50, 1.5, -52, 66, 8, -51.75, I.velvet); for (let x = 50; x < 66; x += 1) W.fill(x, 1.5, -51.75, x + 0.25, 8, -51.5, c(0x6e1a24));
      W.fill(49.5, 8, -52, 66.5, 8.75, -51.25, p.gold);
      put(piano(), 53, 1.5, -50.5, 0); put(drums(), 58, 1.5, -50, 0); put(bass(), 62.5, 1.5, -49.5, 0); put(mic(), 56, 1.5, -47, 0, false); put(mic(), 60, 1.5, -47, 0, false);
      for (const [x, z] of [[53, -48.5], [56, -48], [58, -48.8], [60, -48], [63.5, -49]]) spot(B, x, 1.5, z, Y0, 'work');
      const bstandB = G('bstand', 10, 8, 3, (m) => { m.box(0, 0, 0, 10, 7, 3, I.cream2); m.box(0, 7, 0, 10, 8, 3, I.goldM); m.box(0, 0, 0, 10, 1, 3, I.goldM); m.line(6, 6, 3, 4, 3.5, 3, I.onAir); m.line(4, 3.5, 3, 6, 3.5, 3, I.onAir); m.line(6, 3.5, 3, 4, 1, 3, I.onAir); m.box(1, 8, 1, 9, 9.99, 2, I.cloth); });
      for (const x of [51.4, 54.4, 61.6, 64.6]) { put(bstandB, x, 1.5, -46.9, 0, false); put(chair(I.velvet), x, 1.5, -47.9, 0, false); spot(B, x, 1.9, -47.9, Y0, 'sit'); }
      for (let y = 1.75; y < 8; y += 0.5) for (const x of [49.5, 66.25]) W.fill(x, y, -46.25, x + 0.25, y + 0.25, -46, I.lampA);
      for (let x = 49.75; x < 66.25; x += 0.5) W.fill(x, 7.75, -46.25, x + 0.25, 8, -46, I.lampA);
      light(58, 5, -47, 12, 0xffd8a0, 1.4);
      W.fill(66.75, 4.75, -48, 70, 5, -14, I.walnut); for (let z = -48; z < -14; z += 0.5) W.fill(66.75, 5, z, 67, 5.75, z + 0.25, p.brass); W.fill(66.75, 5.75, -48, 67, 6, -14, p.gold);
      for (let z = -44; z <= -16; z += 7) W.fill(67, 0.5, z, 67.5, 4.75, z + 0.5, I.cream2);
      const tables = [];
      for (const x of [48.5, 66]) for (let z = -44; z <= -16; z += 5.5) tables.push([x, z]);
      for (const x of [54, 62]) tables.push([x, -17]);
      for (const [x, z] of tables) { put(rtable(), x, 0.5, z, 0); put(chair(I.velvet), x, 0.5, z - 1.25, 0, false); put(chair(I.velvet), x, 0.5, z + 1.25, 2, false); spot(B, x, 0.9, z - 1.25, Y0, 'sit', [[28, -8.5], [28, -14], [40, -28], [47, -28], [x, z - 2.5], [x, z - 1.25]]); spot(B, x, 0.9, z + 1.25, Y2, 'sit', [[28, -8.5], [28, -14], [40, -28], [47, -28], [x, z + 2.5], [x, z + 1.25]]); }
      for (const [x, z] of [[54.5, -35], [58, -31], [61.5, -35], [55, -27], [60.5, -26.5], [53.5, -38.5], [58, -37.5], [62.5, -38.8], [53, -31.5], [63, -30.5], [57.5, -24], [62.8, -24.5]]) { const pth = [[28, -8.5], [28, -14], [40, -28], [47, -28], [x, z]]; spot(B, x, 0.5, z, Y2, 'dance', pth); spot(B, x, 0.5, z - 0.7, Y0, 'dance', pth.concat([[x, z - 0.7]])); }   // dancing couples (pairs face each other)
      for (const [x, z] of [[53, -42], [63, -42], [53, -22], [63, -22]]) { put(chand(), x, 7.25, z, 0, false); light(x, 7.5, z, 14); }
      W.clear(25, 0.5, -11.5, 31, 4.5, -9.5); W.clear(43.5, 0.5, -30, 46.5, 4, -26);
      AF.test('downtown: hotel door -> lobby -> ballroom walkable', () => { const pts = [[28, -10.5], [28, -14], [28, -24], [40, -28], [45, -28], [55, -30]]; const bad = pts.filter(([x, z]) => !onFloor(x, 0.5, z)); return { ok: !bad.length, info: bad.length ? 'blocked ' + JSON.stringify(bad) : 'clear' }; });
    } catch (e) { DT_FAIL.push('grand-solace: ' + (e && e.message)); console.warn('[downtown] interior grand-solace failed', e); }

    // ================================================================ MERIDIAN DEPARTMENT STORE — 4 floors
    try {
      const B = 'meridian', sb = { x0: 88, z0: -72, x1: 130, z1: -10 };
      AF.addBuilding({ id: B, name: 'Meridian Department Store', kind: 'store', box: [88, 0.25, -72, 130, 26, -10], doors: [{ x: 109, y: 0.25, z: -8.5, yaw: Y2 }], floors: [0.5, 5.25, 10.25, 15.25], interior: true });
      const FL = [[0.5, 5], [5.25, 10], [10.25, 15], [15.25, 20]];
      for (const [a, b] of FL) W.clear(90, a, -44, 128, b, -12);
      // floors: marble with verde bands (G), rose carpet (2), parquet (3), blue carpet (4); coffered cream ceilings with brass-bowl pendants
      W.fill(90, 0.25, -44, 128, 0.5, -12, I.mCream); for (let x = 91.5; x < 128; x += 4) W.fill(x, 0.25, -44, x + 0.25, 0.5, -12, I.mVerde); for (let z = -42.5; z < -12; z += 4) W.fill(90, 0.25, z, 128, 0.5, z + 0.25, I.mVerde);
      W.fill(90, 5, -44, 128, 5.25, -12, I.carpRose); W.fill(90, 10, -44, 128, 10.25, -12, I.parqM); W.fill(90, 15, -44, 128, 15.25, -12, I.carpBlue);
      for (const y of [5, 10, 15]) { W.fill(90, y, -44, 128, y + 0.25, -43.25, I.panel); W.fill(90, y, -12.75, 128, y + 0.25, -12, I.panel); }
      for (const [, b] of FL) { if (b >= 20) continue; W.fill(90, b - 0.25, -44, 128, b, -12, I.coffer); for (let x = 90; x < 128; x += 2) W.fill(x, b - 0.5, -44, x + 0.25, b - 0.25, -12, I.cofferB); for (let z = -44; z < -12; z += 2) W.fill(90, b - 0.5, z, 128, b - 0.25, z + 0.25, I.cofferB); }
      for (const [a, b] of FL) { W.walls(90, a, -44, 128, a + 0.75, -12, I.panel); dress(90, -44, 128, -12, a + 0.75, b - 0.5, (u, y) => y < a + 1 ? I.goldM : [stripes(I.paperA, I.paperB), stripes(I.paperR, I.paperR2), stripes(I.paperG, I.paperG2), stripes(I.paperT, I.paperT2)][FL.findIndex((q) => q[0] === a)](u)); lamps('bowl', 90, -44, 128, -12, b >= 20 ? b : b - 0.5, 5); light(100, b - 0.5, -28, 14); light(118, b - 0.5, -24, 14); }
      // v3 THEMED DISPLAY WINDOWS (round 2): 7 dressed windows, each one model (32x26x10 @ 1/8) + a painted backdrop + a hung card
      const K = {
        orange: c(0xd8742a, { jitter: 0.25 }), rust: c(0xa8452a, { pat: 'none', jitter: 0.15 }), amber: c(0xe0a040, { jitter: 0.25 }), leafY: c(0xe8c040, { jitter: 0.3 }),
        chalk: c(0x2e4a3a, { smooth: true }), chalkW: c(0xeeeeea, { jitter: 0.05, edge: 0 }), tileW: c(0xf2efe6, { pat: 'tile', rough: 0.3 }), tileT: c(0x5aa8a0, { pat: 'tile', rough: 0.3 }),
        enamel: c(0xf4efe0, { smooth: true, rough: 0.3 }), check: c(0xc83a32, { pat: 'none', jitter: 0.1 }), navy: c(0x1c2a4a, { smooth: true }), ray: c(0xd8a848, { smooth: true }),
        hay: c(0xd8b860, { jitter: 0.35 }), pumpkin: c(0xe07a1c, { jitter: 0.2 }), stalk: c(0x7a8a3a, { jitter: 0.3 }), plaid: c(0x9a3a2a, { pat: 'none', jitter: 0.3 }),
        candy: c(0xd83a3a, { smooth: true }), white: c(0xf6f2ea, { smooth: true }), skyB: c(0x8ec4e0, { smooth: true }), seaB: c(0x2e6a9a, { smooth: true }), sunB: c(0xffd070, { emit: 0xffc060, emitK: 0.8, mode: 'always', jitter: 0 }),
        lifeR: c(0xe03a2a, { jitter: 0.1 }), apple: c(0xc0262a, { jitter: 0.2 }), glow: c(0xffe6a0, { emit: 0xffc870, emitK: 1.6, mode: 'always', jitter: 0 }),
      };
      const mq = (m, x, z, dress, hat, sk = I.skin) => { m.box(x, 0, z, x + 3, 1, z + 3, p.black); m.box(x, 1, z, x + 3, 7, z + 3, dress); m.box(x - 1 < 0 ? x : x - 1, 1, z, x + 4, 3, z + 3, dress); m.box(x, 7, z + 0, x + 3, 10, z + 2, dress); m.box(x - 1, 7, z + 1, x, 10, z + 2, sk); m.box(x + 3, 7, z + 1, x + 4, 10, z + 2, sk); m.box(x + 1, 10, z, x + 2, 11, z + 2, sk); m.box(x, 11, z, x + 3, 13, z + 3, sk); if (hat) { m.box(x - 1, 13, z - 1, x + 4, 14, z + 4, hat); m.box(x, 14, z, x + 3, 15, z + 3, hat); } };
      const card = (m, x, z, t = 0) => { m.box(x, 0, z, x + 3, 2, z + 1, K.white); m.set(x + 1, 1, z, t ? p.black : I.velvet); m.set(x + 2, 1, z, p.black); };
      const blit = (m, src, ox, oy, oz) => { for (let x = 0; x < src.w; x++) for (let y = 0; y < src.h; y++) for (let z = 0; z < src.d; z++) { const v = src.get(x, y, z); if (v) m.set(ox + x, oy + y, oz + z, v); } };
      const WINS = [
        { t: 'AUTUMN', bg: (u, v) => ((u * 2 + v * 2 + 0.01) | 0) % 2 ? K.rust : K.orange, f: (m) => {
          mq(m, 4, 4, I.velvet, p.black); mq(m, 14, 5, I.velvetG, I.goldM); mq(m, 24, 4, I.goldM, I.velvet);
          for (let k = 0; k < 70; k++) { const h = AF.hash2(k * 13, 7), g = AF.hash2(k * 5, 31); m.set((h * 32) | 0, 0, (g * 10) | 0, [K.orange, K.rust, K.leafY, K.amber][k & 3]); }
          m.line(30, 0, 2, 30, 21, 2, K.white); m.line(30, 14, 2, 27, 19, 3, K.white); for (let k = 0; k < 12; k++) m.set(26 + (k % 5), 16 + (k % 6), 2 + (k % 3), [K.orange, K.leafY, K.rust][k % 3]);
          for (let x = 0; x < 32; x++) m.set(x, 22 - Math.round(Math.sin(x / 31 * Math.PI) * 2), 8, [K.orange, K.rust, K.leafY][x % 3]);
          card(m, 8, 8); card(m, 19, 8, 1); } },
        { t: 'SCHOOL', bg: (u, v) => v > 0.35 && v < 0.9 && u > 0.1 && u < 0.9 ? K.chalk : (v > 0.3 && v < 0.95 && u > 0.07 && u < 0.93 ? I.walnut : c(0xd8c8a0, { smooth: true })), f: (m) => {
          const tx = AF.textModel('ABC 1+2', K.chalkW, {}); blit(m, tx, 6, 14, 0);
          m.box(4, 0, 3, 14, 5, 8, I.walnut); m.box(4, 5, 3, 14, 6, 8, c(0xb08a5a)); m.set(6, 6, 5, K.apple); m.box(9, 6, 4, 12, 7, 6, I.blue); m.box(9, 7, 4, 12, 8, 6, K.check); m.box(10, 8, 4, 12, 9, 6, I.green);
          mq(m, 16, 5, I.blue, null); m.box(16, 13, 5, 19, 14, 8, K.rust);   // schoolboy + cap
          m.box(22, 0, 5, 24, 8, 7, I.walnut); m.sphere(23, 10, 6, 2.6, I.sea, (x, y, z) => AF.hash3(x, y, z) > 0.6 ? I.green : I.sea); m.box(26, 0, 6, 31, 4, 9, c(0x7a4a2a)); m.box(27, 4, 6, 30, 5, 9, p.brass); m.box(25, 0, 2, 27, 6, 4, K.leafY);
          card(m, 2, 9); card(m, 27, 9, 1); } },
        { t: 'KITCHEN', bg: (u, v) => (((u * 16) | 0) + ((v * 12) | 0)) & 1 ? K.tileW : K.tileT, f: (m) => {
          m.box(1, 0, 1, 9, 8, 7, K.enamel); m.box(1, 8, 1, 9, 9, 7, p.black); m.box(2, 2, 7, 8, 6, 8, K.enamel); m.box(4, 5, 7, 6, 6, 8, I.chromeM); m.box(1, 9, 1, 9, 14, 2, K.enamel); for (const x of [2, 4, 6]) m.set(x, 8, 7, I.chromeM);
          m.box(23, 0, 1, 30, 18, 7, K.enamel); m.box(23, 11, 7, 30, 11.9, 7.5, I.chromeM); m.box(28, 12, 7, 29, 15, 8, I.chromeM); m.box(28, 5, 7, 29, 8, 8, I.chromeM);
          m.box(12, 0, 3, 20, 5, 8, K.enamel); for (let x = 12; x < 20; x++) for (let z = 3; z < 8; z++) m.set(x, 5, z, ((x + z) & 1) ? K.check : K.white); m.box(14, 6, 4, 16, 7, 6, K.white); m.box(17, 6, 5, 19, 7, 7, K.amber); m.set(18, 7, 6, K.orange);
          mq(m, 15, 1, I.teal, null); m.box(15, 3, 3, 18, 8, 4, K.white);
          card(m, 3, 9); card(m, 24, 9, 1); } },
        { t: 'RADIOS', bg: (u, v) => { const a = Math.atan2(v - 0.1, u - 0.5); return ((a * 8 / Math.PI + 16) | 0) % 2 ? K.navy : K.ray; }, f: (m) => {
          for (let r = 0; r < 3; r++) { m.box(0, r * 5, 0, 32, r * 5 + 1, 6 - r * 2, I.walnut); for (let x = 1 + r; x < 31; x += 5) { const y = r * 5 + 1; m.box(x, y, 1, x + 4, y + 4, 4 - r, r === 1 ? c(0x8a5a30) : I.walnut); m.box(x + 1, y + 1, 4 - r, x + 3, y + 2, 5 - r, K.glow); m.box(x + 1, y + 3, 4 - r, x + 3, y + 4, 5 - r, c(0xc8a878)); } }
          m.box(12, 0, 6, 20, 12, 10, c(0x6a3a1a)); m.box(13, 5, 9, 19, 11, 10, c(0xc8a878)); m.box(14, 2, 9, 18, 4, 10, K.glow); m.box(12, 12, 6, 20, 13, 10, p.gold);
          card(m, 4, 8, 1); card(m, 25, 8); } },
        { t: 'SAIL AWAY', bg: (u, v) => v < 0.3 ? (((u * 20 + v * 40) | 0) % 5 === 0 ? K.white : K.seaB) : Math.hypot(u - 0.7, v - 0.62) < 0.12 ? K.sunB : K.skyB, f: (m) => {
          for (const [x, z] of [[2, 3], [10, 4]]) { m.box(x, 0, z, x + 1, 3, z + 5, I.walnut); m.box(x + 5, 0, z, x + 6, 3, z + 5, I.walnut); for (let k = 0; k < 6; k++) m.box(x, 2 + (k > 2 ? k - 2 : 0), z + k, x + 6, 3 + (k > 2 ? k - 2 : 0), z + k + 1, k % 2 ? K.white : K.lifeR); }
          for (let a = 0; a < 24; a++) { const t = a / 24 * Math.PI * 2; m.set(24 + Math.cos(t) * 3.5, 14 + Math.sin(t) * 3.5, 1, (a >> 1) % 2 ? K.lifeR : K.white); }
          m.box(18, 0, 5, 26, 5, 9, c(0x5a3a22)); m.box(18, 2, 5, 26, 3, 9, p.brass); m.box(18, 5, 5, 26, 6, 9, c(0x5a3a22));
          m.box(19, 6, 6, 25, 8, 8, p.black); m.box(20, 8, 6, 22, 11, 8, K.lifeR); m.box(20, 10, 6, 22, 11, 8, p.black); m.box(22, 8, 6, 24, 11, 8, K.lifeR);   // model liner on the trunk
          mq(m, 27, 3, K.white, K.leafY); card(m, 6, 9); card(m, 14, 9, 1); } },
        { t: 'TOYLAND', bg: (u) => ((u * 12) | 0) % 2 ? K.candy : K.white, f: (m) => {
          for (let a = 0; a < 48; a++) { const t = a / 48 * Math.PI * 2; m.set(16 + Math.cos(t) * 11, 0, 5 + Math.sin(t) * 3.6, I.steelD); }
          m.box(1, 0, 1, 5, 12, 5, I.velvet); m.box(1, 12, 1, 5, 13, 5, p.gold); m.box(2, 13, 2, 4, 16, 4, K.leafY); m.set(2, 15, 4, p.black); m.set(3, 15, 4, p.black);   // jack-in-the-box
          m.box(25, 0, 1, 31, 9, 4, K.white); m.box(24, 9, 0, 32, 10, 5, I.velvet); m.box(25, 10, 1, 31, 12, 4, I.velvet); m.box(27, 12, 2, 29, 13, 3, I.velvet); m.box(26, 2, 4, 27, 5, 4.9, I.blue); m.box(29, 2, 4, 30, 5, 4.9, I.blue); m.box(27, 5, 4, 29, 6, 4.9, I.yellow);  // dolls' house
          for (let k = 0; k < 6; k++) m.box(8 + (k % 3) * 2, (k > 2 ? 2 : 0), 1 + (k % 2), 10 + (k % 3) * 2, (k > 2 ? 4 : 2), 3 + (k % 2), [I.velvet, I.blue, I.yellow, I.green, I.pink, I.teal][k]);
          m.sphere(20, 2, 2, 2, c(0xa8743f, { jitter: 0.25 })); m.box(19, 4, 1, 22, 7, 4, c(0xa8743f, { jitter: 0.25 })); m.set(19, 7, 2, c(0xa8743f)); m.set(21, 7, 2, c(0xa8743f));
          card(m, 13, 9); } },
        { t: 'HARVEST', bg: (u, v) => v < 0.25 ? K.hay : ((u * 8 + v * 3) | 0) % 2 ? K.amber : K.leafY, f: (m) => {
          m.box(15, 0, 4, 16, 18, 5, I.walnut); m.box(9, 12, 4, 23, 13, 5, I.walnut); m.box(13, 6, 3, 18, 13, 6, K.plaid); for (let y = 6; y < 13; y += 2) m.box(13, y, 3, 18, y + 1, 6, c(0x3a4a8a)); m.box(9, 11, 3, 13, 13, 6, K.plaid); m.box(18, 11, 3, 23, 13, 6, K.plaid);
          for (const x of [8, 23]) m.box(x, 10, 4, x + 1, 12, 5, K.hay); m.box(13, 3, 4, 18, 6, 5, c(0x3a4a8a)); m.box(14, 13, 3, 17, 16, 6, K.hay); m.set(15, 14, 6, p.black); m.set(16, 14, 6, p.black); m.box(12, 16, 2, 19, 17, 7, K.hay); m.box(13, 17, 3, 18, 19, 6, c(0x6a5030));
          for (const [x, z, r] of [[4, 6, 2.6], [9, 7, 1.8], [24, 6, 2.2], [28, 7, 1.6], [20, 8, 1.4]]) { m.sphere(x, r, z, r, K.pumpkin); m.set(x, r * 2, z, K.stalk); }
          m.box(0, 0, 1, 6, 4, 4, K.hay); m.box(26, 0, 1, 32, 4, 4, K.hay); m.box(27, 4, 1, 32, 8, 4, K.hay);
          for (let k = 0; k < 5; k++) m.line(1 + k, 4, 2, 1 + k, 18 - k, 2, K.stalk); m.box(8, 0, 1, 11, 4, 4, I.walnut); for (let x = 8; x < 11; x++) for (let z = 1; z < 4; z++) m.set(x, 4, z, K.apple);
          card(m, 11, 9, 1); } },
      ];
      let wi = 0;
      const dressWindow = (x) => {
        const d = WINS[wi++ % WINS.length];
        for (let u = x + 0.5; u < x + 4.5 - 0.01; u += 0.25) for (let y = 0.75; y < 3.75 - 0.01; y += 0.25) W.fill(u, y, -11.75, u + 0.25, y + 0.25, -11.5, d.bg((u - x - 0.5) / 4, (y - 0.75) / 3));
        const m = new AF.Model(32, 26, 10); d.f(m); put(AF.meshModel(m, { vs: 1 / 8, anchor: [0.5, 0, 0.5] }), x + 2.5, 0.75, -10.875, 0, false);
        put(hsign(d.t, I.goldM, I.blackM), x + 2.5, 3.05, -10.45, 0, false);
        if (wi % 2) light(x + 2.5, 3.3, -10.8, 6, 0xffe0b0, 1.1);
        if (d.t === 'TOYLAND') AF._dtToyWin = { x: x + 2.5, y: 0.8, z: -10.875 + (5 - 5) / 8 };
        if (d.t === 'RADIOS') for (let k = 0; k < 6; k++) spot(B, x + 0.8 + (k % 3) * 1.4, 0.25, -8.9 + (k > 2 ? 0.8 : 0), Y2, 'stand');   // the ball-game crowd on the sidewalk
      };
      // display windows on Meridian Ave
      for (let x = 89; x + 4 <= 129; x += 5) {
        if (x + 4 > 106 && x < 112) continue;
        W.clear(x + 0.5, 0.75, -11.75, x + 4.5, 4, -10); W.fill(x + 0.5, 0.5, -11.75, x + 4.5, 0.75, -10.25, I.velvet); W.fill(x + 0.5, 0.75, -10.25, x + 4.5, 4, -10, p.glass);
        W.fill(x + 0.25, 0.25, -10, x + 4.75, 0.75, -9.75, p.granite); W.fill(x + 0.25, 4, -10, x + 4.75, 4.5, -9.75, p.bronze); W.fill(x + 0.25, 0.75, -10, x + 0.5, 4, -9.75, p.bronze); W.fill(x + 4.5, 0.75, -10, x + 4.75, 4, -9.75, p.bronze);
        W.fill(x + 0.5, 3.75, -11.75, x + 4.5, 4, -11.5, I.lampA);
        dressWindow(x);
        for (let k = 0; k < 3; k++) W.fill(x + 0.5 + k * 1.5, 4.5, -10, x + 1.5 + k * 1.5, 4.75, -8.5 + 0.0, [p.awnGreen, p.white, p.awnGreen][k]);
      }
      D.door(sb, 'S', 109, 4, 4, 2.5, { canopy: 2.5 });
      // stairs
      stair(112, -44, 121.5, -42, '+x', 0.5, 5.25, p.bronze);
      stair(111.5, -41.5, 121.5, -39.5, '-x', 5.25, 10.25, p.bronze);
      stair(112, -44, 122, -42, '+x', 10.25, 15.25, p.bronze);
      for (const [y, xa, xb, z] of [[5.25, 115.5, 121.25, -42], [10.25, 111.75, 117.5, -39.5], [15.25, 115.5, 121.75, -42]]) { W.fill(xa, y, z, xb, y + 1, z + 0.25, p.brass); W.fill(xa, y + 1, z, xb, y + 1.25, z + 0.25, p.gold); }
      // ground: perfume, hats, gloves
      const path0 = [[109, -8.5], [109, -14]];
      for (const [x, z, k] of [[96, -20, 'p'], [96, -28, 'p'], [104, -24, 'h'], [118, -20, 'g'], [118, -28, 'g'], [124, -34, 'p']]) {
        put(counterG(k), x, 0.5, z, 0); spot(B, x, 0.5, z - 1.3, Y2 * 0, 'work'); spot(B, x, 0.5, z + 1.3, Y2, 'browse', [...path0, [x, z + 2.5], [x, z + 1.3]]);
      }
      for (const [x, z] of [[101, -34], [104, -36], [107, -32]]) put(hatstand(), x, 0.5, z, 0, false);
      for (const [x, z] of [[91, -21], [126, -13.5]]) put(palm(), x, 0.5, z, 0);
      put(chand(), 109, 3.25, -26, 0, false);
      // brass LIFT CAGE through all 4 floors (east side), with the car at the ground floor
      for (const y of [5, 10, 15]) W.clear(124.75, y - 0.5, -40.75, 127.25, y + 0.25, -38.25);
      for (let x = 124.5; x < 127.5; x += 0.5) { W.fill(x, 0.5, -41, x + 0.25, 20, -40.75, p.brass); W.fill(x, 0.5, -38.25, x + 0.25, 20, -38, p.brass); }
      for (let z = -40.75; z < -38.25; z += 0.5) { W.fill(124.5, 0.5, z, 124.75, 20, z + 0.25, p.brass); W.fill(127.25, 0.5, z, 127.5, 20, z + 0.25, p.brass); }
      for (const y of [0.5, 5, 10, 15, 19.75]) W.walls(124.5, y, -41, 127.5, y + 0.25, -38, p.gold);
      W.fill(124.75, 0.5, -40.75, 127.25, 0.75, -38.25, I.walnut); W.fill(124.75, 3, -40.75, 127.25, 3.25, -38.25, I.walnut); W.fill(125.75, 2.75, -39.75, 126.25, 3, -39.25, I.lampA);
      for (const y of [4, 9, 14, 19]) { for (let a = 0; a < 7; a++) { const t = Math.PI * a / 6; W.setM(124.25, y + Math.sin(t) * 0.5, -39.5 + Math.cos(t) * 0.5, p.goldLit); } }
      spot(B, 123.5, 0.5, -39.5, Y1, 'work');
      // more ground-floor stock: glove + umbrella tables, hatbox pyramids
      const dispTable = (k) => G('dtab' + k, 12, 9, 8, (m) => { m.box(0, 5, 0, 12, 6, 8, I.walnut); m.box(1, 0, 1, 2, 5, 2, I.walnut); m.box(10, 0, 6, 11, 5, 7, I.walnut); m.box(10, 0, 1, 11, 5, 2, I.walnut); m.box(1, 0, 6, 2, 5, 7, I.walnut); const cs = [I.pink, I.teal, I.velvet, I.cream2, I.blue, I.yellow]; for (let x = 1; x < 11; x += 3) for (let z = 1; z < 7; z += 3) m.box(x, 6, z, x + 2, 7 + ((x + z + k) % 3), z + 2, cs[(x + z + k) % 6]); });
      for (const [x, z, k] of [[100, -16, 0], [113, -18, 1], [113, -30, 2], [100, -40, 3]]) { put(dispTable(k), x, 0.5, z, 0); spot(B, x + 1.8, 0.5, z, Y3, 'browse', [...path0, [x + 2.5, z]]); }
      for (const y of [5.25, 10.25, 15.25]) put(chand(), 109, y + 2.75, -24, 0, false);
      for (const [x, z, k] of [[96, -40, 4], [104, -40, 5]]) { put(dispTable(k), x, 5.25, z, 0); spot(B, x, 5.25, z + 1.6, Y2, 'browse'); }
      for (const x of [96, 101]) { put(sofa(I.velvet), x, 5.25, -12.8, 2); spot(B, x - 0.8, 5.65, -13.2, Y2, 'sit'); spot(B, x + 0.8, 5.65, -13.2, Y2, 'sit'); }
      for (const [x, z, k] of [[112, -16, 6], [112, -22, 7]]) { put(dispTable(k), x, 10.25, z, 0); spot(B, x, 10.25, z + 1.6, Y2, 'browse'); }
      for (const [x, z, k] of [[98, -26, 8], [104, -24, 9]]) { put(dispTable(k), x, 15.25, z, 1); spot(B, x, 15.25, z + 1.6, Y2, 'browse'); }
      put(toyshelf(), 104, 15.25, -43.3, 0); put(toyshelf(), 91, 15.25, -38, 1);
      // fill the open floors: central counter islands, more racks, a model-train table
      for (const [x, z] of [[105, -22], [105, -30], [113, -24]]) { put(counterG(x > 108 ? 'h' : 'g'), x, 0.5, z, 0); spot(B, x, 0.5, z + 1.3, Y2, 'browse', [...path0, [x, z + 2.5], [x, z + 1.3]]); }
      for (const [x, z, i] of [[116, -20, 20], [116, -30, 21], [110, -36, 22], [104, -36, 23]]) { put(rack(i), x, 5.25, z, x > 112 ? 1 : 0); spot(B, x > 112 ? x - 1.3 : x, 5.25, x > 112 ? z : z + 1.3, x > 112 ? Y3 : Y2, 'browse'); }
      for (const [x, z, i] of [[116, -28, 30], [122, -28, 31], [116, -34, 32], [122, -34, 33], [104, -36, 34]]) { put(rack(i), x, 10.25, z, 0); spot(B, x, 10.25, z + 1.3, Y2, 'browse'); }
      for (const [x, z, k] of [[96, -18, 10], [104, -18, 11]]) { put(dispTable(k), x, 15.25, z, 0); spot(B, x, 15.25, z + 1.6, Y2, 'browse'); }
      const trainTable = G('ttab', 24, 9, 14, (m) => { m.box(0, 4, 0, 24, 5, 14, I.leaf); for (const [x, z] of [[1, 1], [22, 1], [1, 12], [22, 12]]) m.box(x, 0, z, x + 1, 4, z + 1, I.walnut); for (let x = 3; x < 21; x++) { m.set(x, 5, 3, I.steelD); m.set(x, 5, 10, I.steelD); } for (let z = 3; z < 11; z++) { m.set(3, 5, z, I.steelD); m.set(20, 5, z, I.steelD); } m.box(5, 5, 2, 9, 7, 4, I.velvet); m.box(9, 5, 2, 12, 6, 4, I.blue); m.box(12, 5, 2, 15, 6, 4, I.yellow); m.box(15, 5, 9, 17, 8, 12, I.cream2); m.box(7, 5, 6, 10, 9, 9, I.leafD); });
      put(trainTable, 100, 15.25, -30, 0); spot(B, 100, 15.25, -28.5, Y2, 'browse'); spot(B, 101.5, 15.25, -28.5, Y2, 'browse');
      // 2nd: ladies wear
      for (let i = 0; i < 8; i++) { const x = 94 + (i % 4) * 6, z = -18 - ((i / 4) | 0) * 8; put(rack(i), x, 5.25, z, 0); spot(B, x, 5.25, z + 1.3, Y2, 'browse'); }
      for (const x of [96, 104, 112]) put(mirror(), x, 5.25, -43.6, 0);
      for (const [x, z, k] of [[122, -16, 0], [124, -24, 1], [122, -32, 2], [100, -34, 3]]) put(mannequin([I.pink, I.teal, I.velvet, I.blue][k]), x, 5.25, z, 0, false);
      spot(B, 118, 5.25, -30, Y3, 'work');
      // 3rd: menswear + shoes
      for (let i = 0; i < 6; i++) { const x = 95 + (i % 3) * 7, z = -18 - ((i / 3) | 0) * 9; put(rack(10 + i), x, 10.25, z, 1); spot(B, x - 1.3, 10.25, z, Y3, 'browse'); }
      for (const x of [114, 118, 122]) put(shoes(), x, 10.25, -43.3, 0);
      for (const x of [115, 121]) { put(bench(), x, 10.25, -36, 2); spot(B, x, 10.65, -36.2, Y2, 'sit'); }
      put(mirror(), 127.6, 10.25, -20, 3); spot(B, 110, 10.25, -30, Y0, 'work');
      // 4th: toys + radios + TEA ROOM
      for (const x of [94, 99]) put(toyshelf(), x, 15.25, -43.3, 0);
      put(horse(), 96, 15.25, -36, 1); put(horse(), 100, 15.25, -36, 1);
      for (let i = 0; i < 6; i++) put(radio(), 91, 15.25, -30 + i * 1.2, 1);
      spot(B, 96, 15.25, -38, Y2, 'browse'); spot(B, 93, 15.25, -28, Y3, 'browse'); spot(B, 104, 15.25, -30, Y0, 'work');
      W.fill(112, 15.25, -36, 128, 15.5, -12, I.teal); W.fill(112, 15.5, -36, 112.25, 16.25, -20, p.brass);
      for (let i = 0; i < 6; i++) { const x = 115 + (i % 3) * 5, z = -32 + ((i / 3) | 0) * 10; put(teaTable(), x, 15.5, z, 0); put(chair(I.teal), x - 1.3, 15.5, z, 1, false); put(chair(I.teal), x + 1.3, 15.5, z, 3, false); spot(B, x - 1.3, 15.9, z, Y1, 'sit'); spot(B, x + 1.3, 15.9, z, Y3, 'sit'); }
      W.fill(122, 15.5, -14, 127, 16.5, -13, I.walnut); spot(B, 124.5, 15.5, -12.6, Y2 * 0 + Y2, 'work');
      // round 2 DENSITY PASS: harvest-sale centrepiece + free-space filler per floor (islands, mannequin plinths, racks, tables)
      try {
        const hv = new AF.Model(32, 26, 10); WINS[6].f(hv); W.fill(106.75, 0.5, -31.9, 111.25, 0.75, -30.1, I.velvet); W.fill(106.5, 0.5, -32.1, 111.5, 0.625, -29.9, I.goldM);
        put(AF.meshModel(hv, { vs: 1 / 8, anchor: [0.5, 0, 0.5] }), 109, 0.75, -31, 0); hangSign('HARVEST SALE', 109, 4.5, -29.6, 0, I.goldM, c(0x8a3a1a, { pat: 'none' }));
        spot(B, 107.5, 0.5, -28.8, Y2, 'browse', [...path0, [107.5, -27], [107.5, -28.8]]); spot(B, 110.8, 0.5, -28.8, Y2, 'browse', [...path0, [110.8, -27], [110.8, -28.8]]);
        const plinth = (k) => G('mplin' + k, 20, 16, 12, (m) => { m.sphere(10, -2, 6, 6.4, I.mCream, (x, y) => y >= 0 ? I.mCream : 0); m.box(4, 0, 0, 16, 1, 12, I.goldM); const cs = [[I.velvet, I.goldM], [I.teal, p.black], [I.pink, I.cream2], [I.blue, I.velvet], [c(0x5a5048), c(0x5a5048)], [I.velvetG, I.goldM]]; const [d1, d2] = cs[k % cs.length]; const fig = (x, z, col, hat) => { m.box(x, 1, z, x + 3, 7, z + 3, col); m.box(x, 7, z, x + 3, 10, z + 2, col); m.box(x - 1, 7, z + 1, x, 10, z + 2, I.skin); m.box(x + 3, 7, z + 1, x + 4, 10, z + 2, I.skin); m.box(x + 1, 10, z, x + 2, 11, z + 2, I.skin); m.box(x, 11, z, x + 3, 13, z + 3, I.skin); m.box(x - 1, 13, z - 1, x + 4, 14, z + 4, hat); m.box(x, 14, z, x + 3, 15, z + 3, hat); }; fig(5, 4, d1, d2); fig(12, 5, d2 === p.black ? I.cream2 : d2, d1); m.box(9, 1, 8, 11, 3, 10, I.brassM); m.box(9, 3, 9, 11, 4, 10, I.cloth); });
        const floors = [[0.5, ['ctr', 'plin', 'tab', 'plin', 'ctr']], [5.25, ['rack', 'plin', 'rack', 'tab', 'rack']], [10.25, ['rack', 'tab', 'plin', 'rack', 'tab']], [15.25, ['tab', 'toys', 'tab', 'radio', 'tab']]];
        const props = (AF.world && AF.world.props) || [];
        const clearAt = (x, y, z) => {
          if (x > 110.5 && x < 123 && z < -38) return false;   // stairs
          if (x > 123 && z < -36.5) return false;              // lift
          if (y > 15 && x > 111 && z > -37) return false;       // tea room
          if (y < 1 && x > 106.5 && x < 111.5 && z > -28) return false;   // entrance aisle
          for (const pr of props) if (Math.abs(pr.y - y) < 1.2 && Math.abs(pr.x - x) < 2.4 && Math.abs(pr.z - z) < 2.2) return false;
          for (const sp of AF.spots) if (sp.building === B && Math.abs(sp.y - y) < 1.2 && Math.abs(sp.x - x) < 1.6 && Math.abs(sp.z - z) < 1.6) return false;
          for (const dx of [-1.2, 0, 1.2]) for (const dz of [-1, 0, 1]) if (AF.solidAt(x + dx, y + 0.3, z + dz) || AF.solidAt(x + dx, y + 1.6, z + dz)) return false;
          return true;
        };
        let added = 0;
        for (const [y, kinds] of floors) {
          let n = 0;
          for (let z = -15.5; z > -41.5; z -= 3.25) for (let x = 93; x < 126.5; x += 3.5) {
            if (n >= 22) break;
            const jx = x + (AF.hash2(x * 3, z * 7 + y) - 0.5) * 0.8, jz = z + (AF.hash2(x * 5 + y, z * 3) - 0.5) * 0.5;
            if (!clearAt(jx, y, jz)) continue;
            const k = kinds[(n + ((jx * 7) | 0)) % kinds.length], sd = (n * 7 + (y | 0)) % 40;
            if (k === 'ctr') { put(counterG(['p', 'h', 'g'][n % 3]), jx, y, jz, 0); spot(B, jx, y, jz - 1.3, Y0, 'work'); if (n % 2 === 0) spot(B, jx, y, jz + 1.3, Y2, 'browse', y < 1 ? [...path0, [jx, jz + 2.5], [jx, jz + 1.3]] : undefined); }
            else if (k === 'plin') { put(plinth(sd), jx, y, jz, n % 4); if (n % 2) spot(B, jx + 1.6, y, jz, Y3, 'browse', y < 1 ? [...path0, [jx + 2.5, jz], [jx + 1.6, jz]] : undefined); }
            else if (k === 'rack') { put(rack(40 + sd), jx, y, jz, n % 2); spot(B, n % 2 ? jx - 1.3 : jx, y, n % 2 ? jz : jz + 1.3, n % 2 ? Y3 : Y2, 'browse'); }
            else if (k === 'toys') { put(toyshelf(), jx, y, jz, n % 4); }
            else if (k === 'radio') { put(radio(), jx - 0.5, y, jz, 0); put(radio(), jx + 0.5, y, jz, 0); spot(B, jx, y, jz + 1.1, Y2, 'browse'); }
            else { put(dispTable(12 + sd), jx, y, jz, n % 2); if (n % 2 === 0) spot(B, jx, y, jz + 1.6, Y2, 'browse', y < 1 ? [...path0, [jx, jz + 2.5], [jx, jz + 1.6]] : undefined); }
            n++; added++;
          }
        }
        AF._dtMeridianAdded = added;
      } catch (e) { DT_FAIL.push('meridian-fill: ' + (e && e.message)); console.warn('[downtown] meridian fill', e); }
      // department signs hung from the coffers (gold on black, two-sided) + brass cash-carrier tubes to the cashier
      for (const [t, x, yc, z, r] of [['PERFUMERY', 96, 4.5, -24, 0], ['GLOVES', 118, 4.5, -24, 0], ['MILLINERY', 104, 4.5, -33, 0], ['LADIES WEAR', 103, 9.5, -22, 0], ['GOWNS', 121, 9.5, -24, 0],
        ['MENSWEAR', 101, 14.5, -23, 0], ['SHOES', 118, 14.5, -39, 0], ['TOYLAND', 96, 19.5, -33, 0], ['RADIOS', 92.8, 19.5, -25, 1], ['TEA ROOM', 120, 19.5, -18, 0]]) hangSign(t, x, yc, z, r);
      for (const [x, z] of [[96, -20], [96, -28], [118, -20], [118, -28], [104, -24]]) { const tx = x + 1.5, tz = z - 0.6; W.fill(tx, 2.25, tz, tx + 0.25, 4.5, tz + 0.25, I.brassM); W.fill(tx, 4.25, Math.min(tz, -40), tx + 0.25, 4.5, Math.max(tz + 0.25, -40), I.brassM); W.fill(Math.min(tx, 108), 4.25, -40, Math.max(tx + 0.25, 108), 4.5, -39.75, I.brassM); W.fill(tx - 0.125, 2.25, tz - 0.125, tx + 0.375, 2.5, tz + 0.375, I.goldM); }
      W.fill(107.5, 0.5, -41, 110.5, 1.5, -40, I.walnut); W.fill(107.25, 1.5, -41.25, 110.75, 1.75, -39.75, I.goldM); W.fill(107.75, 1.75, -40.75, 108.25, 4.5, -40.25, I.brassM); put(G('till', 5, 5, 4, (m) => { m.box(0, 0, 0, 5, 3, 4, I.brassM); m.box(1, 3, 1, 4, 5, 3, I.brassM); m.box(1, 4, 3, 4, 5, 4, I.cream2); m.box(0, 1, 3, 5, 2, 4, p.black); }), 109.5, 1.75, -40.5, 0, false);
      spot(B, 109, 0.5, -41.6, Y0, 'work');
      W.clear(107, 0.5, -12.5, 111, 4, -9.5);
      AF.test('downtown: store door + stairs clear', () => { const ok = onFloor(109, 0.5, -11) && onFloor(109, 0.5, -20) && !AF.solidAt(121.2, 5.5 + 0.3, -43) && !AF.solidAt(112, 10.5 + 0.3, -40.5) && !AF.solidAt(121.7, 15.5 + 0.3, -43); return { ok, info: ok ? 'clear' : 'blocked' }; });
    } catch (e) { DT_FAIL.push('meridian: ' + (e && e.message)); console.warn('[downtown] interior meridian failed', e); }

    // ================================================================ WSOL RADIO — lobby + live studio
    try {
      const B = 'wsol';
      AF.addBuilding({ id: B, name: 'WSOL Radio', kind: 'radio', box: [88, 0.25, 10, 126, 30, 52], doors: [{ x: 107, y: 0.25, z: 8.5, yaw: Y0 }], floors: [0.5], interior: true });
      W.clear(90, 0.5, 12, 124, 5.5, 23); W.clear(90, 0.5, 24, 124, 9, 50);
      W.fill(90, 0.25, 12, 124, 0.5, 23, I.mCream); for (let x = 90; x < 124; x += 2) W.fill(x, 0.25, 12, x + 1, 0.5, 13, I.mBlack); for (let x = 91; x < 124; x += 2) W.fill(x, 0.25, 22, x + 1, 0.5, 23, I.mBlack); for (let x = 90; x < 124; x += 0.25) { const t = Math.abs(((x - 90) % 3) - 1.5) - 0.75; W.fill(x, 0.25, 17.25 + t * 0.66, x + 0.25, 0.5, 17.5 + t * 0.66, I.goldM); } for (let z = 24; z < 50; z += 0.5) W.fill(90, 0.25, z, 124, 0.5, z + 0.5, I.parqM); W.fill(101.75, 0.25, 26, 105.25, 0.5, 42, I.carpet);
      W.clear(105, 0.5, 23, 109, 3, 24); W.fill(104.75, 3, 22.75, 109.25, 3.5, 24.25, p.bronze);
      W.walls(90, 0.5, 12, 124, 1.25, 23, I.blackM); W.walls(90, 5, 12, 124, 5.5, 23, p.red);
      lamps('deco', 90, 12, 124, 23, 5.5, 4); light(100, 4.5, 17, 12); light(115, 4.5, 17, 12);
      W.fill(102, 0.5, 20, 112, 1.5, 21, I.walnut); W.fill(102, 1.5, 19.75, 112, 1.75, 21.25, p.brass);
      const ws = AF.textModel('WSOL 880', p.gold, {}); AF.placeStatic(AF.meshModel(ws, { vs: 1 / 16, anchor: [0.5, 0, 0] }), 97, 3.6, 23, 2, { collide: false });
      const oa = AF.textModel('ON AIR', I.onAir, { bg: p.black }); const oaS = AF.meshModel(oa, { vs: 1 / 16, anchor: [0.5, 0, 0] }); AF.placeStatic(oaS, 107, 3.5, 23, 2, { collide: false });
      spot(B, 105, 0.5, 21.6, Y2, 'work'); spot(B, 109, 0.5, 21.6, Y2, 'work');
      for (const x of [95, 119]) { put(bench(), x, 0.5, 14, 0); spot(B, x, 0.9, 14.3, Y0, 'sit', [[107, 8.5], [107, 13], [x, 15.5], [x, 14.3]]); }
      for (let x = 92; x < 122; x += 3) if (x < 102 || x > 112) W.fill(x, 2, 22.75, x + 1.5, 3.25, 23, [I.sky1, I.sea, I.velvet, I.teal][(x / 3 | 0) % 4]);
      put(radio(), 91, 0.5, 20, 1); put(palm(), 91.5, 0.5, 13.5, 0); put(palm(), 122.5, 0.5, 13.5, 0);
      // studio: acoustic walls, stage, band, mics, ON AIR sign, audience seats, control booth
      for (let y = 1; y < 9; y += 1) W.walls(90, y, 24, 124, y + 0.5, 50, ((y | 0) % 2) ? I.acoust : I.acoust2);
      W.walls(90, 8.5, 24, 124, 9, 50, p.gold);
      lamps('globe', 90, 24, 124, 50, 9, 5.5); light(100, 8, 38, 14); light(114, 8, 38, 14); light(107, 7, 46, 12, 0xffe0b0, 1.5);
      W.fill(96, 0.5, 43, 118, 1.25, 50, I.walnut); W.fill(96, 1, 42.75, 118, 1.25, 43, p.gold);
      const oas = AF.textModel('ON AIR', I.onAir, { bg: p.black, bold: true }); W.stamp(oas, 107 - oas.w * 0.25 / 2, 5.5, 49.5, 0 + 2);
      put(piano(), 99, 1.25, 48.5, 0); put(drums(), 107, 1.25, 48, 0); put(bass(), 114, 1.25, 47.8, 0);
      const rmic = G('rmic', 4, 30, 4, (m) => { m.box(0, 0, 0, 4, 1, 4, p.black); m.box(1, 1, 1, 2, 25, 2, I.chromeM); m.box(0, 25, 1, 4, 26, 2, I.chromeM); m.box(1, 26, 0, 3, 29, 3, p.black); m.box(0, 26, 1, 1, 29, 2, I.chromeM); m.box(3, 26, 1, 4, 29, 2, I.chromeM); m.box(1, 29, 1, 3, 30, 2, I.chromeM); }, 1 / 16);
      for (const x of [101.5, 107, 112.5]) put(rmic, x, 1.25, 44.3, 0, false);
      spot(B, 107, 1.25, 44.9, Y2, 'stand');   // the singer at the centre ribbon mic
      // horn section: 4 seated players behind deco bandstand fronts (lightning bolt, WSOL gold), saxes on stands
      const bstand = G('bstand', 10, 8, 3, (m) => { m.box(0, 0, 0, 10, 7, 3, I.cream2); m.box(0, 7, 0, 10, 8, 3, I.goldM); m.box(0, 0, 0, 10, 1, 3, I.goldM); m.line(6, 6, 3, 4, 3.5, 3, I.onAir); m.line(4, 3.5, 3, 6, 3.5, 3, I.onAir); m.line(6, 3.5, 3, 4, 1, 3, I.onAir); m.box(1, 8, 1, 9, 9.99, 2, I.cloth); });
      const sax = G('sax', 3, 8, 3, (m) => { m.box(1, 0, 1, 2, 3, 2, p.black); m.box(1, 1, 0, 3, 3, 2, I.goldM); m.box(2, 3, 0, 3, 7, 1, I.goldM); m.box(1, 7, 0, 3, 8, 1, I.goldM); m.box(0, 1, 0, 1, 2, 2, I.goldM); });
      for (const x of [102.2, 104.6, 109.4, 111.8]) { put(bstand, x, 1.25, 46.1, 2, false); put(chair(I.velvet), x, 1.25, 47.1, 2, false); spot(B, x, 1.65, 47.1, Y2, 'sit'); put(sax, x + 0.8, 1.25, 46.9, 0, false); }
      // sound-effects table (wind machine with a crank, coconut shells, a door on a frame, a bell) + the effects man
      const sfx = G('sfx', 20, 16, 10, (m) => { m.box(0, 6, 0, 20, 7, 10, I.walnut); for (const [x, z] of [[0, 0], [19, 0], [0, 9], [19, 9]]) m.box(x, 0, z, x + 1, 6, z + 1, I.walnut); for (let a = 0; a < 16; a++) { const t = a / 16 * Math.PI * 2; m.line(2, 10 + Math.sin(t) * 3, 4 + Math.cos(t) * 3, 8, 10 + Math.sin(t) * 3, 4 + Math.cos(t) * 3, a % 2 ? I.walnut : p.black); } m.box(1, 7, 1, 2, 12, 2, I.walnut); m.box(8, 7, 1, 9, 12, 2, I.walnut); m.box(9, 10, 3, 10, 11, 5, I.steel); m.box(9, 11, 5, 10, 14, 6, I.steel); m.sphere(12, 7.5, 3, 1.4, I.walnut); m.sphere(14, 7.5, 3, 1.4, I.walnut); m.box(15, 7, 5, 19, 16, 6, c(0x8a5a30)); m.set(18, 11, 6, I.brassM); m.box(11, 7, 7, 13, 9, 9, I.brassM); m.set(12, 9, 8, I.goldM); });
      put(sfx, 97.6, 1.25, 44.4, 0); spot(B, 97.6, 1.25, 45.6, Y2, 'work');
      // announcer's podium with its own mic, studio clocks, footlights along the stage edge
      put(G('podium', 8, 10, 6, (m) => { m.box(0, 0, 0, 8, 9, 5, I.walnut); m.box(0, 9, 0, 8, 10, 6, I.goldM); m.box(1, 2, 5, 7, 7, 6, I.cream2); m.line(5, 6.5, 6, 3, 4, 6, I.onAir); m.line(3, 4, 6, 5, 4, 6, I.onAir); m.line(5, 4, 6, 3, 1.5, 6, I.onAir); }), 116.4, 1.25, 44.2, 0);
      put(rmic, 116.4, 1.25, 43.6, 0, false); spot(B, 116.4, 1.25, 45.2, Y2, 'stand');
      put(clock(), 99, 6.2, 49.35, 2, false); put(clock(), 115, 6.2, 49.35, 2, false);
      for (let x = 96.5; x < 118; x += 1) W.fill(x, 1, 42.75, x + 0.5, 1.25, 43, I.lampA);
      light(107, 4, 44, 10, 0xffe6b8, 1.4);
      for (const [x, z] of [[101.5, 45.5], [105, 45.5], [109, 45.5], [112.5, 45.5], [99, 47]]) spot(B, x, 1.25, z, Y2, 'work');
      let seats = 0;
      for (let r = 0; r < 6; r++) for (let s = 0; s < 10; s++) {
        const x = 95 + s * 1.5 + (s >= 5 ? 3.5 : 0), z = 31 + r * 1.75, y = 0.5 + (5 - r) * 0.25 * 0;
        put(seat(), x, y, z, 0, false);
        if ((r + s) % 2 === 0 && seats < 30) { spot(B, x, y + 0.4, z + 0.2, Y0, 'sit', [[107, 8.5], [107, 22], [107, 27], [103.5, 29], [103.5, z], [x, z]]); seats++; }
      }
      // control booth (glass) in the NE corner
      W.walls(114, 0.5, 24, 124, 4, 31, p.bronze); W.fill(114, 1.5, 30.75, 124, 3.75, 31, p.glass); W.fill(114, 1.5, 24.25, 114.25, 3.75, 30.75, p.glass); W.clear(114, 0.5, 26, 114.25, 3, 28);
      W.fill(114, 4, 24, 124, 4.25, 31, p.black);
      put(pendant('green'), 119, 2.2, 27.5, 0, false); light(119, 3.2, 27.5, 7, 0xffe6b0, 1.2);
      put(consoleM(), 119, 0.5, 29.5, 0); spot(B, 117, 0.5, 28.5, Y0, 'work'); spot(B, 121, 0.5, 28.5, Y0, 'work');
      W.fill(116, 1.5, 24.25, 122, 3, 24.5, I.steelD); for (let x = 116.5; x < 122; x += 1) W.setM(x, 2.25, 24.5, I.dial);
      const oa2 = AF.textModel('ON AIR', I.onAir, { bg: p.black }); AF.placeStatic(AF.meshModel(oa2, { vs: 1 / 16, anchor: [0.5, 0, 0] }), 119, 4.3, 31, 0, { collide: false });
      W.clear(105, 0.5, 9.5, 109, 4, 12.5); W.clear(105, 0.5, 22.5, 109, 3, 24.5);
      AF.test('downtown: WSOL door -> studio walkable', () => { const pts = [[107, 11], [107, 18], [107, 23.5], [107, 28], [107.5, 38]]; const bad = pts.filter(([x, z]) => !onFloor(x, 0.5, z)); return { ok: !bad.length, info: bad.length ? 'blocked ' + JSON.stringify(bad) : 'clear' }; });
    } catch (e) { DT_FAIL.push('wsol: ' + (e && e.message)); console.warn('[downtown] interior wsol failed', e); }

    // ================================================================ SOLACE TOWER LOBBY — black-and-gold marble, mural, elevators
    try {
      const B = 'solace-tower';
      AF.addBuilding({ id: B, name: 'Solace Tower', kind: 'office', box: [88, 0.25, -147, 130, 63.5, -104], doors: [{ x: 109, y: 0.25, z: -148.5, yaw: Y0 }], floors: [0.5], interior: true });
      W.clear(96, 0.5, -145, 122, 9, -128);
      for (let x = 96; x < 122; x += 1) for (let z = -145; z < -128; z += 1) W.fill(x, 0.25, z, x + 1, 0.5, z + 1, I.mBlack);
      for (let x = 96; x < 122; x += 2) W.fill(x, 0.25, -145, x + 0.25, 0.5, -128, I.goldM); for (let z = -145; z < -128; z += 2) W.fill(96, 0.25, z, 122, 0.5, z + 0.25, I.goldM);
      for (let x = 105; x < 113; x += 0.25) for (let z = -140.5; z < -132.5; z += 0.25) { const r = Math.hypot(x + 0.125 - 109, z + 0.125 + 136.5); if (r < 4) W.fill(x, 0.25, z, x + 0.25, 0.5, z + 0.25, r < 1.2 ? p.gold : ((Math.atan2(x - 109, z + 136.5) * 6 / Math.PI + 12 | 0) % 2 ? p.gold : I.blackM)); }
      W.walls(96, 0.5, -145, 122, 3, -128, I.blackM); W.walls(96, 3, -145, 122, 3.25, -128, p.gold); W.walls(96, 8.5, -145, 122, 9, -128, p.gold);
      // mural on the south wall: golden-hour harbour + towers
      for (let x = 99; x < 119; x += 0.25) for (let y = 3.5; y < 8.25; y += 0.25) {
        const u = (x - 99) / 20, v = (y - 3.5) / 4.75, sk = Math.abs(x - 109) < 1.1 && Math.abs(y - 5.2) < 1.1 && Math.hypot(x - 109, y - 5.2) < 1.1;
        const tw = [[0.12, 0.55], [0.22, 0.75], [0.33, 0.5], [0.62, 0.62], [0.72, 0.9], [0.84, 0.58]].some(([cx, h]) => Math.abs(u - cx) < 0.035 && v < h && v > 0.3);
        const col = v < 0.3 ? (((x * 4 + y * 4) | 0) % 5 === 0 ? I.sky1 : I.sea) : tw ? I.sil : sk ? I.sun : v < 0.55 ? I.sky1 : v < 0.8 ? I.rose : I.sky2;
        W.fill(x, y, -128.25, x + 0.25, y + 0.25, -128, col);
      }
      W.fill(98.75, 3.25, -128.5, 119.25, 3.5, -128, p.gold); W.fill(98.75, 8.25, -128.5, 119.25, 8.5, -128, p.gold);
      // elevator banks east + west
      for (const x of [96, 121.75]) for (const z of [-142, -138, -134]) { W.fill(x, 0.5, z - 0.9, x + 0.25, 3.5, z + 0.9, p.bronze); W.fill(x + (x < 100 ? 0.25 : -0.25), 0.5, z - 0.05, x + (x < 100 ? 0.5 : 0), 3.25, z + 0.05, p.black); for (let a = 0; a < 7; a++) { const t = Math.PI * a / 6; W.setM(x + (x < 100 ? 0.25 : -0.25), 4 + Math.sin(t) * 0.6, z + Math.cos(t) * 0.6, p.goldLit); } W.setM(x + (x < 100 ? 0.25 : -0.25), 4, z, p.black); }
      W.fill(106, 0.5, -136.5, 112, 1.5, -135.5, I.blackM); W.fill(105.75, 1.5, -136.75, 112.25, 1.75, -135.25, p.gold); put(floorLamp(), 106.5, 1.75, -136, 0, false);
      spot(B, 109, 0.5, -137.2, Y2, 'work');
      for (const [x, z] of [[97, -129], [121, -129], [97, -144.3], [121, -144.3]]) put(floorLamp(), x, 0.5, z, 0, false);
      for (const [x, z] of [[100, -140], [118, -140]]) put(palm(), x, 0.5, z, 0);
      for (const [x, z, yaw] of [[98, -142, Y3], [98, -138, Y3], [120, -134, Y1], [109, -134.5, Y0], [104, -131, Y0], [114, -131, Y0]]) spot(B, x, 0.5, z, yaw, 'stand', [[109, -148.5], [109, -143], [x, z]]);
      put(chand(), 109, 6.5, -140, 0, false); put(chand(), 109, 6.5, -132, 0, false); light(109, 7, -140, 12); light(109, 7, -132, 12);
      // building directory (black felt board, gold letter rows) + clock, starter's podium, benches under the mural, uplights
      W.fill(99, 1.5, -145, 104.5, 4.25, -144.75, I.blackM); W.fill(98.75, 1.25, -145, 104.75, 1.5, -144.5, I.goldM); W.fill(98.75, 4.25, -145, 104.75, 4.5, -144.5, I.goldM);
      put(hsign('DIRECTORY', I.goldM, I.blackM), 101.75, 3.6, -144.6, 0, false);
      for (let r = 0; r < 7; r++) for (let x = 99.25; x < 104.25; x += 0.25) if (AF.hash2(x * 8, r * 13) > 0.3 && (x < 101.5 || x > 101.9)) W.setM(x, 1.75 + r * 0.25, -144.625, AF.hash2(x * 4, r) > 0.85 ? I.cream2 : p.goldLit);
      put(clock(), 115.75, 3, -144.8, 0, false);
      put(G('starter', 8, 10, 6, (m) => { m.box(0, 0, 0, 8, 8, 5, p.bronze); m.box(0, 8, 0, 8, 9, 6, I.goldM); m.box(1, 2, 5, 7, 6, 6, I.blackM); m.box(3, 9, 2, 4, 10, 3, I.brassM); m.box(5, 9, 1, 7, 9.9, 3, I.cloth); }), 103.2, 0.5, -138.5, 1);
      spot(B, 102.4, 0.5, -138.5, Y1, 'work');
      for (const x of [103, 115]) { put(bench(), x, 0.5, -129.1, 2); spot(B, x - 0.8, 0.9, -129.4, Y2, 'sit'); spot(B, x + 0.8, 0.9, -129.4, Y2, 'sit'); }
      light(100, 5, -136, 12, 0xffe2b0, 1.3); light(118, 5, -136, 12, 0xffe2b0, 1.3);
      for (const x of [99, 119]) for (const z of [-144.7, -128.3]) W.fill(x - 0.25, 7.5, z - 0.125, x + 0.25, 8.25, z + 0.125, I.alab);
      W.clear(107, 0.5, -147.5, 111, 4.25, -144.5);
      AF.test('downtown: Solace lobby doorway walkable', () => { const bad = [[109, -146.5], [109, -143], [109, -131]].filter(([x, z]) => !onFloor(x, 0.5, z)); return { ok: !bad.length, info: bad.length ? 'blocked ' + JSON.stringify(bad) : 'clear' }; });
    } catch (e) { DT_FAIL.push('solace-tower: ' + (e && e.message)); console.warn('[downtown] interior solace-tower failed', e); }
    // ================================================================ STREET LIFE on the downtown sidewalks
    try {
      const tub = G('tub', 9, 11, 9, (m) => { m.box(0, 0, 0, 9, 1, 9, p.granite); m.box(1, 1, 1, 8, 5, 8, p.bronze); m.box(0, 5, 0, 9, 6, 9, p.brass); m.box(1, 6, 1, 8, 7, 8, I.leafD); for (let x = 1; x < 8; x++) for (let z = 1; z < 8; z++) { const h = AF.hash2(x * 7, z * 3); if (h > 0.35) m.set(x, 7 + (h > 0.8 ? 2 : h > 0.6 ? 1 : 0), z, h > 0.7 ? I.pink : h > 0.5 ? I.yellow : I.leaf); if (h > 0.75) m.set(x, 7, z, I.leaf); } });
      for (const [x, z] of [[105, -148.6], [113, -148.6], [8.4, -131.8], [8.4, -118.2], [22.4, -8.2], [102.8, 8.5], [111.2, 8.5], [105.2, -8.6], [112.8, -8.6]]) put(tub, x, 0.25, z, 0);
      const news = (col) => G('news' + col, 4, 9, 4, (m) => { m.box(0, 0, 0, 4, 1, 4, p.black); m.box(0.5, 1, 0.5, 3.5, 4, 3.5, p.steelD); m.box(0, 4, 0, 4, 8, 4, col); m.box(0.5, 5, 3, 3.5, 7, 4, I.cloth); m.box(0, 8, 0, 4, 9, 4, col); m.set(1, 6, 4, p.black); m.set(2, 6, 4, p.black); });
      const cols = [I.velvet, I.blue, I.yellow, I.green];
      for (const [x, z, r] of [[12.5, -148.5, 2], [92, -148.5, 2], [12.5, -8.3, 0], [90.5, -8.3, 0], [90.5, 8.5, 2], [70, -148.5, 2], [70, -86.5, 0], [128, 8.5, 2]]) for (let k = 0; k < 3; k++) put(news(cols[(k + (x | 0)) % 4]), x + k * 0.6, 0.25, z, r);
      // shoeshine stand beside the Harbour Trust (Grand Ave sidewalk)
      const shine = G('shine', 10, 14, 12, (m) => { m.box(0, 0, 0, 10, 4, 12, I.walnut); m.box(0, 3, 0, 10, 4, 12, p.brass); m.box(1, 4, 0, 9, 7, 7, I.velvetG); m.box(1, 7, 0, 9, 13, 2, I.velvetG); m.box(0, 7, 0, 1, 10, 7, I.walnut); m.box(9, 7, 0, 10, 10, 7, I.walnut); m.box(2, 4, 8, 3, 7, 10, p.brass); m.box(7, 4, 8, 8, 7, 10, p.brass); m.box(2, 7, 8, 4, 8, 11, p.brass); m.box(6, 7, 8, 8, 8, 11, p.brass); m.box(0, 13, 0, 10, 14, 2, p.gold); m.box(3, 0, 12, 7, 2, 12, I.walnut); });
      put(shine, 8.95, 0.25, -136, 3);
      AF.addSpot({ building: 'harbour-trust', x: 9.1, y: 1.15, z: -136, yaw: Y3, kind: 'sit' });
      AF.addSpot({ building: 'harbour-trust', x: 7.4, y: 0.25, z: -136, yaw: Y1, kind: 'work' });
    } catch (e) { DT_FAIL.push('street: ' + (e && e.message)); console.warn('[downtown] street life failed', e); }
    AF.test('downtown: >= 80 interior spots', () => { const ids = ['harbour-trust', 'grand-solace', 'meridian', 'wsol', 'solace-tower']; const n = AF.spots.filter((s) => ids.includes(s.building)).length; return { ok: n >= 80, info: n + ' spots' }; });
  });

  // revolving door at the Grand Solace (dynamic, turning slowly)
  AF.onBuild('downtown-dyn2', 610, () => {
    const m = new AF.Model(20, 20, 20), br = AF.col(0x8a5a2b), gl = AF.col('glass');
    m.box(9, 0, 9, 11, 20, 11, br);
    for (let i = 0; i < 20; i++) { m.box(i, 0, 9.5, i + 1, 20, 10.5, (i === 0 || i === 19 || i === 9 || i === 10) ? br : gl); m.box(9.5, 0, i, 10.5, 20, i + 1, (i === 0 || i === 19 || i === 9 || i === 10) ? br : gl); }
    m.box(0, 0, 9, 20, 1, 11, br); m.box(0, 19, 9, 20, 20, 11, br); m.box(9, 0, 0, 11, 1, 20, br); m.box(9, 19, 0, 11, 20, 20, br);
    const mesh = AF.modelMesh(AF.meshModel(m, { vs: 1 / 8, anchor: [0.5, 0, 0.5] })); mesh.position.set(28, 0.5, -10.5); mesh.scale.set(0.9, 1.0, 0.9); AF.scene.add(mesh);
    // ballroom mirror ball (turning, speckled)
    const bm = new AF.Model(12, 12, 12), sv = AF.col(0xd8dde4, { jitter: 0.4, edge: 0.6 }), sp = AF.col(0xffffff, { emit: 0xfff4e0, emitK: 2.5, mode: 'always', jitter: 0 });
    bm.sphere(6, 6, 6, 5.8, sv, (x, y, z) => AF.hash3(x, y, z) > 0.8 ? sp : sv);
    const ball = AF.modelMesh(AF.meshModel(bm, { vs: 1 / 8, anchor: [0.5, 0.5, 0.5] })); ball.position.set(58, 7.6, -31); AF.scene.add(ball);
    const chainM = new AF.Model(1, 12, 1); chainM.box(0, 0, 0, 1, 12, 1, AF.col(0xc79a3e)); const chain = AF.modelMesh(AF.meshModel(chainM, { vs: 1 / 8, anchor: [0.5, 0, 0.5] })); chain.position.set(58, 8.3, -31); AF.scene.add(chain);
    AF.onTick('downtown-revolve', 331, (dt) => { const cam = AF.camera && AF.camera.position; if (cam && Math.abs(cam.x - 40) + Math.abs(cam.z + 20) > 140) return; mesh.rotation.y += dt * 0.4; ball.rotation.y += dt * 0.6; });
  });

  // round 2: little machines — toy trains (Meridian window + 4th-floor table), elevator dial needles (hotel, Solace Tower,
  // Meridian lift), tea-room ceiling fans, the WSOL APPLAUSE sign. Shared geometries, one tick, no per-frame allocation.
  AF.onBuild('downtown-int-machines', 612, () => {
    try {
      const C = (h, o) => AF.col(h, Object.assign({ jitter: 0.1 }, o || {}));
      const red = C(0xc0302a, { pat: 'none' }), blk = C(0x1c1a1e), brs = (AF.MAT && AF.MAT.brass) || C(0xd4a84a), grn = C(0x2d6a4a), yel = C(0xe8c040), blu = C(0x3a68b0), cream = C(0xf2e6c8, { smooth: true });
      const lamp = C(0xfff0c0, { emit: 0xffd080, emitK: 2.2, mode: 'always', jitter: 0 });
      const mk = (w, h, d, fn, vs) => { const m = new AF.Model(w, h, d); fn(m); return AF.meshModel(m, { vs, anchor: [0.5, 0, 0.5] }); };
      const engG = mk(3, 4, 5, (m) => { m.box(0, 0, 0, 3, 1, 5, blk); m.box(0, 1, 0, 3, 3, 3, blk); m.box(0, 1, 3, 3, 4, 5, red); m.set(1, 3, 0, blk); m.set(1, 4, 1, brs); m.set(1, 2, 0, lamp); }, 1 / 16);
      const carG = [red, grn, blu].map((cc) => mk(3, 3, 4, (m) => { m.box(0, 0, 0, 3, 1, 4, blk); m.box(0, 1, 0, 3, 3, 4, cc); m.box(0, 2, 1, 3, 3, 3, yel); }, 1 / 16));
      const trains = [];
      const addTrain = (cx, y, cz, rx, rz, rect, speed) => { const parts = [engG, carG[0], carG[1], carG[2]].map((g) => { const me = AF.modelMesh(g); AF.scene.add(me); return me; }); trains.push({ cx, y, cz, rx, rz, rect, speed, parts, s: 0 }); };
      if (AF._dtToyWin) addTrain(AF._dtToyWin.x, 0.875, AF._dtToyWin.z, 1.375, 0.45, false, 0.35);
      addTrain(100, 15.9, -30.875 + 7 / 8, 1.06, 0.44, true, 0.3);
      // pos on loop (param u 0..1) -> out[0..2]; rect = rounded rectangle approximated by a superellipse
      const tp = [0, 0, 0];
      const loopPos = (T, u) => { const a = u * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a); if (T.rect) { tp[0] = T.cx + T.rx * Math.sign(ca) * Math.pow(Math.abs(ca), 0.35); tp[2] = T.cz + T.rz * Math.sign(sa) * Math.pow(Math.abs(sa), 0.35); } else { tp[0] = T.cx + T.rx * ca; tp[2] = T.cz + T.rz * sa; } };
      // needles: pivot + a thin bar; rotate about the axis normal to the wall
      const needleG = mk(1, 5, 1, (m) => m.box(0, 0, 0, 1, 5, 1, blk), 1 / 16);
      const needles = [];
      const addNeedle = (x, y, z, axis, ph) => { const piv = new THREE.Group(); piv.position.set(x, y, z); const n = AF.modelMesh(needleG); n.position.set(0, 0, 0); piv.add(n); AF.scene.add(piv); needles.push({ piv, axis, ph }); };
      for (const z of [-31, -27, -23]) addNeedle(12.32, 4.0, z, 'x', z * 1.7);                           // Grand Solace lifts
      for (const z of [-142, -138, -134]) { addNeedle(96.55, 4.0, z, 'x', z * 0.9); addNeedle(121.45, 4.0, z, 'x', z * 1.3 + 2); }   // Solace Tower
      for (const y of [4, 9, 14, 19]) addNeedle(124.18, y, -39.5, 'x', y * 0.7);                          // Meridian lift
      for (let x = 116.5; x < 122; x += 1) addNeedle(x + 0.125, 2.05, 24.8, 'z', x * 3.1);                // WSOL booth VU meters (jitter to the music)
      // tea-room ceiling fans (Meridian 4th floor, ceiling at y 20)
      const fanG = mk(24, 3, 24, (m) => { m.box(11, 1, 11, 13, 3, 13, brs); m.box(10, 0, 10, 14, 1, 14, brs); m.box(1, 1, 11, 23, 2, 13, C(0x5a3920)); m.box(11, 1, 1, 13, 2, 23, C(0x5a3920)); m.set(11, 0, 11, lamp); }, 1 / 16);
      const rodG = mk(1, 8, 1, (m) => m.box(0, 0, 0, 1, 8, 1, brs), 1 / 16);
      const fans = [];
      for (const [x, z] of [[117.5, -32], [122.5, -32], [117.5, -22], [122.5, -22]]) { const f = AF.modelMesh(fanG); f.position.set(x, 19.3, z); AF.scene.add(f); const r = AF.modelMesh(rodG); r.position.set(x, 19.5, z); AF.scene.add(r); fans.push(f); }
      // WSOL APPLAUSE sign above the stage, facing the audience (-z): lit + unlit copies, toggled
      const litC = C(0xfff2c0, { emit: 0xffd070, emitK: 3.2, mode: 'always', jitter: 0, edge: 0 }), offC = C(0x6a5a3a);
      const ap = (col) => { const g = AF.meshModel(AF.textModel('APPLAUSE', col, { bg: blk, pad: 1 }), { vs: 1 / 16, anchor: [0.5, 0, 0.5] }); const me = AF.modelMesh(g); me.position.set(107, 6.6, 42.9); me.rotation.y = Math.PI; AF.scene.add(me); return me; };
      const apOn = ap(litC), apOff = ap(offC); apOn.visible = false;
      // a bellhop pushing a luggage cart around the Grand Solace lobby (ping-pong on a polyline, pauses at the ends)
      let bell = null;
      if (AF._dtBell) { const g = new THREE.Group(); const cm = AF.modelMesh(AF._dtBell.cart); cm.position.set(0, 0, 0.55); g.add(cm); const mm = AF.modelMesh(AF._dtBell.man); mm.position.set(0, 0, -0.55); g.add(mm); AF.scene.add(g); bell = { g, pts: [[31.2, -13.2], [31.2, -24.6], [40.4, -24.6]], s: 0, dir: 1, wait: 0 }; bell.len = 11.4 + 9.2; }
      let acc = 0;
      AF.onTick('downtown-int-machines', 332, (dt, t) => {
        const cam = AF.camera && AF.camera.position; if (!cam) return;
        const near = (x, z, r) => Math.abs(cam.x - x) < r && Math.abs(cam.z - z) < r;
        for (const T of trains) {
          if (!near(T.cx, T.cz, 70)) continue;
          T.s = (T.s + dt * T.speed / (T.rect ? 2.2 : 3.2)) % 1;
          for (let i = 0; i < T.parts.length; i++) { const u = (T.s - i * 0.045 + 1) % 1; loopPos(T, u); const x0 = tp[0], z0 = tp[2]; loopPos(T, (u + 0.01) % 1); const me = T.parts[i]; me.position.set(x0, T.y, z0); me.rotation.y = Math.atan2(tp[0] - x0, tp[2] - z0); }
        }
        for (const N of needles) { if (!near(N.piv.position.x, N.piv.position.z, 60)) continue; if (N.axis === 'z') N.piv.rotation.z = Math.sin(t * 5.3 + N.ph) * 0.35 + Math.sin(t * 13.1 + N.ph * 2) * 0.2; else N.piv.rotation.x = Math.sin(t * 0.23 + N.ph) * 1.25; }
        if (near(120, -27, 60)) for (const f of fans) f.rotation.y += dt * 2.4;
        if (bell && near(30, -20, 70)) {
          if (bell.wait > 0) bell.wait -= dt; else { bell.s += bell.dir * dt * 0.75; if (bell.s > bell.len || bell.s < 0) { bell.s = Math.max(0, Math.min(bell.len, bell.s)); bell.dir = -bell.dir; bell.wait = 4; } }
          const P = bell.pts, a = bell.s < 11.4; const t0 = a ? bell.s / 11.4 : (bell.s - 11.4) / 9.2, A = a ? P[0] : P[1], Bq = a ? P[1] : P[2];
          bell.g.position.set(A[0] + (Bq[0] - A[0]) * t0, 0.5, A[1] + (Bq[1] - A[1]) * t0);
          const fx = (Bq[0] - A[0]) * bell.dir, fz = (Bq[1] - A[1]) * bell.dir; bell.g.rotation.y = Math.atan2(fx, fz);
        }
        if (near(107, 38, 60)) { acc += dt; const on = (acc % 7) > 4.2 && ((acc * 3) | 0) % 2 === 0; apOn.visible = on; apOff.visible = !on; }
      });
    } catch (e) { (AF._dtFail || []).push('machines: ' + (e && e.message)); console.warn('[downtown-int] machines', e); }
  });
}

} catch (e) { AF.partError('21-downtown-2.js', e); }

