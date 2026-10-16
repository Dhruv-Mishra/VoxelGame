// ================================================================ 78-casino.js
try {
// ===== 78-casino: the Grand Casino aboard the SS Solace Queen — slots, roulette, blackjack, craps, baccarat  (OWNER: game) =====
// One overlay (#m-casino) runs every game. Stakes are plain cash (AF.money): a chip put on the felt is paid at once, winnings (stake
// included) come back when the round settles, Clear / Take down refunds what is still on the felt, and leaving settles a round in
// play and refunds the rest. House rules: single-zero roulette; 6-deck blackjack, dealer peeks and stands on soft 17, naturals pay
// 3:2, double on any two, split once (split aces take one card); craps pass / don't pass (bar 12) + the one-roll field (2 and 12
// pay double); punto banco baccarat (full tableau, 5% on banker, tie 8:1); three-reel slots returning ~94%. Main floor $5–$500,
// the High Rollers' Salon (tables with room 'gilded'; Mr Prescott's table is noPlay) $100–$5,000, slots $1–$25. Outcomes use Math.random: they are the player's own gameplay, never
// ambient world state. AF.casino.can(table) lets the heist close the tables; AF.casino.g is the game on screen.
{
  const UI = AF.ui, root = document.getElementById('ui'), LN = AF.liner;
  const cash = AF.cash || ((n) => '$' + Math.round(n).toLocaleString('en-US'));
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const snd = (id, vol) => { if (AF.audio) AF.audio.play(id, { bus: 'ui', vol: vol ?? 1 }); };
  const rnd = (n) => (Math.random() * n) | 0;
  const ROOMS = { floor: { min: 5, max: 500, chips: [5, 25, 100, 500] }, gilded: { min: 100, max: 5000, chips: [100, 500, 1000, 5000] }, slots: { min: 1, max: 25, chips: [1, 5, 25] } };
  const CZ = AF.casino = { g: null, net: 0, played: 0, tables: [], chip: 5, can: null };

  // ---------------------------------------------------------------- style + panel
  const st = document.createElement('style');
  st.textContent = `
  #ui #m-casino>.panel{width:min(640px,100%);max-height:calc(100% - 4px);overflow:auto;border-radius:18px;display:flex;flex-direction:column;gap:10px}
  #ui #m-casino>.panel>*{flex-shrink:0}
  #ui #m-casino .hd{display:flex;justify-content:space-between;align-items:flex-start;gap:10px}
  #ui #m-casino h2{margin:0;font:400 24px Limelight,Georgia,serif;letter-spacing:1px;color:#f6e6c4}
  #ui #m-casino .lim{color:var(--dim);font-size:11px} #ui #m-casino .bal{color:#a6e8b4;font-weight:600;font-size:16px;font-variant-numeric:tabular-nums}
  #ui #m-casino .felt{position:relative;border-radius:14px;padding:12px;min-height:150px;color:#fff;text-align:center;background:radial-gradient(ellipse at 50% 25%,#23864e,#0f4a2a 78%);box-shadow:inset 0 0 0 3px #6a4020,inset 0 0 0 5px rgba(216,176,74,.35),inset 0 8px 26px rgba(0,0,0,.45)}
  #ui #m-casino .felt.slot{background:radial-gradient(ellipse at 50% 20%,#9a2232,#3e0a12 80%)} #ui #m-casino .felt.baccarat{background:radial-gradient(ellipse at 50% 25%,#7a1c2a,#3a0a12 80%)}
  #ui #m-casino .msg{min-height:20px;text-align:center;font-size:13px;color:#f6e6c4} #ui #m-casino .msg b{color:#ffd24a}
  #ui #m-casino .chips{display:flex;gap:10px;justify-content:center}
  #ui #m-casino .chip{width:46px;height:46px;border-radius:50%;border:3px dashed rgba(255,255,255,.85);display:grid;place-items:center;font-weight:700;font-size:12px;color:#fff;box-shadow:0 2px 6px rgba(0,0,0,.5);transition:transform .12s,box-shadow .12s}
  #ui #m-casino .chip.on{transform:translateY(-4px) scale(1.08);box-shadow:0 0 0 2px #ffd24a,0 4px 12px rgba(0,0,0,.6)}
  #ui #m-casino .c0{background:#c8302a} #ui #m-casino .c1{background:#2a7a4a} #ui #m-casino .c2{background:#1d1d22} #ui #m-casino .c3{background:#7a3aa0} #ui #m-casino .c4{background:#d8a83a;color:#2a1a08} #ui #m-casino .c5{background:#2a4a9a}
  #ui #m-casino .acts{display:flex;gap:8px;justify-content:center;flex-wrap:wrap} #ui #m-casino .acts .btn{min-width:92px} #ui #m-casino .acts .btn[disabled]{opacity:.35;cursor:default}
  #ui #m-casino .lbl{font-size:12px;color:rgba(255,255,255,.75);margin:2px 0 6px} #ui #m-casino .lbl b{color:#ffd24a}
  #ui #m-casino .rule{font-size:10px;letter-spacing:1px;text-transform:uppercase;color:rgba(255,236,190,.55);margin-top:8px}
  #ui #m-casino .cards{display:flex;gap:6px;justify-content:center;min-height:70px;margin-bottom:6px}
  #ui #m-casino .cd{width:46px;height:66px;border-radius:7px;background:#fbf8f0;color:#1a1a1e;display:flex;flex-direction:column;align-items:center;justify-content:center;font:700 17px Georgia,serif;box-shadow:0 2px 6px rgba(0,0,0,.45);animation:czIn .22s ease-out}
  #ui #m-casino .cd span{font-size:20px;line-height:1} #ui #m-casino .cd.r{color:#c8202a}
  #ui #m-casino .cd.bk{background:repeating-linear-gradient(45deg,#8a1e2a 0 5px,#5a121c 5px 10px);border:2px solid #fbf8f0;box-sizing:border-box}
  #ui #m-casino .hands{display:flex;gap:16px;justify-content:center;flex-wrap:wrap} #ui #m-casino .hand{padding:4px 6px;border-radius:10px} #ui #m-casino .hand.on{background:rgba(255,236,160,.13)}
  #ui #m-casino .hand small{display:block;font-size:11px;color:rgba(255,255,255,.8)}
  #ui #m-casino .spots{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:6px}
  #ui #m-casino .spot{min-width:120px;padding:8px 10px;border:2px solid rgba(255,236,190,.6);border-radius:12px;cursor:pointer;font:600 13px var(--font);letter-spacing:1px;transition:background .12s}
  #ui #m-casino .spot:hover{background:rgba(255,255,255,.08)} #ui #m-casino .spot.off{opacity:.4;cursor:default}
  #ui #m-casino .spot small{display:block;font-size:10px;font-weight:400;letter-spacing:0;color:rgba(255,255,255,.65)} #ui #m-casino .amt{display:block;font-style:normal;color:#ffd24a;min-height:16px}
  #ui #m-casino .rl{display:grid;grid-template-columns:28px repeat(12,minmax(0,1fr)) 32px;gap:2px;font-size:12px;user-select:none}
  #ui #m-casino .rl>div{position:relative;padding:7px 0;border-radius:4px;cursor:pointer;background:rgba(0,0,0,.15);box-shadow:inset 0 0 0 1px rgba(255,236,190,.35)}
  #ui #m-casino .rl>div:hover{background:rgba(255,255,255,.14)} #ui #m-casino .rl .r{background:#a8202a} #ui #m-casino .rl .k{background:#17171b} #ui #m-casino .rl .z{grid-row:1/span 3;background:#1f7a46;display:grid;place-items:center}
  #ui #m-casino .rl i{position:absolute;right:-3px;top:-5px;min-width:16px;padding:1px 3px;border-radius:9px;background:#ffd24a;color:#2a1a08;font:700 9px var(--font);font-style:normal;box-shadow:0 1px 3px rgba(0,0,0,.6);z-index:1}
  #ui #m-casino .rr{display:flex;align-items:center;justify-content:center;gap:12px;margin-bottom:10px}
  #ui #m-casino .ball{width:46px;height:46px;border-radius:50%;display:grid;place-items:center;font:700 20px Georgia,serif;box-shadow:0 0 0 3px #d8b04a,0 3px 10px rgba(0,0,0,.5)}
  #ui #m-casino .ball.r{background:#b0202a} #ui #m-casino .ball.k{background:#17171b} #ui #m-casino .ball.g{background:#1f8a4a} #ui #m-casino .ball.n{background:rgba(0,0,0,.25)}
  #ui #m-casino .hist{display:flex;gap:3px;flex-wrap:wrap;max-width:300px} #ui #m-casino .hist span{width:20px;height:20px;border-radius:50%;display:grid;place-items:center;font-size:10px;font-weight:700}
  #ui #m-casino .hist .r{background:#b0202a} #ui #m-casino .hist .k{background:#17171b} #ui #m-casino .hist .g{background:#1f8a4a} #ui #m-casino .hist .P{background:#2a4a9a} #ui #m-casino .hist .B{background:#b0202a} #ui #m-casino .hist .T{background:#1f8a4a}
  #ui #m-casino .reels{display:flex;gap:10px;justify-content:center;margin:6px 0 10px}
  #ui #m-casino .reel{width:86px;height:100px;border-radius:12px;display:grid;place-items:center;font:700 40px Georgia,serif;background:linear-gradient(#cfc8b4,#fffdf6 30%,#fffdf6 70%,#cfc8b4);box-shadow:inset 0 4px 12px rgba(0,0,0,.4),0 0 0 3px #d8b04a}
  #ui #m-casino .reel.spin{filter:blur(1.5px)} #ui #m-casino .s0{color:#d8202a} #ui #m-casino .s1{color:#1a1a1e;font-size:28px} #ui #m-casino .s2{color:#b8860b} #ui #m-casino .s3{color:#e0a800} #ui #m-casino .s4{color:#2a6ad8} #ui #m-casino .s5{color:#1f8a4a}
  #ui #m-casino .pay{display:flex;gap:4px 12px;justify-content:center;flex-wrap:wrap;font-size:11px;color:rgba(255,236,190,.85)} #ui #m-casino .pay b{color:#ffd24a}
  #ui #m-casino .dice{font-size:64px;line-height:1;margin:2px 0 4px;text-shadow:0 3px 8px rgba(0,0,0,.5)}
  #ui #m-casino .two{display:flex;justify-content:center;gap:28px;flex-wrap:wrap}
  @keyframes czIn{from{transform:translateY(-14px) rotate(-6deg);opacity:0}}
  @media (max-width:520px),(max-height:520px){#ui #m-casino>.panel{padding:10px 12px;gap:7px} #ui #m-casino h2{font-size:18px} #ui #m-casino .rl{font-size:10px} #ui #m-casino .rl>div{padding:5px 0}
    #ui #m-casino .cd{width:38px;height:54px;font-size:14px} #ui #m-casino .reel{width:66px;height:76px;font-size:32px} #ui #m-casino .chip{width:40px;height:40px} #ui #m-casino .felt{padding:8px;min-height:0} #ui #m-casino .spot{min-width:96px;padding:6px}}`;
  document.head.appendChild(st);
  const el = document.createElement('div'); el.className = 'sheet pe'; el.id = 'm-casino';
  el.innerHTML = '<div class="panel"><div class="hd"><div><h2></h2><div class="lim"></div></div><b class="bal"></b></div><div class="felt"></div><div class="msg" aria-live="polite"></div><div class="chips"></div><div class="acts"></div><div class="stack"><button class="btn" data-k="close">Leave the table</button></div></div>';
  root.appendChild(el);
  const $ = (s) => el.querySelector(s);
  const hT = $('h2'), hL = $('.lim'), hB = $('.bal'), felt = $('.felt'), msgEl = $('.msg'), chipsEl = $('.chips'), actsEl = $('.acts');
  const chipCls = (v) => v >= 5000 ? 'c5' : v >= 1000 ? 'c4' : v >= 500 ? 'c3' : v >= 100 ? 'c2' : v >= 25 ? 'c1' : 'c0';
  const chipTxt = (v) => v >= 1000 ? (v / 1000) + 'k' : String(v);
  const render = () => {
    const g = CZ.g; if (!g) return;
    hT.textContent = g.T.title; hL.textContent = g.T.sub + ' \u00b7 ' + cash(g.R.min) + '\u2013' + cash(g.R.max); hB.textContent = cash(AF.money.v);
    felt.className = 'felt ' + g.T.kind; felt.innerHTML = g.felt(); msgEl.innerHTML = g.msg || '';
    chipsEl.innerHTML = g.R.chips.map((v) => `<button class="chip ${chipCls(v)}${v === CZ.chip ? ' on' : ''}" data-chip="${v}" aria-label="${cash(v)} chip">${chipTxt(v)}</button>`).join('');
    actsEl.innerHTML = g.acts().map((a) => `<button class="btn${a.pri ? ' primary' : ''}" data-a="${a.k}"${a.off ? ' disabled' : ''}>${esc(a.label)}</button>`).join('');
  };
  const renderFelt = () => { if (CZ.g) felt.innerHTML = CZ.g.felt(); };
  const cheer = (T) => { if (AF.audio) AF.audio.play('cheer', { x: T.src.x, y: T.y + 2, z: T.src.z, vol: 0.8 }); };

  // ---------------------------------------------------------------- money on the felt
  const stake = (g, n) => {
    if (AF.money.v < n) { g.msg = 'Not enough cash for that.'; snd('ui_deny'); render(); return false; }
    AF.money.add(-n); CZ.net -= n; snd('chips', 0.7); return true;
  };
  const payout = (n) => { n = Math.floor(n); if (n > 0) { AF.money.add(n); CZ.net += n; } return n; };
  class Game {
    constructor(T, room) { this.T = T; this.room = room; this.R = ROOMS[room]; this.bets = {}; this.last = null; this.q = []; this.busy = false; this.msg = T.hello || ''; }
    get total() { let s = 0; for (const k in this.bets) s += this.bets[k]; return s; }
    canBet() { return !this.busy; }
    place(k) {
      if (!this.canBet(k)) { snd('ui_deny', 0.6); return; }
      const c = CZ.chip, cur = this.bets[k] || 0;
      if (cur + c > this.R.max) { this.msg = 'The limit is ' + cash(this.R.max) + ' a spot.'; snd('ui_deny'); render(); return; }
      if (!stake(this, c)) return;
      this.bets[k] = cur + c; render();
    }
    clear(keys) { let back = 0; for (const k of keys || Object.keys(this.bets)) { back += this.bets[k] || 0; delete this.bets[k]; } if (back) { AF.money.add(back); CZ.net += back; } render(); }
    rebet() { if (!this.last || this.busy) return; for (const k in this.last) { if (!this.canBet(k) || !stake(this, this.last[k])) break; this.bets[k] = (this.bets[k] || 0) + this.last[k]; } render(); }
    minOk() { const t = this.total; if (t >= this.R.min) return true; this.msg = 'The minimum here is ' + cash(this.R.min) + '.'; snd('ui_deny'); render(); return false; }
    // a little dealer timeline: steps run one after another, the buttons wait
    later(s, fn) { this.q.push([s, fn]); this.busy = true; }
    tick(dt) {
      if (this.q.length) { this.q[0][0] -= dt; if (this.q[0][0] <= 0) { this.q.shift()[1](); this.busy = this.q.length > 0; render(); } }
      if (this.anim) this.anim(dt);
    }
    flush() { while (this.q.length) this.q.shift()[1](); this.busy = false; }
    leave() { this.flush(); this.clear(); }
  }

  // ---------------------------------------------------------------- slots: Solace Sevens (weights 1 2 3 4 6 8 of 24 per reel)
  const SYM = ['7', 'BAR', '\u265b', '\u2605', '\u2666', '\u2663'], SW = [1, 2, 3, 4, 6, 8], P3 = [300, 100, 40, 20, 10, 5];
  const reel = () => { let r = Math.random() * 24; for (let i = 0; i < 6; i++) if ((r -= SW[i]) < 0) return i; return 5; };
  const slotPay = (a, b, c) => a === b && b === c ? P3[a] : (a === 0) + (b === 0) + (c === 0) === 2 ? 10 : a === 5 && (b === 5 || c === 5) ? 2 : 0;
  class Slots extends Game {
    constructor(T) { super(T, 'slots'); this.show = [reel(), reel(), reel()]; this.res = null; this.st = 0; this.fl = 0; }
    canBet() { return false; }
    felt() {
      const stop = (i) => !this.res || this.st >= 0.75 + i * 0.45;
      return `<div class="reels">${this.show.map((s, i) => `<div class="reel s${s}${stop(i) ? '' : ' spin'}">${SYM[s]}</div>`).join('')}</div>
        <div class="pay">${P3.map((p, i) => `<span>${SYM[i]} ${SYM[i]} ${SYM[i]} <b>${p}\u00d7</b></span>`).join('')}<span>any two 7 <b>10\u00d7</b></span><span>\u2663 \u2663 on the left, or both ends <b>2\u00d7</b></span></div>`;
    }
    acts() { return [{ k: 'spin', label: 'Spin \u00b7 ' + cash(CZ.chip), pri: true, off: this.busy }]; }
    act(k) {
      if (k !== 'spin' || this.busy) return;
      if (!stake(this, CZ.chip)) return;
      this.bet = CZ.chip; this.res = [reel(), reel(), reel()]; this.stopped = [false, false, false]; this.st = 0; this.fl = 0; this.busy = true; CZ.played++;
      this.msg = 'Round and round\u2026'; snd('slot_spin');
    }
    anim(dt) {
      if (!this.res) return;
      this.st += dt; this.fl -= dt; let ch = false;
      for (let i = 0; i < 3; i++) {
        if (this.st < 0.75 + i * 0.45) { if (this.fl <= 0) { this.show[i] = rnd(6); ch = true; } }
        else if (!this.stopped[i]) { this.stopped[i] = true; this.show[i] = this.res[i]; ch = true; snd('ui_click', 0.5); }
      }
      if (this.fl <= 0) this.fl = 0.06;
      if (this.st > 2.0) this.settle(); else if (ch) renderFelt();
    }
    settle() {
      const r = this.res; if (!r) return; this.show = r.slice(); this.res = null; this.busy = false;
      const x = slotPay(r[0], r[1], r[2]), won = payout(this.bet * x);
      this.msg = won ? `<b>${x}\u00d7</b> \u2014 the machine pays ${cash(won)}!` : 'Nothing this time.';
      if (won) snd(x >= 20 ? 'slot_win' : 'coins'); if (x >= 40) cheer(this.T);
      render();
    }
    leave() { this.settle(); }
  }

  // ---------------------------------------------------------------- roulette (single zero; straight 35:1, dozens + columns 2:1, even money 1:1)
  const RED = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
  const ROUT = { red: (n) => RED.has(n), black: (n) => n > 0 && !RED.has(n), odd: (n) => n % 2 === 1, even: (n) => n > 0 && n % 2 === 0, low: (n) => n >= 1 && n <= 18, high: (n) => n >= 19,
    d1: (n) => n >= 1 && n <= 12, d2: (n) => n >= 13 && n <= 24, d3: (n) => n >= 25, c1: (n) => n > 0 && n % 3 === 1, c2: (n) => n > 0 && n % 3 === 2, c3: (n) => n > 0 && n % 3 === 0 };
  const rlPay = (k, n) => k[0] === 'n' ? (+k.slice(1) === n ? 36 : 0) : ROUT[k](n) ? (k[0] === 'd' || k[0] === 'c' ? 3 : 2) : 0;
  const rlCls = (n) => n == null ? 'n' : n === 0 ? 'g' : RED.has(n) ? 'r' : 'k';
  class Roulette extends Game {
    constructor(T, room) { super(T, room); this.hist = []; this.n = null; this.res = null; this.sp = 0; this.fl = 0; }
    felt() {
      const B = this.bets, cell = (k, label, cls, style) => `<div class="${cls || ''}" data-bet="${k}"${style ? ` style="${style}"` : ''}>${label}${B[k] ? `<i>${chipTxt(B[k])}</i>` : ''}</div>`;
      let g = cell('n0', '0', 'z');
      for (let row = 0; row < 3; row++) { for (let col = 0; col < 12; col++) { const n = col * 3 + 3 - row; g += cell('n' + n, n, RED.has(n) ? 'r' : 'k'); } g += cell('c' + (3 - row), '2:1'); }
      g += cell('d1', '1st 12', '', 'grid-column:2/span 4') + cell('d2', '2nd 12', '', 'grid-column:6/span 4') + cell('d3', '3rd 12', '', 'grid-column:10/span 4');
      [['low', '1\u201318'], ['even', 'EVEN'], ['red', 'RED', 'r'], ['black', 'BLACK', 'k'], ['odd', 'ODD'], ['high', '19\u201336']].forEach(([k, l, c], i) => { g += cell(k, l, c, `grid-column:${2 + i * 2}/span 2`); });
      return `<div class="rr"><span class="ball ${rlCls(this.n)}">${this.n ?? '\u2013'}</span><span class="hist">${this.hist.map((n) => `<span class="${rlCls(n)}">${n}</span>`).join('')}</span></div><div class="rl">${g}</div><div class="rule">Single zero \u00b7 straight up 35 to 1 \u00b7 dozens and columns 2 to 1</div>`;
    }
    acts() { return [{ k: 'spin', label: 'Spin the wheel', pri: true, off: this.busy || !this.total }, { k: 'clear', label: 'Clear', off: this.busy || !this.total }, { k: 'rebet', label: 'Rebet', off: this.busy || !!this.total || !this.last }]; }
    act(k) {
      if (k === 'clear') { if (!this.busy) this.clear(); return; }
      if (k === 'rebet') return this.rebet();
      if (k !== 'spin' || this.busy || !this.total || !this.minOk()) return;
      this.last = Object.assign({}, this.bets); this.res = rnd(37); this.sp = 0; this.busy = true; CZ.played++;
      this.msg = 'No more bets\u2026'; snd('roulette');
    }
    anim(dt) {
      if (this.res == null) return;
      this.sp += dt; this.fl -= dt;
      if (this.sp < 3.4) { if (this.fl <= 0) { this.fl = 0.05 + this.sp * 0.09; this.n = rnd(37); renderFelt(); } return; }
      this.settle();
    }
    settle() {
      if (this.res == null) return;
      const n = this.n = this.res; this.res = null; let won = 0;
      for (const k in this.bets) won += this.bets[k] * rlPay(k, n);
      this.bets = {}; this.hist.unshift(n); if (this.hist.length > 12) this.hist.length = 12; this.busy = false;
      won = payout(won);
      this.msg = `<b>${n} ${n === 0 ? 'green' : RED.has(n) ? 'red' : 'black'}</b> \u2014 ` + (won ? 'you collect ' + cash(won) + '!' : 'the house takes it.');
      if (won) snd('coins'); if (won >= 20 * this.R.min) cheer(this.T);
      render();
    }
    leave() { this.settle(); this.clear(); }
  }

  // ---------------------------------------------------------------- cards
  const RANK = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'], SUIT = ['\u2660', '\u2665', '\u2666', '\u2663'];
  const cardHtml = (c) => c ? `<div class="cd${c.s === 1 || c.s === 2 ? ' r' : ''}"><b>${RANK[c.r]}</b><span>${SUIT[c.s]}</span></div>` : '<div class="cd bk"></div>';
  class Shoe {
    constructor(decks) { this.decks = decks; this.cards = []; }
    fresh() {   // reshuffle between rounds once three quarters are dealt
      if (this.cards.length > this.decks * 13) return;
      const a = []; for (let d = 0; d < this.decks; d++) for (let s = 0; s < 4; s++) for (let r = 0; r < 13; r++) a.push({ r, s });
      for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); const t = a[i]; a[i] = a[j]; a[j] = t; }
      this.cards = a; snd('card_shuffle');
    }
    pop() { return this.cards.pop(); }
  }

  // ---------------------------------------------------------------- blackjack
  const bjVal = (cs) => { let v = 0, a = 0; for (const c of cs) { v += c.r === 0 ? 11 : Math.min(10, c.r + 1); if (c.r === 0) a++; } while (v > 21 && a) { v -= 10; a--; } return { v, soft: a > 0 }; };
  const ten = (c) => Math.min(10, c.r + 1);
  class Blackjack extends Game {
    constructor(T, room) { super(T, room); this.shoe = new Shoe(6); this.phase = 'bet'; this.dealer = []; this.hands = []; this.cur = 0; this.hole = true; }
    canBet(k) { return !this.busy && k === 'main' && (this.phase === 'bet' || this.phase === 'done'); }
    place(k) { if (this.canBet(k) && this.phase === 'done') this.reset(); super.place(k); }
    reset() { this.phase = 'bet'; this.dealer = []; this.hands = []; this.cur = 0; this.hole = true; }
    felt() {
      const d = this.dealer, dv = !d.length ? '' : this.hole ? bjVal([d[0]]).v : bjVal(d).v;
      const val = (cs) => { const b = bjVal(cs); return (b.soft && b.v < 21 ? 'soft ' : '') + b.v; };
      const hands = this.hands.map((h, i) => `<div class="hand${i === this.cur && this.phase === 'play' && this.hands.length > 1 ? ' on' : ''}"><div class="cards">${h.cards.map(cardHtml).join('')}</div><small>${h.cards.length ? val(h.cards) : ''}${h.res ? ' \u00b7 ' + h.res : ''} \u00b7 ${cash(h.bet)}</small></div>`).join('');
      const spot = this.phase === 'bet' || this.phase === 'done' ? `<div class="spots"><div class="spot" data-bet="main">BET<i class="amt">${this.bets.main ? cash(this.bets.main) : ''}</i><small>tap to add the chip</small></div></div>` : '';
      return `<div class="lbl">Dealer${dv !== '' ? ' \u00b7 <b>' + dv + '</b>' : ''}</div><div class="cards">${d.map((c, i) => cardHtml(i === 1 && this.hole ? null : c)).join('')}</div>
        <div class="hands">${hands}</div>${spot}<div class="rule">Blackjack pays 3 to 2 \u00b7 dealer stands on soft 17 \u00b7 double on any two \u00b7 split once</div>`;
    }
    acts() {
      if (this.phase === 'play') {
        const h = this.hands[this.cur], two = !!h && h.cards.length === 2, rich = !!h && AF.money.v >= h.bet;
        return [{ k: 'hit', label: 'Hit', pri: true, off: this.busy }, { k: 'stand', label: 'Stand', off: this.busy }, { k: 'double', label: 'Double', off: this.busy || !two || !rich },
          { k: 'split', label: 'Split', off: this.busy || !two || !rich || this.hands.length > 1 || ten(h.cards[0]) !== ten(h.cards[1]) }];
      }
      return [{ k: 'deal', label: 'Deal', pri: true, off: this.busy || !this.bets.main }, { k: 'clear', label: 'Clear', off: this.busy || !this.bets.main }, { k: 'rebet', label: 'Rebet', off: this.busy || !!this.bets.main || !this.last }];
    }
    act(k) {
      if (k === 'clear') { if (!this.busy) this.clear(); return; }
      if (k === 'rebet') { if (this.phase === 'done' && !this.busy) this.reset(); return this.rebet(); }
      if (k === 'deal') return this.deal();
      if (this.phase !== 'play' || this.busy) return;
      const h = this.hands[this.cur];
      if (k === 'hit') { h.cards.push(this.shoe.pop()); snd('card_deal'); if (bjVal(h.cards).v >= 21) this.next(); }
      else if (k === 'stand') this.next();
      else if (k === 'double' && h.cards.length === 2) { if (!stake(this, h.bet)) return; h.bet *= 2; h.cards.push(this.shoe.pop()); snd('card_deal'); this.next(); }
      else if (k === 'split' && h.cards.length === 2 && this.hands.length === 1) {
        if (!stake(this, h.bet)) return;
        const h2 = { cards: [h.cards.pop()], bet: h.bet }; this.hands.push(h2); h.cards.push(this.shoe.pop()); h2.cards.push(this.shoe.pop()); snd('card_deal');
        if (h.cards[0].r === 0) { this.cur = this.hands.length; this.advance(); } else this.advance();
      }
    }
    deal() {
      if (this.busy || !this.bets.main || !this.minOk()) return;
      if (this.phase === 'done') this.reset();
      this.shoe.fresh(); this.last = { main: this.bets.main }; CZ.played++;
      const H = { cards: [], bet: this.bets.main }, S = this.shoe; this.bets = {}; this.hands = [H]; this.dealer = []; this.hole = true; this.cur = 0; this.phase = 'deal'; this.msg = '';
      this.later(0.2, () => { H.cards.push(S.pop()); snd('card_deal'); });
      this.later(0.3, () => { this.dealer.push(S.pop()); snd('card_deal'); });
      this.later(0.3, () => { H.cards.push(S.pop()); snd('card_deal'); });
      this.later(0.3, () => { this.dealer.push(S.pop()); snd('card_place'); this.afterDeal(); });
    }
    afterDeal() {
      const H = this.hands[0], pbj = bjVal(H.cards).v === 21, up = this.dealer[0], peek = up.r === 0 || up.r >= 9, dbj = bjVal(this.dealer).v === 21;
      if (peek && dbj) { this.hole = false; this.phase = 'done'; H.res = pbj ? 'push' : 'lose'; if (pbj) payout(H.bet); this.msg = pbj ? 'Blackjack against blackjack \u2014 a push.' : 'The dealer turns over <b>blackjack</b>.'; return; }
      if (pbj) { this.hole = false; this.phase = 'done'; const w = payout(H.bet * 2.5); H.res = 'blackjack'; this.msg = `<b>Blackjack!</b> Pays ${cash(w)}.`; snd('slot_win'); if (H.bet >= this.R.min * 10) cheer(this.T); return; }
      this.phase = 'play'; this.msg = peek ? 'The dealer checks\u2026 no blackjack. Your move.' : 'Your move.';
    }
    next() { this.cur++; this.advance(); }
    advance() { while (this.cur < this.hands.length && bjVal(this.hands[this.cur].cards).v >= 21) this.cur++; if (this.cur >= this.hands.length) this.dealerPlay(); }
    dealerPlay() {
      this.phase = 'dealer'; this.hole = false; snd('card_place');
      const live = this.hands.some((h) => bjVal(h.cards).v <= 21);
      const step = () => { if (live && bjVal(this.dealer).v < 17) this.later(0.55, () => { this.dealer.push(this.shoe.pop()); snd('card_deal'); step(); }); else this.later(0.35, () => this.settle()); };
      step();
    }
    settle() {
      const dv = bjVal(this.dealer).v; let won = 0, staked = 0;
      for (const h of this.hands) {
        const v = bjVal(h.cards).v; staked += h.bet;
        if (v > 21) h.res = 'bust'; else if (dv > 21 || v > dv) { h.res = 'win'; won += h.bet * 2; } else if (v === dv) { h.res = 'push'; won += h.bet; } else h.res = 'lose';
      }
      won = payout(won); this.phase = 'done';
      this.msg = (dv > 21 ? 'The dealer busts! ' : 'Dealer has ' + dv + '. ') + (won > staked ? 'You win <b>' + cash(won - staked) + '</b>.' : won === staked ? 'A push.' : 'The house wins.');
      if (won > staked) snd('coins'); if (won - staked >= this.R.min * 20) cheer(this.T);
    }
    leave() { this.flush(); if (this.phase === 'play') { this.cur = this.hands.length; this.dealerPlay(); this.flush(); } this.clear(); }
  }

  // ---------------------------------------------------------------- craps (pass / don't pass, bar 12; the field is one roll)
  const DIE = ['\u2680', '\u2681', '\u2682', '\u2683', '\u2684', '\u2685'];
  class Craps extends Game {
    constructor(T, room) { super(T, room); this.point = 0; this.d = [rnd(6), rnd(6)]; this.res = null; this.rt = 0; this.fl = 0; }
    canBet(k) { return !this.busy && (k === 'field' || !this.point); }
    felt() {
      const spot = (k, label, sub) => `<div class="spot${this.canBet(k) ? '' : ' off'}" data-bet="${k}">${label}<small>${sub}</small><i class="amt">${this.bets[k] ? cash(this.bets[k]) : ''}</i></div>`;
      return `<div class="dice">${DIE[this.d[0]]} ${DIE[this.d[1]]}</div><div class="lbl">${this.point ? 'The point is <b>' + this.point + '</b> \u2014 make it again before a 7' : 'Come-out roll'}</div>
        <div class="spots">${spot('pass', 'PASS LINE', '7 or 11 wins \u00b7 2 3 12 lose')}${spot('dont', 'DON\u2019T PASS', '2 or 3 wins \u00b7 12 pushes')}${spot('field', 'FIELD', '3 4 9 10 11 \u00b7 2 and 12 pay double')}</div>
        <div class="rule">Pass and don't pass stay up until the point is decided</div>`;
    }
    acts() {
      const down = !!(this.bets.field || (!this.point && (this.bets.pass || this.bets.dont)));
      return [{ k: 'roll', label: 'Roll the dice', pri: true, off: this.busy || !this.total }, { k: 'clear', label: 'Take down', off: this.busy || !down }, { k: 'rebet', label: 'Rebet', off: this.busy || !!this.total || !this.last }];
    }
    act(k) {
      if (k === 'clear') { if (!this.busy) this.clear(this.point ? ['field'] : null); return; }
      if (k === 'rebet') return this.rebet();
      if (k !== 'roll' || this.busy || !this.total || !this.minOk()) return;
      this.last = Object.assign({}, this.bets); this.res = [rnd(6), rnd(6)]; this.rt = 0; this.thrown = false; this.busy = true; CZ.played++;
      this.msg = 'The shooter shakes\u2026'; snd('dice_shake');
    }
    anim(dt) {
      if (!this.res) return;
      this.rt += dt; this.fl -= dt;
      if (!this.thrown && this.rt > 0.55) { this.thrown = true; snd('dice_throw'); }
      if (this.rt < 1.15) { if (this.fl <= 0) { this.fl = 0.07; this.d = [rnd(6), rnd(6)]; renderFelt(); } return; }
      this.settle();
    }
    settle() {
      if (!this.res) return;
      this.d = this.res; this.res = null; this.busy = false;
      const n = this.d[0] + this.d[1] + 2, b = this.bets; let won = 0, note = '';
      if (b.field) { won += b.field * (n === 2 || n === 12 ? 3 : [3, 4, 9, 10, 11].includes(n) ? 2 : 0); delete b.field; }
      if (!this.point) {
        if (n === 7 || n === 11) { won += (b.pass || 0) * 2; delete b.pass; delete b.dont; note = ' \u2014 a natural, pass wins.'; }
        else if (n === 2 || n === 3) { won += (b.dont || 0) * 2; delete b.pass; delete b.dont; note = ' \u2014 craps, don\u2019t pass wins.'; }
        else if (n === 12) { delete b.pass; note = ' \u2014 craps; don\u2019t pass is barred and stays.'; }
        else { this.point = n; note = ' \u2014 the point is ' + n + '.'; }
      } else if (n === this.point) { won += (b.pass || 0) * 2; delete b.pass; delete b.dont; this.point = 0; note = ' \u2014 point made!'; }
      else if (n === 7) { won += (b.dont || 0) * 2; delete b.pass; delete b.dont; this.point = 0; note = ' \u2014 seven out.'; }
      won = payout(won);
      this.msg = `Rolled <b>${n}</b>${note}` + (won ? ' You collect ' + cash(won) + '.' : '');
      if (won) snd('coins'); if (won >= this.R.min * 20) cheer(this.T);
      render();
    }
    leave() { this.settle(); this.clear(); this.point = 0; }
  }

  // ---------------------------------------------------------------- baccarat (punto banco tableau)
  const bacV = (cs) => cs.reduce((s, c) => s + (c.r >= 9 ? 0 : c.r + 1), 0) % 10;
  const bacDraw = (bv, p3) => p3 == null ? bv <= 5 : bv <= 2 ? true : bv === 3 ? p3 !== 8 : bv === 4 ? p3 >= 2 && p3 <= 7 : bv === 5 ? p3 >= 4 && p3 <= 7 : bv === 6 ? p3 === 6 || p3 === 7 : false;
  class Baccarat extends Game {
    constructor(T, room) { super(T, room); this.shoe = new Shoe(8); this.P = []; this.B = []; this.hist = []; }
    felt() {
      const spot = (k, label, sub) => `<div class="spot${this.canBet(k) ? '' : ' off'}" data-bet="${k}">${label}<small>${sub}</small><i class="amt">${this.bets[k] ? cash(this.bets[k]) : ''}</i></div>`;
      const side = (name, cs) => `<div><div class="lbl">${name}${cs.length ? ' \u00b7 <b>' + bacV(cs) + '</b>' : ''}</div><div class="cards">${cs.map(cardHtml).join('')}</div></div>`;
      return `<div class="two">${side('Player', this.P)}${side('Banker', this.B)}</div>
        <div class="spots">${spot('player', 'PLAYER', 'pays 1 to 1')}${spot('tie', 'TIE', 'pays 8 to 1')}${spot('banker', 'BANKER', '1 to 1, less 5%')}</div>
        <div class="rr" style="margin:8px 0 0"><span class="hist">${this.hist.map((r) => `<span class="${r}">${r}</span>`).join('')}</span></div>`;
    }
    acts() { return [{ k: 'deal', label: 'Deal', pri: true, off: this.busy || !this.total }, { k: 'clear', label: 'Clear', off: this.busy || !this.total }, { k: 'rebet', label: 'Rebet', off: this.busy || !!this.total || !this.last }]; }
    act(k) {
      if (k === 'clear') { if (!this.busy) this.clear(); return; }
      if (k === 'rebet') return this.rebet();
      if (k !== 'deal' || this.busy || !this.total || !this.minOk()) return;
      this.last = Object.assign({}, this.bets); this.shoe.fresh(); CZ.played++; this.P = []; this.B = []; this.msg = '';
      const S = this.shoe, P = this.P, B = this.B;
      this.later(0.2, () => { P.push(S.pop()); snd('card_deal'); }); this.later(0.3, () => { B.push(S.pop()); snd('card_deal'); });
      this.later(0.3, () => { P.push(S.pop()); snd('card_deal'); }); this.later(0.3, () => { B.push(S.pop()); snd('card_deal'); this.third(); });
    }
    third() {
      const pv = bacV(this.P), bv = bacV(this.B), S = this.shoe;
      if (pv >= 8 || bv >= 8) { this.later(0.4, () => this.settle(true)); return; }
      let p3 = null;
      if (pv <= 5) { const c = S.pop(); p3 = c.r >= 9 ? 0 : c.r + 1; this.later(0.6, () => { this.P.push(c); snd('card_deal'); }); }
      if (bacDraw(bv, p3)) { const c = S.pop(); this.later(0.6, () => { this.B.push(c); snd('card_deal'); }); }
      this.later(0.45, () => this.settle(false));
    }
    settle(natural) {
      const pv = bacV(this.P), bv = bacV(this.B), r = pv > bv ? 'P' : bv > pv ? 'B' : 'T', b = this.bets;
      let won = r === 'P' ? (b.player || 0) * 2 : r === 'B' ? (b.banker || 0) * 1.95 : (b.tie || 0) * 9 + (b.player || 0) + (b.banker || 0);
      this.bets = {}; won = payout(won); this.hist.unshift(r); if (this.hist.length > 16) this.hist.length = 16;
      this.msg = `<b>${r === 'P' ? 'Player' : r === 'B' ? 'Banker' : 'Tie'}</b>${r === 'T' ? '' : ' wins'}, ${pv} to ${bv}${natural ? ' \u2014 a natural' : ''}.` + (won ? ' You collect ' + cash(won) + '.' : '');
      if (won) snd('coins'); if (won >= this.R.min * 20) cheer(this.T);
    }
    leave() { this.flush(); this.clear(); }
  }

  // ---------------------------------------------------------------- open / close + the tables
  const KINDS = { slot: Slots, roulette: Roulette, blackjack: Blackjack, craps: Craps, baccarat: Baccarat };
  CZ.open = (T) => {
    if (CZ.g) return;
    const g = CZ.g = T.game || (T.game = new KINDS[T.kind](T, T.room));
    if (!g.R.chips.includes(CZ.chip)) CZ.chip = g.R.chips[0];
    UI.state.casino = true; el.classList.add('open'); AF.input.releaseLock(); if (AF.PL) AF.PL.aim = false; render();
    AF.emit('casino', T);
  };
  CZ.close = () => {
    const g = CZ.g; if (!g) return;
    g.leave(); CZ.g = null; UI.state.casino = false; el.classList.remove('open'); AF.input.requestLock();
  };
  el.addEventListener('click', (e) => {
    const g = CZ.g; if (!g) return;
    if (e.target === el || e.target.closest('[data-k=close]')) { CZ.close(); return; }
    const c = e.target.closest('[data-chip]'); if (c) { CZ.chip = +c.dataset.chip; snd('ui_click', 0.5); render(); return; }
    const b = e.target.closest('[data-bet]'); if (b) { g.place(b.dataset.bet); return; }
    const a = e.target.closest('[data-a]'); if (a && !a.disabled) { g.act(a.dataset.a); render(); }
  });
  AF.onTick('casino', 955, (dt) => {
    const g = CZ.g; if (!g) return;
    g.tick(Math.min(dt, 0.1));
    const p = AF.player;
    if (AF.mode !== 'walk' || (p && Math.hypot(p.x - g.T.ix, p.z - g.T.iz) > 5) || (CZ.can && !CZ.can(g.T))) CZ.close();
  });
  const NAME = { slot: 'Solace Sevens', roulette: 'Roulette', blackjack: 'Blackjack', craps: 'Craps', baccarat: 'Baccarat' };
  const HELLO = { slot: 'Pick a stake and spin.', roulette: 'Pick a chip and place your bets on the layout.', blackjack: 'Put a chip on BET, then deal.', craps: 'Back the pass line or the don\u2019t \u2014 or try the field.', baccarat: 'Player, banker or tie. The cards do the rest.' };
  AF.onBuild('casino', 892, () => {
    if (!LN || !LN.tables.length) return;
    for (const t of LN.tables) {
      if (t.noPlay) continue;
      const gilded = t.room ? t.room === 'gilded' : t.x > -250 && t.x < -238, room = t.kind === 'slot' ? 'slots' : gilded ? 'gilded' : 'floor', R = ROOMS[room];
      const ix = t.kind === 'craps' ? t.x - t.w / 2 - 0.6 : t.x, iz = t.kind === 'slot' ? t.z + t.face * 0.8 : t.kind === 'craps' ? t.z : t.z + t.d / 2 + 0.6;
      const T = { kind: t.kind, src: t, ix, iz, y: t.y, room, title: NAME[t.kind], sub: t.kind === 'slot' ? 'Three reels' : gilded ? 'High Rollers\u2019 Salon \u00b7 high stakes' : 'Main floor', hello: HELLO[t.kind] };
      T.it = AF.addInteract({ x: ix, y: t.y + 1, z: iz, r: t.kind === 'slot' ? 1.0 : 1.8, prio: 1.4,
        label: (t.kind === 'slot' ? 'Play the slots' : 'Play ' + NAME[t.kind].toLowerCase()) + ' \u00b7 ' + cash(R.min) + '\u2013' + cash(R.max),
        can: () => AF.mode === 'walk' && !CZ.g && (!CZ.can || CZ.can(T)), act: () => CZ.open(T) });
      CZ.tables.push(T);
    }
  });
  CZ.rules = { bjVal, bacV, bacDraw, rlPay, slotPay, SW };

  // ---------------------------------------------------------------- tests
  AF.test('casino: house rules pay correctly + a table round trip', () => {
    const C = (r, s = 0) => ({ r, s });
    const bj = bjVal([C(0), C(12)]).v === 21 && bjVal([C(0), C(0), C(8)]).v === 21 && bjVal([C(9), C(5), C(7)]).v === 24 && bjVal([C(0), C(5)]).soft && !bjVal([C(0), C(5), C(9)]).soft;
    const bac = bacV([C(6), C(7)]) === 5 && bacV([C(12), C(0)]) === 1 && !bacDraw(3, 8) && bacDraw(6, 7) && !bacDraw(6, null) && bacDraw(5, null) && !bacDraw(7, 2);
    const rl = rlPay('n17', 17) === 36 && rlPay('red', 0) === 0 && rlPay('d3', 36) === 3 && rlPay('c1', 34) === 3 && rlPay('even', 0) === 0 && rlPay('black', 2) === 2 && rlPay('odd', 0) === 0;
    let rtp = 0; for (let a = 0; a < 6; a++) for (let b = 0; b < 6; b++) for (let c = 0; c < 6; c++) rtp += SW[a] * SW[b] * SW[c] / 13824 * slotPay(a, b, c);
    // bets come off the cash at once and come back on Clear; a blackjack round settles when the player leaves mid-hand
    let flow = false, round = false;
    const T = CZ.tables.find((t) => t.kind === 'roulette'), J = CZ.tables.find((t) => t.kind === 'blackjack'), m0 = AF.money.v;
    if (T && J) {
      AF.money.add(2000);
      CZ.open(T); CZ.chip = 25; CZ.g.place('red'); CZ.g.place('n7'); const staked = m0 + 2000 - AF.money.v; CZ.g.act('clear'); const back = AF.money.v === m0 + 2000; CZ.close();
      flow = staked === 50 && back && !UI.state.casino;
      CZ.open(J); CZ.chip = 25; CZ.g.place('main'); CZ.g.act('deal'); CZ.g.flush(); const g = CZ.g; CZ.close();
      round = g.phase === 'done' && g.hands[0].cards.length >= 2 && g.dealer.length >= 2 && !!g.hands[0].res && !g.busy;
      AF.money.add(m0 - AF.money.v);
    }
    return { ok: bj && bac && rl && Math.abs(rtp - 0.938) < 0.01 && flow && round && CZ.tables.length >= 20, info: `bj ${bj} baccarat ${bac} roulette ${rl} slots ${(rtp * 100).toFixed(1)}% bets ${flow} round ${round} \u00b7 ${CZ.tables.length} tables` };
  });
}
} catch (e) { AF.partError('78-casino.js', e); }
